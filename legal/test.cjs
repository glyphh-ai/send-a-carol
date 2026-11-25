// node legal/test.cjs
// The legal pages, checked: every page is drawn, with the draft banner and its title; the name and the address
// are filled in ({{name}}, {{domain}}, {{site}}) and no token is left; the prices and the limits on the pages are
// the config's ({{packs}}, {{takes}}, {{recipients}}, {{photos}}); the exact sentences the owner ruled on are in
// the refund policy and the terms; there is no recurring plan; the only email address anywhere is the support address; every
// [[OWNER: ...]] placeholder is still to be seen on its page (and is listed at the end); nothing a file says can
// become markup; every link leads somewhere; and no file here promises money back.
// It starts no server and touches nothing outside this folder.
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const L = require('./legal.js');
let REPO = null; try { REPO = require('../config.js'); } catch (e) { /* (said by a test below) */ }
let passed = 0, failed = 0;
const ok = function (name, fn) { try { fn(); passed++; console.log('  ok   ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').join('\n       ')); } };
const SLUGS = ['terms', 'privacy', 'refunds', 'acceptable-use', 'photos'], VERSION = '2026-11-18.1', SUPPORT = 'support' + String.fromCharCode(64) + 'glyphh.ai';
const raw = function (s) { return fs.readFileSync(path.join(__dirname, s + '.md'), 'utf8'); };
const docs = {}; SLUGS.forEach(function (s) { docs[s] = L.doc(s); });
const bodyOf = function (s) { return docs[s].body + '\n' + (docs[s].meta.summary || ''); };
const says = function (s, text) { assert.ok(bodyOf(s).indexOf(text) >= 0, s + '.md should say "' + text + '"'); };
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const everyHtml = function () { return SLUGS.map(function (s) { return [s, L.page(s)]; }).concat([['index', L.index()], ['missing', L.missing()]]); };

