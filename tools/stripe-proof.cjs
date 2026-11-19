'use strict';
// tools/stripe-proof.cjs : THE REAL STRIPE, IN TEST MODE ONLY. It refuses a key that is not sk_test_/rk_test_, and
// asks Stripe (a read) whether the key is live before anything is made. Then, through the app's own code
// (handle(), in this process, a signed-in test account, a throwaway database in /tmp, the real api.stripe.com):
//   1. a Checkout Session for each pack through POST /api/buy; each is read back from Stripe and held to config.js
//      (amount, currency, metadata.app, success and cancel addresses, mode=payment, the final-sale sentence);
//   2. ONE is paid the way a buyer pays: a headless browser on Stripe's hosted Checkout page with Stripe's documented
//      test card (https://docs.stripe.com/testing : 4242 4242 4242 4242, any future date, any CVC), and Stripe's
//      return to <site>/make?paid=<session> is routed into handle(): the page itself confirms. Credits: granted once.
//      The confirm is asked again (twice): still once.
//   3. a second account pays a second one and never comes back (the return is dropped): its next GET /api/me grants it, once.
// Screenshots of Stripe's page go to /tmp/carol-time/pass2/stripe/. The key is never printed.
//   NODE_PATH=/Users/timmetim/development/glyphh/web/node_modules node tools/stripe-proof.cjs
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto'), assert = require('assert'), { Readable, Writable } = require('stream');
const ROOT = path.join(__dirname, '..'), SHOTS = '/tmp/carol-time/pass2/stripe', CARD = { number: '4242424242424242', exp: '12 / 34', cvc: '123', name: 'Test Buyer', zip: '78701' };
fs.mkdirSync(SHOTS, { recursive: true });
const E = {}; fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').forEach(function (l) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m) E[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
const KEY = E.STRIPE_SECRET_KEY || '';
if (!/^(sk|rk)_test_/.test(KEY)) { console.error('STRIPE PROOF REFUSED: STRIPE_SECRET_KEY in .env is not a test key (sk_test_ / rk_test_). Nothing was asked of Stripe.'); process.exit(2); }
['DATABASE_URL', 'DB_SCHEMA', 'R2_ENDPOINT', 'R2_BUCKET', 'RESEND_API_KEY', 'PUBLIC_URL', 'FLY_APP_NAME', 'GOOGLE_CLIENT_ID', 'CONFIG_OVERRIDE'].forEach(function (k) { delete process.env[k]; });
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-stripe-')), SECRET = 'stripe-proof-only';
Object.assign(process.env, { DATA_DIR: dir, SESSION_SECRET: SECRET, STRIPE_SECRET_KEY: KEY, NODE_NO_WARNINGS: '1' });
const S = require('../server.js'), CFG = require('../config.js');
const sleep = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
const cookie = function (uid) { const v = Buffer.from(uid).toString('base64url') + '.' + (Date.now() + 864e5); return 'sac=' + v + '.' + crypto.createHmac('sha256', SECRET).update(v).digest('base64url'); };
function call(method, url, body, headers) {
  return new Promise(function (done) {
    const req = Readable.from(body ? [Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))] : []); Object.assign(req, { method: method, url: url, headers: Object.assign({ host: 'proof' }, headers) });
    const parts = [], res = new Writable({ write: function (c, e, next) { parts.push(Buffer.from(c)); next(); } });
    Object.assign(res, { status: 200, heads: {}, headersSent: false, setHeader: function (k, v) { this.heads[k.toLowerCase()] = v; }, getHeader: function (k) { return this.heads[k.toLowerCase()]; }, writeHead: function (c, h) { this.status = c; this.headersSent = true; const me = this; Object.keys(h || {}).forEach(function (k) { me.heads[k.toLowerCase()] = h[k]; }); return this; } });
    res.on('finish', function () { const b = Buffer.concat(parts); let j = null; try { j = JSON.parse(b.toString()); } catch (e) { j = null; } done({ status: res.status, json: j, body: b, heads: res.heads }); });
    S.handle(req, res);
  });
}
const stripe = async function (method, p, params) { const r = await fetch('https://api.stripe.com/v1' + p, { method: method, headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params ? new URLSearchParams(params) : undefined }); return { status: r.status, json: await r.json().catch(function () { return {}; }) }; };
let failed = 0; const ok = function (cond, what) { console.log((cond ? 'ok    ' : 'FAIL  ') + what); if (!cond) failed++; return cond; };
const grants = async function (uid) { return S.db.all("SELECT delta, why, ref FROM credit_log WHERE uid = ? ORDER BY id", [uid]); };
const made = [];

