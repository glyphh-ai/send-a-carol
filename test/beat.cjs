'use strict';
// node test/beat.cjs
// The beat finder (beat.js) and the song's plan, layout, asking and finishing (song.js), checked on sound made here:
// click tracks at known tempos as Int16Array samples (a decaying low thump on each beat, a quiet tone and a little
// noise from a seeded generator), and the kit's fake mp3 for song.finish. No network, no server, no port.
const assert = require('node:assert');
const beat = require('../beat.js'), song = require('../song.js'), CFG = require('../config.js'), K = require('./kit.cjs');

let checks = 0;
const ok = function (v, msg) { checks++; assert.ok(v, msg); }, eq = function (a, b, msg) { checks++; assert.strictEqual(a, b, msg); };
const head = function (s) { console.log('  ' + s); };
const RATE = 11025;

// a click track: beats at first + k * (60 / bpm); thump = 0.8 sin(2 pi 90 t) e^(-30 t), tone 0.05 at 220 Hz, noise 0.01
function track(bpm, seconds, first, seed) {
  const n = Math.round(seconds * RATE), out = new Int16Array(n), period = 60 / bpm;
  let s = seed || 7; const rnd = function () { s = (s * 16807) % 2147483647; return s / 2147483647 - 0.5; };
  for (let i = 0; i < n; i++) {
    const t = i / RATE; let since = (t - first) % period; if (since < 0) since += period;
    const thump = t >= first - period ? 0.8 * Math.sin(2 * Math.PI * 90 * since) * Math.exp(-30 * since) : 0;
    const x = thump + 0.05 * Math.sin(2 * Math.PI * 220 * t) + 0.02 * rnd();
    out[i] = Math.max(-32767, Math.min(32767, Math.round(x * 32767)));
  }
  return out;
}
// how far two times are apart on a circle of one period
const apart = function (a, b, period) { let d = Math.abs(a - b) % period; if (d > period / 2) d = period - d; return d; };

