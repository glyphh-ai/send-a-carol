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
  const ready = await T.carol(ann, { photos: 2, slug: 'the-timmermans-2026' }), mk = { template: tpl, answers: { to: 'Sam', from: 'Ada', relation: 'friend', details: 'Sam bakes bread every Sunday.' } };
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
    assert(whole.indexOf('Grandma June') > 0 && whole.indexOf('The Timmermans') > 0, 'only who it is to and who it says it is from');
    assert.deepStrictEqual(wrong(c), [], c.errors.join('\n')); await c.ctx.close();
    console.log('OK card: the present is opened by taps (counted once, and the reload is held while it plays); the end shows save, share and make your own; the maker\'s email is nowhere in the page or its data');
  }

  console.log('OK browser');
  await B.close(); await T.done(); fs.rmSync(copy, { recursive: true, force: true }); process.exit(0);
})().catch(function (e) { console.error(e); Promise.resolve(B && B.close()).catch(function () {}).then(function () { return T && T.done(); }).catch(function () {}).then(function () { process.exit(1); }); });