// pays one session on Stripe's own page; -> { paid: bool, where: what stopped it, returned: the address Stripe sent the buyer back to }
async function pay(browser, url, tag, o) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'en-US' }), page = await ctx.newPage(), log = [], site = new URL(CFG.site).origin; let returned = '', step = 'opening the page';
  await ctx.route(site + '/**', async function (route) {   // the buyer comes back to the app: into handle(), as that account (or dropped: "never came back")
    const q = route.request(), u = new URL(q.url()); if (u.pathname === '/make' && u.searchParams.get('paid') && !returned) returned = u.pathname + u.search;
    if (o.drop) return route.abort('connectionrefused');
    const h = Object.assign({}, await q.allHeaders(), { host: u.host, cookie: o.cookie }), body = q.postDataBuffer(), r = await call(q.method(), u.pathname + u.search, body && body.length ? body : null, h), heads = {};
    log.push(q.method() + ' ' + u.pathname + ' ' + r.status); Object.keys(r.heads).forEach(function (k) { if (k !== 'set-cookie') heads[k] = String(r.heads[k]); });
    route.fulfill({ status: r.status, headers: heads, body: r.body }).catch(function () { });
  });
  await ctx.route('https://accounts.google.com/**', function (route) { return route.abort(); });
  const shot = async function (n) { try { await page.screenshot({ path: path.join(SHOTS, tag + '-' + n + '.png') }); } catch (e) { /* the page went */ } };
  // (Stripe's hosted page draws its form inside a frame of its own, js.stripe.com/v3/elements-inner-...: every frame is looked in)
  const first = async function (sels, ms) { const end = Date.now() + (ms || 15000); do { for (const f of page.frames()) for (const s of sels) { const l = f.locator(s).first(); if (await l.count().catch(function () { return 0; }) && await l.isVisible().catch(function () { return false; })) return l; } await sleep(250); } while (Date.now() < end); return null; };
  const fill = async function (sels, v) { const l = await first(sels, 1500); if (l) await l.fill(v); return !!l; };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); step = 'waiting for Stripe\'s form';
    const email = await first(['input[name="email"]', 'input#email'], 30000); await shot('1-open');
    if (!email) return { paid: false, where: 'Stripe\'s hosted page did not show its form (title: "' + await page.title() + '")', log: log };
    const total = await page.locator('[data-testid="product-summary-total-amount"], #ProductSummary-totalAmount, .ProductSummary-totalAmount').first().innerText().catch(function () { return ''; });
    let text = ''; for (const f of page.frames()) if (/stripe\.com/.test(f.url())) text += ' ' + await f.locator('body').innerText({ timeout: 3000 }).catch(function () { return ''; });
    step = 'the email'; if (!(await email.inputValue())) await email.fill(o.email);
    const NUM = ['input[name="number"]', 'input[autocomplete="cc-number"]', 'input[name="cardNumber"]'];
    step = 'choosing to pay by card'; let num = await first(NUM, 2500);
    if (!num) { const tab = await first(['[role="button"][data-value="card"]', '[data-testid="card-accordion-item-button"]', '#payment-method-accordion-item-title-card', '[data-testid="card-accordion-item"]'], 8000); if (tab) await tab.click().catch(function () { }); num = await first(NUM, 10000); }
    if (!num) { await shot('x-no-card-field'); return { paid: false, where: 'no card number field on Stripe\'s page', log: log, total: total }; }
    step = 'the card'; await num.fill(CARD.number); await fill(['input[name="expiry"]', 'input[autocomplete="cc-exp"]', 'input[name="cardExpiry"]'], CARD.exp); await fill(['input[name="cvc"]', 'input[autocomplete="cc-csc"]', 'input[name="cardCvc"]'], CARD.cvc);
    await fill(['input[name="name"]', 'input[autocomplete="cc-name"]', 'input[name="billingName"]'], CARD.name);
    const country = await first(['select[name="country"]', 'select[name="billingCountry"]'], 1500); if (country) await country.selectOption('US').catch(function () { });
    await sleep(400); await fill(['input[name="postalCode"]', 'input[name="billingPostalCode"]'], CARD.zip);
    const save = await first(['input[name="linkOptIn"]', 'input[name="enableStripePass"]'], 1500); if (save && await save.isChecked().catch(function () { return false; })) await save.uncheck({ force: true }).catch(function () { });   // (the card is not kept with Link)
    await sleep(500); await shot('2-filled'); step = 'pressing Pay';
    const btn = await first(['[data-testid="payment-form-submit-button"]', '[data-testid="hosted-payment-submit-button"]', 'button.SubmitButton', 'button[type="submit"]'], 8000); if (!btn) return { paid: false, where: 'no pay button on Stripe\'s page', log: log, total: total };
    const says = (await btn.innerText().catch(function () { return ''; })).replace(/\s+/g, ' ').trim(); await btn.click(); step = 'waiting for Stripe to send the buyer back';
    const end = Date.now() + 60000; let challenge = '';
    while (Date.now() < end && !returned) { await sleep(400); if (!challenge && await page.locator('iframe[src*="hcaptcha"], iframe[title*="captcha" i], iframe[src*="challenge"]').count().catch(function () { return 0; })) { const vis = await page.locator('iframe[src*="hcaptcha"][style*="visibility: visible"], div[style*="visibility: visible"] iframe[src*="hcaptcha"]').count().catch(function () { return 0; }); if (vis) challenge = 'a visible hCaptcha challenge'; } }
    await shot(returned ? '3-back' : 'x-not-returned');
    if (!returned) { const err = await page.locator('.FieldError, [role="alert"], .ConfirmPaymentButton--error').allInnerTexts().catch(function () { return []; }); return { paid: false, where: 'after pressing Pay ("' + says + '") Stripe did not send the buyer back within 60 s' + (challenge ? ': ' + challenge : '') + (err.filter(Boolean).length ? ': ' + err.filter(Boolean).join(' | ').slice(0, 200) : ''), log: log, total: total }; }
    if (!o.drop) { const end2 = Date.now() + 15000; while (Date.now() < end2 && !log.some(function (l) { return /^GET \/api\/buy\/confirm 200/.test(l); })) await sleep(200); await sleep(600); await shot('4-app'); }
    return { paid: true, returned: returned, log: log, total: total, button: says, finalSale: text.indexOf(CFG.finalSale) >= 0 };
  } catch (e) { await shot('x-error'); return { paid: false, where: 'while ' + step + ': ' + String(e.message).split('\n')[0], log: log }; }
  finally { await ctx.close(); }
}

