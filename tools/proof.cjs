'use strict';
// tools/proof.cjs : THE REAL END-TO-END RUN (it costs money: real calls to the writing agent and the music service).
// Makes three carols with made-up people and code-drawn placeholder "photos" (test/kit.cjs photo(): never a real
// person), exactly as a maker would, through handle() in-process (no port): draft -> photos -> the agent writes ->
// a credit -> the song -> the video in both shapes. Then copies what was made to OUT and to examples/ (what the
// landing page's hero plays). It can be run again: what is already made is not made (or paid for) twice.
//   node tools/proof.cjs            run (at most MAX_SONGS songs and MAX_AGENT agent calls in all, ever, for this OUT)
//   node tools/proof.cjs --report   only print the tally
// Needs .env (ANTHROPIC_API_KEY, CLAUDE_MODEL, ELEVENLABS_API_KEY, ELEVEN_MUSIC_MODEL). Media goes to OUT/data (local disk).
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process'), { Readable, Writable } = require('stream');
const ROOT = path.join(__dirname, '..'), OUT = process.env.PROOF_DIR || '/tmp/carol-time/proof', MAX_SONGS = 5, MAX_AGENT = 12;
fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').forEach(function (l) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
['R2_ENDPOINT', 'R2_BUCKET', 'DATABASE_URL', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY'].forEach(function (k) { delete process.env[k]; });
Object.assign(process.env, { DATA_DIR: path.join(OUT, 'data'), SESSION_SECRET: 'proof-run-only', NODE_NO_WARNINGS: '1' });
fs.mkdirSync(OUT, { recursive: true });
const S = require('../server.js'), K = require('../test/kit.cjs'), Templates = require('../templates.js'), CFG = require('../config.js');

const UID = 'email:proof@example.test';
const cookie = (function () { const v = Buffer.from(UID).toString('base64url') + '.' + (Date.now() + 864e5); return 'sac=' + v + '.' + crypto.createHmac('sha256', 'proof-run-only').update(v).digest('base64url'); })();
function call(method, url, body, headers) {
  return new Promise(function (done) {
    const buf = Buffer.isBuffer(body), req = Readable.from(body ? [buf ? body : Buffer.from(JSON.stringify(body))] : []);
    Object.assign(req, { method: method, url: url, headers: Object.assign({ host: 'proof', cookie: cookie }, buf ? { 'content-length': String(body.length) } : {}, headers || {}) });
    const parts = [], res = new Writable({ write: function (c, e, next) { parts.push(Buffer.from(c)); next(); } });
    Object.assign(res, { status: 200, heads: {}, headersSent: false, setHeader: function (k, v) { this.heads[k.toLowerCase()] = v; }, writeHead: function (c, h) { this.status = c; this.headersSent = true; Object.assign(this.heads, h || {}); return this; } });
    res.on('finish', function () { const b = Buffer.concat(parts); let j = null; try { j = JSON.parse(b.toString()); } catch (e) { j = null; } done({ status: res.status, json: j, body: b }); });
    S.handle(req, res);
  });
}
const pick = function (occasion, family) { const t = Templates.list.find(function (x) { return x.occasion === occasion && new RegExp(family, 'i').test(x.family + ' ' + ((Templates.families.find(function (f) { return f.id === x.family; }) || {}).name || '')); }); if (!t) throw new Error('no template for ' + occasion + ' / ' + family); return t.id; };
const CAROLS = [
  { slug: 'the-timmermans-2026', template: process.env.PROOF_T1 || pick('christmas', 'cozy|family'), photos: 3, seed: 1,
    answers: { to: 'Grandma June', from: 'The Timmermans', relation: 'grandparents', details: 'Biscuit the dog ate the whole gingerbread house. Theo lost his first tooth. Ada learned to ride her bike without training wheels. We miss your cinnamon rolls.' } },
  { slug: 'for-uncle-dave', template: process.env.PROOF_T2 || pick('christmas', 'funny'), photos: 2, seed: 4,
    answers: { to: 'Uncle Dave', from: 'Maya and Jo', relation: 'family', details: 'He has worn the same reindeer sweater since 1998. He burns the turkey every year and says it is "caramelised". He is undefeated at charades.', must: 'undefeated at charades' } },
  { slug: 'nora-is-thirty', template: process.env.PROOF_T3 || pick('birthday', '.'), photos: 4, seed: 7,
    answers: { to: 'Nora', from: 'Sam', relation: 'partner', details: 'She is turning thirty. Her sourdough starter is named Clint. She runs at six in the morning, even in the rain. She says she hates surprise parties; this one is the exception.' } },
];
const counts = async function () { return { songs: (await S.db.get("SELECT COUNT(*) AS n FROM ledger WHERE kind = 'music'")).n, agent: (await S.db.get("SELECT COUNT(*) AS n FROM ledger WHERE kind = 'text'")).n }; };
async function tally() {
  const rows = await S.db.all('SELECT c.slug, l.kind, COUNT(*) AS calls, SUM(l.tok_in) AS tin, SUM(l.tok_out) AS tout, SUM(l.units) AS units, SUM(l.micros) AS micros FROM ledger l LEFT JOIN cards c ON c.id = l.card GROUP BY c.slug, l.kind ORDER BY c.slug, l.kind');
  console.log('\nTALLY (from the ledger)'); let total = 0;
  rows.forEach(function (r) { total += r.micros; console.log('  ' + String(r.slug || '(no card name)').padEnd(22) + r.kind.padEnd(7) + String(r.calls).padStart(3) + ' call(s)  tokens in/out ' + String(r.tin).padStart(6) + '/' + String(r.tout).padStart(6) + '  units ' + (Math.round(r.units * 10) / 10 + '').padStart(6) + '  $' + (r.micros / 1e6).toFixed(4)); });
  const c = await counts(); console.log('  songs asked of the music service: ' + c.songs + ' (cap ' + MAX_SONGS + ')   agent calls: ' + c.agent + ' (cap ' + MAX_AGENT + ')   total $' + (total / 1e6).toFixed(4));
}
(async function () {
  await S.ready;
  if (process.argv.indexOf('--report') >= 0) { await tally(); process.exit(0); }
  await S.db.run('INSERT INTO users (id, email, name, created) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING', [UID, 'proof@example.test', 'Proof run', Date.now()]);
  await S.grant(UID, 3, 'the proof run', 'proof:credits');
  const made = [];
  for (const c of CAROLS) {
    let row = await S.db.get('SELECT id, state FROM cards WHERE slug = ?', [c.slug]), id = row && row.id, r;
    if (!id) {
      r = await call('POST', '/api/cards', { template: c.template, answers: c.answers }); if (r.status !== 200) throw new Error('card: ' + r.body); id = r.json.card.id;
      for (let i = 0; i < c.photos; i++) { r = await call('POST', '/api/cards/' + id + '/photos', K.photo(c.seed + i, 1200, 1600), { 'content-type': 'image/png' }); if (r.status !== 200) throw new Error('photo: ' + r.body); }
      if ((await counts()).agent >= MAX_AGENT) throw new Error('the agent-call cap is reached');
      console.log('[' + c.slug + '] the agent is writing (template ' + c.template + ')');
      r = await call('POST', '/api/cards/' + id + '/write', {}); if (r.status !== 200 || !r.json.ok) throw new Error('write: ' + r.body);
      r = await call('POST', '/api/cards/' + id + '/save', { slug: c.slug }); if (r.status !== 200) throw new Error('name: ' + r.body);
    }
    let card = (await call('GET', '/api/cards/' + id)).json.card;
    if (c.ask && !card.rewrites && !card.takes.length) { console.log('[' + c.slug + '] another take: ' + c.ask); r = await call('POST', '/api/cards/' + id + '/write', { ask: c.ask }); if (r.status !== 200) throw new Error('rewrite: ' + r.body); card = r.json.card; }
    if (!card.takes.length) {
      if ((await counts()).songs >= MAX_SONGS) throw new Error('the song cap is reached');
      console.log('[' + c.slug + '] making the song and the video'); const t0 = Date.now();
      r = await call('POST', '/api/cards/' + id + '/song', {}); if (r.status !== 200) throw new Error('song: ' + r.body);
      await S.jobs.drain(); console.log('[' + c.slug + '] done in ' + Math.round((Date.now() - t0) / 100) / 10 + ' s');
    } else if (card.state !== 'ready' || process.argv.indexOf('--rerender') >= 0) { r = await call('POST', '/api/cards/' + id + '/render', {}); await S.jobs.drain(); }
    card = (await call('GET', '/api/cards/' + id)).json.card;
    const job = await S.db.get('SELECT state, error, tries FROM jobs WHERE card = ? ORDER BY created DESC LIMIT 1', [id]);
    if (card.state !== 'ready') throw new Error('[' + c.slug + '] is not ready: ' + JSON.stringify(job));
    const dir = path.join(OUT, c.slug); fs.mkdirSync(dir, { recursive: true });
    for (const f of ['story.mp4', 'square.mp4', 'poster.jpg', 'poster-story.jpg', 'preview.gif', 'song.m4a']) fs.writeFileSync(path.join(dir, f), (await call('GET', '/' + c.slug + '/' + f)).body);
    const s = card.script, take = await S.db.get('SELECT seconds, peak, rms, timing FROM takes WHERE id = ?', [card.take]), timing = JSON.parse(take.timing);
    fs.writeFileSync(path.join(dir, 'carol.json'), JSON.stringify({ slug: c.slug, template: card.template, occasion: card.occasion, answers: card.answers, script: s, take: { seconds: take.seconds, peak: take.peak, rms: take.rms, bpm: timing.bpm, offset: timing.offset, confidence: timing.confidence, sections: timing.sections, lines: timing.lines } }, null, 1));
    made.push({ slug: c.slug, title: s.title, occasion: card.occasion, template: card.template, to: card.answers.to, from: card.answers.from, lyrics: s.lyrics.reduce(function (a, x) { return a.concat(x.lines); }, []) });
    console.log('[' + c.slug + '] ' + s.title + '\n    ' + s.lyrics.map(function (x) { return x.lines.join('\n    '); }).join('\n\n    ') + '\n    (' + s.greeting + ' / ' + s.signoff + ')');
  }
  // what the landing page's hero plays: smaller copies of the story videos, and their posters
  const ex = path.join(ROOT, 'examples'); fs.mkdirSync(ex, { recursive: true });
  for (const m of made) {
    const src = path.join(OUT, m.slug);
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(src, 'story.mp4'), '-vf', 'scale=540:960', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '112k', '-movflags', '+faststart', path.join(ex, m.slug + '.mp4')]); if (r.status) throw new Error('ffmpeg: ' + r.stderr);
    cp.spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(src, 'poster-story.jpg'), '-vf', 'scale=540:960', '-q:v', '4', path.join(ex, m.slug + '.jpg')]);
    Object.assign(m, { poster: '/examples/' + m.slug + '.jpg', video: '/examples/' + m.slug + '.mp4' });
  }
  fs.writeFileSync(path.join(ex, 'examples.json'), JSON.stringify({ note: 'Made by tools/proof.cjs with made-up people and code-drawn placeholder photos.', examples: made }, null, 1) + '\n');
  await tally(); process.exit(0);
})().catch(function (e) { console.error('PROOF STOPPED: ' + e.message); process.exit(1); });
