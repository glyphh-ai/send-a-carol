'use strict';
// tools/blocksheet.cjs : look at a pack of library blocks, and hold it to its rules, before it is used.
//   node tools/blocksheet.cjs <pack>            e.g. backdrops-town  (the file art/pack-backdrops-town.js)
//   node tools/blocksheet.cjs <pack> <name>     only the blocks whose name contains <name>
// Writes PNG sheets to /tmp/carol-templates/blocks/<pack>/ and prints one line per block:
//   ok|FAIL  kind name  ms (drawn at 1080x1920 or its usual size)  and what is wrong.
// The rules: draws at any time without throwing; the same pixels for the same time (no clock, no Math.random);
// leaves the canvas as it found it (alpha, transform); draws something; costs no more than its budget.
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const Canvas = require('@napi-rs/canvas');
const Fonts = require(path.join(root, 'fonts.js')); Fonts.registerNode(Canvas, path.join(root, 'fonts'));
const Art = require(path.join(root, 'art.js'));
const pack = process.argv[2], only = process.argv[3] || '';
if (!pack) { console.error('usage: node tools/blocksheet.cjs <pack> [name]'); process.exit(2); }
const KINDS = ['character', 'prop', 'frame', 'backdrop', 'particles', 'border'];
const LIST = { character: 'characters', prop: 'props', frame: 'frames', backdrop: 'backdrops', particles: 'particleNames', border: 'borders' };
// every other pack first (a pack may use another's blocks), then this one: what it adds is what is looked at
fs.readdirSync(path.join(root, 'art')).filter((f) => /^pack-[a-z0-9-]+\.js$/.test(f) && f !== 'pack-' + pack + '.js').sort().forEach((f) => { try { require(path.join(root, 'art', f)); } catch (e) { /* another pack's trouble is its own */ } });
const before = {}; KINDS.forEach((k) => { before[k] = new Set(Art[LIST[k]]); });
require(path.join(root, 'art', 'pack-' + pack + '.js'));
const added = {}; KINDS.forEach((k) => { added[k] = Art[LIST[k]].filter((n) => !before[k].has(n) && n.indexOf(only) >= 0); });
const Templates = require(path.join(root, 'templates.js')), Engine = require(path.join(root, 'engine.js'));

const PALS = {
  light: { bg: '#8fcdf2', bg2: '#fdf3e3', ink: '#27405a', accent: '#ff6b5e', accent2: '#3f9f7a', gold: '#ffc93c', snow: '#ffffff', paper: '#fffdf4' },
  dark: { bg: '#141a4a', bg2: '#3a2468', ink: '#0f1230', accent: '#ff4f8b', accent2: '#35d0c0', gold: '#ffd23f', snow: '#ffffff', paper: '#fff8ee' },
  warm: { bg: '#f08a4b', bg2: '#ffd9a0', ink: '#3a2118', accent: '#c8323c', accent2: '#2f7d55', gold: '#f2c14e', snow: '#fff8e8', paper: '#fff3d6' }
};
const BUDGET = { backdrop: 12, particles: 5, border: 4, character: 1.5, prop: 1.5, frame: 4 };   // ms, mean, on the development Mac
const out = path.join('/tmp/carol-templates/blocks', pack); fs.mkdirSync(out, { recursive: true });
function photo(w, h, k) { const cv = Canvas.createCanvas(w, h), c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, k ? '#8ab6f2' : '#f2b38a'); g.addColorStop(1, k ? '#2a4a7a' : '#7a4a6a'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(w * 0.5, h * 0.4, Math.min(w, h) * 0.2, 0, 7); c.fill(); c.fillStyle = 'rgba(40,30,50,0.8)'; c.fillRect(w * 0.3, h * 0.62, w * 0.4, h * 0.3); return cv; }
const PH = [photo(400, 300, 0), photo(300, 400, 1)];
function label(c, s, x, y, col) { c.font = '13px "CT Sans Semi"'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x, y, c.measureText(s).width + 8, 18); c.fillStyle = col || '#fff'; c.fillText(s, x + 4, y + 2); }
function ident(c) { const m = c.getTransform(); return Math.abs(m.a - 1) < 1e-6 && Math.abs(m.d - 1) < 1e-6 && Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6 && Math.abs(m.e) < 1e-6 && Math.abs(m.f) < 1e-6 && c.globalAlpha === 1; }
function sha(cv) { return crypto.createHash('sha1').update(cv.data()).digest('hex'); }
function coverage(cv) { const d = cv.data(); let n = 0; for (let i = 3; i < d.length; i += 4 * 7) if (d[i] > 8) n++; return n / (d.length / 28); }

