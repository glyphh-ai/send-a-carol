'use strict';
// node test/store.cjs : the storage adapter (store.js) with a transport of our own: nothing reaches the network.
//   sign     the SigV4 signature against the worked example in AWS's documentation (GET with a query string)
//   list     ListObjectsV2 is asked for under the app's own prefix only, signed with its query, page by page
//   local    the folder on disk answers the same calls (put, exists, ranged get, list, del)
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path'), { Readable } = require('stream');
const Store = require('../store.js');

(async function () {
  // AWS's published example ("GET Bucket (List Objects)" style, signature version 4): examplebucket, 20130524, max-keys=2&prefix=J
  const s = Store.sign({ method: 'GET', host: 'examplebucket.s3.amazonaws.com', path: '/', query: { 'max-keys': '2', prefix: 'J' }, payload: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', region: 'us-east-1', service: 's3', id: 'AKIAIOSFODNN7EXAMPLE', secret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', at: Date.UTC(2013, 4, 24) });
  assert.strictEqual(s.query, 'max-keys=2&prefix=J');
  assert.strictEqual(s.signature, '34b48302e7b5fa45bde8084f4b7868a86f0a534bc59db6670ed5711ef69dc6f7', 'the signature of AWS\'s own worked example');
  const plain = Store.sign({ method: 'GET', host: 'h', path: '/b/a key.jpg', payload: 'x', region: 'auto', service: 's3', id: 'i', secret: 's', at: 0 });
  assert.strictEqual(plain.query, ''); assert.strictEqual(plain.path, '/b/a%20key.jpg');
  console.log('OK sign: AWS\'s worked example of a signed query string gives its published signature');

  // list: two pages; a key outside the prefix in the answer is left out; nothing but the prefix is asked for
  const asked = [], xml = function (keys, more) { return '<?xml version="1.0"?><ListBucketResult><IsTruncated>' + (more ? 'true' : 'false') + '</IsTruncated>' + keys.map(function (k) { return '<Contents><Key>' + k + '</Key><Size>' + k.length + '</Size></Contents>'; }).join('') + (more ? '<NextContinuationToken>' + more + '</NextContinuationToken>' : '') + '</ListBucketResult>'; };
  const env = { R2_ENDPOINT: 'https://acct.r2.cloudflarestorage.com', R2_BUCKET: 'a-bucket', R2_PREFIX: 'send-a-carol/test/', R2_ACCESS_KEY_ID: 'id', R2_SECRET_ACCESS_KEY: 'secret' };
  const st = Store({ env: env, dir: os.tmpdir(), prefix: 'send-a-carol/', transport: async function (q) {
    asked.push(q); const u = new URL(q.url);
    const body = u.searchParams.get('continuation-token') ? xml(['send-a-carol/test/run/b&amp;c.mp4']) : xml(['send-a-carol/test/run/a.jpg', 'another-app/secret.txt'], 'tok/en+1=');
    return { status: 200, headers: {}, body: Readable.from([Buffer.from(body)]) };
  } });
  const got = await st.list('run');
  assert.deepStrictEqual(got, [{ key: 'run/a.jpg', size: 27 }, { key: 'run/b&c.mp4', size: 33 }], 'both pages, keys without the prefix, and nothing of another app');
  assert.strictEqual(asked.length, 2);
  asked.forEach(function (q) { const u = new URL(q.url); assert.strictEqual(u.pathname, '/a-bucket'); assert.strictEqual(u.searchParams.get('prefix'), 'send-a-carol/test/run/'); assert.strictEqual(u.searchParams.get('list-type'), '2'); assert(/^AWS4-HMAC-SHA256 Credential=id\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/.test(q.headers.authorization)); });
  assert.strictEqual(new URL(asked[1].url).searchParams.get('continuation-token'), 'tok/en+1=', 'the token goes back as it came');
  assert(asked[1].url.indexOf('continuation-token=tok%2Fen%2B1%3D') > 0, 'encoded on the wire as it was signed');
  await st.list(''); assert.strictEqual(new URL(asked[2].url).searchParams.get('prefix'), 'send-a-carol/test/', 'with no folder named: the app\'s own prefix, never the bucket');
  await assert.rejects(st.list('../other'), /not a key the app may use/); await assert.rejects(st.list('/etc'), /not a key the app may use/);
  console.log('OK list: asked under the app\'s own prefix only, signed with its query, followed page by page');

  // the folder on disk: the same calls
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-store-')), loc = Store({ env: {}, dir: dir, prefix: 'send-a-carol/' });
  await loc.put('cards/c1/a.jpg', Buffer.from('0123456789')); await loc.put('cards/c1/b.mp4', Buffer.from('abc')); await loc.put('cards/c2/z.jpg', Buffer.from('z'));
  assert.deepStrictEqual(await loc.list('cards/c1'), [{ key: 'cards/c1/a.jpg', size: 10 }, { key: 'cards/c1/b.mp4', size: 3 }]);
  assert.strictEqual((await loc.list('')).length, 3); assert.deepStrictEqual(await loc.list('cards/none'), []);
  const part = await loc.get('cards/c1/a.jpg', { start: 2, end: 5 }), bits = []; for await (const c of part.body) bits.push(c);
  assert.deepStrictEqual([Buffer.concat(bits).toString(), part.total, part.range], ['2345', 10, { start: 2, end: 5 }]);
  assert.strictEqual(await loc.exists('cards/c1/a.jpg'), true); await loc.del('cards/c1/a.jpg'); assert.strictEqual(await loc.exists('cards/c1/a.jpg'), false);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('OK local: put, exists, a ranged get, list and del on the folder\nOK store');
})().catch(function (e) { console.error('FAILED store: ' + (e && e.stack || e)); process.exit(1); });
