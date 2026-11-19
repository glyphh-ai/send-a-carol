'use strict';
// test/libdata.cjs : the library's three data files (library/palettes.js, library/type.js, library/music.js).
// Shapes, vocabularies, unique ids and names, counts per mode, mood, tag and tone; every palette's contrast rules
// (WCAG relative luminance); every font is one of the bundled families; every music direction has seven styles, a
// tempo in range and no name of an artist, song, show, brand or model anywhere; no emoji. Then every type pairing
// sets a long title and a 60-character sung line through the engine, tall and square, and every text box stays
// inside the safe area. No network, no port. Prints "OK libdata (...)" last.
const assert = require('node:assert'), path = require('node:path');
const root = path.join(__dirname, '..');
const Canvas = require('@napi-rs/canvas');
const Fonts = require(path.join(root, 'fonts.js')); Fonts.registerNode(Canvas, path.join(root, 'fonts'));
const T = require(path.join(root, 'templates.js')), E = require(path.join(root, 'engine.js'));
const palettes = require(path.join(root, 'library', 'palettes.js')), types = require(path.join(root, 'library', 'type.js')), music = require(path.join(root, 'library', 'music.js'));

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/, HEX = /^#[0-9a-f]{6}$/;
const hasEmoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
const count = (list, f) => list.filter(f).length;
function unique(list, key, what) { const seen = new Set(); for (const x of list) { assert.ok(!seen.has(x[key]), what + ': ' + key + ' "' + x[key] + '" twice'); seen.add(x[key]); } }
function keysOf(o, need, may, at) { for (const k of need) assert.ok(k in o, at + 'needs ' + k); for (const k of Object.keys(o)) assert.ok(need.includes(k) || may.includes(k), at + 'unknown key ' + k); }
function words(list, vocab, at) { assert.ok(Array.isArray(list) && list.length > 0, at + 'a list with something in it'); assert.strictEqual(new Set(list).size, list.length, at + 'no word twice'); for (const w of list) assert.ok(vocab.includes(w), at + 'unknown word "' + w + '"'); }
for (const [name, list] of [['palettes', palettes], ['type', types], ['music', music]]) {
  assert.ok(Array.isArray(list), name + ' is a list');
  for (const x of list) { assert.ok(typeof x.id === 'string' && SLUG.test(x.id) && x.id.length <= 40, name + ': id is a slug: ' + x.id); assert.ok(typeof x.name === 'string' && x.name.trim() === x.name && x.name.length >= 3 && x.name.length <= 40, name + ' ' + x.id + ': name'); }
  unique(list, 'id', name); unique(list, 'name', name);
  assert.ok(!hasEmoji.test(JSON.stringify(list)), name + ': no emoji');
}

