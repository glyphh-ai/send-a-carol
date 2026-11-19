'use strict';
// song.js : the song. The approved words and the template's music direction go to ElevenLabs' music API, which sings
// them; the audio is then measured (beat.js), made evenly loud and faded at its tail (ffmpeg).
// What is used, as its documentation says (read 2026-11-18; the pages are listed in SPEC.md):
//   POST https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128     header xi-api-key
//   body { model_id, composition_plan: { chunks: [ { text: "[Verse]\nline\nline", duration_ms (3000..120000),
//          positive_styles: [...], negative_styles: [...] } ] } }            -> the audio file
//   A chunk's text may start with a section name in square brackets; at most 30 lines of at most 200 characters.
//   Section durations are always kept by the current music models, so WE know when each sung section starts and
//   ends. The API's word timestamps (with_timestamps on /v1/music/detailed) have no documented shape, so they are
//   not used: the lines of a section are spread evenly across it and nudged to the nearest beat.
//   A plan or prompt with a band's or musician's name, a song title or copyrighted lyrics is refused with
//   bad_composition_plan / bad_prompt (detail.status), with a suggestion (detail.data) unless it was harmful.
// The id of the music model is not written in this repository: it is the setting ELEVEN_MUSIC_MODEL.
const cp = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const beat = require('./beat.js'), CFG = require('./config.js');

const seam = { fetch: null, ffmpeg: process.env.FFMPEG || 'ffmpeg' };
const said = function (msg, code, more) { return Object.assign(new Error(msg), { said: true, code: code || 400 }, more); };
const available = function () { return !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVEN_MUSIC_MODEL) || !!seam.fetch; };

// THE PLAN: an intro, each section of the words as its own chunk, an outro; 20 to 40 seconds in all.
// A line gets two bars (8 beats) where that fits in 40 seconds, otherwise less; nothing is shorter than 3 seconds.
function plan(doc, tpl) {
  const music = doc.music || {}, t = tpl && tpl.music || {}, bpm = Math.max(60, Math.min(180, Math.round(music.bpm || t.bpm || 100))), beatS = 60 / bpm;
  const sections = (doc.lyrics || []).filter(function (s) { return s && s.lines && s.lines.length; }), lines = sections.reduce(function (n, s) { return n + s.lines.length; }, 0);
  const V = CFG.video, intro = Math.max(3, Math.round(4 * beatS * 10) / 10), outro = Math.max(3, Math.round(4 * beatS * 10) / 10);
  let perLine = 8 * beatS;
  const room = V.maxSec - intro - outro, need = V.minSec - intro - outro;
  if (lines * perLine > room) perLine = room / lines;
  if (lines * perLine < need) perLine = need / lines;
  const styles = uniq((music.styles && music.styles.length ? music.styles : t.styles || []).concat([music.voices || t.voices || '', bpm + ' bpm', 'clear lead vocal, every word easy to understand'])).slice(0, 12);
  const negative = uniq((t.negative || []).concat(['spoken word', 'long instrumental solo', 'explicit'])).slice(0, 8);
  const chunks = [{ text: '[Intro]', duration_ms: Math.round(intro * 1000), positive_styles: styles.concat(['short instrumental intro']), negative_styles: negative }];
  let hooks = 0, verses = 0;
  sections.forEach(function (s) {
    const name = s.section === 'hook' ? 'Chorus' + (hooks++ ? ' ' + hooks : '') : 'Verse ' + (++verses);
    chunks.push({ text: '[' + name + ']\n' + s.lines.map(function (l) { return String(l).replace(/[\[\]{}]/g, '').slice(0, 200); }).join('\n'), duration_ms: Math.max(3000, Math.round(s.lines.length * perLine * 1000)), positive_styles: styles, negative_styles: negative, lines: s.lines.length });
  });
  chunks.push({ text: '[Outro]', duration_ms: Math.round(outro * 1000), positive_styles: styles.concat(['gentle ending, final chord rings out']), negative_styles: negative });
  return { bpm: bpm, chunks: chunks, total: chunks.reduce(function (n, c) { return n + c.duration_ms; }, 0) / 1000 };
}
const uniq = function (a) { const seen = {}; return a.map(function (s) { return String(s || '').trim(); }).filter(function (s) { const k = s.toLowerCase(); if (!s || seen[k]) return false; seen[k] = 1; return true; }); };

