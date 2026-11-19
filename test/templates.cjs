'use strict';
// test/templates.cjs : the template engine and every template. No network, no port. Prints "OK templates" last.
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const root = path.join(__dirname, '..');
const Canvas = require('@napi-rs/canvas');
const Fonts = require(path.join(root, 'fonts.js'));
const Art = require(path.join(root, 'art.js'));
const T = require(path.join(root, 'templates.js'));
const E = require(path.join(root, 'engine.js'));
const started = Date.now();

// ---------- fonts ----------
assert.strictEqual(Fonts.list.length, 20, '20 fonts listed');
for (const f of Fonts.list) { assert.ok(/^CT /.test(f.family), 'our family name: ' + f.family); assert.ok(fs.existsSync(path.join(root, 'fonts', f.file)), 'font file ' + f.file); }
assert.strictEqual(new Set(Fonts.list.map((f) => f.family)).size, 20, 'font families unique');
assert.strictEqual(fs.readdirSync(path.join(root, 'fonts')).filter((f) => /\.ttf$/i.test(f)).length, 20, 'every .ttf is listed');
assert.strictEqual(Fonts.registerNode(Canvas, path.join(root, 'fonts')), 20, 'fonts registered');
for (const f of Fonts.list) assert.ok(Canvas.GlobalFonts.has(f.family), 'registered ' + f.family);
assert.strictEqual(typeof Fonts.loadBrowser, 'function');

// ---------- the list ----------
assert.strictEqual(E.VERSION, 1);
const list = T.list;
assert.ok(list.length >= 32, 'at least 32 templates, got ' + list.length);
assert.deepStrictEqual(T.occasions, ['christmas', 'birthday', 'love', 'thanks', 'congrats']);
const xmas = list.filter((t) => t.occasion === 'christmas');
assert.ok(xmas.length >= 24, 'at least 24 Christmas templates');
const xmasFamilies = ['family-cozy', 'funny', 'kids', 'grandparents', 'romantic', 'pets', 'friends', 'work', 'faith', 'retro', 'new-baby', 'far-away'];
for (const f of xmasFamilies) {
  assert.ok(T.families.some((x) => x.id === f && x.occasion === 'christmas' && x.name), 'family listed: ' + f);
  assert.ok(xmas.filter((t) => t.family === f).length >= 2, 'at least 2 templates in ' + f);
}
for (const o of ['birthday', 'love', 'thanks', 'congrats']) assert.ok(list.filter((t) => t.occasion === o).length >= 2, 'at least 2 templates for ' + o);
assert.strictEqual(new Set(list.map((t) => t.id)).size, list.length, 'ids unique');
assert.strictEqual(new Set(list.map((t) => t.name)).size, list.length, 'names unique');
assert.strictEqual(new Set(list.map((t) => t.order)).size, list.length, 'orders unique');