// ------------------------------------------------- palettes -------------------------------------------------
const MODES = ['light', 'mid', 'dark'];
const COLOURS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'brown', 'neutral', 'black', 'gold'];
const OCCASION_MOODS = ['red-gold', 'blue-silver', 'blue-white', 'red-black-green', 'green-gold', 'orange-black', 'marigold', 'pink-red', 'gold-navy'];
const MOODS = ['pastel', 'bright', 'jewel', 'earth', 'neon', 'elegant', 'sunset', 'ocean', 'forest', 'candy', 'autumn', 'spring', 'summer', 'winter', 'night', 'muted', 'warm', 'cool', 'retro', 'modern', 'kids', 'romantic', 'sporty', 'spooky'].concat(OCCASION_MOODS, ['rainbow']);
const COLS = ['bg', 'bg2', 'ink', 'accent', 'accent2', 'gold', 'snow', 'paper'];
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const c = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };   // WCAG relative luminance
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hue = (h) => { const c = rgb(h).map((v) => v / 255), mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]), d = mx - mn; let H = 0; if (d) H = mx === c[0] ? ((c[1] - c[2]) / d) % 6 : mx === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4; return { h: (H * 60 + 360) % 360, chroma: d }; };
const hueApart = (a, b) => { const x = hue(a), y = hue(b), d = Math.abs(x.h - y.h); return x.chroma >= 0.12 && y.chroma >= 0.12 && Math.min(d, 360 - d) >= 40; };   // two real colours, 40 degrees or more apart
const far = (a, b) => Math.max.apply(null, rgb(a).map((v, i) => Math.abs(v - rgb(b)[i])));
for (const p of palettes) {
  const at = 'palette ' + p.id + ': ';
  keysOf(p, ['id', 'name', 'mode', 'colour', 'moods'].concat(COLS), [], at);
  assert.ok(MODES.includes(p.mode), at + 'mode'); assert.ok(COLOURS.includes(p.colour), at + 'colour ' + p.colour); words(p.moods, MOODS, at + 'moods: ');
  for (const k of COLS) assert.ok(typeof p[k] === 'string' && HEX.test(p[k]), at + k + ' is #rrggbb in lower case: ' + p[k]);
  for (const k of ['bg', 'bg2', 'accent', 'accent2', 'gold', 'paper', 'snow']) assert.ok(p[k].charCodeAt(3) !== 97, at + k + ' ' + p[k] + ' has an "a" where the drawing kit looks for rgba()');
  assert.ok(contrast(p.ink, p.paper) >= 7, at + 'ink on paper ' + contrast(p.ink, p.paper).toFixed(2));
  assert.ok(lum(p.paper) >= 0.8, at + 'paper is pale'); assert.ok(lum(p.ink) <= 0.12, at + 'ink is dark'); assert.ok(lum(p.snow) >= 0.85, at + 'snow is near white');
  assert.ok(contrast(p.accent, p.paper) >= 3, at + 'paper text on accent ' + contrast(p.accent, p.paper).toFixed(2));
  assert.ok(contrast(p.accent2, p.paper) >= 2.5, at + 'paper text on accent2 ' + contrast(p.accent2, p.paper).toFixed(2));
  assert.ok(lum(p.gold) >= 0.45, at + 'gold is bright ' + lum(p.gold).toFixed(2)); assert.ok(contrast(p.gold, p.ink) >= 6, at + 'gold on ink ' + contrast(p.gold, p.ink).toFixed(2));
  assert.ok(contrast(p.accent, p.bg) >= 1.6 || hueApart(p.accent, p.bg), at + 'accent vanishes into bg ' + contrast(p.accent, p.bg).toFixed(2));
  const l = lum(p.bg), l2 = lum(p.bg2);
  if (p.mode === 'light') assert.ok(l >= 0.55, at + 'a light backdrop, bg luminance ' + l.toFixed(3));
  if (p.mode === 'mid') assert.ok(l >= 0.18 && l <= 0.55, at + 'a mid-tone backdrop, bg luminance ' + l.toFixed(3));
  if (p.mode === 'dark') assert.ok(l <= 0.14 && l2 <= 0.25, at + 'a dark backdrop, luminance ' + l.toFixed(3) + ' and ' + l2.toFixed(3));
}
assert.ok(palettes.length >= 66, 'at least 66 palettes');
for (const m of MODES) assert.ok(count(palettes, (p) => p.mode === m) >= 22, 'at least 22 ' + m + ' palettes');
for (const m of MOODS) assert.ok(count(palettes, (p) => p.moods.includes(m)) >= (m === 'muted' ? 8 : 4), 'mood ' + m + ' has ' + count(palettes, (p) => p.moods.includes(m)) + ' palettes');
for (const m of OCCASION_MOODS) for (const mode of MODES) assert.ok(palettes.some((p) => p.mode === mode && p.moods.includes(m)), 'occasion mood ' + m + ' has a ' + mode + ' palette');
for (const c of COLOURS) assert.ok(palettes.some((p) => p.colour === c), 'a palette a person would call ' + c);
// no two palettes close to each other: over the two backdrop colours and the two accents, the largest channel steps add up
let nearest = { v: 1e9, a: '', b: '' };
for (let i = 0; i < palettes.length; i++) for (let j = i + 1; j < palettes.length; j++) {
  const a = palettes[i], b = palettes[j], d = far(a.bg, b.bg) + far(a.bg2, b.bg2) + far(a.accent, b.accent) + far(a.accent2, b.accent2);
  if (d < nearest.v) nearest = { v: d, a: a.id, b: b.id };
}
assert.ok(nearest.v >= 80, 'palettes ' + nearest.a + ' and ' + nearest.b + ' are too close (' + nearest.v + ')');

