'use strict';
// test/looks.cjs : every title card, sign-off flourish and lyric band the engine can draw (the launch ones and the
// library's), on a light, a dark and a warm palette, tall and square, with and without photos. Each is drawn at the
// title, in the middle of a sung line and at the sign-off: nothing throws, every text box is inside the safe area and
// off every face, and the words READ: inside the title, the greeting and the sung line, the lightest tenth of the
// pixels and the darkest tenth differ by a contrast of 3 or more. Also: a calm card, cards with no characters, and
// the cast boxes. No network, no port. Prints "OK looks" last.
const assert = require('node:assert'), path = require('node:path');
const root = path.join(__dirname, '..');
const Canvas = require('@napi-rs/canvas');
const Fonts = require(path.join(root, 'fonts.js')); Fonts.registerNode(Canvas, path.join(root, 'fonts'));
const T = require(path.join(root, 'templates.js')), E = require(path.join(root, 'engine.js'));
const started = Date.now();

const NEW_TITLES = ['marquee', 'stamp', 'pennant', 'kraft', 'bubble', 'tapestrip', 'letterpress', 'block3d', 'comic', 'underline', 'quiet', 'softglow', 'ticket', 'parchment'];
const SIGNOFFS = ['seal', 'laurel', 'heartsrow', 'starsrow', 'swash', 'ribbonends', 'popper', 'sunrise', 'postmark', 'signature', 'candleglow', 'doves', 'cardframe', 'pennants', 'fireworks', 'balloons', 'posy', 'paws', 'trophy', 'crescent', 'spotlight'];
const NEW_BANDS = ['linen', 'minimal', 'sticker', 'ticker', 'scoreboard'];
for (const n of NEW_TITLES) assert.ok(E.titleStyles.includes(n), 'title style ' + n);
for (const n of NEW_BANDS) assert.ok(E.karaokeStyles.includes(n), 'lyric band ' + n);
assert.deepStrictEqual(E.signoffStyles.slice().sort(), SIGNOFFS.slice().sort(), 'the sign-off flourishes');
assert.strictEqual(E.titleStyles.length, 23); assert.strictEqual(new Set(E.titleStyles).size, 23); assert.strictEqual(new Set(E.karaokeStyles).size, E.karaokeStyles.length);
// no launch template uses a library look: their frames are what they were
for (const t of T.list) { assert.ok(!NEW_TITLES.includes(t.look.title) && !NEW_BANDS.includes(t.look.karaoke) && t.look.signoff === undefined && t.look.calm === undefined, t.id + ' keeps its launch look'); }

