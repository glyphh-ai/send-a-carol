'use strict';
// spike/premium/stems.cjs : the song split into a vocal stem and an instrumental by the music service's own
// stem separation (POST /v1/music/stem-separation, multipart: file, stem_variation_id; the answer is a zip).
//   node spike/premium/stems.cjs <song file> [two_stems_v1|six_stems_v1]      -> OUT/stems/<variation>/*
// PAID: one call. What the account's counter read before and after is written to the tally.
const L = require('./lib.cjs'), fs = require('fs'), path = require('path'), cp = require('child_process');
(async function () {
  const src = process.argv[2], variation = process.argv[3] || 'two_stems_v1', dir = path.join(L.OUT, process.argv[4] || 'stems', variation);
  if (!src) throw new Error('which song?');
  fs.mkdirSync(dir, { recursive: true });
  const before = await L.used(), secs = L.seconds(src);
  const r = await L.postFile('/v1/music/stem-separation?output_format=mp3_44100_192', { stem_variation_id: variation }, 'file', src, 'audio/mp4');
  const after = await L.used();
  L.note('stem separation ' + variation, { seconds: secs, status: r.status, ms: r.ms, bytes: r.buffer.length, creditsBefore: before.used, creditsAfter: after.used, credits: after.used - before.used });
  console.log('status', r.status, 'in', r.ms, 'ms;', r.buffer.length, 'bytes;', r.headers['content-type'], '; credits', after.used - before.used);
  if (r.status !== 200) { console.log('THE SERVICE SAID:', r.buffer.toString().slice(0, 800)); process.exit(2); }
  const zip = path.join(dir, 'stems.zip'); fs.writeFileSync(zip, r.buffer);
  const u = cp.spawnSync('unzip', ['-o', '-q', zip, '-d', dir]); if (u.status) throw new Error('unzip: ' + u.stderr);
  fs.readdirSync(dir).forEach(function (f) { if (f !== 'stems.zip') console.log('  ' + f, fs.statSync(path.join(dir, f)).size, 'bytes', L.seconds(path.join(dir, f)), 's'); });
})().catch(function (e) { console.error('STOPPED:', e.message); process.exit(1); });
