/* Send a Carol art pack: the woodland and pond cast (frog, otter, hedgehog, raccoon, squirrel, duck, swan).
   Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var eyes = K.eyes, blush = K.blush, mouth = K.mouth, arm = K.arm, armAngles = K.armAngles, INK = '#2b2118', NOSE = '#3a2620';

  /* ---------- the pack's own small helpers ---------- */
  function Ef(c, x, y, rx, ry, fill, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = fill; c.fill(); } /* an ellipse with no outline */
  function limb(c, x1, y1, x2, y2, w, col) { var o = K.ow(); if (o > 0) L(c, x1, y1, x2, y2, w + o * 1.6, shade(col, -0.34)); L(c, x1, y1, x2, y2, w, col); }
  function blinks(m) { return frac(m.t * 0.31 + m.ph) < 0.035; }
  /* eyes with a white of their own: for dark faces and for a frog's bulging eyes */
  function eyesW(c, x, y, dx, r, m, iris, lid) {
    var b = blinks(m), s;
    for (s = -1; s <= 1; s += 2) {
      if (b) { c.beginPath(); c.arc(x + s * dx, y - r * 0.15, r * 0.8, 0.15 * PI, 0.85 * PI); c.lineWidth = r * 0.36; c.lineCap = 'round'; c.strokeStyle = lid || '#ffffff'; c.stroke(); }
      else { dot(c, x + s * dx, y, r, '#ffffff'); dot(c, x + s * dx, y + r * 0.06, r * 0.64, iris || INK); dot(c, x + s * dx, y + r * 0.06, r * 0.34, INK); dot(c, x + s * dx + r * 0.26, y - r * 0.3, r * 0.26, '#ffffff'); }
    }
  }
  function nose(c, x, y, rx, ry, col) { E(c, x, y, rx, ry, col || NOSE); dot(c, x - rx * 0.3, y - ry * 0.3, rx * 0.26, 'rgba(255,255,255,0.7)'); }
  function tuft(c, x, y, s, m, a, b) { var i; for (i = -1; i <= 1; i++) { c.save(); c.translate(x + i * 2.4 * s, y); c.rotate(i * 0.5 + m.sw * 0.2); E(c, 0, -4.4 * s, 2.3 * s, 5.4 * s, i ? b : a); c.restore(); } }
  function spikes(c, cx, cy, r0, r1, n, a0, a1, col, ph) { /* a row of spines round an arc */
    var i, a, r; c.beginPath();
    for (i = 0; i <= n * 2; i++) { a = a0 + (a1 - a0) * i / (n * 2); r = i % 2 ? r1 + (((i * 7 + (ph || 0)) % 3) - 1) * 1.2 : r0; if (i) c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    c.closePath(); F(c, col);
  }
  /* the little things they carry */
  function apple(c, x, y, r, col) { L(c, x, y - r * 0.8, x + r * 0.3, y - r * 1.5, r * 0.22, '#6b4226'); K.leaf(c, x + r * 0.2, y - r * 1.2, r * 1.1, -0.5, '#57b36f'); E(c, x, y, r, r * 0.92, col); dot(c, x - r * 0.35, y - r * 0.35, r * 0.24, 'rgba(255,255,255,0.7)'); }
  function mushroom(c, x, y, s, col) { R(c, x - s * 0.32, y - s * 0.1, s * 0.64, s * 0.95, s * 0.28, '#fff3e0'); c.beginPath(); c.ellipse(x, y, s, s * 0.85, 0, PI, 0); c.closePath(); F(c, col); dot(c, x - s * 0.45, y - s * 0.3, s * 0.17, '#ffffff'); dot(c, x + s * 0.3, y - s * 0.5, s * 0.2, '#ffffff'); dot(c, x + s * 0.55, y - s * 0.16, s * 0.12, '#ffffff'); }
  function acorn(c, x, y, s) { E(c, x, y + s * 0.2, s * 0.74, s * 0.95, '#d9a04e'); dot(c, x - s * 0.25, y + s * 0.1, s * 0.2, 'rgba(255,255,255,0.55)'); c.beginPath(); c.ellipse(x, y - s * 0.22, s * 0.92, s * 0.62, 0, PI, 0); c.closePath(); F(c, '#7a4a26'); L(c, x, y - s * 0.8, x + s * 0.15, y - s * 1.2, s * 0.24, '#5a3418'); }
  function strawberry(c, x, y, s, col) {
    var i; c.beginPath(); c.moveTo(x - s, y - s * 0.3); c.quadraticCurveTo(x - s * 0.9, y + s * 0.7, x, y + s * 1.15); c.quadraticCurveTo(x + s * 0.9, y + s * 0.7, x + s, y - s * 0.3); c.quadraticCurveTo(x, y - s * 0.95, x - s, y - s * 0.3); c.closePath(); F(c, col);
    for (i = 0; i < 5; i++) dot(c, x + ((i * 37) % 11 - 5) * s * 0.12, y + ((i * 53) % 9 - 3) * s * 0.11, s * 0.09, '#ffe9a8');
    for (i = -1; i <= 1; i++) K.leaf(c, x, y - s * 0.55, s * 0.8, -PI / 2 + i * 0.9, '#4fae62');
  }
  function daisy(c, x, y, r, rot, mid) { var i, a; for (i = 0; i < 7; i++) { a = (rot || 0) + i / 7 * TAU; E(c, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.42, r * 0.42, '#ffffff'); } dot(c, x, y, r * 0.4, mid || '#ffc93c'); }

  /* ---------- frog: squat, wide-mouthed, a throat that puffs when it sings ---------- */
  var FROG = [
    { g: '#6cc04a', b: '#eef7bd', toe: '#8fd660', iris: '#e0a020', w: 1, sp: null },      /* pond frog, a water lily on its head */
    { g: '#a4d83c', b: '#fbf6c6', toe: '#f58a2c', iris: '#e2402a', w: 0.88, sp: null },   /* tree frog: red eyes, orange toes, blue flanks */
    { g: '#8a9440', b: '#f1e3aa', toe: '#a3ad56', iris: '#c98a1c', w: 1.14, sp: '#5d682a' }, /* bullfrog: wide, spotted, bow tie */
    { g: '#3f8fe0', b: '#bfe2fb', toe: '#2f6fc0', iris: '#1d2a55', w: 0.94, sp: '#1d2a55' }  /* blue frog with a cattail */
  ];
  Art.add('character', 'frog', function (c, m, p) {
    var q = FROG[m.v], g = q.g, dk = shade(g, -0.16), b = q.b, w = q.w, hx = m.sw * 2.2, hy = -56 + m.k * 2.5, aa = armAngles(m, 1.15, 0.8), i, j, h, ln = shade(g, -0.5);
    c.save(); c.scale(1.17, 1.17);
    for (i = -1; i <= 1; i += 2) { /* folded back legs and long webbed feet */
      E(c, i * 19 * w, -12, 11, 9.5, dk, i * 0.5);
      E(c, i * 21 * w, -3.3, 12, 3.9, g);
      for (j = -1; j <= 1; j++) E(c, i * (21 * w + 10.5 - Math.abs(j) * 2), -3.3 + j * 2.5, 2.1, 2.1, q.toe);
    }
    h = arm(c, -19 * w, -39, -1, aa[0], 17, 5, g, q.toe, 3.4); arm(c, 19 * w, -39, 1, aa[1], 17, 5, g, q.toe, 3.4);
    if (m.v === 3) { var tx = h[0] - 3 + m.sw * 3, ty = h[1] - 36; L(c, h[0], h[1] + 4, tx, ty, 1.5, '#5a8a3a'); K.leaf(c, h[0] - 0.5, h[1] - 6, 13, -PI / 2 - 0.5 + m.sw * 0.1, '#6aa84a'); c.save(); c.translate(tx, ty + 8); c.rotate(Math.atan2(tx - h[0], 40) * 1); R(c, -2.7, -8, 5.4, 15, 2.7, '#7a4a2a'); c.restore(); }
    E(c, 0, -27, 23 * w, 23, g); E(c, 0, -22, 15.5 * w, 16.5, b);
    if (m.v === 1) for (i = -1; i <= 1; i += 2) { L(c, i * 19.5 * w, -36, i * 21 * w, -24, 2.6, '#3d86d8'); L(c, i * 20.2 * w, -20, i * 19 * w, -15, 2.4, '#ffd23f'); }
    if (q.sp) for (i = -1; i <= 1; i += 2) { dot(c, i * 18 * w, -35, 2.5, q.sp); dot(c, i * 20 * w, -26, 1.8, q.sp); dot(c, i * 16.5 * w, -18, 1.5, q.sp); }
    if (m.open > 0.12) { E(c, hx, hy + 14, (10 + m.open * 5) * w, 5 + m.open * 6.5, shade(b, 0.2)); dot(c, hx - 3, hy + 13, 1.6 + m.open, 'rgba(255,255,255,0.7)'); } /* the throat puffs */
    for (i = -1; i <= 1; i += 2) E(c, hx + i * 12.5 * w, hy - 13 - m.k, 9.2, 9.2, g);
    E(c, hx, hy, 26 * w, 17, g);
    Ef(c, hx, hy + 9, 17 * w, 6.5, alpha(b, 0.55));
    if (q.sp) { dot(c, hx - 4, hy - 9, 1.9, q.sp); dot(c, hx + 6, hy - 11, 1.4, q.sp); dot(c, hx + 19 * w, hy - 4, 1.6, q.sp); dot(c, hx - 20 * w, hy - 2, 1.9, q.sp); }
    eyesW(c, hx, hy - 13.5 - m.k, 12.5 * w, 6.5, m, q.iris, ln);
    dot(c, hx - 2.6, hy - 2.5, 0.9, ln); dot(c, hx + 2.6, hy - 2.5, 0.9, ln);
    blush(c, hx, hy + 2.5, 19 * w, 2.9);
    if (m.open > 0.12) {
      c.beginPath(); c.moveTo(hx - 14 * w, hy + 2); c.quadraticCurveTo(hx, hy + 5, hx + 14 * w, hy + 2); c.quadraticCurveTo(hx, hy + 7 + m.open * 17, hx - 14 * w, hy + 2); c.closePath(); c.fillStyle = '#6a1d2a'; c.fill();
      Ef(c, hx, hy + 6 + m.open * 5.5, 6, 1.6 + m.open * 2.6, '#e8707e');
    } else { c.beginPath(); c.moveTo(hx - 15 * w, hy + 2); c.quadraticCurveTo(hx, hy + 11.5, hx + 15 * w, hy + 2); c.lineWidth = 1.3; c.lineCap = 'round'; c.strokeStyle = ln; c.stroke(); }
    if (m.v === 0) { K.leaf(c, hx - 1, hy - 17, 11, PI + 0.35, '#3f9a5c'); K.leaf(c, hx + 1, hy - 17, 11, -0.35, '#3f9a5c'); K.flower(c, hx, hy - 19.5 - m.k, 6.2, shade(p.accent, 0.5), p.gold, m.t * 0.5); }
    if (m.v === 2) K.bow(c, 0, -41.5, 17, p.accent2);
    c.restore();
  }, { wide: 0.98, variants: ['pond frog', 'tree frog', 'bullfrog', 'blue frog'] });

  /* ---------- otter: long, upright, something precious in its paw ---------- */
  var OTTER = [
    { f: '#8f5d3c', head: '#8f5d3c', face: '#efd7ae', belly: '#e9cfa4', hs: 1, bl: 1 },        /* river otter with a clam */
    { f: '#6b4a3c', head: '#e6d8bf', face: '#f7eddb', belly: '#b79a7e', hs: 1.04, bl: 0.96 },  /* sea otter, pale head, a starfish */
    { f: '#b98a5e', head: '#b98a5e', face: '#f8e6c8', belly: '#f1dbb6', hs: 1.24, bl: 0.7 },   /* pup: big head, tuft, a pebble */
    { f: '#c9913f', head: '#c9913f', face: '#fff0cf', belly: '#f6dfae', hs: 0.98, bl: 1.06 }   /* golden otter, kelp necklace, a fish */
  ];
  Art.add('character', 'otter', function (c, m, p) {
    var q = OTTER[m.v], f = q.f, dk = shade(f, -0.3), hs = q.hs, ry = 27 * q.bl + 2, cy = -4 - ry, sy = cy - ry * 0.55, hx = m.sw * 2.4, hy = cy - ry - 8.5 * hs + m.k * 2.5, aa = armAngles(m, 1.1, 0.8), i, h, hd = q.head;
    c.save(); c.scale(1.1, 1.1); c.translate(-4, 0);
    c.save(); c.translate(8, -10); c.rotate(-0.5 + m.sw * 0.3 + Math.sin(m.t * 2.1) * 0.06); /* thick rudder of a tail */
    c.beginPath(); c.moveTo(-2, -7.5); c.quadraticCurveTo(18, -11, 30, -3.5); c.quadraticCurveTo(34, 0, 30, 2); c.quadraticCurveTo(16, 9, -2, 7); c.closePath(); F(c, dk); c.restore();
    for (i = -1; i <= 1; i += 2) { E(c, i * 8.5, -3.2, 8.8, 4.2, dk); L(c, i * 12, -4.6, i * 13.5, -1.8, 0.7, shade(dk, -0.3)); L(c, i * 8.5, -5, i * 9, -1.4, 0.7, shade(dk, -0.3)); }
    h = arm(c, -13, sy, -1, aa[0], 14, 5.8, f, dk, 3.5); arm(c, 13, sy, 1, aa[1], 14, 5.8, f, dk, 3.5);
    c.save(); c.translate(h[0] - 1, h[1] - 4 - m.k * 1.5); c.rotate(m.sw * 0.25);
    if (m.v === 0) { c.beginPath(); c.arc(0, 2, 7.5, PI, 0); c.closePath(); F(c, '#f6e4d2'); for (i = -2; i <= 2; i++) L(c, 0, 2, i * 2.8, -4.6 + Math.abs(i) * 1.1, 0.6, '#d3b9a2'); R(c, -2.2, 1.2, 4.4, 2.6, 1.2, '#e7cdb6'); }
    else if (m.v === 1) { K.starPath(c, 0, -1, 8.2, 4, 5, 0.2); F(c, p.accent); dot(c, 0, -1, 1.3, shade(p.accent, 0.45)); for (i = 0; i < 5; i++) dot(c, Math.sin(i / 5 * TAU + 0.2) * 4.4, -1 - Math.cos(i / 5 * TAU + 0.2) * 4.4, 0.8, shade(p.accent, 0.45)); }
    else if (m.v === 2) { E(c, 0, 0, 6, 4.8, '#aeb4bd', 0.3); dot(c, -1.8, -1.6, 1.4, 'rgba(255,255,255,0.7)'); L(c, -1, 2, 3, 0.6, 0.7, '#8d939c'); }
    else { Pg(c, [[5, -1], [10.5, -5], [10.5, 3]], shade(p.accent2, -0.1)); E(c, 0, -1, 7, 4, p.accent2); Ef(c, -0.5, 0.3, 5, 2, shade(p.accent2, 0.4)); dot(c, -3.6, -1.8, 1.1, '#ffffff'); dot(c, -3.6, -1.8, 0.55, INK); }
    c.restore();
    E(c, 0, cy, 15.5, ry, f); E(c, 0, cy + 3.5, 9.6, ry * 0.72, q.belly);
    if (m.v === 3) { c.beginPath(); c.moveTo(-11, cy - ry + 9); c.quadraticCurveTo(0, cy - ry + 21, 11, cy - ry + 9); c.lineWidth = 2.2; c.lineCap = 'round'; c.strokeStyle = '#3f9a5c'; c.stroke(); for (i = -1; i <= 1; i++) K.leaf(c, i * 6, cy - ry + 14.5 - Math.abs(i) * 2, 5, PI / 2 + i * 0.5, '#57b36f'); E(c, 0, cy - ry + 16.5, 2.6, 2.6, p.gold); }
    for (i = -1; i <= 1; i += 2) { E(c, hx + i * 15 * hs, hy - 6.5 * hs, 4.4 * hs, 4.4 * hs, m.v === 1 ? f : hd); dot(c, hx + i * 15 * hs, hy - 6.2 * hs, 2.1 * hs, '#e9a79a'); }
    if (m.v === 2) tuft(c, hx, hy - 12.5 * hs, 1.2, m, f, shade(f, 0.2));
    E(c, hx, hy, 17.5 * hs, 14.5 * hs, hd);
    E(c, hx, hy + 5.6 * hs, 10.8 * hs, 7.6 * hs, q.face);
    eyes(c, hx, hy - 2.4 * hs, 7.8 * hs, 2.15 * hs, m); blush(c, hx, hy + 2.6 * hs, 13.6 * hs, 2.5 * hs);
    nose(c, hx, hy + 2.3 * hs, 4.3 * hs, 3 * hs);
    mouth(c, hx, hy + 8.5 * hs, 4 * hs, m, NOSE);
    for (i = -1; i <= 1; i += 2) { L(c, hx + i * 7.5 * hs, hy + 5.5 * hs, hx + i * 20 * hs, hy + 3.5 * hs, 0.45, shade(q.face, -0.22)); L(c, hx + i * 7.5 * hs, hy + 7 * hs, hx + i * 20 * hs, hy + 8.6 * hs, 0.45, shade(q.face, -0.22)); dot(c, hx + i * 5.6 * hs, hy + 5.4 * hs, 0.5 * hs, shade(q.face, -0.4)); dot(c, hx + i * 6.6 * hs, hy + 7.2 * hs, 0.5 * hs, shade(q.face, -0.4)); }
    c.restore();
  }, { wide: 0.78, variants: ['river otter', 'sea otter', 'otter pup', 'golden otter'] });

  /* ---------- hedgehog: a ball of spines with a small sweet face, lunch stuck on its back ---------- */
  var HOG = [
    { sp: '#7a5236', fur: '#f5e2c2', nz: NOSE },   /* brown, an apple */
    { sp: '#5f5967', fur: '#f1e8de', nz: NOSE },   /* grey, a mushroom */
    { sp: '#bd9152', fur: '#fff2d8', nz: '#6b4226' }, /* blonde, autumn leaves */
    { sp: '#e3d9cf', fur: '#fff7f0', nz: '#e58a9a' }  /* snowy white, a strawberry and a daisy */
  ];
  Art.add('character', 'hedgehog', function (c, m, p) {
    var q = HOG[m.v], sp = q.sp, fur = q.fur, hx = m.sw * 2.2, hy = -41 + m.k * 2.5, aa = armAngles(m, 1.2, 0.8), i, a, bx = -15 + m.sw * 1.5, by = -68 - m.k * 3, tip = shade(sp, 0.42);
    c.save(); c.scale(1.15, 1.15);
    spikes(c, 0, -33, 31, 38.5 + m.k * 2, 15, 0.86 * PI, 2.14 * PI, shade(sp, -0.12), 0);
    spikes(c, 0, -32, 25, 32.5 + m.k * 1.2, 13, 0.9 * PI, 2.1 * PI, sp, 1);
    for (i = 0; i < 13; i++) { a = 0.9 * PI + 1.2 * PI * (i * 2 + 1) / 26; L(c, Math.cos(a) * 27, -32 + Math.sin(a) * 27, Math.cos(a) * 31, -32 + Math.sin(a) * 31, 1.1, tip); }
    if (m.v === 0) apple(c, bx, by, 7, p.accent);
    else if (m.v === 1) mushroom(c, bx, by + 1, 7.5, p.accent);
    else if (m.v === 2) { K.leaf(c, bx - 2, by + 6, 14, -PI / 2 - 0.5 + m.sw * 0.12, p.accent); K.leaf(c, bx + 3, by + 6, 15, -PI / 2 + 0.25 + m.sw * 0.12, p.gold); K.leaf(c, bx + 6, by + 8, 11, -PI / 2 + 0.95 + m.sw * 0.12, '#e0862c'); }
    else strawberry(c, bx, by, 6.2, p.accent);
    for (i = -1; i <= 1; i += 2) E(c, i * 10, -2.8, 7.8, 3.7, shade(fur, -0.16));
    arm(c, -17, -29, -1, aa[0], 11.5, 4.8, fur, fur, 3); arm(c, 17, -29, 1, aa[1], 11.5, 4.8, fur, fur, 3);
    E(c, 0, -21, 20, 20.5, fur); Ef(c, 0, -18, 12, 12, shade(fur, 0.35));
    for (i = -1; i <= 1; i += 2) { E(c, hx + i * 14.5, hy - 9.5, 4.8, 4.8, shade(fur, -0.14)); dot(c, hx + i * 14.5, hy - 9.2, 2.4, '#eaa9a0'); }
    E(c, hx, hy, 18.5, 14.5, fur);
    spikes(c, hx, hy - 1, 14, 19.5 + m.k * 1.5, 6, 1.14 * PI, 1.86 * PI, sp, 2);
    eyes(c, hx, hy + 1, 7.6, 2.25, m); blush(c, hx, hy + 6, 13.2, 2.7);
    nose(c, hx, hy + 5.4, 3.3, 2.6, q.nz);
    mouth(c, hx, hy + 9.8, 3.6, m, NOSE);
    if (m.v === 3) daisy(c, hx + 13, hy - 13, 5, m.t * 0.4, p.gold);
    c.restore();
  }, { wide: 0.98, variants: ['brown hedgehog', 'grey hedgehog', 'blonde hedgehog', 'white hedgehog'] });

  /* ---------- raccoon: masked, ring-tailed, always holding a find ---------- */
  var RAC = [
    { f: '#9395a0', d: '#3d3a46', l: '#f4f1ea' },   /* grey, neckerchief, tambourine */
    { f: '#b47c4e', d: '#4a2f22', l: '#f9ead2' },   /* cinnamon, flat cap, cookie */
    { f: '#6a6777', d: '#2c2a36', l: '#e9e6f0' },   /* charcoal, vest, toasted marshmallow */
    { f: '#d0ba95', d: '#6b5440', l: '#fff8e8' }    /* blonde, flower by the ear, berries */
  ];
  Art.add('character', 'raccoon', function (c, m, p) {
    var q = RAC[m.v], f = q.f, d = q.d, l = q.l, hx = m.sw * 2.4, hy = -60 + m.k * 2.5, aa = armAngles(m, 1.25, 0.8), i, j, h;
    c.save(); c.translate(-3, 0);
    c.save(); c.translate(11, -13); c.rotate(-0.88 + m.sw * 0.28 + Math.sin(m.t * 2.1) * 0.07); /* ringed tail */
    for (j = 0; j < 6; j++) E(c, 4 + j * 6.2, 0, 6.4, 8.8 - Math.abs(j - 2.5) * 0.9, j % 2 ? d : f);
    c.restore();
    for (i = -1; i <= 1; i += 2) { limb(c, i * 7, -18, i * 8, -5, 6.4, f); E(c, i * 9, -3, 7.2, 4, d); }
    h = arm(c, -12, -40, -1, aa[0], 15, 5.6, f, d, 3.3); arm(c, 12, -40, 1, aa[1], 15, 5.6, f, d, 3.3);
    c.save(); c.translate(h[0] - 1.5, h[1] - 3 - m.k * 2); c.rotate(m.sw * 0.3);
    if (m.v === 0) { E(c, 0, -2, 8.2, 8.2, p.accent); E(c, 0, -2, 5.8, 5.8, p.paper); for (j = 0; j < 6; j++) E(c, Math.cos(j / 6 * TAU + m.k) * 7, -2 + Math.sin(j / 6 * TAU + m.k) * 7, 1.7, 1.7, p.gold); }
    else if (m.v === 1) { E(c, 0, -2, 7, 6.8, '#dba65e'); dot(c, -2.6, -4, 1.3, '#5a3418'); dot(c, 2.4, -3, 1.2, '#5a3418'); dot(c, -0.6, 0.8, 1.3, '#5a3418'); dot(c, 3, 1.4, 0.9, '#5a3418'); dot(c, -3.8, 0, 0.8, '#5a3418'); }
    else if (m.v === 2) { L(c, 0, 4, 2, -15, 1.3, '#8a5a34'); R(c, -2.6, -22, 9.4, 8, 2.6, '#fffaf0'); Ef(c, 2.1, -20.6, 3.6, 1.5, '#e0a868'); }
    else { L(c, 0, 4, 1, -9, 1.1, '#5a8a3a'); K.leaf(c, 1, -5, 8, -0.4, '#57b36f'); E(c, -2.6, -10, 3.1, 3.1, p.accent); E(c, 3, -11.5, 3.1, 3.1, p.accent); E(c, 0.4, -14.5, 3.1, 3.1, shade(p.accent, -0.12)); dot(c, -3.4, -10.8, 0.8, 'rgba(255,255,255,0.7)'); dot(c, 2.2, -12.3, 0.8, 'rgba(255,255,255,0.7)'); }
    c.restore();
    E(c, 0, -28, 15.5, 19, f); E(c, 0, -28, 9, 13, l);
    if (m.v === 0) { Pg(c, [[-12, -46], [12, -46], [0, -33]], p.accent); R(c, -12.5, -48.5, 25, 5, 2.5, p.accent); dot(c, -5, -42.5, 1, p.paper); dot(c, 4, -41, 1, p.paper); dot(c, 0, -37.5, 1, p.paper); }
    if (m.v === 2) { for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * 2.5, -45); c.quadraticCurveTo(i * 16, -46, i * 15, -28); c.quadraticCurveTo(i * 14, -14, i * 5, -11); c.lineTo(i * 2.5, -22); c.closePath(); F(c, p.accent2); } dot(c, -5.2, -30, 1.2, p.gold); dot(c, -5.2, -23, 1.2, p.gold); }
    for (i = -1; i <= 1; i += 2) { E(c, hx + i * 14.5, hy - 14 - m.k * 1.5, 7, 7.6, f, i * 0.25); Ef(c, hx + i * 14.5, hy - 13.4 - m.k * 1.5, 3.9, 4.4, l, i * 0.25); }
    c.beginPath(); c.moveTo(hx - 22.5, hy + 4); c.quadraticCurveTo(hx - 20, hy - 15.5, hx, hy - 15.5); c.quadraticCurveTo(hx + 20, hy - 15.5, hx + 22.5, hy + 4); c.quadraticCurveTo(hx + 12, hy + 14, hx, hy + 15.5); c.quadraticCurveTo(hx - 12, hy + 14, hx - 22.5, hy + 4); c.closePath(); F(c, f);
    for (i = -1; i <= 1; i += 2) { Ef(c, hx + i * 14.5, hy + 6.4, 6.4, 3.9, l, -i * 0.5); Ef(c, hx + i * 9.6, hy - 8.8, 6.6, 2.7, l, i * 0.22); Ef(c, hx + i * 9.4, hy - 1.4, 9, 6, d, i * 0.32); }
    L(c, hx, hy - 13.5, hx, hy - 1, 2.6, d);
    E(c, hx, hy + 7.6, 8.6, 6.6, l);
    eyesW(c, hx, hy - 1.6, 8.6, 3.1, m, INK);
    blush(c, hx, hy + 6.6, 14.6, 2.4);
    nose(c, hx, hy + 4.6, 3.3, 2.5, INK);
    mouth(c, hx, hy + 9.6, 3.8, m, INK);
    if (m.v === 1) { c.beginPath(); c.ellipse(hx, hy - 11.5, 16.5, 8.4, 0, PI, 0); c.closePath(); F(c, p.accent2); E(c, hx + 7, hy - 11.2, 11.5, 2.7, shade(p.accent2, -0.16), 0.08); dot(c, hx, hy - 19.6, 1.6, shade(p.accent2, -0.22)); }
    if (m.v === 3) { K.leaf(c, hx - 15, hy - 11, 8, PI + 0.6, '#57b36f'); K.flower(c, hx - 13.5, hy - 13 - m.k, 5.4, p.accent, p.gold, m.t * 0.5); }
    c.restore();
  }, { wide: 0.9, variants: ['grey raccoon', 'cinnamon raccoon', 'charcoal raccoon', 'blonde raccoon'] });

  /* ---------- squirrel: a plume of a tail, tufted ears, a nut held tight ---------- */
  var SQ = [
    { f: '#cc642e', l: '#fde8cc', t: '#e79352' },   /* red squirrel, an acorn */
    { f: '#9d9da8', l: '#ffffff', t: '#c9c9d3' },   /* grey squirrel, a pine cone */
    { f: '#62545c', l: '#e2d8d2', t: '#85767e' },   /* black squirrel in an acorn-cap beret, a hazelnut */
    { f: '#c88c4c', l: '#fff1d8', t: '#5a3a24' }    /* chipmunk: stripes, stuffed cheeks, a daisy */
  ];
  Art.add('character', 'squirrel', function (c, m, p) {
    var q = SQ[m.v], f = q.f, l = q.l, chip = m.v === 3, hx = m.sw * 2.4, hy = -51 + m.k * 2.5, aa = armAngles(m, 1.2, 0.8), i, h;
    c.save(); c.scale(1.12, 1.12); c.translate(-5, 0);
    c.save(); c.translate(9, -8); c.rotate(m.sw * 0.13 + Math.sin(m.t * 2.1) * 0.045);
    if (chip) { E(c, 15, -25, 7.6, 25, f, 0.42); c.save(); c.translate(15, -25); c.rotate(0.42); L(c, 0, -19, 0, 19, 3, q.t); L(c, -3.4, -15, -3.4, 16, 1.1, '#fff1d8'); L(c, 3.4, -15, 3.4, 16, 1.1, '#fff1d8'); c.restore(); }
    else { E(c, 18, -30, 14.5, 28, f, 0.2); E(c, 22, -61 - m.k * 1.5, 14, 13, f); Ef(c, 19.5, -47, 11.5, 11, f); Ef(c, 17, -31, 8, 21, q.t, 0.2); Ef(c, 21.5, -60 - m.k * 1.5, 8.2, 7.4, q.t); Ef(c, 19, -47, 7.6, 9, q.t, 0.1); }
    c.restore();
    for (i = -1; i <= 1; i += 2) E(c, i * 8.5, -3.1, 9, 4.1, f);
    h = arm(c, -11, -32, -1, aa[0], 12.5, 4.9, f, f, 3.1); arm(c, 11, -32, 1, aa[1], 12.5, 4.9, f, f, 3.1);
    c.save(); c.translate(h[0] - 1, h[1] - 3.5 - m.k * 1.5); c.rotate(m.sw * 0.25);
    if (m.v === 0) acorn(c, 0, -1, 5.6);
    else if (m.v === 1) { E(c, 0, -2, 4.8, 7, '#8a5a34'); for (i = 0; i < 4; i++) { c.beginPath(); c.arc(0, -7.5 + i * 3.4, 4.2, 0.12 * PI, 0.88 * PI); c.lineWidth = 0.8; c.strokeStyle = '#5a3418'; c.stroke(); } }
    else if (m.v === 2) { E(c, 0, -1, 5.4, 5.6, '#c98a4a'); Ef(c, 0, 2.6, 3.4, 1.7, '#ecd3a8'); dot(c, -1.8, -3, 1.2, 'rgba(255,255,255,0.6)'); }
    else { L(c, 0, 4, 0.5, -7, 1.1, '#5a8a3a'); daisy(c, 0.5, -9, 5.4, m.t * 0.5, p.gold); }
    c.restore();
    E(c, 0, -22, 14.5, 18, f); E(c, 0, -20, 9, 13.5, l);
    for (i = -1; i <= 1; i += 2) { /* tufted ears */
      if (m.v < 2) { L(c, hx + i * 11.5, hy - 19 - m.k * 2, hx + i * 13, hy - 25.5 - m.k * 2.6, 1.6, shade(f, -0.12)); L(c, hx + i * 11.5, hy - 19 - m.k * 2, hx + i * 10, hy - 25.5 - m.k * 2.6, 1.4, shade(f, -0.12)); L(c, hx + i * 11.5, hy - 19 - m.k * 2, hx + i * 11.6, hy - 26.5 - m.k * 2.6, 1.4, shade(f, -0.12)); }
      c.beginPath(); c.moveTo(hx + i * 5, hy - 9); c.quadraticCurveTo(hx + i * 7, hy - 20 - m.k * 2, hx + i * 11.5, hy - 21 - m.k * 2); c.quadraticCurveTo(hx + i * 16.5, hy - 17, hx + i * 15.5, hy - 6); c.closePath(); F(c, f);
      Pg(c, [[hx + i * 8.6, hy - 10.5], [hx + i * 11.2, hy - 17.5 - m.k * 2], [hx + i * 13.4, hy - 9.5]], '#f0b6a6', true);
    }
    E(c, hx, hy, 16.5, 14, f);
    if (chip) { for (i = -1; i <= 1; i += 2) { L(c, hx + i * 4.6, hy - 13, hx + i * 7.4, hy - 6.5, 2, q.t); L(c, hx + i * 7.6, hy - 12.2, hx + i * 10.4, hy - 6.2, 1.2, '#fff1d8'); E(c, hx + i * 10.5, hy + 6, 8.6, 6.8, l); } }
    else for (i = -1; i <= 1; i += 2) Ef(c, hx + i * 6.4, hy + 6.4, 7.2, 5.6, l);
    Ef(c, hx, hy + 7, 6.5, 5.2, l);
    if (m.v === 2) eyesW(c, hx, hy - 2, 7.6, 3, m, INK); else eyes(c, hx, hy - 2, 7.6, 2.3, m);
    blush(c, hx, hy + 3.4, 12.6, 2.5);
    Pg(c, [[hx - 2.3, hy + 2.3], [hx + 2.3, hy + 2.3], [hx, hy + 5]], '#7a3d2c', true);
    if (m.open > 0.12) mouth(c, hx, hy + 7.8, 3.8, m); else { L(c, hx, hy + 5, hx, hy + 6.8, 0.6, '#7a3d2c'); Rn(c, hx - 1.9, hy + 6.8, 3.8, 3.5, 0.8, '#ffffff'); L(c, hx, hy + 6.9, hx, hy + 10.2, 0.4, '#cfc6ba'); }
    if (m.v === 2) { c.beginPath(); c.ellipse(hx + 2, hy - 11.5, 11.5, 7, 0.12, PI, 0); c.closePath(); F(c, '#8a5a34'); for (i = -1; i <= 1; i++) { c.beginPath(); c.arc(hx + 2 + i * 5.4, hy - 13.4, 3, 0.15 * PI, 0.85 * PI); c.lineWidth = 0.7; c.strokeStyle = '#5a3418'; c.stroke(); } L(c, hx + 3, hy - 18.4, hx + 4.4, hy - 22, 1.5, '#5a3418'); }
    c.restore();
  }, { wide: 0.92, variants: ['red squirrel', 'grey squirrel', 'black squirrel', 'chipmunk'] });

  /* ---------- duck: mallard, duckling, white duck, goose ---------- */
  var DUCK = [
    { body: '#c3b6a4', chest: '#8f4f30', head: '#208058', bill: '#f2c230', leg: '#f08a2c', neck: 7, hr: 14, bw: 22, bh: 21, s: 1.13 },
    { body: '#ffd84d', chest: null, head: '#ffd84d', bill: '#f59a2c', leg: '#f59a2c', neck: 0, hr: 15.5, bw: 16.5, bh: 15.5, s: 1.12 },
    { body: '#fffaf0', chest: null, head: '#fffaf0', bill: '#f59a2c', leg: '#f59a2c', neck: 7, hr: 14.5, bw: 23.5, bh: 22, s: 1.1 },
    { body: '#a98a68', chest: '#f1e6d2', head: '#34313c', bill: '#4a4652', leg: '#4a4652', neck: 21, hr: 13, bw: 23, bh: 21.5, s: 1.02 } /* goose: black neck, white chinstrap */
  ];
  Art.add('character', 'duck', function (c, m, p) {
    var q = DUCK[m.v], v = m.v, bw = q.bw, bh = q.bh, hr = q.hr, cy = -9 - bh, hx = m.sw * (v === 3 ? 3.4 : 2.4), hy = cy - bh * 0.86 - q.neck - hr * 0.5 + m.k * 2.5, aa = armAngles(m, 0.5, 0.65), i, j, wing = v === 0 ? '#9a8d7d' : shade(q.body, -0.1), lg = shade(q.leg, -0.2);
    c.save(); c.scale(q.s, q.s);
    for (i = -1; i <= 1; i += 2) { L(c, i * 7, -10, i * 8, -2.6, 2.6, lg); Pg(c, [[i * 8, -5.2], [i * 8 - 6.6, -0.5], [i * 8 + 6.6, -0.5]], q.leg); L(c, i * 8, -4.4, i * 8, -1.2, 0.6, lg); }
    c.save(); c.translate(-bw + 3, cy + 2); c.rotate(m.sw * 0.14); /* tail */
    Pg(c, [[2, -6], [-10, -13 - m.k * 2], [0, 5]], v === 0 ? '#3a3640' : shade(q.body, -0.06));
    if (v === 0) { c.beginPath(); c.arc(-9, -17, 4, 0.2 * PI, 1.5 * PI); c.lineWidth = 2; c.lineCap = 'round'; c.strokeStyle = '#3a3640'; c.stroke(); }
    c.restore();
    E(c, 0, cy, bw, bh, q.body);
    if (q.chest) Ef(c, 0, v === 3 ? cy - bh * 0.1 : cy - bh * 0.34, bw * (v === 3 ? 0.66 : 0.74), bh * (v === 3 ? 0.8 : 0.58), q.chest);
    else Ef(c, 1.5, cy + 3, bw * 0.6, bh * 0.62, shade(q.body, v === 1 ? 0.3 : -0.05));
    for (j = -1; j <= 1; j++) { c.beginPath(); c.moveTo(j * 6 - 2, cy + bh * 0.3 - Math.abs(j) * 2); c.lineTo(j * 6, cy + bh * 0.3 + 2.4 - Math.abs(j) * 2); c.lineTo(j * 6 + 2, cy + bh * 0.3 - Math.abs(j) * 2); c.lineWidth = 0.9; c.strokeStyle = shade(v === 3 ? q.chest : q.body, -0.16); c.stroke(); }
    for (i = -1; i <= 1; i += 2) { /* wings do the arms' work */
      var wl = v === 1 ? 0.62 : 1;
      c.save(); c.translate(i * (bw - 2.5), cy - bh * 0.3); c.rotate(i < 0 ? aa[0] : -aa[1]);
      E(c, 0, bh * 0.48 * wl, bw * 0.34, bh * 0.62 * wl, wing);
      if (v === 0) { Rn(c, -bw * 0.22, bh * 0.56, bw * 0.44, 4.2, 1.6, '#3d7fd8'); Rn(c, -bw * 0.22, bh * 0.56 - 1.4, bw * 0.44, 1.2, 0.6, '#ffffff'); }
      L(c, -2.2, bh * 0.72 * wl, -2.2, bh * 1.0 * wl, 0.8, shade(wing, -0.2)); L(c, 2.2, bh * 0.72 * wl, 2.2, bh * 1.0 * wl, 0.8, shade(wing, -0.2));
      c.restore();
    }
    limb(c, 0, cy - bh * 0.78, hx, hy + hr * 0.4, v === 3 ? 10.5 : hr * 1.05, q.head); /* neck */
    if (v !== 3) Ef(c, 0, cy - bh * 0.76, hr * 0.6, 4, v === 0 ? q.chest : q.body);
    if (v === 0) L(c, -hr * 0.5 + hx * 0.2, cy - bh * 0.93, hr * 0.5 + hx * 0.2, cy - bh * 0.93, 2.6, '#ffffff');
    if (v === 2) K.bow(c, hx * 0.15, cy - bh * 0.9, 15, p.accent2);
    if (v === 1) tuft(c, hx, hy - hr * 0.82, 1.05, m, q.body, shade(q.body, -0.12));
    E(c, hx, hy, hr, hr * 0.93, q.head);
    if (v === 3) { c.save(); c.beginPath(); c.ellipse(hx, hy, hr - 0.6, hr * 0.93 - 0.6, 0, 0, TAU); c.clip(); Ef(c, hx - hr * 0.8, hy + hr * 0.5, hr * 0.6, hr * 0.62, '#ffffff', 0.5); Ef(c, hx + hr * 0.8, hy + hr * 0.5, hr * 0.6, hr * 0.62, '#ffffff', -0.5); Ef(c, hx, hy + hr * 0.95, hr * 0.8, hr * 0.34, '#ffffff'); c.restore(); }
    if (v === 0 || v === 3) eyesW(c, hx, hy - 2.5, hr * 0.46, 2.9, m, INK); else eyes(c, hx, hy - 2.5, hr * 0.46, 2.25, m);
    blush(c, hx, hy + 3, hr * 0.78, 2.5);
    if (m.open > 0.12) { E(c, hx, hy + 8 + m.open * 5.5, 5.8, 2.6, shade(q.bill, -0.12)); Ef(c, hx, hy + 6.6 + m.open * 2.6, 5.2, 1.6 + m.open * 3, '#6a1d2a'); Ef(c, hx, hy + 7.4 + m.open * 3.8, 3, 1 + m.open * 1.2, '#e8707e'); }
    E(c, hx, hy + 5.2, 7.8, 3.8, q.bill); dot(c, hx - 1.9, hy + 3.9, 0.6, shade(q.bill, -0.4)); dot(c, hx + 1.9, hy + 3.9, 0.6, shade(q.bill, -0.4)); Ef(c, hx - 2.2, hy + 5.6, 2.4, 0.9, 'rgba(255,255,255,0.45)');
    c.restore();
  }, { wide: 0.9, variants: ['mallard', 'duckling', 'white duck', 'goose'] });

  /* ---------- swan: wings held high like a heart, a long neck that sways ---------- */
  var SWAN = [
    { f: '#ffffff', sh: '#d9e4f0', bill: '#f08a2c', knob: '#2b2118', leg: '#4a4750', neck: 1, s: 1 },      /* mute swan */
    { f: '#4c4756', sh: '#6a6474', bill: '#e23b3b', knob: null, leg: '#2b2830', neck: 1, s: 1 },           /* black swan: red bill, white wing tips */
    { f: '#bdb7bb', sh: '#d9d4d8', bill: '#6b6570', knob: null, leg: '#6b6570', neck: 0.42, s: 1 },        /* cygnet: small, fluffy, short neck */
    { f: '#fffdf6', sh: '#e6dfd0', bill: '#2b2118', knob: null, leg: '#2b2830', neck: 1.06, s: 1 }         /* trumpeter swan in a flower crown */
  ];
  Art.add('character', 'swan', function (c, m, p) {
    var q = SWAN[m.v], v = m.v, f = q.f, sh = q.sh, cyg = v === 2, hx = m.sw * 3.2, hy = -40 - 44 * q.neck + m.k * 2.5, i, j, o = K.ow(), bs = cyg ? 0.86 : 1;
    var la = 0.5 + m.sw * 0.2 + m.k * 0.12, ra = m.wave ? 0.56 + Math.sin(m.t * 9) * 0.36 : 0.5 - m.sw * 0.2 + m.k * 0.12;
    for (i = -1; i <= 1; i += 2) { L(c, i * 8, -9, i * 9, -3, 2.6, q.leg); E(c, i * 9.5, -2.6, 8.6, 3.4, q.leg); }
    for (i = -1; i <= 1; i += 2) { /* raised wings */
      c.save(); c.translate(i * 15 * bs, -27); c.scale(i * (cyg ? 0.62 : 1), cyg ? 0.62 : 1); c.rotate(i < 0 ? la : ra);
      E(c, 9, -27, 5, 12.5, v === 1 ? '#f4f1f6' : f, 0.5); E(c, 5.5, -32, 5, 13, v === 1 ? '#f4f1f6' : f, 0.26); E(c, 1, -34, 4.8, 12, v === 1 ? '#f4f1f6' : f, 0.02);
      E(c, 1, -17, 10.5, 20, f, 0.08);
      for (j = 0; j < 3; j++) { c.beginPath(); c.arc(1.5 + j * 1.2, -24 + j * 7.5, 6, 0.1 * PI, 0.75 * PI); c.lineWidth = 0.9; c.lineCap = 'round'; c.strokeStyle = sh; c.stroke(); }
      c.restore();
    }
    Pg(c, [[-19 * bs, -24], [-31 * bs, -33 - m.k * 2], [-22 * bs, -13]], f); /* tail */
    E(c, 0, -21, 26 * bs, 19 * bs, f);
    Ef(c, 0, -13.5, 20 * bs, 10 * bs, sh); Ef(c, 0, -17, 21 * bs, 10.5 * bs, f);
    for (i = -1; i <= 1; i += 2) for (j = 0; j < 2; j++) { c.beginPath(); c.arc(i * (15 - j * 6) * bs, -22 + j * 4, 5, 0.15 * PI, 0.8 * PI); c.lineWidth = 0.9; c.lineCap = 'round'; c.strokeStyle = sh; c.stroke(); }
    var x1 = (-14 - m.sw * 3) * q.neck, y1 = -34 - 18 * q.neck, x2 = (15 + m.sw * 4) * q.neck, y2 = -34 - 34 * q.neck, nw = cyg ? 10.5 : 9.4; /* the neck */
    c.lineCap = 'round';
    if (o > 0) { c.beginPath(); c.moveTo(0, -33); c.bezierCurveTo(x1, y1, x2, y2, hx, hy + 5); c.lineWidth = nw + o * 1.6; c.strokeStyle = shade(f, -0.34); c.stroke(); }
    c.beginPath(); c.moveTo(0, -33); c.bezierCurveTo(x1, y1, x2, y2, hx, hy + 5); c.lineWidth = nw; c.strokeStyle = f; c.stroke();
    Ef(c, 0, -31.5, nw * 0.72, 5.5, f);
    if (cyg) tuft(c, hx, hy - 8.5, 1.05, m, f, sh);
    E(c, hx, hy, cyg ? 12.5 : 10.8, cyg ? 11.5 : 9.8, f);
    if (cyg) Ef(c, hx, hy + 3, 8, 6, sh);
    if (v === 1) eyesW(c, hx, hy - 2.6, 5.4, 2.6, m, INK); else eyes(c, hx, hy - 2.6, cyg ? 5.8 : 5.3, cyg ? 2.1 : 1.9, m);
    blush(c, hx, hy + 2.4, cyg ? 9.4 : 8.2, 2);
    if (m.open > 0.12) { Pg(c, [[hx - 3.8, hy + 2.6], [hx + 3.8, hy + 2.6], [hx, hy + 5.6 + m.open * 5]], '#6a1d2a'); Pg(c, [[hx - 4.6, hy + 1.2], [hx + 4.6, hy + 1.2], [hx, hy + 5.2]], q.bill); Pg(c, [[hx - 3.4, hy + 6 + m.open * 4], [hx + 3.4, hy + 6 + m.open * 4], [hx, hy + 9.5 + m.open * 5]], shade(q.bill, -0.14)); }
    else { Pg(c, [[hx - 4.6, hy + 1.4], [hx + 4.6, hy + 1.4], [hx, hy + 9.6]], q.bill); if (v === 1) L(c, hx - 1.5, hy + 6.6, hx + 1.5, hy + 6.6, 1.1, '#ffffff'); }
    if (q.knob) { c.beginPath(); c.moveTo(hx - 5, hy + 1.6); c.quadraticCurveTo(hx, hy - 4.5, hx + 5, hy + 1.6); c.closePath(); c.fillStyle = q.knob; c.fill(); }
    if (v === 3) { K.flower(c, hx - 7, hy - 9, 3.6, p.accent, p.gold, m.t * 0.4); K.flower(c, hx + 7, hy - 9, 3.6, shade(p.accent2, 0.3), p.gold, -m.t * 0.4); K.flower(c, hx, hy - 12 - m.k, 4.2, p.gold, p.paper, m.t * 0.3); }
  }, { wide: 0.92, variants: ['mute swan', 'black swan', 'cygnet', 'trumpeter swan'] });
});
