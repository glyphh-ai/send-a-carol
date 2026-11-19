'use strict';
// test/kit.cjs : what every test (and every screenshot script) starts from. Nothing here touches the network or binds
// a port: the server is required and its handle(req, res) is called in-process; Claude, ElevenLabs, Stripe, Resend
// and Google are fakes; media goes to a folder under the test's own temp dir (the local-disk store).
//   const K = require('./kit.cjs'); const T = await K.open('name');   // -> { S, call, as, fakes, done, dir }
//   await T.call('POST', '/api/cards', { template: id }, T.as('google:1'))  -> { status, json, text, body, heads }
const os = require('os'), fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process'), { Readable, Writable } = require('stream');
const ROOT = path.join(__dirname, '..'), SITE = 'https://sendacarol.test';

// ----- fakes -----
function fakes() {
  const f = { sent: [], agent: [], agentNext: [], music: [], musicNext: [], stripe: { sessions: {}, asked: [], payment: 'paid' }, net: [] };
  // the writing agent: answers a script made from the brief, or whatever a test queued (agentNext)
  f.script = function (o) {
    const to = /FOR: (.*)/.exec(o)[1], from = /FROM: (.*)/.exec(o)[1], n = +(/PHOTOS: (\d+)/.exec(o) || [0, 0])[1], ask = (/ANOTHER TAKE: (.*)/.exec(o) || [])[1] || '';
    return { ok: true, refusal: '', note: ask ? 'Here is a take that is ' + ask + '.' : 'I leaned on the details you gave.', title: 'A Carol for ' + (to === '(not said)' ? 'You' : to), greeting: 'Hello, ' + (to === '(not said)' ? 'you' : to) + '!', signoff: 'With love, ' + (from === '(not said)' ? 'us' : from),
      lyrics: [{ section: 'verse', lines: ['The lights are up along the street tonight', 'And every window has a little glow', (ask ? 'A ' + ask + ' line was asked for, so here it is' : 'We saved a seat for you beside the fire'), 'And all the stories only we would know'] }, { section: 'hook', lines: ['So here is a carol, made for you', 'Sing it loud, the whole way through'] }],
      music: { styles: ['warm acoustic folk', 'upright piano', 'soft brushed drums', 'hand claps', 'gentle strings', 'cozy'], bpm: 120, voices: 'warm lead vocal with group harmonies', notes: 'Bright and warm.' },
      scenes: Array.from({ length: n }, function (x, i) { return { photo: i, caption: i ? '' : 'The whole gang' }; }) };
  };
  f.client = { messages: { create: async function (params) {
    f.agent.push(params); const next = f.agentNext.shift(), brief = params.messages[0].content;
    if (typeof next === 'function') return next(params);
    const j = next || (/demean|humiliate|sexy|to the tune of/i.test(brief) ? { ok: false, refusal: 'I can\'t write that one. I\'d love to write something warm about them instead: tell me what you like about them.', note: '', title: '', greeting: '', signoff: '', lyrics: [], music: { styles: [], bpm: 100, voices: '', notes: '' }, scenes: [] } : f.script(brief));
    return { id: 'msg_test_' + f.agent.length, type: 'message', role: 'assistant', model: 'test', stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(j) }], usage: { input_tokens: 1200, output_tokens: 600 } };
  } } };
  // the music service: a click track at the asked tempo with a tone, as an mp3 (made by ffmpeg, so its beats can be found)
  f.song = function (seconds, bpm) {
    const k = seconds + ':' + bpm; if (f.songs && f.songs[k]) return f.songs[k]; f.songs = f.songs || {};
    const out = path.join(os.tmpdir(), 'sac-test-song-' + process.pid + '-' + Math.round(seconds * 10) + '-' + bpm + '.mp3'), period = 60 / bpm;
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=220:duration=' + seconds, '-f', 'lavfi', '-i', "aevalsrc='0.8*sin(2*PI*90*t)*exp(-30*mod(t+" + (period - 0.25).toFixed(4) + '\\,' + period.toFixed(4) + "))':d=" + seconds, '-filter_complex', '[0:a]volume=0.12[a];[a][1:a]amix=inputs=2:normalize=0', '-ar', '44100', '-b:a', '128k', out]);
    if (r.status) throw new Error('ffmpeg could not make the test song: ' + r.stderr);
    const b = fs.readFileSync(out); fs.unlinkSync(out); return (f.songs[k] = b);
  };
  f.fetch = async function (url, o) {
    url = String(url); o = o || {}; f.net.push(url);
    const reply = function (code, obj, buf) { return { ok: code < 300, status: code, json: async function () { return obj; }, arrayBuffer: async function () { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length); }, headers: new Map() }; };
    if (url === 'https://api.resend.com/emails') { const b = JSON.parse(o.body); f.sent.push(Object.assign({ auth: o.headers.Authorization }, b)); return f.resendDown ? reply(500, {}) : reply(200, { id: 'e' + f.sent.length }); }
    if (url.indexOf('https://api.elevenlabs.io/v1/music') === 0) {
      const b = JSON.parse(o.body); f.music.push({ url: url, key: o.headers['xi-api-key'], body: b }); const next = f.musicNext.shift();
      if (next) return typeof next === 'function' ? next(b) : reply(next.status, next.body);
      const secs = b.composition_plan.chunks.reduce(function (n, c) { return n + c.duration_ms; }, 0) / 1000, bpm = +(/(\d+) bpm/.exec(b.composition_plan.chunks[0].positive_styles.join(' ')) || [0, 120])[1];
      return reply(200, null, f.song(Math.round(secs * 10) / 10, bpm));
    }
    if (url === 'https://api.stripe.com/v1/checkout/sessions' && o.method === 'POST') {
      const p = Object.fromEntries(o.body), meta = {}; Object.keys(p).forEach(function (k) { const m = /^metadata\[(\w+)\]$/.exec(k); if (m) meta[m[1]] = p[k]; });
      const idem = o.headers['Idempotency-Key'], was = idem && Object.values(f.stripe.sessions).find(function (s) { return s.idem === idem; }); if (was) return reply(200, was);
      const n = Object.keys(f.stripe.sessions).length, s = { id: 'cs_test_' + n, url: 'https://checkout.stripe.test/pay/' + n, status: 'open', payment_status: f.stripe.payment, amount_total: +p['line_items[0][price_data][unit_amount]'], currency: 'usd', livemode: false, metadata: meta, idem: idem || '' };
      f.stripe.sessions[s.id] = s; f.stripe.asked.push(Object.assign({ auth: o.headers.Authorization }, p)); return reply(200, s);
    }
    if (url.indexOf('https://api.stripe.com/v1/checkout/sessions/') === 0 && (!o.method || o.method === 'GET')) { const s = f.stripe.sessions[decodeURIComponent(url.split('/').pop())]; return s ? reply(200, s) : reply(404, { error: { message: 'no such session' } }); }
    if (url === 'https://www.googleapis.com/oauth2/v3/certs') return reply(200, { keys: [f.google.jwk] });
    throw new Error('the test asked the network for ' + url);
  };
  const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  f.google = { jwk: Object.assign(keys.publicKey.export({ format: 'jwk' }), { kid: 'k1', alg: 'RS256', use: 'sig' }), token: function (claims, key) { const h = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'k1' })).toString('base64url'), p = Buffer.from(JSON.stringify(Object.assign({ iss: 'https://accounts.google.com', aud: process.env.GOOGLE_CLIENT_ID, exp: Math.floor(Date.now() / 1000) + 600 }, claims))).toString('base64url'); return h + '.' + p + '.' + crypto.sign('RSA-SHA256', Buffer.from(h + '.' + p), key || keys.privateKey).toString('base64url'); } };
  return f;
}

