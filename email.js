'use strict';
// email.js : the two emails the product sends, through Resend's HTTP API.
//   1. the sign-in link: a random token (only its hash is kept), good for 15 minutes and for one sign-in. Opening the
//      link shows a button; pressing it (a POST) spends the token, so a mail scanner that follows links spends nothing.
//   2. a carol, sent by its maker to people they know: the poster as a picture linked to the card's page, the title
//      and the sign-off, and a "don't email me again" link that is honoured for ever (the suppress table holds only
//      a hash of the address). Never a marketing list: nothing is sent that a maker did not ask for, to that person.
const crypto = require('crypto');
const CFG = require('./config.js');

module.exports = function (d) {   // d = { db, ready, tooMany, json, body, page, enter, accountOf, env }
  const db = d.db, env = d.env, SITE = CFG.site, MINUTES = 15, LIVE = 3;
  const seam = { fetch: null };
  const hash = function (s) { return crypto.createHash('sha256').update(String(s)).digest('base64url'); };
  const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const on = function () { return !!(env.SESSION_SECRET && env.RESEND_API_KEY); };
  const from = function () { return env.EMAIL_FROM || CFG.emailFrom; };
  function addressOf(v) { const s = String(v == null ? '' : v).trim().toLowerCase();
    return s.length <= 120 && /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(s) && s.indexOf('..') < 0 ? s : ''; }
  function backOf(v) {
    const s = String(v == null ? '' : v);
    if (!s || s.length > 400 || s[0] !== '/' || /^\/[\/\\]/.test(s) || /[\u0000- \\]/.test(s)) return '/make';
    let u; try { u = new URL(s, SITE); } catch (e) { return '/make'; }
    const p = u.pathname;
    if (u.origin !== new URL(SITE).origin || !(p === '/' || p === '/make' || p === '/admin' || p === '/oauth/authorize')) return '/make';   // (/oauth/authorize: signing in to the connector, oauth.js)
    return p + u.search;
  }
  async function post(msg) {
    const r = await (seam.fetch || fetch)('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000), body: JSON.stringify(msg) });
    if (!r.ok) throw new Error('Resend answered ' + r.status);   // the status only: what was sent may hold a link
    return r.json().catch(function () { return {}; });
  }
  // the shell both emails share: the header picture is the lockup drawn by brand.js (/assets/email-header.png)
  const B = CFG.brand;
  function shell(pre, inner, foot) {
    return '<!doctype html><html><body style="margin:0;background:' + B.cream + ';font-family:Georgia,\'Times New Roman\',serif;color:' + B.ink + '">' +
      '<div style="display:none;max-height:0;overflow:hidden">' + esc(pre) + '</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + B.cream + '"><tr><td align="center" style="padding:24px 12px">' +
      '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #f0e2cf">' +
      '<tr><td style="background:' + B.night + '" align="center"><a href="' + SITE + '"><img src="' + SITE + '/assets/email-header.png" width="560" alt="' + esc(CFG.name) + '" style="display:block;width:100%;max-width:560px;height:auto;border:0"></a></td></tr>' +
      '<tr><td style="padding:28px 28px 8px">' + inner + '</td></tr>' +
      '<tr><td style="padding:16px 28px 28px;font:13px/1.5 Arial,Helvetica,sans-serif;color:#6b5a6e">' + foot + '</td></tr></table>' +
      '<p style="font:12px/1.5 Arial,Helvetica,sans-serif;color:#8a7a8c;margin:14px 0 0">' + esc(CFG.name) + ' &middot; ' + esc(CFG.tagline) + ' &middot; <a href="mailto:' + CFG.support + '" style="color:#8a7a8c">' + CFG.support + '</a></p>' +
      '</td></tr></table></body></html>';
  }
  const button = function (href, label) { return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:' + B.berry + ';border-radius:999px"><a href="' + esc(href) + '" style="display:inline-block;padding:14px 30px;font:bold 16px Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none">' + esc(label) + '</a></td></tr></table>'; };

  // ---------- 1. the sign-in link ----------
  function linkMail(link) {
    return { subject: 'Your sign-in link for ' + CFG.name,
      html: shell('Your sign-in link. Good for ' + MINUTES + ' minutes.', '<h1 style="font:28px Georgia,serif;margin:0 0 8px">Sign in</h1><p style="font:16px/1.5 Georgia,serif;margin:0">Press the button to sign in to ' + esc(CFG.name) + ' and get back to your carol.</p>' + button(link, 'Sign in') +
        '<p style="font:14px/1.5 Arial,sans-serif;color:#6b5a6e;margin:0">Good for ' + MINUTES + ' minutes, and for one sign-in. If the button does nothing, paste this into your browser:<br><span style="word-break:break-all">' + esc(link) + '</span></p>',
        'If you did not ask for this, ignore it: nobody gets in without the link, and nothing happens until its button is pressed.'),
      text: CFG.name + '\n\nOpen this to sign in:\n\n' + link + '\n\nGood for ' + MINUTES + ' minutes, and for one sign-in.\n\nIf you did not ask for this, ignore it.\n\n' + SITE + '\n' + CFG.support + '\n' };
  }
  async function ask(req, res) {
    if (!on()) return d.json(res, { error: 'Email sign-in is not set up.' }, 503);
    if (d.tooMany(req, 'link', 20, 3600000)) return d.json(res, { error: 'Too many links asked for. Try again in an hour.' }, 429);
    const b = await d.body(req), to = addressOf(b.email), now = Date.now();
    if (!to) return d.json(res, { error: 'That does not look like an email address.' });
    await db.run('DELETE FROM email_links WHERE expires < ?', [now - 36e5]);
    const live = (await db.get('SELECT COUNT(*) AS n FROM email_links WHERE email = ? AND used = 0 AND expires > ?', [to, now])).n;
    if (live >= LIVE) return d.json(res, { error: 'A link went to that address a moment ago. Look for it (the spam folder too), or try again in a few minutes.' }, 429);
    if (d.tooMany(req, 'linkto', 5, 3600000, to)) return d.json(res, { error: 'Too many links were asked for that address. Try again in an hour.' }, 429);
    const token = crypto.randomBytes(32).toString('base64url');
    await db.run('INSERT INTO email_links (hash, email, back, expires, used) VALUES (?, ?, ?, ?, 0)', [hash(token), to, backOf(b.back), now + MINUTES * 6e4]);
    try { const m = linkMail(SITE + '/auth/link?token=' + token); await post({ from: from(), to: [to], subject: m.subject, html: m.html, text: m.text }); }
    catch (e) { console.error('email:', e.message); await db.run('DELETE FROM email_links WHERE hash = ?', [hash(token)]); return d.json(res, { error: 'The email could not be sent. Try again in a minute.' }, 502); }
    return d.json(res, { ok: true });   // the same for an address with an account and one without
  }
  async function handle(req, res, url) {
    await d.ready;
    const out = function (code, title, inner) { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' }); res.end(d.page(title, inner)); };
    const sorry = function (why) { return out(400, 'That link is spent', '<h1>That link is spent</h1><p>' + esc(why || 'A sign-in link works once, for ' + MINUTES + ' minutes.') + '</p><p><a class="btn" href="/make">Get a new link</a></p>'); };
    if (req.method !== 'GET' && req.method !== 'POST') { res.writeHead(405, { Allow: 'GET, POST' }); res.end(); return; }
    if (!on()) return out(503, 'Not set up', '<h1>Email sign-in is not set up</h1>');
    const now = Date.now();
    if (req.method === 'GET') {
      const token = url.searchParams.get('token') || '', row = token && await db.get('SELECT email, used, expires FROM email_links WHERE hash = ?', [hash(token)]);
      if (!row || row.used || Number(row.expires) <= now) return sorry();
      return out(200, 'Sign in', '<h1>Sign in</h1><p>Sign in to ' + esc(CFG.name) + ' as <b>' + esc(row.email) + '</b></p><form method="post" action="/auth/link"><input type="hidden" name="token" value="' + esc(token) + '"><button class="btn">Sign in</button></form>');
    }
    if (d.tooMany(req, 'linkuse', 40, 600000)) return out(429, 'Slow down', '<h1>Too many tries</h1><p>Wait a few minutes.</p>');
    const b = await d.body(req, true), h = hash(b.token || '');
    if (req.headers['sec-fetch-site'] === 'cross-site') return sorry('That did not come from this page. Open the link in your email again.');
    // spent and read in one statement, so that two presses at once cannot both get in
    const row = b.token ? await db.get('UPDATE email_links SET used = ? WHERE hash = ? AND used = 0 AND expires > ? RETURNING email, back', [now, h, now]) : null;
    if (!row) return sorry();
    await d.enter(req, res, row.email);
    res.writeHead(303, { Location: backOf(row.back), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); res.end();
  }

  // ---------- 2. a carol, to someone its maker knows ----------
  const stopKey = function (to) { return crypto.createHmac('sha256', env.SESSION_SECRET || 'x').update('stop ' + to).digest('base64url').slice(0, 32); };
  const stopLink = function (to) { return SITE + '/stop?e=' + Buffer.from(to).toString('base64url') + '&k=' + stopKey(to); };
  const stopped = async function (to) { return !!await db.get('SELECT 1 AS x FROM suppress WHERE hash = ?', [hash(to)]); };
  // c = { slug, title, greeting, signoff, from, to }, note = the maker's few words
  function carolMail(c, to, note) {
    const link = SITE + '/' + c.slug, stop = stopLink(to), who = c.from || 'Someone';
    return { subject: (c.from ? c.from + ' sent you a carol' : 'A carol for you') + ': ' + c.title,
      html: shell(who + ' made you a singing card. Tap to open it.',
        '<p style="font:15px Arial,sans-serif;color:#6b5a6e;margin:0 0 6px">' + esc(who) + ' made you a singing card</p><h1 style="font:30px/1.2 Georgia,serif;margin:0 0 14px">' + esc(c.title) + '</h1>' +
        (note ? '<p style="font:italic 17px/1.5 Georgia,serif;margin:0 0 16px;padding:12px 16px;background:' + B.cream + ';border-radius:12px">' + esc(note) + '</p>' : '') +
        '<a href="' + link + '"><img src="' + link + '/poster.jpg" width="504" alt="' + esc(c.title) + ': tap to play" style="display:block;width:100%;max-width:504px;height:auto;border:0;border-radius:14px"></a>' +
        button(link, 'Open your card') + (c.signoff ? '<p style="font:18px/1.4 Georgia,serif;margin:0">' + esc(c.signoff) + '</p>' : ''),
        'This was sent because ' + esc(who) + ' asked ' + esc(CFG.name) + ' to send it to you. It is not a mailing list. <a href="' + stop + '" style="color:#6b5a6e">Don\'t email me again</a>.'),
      text: who + ' made you a singing card: ' + c.title + '\n\n' + (note ? note + '\n\n' : '') + 'Open it: ' + link + '\n\n' + (c.signoff ? c.signoff + '\n\n' : '') + 'This was sent because ' + who + ' asked ' + CFG.name + ' to send it to you. It is not a mailing list.\nDon\'t email me again: ' + stop + '\n',
      headers: { 'List-Unsubscribe': '<' + stop + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } };
  }
  // sendCarol(c, [addresses], note) -> [{ to, state: 'sent'|'stopped'|'failed' }]
  async function sendCarol(c, list, note) {
    const out = [];
    for (const to of list) {
      if (await stopped(to)) { out.push({ to: to, state: 'stopped' }); continue; }
      const m = carolMail(c, to, note);
      try { const r = await post({ from: from(), to: [to], subject: m.subject, html: m.html, text: m.text, headers: m.headers }); out.push({ to: to, state: 'sent', id: r && typeof r.id === 'string' ? r.id : '' }); }
      catch (e) { console.error('email:', e.message); out.push({ to: to, state: 'failed' }); }
    }
    return out;
  }
  // ---------- 3. "your carol is ready", to its maker, when it was finished with nobody watching ----------
  function readyMail(c) {
    const link = SITE + '/make?card=' + encodeURIComponent(c.id), title = c.title || 'Your carol';
    return { subject: 'Your carol is ready: ' + title,
      html: shell('The song is sung and the video is made. Come and hear it.', '<p style="font:15px Arial,sans-serif;color:#6b5a6e;margin:0 0 6px">It is ready</p><h1 style="font:30px/1.2 Georgia,serif;margin:0 0 14px">' + esc(title) + '</h1><p style="font:16px/1.5 Georgia,serif;margin:0">The song is sung and the video is made' + (c.to ? ' for ' + esc(c.to) : '') + '. Come and hear it, then send it.</p>' + button(link, 'Hear your carol'),
        'You are getting this because you asked ' + esc(CFG.name) + ' to make this carol and were not on the page when it finished.'),
      text: 'Your carol is ready: ' + title + '\n\nThe song is sung and the video is made' + (c.to ? ' for ' + c.to : '') + '. Hear it here:\n\n' + link + '\n\n' + SITE + '\n' + CFG.support + '\n' };
  }
  async function sendReady(c, to) {
    to = addressOf(to); if (!to || await stopped(to)) return false;
    const m = readyMail(c);
    try { await post({ from: from(), to: [to], subject: m.subject, html: m.html, text: m.text }); return true; } catch (e) { console.error('email:', e.message); return false; }
  }
  // /stop : a GET shows one button (a scanner that follows links stops nothing), a POST stops every future email
  async function stop(req, res, url) {
    await d.ready;
    const out = function (code, title, inner) { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer' }); res.end(d.page(title, inner)); };
    let to = ''; try { to = addressOf(Buffer.from(url.searchParams.get('e') || '', 'base64url').toString()); } catch (e) { to = ''; }
    const k = Buffer.from(String(url.searchParams.get('k') || '')), want = Buffer.from(to ? stopKey(to) : 'x');
    if (!to || k.length !== want.length || !crypto.timingSafeEqual(k, want)) return out(400, 'That link is not right', '<h1>That link is not right</h1><p>Write to <a href="mailto:' + CFG.support + '">' + CFG.support + '</a> and we will stop the emails by hand.</p>');
    if (req.method === 'POST') {
      await db.run('INSERT INTO suppress (hash, at) VALUES (?, ?) ON CONFLICT DO NOTHING', [hash(to), Date.now()]);
      return out(200, 'Done', '<h1>Done</h1><p>' + esc(CFG.name) + ' will not email <b>' + esc(to) + '</b> again, whoever asks.</p>');
    }
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET, POST' }); res.end(); return; }
    return out(200, 'Stop these emails', '<h1>Stop these emails?</h1><p>' + esc(CFG.name) + ' only emails a card when its maker asks. Press the button and no card will be emailed to <b>' + esc(to) + '</b> again.</p><form method="post" action="/stop?e=' + esc(url.searchParams.get('e')) + '&k=' + esc(url.searchParams.get('k')) + '"><button class="btn">Don\'t email me again</button></form>');
  }
  return { on: on, ask: ask, handle: handle, stop: stop, sendCarol: sendCarol, sendReady: sendReady, readyMail: readyMail, carolMail: carolMail, linkMail: linkMail, stopLink: stopLink, stopped: stopped, addressOf: addressOf, backOf: backOf, hash: hash, seam: seam };
};
