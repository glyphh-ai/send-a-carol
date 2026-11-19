'use strict';
// beat.js : where the beats of a song are, by plain arithmetic on its samples (no library, no trained anything).
//   1. energy every 10 ms in two bands (a one-pole low pass for the kick and bass, and what is left over)
//   2. onset strength = how much the log energy ROSE since the frame before, less its local average
//   3. tempo = the lag (60 to 180 beats a minute) at which the onset strength best matches itself, with the lag's
//      double counted in, and a gentle preference for the tempo the song was asked for (settles half/double time)
//   4. phase = the offset at which a comb of that period collects the most onset strength
// analyse(samples (Int16Array or Float32Array, mono), rate, hintBpm) -> { bpm, offset, beats: [seconds], duration, start, confidence }
function analyse(samples, rate, hint) {
  const hop = Math.max(1, Math.round(rate * 0.01)), n = Math.floor(samples.length / hop), scale = samples instanceof Int16Array ? 1 / 32768 : 1, duration = samples.length / rate;
  const low = new Float64Array(n), high = new Float64Array(n), a = Math.exp(-2 * Math.PI * 160 / rate);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    let el = 0, eh = 0;
    for (let j = i * hop, e = j + hop; j < e; j++) { const x = samples[j] * scale; lp = a * lp + (1 - a) * x; const h = x - lp; el += lp * lp; eh += h * h; }
    low[i] = Math.log(1 + 2000 * el / hop); high[i] = Math.log(1 + 2000 * eh / hop);
  }
  const on = new Float64Array(n);
  for (let i = 1; i < n; i++) on[i] = Math.max(0, low[i] - low[i - 1]) * 1.4 + Math.max(0, high[i] - high[i - 1]);
  // less the local average (one second), nothing below zero
  const win = 50, o = new Float64Array(n); let sum = 0;
  for (let i = 0; i < n; i++) { sum += on[i]; if (i >= win) sum -= on[i - win]; o[i] = Math.max(0, on[i] - sum / Math.min(i + 1, win)); }
  // where the music starts: the first frame louder than a twentieth of the loudest
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, low[i] + high[i]);
  let start = 0; for (let i = 0; i < n; i++) if (low[i] + high[i] > peak * 0.05) { start = i * hop / rate; break; }
  const fps = rate / hop, minLag = Math.floor(fps * 60 / 180), maxLag = Math.ceil(fps * 60 / 60), want = hint > 0 ? fps * 60 / hint : 0;
  const score = function (lag) {
    let s = 0, s2 = 0; const l2 = lag * 2;
    for (let i = 0; i + lag < n; i++) s += o[i] * o[i + lag];
    for (let i = 0; i + l2 < n; i++) s2 += o[i] * o[i + l2];
    s = s / Math.max(1, n - lag) + 0.5 * s2 / Math.max(1, n - l2);
    if (want) { const oct = Math.log(lag / want) / Math.LN2; s *= Math.exp(-oct * oct / (2 * 0.45 * 0.45)); }
    return s;
  };
  let best = minLag, bestS = -1, total = 0, count = 0;
  const scores = [];
  for (let lag = minLag; lag <= maxLag; lag++) { const s = score(lag); scores[lag] = s; total += s; count++; if (s > bestS) { bestS = s; best = lag; } }
  // a hint must not drag the answer to double time: when the onsets hardly match themselves at the found lag and
  // do match at twice it (nothing falls between the beats), the beat is the longer one
  const same = function (lag) { let s = 0; for (let i = 0; i + lag < n; i++) s += o[i] * o[i + lag]; return s / Math.max(1, n - lag); };
  if (best * 2 - 1 >= minLag && best * 2 + 1 <= maxLag) {
    let twice = best * 2; [twice - 1, twice + 1].forEach(function (l) { if (same(l) > same(twice)) twice = l; });
    if (same(best) < 0.45 * same(twice) && scores[twice] > 0) { best = twice; bestS = scores[twice]; }
  }
  // and with no hint to settle it, a beat that also matches at half its length is the shorter one (not half time)
  if (!want && best / 2 >= minLag + 1) {
    let half = Math.floor(best / 2); [half - 1, half + 1].forEach(function (l) { if (same(l) > same(half)) half = l; });
    if (same(half) >= 0.45 * same(best) && scores[half] > 0) { best = half; bestS = scores[half]; }
  }
  // between two frames: the top of the parabola through the best lag and its neighbours
  let period = best;
  if (best > minLag && best < maxLag) { const y0 = scores[best - 1], y1 = scores[best], y2 = scores[best + 1], den = y0 - 2 * y1 + y2; if (den < 0) period = best + 0.5 * (y0 - y2) / den; }
  if (!(bestS > 0)) { const bpm0 = hint > 0 ? hint : 100; return grid(bpm0, start, duration, 0, start); }
  // the comb: for a period and a phase, the onset strength it collects. First the phase at the found period, then
  // the period itself made finer (2% either way in steps of 0.02%): over thirty seconds a hundredth of a beat matters.
  const comb = function (per, p) { let s = 0; for (let k = 0, at = p; at < n; k++, at = p + k * per) { const i = Math.round(at); s += (o[i] || 0) + 0.5 * ((o[i - 1] || 0) + (o[i + 1] || 0)); } return s; };
  const phase = function (per) { let bp = 0, bs = -1; for (let p = 0; p < per; p += 0.5) { const s = comb(per, p); if (s > bs) { bs = s; bp = p; } } return [bp, bs]; };
  let bestP = 0, bestPS = -1, fine = period;
  for (let k = -100; k <= 100; k++) { const per = period * (1 + k * 0.0002), ph = phase(per), s = ph[1] / (n / per); if (s > bestPS * (1 + 1e-9)) { bestPS = s; bestP = ph[0]; fine = per; } }
  period = fine;
  return grid(60 * fps / period, bestP / fps, duration, count ? Math.min(1, bestS / (total / count) / 4) : 0, start);
}
function grid(bpm, offset, duration, confidence, start) {
  const period = 60 / bpm, beats = [];
  while (offset - period >= 0) offset -= period;
  for (let t = offset; t < duration; t += period) beats.push(Math.round(t * 1000) / 1000);
  return { bpm: Math.round(bpm * 100) / 100, offset: Math.round(offset * 1000) / 1000, beats: beats, duration: Math.round(duration * 1000) / 1000, start: Math.round(start * 1000) / 1000, confidence: Math.round(confidence * 100) / 100 };
}
// how loud: the peak and the RMS of the samples, in dBFS
function levels(samples) {
  const scale = samples instanceof Int16Array ? 1 / 32768 : 1; let peak = 0, sq = 0;
  for (let i = 0; i < samples.length; i++) { const x = Math.abs(samples[i] * scale); if (x > peak) peak = x; sq += x * x; }
  const db = function (v) { return v > 0 ? Math.round(200 * Math.log10(v)) / 10 : -120; };
  return { peak: db(peak), rms: db(Math.sqrt(sq / Math.max(1, samples.length))) };
}
module.exports = { analyse: analyse, grid: grid, levels: levels };
