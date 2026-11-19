/* Send a Carol art pack: far-away places (a desert, a road-trip highway, a beach, a tropical island, a coral reef,
   deep space, a moon base, a kingdom on the clouds, a storybook castle, a pirate cove). Blocks only come in through
   CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, dot = K.dot, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd,
    vgrad = K.vgrad, glow = K.glow, skyStars = K.skyStars, hill = K.hill, moonDisc = K.moonDisc, cloud = K.cloud, twinkle = K.twinkle, leaf = K.leaf, bloom = K.bloom, flame = K.flame;

  /* ---------- shared pieces ---------- */
  /* the size unit of the scenery: 1% of the width on a tall card, a little smaller on a square one so tall things still fit */
  function unit(W, H) { return Math.min(W, H * 0.72) / 100; }
  function quad(c, x1, y1, x2, y2, x3, y3, x4, y4, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.lineTo(x4, y4); c.closePath(); c.fillStyle = col; c.fill(); }
  function el(c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = col; c.fill(); }
  function ring(c, x, y, r, lw, col) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); }
  function poly(c, pts, col) { Pg(c, pts, col, true); }
  /* draw what follows k times bigger about (x, y); the caller ends it with c.restore() */
  function zoom(c, x, y, k) { c.save(); c.translate(x, y); c.scale(k, k); c.translate(-x, -y); }
  /* a closed soft shape through the points */
  function blob(c, pts, col) {
    var n = pts.length, i, a = pts[n - 1], b = pts[0];
    c.beginPath(); c.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    for (i = 0; i < n; i++) { a = pts[i]; b = pts[(i + 1) % n]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    c.closePath(); c.fillStyle = col; c.fill();
  }
  /* the sky of a time of day, from the palette; returns its lowest colour (the haze far things fade into) */
  function sky(c, W, H, p, v, hz) {
    var st;
    if (v === 'night') st = [mix(p.bg, '#04051a', 0.62), mix(p.bg, '#0b0f3a', 0.32), mix(p.bg, p.bg2, 0.5), mix(mix(p.bg, p.bg2, 0.8), p.accent, 0.1)];
    else if (v === 'dusk') st = [mix(p.bg, '#23164f', 0.34), mix(p.bg, '#6a3a7a', 0.12), mix(p.bg, '#ff7f66', 0.5), mix(p.bg2, '#ffb37a', 0.62), mix(p.bg2, '#ffe6b0', 0.72)];
    else st = [shade(p.bg, -0.07), p.bg, mix(p.bg, p.bg2, 0.5), mix(p.bg2, '#ffffff', 0.3)];
    vgrad(c, W, H, st, 0, hz);
    return st[st.length - 1];
  }
  /* what the time of day does to a thing's own colour */
  function tinter(p, v) {
    var nightC = mix(p.bg, '#0a0c2c', 0.45), duskC = mix(p.accent, '#ff9056', 0.6);
    return function (col, k) { if (v === 'night') return mix(col, nightC, k == null ? 0.52 : k); if (v === 'dusk') return mix(mix(col, duskC, 0.2), '#3a2050', 0.1); return col; };
  }
  function sunDisc(c, x, y, r, t, col, rays) {
    var i; glow(c, x, y, r * 4.6, col, 0.5);
    if (rays) { c.save(); c.translate(x, y); c.rotate(t * 0.1); c.fillStyle = alpha(col, 0.42); for (i = 0; i < 14; i++) { c.rotate(TAU / 14); c.beginPath(); c.moveTo(-r * 0.16, -r * 1.25); c.lineTo(r * 0.16, -r * 1.25); c.lineTo(0, -r * (1.9 + (i % 2) * 0.5)); c.closePath(); c.fill(); } c.restore(); }
    dot(c, x, y, r, col); dot(c, x - r * 0.22, y - r * 0.22, r * 0.62, 'rgba(255,255,255,0.22)');
  }
  function clouds(c, W, t, seed, n, y0, y1, w0, w1, col, speed) {
    var R0 = rnd(seed + 'cl'), i;
    for (i = 0; i < n; i++) { var w = w0 + R0() * (w1 - w0), x = frac(R0() + t * (speed || 0.005) * (1 + i * 0.3)) * (W + w * 2) - w, y = y0 + R0() * (y1 - y0); cloud(c, x, y, w, col); }
  }
  function streaks(c, W, t, seed, n, y0, y1, u, col) { /* long thin evening clouds */
    var R0 = rnd(seed + 'sk'), i;
    for (i = 0; i < n; i++) { var w = u * (22 + R0() * 26), x = frac(R0() + t * 0.003 * (1 + i * 0.4)) * (W + w * 2) - w, y = y0 + R0() * (y1 - y0); c.fillStyle = alpha(col, 0.16 + R0() * 0.16); c.beginPath(); c.ellipse(x, y, w, u * (1.4 + R0() * 1.6), 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + w * 0.3, y - u * 1.4, w * 0.55, u * 1.3, 0, 0, TAU); c.fill(); }
  }
  function gull(c, x, y, s, t, ph, col) {
    var f = Math.sin(t * 5 + ph) * 0.3;
    c.beginPath(); c.moveTo(x - s, y - s * (0.2 + f)); c.quadraticCurveTo(x - s * 0.45, y - s * (0.6 + f * 0.5), x, y); c.quadraticCurveTo(x + s * 0.45, y - s * (0.6 + f * 0.5), x + s, y - s * (0.2 + f));
    c.lineWidth = s * 0.17; c.lineCap = 'round'; c.strokeStyle = col; c.stroke();
  }
  function gulls(c, W, H, t, u, col, y) { var i; for (i = 0; i < 3; i++) gull(c, W * (0.58 + i * 0.09) + Math.sin(t * 0.3 + i * 2) * u * 5, y + (i % 2) * u * 4 + Math.cos(t * 0.5 + i) * u * 1.5, u * (1.9 - i * 0.3), t, i * 1.7, col); }
  function shootingStar(c, W, H, t, u, col, per, x0, y0) {
    var f = frac(t / per); if (f > 0.14) return; f = f / 0.14;
    var x = W * x0 + f * u * 30, y = H * y0 + f * u * 12, a = Math.sin(f * PI);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - u * 9, y - u * 3.6); c.lineWidth = u * 0.35; c.lineCap = 'round'; c.strokeStyle = alpha(col, 0.7 * a); c.stroke(); dot(c, x, y, u * 0.5, alpha(col, a));
  }
  /* water between y0 and y1 with drifting glints */
  function water(c, W, y0, y1, top, bot, t, seed, n, shim, u) {
    var g = c.createLinearGradient(0, y0, 0, y1), R0 = rnd(seed + 'wa'), i; g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0 + 1);
    for (i = 0; i < n; i++) { var d = R0(), y = y0 + (0.05 + d * d * 0.93) * (y1 - y0), w = u * (1.6 + d * d * 7) * (0.6 + R0() * 0.8), x = frac(R0() + t * 0.008 * (0.5 + d)) * (W + w * 2) - w; c.globalAlpha = 0.22 + 0.4 * (0.5 + 0.5 * Math.sin(t * (1 + R0() * 1.5) + i)); Rn(c, x - w / 2, y, w, Math.max(1, u * (0.16 + d * 0.3)), u * 0.2, shim); }
    c.globalAlpha = 1;
  }
  /* the sun's or moon's path of light on water */
  function glitter(c, x, y0, y1, w0, w1, col, t, u) {
    var i; for (i = 0; i < 11; i++) { var f = (i + 0.5) / 11, w = (w0 + (w1 - w0) * f) * (0.55 + 0.45 * Math.sin(t * 2.2 + i * 1.9)); c.globalAlpha = 0.6 * (1 - f * 0.45); Rn(c, x - w / 2 + Math.sin(t * 1.3 + i) * u * 0.6, y0 + f * (y1 - y0), w, u * (0.3 + f * 0.45), u * 0.3, col); }
    c.globalAlpha = 1;
  }
  /* a palm: foot at (x, y), h tall, leaning by lean * h */
  function palm(c, x, y, h, lean, t, ph, trunk, lf) {
    var tx = x + lean * h, ty = y - h, cx = x + lean * h * 0.1, cy = y - h * 0.62, i, k, n = 11, sw = Math.sin(t * 0.9 + ph) * 0.045, px = x, py = y;
    for (i = 1; i <= n; i++) { var f = i / n, qx = (1 - f) * (1 - f) * x + 2 * (1 - f) * f * cx + f * f * tx, qy = (1 - f) * (1 - f) * y + 2 * (1 - f) * f * cy + f * f * ty; L(c, px, py, qx, qy, h * (0.058 - 0.026 * f), i % 2 ? trunk : shade(trunk, -0.14)); px = qx; py = qy; }
    for (i = 0; i < 7; i++) { /* back fronds first, the upright ones last */
      var j = [0, 6, 1, 5, 2, 4, 3][i], a = -PI / 2 + (j - 3) * 0.56 + sw * (1 + Math.abs(j - 3) * 0.4), len = h * (0.4 - Math.abs(j - 3) * 0.012), col = i < 2 ? shade(lf, -0.2) : i % 2 ? lf : shade(lf, -0.1),
        ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len + len * 0.42, mx = tx + Math.cos(a) * len * 0.5, my = ty + Math.sin(a) * len * 0.5 - len * 0.2;
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx, my - len * 0.12, ex, ey); c.quadraticCurveTo(mx + len * 0.02, my + len * 0.2, tx, ty); c.fillStyle = col; c.fill();
      c.strokeStyle = col; c.lineWidth = len * 0.035; c.lineCap = 'round'; c.beginPath();
      for (k = 2; k <= 7; k++) { var g = k / 8, bx = (1 - g) * (1 - g) * tx + 2 * (1 - g) * g * mx + g * g * ex, by = (1 - g) * (1 - g) * ty + 2 * (1 - g) * g * (my + len * 0.04) + g * g * ey; c.moveTo(bx, by); c.lineTo(bx - Math.cos(a) * len * 0.03, by + len * (0.2 - 0.1 * g)); }
      c.stroke();
    }
    dot(c, tx - h * 0.02, ty + h * 0.022, h * 0.026, shade(trunk, -0.3)); dot(c, tx + h * 0.024, ty + h * 0.03, h * 0.026, shade(trunk, -0.22)); dot(c, tx, ty + h * 0.004, h * 0.022, shade(trunk, -0.1));
  }
  function rock(c, x, y, w, h, col) { blob(c, [[x - w * 0.5, y], [x - w * 0.46, y - h * 0.8], [x - w * 0.05, y - h * 1.1], [x + w * 0.42, y - h * 0.75], [x + w * 0.5, y]], col); blob(c, [[x - w * 0.34, y - h * 0.3], [x - w * 0.3, y - h * 0.78], [x - w * 0.02, y - h * 0.95], [x + w * 0.1, y - h * 0.5]], shade(col, 0.14)); }
  function grassTuft(c, x, y, s, col, t, ph) { var i, sw = Math.sin(t * 1.3 + ph) * 0.12; c.strokeStyle = col; c.lineWidth = s * 0.16; c.lineCap = 'round'; c.beginPath(); for (i = -2; i <= 2; i++) { c.moveTo(x + i * s * 0.14, y); c.quadraticCurveTo(x + i * s * 0.2, y - s * 0.6, x + (i * 0.42 + sw) * s, y - s * (1 - Math.abs(i) * 0.18)); } c.stroke(); }
  function tikiTorch(c, x, y, h, u, t, ph, lit, col) { /* a bamboo torch; lit: a flame and its glow */
    Rn(c, x - u * 0.4, y - h, u * 0.8, h, u * 0.3, col); Rn(c, x - u * 0.4, y - h * 0.5, u * 0.8, u * 0.3, 0, shade(col, -0.25));
    poly(c, [[x - u * 1.2, y - h - u * 2.2], [x + u * 1.2, y - h - u * 2.2], [x + u * 0.6, y - h + u * 0.2], [x - u * 0.6, y - h + u * 0.2]], shade(col, -0.2));
    if (lit) { glow(c, x, y - h - u * 3.4, u * 11, '#ffc46a', 0.4 + 0.06 * Math.sin(t * 7 + ph)); flame(c, x, y - h - u * 2, u * 2, u * 4.2, t, ph); }
  }

  /* ---------- desert: mesas, saguaros and dunes ---------- */
  function mesa(c, x, base, w, h, col) {
    poly(c, [[x - w * 0.64, base], [x - w * 0.5, base - h * 0.34], [x - w * 0.4, base - h * 0.42], [x - w * 0.36, base - h * 0.93], [x - w * 0.3, base - h], [x + w * 0.28, base - h], [x + w * 0.34, base - h * 0.9], [x + w * 0.38, base - h * 0.45], [x + w * 0.52, base - h * 0.36], [x + w * 0.66, base]], col);
    poly(c, [[x + w * 0.1, base - h], [x + w * 0.28, base - h], [x + w * 0.34, base - h * 0.9], [x + w * 0.38, base - h * 0.45], [x + w * 0.52, base - h * 0.36], [x + w * 0.66, base], [x + w * 0.2, base], [x + w * 0.16, base - h * 0.44]], shade(col, -0.12));
    Rn(c, x - w * 0.355, base - h * 0.8, w * 0.7, h * 0.06, 0, shade(col, 0.16)); Rn(c, x - w * 0.37, base - h * 0.62, w * 0.74, h * 0.035, 0, shade(col, -0.16));
  }
  function saguaro(c, x, y, h, col, fl, sway) {
    var w = h * 0.17, s, hi = shade(col, 0.2), dk = shade(col, -0.2);
    for (s = -1; s <= 1; s += 2) { /* arms */
      var ay = y - h * (s < 0 ? 0.4 : 0.54), ax = x + s * w * 1.45, up = h * (s < 0 ? 0.3 : 0.24);
      c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, ay); c.lineTo(ax - s * w * 0.3, ay); c.quadraticCurveTo(ax, ay, ax, ay - w * 0.3); c.lineTo(ax + sway * w, ay - up); c.lineWidth = w * 0.72; c.strokeStyle = s < 0 ? col : dk; c.stroke();
      c.beginPath(); c.moveTo(ax - w * 0.14, ay - w * 0.4); c.lineTo(ax - w * 0.14 + sway * w, ay - up); c.lineWidth = w * 0.12; c.strokeStyle = hi; c.stroke();
      dot(c, ax + sway * w, ay - up - w * 0.42, w * 0.22, fl); dot(c, ax + sway * w, ay - up - w * 0.42, w * 0.09, '#ffe27a');
    }
    Rn(c, x - w / 2, y - h, w, h + w * 0.2, w / 2, col); Rn(c, x + w * 0.14, y - h + w * 0.3, w * 0.36, h - w * 0.2, w * 0.18, dk);
    Rn(c, x - w * 0.3, y - h + w * 0.36, w * 0.13, h - w * 0.6, w * 0.06, hi); Rn(c, x - w * 0.04, y - h + w * 0.2, w * 0.07, h - w * 0.3, w * 0.03, alpha(hi, 0.5));
    for (s = -1; s <= 1; s++) { dot(c, x + s * w * 0.3, y - h - w * 0.04 + Math.abs(s) * w * 0.14, w * 0.2, fl); dot(c, x + s * w * 0.3, y - h - w * 0.04 + Math.abs(s) * w * 0.14, w * 0.08, '#ffe27a'); }
  }
  function pricklyPear(c, x, y, s, col, fl) {
    var pads = [[0, -0.5, 0.42, 0.56, 0], [-0.52, -1.1, 0.3, 0.42, -0.5], [0.46, -1.2, 0.34, 0.46, 0.4], [0.86, -1.9, 0.22, 0.3, 0.3], [-0.9, -1.72, 0.2, 0.27, -0.7]], i;
    for (i = 0; i < pads.length; i++) { var q = pads[i]; el(c, x + q[0] * s, y + q[1] * s, q[2] * s, q[3] * s, i % 2 ? shade(col, 0.1) : col, q[4]); el(c, x + q[0] * s - q[2] * s * 0.25, y + q[1] * s - q[3] * s * 0.2, q[2] * s * 0.5, q[3] * s * 0.6, alpha('#ffffff', 0.12), q[4]); }
    dot(c, x + 0.5 * s, y - 1.72 * s, s * 0.15, fl); dot(c, x - 0.66 * s, y - 1.5 * s, s * 0.14, fl); dot(c, x + 0.98 * s, y - 2.22 * s, s * 0.13, fl); dot(c, x - 0.05 * s, y - 1.1 * s, s * 0.14, fl);
  }
  Art.add('backdrop', 'desert', function (c, W, H, t, p, o, u) {
    u = unit(W, H);
    var v = o.variant, night = v === 'night', dusk = v === 'dusk', T = tinter(p, v), i, R0 = rnd(o.seed + 'de'), hz = H * 0.612,
      low = sky(c, W, H, p, v, hz), sand = T(mix('#ecc083', p.bg2, 0.3)), red = T(mix('#cf6f43', p.bg2, 0.16)), green = T(mix('#5f9a62', p.accent2, 0.4), 0.4), fl = T(p.accent, 0.2);
    if (night) { skyStars(c, W, H, 110, o.seed, t, hz * 0.96, p.snow); moonDisc(c, W * 0.2, H * 0.105, u * 6.2, mix(p.snow, '#fff0c4', 0.5)); shootingStar(c, W, H, t, u, p.snow, 9, 0.5, 0.06); }
    else if (dusk) { skyStars(c, W, H, 26, o.seed, t, H * 0.2, p.snow); sunDisc(c, W * 0.27, hz - u * 6, u * 9.5, t, mix(p.gold, '#ff8a4a', 0.4), 0); streaks(c, W, t, o.seed, 6, H * 0.26, H * 0.52, u, mix(p.accent, '#ffd0a0', 0.5)); }
    else { sunDisc(c, W * 0.8, H * 0.105, u * 6.5, t, mix(p.gold, '#fff3b0', 0.4), 1); clouds(c, W, t, o.seed, 4, H * 0.05, H * 0.3, u * 14, u * 26, alpha(p.snow, 0.85)); }
    var far = mix(red, low, 0.56), mid = mix(red, low, 0.24);
    mesa(c, W * 0.04, hz + u, u * 34, u * 13, far); mesa(c, W * 0.64, hz + u, u * 22, u * 8, far); mesa(c, W * 0.97, hz + u, u * 30, u * 15, far);
    poly(c, [[W * 0.4, hz + u], [W * 0.415, hz - u * 6], [W * 0.43, hz - u * 6.6], [W * 0.445, hz + u]], far); /* a far spire */
    hill(c, W, H, hz, u * 1, mix(sand, low, 0.4), o.seed + 'a', 0.6);
    mesa(c, W * 0.2, hz + u * 3, u * 26, u * 17, mid); mesa(c, W * 0.86, hz + u * 3.4, u * 20, u * 11, mid);
    var f0 = hill(c, W, H, hz + u * 2.6, u * 1.4, shade(sand, -0.16), o.seed + 'b', 0.7);
    for (i = 0; i < 5; i++) { var sx = W * [0.31, 0.43, 0.58, 0.7, 0.52][i]; saguaro(c, sx, f0(sx) + u * 0.6, u * (4.5 + R0() * 3), mix(green, low, 0.3), mix(fl, low, 0.3), 0); }
    var f1 = hill(c, W, H, H * 0.668, u * 2, shade(sand, -0.06), o.seed + 'c', 0.8), sw = Math.sin(t * 0.8) * 0.05;
    c.fillStyle = alpha('#000000', 0.1); c.beginPath(); c.ellipse(W * 0.07 + u * 7, f1(W * 0.07) + u * 1.2, u * 9, u * 1, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(W * 0.92 + u * 8, f1(W * 0.92) + u * 1.2, u * 10, u * 1.1, 0, 0, TAU); c.fill();
    saguaro(c, W * 0.07, f1(W * 0.07) + u * 1, u * 27, green, fl, sw); saguaro(c, W * 0.92, f1(W * 0.92) + u * 1, u * 33, shade(green, -0.06), fl, -sw);
    saguaro(c, W * 0.2, f1(W * 0.2) + u * 0.6, u * 11, shade(green, 0.06), fl, 0); rock(c, W * 0.79, f1(W * 0.79) + u * 1.2, u * 8, u * 3.6, shade(red, -0.05)); rock(c, W * 0.27, f1(W * 0.27) + u * 1.4, u * 5, u * 2.2, red);
    hill(c, W, H, H * 0.745, u * 2.4, shade(sand, 0.2), o.seed + 'd', 0.6); hill(c, W, H, H * 0.745 + u * 0.8, u * 2.4, sand, o.seed + 'd', 0.6); /* each dune has a bright crest */
    hill(c, W, H, H * 0.875, u * 2.2, shade(sand, 0.3), o.seed + 'e', 0.9); var f3 = hill(c, W, H, H * 0.875 + u * 0.9, u * 2.2, shade(sand, 0.1), o.seed + 'e', 0.9);
    c.strokeStyle = alpha(shade(sand, -0.3), 0.3); c.lineWidth = u * 0.3; c.lineCap = 'round'; /* wind ripples */
    for (i = 0; i < 22; i++) { var rx = R0() * W, ry = H * (0.76 + R0() * 0.23), rw = u * (4 + R0() * 7); c.beginPath(); c.moveTo(rx - rw, ry); c.quadraticCurveTo(rx, ry - u * (0.6 + R0()), rx + rw, ry); c.stroke(); }
    for (i = 0; i < 4; i++) { var yx = W * [0.04, 0.3, 0.95, 0.72][i], yy = H * [0.815, 0.79, 0.84, 0.8][i], ys = u * [7, 4, 8, 4.4][i]; el(c, yx + ys * 0.3, yy, ys * 0.9, ys * 0.12, alpha('#000000', 0.1)); grassTuft(c, yx, yy, ys, i % 2 ? shade(green, 0.12) : shade(green, -0.05), t, i * 2); grassTuft(c, yx + ys * 0.12, yy, ys * 0.7, shade(green, 0.24), t, i * 2 + 1); if (i % 2 === 0) { L(c, yx, yy - ys * 0.6, yx + ys * 0.06, yy - ys * 1.5, ys * 0.06, shade(green, -0.2)); el(c, yx + ys * 0.06, yy - ys * 1.56, ys * 0.14, ys * 0.3, T(p.paper, 0.3)); } } /* yuccas */
    var tx = frac(t * 0.018 + 0.2) * (W + u * 24) - u * 12, ty = H * 0.9 - Math.abs(Math.sin(t * 1.6)) * u * 1.6, tr = u * 2.6; /* a tumbleweed rolls through */
    c.save(); c.translate(tx, ty); c.rotate(t * 1.2); c.strokeStyle = T(mix('#a9793f', p.bg2, 0.2)); c.lineWidth = u * 0.28; for (i = 0; i < 6; i++) { c.rotate(TAU / 6 + 0.3); c.beginPath(); c.ellipse(tr * 0.12, 0, tr, tr * (0.5 + (i % 3) * 0.2), 0, 0, TAU); c.stroke(); } c.restore();
    el(c, W * 0.12, f3(W * 0.1) + u * 12.6, u * 12, u * 1.3, alpha('#000000', 0.1)); pricklyPear(c, W * 0.1, f3(W * 0.1) + u * 12.4, u * 8.4, shade(green, 0.06), fl); rock(c, W * 0.25, f3(W * 0.25) + u * 13, u * 9, u * 3.8, red);
    var bx = W * 0.9, by = f3(bx) + u * 12.5; /* a barrel cactus in flower */
    el(c, bx + u, by + u * 0.4, u * 11, u * 1.3, alpha('#000000', 0.1)); zoom(c, bx, by, 1.7);
    el(c, bx, by - u * 3, u * 4.4, u * 3.8, green); for (i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(bx, by - u * 3, Math.abs(i) * u * 1.9 + u * 0.2, u * 3.8, 0, 0, TAU); c.lineWidth = u * 0.22; c.strokeStyle = shade(green, i < 0 ? 0.2 : -0.18); c.stroke(); }
    bloom(c, bx, by - u * 6.8, u * 2.2, fl, t, 1); c.restore(); rock(c, W * 0.76, by + u * 0.6, u * 5, u * 2, shade(red, -0.08)); grassTuft(c, W * 0.74, by + u, u * 3.4, T(mix('#b99a4a', p.bg2, 0.2)), t, 2); grassTuft(c, W * 0.28, by - u * 2, u * 3, T(mix('#b99a4a', p.bg2, 0.2)), t, 4);
    if (night) glow(c, W * 0.2, H * 0.7, u * 60, mix(p.snow, p.bg2, 0.4), 0.1);
    if (dusk) glow(c, W * 0.27, hz, u * 70, mix(p.gold, '#ff8a4a', 0.5), 0.16);
  }, { variants: ['day', 'dusk', 'night'], stage: 'band-low' });

  /* ---------- highway: a road-trip road to the horizon ---------- */
  Art.add('backdrop', 'highway', function (c, W, H, t, p, o, u) {
    u = unit(W, H);
    var v = o.variant, dusk = v === 'dusk', T = tinter(p, v), i, k, s, R0 = rnd(o.seed + 'hw'), hz = H * 0.6, cx = W / 2, gh = H - hz,
      low = sky(c, W, H, p, v, hz), land = T(mix(mix('#cfc46c', p.accent2, 0.38), p.bg2, 0.16)), tar = T(mix('#585a6c', p.bg, 0.22)), wood = T(mix('#7a5236', p.ink, 0.2)), sunC = mix(p.gold, '#ff8a4a', 0.4);
    function hw(y) { return u * 0.7 + (y - hz) / gh * W * 0.47; }
    if (dusk) { skyStars(c, W, H, 24, o.seed, t, H * 0.2, p.snow); sunDisc(c, cx, hz - u * 3.5, u * 10, t, sunC, 0); streaks(c, W, t, o.seed, 6, H * 0.24, H * 0.5, u, mix(p.accent, '#ffd0a0', 0.5)); }
    else {
      sunDisc(c, W * 0.17, H * 0.1, u * 6.5, t, mix(p.gold, '#fff3b0', 0.4), 1);
      for (k = 0; k < 4; k++) for (i = 0; i < 3; i++) { /* rows of flat-bottomed clouds marching to the horizon */
        var cw = u * (26 - k * 5.5), ccx = frac(R0() + i / 3 + t * 0.004 * (4 - k) / 4) * (W + cw * 2) - cw, ccy = hz * (0.14 + k * 0.215) + R0() * u * 3;
        cloud(c, ccx, ccy, cw, alpha(p.snow, 0.9 - k * 0.1)); Rn(c, ccx - cw * 0.4, ccy + cw * 0.12, cw * 0.8, cw * 0.05, cw * 0.025, alpha(mix(p.bg, '#5a6a9a', 0.3), 0.18));
      }
    }
    for (k = 0; k < 2; k++) { /* two ranges, lowest where the road meets the sky */
      var rc = mix(T(mix('#7a86b8', p.bg, 0.4)), low, k ? 0.3 : 0.62), Rk = rnd(o.seed + 'mt' + k), n = 22;
      c.beginPath(); c.moveTo(0, hz + u * 2);
      for (i = 0; i <= n; i++) { var fx = i / n, edge = 0.25 + 1.5 * Math.abs(fx - 0.5); c.lineTo(fx * W, hz + u * 0.5 - u * (k ? 3 + Rk() * 5 : 6 + Rk() * 7) * edge * (i % 2 ? 1 : 0.62)); }
      c.lineTo(W, hz + u * 2); c.closePath(); c.fillStyle = rc; c.fill();
    }
    vgrad2(c, W, hz, H, mix(land, low, 0.35), land, shade(land, -0.14));
    hill(c, W, H, hz + gh * 0.1, u * 0.8, mix(shade(land, 0.1), low, 0.12), o.seed + 'f1', 0.5);
    var wx = W * 0.2, wy = hz + gh * 0.075, wh = u * 9; /* a far wind pump turning */
    L(c, wx - u * 1.3, wy, wx, wy - wh, u * 0.3, wood); L(c, wx + u * 1.3, wy, wx, wy - wh, u * 0.3, wood); L(c, wx - u * 0.7, wy - wh * 0.45, wx + u * 0.7, wy - wh * 0.45, u * 0.25, wood);
    c.save(); c.translate(wx, wy - wh); c.rotate(t * 0.7); for (i = 0; i < 8; i++) { c.rotate(TAU / 8); poly(c, [[0, 0], [-u * 0.5, -u * 2.8], [u * 0.5, -u * 2.8]], i % 2 ? T(p.paper) : T(shade(p.paper, -0.14))); } c.restore(); dot(c, wx, wy - wh, u * 0.5, wood);
    poly(c, [[wx + u * 0.3, wy - wh - u * 0.4], [wx + u * 3.4, wy - wh - u * 1.2], [wx + u * 3.4, wy - wh + u * 0.6]], T(p.accent));
    for (i = 0; i < 4; i++) { var bxs = W * [0.07, 0.33, 0.7, 0.93][i], bys = hz + gh * (0.07 + (i % 2) * 0.03); el(c, bxs, bys, u * (3 + i % 2), u * 1.5, T(mix(p.accent2, '#3f7a4a', 0.5), 0.45)); el(c, bxs + u * 2.4, bys + u * 0.3, u * 2, u * 1.1, T(mix(p.accent2, '#4f8a52', 0.5), 0.45)); }
    hill(c, W, H, hz + gh * 0.2, u * 1.2, shade(land, 0.05), o.seed + 'f2', 0.7);
    /* the road */
    quad(c, cx - hw(hz), hz, cx + hw(hz), hz, cx + hw(H) * 1.08, H, cx - hw(H) * 1.08, H, T(mix('#c9b98a', p.bg2, 0.3)));
    quad(c, cx - hw(hz), hz, cx + hw(hz), hz, cx + hw(H), H, cx - hw(H), H, tar);
    var g = c.createLinearGradient(0, hz, 0, H); g.addColorStop(0, alpha(low, 0.5)); g.addColorStop(0.35, alpha(low, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(cx - hw(hz), hz); c.lineTo(cx + hw(hz), hz); c.lineTo(cx + hw(H), H); c.lineTo(cx - hw(H), H); c.closePath(); c.fill();
    for (s = -1; s <= 1; s += 2) quad(c, cx + s * hw(hz) * 0.86, hz, cx + s * hw(hz) * 0.9, hz, cx + s * hw(H) * 0.9, H, cx + s * hw(H) * 0.86, H, alpha(T(p.paper), 0.85));
    for (k = 0; k < 10; k++) { /* the centre dashes come towards us */
      var f0 = frac(k / 10 + t * 0.03), z0 = f0 * f0, z1 = Math.min(1, (f0 + 0.05) * (f0 + 0.05)), y0 = hz + z0 * gh, y1 = hz + z1 * gh;
      quad(c, cx - hw(y0) * 0.02, y0, cx + hw(y0) * 0.02, y0, cx + hw(y1) * 0.02, y1, cx - hw(y1) * 0.02, y1, T(p.gold, 0.3));
    }
    var cy0 = hz + gh * 0.1, cs = u * 2.3, ccx2 = cx + hw(cy0) * 0.46, bob = Math.sin(t * 7) * u * 0.06; /* a little car, packed for the trip */
    el(c, ccx2, cy0 + cs * 0.1, cs * 1.25, cs * 0.25, alpha('#000000', 0.22));
    Rn(c, ccx2 - cs * 0.9, cy0 - cs * 0.3, cs * 0.34, cs * 0.44, cs * 0.1, '#22222c'); Rn(c, ccx2 + cs * 0.56, cy0 - cs * 0.3, cs * 0.34, cs * 0.44, cs * 0.1, '#22222c');
    Rn(c, ccx2 - cs, cy0 - cs * 0.95 + bob, cs * 2, cs * 0.85, cs * 0.22, T(p.accent, 0.3)); Rn(c, ccx2 - cs * 0.78, cy0 - cs * 1.55 + bob, cs * 1.56, cs * 0.8, cs * 0.24, T(shade(p.accent, -0.1), 0.3)); Rn(c, ccx2 - cs * 0.62, cy0 - cs * 1.42 + bob, cs * 1.24, cs * 0.5, cs * 0.14, dusk ? '#ffe9a8' : mix(p.bg, '#ffffff', 0.55));
    Rn(c, ccx2 - cs * 0.7, cy0 - cs * 2.05 + bob, cs * 0.8, cs * 0.5, cs * 0.08, T(p.gold, 0.3)); Rn(c, ccx2 + cs * 0.14, cy0 - cs * 1.92 + bob, cs * 0.56, cs * 0.37, cs * 0.08, T(p.accent2, 0.3)); L(c, ccx2 - cs * 0.8, cy0 - cs * 1.55 + bob, ccx2 + cs * 0.8, cy0 - cs * 1.55 + bob, cs * 0.08, '#3a3a44');
    for (s = -1; s <= 1; s += 2) { if (dusk) glow(c, ccx2 + s * cs * 0.74, cy0 - cs * 0.56, cs * 1.2, '#ff5040', 0.6); Rn(c, ccx2 + s * cs * 0.74 - cs * 0.16, cy0 - cs * 0.66 + bob, cs * 0.32, cs * 0.2, cs * 0.06, dusk ? '#ff6a50' : '#d8303a'); }
    /* a fence down the left, poles and wires down the right */
    var fs = [0.05, 0.075, 0.105, 0.145, 0.195, 0.255, 0.32], px = 0, py = 0;
    c.lineCap = 'round';
    for (i = 0; i < fs.length; i++) { var fy = hz + fs[i] * gh, fx2 = cx - hw(fy) * 1.75 - u * 1, fh = fs[i] * u * 26; if (i) { L(c, px, py - fs[i - 1] * u * 26 * 0.8, fx2, fy - fh * 0.8, Math.max(0.6, fh * 0.035), alpha(wood, 0.8)); L(c, px, py - fs[i - 1] * u * 26 * 0.45, fx2, fy - fh * 0.45, Math.max(0.6, fh * 0.035), alpha(wood, 0.8)); } px = fx2; py = fy; }
    for (i = 0; i < fs.length; i++) { fy = hz + fs[i] * gh; fx2 = cx - hw(fy) * 1.75 - u * 1; fh = fs[i] * u * 26; Rn(c, fx2 - fh * 0.06, fy - fh, fh * 0.12, fh, fh * 0.04, wood); }
    var ps = [0.04, 0.065, 0.1, 0.15, 0.215, 0.3], tops = [];
    for (i = 0; i < ps.length; i++) { var qy = hz + ps[i] * gh, qx = cx + hw(qy) * 2.35 + u * 2, qh = ps[i] * u * 125; tops.push([qx, qy - qh, qh]); }
    tops.push([W + u * 30, tops[5][1] - u * 22, u * 60]);
    c.strokeStyle = alpha(mix(wood, '#000000', 0.3), 0.75);
    for (i = 0; i < tops.length - 1; i++) for (s = -1; s <= 1; s += 2) { var a = tops[i], b = tops[i + 1], ax = a[0] + s * a[2] * 0.13, bx2 = b[0] + s * b[2] * 0.13; c.beginPath(); c.moveTo(ax, a[1] + a[2] * 0.05); c.quadraticCurveTo((ax + bx2) / 2, (a[1] + b[1]) / 2 + b[2] * 0.2, bx2, b[1] + b[2] * 0.05); c.lineWidth = Math.max(0.6, b[2] * 0.012); c.stroke(); }
    for (i = 0; i < ps.length; i++) { a = tops[i]; Rn(c, a[0] - a[2] * 0.022, a[1], a[2] * 0.044, a[2], 0, wood); Rn(c, a[0] - a[2] * 0.16, a[1] + a[2] * 0.045, a[2] * 0.32, a[2] * 0.035, 0, wood); Rn(c, a[0] - a[2] * 0.12, a[1] + a[2] * 0.14, a[2] * 0.24, a[2] * 0.03, 0, wood); for (s = -1; s <= 1; s += 2) dot(c, a[0] + s * a[2] * 0.13, a[1] + a[2] * 0.035, a[2] * 0.02, T(p.accent2, 0.3)); }
    /* a blank signpost on the left verge */
    var sy = hz + gh * 0.3, sx2 = Math.max(u * 9, cx - hw(sy) * 2.5), sh = u * 30;
    el(c, sx2 + u * 3, sy, u * 6, u * 0.8, alpha('#000000', 0.14)); Rn(c, sx2 - u * 0.6, sy - sh, u * 1.2, sh, u * 0.3, wood); Rn(c, sx2 - u * 0.6, sy - sh, u * 0.4, sh, u * 0.2, shade(wood, 0.2));
    var boards = [[1, T(p.accent, 0.3), 0, -0.04], [-1, T(p.paper, 0.3), 5.4, 0.05], [1, T(p.gold, 0.3), 10.6, 0.02]];
    for (i = 0; i < 3; i++) { var bd = boards[i], d = bd[0]; c.save(); c.translate(sx2, sy - sh + u * (3.6 + bd[2])); c.rotate(bd[3]); poly(c, [[-d * u * 5.5, -u * 2.1], [d * u * 6, -u * 2.1], [d * u * 9, 0], [d * u * 6, u * 2.1], [-d * u * 5.5, u * 2.1]], bd[1]); Rn(c, Math.min(-d * u * 4, d * u * 5), -u * 0.9, u * 9, u * 0.5, u * 0.25, alpha(p.ink, 0.28)); Rn(c, Math.min(-d * u * 4, d * u * 2), u * 0.3, u * 6, u * 0.5, u * 0.25, alpha(p.ink, 0.2)); dot(c, 0, 0, u * 0.5, shade(wood, -0.3)); c.restore(); }
    dot(c, sx2, sy - sh - u * 0.2, u * 1, wood);
    for (i = 0; i < 26; i++) { var gx = R0() < 0.5 ? R0() * W * 0.3 : W - R0() * W * 0.3, gy = hz + gh * (0.3 + R0() * 0.68), sc = (gy - hz) / gh; if (Math.abs(gx - cx) < hw(gy) * 1.15) continue; grassTuft(c, gx, gy, u * (1.4 + sc * 3.4), shade(land, i % 2 ? -0.22 : 0.16), t, i); if (i % 3 === 0) { dot(c, gx + u * sc * 2.4, gy - u * sc * 2.2, u * (0.4 + sc * 0.8), T(i % 2 ? p.accent : p.paper, 0.3)); dot(c, gx + u * sc * 2.4, gy - u * sc * 2.2, u * (0.15 + sc * 0.3), T(p.gold, 0.3)); } }
    var my = H * 0.975, mx = W - u * 9; /* a mile post */
    el(c, mx + u * 2, my + u * 0.4, u * 7, u * 1, alpha('#000000', 0.14)); zoom(c, mx, my, 1.7); c.translate(0, 0);
    Rn(c, mx - u * 1.6, my - u * 9, u * 3.2, u * 9.5, u * 1.5, T(p.paper, 0.35)); Rn(c, mx - u * 1.6, my - u * 6.6, u * 3.2, u * 1.4, 0, T(p.accent, 0.3)); dot(c, mx, my - u * 3.4, u * 0.7, T(p.gold, 0.2)); c.restore();
    if (dusk) { glow(c, cx, hz, u * 80, sunC, 0.2); var g2 = c.createLinearGradient(0, hz, 0, H); g2.addColorStop(0, alpha(sunC, 0.22)); g2.addColorStop(0.6, alpha(sunC, 0)); c.fillStyle = g2; c.fillRect(0, hz, W, gh); }
  }, { variants: ['day', 'dusk'], stage: 'band-low' });
  function vgrad2(c, W, y0, y1, a, b, d) { var g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(0.3, b); g.addColorStop(1, d); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); }

  /* ---------- beach ---------- */
  function sandcastle(c, x, y, s, col, flag, t) {
    var hi = shade(col, 0.14), dk = shade(col, -0.16), i, j;
    el(c, x, y, s * 1.5, s * 0.2, shade(col, -0.1));
    for (i = -1; i <= 1; i += 2) { Rn(c, x + i * s * 0.9 - s * 0.3, y - s * 1.1, s * 0.6, s * 1.1, s * 0.05, i < 0 ? hi : col); for (j = -1; j <= 1; j++) Rn(c, x + i * s * 0.9 + j * s * 0.24 - s * 0.09, y - s * 1.28, s * 0.18, s * 0.22, s * 0.03, i < 0 ? hi : col); Rn(c, x + i * s * 0.9 - s * 0.06, y - s * 0.8, s * 0.12, s * 0.26, s * 0.06, dk); }
    Rn(c, x - s * 0.7, y - s * 0.72, s * 1.4, s * 0.72, s * 0.04, col); for (j = -2; j <= 2; j++) Rn(c, x + j * s * 0.26 - s * 0.08, y - s * 0.86, s * 0.16, s * 0.18, s * 0.03, col);
    Rn(c, x - s * 0.36, y - s * 1.7, s * 0.72, s * 1.2, s * 0.05, hi); for (j = -1; j <= 1; j++) Rn(c, x + j * s * 0.27 - s * 0.1, y - s * 1.9, s * 0.2, s * 0.24, s * 0.03, hi);
    c.beginPath(); c.moveTo(x - s * 0.2, y); c.lineTo(x - s * 0.2, y - s * 0.34); c.arc(x, y - s * 0.34, s * 0.2, PI, 0); c.lineTo(x + s * 0.2, y); c.closePath(); c.fillStyle = dk; c.fill();
    Rn(c, x - s * 0.07, y - s * 1.36, s * 0.14, s * 0.3, s * 0.07, dk);
    L(c, x, y - s * 1.86, x, y - s * 2.7, s * 0.05, shade(col, -0.4)); var w = Math.sin(t * 4) * s * 0.06; poly(c, [[x, y - s * 2.7], [x + s * 0.5, y - s * 2.52 + w], [x, y - s * 2.32]], flag);
  }
  function starfish(c, x, y, r, col, rot) { K.starPath(c, x, y, r, r * 0.46, 5, rot); c.fillStyle = col; c.fill(); c.lineJoin = 'round'; c.lineWidth = r * 0.22; c.strokeStyle = col; c.stroke(); dot(c, x, y, r * 0.16, shade(col, 0.3)); }
  function shell(c, x, y, r, col) { var i; c.beginPath(); c.moveTo(x, y + r * 0.6); c.arc(x, y, r, PI * 0.9, PI * 0.1); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = shade(col, -0.2); c.lineWidth = r * 0.1; c.beginPath(); for (i = -2; i <= 2; i++) { c.moveTo(x, y + r * 0.5); c.lineTo(x + Math.sin(i * 0.5) * r * 0.9, y - Math.cos(i * 0.5) * r * 0.9); } c.stroke(); }
  function sailboat(c, x, y, s, hull, sail, sail2, t) {
    var r = Math.sin(t * 0.9) * 0.03; c.save(); c.translate(x, y); c.rotate(r);
    poly(c, [[-s, -s * 0.3], [s, -s * 0.3], [s * 0.7, s * 0.1], [-s * 0.75, s * 0.1]], hull); L(c, 0, -s * 0.3, 0, -s * 2.3, s * 0.07, shade(hull, -0.3));
    poly(c, [[s * 0.1, -s * 2.2], [s * 0.1, -s * 0.5], [s * 1.05, -s * 0.5]], sail); poly(c, [[-s * 0.1, -s * 1.9], [-s * 0.1, -s * 0.5], [-s * 0.8, -s * 0.5]], sail2); c.restore();
  }
  Art.add('backdrop', 'beach', function (c, W, H, t, p, o, u) {
    u = unit(W, H);
    var v = o.variant, night = v === 'night', dusk = v === 'dusk', T = tinter(p, v), i, k, R0 = rnd(o.seed + 'be'), hz = H * 0.5, sh = H * 0.668,
      low = sky(c, W, H, p, v, hz), sand = T(mix('#f1d59a', p.bg2, 0.3), 0.46), seaA = T(mix(mix('#2f9fd0', p.bg, 0.45), low, 0.25), 0.5), seaB = T(mix('#58d2c8', p.bg, 0.2), 0.5), lf = T(mix('#3f9a5a', p.accent2, 0.45), 0.45), trunk = T(mix('#9a6b42', p.bg2, 0.12), 0.45),
      lightC = night ? mix(p.snow, '#fff0c4', 0.5) : mix(p.gold, '#ff8a4a', 0.4), lx = W * 0.66;
    if (night) { skyStars(c, W, H, 100, o.seed, t, hz * 0.95, p.snow); moonDisc(c, lx, H * 0.12, u * 6.5, lightC); shootingStar(c, W, H, t, u, p.snow, 11, 0.3, 0.05); streaks(c, W, t, o.seed, 3, H * 0.2, H * 0.4, u, p.snow); }
    else if (dusk) { skyStars(c, W, H, 22, o.seed, t, H * 0.18, p.snow); sunDisc(c, lx, hz - u * 1.5, u * 9, t, lightC, 0); streaks(c, W, t, o.seed, 6, H * 0.2, H * 0.44, u, mix(p.accent, '#ffd0a0', 0.5)); }
    else { sunDisc(c, W * 0.8, H * 0.1, u * 6.5, t, mix(p.gold, '#fff3b0', 0.4), 1); clouds(c, W, t, o.seed, 5, H * 0.05, H * 0.36, u * 16, u * 30, alpha(p.snow, 0.92)); gulls(c, W, H, t, u, alpha(p.ink, 0.6), H * 0.3); }
    blob(c, [[W * 0.74, hz + u], [W * 0.8, hz - u * 3], [W * 0.9, hz - u * 5.5], [W * 1.02, hz - u * 7], [W * 1.1, hz + u]], mix(lf, low, 0.6)); /* a far headland */
    water(c, W, hz, sh + u * 4, seaA, seaB, t, o.seed, 46, alpha(p.snow, 0.9), u);
    if (!night || true) glitter(c, lx, hz + u * 0.6, sh - u * 2, u * 5, u * 22, mix(lightC, '#ffffff', 0.4), t, u);
    sailboat(c, W * 0.3 + Math.sin(t * 0.1) * u * 3, hz + u * 2.2, u * 3.2, T(p.accent, 0.35), T(p.paper, 0.3), T(p.gold, 0.3), t);
    for (i = 0; i < 3; i++) { /* long low rollers */
      var wy = hz + (sh - hz) * (0.45 + i * 0.2), ph = t * 0.7 + i * 2, k; c.beginPath(); c.moveTo(0, wy);
      for (k = 0; k <= 16; k++) c.lineTo(k / 16 * W, wy + Math.sin(k * 0.9 + ph) * u * 0.7); c.lineWidth = u * (0.4 + i * 0.25); c.strokeStyle = alpha(p.snow, night ? 0.22 : 0.42); c.stroke();
    }
    function edge(x, d) { return sh + Math.sin(x / W * 5.2 + 1) * u * 1.3 + Math.sin(x / W * 11 + 4) * u * 0.5 + d; }
    function shore(d, col) { var k2; c.beginPath(); c.moveTo(0, H); for (k2 = 0; k2 <= 24; k2++) c.lineTo(k2 / 24 * W, edge(k2 / 24 * W, d)); c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.fill(); }
    var wash = 0.5 + 0.5 * Math.sin(t * 0.9);
    shore(-u * (1.6 + wash * 1.6), alpha(p.snow, night ? 0.5 : 0.85)); shore(-u * (1 + wash * 1.2), alpha(seaB, 0.75)); shore(0, shade(sand, -0.17)); shore(u * 2, sand);
    var g = c.createLinearGradient(0, sh, 0, H); g.addColorStop(0, alpha(shade(sand, 0.2), 0)); g.addColorStop(1, alpha(shade(sand, 0.2), 0.55)); c.fillStyle = g; c.fillRect(0, sh + u * 3, W, H - sh);
    c.fillStyle = alpha(shade(sand, -0.3), 0.22); for (i = 0; i < 70; i++) { c.beginPath(); c.arc(R0() * W, sh + u * 4 + R0() * (H - sh - u * 4), u * (0.15 + R0() * 0.25), 0, TAU); c.fill(); }
    /* the umbrella and a towel, right */
    var ux = W * 0.9, uy = sh + u * 5.5, um = Math.sin(t * 0.8) * 0.015;
    el(c, ux + u * 2, uy + u * 0.4, u * 11, u * 1.3, alpha('#000000', 0.13));
    quad(c, ux - u * 13, uy + u * 1.5, ux - u * 3, uy + u * 0.4, ux - u * 1.5, uy + u * 2.3, ux - u * 12, uy + u * 3.6, T(p.accent2, 0.4)); quad(c, ux - u * 10.5, uy + u * 1.24, ux - u * 8.5, uy + u * 1.02, ux - u * 7.3, uy + u * 3, ux - u * 9.4, uy + u * 3.25, T(p.paper, 0.4)); quad(c, ux - u * 6.4, uy + u * 0.78, ux - u * 4.6, uy + u * 0.58, ux - u * 3.2, uy + u * 2.5, ux - u * 5.1, uy + u * 2.72, T(p.paper, 0.4));
    c.save(); c.translate(ux, uy); c.rotate(-0.16 + um); Rn(c, -u * 0.35, -u * 21, u * 0.7, u * 21, u * 0.3, T(p.paper, 0.4));
    for (i = 0; i < 6; i++) { var a0 = PI + i * PI / 6, a1 = a0 + PI / 6; c.beginPath(); c.moveTo(0, -u * 21); c.arc(0, -u * 17, u * 11.5, a0, a1); c.closePath(); c.fillStyle = T(i % 2 ? p.paper : p.accent, 0.4); c.fill(); }
    c.fillStyle = T(shade(p.accent, -0.2), 0.4); for (i = 0; i < 6; i++) { c.beginPath(); c.arc(-u * 11.5 + (i + 0.5) * u * 23 / 6, -u * 17, u * 23 / 12, 0, PI); c.fillStyle = T(i % 2 ? shade(p.paper, -0.12) : shade(p.accent, -0.18), 0.4); c.fill(); }
    dot(c, 0, -u * 28.6, u * 0.7, T(p.gold, 0.3)); c.restore();
    /* the palm leans in from the left */
    el(c, W * 0.06, sh + u * 5.6, u * 9, u * 1.1, alpha('#000000', 0.12));
    palm(c, -u * 1, sh + u * 5.5, u * 64, 0.3, t, 0, trunk, lf);
    if (night) { var cols = [p.accent, p.gold, p.accent2, p.snow], kb = Math.exp(-5 * o.beat); var x1 = u * 17, y1 = sh - u * 56, x2 = ux - u * 4.6, y2 = uy - u * 28, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + u * 22; /* a string of lights from the palm to the umbrella */
      c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.lineWidth = u * 0.22; c.strokeStyle = alpha(p.ink, 0.75); c.stroke();
      for (i = 0; i < 13; i++) { var f = (i + 0.5) / 13, bx = (1 - f) * (1 - f) * x1 + 2 * (1 - f) * f * mx + f * f * x2, by = (1 - f) * (1 - f) * y1 + 2 * (1 - f) * f * my + f * f * y2, on = (i + o.n) % 2 === 0; if (on) dot(c, bx, by + u * 0.8, u * (2.4 + kb), alpha(cols[i % 4], 0.3)); dot(c, bx, by + u * 0.8, u * 0.95, on ? cols[i % 4] : shade(cols[i % 4], -0.3)); } }
    /* the bottom corners: a sandcastle, shells, a bucket or the night's fire */
    for (i = 0; i < 9; i++) { var ff = i / 8, fpx = W * (0.44 + ff * 0.3) + Math.sin(ff * 4) * u * 5 + (i % 2 ? u * 1.3 : -u * 1.3), fpy = H * 0.99 - ff * (H * 0.99 - sh - u * 9); el(c, fpx, fpy, u * (1.3 - ff * 0.5), u * (0.7 - ff * 0.26), alpha(shade(sand, -0.34), 0.34), -0.5); } /* footprints up from the water */
    var crx = W * 0.5 + Math.sin(t * 0.5) * u * 9, cry = H * 0.925, crc = T(p.accent, 0.3), cl2 = Math.sin(t * 3) * 0.25; /* a crab goes about its business */
    c.strokeStyle = shade(crc, -0.15); c.lineWidth = u * 0.4; c.lineCap = 'round'; c.beginPath(); for (i = -1; i <= 1; i += 2) for (k = 0; k < 3; k++) { c.moveTo(crx + i * u * 1.6, cry + u * (0.2 + k * 0.4)); c.lineTo(crx + i * u * (3.3 + Math.sin(t * 9 + k * 2 + i) * 0.3), cry + u * (1 + k * 0.5)); } c.stroke();
    for (i = -1; i <= 1; i += 2) { L(c, crx + i * u * 1.7, cry - u * 0.4, crx + i * u * 3.2, cry - u * (1.5 + cl2 * i), u * 0.5, shade(crc, -0.15)); dot(c, crx + i * u * 3.5, cry - u * (2 + cl2 * i), u * 0.95, crc); L(c, crx + i * u * 0.8, cry - u * 1, crx + i * u * 0.9, cry - u * 2.3, u * 0.3, shade(crc, -0.15)); dot(c, crx + i * u * 0.9, cry - u * 2.5, u * 0.5, '#ffffff'); dot(c, crx + i * u * 0.95, cry - u * 2.5, u * 0.24, '#20222c'); }
    el(c, crx, cry, u * 2.5, u * 1.6, crc); el(c, crx - u * 0.5, cry - u * 0.5, u * 1.3, u * 0.6, alpha('#ffffff', 0.22));
    el(c, W * 0.16, H * 0.968, u * 15, u * 1.6, alpha('#000000', 0.1)); sandcastle(c, W * 0.15, H * 0.965, u * 9.4, shade(sand, -0.08), T(p.accent, 0.3), t);
    starfish(c, W * 0.33, H * 0.972, u * 2.2, T(mix(p.accent, '#ff9a6a', 0.5), 0.4), 0.3); shell(c, W * 0.04, H * 0.985, u * 1.8, T(p.paper, 0.4)); shell(c, W * 0.62, H * 0.98, u * 1.5, T(mix(p.accent, '#ffffff', 0.6), 0.4)); starfish(c, W * 0.7, H * 0.9, u * 1.5, T(p.gold, 0.4), 1);
    var qx = W * 0.85, qy = H * 0.972;
    zoom(c, qx, qy, 1.45);
    if (night) {
      glow(c, qx, qy - u * 4, u * 30, '#ffb45a', 0.34 + 0.05 * Math.sin(t * 6)); el(c, qx, qy, u * 6, u * 1.2, alpha('#000000', 0.25));
      for (i = 0; i < 7; i++) { var an = i / 7 * TAU; dot(c, qx + Math.cos(an) * u * 5.4, qy + Math.sin(an) * u * 1.1, u * 1.1, T('#9a9aa8', 0.3)); }
      c.save(); c.translate(qx, qy - u * 0.6); c.rotate(0.5); Rn(c, -u * 4, -u * 0.7, u * 8, u * 1.4, u * 0.6, '#6a4028'); c.rotate(-1); Rn(c, -u * 4, -u * 0.7, u * 8, u * 1.4, u * 0.6, '#7a4c30'); c.restore();
      flame(c, qx, qy - u * 0.8, u * 5.6, u * 9.5, t, 1); flame(c, qx - u * 1.6, qy - u * 0.6, u * 3, u * 5, t, 3);
      for (i = 0; i < 5; i++) { var sf = frac(t * 0.3 + i * 0.21); dot(c, qx + Math.sin(sf * 6 + i * 2) * u * 3, qy - u * 8 - sf * u * 16, u * 0.35, alpha('#ffd98a', 1 - sf)); }
    } else {
      el(c, qx + u, qy + u * 0.2, u * 9, u * 1.1, alpha('#000000', 0.12));
      dot(c, qx + u * 6.5, qy - u * 3.4, u * 3.8, T(p.paper, 0.4)); c.save(); c.translate(qx + u * 6.5, qy - u * 3.4); c.rotate(0.5); for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, u * 3.8, i * TAU / 3, i * TAU / 3 + TAU / 6); c.closePath(); c.fillStyle = T([p.accent, p.gold, p.accent2][i], 0.4); c.fill(); } c.restore(); dot(c, qx + u * 5.4, qy - u * 4.7, u * 0.9, 'rgba(255,255,255,0.5)');
      poly(c, [[qx - u * 3.6, qy - u * 6], [qx + u * 2.6, qy - u * 6], [qx + u * 1.9, qy], [qx - u * 2.9, qy]], T(p.accent2, 0.4)); Rn(c, qx - u * 4, qy - u * 6.6, u * 7, u * 1.2, u * 0.6, T(shade(p.accent2, 0.2), 0.4)); c.beginPath(); c.arc(qx - u * 0.5, qy - u * 6.4, u * 3.2, PI, 0); c.lineWidth = u * 0.45; c.strokeStyle = T(p.paper, 0.4); c.stroke();
      K.starPath(c, qx - u * 0.5, qy - u * 2.9, u * 1.4, u * 0.6, 5, 0); c.fillStyle = T(p.gold, 0.4); c.fill();
      c.save(); c.translate(qx - u * 6.5, qy - u * 0.3); c.rotate(-0.5); Rn(c, -u * 0.35, -u * 7, u * 0.7, u * 5.4, u * 0.3, T(p.gold, 0.4)); Rn(c, -u * 1.3, -u * 2.2, u * 2.6, u * 3.2, u * 1, T(p.accent, 0.4)); Rn(c, -u * 1, -u * 7.6, u * 2, u * 0.9, u * 0.4, T(p.gold, 0.4)); c.restore();
    }
    c.restore();
    if (dusk) glow(c, lx, hz, u * 70, lightC, 0.18);
  }, { variants: ['day', 'dusk', 'night'], stage: 'band-low' });

  /* ---------- island: a lagoon, a sleeping volcano, a hut on stilts ---------- */
  Art.add('backdrop', 'island', function (c, W, H, t, p, o, u) {
    u = unit(W, H);
    var v = o.variant, dusk = v === 'dusk', T = tinter(p, v), i, s, R0 = rnd(o.seed + 'is'), hz = H * 0.53, sh = H * 0.675,
      low = sky(c, W, H, p, v, hz), sand = T(mix('#f6e2b4', p.bg2, 0.28)), seaA = T(mix(mix('#2f9fd0', p.bg, 0.4), low, 0.2)), seaB = T(mix('#62e0cc', p.bg, 0.14)), lf = T(mix('#2f9a5c', p.accent2, 0.5)), trunk = T(mix('#9a6b42', p.bg2, 0.12)),
      sunC = mix(p.gold, '#ff8a4a', 0.4), hot = [T(p.accent, 0.2), T(mix(p.accent, '#ffffff', 0.45), 0.2), T(p.gold, 0.2)];
    if (dusk) { skyStars(c, W, H, 24, o.seed, t, H * 0.18, p.snow); sunDisc(c, W * 0.6, hz - u * 4, u * 9, t, sunC, 0); streaks(c, W, t, o.seed, 6, H * 0.2, H * 0.46, u, mix(p.accent, '#ffd0a0', 0.5)); }
    else { sunDisc(c, W * 0.5, H * 0.07, u * 5.5, t, mix(p.gold, '#fff3b0', 0.4), 1); clouds(c, W, t, o.seed, 4, H * 0.1, H * 0.36, u * 16, u * 28, alpha(p.snow, 0.92)); }
    /* the volcano island, far off, with its little cloud */
    var vx = W * 0.36, vc = mix(T(mix('#6a7ab0', p.bg, 0.3)), low, 0.42), vg = mix(lf, low, 0.5), pf;
    for (i = 0; i < 4; i++) { pf = frac(t * 0.05 + i / 4); el(c, vx + u * 0.5 + pf * u * 9 + Math.sin(pf * 5 + i) * u, hz - u * 21 - pf * u * 9, u * (1.6 + pf * 3.2), u * (1.2 + pf * 2.2), alpha(p.snow, 0.5 * (1 - pf))); }
    if (dusk) glow(c, vx + u * 0.5, hz - u * 19.5, u * 7, '#ff8a4a', 0.5);
    poly(c, [[vx - u * 30, hz + u], [vx - u * 13, hz - u * 9], [vx - u * 4.5, hz - u * 19], [vx - u * 1.5, hz - u * 18.2], [vx + u * 1.5, hz - u * 19.4], [vx + u * 5, hz - u * 18.6], [vx + u * 13, hz - u * 8], [vx + u * 32, hz + u]], vc);
    poly(c, [[vx + u * 1.5, hz - u * 19.4], [vx + u * 5, hz - u * 18.6], [vx + u * 13, hz - u * 8], [vx + u * 32, hz + u], [vx + u * 8, hz + u], [vx + u * 4, hz - u * 9]], shade(vc, -0.1));
    blob(c, [[vx - u * 32, hz + u], [vx - u * 22, hz - u * 5], [vx - u * 12, hz - u * 8], [vx - u * 3, hz - u * 6], [vx + u * 6, hz - u * 8], [vx + u * 16, hz - u * 5], [vx + u * 34, hz + u]], vg);
    for (i = 0; i < 7; i++) el(c, vx - u * 22 + i * u * 7, hz - u * (3.6 + (i % 3) * 1.4), u * 4.4, u * 3, i % 2 ? vg : shade(vg, 0.08));
    for (i = 0; i < 3; i++) cloud(c, vx - u * 12 + i * u * 11 + Math.sin(t * 0.2 + i) * u, hz - u * (11.5 + (i % 2) * 1.5), u * 13, alpha(p.snow, 0.7));
    blob(c, [[W * 0.86, hz + u], [W * 0.92, hz - u * 3], [W * 1.02, hz - u * 4.5], [W * 1.1, hz + u]], mix(lf, low, 0.55));
    water(c, W, hz, sh + u * 4, seaA, seaB, t, o.seed, 44, alpha(p.snow, 0.9), u);
    if (dusk) glitter(c, W * 0.6, hz + u * 0.6, sh - u * 2, u * 5, u * 20, mix(sunC, '#ffffff', 0.4), t, u);
    for (i = 0; i < 4; i++) el(c, W * [0.18, 0.44, 0.62, 0.3][i], hz + (sh - hz) * [0.5, 0.66, 0.42, 0.82][i], u * [9, 12, 7, 10][i], u * [1.4, 1.8, 1.1, 1.5][i], alpha(mix(seaB, '#ffffff', 0.35), 0.4)); /* pale shallows */
    /* the hut on stilts, right */
    var hx = W * 0.83, hy = hz + (sh - hz) * 0.5, hw = u * 15, wall = T(mix('#e9c98a', p.paper, 0.4)), thatch = T(mix('#b98a4a', p.bg2, 0.14)), wood = T(mix('#7a5236', p.ink, 0.15));
    for (i = 0; i < 4; i++) { var px = hx - hw * 0.42 + i * hw * 0.28; Rn(c, px - u * 0.35, hy, u * 0.7, u * 5.4, 0, wood); Rn(c, px - u * 0.35, hy + u * 5.6, u * 0.7, u * 3 + Math.sin(t * 2 + i) * u * 0.4, u * 0.3, alpha(wood, 0.35)); }
    quad(c, hx + hw * 0.5, hy - u * 0.2, W + u, hy + u * 1.6, W + u, hy + u * 2.6, hx + hw * 0.5, hy + u * 0.8, wood); for (i = 0; i < 4; i++) Rn(c, hx + hw * 0.62 + i * u * 4.2, hy + u * 1, u * 0.6, u * 5 + i * u * 0.5, 0, wood);
    Rn(c, hx - hw * 0.56, hy - u * 0.6, hw * 1.12, u * 1.4, u * 0.3, wood); Rn(c, hx - hw * 0.42, hy - u * 7.6, hw * 0.84, u * 7.2, 0, wall);
    for (i = 1; i < 6; i++) Rn(c, hx - hw * 0.42 + i * hw * 0.14, hy - u * 7.6, u * 0.18, u * 7.2, 0, shade(wall, -0.12));
    Rn(c, hx - u * 1.7, hy - u * 5.6, u * 3.4, u * 5.2, u * 1.6, dusk ? '#ffd98a' : shade(wood, -0.2)); Rn(c, hx + hw * 0.2, hy - u * 5.4, u * 2.4, u * 2.4, u * 0.3, dusk ? '#ffe9a8' : mix(seaA, '#ffffff', 0.3)); Rn(c, hx - hw * 0.37, hy - u * 5.4, u * 2.4, u * 2.4, u * 0.3, dusk ? '#ffe9a8' : mix(seaA, '#ffffff', 0.3));
    if (dusk) glow(c, hx, hy - u * 4, u * 14, '#ffd98a', 0.3);
    for (i = 0; i < 3; i++) { var ty = hy - u * 7 - i * u * 2.9, tw = hw * (0.72 - i * 0.2); poly(c, [[hx - tw, ty], [hx + tw, ty], [hx + tw - hw * 0.2, ty - u * 3.6], [hx - tw + hw * 0.2, ty - u * 3.6]], i % 2 ? shade(thatch, 0.1) : thatch); c.strokeStyle = shade(thatch, -0.22); c.lineWidth = u * 0.22; c.beginPath(); for (s = -4; s <= 4; s++) { c.moveTo(hx + s * tw * 0.22, ty); c.lineTo(hx + s * tw * 0.2, ty - u * 1.3); } c.stroke(); }
    poly(c, [[hx - hw * 0.14, hy - u * 16.4], [hx + hw * 0.14, hy - u * 16.4], [hx, hy - u * 19]], thatch);
    /* an outrigger canoe drawn up on the left */
    function edge(x, d) { return sh + Math.sin(x / W * 4.4 + 2.4) * u * 1.5 + Math.sin(x / W * 10 + 1) * u * 0.5 + d; }
    function shore(d, col) { var k2; c.beginPath(); c.moveTo(0, H); for (k2 = 0; k2 <= 24; k2++) c.lineTo(k2 / 24 * W, edge(k2 / 24 * W, d)); c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.fill(); }
    var wash = 0.5 + 0.5 * Math.sin(t * 0.9);
    shore(-u * (1.6 + wash * 1.5), alpha(p.snow, 0.85)); shore(-u * (1 + wash * 1.1), alpha(seaB, 0.8)); shore(0, shade(sand, -0.15)); shore(u * 2, sand);
    var g = c.createLinearGradient(0, sh, 0, H); g.addColorStop(0, alpha(shade(sand, 0.25), 0)); g.addColorStop(1, alpha(shade(sand, 0.25), 0.5)); c.fillStyle = g; c.fillRect(0, sh + u * 3, W, H - sh);
    c.fillStyle = alpha(shade(sand, -0.3), 0.2); for (i = 0; i < 60; i++) { c.beginPath(); c.arc(R0() * W, sh + u * 4 + R0() * (H - sh - u * 4), u * (0.15 + R0() * 0.25), 0, TAU); c.fill(); }
    var kx = W * 0.3, ky = sh + u * 3.4;
    el(c, kx, ky + u * 1.3, u * 11, u * 1, alpha('#000000', 0.12));
    c.save(); c.translate(kx, ky); c.rotate(-0.07); L(c, -u * 4, -u * 0.6, -u * 5, u * 2.6, u * 0.4, wood); L(c, u * 4, -u * 0.6, u * 3, u * 2.6, u * 0.4, wood); Rn(c, -u * 8, u * 2.2, u * 15, u * 0.9, u * 0.45, T(p.paper, 0.3));
    c.beginPath(); c.moveTo(-u * 11, -u * 1.6); c.quadraticCurveTo(0, u * 3, u * 11, -u * 1.6); c.quadraticCurveTo(0, -u * 0.2, -u * 11, -u * 1.6); c.fillStyle = T(p.accent, 0.3); c.fill(); c.beginPath(); c.moveTo(-u * 8, -u * 0.2); c.quadraticCurveTo(0, u * 1.6, u * 8, -u * 0.2); c.lineWidth = u * 0.4; c.strokeStyle = T(p.gold, 0.3); c.stroke(); c.restore();
    /* palms cross over the top from both sides; torches below them */
    el(c, W * 0.06, sh + u * 6, u * 9, u * 1.1, alpha('#000000', 0.12)); el(c, W * 0.96, sh + u * 7, u * 9, u * 1.1, alpha('#000000', 0.12));
    palm(c, W + u * 2, sh + u * 7, u * 72, -0.26, t, 2, shade(trunk, -0.06), shade(lf, -0.06)); palm(c, -u * 2, sh + u * 6, u * 58, 0.3, t, 0, trunk, lf); palm(c, W * 0.13, sh + u * 4, u * 34, 0.16, t, 4, trunk, shade(lf, 0.1));
    tikiTorch(c, W * 0.22, sh + u * 7, u * 15, u, t, 0, dusk, wood); tikiTorch(c, W * 0.74, sh + u * 7.4, u * 15, u, t, 2, dusk, wood);
    /* big leaves and hibiscus fill the bottom corners */
    for (s = 0; s < 2; s++) {
      var d = s ? -1 : 1, ox = s ? W + u * 2 : -u * 2, oy = H + u * 2, an;
      for (i = 0; i < 6; i++) { an = -PI / 2 + d * (0.1 + i * 0.26) + Math.sin(t * 0.9 + i + s) * 0.03; leaf(c, ox, oy, u * (30 - i * 2.6), s ? an : an, i % 2 ? lf : shade(lf, i % 3 ? -0.16 : 0.14)); }
      bloom(c, ox + d * u * 9, oy - u * 15, u * 4.6, hot[s], t, s * 2); bloom(c, ox + d * u * 19, oy - u * 8, u * 3.8, hot[2 - s], t, 1 + s); bloom(c, ox + d * u * 4, oy - u * 25, u * 3, hot[1], t, 3 + s);
    }
    shell(c, W * 0.42, H * 0.975, u * 1.7, T(p.paper, 0.4)); starfish(c, W * 0.6, H * 0.955, u * 2, T(mix(p.accent, '#ff9a6a', 0.5), 0.3), 0.5);
    if (dusk) glow(c, W * 0.6, hz, u * 70, sunC, 0.16);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- reef: under the water, coral gardens down both sides ---------- */
  function coralBranch(c, x, y, len, a, w, col, depth, sway) {
    var ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len; L(c, x, y, ex, ey, w, col);
    if (depth > 0) { coralBranch(c, ex, ey, len * 0.74, a - 0.5 + sway, w * 0.76, col, depth - 1, sway); coralBranch(c, ex, ey, len * 0.66, a + 0.46 + sway, w * 0.76, col, depth - 1, sway); }
    else dot(c, ex, ey, w * 0.75, shade(col, 0.3));
  }
  function fanCoral(c, x, y, r, col, sway) {
    var i; c.save(); c.translate(x, y); c.rotate(sway);
    c.beginPath(); c.moveTo(0, 0); c.arc(0, -r * 0.2, r, PI * 1.08, PI * 1.92); c.closePath(); c.fillStyle = alpha(col, 0.5); c.fill();
    c.strokeStyle = col; c.lineCap = 'round'; for (i = -4; i <= 4; i++) { var a = -PI / 2 + i * 0.3; c.lineWidth = r * 0.05; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a) * r * 0.5, -r * 0.5, Math.cos(a) * r * 0.96, -r * 0.2 + Math.sin(a) * r * 0.96); c.stroke(); }
    c.lineWidth = r * 0.03; for (i = 1; i <= 3; i++) { c.beginPath(); c.arc(0, -r * 0.2, r * i / 3.6, PI * 1.12, PI * 1.88); c.stroke(); }
    Rn(c, -r * 0.05, -r * 0.04, r * 0.1, r * 0.2, r * 0.04, shade(col, -0.2)); c.restore();
  }
  function tubes(c, x, y, s, col, n) { var i; for (i = 0; i < n; i++) { var h = s * (1.6 + ((i * 7) % 5) * 0.34), tx = x + (i - (n - 1) / 2) * s * 0.74, w = s * 0.66; Rn(c, tx - w / 2, y - h, w, h + s * 0.2, w * 0.4, i % 2 ? col : shade(col, -0.12)); Rn(c, tx - w * 0.36, y - h + w * 0.3, w * 0.18, h * 0.7, w * 0.09, shade(col, 0.24)); el(c, tx, y - h + w * 0.12, w * 0.36, w * 0.2, shade(col, -0.42)); } }
  function brain(c, x, y, r, col) { var i; c.beginPath(); c.arc(x, y, r, PI, 0); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = shade(col, -0.2); c.lineWidth = r * 0.07; c.lineCap = 'round'; for (i = 0; i < 4; i++) { var rr = r * (0.82 - i * 0.2); c.beginPath(); c.arc(x + (i % 2 ? r * 0.06 : -r * 0.06), y, rr, PI * 1.08, PI * 1.92); c.stroke(); } el(c, x - r * 0.4, y - r * 0.58, r * 0.26, r * 0.14, alpha('#ffffff', 0.25), -0.5); }
  function kelp(c, x, y, h, w, col, t, ph) {
    var i, n = 9, px = x, py = y; c.lineCap = 'round';
    for (i = 1; i <= n; i++) { var f = i / n, qx = x + Math.sin(f * 3.4 + t * 0.9 + ph) * w * (0.4 + f * 1.2), qy = y - f * h; L(c, px, py, qx, qy, w * (0.5 - f * 0.25), col); if (i % 2 === 0 && i < n) leaf(c, qx, qy, w * 2.4, (i % 4 ? -0.5 : PI + 0.5) + Math.sin(t * 0.9 + ph + f * 3) * 0.3, shade(col, 0.12)); px = qx; py = qy; }
  }
  function fish(c, x, y, s, dir, col, col2, t, ph, stripes) {
    var wag = Math.sin(t * 6 + ph) * 0.26, i; c.save(); c.translate(x, y); c.scale(dir, 1);
    poly(c, [[-s * 0.8, 0], [-s * 1.5, -s * (0.5 - wag)], [-s * 1.34, 0], [-s * 1.5, s * (0.5 + wag)]], col2); poly(c, [[-s * 0.3, -s * 0.46], [s * 0.2, -s * 0.9], [s * 0.36, -s * 0.44]], col2);
    el(c, 0, 0, s, s * 0.58, col); el(c, s * 0.06, s * 0.16, s * 0.8, s * 0.36, alpha('#ffffff', 0.16));
    for (i = 0; i < (stripes || 0); i++) el(c, -s * 0.42 + i * s * 0.44, 0, s * 0.1, s * (0.52 - Math.abs(i - 0.5) * 0.1), col2);
    dot(c, s * 0.58, -s * 0.12, s * 0.15, '#ffffff'); dot(c, s * 0.62, -s * 0.12, s * 0.08, '#20222c'); poly(c, [[-s * 0.1, s * 0.12], [-s * 0.42, s * 0.42], [s * 0.12, s * 0.3]], shade(col, -0.16)); c.restore();
  }
  Art.add('backdrop', 'reef', function (c, W, H, t, p, o, u) {
    u = unit(W, H);
    var i, s, R0 = rnd(o.seed + 'rf'), fl = H * 0.7, top = mix('#5fdcec', p.bg, 0.3), midc = mix('#2590cc', p.bg, 0.34), deep = mix(mix('#123a82', p.bg, 0.3), p.bg2, 0.1), sand = mix(mix('#e9d6a0', p.bg2, 0.25), midc, 0.3),
      hot = [p.accent, mix(p.accent, '#ffffff', 0.4), p.gold, mix(p.accent2, '#7af0d0', 0.4), mix(p.accent, '#a070ff', 0.5), mix(p.gold, '#ff8a4a', 0.5)], weed = mix(mix('#2f9a6a', p.accent2, 0.4), deep, 0.2), kb = Math.exp(-5 * o.beat);
    vgrad(c, W, H, [mix(top, '#ffffff', 0.35), top, midc, deep], 0, H * 0.78);
    for (i = 0; i < 6; i++) { /* shafts of light from the surface */
      var rx = W * (0.08 + i * 0.17) + Math.sin(t * 0.3 + i) * u * 3, rw = u * (5 + (i % 3) * 3), g = c.createLinearGradient(0, 0, 0, H * 0.72); g.addColorStop(0, alpha('#ffffff', 0.2)); g.addColorStop(1, alpha('#ffffff', 0));
      c.fillStyle = g; c.beginPath(); c.moveTo(rx - rw * 0.4, 0); c.lineTo(rx + rw * 0.4, 0); c.lineTo(rx + rw * 1.3 - u * 16, H * 0.72); c.lineTo(rx - rw * 1.3 - u * 16, H * 0.72); c.closePath(); c.fill();
    }
    c.fillStyle = alpha('#ffffff', 0.5); c.beginPath(); c.moveTo(0, 0); for (i = 0; i <= 24; i++) c.lineTo(i / 24 * W, u * (1.3 + Math.sin(i * 1.3 + t * 1.2) * 0.7 + Math.sin(i * 0.5 + t * 0.7) * 0.6)); c.lineTo(W, 0); c.closePath(); c.fill(); /* the surface, from below */
    /* far away: a turtle glides, a school turns */
    var tx = frac(t * 0.012 + 0.62) * (W + u * 40) - u * 20, ty = H * 0.2 + Math.sin(t * 0.4) * u * 3, tc = mix(midc, '#0c2f6a', 0.35), fp = Math.sin(t * 1.6) * 0.4;
    c.save(); c.translate(tx, ty); c.rotate(-0.1); el(c, -u * 4.2, u * 2.4, u * 2.6, u * 1, tc, 0.7 + fp * 0.4); el(c, u * 2.4, u * 3, u * 3.6, u * 1.2, tc, -0.9 - fp); el(c, u * 2.6, -u * 2.6, u * 3.6, u * 1.2, tc, 0.9 + fp); el(c, u * 5.6, 0, u * 1.9, u * 1.4, tc); el(c, 0, 0, u * 5, u * 3.3, tc); el(c, 0, 0, u * 3.6, u * 2.2, shade(tc, 0.1)); c.restore();
    c.fillStyle = alpha(shade(deep, -0.1), 0.55); for (i = 0; i < 16; i++) { var sx = W * 0.12 + (i % 6) * u * 3.4 + Math.floor(i / 6) * u * 1.6 + Math.sin(t * 0.25) * u * 9, sy = H * 0.33 + Math.floor(i / 6) * u * 2.2 + Math.sin(t * 1.4 + i) * u * 0.4 + (i % 2) * u; c.beginPath(); c.ellipse(sx, sy, u * 1.1, u * 0.42, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(sx - u * 0.9, sy); c.lineTo(sx - u * 1.7, sy - u * 0.5); c.lineTo(sx - u * 1.7, sy + u * 0.5); c.closePath(); c.fill(); }
    for (i = 0; i < 2; i++) { /* two jellyfish hang in the side water */
      var jx = W * (i ? 0.89 : 0.15) + Math.sin(t * 0.3 + i * 2) * u * 2, jy = H * (i ? 0.27 : 0.33) + Math.sin(t * 0.8 + i * 3) * u * 2.4, js = u * (i ? 3.4 : 4.2), pu = Math.sin(t * 1.6 + i * 3), jc = mix(hot[i ? 4 : 1], '#ffffff', 0.3), q;
      c.lineCap = 'round'; c.lineWidth = js * 0.13; c.strokeStyle = alpha(jc, 0.55); c.beginPath(); for (q = -2; q <= 2; q++) { c.moveTo(jx + q * js * 0.34, jy); c.bezierCurveTo(jx + q * js * 0.34 + Math.sin(t * 1.6 + q) * js * 0.4, jy + js * 0.9, jx + q * js * 0.3 - Math.sin(t * 1.6 + q) * js * 0.4, jy + js * 1.7, jx + q * js * 0.26 + Math.sin(t * 1.3 + q) * js * 0.2, jy + js * (2.4 + (q % 2) * 0.4)); } c.stroke();
      c.beginPath(); c.moveTo(jx - js * (1 + pu * 0.07), jy); c.bezierCurveTo(jx - js * 1.1, jy - js * 1.5, jx + js * 1.1, jy - js * 1.5, jx + js * (1 + pu * 0.07), jy); c.quadraticCurveTo(jx, jy + js * (0.34 + pu * 0.08), jx - js * (1 + pu * 0.07), jy); c.closePath(); c.fillStyle = alpha(jc, 0.72); c.fill();
      el(c, jx - js * 0.3, jy - js * 0.66, js * 0.36, js * 0.2, alpha('#ffffff', 0.5), -0.5); dot(c, jx - js * 0.3, jy - js * 0.3, js * 0.1, alpha('#20222c', 0.6)); dot(c, jx + js * 0.3, jy - js * 0.3, js * 0.1, alpha('#20222c', 0.6));
    }
    /* the far reef, then the sandy floor */
    var farc = mix(deep, midc, 0.45);
    blob(c, [[-u * 4, fl + u * 4], [W * 0.02, fl - u * 13], [W * 0.14, fl - u * 17], [W * 0.26, fl - u * 7], [W * 0.4, fl - u * 2], [W * 0.5, fl + u * 4]], farc); blob(c, [[W * 0.5, fl + u * 4], [W * 0.62, fl - u * 3], [W * 0.76, fl - u * 9], [W * 0.88, fl - u * 19], [W * 1.0, fl - u * 14], [W + u * 4, fl + u * 4]], farc);
    for (i = 0; i < 8; i++) { var fx = W * [0.04, 0.12, 0.2, 0.3, 0.7, 0.8, 0.9, 0.97][i], fy = fl - u * [12, 15.5, 10, 4, 5, 10, 17, 14][i]; coralBranch(c, fx, fy, u * (3 + (i % 3)), -PI / 2 + (i % 2 ? 0.15 : -0.15), u * 0.8, shade(farc, i % 2 ? 0.1 : -0.1), 2, Math.sin(t * 0.6 + i) * 0.04); }
    hill(c, W, H, fl, u * 1.6, mix(sand, deep, 0.3), o.seed + 'a', 0.8); var f1 = hill(c, W, H, fl + u * 5, u * 1.8, mix(sand, deep, 0.12), o.seed + 'b', 1.1); hill(c, W, H, H * 0.86, u * 2, sand, o.seed + 'c', 0.7);
    for (i = 0; i < 12; i++) { var lx = frac(R0() + t * 0.004) * W, ly = fl + u * 7 + R0() * (H - fl - u * 8), lw = u * (5 + R0() * 9); el(c, lx, ly, lw, lw * 0.16, alpha('#ffffff', 0.07 + 0.06 * Math.sin(t * 1.4 + i))); }
    c.fillStyle = alpha(shade(sand, -0.3), 0.25); for (i = 0; i < 50; i++) { c.beginPath(); c.arc(R0() * W, fl + u * 6 + R0() * (H - fl - u * 6), u * (0.15 + R0() * 0.3), 0, TAU); c.fill(); }
    /* coral gardens, left and right */
    for (s = 0; s < 2; s++) {
      var d = s ? -1 : 1, ex = s ? W : 0, by = f1(ex) + u * 4, sw = Math.sin(t * 0.8 + s * 2) * 0.05;
      kelp(c, ex + d * u * 1.5, by + u * 4, u * (70 - s * 9), u * 3, shade(weed, -0.14), t, s * 3); kelp(c, ex + d * u * 7, by + u * 5, u * (50 + s * 12), u * 2.5, weed, t, 1 + s * 3); kelp(c, ex + d * u * 21, by + u * 3, u * 24, u * 1.5, shade(weed, 0.1), t, 2 + s);
      zoom(c, ex, by + u * 9, 1.36);
      rock(c, ex + d * u * 8, by + u * 5, u * 26, u * 9, mix(deep, '#6a5a8a', 0.4));
      coralBranch(c, ex + d * u * 12, by - u * 1.5, u * 6.2, -PI / 2 + d * 0.1, u * 1.7, hot[s ? 4 : 0], 3, sw); coralBranch(c, ex + d * u * 3.5, by - u * 2, u * 4.6, -PI / 2 - d * 0.1, u * 1.3, hot[s ? 1 : 5], 3, -sw);
      fanCoral(c, ex + d * u * 20.5, by + u * 1, u * 8, hot[s ? 0 : 4], sw * 2 + d * 0.12);
      tubes(c, ex + d * u * 16, by + u * 7, u * 2.9, hot[s ? 5 : 2], 4); brain(c, ex + d * u * 6, by + u * 8.5, u * 5.4, hot[s ? 3 : 1]);
      c.restore();
      for (i = 0; i < 9; i++) { var bf = frac(t * (0.07 + (i % 3) * 0.02) + i * 0.137 + s * 0.4), bx = ex + d * u * (4 + (i % 4) * 5.5) + Math.sin(bf * 9 + i) * u * 1.2, bby = by - bf * H * 0.6, br = u * (0.5 + (i % 3) * 0.3) * (0.7 + bf * 0.6); ring(c, bx, bby, br, u * 0.18, alpha('#ffffff', 0.55 * (1 - bf))); dot(c, bx - br * 0.3, bby - br * 0.3, br * 0.25, alpha('#ffffff', 0.6 * (1 - bf))); }
    }
    /* the bottom corners: an anemone with its fish, a clam with its pearl */
    var ax = W * 0.13, ay = H * 0.965, ac = mix(p.accent, '#ffb0d0', 0.4);
    el(c, ax, ay, u * 6.4, u * 1.6, shade(ac, -0.3)); c.lineCap = 'round';
    for (i = 0; i < 11; i++) { var an = -PI / 2 + (i - 5) * 0.2, wv = Math.sin(t * 1.6 + i * 0.8) * u * 1.4, tx2 = ax + (i - 5) * u * 1.05, ex2 = tx2 + Math.cos(an) * u * 7.5 + wv, ey2 = ay + Math.sin(an) * u * 8.5; c.beginPath(); c.moveTo(tx2, ay); c.quadraticCurveTo(tx2 + wv * 0.3, ay - u * 5, ex2, ey2); c.lineWidth = u * 1.25; c.strokeStyle = i % 2 ? ac : shade(ac, -0.12); c.stroke(); dot(c, ex2, ey2, u * 0.85, shade(ac, 0.4)); }
    fish(c, ax + u * 8 + Math.sin(t * 0.7) * u * 2.2, ay - u * 11 + Math.cos(t * 0.9) * u * 1, u * 3.3, 1, mix(p.gold, '#ff8a3a', 0.6), p.paper, t, 0, 2);
    var qx = W * 0.86, qy = H * 0.972, op = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.8)) + kb * 0.08, cc = mix(p.accent2, '#b8a0e8', 0.5);
    c.save(); c.translate(qx, qy); c.beginPath(); c.moveTo(-u * 6, 0); c.quadraticCurveTo(0, u * 4.4, u * 6, 0); c.quadraticCurveTo(0, -u * 1.6, -u * 6, 0); c.fillStyle = shade(cc, -0.2); c.fill();
    el(c, 0, -u * 0.2, u * 4.6, u * 1.2, shade(cc, -0.45)); glow(c, 0, -u * 1.2, u * 7, p.snow, 0.3 + 0.2 * kb); dot(c, 0, -u * 1, u * 1.5, p.paper); dot(c, -u * 0.45, -u * 1.45, u * 0.5, '#ffffff');
    c.rotate(-op); c.beginPath(); c.moveTo(-u * 6, 0); for (i = 0; i <= 6; i++) { var sa = PI + i * PI / 6; c.quadraticCurveTo(Math.cos(sa + PI / 12) * u * 6.9, Math.sin(sa + PI / 12) * u * 5.6, Math.cos(sa + PI / 6) * u * 6, Math.sin(sa + PI / 6) * u * 4.8); } c.closePath(); c.fillStyle = cc; c.fill();
    c.strokeStyle = shade(cc, -0.2); c.lineWidth = u * 0.3; c.beginPath(); for (i = 1; i < 6; i++) { sa = PI + i * PI / 6; c.moveTo(0, 0); c.lineTo(Math.cos(sa) * u * 5.4, Math.sin(sa) * u * 4.3); } c.stroke(); c.restore();
    K.starPath(c, W * 0.3, H * 0.975, u * 2.4, u * 1.1, 5, 0.4); c.fillStyle = hot[5]; c.fill(); shell(c, W * 0.68, H * 0.985, u * 1.7, p.paper); shell(c, W * 0.44, H * 0.96, u * 1.3, hot[1]);
    /* fish in the side water, each on its own slow beat */
    fish(c, W * 0.14 + Math.sin(t * 0.33) * u * 6, H * 0.47 + Math.cos(t * 0.5) * u * 1.5, u * 2.6, Math.cos(t * 0.33) > 0 ? 1 : -1, hot[2], hot[4], t, 1, 1);
    fish(c, W * 0.87 + Math.sin(t * 0.27 + 2) * u * 6, H * 0.4 + Math.cos(t * 0.45) * u * 1.5, u * 3, Math.cos(t * 0.27 + 2) > 0 ? 1 : -1, hot[3], p.paper, t, 2, 2);
    fish(c, W * 0.82 + Math.sin(t * 0.4 + 4) * u * 5, H * 0.56 + Math.cos(t * 0.6) * u * 1, u * 1.9, Math.cos(t * 0.4 + 4) > 0 ? 1 : -1, hot[0], hot[2], t, 3, 0);
    fish(c, W * 0.2 + Math.sin(t * 0.36 + 1) * u * 5, H * 0.6 + Math.cos(t * 0.7) * u * 1, u * 1.7, Math.cos(t * 0.36 + 1) > 0 ? 1 : -1, hot[1], hot[0], t, 4, 0);
    var g2 = c.createLinearGradient(0, H * 0.8, 0, H); g2.addColorStop(0, alpha(deep, 0)); g2.addColorStop(1, alpha(deep, 0.3)); c.fillStyle = g2; c.fillRect(0, H * 0.8, W, H * 0.2);
  }, { variants: ['one'], stage: 'band-low' });

  /* ---------- space: deep space, seen from a small round world ---------- */
  function ringedPlanet(c, x, y, r, col, col2, ringC, tilt) {
    c.save(); c.translate(x, y); c.rotate(tilt);
    c.beginPath(); c.ellipse(0, 0, r * 2.05, r * 0.5, 0, PI, TAU); c.lineWidth = r * 0.3; c.strokeStyle = alpha(ringC, 0.75); c.stroke(); c.beginPath(); c.ellipse(0, 0, r * 1.62, r * 0.38, 0, PI, TAU); c.lineWidth = r * 0.1; c.strokeStyle = alpha(shade(ringC, 0.3), 0.75); c.stroke();
    glow(c, 0, 0, r * 2.2, col, 0.22); dot(c, 0, 0, r, col);
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); el(c, 0, -r * 0.5, r * 1.3, r * 0.15, col2); el(c, 0, -r * 0.08, r * 1.3, r * 0.1, shade(col, 0.2)); el(c, 0, r * 0.34, r * 1.3, r * 0.18, col2); el(c, r * 0.3, r * 0.7, r * 1.1, r * 0.1, shade(col, -0.12)); el(c, r * 0.5, r * 0.36, r * 1.2, r * 1.3, alpha('#0a0820', 0.3)); el(c, -r * 0.4, -r * 0.45, r * 0.5, r * 0.3, alpha('#ffffff', 0.16), -0.6); c.restore();
    c.beginPath(); c.ellipse(0, 0, r * 2.05, r * 0.5, 0, 0, PI); c.lineWidth = r * 0.3; c.strokeStyle = ringC; c.stroke(); c.beginPath(); c.ellipse(0, 0, r * 1.62, r * 0.38, 0, 0, PI); c.lineWidth = r * 0.1; c.strokeStyle = shade(ringC, 0.3); c.stroke();
    c.restore();
  }
  function crater(c, x, y, rx, ry, col) { el(c, x, y, rx, ry, shade(col, 0.16)); el(c, x, y + ry * 0.16, rx * 0.9, ry * 0.84, shade(col, -0.2)); el(c, x, y + ry * 0.42, rx * 0.74, ry * 0.54, shade(col, -0.08)); }
  function littleRocket(c, x, y, s, rot, body, fin, win, t) { /* nose up at rot 0; centred on its window */
    var f = 0.8 + 0.2 * Math.sin(t * 20); c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.moveTo(-s * 0.26, s * 0.9); c.quadraticCurveTo(0, s * (1.2 + f * 1.1), s * 0.26, s * 0.9); c.closePath(); c.fillStyle = '#ffb347'; c.fill(); c.beginPath(); c.moveTo(-s * 0.14, s * 0.9); c.quadraticCurveTo(0, s * (1.05 + f * 0.6), s * 0.14, s * 0.9); c.closePath(); c.fillStyle = '#fff3b0'; c.fill();
    poly(c, [[-s * 0.4, s * 0.3], [-s * 0.86, s * 1.02], [-s * 0.36, s * 0.86]], fin); poly(c, [[s * 0.4, s * 0.3], [s * 0.86, s * 1.02], [s * 0.36, s * 0.86]], fin);
    c.beginPath(); c.moveTo(0, -s * 1.3); c.bezierCurveTo(s * 0.62, -s * 0.7, s * 0.56, s * 0.4, s * 0.36, s * 0.92); c.lineTo(-s * 0.36, s * 0.92); c.bezierCurveTo(-s * 0.56, s * 0.4, -s * 0.62, -s * 0.7, 0, -s * 1.3); c.closePath(); c.fillStyle = body; c.fill();
    c.beginPath(); c.moveTo(0, -s * 1.3); c.bezierCurveTo(s * 0.34, -s * 0.98, s * 0.44, -s * 0.76, s * 0.46, -s * 0.62); c.lineTo(-s * 0.46, -s * 0.62); c.bezierCurveTo(-s * 0.44, -s * 0.76, -s * 0.34, -s * 0.98, 0, -s * 1.3); c.closePath(); c.fillStyle = fin; c.fill();
    Rn(c, -s * 0.4, s * 0.58, s * 0.8, s * 0.14, 0, fin); dot(c, 0, -s * 0.1, s * 0.27, shade(body, -0.3)); dot(c, 0, -s * 0.1, s * 0.2, win); dot(c, -s * 0.06, -s * 0.16, s * 0.07, 'rgba(255,255,255,0.7)'); c.restore();
  }
  Art.add('backdrop', 'space', function (c, W, H, t, p, o, u) {
    u = unit(W, H);
    var i, s, R0 = rnd(o.seed + 'sp'), top = mix(p.bg, '#05041a', 0.8), midc = mix(p.bg, '#150c3c', 0.62), lowc = mix(mix(p.bg2, '#2a1458', 0.55), p.accent, 0.14), kb = Math.exp(-5 * o.beat),
      surf = mix(mix(p.bg2, '#8f7fe0', 0.55), p.accent2, 0.16), neb = [p.accent, p.accent2, mix(p.bg2, '#a070ff', 0.5), p.gold];
    vgrad(c, W, H, [top, midc, lowc], 0, H * 0.74);
    for (i = 0; i < 9; i++) { var f = i / 8, nx = W * (0.02 + f * 0.96) + Math.sin(i * 2.3) * u * 8, ny = H * (0.62 - f * 0.52) + Math.cos(i * 1.7) * u * 7; glow(c, nx, ny, u * (26 + (i % 3) * 9), neb[i % 3], 0.13 + 0.02 * Math.sin(t * 0.4 + i)); } /* a river of coloured dust from corner to corner */
    c.fillStyle = alpha(p.snow, 0.5); for (i = 0; i < 90; i++) { var df = R0(), dx = W * (0.02 + df * 0.96) + (R0() - 0.5) * u * 30, dy = H * (0.62 - df * 0.52) + (R0() - 0.5) * u * 22; c.beginPath(); c.arc(dx, dy, u * (0.08 + R0() * 0.16), 0, TAU); c.fill(); }
    skyStars(c, W, H, 150, o.seed, t, H * 0.72, p.snow);
    for (i = 0; i < 6; i++) { var bx = W * [0.08, 0.92, 0.55, 0.3, 0.72, 0.42][i], by = H * [0.05, 0.42, 0.045, 0.2, 0.31, 0.5][i], tw = 0.6 + 0.4 * Math.sin(t * 1.3 + i * 1.9); glow(c, bx, by, u * 4, neb[(i + 1) % 4], 0.3 * tw); twinkle(c, bx, by, u * (1.6 + tw * 1.2), mix(neb[(i + 1) % 4], '#ffffff', 0.6)); }
    /* a far spiral of stars, top left */
    c.save(); c.translate(W * 0.2, H * 0.13); c.rotate(-0.5 + t * 0.01); c.scale(1, 0.5); glow(c, 0, 0, u * 9, p.snow, 0.3); for (s = 0; s < 2; s++) for (i = 0; i < 26; i++) { var ga = i * 0.24 + s * PI, gr = u * (0.8 + i * 0.31); dot(c, Math.cos(ga) * gr, Math.sin(ga) * gr, u * (0.5 - i * 0.012), alpha(i % 3 ? p.snow : neb[s], 0.75 - i * 0.022)); } dot(c, 0, 0, u * 1.3, alpha('#ffffff', 0.9)); c.restore();
    /* the ringed giant, top right, and a small cratered moon with its own moonlet */
    ringedPlanet(c, W * 0.8, H * 0.15, u * 8.6, mix(p.gold, '#ff9a6a', 0.35), mix(p.accent, p.gold, 0.5), mix(p.paper, p.accent2, 0.35), -0.34);
    var mx = W * 0.1, my = H * 0.41, mr = u * 4.6, mc = mix(p.accent2, '#9ad8e8', 0.4), oa = t * 0.35;
    if (Math.sin(oa) < 0) dot(c, mx + Math.cos(oa) * mr * 2.1, my + Math.sin(oa) * mr * 0.6, u * 0.9, p.paper);
    glow(c, mx, my, mr * 2.4, mc, 0.2); dot(c, mx, my, mr, mc); dot(c, mx - mr * 0.3, my - mr * 0.25, mr * 0.24, shade(mc, -0.16)); dot(c, mx + mr * 0.2, my + mr * 0.36, mr * 0.17, shade(mc, -0.16)); dot(c, mx + mr * 0.42, my - mr * 0.3, mr * 0.12, shade(mc, -0.16));
    c.save(); c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.clip(); el(c, mx + mr * 0.55, my + mr * 0.3, mr * 1.1, mr * 1.2, alpha('#0a0820', 0.32)); c.restore();
    if (Math.sin(oa) >= 0) dot(c, mx + Math.cos(oa) * mr * 2.1, my + Math.sin(oa) * mr * 0.6, u * 0.9, p.paper);
    /* a comet, and a little rocket on its rounds */
    var cx = W * 0.9, cy = H * 0.52, cg = c.createLinearGradient(cx, cy, cx + u * 15, cy - u * 9); cg.addColorStop(0, alpha(p.snow, 0.7)); cg.addColorStop(1, alpha(p.snow, 0)); c.fillStyle = cg; c.beginPath(); c.moveTo(cx - u * 0.5, cy - u * 0.9); c.lineTo(cx + u * 15, cy - u * 9); c.lineTo(cx + u * 0.9, cy + u * 0.5); c.closePath(); c.fill(); glow(c, cx, cy, u * 3.4, p.snow, 0.5); dot(c, cx, cy, u * 1, '#ffffff');
    shootingStar(c, W, H, t, u, p.snow, 8, 0.2, 0.3);
    var ra = t * 0.16, rx = W * (0.5 + 0.4 * Math.cos(ra)), ry = H * (0.24 + 0.05 * Math.sin(ra * 2)), vx = -0.4 * W * Math.sin(ra), vy = 0.1 * H * Math.cos(ra * 2);
    for (i = 1; i < 6; i++) { var pa = ra - i * 0.035; dot(c, W * (0.5 + 0.4 * Math.cos(pa)), H * (0.24 + 0.05 * Math.sin(pa * 2)), u * (0.9 - i * 0.12), alpha(p.snow, 0.3 - i * 0.045)); }
    littleRocket(c, rx, ry, u * 3.1, Math.atan2(vy, vx) + PI / 2, p.paper, p.accent, p.accent2, t);
    /* the little world we stand on */
    var gy = H * 1.07, grx = W * 0.98, gry = H * 0.39;
    c.beginPath(); c.ellipse(W / 2, gy, grx + u * 1.6, gry + u * 1.6, 0, 0, TAU); c.fillStyle = alpha(mix(surf, '#ffffff', 0.5), 0.28); c.fill(); glow(c, W / 2, H * 0.7, W * 0.7, surf, 0.16);
    function top2(x) { var k = (x - W / 2) / grx; return gy - gry * Math.sqrt(Math.max(0, 1 - k * k)); }
    c.beginPath(); c.ellipse(W / 2, gy, grx, gry, 0, 0, TAU); c.fillStyle = surf; c.fill();
    var gg = c.createLinearGradient(0, H * 0.68, 0, H); gg.addColorStop(0, alpha(shade(surf, 0.22), 0.7)); gg.addColorStop(0.25, alpha(surf, 0)); gg.addColorStop(1, alpha(shade(surf, -0.4), 0.7)); c.fillStyle = gg; c.beginPath(); c.ellipse(W / 2, gy, grx, gry, 0, 0, TAU); c.fill();
    for (i = 0; i < 11; i++) { var kx = W * [0.3, 0.52, 0.7, 0.2, 0.42, 0.62, 0.84, 0.5, 0.1, 0.33, 0.74][i], ky = H * [0.735, 0.72, 0.745, 0.8, 0.83, 0.8, 0.84, 0.92, 0.9, 0.955, 0.94][i], kr = u * [3, 4.2, 2.6, 5, 3.4, 6, 4, 7, 4.6, 5, 6][i] * (0.6 + (ky / H - 0.7) * 2.4); crater(c, kx, ky, kr, kr * 0.3, surf); }
    for (s = 0; s < 2; s++) { /* crystals and glow-bulb plants at both sides */
      var d = s ? -1 : 1, ex = s ? W : 0, cols = [p.accent2, p.accent, p.gold];
      for (i = 0; i < 5; i++) { var qx = ex + d * u * [3, 8.5, 13.5, 0.5, 18][i], qy = top2(qx) + u * [5, 4, 4.4, 9, 4.6][i], qh = u * [17, 24, 12, 10, 7][i], qw = u * [3, 3.8, 2.6, 3, 2][i], lean = d * [-0.1, 0.06, 0.24, -0.3, 0.34][i], col = cols[(i + s) % 3];
        c.save(); c.translate(qx, qy); c.rotate(lean); if (i === 1) glow(c, 0, -qh * 0.5, qh * 0.9, col, 0.2 + 0.12 * kb);
        poly(c, [[-qw, 0], [-qw, -qh * 0.78], [0, -qh], [qw, -qh * 0.78], [qw, 0]], col); poly(c, [[0, 0], [0, -qh], [qw, -qh * 0.78], [qw, 0]], shade(col, -0.22)); poly(c, [[-qw, -qh * 0.78], [0, -qh], [0, -qh * 0.62]], shade(col, 0.35)); c.restore(); }
      for (i = 0; i < 3; i++) { var gx = ex + d * u * [24, 29, 34][i], gyy = top2(gx) + u * 3, gh = u * [9, 13, 7][i], swy = Math.sin(t * 1.1 + i * 2 + s) * u * 1.2, on = (i + o.n + s) % 2 === 0; c.beginPath(); c.moveTo(gx, gyy); c.quadraticCurveTo(gx + d * u * 2, gyy - gh * 0.6, gx + swy, gyy - gh); c.lineWidth = u * 0.6; c.lineCap = 'round'; c.strokeStyle = shade(surf, -0.36); c.stroke(); glow(c, gx + swy, gyy - gh, u * (4.4 + (on ? kb * 2 : 0)), cols[(i + 1) % 3], on ? 0.5 : 0.28); dot(c, gx + swy, gyy - gh, u * 1.4, mix(cols[(i + 1) % 3], '#ffffff', 0.45)); }
    }
    rock(c, W * 0.24, H * 0.985, u * 9, u * 3.6, shade(surf, -0.24)); rock(c, W * 0.8, H * 0.99, u * 11, u * 4, shade(surf, -0.28));
  }, { variants: ['one'], stage: 'band-low', pal: 'dark' });

  /* ---------- moonbase: the moon's surface, the earth in its sky ---------- */
  function dome(c, x, base, r, col, glass, lit, u, t, ph) {
    var i; glow(c, x, base - r * 0.4, r * 1.9, lit, 0.16);
    c.beginPath(); c.arc(x, base, r, PI, 0); c.closePath(); c.fillStyle = glass; c.fill();
    c.save(); c.beginPath(); c.arc(x, base, r, PI, 0); c.closePath(); c.clip();
    for (i = 0; i < 5; i++) { var wx = x - r * 0.72 + i * r * 0.36, on = (i * 3 + Math.floor(ph)) % 4 !== 0; Rn(c, wx - r * 0.1, base - r * 0.42, r * 0.2, r * 0.22, r * 0.04, on ? alpha(lit, 0.85 + 0.15 * Math.sin(t * 2 + i + ph)) : shade(glass, -0.2)); }
    el(c, x - r * 0.4, base - r * 0.72, r * 0.34, r * 0.13, alpha('#ffffff', 0.4), -0.6); c.restore();
    c.strokeStyle = col; c.lineWidth = r * 0.07; c.beginPath(); c.arc(x, base, r, PI, 0); c.stroke(); c.lineWidth = r * 0.04; c.beginPath(); c.ellipse(x, base, r * 0.5, r, 0, PI, 0); c.stroke(); c.beginPath(); c.moveTo(x, base); c.lineTo(x, base - r); c.stroke(); c.beginPath(); c.arc(x, base + r * 0.9, r * 1.5, PI * 1.27, PI * 1.73); c.stroke();
    Rn(c, x - r * 1.1, base - r * 0.14, r * 2.2, r * 0.26, r * 0.06, col); Rn(c, x - r * 1.1, base - r * 0.14, r * 2.2, r * 0.08, r * 0.04, shade(col, 0.25));
  }
  Art.add('backdrop', 'moonbase', function (c, W, H, t, p, o, u) {
    u = unit(W, H);
    var i, R0 = rnd(o.seed + 'mb'), hz = H * 0.625, kb = Math.exp(-5 * o.beat), grey = mix('#c6cad8', p.bg2, 0.2), metal = mix('#e8ecf4', p.paper, 0.4), lit = mix(p.gold, '#fff0b0', 0.4), dark = mix(p.ink, '#1c2038', 0.5);
    vgrad(c, W, H, [mix(p.bg, '#02030c', 0.86), mix(p.bg, '#0a0c26', 0.72), mix(p.bg, '#1c1e48', 0.56)], 0, hz);
    skyStars(c, W, H, 140, o.seed, t, hz, p.snow); glow(c, W * 0.7, H * 0.3, u * 46, p.accent2, 0.07); glow(c, W * 0.4, H * 0.45, u * 40, p.accent, 0.06);
    /* the earth, a blue marble hung in the black */
    var ex = W * 0.21, ey = H * 0.145, er = u * 12.5, sea = mix('#2f86e0', p.bg, 0.12), land = mix('#5fbf6a', p.accent2, 0.3);
    glow(c, ex, ey, er * 2.3, '#7ab8ff', 0.3); dot(c, ex, ey, er * 1.045, alpha('#a8d4ff', 0.5)); dot(c, ex, ey, er, sea);
    c.save(); c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.clip();
    var dr = Math.sin(t * 0.05) * er * 0.12;
    blob(c, [[ex - er * 0.7 + dr, ey - er * 0.6], [ex - er * 0.2 + dr, ey - er * 0.8], [ex + er * 0.05 + dr, ey - er * 0.4], [ex - er * 0.2 + dr, ey - er * 0.05], [ex - er * 0.05 + dr, ey + er * 0.5], [ex - er * 0.35 + dr, ey + er * 0.7], [ex - er * 0.45 + dr, ey + er * 0.1], [ex - er * 0.8 + dr, ey - er * 0.2]], land);
    blob(c, [[ex + er * 0.3 + dr, ey - er * 0.5], [ex + er * 0.8 + dr, ey - er * 0.55], [ex + er * 0.95 + dr, ey - er * 0.1], [ex + er * 0.6 + dr, ey + er * 0.3], [ex + er * 0.4 + dr, ey + er * 0.05]], shade(land, -0.08)); blob(c, [[ex + er * 0.4 + dr, ey + er * 0.5], [ex + er * 0.7 + dr, ey + er * 0.45], [ex + er * 0.6 + dr, ey + er * 0.8]], land);
    el(c, ex, ey - er * 0.96, er * 0.5, er * 0.14, '#f4f8ff'); el(c, ex, ey + er * 0.98, er * 0.4, er * 0.12, '#f4f8ff');
    for (i = 0; i < 6; i++) { var cxx = ex + er * [-0.5, 0.2, 0.55, -0.1, -0.6, 0.3][i] + Math.sin(t * 0.07 + i) * er * 0.14, cyy = ey + er * [-0.3, -0.55, 0.15, 0.25, 0.5, 0.66][i]; el(c, cxx, cyy, er * [0.4, 0.3, 0.34, 0.44, 0.26, 0.3][i], er * 0.07, alpha('#ffffff', 0.8), [0.3, -0.2, 0.4, -0.3, 0.2, -0.1][i]); el(c, cxx + er * 0.14, cyy + er * 0.07, er * 0.2, er * 0.05, alpha('#ffffff', 0.7), 0.2); }
    el(c, ex + er * 0.62, ey + er * 0.4, er * 1.1, er * 1.2, alpha('#03040f', 0.5)); el(c, ex - er * 0.42, ey - er * 0.46, er * 0.36, er * 0.2, alpha('#ffffff', 0.16), -0.7); c.restore();
    /* far rims of old craters along the horizon */
    var farc = mix(grey, '#3a3f66', 0.42), midc = mix(grey, '#3a3f66', 0.2);
    blob(c, [[-u * 4, hz + u * 2], [W * 0.05, hz - u * 5], [W * 0.18, hz - u * 6.4], [W * 0.3, hz - u * 2.4], [W * 0.44, hz - u * 1], [W * 0.5, hz + u * 2]], farc); blob(c, [[W * 0.46, hz + u * 2], [W * 0.6, hz - u * 2], [W * 0.74, hz - u * 5], [W * 0.9, hz - u * 7.5], [W + u * 4, hz - u * 4], [W + u * 4, hz + u * 2]], farc);
    hill(c, W, H, hz, u * 0.9, midc, o.seed + 'a', 0.7);
    /* the base: two domes, a tube between, a mast, a dish and a field of panels */
    var by = hz + u * 3.2, d1 = W * 0.85, d2 = W * 0.64;
    zoom(c, W * 0.96, by, 1.4);
    Rn(c, d2, by - u * 3, d1 - d2, u * 2.4, u * 1.2, shade(metal, -0.2)); for (i = 1; i < 6; i++) Rn(c, d2 + (d1 - d2) * i / 6, by - u * 3, u * 0.4, u * 2.4, 0, shade(metal, -0.36));
    var mx = W * 0.745, mh = u * 21; L(c, mx, by - u * 2.8, mx, by - mh, u * 0.5, shade(metal, -0.3)); L(c, mx - u * 2, by - mh * 0.6, mx + u * 2, by - mh * 0.6, u * 0.4, shade(metal, -0.3)); L(c, mx - u * 1.2, by - mh * 0.78, mx + u * 1.2, by - mh * 0.78, u * 0.4, shade(metal, -0.3));
    var bl = (o.n % 2 === 0) ? 1 : 0.25; glow(c, mx, by - mh, u * (3 + kb * 2) * bl + u, p.accent, 0.6 * bl); dot(c, mx, by - mh, u * 0.8, bl > 0.5 ? mix(p.accent, '#ffffff', 0.3) : shade(p.accent, -0.3));
    dome(c, d2, by, u * 6.4, metal, mix(sea, '#0e1430', 0.55), lit, u, t, 1); dome(c, d1, by, u * 10.5, metal, mix(sea, '#0e1430', 0.55), lit, u, t, 2);
    Rn(c, d1 - u * 2.2, by - u * 4.6, u * 4.4, u * 4.6, u * 2, shade(metal, -0.3)); Rn(c, d1 - u * 1.5, by - u * 3.8, u * 3, u * 3.8, u * 1.4, alpha(lit, 0.9));
    var dx = W * 0.975, dy = by - u * 11; L(c, dx, by, dx, dy, u * 0.6, shade(metal, -0.3)); c.save(); c.translate(dx, dy); c.rotate(-0.7 + Math.sin(t * 0.2) * 0.15); c.beginPath(); c.arc(0, 0, u * 4, 0, PI); c.closePath(); c.fillStyle = metal; c.fill(); L(c, 0, 0, 0, -u * 2.6, u * 0.3, shade(metal, -0.3)); dot(c, 0, -u * 2.6, u * 0.6, p.accent2); c.restore();
    for (i = 0; i < 2; i++) { var sx = W * 0.51 + i * u * 6.2, sy = by + u * 1; L(c, sx, sy, sx, sy - u * 3, u * 0.4, shade(metal, -0.3)); quad(c, sx - u * 2.7, sy - u * 5.6, sx + u * 2.3, sy - u * 6.6, sx + u * 2.7, sy - u * 3, sx - u * 2.3, sy - u * 2, mix(p.accent2, '#2a4a9a', 0.6)); L(c, sx - u * 2.5, sy - u * 3.8, sx + u * 2.5, sy - u * 4.8, u * 0.2, alpha('#ffffff', 0.5)); L(c, sx, sy - u * 6.1, sx, sy - u * 2.5, u * 0.2, alpha('#ffffff', 0.5)); }
    c.restore();
    var stx = frac(t * 0.006 + 0.56) * (W + u * 30) - u * 15, sty = H * 0.085 + Math.sin(t * 0.2) * u * 2; /* a satellite goes over */
    c.save(); c.translate(stx, sty); c.rotate(-0.3); Rn(c, -u * 5.4, -u * 1, u * 3.8, u * 2, 0, mix(p.accent2, '#2a4a9a', 0.5)); Rn(c, u * 1.6, -u * 1, u * 3.8, u * 2, 0, mix(p.accent2, '#2a4a9a', 0.5)); L(c, -u * 3.5, -u * 1, -u * 3.5, u * 1, u * 0.15, alpha('#ffffff', 0.5)); L(c, u * 3.5, -u * 1, u * 3.5, u * 1, u * 0.15, alpha('#ffffff', 0.5)); Rn(c, -u * 1.6, -u * 1.4, u * 3.2, u * 2.8, u * 0.5, metal); L(c, 0, -u * 1.4, 0, -u * 3, u * 0.25, metal); dot(c, 0, -u * 3.1, u * 0.45, (o.n % 2) ? p.accent : shade(p.accent, -0.3)); dot(c, 0, 0, u * 0.7, p.gold); c.restore();
    /* the ground, craters and all */
    hill(c, W, H, hz + u * 4, u * 1.2, mix(grey, '#3a3f66', 0.08), o.seed + 'b', 0.9); var f2 = hill(c, W, H, H * 0.7, u * 1.6, grey, o.seed + 'c', 0.7);
    var gg = c.createLinearGradient(0, H * 0.7, 0, H); gg.addColorStop(0, alpha(shade(grey, 0.3), 0.5)); gg.addColorStop(0.3, alpha(grey, 0)); gg.addColorStop(1, alpha(shade(grey, -0.3), 0.45)); c.fillStyle = gg; c.fillRect(0, H * 0.7, W, H * 0.3);
    for (i = 0; i < 13; i++) { var kx = W * [0.36, 0.56, 0.72, 0.24, 0.46, 0.66, 0.9, 0.52, 0.08, 0.36, 0.7, 0.3, 0.6][i], ky = H * [0.672, 0.66, 0.685, 0.745, 0.77, 0.745, 0.79, 0.85, 0.83, 0.9, 0.9, 0.975, 0.965][i], kr = u * [2.2, 3, 2, 4.4, 3, 5, 3.6, 6.4, 4.4, 4, 7, 5, 4][i] * (0.55 + (ky / H - 0.66) * 3); crater(c, kx, ky, kr, kr * 0.3, grey); }
    c.fillStyle = alpha(shade(grey, -0.4), 0.3); for (i = 0; i < 60; i++) { c.beginPath(); c.arc(R0() * W, H * 0.69 + R0() * H * 0.31, u * (0.15 + R0() * 0.3), 0, TAU); c.fill(); }
    /* the lander on its legs, a plain flag beside it */
    var lx = W * 0.115, ly = f2(lx) + u * 2.4, rs = u * 11.5;
    el(c, lx + u * 5, ly + u * 0.6, u * 13, u * 1.2, alpha('#000000', 0.22));
    L(c, lx - rs * 0.3, ly - rs * 0.7, lx - rs * 0.86, ly, u * 0.7, shade(metal, -0.36)); L(c, lx + rs * 0.3, ly - rs * 0.7, lx + rs * 0.86, ly, u * 0.7, shade(metal, -0.36)); Rn(c, lx - rs * 1.06, ly - u * 0.4, rs * 0.4, u * 0.8, u * 0.4, shade(metal, -0.36)); Rn(c, lx + rs * 0.66, ly - u * 0.4, rs * 0.4, u * 0.8, u * 0.4, shade(metal, -0.36));
    (function () { var s0 = rs, x0 = lx, y0 = ly - rs * 1.42; poly(c, [[x0 - s0 * 0.4, y0 + s0 * 0.3], [x0 - s0 * 0.8, y0 + s0 * 0.98], [x0 - s0 * 0.36, y0 + s0 * 0.86]], p.accent); poly(c, [[x0 + s0 * 0.4, y0 + s0 * 0.3], [x0 + s0 * 0.8, y0 + s0 * 0.98], [x0 + s0 * 0.36, y0 + s0 * 0.86]], shade(p.accent, -0.16));
      c.beginPath(); c.moveTo(x0, y0 - s0 * 1.3); c.bezierCurveTo(x0 + s0 * 0.62, y0 - s0 * 0.7, x0 + s0 * 0.56, y0 + s0 * 0.4, x0 + s0 * 0.36, y0 + s0 * 0.92); c.lineTo(x0 - s0 * 0.36, y0 + s0 * 0.92); c.bezierCurveTo(x0 - s0 * 0.56, y0 + s0 * 0.4, x0 - s0 * 0.62, y0 - s0 * 0.7, x0, y0 - s0 * 1.3); c.closePath(); c.fillStyle = metal; c.fill();
      c.beginPath(); c.moveTo(x0, y0 - s0 * 1.3); c.bezierCurveTo(x0 + s0 * 0.62, y0 - s0 * 0.7, x0 + s0 * 0.56, y0 + s0 * 0.4, x0 + s0 * 0.36, y0 + s0 * 0.92); c.lineTo(x0 + s0 * 0.08, y0 + s0 * 0.92); c.bezierCurveTo(x0 + s0 * 0.3, y0 + s0 * 0.3, x0 + s0 * 0.3, y0 - s0 * 0.7, x0, y0 - s0 * 1.3); c.closePath(); c.fillStyle = shade(metal, -0.14); c.fill();
      c.beginPath(); c.moveTo(x0, y0 - s0 * 1.3); c.bezierCurveTo(x0 + s0 * 0.34, y0 - s0 * 0.98, x0 + s0 * 0.44, y0 - s0 * 0.76, x0 + s0 * 0.46, y0 - s0 * 0.62); c.lineTo(x0 - s0 * 0.46, y0 - s0 * 0.62); c.bezierCurveTo(x0 - s0 * 0.44, y0 - s0 * 0.76, x0 - s0 * 0.34, y0 - s0 * 0.98, x0, y0 - s0 * 1.3); c.closePath(); c.fillStyle = p.accent; c.fill();
      Rn(c, x0 - s0 * 0.42, y0 + s0 * 0.56, s0 * 0.84, s0 * 0.14, 0, p.accent); dot(c, x0, y0 - s0 * 0.14, s0 * 0.28, shade(metal, -0.36)); dot(c, x0, y0 - s0 * 0.14, s0 * 0.21, alpha(lit, 0.95)); dot(c, x0 - s0 * 0.07, y0 - s0 * 0.2, s0 * 0.07, 'rgba(255,255,255,0.7)'); Rn(c, x0 - s0 * 0.2, y0 + s0 * 0.92, s0 * 0.4, s0 * 0.16, 0, shade(metal, -0.4)); })();
    var fx = W * 0.25, fy = f2(fx) + u * 2.4; L(c, fx, fy, fx, fy - u * 20, u * 0.6, metal); Rn(c, fx, fy - u * 20, u * 10.5, u * 6.6, u * 0.3, p.accent2); Rn(c, fx + u * 7, fy - u * 20, u * 3.5, u * 6.6, u * 0.3, shade(p.accent2, -0.12)); K.starPath(c, fx + u * 4.4, fy - u * 16.7, u * 2.1, u * 0.9, 5, 0); c.fillStyle = p.gold; c.fill(); dot(c, fx, fy - u * 20.3, u * 0.7, p.gold);
    for (i = 0; i < 9; i++) { var px = fx + u * 2 + i * u * 3.4, py = fy + u * 1.4 + i * u * 1.7 + (i % 2) * u * 0.5; el(c, px, py, u * (0.8 + i * 0.07), u * (0.42 + i * 0.03), alpha(shade(grey, -0.5), 0.4), 0.3); } /* bootprints */
    /* the rover, bottom right, and the tracks it left */
    var rx = W * 0.82, ry = H * 0.955, bob = Math.sin(t * 5) * u * 0.1;
    c.strokeStyle = alpha(shade(grey, -0.45), 0.35); c.lineWidth = u * 0.9; c.setLineDash([u * 0.8, u * 0.7]); for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(rx - u * 6 + i * u * 0.2, ry + i * u * 0.9); c.quadraticCurveTo(W * 0.56, ry + u * 1 + i * u * 0.9, W * 0.46, H * 0.83 + i * u * 0.5); c.quadraticCurveTo(W * 0.4, H * 0.76, W * 0.5, H * 0.715); c.stroke(); } c.setLineDash([]);
    zoom(c, rx, ry + u * 2.5, 1.45);
    el(c, rx, ry + u * 1.6, u * 11, u * 1.2, alpha('#000000', 0.25));
    for (i = -1; i <= 1; i++) { dot(c, rx + i * u * 6.4, ry, u * 2.5, dark); dot(c, rx + i * u * 6.4, ry, u * 1.3, shade(metal, -0.2)); c.save(); c.translate(rx + i * u * 6.4, ry); c.rotate(t * 0.6); L(c, -u * 1.2, 0, u * 1.2, 0, u * 0.3, dark); L(c, 0, -u * 1.2, 0, u * 1.2, u * 0.3, dark); c.restore(); }
    Rn(c, rx - u * 8.4, ry - u * 6.4 + bob, u * 16.8, u * 4.6, u * 1.4, metal); Rn(c, rx - u * 8.4, ry - u * 3.6 + bob, u * 16.8, u * 1.8, u * 0.9, shade(metal, -0.16)); Rn(c, rx - u * 8.4, ry - u * 4.5 + bob, u * 16.8, u * 0.9, 0, p.accent);
    Rn(c, rx - u * 0.6, ry - u * 11 + bob, u * 7, u * 5.2, u * 2.2, mix(sea, '#0e1430', 0.5)); el(c, rx + u * 1.6, ry - u * 9.4 + bob, u * 1.6, u * 0.7, alpha('#ffffff', 0.4), -0.5); glow(c, rx + u * 9, ry - u * 4.6, u * 5, lit, 0.4); dot(c, rx + u * 8.3, ry - u * 4.8 + bob, u * 0.9, lit);
    L(c, rx - u * 5, ry - u * 6.2 + bob, rx - u * 5.8, ry - u * 13 + bob, u * 0.4, shade(metal, -0.3)); c.save(); c.translate(rx - u * 5.8, ry - u * 13 + bob); c.rotate(0.5); c.beginPath(); c.arc(0, 0, u * 2.6, 0, PI); c.closePath(); c.fillStyle = shade(metal, -0.08); c.fill(); dot(c, 0, -u * 1.4, u * 0.5, p.accent); c.restore();
    c.restore();
    rock(c, W * 0.07, H * 0.985, u * 10, u * 4.4, shade(grey, -0.2)); rock(c, W * 0.2, H * 0.995, u * 6, u * 2.4, shade(grey, -0.12));
  }, { variants: ['one'], stage: 'band-low', pal: 'dark' });

  /* ---------- cloudland: a kingdom on the clouds ---------- */
  function cloudBank(c, W, H, y, r, col, hi, seed, off) { /* a rolling bank of cloud from y down to the bottom */
    var R0 = rnd(seed + 'cb'), x = -r * 2 + off, pts = [], i;
    c.fillStyle = col; c.beginPath();
    while (x < W + r * 2) { var rr = r * (0.62 + R0() * 0.6), cy = y + r * 0.9 - rr * 0.5 + R0() * r * 0.3; c.moveTo(x + rr, cy); c.arc(x, cy, rr, 0, TAU); pts.push([x, cy, rr]); x += rr * (1 + R0() * 0.3); }
    c.rect(0, y + r * 0.9, W, H - y); c.fill();
    c.fillStyle = hi; c.beginPath(); for (i = 0; i < pts.length; i += 2) { var q = pts[i]; c.moveTo(q[0] + q[2] * 0.4, q[1] - q[2] * 0.3); c.ellipse(q[0] - q[2] * 0.1, q[1] - q[2] * 0.3, q[2] * 0.6, q[2] * 0.42, -0.3, 0, TAU); } c.fill();
  }
  function tower(c, x, base, w, h, rh, wall, roof, win, t, flag, ph, cren) {
    Rn(c, x - w / 2, base - h, w, h, 0, wall); Rn(c, x + w * 0.16, base - h, w * 0.34, h, 0, shade(wall, -0.1)); Rn(c, x - w * 0.4, base - h, w * 0.12, h, 0, shade(wall, 0.12));
    if (cren) { var i; Rn(c, x - w * 0.64, base - h - w * 0.1, w * 1.28, w * 0.34, 0, wall); for (i = 0; i < 4; i++) Rn(c, x - w * 0.64 + i * w * 0.346, base - h - w * 0.38, w * 0.24, w * 0.3, 0, wall); Rn(c, x - w * 0.64, base - h + w * 0.2, w * 1.28, w * 0.07, 0, shade(wall, -0.2)); }
    else { Rn(c, x - w * 0.62, base - h - w * 0.04, w * 1.24, w * 0.24, w * 0.06, shade(wall, 0.1)); poly(c, [[x - w * 0.74, base - h - w * 0.02], [x + w * 0.74, base - h - w * 0.02], [x, base - h - rh]], roof); poly(c, [[x + w * 0.1, base - h - w * 0.02], [x + w * 0.74, base - h - w * 0.02], [x, base - h - rh]], shade(roof, -0.16)); }
    var top = base - h - (cren ? w * 0.38 : rh), wv = Math.sin(t * 3.4 + ph) * w * 0.07;
    if (flag) { L(c, x, top + w * 0.06, x, top - w * 0.8, Math.max(0.6, w * 0.06), shade(wall, -0.45)); poly(c, [[x, top - w * 0.8], [x + w * 0.74, top - w * 0.62 + wv], [x + w * 0.5, top - w * 0.5 + wv * 0.6], [x + w * 0.74, top - w * 0.36 + wv], [x, top - w * 0.34]], flag); }
    if (win) { Rn(c, x - w * 0.15, base - h * 0.78, w * 0.3, w * 0.52, w * 0.15, win); if (h > w * 3.4) Rn(c, x - w * 0.15, base - h * 0.42, w * 0.3, w * 0.52, w * 0.15, win); }
  }
  Art.add('backdrop', 'cloudland', function (c, W, H, t, p, o, u) {
    u = unit(W, H);
    var v = o.variant, dusk = v === 'dusk', i, R0 = rnd(o.seed + 'cd'), kb = Math.exp(-5 * o.beat), low = sky(c, W, H, p, v, H * 0.86),
      cl = dusk ? mix(p.snow, '#ffc2a8', 0.36) : p.snow, clS = dusk ? mix(mix(p.snow, '#b890d8', 0.5), p.bg, 0.16) : mix(p.snow, p.bg, 0.3), wall = dusk ? mix(p.paper, '#ffc8b0', 0.3) : p.paper, win = dusk ? '#ffe08a' : mix(p.bg, '#3a4a8a', 0.35),
      bow = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db9c', '#6aa8ff', '#b58cf0'];
    if (dusk) {
      skyStars(c, W, H, 60, o.seed, t, H * 0.5, p.snow); shootingStar(c, W, H, t, u, p.snow, 10, 0.5, 0.05);
      var mx = W * 0.2, my = H * 0.12, mr = u * 7.5, mc = mix(p.gold, '#fff3c4', 0.6); glow(c, mx, my, mr * 3.4, mc, 0.28); /* a sleepy crescent */
      c.save(); c.translate(mx, my); c.rotate(-0.4 + Math.sin(t * 0.5) * 0.04); c.beginPath(); c.arc(0, 0, mr, PI * 0.3, PI * 1.7); c.bezierCurveTo(mr * 0.16, -mr * 0.55, mr * 0.16, mr * 0.55, mr * 0.59, mr * 0.81); c.closePath(); c.fillStyle = mc; c.fill();
      c.beginPath(); c.arc(-mr * 0.4, -mr * 0.12, mr * 0.16, 0.1 * PI, 0.9 * PI); c.lineWidth = mr * 0.07; c.lineCap = 'round'; c.strokeStyle = shade(mc, -0.45); c.stroke(); c.beginPath(); c.arc(-mr * 0.34, mr * 0.3, mr * 0.13, 0.15 * PI, 0.8 * PI); c.stroke(); el(c, -mr * 0.64, mr * 0.14, mr * 0.13, mr * 0.09, alpha(p.accent, 0.5)); c.restore();
      streaks(c, W, t, o.seed, 5, H * 0.3, H * 0.56, u, mix(p.accent, '#ffd0a0', 0.5));
    } else {
      sunDisc(c, W * 0.8, H * 0.1, u * 7, t, mix(p.gold, '#fff3b0', 0.4), 1);
      c.lineCap = 'butt'; for (i = 0; i < 6; i++) { c.beginPath(); c.arc(W * 0.1, H * 0.74, u * (57 - i * 2.2), PI * 1.02, PI * 1.98); c.lineWidth = u * 2.3; c.strokeStyle = alpha(mix(bow[i], p.bg2, 0.12), 0.62); c.stroke(); } c.lineCap = 'round'; /* the rainbow lands in the clouds */
      gulls(c, W, H, t, u, alpha(p.ink, 0.45), H * 0.36);
    }
    for (i = 0; i < 14; i++) { var sx = R0() * W, sy = H * (0.05 + R0() * 0.55), tw = 0.5 + 0.5 * Math.sin(t * (1.2 + R0() * 2) + i); if (Math.abs(sx - W / 2) < W * 0.26) continue; twinkle(c, sx, sy, u * (0.8 + tw * 1.4), alpha(i % 2 ? p.gold : p.snow, 0.5 + 0.4 * tw)); }
    clouds(c, W, t, o.seed, 4, H * 0.08, H * 0.3, u * 18, u * 30, alpha(cl, 0.8), 0.004);
    /* a little watchtower on its own cloud, left */
    var fx = W * 0.13, fy = H * 0.42 + Math.sin(t * 0.6) * u * 0.8;
    tower(c, fx - u * 2.4, fy, u * 4.4, u * 9, u * 6, wall, p.accent2, win, t, p.gold, 1); tower(c, fx + u * 3, fy, u * 3.4, u * 5.4, u * 4.4, shade(wall, -0.05), p.accent, win, t, null, 2);
    if (dusk) glow(c, fx - u * 2.4, fy - u * 6, u * 5, '#ffe08a', 0.4);
    cloud(c, fx + u * 0.5, fy + u * 1.4, u * 25, clS); cloud(c, fx - u * 1, fy + u * 0.3, u * 21, cl);
    /* the cloud castle, right, on the far bank */
    cloudBank(c, W, H, H * 0.6, u * 7, mix(clS, low, 0.5), mix(cl, low, 0.4), o.seed + 1, Math.sin(t * 0.13) * u * 3);
    var kx = W * 0.8, kyb = H * 0.61, s = u * 1.25, rf = [p.accent, p.accent2, mix(p.accent, p.gold, 0.5)];
    tower(c, kx + s * 5.4, kyb - s * 3, s * 3, s * 21, s * 7, shade(wall, -0.06), rf[1], win, t, p.accent, 0); tower(c, kx - s * 6, kyb - s * 2, s * 3.4, s * 16, s * 6, shade(wall, -0.06), rf[2], win, t, p.accent2, 2);
    tower(c, kx - s * 0.4, kyb - s * 3, s * 6, s * 19, s * 9, wall, rf[0], win, t, p.gold, 1);
    Rn(c, kx - s * 10, kyb - s * 8, s * 20, s * 9, 0, wall); Rn(c, kx - s * 10, kyb - s * 8, s * 20, s * 0.7, 0, shade(wall, -0.12)); for (i = 0; i < 9; i++) Rn(c, kx - s * 10 + i * s * 2.3, kyb - s * 9.3, s * 1.5, s * 1.4, s * 0.2, wall);
    for (i = -1; i <= 1; i += 2) Rn(c, kx + i * s * 5 - s * 0.9, kyb - s * 5.6, s * 1.8, s * 2.8, s * 0.9, win);
    c.beginPath(); c.moveTo(kx - s * 2.2, kyb + s); c.lineTo(kx - s * 2.2, kyb - s * 3.6); c.arc(kx, kyb - s * 3.6, s * 2.2, PI, 0); c.lineTo(kx + s * 2.2, kyb + s); c.closePath(); c.fillStyle = shade(p.gold, -0.1); c.fill(); c.beginPath(); c.moveTo(kx - s * 1.6, kyb + s); c.lineTo(kx - s * 1.6, kyb - s * 3.5); c.arc(kx, kyb - s * 3.5, s * 1.6, PI, 0); c.lineTo(kx + s * 1.6, kyb + s); c.closePath(); c.fillStyle = dusk ? '#ffe9a8' : mix(p.accent2, '#3a2a5a', 0.5); c.fill();
    tower(c, kx - s * 10, kyb + s, s * 4.4, s * 14, s * 6, wall, rf[1], win, t, p.gold, 3); tower(c, kx + s * 10, kyb + s, s * 4.4, s * 15.5, s * 6.4, wall, rf[0], win, t, p.accent2, 4);
    if (dusk) { glow(c, kx, kyb - s * 6, s * 22, '#ffd98a', 0.22); }
    cloudBank(c, W, H, H * 0.645, u * 8, clS, mix(cl, clS, 0.5), o.seed + 2, Math.sin(t * 0.17 + 1) * u * 3);
    for (i = 0; i < 5; i++) { var px = W * (0.34 + i * 0.085), py = H * (0.7 - i * 0.012) + Math.sin(t * 0.8 + i) * u * 0.4, pw = u * (11 - i * 1.5); cloud(c, px, py, pw, i % 2 ? cl : mix(cl, clS, 0.4)); } /* stepping clouds to the gate */
    cloudBank(c, W, H, H * 0.715, u * 10, mix(cl, clS, 0.45), cl, o.seed + 3, Math.sin(t * 0.2 + 2) * u * 3);
    /* lamp posts with star lanterns on the near bank, both sides */
    for (i = 0; i < 2; i++) { /* golden lamp posts with star lanterns, one each side */
      var d = i ? -1 : 1, lx = W * (i ? 0.94 : 0.06), ly = H * 0.815, on = dusk || (i + o.n) % 2 === 0, gd = shade(p.gold, -0.1), hx = lx + d * u * 7, hy = ly - u * 22 + Math.sin(t * 1.2 + i) * u * 0.3;
      Rn(c, lx - u * 0.8, ly - u * 28, u * 1.6, u * 30, u * 0.5, gd); Rn(c, lx - u * 0.8, ly - u * 28, u * 0.5, u * 30, u * 0.25, shade(p.gold, 0.3)); Rn(c, lx - u * 1.4, ly - u * 16, u * 2.8, u * 1, u * 0.5, gd); dot(c, lx, ly - u * 28.6, u * 1.4, gd); dot(c, lx - u * 0.4, ly - u * 29, u * 0.5, shade(p.gold, 0.4));
      c.beginPath(); c.moveTo(lx, ly - u * 26); c.quadraticCurveTo(lx + d * u * 6.6, ly - u * 30, hx, ly - u * 26); c.lineWidth = u * 0.9; c.lineCap = 'round'; c.strokeStyle = gd; c.stroke(); L(c, hx, ly - u * 26, hx, hy - u * 3, u * 0.35, gd);
      glow(c, hx, hy, u * (9 + kb * 2), p.gold, dusk ? 0.55 : 0.28); K.starPath(c, hx, hy, u * 3.6, u * 1.7, 5, Math.sin(t * 1.2 + i) * 0.15); c.fillStyle = on ? mix(p.gold, '#ffffff', 0.45) : p.gold; c.fill(); c.lineJoin = 'round'; c.lineWidth = u * 0.5; c.strokeStyle = gd; c.stroke();
    }
    cloudBank(c, W, H, H * 0.81, u * 12, mix(cl, clS, 0.22), cl, o.seed + 4, Math.sin(t * 0.24 + 3) * u * 4);
    cloudBank(c, W, H, H * 0.915, u * 13, mix(cl, '#ffffff', 0.3), mix(cl, '#ffffff', 0.85), o.seed + 5, Math.sin(t * 0.3 + 4) * u * 4);
    for (i = 0; i < 10; i++) { var qx = W * [0.05, 0.16, 0.27, 0.74, 0.86, 0.95, 0.1, 0.9, 0.4, 0.62][i], qy = H * [0.9, 0.955, 0.985, 0.975, 0.93, 0.89, 0.86, 0.99, 0.965, 0.95][i], qt = 0.5 + 0.5 * Math.sin(t * (1.3 + (i % 3) * 0.5) + i * 1.9); twinkle(c, qx, qy, u * (1 + qt * 1.6), alpha(i % 3 ? p.gold : mix(p.accent, '#ffffff', 0.4), 0.45 + 0.5 * qt)); } /* star dust on the near clouds */
    var g = c.createLinearGradient(0, H * 0.72, 0, H); g.addColorStop(0, alpha(dusk ? mix(p.accent, '#ffb080', 0.5) : p.bg, 0)); g.addColorStop(1, alpha(dusk ? mix(p.accent, '#ffb080', 0.5) : p.bg, 0.16)); c.fillStyle = g; c.fillRect(0, H * 0.72, W, H * 0.28);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- castle: a storybook castle on its hill ---------- */
  function ribbon(c, x0, y0, x1, y1, x2, y2, x3, y3, w0, w1, col) { /* a path that narrows as it goes: a bezier drawn as beads */
    var i, n = 26, px = x0, py = y0; c.lineCap = 'round';
    for (i = 1; i <= n; i++) { var f = i / n, g = 1 - f, x = g * g * g * x0 + 3 * g * g * f * x1 + 3 * g * f * f * x2 + f * f * f * x3, y = g * g * g * y0 + 3 * g * g * f * y1 + 3 * g * f * f * y2 + f * f * f * y3; L(c, px, py, x, y, w0 + (w1 - w0) * f, col); px = x; py = y; }
  }
  function oak(c, x, y, h, col, trunk, fruit, t, ph) {
    var sw = Math.sin(t * 0.7 + ph) * h * 0.008, r = h * 0.3, i;
    poly(c, [[x - h * 0.07, y], [x + h * 0.07, y], [x + h * 0.035 + sw, y - h * 0.5], [x - h * 0.035 + sw, y - h * 0.5]], trunk); L(c, x, y - h * 0.36, x + h * 0.16 + sw, y - h * 0.54, h * 0.03, trunk); L(c, x, y - h * 0.3, x - h * 0.15 + sw, y - h * 0.5, h * 0.028, trunk); poly(c, [[x - h * 0.07, y], [x - h * 0.12, y + h * 0.015], [x + h * 0.12, y + h * 0.015], [x + h * 0.07, y]], trunk);
    el(c, x - r * 0.8 + sw, y - h * 0.55, r * 0.8, r * 0.7, shade(col, -0.16)); el(c, x + r * 0.84 + sw, y - h * 0.57, r * 0.78, r * 0.68, shade(col, -0.1)); el(c, x + sw, y - h * 0.72, r * 1.12, r * 0.98, col); el(c, x - r * 0.5 + sw, y - h * 0.86, r * 0.6, r * 0.46, shade(col, 0.14)); el(c, x + r * 0.5 + sw, y - h * 0.68, r * 0.36, r * 0.26, shade(col, 0.1)); el(c, x - r * 0.9 + sw, y - h * 0.62, r * 0.3, r * 0.22, shade(col, 0.02));
    if (fruit) for (i = 0; i < 9; i++) dot(c, x + sw + Math.cos(i * 2.4) * r * (0.3 + (i % 3) * 0.3), y - h * 0.7 + Math.sin(i * 2.4) * r * (0.24 + (i % 3) * 0.22), h * 0.016, fruit);
  }
  function toadstool(c, x, y, s, cap, stem, lean) { c.save(); c.translate(x, y); c.rotate(lean); Rn(c, -s * 0.2, -s, s * 0.4, s, s * 0.16, stem); c.beginPath(); c.moveTo(-s * 0.8, -s * 0.9); c.quadraticCurveTo(-s * 0.74, -s * 1.9, 0, -s * 1.9); c.quadraticCurveTo(s * 0.74, -s * 1.9, s * 0.8, -s * 0.9); c.quadraticCurveTo(0, -s * 0.7, -s * 0.8, -s * 0.9); c.fillStyle = cap; c.fill(); dot(c, -s * 0.34, -s * 1.36, s * 0.14, stem); dot(c, s * 0.2, -s * 1.56, s * 0.12, stem); dot(c, s * 0.42, -s * 1.14, s * 0.1, stem); dot(c, -s * 0.02, -s * 1.1, s * 0.08, stem); c.restore(); }
  function tinyDragon(c, x, y, s, t, col, dir) {
    var fp = Math.sin(t * 5); c.save(); c.translate(x, y); c.scale(dir, 1); c.rotate(Math.sin(t * 0.8) * 0.12);
    poly(c, [[-s * 0.3, 0], [s * 0.34, -s * 0.06], [-s * 0.24, -s * (0.9 + fp * 0.5)], [-s * 0.76, -s * (0.5 + fp * 0.5)]], shade(col, -0.2));
    c.beginPath(); c.moveTo(-s * 1.7, s * 0.34); c.quadraticCurveTo(-s * 0.8, -s * 0.34, 0, 0); c.quadraticCurveTo(s * 0.6, s * 0.3, s * 1.06, -s * 0.2); c.lineWidth = s * 0.3; c.lineCap = 'round'; c.strokeStyle = col; c.stroke();
    poly(c, [[-s * 1.6, s * 0.34], [-s * 2.06, s * 0.14], [-s * 1.94, s * 0.6]], col); el(c, s * 1.22, -s * 0.3, s * 0.36, s * 0.22, col, -0.3); poly(c, [[s * 1.02, -s * 0.44], [s * 0.94, -s * 0.76], [s * 1.2, -s * 0.5]], col);
    poly(c, [[-s * 0.1, -s * 0.02], [s * 0.54, 0], [s * 0.2, -s * (1 + fp * 0.6)], [-s * 0.4, -s * (0.64 + fp * 0.6)]], shade(col, 0.16)); c.restore();
  }
  Art.add('backdrop', 'castle', function (c, W, H, t, p, o, u) {
    u = unit(W, H);
    var v = o.variant, night = v === 'night', T = tinter(p, v), i, k, R0 = rnd(o.seed + 'ca'), hz = H * 0.615, kb = Math.exp(-5 * o.beat), low = sky(c, W, H, p, v, hz + u * 4),
      grass = T(mix(mix('#6cbc62', p.accent2, 0.45), p.bg2, 0.1), 0.5), wall = T(mix(p.paper, '#e6dccb', 0.3), 0.36), roof = T(p.accent, 0.3), roof2 = T(mix(p.accent, '#4a3a8a', 0.5), 0.3), win = night ? '#ffe08a' : mix(p.ink, '#3a4a7a', 0.4),
      riv = T(mix(mix('#4aa8e0', p.bg, 0.4), '#ffffff', 0.1), 0.5), stone = T(mix('#b8b4c0', p.bg2, 0.2), 0.45), wood = T(mix('#8a5a36', p.ink, 0.15), 0.4), lit = '#ffd98a';
    if (night) { skyStars(c, W, H, 110, o.seed, t, hz, p.snow); moonDisc(c, W * 0.22, H * 0.115, u * 7, mix(p.snow, '#fff0c4', 0.5)); shootingStar(c, W, H, t, u, p.snow, 9, 0.42, 0.05); streaks(c, W, t, o.seed, 3, H * 0.2, H * 0.4, u, p.snow); }
    else { sunDisc(c, W * 0.2, H * 0.1, u * 6.5, t, mix(p.gold, '#fff3b0', 0.4), 1); clouds(c, W, t, o.seed, 5, H * 0.05, H * 0.34, u * 16, u * 30, alpha(p.snow, 0.92)); gulls(c, W, H, t, u, alpha(p.ink, 0.5), H * 0.27); }
    /* far blue hills, a village with its own little tower */
    hill(c, W, H, hz - u * 7, u * 5, mix(mix(grass, '#6a7ac8', 0.5), low, 0.55), o.seed + 'a', 0.6); var f1 = hill(c, W, H, hz - u * 1, u * 4, mix(grass, low, 0.45), o.seed + 'b', 0.9);
    for (i = 0; i < 5; i++) { var vx = W * (0.14 + i * 0.045), vy = f1(vx) + u * 0.8, vh = u * (2.2 + (i % 2) * 1), vw = u * 3.2, vc = mix(wall, low, 0.3); Rn(c, vx, vy - vh, vw, vh, 0, vc); poly(c, [[vx - u * 0.5, vy - vh], [vx + vw / 2, vy - vh - u * 2.2], [vx + vw + u * 0.5, vy - vh]], mix(i % 2 ? roof : roof2, low, 0.3)); Rn(c, vx + vw * 0.36, vy - vh * 0.7, u * 0.9, u * 1, 0, night ? alpha(lit, 0.8 + 0.2 * Math.sin(t * 2 + i)) : mix(win, low, 0.4)); }
    tower(c, W * 0.105, f1(W * 0.105) + u, u * 2.6, u * 9, u * 4, mix(wall, low, 0.3), mix(roof, low, 0.3), night ? lit : mix(win, low, 0.4), t, mix(p.gold, low, 0.2), 5);
    /* the castle on its hill */
    blob(c, [[W * 0.3, hz + u * 11], [W * 0.46, hz + u * 2], [W * 0.62, hz - u * 2.4], [W * 0.82, hz - u * 2.6], [W * 1.02, hz + u * 1], [W * 1.1, hz + u * 11]], mix(grass, low, 0.16));
    var kx = W * 0.73, kyb = hz - u * 1.2, s = u * 1.42;
    if (night) glow(c, kx, kyb - s * 12, s * 34, mix(p.snow, p.accent2, 0.3), 0.1);
    tower(c, kx + s * 7.4, kyb - s * 5, s * 3.6, s * 23, s * 8, shade(wall, -0.1), roof2, win, t, T(p.gold, 0.2), 0); tower(c, kx - s * 7.6, kyb - s * 4, s * 4, s * 16, s * 6.4, shade(wall, -0.1), roof2, win, t, T(p.accent2, 0.2), 2);
    tower(c, kx - s * 0.6, kyb - s * 5, s * 8.4, s * 17, s * 9.4, shade(wall, -0.04), roof, win, t, T(p.gold, 0.2), 1);
    Rn(c, kx - s * 3.2, kyb - s * 15.6, s * 5.2, s * 0.7, s * 0.2, stone); for (i = 0; i < 5; i++) Rn(c, kx - s * 3 + i * s * 1.15, kyb - s * 17, s * 0.3, s * 1.5, 0, stone); /* a balcony */
    Rn(c, kx - s * 13, kyb - s * 8.4, s * 26, s * 9.4, 0, wall); Rn(c, kx - s * 13, kyb - s * 8.4, s * 26, s * 0.8, 0, shade(wall, -0.14)); for (i = 0; i < 12; i++) Rn(c, kx - s * 13 + i * s * 2.2, kyb - s * 9.8, s * 1.4, s * 1.5, 0, wall);
    c.fillStyle = alpha(shade(wall, -0.3), 0.3); for (i = 0; i < 22; i++) c.fillRect(kx - s * 12 + frac(i * 0.381) * s * 23, kyb - s * 7 + frac(i * 0.618) * s * 6.4, s * 1.3, s * 0.5);
    for (i = -1; i <= 1; i += 2) { Rn(c, kx + i * s * 6.4 - s * 0.7, kyb - s * 6.2, s * 1.4, s * 2.6, s * 0.7, win); if (night) glow(c, kx + i * s * 6.4, kyb - s * 5, s * 4, lit, 0.3); }
    c.beginPath(); c.moveTo(kx - s * 3, kyb + s); c.lineTo(kx - s * 3, kyb - s * 3.6); c.arc(kx, kyb - s * 3.6, s * 3, PI, 0); c.lineTo(kx + s * 3, kyb + s); c.closePath(); c.fillStyle = stone; c.fill();
    c.beginPath(); c.moveTo(kx - s * 2.2, kyb + s); c.lineTo(kx - s * 2.2, kyb - s * 3.5); c.arc(kx, kyb - s * 3.5, s * 2.2, PI, 0); c.lineTo(kx + s * 2.2, kyb + s); c.closePath(); c.fillStyle = night ? mix(lit, '#7a4a20', 0.3) : mix(wood, '#20141c', 0.4); c.fill();
    c.strokeStyle = alpha(shade(wood, -0.4), 0.8); c.lineWidth = s * 0.22; c.beginPath(); for (i = -1; i <= 1; i++) { c.moveTo(kx + i * s * 1.1, kyb + s); c.lineTo(kx + i * s * 1.1, kyb - s * (5.2 - Math.abs(i) * 0.5)); } for (i = 0; i < 3; i++) { c.moveTo(kx - s * 2.1, kyb - s * (0.4 + i * 1.5)); c.lineTo(kx + s * 2.1, kyb - s * (0.4 + i * 1.5)); } c.stroke();
    poly(c, [[kx - s * 1.7, kyb - s * 9.6], [kx + s * 1.7, kyb - s * 9.6], [kx + s * 1.7, kyb - s * 6.8], [kx, kyb - s * 5.8], [kx - s * 1.7, kyb - s * 6.8]], roof); K.starPath(c, kx, kyb - s * 7.9, s * 1.05, s * 0.45, 5, 0); c.fillStyle = T(p.gold, 0.2); c.fill(); /* a plain shield over the gate */
    tower(c, kx - s * 13, kyb + s, s * 5.4, s * 14, 0, wall, roof, win, t, roof, 3, true); tower(c, kx + s * 13, kyb + s, s * 5.4, s * 15.4, 0, wall, roof, win, t, roof, 4, true);
    for (i = -1; i <= 1; i += 2) { var tx = kx + i * s * 3.9, ty = kyb - s * 2.6; Rn(c, tx - s * 0.2, ty, s * 0.4, s * 1.8, 0, wood); if (night) { glow(c, tx, ty - s, s * 6, '#ffb45a', 0.4 + 0.06 * Math.sin(t * 7 + i)); flame(c, tx, ty, s * 1, s * 2.2, t, i); } }
    if (!night) tinyDragon(c, kx + s * 2 + Math.cos(t * 0.22) * s * 16, kyb - s * 30 + Math.sin(t * 0.44) * s * 3, u * 2.3, t, T(mix(p.accent2, '#2a7a6a', 0.3)), Math.sin(t * 0.22) < 0 ? 1 : -1);
    /* meadows, the river and its bridge, the road up to the gate */
    hill(c, W, H, H * 0.668, u * 1.6, mix(grass, low, 0.06), o.seed + 'c', 0.8);
    ribbon(c, kx, kyb + s * 0.6, kx - u * 3, hz + u * 6, W * 0.6, hz + u * 5, W * 0.57, H * 0.7, u * 3.6, u * 6, T(mix('#e6cf9a', p.bg2, 0.3), 0.45));
    c.lineCap = 'butt'; c.beginPath(); c.moveTo(-u * 2, H * 0.692); c.bezierCurveTo(W * 0.3, H * 0.672, W * 0.62, H * 0.728, W + u * 2, H * 0.694); c.lineWidth = u * 6.4; c.strokeStyle = shade(riv, -0.14); c.stroke(); c.lineWidth = u * 5; c.strokeStyle = riv; c.stroke(); c.lineCap = 'round';
    for (i = 0; i < 10; i++) { var rxx = frac(R0() + t * 0.012) * W, ryy = H * (0.688 + 0.012 * Math.sin(rxx / W * 6)) + (R0() - 0.5) * u * 2.4; Rn(c, rxx, ryy, u * (2 + R0() * 3), u * 0.3, u * 0.15, alpha(p.snow, 0.3 + 0.3 * Math.sin(t * 1.5 + i))); }
    var bx = W * 0.57, by = H * 0.703; /* the bridge */
    c.beginPath(); c.moveTo(bx - u * 8, by + u * 3.4); c.quadraticCurveTo(bx, by - u * 6.4, bx + u * 8, by + u * 3.4); c.lineTo(bx + u * 5, by + u * 3.4); c.arc(bx, by + u * 3.4, u * 3.2, 0, PI, true); c.lineTo(bx - u * 8, by + u * 3.4); c.closePath(); c.fillStyle = stone; c.fill();
    c.beginPath(); c.moveTo(bx - u * 8, by + u * 3); c.quadraticCurveTo(bx, by - u * 6.8, bx + u * 8, by + u * 3); c.lineWidth = u * 1.1; c.strokeStyle = shade(stone, 0.16); c.stroke(); c.fillStyle = alpha(shade(stone, -0.3), 0.4); for (i = 0; i < 6; i++) c.fillRect(bx - u * 6 + i * u * 2.2, by - u * (0.2 + (i % 2) * 1.2) + Math.abs(i - 2.5) * u * 0.6, u * 1.1, u * 0.45);
    var f3 = hill(c, W, H, H * 0.72, u * 1.8, grass, o.seed + 'd', 0.7);
    ribbon(c, W * 0.565, H * 0.722, W * 0.52, H * 0.78, W * 0.4, H * 0.86, W * 0.5, H * 1.02, u * 7, u * 26, T(mix('#e6cf9a', p.bg2, 0.3), 0.45));
    hill(c, W, H, H * 0.9, u * 2, alpha(shade(grass, 0.12), 0.5), o.seed + 'e', 1.1);
    /* the big oak, left; hedges with roses */
    el(c, W * 0.07 + u * 5, f3(W * 0.07) + u * 3, u * 15, u * 1.6, alpha('#000000', 0.13));
    oak(c, W * 0.06, f3(W * 0.06) + u * 2.6, u * 50, T(mix('#3f9a5a', p.accent2, 0.45), 0.5), wood, T(p.accent, 0.3), t, 0);
    for (i = 0; i < 2; i++) { var hx = W * (i ? 0.93 : 0.25), hy = f3(hx) + u * 3.4; el(c, hx, hy - u * 2.2, u * 5.4, u * 3.4, shade(grass, -0.2)); el(c, hx - u * 3.6, hy - u * 1.4, u * 3.4, u * 2.4, shade(grass, -0.14)); el(c, hx + u * 3.8, hy - u * 1.5, u * 3.2, u * 2.3, shade(grass, -0.26)); for (k = 0; k < 6; k++) dot(c, hx + Math.cos(k * 2.2) * u * 3.6, hy - u * 2.4 + Math.sin(k * 1.7) * u * 1.7, u * 0.6, T(k % 2 ? p.accent : p.paper, 0.3)); }
    for (i = 0; i < 30; i++) { var gx = R0() * W, gy = H * (0.74 + R0() * 0.25), sc = 0.6 + (gy / H - 0.72) * 2.6; if (Math.abs(gx - W * 0.47) < u * (6 + (gy / H - 0.72) * 60)) continue; if (i % 2) grassTuft(c, gx, gy, u * 2 * sc, shade(grass, i % 4 === 1 ? -0.2 : 0.16), t, i); else { L(c, gx, gy, gx + Math.sin(t * 1.4 + i) * u * 0.2, gy - u * 1.9 * sc, u * 0.25, shade(grass, -0.25)); K.flower(c, gx + Math.sin(t * 1.4 + i) * u * 0.2, gy - u * 1.9 * sc, u * 0.9 * sc, T([p.accent, p.paper, p.gold][i % 3], 0.3), T(i % 3 === 2 ? p.paper : p.gold, 0.3), i); } }
    /* toadstools bottom left, the wishing well bottom right */
    var mxx = W * 0.12, myy = H * 0.975; toadstool(c, mxx, myy, u * 5, T(p.accent, 0.3), T(p.paper, 0.3), -0.1); toadstool(c, mxx + u * 6.4, myy + u * 0.8, u * 3.2, T(p.accent, 0.3), T(p.paper, 0.3), 0.16); toadstool(c, mxx - u * 5.6, myy + u * 1, u * 2.4, T(mix(p.accent, p.gold, 0.5), 0.3), T(p.paper, 0.3), -0.24);
    var wx = W * 0.86, wy = H * 0.972;
    el(c, wx, wy + u * 0.6, u * 10, u * 1.4, alpha('#000000', 0.16));
    for (i = -1; i <= 1; i += 2) Rn(c, wx + i * u * 5 - u * 0.5, wy - u * 17, u * 1, u * 12, 0, wood);
    poly(c, [[wx - u * 8, wy - u * 16], [wx + u * 8, wy - u * 16], [wx + u * 5, wy - u * 21.4], [wx - u * 5, wy - u * 21.4]], roof); poly(c, [[wx, wy - u * 16], [wx + u * 8, wy - u * 16], [wx + u * 5, wy - u * 21.4], [wx, wy - u * 21.4]], shade(roof, -0.14)); L(c, wx - u * 5, wy - u * 13.4, wx + u * 5, wy - u * 13.4, u * 0.6, wood);
    var bob = Math.sin(t * 1.1) * u * 0.5; L(c, wx, wy - u * 13.4, wx, wy - u * 9.6 + bob, u * 0.25, alpha(p.ink, 0.7)); poly(c, [[wx - u * 1.5, wy - u * 9.6 + bob], [wx + u * 1.5, wy - u * 9.6 + bob], [wx + u * 1.1, wy - u * 7.2 + bob], [wx - u * 1.1, wy - u * 7.2 + bob]], wood);
    Rn(c, wx - u * 6.4, wy - u * 6.4, u * 12.8, u * 6.6, u * 0.8, stone); Rn(c, wx - u * 6.9, wy - u * 7.2, u * 13.8, u * 1.5, u * 0.6, shade(stone, 0.18)); c.fillStyle = alpha(shade(stone, -0.3), 0.4); for (i = 0; i < 8; i++) c.fillRect(wx - u * 5.6 + (i % 4) * u * 3 + (i > 3 ? u * 1.4 : 0), wy - u * (4.6 - (i > 3 ? 2.4 : 0)), u * 2, u * 0.4);
    if (night) { for (i = 0; i < 14; i++) { var qx = R0() * W, qy = H * (0.72 + R0() * 0.26) + Math.sin(t * 0.9 + i) * u * 1.5, tw = 0.5 + 0.5 * Math.sin(t * (1.4 + R0() * 2) + i); dot(c, qx + Math.sin(t * 0.6 + i * 2) * u * 2, qy, u * 1.7, alpha('#e8ff9a', 0.1 + 0.14 * tw)); dot(c, qx + Math.sin(t * 0.6 + i * 2) * u * 2, qy, u * 0.45, alpha('#f4ffb8', 0.4 + 0.6 * tw)); } }
  }, { variants: ['day', 'night'], stage: 'band-low' });

  /* ---------- cove: a pirate cove, the ship at anchor ---------- */
  function squareSail(c, cx, top, w, h, col, puff) {
    c.beginPath(); c.moveTo(cx - w, top); c.lineTo(cx + w, top); c.quadraticCurveTo(cx + w * (1.1 + puff), top + h * 0.5, cx + w, top + h); c.quadraticCurveTo(cx + w * puff, top + h * 0.82, cx - w, top + h); c.quadraticCurveTo(cx - w * (0.84 - puff), top + h * 0.5, cx - w, top); c.closePath(); c.fillStyle = col; c.fill();
    c.strokeStyle = alpha(shade(col, -0.3), 0.3); c.lineWidth = w * 0.05; c.beginPath(); c.moveTo(cx - w * 0.3, top); c.lineTo(cx - w * 0.2, top + h * 0.88); c.moveTo(cx + w * 0.4, top); c.lineTo(cx + w * 0.5, top + h * 0.92); c.stroke();
  }
  function pirateShip(c, x, y, s, hull, sail, trim, win, flagC, t) {
    var bob = Math.sin(t * 0.8) * s * 0.14, pf = Math.sin(t * 0.7) * 0.05, wv = Math.sin(t * 3) * s * 0.14, i, dk = shade(hull, -0.3);
    c.save(); c.translate(x, y + bob); c.rotate(Math.sin(t * 0.6) * 0.018);
    L(c, s * 6, -s * 2.8, s * 9, -s * 4, s * 0.24, dk); L(c, 0, -s * 1.6, 0, -s * 12.4, s * 0.32, dk); L(c, s * 3.5, -s * 1.6, s * 3.5, -s * 10, s * 0.28, dk); L(c, -s * 3.7, -s * 2.4, -s * 3.7, -s * 9, s * 0.26, dk);
    poly(c, [[s * 3.7, -s * 9.6], [s * 8.8, -s * 3.9], [s * 4.1, -s * 4.1]], shade(sail, -0.1));
    squareSail(c, -s * 3.7, -s * 8.2, s * 1.5, s * 4.4, shade(sail, -0.06), pf); squareSail(c, s * 3.5, -s * 9.2, s * 1.5, s * 2.5, sail, pf); squareSail(c, s * 3.5, -s * 6.3, s * 1.95, s * 3.5, sail, pf); squareSail(c, 0, -s * 11.2, s * 1.9, s * 3, sail, pf); squareSail(c, 0, -s * 7.8, s * 2.7, s * 4.8, sail, pf);
    for (i = 0; i < 5; i++) { var q = [[-3.7, -8.2, 1.7], [3.5, -9.2, 1.7], [3.5, -6.3, 2.15], [0, -11.2, 2.1], [0, -7.8, 2.9]][i]; L(c, s * (q[0] - q[2]), s * q[1], s * (q[0] + q[2]), s * q[1], s * 0.22, dk); }
    Rn(c, -s * 0.7, -s * 12, s * 1.4, s * 0.7, s * 0.1, dk);
    poly(c, [[0, -s * 14.2], [s * 2.5, -s * 13.9 + wv], [s * 2.5, -s * 12.5 + wv], [0, -s * 12.7]], flagC); dot(c, s * 1.2, -s * 13.4 + wv * 0.5, s * 0.36, '#f2f2f2'); Rn(c, s * 1.02, -s * 13.2 + wv * 0.5, s * 0.36, s * 0.26, s * 0.06, '#f2f2f2'); dot(c, s * 1.08, -s * 13.44 + wv * 0.5, s * 0.08, flagC); dot(c, s * 1.32, -s * 13.44 + wv * 0.5, s * 0.08, flagC); L(c, 0, -s * 12.4, 0, -s * 14.3, s * 0.16, dk);
    c.beginPath(); c.moveTo(-s * 6.6, -s * 3.6); c.lineTo(-s * 4.4, -s * 3.6); c.lineTo(-s * 4.2, -s * 1.7); c.lineTo(s * 3.6, -s * 1.7); c.lineTo(s * 4.1, -s * 2.5); c.lineTo(s * 7, -s * 3.1); c.quadraticCurveTo(s * 5.4, s * 0.7, s * 3.6, s * 1.1); c.lineTo(-s * 4.8, s * 1.1); c.quadraticCurveTo(-s * 6.3, s * 0.2, -s * 6.6, -s * 3.6); c.closePath(); c.fillStyle = hull; c.fill();
    c.save(); c.clip(); Rn(c, -s * 7, -s * 1.1, s * 14, s * 0.42, 0, trim); Rn(c, -s * 7, s * 0.2, s * 14, s * 1.2, 0, dk); Rn(c, -s * 7, -s * 3.7, s * 2.9, s * 0.4, 0, trim); c.restore();
    for (i = 0; i < 4; i++) { dot(c, -s * 2.6 + i * s * 1.7, -s * 0.36, s * 0.34, dk); dot(c, -s * 2.6 + i * s * 1.7, -s * 0.36, s * 0.22, win); }
    Rn(c, -s * 6, -s * 2.9, s * 0.7, s * 0.8, s * 0.1, win); Rn(c, -s * 5, -s * 2.9, s * 0.7, s * 0.8, s * 0.1, win);
    for (i = 0; i < 8; i++) Rn(c, -s * 3.9 + i * s * 1, -s * 2.3, s * 0.16, s * 0.6, 0, dk); Rn(c, -s * 4.1, -s * 2.4, s * 8, s * 0.16, 0, dk);
    c.restore();
  }
  function chest(c, x, y, s, wood, gold, gems, t, kb, night) {
    var i, dk = shade(wood, -0.25);
    el(c, x, y + s * 0.3, s * 8.4, s * 1.2, alpha('#000000', 0.18));
    if (night) glow(c, x, y - s * 6, s * 17, gold, 0.3 + 0.08 * kb);
    c.save(); c.translate(x - s * 6, y - s * 5.2); c.rotate(-0.5); c.beginPath(); c.moveTo(0, 0); c.lineTo(s * 12, 0); c.lineTo(s * 12, -s * 2); c.quadraticCurveTo(s * 6, -s * 5.6, 0, -s * 2); c.closePath(); c.fillStyle = dk; c.fill(); Rn(c, s * 1.6, -s * 4, s * 1.2, s * 4, 0, shade(gold, -0.2)); Rn(c, s * 9.2, -s * 4, s * 1.2, s * 4, 0, shade(gold, -0.2)); c.restore();
    el(c, x, y - s * 5.4, s * 5.6, s * 2.4, gold); el(c, x - s * 1, y - s * 6, s * 3.4, s * 1.5, shade(gold, 0.25));
    for (i = 0; i < 9; i++) { var cx = x - s * 4.4 + i * s * 1.1, cy = y - s * (5.6 + ((i * 5) % 3) * 0.7); el(c, cx, cy, s * 0.8, s * 0.42, i % 2 ? shade(gold, 0.3) : shade(gold, -0.12)); }
    dot(c, x + s * 2.6, y - s * 6.6, s * 0.8, gems[0]); dot(c, x - s * 2.8, y - s * 6.4, s * 0.7, gems[1]); dot(c, x + s * 0.3, y - s * 7.4, s * 0.6, gems[2]); c.beginPath(); c.arc(x + s * 3.4, y - s * 5.2, s * 1.6, PI * 0.9, PI * 1.9); c.lineWidth = s * 0.3; c.strokeStyle = '#f4f0e6'; c.setLineDash([s * 0.5, s * 0.36]); c.stroke(); c.setLineDash([]);
    Rn(c, x - s * 6, y - s * 5.2, s * 12, s * 5.4, s * 0.5, wood); Rn(c, x - s * 6, y - s * 5.2, s * 12, s * 1, s * 0.3, shade(wood, 0.16)); for (i = 1; i < 4; i++) Rn(c, x - s * 6, y - s * 5.2 + i * s * 1.34, s * 12, s * 0.16, 0, dk);
    Rn(c, x - s * 4.4, y - s * 5.2, s * 1.2, s * 5.4, 0, gold); Rn(c, x + s * 3.2, y - s * 5.2, s * 1.2, s * 5.4, 0, gold); Rn(c, x - s * 1, y - s * 4.4, s * 2, s * 2.2, s * 0.4, shade(gold, 0.2)); dot(c, x, y - s * 3.5, s * 0.4, dk);
    for (i = 0; i < 4; i++) { var tw = 0.5 + 0.5 * Math.sin(t * 2.4 + i * 1.7); twinkle(c, x + s * [-4, 3.6, 0, -1.6][i], y - s * [8, 8.6, 10, 6.6][i], s * (0.8 + tw * 1.3 + kb * 0.4), alpha('#ffffff', 0.5 + 0.5 * tw)); }
    el(c, x - s * 8, y + s * 0.2, s * 0.8, s * 0.4, gold); el(c, x + s * 7.6, y - s * 0.2, s * 0.8, s * 0.4, shade(gold, 0.2)); el(c, x + s * 6.4, y + s * 0.6, s * 0.8, s * 0.4, gold);
  }
  Art.add('backdrop', 'cove', function (c, W, H, t, p, o, u) {
    u = unit(W, H);
    var v = o.variant, night = v === 'night', T = tinter(p, v), i, s, R0 = rnd(o.seed + 'cv'), hz = H * 0.54, sh = H * 0.674, kb = Math.exp(-5 * o.beat), low = sky(c, W, H, p, v, hz),
      sand = T(mix('#efd39a', p.bg2, 0.3), 0.46), seaA = T(mix(mix('#2a8fc0', p.bg, 0.45), low, 0.2), 0.5), seaB = T(mix('#4fcfc0', p.bg, 0.2), 0.5), rk = T(mix(mix('#75687c', p.bg, 0.3), p.ink, 0.12), 0.42), lf = T(mix('#3f9a5a', p.accent2, 0.45), 0.45), wood = T(mix('#8a5a36', p.ink, 0.15), 0.35),
      lightC = night ? mix(p.snow, '#fff0c4', 0.5) : mix(p.gold, '#fff3b0', 0.4), lx = W * 0.7, lit = '#ffd98a', gold = T(p.gold, 0.15);
    if (night) { skyStars(c, W, H, 90, o.seed, t, hz * 0.95, p.snow); moonDisc(c, lx, H * 0.15, u * 6.5, lightC); streaks(c, W, t, o.seed, 3, H * 0.22, H * 0.4, u, p.snow); }
    else { sunDisc(c, lx, H * 0.14, u * 6, t, lightC, 1); clouds(c, W, t, o.seed, 4, H * 0.1, H * 0.36, u * 16, u * 28, alpha(p.snow, 0.92)); gulls(c, W, H, t, u, alpha(p.ink, 0.55), H * 0.33); }
    blob(c, [[W * 0.5, hz + u], [W * 0.56, hz - u * 2.4], [W * 0.66, hz - u * 4], [W * 0.78, hz - u * 2], [W * 0.84, hz + u]], mix(rk, low, 0.6)); /* a far islet with two palms */
    palm(c, W * 0.64, hz - u * 3, u * 7, 0.2, t, 1, mix(wood, low, 0.5), mix(lf, low, 0.5)); palm(c, W * 0.69, hz - u * 2.8, u * 5, -0.2, t, 2, mix(wood, low, 0.5), mix(lf, low, 0.5));
    water(c, W, hz, sh + u * 4, seaA, seaB, t, o.seed, 44, alpha(p.snow, 0.9), u);
    glitter(c, lx, hz + u * 0.6, sh - u * 2, u * 4, u * 18, mix(lightC, '#ffffff', 0.4), t, u);
    /* the ship */
    var sx = W * 0.4, sy = hz + (sh - hz) * 0.5, ss = u * 2.05;
    el(c, sx, sy + ss * 1.6, ss * 7.4, ss * 0.9, alpha(shade(seaA, -0.5), 0.4));
    if (night) glow(c, sx - ss * 5, sy - ss * 2.4, ss * 6, lit, 0.35);
    pirateShip(c, sx, sy, ss, T(mix('#6a4028', p.ink, 0.2), 0.3), T(p.paper, 0.34), gold, night ? lit : mix(seaA, '#10141c', 0.6), mix(p.ink, '#14141c', 0.7), t);
    for (i = 0; i < 2; i++) { var wy = sy + ss * (1 + i * 0.5), k; c.beginPath(); for (k = 0; k <= 10; k++) { var wxx = sx - ss * 8 + k * ss * 1.6, wyy = wy + Math.sin(k * 1.4 + t * 1.6 + i * 2) * ss * 0.16; if (k) c.lineTo(wxx, wyy); else c.moveTo(wxx, wyy); } c.lineWidth = ss * 0.3; c.strokeStyle = alpha(p.snow, night ? 0.4 : 0.75); c.stroke(); }
    /* the shore */
    function edge(x, d) { return sh + Math.sin(x / W * 4.8 + 0.4) * u * 1.4 + Math.sin(x / W * 10.4 + 3) * u * 0.5 + d; }
    function shore(d, col) { var k2; c.beginPath(); c.moveTo(0, H); for (k2 = 0; k2 <= 24; k2++) c.lineTo(k2 / 24 * W, edge(k2 / 24 * W, d)); c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.fill(); }
    var wash = 0.5 + 0.5 * Math.sin(t * 0.9);
    shore(-u * (1.6 + wash * 1.5), alpha(p.snow, night ? 0.5 : 0.85)); shore(-u * (1 + wash * 1.1), alpha(seaB, 0.8)); shore(0, shade(sand, -0.16)); shore(u * 2, sand);
    var g = c.createLinearGradient(0, sh, 0, H); g.addColorStop(0, alpha(shade(sand, 0.2), 0)); g.addColorStop(1, alpha(shade(sand, 0.2), 0.5)); c.fillStyle = g; c.fillRect(0, sh + u * 3, W, H - sh);
    c.fillStyle = alpha(shade(sand, -0.3), 0.22); for (i = 0; i < 60; i++) { c.beginPath(); c.arc(R0() * W, sh + u * 4 + R0() * (H - sh - u * 4), u * (0.15 + R0() * 0.25), 0, TAU); c.fill(); }
    /* a rowboat pulled up on the sand */
    var bx = W * 0.62, by = sh + u * 4.4;
    el(c, bx, by + u * 1.5, u * 9, u * 1, alpha('#000000', 0.14)); c.save(); c.translate(bx, by); c.rotate(0.06);
    L(c, -u * 3, -u * 2, -u * 9, u * 1.6, u * 0.5, shade(wood, 0.2)); el(c, -u * 9.6, u * 2, u * 1.6, u * 0.7, shade(wood, 0.2), -0.5);
    c.beginPath(); c.moveTo(-u * 8, -u * 1.8); c.lineTo(u * 8.6, -u * 1.8); c.quadraticCurveTo(u * 6.4, u * 2, u * 4, u * 2); c.lineTo(-u * 5, u * 2); c.quadraticCurveTo(-u * 7.4, u * 1, -u * 8, -u * 1.8); c.closePath(); c.fillStyle = wood; c.fill(); Rn(c, -u * 7.8, -u * 1.8, u * 16.2, u * 0.8, u * 0.3, T(p.accent, 0.3)); Rn(c, -u * 6.6, u * 0.2, u * 12.6, u * 0.3, 0, shade(wood, -0.2)); c.restore();
    /* the rock walls of the cove, and the arch overhead */
    var rkL = shade(rk, 0.075), rkD = shade(rk, -0.18);
    blob(c, [[-u * 6, -u * 6], [W * 0.5, -u * 9], [W + u * 6, -u * 6], [W + u * 6, H * 0.1], [W * 0.84, H * 0.06], [W * 0.66, H * 0.034], [W * 0.5, H * 0.05], [W * 0.34, H * 0.03], [W * 0.16, H * 0.07], [-u * 6, H * 0.1]], rkD);
    blob(c, [[-u * 8, -u * 4], [W * 0.2, -u * 4], [W * 0.27, H * 0.08], [W * 0.17, H * 0.2], [W * 0.235, H * 0.33], [W * 0.13, H * 0.46], [W * 0.2, H * 0.58], [W * 0.17, H * 0.66], [W * 0.3, H * 0.715], [W * 0.1, H * 0.76], [-u * 8, H * 0.78]], rk);
    blob(c, [[W + u * 8, -u * 4], [W * 0.82, -u * 4], [W * 0.74, H * 0.09], [W * 0.85, H * 0.21], [W * 0.78, H * 0.34], [W * 0.885, H * 0.47], [W * 0.82, H * 0.6], [W * 0.86, H * 0.67], [W * 0.74, H * 0.725], [W * 0.92, H * 0.77], [W + u * 8, H * 0.79]], rk);
    for (s = 0; s < 2; s++) { /* facets, ledges and green */
      var d = s ? -1 : 1, ex = s ? W : 0;
      blob(c, [[ex + d * W * 0.03, H * 0.1], [ex + d * W * 0.17, H * 0.12], [ex + d * W * 0.12, H * 0.22], [ex + d * W * 0.02, H * 0.2]], rkL); blob(c, [[ex + d * W * 0.05, H * 0.3], [ex + d * W * 0.17, H * 0.34], [ex + d * W * 0.09, H * 0.44], [ex + d * W * 0.01, H * 0.4]], rkL); blob(c, [[ex + d * W * 0.04, H * 0.52], [ex + d * W * 0.15, H * 0.57], [ex + d * W * 0.12, H * 0.66], [ex + d * W * 0.02, H * 0.64]], rkL);
      blob(c, [[ex - d * u * 2, H * 0.22], [ex + d * W * 0.1, H * 0.25], [ex + d * W * 0.14, H * 0.31], [ex - d * u * 2, H * 0.3]], rkD); blob(c, [[ex - d * u * 2, H * 0.44], [ex + d * W * 0.08, H * 0.47], [ex + d * W * 0.13, H * 0.53], [ex - d * u * 2, H * 0.52]], rkD); blob(c, [[ex - d * u * 2, H * 0.68], [ex + d * W * 0.14, H * 0.7], [ex + d * W * 0.2, H * 0.745], [ex - d * u * 2, H * 0.76]], rkD);
      for (i = 0; i < 3; i++) { var gx = ex + d * W * [0.17, 0.12, 0.16][i], gy = H * [0.2, 0.46, 0.655][i]; el(c, gx, gy, u * 4.4, u * 1.8, lf); el(c, gx - d * u * 3, gy + u * 0.5, u * 3, u * 1.4, shade(lf, -0.14)); leaf(c, gx, gy, u * 6, -PI / 2 + d * 0.9 + Math.sin(t + i) * 0.06, shade(lf, 0.14)); leaf(c, gx, gy, u * 5, -PI / 2 + d * 0.2 + Math.sin(t + i + 1) * 0.06, lf); }
      for (i = 0; i < 4; i++) { var vx = W * (s ? 0.62 + i * 0.07 : 0.2 + i * 0.07), vl = u * [9, 15, 7, 12][(i + s) % 4], vy = H * 0.04, sw = Math.sin(t * 0.8 + i + s * 2) * u * 1.2, k2; c.beginPath(); c.moveTo(vx, vy); c.quadraticCurveTo(vx + sw * 0.3, vy + vl * 0.5, vx + sw, vy + vl); c.lineWidth = u * 0.4; c.strokeStyle = shade(lf, -0.2); c.stroke(); for (k2 = 1; k2 <= 4; k2++) leaf(c, vx + sw * k2 / 4 * k2 / 4, vy + vl * k2 / 4, u * 2.6, (k2 % 2 ? 0.5 : PI - 0.5), k2 % 2 ? lf : shade(lf, 0.14)); }
    }
    /* a lantern on a rope, a parrot on a ledge */
    var la = Math.sin(t * 0.9) * 0.08, lpx = W * 0.3, lpy = H * 0.03, ll = u * 17, lxx = lpx + Math.sin(la) * ll, lyy = lpy + Math.cos(la) * ll;
    L(c, lpx, lpy, lxx, lyy, u * 0.3, alpha(p.ink, 0.8)); if (night) glow(c, lxx, lyy + u * 2.4, u * 16, lit, 0.4 + 0.05 * Math.sin(t * 6)); Rn(c, lxx - u * 1.9, lyy, u * 3.8, u * 0.9, u * 0.3, wood); Rn(c, lxx - u * 1.5, lyy + u * 0.9, u * 3, u * 3.6, u * 0.4, night ? lit : mix(lit, rk, 0.45)); Rn(c, lxx - u * 0.15, lyy + u * 0.9, u * 0.3, u * 3.6, 0, wood); Rn(c, lxx - u * 1.9, lyy + u * 4.4, u * 3.8, u * 0.9, u * 0.3, wood);
    var px = W * 0.865, py = H * 0.452, hd = Math.sin(t * 1.4) * 0.12, pc = T(p.accent, 0.25);
    poly(c, [[px - u * 0.6, py - u * 1], [px + u * 0.9, py - u * 1], [px + u * 1.6, py + u * 5.4], [px + u * 0.2, py + u * 4.6]], T(p.accent2, 0.25)); el(c, px, py - u * 2.6, u * 2, u * 3, pc, -0.16); el(c, px + u * 0.7, py - u * 2.2, u * 1.1, u * 2.3, T(p.gold, 0.25), -0.3);
    c.save(); c.translate(px - u * 0.8, py - u * 5.6); c.rotate(hd); dot(c, 0, 0, u * 1.7, pc); el(c, -u * 0.4, u * 0.2, u * 0.9, u * 0.7, T(p.paper, 0.25)); c.beginPath(); c.moveTo(-u * 1.2, -u * 0.6); c.quadraticCurveTo(-u * 3, -u * 0.2, -u * 1.8, u * 1.6); c.quadraticCurveTo(-u * 1.3, u * 0.7, -u * 0.9, u * 0.8); c.closePath(); c.fillStyle = shade(gold, -0.1); c.fill(); dot(c, -u * 0.3, -u * 0.3, u * 0.32, '#20222c'); c.restore();
    /* the treasure, bottom left; a trail of dashes to the X; barrel and anchor, bottom right */
    c.strokeStyle = alpha(T(p.accent, 0.3), 0.75); c.lineWidth = u * 0.6; c.setLineDash([u * 1.5, u * 1.5]); c.beginPath(); c.moveTo(W * 0.6, sh + u * 9); c.bezierCurveTo(W * 0.74, H * 0.83, W * 0.3, H * 0.84, W * 0.5, H * 0.94); c.stroke(); c.setLineDash([]);
    L(c, W * 0.5 + u * 1, H * 0.94 + u * 0.4, W * 0.5 + u * 5, H * 0.94 + u * 3.6, u * 1, T(p.accent, 0.3)); L(c, W * 0.5 + u * 5, H * 0.94 + u * 0.4, W * 0.5 + u * 1, H * 0.94 + u * 3.6, u * 1, T(p.accent, 0.3));
    chest(c, W * 0.17, H * 0.972, u * 1.25, wood, gold, [T(p.accent, 0.2), T(p.accent2, 0.2), T(p.paper, 0.2)], t, kb, night);
    var qx = W * 0.85, qy = H * 0.975;
    el(c, qx, qy + u * 0.4, u * 11, u * 1.3, alpha('#000000', 0.16));
    c.save(); c.translate(qx + u * 6, qy - u * 6); c.rotate(0.3); c.lineCap = 'round'; c.strokeStyle = T(mix('#5a6070', p.ink, 0.3), 0.3); c.lineWidth = u * 1.1; c.beginPath(); c.moveTo(0, -u * 7); c.lineTo(0, u * 5); c.moveTo(-u * 3, -u * 4.6); c.lineTo(u * 3, -u * 4.6); c.moveTo(-u * 4.6, u * 1.4); c.quadraticCurveTo(-u * 4, u * 5.4, 0, u * 5.2); c.quadraticCurveTo(u * 4, u * 5.4, u * 4.6, u * 1.4); c.stroke(); ring(c, 0, -u * 8.2, u * 1.2, u * 0.7, T(mix('#5a6070', p.ink, 0.3), 0.3)); c.restore();
    Rn(c, qx - u * 7.4, qy - u * 10, u * 8, u * 10, u * 2.4, wood); Rn(c, qx - u * 7.4, qy - u * 10, u * 2.4, u * 10, u * 1.6, shade(wood, 0.16)); for (i = 1; i < 4; i++) Rn(c, qx - u * 7.4 + i * u * 2, qy - u * 10, u * 0.2, u * 10, 0, shade(wood, -0.25)); Rn(c, qx - u * 7.6, qy - u * 8.4, u * 8.4, u * 0.9, 0, T(mix('#5a6070', p.ink, 0.3), 0.3)); Rn(c, qx - u * 7.6, qy - u * 2.6, u * 8.4, u * 0.9, 0, T(mix('#5a6070', p.ink, 0.3), 0.3)); el(c, qx - u * 3.4, qy - u * 10, u * 3.6, u * 0.9, shade(wood, -0.2));
    starfish(c, W * 0.36, H * 0.965, u * 1.8, T(mix(p.accent, '#ff9a6a', 0.5), 0.3), 0.2); shell(c, W * 0.7, H * 0.95, u * 1.5, T(p.paper, 0.4));
    var gg = c.createLinearGradient(0, 0, 0, H * 0.12); gg.addColorStop(0, alpha('#000000', 0.25)); gg.addColorStop(1, alpha('#000000', 0)); c.fillStyle = gg; c.fillRect(0, 0, W, H * 0.12);
  }, { variants: ['day', 'night'], stage: 'band-low' });
});
