'use strict';
// tools/connect-proof.cjs : ONE RUN OF THE CONNECTOR AS A CLIENT MAKES IT, START TO FINISH (SPEC.md, "The connector").
// A small MCP client speaking JSON-RPC to the server's handle(req, res) in this process: it signs in the way Claude
// does (401, the metadata, register, authorize, token), then makes a carol by tools alone: suggest_templates,
// start_carol, set_lyrics (lines of its own), photos added on the upload page in headless Chromium, preview_carol,
// make_song without and then with confirm (the credit given by the admin's own door), status until ready, share_links.
// No port, no network, NO MONEY: the model is never called (the words are the client's own) and the music service
// is the kit's stand-in (a click track made by ffmpeg). The video is rendered FOR REAL, at full size, and copied
// with its poster to a folder under /tmp.
//   NODE_PATH=<a folder with playwright> node tools/connect-proof.cjs [out-dir]
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const K = require('../test/kit.cjs');
const out = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'sac-connect-proof-')), say = function (s) { process.stdout.write(s + '\n'); };
const logs = []; ['log', 'error', 'warn', 'info'].forEach(function (k) { console[k] = function () { logs.push(Array.from(arguments).map(String).join(' ')); }; });
const must = function (v, what) { if (!v) throw new Error('NOT SO: ' + what); return v; }, sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