// ASKING FOR IT. Returns the audio as it came. A refusal of the words is said to the maker; anything else is ours.
async function compose(p) {
  if (!available()) throw said('The music service is not set up.', 503);
  const body = { model_id: process.env.ELEVEN_MUSIC_MODEL || 'test', composition_plan: { chunks: p.chunks.map(function (c) { return { text: c.text, duration_ms: c.duration_ms, positive_styles: c.positive_styles, negative_styles: c.negative_styles }; }) } };
  let r;
  try { r = await (seam.fetch || fetch)('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '', 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(240000) }); }
  catch (e) { throw Object.assign(new Error('the music service could not be reached: ' + e.message), { retry: true }); }
  if (!r.ok) {
    let j = null; try { j = await r.json(); } catch (e) { j = null; }
    const d = j && j.detail, status = d && d.status || '', msg = d && (d.message || (Array.isArray(d) && d[0] && d[0].msg)) || '';
    if (status === 'bad_composition_plan' || status === 'bad_prompt') throw said('The music service would not sing those words as written' + (msg ? ' (' + String(msg).slice(0, 200) + ')' : '') + '. It refuses artists\' names, song titles and lyrics from existing songs. Change the words and try again.', 422, { refusedByMusic: true });
    throw Object.assign(new Error('the music service answered ' + r.status + (status ? ' ' + status : '') + (msg ? ': ' + String(msg).slice(0, 300) : '')), { retry: r.status === 429 || r.status >= 500, status: r.status });
  }
  const audio = Buffer.from(await r.arrayBuffer());
  if (audio.length < 2000) throw Object.assign(new Error('the music service sent no audio'), { retry: true });
  return audio;
}

function run(args, input) {
  return new Promise(function (done, fail) {
    const p = cp.spawn(seam.ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y'].concat(args), { stdio: ['pipe', 'pipe', 'pipe'] }), out = [], err = [];
    p.stdout.on('data', function (c) { out.push(c); }); p.stderr.on('data', function (c) { err.push(c); });
    p.on('error', function (e) { fail(new Error('ffmpeg could not be run: ' + e.message)); });
    p.on('close', function (code) { if (code) fail(new Error('ffmpeg: ' + Buffer.concat(err).toString().trim().slice(-400))); else done(Buffer.concat(out)); });
    p.stdin.on('error', function () { /* it said why on stderr */ });
    p.stdin.end(input || undefined);
  });
}
const pcm = async function (file, rate) { const b = await run(['-i', file, '-ac', '1', '-ar', String(rate), '-f', 's16le', '-']); return new Int16Array(b.buffer, b.byteOffset, Math.floor(b.length / 2)); };

// MEASURING AND FINISHING: the raw audio in, { audio (AAC in .m4a, evenly loud, tail faded), timing, levels } out
async function finish(raw, p, hintBpm) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'carol-song-')), src = path.join(dir, 'raw.mp3'), dst = path.join(dir, 'song.m4a');
  try {
    fs.writeFileSync(src, raw);
    const found = beat.analyse(await pcm(src, 11025), 11025, hintBpm || p.bpm), cap = Math.min(found.duration, CFG.video.hardCapSec), fade = Math.min(1.5, cap / 4);
    if (!(found.duration >= 3)) throw new Error('the song is too short to use (' + found.duration + ' s)');
    await run(['-i', src, '-t', String(cap), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=out:st=' + (cap - fade).toFixed(3) + ':d=' + fade.toFixed(3), '-ar', '44100', '-ac', '2', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', dst]);
    const audio = fs.readFileSync(dst), lv = beat.levels(await pcm(dst, 22050));
    return { audio: audio, levels: lv, timing: layout(p, Object.assign({}, found, { duration: Math.round(cap * 1000) / 1000, beats: found.beats.filter(function (b) { return b < cap; }) })) };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// WHEN EACH LINE IS SUNG: the plan's sections (stretched if the audio came out a little longer or shorter than asked),
// each section's lines spread evenly across it, each line's start moved to the nearest beat when one is within a
// quarter of a beat. Roughly right by design: the service gives no documented word timing.
function layout(p, found) {
  const k = found.duration / p.total, period = 60 / found.bpm, lines = [], sections = [];
  const snap = function (t) { let best = t, d = period / 4; found.beats.forEach(function (b) { if (Math.abs(b - t) < d) { d = Math.abs(b - t); best = b; } }); return best; };
  let at = 0;
  p.chunks.forEach(function (c) {
    const t0 = at * k, t1 = (at + c.duration_ms / 1000) * k; at += c.duration_ms / 1000;
    sections.push({ name: (/^\[([^\]]+)\]/.exec(c.text) || [])[1] || '', t0: Math.round(t0 * 1000) / 1000, t1: Math.round(t1 * 1000) / 1000, lines: c.lines || 0 });
    for (let i = 0; i < (c.lines || 0); i++) { const a = snap(t0 + (t1 - t0) * i / c.lines), b = t0 + (t1 - t0) * (i + 1) / c.lines; lines.push({ t0: Math.round(a * 1000) / 1000, t1: Math.round(Math.max(a + 0.4, b - 0.05) * 1000) / 1000 }); }
  });
  return { v: 1, duration: found.duration, bpm: found.bpm, offset: found.offset, beats: found.beats, intro: sections.length ? sections[0].t1 : 0, lines: lines, sections: sections, confidence: found.confidence, how: 'beats measured from the audio; lines spread evenly inside each sung section' };
}
const cost = function (seconds) { return Math.round(seconds / 60 * CFG.cost.musicPerMinute * 1e6); };   // micro-dollars

module.exports = { plan: plan, compose: compose, finish: finish, layout: layout, cost: cost, available: available, run: run, pcm: pcm, seam: seam };
