'use strict';
// server.js : Send a Carol (the name is config.js's). Node 24, no framework. SPEC.md says what everything is for.
//   handle(req, res) is exported and is all the tests call: requiring this file never binds a port.
//   node server.js           serve on PORT (8080)
//   node server.js --check   ask the real database whether this build will run on it (Fly's release command)
// Settings (names only; SPEC.md lists them): DATABASE_URL, SESSION_SECRET, PUBLIC_URL, GOOGLE_CLIENT_ID, ADMIN_PASSWORD,
// ADMIN_EMAILS, ADMIN_MCP_KEY, RESEND_API_KEY, EMAIL_FROM, STRIPE_SECRET_KEY, ANTHROPIC_API_KEY, CLAUDE_MODEL,
// ELEVENLABS_API_KEY, ELEVEN_MUSIC_MODEL, R2_ENDPOINT, R2_BUCKET, R2_PREFIX, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, DATA_DIR.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const env = process.env;
if (require.main === module && fs.existsSync(path.join(__dirname, '.env'))) fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(function (l) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
const CFG = require('./config.js'), Store = require('./store.js'), Brand = require('./brand.js'), Agent = require('./agent.js'), Song = require('./song.js'), Render = require('./render.js'), Legal = require('./legal/legal.js');
const Templates = require('./templates.js'), Engine = require('./engine.js');

// ---------- what is served, and which build this is ----------
const ROOT = env.CLIENT_DIR || __dirname, APP = CFG.app, SITE = CFG.site;
const SCRIPTS = ['art.js', 'templates.js', 'engine.js', 'fonts.js', 'net.js', 'app.js', 'card.js', 'landing.js', 'admin-ui.js', 'style.css'], PAGES = ['landing.html', 'app.html', 'card.html', 'admin.html'];
const TYPES = { js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', html: 'text/html; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', ttf: 'font/ttf', mp4: 'video/mp4', gif: 'image/gif', m4a: 'audio/mp4', json: 'application/json', txt: 'text/plain; charset=utf-8' };
function buildOf(dir) { const h = crypto.createHash('sha256'); PAGES.concat(SCRIPTS).forEach(function (f) { h.update(f + '\n'); h.update(fs.readFileSync(path.join(dir, f))); h.update('\n'); }); return h.digest('hex').slice(0, 10); }
let BUILD = buildOf(ROOT), pages = {};
const ROUTES = ['GET /', 'GET /make', 'GET /gallery', 'GET /pricing', 'GET /admin', 'GET /healthz', 'GET /legal', 'GET /legal/:page', 'GET /auth/link', 'POST /auth/link', 'GET /stop', 'POST /stop', 'POST /mcp', 'GET /favicon.svg', 'GET /assets/:file', 'GET /fonts/:file', 'GET /examples/:file',
  'GET /:slug', 'GET /:slug/poster.jpg', 'GET /:slug/story.mp4', 'GET /:slug/square.mp4', 'GET /:slug/preview.gif', 'GET /:slug/song.m4a', 'GET /:slug/photo/:n'].concat(SCRIPTS.map(function (f) { return 'GET /' + f; }),
  ['GET /api/me', 'POST /api/auth/google', 'POST /api/auth/link', 'POST /api/auth/out', 'GET /api/templates', 'GET /api/landing', 'GET /api/cards', 'POST /api/cards', 'GET /api/cards/:id', 'POST /api/cards/:id/save', 'POST /api/cards/:id/photos', 'DELETE /api/cards/:id/photos/:pid', 'GET /api/cards/:id/photos/:pid',
    'POST /api/cards/:id/write', 'POST /api/cards/:id/song', 'POST /api/cards/:id/take', 'POST /api/cards/:id/render', 'GET /api/cards/:id/status', 'GET /api/cards/:id/song/:take', 'POST /api/cards/:id/share', 'POST /api/cards/:id/down', 'POST /api/cards/:id/up', 'DELETE /api/cards/:id', 'POST /api/cards/:id/email', 'GET /api/slug',
    'POST /api/buy', 'GET /api/buy/confirm', 'GET /api/card/:slug', 'POST /api/card/:slug/open', 'POST /api/report', 'POST /api/admin/login', 'POST /api/admin/logout', 'GET /api/admin/data', 'POST /api/admin/tool']);

// ---------- the database: Postgres when DATABASE_URL is set, otherwise a SQLite file; the same four calls ----------
const dataDir = env.DATA_DIR || path.join(__dirname, 'data');
function openDb() {
  if (env.DATABASE_URL) {
    const pg = require('pg');
    pg.types.setTypeParser(20, Number); pg.types.setTypeParser(1700, Number);
    const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 5, options: /^\w+$/.test(env.DB_SCHEMA || '') ? '-c search_path=' + env.DB_SCHEMA : undefined });
    pool.on('error', function (e) { console.error('postgres:', e.message); });
    const q = function (sql, p) { let i = 0; return pool.query(sql.replace(/\?/g, function () { return '$' + (++i); }), p || []); };
    return { postgres: true, all: async function (s, p) { return (await q(s, p)).rows; }, get: async function (s, p) { return (await q(s, p)).rows[0] || null; }, run: async function (s, p) { await q(s, p); }, exec: function (s) { return pool.query(s); } };
  }
  fs.mkdirSync(dataDir, { recursive: true });
  const lite = new (require('node:sqlite').DatabaseSync)(path.join(dataDir, APP + '.db'));
  return { postgres: false, all: async function (s, p) { const st = lite.prepare(s); return st.all.apply(st, p || []); }, get: async function (s, p) { const st = lite.prepare(s); return st.get.apply(st, p || []) || null; },
    run: async function (s, p) { const st = lite.prepare(s); st.run.apply(st, p || []); }, exec: async function (s) { lite.exec(s); } };
}
const db = openDb(), SERIAL = db.postgres ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
// THE SCHEMA ONLY GROWS: a new table with IF NOT EXISTS, a new nullable column through ADDED. Nothing is removed or
// given another name in the release that stops using it: that goes in CLEANUP, one release later (--check refuses it anywhere else).
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT, name TEXT, created BIGINT, banned INTEGER DEFAULT 0, why TEXT, paid INTEGER DEFAULT 0);
  CREATE INDEX IF NOT EXISTS users_email ON users (LOWER(email));
  CREATE TABLE IF NOT EXISTS logins (id TEXT PRIMARY KEY, uid TEXT, created BIGINT);
  CREATE TABLE IF NOT EXISTS email_links (hash TEXT PRIMARY KEY, email TEXT, back TEXT, expires BIGINT, used BIGINT DEFAULT 0);
  CREATE INDEX IF NOT EXISTS email_links_email ON email_links (email);
  CREATE TABLE IF NOT EXISTS idem (uid TEXT, ikey TEXT, at BIGINT, code INTEGER, answer TEXT, PRIMARY KEY (uid, ikey));
  CREATE INDEX IF NOT EXISTS idem_at ON idem (at);
  CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, uid TEXT, slug TEXT, state TEXT, v INTEGER, occasion TEXT, template TEXT, title TEXT, doc TEXT, paid INTEGER DEFAULT 0, take TEXT, rewrites INTEGER DEFAULT 0, shared BIGINT DEFAULT 0, opens INTEGER DEFAULT 0, created BIGINT, updated BIGINT, why TEXT);
  CREATE UNIQUE INDEX IF NOT EXISTS cards_slug ON cards (slug);
  CREATE INDEX IF NOT EXISTS cards_uid ON cards (uid, updated);
  CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, card TEXT, uid TEXT, n INTEGER, okey TEXT, skey TEXT, w INTEGER, h INTEGER, bytes BIGINT, note TEXT, at BIGINT);
  CREATE INDEX IF NOT EXISTS photos_card ON photos (card, n);
  CREATE TABLE IF NOT EXISTS takes (id TEXT PRIMARY KEY, card TEXT, n INTEGER, job TEXT, akey TEXT, seconds DOUBLE PRECISION, timing TEXT, words TEXT, peak DOUBLE PRECISION, rms DOUBLE PRECISION, at BIGINT);
  CREATE INDEX IF NOT EXISTS takes_card ON takes (card, n);
  CREATE TABLE IF NOT EXISTS media (card TEXT, kind TEXT, mkey TEXT, bytes BIGINT, take TEXT, at BIGINT, PRIMARY KEY (card, kind));
  CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, card TEXT, uid TEXT, kind TEXT, state TEXT, stage TEXT, pct INTEGER DEFAULT 0, tries INTEGER DEFAULT 0, error TEXT, args TEXT, created BIGINT, updated BIGINT);
  CREATE INDEX IF NOT EXISTS jobs_state ON jobs (state, created);
  CREATE INDEX IF NOT EXISTS jobs_card ON jobs (card, created);
  CREATE TABLE IF NOT EXISTS ledger (id ${SERIAL}, card TEXT, uid TEXT, kind TEXT, tok_in INTEGER DEFAULT 0, tok_out INTEGER DEFAULT 0, units DOUBLE PRECISION DEFAULT 0, micros BIGINT DEFAULT 0, detail TEXT, at BIGINT);
  CREATE INDEX IF NOT EXISTS ledger_card ON ledger (card);
  CREATE TABLE IF NOT EXISTS credit_log (id ${SERIAL}, uid TEXT, delta INTEGER, why TEXT, ref TEXT, at BIGINT);
  CREATE UNIQUE INDEX IF NOT EXISTS credit_log_ref ON credit_log (ref);
  CREATE INDEX IF NOT EXISTS credit_log_uid ON credit_log (uid);
  CREATE TABLE IF NOT EXISTS checkouts (session TEXT PRIMARY KEY, uid TEXT, pack TEXT, credits INTEGER, cents INTEGER, state TEXT, at BIGINT);
  CREATE INDEX IF NOT EXISTS checkouts_uid ON checkouts (uid, state);
  CREATE TABLE IF NOT EXISTS purchases (session TEXT PRIMARY KEY, uid TEXT, pack TEXT, credits INTEGER, amount INTEGER, currency TEXT, live INTEGER, at BIGINT);
  CREATE TABLE IF NOT EXISTS sends (id ${SERIAL}, card TEXT, uid TEXT, hash TEXT, state TEXT, at BIGINT);
  CREATE INDEX IF NOT EXISTS sends_card ON sends (card);
  CREATE TABLE IF NOT EXISTS suppress (hash TEXT PRIMARY KEY, at BIGINT);
  CREATE TABLE IF NOT EXISTS reports (id ${SERIAL}, card TEXT, slug TEXT, why TEXT, said TEXT, state TEXT, at BIGINT, done BIGINT);
  CREATE INDEX IF NOT EXISTS reports_state ON reports (state, at);
  CREATE TABLE IF NOT EXISTS events (id ${SERIAL}, kind TEXT, card TEXT, uid TEXT, at BIGINT);
  CREATE INDEX IF NOT EXISTS events_kind ON events (kind, at);
  CREATE TABLE IF NOT EXISTS usage_day (uid TEXT, day TEXT, kind TEXT, n INTEGER DEFAULT 0, PRIMARY KEY (uid, day, kind));
  CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT, at BIGINT);
  CREATE TABLE IF NOT EXISTS admin_log (id TEXT PRIMARY KEY, at BIGINT, who TEXT, via TEXT, tool TEXT, args TEXT, reason TEXT, result TEXT, ok INTEGER DEFAULT 1);
  CREATE INDEX IF NOT EXISTS admin_log_at ON admin_log (at);
