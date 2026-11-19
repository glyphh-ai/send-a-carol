'use strict';
// tools/library-build.cjs : makes the library's templates from the recipes (library/occasions.js) and writes
// library/registry.json. Run it after a recipe or a block is added:
//   node tools/library-build.cjs            adds templates up to each occasion's target; rows already in the registry are kept as they are
//   node tools/library-build.cjs --dry      builds and reports, writes nothing
//   node tools/library-build.cjs --only=halloween   one occasion
// A row, once written, never changes: its id is stable and it names every block it uses, so a card made with it draws
// the same thing for ever. Nothing is random: the same recipes and the same registry make the same rows.
//
// THE GATES a template passes before it is written:
//   1. every block exists, the palette suits the place's light (a night scene gets a dark palette), the music, type and
//      looks suit the family (a sympathy card is calm, restrained, slow; a work card has no faith music)
//   2. distinct: one occasion never repeats a place-and-cast pair; place, cast, palette and look are spread out (caps);
//      across the whole library no place + cast + hero prop is used twice
//   3. it reads: the title, a sung line and the sign-off are drawn through the engine, tall and square; every word stays in
//      the safe area and the lightest and darkest tenth of the pixels in each text box differ by a contrast of 3 or more.
//      A look that fails is tried again with the next palette and looks, then dropped
//   4. it looks different: a small picture of its stage is compared with every template already in the occasion; one that
//      is too close (same place, similar colours) is dropped
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const Canvas = require('@napi-rs/canvas');
const Fonts = require(path.join(root, 'fonts.js')); Fonts.registerNode(Canvas, path.join(root, 'fonts'));
const Templates = require(path.join(root, 'templates.js')), Engine = require(path.join(root, 'engine.js')), Art = require(path.join(root, 'art.js'));
const Lib = require(path.join(root, 'library', 'index.js'));
const args = process.argv.slice(2), DRY = args.includes('--dry'), ONLY = (args.find((a) => a.startsWith('--only=')) || '').slice(7), QUIET = args.includes('--quiet');
const FILE = path.join(root, 'library', 'registry.json');

const dir = (d) => [].concat.apply([], fs.readdirSync(path.join(root, 'library', d)).filter((f) => /\.js$/.test(f)).sort().map((f) => require(path.join(root, 'library', d, f))));
const SETTINGS = dir('settings'), TROUPES = dir('troupes'), PROPS = dir('props'), PARTS = dir('particles'), BORDERS = dir('borders');
const PAL = require(path.join(root, 'library', 'palettes.js')), TYPE = require(path.join(root, 'library', 'type.js')), MUSIC = require(path.join(root, 'library', 'music.js'));
const OCC = require(path.join(root, 'library', 'occasions.js'));
const by = (list, k) => { const o = {}; list.forEach((x) => { if (o[x[k || 'id']]) throw new Error('two of ' + x[k || 'id']); o[x[k || 'id']] = x; }); return o; };
const S = by(SETTINGS), T = by(TROUPES), PM = by(PROPS, 'name'), PT = by(PARTS, 'name'), M = by(MUSIC), P = by(PAL), Y = by(TYPE);
by(OCC);

// ---------- deterministic helpers ----------
const h32 = (s) => parseInt(crypto.createHash('sha1').update(s).digest('hex').slice(0, 8), 16);
const jit = (s) => h32(s) / 4294967296;
const slug = (s) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const uniq = (a) => a.filter((x, i) => x && a.indexOf(x) === i);
const inter = (a, b) => (a || []).some((x) => (b || []).includes(x));
function least(list, used, key) { /* the item used least so far, ties broken by a hash of key: spreads choices without randomness */
  let best = null, bv = Infinity;
  list.forEach((x) => { const v = (used.get(x) || 0) + jit(key + '|' + x) * 0.9; if (v < bv) { bv = v; best = x; } });
  return best;
}
const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);

