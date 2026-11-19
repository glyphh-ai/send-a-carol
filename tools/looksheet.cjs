'use strict';
// tools/looksheet.cjs : look at every title card, sign-off flourish and lyric band the engine can draw.
//   node tools/looksheet.cjs                    every sheet
//   node tools/looksheet.cjs titles|signoffs|bands|extras [name]   one kind; with a name, only the looks whose name
//                                               contains it, drawn at twice the size (for a close look)
// Writes PNG sheets to /tmp/carol-templates/looks/. Each look is drawn through the engine, on throwaway templates
// (Templates.add), on a light, a dark and a warm palette, over a busy backdrop (partywall) and a dark one
// (fireworksky), tall and square. Nothing here is a test: read the sheets.
const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..');
const Canvas = require('@napi-rs/canvas');
const Fonts = require(path.join(root, 'fonts.js')); Fonts.registerNode(Canvas, path.join(root, 'fonts'));
const Templates = require(path.join(root, 'templates.js')), Engine = require(path.join(root, 'engine.js'));
const kind = process.argv[2] || '', only = process.argv[3] || '', Z = only ? 2 : 1;
const out = '/tmp/carol-templates/looks'; fs.mkdirSync(out, { recursive: true });

const PALS = {
  light: { bg: '#8fcdf2', bg2: '#fdf3e3', ink: '#27405a', accent: '#ff6b5e', accent2: '#3f9f7a', gold: '#ffc93c', snow: '#ffffff', paper: '#fffdf4' },
  dark: { bg: '#141a4a', bg2: '#3a2468', ink: '#0f1230', accent: '#ff4f8b', accent2: '#35d0c0', gold: '#ffd23f', snow: '#ffffff', paper: '#fff8ee' },
  warm: { bg: '#f08a4b', bg2: '#ffd9a0', ink: '#3a2118', accent: '#c8323c', accent2: '#2f7d55', gold: '#f2c14e', snow: '#fff8e8', paper: '#fff3d6' }
};
function photo(w, h, k) { const cv = Canvas.createCanvas(w, h), c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, ['#f2b38a', '#8ab6f2', '#b3e08a'][k % 3]); g.addColorStop(1, ['#7a4a6a', '#2a4a7a', '#3a6a4a'][k % 3]); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(w * 0.5, h * 0.4, Math.min(w, h) * 0.2, 0, 7); c.fill(); c.fillStyle = 'rgba(40,30,50,0.8)'; c.fillRect(w * 0.3, h * 0.62, w * 0.4, h * 0.3); return cv; }
const PH = [photo(300, 400, 0), photo(400, 300, 1), photo(300, 400, 2)];
function label(c, s, x, y, col) { c.font = '13px "CT Sans Semi"'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(x, y, c.measureText(s).width + 8, 18); c.fillStyle = col || '#fff'; c.fillText(s, x + 4, y + 2); }

