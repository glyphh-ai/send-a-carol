'use strict';
// spike/premium/dsp.cjs : the plain arithmetic the spike's audio scripts share. No library, no trained anything.
//   f0(x, rate)                  the fundamental of every 10 ms frame, by autocorrelation (0 = no voice)
//   retune(x, rate, fx, target)  x sung on target's notes: pitch-synchronous overlap-add (grains two periods long,
//                                re-spaced), each singer kept in their own octave; length unchanged
//   envelope(x, rate, hop)       RMS every hop seconds

// the lag whose normalised autocorrelation is highest (70..800 Hz, 40 ms window); a frame is voiced when it is loud
// enough (30 dB under the loudest frame) and matches itself well (0.55). A shorter lag that scores within 12% of the
// best wins, so the octave below is not taken for the note. The peak is refined by a parabola.
function f0(x, rate) {
  const hop = Math.round(rate * 0.01), win = Math.round(rate * 0.04), lo = Math.floor(rate / 800), hi = Math.ceil(rate / 70), n = Math.max(0, Math.floor((x.length - win - hi) / hop)), out = new Float64Array(n), en = new Float64Array(n), sc = new Float64Array(hi + 2);
  let top = 0;
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < win; j++) { const v = x[i * hop + j]; s += v * v; } en[i] = s / win; if (en[i] > top) top = en[i]; }
  for (let i = 0; i < n; i++) {
    if (en[i] < top * 0.001) continue;
    const o = i * hop; let e0 = 0, best = 0, bs = 0; for (let j = 0; j < win; j++) e0 += x[o + j] * x[o + j];
    for (let lag = lo; lag <= hi; lag++) { let ab = 0, e1 = 0; for (let j = 0; j < win; j++) { const v = x[o + j + lag]; ab += x[o + j] * v; e1 += v * v; } sc[lag] = ab / Math.sqrt(e0 * e1 || 1); if (sc[lag] > bs) { bs = sc[lag]; best = lag; } }
    if (bs < 0.55) continue;
    for (let lag = lo + 1; lag < best; lag++) if (sc[lag] > bs * 0.88 && sc[lag] >= sc[lag - 1] && sc[lag] >= sc[lag + 1]) { best = lag; break; }
    let per = best; if (best > lo && best < hi) { const y0 = sc[best - 1], y1 = sc[best], y2 = sc[best + 1], den = y0 - 2 * y1 + y2; if (den < 0) per = best + 0.5 * (y0 - y2) / den; }
    out[i] = rate / per;
  }
  return out;
}
function envelope(x, rate, hop) { const h = Math.round(rate * hop), n = Math.floor(x.length / h), e = new Float64Array(n); for (let i = 0; i < n; i++) { let s = 0; for (let j = i * h; j < i * h + h; j++) s += x[j] * x[j]; e[i] = Math.sqrt(s / h); } return e; }
const medianOf = function (a) { const s = Array.from(a).sort(function (x, y) { return x - y; }); return s.length ? s[Math.floor(s.length / 2)] : 0; };