`;
const ADDED = [];   // columns added since a table was first made: [table, column, type]
const CLEANUP = [/* cleanup:begin (statements that remove what the release BEFORE this one stopped using) */
/* cleanup:end */];
async function addColumn(a) {
  if (db.postgres) return db.exec('ALTER TABLE ' + a[0] + ' ADD COLUMN IF NOT EXISTS ' + a[1] + ' ' + a[2]);
  if (!(await db.all('PRAGMA table_info(' + a[0] + ')')).some(function (c) { return c.name === a[1]; })) await db.exec('ALTER TABLE ' + a[0] + ' ADD COLUMN ' + a[1] + ' ' + a[2]);
}
const ready = Promise.resolve().then(function () { return db.exec(SCHEMA); }).then(async function () { for (const a of ADDED) await addColumn(a); for (const s of CLEANUP) await db.exec(s); await loadSettings(); });
ready.catch(function () { /* said where it is awaited: every request, /healthz, --check */ });
const ST = Store({ env: env, dir: dataDir, prefix: APP + '/' });

// ---------- small things ----------
const now = function () { return Date.now(); }, rid = function (n) { return crypto.randomBytes(n || 9).toString('base64url').replace(/[-_]/g, 'x'); };
const str = function (v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').trim().slice(0, n); };
const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
const fail = function (msg, code, more) { return Object.assign(new Error(msg), { code: code || 400, more: more, said: true }); };
const json = function (res, obj, code) { res.writeHead(code || (obj && obj.error ? 400 : 200), { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
function raw(req, max) {
  return new Promise(function (done, no) {
    const parts = []; let n = 0, over = false;
    req.on('data', function (c) { if (!Buffer.isBuffer(c)) c = Buffer.from(c); n += c.length; if (n > max) { if (!over) { over = true; no(fail('That is too large.', 413)); req.resume(); } } else parts.push(c); });
    req.on('end', function () { if (!over) done(Buffer.concat(parts)); }); req.on('error', no);
  });
}
async function body(req, form) {
  let s = ''; try { s = (await raw(req, 200000)).toString(); } catch (e) { return {}; }
  let o = null; try { o = form && s.trim()[0] !== '{' ? Object.fromEntries(new URLSearchParams(s)) : JSON.parse(s || '{}'); } catch (e) { o = null; }
  return o && typeof o === 'object' ? o : {};
}
const tries = {};
function tooMany(req, kind, max, ms, who) {
  const k = kind + ':' + (who || req.headers['fly-client-ip'] || 'local'), t = tries[k] && tries[k].at > now() - ms ? tries[k] : (tries[k] = { at: now(), n: 0 });
  return ++t.n > max;
}
const dayOf = function () { return new Date(now()).toISOString().slice(0, 10); };
// counted per account per day in the database (a restart does not hand out a fresh allowance)
async function spendDay(uid, kind, max) {
  const day = dayOf(), r = await db.get('INSERT INTO usage_day (uid, day, kind, n) VALUES (?, ?, ?, 1) ON CONFLICT (uid, day, kind) DO UPDATE SET n = usage_day.n + 1 RETURNING n', [uid, day, kind]);
  return r.n <= max;
}
const note = function (kind, card, uid) { return db.run('INSERT INTO events (kind, card, uid, at) VALUES (?, ?, ?, ?)', [kind, card || '', uid || '', now()]); };
const locks = {};
function locked(key, work) { const p = (locks[key] || Promise.resolve()).then(work, work); locks[key] = p.catch(function () { }).finally(function () { if (locks[key] === q) delete locks[key]; }); const q = locks[key]; return p; }

// ---------- settings the admin may change: occasions (state, featured dates), templates (off, order), limits ----------
let SET = {};
async function loadSettings() { SET = {}; (await db.all('SELECT k, v FROM settings')).forEach(function (r) { try { SET[r.k] = JSON.parse(r.v); } catch (e) { /* an unreadable setting is as if it were not set */ } }); }
async function setSetting(k, v) { await db.run('INSERT INTO settings (k, v, at) VALUES (?, ?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v, at = excluded.at', [k, JSON.stringify(v), now()]); SET[k] = v; }
const limit = function (k) { const o = SET.limits && SET.limits[k]; return typeof o === 'number' && o >= 0 ? o : CFG.limits[k]; };
const inDates = function (f, md) { return !!f && f.length === 2 && (f[0] <= f[1] ? md >= f[0] && md <= f[1] : md >= f[0] || md <= f[1]); };
function occasions() {
  const made = Templates.occasions || [], md = new Date(now()).toISOString().slice(5, 10);
  const list = CFG.occasions.map(function (o) { const s = SET['occasion:' + o.id] || {}; let state = s.state || o.state; if (state === 'live' && made.indexOf(o.id) < 0) state = 'soon'; const featured = s.featured !== undefined ? s.featured : o.featured; return { id: o.id, name: o.name, hello: o.hello, state: state, featured: featured, now: state === 'live' && inDates(featured, md) }; });
  const f = list.find(function (o) { return o.now; }) || list.find(function (o) { return o.id === CFG.defaultOccasion && o.state === 'live'; }) || list.find(function (o) { return o.state === 'live'; });
  return { list: list, featured: f ? f.id : '' };
}
const tplOff = function (id) { return !!(SET['template:' + id] && SET['template:' + id].off); };
function templates(q) {
  const live = occasions().list.filter(function (o) { return o.state === 'live'; }).map(function (o) { return o.id; });
  let items = Templates.list.filter(function (t) { return !tplOff(t.id) && live.indexOf(t.occasion) >= 0; });
  const text = str(q.q, 60).toLowerCase(), per = Math.max(1, Math.min(48, +q.per || 12));
  if (q.occasion) items = items.filter(function (t) { return t.occasion === q.occasion; });
  if (q.family) items = items.filter(function (t) { return t.family === q.family; });
  if (text) items = items.filter(function (t) { return [t.name, t.blurb, t.family, t.occasion].concat(t.tags || []).join(' ').toLowerCase().indexOf(text) >= 0; });
  const ord = function (t) { const s = SET['template:' + t.id]; return s && typeof s.order === 'number' ? s.order : (t.order || 500); };
  items = items.slice().sort(function (a, b) { return ord(a) - ord(b) || (a.name < b.name ? -1 : 1); });
  const pagesN = Math.max(1, Math.ceil(items.length / per)), page = Math.max(1, Math.min(pagesN, +q.page || 1));
  return { items: items.slice((page - 1) * per, page * per).map(function (t) { return { id: t.id, name: t.name, occasion: t.occasion, family: t.family, blurb: t.blurb, tags: t.tags, bpm: t.music && t.music.bpm }; }), total: items.length, page: page, pages: pagesN, per: per,
    families: (Templates.families || []).filter(function (f) { return !q.occasion || f.occasion === q.occasion; }) };
}

// ---------- who is asking ----------
const COOKIE = 'sac', ACOOKIE = 'saca';
function sign(v) { return crypto.createHmac('sha256', env.SESSION_SECRET).update(v).digest('base64url'); }
function sessionCookie(uid) { const v = Buffer.from(uid).toString('base64url') + '.' + (now() + 365 * 864e5); return COOKIE + '=' + v + '.' + sign(v) + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000'; }
async function accountOf(req) {
  if (!env.SESSION_SECRET) return null;
  const m = new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)').exec(req.headers.cookie || ''), p = m ? m[1].split('.') : [];
  if (p.length !== 3) return null;
  const want = Buffer.from(sign(p[0] + '.' + p[1])), got = Buffer.from(p[2]);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got) || +p[1] < now()) return null;
  return db.get('SELECT * FROM users WHERE id = ?', [Buffer.from(p[0], 'base64url').toString()]);
}
const jwks = {};
async function verifyIdToken(token, url, issuers, audience) {
  const p = String(token || '').split('.');
  if (p.length !== 3 || !audience) throw new Error('bad token');
  const head = JSON.parse(Buffer.from(p[0], 'base64url')), claims = JSON.parse(Buffer.from(p[1], 'base64url'));
  if (!jwks[url] || jwks[url].at < now() - 36e5) jwks[url] = { at: now(), keys: (await (await fetch(url)).json()).keys };
  const jwk = jwks[url].keys.find(function (k) { return k.kid === head.kid; });
  if (!jwk || head.alg !== 'RS256') throw new Error('unknown key');
  const ok = crypto.verify('RSA-SHA256', Buffer.from(p[0] + '.' + p[1]), crypto.createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(p[2], 'base64url'));
  if (!ok || issuers.indexOf(claims.iss) < 0 || claims.aud !== audience || claims.exp * 1000 < now() || !claims.sub) throw new Error('token refused');
  return claims;
}
async function signInGoogle(res, claims) {
  const key = 'google:' + claims.sub, full = str(claims.name, 80), mail = claims.email_verified === true || claims.email_verified === 'true' ? str(claims.email, 120).toLowerCase() : '';
  const known = await db.get('SELECT uid FROM logins WHERE id = ?', [key]);
  let id = known ? known.uid : key;
  if (!known && mail && !await db.get('SELECT id FROM users WHERE id = ?', [key])) {
    const his = await db.get('SELECT id FROM users WHERE id = ?', ['email:' + mail]);
    if (his) { id = his.id; await db.run('INSERT INTO logins (id, uid, created) VALUES (?, ?, ?) ON CONFLICT DO NOTHING', [key, id, now()]); }
  }
  if (id === key) { await db.run('INSERT INTO users (id, email, name, created) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING', [id, mail, full, now()]); if (mail) await db.run('UPDATE users SET email = ? WHERE id = ?', [mail, id]); }
  else if (full) await db.run("UPDATE users SET name = ? WHERE id = ? AND COALESCE(name, '') = ''", [full, id]);
  await note('signin', '', id); res.setHeader('Set-Cookie', sessionCookie(id));
}
async function signInByEmail(req, res, mail) {
  let u = await db.get('SELECT id FROM users WHERE id = ?', ['email:' + mail]) || await db.get("SELECT id FROM users WHERE LOWER(email) = ? AND id LIKE 'google:%' ORDER BY created LIMIT 1", [mail]);
  if (!u) { u = { id: 'email:' + mail }; await db.run('INSERT INTO users (id, email, name, created) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING', [u.id, mail, '', now()]); }
  await note('signin', '', u.id); res.setHeader('Set-Cookie', sessionCookie(u.id));
}
const ADMINS = String(env.ADMIN_EMAILS || CFG.support).toLowerCase().split(',').map(function (s) { return s.trim(); }).filter(Boolean);
const isAdminUser = function (u) { return !!u && (u.id.indexOf('google:') === 0 || u.id.indexOf('email:') === 0) && ADMINS.indexOf(String(u.email || '').toLowerCase()) >= 0; };
function adminCookie() { const exp = String(now() + 7 * 864e5); return ACOOKIE + '=' + exp + '.' + sign('admin.' + exp) + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800'; }
async function adminOf(req) {   // -> { label } or null
  if (!env.SESSION_SECRET) return null;
  const m = new RegExp('(?:^|;\\s*)' + ACOOKIE + '=(\\d+)\\.([^;]+)').exec(req.headers.cookie || '');
  if (m && +m[1] > now() && env.ADMIN_PASSWORD) { const want = Buffer.from(sign('admin.' + m[1])), got = Buffer.from(m[2]); if (want.length === got.length && crypto.timingSafeEqual(want, got)) return { label: 'admin password' }; }
  const u = await accountOf(req); return isAdminUser(u) ? { label: u.email, uid: u.id } : null;
}
const adminKeyOk = function (given) { const key = String(env.ADMIN_MCP_KEY || ''), h = function (s) { return crypto.createHash('sha256').update(String(s)).digest(); }; return key.length >= 24 && typeof given === 'string' && crypto.timingSafeEqual(h(given), h(key)); };

// ONCE: a write that comes with an Idempotency-Key (net.js makes one for each thing it has to send, and sends it again
// until it is answered). The first answer is kept a day for that account and key; a repeat is given it without the
// work being done again. Two that arrive together wait on the one piece of work. A 5xx is not kept.
const IKEY = /^[A-Za-z0-9_-]{8,64}$/, flying = {};
let swept = 0;
async function once(req, res, uid, work) {
  const k = String(req.headers['idempotency-key'] || ''), id = uid + ' ' + k;
  const said = function (e) { if (!(e.code >= 400 && e.code < 500) || !e.said) throw e; return { code: e.code, body: Object.assign({ error: e.message }, e.more) }; };
  if (!IKEY.test(k)) { let o; try { o = { code: 200, body: await work('') }; } catch (e) { o = said(e); } return json(res, o.body, o.code); }
  const first = async function () {
    const was = await db.get('SELECT code, answer FROM idem WHERE uid = ? AND ikey = ?', [uid, k]);
    if (was) return { code: was.code, body: JSON.parse(was.answer), again: true };
    let out; try { out = { code: 200, body: await work(k) }; } catch (e) { out = said(e); }
    await db.run('INSERT INTO idem (uid, ikey, at, code, answer) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING', [uid, k, now(), out.code, JSON.stringify(out.body)]);
    if (now() - swept > 6e5) { swept = now(); db.run('DELETE FROM idem WHERE at < ?', [swept - 864e5]).catch(function (e) { console.error('idem:', e.message); }); }
    return out;
  };
  const mine = !flying[id], out = await (flying[id] || (flying[id] = first().finally(function () { delete flying[id]; })));
  if (out.again || !mine) res.setHeader('Idempotent-Replay', 'true');
  json(res, out.body, out.code);
}

// ---------- credits: the balance is the sum of credit_log; a ref is spent or granted once ----------
const balance = async function (uid) { return (await db.get('SELECT COALESCE(SUM(delta), 0) AS n FROM credit_log WHERE uid = ?', [uid])).n; };
async function grant(uid, n, why, ref) { return !!await db.get('INSERT INTO credit_log (uid, delta, why, ref, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (ref) DO NOTHING RETURNING id', [uid, n, why, ref, now()]); }
const spend = function (uid, ref) { return locked('credit ' + uid, async function () { if (await balance(uid) < 1) return false; return grant(uid, -1, 'carol', ref); }); };

// ---------- Stripe: Checkout by REST, one-off packs only. Confirmed when the buyer comes back, and looked for again at
// their next visit if they never did (checkouts table). No webhook, no recurring anything, and no way to give money back. ----------
const seam = { fetch: null };
async function stripe(method, p, params, o) {
  const head = { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' };
  if (o && o.idem) head['Idempotency-Key'] = String(o.idem);
  const r = await (seam.fetch || fetch)('https://api.stripe.com/v1' + p, { method: method, headers: head, body: params ? new URLSearchParams(params) : undefined });
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error('stripe: ' + (j.error && j.error.message || r.status)), { status: r.status });
  return j;
}
async function buy(user, b, ikey) {
  const pack = CFG.packs.find(function (p) { return p.id === b.pack; });
  if (!pack) throw fail('There is no such pack.');
  if (!(pack.cents > 0)) throw fail('That one is coming soon.', 409);
  if (!env.STRIPE_SECRET_KEY) throw fail('Payments are not open yet.', 503);
  const line = pack.label + ' on ' + CFG.name + '. Each credit makes one singing card: the song, the video and its page. ' + CFG.finalSale;
  const params = { mode: 'payment', 'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': CFG.currency, 'line_items[0][price_data][unit_amount]': String(pack.cents), 'line_items[0][price_data][product_data][name]': CFG.name + ': ' + pack.label, 'line_items[0][price_data][product_data][description]': line,
    'custom_text[submit][message]': CFG.finalSale, 'metadata[app]': APP, 'metadata[user]': user.id, 'metadata[pack]': pack.id, 'metadata[credits]': String(pack.credits), 'payment_intent_data[metadata][app]': APP, 'payment_intent_data[metadata][user]': user.id, 'payment_intent_data[description]': CFG.name + ': ' + pack.label,
    client_reference_id: user.id, success_url: SITE + '/make?paid={CHECKOUT_SESSION_ID}' + (b.card ? '&card=' + encodeURIComponent(str(b.card, 40)) : ''), cancel_url: SITE + '/make' + (b.card ? '?card=' + encodeURIComponent(str(b.card, 40)) : '') };
  if (user.email) params.customer_email = user.email;
  const s = await stripe('POST', '/checkout/sessions', params, ikey ? { idem: APP + '-buy-' + ikey } : null);
  await db.run('INSERT INTO checkouts (session, uid, pack, credits, cents, state, at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING', [s.id, user.id, pack.id, pack.credits, pack.cents, 'open', now()]);
  return { url: s.url };
}
// has this session been paid, and is it ours and this account's? Then its credits are granted, once.
async function settle(sessionId, user) {
  const s = await stripe('GET', '/checkout/sessions/' + encodeURIComponent(sessionId)), m = s.metadata || {}, pack = CFG.packs.find(function (p) { return p.id === m.pack; });
  if (m.app !== APP || m.user !== user.id || !pack) return { ok: false };
  if (s.payment_status !== 'paid') { if (s.status === 'expired') await db.run("UPDATE checkouts SET state = 'expired' WHERE session = ?", [s.id]); return { ok: false, status: s.status || '' }; }
  const credits = Math.floor(+m.credits) || pack.credits;
  await db.run('INSERT INTO purchases (session, uid, pack, credits, amount, currency, live, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING', [s.id, user.id, pack.id, credits, s.amount_total || 0, s.currency || CFG.currency, s.livemode ? 1 : 0, now()]);
  const fresh = await grant(user.id, credits, 'bought ' + pack.id, 'buy:' + s.id);
  await db.run('UPDATE users SET paid = 1 WHERE id = ?', [user.id]); user.paid = 1;   // (the answer being written, /api/me's after a recovery, says so too)
  await db.run("UPDATE checkouts SET state = 'paid' WHERE session = ?", [s.id]);
  if (fresh) await note('bought', '', user.id);
  return { ok: true, credits: credits, fresh: fresh };
}
// a buyer who paid and never came back to the page: asked about at their next visit, at most once a minute
const looked = {};
async function recover(user) {
  if (!env.STRIPE_SECRET_KEY || looked[user.id] > now() - 60000) return; looked[user.id] = now();
  const open = await db.all("SELECT session FROM checkouts WHERE uid = ? AND state = 'open' AND at > ? ORDER BY at DESC LIMIT 5", [user.id, now() - 2 * 864e5]);
  for (const c of open) { try { await settle(c.session, user); } catch (e) { console.error('recover:', e.message); } }
}

// ---------- carols ----------
const DOC_V = 1, SLUG = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){1,38}[a-z0-9]$/;
const slugify = function (s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32).replace(/-+$/, ''); };
function slugProblem(s) {
  if (typeof s !== 'string' || !SLUG.test(s)) return 'A card\'s name is 3 to 40 letters, digits and hyphens, like the-timmermans-2026.';
  if (CFG.reserved.indexOf(s) >= 0 || /\.(?:js|css|html|png|jpg|svg|ico|txt|xml|json)$/.test(s)) return 'That name is used by the site itself. Pick another.';
  return '';
}
async function freeSlug(want, mine) {
  const base = slugProblem(want) ? 'my-carol' : want;
  for (let i = 0; i < 40; i++) { const s = i ? base.slice(0, 36) + '-' + (i + 1) : base; if (slugProblem(s)) continue; const has = await db.get('SELECT id FROM cards WHERE slug = ?', [s]); if (!has || has.id === mine) return s; }
  return base.slice(0, 30) + '-' + rid(4).toLowerCase();
}
// a saved carol of an older version is brought up to this one here, and only here (the stored row is left as it was)
function docOf(row) {
  let d = null; try { d = JSON.parse(row.doc || '{}'); } catch (e) { d = {}; }
  if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
  d.v = DOC_V; d.answers = d.answers && typeof d.answers === 'object' && !Array.isArray(d.answers) ? d.answers : {}; d.script = d.script && typeof d.script === 'object' && !Array.isArray(d.script) ? d.script : null;
  // (a damaged row: what should be a list is made one, and what is not a section or a scene is left out; every other field is kept)
  if (d.script) ['lyrics', 'scenes'].forEach(function (k) { if (d.script[k] !== undefined) d.script[k] = (Array.isArray(d.script[k]) ? d.script[k] : []).filter(function (x) { return x && typeof x === 'object'; }); });
  return d;
}
const cleanAnswers = function (a, was) {
  a = a && typeof a === 'object' ? a : {}; const o = Object.assign({}, was), L = { to: 80, from: 80, relation: 60, details: limit('detailsChars'), must: 120, own: 900 };
  Object.keys(L).forEach(function (k) { if (a[k] !== undefined) o[k] = str(a[k], L[k]); });
  return o;
};
// what the maker may change by hand in the script: every line, the title, the greeting, the sign-off, captions and order
function cleanScript(s, was, pids) {
  if (!was) return null; if (!s || typeof s !== 'object') return was;
  const L = CFG.limits, o = Object.assign({}, was);
  if (s.title !== undefined) o.title = str(s.title, 56) || was.title;
  if (s.greeting !== undefined) o.greeting = str(s.greeting, 56);
  if (s.signoff !== undefined) o.signoff = str(s.signoff, 70);
  if (Array.isArray(s.lyrics)) {
    const ly = s.lyrics.map(function (x) { return { section: x && x.section === 'hook' ? 'hook' : 'verse', lines: (x && Array.isArray(x.lines) ? x.lines : []).map(function (l) { return str(l, L.lineChars).replace(/\s+/g, ' '); }).filter(Boolean) }; }).filter(function (x) { return x.lines.length; });
    const n = ly.reduce(function (a, x) { return a + x.lines.length; }, 0);
    if (n < 2) throw fail('A carol needs at least two lines to sing.'); if (n > L.lyricLines) throw fail('That is more than ' + L.lyricLines + ' lines: too long to sing in ' + CFG.video.maxSec + ' seconds.');
    o.lyrics = ly;
  }
  if (Array.isArray(s.scenes)) { const seen = {}; o.scenes = s.scenes.filter(function (x) { return x && pids.indexOf(x.pid) >= 0 && !seen[x.pid] && (seen[x.pid] = 1); }).map(function (x) { return { pid: x.pid, caption: str(x.caption, 40) }; }); pids.forEach(function (p) { if (!seen[p]) o.scenes.push({ pid: p, caption: '' }); }); }
  else o.scenes = (was.scenes || []).filter(function (x) { return pids.indexOf(x.pid) >= 0; }).concat(pids.filter(function (p) { return !(was.scenes || []).some(function (x) { return x.pid === p; }); }).map(function (p) { return { pid: p, caption: '' }; }));
  return o;
}
const photosOf = function (id) { return db.all('SELECT id, n, w, h, note, skey, okey FROM photos WHERE card = ? ORDER BY n, at', [id]); };
// what the engine draws: the script, the photos in scene order, and the chosen take's timing (or none: a click track)
function engineCard(row, doc, photos, take) {
  const s = doc.script || {}, a = doc.answers || {}, order = (s.scenes || []).filter(function (x) { return photos.some(function (p) { return p.id === x.pid; }); });
  let timing = null; if (take) { try { timing = JSON.parse(take.timing); } catch (e) { timing = null; } }
  let lyrics = s.lyrics || []; if (take && take.words) { try { lyrics = JSON.parse(take.words); } catch (e) { /* the script's words */ } }
  return { card: { template: row.template, to: a.to || '', from: a.from || '', title: s.title || '', greeting: s.greeting || '', signoff: s.signoff || '', lyrics: lyrics, scenes: order.map(function (x, i) { return { photo: i, caption: x.caption || '' }; }), timing: timing }, pids: order.map(function (x) { return x.pid; }) };
}
async function view(row, user) {   // the maker's own view of a carol
  const doc = docOf(row), photos = await photosOf(row.id), takes = await db.all('SELECT id, n, seconds, peak, rms, at FROM takes WHERE card = ? ORDER BY n', [row.id]), take = row.take ? await db.get('SELECT * FROM takes WHERE id = ?', [row.take]) : null;
  const job = await db.get("SELECT id, kind, state, stage, pct, error FROM jobs WHERE card = ? ORDER BY created DESC LIMIT 1", [row.id]), media = await db.all('SELECT kind, take FROM media WHERE card = ?', [row.id]);
  const e = engineCard(row, doc, photos, take), sent = (await db.get("SELECT COUNT(*) AS n FROM sends WHERE card = ? AND state = 'sent'", [row.id])).n;
  return { id: row.id, slug: row.slug || '', state: row.state, occasion: row.occasion, template: row.template, title: row.title || '', answers: doc.answers, script: doc.script, note: doc.note || '', paid: !!row.paid, take: row.take || '', rewrites: row.rewrites || 0, shared: !!row.shared, opens: row.opens || 0, sent: sent, updated: row.updated,
    photos: photos.map(function (p) { return { id: p.id, w: p.w, h: p.h, note: p.note || '', url: '/api/cards/' + row.id + '/photos/' + p.id }; }), takes: takes.map(function (t) { return { id: t.id, n: t.n, seconds: t.seconds, url: '/api/cards/' + row.id + '/song/' + t.id }; }), takesLeft: Math.max(0, limit('takesPerCarol') - takes.length),
    job: job && (job.state === 'queued' || job.state === 'running' || job.state === 'failed') ? job : null, media: media.map(function (m) { return m.kind; }), engine: e.card, pids: e.pids, url: row.slug ? SITE + '/' + row.slug : '', v: row.take || '' };
}
async function mine(user, id) { const row = await db.get('SELECT * FROM cards WHERE id = ? AND uid = ?', [str(id, 40), user.id]); if (!row || row.state === 'deleted') throw fail('There is no such carol.', 404); return row; }
async function saveDoc(row, doc, more) {
  const s = doc.script, sets = Object.assign({ doc: JSON.stringify(doc), title: s && s.title || row.title || '', updated: now(), v: DOC_V }, more), keys = Object.keys(sets);
  await db.run('UPDATE cards SET ' + keys.map(function (k) { return k + ' = ?'; }).join(', ') + ' WHERE id = ?', keys.map(function (k) { return sets[k]; }).concat([row.id]));
}
// every key a carol owns in storage is let go; the rows that named them go with them
async function removeMedia(id, all) {
  const keys = (await db.all('SELECT mkey AS k FROM media WHERE card = ?', [id])).concat(await db.all('SELECT akey AS k FROM takes WHERE card = ?', [id]));
  if (all) (await db.all('SELECT okey, skey FROM photos WHERE card = ?', [id])).forEach(function (p) { keys.push({ k: p.okey }, { k: p.skey }); });
  for (const x of keys) if (x.k) { try { await ST.del(x.k); } catch (e) { console.error('store:', e.message); } }
  await db.run('DELETE FROM media WHERE card = ?', [id]); await db.run('DELETE FROM takes WHERE card = ?', [id]);
  if (all) await db.run('DELETE FROM photos WHERE card = ?', [id]);
  return keys.length;
}
async function removeCard(id, why) {
  // a credit that was spent on a carol no song was ever made for (it was deleted while it waited) is given back
  const c = await db.get('SELECT uid, paid FROM cards WHERE id = ?', [id]);
  if (c && c.paid && !(await db.get('SELECT COUNT(*) AS n FROM takes WHERE card = ?', [id])).n && await db.get('SELECT id FROM credit_log WHERE ref = ?', ['carol:' + id])) { const k = rid(6); if (await grant(c.uid, 1, 'given back: the carol was deleted before its song was made', 'back:' + id + ':' + k)) await db.run('UPDATE credit_log SET ref = ? WHERE ref = ?', ['carol:' + id + ':' + k, 'carol:' + id]); }
  const raws = await db.all("SELECT id FROM jobs WHERE card = ? AND kind = 'song'", [id]); for (const j of raws) await ST.del('cards/' + id + '/raw-' + j.id + '.mp3').catch(function () { });
  const n = await removeMedia(id, true); await db.run("UPDATE cards SET state = 'deleted', slug = NULL, take = NULL, doc = '{}', title = '', why = ?, updated = ? WHERE id = ?", [str(why, 200), now(), id]); await db.run("UPDATE jobs SET state = 'failed', error = 'the carol was deleted' WHERE card = ? AND state IN ('queued', 'running')", [id]); return n; }

const KINDS = [['image/jpeg', 'jpg', function (b) { return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff; }], ['image/png', 'png', function (b) { return b.readUInt32BE(0) === 0x89504e47; }], ['image/webp', 'webp', function (b) { return b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP'; }]];
async function addPhoto(user, row, req) {
  const max = limit('photoBytes'), cl = +req.headers['content-length'];
  if (cl > max) throw fail('That photo is larger than ' + Math.round(max / 1048576) + ' MB.', 413);
  if ((await db.get('SELECT COUNT(*) AS n FROM photos WHERE card = ?', [row.id])).n >= limit('photosPerCarol')) throw fail('A carol holds up to ' + limit('photosPerCarol') + ' photos.', 409);
  if (!await spendDay(user.id, 'photo', 200)) throw fail('That is a lot of photos for one day. Try again tomorrow.', 429);
  const buf = await raw(req, max);
  if (buf.length < 32) throw fail('That is not a photo.');
  const kind = KINDS.find(function (k) { return k[2](buf); });
  if (!kind) throw fail(buf.toString('latin1', 4, 12).indexOf('ftyp') === 0 ? 'That photo is in a format this cannot read yet (HEIC). Choose "Most Compatible" in your camera settings, or send a JPEG or PNG.' : 'Send a JPEG, PNG or WebP photo.', 415);
  let small; try { small = await Render.resize(buf, limit('photoPx')); } catch (e) { throw fail('That photo could not be read. Try another.', 415); }
  if (small.from.w * small.from.h > 120e6) throw fail('That photo is too large to work with.', 413);
  const pid = 'p' + rid(8), okey = 'cards/' + row.id + '/' + pid + '-o.' + kind[1], skey = 'cards/' + row.id + '/' + pid + '-s.jpg';
  await ST.put(okey, buf, kind[0]); await ST.put(skey, small.data, 'image/jpeg');
  const n = (await db.get('SELECT COALESCE(MAX(n), -1) AS n FROM photos WHERE card = ?', [row.id])).n + 1;
  await db.run('INSERT INTO photos (id, card, uid, n, okey, skey, w, h, bytes, note, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [pid, row.id, user.id, n, okey, skey, small.w, small.h, buf.length, '', now()]);
  const doc = docOf(row); if (doc.script) { doc.script.scenes = (doc.script.scenes || []).concat([{ pid: pid, caption: '' }]); await saveDoc(row, doc); } else await db.run('UPDATE cards SET updated = ? WHERE id = ?', [now(), row.id]);
  return { id: pid, w: small.w, h: small.h, note: '', url: '/api/cards/' + row.id + '/photos/' + pid };
}
// THE AGENT WRITES (or rewrites) the carol. Free, and counted: per account per day, per carol, and carols drafted before a first purchase.
async function write(user, row, b) {
  if (!Agent.available()) throw fail('The writing agent is not set up.', 503);
  const doc = docOf(row), first = !doc.script, photos = await photosOf(row.id), tpl = Templates.get(row.template), occ = occasions().list.find(function (o) { return o.id === row.occasion; });
  if (!tpl) throw fail('That template is gone. Pick another.', 409);
  doc.answers = cleanAnswers(b.answers, doc.answers);
  if (first && !user.paid && (await db.get("SELECT COUNT(*) AS n FROM events WHERE kind = 'written' AND uid = ?", [user.id])).n >= limit('freeDrafts')) throw fail('You have drafted ' + limit('freeDrafts') + ' carols for free. Buy a pack to write more: your drafts are kept.', 402, { need: 'pack' });
  if (!first && (row.rewrites || 0) >= limit('rewritesPerCarol')) throw fail('That is ' + limit('rewritesPerCarol') + ' rewrites of this carol, which is the most the agent does for one. You can still change any line yourself.', 429);
  if (!await spendDay(user.id, 'agent', limit('agentCallsPerDay'))) throw fail('The agent has written a lot for you today. It will be back tomorrow; you can still edit every line yourself.', 429);
  let out;
  try { out = await Agent.write({ occasion: occ, today: dayOf(), template: tpl, answers: doc.answers, photos: photos.map(function (p) { return { note: p.note }; }), prior: first ? null : Object.assign({}, doc.script, { scenes: (doc.script.scenes || []).map(function (x) { return { photo: photos.findIndex(function (p) { return p.id === x.pid; }), caption: x.caption }; }) }), ask: first ? '' : str(b.ask, 300) }); }
  catch (e) { if (e.usage) await db.run('INSERT INTO ledger (card, uid, kind, tok_in, tok_out, micros, detail, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [row.id, user.id, 'text', e.usage.tok_in, e.usage.tok_out, e.usage.micros, 'failed', now()]); if (e.said) throw fail(e.message, e.code); throw e; }
  await db.run('INSERT INTO ledger (card, uid, kind, tok_in, tok_out, micros, detail, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [row.id, user.id, 'text', out.usage.tok_in, out.usage.tok_out, out.usage.micros, out.refusal ? 'refused' : (first ? 'first take' : 'rewrite') + ' ' + str(out.request, 60), now()]);
  if (out.refusal) { await saveDoc(row, doc); return { refused: true, message: out.refusal }; }
  const s = out.script;
  doc.script = { title: s.title, greeting: s.greeting, signoff: s.signoff, lyrics: s.lyrics, music: s.music, scenes: s.scenes.map(function (x) { return { pid: photos[x.photo].id, caption: x.caption }; }) }; doc.note = s.note;
  const more = first ? {} : { rewrites: (row.rewrites || 0) + 1 };
  if (!row.slug) more.slug = await freeSlug(slugify((doc.answers.from || doc.answers.to || s.title) + ' ' + new Date(now()).getUTCFullYear()), row.id);
  await saveDoc(row, doc, more); if (first) await note('written', row.id, user.id);
  return { ok: true };
}
// THE SONG: here, and only here, a credit is spent (once for a carol). Each paid carol has takesPerCarol songs.
async function askSong(user, row) {
  const doc = docOf(row);
  if (!doc.script || !(doc.script.lyrics || []).length) throw fail('Write the words first.', 409);
  if (!Song.available()) throw fail('The music service is not set up.', 503);
  if (await db.get("SELECT id FROM jobs WHERE card = ? AND state IN ('queued', 'running')", [row.id])) throw fail('This carol is already being made.', 409);
  const takes = (await db.get('SELECT COUNT(*) AS n FROM takes WHERE card = ?', [row.id])).n;
  if (takes >= limit('takesPerCarol')) throw fail('This carol has had its ' + limit('takesPerCarol') + ' takes of the song. Pick the one you like best.', 409);
  if (!row.paid) {
    if (!await spend(user.id, 'carol:' + row.id) && !await db.get('SELECT id FROM credit_log WHERE ref = ?', ['carol:' + row.id])) throw fail('Making the song takes one carol credit.', 402, { need: 'credit' });
    await db.run('UPDATE cards SET paid = 1 WHERE id = ?', [row.id]); await note('paid', row.id, user.id);
  }
  const id = 'j' + rid(9);
  await db.run('INSERT INTO jobs (id, card, uid, kind, state, stage, pct, tries, args, created, updated) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)', [id, row.id, user.id, 'song', 'queued', 'queued', JSON.stringify({ lyrics: doc.script.lyrics, music: doc.script.music }), now(), now()]);
  kick(); return { job: id };
}
async function askRender(user, row, takeId) {
  const take = await db.get('SELECT id FROM takes WHERE id = ? AND card = ?', [str(takeId || row.take, 40), row.id]);
  if (!take) throw fail('There is no song to make the video with yet.', 409);
  if (await db.get("SELECT id FROM jobs WHERE card = ? AND state IN ('queued', 'running')", [row.id])) throw fail('This carol is already being made.', 409);
  if (!await spendDay(user.id, 'render', 30)) throw fail('That is a lot of videos for one day. Try again tomorrow.', 429);
  const id = 'j' + rid(9);
  await db.run('UPDATE cards SET take = ? WHERE id = ?', [take.id, row.id]);
  await db.run('INSERT INTO jobs (id, card, uid, kind, state, stage, pct, tries, args, created, updated) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)', [id, row.id, user.id, 'render', 'queued', 'queued', JSON.stringify({ take: take.id }), now(), now()]);
  kick(); return { job: id };
}

// ---------- jobs: the song and the video are made in the background, one or two at a time, and are in the database:
// a restart puts what was running back in the queue, and a song that was already paid for is not asked for twice ----------
const J = { running: 0, on: false, idle: null, stops: {} };
const setJob = function (id, o) { const k = Object.keys(o); return db.run('UPDATE jobs SET ' + k.map(function (x) { return x + ' = ?'; }).join(', ') + ', updated = ? WHERE id = ?', k.map(function (x) { return o[x]; }).concat([now(), id])); };
async function requeue() { await db.run("UPDATE jobs SET state = 'queued', stage = 'queued' WHERE state = 'running'"); }
function kick() { if (J.on) setImmediate(pump); }
async function pump() {
  while (J.running < limit('jobsAtOnce')) {
    const next = await db.get("SELECT id FROM jobs WHERE state = 'queued' ORDER BY created LIMIT 1"); if (!next) break;
    const job = await db.get("UPDATE jobs SET state = 'running', tries = tries + 1, updated = ? WHERE id = ? AND state = 'queued' RETURNING *", [now(), next.id]); if (!job) continue;
    J.running++;
    runJob(job).catch(function (e) { console.error('job', job.id, e.message); }).finally(function () { J.running--; pump().catch(function (e) { console.error('jobs:', e.message); }); });
  }
}
async function drain() { for (;;) { await pump(); if (!J.running && !await db.get("SELECT id FROM jobs WHERE state = 'queued' LIMIT 1")) return; await new Promise(function (ok) { setTimeout(ok, 15); }); } }   // (the tests)
async function runJob(job) {
  try {
    const row = await db.get('SELECT * FROM cards WHERE id = ?', [job.card]);
    if (!row || row.state === 'deleted') throw Object.assign(new Error('the carol was deleted'), { final: true });
    if (job.kind === 'song') await songJob(job, row); else await renderJob(job, row, JSON.parse(job.args || '{}').take || row.take);
    await setJob(job.id, { state: 'done', stage: 'done', pct: 100, error: '' });
  } catch (e) {
    if (e.stopped) return;   // the server is stopping: the job stays as it is and is queued again at the next start
    const final = e.final || e.said || !(job.tries < 3);
    console.error('job', job.id, job.kind, 'try', job.tries, e.message);
    await setJob(job.id, final ? { state: 'failed', error: str(e.said ? e.message : 'It did not work this time. Try again: nothing more is charged.', 300), stage: 'failed' } : { state: 'queued', stage: 'queued', error: str(e.message, 300) });
    // a credit that bought no song at all is given back (a credit, never money)
    if (final && job.kind === 'song' && !(await db.get('SELECT COUNT(*) AS n FROM takes WHERE card = ?', [job.card])).n && await db.get('SELECT id FROM credit_log WHERE ref = ?', ['carol:' + job.card])) {
      // (the spend keeps its place in the record under another ref, so the carol can be paid for again later)
      if (await grant(job.uid, 1, 'given back: the song could not be made', 'back:' + job.id)) { await db.run('UPDATE credit_log SET ref = ? WHERE ref = ?', ['carol:' + job.card + ':' + job.id, 'carol:' + job.card]); await db.run('UPDATE cards SET paid = 0 WHERE id = ?', [job.card]); }
    }
  }
}
async function songJob(job, row) {
  let take = await db.get('SELECT * FROM takes WHERE job = ?', [job.id]);
  if (!take) {
    await setJob(job.id, { stage: 'song', pct: 5 });
    const args = JSON.parse(job.args || '{}'), tpl = Templates.get(row.template), plan = Song.plan(args, tpl), id = 't' + rid(8), akey = 'cards/' + row.id + '/' + id + '.m4a';
    // what came back is kept under the JOB's name before anything else, so a crash right after it was paid for does
    // not buy it again: the next try finds it here
    const rawKey = 'cards/' + row.id + '/raw-' + job.id + '.mp3', kept = await ST.read(rawKey);
    const audio = kept ? kept.data : await Song.compose(plan);
    if (!kept) await ST.put(rawKey, audio, 'audio/mpeg');
    const fin = await Song.finish(audio, plan, tpl && tpl.music && tpl.music.bpm);
    await ST.put(akey, fin.audio, 'audio/mp4');
    const n = (await db.get('SELECT COALESCE(MAX(n), 0) AS n FROM takes WHERE card = ?', [row.id])).n + 1;
    await db.run('INSERT INTO takes (id, card, n, job, akey, seconds, timing, words, peak, rms, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, row.id, n, job.id, akey, fin.timing.duration, JSON.stringify(fin.timing), JSON.stringify(args.lyrics), fin.levels.peak, fin.levels.rms, now()]);
    await db.run('INSERT INTO ledger (card, uid, kind, units, micros, detail, at) VALUES (?, ?, ?, ?, ?, ?, ?)', [row.id, job.uid, 'music', plan.total, Song.cost(plan.total), 'take ' + n + ', ' + plan.total.toFixed(1) + ' s asked, ' + fin.timing.duration + ' s made', now()]);
    await note('song', row.id, job.uid); await ST.del(rawKey).catch(function () { });
    take = { id: id };
  }
  await db.run('UPDATE cards SET take = ? WHERE id = ?', [take.id, row.id]);
  await renderJob(job, row, take.id);
}
async function renderJob(job, row, takeId) {
  const take = await db.get('SELECT * FROM takes WHERE id = ? AND card = ?', [takeId, row.id]);
  if (!take) throw Object.assign(new Error('the song is gone'), { final: true });
  await setJob(job.id, { stage: 'rendering', pct: 30 });
  row = await db.get('SELECT * FROM cards WHERE id = ?', [row.id]);
  const doc = docOf(row), photos = await photosOf(row.id), e = engineCard(row, doc, photos, take), images = [];
  for (const pid of e.pids) { const p = photos.find(function (x) { return x.id === pid; }), o = p && await ST.read(p.skey); images.push(o ? o.data : null); }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), APP + '-render-')), t0 = now();
  try {
    const audio = await ST.read(take.akey); if (!audio) throw Object.assign(new Error('the song is gone'), { final: true });
    const af = path.join(dir, 'song.m4a'); fs.writeFileSync(af, audio.data);
    let last = 0;
    const out = await Render.render({ card: e.card, images: images, audio: af, dir: dir, onProgress: async function (p) { if (J.stopping) return false; if (now() - last > 900) { last = now(); await setJob(job.id, { pct: 30 + Math.round(p * 0.68) }); } } });
    const put = { story: [out.story, 'mp4'], square: [out.square, 'mp4'], poster: [out.poster, 'jpg'], posterstory: [out.posterStory, 'jpg'], preview: [out.preview, 'gif'] }, stamp = rid(4);
    for (const kind of Object.keys(put)) {
      if (!put[kind][0]) continue;
      const data = fs.readFileSync(put[kind][0]); if (data.length > CFG.video.maxBytes) throw Object.assign(new Error('the video came out too large'), { final: true });
      const key = 'cards/' + row.id + '/' + take.id + '-' + stamp + '-' + kind + '.' + put[kind][1], was = await db.get('SELECT mkey FROM media WHERE card = ? AND kind = ?', [row.id, kind]);
      await ST.put(key, data);
      await db.run('INSERT INTO media (card, kind, mkey, bytes, take, at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (card, kind) DO UPDATE SET mkey = excluded.mkey, bytes = excluded.bytes, take = excluded.take, at = excluded.at', [row.id, kind, key, data.length, take.id, now()]);
      if (was && was.mkey !== key) await ST.del(was.mkey).catch(function () { });
    }
    const secs = (now() - t0) / 1000;
    await db.run('INSERT INTO ledger (card, uid, kind, units, micros, detail, at) VALUES (?, ?, ?, ?, 0, ?, ?)', [row.id, job.uid, 'render', secs, out.frames + ' frames', now()]);
    const cur = await db.get('SELECT state FROM cards WHERE id = ?', [row.id]);
    if (cur && cur.state === 'draft') { await db.run("UPDATE cards SET state = 'ready', updated = ? WHERE id = ?", [now(), row.id]); await note('ready', row.id, job.uid); }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// ---------- pages ----------
const TOKENS = function () { return { name: esc(CFG.name), tagline: esc(CFG.tagline), domain: CFG.domain, site: SITE, support: CFG.support, company: esc(CFG.company), mark: Brand.markSvg({ size: 34 }), markmono: Brand.markSvg({ size: 34, mono: true }), brand: Brand.lockupHtml(), finalsale: esc(CFG.finalSale) }; };
function html(file) {
  if (pages[file]) return pages[file];
  const T = TOKENS();
  return (pages[file] = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/(<script src="|<link rel="stylesheet" href=")(\/?[\w.-]+\.(?:js|css))"/g, function (m, a, src) { return a + src + '?v=' + BUILD + '"'; })
    .replace(/\{\{(\w+)\}\}/g, function (m, k) { return T[k] !== undefined ? T[k] : m; })
    .replace('<head>', function () { return '<head>\n<script>window.SAC_BUILD = "' + BUILD + '";</script>\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">'; }));
}
function rebuild() { BUILD = buildOf(ROOT); pages = {}; return BUILD; }   // for the tests, which change a copy of the client's files
// a small page of our own (the sign-in link, "don't email me again", a card that is not there)
function page(title, inner, code) {
  const B = CFG.brand;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(title) + ' · ' + esc(CFG.name) + '</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>' +
    '@font-face{font-family:"CT Lobster";src:url(/fonts/Lobster-Regular.ttf)}body{margin:0;min-height:100vh;display:grid;place-items:center;background:' + B.night + ';color:' + B.cream + ';font:17px/1.5 Georgia,serif;text-align:center}main{max-width:440px;padding:32px 22px}' +
    '.brand{display:inline-flex;align-items:center;gap:10px;color:' + B.cream + ';text-decoration:none;margin-bottom:26px}.brand b{font:400 30px "CT Lobster",Georgia,serif}h1{font:400 34px "CT Lobster",Georgia,serif;margin:0 0 10px}p{color:#d9c9e6;margin:0 0 16px}a{color:' + B.gold + '}b{color:' + B.cream + '}' +
    '.btn,button.btn{display:inline-block;border:0;border-radius:999px;background:' + B.berry + ';color:#fff;font:700 17px system-ui,sans-serif;padding:15px 32px;text-decoration:none;cursor:pointer}</style></head><body><main><a href="/" class="brand">' + Brand.markSvg({ size: 38 }) + '<b>' + esc(CFG.name) + '</b></a>' + inner + '</main></body></html>';
}
const gone = function (res) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }); res.end(page('Not here', '<h1>That card is not here</h1><p>It may have been taken down by the person who made it, or the link may be mistyped.</p><p><a class="btn" href="/">Make a carol of your own</a></p>')); };

const mail = require('./email.js')({ db: db, ready: ready, tooMany: tooMany, json: json, body: body, page: page, env: env, accountOf: accountOf, enter: signInByEmail });
const Admin = require('./admin.js')({ db: db, CFG: CFG, Templates: Templates, occasions: occasions, setSetting: setSetting, settings: function () { return SET; }, limit: limit, grant: grant, balance: balance, removeCard: removeCard, removeMedia: removeMedia, kick: kick, note: note, str: str, now: now, rid: rid, env: env });

// ---------- the card's own page: /<card-name>, for whoever it was sent to ----------
async function cardBySlug(slug) { return SLUG.test(slug) && !slugProblem(slug) ?db.get("SELECT * FROM cards WHERE slug = ? AND state = 'ready'", [slug]) : null; }
async function cardPage(req, res, row) {
  const doc = docOf(row), s = doc.script || {}, a = doc.answers || {}, url = SITE + '/' + row.slug, v = '?v=' + encodeURIComponent(await mediaStamp(row.id));
  const title = s.title || 'A carol for you', desc = (a.from ? a.from + ' made ' : 'Someone made ') + (a.to ? a.to : 'you') + ' a singing card. Tap to open it.';
  const og = ['<title>' + esc(title) + ' · ' + esc(CFG.name) + '</title>', '<meta name="description" content="' + esc(desc) + '">', '<link rel="canonical" href="' + url + '">',
    '<meta property="og:site_name" content="' + esc(CFG.name) + '">', '<meta property="og:type" content="video.other">', '<meta property="og:url" content="' + url + '">', '<meta property="og:title" content="' + esc(title) + '">', '<meta property="og:description" content="' + esc(desc) + '">',
    '<meta property="og:image" content="' + url + '/poster.jpg' + v + '">', '<meta property="og:image:type" content="image/jpeg">', '<meta property="og:image:width" content="' + CFG.video.sizes.square[0] + '">', '<meta property="og:image:height" content="' + CFG.video.sizes.square[1] + '">', '<meta property="og:image:alt" content="' + esc(title) + '">',
    '<meta property="og:image" content="' + url + '/preview.gif' + v + '">', '<meta property="og:image:type" content="image/gif">',
    '<meta property="og:video" content="' + url + '/square.mp4' + v + '">', '<meta property="og:video:secure_url" content="' + url + '/square.mp4' + v + '">', '<meta property="og:video:type" content="video/mp4">', '<meta property="og:video:width" content="' + CFG.video.sizes.square[0] + '">', '<meta property="og:video:height" content="' + CFG.video.sizes.square[1] + '">',
    '<meta name="twitter:card" content="summary_large_image">', '<meta name="twitter:title" content="' + esc(title) + '">', '<meta name="twitter:description" content="' + esc(desc) + '">', '<meta name="twitter:image" content="' + url + '/poster.jpg' + v + '">', '<meta name="robots" content="noindex">'].join('\n');
  res.writeHead(200, { 'Content-Type': TYPES.html, 'Cache-Control': 'no-cache', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  res.end(html('card.html').replace('<!--og-->', function () { return og; }).replace('"{{card}}"', function () { return JSON.stringify(row.slug); }));
}
const mediaStamp = async function (id) { const m = await db.get("SELECT mkey FROM media WHERE card = ? AND kind = 'poster'", [id]); return m ? crypto.createHash('sha256').update(m.mkey).digest('hex').slice(0, 8) : '0'; };
async function publicCard(row) {
  const doc = docOf(row), photos = await photosOf(row.id), take = row.take ? await db.get('SELECT * FROM takes WHERE id = ?', [row.take]) : null, e = engineCard(row, doc, photos, take), base = '/' + row.slug, v = '?v=' + await mediaStamp(row.id);
  return { slug: row.slug, title: e.card.title, to: e.card.to, from: e.card.from, occasion: row.occasion, engine: e.card, photos: e.pids.map(function (p, i) { return base + '/photo/' + i + v; }), song: take ? base + '/song.m4a' + v : '', poster: base + '/poster.jpg' + v, story: base + '/story.mp4' + v, square: base + '/square.mp4' + v, url: SITE + base, name: CFG.name };
}
async function sendStored(req, res, key, o) {
  const rh = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || ''), range = rh && (rh[1] || rh[2]) ? { start: rh[1] ? +rh[1] : null, end: rh[2] ? +rh[2] : null } : null;
  const got = key ? await ST.get(key, range) : null;
  if (!got) { res.writeHead(404, { 'Cache-Control': 'no-store' }); return res.end('not found'); }
  if (got.range === 'bad') { res.writeHead(416, { 'Content-Range': 'bytes */' + got.total }); return res.end(); }
  const head = { 'Content-Type': o.type || got.type, 'Content-Length': got.size, 'Accept-Ranges': 'bytes', 'Cache-Control': o.cache, 'X-Content-Type-Options': 'nosniff' };
  if (o.download) head['Content-Disposition'] = 'attachment; filename="' + o.download + '"';
  if (got.range) head['Content-Range'] = 'bytes ' + got.range.start + '-' + got.range.end + '/' + got.total;
  res.writeHead(got.range ? 206 : 200, head);
  for await (const c of got.body) if (res.write(c) === false) await new Promise(function (go) { res.once('drain', go); });
  res.end();
}
async function cardMedia(req, res, row, what, url) {
  const cache = 'public, max-age=3600', dl = url.searchParams.get('dl') ? row.slug + (what === 'story.mp4' ? '-story' : '') + '.mp4' : '';
  const kind = { 'poster.jpg': 'poster', 'poster-story.jpg': 'posterstory', 'story.mp4': 'story', 'square.mp4': 'square', 'preview.gif': 'preview' }[what];
  if (kind) { const m = await db.get('SELECT mkey FROM media WHERE card = ? AND kind = ?', [row.id, kind]); return sendStored(req, res, m && m.mkey, { cache: cache, download: /mp4$/.test(what) && dl }); }
  if (what === 'song.m4a') { const t = row.take && await db.get('SELECT akey FROM takes WHERE id = ?', [row.take]); return sendStored(req, res, t && t.akey, { cache: cache }); }
  const pm = /^photo\/(\d{1,2})$/.exec(what);
  if (pm) { const photos = await photosOf(row.id), e = engineCard(row, docOf(row), photos, null), p = photos.find(function (x) { return x.id === e.pids[+pm[1]]; }); return sendStored(req, res, p && p.skey, { cache: cache, type: 'image/jpeg' }); }
  res.writeHead(404); res.end('not found');
}

// ---------- the API ----------
function publicConfig() {
  const o = occasions();
  return { name: CFG.name, tagline: CFG.tagline, domain: CFG.domain, site: SITE, noun: CFG.noun, support: CFG.support, finalSale: CFG.finalSale, currency: CFG.currency, packs: CFG.packs.map(function (p) { return { id: p.id, credits: p.credits, cents: p.cents, label: p.label, soon: !(p.cents > 0) }; }),
    limits: { photos: limit('photosPerCarol'), photoBytes: limit('photoBytes'), takes: limit('takesPerCarol'), rewrites: limit('rewritesPerCarol'), freeDrafts: limit('freeDrafts'), recipients: limit('recipientsPerCarol'), lines: CFG.limits.lyricLines, lineChars: CFG.limits.lineChars, details: limit('detailsChars') },
    video: { min: CFG.video.minSec, max: CFG.video.maxSec }, occasions: o.list.filter(function (x) { return x.state !== 'off'; }), featured: o.featured, payments: !!env.STRIPE_SECRET_KEY, agent: Agent.available(), music: Song.available(), email: mail.on() };
}
let landingData = null;
function landing() {
  if (!landingData) { try { landingData = JSON.parse(fs.readFileSync(path.join(__dirname, 'examples', 'examples.json'), 'utf8')); } catch (e) { landingData = { examples: [] }; } }
  return { examples: landingData.examples, config: publicConfig() };
}
async function api(req, res, url) {
  await ready;
  const p = url.pathname, route = req.method + ' ' + p, user = await accountOf(req), q = url.searchParams;
  if (user && user.banned && p.indexOf('/api/auth/') !== 0 && route !== 'GET /api/me') return json(res, { error: 'This account has been closed. Write to ' + CFG.support + '.' }, 403);
  if (route === 'GET /api/me') {
    if (user && !user.banned) await recover(user);
    return json(res, { build: BUILD, user: user ? { id: user.id, name: user.name || '', email: user.email || '', credits: await balance(user.id), paid: !!user.paid, banned: !!user.banned, admin: isAdminUser(user) } : null, google: env.SESSION_SECRET && env.GOOGLE_CLIENT_ID || null, emailSignIn: mail.on(), config: publicConfig() });
  }
  if (route === 'POST /api/auth/google') {
    if (!env.SESSION_SECRET || !env.GOOGLE_CLIENT_ID) return json(res, { error: 'Sign-in is not set up.' }, 503);
    if (tooMany(req, 'auth', 30, 600000)) return json(res, { error: 'Too many tries. Wait a few minutes.' }, 429);
    let claims; try { claims = await verifyIdToken((await body(req)).credential, 'https://www.googleapis.com/oauth2/v3/certs', ['https://accounts.google.com', 'accounts.google.com'], env.GOOGLE_CLIENT_ID); } catch (e) { return json(res, { error: 'Sign-in failed.' }, 401); }
    await signInGoogle(res, claims); return json(res, { ok: true });
  }
  if (route === 'POST /api/auth/link') return mail.ask(req, res);
  if (route === 'POST /api/auth/out') { res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'); return json(res, { ok: true }); }
  if (route === 'GET /api/templates') return json(res, templates({ q: q.get('q'), occasion: q.get('occasion'), family: q.get('family'), page: q.get('page'), per: q.get('per') }));
  if (route === 'GET /api/landing') return json(res, landing());
  if (route === 'GET /api/slug') { const s = str(q.get('s'), 60).toLowerCase(), bad = slugProblem(s), taken = !bad && await db.get('SELECT id FROM cards WHERE slug = ?', [s]); return json(res, { slug: s, ok: !bad && (!taken || taken.id === q.get('card')), why: bad || (taken && taken.id !== q.get('card') ? 'That name is taken.' : '') }); }

  // the recipient's side: no account needed
  const pc = /^\/api\/card\/([a-z0-9-]{3,40})(\/open)?$/.exec(p);
  if (pc) {
    const row = await cardBySlug(pc[1]); if (!row) return json(res, { error: 'not found' }, 404);
    if (pc[2] && req.method === 'POST') { if (!tooMany(req, 'open:' + row.id, 3, 3600000)) { await db.run('UPDATE cards SET opens = opens + 1 WHERE id = ?', [row.id]); await note('opened', row.id, ''); } return json(res, { ok: true }); }
    if (req.method === 'GET' && !pc[2]) return json(res, await publicCard(row));
  }
  if (route === 'POST /api/report') {
    if (tooMany(req, 'report', 10, 3600000)) return json(res, { error: 'Thank you. That is enough reports for now.' }, 429);
    const b = await body(req), slug = str(b.slug, 40), row = await db.get('SELECT id FROM cards WHERE slug = ?', [slug]);
    if (!row) return json(res, { error: 'There is no such card.' }, 404);
    await db.run('INSERT INTO reports (card, slug, why, said, state, at) VALUES (?, ?, ?, ?, ?, ?)', [row.id, slug, str(b.why, 40) || 'other', str(b.text, 600), 'open', now()]); await note('reported', row.id, '');
    return json(res, { ok: true });
  }

  // the admin
  if (route === 'POST /api/admin/login') {
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json(res, { error: 'The admin password is not set.' }, 503);
    if (tooMany(req, 'admin', 8, 600000)) return json(res, { error: 'Too many tries. Wait ten minutes.' }, 429);
    const given = Buffer.from(String((await body(req)).password || '')), want = Buffer.from(env.ADMIN_PASSWORD);
    if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return json(res, { error: 'Wrong password.' }, 401);
    res.setHeader('Set-Cookie', adminCookie()); return json(res, { ok: true });
  }
  if (route === 'POST /api/admin/logout') { res.setHeader('Set-Cookie', ACOOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'); return json(res, { ok: true }); }
  if (p.indexOf('/api/admin/') === 0) {
    const who = await adminOf(req);
    if (!who) return json(res, { error: 'sign in', google: env.SESSION_SECRET && env.GOOGLE_CLIENT_ID || null, emailSignIn: mail.on() }, 401);
    if (route === 'GET /api/admin/data') return json(res, await Admin.call('admin_overview', {}, who, 'web'));
    if (route === 'POST /api/admin/tool') { const b = await body(req); try { return json(res, await Admin.call(String(b.name || ''), b.args, who, 'web')); } catch (e) { return json(res, { error: e.message }, 400); } }
    return json(res, { error: 'not found' }, 404);
  }

  // everything below is a signed-in maker's
  if (p.indexOf('/api/cards') !== 0 && p.indexOf('/api/buy') !== 0) return json(res, { error: 'not found' }, 404);
  if (!user) return json(res, { error: 'Sign in first.' }, 401);
  if (route === 'POST /api/buy') { if (tooMany(req, 'buy', 20, 3600000, user.id)) return json(res, { error: 'Slow down a little.' }, 429); const b = await body(req); return once(req, res, user.id, function (k) { return buy(user, b, k); }); }
  if (route === 'GET /api/buy/confirm') { let r = { ok: false }; if (env.STRIPE_SECRET_KEY) { try { r = await settle(q.get('session_id') || '', user); } catch (e) { r = { ok: false }; } } return json(res, { ok: r.ok, credits: await balance(user.id) }); }
  if (route === 'GET /api/cards') {
    const text = str(q.get('q'), 60).toLowerCase(), state = str(q.get('state'), 12), per = 12, page = Math.max(1, +q.get('page') || 1), where = ["uid = ?", "state <> 'deleted'"], args = [user.id];
    if (state) { where.push('state = ?'); args.push(state); } if (text) { where.push('(LOWER(title) LIKE ? OR LOWER(COALESCE(slug, \'\')) LIKE ?)'); args.push('%' + text + '%', '%' + text + '%'); }
    const total = (await db.get('SELECT COUNT(*) AS n FROM cards WHERE ' + where.join(' AND '), args)).n, rows = await db.all('SELECT id, slug, state, occasion, template, title, paid, opens, updated FROM cards WHERE ' + where.join(' AND ') + ' ORDER BY updated DESC LIMIT ? OFFSET ?', args.concat([per, (page - 1) * per]));
    return json(res, { items: rows.map(function (r) { return { id: r.id, slug: r.slug || '', state: r.state, occasion: r.occasion, template: r.template, title: r.title || 'Untitled carol', paid: !!r.paid, opens: r.opens || 0, updated: r.updated, poster: r.state === 'ready' && r.slug ? '/' + r.slug + '/poster.jpg' : '' }; }), total: total, page: page, pages: Math.max(1, Math.ceil(total / per)) });
  }
  if (route === 'POST /api/cards') {
    const b = await body(req);
    return once(req, res, user.id, async function () {
      const tpl = Templates.get(str(b.template, 60)), occ = occasions().list.find(function (o) { return o.id === (tpl && tpl.occasion); });
      if (!tpl || tplOff(tpl.id) || !occ || occ.state !== 'live') throw fail('Pick a template first.');
      if (!await spendDay(user.id, 'card', limit('carolsPerDay'))) throw fail('That is a lot of new carols for one day. Come back tomorrow, or finish one of your drafts.', 429);
      const id = 'c' + rid(9), doc = { v: DOC_V, answers: cleanAnswers(b.answers, {}), script: null };
      await db.run('INSERT INTO cards (id, uid, slug, state, v, occasion, template, title, doc, created, updated) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)', [id, user.id, 'draft', DOC_V, tpl.occasion, tpl.id, '', JSON.stringify(doc), now(), now()]);
      await note('made', id, user.id);
      return { ok: true, card: await view(await db.get('SELECT * FROM cards WHERE id = ?', [id]), user) };
    });
  }
  const m = /^\/api\/cards\/([A-Za-z0-9]{6,40})(?:\/([a-z]+)(?:\/([A-Za-z0-9]{2,40}))?)?$/.exec(p);
  if (!m) return json(res, { error: 'not found' }, 404);
  let row; try { row = await mine(user, m[1]); } catch (e) { return json(res, { error: e.message }, e.code); }
  const act = req.method + ' ' + (m[2] || '') + (m[3] ? '/:x' : ''), again = async function () { return { ok: true, card: await view(await db.get('SELECT * FROM cards WHERE id = ?', [row.id]), user) }; };
  try {
    if (act === 'GET ') return json(res, { card: await view(row, user) });
    if (act === 'GET status') { const v = await view(row, user); return json(res, { state: v.state, job: v.job, media: v.media, take: v.take, takes: v.takes, takesLeft: v.takesLeft, url: v.url, v: v.v, engine: v.job ? undefined : v.engine }); }
    if (act === 'GET photos/:x') { const ph = await db.get('SELECT skey FROM photos WHERE id = ? AND card = ?', [m[3], row.id]); return sendStored(req, res, ph && ph.skey, { cache: 'private, max-age=86400', type: 'image/jpeg' }); }
    if (act === 'GET song/:x') { const t = await db.get('SELECT akey FROM takes WHERE id = ? AND card = ?', [m[3], row.id]); return sendStored(req, res, t && t.akey, { cache: 'private, max-age=86400' }); }
    if (act === 'POST photos') return json(res, { ok: true, photo: await locked('photos ' + row.id, function () { return addPhoto(user, row, req); }) });
    if (act === 'DELETE photos/:x') {
      const ph = await db.get('SELECT id, okey, skey FROM photos WHERE id = ? AND card = ?', [m[3], row.id]);
      if (ph) { await ST.del(ph.okey); await ST.del(ph.skey); await db.run('DELETE FROM photos WHERE id = ?', [ph.id]); const doc = docOf(row); if (doc.script) { doc.script.scenes = (doc.script.scenes || []).filter(function (x) { return x.pid !== ph.id; }); await saveDoc(row, doc); } }
      return json(res, await again());
    }
    if (act === 'DELETE ') { await removeCard(row.id, 'deleted by its maker'); await note('deleted', row.id, user.id); return json(res, { ok: true }); }
    const b = await body(req);
    if (act === 'POST save') return await once(req, res, user.id, async function () {
      const doc = docOf(row), photos = await photosOf(row.id), pids = photos.map(function (x) { return x.id; }), more = {};
      if (b.v !== undefined && +b.v > DOC_V) throw fail('This page is older than your carol. Reload it.', 409);
      doc.answers = cleanAnswers(b.answers, doc.answers); doc.script = cleanScript(b.script, doc.script, pids);
      if (b.notes && typeof b.notes === 'object') for (const ph of photos) if (b.notes[ph.id] !== undefined) await db.run('UPDATE photos SET note = ? WHERE id = ?', [str(b.notes[ph.id], 80), ph.id]);
      if (b.template !== undefined && b.template !== row.template) { const tpl = Templates.get(str(b.template, 60)); if (!tpl || tplOff(tpl.id)) throw fail('That template is gone. Pick another.'); more.template = tpl.id; more.occasion = tpl.occasion; }
      if (b.slug !== undefined && b.slug !== row.slug) {
        const s = str(b.slug, 60).toLowerCase(), bad = slugProblem(s);
        if (row.shared) throw fail('This card has been shared, so its name stays: links to it are out there.', 409); if (bad) throw fail(bad);
        const has = await db.get('SELECT id FROM cards WHERE slug = ?', [s]); if (has && has.id !== row.id) throw fail('That name is taken. Try another.', 409);
        more.slug = s;
      }
      try { await saveDoc(row, doc, more); } catch (e) { if (more.slug && /unique|constraint/i.test(e.message)) throw fail('That name is taken. Try another.', 409); throw e; }
      return again();
    });
    if (act === 'POST write') { const w = await locked('write ' + row.id, function () { return write(user, row, b); }), a = await again(); if (w.refused) delete a.ok; return json(res, Object.assign(a, w)); }   // (a refusal is not "ok")
    if (act === 'POST song') return await once(req, res, user.id, function () { return locked('song ' + row.id, async function () { return Object.assign(await askSong(user, row), await again(), { credits: await balance(user.id) }); }); });
    if (act === 'POST take' || act === 'POST render') return await once(req, res, user.id, async function () { return Object.assign(await askRender(user, row, b.take), await again()); });
    if (act === 'POST share') { if (row.state !== 'ready') throw fail('This carol is not ready to share yet.', 409); if (!row.shared) { await db.run('UPDATE cards SET shared = ? WHERE id = ?', [now(), row.id]); await note('shared', row.id, user.id); } return json(res, await again()); }
    if (act === 'POST down') { if (row.state === 'ready') await db.run("UPDATE cards SET state = 'down', why = 'taken down by its maker', updated = ? WHERE id = ?", [now(), row.id]); return json(res, await again()); }
    if (act === 'POST up') { if (row.state === 'down' && row.why === 'taken down by its maker') await db.run("UPDATE cards SET state = 'ready', why = '', updated = ? WHERE id = ?", [now(), row.id]); else if (row.state === 'down') throw fail('This card was taken down by ' + CFG.name + '. Write to ' + CFG.support + '.', 403); return json(res, await again()); }
    if (act === 'POST email') return await once(req, res, user.id, async function () {
      if (row.state !== 'ready') throw fail('This carol is not ready to send yet.', 409); if (!mail.on()) throw fail('Email is not set up yet. Share the link instead.', 503);
      const list = (Array.isArray(b.to) ? b.to : String(b.to || '').split(/[\s,;]+/)).map(mail.addressOf).filter(function (a, i, all) { return a && all.indexOf(a) === i; });
      if (!list.length) throw fail('Add at least one email address.'); if (b.know !== true) throw fail('Tick the box: these must be people you know.');
      const sentN = (await db.get("SELECT COUNT(*) AS n FROM sends WHERE card = ?", [row.id])).n, left = limit('recipientsPerCarol') - sentN;
      if (list.length > left) throw fail(left > 0 ? 'This carol can be emailed to ' + left + ' more ' + (left === 1 ? 'person' : 'people') + ' (' + limit('recipientsPerCarol') + ' in all). Share the link with everyone else.' : 'This carol has been emailed to ' + limit('recipientsPerCarol') + ' people, which is the most for one. Share the link with everyone else.', 409);
      for (let i = 0; i < list.length; i++) if (!await spendDay(user.id, 'email', limit('emailsPerDay'))) throw fail('That is a lot of emails for one day. Try again tomorrow, or share the link.', 429);
      const doc = docOf(row), s = doc.script || {}, out = await mail.sendCarol({ slug: row.slug, title: s.title, signoff: s.signoff, from: doc.answers.from }, list, str(b.note, 300));
      for (const o of out) { await db.run('INSERT INTO sends (card, uid, hash, state, at) VALUES (?, ?, ?, ?, ?)', [row.id, user.id, mail.hash(o.to), o.state, now()]); if (o.state === 'sent') await note('emailed', row.id, user.id); }
      if (!row.shared && out.some(function (o) { return o.state === 'sent'; })) await db.run('UPDATE cards SET shared = ? WHERE id = ?', [now(), row.id]);
      return Object.assign({ sent: out.filter(function (o) { return o.state === 'sent'; }).length, stopped: out.filter(function (o) { return o.state === 'stopped'; }).length, failed: out.filter(function (o) { return o.state === 'failed'; }).length }, await again());
    });
  } catch (e) { if (e.said && e.code) return json(res, Object.assign({ error: e.message }, e.more), e.code); throw e; }
  return json(res, { error: 'not found' }, 404);
}

// ---------- the admin's tools for Claude: POST /mcp?admin=<ADMIN_MCP_KEY> (JSON-RPC, each call answered on its own) ----------
const MCP_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
async function mcp(req, res, url) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, accept, authorization, mcp-protocol-version, mcp-session-id', 'Cache-Control': 'no-store' };
  const send = function (code, o) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json' }, cors)); res.end(o === undefined ? '' : JSON.stringify(o)); }, err = function (code, n, msg) { return send(code, { jsonrpc: '2.0', id: null, error: { code: n, message: msg } }); };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (req.method !== 'POST') { res.writeHead(405, Object.assign({ Allow: 'POST, OPTIONS' }, cors)); return res.end(); }
  if (tooMany(req, 'mcp', 240, 6e4)) return err(429, -32000, 'too many requests, slow down');
  await ready;
  const given = url.searchParams.get('admin') || req.headers['x-admin-key'] || '';
  if (tooMany(req, 'adminkey', 30, 6e5) && !adminKeyOk(String(given))) return err(429, -32000, 'too many tries; wait ten minutes');
  if (!adminKeyOk(String(given))) return err(401, -32001, 'this connector is for the admin, with the admin key');
  const who = { label: 'admin key', key: true };
  const rpc = async function (m) {
    if (!m || m.jsonrpc !== '2.0' || typeof m.method !== 'string') return { jsonrpc: '2.0', id: m && m.id !== undefined ? m.id : null, error: { code: -32600, message: 'not a JSON-RPC request' } };
    if (m.id === undefined) return null;
    const ok = function (result) { return { jsonrpc: '2.0', id: m.id, result: result }; };
    if (m.method === 'initialize') { const want = m.params && m.params.protocolVersion; return ok({ protocolVersion: MCP_VERSIONS.indexOf(want) >= 0 ? want : MCP_VERSIONS[0], capabilities: { tools: {} }, serverInfo: { name: APP + '-admin', title: CFG.name + ' admin', version: '1.0.0' }, instructions: Admin.SAYS }); }
    if (m.method === 'ping') return ok({});
    if (m.method === 'tools/list') return ok({ tools: Admin.TOOLS });
    if (m.method === 'resources/list') return ok({ resources: [] });
    if (m.method === 'prompts/list') return ok({ prompts: [] });
    if (m.method === 'tools/call') {
      const p = m.params || {};
      if (!Admin.TOOLS.some(function (t) { return t.name === p.name; })) return { jsonrpc: '2.0', id: m.id, error: { code: -32602, message: 'unknown tool: ' + p.name } };
      try { const out = await Admin.call(p.name, p.arguments, who, 'mcp'); return ok({ content: [{ type: 'text', text: JSON.stringify(out, null, 1) }], structuredContent: out }); }
      catch (e) { return ok({ content: [{ type: 'text', text: 'Could not do that: ' + e.message }], isError: true }); }
    }
    return { jsonrpc: '2.0', id: m.id, error: { code: -32601, message: 'method not found: ' + m.method } };
  };
  let m; try { m = JSON.parse((await raw(req, 200000)).toString() || 'null'); } catch (e) { return err(400, -32700, 'that is not JSON'); }
  if (Array.isArray(m)) { const out = (await Promise.all(m.map(rpc))).filter(Boolean); return out.length ? send(200, out) : (res.writeHead(202, cors), res.end()); }
  const out = await rpc(m); if (!out) { res.writeHead(202, cors); return res.end(); }
  send(200, out);
}

// ---------- every request ----------
const FILES = {}; SCRIPTS.forEach(function (f) { FILES['/' + f] = f; });
function sendFile(req, res, file, url, cache) {
  const v = url.searchParams.get('v'), full = path.join(/^(fonts|assets|examples)\//.test(file) ? __dirname : ROOT, file);
  if (!fs.existsSync(full)) { res.writeHead(404); return res.end('not found'); }
  const st = fs.statSync(full), head = { 'Content-Type': TYPES[file.split('.').pop()] || 'application/octet-stream', 'Cache-Control': cache || (v === null ? 'no-cache' : v === BUILD ? 'public, max-age=31536000, immutable' : 'no-store'), 'Accept-Ranges': 'bytes' };
  const rh = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (rh && (rh[1] || rh[2])) { const start = rh[1] ? +rh[1] : Math.max(0, st.size - +rh[2]), end = rh[1] && rh[2] ? Math.min(+rh[2], st.size - 1) : st.size - 1; if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end(); } res.writeHead(206, Object.assign(head, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + st.size, 'Content-Length': end - start + 1 })); return fs.createReadStream(full, { start: start, end: end }).pipe(res); }
  res.writeHead(200, Object.assign(head, { 'Content-Length': st.size })); fs.createReadStream(full).pipe(res);
}
function handle(req, res) {
  const url = new URL(req.url, 'http://x'), p = url.pathname, oops = function (e) { console.error(req.method, p, e.message); if (res.headersSent) return; if (e.said && e.code >= 400 && e.code < 600) return json(res, Object.assign({ error: e.message }, e.more), e.code); json(res, { error: 'Something went wrong on our side.' }, 500); };
  res.setHeader('X-Build', BUILD);   // on every answer: how a page that was loaded before a deploy finds out
  if (p === '/healthz') return ready.then(function () { return db.get('SELECT 1 AS ok'); }).then(function () { json(res, { ok: true, build: BUILD }); }, function (e) { console.error('healthz:', e.message); json(res, { ok: false, error: 'the database did not answer' }, 503); });
  if (p === '/mcp') return mcp(req, res, url).catch(oops);
  if (p.indexOf('/api/') === 0) return api(req, res, url).catch(oops);
  if (p === '/auth/link') return mail.handle(req, res, url).catch(oops);
  if (p === '/stop') return mail.stop(req, res, url).catch(oops);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET' }); return res.end(); }
  const lm = /^\/legal(?:\/([a-z-]{1,40}))?\/?$/.exec(p);
  if (lm) { const page_ = lm[1] ? Legal.page(lm[1]) : Legal.index(); res.writeHead(page_ ? 200 : 404, { 'Content-Type': TYPES.html, 'Cache-Control': 'no-cache', 'Content-Security-Policy': Legal.CSP, 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' }); return res.end(page_ || Legal.missing()); }
  if (p === '/' || p === '/gallery' || p === '/pricing' || p === '/about' || p === '/help') { res.writeHead(200, { 'Content-Type': TYPES.html, 'Cache-Control': 'no-cache' }); return res.end(html('landing.html')); }
  if (p === '/make') { res.writeHead(200, { 'Content-Type': TYPES.html, 'Cache-Control': 'no-cache' }); return res.end(html('app.html')); }
  if (p === '/admin') { res.writeHead(200, { 'Content-Type': TYPES.html, 'Cache-Control': 'no-cache', 'X-Robots-Tag': 'noindex' }); return res.end(html('admin.html')); }
  if (p === '/favicon.svg' || p === '/favicon.ico') { res.writeHead(200, { 'Content-Type': TYPES.svg, 'Cache-Control': 'public, max-age=86400' }); return res.end(Brand.iconSvg()); }
  if (p === '/robots.txt') { res.writeHead(200, { 'Content-Type': TYPES.txt }); return res.end('User-agent: *\nAllow: /$\nAllow: /legal\nDisallow: /api/\nDisallow: /admin\n'); }
  if (p === '/assets/mark.svg') { res.writeHead(200, { 'Content-Type': TYPES.svg, 'Cache-Control': 'public, max-age=86400' }); return res.end(Brand.markSvg({ mono: url.searchParams.has('mono'), color: '#' + (/^[0-9a-f]{6}$/i.test(url.searchParams.get('c') || '') ? url.searchParams.get('c') : '2a1a2e') })); }
  const am = /^\/assets\/([a-z0-9-]+)\.png$/.exec(p);
  if (am && Brand.SHAPES[am[1]]) return Brand.png(am[1]).then(function (b) { res.writeHead(200, { 'Content-Type': TYPES.png, 'Cache-Control': 'public, max-age=86400' }); res.end(b); }).catch(oops);
  const sm = /^\/(fonts|assets|examples)\/([A-Za-z0-9][\w.-]{0,80})$/.exec(p);
  if (sm && sm[2].indexOf('..') < 0) return sendFile(req, res, sm[1] + '/' + sm[2], url, 'public, max-age=604800');
  if (FILES[p]) return sendFile(req, res, FILES[p], url);
  // a card: /<card-name> and what its page plays
  const cm = /^\/([a-z0-9][a-z0-9-]{1,38}[a-z0-9])(?:\/(poster\.jpg|poster-story\.jpg|story\.mp4|square\.mp4|preview\.gif|song\.m4a|photo\/\d{1,2})(?:\.jpg)?)?\/?$/.exec(p);
  if (cm) return ready.then(function () { return cardBySlug(cm[1]); }).then(function (row) { if (!row) return cm[2] ? (res.writeHead(404, { 'Cache-Control': 'no-store' }), res.end('not found')) : gone(res); return cm[2] ? cardMedia(req, res, row, cm[2], url) : cardPage(req, res, row); }).catch(oops);
  gone(res);
}

// ---------- --check: will this build run on the real database? No port, no row changed. ----------
const WORDS = new RegExp('DR' + 'OP\\s+(TABLE|COLUMN)|\\bREN' + 'AME\\b', 'i'), SERVER_FILES = ['server.js', 'email.js', 'admin.js'];
function statements(text) {
  const out = [], re = /\bdb\.(?:get|all|run)\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1\s*([,)+])/g; let m;
  while ((m = re.exec(text))) if (m[3] !== '+') out.push(m[2].replace(/\\(['"\\])/g, '$1'));
  return out.filter(function (s, i) { return out.indexOf(s) === i; });
}
function tablesOf() {
  const t = {};
  SCHEMA.replace(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\);/g, function (m, name, cols) { t[name] = cols.replace(/\$\{SERIAL\}/g, '').replace(/\([^)]*\)/g, '').split(',').map(function (c) { return c.trim().split(/\s+/)[0]; }).filter(function (c) { return c && c !== 'PRIMARY'; }); });
  ADDED.forEach(function (a) { t[a[0]].push(a[1]); });
  return t;
}
async function check(o) {
  o = o || {};
  const lines = [], failed = [], ok = function (s) { lines.push('ok    ' + s); }, no = function (s) { failed.push(s); lines.push('FAIL  ' + s); };
  const done = function () { lines.push(failed.length ? 'CHECK FAILED: ' + failed.length + ' thing' + (failed.length > 1 ? 's' : '') + ' wrong. Nothing was changed; do not deploy this build.' : 'CHECK PASSED'); return { ok: !failed.length, lines: lines, failed: failed }; };
  const sources = o.sources || Object.fromEntries(SERVER_FILES.map(function (f) { return [f, fs.readFileSync(path.join(__dirname, f), 'utf8')]; }));
  lines.push('checking build ' + BUILD + ' against ' + (db.postgres ? 'Postgres' + (env.DB_SCHEMA ? ' (schema ' + env.DB_SCHEMA + ')' : '') : 'a SQLite file under ' + dataDir));
  if (!db.postgres && env.FLY_APP_NAME) no('DATABASE_URL is not set on this machine: every carol would be in a file that is thrown away');
  if (ST.broken()) no('storage: ' + ST.broken()); else if (!ST.remote() && env.FLY_APP_NAME) no('the R2 settings are not set on this machine: photos and videos would be in a folder that is thrown away'); else ok('media is kept in ' + ST.where());
  let words = 0;
  Object.keys(sources).forEach(function (f) {
    const at = sources[f].replace(/cleanup:begin[\s\S]*?cleanup:end/g, function (m) { return m.replace(/[^\n]/g, ''); }).split('\n').map(function (l, i) { return WORDS.test(l) ? i + 1 : 0; }).filter(Boolean);
    if (at.length) { words++; no(f + ' line ' + at.join(', ') + ': a statement that removes a table or a column, or gives one another name, outside the cleanup list. The build running now still reads it.'); }
  });
  if (!words) ok('the schema only grows: nothing is removed or given another name outside the cleanup list');
  try { await ready; ok('the schema is applied'); } catch (e) { no('the schema could not be applied: ' + e.message); return done(); }
  const tables = tablesOf(); let n = 0;
  for (const t of Object.keys(tables)) { try { await db.all('SELECT ' + tables[t].join(', ') + ' FROM ' + t + ' LIMIT 1'); n++; } catch (e) { no('table ' + t + ' (' + tables[t].join(', ') + '): ' + e.message); } }
  ok(n + ' of ' + Object.keys(tables).length + ' tables read, with every column');
  const probe = async function (where, sql) {
    if (WORDS.test(sql)) return false;
    try { await db.all(/^\s*SELECT\b/i.test(sql) ? sql : 'EXPLAIN ' + sql, new Array((sql.match(/\?/g) || []).length).fill(null)); return true; } catch (e) { no('a statement in ' + where + ': ' + e.message + '\n        ' + sql); return false; }
  };
  for (const f of Object.keys(sources)) { const all = statements(sources[f]); let good = 0; for (const s of all) if (await probe(f, s)) good++; ok(f + ': ' + good + ' of ' + all.length + ' statements'); }
  for (const s of o.statements || []) await probe('the test', s);
  // every saved carol still opens (the newest 2000), and its template is still there
  let bad = 0; const rows = await db.all("SELECT id, template, doc FROM cards WHERE state <> 'deleted' ORDER BY updated DESC LIMIT 2000");
  for (const r of rows) { try { const d = docOf(r); if (d.script && !Templates.get(r.template)) throw new Error('its template ' + r.template + ' is gone'); if (d.script) Engine.plan(engineCard(r, d, [], null).card); } catch (e) { if (++bad <= 20) no('carol ' + r.id + ' no longer opens: ' + e.message); } }
  ok((rows.length - bad) + ' of ' + rows.length + ' saved carols open with this build');
  if (Templates.list.length < 1) no('there are no templates'); else ok(Templates.list.length + ' templates');
  return done();
}
function shutdown() { J.stopping = true; setTimeout(function () { process.exit(0); }, 4000).unref(); }

module.exports = { handle: handle, db: db, ready: ready, check: check, buildOf: buildOf, rebuild: rebuild, build: function () { return BUILD; }, ROUTES: ROUTES, CLIENT: PAGES.concat(SCRIPTS), ST: ST, Admin: Admin, mail: mail, seam: seam, jobs: { drain: drain, requeue: requeue, pump: pump, state: J }, loadSettings: loadSettings, occasions: occasions, slugProblem: slugProblem, slugify: slugify, balance: balance, grant: grant, settle: settle, docOf: docOf, engineCard: engineCard, publicCard: publicCard, DOC_V: DOC_V };
if (require.main === module && process.argv.indexOf('--check') >= 0) check().then(function (r) { console.log(r.lines.join('\n')); process.exit(r.ok ? 0 : 1); }, function (e) { console.error('CHECK FAILED: ' + e.message); process.exit(1); });
else if (require.main === module) http.createServer(handle).listen(+env.PORT || 8080, function () {
  ready.then(requeue).then(function () { J.on = true; return pump(); }).catch(function (e) { console.error('the database is not ready: ' + e.message); process.exit(1); });
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
  console.log(CFG.name + ' is up, build ' + BUILD + '; media in ' + ST.where());
  if (!env.DATABASE_URL) console.warn('DATABASE_URL is not set: keeping everything in a SQLite file under ' + dataDir);
  if (!env.SESSION_SECRET) console.warn('SESSION_SECRET is not set: nobody can sign in, and the admin is shut');
});
