'use strict';
// spike/premium/lib.cjs : what the premium spike's scripts share. A SPIKE: nothing here is loaded by the product.
// Reads .env (never prints a value), talks to the voice/music service by plain fetch, runs ffmpeg, and keeps a
// tally of every paid call in OUT/tally.json. The ids of the service's models are settings (environment), never
// written in a file: ELEVEN_STS_MODEL (the voice changer), ELEVEN_MUSIC_MODEL (music, already in .env).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..'), OUT = process.env.PREMIUM_OUT || '/tmp/carol-premium';
fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').forEach(function (l) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
fs.mkdirSync(OUT, { recursive: true });
const API = 'https://api.elevenlabs.io';
const key = function () { return { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' }; };

// ----- the tally: every call that can cost something is written down before it is made -----
const TALLY = path.join(OUT, 'tally.json');
const tally = function () { try { return JSON.parse(fs.readFileSync(TALLY, 'utf8')); } catch (e) { return { calls: [] }; } };
const note = function (what, more) { const t = tally(); t.calls.push(Object.assign({ at: new Date().toISOString(), what: what }, more)); fs.writeFileSync(TALLY, JSON.stringify(t, null, 1)); };

async function get(url) { const r = await fetch(API + url, { headers: key() }); const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch (e) { j = null; } return { status: r.status, json: j, text: text }; }
// what the account has used so far (the service's own counter), so a step's cost can be read as a difference
async function used() { const r = await get('/v1/user/subscription'); if (r.status !== 200) return { status: r.status, said: r.text.slice(0, 300) }; return { tier: r.json.tier, used: r.json.character_count, limit: r.json.character_limit, voiceSlotsUsed: r.json.voice_slots_used, voiceLimit: r.json.voice_limit, canInstantClone: r.json.can_use_instant_voice_cloning, canProClone: r.json.can_use_professional_voice_cloning, voiceAddEditCounter: r.json.voice_add_edit_counter, maxVoiceAddEdits: r.json.max_voice_add_edits, status: r.json.status }; }
// a multipart POST with one file; returns { status, headers, buffer }
async function postFile(url, fields, fileField, file, mime) {
  const fd = new FormData(); Object.keys(fields || {}).forEach(function (k) { fd.append(k, String(fields[k])); });
  fd.append(fileField, new Blob([fs.readFileSync(file)], { type: mime || 'audio/mpeg' }), path.basename(file));
  const t0 = Date.now(), r = await fetch(API + url, { method: 'POST', headers: key(), body: fd, signal: AbortSignal.timeout(300000) }), buffer = Buffer.from(await r.arrayBuffer()), heads = {};
  r.headers.forEach(function (v, k) { heads[k] = v; });
  return { status: r.status, headers: heads, buffer: buffer, ms: Date.now() - t0 };
}

function ff(args, input) {
  const r = cp.spawnSync(process.env.FFMPEG || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y'].concat(args), { input: input, maxBuffer: 1 << 30 });
  if (r.status) throw new Error('ffmpeg: ' + String(r.stderr).trim().slice(-600));
  return r.stdout;
}
// mono samples as Float32 at a rate
function pcm(file, rate) { const b = ff(['-i', file, '-ac', '1', '-ar', String(rate), '-f', 'f32le', '-']); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + Math.floor(b.length / 4) * 4)); }
function seconds(file) { const r = cp.spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]); return parseFloat(String(r.stdout)); }
// integrated loudness (LUFS) and true peak, as ffmpeg's own meter (ebur128) reports them
function loudness(file) { const r = cp.spawnSync(process.env.FFMPEG || 'ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { maxBuffer: 1 << 28 }), s = String(r.stderr), tail = s.slice(s.lastIndexOf('Summary:')); return { lufs: parseFloat((/I:\s+(-?[\d.]+) LUFS/.exec(tail) || [])[1]), peak: parseFloat((/Peak:\s+(-?[\d.]+) dBFS/.exec(tail) || [])[1]), lra: parseFloat((/LRA:\s+(-?[\d.]+) LU/.exec(tail) || [])[1]) }; }

module.exports = { ROOT: ROOT, OUT: OUT, API: API, get: get, used: used, postFile: postFile, ff: ff, pcm: pcm, seconds: seconds, loudness: loudness, note: note, tally: tally, key: key };
