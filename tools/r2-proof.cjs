'use strict';
// tools/r2-proof.cjs : THE REAL STORAGE, through the app's own adapter (store.js, its SigV4 code): put, head, a ranged
// get, list by prefix and delete of a photo and of a small mp4, then everything it wrote is deleted and the prefix is
// listed again to show it is empty. It only ever touches keys under  send-a-carol/test/  in the bucket named by
// R2_TEST_BUCKET (the adapter puts that prefix on every key and refuses any other; list() asks under it only).
// .env: R2_TEST_ENDPOINT, R2_TEST_BUCKET, R2_TEST_ACCESS_KEY_ID, R2_TEST_SECRET_ACCESS_KEY. The app's own R2_* names
// are not used here, so the app on this laptop keeps its media on disk. Nothing secret is printed.
//   node tools/r2-proof.cjs
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..'), PREFIX = 'send-a-carol/test/', E = {};
fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').forEach(function (l) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m) E[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
const Store = require('../store.js'), K = require('../test/kit.cjs');
const sha = function (b) { return crypto.createHash('sha256').update(b).digest('hex').slice(0, 16); };
const drain = async function (s) { const p = []; for await (const c of s) p.push(c); return Buffer.concat(p); };

(async function () {
  const st = Store({ env: { R2_ENDPOINT: E.R2_TEST_ENDPOINT, R2_BUCKET: E.R2_TEST_BUCKET, R2_PREFIX: PREFIX, R2_ACCESS_KEY_ID: E.R2_TEST_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY: E.R2_TEST_SECRET_ACCESS_KEY }, dir: os.tmpdir(), prefix: PREFIX });
  if (!st.remote() || st.broken()) throw new Error('the R2_TEST_* settings are not all in .env' + (st.broken() ? ': ' + st.broken() : ''));
  if (st.prefix() !== PREFIX) throw new Error('the adapter is not held to ' + PREFIX);
  console.log('media in ' + st.where());
  const run = 'run-' + Date.now().toString(36), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-r2-')), mp4 = path.join(tmp, 'v.mp4');
  const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=320x320:rate=15:duration=2', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', mp4]); if (r.status) throw new Error('ffmpeg: ' + r.stderr);
  const things = [{ key: run + '/photo.png', data: K.photo(3, 600, 800), type: 'image/png' }, { key: run + '/video.mp4', data: fs.readFileSync(mp4), type: 'video/mp4' }];
  fs.rmSync(tmp, { recursive: true, force: true });
  let failed = 0; const ok = function (cond, what) { console.log((cond ? 'ok    ' : 'FAIL  ') + what); if (!cond) failed++; };
  try {
    const before = await st.list(''); console.log('under ' + PREFIX + ' before: ' + before.length + ' object(s)');
    for (const t of things) {
      ok(!(await st.exists(t.key)), 'head ' + t.key + ' before the put: not there');
      const p = await st.put(t.key, t.data, t.type); ok(p.size === t.data.length, 'put ' + t.key + ' (' + t.data.length + ' bytes, ' + t.type + ')');
      ok(await st.exists(t.key), 'head ' + t.key + ': there');
      const whole = await st.get(t.key), body = await drain(whole.body); ok(sha(body) === sha(t.data) && whole.type === t.type && whole.total === t.data.length, 'get ' + t.key + ': the same bytes (sha256 ' + sha(body) + '), type ' + whole.type);
      const part = await st.get(t.key, { start: 100, end: 611 }), pb = await drain(part.body); ok(pb.equals(t.data.subarray(100, 612)) && part.total === t.data.length && part.range && part.range.start === 100 && part.range.end === 611, 'ranged get ' + t.key + ' bytes 100-611: ' + pb.length + ' bytes of ' + part.total + ', as put');
      const tail = await st.get(t.key, { end: 64 }), tb = await drain(tail.body); ok(tb.equals(t.data.subarray(t.data.length - 64)), 'ranged get ' + t.key + ' the last 64 bytes');
    }
    const listed = await st.list(run); ok(listed.length === 2 && listed.every(function (o) { const t = things.find(function (x) { return x.key === o.key; }); return t && t.data.length === o.size; }), 'list ' + PREFIX + run + '/: ' + listed.map(function (o) { return o.key.slice(run.length + 1) + ' (' + o.size + ')'; }).join(', '));
    ok(await st.read(run + '/nothing.jpg') === null, 'get of a key that is not there: null');
  } finally {
    for (const t of things) { await st.del(t.key); ok(!(await st.exists(t.key)), 'delete ' + t.key + ', and head: gone'); }
    const mine = await st.list(run), all = await st.list('');
    ok(mine.length === 0, 'list ' + PREFIX + run + '/ after: empty');
    ok(all.length === 0, 'list ' + PREFIX + ' after: ' + all.length + ' object(s)' + (all.length ? ' (' + all.map(function (o) { return o.key; }).join(', ') + ')' : ''));
  }
  console.log(failed ? 'R2 PROOF FAILED: ' + failed : 'R2 PROOF PASSED');
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error('R2 PROOF STOPPED: ' + e.message); process.exit(1); });