// one block drawn once, by kind, the way the engine calls it
function drawBlock(kind, name, c, W, H, t, pal, o) {
  o = o || {};
  if (kind === 'backdrop') Art.backdrop(name, c, W, H, t, pal, { beat: (t * 1.8) % 1, n: Math.floor(t * 1.8), seed: 'sheet' });
  else if (kind === 'particles') Art.particles(name, c, W, H, t, pal, { amount: 1, seed: 'sheet', beat: (t * 1.8) % 1 });
  else if (kind === 'border') Art.border(name, c, W, H, t, pal, { beat: (t * 1.8) % 1, n: Math.floor(t * 1.8), seed: 'sheet' });
  else if (kind === 'character') Art.character(name, c, W / 2, H * 0.92, H * 0.8, { beat: o.beat == null ? (t * 1.8) % 1 : o.beat, n: o.n == null ? Math.floor(t * 1.8) : o.n, energy: 0.8, t: t, mood: o.mood || 'dance', variant: o.variant || 0, flip: !!o.flip }, pal);
  else if (kind === 'prop') Art.prop(name, c, W / 2, H / 2, Math.min(W, H) * 0.8, t, pal, { beat: (t * 1.8) % 1, n: Math.floor(t * 1.8) });
  else if (kind === 'frame') return Art.frame(name, c, o.img === undefined ? PH[1] : o.img, W * 0.08, H * 0.08, W * 0.84, H * 0.84, t, pal, { beat: 0.3, n: 2, seed: 3, tilt: 0, zoom: 1.03, art: o.art || null, festive: false, solo: !!o.solo, keep: !o.solo });
}
const SIZE = { backdrop: [1080, 1920], particles: [1080, 1920], border: [1080, 1920], character: [300, 300], prop: [320, 320], frame: [560, 700] };
function check(kind, name) {
  const s = SIZE[kind], cv = Canvas.createCanvas(s[0], s[1]), c = cv.getContext('2d'), bad = [];
  let ms = 0, n = 0;
  try {
    for (const t of [0, 0.37, 3.1, 12.3, 27.77, 59]) for (const pn of ['light', 'dark']) {
      c.clearRect(0, 0, s[0], s[1]); const a = process.hrtime.bigint(); drawBlock(kind, name, c, s[0], s[1], t, PALS[pn]); ms += Number(process.hrtime.bigint() - a) / 1e6; n++;
      if (!ident(c)) { bad.push('leaves the canvas changed (alpha or transform) at t=' + t); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; }
    }
    c.clearRect(0, 0, s[0], s[1]); drawBlock(kind, name, c, s[0], s[1], 4.2, PALS.light); const h1 = sha(cv), cov = coverage(cv);
    c.clearRect(0, 0, s[0], s[1]); drawBlock(kind, name, c, s[0], s[1], 4.2, PALS.light); if (sha(cv) !== h1) bad.push('not the same pixels twice (a clock or Math.random?)');
    if (kind === 'backdrop' && cov < 0.999) bad.push('does not paint the whole canvas (' + Math.round(cov * 100) + '%)');
    if (kind !== 'backdrop' && cov < 0.004) bad.push('draws almost nothing');
    if (kind === 'border') { const d = cv.data(); let mid = 0; for (let y = Math.round(s[1] * 0.2); y < s[1] * 0.8; y += 23) for (let x = Math.round(s[0] * 0.12); x < s[0] * 0.88; x += 19) if (d[(y * s[0] + x) * 4 + 3] > 8) mid++; if (mid) bad.push('draws in the middle of the canvas (a border stays near the edge)'); }
    if (kind === 'frame') { const q = drawBlock(kind, name, c, s[0], s[1], 1, PALS.light); if (!q || !(q.w > s[0] * 0.25) || !(q.h > s[1] * 0.2)) bad.push('must return the photo\'s box { x, y, w, h } (got ' + JSON.stringify(q) + ')'); }
    if (kind === 'character') { for (const mood of ['dance', 'sing', 'wave', 'idle']) for (let v = 0; v < 4; v++) { drawBlock(kind, name, c, s[0], s[1], 2.2, PALS.dark, { mood: mood, variant: v, flip: v % 2 === 1 }); } const A = Canvas.createCanvas(s[0], s[1]), B = Canvas.createCanvas(s[0], s[1]); drawBlock(kind, name, A.getContext('2d'), s[0], s[1], 2, PALS.light, { beat: 0.02, n: 0, mood: 'dance' }); drawBlock(kind, name, B.getContext('2d'), s[0], s[1], 2, PALS.light, { beat: 0.5, n: 1, mood: 'dance' }); if (sha(A) === sha(B)) bad.push('does not move with the beat'); }
  } catch (e) { bad.push('throws: ' + e.message); }
  const mean = n ? ms / n : 0;
  if (mean > BUDGET[kind]) bad.push('costs ' + mean.toFixed(1) + ' ms, the budget is ' + BUDGET[kind] + ' ms');
  return { bad: bad, ms: mean };
}

