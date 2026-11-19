'use strict';
// spike/premium/notes.cjs : which notes a vocal sings, as text, so two stems can be read side by side by someone who
// cannot hear them. Every 10 ms frame's fundamental (the same autocorrelation as measure.cjs, inlined), then the
// median note of every quarter second, printed as note names ('.' = no voice).
//   node spike/premium/notes.cjs <from seconds> <to seconds> <file> [<file> ...]
const L = require('./lib.cjs'), path = require('path');
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function f0(x, rate) {
  const hop = Math.round(rate * 0.01), win = Math.round(rate * 0.04), lo = Math.floor(rate / 800), hi = Math.ceil(rate / 70), n = Math.floor((x.length - win - hi) / hop), out = new Float64Array(Math.max(0, n)), en = new Float64Array(Math.max(0, n)), sc = new Float64Array(hi + 2);
  let top = 0;
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < win; j++) { const v = x[i * hop + j]; s += v * v; } en[i] = s / win; if (en[i] > top) top = en[i]; }
  for (let i = 0; i < n; i++) {
    if (en[i] < top * 0.001) continue;
    const o = i * hop; let e0 = 0, best = 0, bs = 0; for (let j = 0; j < win; j++) e0 += x[o + j] * x[o + j];
    for (let lag = lo; lag <= hi; lag++) { let ab = 0, e1 = 0; for (let j = 0; j < win; j++) { const v = x[o + j + lag]; ab += x[o + j] * v; e1 += v * v; } sc[lag] = ab / Math.sqrt(e0 * e1 || 1); if (sc[lag] > bs) { bs = sc[lag]; best = lag; } }
    if (bs < 0.55) continue;
    for (let lag = lo + 1; lag < best; lag++) if (sc[lag] > bs * 0.88 && sc[lag] >= sc[lag - 1] && sc[lag] >= sc[lag + 1]) { best = lag; break; }
    out[i] = rate / best;
  }
  return out;
}
const from = +process.argv[2], to = +process.argv[3];
process.argv.slice(4).forEach(function (file) {
  const x = L.pcm(file, 16000).subarray(Math.round(from * 16000), Math.round(to * 16000)), f = f0(x, 16000), cells = [];
  for (let i = 0; i + 25 <= f.length; i += 25) { const v = Array.from(f.subarray(i, i + 25)).filter(function (h) { return h > 0; }).sort(function (a, b) { return a - b; }); if (v.length < 8) { cells.push('.'); continue; } const m = Math.round(69 + 12 * Math.log2(v[Math.floor(v.length / 2)] / 440)); cells.push(NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1)); }
  console.log(path.basename(file, '.mp3').padEnd(22) + cells.map(function (c) { return c.padEnd(4); }).join(''));
});