// ------------------------------------------------- type pairings -------------------------------------------------
const TYPE_TAGS = ['playful', 'elegant', 'hand', 'retro', 'modern', 'bold', 'classic', 'kids', 'script', 'pixel', 'neon', 'storybook', 'typewriter', 'formal', 'friendly', 'restrained', 'sporty', 'spooky'];
const READS_SMALL = ['CT Sans', 'CT Sans Semi', 'CT Sans Bold', 'CT Hand', 'CT Hand Bold', 'CT Serif', 'CT Chewy', 'CT Retro', 'CT Type', 'CT Lobster'];   // faces a sung line may be set in
const TITLE_ONLY = ['CT Vibes', 'CT Script', 'CT Pixel', 'CT Neon', 'CT Carol Bold', 'CT Fat', 'CT Bangers', 'CT Xmas', 'CT Xmas Bold'];               // script and display faces
const SCALE = { 'CT Vibes': [1.15, 1.2], 'CT Pixel': [0.6, 0.6], 'CT Neon': [0.8, 0.8], 'CT Carol Bold': [0.82, 0.82], 'CT Carol': [0.82, 0.82], 'CT Script': [0.9, 0.92] };   // what the launch templates found these faces need
const QUIET_FACES = ['CT Serif', 'CT Sans', 'CT Sans Semi', 'CT Sans Bold'];
const pairs = new Set();
for (const y of types) {
  const at = 'type ' + y.id + ': ';
  keysOf(y, ['id', 'name', 'title', 'body', 'lyric', 'caption', 'tags'], ['titleScale', 'lyricScale'], at);
  for (const k of ['title', 'body', 'lyric', 'caption']) assert.ok(Fonts.families.includes(y[k]), at + k + ' is a bundled family: ' + y[k]);
  words(y.tags, TYPE_TAGS, at + 'tags: ');
  assert.ok(READS_SMALL.includes(y.lyric), at + 'the sung line is set in a face that reads small, not ' + y.lyric);
  assert.ok(!TITLE_ONLY.includes(y.body) && (!TITLE_ONLY.includes(y.caption) || (y.caption === 'CT Script' && y.lyric === 'CT Lobster')), at + 'display faces are for titles only (a Script caption only in the romantic pairings, as at launch)');
  if (y.lyric === 'CT Lobster') assert.ok(y.title === 'CT Vibes' || y.title === 'CT Lobster', at + 'a Lobster sung line belongs to the romantic script pairings only');
  if (SCALE[y.title]) assert.ok(y.titleScale >= SCALE[y.title][0] && y.titleScale <= SCALE[y.title][1], at + y.title + ' needs titleScale ' + SCALE[y.title].join('..'));
  else assert.ok(y.titleScale === undefined || (y.titleScale >= 0.6 && y.titleScale <= 1.2), at + 'titleScale');
  assert.ok(y.lyricScale === undefined || (y.lyricScale >= 0.8 && y.lyricScale <= 1.1), at + 'lyricScale');
  if (y.tags.includes('restrained')) for (const k of ['title', 'body', 'lyric', 'caption']) assert.ok(QUIET_FACES.includes(y[k]), at + 'a restrained pairing is serif or quiet sans, not ' + y[k]);
  if (y.tags.includes('script')) assert.ok(['CT Vibes', 'CT Script', 'CT Lobster'].includes(y.title), at + 'tagged script');
  if (y.tags.includes('pixel')) assert.strictEqual(y.title, 'CT Pixel', at + 'tagged pixel'); if (y.tags.includes('neon') && y.title !== 'CT Pixel') assert.strictEqual(y.title, 'CT Neon', at + 'tagged neon');
  const pair = y.title + ' / ' + y.lyric; assert.ok(!pairs.has(pair), at + 'another pairing already sets ' + pair); pairs.add(pair);
}
assert.ok(types.length >= 28, 'at least 28 type pairings');
for (const t of TYPE_TAGS) assert.ok(types.some((y) => y.tags.includes(t)), 'a pairing tagged ' + t);
for (const [t, n] of [['restrained', 4], ['formal', 6], ['elegant', 6], ['kids', 5]]) assert.ok(count(types, (y) => y.tags.includes(t)) >= n, 'at least ' + n + ' pairings tagged ' + t);

