/* Send a Carol art pack: wild friends A (llama, sloth, panda, koala, elephant), four variants each.
   Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var eyes = K.eyes, blush = K.blush, mouth = K.mouth, arm = K.arm, armAngles = K.armAngles, pom = K.pom, bow = K.bow, flower = K.flower, leaf = K.leaf, shine = K.shine;
  var DARK = '#3a2620', GREEN = '#58b56e', GREEN2 = '#3f9a5c';

  /* ---------- shared pieces ---------- */
  function ef(c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = col; c.fill(); } /* an ellipse with no outline */
  function fluff(c, x, y, rx, ry, n, r, col, a0) { /* a woolly blob: bumps round an ellipse */
    var i, a;
    for (i = 0; i < n; i++) { a = (a0 || 0) + i / n * TAU; E(c, x + Math.cos(a) * rx, y + Math.sin(a) * ry, r, r, col); }
    ef(c, x, y, rx + r * 0.3, ry + r * 0.3, col);
  }
  function lashes(c, x, y, dx, r, col) { for (var s = -1; s <= 1; s += 2) { L(c, x + s * (dx + r * 0.7), y - r * 0.6, x + s * (dx + r * 1.7), y - r * 1.3, 0.6, col); L(c, x + s * (dx + r * 0.95), y - r * 0.1, x + s * (dx + r * 2), y - r * 0.4, 0.6, col); } }
  function sunnies(c, x, y, w, col) { /* sunglasses, w = half the width */
    L(c, x - w * 0.2, y - w * 0.12, x + w * 0.2, y - w * 0.12, w * 0.16, '#2a2630');
    for (var s = -1; s <= 1; s += 2) { R(c, x + s * w * 0.56 - w * 0.42, y - w * 0.3, w * 0.84, w * 0.62, w * 0.24, '#2a2630'); L(c, x + s * w * 0.56 - w * 0.2, y - w * 0.02, x + s * w * 0.56 + w * 0.02, y - w * 0.2, w * 0.09, alpha(col, 0.9)); }
  }
  function crown(c, x, y, w, p, t) { /* a little flower crown: five blooms on an arc */
    var cols = [p.accent, p.gold, '#ff9ec4', p.gold, p.accent], i;
    for (i = -2; i <= 2; i++) leaf(c, x + i * w * 0.42, y + i * i * w * 0.07 + 0.6, w * 0.34, i * 0.5 - PI / 2 + 0.9, GREEN);
    for (i = -2; i <= 2; i++) flower(c, x + i * w * 0.42, y + i * i * w * 0.07, i ? w * 0.2 : w * 0.26, cols[i + 2], i % 2 ? p.accent : p.paper, t * 0.5 + i);
  }
  function kerchief(c, x, y, w, col, col2) { Pg(c, [[x - w, y], [x + w, y], [x, y + w * 1.15]], col); R(c, x - w - 0.5, y - 2.4, w * 2 + 1, 4.6, 2.3, col); dot(c, x - w * 0.4, y + w * 0.3, 0.9, col2); dot(c, x + w * 0.35, y + w * 0.4, 0.9, col2); dot(c, x, y + w * 0.75, 0.9, col2); }
  function balloon(c, hx0, hy0, bx, by, col) {
    c.beginPath(); c.moveTo(hx0, hy0); c.quadraticCurveTo(hx0 + (bx - hx0) * 0.2 - 3, (hy0 + by) / 2, bx, by + 10.5); c.lineWidth = 0.7; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke();
    Pg(c, [[bx - 1.8, by + 11.2], [bx + 1.8, by + 11.2], [bx, by + 8.4]], col); E(c, bx, by, 8, 9.5, col); shine(c, bx - 2.8, by - 3.8, 2.3);
  }
  function bamboo(c, x, y, rot, len) {
    var i;
    c.save(); c.translate(x, y); c.rotate(rot);
    leaf(c, 0, 8 - len + 9, 12, -0.55, GREEN2); leaf(c, 0, 8 - len + 9, 11, PI + 0.5, GREEN); leaf(c, 0, 8 - len + 19, 10, -0.75, GREEN); leaf(c, 0, 8 - len + 2, 9, -1.25, GREEN);
    R(c, -1.9, 8 - len, 3.8, len, 1.7, '#86c964');
    for (i = 1; i < len / 10; i++) L(c, -1.8, 8 - i * 10, 1.8, 8 - i * 10, 0.8, '#4f9a45');
    c.restore();
  }

  /* ---------- llama: cream llama in a poncho, woolly alpaca, flower llama, cool llama ---------- */
  var LL = [
    { fur: '#f6e7cf', face: '#fff8ec', hoof: '#6b4a38', neck: 31 },
    { fur: '#b47d50', face: '#edd3b2', hoof: '#4a3024', neck: 21 },
    { fur: '#fffdf8', face: '#ffffff', hoof: '#8a6e62', neck: 31 },
    { fur: '#8f8a96', face: '#f1e9e2', hoof: '#3a3238', neck: 28 }
  ];
  Art.add('character', 'llama', function (c, m, p) {
    var v = m.v, q = LL[v], fur = q.fur, alp = v === 1, i, j, ol = shade(fur, -0.34);
    var hx = m.sw * 3, hy = -45 - q.neck + m.k * 2.5, aa = armAngles(m, 0.95, 0.7), nx = hx * 0.8, ny = hy + 5;
    pom(c, -20 - m.sw * 1.6, -33, alp ? 6 : 4.6, fur);
    for (i = -1; i <= 1; i += 2) { R(c, i * 9 - 4.6, -22, 9.2, 20, 4, fur); R(c, i * 9 - 5.2, -5.6, 10.4, 5.6, 2.4, q.hoof); }
    arm(c, -15, -40, -1, aa[0], 13.5, 7, fur, q.hoof, 3.9); arm(c, 15, -40, 1, aa[1], 13.5, 7, fur, q.hoof, 3.9);
    fluff(c, 0, -31, alp ? 19 : 17.5, alp ? 16.5 : 15.5, 14, alp ? 6 : 5.2, fur, 0.2);
    if (v === 0) { /* a woven poncho */
      c.beginPath(); c.moveTo(-16, -47); c.lineTo(16, -47); c.lineTo(23, -28); c.quadraticCurveTo(0, -21, -23, -28); c.closePath(); F(c, p.accent);
      c.save(); c.clip();
      L(c, -26, -40.5, 26, -40.5, 2.6, p.gold);
      c.beginPath(); for (j = -7; j <= 7; j++) { if (j === -7) c.moveTo(j * 3.6, -37); else c.lineTo(j * 3.6, j % 2 ? -33 : -37); } c.lineWidth = 1.5; c.strokeStyle = p.paper; c.stroke();
      c.beginPath(); c.moveTo(-26, -31.5); c.quadraticCurveTo(0, -25.5, 26, -31.5); c.lineWidth = 2.4; c.strokeStyle = p.accent2; c.stroke();
      c.restore();
      for (j = -2; j <= 2; j++) pom(c, j * 9.6, -24 - j * j * 0.85, 2.6, j % 2 ? p.gold : j ? p.accent2 : p.paper);
    }
    L(c, 0, -46, nx, ny, 12.6 + 2.2, ol); L(c, 0, -46, nx, ny, 12.6, fur); /* the long neck */
    if (alp) for (i = -1; i <= 1; i += 2) for (j = 0; j < 3; j++) E(c, nx * (j / 3) + i * 6.4, -48 + (ny + 48) * (j / 3), 3.6, 3.6, fur);
    if (alp) L(c, 0, -46, nx, ny, 12.2, fur);
    fluff(c, 0, -43, 8.6, 4, 9, 3.5, fur, 0.3);
    if (v === 1) for (j = -2; j <= 2; j++) pom(c, j * 4.8, -46 + (4 - j * j) * 0.9, 2.5, j % 2 ? p.gold : j ? p.accent2 : p.accent);
    if (v === 2) for (j = -2; j <= 2; j++) flower(c, j * 5, -46 + (4 - j * j) * 1, 3.1, j % 2 ? '#ff9ec4' : p.accent, p.gold, j + m.t * 0.4);
    if (v === 3) kerchief(c, nx * 0.25, -53, 8, p.accent, p.paper);
    for (i = -1; i <= 1; i += 2) { /* tall ears */
      c.save(); c.translate(hx + i * 6.6, hy - 7); c.rotate(i * 0.3 + m.sw * 0.16 + i * m.k * 0.28);
      c.beginPath(); c.moveTo(-3.3, 0); c.quadraticCurveTo(-4.8, -12, 0, -17.5); c.quadraticCurveTo(4.8, -12, 3.3, 0); c.closePath(); F(c, fur);
      c.beginPath(); c.moveTo(-1.6, -1); c.quadraticCurveTo(-2.4, -10, 0, -14); c.quadraticCurveTo(2.4, -10, 1.6, -1); c.closePath(); c.fillStyle = '#f3b9b0'; c.fill();
      if (v === 0) pom(c, 0, -18, 2.1, i < 0 ? p.gold : p.accent2);
      c.restore();
    }
    if (alp) { fluff(c, hx, hy, 11.6, 10.6, 12, 4.4, fur, 0.26); ef(c, hx, hy + 1.6, 9.8, 8.8, q.face); }
    else E(c, hx, hy, 11.6, 10.6, fur);
    fluff(c, hx, hy - 9.6, alp ? 7 : 4.8, alp ? 3.4 : 2.2, alp ? 8 : 7, alp ? 3.7 : 2.7, fur, 0.4);
    if (alp) ef(c, hx, hy + 4.6, 7.2, 5.4, shade(q.face, 0.35)); else E(c, hx, hy + 4.6, 7.4, 5.6, q.face);
    dot(c, hx - 1.8, hy + 2.5, 0.75, DARK); dot(c, hx + 1.8, hy + 2.5, 0.75, DARK); L(c, hx, hy + 3.6, hx, hy + 5.4, 0.7, DARK);
    mouth(c, hx, hy + 7.1, 3.4, m, DARK);
    if (v === 3) sunnies(c, hx, hy - 2.2, 10.5, p.accent2);
    else { eyes(c, hx, hy - 2.6, 6.6, 2, m); lashes(c, hx, hy - 2.6, 6.6, 2, DARK); }
    blush(c, hx, hy + 2.2, 10, 2);
    if (v === 2) crown(c, hx, hy - 11.5, 13, p, m.t);
  }, { wide: 0.86, variants: ['llama in a poncho', 'woolly alpaca', 'flower llama', 'cool llama'] });

  /* ---------- sloth: flower sloth, leaf-hat sloth, headphones sloth, maracas sloth ---------- */
  var SL = [
    { fur: '#a98866', face: '#f5e4c8', patch: '#6e4f3a' },
    { fur: '#d2bd9c', face: '#fff5e0', patch: '#8f7254' },
    { fur: '#77604f', face: '#efdcc0', patch: '#4d382c' },
    { fur: '#cc9f5e', face: '#fcebcb', patch: '#7d5a36' }
  ];
  Art.add('character', 'sloth', function (c, m, p) {
    var v = m.v, q = SL[v], fur = q.fur, lt = shade(fur, 0.2), cl = '#f8efdc', i, j, a, h, hs = [];
    var hx = m.sw * 2.2, hy = -62 + m.k * 2.2, aa = armAngles(m, 0.62, 0.42);
    for (i = -1; i <= 1; i += 2) { E(c, i * 11, -4.6, 9, 5.6, fur); for (j = -1; j <= 1; j++) { L(c, i * 12 + j * 3.2, -1.8, i * 12.6 + j * 3.9, 1.1, 2.8, '#8f7a62'); L(c, i * 12 + j * 3.2, -1.8, i * 12.6 + j * 3.9, 1.1, 1.6, cl); } }
    for (i = -1; i <= 1; i += 2) { /* long, slow arms with three claws */
      a = i < 0 ? aa[0] : aa[1];
      for (j = -1; j <= 1; j++) { var ca = a + j * 0.36, bx = i * 16 + i * Math.sin(a) * 26, by = -44 + Math.cos(a) * 26; L(c, bx + i * Math.sin(ca) * 3, by + Math.cos(ca) * 3, bx + i * Math.sin(ca) * 9.5, by + Math.cos(ca) * 9.5, 3.2, '#8f7a62'); L(c, bx + i * Math.sin(ca) * 3, by + Math.cos(ca) * 3, bx + i * Math.sin(ca) * 9.5, by + Math.cos(ca) * 9.5, 1.9, cl); }
      h = arm(c, i * 16, -44, i, a, 26, 8.6, fur, fur, 5.2); hs.push(h);
    }
    E(c, 0, -27, 19.5, 24, fur); ef(c, 0, -22.5, 12.5, 16.5, lt);
    for (j = 0; j < 5; j++) L(c, -6 + j * 3, -30 + (j % 2) * 5, -5.2 + j * 3, -27 + (j % 2) * 5, 0.8, shade(fur, -0.08));
    if (v === 3) bow(c, 0, -46.5, 15, p.accent2);
    if (v === 2) { c.beginPath(); c.arc(hx, hy, 20.5, PI * 1.1, PI * 1.9); c.lineCap = 'round'; c.lineWidth = 5; c.strokeStyle = shade(p.accent, -0.34); c.stroke(); c.lineWidth = 3.2; c.strokeStyle = p.accent; c.stroke(); }
    for (j = -1; j <= 1; j++) L(c, hx + j * 3, hy - 15, hx + j * 5 + m.sw * 1.5, hy - 20.5 - (j ? 0 : 1.5), 1.8, fur); /* tuft */
    E(c, hx, hy, 19.5, 16, fur);
    ef(c, hx, hy + 1.2, 15.4, 12.2, q.face);
    for (i = -1; i <= 1; i += 2) ef(c, hx + i * 8.4, hy + 0.6, 6.4, 3.7, q.patch, i * 0.48);
    eyes(c, hx, hy - 0.4, 6.9, 2.1, m, '#1a1210'); blush(c, hx, hy + 6.6, 11.4, 2.3);
    E(c, hx, hy + 4.4, 3.5, 2.5, DARK); dot(c, hx - 1, hy + 3.7, 0.8, 'rgba(255,255,255,0.7)');
    mouth(c, hx, hy + 9, 4.4, m, DARK);
    if (v === 0) { /* a hibiscus by the ear, a leafy twig in the hand */
      leaf(c, hx + 13, hy - 9, 9, -0.2, GREEN); flower(c, hx + 14.5, hy - 11.5, 5.6, p.accent, p.gold, m.t * 0.4);
      h = hs[0]; c.save(); c.translate(h[0], h[1]); c.rotate(-0.25 + m.sw * 0.12);
      L(c, 0, 5, 0, -22, 1.6, '#7a5a3a'); leaf(c, 0, -8, 10, -0.5, GREEN); leaf(c, 0, -13, 10, PI + 0.5, GREEN2); leaf(c, 0, -18, 9, -0.7, GREEN2); leaf(c, 0, -22, 9, -PI / 2, GREEN); c.restore();
    } else if (v === 1) { /* a big leaf for a hat */
      c.save(); c.translate(hx, hy - 13.5); c.rotate(-0.1 + m.sw * 0.07);
      L(c, -24, 3, -30, 5.5, 2, GREEN2);
      c.beginPath(); c.moveTo(-25, 3.4); c.quadraticCurveTo(-4, -15, 25, 1.5); c.quadraticCurveTo(0, 7.5, -25, 3.4); c.closePath(); F(c, GREEN);
      L(c, -22, 3, 22, 1.6, 0.9, shade(GREEN, 0.35)); for (j = -2; j <= 2; j++) L(c, j * 8, 2.6, j * 8 + 4.5, -2.6 + Math.abs(j) * 0.9, 0.7, shade(GREEN, 0.3));
      c.restore();
      dot(c, hs[0][0], hs[0][1], 0.01, fur); flower(c, hs[0][0], hs[0][1] - 1, 4.4, p.gold, p.paper, m.t * 0.5);
    } else if (v === 2) { /* headphones */
      for (i = -1; i <= 1; i += 2) { R(c, hx + i * 19.6 - 3.8, hy - 6.5, 7.6, 14, 3.6, p.accent); dot(c, hx + i * 19.6, hy + 0.5, 1.9, p.gold); }
    } else { /* maracas */
      for (i = 0; i < 2; i++) { h = hs[i]; c.save(); c.translate(h[0], h[1]); c.rotate((i ? 1 : -1) * (0.25 + m.k * 0.6)); L(c, 0, 1, 0, -8, 2.2, '#8a5a34'); E(c, 0, -13.5, 5.2, 6.6, i ? p.accent2 : p.accent); L(c, -4.4, -13, 4.4, -13, 1.5, p.gold); dot(c, -1.6, -16.4, 1.2, 'rgba(255,255,255,0.6)'); c.restore(); }
    }
  }, { wide: 1.0, variants: ['flower sloth', 'leaf-hat sloth', 'headphones sloth', 'maracas sloth'] });

  /* ---------- panda: giant panda with bamboo, red panda, panda cub with a balloon, brown panda with a tambourine ---------- */
  function pandaish(c, m, p, wh, bk, o) {
    var i, hx = m.sw * 2.2, hy = -65 + m.k * 2.5, aa = armAngles(m, 1.0, 0.75), hL, hR, blink = frac(m.t * 0.31 + m.ph) < 0.035;
    for (i = -1; i <= 1; i += 2) { E(c, i * 13.5, -5.2, 11.2, 6.6, bk); ef(c, i * 14.5, -4.2, 5.2, 3, shade(bk, 0.22)); }
    hL = arm(c, -22, -46, -1, aa[0], 19, 10.4, bk, bk, 5.8); hR = arm(c, 22, -46, 1, aa[1], 19, 10.4, bk, bk, 5.8);
    E(c, 0, -30, 25, 27, wh);
    c.save(); c.beginPath(); c.ellipse(0, -30, 24.4, 26.4, 0, 0, TAU); c.clip(); ef(c, 0, -57, 31, 13.5, bk); ef(c, -7, -24, 9, 12, 'rgba(255,255,255,0.35)'); c.restore();
    if (o.tie) kerchief(c, 0, -50, 8.5, p.accent2, p.paper);
    c.save(); c.translate(hx, hy); c.scale(o.hs, o.hs);
    for (i = -1; i <= 1; i += 2) { E(c, i * 15.5, -13, 7.8, 7.6 + m.k * 0.8, bk); ef(c, i * 15.5, -12.4, 3.6, 3.4, shade(bk, 0.2)); }
    E(c, 0, 0, 21.5, 18.2, wh);
    for (i = -1; i <= 1; i += 2) ef(c, i * 8.8, -0.8, 5.5, 7.2, bk, -i * 0.5);
    eyes(c, 0, -1.4, 8.2, 2.6, m, '#ffffff'); if (!blink) for (i = -1; i <= 1; i += 2) { dot(c, i * 8.2, -1.2, 1.7, '#241c22'); dot(c, i * 8.2 + 0.7, -2, 0.6, '#fff'); }
    ef(c, 0, 7.4, 8.6, 6, shade(wh, -0.05)); blush(c, 0, 6.2, 14.6, 2.8);
    E(c, 0, 4, 3.8, 2.7, bk); dot(c, -1.1, 3.2, 0.9, 'rgba(255,255,255,0.6)');
    mouth(c, 0, 9.4, 4.4, m, bk);
    if (o.bow) bow(c, 10, -16, 13, p.accent);
    c.restore();
    return [hL, hR];
  }
  Art.add('character', 'panda', function (c, m, p) {
    var v = m.v, i, h, hs;
    if (v === 0) { hs = pandaish(c, m, p, '#fffdf8', '#2e2a32', { hs: 1 }); h = hs[0]; bamboo(c, h[0], h[1], -0.14 + m.sw * 0.1, 50); E(c, h[0], h[1], 5.8, 5.8, '#2e2a32'); return; }
    if (v === 2) { /* the cub: small body, big head, a bow and a balloon */
      c.save(); c.scale(0.8, 0.8); hs = pandaish(c, m, p, '#fffdf8', '#3a3540', { hs: 1.16, bow: true }); h = hs[0];
      balloon(c, h[0], h[1], h[0] + 3 + m.sw * 3.5, h[1] - 38 - m.k * 2, p.accent2); E(c, h[0], h[1], 5.8, 5.8, '#3a3540'); c.restore(); return;
    }
    if (v === 3) { /* the brown panda shakes a tambourine */
      hs = pandaish(c, m, p, '#f7ead6', '#9a673e', { hs: 1, tie: true }); h = hs[0];
      c.save(); c.translate(h[0], h[1]); c.rotate(-0.3 - m.k * 0.7 + m.sw * 0.15); E(c, 0, -8, 9, 9, p.accent); ef(c, 0, -8, 6.5, 6.5, p.paper);
      for (i = 0; i < 6; i++) { E(c, Math.cos(i / 6 * TAU) * 7.8, -8 + Math.sin(i / 6 * TAU) * 7.8, 1.7, 1.7, p.gold); } c.restore(); E(c, h[0], h[1], 5.8, 5.8, '#9a673e'); return;
    }
    /* the red panda: rust coat, dark legs and belly, a ringed tail, a white mask */
    var ru = '#d9682e', dk = '#3d2822', cr = '#fff5e6', hx = m.sw * 2.4, hy = -57 + m.k * 2.5, aa = armAngles(m, 1.2, 0.8);
    c.save(); c.translate(11, -13); c.rotate(-0.6 + m.sw * 0.26 + Math.sin(m.t * 2.1) * 0.07); E(c, 17, 0, 20, 9.2, ru);
    c.save(); c.beginPath(); c.ellipse(17, 0, 19.4, 8.6, 0, 0, TAU); c.clip(); for (i = 0; i < 4; i++) L(c, 9 + i * 8, -12, 9 + i * 8, 12, 3.4, i === 3 ? dk : '#f2b27c'); c.restore(); c.restore();
    for (i = -1; i <= 1; i += 2) { L(c, i * 7.5, -16, i * 8.5, -5, 9, shade(dk, -0.34)); L(c, i * 7.5, -16, i * 8.5, -5, 7.2, dk); E(c, i * 10, -3.4, 8, 4.4, dk); }
    h = arm(c, -14, -40, -1, aa[0], 16, 6.6, dk, dk, 3.9); arm(c, 14, -40, 1, aa[1], 16, 6.6, dk, dk, 3.9);
    E(c, 0, -27, 17, 20.5, ru); ef(c, 0, -22.5, 10, 13.5, dk);
    bow(c, 0, -44.5, 14, p.accent2);
    c.save(); c.translate(h[0], h[1]); c.rotate(-0.3 + m.sw * 0.14); L(c, 0, 3, 0, -13, 1.3, GREEN2); leaf(c, 0, -5, 9, -0.6, GREEN); leaf(c, 0, -9, 9, PI + 0.6, GREEN); leaf(c, 0, -13, 9, -PI / 2, GREEN2); c.restore(); E(c, h[0], h[1], 3.9, 3.9, dk);
    c.save(); c.translate(hx, hy);
    for (i = -1; i <= 1; i += 2) { Pg(c, [[i * 7, -9], [i * 19.5, -25 - m.k * 1.5], [i * 21, -5]], ru); Pg(c, [[i * 11, -10.5], [i * 18, -20.5 - m.k * 1.5], [i * 18.6, -8.5]], cr, true); }
    E(c, 0, 0, 21, 16.5, ru);
    for (i = -1; i <= 1; i += 2) { ef(c, i * 12.6, 5.6, 7, 6.2, cr); ef(c, i * 7.6, -8.2, 3.2, 2, cr, i * 0.3); L(c, i * 8.2, 1.5, i * 11.5, 9.5, 2, '#a8481f'); }
    ef(c, 0, 6.6, 8.4, 6.6, cr);
    eyes(c, 0, -2.2, 8, 2.3, m); blush(c, 0, 5.2, 14.4, 2.4);
    E(c, 0, 3.6, 3.2, 2.3, dk); dot(c, -0.9, 2.9, 0.8, 'rgba(255,255,255,0.7)');
    mouth(c, 0, 8.8, 4, m, dk);
    c.restore();
  }, { wide: 0.98, variants: ['giant panda with bamboo', 'red panda', 'panda cub with a balloon', 'brown panda with a tambourine'] });

  /* ---------- koala: gum-leaf koala, mum with a joey, sun-hat koala, blossom koala ---------- */
  var KO = [
    { fur: '#a6b0bd', ch: '#f6f3f0', ear: '#f5dad8' },
    { fur: '#b7b1ad', ch: '#fcf7f1', ear: '#f7dcd2' },
    { fur: '#8d817c', ch: '#f0e6dc', ear: '#ecc9c0' },
    { fur: '#cdd2dc', ch: '#ffffff', ear: '#fbdfe2' }
  ];
  function koalaHead(c, m, q, wig) {
    var i, fur = q.fur;
    for (i = -1; i <= 1; i += 2) { c.save(); c.translate(i * 15, -6); c.rotate(i * wig); fluff(c, i * 6.5, -4, 8.2, 8.2, 9, 3.7, fur, 0.3); fluff(c, i * 6.8, -3.4, 4.4, 4.6, 7, 2.1, q.ear, 0.1); c.restore(); }
    E(c, 0, 0, 21, 18, fur);
    ef(c, -6, -8.5, 9, 4.5, 'rgba(255,255,255,0.16)', -0.3);
    eyes(c, 0, -2.4, 10.4, 2.3, m); blush(c, 0, 5.4, 14.6, 2.8);
    E(c, 0, 0.6, 5, 6.4, '#3b353f'); ef(c, -1.6, -2, 1.3, 2.3, 'rgba(255,255,255,0.4)', 0.25);
    mouth(c, 0, 10.8, 4.6, m, '#3b353f');
  }
  Art.add('character', 'koala', function (c, m, p) {
    var v = m.v, q = KO[v], fur = q.fur, i, j, h, hx = m.sw * 2.3, hy = -60 + m.k * 2.5, aa = armAngles(m, 1.05, 0.75), hL;
    for (i = -1; i <= 1; i += 2) { E(c, i * 11.5, -4.6, 9.8, 5.7, fur); ef(c, i * 12.5, -3.6, 4.4, 2.4, '#5a545e'); }
    hL = arm(c, -17, -42, -1, aa[0], 15, 9.8, fur, fur, 5.4); arm(c, 17, -42, 1, aa[1], 15, 9.8, fur, fur, 5.4);
    if (v === 1) { /* the joey rides on her back and peeks over a shoulder */
      c.save(); c.translate(-25 - m.sw * 1.2, -46 - m.k * 3.5); c.rotate(-0.25 - m.sw * 0.08); c.scale(0.56, 0.56);
      koalaHead(c, { t: m.t, ph: m.ph + 0.37, open: m.open, calm: false }, KO[3], 0.1 + m.k * 0.3); c.restore();
    }
    E(c, 0, -27, 20, 23.5, fur);
    fluff(c, 0, -25.5, 8.6, 11, 11, 3.6, q.ch, 0.2);
    if (v === 1) { E(c, -13.5, -42, 3.4, 2.7, KO[3].fur, -0.4); E(c, -9.5, -44.5, 3.4, 2.7, KO[3].fur, -0.2); }
    if (v === 2) kerchief(c, 0, -45, 8, p.accent, p.paper);
    if (v === 0) { /* a sprig of gum leaves */
      c.save(); c.translate(hL[0], hL[1]); c.rotate(-0.35 + m.sw * 0.14); L(c, 0, 4, 0, -21, 1.4, '#8a6a4a');
      for (j = 0; j < 4; j++) { leaf(c, 0, -5 - j * 5, 9.5, -0.45, j % 2 ? '#5fae96' : '#7cc3a8'); leaf(c, 0, -7.5 - j * 5, 9.5, PI + 0.45, j % 2 ? '#7cc3a8' : '#5fae96'); }
      leaf(c, 0, -21, 9, -PI / 2, '#7cc3a8'); c.restore(); E(c, hL[0], hL[1], 4.9, 4.9, fur);
    }
    if (v === 3) { h = hL; L(c, h[0], h[1] + 3, h[0] - 1.5 + m.sw, h[1] - 12, 1.3, GREEN2); leaf(c, h[0] - 0.5, h[1] - 4, 7, -0.5, GREEN); pom(c, h[0] - 1.5 + m.sw, h[1] - 13, 4.6, p.accent); for (j = 0; j < 6; j++) dot(c, h[0] - 1.5 + m.sw + Math.cos(j / 6 * TAU + m.t) * 3.4, h[1] - 13 + Math.sin(j / 6 * TAU + m.t) * 3.4, 0.7, p.gold); E(c, h[0], h[1], 4.9, 4.9, fur); }
    c.save(); c.translate(hx, hy);
    koalaHead(c, m, q, 0.06 + m.sw * 0.08 + m.k * 0.22);
    if (v === 2) { /* a sun hat */
      c.save(); c.rotate(-0.06 + m.sw * 0.04); R(c, -10.5, -27.5 - m.k, 21, 14, 7, p.accent2); Rn(c, -10.2, -19.4 - m.k, 20.4, 3.4, 0, p.paper); E(c, 0, -14.6, 19, 4.3, p.accent2); ef(c, -3, -15.6, 11, 1.4, 'rgba(255,255,255,0.3)'); c.restore();
    }
    if (v === 3) { for (j = -1; j <= 1; j++) { leaf(c, j * 8, -15.6 + j * j * 1.6, 7, -PI / 2 + j * 0.9 + 0.7, GREEN); } for (j = -1; j <= 1; j++) { pom(c, j * 8, -16.4 + j * j * 1.8, j ? 3.5 : 4.3, j ? p.gold : p.accent); } }
    c.restore();
  }, { wide: 1.0, variants: ['koala with gum leaves', 'koala mum and joey', 'sun-hat koala', 'blossom koala'] });

  /* ---------- elephant: splashing elephant, baby with a balloon, top-hat elephant, flower elephant ---------- */
  var EL = [
    { sk: '#a8b4c6', inr: '#f3b9c2' },
    { sk: '#c8bfd8', inr: '#ffc4d2' },
    { sk: '#8d9fb6', inr: '#e9a9b4' },
    { sk: '#d6b6a2', inr: '#f6c0b4' }
  ];
  function bz(a, b, d, e, t) { var u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * d + t * t * t * e; }
  Art.add('character', 'elephant', function (c, m, p) {
    var v = m.v, q = EL[v], sk = q.sk, ol = shade(sk, -0.34), lt = shade(sk, 0.16), nail = '#fbf3e4', i, j, baby = v === 1;
    var hx = m.sw * 2, hy = -62 + m.k * 2.5, aa = armAngles(m, 1.0, 0.7), hs = baby ? 1.14 : 1;
    var lift = clamp(Math.max(m.open * 0.95, m.k * 0.7, m.wave ? 0.75 + Math.sin(m.t * 9) * 0.12 : 0), 0, 1);
    c.save(); if (baby) c.scale(0.8, 0.8);
    c.beginPath(); c.moveTo(-19, -20); c.quadraticCurveTo(-30, -18, -28 - m.sw * 2, -9); c.lineWidth = 1.6; c.lineCap = 'round'; c.strokeStyle = ol; c.stroke(); dot(c, -28 - m.sw * 2, -8.4, 2.2, ol); /* tail */
    for (i = -1; i <= 1; i += 2) { R(c, i * 12 - 8.6, -19, 17.2, 19, 6.5, sk); for (j = -1; j <= 1; j++) ef(c, i * 12 + j * 4.6, -1.7, 1.9, 1.6, nail); }
    var hands = [];
    for (i = -1; i <= 1; i += 2) { var hh = arm(c, i * 19, -43, i, i < 0 ? aa[0] : aa[1], 16, 10.4, sk, sk, 5.6); hands.push(hh); ef(c, hh[0] + i * 2.2, hh[1] + 2.4, 1.5, 1.2, nail); ef(c, hh[0] - i * 1.6, hh[1] + 3.6, 1.5, 1.2, nail); }
    E(c, 0, -29, 22, 24, sk); ef(c, 0, -24, 13.5, 15.5, lt);
    c.save(); c.translate(hx, hy); c.scale(hs, hs);
    for (i = -1; i <= 1; i += 2) { /* the big ears flap on the beat */
      c.save(); c.translate(i * 14, -3); c.rotate(i * (0.1 + m.k * 0.3) + m.sw * 0.07); E(c, i * 13.5, 1, 14.5, 17.5, sk); ef(c, i * 14.2, 2, 9.6, 12.6, q.inr); c.restore();
    }
    E(c, 0, 0, 19, 17.5, sk); ef(c, -5.5, -9, 8, 4, 'rgba(255,255,255,0.18)', -0.3);
    if (baby) for (j = -1; j <= 1; j++) L(c, j * 2.4, -16.6, j * 4.2 + m.sw, -21.5, 1.3, ol);
    eyes(c, 0, -3.4, 9.6, 2.3, m); lashes(c, 0, -3.4, 9.6, 2.3, DARK); blush(c, 0, 3.6, 13.6, 2.7);
    mouth(c, v === 2 ? 10.2 : 8, v === 2 ? 10.6 : 11.6, 3.5, m, shade(sk, -0.6));
    if (v === 2) { /* tusks and a monocle */
      for (i = -1; i <= 1; i += 2) E(c, i * 6.4, 13, 1.8, 4.6, '#fff6e2', -i * 0.45);
      c.beginPath(); c.moveTo(13.6, -0.6); c.quadraticCurveTo(18.5, 5, 16, 13); c.lineWidth = 0.6; c.strokeStyle = p.gold; c.stroke();
      c.beginPath(); c.arc(9.6, -3.4, 4.7, 0, TAU); c.lineWidth = 1.9; c.strokeStyle = shade(p.gold, -0.34); c.stroke(); c.lineWidth = 1.1; c.strokeStyle = p.gold; c.stroke();
    }
    /* the trunk: a tapering row of beads along a curve; it hangs in a J, and lifts to sing, to trumpet hello and on every beat */
    var x1 = 1 - lift, y1 = 20 - 2 * lift, x2 = -2 + m.sw * 3 - 18 * lift, y2 = 33 - 11 * lift, x3 = -11 + m.sw * 5 - 12 * lift, y3 = 26 - 40 * lift, N = 16, tx, ty, r;
    for (j = 0; j <= N; j++) { r = 5.3 - 2 * j / N; dot(c, bz(0, x1, x2, x3, j / N), bz(4, y1, y2, y3, j / N), r + 0.6, ol); }
    for (j = 0; j <= N; j++) { r = 5.3 - 2 * j / N; dot(c, bz(0, x1, x2, x3, j / N), bz(4, y1, y2, y3, j / N), r, sk); }
    for (j = 3; j <= 13; j += 2) { tx = bz(0, x1, x2, x3, j / N); ty = bz(4, y1, y2, y3, j / N); var dx = bz(0, x1, x2, x3, (j + 0.5) / N) - tx, dy = bz(4, y1, y2, y3, (j + 0.5) / N) - ty, dl = Math.sqrt(dx * dx + dy * dy) || 1, rr = (5.3 - 2 * j / N) * 0.62; L(c, tx - dy / dl * rr, ty + dx / dl * rr, tx + dy / dl * rr, ty - dx / dl * rr, 0.65, shade(sk, -0.14)); }
    tx = x3; ty = y3; dot(c, tx - 0.5, ty - 0.4, 1.3, shade(sk, -0.3));
    if (v === 0) { /* a little shower when the trunk is up */
      var sp = clamp((lift - 0.2) * 2.2, 0, 1), far = 5 + (1 - m.k) * 8;
      if (sp > 0.05) for (j = -2; j <= 2; j++) { c.beginPath(); c.ellipse(tx + j * far * 0.42 - 1, ty - far - 2 + j * j * 1.5, 1.4, 2.1, j * 0.3, 0, TAU); c.fillStyle = alpha('#8fdcff', (0.3 + 0.7 * sp).toFixed(2)); c.fill(); }
    } else if (baby) bow(c, 9, -15.5, 11, p.accent2);
    else if (v === 2) { /* a top hat */
      c.save(); c.translate(0, -15.5); c.rotate(0.1 + m.sw * 0.05); R(c, -8.5, -17 - m.k, 17, 17, 2.4, p.accent); Rn(c, -8.2, -6.4 - m.k, 16.4, 3.4, 0, p.gold); R(c, -13.5, -2.4, 27, 4.4, 2.2, p.accent); c.restore();
    } else if (v === 3) { L(c, tx, ty, tx - 2, ty - 10, 1.4, GREEN2); leaf(c, tx - 1, ty - 4, 7, -2.6, GREEN); flower(c, tx - 2, ty - 12, 5.4, p.accent, p.gold, m.t * 0.6); crown(c, 0, -16.5, 15, p, m.t); }
    c.restore();
    if (baby) { hh = hands[0]; balloon(c, hh[0], hh[1], hh[0] - 3 + m.sw * 3, hh[1] - 50 - m.k * 2, p.accent); E(c, hh[0], hh[1], 5.6, 5.6, sk); }
    c.restore();
  }, { wide: 1.04, variants: ['splashing elephant', 'baby elephant with a balloon', 'top-hat elephant', 'flower elephant'] });
});
