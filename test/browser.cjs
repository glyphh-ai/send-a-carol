// node test/browser.cjs : THE PAGES AND SAFE BUILDS IN A REAL BROWSER (SPEC.md, "Safe builds"). A headless browser is
// driven through the server's own handle (test/kit.cjs routes its requests into it in this process: no port is
// bound, nothing reaches the network, the database is a throwaway one), from a copy of the client's files that the
// test can change, which is what a deploy does: deploy() changes net.js in the copy and has the server work out its
// build again. The machine restarting or losing an answer is played by the route (ctx.net.mode / only).
//   pages    every page loads with no error, on a phone (390x844) and a desktop (1280x800)
//   reload   a page that was open through a deploy reloads itself once, at a safe moment, where it was: not while
//            something is held, a field is in use, a save is waiting or the tab is away; Reload and Not now on the note
//   outbox   a save through 503s, a refused connection and a lost answer is applied exactly once, with one key;
//            only the newest save of a carol waits; a refusal is said once and dropped; a save waits through a
//            closed tab; SAC.send tries again with one key
//   maker    /make holds the reload while a field has changes that are not saved yet
//   card     the present is opened by taps; the end has its three buttons; the maker's address is nowhere in it
// It needs Playwright (not a dependency of the app): NODE_PATH with it, or PLAYWRIGHT_PATH. Without it: skipped.
'use strict';
const assert = require('assert'), os = require('os'), fs = require('fs'), path = require('path');
const SKIP = 'SKIPPED browser: Playwright is not here (set NODE_PATH or PLAYWRIGHT_PATH)';
try { require.resolve(process.env.PLAYWRIGHT_PATH || 'playwright'); } catch (e) { console.log(SKIP); process.exit(0); }
const ROOT = path.join(__dirname, '..');
// the copy of the client that is served, and changed (made BEFORE the server is loaded: it reads CLIENT_DIR as it starts)
const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-client-'));
fs.readdirSync(ROOT).filter(function (f) { return /\.(html|js|css)$/.test(f) && fs.statSync(path.join(ROOT, f)).isFile(); }).forEach(function (f) { fs.copyFileSync(path.join(ROOT, f), path.join(copy, f)); });
process.env.CLIENT_DIR = copy;
process.env.CONFIG_OVERRIDE = JSON.stringify({ video: { sizes: { story: [270, 480], square: [270, 270] } } });   // a small video: seconds, not half a minute
const K = require('./kit.cjs');
const sleep = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
const GSI = 'window.google = { accounts: { id: { initialize: function () {}, renderButton: function (el) { if (el) el.textContent = "Sign in with Google"; }, prompt: function () {}, cancel: function () {}, disableAutoSelect: function () {} } } };';
let T, S, B, builds = 0;
const pending = function (f) { return fs.statSync(path.join(copy, f)).size < 200; };
// A DEPLOY: a client file changes, and the server works out which build it now is
function deploy() { fs.appendFileSync(path.join(copy, 'net.js'), '\n// build ' + (++builds) + '\n'); const was = S.build(), now = S.rebuild(); assert.notStrictEqual(now, was); return now; }
// a browser of its own: { who } signed in, { admin }, { wide } for the desktop. Google's sign-in script is a stand-in.
async function open(o) {
  o = o || {}; const c = await B.context(Object.assign(o.wide ? { viewport: { width: 1280, height: 800 }, scale: 1 } : { mobile: true }, o));
  await c.ctx.route('https://accounts.google.com/**', function (route) { return route.fulfill({ status: 200, contentType: 'text/javascript', body: GSI }); });
  return c;
}
// wait until something is true in the page, through a reload if one happens (the page is asked again and again)
async function until(page, fn, arg, ms, what) {
  const end = Date.now() + (ms || 8000); let last = '';
  while (Date.now() < end) { try { if (await page.evaluate(fn, arg)) return Date.now(); } catch (e) { last = String(e.message).split('\n')[0]; } await sleep(60); }
  throw new Error('waited ' + (ms || 8000) + ' ms for: ' + (what || fn) + (last ? '\n  the page: ' + last : ''));
}
const settle = async function (page) { try { await page.waitForLoadState('networkidle', { timeout: 6000 }); } catch (e) { /* a page that keeps asking */ } await sleep(250); };
const sac = function (page) { return until(page, function () { return !!(window.SAC && window.SAC.build && document.body); }, null, 10000, 'net.js in the page'); };
const mark = function (page) { return page.evaluate(function () { window.__mark = 1; }); };
const marked = function (page) { return page.evaluate(function () { return window.__mark || 0; }).catch(function () { return 0; }); };
const reloaded = function (page, ms) { return until(page, function () { return !window.__mark && !!(window.SAC && window.SAC.build && document.readyState === 'complete'); }, null, ms || 6000, 'the page to have reloaded itself'); };
const hear = function (page) { return page.evaluate(function () { return window.SAC.call('/api/me').then(function () { return 1; }); }).catch(function () { return 0; }); };   // any answer from the server tells the page its build
const see = function (page) { return page.evaluate(function () { const el = document.getElementById('sac-fresh'); return { build: window.SAC.build, fresh: window.SAC.fresh(), note: !!el && !el.hidden, says: el ? el.textContent : '', mark: window.__mark || 0, url: location.pathname + location.search + location.hash, held: window.SAC.held().join(), box: window.SAC.waiting().length }; }); };
const away = function (page, on) { return page.evaluate(function (on) { Object.defineProperty(document, 'hidden', { configurable: true, get: function () { return on; } }); document.dispatchEvent(new Event('visibilitychange')); }, on); };   // the tab is left, or come back to
const online = function (page) { return page.evaluate(function () { window.dispatchEvent(new Event('online')); }); };
const noteButton = function (page, text) { return page.evaluate(function (text) { const b = Array.from(document.querySelectorAll('#sac-fresh button')).find(function (x) { return x.textContent === text; }); b.click(); }, text).catch(function () { /* the page went with the click */ }); };
// what a page said that it should not have. A 401 or a 404 that the page asked for on purpose is named by the caller.
const wrong = function (c, allow) { return c.errors.filter(function (e) { return !(allow && allow.test(e)); }); };