// ---------- the looks, by style ----------
const STYLE = {
  playful: { titles: ['outline', 'sticker', 'bubble', 'comic', 'pennant', 'block3d', 'marquee', 'tapestrip'], bands: ['pill', 'sticker', 'ticker', 'cloud', 'tape', 'label'], signs: ['popper', 'balloons', 'starsrow', 'heartsrow', 'pennants', 'fireworks', 'sunrise'], borders: ['none', 'confettiedge', 'streamers', 'starsedge', 'dots', 'stripes', 'wavy', 'pennants'], trans: ['flash', 'slide', 'iris', 'star', 'wipe', 'rise'], fin: ['pop', 'drop', 'swing', 'spin'], frames: ['polaroid', 'starcut', 'bubble', 'balloonframe', 'badge', 'tv', 'film', 'plain', 'scallopcard', 'tag'], type: ['playful', 'friendly', 'bold'] },
  kids: { titles: ['bubble', 'sticker', 'comic', 'outline', 'block3d', 'tapestrip'], bands: ['cloud', 'pill', 'sticker', 'grass', 'icing', 'label'], signs: ['balloons', 'starsrow', 'heartsrow', 'paws', 'popper', 'sunrise'], borders: ['dots', 'confettiedge', 'starsedge', 'sunrays', 'stripes', 'scallop', 'wavy', 'none'], trans: ['star', 'heart', 'iris', 'slide', 'rise'], fin: ['pop', 'spin', 'swing', 'drop'], frames: ['bubble', 'balloonframe', 'starcut', 'scallopcard', 'polaroid', 'badge', 'tag'], type: ['kids', 'storybook'] },
  elegant: { titles: ['gold', 'letterpress', 'underline', 'softglow', 'parchment', 'ribbon', 'quiet'], bands: ['linen', 'minimal', 'glass', 'banner', 'scroll', 'lowerthird'], signs: ['seal', 'laurel', 'swash', 'ribbonends', 'signature', 'cardframe', 'doves'], borders: ['goldline', 'artdeco', 'greekkey', 'thinline', 'doubleline', 'none'], trans: ['fade', 'diamond', 'curtain', 'iris', 'rise'], fin: ['rise', 'drop', 'slide'], frames: ['plain', 'arch', 'locket', 'medal', 'polaroid', 'window', 'stamp'], type: ['elegant', 'formal', 'classic'] },
  romantic: { titles: ['ribbon', 'softglow', 'gold', 'underline', 'parchment', 'letterpress'], bands: ['heart', 'glass', 'linen', 'scroll', 'minimal', 'ribbon'], signs: ['heartsrow', 'swash', 'posy', 'doves', 'seal', 'ribbonends'], borders: ['hearts', 'floralcorners', 'vine', 'ivy', 'goldline', 'thinline', 'none'], trans: ['heart', 'fade', 'iris', 'rise'], fin: ['rise', 'swing', 'drop'], frames: ['locket', 'arch', 'scallopcard', 'polaroid', 'stamp', 'plain', 'tag'], type: ['script', 'elegant', 'hand'] },
  retro: { titles: ['marquee', 'ticket', 'stamp', 'kraft', 'neon', 'block3d', 'pennant', 'sign'], bands: ['ticker', 'vhs', 'marquee', 'label', 'ticket', 'banner', 'tape'], signs: ['postmark', 'pennants', 'starsrow', 'spotlight', 'seal', 'signature'], borders: ['checker', 'stripes', 'ticketedge', 'film', 'wavy', 'dashes', 'none'], trans: ['blinds', 'wipe', 'clock', 'pixel', 'page', 'slide'], fin: ['swing', 'slide', 'drop'], frames: ['stamp', 'film', 'tv', 'polaroid', 'tag', 'badge', 'window'], type: ['retro', 'typewriter', 'neon', 'pixel'] },
  calm: { titles: ['quiet', 'softglow', 'underline', 'letterpress', 'parchment'], bands: ['linen', 'minimal', 'glass'], signs: ['candleglow', 'doves', 'signature', 'crescent', 'posy', 'swash'], borders: ['none', 'thinline', 'softedge', 'doubleline'], trans: ['fade', 'rise'], fin: ['rise'], frames: ['plain', 'arch', 'window', 'polaroid'], type: ['restrained'] },
  sporty: { titles: ['pennant', 'block3d', 'comic', 'ticket', 'marquee', 'outline'], bands: ['scoreboard', 'ticker', 'banner', 'lowerthird', 'pill'], signs: ['trophy', 'pennants', 'fireworks', 'starsrow', 'laurel'], borders: ['checker', 'starsedge', 'tricolorband', 'cornerbrackets', 'stripes', 'none'], trans: ['flash', 'wipe', 'slide', 'blinds'], fin: ['slide', 'drop', 'pop'], frames: ['badge', 'medal', 'starcut', 'film', 'polaroid', 'plain'], type: ['sporty', 'bold'] },
  modern: { titles: ['underline', 'tapestrip', 'quiet', 'kraft', 'block3d', 'softglow'], bands: ['minimal', 'sticker', 'ticker', 'glass', 'lowerthird'], signs: ['signature', 'cardframe', 'starsrow', 'spotlight', 'swash'], borders: ['none', 'thinline', 'cornerbrackets', 'dashes', 'doubleline'], trans: ['slide', 'wipe', 'fade', 'blinds'], fin: ['slide', 'rise', 'pop'], frames: ['plain', 'polaroid', 'film', 'window', 'badge', 'tag'], type: ['modern', 'restrained'] },
  festive: { titles: ['outline', 'gold', 'ribbon', 'sticker', 'marquee', 'letterpress', 'softglow'], bands: ['snowbank', 'ribbon', 'icing', 'banner', 'glass', 'pill', 'ice'], signs: ['starsrow', 'seal', 'ribbonends', 'fireworks', 'candleglow', 'swash'], borders: ['goldline', 'none', 'starsedge'], trans: ['star', 'iris', 'flash', 'page', 'curtain'], fin: ['pop', 'swing', 'drop'], frames: ['polaroid', 'stamp', 'starcut', 'tag', 'arch', 'locket'], type: ['storybook', 'classic', 'playful', 'script'] },
  spooky: { titles: ['comic', 'block3d', 'outline', 'marquee', 'tapestrip', 'ticket'], bands: ['ticker', 'sticker', 'pill', 'vhs', 'banner'], signs: ['crescent', 'spotlight', 'starsrow', 'popper'], borders: ['none', 'dashes', 'cornerbrackets'], trans: ['flash', 'iris', 'blinds', 'wipe'], fin: ['spin', 'swing', 'drop'], frames: ['window', 'film', 'tv', 'polaroid', 'badge', 'arch'], type: ['spooky'] }
};
const XMAS_FRAMES = ['ornament', 'snowglobe', 'wreath', 'mantel', 'sleigh'], XMASY = ['christmas', 'happy-holidays', 'winter'];
const STRICT = ['lunar-new-year', 'diwali', 'hanukkah', 'kwanzaa', 'st-patricks', 'halloween', 'eid', 'christmas', 'passover'];   // occasions whose colours carry meaning: only palettes of their moods
const MEDALS = ['congrats', 'graduation', 'sports', 'retirement', 'work-anniversary', 'new-job', 'good-luck', 'cheer-up'];   // a medal frame says "you won"
const NEUTRAL = new Set(SETTINGS.filter((s) => s.variants.length > 1 && s.variants.every((v) => v.mode.length === 3) || ['sunburst', 'confetti', 'starfield', 'partywall', 'plaid', 'wrapping', 'pawpattern', 'kraft', 'notepaper', 'stage', 'podium', 'stringlights', 'fireworksky', 'gardenbloom', 'sunnymeadow', 'rosedusk', 'mesh', 'linen', 'softglow', 'blueprint', 'vaporsun'].includes(s.id)).map((s) => s.id));
const QUIET_PT = PARTS.filter((p) => p.quiet).map((p) => p.name).concat(['']);
const LAUNCH_PT_MODES = { snow: ['mid', 'dark'], twinkle: ['mid', 'dark'], confetti: ['light', 'mid', 'dark'], stars: ['mid', 'dark'], hearts: ['light', 'mid', 'dark'], embers: ['dark'], bubbles: ['light', 'mid', 'dark'], notes: ['light', 'mid', 'dark'], petals: ['light', 'mid', 'dark'], fireflies: ['dark', 'mid'] };
const ptModes = (n) => n === '' ? ['light', 'mid', 'dark'] : PT[n] ? PT[n].modes : LAUNCH_PT_MODES[n] || [];

