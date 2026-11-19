/* Send a Carol art pack: party props (cakes, gifts, poppers, treats, foil balloons). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var SPR = ['#ff5a5f', '#ffd166', '#5ad1a0', '#58b4ff', '#ff8ad0'];
  function shadow(c, y, rx) { E(c, 0, y, rx, rx * 0.11, 'rgba(0,0,0,0.14)'); }
  function spark(c, x, y, r, t, ph) { K.twinkle(c, x, y, r * (0.7 + 0.3 * Math.sin(t * 3 + ph)), '#ffffff'); }
  function line(c, w, col) { c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.stroke(); }
  function sprinkles(c, seed, n, x, y, w, h) { var R0 = rnd(seed), i; for (i = 0; i < n; i++) { var sx = x + R0() * w, sy = y + R0() * h, a = R0() * 3; L(c, sx, sy, sx + Math.cos(a) * 2.2, sy + Math.sin(a) * 1.1, 1.1, SPR[i % 5]); } }

  /* ---------- a three-tier cake on a stand ---------- */
  Art.add('prop', 'tiercake', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), i, c1 = shade(p.accent, 0.55), c2 = shade(p.accent2, 0.55), c3 = shade(p.gold, 0.5);
    shadow(c, 46, 38);
    Pg(c, [[-6, 39], [6, 39], [12, 46], [-12, 46]], '#e2d8c6'); R(c, -41, 35.5, 82, 5, 2.5, '#f6f0e4'); Rn(c, -36, 36.5, 40, 1.4, 0.7, 'rgba(255,255,255,0.8)');
    /* bottom tier: swags and pearls */
    R(c, -35, 12, 70, 24, 3.5, c1); Rn(c, 22, 13, 12, 22, 3, 'rgba(0,0,0,0.07)');
    c.beginPath(); c.moveTo(-35, 21); for (i = 0; i < 5; i++) c.quadraticCurveTo(-35 + (i + 0.5) * 14, 31, -35 + (i + 1) * 14, 21); line(c, 2.2, p.paper);
    for (i = 1; i < 5; i++) { dot(c, -35 + i * 14, 21.5, 2.3, p.gold); dot(c, -35.6 + i * 14, 20.9, 0.8, '#ffffff'); }
    for (i = 0; i < 9; i++) dot(c, -32 + i * 8, 33.6, 1.8, p.paper);
    K.icing(c, -37, 37, 10.5, 9, 6, p.paper);
    /* middle tier: a row of flowers */
    R(c, -26, -10, 52, 22.5, 3.5, c2); Rn(c, 15, -9, 10, 20, 3, 'rgba(0,0,0,0.07)');
    for (i = -1; i <= 1; i++) { E(c, i * 16 - 5.5, 5, 3.2, 1.6, '#57b36f', 0.5); E(c, i * 16 + 5.5, 5, 3.2, 1.6, '#57b36f', -0.5); K.flower(c, i * 16, 3.5, 4.6, i ? p.accent : p.gold, i ? p.gold : p.accent, i + t * 0.25); }
    K.icing(c, -28, 28, -11.5, 7, 6, p.paper);
    /* top tier: stripes and sprinkles */
    R(c, -17, -30, 34, 20.5, 3.5, c3); for (i = -2; i <= 2; i++) L(c, i * 6.4, -20, i * 6.4, -12.5, 1.7, shade(c3, 0.55));
    Rn(c, 9, -29, 7, 18, 3, 'rgba(0,0,0,0.06)');
    K.icing(c, -19, 19, -31.5, 5, 5.5, p.paper); sprinkles(c, 'tier', 9, -15, -34.5, 30, 2.4);
    /* candles and the star on top */
    for (i = -1; i <= 1; i += 2) { R(c, i * 10 - 1.5, -41, 3, 9.5, 1, p.paper); L(c, i * 10 - 1.2, -37.5, i * 10 + 1.2, -38.8, 1, p.accent); L(c, i * 10 - 1.2, -34.2, i * 10 + 1.2, -35.5, 1, p.accent); dot(c, i * 10, -44.5, 4.5 + k * 1.8, 'rgba(255,200,90,0.24)'); K.flame(c, i * 10, -41.4, 3.8, 7.2, t, i * 1.7); }
    L(c, 0, -32, 0, -40, 1.4, '#b98d4a'); K.starPath(c, 0, -43.5, 6.6 + k * 1.5, 3, 5, Math.sin(t * 2) * 0.12); F(c, p.gold); dot(c, -1.6, -45.2, 1.1, 'rgba(255,255,255,0.8)');
    spark(c, -30, -22, 4, t, 0); spark(c, 31, -14, 3.2, t, 2); spark(c, 24, -40, 2.6, t, 4);
  });

  /* ---------- a stack of three presents ---------- */
  function gbox(c, x, y, w, h, col, rib, pat, rot) {
    var i, j, bh = h * 0.8;
    c.save(); c.translate(x, y); c.rotate(rot);
    R(c, -w / 2, -bh, w, bh, w * 0.05, col);
    if (pat === 0) { for (i = 0; i < 4; i++) for (j = 0; j < 2; j++) dot(c, -w * 0.375 + i * w * 0.25, -bh * 0.3 - j * bh * 0.36, w * 0.035, shade(col, 0.5)); }
    else if (pat === 1) { for (i = 0; i < 6; i++) Rn(c, -w * 0.46 + i * w * 0.17, -bh + 0.6, w * 0.07, bh - 1.2, 0, shade(col, 0.32)); }
    else { for (i = 0; i < 2; i++) { K.starPath(c, (i ? 1 : -1) * w * 0.28, -bh * 0.42, w * 0.1, w * 0.045, 5, 0.2); c.fillStyle = shade(col, 0.55); c.fill(); } }
    Rn(c, w * 0.3, -bh + 0.6, w * 0.19, bh - 1.2, w * 0.04, 'rgba(0,0,0,0.08)');
    Rn(c, -w * 0.09, -bh + 0.5, w * 0.18, bh - 1, 0, rib); Rn(c, -w * 0.09, -bh + 0.5, w * 0.05, bh - 1, 0, shade(rib, 0.3));
    R(c, -w * 0.55, -h, w * 1.1, h * 0.24, w * 0.04, shade(col, 0.16)); Rn(c, -w * 0.1, -h + 0.6, w * 0.2, h * 0.24 - 1.2, 0, rib);
    Rn(c, -w * 0.5, -h + 1, w * 0.3, 1.2, 0.6, 'rgba(255,255,255,0.6)');
    c.restore();
  }
  Art.add('prop', 'giftstack', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), i, w = Math.sin(t * 2.2) * 0.02;
    shadow(c, 45, 38);
    gbox(c, 0, 45, 62, 34, p.accent, p.gold, 0, 0);
    gbox(c, -4, 11.5, 46, 28, p.accent2, p.paper, 1, -0.05 + w);
    gbox(c, 3, -15.5, 31, 23, p.gold, p.accent, 2, 0.07 - w);
    /* curled ribbon ends and the big bow */
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(4, -38); c.bezierCurveTo(4 + i * 10, -36, 4 + i * 17, -30, 4 + i * 14, -25 + k); c.bezierCurveTo(4 + i * 12, -21, 4 + i * 18, -20, 4 + i * 19, -23); line(c, 2.6, shade(p.accent, -0.3)); line(c, 1.5, p.accent); }
    K.bow(c, 4.5, -38.5, 20 + k * 2.5, p.accent);
    /* a gift tag on a string */
    c.save(); c.translate(-27, 12); c.rotate(0.25 + Math.sin(t * 2.4) * 0.1); L(c, 0, 0, 0, 6, 0.8, '#8a7a66'); Pg(c, [[-4, 8], [0, 5], [4, 8], [4, 18], [-4, 18]], p.paper); dot(c, 0, 8.6, 1, shade(p.paper, -0.4)); K.heartPath(c, 0, 13.4, 4.2); c.fillStyle = p.accent; c.fill(); c.restore();
    spark(c, -30, -20, 4.2, t, 1); spark(c, 33, -6, 3.4, t, 3); spark(c, 24, -40, 2.6, t, 5);
  });

  /* ---------- a party popper firing streamers ---------- */
  function streamer(c, x, y, a, len, t, ph) {
    var s, dx = Math.cos(a), dy = Math.sin(a);
    c.beginPath(); c.moveTo(x, y);
    for (s = 1; s <= 14; s++) { var f = s / 14, wv = Math.sin(f * 11 + t * 3 + ph) * 4.2 * f; c.lineTo(x + dx * len * f - dy * wv, y + dy * len * f + dx * wv + f * f * 7); }
  }
  Art.add('prop', 'popper', function (c, t, p, o) {
    var ext = 0.72 + 0.28 * (1 - Math.exp(-7 * o.beat)), k = Math.exp(-5 * o.beat), i, R0 = rnd('pop'), cols = [p.accent, p.gold, p.accent2, '#58b4ff', '#ff8ad0'], mx = -3, my = 5.5, base = -0.98;
    /* confetti behind */
    for (i = 0; i < 22; i++) {
      var a = base + (R0() - 0.5) * 1.7, d = (14 + R0() * 40) * ext, x = mx + Math.cos(a) * d, y = my + Math.sin(a) * d + (1 - ext) * 6, col = cols[i % 5], r = R0() * 6 + t * (1 + R0());
      if (x > 47 || y < -48) continue;
      if (i % 3 === 0) dot(c, x, y, 1.7, col); else if (i % 3 === 1) { c.save(); c.translate(x, y); c.rotate(r); Rn(c, -2.2, -1.1, 4.4, 2.2, 0.5, col); c.restore(); } else { K.starPath(c, x, y, 2.8, 1.2, 5, r); c.fillStyle = col; c.fill(); }
    }
    /* streamers */
    for (i = 0; i < 5; i++) { var sa = base + (i - 2) * 0.36, sl = (40 + (i % 2) * 8) * ext; streamer(c, mx, my, sa, sl, t, i * 1.9); line(c, 4.4, shade(cols[i], -0.34)); streamer(c, mx, my, sa, sl, t, i * 1.9); line(c, 2.9, cols[i]); }
    /* the cone */
    c.save(); c.translate(-24, 36); c.rotate(0.6); c.scale(1.12, 1.12); c.translate(0, k * 1.5);
    L(c, 0, 9, 3, 17, 0.9, '#8a7a66'); dot(c, 3, 17.5, 1.8, p.gold);
    c.beginPath(); c.moveTo(0, 10); c.lineTo(-14, -33); c.lineTo(14, -33); c.closePath(); F(c, p.accent);
    c.save(); c.clip(); for (i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-20, -30 + i * 10); c.lineTo(20, -36 + i * 10); c.lineTo(20, -32 + i * 10); c.lineTo(-20, -26 + i * 10); c.closePath(); c.fillStyle = i % 2 ? p.paper : p.gold; c.fill(); } Rn(c, 3, -40, 14, 52, 0, 'rgba(0,0,0,0.09)'); c.restore();
    c.beginPath(); c.moveTo(0, 10); c.lineTo(-14, -33); c.lineTo(14, -33); c.closePath(); line(c, K.ow(), shade(p.accent, -0.34));
    E(c, 0, -33, 14, 4.2, shade(p.gold, 0.1)); E(c, 0, -32.6, 10.5, 2.6, shade(p.accent, -0.45));
    c.restore();
    spark(c, 6, -10, 4 + k * 3, t, 0); spark(c, 34, -32, 3, t, 2);
  });

  /* ---------- a crown on a velvet cushion ---------- */
  Art.add('prop', 'crown', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), g = p.gold, i, tips = [[-34, -12], [-17, -22], [0, -32], [17, -22], [34, -12]], cu = shade(p.accent, -0.08);
    shadow(c, 46, 40);
    /* cushion */
    for (i = -1; i <= 1; i += 2) { L(c, i * 36, 37, i * 41, 43, 1.6, shade(g, -0.2)); dot(c, i * 41.5, 44, 2.4, g); }
    c.beginPath(); c.moveTo(-38, 30); c.quadraticCurveTo(0, 25, 38, 30); c.quadraticCurveTo(42, 38, 38, 45); c.quadraticCurveTo(0, 48, -38, 45); c.quadraticCurveTo(-42, 38, -38, 30); c.closePath(); F(c, cu);
    c.beginPath(); c.moveTo(-32, 33); c.quadraticCurveTo(-8, 30, 10, 31.5); line(c, 1.6, 'rgba(255,255,255,0.35)');
    c.save(); c.rotate(Math.sin(t * 1.6) * 0.025); c.translate(0, -k * 1.2);
    /* the inside, the points, the band */
    E(c, 0, 4, 27, 6, shade(p.accent, -0.3));
    Pg(c, [[-28, 30], [-34, -12], [-25.5, 5], [-17, -22], [-8.5, 5], [0, -32], [8.5, 5], [17, -22], [25.5, 5], [34, -12], [28, 30]], g);
    Pg(c, [[10, 30], [8.5, 5], [17, -22], [25.5, 5], [34, -12], [28, 30]], 'rgba(0,0,0,0.07)', true);
    c.beginPath(); c.moveTo(-30, -2); c.lineTo(-25, 12); line(c, 1.8, 'rgba(255,255,255,0.6)'); c.beginPath(); c.moveTo(-3, -18); c.lineTo(-6, 2); line(c, 1.8, 'rgba(255,255,255,0.6)');
    for (i = 0; i < 4; i++) { var vx = -25.5 + i * 17; dot(c, vx, 10.5, 1.7, i % 2 ? p.accent2 : p.accent); }
    R(c, -30.5, 16.5, 61, 14.5, 3.5, shade(g, 0.2)); Rn(c, -28, 18, 56, 1.5, 0.7, 'rgba(255,255,255,0.7)'); Rn(c, -28, 28, 56, 1.4, 0.7, shade(g, -0.18));
    for (i = -1; i <= 1; i += 2) { Pg(c, [[i * 17, 19.6], [i * 21, 23.8], [i * 17, 28], [i * 13, 23.8]], p.accent2); dot(c, i * 17 - 1, 22.6, 0.9, 'rgba(255,255,255,0.8)'); dot(c, i * 8.6, 23.8, 1.4, p.paper); dot(c, i * 25.4, 23.8, 1.4, p.paper); }
    E(c, 0, 23.8, 5.4, 4.4, p.accent); dot(c, -1.6, 22.2, 1.3, 'rgba(255,255,255,0.8)');
    for (i = 0; i < 5; i++) { E(c, tips[i][0], tips[i][1] - 2, i === 2 ? 4.6 : 3.8, i === 2 ? 4.6 : 3.8, i === 2 ? p.accent : p.paper); dot(c, tips[i][0] - 1.2, tips[i][1] - 3.2, 1.1, 'rgba(255,255,255,0.85)'); }
    c.restore();
    spark(c, -40, -18, 4.5 + k * 2, t, 0); spark(c, 40, -28, 3.6, t, 2); spark(c, 27, -42, 2.6, t, 4); spark(c, -22, -38, 2.8, t, 5);
  });

  /* ---------- a burro pinata in bright fringe, swinging on its rope ---------- */
  function rr(c, x, y, w, h, r) { c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
  function burro(c) {
    c.beginPath();
    rr(c, -27, -6, 46, 25, 7); /* body */
    c.moveTo(8, -4); c.lineTo(16, -30); c.lineTo(30, -28); c.lineTo(20, 2); c.closePath(); /* neck */
    rr(c, 13, -37, 30, 15, 6); /* head */
    c.moveTo(15, -34); c.lineTo(12, -50); c.lineTo(21, -37); c.closePath(); c.moveTo(21, -35); c.lineTo(23, -51); c.lineTo(29, -36); c.closePath(); /* ears */
    rr(c, -26, 12, 8, 29, 2.5); rr(c, -15, 12, 8, 26, 2.5); rr(c, 2, 12, 8, 26, 2.5); rr(c, 11, 12, 8, 29, 2.5); /* legs */
  }
  Art.add('prop', 'pinata', function (c, t, p, o) {
    var i, j, cols = [p.accent, p.gold, p.accent2, '#58b4ff', '#ff8ad0', p.paper], sw = Math.sin(t * 1.7) * 0.085, k = Math.exp(-5 * o.beat), R0 = rnd('pin');
    c.save(); c.translate(0, -52); c.rotate(sw); c.translate(-3, 56);
    /* rope */
    L(c, 3, -56, -14, -6, 1.3, '#8a7a66'); L(c, 3, -56, 12, -24, 1.3, '#8a7a66');
    /* tail streamers */
    for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-26, 0); c.quadraticCurveTo(-36 - i * 2, 4 + i * 3, -33 - i * 3 - sw * 30, 16 + i * 4); line(c, 2, cols[i]); }
    burro(c); line(c, K.ow() * 2.4, shade(p.accent, -0.45)); c.fillStyle = p.accent; c.fill();
    c.save(); burro(c); c.clip();
    for (j = 18; j >= 0; j--) {
      var y = -52 + j * 5.2, col = cols[j % 6];
      c.beginPath(); c.moveTo(-34, y); c.lineTo(46, y); c.lineTo(46, y + 5.2);
      for (i = 0; i < 20; i++) { c.lineTo(46 - (i + 0.5) * 4, y + 8.4); c.lineTo(46 - (i + 1) * 4, y + 5.2); }
      c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 0.5; c.strokeStyle = shade(col, -0.22); c.stroke();
    }
    Rn(c, -27, 10, 60, 10, 0, 'rgba(0,0,0,0.06)');
    c.restore();
    /* face: eye, lashes, nose, a smile */
    E(c, 39.5, -29, 4.2, 6.6, shade(p.paper, -0.04)); dot(c, 40.3, -31, 0.9, '#3a2a22'); dot(c, 40.3, -27.4, 0.9, '#3a2a22');
    dot(c, 27.5, -31, 2.5, '#2b2118'); dot(c, 28.3, -31.9, 0.9, '#ffffff'); L(c, 25.4, -33.6, 24, -35.2, 0.8, '#2b2118'); L(c, 27.2, -34.2, 26.8, -36, 0.8, '#2b2118');
    c.beginPath(); c.arc(33, -27.5, 3.4, 0.25 * PI, 0.8 * PI); line(c, 0.9, '#2b2118');
    c.fillStyle = 'rgba(240,96,110,0.5)'; c.beginPath(); c.ellipse(23.5, -26.5, 2.4, 1.6, 0, 0, TAU); c.fill();
    /* a little saddle blanket */
    R(c, -13, -8, 20, 12, 2.5, p.paper); Rn(c, -13, -3.4, 20, 2.6, 0, p.accent2); for (i = 0; i < 4; i++) dot(c, -10 + i * 4.7, 2.3, 1.1, p.gold);
    c.restore();
    /* sweets and confetti shaken loose */
    for (i = 0; i < 7; i++) { var f = frac(t * 0.35 + R0()), cx = -34 + R0() * 68, cy = 30 + f * 18; c.globalAlpha = clamp(2.2 - f * 2.4, 0, 1); dot(c, cx, cy, 1.5 + (i % 2) * 0.5, cols[i % 5]); } c.globalAlpha = 1;
    spark(c, -38, -30, 3.6 + k * 2, t, 0); spark(c, 42, -4, 3, t, 2.5);
  });

  /* ---------- a row of lit birthday candles ---------- */
  Art.add('prop', 'candles', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), i, j, hs = [36, 46, 53, 44, 34], cols = [p.accent, p.gold, p.accent2, '#ff8ad0', '#58b4ff'], fr = shade(p.accent, 0.6);
    shadow(c, 46, 42);
    R(c, -44, 27, 88, 18, 4.5, fr); Rn(c, 26, 28, 16, 16, 4, 'rgba(0,0,0,0.06)'); for (i = 0; i < 9; i++) dot(c, -36 + i * 9, 40.5, 1.8, SPR[i % 5]);
    for (i = 0; i < 5; i++) {
      var x = -30 + i * 15, h = hs[i], top = 28 - h, col = cols[i], lt = shade(col, 0.62);
      dot(c, x, top - 7.5, 7.5 + k * 2.5, 'rgba(255,236,160,0.16)'); dot(c, x, top - 7.5, 5 + k * 1.5, 'rgba(255,236,160,0.2)');
      R(c, x - 3.4, top, 6.8, h, 1.6, lt);
      for (j = 0; j < Math.floor(h / 7.5); j++) { c.beginPath(); c.moveTo(x - 3.1, top + 7 + j * 7.5); c.lineTo(x + 3.1, top + 3.5 + j * 7.5); line(c, 2.3, col); }
      Rn(c, x - 2.5, top + 1.2, 1.3, h - 4, 0.6, 'rgba(255,255,255,0.55)');
      c.beginPath(); c.moveTo(x - 3.4, top + 1.6); c.quadraticCurveTo(x - 3.6, top + 5 + (i % 2) * 3, x - 1.6, top + 4 + (i % 2) * 3); c.quadraticCurveTo(x - 0.6, top + 1.5, x + 3.4, top + 1.6); c.lineTo(x + 3.4, top); c.lineTo(x - 3.4, top); c.closePath(); c.fillStyle = shade(lt, 0.4); c.fill();
      L(c, x, top, x, top - 2.6, 0.9, '#4a3a30');
      K.flame(c, x, top - 2, 6, 11.5 + k * 1.5, t, i * 1.9);
    }
    K.icing(c, -46, 46, 25.5, 10, 6.5, p.paper); sprinkles(c, 'cnd', 12, -40, 22.4, 80, 2.2);
    spark(c, -42, -18, 3.4, t, 0); spark(c, 43, -8, 3, t, 2); spark(c, 16, -42, 2.6, t, 4);
  });

  /* ---------- a pizza with one slice being pulled away ---------- */
  var PEP = [[0.55, 0.3], [0.62, 1.5], [0.5, 2.7], [0.66, 3.8], [0.45, 4.9], [0.7, 5.65], [0.14, 2.0], [0.78, 0.95], [0.8, 3.1], [0.76, 4.45]];
  function pie(c, r) {
    var i, a, d;
    E(c, 0, 0, r, r, '#e0a65a'); c.beginPath(); c.arc(0, 0, r - 2.6, PI * 0.95, PI * 1.5); line(c, 1.6, 'rgba(255,255,255,0.4)');
    c.beginPath(); c.arc(0, 0, r - 2.6, 0.1, PI * 0.5); line(c, 1.6, 'rgba(120,60,20,0.22)');
    dot(c, 0, 0, r * 0.855, '#cf4a2c'); dot(c, 0, 0, r * 0.815, '#ffd066');
    for (i = 0; i < 7; i++) { a = i * 0.9 + 0.4; d = r * (0.25 + (i % 3) * 0.18); c.fillStyle = '#ffe49a'; c.beginPath(); c.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * 0.14, r * 0.09, a, 0, TAU); c.fill(); }
    for (i = 0; i < PEP.length; i++) { a = PEP[i][1]; d = PEP[i][0] * r * 0.9; var x = Math.cos(a) * d, y = Math.sin(a) * d; E(c, x, y, r * 0.115, r * 0.115, '#c8362c'); dot(c, x - 1.2, y - 0.8, 0.8, '#8f2018'); dot(c, x + 1.3, y + 0.4, 0.7, '#8f2018'); dot(c, x + 0.1, y + 1.6, 0.6, '#e8685a'); }
    for (i = 0; i < 6; i++) { a = i * 1.05 + 1.0; d = r * (0.32 + (i % 2) * 0.3); c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 1.7, 0, TAU); line(c, 1.3, '#3a3340'); }
    for (i = 0; i < 5; i++) { a = i * 1.26 + 0.1; d = r * (0.36 + (i % 2) * 0.22); E(c, Math.cos(a) * d, Math.sin(a) * d, 3.6, 1.9, '#4fa85e', a + 0.8); }
    for (i = 0; i < 4; i++) { a = i * PI / 4; L(c, -Math.cos(a) * r * 0.97, -Math.sin(a) * r * 0.97, Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97, 0.8, 'rgba(120,60,20,0.3)'); }
  }
  Art.add('prop', 'pizza', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), r = 37, a0 = -PI / 2, a1 = -PI / 4, am = (a0 + a1) / 2, pull = 9 + k * 2.5 + Math.sin(t * 1.5) * 1, ox = Math.cos(am) * pull, oy = Math.sin(am) * pull, i, bd = mix('#c4935c', p.bg2, 0.12);
    c.save(); c.translate(-4, 6);
    E(c, 2, 3, 43, 42, 'rgba(0,0,0,0.12)');
    E(c, 0, 0, 42.5, 42.5, bd); c.beginPath(); c.arc(0, 0, 39.5, 0, TAU); line(c, 0.9, shade(bd, -0.16));    c.save(); c.beginPath(); c.rect(-60, -60, 120, 120); c.moveTo(0, 0); c.arc(0, 0, 60, a0, a1); c.closePath(); c.clip('evenodd'); pie(c, r); c.restore();
    /* the gap, crumbs, cheese strings */
    dot(c, Math.cos(am) * 20, Math.sin(am) * 20, 1, '#e0a65a'); dot(c, Math.cos(am + 0.2) * 29, Math.sin(am + 0.2) * 29, 0.8, '#ffd066');
    for (i = -1; i <= 1; i++) { var sa = am + i * 0.26, sr = r * 0.62; c.beginPath(); c.moveTo(Math.cos(sa) * sr, Math.sin(sa) * sr); c.quadraticCurveTo(Math.cos(sa) * sr + ox * 0.5 + i * 1.2, Math.sin(sa) * sr + oy * 0.5 + 2.4, Math.cos(sa) * sr + ox, Math.sin(sa) * sr + oy); line(c, 1.5, '#ffd066'); }
    c.save(); c.translate(ox, oy); c.rotate(0.05); c.save(); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 60, a0, a1); c.closePath(); c.clip(); pie(c, r); c.restore();
    c.beginPath(); c.moveTo(Math.cos(a0) * r, Math.sin(a0) * r); c.lineTo(0, 0); c.lineTo(Math.cos(a1) * r, Math.sin(a1) * r); line(c, K.ow(), shade('#e0a65a', -0.34)); c.restore();
    K.steam(c, -12, -30, 13, t, 2);
    c.restore();
    spark(c, 38, -38, 3.4 + k * 1.5, t, 1);
  });

  /* ---------- an ice-cream sundae ---------- */
  function bowlPath(c) { c.beginPath(); c.moveTo(-27, -4); c.bezierCurveTo(-27, 16, -12, 27, 0, 28); c.bezierCurveTo(12, 27, 27, 16, 27, -4); c.closePath(); }
  Art.add('prop', 'icecream', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), i, gl = '#dff0f6', pink = shade(p.accent, 0.5), mint = shade(p.accent2, 0.55), van = '#fff0c4', choc = '#6b3f26';
    shadow(c, 46, 26);
    c.save(); c.translate(0, 2);
    /* wafer behind */
    c.save(); c.translate(15, -22); c.rotate(0.5); R(c, -4.5, -24, 9, 30, 1.5, '#e9bb6c'); for (i = 0; i < 5; i++) L(c, -4, -20 + i * 5, 4, -20 + i * 5, 0.7, '#c08d3e'); L(c, 0, -23, 0, 5, 0.7, '#c08d3e'); c.restore();
    /* glass: foot, stem, bowl with layers */
    E(c, 0, 43, 15, 3.4, gl); R(c, -2.2, 27, 4.4, 16, 1.5, gl); E(c, 0, 28.5, 5, 2.6, gl);
    bowlPath(c); F(c, gl);
    c.save(); bowlPath(c); c.clip(); Rn(c, -30, 4, 60, 30, 0, pink); Rn(c, -30, 13, 60, 20, 0, van); Rn(c, -30, 20, 60, 12, 0, choc);
    c.beginPath(); c.moveTo(-30, 4); for (i = 0; i < 6; i++) c.quadraticCurveTo(-30 + (i + 0.5) * 10, 8, -30 + (i + 1) * 10, 4); c.lineTo(30, -6); c.lineTo(-30, -6); c.closePath(); c.fillStyle = mint; c.fill(); c.restore();
    bowlPath(c); line(c, K.ow(), shade(gl, -0.34));
    c.beginPath(); c.moveTo(-21, 2); c.quadraticCurveTo(-19, 14, -10, 21); line(c, 2.2, 'rgba(255,255,255,0.7)');
    /* scoops */
    K.ball(c, -13.5, -13, 14, 13.5, pink); K.ball(c, 13.5, -13, 14, 13.5, mint); K.ball(c, 0, -26, 14.5, 14, van);
    for (i = 0; i < 4; i++) { dot(c, -20 + i * 4.4, -9 + (i % 2) * 5, 0.9, shade(p.accent, 0.15)); dot(c, 8 + i * 4, -8 + ((i + 1) % 2) * 5, 0.9, choc); }
    /* chocolate sauce with drips */
    c.beginPath(); c.moveTo(-12.5, -31); c.bezierCurveTo(-10, -42, 10, -42, 12.5, -31); c.quadraticCurveTo(12.5, -22, 9.5, -23.5); c.quadraticCurveTo(7.5, -29, 5, -27); c.quadraticCurveTo(3, -17, 0, -19); c.quadraticCurveTo(-2.5, -28, -5.5, -26); c.quadraticCurveTo(-8, -20, -10.5, -22.5); c.quadraticCurveTo(-12.5, -26, -12.5, -31); c.closePath(); F(c, choc);
    c.beginPath(); c.moveTo(-8, -35); c.quadraticCurveTo(-3, -38.5, 3, -37.5); line(c, 1.2, 'rgba(255,255,255,0.4)');
    sprinkles(c, 'sun', 8, -9, -35, 18, 6);
    /* whipped cream and the cherry */
    E(c, -4, -39.5, 5, 3.6, p.paper); E(c, 4, -39.5, 5, 3.6, p.paper); E(c, 0, -42.5, 5, 3.6, p.paper);
    c.beginPath(); c.moveTo(1, -48); c.quadraticCurveTo(3, -53, 8 + Math.sin(t * 2) * 0.6, -53.5); line(c, 0.9, '#5a7a3a');
    E(c, 0.5, -46.5, 4.2 + k * 0.5, 4.2 + k * 0.5, '#d62839'); dot(c, -0.9, -48, 1.1, 'rgba(255,255,255,0.85)');
    c.restore();
    spark(c, -32, -30, 3.6, t, 0); spark(c, 34, 6, 3, t, 2.4);
  });

  /* ---------- two glasses clinking ---------- */
  function flutePath(c) { c.beginPath(); c.moveTo(-9.5, -38); c.bezierCurveTo(-10, -8, -6, 8, 0, 10); c.bezierCurveTo(6, 8, 10, -8, 9.5, -38); c.closePath(); }
  function flute(c, t, p, ph, s) {
    var gl = '#e2f2f7', fizz = mix('#ffd98a', p.gold, 0.45), i;
    E(c, 0, 38, 10.5, 2.8, gl); R(c, -1.3, 9, 2.6, 29, 1.2, gl);
    flutePath(c); F(c, gl);
    c.save(); flutePath(c); c.clip();
    c.beginPath(); c.moveTo(-12, -25 + s * 3); c.lineTo(12, -25 - s * 3); c.lineTo(12, 12); c.lineTo(-12, 12); c.closePath(); c.fillStyle = fizz; c.fill();
    c.beginPath(); c.moveTo(-12, -25 + s * 3); c.lineTo(12, -25 - s * 3); line(c, 2.6, '#fff6d8');
    for (i = 0; i < 7; i++) { var f = frac(t * 0.45 + i * 0.37 + ph); dot(c, -5 + ((i * 37) % 10) + Math.sin(t * 3 + i) * 0.6, 6 - f * 28, 0.8 + (i % 3) * 0.3, 'rgba(255,255,255,' + (0.9 - f * 0.5).toFixed(2) + ')'); }
    c.restore();
    flutePath(c); line(c, K.ow(), shade(gl, -0.36));
    c.beginPath(); c.moveTo(-6, -33); c.quadraticCurveTo(-6.5, -12, -3.5, 1); line(c, 1.6, 'rgba(255,255,255,0.75)');
  }
  Art.add('prop', 'toastglasses', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), a = 0.27 + k * 0.07, i, R0 = rnd('toast');
    shadow(c, 46, 36);
    c.save(); c.translate(-23, 7); c.rotate(a); flute(c, t, p, 0, 1); c.restore();
    c.save(); c.translate(23, 7); c.rotate(-a); flute(c, t, p, 0.5, -1); c.restore();
    /* the clink */
    for (i = 0; i < 9; i++) { var an = -PI + i / 8 * PI, r0 = 6 + k * 2, r1 = 11 + k * 7 + (i % 2) * 3; L(c, Math.cos(an) * r0, -37 + Math.sin(an) * r0, Math.cos(an) * r1, -37 + Math.sin(an) * r1, 1.5, i % 2 ? p.gold : '#ffffff'); }
    K.twinkle(c, 0, -34, 5 + k * 5, '#ffffff');
    for (i = 0; i < 6; i++) { var f = frac(o.beat * 0.9 + R0() * 0.3), dx = (R0() - 0.5) * 34, dy = -36 - R0() * 12 + f * f * 22; dot(c, dx * (0.4 + f), dy, 1.2 + (i % 2) * 0.5, i % 2 ? mix('#ffd98a', p.gold, 0.45) : '#ffffff'); }
    spark(c, -38, -30, 3.6, t, 0); spark(c, 39, -22, 3, t, 2.2);
  });

  /* ---------- a party blower unrolling on the beat ---------- */
  function blowerPath(c, cx, cy, turns, r0) {
    var i, n = 44;
    c.beginPath(); c.moveTo(-30, cy + r0); c.lineTo(cx, cy + r0);
    for (i = 1; i <= n; i++) { var f = i / n, th = PI / 2 - f * turns * TAU, r = r0 * (1 - f * 0.8); c.lineTo(cx + Math.cos(th) * r, cy + Math.sin(th) * r); }
  }
  Art.add('prop', 'partyblower', function (c, t, p, o) {
    var k = Math.exp(-4 * o.beat), cx = 2 + k * 14, cy = -6, turns = 1.75 - k * 0.7, r0 = 21, i, R0 = rnd('blow');
    c.save(); c.rotate(-0.16); c.translate(4, 9); c.scale(0.94, 0.94);
    /* confetti and toot lines round the curl */
    for (i = 0; i < 12; i++) { var a = -2.9 + R0() * 2.6, d = 27 + R0() * 9 + k * 3, x = cx + 4 + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.9; if (i % 3 === 0) { K.starPath(c, x, y, 3, 1.3, 5, t + i); c.fillStyle = SPR[i % 5]; c.fill(); } else if (i % 3 === 1) dot(c, x, y, 1.7, SPR[i % 5]); else { c.save(); c.translate(x, y); c.rotate(i + t); Rn(c, -2.4, -1.1, 4.8, 2.2, 0.5, SPR[i % 5]); c.restore(); } }
    /* the paper tube */
    blowerPath(c, cx, cy, turns, r0); line(c, 10.5 + K.ow() * 2, shade(p.accent, -0.34)); line(c, 10.5, p.accent);
    c.save(); c.setLineDash([3.2, 6.4]); c.lineCap = 'butt'; c.lineWidth = 10.5; c.strokeStyle = p.gold; blowerPath(c, cx, cy, turns, r0); c.stroke(); c.setLineDash([]); c.restore();
    blowerPath(c, cx, cy - 3, turns, r0); c.lineWidth = 1.4; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.stroke();
    /* mouthpiece with a frilled collar */
    Pg(c, [[-46, cy + r0 - 3.2], [-31, cy + r0 - 5.6], [-31, cy + r0 + 5.6], [-46, cy + r0 + 3.2]], p.paper); Rn(c, -45, cy + r0 - 2.2, 12, 1.4, 0.7, 'rgba(0,0,0,0.08)');
    for (i = -2; i <= 2; i++) E(c, -30, cy + r0 + i * 3.4, 2.6, 2.6, i % 2 ? p.accent2 : p.gold);
    for (i = -1; i <= 1; i++) L(c, -48.5, cy + r0 + i * 4.5, -52 - k * 2, cy + r0 + i * 7, 1.3, alpha(p.paper, 0.9));
    c.restore();
    spark(c, 36, -38, 3.6 + k * 2, t, 0); spark(c, -34, -26, 3, t, 2);
  });

  /* ---------- two crossed sparklers ---------- */
  function fizz(c, x, y, t, seed, p, k) {
    var R0 = rnd(Math.floor(t * 14) * 13 + seed), i, n = 16;
    K.glow(c, x, y, 26, '#fff2b0', 0.5);
    for (i = 0; i < n; i++) {
      var a = i / n * TAU + R0() * 0.3, r1 = 9 + R0() * 17 + k * 3, r0 = 3 + R0() * 4, ex = x + Math.cos(a) * r1, ey = y + Math.sin(a) * r1;
      L(c, x + Math.cos(a) * r0, y + Math.sin(a) * r0, ex, ey, 1.2, i % 3 ? '#ffe9a0' : p.gold);
      if (i % 2) K.twinkle(c, ex, ey, 2.2 + R0() * 2.2, '#ffffff'); else dot(c, ex, ey, 1, '#ffffff');
    }
    for (i = 0; i < 5; i++) { var f = frac(t * 1.3 + i * 0.21 + seed), sx = x + (R0() - 0.5) * 22; dot(c, sx, y + 6 + f * 22, 1.1 * (1 - f) + 0.3, 'rgba(255,225,140,' + (1 - f).toFixed(2) + ')'); }
    dot(c, x, y, 5, '#ffe27a'); dot(c, x, y, 3, '#ffffff');
  }
  Art.add('prop', 'sparkler', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), i;
    for (i = -1; i <= 1; i += 2) {
      L(c, i * 15, 45, -i * 20, -22, 2.6, '#6f7480'); L(c, i * 15, 45, -i * 20, -22, 1.5, '#aab0ba');
      L(c, -i * 5.5, 5.5, -i * 20, -22, 4.6, '#4a444e'); L(c, -i * 5.5, 5.5, -i * 20, -22, 3, '#7a7078');
      L(c, -i * 16.5, -15.4, -i * 20, -22, 3.2, '#ff9a3c');
    }
    K.bow(c, 0, 18, 17, p.accent);
    fizz(c, -20, -23, t, 1, p, k); fizz(c, 20, -23, t + 0.03, 7, p, k);
  });

  /* ---------- a blank swallowtail banner on two poles ---------- */
  Art.add('prop', 'banner', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), i, s, col = p.accent, dk = shade(col, -0.2), top = [], bot = [], n = 12;
    function wy(x) { return -30 + (1 - (x / 37) * (x / 37)) * 4.5 + Math.sin(x * 0.09 + t * 2.2) * 1.3; }
    for (s = -1; s <= 1; s += 2) { E(c, s * 37, 45, 10, 2.6, 'rgba(0,0,0,0.14)'); }
    /* the swallowtails, folded back behind the poles */
    for (s = -1; s <= 1; s += 2) { var fl = Math.sin(t * 2.2 + s) * 1.2; Pg(c, [[s * 36, -22], [s * 50, -20 + fl], [s * 44.5, -8.5 + fl], [s * 50, 3 + fl], [s * 36, 1]], dk); }
    /* poles: striped, with a ball and a little flag */
    for (s = -1; s <= 1; s += 2) {
      Pg(c, [[s * 37, -47], [s * 37 + 11, -43.5 + Math.sin(t * 3 + s) * 1.2], [s * 37, -40]], p.accent2);
      R(c, s * 37 - 2.1, -40, 4.2, 85, 1.8, p.paper); for (i = 0; i < 9; i++) { c.beginPath(); c.moveTo(s * 37 - 1.8, -31 + i * 9); c.lineTo(s * 37 + 1.8, -34 + i * 9); line(c, 2.2, p.gold); }
      E(c, s * 37, -41, 3.6, 3.6, p.gold); dot(c, s * 37 - 1, -42.1, 1, 'rgba(255,255,255,0.8)');
      E(c, s * 37, 44.5, 6, 2.4, shade(p.accent2, -0.05));
    }
    /* the cloth */
    for (i = 0; i <= n; i++) { var x = -39 + i * 78 / n; top.push([x, wy(x)]); bot.unshift([x, wy(x) + 27]); }
    Pg(c, top.concat(bot), col);
    c.beginPath(); for (i = 0; i <= n; i++) { if (i) c.lineTo(top[i][0] * 0.93, top[i][1] + 3.6); else c.moveTo(top[i][0] * 0.93, top[i][1] + 3.6); } for (i = 0; i <= n; i++) c.lineTo(bot[i][0] * 0.93, bot[i][1] - 3.6); c.closePath();
    c.fillStyle = shade(col, 0.14); c.fill(); c.save(); c.setLineDash([2.2, 2.6]); c.lineWidth = 0.9; c.strokeStyle = alpha(p.paper, 0.85); c.stroke(); c.setLineDash([]); c.restore();
    for (s = -1; s <= 1; s += 2) { K.starPath(c, s * 27, wy(s * 27) + 13.5, 4.2 + k, 1.9, 5, s * 0.2); c.fillStyle = p.gold; c.fill(); Rn(c, s * 37 - 2.6, wy(s * 37) + 2, 5.2, 2.2, 1, p.gold); Rn(c, s * 37 - 2.6, wy(s * 37) + 22.6, 5.2, 2.2, 1, p.gold); }
    spark(c, -22, -42, 3.4, t, 0); spark(c, 20, 12, 3, t, 2.4);
  });

  /* ---------- foil balloons: a star, a heart and the numbers ---------- */
  function tether(c, x, y, t, ph) { c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 5 + Math.sin(t * 1.3 + ph) * 2, y + (48 - y) * 0.35, x - 5, y + (48 - y) * 0.7, 0, 48); line(c, 0.9, '#8a8f98'); }
  Art.add('prop', 'foilstar', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), col = p.gold, i, bx = Math.sin(t * 1.2) * 1.6, by = -9 + Math.cos(t * 1.5) * 1.5, ro = 35, ri = 17.5;
    tether(c, bx, by + 20, t, 0);
    c.save(); c.translate(bx, by); c.rotate(Math.sin(t * 1.1) * 0.05);
    Pg(c, [[-2.6, 21], [2.6, 21], [0, 16]], shade(col, -0.12));
    K.starPath(c, 0, 0, ro, ri, 5, 0); c.lineJoin = 'round'; line(c, 8 + K.ow() * 2, shade(col, -0.34)); line(c, 8, col); c.fillStyle = col; c.fill();
    for (i = 0; i < 5; i++) {
      var a = -PI / 2 + i * TAU / 5, a1 = a - PI / 5, a2 = a + PI / 5;
      Pg(c, [[0, 0], [Math.cos(a) * ro, Math.sin(a) * ro], [Math.cos(a1) * ri, Math.sin(a1) * ri]], shade(col, 0.28), true);
      Pg(c, [[0, 0], [Math.cos(a) * ro, Math.sin(a) * ro], [Math.cos(a2) * ri, Math.sin(a2) * ri]], shade(col, -0.1), true);
    }
    for (i = 0; i < 5; i++) { var b = -PI / 2 + i * TAU / 5; L(c, 0, 0, Math.cos(b) * ro, Math.sin(b) * ro, 0.6, 'rgba(255,255,255,0.5)'); }
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(-9, -11, 5.5, 2.4, -0.9, 0, TAU); c.fill(); dot(c, -14.5, -3.5, 1.3, 'rgba(255,255,255,0.8)');
    c.restore();
    spark(c, 32, -36, 4 + k * 2.5, t, 0); spark(c, -36, -22, 3, t, 2); spark(c, 30, 12, 2.6, t, 4);
  });
  Art.add('prop', 'foilheart', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), col = p.accent, bx = Math.sin(t * 1.2 + 1) * 1.6, by = -10 + Math.cos(t * 1.5 + 1) * 1.5;
    tether(c, bx, by + 31, t, 1);
    c.save(); c.translate(bx, by); c.rotate(Math.sin(t * 1.1 + 1) * 0.05); c.scale(1 + k * 0.025, 1 + k * 0.025);
    Pg(c, [[-2.6, 34], [2.6, 34], [0, 28.5]], shade(col, -0.12));
    K.heartPath(c, 0, 0, 62); c.lineJoin = 'round'; line(c, 3 + K.ow() * 2, shade(col, -0.34)); line(c, 3, col); c.fillStyle = col; c.fill();
    K.heartPath(c, -2.5, -2.5, 49); c.fillStyle = shade(col, 0.16); c.fill();
    K.heartPath(c, -4, -4.5, 36); c.fillStyle = shade(col, 0.28); c.fill();
    c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(2.5, 6, 0, 27); line(c, 0.7, 'rgba(255,255,255,0.4)');
    c.beginPath(); c.arc(-14.5, -11, 11.5, PI * 1.02, PI * 1.5); line(c, 3.4, 'rgba(255,255,255,0.8)'); dot(c, -27.5, -5, 1.6, 'rgba(255,255,255,0.8)');
    c.beginPath(); c.arc(15, -11, 12, PI * 1.62, PI * 1.9); line(c, 1.8, 'rgba(255,255,255,0.45)');
    c.restore();
    spark(c, 36, -36, 4 + k * 2.5, t, 0); spark(c, -38, -30, 3, t, 2); spark(c, 34, 16, 2.6, t, 4);
  });

  /* where the foil catches the light on each digit (CT Sans Bold), in ems from the digit's centre: x, y, turn */
  var SHINE = { 0: [-0.19, -0.1, 1.45], 1: [0.045, -0.12, 1.57], 2: [-0.02, -0.31, 0.1], 3: [0, -0.31, 0.1], 4: [0.115, -0.12, 1.57], 5: [-0.03, -0.31, 0], 6: [-0.19, 0.03, 1.45], 7: [-0.04, -0.31, 0], 8: [-0.15, -0.19, 1.2], 9: [-0.19, -0.14, 1.45] };
  function foilNumber(num, ci) {
    var ds = String(num).split(''), n = ds.length, size = n === 1 ? 78 : n === 2 ? 64 : 45, font = size + 'px "CT Sans Bold"';
    return function (c, t, p, o) {
      var k = Math.exp(-5 * o.beat), col = [p.gold, p.accent, shade(p.accent2, 0.12)][ci % 3], lt = shade(col, 0.42), dk = shade(col, -0.34), i, ws = [], tot = 0, gap = size * 0.07, x, cap = size * 0.7, cy0 = -9, pos = [];
      c.font = font; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
      for (i = 0; i < n; i++) { ws.push(c.measureText(ds[i]).width); tot += ws[i]; } tot += gap * (n - 1);
      x = -tot / 2;
      for (i = 0; i < n; i++) { pos.push([x + ws[i] / 2 + Math.sin(t * 1.2 + i * 1.7 + ci) * 1.1, cy0 + Math.cos(t * 1.5 + i * 1.3 + ci) * 1.5 - (i % 2 ? 0 : k * 1.2), Math.sin(t * 1.1 + i * 2 + ci) * 0.04 + (i - (n - 1) / 2) * 0.035]); x += ws[i] + gap; }
      for (i = 0; i < n; i++) tether(c, pos[i][0], pos[i][1] + cap / 2 + 1, t, i);
      for (i = 0; i < n; i++) {
        var d = ds[i], sh = SHINE[d], e = size * 0.022;
        c.save(); c.translate(pos[i][0], pos[i][1]); c.rotate(pos[i][2]);
        Pg(c, [[-2.2, cap / 2 + 4.6], [2.2, cap / 2 + 4.6], [0, cap / 2 + 0.5]], shade(col, -0.12));
        c.lineWidth = size * 0.085 + K.ow() * 2; c.strokeStyle = dk; c.strokeText(d, 0, cap / 2);
        c.lineWidth = size * 0.085; c.strokeStyle = col; c.strokeText(d, 0, cap / 2); c.fillStyle = shade(col, -0.12); c.fillText(d, e, cap / 2 + e);
        c.fillStyle = lt; c.fillText(d, -e, cap / 2 - e); c.fillStyle = col; c.fillText(d, e * 0.35, cap / 2 + e * 0.35);
        c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(sh[0] * size, sh[1] * size, size * 0.085, size * 0.03, sh[2], 0, TAU); c.fill();
        c.restore();
      }
      spark(c, tot / 2 + 2 > 42 ? 40 : tot / 2 + 6, -cap / 2 - 12, 3.8 + k * 2.5, t, ci); spark(c, -Math.min(42, tot / 2 + 6), -cap / 2 + 2, 2.8, t, ci + 2); spark(c, Math.min(40, tot / 2 + 4), cap / 2 - 6, 2.4, t, ci + 4);
    };
  }
  [1, 5, 10, 16, 18, 21, 25, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (num, i) { Art.add('prop', 'foil' + num, foilNumber(num, i)); });
});
