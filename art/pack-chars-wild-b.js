/* Send a Carol art pack: wild animals B (giraffe, lion, monkey, flamingo, peacock), four variants each.
   Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var INK = '#2b2118', MOUTH = '#5a3320';

  /* ---------- shared strokes ---------- */
  function strokeO(c, w, col) { /* the current path as a fat line with the house outline */
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (K.ow() > 0) { c.lineWidth = w + K.ow() * 1.6; c.strokeStyle = shade(col, -0.34); c.stroke(); }
    c.lineWidth = w; c.strokeStyle = col; c.stroke();
  }
  function quad(c, a, b, d, w, col) { c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0], b[1], d[0], d[1]); strokeO(c, w, col); }
  function qpt(a, b, d, t) { var u = 1 - t; return [u * u * a[0] + 2 * u * t * b[0] + t * t * d[0], u * u * a[1] + 2 * u * t * b[1] + t * t * d[1]]; }
  function cubic(c, a, b, d, e, w, col) { c.beginPath(); c.moveTo(a[0], a[1]); c.bezierCurveTo(b[0], b[1], d[0], d[1], e[0], e[1]); strokeO(c, w, col); }
  function lashes(c, x, y, dx, r) { var s; for (s = -1; s <= 1; s += 2) { L(c, x + s * (dx + r * 0.7), y - r * 0.5, x + s * (dx + r * 1.9), y - r * 1.5, 0.7, INK); L(c, x + s * (dx + r * 0.2), y - r * 0.9, x + s * (dx + r * 0.9), y - r * 2.1, 0.7, INK); } }
  function maraca(c, h, a, s, col, band) { /* held along the arm, past the hand */
    var dx = s * Math.sin(a), dy = Math.cos(a), x = h[0] + dx * 6, y = h[1] + dy * 6;
    L(c, h[0] - dx * 2, h[1] - dy * 2, x, y, 2, '#8a5a34');
    E(c, x + dx * 3.6, y + dy * 3.6, 4.8, 4.8, col);
    L(c, x + dx * 3.6 - dy * 3.6, y + dy * 3.6 + dx * 3.6, x + dx * 3.6 + dy * 3.6, y + dy * 3.6 - dx * 3.6, 1.5, band);
    dot(c, x + dx * 3.6 - 1.4, y + dy * 3.6 - 1.6, 1.1, 'rgba(255,255,255,0.7)');
  }

  /* =========================== giraffe =========================== */
  var GI = [
    { coat: '#f7c653', patch: '#b9682b', cream: '#fdebc0', neck: 31 },   /* classic, bow tie */
    { coat: '#eda24a', patch: '#7d3f1e', cream: '#fbe3bd', neck: 29 },   /* reticulated, flower crown */
    { coat: '#fbdc93', patch: '#dd9c55', cream: '#fff3d6', neck: 10 },   /* calf with a daisy */
    { coat: '#ffd9c4', patch: '#e0705c', cream: '#fff1e6', neck: 25 }    /* dapper: heart spots, top hat, three bow ties */
  ];
  function gpatch(c, g, v, x, y, r, rot) {
    var i, a;
    c.fillStyle = g.patch;
    if (v === 1) { c.beginPath(); for (i = 0; i < 5; i++) { a = rot + i / 5 * TAU; if (i) c.lineTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3); else c.moveTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3); } c.closePath(); c.fill(); }
    else if (v === 3) { K.heartPath(c, x, y, r * 2.3); c.fill(); }
    else { c.beginPath(); c.ellipse(x, y, r, r * 0.82, rot, 0, TAU); c.fill(); }
  }
  Art.add('character', 'giraffe', function (c, m, p) {
    var v = m.v, g = GI[v], calf = v === 2, hs = calf ? 1.22 : 1, hx = m.sw * 3, hy = -42 - g.neck - 9 * hs + m.k * 2.5, aa = K.armAngles(m, 1.1, 0.8), i, q, n;
    var BP = [[-9, -37, 3.2, 0.3], [8.5, -38.5, 2.8, 1.1], [-11.5, -27, 2.8, 2], [11.5, -28, 3, 0.7], [-8, -17.5, 2.6, 1.6], [8.5, -18, 2.4, 0.2]];
    var tx = -24 - m.sw * 3, ty = -15 + m.k * 2 + Math.sin(m.t * 2.3) * 1.2; /* tail */
    quad(c, [-10, -24], [-21, -27], [tx, ty], 2.2, g.coat); E(c, tx - 0.8, ty + 2.6, 2.6, 4.2, g.patch, 0.4);
    for (i = -1; i <= 1; i += 2) { L(c, i * 7, -20, i * 8, -5, 8.6, shade(g.coat, -0.34)); L(c, i * 7, -20, i * 8, -5, 7, g.coat); gpatch(c, g, v, i * 7.6, -12, 1.9, i); E(c, i * 8.5, -3, 6.4, 3.7, g.patch); }
    var A = [0, -40], B = [-hx * 0.7, -42 - g.neck * 0.5], D = [hx, hy + 5]; /* the neck bends against the head */
    n = calf ? 2 : 6;
    for (i = 1; i <= n; i++) { q = qpt(A, B, D, i / (n + 1)); E(c, q[0] - 5.4, q[1], 2.1, 2.6, g.patch); } /* mane ridge */
    quad(c, A, B, D, calf ? 11 : 10, g.coat);
    n = calf ? 1 : 4;
    for (i = 0; i < n; i++) { q = qpt(A, B, D, (i + 0.75) / (n + 0.6)); gpatch(c, g, v, q[0] + (i % 2 ? 2 : -1.4), q[1], 2.3, i * 1.3); }
    var h0 = K.arm(c, -12, -37, -1, aa[0], 15, 5.6, g.coat, g.patch, 3.3); K.arm(c, 12, -37, 1, aa[1], 15, 5.6, g.coat, g.patch, 3.3);
    E(c, 0, -29, 15, 16.5, g.coat);
    for (i = 0; i < BP.length; i++) gpatch(c, g, v, BP[i][0], BP[i][1], BP[i][2], BP[i][3]);
    E(c, 0, -25, 8.6, 11, g.cream);
    if (v === 0) K.bow(c, 0, -45.5, 14, p.accent2);
    if (v === 1) for (i = -3; i <= 3; i++) E(c, i * 2.9, -45.5 + (9 - i * i) * 0.28, 1.5, 1.5, i % 2 ? p.gold : p.accent2);
    if (v === 3) for (i = 0; i < 3; i++) { q = qpt(A, B, D, 0.2 + i * 0.3); K.bow(c, q[0], q[1], 11, [p.accent, p.gold, p.accent2][i]); }
    if (calf) { L(c, h0[0], h0[1] + 1, h0[0] - 1.5, h0[1] - 11, 1.3, '#3f9a5c'); K.flower(c, h0[0] - 1.5, h0[1] - 12, 4.4, '#ffffff', p.gold, m.t * 0.6); }
    c.save(); c.translate(hx, hy); c.rotate(m.sw * 0.07); c.scale(hs, hs); /* head */
    for (i = -1; i <= 1; i += 2) { c.save(); c.translate(i * 9, -3.5); c.rotate(-i * (0.28 + m.k * 0.3)); E(c, i * 6.5, 0, 6.6, 3.5, g.coat); c.beginPath(); c.ellipse(i * 6.5, 0.3, 4, 1.8, 0, 0, TAU); c.fillStyle = '#f4a9a0'; c.fill(); c.restore(); }
    var ox = v === 3 ? 8.6 : 4.3, oy = v === 3 ? -6 : -8;
    for (i = -1; i <= 1; i += 2) { var ex = i * (ox + 1.3 + (v === 3 ? 3 : 0)) + m.sw * 0.7, ey = oy - 8.5 - m.k * 1.2 + (v === 3 ? 3 : 0); L(c, i * ox, oy, ex, ey, 3.6, shade(g.coat, -0.34)); L(c, i * ox, oy, ex, ey, 2.3, g.coat); E(c, ex, ey, 2.6, 2.6, g.patch); }
    if (calf) for (i = -1; i <= 1; i++) E(c, i * 1.8, -10.5, 1.5, 3, g.patch, i * 0.4);
    E(c, 0, 0, 11, 10, g.coat);
    if (v !== 3) gpatch(c, g, v, 0, -6.6, 1.9, 0.6);
    E(c, 0, 6, 9.2, 6.4, g.cream);
    dot(c, -3, 4.4, 0.8, shade(g.patch, -0.25)); dot(c, 3, 4.4, 0.8, shade(g.patch, -0.25));
    K.eyes(c, 0, -1.6, 5.6, 2.1, m); if (v === 1) lashes(c, 0, -1.6, 5.6, 2.1);
    K.blush(c, 0, 2.2, 9.4, 2);
    K.mouth(c, 0, 8, 3.4, m, MOUTH);
    if (v === 1) { K.flower(c, -6.8, -8.6, 3.4, p.accent, p.gold, 0.3); K.flower(c, 6.8, -8.6, 3.4, p.accent, p.gold, 1.1); K.flower(c, 0, -10.6, 3.8, p.snow, p.gold, m.t * 0.4); }
    if (v === 3) { c.save(); c.rotate(-0.12); R(c, -6.5, -23.5, 13, 14, 2, '#3a3552'); Rn(c, -6.5, -14, 13, 3, 0, p.accent); R(c, -10.5, -11, 21, 3.4, 1.7, '#3a3552'); Rn(c, -4.6, -21.5, 1.6, 6, 0.8, 'rgba(255,255,255,0.28)'); c.restore(); }
    c.restore();
  }, { wide: 0.75, variants: ['classic giraffe with a bow tie', 'reticulated giraffe with a flower crown', 'giraffe calf with a daisy', 'dapper peach giraffe with heart spots and a top hat'] });

  /* =========================== lion =========================== */
  var LN = [
    { fur: '#f4b64c', mane: '#c9622a', cream: '#fde8bd', nose: '#8a4034' },   /* king: scalloped mane, crown */
    { fur: '#e9b76a', mane: null, cream: '#fbeacb', nose: '#8a4034' },        /* lioness: flower, pearls */
    { fur: '#f8cf76', mane: '#d98a3a', cream: '#fff1cf', nose: '#a8564a' },   /* cub: tuft, spots, rattle */
    { fur: '#f8f2e8', mane: '#dccbab', cream: '#ffffff', nose: '#e58a94' }    /* white lion: spiky mane, bow tie */
  ];
  Art.add('character', 'lion', function (c, m, p) {
    var v = m.v, g = LN[v], cub = v === 2, hx = m.sw * 2, hy = (cub ? -55 : v === 1 ? -64 : -61) + m.k * 2.5, aa = K.armAngles(m, 1.05, 0.75), i, j, a, tuft = g.mane || shade(g.fur, -0.3), er = v === 1 || cub ? 7.2 : 6;
    if (cub) { c.save(); c.scale(0.9, 0.9); }
    var tx = 33 + m.sw * 4, ty = -31 - m.k * 3 + Math.sin(m.t * 2.2) * 1.5; /* tail */
    quad(c, [15, -12], [36, -8], [tx, ty], 3.2, g.fur);
    c.save(); c.translate(tx, ty); c.rotate(0.5 + m.sw * 0.35); E(c, 0, -4, 4.6, 7, tuft); c.restore();
    for (i = -1; i <= 1; i += 2) { E(c, i * 12, -4.6, 10.5, 5.6, g.fur); L(c, i * 12 - 3, -1.2, i * 12 - 3, -4, 0.7, shade(g.fur, -0.3)); L(c, i * 12 + 3, -1.2, i * 12 + 3, -4, 0.7, shade(g.fur, -0.3)); }
    K.arm(c, -20, cub ? -39 : -43, -1, aa[0], 18, 9.5, g.fur, g.fur, 5.4);
    if (!m.wave) { var h1 = K.arm(c, 20, cub ? -39 : -43, 1, aa[1], 18, 9.5, g.fur, g.fur, 5.4); if (cub) maraca(c, h1, aa[1], 1, p.accent, p.gold); }
    E(c, 0, cub ? -25 : -27, 21.5, cub ? 21 : 25, g.fur); E(c, 0, cub ? -22 : -23, 13, cub ? 13 : 16, g.cream);
    if (v === 1) for (i = -3; i <= 3; i++) E(c, i * 3.7, -47.5 + (9 - i * i) * 0.4, 1.7, 1.7, p.paper);
    if (v === 0 || v === 3) { c.save(); c.translate(hx, hy); c.rotate(m.sw * 0.1 + Math.sin(m.t * 1.9) * 0.03); /* mane */
      if (v === 0) {
        for (i = 0; i < 12; i++) { a = i / 12 * TAU; E(c, Math.cos(a) * 20, Math.sin(a) * 19, 8.4, 8.4, g.mane); }
        dot(c, 0, 0, 22.5, g.mane);
        for (i = 0; i < 12; i++) { a = (i + 0.5) / 12 * TAU; dot(c, Math.cos(a) * 16.5, Math.sin(a) * 15.5, 5.6, shade(g.mane, 0.16)); }
      } else {
        K.starPath(c, 0, 0, 30 + m.k * 1.5, 21, 13, 0.1); F(c, g.mane);
        K.starPath(c, 0, 0, 24, 18.5, 13, 0.34); c.fillStyle = shade(g.mane, 0.4); c.fill();
      }
      c.restore(); }
    if (v === 3) K.bow(c, 0, -43, 17, p.accent);
    for (i = -1; i <= 1; i += 2) { E(c, hx + i * 13.5, hy - 12.5 - m.k, er, er, g.fur); dot(c, hx + i * 13.5, hy - 12 - m.k, er * 0.52, '#f2a59a'); }
    if (cub) for (i = -1; i <= 1; i++) { c.save(); c.translate(hx + i * 2.6, hy - 14); c.rotate(i * 0.5 + m.sw * 0.2); E(c, 0, -3.6, 2.5, 5.2, tuft); c.restore(); }
    E(c, hx, hy, 17.5, 15.5, g.fur);
    if (cub) for (i = -1; i <= 1; i++) dot(c, hx + i * 4.2, hy - 9.5 - (i ? 0 : 1.6), 1.3, shade(g.fur, -0.2));
    c.fillStyle = g.cream; c.beginPath(); c.ellipse(hx - 4.6, hy + 6.6, 5.8, 4.6, 0, 0, TAU); c.ellipse(hx + 4.6, hy + 6.6, 5.8, 4.6, 0, 0, TAU); c.ellipse(hx, hy + 9.6, 4.6, 3.6, 0, 0, TAU); c.fill();
    if (v === 3) { c.strokeStyle = shade(g.fur, -0.14); c.lineWidth = 0.6; c.beginPath(); c.ellipse(hx - 4.6, hy + 6.6, 5.8, 4.6, 0, 0.1 * PI, 0.95 * PI); c.stroke(); c.beginPath(); c.ellipse(hx + 4.6, hy + 6.6, 5.8, 4.6, 0, 0.05 * PI, 0.9 * PI); c.stroke(); }
    Pg(c, [[hx - 3.5, hy + 1.6], [hx + 3.5, hy + 1.6], [hx, hy + 5.6]], g.nose); dot(c, hx - 1, hy + 2.6, 0.8, 'rgba(255,255,255,0.6)');
    for (i = -1; i <= 1; i += 2) for (j = 0; j < 3; j++) dot(c, hx + i * (5 + j * 1.7), hy + 6.2 + (j % 2) * 1.6, 0.55, shade(g.fur, -0.42));
    K.eyes(c, hx, hy - 3, 7.6, 2.3, m); if (v === 1) lashes(c, hx, hy - 3, 7.6, 2.3);
    K.blush(c, hx, hy + 3.2, 13.2, 2.6);
    K.mouth(c, hx, hy + 9.8, 4.2, m, MOUTH);
    if (v === 0) { c.save(); c.translate(hx, hy - 13.5); c.rotate(-0.1 + m.sw * 0.06); Pg(c, [[-8.5, 0], [-10.5, -10], [-5, -5.5], [0, -12.5], [5, -5.5], [10.5, -10], [8.5, 0]], p.gold); Rn(c, -8, -2.8, 16, 2.4, 0.6, shade(p.gold, -0.18)); dot(c, -10.5, -10, 1.5, p.accent); dot(c, 0, -12.5, 1.7, p.accent); dot(c, 10.5, -10, 1.5, p.accent); dot(c, 0, -5.4, 1.5, p.accent2); c.restore(); }
    if (v === 1) K.flower(c, hx + 14.5, hy - 9, 5, p.accent, p.gold, m.t * 0.5);
    if (m.wave) { var h2 = K.arm(c, 20, cub ? -39 : -43, 1, aa[1], 18, 9.5, g.fur, g.fur, 5.4); if (cub) maraca(c, h2, aa[1], 1, p.accent, p.gold); } /* the waving paw comes in front of the mane */
    if (cub) c.restore();
  }, { wide: 1.0, variants: ['lion king with a crown', 'lioness with a flower and pearls', 'lion cub with a rattle', 'white lion with a spiky mane and bow tie'] });

  /* =========================== monkey =========================== */
  var MK = [
    { fur: '#9b6339', skin: '#f5d3a8', dk: '#6f4325' },   /* brown monkey, banana */
    { fur: '#f08c2e', skin: '#fbdcb6', dk: '#c2611a' },   /* golden tamarin, ruff, maracas */
    { fur: '#9d98ab', skin: '#f1ddcc', dk: '#5f5a6e' },   /* silver gibbon, long arms, white face ring, flower */
    { fur: '#6a4a36', skin: '#f6cfae', dk: '#3d2a20' }    /* capuchin, cream chest, cymbals */
  ];
  function mmask(c, x, y, s, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x - 5.4 * s, y - 2.6, 7 * s, 7.4 * s, 0, 0, TAU); c.ellipse(x + 5.4 * s, y - 2.6, 7 * s, 7.4 * s, 0, 0, TAU); c.ellipse(x, y + 5.6, 11 * s, 7.6 * s, 0, 0, TAU); c.fill(); }
  Art.add('character', 'monkey', function (c, m, p) {
    var v = m.v, g = MK[v], hx = m.sw * 2.4, hy = -63 + m.k * 2.5, aa = K.armAngles(m, v === 2 ? 1.45 : 1.15, 0.85), al = v === 2 ? 25 : 17, i, s;
    var ts = m.sw * 3.5, tk = Math.sin(m.t * 2) * 1.5; /* curly tail */
    c.beginPath(); c.moveTo(9, -15); c.bezierCurveTo(31, -8, 42 + ts, -36, 28 + ts, -45 + tk); c.bezierCurveTo(19 + ts, -50 + tk, 18 + ts, -37 + tk, 26 + ts, -38 + tk); strokeO(c, 4, g.fur);
    for (i = -1; i <= 1; i += 2) { L(c, i * 7, -20, i * 9, -6, 7.6, shade(g.fur, -0.34)); L(c, i * 7, -20, i * 9, -6, 6, g.fur); E(c, i * 11.5, -3.4, 8.2, 4.2, g.skin); }
    var h0 = K.arm(c, -13, -42, -1, aa[0], al, 5.4, g.fur, g.skin, 3.5), h1 = K.arm(c, 13, -42, 1, aa[1], al, 5.4, g.fur, g.skin, 3.5);
    E(c, 0, -30, 14.5, 18, g.fur);
    if (v === 3) E(c, 0, -33, 12.5, 13.5, '#fbeed8'); else E(c, 0, -26, 8.8, 11.5, g.skin);
    if (v === 0) for (i = -1; i <= 1; i++) Pg(c, [[hx + i * 4 - 2.6, hy - 14], [hx + i * 5.4 + m.sw, hy - 21.5 - m.k * 1.5], [hx + i * 4 + 2.6, hy - 14]], g.fur);
    if (v === 1) { K.starPath(c, hx, hy, 26.5 + m.k, 20, 11, m.sw * 0.12); F(c, '#ffb84d'); }
    for (i = -1; i <= 1; i += 2) { E(c, hx + i * 17.5, hy + 0.5, 6.4, 7.4, g.skin); dot(c, hx + i * 17.7, hy + 0.8, 3.5, shade(g.skin, -0.16)); }
    E(c, hx, hy, 17, 15.5, g.fur);
    if (v === 2) mmask(c, hx, hy, 1.17, '#f8f3ea');
    if (v === 3) { mmask(c, hx, hy, 1.15, '#fbeed8'); c.save(); c.beginPath(); c.ellipse(hx, hy, 16.4, 14.9, 0, 0, TAU); c.clip(); c.fillStyle = g.dk; c.beginPath(); c.ellipse(hx, hy - 15.5, 15, 7.5, 0, 0, TAU); c.fill(); Pg(c, [[hx - 4, hy - 9.5], [hx + 4, hy - 9.5], [hx, hy - 5.5]], g.dk, true); c.restore(); }
    mmask(c, hx, hy, 1, g.skin);
    K.eyes(c, hx, hy - 2.8, 5.6, 2.2, { t: m.t, ph: m.ph + 0.37, calm: m.calm }); /* its own blink time */
    dot(c, hx - 1.5, hy + 3.1, 0.7, g.dk); dot(c, hx + 1.5, hy + 3.1, 0.7, g.dk);
    K.blush(c, hx, hy + 4.4, 10, 2.2);
    K.mouth(c, hx, hy + 7.4, 5, m, MOUTH);
    if (v === 0) { c.save(); c.translate(h0[0] - 2, h0[1] - 7); c.rotate(-0.35 + m.sw * 0.2); c.beginPath(); c.arc(0, 0, 8, 0.12 * PI, 0.92 * PI); strokeO(c, 4, '#ffd94a'); dot(c, Math.cos(0.12 * PI) * 8, Math.sin(0.12 * PI) * 8, 1.3, '#7a5326'); dot(c, Math.cos(0.92 * PI) * 8, Math.sin(0.92 * PI) * 8, 1.3, '#7a5326'); c.restore(); }
    if (v === 1) { maraca(c, h0, aa[0], -1, p.accent, p.gold); maraca(c, h1, aa[1], 1, p.accent2, p.gold); }
    if (v === 2) { L(c, h0[0], h0[1] + 1, h0[0] - 1, h0[1] - 11, 1.3, '#3f9a5c'); K.flower(c, h0[0] - 1, h0[1] - 12, 4.6, p.accent, p.gold, m.t * 0.6); }
    if (v === 3) { for (s = -1; s <= 1; s += 2) { var h = s < 0 ? h0 : h1; E(c, h[0] + s * 1.5, h[1] - 1, 2.4, 7.6, p.gold, s * 0.25); dot(c, h[0] + s * 1.5, h[1] - 1, 1.3, shade(p.gold, -0.25)); } if (m.k > 0.25) { K.twinkle(c, h1[0] + 6, h1[1] - 9, 1.5 + m.k * 3.5, p.snow); K.twinkle(c, h0[0] - 6, h0[1] - 9, 1 + m.k * 3, p.snow); } }
  }, { wide: 1.0, variants: ['brown monkey with a banana', 'golden tamarin with maracas', 'long-armed gibbon with a flower', 'capuchin with cymbals'] });

  /* =========================== flamingo =========================== */
  var FL = [
    { pk: '#ff8fb3', dk: '#ef5f8d', lt: '#ffc2d6', leg: '#e0577f' },   /* classic, one leg up, a flower */
    { pk: '#ff8a5e', dk: '#e9603a', lt: '#ffc0a3', leg: '#d9502e' },   /* coral, sunglasses, both feet down */
    { pk: '#e6e1ea', dk: '#c3bccb', lt: '#f8f5fa', leg: '#8f8794' },   /* fluffy grey chick */
    { pk: '#ec4f93', dk: '#c2306f', lt: '#ff9ac4', leg: '#b02a62' }    /* magenta, straw hat, pearls */
  ];
  function ffoot(c, x, col) { Pg(c, [[x - 4.6, 0], [x, -3.4], [x + 4.6, 0]], col); }
  Art.add('character', 'flamingo', function (c, m, p) {
    var v = m.v, g = FL[v], chick = v === 2, by = chick ? -26 : -47, hx = m.sw * 3, hy = (chick ? -57 : -83) + m.k * 2.5, aa = K.armAngles(m, 0.75, 0.8), i, lw = chick ? 2.8 : 2.1, lift = m.k * 3.5;
    if (chick) { for (i = -1; i <= 1; i += 2) { L(c, i * 5, by + 10, i * 6, -2, lw, g.leg); ffoot(c, i * 6, g.leg); } }
    else if (v === 1) { for (i = -1; i <= 1; i += 2) { L(c, i * 4, by + 10, i * 8, -23, lw, g.leg); L(c, i * 8, -23, i * 9, -2, lw, g.leg); dot(c, i * 8, -23, 1.9, g.leg); ffoot(c, i * 9, g.leg); } }
    else {
      L(c, -4, by + 10, -12, -31 - lift, lw, g.leg); L(c, -12, -31 - lift, -3, -22 - lift, lw, g.leg); dot(c, -12, -31 - lift, 1.9, g.leg); Pg(c, [[-3, -24 - lift], [1.5, -20.5 - lift], [-4, -18.5 - lift]], g.leg);
      L(c, 2, by + 10, 3, -23, lw, g.leg); L(c, 3, -23, 2, -2, lw, g.leg); dot(c, 3, -23, 1.9, g.leg); ffoot(c, 2, g.leg);
    }
    var ps = v === 3 ? 1.35 : chick ? 0.6 : 1; /* tail plume */
    for (i = 0; i < 3; i++) { c.save(); c.translate(-12, by - 2); c.rotate(-0.55 + i * 0.36 + m.sw * 0.16); E(c, -9 * ps, 0, 10 * ps, 4 * ps, i === 1 ? g.pk : g.dk); c.restore(); }
    if (chick) cubic(c, [0, by - 8], [0, by - 14], [hx, hy + 12], [hx, hy + 6], 8, g.pk);
    else cubic(c, [5, by - 8], [25, by - 19], [-19 + hx, by - 24], [hx, hy + 6], 5.6, g.pk);
    c.save(); c.translate(-13, by - 4); c.rotate(aa[0]); E(c, 0, 9, 6, 13, g.dk); if (!chick) E(c, 0, 19.5, 3.2, 3.4, '#3a2a3a'); c.restore(); /* far wing */
    E(c, 0, by, chick ? 14.5 : 17, chick ? 14 : 13.5, g.pk);
    c.fillStyle = g.lt; c.beginPath(); c.ellipse(1.5, by + 3, chick ? 9 : 10.5, chick ? 9 : 8, 0, 0, TAU); c.fill();
    c.strokeStyle = shade(g.pk, -0.14); c.lineWidth = 0.9;
    for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-0.5 + i * 5.5, by + 3 - Math.abs(i) * 2.5); c.lineTo(1.5 + i * 5.5, by + 5.5 - Math.abs(i) * 2.5); c.lineTo(3.5 + i * 5.5, by + 3 - Math.abs(i) * 2.5); c.stroke(); }
    var wa = m.wave ? 2.4 + Math.sin(m.t * 9) * 0.3 : Math.max(0.6, aa[1]);
    c.save(); c.translate(13, by - 4); c.rotate(-wa); E(c, 0, 9, 6, 13, g.dk); if (!chick) E(c, 0, 19.5, 3.2, 3.4, '#3a2a3a'); c.restore();
    if (v === 3) for (i = -1; i <= 1; i++) E(c, 4.5 + i * 3.4, by - 12.2 + Math.abs(i) * 0.4, 1.7, 1.7, p.paper);
    if (chick) for (i = -1; i <= 1; i++) { c.save(); c.translate(hx + i * 2.4, hy - 8.5); c.rotate(i * 0.5 + m.sw * 0.25); E(c, 0, -3, 2.1, 4.4, i ? g.dk : g.lt); c.restore(); }
    var hr = chick ? 11.5 : 11;
    E(c, hx, hy, hr, hr * 0.95, g.pk);
    if (v === 1) { for (i = -1; i <= 1; i += 2) { R(c, hx + i * 5.2 - 4.2, hy - 6, 8.4, 6.4, 2.4, '#2b2233'); L(c, hx + i * 5.2 - 2, hy - 1.8, hx + i * 5.2 + 0.5, hy - 4.4, 0.8, 'rgba(255,255,255,0.55)'); } L(c, hx - 1.2, hy - 3.4, hx + 1.2, hy - 3.4, 1, '#2b2233'); }
    else K.eyes(c, hx, hy - 2.6, 5.4, chick ? 2.2 : 2.1, m);
    K.blush(c, hx, hy + 2.6, hr * 0.84, 1.9, chick ? undefined : 'rgba(205,45,105,0.4)');
    if (chick) {
      if (m.open > 0.12) E(c, hx, hy + 5.5 + m.open * 2, 2.6, 2 + m.open * 2.6, '#6a1d2a');
      Pg(c, [[hx - 3.4, hy + 1.6], [hx + 3.4, hy + 1.6], [hx, hy + 6.4]], '#f3a7ae'); Pg(c, [[hx - 1.3, hy + 4.4], [hx + 1.3, hy + 4.4], [hx, hy + 6.4]], '#4a3a44', true);
    } else {
      var bo = m.open > 0.12 ? m.open : 0; /* the bent beak; singing drops a pink lower bill under it */
      if (bo) { Pg(c, [[hx - 4.6, hy + 4], [hx + 4.6, hy + 4], [hx + 0.6, hy + 13 + bo * 9]], '#6a1d2a'); Pg(c, [[hx - 2.2, hy + 10 + bo * 4], [hx + 2.6, hy + 10 + bo * 4], [hx + 0.6, hy + 13 + bo * 9]], '#e8707e', true); }
      c.save(); c.translate(0, -bo * 2.6);
      c.beginPath(); c.moveTo(hx - 4.6, hy + 2.6); c.quadraticCurveTo(hx, hy + 0.2, hx + 4.6, hy + 2.6); c.quadraticCurveTo(hx + 5.2, hy + 9, hx + 1, hy + 13); c.quadraticCurveTo(hx - 1.7, hy + 13.4, hx - 2.1, hy + 10.6); c.quadraticCurveTo(hx - 5, hy + 7.4, hx - 4.6, hy + 2.6); c.closePath(); F(c, '#fff0dc');
      c.save(); c.clip(); c.fillStyle = INK; c.fillRect(hx - 8, hy + 8.4, 16, 8); c.restore();
      c.restore();
    }
    if (v === 0) K.flower(c, hx + 9, hy - 8.5, 4, p.gold, p.snow, m.t * 0.5);
    if (v === 3) { c.save(); c.translate(hx, hy - 9.2); c.rotate(-0.1 + m.sw * 0.05); E(c, 0, 0, 15.5, 3.6, '#f2d28a'); R(c, -7, -8.4, 14, 9, 4, '#f2d28a'); Rn(c, -6.6, -3.4, 13.2, 2.6, 0.5, p.accent2); L(c, -11, 0.3, 11, 0.3, 0.6, shade('#f2d28a', -0.22)); c.restore(); }
  }, { wide: 0.72, variants: ['pink flamingo on one leg', 'coral flamingo in sunglasses', 'fluffy grey flamingo chick', 'magenta flamingo in a straw hat and pearls'] });

  /* =========================== peacock =========================== */
  var PK = [
    { body: '#2458c9', dk: '#1a3f9a', neck: '#2458c9', belly: '#3d74e0', fan: '#2a9a68', fan2: '#56bf8a', e1: '#dbe24f', e2: '#1c8fb5', e3: '#2a2466', patch: '#ffffff' },   /* blue, full fan */
    { body: '#fbfaf5', dk: '#e4dfd3', neck: '#fbfaf5', belly: '#ffffff', fan: '#f1ece0', fan2: '#fffdf8', e1: '#e6dcc6', e2: '', e3: '#ffffff', patch: '#d6e6f4' },      /* white, gold eyes */
    { body: '#9a7b5c', dk: '#7a5f45', neck: '#35a878', belly: '#f3e6cf', fan: '#8a6c50', fan2: '#a88a68', e1: '', e2: '#35a878', e3: '', patch: '#ffffff' },             /* peahen, short tail */
    { body: '#1fa08c', dk: '#157a6c', neck: '#1fa08c', belly: '#3cc0aa', fan: '#c08a2a', fan2: '#e0b24a', e1: '#f8e88a', e2: '#1fa08c', e3: '#3a2466', patch: '#ffffff' }    /* green, bronze train, bow tie */
  ];
  function pfeather(c, len, w, col, g, e2) {
    E(c, 0, -len * 0.5, w, len * 0.5, col);
    L(c, 0, -2, 0, -len * 0.66, 0.6, shade(col, -0.22));
    if (g.e1) { var y = -len * 0.8; dot(c, 0, y, w * 0.84, g.e1); dot(c, 0, y + w * 0.08, w * 0.6, e2); dot(c, 0, y + w * 0.2, w * 0.32, g.e3); dot(c, -w * 0.2, y - w * 0.3, w * 0.13, 'rgba(255,255,255,0.8)'); }
  }
  Art.add('character', 'peacock', function (c, m, p) {
    var v = m.v, g = PK[v], hen = v === 2, hx = m.sw * 2.4, hy = (hen ? -62 : -67) + m.k * 2.5, aa = K.armAngles(m, 0.8, 0.8), i, a, n, e2 = g.e2 || p.gold, sway = m.sw * 0.05 + Math.sin(m.t * 1.6) * 0.02;
    c.save(); if (v === 3) c.translate(17, 0);
    if (v === 0 || v === 1) { /* the fan opens a little wider on the beat */
      var spread = 2.72 + m.k * 0.3; n = 9;
      for (i = 0; i < n; i++) { a = (i / (n - 1) - 0.5) * spread + sway; c.save(); c.translate(0, -30); c.rotate(a); pfeather(c, 55, 7.6, g.fan, g, e2); c.restore(); }
      for (i = 0; i < n - 1; i++) { a = ((i + 0.5) / (n - 1) - 0.5) * spread + sway * 1.6; c.save(); c.translate(0, -30); c.rotate(a); pfeather(c, 41, 6.6, g.fan2, g, e2); c.restore(); }
    } else if (hen) {
      for (i = 0; i < 5; i++) { a = (i / 4 - 0.5) * (1.7 + m.k * 0.3) + sway; c.save(); c.translate(0, -26); c.rotate(a); pfeather(c, 30, 6.4, i % 2 ? g.fan2 : g.fan, g, e2); c.restore(); }
    } else { /* a closed train sweeping out behind */
      for (i = 5; i >= 0; i--) { a = -1.05 - i * 0.17 + m.sw * 0.07 * (1 + i * 0.3) + Math.sin(m.t * 1.6 + i) * 0.02; c.save(); c.translate(-7, -25); c.rotate(a); pfeather(c, 44 + i * 2.6, 6.6, i % 2 ? g.fan2 : g.fan, g, e2); c.restore(); }
    }
    for (i = -1; i <= 1; i += 2) { L(c, i * 5, -12, i * 6, -2, 2, '#c9962e'); L(c, i * 6, -2, i * 6 - 4, -0.6, 1.7, '#c9962e'); L(c, i * 6, -2, i * 6 + 4, -0.6, 1.7, '#c9962e'); }
    L(c, 0, -40, hx, hy + 6, 9.8, shade(g.neck, -0.34)); L(c, 0, -40, hx, hy + 6, 8, g.neck); /* neck */
    c.save(); c.translate(-13, -37); c.rotate(aa[0]); E(c, 0, 9, 6.2, 13, g.dk); L(c, -2, 13, -2, 20, 0.8, shade(g.dk, -0.2)); L(c, 2, 13, 2, 20, 0.8, shade(g.dk, -0.2)); c.restore();
    E(c, 0, -27, 15, 17.5, g.body);
    c.fillStyle = g.belly; c.beginPath(); c.ellipse(1.5, -23, 9.4, 11.5, 0, 0, TAU); c.fill();
    c.strokeStyle = shade(g.belly, -0.18); c.lineWidth = 0.9;
    for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-0.5 + i * 5.5, -22 - Math.abs(i) * 3); c.lineTo(1.5 + i * 5.5, -19.5 - Math.abs(i) * 3); c.lineTo(3.5 + i * 5.5, -22 - Math.abs(i) * 3); c.stroke(); }
    var wa = m.wave ? 2.4 + Math.sin(m.t * 9) * 0.3 : Math.max(0.6, aa[1]);
    c.save(); c.translate(13, -37); c.rotate(-wa); E(c, 0, 9, 6.2, 13, g.dk); L(c, -2, 13, -2, 20, 0.8, shade(g.dk, -0.2)); L(c, 2, 13, 2, 20, 0.8, shade(g.dk, -0.2)); c.restore();
    if (v === 3) K.bow(c, 0, -44, 13, p.accent);
    if (v === 1) for (i = -2; i <= 2; i++) E(c, i * 3, -44.5 + (4 - i * i) * 0.4, 1.5, 1.5, p.gold);
    n = hen ? 1 : 2; /* crest */
    for (i = -n; i <= n; i++) { a = i * 0.3 + m.sw * 0.14; var cx = hx + Math.sin(a) * 13, cy = hy - 8 - Math.cos(a) * (11 + m.k * 2); L(c, hx + i * 1.2, hy - 8, cx, cy, 0.9, shade(g.neck, -0.4)); E(c, cx, cy, 2, 2, e2); }
    E(c, hx, hy, 10.5, 10, g.neck);
    c.fillStyle = g.patch; c.beginPath(); c.ellipse(hx - 4.6, hy - 1.6, 3.9, 4.5, 0, 0, TAU); c.ellipse(hx + 4.6, hy - 1.6, 3.9, 4.5, 0, 0, TAU); c.fill();
    K.eyes(c, hx, hy - 1.6, 4.6, 1.9, m); if (hen) lashes(c, hx, hy - 1.6, 4.6, 1.9);
    K.blush(c, hx, hy + 3.2, 8.4, 1.8, v === 1 ? undefined : 'rgba(255,150,170,0.5)');
    var bk = '#f6dca0';
    if (m.open > 0.12) { Pg(c, [[hx - 3.2, hy + 2.4], [hx + 3.2, hy + 2.4], [hx, hy + 5 + m.open * 4.5]], '#6a1d2a'); Pg(c, [[hx - 3.8, hy + 1.2], [hx + 3.8, hy + 1.2], [hx, hy + 4.6]], bk); Pg(c, [[hx - 2.8, hy + 5.4 + m.open * 3.6], [hx + 2.8, hy + 5.4 + m.open * 3.6], [hx, hy + 8.4 + m.open * 4.4]], shade(bk, -0.12)); }
    else Pg(c, [[hx - 3.8, hy + 1.6], [hx + 3.8, hy + 1.6], [hx, hy + 7.6]], bk);
    if (hen) K.flower(c, hx + 8.5, hy - 6.5, 3.8, p.accent, p.gold, m.t * 0.5);
    c.restore();
  }, { wide: 1.25, variants: ['blue peacock with a full fan', 'white peacock with gold eyes', 'peahen with a flower', 'green peacock with a bronze train and bow tie'] });
});