console.log('\nThe pages');
ok('there are five, each with a title, a version, a date, a summary and a draft status', function () {
  assert.deepStrictEqual(L.SLUGS, SLUGS);
  assert.deepStrictEqual(L.list().map(function (x) { return x.slug; }), SLUGS);
  L.list().forEach(function (x) {
    assert.ok(x.title && x.short && x.summary.length > 80, x.slug + ': title, short name and summary');
    assert.strictEqual(x.version, VERSION, x.slug + ': version'); assert.strictEqual(L.version(x.slug), VERSION);
    assert.strictEqual(x.updated, '2026-11-18', x.slug + ': updated');
    assert.strictEqual(x.status, 'draft for a lawyer\'s review; written by a non-lawyer; not legal advice', x.slug + ': status');
    assert.ok(/\[\[OWNER: effective date/.test(x.effective), x.slug + ': the effective date is for the owner');
    assert.ok(/^[0-9a-f]{64}$/.test(x.hash) && L.hash(x.slug) === x.hash, x.slug + ': hash'); assert.strictEqual(x.path, '/legal/' + x.slug);
  });
});
ok('each is drawn as a whole page with the draft banner, its title, its summary, a way to skip', function () {
  SLUGS.forEach(function (s) {
    const h = L.page(s);
    assert.ok(typeof h === 'string' && h.indexOf('<!doctype html>') === 0 && /<html lang="en">/.test(h) && /<\/html>\s*$/.test(h), s + ': a whole document');
    assert.ok(h.indexOf('Draft: under legal review') > 0 && h.indexOf(L.BANNER) > 0, s + ': the draft banner');
    assert.strictEqual((h.match(/<h1[ >]/g) || []).length, 1, s + ': one h1'); assert.ok(h.indexOf('<h1>' + L.esc(docs[s].meta.title) + '</h1>') > 0, s + ': its title');
    assert.ok(h.indexOf('In plain words') > 0 && h.indexOf('It does not replace the text below') > 0, s + ': the summary, marked as not replacing the text');
    assert.ok(h.indexOf('class="skip" href="#text"') > 0 && h.indexOf(' id="text">') > 0 && (h.match(/<main>/g) || []).length === 1, s + ': skip link, one main');
    assert.ok(h.indexOf('Version <b>' + VERSION + '</b>') > 0 && h.indexOf('Last updated <b>November 18, 2026</b>') > 0, s + ': version and date shown');
    assert.ok(h.indexOf('aria-current="page"') > 0, s + ': says which page this is');
    assert.ok(!/draft for a lawyer|non-lawyer|not legal advice/i.test(h), s + ': the note to the owner is not on the public page');
  });
});
ok('an unknown slug is null', function () {
  ['nope', '../legal', 'terms.md', 'pricing', '', undefined, '__proto__'].forEach(function (s) {
    assert.strictEqual(L.page(s), null, 'page ' + s); assert.strictEqual(L.doc(s), null, 'doc ' + s); assert.strictEqual(L.version(s), null); assert.strictEqual(L.ready(s), false); assert.deepStrictEqual(L.placeholders(s), []);
  });
});
ok('the banner is on every page, the index and the missing page; only LEGAL_DRAFT_BANNER=off takes it away', function () {
  const was = process.env.LEGAL_DRAFT_BANNER;
  ['', 'on', 'yes', '1', 'anything'].forEach(function (v) {
    process.env.LEGAL_DRAFT_BANNER = v; assert.strictEqual(L.bannerOn(), true, JSON.stringify(v));
    everyHtml().forEach(function (p) { assert.ok(p[1].indexOf('Draft: under legal review') > 0, p[0] + ' with ' + JSON.stringify(v)); });
  });
  delete process.env.LEGAL_DRAFT_BANNER; assert.strictEqual(L.bannerOn(), true);
  process.env.LEGAL_DRAFT_BANNER = 'off'; assert.strictEqual(L.bannerOn(), false);
  everyHtml().forEach(function (p) { assert.ok(p[1].indexOf('Draft: under legal review') < 0, p[0] + ': off'); });
  if (was === undefined) delete process.env.LEGAL_DRAFT_BANNER; else process.env.LEGAL_DRAFT_BANNER = was;
});
ok('the style is the one the policy names, in the colours asked for, and nothing outside is loaded', function () {
  const crypto = require('crypto'), m = /<style>([\s\S]*?)<\/style>/.exec(L.page('terms'));
  assert.ok(m && L.CSP.indexOf("style-src 'sha256-" + crypto.createHash('sha256').update(m[1]).digest('base64') + "'") > 0 && L.CSP.indexOf("default-src 'none'") === 0, 'the hash in the policy is the hash of the style on the page');
  // the brand's year-round colours, from the config: night head, cream page, ink words, berry links, gold rules
  const B = L.CFG.brand, want = { ink: '#2a1a2e', berry: '#c2185b', coral: '#ff6b5e', gold: '#f2b632', cream: '#fff8ee', night: '#1d1230' };
  Object.keys(want).forEach(function (k) { assert.ok(/^#[0-9a-f]{6}$/.test(B[k]), 'brand.' + k + ' is a plain hex colour'); if (REPO && REPO.brand && typeof REPO.brand[k] === 'string') assert.strictEqual(B[k], REPO.brand[k].toLowerCase(), 'brand.' + k + ' is the config\'s'); else assert.strictEqual(B[k], want[k]); });
  ['--ink:' + B.ink, '--night:' + B.night, '--cream:' + B.cream, '--berry:' + B.berry, '--gold:' + B.gold].forEach(function (c) { assert.ok(L.CSS.indexOf(c + ';') > 0, 'colour ' + c); });
  ['body{margin:0;background:var(--cream);color:var(--ink)', 'a{color:var(--berry)', 'header.top{background:var(--night)', 'border-bottom:4px solid var(--gold)', 'footer{background:var(--night)'].forEach(function (r) { assert.ok(L.CSS.indexOf(r) >= 0, 'rule ' + r); });
  assert.ok(L.page('terms').indexOf('<meta name="theme-color" content="' + B.night + '">') > 0);
  ['#0f3d2e', '#fbf8f1', '#a3122a', '#c9a14a', '--green', '--snow', '--cran'].forEach(function (c) { assert.ok(L.CSS.indexOf(c) < 0, 'the old colour ' + c + ' is gone'); });
  // contrast (WCAG AA, 4.5 to 1 for words): every pair of words and ground the style uses
  const lum = function (hex) { const v = [1, 3, 5].map(function (i) { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const ratio = function (a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const v = function (name) { const m = new RegExp('--' + name + ':(#[0-9a-fA-F]{6})').exec(L.CSS); assert.ok(m, 'the style has --' + name); return m[1]; };
  [['ink', 'cream'], ['berry', 'cream'], ['night', 'cream'], ['soft', 'cream'], ['oldgold', 'cream'], ['oldgold', 'frost'], ['ink', 'frost'], ['gold', 'night'], ['pale', 'night']].forEach(function (p) { const r = ratio(v(p[0]), v(p[1])); assert.ok(r >= 4.5, p[0] + ' on ' + p[1] + ' is ' + r.toFixed(2) + ' to 1'); });
  [['berry', '#ffffff'], ['ink', '#ffffff'], ['night', '#ffffff'], ['oldgold', '#ffffff'], ['soft', '#ffffff']].forEach(function (p) { const r = ratio(v(p[0]), p[1]); assert.ok(r >= 4.5, p[0] + ' with white is ' + r.toFixed(2) + ' to 1'); });
  assert.ok(ratio('#4a3500', '#fff1b8') >= 4.5, 'the draft banner and the owner\'s marks');
  assert.ok(!/color:var\(--(gold|coral)\)/.test(L.CSS.replace(/\.kick\{[^}]*\}/, '')), 'gold and coral are never the colour of words, but for the small heading on the night head');
  assert.ok(!/url\(|@import|@font-face/.test(L.CSS), 'no outside resource in the style');
});

console.log('\nThe name and the address');
ok('no {{ token is left in any page, and the name is the config\'s', function () {
  const C = L.CFG;
  ['name', 'domain', 'site', 'support', 'company'].forEach(function (k) { assert.ok(typeof C[k] === 'string' && C[k], 'config ' + k); });
  assert.strictEqual(C.support, SUPPORT); assert.strictEqual(C.company, 'Glyphh AI LLC');
  everyHtml().forEach(function (p) {
    assert.ok(p[1].indexOf('{{') < 0, p[0] + ': a token was left'); assert.ok(p[1].indexOf(L.esc(C.name)) > 0, p[0] + ': the name');
    assert.ok(p[1].indexOf('<link rel="canonical" href="' + C.site + '/legal') > 0, p[0] + ': the canonical address is the config\'s site');
  });
  SLUGS.forEach(function (s) {
    assert.ok(bodyOf(s).indexOf('{{') < 0 && docs[s].meta.title.indexOf('{{') < 0, s + ': a token in what was read');
    assert.ok(raw(s).indexOf('{{name}}') > 0, s + ': the file names the product only by its token');
    assert.ok(raw(s).indexOf(C.name) < 0 && raw(s).indexOf(C.domain) < 0, s + ': the name or the domain is typed in the file');
    (raw(s).match(/\{\{[^}]*\}\}/g) || []).forEach(function (t) { assert.ok(/^\{\{(name|domain|site|packs|takes|photos|freeDrafts|photoSize)\}\}$/.test(t), s + ': a token legal.js does not know: ' + t); });
    assert.ok(!/\d\s?(MB|KB|GB)\b/.test(raw(s)), s + ': a file size is typed in the file (it comes from the config, through {{photoSize}})');
    assert.ok(!/\$\s?\d/.test(raw(s)), s + ': a price is typed in the file (prices come from the config, through {{packs}})');
  });
  assert.strictEqual(L.fill('{{name}} at {{domain}}, {{site}}'), C.name + ' at ' + C.domain + ', ' + C.site);
  assert.strictEqual(L.fill('{{takes}} {{photos}}'), [C.limits.takesPerCarol, C.limits.photosPerCarol].join(' '));
});
ok('the brand is the config\'s: Send a Carol at sendacarol.com, read from ../config.js', function () {
  assert.ok(REPO, '../config.js is there and loads');
  ['name', 'domain', 'site', 'support', 'company', 'finalSale'].forEach(function (k) { assert.strictEqual(L.CFG[k], String(REPO[k]).replace(/\/+$/, ''), 'legal.js reads ' + k + ' from the config'); });
  assert.strictEqual(L.CFG.packs, REPO.packs, 'the packs are the config\'s own'); assert.strictEqual(L.CFG.limits, REPO.limits, 'the limits are the config\'s own');
  assert.strictEqual(L.CFG.name, 'Send a ' + 'Carol'); assert.strictEqual(L.CFG.domain, 'sendacarol' + '.com');
  everyHtml().forEach(function (p) { assert.ok(!/carol ?time/i.test(p[1]), p[0] + ': the working name is still on the page'); });
  fs.readdirSync(__dirname).forEach(function (f) { if (f !== 'test.cjs' && fs.statSync(path.join(__dirname, f)).isFile()) assert.ok(!/carol ?time/i.test(fs.readFileSync(path.join(__dirname, f), 'utf8')), f + ': the working name is still in the file'); });
});
ok('the limits on the pages are the config\'s: photos and takes for each carol, and no limit on recipients', function () {
  const lim = L.CFG.limits;
  assert.ok(L.page('terms').indexOf('upload from 1 to ' + lim.photosPerCarol + ' photos') > 0 && L.page('photos').indexOf('made from 1 to ' + lim.photosPerCarol + ' photos') > 0 && L.page('privacy').indexOf('The 1 to ' + lim.photosPerCarol + ' photos') > 0, 'photos');
  assert.ok(L.page('terms').indexOf('email a card to the people you choose') > 0, 'recipients'); SLUGS.forEach(function (s) { assert.ok(!/recipients for each carol|for each carol\)|the limit of \d+ recipients/.test(L.page(s)), s + ': no limit on recipients'); });
  ['terms', 'refunds'].forEach(function (s) { assert.ok(L.page(s).indexOf('Each paid carol includes ' + lim.takesPerCarol + ' takes of the song') > 0, s + ': takes'); });
  assert.deepStrictEqual([lim.takesPerCarol, lim.photosPerCarol], [3, 8]);
  // the largest photo and the free drafts
  const size = lim.photoBytes / (1024 * 1024) + ' MB'; assert.strictEqual(L.fill('{{photoSize}}'), size); assert.strictEqual(size, '25 MB'); assert.strictEqual(L.fill('{{freeDrafts}}'), String(lim.freeDrafts));
  ['privacy', 'photos'].forEach(function (s) { assert.ok(L.page(s).indexOf('(up to ' + size + ')') > 0, s + ': the largest photo'); });
  ['terms', 'refunds'].forEach(function (s) { assert.ok(L.page(s).indexOf('Before its first purchase, an account may draft ' + lim.freeDrafts + ' carols with the agent') > 0, s + ': the free drafts'); });
  const b0 = lim.photoBytes, f0 = lim.freeDrafts; lim.photoBytes = 10 * 1024 * 1024; lim.freeDrafts = 7;
  try { assert.ok(L.page('photos').indexOf('(up to 10 MB)') > 0 && L.page('terms').indexOf('may draft 7 carols') > 0, 'changed in the config, changed on the page'); } finally { lim.photoBytes = b0; lim.freeDrafts = f0; }
  const was = lim.takesPerCarol; lim.takesPerCarol = 5;
  try { assert.ok(L.page('refunds').indexOf('Each paid carol includes 5 takes of the song') > 0, 'a limit changed in the config changes the page'); } finally { lim.takesPerCarol = was; }
  assert.ok(L.page('refunds').indexOf('Each paid carol includes ' + was + ' takes of the song') > 0);
});
ok('the foot: whose it is, the support address, all five pages and the way back', function () {
  everyHtml().forEach(function (p) {
    const f = p[1].slice(p[1].indexOf('<footer>'));
    assert.ok(f.indexOf(L.esc(L.CFG.name) + ' is a game by Glyphh AI LLC.') > 0, p[0] + ': whose it is');
    assert.ok(f.indexOf('<a href="mailto:' + SUPPORT + '">' + SUPPORT + '</a>') > 0, p[0] + ': support');
    SLUGS.forEach(function (o) { assert.ok(f.indexOf('href="/legal/' + o + '"') > 0, p[0] + ' foot links to ' + o); });
    assert.ok(f.indexOf('<a href="/">Back to ' + L.esc(L.CFG.name) + '</a>') > 0, p[0] + ': the way back');
  });
});

console.log('\nThe owner\'s rulings');
ok('the exact sentences are in the refund policy and in the terms', function () {
  assert.strictEqual(L.CFG.finalSale, 'One-time purchase. Not refundable.');
  ['refunds', 'terms'].forEach(function (s) {
    ['One-time purchase. Not refundable.', 'except where the law gives you a right we cannot exclude', 'One-time, not recurring. Nothing renews by itself. We do not keep a card on file to charge later.', 'Carol credits do not expire.'].forEach(function (t) {
      says(s, t); assert.ok(L.page(s).indexOf(t) > 0, s + ': on the page: ' + t);
    });
    says(s, 'All sales are final'); says(s, 'A credit is spent when the song is generated for a carol');
    says(s, 'riting and rewriting the words with the agent, and previewing'); says(s, 'within fair-use daily limits');
  });
  says('terms', 'A credit is spent when the song is generated for a carol, not before.');
  says('refunds', 'This is a credit restoration. It is never a money refund.');
});
ok('the prices on the refund policy and the terms are the config\'s, each followed by the final-sale sentence', function () {
  const packs = L.CFG.packs, row = function (p) { return '<th scope="row">' + L.esc(p.label) + '</th><td data-h="Price">' + L.money(p.cents) + '</td><td data-h="The rule">One-time purchase. Not refundable.</td>'; };
  assert.deepStrictEqual(packs.map(function (p) { return [p.credits, L.money(p.cents)]; }), [[1, '$2.99'], [5, '$9.99'], [10, '$17.99']]);
  ['refunds', 'terms'].forEach(function (s) {
    const h = L.page(s);
    packs.forEach(function (p) { assert.ok(h.indexOf(row(p)) > 0, s + ': the pack ' + p.label + ' at ' + L.money(p.cents) + ', with the sentence after its price'); });
    ['$2.99', '$9.99', '$17.99'].forEach(function (t) { assert.ok(h.indexOf(t) > 0, s + ': ' + t); });
    assert.ok(raw(s).indexOf('{{packs}}') > 0, s + ': the table is the token, not typed');
  });
  assert.ok(docs.refunds.ids.indexOf('pricing') >= 0, 'the refund policy has a pricing section');
  // a price changed in the config is the price on the page (and nothing else on the page changes it back)
  const p0 = packs[0], was = p0.cents; p0.cents = 599;
  try {
    ['refunds', 'terms'].forEach(function (s) { const h = L.page(s); assert.ok(h.indexOf('<td data-h="Price">$5.99</td>') > 0 && h.indexOf('$2.99') < 0, s + ': the page follows the config'); });
  } finally { p0.cents = was; }
  assert.ok(L.page('refunds').indexOf('<td data-h="Price">$2.99</td>') > 0, 'and back');
  // every amount of money on any page is a pack's price
  const prices = packs.map(function (p) { return L.money(p.cents); });
  everyHtml().forEach(function (p) { (p[1].replace(/<style>[\s\S]*?<\/style>/, '').match(/\$\d+(?:\.\d+)?/g) || []).forEach(function (t) { assert.ok(prices.indexOf(t) >= 0, p[0] + ': an amount that is no pack\'s price: ' + t); }); });
});
ok('there is no recurring plan: no page says so, and nothing is left of one', function () {
  // (the one sentence that says nothing recurs is the owner's own, and is taken out before looking)
  const words = new RegExp(['subscri' + 'ption', 'subscri' + 'be', 'ren' + 'ews', 'ren' + 'ewal', 'mon' + 'thly', 'allow' + 'ance', 'roll' + ' ?over', 'customer' + ' portal', 'cancel' + ' (any|at any) time', 'partial-' + 'month'].join('|'), 'i');
  const strip = function (t) { return t.replace(/Nothing renews by itself\./g, ''); };
  everyHtml().forEach(function (p) { const m = words.exec(strip(p[1])); assert.ok(!m, p[0] + ': the page says "' + (m && m[0]) + '"'); });
  SLUGS.forEach(function (s) { const m = words.exec(strip(raw(s))); assert.ok(!m, s + '.md says "' + (m && m[0]) + '"'); });
  const m = words.exec(strip(fs.readFileSync(path.join(__dirname, 'legal.js'), 'utf8'))); assert.ok(!m, 'legal.js says "' + (m && m[0]) + '"');
  L.SLUGS.forEach(function (s) { L.placeholders(s).forEach(function (p) { assert.ok(!/rollover|expire|price|extra takes/i.test(p), s + ': a blank the owner has already answered: ' + p); }); });
  says('terms', '[[OWNER: confirm that unused carol credits end when an account is closed or deleted]]');
});
ok('it is for any occasion: nothing reads as Christmas only', function () {
  SLUGS.forEach(function (s) {
    raw(s).split('\n').forEach(function (line) { if (/christmas|xmas|santa|festive|yuletide|\bnoel\b/i.test(line)) assert.ok(/Christmas, a birthday, love, a thank you, congratulations and more/.test(line), s + ': a line that assumes Christmas: ' + line.slice(0, 120)); });
  });
  says('terms', 'singing cards for any occasion'); says('acceptable-use', 'singing cards for any occasion');
  ['terms', 'privacy', 'acceptable-use', 'photos'].forEach(function (s) { says(s, 'our word for the song, whatever the occasion'); });
});
ok('no file in legal/ promises money back', function () {
  const banned = ['refunded in' + ' full', 'will be' + ' refunded', 'full' + ' refund'];
  fs.readdirSync(__dirname).forEach(function (f) {
    if (!fs.statSync(path.join(__dirname, f)).isFile()) return;
    const t = fs.readFileSync(path.join(__dirname, f), 'utf8').toLowerCase().replace(/\s+/g, ' ');
    banned.forEach(function (b) { assert.ok(t.indexOf(b) < 0, f + ' says "' + b + '"'); });
  });
  SLUGS.forEach(function (s) { [/we (may|will|can|shall) refund/i, /money[- ]back guarantee/i, /pro[- ]?rated? refund/i].forEach(function (re) { assert.ok(!re.test(bodyOf(s)), s + ': ' + re); }); });
});
ok('the only email address anywhere is the support address', function () {
  everyHtml().forEach(function (p) { (p[1].match(EMAIL) || []).forEach(function (a) { assert.strictEqual(a, SUPPORT, p[0] + ': another address: ' + a); }); assert.ok(p[1].indexOf(SUPPORT) > 0, p[0] + ': the support address'); });
  SLUGS.forEach(function (s) { (raw(s).match(EMAIL) || []).forEach(function (a) { assert.strictEqual(a, SUPPORT, s + '.md: another address: ' + a); }); });
  (fs.readFileSync(path.join(__dirname, 'legal.js'), 'utf8').match(EMAIL) || []).forEach(function (a) { assert.strictEqual(a, SUPPORT, 'legal.js: another address: ' + a); });
});
ok('the company is as glyphh.ai states it: Georgetown, Delaware law and courts, 13 to use and 18 to pay, the liability cap', function () {
  says('terms', 'Glyphh AI LLC, of Georgetown, Texas'); says('privacy', 'Glyphh AI LLC, of Georgetown, Texas');
  says('terms', '[[OWNER: the state where Glyphh AI LLC is formed]]'); says('terms', '[[OWNER: mailing address for legal notices]]');
  says('terms', 'governed by the laws of the State of Delaware, without regard to its rules on conflicts of law'); says('terms', 'state or federal courts located in Delaware');
  says('terms', 'If you are under 18, you confirm that a parent or legal guardian has agreed to these Terms for you'); says('terms', 'You must be at least 18 for anything that involves money');
  says('privacy', 'and 18 for anything that involves money');
  says('terms', 'limited to the amount you paid us in the twelve months before the claim arose');
  SLUGS.forEach(function (s) { assert.ok(!/arbitrat|class action|jury/i.test(bodyOf(s)), s + ': an arbitration clause or a waiver the company\'s own terms do not have'); });
});
ok('what each page must say', function () {
  says('terms', '[[OWNER: confirm the commercial-use scope under the music provider plan]]'); says('terms', 'We do not use your photos to train anything');
  says('terms', 'a film, a television programme, a radio broadcast or a video game'); says('terms', 'Anyone who has the link can watch the card');
  says('privacy', 'Cloudflare R2'); says('privacy', 'Your photos are not sent to it.'); says('privacy', 'Your photos and all email addresses are not sent to it.');
  ['Fly.io', 'Cloudflare', 'Stripe', 'Resend', 'Google', 'Anthropic', 'ElevenLabs'].forEach(function (c) { says('privacy', '| ' + c + ' |'); says('terms', '| ' + c + ' |'); });
  says('privacy', 'No third-party analytics or advertising trackers'); says('privacy', 'We do not sell your personal information'); says('privacy', 'not directed to children under 13');
  says('acceptable-use', 'demean, harass, bully, humiliate or threaten'); says('acceptable-use', 'Never a marketing list'); says('acceptable-use', 'report this card');
  says('photos', 'We do not use your photos to train anything'); says('photos', 'We do not run face recognition'); says('photos', 'parent or legal guardian');
});
ok('no AI model is named, and nothing claims a certification', function () {
  // (the names are put together here so that this file does not hold one either)
  const models = new RegExp(['cla' + 'ude', 'son' + 'net', '\\bop' + 'us\\b', 'hai' + 'ku', '\\bg' + 'pt\\b', 'gem' + 'ini', 'eleven_', '\\bv[0-9]\\b'].join('|'), 'i');
  SLUGS.forEach(function (s) {
    const t = bodyOf(s), m = models.exec(t);
    assert.ok(!m, s + ': a model\'s name: ' + (m && m[0]));
    assert.ok(!/GDPR|CCPA|CPRA|COPPA|PCI|SOC ?2|HIPAA|ISO ?27001|certified|compliant/i.test(t.replace(/\[\[OWNER:[^\]]*\]\]/g, '')), s + ': a claim of compliance');
  });
  const m = models.exec(fs.readFileSync(path.join(__dirname, 'legal.js'), 'utf8')); assert.ok(!m, 'legal.js: a model\'s name: ' + (m && m[0]));
});

console.log('\nPlaceholders for the owner');
const holes = [];
ok('none is dropped: each [[OWNER: ...]] in a file is reported by placeholders(slug) and is on its page, marked', function () {
  SLUGS.forEach(function (s) {
    const inFile = (raw(s).match(/\[\[OWNER:\s*([^\]]*)\]\]/g) || []).map(function (x) { return x.replace(/^\[\[OWNER:\s*/, '').replace(/\]\]$/, '').trim(); }), h = L.page(s), marked = (h.match(/<mark class="owner">/g) || []).length;
    assert.deepStrictEqual(L.placeholders(s).slice().sort(), inFile.map(L.fill).sort(), s + ': every one is reported');
    assert.strictEqual(marked, inFile.length, s + ': every one is on the page (' + marked + ' of ' + inFile.length + ')');
    assert.ok(h.indexOf('[[OWNER') < 0 && h.indexOf(']]') < 0, s + ': one was left as raw text'); assert.strictEqual(L.ready(s), inFile.length === 0);
    assert.strictEqual(L.list().filter(function (x) { return x.slug === s; })[0].placeholders, inFile.length);
    L.placeholders(s).forEach(function (p) { assert.ok(p.length > 8, s + ': an empty placeholder'); assert.ok(h.indexOf(L.esc(p)) > 0, s + ': not shown: ' + p); holes.push({ page: s, text: p }); });
    assert.ok(inFile.length > 0 && L.placeholders(s)[0].indexOf('effective date') === 0, s + ': a draft, with its effective date still to come');
  });
});

console.log('\nEscaping and links');
ok('the renderer escapes everything and passes no HTML through', function () {
  const ctx = function () { return { ids: [], links: [], refused: [], placeholders: [], toc: [], tables: 0 }; };
  const nasty = '## A <script>alert(1)</script> "heading"\n\n<img src=x onerror=alert(1)> & <b>bold</b> \'q\' "dq"\n\n- <li onclick="x()">item\n\n| a<i> | b |\n| --- | --- |\n| <td> | "x" |\n';
  const h = L.markdown(nasty, ctx());
  assert.ok(h.indexOf('&lt;script&gt;alert(1)&lt;/script&gt;') > 0 && h.indexOf('&lt;img src=x onerror=alert(1)&gt;') > 0 && h.indexOf('&#39;q&#39; &quot;dq&quot;') > 0);
  assert.ok(!/<(?!\/?(h[2-4]|p|ul|ol|li|strong|em|a|mark|span|div|table|thead|tbody|tr|th|td)[ >])/.test(h), 'only the renderer\'s own tags: ' + h);
});
ok('a link goes to this site, this page or an email address, and nowhere else', function () {
  ['/legal/terms', '/legal/terms#contact', '/', '#deleting', 'mailto:' + SUPPORT, 'mailto:' + SUPPORT + '?subject=Hello%20there'].forEach(function (h) { assert.ok(L.safeHref(h), 'allowed: ' + h); });
  ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'https://evil.example', 'http://evil.example', '//evil.example', '/\\evil.example', '/legal/"onmouseover="x', '/a b', 'data:text/html,x', 'tel:+15124896516', '', '#', '/legal/terms\n', ' /legal/terms', '/x<y'].forEach(function (h) { assert.ok(!L.safeHref(h), 'refused: ' + JSON.stringify(h)); });
  const c = { ids: [], links: [], refused: [], placeholders: [], toc: [], tables: 0 }, h = L.inline('[click](javascript:alert(1)) [out](https://evil.example/x) [in](/legal/terms) **[b](//x.y)** [q](/a"b)', c);
  assert.strictEqual((h.match(/<a /g) || []).length, 1, h); assert.strictEqual(c.refused.length, 4);
});
ok('every page: no script, no handler, one style block, and every link leads to a page and a heading that exist', function () {
  let n = 0;
  everyHtml().forEach(function (p) {
    const s = p[0], h = p[1];
    assert.ok(!/<script|<iframe|<object|<embed|<form|<img|<link (?!rel="canonical")|javascript:|\son[a-z]+\s*=/i.test(h), s + ': something that runs or loads');
    assert.strictEqual((h.match(/<style>/g) || []).length, 1, s + ': one style block, the page\'s own');
    const ids = h.match(/ id="[^"]+"/g) || [], seen = {}; ids.forEach(function (i) { assert.ok(!seen[i], s + ': id twice ' + i); seen[i] = 1; });
    (h.match(/href="[^"]*"/g) || []).map(function (a) { return a.slice(6, -1).replace(/&amp;/g, '&'); }).forEach(function (v) {
      n++;
      if (v.indexOf('mailto:') === 0) return assert.strictEqual(v, 'mailto:' + SUPPORT, s + ': the only address is the support address');
      if (v.indexOf(L.CFG.site + '/legal') === 0) return;                                   // (the canonical address)
      if (v[0] === '#') return assert.ok(h.indexOf(' id="' + v.slice(1) + '"') > 0, s + ': no place ' + v + ' on the page');
      if (v === '/' || v === '/legal') return;
      const m = /^\/legal\/([a-z-]+)(?:#(.+))?$/.exec(v);
      assert.ok(m && docs[m[1]], s + ': an address with no page: ' + v);
      if (m[2]) assert.ok(docs[m[1]].ids.indexOf(m[2]) >= 0, s + ': ' + v + ' has no such heading. Headings there: ' + docs[m[1]].ids.join(', '));
    });
  });
  SLUGS.forEach(function (s) {
    assert.deepStrictEqual(docs[s].refused, [], s + ': a link the page may not make');
    assert.ok(!/https?:\/\//.test(raw(s)), s + ': an outside address typed in the file');
    let last = 1; (docs[s].html.match(/<h[2-4]/g) || []).forEach(function (t) { const k = +t[2]; assert.ok(k <= last + 1, s + ': a heading skips a level'); last = k; });
  });
  ['privacy', 'refunds', 'acceptable-use', 'photos'].forEach(function (o) { assert.ok(docs.terms.links.indexOf('/legal/' + o) >= 0, 'the terms name ' + o); });
  assert.ok(n > 80, 'links were looked at: ' + n);
});
ok('no emoji, and no character a keyboard does not have, in any file here', function () {
  fs.readdirSync(__dirname).forEach(function (f) {
    if (!fs.statSync(path.join(__dirname, f)).isFile()) return;
    const bad = fs.readFileSync(path.join(__dirname, f), 'utf8').match(/[^\x09\x0a\x20-\x7e·]/g);
    assert.ok(!bad, f + ': ' + (bad ? bad.slice(0, 5).map(function (c) { return 'U+' + c.codePointAt(0).toString(16); }).join(' ') : ''));
  });
});

console.log('\nPlaceholders the owner or a lawyer must fill (' + holes.length + ')');
holes.forEach(function (h) { console.log('  [' + h.page + '] ' + h.text); });
console.log('\n' + passed + ' passed, ' + failed + ' failed, ' + holes.length + ' placeholders\n');
if (failed) process.exit(1);
console.log('OK legal');