// ---------- checks on the recipes (an unknown name is reported, then left out) ----------
const problems = [];
const known = {
  setting: (n) => !!S[n], troupe: (n) => !!T[n], prop: (n) => Art.has('prop', n), particles: (n) => n === '' || Art.has('particles', n), border: (n) => Art.has('border', n), music: (n) => !!M[n]
};
function keep(kind, list, where) { return uniq(list || []).filter((n) => { const ok = known[kind](n); if (!ok) problems.push(where + ': no ' + kind + ' "' + n + '"'); return ok; }); }
for (const st of Object.keys(STYLE)) { const s = STYLE[st];
  for (const n of s.titles) if (!Engine.titleStyles.includes(n)) problems.push('style ' + st + ': no title ' + n);
  for (const n of s.bands) if (!Engine.karaokeStyles.includes(n)) problems.push('style ' + st + ': no band ' + n);
  for (const n of s.signs) if (!Engine.signoffStyles.includes(n)) problems.push('style ' + st + ': no sign-off ' + n);
  for (const n of s.borders) if (!Art.has('border', n)) problems.push('style ' + st + ': no border ' + n);
  for (const n of s.trans) if (!Engine.transitions.includes(n)) problems.push('style ' + st + ': no transition ' + n);
  for (const n of s.frames) if (!Art.has('frame', n)) problems.push('style ' + st + ': no frame ' + n);
}

