'use strict';
// marketing/instagram/record.cjs : RECORDS THE REAL PAGES ON A PHONE for the ads, frame by frame at 30 fps.
// The server runs in this process on a COPY of the ads run's data (make-cards.cjs made the carols), and a headless
// browser (Playwright, an iPhone's viewport and pixel ratio) is driven through the server's own handle(), as
// test/browser.cjs does: no port is bound, nothing reaches the network, no paid service is called.
//   1. the card page (/<card-name>): the wrapped present (or the envelope), four taps, the unwrap, then the card
//      playing. Time is the page's own clock under Playwright's fake clock, stepped 1/30 s per frame; once the card
//      plays, its clock is told to run on time alone (the song is laid back on afterwards from the same start).
//   2. the maker's "Your carol is ready" screen (/make?card=<id>), signed in as the card's maker: scrolled to the
//      sharing buttons. navigator.share is given a stand-in that does nothing (as on an iPhone, where Share exists).
//   node marketing/instagram/record.cjs [christmas|thanksgiving]   -> REC/<ad>/{open,share}/f00001.jpg..., REC/<ad>/rec.json
// Needs Playwright: PLAYWRIGHT_PATH (e.g. a checkout's node_modules/playwright) or NODE_PATH.
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), { Readable, Writable } = require('stream');
const HERE = __dirname, ROOT = path.join(HERE, '..', '..'), ADS = process.env.ADS_DIR || '/tmp/carol-time/ads', REC = process.env.REC_DIR || '/tmp/carol-time/rec';
const { chromium, devices } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const FPS = 30, SITE = 'https://sendacarol.test', PUB = 'https://sendacarol.com', SECRET = 'ads-run-only', UID = 'email:ads@example.test';
const SHOTS = {
  christmas: { slug: 'pemberton-dad', song: 18.45 },
  thanksgiving: { slug: 'whitfield-grandparents', song: 19.9 },
};

// the server, on a copy of the ads run's data; paid services get keys that are never used (the cards are ready)
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-rec-'));
fs.cpSync(path.join(ADS, 'data'), data, { recursive: true });
['DATABASE_URL', 'R2_ENDPOINT', 'R2_BUCKET', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'ANTHROPIC_API_KEY', 'ELEVENLABS_API_KEY', 'FLY_APP_NAME'].forEach(function (k) { delete process.env[k]; });
Object.assign(process.env, { DATA_DIR: data, SESSION_SECRET: SECRET, PUBLIC_URL: PUB, NODE_NO_WARNINGS: '1', GOOGLE_CLIENT_ID: 'rec.apps.googleusercontent.test' });
require('https').request = function () { throw new Error('the recording reached for the real network'); };
const S = require(path.join(ROOT, 'server.js'));

const cookie = function () { const v = Buffer.from(UID).toString('base64url') + '.' + (Date.now() + 864e5); return v + '.' + crypto.createHmac('sha256', SECRET).update(v).digest('base64url'); };
function call(method, url, body, headers) {
  return new Promise(function (done) {
    const req = Readable.from(body && body.length ? [body] : []);
    Object.assign(req, { method: method, url: url, headers: headers });
    const parts = [], res = new Writable({ write: function (c, e, next) { parts.push(Buffer.from(c)); next(); } });
    Object.assign(res, { status: 200, heads: {}, headersSent: false, setHeader: function (k, v) { this.heads[k.toLowerCase()] = v; }, getHeader: function (k) { return this.heads[k.toLowerCase()]; }, writeHead: function (c, h) { this.status = c; this.headersSent = true; const me = this; Object.keys(h || {}).forEach(function (k) { me.heads[k.toLowerCase()] = h[k]; }); return this; } });
    res.on('finish', function () { done({ status: res.status, body: Buffer.concat(parts), heads: res.heads }); });
    S.handle(req, res);
  });
}
const GSI = 'window.google = { accounts: { id: { initialize: function () {}, renderButton: function (el) { if (el) el.textContent = "Sign in with Google"; }, prompt: function () {}, cancel: function () {}, disableAutoSelect: function () {} } } };';
async function context(b, origin) {
  const dev = devices['iPhone 14 Pro'], ctx = await b.newContext(Object.assign({}, dev, { baseURL: origin }));
  await ctx.addCookies([{ name: 'sac', value: cookie(), url: origin, httpOnly: true, secure: true, sameSite: 'Lax' }]);
  await ctx.route('**/*', async function (route) {
    const q = route.request(), u = new URL(q.url());
    if (u.host === 'accounts.google.com') return route.fulfill({ status: 200, contentType: 'text/javascript', body: GSI });
    if (u.origin !== origin) return route.abort();
    const h = Object.assign({}, await q.allHeaders(), { host: u.host, cookie: 'sac=' + cookie() }), body = q.postDataBuffer();
    const r = await call(q.method(), u.pathname + u.search, body, h), heads = {};
    Object.keys(r.heads).forEach(function (k) { if (k !== 'set-cookie') heads[k] = String(r.heads[k]); });
    route.fulfill({ status: r.status, headers: heads, body: r.body }).catch(function () { });
  });
  return ctx;
}
const shot = async function (page, file) { fs.writeFileSync(file, await page.screenshot({ type: 'jpeg', quality: 92 })); };

