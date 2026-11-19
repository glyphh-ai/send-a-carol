// node test/contract.cjs : THE SERVER STAYS COMPATIBLE WITH THE PAGES OF THE RELEASE BEFORE (SPEC.md, "Safe builds").
// After a deploy, browsers go on running the page they loaded: a maker in the middle of a carol, a card somebody is
// watching. test/contract.json is what such a page relies on, written down: every route (method and path), and for
// the calls the pages make (SHAPES below) what is sent and what is read back, field by field, with its type.
// This test asks the server itself (handle, in this process: no port, no network, a throwaway database):
//   - every route in the snapshot must still be answered by something;
//   - every request kept in the snapshot is sent again exactly as the old page sends it, and must still be a 200;
//   - every field the snapshot says comes back must still come back, with the same type.
// Anything gone or changed FAILS. Something new (a route, a field) passes, and is only said; it goes into the
// snapshot with  node test/contract.cjs --accept  (which refuses while anything fails). To take something away for
// good, do it a release after the pages stopped using it, and take it out of contract.json by hand in that change.
//   node test/contract.cjs --accept /tmp/contract.json   writes the new snapshot somewhere else
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
// (a small video, and room for this test to make many carols and send many emails in one day)
process.env.CONFIG_OVERRIDE = JSON.stringify({ video: { sizes: { story: [270, 480], square: [270, 270] } }, limits: { carolsPerDay: 100000, agentCallsPerDay: 100000, freeDrafts: 100000, emailsPerDay: 100000, recipientsPerCarol: 100000 } });
const K = require('./kit.cjs'), FILE = path.join(__dirname, 'contract.json'), accept = process.argv.indexOf('--accept'), out = accept >= 0 ? process.argv[accept + 1] || FILE : '';
// What THIS build's pages send, each as the page sends it: by nobody or by an account. In a path ":id" is a carol, and
// "on" says which: draft (answers only), ready (finished), new (a draft of its own), written (one of its own, with
// words), queued (one of its own, its song asked for). In what is sent, :draft :ready :slug :template :pid0 :pid1
// :session stand for this run's ids.
const ANSWERS = { to: 'Grandma June', from: 'The Timmermans', relation: 'grandparents', details: 'Biscuit the dog ate the gingerbread house.', must: 'Biscuit', own: '' };
const SHAPES = {
  'GET /api/me': [{ as: 'nobody' }, { as: 'account' }],
  'GET /api/templates': [{ as: 'nobody' }, { as: 'account', query: { q: 'a', occasion: '', family: '', page: 1, per: 12 } }],
  'GET /api/landing': [{ as: 'nobody' }],
  'POST /api/cards': [{ as: 'account', key: true, body: { template: ':template', answers: ANSWERS } }],
  'GET /api/cards': [{ as: 'account' }, { as: 'account', query: { q: 'carol', state: 'ready', page: 1 } }],
  'GET /api/cards/:id': [{ as: 'account', on: 'draft' }, { as: 'account', on: 'ready' }],
  'POST /api/cards/:id/save': [{ as: 'account', on: 'draft', key: true, body: { v: 1, answers: ANSWERS } },
    { as: 'account', on: 'ready', key: true, body: { v: 1, script: { title: 'A Carol for Grandma June', greeting: 'Hello, Grandma June!', signoff: 'With love, The Timmermans', lyrics: [{ section: 'verse', lines: ['The lights are up along the street tonight', 'And every window has a little glow'] }, { section: 'hook', lines: ['So here is a carol, made for you'] }], scenes: [{ pid: ':pid1', caption: 'By the tree' }, { pid: ':pid0', caption: '' }] }, notes: { ':pid0': 'Grandma June and Theo' }, template: ':template', slug: ':slug' } }],
  'POST /api/cards/:id/write': [{ as: 'account', on: 'new', body: { answers: ANSWERS } }, { as: 'account', on: 'written', body: { ask: 'funnier' } }, { as: 'account', on: 'new', body: { answers: { to: 'Sam', from: 'Ada', relation: 'friend', details: 'Make it to the tune of a song everybody knows.', must: '', own: '' } } }],
  'POST /api/cards/:id/song': [{ as: 'account', on: 'written', key: true, body: {} }],
  'GET /api/cards/:id/status': [{ as: 'account', on: 'draft' }, { as: 'account', on: 'queued' }, { as: 'account', on: 'ready' }],
  'GET /api/card/:slug': [{ as: 'nobody' }],
  'POST /api/buy': [{ as: 'account', key: true, body: { pack: 'one', card: ':draft' } }, { as: 'account', key: true, body: { pack: 'five' } }],
  'GET /api/buy/confirm': [{ as: 'account', query: { session_id: ':session' } }],
  'GET /api/slug': [{ as: 'nobody', query: { s: 'a-name-nobody-has-2026', card: ':draft' } }, { as: 'account', query: { s: ':slug', card: ':draft' } }],
  'POST /api/report': [{ as: 'nobody', body: { slug: ':slug', why: 'other', text: 'A test of the report form.' } }],
  'POST /api/cards/:id/email': [{ as: 'account', on: 'ready', key: true, body: { to: ['june@example.test'], note: 'Open it with the sound on.', know: true } }],
};
const kind = function (v) { return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; };
// every field of an answer, by its path ("card.answers.to", "items[].state"), with the kinds of thing seen there
function fields(v, at, into) {
  if (at) (into[at] = into[at] || {})[kind(v)] = 1;
  if (Array.isArray(v)) v.forEach(function (x) { fields(x, at + '[]', into); }); else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { fields(v[k], at ? at + '.' + k : k, into); });
  return into;
}
const flat = function (o) { const r = {}; Object.keys(o).sort().forEach(function (k) { r[k] = Object.keys(o[k]).sort().join('|'); }); return r; };
let T, S;
(async function () {
  T = await K.open('contract'); S = T.S;
  const tpl = require('../templates.js').list[0].id, ann = await T.user('google:ann', 'ann@example.test', 200), call = T.call;
  // something for every answer to hold: a finished carol with two photos, a draft, a purchase; nothing is rendered after this
  const ready = await T.carol(ann, { photos: 2, slug: 'contract-carol-2026' }), fresh = async function () { return (await call('POST', '/api/cards', { template: tpl, answers: ANSWERS }, ann)).json.card; }, draft = await fresh();
  const admin = { cookie: /saca=[^;]+/.exec((await call('POST', '/api/admin/login', { password: 'open-sesame' })).heads['set-cookie'])[0] };
  assert.deepStrictEqual([ready.state, ready.photos.length, ready.pids.length, draft.state], ['ready', 2, 2, 'draft']);
  const base = { draft: draft.id, ready: ready.id, slug: ready.slug, template: tpl, pid0: ready.pids[0], pid1: ready.pids[1] };
  const fill = function (v, ctx) { return JSON.parse(JSON.stringify(v === undefined ? null : v).replace(/:(draft|ready|slug|template|pid0|pid1|session)\b/g, function (m, k) { return ctx[k] === undefined ? m : ctx[k]; })); };
  // this send's own ids: the carol it is about, and a paid checkout session when it asks about one
  async function ctxOf(x) {
    const ctx = Object.assign({}, base); ctx.id = x.on === 'draft' ? draft.id : ready.id;
    if (x.on === 'new') ctx.id = (await fresh()).id;
    if (x.on === 'written' || x.on === 'queued') ctx.id = (await T.carol(ann, { photos: 0, song: false })).id;
    if (x.on === 'queued') { const r = await call('POST', '/api/cards/' + ctx.id + '/song', {}, ann); assert.strictEqual(r.status, 200, r.text); }
    if (JSON.stringify(x).indexOf(':session') >= 0) { const r = await call('POST', '/api/buy', { pack: 'one' }, ann); assert.strictEqual(r.status, 200, r.text); ctx.session = Object.keys(T.fakes.stripe.sessions).pop(); }
    return ctx;
  }
  // is there something behind this route? (anything but the server's own "not found", or a method it does not take)
  const examples = fs.existsSync(path.join(K.ROOT, 'examples')) ? fs.readdirSync(path.join(K.ROOT, 'examples')).filter(function (f) { return /^[A-Za-z0-9][\w.-]*$/.test(f); }) : [], unasked = [];
  async function answered(route) {
    const m = route.split(' ')[0]; let p = route.split(' ')[1];
    if (p === '/examples/:file' && !examples.length) { if (unasked.indexOf(route) < 0) unasked.push(route); return true; }   // (nothing to ask for yet)
    // (anything that changes a carol is asked of a spare one, so the finished carol stays as it is)
    if (p.indexOf('/api/cards/:id') === 0 && m !== 'GET') p = p.replace(':id', (await fresh()).id).replace(':pid', 'pNOTTHERE1');
    p = p.replace('/assets/:file', '/assets/glyphh-logo-black.png').replace('/fonts/:file', '/fonts/Lobster-Regular.ttf').replace('/examples/:file', '/examples/' + examples[0]).replace('/legal/:page', '/legal/terms')
      .replace(':id', ready.id).replace(':slug', ready.slug).replace(':pid', ready.pids[0]).replace(':take', ready.take).replace(':n', '0');
    const r = await call(m, p, m === 'GET' ? null : {}, p.indexOf('/api/admin/') === 0 ? admin : ann);
    return !(r.status === 405 || (r.status === 404 && (/^not found$/.test(r.text) || /That card is not here/.test(r.text) || (r.json && /^not[ _]found$/.test(r.json.error || '')))));
  }
  // one call of a page's, sent as it is written down; the status and the answer
  let keys = 0;
  async function send(route, x) {
    const ctx = await ctxOf(x), q = fill(x.query, ctx), url = route.split(' ')[1].replace(':id', ctx.id).replace(':slug', ctx.slug) + (q ? '?' + new URLSearchParams(q) : '');
    return call(route.split(' ')[0], url, x.body ? fill(x.body, ctx) : null, Object.assign(x.key ? { 'idempotency-key': 'contract-key-' + (++keys) } : {}, x.as === 'account' ? ann : {}));
  }
  async function shapeOf(route, list) {
    const req = { query: {}, body: {} }, res = {}, bad = [];
    for (const x of list) {
      fields(x.query || {}, '', req.query); fields(x.body || {}, '', req.body);
      const r = await send(route, x); if (r.status !== 200) bad.push(route + ' as ' + x.as + (x.on ? ' on a ' + x.on + ' carol' : '') + ' with ' + JSON.stringify(x.query || x.body || {}) + ' answered ' + r.status + ': ' + r.text.slice(0, 160)); else fields(r.json, '', res);
    }
    return { shape: { sends: list, query: flat(req.query), body: flat(req.body), answers: flat(res) }, bad: bad };
  }

  // ---- what this build is ----
  const now = { note: 'Written by node test/contract.cjs --accept. What the pages of a release rely on: see test/contract.cjs.', routes: S.ROUTES.slice().sort(), calls: {} }, failed = [], added = [];
  for (const route of now.routes) if (!await answered(route)) failed.push('this build lists the route ' + route + ' and does not answer it');
  for (const route of Object.keys(SHAPES)) { assert(S.ROUTES.indexOf(route) >= 0, route + ' is a route'); const s = await shapeOf(route, SHAPES[route]); s.bad.forEach(function (b) { failed.push('this build refuses its own page: ' + b); }); now.calls[route] = s.shape; }
  // (the two answers of the agent, both written down: the words, and a kind refusal)
  assert.deepStrictEqual([now.calls['POST /api/cards/:id/write'].answers.ok, now.calls['POST /api/cards/:id/write'].answers.refused, now.calls['POST /api/cards/:id/write'].answers.message], ['boolean', 'boolean', 'string'], 'the agent wrote, and the agent declined');
  assert.strictEqual(now.calls['GET /api/cards/:id/status'].answers.job, 'null|object'); assert.strictEqual(now.calls['GET /api/cards/:id'].answers['card.script'], 'null|object'); assert.strictEqual(now.calls['GET /api/me'].answers.user, 'null|object');

  // ---- held against what was written down ----
  const old = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : null;
  if (!old && !out) failed.push('there is no test/contract.json: write the first one with --accept');
  async function hold(old, failed, added) {
    for (const route of old.routes) if (!await answered(route)) failed.push('GONE: the route ' + route + ' (a page of the release before may still ask for it)');
    now.routes.forEach(function (r) { if (old.routes.indexOf(r) < 0) added.push('a new route: ' + r); });
    for (const route of Object.keys(old.calls)) {
      const was = old.calls[route], s = await shapeOf(route, was.sends), is = now.calls[route] || { query: {}, body: {}, answers: {} };
      s.bad.forEach(function (b) { failed.push('REFUSED: what a page of the release before sends is no longer taken: ' + b); });
      Object.keys(was.answers).forEach(function (k) { if (!(k in s.shape.answers)) failed.push('GONE: ' + route + ' no longer answers with "' + k + '" (' + was.answers[k] + ')'); else if (s.shape.answers[k] !== was.answers[k]) failed.push('CHANGED: ' + route + ' answers "' + k + '" as ' + s.shape.answers[k] + ', and it was ' + was.answers[k]); });
      ['query', 'body'].forEach(function (part) { Object.keys(was[part]).forEach(function (k) { if (now.calls[route] && !(k in is[part])) added.push('this build\'s page no longer sends "' + k + '" to ' + route + ' (the server must go on taking it for a release)'); else if (now.calls[route] && is[part][k] !== was[part][k]) failed.push('CHANGED: ' + route + ' is sent "' + k + '" as ' + is[part][k] + ', and it was ' + was[part][k]); });
        Object.keys(is[part]).forEach(function (k) { if (!(k in was[part])) added.push(route + ' is now sent "' + k + '" (' + is[part][k] + ')'); }); });
      Object.keys(is.answers).forEach(function (k) { if (!(k in was.answers)) added.push(route + ' now answers with "' + k + '" (' + is.answers[k] + ')'); });
    }
    Object.keys(now.calls).forEach(function (r) { if (!old.calls[r]) added.push('a new call written down: ' + r); });
  }
  if (old) await hold(old, failed, added);
  // and the test itself is tested: a snapshot that relies on routes, a field, types and a request this server does
  // not have must be caught, each by name, and nothing else with them
  if (old && !failed.length) {
    const lie = JSON.parse(JSON.stringify(old)), caught = [];
    lie.routes.push('GET /api/friends', 'GET /friends/list', 'DELETE /make'); lie.calls['GET /api/me'].answers.crowns = 'number'; lie.calls['GET /api/me'].answers['config.name'] = 'number'; lie.calls['GET /api/cards'].answers['items[].opens'] = 'string';
    lie.calls['POST /api/cards'].sends.push({ as: 'account', body: { template: 'a-template-on-the-moon' } });
    await hold(lie, caught, []);
    assert.deepStrictEqual(caught.map(function (c) { return c.replace(/( as account with ).*$/, '$1'); }).sort(), ['CHANGED: GET /api/cards answers "items[].opens" as number, and it was string', 'CHANGED: GET /api/me answers "config.name" as string, and it was number', 'GONE: GET /api/me no longer answers with "crowns" (number)',
      'GONE: the route DELETE /make (a page of the release before may still ask for it)', 'GONE: the route GET /api/friends (a page of the release before may still ask for it)', 'GONE: the route GET /friends/list (a page of the release before may still ask for it)',
      'REFUSED: what a page of the release before sends is no longer taken: POST /api/cards as account with '], 'a route, a field, a type or a request that is gone is caught, and only those:\n' + caught.join('\n'));
  }
  if (failed.length) { console.error('CONTRACT BROKEN (' + failed.length + '):\n  ' + failed.join('\n  ') + '\nA page of the release before would break on this server. Keep the route or the field for one more release (SPEC.md, "Safe builds").'); await T.done(); process.exit(1); }
  if (out) { fs.writeFileSync(out, JSON.stringify(now, null, 2) + '\n'); console.log('OK contract: written to ' + out + ' (' + now.routes.length + ' routes, ' + Object.keys(now.calls).length + ' calls' + (added.length ? '; new: ' + added.join('; ') : '') + ')'); }
  else {
    if (added.length) console.log('   (new since the snapshot, not yet written into it: ' + added.join('; ') + '. Write them down with: node test/contract.cjs --accept)');
    if (unasked.length) console.log('   (not asked for, there is nothing behind it yet: ' + unasked.join(', ') + ')');
    const count = Object.keys(old.calls).reduce(function (a, r) { return a + Object.keys(old.calls[r].answers).length + Object.keys(old.calls[r].query).length + Object.keys(old.calls[r].body).length; }, 0);
    assert(old.routes.length > 50 && Object.keys(old.calls).length >= 16 && count > 300, 'the snapshot holds the routes and the calls: ' + old.routes.length + ' routes, ' + Object.keys(old.calls).length + ' calls, ' + count + ' fields');
    console.log('OK contract: all ' + old.routes.length + ' routes in the snapshot are still answered, the ' + Object.keys(old.calls).length + ' calls the pages make are taken as the pages of the release before send them, and all ' + count + ' of their fields are there with the same types' + (added.length ? ' (' + added.length + ' new)' : ''));
  }
  await T.done(); process.exit(0);
})().catch(function (e) { console.error(e); Promise.resolve(T && T.done()).catch(function () {}).then(function () { process.exit(1); }); });