// ---------- the gate that draws ----------
const LIN = new Float64Array(256); for (let i = 0; i < 256; i++) { const v = i / 255; LIN[i] = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function contrastIn(ctx, b, W, H) {
  const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y)), w = Math.min(W - x, Math.ceil(b.w)), h = Math.min(H - y, Math.ceil(b.h)); if (w < 2 || h < 2) return 99;
  const d = ctx.getImageData(x, y, w, h).data, l = new Float64Array(d.length / 4);
  for (let i = 0; i < l.length; i++) l[i] = 0.2126 * LIN[d[i * 4]] + 0.7152 * LIN[d[i * 4 + 1]] + 0.0722 * LIN[d[i * 4 + 2]];
  l.sort(); const n = Math.max(1, Math.floor(l.length / 10)); let lo = 0, hi = 0; for (let i = 0; i < n; i++) { lo += l[i]; hi += l[l.length - 1 - i]; }
  return (hi / n + 0.05) / (lo / n + 0.05);
}
const SHAPES = [[216, 384], [240, 240]], CV = SHAPES.map((s) => Canvas.createCanvas(s[0], s[1])), THUMB = Canvas.createCanvas(108, 192);
const sample = (id) => ({ template: id, to: 'Josephine', from: 'Ada and the gang', title: 'A Carol for Josephine', greeting: 'With all our love', signoff: 'from Ada, Wren and Milo',
  lyrics: [{ section: 'verse', lines: ['The porch light is on and the kettle is too', 'We saved you the corner seat, like we do'] }, { section: 'hook', lines: ['Josephine, this one is yours'] }], scenes: [], timing: { duration: 30, bpm: 110, offset: 0.5 } });
function reads(t) { /* -> '' when it reads, or why not */
  Templates.add(t); const c = sample(t.id), pl = Engine.plan(c), so = pl.scenes[pl.scenes.length - 1], ln = pl.lines[1];
  const at = { title: Math.min(2.2, pl.scenes[0].t1 - 0.05), lyric: ln.t0 + (ln.t1 - ln.t0) * 0.6, greeting: so.t0 + 2.2 };
  let worst = 99;
  for (let si = 0; si < SHAPES.length; si++) {
    const W = SHAPES[si][0], H = SHAPES[si][1], ctx = CV[si].getContext('2d'), sf = Engine.layout(W, H, c).safe;
    for (const what of ['title', 'lyric', 'greeting']) {
      const env = { images: [], boxes: [], quality: 'full' }; ctx.clearRect(0, 0, W, H); Engine.draw(ctx, W, H, c, at[what], env);
      const texts = env.boxes.filter((b) => b.kind === 'text');
      for (const b of texts) if (!(b.x >= sf.x - 1 && b.x + b.w <= sf.x + sf.w + 1 && b.y >= sf.y - 1 && b.y + b.h <= sf.y + sf.h + 1)) return what + ' leaves the safe area';
      const b = texts.find((x) => x.what === what); if (!b) return 'no ' + what + ' drawn';
      const k = contrastIn(ctx, b, W, H); if (k < worst) worst = k;
      if (k < 3) return what + ' contrast ' + k.toFixed(2) + ' (' + W + 'x' + H + ')';
    }
  }
  return '';
}
function thumb(t) { /* a small picture of the stage in the middle of a sung line, as numbers */
  const c = sample(t.id), pl = Engine.plan(c), ly = pl.scenes.find((s) => s.kind === 'lyric'), ctx = THUMB.getContext('2d');
  ctx.clearRect(0, 0, 108, 192); Engine.draw(ctx, 108, 192, c, (ly.t0 + ly.t1) / 2, { images: [], quality: 'draft' });
  const d = ctx.getImageData(0, 0, 108, 192).data, out = new Float32Array(12 * 16 * 3);
  for (let y = 0; y < 192; y++) for (let x = 0; x < 108; x++) { const i = (y * 108 + x) * 4, j = (Math.floor(y / 12) * 12 + Math.floor(x / 9)) * 3; out[j] += d[i]; out[j + 1] += d[i + 1]; out[j + 2] += d[i + 2]; }
  for (let j = 0; j < out.length; j++) out[j] /= 108;
  return out;
}
const dist = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
const NEAR = 9;   // mean difference per channel (0..255) under which two templates of one occasion look the same