// ----- a code-drawn "photo" of made-up people (never a real person): a PNG buffer -----
function photo(seed, w, h) {
  const canvas = require('@napi-rs/canvas'), cv = canvas.createCanvas(w || 900, h || 1200), c = cv.getContext('2d'), W = cv.width, H = cv.height;
  let s = (seed || 1) * 9301 + 49297; const r = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const skies = [['#8ec5fc', '#e0c3fc'], ['#fbc2eb', '#a6c1ee'], ['#fddb92', '#d1fdff'], ['#a1c4fd', '#c2e9fb'], ['#f6d365', '#fda085'], ['#84fab0', '#8fd3f4']], sk = skies[seed % skies.length], g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(r() * W, r() * H * 0.3, 60 + r() * 90, 22 + r() * 20, 0, 0, 7); c.fill(); }
  c.fillStyle = ['#5d9b5d', '#c9b98a', '#7a9fb5', '#b98a6a'][seed % 4]; c.fillRect(0, H * 0.78, W, H * 0.22);
  const n = 1 + (seed % 3), skins = ['#f2c9a0', '#d9a273', '#8d5a3b', '#f7dcc0', '#b97a50'], hairs = ['#3b2a20', '#111', '#b5651d', '#d8b46a', '#888'], tops = ['#c2185b', '#1f7a5a', '#2a5fa8', '#f2b632', '#7b3fa0', '#e4572e'];
  for (let i = 0; i < n; i++) {
    const cx = W * (n === 1 ? 0.5 : 0.24 + 0.52 * i / (n - 1)), hr = W * (n === 1 ? 0.15 : 0.11) * (0.9 + r() * 0.2), cy = H * 0.40 + r() * H * 0.04, skin = skins[Math.floor(r() * skins.length)], hair = hairs[Math.floor(r() * hairs.length)];
    c.fillStyle = tops[Math.floor(r() * tops.length)]; c.beginPath(); c.moveTo(cx - hr * 1.7, H); c.quadraticCurveTo(cx - hr * 1.7, cy + hr * 1.2, cx, cy + hr * 1.1); c.quadraticCurveTo(cx + hr * 1.7, cy + hr * 1.2, cx + hr * 1.7, H); c.fill();
    c.fillStyle = skin; c.fillRect(cx - hr * 0.3, cy + hr * 0.7, hr * 0.6, hr * 0.6); c.beginPath(); c.arc(cx, cy, hr, 0, 7); c.fill();
    c.fillStyle = hair; c.beginPath(); c.arc(cx, cy - hr * 0.25, hr * 1.04, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(cx + hr, cy - hr * 0.1); c.quadraticCurveTo(cx, cy - hr * 0.75, cx - hr, cy - hr * 0.1); c.fill();
    c.fillStyle = '#222'; c.beginPath(); c.arc(cx - hr * 0.35, cy + hr * 0.02, hr * 0.085, 0, 7); c.arc(cx + hr * 0.35, cy + hr * 0.02, hr * 0.085, 0, 7); c.fill();
    c.strokeStyle = '#7a2a2a'; c.lineWidth = hr * 0.07; c.lineCap = 'round'; c.beginPath(); c.arc(cx, cy + hr * 0.3, hr * 0.38, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(230,90,90,.35)'; c.beginPath(); c.arc(cx - hr * 0.58, cy + hr * 0.3, hr * 0.16, 0, 7); c.arc(cx + hr * 0.58, cy + hr * 0.3, hr * 0.16, 0, 7); c.fill();
  }
  return cv.toBuffer('image/png');
}

// ----- the server, on a fresh database and a fresh folder -----
async function open(name, more) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-' + name + '-')), f = fakes();
  ['DATABASE_URL', 'DB_SCHEMA', 'R2_ENDPOINT', 'R2_BUCKET', 'R2_PREFIX', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'ADMIN_EMAILS', 'FLY_APP_NAME', 'EMAIL_FROM', 'CLIENT_DIR', 'CLAUDE_EFFORT'].forEach(function (k) { delete process.env[k]; });
  Object.assign(process.env, { DATA_DIR: dir, SESSION_SECRET: 'test-secret', PUBLIC_URL: SITE, GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.test', ADMIN_PASSWORD: 'open-sesame', ADMIN_MCP_KEY: 'test-admin-mcp-key-0123456789abcdef', RESEND_API_KEY: 're_test_never_used', STRIPE_SECRET_KEY: 'sk_test_fake', ANTHROPIC_API_KEY: 'test-never-used', CLAUDE_MODEL: 'test', ELEVENLABS_API_KEY: 'test-never-used', ELEVEN_MUSIC_MODEL: 'test', NODE_NO_WARNINGS: '1' }, more && more.env);
  if (process.env.TEST_DATABASE_URL) { process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DB_SCHEMA = 'sac_test_' + name.replace(/\W/g, '') + '_' + process.pid; const pg = require('pg'), c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect(); await c.query('CREATE SCHEMA ' + process.env.DB_SCHEMA); await c.end(); }
  global.fetch = f.fetch;
  require('https').request = function () { throw new Error('the test reached for the real network (https.request)'); };
  const S = require('../server.js'); await S.ready;
  require('../agent.js').seam.client = f.client; require('../song.js').seam.fetch = f.fetch; S.seam.fetch = f.fetch; S.mail.seam.fetch = f.fetch;
  const T = { S: S, dir: dir, fakes: f, site: SITE, photo: photo };
  T.call = function (method, url, body, headers) {
    return new Promise(function (done) {
      const buf = Buffer.isBuffer(body), req = Readable.from(body ? [buf ? body : typeof body === 'string' ? body : JSON.stringify(body)] : []);
      Object.assign(req, { method: method, url: url, headers: Object.assign({ host: 'sendacarol.test' }, buf ? { 'content-length': String(body.length) } : {}, headers || {}) });
      const parts = [], res = new Writable({ write: function (c, e, next) { parts.push(Buffer.from(c)); next(); } });
      Object.assign(res, { status: 200, heads: {}, headersSent: false, setHeader: function (k, v) { this.heads[k.toLowerCase()] = v; }, getHeader: function (k) { return this.heads[k.toLowerCase()]; }, writeHead: function (c, h) { this.status = c; this.headersSent = true; const me = this; Object.keys(h || {}).forEach(function (k) { me.heads[k.toLowerCase()] = h[k]; }); return this; } });
      res.on('finish', function () { const b = Buffer.concat(parts), text = b.toString(); let j = null; try { j = JSON.parse(text); } catch (e) { j = null; } done({ status: res.status, json: j, text: text, body: b, heads: res.heads }); });
      S.handle(req, res);
    });
  };
  T.cookie = function (id) { const v = Buffer.from(id).toString('base64url') + '.' + (Date.now() + 864e5); return 'sac=' + v + '.' + crypto.createHmac('sha256', 'test-secret').update(v).digest('base64url'); };
  T.as = function (id, more2) { return Object.assign({ cookie: T.cookie(id) }, more2); };
  // an account that exists, with credits if asked
  T.user = async function (id, email, credits) { await S.db.run('INSERT INTO users (id, email, name, created) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING', [id, email || '', '', Date.now()]); if (credits) await S.grant(id, credits, 'test', 'test:' + id + ':' + crypto.randomBytes(4).toString('hex')); return T.as(id); };
  // a whole carol, made the way a maker would: draft, photos, the agent's words, the song, the video. -> its view
  T.carol = async function (who, o) {
    o = o || {}; const tpl = o.template || require('../templates.js').list[0].id;
    let r = await T.call('POST', '/api/cards', { template: tpl, answers: Object.assign({ to: 'Grandma Dot', from: 'The Hollisters', relation: 'grandparents', details: 'Waffles the dog ate the gingerbread house. Milo lost his first tooth.' }, o.answers) }, who); if (r.status !== 200) throw new Error('card: ' + r.text);
    const id = r.json.card.id;
    for (let i = 0; i < (o.photos === undefined ? 2 : o.photos); i++) { r = await T.call('POST', '/api/cards/' + id + '/photos', photo(i + 1 + (o.seed || 0), 600, 800), Object.assign({ 'content-type': 'image/png' }, who)); if (r.status !== 200) throw new Error('photo: ' + r.text); }
    r = await T.call('POST', '/api/cards/' + id + '/write', {}, who); if (r.status !== 200 || !r.json.ok) throw new Error('write: ' + r.text);
    if (o.slug) { r = await T.call('POST', '/api/cards/' + id + '/save', { slug: o.slug }, who); if (r.status !== 200) throw new Error('slug: ' + r.text); }
    if (o.song === false) return r.json.card;
    r = await T.call('POST', '/api/cards/' + id + '/song', {}, who); if (r.status !== 200) throw new Error('song: ' + r.text);
    await S.jobs.drain();
    return (await T.call('GET', '/api/cards/' + id, null, who)).json.card;
  };
  T.done = async function () { fs.rmSync(dir, { recursive: true, force: true }); };
  return T;
}

// ----- a browser whose only origin is the server in this process (Playwright; SKIPPED when it is not here) -----
async function browser(T) {
  let chromium; try { chromium = require(process.env.PLAYWRIGHT_PATH || 'playwright').chromium; } catch (e) { return null; }
  const b = await chromium.launch();
  const context = async function (o) {
    o = o || {}; const ctx = await b.newContext({ viewport: o.viewport || { width: 390, height: 844 }, deviceScaleFactor: o.scale || 2, isMobile: !!o.mobile, hasTouch: !!o.mobile }), errors = [], log = [];
    if (o.who) await ctx.addCookies([{ name: 'sac', value: T.cookie(o.who).slice(4), url: SITE, httpOnly: true, secure: true, sameSite: 'Lax' }]);
    if (o.admin) { const r = await T.call('POST', '/api/admin/login', { password: 'open-sesame' }); const m = /saca=([^;]+)/.exec(r.heads['set-cookie']); await ctx.addCookies([{ name: 'saca', value: m[1], url: SITE, httpOnly: true, secure: true, sameSite: 'Strict' }]); }
    const net = { mode: 'ok', only: /^$/ };
    await ctx.route('**/*', async function (route) {
      const q = route.request(), u = new URL(q.url());
      if (u.origin !== SITE) return route.abort();
      const h = Object.assign({}, await q.allHeaders(), { host: 'sendacarol.test' }), jar = (await ctx.cookies(SITE)).map(function (c) { return c.name + '=' + c.value; }).join('; ');
      if (jar) h.cookie = jar; else delete h.cookie;
      const mode = net.only.test(u.pathname) ? net.mode : 'ok'; log.push({ m: q.method(), p: u.pathname, key: h['idempotency-key'] || '', mode: mode });
      if (mode === '503') return route.fulfill({ status: 503, contentType: 'text/html', body: '<h1>503</h1>' });
      if (mode === 'abort') return route.abort('connectionrefused');
      const body = q.postDataBuffer(), r = await T.call(q.method(), u.pathname + u.search, body && body.length ? body : null, h), heads = {};
      if (mode === 'lose') return route.abort('connectionreset');
      Object.keys(r.heads).forEach(function (k) { if (k !== 'set-cookie') heads[k] = String(r.heads[k]); });
      const sc = r.heads['set-cookie']; if (sc) { const m = /^(\w+)=([^;]*)/.exec(sc); if (m) await ctx.addCookies([{ name: m[1], value: m[2], url: SITE, httpOnly: true, secure: true, sameSite: 'Lax' }]).catch(function () { }); }
      route.fulfill({ status: r.status, headers: heads, body: r.body }).catch(function () { });
    });
    const page = async function (url) { const p = await ctx.newPage(); p.on('pageerror', function (e) { errors.push(String(e.message || e)); }); p.on('console', function (m) { if (m.type() === 'error') errors.push('console: ' + m.text()); }); await p.goto(SITE + url, { waitUntil: 'load' }); return p; };
    return { ctx: ctx, page: page, errors: errors, log: log, net: net };
  };
  return { context: context, close: function () { return b.close(); } };
}
module.exports = { open: open, browser: browser, photo: photo, fakes: fakes, ROOT: ROOT, SITE: SITE };
