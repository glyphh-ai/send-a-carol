'use strict';
// spike/premium/people.cjs : code-drawn placeholder "selfies" of MADE-UP people (never a real person), and the two
// taps a singer would make on each: an oval over the face and a line across the mouth. As test/kit.cjs's photo(),
// but one person per picture, drawn closer to a selfie (a tilted head off the centre, shoulders, a background, a
// closed-lip smile), so the cut-out has real work to do. A drawing is kinder to a cut-out than a real photo is
// (even light, a clean outline): what the spike shows with these is the mechanism, not how every real selfie will look.
//   person(spec) -> { png: Buffer, w, h, taps: { oval: { cx, cy, rx, ry }, mouth: { x1, y1, x2, y2 } }, name }
const canvas = require('@napi-rs/canvas');
const TAU = Math.PI * 2;
const CAST = {
  // a family of four adults (two parents, two grown children) and a team of six: all invented
  tom:    { name: 'Tom',    skin: '#e2b08a', hair: '#4a3626', style: 'short', beard: '#4a3626', top: '#35618f', bg: ['#cfd9df', '#e2ebf0'], tilt: -0.06, at: [0.47, 0.42], size: 0.2 },
  priya:  { name: 'Priya',  skin: '#b97f56', hair: '#1c1412', style: 'long',  top: '#b23a5e', bg: ['#fbc2a4', '#f6e3ce'], tilt: 0.07, at: [0.54, 0.4], size: 0.19, lips: '#a2414f' },
  maya:   { name: 'Maya',   skin: '#c99068', hair: '#2a1c16', style: 'bun',   top: '#e0a030', bg: ['#a1c4fd', '#d7e9fb'], tilt: 0.04, at: [0.5, 0.43], size: 0.2, glasses: true },
  leo:    { name: 'Leo',    skin: '#d6a27a', hair: '#3a2a1e', style: 'curly', top: '#3f8f6b', bg: ['#b9e0c0', '#e6f4e1'], tilt: -0.09, at: [0.44, 0.41], size: 0.21 },
  sam:    { name: 'Sam',    skin: '#f0cba8', hair: '#b5651d', style: 'short', top: '#5b5f97', bg: ['#e0c3fc', '#f1e4ff'], tilt: 0.05, at: [0.52, 0.42], size: 0.2, freckles: true },
  dee:    { name: 'Dee',    skin: '#7d4f33', hair: '#15100e', style: 'curly', top: '#d9534f', bg: ['#fddb92', '#fdf2cf'], tilt: -0.04, at: [0.49, 0.4], size: 0.2, lips: '#7a2f3a' },
  kenji:  { name: 'Kenji',  skin: '#e6bd92', hair: '#101010', style: 'short', top: '#2f6f8f', bg: ['#c2e9fb', '#e8f7fd'], tilt: 0.03, at: [0.5, 0.41], size: 0.2, glasses: true },
  rosa:   { name: 'Rosa',   skin: '#d39a72', hair: '#5a2d1a', style: 'long',  top: '#7b3fa0', bg: ['#f6d0d8', '#fbeef0'], tilt: -0.07, at: [0.46, 0.42], size: 0.19, lips: '#b04a5a' },
  abe:    { name: 'Abe',    skin: '#f2d2b6', hair: '#c9c9c9', style: 'bald',  beard: '#d8d8d8', top: '#6a4a3a', bg: ['#d7d2cc', '#efe9e4'], tilt: 0.06, at: [0.53, 0.43], size: 0.21 },
  noor:   { name: 'Noor',   skin: '#c68a5e', hair: '#241812', style: 'bun',   top: '#1f7a5a', bg: ['#84fab0', '#d9fbe6'], tilt: -0.03, at: [0.5, 0.4], size: 0.19, lips: '#93404c' },
};
function shade(col, k) { const n = parseInt(col.slice(1), 16), t = k < 0 ? 0 : 255, a = Math.abs(k), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return 'rgb(' + Math.round(r + (t - r) * a) + ',' + Math.round(g + (t - g) * a) + ',' + Math.round(b + (t - b) * a) + ')'; }
function person(id) {
  const s = CAST[id]; if (!s) throw new Error('nobody called ' + id);
  const W = 900, H = 1200, cv = canvas.createCanvas(W, H), c = cv.getContext('2d'), cx = W * s.at[0], cy = H * s.at[1], rx = W * s.size, ry = rx * 1.3;
  let seed = id.split('').reduce(function (n, ch) { return n * 31 + ch.charCodeAt(0); }, 7); const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // a room or a garden behind them
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, s.bg[0]); g.addColorStop(1, s.bg[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.15 + rnd() * 0.25) + ')'; c.beginPath(); c.ellipse(rnd() * W, rnd() * H * 0.7, 40 + rnd() * 120, 30 + rnd() * 80, rnd(), 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(W * 0.72, H * 0.1, W * 0.2, H * 0.3); c.fillRect(0, H * 0.82, W, H * 0.18);
  // shoulders and neck
  c.fillStyle = s.top; c.beginPath(); c.moveTo(cx - rx * 2.3, H); c.quadraticCurveTo(cx - rx * 2.1, cy + ry * 1.25, cx - rx * 0.5, cy + ry * 1.2); c.lineTo(cx + rx * 0.5, cy + ry * 1.2); c.quadraticCurveTo(cx + rx * 2.1, cy + ry * 1.25, cx + rx * 2.3, H); c.fill();
  c.fillStyle = shade(s.skin, -0.12); c.fillRect(cx - rx * 0.42, cy + ry * 0.6, rx * 0.84, ry * 0.75);
  c.save(); c.translate(cx, cy); c.rotate(s.tilt);
  // hair behind the head
  c.fillStyle = s.hair;
  if (s.style === 'long') { c.beginPath(); c.ellipse(0, ry * 0.1, rx * 1.22, ry * 1.25, 0, 0, TAU); c.fill(); c.fillRect(-rx * 1.2, 0, rx * 2.4, ry * 1.5); }
  if (s.style === 'curly') for (let i = 0; i < 16; i++) { const a = Math.PI + i / 15 * Math.PI; c.beginPath(); c.arc(Math.cos(a) * rx * 1.02, Math.sin(a) * ry * 0.98 - ry * 0.05, rx * 0.3, 0, TAU); c.fill(); }
  if (s.style === 'bun') { c.beginPath(); c.arc(0, -ry * 1.18, rx * 0.42, 0, TAU); c.fill(); }
  // ears, the head with a little light on it
  c.fillStyle = shade(s.skin, -0.08); c.beginPath(); c.ellipse(-rx * 1.0, ry * 0.02, rx * 0.16, ry * 0.2, 0, 0, TAU); c.ellipse(rx * 1.0, ry * 0.02, rx * 0.16, ry * 0.2, 0, 0, TAU); c.fill();
  const hg = c.createRadialGradient(-rx * 0.3, -ry * 0.35, rx * 0.2, 0, 0, ry * 1.25); hg.addColorStop(0, shade(s.skin, 0.14)); hg.addColorStop(0.6, s.skin); hg.addColorStop(1, shade(s.skin, -0.2));
  c.fillStyle = hg; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill();
  // hair on top
  c.fillStyle = s.hair;
  if (s.style !== 'bald') { c.beginPath(); c.ellipse(0, -ry * 0.1, rx * 1.03, ry * 0.95, 0, Math.PI * 1.03, Math.PI * 1.97); c.quadraticCurveTo(rx * 0.3, -ry * 0.72, 0, -ry * 0.6); c.quadraticCurveTo(-rx * 0.5, -ry * 0.5, -rx * 1.02, -ry * 0.16); c.fill(); }
  else { c.beginPath(); c.ellipse(-rx * 0.98, -ry * 0.12, rx * 0.12, ry * 0.3, 0.2, 0, TAU); c.ellipse(rx * 0.98, -ry * 0.12, rx * 0.12, ry * 0.3, -0.2, 0, TAU); c.fill(); }
  // brows, eyes, nose
  c.strokeStyle = shade(s.hair === '#c9c9c9' ? '#8a8a8a' : s.hair, -0.1); c.lineWidth = rx * 0.07; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-rx * 0.58, -ry * 0.2); c.quadraticCurveTo(-rx * 0.4, -ry * 0.27, -rx * 0.2, -ry * 0.2); c.moveTo(rx * 0.2, -ry * 0.2); c.quadraticCurveTo(rx * 0.4, -ry * 0.27, rx * 0.58, -ry * 0.2); c.stroke();
  [-1, 1].forEach(function (k) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(k * rx * 0.39, -ry * 0.07, rx * 0.15, ry * 0.065, 0, 0, TAU); c.fill(); c.fillStyle = '#3a2a22'; c.beginPath(); c.arc(k * rx * 0.39, -ry * 0.07, rx * 0.075, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(k * rx * 0.39 + rx * 0.025, -ry * 0.085, rx * 0.022, 0, TAU); c.fill(); });
  c.strokeStyle = shade(s.skin, -0.3); c.lineWidth = rx * 0.045; c.beginPath(); c.moveTo(rx * 0.03, -ry * 0.02); c.quadraticCurveTo(rx * 0.16, ry * 0.2, 0, ry * 0.24); c.quadraticCurveTo(-rx * 0.1, ry * 0.25, -rx * 0.12, ry * 0.21); c.stroke();
  c.fillStyle = 'rgba(225,95,95,0.22)'; c.beginPath(); c.arc(-rx * 0.6, ry * 0.3, rx * 0.2, 0, TAU); c.arc(rx * 0.6, ry * 0.3, rx * 0.2, 0, TAU); c.fill();
  if (s.freckles) { c.fillStyle = 'rgba(150,80,40,0.45)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc((rnd() - 0.5) * rx * 1.2, ry * 0.12 + rnd() * ry * 0.16, rx * 0.018, 0, TAU); c.fill(); } }
  // a beard goes under the mouth
  if (s.beard) { c.fillStyle = s.beard; c.beginPath(); c.moveTo(-rx * 0.92, ry * 0.2); c.quadraticCurveTo(-rx * 0.5, ry * 0.36, -rx * 0.36, ry * 0.36); c.quadraticCurveTo(0, ry * 0.28, rx * 0.36, ry * 0.36); c.quadraticCurveTo(rx * 0.5, ry * 0.36, rx * 0.92, ry * 0.2); c.quadraticCurveTo(rx * 0.86, ry * 0.9, 0, ry * 1.02); c.quadraticCurveTo(-rx * 0.86, ry * 0.9, -rx * 0.92, ry * 0.2); c.fill(); }
  // the mouth: a closed smile. Upper lip, the line between the lips (where the singer drags the line), lower lip
  const my = ry * 0.5, mw = rx * 0.42, lip = s.lips || shade(s.skin, -0.32);
  c.fillStyle = lip; c.beginPath(); c.moveTo(-mw, my); c.quadraticCurveTo(-mw * 0.4, my - ry * 0.07, 0, my - ry * 0.035); c.quadraticCurveTo(mw * 0.4, my - ry * 0.07, mw, my); c.quadraticCurveTo(0, my + ry * 0.035, -mw, my); c.fill();
  c.beginPath(); c.moveTo(-mw, my); c.quadraticCurveTo(0, my + ry * 0.16, mw, my); c.quadraticCurveTo(0, my + ry * 0.045, -mw, my); c.fill();
  c.strokeStyle = shade(s.skin, -0.62); c.lineWidth = rx * 0.03; c.beginPath(); c.moveTo(-mw, my); c.quadraticCurveTo(0, my + ry * 0.045, mw, my); c.stroke();
  if (s.glasses) { c.strokeStyle = '#2a2a2a'; c.lineWidth = rx * 0.045; c.beginPath(); c.ellipse(-rx * 0.39, -ry * 0.07, rx * 0.26, ry * 0.15, 0, 0, TAU); c.moveTo(rx * 0.65, -ry * 0.07); c.ellipse(rx * 0.39, -ry * 0.07, rx * 0.26, ry * 0.15, 0, 0, TAU); c.moveTo(-rx * 0.13, -ry * 0.08); c.lineTo(rx * 0.13, -ry * 0.08); c.stroke(); }
  c.restore();
  // THE TWO TAPS, as a careful singer would make them: an upright oval a touch inside the head (so no background
  // comes with it), and a line dragged across the mouth from corner to corner (it carries the head's tilt)
  const co = Math.cos(s.tilt), si = Math.sin(s.tilt), pt = function (x, y) { return [cx + x * co - y * si, cy + x * si + y * co]; }, a = pt(-mw * 1.25, my + ry * 0.012), b = pt(mw * 1.25, my + ry * 0.012);
  return { name: s.name, png: cv.toBuffer('image/png'), w: W, h: H, taps: { oval: { cx: cx, cy: cy + ry * 0.02, rx: rx * 0.97, ry: ry * 0.99 }, mouth: { x1: a[0], y1: a[1], x2: b[0], y2: b[1] } } };
}
module.exports = { person: person, CAST: CAST };