// ---------- the registry as it is ----------
const old = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { rows: [], archive: [] };
const rows = old.rows.slice(), ids = new Set(rows.map((r) => r.id).concat((old.archive || []).map((r) => r.id)));
const tripleUsed = new Set(rows.map((r) => r.set + '|' + troupeOf(r) + '|' + heroOf(r)));
function troupeOf(r) { return r.cast.filter((c) => c[0] === 'c').map((c) => c[1] + ((c[3] && c[3].variant) || 0)).join(','); }
function heroOf(r) { const h = r.cast.find((c) => c[0] === 'p' && c[2] === 'hero'); return h ? h[1] : ''; }
let seq = rows.reduce((m, r) => Math.max(m, r.n || 0), 0);

// ---------- one occasion ----------
const report = [];
function buildOccasion(O) {
  const where = 'occasion ' + O.id, mine = rows.filter((r) => r.occ === O.id);
  const settings = keep('setting', O.settings, where), troupes = keep('troupe', O.troupes, where);
  const hero = keep('prop', O.hero, where + ' hero'), floor = keep('prop', O.floor, where + ' floor'), sky = keep('prop', O.sky, where + ' sky');
  const particles = keep('particles', O.particles, where), borders = keep('border', O.borders, where), music = keep('music', O.music, where);
  const fams = O.families, wsum = fams.reduce((s, f) => s + (f.weight || 1), 0);
  const used = { pair: new Set(mine.map((r) => r.set + '|' + troupeOf(r))), set: new Map(), base: new Map(), troupe: new Map(), pal: new Map(), palSet: new Set(mine.map((r) => r.set + '|' + r.pal)), x: new Map(), names: new Set(mine.map((r) => r.name)) };
  mine.forEach((r) => { bump(used.set, r.set); bump(used.base, r.set.split(':')[0]); bump(used.troupe, troupeOf(r)); bump(used.pal, r.pal); });
  const thumbs = []; mine.forEach((r) => { const t = Lib.expand(r); Templates.add(t); thumbs.push(thumb(t)); });
  const nBase = Math.max(1, settings.length), nT = Math.max(1, troupes.length);
  const capBase = Math.ceil(O.target / nBase) + 2, capT = Math.ceil(O.target / nT) + 2;
  let made = 0, dropped = { reads: 0, near: 0 };
  for (const f of fams) {
    const quota = Math.round(O.target * (f.weight || 1) / wsum) - mine.filter((r) => r.fam === O.id + '-' + f.id).length;
    if (quota <= 0) continue;
    const st = STYLE[f.style], calm = O.calm || f.style === 'calm' && f.calm !== false;
    const fSettings = f.settings ? keep('setting', f.settings, where + ' ' + f.id) : settings;
    const fTroupes = f.troupes ? keep('troupe', f.troupes, where + ' ' + f.id) : troupes.filter((t) => inter(T[t].tones, f.tones));
    const fMusic = (f.music ? keep('music', f.music, where + ' ' + f.id) : music.filter((m) => inter(M[m].tones, f.tones))).filter((m) => !calm || M[m].tones.includes('restrained') || O.id === 'good-night' || O.id === 'new-baby' || O.id === 'christening');
    const muList = fMusic.length ? fMusic : music;
    const moods = f.moods || O.moods || [];
    // the candidates: place x light x cast, scored
    const cands = [];
    for (const sid of fSettings) for (const v of S[sid].variants) {
      const sv = v.v === 'one' || S[sid].variants.length === 1 && v.v === S[sid].variants[0].v && !Art.has('backdrop', sid + ':' + v.v) ? sid : sid + ':' + v.v;
      const casts = fTroupes.length ? fTroupes : [null];
      for (const tid of casts) {
        let sc = 0; const s = S[sid];
        if (tid) { const t = T[tid]; if (t.habitats.includes(sid)) sc += 3; else if (NEUTRAL.has(sid)) sc += 1.5; else if (inter(t.tags, s.tags)) sc += 1; else continue; sc += inter(t.tones, f.tones) ? 0.5 : 0; }
        sc += inter(s.tones, f.tones) ? 1 : 0; sc += jit(O.id + f.id + sv + tid) * 1.6;
        cands.push({ sid: sid, sv: sv, v: v, tid: tid, sc: sc });
      }
    }
    cands.sort((a, b) => b.sc - a.sc);
    let got = 0;
    for (let pass = 0; pass < 3 && got < quota; pass++) {
      const cb = capBase + pass * 2, ct = capT + pass * 2;
      for (const c of cands) {
        if (got >= quota) break;
        const tkey = c.tid ? T[c.tid].members.map((m) => m.name + m.variant).join(',') : '';
        if (used.pair.has(c.sv + '|' + tkey) && c.tid) continue;
        if ((used.base.get(c.sid) || 0) >= cb || (c.tid && (used.troupe.get(tkey) || 0) >= ct)) continue;
        if (!c.tid && (used.set.get(c.sv) || 0) >= 2 + pass) continue;
        const r = compose(O, f, st, calm, c, tkey, { hero, floor, sky, particles, borders, muList, moods, used });
        if (!r) continue;
        // gate 3: it reads (tried with the next looks and palettes)
        let why = '', t = null;
        for (let tries = 0; tries < 5; tries++) {
          if (tries) recolour(r, O, f, st, c, moods, used, tries);
          t = Lib.expand(r); why = reads(t); if (!why) break;
        }
        if (why) { dropped.reads++; if (!QUIET) console.log('  drop (does not read) ' + r.id + ': ' + why); continue; }
        // gate 4: it looks different from the occasion's others
        const th = thumb(t); let nearest = 1e9; for (const o of thumbs) nearest = Math.min(nearest, dist(th, o));
        if (nearest < NEAR) { dropped.near++; continue; }
        thumbs.push(th); rows.push(r); ids.add(r.id); tripleUsed.add(r.set + '|' + tkey + '|' + heroOf(r));
        used.pair.add(c.sv + '|' + tkey); bump(used.set, c.sv); bump(used.base, c.sid); if (c.tid) bump(used.troupe, tkey); bump(used.pal, r.pal); used.palSet.add(r.set + '|' + r.pal); used.names.add(r.name);
        got++; made++;
      }
    }
    if (got < quota) report.push(O.id + '-' + f.id + ': made ' + got + ' of ' + quota);
  }
  return { made: made, dropped: dropped, total: rows.filter((r) => r.occ === O.id).length };
}