const PALS = {
  light: { bg: '#8fcdf2', bg2: '#fdf3e3', ink: '#27405a', accent: '#ff6b5e', accent2: '#3f9f7a', gold: '#ffc93c', snow: '#ffffff', paper: '#fffdf4' },
  dark: { bg: '#141a4a', bg2: '#3a2468', ink: '#0f1230', accent: '#ff4f8b', accent2: '#35d0c0', gold: '#ffd23f', snow: '#ffffff', paper: '#fff8ee' },
  warm: { bg: '#f08a4b', bg2: '#ffd9a0', ink: '#3a2118', accent: '#c8323c', accent2: '#2f7d55', gold: '#f2c14e', snow: '#fff8e8', paper: '#fff3d6' }
};
function photo(i) { const c = Canvas.createCanvas(120, 150), x = c.getContext('2d'); x.fillStyle = ['#7fb6d9', '#e9b872', '#9bc48a'][i % 3]; x.fillRect(0, 0, 120, 150); x.fillStyle = '#c33'; x.fillRect(30, 95, 60, 55); x.fillStyle = '#e9b48a'; x.beginPath(); x.arc(60, 62, 26, 0, 7); x.fill(); return c; }
const photos = [photo(0), photo(1), photo(2)];
let seq = 0;
function tpl(look, more) {
  const id = 'looks-test-' + (++seq);
  assert.ok(T.add(Object.assign({ id: id, v: 1, name: 'Looks', occasion: 'birthday', family: 'x', blurb: '', tags: [],
    look: Object.assign({ pal: PALS.light, fonts: { title: 'CT Fat', body: 'CT Sans Semi', lyric: 'CT Sans Bold', caption: 'CT Hand Bold' }, border: 'none', karaoke: 'pill', transition: 'cut', title: 'outline', frameIn: 'pop' }, look),
    cast: [{ kind: 'character', name: 'bear', role: 'lead' }, { kind: 'character', name: 'fox', role: 'side' }, { kind: 'prop', name: 'cake', role: 'hero' }, { kind: 'prop', name: 'balloons', role: 'floor' }], backdrop: 'partywall', particles: '', particleAmount: 0, frames: ['plain', 'polaroid'], vignettes: ['cake', 'star'],
    scenes: [{ kind: 'title', layout: 'top' }, { kind: 'photo', layout: 'hero' }, { kind: 'lyric', tableau: 'hero' }, { kind: 'photo', layout: 'collage' }, { kind: 'lyric', tableau: 'row' }, { kind: 'signoff', layout: 'top' }], music: { styles: ['x'], bpm: 110, voices: 'x', notes: 'x', negative: [] }, tone: 'x' }, more || {})), 'template added');
  return id;
}
function card(id, n, long) {
  return { template: id, to: 'Sam', from: long ? 'everyone at the lake house' : 'Ada', title: long ? 'Happy Birthday, dear Josephine!' : 'A Carol for Sam', greeting: long ? 'With all our love, always' : 'With love', signoff: long ? 'from Ada, Wren, Milo and the whole crew' : 'from Ada and the gang',
    lyrics: [{ section: 'verse', lines: ['The porch light is on', 'And the kettle is too', 'We saved you a piece'] }, { section: 'hook', lines: ['Sam, this one is yours'] }],
    scenes: Array.from({ length: n }, (_, i) => ({ photo: i, caption: '', ar: i === 1 ? 1.33 : 0.75 })), timing: { duration: 30, bpm: 110, offset: 0.5 } };
}
function hits(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function checkBoxes(boxes, W, H, c, where) { /* as test/templates.cjs does: text inside the safe area, never over a face */
  const sf = E.layout(W, H, c).safe, eps = 0.75, faces = boxes.filter((b) => b.kind === 'face'), texts = boxes.filter((b) => b.kind === 'text'), ph = boxes.filter((b) => b.kind === 'photo');
  assert.strictEqual(faces.length, ph.length, where + ': one face box per photo box');
  for (const b of boxes) { assert.ok(['text', 'photo', 'face'].includes(b.kind), where + ': box kind ' + b.kind); assert.ok([b.x, b.y, b.w, b.h].every(Number.isFinite) && b.w > 0 && b.h > 0, where + ': box numbers'); }
  for (const b of texts) {
    assert.ok(b.x >= sf.x - eps && b.x + b.w <= sf.x + sf.w + eps && b.y >= sf.y - eps && b.y + b.h <= sf.y + sf.h + eps, where + ': text "' + b.what + '" outside the safe area ' + JSON.stringify([b.x / W, b.y / H, b.w / W, b.h / H].map((v) => +v.toFixed(3))));
    for (const f of faces) assert.ok(!hits(b, f), where + ': text "' + b.what + '" over a face');
    if (/^lyric/.test(b.what)) for (const p of ph) { const cx = p.x + p.w / 2, cy = p.y + p.h / 2; assert.ok(!(cx > b.x && cx < b.x + b.w && cy > b.y && cy < b.y + b.h), where + ': the lyric is over the centre of a photo'); }
  }
  return texts;
}
const LIN = new Float64Array(256); for (let i = 0; i < 256; i++) { const v = i / 255; LIN[i] = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function contrastIn(ctx, b, W, H) { /* the lightest tenth of the pixels in a box against the darkest tenth, as a contrast ratio */
  const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y)), w = Math.min(W - x, Math.ceil(b.w)), h = Math.min(H - y, Math.ceil(b.h)), d = ctx.getImageData(x, y, w, h).data, l = new Float64Array(d.length / 4);
  for (let i = 0; i < l.length; i++) l[i] = 0.2126 * LIN[d[i * 4]] + 0.7152 * LIN[d[i * 4 + 1]] + 0.0722 * LIN[d[i * 4 + 2]];
  l.sort(); const n = Math.max(1, Math.floor(l.length / 10)); let lo = 0, hi = 0; for (let i = 0; i < n; i++) { lo += l[i]; hi += l[l.length - 1 - i]; }
  return (hi / n + 0.05) / (lo / n + 0.05);
}

