/* Send a Carol art pack: the fantasy cast (dinos, a dragon, a unicorn, aliens, fuzzy monsters, gnomes, a fairy, wizards, droids). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var eyes = K.eyes, blush = K.blush, mouth = K.mouth, arm = K.arm, armAngles = K.armAngles;
  var SKIN = ['#f6cfa8', '#e3ac7c', '#b9774a', '#7c4a2d'], HAIR = ['#6a3d22', '#221a18', '#d49a3a', '#a0452a'], INK = '#2b2118';

  /* ---------- the pack's own little helpers ---------- */
  function limb(c, x1, y1, cx, cy, x2, y2, w, col) { /* a bent limb or neck: a curved stroke with the outline */
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(cx, cy, x2, y2);
    if (K.ow() > 0) { c.lineWidth = w + K.ow() * 1.6; c.strokeStyle = shade(col, -0.34); c.stroke(); }
    c.lineWidth = w; c.strokeStyle = col; c.stroke();
  }
  function fuzz(c, cx, cy, rx, ry, n, amp, fill, rot) { /* a furry blob: a soft zigzag round an ellipse */
    var i, a, r; c.beginPath();
    for (i = 0; i < n * 2; i++) { a = (rot || 0) + i / (n * 2) * TAU; r = i % 2 ? 1 : 1 + amp; if (i) c.lineTo(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r); else c.moveTo(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r); }
    c.closePath(); F(c, fill);
  }
  function tri(c, x, y, w, h, rot, fill) { c.save(); c.translate(x, y); c.rotate(rot || 0); Pg(c, [[-w / 2, 0], [0, -h], [w / 2, 0]], fill); c.restore(); }
  function star(c, x, y, r, col, rot) { K.starPath(c, x, y, r, r * 0.46, 5, rot || 0); F(c, col); }
  function spark(c, x, y, r, col, a) { c.globalAlpha = clamp(a, 0, 1); K.twinkle(c, x, y, r, col); c.globalAlpha = 1; }
  function blinks(m) { return frac(m.t * 0.31 + m.ph) < 0.035; }
  function waveA(m, rest) { return m.wave ? 2.55 + Math.sin(m.t * 9) * 0.32 : rest; }

  /* ---------- dino: 0 t-rex, 1 triceratops, 2 long-neck, 3 stegosaur ---------- */
  var DINO = [{ b: '#63b95f', d: '#3d8a4a', l: '#f6ecb4' }, { b: '#f0935a', d: '#c5612f', l: '#ffe9c9' }, { b: '#6fa8e6', d: '#4673bd', l: '#e6f3ff' }, { b: '#a983d8', d: '#7550ad', l: '#f3e4ff' }];
  Art.add('character', 'dino', function (c, m, p) {
    var v = m.v, q = DINO[v], b = q.b, d = q.d, l = q.l, aa = armAngles(m, 1.2, 0.7), hx = m.sw * 2.2, hy, i, j;
    var by = v === 2 ? -22 : v === 3 ? -25 : -28, bry = v === 2 ? 19 : v === 3 ? 21 : 24, brx = v === 3 ? 23 : 20;
    /* tail, swinging */
    c.save(); c.translate(-10, -13); c.rotate(m.sw * 0.2 + Math.sin(m.t * 2) * 0.05);
    if (v === 3) { tri(c, -31, -19, 6, 12, -1.0, l); tri(c, -35, -25, 6, 12, -0.25, l); }
    c.beginPath(); c.moveTo(6, -12); c.quadraticCurveTo(-20, -10, v === 2 ? -42 : -36, v === 2 ? -30 : -25); c.quadraticCurveTo(-28, 4, 6, 9); c.closePath(); F(c, b);
    if (v === 0) for (i = 0; i < 3; i++) L(c, -12 - i * 7, -9 - i * 3.6, -9 - i * 7, -1 - i * 5, 1.6, d);
    if (v === 2) for (i = 0; i < 3; i++) dot(c, -12 - i * 8, -7 - i * 5, 2.4 - i * 0.4, d);
    c.restore();
    if (v === 3) for (i = 0; i < 4; i++) { var pa = PI * (1.02 + i * 0.13); c.save(); c.translate(Math.cos(pa) * brx, by + Math.sin(pa) * bry); c.rotate(pa + PI / 2 + m.sw * 0.08); Pg(c, [[-5.5, 2], [0, -11 - (i % 2) * 2], [5.5, 2], [0, 5]], i % 2 ? p.gold : '#ff9f5a'); c.restore(); } /* back plates */
    for (i = -1; i <= 1; i += 2) { E(c, i * 11, -4, 10, 5, b); for (j = -1; j <= 1; j++) dot(c, i * 11 + j * 4.6 + i * 1.5, -1.6, 1.5, l); }
    E(c, 0, by, brx, bry, b);
    E(c, 1.5, by + 4, brx * 0.62, bry * 0.68, l);
    c.lineWidth = 0.9; c.strokeStyle = shade(l, -0.16); for (i = 0; i < 3; i++) { c.beginPath(); c.arc(1.5, by - 20 + i * 7, 22, PI * 0.36, PI * 0.64); c.stroke(); }
    if (v === 1) for (i = 0; i < 3; i++) dot(c, -14 + i * 2, by - 10 + i * 9, 2.2, d);
    var al = v === 0 ? 8 : 12, sy = by - bry * 0.42;
    arm(c, -brx * 0.78, sy, -1, aa[0], al, 5.2, b, b, 3); arm(c, brx * 0.78, sy, 1, aa[1], al + (m.wave && v === 0 ? 3 : 0), 5.2, b, b, 3);
    if (v === 0) { /* t-rex: big head, big grin, tiny arms */
      hy = -68 + m.k * 2.5;
      for (i = -1; i <= 1; i++) tri(c, hx + i * 7, hy - 14 + Math.abs(i) * 2, 7, 8, i * 0.3, d);
      E(c, hx, hy, 22, 17.5, b); E(c, hx, hy + 6.5, 17, 10.5, shade(b, 0.2));
      for (i = -1; i <= 1; i += 2) { dot(c, hx + i * 4.5, hy + 1, 1.2, d); L(c, hx + i * 6, hy - 11.5, hx + i * 12, hy - 10.5, 1.5, d); }
      eyes(c, hx, hy - 5.5, 9.5, 2.7, m); blush(c, hx, hy + 2.5, 17, 2.8, 'rgba(255,150,160,0.6)');
      if (m.open > 0.12) { E(c, hx, hy + 10, 10, 3 + m.open * 5, '#6a1d2a'); dot(c, hx, hy + 12 + m.open * 3.5, 4, '#e8707e'); for (i = -2; i <= 2; i++) Pg(c, [[hx + i * 3.6 - 1.6, hy + 7.2 - m.open * 3], [hx + i * 3.6 + 1.6, hy + 7.2 - m.open * 3], [hx + i * 3.6, hy + 10.4 - m.open * 3]], '#fff', true); }
      else { c.beginPath(); c.arc(hx, hy + 1.5, 12.5, PI * 0.14, PI * 0.86); c.lineWidth = 1.3; c.strokeStyle = shade(d, -0.4); c.stroke(); for (i = -1; i <= 1; i += 2) { Pg(c, [[hx + i * 9.6 - 1.5, hy + 8.4], [hx + i * 9.6 + 1.5, hy + 9.4], [hx + i * 9.2, hy + 12.6]], '#fff', true); Pg(c, [[hx + i * 4.6 - 1.5, hy + 12.4], [hx + i * 4.6 + 1.5, hy + 12.8], [hx + i * 4.6, hy + 15.6]], '#fff', true); } }
    } else if (v === 1) { /* triceratops: frill and three horns */
      hy = -62 + m.k * 2.5;
      for (i = 0; i < 7; i++) { var fa = PI * (1.0 + i / 6); E(c, hx + Math.cos(fa) * 21, hy - 2 + Math.sin(fa) * 19, 6.6, 6.6, d); }
      E(c, hx, hy - 2, 21.5, 19.5, d); c.beginPath(); c.ellipse(hx, hy - 2, 16.5, 15, 0, 0, TAU); c.fillStyle = shade(d, 0.22); c.fill();
      for (i = 0; i < 7; i++) { fa = PI * (1.0 + i / 6); dot(c, hx + Math.cos(fa) * 21.5, hy - 2 + Math.sin(fa) * 19.5, 2.2, i % 2 ? p.gold : l); }
      for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(hx + i * 5, hy - 9); c.quadraticCurveTo(hx + i * 9, hy - 22, hx + i * 16, hy - 29 - m.k * 2); c.quadraticCurveTo(hx + i * 15, hy - 15, hx + i * 12, hy - 7); c.closePath(); F(c, l); }
      E(c, hx, hy + 1, 17.5, 14.5, b); E(c, hx, hy + 8, 10.5, 7.2, shade(b, 0.2));
      tri(c, hx, hy + 3.5, 7, 10, 0, l);
      for (i = -1; i <= 1; i += 2) dot(c, hx + i * 3.4, hy + 6.5, 0.9, d);
      eyes(c, hx, hy - 2.5, 10, 2.5, m); blush(c, hx, hy + 3.5, 14, 2.5);
      mouth(c, hx, hy + 11, 4.2, m, shade(d, -0.4));
    } else if (v === 2) { /* long-neck: a leaf to nibble */
      var nx = hx * 2.4 + 7; hy = -84 + m.k * 2;
      limb(c, 3, by - 10, 0, -62, nx, hy + 4, 11.5, b);
      for (i = 0; i < 4; i++) dot(c, 0.5 + (nx - 1) * [0.08, 0.3, 0.55, 0.8][i] - 2.5 + (i % 2) * 3, by - 14 + (hy + 16 - by) * [0.1, 0.34, 0.58, 0.8][i], 2 - i * 0.2, d);
      for (i = 0; i < 3; i++) dot(c, -13 + i * 3, by - 9 + i * 8, 2.4, d);
      for (i = -1; i <= 1; i += 2) E(c, nx + i * 5.5, hy - 9, 2.2, 3.2, b, i * 0.4);
      E(c, nx, hy, 12.5, 10, b); E(c, nx, hy + 4.5, 9, 5.6, shade(b, 0.22));
      for (i = -1; i <= 1; i += 2) dot(c, nx + i * 2.6, hy + 2.6, 0.8, d);
      eyes(c, nx, hy - 2.6, 5.8, 2.1, m); blush(c, nx, hy + 2, 9.6, 2);
      mouth(c, nx, hy + 6.4, 3.4, m, shade(d, -0.4));
      if (m.open <= 0.12) { L(c, nx + 3, hy + 6.6, nx + 9, hy + 5, 0.9, '#3f9a5c'); K.leaf(c, nx + 8, hy + 5, 8, -0.5 + m.sw * 0.2, '#57b36f'); K.leaf(c, nx + 7, hy + 5.5, 6, 0.6 + m.sw * 0.2, '#6fca82'); }
    } else { /* stegosaur: plates all the way up */
      hy = -57 + m.k * 2.5;
      for (i = -1; i <= 1; i++) { c.save(); c.translate(hx + i * 8.5, hy - 12.5 + Math.abs(i) * 2.5); c.rotate(i * 0.42 + m.sw * 0.08); Pg(c, [[-5.5, 2], [0, -12 + Math.abs(i) * 3 - m.k * 1.5], [5.5, 2], [0, 5]], i ? '#ff9f5a' : p.gold); c.restore(); }
      E(c, hx, hy, 18, 14.5, b); E(c, hx, hy + 6, 11.5, 7.4, shade(b, 0.2));
      for (i = -1; i <= 1; i += 2) dot(c, hx + i * 3.2, hy + 3.6, 0.9, d);
      for (i = 0; i < 3; i++) dot(c, hx - 11 + i * 2.6, hy - 8 - (i % 2) * 2.5, 1.2, d);
      eyes(c, hx, hy - 3, 8.6, 2.5, m); blush(c, hx, hy + 2.5, 13.6, 2.5);
      mouth(c, hx, hy + 8.4, 4, m, shade(d, -0.4));
    }
  }, { wide: 1.0, variants: ['t-rex', 'triceratops', 'long-neck', 'stegosaur'] });

  /* ---------- dragon: a small, proud, friendly one; sings little flames ---------- */
  var DRG = [{ b: '#e8604c', d: '#b03a33', l: '#ffdfa6', w: '#f9a65a' }, { b: '#58b368', d: '#327a49', l: '#f4efb2', w: '#a8dc6e' }, { b: '#5aa9e6', d: '#3a72b5', l: '#e8f5ff', w: '#a2daf7' }, { b: '#9b6fd3', d: '#69449c', l: '#f8dcf2', w: '#e79cd8' }];
  Art.add('character', 'dragon', function (c, m, p) {
    var v = m.v, q = DRG[v], b = q.b, d = q.d, l = q.l, w = q.w, aa = armAngles(m, 1.2, 0.75), hx = m.sw * 2.2, hy = -65 + m.k * 2.5, i, j;
    c.save(); c.translate(12, -12); c.rotate(-m.sw * 0.2 + Math.sin(m.t * 2.2) * 0.05); /* tail with a spade tip */
    Pg(c, [[31, -24], [41, -31], [38, -19], [30, -17]], v === 1 ? '#57b36f' : d);
    c.beginPath(); c.moveTo(-6, -12); c.quadraticCurveTo(22, -8, 35, -24); c.quadraticCurveTo(28, 4, -6, 9); c.closePath(); F(c, b);
    for (i = 0; i < 3; i++) tri(c, 12 + i * 7, -10.5 - i * 3.4, 5, 5, 0.25 + i * 0.2, d); c.restore();
    for (i = -1; i <= 1; i += 2) { /* wings beat with the beat */
      c.save(); c.translate(i * 13, -47); c.scale(i, 1); c.rotate(0.1 - m.k * 0.45 + Math.sin(m.t * 2.6) * 0.06);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(v === 2 ? 30 : 26, v === 2 ? -30 : -25); c.quadraticCurveTo(29, -10, 21, -6); c.quadraticCurveTo(23, 2, 13, 2); c.quadraticCurveTo(13, 9, 2, 9); c.closePath(); F(c, w);
      L(c, 0, 0, 21, -6, 0.9, d); L(c, 0, 0, 13, 2, 0.9, d); L(c, 0, 0, 25, -24, 1.6, d); c.restore();
    }
    for (i = -1; i <= 1; i += 2) { E(c, i * 11, -4, 10.5, 5, b); for (j = -1; j <= 1; j++) dot(c, i * 11 + j * 4.8 + i * 1.5, -1.6, 1.5, l); }
    arm(c, -17, -41, -1, aa[0], 13, 6, b, b, 3.5); arm(c, 17, -41, 1, aa[1], 13, 6, b, b, 3.5);
    E(c, 0, -28, 21, 24.5, b); E(c, 0, -24, 13.5, 17.5, l);
    c.lineWidth = 0.9; c.strokeStyle = shade(l, -0.2); for (i = 0; i < 4; i++) { c.beginPath(); c.arc(0, -52 + i * 7, 20, PI * 0.33, PI * 0.67); c.stroke(); }
    /* horns: each dragon its own */
    for (i = -1; i <= 1; i += 2) {
      if (v === 0) { c.beginPath(); c.moveTo(hx + i * 6, hy - 12); c.quadraticCurveTo(hx + i * 8, hy - 24, hx + i * 15, hy - 27 - m.k * 2); c.quadraticCurveTo(hx + i * 14, hy - 16, hx + i * 13, hy - 9); c.closePath(); F(c, l); }
      else if (v === 1) { tri(c, hx + i * 9, hy - 12, 7, 9, i * 0.35, l); K.leaf(c, hx + i * 15, hy - 5, 13, i > 0 ? -0.75 : PI + 0.75, '#57b36f'); }
      else if (v === 2) { c.beginPath(); c.moveTo(hx + i * 5, hy - 13); c.quadraticCurveTo(hx + i * 14, hy - 20, hx + i * 24, hy - 32 - m.k * 2); c.quadraticCurveTo(hx + i * 18, hy - 15, hx + i * 12, hy - 9); c.closePath(); F(c, l); }
      else { c.beginPath(); c.arc(hx + i * 15, hy - 10, 6.5, 0, TAU); c.lineWidth = 5; c.strokeStyle = shade(l, -0.34); c.stroke(); c.lineWidth = 3.4; c.strokeStyle = l; c.stroke(); }
      if (v !== 1) Pg(c, [[hx + i * 15, hy - 6], [hx + i * 26, hy - 9 - m.k * 2], [hx + i * 17, hy + 3]], d); /* ear fins */
    }
    for (i = -1; i <= 1; i++) tri(c, hx + i * 5, hy - 14 + Math.abs(i) * 1.2, 5.5, 6.5 - Math.abs(i) * 1.5, i * 0.25, d);
    E(c, hx, hy, 19.5, 16.5, b); E(c, hx, hy + 6.2, 13.5, 8.8, shade(b, 0.2));
    for (i = -1; i <= 1; i += 2) { dot(c, hx + i * 4.2, hy + 2.6, 1.2, d); c.globalAlpha = 0.55 * m.k; dot(c, hx + i * (6 + (1 - m.k) * 4), hy - 1 - (1 - m.k) * 7, 2.6, p.snow); c.globalAlpha = 1; }
    if (v === 2) for (i = -1; i <= 1; i += 2) limb(c, hx + i * 11, hy + 6, hx + i * 20, hy + 4, hx + i * 23, hy + 11 + m.sw * i * 2, 1, l);
    eyes(c, hx, hy - 4.5, 8.8, 2.6, m); blush(c, hx, hy + 2, 15, 2.7);
    mouth(c, hx, hy + 9.6, 4.8, m, shade(d, -0.4));
    if (m.open > 0.12) { c.save(); c.translate(hx + 8, hy + 12); c.rotate(1.25); K.flame(c, 0, 0, 5 + m.open * 3, 7 + m.open * 12, m.t, v); c.restore(); }
    else Pg(c, [[hx + 3.4, hy + 10.6], [hx + 6, hy + 10], [hx + 5, hy + 13.4]], '#fff', true);
  }, { wide: 1.05, variants: ['ember', 'moss', 'sky', 'plum'] });

  /* ---------- unicorn: 0 pearl, 1 rose (with a bow), 2 midnight (winged, starry), 3 mint (flower crown) ---------- */
  var UNI = [{ b: '#fffaf5', s: '#f3dfe6', mane: ['#ff8ac0', '#ffd166', '#7fd6c2', '#8fb8ff'] }, { b: '#ffd3e2', s: '#f6b3ca', mane: ['#b98cf0', '#ffffff', '#ff7fb0', '#8fd0ff'] },
    { b: '#5553a3', s: '#6f6dc0', mane: ['#8fe3ff', '#c79bff', '#ff9ad5', '#ffe48a'] }, { b: '#c9f2e0', s: '#a6dfc8', mane: ['#ff9a76', '#ffd166', '#ff7fa8', '#ffffff'] }];
  Art.add('character', 'unicorn', function (c, m, p) {
    var v = m.v, q = UNI[v], b = q.b, s = q.s, mn = q.mane, hoof = v === 2 ? p.gold : shade(mn[0], -0.12), aa = armAngles(m, 1.2, 0.8), hx = m.sw * 2.4, hy = -61 + m.k * 2.5, i, j;
    for (j = 0; j < 4; j++) { c.save(); c.translate(-12, -18); c.rotate(0.75 - j * 0.3 + m.sw * 0.22 + Math.sin(m.t * 2 + j) * 0.05); limb(c, 0, 0, -12, -4, -24, 5 - j, 5.5, mn[j]); c.restore(); } /* tail */
    if (v === 2) for (i = -1; i <= 1; i += 2) for (j = 0; j < 3; j++) { c.save(); c.translate(i * 12, -44); c.rotate(i * (1.9 - j * 0.42 - m.k * 0.4 + Math.sin(m.t * 2.4) * 0.05)); E(c, 0, 14 - j * 1.5, 5.2, 13 - j * 1.6, j === 1 ? '#e9e6ff' : '#ffffff'); c.restore(); }
    for (i = -1; i <= 1; i += 2) { L(c, i * 7.5, -20, i * 8.5, -7, 9.6, shade(b, -0.34)); L(c, i * 7.5, -20, i * 8.5, -7, 8, b); R(c, i * 8.5 - 6, -7.5, 12, 7.5, 3, hoof); }
    arm(c, -13, -42, -1, aa[0], 15, 6.6, b, hoof, 3.8); arm(c, 13, -42, 1, aa[1], 15, 6.6, b, hoof, 3.8);
    E(c, 0, -30, 16.5, 19.5, b); E(c, 0, -27, 9.5, 12.5, s);
    if (v === 0) { K.heartPath(c, -9.5, -19, 5.5); c.fillStyle = mn[0]; c.fill(); }
    if (v === 2) { spark(c, -9, -22, 3, p.gold, 0.6 + m.k * 0.4); spark(c, 9, -36, 2.4, p.snow, 1 - m.k * 0.5); spark(c, 8, -19, 1.8, p.gold, 0.8); }
    if (v === 1) K.bow(c, 0, -46, 13, p.accent2);
    for (j = 3; j >= 0; j--) E(c, hx - 15.5 - (j % 2) * 2 + m.sw * j * 0.5, hy - 5 + j * 7, 6.5, 7.5, mn[j]); /* mane down the neck */
    for (i = -1; i <= 1; i += 2) { Pg(c, [[hx + i * 6, hy - 10], [hx + i * 13, hy - 24 - m.k * 1.5], [hx + i * 15, hy - 7]], b); Pg(c, [[hx + i * 9.5, hy - 11.5], [hx + i * 12.6, hy - 20], [hx + i * 13.4, hy - 10]], '#f7b4c4', true); }
    E(c, hx, hy, 15.5, 15, b);
    E(c, hx, hy + 9, 10.8, 8, s);
    for (i = -1; i <= 1; i += 2) dot(c, hx + i * 3.4, hy + 8.4, 0.9, shade(s, -0.4));
    var tx = hx + m.sw * 1.2, ty = hy - 36 + m.k * 1.5; /* the horn */
    c.beginPath(); c.moveTo(hx - 4, hy - 12.5); c.lineTo(tx, ty); c.lineTo(hx + 4, hy - 12.5); c.closePath(); F(c, p.gold);
    c.save(); c.clip(); for (i = 0; i < 5; i++) L(c, hx - 6, hy - 14 - i * 4.6, hx + 6, hy - 17 - i * 4.6, 1.1, shade(p.gold, -0.22)); c.restore();
    spark(c, tx, ty - 1, 4 + m.k * 3.5, '#ffffff', 0.55 + m.k * 0.45);
    for (j = 0; j < 3; j++) E(c, hx - 5 + j * 5, hy - 12.5 + j * 1.6, 5.6 - j * 0.6, 4.4, mn[j], 0.3); /* forelock */
    if (v === 3) for (i = -1; i <= 1; i++) K.flower(c, hx + i * 7.5, hy - 12.5 + Math.abs(i) * 2.4, 3.6, [p.accent, '#ffffff', p.gold][i + 1], i ? '#ffd54a' : p.accent, i + m.t * 0.2); /* flower crown */
    eyes(c, hx, hy - 0.5, 7.6, 2.6, m, v === 2 ? '#1d1b3a' : INK);
    if (!blinks(m)) for (i = -1; i <= 1; i += 2) { L(c, hx + i * 9.6, hy - 2, hx + i * 12, hy - 3.4, 0.7, v === 2 ? '#1d1b3a' : INK); L(c, hx + i * 9.2, hy - 0.2, hx + i * 12, hy - 0.2, 0.7, v === 2 ? '#1d1b3a' : INK); }
    blush(c, hx, hy + 4.4, 11.6, 2.5, v === 2 ? 'rgba(255,154,213,0.6)' : null);
    mouth(c, hx, hy + 12, 3.4, m, shade(s, -0.55));
  }, { wide: 0.95, variants: ['pearl', 'rose', 'midnight', 'mint'] });

  /* ---------- alien: 0 one-eyed sprout, 1 three-eyed wobbler, 2 big-eyed stargazer, 3 eye-stalks in a bubble helmet ---------- */
  Art.add('character', 'alien', function (c, m, p) {
    var v = m.v, aa = armAngles(m, 1.3, 0.8), hx = m.sw * 2.2, hy, i, j, b, d, h;
    if (v === 0) {
      b = '#8ddc6a'; d = '#55a544'; hy = -52 + m.k * 2.5;
      for (i = -1; i <= 1; i += 2) { L(c, i * 7, -14, i * 8, -5, 6.6, shade(b, -0.34)); L(c, i * 7, -14, i * 8, -5, 5, b); E(c, i * 9.5, -3.2, 8, 3.8, '#7a5fd0'); }
      for (i = -1; i <= 1; i += 2) { h = arm(c, i * 15, -32, i, i < 0 ? aa[0] : aa[1], 16, 4.6, b); for (j = -1; j <= 1; j++) E(c, h[0] + j * 2.6 + i * 0.8, h[1] + 1.6 - Math.abs(j) * 1.2, 1.9, 2.3, b); }
      for (i = -1; i <= 1; i += 2) { limb(c, hx + i * 8, hy - 22, hx + i * 11, hy - 34, hx + i * 17 + m.sw * 3, hy - 38 - m.k * 2, 1.8, d); E(c, hx + i * 17 + m.sw * 3, hy - 39 - m.k * 2, 3.6, 3.6, i < 0 ? p.gold : p.accent); }
      c.beginPath(); c.moveTo(hx, hy - 27); c.bezierCurveTo(hx + 26, hy - 27, 22, -30, 17, -14); c.quadraticCurveTo(0, -8, -17, -14); c.bezierCurveTo(-22, -30, hx - 26, hy - 27, hx, hy - 27); c.closePath(); F(c, b); /* one pear of a body */
      R(c, -17.5, -22, 35, 7.5, 3, '#7a5fd0'); star(c, 0, -18.2, 3.6, p.gold, m.sw * 0.3);
      for (i = 0; i < 3; i++) dot(c, hx - 15 + i * 3, hy - 18 + (i % 2) * 4, 1.6, d);
      E(c, hx, hy - 6, 11.5, 11.5, '#ffffff');
      if (blinks(m)) { c.beginPath(); c.arc(hx, hy - 7, 7, 0.15 * PI, 0.85 * PI); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
      else { dot(c, hx + m.sw * 2, hy - 5.5, 6.4, '#3a2a6a'); dot(c, hx + m.sw * 2, hy - 5.5, 3.4, INK); dot(c, hx + m.sw * 2 + 2.2, hy - 8, 2, '#fff'); }
      blush(c, hx, hy + 7, 14, 2.6); mouth(c, hx, hy + 10.5, 5, m, shade(d, -0.5));
    } else if (v === 1) {
      b = '#b58cf0'; d = '#8257c7'; hy = -34 + m.k * 2.5;
      for (i = -1; i <= 1; i++) limb(c, i * 11, -12, i * 13, -4, i * 17 + m.sw * 2, -1.5, 6, d); /* three tentacle feet */
      for (i = -1; i <= 1; i += 2) { var ta = i < 0 ? aa[0] : waveA(m, aa[1]), ex = i * 24 + i * Math.sin(ta) * 20, ey = -34 + Math.cos(ta) * 20; limb(c, i * 24, -34, i * 24 + i * Math.sin(ta + 0.9) * 13, -34 + Math.cos(ta + 0.9) * 13, ex, ey, 5.5, b); dot(c, ex, ey, 2, shade(b, 0.35)); }
      for (i = -1; i <= 1; i++) { var sx = hx + i * 15, sy = hy - 36 - (i ? 0 : 7) - m.k * (i ? 2 : 3.5); limb(c, i * 11, hy - 20, i * 14, hy - 28, sx, sy + 5, 4, b); E(c, sx, sy, i ? 7 : 8.5, i ? 7 : 8.5, '#ffffff'); if (blinks(m)) L(c, sx - 4, sy, sx + 4, sy, 1.5, INK); else { dot(c, sx + m.sw * 1.5, sy + 0.5, i ? 3.3 : 4, INK); dot(c, sx + m.sw * 1.5 + 1.2, sy - 1, 1.2, '#fff'); } }
      c.beginPath(); c.moveTo(0, hy - 24); c.bezierCurveTo(30, hy - 24, 31, -12, 26, -9); c.quadraticCurveTo(0, -3, -26, -9); c.bezierCurveTo(-31, -12, -30, hy - 24, 0, hy - 24); c.closePath(); F(c, b);
      E(c, 0, -19, 15, 9, shade(b, 0.3));
      for (i = 0; i < 6; i++) dot(c, [-20, -15, -22, 19, 22, 15][i], [-32, -42, -20, -40, -27, -17][i] + m.k * 2, [2.6, 1.8, 2, 2.4, 1.7, 2][i], d);
      blush(c, hx * 0.5, hy - 2, 16, 3);
      var mo = m.open > 0.12 ? m.open : 0; c.beginPath(); c.moveTo(hx * 0.5 - 11, hy - 3); c.quadraticCurveTo(hx * 0.5, hy + 5 + mo * 12, hx * 0.5 + 11, hy - 3); c.quadraticCurveTo(hx * 0.5, hy - 0.5, hx * 0.5 - 11, hy - 3); c.closePath(); c.fillStyle = '#4a2440'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#4a2440'; c.stroke();
      Rn(c, hx * 0.5 - 5, hy - 1.6, 3.4, 3.2, 0.8, '#fff'); Rn(c, hx * 0.5 + 2, hy - 1.6, 3.4, 3.2, 0.8, '#fff');
    } else if (v === 2) {
      b = '#7fd3e8'; d = '#3f9fc0'; var suit = '#e3e8f2'; hy = -70 + m.k * 2.5;
      for (i = -1; i <= 1; i += 2) { L(c, i * 5, -26, i * 6, -6, 6.4, shade(suit, -0.34)); L(c, i * 5, -26, i * 6, -6, 4.8, suit); R(c, i * 7 - 6, -7, 12, 7, 3.4, p.accent2); }
      for (i = -1; i <= 1; i += 2) { h = arm(c, i * 9.5, -47, i, i < 0 ? aa[0] : aa[1], 19, 4.2, suit); E(c, h[0], h[1], 3, 3.4, b); for (j = -1; j <= 1; j += 2) L(c, h[0], h[1], h[0] + j * 2.4 + i * 1.5, h[1] + 4.4, 1.4, b); }
      c.beginPath(); c.moveTo(-9.5, -51); c.quadraticCurveTo(-13, -36, -10, -22); c.quadraticCurveTo(0, -19, 10, -22); c.quadraticCurveTo(13, -36, 9.5, -51); c.closePath(); F(c, suit);
      R(c, -10.5, -29, 21, 4.4, 2, p.accent2); E(c, 0, -40, 5, 5, p.gold); c.beginPath(); c.ellipse(0, -40, 8, 2.4, -0.4, 0, TAU); c.lineWidth = 1; c.strokeStyle = p.accent; c.stroke();
      L(c, 0, -57, 0, -51, 5, b);
      c.beginPath(); c.moveTo(hx, hy + 17); c.bezierCurveTo(hx - 10, hy + 17, hx - 22, hy + 2, hx - 21, hy - 9); c.bezierCurveTo(hx - 20, hy - 26, hx + 20, hy - 26, hx + 21, hy - 9); c.bezierCurveTo(hx + 22, hy + 2, hx + 10, hy + 17, hx, hy + 17); c.closePath(); F(c, b); /* a big light-bulb head */
      c.beginPath(); c.ellipse(hx - 8, hy - 15, 7, 3.4, -0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fill();
      for (i = -1; i <= 1; i += 2) { c.save(); c.translate(hx + i * 9, hy - 1); c.rotate(i * 0.42);
        if (blinks(m)) { c.beginPath(); c.arc(0, -1.5, 5.6, 0.15 * PI, 0.85 * PI); c.lineWidth = 1.6; c.strokeStyle = '#1b2440'; c.stroke(); }
        else { E(c, 0, 0, 5.6, 8, '#1b2440'); dot(c, 1.2, -3.2, 2, '#fff'); dot(c, -1.6, 2.6, 1, 'rgba(255,255,255,0.7)'); } c.restore(); }
      blush(c, hx, hy + 7.5, 10, 2.2, 'rgba(255,138,192,0.5)'); mouth(c, hx, hy + 11.4, 3, m, shade(d, -0.5));
      spark(c, hx + 19, hy - 22, 3 + m.k * 2.5, p.gold, 0.5 + m.k * 0.5);
    } else {
      b = '#ff9a76'; d = '#d9643f'; var st = '#f4f1ea'; hy = -53 + m.k * 2.5;
      E(c, 0, -0.6, 15 - m.k * 2, 1.8, 'rgba(0,0,0,0.16)'); c.save(); c.translate(0, -8 - Math.sin(m.t * 3) * 1.2 - m.k * 1.5); /* jet boots: it hovers */
      for (i = -1; i <= 1; i += 2) { c.save(); c.translate(i * 9, -3); c.scale(1, -1); K.flame(c, 0, 0, 5.5, 5 + m.k * 4, m.t, i); c.restore(); R(c, i * 9 - 7, -12, 14, 9, 3.4, p.accent); L(c, i * 8, -20, i * 9, -11, 9, shade(st, -0.34)); L(c, i * 8, -20, i * 9, -11, 7.4, st); }
      for (i = -1; i <= 1; i += 2) arm(c, i * 15, -36, i, i < 0 ? aa[0] : aa[1], 14, 7, st, p.accent, 4.2);
      R(c, -15.5, -41, 31, 25, 9, st); R(c, -8, -33, 16, 10, 2.5, '#3b4664');
      for (i = 0; i < 3; i++) dot(c, -4.5 + i * 4.5, -28, 1.4, [(m.n % 3 === i) ? p.gold : '#6b7694', (m.n % 3 === i) ? p.accent : '#6b7694', (m.n % 3 === i) ? p.accent2 : '#6b7694'][i]);
      R(c, -12, -44.5, 24, 5.5, 2.7, p.accent);
      for (i = -1; i <= 1; i += 2) { var ex2 = hx + i * 9 + m.sw * 2, ey2 = hy - 21 - m.k * 2; limb(c, hx + i * 5, hy - 9, hx + i * 6, hy - 16, ex2, ey2 + 4, 2.6, b); E(c, ex2, ey2, 5, 5, '#ffffff'); if (blinks(m)) L(c, ex2 - 3, ey2, ex2 + 3, ey2, 1.3, INK); else { dot(c, ex2 + m.sw, ey2 + 0.4, 2.4, INK); dot(c, ex2 + m.sw + 0.8, ey2 - 0.6, 0.8, '#fff'); } }
      E(c, hx, hy, 13.5, 11.5, b);
      for (i = 0; i < 3; i++) dot(c, hx - 8 + i * 3, hy - 6 + (i % 2) * 2.4, 1.3, d);
      blush(c, hx, hy + 2, 9.5, 2.3); mouth(c, hx, hy + 4.6, 4.4, m, shade(d, -0.5));
      c.beginPath(); c.arc(hx, hy - 6, 24, 0, TAU); c.fillStyle = 'rgba(190,230,255,0.22)'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke(); /* bubble helmet */
      c.beginPath(); c.arc(hx, hy - 6, 20, PI * 1.12, PI * 1.42); c.lineWidth = 2.4; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke();
      c.restore();
    }
  }, { wide: 1.0, variants: ['sprout', 'wobbler', 'stargazer', 'bubble'] });

  /* ---------- monster: four friendly fuzzy ones: 0 round with horns, 1 tall one-eyed, 2 wide three-eyed, 3 pear with antlers ---------- */
  function grin(c, x, y, w, open, teeth, under) { /* a wide monster smile; teeth up top, or an underbite */
    var dp = w * (0.28 + open * 0.75), i;
    c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y + dp * 2, x + w, y); c.quadraticCurveTo(x, y + w * 0.22, x - w, y); c.closePath(); c.fillStyle = '#4a2440'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#4a2440'; c.stroke();
    if (open > 0.12) dot(c, x, y + dp * 0.95, w * 0.3, '#e8707e');
    for (i = 0; i < teeth.length; i++) { if (under) Pg(c, [[x + teeth[i] * w - 1.7, y + dp * 0.55 + 1.2], [x + teeth[i] * w, y + dp * 0.55 - 3.4], [x + teeth[i] * w + 1.7, y + dp * 0.55 + 1.2]], '#fff', true); else Rn(c, x + teeth[i] * w - 1.7, y + w * 0.1, 3.4, 3.4, 0.8, '#fff'); }
  }
  Art.add('character', 'monster', function (c, m, p) {
    var v = m.v, aa = armAngles(m, 1.5, 0.7), hx = m.sw * 2, i, j, b, d, l, h, by;
    if (v === 0) { /* a big round teal one */
      b = '#3fbfb2'; d = '#2a8f8c'; l = '#bdeee3'; by = -37 + m.k * 2;
      for (i = -1; i <= 1; i += 2) { E(c, i * 14, -4.5, 12, 6, d); for (j = -1; j <= 1; j++) E(c, i * 14 + j * 6 + i * 2, -2.6, 2.6, 2.4, l); }
      for (i = -1; i <= 1; i += 2) { h = arm(c, i * 27, by - 4, i, i < 0 ? aa[0] : aa[1], 19, 9, b, b, 5.4); for (j = -1; j <= 1; j++) dot(c, h[0] + j * 3 + i, h[1] + 2.6 * (m.wave && i > 0 ? -1 : 1), 1.4, l); }
      for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(hx + i * 11, by - 28); c.quadraticCurveTo(hx + i * 13, by - 42, hx + i * 23, by - 45 - m.k * 2); c.quadraticCurveTo(hx + i * 22, by - 33, hx + i * 20, by - 24); c.closePath(); F(c, '#fbe9c3'); L(c, hx + i * 15.5, by - 35, hx + i * 20, by - 34, 1, '#d9c08c'); }
      fuzz(c, 0, by, 29, 30, 13, 0.1, b, m.sw * 0.04);
      c.beginPath(); c.ellipse(0, by + 11, 17, 15, 0, 0, TAU); c.fillStyle = l; c.fill();
      c.lineWidth = 1.2; c.strokeStyle = d; for (i = 0; i < 5; i++) { var fx = [-21, 20, -17, 22, 0][i], fy = by + [-6, -2, 12, 12, -25][i]; c.beginPath(); c.moveTo(fx - 3, fy); c.lineTo(fx, fy + 4); c.lineTo(fx + 3, fy); c.stroke(); }
      for (i = -1; i <= 1; i += 2) E(c, hx + i * 8.5, by - 12, 7, 7.5, '#ffffff');
      eyes(c, hx + m.sw, by - 11.5, 8.5, 3, m);
      for (i = -1; i <= 1; i += 2) L(c, hx + i * 4, by - 21.5, hx + i * 13, by - 22.5 - m.k * 1.5, 2.2, d);
      blush(c, hx, by - 2, 18, 3.2, 'rgba(255,160,180,0.65)'); grin(c, hx, by + 0.5, 11, m.open, [0.35], false);
    } else if (v === 1) { /* a tall pink shaggy one with one eye and stripy socks */
      b = '#f58ab5'; d = '#d05a8d'; l = '#ffd3e4'; by = -46 + m.k * 2;
      for (i = -1; i <= 1; i += 2) { L(c, i * 8, -20, i * 8.5, -6, 7.6, shade('#fff', -0.34)); L(c, i * 8, -20, i * 8.5, -6, 6, '#ffffff'); for (j = 0; j < 3; j++) L(c, i * 8.3 - 3, -17 + j * 4.2, i * 8.3 + 3, -17 + j * 4.2, 1.8, p.accent2); E(c, i * 10, -3.4, 9, 4.2, d); }
      for (i = -1; i <= 1; i += 2) { var ar = i < 0 ? aa[0] : aa[1]; h = arm(c, i * 18, by - 8, i, ar, 22, 7.5, b, l, 4.4); for (j = 0; j < 3; j++) dot(c, h[0] + (j - 1) * 2.6 + i, h[1] + (m.wave && i > 0 ? -2.6 : 2.6), 1.2, d); }
      for (i = -1; i <= 1; i += 2) { c.save(); c.translate(hx + i * 10, by - 36); c.rotate(i * 0.35 + m.sw * 0.08); Pg(c, [[-4, 2], [0, -15 - m.k * 2], [4, 2]], p.gold); c.save(); c.clip(); for (j = 0; j < 3; j++) L(c, -5, -2 - j * 4.6, 5, -3.5 - j * 4.6, 1.8, p.accent); c.restore(); c.restore(); }
      c.beginPath(); c.moveTo(hx, by - 40); c.bezierCurveTo(hx + 24, by - 40, 23, by + 4, 21, -19); c.lineTo(15, -13); c.lineTo(10.5, -20); c.lineTo(5, -13); c.lineTo(0, -20); c.lineTo(-5, -13); c.lineTo(-10.5, -20); c.lineTo(-15, -13); c.lineTo(-21, -19); c.bezierCurveTo(-23, by + 4, hx - 24, by - 40, hx, by - 40); c.closePath(); F(c, b);
      c.lineWidth = 1.2; c.strokeStyle = d; for (i = 0; i < 6; i++) { var gx = [-13, 12, -15, 14, -4, 6][i], gy = [-56, -60, -34, -38, -28, -26][i] + m.k * 2; c.beginPath(); c.moveTo(gx - 3, gy); c.lineTo(gx, gy + 4); c.lineTo(gx + 3, gy); c.stroke(); }
      for (i = -1; i <= 1; i++) tri(c, hx + i * 5, by - 39 + Math.abs(i) * 1.5, 6, 8 - Math.abs(i) * 2, i * 0.4 + m.sw * 0.15, b);
      E(c, hx, by - 20, 11.5, 11.5, '#ffffff');
      if (blinks(m)) { c.beginPath(); c.arc(hx, by - 21, 7, 0.15 * PI, 0.85 * PI); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
      else { dot(c, hx + m.sw * 2, by - 19.5, 6.2, '#5a8fd0'); dot(c, hx + m.sw * 2, by - 19.5, 3.4, INK); dot(c, hx + m.sw * 2 + 2.2, by - 22, 1.9, '#fff'); }
      L(c, hx - 9, by - 34 - m.k * 1.5, hx + 9, by - 34.5 - m.k * 1.5, 2.2, d);
      blush(c, hx, by - 6, 14, 2.8); grin(c, hx, by - 4, 8, m.open, [-0.4, 0.4], false);
    } else if (v === 2) { /* a wide orange spotted one with three eyes and an underbite */
      b = '#ff9f43'; d = '#d8721c'; l = '#ffe2b0'; by = -27 + m.k * 2;
      limb(c, 20, -10, 34, -8, 36, -22 + m.sw * 3, 4.5, b); tri(c, 36, -22 + m.sw * 3, 7, 8, 0.2, d);
      for (i = -1; i <= 1; i += 2) { E(c, i * 15, -4, 12, 5.4, d); for (j = -1; j <= 1; j++) dot(c, i * 15 + j * 5.6 + i * 2, -1.6, 1.7, l); }
      for (i = -1; i <= 1; i += 2) arm(c, i * 27, by - 2, i, i < 0 ? aa[0] : aa[1], 15, 8, b, l, 4.6);
      for (i = -1; i <= 1; i++) { var ox = hx + i * 14, oy = by - 31 - (i ? 0 : 6) - m.k * (i ? 2 : 3.5); L(c, i * 12, by - 18, ox, oy + 5, 6.6, shade(b, -0.34)); L(c, i * 12, by - 18, ox, oy + 5, 5, b); E(c, ox, oy, 7.5, 7.5, '#ffffff'); if (blinks(m)) L(c, ox - 4.4, oy, ox + 4.4, oy, 1.6, INK); else { dot(c, ox + m.sw * 1.6, oy + 0.6, 3.6, INK); dot(c, ox + m.sw * 1.6 + 1.3, oy - 0.9, 1.2, '#fff'); } }
      fuzz(c, 0, by, 30, 22, 14, 0.09, b, 0.1);
      for (i = 0; i < 7; i++) dot(c, [-21, -13, -23, 20, 14, 23, 0][i], by + [-6, -14, 6, -8, -15, 5, -17][i], [3, 2, 2.2, 2.8, 1.8, 2.2, 2][i], d);
      c.beginPath(); c.ellipse(0, by + 12, 15, 8, 0, 0, TAU); c.fillStyle = l; c.fill();
      blush(c, hx, by - 3, 19, 3.2); grin(c, hx, by - 3, 12, m.open, [-0.5, 0.5], true);
    } else { /* a purple pear with polka dots, antlers and a bow tie */
      b = '#8f7be8'; d = '#6652c0'; l = '#d8d0ff'; by = -30 + m.k * 2;
      for (i = -1; i <= 1; i += 2) { E(c, i * 12, -4, 10.5, 5.2, d); for (j = -1; j <= 1; j++) dot(c, i * 12 + j * 5 + i * 1.5, -1.6, 1.6, l); }
      for (i = -1; i <= 1; i += 2) arm(c, i * 19, by - 14, i, i < 0 ? aa[0] : aa[1], 18, 6.5, b, l, 4);
      for (i = -1; i <= 1; i += 2) { var ax = hx + i * 8, ay = by - 44; limb(c, ax, ay, ax + i * 3, ay - 12, ax + i * 12, ay - 19 - m.k * 2, 2.6, '#fbe9c3'); L(c, ax + i * 3.4, ay - 9, ax - i * 2, ay - 16 - m.k * 2, 2.2, '#fbe9c3'); L(c, ax + i * 7.5, ay - 15, ax + i * 14, ay - 12 - m.k, 2.2, '#fbe9c3'); }
      c.beginPath(); c.moveTo(hx, by - 48); c.bezierCurveTo(hx + 17, by - 48, 15, by - 22, 23, by - 4); c.bezierCurveTo(30, by + 14, 18, -7, 0, -7); c.bezierCurveTo(-18, -7, -30, by + 14, -23, by - 4); c.bezierCurveTo(-15, by - 22, hx - 17, by - 48, hx, by - 48); c.closePath(); F(c, b);
      for (i = 0; i < 8; i++) dot(c, [-16, 15, -8, 9, -19, 20, 0, -11][i], by + [2, -1, 12, 14, 14, 13, 4, -12][i], [3, 2.6, 2.2, 3, 2, 2.2, 2.4, 1.8][i], i % 2 ? l : p.gold);
      for (i = -1; i <= 1; i++) tri(c, hx + i * 4, by - 47 + Math.abs(i), 4.5, 6, i * 0.5 + m.sw * 0.2, b);
      K.bow(c, 0, by - 14, 13, p.accent2);
      E(c, hx - 6.5, by - 33, 6.5, 7, '#ffffff'); E(c, hx + 6.5, by - 32, 5, 5.4, '#ffffff');
      if (blinks(m)) { L(c, hx - 10, by - 33, hx - 3, by - 33, 1.6, INK); L(c, hx + 3.6, by - 32, hx + 9.4, by - 32, 1.6, INK); }
      else { dot(c, hx - 6 + m.sw * 1.5, by - 32.4, 3.2, INK); dot(c, hx - 5 + m.sw * 1.5, by - 33.6, 1.1, '#fff'); dot(c, hx + 6.8 + m.sw * 1.2, by - 31.6, 2.5, INK); dot(c, hx + 7.6 + m.sw * 1.2, by - 32.6, 0.9, '#fff'); }
      blush(c, hx, by - 24, 12.5, 2.6); grin(c, hx, by - 23.5, 7.5, m.open, [0], true);
    }
  }, { wide: 1.05, variants: ['tuft', 'cyclops', 'triclops', 'antlers'] });

  /* ---------- gnome: 0 mushroom-keeper, 1 lantern-bearer, 2 braids and a sunflower, 3 digger with a floppy hat ---------- */
  Art.add('character', 'gnome', function (c, m, p) {
    var v = m.v, sk = SKIN[[0, 2, 1, 3][v]], hat = [p.accent, '#3f7fd0', p.accent2, '#e0a52c'][v], coat = ['#3f6fb5', '#7a4f8f', '#f3a6b8', '#4f8f5a'][v], beard = ['#ffffff', '#cfd3da', '', '#d9853a'][v];
    var hx = m.sw * 2, hy = -47 + m.k * 2, aa = armAngles(m, 1.1, 0.6), i, h;
    for (i = -1; i <= 1; i += 2) { L(c, i * 6, -14, i * 7, -6, 7, '#4a4f6a'); E(c, i * 9, -3.6, 9, 4.4, '#6b4226'); dot(c, i * 13, -4.6, 1.4, '#8a5a34'); }
    /* the hand that holds the thing (left) and the one that waves (right) */
    h = arm(c, -14, -36, -1, m.wave ? 1.2 : Math.max(0.9, aa[0]), 13, 6.6, coat, sk, 3.6);
    c.save(); c.translate(h[0] - 1, h[1]); c.rotate(m.sw * 0.1);
    if (v === 0) { R(c, -2.6, -11, 5.2, 12, 2.2, '#fff3dc'); c.beginPath(); c.moveTo(-10, -9); c.quadraticCurveTo(-9, -22, 0, -22); c.quadraticCurveTo(9, -22, 10, -9); c.quadraticCurveTo(0, -6, -10, -9); c.closePath(); F(c, '#e0453a'); dot(c, -4, -14, 2, '#fff'); dot(c, 3.6, -17, 1.7, '#fff'); dot(c, 5.4, -11.6, 1.3, '#fff'); }
    else if (v === 1) { c.globalAlpha = 0.3 + m.k * 0.35; dot(c, 0, 9, 11 + m.k * 3, p.gold); c.globalAlpha = 1; c.beginPath(); c.arc(0, 2.5, 3.4, PI, TAU); c.lineWidth = 1.1; c.strokeStyle = '#4a4f6a'; c.stroke(); R(c, -4.6, 3, 9.2, 12, 2, '#fff1b8'); K.flame(c, 0, 13, 3.6, 6.5, m.t, 1); Rn(c, -5.6, 2, 11.2, 2.4, 1, '#4a4f6a'); Rn(c, -5.6, 14, 11.2, 2.6, 1, '#4a4f6a'); L(c, -4.6, 4, -4.6, 14, 0.9, '#4a4f6a'); L(c, 4.6, 4, 4.6, 14, 0.9, '#4a4f6a'); }
    else if (v === 2) { L(c, 0, 6, 0, -22, 1.8, '#3f9a5c'); K.leaf(c, 0, -6, 8, -0.6, '#57b36f'); K.leaf(c, 0, -10, 7, PI + 0.6, '#57b36f'); for (i = 0; i < 10; i++) { c.save(); c.translate(0, -24); c.rotate(i / 10 * TAU + m.t * 0.5); E(c, 0, -6.4, 2.4, 4, '#ffcf3f'); c.restore(); } E(c, 0, -24, 4.2, 4.2, '#7a4a22'); }
    else { L(c, 0, 14, 0, -18, 2.4, shade('#a8743f', -0.34)); L(c, 0, 14, 0, -18, 1.4, '#a8743f'); c.beginPath(); c.moveTo(-5.5, -18); c.lineTo(5.5, -18); c.lineTo(5, -27); c.quadraticCurveTo(0, -33, -5, -27); c.closePath(); F(c, '#c3ccd6'); L(c, -1.6, -20, -1.6, -27, 0.9, '#ffffff'); R(c, -3, 12, 6, 3.4, 1.4, '#a8743f'); }
    c.restore();
    c.beginPath(); c.moveTo(-12, -42); c.quadraticCurveTo(-18, -26, -18, -10); c.quadraticCurveTo(0, -5, 18, -10); c.quadraticCurveTo(18, -26, 12, -42); c.closePath(); F(c, coat);
    if (v === 2) { c.beginPath(); c.moveTo(-9, -30); c.lineTo(9, -30); c.quadraticCurveTo(13, -18, 12, -8.6); c.quadraticCurveTo(0, -6, -12, -8.6); c.quadraticCurveTo(-13, -18, -9, -30); c.closePath(); F(c, '#fffaf0'); K.heartPath(c, 0, -17, 6); c.fillStyle = p.accent; c.fill(); }
    else { Rn(c, -18, -19.5, 36, 4.6, 1.5, '#4a2f1c'); R(c, -3.6, -20.6, 7.2, 6.8, 1.4, p.gold); }
    arm(c, 14, -36, 1, waveA(m, aa[1]), 13, 6.6, coat, sk, 3.6);
    if (v === 2) for (i = -1; i <= 1; i += 2) { c.save(); c.translate(hx + i * 12, hy + 3); c.rotate(-i * 0.15 + m.sw * 0.14); for (h = 0; h < 4; h++) E(c, 0, 3 + h * 5, 3.8 - h * 0.3, 3.4, HAIR[2]); K.bow(c, 0, 23, 7, p.accent); c.restore(); }
    for (i = -1; i <= 1; i += 2) E(c, hx + i * 12.4, hy, 2.8, 3.4, sk);
    E(c, hx, hy, 12.5, 11.5, sk);
    if (beard) { /* the beard, and a moustache over it */
      c.beginPath(); c.moveTo(hx - 12.6, hy - 1); c.quadraticCurveTo(hx - 16, hy + 14, hx - 7 + m.sw, hy + 22); c.quadraticCurveTo(hx + m.sw * 1.5, v === 1 ? hy + 36 : hy + 29, hx + 7 + m.sw, hy + 22); c.quadraticCurveTo(hx + 16, hy + 14, hx + 12.6, hy - 1); c.quadraticCurveTo(hx + 6, hy + 6, hx, hy + 5); c.quadraticCurveTo(hx - 6, hy + 6, hx - 12.6, hy - 1); c.closePath(); F(c, beard);
      c.lineWidth = 0.8; c.strokeStyle = shade(beard, -0.14); for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(hx + i * 5, hy + 12); c.quadraticCurveTo(hx + i * 5.5, hy + 18, hx + i * 3 + m.sw, hy + 23); c.stroke(); }
      if (v === 1) { R(c, hx - 3 + m.sw * 1.4, hy + 27, 6, 3.2, 1.4, p.accent); }
      mouth(c, hx, hy + 10.5, 4, m, '#5a3a35');
      for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(hx, hy + 5.5); c.quadraticCurveTo(hx + i * 6, hy + 3.5, hx + i * 11.5, hy + 8 - m.k); c.quadraticCurveTo(hx + i * 5, hy + 10.5, hx, hy + 7.8); c.closePath(); F(c, shade(beard, v === 3 ? -0.1 : -0.04)); }
    } else mouth(c, hx, hy + 8, 4, m, shade(sk, -0.55));
    eyes(c, hx, hy - 1.6, 6.4, 2, m); blush(c, hx, hy + 3.6, 9.6, 2.5);
    E(c, hx, hy + 3.6, 4.4, 3.8, mix(sk, '#e8707e', 0.3)); dot(c, hx - 1.2, hy + 2.4, 1.1, 'rgba(255,255,255,0.6)');
    /* the hat: tall, with a tip that follows a beat behind */
    var tx = hx + (v === 3 ? 15 : 0) - m.sw * 5, ty = hy - (v === 3 ? 32 : 50) + m.k * 2.5;
    c.beginPath(); c.moveTo(hx - 15.5, hy - 5); c.quadraticCurveTo(hx - 8, hy - 26, tx, ty);
    if (v === 3) c.quadraticCurveTo(hx + 4, hy - 46, hx + 15.5, hy - 5); else c.quadraticCurveTo(hx + 8, hy - 26, hx + 15.5, hy - 5);
    c.quadraticCurveTo(hx, hy - 10.5, hx - 15.5, hy - 5); c.closePath(); F(c, hat);
    c.beginPath(); c.moveTo(hx - 15.5, hy - 5); c.quadraticCurveTo(hx, hy - 10.5, hx + 15.5, hy - 5); c.lineWidth = 3.4; c.strokeStyle = shade(hat, -0.2); c.stroke();
    if (v === 0) { dot(c, hx - 3, hy - 22, 1.8, shade(hat, 0.45)); dot(c, hx + 4, hy - 15.5, 1.5, shade(hat, 0.45)); dot(c, hx + 0.5, hy - 33, 1.2, shade(hat, 0.45)); }
    if (v === 1) { star(c, hx - 2, hy - 20, 3.6, p.gold, 0.2); star(c, hx + 5, hy - 13.5, 2, p.gold, 0.5); K.crescent(c, hx + 1.5, hy - 31, 2.6, p.gold); }
    if (v === 2) { K.flower(c, hx + 8.6, hy - 10.5, 4.4, '#ffffff', '#ffcf3f', m.t * 0.3); K.flower(c, hx + 2, hy - 11.6, 3, p.gold, '#fff3c4', 1); }
    if (v === 3) { Rn(c, hx - 8, hy - 19, 6.4, 6, 1, shade(hat, -0.18)); L(c, hx - 8, hy - 16, hx - 1.6, hy - 16, 0.6, shade(hat, 0.4)); K.leaf(c, hx + 10, hy - 10, 13, -1.25 + m.sw * 0.1, p.accent); dot(c, tx, ty, 2.6, shade(hat, 0.4)); }
  }, { wide: 0.9, variants: ['mushroom', 'lantern', 'sunflower', 'digger'] });

  /* ---------- fairy: 0 butterfly wings and a bun, 1 dragonfly wings and curls, 2 leaf wings and long hair, 3 round dewdrop wings and bunches ---------- */
  var FCOL = ['#ff8ac0', '#7fc4ff', '#7ccf6a', '#ffc94a'], FWING = ['#ffc2e2', '#c9f0ff', '#b9e88a', '#fff0b0'];
  Art.add('character', 'fairy', function (c, m, p) {
    var v = m.v, sk = SKIN[[1, 3, 0, 2][v]], hr = HAIR[[3, 1, 2, 0][v]], dr = FCOL[v], wg = FWING[v], hx = m.sw * 2, hy = -68 + m.k * 2, aa = armAngles(m, 1.3, 0.7), i, j, h;
    var flap = 1 - m.k * 0.3 + Math.sin(m.t * 5) * 0.05, wline = shade(dr, -0.2);
    for (i = -1; i <= 1; i += 2) { /* wings */
      c.save(); c.translate(i * 5, -47); c.scale(i * flap, 1); c.globalAlpha = 0.86; c.lineWidth = 1; c.strokeStyle = wline;
      if (v === 0) { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(8, -34, 38, -34, 31, -9); c.bezierCurveTo(29, -2, 12, 2, 0, 0); c.fillStyle = wg; c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(14, 2, 27, 8, 21, 19); c.bezierCurveTo(14, 26, 3, 14, 0, 0); c.fillStyle = shade(wg, 0.3); c.fill(); c.stroke(); dot(c, 23, -17, 4, alpha(dr, 0.7)); dot(c, 15, 11, 2.6, alpha(p.gold, 0.8)); }
      else if (v === 1) { for (j = 0; j < 2; j++) { c.save(); c.rotate(-0.55 + j * 0.75); c.beginPath(); c.ellipse(19, 0, 19 - j * 3, 5.6 - j, 0, 0, TAU); c.fillStyle = j ? shade(wg, 0.35) : wg; c.fill(); c.stroke(); L(c, 3, 0, 32 - j * 5, 0, 0.6, wline); c.restore(); } }
      else if (v === 2) { for (j = 0; j < 2; j++) { c.save(); c.rotate(-0.75 + j * 1.05); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(15 - j * 3, -13 + j * 3, 34 - j * 9, 0); c.quadraticCurveTo(15 - j * 3, 13 - j * 3, 0, 0); c.fillStyle = j ? shade(wg, 0.25) : wg; c.fill(); c.stroke(); L(c, 2, 0, 30 - j * 9, 0, 0.7, wline); for (h = 1; h < 4; h++) { L(c, h * 7, 0, h * 7 + 4, -4.4 + j, 0.5, wline); L(c, h * 7, 0, h * 7 + 4, 4.4 - j, 0.5, wline); } c.restore(); } }
      else { c.beginPath(); c.arc(19, -11, 14.5, 0, TAU); c.fillStyle = wg; c.fill(); c.stroke(); c.beginPath(); c.arc(15, 11, 9.5, 0, TAU); c.fillStyle = shade(wg, 0.4); c.fill(); c.stroke(); c.beginPath(); c.arc(19, -11, 10, PI * 1.1, PI * 1.6); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke(); }
      c.globalAlpha = 1; c.restore();
    }
    for (i = -1; i <= 1; i += 2) { L(c, i * 4.5, -24, i * 5.5, -5, 4.6, shade(sk, -0.34)); L(c, i * 4.5, -24, i * 5.5, -5, 3.2, sk); E(c, i * 7.2, -3, 6, 3.2, shade(dr, -0.12)); dot(c, i * 11.6, -4.4, 1.7, p.gold); }
    /* wand hand */
    h = arm(c, -9.5, -49, -1, m.wave ? 1.5 : Math.max(1.0, aa[0] + 0.3), 15, 3.8, sk, sk, 2.6);
    c.save(); c.translate(h[0], h[1]); c.rotate(-0.45 + m.sw * 0.25); L(c, 0, 3, 0, -15, 1.3, '#8a6a3a'); star(c, 0, -17, 5.6 + m.k * 1.4, p.gold, m.t * 0.8); c.restore();
    for (j = 0; j < 4; j++) { var f = frac(m.t * 0.6 + j * 0.25), sa = j * 2.4 + 0.6; spark(c, h[0] - 6 + Math.cos(sa) * (5 + f * 13), h[1] - 15 + Math.sin(sa) * (5 + f * 13) + f * 5, 2.6 * (1 - f) + 0.5, j % 2 ? p.snow : p.gold, 1 - f); }
    for (i = -2; i <= 2; i++) { c.save(); c.translate(i * 4.2, -37); c.rotate(-i * 0.3 + m.sw * 0.07 * (2 - Math.abs(i))); E(c, 0, 9.5, 5, 10.5, i % 2 ? shade(dr, 0.26) : dr); c.restore(); } /* petal skirt */
    c.beginPath(); c.moveTo(-8.5, -51.5); c.quadraticCurveTo(-10, -42, -9, -35.5); c.quadraticCurveTo(0, -32.5, 9, -35.5); c.quadraticCurveTo(10, -42, 8.5, -51.5); c.quadraticCurveTo(0, -47.5, -8.5, -51.5); c.closePath(); F(c, shade(dr, -0.1));
    R(c, -9.6, -38.4, 19.2, 3.6, 1.8, p.gold); if (v % 2) { K.heartPath(c, 0, -43.5, 4.4); c.fillStyle = p.paper; c.fill(); } else star(c, 0, -43.6, 2.6, p.paper, 0);
    arm(c, 9.5, -49, 1, waveA(m, aa[1]), 15, 3.8, sk, sk, 2.6);
    if (v === 2) K.hairdo(c, hx, hy, 13.6, hr, 2);
    if (v === 3) for (i = -1; i <= 1; i += 2) { c.save(); c.translate(hx + i * 13, hy - 3); c.rotate(-i * 0.5 + m.sw * 0.2); E(c, 0, 6, 5, 8, hr); c.restore(); dot(c, hx + i * 12.6, hy - 4, 2, p.accent); }
    Pg(c, [[hx - 11, hy - 3], [hx - 17.5, hy - 6.5], [hx - 11.5, hy + 3.5]], sk); Pg(c, [[hx + 11, hy - 3], [hx + 17.5, hy - 6.5], [hx + 11.5, hy + 3.5]], sk); /* pointed ears */
    K.head(c, hx, hy, 12.6, sk, m);
    K.hairdo(c, hx, hy, 12.6, hr, [3, 1, 0, 0][v]);
    if (v === 0) { for (i = -1; i <= 1; i++) K.flower(c, hx + i * 6.5, hy - 10.5 + Math.abs(i) * 1.6, 3, i ? '#ffffff' : p.gold, '#ffd54a', i + m.t * 0.2); }
    else if (v === 1) { c.beginPath(); c.moveTo(hx - 7, hy - 11.5); c.lineTo(hx - 6, hy - 17); c.lineTo(hx - 3, hy - 13.5); c.lineTo(hx, hy - 18.5 - m.k); c.lineTo(hx + 3, hy - 13.5); c.lineTo(hx + 6, hy - 17); c.lineTo(hx + 7, hy - 11.5); c.closePath(); F(c, p.gold); dot(c, hx, hy - 14, 1.1, p.accent); }
    else if (v === 2) { for (i = -2; i <= 2; i++) K.leaf(c, hx + i * 4.6, hy - 11.6 + Math.abs(i) * 1.4, 6.5, -PI / 2 + i * 0.4, i % 2 ? '#57b36f' : '#7ccf6a'); }
    else { K.bow(c, hx + 6, hy - 12, 9, p.accent); }
  }, { wide: 0.95, variants: ['butterfly', 'dragonfly', 'leaf', 'dewdrop'] });

  /* ---------- wizard: 0 the elder with a staff, 1 the sorceress with a wand, 2 the seer with a crystal ball, 3 the apprentice in a hat too big ---------- */
  Art.add('character', 'wizard', function (c, m, p) {
    var v = m.v, sk = SKIN[[0, 2, 3, 1][v]], robe = ['#3f5fbf', '#8a4fb0', '#2f8f8a', '#d8573f'][v], trim = [p.gold, '#ffd9f2', p.gold, '#ffe08a'][v], hr = ['#ffffff', '#2a1d2e', '#b9bcc6', '#c8622a'][v];
    var sc = v === 3 ? 0.86 : 1, hx = m.sw * 2, hy = -65 + m.k * 2, aa = armAngles(m, 1.0, 0.5), i, j, h, f;
    c.save(); c.scale(sc, sc);
    for (i = -1; i <= 1; i += 2) E(c, i * 8, -2.8, 8, 3.6, v === 1 ? '#3a2a4a' : '#6b4226');
    if (v === 1) { c.beginPath(); c.moveTo(hx - 13, hy - 4); c.quadraticCurveTo(hx - 22, hy + 14, hx - 16 + m.sw * 2, hy + 30); c.quadraticCurveTo(hx, hy + 24, hx + 16 + m.sw * 2, hy + 30); c.quadraticCurveTo(hx + 22, hy + 14, hx + 13, hy - 4); c.closePath(); F(c, hr); }
    /* left hand holds the staff, the wand's partner book, the crystal ball or nothing */
    if (v === 0) { var sx = -24 + m.sw * 1.5; L(c, sx + 1, 0, sx - 1, -78, 4, shade('#8f6238', -0.34)); L(c, sx + 1, 0, sx - 1, -78, 2.5, '#8f6238'); c.beginPath(); c.arc(sx - 1, -82, 6.2, PI * 0.2, PI * 0.8, true); c.lineWidth = 2.6; c.strokeStyle = '#8f6238'; c.stroke(); c.globalAlpha = 0.3 + m.k * 0.4; dot(c, sx - 1, -83, 10 + m.k * 4, p.gold); c.globalAlpha = 1; E(c, sx - 1, -83, 5, 5, mix(p.gold, '#ffffff', 0.35)); dot(c, sx - 2.6, -84.8, 1.5, '#fff'); arm(c, -13, -50, -1, 1.25, 12, 7.5, robe, sk, 3.4); }
    else { h = arm(c, -13, -50, -1, m.wave ? 1.3 : Math.max(1.05, aa[0] + 0.4), 13, 7.5, robe, sk, 3.4);
      if (v === 2) { c.globalAlpha = 0.28 + m.k * 0.35; dot(c, h[0] - 2, h[1] - 8, 12 + m.k * 3, p.accent2); c.globalAlpha = 1; E(c, h[0] - 2, h[1] - 8, 7.6, 7.6, '#bfe9ff'); c.save(); c.beginPath(); c.arc(h[0] - 2, h[1] - 8, 7, 0, TAU); c.clip(); for (j = 0; j < 3; j++) { var qa = m.t * 1.4 + j * 2.1; dot(c, h[0] - 2 + Math.cos(qa) * 3.4, h[1] - 8 + Math.sin(qa) * 3.4, 2.8, ['#c79bff', '#ffffff', '#8fe3ff'][j]); } c.restore(); dot(c, h[0] - 4.6, h[1] - 11, 1.6, 'rgba(255,255,255,0.9)'); R(c, h[0] - 6, h[1] - 1.6, 8, 3, 1.4, p.gold); }
      else if (v === 1) { c.save(); c.translate(h[0] - 3, h[1] - 6 - m.k * 2); c.rotate(-0.12 + m.sw * 0.08); Pg(c, [[-9, -5.5], [0, -4], [9, -5.5], [9, 5], [0, 6.5], [-9, 5]], shade(p.accent, -0.15)); Pg(c, [[-7.6, -6.6], [0, -5], [0, 5.5], [-7.6, 4]], p.paper); Pg(c, [[7.6, -6.6], [0, -5], [0, 5.5], [7.6, 4]], p.paper); star(c, 3.8, -0.6, 2, p.gold, 0); for (j = 0; j < 2; j++) L(c, -6, -3 + j * 2.6, -1.6, -2.2 + j * 2.6, 0.5, '#9a8f84'); c.restore(); }
    }
    c.beginPath(); c.moveTo(-12, -55); c.quadraticCurveTo(-17, -30, -21, -3); c.quadraticCurveTo(0, 1.5, 21, -3); c.quadraticCurveTo(17, -30, 12, -55); c.closePath(); F(c, robe); /* the robe */
    c.save(); c.clip(); c.fillStyle = trim; c.fillRect(-24, -8.5, 48, 2.6);
    for (i = 0; i < 5; i++) { var px = [-12, 9, -5, 13, 2][i], py = [-18, -24, -30, -13, -15][i]; if (v === 3 && i % 2) K.crescent(c, px, py, 2.4, trim); else if (v === 2) { dot(c, px, py, 1.3, trim); c.beginPath(); c.arc(px, py, 2.8, 0, TAU); c.lineWidth = 0.6; c.strokeStyle = trim; c.stroke(); } else { K.starPath(c, px, py, 2.4, 1.1, 5, i); c.fillStyle = trim; c.fill(); } }
    c.restore();
    Rn(c, -14.6, -38.6, 29.2, 3.6, 1.6, shade(robe, -0.28)); R(c, -3, -39.6, 6, 5.6, 1.4, trim);
    /* the wand hand (right) */
    if (v === 0 || v === 2) arm(c, 13, -50, 1, waveA(m, aa[1]), 13, 7.5, robe, sk, 3.4);
    else { h = arm(c, 13, -50, 1, waveA(m, 1.75 + m.k * 0.5 - m.sw * 0.2), 13, 7.5, robe, sk, 3.4); c.save(); c.translate(h[0], h[1]); c.rotate(0.55 + m.sw * 0.3); L(c, 0, 3, 0, -15, 1.9, '#5a3a25'); L(c, 0, -12, 0, -15, 1.9, '#fff'); c.restore();
      var wx = h[0] + Math.sin(0.55 + m.sw * 0.3) * 16, wy = h[1] - Math.cos(0.55 + m.sw * 0.3) * 16; for (j = 0; j < 5; j++) { f = frac(m.t * 0.8 + j * 0.2); var wa = -0.9 + j * 1.3; spark(c, wx + Math.cos(wa) * f * 13, wy + Math.sin(wa) * f * 13 - f * 4, 3 * (1 - f) + 0.6, [p.gold, p.snow, trim][j % 3], 1 - f); } spark(c, wx, wy, 3.4 + m.k * 3, p.snow, 0.7 + m.k * 0.3); }
    for (i = -1; i <= 1; i += 2) E(c, hx + i * 12.4, hy + 1, 2.6, 3.2, sk);
    E(c, hx, hy, 12.6, 12, sk);
    if (v === 3) { for (i = -1; i <= 1; i += 2) { E(c, hx + i * 11.4, hy - 6, 3.6, 3.6, hr); E(c, hx + i * 13, hy - 1.5, 3, 3.2, hr); } for (i = -1; i <= 1; i++) E(c, hx + i * 5, hy - 10, 4, 3.4, hr); for (i = -1; i <= 1; i += 2) { dot(c, hx + i * 6.6, hy + 4.6, 0.6, shade(sk, -0.3)); dot(c, hx + i * 8.6, hy + 3.6, 0.6, shade(sk, -0.3)); } }
    if (v === 1) { c.beginPath(); c.moveTo(hx - 12.8, hy + 2); c.quadraticCurveTo(hx - 13, hy - 12, hx, hy - 12); c.quadraticCurveTo(hx + 13, hy - 12, hx + 12.8, hy + 2); c.quadraticCurveTo(hx + 8, hy - 7.5, hx, hy - 6.5); c.quadraticCurveTo(hx - 8, hy - 7.5, hx - 12.8, hy + 2); c.closePath(); F(c, hr); }
    if (v === 0 || v === 2) { /* beard: long and white, or short and grey */
      var bl = v === 0 ? 30 : 15;
      c.beginPath(); c.moveTo(hx - 12.8, hy); c.quadraticCurveTo(hx - 15, hy + bl * 0.55, hx - 5 + m.sw, hy + bl * 0.82); c.quadraticCurveTo(hx + m.sw * 2, hy + bl * 1.12, hx + 5 + m.sw, hy + bl * 0.82); c.quadraticCurveTo(hx + 15, hy + bl * 0.55, hx + 12.8, hy); c.quadraticCurveTo(hx + 6, hy + 6.5, hx, hy + 5.5); c.quadraticCurveTo(hx - 6, hy + 6.5, hx - 12.8, hy); c.closePath(); F(c, hr);
      if (v === 0) { c.lineWidth = 0.8; c.strokeStyle = shade(hr, -0.14); for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(hx + i * 5, hy + 12); c.quadraticCurveTo(hx + i * 5, hy + 20, hx + i * 2.4 + m.sw, hy + 26); c.stroke(); } }
      mouth(c, hx, hy + 10.4, 3.8, m, '#5a3a35');
      for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(hx, hy + 5.6); c.quadraticCurveTo(hx + i * 6, hy + 3.4, hx + i * 11, hy + 8 - m.k); c.quadraticCurveTo(hx + i * 5, hy + 10.4, hx, hy + 7.8); c.closePath(); F(c, shade(hr, -0.05)); }
      for (i = -1; i <= 1; i += 2) L(c, hx + i * 3.4, hy - 6.2, hx + i * 9.6, hy - 7.4 - m.k, 2, hr);
    } else mouth(c, hx, hy + 7.4, 4, m, shade(sk, -0.55));
    eyes(c, hx, hy - 1, 5.8, 1.9, m); blush(c, hx, hy + 3.8, 9, 2.4);
    if (v === 0 || v === 2) E(c, hx, hy + 3.4, 3, 2.7, mix(sk, '#e8707e', 0.25));
    if (v === 0) { c.lineWidth = 0.9; c.strokeStyle = p.gold; for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(hx + i * 5.8, hy - 0.4, 3.8, 0, PI); c.stroke(); } L(c, hx - 2, hy - 0.4, hx + 2, hy - 0.4, 0.9, p.gold); }
    if (v === 2) { c.lineWidth = 1; c.strokeStyle = '#2b2118'; for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(hx + i * 5.8, hy - 1, 4.2, 0, TAU); c.stroke(); } L(c, hx - 1.6, hy - 1, hx + 1.6, hy - 1, 1, '#2b2118'); }
    /* the hat: brim, a bent tip that trails the sway, and its own mark */
    var hb = v === 3 ? hy - 8.5 : hy - 8, tx = hx - m.sw * 5 + (v === 3 ? -9 : 7), ty = hb - (v === 3 ? 36 : 34) + m.k * 2.5, kx = hx - m.sw * 2 + (v === 3 ? 4 : -2), ky = hb - 25;
    c.beginPath(); c.moveTo(hx - 13, hb); c.quadraticCurveTo(hx - 8, hb - 14, kx, ky); c.quadraticCurveTo((kx + tx) / 2, ty - 3, tx, ty); c.quadraticCurveTo(kx + 7, ky + 2, hx + 13, hb); c.closePath(); F(c, robe);
    E(c, hx, hb, v === 1 ? 23 : v === 3 ? 20 : 18.5, 4.4, robe);
    c.beginPath(); c.ellipse(hx, hb - 2.6, 12.6, 2.6, 0, 0, PI); c.lineWidth = 3; c.strokeStyle = trim; c.stroke();
    if (v === 1) K.crescent(c, hx - 0.5, hb - 11, 3.6, trim); else if (v === 2) { dot(c, hx - 2, hb - 12, 1.6, trim); dot(c, hx + 3, hb - 17, 1.1, trim); dot(c, hx + 2.6, hb - 9, 0.9, trim); } else star(c, hx - 1, hb - 12.5, 3.6, trim, 0.2);
    if (v === 3) { Rn(c, hx + 3.4, hb - 21, 5.4, 5, 1, shade(robe, -0.2)); spark(c, tx, ty, 2.6 + m.k * 2, p.snow, 0.9); } else dot(c, tx, ty, 1.8, trim);
    c.restore();
  }, { wide: 0.95, variants: ['elder', 'sorceress', 'seer', 'apprentice'] });

  /* ---------- droid: 0 a one-wheeled roller, 1 a screen-faced box on treads, 2 a hovering saucer, 3 a tall tin can on springs ---------- */
  function claw(c, x, y, s, a, col) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.arc(0, 3.6, 3.6, PI * 0.15, PI * 0.85, true); c.lineWidth = 2.2 + K.ow(); c.strokeStyle = shade(col, -0.34); c.stroke(); c.lineWidth = 2.2; c.strokeStyle = col; c.stroke(); c.restore(); }
  Art.add('character', 'droid', function (c, m, p) {
    var v = m.v, aa = armAngles(m, 1.2, 0.8), hx = m.sw * 1.6, hy, i, j, h, a, mt = '#dfe6ea', dk = '#4a5568', bl = blinks(m);
    if (v === 0) { /* roller: a white egg on one wheel, one big eye */
      var w1 = '#f4f7fa', ac = p.accent2; hy = -62 + m.k * 2;
      E(c, 0, -0.8, 13, 2, 'rgba(0,0,0,0.16)');
      E(c, 0, -10, 10.5, 10.5, dk); E(c, 0, -10, 5.4, 5.4, mt); for (j = 0; j < 4; j++) { a = m.t * 4 + j * PI / 2; L(c, Math.cos(a) * 5.4, -10 + Math.sin(a) * 5.4, Math.cos(a) * 9, -10 + Math.sin(a) * 9, 1.4, '#8a94a6'); }
      R(c, -5, -24, 10, 9, 2, '#8a94a6');
      for (i = -1; i <= 1; i += 2) { a = i < 0 ? aa[0] : aa[1]; h = arm(c, i * 15, -40, i, a, 14, 4, mt); claw(c, h[0], h[1], 1, -i * a, ac); }
      c.beginPath(); c.moveTo(0, -55); c.bezierCurveTo(21, -55, 20, -20, 0, -20); c.bezierCurveTo(-20, -20, -21, -55, 0, -55); c.closePath(); F(c, w1);
      c.save(); c.clip(); c.fillStyle = ac; c.fillRect(-22, -33, 44, 4.4); c.fillStyle = shade(w1, -0.08); c.fillRect(-22, -27, 44, 9); c.restore();
      R(c, -7, -47, 14, 9, 2.5, '#3b4664'); c.beginPath(); c.moveTo(-5, -42.5); for (j = 0; j <= 10; j++) c.lineTo(-5 + j, -42.5 + Math.sin(j * 1.3 + m.t * 6) * (1 + m.k * 2.2) * (j % 10 ? 1 : 0)); c.lineWidth = 0.9; c.strokeStyle = p.gold; c.stroke();
      L(c, hx * 0.5, -57, hx, hy + 9, 4, '#8a94a6');
      c.beginPath(); c.moveTo(hx - 16, hy + 9); c.quadraticCurveTo(hx - 17, hy - 13, hx, hy - 13); c.quadraticCurveTo(hx + 17, hy - 13, hx + 16, hy + 9); c.closePath(); F(c, w1); Rn(c, hx - 16.4, hy + 6.4, 32.8, 3.2, 1.4, ac);
      E(c, hx, hy - 1.6, 9, 8.4, '#27324d');
      if (bl) L(c, hx - 5.6, hy - 1.6, hx + 5.6, hy - 1.6, 1.8, '#7fe3ff'); else { dot(c, hx + m.sw * 1.6, hy - 1.6, 5.2, '#7fe3ff'); dot(c, hx + m.sw * 1.6, hy - 1.6, 2.4, '#16304a'); dot(c, hx + m.sw * 1.6 + 1.8, hy - 3.6, 1.5, '#fff'); }
      if (m.open > 0.12) E(c, hx, hy + 12.5, 2.6, 1 + m.open * 2.2, '#27324d');
      L(c, hx + 8, hy - 11.6, hx + 12 + m.sw * 2, hy - 22, 1.2, '#8a94a6'); c.globalAlpha = 0.3 + m.k * 0.5; dot(c, hx + 12 + m.sw * 2, hy - 23, 5, p.accent); c.globalAlpha = 1; E(c, hx + 12 + m.sw * 2, hy - 23, 2.4, 2.4, p.accent);
    } else if (v === 1) { /* boxer: a yellow box on treads with a face on a screen */
      var y1 = '#ffd166', sc2 = '#1f2a44', px = '#7fffd4'; hy = -64 + m.k * 2;
      for (i = -1; i <= 1; i += 2) { R(c, i * 13 - 9, -11, 18, 11, 5, dk); for (j = -1; j <= 1; j++) dot(c, i * 13 + j * 5, -5.5, 2, '#8a94a6'); c.lineWidth = 0.8; c.strokeStyle = '#8a94a6'; c.setLineDash([2, 2]); c.lineDashOffset = -m.t * 8 * i; c.beginPath(); c.moveTo(i * 13 - 6, -10.4); c.lineTo(i * 13 + 6, -10.4); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; }
      for (i = -1; i <= 1; i += 2) { a = i < 0 ? aa[0] : aa[1]; var ex = i * 19 + i * Math.sin(a) * 9, ey = -42 + Math.cos(a) * 9; arm(c, i * 19, -42, i, a, 9, 5, mt); h = arm(c, ex, ey, i, a + (m.wave && i > 0 ? 0.3 : -0.5), 9, 4.2, mt); E(c, ex, ey, 2.8, 2.8, p.accent); claw(c, h[0], h[1], 1, -i * (a - 0.3), p.accent); }
      R(c, -18, -48, 36, 37, 5, y1); Rn(c, -18, -16.5, 36, 3.4, 1.5, shade(y1, -0.2));
      R(c, -13, -43, 16, 12, 2, p.paper); for (j = 0; j < 4; j++) Rn(c, -11 + j * 3.4, -33.5 - (2 + ((j * 7 + m.n * 3) % 5) * (0.6 + m.k)), 2.2, 2 + ((j * 7 + m.n * 3) % 5) * (0.6 + m.k), 0.4, [p.accent, p.accent2, p.gold, p.accent][j]);
      dot(c, 10, -39.5, 3.6, m.n % 2 ? p.accent : shade(p.accent, -0.4)); dot(c, 10, -31, 2.4, m.n % 2 ? shade(p.accent2, -0.4) : p.accent2);
      for (j = 0; j < 3; j++) L(c, -12, -25.5 + j * 2.8, 12, -25.5 + j * 2.8, 0.9, shade(y1, -0.25));
      for (i = -1; i <= 1; i += 2) { dot(c, i * 15, -45, 0.8, shade(y1, -0.4)); dot(c, i * 15, -20, 0.8, shade(y1, -0.4)); }
      R(c, -4.5, -52.5, 9, 5, 1.5, '#8a94a6');
      for (i = -1; i <= 1; i += 2) { L(c, hx + i * 9, hy - 13, hx + i * 13 + m.sw * 2, hy - 23 - m.k * 2, 1.2, '#8a94a6'); E(c, hx + i * 13 + m.sw * 2, hy - 24 - m.k * 2, 2.2, 2.2, i < 0 ? p.accent : p.accent2); }
      R(c, hx - 19, hy - 13, 38, 25, 5, y1); R(c, hx - 15.5, hy - 10, 31, 19, 3, sc2);
      c.fillStyle = px; /* a face made of fat pixels */
      for (i = -1; i <= 1; i += 2) { if (bl) c.fillRect(hx + i * 7.5 - 3, hy - 3.4, 6, 1.6); else { c.fillRect(hx + i * 7.5 - 2.4, hy - 7, 4.8, 6.4); } }
      if (!bl) { c.fillStyle = sc2; for (i = -1; i <= 1; i += 2) c.fillRect(hx + i * 7.5 + 0.4 + m.sw, hy - 6.2, 1.6, 1.8); c.fillStyle = px; }
      if (m.open > 0.12) c.fillRect(hx - 4, hy + 2.4, 8, 1.6 + m.open * 4);
      else { c.fillRect(hx - 6.4, hy + 2.4, 1.8, 1.8); c.fillRect(hx - 4.6, hy + 4.2, 9.2, 1.8); c.fillRect(hx + 4.6, hy + 2.4, 1.8, 1.8); }
      c.fillStyle = 'rgba(255,138,192,0.75)'; for (i = -1; i <= 1; i += 2) c.fillRect(hx + i * 12 - 1.6, hy + 1, 3.2, 1.8);
      c.beginPath(); c.moveTo(hx - 14, hy - 8.6); c.lineTo(hx - 6, hy - 8.6); c.lineTo(hx - 12, hy + 0); c.lineTo(hx - 14, hy - 2); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fill();
    } else if (v === 2) { /* hover: a little saucer that floats, with a glass dome and dangling arms */
      var b2 = '#58b4ff', bob = Math.sin(m.t * 3) * 1.5 + m.k * 2, fy = -34 - bob; hy = fy - 16;
      E(c, 0, -1, 15 - bob * 0.6, 2.2, 'rgba(0,0,0,0.16)');
      for (j = 0; j < 3; j++) { var rf = frac(m.t * 1.2 + j / 3); c.globalAlpha = (1 - rf) * 0.7; c.beginPath(); c.ellipse(0, fy + 11 + rf * 18, 12 - rf * 5, 2.6 - rf, 0, 0, TAU); c.lineWidth = 1.4; c.strokeStyle = p.gold; c.stroke(); } c.globalAlpha = 1;
      for (i = -1; i <= 1; i += 2) { a = i < 0 ? aa[0] * 0.6 : (m.wave ? aa[1] : aa[1] * 0.6); h = [i * 22 + i * Math.sin(a) * 17, fy + 2 + Math.cos(a) * 17]; limb(c, i * 22, fy + 2, i * 22 + i * Math.sin(a + 0.7) * 9, fy + 2 + Math.cos(a + 0.7) * 9, h[0], h[1], 2.6, mt); claw(c, h[0], h[1], 1, -i * a, p.accent); }
      R(c, -8, fy + 5, 16, 7.5, 3.4, dk); dot(c, 0, fy + 10, 2.6, p.gold);
      E(c, 0, fy, 27, 9.5, b2); c.beginPath(); c.ellipse(0, fy - 2.4, 25, 6, 0, 0, TAU); c.fillStyle = shade(b2, 0.25); c.fill();
      for (j = -2; j <= 2; j++) dot(c, j * 9.6, fy + 3.4 - Math.abs(j) * 1.3, 2, ((j + 2 + m.n) % 2) ? p.gold : p.accent);
      c.beginPath(); c.arc(hx * 0.6, fy - 3, 16.5, PI, TAU); c.closePath(); c.fillStyle = 'rgba(205,238,255,0.5)'; c.fill(); c.lineWidth = 1.3; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
      R(c, hx * 0.6 - 9.5, fy - 15.5, 19, 12.5, 5, '#f4f7fa');
      eyes(c, hx * 0.6 + m.sw, fy - 10.6, 4.4, 2, m, '#27324d'); blush(c, hx * 0.6, fy - 7.4, 7, 1.6, 'rgba(255,138,192,0.6)');
      if (m.open > 0.12) E(c, hx * 0.6, fy - 6.2, 1.8, 0.8 + m.open * 1.8, '#27324d'); else { c.beginPath(); c.arc(hx * 0.6, fy - 8, 2.2, PI * 0.2, PI * 0.8); c.lineWidth = 0.8; c.strokeStyle = '#27324d'; c.stroke(); }
      c.beginPath(); c.arc(hx * 0.6, fy - 3, 13.5, PI * 1.15, PI * 1.42); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke();
      L(c, hx * 0.6, fy - 19.5, hx * 0.6 + m.sw * 2.5, fy - 28, 1.2, '#8a94a6'); c.globalAlpha = 0.3 + m.k * 0.5; dot(c, hx * 0.6 + m.sw * 2.5, fy - 29.5, 5.5, p.accent2); c.globalAlpha = 1; E(c, hx * 0.6 + m.sw * 2.5, fy - 29.5, 2.6, 2.6, p.accent2);
    } else { /* tin can: tall, on spring legs, a funnel for a hat */
      var o3 = '#ff8a5c', tl = '#57c5b6'; hy = -72 + m.k * 2.5;
      c.save(); c.scale(0.92, 0.92);
      for (i = -1; i <= 1; i += 2) { c.beginPath(); for (j = 0; j <= 8; j++) c.lineTo(i * 7 + (j % 2 ? 3.4 : -3.4), -22 + j * (15 - m.k * 2) / 8 + m.k * 2); c.lineWidth = 1.5; c.lineJoin = 'round'; c.strokeStyle = '#8a94a6'; c.stroke(); R(c, i * 8 - 7.5, -7, 15, 7, 3, tl); }
      for (i = -1; i <= 1; i += 2) { a = i < 0 ? aa[0] : aa[1]; var sx3 = i * 13, sy3 = -51, n3 = 5; for (j = 0; j < n3; j++) { E(c, sx3 + i * Math.sin(a) * (2 + j * 3.6), sy3 + Math.cos(a) * (2 + j * 3.6), 3.2, 3.2, j % 2 ? mt : '#b9c4cf'); } E(c, sx3 + i * Math.sin(a) * 20, sy3 + Math.cos(a) * 20, 4.2, 4.2, tl); }
      R(c, -13, -57, 26, 36, 6, o3); Rn(c, -13, -26.5, 26, 3.2, 1.5, shade(o3, -0.2)); Rn(c, -13, -54.5, 26, 2.2, 1, shade(o3, 0.25));
      E(c, 0, -41, 8.6, 8.6, p.paper); for (j = 0; j < 3; j++) { c.beginPath(); c.arc(0, -41, 2 + j * 2.4, 0, TAU); c.lineWidth = 0.8; c.strokeStyle = shade(o3, -0.3); c.stroke(); } dot(c, 0, -41, 1.6 + m.k * 1.6, p.accent);
      for (i = -1; i <= 1; i += 2) dot(c, i * 7, -30, 1.7, i < 0 ? p.gold : tl);
      for (j = 0; j < 3; j++) R(c, hx * 0.5 - 4, -62.5 + j * 2 - m.k * 0.5, 8, 2.6, 1.2, j % 2 ? mt : '#b9c4cf');
      for (i = -1; i <= 1; i += 2) { R(c, hx + i * 13.6 - 2.5, hy - 4, 5, 9, 2, tl); }
      R(c, hx - 12.6, hy - 11, 25.2, 21, 7, o3);
      R(c, hx - 10.4, hy - 6.6, 20.8, 8.6, 4.3, '#27324d');
      if (bl) for (i = -1; i <= 1; i += 2) L(c, hx + i * 5 - 2, hy - 2.3, hx + i * 5 + 2, hy - 2.3, 1.3, p.gold); else for (i = -1; i <= 1; i += 2) { dot(c, hx + i * 5 + m.sw * 1.2, hy - 2.3, 2.7, p.gold); dot(c, hx + i * 5 + m.sw * 1.2 + 0.8, hy - 3.1, 0.9, '#fff'); }
      if (m.open > 0.12) R(c, hx - 4, hy + 4, 8, 1.6 + m.open * 3.4, 1, '#3b2a2a'); else { R(c, hx - 5, hy + 4.2, 10, 3, 1.2, p.paper); for (j = -1; j <= 1; j++) L(c, hx + j * 2.5, hy + 4.6, hx + j * 2.5, hy + 6.8, 0.6, shade(o3, -0.4)); }
      c.save(); c.translate(hx, hy - 11); c.rotate(m.sw * 0.12); Pg(c, [[-9, 0], [9, 0], [2.6, -9], [2.6, -14 - m.k], [-2.6, -14 - m.k], [-2.6, -9]], mt); L(c, -6, -2.4, 6, -2.4, 0.8, '#b9c4cf'); c.globalAlpha = 0.5 * m.k; dot(c, 0, -19 - (1 - m.k) * 5, 2.6, p.snow); c.globalAlpha = 1; c.restore();
      c.restore();
    }
  }, { wide: 1.0, variants: ['roller', 'boxer', 'hover', 'tin-can'] });
});