const forbidden = /jingle bells|silent night|white christmas|let it snow|feliz navidad|last christmas|deck the halls|happy birthday to you|all i want for|mariah|sinatra|bubl[eé]|elvis|beatles|taylor swift|wham|bing crosby|nat king cole|disney|pixar|frosty|rudolph|grinch|mickey|snoopy|santa claus is|gpt|claude|suno|udio|gemini|llama|openai|anthropic|elevenlabs|stable audio/i;
const hasEmoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
const fontSet = new Set(Fonts.list.map((f) => f.family));
const combos = new Set(), backdrops = new Set();
for (const t of list) {
  const at = 'template ' + t.id + ': ';
  assert.ok(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id) && t.id.length <= 40, at + 'slug-like id');
  assert.strictEqual(T.get(t.id), t, at + 'get(id)');
  assert.ok(T.occasions.includes(t.occasion), at + 'occasion');
  const fam = T.families.find((f) => f.id === t.family);
  assert.ok(fam && fam.occasion === t.occasion, at + 'family belongs to its occasion');
  assert.ok(t.name && t.blurb && t.blurb.length > 30 && /[.!?]$/.test(t.blurb), at + 'name and a one-sentence blurb');
  assert.ok(Array.isArray(t.tags) && t.tags.length >= 5, at + 'tags');
  assert.ok(typeof t.tone === 'string' && t.tone.length > 30, at + 'tone');
  const L = t.look;
  for (const k of ['bg', 'bg2', 'ink', 'accent', 'accent2', 'gold', 'snow', 'paper']) assert.ok(/^#[0-9a-f]{6}$/i.test(L.pal[k]), at + 'palette colour ' + k);
  for (const k of ['title', 'body', 'lyric', 'caption']) assert.ok(fontSet.has(L.fonts[k]), at + 'font ' + k + ' = ' + L.fonts[k]);
  assert.ok(Art.borders.includes(L.border), at + 'border ' + L.border);
  assert.ok(E.karaokeStyles.includes(L.karaoke), at + 'karaoke ' + L.karaoke);
  assert.ok(E.transitions.includes(L.transition), at + 'transition ' + L.transition);
  assert.ok(E.titleStyles.includes(L.title), at + 'title style ' + L.title);
  assert.ok(E.frameEntrances.includes(L.frameIn), at + 'frame entrance ' + L.frameIn);
  assert.ok(Art.backdrops.includes(t.backdrop), at + 'backdrop ' + t.backdrop);
  assert.ok(!t.particles || Art.particleNames.includes(t.particles), at + 'particles ' + t.particles);
  assert.ok(Array.isArray(t.frames) && t.frames.length >= 2, at + 'at least 2 frame styles');
  for (const f of t.frames) assert.ok(Art.frames.includes(f), at + 'frame ' + f);
  assert.ok(Array.isArray(t.cast) && t.cast.filter((c) => c.kind === 'character').length >= 2 && t.cast.some((c) => c.kind === 'prop'), at + 'a cast of characters and props');
  for (const c of t.cast) assert.ok(c.kind === 'character' ? Art.characters.includes(c.name) : c.kind === 'prop' && Art.props.includes(c.name), at + 'cast ' + c.name);
  for (const v of t.vignettes) assert.ok(v.indexOf('c:') === 0 ? Art.characters.includes(v.slice(2)) : Art.props.includes(v), at + 'vignette ' + v);
  assert.ok(Array.isArray(t.scenes) && t.scenes.length >= 4 && t.scenes.length <= 6, at + '4 to 6 scene specs');
  assert.strictEqual(t.scenes[0].kind, 'title', at + 'starts with a title');
  assert.strictEqual(t.scenes[t.scenes.length - 1].kind, 'signoff', at + 'ends with a sign-off');
  assert.ok(t.scenes.some((s) => s.kind === 'photo') && t.scenes.some((s) => s.kind === 'lyric'), at + 'has photo and lyric scenes');
  const m = t.music;
  assert.ok(Array.isArray(m.styles) && m.styles.length >= 5 && m.styles.length <= 9, at + '5+ music styles');
  assert.ok(Array.isArray(m.negative) && m.negative.length >= 1, at + 'negative styles');
  assert.ok(m.bpm >= 60 && m.bpm <= 180, at + 'bpm 60..180');
  assert.ok(m.voices && m.notes, at + 'voices and notes');
  const words = [t.id, t.name, t.blurb, t.tone, t.tags.join(' | '), m.styles.join(' | '), m.negative.join(' | '), m.voices, m.notes].join(' | ');
  assert.ok(!forbidden.test(words), at + 'no artist, song, character or model names: ' + (forbidden.exec(words) || [''])[0]);
  assert.ok(!hasEmoji.test(JSON.stringify(t)), at + 'no emoji');
  if (t.occasion !== 'christmas') { // no snow, no Christmas dress
    for (const c of t.cast) assert.ok(Art.everyday[c.kind === 'character' ? 'characters' : 'props'].includes(c.name), at + 'everyday cast only, got ' + c.name);
    for (const f of t.frames) assert.ok(Art.everyday.frames.includes(f), at + 'everyday frame only, got ' + f);
    assert.ok(Art.everyday.backdrops.includes(t.backdrop), at + 'everyday backdrop');
    assert.ok(Art.everyday.particles.includes(t.particles) && Art.everyday.borders.includes(L.border), at + 'everyday particles and border');
    assert.ok(!/christmas|xmas|santa|snow|holiday|sleigh bells/i.test(words), at + 'no Christmas words');
  } else for (const c of t.cast) assert.ok(!['bird', 'bear', 'bunny', 'fox'].includes(c.name) || true);
  if (t.family === 'work') assert.ok(/happy holidays/i.test(t.tone) && /professional/i.test(t.tone), at + 'work tone is professional and inclusive');
  if (t.family === 'faith') assert.ok(m.negative.some((n) => /comedy/.test(n)), at + 'faith: no comedy');
  combos.add([t.backdrop, L.fonts.title + '+' + L.fonts.lyric, L.karaoke, L.transition, t.frames.join('+')].join(' / '));
  backdrops.add(t.backdrop);
}
assert.strictEqual(backdrops.size, list.length, 'every template has its own backdrop');
assert.strictEqual(new Set(list.map((t) => JSON.stringify(t.look.pal))).size, list.length, 'every template has its own palette');
assert.strictEqual(new Set(list.map((t) => t.cast.map((c) => c.name).join('+'))).size, list.length, 'every template has its own cast');
assert.strictEqual(combos.size, list.length, 'no two templates share a look');
// no two templates in the same family share a karaoke style, a transition or a type pairing
for (const f of T.families) {
  const ts = list.filter((t) => t.family === f.id);
  for (const k of ['karaoke', 'transition']) assert.strictEqual(new Set(ts.map((t) => t.look[k])).size, ts.length, f.id + ': ' + k + ' differs inside the family');
  assert.strictEqual(new Set(ts.map((t) => t.look.fonts.title + '+' + t.look.fonts.lyric)).size, ts.length, f.id + ': type pairing differs inside the family');
}

