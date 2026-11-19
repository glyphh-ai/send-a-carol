'use strict';
// oauth.js : SIGNING IN TO THE CONNECTOR (connect.js). An MCP client (Claude, Claude Code) that /mcp answers 401
// looks up where to sign in (/.well-known/oauth-protected-resource, then /.well-known/oauth-authorization-server),
// introduces itself (/oauth/register), and sends the person to /oauth/authorize. There they sign in with the
// product's own accounts (Google, or the link sent to their email address, which brings them back to this same
// request wherever they open it) and say yes. The client trades the code it gets back for a token (/oauth/token).
// OAuth 2.1: the authorization code grant with PKCE (S256) for public clients, and refresh tokens that work once.
// Only hashes of codes and tokens are kept. What the connector then does, it does as that person and nobody else.
const crypto = require('crypto');

// Its tables (oauth_clients, oauth_codes, oauth_tokens, oauth_asks) are in server.js's schema, with every other table.

module.exports = function (d) {   // d = { db, ready, site, name, env, tooMany, accountOf, page, emailOn }
  const db = d.db, SITE = d.site, NAME = d.name, env = d.env;
  const hash = function (s) { return crypto.createHash('sha256').update(String(s)).digest('base64url'); };
  const rand = function (n) { return crypto.randomBytes(n).toString('base64url'); };
  const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, authorization, mcp-protocol-version', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
  const send = function (res, code, obj, more) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, CORS, more)); res.end(JSON.stringify(obj)); };
  const ACCESS_DAYS = 30, REFRESH_DAYS = 365, ASK_MINUTES = 30;
  const RESOURCE = { resource: SITE + '/mcp', authorization_servers: [SITE], bearer_methods_supported: ['header'], scopes_supported: ['carols'], resource_name: NAME };
  const SERVER = {
    issuer: SITE, authorization_endpoint: SITE + '/oauth/authorize', token_endpoint: SITE + '/oauth/token', registration_endpoint: SITE + '/oauth/register',
    response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'], code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'], scopes_supported: ['carols'],
  };
  // what /mcp answers when nobody is signed in: where to find out how
  const CHALLENGE = 'Bearer resource_metadata="' + SITE + '/.well-known/oauth-protected-resource"';

  // a redirect address a client may use: https anywhere, http on this machine (Claude Code listens on localhost),
  // or an app's own scheme; never a script or a data address
  function okRedirect(u) {
    try { const x = new URL(u); return x.protocol === 'https:' || (x.protocol === 'http:' && (x.hostname === 'localhost' || x.hostname === '127.0.0.1')) || (/^[a-z][a-z0-9+.-]*:$/.test(x.protocol) && ['javascript:', 'data:', 'http:', 'file:', 'vbscript:', 'blob:'].indexOf(x.protocol) < 0); }
    catch (e) { return false; }
  }
  async function clientOf(id) {
    const r = id && await db.get('SELECT * FROM oauth_clients WHERE id = ?', [String(id)]);
    let redirects = []; try { redirects = r ? JSON.parse(r.redirects) : []; } catch (e) { redirects = []; }
    return r ? { id: r.id, name: r.name, redirects: redirects } : null;
  }
  async function issue(uid, client) {
    const access = rand(32), refresh = rand(32), now = Date.now();
    await db.run('INSERT INTO oauth_tokens (hash, uid, client, kind, expires) VALUES (?, ?, ?, ?, ?)', [hash(access), uid, client, 'access', now + ACCESS_DAYS * 864e5]);
    await db.run('INSERT INTO oauth_tokens (hash, uid, client, kind, expires) VALUES (?, ?, ?, ?, ?)', [hash(refresh), uid, client, 'refresh', now + REFRESH_DAYS * 864e5]);
    return { access_token: access, token_type: 'Bearer', expires_in: ACCESS_DAYS * 86400, refresh_token: refresh, scope: 'carols' };
  }
  // who a request's bearer token stands for: { uid, key } (key names the token for rate limits, and is not the token), or null
  async function playerOf(req) {
    const m = /^Bearer\s+(\S{20,200})$/i.exec(String(req.headers.authorization || ''));
    if (!m) return null;
    const h = hash(m[1]), t = await db.get("SELECT uid, expires FROM oauth_tokens WHERE hash = ? AND kind = 'access'", [h]);
    return t && Number(t.expires) > Date.now() ? { uid: t.uid, key: h.slice(0, 16) } : null;
  }
  // the fields of a posted form (the token endpoint and the consent form) or of JSON; at most 20 kB
  function form(req) {
    return new Promise(function (resolve, reject) {
      let s = '', over = false;
      req.on('data', function (c) { if (over) return; s += c; if (s.length > 20000) { over = true; reject(new Error('too big')); } });
      req.on('end', function () {
        if (over) return;
        try { const o = /json/.test(String(req.headers['content-type'] || '')) || s.trim()[0] === '{' ? JSON.parse(s || '{}') : Object.fromEntries(new URLSearchParams(s)); resolve(o && typeof o === 'object' && !Array.isArray(o) ? o : {}); } catch (e) { reject(e); }
      });
      req.on('error', reject);
    });
  }
  // the fields of an authorization request, checked. Returns { ok, client } or { error }.
  async function asked(q) {
    const client = await clientOf(q.client_id);
    if (!client) return { error: 'This app is not known here. Remove the connector in Claude and add it again.' };
    if (client.redirects.indexOf(q.redirect_uri) < 0) return { error: 'This app asked to send you somewhere it did not register.' };
    if (q.response_type !== 'code' || !q.code_challenge || (q.code_challenge_method || 'S256') !== 'S256') return { error: 'This app asked in a way that is not supported (it needs the code flow with PKCE).' };
    return { ok: true, client: client };
  }
  const KEEP = ['response_type', 'client_id', 'redirect_uri', 'code_challenge', 'code_challenge_method', 'state', 'scope', 'resource'];
  const STYLE = '<style>.oa input[type=email]{box-sizing:border-box;width:100%;font:18px Georgia,serif;color:#2a1a2e;background:#fff8ee;border:0;border-radius:14px;padding:15px 16px;margin:4px 0 12px;text-align:center}.oa .or{color:#cdbfd8;font-size:15px;margin:16px 0 10px}.oa #g{display:flex;justify-content:center;min-height:44px;margin:6px 0}.oa .err{color:#ffb4a8;min-height:1em}.oa .no{display:inline-block;margin-top:14px;background:none;border:1px solid rgba(255,248,238,.4);color:#fff8ee;border-radius:999px;font:600 16px system-ui,sans-serif;padding:13px 30px;min-width:220px;cursor:pointer}.oa .fine{font-size:14.5px;color:#cdbfd8}.oa ul{text-align:left;color:#e6d8f0;padding-left:22px;margin:0 0 18px}.oa li{margin:4px 0}</style>';

  // Handles the sign-in paths. Returns false when the path is not one of them.
  async function handle(req, res, url) {
    const p = url.pathname;
    if (!(p.indexOf('/.well-known/oauth-protected-resource') === 0 || p.indexOf('/.well-known/oauth-authorization-server') === 0 || p === '/.well-known/openid-configuration' || p.indexOf('/oauth/') === 0)) return false;
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return true; }
    await d.ready;
    if (p.indexOf('/.well-known/oauth-protected-resource') === 0) return send(res, 200, RESOURCE), true;
    if (p.indexOf('/.well-known/oauth-authorization-server') === 0 || p === '/.well-known/openid-configuration') return send(res, 200, SERVER), true;

    if (p === '/oauth/register' && req.method === 'POST') {             // an app introduces itself
      if (d.tooMany(req, 'oauthreg', 60, 36e5)) return send(res, 429, { error: 'too_many_requests' }), true;
      let b; try { b = await form(req); } catch (e) { return send(res, 400, { error: 'invalid_client_metadata' }), true; }
      const uris = Array.isArray(b.redirect_uris) ? b.redirect_uris.map(String).slice(0, 10) : [];
      if (!uris.length || !uris.every(function (u) { return u.length <= 600 && okRedirect(u); })) return send(res, 400, { error: 'invalid_redirect_uri', error_description: 'redirect_uris must be https (or http on localhost)' }), true;
      const id = 'c_' + rand(12), name = String(b.client_name || 'An app').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 60) || 'An app';
      await db.run('INSERT INTO oauth_clients (id, name, redirects, created) VALUES (?, ?, ?, ?)', [id, name, JSON.stringify(uris), Date.now()]);
      return send(res, 201, { client_id: id, client_name: name, redirect_uris: uris, grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none', client_id_issued_at: Math.floor(Date.now() / 1000) }), true;
    }

    if (p === '/oauth/authorize' && (req.method === 'GET' || req.method === 'POST')) {
      const html = function (code, title, body) { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' }); res.end(d.page(title, STYLE + '<div class="oa">' + body + '</div>')); };
      const sorry = function (why) { html(400, 'Not connected', '<h1>That did not work</h1><p>' + esc(why) + '</p>'); return true; };
      let q;
      if (req.method === 'POST') { try { q = await form(req); } catch (e) { return sorry('That did not come from this page. Go back to Claude and connect again.'); } }
      else {
        q = Object.fromEntries(url.searchParams);
        // a request that was put aside while its person went to their email for the sign-in link
        if (q.ask) { const row = await db.get('SELECT q, expires FROM oauth_asks WHERE id = ?', [String(q.ask)]); if (!row || Number(row.expires) < Date.now()) return sorry('That sign-in took too long. Go back to Claude and connect again.'); try { q = JSON.parse(row.q); } catch (e) { q = {}; } }
      }
      const ask = await asked(q);
      if (!ask.ok) return sorry(ask.error);
      const acct = await d.accountOf(req);
      const back = function (params) { const u = new URL(q.redirect_uri); Object.keys(params).forEach(function (k) { if (params[k]) u.searchParams.set(k, params[k]); }); res.writeHead(302, { Location: u.toString(), 'Cache-Control': 'no-store' }); res.end(); return true; };
      // the yes and the no come back here as a form, with a mark only this server could have made for this person and this request
      const mark = acct ? crypto.createHmac('sha256', String(env.SESSION_SECRET || '')).update('oauth|' + acct.id + '|' + KEEP.map(function (k) { return q[k] || ''; }).join('|')).digest('base64url') : '';
      if (req.method === 'POST') {
        if (!acct || !env.SESSION_SECRET || q.mark !== mark) return sorry('That did not come from this page. Go back to Claude and connect again.');
        if (acct.banned) return sorry('This account has been closed.');
        if (q.answer !== 'yes') return back({ error: 'access_denied', state: q.state });
        const code = rand(24);
        await db.run('DELETE FROM oauth_codes WHERE expires < ?', [Date.now()]);
        await db.run('INSERT INTO oauth_codes (code, client, uid, redirect, challenge, expires) VALUES (?, ?, ?, ?, ?, ?)', [hash(code), ask.client.id, acct.id, q.redirect_uri, q.code_challenge, Date.now() + 5 * 6e4]);
        return back({ code: code, state: q.state });
      }
      if (!acct) {
        // not signed in yet: Google's own button, or a link sent to their address. The request is put aside under a
        // short name, and the link brings them back to it, wherever they open it.
        if (d.tooMany(req, 'oauthask', 60, 36e5)) return sorry('Too many tries. Wait a few minutes and connect again.');
        const id = rand(12), kept = {}; KEEP.forEach(function (k) { if (q[k]) kept[k] = String(q[k]).slice(0, 2000); });
        await db.run('DELETE FROM oauth_asks WHERE expires < ?', [Date.now()]);
        await db.run('INSERT INTO oauth_asks (id, q, expires) VALUES (?, ?, ?)', [id, JSON.stringify(kept), Date.now() + ASK_MINUTES * 6e4]);
        const here = '/oauth/authorize?ask=' + id, google = env.SESSION_SECRET && env.GOOGLE_CLIENT_ID, byMail = d.emailOn();
        const body = '<h1>Sign in</h1><p><b>' + esc(ask.client.name) + '</b> wants to make carols with you on ' + esc(NAME) + '. Sign in with the account your carols are in, or make one now.</p>' +
          (google ? '<div id="g"></div>' : '') + (google && byMail ? '<p class="or">or get a sign-in link by email</p>' : '') +
          (byMail ? '<form id="f"><input type="email" id="m" name="email" placeholder="you@example.com" autocomplete="email" required aria-label="Your email address"><button class="btn" id="b">Email me a link</button></form>' : '') +
          (!google && !byMail ? '<p class="err">Sign-in is not set up yet. Come back soon.</p>' : '') + '<p class="err" id="e" role="alert"></p>' +
          '<script>(function () { var here = ' + JSON.stringify(here) + ', e = document.getElementById("e");' +
          'function post(u, o) { return fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) }).then(function (r) { return r.json(); }); }' +
          'var f = document.getElementById("f"); if (f) f.onsubmit = function (ev) { ev.preventDefault(); e.textContent = ""; var b = document.getElementById("b"); b.disabled = true;' +
          ' post("/api/auth/link", { email: document.getElementById("m").value, back: here }).then(function (j) { b.disabled = false; if (j && j.ok) { f.innerHTML = "<p><b>Check your email.</b> Open the link we sent and you will come back here to finish. You can leave this page open.</p>"; setInterval(function () { fetch("/api/me").then(function (r) { return r.json(); }).then(function (m) { if (m && m.user) location.replace(here); }).catch(function () {}); }, 3000); } else e.textContent = (j && j.error) || "That did not work. Try again."; }, function () { b.disabled = false; e.textContent = "That did not work. Try again."; }); };' +
          (google ? 'window.onload = function () { if (!window.google) { e.textContent = "Google sign-in did not load. Reload the page, or use the email link."; return; }' +
            'google.accounts.id.initialize({ client_id: ' + JSON.stringify(String(env.GOOGLE_CLIENT_ID || '')) + ', callback: function (r) { post("/api/auth/google", { credential: r.credential }).then(function (j) { if (j && j.ok) location.replace(here); else e.textContent = "That sign-in did not work. Try again."; }, function () { e.textContent = "That sign-in did not work. Try again."; }); } });' +
            'google.accounts.id.renderButton(document.getElementById("g"), { theme: "filled_blue", size: "large", shape: "pill", text: "continue_with", width: 260 }); };' : '') +
          '})();</script>' + (google ? '<script src="https://accounts.google.com/gsi/client" async defer></script>' : '');
        return html(200, 'Sign in', body), true;
      }
      if (acct.banned) return sorry('This account has been closed.');
      const hidden = KEEP.map(function (k) { return q[k] ? '<input type="hidden" name="' + k + '" value="' + esc(q[k]) + '">' : ''; }).join('');
      return html(200, 'Connect ' + NAME, '<h1>Connect to Claude?</h1><p><b>' + esc(ask.client.name) + '</b> is asking to work on your carols as <b>' + esc(acct.name || acct.email || 'you') + '</b>' + (acct.name && acct.email ? ' (' + esc(acct.email) + ')' : '') + '.</p>' +
        '<ul><li>Start, write, change and delete your carols</li><li>Use a carol credit to have a song made, only after you say yes in the chat</li><li>Email a finished carol to people you name, only after you say yes in the chat</li></ul>' +
        '<form method="post" action="/oauth/authorize">' + hidden + '<input type="hidden" name="mark" value="' + mark + '"><button class="btn" name="answer" value="yes">Allow</button><br><button class="no" name="answer" value="no">No thanks</button></form>' +
        '<p class="fine">It cannot buy anything, see your sign-in, or see anyone else\'s carols. Remove it in Claude at any time.</p>'), true;
    }

    if (p === '/oauth/token' && req.method === 'POST') {
      if (d.tooMany(req, 'oauthtok', 300, 6e4)) return send(res, 429, { error: 'too_many_requests' }), true;
      let b; try { b = await form(req); } catch (e) { return send(res, 400, { error: 'invalid_request' }), true; }
      if (b.grant_type === 'authorization_code') {
        // a code is good once: it is taken and read in one statement, so two askers cannot both be given tokens
        const c = b.code ? await db.get('DELETE FROM oauth_codes WHERE code = ? RETURNING client, uid, redirect, challenge, expires', [hash(b.code)]) : null;
        const proof = b.code_verifier ? crypto.createHash('sha256').update(String(b.code_verifier)).digest('base64url') : '';
        if (!c || Number(c.expires) < Date.now() || c.client !== b.client_id || c.redirect !== b.redirect_uri || proof !== c.challenge) return send(res, 400, { error: 'invalid_grant' }), true;
        return send(res, 200, await issue(c.uid, c.client)), true;
      }
      if (b.grant_type === 'refresh_token') {
        // each refresh token is used once, and replaced
        const t = b.refresh_token ? await db.get("DELETE FROM oauth_tokens WHERE hash = ? AND kind = 'refresh' RETURNING uid, client, expires", [hash(b.refresh_token)]) : null;
        if (!t || Number(t.expires) < Date.now() || (b.client_id && t.client !== b.client_id)) return send(res, 400, { error: 'invalid_grant' }), true;
        await db.run('DELETE FROM oauth_tokens WHERE expires < ?', [Date.now()]);
        return send(res, 200, await issue(t.uid, t.client)), true;
      }
      return send(res, 400, { error: 'unsupported_grant_type' }), true;
    }
    return send(res, 404, { error: 'no_such_endpoint' }), true;
  }
  return { handle: handle, playerOf: playerOf, challenge: CHALLENGE, hash: hash };
};
module.exports.ROUTES = ['GET /.well-known/oauth-protected-resource', 'GET /.well-known/oauth-authorization-server', 'POST /oauth/register', 'GET /oauth/authorize', 'POST /oauth/authorize', 'POST /oauth/token'];