(async function () {
  const T = await K.open('connectproof', { env: { ADMIN_MCP_KEY: 'proof-admin-key-0123456789-abcdefgh' } }), S = T.S, F = T.fakes, SITE = T.site, t0 = Date.now();
  const form = function (o) { return String(new URLSearchParams(o)); }, FORM = { 'content-type': 'application/x-www-form-urlencoded' };
  // ---- signing in, as an MCP client does ----
  let r = await T.call('POST', '/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/list' }); must(r.status === 401 && /resource_metadata=/.test(r.heads['www-authenticate']), 'nobody is a 401 that says where to sign in');
  const meta = (await T.call('GET', new URL(/resource_metadata="([^"]+)"/.exec(r.heads['www-authenticate'])[1]).pathname)).json, as = (await T.call('GET', '/.well-known/oauth-authorization-server')).json;
  const REDIRECT = 'http://localhost:53124/callback', client = (await T.call('POST', new URL(as.registration_endpoint).pathname, { client_name: 'connect-proof', redirect_uris: [REDIRECT] })).json.client_id;
  const who = { cookie: /^(sac=[^;]+)/.exec((await T.call('POST', '/api/auth/google', { credential: F.google.token({ sub: '9001', email: 'proof@example.test', email_verified: true, name: 'Proof Person' }) })).heads['set-cookie'])[1] };
  const verifier = crypto.randomBytes(32).toString('base64url'), q = { response_type: 'code', client_id: client, redirect_uri: REDIRECT, code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', state: 'proof' };
  r = await T.call('GET', new URL(as.authorization_endpoint).pathname + '?' + form(q), null, who); const mark = /name="mark" value="([^"]+)"/.exec(r.text)[1];
  r = await T.call('POST', '/oauth/authorize', form(Object.assign({}, q, { mark: mark, answer: 'yes' })), Object.assign({}, FORM, who));
  const token = (await T.call('POST', new URL(as.token_endpoint).pathname, form({ grant_type: 'authorization_code', code: new URL(r.heads.location).searchParams.get('code'), client_id: client, redirect_uri: REDIRECT, code_verifier: verifier }), FORM)).json.access_token;
  say('signed in: 401 -> ' + meta.resource + ' -> registered -> allowed as Proof Person -> a token');
  // ---- the client ----
  let id = 0;
  const rpc = async function (method, params) { const x = await T.call('POST', '/mcp', { jsonrpc: '2.0', id: ++id, method: method, params: params }, { authorization: 'Bearer ' + token, 'mcp-protocol-version': '2026-07-28' }); must(x.status === 200 && x.json.result, method + ': ' + x.text.slice(0, 300)); return x.json.result; };
  const tool = async function (name, args) { const res = await rpc('tools/call', { name: name, arguments: args || {} }); must(!res.isError, name + ': ' + res.content[0].text); return res.structuredContent; };
  const key = function () { return crypto.randomBytes(9).toString('hex'); };
  const d = await rpc('server/discover', {}), tools = (await rpc('tools/list')).tools; say('server/discover: ' + d.supportedVersions[0] + '; ' + tools.length + ' tools');
  await tool('how_it_works');
  const picks = (await tool('suggest_templates', { occasion: 'birthday', relationship: 'my sister', mood: 'funny', details: 'she just ran her first marathon' })).picks; say('suggest_templates: ' + picks.map(function (p) { return p.id; }).join(', '));
  const c = (await tool('start_carol', { for: 'Maya', from: 'Sam and the kids', relationship: 'my sister', template: picks[0].id, details: 'She just ran her first marathon.', idempotency_key: key() })).carol; say('start_carol: ' + c.id + ' on "' + c.template.name + '"');
  const set = await tool('set_lyrics', { id: c.id, title: 'Marathon Maya', greeting: 'Happy birthday, Maya!', signoff: 'Love, Sam and the kids', lyrics: [{ section: 'verse', lines: ['Maya ran the whole way round the town', 'Twenty six miles and she never slowed down', 'The kids made a sign and they painted it blue', 'We stood at the finish all cheering for you'] }, { section: 'hook', lines: ['Happy birthday, Maya, hip hooray', 'Our marathon girl, it is your day'] }] });
  say('set_lyrics: saved, ' + set.sings_in_seconds + ' seconds of song at ' + set.tempo_bpm + ' beats a minute');
  // ---- photos, on the upload page, in a browser ----
  const up = await tool('add_photos', { id: c.id }), B = must(await K.browser(T), 'Playwright is here (set NODE_PATH)'), X = await B.context({ mobile: true }), page = await X.page(up.upload_url.replace(SITE, ''));
  await page.waitForFunction(function () { return document.getElementById('for').textContent === 'Maya'; }); await page.locator('#ok').check();
  await page.locator('#files').setInputFiles([1, 2, 3].map(function (n) { return { name: 'photo-' + n + '.png', mimeType: 'image/png', buffer: T.photo(n + 6, n === 2 ? 1600 : 1200, n === 2 ? 1200 : 1600) }; }));
  await page.waitForFunction(function () { return /3 photos added/.test(document.getElementById('say').textContent); }, null, { timeout: 60000 }); await page.screenshot({ path: path.join(out, 'upload-page.png') }); await B.close();
  let v = (await tool('carol', { id: c.id })).carol; must(v.photos.length === 3, 'three photos arrived'); say('add_photos: the upload page in headless Chromium, ticked, ' + v.photos.length + ' photos arrived (' + v.photos.map(function (p) { return p.width + 'x' + p.height; }).join(', ') + ')');
  await tool('arrange_photos', { id: c.id, photos: [{ photo: v.photos[1].id, caption: 'At the finish line' }, { photo: v.photos[0].id, one_person: true }] });
  const pv = await tool('preview_carol', { id: c.id }); say('preview_carol: "' + pv.showing + '"; ' + pv.preview_url.replace(/\/[^/]+$/, '/<link>'));
  // ---- the song: no credit, then a credit from the admin's own door, then a yes ----
  let m = await tool('make_song', { id: c.id, confirm: true, idempotency_key: key() }); must(m.started === false && m.buy_url, 'no credit: the buy link'); say('make_song with no credit: "' + m.why + '" -> ' + m.buy_url);
  r = await T.call('POST', '/mcp?admin=proof-admin-key-0123456789-abcdefgh', { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'admin_grant', arguments: { uid: 'google:9001', credits: 1, reason: 'the connector proof run' } } }); must(r.status === 200 && !r.json.result.isError, 'the admin granted a credit'); say('the admin gave 1 credit (at /mcp?admin=<key>: not something the connector can do)');
  m = await tool('make_song', { id: c.id }); must(m.nothing_done && /This uses 1 of your 1 credit\./.test(m.what_will_happen), 'without confirm it only says'); say('make_song without confirm: "' + m.what_will_happen + '"');
  must(await S.balance('google:9001') === 1 && F.music.length === 0, 'nothing was spent or asked for');
  m = await tool('make_song', { id: c.id, confirm: true, idempotency_key: key() }); must(m.started, 'started'); say('make_song with confirm: started, ' + m.credits_left + ' credits left');
  const seen = []; let st = await tool('status', { id: c.id }); seen.push(st.stage);
  const made = S.jobs.drain(); let over = false; made.then(function () { over = true; });
  while (!over) { st = await tool('status', { id: c.id }); const s = st.stage + (st.stage === 'rendering' ? ' ' + st.percent + '%' : ''); if (seen[seen.length - 1] !== s) seen.push(s); await sleep(400); }
  st = await tool('status', { id: c.id }); seen.push(st.stage); must(st.stage === 'ready', 'ready: ' + JSON.stringify(st)); say('status: ' + seen.join(' -> '));
  const links = await tool('share_links', { id: c.id }); say('share_links: ' + links.card_page);
  // ---- what was made, kept ----
  const probe = function (f) { const x = cp.spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate:format=duration', '-of', 'json', f], { encoding: 'utf8' }); try { const j = JSON.parse(x.stdout), vs = j.streams.find(function (s) { return s.width; }), au = j.streams.find(function (s) { return !s.width; }); return (vs ? vs.codec_name + ' ' + vs.width + 'x' + vs.height + ' at ' + vs.r_frame_rate : '') + (au ? ', ' + au.codec_name : '') + ', ' + (+j.format.duration).toFixed(1) + ' s'; } catch (e) { return '(ffprobe is not here)'; } };
  for (const f of [['video_tall', 'story.mp4'], ['video_square', 'square.mp4'], ['poster', 'poster.jpg'], ['poster_tall', 'poster-story.jpg']]) { const x = await T.call('GET', links[f[0]].replace(SITE, '')); must(x.status === 200 && x.body.length > 20000, f[1] + ' is there'); fs.writeFileSync(path.join(out, f[1]), x.body); say('  ' + f[1] + ': ' + Math.round(x.body.length / 1024) + ' kB' + (/mp4$/.test(f[1]) ? ', ' + probe(path.join(out, f[1])) : '')); }
  must((await T.call('GET', new URL(links.card_page).pathname)).status === 200, 'the card page answers');
  must(F.agent.length === 0, 'the model was never called'); must(F.music.length === 1, 'the music stand-in was asked once'); must(F.net.every(function (u) { return /^https:\/\/(api\.elevenlabs\.io|www\.googleapis\.com)\//.test(u); }), 'nothing else was asked of the network stand-in: ' + F.net.join(' '));
  must(await S.balance('google:9001') === 0, 'one credit was spent');
  say('the model: 0 calls. the music service: 1 call, answered by the stand-in (no real request, no money). ' + id + ' JSON-RPC calls, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s.');
  say('kept in ' + out);
  await T.done(); say('OK connect-proof'); process.exit(0);
})().catch(function (e) { process.stdout.write('FAILED connect-proof: ' + (e && e.stack || e) + '\n' + logs.slice(-6).join('\n') + '\n'); process.exit(1); });