// a candidate -> a full row (blocks named outright)
function compose(O, f, st, calm, c, tkey, k) {
  const s = S[c.sid], t = c.tid ? T[c.tid] : null, key = O.id + '|' + f.id + '|' + c.sv + '|' + (c.tid || '');
  // the hero prop: the least used in this occasion, never a place + cast + hero already in the library
  const heroes = k.hero.filter((p) => !tripleUsed.has(c.sv + '|' + tkey + '|' + p));
  if (!heroes.length) return null;
  const hp = least(heroes, k.used.x, key + 'hero'); bump(k.used.x, hp);
  const cast = [];
  if (t) t.members.forEach((m, i) => cast.push(['c', m.name, ['lead', 'side', 'extra'][i], m.variant ? { variant: m.variant } : undefined]));
  const pm = PM[hp], hopt = {}; if (pm && pm.size) hopt.size = pm.size; if (pm && pm.float) hopt.float = true; cast.push(['p', hp, 'hero', Object.keys(hopt).length ? hopt : undefined]);
  const floors = k.floor.filter((p) => p !== hp), nf = t && t.members.length >= 3 ? 1 : 2;
  for (let i = 0; i < nf && floors.length; i++) { const fp = least(floors.filter((p) => !cast.some((x) => x[1] === p)), k.used.x, key + 'floor' + i); if (!fp) break; bump(k.used.x, fp); cast.push(['p', fp, 'floor']); }
  if ((s.sky || NEUTRAL.has(s.id)) && k.sky.length && jit(key + 'sky') < 0.75) { const sp = least(k.sky.filter((p) => !cast.some((x) => x[1] === p)), k.used.x, key + 'sky'); if (sp) { bump(k.used.x, sp); cast.push(['p', sp, 'sky']); } }
  cast.forEach((x) => { if (x[3] === undefined) x.length = 3; });
  const r = { id: '', v: 1, n: 0, name: '', blurb: '', occ: O.id, fam: O.id + '-' + f.id, tone: f.id, aud: t ? t.audience.slice(0, 6) : ['anyone'], tags: [], pal: '', type: '', mu: '',
    look: {}, cast: cast, set: c.sv, pt: '', pa: 1, fr: [], vg: [] };
  // the music, the type, the palette and the looks
  r.mu = least(k.muList, k.used.x, key + 'music'); bump(k.used.x, r.mu); r.bpm = M[r.mu].bpm;
  const types = TYPE.filter((y) => calm ? y.tags.includes('restrained') : inter(y.tags, st.type)); r.type = least(types.map((y) => y.id), k.used.x, key + 'type'); bump(k.used.x, r.type);
  recolour(r, O, f, st, c, k.moods, k.used, 0);
  if (!r.pal) return null;
  if (calm) r.look.calm = true;
  if (s.stage === 'cast-low') r.look.stage = 'cast-low';
  r.look.transition = least(st.trans, k.used.x, key + 'tr'); r.look.frameIn = least(st.fin, k.used.x, key + 'fi'); bump(k.used.x, r.look.transition);
  let frames = st.frames.slice(); if (XMASY.includes(O.id)) frames = frames.concat(XMAS_FRAMES); if (O.id === 'pets') frames.push('bowl');
  if (!MEDALS.includes(O.id)) frames = frames.filter((x) => x !== 'medal'); else if (!frames.includes('medal')) frames.push('medal');
  const f1 = least(frames, k.used.x, key + 'f1'); bump(k.used.x, f1); const f2 = least(frames.filter((x) => x !== f1), k.used.x, key + 'f2'); bump(k.used.x, f2); r.fr = [f1, f2];
  r.vg = uniq([hp].concat(cast.filter((x) => x[0] === 'p' && x[1] !== hp).map((x) => x[1]).slice(0, 2), t ? ['c:' + t.members[0].name] : [])).slice(0, 4);
  // particles that suit the palette's light (a quiet set for a calm card)
  const pal = P[r.pal], pts = k.particles.filter((n) => ptModes(n).includes(pal.mode) && (!calm || QUIET_PT.includes(n)));
  r.pt = pts.length ? least(pts, k.used.x, key + 'pt') : ''; if (r.pt) bump(k.used.x, r.pt);
  r.pa = calm ? 0.5 : [0.6, 0.8, 1][h32(key + 'pa') % 3];
  if (jit(key + 'two') < 0.35 && !calm) r.two = true;
  r.tab = jit(key + 'tab') < 0.5 ? 'row' : 'hero'; if (r.tab === 'hero') delete r.tab;
  // name and words
  const vlabel = c.v.label ? ' ' + c.v.label : '';
  const tries = t ? [t.name + ' ' + s.place + vlabel, t.name + ' ' + s.place, t.one + ' ' + s.place + vlabel, t.name + ': ' + s.bare + vlabel, t.one + ', ' + s.bare + vlabel]
    : [shortName(hp) + ' ' + s.place + vlabel, shortName(hp) + ' ' + s.place, s.bare + vlabel + ': ' + shortName(hp), s.bare + vlabel];
  r.name = tries.find((n) => n.length <= 44 && !k.used.names.has(n)) || '';
  if (!r.name) { const base = (tries.find((n) => n.length <= 40) || s.bare); for (let i = 2; i < 30 && !r.name; i++) if (!k.used.names.has(base + ' ' + roman(i))) r.name = base + ' ' + roman(i); }
  r.id = slug(O.id + '-' + r.name).slice(0, 56).replace(/-$/, '');
  for (let i = 2; ids.has(r.id); i++) r.id = slug(O.id + '-' + r.name).slice(0, 52).replace(/-$/, '') + '-' + i;
  const place = s.place.charAt(0).toLowerCase() + s.place.slice(1) + (c.v.label ? ' ' + c.v.label.charAt(0).toLowerCase() + c.v.label.slice(1) : '');
  r.blurb = t ? cap(t.blurb) + ', ' + place + ', with ' + propWords(hp, true) + '.' : cap(s.blurb) + ', with ' + propWords(hp, true) + '.';
  if (r.blurb.length > 200) r.blurb = t ? cap(t.blurb) + ', ' + place + '.' : cap(s.blurb) + '.';
  r.tags = uniq([].concat(O.words, [f.name.toLowerCase()], s.tags, t ? t.tags : [], pm ? pm.tags : [hp]).map((w) => String(w).toLowerCase().replace(/-/g, ' '))).slice(0, 28);
  seq++; r.n = seq;
  return r;
}
function recolour(r, O, f, st, c, moods, used, tries) { /* the palette and the text looks; a later try moves to the next ones along */
  const key = r.occ + '|' + r.fam + '|' + c.sv + '|' + (c.tid || '') + '|' + tries;
  let pals = PAL.filter((p) => c.v.mode.includes(p.mode) && inter(p.moods, moods));
  if (pals.length < 3 && !STRICT.includes(O.id)) pals = pals.concat(PAL.filter((p) => c.v.mode.includes(p.mode) && !pals.includes(p)));
  if (O.calm || f.style === 'calm') pals = pals.filter((p) => !inter(p.moods, ['neon', 'candy', 'bright', 'spooky']));
  pals = pals.filter((p) => !used.palSet.has(r.set + '|' + p.id));
  if (tries) pals = pals.filter((p) => p.id !== r.pal);
  if (!pals.length) { r.pal = ''; return; }
  r.pal = least(pals.map((p) => p.id), used.pal, key + 'pal');
  r.look.title = least(st.titles, used.x, key + 'ti'); bump(used.x, r.look.title);
  r.look.karaoke = least(st.bands, used.x, key + 'ka'); bump(used.x, r.look.karaoke);
  r.look.signoff = least(st.signs, used.x, key + 'so'); bump(used.x, r.look.signoff);
  const bs = uniq(st.borders.concat(keep('border', O.borders, '')));
  r.look.border = least(bs, used.x, key + 'bo'); bump(used.x, r.look.border);
}
function propWords(n, article) {
  const m = PM[n]; if (m && m.label) return article ? m.label : m.label.replace(/^(a|an|the|two|three) /, '');
  const w = { tree: 'a Christmas tree', present: 'a present', snowglobe: 'a snow globe', fireplace: 'a crackling fireplace', sleigh: 'a sleigh', wreath: 'a wreath', candle: 'a candle', stocking: 'a stocking', truck: 'a little red truck', mug: 'a hot mug', cookie: 'cookies', candycane: 'a candy cane', ornament: 'a bauble', bell: 'a bell', holly: 'holly', star: 'a star', moon: 'the moon', mistletoe: 'mistletoe', cloud: 'a cloud', cake: 'a birthday cake', balloons: 'balloons', partyhat: 'a party hat', cupcake: 'a cupcake', bouquet: 'a bouquet', trophy: 'a trophy', firework: 'fireworks', bunting: 'bunting', rainbow: 'a rainbow', sun: 'the sun', gradcap: 'a graduation cap', loveletter: 'a love letter', heart: 'a heart', envelope: 'a letter', globe: 'a globe', airplane: 'a little plane', microphone: 'a microphone', discoball: 'a disco ball', radio: 'a radio', laptop: 'a laptop', watercooler: 'the water cooler', pawprint: 'paw prints', bone: 'a bone', yarn: 'a ball of wool', pine: 'a pine', snowpile: 'a snow pile', crib: 'a crib', rattle: 'a rattle', lantern: 'a lantern', mailbox: 'a mailbox', house: 'a house', church: 'a little church', manger: 'a manger', cassette: 'a cassette' }[n] || 'a ' + n;
  return article ? w : w.replace(/^(a|an|the) /, '');
}
function shortName(n) { /* "a white dove with an olive sprig" -> "White Dove" */
  const w = propWords(n).split(/ with | on | in | of |, | and /)[0].split(' ').slice(0, 3).join(' ');
  return w.replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}