// ------------------------------------------------- music directions -------------------------------------------------
const TONES = ['heartfelt', 'funny', 'cute', 'elegant', 'retro', 'modern', 'kids', 'work', 'romantic', 'calm', 'party', 'sporty', 'musical', 'spooky', 'faith', 'restrained'];
const forbidden = new RegExp([
  'jingle bells|silent night|white christmas|let it snow|feliz navidad|last christmas|deck the halls|happy birthday to you|auld lang syne|all i want for',   // songs
  'mariah|sinatra|bubl[eé]|elvis|beatles|taylor swift|wham|bing crosby|nat king cole|beyonc|madonna|\\babba\\b|bowie|\\bdylan\\b|beach boys|sousa',            // artists
  'motown|disney|pixar|frosty|rudolph|grinch|mickey|snoopy|sesame|muppet|pokemon|\\bmario\\b|nintendo|star wars|broadway|bollywood|hollywood|nashville',       // labels, shows, characters, places that stand for an industry
  '\\brhodes\\b|hammond|\\bmoog\\b|wurlitzer|fender|gibson|steinway|mellotron|clavinet|baby bass|auto-?tune|\\b808\\b|tiktok|spotify|\\bmtv\\b',               // brands
  'gpt|claude|suno|udio|gemini|llama|openai|anthropic|elevenlabs|stable audio'                                                                               // models and services
].join('|'), 'i');
const plain = (s, at, max) => assert.ok(typeof s === 'string' && s.trim() === s && s.length >= 3 && s.length <= max, at + 'text of 3 to ' + max + ' characters: ' + JSON.stringify(s));
for (const d of music) {
  const at = 'music ' + d.id + ': ';
  keysOf(d, ['id', 'name', 'styles', 'bpm', 'voices', 'notes', 'energy', 'tones', 'genres', 'for'], ['negative'], at);
  assert.ok(Array.isArray(d.styles) && d.styles.length === 7 && new Set(d.styles).size === 7, at + 'seven different style phrases'); for (const s of d.styles) plain(s, at + 'style: ', 48);
  assert.ok(Number.isInteger(d.bpm) && d.bpm >= 60 && d.bpm <= 150, at + 'bpm 60..150: ' + d.bpm);
  plain(d.voices, at + 'voices: ', 110); plain(d.notes, at + 'notes: ', 110); assert.ok(/[.!?]$/.test(d.notes) && !/[.!?] [A-Z]/.test(d.notes), at + 'notes is one sentence');
  assert.ok(['low', 'mid', 'high'].includes(d.energy), at + 'energy'); words(d.tones, TONES, at + 'tones: ');
  for (const k of ['genres', 'for']) { assert.ok(Array.isArray(d[k]) && d[k].length > 0 && new Set(d[k]).size === d[k].length, at + k); for (const w of d[k]) assert.ok(typeof w === 'string' && /^[a-z0-9&][a-z0-9& -]*$/.test(w), at + k + ' word "' + w + '"'); }
  if (d.negative !== undefined) { assert.ok(Array.isArray(d.negative) && d.negative.length > 0 && new Set(d.negative).size === d.negative.length, at + 'negative'); for (const s of d.negative) plain(s, at + 'negative: ', 40); }
  const text = JSON.stringify(d);
  assert.ok(!forbidden.test(text), at + 'no artist, band, song, show, brand or model name: ' + (forbidden.exec(text) || [''])[0]);
  if (d.tones.includes('restrained')) {
    assert.ok(d.bpm <= 80 && d.energy === 'low', at + 'a restrained direction is slow and gentle');
    for (const n of ['comedy', 'novelty sound effects', 'dance beat', 'loud drums']) assert.ok((d.negative || []).includes(n), at + 'restrained keeps out ' + n);
    assert.ok(!d.tones.some((t) => ['funny', 'party', 'sporty', 'spooky', 'kids'].includes(t)), at + 'restrained is never also loud');
    assert.ok(/piano|string|cello|guitar|choir|harp/.test(d.styles.join(' ')), at + 'restrained is piano, strings, soft guitar, harp or a hushed choir');
  }
  if (d.tones.includes('work')) for (const n of ['religious references', 'drinking songs']) assert.ok((d.negative || []).includes(n), at + 'work keeps out ' + n);
  if (d.tones.includes('work') || d.for.includes('work')) assert.ok(!d.tones.includes('faith'), at + 'work is never faith');
  if (d.energy === 'low') assert.ok(d.bpm <= 100, at + 'low energy is not fast'); if (d.energy === 'high') assert.ok(d.bpm >= 96, at + 'high energy is not slow');
}
assert.ok(music.length >= 96, 'at least 96 music directions');
for (const t of TONES) { const n = count(music, (d) => d.tones.includes(t)); assert.ok(n >= (t === 'restrained' ? 8 : 6), 'tone ' + t + ' has ' + n + ' directions'); }
for (const e of ['low', 'mid', 'high']) assert.ok(count(music, (d) => d.energy === e) >= 20, 'energy ' + e);
for (const f of ['birthday', 'kids', 'wedding', 'sympathy', 'sports', 'halloween', 'new-year', 'work', 'new-baby', 'graduation', 'thanks', 'love', 'farewell', 'travel', 'holiday-lights', 'harvest', 'spring', 'pets', 'retirement', 'get-well'])
  assert.ok(music.some((d) => d.for.includes(f)), 'a direction for ' + f);