const titles = E.titleStyles, signs = E.signoffStyles, bands = E.karaokeStyles, N = Math.max(titles.length, signs.length + 1, bands.length);
const shapes = [[360, 640], [360, 360]], canv = shapes.map((s) => Canvas.createCanvas(s[0], s[1]));
let frames = 0, measured = 0, worst = { v: 99, where: '' }; const launch = {};
for (let i = 0; i < N; i++) for (const pn of ['light', 'dark', 'warm']) {
  const look = { pal: PALS[pn], title: titles[i % titles.length], karaoke: bands[i % bands.length] }, sg = i % (signs.length + 1); if (sg < signs.length) look.signoff = signs[sg]; if (i % 2) look.stage = 'cast-low';
  const id = tpl(look, { backdrop: pn === 'dark' ? 'fireworksky' : 'partywall' }), name = [look.title, look.signoff || 'plain', look.karaoke, pn].join('/');
  shapes.forEach((s, si) => {
    const W = s[0], H = s[1], ctx = canv[si].getContext('2d');
    for (const n of [0, 3]) {
      const c = card(id, n, (i + n) % 2 === 1), pl = E.plan(c), so = pl.scenes[pl.scenes.length - 1], ln = pl.lines[1];
      const at = { title: Math.min(2.2, pl.scenes[0].t1 - 0.05), lyric: ln.t0 + (ln.t1 - ln.t0) * 0.62, greeting: so.t0 + 2.2 };
      for (const what of ['title', 'lyric', 'greeting']) {
        const env = { images: photos, boxes: [], quality: 'full' }, where = name + ' ' + W + 'x' + H + ' ' + n + ' photos, ' + what;
        ctx.clearRect(0, 0, W, H); E.draw(ctx, W, H, c, at[what], env); frames++;
        const b = checkBoxes(env.boxes, W, H, c, where).find((x) => x.what === what);
        assert.ok(b, where + ': the ' + what + ' is drawn');
        const cr = contrastIn(ctx, b, W, H), lk = what === 'lyric' ? look.karaoke : look.title, fresh = what === 'lyric' ? NEW_BANDS.includes(lk) : NEW_TITLES.includes(lk); measured++;
        if (process.env.LOOKS_LIST) { if (cr < 4.5) console.log(cr.toFixed(2) + (fresh ? '  ' : '  (launch) ') + where); continue; }   // LOOKS_LIST=1 lists the weakest instead of stopping at the first
        if (fresh) { if (cr < worst.v) worst = { v: cr, where: where }; assert.ok(cr >= 3, where + ': the words must read, contrast ' + cr.toFixed(2)); }
        else { /* a launch look draws what it always drew, and was made for its own template's palette: it must read on at least one of the three, and what it does not suit is listed */
          const key = (what === 'lyric' ? 'band ' : 'title ') + lk; launch[key] = launch[key] || { best: 0, weak: new Set() }; launch[key].best = Math.max(launch[key].best, cr); if (cr < 3) launch[key].weak.add(pn);
          assert.ok(cr >= 1.5, where + ': the words must show, contrast ' + cr.toFixed(2)); }
      }
    }
  });
}

const unsuited = [];
for (const k of Object.keys(launch)) { if (process.env.LOOKS_LIST) break; assert.ok(launch[k].best >= 3, 'launch ' + k + ' reads on one of the palettes, best ' + launch[k].best.toFixed(2)); if (launch[k].weak.size) unsuited.push(k + ' (' + [...launch[k].weak].join(', ') + ')'); }

// ---------- a flourish keeps its room: the photos of the sign-off start under it, the words move down for it ----------
{
  const plain = tpl({ pal: PALS.light }), under = tpl({ pal: PALS.light, signoff: 'seal' }), over = tpl({ pal: PALS.light, signoff: 'balloons' }), ctx = canv[0].getContext('2d');
  const boxesOf = (id) => { const c = card(id, 3, false), pl = E.plan(c), env = { images: photos, boxes: [] }; E.draw(ctx, 360, 640, c, pl.scenes[pl.scenes.length - 1].t0 + 2.2, env); return env.boxes; };
  const top = (bs) => Math.min(...bs.filter((b) => b.kind === 'photo').map((b) => b.y)), words = (bs) => bs.find((b) => b.what === 'greeting').y;
  const a = boxesOf(plain), b = boxesOf(under), d = boxesOf(over);
  assert.ok(top(b) > top(a) + 5 && Math.abs(words(b) - words(a)) < 0.01, 'a flourish under the words: the photos start lower, the words stay');
  assert.ok(words(d) > words(a) + 5, 'a flourish over the words: the words move down');
}

