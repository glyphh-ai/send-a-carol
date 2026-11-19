'use strict';
// spike/classics/dsp.cjs : the plain arithmetic under the singing. No library, no trained anything.
//   f0(x, rate)                       the voice's fundamental every 10 ms, by autocorrelation (0 = no voice)
//   energy(x, rate)                   RMS every 5 ms (20 ms windows);  zcr(x, rate) zero crossings per sample, same frames
//   psola(x, rate, fx, segs, pitch)   SPEECH MADE TO SING: pitch-synchronous overlap-add. `segs` says which stretch of
//                                     the speech sounds when ({ o0, o1, s0, s1 } in seconds: output time o0..o1 plays
//                                     source time s0..s1, at any speed, forwards or backwards); `pitch(t)` is the note
//                                     in Hz at output time t. The voice's colour (its formants) stays; the spacing of
//                                     its pulses becomes the note.
//   flux(x, rate)                     how much the spectrum changes from one 23 ms frame to the next (0..2)
// (The pitch tracker and the overlap-add follow the earlier premium spike's dsp.cjs, on branch premium-spike.)
const HOP = 0.01;

// the lag whose normalised autocorrelation is highest (65..600 Hz, 40 ms window centred on the frame); voiced when
// loud enough (35 dB under the loudest frame) and self-similar (0.5). A shorter lag within 12% of the best wins, so
// the octave below is not taken for the note. Then: lone frames dropped, lone gaps filled, a 5-frame median.
function f0(x, rate) {
  const dec = Math.max(1, Math.floor(rate / 14000)), r = rate / dec, m = Math.floor(x.length / dec), d = new Float32Array(m);
  for (let i = 0; i < m; i++) { let s = 0; for (let j = 0; j < dec; j++) s += x[i * dec + j]; d[i] = s / dec; }
  const hop = r * HOP, win = Math.round(r * 0.04), lo = Math.floor(r / 600), hi = Math.ceil(r / 65), n = Math.floor(m / hop), raw = new Float64Array(n), en = new Float64Array(n), sc = new Float64Array(hi + 2);
  let top = 0;
  const base = function (i) { return Math.round(i * hop - win / 2); };
  for (let i = 0; i < n; i++) { const o = base(i); if (o < 0 || o + win + hi >= m) continue; let s = 0; for (let j = 0; j < win; j++) s += d[o + j] * d[o + j]; en[i] = s / win; if (en[i] > top) top = en[i]; }
  for (let i = 0; i < n; i++) {
    if (!(en[i] > top * 0.0003)) continue;
    const o = base(i); let e0 = 0, best = 0, bs = 0; for (let j = 0; j < win; j++) e0 += d[o + j] * d[o + j];
    for (let lag = lo; lag <= hi; lag++) { let ab = 0, e1 = 0; for (let j = 0; j < win; j++) { const v = d[o + j + lag]; ab += d[o + j] * v; e1 += v * v; } sc[lag] = ab / Math.sqrt(e0 * e1 || 1); if (sc[lag] > bs) { bs = sc[lag]; best = lag; } }
    if (bs < 0.5) continue;
    for (let lag = lo + 1; lag < best; lag++) if (sc[lag] > bs * 0.88 && sc[lag] >= sc[lag - 1] && sc[lag] >= sc[lag + 1]) { best = lag; break; }
    let per = best; if (best > lo && best < hi) { const y0 = sc[best - 1], y1 = sc[best], y2 = sc[best + 1], den = y0 - 2 * y1 + y2; if (den < 0) per = best + 0.5 * (y0 - y2) / den; }
    raw[i] = r / per;
  }
  for (let i = 1; i < n - 1; i++) { if (raw[i] > 0 && !(raw[i - 1] > 0) && !(raw[i + 1] > 0)) raw[i] = 0; }
  for (let i = 1; i < n - 1; i++) { if (!(raw[i] > 0) && raw[i - 1] > 0 && raw[i + 1] > 0) raw[i] = (raw[i - 1] + raw[i + 1]) / 2; }
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) { if (!(raw[i] > 0)) continue; const near = []; for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) if (raw[j] > 0) near.push(raw[j]); near.sort(function (a, b) { return a - b; }); out[i] = near[Math.floor(near.length / 2)]; }
  return out;
}
const EHOP = 0.005;
function energy(x, rate) { const h = rate * EHOP, w = Math.round(rate * 0.01), n = Math.floor(x.length / h), e = new Float64Array(n); for (let i = 0; i < n; i++) { const m = Math.round(i * h); let s = 0, c = 0; for (let j = Math.max(0, m - w); j < Math.min(x.length, m + w); j++) { s += x[j] * x[j]; c++; } e[i] = Math.sqrt(s / Math.max(1, c)); } return e; }
function zcr(x, rate) { const h = rate * EHOP, w = Math.round(rate * 0.01), n = Math.floor(x.length / h), z = new Float64Array(n); for (let i = 0; i < n; i++) { const m = Math.round(i * h); let s = 0, c = 0; for (let j = Math.max(1, m - w); j < Math.min(x.length, m + w); j++) { if ((x[j] >= 0) !== (x[j - 1] >= 0)) s++; c++; } z[i] = s / Math.max(1, c); } return z; }
const median = function (a) { const s = Array.from(a).sort(function (x, y) { return x - y; }); return s.length ? s[Math.floor(s.length / 2)] : 0; };

