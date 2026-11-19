'use strict';
// test/library.cjs : THE TEMPLATE LIBRARY (library/registry.json, written by tools/library-build.cjs).
//   - thousands of templates over dozens of occasions, every id unique and a slug, every occasion in config.js;
//   - every row becomes a template (library/index.js expand) whose blocks are all in the art (launch + packs), whose
//     palette, type pairing and music direction exist, whose family belongs to its occasion, and whose art packs exist;
//   - no two templates of an occasion share a place and a cast; no two in the whole library share place, cast and hero;
//   - templates that were published still draw the same thing (test/fixtures/library-ids.json: a row once there
//     never changes; a redesign is a higher v with the old row archived);
//   - a spread of templates, drawn through the engine tall and square at the title, mid-line and the sign-off:
//     nothing throws, every text box is inside the safe area and reads (contrast of 3 or more);
//   - the server finds them: Templates.get, search, families, the occasions that have templates.
// No network, no port. Prints "OK library (...)" last.
const assert = require('node:assert'), path = require('node:path'), fs = require('node:fs');
const root = path.join(__dirname, '..');
const Canvas = require('@napi-rs/canvas');
const Fonts = require(path.join(root, 'fonts.js')); Fonts.registerNode(Canvas, path.join(root, 'fonts'));
const T = require(path.join(root, 'templates.js')), E = require(path.join(root, 'engine.js')), Art = require(path.join(root, 'art.js'));
const Lib = require(path.join(root, 'library', 'index.js')), Packs = require(path.join(root, 'art', 'index.js')), CFG = require(path.join(root, 'config.js'));
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
let checks = 0; const ok = function (v, m) { assert.ok(v, m); checks++; };

// ---------- the counts ----------
const rows = Lib.rows(), made = Lib.made();
ok(rows.length >= 3000, 'at least 3000 library templates (' + rows.length + ')');
ok(made.length >= 55, 'at least 55 occasions with templates (' + made.length + ')');
for (const o of made) { const n = rows.filter((r) => r.occ === o).length; ok(n >= 10, o + ' has at least 10 templates (' + n + ')'); ok(CFG.occasions.some((x) => x.id === o), o + ' is in config.js'); }

// ---------- every row ----------
const ids = new Set(T.list.map((t) => t.id)), places = new Map(), wide = new Map();
for (const r of rows) {
  const at = r.id + ': ';
  ok(SLUG.test(r.id) && r.id.length <= 80, at + 'a slug id'); ok(!ids.has(r.id), at + 'one id, once (also against the launch set)'); ids.add(r.id);
  ok(r.name && r.name.length <= 80 && r.blurb && r.blurb.length <= 240, at + 'a name and a blurb');
  const t = Lib.get(r.id); ok(t && t.id === r.id && t.lib, at + 'expands');
  ok(T.get(r.id) === t, at + 'Templates.get finds it');
  ok(Lib.family(t.family) && Lib.family(t.family).occasion === t.occasion, at + 'its family is its occasion\'s');
  const bd = String(t.backdrop).split(':'); ok(Art.has('backdrop', t.backdrop) || Art.has('backdrop', bd[0]), at + 'backdrop ' + t.backdrop);
  for (const c of t.cast) ok(Art.has(c.kind, c.name), at + c.kind + ' ' + c.name);
  if (t.particles) ok(Art.has('particles', t.particles), at + 'particles ' + t.particles);
  if (t.look.border) ok(Art.has('border', t.look.border), at + 'border ' + t.look.border);
  for (const f of t.frames || []) ok(Art.has('frame', f), at + 'frame ' + f);
  ok(Array.isArray(t.packs) && t.packs.every((p) => Packs.names.includes(p)), at + 'its art packs exist');
  ok(t.music.styles.length >= 3 && t.music.bpm >= 60 && t.music.bpm <= 180, at + 'music');
  // distinct: a place and a cast once per occasion; place, cast and hero once in the library
  const cast = t.cast.filter((c) => c.kind === 'character').map((c) => c.name + ':' + (c.variant || '')).sort().join('+'), hero = (t.cast.find((c) => c.kind === 'prop' && c.role === 'hero') || {}).name || '';
  const k1 = r.occ + '|' + t.backdrop + '|' + cast, k2 = t.backdrop + '|' + cast + '|' + hero;
  if (cast) { ok(!places.has(k1), at + 'the same place and cast as ' + places.get(k1)); places.set(k1, r.id); }
  ok(!wide.has(k2), at + 'the same place, cast and hero as ' + wide.get(k2)); wide.set(k2, r.id);
}