let seq = 0;
function tpl(look, more) { /* a throwaway template with this look */
  const id = 'looksheet-' + (++seq);
  Templates.add(Object.assign({ id: id, v: 1, name: 'Sheet', occasion: 'birthday', family: 'x', blurb: '', tags: [],
    look: Object.assign({ pal: PALS.light, fonts: { title: 'CT Fat', body: 'CT Sans Semi', lyric: 'CT Sans Bold', caption: 'CT Hand Bold' }, border: 'none', karaoke: 'pill', transition: 'cut', title: 'outline', frameIn: 'pop' }, look),
    cast: [{ kind: 'character', name: 'bear', role: 'lead' }, { kind: 'character', name: 'fox', role: 'side' }, { kind: 'prop', name: 'cake', role: 'hero' }, { kind: 'prop', name: 'balloons', role: 'floor' }], backdrop: 'partywall', particles: '', particleAmount: 0, frames: ['plain', 'polaroid'], vignettes: ['cake', 'star'],
    scenes: [{ kind: 'title', layout: 'top' }, { kind: 'photo', layout: 'hero' }, { kind: 'lyric', tableau: 'hero' }, { kind: 'photo', layout: 'collage' }, { kind: 'lyric', tableau: 'row' }, { kind: 'signoff', layout: 'top' }], music: { styles: ['x'], bpm: 110, voices: 'x', notes: 'x', negative: [] }, tone: 'x' }, more || {}));
  return id;
}
function card(id, nPhotos, long) {
  return { template: id, to: 'Sam', from: long ? 'everyone at the lake house' : 'Ada', title: long ? 'Happy Birthday, dear Josephine!' : 'A Carol for Sam', greeting: long ? 'With all our love, always' : 'With love', signoff: long ? 'from Ada, Wren, Milo and the whole crew' : 'from Ada and the gang',
    lyrics: [{ section: 'verse', lines: ['The porch light is on for you', 'And the kettle is too', 'We saved you the corner piece'] }, { section: 'hook', lines: ['Sam, oh Sam, this one is yours'] }],
    scenes: Array.from({ length: nPhotos }, (_, i) => ({ photo: i, caption: '', ar: i === 1 ? 1.33 : 0.75 })), timing: { duration: 30, bpm: 110, offset: 0.5 } };
}
function shot(id, W, H, c, t) { const cv = Canvas.createCanvas(W, H); Engine.draw(cv.getContext('2d'), W, H, c, t, { images: PH, quality: 'full' }); return cv; }
function times(c) { const pl = Engine.plan(c), l = pl.lines[1], so = pl.scenes[pl.scenes.length - 1], ly = pl.scenes.find((s) => s.kind === 'lyric'); return { title: 2.2, sign: so.t0 + 2.4, line: l.t0 + (l.t1 - l.t0) * 0.55, lyric: ly ? (ly.t0 + ly.t1) / 2 : 10 }; }
function sheet(name, rows, rowH, W, per, drawRow) {
  for (let s = 0; s * per < rows.length; s++) {
    const part = rows.slice(s * per, s * per + per), cv = Canvas.createCanvas(W, part.length * (rowH + 22)), c = cv.getContext('2d'); c.fillStyle = '#222'; c.fillRect(0, 0, cv.width, cv.height);
    part.forEach((r, i) => { drawRow(c, r, i * (rowH + 22) + 22); label(c, r, 4, i * (rowH + 22) + 2, '#ffd23f'); });
    const f = path.join(out, name + (only ? '-' + only : '') + '-' + (s + 1) + '.png'); fs.writeFileSync(f, cv.toBuffer('image/png')); console.log(f);
  }
}
const COLS = [['light', 'partywall'], ['dark', 'partywall'], ['warm', 'partywall'], ['light', 'fireworksky'], ['dark', 'fireworksky'], ['warm', 'fireworksky']];