// PITCH MARKS on the speech: one a period where there is voice (each moved to the strongest sample near where the
// period says it should be, so grains line up with the voice's own pulses), one every 5 ms where there is none
function marksOf(x, rate, fx) {
  const n = x.length, at = function (t) { return Math.max(0, Math.min(fx.length - 1, Math.round(t / rate / HOP))); }, pos = [], per = [], vo = [];
  let t = 0;
  while (t < n) {
    const f = fx[at(t)], p = f > 0 ? rate / f : rate * 0.005; let m = Math.round(t + p);
    const v = fx[at(m)] > 0;
    if (v) {
      const w = Math.round(p / 4), prev = pos.length ? pos[pos.length - 1] : -1, h = Math.round(p / 2); let best = m, bv = -1e9;
      if (prev >= 0 && vo[vo.length - 1] && prev - h >= 0 && m + w + h < n) {
        // the next pulse is where the wave around it most resembles the wave around the last one (so neighbouring
        // grains are in step, and cross-fading them never cancels)
        for (let k = m - w; k <= m + w; k++) { let s = 0; for (let j = -h; j <= h; j += 2) s += x[prev + j] * x[k + j]; if (s > bv) { bv = s; best = k; } }
      } else for (let k = Math.max(0, m - w); k <= Math.min(n - 1, m + w); k++) if (x[k] > bv) { bv = x[k]; best = k; }
      m = best;
    }
    if (m <= t) m = Math.round(t + p);
    const f2 = fx[at(m)]; pos.push(m); per.push(v ? (f2 > 0 ? rate / f2 : p) : rate * 0.005); vo.push(v); t = m;
  }
  return { pos: pos, per: per, voiced: vo };
}
function psola(x, rate, fx, segs, pitch, o) {
  o = o || {}; const M = marksOf(x, rate, fx), pos = M.pos, K = pos.length, end = segs.reduce(function (m, s) { return Math.max(m, s.o1); }, 0), N = Math.ceil((end + 0.05) * rate), out = new Float32Array(N), ws = new Float32Array(N), rnd = o.rnd || Math.random;
  const grain = function (k, centre, wgt) { const m = pos[k], p = Math.max(8, Math.round(M.per[k])); for (let j = -p; j <= p; j++) { const src = m + j, dst = centre + j; if (src < 0 || src >= x.length || dst < 0 || dst >= N) continue; const w = wgt * (0.5 + 0.5 * Math.cos(Math.PI * j / p)); out[dst] += x[src] * w; ws[dst] += w; } };
  const find = function (s) { let lo = 0, hi = K - 1; while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (pos[mid] <= s) lo = mid; else hi = mid; } return lo; };
  let carry = null;
  segs.forEach(function (g) {
    // (a stretch that follows straight on from the last keeps that one's pulse train going: no broken period at the seam)
    const a = g.o0 * rate, b = g.o1 * rate; if (!(b > a)) return; let ts = carry !== null && carry >= a - 2 && carry - a < 0.02 * rate ? carry : a;
    while (ts < b) {
      const src = (g.s0 + (g.s1 - g.s0) * (ts - a) / (b - a)) * rate, k = Math.max(0, Math.min(K - 2, find(src))), fr = Math.max(0, Math.min(1, (src - pos[k]) / Math.max(1, pos[k + 1] - pos[k]))), near = fr < 0.5 ? k : k + 1, f = pitch(ts / rate);
      if (M.voiced[near] && f > 0) {
        // between two pulses: both grains, cross-faded, so a slowly crossed vowel changes smoothly and never steps
        if (M.voiced[k] && M.voiced[k + 1]) { grain(k, Math.round(ts), 1 - fr); grain(k + 1, Math.round(ts), fr); } else grain(near, Math.round(ts), 1);
        ts += rate / f * (1 + (rnd() - 0.5) * 0.006);
      } else {
        // no voice: the noise as it is, in 10 ms grains
        const h = Math.round(rate * 0.005), c = Math.round(src); for (let j = -h; j <= h; j++) { const s2 = c + j, dst = Math.round(ts) + j; if (s2 < 0 || s2 >= x.length || dst < 0 || dst >= N) continue; const w = 0.5 + 0.5 * Math.cos(Math.PI * j / h); out[dst] += x[s2] * w; ws[dst] += w; }
        ts += rate * 0.005;
      }
    }
    carry = ts;
  });
  for (let i = 0; i < N; i++) if (ws[i] > 0.5) out[i] /= ws[i];
  return out;
}