function roman(i) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][i] || String(i); }

// ---------- run ----------
const t0 = Date.now(); let added = 0;
for (const O of OCC) {
  if (ONLY && O.id !== ONLY) continue;
  const r = buildOccasion(O); added += r.made;
  if (!QUIET) console.log(O.id.padEnd(20) + ' +' + String(r.made).padStart(4) + '  total ' + String(r.total).padStart(4) + ' / ' + O.target + (r.dropped.reads || r.dropped.near ? '   (dropped: ' + r.dropped.reads + ' did not read, ' + r.dropped.near + ' too close)' : ''));
}
if (problems.length) { console.log('\nRECIPE PROBLEMS (left out):\n  ' + uniq(problems).join('\n  ')); }
if (report.length && !QUIET) console.log('\nshort of quota:\n  ' + report.join('\n  '));
console.log('\n' + rows.length + ' templates in ' + uniq(rows.map((r) => r.occ)).length + ' occasions (' + added + ' added) in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
if (!DRY && added) {
  const version = crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 10);
  const text = '{"version":"' + version + '",\n"rows":[\n' + rows.map((r) => JSON.stringify(r)).join(',\n') + '\n],\n"archive":[' + (old.archive || []).map((r) => '\n' + JSON.stringify(r)).join(',') + ']}\n';
  fs.writeFileSync(FILE, text); console.log('wrote ' + path.relative(root, FILE) + ' (version ' + version + ')');
}
if (problems.length && args.includes('--strict')) process.exit(1);
