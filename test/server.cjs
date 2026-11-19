'use strict';
// node test/server.cjs
// The server, section by section, through test/kit.cjs: handle(req, res) in this process, fakes for everything
// outside, a fresh database and a fresh folder. One real render (small frames, section 6); every other carol here
// is "rendered" by a stand-in that writes small files, so the run stays short. No port, no network.
process.env.CONFIG_OVERRIDE = JSON.stringify({ video: { sizes: { story: [270, 480], square: [270, 270] } } });
const assert = require('node:assert'), fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto'), os = require('os');
const K = require('./kit.cjs');

let checks = 0, part = 0;
const ok = function (v, msg) { checks++; part++; assert.ok(v, msg); }, eq = function (a, b, msg) { checks++; part++; assert.strictEqual(a, b, msg); };
const say = function (s) { process.stdout.write(s + '\n'); };
const logs = []; ['log', 'error', 'warn', 'info'].forEach(function (k) { console[k] = function () { logs.push(Array.from(arguments).map(String).join(' ')); }; });
const T0 = Date.now();

(async function () {
  const T = await K.open('server'), S = T.S, db = S.db, F = T.fakes, SITE = T.site;
  const CFG = require('../config.js'), Agent = require('../agent.js'), Song = require('../song.js'), Templates = require('../templates.js'), Render = require('../render.js'), canvas = require('@napi-rs/canvas');
  const STORE = path.join(T.dir, 'store'), TPL = Templates.list[0], YEAR = new Date().getUTCFullYear(), TODAY = new Date().toISOString().slice(0, 10);
  const ip = function (n) { return { 'fly-client-ip': '10.9.0.' + n }; };
  const GET = function (u, who, more) { return T.call('GET', u, null, Object.assign({}, who, more)); };
  const POST = function (u, b, who, more) { return T.call('POST', u, b === undefined ? {} : b, Object.assign({}, who, more)); };
  const DEL = function (u, who) { return T.call('DELETE', u, null, who); };
  const key = function () { return crypto.randomBytes(12).toString('hex'); };
  const count = async function (sql, p) { return (await db.get(sql, p || [])).n; };
  const maker = async function (n, email, credits, paid) { const who = await T.user('google:' + n, email, credits); if (paid !== false) await db.run('UPDATE users SET paid = 1 WHERE id = ?', ['google:' + n]); return who; };
  const cookieOf = function (r) { const m = /^(sac=[^;]+)/.exec(r.heads['set-cookie'] || ''); return m ? { cookie: m[1] } : null; };
  const walk = function (dir) { let out = []; if (!fs.existsSync(dir)) return out; fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) { const f = path.join(dir, e.name); if (e.isDirectory()) out = out.concat(walk(f)); else out.push(f); }); return out; };
  const pic = function (type, w, h, hue) { const cv = canvas.createCanvas(w, h), c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'hsl(' + (hue || 0) + ',70%,60%)'); g.addColorStop(1, '#fff8ee'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#2a1a2e'; c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) / 4, 0, 7); c.fill(); return cv.toBuffer(type); };
  const upload = function (id, buf, type, who, more) { return T.call('POST', '/api/cards/' + id + '/photos', buf, Object.assign({ 'content-type': type }, who, more)); };
  const admin = function (name, args) { return S.Admin.call(name, args, { label: 'the test' }, 'web'); };
  const section = async function (title, work) { say('== ' + title); part = 0; const t = Date.now(); await work(); say('   ' + part + ' checks, ' + ((Date.now() - t) / 1000).toFixed(1) + ' s'); };

  // every change to a job's row, as it is written (for the progress checks)
  const jobLog = [], run0 = db.run;
  db.run = function (s, p) { if (/^UPDATE jobs SET/.test(s) && /, updated = \? WHERE id = \?$/.test(s)) { const cols = /SET (.*?),? updated = \? WHERE/.exec(s)[1].split(', ').map(function (x) { return x.split(' = ')[0]; }), o = { id: p[p.length - 1] }; cols.forEach(function (c, i) { o[c] = p[i]; }); jobLog.push(o); } return run0.call(db, s, p); };
  // the stand-in for the video: small files of the right kinds
  const realRender = Render.render, JPG = pic('image/jpeg', 64, 64, 20), made = { real: 0, fake: 0 };
  const fakeRender = async function (o) { made.fake++; await o.onProgress(50, 'rendering'); const w = function (n, b) { const f = path.join(o.dir, n); fs.writeFileSync(f, b); return f; }, mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(600, 7)]);
    return { story: w('story.mp4', mp4), square: w('square.mp4', mp4), poster: w('poster.jpg', JPG), posterStory: w('poster-story.jpg', JPG), preview: w('preview.gif', Buffer.from('GIF89a' + 'x'.repeat(40))), frames: 1, duration: 1, seconds: 0 }; };
  Render.render = fakeRender;

  await section('1. Sign-in', async function () {
    const A = ip(1), SECRETS = ['test-secret', 'open-sesame', 'sk_test_fake', 're_test_never_used', process.env.ADMIN_MCP_KEY];
    // /api/me, signed out
    let me = await GET('/api/me');
    eq(me.status, 200, '/api/me answers'); eq(me.json.user, null, 'signed out: no user'); eq(me.json.google, process.env.GOOGLE_CLIENT_ID, 'the Google client id'); eq(me.json.emailSignIn, true, 'email sign-in is on');
    eq(Object.keys(me.json).sort().join(), 'build,config,emailSignIn,google,user', '/api/me\'s keys'); eq(me.heads['x-build'], me.json.build, 'X-Build is the build');
    const c = me.json.config;
    ['name', 'tagline', 'domain', 'site', 'noun', 'support', 'finalSale', 'currency', 'packs', 'limits', 'video', 'occasions', 'featured', 'payments', 'agent', 'music', 'email'].forEach(function (k) { ok(c[k] !== undefined, 'config.' + k + ' is there'); });
    eq(c.name, CFG.name); eq(c.noun, 'carol'); eq(c.support, 'support@glyphh.ai'); eq(c.finalSale, 'One-time purchase. Not refundable.'); eq(c.site, SITE); eq(c.currency, 'usd');
    eq(JSON.stringify(c.limits), JSON.stringify({ photos: 8, photoBytes: 25 * 1024 * 1024, takes: 3, rewrites: 10, freeDrafts: 3, recipients: 10, lines: 10, lineChars: 64, details: 1200 }), 'config.limits');
    eq(JSON.stringify(c.video), '{"min":20,"max":40}', 'config.video'); eq(JSON.stringify(c.packs.map(function (p) { return [p.id, p.credits, p.cents, p.soon]; })), '[["one",1,499,false],["five",5,1499,false],["ten",10,2499,false]]', 'config.packs');
    ok(c.payments === true && c.agent === true && c.music === true && c.email === true, 'what is set up'); ok(SECRETS.every(function (s) { return me.text.indexOf(s) < 0; }), 'no secret in /api/me');

    // Google
    const sent0 = F.sent.length;
    let r = await POST('/api/auth/google', { credential: F.google.token({ sub: '1001', email: 'Ann@Example.test', email_verified: true, name: 'Ann Maker' }) }, A);
    eq(r.status, 200, 'a good Google token signs in'); const ann = cookieOf(r); ok(ann, 'and sets the session cookie'); ok(/HttpOnly/.test(r.heads['set-cookie']) && /Secure/.test(r.heads['set-cookie']) && /SameSite=Lax/.test(r.heads['set-cookie']), 'HttpOnly, Secure, SameSite=Lax');
    me = await GET('/api/me', ann);
    eq(me.json.user.id, 'google:1001'); eq(me.json.user.email, 'ann@example.test', 'the verified email, lower case'); eq(me.json.user.name, 'Ann Maker'); eq(me.json.user.credits, 0); eq(me.json.user.paid, false); eq(me.json.user.admin, false);
    ['id', 'name', 'email', 'credits', 'paid', 'admin'].forEach(function (k) { ok(k in me.json.user, 'user.' + k); });
    const refused = async function (what, credential) { const users = await count('SELECT COUNT(*) AS n FROM users'), x = await POST('/api/auth/google', { credential: credential }, A); eq(x.status, 401, what + ' is refused'); ok(!x.heads['set-cookie'], what + ': no cookie'); eq(await count('SELECT COUNT(*) AS n FROM users'), users, what + ': no account made'); };
    await refused('a token for another audience', F.google.token({ sub: '1003', aud: 'someone-else.apps.googleusercontent.test', email: 'x@example.test', email_verified: true }));
    await refused('an expired token', F.google.token({ sub: '1003', exp: Math.floor(Date.now() / 1000) - 60 }));
    await refused('a token from another issuer', F.google.token({ sub: '1003', iss: 'https://accounts.evil.test' }));
    await refused('a token with no subject', F.google.token({ email: 'x@example.test' }));
    const good = F.google.token({ sub: '1003', email: 'eve@example.test', email_verified: true }).split('.');
    await refused('a tampered token', good[0] + '.' + Buffer.from(JSON.stringify(Object.assign(JSON.parse(Buffer.from(good[1], 'base64url')), { sub: '1001' }))).toString('base64url') + '.' + good[2]);
    await refused('a token signed with another key', F.google.token({ sub: '1001' }, crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey));
    await refused('an unsigned token', Buffer.from('{"alg":"none","kid":"k1"}').toString('base64url') + '.' + good[1] + '.');
    await refused('garbage', 'not.a.token'); await refused('nothing', '');
    r = await POST('/api/auth/google', { credential: F.google.token({ sub: '1002', email: 'unverified@example.test', email_verified: false, name: 'Un Verified' }) }, A);
    eq(r.status, 200, 'an unverified email still signs in'); eq((await GET('/api/me', cookieOf(r))).json.user.email, '', 'but the address is not stored'); eq((await db.get('SELECT email FROM users WHERE id = ?', ['google:1002'])).email, '', 'not in the database either');
    eq(await count("SELECT COUNT(*) AS n FROM users WHERE LOWER(email) = 'unverified@example.test'"), 0, 'nowhere');
    // a session cookie that was changed, or has run out
    const v = ann.cookie.slice(4).split('.'); eq((await GET('/api/me', { cookie: 'sac=' + Buffer.from('google:1002').toString('base64url') + '.' + v[1] + '.' + v[2] })).json.user, null, 'a changed cookie is nobody');
    const old = Buffer.from('google:1001').toString('base64url') + '.' + (Date.now() - 1000); eq((await GET('/api/me', { cookie: 'sac=' + old + '.' + crypto.createHmac('sha256', 'test-secret').update(old).digest('base64url') })).json.user, null, 'a cookie that ran out is nobody');
    // too many tries
    let last; for (let i = 0; i < 31; i++) last = await POST('/api/auth/google', { credential: 'x.y.z' }, ip(2)); eq(last.status, 429, 'the 31st try from one place is told to wait');

    // the emailed link
    r = await POST('/api/auth/link', { email: 'Bea@Example.test', back: '/make?card=abc' }, A); eq(r.status, 200); eq(r.json.ok, true, 'the link is sent'); eq(F.sent.length, sent0 + 1, 'one email');
    let m = F.sent[F.sent.length - 1]; eq(m.from, CFG.emailFrom, 'from config.emailFrom'); eq(m.to.join(), 'bea@example.test'); eq(m.auth, 'Bearer re_test_never_used', 'with the Resend key');
    const tokenOf = function (mail) { return /\/auth\/link\?token=([A-Za-z0-9_-]{30,})/.exec(mail.text)[1]; }; let token = tokenOf(m);
    ok(m.html.indexOf(SITE + '/auth/link?token=' + token) >= 0 && m.text.indexOf(SITE + '/auth/link?token=' + token) >= 0, 'the token is in the mail (html and text)');
    ok(logs.join('\n').indexOf(token) < 0, 'and nowhere in the logs'); ok(JSON.stringify(await db.all('SELECT * FROM email_links')).indexOf(token) < 0, 'and not in the database (only its hash)'); ok(r.text.indexOf(token) < 0, 'and not in the answer');
    eq((await GET('/api/me', A)).json.user, null, 'asking signs nobody in');
    for (let i = 0; i < 2; i++) { r = await GET('/auth/link?token=' + token, A); eq(r.status, 200, 'GET shows a page'); ok(/<form method="post" action="\/auth\/link">/.test(r.text) && /<button/.test(r.text) && r.text.indexOf('bea@example.test') > 0, 'with a button'); ok(!r.heads['set-cookie'], 'and signs nobody in'); }
    eq((await db.get('SELECT used FROM email_links WHERE hash = ?', [S.mail.hash(token)])).used, 0, 'a GET spends nothing');
    r = await T.call('POST', '/auth/link', 'token=' + token, Object.assign({ 'sec-fetch-site': 'cross-site' }, A)); eq(r.status, 400, 'a press from another site is refused'); ok(!r.heads['set-cookie']);
    r = await T.call('POST', '/auth/link', 'token=' + token, A); eq(r.status, 303, 'POST signs in'); eq(r.heads.location, '/make?card=abc', 'and goes back where it was asked from'); const bea = cookieOf(r); ok(bea, 'with a cookie');
    me = await GET('/api/me', bea); eq(me.json.user.id, 'email:bea@example.test'); eq(me.json.user.email, 'bea@example.test');
    r = await T.call('POST', '/auth/link', 'token=' + token, A); eq(r.status, 400, 'a second POST is refused'); ok(!r.heads['set-cookie'], 'no cookie the second time'); ok(/spent/.test(r.text), 'and says the link is spent');
    eq((await GET('/auth/link?token=' + token, A)).status, 400, 'and its page is gone');
    eq((await T.call('POST', '/auth/link', 'token=' + 'A'.repeat(43), A)).status, 400, 'a made-up token is refused'); eq((await T.call('POST', '/auth/link', '', A)).status, 400, 'no token is refused');
    await POST('/api/auth/link', { email: 'bea@example.test', back: 'https://evil.test/x' }, A); token = tokenOf(F.sent[F.sent.length - 1]);
    await db.run('UPDATE email_links SET expires = ? WHERE hash = ?', [Date.now() - 1000, S.mail.hash(token)]);
    eq((await GET('/auth/link?token=' + token, A)).status, 400, 'an expired link shows no button'); r = await T.call('POST', '/auth/link', 'token=' + token, A); eq(r.status, 400, 'an expired link is refused'); ok(!r.heads['set-cookie']);
    await POST('/api/auth/link', { email: 'bea@example.test', back: '//evil.test/x' }, A); r = await T.call('POST', '/auth/link', 'token=' + tokenOf(F.sent[F.sent.length - 1]), A); eq(r.heads.location, '/make', 'a way back to another site is not followed');
    eq((await POST('/api/auth/link', { email: 'not an address' }, A)).status, 400, 'a bad address is refused'); eq((await T.call('PUT', '/auth/link', null, A)).status, 405, 'PUT is not allowed');
    // rate limits: three live links for one address; five an hour for one address; twenty an hour from one place
    const n0 = F.sent.length; for (let i = 0; i < 3; i++) eq((await POST('/api/auth/link', { email: 'cy@example.test' }, ip(3))).status, 200, 'link ' + (i + 1) + ' for one address');
    r = await POST('/api/auth/link', { email: 'cy@example.test' }, ip(3)); eq(r.status, 429, 'the fourth live link for one address is refused'); eq(F.sent.length, n0 + 3, 'and not sent');
    await db.run('UPDATE email_links SET used = 1 WHERE email = ?', ['cy@example.test']); for (let i = 0; i < 2; i++) eq((await POST('/api/auth/link', { email: 'cy@example.test' }, ip(3))).status, 200);
    await db.run('UPDATE email_links SET used = 1 WHERE email = ?', ['cy@example.test']); r = await POST('/api/auth/link', { email: 'cy@example.test' }, ip(3)); eq(r.status, 429, 'the sixth link in an hour for one address is refused'); ok(/that address/.test(r.json.error));
    for (let i = 0; i < 20; i++) last = await POST('/api/auth/link', { email: 'p' + i + '@example.test' }, ip(4)); eq(last.status, 200, 'twenty links from one place'); r = await POST('/api/auth/link', { email: 'p20@example.test' }, ip(4)); eq(r.status, 429, 'the 21st is refused'); ok(r.json.error, 'with a sentence');
    // Google with the same verified address joins the email account; an unverified one does not
    r = await POST('/api/auth/google', { credential: F.google.token({ sub: '1005', email: 'bea@example.test', email_verified: true, name: 'Bea' }) }, A); eq((await GET('/api/me', cookieOf(r))).json.user.id, 'email:bea@example.test', 'Google with the same verified address is the same account');
    r = await POST('/api/auth/google', { credential: F.google.token({ sub: '1006', email: 'bea@example.test', email_verified: false }) }, A); eq((await GET('/api/me', cookieOf(r))).json.user.id, 'google:1006', 'an unverified one is not');
    // sign out
    r = await POST('/api/auth/out', {}, ann); eq(r.status, 200); ok(/^sac=;/.test(r.heads['set-cookie']) && /Max-Age=0/.test(r.heads['set-cookie']), 'signing out clears the cookie');
    eq((await GET('/api/cards')).status, 401, 'signed out: the maker\'s calls are refused'); eq((await POST('/api/cards', { template: TPL.id })).status, 401);
    // a closed account
    const ban = await maker(1100, 'closed@example.test', 2), bc = await T.carol(ban, { song: false, photos: 0, answers: { from: 'Closed Account' } }); await db.run("UPDATE users SET banned = 1, why = 'test' WHERE id = 'google:1100'");
    me = await GET('/api/me', ban); eq(me.status, 200, 'a closed account still sees /api/me'); eq(me.json.user.banned, true, 'which says it is closed');
    for (const x of [['GET', '/api/cards'], ['POST', '/api/cards'], ['GET', '/api/templates'], ['GET', '/api/cards/' + bc.id], ['POST', '/api/cards/' + bc.id + '/write'], ['POST', '/api/cards/' + bc.id + '/song'], ['POST', '/api/cards/' + bc.id + '/save'], ['POST', '/api/buy'], ['GET', '/api/buy/confirm?session_id=x'], ['DELETE', '/api/cards/' + bc.id], ['POST', '/api/report']]) {
      r = await T.call(x[0], x[1], x[0] === 'POST' ? { template: TPL.id, pack: 'one' } : null, ban); eq(r.status, 403, 'closed: ' + x.join(' ') + ' is refused'); ok(r.json.error.indexOf(CFG.support) > 0, 'with the support address'); }
    eq(await count("SELECT COUNT(*) AS n FROM jobs WHERE card = ?", [bc.id]), 0, 'and nothing was done for it'); eq((await POST('/api/auth/out', {}, ban)).status, 200, 'it can sign out');
  });

  await section('2. Card names', async function () {
    ['the-hollisters-2026', 'abc', 'a1b', 'x'.repeat(40), 'june-and-co', '2026', 'a-b-c-d'].forEach(function (s) { eq(S.slugProblem(s), '', s + ' is a good name'); });
    [['ab', 'too short'], ['x'.repeat(41), 'too long'], ['Abc', 'a capital'], ['a_b', 'an underscore'], ['a b', 'a space'], ['a.b', 'a dot'], ['a/b', 'a slash'], ['-abc', 'a leading hyphen'], ['abc-', 'a trailing hyphen'], ['a--b', 'a double hyphen'], ['café', 'an accent'], ['', 'empty'], [null, 'null'], [123, 'a number'], ['abc\n', 'a newline'],
      ['app.js', 'a file'], ['style.css', 'a file'], ['index.html', 'a file'], ['robots.txt', 'a file'], ['favicon.ico', 'a file'], ['sitemap.xml', 'a file'], ['og.png', 'a file']].forEach(function (x) { ok(S.slugProblem(x[0]), x[1] + ' is refused: ' + JSON.stringify(x[0])); ok(/^[A-Z].*\.$/.test(S.slugProblem(x[0])), 'with a sentence'); });
    ['legal', 'admin', 'api', 'mcp', 'make', 'gallery', 'pricing', 'about', 'help', 'login', 'healthz', 'assets', 'fonts', 'examples'].forEach(function (w) { ok(CFG.reserved.indexOf(w) >= 0, 'config.reserved has ' + w); });
    const who = await maker(200, 'names@example.test', 0), other = await maker(201, 'names2@example.test', 0);
    for (const w of CFG.reserved) { ok(S.slugProblem(w), 'reserved: ' + w); const r = await GET('/api/slug?s=' + w); ok(r.json.ok === false && r.json.why, '/api/slug refuses ' + w); }
    // the suggestion, and the second one
    const a = await T.carol(who, { song: false, photos: 0 }); eq(a.slug, 'the-hollisters-' + YEAR, 'the suggested name'); ok(/^the-hollisters-\d{4}$/.test(a.slug));
    const b = await T.carol(other, { song: false, photos: 0 }); eq(b.slug, 'the-hollisters-' + YEAR + '-2', 'the second card of that name gets -2');
    const c = await T.carol(other, { song: false, photos: 0, answers: { from: '', to: 'Café & Co!' } }); eq(c.slug, 'cafe-and-co-' + YEAR, 'a name from who it is for, made plain');
    // the live check
    let r = await GET('/api/slug?s=June-Bug-2026'); eq(r.json.slug, 'june-bug-2026', 'the check lowers the case'); eq(r.json.ok, true, 'a free name is ok'); eq(r.json.why, '');
    r = await GET('/api/slug?s=' + a.slug); eq(r.json.ok, false, 'a taken name is not ok'); eq(r.json.why, 'That name is taken.'); eq((await GET('/api/slug?s=' + a.slug + '&card=' + a.id)).json.ok, true, 'but it is for the card that has it');
    r = await GET('/api/slug?s=ab'); eq(r.json.ok, false); ok(/3 to 40/.test(r.json.why), 'a short name says why');
    // saving a name
    const save = function (card, w, slug) { return POST('/api/cards/' + card.id + '/save', { slug: slug }, w); };
    r = await save(b, other, a.slug); eq(r.status, 409, 'a taken name is a 409'); ok(/taken/.test(r.json.error)); r = await save(b, other, 'admin'); eq(r.status, 400, 'a reserved name is refused'); r = await save(b, other, 'a--b'); eq(r.status, 400, 'a bad name is refused');
    for (const w of ['api', 'mcp', 'make', 'legal', 'healthz', 'assets']) eq((await save(b, other, w)).status, 400, w + ' cannot be saved as a name');
    eq((await GET('/api/cards/' + b.id, other)).json.card.slug, b.slug, 'and the name is as it was');
    r = await save(a, who, 'June-Bug-2026'); eq(r.status, 200); eq(r.json.card.slug, 'june-bug-2026', 'a draft\'s name can change'); eq(r.json.card.url, SITE + '/june-bug-2026');
    eq((await save(b, other, 'the-hollisters-' + YEAR)).status, 200, 'and the name it left is free');
    // ... until it is shared
    eq((await POST('/api/cards/' + a.id + '/share', {}, who)).status, 409, 'a draft cannot be shared');
    await S.grant('google:200', 1, 'test', 'test:names'); eq((await POST('/api/cards/' + a.id + '/song', {}, who)).status, 200); await S.jobs.drain();
    r = await save(a, who, 'june-bug'); eq(r.status, 200, 'a ready card\'s name can still change'); eq((await GET('/june-bug')).status, 200, 'and its page moves with it'); eq((await GET('/june-bug-2026')).status, 404);
    r = await POST('/api/cards/' + a.id + '/share', {}, who); eq(r.status, 200); eq(r.json.card.shared, true, 'shared');
    r = await save(a, who, 'june-bug-again'); eq(r.status, 409, 'a shared card\'s name never changes'); ok(/shared/.test(r.json.error)); eq((await save(a, who, 'june-bug')).status, 200, 'saving the same name is fine');
    eq((await GET('/api/cards/' + a.id, who)).json.card.slug, 'june-bug'); eq((await GET('/api/slug?s=june-bug-again')).json.ok, true);
  });

  await section('3. The card script', async function () {
    const who = await maker(300, 'script@example.test', 0), uid = 'google:300', other = await maker(301, 'script2@example.test', 0);
    const led = function (card) { return db.all('SELECT kind, tok_in, tok_out, micros, detail FROM ledger WHERE card = ? ORDER BY id', [card]); };
    const draft = async function (w, answers) { const r = await POST('/api/cards', { template: TPL.id, answers: Object.assign({ to: 'Grandma Dot', from: 'Script Family', details: 'Waffles the dog ate the gingerbread house.' }, answers) }, w); eq(r.status, 200, 'a draft is made'); return r.json.card; };
    // what is asked of the agent
    let card = await draft(who); eq(card.script, null, 'a new draft has no script'); eq(card.state, 'draft'); eq(card.slug, '');
    for (let i = 0; i < 3; i++) eq((await upload(card.id, pic('image/jpeg', 300, 400, i * 90), 'image/jpeg', who)).status, 200);
    card = (await GET('/api/cards/' + card.id, who)).json.card; const pids = card.photos.map(function (p) { return p.id; });
    eq((await POST('/api/cards/' + card.id + '/save', { notes: { [pids[1]]: 'Grandpa Joe by the truck' }, script: { title: 'Too early' } }, who)).json.card.script, null, 'saving a script before there is one makes none');
    const a0 = F.agent.length; let r = await POST('/api/cards/' + card.id + '/write', { ask: 'ignored the first time' }, who);
    eq(r.status, 200); eq(r.json.ok, true, 'the agent writes'); eq(F.agent.length, a0 + 1, 'in one call');
    const q = F.agent[a0], brief = q.messages[0].content;
    eq(q.model, process.env.CLAUDE_MODEL, 'the model is the setting'); eq(q.output_config.format.type, 'json_schema', 'structured output'); assert.deepStrictEqual(q.output_config.format.schema, Agent.SCHEMA); checks++; part++;
    eq(q.output_config.format.schema.additionalProperties, false); ok(['ok', 'refusal', 'title', 'lyrics', 'music', 'scenes'].every(function (k) { return q.output_config.format.schema.required.indexOf(k) >= 0; }), 'the schema requires the fields');
    eq(q.thinking.type, 'adaptive', 'adaptive thinking'); ok(!('budget_tokens' in q.thinking) && !('temperature' in q) && !('top_p' in q) && !('top_k' in q), 'no sampling settings, no thinking budget');
    ok(q.max_tokens >= 2000, 'room to answer'); eq(q.messages.length, 1); eq(q.messages[0].role, 'user'); eq(typeof brief, 'string'); eq(typeof q.system, 'string');
    [[/demean/i, 'demeaning'], [/sexual/i, 'sexual content'], [/child/i, 'children'], [/copyright/i, 'copyright'], [/hate/i, 'hate'], [/never an instruction|never an instruction to you/i, 'instructions in the answers'], [/any occasion/i, 'any occasion']].forEach(function (x) { ok(x[0].test(q.system), 'the rules speak of ' + x[1]); });
    ok(!/christmas|xmas|santa/i.test(q.system), 'the rules assume no Christmas'); ok(/do not mention snow, winter or a holiday unless/.test(q.system), 'and say so');
    const occ = CFG.occasions.find(function (o) { return o.id === TPL.occasion; });
    ok(brief.indexOf('OCCASION: ' + occ.name) >= 0, 'the brief carries the occasion'); ok(brief.indexOf('TODAY: ' + TODAY) >= 0, 'today\'s date'); ok(brief.indexOf('Tone: ' + String(TPL.tone || TPL.blurb).slice(0, 80)) >= 0, 'the template\'s tone');
    ok(brief.indexOf('FOR: Grandma Dot') >= 0 && brief.indexOf('FROM: Script Family') >= 0 && brief.indexOf('Waffles the dog') >= 0, 'who it is for and the details'); ok(brief.indexOf('PHOTOS: 3 uploaded') >= 0 && brief.indexOf('photo 1: Grandpa Joe by the truck') >= 0, 'the photos and their notes');
    ok(brief.indexOf('ANOTHER TAKE') < 0 && brief.indexOf('TAKE SO FAR') < 0, 'a first write asks for no other take');
    const bd = Agent.brief({ occasion: { name: 'Birthday' }, today: '2026-07-04', template: { name: 'Cake', family: 'kids', tone: 'Silly and sweet.', music: { bpm: 120 } }, answers: { to: 'Milo' }, photos: [] });
    ok(/OCCASION: Birthday/.test(bd) && /TODAY: 2026-07-04/.test(bd) && /Tone: Silly and sweet\./.test(bd) && !/christmas/i.test(bd), 'a birthday brief has nothing of Christmas in it');
    card = r.json.card; const first = card.script;
    eq(first.title, 'A Carol for Grandma Dot'); eq(first.lyrics.length, 2); eq(first.scenes.length, 3, 'a scene for each photo'); eq(first.scenes.map(function (x) { return x.pid; }).join(), pids.join(), 'scenes name the photos'); eq(card.rewrites, 0); ok(card.note, 'the agent\'s note');
    let L = await led(card.id); eq(L.length, 1, 'one ledger line for the call'); eq(L[0].kind, 'text'); eq(L[0].tok_in, 1200); eq(L[0].tok_out, 600); eq(L[0].micros, 1200 * CFG.cost.textInPerMTok + 600 * CFG.cost.textOutPerMTok, 'micro-dollars = tokens x config prices'); ok(/^first take/.test(L[0].detail));
    eq(JSON.stringify(Agent.costOf({ input_tokens: 10, cache_read_input_tokens: 5, cache_creation_input_tokens: 5, output_tokens: 3 })), JSON.stringify({ tok_in: 20, tok_out: 3, micros: 20 * CFG.cost.textInPerMTok + 3 * CFG.cost.textOutPerMTok }), 'cached tokens are counted');
    eq(Agent.costOf({ iterations: [{ input_tokens: 1, output_tokens: 1 }, { input_tokens: 2, output_tokens: 2 }] }).tok_in, 3, 'and every attempt');

    // agent.check
    const base = F.script(brief); let c = Agent.check(base, 3);
    eq(c.ok, true, 'check: good output passes'); eq(c.lyrics.reduce(function (n, s) { return n + s.lines.length; }, 0), 6); eq(c.scenes.length, 3); eq(c.music.bpm, 120); eq(c.title, base.title);
    const many = Object.assign({}, base, { lyrics: [{ section: 'verse', lines: Array.from({ length: 8 }, function (x, i) { return 'Verse line number ' + i; }) }, { section: 'hook', lines: Array.from({ length: 6 }, function (x, i) { return 'Hook line number ' + i; }) }, { section: 'verse', lines: ['One more'] }] });
    c = Agent.check(many, 0); eq(c.lyrics.reduce(function (n, s) { return n + s.lines.length; }, 0), CFG.limits.lyricLines, 'check: too many lines are trimmed to ' + CFG.limits.lyricLines); eq(c.lyrics.length, 2, 'and a section left empty is dropped'); eq(c.lyrics[0].lines.length, 8, 'the last sections give way first');
    const long = 'We saved a seat for you beside the fire and all the stories only we would ever know about the dog', nospace = 'x'.repeat(120);
    c = Agent.check(Object.assign({}, base, { lyrics: [{ section: 'verse', lines: [long, nospace, '  spaced   out   line  ', 'A fourth line', ''] }] }), 0);
    ok(c.lyrics[0].lines.every(function (l) { return l.length <= CFG.limits.lineChars; }), 'check: no line over ' + CFG.limits.lineChars); ok(long.indexOf(c.lyrics[0].lines[0]) === 0 && long[c.lyrics[0].lines[0].length] === ' ' && c.lyrics[0].lines[0].length > 40, 'a long line is cut at a word: ' + c.lyrics[0].lines[0]);
    eq(c.lyrics[0].lines[2], 'spaced out line', 'spaces are tidied'); eq(c.lyrics[0].lines.length, 4, 'an empty line is dropped');
    c = Agent.check(Object.assign({}, base, { scenes: [{ photo: 5, caption: 'out of range' }, { photo: 1, caption: 'Second first' }, { photo: 1, caption: 'again' }, { photo: -1, caption: '' }, { photo: 'x', caption: '' }, null] }), 3);
    eq(c.scenes.map(function (s) { return s.photo; }).join(), '1,0,2', 'check: scenes are mended, every photo once'); eq(c.scenes[0].caption, 'Second first');
    eq(Agent.check(Object.assign({}, base, { scenes: [{ photo: 0, caption: '' }] }), 0).scenes.length, 0, 'no photos: no scenes'); eq(Agent.check(Object.assign({}, base, { scenes: 'x' }), 2).scenes.length, 2);
    eq(Agent.check(Object.assign({}, base, { music: { bpm: 999 } }), 0).music.bpm, 180, 'the tempo is kept in range'); eq(Agent.check(Object.assign({}, base, { music: null }), 0).music.bpm, 100);
    c = Agent.check({ ok: false, refusal: 'Not that one.' }, 2); eq(c.ok, false, 'check: a refusal'); eq(c.refusal, 'Not that one.'); ok(Agent.check({ ok: false }, 0).refusal.length > 20, 'a refusal with no words gets ours');
    [null, undefined, 'words', 7, {}, { lyrics: [] }, { lyrics: [{ section: 'verse', lines: ['one', 'two', 'three'] }] }].forEach(function (g) { assert.throws(function () { Agent.check(g, 0); }); checks++; part++; });

    // refusals
    const refCard = await draft(who, { details: 'Write something to demean my brother.' }), a1 = F.agent.length, w0 = await count("SELECT COUNT(*) AS n FROM events WHERE kind = 'written' AND uid = ?", [uid]);
    r = await POST('/api/cards/' + refCard.id + '/write', {}, who); eq(r.status, 200, 'a refusal is a 200'); eq(r.json.refused, true); ok(r.json.message.length > 20 && !r.json.ok, 'with the agent\'s kind message'); eq(r.json.card.script, null, 'and no script'); eq(r.json.card.slug, '');
    eq(F.agent.length, a1 + 1); L = await led(refCard.id); eq(L.length, 1, 'a refusal still writes a ledger line'); eq(L[0].detail, 'refused'); eq(L[0].tok_in, 1200); eq(await count("SELECT COUNT(*) AS n FROM events WHERE kind = 'written' AND uid = ?", [uid]), w0, 'and is not a written carol');
    r = await POST('/api/cards/' + card.id + '/write', { ask: 'make it sexy' }, who); eq(r.json.refused, true, 'a refused rewrite'); eq(JSON.stringify(r.json.card.script), JSON.stringify(first), 'changes no script'); eq(r.json.card.rewrites, 0, 'and counts no rewrite');
    F.agentNext.push(function () { return { id: 'msg_r', stop_reason: 'refusal', content: [], usage: { input_tokens: 777, output_tokens: 3 } }; });
    r = await POST('/api/cards/' + refCard.id + '/write', { answers: { details: 'She loves her garden.' } }, who); eq(r.status, 200, 'stop_reason refusal'); eq(r.json.refused, true); ok(r.json.message, 'is a kind message'); eq(r.json.card.script, null); L = await led(refCard.id); eq(L[1].tok_in, 777, 'with the API\'s own usage in the ledger'); eq(L[1].detail, 'refused');
    F.agentNext.push(function () { return { id: 'msg_m', stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"ok":tr' }], usage: { input_tokens: 500, output_tokens: 8000 } }; });
    r = await POST('/api/cards/' + refCard.id + '/write', {}, who); eq(r.status, 502, 'max_tokens is an error'); ok(/cut off/.test(r.json.error), 'that says it was cut off'); L = await led(refCard.id); eq(L[2].detail, 'failed'); eq(L[2].tok_out, 8000, 'and is paid for in the ledger');
    F.agentNext.push(function () { return { id: 'msg_g', stop_reason: 'end_turn', content: [{ type: 'text', text: 'Sure! Here is your carol:' }], usage: { input_tokens: 5, output_tokens: 5 } }; });
    r = await POST('/api/cards/' + refCard.id + '/write', {}, who); eq(r.status, 502, 'an answer that is not JSON'); ok(/did not come out right/.test(r.json.error)); eq((await led(refCard.id)).length, 4);
    F.agentNext.push({ ok: true, lyrics: [{ section: 'verse', lines: ['only one'] }] }); r = await POST('/api/cards/' + refCard.id + '/write', {}, who); eq(r.status, 502, 'too few lines'); eq((await GET('/api/cards/' + refCard.id, who)).json.card.script, null, 'none of that left a script');
    // the SDK's errors, as sentences
    const A = Agent.Anthropic, H = new Headers(), n0 = (await led(refCard.id)).length;
    for (const x of [[new A.APIConnectionTimeoutError({ message: 'timed out' }), 504, /too long/], [new A.APIConnectionError({ message: 'down' }), 502, /could not be reached/], [new A.RateLimitError(429, {}, 'slow', H), 429, /busy/], [new A.AuthenticationError(401, {}, 'key sk-leak', H), 503, /not available/], [new A.PermissionDeniedError(403, {}, 'no', H), 503, /not available/],
      [new A.BadRequestError(400, {}, 'bad', H), 502, /could not be written/], [new A.NotFoundError(404, {}, 'nf', H), 502, /could not be written/], [new A.InternalServerError(500, {}, 'boom', H), 502, /having trouble/], [new Error('a bug of ours'), 500, /Something went wrong/]]) {
      F.agentNext.push(function () { throw x[0]; }); r = await POST('/api/cards/' + refCard.id + '/write', {}, who); eq(r.status, x[1], x[0].constructor.name + ' -> ' + x[1]); ok(x[2].test(r.json.error), 'said as: ' + r.json.error); ok(r.json.error.indexOf('sk-leak') < 0 && r.json.error.indexOf('a bug of ours') < 0, 'and nothing of the inside is shown'); }
    eq((await led(refCard.id)).length, n0, 'a call that never answered costs nothing');
    r = await POST('/api/cards/' + refCard.id + '/write', {}, who); eq(r.json.ok, true, 'and the next try writes');

    // the maker's own hand
    const save = function (b) { return POST('/api/cards/' + card.id + '/save', b, who); }, ten = Array.from({ length: 10 }, function (x, i) { return 'My own line number ' + (i + 1); });
    r = await save({ script: { title: 'Our Own Title', greeting: 'Hi June!', signoff: 'Love, us', lyrics: [{ section: 'verse', lines: ten.slice(0, 6) }, { section: 'chorus', lines: ten.slice(6) }], music: { bpm: 61, styles: ['thrash'] } } });
    eq(r.status, 200, 'every line can be changed by hand'); let s = r.json.card.script; eq(s.title, 'Our Own Title'); eq(s.greeting, 'Hi June!'); eq(s.signoff, 'Love, us'); eq(s.lyrics[0].lines.join('|'), ten.slice(0, 6).join('|')); eq(s.lyrics[1].lines.length, 4, 'ten lines are allowed'); eq(s.lyrics[1].section, 'verse', 'a section is verse or hook');
    eq(JSON.stringify(s.music), JSON.stringify(first.music), 'the music direction is not the maker\'s to set here'); eq(r.json.card.title, 'Our Own Title'); eq(r.json.card.engine.title, 'Our Own Title', 'the engine card follows');
    r = await save({ script: { lyrics: [{ section: 'verse', lines: ten.concat(['An eleventh']) }] } }); eq(r.status, 400, 'eleven lines are refused'); ok(/more than 10 lines/.test(r.json.error));
    r = await save({ script: { lyrics: [{ section: 'verse', lines: ['Only one', '   '] }] } }); eq(r.status, 400, 'one line is refused'); ok(/at least two/.test(r.json.error)); eq((await GET('/api/cards/' + card.id, who)).json.card.script.lyrics[0].lines.length, 6, 'and nothing changed');
    r = await save({ script: { lyrics: [{ section: 'hook', lines: ['Two lines will do', 'y'.repeat(100)] }] } }); eq(r.status, 200, 'two lines are allowed'); eq(r.json.card.script.lyrics[0].lines[1].length, CFG.limits.lineChars, 'a line is cut to ' + CFG.limits.lineChars); eq(r.json.card.script.lyrics[0].section, 'hook');
    r = await save({ script: { scenes: [{ pid: pids[2], caption: 'Last comes first' }, { pid: 'pNOTMINE', caption: 'x' }, { pid: pids[0], caption: 'c'.repeat(60) }, { pid: pids[2], caption: 'twice' }] } });
    s = r.json.card.script; eq(s.scenes.map(function (x) { return x.pid; }).join(), [pids[2], pids[0], pids[1]].join(), 'photos are put in the maker\'s order, each once'); eq(s.scenes[0].caption, 'Last comes first'); eq(s.scenes[1].caption.length, 40, 'a caption is 40 at most'); eq(r.json.card.pids.join(), [pids[2], pids[0], pids[1]].join(), 'the engine draws them in that order'); eq(r.json.card.engine.scenes[0].caption, 'Last comes first');
    r = await save({ script: { greeting: 'Hello again' } }); eq(r.json.card.script.scenes[0].caption, 'Last comes first', 'captions and order are kept by later saves'); eq(r.json.card.script.scenes.length, 3); eq(r.json.card.script.lyrics[0].lines[0], 'Two lines will do');
    r = await save({ answers: { details: 'd'.repeat(2000) + '\u0007', to: 'June' } }); eq(r.json.card.answers.details.length, CFG.limits.detailsChars, 'details are cut to ' + CFG.limits.detailsChars); eq(r.json.card.answers.to, 'June'); eq(r.json.card.answers.from, 'Script Family', 'answers not sent are kept');
    eq((await save({ v: 99, script: { title: 'From the future' } })).status, 409, 'a page newer than the server is refused'); eq((await save({ template: 'no-such-template' })).status, 400);
    eq((await POST('/api/cards/' + card.id + '/save', { script: { title: 'Mine now' } }, other)).status, 404, 'another account cannot save it'); eq((await POST('/api/cards/' + card.id + '/write', {}, other)).status, 404, 'or write it'); eq((await GET('/api/cards/' + card.id, other)).status, 404, 'or read it'); eq((await POST('/api/cards/' + card.id + '/write', {})).status, 401);
    const k = key(); r = await POST('/api/cards/' + card.id + '/save', { script: { title: 'Saved once' } }, who, { 'idempotency-key': k }); const again = await POST('/api/cards/' + card.id + '/save', { script: { title: 'Not this' } }, who, { 'idempotency-key': k }); eq(again.heads['idempotent-replay'], 'true', 'a save sent twice is answered once'); eq(again.json.card.title, 'Saved once');

    // another take
    const before = (await GET('/api/cards/' + card.id, who)).json.card, a2 = F.agent.length;
    r = await POST('/api/cards/' + card.id + '/write', { ask: 'funnier' }, who); eq(r.json.ok, true, 'another take'); eq(r.json.card.rewrites, 1, 'counts a rewrite'); const b2 = F.agent[a2].messages[0].content;
    ok(/THE MAKER ASKS FOR ANOTHER TAKE: funnier/.test(b2), 'the brief carries what was asked'); ok(b2.indexOf('THE TAKE SO FAR (JSON): ') > 0 && b2.indexOf('"title":"Saved once"') > 0 && b2.indexOf('Two lines will do') > 0, 'and the take so far, the maker\'s edits included');
    ok(b2.indexOf('"scenes":[{"photo":2,"caption":"Last comes first"}') > 0, 'with the photos by number'); ok(/funnier/.test(r.json.card.note) && r.json.card.script.lyrics[0].lines[2].indexOf('funnier') > 0, 'the new take is the script'); eq(r.json.card.slug, before.slug, 'the name stays');
    eq((await led(card.id)).pop().detail.indexOf('rewrite'), 0, 'the ledger calls it a rewrite');
    for (let i = 1; i < CFG.limits.rewritesPerCarol; i++) eq((await POST('/api/cards/' + card.id + '/write', { ask: 'again ' + i }, who)).json.card.rewrites, i + 1);
    const a3 = F.agent.length; r = await POST('/api/cards/' + card.id + '/write', { ask: 'one more' }, who); eq(r.status, 429, 'after ' + CFG.limits.rewritesPerCarol + ' rewrites the agent stops'); ok(r.json.error.indexOf(String(CFG.limits.rewritesPerCarol)) >= 0 && /yourself/.test(r.json.error)); eq(F.agent.length, a3, 'and is not called');
    eq((await save({ script: { title: 'Still mine to edit' } })).json.card.title, 'Still mine to edit', 'the maker can still edit');

    // free drafts
    const free = await maker(310, 'free@example.test', 0, false), ids = [];
    for (let i = 0; i < CFG.limits.freeDrafts; i++) { const d = await draft(free, { from: 'Free ' + i }); r = await POST('/api/cards/' + d.id + '/write', {}, free); eq(r.json.ok, true, 'free draft ' + (i + 1)); ids.push(d.id); }
    const extra = await draft(free, { from: 'Free more' }), a4 = F.agent.length; r = await POST('/api/cards/' + extra.id + '/write', {}, free);
    eq(r.status, 402, 'the next first write needs a pack'); eq(r.json.need, 'pack'); ok(/drafts are kept/.test(r.json.error)); eq(F.agent.length, a4, 'the agent is not called'); eq((await led(extra.id)).length, 0);
    r = await POST('/api/cards/' + ids[0] + '/write', { ask: 'warmer' }, free); eq(r.json.ok, true, 'rewrites of the drafts still work'); eq(r.json.card.rewrites, 1);
    await db.run("UPDATE users SET paid = 1 WHERE id = 'google:310'"); eq((await POST('/api/cards/' + extra.id + '/write', {}, free)).json.ok, true, 'and after a purchase there is no such limit');
    // the day's limit
    const busy = await maker(311, 'busy@example.test', 0), bcard = await draft(busy, { from: 'Busy' });
    await db.run('INSERT INTO usage_day (uid, day, kind, n) VALUES (?, ?, ?, ?)', ['google:311', TODAY, 'agent', CFG.limits.agentCallsPerDay]); const a5 = F.agent.length;
    r = await POST('/api/cards/' + bcard.id + '/write', {}, busy); eq(r.status, 429, 'over the day\'s limit'); ok(/tomorrow/.test(r.json.error)); eq(F.agent.length, a5, 'the agent is not called');
    await db.run("UPDATE usage_day SET n = ? WHERE uid = 'google:311' AND kind = 'agent'", [CFG.limits.agentCallsPerDay - 1]); eq((await POST('/api/cards/' + bcard.id + '/write', {}, busy)).json.ok, true, 'the last call of the day works'); eq((await POST('/api/cards/' + bcard.id + '/write', { ask: 'x' }, busy)).status, 429);
  });

  await section('4. Photos', async function () {
    const who = await maker(400, 'photos@example.test', 0), other = await maker(401, 'photos2@example.test', 0);
    let card = (await POST('/api/cards', { template: TPL.id, answers: { to: 'Sam', from: 'Photo Family' } }, who)).json.card;
    const dirOf = function (id) { return walk(path.join(STORE, CFG.app, 'cards', id)).map(function (f) { return path.basename(f); }).sort(); }, P = '/api/cards/' + card.id + '/photos';
    for (const x of [['image/jpeg', 'jpg', 2400, 1800], ['image/png', 'png', 900, 2000], ['image/webp', 'webp', 640, 480]]) {
      const buf = pic(x[0], x[2], x[3], 40), r = await upload(card.id, buf, x[0], who), k = Math.min(1, CFG.limits.photoPx / Math.max(x[2], x[3]));
      eq(r.status, 200, x[0] + ' is accepted'); const p = r.json.photo; eq(Object.keys(p).sort().join(), 'h,id,note,url,w', 'the photo\'s shape'); eq(p.w, Math.round(x[2] * k)); eq(p.h, Math.round(x[3] * k)); ok(Math.max(p.w, p.h) <= CFG.limits.photoPx, 'longest side at most ' + CFG.limits.photoPx);
      const orig = path.join(STORE, CFG.app, 'cards', card.id, p.id + '-o.' + x[1]); ok(fs.existsSync(orig) && fs.readFileSync(orig).equals(buf), 'the original is kept as it came');
      const small = await GET(p.url, who); eq(small.status, 200); eq(small.heads['content-type'], 'image/jpeg', 'the resized copy is a JPEG'); ok(small.body[0] === 0xff && small.body[1] === 0xd8); ok(/private/.test(small.heads['cache-control']), 'and private');
      const img = await canvas.loadImage(small.body); eq(img.width, p.w, 'of the size it says'); eq(img.height, p.h); ok(fs.readFileSync(path.join(STORE, CFG.app, 'cards', card.id, p.id + '-s.jpg')).equals(small.body), 'kept beside the original');
      eq((await GET(p.url, other)).status, 404, 'another account cannot read it'); eq((await GET(p.url)).status, 401, 'nor can nobody');
    }
    eq(dirOf(card.id).length, 6, 'two objects a photo');
    // what is not a photo
    const heic = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypheic'), Buffer.alloc(200, 1)]); let r = await upload(card.id, heic, 'image/heic', who); eq(r.status, 415, 'a HEIC that no tool can convert is refused'); ok(/HEIC/.test(r.json.error) && /JPEG or PNG/.test(r.json.error), 'with a sentence: ' + r.json.error);
    r = await upload(card.id, crypto.randomBytes(500), 'image/jpeg', who); eq(r.status, 415, 'garbage is refused'); ok(/JPEG, PNG, WebP or HEIC/.test(r.json.error));
    r = await upload(card.id, Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), crypto.randomBytes(400)]), 'image/jpeg', who); eq(r.status, 415, 'a broken JPEG is refused'); ok(/could not be read/.test(r.json.error));
    r = await upload(card.id, Buffer.from('tiny'), 'image/png', who); eq(r.status, 400, 'a few bytes are not a photo'); r = await upload(card.id, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'image/svg+xml', who); eq(r.status, 415, 'an SVG is refused');
    eq(dirOf(card.id).length, 6, 'and none of that was kept'); eq((await GET('/api/cards/' + card.id, who)).json.card.photos.length, 3);
    // a real HEIC (an iPhone's own format), made here by macOS's sips, is converted on the server by the tool this machine has
    // (heif-convert in the Docker image, sips on a Mac). Where there is no tool to make one, this is said and skipped.
    const hdir = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-heic-test-')), hpng = path.join(hdir, 'a.png'), hfile = path.join(hdir, 'a.heic'); fs.writeFileSync(hpng, pic('image/png', 1200, 900, 40));
    const made = cp.spawnSync('sips', ['-s', 'format', 'heic', hpng, '--out', hfile]);
    if (made.status === 0 && fs.existsSync(hfile)) {
      const hb = fs.readFileSync(hfile); eq(hb.toString('latin1', 4, 8), 'ftyp', 'sips made a HEIC'); r = await upload(card.id, hb, 'image/heic', who); eq(r.status, 200, 'a real HEIC is accepted: ' + r.text);
      const hp = r.json.photo; eq(hp.w, 1200, 'at its own size'); eq(hp.h, 900); const hs = await GET(hp.url, who); eq(hs.heads['content-type'], 'image/jpeg', 'its working copy is a JPEG'); const him = await canvas.loadImage(hs.body); eq(him.width, 1200);
      ok(fs.readFileSync(path.join(STORE, CFG.app, 'cards', card.id, hp.id + '-o.heic')).equals(hb), 'and the original HEIC is kept as it came');
      eq((await DEL('/api/cards/' + card.id + '/photos/' + hp.id, who)).status, 200); eq(dirOf(card.id).length, 6, 'removed again');
    } else console.log('   (SKIPPED: no sips here to make a HEIC file; the conversion itself is checked in the Docker image by tools/dockercheck.cjs)');
    fs.rmSync(hdir, { recursive: true, force: true });
    // too large (the limit is lowered for the test through the admin's own tool)
    eq((await GET('/api/me')).json.config.limits.photoBytes, 25 * 1024 * 1024, 'the limit is 25 MB'); await admin('admin_limit', { name: 'photoBytes', value: 3 * 1048576, reason: 'the test lowers it' });
    const noise = function (w) { const cv = canvas.createCanvas(w, w), c = cv.getContext('2d'), d = c.createImageData(w, w); crypto.randomFillSync(d.data); c.putImageData(d, 0, 0); return cv.toBuffer('image/png'); }, big = noise(1100);
    ok(big.length > 3 * 1048576, 'a ' + (big.length / 1048576).toFixed(1) + ' MB photo'); r = await upload(card.id, big, 'image/png', who); eq(r.status, 413, 'over the limit is a 413'); ok(/larger than 3 MB/.test(r.json.error), r.json.error);
    r = await upload(card.id, big, 'image/png', who, { 'content-length': '1000' }); eq(r.status, 413, 'also when it lies about its length'); ok(r.json.error);
    await admin('admin_limit', { name: 'photoBytes', reset: true, reason: 'the test puts it back' }); eq(dirOf(card.id).length, 6, 'nothing kept');
    // the ninth; and another account
    for (let i = 3; i < CFG.limits.photosPerCarol; i++) eq((await upload(card.id, pic('image/jpeg', 200, 200, i * 30), 'image/jpeg', who)).status, 200, 'photo ' + (i + 1));
    r = await upload(card.id, pic('image/jpeg', 200, 200, 5), 'image/jpeg', who); eq(r.status, 409, 'the ninth photo is refused'); ok(/up to 8 photos/.test(r.json.error)); eq(dirOf(card.id).length, 16);
    eq((await upload(card.id, pic('image/jpeg', 200, 200, 5), 'image/jpeg', other)).status, 404, 'another account cannot add'); eq((await upload(card.id, pic('image/jpeg', 200, 200, 5), 'image/jpeg', null)).status, 401);
    // deleting
    card = (await POST('/api/cards/' + card.id + '/write', {}, who)).json.card; eq(card.script.scenes.length, 8, 'eight scenes'); const gone = card.photos[2].id, files = dirOf(card.id).filter(function (f) { return f.indexOf(gone) === 0; }); eq(files.length, 2);
    eq((await DEL(P + '/' + gone, other)).status, 404, 'another account cannot delete'); eq((await DEL(P + '/' + gone)).status, 401); eq(dirOf(card.id).length, 16);
    r = await DEL(P + '/' + gone, who); eq(r.status, 200, 'the maker can'); eq(r.json.card.photos.length, 7); ok(!r.json.card.photos.some(function (p) { return p.id === gone; }), 'the photo is gone'); ok(!r.json.card.script.scenes.some(function (s) { return s.pid === gone; }) && r.json.card.script.scenes.length === 7, 'and its scene');
    ok(!dirOf(card.id).some(function (f) { return f.indexOf(gone) === 0; }) && dirOf(card.id).length === 14, 'and both its objects in the store'); eq((await GET(P + '/' + gone, who)).status, 404); eq(r.json.card.pids.length, 7); eq(r.json.card.engine.scenes.length, 7);
    eq((await DEL(P + '/' + gone, who)).status, 200, 'deleting it again changes nothing'); eq(dirOf(card.id).length, 14);
    r = await upload(card.id, pic('image/png', 300, 300, 77), 'image/png', who); eq(r.status, 200, 'there is room again'); const now = (await GET('/api/cards/' + card.id, who)).json.card; eq(now.script.scenes[7].pid, r.json.photo.id, 'a new photo joins the scenes, last');
  });

  await section('5. Credits and the ledger', async function () {
    const who = await maker(500, 'credits@example.test', 0), uid = 'google:500', other = await maker(501, 'credits2@example.test', 5);
    const bal = function () { return S.balance(uid); }, log = function () { return db.all('SELECT delta, why, ref FROM credit_log WHERE uid = ? ORDER BY id', [uid]); }, sum = async function () { return (await log()).reduce(function (n, x) { return n + x.delta; }, 0); };
    const jobs = function (id) { return db.all('SELECT id, kind, state, stage, tries, error FROM jobs WHERE card = ? ORDER BY created, id', [id]); }, led = function (id, kind) { return db.all('SELECT kind, tok_in, tok_out, units, micros, detail FROM ledger WHERE card = ? AND kind = ? ORDER BY id', [id, kind]); };
    const song = function (id, k, w) { return POST('/api/cards/' + id + '/song', {}, w || who, k ? { 'idempotency-key': k } : null); }, view = async function (id) { return (await GET('/api/cards/' + id, who)).json.card; };
    const bare = (await POST('/api/cards', { template: TPL.id, answers: { from: 'No Words' } }, who)).json.card; let r = await song(bare.id); eq(r.status, 409, 'no words, no song'); ok(/words first/.test(r.json.error));
    let c = await T.carol(who, { song: false, photos: 1, answers: { from: 'Credit Family' } });
    // no credit
    r = await song(c.id); eq(r.status, 402, 'no credit: 402'); eq(r.json.need, 'credit'); ok(/one carol credit/.test(r.json.error)); eq((await jobs(c.id)).length, 0, 'nothing is queued'); eq((await view(c.id)).paid, false); eq((await log()).length, 0); eq((await GET('/api/cards/' + c.id + '/status', who)).json.job, null);
    eq((await song(c.id, null, other)).status, 404, 'another account cannot pay for it');
    // one credit, spent once
    await S.grant(uid, 2, 'test', 'test:credits'); eq(await bal(), 2); const k1 = key(), m0 = F.music.length;
    const both = await Promise.all([song(c.id, k1), song(c.id, k1), song(c.id, key())]); eq(both.filter(function (x) { return x.status === 200; }).length, 2, 'the same key twice at once: one piece of work, answered twice'); eq(both[2].status, 409, 'another key at the same moment: already being made');
    r = both[0]; ok(/^j/.test(r.json.job), 'a job'); eq(r.json.credits, 1, 'one credit spent'); eq(r.json.card.paid, true); eq(r.json.card.job.state, 'queued', 'the song job is queued'); eq(r.json.card.job.kind, 'song'); eq(both[1].json.job, r.json.job);
    let again = await song(c.id, k1); eq(again.status, 200); eq(again.heads['idempotent-replay'], 'true', 'the same key again: the first answer'); eq(again.json.job, r.json.job);
    again = await song(c.id, key()); eq(again.status, 409, 'a new key while the job waits'); ok(/already being made/.test(again.json.error));
    eq((await jobs(c.id)).length, 1, 'one job'); eq(await bal(), 1, 'still one credit spent'); let L = await log(); eq(L.filter(function (x) { return x.delta === -1; }).length, 1, 'one spend in credit_log'); eq(L[1].ref, 'carol:' + c.id); eq(await sum(), await bal(), 'the balance is the sum of credit_log');
    eq((await GET('/api/me', who)).json.user.credits, 1); eq(F.music.length, m0, 'the music service is not asked before the job runs');
    let st = (await GET('/api/cards/' + c.id + '/status', who)).json; eq(Object.keys(st).sort().join(), 'job,media,mv,stale,state,take,takes,takesLeft,url,v', 'status while a job waits (no engine card)'); eq(st.state, 'draft'); eq(st.takesLeft, 3);
    await S.jobs.drain(); c = await view(c.id); eq(c.state, 'ready', 'the carol is ready'); eq(c.job, null); eq(c.takes.length, 1); eq(c.take, c.takes[0].id); eq(c.takesLeft, 2); eq(F.music.length, m0 + 1, 'one song was asked for');
    eq(c.media.sort().join(), 'poster,posterstory,preview,square,story'); ok(c.engine.timing && c.engine.timing.lines.length === 6 && c.engine.timing.bpm > 0, 'the engine card has the song\'s timing'); eq(c.v, c.take);
    st = (await GET('/api/cards/' + c.id + '/status', who)).json; ok(st.engine && st.engine.timing, 'status carries the engine card when no job runs'); eq(st.url, SITE + '/' + c.slug);
    eq(F.music[m0].key, 'test-never-used', 'asked with the music key'); eq(F.music[m0].body.model_id, process.env.ELEVEN_MUSIC_MODEL, 'and the model from the setting');
    // more takes cost nothing, and stop at three
    for (let n = 2; n <= CFG.limits.takesPerCarol; n++) { r = await song(c.id, key()); eq(r.status, 200, 'take ' + n); eq(r.json.credits, 1, 'costs no credit'); await S.jobs.drain(); c = await view(c.id); eq(c.takes.length, n); eq(c.take, c.takes[n - 1].id, 'the newest take is the chosen one'); eq(c.takesLeft, CFG.limits.takesPerCarol - n); }
    eq(CFG.limits.takesPerCarol, 3); r = await song(c.id, key()); eq(r.status, 409, 'a fourth take is refused'); ok(/its 3 takes/.test(r.json.error) && /Pick the one/.test(r.json.error), r.json.error); eq(F.music.length, m0 + 3); eq(await bal(), 1); eq((await log()).length, 2);
    // every take is kept, and can be chosen
    for (const t of c.takes) { const a = await GET(t.url, who); eq(a.status, 200, 'take ' + t.n + ' is kept'); eq(a.heads['content-type'], 'audio/mp4'); eq(a.body.toString('latin1', 4, 8), 'ftyp'); ok(t.seconds >= 20 && t.seconds <= 40, t.seconds + ' s'); eq((await GET(t.url, other)).status, 404); }
    r = await POST('/api/cards/' + c.id + '/take', { take: c.takes[0].id }, who, { 'idempotency-key': key() }); eq(r.status, 200, 'the first take is chosen'); eq(r.json.card.job.kind, 'render'); await S.jobs.drain(); c = await view(c.id); eq(c.take, c.takes[0].id); eq(c.v, c.takes[0].id);
    eq((await db.get("SELECT take FROM media WHERE card = ? AND kind = 'story'", [c.id])).take, c.takes[0].id, 'and the video is made with it'); eq(F.music.length, m0 + 3, 'with no new song'); eq(await bal(), 1);
    eq((await POST('/api/cards/' + c.id + '/take', { take: 'tNOSUCHTAKE' }, who)).status, 409, 'a take that is not there'); eq((await POST('/api/cards/' + c.id + '/take', { take: c.takes[1].id }, other)).status, 404);
    eq(walk(path.join(STORE, CFG.app, 'cards', c.id)).filter(function (f) { return /\.m4a$/.test(f); }).length, 3, 'three songs in the store'); eq(walk(path.join(STORE, CFG.app, 'cards', c.id)).filter(function (f) { return /raw/.test(f); }).length, 0, 'and no raw file left');
    // the ledger
    const text = await led(c.id, 'text'), music = await led(c.id, 'music'), render = await led(c.id, 'render'), plan = Song.plan({ lyrics: c.script.lyrics, music: c.script.music }, TPL);
    eq(text.length, 1, 'a text line for the agent\'s call'); eq(text[0].micros, 1200 * CFG.cost.textInPerMTok + 600 * CFG.cost.textOutPerMTok);
    eq(music.length, 3, 'a music line for each take'); music.forEach(function (m, i) { eq(m.units, plan.total, 'the seconds asked'); eq(m.micros, Math.round(m.units / 60 * CFG.cost.musicPerMinute * 1e6), 'micro-dollars = seconds / 60 x config.cost.musicPerMinute'); ok(m.detail.indexOf('take ' + (i + 1) + ',') === 0, m.detail); });
    eq(render.length, 4, 'a render line for each video'); ok(render.every(function (x) { return x.units >= 0 && x.micros === 0 && /frames/.test(x.detail); }), 'in seconds');
    // two carols, one credit, at once
    const d1 = await T.carol(who, { song: false, photos: 0, answers: { from: 'Twin One' } }), d2 = await T.carol(who, { song: false, photos: 0, answers: { from: 'Twin Two' } });
    const two = await Promise.all([song(d1.id, key()), song(d2.id, key())]); eq(two.map(function (x) { return x.status; }).sort().join(), '200,402', 'one credit pays for one of two carols asked at once'); eq(await bal(), 0); eq(await sum(), 0);
    const paidOne = two[0].status === 200 ? d1 : d2, unpaid = two[0].status === 200 ? d2 : d1;
    // a 500 from the music service is tried again
    F.musicNext.push({ status: 500, body: { detail: { status: 'server_error', message: 'boom' } } }); let m1 = F.music.length, j0 = jobLog.length; await S.jobs.drain();
    let j = (await jobs(paidOne.id))[0]; eq(j.state, 'done', 'a 500 once: the job is tried again and finishes'); eq(j.tries, 2); eq(F.music.length, m1 + 2); ok(jobLog.slice(j0).some(function (x) { return x.id === j.id && x.state === 'queued' && /500/.test(x.error); }), 'it went back to queued in between'); eq(await bal(), 0, 'and cost one credit');
    // failing for good, with no take made: the credit comes back
    await S.grant(uid, 1, 'test', 'test:credits2'); r = await song(unpaid.id, key()); eq(r.status, 200); eq(await bal(), 0); const failing = r.json.job;
    for (let i = 0; i < 5; i++) F.musicNext.push({ status: 500, body: {} }); m1 = F.music.length; await S.jobs.drain();
    j = (await jobs(unpaid.id))[0]; eq(j.state, 'failed', 'three 500s: the job fails'); eq(j.tries, 3, 'after three tries'); eq(F.music.length, m1 + 3, 'and no more'); ok(/Try again: nothing more is charged/.test(j.error), 'with a sentence, not the inside: ' + j.error);
    F.musicNext.length = 0; let v = await view(unpaid.id); eq(v.job.state, 'failed', 'the maker sees it failed'); eq(v.job.error, j.error); eq(v.paid, false, 'the carol is unpaid again'); eq(await bal(), 1, 'the credit is back');
    L = await log(); const back = L.find(function (x) { return x.ref === 'back:' + failing; }); ok(back && back.delta === 1 && /given back/.test(back.why), 'credit_log shows the give-back'); eq(await sum(), 1); ok(!L.some(function (x) { return x.ref === 'carol:' + unpaid.id; }), 'and the spend keeps its place under another ref');
    eq(await count('SELECT COUNT(*) AS n FROM takes WHERE card = ?', [unpaid.id]), 0); eq((await led(unpaid.id, 'music')).length, 0, 'no music line for a song that was not made');
    await S.jobs.drain(); eq(F.music.length, m1 + 3, 'a failed job is not picked up again');
    // the music service refuses the words: failed at once, with a sentence, and the credit back
    r = await song(unpaid.id, key()); eq(r.status, 200, 'it can be paid for again'); eq(await bal(), 0); F.musicNext.push({ status: 422, body: { detail: { status: 'bad_composition_plan', message: 'The plan names an artist.', data: { composition_plan_suggestion: {} } } } }); m1 = F.music.length; await S.jobs.drain();
    v = await view(unpaid.id); eq(v.job.state, 'failed', 'a refusal by the music service fails the job'); ok(/would not sing those words/.test(v.job.error) && /Change the words/.test(v.job.error), 'with a sentence the maker can read: ' + v.job.error); eq(F.music.length, m1 + 1, 'and is not tried again'); eq((await jobs(unpaid.id))[1].tries, 1);
    eq(await bal(), 1, 'the credit is back again'); eq(v.paid, false); eq((await GET('/api/cards/' + unpaid.id + '/status', who)).json.job.error, v.job.error);
    r = await song(unpaid.id, key()); eq(r.status, 200, 'and after changing the words it can be made'); await S.jobs.drain(); v = await view(unpaid.id); eq(v.state, 'ready'); eq(v.paid, true); eq(await bal(), 0); eq(await sum(), 0);
    // a later take that fails gives nothing back: the carol has its song
    F.musicNext.push({ status: 422, body: { detail: { status: 'bad_prompt' } } }); eq((await song(unpaid.id, key())).status, 200); await S.jobs.drain(); v = await view(unpaid.id); eq(v.job.state, 'failed'); eq(v.paid, true, 'a failed extra take leaves the carol paid'); eq(await bal(), 0, 'and gives no credit back'); eq(v.state, 'ready'); eq(v.takes.length, 1);
    L = await log(); eq(L.reduce(function (n, x) { return n + x.delta; }, 0), 0); ok(L.every(function (x) { return x.ref && x.why; }), 'every line of credit_log says why');
  });

  let REAL = null; const who6 = await maker(600, 'maker-six@example.test', 2), MAKER_EMAIL = 'maker-six@example.test';
  await section('6. Jobs surviving a restart', async function () {
    const uid = 'google:600', jobOf = function (id) { return db.get('SELECT * FROM jobs WHERE id = ?', [id]); }, song = function (id, w) { return POST('/api/cards/' + id + '/song', {}, w || who6, { 'idempotency-key': key() }); };
    const side = await maker(601, 'jobs@example.test', 3), sideUid = 'google:601';
    // (with the stand-in video) a song job whose take is already there does not ask for the song again
    let c = await T.carol(side, { photos: 1, answers: { from: 'Jobs Family' } }); eq(c.state, 'ready'); const j1 = (await db.get('SELECT id FROM jobs WHERE card = ?', [c.id])).id, m0 = F.music.length, f0 = made.fake;
    await db.run("UPDATE jobs SET state = 'running', stage = 'rendering', pct = 61 WHERE id = ?", [j1]);   // as if the process died while the video was being made
    await S.jobs.drain(); eq((await jobOf(j1)).state, 'running', 'a job left running is not picked up by itself'); eq((await GET('/api/cards/' + c.id, side)).json.card.job.state, 'running');
    eq((await song(c.id, side)).status, 409, 'and no second job can be asked for meanwhile');
    await S.jobs.requeue(); let j = await jobOf(j1); eq(j.state, 'queued', 'requeue() puts it back'); eq(j.stage, 'queued');
    await S.jobs.drain(); j = await jobOf(j1); eq(j.state, 'done', 'and drain() finishes it'); eq(j.pct, 100); eq(j.tries, 2);
    eq(F.music.length, m0, 'the music service was NOT asked again'); eq(made.fake, f0 + 1, 'the video was made again'); eq(await count('SELECT COUNT(*) AS n FROM takes WHERE card = ?', [c.id]), 1, 'still one take');
    eq(await count("SELECT COUNT(*) AS n FROM ledger WHERE card = ? AND kind = 'music'", [c.id]), 1, 'one music line'); eq(await count("SELECT COUNT(*) AS n FROM credit_log WHERE uid = ? AND delta < 0", [sideUid]), 1, 'one credit'); eq((await GET('/api/cards/' + c.id, side)).json.card.state, 'ready');
    // a job for a carol that was deleted fails, once
    const d = await T.carol(side, { song: false, photos: 1, answers: { from: 'Gone Family' } }); let r = await song(d.id, side); const j2 = r.json.job; eq((await DEL('/api/cards/' + d.id, side)).status, 200);
    j = await jobOf(j2); eq(j.state, 'failed', 'deleting a carol fails its waiting job'); ok(/deleted/.test(j.error)); await db.run("UPDATE jobs SET state = 'queued', error = '' WHERE id = ?", [j2]);   // (as if it had been picked up at that very moment)
    const m1 = F.music.length; await S.jobs.drain(); j = await jobOf(j2); eq(j.state, 'failed', 'a job for a deleted carol fails'); eq(j.tries, 1, 'without a retry'); eq(F.music.length, m1, 'and asks for no song'); eq(walk(path.join(STORE, CFG.app, 'cards', d.id)).length, 0, 'and leaves no file');

    // THE LEASE: one job, two machines. One claim wins; another machine's start leaves a held job alone; the holder
    // renews; when the holder dies its lease runs out and the other takes the job; the first, back from its stall,
    // does nothing; a machine's own restart puts its job back. In all of it the song is asked for (and paid for) once.
    const e = await T.carol(side, { song: false, photos: 1, answers: { from: 'Lease Family' } }); r = await song(e.id, side); eq(r.status, 200); const j3 = r.json.job, m3 = F.music.length;
    const both = await Promise.all([S.jobs.claim('machine-a'), S.jobs.claim('machine-b')]), won = both.filter(Boolean);
    eq(won.length, 1, 'two machines ask at the same moment: one gets the job'); eq(won[0].id, j3); const A = won[0].owner, B = A === 'machine-a' ? 'machine-b' : 'machine-a'; eq(won[0].tries, 1);
    eq(await S.jobs.claim(B), null, 'the other machine finds nothing to take'); eq(await S.jobs.claim(A), null, 'and the holder does not take it twice');
    await S.jobs.requeue(B); j = await jobOf(j3); eq(j.state, 'running', 'another machine starting leaves a held job alone'); eq(j.owner, A); ok(j.lease > Date.now() + 30000 && j.lease <= Date.now() + 60000, 'held for a minute');
    await db.run('UPDATE jobs SET lease = ? WHERE id = ?', [Date.now() + 5000, j3]); ok(await S.jobs.beat(j3, A), 'the holder renews its lease'); ok((await jobOf(j3)).lease > Date.now() + 30000, 'to a minute from now'); eq(await S.jobs.beat(j3, B), false, 'nobody else can renew it');
    await S.jobs.drain(); eq(F.music.length, m3, 'the queue of this process does not run a job another machine holds');
    await db.run('UPDATE jobs SET lease = ? WHERE id = ?', [Date.now() - 1, j3]);   // the holder died: its lease ran out
    const taken = await S.jobs.claim(B); eq(taken && taken.id, j3, 'a job whose lease ran out is taken by the other machine'); eq(taken.owner, B); eq(taken.tries, 2); eq(await S.jobs.beat(j3, A), false, 'the first holder has lost it');
    await S.jobs.run(won[0]); eq(F.music.length, m3, 'the first holder, back from its stall, asks for no song'); j = await jobOf(j3); eq(j.state, 'running', 'and changes nothing'); eq(j.owner, B); eq(await count('SELECT COUNT(*) AS n FROM takes WHERE card = ?', [e.id]), 0);
    await S.jobs.requeue(B); j = await jobOf(j3); eq(j.state, 'queued', 'the holder\'s own restart puts its job back'); eq(j.owner, null); eq(j.lease, null);
    await S.jobs.drain(); j = await jobOf(j3); eq(j.state, 'done', 'and it is finished'); eq(j.tries, 3); eq(j.owner, null, 'held by nobody once it is done');
    eq(F.music.length, m3 + 1, 'ONE song was asked for, through two machines and a restart'); eq(await count('SELECT COUNT(*) AS n FROM takes WHERE card = ?', [e.id]), 1, 'one take'); eq(await count("SELECT COUNT(*) AS n FROM ledger WHERE card = ? AND kind = 'music'", [e.id]), 1, 'one music line');
    eq(await count("SELECT COUNT(*) AS n FROM credit_log WHERE ref LIKE ?", ['carol:' + e.id + '%']), 1, 'one credit'); eq((await GET('/api/cards/' + e.id, side)).json.card.state, 'ready');
    // a job that was started four times and never finished is not started a fifth
    const g = await T.carol(side, { song: false, photos: 0, answers: { from: 'Stuck Family' } }); r = await song(g.id, side); eq(r.status, 200); await db.run('UPDATE jobs SET tries = 3 WHERE id = ?', [r.json.job]); const m4 = F.music.length;
    await S.jobs.drain(); j = await jobOf(r.json.job); eq(j.state, 'failed', 'a job started again and again is given up on'); eq(F.music.length, m4, 'with no song asked for'); eq(await S.balance(sideUid), 1, 'and its credit given back');

    // THE CARD KNOWS when its video is older than its last edit ("Update the video" is offered from this, not from the page's memory)
    const sv = async function (id, body) { const x = await POST('/api/cards/' + id + '/save', body, side, { 'idempotency-key': key() }); eq(x.status, 200, x.text); return x.json.card; };
    let v = (await GET('/api/cards/' + e.id, side)).json.card; eq(v.stale, false, 'a carol just made is up to date'); ok(v.mv && v.mv !== '0', 'and says which video it has');
    const ph = v.script.scenes[0], cap0 = ph.caption;
    v = await sv(e.id, { script: { scenes: [{ pid: ph.pid, caption: 'A new caption' }] } }); eq(v.stale, true, 'a caption changed: the video is older than the card');
    v = await sv(e.id, { script: { scenes: [{ pid: ph.pid, caption: cap0 }] } }); eq(v.stale, false, 'changed back: it is the video of this card again');
    v = await sv(e.id, { script: { scenes: [{ pid: ph.pid, caption: cap0, fit: [0.25, 0.4, 1.8], solo: true }] } }); eq(v.stale, true, 'the photo was moved in its frame: stale');
    eq(JSON.stringify(v.script.scenes[0]), JSON.stringify({ pid: ph.pid, caption: cap0, fit: [0.25, 0.4, 1.8], solo: 1 }), 'the placing is kept with the photo'); eq(JSON.stringify(v.engine.scenes[0].fit), '[0.25,0.4,1.8]', 'and given to the engine'); eq(v.engine.scenes[0].solo, 1); eq(v.engine.scenes[0].ar, 0.75, 'with the photo\'s shape');
    v = await sv(e.id, { script: { scenes: [{ pid: ph.pid, caption: cap0, fit: [9, -3, 99] }] } }); eq(JSON.stringify(v.script.scenes[0].fit), '[1,0,4]', 'a placing is held to its limits'); v = await sv(e.id, { script: { scenes: [{ pid: ph.pid, caption: cap0, fit: ['x', 0, 1] }] } }); eq(v.script.scenes[0].fit, undefined, 'and one that is not numbers is dropped');
    v = await sv(e.id, { answers: { to: 'Great-Aunt Ruth' } }); eq(v.stale, true, 'who it is for changed: stale'); eq(v.answers.to, 'Great-Aunt Ruth');
    v = await sv(e.id, { script: { scenes: [{ pid: ph.pid, caption: cap0, fit: [0.5, 0.3, 2] }] } }); r = await POST('/api/cards/' + e.id + '/write', { ask: 'funnier' }, side); eq(r.status, 200); eq(JSON.stringify(r.json.card.script.scenes[0].fit), '[0.5,0.3,2]', 'a rewrite by the agent keeps how the photo was placed');
    r = await POST('/api/cards/' + e.id + '/render', {}, side, { 'idempotency-key': key() }); eq(r.status, 200); await S.jobs.drain(); v = (await GET('/api/cards/' + e.id, side)).json.card; eq(v.stale, false, 'the video is made again: up to date');
    v = await sv(e.id, { script: { lyrics: [{ section: 'verse', lines: ['New words that were never sung', 'And one more line of them'] }] } }); eq(v.stale, false, 'new words do not make the video stale: they wait for a new take of the song');
    eq((await GET('/api/cards/' + e.id + '/status', side)).json.stale, false, 'the status says it too');
    // a draft with no words yet is listed by who it is for
    const dr = (await POST('/api/cards', { template: TPL.id, answers: { to: 'Opa Wim' } }, side, { 'idempotency-key': key() })).json.card; eq(dr.title, 'For Opa Wim'); v = await sv(dr.id, { answers: { to: 'Oma Riet' } }); eq(v.title, 'For Oma Riet', 'and follows the name');
    r = await GET('/api/cards?state=draft&q=oma', side); eq(r.json.total, 1, 'drafts are found by that name'); eq(r.json.items[0].title, 'For Oma Riet'); eq((await DEL('/api/cards/' + dr.id, side)).status, 200, 'a draft can be deleted'); eq((await GET('/api/cards?state=draft&q=oma', side)).json.total, 0);

    // THE REAL RENDER: a job left running (as if the process died), put back, finished; its progress; the video itself
    Render.render = async function (o) { made.real++; return realRender(o); };
    c = await T.carol(who6, { photos: 2, song: false, slug: 'grandma-june-2026' }); r = await song(c.id); eq(r.status, 200); const job = r.json.job, m2 = F.music.length, at = jobLog.length;
    await db.run("UPDATE jobs SET state = 'running', stage = 'song', pct = 5, tries = 1 WHERE id = ?", [job]); await S.jobs.drain(); eq((await jobOf(job)).state, 'running'); eq(F.music.length, m2);
    await S.jobs.requeue(); eq((await jobOf(job)).state, 'queued', 'put back in the queue');
    const seen = [], timer = setInterval(function () { GET('/api/cards/' + c.id + '/status', who6).then(function (x) { seen.push(x.json); }); }, 250), t0 = Date.now();
    await S.jobs.drain(); clearInterval(timer); const took = (Date.now() - t0) / 1000;
    j = await jobOf(job); eq(j.state, 'done', 'and finished'); eq(j.stage, 'done'); eq(j.pct, 100); eq(j.tries, 2); eq(F.music.length, m2 + 1, 'one song'); eq(made.real, 1, 'one real render (' + took.toFixed(1) + ' s)');
    const mine = jobLog.slice(at).filter(function (x) { return x.id === job; }), stages = mine.filter(function (x) { return x.stage; }).map(function (x) { return x.stage; });
    eq(stages.join(), 'song,rendering,done', 'the stages: song, rendering, done'); const pcts = mine.filter(function (x) { return x.pct !== undefined; }).map(function (x) { return x.pct; });
    ok(pcts.every(function (p, i) { return i === 0 || p >= pcts[i - 1]; }), 'pct only rises: ' + pcts.join(' ')); eq(pcts[0], 5); eq(pcts[1], 30); eq(pcts[pcts.length - 1], 100); ok(new Set(pcts).size >= 5, 'and moves while the video is drawn (' + new Set(pcts).size + ' values)');
    const during = seen.filter(function (x) { return x.job && x.job.state === 'running'; }); ok(during.length >= 3, 'the status was asked ' + seen.length + ' times while it ran: the server keeps answering');
    ok(during.some(function (x) { return x.job.stage === 'rendering' && x.job.pct > 30 && x.job.pct < 100; }), 'and showed "rendering" with a pct on the way'); ok(during.every(function (x) { return x.engine === undefined && x.state === 'draft'; }), 'a draft until it is done');
    REAL = (await GET('/api/cards/' + c.id, who6)).json.card; eq(REAL.state, 'ready'); eq(REAL.slug, 'grandma-june-2026'); eq(await S.balance(uid), 1);
    // the hard caps, read from the files
    const V = CFG.video, probe = function (file) { const p = cp.spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8' }); eq(p.status, 0, 'ffprobe reads ' + path.basename(file)); return JSON.parse(p.stdout); };
    eq(V.fps, 30); eq(V.minSec, 20); eq(V.maxSec, 40); ok(V.hardCapSec <= 60 && V.maxBytes <= 100 * 1024 * 1024, 'the caps in config.video');
    const media = {}; (await db.all('SELECT kind, mkey, bytes FROM media WHERE card = ?', [c.id])).forEach(function (m) { media[m.kind] = Object.assign({ file: path.join(STORE, CFG.app, m.mkey) }, m); });
    const take = await db.get('SELECT * FROM takes WHERE id = ?', [REAL.take]);
    for (const kind of ['story', 'square']) {
      const info = probe(media[kind].file), v = info.streams.find(function (s) { return s.codec_type === 'video'; }), a = info.streams.find(function (s) { return s.codec_type === 'audio'; }), dur = +info.format.duration;
      eq(v.width, V.sizes[kind][0], kind + ': width'); eq(v.height, V.sizes[kind][1], kind + ': height'); eq(v.r_frame_rate, V.fps + '/1', kind + ': ' + V.fps + ' frames a second'); eq(v.codec_name, 'h264'); eq(v.pix_fmt, 'yuv420p');
      ok(a && a.codec_name === 'aac', kind + ': has the song (AAC)'); ok(dur >= V.minSec - 0.2 && dur <= V.maxSec + 0.2, kind + ': ' + dur.toFixed(2) + ' s is ' + V.minSec + ' to ' + V.maxSec); ok(dur <= V.hardCapSec, 'never over the hard cap');
      ok(Math.abs(dur - take.seconds) < 0.2, kind + ': as long as the song (' + take.seconds + ' s)'); ok(Math.abs(+v.nb_frames - Math.round(take.seconds * V.fps)) <= 2, kind + ': ' + v.nb_frames + ' frames'); ok(media[kind].bytes <= V.maxBytes && media[kind].bytes === fs.statSync(media[kind].file).size, kind + ': ' + media[kind].bytes + ' bytes');
    }
    const poster = await canvas.loadImage(fs.readFileSync(media.poster.file)); eq(poster.width, V.sizes.square[0], 'the poster is the square\'s size'); eq(poster.height, V.sizes.square[1]); const ps = await canvas.loadImage(fs.readFileSync(media.posterstory.file)); eq(ps.height, V.sizes.story[1]);
    const gif = fs.readFileSync(media.preview.file); eq(gif.toString('latin1', 0, 4), 'GIF8'); eq(gif.readUInt16LE(6), V.previewPx, 'the preview is ' + V.previewPx + ' px wide'); ok(+probe(media.preview.file).format.duration <= V.previewSec + 0.3, 'and a few seconds long');
    ok(take.peak <= -0.5 && take.rms > -40, 'the song is not clipped and not silent (' + take.peak + ' / ' + take.rms + ' dBFS)'); const tm = JSON.parse(take.timing); ok(Math.abs(tm.bpm - 120) < 1.2, 'its beats were measured (' + tm.bpm + ' bpm)');
    const rl = await db.get("SELECT units, detail FROM ledger WHERE card = ? AND kind = 'render'", [c.id]); ok(rl.units > 1 && /^\d+ frames$/.test(rl.detail), 'the render\'s seconds are in the ledger (' + rl.units + ' s, ' + rl.detail + ')');
    Render.render = fakeRender;
  });

  await section('7. The card page', async function () {
    const slug = REAL.slug, U = SITE + '/' + slug, id = REAL.id, V = CFG.video;
    let r = await GET('/' + slug); eq(r.status, 200, 'the page of a ready carol'); ok(/^text\/html/.test(r.heads['content-type'])); const page = r.text, meta = function (p, attr) { const m = new RegExp('<meta ' + (attr || 'property') + '="' + p + '" content="([^"]*)"', 'g'), out = []; let x; while ((x = m.exec(page))) out.push(x[1]); return out; };
    eq((page.match(/<title[\s>]/g) || []).length, 1, 'exactly one <title>'); ok(page.indexOf('<title>A Carol for Grandma Dot · ' + CFG.name + '</title>') > 0, 'the carol\'s title');
    eq(meta('og:title').join(), 'A Carol for Grandma Dot'); eq(meta('og:description').join(), 'The Hollisters made Grandma Dot a singing card. Tap to open it.'); eq(meta('og:url').join(), U);
    const img = meta('og:image'); ok(img.length >= 1 && new RegExp('^https://sendacarol\\.test/' + slug + '/poster\\.jpg(\\?v=\\w+)?$').test(img[0]), 'og:image is the absolute https poster: ' + img[0]);
    eq(meta('og:image:width')[0], String(V.sizes.square[0])); eq(meta('og:image:height')[0], String(V.sizes.square[1])); ok(new RegExp('^' + U + '/square\\.mp4').test(meta('og:video')[0]), 'og:video'); eq(meta('og:video:type').join(), 'video/mp4'); eq(meta('og:video:width').join(), String(V.sizes.square[0])); eq(meta('og:video:height').join(), String(V.sizes.square[1]));
    eq(meta('twitter:card', 'name').join(), 'summary_large_image'); ok(new RegExp('^' + U + '/poster\\.jpg').test(meta('twitter:image', 'name')[0])); eq(meta('robots', 'name').join(), 'noindex'); eq(meta('og:site_name').join(), CFG.name);
    ok(page.indexOf('<!--og-->') < 0 && page.indexOf('"{{card}}"') < 0 && !/\{\{\w+\}\}/.test(page), 'no token left on the page'); ok(page.indexOf('window.SAC_CARD = ' + JSON.stringify(slug)) > 0, 'the page knows its card'); ok(page.indexOf('window.SAC_BUILD') > 0);
    const api = await GET('/api/card/' + slug); eq(api.status, 200); const pc = api.json;
    eq(Object.keys(pc).sort().join(), 'engine,from,name,occasion,photos,poster,slug,song,square,story,title,to,url', '/api/card/<name>\'s shape'); eq(pc.slug, slug); eq(pc.title, 'A Carol for Grandma Dot'); eq(pc.to, 'Grandma Dot'); eq(pc.from, 'The Hollisters'); eq(pc.occasion, TPL.occasion); eq(pc.url, U); eq(pc.name, CFG.name);
    eq(pc.photos.length, 2); ok(pc.photos.every(function (p, i) { return p.indexOf('/' + slug + '/photo/' + i) === 0; })); ok(pc.song.indexOf('/' + slug + '/song.m4a') === 0 && pc.poster.indexOf('/' + slug + '/poster.jpg') === 0 && pc.story.indexOf('/' + slug + '/story.mp4') === 0 && pc.square.indexOf('/' + slug + '/square.mp4') === 0, 'its media addresses');
    eq(pc.engine.template, TPL.id); ok(pc.engine.timing && pc.engine.timing.beats.length > 10 && pc.engine.lyrics.length === 2 && pc.engine.scenes.length === 2, 'the engine card, with the song\'s timing');
    for (const x of [[page, 'the page'], [api.text, '/api/card']]) { ok(x[0].indexOf(MAKER_EMAIL) < 0 && x[0].toLowerCase().indexOf('maker-six') < 0, 'the maker\'s email is NOT in ' + x[1]); ok(x[0].indexOf('google:600') < 0 && x[0].indexOf(id) < 0, 'nor the account or the carol\'s id in ' + x[1]); }
    // media
    r = await GET(pc.poster); eq(r.status, 200); eq(r.heads['content-type'], 'image/jpeg'); ok(r.body[0] === 0xff && r.body[1] === 0xd8, 'poster.jpg is a JPEG'); ok(/public/.test(r.heads['cache-control'])); eq(r.heads['x-content-type-options'], 'nosniff'); ok(!r.heads['content-disposition']);
    for (const f of ['story.mp4', 'square.mp4']) {
      r = await GET('/' + slug + '/' + f); eq(r.status, 200, f); eq(r.heads['content-type'], 'video/mp4'); eq(r.body.toString('latin1', 4, 8), 'ftyp'); eq(r.heads['accept-ranges'], 'bytes'); const total = r.body.length, whole = r.body; eq(+r.heads['content-length'], total); ok(!r.heads['content-disposition'], f + ' plays in the page');
      r = await GET('/' + slug + '/' + f, null, { range: 'bytes=0-99' }); eq(r.status, 206, f + ': a Range request is a 206'); eq(r.heads['content-range'], 'bytes 0-99/' + total); eq(r.body.length, 100); ok(r.body.equals(whole.subarray(0, 100)));
      r = await GET('/' + slug + '/' + f, null, { range: 'bytes=1000-' }); eq(r.status, 206); eq(r.heads['content-range'], 'bytes 1000-' + (total - 1) + '/' + total); ok(r.body.equals(whole.subarray(1000)));
      r = await GET('/' + slug + '/' + f, null, { range: 'bytes=-50' }); eq(r.status, 206); ok(r.body.equals(whole.subarray(total - 50)), 'the last 50 bytes'); eq((await GET('/' + slug + '/' + f, null, { range: 'bytes=' + (total + 10) + '-' })).status, 416, 'a range past the end is a 416');
      r = await GET('/' + slug + '/' + f + '?dl=1'); eq(r.status, 200); eq(r.heads['content-disposition'], 'attachment; filename="' + slug + (f === 'story.mp4' ? '-story' : '') + '.mp4"', f + '?dl=1 is a download'); eq(r.body.length, total);
    }
    r = await GET('/' + slug + '/preview.gif'); eq(r.status, 200); eq(r.heads['content-type'], 'image/gif'); eq(r.body.toString('latin1', 0, 4), 'GIF8');
    r = await GET(pc.song); eq(r.status, 200); eq(r.heads['content-type'], 'audio/mp4'); eq(r.body.toString('latin1', 4, 8), 'ftyp');
    r = await GET(pc.photos[0]); eq(r.status, 200); eq(r.heads['content-type'], 'image/jpeg'); ok(r.body[0] === 0xff && r.body[1] === 0xd8); const own = await GET(REAL.photos.find(function (p) { return p.id === REAL.pids[0]; }).url, who6); ok(own.body.equals(r.body), 'photo/0 is the first scene\'s photo');
    eq((await GET('/' + slug + '/photo/2')).status, 404, 'no third photo'); eq((await GET('/' + slug + '/photo/99')).status, 404); eq((await GET('/' + slug + '/nothing.mp4')).status, 404); eq((await GET('/' + slug + '/')).status, 200, 'a trailing slash is the page');
    eq((await POST('/' + slug, {})).status, 405, 'a card page is only read');
    // opens
    const o0 = (await db.get('SELECT opens FROM cards WHERE id = ?', [id])).opens; for (let i = 0; i < 5; i++) eq((await POST('/api/card/' + slug + '/open', {}, ip(70))).json.ok, true);
    eq((await db.get('SELECT opens FROM cards WHERE id = ?', [id])).opens, o0 + 3, 'five opens from one place count as three'); await POST('/api/card/' + slug + '/open', {}, ip(71)); eq((await GET('/api/cards/' + id, who6)).json.card.opens, o0 + 4, 'another place counts'); eq(await count("SELECT COUNT(*) AS n FROM events WHERE kind = 'opened' AND card = ?", [id]), 4);
    eq((await POST('/api/card/no-such-card/open', {})).status, 404);
    // a report
    r = await POST('/api/report', { slug: slug, why: 'me', text: 'That is me in the photo.' }, null, ip(72)); eq(r.json.ok, true, 'anyone can report a card'); const rep = await db.get('SELECT * FROM reports WHERE card = ?', [id]); eq(rep.why, 'me'); eq(rep.state, 'open'); eq((await POST('/api/report', { slug: 'no-such-card' }, null, ip(72))).status, 404);
    // a draft has no page
    const who = await maker(700, 'pages@example.test', 0), draft = await T.carol(who, { song: false, photos: 1, slug: 'still-a-draft' });
    r = await GET('/still-a-draft'); eq(r.status, 404, 'a draft\'s name is a 404'); ok(/That card is not here/.test(r.text), 'the friendly page'); eq((await GET('/api/card/still-a-draft')).status, 404); eq((await GET('/still-a-draft/poster.jpg')).status, 404); eq((await GET('/still-a-draft/photo/0')).status, 404, 'and its photos are not public');
    // the site's own addresses are never a card, even if a row said so
    const before = {}; for (const p of ['legal', 'make', 'admin', 'healthz', 'gallery', 'pricing', 'about', 'help']) before[p] = await GET('/' + p);
    for (const p of Object.keys(before)) await db.run("INSERT INTO cards (id, uid, slug, state, v, occasion, template, title, doc, created, updated) VALUES (?, 'google:700', ?, 'ready', 1, ?, ?, 'Hijack', ?, 1, 1)", ['cHIJACK' + p, p, TPL.occasion, TPL.id, JSON.stringify({ script: { title: 'Hijack' } })]);
    for (const p of Object.keys(before)) { r = await GET('/' + p); eq(r.status, 200, '/' + p + ' answers'); eq(r.text, before[p].text, '/' + p + ' is the site\'s own page, never a card'); ok(r.text.indexOf('Hijack') < 0); }
    ok(JSON.parse(before.healthz.text).ok === true && /Terms|Privacy/.test(before.legal.text), '/healthz and /legal are themselves'); await db.run("DELETE FROM cards WHERE id LIKE 'cHIJACK%'");
    for (const p of ['/api', '/mcp', '/assets', '/fonts', '/login', '/examples']) { r = await GET(p); ok(r.status === 404 || r.status === 405, p + ' is not a card (' + r.status + ')'); }
    // unknown names
    r = await GET('/no-such-card-anywhere'); eq(r.status, 404, 'an unknown name'); ok(/That card is not here/.test(r.text) && /Make a carol of your own/.test(r.text), 'gets the friendly 404 page'); eq(r.heads['x-robots-tag'], 'noindex'); ok(/^text\/html/.test(r.heads['content-type']));
    eq((await GET('/Some/Where/else')).status, 404); eq((await GET('/..%2f..%2fetc')).status, 404); eq((await GET('/no-such-card-anywhere/story.mp4')).status, 404);
    // taken down by its maker, and put back
    r = await POST('/api/cards/' + id + '/down', {}, who6); eq(r.json.card.state, 'down', 'the maker takes it down'); r = await GET('/' + slug); eq(r.status, 404, 'the page is a 404'); ok(/That card is not here/.test(r.text));
    for (const f of ['poster.jpg', 'story.mp4', 'square.mp4', 'preview.gif', 'song.m4a', 'photo/0']) eq((await GET('/' + slug + '/' + f)).status, 404, f + ' is a 404 while it is down'); eq((await GET('/api/card/' + slug)).status, 404); eq((await GET('/api/slug?s=' + slug)).json.ok, false, 'its name is still its own');
    r = await POST('/api/cards/' + id + '/up', {}, who6); eq(r.json.card.state, 'ready', 'and puts it back'); eq((await GET('/' + slug)).status, 200); eq((await GET('/' + slug + '/story.mp4')).status, 200);
    await admin('admin_take_down', { id: id, reason: 'a report came in' }); eq((await GET('/' + slug)).status, 404, 'taken down by the admin'); r = await POST('/api/cards/' + id + '/up', {}, who6); eq(r.status, 403, 'the maker cannot put that back'); ok(r.json.error.indexOf(CFG.support) > 0);
    await admin('admin_take_down', { id: id, restore: true, reason: 'it was fine' }); eq((await GET('/' + slug)).status, 200);
    // deleted: everything goes
    const dir = path.join(STORE, CFG.app, 'cards', id); ok(walk(dir).length >= 10, walk(dir).length + ' files in the store before'); eq((await DEL('/api/cards/' + id, who)).status, 404, 'another account cannot delete it'); eq((await DEL('/api/cards/' + id)).status, 401);
    r = await DEL('/api/cards/' + id, who6); eq(r.json.ok, true, 'the maker deletes it'); r = await GET('/' + slug); eq(r.status, 404, 'the page is gone'); ok(/That card is not here/.test(r.text));
    for (const f of ['poster.jpg', 'story.mp4', 'square.mp4', 'preview.gif', 'song.m4a', 'photo/0', 'photo/1']) eq((await GET('/' + slug + '/' + f)).status, 404, f + ' is gone'); eq((await GET('/api/card/' + slug)).status, 404);
    eq(walk(dir).length, 0, 'NO file is left in the store for it'); eq(walk(STORE).filter(function (f) { return f.indexOf(id) >= 0; }).length, 0, 'anywhere'); ok(walk(STORE).length > 0, '(other carols\' files are still there)');
    eq(await count('SELECT COUNT(*) AS n FROM photos WHERE card = ?', [id]) + await count('SELECT COUNT(*) AS n FROM takes WHERE card = ?', [id]) + await count('SELECT COUNT(*) AS n FROM media WHERE card = ?', [id]), 0, 'and no row names one');
    const row = await db.get('SELECT state, slug, doc, title FROM cards WHERE id = ?', [id]); eq(row.state, 'deleted'); eq(row.slug, null); eq(row.doc, '{}', 'its words are gone too'); eq(row.title, '');
    eq((await GET('/api/cards/' + id, who6)).status, 404); ok(!(await GET('/api/cards', who6)).json.items.some(function (x) { return x.id === id; }), 'it is not in the maker\'s list'); for (const t of REAL.takes) eq((await GET(t.url, who6)).status, 404);
    eq((await GET('/api/slug?s=' + slug)).json.ok, true, 'the name is free again'); eq((await POST('/api/cards/' + draft.id + '/save', { slug: slug }, who)).json.card.slug, slug, 'and another carol can take it'); eq((await GET('/' + slug)).status, 404, '(a draft: still no page)');
  });

  await section('8. Email', async function () {
    const SENDER = 'sender-eight@example.test', who = await maker(800, SENDER, 3), uid = 'google:800', other = await maker(801, 'second-sender@example.test', 2);
    const send = function (id, b, w, k) { return POST('/api/cards/' + id + '/email', b, w || who, k ? { 'idempotency-key': k } : null); }, sends = function (id) { return db.all('SELECT * FROM sends WHERE card = ? ORDER BY id', [id]); };
    const draft = await T.carol(who, { song: false, photos: 0, answers: { from: 'Draft Senders' } }); let r = await send(draft.id, { to: ['a@x.test'], know: true }); eq(r.status, 409, 'a draft cannot be emailed'); ok(/not ready/.test(r.json.error));
    const c = await T.carol(who, { photos: 1, slug: 'the-senders-2026', answers: { from: 'The Senders <3', to: 'Aunt May' } }); eq(c.state, 'ready'); eq(c.shared, false); const n0 = F.sent.length;
    r = await send(c.id, { to: ['a@x.test'] }); eq(r.status, 400, 'without "these are people I know" nothing is sent'); ok(/people you know/.test(r.json.error)); eq((await send(c.id, { to: ['a@x.test'], know: 'yes' })).status, 400, 'know must be true');
    r = await send(c.id, { to: [], know: true }); eq(r.status, 400, 'no address'); r = await send(c.id, { to: ['not-an-address', 'a@b', '@x.test', 'a b@x.test', 'a@x..test'], know: true }); eq(r.status, 400, 'only bad addresses'); ok(/at least one/.test(r.json.error)); eq(F.sent.length, n0, 'nothing was sent'); eq((await sends(c.id)).length, 0);
    eq((await send(c.id, { to: ['a@x.test'], know: true }, other)).status, 404, 'another account cannot send it'); eq((await POST('/api/cards/' + c.id + '/email', { to: ['a@x.test'], know: true })).status, 401);
    // sending
    const NOTE = '<script>alert(1)</script> & "love" from <b>us</b>', k1 = key();
    r = await send(c.id, { to: ['A@X.test', 'not-an-address', 'a@x.test', 'b@y.test'], note: NOTE, know: true }, who, k1); eq(r.status, 200); eq(r.json.sent, 2, 'bad and repeated addresses are dropped'); eq(r.json.stopped, 0); eq(r.json.failed, 0); eq(F.sent.length, n0 + 2);
    eq(r.json.card.shared, true, 'sending marks the card shared'); eq(r.json.card.sent, 2); r = await send(c.id, { to: ['a@x.test', 'b@y.test'], note: NOTE, know: true }, who, k1); eq(r.heads['idempotent-replay'], 'true'); eq(F.sent.length, n0 + 2, 'the same send again sends nothing');
    eq((await POST('/api/cards/' + c.id + '/save', { slug: 'another-name' }, who)).status, 409, 'and its name is fixed from then on');
    const m = F.sent[n0], link = SITE + '/the-senders-2026';
    eq(m.from, CFG.emailFrom, 'from config.emailFrom'); eq(m.to.join(), 'a@x.test', 'one mail to one person'); eq(m.auth, 'Bearer re_test_never_used'); ok(m.subject.indexOf(c.title) >= 0 && m.subject.indexOf('The Senders') === 0, 'the subject: ' + m.subject);
    ok(m.html.indexOf('<a href="' + link + '"><img src="' + link + '/poster.jpg"') > 0, 'the poster, linked to the card\'s page'); ok(m.html.indexOf('>' + c.title + '</h1>') > 0, 'the title'); ok(m.html.indexOf(c.script.signoff.replace(/</g, '&lt;')) > 0 && m.text.indexOf(c.script.signoff) > 0, 'the sign-off'); ok(m.text.indexOf('Open it: ' + link) > 0, 'the link in the text');
    ok(m.html.indexOf('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;love&quot; from &lt;b&gt;us&lt;/b&gt;') > 0, 'the maker\'s note, escaped'); ok(m.html.indexOf('<script') < 0 && m.html.indexOf('<b>us</b>') < 0, 'no markup of the maker\'s gets in'); ok(m.html.indexOf('The Senders &lt;3') > 0 && m.html.indexOf('The Senders <3') < 0, 'their name is escaped too'); ok(m.text.indexOf(NOTE) > 0);
    const stop = /<(https:\/\/sendacarol\.test\/stop\?e=[\w-]+&k=[\w-]+)>/.exec(m.headers['List-Unsubscribe']); ok(stop, 'a List-Unsubscribe header'); eq(m.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click'); ok(m.html.indexOf('<a href="' + stop[1] + '"') > 0 && /Don't email me again<\/a>/.test(m.html), 'a "Don\'t email me again" link'); ok(m.text.indexOf('Don\'t email me again: ' + stop[1]) > 0);
    for (const x of F.sent.slice(n0)) { const all = JSON.stringify(x); ok(all.indexOf(SENDER) < 0 && all.toLowerCase().indexOf('sender-eight') < 0, 'the maker\'s own address is NOT in the mail to ' + x.to[0]); ok(all.indexOf('google:800') < 0 && all.indexOf(c.id) < 0, 'nor their account'); ok(!x.reply_to && !x.cc && !x.bcc, 'no reply-to, cc or bcc'); }
    ok(F.sent[n0 + 1].headers['List-Unsubscribe'] !== m.headers['List-Unsubscribe'], 'each person has their own stop link');
    // the record: a hash, never the address
    let rows = await sends(c.id); eq(rows.length, 2); eq(rows[0].hash, S.mail.hash('a@x.test'), 'the send is kept as a hash'); eq(rows[0].state, 'sent'); eq(rows[0].uid, uid);
    // ten for a carol
    r = await send(c.id, { to: 'c@z.test, d@z.test; e@z.test', know: true }); eq(r.json.sent, 3, 'addresses in one line'); r = await send(c.id, { to: ['f1@z.test', 'f2@z.test', 'f3@z.test', 'f4@z.test', 'f5@z.test', 'f6@z.test'], know: true });
    eq(r.status, 409, 'six when five are left'); ok(/5 more people \(10 in all\)/.test(r.json.error), r.json.error); eq(F.sent.length, n0 + 5, 'none of them sent');
    r = await send(c.id, { to: ['f1@z.test', 'f2@z.test', 'f3@z.test', 'f4@z.test', 'f5@z.test'], know: true }); eq(r.json.sent, 5); eq(r.json.card.sent, CFG.limits.recipientsPerCarol, 'ten sent');
    r = await send(c.id, { to: ['eleven@z.test'], know: true }); eq(r.status, 409, 'the eleventh is refused'); ok(/emailed to 10 people/.test(r.json.error) && /Share the link/.test(r.json.error), 'with a sentence: ' + r.json.error); eq(F.sent.length, n0 + 10); eq(await count("SELECT COUNT(*) AS n FROM events WHERE kind = 'emailed' AND card = ?", [c.id]), 10);
    // stopping
    const sp = new URL(stop[1]), sl = sp.pathname + sp.search; r = await GET(sl); eq(r.status, 200, 'GET /stop shows a page'); ok(/<form method="post"/.test(r.text) && /<button[^>]*>Don&#39;t email me again|<button[^>]*>Don't email me again/.test(r.text) && r.text.indexOf('a@x.test') > 0, 'with a button'); eq(await count('SELECT COUNT(*) AS n FROM suppress'), 0, 'and stops nothing');
    for (const bad of ['/stop', '/stop?e=' + sp.searchParams.get('e') + '&k=' + 'A'.repeat(32), '/stop?e=' + Buffer.from('b@y.test').toString('base64url') + '&k=' + sp.searchParams.get('k'), '/stop?e=%%%&k=x', '/stop?e=' + sp.searchParams.get('e')]) { eq((await GET(bad)).status, 400, 'a bad stop link is refused: ' + bad.slice(0, 30)); eq((await T.call('POST', bad, '')).status, 400); }
    eq(await count('SELECT COUNT(*) AS n FROM suppress'), 0, 'and suppresses nobody'); eq((await T.call('PUT', sl, null)).status, 405);
    r = await T.call('POST', sl, ''); eq(r.status, 200, 'POST /stop stops'); ok(/will not email/.test(r.text)); const sup = await db.all('SELECT * FROM suppress'); eq(sup.length, 1); eq(sup[0].hash, S.mail.hash('a@x.test'), 'kept as a hash'); eq((await T.call('POST', sl, '')).status, 200, 'twice is fine'); eq(await count('SELECT COUNT(*) AS n FROM suppress'), 1);
    const c2 = await T.carol(other, { photos: 0, answers: { from: 'Second Senders' } }), n1 = F.sent.length; r = await send(c2.id, { to: ['a@x.test', 'new@x.test'], know: true }, other);
    eq(r.json.sent, 1, 'a later send by another maker'); eq(r.json.stopped, 1, 'is "stopped" for that address'); eq(F.sent.length, n1 + 1); eq(F.sent[n1].to.join(), 'new@x.test', 'and nothing goes to it'); rows = await sends(c2.id); eq(rows.map(function (x) { return x.state; }).join(), 'stopped,sent');
    // a failure at Resend
    F.resendDown = true; const c3 = await T.carol(other, { photos: 0, answers: { from: 'Third Senders' } }), e0 = await count("SELECT COUNT(*) AS n FROM events WHERE kind = 'emailed'"); r = await send(c3.id, { to: ['down@x.test'], know: true }, other); F.resendDown = false;
    eq(r.status, 200); eq(r.json.failed, 1, 'a failure at the mail service is "failed"'); eq(r.json.sent, 0, 'and not counted as sent'); eq(r.json.card.sent, 0); eq(r.json.card.shared, false, 'and the card is not shared by it'); eq((await sends(c3.id))[0].state, 'failed'); eq(await count("SELECT COUNT(*) AS n FROM events WHERE kind = 'emailed'"), e0);
    // the day's limit
    await db.run("INSERT INTO usage_day (uid, day, kind, n) VALUES ('google:801', ?, 'email', ?) ON CONFLICT (uid, day, kind) DO UPDATE SET n = excluded.n", [TODAY, CFG.limits.emailsPerDay]); const n2 = F.sent.length;
    r = await send(c3.id, { to: ['late@x.test'], know: true }, other); eq(r.status, 429, 'over the day\'s emails'); ok(/tomorrow/.test(r.json.error)); eq(F.sent.length, n2);
    // nowhere a plain address
    const all = JSON.stringify(await db.all('SELECT * FROM sends')) + JSON.stringify(await db.all('SELECT * FROM suppress')); ok(all.indexOf('@') < 0 && all.indexOf('x.test') < 0, 'the sends and suppress tables hold no address'); ok(logs.join('\n').indexOf('a@x.test') < 0 && logs.join('\n').indexOf('down@x.test') < 0, 'nor do the logs');
  });

  await section('9. Occasions', async function () {
    const made = Templates.occasions || [], conf = async function () { return (await GET('/api/me')).json.config; }, who = await maker(900, 'occasions@example.test', 0);
    let c = await conf(); const by = {}; c.occasions.forEach(function (o) { by[o.id] = o; });
    ['christmas', 'birthday', 'love', 'thanks', 'congrats'].forEach(function (id) { ok(by[id], id + ' is listed'); if (made.indexOf(id) >= 0) eq(by[id].state, 'live', id + ' is live'); else { eq(by[id].state, 'soon', id + ' has no templates yet, so it is "soon"'); say('   NOTE no templates for ' + id + ' yet'); } });
    CFG.occasions.forEach(function (o) { if (o.state === 'off') ok(!by[o.id], o.id + ' (off) is not listed'); else if (o.state === 'soon') eq(by[o.id].state, 'soon', o.id + ' is coming soon'); });
    ok(c.occasions.every(function (o) { return o.state === 'live' || o.state === 'soon'; }), 'never an "off" one'); ok(c.occasions.every(function (o) { return o.id && o.name && o.hello && typeof o.now === 'boolean'; }), 'each has id, name, hello, now');
    eq(c.featured, S.occasions().featured, 'config.featured is today\'s'); ok(c.occasions.filter(function (o) { return o.now; }).length <= 1, 'at most one is featured now');
    // featured follows the date
    const realNow = Date.now, on = async function (day, want, why) { Date.now = function () { return new Date(day + 'T12:00:00Z').getTime(); }; try { const x = await conf(); eq(x.featured, want, why + ' (' + day + ') -> ' + want); const f = x.occasions.filter(function (o) { return o.now; }).map(function (o) { return o.id; }).join(); eq(f, want === CFG.defaultOccasion && !/birthday is featured/.test(why) ? '' : want, 'only the featured one says "now"'); eq(S.occasions().featured, want); } finally { Date.now = realNow; } };
    eq(CFG.defaultOccasion, 'birthday');
    await on('2026-12-10', 'christmas', 'December'); await on('2026-11-01', 'christmas', 'the first of November'); await on('2026-12-31', 'christmas', 'New Year\'s Eve'); await on('2026-10-31', 'birthday', 'the day before');
    await on('2026-07-15', CFG.defaultOccasion, 'July: the default'); await on('2027-01-01', 'birthday', 'New Year\'s Day'); await on('2027-02-05', 'love', '5 February'); await on('2027-01-20', 'love', 'the first day'); await on('2027-02-14', 'love', 'Valentine\'s Day'); await on('2027-01-19', 'birthday', 'the day before'); await on('2027-02-15', 'birthday', 'the day after');
    await on('2027-05-01', 'birthday', 'an occasion that is only "soon" is not featured'); eq(Date.now, realNow, 'the clock is put back');
    // the admin switches one off
    const all0 = (await GET('/api/templates?per=48')).json, xmas = Templates.list.filter(function (t) { return t.occasion === 'christmas'; }); ok(xmas.length > 0 && all0.items.some(function (t) { return t.occasion === 'christmas'; }), 'christmas templates are in the gallery');
    let r = await admin('admin_occasion', { id: 'christmas', state: 'off', reason: 'the test switches it off' }); eq(r.state, 'off'); c = await conf(); ok(!c.occasions.some(function (o) { return o.id === 'christmas'; }), 'switched off: it leaves /api/me'); ok(c.featured !== 'christmas', 'and is not featured (' + c.featured + ')');
    const off = (await GET('/api/templates?per=48')).json; ok(!off.items.some(function (t) { return t.occasion === 'christmas'; }), 'its templates leave /api/templates'); eq(off.total, all0.total - xmas.length, 'the total says so'); eq((await GET('/api/templates?occasion=christmas')).json.total, 0);
    r = await POST('/api/cards', { template: xmas[0].id }, who); eq(r.status, 400, 'and a card cannot be made from them'); ok(/Pick a template/.test(r.json.error));
    r = await admin('admin_occasion', { id: 'christmas', state: 'soon', reason: 'the test makes it soon' }); eq((await conf()).occasions.find(function (o) { return o.id === 'christmas'; }).state, 'soon'); eq((await POST('/api/cards', { template: xmas[0].id }, who)).status, 400, '"soon" cannot be made either');
    await admin('admin_occasion', { id: 'christmas', state: 'live', reason: 'the test puts it back' }); eq((await POST('/api/cards', { template: xmas[0].id }, who)).status, 200, 'live again: it can'); eq((await GET('/api/templates?per=48')).json.total, all0.total);
    // ... and changes the dates
    await admin('admin_occasion', { id: 'christmas', from: '12-01', to: '01-05', reason: 'the test moves the dates' }); await on('2026-11-15', 'birthday', 'new dates: not yet in November'); await on('2026-12-01', 'christmas', 'new dates'); await on('2027-01-03', 'christmas', 'dates that wrap the new year'); await on('2027-01-06', 'birthday', 'and end');
    await admin('admin_occasion', { id: 'christmas', clear: true, reason: 'the test clears the dates' }); await on('2026-12-25', 'birthday', 'no dates: never featured');
    await admin('admin_occasion', { id: 'birthday', from: '07-01', to: '07-31', reason: 'the test features birthdays' }); await on('2026-07-15', 'birthday', 'birthday is featured in July'); await admin('admin_occasion', { id: 'birthday', clear: true, reason: 'the test clears it' });
    for (const bad of [{ id: 'christmas', from: '13-01', to: '12-31' }, { id: 'christmas', from: '11-01' }, { id: 'christmas', state: 'sometimes' }, { id: 'no-such', state: 'off' }, { id: 'anniversary', state: 'live' }]) { if (bad.id === 'anniversary' && Templates.list.some(function (t) { return t.occasion === 'anniversary'; })) continue; let e = null; try { await admin('admin_occasion', Object.assign({ reason: 'the test tries' }, bad)); } catch (x) { e = x; } ok(e && /\.$/.test(e.message), 'refused: ' + JSON.stringify(bad) + ' (' + (e && e.message) + ')'); }
    await admin('admin_occasion', { id: 'christmas', from: '11-01', to: '12-31', reason: 'the test puts the dates back' }); await on('2026-12-10', 'christmas', 'back as it was'); await S.loadSettings(); await on('2026-12-10', 'christmas', 'and it is kept in the database');

    // /api/templates
    const T1 = (await GET('/api/templates')).json; eq(Object.keys(T1).sort().join(), 'families,items,page,pages,per,total', '/api/templates\' shape'); eq(T1.per, 12); eq(T1.page, 1); eq(T1.pages, Math.max(1, Math.ceil(T1.total / 12))); eq(T1.items.length, Math.min(12, T1.total));
    const live = Templates.list.filter(function (t) { return c.occasions.concat([{ id: 'christmas', state: 'live' }]).some(function (o) { return o.id === t.occasion && o.state === 'live'; }); }); eq(T1.total, live.length, 'every live template');
    T1.items.forEach(function (t) { eq(Object.keys(t).sort().join(), 'blurb,bpm,family,id,name,occasion,tags', 'a template\'s shape'); ok(t.bpm >= 60 && t.bpm <= 180 && Array.isArray(t.tags) && t.blurb); }); ok(T1.families.length > 0 && T1.families.every(function (f) { return f.id && f.name && f.occasion; }), 'families');
    const word = live[live.length - 1].name.split(/\s+/)[0].toLowerCase(); r = (await GET('/api/templates?q=' + encodeURIComponent(word.toUpperCase()))).json; ok(r.total >= 1 && r.items.some(function (t) { return t.id === live[live.length - 1].id; }), 'search by q finds "' + word + '"');
    ok(r.items.every(function (t) { const full = Templates.get(t.id); return [full.name, full.blurb, full.family, full.occasion].concat(full.tags || []).join(' ').toLowerCase().indexOf(word) >= 0; }), 'and only what matches');
    r = (await GET('/api/templates?q=zzzqqqxxx')).json; eq(r.total, 0, 'a search with no match'); eq(r.items.length, 0); eq(r.pages, 1); eq(r.page, 1);
    for (const o of Array.from(new Set(live.map(function (t) { return t.occasion; })))) { r = (await GET('/api/templates?per=48&occasion=' + o)).json; eq(r.total, live.filter(function (t) { return t.occasion === o; }).length, 'filter by occasion ' + o); ok(r.items.every(function (t) { return t.occasion === o; })); ok(r.families.every(function (f) { return f.occasion === o; }), 'with that occasion\'s families'); }
    const fam = live[0].family; r = (await GET('/api/templates?per=48&family=' + fam)).json; eq(r.total, live.filter(function (t) { return t.family === fam; }).length, 'filter by family ' + fam); ok(r.items.every(function (t) { return t.family === fam; })); eq((await GET('/api/templates?family=no-such-family')).json.total, 0);
    eq((await GET('/api/templates?occasion=' + live[0].occasion + '&family=' + fam + '&q=' + encodeURIComponent(live[0].name))).json.items[0].id, live[0].id, 'search and filters together');
    if (live.length >= 2) { const p1 = (await GET('/api/templates?per=1')).json, p2 = (await GET('/api/templates?per=1&page=2')).json, end = (await GET('/api/templates?per=1&page=999')).json;
      eq(p1.pages, live.length, 'one a page: as many pages as templates'); eq(p1.items.length, 1); eq(p2.page, 2); ok(p2.items[0].id !== p1.items[0].id, 'page 2 is another'); eq(end.page, live.length, 'a page past the end is the last'); eq(p1.total, live.length); eq(p1.per, 1);
      const seen = []; for (let i = 1; i <= live.length; i++) seen.push((await GET('/api/templates?per=1&page=' + i)).json.items[0].id); eq(new Set(seen).size, live.length, 'the pages hold every template once'); eq(seen.join(), (await GET('/api/templates?per=48')).json.items.slice(0, 48).map(function (t) { return t.id; }).join(), 'in the same order'); }
    eq((await GET('/api/templates?per=1000')).json.per, 48, 'at most 48 a page'); eq((await GET('/api/templates?per=0&page=-3')).json.page, 1);
    // a template switched off, and moved
    const t0 = (await GET('/api/templates?per=48')).json, victim = t0.items[t0.items.length - 1], mine = (await POST('/api/cards', { template: t0.items[0].id }, who)).json.card;
    r = await admin('admin_template', { id: victim.id, off: true, reason: 'the test switches it off' }); eq(r.off, true); r = (await GET('/api/templates?per=48')).json; eq(r.total, t0.total - 1, 'a template switched off leaves the gallery'); ok(!r.items.some(function (t) { return t.id === victim.id; }));
    eq((await GET('/api/templates?q=' + encodeURIComponent(victim.name))).json.items.filter(function (t) { return t.id === victim.id; }).length, 0, 'and the search'); eq((await POST('/api/cards', { template: victim.id }, who)).status, 400, 'no card can be made from it');
    if (victim.id !== mine.template) eq((await POST('/api/cards/' + mine.id + '/save', { template: victim.id }, who)).status, 400, 'and no card can move to it');
    await admin('admin_template', { id: victim.id, off: false, order: -5, reason: 'the test puts it first' }); r = (await GET('/api/templates?per=48')).json; eq(r.total, t0.total, 'on again'); eq(r.items[0].id, victim.id, 'and first, by its order');
    if (victim.id !== mine.template) { r = await POST('/api/cards/' + mine.id + '/save', { template: victim.id }, who); eq(r.json.card.template, victim.id, 'a draft can change its template'); eq(r.json.card.occasion, victim.occasion); }
    await admin('admin_template', { id: victim.id, order: Templates.get(victim.id).order || 500, reason: 'the test puts it back' }); eq((await GET('/api/templates?per=48')).json.items.map(function (t) { return t.id; }).join(), t0.items.map(function (t) { return t.id; }).join(), 'back in its place');
    eq((await POST('/api/cards', { template: 'no-such-template' }, who)).status, 400); eq((await POST('/api/cards', {}, who)).status, 400);
  });

  await section('10. A site with pieces missing, and a machine that stops when idle', async function () {
    const who = await maker(1000, 'pieces@example.test', 0), uid = 'google:1000', keep = {}, unset = function (k) { keep[k] = process.env[k]; delete process.env[k]; }, back = function () { Object.keys(keep).forEach(function (k) { process.env[k] = keep[k]; delete keep[k]; }); };
    const cfg = async function () { return (await GET('/api/me', who)).json; }, written = await T.carol(who, { song: false, photos: 1, answers: { from: 'Pieces Family' } });
    // no Stripe key: purchases open soon, no Checkout is attempted, and the admin can grant credits by hand, with a reason
    unset('STRIPE_SECRET_KEY'); let me = await cfg(); eq(me.config.payments, false, 'no Stripe key: the page is told payments are off'); eq(me.config.closed.pay, 'Purchases open soon.');
    const asked0 = F.stripe.asked.length; let r = await POST('/api/buy', { pack: 'one' }, who, { 'idempotency-key': key() }); eq(r.status, 503); eq(r.json.error, 'Purchases open soon.'); eq(F.stripe.asked.length, asked0, 'no Checkout was attempted');
    eq((await GET('/api/buy/confirm?session_id=cs_test_0', who)).json.ok, false, 'and nothing is confirmed'); eq(me.user.credits, 0);
    r = await admin('admin_grant', { uid: uid, credits: 2 }).catch(function (e) { return { error: e.message }; }); ok(r.error && /reason/i.test(r.error), 'a grant needs a reason: ' + JSON.stringify(r).slice(0, 120));
    await admin('admin_grant', { uid: uid, credits: 2, reason: 'the owner testing end to end before payments open' }); eq(await S.balance(uid), 2, 'the admin granted credits by hand'); eq((await cfg()).user.credits, 2); back();
    // no Google client id: only the emailed link is offered
    unset('GOOGLE_CLIENT_ID'); me = await cfg(); eq(me.google, null, 'no Google client id: no Google button'); eq(me.emailSignIn, true, 'the emailed link is offered'); eq((await POST('/api/auth/google', { credential: 'x' })).status, 503); back();
    unset('RESEND_API_KEY'); me = await cfg(); eq(me.emailSignIn, false, 'no email key: no emailed link'); ok(me.google, 'Google still is'); eq((await POST('/api/auth/link', { email: 'a@example.test' })).status, 503); back();
    // no writing agent, no music service: making is closed, with a sentence
    const client = Agent.seam.client, sf = Song.seam.fetch; Agent.seam.client = null; unset('ANTHROPIC_API_KEY'); me = await cfg(); eq(me.config.agent, false);
    r = await POST('/api/cards/' + written.id + '/write', { ask: 'funnier' }, who); eq(r.status, 503); eq(r.json.error, 'The carol writer is not open yet. Come back soon.'); Agent.seam.client = client; back();
    Song.seam.fetch = null; unset('ELEVENLABS_API_KEY'); me = await cfg(); eq(me.config.music, false); const b0 = await S.balance(uid);
    r = await POST('/api/cards/' + written.id + '/song', {}, who, { 'idempotency-key': key() }); eq(r.status, 503); ok(/songs cannot be made for now/.test(r.json.error), r.json.error); eq(await S.balance(uid), b0, 'and no credit is spent'); eq(await count('SELECT COUNT(*) AS n FROM jobs WHERE card = ?', [written.id]), 0); Song.seam.fetch = sf; back();
    // no storage on the live machine: uploads are refused with a sentence, and NOTHING is written to the machine's own disk
    const Store = require('../store.js'), ldir = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-live-')), live = Store({ env: {}, dir: ldir, prefix: 'send-a-carol/', production: true });
    ok(/storage settings are not set \(no R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY\)/.test(live.broken()), 'on the live machine, no settings means storage is off: ' + live.broken());
    let threw = null; try { await live.put('cards/x/a.jpg', Buffer.from('x')); } catch (e) { threw = e; } ok(threw && threw.status === 503, 'a put refuses'); threw = null; try { await live.get('cards/x/a.jpg'); } catch (e) { threw = e; } ok(threw && threw.status === 503, 'and a get'); eq(fs.readdirSync(ldir).length, 0, 'nothing was written to the disk'); fs.rmSync(ldir, { recursive: true, force: true });
    eq(Store({ env: {}, dir: T.dir, prefix: 'send-a-carol/' }).broken(), '', '(a laptop keeps its folder)');
    const cfgR2 = Store({ env: { R2_ENDPOINT: 'https://s3.example.test', R2_BUCKET: 'a-bucket', R2_REGION: 'us-east-1', R2_ACCESS_KEY_ID: 'id', R2_SECRET_ACCESS_KEY: 'secret' }, dir: T.dir, prefix: 'send-a-carol/', transport: async function (q) { cfgR2.asked = q; return { status: 200, headers: {}, body: Buffer.alloc(0) }; } });
    eq(cfgR2.broken(), ''); eq(cfgR2.prefix(), 'send-a-carol/', 'the prefix is the app\'s folder when not given'); await cfgR2.put('cards/x/a.jpg', Buffer.from('x')); eq(cfgR2.asked.url, 'https://s3.example.test/a-bucket/send-a-carol/cards/x/a.jpg', 'endpoint, bucket and prefix are plain settings'); ok(/\/us-east-1\/s3\/aws4_request/.test(cfgR2.asked.headers.authorization), 'and so is the region');
    S.ST.setup({ R2_ENDPOINT: 'https://s3.example.test', R2_BUCKET: 'a-bucket' });   // (this server's storage, half set: off)
    me = await cfg(); eq(me.config.storage, false, 'the page is told storage is off'); eq(me.config.music, false); const files0 = walk(STORE).length;
    r = await upload(written.id, pic('image/jpeg', 800, 600, 10), 'image/jpeg', who); eq(r.status, 503, 'an upload is refused'); ok(/Photos and videos cannot be kept yet/.test(r.json.error), 'with a sentence: ' + r.json.error); eq(walk(STORE).length, files0, 'and nothing is kept anywhere');
    r = await POST('/api/cards/' + written.id + '/song', {}, who, { 'idempotency-key': key() }); eq(r.status, 503, 'and no song is made without somewhere to keep it'); eq(await S.balance(uid), b0);
    S.ST.setup({}); eq((await cfg()).config.storage, true);
    // nothing in the database is an address: only keys under the app's folder (moving buckets is a copy and a change of settings)
    for (const q of ['SELECT okey AS k FROM photos', 'SELECT skey AS k FROM photos', 'SELECT akey AS k FROM takes', 'SELECT mkey AS k FROM media']) for (const x of await db.all(q)) ok(/^cards\/[A-Za-z0-9]+\/[\w.-]+$/.test(x.k), 'a key, not an address: ' + x.k);
    // legal: making a carol is not gated on agreeing to the draft terms, and nothing is recorded as accepted
    ok(!Object.keys(await db.get('SELECT * FROM users WHERE id = ?', [uid])).some(function (k) { return /terms|accept|agree/i.test(k); }), 'no acceptance is recorded on an account'); ok(/Draft: under legal review/.test((await GET('/legal/terms')).text), 'the terms still say they are a draft');
    // THE MACHINE STOPS WHEN IDLE. While a job runs it asks for its own /healthz through the public address (traffic keeps it up) ...
    const JS = S.jobs.state, realFetch = S.seam.fetch, pinged = []; S.seam.fetch = async function (u) { pinged.push(String(u)); return { ok: true, arrayBuffer: async function () { return new ArrayBuffer(0); } }; };
    JS.keepAwake = true; JS.awakeEvery = 15; const sent0 = F.sent.length; r = await POST('/api/cards/' + written.id + '/song', {}, who, { 'idempotency-key': key() }); eq(r.status, 200); await S.jobs.drain();
    JS.keepAwake = false; JS.awakeEvery = 20000; S.seam.fetch = realFetch; ok(pinged.length >= 1 && pinged.every(function (u) { return u === SITE + '/healthz'; }), 'while the job ran the machine asked for its own /healthz (' + pinged.length + ' times)'); const n0 = pinged.length; await new Promise(function (f) { setTimeout(f, 80); }); eq(pinged.length, n0, 'and stopped asking when it was done');
    // ... and a carol finished with NOBODY WATCHING is announced to its maker by email, once
    let mails = F.sent.slice(sent0); eq(mails.length, 1, 'one email'); eq(mails[0].to.join(), 'pieces@example.test', 'to the maker'); ok(/^Your carol is ready: /.test(mails[0].subject), mails[0].subject); ok(mails[0].html.indexOf(SITE + '/make?card=' + written.id) > 0 && mails[0].text.indexOf(SITE + '/make?card=' + written.id) > 0, 'with the way back to it');
    eq(await count("SELECT COUNT(*) AS n FROM events WHERE kind = 'readymail' AND card = ?", [written.id]), 1);
    // a maker who is watching (the progress page asks every second or two) gets no email
    const s1 = F.sent.length; await GET('/api/cards/' + written.id + '/status', who); r = await POST('/api/cards/' + written.id + '/render', {}, who, { 'idempotency-key': key() }); eq(r.status, 200); await GET('/api/cards/' + written.id + '/status', who); await S.jobs.drain(); eq(F.sent.length, s1, 'watching: no email');
    // an address that asked for no email gets none
    await db.run('INSERT INTO suppress (hash, at) VALUES (?, ?) ON CONFLICT DO NOTHING', [S.mail.hash('pieces@example.test'), Date.now()]); JS.watched = {}; r = await POST('/api/cards/' + written.id + '/song', {}, who, { 'idempotency-key': key() }); eq(r.status, 200); await S.jobs.drain(); eq(F.sent.length, s1, 'an address that said "don\'t email me again" is left alone');
  });

  // (nothing here reached the real network)
  ok(F.net.every(function (u) { return /^https:\/\/(api\.resend\.com|api\.elevenlabs\.io|www\.googleapis\.com)\//.test(u); }), 'only the fakes were asked');

  await T.done();
  say('OK server (' + checks + ' checks, ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s, ' + made.real + ' real render)');
  process.exit(0);
})().catch(function (e) { process.stdout.write('FAILED server: ' + (e && e.stack || e) + '\n--- the server\'s last lines ---\n' + logs.slice(-8).join('\n') + '\n'); process.exit(1); });
