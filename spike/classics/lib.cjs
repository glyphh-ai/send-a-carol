'use strict';
// spike/classics/lib.cjs : what the classic-carols spike's scripts share. A SPIKE: nothing here is loaded by the product.
// Reads .env (never prints a value), asks the voice provider for SPEECH (text-to-speech with character timestamps,
// stock voices only), runs ffmpeg, reads and writes wav, and keeps a tally of every paid call in OUT/tally.json.
// The id of the speech model is a setting (ELEVEN_TTS_MODEL), never written in a file; without it the provider's
// default speech model is used.
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const OUT = process.env.CLASSICS_OUT || '/tmp/carol-classics', RATE = 44100;
(function env() { let d = __dirname; for (let i = 0; i < 8; i++) { const f = path.join(d, '.env'); if (fs.existsSync(f)) { fs.readFileSync(f, 'utf8').split('\n').forEach(function (l) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }); return; } d = path.dirname(d); } })();
fs.mkdirSync(path.join(OUT, 'tts'), { recursive: true });

// ----- the tally: every call that costs something is written down -----
const TALLY = path.join(OUT, 'tally.json'), PER_1K = 0.08;   // the published API price of speech per 1,000 characters (the dearer model family)
const tally = function () { try { return JSON.parse(fs.readFileSync(TALLY, 'utf8')); } catch (e) { return { calls: [] }; } };
const note = function (what, more) { const t = tally(); t.calls.push(Object.assign({ at: new Date().toISOString(), what: what }, more)); fs.writeFileSync(TALLY, JSON.stringify(t, null, 1)); };
const spent = function () { const t = tally(), chars = t.calls.reduce(function (n, c) { return n + (c.chars || 0); }, 0); return { calls: t.calls.length, chars: chars, dollars: Math.round(chars / 1000 * PER_1K * 1000) / 1000 }; };

// ----- the stock voices used (the provider's own "premade" voices; never a cloned or community voice) -----
const VOICES = {
  sarah: { id: 'EXAVITQu4vr4xnSDxMaL', what: 'warm adult female', shift: 0 },
  eric: { id: 'cjVigY5qzO86Huf0OWal', what: 'warm adult male (tenor)', shift: -12 },
  laura: { id: 'FGY2WhTYpPnrIDTdsKH5', what: 'bright, characterful female', shift: 0 }
};

// SPEECH with character timestamps. POST /v1/text-to-speech/{voice_id}/with-timestamps -> { audio_base64, alignment:
// { characters, character_start_times_seconds, character_end_times_seconds } }. Every answer is kept on disk by a hash
// of what was asked, so running a script again costs nothing.
async function tts(voice, text, o) {
  o = o || {}; const v = VOICES[voice]; if (!v) throw new Error('no such voice: ' + voice);
  const body = { text: text, voice_settings: { stability: o.stability === undefined ? 0.6 : o.stability, similarity_boost: 0.75, style: 0, speed: o.speed || 1 }, seed: o.seed || 7 };
  if (process.env.ELEVEN_TTS_MODEL) body.model_id = process.env.ELEVEN_TTS_MODEL;
  const key = crypto.createHash('sha1').update(v.id + JSON.stringify(body)).digest('hex').slice(0, 16), base = path.join(OUT, 'tts', voice + '-' + key);
  if (!fs.existsSync(base + '.json')) {
    const t0 = Date.now(), r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + v.id + '/with-timestamps?output_format=mp3_44100_128', { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '', 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
    if (!r.ok) { const said = (await r.text()).slice(0, 500); note('speech REFUSED', { voice: voice, text: text, status: r.status, said: said }); throw new Error('the speech service answered ' + r.status + ': ' + said); }
    const j = await r.json(); fs.writeFileSync(base + '.mp3', Buffer.from(j.audio_base64, 'base64'));
    fs.writeFileSync(base + '.json', JSON.stringify({ text: text, voice: voice, alignment: j.alignment, normalized: j.normalized_alignment }));
    note('speech', { voice: voice, chars: text.length, ms: Date.now() - t0, text: text.slice(0, 80) });
  }
  const j = JSON.parse(fs.readFileSync(base + '.json', 'utf8'));
  return { file: base + '.mp3', alignment: j.alignment, text: text };
}

function ff(args, input) {
  const r = cp.spawnSync(process.env.FFMPEG || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y'].concat(args), { input: input, maxBuffer: 1 << 30 });
  if (r.status) throw new Error('ffmpeg: ' + String(r.stderr).trim().slice(-600));
  return r.stdout;
}
// mono samples as Float32 at a rate
function pcm(file, rate) { const b = ff(['-i', file, '-ac', '1', '-ar', String(rate || RATE), '-f', 'f32le', '-']); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + Math.floor(b.length / 4) * 4)); }
// a 16-bit wav from one channel (mono) or two ([left, right])
function wav(file, ch, rate) {
  const st = Array.isArray(ch), L = st ? ch[0] : ch, R = st ? ch[1] : null, n = L.length, c = st ? 2 : 1, b = Buffer.alloc(44 + n * 2 * c); rate = rate || RATE;
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2 * c, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(c, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2 * c, 28); b.writeUInt16LE(2 * c, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2 * c, 40);
  const put = function (v, at) { b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 32767))), at); };
  for (let i = 0; i < n; i++) { put(L[i], 44 + i * 2 * c); if (R) put(R[i], 46 + i * 4); }
  fs.writeFileSync(file, b); return file;
}
function seconds(file) { const r = cp.spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]); return parseFloat(String(r.stdout)); }
// integrated loudness (LUFS) and true peak, as ffmpeg's own meter (ebur128) reports them
function loudness(file) { const r = cp.spawnSync(process.env.FFMPEG || 'ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { maxBuffer: 1 << 28 }), s = String(r.stderr), tail = s.slice(s.lastIndexOf('Summary:')); return { lufs: parseFloat((/I:\s+(-?[\d.]+) LUFS/.exec(tail) || [])[1]), peak: parseFloat((/Peak:\s+(-?[\d.]+) dBFS/.exec(tail) || [])[1]) }; }
// a finished file: the product's own loudness target (song.js: -14 LUFS, -1.5 dB true peak) and a fade at the tail
function finish(src, dst, fadeSec) {
  const d = seconds(src), f = fadeSec === undefined ? 1.5 : fadeSec, mp3 = /\.mp3$/.test(dst);
  ff(['-i', src, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=out:st=' + (d - f).toFixed(3) + ':d=' + f.toFixed(3), '-ar', '44100', '-ac', '2'].concat(mp3 ? ['-c:a', 'libmp3lame', '-b:a', '192k'] : ['-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'], [dst]));
  return dst;
}
// a seeded random number (so a run can be repeated exactly)
function rng(seed) { let s = (seed || 1) >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

module.exports = { OUT: OUT, RATE: RATE, VOICES: VOICES, tts: tts, ff: ff, pcm: pcm, wav: wav, seconds: seconds, loudness: loudness, finish: finish, note: note, tally: tally, spent: spent, rng: rng, PER_1K: PER_1K };