// a plain radix-2 transform (in place), for the spectral measures
function fft(re, im) {
  const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
}
// spectral flux every 11.6 ms: the size of the change between the (unit-length) magnitude spectra of neighbouring
// 23 ms frames; 0 = the same sound again, about 1.4 = nothing in common. Also each frame's level.
function flux(x, rate) {
  const W = 1024, H = 512, n = Math.max(0, Math.floor((x.length - W) / H)), fl = new Float64Array(n), lv = new Float64Array(n), re = new Float64Array(W), im = new Float64Array(W); let prev = null;
  for (let i = 0; i < n; i++) {
    let e = 0; for (let j = 0; j < W; j++) { const v = x[i * H + j]; re[j] = v * (0.5 - 0.5 * Math.cos(2 * Math.PI * j / W)); im[j] = 0; e += v * v; }
    fft(re, im); const mag = new Float64Array(W / 2); let s = 0; for (let j = 1; j < W / 2; j++) { mag[j] = Math.sqrt(re[j] * re[j] + im[j] * im[j]); s += mag[j] * mag[j]; } s = Math.sqrt(s) || 1; for (let j = 0; j < W / 2; j++) mag[j] /= s;
    if (prev) { let dsum = 0; for (let j = 0; j < W / 2; j++) { const q = mag[j] - prev[j]; dsum += q * q; } fl[i] = Math.sqrt(dsum); }
    lv[i] = Math.sqrt(e / W); prev = mag;
  }
  return { flux: fl, level: lv, hop: H / rate };
}
module.exports = { HOP: HOP, EHOP: EHOP, f0: f0, energy: energy, zcr: zcr, median: median, psola: psola, marksOf: marksOf, fft: fft, flux: flux };
