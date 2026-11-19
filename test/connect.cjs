'use strict';
// node test/connect.cjs : THE PLAYER'S CONNECTOR (connect.js, oauth.js, connect-rules.js, connect-ui.js), all in this
// process through handle(req, res) with the kit's fakes: no port, no network, no call to the model or the music
// service. Videos are rendered for real, small.
//   sign-in    401 -> where to sign in -> register -> authorize (Google, and the emailed link) -> token -> refresh once
//   protocol   initialize and the 2026-07-28 server/discover; lists that say how long they keep; batches; bad requests
//   tools      every tool's happy path and its refusals; only the player's tools are listed; the admin's are unreachable
//   rules      ownership (another account's carol is "no such carol"); confirm gates (no credit, no email, nothing
//              deleted or taken down without it; exactly once with it and with a repeated idempotency_key); the
//              site's limits shared with the site; the upload link; set_lyrics's shape, fit and refusals
//   scale      a template list of 5,000: always a page, never the list
//   the panel  the MCP App resource: one self-contained page that plays in a sandboxed frame with no storage, fed
//              through a stand-in host, and the upload page: both in headless Chromium (Playwright; skipped without it)
process.env.CONFIG_OVERRIDE = JSON.stringify({ video: { sizes: { story: [270, 480], square: [270, 270] } } });
const assert = require('node:assert'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const K = require('./kit.cjs');

let checks = 0, part = 0;
const ok = function (v, msg) { checks++; part++; assert.ok(v, msg); }, eq = function (a, b, msg) { checks++; part++; assert.strictEqual(a, b, msg); };
const say = function (s) { process.stdout.write(s + '\n'); };
const logs = []; ['log', 'error', 'warn', 'info'].forEach(function (k) { console[k] = function () { logs.push(Array.from(arguments).map(String).join(' ')); }; });
const T0 = Date.now(), sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
const SECRET = { ADMIN_PASSWORD: 'SECRET-admin-password-7781', ADMIN_MCP_KEY: 'SECRET-mcp-key-0123456789-abcdefgh', RESEND_API_KEY: 'SECRET-resend-key-5512', STRIPE_SECRET_KEY: 'SECRET-stripe-key-9034', ANTHROPIC_API_KEY: 'SECRET-text-key-2210', ELEVENLABS_API_KEY: 'SECRET-music-key-6647' };

(async function () {
  const T = await K.open('connect', { env: SECRET }), S = T.S, db = S.db, F = T.fakes, SITE = T.site, CFG = require('../config.js'), Templates = require('../templates.js'), Lib = require('../library/index.js'), ALL = function () { return Templates.list.length + Lib.rows().length; }, C = S.Connect;
  const ROOT = K.ROOT, key = function () { return crypto.randomBytes(9).toString('hex'); }, ip = function (n) { return { 'fly-client-ip': '10.9.0.' + n }; };
  const section = async function (title, work) { say('== ' + title); part = 0; await work(); say('   ' + part + ' checks'); };
  const count = async function (sql, p) { return (await db.get(sql, p || [])).n; };
  const said = [], saidTo = {}, used = {};   // every answer a player was given (read for secrets at the end); every tool that worked once
  const rpc = function (id, method, params) { return { jsonrpc: '2.0', id: id, method: method, params: params }; };
  const mcp = async function (body, token, more) { const r = await T.call('POST', '/mcp', body, Object.assign(token ? { authorization: 'Bearer ' + token } : {}, more)); said.push(r.text); (saidTo[token || ''] = saidTo[token || ''] || []).push(r.text); return r; };
  let n = 0;
  const tool = async function (token, name, args) { const r = await mcp(rpc(++n, 'tools/call', { name: name, arguments: args || {} }), token); assert.strictEqual(r.status, 200, name + ': ' + r.text); const res = r.json.result; assert.ok(res, name + ': ' + r.text); return { out: res.structuredContent, text: res.content[0].text, bad: !!res.isError }; };
  const good = async function (token, name, args) { const x = await tool(token, name, args); assert.ok(!x.bad, name + ' ' + JSON.stringify(args || {}).slice(0, 200) + ': ' + x.text); checks++; part++; used[name] = 1; return x.out; };
  const refused = async function (token, name, args, re) { const x = await tool(token, name, args); ok(x.bad, name + ' is refused: ' + x.text.slice(0, 200)); ok(re.test(x.text), name + ' says why: ' + x.text); ok(!x.out, 'and answers nothing else'); return x.text; };
  // the admin's overrides of limits. (This test asks far more in a minute than a person's Claude does: the connector's own limit a minute is lifted until part 11 tests it.)
  const ROOMY = { connectorPerMinute: 1000000 };
  const limits = async function (o, strict) { await db.run('INSERT INTO settings (k, v, at) VALUES (?, ?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v, at = excluded.at', ['limits', JSON.stringify(Object.assign({}, strict ? {} : ROOMY, o)), Date.now()]); await S.loadSettings(); };
  await limits(null);
  const cookieOf = function (r) { const m = /^(sac=[^;]+)/.exec(r.heads['set-cookie'] || ''); return m ? { cookie: m[1] } : null; };
  const form = function (o) { return String(new URLSearchParams(o)); }, FORM = { 'content-type': 'application/x-www-form-urlencoded' };
  const TPL = Templates.list[0].id, BDAY = Templates.list.find(function (t) { return t.occasion === 'birthday'; }).id;
  const LYRICS = [{ section: 'verse', lines: ['Maya ran the whole way round the town', 'Twenty six miles and she never slowed down', 'The kids made a sign and they painted it blue', 'We stood at the finish all cheering for you'] }, { section: 'hook', lines: ['Happy birthday, Maya, hip hooray', 'Our marathon girl, it is your day'] }];

  // ---- signing in: the whole OAuth flow, as a client goes through it ----
  const REDIRECT = 'https://claude.example/api/mcp/auth_callback';
  async function register(name) { const r = await T.call('POST', '/oauth/register', { client_name: name || 'Claude', redirect_uris: [REDIRECT] }); assert.strictEqual(r.status, 201, r.text); return r.json.client_id; }
  // -> { tokens, client } for whoever holds this cookie
  async function connect(who, client) {
    client = client || await register(); const verifier = crypto.randomBytes(32).toString('base64url'), q = { response_type: 'code', client_id: client, redirect_uri: REDIRECT, code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', state: 'st-' + key() };
    let r = await T.call('GET', '/oauth/authorize?' + form(q), null, who); assert.strictEqual(r.status, 200, r.text);
    const mark = /name="mark" value="([^"]+)"/.exec(r.text); assert.ok(mark, 'the consent page has its mark');
    r = await T.call('POST', '/oauth/authorize', form(Object.assign({}, q, { mark: mark[1], answer: 'yes' })), Object.assign({}, FORM, who)); assert.strictEqual(r.status, 302, r.text);
    const back = new URL(r.heads.location); assert.strictEqual(back.searchParams.get('state'), q.state);
    r = await T.call('POST', '/oauth/token', form({ grant_type: 'authorization_code', code: back.searchParams.get('code'), client_id: client, redirect_uri: REDIRECT, code_verifier: verifier }), FORM); assert.strictEqual(r.status, 200, r.text);
    return { tokens: r.json, client: client };
  }
  let ANN, BEA, annWho, beaWho;   // two people's access tokens, and their site cookies

  await section('1. Signing in: 401, where to sign in, register, authorize (Google and the emailed link), token, refresh once', async function () {
    let r = await mcp(rpc(1, 'tools/list')); eq(r.status, 401, 'nobody is a 401'); eq(r.json.error.code, -32001); ok(/sign in/i.test(r.json.error.message), 'that says to sign in'); ok(!r.json.result);
    eq(r.heads['www-authenticate'], 'Bearer resource_metadata="' + SITE + '/.well-known/oauth-protected-resource"', 'and says where to find out how'); ok(/WWW-Authenticate/.test(r.heads['access-control-expose-headers']), 'which a browser client may read');
    for (const t of ['nope', 'x'.repeat(43), SECRET.ADMIN_MCP_KEY]) eq((await mcp(rpc(1, 'tools/list'), t)).status, 401, 'a made-up token is a 401');
    r = await T.call('GET', '/.well-known/oauth-protected-resource'); eq(r.status, 200); eq(r.json.resource, SITE + '/mcp'); eq(r.json.authorization_servers[0], SITE); eq(r.heads['access-control-allow-origin'], '*');
    eq((await T.call('GET', '/.well-known/oauth-protected-resource/mcp')).json.resource, SITE + '/mcp', 'also at the path with the resource\'s own');
    r = await T.call('GET', '/.well-known/oauth-authorization-server'); eq(r.status, 200); eq(r.json.issuer, SITE); eq(r.json.authorization_endpoint, SITE + '/oauth/authorize'); eq(r.json.token_endpoint, SITE + '/oauth/token'); eq(r.json.registration_endpoint, SITE + '/oauth/register');
    eq(r.json.code_challenge_methods_supported.join(), 'S256'); eq(r.json.grant_types_supported.join(), 'authorization_code,refresh_token'); eq(r.json.token_endpoint_auth_methods_supported.join(), 'none');
    eq((await T.call('OPTIONS', '/oauth/token')).status, 204, 'preflight');
    // an app introduces itself
    for (const bad of [['http://evil.example/cb'], ['javascript:alert(1)'], ['data:text/html,x'], [], ['https://ok.example/cb', 'http://evil.example/cb']]) { r = await T.call('POST', '/oauth/register', { client_name: 'X', redirect_uris: bad }); eq(r.status, 400, 'a redirect that is not https (or localhost) is refused: ' + bad); eq(r.json.error, 'invalid_redirect_uri'); }
    r = await T.call('POST', '/oauth/register', { client_name: 'Claude <b>Code</b>', redirect_uris: ['http://localhost:53124/callback', 'http://127.0.0.1:9/cb'] }); eq(r.status, 201, 'localhost is fine'); eq(r.json.client_name, 'Claude bCode/b', 'a name is made plain'); ok(/^c_/.test(r.json.client_id));
    const client = await register('Claude');
    // the request, checked before anybody is asked anything
    const verifier = crypto.randomBytes(32).toString('base64url'), challenge = crypto.createHash('sha256').update(verifier).digest('base64url'), q = { response_type: 'code', client_id: client, redirect_uri: REDIRECT, code_challenge: challenge, code_challenge_method: 'S256', state: 'abc123', scope: 'carols' };
    for (const bad of [{ client_id: 'c_nobody' }, { redirect_uri: 'https://evil.example/cb' }, { response_type: 'token' }, { code_challenge: '' }, { code_challenge_method: 'plain' }]) { r = await T.call('GET', '/oauth/authorize?' + form(Object.assign({}, q, bad))); eq(r.status, 400, 'refused: ' + JSON.stringify(bad)); ok(r.text.indexOf('evil.example') < 0 && !r.heads.location, 'and nobody is sent anywhere'); }
    // not signed in: the sign-in page, with Google's button and the emailed link, and the request put aside
    r = await T.call('GET', '/oauth/authorize?' + form(q)); eq(r.status, 200); ok(/Sign in/.test(r.text) && /accounts\.google\.com\/gsi\/client/.test(r.text) && /Email me a link/.test(r.text), 'Google or a link by email'); eq(r.heads['x-frame-options'], 'DENY'); eq(r.heads['cache-control'], 'no-store');
    ok(r.text.indexOf('Claude') > 0 && r.text.indexOf(CFG.name) > 0, 'it says who is asking, and for what');
    const askId = /\/oauth\/authorize\?ask=([\w-]+)/.exec(r.text)[1];
    // WITH GOOGLE: the product's own sign-in, then back to the same request
    r = await T.call('POST', '/api/auth/google', { credential: F.google.token({ sub: '101', email: 'ann@example.test', email_verified: true, name: 'Ann Lee' }) }); eq(r.status, 200, r.text); annWho = cookieOf(r); ok(annWho, 'signed in with Google');
    r = await T.call('GET', '/oauth/authorize?ask=' + askId, null, annWho); eq(r.status, 200, 'back at the request that was put aside'); ok(/Connect to Claude\?/.test(r.text) && /Ann Lee/.test(r.text) && /ann@example\.test/.test(r.text) && /Allow/.test(r.text) && /No thanks/.test(r.text), 'the consent page says who and as whom');
    ok(/only after you say yes/.test(r.text), 'and what will need a yes'); ok(r.text.indexOf('google:101') < 0, 'not the account\'s id');
    const mark = /name="mark" value="([^"]+)"/.exec(r.text)[1], hidden = Object.fromEntries(Array.from(r.text.matchAll(/<input type="hidden" name="(\w+)" value="([^"]*)">/g), function (m) { return [m[1], m[2].replace(/&amp;/g, '&')]; }));
    eq(hidden.client_id, client); eq(hidden.state, 'abc123'); eq(hidden.code_challenge, challenge);
    // the yes must come from that page, for that person and that request
    for (const bad of [{ mark: 'x' }, { mark: '' }, { mark: mark, state: 'other' }]) { r = await T.call('POST', '/oauth/authorize', form(Object.assign({}, hidden, { answer: 'yes' }, bad)), Object.assign({}, FORM, annWho)); eq(r.status, 400, 'a yes without the page\'s own mark is refused'); ok(!r.heads.location); }
    r = await T.call('POST', '/oauth/authorize', form(Object.assign({}, hidden, { answer: 'yes' })), FORM); eq(r.status, 400, 'and so is one from nobody'); eq(await count('SELECT COUNT(*) AS n FROM oauth_codes'), 0, 'no code was made');
    r = await T.call('POST', '/oauth/authorize', form(Object.assign({}, hidden, { answer: 'no' })), Object.assign({}, FORM, annWho)); eq(r.status, 302, 'a no goes back to the app'); let back = new URL(r.heads.location); eq(back.origin + back.pathname, REDIRECT); eq(back.searchParams.get('error'), 'access_denied'); eq(back.searchParams.get('state'), 'abc123'); ok(!back.searchParams.get('code'));
    r = await T.call('POST', '/oauth/authorize', form(Object.assign({}, hidden, { answer: 'yes' })), Object.assign({}, FORM, annWho)); eq(r.status, 302, 'a yes goes back with a code'); back = new URL(r.heads.location); const code = back.searchParams.get('code'); ok(code && code.length >= 24); eq(back.searchParams.get('state'), 'abc123');
    eq(await count('SELECT COUNT(*) AS n FROM oauth_codes WHERE code = ?', [code]), 0, 'only a hash of the code is kept');
    // the code for a token: with the right proof, once
    const ask = function (o) { return T.call('POST', '/oauth/token', form(Object.assign({ grant_type: 'authorization_code', code: code, client_id: client, redirect_uri: REDIRECT, code_verifier: verifier }, o)), FORM); };
    r = await ask({ code_verifier: 'wrong-wrong-wrong-wrong-wrong-wrong-wrong-wrong' }); eq(r.status, 400, 'the wrong PKCE proof is refused'); eq(r.json.error, 'invalid_grant');
    r = await ask({}); eq(r.status, 400, 'and that try spent the code'); eq(r.json.error, 'invalid_grant');
    const two = await connect(annWho, client);   // (a fresh code, the same person)
    ANN = two.tokens.access_token; eq(two.tokens.token_type, 'Bearer'); ok(two.tokens.expires_in > 86400 && two.tokens.refresh_token && two.tokens.scope === 'carols', 'a token and a refresh token');
    eq(await count('SELECT COUNT(*) AS n FROM oauth_tokens WHERE hash = ? OR hash = ?', [ANN, two.tokens.refresh_token]), 0, 'only hashes of tokens are kept');
    r = await mcp(rpc(1, 'ping'), ANN); eq(r.status, 200, 'the token gets in'); eq(JSON.stringify(r.json.result), '{}');
    eq((await mcp(rpc(1, 'ping'), two.tokens.refresh_token)).status, 401, 'a refresh token is not an access token');
    for (const bad of [{ client_id: 'c_other' }, { redirect_uri: 'https://claude.example/other' }, { grant_type: 'password' }]) eq((await ask(bad)).status, 400, 'refused: ' + JSON.stringify(bad));
    // refresh: once
    const fresh = function (t, more) { return T.call('POST', '/oauth/token', form(Object.assign({ grant_type: 'refresh_token', refresh_token: t, client_id: client }, more)), FORM); };
    eq((await fresh(two.tokens.refresh_token, { client_id: 'c_other' })).status, 400, 'another app cannot use it');
    r = await fresh(two.tokens.refresh_token); eq(r.status, 400, '(and that try spent it: a refresh token is good once, whoever shows it)');
    const three = await connect(annWho, client); r = await fresh(three.tokens.refresh_token); eq(r.status, 200, 'a refresh token gives new tokens'); ok(r.json.access_token && r.json.access_token !== three.tokens.access_token && r.json.refresh_token !== three.tokens.refresh_token);
    eq((await mcp(rpc(1, 'ping'), r.json.access_token)).status, 200, 'the new one works'); eq((await fresh(three.tokens.refresh_token)).status, 400, 'the old refresh token does not work twice'); eq((await fresh(r.json.refresh_token)).status, 200, 'the new one does, once');
    eq((await fresh('made-up')).status, 400); eq((await fresh(ANN)).status, 400, 'an access token is not a refresh token');
    // WITH THE EMAILED LINK: asked for on the sign-in page, opened wherever, and back at the same request
    const client2 = await register('Claude'), v2 = crypto.randomBytes(32).toString('base64url'), q2 = { response_type: 'code', client_id: client2, redirect_uri: REDIRECT, code_challenge: crypto.createHash('sha256').update(v2).digest('base64url'), code_challenge_method: 'S256', state: 'link-1' };
    r = await T.call('GET', '/oauth/authorize?' + form(q2)); const ask2 = /\/oauth\/authorize\?ask=([\w-]+)/.exec(r.text)[1], sent0 = F.sent.length;
    r = await T.call('POST', '/api/auth/link', { email: 'Bea@Example.test', back: '/oauth/authorize?ask=' + ask2 }, ip(2)); eq(r.status, 200, r.text); eq(F.sent.length, sent0 + 1, 'one email'); eq(F.sent[sent0].to[0], 'bea@example.test');
    const link = /https:\/\/sendacarol\.test\/auth\/link\?token=[\w-]+/.exec(F.sent[sent0].text)[0].replace(SITE, '');
    eq((await T.call('GET', '/oauth/authorize?ask=' + ask2)).status, 200, 'until it is opened, the page still asks to sign in');
    r = await T.call('GET', link); eq(r.status, 200, 'opening the link shows a button'); r = await T.call('POST', '/auth/link', form({ token: link.split('token=')[1] }), FORM); eq(r.status, 303, 'pressing it signs in'); eq(r.heads.location, '/oauth/authorize?ask=' + ask2, 'and goes back to the request'); beaWho = cookieOf(r); ok(beaWho);
    r = await T.call('GET', r.heads.location, null, beaWho); eq(r.status, 200); ok(/Connect to Claude\?/.test(r.text) && /bea@example\.test/.test(r.text), 'the consent page, as Bea');
    const h2 = Object.fromEntries(Array.from(r.text.matchAll(/<input type="hidden" name="(\w+)" value="([^"]*)">/g), function (m) { return [m[1], m[2].replace(/&amp;/g, '&')]; })); eq(h2.state, 'link-1');
    r = await T.call('POST', '/oauth/authorize', form(Object.assign({}, h2, { answer: 'yes' })), Object.assign({}, FORM, beaWho)); eq(r.status, 302); const code2 = new URL(r.heads.location).searchParams.get('code');
    r = await T.call('POST', '/oauth/token', form({ grant_type: 'authorization_code', code: code2, client_id: client2, redirect_uri: REDIRECT, code_verifier: v2 }), FORM); eq(r.status, 200, r.text); BEA = r.json.access_token;
    eq((await mcp(rpc(1, 'ping'), BEA)).status, 200, 'Bea is in');
    r = await T.call('GET', '/oauth/authorize?ask=made-up-ask', null, annWho); eq(r.status, 400, 'a request that was never put aside is refused');
    // a token that ran out, and an account that was closed
    const old = (await connect(annWho, client)).tokens.access_token; await db.run('UPDATE oauth_tokens SET expires = ? WHERE hash = ?', [Date.now() - 1000, crypto.createHash('sha256').update(old).digest('base64url')]); eq((await mcp(rpc(1, 'ping'), old)).status, 401, 'a token that ran out is a 401');
    const dan = await T.user('google:404', 'dan@example.test'), danT = (await connect(dan)).tokens.access_token; eq((await mcp(rpc(1, 'ping'), danT)).status, 200); await db.run('UPDATE users SET banned = 1 WHERE id = ?', ['google:404']);
    r = await mcp(rpc(1, 'tools/call', { name: 'my_account', arguments: {} }), danT); eq(r.status, 403, 'a closed account is shut out'); ok(/closed/.test(r.json.error.message)); eq((await T.call('GET', '/oauth/authorize?' + form(q), null, dan)).status, 400, 'and cannot connect again');
    eq((await T.call('GET', '/oauth/nothing')).status, 404); eq((await T.call('GET', '/mcp/nothing')).status, 404);
  });

  await section('2. The protocol: initialize, server/discover, lists that say how long they keep, batches, bad requests', async function () {
    const MOD = { 'mcp-protocol-version': '2026-07-28' };
    let r = await mcp(rpc(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } }), ANN); eq(r.status, 200); eq(r.json.result.protocolVersion, '2025-06-18'); eq(r.json.result.serverInfo.name, CFG.app); eq(r.json.result.serverInfo.title, CFG.name);
    ok(r.json.result.capabilities.tools && r.json.result.capabilities.resources, 'tools and resources'); ok(/how_it_works/.test(r.json.result.instructions) && /confirm/.test(r.json.result.instructions), 'the instructions say where to start and what needs a yes'); ok(!r.json.result.resultType, 'the earlier revisions are answered as they were');
    ok(/^20\d\d-\d\d-\d\d$/.test((await mcp(rpc(1, 'initialize', { protocolVersion: '1999-01-01' }), ANN)).json.result.protocolVersion), 'an unknown version gets one we speak');
    eq(r.heads['content-type'], 'application/json'); eq(r.heads['access-control-allow-origin'], '*'); eq(r.heads['cache-control'], 'no-store');
    r = await mcp(rpc(2, 'server/discover', { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' } }), ANN); eq(r.status, 200, 'server/discover'); eq(r.json.result.supportedVersions[0], '2026-07-28'); eq(r.json.result.resultType, 'complete'); eq(r.json.result._meta['io.modelcontextprotocol/serverInfo'].name, CFG.app); ok(r.json.result.instructions.length > 200);
    r = await mcp(rpc(3, 'tools/list'), ANN, MOD); eq(r.json.result.ttlMs, 0, 'a list says how long it may be kept'); eq(r.json.result.cacheScope, 'private'); eq(r.json.result.resultType, 'complete');
    const tools = r.json.result.tools, names = tools.map(function (t) { return t.name; });
    r = await mcp(rpc(3, 'tools/list'), ANN); ok(!('ttlMs' in r.json.result), '(the earlier revisions have no such fields)'); eq(JSON.stringify(r.json.result.tools), JSON.stringify(tools), 'the same tools either way');
    eq(names.join(' '), 'how_it_works occasions find_templates suggest_templates template start_carol my_carols carol set_details write_lyrics set_lyrics set_text add_photos arrange_photos remove_photo change_template set_music preview_carol make_song status takes another_take choose_take update_video share_links set_card_name send_by_email take_down put_back delete_carol my_account buy_link', 'the player\'s tools, and only those');
    ok(!names.some(function (x) { return /admin/i.test(x); }) && JSON.stringify(tools).indexOf('admin_') < 0, 'no admin tool is listed for a player'); ok(!/premium|group/i.test(JSON.stringify(tools) + JSON.stringify(C.SAYS)), 'nothing the product does not have is mentioned');
    tools.forEach(function (t) { ok(t.description.length >= 60 && t.inputSchema.type === 'object' && t.annotations, t.name + ' is described, with a schema'); });
    ['make_song', 'send_by_email', 'take_down', 'delete_carol'].forEach(function (x) { const t = tools.find(function (y) { return y.name === x; }); ok(t.inputSchema.properties.confirm && /say(s)? yes/.test(t.description) && /confirm: true/.test(t.description), x + ' takes confirm, and says to ask first'); });
    ['start_carol', 'make_song', 'another_take', 'send_by_email', 'set_lyrics'].forEach(function (x) { ok(tools.find(function (y) { return y.name === x; }).inputSchema.properties.idempotency_key, x + ' takes an idempotency_key'); });
    eq(tools.find(function (t) { return t.name === 'preview_carol'; })._meta.ui.resourceUri, C.panelUri(), 'preview_carol points at the panel');
    r = await mcp(rpc(4, 'ping'), ANN, MOD); eq(r.json.result.resultType, 'complete'); ok(!('ttlMs' in r.json.result));
    r = await mcp({ jsonrpc: '2.0', method: 'notifications/initialized' }, ANN); eq(r.status, 202, 'a notification is a 202'); eq(r.text, '');
    r = await mcp([rpc(1, 'initialize', {}), { jsonrpc: '2.0', method: 'notifications/initialized' }, rpc(2, 'tools/list'), rpc(3, 'tools/call', { name: 'occasions', arguments: {} }), rpc(4, 'nope')], ANN); eq(r.status, 200, 'a batch'); eq(r.json.length, 4); eq(r.json[1].result.tools.length, tools.length); ok(r.json[2].result.structuredContent.occasions.length > 3); eq(r.json[3].error.code, -32601);
    eq((await mcp([{ jsonrpc: '2.0', method: 'notifications/initialized' }], ANN)).status, 202); eq((await mcp(Array.from({ length: 21 }, function (x, i) { return rpc(i, 'ping'); }), ANN)).status, 400, 'a batch of more than 20 is refused');
    r = await mcp(rpc(9, 'tools/run'), ANN); eq(r.json.error.code, -32601, 'an unknown method'); r = await mcp({ foo: 1 }, ANN); eq(r.json.error.code, -32600, 'not a JSON-RPC request'); r = await mcp('{"jsonrpc":"2.0","id":1,"method":', ANN); eq(r.status, 400, 'bad JSON'); eq(r.json.error.code, -32700);
    r = await mcp(rpc(1, 'tools/call', { name: 'carol', arguments: { id: 'x'.repeat(210000) } }), ANN); eq(r.status, 413, 'a request over 200 kB is refused'); eq(r.json.error.code, -32600);
    r = await T.call('GET', '/mcp'); eq(r.status, 405, 'GET is a 405'); ok(/POST/.test(r.heads.allow)); r = await T.call('OPTIONS', '/mcp'); eq(r.status, 204); ok(/authorization/.test(r.heads['access-control-allow-headers']) && /mcp-protocol-version/.test(r.heads['access-control-allow-headers']));
    // THE ADMIN'S TOOLS ARE NOT REACHABLE WITH A PLAYER'S TOKEN, by any door
    const b0 = await S.balance('google:101'), log0 = await count('SELECT COUNT(*) AS n FROM admin_log');
    for (const name of S.Admin.TOOLS.map(function (t) { return t.name; })) { r = await mcp(rpc(1, 'tools/call', { name: name, arguments: { uid: 'google:101', credits: 5, reason: 'let me in', id: 'x', confirm: true } }), ANN); eq(r.json.error.code, -32602, name + ' is not a tool here'); ok(!r.json.result); }
    for (const door of [['/mcp?admin=', {}], ['/mcp?admin=' + ANN, {}], ['/mcp', { 'x-admin-key': ANN }], ['/mcp?admin=wrong-key-wrong-key-wrong-key', {}]]) { r = await T.call('POST', door[0], rpc(1, 'tools/call', { name: 'admin_grant', arguments: { uid: 'google:101', credits: 5, reason: 'let me in' } }), Object.assign({ authorization: 'Bearer ' + ANN }, door[1], ip(31))); eq(r.status, 401, 'the admin\'s door wants the admin\'s key, not a player\'s token: ' + door[0]); }
    eq(await S.balance('google:101'), b0, 'no credit was given'); eq(await count('SELECT COUNT(*) AS n FROM admin_log'), log0, 'no admin tool ran');
    r = await T.call('POST', '/mcp?admin=' + SECRET.ADMIN_MCP_KEY, rpc(1, 'tools/list'), ip(32)); eq(r.status, 200, '(the admin\'s own door is as it was)'); eq(r.json.result.tools.length, S.Admin.TOOLS.length); ok(r.json.result.tools.every(function (t) { return /^admin_/.test(t.name); }));
    // resources: the panel
    r = await mcp(rpc(5, 'resources/list'), ANN, MOD); eq(r.json.result.resources.length, 1); eq(r.json.result.resources[0].uri, C.panelUri()); eq(r.json.result.resources[0].mimeType, 'text/html;profile=mcp-app'); eq(r.json.result.ttlMs, 0); eq(r.json.result.cacheScope, 'private');
    r = await T.call('POST', '/mcp', rpc(6, 'resources/read', { uri: C.panelUri() }), Object.assign({ authorization: 'Bearer ' + ANN }, MOD)); const res = r.json.result;   // (not kept with the answers read for secrets: it is a megabyte of the engine, looked at in part 7) eq(res.ttlMs, 0, 'a read says how long it keeps (claude.ai will not show a panel without it)'); eq(res.cacheScope, 'private'); eq(res.contents[0].mimeType, 'text/html;profile=mcp-app'); eq(res.contents[0].text, C.panelHtml());
    eq(JSON.stringify(res.contents[0]._meta.ui.csp), JSON.stringify({ connectDomains: [SITE], resourceDomains: [SITE] }), 'the page may ask only the site');
    eq((await mcp(rpc(7, 'resources/read', { uri: 'ui://other/x' }), ANN)).json.error.code, -32602); eq((await mcp(rpc(8, 'resources/templates/list'), ANN)).json.result.resourceTemplates.length, 0); eq((await mcp(rpc(8, 'prompts/list'), ANN)).json.result.prompts.length, 0);
  });

  await section('3. Finding a look: occasions, search, three suggestions, one in full; and a list of 5,000', async function () {
    let o = await good(ANN, 'how_it_works'); ok(o.the_steps.length >= 6 && /one carol credit/.test(o.what_costs_a_credit) && /confirm: true/.test(o.what_needs_the_persons_yes) && o.never.length >= 6, 'the guide: steps, what costs, what needs a yes, never'); eq(o.limits.free_drafts_before_a_first_purchase, CFG.limits.freeDrafts);
    ok(o.what_costs_a_credit.indexOf(CFG.finalSale) > 0 && /\$4\.99/.test(o.what_costs_a_credit), 'with the prices, and that sales are final');
    o = await good(ANN, 'occasions'); const live = o.occasions.filter(function (x) { return x.can_be_made; }); ok(live.length >= 60 && ['birthday', 'christmas', 'congrats', 'love', 'thanks', 'diwali', 'sympathy'].every(function (id) { return live.some(function (x) { return x.id === id; }); }), 'every live occasion (' + live.length + ')'); eq(live.reduce(function (a, x) { return a + x.templates; }, 0), ALL(), 'every template, the library too, is counted under its occasion');
    o = await good(ANN, 'find_templates', {}); eq(o.total, ALL(), 'the launch set and the library'); eq(o.items.length, 8, 'a page of 8'); eq(o.page, 1); eq(o.pages, Math.ceil(ALL() / 8)); o = await good(ANN, 'find_templates', { q: 'frogs pool' }); ok(o.items.some(function (x) { return x.id === 'kids-birthday-frogs-by-the-pool'; }), 'a library template by its words'); o = await good(ANN, 'template', { id: 'kids-birthday-frogs-by-the-pool' }); eq(o.id, 'kids-birthday-frogs-by-the-pool', 'and in full'); o = await good(ANN, 'find_templates', {}); ok(o.items[0].id && o.items[0].name && o.items[0].blurb && o.items[0].tags.length <= 8);
    o = await good(ANN, 'find_templates', { q: 'grandma kitchen cookies' }); eq(o.items[0].id, 'grandmas-kitchen', 'words find it'); o = await good(ANN, 'find_templates', { occasion: 'birthday' }); ok(o.total >= 2 && o.items.every(function (x) { return x.occasion === 'birthday'; })); ok(o.styles.length >= 1);
    o = await good(ANN, 'find_templates', { occasion: 'christmas', style: 'funny' }); ok(o.total >= 2 && o.items.every(function (x) { return x.style === 'Funny'; }), 'by style'); o = await good(ANN, 'find_templates', { audience: 'kids', tone: 'snow' }); ok(o.total >= 1 && o.items.some(function (x) { return x.id === 'snow-day'; }), 'by audience and tone');
    o = await good(ANN, 'find_templates', { q: 'zzzzqq' }); eq(o.total, 0); ok(/Nothing matched/.test(o.note)); o = await good(ANN, 'find_templates', { q: 'cozy zzzzqq' }); ok(o.total > 0 && /closest/.test(o.note), 'no template has every word: the closest');
    o = await good(ANN, 'suggest_templates', { occasion: 'birthday', relationship: 'my sister', mood: 'funny', details: 'she just ran her first marathon' }); eq(o.occasion, 'birthday'); ok(o.picks.length >= 2 && o.picks.length <= 3 && o.picks.every(function (p) { return p.occasion === 'birthday' && p.why.length > 10; }), 'picks for a birthday, each with why');
    o = await good(ANN, 'suggest_templates', { occasion: 'christmas', relationship: 'our grandma', mood: 'cozy' }); eq(o.picks.length, 3, 'three'); ok(o.picks.some(function (p) { return /grand/.test(p.id + p.tags.join()); }) && /Fits what you said/.test(o.picks[0].why), 'that fit what was said');
    o = await good(ANN, 'suggest_templates', { occasion: 'a thank you for her teacher' }); eq(o.occasion, 'thanks', 'the occasion is understood from plain words');
    o = await good(ANN, 'template', { id: 'cozy-mantel' }); eq(o.id, 'cozy-mantel'); ok(o.tone && o.music.styles.length && o.music.bpm && o.cast.length, 'its tone, music and cast'); eq(o.preview_url, SITE + '/mcp/template/cozy-mantel'); eq(o.preview_image, SITE + '/mcp/template/cozy-mantel.jpg');
    await refused(ANN, 'template', { id: 'not-a-template' }, /no template/);
    let r = await T.call('GET', '/mcp/template/cozy-mantel.jpg'); eq(r.status, 200, 'a picture of the look'); eq(r.heads['content-type'], 'image/jpeg'); ok(r.body.length > 4000 && r.body[0] === 0xff && r.body[1] === 0xd8, 'a real JPEG, drawn by the engine (' + r.body.length + ' bytes)');
    r = await T.call('GET', '/mcp/template/cozy-mantel'); eq(r.status, 200, 'and a page that plays it'); ok(/SAC_PLAYER\.set\(/.test(r.text) && /\/engine\.js\?v=/.test(r.text) && /made-up words/.test(r.text)); eq((await T.call('GET', '/mcp/template/not-a-template')).status, 404); eq((await T.call('GET', '/mcp/template/not-a-template.jpg')).status, 404);
    Templates.list.forEach(function (t) { assert.deepStrictEqual(JSON.parse(JSON.stringify(t)), t, t.id + ' is plain data: the panel can be handed it'); }); checks++; part++;

    // A LIBRARY OF 5,000: the same tools, always a page
    const base = Templates.list, get0 = Templates.get, big = [], by = {};
    for (let i = 0; i < 5000; i++) { const b = base[i % base.length], t = Object.assign({}, b, { id: 'gen-' + i, name: b.name + ' ' + i, order: i }); big.push(t); by[t.id] = t; }
    const rows0 = Lib.rows; Templates.list = big; Templates.get = function (id) { return by[id] || null; }; Lib.rows = function () { return []; };
    try {
      const t0 = Date.now(); let x = await tool(ANN, 'find_templates', {}); o = x.out; eq(o.total, 5000, 'all 5,000 are found'); eq(o.items.length, 8, 'and 8 are answered'); eq(o.pages, 625); ok(x.text.length < 12000, 'the answer is a page, not the list (' + x.text.length + ' characters)');
      o = await good(ANN, 'find_templates', { per: 500 }); eq(o.items.length, 20, 'at most 20 to a page, whatever is asked'); eq(o.per, 20); o = await good(ANN, 'find_templates', { page: 3 }); eq(o.items[0].id, 'gen-16', 'page 3 is the next ones'); o = await good(ANN, 'find_templates', { page: 99999 }); eq(o.page, 625, 'a page past the end is the last'); eq(o.items.length, 8);
      o = await good(ANN, 'find_templates', { q: 'mantel 4323' }); eq(o.total, 1, 'one of 5,000 by its words'); eq(o.items[0].id, 'gen-4323'); o = await good(ANN, 'find_templates', { occasion: 'birthday', q: 'party' }); ok(o.total > 100 && o.items.length === 8);
      o = await good(ANN, 'occasions'); eq(o.occasions.reduce(function (a, y) { return a + y.templates; }, 0), 5000); x = await tool(ANN, 'suggest_templates', { occasion: 'christmas', relationship: 'grandma', mood: 'cozy' }); eq(x.out.picks.length, 3, 'still three suggestions'); ok(x.text.length < 4000);
      o = await good(ANN, 'template', { id: 'gen-4999' }); eq(o.id, 'gen-4999'); ok(Date.now() - t0 < 3000, 'and quickly (' + (Date.now() - t0) + ' ms for nine calls)');
      const made = await good(ANN, 'start_carol', { for: 'Maya', template: 'gen-4999', idempotency_key: key() }); eq(made.carol.template.id, 'gen-4999', 'a carol on template 4,999');
      x = await tool(ANN, 'preview_carol', { id: made.carol.id }); eq(x.out.preview.template.id, 'gen-4999', 'its preview carries its one template, so the panel needs no list'); ok(JSON.stringify(x.out).length < 20000, 'and nothing of the other 4,999');
      ok(C.panelHtml().indexOf('cozy-mantel') < 0 && C.panelHtml().indexOf('gen-1') < 0, 'the panel itself holds no template');
      eq((await good(ANN, 'delete_carol', { id: made.carol.id, confirm: true })).deleted, true);
    } finally { Templates.list = base; Templates.get = get0; Lib.rows = rows0; }
    eq((await good(ANN, 'find_templates', {})).total, ALL(), '(the real list again)');
  });

  let A1, A2;   // Ann's carols: the one that goes all the way, and a spare draft
  await section('4. A carol by talking: the account, start, details, the writer and its limits (shared with the site)', async function () {
    let o = await good(ANN, 'my_account'); eq(o.name, 'Ann Lee'); eq(o.email, 'ann@example.test'); eq(o.credits, 0); eq(o.has_bought, false); eq(o.free_drafts_left, CFG.limits.freeDrafts); eq(o.left_today.writer_calls, CFG.limits.agentCallsPerDay); eq(o.left_today.new_carols, CFG.limits.carolsPerDay - 1, '(one was started above)');
    o = await good(ANN, 'buy_link', {}); eq(o.url, SITE + '/make?buy=1'); eq(o.packs.length, 3); eq(o.packs[0].price, '$4.99'); ok(/cannot buy/.test(o.note) && o.note.indexOf(CFG.finalSale) >= 0); eq(F.stripe.asked.length, 0, 'no Checkout is opened by the connector');
    // start: a key is needed, and a repeat with the same key starts nothing new
    await refused(ANN, 'start_carol', { for: 'Maya', occasion: 'birthday' }, /idempotency_key/); await refused(ANN, 'start_carol', { occasion: 'birthday', idempotency_key: key() }, /Who is the carol for/); await refused(ANN, 'start_carol', { for: 'Maya', template: 'not-a-template', idempotency_key: key() }, /no template/);
    const n0 = await count("SELECT COUNT(*) AS n FROM cards WHERE uid = 'google:101' AND state <> 'deleted'"), k1 = key();
    o = await good(ANN, 'start_carol', { for: 'Maya', from: 'Sam and the kids', relationship: 'my sister', occasion: 'birthday', mood: 'funny', details: 'She just ran her first marathon. The kids painted a blue sign.', idempotency_key: k1 });
    A1 = o.carol.id; eq(o.started, true); eq(o.carol.state, 'draft'); eq(o.carol.for, 'Maya'); eq(o.carol.from, 'Sam and the kids'); eq(o.carol.relationship, 'my sister'); eq(o.carol.occasion, 'birthday'); ok(/was picked/.test(o.picked), 'a look was picked for the occasion, and said'); eq(o.carol.lyrics.length, 0); ok(/no words yet/.test(o.carol.where_it_is));
    const again = await good(ANN, 'start_carol', { for: 'Maya', from: 'Sam and the kids', relationship: 'my sister', occasion: 'birthday', idempotency_key: k1 }); eq(again.carol.id, A1, 'the same key: the same carol'); eq(again.replayed, true); ok(/nothing was done again/.test(again.replay_note));
    const both = await Promise.all([good(ANN, 'start_carol', { for: 'Twin', template: TPL, idempotency_key: 'twin-key-1' }), good(ANN, 'start_carol', { for: 'Twin', template: TPL, idempotency_key: 'twin-key-1' })]); eq(both[0].carol.id, both[1].carol.id, 'two at once with one key: one carol'); A2 = both[0].carol.id;
    eq(await count("SELECT COUNT(*) AS n FROM cards WHERE uid = 'google:101' AND state <> 'deleted'"), n0 + 2, 'two carols were made by four calls');
    o = await good(ANN, 'my_carols', {}); eq(o.total, 2); eq(o.per, 12); ok(o.carols.some(function (c) { return c.id === A1 && c.title === 'For Maya' && c.state === 'draft'; })); o = await good(ANN, 'my_carols', { q: 'maya' }); eq(o.total, 1); o = await good(ANN, 'my_carols', { state: 'ready' }); eq(o.total, 0); o = await good(ANN, 'my_carols', { page: 7 }); eq(o.carols.length, 0);
    o = await good(ANN, 'carol', { id: A1 }); eq(o.carol.id, A1); eq(o.carol.photos.length, 0); eq(o.carol.photos_room, CFG.limits.photosPerCarol); eq(o.carol.song.takes.length, 0); eq(o.carol.video, 'none yet'); eq(o.carol.card_page, '');
    await refused(ANN, 'carol', { id: 'cNOTACAROL' }, /no such carol/); await refused(ANN, 'carol', { id: '../../etc' }, /no such carol/); await refused(ANN, 'carol', {}, /no such carol/);
    o = await good(ANN, 'set_details', { id: A1, details: 'She just ran her first marathon. The kids painted a blue sign. Biscuit the dog ran the last mile.', must_include: 'our marathon girl' }); ok(/Biscuit/.test(o.carol.details)); eq(o.carol.must_include, 'our marathon girl'); await refused(ANN, 'set_details', { id: A1 }, /at least one/);
    // the product's writer: written, written again, and declined
    await refused(ANN, 'set_text', { id: A1, title: 'Too soon' }, /no words yet/); await refused(ANN, 'make_song', { id: A1 }, /Write the words first/); await refused(ANN, 'share_links', { id: A1 }, /not ready/);
    const a0 = F.agent.length; o = await good(ANN, 'write_lyrics', { id: A1 }); eq(o.written, true); eq(F.agent.length, a0 + 1, 'one call to the writer'); ok(/FOR: Maya/.test(F.agent[a0].messages[0].content) && /Biscuit/.test(F.agent[a0].messages[0].content), 'with what was said');
    eq(o.carol.title, 'A Carol for Maya'); eq(o.carol.lyrics.length, 2); eq(o.carol.rewrites_left, CFG.limits.rewritesPerCarol); ok(o.carol.card_name, 'it has a card name now'); ok(o.carol.music.styles.length && o.carol.music.bpm);
    o = await good(ANN, 'write_lyrics', { id: A1, ask: 'funnier' }); eq(o.carol.rewrites_left, CFG.limits.rewritesPerCarol - 1, 'a rewrite is counted'); ok(/funnier/.test(o.carol.lyrics[0].lines[2])); ok(/ANOTHER TAKE: funnier/.test(F.agent[a0 + 1].messages[0].content));
    await good(ANN, 'set_details', { id: A2, details: 'Make it to the tune of a song everybody knows.' }); o = await good(ANN, 'write_lyrics', { id: A2 }); eq(o.written, false); eq(o.refused, true); ok(/can.t write that one/.test(o.why), 'the writer declines, and says so'); eq((await good(ANN, 'carol', { id: A2 })).carol.lyrics.length, 0);
    await good(ANN, 'set_details', { id: A2, details: 'He makes the best pancakes.' });
    // THE LIMITS ARE THE SITE'S, per account, whichever door: free drafts
    eq((await good(ANN, 'my_account')).free_drafts_left, 2, 'one free draft is used');
    const viaSite = async function (who, to) { const c = (await T.call('POST', '/api/cards', { template: TPL, answers: { to: to } }, who)).json.card; return { id: c.id, r: await T.call('POST', '/api/cards/' + c.id + '/write', {}, who) }; };
    eq((await viaSite(annWho, 'Site One')).r.status, 200, 'a second draft, written on the site'); eq((await good(ANN, 'my_account')).free_drafts_left, 1, 'the connector sees it');
    o = await good(ANN, 'write_lyrics', { id: A2 }); eq(o.written, true, 'the third, through the connector'); eq((await good(ANN, 'my_account')).free_drafts_left, 0);
    const fourth = await good(ANN, 'start_carol', { for: 'Fourth', template: TPL, idempotency_key: key() }), a1 = F.agent.length; o = await good(ANN, 'write_lyrics', { id: fourth.carol.id }); eq(o.written, false, 'the fourth is refused through the connector'); ok(/drafted 3 carols for free/.test(o.why) && /Buy a pack/.test(o.why), 'in the site\'s own sentence'); eq(o.buy_url, SITE + '/make?buy=1&card=' + fourth.carol.id); ok(/set_lyrics/.test(o.note)); eq(F.agent.length, a1, 'and the writer was not called');
    const onSite = await viaSite(annWho, 'Site Two'); eq(onSite.r.status, 402, 'and on the site, the same'); ok(/drafted 3 carols/.test(onSite.r.json.error));
    // ... rewrites of one carol, and the writer's calls in a day
    await limits({ rewritesPerCarol: 1 }); await refused(ANN, 'write_lyrics', { id: A1, ask: 'shorter' }, /1 rewrites of this carol/); await limits({ agentCallsPerDay: 6 });
    eq((await good(ANN, 'my_account')).left_today.writer_calls, 1, 'five calls today, by both doors'); o = await good(ANN, 'write_lyrics', { id: A1, ask: 'warmer' }); eq(o.written, true, 'the sixth');
    await refused(ANN, 'write_lyrics', { id: A1, ask: 'again' }, /back tomorrow/); eq((await T.call('POST', '/api/cards/' + A1 + '/write', { ask: 'again' }, annWho)).status, 429, 'the site says the same'); await limits(null);
    eq((await good(ANN, 'delete_carol', { id: fourth.carol.id, confirm: true })).deleted, true); await T.call('DELETE', '/api/cards/' + onSite.id, null, annWho);
  });

  await section('5. Words written with the person: set_lyrics (shape, fit, refusals), set_text, set_music', async function () {
    const a0 = F.agent.length, led0 = await count('SELECT COUNT(*) AS n FROM ledger'), doc0 = (await db.get('SELECT doc FROM cards WHERE id = ?', [A1])).doc;
    const bad = async function (lyrics, re, more) { const t = await refused(ANN, 'set_lyrics', Object.assign({ id: A1, lyrics: lyrics }, more), re); ok(/^Not saved\. /.test(t), 'a refusal is one plain sentence to act on'); return t; };
    const with1 = function (line) { return [{ section: 'verse', lines: LYRICS[0].lines.slice(0, 3).concat([line]) }, LYRICS[1]]; };
    // the shape
    await bad('la la la', /list of sections/); await bad([], /list of sections/); await bad([{ section: 'bridge', lines: ['a b c'] }], /"verse" or a "hook"/); await bad([{ section: 'verse', lines: 'one two' }], /"lines" as a list/); await bad([{ section: 'verse', lines: [1, 2, 3, 4] }], /Every line is a string/);
    await bad([{ section: 'verse', lines: ['Only one line here', 'And then a second line', 'A third'] }], /3 lines.*at least 4/); await bad([{ section: 'verse', lines: Array.from({ length: 11 }, function (x, i) { return 'Line number ' + i + ' of the song'; }) }], /11 lines, and 10 is the most/);
    await bad(with1('This line goes on and on and on about the marathon and the weather too'), /Line 4 is 7\d characters.*at most 64/); await bad(with1('[Chorus] sing it loud'), /brackets/); await bad(Array.from({ length: 7 }, function () { return { section: 'verse', lines: ['a line'] }; }), /7 sections/);
    // does it fit the time it gets?
    await bad(with1('Extraordinarily unbelievably magnificently superb'), /Line 4 .* has about \d+ syllables, and it gets [\d.]+ seconds/);
    // what a carol never says: each said in a sentence, and nothing saved
    await bad(with1('Maya you are such a loser'), /putting a person down \("loser"\).*Gentle teasing/); await bad(with1('You look so sexy in your running shorts'), /sexual content \("sexy"\)/); await bad(with1('The kids got drunk on birthday punch'), /a child beside something that is not for children \("drunk"\)/);
    await bad(with1('All I want for Christmas is you'), /a line from a song that belongs to somebody/); await bad(with1('Jingle bells, jingle bells, Maya on the way'), /well-known old song/); await bad(with1('Sing it to the tune of our old song'), /tune or the words of an existing song/);
    await bad(with1('We danced all night to Taylor Swift'), /names an artist or a band \("taylor swift"\)/); await bad(with1('What a fucking great big day'), /Carols are clean/); await bad(LYRICS, /The title has sexual content/, { title: 'Sexy Maya' }); await bad(LYRICS, /The sign-off is 8\d characters.*at most 70/, { signoff: 'x'.repeat(81) });
    ok(/retard/.test(await bad(with1('Do not be a retard about it'), /word of hate/)));
    eq((await db.get('SELECT doc FROM cards WHERE id = ?', [A1])).doc, doc0, 'after all those refusals the carol is as it was');
    // a line may name an aunt called Adele, a trip to Disney, a beer for Dad
    let o = await good(ANN, 'set_lyrics', { id: A1, lyrics: with1('Aunt Adele brought a cold beer for Dad'), idempotency_key: key() }); eq(o.saved, true, 'everyday words are not refused');
    // saved: the words, how long they sing, and nothing of the writer's used
    o = await good(ANN, 'set_lyrics', { id: A1, lyrics: LYRICS, title: 'Marathon Maya', greeting: 'Happy birthday, Maya!', signoff: 'Love, Sam and the kids' }); eq(o.saved, true); ok(o.sings_in_seconds >= CFG.video.minSec && o.sings_in_seconds <= CFG.video.maxSec, 'they sing in ' + o.sings_in_seconds + ' seconds'); eq(o.tempo_bpm, 120);
    eq(o.carol.title, 'Marathon Maya'); eq(o.carol.greeting, 'Happy birthday, Maya!'); eq(o.carol.signoff, 'Love, Sam and the kids'); eq(JSON.stringify(o.carol.lyrics), JSON.stringify(LYRICS)); eq(o.carol.rewrites_left, CFG.limits.rewritesPerCarol - 2, 'no rewrite is counted');
    eq(F.agent.length, a0, 'the writer was not called'); eq(await count('SELECT COUNT(*) AS n FROM ledger'), led0, 'and nothing was spent on it'); eq((await T.call('GET', '/api/cards/' + A1, null, annWho)).json.card.script.title, 'Marathon Maya', 'the site shows the same carol');
    // on a carol with no words at all: the card is written around the lines
    const fresh = await good(ANN, 'start_carol', { for: 'Grandpa Joe', from: 'Nora', occasion: 'thanks', idempotency_key: key() }); o = await good(ANN, 'set_lyrics', { id: fresh.carol.id, lyrics: [{ section: 'verse', lines: ['Grandpa Joe you fixed my bike', 'You taught me how to fly a kite', 'You always save the crust for me', 'And tell the best old stories'] }, { section: 'hook', lines: ['Thank you, Grandpa, thank you so', 'More than you will ever know'] }] });
    eq(o.carol.title, 'A Carol for Grandpa Joe'); eq(o.carol.greeting, 'Thank you, Grandpa Joe!'); eq(o.carol.signoff, 'With love, Nora'); ok(/^nora-20\d\d/.test(o.carol.card_name), 'with a card name'); ok(o.carol.music.styles.length >= 3, 'and the template\'s music direction');
    eq((await good(ANN, 'my_account')).free_drafts_left, 0, '(it is not one of the writer\'s free drafts)'); eq((await good(ANN, 'delete_carol', { id: fresh.carol.id, confirm: true })).deleted, true);
    // set_text
    await refused(ANN, 'set_text', { id: A1 }, /at least one/); await refused(ANN, 'set_text', { id: A1, title: 'x'.repeat(57) }, /The title is 57 characters.*at most 56/); await refused(ANN, 'set_text', { id: A1, greeting: 'Hello you idiot' }, /putting a person down/); await refused(ANN, 'set_text', { id: A1, title: '' }, /needs a title/);
    o = await good(ANN, 'set_text', { id: A1, greeting: 'Happy 30th, Maya!', signoff: 'All our love, Sam and the kids' }); eq(o.carol.greeting, 'Happy 30th, Maya!'); eq(o.carol.signoff, 'All our love, Sam and the kids'); eq(o.carol.title, 'Marathon Maya', 'what was not sent stays');
    // set_music: plain descriptions only
    const m0 = (await good(ANN, 'carol', { id: A1 })).carol.music;
    for (const x of [[{ styles: ['pop', 'in the style of Taylor Swift', 'drums'] }, /cannot point at an artist/], [{ styles: ['warm folk', 'beatles harmonies', 'piano'] }, /names an artist, a band or a composer \("beatles"\)/], [{ notes: 'Make it sound like Mariah Carey at Christmas' }, /cannot point at an artist/], [{ styles: ['pop', 'drums', 'jingle bell rock'] }, /names or quotes an existing song/],
      [{ voices: 'Elvis' }, /names an artist/], [{ notes: 'Like "Happy" but slower' }, /cannot point at an artist/], [{ bpm: 300 }, /60 to 180/], [{ styles: ['one'] }, /3 to 10/], [{ styles: 'folk' }, /list of 3 to 10/], [{ voices: 'v'.repeat(161) }, /at most 160/], [{}, /at least one/]]) await refused(ANN, 'set_music', Object.assign({ id: A1 }, x[0]), x[1]);
    eq(JSON.stringify((await good(ANN, 'carol', { id: A1 })).carol.music), JSON.stringify(m0), 'after all those refusals the music direction is as it was');
    o = await good(ANN, 'set_music', { id: A1, styles: ['bouncy ukulele pop', 'hand claps', 'whistling', 'upright bass'], bpm: 112, voices: 'bright female lead with a kids\' choir on the hook' }); eq(o.carol.music.bpm, 112); eq(o.carol.music.styles[0], 'bouncy ukulele pop'); ok(/kids' choir/.test(o.carol.music.voices)); eq(o.carol.music.notes, m0.notes, 'what was not sent stays');
    await refused(ANN, 'change_template', { id: A1, template: 'nope' }, /no template/); o = await good(ANN, 'change_template', { id: A1, template: BDAY === 'birthday-bash' ? 'birthday-spotlight' : BDAY }); ok(/set_music \{ use_template: true \}/.test(o.note)); eq(o.carol.music.bpm, 112, 'the look changed, the music direction stayed');
    o = await good(ANN, 'set_music', { id: A1, use_template: true }); eq(o.carol.music.bpm, Templates.get(o.carol.template.id).music.bpm, 'use_template takes the look\'s own sound'); o = await good(ANN, 'change_template', { id: A1, template: 'birthday-bash' }); eq(o.carol.template.id, 'birthday-bash'); await good(ANN, 'set_music', { id: A1, use_template: true });
  });

  let B = null, P1 = null;
  await section('6. Photos: the upload link (short-lived, one carol, the rights tick), arranging, removing', async function () {
    let o = await good(ANN, 'add_photos', { id: A1 }); eq(o.room, CFG.limits.photosPerCarol); eq(o.good_for_minutes, 30); ok(/tick/.test(o.how)); const url = o.upload_url.replace(SITE, ''), tok = url.split('/').pop(); ok(/^\/mcp\/photos\/[\w-]+\.[\w-]{32}$/.test(url), 'a link of the product\'s own');
    let r = await T.call('GET', url); eq(r.status, 200, 'the upload page, for whoever holds the link'); ok(/These are photos I may use\./.test(r.text) && /type="checkbox" id="ok"/.test(r.text) && /parent or guardian/.test(r.text), 'with the rights tick, in the site\'s words'); ok(/accept="image\/jpeg,image\/png,image\/webp,image\/heic/.test(r.text) && / multiple /.test(r.text), 'camera or library, HEIC too');
    eq(r.heads['x-frame-options'], 'DENY'); eq(r.heads['referrer-policy'], 'no-referrer'); eq(r.heads['cache-control'], 'no-store'); ok(r.text.indexOf('google:101') < 0 && r.text.indexOf('ann@') < 0, 'it says nothing of the account');
    r = await T.call('GET', url + '/list'); eq(r.status, 200); eq(r.json.title, 'Maya'); eq(r.json.room, 8); eq(r.json.photos.length, 0);
    // THE TICK: nothing comes in without it
    const png = T.photo(3, 600, 800), up = function (u, more, body) { return T.call('POST', u, body || png, Object.assign({ 'content-type': 'image/png' }, more)); };
    for (const h of [{}, { 'x-photos-ok': 'no' }, { 'x-photos-ok': '' }]) { r = await up(url, h); eq(r.status, 400, 'a photo without the tick is refused'); ok(/Tick the box first/.test(r.json.error)); }
    eq(await count('SELECT COUNT(*) AS n FROM photos WHERE card = ?', [A1]), 0, 'and none was kept');
    r = await up(url, { 'x-photos-ok': 'yes' }); eq(r.status, 200, r.text); eq(r.json.ok, true); P1 = r.json.photo.id; eq(r.json.photo.w, 600); ok(!r.json.photo.url && !/cards\//.test(r.text), 'no storage key in the answer');
    r = await up(url, { 'x-photos-ok': 'yes' }, Buffer.from('this is not a photo at all, it is a sentence')); eq(r.status, 415, 'the site\'s own checks hold'); ok(/JPEG, PNG, WebP or HEIC/.test(r.json.error));
    r = await T.call('GET', url + '/list'); eq(r.json.photos.length, 1); eq(r.json.room, 7); r = await T.call('GET', r.json.photos[0].url); eq(r.status, 200, 'the page shows what arrived'); eq(r.heads['content-type'], 'image/jpeg'); ok(r.body.length > 1000);
    // one carol only, for a while only
    const other = (await good(ANN, 'add_photos', { id: A2 })).upload_url.split('/').pop(), parts = tok.split('.'), forged = Buffer.from(JSON.stringify(['u', A2, Date.now() + 6e5])).toString('base64url') + '.' + parts[1];
    r = await up('/mcp/photos/' + forged, { 'x-photos-ok': 'yes' }); eq(r.status, 403, 'a link changed to name another carol is refused'); ok(/run out, or is not one of ours/.test(r.json.error));
    for (const t of [C.seal('u', A1, -1), C.seal('v', A1, 30), C.seal('u', 'cNOTACAROL', 30), parts[0] + '.' + 'A'.repeat(32), 'made-up', parts[0]]) { eq((await up('/mcp/photos/' + t, { 'x-photos-ok': 'yes' })).status, 403, 'refused: a link that ran out, of another kind, or made up'); eq((await T.call('GET', '/mcp/photos/' + t)).status, 403); eq((await T.call('GET', '/mcp/photos/' + t + '/list')).status, 403); }
    eq((await T.call('GET', '/mcp/photos/' + other + '/photo/' + P1)).status, 404, 'A2\'s link does not show A1\'s photo'); eq(await count('SELECT COUNT(*) AS n FROM photos WHERE card = ?', [A2]), 0); eq(await count('SELECT COUNT(*) AS n FROM photos WHERE card = ?', [A1]), 1, 'A1 has the one photo it was sent');
    ok(/This link has run out/.test((await T.call('GET', '/mcp/photos/' + C.seal('u', A1, -1))).text), 'a link that ran out says so on a page');
    // THE UPLOAD PAGE IN A BROWSER: tick, choose, sent
    B = await K.browser(T);
    if (!B) say('   SKIPPED the upload page in a browser: Playwright is not here (set NODE_PATH or PLAYWRIGHT_PATH)');
    else {
      const X = await B.context({ mobile: true }), page = await X.page(url); await page.waitForFunction(function () { return document.getElementById('for').textContent === 'Maya'; });
      eq(await page.locator('#count').textContent(), '1 of 8 added'); eq(await page.locator('#files').isDisabled(), true, 'before the tick the chooser is shut'); await page.locator('#choose').click({ force: true }); eq(await page.locator('#say').textContent(), 'Tick the box first: these must be photos you may use.');
      await page.locator('#ok').check(); eq(await page.locator('#files').isDisabled(), false, 'ticked: it opens');
      await page.locator('#files').setInputFiles([{ name: 'one.png', mimeType: 'image/png', buffer: T.photo(4, 800, 600) }, { name: 'two.png', mimeType: 'image/png', buffer: T.photo(5, 600, 800) }]);
      await page.waitForFunction(function () { return /2 photos added/.test(document.getElementById('say').textContent); }, null, { timeout: 20000 });
      eq(await page.locator('#count').textContent(), '3 of 8 added'); eq(await page.locator('#done').isVisible(), true, 'and it says to go back to Claude'); eq(await page.locator('#grid img').count(), 3);
      await page.waitForFunction(function () { return Array.from(document.querySelectorAll('#grid img')).every(function (i) { return i.complete && i.naturalWidth > 0; }); }); eq(X.errors.join(' | '), '', 'no error on the page');
      ok(X.log.filter(function (l) { return l.m === 'POST'; }).every(function (l) { return l.p === url; }), 'it sent only to its own link'); await X.ctx.close();
    }
    if (!B) for (const s of [4, 5]) eq((await up(url, { 'x-photos-ok': 'yes' }, T.photo(s, s === 4 ? 800 : 600, s === 4 ? 600 : 800))).status, 200);
    // what arrived, in the chat
    o = await good(ANN, 'carol', { id: A1 }); eq(o.carol.photos.length, 3, 'carol shows what arrived'); eq(o.carol.photos_room, 5); const ids = o.carol.photos.map(function (p) { return p.id; }); eq(ids[0], P1); eq(o.carol.photos[1].width, 800); eq(o.carol.photos[0].caption, '');
    r = await T.call('GET', o.carol.photos[0].view_url.replace(SITE, '')); eq(r.status, 200, 'with a link to look at each'); eq(r.heads['content-type'], 'image/jpeg');
    // arranging
    await refused(ANN, 'arrange_photos', { id: A1, photos: [] }, /in the order/); await refused(ANN, 'arrange_photos', { id: A1, photos: [{ photo: 'pNOPE' }] }, /no photo "pNOPE"/); await refused(ANN, 'arrange_photos', { id: A1, photos: [{ photo: ids[0] }, { photo: ids[0] }] }, /twice/);
    await refused(ANN, 'arrange_photos', { id: A1, photos: [{ photo: ids[0], position: { x: 2, y: 0.5, zoom: 1 } }] }, /x and y from 0 to 1/); await refused(ANN, 'arrange_photos', { id: A1, photos: [{ photo: ids[0], caption: 'c'.repeat(41) }] }, /at most 40/); await refused(ANN, 'arrange_photos', { id: A2, photos: [{ photo: ids[0] }] }, /no photos yet/);
    o = await good(ANN, 'arrange_photos', { id: A1, photos: [{ photo: ids[2], caption: 'At the finish line', one_person: true, position: { x: 0.5, y: 0.3, zoom: 1.4 } }, { photo: ids[0] }] });
    eq(o.carol.photos.map(function (p) { return p.id; }).join(), [ids[2], ids[0], ids[1]].join(), 'the order asked for, then the rest'); eq(o.carol.photos[0].caption, 'At the finish line'); eq(o.carol.photos[0].one_person, true); eq(JSON.stringify(o.carol.photos[0].position), '{"x":0.5,"y":0.3,"zoom":1.4}'); eq(o.carol.photos[1].position, null);
    o = await good(ANN, 'arrange_photos', { id: A1, photos: [{ photo: ids[2], one_person: false, position: null }] }); eq(o.carol.photos[0].one_person, false); eq(o.carol.photos[0].position, null); eq(o.carol.photos[0].caption, 'At the finish line', 'the caption stays');
    await refused(ANN, 'set_text', { id: A1, captions: [{ photo: ids[0], caption: LYRICS[1].lines[0] }] }, /repeats a line of the song/); await refused(ANN, 'set_text', { id: A1, captions: [{ photo: 'pNOPE', caption: 'x' }] }, /no photo/);
    o = await good(ANN, 'set_text', { id: A1, captions: [{ photo: ids[0], caption: 'Mile twenty' }] }); eq(o.carol.photos[1].caption, 'Mile twenty'); eq(o.carol.photos[0].caption, 'At the finish line');
    await refused(ANN, 'remove_photo', { id: A1, photo: 'pNOPE' }, /no photo/); o = await good(ANN, 'remove_photo', { id: A1, photo: ids[1] }); eq(o.removed, true); eq(o.carol.photos.length, 2); eq(await count('SELECT COUNT(*) AS n FROM photos WHERE card = ?', [A1]), 2);
    // a carol that is full gives no link
    await limits({ photosPerCarol: 2 }); await refused(ANN, 'add_photos', { id: A1 }, /already has 2 photos/); eq((await up(url, { 'x-photos-ok': 'yes' })).status, 409, 'and the page\'s link is held to the same'); await limits(null);
  });

  // a stand-in for the app that shows the panel: it answers the page's hello, hands it tool results, and passes the page's own tool calls on
  let host = null;
  async function openPanel(html, callTool) {
    const X = await B.context({ viewport: { width: 520, height: 900 }, scale: 1 }), page = await X.page('/robots.txt'), seen = [], calls = [];
    await page.exposeFunction('hostSaw', function (m) { seen.push(m); }); await page.exposeFunction('hostCall', async function (name, args) { calls.push(name); return callTool(name, args); });
    await page.evaluate(function (h) {
      const f = document.createElement('iframe'); f.id = 'panel'; f.setAttribute('sandbox', 'allow-scripts'); f.style.cssText = 'width:480px;height:860px;border:0'; f.srcdoc = h; document.body.appendChild(f);
      window.toPanel = function (m) { f.contentWindow.postMessage(m, '*'); };
      window.addEventListener('message', function (e) {
        if (e.source !== f.contentWindow) return; const m = e.data || {}; window.hostSaw(m.method || 'answer');
        if (m.method === 'ui/initialize') window.toPanel({ jsonrpc: '2.0', id: m.id, result: { protocolVersion: m.params.protocolVersion, hostInfo: { name: 'test-host', version: '1' }, hostCapabilities: { serverTools: {}, openLinks: {} }, hostContext: {} } });
        else if (m.method === 'tools/call') window.hostCall(m.params.name, m.params.arguments).then(function (r) { window.toPanel({ jsonrpc: '2.0', id: m.id, result: r }); });
        else if (m.id !== undefined && m.method) window.toPanel({ jsonrpc: '2.0', id: m.id, result: {} });
      });
    }, html);
    const frame = async function () { for (let i = 0; i < 100; i++) { const f = page.frames().find(function (x) { return x !== page.mainFrame(); }); if (f) return f; await sleep(50); } throw new Error('the frame did not open'); };
    const f = await frame(); await f.waitForFunction(function () { return !!(window.SAC_PLAYER && window.SAC_BRIDGE); }, null, { timeout: 20000 });
    for (let i = 0; i < 100 && seen.indexOf('ui/notifications/initialized') < 0; i++) await sleep(50);
    return { X: X, page: page, f: f, seen: seen, calls: calls, give: function (result) { return page.evaluate(function (r) { window.toPanel({ jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: r }); }, result); } };
  }
  await section('7. Seeing it: preview_carol, its link, and the panel in a sandboxed frame with no storage', async function () {
    const x = await tool(ANN, 'preview_carol', { id: A1 }); ok(!x.bad, x.text); used.preview_carol = 1; const o = x.out, p = o.preview;
    eq(o.id, A1); eq(o.title, 'Marathon Maya'); ok(/Silent preview on the template's tempo: no song yet/.test(o.showing)); eq(p.engine.title, 'Marathon Maya'); eq(p.engine.timing, null, 'no song yet: the template\'s own tempo'); eq(p.template.id, 'birthday-bash'); eq(p.photos.length, 2); eq(p.song, null); eq(o.poster, undefined);
    ok(x.text.indexOf('"preview":') < 0 && x.text.indexOf('preview_url') > 0 && x.text.length < 1500, 'what Claude reads is short: the link, not what the page draws from');
    let r = await T.call('GET', o.preview_url.replace(SITE, '')); eq(r.status, 200, 'the link plays it, for a client with no panel'); ok(/\/engine\.js\?v=/.test(r.text) && /\/data"/.test(r.text) && /id="cv"/.test(r.text)); eq(r.heads['referrer-policy'], 'no-referrer');
    r = await T.call('GET', o.preview_url.replace(SITE, '') + '/data'); eq(r.status, 200); eq(r.json.preview.engine.title, 'Marathon Maya'); eq(r.json.preview.photos.length, 2); ok(/^\/mcp\/media\//.test(r.json.preview.photos[0].url));
    r = await T.call('GET', p.photos[0].url.replace(SITE, '')); eq(r.status, 200, 'a photo behind the preview\'s link'); eq(r.heads['content-type'], 'image/jpeg'); eq(r.heads['access-control-allow-origin'], '*');
    const vt = p.photos[0].url.split('/')[5]; eq((await T.call('GET', '/mcp/media/' + vt + '/photo/pNOTMINE1')).status, 404, 'only this carol\'s photos'); eq((await T.call('GET', '/mcp/media/' + C.seal('v', A1, -1) + '/photo/' + P1)).status, 403, 'a link that ran out'); eq((await T.call('GET', '/mcp/media/' + C.seal('u', A1, 30) + '/photo/' + P1)).status, 403, 'an upload link is not a preview link');
    eq((await T.call('GET', '/mcp/preview/' + C.seal('v', A1, -1))).status, 403); eq((await T.call('GET', '/mcp/preview/nope/data')).status, 403); eq((await T.call('POST', o.preview_url.replace(SITE, ''), {})).status, 404, 'a preview link only reads');
    r = await T.call('GET', '/mcp/fonts/Lobster-Regular.ttf'); eq(r.status, 200, 'the fonts, for a page elsewhere'); eq(r.heads['access-control-allow-origin'], '*'); eq((await T.call('GET', '/mcp/fonts/..%2Fserver.js')).status, 404);
    // the panel: one self-contained page
    const html = C.panelHtml(); ok(html.length > 400000, 'the panel is one page (' + Math.round(html.length / 1024) + ' kB)'); ok(!/<script[^>]+src=/.test(html) && !/<link[^>]+href=/.test(html) && !/<img/.test(html), 'that asks for no script, stylesheet or picture of its own');
    ok(html.indexOf('CarolEngine') > 0 && html.indexOf('McpApp') > 0 && html.indexOf('callServerTool') > 0 && html.indexOf('ontoolresult') > 0, 'the engine and the bridge are in it'); ok(!/localStorage|sessionStorage|indexedDB|document\.cookie/.test(html.replace(fs.readFileSync(path.join(ROOT, 'mcp-app.js'), 'utf8'), '')), 'and it keeps nothing in the browser');
    Object.values(SECRET).concat(['test-secret', ANN]).forEach(function (s) { ok(html.indexOf(s) < 0, 'no secret in the panel'); });
    if (!B) { await good(ANN, 'set_text', { id: A1, title: 'Maya Runs the World' }); return say('   SKIPPED the panel in a browser: Playwright is not here (set NODE_PATH or PLAYWRIGHT_PATH)'); }
    const result = async function (name, args) { const y = (await mcp(rpc(++n, 'tools/call', { name: name, arguments: args }), ANN)).json.result; return y; };
    host = await openPanel(html, result); const f = host.f;
    ok(host.seen.indexOf('ui/initialize') >= 0 && host.seen.indexOf('ui/notifications/initialized') >= 0, 'the page says hello to its host');
    eq(await f.evaluate(function () { try { window.localStorage.getItem('x'); return 'storage'; } catch (e) { return e.name; } }), 'SecurityError', 'the frame has no storage'); eq(await f.evaluate(function () { return location.origin; }), 'null', 'and no origin of the site\'s');
    await host.give(await result('preview_carol', { id: A1 }));
    await f.waitForFunction(function () { const s = window.SAC_PLAYER.state; return s.card && s.drew > 20 && s.images.filter(Boolean).length === 2; }, null, { timeout: 20000 });
    const st = await f.evaluate(function () { const s = window.SAC_PLAYER.state; return { title: document.getElementById('title').textContent, status: document.getElementById('status').textContent, error: s.error, why: s.why || '', tpl: window.CarolTemplates.list.map(function (t) { return t.id; }).join(), sound: document.getElementById('sound').hidden, w: document.getElementById('cv').width, at: s.at }; });
    eq(st.error + st.why, '', 'it draws without an error'); eq(st.title, 'Marathon Maya'); ok(/no song yet/.test(st.status)); eq(st.tpl, 'birthday-bash', 'with the one template it was handed'); eq(st.sound, true, 'no sound button before there is a song'); ok(st.w >= 300);
    const t1 = st.at; await sleep(600); ok(await f.evaluate(function () { return window.SAC_PLAYER.state.at; }) !== t1, 'it is playing, silently, on the template\'s tempo');
    await f.waitForFunction(function () { return document.fonts.check('20px "CT Lobster"'); }, null, { timeout: 15000 }); ok(true, 'the product\'s fonts are loaded from the site');
    // (pixels: a carol with no photos, so the canvas may be read)
    const plain = await good(ANN, 'start_carol', { for: 'Pixel', template: 'birthday-bash', idempotency_key: key() }); await good(ANN, 'set_lyrics', { id: plain.carol.id, lyrics: LYRICS });
    const h2 = await openPanel(html, result); await h2.give(await result('preview_carol', { id: plain.carol.id })); await h2.f.waitForFunction(function () { return window.SAC_PLAYER.state.drew > 30; }, null, { timeout: 20000 });
    const px = await h2.f.evaluate(function () { const c = document.getElementById('cv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, seen = {}; for (let i = 0; i < d.length; i += 4 * 97) seen[(d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4)] = 1; return Object.keys(seen).length; }); ok(px > 12, 'the card is really drawn (' + px + ' colours in the frame)');
    await h2.X.ctx.close(); await good(ANN, 'delete_carol', { id: plain.carol.id, confirm: true });
    // it follows the chat: an edit made through the connector shows, asked for by the page through its bridge
    await good(ANN, 'set_text', { id: A1, title: 'Maya Runs the World' });
    await f.waitForFunction(function () { return document.getElementById('title').textContent === 'Maya Runs the World'; }, null, { timeout: 15000 }); ok(host.calls.length >= 1 && host.calls.every(function (c) { return c === 'preview_carol'; }), 'the page asked again by itself, through the connector\'s own tool (' + host.calls.length + ' times)');
    eq((await f.evaluate(function () { return window.SAC_BRIDGE.tool('preview_carol', { id: 'cNOTACAROL' }).then(function () { return 'ok'; }, function (e) { return e.message; }); })).replace(/^Could not do that: /, '').slice(0, 23), 'There is no such carol.', 'a tool\'s refusal reaches the page as its sentence');
    const asked = host.X.log.map(function (l) { return l.p; }).filter(function (pth) { return pth !== '/robots.txt' && pth !== '/favicon.ico' && pth !== '/favicon.svg'; }); ok(asked.length >= 3 && asked.every(function (pth) { return /^\/mcp\/(fonts|media)\//.test(pth); }), 'and the page asked the site only for fonts and this carol\'s photos (' + asked.length + ' requests)');
    eq(host.X.errors.join(' | '), '', 'no error in the frame');
  });

  let J1;
  await section('8. Making it: the confirm gate on a credit, once with a repeated key, status, takes, the video', async function () {
    const jobs = function () { return count('SELECT COUNT(*) AS n FROM jobs WHERE card = ?', [A1]); }, bal = function () { return S.balance('google:101'); };
    // no credits: the buy link, and nothing else
    for (const args of [{ id: A1 }, { id: A1, confirm: true, idempotency_key: key() }]) { const o = await good(ANN, 'make_song', args); eq(o.started, false); eq(o.nothing_done, true); ok(/takes one carol credit, and this account has none/.test(o.why)); eq(o.buy_url, SITE + '/make?buy=1&card=' + A1); eq(o.packs.length, 3); ok(/cannot pay or give credits/.test(o.note)); }
    eq(await jobs(), 0, 'no job'); eq(F.music.length, 0, 'the music service was not asked'); eq(F.stripe.asked.length, 0, 'nor Stripe'); eq(await bal(), 0);
    // three credits, given by the admin (the admin's own door: the connector cannot)
    let r = await T.call('POST', '/mcp?admin=' + SECRET.ADMIN_MCP_KEY, rpc(1, 'tools/call', { name: 'admin_grant', arguments: { uid: 'google:101', credits: 3, reason: 'for the connector test' } }), ip(33)); eq(r.status, 200, r.text); ok(!r.json.result.isError, r.text); eq(await bal(), 3);
    // without confirm: exactly what will happen, and nothing happens
    let o = await good(ANN, 'make_song', { id: A1 }); eq(o.started, false); eq(o.nothing_done, true); eq(o.needs_the_persons_yes, true); ok(/^This uses 1 of your 3 credits\. The song takes about a minute/.test(o.what_will_happen), o.what_will_happen); ok(/does not come back/.test(o.what_will_happen));
    eq(o.credits, 3); eq(o.credits_after, 2); eq(JSON.stringify(o.words_to_be_sung), JSON.stringify(LYRICS), 'with the words that will be sung'); ok(/confirm: true/.test(o.ask));
    for (const c of [false, 'true', 1, 'yes', null]) { o = await good(ANN, 'make_song', { id: A1, confirm: c, idempotency_key: key() }); eq(o.nothing_done, true, 'only confirm: true is a yes (' + JSON.stringify(c) + ')'); }
    eq(await bal(), 3, 'no credit was spent'); eq(await jobs(), 0, 'no job was made'); eq(F.music.length, 0); eq((await good(ANN, 'carol', { id: A1 })).carol.song.paid_for, false);
    await refused(ANN, 'make_song', { id: A1, confirm: true }, /idempotency_key with confirm: true/); eq(await bal(), 3);
    // a music direction that names an artist is stopped before anything is spent
    await db.run('UPDATE cards SET doc = ? WHERE id = ?', [(await db.get('SELECT doc FROM cards WHERE id = ?', [A1])).doc.replace('"voices":"', '"voices":"like Frank Sinatra, '), A1]); await refused(ANN, 'make_song', { id: A1, confirm: true, idempotency_key: key() }, /cannot point at an artist|names an artist/); eq(await bal(), 3); await good(ANN, 'set_music', { id: A1, use_template: true });
    // with confirm: once
    const k = key(); o = await good(ANN, 'make_song', { id: A1, confirm: true, idempotency_key: k }); eq(o.started, true); eq(o.stage, 'queued'); eq(o.credits_left, 2); eq(await bal(), 2, 'one credit is spent'); eq(await jobs(), 1, 'one job');
    const twice = await good(ANN, 'make_song', { id: A1, confirm: true, idempotency_key: k }); eq(twice.replayed, true, 'the same key again: the first answer'); eq(twice.started, true); eq(await bal(), 2, 'and still one credit spent'); eq(await jobs(), 1, 'and still one job');
    o = await good(ANN, 'make_song', { id: A1, confirm: true, idempotency_key: key() }); eq(o.started, false, 'another key while it is being made: nothing more'); ok(/already being made/.test(o.why)); eq(await bal(), 2); eq(await jobs(), 1);
    o = await good(ANN, 'status', { id: A1 }); eq(o.stage, 'queued'); eq(o.state, 'draft'); ok(/15 seconds/.test(o.next)); o = await good(ANN, 'carol', { id: A1 }); eq(o.carol.video, 'being made'); eq(o.carol.song.paid_for, true); ok(/Being made: queued/.test(o.carol.where_it_is));
    o = await good(ANN, 'another_take', { id: A1, idempotency_key: key() }); eq(o.started, false, 'nor another take while it is being made'); eq(await jobs(), 1);
    await S.jobs.drain();   // (the song by the stand-in music service, the video rendered for real)
    eq(F.music.length, 1, 'the music service was asked once'); ok(F.music[0].body.composition_plan.chunks.some(function (c) { return /Maya ran the whole way round the town/.test(c.text); }), 'for the words that were confirmed'); ok(!/sinatra/i.test(JSON.stringify(F.music[0].body)));
    o = await good(ANN, 'status', { id: A1 }); eq(o.stage, 'ready'); eq(o.percent, 100); eq(o.state, 'ready'); ok(/^https:\/\/sendacarol\.test\/[a-z0-9-]+$/.test(o.card_page)); eq(o.video, 'ready');
    o = await good(ANN, 'carol', { id: A1 }); eq(o.carol.state, 'ready'); eq(o.carol.video, 'ready'); eq(o.carol.song.takes.length, 1); eq(o.carol.song.takes[0].chosen, true); eq(o.carol.song.takes_left, 2); ok(o.carol.song.takes[0].seconds >= 20);
    await refused(ANN, 'make_song', { id: A1, confirm: true, idempotency_key: key() }, /already has its song.*another_take/); eq(await bal(), 2);
    // the preview now has the song; the panel shows it
    const pv = (await tool(ANN, 'preview_carol', { id: A1 })).out; ok(/With its song/.test(pv.showing)); ok(pv.preview.engine.timing && pv.preview.engine.timing.beats.length > 10, 'the card is on the song\'s own beats'); eq(pv.poster, pv.preview.card_url + '/poster.jpg');
    r = await T.call('GET', pv.preview.song.url.replace(SITE, '')); eq(r.status, 200, 'the song behind the preview\'s link'); eq(r.heads['content-type'], 'audio/mp4'); eq(r.heads['access-control-allow-origin'], '*'); ok(r.body.length > 20000);
    r = await T.call('GET', pv.preview.song.url.replace(SITE, ''), null, { range: 'bytes=0-99' }); eq(r.status, 206, 'in ranges, as a player asks'); eq(r.body.length, 100);
    if (host) { await host.give((await mcp(rpc(++n, 'tools/call', { name: 'preview_carol', arguments: { id: A1 } }), ANN)).json.result); await host.f.waitForFunction(function () { return !document.getElementById('sound').hidden && !document.getElementById('open').hidden; }, null, { timeout: 15000 });
      const s2 = await host.f.evaluate(function () { const s = window.SAC_PLAYER.state; return { src: s.audio && s.audio.src, status: document.getElementById('status').textContent, open: document.getElementById('open').getAttribute('href'), err: s.error }; }); ok(/\/mcp\/media\/.+\/song\//.test(s2.src), 'the panel has the song, behind a button (a person presses it for sound)'); ok(/With its song/.test(s2.status)); eq(s2.open, pv.preview.card_url); eq(s2.err, ''); }
    // takes
    o = await good(ANN, 'takes', { id: A1 }); eq(o.takes.length, 1); eq(o.takes_left, 2); r = await T.call('GET', o.takes[0].listen_url.replace(SITE, '')); eq(r.status, 200, 'a link to listen to a take'); eq(r.heads['content-type'], 'audio/mp4');
    await refused(ANN, 'another_take', { id: A1 }, /idempotency_key/); await good(ANN, 'set_lyrics', { id: A1, lyrics: [LYRICS[0], { section: 'hook', lines: ['Happy birthday, Maya, hip hooray', 'Thirty looks like a holiday'] }] });
    const k2 = key(); o = await good(ANN, 'another_take', { id: A1, idempotency_key: k2 }); eq(o.started, true); eq(o.takes_left_after_this, 1); eq((await good(ANN, 'another_take', { id: A1, idempotency_key: k2 })).replayed, true); eq(await jobs(), 2, 'a repeated key: one more job, not two'); eq(await bal(), 2, 'another take spends no credit');
    await S.jobs.drain(); eq(F.music.length, 2); ok(/Thirty looks like a holiday/.test(JSON.stringify(F.music[1].body)), 'the new take sings the words as they are now');
    o = await good(ANN, 'another_take', { id: A1, idempotency_key: key() }); await S.jobs.drain(); o = await good(ANN, 'takes', { id: A1 }); eq(o.takes.length, 3); eq(o.takes_left, 0); eq(o.takes[2].chosen, true, 'the newest is the one playing');
    await refused(ANN, 'another_take', { id: A1, idempotency_key: key() }, /has had its 3 takes/); eq(F.music.length, 3); eq(await bal(), 2);
    await refused(ANN, 'choose_take', { id: A1, take: '9' }, /no such take/); o = await good(ANN, 'choose_take', { id: A1, take: '1' }); eq(o.started, true); eq(o.take.number, 1); await S.jobs.drain(); o = await good(ANN, 'takes', { id: A1 }); eq(o.takes[0].chosen, true, 'take 1 plays again');
    // the video and an edit after it
    o = await good(ANN, 'update_video', { id: A1 }); eq(o.started, false); ok(/up to date/.test(o.why)); o = await good(ANN, 'set_text', { id: A1, signoff: 'Run on, Maya. Love, all of us' }); ok(/older than the last edit/.test(o.carol.video), 'an edit makes the video stale, and carol says so');
    o = await good(ANN, 'update_video', { id: A1 }); eq(o.started, true); await S.jobs.drain(); eq((await good(ANN, 'carol', { id: A1 })).carol.video, 'ready'); eq(await bal(), 2, 'and none of that cost a credit');
    J1 = await jobs();
  });

  await section('9. Sharing: links, the card name, email with its confirm gate (once), take down, put back, delete', async function () {
    // the card's name, before it is shared
    for (const x of [['Admin', /used by the site itself/], ['a', /3 to 40 letters/], ['has spaces in it', /3 to 40 letters/]]) await refused(ANN, 'set_card_name', { id: A1, name: x[0] }, x[1]);
    let o = await good(ANN, 'set_card_name', { id: A1, name: 'Marathon-Maya-30' }); eq(o.card_name, 'marathon-maya-30'); eq(o.card_page, SITE + '/marathon-maya-30'); await refused(ANN, 'set_card_name', { id: A2, name: 'marathon-maya-30' }, /taken/);
    o = await good(ANN, 'share_links', { id: A1 }); eq(o.card_page, SITE + '/marathon-maya-30'); ok(/Sam and the kids made Maya a carol: https/.test(o.say));
    for (const k of ['card_page', 'video_tall', 'video_square', 'download_tall', 'poster', 'poster_tall', 'animated_preview']) { const r = await T.call('GET', o[k].replace(SITE, '')); eq(r.status, 200, k + ' is there: ' + o[k]); }
    ok((await T.call('GET', o.video_tall.replace(SITE, ''))).body.length > 20000, 'a real video'); eq((await good(ANN, 'carol', { id: A1 })).carol.shared, true); await refused(ANN, 'set_card_name', { id: A1, name: 'another-name-2026' }, /has been shared, so its name stays/);
    // EMAIL: nothing without a yes
    const sent0 = F.sent.length, sends = function () { return count('SELECT COUNT(*) AS n FROM sends WHERE card = ?', [A1]); }, TO = ['june@example.test', 'Otis@Example.test'];
    await refused(ANN, 'send_by_email', { id: A2, to: TO }, /not ready to send/); await refused(ANN, 'send_by_email', { id: A1, to: [] }, /at least one/); await refused(ANN, 'send_by_email', { id: A1, to: ['june@example.test', 'not an address'] }, /1 address of those does not look like/);
    await refused(ANN, 'send_by_email', { id: A1, to: Array.from({ length: CFG.limits.addressesPerSend + 1 }, function (x, i) { return 'p' + i + '@example.test'; }), confirm: true, idempotency_key: key() }, /at a time at most/); await refused(ANN, 'send_by_email', { id: A1, to: TO, note: 'you idiot', confirm: true, idempotency_key: key() }, /putting a person down/);
    let x = await tool(ANN, 'send_by_email', { id: A1, to: TO, note: 'Open it with the sound on.' }); o = x.out; eq(o.sent, 0); eq(o.nothing_done, true); eq(o.needs_the_persons_yes, true); ok(/will email "Maya Runs the World" to 2 people/.test(o.what_will_happen) && /don't email me again/.test(o.what_will_happen) && /Open it with the sound on/.test(o.what_will_happen)); ok(/people they know/.test(o.ask));
    for (const c of [false, 'yes', 1]) eq((await good(ANN, 'send_by_email', { id: A1, to: TO, confirm: c, idempotency_key: key() })).nothing_done, true);
    eq(F.sent.length, sent0, 'no email was sent'); eq(await sends(), 0, 'and nothing was kept'); await refused(ANN, 'send_by_email', { id: A1, to: TO, confirm: true }, /idempotency_key with confirm: true/); eq(F.sent.length, sent0);
    // with a yes: once
    const k = key(); x = await tool(ANN, 'send_by_email', { id: A1, to: TO, note: 'Open it with the sound on.', confirm: true, idempotency_key: k }); ok(!x.bad, x.text); used.send_by_email = 1; o = x.out; eq(o.sent, 2); eq(o.failed, 0); eq(F.sent.length, sent0 + 2, 'two emails'); eq(F.sent.slice(sent0).map(function (m) { return m.to[0]; }).sort().join(), 'june@example.test,otis@example.test');
    ok(/marathon-maya-30/.test(F.sent[sent0].html) && /Open it with the sound on/.test(F.sent[sent0].html), 'the carol and the note are in it'); ok(x.text.indexOf('june@') < 0 && x.text.indexOf('otis@') < 0, 'the answer does not give the addresses back');
    x = await tool(ANN, 'send_by_email', { id: A1, to: TO, note: 'Open it with the sound on.', confirm: true, idempotency_key: k }); eq(x.out.replayed, true, 'the same key again: the first answer'); eq(x.out.sent, 2); eq(F.sent.length, sent0 + 2, 'and no email twice'); eq(await sends(), 2);
    const rows = await db.all('SELECT hash FROM sends WHERE card = ?', [A1]); ok(rows.every(function (rw) { return rw.hash.indexOf('@') < 0 && rw.hash.length > 30; }), 'only hashes of the addresses are kept'); eq((await good(ANN, 'carol', { id: A1 })).carol.emailed_to, 2);
    // "don't email me again" is honoured through this door too
    const stop = S.mail.stopLink('otis@example.test').replace(SITE, ''); eq((await T.call('POST', stop, '', FORM)).status, 200); ok(await S.mail.stopped('otis@example.test'), 'Otis asked not to be emailed');
    o = await good(ANN, 'send_by_email', { id: A1, to: ['otis@example.test', 'pia@example.test'], confirm: true, idempotency_key: key() }); eq(o.sent, 1); eq(o.skipped_asked_not_to_be_emailed, 1); ok(/1 person asked .* not to be emailed, and was skipped/.test(o.note)); eq(F.sent.length, sent0 + 3); eq(F.sent[sent0 + 2].to[0], 'pia@example.test');
    // the site's limits: none for a carol (past ten is fine), and so many a day, by either door
    o = await good(ANN, 'send_by_email', { id: A1, to: Array.from({ length: 8 }, function (y, i) { return 'q' + i + '@example.test'; }), confirm: true, idempotency_key: key() }); eq(o.sent, 8, 'eleven for one carol'); eq(F.sent.length, sent0 + 11);
    await limits({ emailsPerDay: 3 }); await refused(ANN, 'send_by_email', { id: A1, to: ['rae@example.test'], confirm: true, idempotency_key: key() }, /a lot of emails for one day\. Try again tomorrow/); eq((await good(ANN, 'my_account')).left_today.emails, 0); await limits(null); eq(F.sent.length, sent0 + 11);
    // take down and put back
    const page = function () { return T.call('GET', '/marathon-maya-30'); }; eq((await page()).status, 200);
    o = await good(ANN, 'take_down', { id: A1 }); eq(o.taken_down, false); eq(o.nothing_done, true); ok(/will answer "not here" for everyone/.test(o.what_will_happen)); eq((await page()).status, 200, 'without a yes it stays up'); eq((await good(ANN, 'take_down', { id: A1, confirm: 'true' })).nothing_done, true); eq((await page()).status, 200);
    await refused(ANN, 'take_down', { id: A2, confirm: true }, /a draft/); eq((await good(ANN, 'put_back', { id: A1 })).nothing_done, true, 'nothing to put back yet');
    o = await good(ANN, 'take_down', { id: A1, confirm: true }); eq(o.taken_down, true); eq(o.carol.state, 'down'); eq((await page()).status, 404, 'with a yes it is down'); eq((await good(ANN, 'take_down', { id: A1, confirm: true })).nothing_done, true, 'twice is once'); await refused(ANN, 'share_links', { id: A1 }, /taken down: put_back first/);
    eq((await good(ANN, 'status', { id: A1 })).state, 'down'); o = await good(ANN, 'put_back', { id: A1 }); eq(o.put_back, true); eq(o.carol.state, 'ready'); eq((await page()).status, 200, 'and up again at the same link');
    // delete: nothing without a yes
    o = await good(ANN, 'delete_carol', { id: A1 }); eq(o.deleted, false); eq(o.nothing_done, true); ok(/deleted for good/.test(o.what_will_happen) && /2 photos, song and video are removed/.test(o.what_will_happen) && /credit spent on its song is not returned/.test(o.what_will_happen));
    for (const c of [false, 'true', 1]) eq((await good(ANN, 'delete_carol', { id: A1, confirm: c })).deleted, false); eq((await page()).status, 200, 'it is still there'); eq(await count('SELECT COUNT(*) AS n FROM photos WHERE card = ?', [A1]), 2); eq((await good(ANN, 'my_carols', { state: 'ready' })).total, 1);
  });

  await section('10. Ownership: another account\'s carol is "no such carol", for every tool, by every link', async function () {
    const before = JSON.stringify((await T.call('GET', '/api/cards/' + A1, null, annWho)).json.card), sent0 = F.sent.length, bal0 = await S.balance('google:101'), jobs0 = await count('SELECT COUNT(*) AS n FROM jobs'), tools = (await mcp(rpc(1, 'tools/list'), BEA)).json.result.tools;
    const ph = (await good(ANN, 'carol', { id: A1 })).carol.photos[0].id, take = (await good(ANN, 'takes', { id: A1 })).takes[1].id;
    const every = { id: A1, confirm: true, lyrics: LYRICS, title: 'Mine now', photos: [{ photo: ph }], photo: ph, captions: [{ photo: ph, caption: 'ha' }], template: TPL, name: 'stolen-carol-2026', to: ['thief@example.test'], take: take, styles: ['a', 'b', 'c'], for: 'Bea', ask: 'meaner', use_template: true };
    let tried = 0;
    for (const t of tools) { if (!t.inputSchema.properties.id || t.name === 'buy_link' || t.name === 'template') continue; const args = { idempotency_key: key() }; Object.keys(t.inputSchema.properties).forEach(function (k) { if (every[k] !== undefined) args[k] = every[k]; }); const x = await tool(BEA, t.name, args); tried++; ok(x.bad && /There is no such carol/.test(x.text), t.name + ' on another account\'s carol: ' + x.text.slice(0, 80)); ok(x.text.indexOf('Maya') < 0 && x.text.indexOf('ann@') < 0, 'and nothing of it is told'); }
    eq(tried, 23, 'every tool that takes a carol was tried');
    eq(JSON.stringify((await T.call('GET', '/api/cards/' + A1, null, annWho)).json.card), before, 'Ann\'s carol is exactly as it was'); eq(F.sent.length, sent0, 'no email'); eq(await S.balance('google:101'), bal0); eq(await count('SELECT COUNT(*) AS n FROM jobs'), jobs0); eq((await T.call('GET', '/marathon-maya-30')).status, 200, 'and still up');
    let o = await good(BEA, 'my_carols', {}); eq(o.total, 0, 'Bea has no carols, and sees none of Ann\'s'); o = await good(BEA, 'my_account'); eq(o.email, 'bea@example.test'); eq(o.credits, 0, 'nor Ann\'s credits'); eq(o.name, '');
    const mine = await good(BEA, 'start_carol', { for: 'Otto', template: TPL, idempotency_key: 'twin-key-1' }); ok(mine.carol.id !== A2 && !mine.replayed, 'a key Ann used is Bea\'s own key: her own carol');
    // Bea's links are for Bea's carol
    const up = (await good(BEA, 'add_photos', { id: mine.carol.id })).upload_url.replace(SITE, ''); eq((await T.call('GET', up + '/photo/' + ph)).status, 404, 'her upload link does not show Ann\'s photo'); const pv = (await tool(BEA, 'preview_carol', { id: mine.carol.id })).out, vt = pv.preview_url.split('/').pop();
    eq((await T.call('GET', '/mcp/media/' + vt + '/photo/' + ph)).status, 404); eq((await T.call('GET', '/mcp/media/' + vt + '/song/' + take)).status, 404, 'nor her preview link Ann\'s song');
    await refused(BEA, 'make_song', { id: mine.carol.id, confirm: true, idempotency_key: key() }, /Write the words first/); await good(BEA, 'set_lyrics', { id: mine.carol.id, lyrics: LYRICS }); o = await good(BEA, 'make_song', { id: mine.carol.id, confirm: true, idempotency_key: key() }); eq(o.started, false, 'Bea has no credit: Ann\'s are not hers'); ok(o.buy_url); eq(await S.balance('google:101'), bal0);
    eq((await good(BEA, 'delete_carol', { id: mine.carol.id, confirm: true })).deleted, true);
  });

  await section('11. Deleting with a yes; a limit on each token; nothing secret in any answer', async function () {
    const story = (await db.get("SELECT mkey FROM media WHERE card = ? AND kind = 'story'", [A1])).mkey; ok(await S.ST.read(story), 'the video is in storage');
    let o = await good(ANN, 'delete_carol', { id: A1, confirm: true }); eq(o.deleted, true); eq((await T.call('GET', '/marathon-maya-30')).status, 404, 'its page is gone'); eq(await count('SELECT COUNT(*) AS n FROM photos WHERE card = ?', [A1]), 0, 'its photos are gone'); eq(await S.ST.read(story), null, 'and its video, from storage');
    await refused(ANN, 'carol', { id: A1 }, /no such carol/); eq((await good(ANN, 'delete_carol', { id: A2, confirm: true })).deleted, true); o = await good(ANN, 'my_carols', {}); eq(o.total, 1); eq(o.carols[0].title, 'A Carol for Site One', 'what is left is the carol she made on the site: one account, two doors'); eq(await S.balance('google:101'), 2, 'the credit that made a song stays spent');
    eq((await T.call('GET', '/mcp/photos/' + C.seal('u', A1, 30))).status, 403, 'a deleted carol\'s links are dead'); eq((await T.call('GET', '/mcp/preview/' + C.seal('v', A1, 30) + '/data')).status, 403);
    // every tool was used
    eq(Object.keys(used).sort().join(' '), C.TOOLS.map(function (t) { return t.name; }).sort().join(' '), 'every tool has worked at least once in this test');
    // a limit for each token
    const cy = await T.user('google:505', 'cy@example.test'), cyT = (await connect(cy)).tokens.access_token, di = await T.user('google:606', 'di@example.test'), diT = (await connect(di)).tokens.access_token; let last = null, n429 = 0;
    await limits(null, true);   // (the connector's own limit, as it ships)
    for (let i = 0; i < 125; i++) { last = await T.call('POST', '/mcp', rpc(i, 'ping'), Object.assign({ authorization: 'Bearer ' + cyT }, ip(60 + (i % 5)))); if (last.status === 429) n429++; }
    eq(n429, 5, '120 requests a minute for one token, wherever they come from; then wait'); eq(last.json.error.code, -32000); eq(last.heads['retry-after'], '30'); eq((await T.call('POST', '/mcp', rpc(1, 'ping'), Object.assign({ authorization: 'Bearer ' + diT }, ip(60)))).status, 200, 'another token is not held up');
    await limits(null);
    // nothing secret, and nothing of anybody else, in anything a player was told
    const everything = said.join('\n'); ok(said.length > 300, said.length + ' answers were read');
    Object.values(SECRET).concat(['test-secret']).forEach(function (s) { ok(everything.indexOf(s) < 0, 'no answer holds the secret ' + s.slice(0, 12) + '...'); });
    ok(!/google:\d|email:[a-z]/.test(everything), 'no account id'); ok(!/"(okey|skey|akey|mkey|hash|uid)"\s*:/.test(everything) && !/cards\/c[A-Za-z0-9]+\/p/.test(everything), 'no storage key, hash or owner field');
    ['june@example.test', 'otis@example.test', 'pia@example.test'].forEach(function (a) { ok(everything.indexOf(a) < 0, 'no recipient\'s address in any answer: ' + a); });
    ok(everything.indexOf('dan@example.test') < 0 && everything.indexOf('cy@example.test') < 0, 'nobody else\'s address'); const toAnn = saidTo[ANN].join('\n'), toBea = saidTo[BEA].join('\n'); ok(toAnn.indexOf('ann@example.test') > 0 && toBea.indexOf('bea@example.test') > 0, 'each person is told their own address');
    ok(toAnn.indexOf('bea@') < 0, 'Ann is told nothing of Bea'); ['ann@', 'Ann Lee', 'Maya Runs the World', 'Run on, Maya', 'marathon-maya', 'Biscuit'].forEach(function (w) { const at = toBea.indexOf(w); ok(at < 0, 'Bea is told nothing of Ann: not an address, a name, a carol or a link ("' + w + '": ...' + toBea.slice(Math.max(0, at - 80), at + 40) + ')'); });
    ok(!/\/api\/cards\//.test(everything), 'and no address of the site\'s inner API');
    eq(F.stripe.asked.length, 0, 'the connector opened no Checkout'); eq(await count("SELECT COUNT(*) AS n FROM credit_log WHERE delta > 0"), 1, 'and gave no credit: the only one is the admin\'s');
  });

  await section('12. Where people find it, and what ships', async function () {
    let r = await T.call('GET', '/'); eq(r.status, 200); const sec = /<section class="sec alt" id="claude">[\s\S]*?<\/section>/.exec(r.text); ok(sec, 'the landing page has "Make it with Claude"');
    ok(r.text.indexOf('id="claude"') > r.text.indexOf('id="pricing"') && r.text.indexOf('id="claude"') > r.text.indexOf('id="how"'), 'below the standard flow');
    ok(sec[0].indexOf(SITE + '/mcp') > 0, 'the connector\'s address'); ok(sec[0].indexOf('claude mcp add --transport http send-a-carol ' + SITE + '/mcp') > 0, 'the one line for Claude Code'); ok(/Settings, then Connectors, then Add custom connector/.test(sec[0]), 'the three steps'); ok(/Make a birthday carol for my sister Maya/.test(sec[0]), 'something to say');
    ok(!/#[0-8][0-9a-f]{5}\b|#[0-8][0-9a-f]{2}\b/i.test(sec[0]), 'no dark colour typed in it'); ok(!/premium|group/i.test(sec[0]));
    ok(/href: '\/#claude', text: 'Use Claude'/.test(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8')), 'the maker\'s menu has "Use Claude"'); ok(/q\.get\('buy'\)\) pay\(\)/.test(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8')), 'and the buy link opens the packs');
    const docker = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8'); ['connect.js', 'oauth.js', 'connect-rules.js', 'connect-ui.js', 'mcp-app.js'].forEach(function (f) { ok(new RegExp('^COPY [^\\n]*\\b' + f.replace('.', '\\.') + '\\b', 'm').test(docker), 'the Dockerfile ships ' + f); });
    ['connect.js', 'oauth.js', 'connect-rules.js', 'connect-ui.js'].forEach(function (f) { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); ok(!/claude-(opus|sonnet|haiku|fable)|gpt-\d|eleven_/i.test(t), f + ' names no model'); ok(!/premium|group/i.test(t.replace(/vowel groups|any group/g, '')), f + ' has no premium or group feature'); ok(!/[^\x00-\x7F]/.test(t.replace(/·/g, '')), f + ' is plain ASCII'); });
    C.ROUTES.forEach(function (x) { ok(S.ROUTES.indexOf(x) >= 0, 'the route is written down: ' + x); }); ['oauth', 'mcp', 'well-known'].forEach(function (w) { ok(CFG.reserved.indexOf(w) >= 0, 'no card can be named ' + w); });
    const chk = await S.check(); ok(chk.ok, chk.lines.join('\n')); ok(chk.lines.some(function (l) { return /^ok {4}connect\.js: \d+ of \d+ statements$/.test(l); }) && chk.lines.some(function (l) { return /^ok {4}oauth\.js: \d+ of \d+ statements$/.test(l); }), '--check plans the connector\'s statements too'); ok(chk.lines.some(function (l) { return /^ok {4}24 of 24 tables read/.test(l); }), 'and reads the sign-in tables');
    const spec = fs.readFileSync(path.join(ROOT, 'SPEC.md'), 'utf8'); ok(/## The connector/.test(spec) && C.TOOLS.every(function (t) { return spec.indexOf('`' + t.name + '`') > 0; }), 'SPEC.md has the connector and every tool');
  });

  if (host) await host.X.ctx.close(); if (B) await B.close();
  await T.done();
  say('OK connect (' + checks + ' checks, ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s)' + (B ? '' : ' (the browser parts were skipped)'));
  process.exit(0);
})().catch(function (e) { process.stdout.write('FAILED connect: ' + (e && e.stack || e) + '\n--- the server\'s last lines ---\n' + logs.slice(-8).join('\n') + '\n'); process.exit(1); });
