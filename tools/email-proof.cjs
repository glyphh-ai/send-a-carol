'use strict';
// tools/email-proof.cjs : THE REAL EMAIL. Sends exactly ONE carol email through Resend, to support@glyphh.ai and
// nobody else: the app's own "a carol for you" email (email.js sendCarol, through server.js) for the example card
// for-uncle-dave. A second run refuses (a marker file) unless --again. Then, WITHOUT sending, it asks for a sign-in
// link through handle() with Resend stood in for, and holds both request bodies to the fields Resend documents
// (https://resend.com/docs/api-reference/emails/send-email, read 2026-11-18: from, to (string or string[], at most
// 50), subject required; html, text, headers, cc, bcc, reply_to, attachments, tags, template optional; the answer is { id }).
// Nothing is deployed, so the poster and the card's link in the email point at the site's future address.
// .env: RESEND_API_KEY. The key is never printed.
//   node tools/email-proof.cjs            node tools/email-proof.cjs --again
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert'), { Readable, Writable } = require('stream');
const ROOT = path.join(__dirname, '..'), OUT = '/tmp/carol-time/pass2', MARK = path.join(OUT, 'email-sent.json'), TO = 'support@glyphh.ai', SLUG = 'for-uncle-dave';
fs.mkdirSync(OUT, { recursive: true });
const E = {}; fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').forEach(function (l) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m) E[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
if (!E.RESEND_API_KEY) { console.error('EMAIL PROOF STOPPED: RESEND_API_KEY is not in .env'); process.exit(1); }
['DATABASE_URL', 'DB_SCHEMA', 'R2_ENDPOINT', 'R2_BUCKET', 'STRIPE_SECRET_KEY', 'EMAIL_FROM', 'PUBLIC_URL', 'FLY_APP_NAME'].forEach(function (k) { delete process.env[k]; });
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-email-'));
Object.assign(process.env, { DATA_DIR: dir, SESSION_SECRET: 'email-proof-only', RESEND_API_KEY: E.RESEND_API_KEY, NODE_NO_WARNINGS: '1' });
const S = require('../server.js'), CFG = require('../config.js');
const DOC = { required: ['from', 'to', 'subject'], known: ['from', 'to', 'subject', 'html', 'text', 'headers', 'cc', 'bcc', 'reply_to', 'scheduled_at', 'topic_id', 'attachments', 'tags', 'template', 'react'] };
function holds(b, what) {
  DOC.required.forEach(function (k) { assert(b[k] !== undefined && b[k] !== '', what + ': ' + k + ' is required'); });
  Object.keys(b).forEach(function (k) { assert(DOC.known.indexOf(k) >= 0, what + ': Resend documents no field "' + k + '"'); });
  assert(typeof b.from === 'string' && /^[^<>]+ <[^<>@\s]+@[^<>@\s]+>$/.test(b.from), what + ': from is "Name <address>"');
  assert(Array.isArray(b.to) && b.to.length >= 1 && b.to.length <= 50 && b.to.every(function (x) { return typeof x === 'string'; }), what + ': to is a list of 1 to 50 addresses');
  assert(typeof b.subject === 'string' && typeof b.html === 'string' && typeof b.text === 'string' && b.text.length > 20, what + ': subject, html and text are strings');
  assert(b.headers === undefined || (b.headers && typeof b.headers === 'object' && Object.values(b.headers).every(function (v) { return typeof v === 'string'; })), what + ': headers is an object of strings');
  assert(!('template' in b), what + ': html/text are not combined with a template');
}
function call(method, url, body, headers) {
  return new Promise(function (done) {
    const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []); Object.assign(req, { method: method, url: url, headers: Object.assign({ host: 'proof' }, headers) });
    const parts = [], res = new Writable({ write: function (c, e, next) { parts.push(Buffer.from(c)); next(); } });
    Object.assign(res, { status: 200, heads: {}, headersSent: false, setHeader: function (k, v) { this.heads[k.toLowerCase()] = v; }, writeHead: function (c, h) { this.status = c; this.headersSent = true; return this; } });
    res.on('finish', function () { let j = null; try { j = JSON.parse(Buffer.concat(parts).toString()); } catch (e) { j = null; } done({ status: res.status, json: j }); });
    S.handle(req, res);
  });
}
(async function () {
  await S.ready;
  const ex = JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', 'examples.json'), 'utf8')).examples.find(function (x) { return x.slug === SLUG; });
  if (!ex) throw new Error('there is no example ' + SLUG);
  // (the sign-off is in the proof run's record of the carol, tools/proof.cjs; without that folder: the example's own, or "Love from <from>")
  let carol = {}; try { carol = JSON.parse(fs.readFileSync(path.join(process.env.PROOF_DIR || '/tmp/carol-time/proof', SLUG, 'carol.json'), 'utf8')); } catch (e) { carol = {}; }
  const signoff = (carol.script && carol.script.signoff) || ex.signoff || 'Love from ' + ex.from;
  const c = { slug: ex.slug, title: ex.title, signoff: signoff, from: ex.from }, link = CFG.site + '/' + ex.slug;

  // ---- 1. the sign-in link: rendered and asked for through handle(), Resend stood in for: nothing is sent ----
  const seen = []; S.mail.seam.fetch = async function (url, o) { seen.push({ url: String(url), method: o.method, type: o.headers['Content-Type'], bearer: /^Bearer \S+$/.test(o.headers.Authorization), body: JSON.parse(o.body) }); return { ok: true, status: 200, json: async function () { return { id: 'not-sent' }; } }; };
  const r = await call('POST', '/api/auth/link', { email: 'someone@example.test', back: '/make' }); assert.strictEqual(r.status, 200, JSON.stringify(r.json));
  assert.strictEqual(seen.length, 1); const lb = seen[0].body;
  assert.deepStrictEqual([seen[0].url, seen[0].method, seen[0].type, seen[0].bearer], ['https://api.resend.com/emails', 'POST', 'application/json', true]);
  holds(lb, 'the sign-in email'); assert.deepStrictEqual(lb.to, ['someone@example.test']);
  const tok = /\/auth\/link\?token=([A-Za-z0-9_-]{40,})/.exec(lb.html); assert(tok && lb.text.indexOf('/auth/link?token=' + tok[1]) > 0, 'the link is in the html and in the text');
  assert(lb.subject === 'Your sign-in link for ' + CFG.name && /15 minutes/.test(lb.html) && lb.html.indexOf('/assets/email-header.png') > 0, 'the subject, how long it is good for, the header picture');
  console.log('ok    the sign-in link email (NOT sent): POST https://api.resend.com/emails, Bearer auth, JSON; fields ' + Object.keys(lb).join(', ') + '; from "' + lb.from + '"; subject "' + lb.subject + '"; html ' + lb.html.length + ' chars, text ' + lb.text.length + ' chars; one single-use link in both');
  fs.writeFileSync(path.join(OUT, 'email-signin.html'), lb.html.replace(tok[1], 'TOKEN'));

  // ---- 2. the carol email: its body is held to the same fields before anything is sent ----
  const m = S.mail.carolMail(c, TO, ''), body = { from: CFG.emailFrom, to: [TO], subject: m.subject, html: m.html, text: m.text, headers: m.headers };
  holds(body, 'the carol email');
  const has = { poster: m.html.indexOf('<img src="' + link + '/poster.jpg"') > 0, title: m.html.indexOf(ex.title.replace(/&/g, '&amp;').replace(/'/g, '&#39;')) > 0, signoff: !signoff || m.html.indexOf(signoff.replace(/&/g, '&amp;').replace(/'/g, '&#39;')) > 0, link: m.html.indexOf('href="' + link + '"') > 0 && m.text.indexOf(link) > 0,
    stop: /href="[^"]+\/stop\?e=[A-Za-z0-9_-]+&k=[A-Za-z0-9_-]{32}"[^>]*>Don't email me again</.test(m.html) && /Don't email me again: \S+\/stop\?e=/.test(m.text), unsubscribe: /^<https:\/\/[^>]+\/stop\?e=.+>$/.test(m.headers['List-Unsubscribe']) && m.headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click' };
  Object.keys(has).forEach(function (k) { assert(has[k], 'the carol email has its ' + k); });
  fs.writeFileSync(path.join(OUT, 'email-carol.html'), m.html);
  console.log('ok    the carol email for ' + SLUG + ': subject "' + m.subject + '"; poster image, title, sign-off "' + signoff + '", link ' + link + ', "Don\'t email me again" link and List-Unsubscribe header all present');
  if (fs.existsSync(MARK) && process.argv.indexOf('--again') < 0) { console.log('NOT SENT AGAIN: one was sent already (' + fs.readFileSync(MARK, 'utf8').trim() + '). --again sends another.'); process.exit(0); }

  // ---- 3. send it: ONE email, to support only, through the app's own sendCarol and the real Resend ----
  let sent = 0, status = 0, wire = null;
  S.mail.seam.fetch = async function (url, o) { sent++; wire = JSON.parse(o.body); if (sent > 1 || wire.to.length !== 1 || wire.to[0] !== TO) throw new Error('this tool sends one email, to ' + TO); const a = await fetch(url, o); status = a.status; return a; };
  const out = await S.mail.sendCarol(c, [TO], '');
  holds(wire, 'what went to Resend'); assert.deepStrictEqual(wire, body, 'what went on the wire is the body that was checked');
  const mark = { at: new Date().toISOString(), to: TO, slug: SLUG, subject: m.subject, http: status, state: out[0].state, id: out[0].id || '' };
  if (out[0].state === 'sent') fs.writeFileSync(MARK, JSON.stringify(mark) + '\n');
  console.log((out[0].state === 'sent' ? 'ok    ' : 'FAIL  ') + 'Resend answered HTTP ' + status + ': state ' + out[0].state + ', id ' + (out[0].id || '(none)') + ' (1 request, to ' + TO + ')');
  if (out[0].state === 'sent' && out[0].id) { const g = await fetch('https://api.resend.com/emails/' + out[0].id, { headers: { Authorization: 'Bearer ' + E.RESEND_API_KEY } }), j = await g.json().catch(function () { return {}; }); console.log('      asked Resend about it: HTTP ' + g.status + (g.ok ? ', last_event ' + j.last_event + ', to ' + JSON.stringify(j.to) + ', from ' + j.from : ' (' + (j.name || j.message || 'this key may only send') + ')')); }
  console.log(out[0].state === 'sent' ? 'EMAIL PROOF PASSED' : 'EMAIL PROOF FAILED');
  fs.rmSync(dir, { recursive: true, force: true }); process.exit(out[0].state === 'sent' ? 0 : 1);
})().catch(function (e) { console.error('EMAIL PROOF STOPPED: ' + e.message); fs.rmSync(dir, { recursive: true, force: true }); process.exit(1); });
