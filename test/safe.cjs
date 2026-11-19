// node test/safe.cjs : SAFE BUILDS (SPEC.md), the server's side: no network, no port, a throwaway database (SQLite,
// or a schema of its own in the Postgres named by TEST_DATABASE_URL), media in a folder under the test's own temp dir.
//   build    the build id (the same until a client file changes, in /api/me, X-Build on every answer), what the
//            Dockerfile ships, pages that name their scripts by the build and how long each may be kept, no token
//            left unreplaced, the name and the domain typed nowhere but config.js
//   healthz  200 only when the database answers
//   once     Idempotency-Key on a new carol, a save, a song, a purchase and an email: done once, answered the same
//   saved    carols as earlier builds kept them (test/fixtures/carols) still open; a newer page's save is refused
//   check    node server.js --check, in this process and as the command a deploy runs (test/noport.cjs loaded
//            first: a bound port or a call to the network ends it with its own exit code)
//   node test/safe.cjs --capture [dir]   adds this build's carols to the fixtures (never over one that is there)
'use strict';
const assert = require('assert'), os = require('os'), fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
process.env.CONFIG_OVERRIDE = JSON.stringify({ video: { sizes: { story: [270, 480], square: [270, 270] } } });   // a small video: seconds, not half a minute
const K = require('./kit.cjs'), ROOT = K.ROOT, FIX = path.join(__dirname, 'fixtures', 'carols'), NOPORT = path.join(__dirname, 'noport.cjs');
const CAPTURE = process.argv.indexOf('--capture'), GOOGLE = 'https://accounts.google.com/gsi/client';
const MODULES = ['server.js', 'config.js', 'store.js', 'brand.js', 'agent.js', 'song.js', 'beat.js', 'render.js', 'email.js', 'admin.js'];
const TABLES = Array.from(fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g), function (m) { return m[1]; });
const sleep = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
const plain = function (v) { return !!v && typeof v === 'object' && !Array.isArray(v); };
// every <script src> and stylesheet a page names, however its tag is written
const refs = function (text) {
  const out = [];
  text.replace(/<script\b[^>]*?\ssrc\s*=\s*["']([^"']+)["']/gi, function (m, s) { out.push(s); return m; });
  text.replace(/<link\b[^>]*>/gi, function (m) { const h = /href\s*=\s*["']([^"']+)["']/i.exec(m); if (h && /rel\s*=\s*["']?stylesheet/i.test(m)) out.push(h[1]); return m; });
  return out;
};
// a script or a stylesheet without its comments (a page's comments are sent, so a page is read whole)
const code = function (f, text) { return /\.html$/.test(f) ? text : text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1'); };
let T, S;

(async function () {
  T = await K.open('safe'); S = T.S;
  const CFG = require('../config.js'), Engine = require('../engine.js'), Templates = require('../templates.js'), tpl = Templates.list[0].id;
  const n = async function (sql, p) { return Number((await S.db.get(sql, p)).n); };
  const all = async function (db) { const o = {}; for (const t of TABLES) o[t] = crypto.createHash('sha256').update(JSON.stringify(await (db || S.db).all('SELECT * FROM ' + t + ' ORDER BY 1, 2'))).digest('hex'); return o; };
  const ann = await T.user('google:ann', 'ann@example.test', 6), bea = await T.user('google:bea', 'bea@example.test', 2);
  const key = function (k, who) { return Object.assign({ 'idempotency-key': k }, who || ann); };
  let r;
  // what the rest stands on: a finished carol (the agent and the music are stand-ins, the video is really made), a
  // written one and a draft. Nothing is rendered after this: the jobs the tests below ask for stay in the queue.
  const ready = await T.carol(ann, { photos: 2, slug: 'safe-and-sound-2026' }), written = await T.carol(ann, { photos: 2, song: false });
  const draft = (await T.call('POST', '/api/cards', { template: tpl, answers: { to: 'Sam', from: 'Ada', details: 'Sam bakes bread every Sunday.' } }, ann)).json.card;
  assert.deepStrictEqual([ready.state, written.state, !!written.script, draft.state, draft.script], ['ready', 'draft', true, 'draft', null]);

  // ---- --capture: this build's carols, as they are kept, written beside the fixtures of the builds before ----
  if (CAPTURE >= 0) {
    const out = process.argv[CAPTURE + 1] || FIX; fs.mkdirSync(out, { recursive: true });
    for (const x of [['draft', 'a draft: the maker\'s answers, no words yet', draft.id], ['written', 'written by the agent, two photos as scenes, no song yet', written.id], ['ready', 'a finished carol: the words, two photos, a song and its video', ready.id]]) {
      const row = await S.db.get('SELECT * FROM cards WHERE id = ?', [x[2]]), file = path.join(out, 'v' + S.DOC_V + '-' + x[0] + '.json');
      if (fs.existsSync(file) || fs.existsSync(path.join(FIX, path.basename(file)))) { console.log('kept      ' + path.basename(file) + ' (it is there already: a fixture is never written over)'); continue; }
      fs.writeFileSync(file, JSON.stringify({ what: x[1], captured: { doc_v: S.DOC_V, on: new Date().toISOString().slice(0, 10) }, row: { template: row.template, occasion: row.occasion, state: row.state, title: row.title, v: row.v, doc: row.doc }, photos: (await S.db.all('SELECT id FROM photos WHERE card = ? ORDER BY n, at', [row.id])).map(function (p) { return p.id; }) }, null, 2) + '\n');
      console.log('captured  ' + file);
    }
    await T.done(); process.exit(0);
  }

  // ---- the build id ----
  const B = S.build(); assert(/^[0-9a-f]{10}$/.test(B), 'ten letters of a hash'); assert.strictEqual(S.buildOf(ROOT), B, 'the same files, the same id');
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-build-')); S.CLIENT.forEach(function (f) { fs.copyFileSync(path.join(ROOT, f), path.join(copy, f)); });
  assert.strictEqual(S.buildOf(copy), B, 'a copy of the client is the same build');
  for (const f of S.CLIENT) { const was = fs.readFileSync(path.join(copy, f)); fs.appendFileSync(path.join(copy, f), '\n'); assert.notStrictEqual(S.buildOf(copy), B, 'a change to ' + f + ' is another build'); fs.writeFileSync(path.join(copy, f), was); }
  assert.strictEqual(S.buildOf(copy), B, 'and changed back, the same again'); fs.writeFileSync(path.join(copy, 'server.js'), 'x'); assert.strictEqual(S.buildOf(copy), B, 'the server\'s own files are not the client');
  fs.rmSync(copy, { recursive: true, force: true });
  // everything the build id covers, and everything the server loads, is in the image that is deployed
  const docker = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8'), shipped = {};
  docker.replace(/^COPY\s+(.+)$/gm, function (m, rest) { const p = rest.trim().split(/\s+/).filter(function (x) { return x.indexOf('--') !== 0; }); p.slice(0, -1).forEach(function (x) { shipped[x.replace(/^\.\//, '').replace(/\/$/, '')] = 1; }); return m; });
  const ships = function (f) { return !!(shipped[f] || shipped[f.split('/')[0]]); }, needs = {};
  (function walk(f) { if (needs[f]) return; needs[f] = 1; Array.from(fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/require\('(\.{1,2}\/[\w./-]+)'\)/g)).forEach(function (m) { walk(path.normalize(path.join(path.dirname(f), m[1]))); }); })('server.js');
  S.CLIENT.concat(MODULES, Object.keys(needs), ['legal', 'fonts', 'assets', 'package.json', 'package-lock.json']).forEach(function (f) { assert(ships(f), 'the Dockerfile ships ' + f); });
  assert.strictEqual(ships('examples'), fs.existsSync(path.join(ROOT, 'examples')), 'the Dockerfile ships examples/ exactly when there is one (take the # off its COPY line, or put it back)');
  assert(!ships('test') && !ships('node_modules') && !ships('.env') && !ships('.') && !ships('data'), 'and not the tests, a .env or a database');
  assert(/^RUN [^\n]*(apt-get install|apk add)[^\n]*\bffmpeg\b/m.test(docker), 'the image has ffmpeg'); assert(/^RUN npm ci --omit=dev\b/m.test(docker) && /^FROM node:24[\w.-]*$/m.test(docker) && /^CMD \["node", ?"server\.js"\]$/m.test(docker) && /^ENV [^\n]*\bPORT=8080\b/m.test(docker), 'Node 24, the lockfile\'s packages, port 8080, node server.js');
  const ignore = fs.readFileSync(path.join(ROOT, '.dockerignore'), 'utf8').split('\n'); ['node_modules', 'data', '.env', '.git', 'test'].forEach(function (x) { assert(ignore.indexOf(x) >= 0, '.dockerignore leaves out ' + x); });
  // every script and stylesheet any page asks for is part of the id (the one script from elsewhere is Google's sign-in)
  const pending = [];
  S.CLIENT.forEach(function (f) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8'); if (text.length < 200) { pending.push(f); console.log('PENDING ' + f + ' (still a placeholder)'); }
    if (/\.html$/.test(f)) refs(text).forEach(function (s) { assert(s === GOOGLE || S.CLIENT.indexOf(s.replace(/^\//, '').replace(/[?#].*$/, '')) >= 0, f + ' asks for ' + s + ', which the build id must cover'); });
  });
  r = await T.call('GET', '/api/me'); assert.deepStrictEqual([r.status, r.json.build, r.json.user], [200, B, null], '/api/me says the build');
  for (const x of [['GET', '/', 200], ['GET', '/make', 200], ['GET', '/admin', 200], ['GET', '/' + ready.slug, 200], ['GET', '/' + ready.slug + '/poster.jpg', 200], ['GET', '/no-such-card', 404], ['GET', '/net.js', 200], ['GET', '/style.css?v=' + B, 200], ['GET', '/fonts/Lobster-Regular.ttf', 200], ['GET', '/favicon.svg', 200],
    ['GET', '/api/me', 200], ['GET', '/api/templates', 200], ['GET', '/api/cards', 401], ['POST', '/api/cards', 401], ['GET', '/api/nothing', 404], ['GET', '/api/card/no-such-card', 404], ['GET', '/healthz', 200], ['POST', '/mcp', 401], ['GET', '/legal', 200], ['GET', '/legal/terms', 200], ['GET', '/legal/nothing', 404], ['GET', '/auth/link', 400], ['PUT', '/make', 405]]) {
    r = await T.call(x[0], x[1], x[0] === 'POST' ? {} : null); assert.strictEqual(r.heads['x-build'], B, x.join(' ') + ' says the build in X-Build'); assert.strictEqual(r.status, x[2], x.join(' ') + ' answered ' + r.status);
  }
  // every page: asked for afresh each time, told its build, asking for each script and stylesheet by it, no token left
  for (const u of ['/', '/make', '/make?card=' + draft.id, '/admin', '/' + ready.slug]) {
    r = await T.call('GET', u, null, u.indexOf('/make') === 0 ? ann : null); const own = refs(r.text).filter(function (s) { return s !== GOOGLE; });
    assert.strictEqual(r.status, 200, u); assert.strictEqual(r.heads['cache-control'], 'no-cache', u + ' is asked for afresh'); assert(r.text.indexOf('<script>window.SAC_BUILD = "' + B + '";</script>') > 0, u + ' is told its build');
    assert(own.every(function (s) { return new RegExp('^/?[\\w.-]+\\.(?:js|css)\\?v=' + B + '$').test(s); }), u + ' asks for every script and stylesheet by the build: ' + own.join(' '));
    const file = { '/': 'landing.html', '/admin': 'admin.html' }[u] || (u.indexOf('/make') === 0 ? 'app.html' : 'card.html'); if (pending.indexOf(file) < 0) assert(own.length >= 2, u + ' has scripts and a stylesheet: ' + own.join(' '));
    assert(!/\{\{\w+\}\}/.test(r.text), u + ' has a token nobody replaced: ' + (/\{\{\w+\}\}/.exec(r.text) || [''])[0]);
    for (const s of own) { const a = await T.call('GET', '/' + s.replace(/^\//, '')); assert.deepStrictEqual([a.status, a.heads['cache-control']], [200, 'public, max-age=31536000, immutable'], s + ' may be kept for a year'); }
  }
  for (const f of S.CLIENT.filter(function (x) { return !/\.html$/.test(x); })) {
    const now = await T.call('GET', '/' + f + '?v=' + B), bare = await T.call('GET', '/' + f), old = await T.call('GET', '/' + f + '?v=0123456789'), file = fs.readFileSync(path.join(ROOT, f));
    assert.deepStrictEqual([now.heads['cache-control'], bare.heads['cache-control'], old.heads['cache-control']], ['public, max-age=31536000, immutable', 'no-cache', 'no-store'], f + ': kept by this build\'s address, checked with none, never kept under another build\'s');
    assert(now.body.equals(file) && bare.body.equals(file) && old.body.equals(file), f + ' is the file either way');
  }
  // the name and the domain are typed in config.js and nowhere else: pages get them through tokens, scripts from /api/me
  fs.readdirSync(ROOT).filter(function (f) { return /\.(html|js|css)$/.test(f) && f !== 'config.js'; }).forEach(function (f) {
    const text = code(f, fs.readFileSync(path.join(ROOT, f), 'utf8'));
    [CFG.name, CFG.domain].forEach(function (w) { const at = text.indexOf(w); assert(at < 0, f + ' has "' + w + '" typed in it (use {{name}} / {{domain}} in a page, config from /api/me in a script): ...' + text.slice(Math.max(0, at - 60), at + 40).replace(/\s+/g, ' ')); });
  });
  r = await T.call('GET', '/'); if (pending.indexOf('landing.html') < 0) assert(r.text.indexOf(CFG.name) > 0, 'and the page that is sent does say the name');
  console.log('OK build: ' + B + ', the same until a client file changes (' + S.CLIENT.length + ' files), all of them and every server module in the Dockerfile with ffmpeg; in /api/me and X-Build on every answer; pages no-cache, told their build, no token left; scripts by ?v= (a year), bare (no-cache), another build\'s (no-store); the name typed only in config.js' + (pending.length ? '; PENDING ' + pending.join(' ') : ''));

  // ---- /healthz: 200 only when the database answers ----
  r = await T.call('GET', '/healthz'); assert.deepStrictEqual([r.status, r.json], [200, { ok: true, build: B }]);
  const get = S.db.get, said = console.error; S.db.get = function () { return Promise.reject(new Error('connection refused')); }; console.error = function () {};
  try { r = await T.call('GET', '/healthz'); } finally { S.db.get = get; console.error = said; }
  assert.deepStrictEqual([r.status, r.json.ok, r.heads['x-build']], [503, false, B], 'the database gone is a 503'); assert.strictEqual((await T.call('GET', '/healthz')).status, 200);
  console.log('OK healthz: 200 with the build when the database answers, 503 when it does not');

  // ---- Idempotency-Key: a write sent twice is done once, and the repeat gets the first answer ----
  await S.db.run('INSERT INTO idem (uid, ikey, at, code, answer) VALUES (?, ?, ?, ?, ?)', ['google:ann', 'a-key-from-two-days-ago', Date.now() - 2 * 864e5, 200, '{}']);
  await S.db.run('INSERT INTO idem (uid, ikey, at, code, answer) VALUES (?, ?, ?, ?, ?)', ['google:ann', 'a-key-from-an-hour-ago', Date.now() - 36e5, 200, '{}']);
  const cards = function (uid) { return n("SELECT COUNT(*) AS n FROM cards WHERE uid = ?", [uid || 'google:ann']); }, mk = { template: tpl, answers: { to: 'Sam', from: 'Ada' } };
  // a new carol
  let was = await cards(); const first = await T.call('POST', '/api/cards', mk, key('cards-key-0001'));
  assert.deepStrictEqual([first.status, first.json.ok, first.heads['idempotent-replay']], [200, true, undefined]);
  r = await T.call('POST', '/api/cards', mk, key('cards-key-0001')); assert.deepStrictEqual([r.status, r.json, r.heads['idempotent-replay']], [200, first.json, 'true'], 'the repeat gets the first answer'); assert.strictEqual(await cards(), was + 1, 'and is one carol');
  r = await Promise.all([1, 2, 3].map(function () { return T.call('POST', '/api/cards', mk, key('together-key-01')); }));
  assert(r.every(function (x) { return x.status === 200 && x.json.card.id === r[0].json.card.id; }) && r.filter(function (x) { return x.heads['idempotent-replay'] === 'true'; }).length === 2, 'three that arrive together get one answer'); assert.strictEqual(await cards(), was + 2, 'and are one carol');
  r = await T.call('POST', '/api/cards', mk, key('cards-key-0001', bea)); assert(r.status === 200 && r.json.card.id !== first.json.card.id && r.heads['idempotent-replay'] === undefined, 'a key is one account\'s: the same one from someone else is hers'); assert.strictEqual(await cards('google:bea'), 1);
  was = await cards(); for (const h of [ann, ann, key('short'), key('not a key at all!'), key('x'.repeat(65))]) assert.strictEqual((await T.call('POST', '/api/cards', mk, h)).status, 200);
  assert.strictEqual(await cards(), was + 5, 'with no key, or one that is not a key, each is a carol of its own, as an ordinary request');
  // a refusal is an answer too, and is the answer again
  r = await T.call('POST', '/api/cards', { template: 'no-such-template' }, key('refused-key-01')); const again = await T.call('POST', '/api/cards', { template: tpl }, key('refused-key-01'));
  assert.deepStrictEqual([r.status, r.json.error, again.status, again.json.error, again.heads['idempotent-replay']], [400, 'Pick a template first.', 400, 'Pick a template first.', 'true']);
  // a save: the repeat gets the first answer, and takes nothing back that came after it
  const sid = first.json.card.id, toOf = async function () { return JSON.parse((await S.db.get('SELECT doc FROM cards WHERE id = ?', [sid])).doc).answers.to; };
  r = await T.call('POST', '/api/cards/' + sid + '/save', { answers: { to: 'Sam the First' } }, key('save-key-00001')); assert.deepStrictEqual([r.status, r.json.card.answers.to], [200, 'Sam the First']);
  await T.call('POST', '/api/cards/' + sid + '/save', { answers: { to: 'Sam the Second' } }, key('save-key-00002'));
  r = await T.call('POST', '/api/cards/' + sid + '/save', { answers: { to: 'Sam the First' } }, key('save-key-00001')); assert.deepStrictEqual([r.json.card.answers.to, r.heads['idempotent-replay']], ['Sam the First', 'true'], 'the first answer, again'); assert.strictEqual(await toOf(), 'Sam the Second', 'and what is kept is what came last');
  // a song: one job, one credit
  const jobs = function (id) { return n('SELECT COUNT(*) AS n FROM jobs WHERE card = ?', [id]); }; let credits = await S.balance('google:ann');
  r = await T.call('POST', '/api/cards/' + written.id + '/song', {}, key('song-key-00001')); assert.deepStrictEqual([r.status, typeof r.json.job, r.json.credits, r.json.card.paid], [200, 'string', credits - 1, true], r.text);
  const sung = await T.call('POST', '/api/cards/' + written.id + '/song', {}, key('song-key-00001')); assert.deepStrictEqual([sung.status, sung.json.job, sung.json.credits, sung.heads['idempotent-replay']], [200, r.json.job, credits - 1, 'true']);
  assert.deepStrictEqual([await jobs(written.id), await S.balance('google:ann')], [1, credits - 1], 'the song is asked for once and one credit is spent');
  r = await T.call('POST', '/api/cards/' + written.id + '/song', {}, key('song-key-00002')); assert.deepStrictEqual([r.status, r.json.error], [409, 'This carol is already being made.'], 'another key is another request (and is refused: one is on its way)');
  const w2 = await T.carol(ann, { photos: 0, song: false }); credits = await S.balance('google:ann');
  r = await Promise.all([1, 2, 3].map(function () { return T.call('POST', '/api/cards/' + w2.id + '/song', {}, key('song-together-1')); }));
  assert(r.every(function (x) { return x.status === 200 && x.json.job === r[0].json.job; }), 'three together: ' + r.map(function (x) { return x.text.slice(0, 80); }).join(' | ')); assert.deepStrictEqual([await jobs(w2.id), await S.balance('google:ann')], [1, credits - 1], 'one job, one credit');
  // a purchase: one Stripe session; a 5xx is not kept, so the same key works once the trouble is over
  const F = T.fakes, sessions = function () { return Object.keys(F.stripe.sessions).length; }, idemOf = function (k) { return n('SELECT COUNT(*) AS n FROM idem WHERE ikey = ?', [k]); };
  const stripeKey = process.env.STRIPE_SECRET_KEY, quiet = console.error; console.error = function () {};
  try {
    delete process.env.STRIPE_SECRET_KEY; r = await T.call('POST', '/api/buy', { pack: 'five', card: sid }, key('buy-key-000001'));
    assert.deepStrictEqual([r.status, r.json.error, r.heads['idempotent-replay']], [503, 'Purchases open soon.', undefined]); process.env.STRIPE_SECRET_KEY = stripeKey;
    const real = S.seam.fetch; S.seam.fetch = async function () { throw new Error('socket hang up'); };
    try { r = await T.call('POST', '/api/buy', { pack: 'five', card: sid }, key('buy-key-000001')); } finally { S.seam.fetch = real; }
    assert.deepStrictEqual([r.status, r.json.error], [500, 'Something went wrong on our side.']); assert.deepStrictEqual([await idemOf('buy-key-000001'), sessions()], [0, 0], 'a 5xx is not kept as the answer');
  } finally { process.env.STRIPE_SECRET_KEY = stripeKey; console.error = quiet; }
  r = await T.call('POST', '/api/buy', { pack: 'five', card: sid }, key('buy-key-000001')); assert.deepStrictEqual([r.status, r.json.url, r.heads['idempotent-replay']], [200, 'https://checkout.stripe.test/pay/0', undefined], 'the same key, once Stripe answers: ' + r.text);
  const bought = await Promise.all([1, 2, 3].map(function () { return T.call('POST', '/api/buy', { pack: 'five', card: sid }, key('buy-key-000001')); }));
  assert(bought.every(function (x) { return x.status === 200 && x.json.url === r.json.url && x.heads['idempotent-replay'] === 'true'; })); assert.deepStrictEqual([sessions(), F.stripe.asked.length, await n('SELECT COUNT(*) AS n FROM checkouts WHERE uid = ?', ['google:ann'])], [1, 1, 1], 'one Stripe session, however often it is sent');
  assert.strictEqual(F.stripe.asked[0]['custom_text[submit][message]'], CFG.finalSale, 'and the buyer is told it is final where they pay');
  // an email: one to each address
  const mails = F.sent.length, to = ['june@example.test', 'theo@example.test'];
  r = await T.call('POST', '/api/cards/' + ready.id + '/email', { to: to, note: 'Open it with the sound on.', know: true }, key('email-key-0001')); assert.deepStrictEqual([r.status, r.json.sent, r.json.failed], [200, 2, 0], r.text);
  const mailed = await T.call('POST', '/api/cards/' + ready.id + '/email', { to: to, note: 'Open it with the sound on.', know: true }, key('email-key-0001')); assert.deepStrictEqual([mailed.status, mailed.json.sent, mailed.heads['idempotent-replay']], [200, 2, 'true']);
  r = await Promise.all([1, 2, 3].map(function () { return T.call('POST', '/api/cards/' + ready.id + '/email', { to: 'biscuit@example.test', know: true }, key('email-together')); })); assert(r.every(function (x) { return x.status === 200 && x.json.sent === 1; }));
  assert.deepStrictEqual([F.sent.length - mails, await n('SELECT COUNT(*) AS n FROM sends WHERE card = ?', [ready.id])], [3, 3], 'one email to each of the three addresses, however often it is sent');
  assert(F.sent.slice(mails).every(function (m) { return JSON.stringify(m).indexOf('ann@example.test') < 0; }), 'and the maker\'s own address is in none of them');
  r = await T.call('POST', '/api/cards/' + ready.id + '/email', { to: 'x@example.test' }, key('email-refused-1')); const refused = await T.call('POST', '/api/cards/' + ready.id + '/email', { to: 'x@example.test', know: true }, key('email-refused-1'));
  assert.deepStrictEqual([r.status, refused.status, refused.json.error, refused.heads['idempotent-replay'], F.sent.length - mails], [400, 400, r.json.error, 'true', 3]);
  // nothing is done for nobody, key or no key; and the keys of two days ago are gone
  assert.strictEqual((await T.call('POST', '/api/cards', mk, { 'idempotency-key': 'nobody-key-001' })).status, 401); assert.strictEqual(await idemOf('nobody-key-001'), 0);
  for (let i = 0; i < 80 && await idemOf('a-key-from-two-days-ago'); i++) await sleep(25);
  assert.deepStrictEqual([await idemOf('a-key-from-two-days-ago'), await idemOf('a-key-from-an-hour-ago')], [0, 1], 'a key is remembered for a day'); assert(await n('SELECT COUNT(*) AS n FROM idem') >= 9);
  console.log('OK once: a new carol, a save, a song, a purchase and an email sent again with their Idempotency-Key get the first answer and are done once (one row, one job and one credit, one Stripe session, one email to each address), in turn and three together; a refusal is the answer again; a 5xx is not kept; a key is one account\'s; no key is an ordinary request; keys are kept a day');

  // ---- saved carols: what an earlier build kept still opens, and nothing in it is lost ----
  assert.strictEqual(typeof S.DOC_V, 'number'); assert(S.DOC_V >= 1 && S.DOC_V === Math.floor(S.DOC_V));
  const files = fs.readdirSync(FIX).filter(function (f) { return /\.json$/.test(f); }).sort(), at = function (o, p) { return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }, seen = { draft: 0, scenes: 0, odd: 0 };
  for (const f of files) {
    const x = JSON.parse(fs.readFileSync(path.join(FIX, f), 'utf8')), row = Object.assign({ id: 'fixture' + files.indexOf(f) }, x.row), doc = row.doc, photos = (x.photos || []).map(function (id) { return { id: id }; });
    assert(typeof x.what === 'string' && x.captured && typeof x.captured.doc_v === 'number' && typeof x.captured.on === 'string' && typeof row.template === 'string' && (typeof doc === 'string' || doc === null), f + ' is a fixture: what, captured { doc_v, on }, row { template, doc }');
    assert(x.captured.doc_v <= S.DOC_V, f + ' was kept by a build this one comes after');
    let d; assert.doesNotThrow(function () { d = S.docOf(row); }, f + ' opens'); assert.strictEqual(row.doc, doc, f + ': reading changes nothing that was kept');
    assert(d.v === S.DOC_V && plain(d.answers) && (d.script === null || plain(d.script)), f + ' is brought up to this version'); assert.deepStrictEqual(JSON.parse(JSON.stringify(d)), d, f + ': kept again, it is all still there');
    let stored = null; try { stored = JSON.parse(doc); } catch (e) { stored = null; }
    if (plain(stored)) {   // a field this build does not know is kept, wherever it is
      Object.keys(stored).forEach(function (k) { if (['v', 'answers', 'script'].indexOf(k) < 0) assert.deepStrictEqual(d[k], stored[k], f + ' keeps ' + k); });
      if (plain(stored.answers)) Object.keys(stored.answers).forEach(function (k) { assert.deepStrictEqual(d.answers[k], stored.answers[k], f + ' keeps answers.' + k); });
      if (plain(stored.script)) Object.keys(stored.script).forEach(function (k) { if (k !== 'lyrics' && k !== 'scenes') assert.deepStrictEqual(d.script[k], stored.script[k], f + ' keeps script.' + k); });
    }
    Object.keys(x.keeps || {}).forEach(function (p) { assert.deepStrictEqual(at(d, p), x.keeps[p], f + ' keeps ' + p); });
    let e, plan; assert.doesNotThrow(function () { e = S.engineCard(row, d, photos, null); plan = Engine.plan(e.card); }, f + ' can be drawn');
    assert(plan.duration > 0 && Array.isArray(plan.scenes) && Array.isArray(plan.lines) && e.pids.every(function (p) { return (x.photos || []).indexOf(p) >= 0; }), f + ': the engine has a plan for it');
    if (x.scenes !== undefined) assert.strictEqual(e.card.scenes.length, x.scenes, f + ' has ' + x.scenes + ' photo scenes');
    // and through the server: its maker opens it, saves it, and what this build does not know is still in the row
    await S.db.run('INSERT INTO cards (id, uid, slug, state, v, occasion, template, title, doc, created, updated) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)', [row.id, 'google:ann', 'draft', row.v == null ? null : row.v, row.occasion || 'birthday', row.template, row.title || '', doc, 1, 1]);
    r = await T.call('GET', '/api/cards/' + row.id, null, ann); assert.deepStrictEqual([r.status, plain(r.json.card.answers), plain(r.json.card.engine)], [200, true, true], f + ' is opened by its maker: ' + r.text.slice(0, 200));
    r = await T.call('POST', '/api/cards/' + row.id + '/save', { answers: { must: 'kept by a test' } }, ann); assert.strictEqual(r.status, 200, f + ' is saved again: ' + r.text.slice(0, 200));
    const back = JSON.parse((await S.db.get('SELECT doc FROM cards WHERE id = ?', [row.id])).doc); assert.deepStrictEqual([back.v, back.answers.must], [S.DOC_V, 'kept by a test']); Object.keys(x.keeps || {}).forEach(function (p) { assert.deepStrictEqual(at(back, p), x.keeps[p], f + ' still has ' + p + ' after a save'); });
    await S.db.run('DELETE FROM cards WHERE id = ?', [row.id]);
    if (plain(stored) && !stored.script && plain(stored.answers)) seen.draft++; if (e.card.scenes.length) seen.scenes++; if (x.odd) seen.odd++;
  }
  assert(files.length >= 3 && seen.draft >= 1 && seen.scenes >= 1 && seen.odd >= 1, 'the fixtures hold a draft, a written carol with photos and one as an older or damaged row might be: ' + JSON.stringify(seen));
  // a page newer than this server (a deploy that was rolled back): its save is refused in a sentence, and nothing is changed
  const kept = (await S.db.get('SELECT doc FROM cards WHERE id = ?', [draft.id])).doc;
  r = await T.call('POST', '/api/cards/' + draft.id + '/save', { v: S.DOC_V + 1, answers: { to: 'From Tomorrow' } }, key('newer-page-key1')); assert.deepStrictEqual([r.status, r.json.error], [409, 'This page is older than your carol. Reload it.']);
  assert.strictEqual((await S.db.get('SELECT doc FROM cards WHERE id = ?', [draft.id])).doc, kept); assert.strictEqual((await T.call('POST', '/api/cards/' + draft.id + '/save', { v: S.DOC_V + 1, answers: { to: 'From Tomorrow' } }, key('newer-page-key1'))).heads['idempotent-replay'], 'true');
  for (const v of [S.DOC_V, S.DOC_V - 1, undefined, 'x', null]) { r = await T.call('POST', '/api/cards/' + draft.id + '/save', { v: v, answers: { to: 'Sam' } }, ann); assert.strictEqual(r.status, 200, 'a save that says v ' + v + ' is taken'); }
  assert.strictEqual(JSON.parse((await S.db.get('SELECT doc FROM cards WHERE id = ?', [written.id])).doc).v, S.DOC_V, 'a carol is kept with its version');
  console.log('OK saved: version ' + S.DOC_V + '; ' + files.length + ' kept carols (' + files.join(', ') + ') open, keep what this build does not know, are drawn, opened and saved again; a save from a newer page is refused in a sentence');

  // ---- node server.js --check, in this process: passes, changes no row, and says exactly what is wrong ----
  const before = await all(); r = await S.check();
  assert(r.ok, r.lines.join('\n')); assert.strictEqual(r.lines[r.lines.length - 1], 'CHECK PASSED'); assert.deepStrictEqual(await all(), before, 'not a row is changed');
  const live = await n("SELECT COUNT(*) AS n FROM cards WHERE state <> 'deleted'");
  assert(live >= 10 && await n('SELECT COUNT(*) AS n FROM jobs') >= 3 && await n('SELECT COUNT(*) AS n FROM media') >= 4 && await n('SELECT COUNT(*) AS n FROM sends') === 3, 'and it had real rows to read');
  assert(r.lines.indexOf('ok    ' + TABLES.length + ' of ' + TABLES.length + ' tables read, with every column') > 0 && TABLES.length >= 20 && r.lines.some(function (l) { return /^ok    server\.js: (\d+) of \1 statements/.test(l) && +/(\d+) of/.exec(l)[1] > 60; }) && r.lines.indexOf('ok    ' + live + ' of ' + live + ' saved carols open with this build') > 0, r.lines.join('\n'));
  // a statement that names a column that is not there: a read is run, a write is only planned; neither changes anything
  r = await S.check({ statements: ['SELECT id, shoe_size FROM users WHERE id = ?', 'UPDATE users SET shoe_size = ? WHERE id = ?', 'DELETE FROM users WHERE id <> ?', 'SELEC id FROM users'] });
  assert.strictEqual(r.ok, false); assert.strictEqual(r.failed.length, 3, r.failed.join('\n')); assert(/shoe_size/.test(r.failed[0]) && /SELECT id, shoe_size FROM users/.test(r.failed[0]) && /shoe_size/.test(r.failed[1]) && /UPDATE users SET shoe_size/.test(r.failed[1]) && /SELEC id FROM users/.test(r.failed[2]), r.failed.join('\n'));
  assert(/^CHECK FAILED: 3 things wrong/.test(r.lines[r.lines.length - 1])); assert.deepStrictEqual(await all(), before, 'the DELETE that was good was planned, not done: every account is still there'); assert.strictEqual(await n('SELECT COUNT(*) AS n FROM users'), 2);
  // a statement that removes or gives another name, outside the cleanup marks
  const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8'), lines = src.split('\n').length;
  for (const x of ["await db.exec('DROP TABLE reports');", "db.run('ALTER TABLE takes DROP COLUMN words')", "db.exec('ALTER TABLE users RENAME COLUMN name TO handle')", "db.exec('alter table users rename to makers')"]) {
    r = await S.check({ sources: { 'server.js': src + '\n' + x + '\n' } });
    assert(!r.ok && r.failed.length === 1 && r.failed[0].indexOf('server.js line ' + (lines + 1) + ': a statement that removes a table or a column, or gives one another name, outside the cleanup list') === 0, x + ' -> ' + r.failed.join('\n'));
  }
  assert.strictEqual(await n('SELECT COUNT(*) AS n FROM reports'), 0, 'and it was never run: the table is there'); assert.deepStrictEqual(await all(), before);
  assert(/cleanup:begin[\s\S]*cleanup:end/.test(src), 'the cleanup list is marked in server.js');
  r = await S.check({ sources: { 'server.js': src.replace('/* cleanup:end */', "'ALTER TABLE takes DROP COLUMN words',\n/* cleanup:end */") } }); assert(r.ok, 'inside the cleanup marks it may stand: ' + r.failed.join('\n'));
  // a saved carol whose template is no longer there
  await S.db.run('INSERT INTO cards (id, uid, slug, state, v, occasion, template, title, doc, created, updated) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)', ['orphan1', 'google:ann', 'draft', 1, 'birthday', 'a-template-that-was-removed', 'Orphan', JSON.stringify({ v: 1, answers: {}, script: { title: 'Orphan', lyrics: [{ section: 'verse', lines: ['one', 'two'] }], scenes: [] } }), 2, 2]);
  r = await S.check(); assert(!r.ok && r.failed.length === 1 && r.failed[0] === 'carol orphan1 no longer opens: its template a-template-that-was-removed is gone', r.failed.join('\n')); assert(r.lines.indexOf('ok    ' + live + ' of ' + (live + 1) + ' saved carols open with this build') > 0);
  await S.db.run('DELETE FROM cards WHERE id = ?', ['orphan1']); assert((await S.check()).ok); assert.deepStrictEqual(await all(), before);
  console.log('OK check (in this process): passes on a database with ' + live + ' carols and changes no row in ' + TABLES.length + ' tables; names a wrong column in a read and in a write (planned, never done) and a statement that is not SQL; a DROP TABLE, a DROP COLUMN or a RENAME outside the cleanup marks, by its line; a carol whose template is gone');

  // ---- node server.js --check, as the deploy runs it: another process, a database of its own, no port, no network ----
  // (server.js reads .env when it is the command: every name in it that this test has not set is handed over empty)
  const blank = {}; ['FLY_APP_NAME', 'DATABASE_URL', 'DB_SCHEMA', 'CLIENT_DIR', 'R2_ENDPOINT', 'R2_BUCKET', 'R2_PREFIX', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'].concat(fs.existsSync(path.join(ROOT, '.env')) ? Array.from(fs.readFileSync(path.join(ROOT, '.env'), 'utf8').matchAll(/^([A-Z0-9_]+)=/gm), function (m) { return m[1]; }) : []).forEach(function (k) { if (process.env[k] === undefined) blank[k] = ''; });
  const node = function (f, args, more) { const o = cp.spawnSync(process.execPath, ['-r', NOPORT].concat(args), { cwd: ROOT, encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, blank, { NODE_NO_WARNINGS: '1', PORT: '1' }, f && f.env, more) }); return { code: o.status, out: o.stdout + o.stderr }; };
  const run = function (f, more) { return node(f, ['server.js', '--check'], more); };
  // a database of its own: a SQLite file in a folder of its own, or a schema of its own in the Postgres of TEST_DATABASE_URL
  const fresh = async function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-check-'));
    if (process.env.TEST_DATABASE_URL) {
      const pg = require('pg'), schema = 'sac_test_check_' + process.pid + '_' + crypto.randomBytes(4).toString('hex'), c = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); pg.types.setTypeParser(20, Number);
      await c.connect(); await c.query('CREATE SCHEMA ' + schema); await c.query('SET search_path TO ' + schema);
      return { postgres: true, env: { DATA_DIR: dir, DATABASE_URL: process.env.TEST_DATABASE_URL, DB_SCHEMA: schema }, exec: function (s) { return c.query(s); }, all: async function (s) { return (await c.query(s)).rows; }, done: async function () { await c.query('DROP SCHEMA ' + schema + ' CASCADE'); await c.end(); fs.rmSync(dir, { recursive: true, force: true }); } };
    }
    const lite = function () { return new (require('node:sqlite').DatabaseSync)(path.join(dir, CFG.app + '.db')); };
    return { postgres: false, env: { DATA_DIR: dir, DATABASE_URL: '', DB_SCHEMA: '' }, exec: async function (s) { const d = lite(); try { d.exec(s); } finally { d.close(); } }, all: async function (s) { const d = lite(); try { return d.prepare(s).all(); } finally { d.close(); } }, done: async function () { fs.rmSync(dir, { recursive: true, force: true }); } };
  };
  const R2 = { R2_ENDPOINT: 'https://0123456789abcdef.r2.cloudflarestorage.com', R2_BUCKET: 'carols-test', R2_PREFIX: 'send-a-carol', R2_ACCESS_KEY_ID: 'test-never-used', R2_SECRET_ACCESS_KEY: 'test-never-used' }, clean = function (o) { return !/PORT WAS BOUND|NETWORK WAS ASKED/.test(o); };
  let f = await fresh();
  try {
    r = run(f); assert.strictEqual(r.code, 0, r.out); assert(/^ok    the schema is applied$/m.test(r.out) && new RegExp('^ok    ' + TABLES.length + ' of ' + TABLES.length + ' tables read, with every column$', 'm').test(r.out) && /^ok    0 of 0 saved carols open/m.test(r.out) && /CHECK PASSED\s*$/.test(r.out) && clean(r.out), r.out);
    assert.strictEqual(Number((await f.all('SELECT COUNT(*) AS n FROM idem'))[0].n), 0, 'an empty database is given the schema (the same code a start uses)');
    const doc = JSON.stringify({ v: 1, answers: { to: 'Zed' }, script: { title: 'For Zed', greeting: 'Hello', signoff: 'Bye', lyrics: [{ section: 'verse', lines: ['one line', 'another line'] }], scenes: [] } }).replace(/'/g, "''");
    await f.exec("INSERT INTO users (id, email, name, created) VALUES ('google:zed', 'zed@example.test', 'Zed', 1); INSERT INTO cards (id, uid, slug, state, v, occasion, template, title, doc, created, updated) VALUES ('czed000001', 'google:zed', 'for-zed-2026', 'ready', 1, '" + Templates.list[0].occasion + "', '" + tpl + "', 'For Zed', '" + doc + "', 1, 1);" +
      " INSERT INTO cards (id, uid, slug, state, v, occasion, template, title, doc, created, updated) VALUES ('czed000002', 'google:zed', NULL, 'draft', 1, 'birthday', '" + tpl + "', '', '{\"v\":1,\"answers\":{},\"script\":null}', 2, 2);" +
      " INSERT INTO jobs (id, card, uid, kind, state, stage, pct, tries, args, created, updated) VALUES ('jrunning01', 'czed000001', 'google:zed', 'render', 'running', 'rendering', 40, 1, '{}', 1, 1); INSERT INTO jobs (id, card, uid, kind, state, stage, pct, tries, args, created, updated) VALUES ('jqueued001', 'czed000002', 'google:zed', 'song', 'queued', 'queued', 0, 0, '{}', 2, 2);" +
      " INSERT INTO credit_log (uid, delta, why, ref, at) VALUES ('google:zed', 5, 'test', 'test:1', 1); INSERT INTO email_links (hash, email, back, expires, used) VALUES ('h', 'zed@example.test', '/make', 99999999999999, 0); INSERT INTO idem (uid, ikey, at, code, answer) VALUES ('google:zed', 'an-old-key-0001', 1, 200, '{}'); INSERT INTO settings (k, v, at) VALUES ('limits', '{\"freeDrafts\":4}', 1);");
    const rows = await all(f); r = run(f); assert.strictEqual(r.code, 0, r.out); assert(/^ok    2 of 2 saved carols open with this build$/m.test(r.out) && /CHECK PASSED\s*$/.test(r.out) && clean(r.out), r.out);
    assert.deepStrictEqual(await all(f), rows, 'not a row is changed: the job that was running is still running (nothing is put back in the queue or started), the unspent sign-in link is unspent, the key of long ago is still there');
    // ON THE MACHINE: only what makes the site unusable stops a deploy (no database, no session secret). A feature whose
    // secret is missing is OFF: said in a line of its own that names the secret, and the check still passes.
    const LIVE = { FLY_APP_NAME: 'send-a-carol', SESSION_SECRET: 'a-test-session-secret' }, NONE = { STRIPE_SECRET_KEY: '', GOOGLE_CLIENT_ID: '', RESEND_API_KEY: '', ANTHROPIC_API_KEY: '', CLAUDE_MODEL: '', ELEVENLABS_API_KEY: '', ELEVEN_MUSIC_MODEL: '', ADMIN_PASSWORD: '', ADMIN_MCP_KEY: '' };
    const ALL = { STRIPE_SECRET_KEY: 'sk_test_never_used', GOOGLE_CLIENT_ID: 'x.apps.googleusercontent.test', RESEND_API_KEY: 're_never_used', ANTHROPIC_API_KEY: 'never-used', CLAUDE_MODEL: 'test', ELEVENLABS_API_KEY: 'never-used', ELEVEN_MUSIC_MODEL: 'test', ADMIN_PASSWORD: 'open-sesame', ADMIN_MCP_KEY: 'test-admin-mcp-key-0123456789abcdef' };
    const OFF = [/^off:  photos, songs and videos: the storage settings are not set \(no R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY\)$/m, /^off:  payments: .* \(no STRIPE_SECRET_KEY\)$/m, /^off:  Google sign-in: .* \(no GOOGLE_CLIENT_ID\)$/m, /^off:  email: .* \(no RESEND_API_KEY\)$/m, /^off:  the writing agent: .* \(no ANTHROPIC_API_KEY, CLAUDE_MODEL\)$/m, /^off:  the music service: .* \(no ELEVENLABS_API_KEY, ELEVEN_MUSIC_MODEL\)$/m, /^off:  the admin's password .*\(no ADMIN_PASSWORD\)$/m, /^off:  the admin's connector \(no ADMIN_MCP_KEY of 24 characters or more\)$/m, /^off:  there is NO way to sign in until GOOGLE_CLIENT_ID or RESEND_API_KEY is set$/m];
    const fails = f.postgres ? 0 : 1, end = function (n) { return n ? new RegExp('CHECK FAILED: ' + n + ' thing' + (n > 1 ? 's' : '') + ' wrong') : /CHECK PASSED\s*$/; };   // (on SQLite the live machine also lacks its database: that one thing fails)
    r = run(f, Object.assign({}, LIVE, NONE)); assert.strictEqual(r.code, fails ? 1 : 0, r.out); OFF.forEach(function (re) { assert(re.test(r.out), 'the check names what is off: ' + re + '\n' + r.out); });
    assert(end(fails).test(r.out) && /^ok    sessions are signed$/m.test(r.out) && clean(r.out) && (r.out.match(/^FAIL/gm) || []).length === fails, 'a live machine with every optional secret missing passes its check, each feature said to be off:\n' + r.out);
    if (!f.postgres) assert(/^FAIL  DATABASE_URL is not set on this machine/m.test(r.out), r.out);
    r = run(f, Object.assign({}, LIVE, NONE, { SESSION_SECRET: '' })); assert(r.code === 1 && /^FAIL  SESSION_SECRET is not set on this machine: nobody could sign in$/m.test(r.out) && end(fails + 1).test(r.out), 'no session secret on the machine stops the deploy:\n' + r.out);
    r = run(f, Object.assign({}, LIVE, ALL, R2)); assert.strictEqual(r.code, fails ? 1 : 0, r.out); assert(!/^off:/m.test(r.out) && /^ok    media is kept in R2 bucket carols-test, prefix send-a-carol\/$/m.test(r.out) && /^ok    payments \(test mode\)$/m.test(r.out) && /^ok    Google sign-in$/m.test(r.out) && /^ok    the writing agent$/m.test(r.out) && /^ok    the music service$/m.test(r.out) && /^ok    email /m.test(r.out) && end(fails).test(r.out) && clean(r.out), 'with everything set, everything is ok:\n' + r.out);
    r = run(f, Object.assign({}, LIVE, ALL, R2, { R2_PREFIX: '', R2_REGION: 'auto' })); assert(/^ok    media is kept in R2 bucket carols-test, prefix send-a-carol\/$/m.test(r.out), 'the prefix is the app\'s own folder when it is not given:\n' + r.out);
    // storage half set (on the machine or off it): off, with what is missing; never a quiet fall back to a folder
    r = run(f, { R2_ENDPOINT: R2.R2_ENDPOINT, R2_BUCKET: R2.R2_BUCKET }); assert(r.code === 0 && /^off:  photos, songs and videos: not every storage setting is there \(missing: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY\)$/m.test(r.out) && clean(r.out), 'half the storage settings: off, and said:\n' + r.out);
    r = run(f, Object.assign({}, R2, { R2_SECRET_ACCESS_KEY: '' })); assert(r.code === 0 && /^off:  photos, songs and videos: not every storage setting is there \(missing: R2_SECRET_ACCESS_KEY\)$/m.test(r.out), r.out);
    assert.deepStrictEqual(await all(f), rows, 'and a failed check changed nothing either');
    // a saved carol that no longer opens stops the deploy, by its id
    await f.exec("INSERT INTO cards (id, uid, slug, state, v, occasion, template, title, doc, created, updated) VALUES ('czed000003', 'google:zed', NULL, 'draft', 1, 'birthday', 'a-template-that-was-removed', 'Gone', '" + doc + "', 3, 3)");
    r = run(f); assert(r.code === 1 && /^FAIL  carol czed000003 no longer opens: its template a-template-that-was-removed is gone$/m.test(r.out) && /^ok    2 of 3 saved carols open/m.test(r.out) && /CHECK FAILED: 1 thing wrong/.test(r.out), r.out);
  } finally { await f.done(); }
  // a column this build reads is not in the database (a table made by something older, which CREATE TABLE IF NOT EXISTS leaves as it is)
  f = await fresh();
  try {
    await f.exec('CREATE TABLE takes (id TEXT PRIMARY KEY, card TEXT, n INTEGER, job TEXT, akey TEXT, seconds DOUBLE PRECISION, timing TEXT, at BIGINT)');
    r = run(f); assert.strictEqual(r.code, 1, r.out); assert(/^FAIL  table takes \(id, card, n, job, akey, seconds, timing, words, peak, rms, at\): .*words/m.test(r.out), r.out);
    assert(/^FAIL  a statement in server\.js: .*(words|peak)[\s\S]*INSERT INTO takes/m.test(r.out) && /CHECK FAILED: \d+ things wrong/.test(r.out) && clean(r.out), r.out); assert.deepStrictEqual(await f.all('SELECT * FROM takes'), []);
  } finally { await f.done(); }
  // requiring the server (what every test does) never listens; and the guard that says so does bite
  f = await fresh();
  try {
    r = node(f, ['-e', "require('./server.js')"]); assert.strictEqual(r.code, 0, 'requiring server.js binds no port and asks the network for nothing:\n' + r.out); assert(clean(r.out), r.out);
    r = node(f, ['-e', "require('http').createServer(function () {}).listen(0)"]); assert.deepStrictEqual([r.code, /A PORT WAS BOUND/.test(r.out)], [97, true]);
    r = node(f, ['-e', "fetch('https://example.invalid/x')"]); assert.deepStrictEqual([r.code, /THE NETWORK WAS ASKED FOR https:\/\/example\.invalid\/x/.test(r.out)], [98, true]);
  } finally { await f.done(); }
  console.log('OK check (the command, on ' + (f.postgres ? 'Postgres' : 'SQLite') + '): exit 0 on an empty database (which it gives the schema) and on one with rows, none of them changed (a running job stays running); exit 1 on the machine with no DATABASE_URL or no SESSION_SECRET; a feature whose secret is missing (storage, payments, Google, email, the agent, the music, the admin) is said to be "off:" with the secret\'s name and stops nothing; exit 1 for a carol whose template is gone, and for a table missing a column, by its name; it bound no port and asked the network for nothing, and neither does requiring server.js');

  console.log('OK safe');
  await T.done(); process.exit(0);
})().catch(function (e) { console.error(e); Promise.resolve(T && T.done()).catch(function () {}).then(function () { process.exit(1); }); });
