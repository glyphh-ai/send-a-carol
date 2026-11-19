'use strict';
// spike/classics/synth.cjs : the instruments, made of plain arithmetic (sines, a plucked-string delay line, filtered
// noise), a small room (comb and all-pass delays), and a stereo mixing desk. No samples, no library.
// Every instrument is (frequency, seconds, how hard 0..1, random) -> Float32Array at 44.1 kHz.
const RATE = 44100, TAU = 2 * Math.PI;
const hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };

// a felt piano: partials a little sharp of whole multiples (a stiff string), the high ones quieter and dying sooner,
// two strings a hair apart, a soft start
function piano(f, dur, vel, rnd) {
  const n = Math.round((dur + 0.35) * RATE), y = new Float32Array(n), B = 0.0004, hold = Math.round(dur * RATE);
  for (let s = 0; s < 2; s++) { const det = s ? 1.0011 : 0.9992;
    for (let k = 1; k <= 9; k++) { const fk = f * det * k * Math.sqrt(1 + B * k * k); if (fk > 9000) break; const amp = Math.exp(-(k - 1) * (0.62 - 0.25 * vel)) / k, dec = 0.9 + 0.55 * k + f / 900, w = TAU * fk / RATE, ph = rnd() * TAU;
      for (let i = 0; i < n; i++) y[i] += amp * Math.exp(-dec * i / RATE) * Math.sin(w * i + ph); } }
  for (let i = 0; i < n; i++) { const a = Math.min(1, i / (0.007 * RATE)), r = i > hold ? Math.exp(-(i - hold) / (0.09 * RATE)) : 1; y[i] *= 0.28 * vel * a * r; }
  return y;
}
// a music box: a struck comb tooth, nearly a pure tone with one sour high partial and a tick
function musicbox(f, dur, vel, rnd) {
  const n = Math.round(Math.max(dur, 0.9) * RATE + 0.6 * RATE), y = new Float32Array(n), ps = [[1, 1, 2.2], [2.0, 0.22, 4], [3.01, 0.07, 7], [5.42, 0.16, 11]];
  ps.forEach(function (p) { const w = TAU * f * p[0] / RATE; if (f * p[0] > 12000) return; for (let i = 0; i < n; i++) y[i] += p[1] * Math.exp(-p[2] * i / RATE) * Math.sin(w * i); });
  for (let i = 0; i < 90; i++) y[i] += 0.5 * (rnd() - 0.5) * (1 - i / 90);
  for (let i = 0; i < n; i++) y[i] *= 0.3 * vel * Math.min(1, i / 40) * Math.min(1, (n - i) / 2000);
  return y;
}
// a glockenspiel / small bell: a bar's partials (1, 2.76, 5.4, 8.9)
function glock(f, dur, vel) {
  const n = Math.round(1.8 * RATE), y = new Float32Array(n);
  [[1, 1, 3], [2.76, 0.35, 6], [5.4, 0.18, 10], [8.93, 0.06, 16]].forEach(function (p) { const w = TAU * f * p[0] / RATE; if (f * p[0] > 15000) return; for (let i = 0; i < n; i++) y[i] += p[1] * Math.exp(-p[2] * i / RATE) * Math.sin(w * i); });
  for (let i = 0; i < n; i++) y[i] *= 0.22 * vel * Math.min(1, i / 30) * Math.min(1, (n - i) / 3000);
  return y;
}
// vibes: a bar with a slow shimmer
function vibes(f, dur, vel) {
  const n = Math.round((dur + 1.2) * RATE), y = new Float32Array(n), hold = Math.round(dur * RATE);
  for (let i = 0; i < n; i++) { const t = i / RATE, r = i > hold ? Math.exp(-(i - hold) / (0.35 * RATE)) : 1; y[i] = 0.3 * vel * Math.min(1, i / 60) * r * (1 + 0.18 * Math.sin(TAU * 5.2 * t)) * (Math.exp(-1.1 * t) * Math.sin(TAU * f * t) + 0.22 * Math.exp(-5 * t) * Math.sin(TAU * f * 4 * t) + 0.05 * Math.exp(-9 * t) * Math.sin(TAU * f * 10 * t)); }
  return y;
}
// a plucked string (nylon guitar): a burst of noise going round a delay line one period long, softened each time round
function pluck(f, dur, vel, rnd, bright) {
  const n = Math.round((dur + 0.5) * RATE), y = new Float32Array(n), P = RATE / f - 0.5, N = Math.ceil(P) + 2, hold = Math.round(dur * RATE), k = 0.25 + 0.5 * (bright === undefined ? 0.5 : bright) * (0.6 + 0.4 * vel);
  let lp = 0; for (let i = 0; i < N && i < n; i++) { lp += k * ((rnd() * 2 - 1) - lp); y[i] = lp; }
  const damp = Math.pow(0.5, 1 / (f * (1.1 + 60 / f) * 1.0));   // (about a second and a half to fall by half at low notes)
  for (let i = N; i < n; i++) { const p = i - P, a = Math.floor(p), fr = p - a, d0 = y[a] + (y[a + 1] - y[a]) * fr, d1 = y[a - 1] + (y[a] - y[a - 1]) * fr; y[i] = damp * 0.5 * (d0 + d1); }
  for (let i = 0; i < n; i++) { const r = i > hold ? Math.exp(-(i - hold) / (0.12 * RATE)) : 1; y[i] *= 0.55 * vel * Math.min(1, i / 20) * r; }
  return y;
}
// a bass: a round low string
function bass(f, dur, vel) {
  const n = Math.round((dur + 0.15) * RATE), y = new Float32Array(n), hold = Math.round(dur * RATE);
  for (let i = 0; i < n; i++) { const t = i / RATE, r = i > hold ? Math.exp(-(i - hold) / (0.05 * RATE)) : 1; y[i] = 0.5 * vel * Math.min(1, i / 250) * r * (Math.exp(-1.6 * t) * Math.sin(TAU * f * t) + 0.42 * Math.exp(-3 * t) * Math.sin(TAU * 2 * f * t) + 0.15 * Math.exp(-6 * t) * Math.sin(TAU * 3 * f * t) + 0.05 * Math.exp(-9 * t) * Math.sin(TAU * 4 * f * t)); }
  return y;
}
// a pad: three slightly detuned soft voices that swell in and out
function pad(f, dur, vel, rnd) {
  const n = Math.round((dur + 0.9) * RATE), y = new Float32Array(n), hold = Math.round(dur * RATE), att = Math.min(0.5, dur * 0.4) * RATE;
  [0.996, 1, 1.0045].forEach(function (det) { const ph = rnd() * TAU; for (let k = 1; k <= 5; k++) { const w = TAU * f * det * k / RATE, amp = 1 / (k * k * (k > 1 ? 1.3 : 1)); for (let i = 0; i < n; i++) y[i] += amp * Math.sin(w * i + ph * k); } });
  for (let i = 0; i < n; i++) { const r = i > hold ? Math.exp(-(i - hold) / (0.3 * RATE)) : 1; y[i] *= 0.07 * vel * Math.min(1, i / att) * r * (1 + 0.06 * Math.sin(TAU * 0.7 * i / RATE)); }
  return y;
}
// sleigh bells: a handful of small bells shaken together (each a few high clashing partials), with the rattle of the pellets
function sleigh(f, dur, vel, rnd) {
  const n = Math.round(0.42 * RATE), y = new Float32Array(n);
  for (let b = 0; b < 5; b++) { const at = Math.floor(rnd() * 0.028 * RATE), base = 2300 + rnd() * 2600, g = 0.5 + rnd() * 0.5;
    [1, 1.47, 2.09, 2.56].forEach(function (m, k) { const w = TAU * base * m / RATE, dec = 16 + k * 7 + rnd() * 6, ph = rnd() * TAU; for (let i = at; i < n; i++) y[i] += g / (k + 1.5) * Math.exp(-dec * (i - at) / RATE) * Math.sin(w * (i - at) + ph); }); }
  let hp = 0, prev = 0; for (let i = 0; i < Math.round(0.05 * RATE); i++) { const x = rnd() * 2 - 1; hp = 0.82 * (hp + x - prev); prev = x; y[i] += 0.5 * hp * Math.exp(-70 * i / RATE); }
  for (let i = 0; i < n; i++) y[i] *= 0.11 * vel;
  return y;
}
// noise instruments: a shaker, a brush swish, a brush tap, a ride tick. kind picks the envelope and the colour
function noise(kind, vel, rnd) {
  const K = { shaker: [0.07, 0.004, 0.022, 0.75, 0.1], swish: [0.34, 0.09, 0.11, 0.45, 0.22], tap: [0.12, 0.002, 0.03, 0.55, 0.3], ride: [0.3, 0.001, 0.09, 0.9, 0.05] }[kind], n = Math.round(K[0] * RATE), y = new Float32Array(n);
  let hp = 0, prev = 0, lp = 0;
  for (let i = 0; i < n; i++) { const x = rnd() * 2 - 1; hp = K[3] * (hp + x - prev); prev = x; lp += (1 - K[4]) * (hp - lp); const t = i / RATE, e = Math.min(1, t / K[1]) * Math.exp(-Math.max(0, t - K[1]) / K[2]); y[i] = 0.3 * vel * e * lp; }
  if (kind === 'ride') for (let i = 0; i < n; i++) { const t = i / RATE; y[i] += 0.03 * vel * Math.exp(-9 * t) * (Math.sin(TAU * 5200 * t) + Math.sin(TAU * 7430 * t) + Math.sin(TAU * 9100 * t)); }
  return y;
}
// a soft kick: a low tone that falls
function kick(vel) { const n = Math.round(0.22 * RATE), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / RATE; ph += TAU * (46 + 70 * Math.exp(-t * 38)) / RATE; y[i] = 0.5 * vel * Math.exp(-t * 17) * Math.sin(ph) * Math.min(1, i / 40); } return y; }