// THE RATIO, per 10 ms frame: how far the singer's note is from the tune's note, with whole octaves taken out (so a
// low voice sings the tune an octave or two down and nobody is pushed more than half an octave). `shift` (frames) is
// where the tune is relative to the singer. Held through unvoiced frames, medianed over 70 ms, eased over 30 ms.
// Two ways to choose the octave (`mode`):
//   'nearest' (the default): every frame goes to the nearest octave of the tune's note. Small moves (at most half an
//             octave), so the least processing; but a tune that climbs out of the singer's range drops an octave mid-line.
//   'whole'   one octave for the whole song per singer (the one that needs the smallest moves overall), and the tune
//             itself first cleaned of octave slips (each frame within half an octave of its own 1.5 s median). The
//             melody keeps its shape; high notes are moved further (up to an octave), which the ear may hear as strain.
function ratios(fx, target, shift, mode) {
  const n = fx.length, raw = new Float64Array(n), r = new Float64Array(n), whole = mode === 'whole'; let last = 1, k = 0;
  const tg = new Float64Array(n); for (let i = 0; i < n; i++) { const j = i - (shift || 0); tg[i] = j >= 0 && j < target.length ? target[j] : 0; }
  if (whole) {
    const clean = new Float64Array(n);
    for (let i = 0; i < n; i++) { if (!(tg[i] > 0)) continue; const near = Array.from(tg.subarray(Math.max(0, i - 75), Math.min(n, i + 76))).filter(function (v) { return v > 0; }), m = medianOf(near); let c = Math.log2(tg[i] / m); c -= Math.round(c); clean[i] = m * Math.pow(2, c); }
    tg.set(clean);
    const all = []; for (let i = 0; i < n; i++) if (fx[i] > 0 && tg[i] > 0) all.push(Math.log2(tg[i] / fx[i]));
    k = Math.round(medianOf(all));
  }
  for (let i = 0; i < n; i++) { const a = fx[i], b = tg[i]; if (a > 0 && b > 0) { let c = Math.log2(b / a); c -= whole ? k : Math.round(c); last = Math.pow(2, c); } raw[i] = last; }
  let s = 1; const lo = whole ? 0.5 : 0.7, hi = whole ? 2 : 1.42;
  for (let i = 0; i < n; i++) { const m = medianOf(raw.subarray(Math.max(0, i - 3), Math.min(n, i + 4))); s += (m - s) * 0.3; r[i] = Math.max(lo, Math.min(hi, s)); }
  return r;
}
// PITCH-SYNCHRONOUS OVERLAP-ADD. Analysis marks one period apart (each moved to the strongest sample near where the
// period says it should be, so grains line up with the voice's own pulses); synthesis marks one NEW period apart;
// every synthesis mark takes the grain (two periods under a Hann window) of the nearest analysis mark. The voice's
// colour (its formants) stays where it was: only the spacing of its pulses changes. Unvoiced stretches pass as they are.
function retune(x, rate, fx, target, shift, mode) {
  const n = x.length, hopS = 0.01, r = ratios(fx, target, shift, mode), at = function (t) { return Math.max(0, Math.min(fx.length - 1, Math.round(t / rate / hopS))); };
  const period = function (t) { const f = fx[at(t)]; return f > 0 ? rate / f : rate * 0.005; };
  const marks = []; let t = 0;
  while (t < n) { const p = period(t); let m = Math.round(t + p); if (fx[at(m)] > 0) { const w = Math.round(p / 4); let best = m, bv = -1; for (let k = Math.max(0, m - w); k <= Math.min(n - 1, m + w); k++) if (x[k] > bv) { bv = x[k]; best = k; } m = best; } if (m <= t) m = Math.round(t + p); marks.push(m); t = m; }
  const out = new Float32Array(n), wsum = new Float32Array(n); let ts = 0, k = 0;
  while (ts < n) {
    while (k + 1 < marks.length && Math.abs(marks[k + 1] - ts) <= Math.abs(marks[k] - ts)) k++;
    const m = marks[k], p = Math.round(period(m)), voiced = fx[at(m)] > 0;
    for (let j = -p; j <= p; j++) { const src = m + j, dst = Math.round(ts) + j; if (src < 0 || src >= n || dst < 0 || dst >= n) continue; const w = 0.5 + 0.5 * Math.cos(Math.PI * j / p); out[dst] += x[src] * w; wsum[dst] += w; }
    ts += voiced ? period(ts) / r[at(ts)] : period(ts);
  }
  for (let i = 0; i < n; i++) out[i] = wsum[i] > 0.3 ? out[i] / wsum[i] : out[i];
  return { samples: out, ratios: r };
}
module.exports = { f0: f0, envelope: envelope, ratios: ratios, retune: retune, medianOf: medianOf };
