'use strict';
// marketing/instagram/make-cards.cjs : the eight real carols the two Instagram ads cut from (it costs money: real
// calls to the writing agent and the music service). Made exactly as a maker would, through handle() in-process
// (no port), like tools/proof.cjs: draft -> photos -> the agent writes -> the song -> the video. The photos are
// Pexels stock photos (photos/CREDITS.md); the families' names are made up. It can be run again: what is already
// made is not made (or paid for) twice.
//   node marketing/instagram/make-cards.cjs            run (at most MAX_SONGS songs and MAX_AGENT agent calls, ever, for this OUT)
//   node marketing/instagram/make-cards.cjs --report   only print the tally
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { Readable, Writable } = require('stream');
const HERE = __dirname, ROOT = path.join(HERE, '..', '..'), OUT = process.env.ADS_DIR || '/tmp/carol-time/ads', MAX_SONGS = 8, MAX_AGENT = 10;
fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').forEach(function (l) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
['R2_ENDPOINT', 'R2_BUCKET', 'DATABASE_URL', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY'].forEach(function (k) { delete process.env[k]; });
Object.assign(process.env, { DATA_DIR: path.join(OUT, 'data'), SESSION_SECRET: 'ads-run-only', NODE_NO_WARNINGS: '1' });
fs.mkdirSync(OUT, { recursive: true });
const S = require(path.join(ROOT, 'server.js'));

const UID = 'email:ads@example.test';
const cookie = (function () { const v = Buffer.from(UID).toString('base64url') + '.' + (Date.now() + 864e5); return 'sac=' + v + '.' + crypto.createHmac('sha256', 'ads-run-only').update(v).digest('base64url'); })();
function call(method, url, body, headers) {
  return new Promise(function (done) {
    const buf = Buffer.isBuffer(body), req = Readable.from(body ? [buf ? body : Buffer.from(JSON.stringify(body))] : []);
    Object.assign(req, { method: method, url: url, headers: Object.assign({ host: 'ads', cookie: cookie }, buf ? { 'content-length': String(body.length) } : {}, headers || {}) });
    const parts = [], res = new Writable({ write: function (c, e, next) { parts.push(Buffer.from(c)); next(); } });
    Object.assign(res, { status: 200, heads: {}, headersSent: false, setHeader: function (k, v) { this.heads[k.toLowerCase()] = v; }, writeHead: function (c, h) { this.status = c; this.headersSent = true; Object.assign(this.heads, h || {}); return this; } });
    res.on('finish', function () { const b = Buffer.concat(parts); let j = null; try { j = JSON.parse(b.toString()); } catch (e) { j = null; } done({ status: res.status, json: j, body: b }); });
    S.handle(req, res);
  });
}
// [photo id, note]
const CAROLS = [
  // Christmas: the Pembertons (Mom Claire, Dad Ben, Theo who is three, Marshmallow the white fluffy dog)
  { slug: 'pemberton-theo', ad: 'christmas', template: 'snow-day', photos: [[5860105, 'Theo, Mom, Dad and Marshmallow by the tree'], [5860011, 'Theo and Mom with Marshmallow']],
    answers: { to: 'Theo', from: 'Mom and Dad', relation: 'son, he is three', details: 'Theo is three. He sits under the tree every morning to count the presents. He tries to feed his toast to Marshmallow, our big white fluffy dog. He calls the tree lights "the sparkles".' } },
  { slug: 'pemberton-marshmallow', ad: 'christmas', template: 'paws-and-claus', photos: [[5860026, 'Marshmallow in his Christmas wreath with Theo and Mom'], [5859857, 'Mom and Dad on the rug with Marshmallow']],
    answers: { to: 'Marshmallow', from: 'Theo, Mom and Dad', relation: 'our dog', details: 'Marshmallow is our big white fluffy dog. He wore a Christmas wreath like a collar for the family photo and looked very proud. He naps under the tree and sheds white fur on every present.' } },
  { slug: 'pemberton-mom', ad: 'christmas', template: 'cozy-mantel', photos: [[5860019, 'Mom and Theo by the tree with Marshmallow'], [5860050, 'All of us on the rug']],
    answers: { to: 'Mom', from: 'Ben and Theo', relation: 'wife and mom', details: 'Claire (Mom) decorated the whole tree in white and gold. She makes cocoa every Sunday in December. She laughs at all of Dad\'s jokes, even the bad ones. Theo says she gives the best hugs.' } },
  { slug: 'pemberton-dad', ad: 'christmas', template: 'naughty-or-nice', photos: [[5860043, 'Dad lifting Theo up high'], [5860044, 'Dad, Theo and Mom with Marshmallow']],
    answers: { to: 'Dad', from: 'Claire and Theo', relation: 'husband and dad', details: 'Ben (Dad) ate the cookies we left out for Santa and blamed the dog. He lifts Theo up to the ceiling ten times a day. He hums carols all December and never knows the words.' } },
  // Thanksgiving: the Whitfields (Grandma Rose and Grandpa Hank, Mom Anna, Dad Mark, Ruby and Leo)
  { slug: 'whitfield-grandparents', ad: 'thanksgiving', template: 'thanksgiving-grandma-and-grandpa-in-the-dining-room', photos: [[5591206, 'Grandpa passing the turkey'], [5591173, 'Everyone at the big table']],
    answers: { to: 'Grandma Rose and Grandpa Hank', from: 'Anna, Mark, Ruby and Leo', relation: 'grandparents', details: 'Every Thanksgiving is at their house, at the big wooden table. Grandpa Hank tells the same three jokes every year and we still laugh. Grandma Rose makes sure nobody leaves hungry.' } },
  { slug: 'whitfield-mom', ad: 'thanksgiving', template: 'thanksgiving-kitchen-brigade-in-the-dining-room-at-dinne', photos: [[5591233, 'Mom carving at the table'], [5591232, 'Mom serving Leo first']],
    answers: { to: 'Mom', from: 'Mark, Ruby and Leo', relation: 'wife and mom', details: 'Anna (Mom) roasted the bird and carved it herself. She always serves Leo first because he cannot wait. She was up at six to start cooking and still danced in the kitchen.' } },
  { slug: 'whitfield-kids', ad: 'thanksgiving', template: 'thanksgiving-turkeys-in-the-barn-at-the-barn-dance', photos: [[5591231, 'Ruby reaching for the drumstick'], [5591182, 'Leo, Mom, Dad and Ruby']],
    answers: { to: 'Ruby and Leo', from: 'Grandma Rose and Grandpa Hank', relation: 'grandchildren', details: 'Ruby (she has big curly hair) always calls dibs on the drumstick. Leo is four and eats only the rolls. They set the table all by themselves this year.' } },
  { slug: 'whitfield-dad', ad: 'thanksgiving', template: 'thanksgiving-squirrels-in-the-autumn-park-at-dusk', photos: [[5591212, 'Dad, Mom, Leo and Ruby'], [5591189, 'Dad and Grandpa at the table']],
    answers: { to: 'Dad', from: 'Anna, Ruby and Leo', relation: 'husband and dad', details: 'Mark (Dad) is in charge of the mashed potatoes and makes far too many. He gives a little thank-you speech before dinner and gets a bit teary every year. He does all the dishes after.' } },
];
const counts = async function () { return { songs: (await S.db.get("SELECT COUNT(*) AS n FROM ledger WHERE kind = 'music'")).n, agent: (await S.db.get("SELECT COUNT(*) AS n FROM ledger WHERE kind = 'text'")).n }; };
async function tally() {
  const rows = await S.db.all('SELECT c.slug, l.kind, COUNT(*) AS calls, SUM(l.units) AS units, SUM(l.micros) AS micros FROM ledger l LEFT JOIN cards c ON c.id = l.card GROUP BY c.slug, l.kind ORDER BY c.slug, l.kind');
  console.log('\nTALLY (from the ledger)'); let total = 0;
  rows.forEach(function (r) { total += r.micros; console.log('  ' + String(r.slug || '(no card name)').padEnd(26) + r.kind.padEnd(7) + String(r.calls).padStart(3) + ' call(s)  units ' + (Math.round(r.units * 10) / 10 + '').padStart(6) + '  $' + (r.micros / 1e6).toFixed(4)); });
  const c = await counts(); console.log('  songs: ' + c.songs + ' (cap ' + MAX_SONGS + ')   agent calls: ' + c.agent + ' (cap ' + MAX_AGENT + ')   total $' + (total / 1e6).toFixed(4));
}
(async function () {
  await S.ready;
  if (process.argv.indexOf('--report') >= 0) { await tally(); process.exit(0); }
  await S.db.run('INSERT INTO users (id, email, name, created) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING', [UID, 'ads@example.test', 'Ads run', Date.now()]);
  await S.grant(UID, CAROLS.length, 'the ads run', 'ads:credits');
  await S.db.run('UPDATE users SET paid = 1 WHERE id = ?', [UID]);
  const only = process.argv.slice(2).filter(function (a) { return !/^--/.test(a); });
  for (const c of CAROLS) {
    if (only.length && only.indexOf(c.slug) < 0) continue;
    let row = await S.db.get('SELECT id FROM cards WHERE slug = ?', [c.slug]), id = row && row.id, r;
    if (!id) {
      r = await call('POST', '/api/cards', { template: c.template, answers: c.answers }); if (r.status !== 200) throw new Error('card: ' + r.body); id = r.json.card.id;
      const notes = {};
      for (const p of c.photos) { r = await call('POST', '/api/cards/' + id + '/photos', fs.readFileSync(path.join(HERE, 'photos', 'pexels-' + p[0] + '.jpg')), { 'content-type': 'image/jpeg' }); if (r.status !== 200) throw new Error('photo: ' + r.body); notes[r.json.photo.id] = p[1]; }
      r = await call('POST', '/api/cards/' + id + '/save', { notes: notes }); if (r.status !== 200) throw new Error('notes: ' + r.body);
      if ((await counts()).agent >= MAX_AGENT) throw new Error('the agent-call cap is reached');
      console.log('[' + c.slug + '] the agent is writing (template ' + c.template + ')');
      r = await call('POST', '/api/cards/' + id + '/write', {}); if (r.status !== 200 || !r.json.ok) throw new Error('write: ' + r.body);
      r = await call('POST', '/api/cards/' + id + '/save', { slug: c.slug }); if (r.status !== 200) throw new Error('name: ' + r.body);
    }
    let card = (await call('GET', '/api/cards/' + id)).json.card;
    if (!card.takes.length) {
      if ((await counts()).songs >= MAX_SONGS) throw new Error('the song cap is reached');
      console.log('[' + c.slug + '] making the song and the video'); const t0 = Date.now();
      r = await call('POST', '/api/cards/' + id + '/song', {}); if (r.status !== 200) throw new Error('song: ' + r.body);
      await S.jobs.drain(); console.log('[' + c.slug + '] done in ' + Math.round((Date.now() - t0) / 100) / 10 + ' s');
    }
    card = (await call('GET', '/api/cards/' + id)).json.card;
    if (card.state !== 'ready') { const job = await S.db.get('SELECT state, error, tries FROM jobs WHERE card = ? ORDER BY created DESC LIMIT 1', [id]); throw new Error('[' + c.slug + '] is not ready: ' + JSON.stringify(job)); }
    const dir = path.join(OUT, c.slug); fs.mkdirSync(dir, { recursive: true });
    for (const f of ['story.mp4', 'poster-story.jpg', 'song.m4a']) fs.writeFileSync(path.join(dir, f), (await call('GET', '/' + c.slug + '/' + f)).body);
    const s = card.script, take = await S.db.get('SELECT seconds, timing FROM takes WHERE id = ?', [card.take]), timing = JSON.parse(take.timing);
    fs.writeFileSync(path.join(dir, 'carol.json'), JSON.stringify({ slug: c.slug, ad: c.ad, template: card.template, answers: card.answers, script: s, take: { seconds: take.seconds, bpm: timing.bpm, intro: timing.intro, sections: timing.sections, lines: timing.lines } }, null, 1));
    console.log('[' + c.slug + '] ' + s.title + '\n    ' + s.lyrics.map(function (x) { return x.lines.join('\n    '); }).join('\n\n    '));
  }
  await tally(); process.exit(0);
})().catch(function (e) { console.error('STOPPED: ' + e.message); process.exit(1); });
