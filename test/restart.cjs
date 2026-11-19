// node test/restart.cjs : THE MACHINE IS STOPPED IN THE MIDDLE OF A VIDEO, AND STARTED AGAIN (fly.toml stops it when
// idle; a deploy and a crash stop it too). Unlike test/server.cjs, which plays a restart inside one process, this
// one has a real worker: a second node process that starts the way the server does (boot(): no request is needed),
// is killed while it is drawing the video, and is started again.
//   kill -9 (a crash, the machine pulled away)   and   SIGTERM (Fly stopping it, a deploy)
// Each time: the job is still that machine's in the database, the old video is still the one in storage, the next
// start puts the job back and finishes it by itself, and the song is neither asked for nor paid for again.
// No port is bound and nothing reaches the network (the worker has no email key: it would have nobody to tell).
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const sleep = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };

if (process.argv.indexOf('--worker') >= 0) {   // ----- the worker: the server's own start, minus the port -----
  delete process.env.RESEND_API_KEY;
  const S = require('../server.js');
  process.on('SIGTERM', S.shutdown);
  S.boot().then(async function () {
    for (;;) { await sleep(100); if (!S.jobs.state.running && !await S.db.get("SELECT id FROM jobs WHERE state IN ('queued', 'running') LIMIT 1")) process.exit(0); }
  }).catch(function (e) { console.error('worker:', e.message); process.exit(1); });
  return;
}

// a video large enough to take a few seconds to draw: there is a middle to be killed in
process.env.CONFIG_OVERRIDE = JSON.stringify({ video: { sizes: { story: [720, 1280], square: [720, 720] } } });
const K = require('./kit.cjs');
(async function () {
  const T = await K.open('restart'), S = T.S, db = S.db, F = T.fakes, who = await T.user('google:restart', 'restart@example.test', 1);
  const card = await T.carol(who, { photos: 2, answers: { from: 'Restart Family' } }); assert.strictEqual(card.state, 'ready');
  const jobOf = function (id) { return db.get('SELECT * FROM jobs WHERE id = ?', [id]); }, storyOf = async function () { return (await db.get("SELECT mkey FROM media WHERE card = ? AND kind = 'story'", [card.id])).mkey; };
  const music0 = F.music.length, ledger = async function () { return (await db.get("SELECT COUNT(*) AS n FROM ledger WHERE card = ? AND kind = 'music'", [card.id])).n; }, credits = async function () { return (await db.get('SELECT COUNT(*) AS n FROM credit_log WHERE uid = ? AND delta < 0', ['google:restart'])).n; };
  const worker = function () { const p = cp.spawn(process.execPath, [__filename, '--worker'], { env: process.env, stdio: ['ignore', 'ignore', 'pipe'] }), err = []; p.stderr.on('data', function (c) { err.push(c); }); p.done = new Promise(function (ok) { p.on('exit', function (code, sig) { ok({ code: code, sig: sig, err: Buffer.concat(err).toString() }); }); }); return p; };
  const said = [];
  for (const sig of ['SIGKILL', 'SIGTERM']) {
    let r = await T.call('POST', '/api/cards/' + card.id + '/render', {}, Object.assign({ 'idempotency-key': 'restart-' + sig.toLowerCase() + '-0001' }, who)); assert.strictEqual(r.status, 200, r.text);
    const id = r.json.job, before = await storyOf(); assert.strictEqual((await jobOf(id)).state, 'queued', 'asked for, and waiting (this process runs no jobs)');
    // the machine starts: the job is taken up with no request at all
    const halves = function () { return fs.readdirSync(os.tmpdir()).filter(function (f) { return f.indexOf('send-a-carol-render-') === 0; }); }, had = halves();
    const w1 = worker(); let j = null, t0 = Date.now();
    for (;;) { await sleep(60); try { j = await jobOf(id); } catch (e) { j = null; } if (j && j.state === 'running' && j.stage === 'rendering' && j.pct > 34) break; if (j && j.state === 'done') throw new Error('the video was finished before it could be stopped: make it larger'); assert(Date.now() - t0 < 60000, 'the worker never started the job: ' + JSON.stringify(j)); }
    w1.kill(sig); const end1 = await w1.done;
    if (sig === 'SIGKILL') assert.strictEqual(end1.sig, 'SIGKILL'); else assert.strictEqual(end1.code, 0, 'SIGTERM: the worker stops its render and goes, by itself: ' + JSON.stringify(end1));
    j = await jobOf(id); assert.strictEqual(j.state, 'running', sig + ': the job is still marked as that machine\'s'); assert.strictEqual(j.owner, os.hostname()); assert(j.pct > 30 && j.pct < 100, 'stopped in the middle (' + j.pct + '%)'); assert.strictEqual(j.tries, 1);
    assert.strictEqual(await storyOf(), before, 'the video in storage is still the old one, whole'); assert.strictEqual((await T.call('GET', '/' + card.slug + '/story.mp4')).status, 200, 'and the card still plays');
    if (sig === 'SIGTERM') assert.deepStrictEqual(halves().filter(function (f) { return had.indexOf(f) < 0; }), [], 'a worker that was asked to stop leaves no half-made video behind');
    assert.strictEqual((await T.call('GET', '/api/cards/' + card.id, null, who)).json.card.job.state, 'running', 'the maker\'s page shows it as still being made');
    // the machine starts again: it finishes the job without being asked
    const w2 = worker(), end2 = await w2.done; assert.strictEqual(end2.code, 0, 'the second start finished and went idle: ' + end2.err);
    j = await jobOf(id); assert.strictEqual(j.state, 'done', sig + ': the job is finished by the next start'); assert.strictEqual(j.pct, 100); assert.strictEqual(j.tries, 2, 'on its second try'); assert.strictEqual(j.owner, null);
    const after = await storyOf(); assert.notStrictEqual(after, before, 'a new video is in storage'); r = await T.call('GET', '/' + card.slug + '/story.mp4'); assert.strictEqual(r.status, 200); assert(r.body.length > 20000 && r.body.toString('latin1', 4, 8) === 'ftyp', 'and it is a whole mp4 (' + r.body.length + ' bytes)');
    const probe = cp.spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(T.dir, 'store', 'send-a-carol', after)], { encoding: 'utf8' }); assert(probe.status === 0 && +probe.stdout > 10, 'that plays to its end (' + probe.stdout.trim() + ' s)');
    assert.strictEqual(await ledger(), 1, 'the song was made once'); assert.strictEqual(await credits(), 1, 'and paid for once'); assert.strictEqual(F.music.length, music0, 'the music service was not asked again');
    said.push(sig + ' at ' + j.pct + '% -> done on try 2');
  }
  fs.readdirSync(os.tmpdir()).filter(function (f) { return f.indexOf('send-a-carol-render-') === 0; }).forEach(function (f) { fs.rmSync(path.join(os.tmpdir(), f), { recursive: true, force: true }); });   // (what kill -9 left)
  console.log('OK restart: a worker process started the server\'s own way takes a waiting job with no request; killed in the middle of the video (kill -9, then SIGTERM) the job stays its own, the old video stays whole, and the next start finishes it by itself; one song, one credit');
  await T.done(); process.exit(0);
})().catch(function (e) { console.error(e); process.exit(1); });
