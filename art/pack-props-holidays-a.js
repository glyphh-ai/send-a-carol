/* Send a Carol art pack: props for the holidays, part A (Hanukkah, Kwanzaa, New Year, Lunar New Year, Valentine's,
   St Patrick's, Easter, Passover, spring). Blocks only come in through CarolArt.add; nothing here replaces launch art.
   These are religious and cultural symbols: counts, colour order and shapes are drawn as they are (see each block's
   note), and no block carries lettering, numerals or calligraphy. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var flame = K.flame, heartPath = K.heartPath, starPath = K.starPath, twinkle = K.twinkle, shine = K.shine, leaf = K.leaf, flower = K.flower;
  var RED = '#d8232f', WOOD = '#a87443', LEAF = '#3f9a4a';

  /* ---------- small helpers ---------- */
  function gsh(c, y, rx) { c.beginPath(); c.ellipse(0, y, rx, rx * 0.1 + 1.2, 0, 0, TAU); c.fillStyle = 'rgba(0,0,0,0.14)'; c.fill(); }
  /* stroke the current path with the house outline under it */
  function S(c, w, col) { var o = K.ow(); c.lineCap = 'round'; c.lineJoin = 'round'; if (o > 0) { c.lineWidth = w + o * 1.7; c.strokeStyle = shade(col, -0.34); c.stroke(); } c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  function Lo(c, x1, y1, x2, y2, w, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); S(c, w, col); }
  function glowDot(c, x, y, r, col, a) { var i; for (i = 0; i < 4; i++) dot(c, x, y, r * (1 - i * 0.17), alpha(col, a * 0.55)); }
  function candle(c, x, yTop, yBot, w, col, t, ph, fl) {
    R(c, x - w / 2, yTop, w, yBot - yTop, w * 0.28, col);
    Rn(c, x - w * 0.3, yTop + 1.2, w * 0.2, yBot - yTop - 2.4, w * 0.1, 'rgba(255,255,255,0.38)');
    L(c, x, yTop, x, yTop - 2, 0.8, '#3a2a22'); flame(c, x, yTop - 1.4, fl, fl * 2, t, ph);
  }
  function eggPath(c, x, y, w, h) { c.beginPath(); c.moveTo(x, y - h); c.bezierCurveTo(x + w * 0.75, y - h, x + w * 1.6, y + h, x, y + h); c.bezierCurveTo(x - w * 1.6, y + h, x - w * 0.75, y - h, x, y - h); c.closePath(); }
  /* a decorated egg: pat 0 bands and zigzag, 1 dots, 2 waves and little flowers */
  function egg(c, x, y, w, h, rot, fill, pat, a, b) {
    var i, j;
    c.save(); c.translate(x, y); c.rotate(rot);
    eggPath(c, 0, 0, w, h); F(c, fill);
    c.save(); eggPath(c, 0, 0, w, h); c.clip();
    if (pat === 0) {
      c.fillStyle = a; c.fillRect(-w * 1.2, -h * 0.5, w * 2.4, h * 0.2); c.fillRect(-w * 1.2, h * 0.36, w * 2.4, h * 0.2);
      c.beginPath(); for (i = -4; i <= 4; i++) { var zx = i * w * 0.3, zy = (i % 2 ? -1 : 1) * h * 0.1 + h * 0.04; if (i === -4) c.moveTo(zx, zy); else c.lineTo(zx, zy); } c.lineWidth = Math.max(1, w * 0.11); c.lineJoin = 'round'; c.strokeStyle = b; c.stroke();
      for (i = -2; i <= 2; i++) dot(c, i * w * 0.36, h * 0.72, w * 0.07, b);
    } else if (pat === 1) {
      for (j = -3; j <= 3; j++) for (i = -2; i <= 2; i++) dot(c, i * w * 0.48 + (j % 2 ? w * 0.24 : 0), j * h * 0.27 + h * 0.06, w * 0.12, (i + j) % 2 ? a : b);
    } else {
      c.lineWidth = Math.max(1, w * 0.1); c.lineCap = 'round';
      for (j = -1; j <= 1; j += 2) { c.beginPath(); for (i = -4; i <= 4; i++) { var wx = i * w * 0.3, wy = j * h * 0.42 + h * 0.06 + (i % 2 ? h * 0.06 : -h * 0.06); if (i === -4) c.moveTo(wx, wy); else c.quadraticCurveTo(wx - w * 0.15, wy + (i % 2 ? -1 : 1) * h * 0.1, wx, wy); } c.strokeStyle = j < 0 ? a : b; c.stroke(); }
      for (i = -1; i <= 1; i++) { var fx = i * w * 0.56, fy = h * 0.06; for (j = 0; j < 5; j++) dot(c, fx + Math.cos(j / 5 * TAU) * w * 0.14, fy + Math.sin(j / 5 * TAU) * w * 0.14, w * 0.085, i ? a : b); dot(c, fx, fy, w * 0.07, '#fff6d8'); }
    }
    c.fillStyle = 'rgba(40,20,50,0.1)'; c.beginPath(); c.ellipse(w * 0.75, h * 0.3, w * 0.6, h * 1.1, 0, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(-w * 0.38, -h * 0.45, w * 0.16, h * 0.2, 0.5, 0, TAU); c.fill();
    c.restore();
  }
  function coin(c, x, y, r, g) {
    var i;
    E(c, x, y, r, r, shade(g, -0.14));
    c.beginPath(); for (i = 0; i < 22; i++) { var a = i / 22 * TAU; c.moveTo(x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.84); c.lineTo(x + Math.cos(a) * r * 0.97, y + Math.sin(a) * r * 0.97); } c.lineWidth = 0.7; c.strokeStyle = shade(g, -0.36); c.stroke();
    dot(c, x, y, r * 0.8, g); dot(c, x, y, r * 0.56, shade(g, 0.22)); K.ringStroke(c, x, y, r * 0.56, 0.9, shade(g, -0.2));
    c.beginPath(); c.arc(x, y, r * 0.68, PI * 1.08, PI * 1.45); c.lineWidth = r * 0.09; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
  }
  function basketBody(c, x0, x1, yTop, yBot, inset, col) { /* a woven tub with a rim */
    var i, j, rows = 3, cols = 8, rh = (yBot - yTop - 3) / rows;
    c.beginPath(); c.moveTo(x0, yTop); c.lineTo(x1, yTop); c.quadraticCurveTo(x1 - inset * 0.4, yBot, x1 - inset - 4, yBot); c.lineTo(x0 + inset + 4, yBot); c.quadraticCurveTo(x0 + inset * 0.4, yBot, x0, yTop); c.closePath(); F(c, col);
    for (j = 0; j < rows; j++) { var k = (j + 0.5) / rows, a = x0 + inset * k * 0.95 + 2, b = x1 - inset * k * 0.95 - 2, cw = (b - a) / cols; for (i = 0; i < cols; i++) if ((i + j) % 2 === 0) Rn(c, a + i * cw + 0.5, yTop + 3.5 + j * rh, cw - 1, rh - 1.6, 1.4, shade(col, -0.17)); else Rn(c, a + i * cw + 1, yTop + 4 + j * rh, cw - 2, 1.4, 0.7, shade(col, 0.2)); }
    R(c, x0 - 3, yTop - 3, x1 - x0 + 6, 7, 3.5, shade(col, 0.18));
    for (i = 0; i < 11; i++) { var rx = x0 + (i + 0.5) * (x1 - x0) / 11; L(c, rx - 1.2, yTop + 2.4, rx + 1.2, yTop - 1.4, 1, shade(col, -0.2)); }
  }
  function petal(c, x, y, w, h, rot, col) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(0, -h); c.bezierCurveTo(w * 1.15, -h * 0.5, w * 1.1, h * 0.8, 0, h); c.bezierCurveTo(-w * 1.1, h * 0.8, -w * 1.15, -h * 0.5, 0, -h); c.closePath(); F(c, col); c.restore(); }

  /* ================= Hanukkah ================= */
  /* A Hanukkah menorah (hanukkiah): NINE branches. Eight candles stand level in one row; the ninth, the shamash,
     stands in the centre, raised above the rest. All nine are lit (the eighth night). */
  Art.add('prop', 'menorah', function (c, t, p, o) {
    var g = p.gold, gd = shade(g, -0.2), gl = shade(g, 0.4), k = Math.exp(-5 * o.beat), i, BL = '#3f7fd6';
    gsh(c, 43, 30);
    glowDot(c, 0, -26, 45 + k * 2 + Math.sin(t * 6), '#ffd66e', 0.085);
    R(c, -23, 36.5, 46, 6.5, 3.2, g); R(c, -14, 30.5, 28, 7.5, 3, gd); Rn(c, -19, 37.8, 22, 1.6, 0.8, gl);
    for (i = 4; i >= 1; i--) { c.beginPath(); c.ellipse(0, -8, i * 10.5, i * 6.4 + 2.4, 0, 0, PI); S(c, 3.3, g); c.beginPath(); c.ellipse(0, -8.6, i * 10.5, i * 6.4 + 2.4, 0, PI * 0.56, PI * 0.9); c.lineWidth = 0.9; c.strokeStyle = gl; c.stroke(); }
    R(c, -2.7, -19, 5.4, 51, 2, g); Rn(c, -1.5, -17, 1.2, 46, 0.6, gl);
    for (i = 1; i <= 4; i++) E(c, 0, -8 + i * 6.4 + 2.4, 4.3, 2.5, i % 2 ? gl : g);
    for (i = -4; i <= 4; i++) {
      if (!i) continue;
      var x = i * 10.5;
      candle(c, x, -28, -12, 4.6, (i + 8) % 2 ? BL : p.paper, t, i * 1.7, 4.6);
      R(c, x - 4, -12.5, 8, 5, 1.8, g); E(c, x, -12.5, 4.9, 1.5, gl);
    }
    candle(c, 0, -40, -23, 5, BL, t, 0.4, 5.2);
    R(c, -4.5, -23.5, 9, 5.5, 1.8, g); E(c, 0, -23.5, 5.4, 1.6, gl);
  });

  /* A dreidel: the four-sided spinning top. Its faces are left plain (no letters are drawn). */
  Art.add('prop', 'dreidel', function (c, t, p, o) {
    var B = '#3f7fd6', g = p.gold, a = Math.sin(t * 2.2) * 0.17, i;
    gsh(c, 43, 20);
    c.lineCap = 'round';
    for (i = 0; i < 2; i++) { var s0 = frac(t * 0.8 + i * 0.5) * TAU; c.beginPath(); c.ellipse(0, 40 - i * 1.5, 19 + i * 9, 3.6 + i * 1.6, 0, s0, s0 + 1.9); c.lineWidth = 1.5; c.strokeStyle = alpha(p.snow, 0.6); c.stroke(); }
    c.save(); c.translate(0, 40); c.rotate(a); c.translate(0, -40);
    Pg(c, [[-24, 9], [2, 16], [0, 40]], shade(B, -0.1)); Pg(c, [[2, 16], [24, 7], [0, 40]], shade(B, -0.3));
    Pg(c, [[-24, -21], [2, -16], [2, 16], [-24, 9]], B); Pg(c, [[2, -16], [24, -23], [24, 7], [2, 16]], shade(B, -0.2));
    Pg(c, [[-24, -21], [-1, -28], [24, -23], [2, -16]], shade(B, 0.32));
    Pg(c, [[-20, -16], [-2, -12.6], [-2, 11], [-20, 5.6]], shade(B, 0.2), true); c.lineWidth = 0.9; c.strokeStyle = g; c.stroke();
    Pg(c, [[6, -12.6], [20.5, -17.6], [20.5, 4.8], [6, 10.6]], shade(B, -0.08), true); c.lineWidth = 0.9; c.strokeStyle = shade(g, -0.12); c.stroke();
    c.beginPath(); c.moveTo(-17, -11); c.lineTo(-17, 2); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();
    R(c, -3.3, -45, 6.6, 24, 2.6, g); Rn(c, -1.9, -43, 1.5, 19, 0.7, shade(g, 0.45)); E(c, 0, -45, 5.2, 3.3, shade(g, 0.25));
    dot(c, 0, 39.4, 1.5, g);
    c.restore();
    twinkle(c, 33, -30, 4.5 + Math.sin(t * 3.4) * 1.8, p.gold); twinkle(c, -35, -6, 3 + Math.cos(t * 3) * 1.4, p.snow);
  });

  /* Hanukkah gelt: chocolate coins in gold foil, one half unwrapped. The coins are left unmarked. */
  Art.add('prop', 'gelt', function (c, t, p, o) {
    var g = p.gold, i, CH = '#6b3f26';
    gsh(c, 43, 36);
    for (i = 0; i < 3; i++) { E(c, -21, 37 - i * 5.2, 18, 5.6, shade(g, -0.14)); c.beginPath(); c.ellipse(-21, 35.6 - i * 5.2, 18, 5.6, 0, 0, TAU); c.fillStyle = g; c.fill(); }
    c.beginPath(); c.ellipse(-21, 25.2, 11.5, 3.3, 0, 0, TAU); c.lineWidth = 0.9; c.strokeStyle = shade(g, -0.2); c.stroke(); c.fillStyle = shade(g, 0.22); c.fill();
    coin(c, -15, -13, 22, g);
    E(c, 17, 9, 24, 24, CH); dot(c, 17, 9, 19, shade(CH, 0.1)); K.ringStroke(c, 17, 9, 13.5, 1, shade(CH, -0.2));
    c.beginPath(); c.arc(17, 9, 16.5, PI * 1.55, PI * 1.9); c.lineWidth = 1.8; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.3)'; c.stroke();
    c.save(); c.beginPath(); c.moveTo(-14, -22); c.lineTo(-14, 42); c.lineTo(50, 42); c.closePath(); c.clip(); coin(c, 17, 9, 24, g); c.restore();
    c.beginPath(); c.moveTo(0.3, -7.7); c.bezierCurveTo(-8, 8, 12, 30, 33.7, 25.7); c.closePath(); F(c, shade(g, 0.6));
    L(c, 4, -1, 12, 12, 0.7, shade(g, -0.05)); L(c, 9, 4, 21, 19, 0.7, shade(g, -0.05)); L(c, 5, 6, 9, 14, 0.7, 'rgba(255,255,255,0.9)'); L(c, 16, 16, 27, 23, 0.7, 'rgba(255,255,255,0.9)');
    twinkle(c, -33, -34, 5 + Math.sin(t * 3.2) * 2, p.snow); twinkle(c, 38, -14, 3.6 + Math.cos(t * 3.6) * 1.6, p.snow); twinkle(c, -2, 30, 2.6 + Math.sin(t * 4 + 1) * 1.2, p.snow);
  });

  /* Sufganiyot: round jelly doughnuts (no hole), dusted with sugar, the jelly showing on top. */
  function sufg(c, seed) {
    var D = '#cf8a42', R0 = rnd(seed), i;
    E(c, 0, 6, 36, 26, D);
    c.beginPath(); c.ellipse(-3, 0, 31, 19, 0, 0, TAU); c.fillStyle = shade(D, 0.1); c.fill();
    c.beginPath(); c.ellipse(0, 4, 35.2, 13, 0, PI * 0.08, PI * 0.92); c.lineWidth = 5.5; c.lineCap = 'butt'; c.strokeStyle = '#f2d6a2'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.88)'; c.beginPath(); c.ellipse(0, -9, 26, 10.5, 0, 0, TAU); c.fill();
    for (i = 0; i < 26; i++) { var a = R0() * TAU, rr = 0.75 + R0() * 0.5; dot(c, Math.cos(a) * 28 * rr, -8 + Math.sin(a) * 12.5 * rr, 0.6 + R0() * 1.1, 'rgba(255,255,255,0.9)'); }
    E(c, 0, -14, 9.5, 5.6, '#c81e3a'); E(c, 6.5, -10.6, 3, 3.6, '#c81e3a'); dot(c, 0.5, -13.6, 7, '#d93350'); shine(c, -3, -15.6, 2.6);
  }
  Art.add('prop', 'sufganiyah', function (c, t, p, o) {
    gsh(c, 43, 40);
    E(c, 0, 35, 44, 7.5, p.paper); c.beginPath(); c.ellipse(0, 34.4, 33, 4.6, 0, 0, TAU); c.fillStyle = shade(p.paper, -0.09); c.fill();
    c.save(); c.translate(21, -17); c.scale(0.6, 0.6); sufg(c, 'suf2'); c.restore();
    c.save(); c.translate(-6, 8); c.scale(0.92, 0.92); sufg(c, 'suf1'); c.restore();
    twinkle(c, -38, -28, 3.6 + Math.sin(t * 3) * 1.6, p.snow); twinkle(c, 42, 12, 2.8 + Math.cos(t * 3.5) * 1.3, p.snow);
  });

  /* The Star of David: two equilateral triangles, one pointing up and one down, interlaced into a six-pointed star. */
  Art.add('prop', 'starofdavid', function (c, t, p, o) {
    var B = '#3b74d9', d = shade(B, -0.36), Rr = 37, w = 6, ow = K.ow(), k = Math.exp(-5 * o.beat), i, q = Rr / Math.sqrt(3);
    function tri(up) { var s = up ? -1 : 1; c.beginPath(); c.moveTo(0, s * Rr); c.lineTo(Rr * 0.866, -s * Rr * 0.5); c.lineTo(-Rr * 0.866, -s * Rr * 0.5); c.closePath(); }
    glowDot(c, 0, 0, 46 + k * 2, p.snow, 0.09);
    c.save(); c.lineJoin = 'miter'; c.miterLimit = 6; c.lineCap = 'butt';
    for (i = 0; i < 2; i++) {
      tri(i === 0); c.lineWidth = w + ow * 2; c.strokeStyle = d; c.stroke(); c.lineWidth = w; c.strokeStyle = B; c.stroke();
      c.lineWidth = 1.1; c.strokeStyle = shade(B, 0.42); c.save(); c.translate(-0.7, -0.9); tri(i === 0); c.stroke(); c.restore();
    }
    /* the up triangle passes back over the down one at every other crossing */
    var X = [[q, 0, 0.5, 0.866], [-q * 0.5, q * 0.866, 1, 0], [-q * 0.5, -q * 0.866, 0.5, -0.866]];
    for (i = 0; i < 3; i++) {
      var x = X[i][0], y = X[i][1], dx = X[i][2], dy = X[i][3];
      c.beginPath(); c.moveTo(x - dx * 5, y - dy * 5); c.lineTo(x + dx * 5, y + dy * 5); c.lineWidth = w + ow * 2; c.strokeStyle = d; c.stroke();
      c.beginPath(); c.moveTo(x - dx * 6.5, y - dy * 6.5); c.lineTo(x + dx * 6.5, y + dy * 6.5); c.lineWidth = w; c.strokeStyle = B; c.stroke();
      c.beginPath(); c.moveTo(x - dx * 6.5 - 0.7, y - dy * 6.5 - 0.9); c.lineTo(x + dx * 6.5 - 0.7, y + dy * 6.5 - 0.9); c.lineWidth = 1.1; c.strokeStyle = shade(B, 0.42); c.stroke();
    }
    c.restore();
    twinkle(c, 36, -36, 4.6 + Math.sin(t * 3) * 2, p.gold); twinkle(c, -40, 30, 3.2 + Math.cos(t * 3.4) * 1.5, p.gold);
  });

  /* ================= Kwanzaa ================= */
  /* The kinara: SEVEN candles. One black candle in the centre, three red to its left, three green to its right
     (as you face it). */
  Art.add('prop', 'kinara', function (c, t, p, o) {
    var W = '#8f5d36', k = Math.exp(-5 * o.beat), i, COLS = ['#d62b2b', '#d62b2b', '#d62b2b', '#2a2730', '#1f8f48', '#1f8f48', '#1f8f48'];
    gsh(c, 43, 40);
    glowDot(c, 0, -24, 46 + k * 2 + Math.sin(t * 6), '#ffd66e', 0.1);
    R(c, -34, 35, 68, 7, 3, shade(W, -0.14));
    R(c, -45, 22, 90, 14, 5, W); Rn(c, -41, 23.6, 82, 1.8, 0.9, shade(W, 0.28));
    c.beginPath(); for (i = 0; i <= 16; i++) { var zx = -40 + i * 5, zy = i % 2 ? 26.5 : 32.5; if (i) c.lineTo(zx, zy); else c.moveTo(zx, zy); } c.lineWidth = 1.2; c.lineJoin = 'round'; c.strokeStyle = shade(W, -0.3); c.stroke();
    for (i = 0; i < 7; i++) {
      var x = (i - 3) * 12.4;
      candle(c, x, -24, 16, 6.2, COLS[i], t, i * 1.9, 5.4);
      if (i === 3) { c.lineWidth = 0.8; c.strokeStyle = 'rgba(255,255,255,0.4)'; K.rrp(c, x - 3.1, -24, 6.2, 40, 1.7); c.stroke(); }
      R(c, x - 4.6, 15, 9.2, 8, 2, shade(W, 0.14)); E(c, x, 15, 5.4, 1.6, shade(W, 0.34));
    }
  });

  /* The unity cup (kikombe cha umoja): a carved wooden cup, standing on a woven mat. */
  Art.add('prop', 'unitycup', function (c, t, p, o) {
    var W = '#9a6236', d = shade(W, -0.3), l = shade(W, 0.26), ST = '#dcbb72', i;
    gsh(c, 44, 42);
    E(c, 0, 40, 45, 7.5, ST);
    c.lineWidth = 0.8; c.strokeStyle = shade(ST, -0.22);
    for (i = -3; i <= 3; i++) { c.beginPath(); c.ellipse(0, 40, 45 - Math.abs(i) * 0.5, 7.5, 0, PI * (0.5 + i * 0.13) - 0.12, PI * (0.5 + i * 0.13) + 0.12); c.stroke(); }
    c.beginPath(); c.ellipse(0, 40, 37, 5.4, 0, 0, TAU); c.stroke();
    E(c, 0, 37, 20, 4.8, W); c.beginPath(); c.ellipse(0, 36, 14, 2.6, 0, 0, TAU); c.fillStyle = l; c.fill();
    Pg(c, [[-4, 12], [4, 12], [6.5, 36], [-6.5, 36]], W); E(c, 0, 19, 8, 4.6, l); E(c, 0, 27, 5.6, 2.6, shade(W, -0.1));
    c.beginPath(); c.moveTo(-25, -33); c.bezierCurveTo(-25, -2, -13, 13, 0, 13); c.bezierCurveTo(13, 13, 25, -2, 25, -33); c.closePath(); F(c, W);
    L(c, -24.2, -24, 24.2, -24, 1.2, d); L(c, -22, -10.5, 22, -10.5, 1.2, d);
    for (i = -3; i <= 2; i++) Pg(c, [[i * 7.2 + 0.4, -12], [i * 7.2 + 3.8, -22.5], [i * 7.2 + 7.2, -12]], i % 2 ? d : l, true);
    for (i = -2; i <= 2; i++) dot(c, i * 7.6, -2.5 - Math.abs(i) * 0.4, 1.5, d);
    c.beginPath(); c.moveTo(-19, -27); c.quadraticCurveTo(-18, -3, -9, 7); c.lineWidth = 2.6; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.28)'; c.stroke();
    E(c, 0, -33, 25, 5.8, l); c.beginPath(); c.ellipse(0, -32.6, 21, 3.9, 0, 0, TAU); c.fillStyle = d; c.fill();
    twinkle(c, 31, -38, 3.6 + Math.sin(t * 3) * 1.6, p.gold);
  });

  /* Ears of corn (muhindi): three dried ears with their husks, tied together. */
  Art.add('prop', 'cornears', function (c, t, p, o) {
    var HK = '#dccb8c', YS = ['#eaa53c', '#f6d55c', '#f2c230'], AN = [-0.56, 0.56, 0], e, i, j, s;
    gsh(c, 43, 26);
    for (e = 0; e < 3; e++) {
      c.save(); c.translate(0, 40); c.rotate(AN[e]);
      E(c, 0, -53, 10.5, 30, YS[e]);
      for (j = 0; j < 10; j++) for (i = -2; i <= 2; i++) { var kx = i * 3.9, ky = -78 + j * 5.6 + (i % 2 ? 2.8 : 0), nn = (kx * kx) / 110 + ((ky + 53) * (ky + 53)) / 900; if (nn < 0.8) dot(c, kx, ky, 1.9, (i + j) % 3 ? shade(YS[e], 0.26) : shade(YS[e], -0.1)); }
      for (s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(s * 17, -8, s * 19, -36, s * 9.5, -54); c.bezierCurveTo(s * 9, -32, s * 3, -14, 0, 0); c.closePath(); F(c, s < 0 ? HK : shade(HK, -0.08)); L(c, s * 4, -8, s * 11, -40, 0.7, shade(HK, -0.22)); }
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-7, -10, -5, -26, 0, -34); c.bezierCurveTo(5, -26, 7, -10, 0, 0); c.closePath(); F(c, shade(HK, 0.12));
      c.restore();
    }
    R(c, -8, 27, 16, 6.5, 2.4, '#a9743f'); L(c, -6, 29, 6, 29, 0.8, '#7b5230'); L(c, -6, 31.5, 6, 31.5, 0.8, '#7b5230');
    Pg(c, [[-5, 33], [5, 33], [9, 43], [0, 40], [-9, 43]], shade(HK, -0.05));
  });

  /* The crops (mazao): a woven basket of fruit. */
  Art.add('prop', 'fruitbasket', function (c, t, p, o) {
    var i, GR = [[-33, 3], [-26, 2], [-36, 10], [-29, 9.5], [-22, 9], [-32.5, 17], [-26, 16.5], [-29, 23.5]];
    gsh(c, 43, 34);
    for (i = 0; i < 2; i++) { c.save(); c.translate(i * 5, i * 4); c.rotate(i * 0.2); c.beginPath(); c.moveTo(8, 0); c.quadraticCurveTo(31, -12, 33, -42); c.quadraticCurveTo(43, -10, 14, 10); c.closePath(); F(c, i ? '#f7d95a' : '#eec43c'); Rn(c, 31.2, -44.5, 3.4, 4.5, 1, '#6b4a2e'); c.restore(); }
    leaf(c, -8, -30, 17, -1.0, '#57a445'); leaf(c, -8, -30, 14, -2.2, LEAF);
    c.beginPath(); c.moveTo(-6, -33); c.bezierCurveTo(2, -33, 5, -22, 7, -14); c.bezierCurveTo(9, -4, -21, -4, -19, -14); c.bezierCurveTo(-17, -22, -14, -33, -6, -33); c.closePath(); F(c, '#bcd35f'); L(c, -6, -33, -5, -38, 1.5, '#6b4a2e');
    dot(c, -9, -16, 4, 'rgba(255,255,255,0.3)');
    E(c, 12, -6, 13, 13, '#f39a2c'); dot(c, 9, -9, 8.5, shade('#f39a2c', 0.16)); dot(c, 13, -17.6, 1.4, '#4f7a2a'); shine(c, 7, -11, 2.6);
    E(c, -19, -3, 14, 13, '#d93a3a'); dot(c, -22, -6, 9, shade('#d93a3a', 0.14)); L(c, -18, -15, -16.5, -20, 1.5, '#6b4a2e'); leaf(c, -16.5, -19, 9, -0.5, '#57a445'); shine(c, -24.5, -9, 2.8);
    basketBody(c, -37, 37, 9, 41, 9, '#c08a4a');
    for (i = 0; i < GR.length; i++) { E(c, GR[i][0], GR[i][1], 4.3, 4.3, i % 3 ? '#7b4bb0' : '#8e5cc4'); dot(c, GR[i][0] - 1.2, GR[i][1] - 1.3, 1.2, 'rgba(255,255,255,0.5)'); }
  });

  /* ================= New Year ================= */
  /* A clock at twelve: both hands straight up. Marks only, no numerals. */
  Art.add('prop', 'clockmidnight', function (c, t, p, o) {
    var g = p.gold, k = Math.exp(-5 * o.beat), i, a, CF = [p.accent, p.accent2, p.gold, p.snow];
    gsh(c, 44, 26);
    for (i = 0; i < 9; i++) { a = -PI / 2 + (i - 4) * 0.33; var r0 = 44 + k * 3, r1 = 48.5 + k * 4; if (i % 2) L(c, Math.cos(a) * r0, 3 + Math.sin(a) * r0, Math.cos(a) * r1, 3 + Math.sin(a) * r1, 1.6, alpha(p.snow, 0.5 + k * 0.45)); else dot(c, Math.cos(a) * (r0 + 2), 3 + Math.sin(a) * (r0 + 2), 1.6, CF[(i / 2) % 4]); }
    Pg(c, [[-24, 34], [-15, 30], [-18, 43], [-28, 43]], shade(g, -0.2)); Pg(c, [[24, 34], [15, 30], [18, 43], [28, 43]], shade(g, -0.2));
    E(c, 0, 3, 38, 38, g); dot(c, 0, 3, 35, shade(g, 0.28)); dot(c, 0, 3, 33.4, g);
    E(c, 0, 3, 30.5, 30.5, p.paper); dot(c, 0, 4, 28.5, shade(p.paper, -0.05)); dot(c, 0, 3, 27.6, p.paper);
    for (i = 0; i < 12; i++) { a = i / 12 * TAU; var q = i % 3 === 0; L(c, Math.sin(a) * (q ? 21 : 23.6), 3 - Math.cos(a) * (q ? 21 : 23.6), Math.sin(a) * 26.4, 3 - Math.cos(a) * 26.4, q ? 2.6 : 1.3, p.ink); }
    starPath(c, 0, -18.6, 3.4 + k * 1.2, 1.5, 4, 0); c.fillStyle = p.accent; c.fill();
    R(c, -2.7, -11.5, 5.4, 17, 2.7, p.accent);
    Pg(c, [[-1.3, 5], [1.3, 5], [0.9, -20], [0, -23.5], [-0.9, -20]], p.ink, true);
    E(c, 0, 3, 3.4, 3.4, g); dot(c, -0.6, 2.4, 1.2, shade(g, 0.5));
    c.beginPath(); c.arc(0, 3, 24, PI * 1.12, PI * 1.38); c.lineWidth = 2.4; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke();
    twinkle(c, 37, -34, 5 + k * 3 + Math.sin(t * 3) * 1.5, p.snow); twinkle(c, -40, -27, 3.4 + k * 2 + Math.cos(t * 3.4) * 1.2, p.gold); twinkle(c, 43, 22, 2.6 + Math.sin(t * 4 + 1) * 1.1, p.gold);
  });

  /* ================= Lunar New Year ================= */
  /* A round red paper lantern with gold ribs and a gold tassel. No characters. */
  Art.add('prop', 'redlantern', function (c, t, p, o) {
    var g = p.gold, i, k = Math.exp(-5 * o.beat);
    c.save(); c.translate(0, -48); c.rotate(Math.sin(t * 1.6) * 0.05); c.translate(0, 48);
    L(c, 0, -49, 0, -38, 1.5, shade(g, -0.15));
    glowDot(c, 0, -9, 43 + k * 2, '#ffbe5a', 0.1);
    E(c, 0, -9, 34, 26, RED);
    c.beginPath(); c.ellipse(-3, -11, 23, 18, 0, 0, TAU); c.fillStyle = alpha('#ff7a52', 0.5 + k * 0.14); c.fill();
    c.beginPath(); c.ellipse(-4, -12, 13, 11, 0, 0, TAU); c.fillStyle = alpha('#ffc27a', 0.4 + k * 0.14); c.fill();
    c.lineWidth = 1.2; c.strokeStyle = g;
    for (i = 1; i <= 3; i++) { c.beginPath(); c.ellipse(0, -9, i * 10, 25.6, 0, 0, TAU); c.stroke(); }
    L(c, 0, -34.6, 0, 16.6, 1.2, g);
    R(c, -12, -39, 24, 7.5, 2.2, g); Rn(c, -10, -37.6, 20, 1.5, 0.7, shade(g, 0.45)); R(c, -12, 13.5, 24, 7.5, 2.2, g); Rn(c, -10, 15, 20, 1.5, 0.7, shade(g, 0.45));
    c.save(); c.translate(0, 21); c.rotate(Math.sin(t * 1.6 - 0.7) * 0.13);
    L(c, 0, 0, 0, 6, 1.5, shade(g, -0.15)); E(c, 0, 8.4, 3.7, 3.7, RED);
    Pg(c, [[-4.2, 12], [4.2, 12], [6, 28.5], [-6, 28.5]], g); for (i = -2; i <= 2; i++) L(c, i * 1.6, 15.5, i * 2.3, 27.6, 0.6, shade(g, -0.26));
    R(c, -4.8, 11.4, 9.6, 3.4, 1.2, RED);
    c.restore();
    shine(c, -17, -22, 4.6);
    c.restore();
  });

  /* A red envelope: plain red with a gold border and a plain round gold seal. No characters. */
  function envelope(c, g) {
    R(c, -23, -36, 46, 72, 4, RED);
    K.rrp(c, -19, -32, 38, 64, 2.4); c.lineWidth = 1; c.strokeStyle = g; c.stroke();
    c.beginPath(); c.moveTo(-23, -31); c.quadraticCurveTo(-23, -36, -19, -36); c.lineTo(19, -36); c.quadraticCurveTo(23, -36, 23, -31); c.lineTo(23, -19); c.quadraticCurveTo(0, -3, -23, -19); c.closePath(); F(c, shade(RED, -0.12));
    c.beginPath(); c.moveTo(-21, -19.5); c.quadraticCurveTo(0, -5.4, 21, -19.5); c.lineWidth = 1; c.strokeStyle = g; c.stroke();
    E(c, 0, -11, 8.6, 8.6, g); K.ringStroke(c, 0, -11, 5.8, 0.9, shade(g, -0.26)); dot(c, 0, -11, 2.5, shade(g, 0.42));
    c.beginPath(); c.arc(0, -11, 7, PI * 1.1, PI * 1.45); c.lineWidth = 1.1; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    Rn(c, -19.6, 0, 1.8, 28, 0.9, 'rgba(255,255,255,0.16)');
  }
  Art.add('prop', 'redenvelope', function (c, t, p, o) {
    var g = p.gold;
    gsh(c, 44, 30);
    c.save(); c.translate(11, -1); c.rotate(0.24); envelope(c, g); c.restore();
    c.save(); c.translate(-7, 3); c.rotate(-0.1 + Math.sin(t * 1.4) * 0.015); envelope(c, g); c.restore();
    twinkle(c, 39, -38, 4.6 + Math.sin(t * 3) * 2, p.gold); twinkle(c, -40, -30, 3.2 + Math.cos(t * 3.4) * 1.4, p.gold); twinkle(c, -38, 30, 2.4 + Math.sin(t * 4 + 2) * 1, p.snow);
  });

  /* Plum blossom: five-petalled blossoms on a bare dark branch (it flowers before its leaves come). */
  Art.add('prop', 'plumblossom', function (c, t, p, o) {
    var BR = '#6e4636', PK = '#f79ab8', PL = '#ffd3df', MID = '#d6336c', i, j,
      FL = [[-33, -27, 7.4, 0.2], [-19, -5, 6.4, 1], [-3, -3, 8, 0.5], [14, -13, 6.6, 2], [38, -1, 6.4, 0.9], [21, -43, 5.8, 1.6], [33, -32, 7.4, 0.1], [-33, 25, 6.6, 1.3], [26, -5, 5.2, 2.4]],
      BD = [[41, -41], [-41, -31], [45, -6], [-9, 15], [3, -23], [-25, 10], [17, -48]];
    c.beginPath(); c.moveTo(-14, 5); c.quadraticCurveTo(-21, -15, -35, -27); S(c, 3, BR);
    c.beginPath(); c.moveTo(8, -8); c.quadraticCurveTo(24, -3, 41, -2); S(c, 2.6, BR);
    c.beginPath(); c.moveTo(22, -22); c.quadraticCurveTo(16, -36, 20, -47); S(c, 2.2, BR);
    c.beginPath(); c.moveTo(-28, 21); c.quadraticCurveTo(-34, 22, -37, 27); S(c, 2, BR);
    c.beginPath(); c.moveTo(-46, 42); c.bezierCurveTo(-31, 21, -23, 7, -4, -2); S(c, 5.6, BR);
    c.beginPath(); c.moveTo(-4, -2); c.bezierCurveTo(10, -8, 23, -22, 41, -41); S(c, 3.6, BR);
    c.beginPath(); c.moveTo(-42, 36); c.bezierCurveTo(-30, 19, -22, 7, -6, -1); c.lineWidth = 1.2; c.strokeStyle = shade(BR, 0.3); c.stroke();
    E(c, -24, 13, 2.6, 2, shade(BR, -0.12)); E(c, 9, -7, 2.2, 1.8, shade(BR, -0.12));
    for (i = 0; i < BD.length; i++) { E(c, BD[i][0], BD[i][1], 2.8, 2.8, MID); dot(c, BD[i][0] - 0.8, BD[i][1] - 0.8, 1, PK); }
    for (i = 0; i < FL.length; i++) {
      var f = FL[i], rot = f[3] + Math.sin(t * 1.2 + i) * 0.06;
      flower(c, f[0], f[1], f[2], i % 3 === 1 ? PL : PK, MID, rot);
      for (j = 0; j < 5; j++) dot(c, f[0] + Math.cos(rot + (j + 0.5) / 5 * TAU) * f[2] * 0.42, f[1] + Math.sin(rot + (j + 0.5) / 5 * TAU) * f[2] * 0.42, f[2] * 0.1, '#ffe27a');
    }
    var fa = frac(t * 0.16), px = 8 - fa * 22 + Math.sin(fa * 9) * 5, py = 2 + fa * 44;
    c.save(); c.translate(px, py); c.rotate(fa * 7); c.beginPath(); c.ellipse(0, 0, 3.4, 2.3, 0, 0, TAU); c.fillStyle = alpha(PK, 0.9 * Math.sin(fa * PI)); c.fill(); c.restore();
  });

  /* A string of red firecrackers with gold bands, the fuse sparking. No characters. */
  Art.add('prop', 'firecrackers', function (c, t, p, o) {
    var g = p.gold, i, s, k = Math.exp(-5 * o.beat), fl = 0.6 + 0.4 * Math.sin(t * 23);
    c.save(); c.translate(0, -47); c.rotate(Math.sin(t * 1.8) * 0.05); c.translate(0, 47);
    L(c, 0, -34, 0, 31, 1.6, '#8a5a2a');
    for (i = 4; i >= 0; i--) for (s = -1; s <= 1; s += 2) {
      c.save(); c.translate(s * 1.2, -29 + i * 12.6 + (s > 0 ? 6 : 0)); c.rotate(-s * 0.86);
      L(c, 0, 0, 0, 4, 1, '#8a5a2a');
      R(c, -4.6, 3.6, 9.2, 21, 2, RED); Rn(c, -4.6, 5.6, 9.2, 2.6, 0, g); Rn(c, -4.6, 19.6, 9.2, 2.6, 0, g);
      Rn(c, -3, 8.8, 1.7, 10.2, 0.8, 'rgba(255,255,255,0.34)');
      c.restore();
    }
    Pg(c, [[0, -49], [8, -41], [0, -33], [-8, -41]], g); Pg(c, [[0, -45], [4, -41], [0, -37], [-4, -41]], RED, true); dot(c, 0, -41, 1.3, g);
    c.beginPath(); c.moveTo(0, 31); c.quadraticCurveTo(-4, 36, 1, 39); c.quadraticCurveTo(5, 41, 3, 44); c.lineWidth = 1.2; c.lineCap = 'round'; c.strokeStyle = '#8a5a2a'; c.stroke();
    dot(c, 3, 44.5, 5.5 + fl * 2 + k * 2, 'rgba(255,200,90,0.3)'); twinkle(c, 3, 44.5, 4.6 + fl * 2.4 + k * 2, '#ffe27a'); dot(c, 3, 44.5, 1.5, '#fff');
    for (i = 0; i < 4; i++) { var sf = frac(t * 1.7 + i * 0.27), sa = i * 1.9 + 0.6; dot(c, 3 + Math.cos(sa) * sf * 9, 44.5 + Math.sin(sa) * sf * 5 - sf * 4, 0.9 * (1 - sf) + 0.2, alpha('#ffd45a', 1 - sf)); }
    c.restore();
  });

  /* Tangerines with their leaves. */
  function tang(c, x, y, r, seed) {
    var O = '#f58a1f', R0 = rnd(seed), i;
    E(c, x, y, r, r * 0.93, O);
    c.beginPath(); c.ellipse(x - r * 0.12, y - r * 0.14, r * 0.8, r * 0.72, 0, 0, TAU); c.fillStyle = shade(O, 0.15); c.fill();
    for (i = 0; i < 9; i++) { var a = R0() * TAU, d = R0() * r * 0.75; dot(c, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9, 0.55, 'rgba(170,70,0,0.35)'); }
    starPath(c, x + r * 0.05, y - r * 0.74, r * 0.2, r * 0.09, 5, 0.3); c.fillStyle = '#4f7a2a'; c.fill();
    shine(c, x - r * 0.42, y - r * 0.45, r * 0.17);
  }
  Art.add('prop', 'tangerines', function (c, t, p, o) {
    gsh(c, 43, 40);
    tang(c, 21, 23, 19.5, 'tg2'); tang(c, -19, 21, 21, 'tg1');
    tang(c, 2, -11, 21, 'tg3');
    L(c, 3, -27, 4, -33.5, 2, '#6b4a2e');
    c.save(); c.translate(4, -32); c.rotate(Math.sin(t * 1.4) * 0.04);
    leaf(c, 0, 0, 25, -0.42, LEAF); leaf(c, 0, 0, 20, -2.55, '#57a445'); leaf(c, 0, 1, 12, -1.5, '#6cb850');
    c.restore();
    leaf(c, -24, 2, 13, -2.2, '#57a445');
    twinkle(c, 38, -14, 3.4 + Math.sin(t * 3) * 1.5, p.snow);
  });

  /* A dragon-dance dragon: the bright paper-and-cloth dragon carried on poles, head high, body rippling. Joyful. */
  Art.add('prop', 'paperdragon', function (c, t, p, o) {
    var Rd = '#e0362f', g = p.gold, Gn = '#2f9e63', PO = '#a9743f', k = Math.exp(-5 * o.beat), i, s, n = 9, pts = [],
      hx = -25, hy = -9 + Math.sin(t * 2.4 + 0.9) * 2.4 - k * 2;
    gsh(c, 45, 40);
    for (i = 0; i < n; i++) { var f = i / (n - 1); pts.push([41 - f * 46, 13 + Math.sin(f * 5 + t * 2.4) * 8 * (1 - f * 0.45) - f * 10, 6.4 + f * 5.2]); }
    for (i = 1; i < n; i += 3) Lo(c, pts[i][0], pts[i][1], pts[i][0] + 1, 45, 1.7, PO);
    Lo(c, hx + 3, hy + 12, hx + 5, 45, 1.7, PO);
    var q = pts[0]; Pg(c, [[q[0] - 1, q[1] - 3], [q[0] + 9.5, q[1] - 10], [q[0] + 6.5, q[1]], [q[0] + 9.5, q[1] + 9], [q[0] - 1, q[1] + 3]], g);
    for (i = 0; i < n; i++) {
      q = pts[i];
      Pg(c, [[q[0] - q[2] * 0.62, q[1] - q[2] * 0.7], [q[0] + 1.6, q[1] - q[2] * 1.8], [q[0] + q[2] * 0.62, q[1] - q[2] * 0.7]], i % 2 ? g : Gn);
      E(c, q[0], q[1], q[2], q[2], Rd);
      c.beginPath(); c.arc(q[0] + q[2] * 0.2, q[1], q[2] * 0.72, PI * 0.6, PI * 1.4); c.lineWidth = 1.3; c.strokeStyle = g; c.stroke();
      dot(c, q[0], q[1] + q[2] * 0.7, q[2] * 0.3, shade(g, 0.3));
    }
    /* the head, facing us */
    for (i = -2; i <= 2; i++) Pg(c, [[hx + i * 4.6 - 2.6, hy + 18], [hx + i * 4.6, hy + 27.5 - Math.abs(i) * 2 + k * 1.5], [hx + i * 4.6 + 2.6, hy + 18]], g);
    var MN = [[-18, 3], [18, 3], [-17, -7], [17, -7], [-12, -15], [12, -15]];
    for (i = 0; i < MN.length; i++) E(c, hx + MN[i][0], hy + MN[i][1], 6, 6, i % 4 < 2 ? Gn : shade(Gn, 0.2));
    for (s = -1; s <= 1; s += 2) { Lo(c, hx + s * 6.5, hy - 12, hx + s * 12, hy - 28, 3, g); Lo(c, hx + s * 10, hy - 21.5, hx + s * 16.5, hy - 24.5, 2.2, g); }
    E(c, hx, hy + 13, 13.5, 9.5, shade(Rd, -0.12));
    E(c, hx, hy, 18, 15.5, Rd);
    c.beginPath(); c.moveTo(hx - 12, hy + 9.5); c.quadraticCurveTo(hx, hy + 25 + k * 4, hx + 12, hy + 9.5); c.quadraticCurveTo(hx, hy + 14, hx - 12, hy + 9.5); c.closePath(); F(c, '#6a1d2a');
    E(c, hx, hy + 17 + k * 2, 4.4, 2.6, '#f0808e');
    for (i = -2; i <= 2; i++) Pg(c, [[hx + i * 3.6 - 1.6, hy + 12.4 - Math.abs(i) * 0.7], [hx + i * 3.6, hy + 16 - Math.abs(i) * 0.7], [hx + i * 3.6 + 1.6, hy + 12.4 - Math.abs(i) * 0.7]], '#fff', true);
    E(c, hx, hy + 6.5, 10.5, 6, shade(Rd, 0.2)); dot(c, hx - 3.6, hy + 6, 1.4, '#7a1620'); dot(c, hx + 3.6, hy + 6, 1.4, '#7a1620');
    c.lineWidth = 1.5; c.lineCap = 'round'; c.strokeStyle = g;
    for (s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(hx + s * 9.5, hy + 7); c.bezierCurveTo(hx + s * 19, hy + 3, hx + s * 22, hy + 15, hx + s * (25 + Math.sin(t * 3 + s) * 1.5), hy + 9 + Math.cos(t * 3 + s) * 2); c.stroke(); }
    for (s = -1; s <= 1; s += 2) {
      E(c, hx + s * 8, hy - 3.5, 5.2, 5.6, '#fff'); dot(c, hx + s * 8 - 0.6, hy - 2.8, 2.7, '#2b2118'); dot(c, hx + s * 8 + 0.4, hy - 3.8, 0.9, '#fff');
      c.beginPath(); c.arc(hx + s * 8, hy - 3.5, 7.2, PI * (s < 0 ? 1.12 : 1.22), PI * (s < 0 ? 1.78 : 1.88)); c.lineWidth = 3; c.strokeStyle = g; c.stroke();
    }
    E(c, hx, hy - 11.5, 3.5, 3.5, g); dot(c, hx - 0.9, hy - 12.4, 1.2, shade(g, 0.5));
    c.fillStyle = 'rgba(240,96,110,0.4)'; c.beginPath(); c.ellipse(hx - 13, hy + 3.5, 2.8, 2, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(hx + 13, hy + 3.5, 2.8, 2, 0, 0, TAU); c.fill();
    twinkle(c, 30, -30, 4 + k * 2.5 + Math.sin(t * 3) * 1.4, p.gold); twinkle(c, 6, -40, 2.8 + Math.cos(t * 3.4) * 1.2, p.snow);
  });

  /* ================= Valentine's ================= */
  Art.add('prop', 'cupidarrow', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), s = 1 + k * 0.07 + Math.sin(t * 3) * 0.015, col = o.col || p.accent, g = p.gold, i, A = -0.72;
    c.save(); c.rotate(A);
    Lo(c, 8, 0, 44, 0, 2.6, WOOD);
    for (i = 0; i < 3; i++) Pg(c, [[29 + i * 5.2, 0], [35.5 + i * 5.2, -7], [40 + i * 5.2, -7], [33.5 + i * 5.2, 0], [40 + i * 5.2, 7], [35.5 + i * 5.2, 7]], i % 2 ? g : p.accent2);
    c.restore();
    c.save(); c.scale(s, s);
    heartPath(c, -3, 4, 60); F(c, col);
    heartPath(c, -5, 2, 47); c.fillStyle = shade(col, 0.14); c.fill();
    c.beginPath(); c.arc(-15, -6, 10, PI * 1.05, PI * 1.5); c.lineWidth = 4.4; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    c.restore();
    c.save(); c.rotate(A);
    E(c, -19, 0, 2.6, 3.4, shade(col, -0.4));
    Lo(c, -19, 0, -42, 0, 2.6, WOOD);
    Pg(c, [[-53, 0], [-40, -7.5], [-43, 0], [-40, 7.5]], g); L(c, -50, 0, -44, 0, 1, shade(g, 0.5));
    c.restore();
    for (i = 0; i < 2; i++) { var hx = i ? -36 : 35, hy = (i ? -32 : 26) + Math.sin(t * 2 + i * 2) * 2; heartPath(c, hx, hy, i ? 9 : 11); c.fillStyle = shade(col, 0.4); c.fill(); }
    twinkle(c, -26, -38, 3 + Math.sin(t * 4) * 1.4, p.gold);
  });

  Art.add('prop', 'chocbox', function (c, t, p, o) {
    var col = o.col || p.accent, g = p.gold, BR = ['#6b3f26', '#8a5632', '#4a2a1a'], i,
      CH = [[-20, 0, 0], [8, 0, 1], [-6, 8, 2], [-18, 13.5, 3], [6, 13.5, 0], [-6, 23.5, 1]];
    gsh(c, 44, 30);
    c.translate(3, 0);
    c.save(); c.translate(10, -15); c.rotate(0.3 + Math.sin(t * 1.5) * 0.02);
    heartPath(c, 0, 0, 60); F(c, shade(col, -0.1)); heartPath(c, -1.5, -1.8, 50); c.fillStyle = shade(col, 0.1); c.fill();
    c.beginPath(); c.arc(-13, -10, 10, PI * 1.05, PI * 1.5); c.lineWidth = 3.6; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
    K.bow(c, 9, -15, 21, g);
    c.restore();
    heartPath(c, -6, 13.5, 70); F(c, shade(col, -0.26));
    heartPath(c, -6, 10, 68); F(c, col);
    heartPath(c, -6, 10, 57); c.fillStyle = '#f6e6cd'; c.fill(); c.lineWidth = 1; c.strokeStyle = shade(col, -0.3); c.stroke();
    for (i = 0; i < CH.length; i++) {
      var x = CH[i][0], y = CH[i][1], kd = CH[i][2];
      E(c, x, y + 0.6, 6.7, 6.5, '#e7cfa6');
      if (kd === 3) { E(c, x, y, 5, 5, '#f1dcb4'); L(c, x - 3, y - 1.5, x + 3, y + 1.5, 1, BR[0]); L(c, x - 3, y + 1.5, x + 3, y - 1.5, 1, BR[0]); }
      else if (kd === 1) { R(c, x - 4.6, y - 4.6, 9.2, 9.2, 2, BR[1]); L(c, x - 2.6, y - 2, x + 2.6, y - 2, 0.9, '#e7cfa6'); L(c, x - 2.6, y + 0.4, x + 2.6, y + 0.4, 0.9, '#e7cfa6'); L(c, x - 2.6, y + 2.8, x + 2.6, y + 2.8, 0.9, '#e7cfa6'); }
      else { E(c, x, y, 5.2, 5.2, BR[kd]); c.beginPath(); c.arc(x, y, 2.6, 0.4, PI * 1.5); c.lineWidth = 1.1; c.lineCap = 'round'; c.strokeStyle = shade(BR[kd], 0.3); c.stroke(); if (kd === 2) dot(c, x, y, 1.5, '#e8707e'); }
      dot(c, x - 1.8, y - 2.2, 1, 'rgba(255,255,255,0.4)');
    }
    c.translate(-3, 0);
    twinkle(c, -38, -28, 4 + Math.sin(t * 3) * 1.8, p.gold);
  });

  Art.add('prop', 'rose', function (c, t, p, o) {
    var col = o.col || '#d92b45', d1 = shade(col, -0.2), l1 = shade(col, 0.16), G = '#3f8f3a', sw = Math.sin(t * 1.4) * 0.035, s;
    c.save(); c.translate(3, 46); c.rotate(sw); c.translate(-3, -46);
    c.beginPath(); c.moveTo(0, -8); c.quadraticCurveTo(-7, 20, 3, 46); S(c, 3.2, G);
    Pg(c, [[-3.4, 8], [-7.5, 6.5], [-3.6, 11]], G); Pg(c, [[-1, 27], [3.4, 25], [0, 30]], G);
    c.save(); c.translate(-2.6, 17); c.rotate(-2.62); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(11, -9, 23, 0); c.quadraticCurveTo(11, 9, 0, 0); c.closePath(); F(c, G); L(c, 2, 0, 20, 0, 0.8, shade(G, 0.3)); c.restore();
    c.save(); c.translate(-0.4, 29); c.rotate(-0.52); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(11, -9, 24, 0); c.quadraticCurveTo(11, 9, 0, 0); c.closePath(); F(c, '#57a445'); L(c, 2, 0, 21, 0, 0.8, shade('#57a445', 0.3)); c.restore();
    for (s = -1; s <= 1; s++) Pg(c, [[s * 5 - 3, -9], [s * 9, -1 + Math.abs(s) * -3], [s * 5 + 3, -9]], G);
    for (s = 0; s < 5; s++) { var a5 = s / 5 * TAU + 0.63; E(c, Math.cos(a5) * 11.5, -24 + Math.sin(a5) * 10.5, 11, 10, s % 2 ? d1 : shade(col, -0.12), a5); }
    for (s = 0; s < 4; s++) { var a4 = s / 4 * TAU + 0.2; E(c, Math.cos(a4) * 6, -24.6 + Math.sin(a4) * 5.4, 8.6, 7.8, s % 2 ? col : shade(col, 0.07), a4); }
    E(c, 0, -25, 7, 6.6, l1);
    c.beginPath(); c.arc(0, -25, 4.3, 0.3, PI * 1.7); c.arc(0.8, -25.3, 2, PI * 1.7, PI * 3.3); c.lineWidth = 1.2; c.lineCap = 'round'; c.strokeStyle = shade(col, -0.36); c.stroke();
    c.beginPath(); c.arc(-2, -24, 17.5, PI * 1.05, PI * 1.33); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();
    c.restore();
    twinkle(c, 30, -36, 3.4 + Math.sin(t * 3) * 1.5, p.gold);
  });

  /* ================= St Patrick's ================= */
  /* A shamrock: THREE heart-shaped leaves on one stem (never four). */
  Art.add('prop', 'shamrock', function (c, t, p, o) {
    var G = '#2f9e4f', i, k = Math.exp(-5 * o.beat), s = 1 + k * 0.04;
    c.save(); c.translate(0, 44); c.rotate(Math.sin(t * 1.5) * 0.045); c.translate(0, -44); c.scale(s, s);
    c.beginPath(); c.moveTo(0, -1); c.quadraticCurveTo(1, 24, 12, 45); S(c, 3.6, shade(G, -0.1));
    for (i = 0; i < 3; i++) {
      c.save(); c.translate(0, -3); c.rotate(i * TAU / 3);
      heartPath(c, 0, -21, 40); F(c, G);
      heartPath(c, -1, -22.5, 30); c.fillStyle = shade(G, 0.15); c.fill();
      L(c, 0, -5, 0, -25, 1, shade(G, -0.22));
      c.restore();
    }
    dot(c, 0, -3, 2.4, shade(G, -0.22));
    c.restore();
    twinkle(c, 36, -34, 3.6 + Math.sin(t * 3) * 1.6, p.gold);
  });

  Art.add('prop', 'potofgold', function (c, t, p, o) {
    var PT = '#3d3b47', g = p.gold, i, k = Math.exp(-5 * o.beat),
      CN = [[-19, -10, 0], [-6, -13, 0], [9, -12, 0], [21, -10, 0], [-13, -17, 0], [2, -19, 0], [15, -17, 0], [-5, -24, 0], [8, -25, 0], [-16, -25, 1], [19, -25, 1], [1, -31, 0]];
    gsh(c, 44, 34);
    E(c, -19, 39, 6.5, 4.6, PT); E(c, 19, 39, 6.5, 4.6, PT);
    c.lineWidth = 2.6; c.strokeStyle = shade(PT, 0.16); c.beginPath(); c.arc(-36, 2, 5.5, PI * 0.4, PI * 1.6); c.stroke(); c.beginPath(); c.arc(36, 2, 5.5, PI * 1.4, PI * 2.6); c.stroke();
    E(c, 0, 14, 37, 27, PT);
    c.beginPath(); c.ellipse(0, 14, 31, 21, 0, PI * 0.62, PI * 0.97); c.lineWidth = 3.6; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.24)'; c.stroke();
    c.beginPath(); c.ellipse(0, 14, 36.4, 26.4, 0, 0, TAU); c.lineWidth = 0.9; c.strokeStyle = 'rgba(255,255,255,0.3)'; c.stroke();
    E(c, 0, -8, 32, 8.5, shade(PT, -0.3));
    for (i = 0; i < CN.length; i++) {
      var x = CN[i][0], y = CN[i][1];
      if (CN[i][2]) { E(c, x, y, 7, 7.4, g); dot(c, x, y, 4.6, shade(g, 0.24)); }
      else { E(c, x, y + 1.6, 8.6, 4.4, shade(g, -0.16)); c.beginPath(); c.ellipse(x, y, 8.6, 4.4, 0, 0, TAU); c.fillStyle = g; c.fill(); c.beginPath(); c.ellipse(x, y, 5.4, 2.5, 0, 0, TAU); c.fillStyle = shade(g, 0.26); c.fill(); }
    }
    c.beginPath(); c.ellipse(0, -8, 33.5, 9.4, 0, 0, PI); S(c, 5.2, shade(PT, 0.14));
    c.beginPath(); c.ellipse(0, -9.4, 33.5, 9.4, 0, PI * 0.12, PI * 0.5); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();
    twinkle(c, -8, -38, 5 + k * 2.5 + Math.sin(t * 3) * 1.6, p.snow); twinkle(c, 24, -32, 3.6 + Math.cos(t * 3.5) * 1.5, p.snow); twinkle(c, -30, -22, 2.8 + Math.sin(t * 4 + 1) * 1.2, p.snow);
  });

  /* ================= Easter and spring ================= */
  Art.add('prop', 'easterbasket', function (c, t, p, o) {
    var BK = '#c99552', i, pa = mix(p.accent, '#ffffff', 0.38), pb = mix(p.accent2, '#ffffff', 0.38), pc = shade(p.gold, 0.3);
    gsh(c, 43, 34);
    c.beginPath(); c.ellipse(0, 6, 31, 45, 0, PI, TAU); S(c, 5.4, BK);
    for (i = 1; i < 12; i++) { var a = PI + i / 12 * PI, hx = Math.cos(a) * 31, hy = 6 + Math.sin(a) * 45; L(c, hx - Math.cos(a) * 2.2 + Math.sin(a) * 1.2, hy - Math.sin(a) * 2.2 - Math.cos(a) * 1.2, hx + Math.cos(a) * 2.2 - Math.sin(a) * 1.2, hy + Math.sin(a) * 2.2 + Math.cos(a) * 1.2, 0.9, shade(BK, -0.22)); }
    egg(c, -21, -2, 9.5, 13, -0.3, pa, 1, p.paper, p.accent);
    egg(c, 21, -2, 9.5, 13, 0.3, pb, 2, p.paper, p.gold);
    egg(c, -7.5, -7, 10, 14, -0.08, pc, 0, p.accent, p.accent2);
    egg(c, 8, -5, 9.6, 13, 0.14, shade(p.paper, -0.02), 1, p.accent2, p.accent);
    for (i = 0; i < 17; i++) { var gx = -34 + i * 4.25, gh = 9 + ((i * 7) % 5) * 1.6, gl = Math.sin(t * 1.6 + i) * 1.2; Pg(c, [[gx - 2.6, 10], [gx + gl + ((i % 3) - 1) * 2, 10 - gh], [gx + 2.6, 10]], i % 2 ? '#5cb85c' : '#43a047', true); }
    basketBody(c, -35, 35, 9, 41, 8, BK);
    K.bow(c, 25, -27, 22, p.accent);
    twinkle(c, -36, -30, 3.4 + Math.sin(t * 3) * 1.5, p.snow);
  });

  Art.add('prop', 'easteregg', function (c, t, p, o) {
    var i, pa = mix(p.accent, '#ffffff', 0.36), pb = mix(p.accent2, '#ffffff', 0.36), pc = shade(p.gold, 0.26), k = Math.exp(-5 * o.beat);
    gsh(c, 42, 42);
    egg(c, -27, 12, 15.5, 21, -0.24, pb, 1, p.paper, p.gold);
    egg(c, 27, 13, 15.5, 21, 0.24, pa, 2, p.paper, p.accent2);
    egg(c, 0, -3 - k * 1.5, 20, 28, Math.sin(t * 1.6) * 0.03, pc, 0, p.accent, p.accent2);
    for (i = 0; i < 21; i++) { var gx = -46 + i * 4.6, gh = 8 + ((i * 7) % 5) * 1.7, gl = Math.sin(t * 1.6 + i) * 1.2; Pg(c, [[gx - 2.8, 43], [gx + gl + ((i % 3) - 1) * 2, 43 - gh], [gx + 2.8, 43]], i % 2 ? '#5cb85c' : '#43a047', true); }
    twinkle(c, 37, -30, 4 + Math.sin(t * 3) * 1.8, p.snow); twinkle(c, -36, -26, 3 + Math.cos(t * 3.4) * 1.4, p.snow);
  });

  Art.add('prop', 'tulips', function (c, t, p, o) {
    var G = '#3f9a4a', HD = [[-31, -15], [-16, -30], [0, -37], [16, -30], [31, -15]], COLS = [p.accent, '#f7a8c4', p.gold, '#a877dd', shade(p.accent, 0.3)], i, s, ORD = [0, 4, 1, 3, 2];
    gsh(c, 44, 20);
    for (s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(s * 2, 24); c.bezierCurveTo(s * 22, 14, s * 34, 4, s * 43, 8 + Math.sin(t * 1.3 + s) * 1.2); c.bezierCurveTo(s * 32, 16, s * 18, 26, s * 2, 28); c.closePath(); F(c, shade(G, -0.06)); }
    for (i = 0; i < 5; i++) { var h = HD[i]; c.beginPath(); c.moveTo(h[0], h[1] + 8); c.quadraticCurveTo(h[0] * 0.5, 4, h[0] * 0.08, 24); c.lineTo(-h[0] * 0.26, 44); S(c, 2.6, i % 2 ? G : shade(G, 0.12)); }
    for (s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(s * 1, 22); c.bezierCurveTo(s * 9, 6, s * 13, -6, s * 10, -17); c.bezierCurveTo(s * 4, -8, s * 1, 6, s * -3, 22); c.closePath(); F(c, shade(G, 0.1)); }
    for (i = 0; i < 5; i++) {
      var j = ORD[i], hh = HD[j], col = COLS[j], rot = hh[0] / 62 + Math.sin(t * 1.5 + j) * 0.03;
      c.save(); c.translate(hh[0], hh[1]); c.rotate(rot);
      petal(c, -4.6, 0.5, 5.4, 10.5, -0.26, shade(col, -0.14)); petal(c, 4.6, 0.5, 5.4, 10.5, 0.26, shade(col, -0.14)); petal(c, 0, 1.2, 5.8, 11, 0, col);
      c.beginPath(); c.ellipse(-1.6, -1, 1.3, 5, 0.1, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
      c.restore();
    }
    R(c, -6.5, 20.5, 13, 6.5, 2.4, p.paper); K.bow(c, 0, 24, 17, p.paper);
  });

  /* A plain cross (the Latin cross: the upright longer than the crossbar, the crossbar about a third of the way
     down), with spring flowers at its foot. Nothing is on it. For Easter-faith and Christian milestone cards only. */
  Art.add('prop', 'simplecross', function (c, t, p, o) {
    var W = '#a87443', i, FLW = [[-27, 30, 6.2, '#ffffff', '#ffd54a'], [-13, 35, 5.4, '#f7a8c4', '#ffe27a'], [13, 34, 5.8, '#ffe27a', '#f39a2c'], [27, 30, 6, '#ffffff', '#ffd54a'], [0, 38, 5.2, '#c9a7f2', '#ffe27a'], [-36, 37, 4.4, '#ffe27a', '#f39a2c'], [37, 37, 4.4, '#f7a8c4', '#ffe27a']];
    glowDot(c, 0, -14, 45, p.snow, 0.075 + 0.012 * Math.sin(t * 1.4));
    gsh(c, 44, 42);
    c.beginPath(); c.moveTo(-45, 44); c.quadraticCurveTo(-34, 25, 0, 25); c.quadraticCurveTo(34, 25, 45, 44); c.closePath(); F(c, '#6fae52');
    Pg(c, [[-5.6, -47], [5.6, -47], [5.6, -28], [22.5, -28], [22.5, -16.8], [5.6, -16.8], [5.6, 31], [-5.6, 31], [-5.6, -16.8], [-22.5, -16.8], [-22.5, -28], [-5.6, -28]], W);
    Rn(c, -3.8, -45, 2, 74, 1, 'rgba(255,255,255,0.26)'); Rn(c, -20.6, -26.2, 15, 1.8, 0.9, 'rgba(255,255,255,0.26)'); Rn(c, 7, -26.2, 13.6, 1.8, 0.9, 'rgba(255,255,255,0.2)');
    Rn(c, 3.2, -45, 1.6, 74, 0.8, 'rgba(40,20,30,0.14)'); Rn(c, -20.6, -19.6, 41.2, 1.6, 0.8, 'rgba(40,20,30,0.14)');
    for (i = 0; i < 9; i++) leaf(c, -34 + i * 8.5, 37 - (i % 2) * 3, 10, -PI / 2 + (i - 4) * 0.2 + Math.sin(t * 1.3 + i) * 0.04, i % 2 ? '#4f9d45' : '#3f8f3a');
    for (i = 0; i < FLW.length; i++) flower(c, FLW[i][0], FLW[i][1], FLW[i][2], FLW[i][3], FLW[i][4], i * 0.7 + Math.sin(t * 1.2 + i) * 0.05);
  });

  /* ================= Passover ================= */
  /* A Seder plate: a round plate with six small dishes, set out in the familiar two-triangle arrangement:
     shank bone (upper right), egg (upper left), bitter herb (centre), charoset (lower right), green vegetable
     (lower left), second bitter herb / romaine (bottom). No lettering. */
  Art.add('prop', 'sederplate', function (c, t, p, o) {
    var PL = p.paper, BL = '#3f6fc2', i, DS = [[17, -21], [-17, -21], [0, -4], [21, 10], [-21, 10], [0, 24]], x, y;
    dot(c, 1, 3, 45.5, 'rgba(0,0,0,0.13)');
    E(c, 0, 0, 44.5, 44.5, PL); dot(c, 0, 0, 36, shade(PL, -0.045));
    K.ringStroke(c, 0, 0, 41.6, 1.3, BL); K.ringStroke(c, 0, 0, 38.6, 0.8, p.gold);
    for (i = 0; i < 24; i++) dot(c, Math.cos(i / 24 * TAU) * 40.1, Math.sin(i / 24 * TAU) * 40.1, 0.5, BL);
    for (i = 0; i < 6; i++) { x = DS[i][0]; y = DS[i][1]; E(c, x, y, 9.7, 9.7, '#fbf6ec'); dot(c, x, y + 0.4, 7.9, '#e9e1d2'); dot(c, x, y, 7.5, '#f6f0e4'); K.ringStroke(c, x, y, 8.9, 0.6, alpha(BL, 0.6)); }
    /* shank bone */
    x = DS[0][0]; y = DS[0][1]; K.bone(c, x, y, 15, -0.5, '#ead5b4'); dot(c, x + 2, y - 1.6, 1.3, 'rgba(150,84,30,0.35)'); dot(c, x - 2.4, y + 1.6, 1, 'rgba(150,84,30,0.3)');
    /* roasted egg */
    x = DS[1][0]; y = DS[1][1]; c.save(); c.translate(x, y); c.rotate(0.5); eggPath(c, 0, 0, 4.4, 5.8); F(c, '#f1e2c8'); dot(c, 1.2, 1.6, 2, 'rgba(160,96,40,0.3)'); dot(c, -1.4, -1.8, 1, 'rgba(255,255,255,0.7)'); c.restore();
    /* bitter herb: a horseradish root */
    x = DS[2][0]; y = DS[2][1]; c.save(); c.translate(x, y); c.rotate(-0.42); c.beginPath(); c.moveTo(-6.6, 0.4); c.quadraticCurveTo(-2, -3.6, 4.6, -2.6); c.quadraticCurveTo(6.6, 0, 4.6, 2.6); c.quadraticCurveTo(-2, 2.8, -6.6, 0.4); c.closePath(); F(c, '#e8dcc0'); L(c, -2, -1.4, -1.4, 1.2, 0.5, '#b9a67e'); L(c, 1.4, -1.8, 1.8, 1.4, 0.5, '#b9a67e'); leaf(c, 5, 0, 4.6, -0.5, '#6cb850'); leaf(c, 5, 0, 4.2, 0.5, '#57a445'); c.restore();
    /* charoset */
    x = DS[3][0]; y = DS[3][1]; E(c, x, y + 0.5, 6, 4.8, '#8f5d3a'); dot(c, x - 2, y - 1, 1.3, '#c9a070'); dot(c, x + 2.2, y + 0.4, 1.2, '#5e3a26'); dot(c, x + 0.4, y - 2, 1, '#d9b98a'); dot(c, x - 0.6, y + 2, 1.1, '#b5553a'); dot(c, x + 3, y - 1.8, 0.8, '#c9a070');
    /* green vegetable: parsley */
    x = DS[4][0]; y = DS[4][1]; L(c, x - 3.6, y + 5, x + 1, y - 1, 0.9, '#3f8f3a'); L(c, x - 3.6, y + 5, x - 3, y - 2, 0.9, '#3f8f3a'); L(c, x - 3.6, y + 5, x + 3.6, y + 1.6, 0.9, '#3f8f3a');
    for (i = 0; i < 7; i++) { var a = i * 0.9, px = [x + 1.4, x - 3, x + 4][i % 3] + Math.cos(a) * 1.7, py = [y - 2, y - 3, y + 1.2][i % 3] + Math.sin(a) * 1.7; dot(c, px, py, 1.9, i % 2 ? '#4fa64a' : '#3d9440'); }
    /* romaine */
    x = DS[5][0]; y = DS[5][1]; leaf(c, x - 6.6, y + 2.4, 13.4, -0.34, '#8fc45a'); leaf(c, x - 6, y + 0.4, 12.4, 0.1, '#a6d36c');
    twinkle(c, 35, -35, 3 + Math.sin(t * 3) * 1.3, p.gold);
  });

  /* Matzah: flat square sheets with rows of pricked holes and browned blisters. */
  function matzahSheet(c, x, y, rot, seed) {
    var M = '#ecd09a', R0 = rnd(seed), i, j, h = 32;
    c.save(); c.translate(x, y); c.rotate(rot);
    R(c, -h, -h, h * 2, h * 2, 2.4, M);
    for (j = 0; j < 8; j++) { var ry = -h + 4.6 + j * 7.9; Rn(c, -h + 2, ry - 2.6, h * 2 - 4, 1.6, 0.8, 'rgba(255,255,255,0.3)'); for (i = 0; i < 11; i++) dot(c, -h + 4 + i * 5.6, ry, 0.85, '#c29a5c'); }
    for (i = 0; i < 20; i++) { var bx = (R0() - 0.5) * (h * 2 - 8), by = -h + 4.6 + Math.floor(R0() * 8) * 7.9 + (R0() - 0.5) * 3; c.beginPath(); c.ellipse(bx, by, 1.4 + R0() * 2.2, 0.9 + R0() * 1.1, R0() * 0.6 - 0.3, 0, TAU); c.fillStyle = 'rgba(150,84,30,' + (0.3 + R0() * 0.35).toFixed(2) + ')'; c.fill(); }
    c.restore();
  }
  Art.add('prop', 'matzah', function (c, t, p, o) {
    gsh(c, 44, 40);
    matzahSheet(c, 3, 4, -0.2, 'mz3'); matzahSheet(c, 3, 0, 0.13, 'mz2'); matzahSheet(c, -2, -3, -0.06, 'mz1');
  });

  /* A Kiddush cup: a silver wine goblet on its saucer, with a plain engraved vine band. No lettering. */
  Art.add('prop', 'kiddushcup', function (c, t, p, o) {
    var SV = '#cfd6e2', d = shade(SV, -0.3), l = shade(SV, 0.5), i, k = Math.exp(-5 * o.beat);
    gsh(c, 44, 36);
    E(c, 0, 39, 36, 6.5, SV); c.beginPath(); c.ellipse(0, 38.2, 26, 3.8, 0, 0, TAU); c.fillStyle = shade(SV, -0.12); c.fill();
    c.beginPath(); c.ellipse(-8, 37.6, 12, 1.2, 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fill();
    c.beginPath(); c.moveTo(-16, 37.5); c.quadraticCurveTo(-13, 28, -3.5, 26); c.lineTo(3.5, 26); c.quadraticCurveTo(13, 28, 16, 37.5); c.closePath(); F(c, SV);
    R(c, -3.2, 7, 6.4, 20, 2, SV); E(c, 0, 15, 7.6, 4.8, l); E(c, 0, 22.5, 5, 2.4, shade(SV, -0.1));
    c.beginPath(); c.moveTo(-22, -37); c.bezierCurveTo(-22, -8, -12, 8, 0, 8); c.bezierCurveTo(12, 8, 22, -8, 22, -37); c.closePath(); F(c, SV);
    c.beginPath(); c.moveTo(11, 4); c.bezierCurveTo(18, -4, 20.4, -18, 20.6, -34); c.lineTo(15, -34); c.bezierCurveTo(15, -18, 13, -4, 7, 6); c.closePath(); c.fillStyle = 'rgba(60,70,100,0.16)'; c.fill();
    L(c, -21.2, -26, 21.2, -26, 0.9, d); L(c, -19.4, -12, 19.4, -12, 0.9, d);
    c.beginPath(); c.moveTo(-19, -19); for (i = 0; i < 4; i++) c.quadraticCurveTo(-19 + i * 9.5 + 4.75, i % 2 ? -14.5 : -23.5, -19 + (i + 1) * 9.5, -19); c.lineWidth = 0.9; c.strokeStyle = d; c.stroke();
    for (i = 0; i < 3; i++) { var gx = -9.5 + i * 9.5, gy = i % 2 ? -21.4 : -16.6; dot(c, gx - 1.4, gy, 1.25, d); dot(c, gx + 1.4, gy, 1.25, d); dot(c, gx, gy + 2.2, 1.25, d); dot(c, gx, gy - 2.2, 1.1, d); }
    c.beginPath(); c.moveTo(-16.5, -31); c.quadraticCurveTo(-16, -6, -8, 3); c.lineWidth = 2.8; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke();
    E(c, 0, -37, 22, 5.2, l); c.beginPath(); c.ellipse(0, -36.6, 18.6, 3.7, 0, 0, TAU); c.fillStyle = '#7a1436'; c.fill();
    c.beginPath(); c.ellipse(-5, -37.2, 7, 1.1, 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
    twinkle(c, 27, -42, 4.6 + k * 2 + Math.sin(t * 3) * 1.8, p.snow); twinkle(c, -31, -8, 3 + Math.cos(t * 3.4) * 1.3, p.snow);
  });

  /* A branch in spring: new leaves, white blossom, soft catkins and a butterfly. */
  Art.add('prop', 'springbranch', function (c, t, p, o) {
    var BR = '#7d5638', i, sw = Math.sin(t * 1.3) * 0.05,
      LV = [[-36, 24, -2.0, 11], [-27, 21, -0.5, 12], [-12, 13, -2.2, 12], [-5, 9, -0.3, 13], [10, -1, -2.3, 12], [17, -7, -0.2, 12], [29, -17, -2.5, 11], [36, -24, -0.4, 11], [-25, -4, -2.6, 10], [3, -22, -2.9, 9], [5, -24, -0.5, 9], [36, -5, 0.5, 10], [-22, 0, -0.6, 9]],
      FL = [[-19, 17, 6.4], [4, 2, 7], [24, -13, 6.4], [-26, -11, 5.4], [41, -7, 5.2]],
      CK = [[4, -31, -0.1], [-28, -16, -0.5], [45, -33, 0.7], [-33, 31, 0.5], [14, 6, 0.4]];
    c.beginPath(); c.moveTo(-18, 17); c.quadraticCurveTo(-24, 4, -27, -13); S(c, 2.4, BR);
    c.beginPath(); c.moveTo(6, 2); c.quadraticCurveTo(7, -14, 4, -28); S(c, 2.2, BR);
    c.beginPath(); c.moveTo(22, -12); c.quadraticCurveTo(32, -8, 41, -7); S(c, 2, BR);
    c.beginPath(); c.moveTo(-47, 30); c.bezierCurveTo(-22, 24, 4, 4, 44, -31); S(c, 4.2, BR);
    c.beginPath(); c.moveTo(-44, 28.4); c.bezierCurveTo(-22, 22.4, 2, 4, 30, -20); c.lineWidth = 1; c.strokeStyle = shade(BR, 0.3); c.stroke();
    for (i = 0; i < LV.length; i++) leaf(c, LV[i][0], LV[i][1], LV[i][3], LV[i][2] + sw * (i % 2 ? 1 : -1), i % 3 === 0 ? '#58b04a' : i % 3 === 1 ? '#7cc95a' : '#69bd50');
    for (i = 0; i < CK.length; i++) { E(c, CK[i][0], CK[i][1], 2.8, 4.4, '#f3eee4', CK[i][2]); dot(c, CK[i][0] - 0.7, CK[i][1] - 1, 1, '#fff'); }
    for (i = 0; i < FL.length; i++) { flower(c, FL[i][0], FL[i][1], FL[i][2], i % 2 ? '#ffe6ee' : '#ffffff', '#ffd54a', i * 0.8 + Math.sin(t * 1.2 + i) * 0.05); dot(c, FL[i][0], FL[i][1], FL[i][2] * 0.16, '#f39a2c'); }
    K.bfly(c, 22 + Math.sin(t * 0.9) * 6, -37 + Math.cos(t * 1.3) * 4, 7, p.accent, t, 1);
  });
});