// ---------- what was published stays as it was ----------
const FIX = path.join(__dirname, 'fixtures', 'library-ids.json'), sig = (r) => [r.set, r.pal, r.type, r.mu, r.look.title, JSON.stringify(r.cast)].join(' ');
if (process.argv.includes('--write-fixture')) {
  const step = Math.max(1, Math.floor(rows.length / 150)), keep = {}; for (let i = 0; i < rows.length; i += step) keep[rows[i].id + '@' + (rows[i].v || 1)] = sig(rows[i]);
  fs.writeFileSync(FIX, JSON.stringify({ note: 'Written by node test/library.cjs --write-fixture. Templates that were published: each must keep drawing the same thing.', rows: keep }, null, 1) + '\n'); console.log('wrote ' + FIX);
}
const fx = JSON.parse(fs.readFileSync(FIX, 'utf8')).rows; let archive = null;
for (const key of Object.keys(fx)) { const [id, v] = key.split('@'), r = Lib.row(id); const was = r && (r.v || 1) === +v ? r : null;
  const old = was ? null : (archive = archive || JSON.parse(fs.readFileSync(path.join(root, 'library', 'registry.json'), 'utf8')).archive || []).find((x) => x.id === id && (x.v || 1) === +v);
  ok(was || old, id + ' v' + v + ' is still in the library'); ok(sig(was || old) === fx[key], id + ' v' + v + ' draws as it was published'); }

// ---------- a spread, drawn ----------
const SHAPES = [[216, 384], [240, 240]], CV = SHAPES.map((s) => Canvas.createCanvas(s[0], s[1]));
const LIN = new Float64Array(256); for (let i = 0; i < 256; i++) { const v = i / 255; LIN[i] = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function contrastIn(ctx, b, W, H) {
  const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y)), w = Math.min(W - x, Math.ceil(b.w)), h = Math.min(H - y, Math.ceil(b.h)); if (w < 2 || h < 2) return 99;
  const d = ctx.getImageData(x, y, w, h).data, l = new Float64Array(d.length / 4);
  for (let i = 0; i < l.length; i++) l[i] = 0.2126 * LIN[d[i * 4]] + 0.7152 * LIN[d[i * 4 + 1]] + 0.0722 * LIN[d[i * 4 + 2]];
  l.sort(); const n = Math.max(1, Math.floor(l.length / 10)); let lo = 0, hi = 0; for (let i = 0; i < n; i++) { lo += l[i]; hi += l[l.length - 1 - i]; }
  return (hi / n + 0.05) / (lo / n + 0.05);
}
const step = Math.max(1, Math.floor(rows.length / 90)); let drawn = 0;
for (let i = 0; i < rows.length; i += step) {
  const r = rows[i], c = { template: r.id, to: 'Josephine', from: 'Ada and the gang', title: 'A Carol for Josephine', greeting: 'With all our love', signoff: 'from Ada, Wren and Milo',
    lyrics: [{ section: 'verse', lines: ['The porch light is on and the kettle is too', 'We saved you the corner seat, like we do'] }, { section: 'hook', lines: ['Josephine, this one is yours'] }], scenes: [], timing: { duration: 30, bpm: 110, offset: 0.5 } };
  const pl = E.plan(c), so = pl.scenes[pl.scenes.length - 1], ln = pl.lines[1], at = { title: Math.min(2.2, pl.scenes[0].t1 - 0.05), lyric: ln.t0 + (ln.t1 - ln.t0) * 0.6, greeting: so.t0 + 2.2 };
  for (let si = 0; si < SHAPES.length; si++) {
    const W = SHAPES[si][0], H = SHAPES[si][1], ctx = CV[si].getContext('2d'), sf = E.layout(W, H, c).safe;
    for (const what of ['title', 'lyric', 'greeting']) {
      const env = { images: [], boxes: [], quality: 'full' }; ctx.clearRect(0, 0, W, H); E.draw(ctx, W, H, c, at[what], env);
      const texts = env.boxes.filter((b) => b.kind === 'text'), where = r.id + ' ' + W + 'x' + H + ' ' + what;
      for (const b of texts) ok(b.x >= sf.x - 1 && b.x + b.w <= sf.x + sf.w + 1 && b.y >= sf.y - 1 && b.y + b.h <= sf.y + sf.h + 1, where + ': "' + b.what + '" inside the safe area');
      const b = texts.find((x) => x.what === what); ok(b, where + ' is drawn'); ok(contrastIn(ctx, b, W, H) >= 3, where + ' reads');
    }
  }
  drawn++;
}

// ---------- what the server asks of it ----------
const fam = rows[0].fam, inFam = Lib.search({ family: fam }); ok(inFam.length > 0 && inFam.every((r) => r.fam === fam), 'search by family');
const occ = rows[rows.length - 1].occ, inOcc = Lib.search({ occasion: occ }); ok(inOcc.length === rows.filter((r) => r.occ === occ).length, 'search by occasion');
const name = rows[1234].name, byName = Lib.search({ q: name }); ok(byName.some((r) => r.id === rows[1234].id), 'search by a name finds it');
ok(Lib.search({ q: 'zzzqqqxxx' }).length === 0, 'a word in nothing finds nothing'); ok(Lib.search({ occasions: [] }).length === 0, 'no live occasion, nothing');
ok(Lib.families(occ).length > 0 && Lib.families(occ).every((f) => f.occasion === occ && f.name), 'families of an occasion');
ok(T.get('no-such-template-anywhere') === null, 'an unknown id is null');

console.log('OK library (' + rows.length + ' templates in ' + made.length + ' occasions, ' + drawn + ' drawn tall and square, ' + checks + ' checks)');