// THE ROOM: eight comb delays (each fed back through a gentle low pass) into four all-pass delays, left and right a
// little different. In place, on a pair of buses; returns the wet pair.
function room(L, R, size, damp) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], alls = [556, 441, 341, 225], fb = size === undefined ? 0.84 : size, dp = damp === undefined ? 0.25 : damp, out = [];
  [L, R].forEach(function (x, ch) {
    const n = x.length, y = new Float32Array(n);
    combs.forEach(function (len) { len += ch * 23; const buf = new Float32Array(len); let p = 0, st = 0; for (let i = 0; i < n; i++) { const o = buf[p]; st = o * (1 - dp) + st * dp; buf[p] = x[i] + st * fb; y[i] += o; if (++p === len) p = 0; } });
    alls.forEach(function (len) { len += ch * 23; const buf = new Float32Array(len); let p = 0; for (let i = 0; i < n; i++) { const b = buf[p], v = y[i]; y[i] = b - v; buf[p] = v + b * 0.5; if (++p === len) p = 0; } });
    for (let i = 0; i < n; i++) y[i] *= 0.03;
    out.push(y);
  });
  return out;
}

// THE DESK: two channels and a bus to the room. put(sound, seconds, gain, pan -1..1, how much to the room)
function Desk(seconds) {
  const n = Math.ceil(seconds * RATE), D = { n: n, L: new Float32Array(n), R: new Float32Array(n), sL: new Float32Array(n), sR: new Float32Array(n) };
  D.put = function (y, t, gain, pan, send) {
    const a = Math.round(t * RATE), th = ((pan || 0) + 1) * Math.PI / 4, gl = (gain === undefined ? 1 : gain) * Math.cos(th) * 1.414, gr = (gain === undefined ? 1 : gain) * Math.sin(th) * 1.414, s = send || 0;
    for (let i = Math.max(0, -a); i < y.length && a + i < n; i++) { const v = y[i]; D.L[a + i] += v * gl; D.R[a + i] += v * gr; if (s) { D.sL[a + i] += v * gl * s; D.sR[a + i] += v * gr * s; } }
  };
  D.mix = function (size, damp) { const w = room(D.sL, D.sR, size, damp), L = new Float32Array(n), R = new Float32Array(n); for (let i = 0; i < n; i++) { L[i] = D.L[i] + w[0][i]; R[i] = D.R[i] + w[1][i]; } return [L, R]; };
  return D;
}
// the loudest sample brought to `peak` (0..1)
function level(pair, peak) { let top = 0; pair.forEach(function (c) { for (let i = 0; i < c.length; i++) { const v = Math.abs(c[i]); if (v > top) top = v; } }); const k = top > 0 ? (peak || 0.7) / top : 1; pair.forEach(function (c) { for (let i = 0; i < c.length; i++) c[i] *= k; }); return pair; }

module.exports = { RATE: RATE, hz: hz, piano: piano, musicbox: musicbox, glock: glock, vibes: vibes, pluck: pluck, bass: bass, pad: pad, sleigh: sleigh, noise: noise, kick: kick, room: room, Desk: Desk, level: level };
