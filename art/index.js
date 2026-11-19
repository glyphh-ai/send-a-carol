'use strict';
// art/index.js : loads every pack of library blocks (art/pack-*.js) into CarolArt, in name order. A pack only ever ADDS
// blocks (CarolArt.add refuses a name that is taken), so the launch art in art.js draws what it always drew.
// A page loads only the packs a template needs: `of` maps each block to its pack ('backdrop:lounge' -> 'pack-backdrops-home'),
// and packsFor(template) lists them in load order. The server serves each pack at /art/<pack>.js.
const fs = require('fs'), path = require('path');
const Art = require('../art.js');
const LISTS = { character: 'characters', prop: 'props', frame: 'frames', backdrop: 'backdrops', particles: 'particleNames', border: 'borders' };
const files = fs.readdirSync(__dirname).filter(function (f) { return /^pack-[a-z0-9-]+\.js$/.test(f); }).sort();
const of = {};
files.forEach(function (f) {
  const before = {}; Object.keys(LISTS).forEach(function (k) { before[k] = new Set(Art[LISTS[k]]); });
  require(path.join(__dirname, f));
  Object.keys(LISTS).forEach(function (k) { Art[LISTS[k]].forEach(function (n) { if (!before[k].has(n)) of[k + ':' + n.split(':')[0]] = f.replace(/\.js$/, ''); }); });
});
const names = files.map(function (f) { return f.replace(/\.js$/, ''); });
function packsFor(t) {
  const need = new Set(), add = function (k, n) { if (n && of[k + ':' + String(n).split(':')[0]]) need.add(of[k + ':' + String(n).split(':')[0]]); };
  add('backdrop', t.backdrop); add('particles', t.particles); add('border', t.look && t.look.border);
  (t.cast || []).forEach(function (c) { add(c.kind, c.name); });
  (t.frames || []).forEach(function (n) { add('frame', n); });
  (t.vignettes || []).forEach(function (v) { if (v.indexOf('c:') === 0) add('character', v.slice(2)); else add('prop', v); });
  return names.filter(function (n) { return need.has(n); });
}
module.exports = { files: files, names: names, dir: __dirname, of: of, packsFor: packsFor };