(async function () {
  // ---------- beat.analyse ----------
  head('beat.analyse: tempo and phase of click tracks');
  const FIRSTS = { 84: 0.31, 100: 0.12, 120: 0.2, 152: 0.07 };
  for (const bpm of [84, 100, 120, 152]) {
    const secs = 30, first = FIRSTS[bpm], x = track(bpm, secs, first, bpm), period = 60 / bpm;
    for (const hint of [0, bpm, bpm * 2, Math.round(bpm * 1.06)]) {
      const r = beat.analyse(x, RATE, hint), what = bpm + ' bpm, hint ' + (hint || 'none') + ': ';
      ok(Math.abs(r.bpm - bpm) / bpm <= 0.01, what + 'found ' + r.bpm + ' bpm');
      ok(apart(r.offset, first, period) <= 0.04, what + 'first beat at ' + r.offset + ' s, the track\'s is at ' + first + ' (mod ' + period.toFixed(3) + ')');
      ok(r.offset >= 0 && r.offset < 60 / r.bpm + 0.001, what + 'the first beat is inside the first period (' + r.offset + ')');
      eq(r.duration, secs, what + 'duration');
      ok(r.beats.length >= Math.floor(secs / period) - 1 && r.beats.length <= Math.ceil(secs / period) + 1, what + r.beats.length + ' beats in ' + secs + ' s');
      ok(r.beats[0] < 60 / r.bpm + 0.001 && r.beats[r.beats.length - 1] > secs - 60 / r.bpm - 0.002 && r.beats[r.beats.length - 1] < secs, what + 'the beats cover the whole duration');
      let worst = 0; for (let i = 1; i < r.beats.length; i++) worst = Math.max(worst, Math.abs(r.beats[i] - r.beats[i - 1] - 60 / r.bpm));
      ok(worst <= 0.0021, what + 'the period is constant (worst step off by ' + worst.toFixed(4) + ' s)');
      // every beat lands on a thump, the last ones too (no drift over thirty seconds)
      ok(apart(r.beats[r.beats.length - 1], first, period) <= 0.06, what + 'the last beat is still on a thump (' + apart(r.beats[r.beats.length - 1], first, period).toFixed(3) + ' s off)');
      ok(r.confidence > 0 && r.confidence <= 1, what + 'confidence ' + r.confidence);
    }
  }
  // Float32 samples are read the same way
  { const i16 = track(120, 20, 0.2, 3), f32 = Float32Array.from(i16, function (v) { return v / 32768; }), a = beat.analyse(i16, RATE, 120), b = beat.analyse(f32, RATE, 120);
    ok(Math.abs(a.bpm - b.bpm) < 0.2 && Math.abs(a.offset - b.offset) < 0.01, 'Float32 samples give the same answer as Int16'); }
  // music that starts late: `start` says where
  { const x = track(100, 20, 0.12, 5); for (let i = 0; i < 2 * RATE; i++) x[i] = 0; const r = beat.analyse(x, RATE, 100);
    ok(r.start >= 1.9 && r.start <= 2.2, 'the start of the music is found (' + r.start + ' s)'); ok(Math.abs(r.bpm - 100) <= 1, 'and its tempo (' + r.bpm + ')'); }

  head('beat.analyse: silence');
  { let r; assert.doesNotThrow(function () { r = beat.analyse(new Int16Array(10 * RATE), RATE, 96); }); checks++;
    eq(r.bpm, 96, 'silence with a hint: the hint\'s tempo'); eq(r.confidence, 0, 'silence: no confidence'); eq(r.duration, 10, 'silence: duration');
    eq(r.beats.length, 16, 'silence: the hint\'s grid (16 beats in 10 s at 96)'); ok(Math.abs(r.beats[1] - r.beats[0] - 0.625) < 0.002, 'silence: the hint\'s period');
    const none = beat.analyse(new Int16Array(10 * RATE), RATE); eq(none.bpm, 100, 'silence, no hint: 100'); ok(none.beats.length > 0, 'silence, no hint: a grid');
    const f = beat.analyse(new Float32Array(5 * RATE), RATE, 120); eq(f.bpm, 120, 'silent Float32');
    let e; assert.doesNotThrow(function () { e = beat.analyse(new Int16Array(0), RATE, 100); }); checks++; eq(e.beats.length, 0, 'no samples: no beats, no throw'); }

  head('beat.levels');
  { const n = RATE * 2, full = new Int16Array(n), half = new Float32Array(n);
    for (let i = 0; i < n; i++) { full[i] = Math.round(32767 * Math.sin(2 * Math.PI * 441 * i / RATE)); half[i] = 0.5 * Math.sin(2 * Math.PI * 441 * i / RATE); }
    const a = beat.levels(full), b = beat.levels(half), z = beat.levels(new Int16Array(1000)), none = beat.levels(new Int16Array(0));
    ok(Math.abs(a.peak) <= 0.1, 'a full-scale sine peaks at 0 dBFS (' + a.peak + ')'); ok(Math.abs(a.rms + 3.01) <= 0.1, 'and its RMS is -3 dBFS (' + a.rms + ')');
    ok(Math.abs(b.peak + 6.02) <= 0.1, 'half scale (Float32): peak -6 (' + b.peak + ')'); ok(Math.abs(b.rms + 9.03) <= 0.1, 'half scale: RMS -9 (' + b.rms + ')');
    eq(z.peak, -120, 'silence: peak -120'); eq(z.rms, -120, 'silence: RMS -120'); eq(none.peak, -120, 'no samples: -120'); }

  // ---------- song.plan ----------
  head('song.plan');
  const WORDS = ['The lights are up along the street tonight', 'And every window has a little glow', 'We saved a seat for you beside the fire', 'And all the stories only we would know', 'So here is a carol, made for you', 'Sing it loud, the whole way through', 'One more line to carry on the tune', 'And another for the afternoon', 'Nine is nearly at the end', 'Ten for you, my dearest friend'];
  const doc = function (lines, bpm, cut) { const all = WORDS.slice(0, lines), at = cut || Math.min(4, lines - 2); return { lyrics: [{ section: 'verse', lines: all.slice(0, at) }, { section: 'hook', lines: all.slice(at) }], music: { styles: ['warm acoustic folk', 'upright piano'], bpm: bpm, voices: 'warm lead vocal', notes: '' } }; };
  for (const lines of [4, 6, 8, 10]) for (const bpm of [70, 100, 150]) {
    const p = song.plan(doc(lines, bpm), null), what = lines + ' lines at ' + bpm + ': ';
    ok(p.total >= CFG.video.minSec && p.total <= CFG.video.maxSec, what + 'total ' + p.total + ' s is ' + CFG.video.minSec + ' to ' + CFG.video.maxSec);
    eq(p.bpm, bpm, what + 'bpm'); eq(p.chunks.length, 4, what + 'intro, verse, chorus, outro');
    eq(Math.round(p.chunks.reduce(function (n, c) { return n + c.duration_ms; }, 0)), Math.round(p.total * 1000), what + 'total is the chunks\' sum');
    let sung = 0, textLines = 0;
    p.chunks.forEach(function (c, i) {
      ok(Number.isInteger(c.duration_ms) && c.duration_ms >= 3000 && c.duration_ms <= 120000, what + 'chunk ' + i + ' lasts ' + c.duration_ms + ' ms');
      ok(/^\[[A-Z][A-Za-z0-9 ]*\](\n|$)/.test(c.text), what + 'chunk ' + i + ' starts with a [Section] name');
      const ls = c.text.split('\n'); textLines += ls.length; sung += c.lines || 0;
      ok(ls.every(function (l) { return l.length <= 200; }), what + 'no line over 200 characters');
      ok(c.positive_styles.indexOf(bpm + ' bpm') >= 0, what + 'chunk ' + i + '\'s styles carry the tempo');
      ok(Array.isArray(c.negative_styles) && c.negative_styles.length > 0 && c.positive_styles.every(function (s) { return typeof s === 'string' && s; }), what + 'styles are words');
    });
    eq(sung, lines, what + 'every line is in a chunk'); ok(textLines <= 30, what + textLines + ' lines of text (30 at most)');
    eq(p.chunks[0].text, '[Intro]', what + 'intro'); eq(p.chunks[3].text, '[Outro]', what + 'outro'); ok(/^\[Verse 1\]\n/.test(p.chunks[1].text) && /^\[Chorus\]\n/.test(p.chunks[2].text), what + 'sections are named');
  }
  // one line to a section (the most chunks there can be), still inside the limits
  for (const bpm of [60, 70, 100, 150, 180]) {
    const p = song.plan({ lyrics: WORDS.map(function (l, i) { return { section: i % 2 ? 'hook' : 'verse', lines: [l] }; }), music: { bpm: bpm, styles: [] } }, null);
    ok(p.total >= 20 && p.total <= 40.0005, 'ten sections of one line at ' + bpm + ': ' + p.total + ' s'); ok(p.chunks.every(function (c) { return c.duration_ms >= 3000; }), 'and no chunk under 3 s');
    eq(new Set(p.chunks.map(function (c) { return c.text.split('\n')[0]; })).size, p.chunks.length, 'every section has its own name at ' + bpm);
  }
  { // what a maker typed cannot become a section, and cannot break the limits
    const p = song.plan({ lyrics: [{ section: 'verse', lines: ['[Chorus] sing {this} [loud]', ']]] [[[', 'x'.repeat(300) + ' [Outro]', 'A plain line'] }, { section: 'hook', lines: ['{Bridge} two', '[Verse 9]'] }, { section: 'hook', lines: [] }, null], music: { bpm: 999, styles: ['A', 'a', ' a ', 'b'], voices: 'two voices' } }, { music: { bpm: 100, negative: ['metal'] } });
    eq(p.bpm, 180, 'a tempo out of range is brought to 180'); eq(song.plan({ lyrics: [], music: { bpm: 5 } }).bpm, 60, 'and to 60 from below');
    eq(p.chunks.length, 4, 'empty and missing sections are left out');
    p.chunks.forEach(function (c) { const ls = c.text.split('\n'); ok(!/[\[\]{}]/.test(ls.slice(1).join('\n')), 'no bracket from a maker\'s line survives: ' + JSON.stringify(ls.slice(1).join(' / ').slice(0, 60))); ok(/^\[(Intro|Verse 1|Chorus|Outro)\]$/.test(ls[0]), 'the section name is ours: ' + ls[0]); ok(ls.every(function (l) { return l.length <= 200; }), 'a 300-character line is cut to 200'); });
    eq(p.chunks[1].positive_styles.filter(function (s) { return s.toLowerCase() === 'a'; }).length, 1, 'styles are not repeated'); ok(p.chunks[1].positive_styles.indexOf('two voices') >= 0, 'the voices are in the styles'); ok(p.chunks[1].negative_styles.indexOf('metal') >= 0 && p.chunks[1].negative_styles.indexOf('explicit') >= 0, 'the template\'s and our negative styles');
    ok(p.chunks[1].positive_styles.length <= 12 && p.chunks[1].negative_styles.length <= 8, 'not too many styles');
    const t = song.plan({ lyrics: [{ section: 'verse', lines: WORDS.slice(0, 4) }], music: {} }, { music: { bpm: 96, styles: ['sleigh bells'], voices: 'choir' } });
    eq(t.bpm, 96, 'the template\'s tempo when the script has none'); ok(t.chunks[1].positive_styles.indexOf('sleigh bells') >= 0 && t.chunks[1].positive_styles.indexOf('96 bpm') >= 0, 'and the template\'s styles');
    eq(song.cost(60), Math.round(CFG.cost.musicPerMinute * 1e6), 'a minute of music costs config.cost.musicPerMinute'); eq(song.cost(30), Math.round(CFG.cost.musicPerMinute * 1e6 / 2), 'half a minute, half');
  }

  // ---------- song.layout ----------
  head('song.layout');
  for (const lines of [4, 6, 8, 10]) for (const bpm of [70, 100, 150]) for (const stretch of [1, 0.93, 1.08]) {
    const p = song.plan(doc(lines, bpm), null), dur = Math.round(p.total * stretch * 1000) / 1000, found = beat.grid(bpm, 0.11, dur, 0.8, 0), t = song.layout(p, found), period = 60 / bpm, what = lines + ' lines at ' + bpm + ' x' + stretch + ': ';
    eq(t.lines.length, lines, what + 'one {t0, t1} for each line'); eq(t.sections.length, p.chunks.length, what + 'one section for each chunk'); eq(t.duration, dur, what + 'duration'); eq(t.bpm, found.bpm, what + 'bpm');
    ok(Math.abs(t.sections[t.sections.length - 1].t1 - dur) < 0.002 && t.sections[0].t0 === 0 && t.intro === t.sections[0].t1, what + 'the sections fill the song');
    let prev = -1, good = true, inside = true, k = 0;
    t.lines.forEach(function (l) { if (!(l.t0 > prev && l.t1 > l.t0 && l.t0 >= 0 && l.t1 <= dur + 0.001)) good = false; prev = l.t0; });
    ok(good, what + 'lines increase and are inside the duration ' + JSON.stringify(t.lines));
    // a line is inside its section; its start may have been moved to a beat at most a quarter of a beat away
    t.sections.forEach(function (s) { for (let i = 0; i < s.lines; i++, k++) { const l = t.lines[k]; if (!(l.t0 >= s.t0 - period / 4 - 0.001 && l.t0 < s.t1 && l.t1 <= s.t1 + 0.001)) inside = false; } });
    ok(inside, what + 'each line is inside its section'); eq(k, lines, what + 'sections count the lines');
    // a line starts on a beat whenever one was within a quarter of a beat of its even place
    let loose = 0; t.lines.forEach(function (l) { const near = Math.min.apply(null, found.beats.map(function (b) { return Math.abs(b - l.t0); })); if (near > 0.0015 && near < period / 4 - 0.002) loose++; });
    eq(loose, 0, what + 'a line start near a beat is on the beat');
  }

  // ---------- song.compose ----------
  head('song.compose');
  const reply = function (code, obj, buf) { return { ok: code < 300, status: code, json: async function () { if (obj === undefined) throw new Error('not json'); return obj; }, arrayBuffer: async function () { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length); } }; };
  const P = song.plan(doc(6, 100), null), asked = [];
  process.env.ELEVENLABS_API_KEY = 'test-music-key'; process.env.ELEVEN_MUSIC_MODEL = 'test';
  const thrown = async function (answer) { song.seam.fetch = async function (url, o) { asked.push({ url: url, o: o }); if (answer instanceof Error) throw answer; return answer; }; try { await song.compose(P); } catch (e) { return e; } return null; };
  { const e = await thrown(reply(422, { detail: { status: 'bad_composition_plan', message: 'The plan names an artist.', data: { composition_plan_suggestion: { chunks: [] } } } }));
    ok(e && e.said === true, 'a refused plan is said to the maker'); eq(e.refusedByMusic, true, 'and marked refusedByMusic'); ok(!e.retry, 'and not tried again'); eq(e.code, 422, 'as a 422');
    ok(/would not sing/.test(e.message) && /The plan names an artist\./.test(e.message), 'in a sentence with the service\'s reason: ' + e.message);
    const b = await thrown(reply(400, { detail: { status: 'bad_prompt' } })); ok(b && b.said && b.refusedByMusic, 'bad_prompt is a refusal too');
    const e5 = await thrown(reply(500, { detail: { status: 'server_error', message: 'boom' } })); ok(e5 && e5.retry === true && !e5.said, 'a 500 is tried again and not said'); eq(e5.status, 500, 'with its status');
    const e500 = await thrown(reply(503)); ok(e500 && e500.retry === true, 'a 503 with no JSON body is tried again');
    const e429 = await thrown(reply(429, { detail: { status: 'rate_limited' } })); ok(e429 && e429.retry === true, 'a 429 is tried again');
    const e401 = await thrown(reply(401, { detail: { status: 'invalid_api_key' } })); ok(e401 && !e401.retry && !e401.said, 'a 401 is ours: not tried again, not said'); ok(e401.message.indexOf('test-music-key') < 0, 'and the key is not in the message');
    const e422 = await thrown(reply(422, { detail: [{ msg: 'field required' }] })); ok(e422 && !e422.said && !e422.retry, 'a 422 that is not a refusal is ours');
    const net = await thrown(new Error('socket hang up')); ok(net && net.retry === true && !net.said, 'no answer at all is tried again');
    const tiny = await thrown(reply(200, null, Buffer.alloc(100))); ok(tiny && tiny.retry === true, 'an empty file is tried again');
    const fine = Buffer.alloc(5000, 1); song.seam.fetch = async function (url, o) { asked.push({ url: url, o: o }); return reply(200, null, fine); };
    const got = await song.compose(P); ok(Buffer.isBuffer(got) && got.equals(fine), 'the audio comes back as it was sent');
    const last = asked[asked.length - 1], body = JSON.parse(last.o.body);
    eq(last.url, 'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', 'the address asked'); eq(last.o.method, 'POST', 'by POST'); eq(last.o.headers['xi-api-key'], 'test-music-key', 'with the key in xi-api-key');
    eq(body.model_id, 'test', 'the model is the setting'); eq(body.composition_plan.chunks.length, P.chunks.length, 'every chunk is sent');
    ok(body.composition_plan.chunks.every(function (c) { return Object.keys(c).sort().join() === 'duration_ms,negative_styles,positive_styles,text'; }), 'a chunk is text, duration_ms and the two style lists, nothing else');
    const keep = { k: process.env.ELEVENLABS_API_KEY }; delete process.env.ELEVENLABS_API_KEY; song.seam.fetch = null; eq(song.available(), false, 'no key: not available');
    let off = null; try { await song.compose(P); } catch (e2) { off = e2; } ok(off && off.said && off.code === 503, 'and asking says it is not set up'); process.env.ELEVENLABS_API_KEY = keep.k;
  }

  // ---------- song.finish ----------
  head('song.finish (the kit\'s fake song, through ffmpeg)');
  for (const bpm of [100, 126]) {
    const F = K.fakes(), p = song.plan(doc(6, bpm), null), raw = F.song(Math.round(p.total * 10) / 10, bpm), fin = await song.finish(raw, p, bpm), what = bpm + ' bpm: ';
    eq(fin.audio.toString('latin1', 4, 8), 'ftyp', what + 'the finished song is an MP4 audio file'); ok(fin.audio.length > 20000, what + 'of a real size (' + fin.audio.length + ' bytes)');
    ok(fin.levels.rms > -40, what + 'not silent (RMS ' + fin.levels.rms + ' dBFS)'); ok(fin.levels.peak <= -0.5, what + 'not clipped (peak ' + fin.levels.peak + ' dBFS)'); ok(fin.levels.peak > -20, what + 'and loud enough (peak ' + fin.levels.peak + ')');
    ok(Math.abs(fin.timing.bpm - bpm) / bpm <= 0.01, what + 'its measured tempo is ' + fin.timing.bpm);
    ok(apart(fin.timing.offset, 0.25, 60 / bpm) <= 0.05, what + 'its beats are where the fake put them (' + fin.timing.offset + ', want 0.25 mod ' + (60 / bpm).toFixed(3) + ')');
    ok(Math.abs(fin.timing.duration - p.total) <= 0.3, what + 'it lasts what was asked (' + fin.timing.duration + ' of ' + p.total + ')'); ok(fin.timing.duration <= CFG.video.hardCapSec, what + 'never over the hard cap');
    eq(fin.timing.lines.length, 6, what + 'six lines timed'); eq(fin.timing.v, 1, what + 'timing version'); ok(fin.timing.beats.length > 20 && fin.timing.beats.every(function (b) { return b < fin.timing.duration; }), what + 'beats inside the song');
    // the tail fades: the last 150 ms are much quieter than the middle
    const fs = require('fs'), os = require('os'), path = require('path'), tmp = path.join(os.tmpdir(), 'sac-beat-test-' + process.pid + '.m4a'); fs.writeFileSync(tmp, fin.audio);
    try { const pcm = await song.pcm(tmp, 22050), mid = beat.levels(pcm.subarray(pcm.length >> 1, (pcm.length >> 1) + 22050 * 2)), tail = beat.levels(pcm.subarray(pcm.length - 3300));
      ok(tail.rms < mid.rms - 12, what + 'the tail is faded (middle ' + mid.rms + ', last 150 ms ' + tail.rms + ' dBFS)');
      ok(Math.abs(pcm.length / 22050 - fin.timing.duration) < 0.15, what + 'the file lasts what the timing says'); } finally { fs.rmSync(tmp, { force: true }); }
  }
  { let e = null; try { await song.finish(Buffer.from('this is not audio at all, not even nearly'), P, 100); } catch (x) { e = x; } ok(e && !e.said, 'garbage instead of audio throws (ours, not said)');
    const F = K.fakes(); let short = null; try { await song.finish(F.song(1.5, 100), P, 100); } catch (x) { short = x; } ok(short && /too short/.test(short.message), 'a song under 3 s is refused'); }

  console.log('OK beat (' + checks + ' checks)');
  process.exit(0);
})().catch(function (e) { console.error('FAILED beat:', e && e.stack || e); process.exit(1); });