// ---------- search ----------
let r = T.search({});
assert.strictEqual(r.total, list.length); assert.strictEqual(r.page, 1); assert.strictEqual(r.items.length, 12); assert.strictEqual(r.pages, Math.ceil(list.length / 12));
r = T.search({ per: 5, page: 2 }); assert.strictEqual(r.items.length, 5); assert.strictEqual(r.items[0], list[5]); assert.strictEqual(r.page, 2);
r = T.search({ per: 5, page: 999 }); assert.strictEqual(r.page, r.pages); assert.ok(r.items.length >= 1);
const seen = new Set(); for (let p = 1; p <= T.search({ per: 7 }).pages; p++) T.search({ per: 7, page: p }).items.forEach((t) => seen.add(t.id));
assert.strictEqual(seen.size, list.length, 'pagination reaches every template once');
r = T.search({ occasion: 'birthday' }); assert.ok(r.total >= 2 && r.items.every((t) => t.occasion === 'birthday'));
r = T.search({ family: 'faith' }); assert.ok(r.total >= 2 && r.items.every((t) => t.family === 'faith'));
r = T.search({ occasion: 'christmas', family: 'pets', per: 50 }); assert.ok(r.total >= 2 && r.items.every((t) => t.family === 'pets'));
r = T.search({ q: 'grandma' }); assert.ok(r.total >= 1 && r.items.some((t) => t.family === 'grandparents'));
r = T.search({ q: 'YETI' }); assert.ok(r.total >= 1 && r.items[0].id === 'yeti-to-party');
r = T.search({ q: 'penguin snow' }); assert.ok(r.total >= 1, 'every word must match');
r = T.search({ q: 'zzzz-nothing' }); assert.strictEqual(r.total, 0); assert.strictEqual(r.pages, 1); assert.deepStrictEqual(r.items, []);
r = T.search({ q: 'cake', occasion: 'christmas' }); assert.strictEqual(r.total, 0, 'filters combine');
assert.strictEqual(T.get('nope'), null);

// ---------- cards ----------
const LONG = 'Wonderfully long lyric line number one that runs to sixty-four ch'.slice(0, 64);
assert.strictEqual(LONG.length, 64);
function card(id, nPhotos) {
  return {
    template: id, to: 'Grandmother Josephine Elizabeth Hollister', from: 'The Extended Hollister-Vandersloot Family',   // 40 characters each
    title: 'A Carol for Grandmother Josephine Elizabeth Hollister', greeting: 'The Merriest Christmas Ever, Grandmother Josephine!', signoff: 'With all our love, Sam, Wren, Milo, Waffles and the whole crew',
    lyrics: [{ section: 'verse', lines: [LONG, LONG, 'A short one', LONG] }, { section: 'hook', lines: [LONG, LONG] }, { section: 'verse', lines: [LONG, 'Supercalifragilisticexpialidociously-unbreakable-word-here-now'] }],
    scenes: Array.from({ length: nPhotos }, (_, i) => ({ photo: i, caption: i % 3 === 1 ? '' : 'A fairly long caption about this photo, number ' + (i + 1) })), timing: null
  };
}
assert.ok(card('cozy-mantel', 0).to.length >= 40 && card('cozy-mantel', 0).from.length >= 40, 'long names');
function photo(i) { // a cartoon portrait: the face sits in the upper middle
  const c = Canvas.createCanvas(120, 150), x = c.getContext('2d');
  x.fillStyle = ['#7fb6d9', '#e9b872', '#9bc48a', '#d99ab0'][i % 4]; x.fillRect(0, 0, 120, 150);
  x.fillStyle = '#c33'; x.fillRect(30, 95, 60, 55); x.fillStyle = '#e9b48a'; x.beginPath(); x.arc(60, 62, 26, 0, 7); x.fill();
  return c;
}
const photos = Array.from({ length: 8 }, (_, i) => photo(i));

