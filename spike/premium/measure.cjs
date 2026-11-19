'use strict';
// spike/premium/measure.cjs : does a converted vocal still sing the same song? Measured, by plain arithmetic only
// (no library, no trained anything), against the original vocal stem:
//   duration   file lengths, and the lag at which the two loudness envelopes match best (1 ms steps, +-300 ms)
//   pitch      the fundamental of every 10 ms frame by autocorrelation (70..800 Hz, 40 ms window at 16 kHz), then for
//              frames voiced in BOTH: the median difference in cents, the share within 50 cents, the share that is
//              the same note an octave away, and how alike the two envelopes are (correlation)
//   loudness   ffmpeg's EBU R128 meter (LUFS, true peak) and beat.js levels (peak, RMS)
//   words      onsets (the product's own onset strength, beat.js steps 1 and 2, then its peaks): how many of the
//              original's onsets have an onset in the converted stem within 50 ms, and the median offset; plus what
//              beat.js itself finds in each (tempo, first beat)
//   node spike/premium/measure.cjs <original vocal> <converted> [<converted> ...]   -> a table, and OUT/measure.json
const L = require('./lib.cjs'), fs = require('fs'), path = require('path'), beat = require('../../beat.js');

const median = function (a) { if (!a.length) return NaN; const s = Array.from(a).sort(function (x, y) { return x - y; }); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const r1 = function (v, n) { const k = Math.pow(10, n === undefined ? 1 : n); return Math.round(v * k) / k; };

// RMS every `hop` seconds
function envelope(x, rate, hop) { const h = Math.round(rate * hop), n = Math.floor(x.length / h), e = new Float64Array(n); for (let i = 0; i < n; i++) { let s = 0; for (let j = i * h; j < i * h + h; j++) s += x[j] * x[j]; e[i] = Math.sqrt(s / h); } return e; }
function corr(a, b, lag) { let sa = 0, sb = 0, n = 0; for (let i = Math.max(0, -lag); i < a.length && i + lag < b.length; i++) { sa += a[i]; sb += b[i + lag]; n++; } const ma = sa / n, mb = sb / n; let ab = 0, aa = 0, bb = 0; for (let i = Math.max(0, -lag); i < a.length && i + lag < b.length; i++) { const u = a[i] - ma, v = b[i + lag] - mb; ab += u * v; aa += u * u; bb += v * v; } return ab / Math.sqrt(aa * bb || 1); }
function bestLag(a, b, max) { let best = 0, bs = -2; for (let l = -max; l <= max; l++) { const c = corr(a, b, l); if (c > bs) { bs = c; best = l; } } return { lag: best, corr: bs }; }

// the fundamental per 10 ms frame: the lag whose normalised autocorrelation is highest; a frame is voiced when it is
// loud enough (30 dB under the loudest frame) and matches itself well (0.55); the peak is refined by a parabola.
// A shorter lag that scores within 12% of the best wins (so the octave below is not taken for the note).
function f0(x, rate) {
  const hop = Math.round(rate * 0.01), win = Math.round(rate * 0.04), lo = Math.floor(rate / 800), hi = Math.ceil(rate / 70), n = Math.floor((x.length - win - hi) / hop), out = new Float64Array(Math.max(0, n));
  let top = 0; const en = new Float64Array(Math.max(0, n));
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < win; j++) { const v = x[i * hop + j]; s += v * v; } en[i] = s / win; if (en[i] > top) top = en[i]; }
  const sc = new Float64Array(hi + 2);
  for (let i = 0; i < n; i++) {
    if (en[i] < top * 0.001) continue;
    const o = i * hop; let e0 = 0; for (let j = 0; j < win; j++) e0 += x[o + j] * x[o + j];
    let best = 0, bs = 0;
    for (let lag = lo; lag <= hi; lag++) { let ab = 0, e1 = 0; for (let j = 0; j < win; j++) { const v = x[o + j + lag]; ab += x[o + j] * v; e1 += v * v; } sc[lag] = ab / Math.sqrt(e0 * e1 || 1); if (sc[lag] > bs) { bs = sc[lag]; best = lag; } }
    if (bs < 0.55) continue;
    for (let lag = lo + 1; lag < best; lag++) if (sc[lag] > bs * 0.88 && sc[lag] >= sc[lag - 1] && sc[lag] >= sc[lag + 1]) { best = lag; break; }
    let per = best; if (best > lo && best < hi) { const y0 = sc[best - 1], y1 = sc[best], y2 = sc[best + 1], den = y0 - 2 * y1 + y2; if (den < 0) per = best + 0.5 * (y0 - y2) / den; }
    out[i] = rate / per;
  }
  return out;
}
// onsets: beat.js's own onset strength (its steps 1 and 2), then the peaks that stand above their neighbours
function onsets(samples, rate) {
  const hop = Math.max(1, Math.round(rate * 0.01)), n = Math.floor(samples.length / hop), low = new Float64Array(n), high = new Float64Array(n), a = Math.exp(-2 * Math.PI * 160 / rate);
  let lp = 0;
  for (let i = 0; i < n; i++) { let el = 0, eh = 0; for (let j = i * hop, e = j + hop; j < e; j++) { const x = samples[j]; lp = a * lp + (1 - a) * x; const h = x - lp; el += lp * lp; eh += h * h; } low[i] = Math.log(1 + 2000 * el / hop); high[i] = Math.log(1 + 2000 * eh / hop); }
  const on = new Float64Array(n); for (let i = 1; i < n; i++) on[i] = Math.max(0, low[i] - low[i - 1]) * 1.4 + Math.max(0, high[i] - high[i - 1]);
  const win = 50, o = new Float64Array(n); let sum = 0, top = 0;
  for (let i = 0; i < n; i++) { sum += on[i]; if (i >= win) sum -= on[i - win]; o[i] = Math.max(0, on[i] - sum / Math.min(i + 1, win)); if (o[i] > top) top = o[i]; }
  const out = []; let last = -99;
  for (let i = 2; i < n - 2; i++) if (o[i] > top * 0.18 && o[i] >= o[i - 1] && o[i] >= o[i + 1] && o[i] >= o[i - 2] && o[i] >= o[i + 2] && i - last >= 8) { out.push(i * hop / rate); last = i; }
  return out;
}
function matchOnsets(a, b, tol) { const offs = []; let j = 0; a.forEach(function (t) { while (j < b.length - 1 && Math.abs(b[j + 1] - t) <= Math.abs(b[j] - t)) j++; const d = b.length ? b[j] - t : 99; if (Math.abs(d) <= tol) offs.push(d * 1000); }); return { matched: offs.length, of: a.length, pct: r1(100 * offs.length / Math.max(1, a.length)), medianMs: r1(median(offs)), medianAbsMs: r1(median(offs.map(Math.abs))) }; }