(async function () {
  T = await K.open('browser', { env: { CLIENT_DIR: copy } }); S = T.S;
  B = await K.browser(T); if (!B) { console.log(SKIP); await T.done(); process.exit(0); }
  assert(S.CLIENT.every(function (f) { return fs.existsSync(path.join(copy, f)); }) && S.buildOf(copy) === S.build(), 'the server serves the copy, and the copy is the whole client');
  const tpl = require('../templates.js').list[0].id, ann = await T.user('google:ann', 'ann@example.test', 5), n = async function (sql, p) { return Number((await S.db.get(sql, p)).n); };
  await S.db.run('UPDATE users SET name = ? WHERE id = ?', ['Ann Example', 'google:ann']);
  const ready = await T.carol(ann, { photos: 2, slug: 'the-hollisters-2026' }), mk = { template: tpl, answers: { to: 'Sam', from: 'Ada', relation: 'friend', details: 'Sam bakes bread every Sunday.' } };
  const written = await T.carol(ann, { photos: 1, song: false }), draft = (await T.call('POST', '/api/cards', mk, ann)).json.card, docOf = async function (id) { return JSON.parse((await S.db.get('SELECT doc FROM cards WHERE id = ?', [id])).doc); };
  const waiting = [];   // pages that are still placeholders: said, not failed
  let c, page, s, b0, b1, at;

  // ---- every page loads, on a phone and on a desktop, and says nothing is wrong ----
  const PAGES = [['/', 'landing.html', {}], ['/pricing', 'landing.html', {}], ['/make', 'app.html', {}], ['/make', 'app.html', { who: 'google:ann' }], ['/make?card=' + draft.id, 'app.html', { who: 'google:ann' }], ['/make?card=' + ready.id, 'app.html', { who: 'google:ann' }],
    ['/' + ready.slug, 'card.html', {}], ['/' + ready.slug + '?at=end', 'card.html', {}], ['/admin', 'admin.html', {}, /status of 401/], ['/admin', 'admin.html', { admin: true }], ['/legal', '', {}], ['/legal/refunds', '', {}], ['/no-such-card-here', '', {}, /status of 404/]];
  const SCRIPT = { 'landing.html': 'landing.js', 'app.html': 'app.js', 'card.html': 'card.js', 'admin.html': 'admin-ui.js' }; let loaded = 0;
  for (const wide of [false, true]) for (const x of PAGES) {
    const what = x[0] + (x[2].who ? ' (signed in)' : x[2].admin ? ' (the admin)' : '') + ' at ' + (wide ? '1280x800' : '390x844');
    if (x[1] && (pending(x[1]) || pending(SCRIPT[x[1]]))) { const w = x[1] + (pending(x[1]) ? '' : ' (' + SCRIPT[x[1]] + ')'); if (waiting.indexOf(w) < 0) waiting.push(w); continue; }
    c = await open(Object.assign({ wide: wide }, x[2])); page = await c.page(x[0]); await settle(page);
    const got = await page.evaluate(function () { return { title: document.title, text: document.body.innerText.length, build: window.SAC_BUILD || '', w: innerWidth }; });
    assert.deepStrictEqual(wrong(c, x[3]), [], what + ' says something is wrong:\n  ' + c.errors.join('\n  '));
    assert(got.title.length > 3 && got.w === (wide ? 1280 : 390), what + ': ' + JSON.stringify(got)); if (x[1]) assert.strictEqual(got.build, S.build(), what + ' knows its build');
    loaded++; await c.ctx.close();
  }
  waiting.forEach(function (w) { console.log('PENDING ' + w + ' (still a placeholder: not loaded in the browser)'); });
  console.log('OK pages: ' + loaded + ' loads (' + PAGES.length + ' addresses, on a phone at 390x844 and a desktop at 1280x800) with no page error and no console error' + (waiting.length ? '; PENDING ' + waiting.join(', ') : ''));

  // ---- the safe reload (net.js), on a page that is doing nothing ----
  const HOME = '/pricing?from=a-test#prices', docs = function (c, since) { return c.log.slice(since || 0).filter(function (l) { return l.m === 'GET' && l.p === '/pricing'; }).length; };
  c = await open({ who: 'google:ann' }); page = await c.page(HOME); await sac(page); await settle(page); b0 = S.build();
  s = await see(page); assert.deepStrictEqual([s.build, s.fresh, s.note, s.url], [b0, '', false, HOME], 'the page knows the build it was loaded with');
  assert(c.log.some(function (l) { return l.p === '/net.js'; }), 'and asked for its scripts');
  await page.evaluate(function () { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
  await mark(page); b1 = deploy(); at = c.log.length; await sleep(1500);
  assert.deepStrictEqual([await marked(page), c.log.length], [1, at], 'a page that asks the server nothing is told nothing, and asks nothing to find out');
  await hear(page); await reloaded(page, 4000); await sac(page); s = await see(page);
  assert.deepStrictEqual([s.build, s.url, s.note, s.fresh, docs(c, at)], [b1, HOME, false, '', 1], 'its next answer says there is a new build: reloaded once, by itself, where it was');
  await mark(page); at = c.log.length; await hear(page); await hear(page); await sleep(1600); assert.deepStrictEqual([await marked(page), docs(c, at)], [1, 0], 'and not again for the build it now is');
  // the tab is away: nothing happens until it is come back to
  await away(page, true); b0 = b1; b1 = deploy(); at = c.log.length; await hear(page); await sleep(2200);
  s = await see(page); assert.deepStrictEqual([s.mark, s.fresh, s.build, docs(c, at)], [1, b1, b0, 0], 'heard of while the tab is away: no reload behind his back');
  await away(page, false); await reloaded(page, 4000); await sac(page); s = await see(page); assert.deepStrictEqual([s.build, s.url, docs(c, at)], [b1, HOME, 1], 'back in the tab: reloaded, once');
  console.log('OK reload, idle: a new build reloads an idle page once on its next answer (never by asking), keeping its address, and a tab that was away when it comes back');

  // ---- not while something is held, a field is in use, or a save is waiting; the note says so, and its buttons work ----
  await mark(page); await page.evaluate(function () { window.SAC.hold('x', true); }); b0 = b1; b1 = deploy(); at = c.log.length; await hear(page);
  await until(page, function () { const el = document.getElementById('sac-fresh'); return !!el && !el.hidden; }, null, 3000, 'the note'); await sleep(2400);
  s = await see(page); assert.deepStrictEqual([s.mark, s.note, /^New version ready/.test(s.says), s.held, s.build, docs(c, at)], [1, true, true, 'x', b0, 0], 'held: the note shows and nothing is reloaded: ' + JSON.stringify(s));
  const look = await page.evaluate(function () { const el = document.getElementById('sac-fresh'), r = el.getBoundingClientRect(); return { buttons: Array.from(el.querySelectorAll('button')).map(function (b) { return b.textContent; }), role: el.getAttribute('role'), in: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && r.top > innerHeight / 2 }; });
  assert.deepStrictEqual(look, { buttons: ['Reload', 'Not now'], role: 'status', in: true }, 'the note is at the bottom of the screen, whole, with its two buttons');
  await page.evaluate(function () { window.SAC.hold('x', false); }); await reloaded(page, 4000); await sac(page); s = await see(page); assert.deepStrictEqual([s.build, s.url, s.note, docs(c, at)], [b1, HOME, false, 1], 'let go: reloaded at once, once');
  // a field in use
  await mark(page); await page.evaluate(function () { const i = document.createElement('input'); i.id = 'a-test-field'; i.setAttribute('aria-label', 'a test field'); i.style.cssText = 'position:fixed;top:0;left:0;z-index:99999'; document.body.appendChild(i); i.focus(); });
  b0 = b1; b1 = deploy(); at = c.log.length; await hear(page); await sleep(2600);
  s = await see(page); assert.deepStrictEqual([s.mark, s.note, s.build, docs(c, at), await page.evaluate(function () { return document.activeElement.id; })], [1, true, b0, 0, 'a-test-field'], 'typing: the note, and no reload under his fingers');
  await page.evaluate(function () { document.activeElement.blur(); }); await reloaded(page, 4000); await sac(page); assert.deepStrictEqual([(await see(page)).build, docs(c, at)], [b1, 1], 'the field left: reloaded');
  // a save waiting in the outbox
  c.net.only = /\/save$/; c.net.mode = '503'; await mark(page); await page.evaluate(function (id) { window.SAC.save(id, { answers: { to: 'Held by the outbox' } }); }, draft.id);
  b0 = b1; b1 = deploy(); at = c.log.length; await hear(page); await sleep(2600);
  s = await see(page); assert.deepStrictEqual([s.mark, s.note, s.box, s.build, docs(c, at)], [1, true, 1, b0, 0], 'a save not yet answered: the note, and no reload'); assert.notStrictEqual((await docOf(draft.id)).answers.to, 'Held by the outbox');
  c.net.mode = 'ok'; await online(page); await reloaded(page, 6000); await sac(page); s = await see(page);
  assert.deepStrictEqual([s.build, s.box, docs(c, at), (await docOf(draft.id)).answers.to], [b1, 0, 1, 'Held by the outbox'], 'the save answered: reloaded, and the save is kept');
  // Reload, now; and Not now, which puts the note away and not the reload
  await mark(page); await page.evaluate(function () { window.SAC.hold('x', true); }); b0 = b1; b1 = deploy(); at = c.log.length; await hear(page); await until(page, function () { const el = document.getElementById('sac-fresh'); return !!el && !el.hidden; }, null, 3000, 'the note');
  const t0 = Date.now(); await noteButton(page, 'Reload'); await reloaded(page, 4000); await sac(page); s = await see(page); assert.deepStrictEqual([s.build, s.url, s.held, docs(c, at)], [b1, HOME, '', 1], 'Reload does it now, held or not'); assert(Date.now() - t0 < 3500, 'at once');
  await mark(page); await page.evaluate(function () { window.SAC.hold('x', true); }); b0 = b1; b1 = deploy(); at = c.log.length; await hear(page); await until(page, function () { const el = document.getElementById('sac-fresh'); return !!el && !el.hidden; }, null, 3000, 'the note');
  await noteButton(page, 'Not now'); await sleep(1600); s = await see(page); assert.deepStrictEqual([s.note, s.mark, s.build, docs(c, at)], [false, 1, b0, 0], 'Not now puts the note away and reloads nothing');
  await hear(page); await sleep(400); assert.strictEqual((await see(page)).note, false, 'and it stays away for that build');
  await page.evaluate(function () { window.SAC.hold('x', false); }); await reloaded(page, 4000); await sac(page); assert.deepStrictEqual([(await see(page)).build, docs(c, at)], [b1, 1], 'the reload still comes, when nothing is held');
  // never twice for one build: the page that comes back is still the old one (a copy kept somewhere on the way), and it does not go round
  const stale = (await T.call('GET', '/pricing')).text; await mark(page); b0 = b1; b1 = deploy(); at = c.log.length; let served = 0;
  await page.route('**/pricing*', function (route) { served++; return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', headers: { 'X-Build': b1, 'Cache-Control': 'no-cache' }, body: stale }); });
  await hear(page); await reloaded(page, 4000); await sac(page); await mark(page); await hear(page); await hear(page); await sleep(3200);
  s = await see(page); assert.deepStrictEqual([served, s.mark, s.build, s.fresh, s.note], [1, 1, b0, b1, true], 'reloaded once for the build, got the old page again, and stays: the note is there, no loop: ' + JSON.stringify(s));
  await page.unroute('**/pricing*'); await noteButton(page, 'Reload'); await reloaded(page, 4000); await sac(page); assert.strictEqual((await see(page)).build, b1, 'and Reload still takes him to the new build');
  assert.deepStrictEqual(wrong(c, /status of 503/), [], c.errors.join('\n')); await c.ctx.close();
  console.log('OK reload, held: while SAC.hold is set, a field is in use or a save waits in the outbox, the note "New version ready" shows and nothing reloads; letting go reloads once; Reload reloads at once; Not now hides the note only; never twice for one build (' + builds + ' deploys)');

  // ---- the outbox: a save is applied exactly once, whatever happens between the page and the server ----
  const saves = function (c, since) { return c.log.slice(since || 0).filter(function (l) { return l.m === 'POST' && /\/save$/.test(l.p); }); }, runs = [], run = S.db.run;
  S.db.run = function (sql, p) { if (/^UPDATE cards SET doc = /.test(sql)) runs.push(p[0]); return run.apply(S.db, arguments); };   // every time a carol's words are written
  const applied = function (to) { return runs.filter(function (d) { return JSON.parse(d).answers.to === to; }).length; };
  const tried = async function (c, since, k, mode) { for (let i = 0; i < 160; i++) { const a = saves(c, since); if (a.length >= k && a[a.length - 1].mode === mode) return a; await sleep(50); } throw new Error('waited for try ' + k + ' of the save (' + mode + '): ' + JSON.stringify(saves(c, since))); };
  c = await open({ who: 'google:ann' }); page = await c.page('/pricing'); await sac(page); await settle(page);
  await page.evaluate(function () { window.__saved = []; window.__refused = []; window.SAC.on('saved', function (id, r) { window.__saved.push([id, r.status, r.card && r.card.answers.to]); }); window.SAC.on('refused', function (id, r) { window.__refused.push([id, r.status, r.error]); }); });
  c.net.only = /\/save$/; c.net.mode = '503'; at = c.log.length;
  const k1 = await page.evaluate(function (id) { return window.SAC.save(id, { answers: { to: 'Through the storm' } }); }, draft.id);
  await tried(c, at, 1, '503'); await online(page); await tried(c, at, 2, '503');                    // the machine is restarting: the proxy's own 503 page
  c.net.mode = 'abort'; await online(page); await tried(c, at, 3, 'abort');                             // nothing is listening
  assert.deepStrictEqual([applied('Through the storm'), await page.evaluate(function () { return window.SAC.waiting().length; })], [0, 1], 'not yet applied, and still waiting');
  c.net.mode = 'lose'; await online(page); await tried(c, at, 4, 'lose'); await sleep(200);            // the server does it, and its answer never arrives
  assert.deepStrictEqual([applied('Through the storm'), await page.evaluate(function () { return [window.SAC.waiting().length, window.__saved.length]; })], [1, [1, 0]], 'applied on the server; the page does not know, and keeps it');
  c.net.mode = 'ok'; await online(page); await until(page, function () { return window.__saved.length === 1 && !window.SAC.waiting().length; }, null, 5000, 'the save to be answered');
  let all = saves(c, at); assert(all.length === 5 && /^[0-9a-f]{32}$/.test(k1) && all.every(function (l) { return l.key === k1; }), 'five tries, one key: ' + JSON.stringify(all));
  assert.deepStrictEqual([applied('Through the storm'), await page.evaluate(function () { return window.__saved; }), (await docOf(draft.id)).answers.to, await n('SELECT COUNT(*) AS n FROM idem WHERE ikey = ?', [k1])], [1, [[draft.id, 200, 'Through the storm']], 'Through the storm', 1], 'EXACTLY ONE applied save, and the page told once');
  await sleep(1200); assert.strictEqual(saves(c, at).length, 5, 'and it is not sent again');
  // only the newest save of a carol waits
  c.net.mode = '503'; at = c.log.length; const ks = await page.evaluate(function (id) { return ['First thought', 'Second thought', 'Third thought'].map(function (to) { return window.SAC.save(id, { answers: { to: to } }); }); }, draft.id);
  await tried(c, at, 1, '503'); s = await page.evaluate(function () { return window.SAC.waiting().map(function (x) { return [x.k, x.b.answers.to]; }); }); assert.deepStrictEqual(s, [[ks[2], 'Third thought']], 'three saves of one carol: one waits, the newest');
  await page.evaluate(function (id) { window.SAC.save(id, { answers: { to: 'Another carol' } }); }, ready.id); assert.strictEqual(await page.evaluate(function () { return window.SAC.waiting().length; }), 2, 'another carol\'s save waits beside it');
  c.net.mode = 'ok'; await online(page); await until(page, function () { return window.__saved.length === 3 && !window.SAC.waiting().length; }, null, 8000, 'both to be answered');
  assert.deepStrictEqual([(await docOf(draft.id)).answers.to, applied('First thought') + applied('Second thought'), applied('Third thought'), (await docOf(ready.id)).answers.to], ['Third thought', 0, 1, 'Another carol'], 'what is kept is the newest, applied once; the ones it replaced were never applied');
  // a refusal is an answer: said once, dropped, not sent again
  at = c.log.length; await page.evaluate(function (id) { window.SAC.save(id, { v: 99, answers: { to: 'From a page of tomorrow' } }); }, draft.id);
  await until(page, function () { return window.__refused.length === 1; }, null, 4000, 'the refusal'); await sleep(1300);
  assert.deepStrictEqual([await page.evaluate(function () { return [window.__refused, window.SAC.waiting().length, window.__saved.length]; }), saves(c, at).length, (await docOf(draft.id)).answers.to], [[[[draft.id, 409, 'This page is older than your carol. Reload it.']], 0, 3], 1, 'Third thought'], 'a 4xx is reported through SAC.on("refused"), dropped, and sent once');
  // a save made with the server away, the tab closed, and the site opened again later: the next page sends it
  c.net.mode = 'abort'; at = c.log.length; const k4 = await page.evaluate(function (id) { return window.SAC.save(id, { answers: { to: 'Kept through a closed tab' } }); }, draft.id);
  await tried(c, at, 1, 'abort'); await page.close(); assert.notStrictEqual((await docOf(draft.id)).answers.to, 'Kept through a closed tab');
  c.net.mode = 'ok'; page = await c.page('/'); await sac(page); await until(page, function () { return !window.SAC.waiting().length; }, null, 6000, 'the next page to send what waited');
  all = saves(c, at); assert(all.length === 2 && all[0].key === k4 && all[1].key === k4 && all[1].mode === 'ok', JSON.stringify(all)); assert.deepStrictEqual([(await docOf(draft.id)).answers.to, applied('Kept through a closed tab')], ['Kept through a closed tab', 1], 'sent by the next page, with the key it was given, once');
  // and across a reload of the same tab
  c.net.mode = 'abort'; at = c.log.length; await page.evaluate(function (id) { window.SAC.save(id, { answers: { to: 'Kept through a reload' } }); }, draft.id); await tried(c, at, 1, 'abort');
  c.net.mode = 'ok'; await mark(page); await page.reload({ waitUntil: 'load' }); await sac(page); await until(page, function () { return !window.SAC.waiting().length; }, null, 6000, 'the reloaded page to send what waited');
  assert.deepStrictEqual([(await docOf(draft.id)).answers.to, applied('Kept through a reload'), new Set(saves(c, at).map(function (l) { return l.key; })).size], ['Kept through a reload', 1, 1]);
  S.db.run = run;
  // SAC.send: a write that costs something is tried again with ONE key until it is answered, and is done once
  const cards = function () { return n('SELECT COUNT(*) AS n FROM cards WHERE uid = ?', ['google:ann']); }, posts = function (since) { return c.log.slice(since).filter(function (l) { return l.m === 'POST' && l.p === '/api/cards'; }); }, had = await cards();
  c.net.only = /^\/api\/cards$/; c.net.mode = '503'; at = c.log.length;
  await page.evaluate(function (mk) { window.__sent = null; window.SAC.send('/api/cards', mk).then(function (r) { window.__sent = { status: r.status, id: r.card && r.card.id }; }); }, mk);
  for (let i = 0; i < 100 && posts(at).length < 1; i++) await sleep(30); c.net.mode = 'lose';
  for (let i = 0; i < 200 && posts(at).length < 2; i++) await sleep(30); await sleep(150); assert.deepStrictEqual([await cards(), await page.evaluate(function () { return window.__sent; })], [had + 1, null], 'made on the server, the answer lost: the page is still asking');
  c.net.mode = 'ok'; await until(page, function () { return !!window.__sent; }, null, 8000, 'SAC.send to be answered');
  all = posts(at); s = await page.evaluate(function () { return window.__sent; });
  assert(all.length === 3 && /^[0-9a-f]{32}$/.test(all[0].key) && all.every(function (l) { return l.key === all[0].key; }), 'three tries (a 503, a lost answer, an answer), one key: ' + JSON.stringify(all));
  assert.deepStrictEqual([s.status, await cards(), await n('SELECT COUNT(*) AS n FROM cards WHERE id = ?', [s.id])], [200, had + 1, 1], 'one carol was made, and the page has it');
  assert.deepStrictEqual(wrong(c, /status of (503|409)|ERR_CONNECTION_(REFUSED|RESET)|net::ERR_FAILED/), [], c.errors.join('\n')); await c.ctx.close();
  console.log('OK outbox: SAC.save through two 503s, a refused connection and a lost answer is applied exactly once (5 tries, one Idempotency-Key); only the newest save of a carol waits; a 4xx is reported through SAC.on("refused") and dropped; a save waits through a closed tab and a reload and is sent by the next page; SAC.send tries again with one key and makes one carol');

  // ---- the maker's editor: a line that is changed and not yet saved holds the reload, and is not lost to it ----
  if (pending('app.html') || pending('app.js')) console.log('PENDING app.html (the editor holding the reload while a field has changes that are not saved)');
  else {
    const FIELD = '#main input[aria-label="Verse line 1"]', here = '/make?card=' + written.id + '&edit', makes = function (since) { return c.log.slice(since).filter(function (l) { return l.m === 'GET' && l.p === '/make'; }).length; };
    const line1 = async function () { return (await docOf(written.id)).script.lyrics[0].lines[0]; }, was1 = await line1();
    c = await open({ who: 'google:ann' }); page = await c.page(here); await sac(page); await page.waitForSelector(FIELD, { timeout: 15000 }); await settle(page);
    b0 = S.build(); await mark(page); assert.strictEqual(await page.evaluate(function () { return window.SAC.held().join(); }), '', 'an editor nobody has touched holds nothing');
    c.net.only = /\/save$/; c.net.mode = '503';   // the server is away while he types
    await page.evaluate(function (sel) { const el = document.querySelector(sel); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }, FIELD); await page.keyboard.type(' tra la la');
    assert.strictEqual(await page.evaluate(function () { return window.SAC.held().join(); }), 'editing', 'a changed line holds the reload from its first letter');
    b1 = deploy(); at = c.log.length; await page.evaluate(function () { document.activeElement.blur(); }); await hear(page); await sleep(2600);
    s = await see(page); assert.deepStrictEqual([s.mark, s.note, s.build, makes(at), await line1()], [1, true, b0, 0, was1], 'the field left, the change not yet saved (the server is away): the note, and no reload: ' + JSON.stringify(s));
    assert(s.held.indexOf('editing') >= 0 && s.box === 1, 'held by the editor, and waiting in the outbox: ' + JSON.stringify(s));
    c.net.mode = 'ok'; await online(page); for (let i = 0; i < 100 && await line1() === was1; i++) await sleep(50);
    assert.strictEqual(await line1(), was1 + ' tra la la', 'the server is back: the save is answered');
    try { await reloaded(page, 8000); } catch (e) { s = await see(page); throw new Error('the save was answered and the editor still holds the reload (SAC.held(): "' + s.held + '", waiting in the outbox: ' + s.box + '). The editor is not told that its save was kept (its SAC.on("saved") listener), so "editing" is never let go and the page never moves to the new build.'); }
    await sac(page); await page.waitForSelector(FIELD, { timeout: 15000 });
    s = await see(page); assert.deepStrictEqual([s.build, s.url, makes(at), await line1(), await page.inputValue(FIELD)], [b1, here, 1, was1 + ' tra la la', was1 + ' tra la la'], 'saved, then reloaded into the new build, in the editor, with the line as he left it');
    assert.deepStrictEqual(wrong(c, /status of 503/), [], c.errors.join('\n')); await c.ctx.close();
    console.log('OK maker: in the editor a changed line holds the reload until its save is answered (through a server that was away), and the new build opens with the line as it was left');
  }

  // ---- THE MAKER'S PATHS, driven as a maker would: the draft is made when the conversation starts, a HEIC photo,
  //      the refusal, "buy a pack", who it is for, a photo moved in its frame, reordering, "Update the video" from
  //      the server's word, takes, email, take down / put back, delete ----
  {
    const cp = require('child_process'), bea = await T.user('google:bea', 'bea@example.test', 3); await S.db.run('UPDATE users SET name = ?, paid = 1 WHERE id = ?', ['Bea Maker', 'google:bea']);
    const click = async function (sel) { await page.locator(sel).first().click(); }, text = function (t) { return page.getByText(t, { exact: false }).first(); }, button = function (name) { return page.getByRole('button', { name: name }).first(); };
    const cardsOf = function (uid) { return S.db.all("SELECT * FROM cards WHERE uid = ? AND state <> 'deleted' ORDER BY created", [uid]); }; let r;
    // 1. the conversation: the card exists from the first answer, not from the first photo
    c = await open({ who: 'google:bea' }); page = await c.page('/make?new'); await sac(page); await page.waitForSelector('.convo .chip', { timeout: 15000 });
    assert.strictEqual((await cardsOf('google:bea')).length, 0, 'opening the conversation makes nothing');
    await page.getByRole('radio', { name: /Christmas/ }).click(); await until(page, function () { return /card=/.test(location.search); }, null, 8000, 'the card to be made at the first answer');
    let mine = await cardsOf('google:bea'); assert.strictEqual(mine.length, 1, 'ONE draft, made when the conversation started'); const did = mine[0].id; assert.strictEqual(mine[0].state, 'draft');
    await page.waitForSelector('input[placeholder="Grandma Dot"]'); await page.fill('input[placeholder="Grandma Dot"]', 'Nana Bo'); await page.fill('input[placeholder="The Hollisters"]', 'The Okafors'); await button('Continue').click();
    await page.waitForSelector('.gal-item', { timeout: 15000 }); await button('Use this look').click();
    // 2. photos: nothing can be added until the rights box is ticked; then a HEIC straight from a phone
    await page.waitForSelector('.drop'); assert.strictEqual(await button('Add photos').isDisabled(), true, 'no photo before the maker ticks that they may use it');
    await page.getByRole('checkbox', { name: 'I have the right to use these photos' }).check(); assert.strictEqual(await button('Add photos').isDisabled(), false);
    const hdir = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-heic-b-')), png = path.join(hdir, 'porch.png'), heic = path.join(hdir, 'IMG_0042.HEIC'); fs.writeFileSync(png, K.photo(2, 1600, 1200));
    const sips = cp.spawnSync('sips', ['-s', 'format', 'heic', png, '--out', heic]).status === 0 && fs.existsSync(heic);
    await page.locator('.drop input[type=file]').first().setInputFiles(sips ? heic : png);
    await until(page, function () { return !!document.querySelector('.ph input[aria-label="Who is in this photo"]'); }, null, 20000, 'the photo to be added');
    let ph = await S.db.all('SELECT * FROM photos WHERE card = ?', [did]); assert.strictEqual(ph.length, 1); assert.strictEqual(ph[0].w, 1600, 'at its own shape'); if (sips) assert(/-o\.heic$/.test(ph[0].okey), 'the HEIC was sent as it is (this browser cannot read it) and converted by the server: ' + ph[0].okey);
    await until(page, function () { const im = document.querySelector('.ph img'); return !!im && im.naturalWidth > 0; }, null, 8000, 'the converted photo to show in the page');
    fs.writeFileSync(png, K.photo(3, 1200, 1600)); await page.locator('.drop input[type=file]').first().setInputFiles(png); await until(page, function () { return document.querySelectorAll('.ph input[aria-label="Who is in this photo"]').length === 2; }, null, 20000, 'the second photo');
    await button('Continue with 2 photos').click();
    // 3. the refusal: said kindly in a bubble, with a way forward, and nothing is written
    await page.waitForSelector('textarea[aria-label="True details to sing about"]'); await page.fill('textarea[aria-label="True details to sing about"]', 'Write something to humiliate her in front of everyone.'); await button('Continue').click(); await button('Skip').click();
    await button('Write my carol').click(); await page.waitForSelector('.convo [role=alert] .say', { timeout: 15000 });
    s = await page.evaluate(function () { const a = document.querySelector('.convo [role=alert]'); return { say: a.querySelector('.say').textContent, hint: a.querySelector('p').textContent, again: !!Array.from(document.querySelectorAll('button')).find(function (b) { return b.textContent === 'Try again'; }) }; });
    assert(/can't write that one/.test(s.say) && /Change a detail above/.test(s.hint) && s.again, 'the refusal bubble: ' + JSON.stringify(s)); assert.strictEqual(JSON.parse((await cardsOf('google:bea'))[0].doc).script, null, 'nothing was written');
    await page.getByRole('button', { name: /Change your answer: Write something/ }).click(); await page.fill('textarea[aria-label="True details to sing about"]', 'Nana Bo wins at dominoes and hums while she cooks.'); await button('Continue').click();
    await button('Write my carol').click(); await page.waitForSelector('#main input[aria-label="Verse line 1"]', { timeout: 20000 }); await settle(page);
    // 4. the editor: who it is for is ONE panel, and it is editable there
    assert.strictEqual(await page.locator('input[placeholder="Grandma Dot"]').count(), 1, 'one input for who it is for'); assert.strictEqual(await page.inputValue('input[placeholder="Grandma Dot"]'), 'Nana Bo', 'the conversation wrote into it');
    await page.fill('input[placeholder="Grandma Dot"]', 'Nana Bo-Bo'); await page.getByRole('button', { name: 'My grandparents' }).click();
    for (let i = 0; i < 80 && JSON.parse((await cardsOf('google:bea'))[0].doc).answers.relation !== 'My grandparents'; i++) await sleep(100);
    let doc = JSON.parse((await cardsOf('google:bea'))[0].doc); assert.deepStrictEqual([doc.answers.to, doc.answers.from, doc.answers.relation], ['Nana Bo-Bo', 'The Okafors', 'My grandparents'], 'to, from and what they are to you are saved from the editor');
    // 5. reorder: the arrows, and a real drag
    const order = async function () { return JSON.parse((await cardsOf('google:bea'))[0].doc).script.scenes.map(function (x) { return x.pid; }); }, o0 = await order();
    await page.getByRole('button', { name: 'Move photo 1 later' }).click(); for (let i = 0; i < 60 && (await order())[0] === o0[0]; i++) await sleep(100); assert.deepStrictEqual(await order(), [o0[1], o0[0]], 'the arrow moved photo 1 after photo 2');
    await page.locator('.shot img').nth(0).dragTo(page.locator('.shot img').nth(1)); for (let i = 0; i < 60 && (await order())[0] !== o0[0]; i++) await sleep(100); assert.deepStrictEqual(await order(), o0, 'and a drag put it back');
    // 6. make the song (the queue is run by the test: this process has no worker)
    await button('Make the song').click(); await page.locator('.dialog').getByRole('button', { name: 'Make the song' }).click(); await until(page, function () { return !!document.querySelector('.progress'); }, null, 10000, 'the progress screen'); await S.jobs.drain();
    await until(page, function () { return !!document.querySelector('.ready video'); }, null, 20000, 'the ready screen'); mine = await cardsOf('google:bea'); assert.strictEqual(mine[0].state, 'ready'); const slug = mine[0].slug;
    assert.strictEqual(await page.locator('.ready .banner').count(), 0, 'a carol just made is up to date: no "update the video"');
    // 7. move a photo in its frame, mark it "one person": kept with the photo, and the SERVER says the video is now older than the card
    await button('Edit this carol').click(); await page.waitForSelector('.shot'); await settle(page);
    assert.strictEqual(await page.evaluate(function () { return document.querySelector('.actionbar .btn.big').textContent; }), 'See the finished carol');
    await page.getByRole('button', { name: 'Move photo 1 in its frame' }).click(); await page.waitForSelector('.dialog canvas'); await sleep(300);
    const bx = await page.locator('.dialog canvas').boundingBox(); await page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await page.mouse.down(); await page.mouse.move(bx.x + bx.width / 2 - 60, bx.y + bx.height / 2 + 25, { steps: 6 }); await page.mouse.up();
    await page.locator('.dialog input[type=range]').fill('180'); assert(/Placed by you/.test(await page.locator('.dialog [role=status]').textContent()));
    await page.locator('.dialog').getByRole('button', { name: 'Done' }).click(); await page.getByRole('checkbox', { name: 'Photo 2 is of one person' }).check();
    const scenes = async function () { return JSON.parse((await cardsOf('google:bea'))[0].doc).script.scenes; }; for (let i = 0; i < 60 && !((await scenes())[0].fit && (await scenes())[1].solo); i++) await sleep(100);
    doc = await scenes(); assert(doc[0].fit && doc[0].fit[0] > 0.5 && doc[0].fit[1] < 0.42 && doc[0].fit[2] === 1.8, 'dragged left and down, zoomed: the photo\'s point moved right and up, at 1.8: ' + JSON.stringify(doc[0])); assert.strictEqual(doc[1].solo, 1, 'and photo 2 is marked as one person');
    await until(page, function () { return document.querySelector('.actionbar .btn.big').textContent === 'Update the video'; }, null, 8000, '"Update the video" to be offered');
    assert.strictEqual((await T.call('GET', '/api/cards/' + did, null, bea)).json.card.stale, true, 'because the server says the card is newer than its video');
    await page.evaluate(function () { try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* none */ } }); await page.goto(K.SITE + '/make?card=' + did, { waitUntil: 'load' }); await sac(page); await page.waitForSelector('.ready .banner', { timeout: 15000 });
    assert(/You changed this card after its video was made/.test(await page.locator('.ready .banner').textContent()), 'a fresh page with nothing remembered is told the same, by the server'); const story0 = (await S.db.get("SELECT mkey FROM media WHERE card = ? AND kind = 'story'", [did])).mkey;
    await page.locator('.ready .banner').getByRole('button', { name: 'Update the video' }).click(); await until(page, function () { return !!document.querySelector('.progress'); }, null, 10000, 'the progress screen'); await S.jobs.drain(); await until(page, function () { return !!document.querySelector('.ready video'); }, null, 20000, 'the ready screen again');
    assert.strictEqual(await page.locator('.ready .banner').count(), 0, 'updated: the offer is gone'); assert.notStrictEqual((await S.db.get("SELECT mkey FROM media WHERE card = ? AND kind = 'story'", [did])).mkey, story0, 'and there is a new video');
    // 8. another take of the song, and switching between takes
    await T.call('POST', '/api/cards/' + did + '/save', { script: { lyrics: [{ section: 'verse', lines: ['A second set of words to sing', 'For the second take of it'] }] } }, Object.assign({ 'idempotency-key': 'browser-take-two-0001' }, bea));
    r = await T.call('POST', '/api/cards/' + did + '/song', {}, Object.assign({ 'idempotency-key': 'browser-take-two-0002' }, bea)); assert.strictEqual(r.status, 200, r.text); await S.jobs.drain();
    await page.reload({ waitUntil: 'load' }); await sac(page); await page.waitForSelector('.takes .take', { timeout: 15000 }); assert.strictEqual(await page.locator('.takes .take').count(), 2, 'two takes are listed');
    const takeNow = async function () { return (await S.db.get('SELECT take FROM cards WHERE id = ?', [did])).take; }, t2 = await takeNow(); assert(/Take 2/.test(await page.locator('.take.cur').textContent()), 'take 2 is in use');
    await button('Use this take').click(); await until(page, function () { return !!document.querySelector('.progress'); }, null, 10000, 'the progress screen'); await S.jobs.drain(); await until(page, function () { return !!document.querySelector('.takes .take.cur'); }, null, 20000, 'the ready screen');
    assert.notStrictEqual(await takeNow(), t2, 'the card now uses the other take'); assert(/Take 1/.test(await page.locator('.take.cur').textContent()), 'and the page says so');
    // 9. send it by email (the mail service is a stand-in)
    const sent0 = T.fakes.sent.length; await button('Send by email').click(); await page.waitForSelector('.dialog input[type=email]'); await page.fill('.dialog input[type=email]', 'nana@example.test'); await page.keyboard.press('Enter');
    await page.locator('.dialog textarea').fill('Turn the sound up!'); await page.locator('.dialog input[type=checkbox]').check(); await page.locator('.dialog').getByRole('button', { name: 'Send it' }).click();
    await page.waitForSelector('.dialog .result', { timeout: 10000 }); assert(/Sent to 1 person/.test(await page.locator('.dialog .result').textContent()));
    const m = T.fakes.sent[T.fakes.sent.length - 1]; assert.strictEqual(T.fakes.sent.length, sent0 + 1); assert.deepStrictEqual(m.to, ['nana@example.test']); assert(/The Okafors sent you a carol/.test(m.subject) && m.html.indexOf('Turn the sound up!') > 0 && m.html.indexOf(K.SITE + '/' + slug) > 0 && m.html.indexOf('bea@example.test') < 0, 'the carol email: from the name on the card, with the note and the link, without the maker\'s address');
    await page.locator('.dialog').getByRole('button', { name: 'Done' }).click();
    // 10. take it down, put it back
    assert.strictEqual((await T.call('GET', '/' + slug)).status, 200); await button('Take it down').click(); await page.locator('.dialog').getByRole('button', { name: 'Take it down' }).click(); await page.waitForSelector('.downed', { timeout: 10000 });
    assert.strictEqual((await T.call('GET', '/' + slug)).status, 404, 'taken down: the card\'s page is not there'); assert.strictEqual((await T.call('GET', '/' + slug + '/story.mp4')).status, 404, 'nor its video');
    await button('Put it back').click(); await page.waitForSelector('.ready video', { timeout: 10000 }); assert.strictEqual((await T.call('GET', '/' + slug)).status, 200, 'put back: it plays again');
    // 11. delete it: the page 404s and every file is gone
    const dir = path.join(T.dir, 'store', 'send-a-carol', 'cards', did); assert(fs.readdirSync(dir).length >= 8, 'photos, songs and videos are in storage');
    await button('Delete this carol').click(); await page.locator('.dialog').getByRole('button', { name: 'Delete it' }).click(); await until(page, function () { return location.pathname === '/make' && !location.search; }, null, 10000, 'to be back at my carols');
    assert.strictEqual((await T.call('GET', '/' + slug)).status, 404, 'deleted: the page is gone'); assert.strictEqual((await T.call('GET', '/api/cards/' + did, null, bea)).status, 404); assert.deepStrictEqual(fs.existsSync(dir) ? fs.readdirSync(dir) : [], [], 'and so is every file it had');
    assert.deepStrictEqual(wrong(c, /status of (404|503)/), [], c.errors.join('\n')); await c.ctx.close(); fs.rmSync(hdir, { recursive: true, force: true });
    // 12. "buy a pack": an account that never paid has drafted its free carols; the next one opens the pay sheet. And drafts are deleted from the list.
    const cal = await T.user('google:cal', 'cal@example.test', 0); for (let i = 0; i < 3; i++) await T.carol(cal, { song: false, photos: 0, answers: { to: 'Friend ' + (i + 1), from: 'Cal' } });
    const fourth = (await T.call('POST', '/api/cards', { template: tpl, answers: { to: 'Friend Four', from: 'Cal', details: 'She laughs at her own jokes.' } }, cal)).json.card;
    c = await open({ who: 'google:cal' }); page = await c.page('/make?card=' + fourth.id); await sac(page); await page.waitForSelector('.convo'); await button('Skip').click(); await button('Write my carol').click();
    await page.waitForSelector('.dialog .payrow', { timeout: 15000 }); s = await page.evaluate(function () { return { title: document.querySelector('.dialog h2').textContent, why: document.querySelector('.dialog .banner').textContent, buys: Array.from(document.querySelectorAll('.dialog .payrow button')).map(function (b) { return b.getAttribute('aria-label'); }), fin: document.querySelector('.dialog .final b').textContent }; });
    assert.strictEqual(s.title, 'Carol credits'); assert(/You have drafted 3 carols for free. Buy a pack/.test(s.why), s.why); assert.deepStrictEqual(s.buys, ['Buy 1 carol for $2.99', 'Buy 5 carols for $9.99', 'Buy 10 carols for $17.99'], 'the three packs'); assert.strictEqual(s.fin, 'One-time purchase. Not refundable.');
    await page.keyboard.press('Escape'); page = await c.page('/make'); await sac(page); await page.waitForSelector('.carol'); assert.strictEqual(await page.locator('.carol').count(), 4);
    await page.fill('input[type=search]', 'four'); await until(page, function () { return document.querySelectorAll('.carol').length === 1; }, null, 8000, 'the search to find the draft'); assert(/For Friend Four/.test(await page.locator('.carol b').textContent()), 'a draft is listed by who it is for');
    await page.getByRole('button', { name: 'Delete the draft For Friend Four' }).click(); await page.locator('.dialog').getByRole('button', { name: 'Delete it' }).click(); await until(page, function () { return !!document.querySelector('.empty'); }, null, 8000, 'the list without it');
    assert.strictEqual((await cardsOf('google:cal')).length, 3, 'the draft is deleted'); await page.getByRole('button', { name: 'Drafts' }).click(); await page.fill('input[type=search]', ''); await until(page, function () { return document.querySelectorAll('.carol').length === 3; }, null, 8000, 'the drafts filter');
    assert.deepStrictEqual(wrong(c, /status of 402/), [], c.errors.join('\n')); await c.ctx.close();
    console.log('OK maker paths: the draft is made at the conversation\'s first answer; photos need the rights tick; a ' + (sips ? 'real HEIC' : 'PNG (no sips here to make a HEIC)') + ' is added; the refusal bubble and its way forward; who it is for edited in its one panel; reorder by arrow and by drag; a photo moved and zoomed in its frame and one marked "one person"; "Update the video" offered from the server\'s word on a page with nothing remembered; two takes and switching; the email form; take down and put back; delete (page 404, storage empty); the 402 pay sheet with the three packs; drafts searched, filtered and deleted from the list');
  }

  // ---- the card: opened by taps, its end, and nothing of the maker's ----
  if (pending('card.html') || pending('card.js')) console.log('PENDING card.html (the present, the end screen)');
  else {
    c = await open({}); page = await c.page('/' + ready.slug + '?wrap=present'); await until(page, function () { return !!(window.__card && window.__card.S.stage === 'present'); }, null, 12000, 'the present');
    assert.strictEqual(await n('SELECT opens AS n FROM cards WHERE id = ?', [ready.id]), 0, 'not counted as opened before it is');
    const box = await page.evaluate(function () { const r = document.getElementById('cv').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    for (let i = 0; i < 12 && await page.evaluate(function () { return window.__card.S.stage === 'present'; }); i++) { await page.touchscreen.tap(box.x, box.y); await sleep(160); }
    await until(page, function () { return window.__card.S.stage === 'burst' || window.__card.S.stage === 'play'; }, null, 4000, 'the present to open under taps');
    assert(await page.evaluate(function () { return window.SAC.held().indexOf('playing') >= 0; }), 'a card that is playing holds the reload');
    for (let i = 0; i < 60 && !await n('SELECT opens AS n FROM cards WHERE id = ?', [ready.id]); i++) await sleep(50); assert.strictEqual(await n('SELECT opens AS n FROM cards WHERE id = ?', [ready.id]), 1, 'opening it is counted, once');
    assert.deepStrictEqual(wrong(c), [], c.errors.join('\n')); await c.ctx.close();
    c = await open({}); page = await c.page('/' + ready.slug + '?at=end'); await until(page, function () { return !!(window.__card && window.__card.S.stage === 'end'); }, null, 12000, 'the end screen'); await sleep(400);
    const end = await page.evaluate(function () { const v = function (el) { if (!el) return false; const r = el.getBoundingClientRect(), st = getComputedStyle(el); return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth && st.visibility !== 'hidden' && st.display !== 'none'; }, save = document.getElementById('save'), share = document.getElementById('share'), make = document.querySelector('#end a.make');
      return { save: v(save), saves: save && save.getAttribute('href'), share: v(share), make: v(make), makes: make && make.getAttribute('href'), again: v(document.getElementById('again')), held: window.SAC.held().join() }; });
    assert.deepStrictEqual([end.save, end.share, end.make, end.again, end.makes, end.held], [true, true, true, true, '/', ''], 'the end has its three buttons (save the video, share, make your own), each large enough to tap, and holds nothing: ' + JSON.stringify(end));
    assert(new RegExp('^/' + ready.slug + '/(story|square)\\.mp4\\?').test(end.saves) && /dl=1/.test(end.saves), 'save is the video, as a download: ' + end.saves);
    const whole = (await page.content()) + JSON.stringify((await T.call('GET', '/api/card/' + ready.slug)).json) + (await T.call('GET', '/' + ready.slug)).text;
    assert(whole.indexOf('ann@example.test') < 0 && whole.indexOf('Ann Example') < 0 && whole.indexOf('google:ann') < 0, 'the page, what it is sent and what it asks for never hold the maker\'s address, account name or id');
    assert(whole.indexOf('Grandma Dot') > 0 && whole.indexOf('The Hollisters') > 0, 'only who it is to and who it says it is from');
    assert.deepStrictEqual(wrong(c), [], c.errors.join('\n')); await c.ctx.close();
    console.log('OK card: the present is opened by taps (counted once, and the reload is held while it plays); the end shows save, share and make your own; the maker\'s email is nowhere in the page or its data');
  }

  // ---- THE TEMPLATE LIBRARY: thousands of templates the pages are handed one page at a time (defs + art packs) ----
  // SHOTS=<folder> keeps screenshots (scale 1) and the video of the library carol there, to look at.
  if (!pending('landing.js') && !pending('app.js') && !pending('card.js')) {
    const Lib = require('../library/index.js'), shots = process.env.SHOTS || '', shot = async function (p, name) { if (shots) { fs.mkdirSync(shots, { recursive: true }); await p.screenshot({ path: path.join(shots, name + '.png') }); } };
    const drawn = function (sel) { return Array.from(document.querySelectorAll(sel)).filter(function (cv) { try { const x = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let lit = 0; for (let i = 3; i < x.length; i += 4 * 97) if (x[i] > 0) lit++; return lit > 20; } catch (e) { return false; } }).length; };
    // the landing gallery, on an occasion that only the library has, picked from "More occasions"
    c = await open({ wide: true }); page = await c.page('/'); await sac(page); await page.waitForSelector('#occs select');
    await page.selectOption('#occs select', 'diwali'); await until(page, function () { const t = document.querySelectorAll('#tgrid .tpl'); return t.length > 0 && Array.from(t).every(function (x) { return /\/make\?template=diwali-/.test(x.querySelector('a').getAttribute('href')); }); }, null, 12000, 'the Diwali templates');
    await page.evaluate(function () { document.getElementById('tgrid').scrollIntoView(); });
    try { await until(page, function (d) { return new Function('return (' + d + ')')()('#tgrid canvas') >= 4; }, drawn.toString(), 15000, 'their thumbnails drawn'); } catch (e) { await shot(page, 'landing-diwali-failed'); throw new Error(e.message + '\n' + c.errors.join('\n')); }
    const known = await page.evaluate(function () { return Array.from(document.querySelectorAll('#tgrid .tpl a.btn')).map(function (a) { const id = new URL(a.href).searchParams.get('template'), t = window.CarolTemplates.get(id); return t && t.lib && t.packs.length ? 1 : 0; }); });
    assert(known.length >= 4 && known.every(Boolean), 'the page was handed every library template it shows, with its art packs: ' + known);
    assert((await page.$$eval('#occs .chip', function (x) { return x.length; })) <= 12, 'the first occasions are chips, the rest are in the list');
    await shot(page, 'landing-diwali'); assert.deepStrictEqual(wrong(c), [], c.errors.join('\n')); await c.ctx.close();
    // the search: one word over all of it
    c = await open({ scale: 1 }); page = await c.page('/'); await sac(page); await page.waitForSelector('#tq'); await page.fill('#tq', 'llamas'); await page.dispatchEvent('#tq', 'input');
    await until(page, function () { const t = document.querySelectorAll('#tgrid .tpl h3'); return t.length > 0 && Array.from(t).some(function (x) { return /llama/i.test(x.textContent); }); }, null, 12000, 'a search over the library'); await page.evaluate(function () { document.getElementById('tgrid').scrollIntoView(); }); await settle(page); await sleep(600); await shot(page, 'landing-search-phone'); assert.deepStrictEqual(wrong(c), [], c.errors.join('\n')); await c.ctx.close();
    // a carol made with a library template: /make opens it from a gallery link, the list draws it, its card page plays it
    const lib = Lib.rows().find(function (r) { return r.occ === 'diwali'; }), dee = await T.user('google:dee', 'dee@example.test', 3);
    c = await open({ who: 'google:dee', scale: 1 }); page = await c.page('/make?template=' + lib.id); await sac(page); await until(page, function (id) { const t = window.CarolTemplates.get(id); return !!(t && t.lib) && !!document.querySelector('.composer'); }, lib.id, 12000, 'the conversation with the library template known');
    await shot(page, 'make-library-template-phone'); assert.deepStrictEqual(wrong(c), [], c.errors.join('\n')); await c.ctx.close();
    c = await open({ who: 'google:dee', scale: 1 }); page = await c.page('/make?new'); await sac(page); await page.waitForSelector('.composer .chip');
    await page.locator('.composer .chip', { hasText: 'More occasions' }).click(); await page.locator('.composer .chip', { hasText: 'Diwali' }).waitFor(); await sleep(900); await shot(page, 'make-occasions-phone');
    await page.fill('.composer input[type=search]', 'gradu'); await until(page, function () { const t = Array.from(document.querySelectorAll('.composer .chip')).map(function (x) { return x.textContent; }); return t.length >= 1 && t.every(function (x) { return /gradu/i.test(x); }); }, null, 4000, 'the occasions found by a word');
    assert.deepStrictEqual(wrong(c), [], c.errors.join('\n')); await c.ctx.close();
    const made = await T.carol(T.as('google:dee'), { template: lib.id, slug: 'a-library-carol-2026', answers: { to: 'Asha', from: 'Ravi' } });
    assert.strictEqual(made.template, lib.id); assert(made.defs && made.defs[0].id === lib.id, 'the maker\'s view of the carol carries its template');
    assert(made.media.indexOf('story') >= 0, 'its video was made on the server with the same engine');
    if (shots) fs.writeFileSync(path.join(shots, 'library-carol-story.mp4'), (await T.call('GET', '/' + made.slug + '/story.mp4')).body);
    c = await open({ who: 'google:dee' }); page = await c.page('/make'); await sac(page); await page.waitForSelector('.carol'); await settle(page); assert.deepStrictEqual(wrong(c), [], c.errors.join('\n')); await c.ctx.close();
    c = await open({ scale: 1 }); page = await c.page('/' + made.slug + '?at=end'); await until(page, function (id) { return !!(window.__card && window.__card.S.tpl && window.__card.S.tpl.id === id); }, lib.id, 12000, 'the card page drawing with the library template');
    await shot(page, 'card-library-end'); assert.deepStrictEqual(wrong(c), [], c.errors.join('\n')); await c.ctx.close();
    console.log('OK library: the gallery is handed its library templates a page at a time and draws them (art packs loaded once); "More occasions" and a word find any of ' + Lib.made().length + ' occasions; /make opens a linked library template; a carol made with one is drawn by the server (its video) and by its card page');
  }

  console.log('OK browser');
  await B.close(); await T.done(); fs.rmSync(copy, { recursive: true, force: true }); process.exit(0);
})().catch(function (e) { console.error(e); Promise.resolve(B && B.close()).catch(function () {}).then(function () { return T && T.done(); }).catch(function () {}).then(function () { process.exit(1); }); });