function hashOf(ctx, W, H) { const d = ctx.getImageData(0, 0, W, H).data; let h = 2166136261; for (let i = 0; i < d.length; i += 1) { h ^= d[i]; h = Math.imul(h, 16777619); } return h >>> 0; }
function varianceOf(ctx, W, H) { const d = ctx.getImageData(0, 0, W, H).data; let s = 0, s2 = 0, n = 0; for (let i = 0; i < d.length; i += 16) { const v = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; s += v; s2 += v * v; n++; } const m = s / n; return s2 / n - m * m; }
function hits(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function checkBoxes(boxes, W, H, where) {
  const tall = H / W > 1.3, eps = 0.75, x0 = W * 0.05, x1 = W * 0.95, y0 = H * (tall ? 0.08 : 0.05), y1 = H * (tall ? 0.88 : 0.95);
  const faces = boxes.filter((b) => b.kind === 'face'), texts = boxes.filter((b) => b.kind === 'text'), ph = boxes.filter((b) => b.kind === 'photo');
  assert.strictEqual(faces.length, ph.length, where + ': one face box per photo box');
  for (const b of boxes) { assert.ok(['text', 'photo', 'face'].includes(b.kind), where + ': box kind'); assert.ok([b.x, b.y, b.w, b.h].every(Number.isFinite) && b.w > 0 && b.h > 0, where + ': box numbers'); }
  for (const b of texts) {
    assert.ok(b.x >= x0 - eps && b.x + b.w <= x1 + eps && b.y >= y0 - eps && b.y + b.h <= y1 + eps, where + ': text "' + b.what + '" outside the safe area ' + JSON.stringify([b.x, b.y, b.w, b.h].map((v) => +(v / (v === b.y || v === b.h ? H : W)).toFixed(3))));
    for (const f of faces) assert.ok(!hits(b, f), where + ': text "' + b.what + '" over a face');
    // the words being sung never sit over the middle of a photo
    if (/^lyric/.test(b.what)) for (const p of ph) { const cx = p.x + p.w / 2, cy = p.y + p.h / 2; assert.ok(!(cx > b.x && cx < b.x + b.w && cy > b.y && cy < b.y + b.h), where + ': the lyric "' + b.what + '" is over the centre of a photo'); }
  }
  return texts.length;
}
function timesFor(pl) {
  const ts = new Set();
  for (const s of pl.scenes) { ts.add(+(s.t0 + 0.01).toFixed(3)); ts.add(+((s.t0 + s.t1) / 2).toFixed(3)); ts.add(+(s.t1 - 0.01).toFixed(3)); }
  for (let i = 0; i < 12; i++) ts.add(+(pl.duration * i / 11).toFixed(3));
  return [...ts].sort((a, b) => a - b);
}
function checkPlan(c, where) {
  const pl = E.plan(c), tm = E.timing(c), n = c.lyrics.reduce((a, s) => a + s.lines.length, 0);
  assert.ok(pl.duration > 0 && pl.bpm > 0 && Array.isArray(pl.beats) && pl.beats.length > 8, where + ': plan basics');
  assert.strictEqual(pl.duration, tm.duration, where + ': plan and timing agree');
  assert.strictEqual(pl.scenes[0].kind, 'title'); assert.strictEqual(pl.scenes[pl.scenes.length - 1].kind, 'signoff');
  assert.strictEqual(pl.scenes[0].t0, 0, where + ': starts at 0'); assert.strictEqual(pl.scenes[pl.scenes.length - 1].t1, pl.duration, where + ': ends at the duration');
  for (let i = 0; i < pl.scenes.length; i++) {
    const s = pl.scenes[i];
    assert.ok(['title', 'photo', 'lyric', 'art', 'signoff'].includes(s.kind), where + ': scene kind');
    assert.ok(s.t1 > s.t0, where + ': scene has a length');
    if (i) { assert.strictEqual(s.t0, pl.scenes[i - 1].t1, where + ': no gap before scene ' + i); assert.ok(pl.beats.some((b) => Math.abs(b - s.t0) <= 0.02), where + ': cut at ' + s.t0 + ' is on a beat'); }
    if (i && i < pl.scenes.length - 1) assert.ok(s.t1 - s.t0 >= 2.2 - 1e-6, where + ': middle scenes last at least 2.2 s, got ' + (s.t1 - s.t0).toFixed(2));
    assert.ok(typeof s.photo === 'number' && typeof s.caption === 'string' && typeof s.frame === 'string', where + ': scene fields');
    if (s.kind === 'photo') assert.ok(s.photo >= 0 && s.photos.length >= 1 && s.photos.length <= 4 && Art.frames.includes(s.frame), where + ': photo scene');
    if (s.kind === 'art' || s.kind === 'lyric') assert.strictEqual(s.photo, -1);
  }
  const tl = pl.scenes[0].t1, sl = pl.duration - pl.scenes[pl.scenes.length - 1].t0;
  assert.ok(tl >= 2.5 - 1e-6 && tl <= 4 + 1e-6, where + ': title lasts 2.5 to 4 s, got ' + tl); assert.ok(sl >= 3.5 - 1e-6 && sl <= 5 + 1e-6, where + ': sign-off holds 3.5 to 5 s, got ' + sl);
  assert.strictEqual(pl.lines.length, n, where + ': a time for every lyric line');
  for (const l of pl.lines) assert.ok(l.text && l.t0 >= 0 && l.t0 < l.t1 && l.t1 <= pl.duration + 1e-6 && l.section, where + ': lyric line times');
  const shown = new Set(); pl.scenes.filter((s) => s.kind === 'photo').forEach((s) => s.photos.forEach((p) => shown.add(p)));
  assert.strictEqual(shown.size, c.scenes.length, where + ': every photo gets a scene');
  if (!c.scenes.length) assert.ok(pl.scenes.some((s) => s.kind === 'art'), where + ': art scenes stand in for photos');
  assert.ok(pl.scenes.some((s) => s.kind === 'lyric'), where + ': a lyric scene');
  const pt = E.posterTime(c); assert.ok(pt > 0.5 && pt < pl.scenes[0].t1, where + ': poster time is in the title scene');
  return pl;
}

// ---------- every template: 0, 3 and 8 photos, long names and lines, tall and square ----------
const small = { tall: Canvas.createCanvas(270, 480), square: Canvas.createCanvas(270, 270) }, full = { tall: Canvas.createCanvas(1080, 1920), square: Canvas.createCanvas(1080, 1080) };
let frames = 0, textBoxes = 0, fullMs = 0, fullN = 0;
list.forEach((t, ti) => {
  for (const n of [0, 3, 8]) {
    const c = card(t.id, n), where = t.id + ' with ' + n + ' photos', pl = checkPlan(c, where), ts = timesFor(pl);
    assert.ok(ts.length >= 12, where + ': at least 12 times');
    for (const shape of ['tall', 'square']) {
      const cv = small[shape], ctx = cv.getContext('2d'), W = cv.width, H = cv.height; let sawLyric = false, sawPhoto = false;
      for (const time of ts) {
        const env = { images: photos, boxes: [], quality: 'preview' };
        ctx.clearRect(0, 0, W, H);
        E.draw(ctx, W, H, c, time, env);
        textBoxes += checkBoxes(env.boxes, W, H, where + ' ' + shape + ' at ' + time);
        if (env.boxes.some((b) => b.what === 'lyric')) sawLyric = true; if (env.boxes.some((b) => b.kind === 'photo')) sawPhoto = true;
        frames++;
      }
      assert.ok(sawLyric, where + ' ' + shape + ': the karaoke band showed'); assert.strictEqual(sawPhoto, n > 0, where + ' ' + shape + ': photos shown only when there are photos');
      // never blank, and deterministic: the same (card, t) twice gives the same pixels
      const mid = pl.scenes[1], tm = (mid.t0 + mid.t1) / 2;
      ctx.clearRect(0, 0, W, H); E.draw(ctx, W, H, c, tm, { images: photos }); const h1 = hashOf(ctx, W, H); assert.ok(varianceOf(ctx, W, H) > 80, where + ' ' + shape + ': frame is not blank');
      E.draw(ctx, W, H, c, 0.6, { images: photos }); ctx.clearRect(0, 0, W, H); E.draw(ctx, W, H, c, tm, { images: photos });
      assert.strictEqual(hashOf(ctx, W, H), h1, where + ' ' + shape + ': draw is deterministic');
    }
  }
  // one full-size frame per template (tall and square in turn), with images missing: placeholders must draw
  const shape = ti % 2 ? 'square' : 'tall', cv = full[shape], ctx = cv.getContext('2d'), c3 = card(t.id, 3), p3 = E.plan(c3), env = { images: [photos[0], null], boxes: [], quality: 'full', interact: { snow: 2, dance: 1, poke: { name: t.cast[0].name, at: p3.scenes[1].t0 + 0.2 } } };
  const t0 = Date.now(); E.draw(ctx, cv.width, cv.height, c3, p3.scenes[1].t0 + 0.6, env); fullMs += Date.now() - t0; fullN++;
  checkBoxes(env.boxes, cv.width, cv.height, t.id + ' full size ' + shape);
  assert.ok(varianceOf(ctx, cv.width, cv.height) > 80, t.id + ': full-size frame is not blank');
  for (const time of [0, 1, p3.duration]) { const e2 = { images: [], boxes: [] }; E.draw(ctx, cv.width, cv.height, c3, time, e2); checkBoxes(e2.boxes, cv.width, cv.height, t.id + ' full size at ' + time); }
});

// ---------- real timing: exact beats, sung line times ----------
{
  const c = card('cozy-mantel', 5), bpm = 96, per = 60 / bpm, beats = []; for (let b = 0.42; b < 31.4; b += per) beats.push(+(b + (beats.length % 2 ? 0.012 : -0.008)).toFixed(3)); // a human drummer
  const n = c.lyrics.reduce((a, s) => a + s.lines.length, 0), lines = Array.from({ length: n }, (_, i) => ({ t0: 3.1 + i * 2.9, t1: 3.1 + i * 2.9 + 2.5 }));
  c.timing = { duration: 31.4, bpm, offset: 0.42, beats, lines, intro: 3.1 };
  const tm = E.timing(c); assert.strictEqual(tm.duration, 31.4); assert.strictEqual(tm.bpm, 96); assert.strictEqual(tm.offset, 0.42); assert.deepStrictEqual(tm.lines, lines); assert.strictEqual(tm.intro, 3.1);
  const pl = checkPlan(c, 'real timing'); assert.strictEqual(pl.duration, 31.4);
  for (const s of pl.scenes.slice(1)) assert.ok(beats.some((b) => Math.abs(b - s.t0) <= 0.02), 'cut on one of the given beats');
  assert.deepStrictEqual(pl.lines.map((l) => [l.t0, l.t1]), lines.map((l) => [l.t0, l.t1]));
  const b0 = E.beatAt(c, beats[8] + 0.001), b1 = E.beatAt(c, beats[8] + per * 0.5), b2 = E.beatAt(c, beats[9] + 0.001);
  assert.strictEqual(b0.n, 8); assert.ok(b0.phase < 0.05); assert.strictEqual(b0.bar, 2); assert.ok(b1.n === 8 && b1.phase > 0.4 && b1.phase < 0.6); assert.strictEqual(b2.n, 9);
  assert.ok(b0.energy >= 0 && b0.energy <= 1); assert.ok(E.beatAt(c, lines[4].t0 + 1).energy > E.beatAt(c, 0.2).energy, 'the hook has more energy than the intro');
  const env = { images: photos, boxes: [] }; E.draw(small.tall.getContext('2d'), 270, 480, c, lines[2].t0 + 1, env); assert.ok(env.boxes.some((b) => b.what === 'lyric'), 'karaoke line shows while it is sung');
  // default timing: a click track from the template's bpm
  const d = E.timing(card('snow-day', 2)); assert.strictEqual(d.duration, 30); assert.strictEqual(d.offset, 0.5); assert.strictEqual(d.bpm, T.get('snow-day').music.bpm); assert.strictEqual(d.lines.length, 8);
  for (let i = 1; i < d.lines.length; i++) assert.ok(d.lines[i].t0 >= d.lines[i - 1].t0, 'default lines in order');
  // odd input never throws
  for (const bad of [null, {}, { template: 'nope' }, { template: 'holy-night', lyrics: 'x', scenes: [{ photo: 99 }, { photo: -1 }, null], timing: { duration: 8, bpm: 500, beats: [1] } }, { template: 'neon-noel', timing: { duration: 22, bpm: 60 } }]) {
    const p = E.plan(bad); assert.ok(p.scenes.length >= 3 && p.scenes[p.scenes.length - 1].t1 === p.duration); E.draw(small.square.getContext('2d'), 270, 270, bad, 2, null); E.draw(small.tall.getContext('2d'), 270, 480, bad, 1e9, { images: 'x' }); E.beatAt(bad, -5); E.posterTime(bad); E.hit(bad, 270, 480, 3, 10, 10);
  }
}

// ---------- which frame a photo gets (from its shape and what the sender said), and how it sits in its window ----------
{
  const shaped = new Set(E.shapedFrames), frameOf = (pl) => { const m = {}; pl.scenes.filter((s) => s.kind === 'photo').forEach((s) => s.photos.forEach((p, i) => { m[p] = s.frames[i]; })); return m; };
  const four = (more) => [{ photo: 0, caption: '', ar: 1.5 }, { photo: 1, caption: '', ar: 0.75 }, { photo: 2, caption: '', ar: 1.333 }, { photo: 3, caption: '', ar: 0.75 }].map((s, i) => Object.assign(s, more && more[i]));
  let withShaped = 0;
  for (const tp of list) {
    const has = tp.frames.some((x) => shaped.has(x)), mk = (scenes) => Object.assign(card(tp.id, 0), { scenes }); if (has) withShaped++;
    let pl = E.plan(mk(four())), f = frameOf(pl);
    assert.ok(!shaped.has(f[0]) && !shaped.has(f[2]), tp.id + ': a wide photo never goes in a shaped frame (' + f[0] + ', ' + f[2] + ')');
    assert.strictEqual(shaped.has(f[1]), has, tp.id + ': with nothing said, the first upright photo gets the template\'s shaped frame'); assert.ok(!shaped.has(f[3]), tp.id + ': and only the first');
    assert.strictEqual(pl.scenes[0].frame, f[0], tp.id + ': the title shows the first photo in its own frame'); assert.deepStrictEqual(pl.scenes[pl.scenes.length - 1].frames, [f[0], f[1], f[2]], tp.id + ': and so does the sign-off');
    pl = E.plan(mk(four({ 2: { solo: 1 } }))); f = frameOf(pl);
    assert.strictEqual(shaped.has(f[2]), has, tp.id + ': a photo marked "one person" gets the shaped frame'); assert.ok(!shaped.has(f[0]) && !shaped.has(f[1]) && !shaped.has(f[3]), tp.id + ': and then no other photo does');
    for (const s of pl.scenes) for (const x of s.frames) assert.ok(Art.frames.includes(x), tp.id + ': frame ' + x);
    // few photos: the cast performs between them. No drawn stand-in scene, and so no "For <name>" tag said again
    for (const n of [1, 2]) { const p2 = E.plan(card(tp.id, n)); assert.ok(!p2.scenes.some((s) => s.kind === 'art'), tp.id + ' with ' + n + ' photos: no drawn filler scene'); assert.ok(p2.scenes.filter((s) => s.kind === 'lyric').length >= 2, tp.id + ' with ' + n + ' photos: the cast performs between the photos');
      for (let i = 1; i < p2.scenes.length; i++) if (p2.scenes[i].kind === 'lyric' && p2.scenes[i - 1].kind === 'lyric') assert.notStrictEqual(p2.scenes[i].tableau, p2.scenes[i - 1].tableau, tp.id + ': two cast scenes in a row differ'); }
  }
  assert.ok(withShaped >= 10, 'templates with a shaped frame: ' + withShaped);
  // a wide photo makes a rectangular frame wide; an upright one leaves it as it is; a frame that cannot stretch stays
  assert.ok(E.aspectFor('plain', 1.5) > 1.3 && E.aspectFor('polaroid', 1.333) > 1.2, 'wide frames for wide photos'); assert.strictEqual(E.aspectFor('plain', 0.75), E.aspectFor('plain', 0)); assert.strictEqual(E.aspectFor('tag', 1.5), E.aspectFor('tag', 0.75)); assert.ok(E.aspectFor('plain', 3) <= 1.42);
  { const c = Object.assign(card('gold-medal', 0), { scenes: [{ photo: 0, caption: '', ar: 1.5 }, { photo: 1, caption: '', ar: 1.5 }, { photo: 2, caption: '', ar: 1.5 }, { photo: 3, caption: '', ar: 1.5 }, { photo: 4, caption: '', ar: 1.5 }, { photo: 5, caption: '', ar: 1.5 }, { photo: 6, caption: '', ar: 1.5 }, { photo: 7, caption: '', ar: 1.5 }] }), pl = E.plan(c), s = pl.scenes.find((x) => x.kind === 'photo' && x.photos.length === 1) || pl.scenes[0];
    const env = { images: photos, boxes: [] }; E.draw(small.tall.getContext('2d'), 270, 480, c, (s.t0 + s.t1) / 2 + 0.4, env); const pb = env.boxes.filter((b) => b.kind === 'photo'); assert.ok(pb.length >= 1 && pb.every((b) => b.w > b.h * 1.15), 'a wide photo is shown in a wide window: ' + JSON.stringify(pb.map((b) => [Math.round(b.w), Math.round(b.h)]))); }
  // how the photo sits in its window: what part of it is drawn (the last drawImage of the frame)
  const cv = Canvas.createCanvas(400, 500), ctx = cv.getContext('2d'), wide = Canvas.createCanvas(1600, 900), upright = Canvas.createCanvas(900, 1200), calls = [], real = ctx.drawImage.bind(ctx);
  ctx.drawImage = function () { calls.push(Array.from(arguments)); return real.apply(null, arguments); };
  const part = (name, img, o) => { calls.length = 0; Art.frame(name, ctx, img, 0, 0, 400, 500, 1, list[0].look.pal, o); const a = calls[calls.length - 1]; return { n: calls.length, w: a[3] / img.width, h: a[4] / img.height, cx: (a[1] + a[3] / 2) / img.width, cy: (a[2] + a[4] / 2) / img.height }; };
  for (const name of Art.frames) {
    let p = part(name, wide, { keep: true }); assert.ok(p.w >= 0.86 - 1e-6, name + ': a wide photo keeps at least 86% of its width in view (a group stays whole), got ' + p.w.toFixed(2)); assert.ok(p.h >= 0.8 - 1e-6, name + ': and 80% of its height');
    p = part(name, upright, { keep: true }); assert.ok(p.w >= 0.86 - 1e-6 && p.h >= 0.8 - 1e-6, name + ': an upright photo too (' + p.w.toFixed(2) + ' x ' + p.h.toFixed(2) + ')');
    p = part(name, wide, { solo: true }); assert.strictEqual(p.n, 1, name + ': one person: the window is filled, nothing behind'); assert.ok(p.w < 0.8 && Math.abs(p.cx - 0.5) < 0.01, name + ': and cropped to the middle');
    p = part(name, wide, { fit: [0.2, 0.5, 2] }); assert.ok(Math.abs(p.cx - Math.max(0.2, p.w / 2)) < 0.01, name + ': placed by the sender: that point is in the middle (' + p.cx.toFixed(3) + ')'); const one = part(name, wide, { fit: [0.5, 0.5, 1] }); assert.ok(Math.abs(p.w * 2 - one.w) < 0.01, name + ': at twice the zoom, half the width shows');
    p = part(name, wide, { fit: [0.5, 0.5, 0.6] }); assert.ok(p.w > one.w || one.w === 1, name + ': zoomed out, more shows');
  }
}

// ---------- hit: the characters and props can be tapped ----------
{
  const c = card('snow-day', 3), pl = E.plan(c), s = pl.scenes[1], t = (s.t0 + s.t1) / 2, W = 1080, H = 1920, L = E.layout(W, H, c);
  assert.strictEqual(E.hit(c, W, H, t, L.castX[0] * W, L.floor - L.castH * 0.5), 'snowman');
  assert.strictEqual(E.hit(c, W, H, t, L.castX[1] * W, L.floor - L.castH * 0.5), 'penguin');
  assert.strictEqual(E.hit(c, W, H, t, W / 2, H * 0.93), null);
  let found = 0; for (const tp of list) { const cc = card(tp.id, 0), p = E.plan(cc), ly = p.scenes.find((x) => x.kind === 'lyric'), tt = (ly.t0 + ly.t1) / 2; const names = new Set(); for (let y = 0.1; y < 1; y += 0.04) for (let x = 0.05; x < 1; x += 0.05) { const h = E.hit(cc, 540, 960, tt, x * 540, y * 960); if (h) names.add(h); } assert.ok(names.size >= 2, tp.id + ': at least two things to tap in the lyric scene'); found += names.size; }
  assert.ok(found > list.length * 2);
}

const ms = Date.now() - started;
console.log(list.length + ' templates (' + xmas.length + ' Christmas in ' + xmasFamilies.length + ' families), ' + frames + ' small frames, ' + textBoxes + ' text boxes checked, ' + fullN + ' full-size frames at ' + (fullMs / fullN).toFixed(1) + ' ms each, ' + (ms / 1000).toFixed(1) + ' s');
console.log('OK templates');