function describe(file) {
  // MEASURE_FROM / MEASURE_TO (seconds): only that stretch of every file (a verse alone, a chorus alone)
  const cutS = +process.env.MEASURE_FROM || 0, cutE = +process.env.MEASURE_TO || 0, cut = function (x, rate) { return cutE > cutS ? x.subarray(Math.round(cutS * rate), Math.round(cutE * rate)) : x; };
  const x16 = cut(L.pcm(file, 16000), 16000), x11 = cut(L.pcm(file, 11025), 11025);
  return { file: file, seconds: L.seconds(file), env: envelope(x16, 16000, 0.001), env10: envelope(x16, 16000, 0.01), f0: f0(x16, 16000), onsets: onsets(x11, 11025), beat: beat.analyse(x11, 11025, 96), loud: L.loudness(file), levels: beat.levels(x16) };
}
(function () {
  const files = process.argv.slice(2); if (files.length < 2) throw new Error('needs the original vocal and at least one converted stem');
  const A = describe(files[0]), voicedA = Array.from(A.f0).filter(function (v) { return v > 0; }), rows = [];
  const base = { name: 'ORIGINAL ' + path.basename(files[0]), seconds: r1(A.seconds, 3), medianHz: r1(median(voicedA)), voicedFrames: voicedA.length, lufs: A.loud.lufs, truePeak: A.loud.peak, rmsDb: A.levels.rms, onsets: A.onsets.length, beatBpm: A.beat.bpm, firstBeat: A.beat.offset };
  console.log(JSON.stringify(base));
  files.slice(1).forEach(function (f) {
    const B = describe(f), lag = bestLag(A.env, B.env, 300), lagFrames = Math.round(lag.lag / 10), cents = [];
    let both = 0, in50 = 0, in100 = 0, octave = 0, onlyA = 0, onlyB = 0;
    for (let i = 0; i < A.f0.length; i++) { const j = i + lagFrames, a = A.f0[i], b = j >= 0 && j < B.f0.length ? B.f0[j] : 0; if (a > 0 && b > 0) { const c = 1200 * Math.log2(b / a); cents.push(c); both++; if (Math.abs(c) <= 50) in50++; if (Math.abs(c) <= 100) in100++; const folded = Math.abs(c - 1200 * Math.round(c / 1200)); if (Math.abs(c) > 600 && folded <= 50) octave++; } else if (a > 0) onlyA++; else if (b > 0) onlyB++; }
    const voicedB = Array.from(B.f0).filter(function (v) { return v > 0; }), on = matchOnsets(A.onsets, B.onsets, 0.05), back = matchOnsets(B.onsets, A.onsets, 0.05);
    // is it the same TUNE in another key, or no tune? The spread of the difference (10th to 90th percentile), each
    // contour's own range in cents about its median, how alike the two contours are (correlation of log pitch), and
    // the share within 50 cents once the median difference (a transposition) is taken out
    const sorted = cents.slice().sort(function (x, y) { return x - y; }), pc = function (q) { return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : NaN; }, med = median(cents);
    const la = [], lb = []; for (let i = 0; i < A.f0.length; i++) { const j = i + lagFrames; if (A.f0[i] > 0 && j >= 0 && j < B.f0.length && B.f0[j] > 0) { la.push(1200 * Math.log2(A.f0[i])); lb.push(1200 * Math.log2(B.f0[j])); } }
    const spread = function (v) { const s = v.slice().sort(function (x, y) { return x - y; }); return s.length ? s[Math.floor(0.9 * s.length)] - s[Math.floor(0.1 * s.length)] : NaN; };
    const contourCorr = corr(Float64Array.from(la), Float64Array.from(lb), 0), in50t = cents.filter(function (c) { return Math.abs(c - med) <= 50; }).length;
    const foldedAbs = cents.map(function (c) { return Math.abs(c - 1200 * Math.round(c / 1200)); });
    const anyOctave = { medianAbsCents: r1(median(foldedAbs)), pctWithin50c: r1(100 * foldedAbs.filter(function (c) { return c <= 50; }).length / Math.max(1, both)), pctWithin100c: r1(100 * foldedAbs.filter(function (c) { return c <= 100; }).length / Math.max(1, both)) };
    const tune = { sameNoteInAnyOctave: anyOctave, diffP10: r1(pc(0.1)), diffP90: r1(pc(0.9)), rangeOriginalCents: r1(spread(la)), rangeConvertedCents: r1(spread(lb)), contourCorr: r1(contourCorr, 3), pctWithin50cAfterTransposing: r1(100 * in50t / Math.max(1, both)) };
    const row = { name: path.basename(f, '.mp3'), tune: tune, seconds: r1(B.seconds, 3), driftMs: r1((B.seconds - A.seconds) * 1000), envelopeLagMs: lag.lag, envelopeCorr: r1(lag.corr, 3), medianHz: r1(median(voicedB)), framesVoicedInBoth: both, medianCents: r1(median(cents)), medianAbsCents: r1(median(cents.map(Math.abs))), pctWithin50c: r1(100 * in50 / Math.max(1, both)), pctWithin100c: r1(100 * in100 / Math.max(1, both)), pctSameNoteAnOctaveAway: r1(100 * octave / Math.max(1, both)), voicedOnlyInOriginal: onlyA, voicedOnlyInConverted: onlyB, lufs: B.loud.lufs, truePeak: B.loud.peak, rmsDb: B.levels.rms, onsets: B.onsets.length, onsetsOfOriginalFoundPct: on.pct, onsetMedianOffsetMs: on.medianMs, onsetMedianAbsMs: on.medianAbsMs, onsetsOfConvertedInOriginalPct: back.pct, beatBpm: B.beat.bpm, firstBeat: B.beat.offset };
    rows.push(row); console.log(JSON.stringify(row));
  });
  fs.writeFileSync(path.join(L.OUT, process.env.MEASURE_NAME || 'measure.json'), JSON.stringify({ original: base, converted: rows, how: 'see spike/premium/measure.cjs' }, null, 1));
})();