// ---------- the sheets ----------
function engineTile(c, x, y, W, H, backdrop, pn, stage) { /* the backdrop as it will be seen: under a title, a photo, a cast and the lyric band */
  const id = 'sheet-' + backdrop.replace(/[^a-z0-9]/g, '-') + '-' + pn + '-' + stage + '-' + W + 'x' + H;
  Templates.add({ id: id, v: 1, name: 'Sheet', occasion: 'birthday', family: 'x', blurb: '', tags: [], look: { pal: PALS[pn], fonts: { title: 'CT Fat', body: 'CT Sans Semi', lyric: 'CT Sans Bold', caption: 'CT Hand Bold' }, border: 'none', karaoke: 'pill', transition: 'cut', title: 'outline', frameIn: 'pop', stage: stage },
    cast: [{ kind: 'character', name: 'bear', role: 'lead' }, { kind: 'character', name: 'fox', role: 'side' }, { kind: 'prop', name: 'cake', role: 'hero' }], backdrop: backdrop, particles: '', particleAmount: 0, frames: ['plain'], vignettes: ['cake'],
    scenes: [{ kind: 'title', layout: 'top' }, { kind: 'photo', layout: 'hero' }, { kind: 'lyric', tableau: 'hero' }, { kind: 'photo', layout: 'collage' }, { kind: 'signoff', layout: 'top' }], music: { styles: ['x'], bpm: 110, voices: 'x', notes: 'x', negative: [] }, tone: 'x' });
  const card = { template: id, to: 'Sam', from: 'Ada', title: 'A Carol for Sam', lyrics: [{ section: 'verse', lines: ['The porch light is on for you', 'And the kettle is too'] }], scenes: [{ photo: 0, caption: '', ar: 0.75 }], timing: { duration: 30, bpm: 110 } };
  const cv = Canvas.createCanvas(W, H); Engine.draw(cv.getContext('2d'), W, H, card, 6.4, { images: [PH[1]], quality: 'full' }); c.drawImage(cv, x, y);
}
function sheetBackdrops(names) {
  for (const name of names) {
    const tw = 270, th = 480, sq = 270, gap = 10, pn = ['light', 'dark', 'warm'], W = (tw + gap) * 5 + sq + gap * 2, H = th + 40;
    const cv = Canvas.createCanvas(W, H), c = cv.getContext('2d'); c.fillStyle = '#222'; c.fillRect(0, 0, W, H);
    pn.forEach((p, i) => { const t = Canvas.createCanvas(tw, th); drawBlock('backdrop', name, t.getContext('2d'), tw, th, 4.2, PALS[p]); c.drawImage(t, gap + i * (tw + gap), 30); label(c, p, gap + i * (tw + gap), 30); });
    const stage = (Art.meta.backdrop[name] || {}).stage === 'cast-low' ? 'cast-low' : 'band-low', best = (Art.meta.backdrop[name] || {}).pal || (/night|dusk|eve|dark/.test(name) ? 'dark' : 'light');
    engineTile(c, gap + 3 * (tw + gap), 30, tw, th, name, best, stage); label(c, 'as a card: ' + best + ', ' + stage, gap + 3 * (tw + gap), 30);
    engineTile(c, gap + 4 * (tw + gap), 30, tw, th, name, best === 'dark' ? 'warm' : 'dark', stage === 'cast-low' ? 'band-low' : 'cast-low'); label(c, 'as a card, the other stage', gap + 4 * (tw + gap), 30);
    engineTile(c, gap + 5 * (tw + gap), 30, sq, sq, name, best, stage); label(c, 'square', gap + 5 * (tw + gap), 30);
    label(c, 'backdrop ' + name, gap, 6, '#ffd23f');
    fs.writeFileSync(path.join(out, 'backdrop-' + name.replace(':', '_') + '.png'), cv.toBuffer('image/png'));
  }
}
function grid(kind, names, tile, per, each) {
  for (let s = 0; s * per < names.length; s++) {
    const part = names.slice(s * per, s * per + per), cols = each.cols, W = cols * tile[0], H = part.length * (tile[1] + 22);
    const cv = Canvas.createCanvas(W, H), c = cv.getContext('2d'); c.fillStyle = '#222'; c.fillRect(0, 0, W, H);
    part.forEach((name, r) => { for (let k = 0; k < cols; k++) { const t = Canvas.createCanvas(tile[0], tile[1]), tc = t.getContext('2d'); each.draw(tc, name, k, tile[0], tile[1]); c.drawImage(t, k * tile[0], r * (tile[1] + 22) + 22); } label(c, kind + ' ' + name + (each.note ? '   ' + each.note : ''), 4, r * (tile[1] + 22) + 2, '#ffd23f'); });
    fs.writeFileSync(path.join(out, kind + '-' + (s + 1) + '.png'), cv.toBuffer('image/png'));
  }
}
function bg(c, W, H, pn) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, PALS[pn].bg); g.addColorStop(1, PALS[pn].bg2); c.fillStyle = g; c.fillRect(0, 0, W, H); }

