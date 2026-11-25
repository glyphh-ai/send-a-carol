'use strict';
// node test/money.cjs
// Money: one-time packs through Stripe Checkout (the kit's fake), credits granted once, a paid session whose buyer
// never came back found at the next visit; and the source read for what must never be there: giving money back,
// anything recurring, a webhook, the final-sale sentence typed twice, an AI model's name. No port, no network.
const assert = require('node:assert'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const K = require('./kit.cjs');

let checks = 0, part = 0;
const ok = function (v, msg) { checks++; part++; assert.ok(v, msg); }, eq = function (a, b, msg) { checks++; part++; assert.strictEqual(a, b, msg); };
const say = function (s) { process.stdout.write(s + '\n'); };
const logs = []; ['log', 'error', 'warn', 'info'].forEach(function (k) { console[k] = function () { logs.push(Array.from(arguments).map(String).join(' ')); }; });
const T0 = Date.now();

(async function () {
  const T = await K.open('money'), S = T.S, db = S.db, F = T.fakes, SITE = T.site, CFG = require('../config.js');
  const GET = function (u, who) { return T.call('GET', u, null, who); }, POST = function (u, b, who, more) { return T.call('POST', u, b === undefined ? {} : b, Object.assign({}, who, more)); };
  const key = function () { return crypto.randomBytes(12).toString('hex'); }, count = async function (sql, p) { return (await db.get(sql, p || [])).n; };
  const section = async function (title, work) { say('== ' + title); part = 0; await work(); say('   ' + part + ' checks'); };
  const sessionOf = function (url) { const n = /\/pay\/(\d+)$/.exec(url)[1]; return F.stripe.sessions['cs_test_' + n]; };
  const buy = async function (who, pack, more) { const r = await POST('/api/buy', Object.assign({ pack: pack }, more), who, { 'idempotency-key': key() }); assert.strictEqual(r.status, 200, 'buy: ' + r.text); return sessionOf(r.json.url); };
  const realNow = Date.now, later = function (ms) { Date.now = function () { return realNow() + ms; }; };

  await section('1. Buying a pack', async function () {
    const who = await T.user('google:1', 'buyer@example.test'), FINAL = 'One-time purchase. Not refundable.';
    F.stripe.payment = 'unpaid';   // (nobody pays in this section)
    eq(CFG.finalSale, FINAL, 'config.finalSale'); eq(CFG.app, 'send-a-carol'); eq(CFG.currency, 'usd'); eq(JSON.stringify(CFG.packs.map(function (p) { return [p.id, p.credits, p.cents]; })), '[["one",1,299],["five",5,999],["ten",10,1799]]', 'the packs and their prices');
    eq((await POST('/api/buy', { pack: 'one' })).status, 401, 'buying needs an account'); eq(F.stripe.asked.length, 0);
    for (const pack of CFG.packs) {
      const n = F.stripe.asked.length, r = await POST('/api/buy', { pack: pack.id, card: 'cABCDEF123' }, who, { 'idempotency-key': key() }), q = F.stripe.asked[n], what = pack.id + ': ';
      eq(r.status, 200, what + 'a checkout is made'); ok(/^https:\/\/checkout\.stripe\.test\/pay\/\d+$/.test(r.json.url), what + 'its address comes back'); eq(Object.keys(r.json).join(), 'url'); eq(F.stripe.asked.length, n + 1, what + 'one Stripe session');
      eq(q.mode, 'payment', what + 'mode=payment'); eq(q['line_items[0][price_data][unit_amount]'], String(pack.cents), what + pack.cents + ' cents, from config'); eq(q['line_items[0][price_data][currency]'], 'usd'); eq(q['line_items[0][quantity]'], '1');
      eq(q['metadata[app]'], CFG.app, what + 'metadata.app'); eq(q['metadata[user]'], 'google:1', what + 'metadata.user'); eq(q['metadata[pack]'], pack.id); eq(q['metadata[credits]'], String(pack.credits)); eq(q['payment_intent_data[metadata][app]'], CFG.app, what + 'the payment carries the app too'); eq(q['payment_intent_data[metadata][user]'], 'google:1');
      eq(q.auth, 'Bearer sk_test_fake', what + 'with the test key'); eq(q.client_reference_id, 'google:1'); eq(q.customer_email, 'buyer@example.test');
      const desc = q['line_items[0][price_data][product_data][description]']; ok(desc && desc.indexOf(pack.label) === 0 && desc.indexOf(FINAL) > 0, what + 'a product description that says it is final: ' + desc); eq(q['line_items[0][price_data][product_data][name]'], CFG.name + ': ' + pack.label);
      eq(q['custom_text[submit][message]'], FINAL, what + 'the pay button says exactly config.finalSale'); eq(q.success_url, SITE + '/make?paid={CHECKOUT_SESSION_ID}&card=cABCDEF123', what + 'back to /make'); eq(q.cancel_url, SITE + '/make?card=cABCDEF123');
      const keys = Object.keys(q).join(' '), vals = Object.values(q).join(' '); ok(!/recurring|subscription/i.test(keys + ' ' + vals), what + 'nothing recurring'); ok(!/\[price\]( |$)/.test(keys) && !/\bprice_[A-Za-z0-9]+/.test(vals), what + 'no price ids'); ok(q.mode !== 'subscription' && q.mode !== 'setup');
      ok(!('customer' in q) && !('payment_intent_data[setup_future_usage]' in q) && !('payment_method_collection' in q), what + 'no card kept for later');
      const row = await db.get('SELECT * FROM checkouts WHERE session = ?', [sessionOf(r.json.url).id]); eq(row.state, 'open'); eq(row.uid, 'google:1'); eq(row.cents, pack.cents); eq(row.credits, pack.credits);
    }
    eq(F.stripe.asked[F.stripe.asked.length - 1]['line_items[0][price_data][unit_amount]'], '1799'); eq((await buy(who, 'one')).metadata.app, 'send-a-carol'); eq(F.stripe.asked[F.stripe.asked.length - 1].success_url, SITE + '/make?paid={CHECKOUT_SESSION_ID}', 'with no card: just /make');
    // refused
    const n = F.stripe.asked.length; let r = await POST('/api/buy', { pack: 'hundred' }, who); eq(r.status, 400, 'an unknown pack is refused'); ok(/no such pack/.test(r.json.error)); eq((await POST('/api/buy', {}, who)).status, 400); eq((await POST('/api/buy', { pack: 'one', cents: 1, amount: 1, credits: 99 }, who, { 'idempotency-key': key() })).status, 200, 'what a page sends beside the pack is ignored');
    eq(F.stripe.asked[n]['line_items[0][price_data][unit_amount]'], '299', 'the price is the config\'s, never the page\'s'); eq(F.stripe.asked[n]['metadata[credits]'], '1'); eq(F.stripe.asked.length, n + 1);
    // coming soon
    const was = CFG.packs[0].cents; CFG.packs[0].cents = null;
    try { r = await POST('/api/buy', { pack: 'one' }, who, { 'idempotency-key': key() }); eq(r.status, 409, 'a pack with no price cannot be bought'); ok(/coming soon/.test(r.json.error)); eq(F.stripe.asked.length, n + 1, 'Stripe is not asked');
      const p = (await GET('/api/me', who)).json.config.packs; eq(p[0].soon, true, '/api/me shows it as soon'); eq(p[0].cents, null); eq(p[1].soon, false); } finally { CFG.packs[0].cents = was; }
    eq((await GET('/api/me', who)).json.config.packs[0].soon, false);
    // the same key: the same checkout
    const k = key(), n1 = F.stripe.asked.length, a = await POST('/api/buy', { pack: 'five' }, who, { 'idempotency-key': k }), b = await POST('/api/buy', { pack: 'five' }, who, { 'idempotency-key': k }), both = await Promise.all([POST('/api/buy', { pack: 'five' }, who, { 'idempotency-key': k }), POST('/api/buy', { pack: 'five' }, who, { 'idempotency-key': k })]);
    eq(b.json.url, a.json.url, 'the same Idempotency-Key gives the same checkout'); eq(b.heads['idempotent-replay'], 'true'); eq(both[0].json.url, a.json.url); eq(both[1].json.url, a.json.url); eq(F.stripe.asked.length, n1 + 1, 'and no second Stripe session'); eq(sessionOf(a.json.url).idem, CFG.app + '-buy-' + k, 'Stripe is given the key too');
    const k2 = key(), two = await Promise.all([POST('/api/buy', { pack: 'ten' }, who, { 'idempotency-key': k2 }), POST('/api/buy', { pack: 'ten' }, who, { 'idempotency-key': k2 })]); eq(two[0].json.url, two[1].json.url, 'two at once with one key: one checkout'); eq(F.stripe.asked.length, n1 + 2);
    eq((await GET('/api/me', who)).json.user.credits, 0, 'asking for a checkout grants nothing by itself'); eq((await GET('/api/me', who)).json.user.paid, false);
    F.stripe.payment = 'paid';
  });

  await section('2. Coming back from Stripe', async function () {
    const who = await T.user('google:2', 'back@example.test'), other = await T.user('google:3', 'other@example.test'), confirm = function (id, w) { return GET('/api/buy/confirm?session_id=' + encodeURIComponent(id), w || who); };
    const bal = function (uid) { return S.balance(uid || 'google:2'); };
    eq((await confirm('cs_test_nope')).json.ok, false, 'a session that is not there'); eq((await GET('/api/buy/confirm', who)).json.ok, false); eq((await GET('/api/buy/confirm?session_id=x')).status, 401);
    // paid: granted once
    const s = await buy(who, 'five'); let r = await confirm(s.id); eq(r.status, 200); eq(r.json.ok, true, 'a paid session is confirmed'); eq(r.json.credits, 5, 'and grants the pack\'s credits');
    r = await confirm(s.id); eq(r.json.ok, true); eq(r.json.credits, 5, 'confirming twice grants once'); const many = await Promise.all([1, 2, 3, 4, 5, 6].map(function () { return confirm(s.id); })); ok(many.every(function (x) { return x.json.credits === 5; }), 'six at once: still once'); eq(await bal(), 5);
    eq(await count("SELECT COUNT(*) AS n FROM credit_log WHERE uid = 'google:2'"), 1, 'one line in credit_log'); const cl = await db.get("SELECT * FROM credit_log WHERE uid = 'google:2'"); eq(cl.delta, 5); eq(cl.ref, 'buy:' + s.id); eq(cl.why, 'bought five');
    let p = await db.all("SELECT * FROM purchases WHERE uid = 'google:2'"); eq(p.length, 1, 'one purchase'); eq(p[0].session, s.id); eq(p[0].amount, 999, 'the amount is recorded'); eq(p[0].currency, 'usd'); eq(p[0].live, 0, 'and that it was a test payment'); eq(p[0].pack, 'five'); eq(p[0].credits, 5);
    eq((await db.get('SELECT state FROM checkouts WHERE session = ?', [s.id])).state, 'paid'); let me = (await GET('/api/me', who)).json.user; eq(me.credits, 5); eq(me.paid, true, 'the account has paid'); eq(await count("SELECT COUNT(*) AS n FROM events WHERE kind = 'bought' AND uid = 'google:2'"), 1);
    // a live payment is recorded as live
    const live = await buy(who, 'one'); live.livemode = true; eq((await confirm(live.id)).json.credits, 6); eq((await db.get('SELECT live, amount FROM purchases WHERE session = ?', [live.id])).live, 1, 'livemode is recorded'); eq((await db.get('SELECT amount FROM purchases WHERE session = ?', [live.id])).amount, 299);
    // not paid
    F.stripe.payment = 'unpaid'; const u = await buy(who, 'ten'); F.stripe.payment = 'paid'; r = await confirm(u.id); eq(r.json.ok, false, 'an unpaid session is not confirmed'); eq(r.json.credits, 6, 'and grants nothing'); eq(await count('SELECT COUNT(*) AS n FROM purchases WHERE session = ?', [u.id]), 0); eq((await db.get('SELECT state FROM checkouts WHERE session = ?', [u.id])).state, 'open');
    u.payment_status = 'paid'; eq((await confirm(u.id)).json.credits, 16, 'once it is paid, it is');
    // another account's session; another app's session
    const mine = await buy(who, 'ten'); r = await confirm(mine.id, other); eq(r.json.ok, false, 'another account\'s session grants nothing'); eq(r.json.credits, 0); eq(await bal('google:3'), 0); eq(await bal(), 16, 'to either'); eq(await count('SELECT COUNT(*) AS n FROM purchases WHERE session = ?', [mine.id]), 0);
    const foreign = await buy(who, 'ten'); foreign.metadata.app = 'another-glyphh-game'; r = await confirm(foreign.id); eq(r.json.ok, false, 'a session of another app grants nothing'); eq(r.json.credits, 16);
    const nometa = await buy(who, 'ten'); nometa.metadata = {}; eq((await confirm(nometa.id)).json.ok, false, 'nor one with no metadata'); const nopack = await buy(who, 'ten'); nopack.metadata.pack = 'hundred'; eq((await confirm(nopack.id)).json.ok, false, 'nor one for a pack that is not ours'); eq(await bal(), 16);
    eq((await confirm(mine.id)).json.credits, 26, '(its own buyer is granted it)'); eq(await count("SELECT COUNT(*) AS n FROM purchases WHERE uid = 'google:2'"), 4);
    const sum = (await db.get("SELECT SUM(delta) AS n FROM credit_log WHERE uid = 'google:2'")).n; eq(sum, 26, 'the balance is the sum of credit_log'); eq((await db.get("SELECT SUM(amount) AS n FROM purchases WHERE uid = 'google:2'")).n, 999 + 299 + 1799 + 1799, 'purchases add up to what was paid');
    // Stripe is down when they come back: nothing granted, nothing lost
    const down = await buy(who, 'one'), f0 = S.seam.fetch; S.seam.fetch = async function () { throw new Error('socket hang up'); }; r = await confirm(down.id); S.seam.fetch = f0; eq(r.status, 200); eq(r.json.ok, false, 'Stripe not answering: not confirmed'); eq(r.json.credits, 26); eq((await confirm(down.id)).json.credits, 27, 'and confirmed when it answers');
  });

  await section('3. A buyer who paid and never came back', async function () {
    try {
      // paid, never confirmed: found at the next /api/me
      const a = await T.user('google:10', 'gone@example.test'), s = await buy(a, 'five'); eq(await S.balance('google:10'), 0, 'paid, and the buyer closed the tab: nothing yet');
      let me = (await GET('/api/me', a)).json.user; eq(me.credits, 5, 'the next /api/me grants it'); eq(me.paid, true); eq((await db.get('SELECT state FROM checkouts WHERE session = ?', [s.id])).state, 'paid'); eq((await db.get('SELECT amount FROM purchases WHERE session = ?', [s.id])).amount, 999);
      for (const ms of [0, 61000, 200000]) { later(ms); eq((await GET('/api/me', a)).json.user.credits, 5, 'and only once (' + ms / 1000 + ' s later)'); } Date.now = realNow;
      eq((await GET('/api/buy/confirm?session_id=' + s.id, a)).json.credits, 5, 'coming back after all changes nothing'); eq(await count("SELECT COUNT(*) AS n FROM credit_log WHERE uid = 'google:10'"), 1); eq(await count("SELECT COUNT(*) AS n FROM purchases WHERE uid = 'google:10'"), 1);
      // unpaid stays open and is granted when it is paid; expired is marked
      const b = await T.user('google:11', 'slow@example.test'); F.stripe.payment = 'unpaid'; const open = await buy(b, 'one'), dead = await buy(b, 'ten'); F.stripe.payment = 'paid'; dead.status = 'expired';
      eq((await GET('/api/me', b)).json.user.credits, 0, 'an unpaid session grants nothing'); eq((await db.get('SELECT state FROM checkouts WHERE session = ?', [open.id])).state, 'open', 'and stays open'); eq((await db.get('SELECT state FROM checkouts WHERE session = ?', [dead.id])).state, 'expired', 'an expired one is marked expired');
      const asked = F.net.length; eq((await GET('/api/me', b)).json.user.credits, 0); eq(F.net.length, asked, 'Stripe is not asked again within the minute');
      later(61000); const n1 = F.net.length; await GET('/api/me', b); ok(F.net.slice(n1).some(function (u) { return u.indexOf(open.id) > 0; }), 'the open one is asked about again later'); ok(!F.net.slice(n1).some(function (u) { return u.indexOf(dead.id) > 0; }), 'the expired one is not');
      open.payment_status = 'paid'; later(130000); me = (await GET('/api/me', b)).json.user; eq(me.credits, 1, 'and is granted once it is paid'); eq(me.paid, true); later(200000); eq((await GET('/api/me', b)).json.user.credits, 1); Date.now = realNow;
      dead.payment_status = 'paid'; dead.status = 'complete'; later(300000); eq((await GET('/api/me', b)).json.user.credits, 1, 'a session marked expired is not looked at again'); Date.now = realNow;
      // one that is too old is left alone; a closed account is not looked up; Stripe being down breaks nothing
      const c = await T.user('google:12', 'old@example.test'), old = await buy(c, 'one'); await db.run('UPDATE checkouts SET at = ? WHERE session = ?', [Date.now() - 3 * 864e5, old.id]); eq((await GET('/api/me', c)).json.user.credits, 0, 'a checkout older than two days is not looked for');
      const d = await T.user('google:13', 'closed@example.test'); await buy(d, 'one'); await db.run("UPDATE users SET banned = 1 WHERE id = 'google:13'"); const n2 = F.net.length; eq((await GET('/api/me', d)).json.user.credits, 0, 'a closed account is not granted'); eq(F.net.length, n2);
      const e = await T.user('google:14', 'unlucky@example.test'), es = await buy(e, 'one'), f0 = S.seam.fetch; S.seam.fetch = async function () { throw new Error('socket hang up'); }; const r = await GET('/api/me', e); S.seam.fetch = f0; eq(r.status, 200, 'Stripe being down does not break /api/me'); eq(r.json.user.credits, 0);
      later(61000); eq((await GET('/api/me', e)).json.user.credits, 1, 'and the credit is found at the next look'); eq((await db.get('SELECT state FROM checkouts WHERE session = ?', [es.id])).state, 'paid');
    } finally { Date.now = realNow; F.stripe.payment = 'paid'; }
    const all = logs.join('\n') + JSON.stringify(await db.all('SELECT * FROM purchases')) + JSON.stringify(await db.all('SELECT * FROM checkouts')); ok(all.indexOf('sk_test_fake') < 0, 'the Stripe key is in no log and no row');
    ok(F.net.every(function (u) { return /^https:\/\/api\.stripe\.com\/v1\/checkout\/sessions(\/\w*)?$/.test(u); }), 'Stripe was asked for Checkout sessions and nothing else'); ok(!F.net.some(function (u) { return /refund|subscription|customer|portal|price|webhook/.test(u); }));
  });

  await section('4. What the source must not say', async function () {
    const ROOT = K.ROOT, EXT = /\.(js|html|css|md)$/, files = [];
    fs.readdirSync(ROOT).forEach(function (f) { if (EXT.test(f) && fs.statSync(path.join(ROOT, f)).isFile()) files.push(f); }); fs.readdirSync(path.join(ROOT, 'legal')).forEach(function (f) { if (EXT.test(f)) files.push('legal/' + f); });
    ok(files.length >= 20 && ['server.js', 'config.js', 'admin.js', 'email.js', 'net.js', 'app.js', 'app.html', 'landing.html', 'card.html', 'legal/refunds.md', 'legal/terms.md'].every(function (f) { return files.indexOf(f) >= 0; }), files.length + ' shipped files are read');
    const text = {}; files.forEach(function (f) { text[f] = fs.readFileSync(path.join(ROOT, f), 'utf8'); });
    const never = function (re, what, only) { files.forEach(function (f) { if (only && !only(f)) return; const lines = text[f].split('\n'), at = lines.findIndex(function (l) { return re.test(l); }); ok(at < 0, f + ':' + (at + 1) + ' ' + what + ': ' + (at >= 0 ? lines[at].trim().slice(0, 140) : '')); }); };
    // no way to give money back, and no promise of it
    never(/(?<!\/legal)\/refunds\b/, 'calls a refunds address'); never(/refunds?\s*\.\s*create/i, 'creates a refund'); never(/refunded in full|will be refunded|full refund|money-back/i, 'promises money back'); never(/charges\/[\w${}]+\/refund|payment_intents\/[\w${}]+\/cancel/i, 'reverses a payment');
    // nothing recurring
    never(/mode['"]?\s*[:=]\s*['"]subscription/, 'a subscription checkout'); never(/billing_portal/, 'the billing portal'); never(/customer portal/i, 'a customer portal'); never(/renews monthly/i, 'says it renews'); never(/per month/i, 'a monthly price'); never(/\/month\b/, 'a monthly price'); never(/\/mo\b|\bmonthly plan|\bannual plan|\bfree trial/i, 'a plan');
    never(/['"]\/v1\/(subscriptions|prices|plans|invoices)\b|recurring\]|\[recurring/, 'a recurring price', function (f) { return /\.js$/.test(f); });
    // no webhook
    never(/['"`]\/[\w\/-]*webhooks?\b/i, 'a webhook route', function (f) { return /\.(js|html)$/.test(f); }); never(/Stripe-Signature|constructEvent|whsec_/i, 'reads a webhook\'s signature');
    ok(!S.ROUTES.some(function (r) { return /webhook|refund|subscri|portal/i.test(r) && r !== 'GET /legal/:page'; }), 'no such route'); eq((await T.call('POST', '/api/webhook', {})).status, 404); eq((await T.call('POST', '/webhook', {})).status, 405, 'POST /webhook is nothing');
    ok(!S.Admin.TOOLS.some(function (t) { return /refund/i.test(t.name) || /\brefund/i.test(t.description); }), 'and no admin tool gives money back');
    // the final-sale sentence: once, in config.js
    const FINAL = 'One-time purchase. Not refundable.'; ok(text['config.js'].indexOf("finalSale: '" + FINAL + "'") > 0, 'the sentence is in config.js'); eq(text['server.js'].indexOf(FINAL), -1, 'server.js reads it from config'); ok(/custom_text\[submit\]\[message\]': CFG\.finalSale/.test(text['server.js']), 'and gives it to Stripe');
    eq((await GET('/api/me')).json.config.finalSale, FINAL, '/api/me gives it to the pages');
    for (const f of ['app.js', 'landing.html', 'landing.js', 'card.js', 'app.html', 'card.html', 'admin.html', 'admin-ui.js', 'style.css', 'net.js']) {
      if (text[f].length < 200) { say('   PENDING ' + f + ' (still a placeholder of ' + text[f].length + ' bytes: its final-sale check waits)'); continue; }
      eq(text[f].indexOf(FINAL), -1, f + ' does not type the final-sale sentence'); ok(!/Not refundable/i.test(text[f]), f + ' does not type a version of it');
      if (f === 'app.js') ok(/finalSale|\{\{finalsale\}\}/.test(text[f]) || /\{\{finalsale\}\}/.test(text['app.html']), 'app.js / app.html show config.finalSale at the buy button');
    }
    const drawn = (await GET('/make')).text; if (text['app.html'].indexOf('{{finalsale}}') >= 0) ok(drawn.indexOf(FINAL) > 0 && drawn.indexOf('{{finalsale}}') < 0, 'the {{finalsale}} token is filled in'); else say('   NOTE app.html has no {{finalsale}} token (the sentence must then come from /api/me in app.js)');
    const pol = (await GET('/legal/refunds')).text; ok(pol.indexOf(FINAL) > 0, 'the refund policy says the same sentence'); ok(/All sales are final/.test(pol));
    // no AI model's name anywhere, tests included; and the secrets file is not committed
    const MODEL = /claude-(opus|sonnet|haiku|fable)|music_v\d|gpt-\d/i; never(MODEL, 'names an AI model');
    fs.readdirSync(path.join(ROOT, 'test')).filter(function (f) { return /\.(cjs|js|json|md)$/.test(f); }).concat(['../package.json', '../.gitignore']).forEach(function (f) { const t = fs.readFileSync(path.join(ROOT, 'test', f), 'utf8'); ok(!MODEL.test(t), 'test/' + f + ' names no AI model'); });
    const ignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').split('\n').map(function (l) { return l.trim(); }); ok(ignore.indexOf('.env') >= 0, '.env is in .gitignore'); ok(ignore.indexOf('node_modules') >= 0);
    never(/sk_(live|test)_[A-Za-z0-9]{10,}|re_[A-Za-z0-9]{20,}|sk-ant-[\w-]{10,}/, 'holds a key');
  });

  await T.done();
  say('OK money (' + checks + ' checks, ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s)');
  process.exit(0);
})().catch(function (e) { process.stdout.write('FAILED money: ' + (e && e.stack || e) + '\n--- the server\'s last lines ---\n' + logs.slice(-8).join('\n') + '\n'); process.exit(1); });
