'use strict';
// library/index.js : THE TEMPLATE LIBRARY at run time (server only; a page is handed definitions by the API).
// library/registry.json is the list: one small row per template, written by tools/library-build.cjs from the recipes
// and kept in git. A row names its blocks outright (palette, type pairing, backdrop, cast, frames, ...), so an id
// draws the same thing for ever whatever the recipes later become; a redesign of a template is a new row with a
// higher `v`, and the old row moves to `archive` so cards made with it still draw as they were (get(id, v)).
// Nothing is expanded at start: the file is read at first use and a row becomes a full template when it is asked for.
const fs = require('fs'), path = require('path');
const Templates = require('../templates.js');
const FILE = path.join(__dirname, 'registry.json');
const opt = function (f) { try { return require(f); } catch (e) { if (e.code === 'MODULE_NOT_FOUND' && String(e.message).indexOf(f.replace('./', '')) >= 0) return []; throw e; } };

let REG = null;
const byIdOf = function (list, key) { const o = {}; list.forEach(function (x) { o[key ? key(x) : x.id] = x; }); return o; };
function load() {
  if (REG) return REG;
  const raw = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { version: 'none', rows: [], archive: [] };
  const occasions = opt('./occasions.js');
  REG = { version: raw.version || 'none', rows: raw.rows || [], archive: raw.archive || [], byId: byIdOf(raw.rows || []), old: byIdOf(raw.archive || [], function (r) { return r.id + '@' + r.v; }),
    pal: byIdOf(opt('./palettes.js')), type: byIdOf(opt('./type.js')), music: byIdOf(opt('./music.js')), occasions: occasions, fam: {}, made: new Map() };
  occasions.forEach(function (o) { (o.families || []).forEach(function (f) { REG.fam[o.id + '-' + f.id] = Object.assign({}, f, { id: o.id + '-' + f.id, occasion: o.id }); }); });
  return REG;
}
const NEG = ['heavy metal', 'screaming', 'harsh distortion', 'explicit lyrics', 'spoken word intro', 'long instrumental intro'];
const S5 = ['title', 'photo', 'lyric', 'photo', 'signoff'], S6 = ['title', 'photo', 'lyric', 'photo', 'lyric', 'signoff'];
// a row -> the template the engine draws (the same shape as a launch template in templates.js)
function expand(r) {
  const G = load(), pal = G.pal[r.pal], ty = G.type[r.type], mu = G.music[r.mu], fam = G.fam[r.fam] || {};
  if (!pal || !ty || !mu) throw new Error('library: ' + r.id + ' names a ' + (!pal ? 'palette ' + r.pal : !ty ? 'type pairing ' + r.type : 'music direction ' + r.mu) + ' that is gone');
  const fonts = { title: ty.title, body: ty.body, lyric: ty.lyric, caption: ty.caption }; if (ty.titleScale) fonts.titleScale = ty.titleScale; if (ty.lyricScale) fonts.lyricScale = ty.lyricScale;
  const look = Object.assign({ pal: { bg: pal.bg, bg2: pal.bg2, ink: pal.ink, accent: pal.accent, accent2: pal.accent2, gold: pal.gold, snow: pal.snow, paper: pal.paper }, fonts: fonts }, r.look);
  const cast = r.cast.map(function (c) { return Object.assign({ kind: c[0] === 'c' ? 'character' : 'prop', name: c[1], role: c[2] }, c[3] || {}); });
  let first = true;
  const scenes = (r.two ? S6 : S5).map(function (k) { const s = { kind: k }; if (k === 'title' || k === 'signoff') s.layout = 'top'; if (k === 'photo') s.layout = first ? 'hero' : 'collage'; if (k === 'lyric') { s.tableau = first ? (r.tab || 'hero') : 'row'; } if (k === 'photo' || k === 'lyric') first = k === 'photo' ? first : false; return s; });
  return withPacks({ id: r.id, v: r.v || 1, lib: true, name: r.name, blurb: r.blurb, occasion: r.occ, family: r.fam, tone: fam.toneText || mu.notes, toneId: r.tone, audience: r.aud || [], tags: r.tags || [], order: 1000 + (r.n || 0),
    look: look, cast: cast, backdrop: r.set, particles: r.pt || '', particleAmount: r.pa == null ? 1 : r.pa, frames: r.fr, vignettes: r.vg, scenes: scenes, lyricFx: r.fx === undefined ? 'notes' : r.fx,
    music: { styles: mu.styles.slice(), bpm: r.bpm || mu.bpm, voices: mu.voices, notes: mu.notes, negative: (mu.negative || []).concat(fam.negative || [], NEG) } });
}
// the art packs a page must load to draw a template (art/index.js knows which pack holds each block)
function withPacks(t) { t.packs = require('../art/index.js').packsFor(t); return t; }
// search: every word of q must be somewhere in the row's words (its name, blurb, tags, occasion and family names)
function hay(r) {
  const G = load(); if (!G.hay) G.hay = new Map();
  let s = G.hay.get(r.id); if (s !== undefined) return s;
  const fam = G.fam[r.fam] || {}, occ = (G.occasions.find(function (o) { return o.id === r.occ; }) || {});
  s = [r.id, r.name, r.blurb, r.occ, r.fam, occ.name || '', fam.name || '', (r.tags || []).join(' '), (r.aud || []).join(' ')].join(' ').toLowerCase();
  G.hay.set(r.id, s); return s;
}
function search(o) {   // { q, occasion, family, occasions: [ids allowed] } -> the matching rows, in library order
  const words = String(o.q || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), allow = o.occasions ? new Set(o.occasions) : null;
  return load().rows.filter(function (r) {
    if (allow && !allow.has(r.occ)) return false;
    if (o.occasion && r.occ !== o.occasion) return false;
    if (o.family && r.fam !== o.family) return false;
    if (!words.length) return true;
    const s = hay(r); return words.every(function (w) { return s.indexOf(w) >= 0; });
  });
}
const Lib = {
  get version() { return load().version; },
  count: function () { return load().rows.length; },
  rows: function () { return load().rows; },
  row: function (id) { return load().byId[id] || null; },
  occasions: function () { return load().occasions; },
  family: function (id) { return load().fam[id] || null; },
  // the families of an occasion that have templates: [{ id, name, occasion }]
  families: function (occ) { const G = load(), have = new Set(G.rows.map(function (r) { return r.fam; })); return G.occasions.filter(function (o) { return !occ || o.id === occ; }).reduce(function (a, o) { return a.concat((o.families || []).map(function (f) { return { id: o.id + '-' + f.id, name: f.name, occasion: o.id }; }).filter(function (f) { return have.has(f.id); })); }, []); },
  // the occasions that have templates
  made: function () { const G = load(), have = new Set(G.rows.map(function (r) { return r.occ; })); return G.occasions.filter(function (o) { return have.has(o.id); }).map(function (o) { return o.id; }); },
  search: search,
  expand: expand,
  // the template for an id (its current version, or the version a card was made with while that is kept); null when there is none
  get: function (id, v) {
    const G = load(), cur = G.byId[id]; if (!cur && !(v && G.old[id + '@' + v])) return null;
    const r = v && cur && (cur.v || 1) !== v && G.old[id + '@' + v] ? G.old[id + '@' + v] : cur || G.old[id + '@' + v], key = r.id + '@' + (r.v || 1);
    let t = G.made.get(key); if (t) return t;
    t = expand(r); G.made.set(key, t); if (G.made.size > 400) G.made.delete(G.made.keys().next().value);
    return t;
  },
  reload: function () { REG = null; }
};
Templates.resolve = Lib.get;
module.exports = Lib;