let fails = 0, total = 0;
for (const kind of KINDS) for (const name of added[kind]) { const r = check(kind, name); total++; if (r.bad.length) fails++; console.log((r.bad.length ? 'FAIL  ' : 'ok    ') + kind + ' ' + name + '  ' + r.ms.toFixed(2) + ' ms' + (r.bad.length ? '  ' + r.bad.join('; ') : '')); }
sheetBackdrops(added.backdrop);
if (added.character.length) grid('character', added.character, [150, 170], 6, { cols: 10, note: 'variants 0-3 dancing (light) | on the beat, off the beat, sing, wave, idle, flipped (dark)', draw: (c, name, k, W, H) => { bg(c, W, H, k < 4 ? 'light' : 'dark'); c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(0, H * 0.92, W, 1); const o = k < 4 ? { variant: k, beat: 0.3, n: k } : [{ beat: 0.02, n: 0 }, { beat: 0.5, n: 1 }, { mood: 'sing', beat: 0.1, n: 3 }, { mood: 'wave', beat: 0.4, n: 2 }, { mood: 'idle', beat: 0.5, n: 0 }, { flip: true, variant: 1, beat: 0.2, n: 1 }][k - 4]; drawBlock('character', name, c, W, H, 2.2, PALS[k < 4 ? 'light' : 'dark'], o); } });
if (added.prop.length) grid('prop', added.prop, [150, 150], 8, { cols: 4, note: 'light, dark, warm, small', draw: (c, name, k, W, H) => { const pn = ['light', 'dark', 'warm', 'light'][k]; bg(c, W, H, pn); if (k === 3) Art.prop(name, c, W / 2, H / 2, W * 0.3, 2.2, PALS[pn], { beat: 0.3, n: 1 }); else drawBlock('prop', name, c, W, H, 2.2, PALS[pn]); } });
if (added.frame.length) grid('frame', added.frame, [230, 290], 4, { cols: 5, note: 'tall photo, wide photo, one person, no photo yet, drawn stand-in', draw: (c, name, k, W, H) => { bg(c, W, H, k % 2 ? 'dark' : 'light'); const o = [{ img: PH[1] }, { img: PH[0] }, { img: PH[1], solo: true }, { img: null }, { img: null, art: function (cc, x, y, w, h) { cc.fillStyle = '#35507a'; cc.fillRect(x, y, w, h); Art.prop('cake', cc, x + w / 2, y + h / 2, Math.min(w, h) * 0.7, 1, PALS.dark, {}); } }][k]; const q = drawBlock('frame', name, c, W, H, 2.2, PALS[k % 2 ? 'dark' : 'light'], o); if (q && k === 0) { c.strokeStyle = 'rgba(0,255,120,0.8)'; c.lineWidth = 1; c.strokeRect(q.x, q.y, q.w, q.h); } } });
if (added.particles.length) grid('particles', added.particles, [200, 356], 4, { cols: 4, note: 'light, dark, warm, later', draw: (c, name, k, W, H) => { const pn = ['light', 'dark', 'warm', 'dark'][k]; bg(c, W, H, pn); drawBlock('particles', name, c, W, H, k === 3 ? 9.7 : 3.1, PALS[pn]); } });
if (added.border.length) grid('border', added.border, [200, 356], 4, { cols: 4, note: 'light, dark, warm, square', draw: (c, name, k, W, H) => { const pn = ['light', 'dark', 'warm', 'light'][k]; if (k === 3) { bg(c, W, W, pn); drawBlock('border', name, c, W, W, 3.1, PALS[pn]); } else { bg(c, W, H, pn); drawBlock('border', name, c, W, H, 3.1, PALS[pn]); } } });
console.log((fails ? 'FAILED ' + fails + ' of ' : 'OK ') + total + ' blocks in pack ' + pack + ' -> ' + out);
process.exit(fails ? 1 : 0);