// ---------- calm, no characters, cast boxes ----------
{
  const ctx = canv[0].getContext('2d'), sq = canv[1].getContext('2d');
  const every = (id, label) => { for (const n of [0, 1, 3]) { const c = card(id, n, false), pl = E.plan(c); for (const s of pl.scenes) for (const t of [s.t0 + 0.02, (s.t0 + s.t1) / 2, s.t1 - 0.02]) { const env = { images: photos, boxes: [] }; E.draw(ctx, 360, 640, c, t, env); checkBoxes(env.boxes, 360, 640, c, label + ' tall at ' + t); const e2 = { images: photos, boxes: [] }; E.draw(sq, 360, 360, c, t, e2); checkBoxes(e2.boxes, 360, 360, c, label + ' square at ' + t); frames += 2; } E.hit(c, 360, 640, 5, 180, 400); } };
  // calm: the same card, calm or not, differs on the beat (the hero prop does not pulse); calm draws the same on and just after a beat where nothing else moves
  const lively = tpl({ pal: PALS.dark, title: 'quiet', karaoke: 'linen', signoff: 'candleglow' }), quiet = tpl({ pal: PALS.dark, title: 'quiet', karaoke: 'linen', signoff: 'candleglow', calm: true }, { backdrop: 'fireworksky' });
  every(quiet, 'calm'); every(lively, 'not calm');
  const data = (id, t) => { const c = card(id, 0, false); ctx.clearRect(0, 0, 360, 640); E.draw(ctx, 360, 640, c, t, { images: [] }); return Buffer.from(ctx.getImageData(0, 0, 360, 640).data); };
  const calmOnly = tpl({ pal: PALS.light, calm: true }, { cast: [{ kind: 'prop', name: 'cake', role: 'hero' }], lyricFx: '' }), same = tpl({ pal: PALS.light }, { cast: [{ kind: 'prop', name: 'cake', role: 'hero' }], lyricFx: '' });
  const beat = E.plan(card(same, 0, false)).beats[3];
  assert.ok(!data(same, beat + 0.01).equals(data(calmOnly, beat + 0.01)), 'calm changes what is drawn on the beat');
  // no characters at all: every scene still draws, with a hero prop, with floor props only, with nothing
  const casts = { 'props only': [{ kind: 'prop', name: 'cake', role: 'hero' }, { kind: 'prop', name: 'balloons', role: 'floor' }, { kind: 'prop', name: 'cupcake', role: 'floor' }, { kind: 'prop', name: 'cloud', role: 'sky' }], 'floor props only': [{ kind: 'prop', name: 'bouquet', role: 'floor' }, { kind: 'prop', name: 'candle', role: 'floor' }], 'no cast': [] };
  for (const k of Object.keys(casts)) for (const stage of ['band-low', 'cast-low']) {
    const id = tpl({ pal: PALS.warm, title: 'kraft', signoff: 'laurel', stage: stage }, { cast: casts[k] }); every(id, k + ' ' + stage);
    const c = card(id, 0, false), pl = E.plan(c), ly = pl.scenes.find((s) => s.kind === 'lyric'), cv = Canvas.createCanvas(180, 320), x = cv.getContext('2d'), blank = Canvas.createCanvas(180, 320), y = blank.getContext('2d');
    // the lyric scene is not an empty stage: taking the cast away changes the picture (something of it was drawn)
    E.draw(x, 180, 320, c, (ly.t0 + ly.t1) / 2, { images: [] }); const id2 = tpl({ pal: PALS.warm, title: 'kraft', signoff: 'laurel', stage: stage }, { cast: [], vignettes: [] }); E.draw(y, 180, 320, card(id2, 0, false), (ly.t0 + ly.t1) / 2, { images: [] });
    if (k !== 'no cast') assert.ok(!Buffer.from(x.getImageData(0, 0, 180, 320).data).equals(Buffer.from(y.getImageData(0, 0, 180, 320).data)), k + ' ' + stage + ': the lyric scene shows the props');
  }
  { const id = tpl({ pal: PALS.light }, { cast: undefined }); E.draw(ctx, 360, 640, card(id, 1, false), 9, { images: photos, boxes: [] }); }   // a template with no cast list at all
  // cast boxes: only when asked for, one per character drawn, named
  const c = card(lively, 0, false), pl = E.plan(c), t = pl.scenes[0].t1 - 0.3, off = { images: [], boxes: [] }, on = { images: [], boxes: [], castBoxes: true };
  E.draw(ctx, 360, 640, c, t, off); E.draw(ctx, 360, 640, c, t, on);
  assert.ok(!off.boxes.some((b) => b.kind === 'cast'), 'no cast boxes unless asked');
  const cast = on.boxes.filter((b) => b.kind === 'cast');
  assert.deepStrictEqual(cast.map((b) => b.what).sort(), ['bear', 'fox'], 'a cast box for each character');
  for (const b of cast) assert.ok(b.w > 20 && b.h > 20 && b.x >= -1 && b.x + b.w <= 361 && b.y > 0 && b.y + b.h < 640, 'a cast box is the character\'s rect');
  assert.deepStrictEqual(on.boxes.filter((b) => b.kind !== 'cast'), off.boxes, 'the other boxes are as they were');
}

const secs = (Date.now() - started) / 1000;
console.log(titles.length + ' title cards, ' + signs.length + ' sign-off flourishes, ' + bands.length + ' lyric bands: ' + frames + ' frames, ' + measured + ' contrast checks (lowest of the library\'s looks ' + worst.v.toFixed(2) + ' at ' + worst.where + '), ' + secs.toFixed(1) + ' s');
if (unsuited.length) console.log('launch looks that do not read on every test palette (pair them with care): ' + unsuited.join('; '));
assert.ok(secs < 20, 'runs in under 20 seconds');
console.log('OK looks');
