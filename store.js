'use strict';
// store.js : where photos, songs and videos are kept. Cloudflare R2 (S3 API, signed here with SigV4, no SDK) when
// all five R2 settings are there; a folder on the disk (DATA_DIR/store) when none is (tests, and a laptop). Anything
// in between refuses every call, so a half-set machine cannot quietly keep media in a folder that is thrown away.
// Every key goes under this app's own prefix. There is no call that lists the bucket: what a carol owns is in the
// database (photos, takes, media), and deleted from there.
//   put(key, buffer, type)   get(key, range?) -> { type, size, total, body, range } | null   read(key, max) -> { type, data } | null
//   del(key)                 exists(key)
const crypto = require('crypto'), https = require('https'), fs = require('fs'), path = require('path'), { Readable } = require('stream');

const ALG = 'AWS4-HMAC-SHA256', EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const NAMES = ['R2_ENDPOINT', 'R2_BUCKET', 'R2_PREFIX', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
const KEY = /^[A-Za-z0-9][A-Za-z0-9_-]*(?:\.[A-Za-z0-9]+)*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*(?:\.[A-Za-z0-9]+)*)*$/;
const TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', mp3: 'audio/mpeg', m4a: 'audio/mp4', json: 'application/json' };
const sha = function (s) { return crypto.createHash('sha256').update(s).digest('hex'); }, hmac = function (k, s) { return crypto.createHmac('sha256', k).update(s).digest(); };
const enc = function (s) { return encodeURIComponent(s).replace(/[!'()*]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); }); };
const stamp = function (t) { return new Date(t).toISOString().replace(/[-:]|\.\d{3}/g, ''); };
const oops = function (msg, status) { return Object.assign(new Error('store: ' + msg), { status: status || 0 }); };

// q: { method, host, path (not yet encoded), headers {}, payload (sha256 hex), region, service, id, secret, at (ms) }
function sign(q) {
  const amz = stamp(q.at), day = amz.slice(0, 8), scope = day + '/' + q.region + '/' + q.service + '/aws4_request', headers = { host: q.host };
  Object.keys(q.headers || {}).forEach(function (k) { headers[k.toLowerCase()] = String(q.headers[k]).trim().replace(/\s+/g, ' '); });
  headers['x-amz-date'] = amz; headers['x-amz-content-sha256'] = q.payload;
  const names = Object.keys(headers).sort(), signed = names.join(';'), p = q.path.split('/').map(enc).join('/');
  const canonical = [q.method, p, '', names.map(function (n) { return n + ':' + headers[n] + '\n'; }).join(''), signed, q.payload].join('\n');
  const toSign = [ALG, amz, scope, sha(canonical)].join('\n');
  const signature = hmac(hmac(hmac(hmac(hmac('AWS4' + q.secret, day), q.region), q.service), 'aws4_request'), toSign).toString('hex');
  headers.authorization = ALG + ' Credential=' + q.id + '/' + scope + ', SignedHeaders=' + signed + ', Signature=' + signature;
  return { headers: headers, path: p, signature: signature };
}
function wire(q) {
  return new Promise(function (done, fail) {
    const u = new URL(q.url), req = https.request({ method: q.method, hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, headers: q.headers, timeout: 60000 }, function (res) { done({ status: res.statusCode, headers: res.headers, body: res }); });
    req.on('timeout', function () { req.destroy(oops('no answer from the store')); }); req.on('error', fail);
    req.end(q.body || undefined);
  });
}
async function drain(body) { const parts = []; if (Buffer.isBuffer(body)) return body; if (!body || typeof body[Symbol.asyncIterator] !== 'function') return Buffer.alloc(0); for await (const c of body) parts.push(c); return Buffer.concat(parts); }

function Store(d) {
  const seam = { transport: d.transport || wire, now: function () { return Date.now(); } };
  let cf = null;
  function setup(env) {
    const got = NAMES.filter(function (k) { return env[k]; }), dir = path.join(d.dir, 'store');
    // (R2_PREFIX alone, or only the two key halves, is not a try at R2: a laptop's .env often has just those)
    if (!env.R2_ENDPOINT && !env.R2_BUCKET) return (cf = { remote: false, broken: '', prefix: d.prefix, dir: dir });
    cf = { remote: true, broken: '', prefix: '' };
    if (got.length < 5) return Object.assign(cf, { broken: 'not every R2 setting is there (missing: ' + NAMES.filter(function (k) { return !env[k]; }).join(', ') + ')' });
    let u = null; try { u = new URL(env.R2_ENDPOINT); } catch (e) { u = null; }
    const prefix = String(env.R2_PREFIX).replace(/\/+$/, '') + '/';
    if (!u || u.protocol !== 'https:' || (u.pathname !== '/' && u.pathname !== '') || u.search || u.username) return Object.assign(cf, { broken: 'R2_ENDPOINT must be https://<account>.r2.cloudflarestorage.com and nothing after it' });
    if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(env.R2_BUCKET)) return Object.assign(cf, { broken: 'R2_BUCKET is not a bucket\'s name' });
    if (!KEY.test(prefix.slice(0, -1)) || prefix.indexOf('..') >= 0) return Object.assign(cf, { broken: 'R2_PREFIX must be a plain folder name' });
    return Object.assign(cf, { endpoint: u.origin, host: u.host, bucket: env.R2_BUCKET, prefix: prefix, id: env.R2_ACCESS_KEY_ID, secret: env.R2_SECRET_ACCESS_KEY });
  }
  setup(d.env || {});
  function full(key) {
    if (cf.broken) throw oops('media cannot be kept: ' + cf.broken, 503);
    if (typeof key !== 'string' || key.length > 300 || !KEY.test(key) || key.indexOf('..') >= 0) throw oops('that is not a key the app may use', 400);
    return cf.prefix + key;
  }
  const typeOf = function (key) { return TYPES[key.split('.').pop().toLowerCase()] || 'application/octet-stream'; };
  async function ask(method, key, o) {
    const name = full(key), p = '/' + cf.bucket + '/' + name;
    const s = sign({ method: method, host: cf.host, path: p, headers: o && o.headers, payload: o && o.payload || EMPTY, region: 'auto', service: 's3', id: cf.id, secret: cf.secret, at: seam.now() });
    return seam.transport({ method: method, url: cf.endpoint + s.path, headers: Object.assign(s.headers, o && o.plain), body: o && o.body || null });
  }
  async function put(key, body, type) {
    if (!Buffer.isBuffer(body)) throw oops('a put takes a buffer', 400);
    const name = full(key); type = String(type || typeOf(key));
    if (cf.remote) {
      const r = await ask('PUT', key, { headers: { 'content-type': type }, plain: { 'content-length': String(body.length) }, payload: sha(body), body: body });
      const said = (await drain(r.body)).toString('latin1').slice(0, 200);
      if (r.status !== 200) throw oops('PUT answered ' + r.status + ' ' + said.replace(/\s+/g, ' '), r.status);
    } else {
      const f = path.join(cf.dir, name); fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f + '.part', body); fs.renameSync(f + '.part', f);
    }
    return { key: key, size: body.length, type: type };
  }
  // range: { start, end } (inclusive, both optional) for a video a phone asks for in pieces
  async function get(key, range) {
    const name = full(key), want = range && (range.start != null || range.end != null);
    if (cf.remote) {
      const r = await ask('GET', key, want ? { headers: { range: 'bytes=' + (range.start != null ? range.start : '') + '-' + (range.end != null ? range.end : '') } } : null);
      if (r.status === 404) { await drain(r.body); return null; }
      if (r.status !== 200 && r.status !== 206) { await drain(r.body); throw oops('GET answered ' + r.status, r.status); }
      const cr = /bytes (\d+)-(\d+)\/(\d+)/.exec(r.headers['content-range'] || ''), size = +r.headers['content-length'] || 0;
      return { type: r.headers['content-type'] || typeOf(key), size: size, total: cr ? +cr[3] : size, range: cr ? { start: +cr[1], end: +cr[2] } : null, body: Buffer.isBuffer(r.body) ? Readable.from([r.body]) : r.body };
    }
    const f = path.join(cf.dir, name); let st; try { st = fs.statSync(f); } catch (e) { return null; }
    if (!want) return { type: typeOf(key), size: st.size, total: st.size, range: null, body: fs.createReadStream(f) };
    let start = range.start != null ? range.start : Math.max(0, st.size - range.end), end = range.start != null && range.end != null ? Math.min(range.end, st.size - 1) : st.size - 1;
    if (!(start >= 0) || start > end || start >= st.size) return { type: typeOf(key), size: 0, total: st.size, range: 'bad', body: Readable.from([]) };
    return { type: typeOf(key), size: end - start + 1, total: st.size, range: { start: start, end: end }, body: fs.createReadStream(f, { start: start, end: end }) };
  }
  async function read(key, max) { const o = await get(key); if (!o) return null; if (max && o.total > max) { o.body.destroy(); return null; } return { type: o.type, data: await drain(o.body) }; }
  async function exists(key) {
    if (cf.remote) { const r = await ask('HEAD', key); await drain(r.body); return r.status === 200; }
    return fs.existsSync(path.join(cf.dir, full(key)));
  }
  async function del(key) {
    if (cf.remote) { const r = await ask('DELETE', key); await drain(r.body); if (r.status !== 204 && r.status !== 200 && r.status !== 404) throw oops('DELETE answered ' + r.status, r.status); return true; }
    try { fs.unlinkSync(path.join(cf.dir, full(key))); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    return true;
  }
  return { put: put, get: get, read: read, del: del, exists: exists, setup: setup, seam: seam, typeOf: typeOf,
    remote: function () { return cf.remote; }, broken: function () { return cf.broken; }, prefix: function () { return cf.prefix; }, where: function () { return cf.remote ? 'R2 bucket ' + cf.bucket + ', prefix ' + cf.prefix : 'a folder on this disk (' + cf.dir + ')'; } };
}
module.exports = Store; module.exports.sign = sign; module.exports.KEY = KEY;