(async function () {
  // ---- before anything: is this key live? (a read) ----
  let live = null, how = '';
  for (const p of ['/balance', '/checkout/sessions?limit=1', '/payment_intents?limit=1', '/customers?limit=1']) { const r = await stripe('GET', p); if (r.status === 200) { const v = r.json.livemode !== undefined ? r.json.livemode : (r.json.data && r.json.data[0] ? r.json.data[0].livemode : undefined); if (v !== undefined) { live = v; how = 'GET /v1' + p.split('?')[0]; break; } } }
  if (live === true) { console.error('STRIPE PROOF REFUSED: Stripe says this key is LIVE (' + how + '). Nothing was made.'); process.exit(2); }
  if (live === null) { console.error('STRIPE PROOF STOPPED: no read this key may make says whether it is live (balance, checkout sessions, payment intents, customers were tried). Nothing was made.'); process.exit(2); }
  console.log('ok    the key is a test key by its prefix (' + KEY.slice(0, 8) + '...), and Stripe says livemode=false (' + how + ')');
  await S.ready;
  const A = 'email:stripe-proof-a', B = 'email:stripe-proof-b';
  for (const u of [A, B]) await S.db.run('INSERT INTO users (id, email, name, created) VALUES (?, ?, ?, ?)', [u, '', 'Stripe proof', Date.now()]);
  const asA = { cookie: cookie(A) }, asB = { cookie: cookie(B) }, me = async function (who) { return (await call('GET', '/api/me', null, who)).json.user; };
  ok((await me(asA)).credits === 0 && (await me(asA)).paid === false, 'the test account starts with 0 credits');

  // ---- 1. a Checkout Session for each pack, through POST /api/buy, read back from Stripe ----
  const sessions = {};
  for (const pack of CFG.packs) {
    const r = await call('POST', '/api/buy', { pack: pack.id }, Object.assign({ 'idempotency-key': 'proof-' + pack.id + '-' + crypto.randomBytes(6).toString('hex') }, asA));
    if (!ok(r.status === 200 && /^https:\/\/checkout\.stripe\.com\//.test(r.json && r.json.url || ''), 'POST /api/buy { pack: "' + pack.id + '" } -> 200 and an address at checkout.stripe.com' + (r.status !== 200 ? ' (got ' + r.status + ' ' + JSON.stringify(r.json) + ')' : ''))) continue;
    const row = await S.db.get('SELECT * FROM checkouts WHERE uid = ? AND pack = ? ORDER BY at DESC LIMIT 1', [A, pack.id]), s = (await stripe('GET', '/checkout/sessions/' + row.session + '?expand[]=line_items')).json; made.push(s.id);
    sessions[pack.id] = { id: s.id, url: r.json.url };
    const li = s.line_items && s.line_items.data && s.line_items.data[0] || {};
    ok(s.amount_total === pack.cents && s.currency === 'usd' && s.mode === 'payment' && s.livemode === false && s.payment_status === 'unpaid' && s.status === 'open', pack.id + ': ' + s.id.slice(0, 16) + '... amount_total ' + s.amount_total + ' ' + s.currency + ', mode ' + s.mode + ', livemode ' + s.livemode + ', ' + s.status + '/' + s.payment_status);
    ok(s.metadata && s.metadata.app === 'send-a-carol' && s.metadata.user === A && s.metadata.pack === pack.id && s.metadata.credits === String(pack.credits) && s.client_reference_id === A, pack.id + ': metadata.app = "' + (s.metadata || {}).app + '", metadata.pack "' + (s.metadata || {}).pack + '", metadata.credits ' + (s.metadata || {}).credits);
    ok(s.success_url === CFG.site + '/make?paid={CHECKOUT_SESSION_ID}' && s.cancel_url === CFG.site + '/make', pack.id + ': success_url ' + s.success_url + ' , cancel_url ' + s.cancel_url);
    ok(li.quantity === 1 && li.amount_total === pack.cents && li.description === CFG.name + ': ' + pack.label && !(li.price && li.price.recurring) && !s.subscription, pack.id + ': one line, "' + li.description + '", nothing recurring');
    ok(s.custom_text && s.custom_text.submit && s.custom_text.submit.message === CFG.finalSale, pack.id + ': Stripe\'s pay button carries "' + CFG.finalSale + '"');
    ok(row.state === 'open' && row.cents === pack.cents && row.credits === pack.credits, pack.id + ': kept in checkouts as open');
  }
  ok((await grants(A)).length === 0, 'three checkouts opened, nothing granted');
  if (!sessions.five) throw new Error('no session to pay');

  // ---- 2. pay ONE on Stripe's hosted page, come back through the app ----
  let chromium; try { chromium = require(process.env.PLAYWRIGHT_PATH || 'playwright').chromium; } catch (e) { throw new Error('Playwright is not here (NODE_PATH)'); }
  const browser = await chromium.launch();
  try {
    const p1 = await pay(browser, sessions.five.url, 'five', { cookie: asA.cookie, email: 'buyer@example.com' });
    if (!ok(p1.paid, 'paid the 5-pack on Stripe\'s hosted Checkout page in a headless browser with the test card 4242...4242' + (p1.paid ? ' (page total "' + p1.total + '", button "' + p1.button + '", the final-sale sentence on the page: ' + p1.finalSale + ')' : ': STOPPED ' + p1.where))) throw new Error('the hosted page could not be driven: ' + p1.where);
    ok(p1.returned === '/make?paid=' + sessions.five.id, 'Stripe sent the buyer back to ' + CFG.site + '/make?paid=' + sessions.five.id.slice(0, 16) + '...');
    const conf = p1.log.filter(function (l) { return /\/api\/buy\/confirm/.test(l); });
    ok(conf.length >= 1 && /200$/.test(conf[0]), 'the app\'s page, served by handle(), confirmed by itself: ' + conf.join(', '));
    const s = (await stripe('GET', '/checkout/sessions/' + sessions.five.id)).json; ok(s.payment_status === 'paid' && s.status === 'complete' && s.amount_total === 1499, 'Stripe: ' + s.status + '/' + s.payment_status + ', amount_total ' + s.amount_total + ', payment_intent ' + String(s.payment_intent).slice(0, 12) + '...');
    let g = await grants(A), u = await me(asA);
    ok(g.length === 1 && g[0].delta === 5 && g[0].ref === 'buy:' + sessions.five.id && u.credits === 5 && u.paid === true, 'credits granted ONCE: credit_log has ' + g.length + ' row (+' + (g[0] || {}).delta + ', "' + (g[0] || {}).why + '"), balance ' + u.credits + ', paid ' + u.paid);
    const again = [await call('GET', '/api/buy/confirm?session_id=' + sessions.five.id, null, asA), await call('GET', '/api/buy/confirm?session_id=' + sessions.five.id, null, asA)]; g = await grants(A);
    ok(again.every(function (r) { return r.status === 200 && r.json.ok === true && r.json.credits === 5; }) && g.length === 1 && (await me(asA)).credits === 5, 'the confirm asked twice more: ok, and still ' + g.length + ' grant, balance ' + (await me(asA)).credits);
    const pur = await S.db.all('SELECT * FROM purchases WHERE uid = ?', [A]), co = await S.db.get('SELECT state FROM checkouts WHERE session = ?', [sessions.five.id]);
    ok(pur.length === 1 && pur[0].amount === 1499 && pur[0].currency === 'usd' && pur[0].live === 0 && pur[0].credits === 5 && co.state === 'paid', 'purchases: 1 row (1499 usd, live 0, 5 credits); its checkout is "paid"');
    const wrong = await call('GET', '/api/buy/confirm?session_id=' + sessions.five.id, null, asB); ok(wrong.json.ok === false && wrong.json.credits === 0 && (await grants(B)).length === 0, 'another account confirming that session gets nothing');
    const unpaid = await call('GET', '/api/buy/confirm?session_id=' + sessions.one.id, null, asA); ok(unpaid.json.ok === false && unpaid.json.credits === 5, 'confirming a session nobody paid grants nothing');

    // ---- 3. the buyer who paid and never came back ----
    const r2 = await call('POST', '/api/buy', { pack: 'one' }, Object.assign({ 'idempotency-key': 'proof-b-' + crypto.randomBytes(6).toString('hex') }, asB)), rowB = await S.db.get('SELECT session FROM checkouts WHERE uid = ?', [B]); made.push(rowB.session);
    ok(r2.status === 200 && (await grants(B)).length === 0, 'a second account opens a checkout for the 1-pack (' + rowB.session.slice(0, 16) + '...)');
    const p2 = await pay(browser, r2.json.url, 'one', { cookie: asB.cookie, email: 'buyer@example.com', drop: true });
    if (!ok(p2.paid, 'paid it on Stripe\'s page; the return to the app was dropped (the buyer never came back)' + (p2.paid ? '' : ': STOPPED ' + p2.where))) throw new Error('the second payment could not be made: ' + p2.where);
    const sB = (await stripe('GET', '/checkout/sessions/' + rowB.session)).json;
    ok(sB.payment_status === 'paid' && sB.amount_total === 499 && (await grants(B)).length === 0 && (await S.db.get('SELECT state FROM checkouts WHERE session = ?', [rowB.session])).state === 'open', 'Stripe says paid (' + sB.amount_total + ' ' + sB.currency + '); the app knows nothing yet: 0 grants, the checkout still "open"');
    const m1 = await me(asB), gB = await grants(B);
    ok(m1.credits === 1 && m1.paid === true && gB.length === 1 && gB[0].ref === 'buy:' + rowB.session, 'the next GET /api/me found it: balance ' + m1.credits + ', paid ' + m1.paid + ', ' + gB.length + ' grant');
    const m2 = await me(asB), c2 = await call('GET', '/api/buy/confirm?session_id=' + rowB.session, null, asB);
    ok(m2.credits === 1 && c2.json.credits === 1 && (await grants(B)).length === 1 && (await S.db.get('SELECT state FROM checkouts WHERE session = ?', [rowB.session])).state === 'paid', '/api/me again and a late confirm: still 1 grant, balance 1; the checkout is "paid"');
  } finally { await browser.close(); }
  console.log(failed ? 'STRIPE PROOF FAILED: ' + failed : 'STRIPE PROOF PASSED');
})().catch(function (e) { console.error('STRIPE PROOF STOPPED: ' + e.message); failed++; }).finally(async function () {
  // the checkouts nobody paid are closed (test mode), and the throwaway database goes
  for (const id of made) { try { const s = (await stripe('GET', '/checkout/sessions/' + id)).json; if (s.status === 'open') { const x = await stripe('POST', '/checkout/sessions/' + id + '/expire'); console.log('      closed the unpaid test checkout ' + id.slice(0, 16) + '... (' + (x.json.status || x.status) + ')'); } } catch (e) { /* left to expire by itself in a day */ } }
  fs.rmSync(dir, { recursive: true, force: true }); process.exit(failed ? 1 : 0);
});
