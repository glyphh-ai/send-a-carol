/* Send a Carol art pack: the sea cast (octopus, crab, whale, seahorse, sea turtle, merfolk, dolphin, puffin).
   Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var INK = '#2b2118', WHITE = '#fffdf7';

  /* ---------- shared pieces ---------- */
  /* a tapering limb along a cubic curve b = [x0,y0, x1,y1, x2,y2, x3,y3], w0 wide at the root, w1 at the rounded tip. Returns the points along it. */
  function taper(c, b, w0, w1, fill) {
    var n = 10, lf = [], rt = [], pts = [], i, s, q, x, y, dx, dy, d, w;
    for (i = 0; i <= n; i++) {
      s = i / n; q = 1 - s;
      x = q * q * q * b[0] + 3 * q * q * s * b[2] + 3 * q * s * s * b[4] + s * s * s * b[6];
      y = q * q * q * b[1] + 3 * q * q * s * b[3] + 3 * q * s * s * b[5] + s * s * s * b[7];
      dx = 3 * q * q * (b[2] - b[0]) + 6 * q * s * (b[4] - b[2]) + 3 * s * s * (b[6] - b[4]);
      dy = 3 * q * q * (b[3] - b[1]) + 6 * q * s * (b[5] - b[3]) + 3 * s * s * (b[7] - b[5]);
      d = Math.sqrt(dx * dx + dy * dy) || 1; w = (w0 + (w1 - w0) * s) / 2;
      lf.push([x - dy / d * w, y + dx / d * w]); rt.push([x + dy / d * w, y - dx / d * w]); pts.push([x, y, dx / d, dy / d]);
    }
    c.beginPath(); c.moveTo(lf[0][0], lf[0][1]);
    for (i = 1; i <= n; i++) c.lineTo(lf[i][0], lf[i][1]);
    c.quadraticCurveTo(pts[n][0] + pts[n][2] * w1 * 0.9, pts[n][1] + pts[n][3] * w1 * 0.9, rt[n][0], rt[n][1]);
    for (i = n - 1; i >= 0; i--) c.lineTo(rt[i][0], rt[i][1]);
    c.closePath(); F(c, fill);
    return pts;
  }
  /* a paddle (flipper or wing) from the shoulder; a = 0 hangs down, PI/2 points out to side s, PI points up (as K.arm). Returns its tip. */
  function flip(c, x, y, s, a, len, w, col) {
    c.save(); c.translate(x, y); c.rotate(-s * a);
    c.beginPath(); c.moveTo(-w * 0.5, 0); c.quadraticCurveTo(-s * w * 0.3 - w * 0.8, len * 0.75, 0, len); c.quadraticCurveTo(w * 0.8 - s * w * 0.3, len * 0.75, w * 0.5, 0); c.closePath(); F(c, col);
    c.restore();
    return [x + s * Math.sin(a) * len, y + Math.cos(a) * len];
  }
  function seg(c, x1, y1, x2, y2, w, col) { if (K.ow() > 0) L(c, x1, y1, x2, y2, w + K.ow() * 1.6, shade(col, -0.34)); L(c, x1, y1, x2, y2, w, col); }
  function blinks(m) { return frac(m.t * 0.31 + m.ph) < 0.035; }
  function eye1(c, x, y, r, m) { /* one eye, for a face seen from the side */
    if (blinks(m)) { c.beginPath(); c.arc(x, y - r * 0.2, r, 0.15 * PI, 0.85 * PI); c.lineWidth = r * 0.55; c.lineCap = 'round'; c.strokeStyle = INK; c.stroke(); }
    else { dot(c, x, y, r, INK); dot(c, x + r * 0.3, y - r * 0.38, r * 0.36, '#fff'); }
  }
  function sheen(c, x, y, rx, ry, rot, a) { c.fillStyle = 'rgba(255,255,255,' + (a || 0.22) + ')'; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fill(); }
  function ring(c, x, y, r, w, col) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  function glasses(c, x, y, dx, r, col) { ring(c, x - dx, y, r, 1.3, col); ring(c, x + dx, y, r, 1.3, col); L(c, x - dx + r, y - 0.6, x + dx - r, y - 0.6, 1.1, col); dot(c, x - dx - r * 0.35, y - r * 0.4, r * 0.22, 'rgba(255,255,255,0.7)'); dot(c, x + dx - r * 0.35, y - r * 0.4, r * 0.22, 'rgba(255,255,255,0.7)'); }
  function starfish(c, x, y, r, rot, col) { K.starPath(c, x, y, r, r * 0.5, 5, rot); F(c, col); dot(c, x, y, r * 0.16, shade(col, 0.4)); }

  /* ---------- octopus ---------- */
  var OCT = [['#f27f93', '#ffd9df'], ['#8f74dc', '#e4dbff'], ['#f59741', '#ffe3bd'], ['#f2c94c', '#fff3c4']];
  Art.add('character', 'octopus', function (c, m, p) {
    var v = m.v, col = OCT[v][0], pale = OCT[v][1], dk = shade(col, -0.16), rx = v === 1 ? 26 : v === 2 ? 31 : 28.5, ry = v === 1 ? 32 : v === 2 ? 27 : 29.5;
    var hx = m.sw * 2.5, hy = -33 - ry + m.k * 2.5, aa = K.armAngles(m, 1.75, 0.5), cu = m.sw * 4, wob = Math.sin(m.t * 2.4) * 1.2, i, s, q, tips = [];
    for (s = -1; s <= 1; s += 2) taper(c, [s * 16, -40, s * 44, -37, s * 47 + cu, 12, s * 33 + cu * 0.6, -9 - m.k * 4 + s * wob], 10, 3.4, dk); /* outer pair, tips curl up on the beat */
    for (s = -1; s <= 1; s += 2) { /* the two that are arms */
      var a = s < 0 ? aa[0] : aa[1], sx = s * 21, sy = -47, ln = 27, ex = sx + s * Math.sin(a) * ln, ey = sy + Math.cos(a) * ln;
      q = taper(c, [sx, sy, sx + s * Math.sin(a - 0.7) * ln * 0.5, sy + Math.cos(a - 0.7) * ln * 0.5, sx + s * Math.sin(a + 0.45) * ln * 0.9, sy + Math.cos(a + 0.45) * ln * 0.9, ex, ey], 10, 3.6, col);
      for (i = 3; i <= 9; i += 2) dot(c, q[i][0] + q[i][3] * s * 1.2, q[i][1] - q[i][2] * s * 1.2, 1.9 - i * 0.12, pale);
      tips.push([ex, ey]);
    }
    for (s = -1; s <= 1; s += 2) { /* middle pair */
      q = taper(c, [s * 11, -38, s * 15, -14, s * 31 + cu * 0.6, 5, s * 26 + cu, -3.5], 10.5, 3.6, col);
      for (i = 4; i <= 8; i += 2) dot(c, q[i][0], q[i][1], 1.9 - i * 0.1, pale);
    }
    for (s = -1; s <= 1; s += 2) taper(c, [s * 4.5, -36, s * 5, -18, s * 4 - cu * 0.3, -4, s * 12.5 + cu * 0.5, -2.8], 9.5, 4, shade(col, 0.07)); /* front pair */
    E(c, hx, hy, rx, ry, col);
    sheen(c, hx - rx * 0.4, hy - ry * 0.52, rx * 0.3, ry * 0.17, -0.5);
    if (v === 2) { dot(c, hx - 14, hy - 17, 3, dk); dot(c, hx - 4, hy - 22, 2.2, dk); dot(c, hx + 9, hy - 19, 3.4, dk); dot(c, hx + 18, hy - 10, 2.2, dk); dot(c, hx - 21, hy - 7, 1.8, dk); }
    if (v === 3) { var RG = [[-15, -17, 3.4], [-3, -22, 2.8], [10, -19, 3.6], [19, -8, 2.6], [-22, -5, 2.6], [3, -13, 2.2]]; for (i = 0; i < RG.length; i++) { dot(c, hx + RG[i][0], hy + RG[i][1], RG[i][2], '#e39a2c'); ring(c, hx + RG[i][0], hy + RG[i][1], RG[i][2], 1.3, '#3b6fe0'); } }
    if (v === 0) { dot(c, hx - 16, hy - 15, 1.6, pale); dot(c, hx - 10, hy - 20, 1.2, pale); dot(c, hx + 17, hy - 8, 1.4, pale); }
    K.eyes(c, hx, hy + 5, rx * 0.38, 3.6, m); K.blush(c, hx, hy + 12, rx * 0.62, 3.5);
    K.mouth(c, hx, hy + 14.5, 6, m, shade(col, -0.6));
    if (v === 0) K.bow(c, hx + 13, hy - ry * 0.86, 15, p.accent2);
    if (v === 1) { c.save(); c.translate(hx - 3, hy - ry + 2.5); c.rotate(-0.16 + m.sw * 0.04); E(c, 0, -5.5, 13, 6.5, WHITE); R(c, -13.5, -4, 27, 6, 3, p.accent2); L(c, -11, -1, 11, -1, 1, p.paper); c.restore(); }
    if (v === 2) for (i = 0; i < 2; i++) { /* maracas */
      c.save(); c.translate(tips[i][0], tips[i][1]); c.rotate((i ? 0.5 : -0.5) + m.sw * 0.7); seg(c, 0, 2, 0, -7, 2.2, '#b98250'); E(c, 0, -13, 5.6, 6.8, i ? p.accent2 : p.accent); L(c, -4.6, -12, 4.6, -12, 1.5, p.gold); dot(c, -1.8, -15.5, 1.3, 'rgba(255,255,255,0.6)'); c.restore();
    }
    if (v === 3) glasses(c, hx, hy + 5, rx * 0.38, 6.8, INK);
  }, { wide: 1.15, variants: ['coral with a bow', 'sailor', 'maracas', 'blue-ringed with glasses'] });

  /* ---------- crab ---------- */
  var CRB = ['#e9523f', '#3f86d8', '#f28a3a', '#a57be0'];
  function claw(c, x, y, ang, sz, snap, col, s) {
    var i;
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(sz, sz * s);
    for (i = -1; i <= 1; i += 2) { /* two curved fingers that open and shut */
      c.save(); c.translate(3, 0); c.rotate(i * snap * (i < 0 ? 1 : 0.6));
      c.beginPath(); c.moveTo(-3, i * 6.8); c.quadraticCurveTo(i < 0 ? 11 : 9, i * (i < 0 ? 12.5 : 9.5), i < 0 ? 18.5 : 15, i * 2.6); c.quadraticCurveTo(8, i * 2.4, 1, i * 0.4); c.closePath(); F(c, i < 0 ? col : shade(col, -0.1));
      c.restore();
    }
    E(c, 0, 0, 7.6, 7.4, col); dot(c, -1.5, -2.6, 2.1, shade(col, 0.38));
    c.restore();
  }
  Art.add('character', 'crab', function (c, m, p) {
    var v = m.v, col = CRB[v], dk = shade(col, -0.2), lt = shade(col, 0.34), rx = v === 3 ? 28 : v === 2 ? 27 : 35, ry = v === 3 ? 25 : v === 2 ? 19 : 22, by = -ry - 4 + m.k * 2;
    var aa = K.armAngles(m, 2.15, 0.42), i, s, h, a, snap = 0.12 + 0.6 * m.k;
    for (s = -1; s <= 1; s += 2) for (i = 2; i >= 0; i--) { /* six walking legs, stepping in turn */
      var st = ((i + (s > 0 ? 1 : 0)) % 2 ? 1 : -1) * m.sw * 2.6, kx = s * (rx + 4 + i * 5), ky = by + 5 - i * 3.5, fx = s * (rx + i * 9.5) + st;
      seg(c, s * (rx - 9), by + 7, kx, ky, 4.6, dk); seg(c, kx, ky, fx, -1.8, 3.6, dk);
    }
    if (v === 2) { /* the hermit's borrowed shell */
      var sc = '#f4e3c3', sl = '#d99b78', sx = -3 - m.sw * 1.5, sy = by - 20 - m.k * 1.5;
      E(c, sx, sy, 25, 21, sc); E(c, sx + 5, sy - 19, 16, 12.5, shade(sc, 0.25)); E(c, sx + 9, sy - 30, 8.5, 6.5, sc); E(c, sx + 11, sy - 36, 3.6, 3, sl);
      c.lineWidth = 1.6; c.strokeStyle = sl; c.lineCap = 'round';
      c.beginPath(); c.arc(sx - 2, sy + 2, 16, PI * 1.05, PI * 1.9); c.stroke(); c.beginPath(); c.arc(sx + 4, sy - 17, 9.5, PI * 1.1, PI * 1.9); c.stroke(); c.beginPath(); c.arc(sx - 4, sy + 6, 8, PI * 1.1, PI * 1.75); c.stroke();
      dot(c, sx - 13, sy - 9, 2.6, 'rgba(255,255,255,0.6)');
    }
    for (s = -1; s <= 1; s += 2) { /* claws: they snap on the beat */
      a = s < 0 ? aa[0] : aa[1];
      var big = v === 1 ? (s > 0 ? 1.75 : 0.8) : v === 3 ? 0.95 : 1.12, cc = v === 1 && s > 0 ? '#ffae4d' : col;
      h = K.arm(c, s * (rx - 8), by - ry * 0.5, s, a, 15, 5.8, col);
      claw(c, h[0], h[1], Math.atan2(Math.cos(a), s * Math.sin(a)) - s * 0.3, big, snap, cc, s);
    }
    E(c, 0, by, rx, ry, col);
    c.save(); c.clip(); c.fillStyle = lt; c.beginPath(); c.ellipse(0, by + ry * 1.05, rx * 0.86, ry * 0.62, 0, 0, TAU); c.fill(); c.restore();
    sheen(c, -rx * 0.42, by - ry * 0.55, rx * 0.26, ry * 0.16, -0.4);
    if (v === 0 || v === 1) { for (i = -2; i <= 2; i++) dot(c, i * rx * 0.3, by - ry * 0.74 + Math.abs(i) * 2.4, 1.5, dk); }
    if (v === 3) { dot(c, -14, by - 11, 2.6, WHITE); dot(c, 13, by - 13, 2, WHITE); dot(c, 18, by - 3, 1.5, WHITE); dot(c, -19, by - 1, 1.6, WHITE); K.leaf(c, -2, by - ry + 1, 15, -1.95 + m.sw * 0.18, '#3f9a5c'); K.leaf(c, 1, by - ry + 1, 12, -1.1 + m.sw * 0.22, '#57b36f'); }
    if (v === 3) { K.eyes(c, 0, by - 4, 9.5, 3.3, m); K.blush(c, 0, by + 4, 17, 3.3); K.mouth(c, 0, by + 8, 6, m, shade(col, -0.6)); }
    else {
      for (s = -1; s <= 1; s += 2) { /* eyes on stalks */
        var ex = s * 11 + m.sw * 1.6, ey = by - ry - 11 - m.k * 2.5;
        seg(c, s * 9, by - ry + 4, ex, ey + 3, 3.4, col);
        E(c, ex, ey, 7, 7.2, WHITE);
        if (blinks(m)) { c.beginPath(); c.arc(ex, ey - 0.6, 3.4, 0.15 * PI, 0.85 * PI); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke(); }
        else { dot(c, ex + s * 0.6, ey + 0.6, 3.5, INK); dot(c, ex + s * 0.6 + 1.2, ey - 0.7, 1.3, '#fff'); }
      }
      K.blush(c, 0, by + 2, rx * 0.56, 3.4); K.mouth(c, 0, by + 3, 7, m, shade(col, -0.6));
    }
  }, { wide: 1.3, variants: ['red crab', 'blue fiddler with one big claw', 'hermit crab in a shell', 'round lilac pebble crab'] });

  /* ---------- whale ---------- */
  var WHL = [['#4f93dc', '#e8f4ff'], ['#2c3040', '#f7f7f2'], ['#9db6c9', '#f0f5f8'], ['#f1f5fa', '#ffffff']];
  function spout(c, x, y, h, m) {
    var w = '#dff3ff', o = shade('#7fb6dc', -0.1), s;
    for (s = -1; s <= 1; s += 2) {
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 1.5, y - h * 1.15, x + s * (8 + m.k * 3), y - h + 4); c.lineCap = 'round';
      c.lineWidth = 5; c.strokeStyle = o; c.stroke(); c.lineWidth = 3.2; c.strokeStyle = w; c.stroke();
      c.lineWidth = K.ow(); E(c, x + s * (12 + m.k * 5), y - h + 10 - m.k * 2, 2.2, 2.9, w); E(c, x + s * (6 + m.k * 2), y - h - 3 - m.k * 4, 1.7, 2.2, w);
    }
    E(c, x, y - h - 5 - m.k * 4, 2.5, 3.2, w);
  }
  Art.add('character', 'whale', function (c, m, p) {
    var v = m.v, col = WHL[v][0], belly = WHL[v][1], dk = shade(col, v === 3 ? -0.1 : -0.18), w = v === 1 ? 40 : v === 3 ? 41 : 44, top = (v === 1 ? -66 : v === 3 ? -64 : -61) + m.k * 2;
    var hx = m.sw * 1.6, aa = K.armAngles(m, 1.3, 0.6), i, s;
    c.save(); c.translate(5, 0); c.scale(1.1, 1.1);
    c.save(); c.translate(-26, -30); c.rotate(-0.2 + m.sw * 0.2 + Math.sin(m.t * 2) * 0.05); /* the tail, up behind */
    E(c, -29, -40, 12, 5.5, col, 0.55); E(c, -9, -42, 12, 5.5, col, -0.55);
    taper(c, [0, 0, -14, -6, -22, -20, -19, -37], 20, 7, col);
    c.restore();
    if (v === 1) { c.beginPath(); c.moveTo(-18, top + 6); c.quadraticCurveTo(-12, top - 16, -4 + m.sw * 1.5, top - 24); c.quadraticCurveTo(-3, top - 8, 4, top + 5); c.closePath(); F(c, col); } /* the orca's tall fin */
    if (v === 2) { /* the narwhal's tusk */
      var tx = 23 + m.sw * 1.5, ty = top - 37;
      Pg(c, [[5, top + 9], [tx, ty], [16, top + 6]], '#fff3d1');
      for (i = 1; i < 6; i++) L(c, 5 + (tx - 5) * i / 6.4 + 2.6 * (1 - i / 6.4), top + 9 + (ty - top - 9) * i / 6.4 - 1, 16 + (tx - 16) * i / 6.4, top + 6 + (ty - top - 6) * i / 6.4 + 1.8, 0.9, '#d9b77c');
    }
    if (v === 3) E(c, hx * 0.4, top + 3, 18, 11, col); /* the beluga's round brow */
    for (s = -1; s <= 1; s += 2) flip(c, s * (w - 6), -27, s, s < 0 ? aa[0] : aa[1], 21, 12.5, dk);
    c.beginPath(); c.moveTo(0, top); c.bezierCurveTo(w * 0.9, top, w + 3, -40, w, -22); c.bezierCurveTo(w - 3, -1, -(w - 3), -1, -w, -22); c.bezierCurveTo(-(w + 3), -40, -w * 0.9, top, 0, top); c.closePath(); F(c, col);
    c.save(); c.clip();
    c.fillStyle = belly; c.beginPath(); c.ellipse(0, v === 1 ? -6 : -1, w * (v === 1 ? 0.6 : 0.84), v === 1 ? 27 : 19, 0, 0, TAU); c.fill();
    for (i = -3; i <= 3; i++) L(c, i * 7.5, -15 + Math.abs(i) * 1.6, i * 8.6, -1, 0.8, shade(belly, -0.16));
    if (v === 2) { var SP = [[-30, -40, 2], [-22, -50, 1.5], [-12, -54, 2.2], [26, -46, 1.8], [33, -36, 1.4], [18, -54, 1.3], [-36, -30, 1.4], [2, -55, 1.4]]; for (i = 0; i < SP.length; i++) dot(c, SP[i][0], SP[i][1] + m.k * 2, SP[i][2], dk); }
    if (v === 1) for (s = -1; s <= 1; s += 2) { c.fillStyle = belly; c.beginPath(); c.ellipse(hx + s * 21, -38.5 + m.k, 8.6, 6.4, s * 0.3, 0, TAU); c.fill(); }
    c.restore();
    sheen(c, -w * 0.42, top + 12, w * 0.24, 5, -0.35, v === 3 ? 0.6 : 0.2);
    if (v === 3) for (s = -1; s <= 1; s += 2) { c.beginPath(); c.arc(hx + s * 21, -38 + m.k, 5.5, PI * 1.15, PI * 1.85); c.lineWidth = 0.9; c.strokeStyle = shade(col, -0.2); c.stroke(); }
    K.eyes(c, hx, -37 + m.k, 21, v === 1 ? 3 : 2.9, m, v === 1 ? '#11131c' : INK); K.blush(c, hx, -29.5 + m.k, w * 0.63, 3.4);
    if (m.open > 0.12) K.mouth(c, hx, -27.5 + m.k, 8.5, m);
    else { c.beginPath(); c.moveTo(hx - 11, -27 + m.k); c.quadraticCurveTo(hx, -20 + m.k, hx + 11, -27 + m.k); c.lineWidth = 1.5; c.lineCap = 'round'; c.strokeStyle = v === 1 ? '#11131c' : shade(col, -0.62); c.stroke(); }
    spout(c, v === 1 ? 11 : v === 2 ? -9 : 2, top + 1.5, 13 + 12 * m.k + Math.sin(m.t * 3) * 1.5, m);
    c.restore();
  }, { wide: 1.3, variants: ['blue whale', 'orca', 'narwhal', 'beluga'] });

  /* ---------- seahorse (seen from the side, snout to the right) ---------- */
  var SEA = [['#f7b733', '#ffe9a6'], ['#f58fb0', '#ffdbe6'], ['#56b56b', '#dcf3c6'], ['#7f6fdc', '#dcd6ff']];
  Art.add('character', 'seahorse', function (c, m, p) {
    var v = m.v, col = SEA[v][0], pale = SEA[v][1], dk = shade(col, -0.18), fin = v === 2 ? '#8fd46a' : shade(col, 0.3), hx = 1 + m.sw * 2, hy = -76 + m.k * 2.5, i, q;
    var fl = Math.sin(m.t * 9) * 0.12 + m.sw * 0.16;
    c.save(); c.scale(1.14, 1.07);
    if (v === 2) { /* leafy: fronds instead of a fin */
      var LF = [[-9, -56, 2.75, 15], [-11, -44, 3.3, 16], [-6, -30, 2.8, 13], [10, -30, 0.5, 11], [hx - 8, hy - 5, -2.5, 13]];
      for (i = 0; i < LF.length; i++) K.leaf(c, LF[i][0], LF[i][1], LF[i][3], LF[i][2] + Math.sin(m.t * 2.2 + i) * 0.14 + m.sw * 0.12, i % 2 ? '#3f9a5c' : '#7ccb5e');
    } else {
      c.save(); c.translate(-9, -48); c.rotate(fl); Pg(c, [[2, -11], [-10, -13], [-15, -4], [-13, 6], [2, 9]], fin);
      for (i = 0; i < 4; i++) L(c, 0, -1, -9 - (i === 1 || i === 2 ? 3 : 0), -10 + i * 5, 0.7, shade(fin, -0.2)); c.restore();
    }
    q = taper(c, [1, -37, 13, -3, -20, 11, -15, -13 + m.sw * 1.6], 15, 4.4, col); /* the curled tail it stands on */
    for (i = 2; i <= 8; i += 2) L(c, q[i][0] - q[i][3] * 2.6, q[i][1] + q[i][2] * 2.6, q[i][0] + q[i][3] * 2.6, q[i][1] - q[i][2] * 2.6, 0.9, dk);
    seg(c, 0, -60, hx - 1, hy + 4, 12.5, col); /* neck */
    E(c, 2, -48, 13.5, 18, col, 0.12);
    c.fillStyle = pale; c.beginPath(); c.ellipse(7.5, -46.5, 7.4, 14.5, 0.12, 0, TAU); c.fill();
    for (i = 0; i < 5; i++) L(c, 3.2 - Math.abs(i - 2) * -0.6, -57 + i * 5.2, 13.6 - Math.abs(i - 2) * 1.3, -57 + i * 5.2, 0.8, shade(pale, -0.2));
    if (v === 0) { dot(c, -5, -55, 1.6, dk); dot(c, -7, -47, 1.9, dk); dot(c, -5, -39, 1.5, dk); }
    if (v === 1) { dot(c, -5, -55, 1.5, pale); dot(c, -7.5, -47, 1.8, pale); dot(c, -5, -39, 1.4, pale); dot(c, -2, -62, 1.2, pale); }
    if (v === 3) for (i = 0; i < 4; i++) L(c, -9.5 + Math.abs(i - 1.5) * 1.6, -57 + i * 6, -1.5, -58 + i * 6, 1.5, dk);
    var fa = m.wave ? 1.25 + Math.sin(m.t * 9) * 0.4 : 0.25 + m.sw * 0.5 + m.k * 0.2; /* the little fin that waves */
    c.save(); c.translate(-3, -60); c.rotate(fa); if (m.wave) c.scale(1.35, 1.35); Pg(c, [[1, -2.5], [-11, -6], [-14.5, 0], [-11, 6], [1, 2.5]], shade(fin, 0.15)); L(c, -2, 0, -12, -3, 0.6, shade(fin, -0.2)); L(c, -2, 0, -12.5, 2, 0.6, shade(fin, -0.2)); c.restore();
    for (i = -1; i <= 1; i++) Pg(c, [[hx - 5.5 + i * 4, hy - 7.5], [hx - 3.5 + i * 5.2, hy - 15.5 - (i === 0 ? 2.5 : 0) - m.k * 1.5], [hx - 1.5 + i * 4, hy - 7.5]], i ? dk : col); /* coronet */
    c.save(); c.translate(hx + 6.5, hy + 3); c.rotate(0.2 - m.open * 0.12); /* snout: it toots when it sings */
    R(c, 0, -3.3, 19, 6.6, 3.2, col); E(c, 19.5, 0, 3.3 + m.open * 0.9, 4.3 + m.open * 1.3, col);
    if (m.open > 0.12) dot(c, 20.6, 0, 1.3 + 1.7 * m.open, '#6a1d2a');
    c.restore();
    E(c, hx, hy, 11.8, 10.8, col);
    sheen(c, hx - 4, hy - 5.5, 4, 2.2, -0.5);
    eye1(c, hx + 3.8, hy - 1.2, 2.8, m);
    c.fillStyle = 'rgba(240,96,110,0.42)'; c.beginPath(); c.ellipse(hx + 6.5, hy + 5.2, 2.6, 1.8, 0, 0, TAU); c.fill();
    if (v === 1) K.bow(c, hx - 7.5, hy - 9, 12, p.accent2);
    if (v === 3) {
      c.save(); c.translate(hx - 1.5, hy - 9.5); c.rotate(-0.14 + m.sw * 0.04); R(c, -6.5, -14 - m.k, 13, 14, 1.6, '#2b2f4a'); Rn(c, -6.5, -5.2 - m.k * 0.4, 13, 3, 0, p.accent); R(c, -10.5, -1.5, 21, 3.4, 1.7, '#2b2f4a'); c.restore();
      K.bow(c, 7, -62.5, 10.5, p.accent);
    }
    c.restore();
  }, { wide: 0.82, variants: ['golden', 'pink with a bow', 'leafy green', 'dapper purple in a top hat'] });

  /* ---------- sea turtle ---------- */
  var TUR = [['#72c46f', '#3c8f5c', '#2f7448'], ['#86cfa3', '#c8873a', '#9a5f24'], ['#57c4c0', '#2f8f9a', '#22707a'], ['#a9ba63', '#84724a', '#5c5033']];
  Art.add('character', 'seaturtle', function (c, m, p) {
    var v = m.v, sk = TUR[v][0], sh = TUR[v][1], sd = TUR[v][2], baby = v === 2, hr = baby ? 19 : 15.5, hx = m.sw * 2.2, hy = (baby ? -59 : -76) + m.k * 2.5;
    var aa = K.armAngles(m, 1.15, 0.7), pl = '#f6e7b0', pd = shade(pl, -0.24), i, s, a;
    c.save(); if (baby) c.scale(0.78, 0.78);
    E(c, 0, -36, 31.5, 32.5, sh);
    for (i = 0; i < 12; i++) { a = i / 12 * TAU + 0.26; L(c, Math.cos(a) * 24.5, -36 + Math.sin(a) * 26, Math.cos(a) * 30.5, -36 + Math.sin(a) * 31.5, 1.1, sd); }
    c.beginPath(); c.ellipse(0, -36, 24.5, 26, 0, 0, TAU); c.lineWidth = 1.1; c.strokeStyle = sd; c.stroke();
    for (s = -1; s <= 1; s += 2) { E(c, s * 15, -4, 10.5, 5.2, sk, s * 0.25); dot(c, s * 19, -4.6, 1.2, shade(sk, -0.18)); dot(c, s * 15, -2.6, 1, shade(sk, -0.18)); }
    for (s = -1; s <= 1; s += 2) { /* big front flippers */
      a = s < 0 ? aa[0] : aa[1];
      flip(c, s * 23, -53, s, a, 27, 12.5, sk);
      dot(c, s * 23 + s * Math.sin(a) * 12 - 1.5, -53 + Math.cos(a) * 12, 1.4, shade(sk, -0.18)); dot(c, s * 23 + s * Math.sin(a) * 18 + 1.5, -53 + Math.cos(a) * 18, 1.2, shade(sk, -0.18));
    }
    E(c, 0, -34, 22, 26, pl);
    L(c, 0, -58, 0, -10, 0.9, pd);
    for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-20 + Math.abs(i - 1) * 3, -46 + i * 12); c.quadraticCurveTo(0, -43 + i * 12, 20 - Math.abs(i - 1) * 3, -46 + i * 12); c.lineWidth = 0.9; c.strokeStyle = pd; c.stroke(); }
    sheen(c, -9, -50, 6, 3, -0.4, 0.35);
    c.restore();
    if (v === 1) { /* a flower lei */
      var LC = [p.accent, WHITE, p.gold, WHITE, p.accent];
      for (i = -2; i <= 2; i++) K.flower(c, i * 7.6, -57 + (2 - Math.abs(i)) * 2.6 + m.k, 4.3, LC[i + 2], i % 2 ? p.accent : p.gold, i + m.t * 0.3);
    }
    E(c, hx, hy, hr, hr * 0.94, sk);
    dot(c, hx - hr * 0.42, hy - hr * 0.62, hr * 0.13, shade(sk, -0.16)); dot(c, hx + hr * 0.1, hy - hr * 0.74, hr * 0.16, shade(sk, -0.16)); dot(c, hx + hr * 0.55, hy - hr * 0.5, hr * 0.12, shade(sk, -0.16));
    K.eyes(c, hx, hy + 0.5, hr * 0.45, hr * 0.165, m); K.blush(c, hx, hy + hr * 0.42, hr * 0.68, hr * 0.19);
    K.mouth(c, hx, hy + hr * (v === 3 ? 0.66 : 0.52), hr * 0.34, m, shade(sk, -0.6));
    if (v === 1) K.flower(c, hx + 11, hy - 10, 5.2, p.accent, p.gold, m.t * 0.4);
    if (baby) { /* still wearing a bit of its egg */
      c.beginPath(); c.moveTo(hx - 16.5, hy - 8); var Z = [-12, -3, -8, -9, -3, -4, 2, -10, 7, -4, 12, -9, 16.5, -8];
      for (i = 0; i < Z.length; i += 2) c.lineTo(hx + Z[i], hy + Z[i + 1] - 2); c.arc(hx, hy - 8, 16.5, 0, PI, true); c.closePath(); F(c, '#fffaf0');
      dot(c, hx - 7, hy - 18, 1.6, '#e9dcc4'); dot(c, hx + 5, hy - 20, 1.2, '#e9dcc4');
    }
    if (v === 3) { /* the elder: glasses, brows and a moustache */
      for (s = -1; s <= 1; s += 2) { L(c, hx + s * 4, hy - 6.6, hx + s * 10.5, hy - 7.8, 1.9, '#f4f1ea'); c.save(); c.translate(hx + s * 4.6, hy + 6.6); c.rotate(s * 0.28 + s * m.k * 0.12); E(c, 0, 0, 5.4, 2.5, '#f4f1ea'); c.restore(); }
      glasses(c, hx, hy + 0.5, hr * 0.45, 5.2, p.gold);
    }
  }, { wide: 1.0, variants: ['green turtle', 'amber shell with a flower lei', 'hatchling in its eggshell', 'elder with glasses and a moustache'] });

  /* ---------- merfolk ---------- */
  var MSK = ['#b9774a', '#f6cfa8', '#e3ac7c', '#7c4a2d'], MHR = ['#221a18', '#8a4a22', '#f0c35a', '#2a1c1a'], MTL = ['#27b3a4', '#f28b30', '#c56ad8', '#3f6fd8'];
  Art.add('character', 'merfolk', function (c, m, p) {
    var v = m.v, sk = MSK[v], hr = MHR[v], tl = MTL[v], tlt = shade(tl, 0.38), tdk = shade(tl, -0.2), hx = m.sw * 2, hy = -79 + m.k * 2.2, aa = K.armAngles(m, 1.05, 0.7), i, s, q;
    var tx = 6 + m.sw * 2.5, ty = -8, fw = m.sw * 0.22 + Math.sin(m.t * 2.2) * 0.06, top = v === 0 ? p.accent : p.gold;
    if (v === 0) { /* long hair down the back */
      c.beginPath(); c.moveTo(hx - 13.5, hy - 5); c.bezierCurveTo(hx - 23, hy + 12, -21 + m.sw * 3, -54, -16 + m.sw * 4.5, -41); c.quadraticCurveTo(-8 + m.sw * 4, -45, 0, -39 + m.k); c.quadraticCurveTo(8 + m.sw * 4, -45, 16 + m.sw * 4.5, -41); c.bezierCurveTo(21 + m.sw * 3, -54, hx + 23, hy + 12, hx + 13.5, hy - 5); c.closePath(); F(c, hr);
    }
    c.save(); c.translate(tx, ty); c.rotate(fw); /* the fluke it stands on */
    for (s = -1; s <= 1; s += 2) {
      if (v === 0) { c.beginPath(); c.moveTo(0, -3); c.quadraticCurveTo(s * 12, -8, s * 21, 3); c.quadraticCurveTo(s * 10, 2, s * 2, 6); c.closePath(); F(c, tlt); }
      else if (v === 1) Pg(c, [[0, -4], [s * 20, 6], [s * 8, 4], [s * 2, 6]], shade(tl, 0.22));
      else if (v === 2) { E(c, s * 11, 1, 13, 6.2, tlt, s * 0.45); L(c, s * 3, 0, s * 19, 5, 0.7, tl); L(c, s * 3, -1, s * 17, -1, 0.7, tl); }
      else { E(c, s * 9, 2, 9.5, 6, p.gold, s * 0.25); L(c, s * 3, 1, s * 15, 3.5, 0.8, shade(p.gold, -0.25)); }
    }
    if (v === 2) E(c, 0, 4, 5, 6.5, tlt);
    c.restore();
    q = taper(c, [0, -49, -14, -31, 16, -25, tx, ty], 21.5, 6.5, tl);
    c.lineWidth = 0.9; c.strokeStyle = tlt; c.lineCap = 'round';
    for (i = 1; i <= 8; i++) for (s = -1; s <= 1; s += 2) { var sw_ = (10.5 - i * 0.85) * 0.45; if (i % 2 ? s < 0 : s > 0) { c.beginPath(); c.arc(q[i][0] + s * sw_ * 0.5, q[i][1], 2.3 - i * 0.1, 0.1 * PI, 0.9 * PI); c.stroke(); } }
    if (v === 3) for (i = 3; i <= 7; i += 2) L(c, q[i][0] - q[i][3] * (4.6 - i * 0.3), q[i][1] + q[i][2] * (4.6 - i * 0.3), q[i][0] + q[i][3] * (4.6 - i * 0.3), q[i][1] - q[i][2] * (4.6 - i * 0.3), 1.3, p.gold);
    R(c, -9, -65, 18, 19, 5, sk);
    c.beginPath(); c.moveTo(-10.6, -51); for (i = 0; i < 4; i++) c.arc(-7.95 + i * 5.3, -48.4, 2.65, PI, 0, true); c.lineTo(10.6, -51); c.closePath(); F(c, tlt); /* scalloped waist */
    if (v === 0 || v === 2) { R(c, -9.7, -62, 19.4, 8.4, 3.6, top); for (i = -1; i <= 1; i += 2) { L(c, i * 4.6, -60.5, i * 4.6, -55.2, 0.7, shade(top, -0.25)); L(c, i * 4.6, -60.5, i * 7.4, -55.8, 0.7, shade(top, -0.25)); L(c, i * 4.6, -60.5, i * 1.8, -55.8, 0.7, shade(top, -0.25)); } }
    else { for (i = -3; i <= 3; i++) dot(c, i * 2.6, -63.6 + (3 - Math.abs(i)) * 1.25, 1.15, v === 1 ? p.paper : p.gold); if (v === 1) E(c, 0, -57.2, 2.7, 2.4, p.accent2); else starfish(c, 0, -56.6, 3.4, 0, p.accent); }
    var hl = K.arm(c, -10, -61, -1, aa[0], 15, 4.4, sk, sk, 2.7); K.arm(c, 10, -61, 1, aa[1], 15, 4.4, sk, sk, 2.7);
    if (v === 3) { for (s = -1; s <= 1; s += 2) L(c, s * 10 - 2.2 + s * Math.sin(s < 0 ? aa[0] : aa[1]) * 5 * s, -61 + Math.cos(s < 0 ? aa[0] : aa[1]) * 5, s * 10 + 2.2 + Math.sin(s < 0 ? aa[0] : aa[1]) * 5, -61 + Math.cos(s < 0 ? aa[0] : aa[1]) * 5, 1.6, p.gold); }
    if (v === 3) { /* a little trident */
      c.save(); c.translate(hl[0], hl[1]); c.rotate(-0.1 + m.sw * 0.05); seg(c, 0, 16, 0, -27, 1.9, p.gold); seg(c, -6, -27, 6, -27, 1.7, p.gold);
      for (i = -1; i <= 1; i++) { seg(c, i * 6, -27, i * 6, -34 - (i ? 0 : 3), 1.7, p.gold); Pg(c, [[i * 6 - 2.2, -33.5 - (i ? 0 : 3)], [i * 6, -38.5 - (i ? 0 : 3)], [i * 6 + 2.2, -33.5 - (i ? 0 : 3)]], p.gold); }
      c.restore(); E(c, hl[0], hl[1], 2.7, 2.7, sk);
    }
    if (v === 1) { /* a conch to sing into */
      c.save(); c.translate(hl[0] - 1, hl[1] - 3); c.rotate(-0.5 + m.sw * 0.1); Pg(c, [[-6, 3], [7, -1], [5, 5]], '#f7d9c4'); E(c, -3, 0, 6, 4.8, '#f7d9c4'); E(c, -5.5, -3.2, 3.4, 2.6, '#f7d9c4'); c.fillStyle = '#f2a3a8'; c.beginPath(); c.ellipse(-2, 1.2, 3.2, 1.9, 0.2, 0, TAU); c.fill(); c.restore();
    }
    if (v === 2) for (s = -1; s <= 1; s += 2) E(c, hx + s * 13, hy - 9.5, 6.8, 6.8, hr);
    K.head(c, hx, hy, 13, sk, m);
    if (v === 1) { K.hairdo(c, hx, hy, 13, hr, 0); for (i = -1; i <= 1; i++) Pg(c, [[hx + i * 5 - 3, hy - 12], [hx + i * 6.5 + m.sw, hy - 19.5 - (i ? 0 : 1.5)], [hx + i * 5 + 3, hy - 12]], hr); }
    else if (v === 3) { K.hairdo(c, hx, hy, 13.4, hr, 1); c.beginPath(); c.arc(hx, hy + 1, 13.6, PI * 1.2, PI * 1.8); c.lineWidth = 2.2; c.strokeStyle = p.gold; c.stroke(); dot(c, hx, hy - 12.6, 2, p.accent2); }
    else K.hairdo(c, hx, hy, 13, hr, 0);
    if (v === 0) { starfish(c, hx + 9.5, hy - 9.5, 4.6, 0.3 + m.sw * 0.1, p.gold); for (s = -1; s <= 1; s += 2) dot(c, hx + s * 12.9, hy + 5.2, 1.3, p.paper); }
    if (v === 2) { for (i = -2; i <= 2; i++) dot(c, hx + i * 4, hy - 11.4 - (2 - Math.abs(i)) * 1.1, 1.25, p.paper); for (i = -2; i <= 2; i++) dot(c, i * 3, -64.2 + (2 - Math.abs(i)) * 1.3, 1.1, p.paper); }
  }, { wide: 0.95, variants: ['teal tail, long dark hair, a starfish clip', 'orange tail, a conch shell', 'violet fan tail, golden buns and pearls', 'royal blue tail, a circlet and a trident'] });

  /* ---------- dolphin ---------- */
  var DOL = [['#6fa9db', '#eef6ff'], ['#f4a7bf', '#fff0f4'], ['#46679a', '#dfe9f7'], ['#5ec9ba', '#effcf8']];
  function swimRing(c, y, a0, a1, p) {
    var i; c.lineCap = 'butt';
    c.beginPath(); c.ellipse(0, y, 24, 8.5, 0, a0, a1); c.lineWidth = 9.4; c.strokeStyle = shade(p.accent, -0.34); c.stroke(); c.lineWidth = 7.4; c.strokeStyle = p.accent; c.stroke();
    for (i = 0; i < 3; i++) { var b = a0 + (a1 - a0) * (0.12 + i * 0.3); c.beginPath(); c.ellipse(0, y, 24, 8.5, 0, b, b + (a1 - a0) * 0.16); c.lineWidth = 7.4; c.strokeStyle = WHITE; c.stroke(); }
    c.lineCap = 'round';
  }
  Art.add('character', 'dolphin', function (c, m, p) {
    var v = m.v, col = DOL[v][0], belly = DOL[v][1], dk = shade(col, -0.2), hx = m.sw * 2, top = -90 + m.k * 2.5, fy = -71 + m.k * 2.2, aa = K.armAngles(m, 1.1, 0.7), i, s, lng = v === 1;
    c.save(); c.translate(0, -8); c.rotate(m.sw * 0.14); for (s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(s * 14, -7, s * 22, 4); c.quadraticCurveTo(s * 10, 3.5, 0, 6.5); c.closePath(); F(c, dk); } c.restore(); /* flukes */
    c.beginPath(); c.moveTo(-9, -70); c.quadraticCurveTo(-25, -71, -33 + m.sw * 1.5, -59); c.quadraticCurveTo(-24, -57, -17, -43); c.closePath(); F(c, dk); /* back fin */
    if (v === 3) swimRing(c, -33 + m.k * 1.5, PI, TAU, p);
    for (s = -1; s <= 1; s += 2) flip(c, s * 17, -51, s, s < 0 ? aa[0] : aa[1], 23, 10.5, dk);
    c.beginPath(); c.moveTo(hx, top); c.bezierCurveTo(hx + 25, top, 26, -52, 19.5, -34); c.bezierCurveTo(14, -19, 9, -11, 5.5, -5); c.lineTo(-5.5, -5); c.bezierCurveTo(-9, -11, -14, -19, -19.5, -34); c.bezierCurveTo(-26, -52, hx - 25, top, hx, top); c.closePath(); F(c, col);
    c.save(); c.clip(); c.fillStyle = belly; c.beginPath(); c.ellipse(0, -27, 12.5, 29, 0, 0, TAU); c.fill();
    if (v === 2) { var SP = [[-17, -42, 1.6], [-15, -33, 1.2], [16, -45, 1.5], [15.5, -36, 1.2], [-12, -24, 1.1], [12, -26, 1.2], [-15, -82, 1.4], [14, -84, 1.2]]; for (i = 0; i < SP.length; i++) dot(c, SP[i][0], SP[i][1], SP[i][2], shade(col, 0.3)); }
    c.restore();
    sheen(c, hx - 9, top + 8, 7, 3.4, -0.5);
    dot(c, hx + 1, top + 4.5, 1.2, dk);
    if (v === 3) swimRing(c, -33 + m.k * 1.5, 0, PI, p);
    var by = fy + (lng ? 12.5 : 10.5), brx = lng ? 8 : 10.5, bry = lng ? 9.5 : 6.8; /* the beak */
    E(c, hx, by, brx, bry, shade(col, 0.3));
    if (m.open > 0.12) K.mouth(c, hx, by - 1, brx * 0.9, m);
    else { c.beginPath(); c.moveTo(hx - brx * 1.05, by - 2.2); c.quadraticCurveTo(hx, by + bry * 0.75, hx + brx * 1.05, by - 2.2); c.lineWidth = 1.3; c.lineCap = 'round'; c.strokeStyle = shade(col, -0.6); c.stroke(); }
    K.eyes(c, hx, fy, 11, 2.6, m); K.blush(c, hx, fy + 5.5, 16, 2.8);
    if (v === 1) K.flower(c, hx + 14.5, fy - 11.5, 5, p.accent2, p.gold, m.t * 0.4);
    if (v === 2) { /* a beach ball kept up on the nose, bumped on the beat */
      var bx = hx + m.sw * 3, bb = top - 9 - (1 - m.k) * 4.5 * clamp(m.e, 0.3, 1), cols = [p.accent, p.gold, p.accent2];
      E(c, bx, bb, 9, 9, p.paper); c.save(); c.clip();
      for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(bx, bb); c.arc(bx, bb, 12, m.t * 1.2 + i * TAU / 3, m.t * 1.2 + i * TAU / 3 + TAU / 6); c.closePath(); c.fillStyle = cols[i]; c.fill(); }
      c.restore(); dot(c, bx, bb, 2, p.paper); K.shine(c, bx - 4, bb - 4.5, 2.6);
    }
  }, { wide: 0.95, variants: ['bottlenose', 'pink river dolphin with a flower', 'spotted navy with a beach ball', 'mint in a swim ring'] });

  /* ---------- puffin ---------- */
  Art.add('character', 'puffin', function (c, m, p) {
    var v = m.v, baby = v === 2, bk = baby ? '#8b91a3' : '#272b38', wh = '#f7f4ec', or = v === 3 ? '#f0552b' : '#f47b2a', hx = m.sw * 1.8, hy = (baby ? -67 : -71) + m.k * 2.2, hr = baby ? 20 : 18.5;
    var aa = K.armAngles(m, 0.8, 0.75), i, s, W = baby ? 5 : v === 3 ? 10.5 : 9.5, Ln = baby ? 8 : v === 3 ? 18 : 17, bx = hx, byk = hy + 4.5, o = m.open > 0.12 ? m.open : 0;
    c.save(); if (baby) c.scale(0.86, 0.86);
    for (s = -1; s <= 1; s += 2) { E(c, s * 9.5 + m.sw, -3, 8.8, 3.9, baby ? '#6f6a78' : '#f58a2c', s * 0.15); L(c, s * 6.5 + m.sw, -3, s * 4 + m.sw, -1.4, 0.8, shade(baby ? '#6f6a78' : '#f58a2c', -0.3)); L(c, s * 12 + m.sw, -3, s * 15 + m.sw, -1.4, 0.8, shade(baby ? '#6f6a78' : '#f58a2c', -0.3)); }
    for (s = -1; s <= 1; s += 2) flip(c, s * 20, -50, s, s < 0 ? aa[0] : aa[1], 26, 11.5, shade(bk, -0.1));
    c.beginPath(); c.moveTo(0, -64); c.bezierCurveTo(24, -64, 27.5, -36, 25.5, -20); c.bezierCurveTo(23, -2, -23, -2, -25.5, -20); c.bezierCurveTo(-27.5, -36, -24, -64, 0, -64); c.closePath(); F(c, bk);
    c.save(); c.clip(); c.fillStyle = v === 3 ? shade(bk, 0.12) : baby ? '#d5d8e0' : wh; c.beginPath(); c.ellipse(0, -23, 17.5, 21, 0, 0, TAU); c.fill();
    if (baby) for (i = -2; i <= 2; i++) L(c, i * 5, -30 + Math.abs(i) * 1.5, i * 5 + 1.2, -26.5 + Math.abs(i) * 1.5, 0.8, '#b3b7c4');
    c.restore();
    E(c, hx, hy, hr, hr * 0.92, bk);
    c.save(); c.clip(); c.fillStyle = baby ? '#c3c7d2' : wh; c.beginPath(); c.ellipse(hx - 8.5, hy + 3.5, 9.6, 11.5, 0.15, 0, TAU); c.ellipse(hx + 8.5, hy + 3.5, 9.6, 11.5, -0.15, 0, TAU); c.fill(); c.fillRect(hx - 6, hy - 2, 12, 14); c.restore();
    if (baby) for (i = -1; i <= 1; i++) { c.save(); c.translate(hx + i * 3.5, hy - hr * 0.86); c.rotate(i * 0.5 + m.sw * 0.25); E(c, 0, -3.6, 2.6, 5, bk); c.restore(); }
    K.eyes(c, hx, hy + 1, 8.6, 2.3, m);
    if (!baby) for (s = -1; s <= 1; s += 2) { Pg(c, [[hx + s * 8.6 - 2.3, hy - 2.4], [hx + s * 8.6 + 2.3, hy - 2.4], [hx + s * 8.6, hy - 5.8]], '#4a4f60', true); L(c, hx + s * 11.6, hy + 1.6, hx + s * 15, hy + 2.6, 0.8, '#4a4f60'); }
    K.blush(c, hx, hy + 6.5, 13.5, 2.6);
    if (o) { Pg(c, [[bx - W * 0.7, byk + 2], [bx + W * 0.7, byk + 2], [bx, byk + Ln * 0.72 + o * 6]], '#6a1d2a'); Pg(c, [[bx - W * 0.55, byk + Ln * 0.4 + o * 4], [bx + W * 0.55, byk + Ln * 0.4 + o * 4], [bx, byk + Ln * 0.78 + o * 6.5]], shade(or, -0.15)); }
    var ln = o ? Ln * 0.74 : Ln;
    c.beginPath(); c.moveTo(bx - W, byk); c.quadraticCurveTo(bx, byk - 4.5, bx + W, byk); c.quadraticCurveTo(bx + W * 0.62, byk + ln * 0.72, bx, byk + ln); c.quadraticCurveTo(bx - W * 0.62, byk + ln * 0.72, bx - W, byk); c.closePath(); F(c, baby ? '#4b4f5e' : or);
    if (!baby) {
      c.save(); c.clip();
      if (v !== 3) { c.fillStyle = '#56698c'; c.fillRect(bx - W - 1, byk - 6, W * 2 + 2, 6 + ln * 0.2); c.fillStyle = '#ffd84a'; c.fillRect(bx - W - 1, byk + ln * 0.2, W * 2 + 2, ln * 0.1); c.fillStyle = '#e2452c'; c.fillRect(bx - W - 1, byk + ln * 0.66, W * 2 + 2, ln * 0.4); }
      else { c.fillStyle = '#f6c443'; c.fillRect(bx - W - 1, byk - 6, W * 2 + 2, 6 + ln * 0.2); }
      c.fillStyle = 'rgba(255,255,255,0.28)'; c.fillRect(bx - W * 0.5, byk - 6, W * 0.32, ln + 6);
      c.restore();
      for (s = -1; s <= 1; s += 2) dot(c, bx + s * (W + 0.4), byk + 0.6, 1.7, '#ffc83d');
    }
    if (v === 1 && !o) for (i = -1; i <= 1; i += 2) { /* the catch of the day: a little fish hanging out of each side of the beak */
      c.save(); c.translate(bx + i * (W * 0.62), byk + Ln * 0.42); c.rotate(-i * 0.5 + Math.sin(m.t * 5 + i) * 0.14 + m.sw * 0.1);
      Pg(c, [[-2.6, 13.5], [2.6, 13.5], [0, 9.5]], '#8fb4d0'); E(c, 0, 5.5, 3, 6.2, '#cfe6f5'); L(c, -1.6, 4, 1.6, 4, 0.6, '#8fb4d0'); L(c, -1.4, 6.5, 1.4, 6.5, 0.6, '#8fb4d0'); dot(c, 0.6, 1.8, 0.8, INK);
      c.restore();
    }
    if (v === 1) { /* yellow sou'wester */
      var yc = '#ffcf33'; c.save(); c.translate(hx, hy - hr * 0.6); c.rotate(-0.05 + m.sw * 0.03);
      E(c, 0, 1.5, 24, 5.6, shade(yc, -0.12)); c.beginPath(); c.arc(0, 0, 14.5, PI, TAU); c.quadraticCurveTo(0, 5, -14.5, 0); c.closePath(); F(c, yc); L(c, 0, -14, 0, -1, 0.8, shade(yc, -0.25)); L(c, -7.5, -12, -8.5, -0.5, 0.8, shade(yc, -0.25)); L(c, 7.5, -12, 8.5, -0.5, 0.8, shade(yc, -0.25));
      c.restore();
    }
    if (v === 3) for (s = -1; s <= 1; s += 2) taper(c, [hx + s * 12, hy - 5, hx + s * 23, hy - 13, hx + s * 29 + m.sw * 2, hy + 1, hx + s * 25 + m.sw * 3.5, hy + 13 - m.k * 2], 5.4, 1.6, '#f6d46b'); /* the tufted puffin's plumes */
    c.restore();
  }, { wide: 0.92, variants: ['puffin', 'fisher in a yellow rain hat', 'grey puffling chick', 'tufted puffin'] });
});
