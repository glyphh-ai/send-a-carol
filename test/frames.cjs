'use strict';
// test/frames.cjs : the 33 launch templates draw EXACTLY what they drew when the fixture was recorded (2026-11-18,
// before the library was added). Every one is drawn at both shapes, with photos at six times and without at three,
// and the pixels are hashed. A hash that moves means a launch carol would look different: that is a failure, never
// something to re-record casually. Pixels depend on the platform's text rasteriser, so the fixture is kept per
// platform; on a platform with no fixture this prints PENDING and passes.
//   FRAMES_WRITE=1 node test/frames.cjs   records the fixture for this platform (only when it has none)
const assert = require('node:assert'), path = require('node:path'), fs = require('node:fs'), crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const Canvas = require('@napi-rs/canvas');
const Fonts = require(path.join(root, 'fonts.js')), E = require(path.join(root, 'engine.js'));
Fonts.registerNode(Canvas, path.join(root, 'fonts'));

const ORIGINALS = ['cozy-mantel', 'plaid-pajamas', 'ugly-sweater-party', 'naughty-or-nice', 'yeti-to-party', 'snow-day', 'elf-workshop', 'grandmas-kitchen', 'fireside-stories', 'mistletoe-kiss', 'skating-waltz', 'paws-and-claus', 'tangled-in-tinsel', 'village-carolers', 'friendsmas-party', 'happy-holidays-team', 'seasons-greetings', 'holy-night', 'candlelight-carol', 'neon-noel', 'vintage-postcard', 'babys-first-christmas', 'woodland-lullaby', 'missing-you-window', 'airmail-christmas', 'birthday-bash', 'birthday-spotlight', 'love-letter', 'bloom-for-you', 'thanks-a-bunch', 'thank-you-note', 'hip-hip-hooray', 'gold-medal'];
const file = path.join(__dirname, 'fixtures', 'frames33.json'), key = process.platform + '-' + process.arch;

function picture(i, w, h) { /* a made-up photo, drawn in code: the same pixels every time */
  const cv = Canvas.createCanvas(w, h), c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, ['#f2b38a', '#8ab6f2', '#b3e08a', '#e08ac8'][i % 4]); g.addColorStop(1, ['#7a4a6a', '#2a4a7a', '#3a6a4a', '#6a2a5a'][i % 4]);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(w * 0.5, h * 0.4, Math.min(w, h) * 0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(40,30,50,0.8)'; c.fillRect(w * 0.3, h * 0.62, w * 0.4, h * 0.3);
  return cv;
}
const images = [picture(0, 400, 300), picture(1, 300, 400), picture(2, 400, 400)];
function card(id, photos) {
  return { template: id, to: 'Sam', from: 'Ada', title: 'A Carol for Sam', greeting: 'With all our love', signoff: 'from Ada and the gang',
    lyrics: [{ section: 'verse', lines: ['The porch light is on and the kettle is too', 'There is a chair by the window for you', 'We saved you the corner piece, like we do'] }, { section: 'hook', lines: ['Sam, oh Sam, this one is yours', 'Sung from our house to your front door'] }],
    scenes: photos ? [{ photo: 0, caption: 'All of us', ar: 1.33 }, { photo: 1, caption: 'That hat', ar: 0.75, solo: true }, { photo: 2, caption: '', ar: 1 }] : [],
    timing: { duration: 30, bpm: 110, offset: 0.5 } };
}
function hashes(id) {
  const out = [], shapes = [[270, 480], [320, 320]];
  for (const withPhotos of [true, false]) for (const s of shapes) for (const t of (withPhotos ? [1.5, 6, 11, 16, 22, 28] : [2, 12, 27])) {
    const cv = Canvas.createCanvas(s[0], s[1]), ctx = cv.getContext('2d');
    E.draw(ctx, s[0], s[1], card(id, withPhotos), t, { images: withPhotos ? images : [], quality: 'full' });
    out.push(crypto.createHash('sha256').update(cv.data()).digest('hex').slice(0, 16));
  }
  return crypto.createHash('sha256').update(out.join('')).digest('hex').slice(0, 24);
}

const fixture = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const now = {}; for (const id of ORIGINALS) now[id] = hashes(id);
// drawn twice, the same: nothing in a frame comes from a clock or a random number
for (const id of ORIGINALS.slice(0, 5)) assert.strictEqual(hashes(id), now[id], id + ' draws the same twice');
if (process.env.FRAMES_WRITE) {
  assert.ok(!fixture[key], 'there is already a fixture for ' + key + ': a launch template\'s pixels are not re-recorded');
  fixture[key] = now; fs.writeFileSync(file, JSON.stringify(fixture, null, 1) + '\n'); console.log('recorded ' + ORIGINALS.length + ' templates for ' + key);
} else if (!fixture[key]) console.log('PENDING frames (no fixture recorded for ' + key + ': the launch templates\' pixels were not compared here)');
else {
  const moved = ORIGINALS.filter((id) => fixture[key][id] !== now[id]);
  assert.deepStrictEqual(moved, [], 'launch templates whose frames changed: ' + moved.join(', '));
  assert.strictEqual(Object.keys(fixture[key]).length, ORIGINALS.length);
}
console.log('OK frames (' + ORIGINALS.length + ' launch templates, 30 frames each, unchanged)');
