'use strict';
// tools/libsheet.cjs : contact sheets of the library's templates (library/registry.json), to look at them.
//   node tools/libsheet.cjs <occasion> [page]    every template of one occasion, 12 to a sheet
//   node tools/libsheet.cjs sample [n]           n templates (default 48) spread over the whole library
// Each template is drawn through the engine at its title, mid-line in a cast scene and at a photo scene (made-up
// photos), tall. Writes PNGs to /tmp/carol-templates/library/. Nothing here is a test: read the sheets.
const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..');
const Canvas = require('@napi-rs/canvas');
const Fonts = require(path.join(root, 'fonts.js')); Fonts.registerNode(Canvas, path.join(root, 'fonts'));
const Engine = require(path.join(root, 'engine.js')), Lib = require(path.join(root, 'library', 'index.js'));
const what = process.argv[2] || 'sample', arg = +process.argv[3] || 0;
const out = '/tmp/carol-templates/library'; fs.mkdirSync(out, { recursive: true });
function photo(w, h, k) { const cv = Canvas.createCanvas(w, h), c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, ['#f2b38a', '#8ab6f2', '#b3e08a'][k % 3]); g.addColorStop(1, ['#7a4a6a', '#2a4a7a', '#3a6a4a'][k % 3]); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(w * 0.5, h * 0.4, Math.min(w, h) * 0.2, 0, 7); c.fill(); c.fillStyle = 'rgba(40,30,50,0.8)'; c.fillRect(w * 0.3, h * 0.62, w * 0.4, h * 0.3); return cv; }
const PH = [photo(300, 400, 0), photo(400, 300, 1), photo(300, 400, 2)];
const rows = Lib.rows();
let pick;
if (what === 'sample') { const n = arg || 48, step = rows.length / n; pick = Array.from({ length: n }, (_, i) => rows[Math.floor(i * step)]); }
else pick = rows.filter((r) => r.occ === what);
if (!pick.length) { console.error('no templates for ' + what); process.exit(2); }
const W = 180, H = 320, per = 12, cols = 4;
for (let s = 0; s * per < pick.length; s++) {
  if (what !== 'sample' && arg && s + 1 !== arg) continue;
  const part = pick.slice(s * per, s * per + per), cv = Canvas.createCanvas(cols * (W * 3 + 8), Math.ceil(part.length / cols) * (H + 40)), c = cv.getContext('2d');
  c.fillStyle = '#1b1b1b'; c.fillRect(0, 0, cv.width, cv.height);
  part.forEach((r, i) => {
    const x0 = (i % cols) * (W * 3 + 8), y0 = Math.floor(i / cols) * (H + 40), t = Lib.get(r.id);
    const card = { template: r.id, to: 'Josephine', from: 'Ada', title: 'A Carol for Josephine', greeting: 'With all our love', signoff: 'from Ada and the gang',
      lyrics: [{ section: 'verse', lines: ['The porch light is on and the kettle is too', 'We saved you the corner seat'] }, { section: 'hook', lines: ['Josephine, this one is yours'] }],
      scenes: [{ photo: 0, caption: 'All of us', ar: 0.75 }, { photo: 1, caption: '', ar: 1.33 }], timing: { duration: 30, bpm: t.music.bpm, offset: 0.5 } };
    const pl = Engine.plan(card), ly = pl.scenes.find((q) => q.kind === 'lyric'), ph = pl.scenes.find((q) => q.kind === 'photo');
    [2.2, (ly.t0 + ly.t1) / 2, (ph.t0 + ph.t1) / 2].forEach((tt, j) => { const f = Canvas.createCanvas(W, H); Engine.draw(f.getContext('2d'), W, H, card, tt, { images: PH, quality: 'full' }); c.drawImage(f, x0 + j * W, y0); });
    c.fillStyle = '#ffd23f'; c.font = '12px "CT Sans Semi"'; c.textBaseline = 'top'; c.fillText(r.name.slice(0, 70), x0 + 4, y0 + H + 4);
    c.fillStyle = '#bbb'; c.font = '10px "CT Sans"'; c.fillText([r.occ, r.set, r.pal, r.type, r.look.title + '/' + r.look.karaoke].join('  '), x0 + 4, y0 + H + 21);
  });
  const f = path.join(out, what + '-' + (s + 1) + '.png'); fs.writeFileSync(f, cv.toBuffer('image/png')); console.log(f);
}