async function record(name, b) {
  const o = SHOTS[name], out = path.join(REC, name), meta = { fps: FPS, slug: o.slug, taps: [], viewport: devices['iPhone 14 Pro'].viewport, scale: devices['iPhone 14 Pro'].deviceScaleFactor };
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, 'open'), { recursive: true }); fs.mkdirSync(path.join(out, 'share'), { recursive: true });
  // ----- 1. the card page -----
  let ctx = await context(b, SITE), page = await ctx.newPage(), errors = [];
  page.on('pageerror', function (e) { errors.push(String(e.message || e)); });
  await page.clock.install();
  // the song: a headless browser would play it in real time while the page's clock is stepped, so the audio element
  // is given a stand-in playhead that runs on the page's (fake) clock. The page keeps the card in time with it, as
  // it does with the real song; the song itself is laid back on in the ad from the same playhead.
  await page.addInitScript(function () {
    const P = HTMLMediaElement.prototype, st = new WeakMap();
    const s = function (el) { let o = st.get(el); if (!o) { o = { t0: 0, off: 0, paused: true }; st.set(el, o); } return o; };
    const cur = function (el) { const o = s(el); return o.paused ? o.off : o.off + (performance.now() - o.t0) / 1000; };
    P.play = function () { const o = s(this); if (o.paused) { o.paused = false; o.t0 = performance.now(); } return Promise.resolve(); };
    P.pause = function () { const o = s(this); if (!o.paused) { o.off = cur(this); o.paused = true; } };
    Object.defineProperty(P, 'currentTime', { configurable: true, get: function () { return cur(this); }, set: function (v) { const o = s(this); o.off = +v || 0; o.t0 = performance.now(); } });
    Object.defineProperty(P, 'paused', { configurable: true, get: function () { return s(this).paused; } });
  });
  await page.goto('/' + o.slug, { waitUntil: 'load' });
  for (let i = 0; i < 200; i++) { await page.clock.runFor(50); if (await page.evaluate(function () { return !!(window.__card && window.__card.S.stage === 'present' && window.__card.U.assets); })) break; await page.waitForTimeout(30); }
  // from here time moves only when stepped: 1/30 s per frame, however long a screenshot takes
  await page.clock.pauseAt(await page.evaluate(function () { return Date.now() + 200; }));
  const box = await page.evaluate(function () { const U = window.__card.U; return { x: U.cx, y: U.cy, s: U.s }; });
  meta.root = await page.evaluate(function () { return window.__card.S.root || 0; });
  const tapsAt = [0.9, 1.35, 1.8, 2.25], frames = Math.round((tapsAt[3] + 2.0 + o.song) * FPS);
  let n = 0, play = -1;
  for (let f = 0; f < frames; f++) {
    const t = f / FPS;
    for (let k = 0; k < tapsAt.length; k++) if (f === Math.round(tapsAt[k] * FPS)) { const x = box.x + [-8, 10, -4, 6][k], y = box.y + [4, -6, 8, -2][k]; await page.touchscreen.tap(x, y); meta.taps.push({ t: t, x: x, y: y }); }
    await page.clock.runFor(Math.round((f + 1) * 1000 / FPS) - Math.round(f * 1000 / FPS));   // whole ms that add up to 30 a second
    const st = await page.evaluate(function () { const c = window.__card; return { stage: c.S.stage, on: c.clk.on, t: c.clk.t, a: c.audio.currentTime, paused: c.audio.paused, ready: c.audio.readyState }; });
    (meta.clock = meta.clock || []).push(st);
    if (play < 0 && st.stage === 'play' && st.on && !st.paused) { play = f; meta.playFrame = f; meta.playClock = st.t; }
    await shot(page, path.join(out, 'open', 'f' + String(++n).padStart(5, '0') + '.jpg'));
    if (play >= 0 && (f - play) / FPS >= o.song + 0.2) break;
  }
  meta.openFrames = n; meta.cardErrors = errors.slice();
  meta.burstFrame = meta.clock.findIndex(function (c) { return c.stage === 'burst'; });
  await ctx.close();
  // the page's own sounds for the taps and the burst (its WebAudio blips, card.js sfx.tap / sfx.burst, same notes in
  // the song's key), rendered offline in the browser at the times they happened, as a WAV
  meta.sfx = path.join(out, 'sfx.wav');
  ctx = await b.newContext(); page = await ctx.newPage(); await page.setContent('<p>sfx</p>');
  const taps = meta.taps.map(function (t, i) { return { t: t.t, k: (i + 1) + (i % 2) }; }), burstT = meta.burstFrame / FPS, len = burstT + 3;
  const pcm = await page.evaluate(async function (o) {
    const SR = 44100, a = new OfflineAudioContext(2, Math.ceil(SR * o.len), SR), master = a.createGain(); master.gain.value = 0.9; master.connect(a.destination);
    const PENTA = [0, 2, 4, 7, 9], hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    const noteHz = function (k, oct) { const r = o.root > 6 ? o.root - 12 : o.root; k = ((k % 10) + 10) % 10; return hz(60 + (oct || 0) * 12 + r + PENTA[k % 5] + 12 * Math.floor(k / 5)); };
    const pluck = function (t, f, d, g, type) { const os = a.createOscillator(), v = a.createGain(); os.type = type || 'triangle'; os.frequency.setValueAtTime(f, t); v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g || 0.25, t + 0.008); v.gain.exponentialRampToValueAtTime(0.0001, t + d); os.connect(v); v.connect(master); os.start(t); os.stop(t + d + 0.05); };
    const NB = a.createBuffer(1, SR, SR), ch = NB.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const noise = function (t, d, f, g, f2) { const s = a.createBufferSource(), bp = a.createBiquadFilter(), v = a.createGain(); s.buffer = NB; bp.type = 'bandpass'; bp.Q.value = 0.9; bp.frequency.setValueAtTime(f, t); if (f2) bp.frequency.exponentialRampToValueAtTime(f2, t + d); v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(bp); bp.connect(v); v.connect(master); s.start(t, Math.random() * 0.5, d + 0.05); };
    const bellTone = function (t, f, g) { [[1, 1, 1.5], [2.76, 0.42, 0.9], [5.4, 0.22, 0.5], [8.93, 0.1, 0.25]].forEach(function (p) { pluck(t, f * p[0], p[2], (g || 0.2) * p[1], 'sine'); }); };
    o.taps.forEach(function (x) { pluck(x.t, noteHz(x.k, 0), 0.22, 0.24); pluck(x.t + 0.05, noteHz(x.k + 2, 0), 0.25, 0.16); noise(x.t, 0.09, 2600, 0.12, 900); });
    const t = o.burst; noise(t, 0.5, 500, 0.3, 5000); for (let i = 0; i < 6; i++) pluck(t + 0.05 + i * 0.07, noteHz(i, 0), 0.5, 0.2); bellTone(t + 0.5, noteHz(5, 1), 0.2);
    const buf = await a.startRendering(); return [Array.from(buf.getChannelData(0)), Array.from(buf.getChannelData(1))];
  }, { len: len, root: meta.root, taps: taps, burst: burstT });
  const N = pcm[0].length, wav = Buffer.alloc(44 + N * 4);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22); wav.writeUInt32LE(44100, 24); wav.writeUInt32LE(44100 * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) for (let c = 0; c < 2; c++) wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(pcm[c][i] * 32767))), 44 + i * 4 + c * 2);
  fs.writeFileSync(meta.sfx, wav);
  await ctx.close();
  // ----- 2. the maker's ready screen, scrolled to its sharing buttons -----
  const id = (await S.db.get('SELECT id FROM cards WHERE slug = ?', [o.slug])).id;
  ctx = await context(b, PUB); await ctx.addInitScript(function () { navigator.share = function () { return Promise.resolve(); }; navigator.canShare = function () { return true; }; });
  page = await ctx.newPage(); errors = []; page.on('pageerror', function (e) { errors.push(String(e.message || e)); });
  await page.goto('/make?card=' + id, { waitUntil: 'load' });
  await page.waitForSelector('.ready', { timeout: 15000 });
  await page.waitForTimeout(800);
  const total = await page.evaluate(function () { return document.documentElement.scrollHeight - innerHeight; });
  const target = await page.evaluate(function () { const b = Array.from(document.querySelectorAll('.rowbtns .btn'))[0]; const r = b.getBoundingClientRect(); return Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, scrollY + r.top - innerHeight * 0.42)); });
  // hold at the top, then glide down to the buttons, then hold (the tap is drawn by the ad over these frames)
  let m = 0; const hold = async function (k) { for (let i = 0; i < k; i++) await shot(page, path.join(out, 'share', 'f' + String(++m).padStart(5, '0') + '.jpg')); };
  await hold(Math.round(0.8 * FPS));
  const glide = Math.round(0.9 * FPS);
  for (let i = 1; i <= glide; i++) { const e = i / glide, y = target * (1 - Math.pow(1 - e, 3)); await page.evaluate(function (y) { window.scrollTo(0, y); }, y); await page.waitForTimeout(16); await shot(page, path.join(out, 'share', 'f' + String(++m).padStart(5, '0') + '.jpg')); }
  meta.shareScrollEnd = m;
  const btn = await page.evaluate(function () { return Array.from(document.querySelectorAll('.rowbtns .btn')).map(function (b) { const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }); });
  meta.buttons = btn; meta.shareMax = total;
  await page.evaluate(function () { const b = document.querySelector('.rowbtns .btn'); b.classList.add('pressed'); });
  await hold(Math.round(2.6 * FPS));
  meta.shareFrames = m; meta.shareErrors = errors;
  await ctx.close();
  fs.writeFileSync(path.join(out, 'rec.json'), JSON.stringify(meta, null, 1));
  console.log(name + ': ' + n + ' card frames (plays from frame ' + meta.playFrame + '), ' + m + ' share frames; buttons ' + btn.map(function (x) { return x.text; }).join(' / ') + (meta.cardErrors.length || errors.length ? '; ERRORS ' + JSON.stringify(meta.cardErrors.concat(errors)) : ''));
}

(async function () {
  await S.ready;
  await S.grant(UID, 4, 'the ads recording (a copy of the data)', 'ads:rec:credits');   // so the header reads "4 credits", not 0
  const b = await chromium.launch();
  try { for (const w of (process.argv[2] ? [process.argv[2]] : Object.keys(SHOTS))) await record(w, b); }
  finally { await b.close(); fs.rmSync(data, { recursive: true, force: true }); }
  process.exit(0);
})().catch(function (e) { console.error(e); fs.rmSync(data, { recursive: true, force: true }); process.exit(1); });