for (const dec of ['50s', '60s', '70s', '80s', '90s']) assert.ok(music.some((d) => d.tones.includes('retro') && d.genres.includes(dec)), 'a retro direction with a ' + dec + ' feel');
for (const w of ['stadium', 'marching band', 'drumline']) assert.ok(music.some((d) => d.tones.includes('sporty') && d.styles.join(' ').includes(w)), 'a sporty direction with ' + w);

// -------------------------- every type pairing, set by the engine: nothing leaves the safe area --------------------------
const TITLE = 'A Carol for Grandma Josephine', LINE = 'We saved the corner seat and your favourite song for tonight';
assert.strictEqual(LINE.length, 60);
const looks = [['outline', 'pill'], ['plate', 'band'], ['ribbon', 'tape']], shapes = [[360, 640], [360, 360]], canv = shapes.map((s) => Canvas.createCanvas(s[0], s[1]));
let frames = 0;
types.forEach((y, i) => {
  const id = 'libdata-type-' + y.id, fonts = { title: y.title, body: y.body, lyric: y.lyric, caption: y.caption }, pal = palettes[i % palettes.length], lk = looks[i % looks.length];
  if (y.titleScale) fonts.titleScale = y.titleScale; if (y.lyricScale) fonts.lyricScale = y.lyricScale;
  assert.ok(T.add({ id: id, v: 1, name: 'Libdata', occasion: 'birthday', family: 'x', blurb: '', tags: [],
    look: { pal: { bg: pal.bg, bg2: pal.bg2, ink: pal.ink, accent: pal.accent, accent2: pal.accent2, gold: pal.gold, snow: pal.snow, paper: pal.paper }, fonts: fonts, border: 'none', karaoke: lk[1], transition: 'cut', title: lk[0], frameIn: 'pop' },
    cast: [{ kind: 'character', name: 'bear', role: 'lead' }, { kind: 'character', name: 'fox', role: 'side' }, { kind: 'prop', name: 'cake', role: 'hero' }], backdrop: 'partywall', particles: '', particleAmount: 0, frames: ['plain'], vignettes: ['cake'],
    scenes: [{ kind: 'title', layout: 'top' }, { kind: 'photo', layout: 'hero' }, { kind: 'lyric', tableau: 'hero' }, { kind: 'photo', layout: 'collage' }, { kind: 'signoff', layout: 'top' }], music: { styles: ['x'], bpm: 110, voices: 'x', notes: 'x', negative: [] }, tone: 'x' }), 'template added for ' + y.id);
  const card = { template: id, to: 'Grandma Josephine', from: 'Ada', title: TITLE, greeting: 'With all our love', signoff: 'from Ada and the gang', lyrics: [{ section: 'verse', lines: [LINE, 'And the kettle is on'] }], scenes: [], timing: { duration: 30, bpm: 110, offset: 0.5 } };
  const pl = E.plan(card), ln = pl.lines[0], at = { title: Math.min(2.2, pl.scenes[0].t1 - 0.05), lyric: ln.t0 + (ln.t1 - ln.t0) * 0.6 };
  shapes.forEach((s, si) => {
    const W = s[0], H = s[1], ctx = canv[si].getContext('2d'), sf = E.layout(W, H, card).safe, eps = 0.75;
    for (const what of ['title', 'lyric']) {
      const env = { images: [], boxes: [], quality: 'full' }, where = 'type ' + y.id + ' ' + W + 'x' + H + ' ' + what;
      ctx.clearRect(0, 0, W, H); E.draw(ctx, W, H, card, at[what], env); frames++;
      const texts = env.boxes.filter((b) => b.kind === 'text');
      assert.ok(texts.some((b) => b.what === what), where + ': the ' + what + ' is drawn');
      for (const b of texts) {
        assert.ok([b.x, b.y, b.w, b.h].every(Number.isFinite) && b.w > 0 && b.h > 0, where + ': box numbers');
        assert.ok(b.x >= sf.x - eps && b.x + b.w <= sf.x + sf.w + eps && b.y >= sf.y - eps && b.y + b.h <= sf.y + sf.h + eps, where + ': text "' + b.what + '" outside the safe area ' + JSON.stringify([b.x / W, b.y / H, b.w / W, b.h / H].map((v) => +v.toFixed(3))));
      }
    }
  });
});
assert.strictEqual(frames, types.length * 4);

console.log('OK libdata (' + palettes.length + ' palettes, ' + types.length + ' type pairings, ' + music.length + ' music directions)');