// ---------- title cards: 6 tall (top of the frame) over 6 square, short title with a photo on the busy wall, a long one on the dark sky ----------
function titles() {
  const tw = 250 * Z, th = Math.round(tw * 16 / 9), cropT = Math.round(th * 0.47), cropS = Math.round(tw * 0.62);
  sheet('titles', Engine.titleStyles.filter((n) => n.indexOf(only) >= 0), cropT + cropS + 4, tw * 6, only ? 2 : 4, (c, name, y) => {
    COLS.forEach((col, i) => {
      const long = i >= 3, id = tpl({ pal: PALS[col[0]], title: name, fonts: { title: long ? 'CT Serif' : 'CT Fat', body: 'CT Sans Semi', lyric: 'CT Sans Bold', caption: 'CT Hand Bold' } }, { backdrop: col[1] }), cd = card(id, long ? 0 : 1, long);
      c.drawImage(shot(id, tw, th, cd, 2.2), 0, 0, tw, cropT, i * tw, y, tw, cropT);
      c.drawImage(shot(id, tw, tw, cd, 2.2), 0, 0, tw, cropS, i * tw, y + cropT + 4, tw, cropS);
      if (y < 40) label(c, col.join(' / '), i * tw + 4, y + cropT - 20);
    });
  });
}
// ---------- sign-off flourishes: with 0 and 3 photos, under different title cards ----------
function signoffs() {
  const tw = 250 * Z, th = Math.round(tw * 16 / 9), cropT = Math.round(th * 0.62);
  const cols = [['light', 'partywall', 0, 'outline', 0], ['dark', 'fireworksky', 3, 'gold', 1], ['warm', 'partywall', 3, 'plate', 0], ['dark', 'partywall', 0, 'quiet', 1], ['light', 'partywall', 3, 'underline', 0, 1], ['dark', 'fireworksky', 0, 'softglow', 1, 1]];
  sheet('signoffs', Engine.signoffStyles.filter((n) => n.indexOf(only) >= 0), cropT, tw * 6, only ? 2 : 5, (c, name, y) => {
    cols.forEach((col, i) => {
      const id = tpl({ pal: PALS[col[0]], title: col[3], signoff: name }, { backdrop: col[1] }), cd = card(id, col[2], !!col[4]), t = times(cd).sign;
      if (col[5]) c.drawImage(shot(id, tw, tw, cd, t), i * tw, y); else c.drawImage(shot(id, tw, th, cd, t), 0, 0, tw, cropT, i * tw, y, tw, cropT);
      if (y < 40) label(c, col[0] + ' / ' + col[2] + ' photos / ' + col[3] + (col[5] ? ' / square' : ''), i * tw + 4, y + cropT - 20);
    });
  });
}
// ---------- lyric bands, mid-line ----------
function bands() {
  const tw = 380 * Z, th = Math.round(tw * 16 / 9), y0 = Math.round(th * 0.725), ch = Math.round(th * 0.175), sy0 = Math.round(tw * 0.75), sh = Math.round(tw * 0.22), rowH = Math.max(ch, sh);
  sheet('bands', Engine.karaokeStyles.filter((n) => n.indexOf(only) >= 0), rowH, tw * 4, only ? 3 : 9, (c, name, y) => {
    [['light', 'partywall'], ['dark', 'fireworksky'], ['warm', 'partywall'], ['dark', 'partywall', 1]].forEach((col, i) => {
      const id = tpl({ pal: PALS[col[0]], karaoke: name }, { backdrop: col[1] }), cd = card(id, 1, false), t = times(cd).line;
      if (col[2]) c.drawImage(shot(id, tw, tw, cd, t), 0, sy0, tw, sh, i * tw, y, tw, sh); else c.drawImage(shot(id, tw, th, cd, t), 0, y0, tw, ch, i * tw, y, tw, ch);
    });
  });
}
// ---------- a calm card, and a card with no characters at all: title, photo, lyric, sign-off, tall and square ----------
function extras() {
  const tw = 250, th = 444;
  const kinds = { 'calm (bear, fox; quiet title, linen band, candleglow)': [{ pal: PALS.dark, title: 'quiet', karaoke: 'linen', signoff: 'candleglow', calm: true }, { backdrop: 'fireworksky' }],
    'no characters: hero prop and two floor props': [{ pal: PALS.light, title: 'underline', karaoke: 'minimal', signoff: 'posy' }, { cast: [{ kind: 'prop', name: 'cake', role: 'hero' }, { kind: 'prop', name: 'balloons', role: 'floor' }, { kind: 'prop', name: 'cupcake', role: 'floor' }, { kind: 'prop', name: 'cloud', role: 'sky' }] }],
    'no characters, cast-low stage, floor props only': [{ pal: PALS.warm, title: 'kraft', karaoke: 'ticker', signoff: 'laurel', stage: 'cast-low' }, { cast: [{ kind: 'prop', name: 'bouquet', role: 'floor' }, { kind: 'prop', name: 'candle', role: 'floor' }] }],
    'no cast at all': [{ pal: PALS.dark, title: 'softglow', karaoke: 'scoreboard', signoff: 'crescent' }, { cast: [], backdrop: 'fireworksky' }] };
  sheet('extras', Object.keys(kinds), th + tw + 4, tw * 6, 2, (c, name, y) => {
    const id = tpl(kinds[name][0], kinds[name][1]);
    [[0, 'title'], [3, 'title'], [0, 'lyric'], [3, 'sign'], [0, 'sign'], [0, 'row']].forEach((col, i) => {
      const cd = card(id, col[0], false), pl = Engine.plan(cd), ly = pl.scenes.filter((s) => s.kind === 'lyric'), tm = times(cd), t = col[1] === 'row' ? (ly[ly.length - 1].t0 + ly[ly.length - 1].t1) / 2 : tm[col[1]];
      c.drawImage(shot(id, tw, th, cd, t), i * tw, y); c.drawImage(shot(id, tw, tw, cd, t), i * tw, y + th + 4);
      label(c, col[1] + ', ' + col[0] + ' photos', i * tw + 4, y + 2);
    });
  });
}
if (!kind || kind === 'titles') titles();
if (!kind || kind === 'signoffs') signoffs();
if (!kind || kind === 'bands') bands();
if (!kind || kind === 'extras') extras();
