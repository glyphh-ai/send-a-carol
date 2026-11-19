/* Send a Carol art pack: country and wild places (a farm, a pumpkin patch, an orchard, a campsite, a lake, a fishing dock, a river,
   a sunny wood, mountains and a ski slope). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var vgrad = K.vgrad, vgrad2 = K.vgrad2, glow = K.glow, cloud = K.cloud, twinkle = K.twinkle, leaf = K.leaf, hill = K.hill, pine = K.pine, flame = K.flame;

  /* ---------- shared pieces ---------- */
  function lum(col) { var q = K.rgbOf(col) || [128, 128, 128]; return (q[0] * 0.299 + q[1] * 0.587 + q[2] * 0.114) / 255; }
  /* how far a palette is pulled down for a night: 0 for a dark palette, up to `max` for a pale one */
  function pull(p, max) { return clamp((lum(p.bg) - 0.22) * 1.5, 0, 1) * max; }
  function dk(col, k) { return k > 0 ? mix(col, '#0b0d28', k) : col; }
  function el(c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = col; c.fill(); }
  function poly(c, pts, col) { Pg(c, pts, col, true); }
  function grassOf(p) { return mix(p.accent2, '#6fb548', 0.5); }
  /* the time of day: g(col) is how a natural colour is seen then; lit = lamps and windows are on */
  function time(p, v) {
    var night = v === 'night', dusk = v === 'dusk' || v === 'evening', nb = dk(p.bg, pull(p, 0.74)), memo = {};
    return { v: v, night: night, dusk: dusk, lit: night || dusk,
      g: function (col) { return memo[col] || (memo[col] = night ? mix(mix(col, nb, 0.3), '#0a0e2c', 0.44) : dusk ? mix(mix(col, '#ff8a58', 0.16), '#3a2052', 0.2) : col); } };
  }
  /* the open sky down to yb: day (sun, drifting clouds), dusk (a low sun, lit streaks, first stars) or night (moon and stars).
     Returns { low: the colour at the horizon, k: how far the palette was pulled down } */
  function sky(c, W, H, t, p, o, u, T, yb, sx, sy, plain) {
    var i, R0 = rnd(o.seed + 'sky'), k = 0, low, top, mid;
    if (T.night) {
      k = pull(p, 0.74); low = dk(mix(p.bg2, '#6a7ac8', 0.3), k * 0.6);
      vgrad(c, W, H, [dk(shade(p.bg, -0.3), k), dk(p.bg, k), dk(p.bg2, k * 0.9), low], 0, yb);
      K.skyStars(c, W, H, 70, o.seed, t, yb * 0.86, '#ffffff'); if (!plain) K.moonDisc(c, sx, sy, u * 5.4, '#fff3d2');
    } else if (T.dusk) {
      k = pull(p, 0.3); top = dk(mix(p.bg, '#3a2a6a', 0.35), k); mid = mix(p.bg2, '#f08a7a', 0.45); low = mix('#ffe0a6', p.bg2, 0.2);
      vgrad(c, W, H, [top, mix(top, mid, 0.55), mid, mix('#ffc27a', p.gold, 0.25), low], 0, yb);
      c.save(); c.globalAlpha = 0.7; K.skyStars(c, W, H, 20, o.seed, t, yb * 0.3, '#fff6e0'); c.restore();
      if (!plain) { glow(c, sx, yb - u * 4, u * 42, '#ffd27a', 0.55); dot(c, sx, yb - u * 4, u * 7.5, '#ffeaa8'); dot(c, sx, yb - u * 4, u * 6, '#fff6d0'); }
      for (i = 0; i < 6; i++) { var cw = u * (22 + R0() * 26), cx = frac(R0() + t * 0.004 * (1 + i * 0.4)) * (W + cw * 2) - cw, cy = yb * (0.3 + R0() * 0.55), ch = u * (1.4 + R0() * 1.8); el(c, cx, cy, cw, ch, alpha(mix('#ff8a7a', p.accent, 0.3), 0.3)); el(c, cx + cw * 0.2, cy + ch * 0.5, cw * 0.7, ch * 0.5, alpha('#ffe6a8', 0.5)); }
    } else {
      low = mix(p.bg2, '#ffffff', 0.35);
      vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.55), low], 0, yb);
      if (!plain) { glow(c, sx, sy, u * 26, '#fff6c8', 0.5); dot(c, sx, sy, u * 5.8, mix('#ffe27a', p.gold, 0.3)); dot(c, sx - u * 1.4, sy - u * 1.4, u * 3.4, 'rgba(255,255,255,0.28)'); }
      for (i = 0; i < 5; i++) { var dw = u * (14 + R0() * 14), dx = frac(R0() + t * 0.005 * (1 + i * 0.3)) * (W + dw * 2) - dw, dy = yb * (0.08 + R0() * 0.5); cloud(c, dx, dy, dw, 'rgba(255,255,255,0.88)'); }
    }
    return { low: low, k: k };
  }
  function birds(c, x, y, s, n, t, col, seed) { /* a little flock, wings beating */
    var R0 = rnd(seed + 'bd'), i; c.strokeStyle = col; c.lineWidth = s * 0.17; c.lineCap = 'round'; c.beginPath();
    for (i = 0; i < n; i++) { var bx = x + (R0() - 0.5) * s * 10, by = y + (R0() - 0.5) * s * 4.5, z = s * (0.7 + R0() * 0.5), f = Math.sin(t * 5 + i * 1.7) * z * 0.3; c.moveTo(bx - z, by - f); c.quadraticCurveTo(bx - z * 0.4, by - z * 0.45 + f * 0.3, bx, by); c.quadraticCurveTo(bx + z * 0.4, by - z * 0.45 + f * 0.3, bx + z, by - f); }
    c.stroke();
  }
  function fireflies(c, W, y0, y1, n, seed, t, u) {
    var R0 = rnd(seed + 'ff'), i;
    for (i = 0; i < n; i++) { var x = (R0() + Math.sin(t * (0.2 + R0() * 0.3) + i) * 0.03) * W, y = y0 + (y1 - y0) * (R0() + Math.sin(t * (0.3 + R0() * 0.3) + i * 2) * 0.05), a = 0.5 + 0.5 * Math.sin(t * (1.2 + R0() * 2) + i * 1.9); dot(c, x, y, u * 1.5, 'rgba(255,240,150,' + (0.16 * a).toFixed(3) + ')'); dot(c, x, y, u * 0.42, 'rgba(255,246,180,' + (0.3 + 0.65 * a).toFixed(3) + ')'); }
  }
  /* still water between y0 and y1 with little moving glints */
  function water(c, W, y0, y1, top, bot, t, u, seed, hi, n) {
    var R0 = rnd(seed + 'wt'), i; vgrad2(c, 0, y0, W, y1 - y0, top, bot); c.lineCap = 'round'; c.strokeStyle = hi; n = n || 34;
    for (i = 0; i < n; i++) { var f = R0(), y = y0 + (y1 - y0) * (0.03 + 0.95 * Math.pow(f, 1.5)), len = u * (1.4 + 7 * f) * (0.6 + R0()), x = frac(R0() + t * 0.004 * (1 + f * 2)) * (W + len * 2) - len, a = 0.3 + 0.4 * Math.sin(t * (1 + R0() * 1.5) + i * 2.1); if (a < 0.05) continue; c.globalAlpha = a; c.lineWidth = u * (0.16 + 0.3 * f); c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke(); }
    c.globalAlpha = 1;
  }
  function glitter(c, x, y0, y1, w, col, t, u) { /* the sun's or the moon's road on the water */
    var i, n = 15;
    for (i = 0; i < n; i++) { var f = (i + 0.5) / n, y = y0 + (y1 - y0) * f, ww = w * (0.35 + 0.95 * f) * (0.55 + 0.45 * Math.sin(t * (1.4 + (i % 4) * 0.3) + i * 1.3)), xx = x + Math.sin(t * 0.9 + i * 2.2) * w * 0.12; c.globalAlpha = 0.62 - 0.3 * f; Rn(c, xx - ww / 2, y, ww, u * (0.3 + 0.34 * f), u * 0.3, col); }
    c.globalAlpha = 1;
  }
  /* a round leafy tree: base centre (x, y), height h; returns its crown [cx, cy, r] */
  function tree(c, x, y, h, col, trunk, sw, tw) {
    var w = h * (tw || 0.085), cx = x + (sw || 0), cy = y - h * 0.68, r = h * 0.3;
    c.fillStyle = trunk; c.beginPath(); c.moveTo(x - w * 1.1, y); c.quadraticCurveTo(x - w * 0.4, y - h * 0.2, x - w * 0.45, y - h * 0.55); c.lineTo(x + w * 0.45, y - h * 0.55); c.quadraticCurveTo(x + w * 0.4, y - h * 0.2, x + w * 1.1, y); c.closePath(); c.fill();
    L(c, x, y - h * 0.4, x - h * 0.15, y - h * 0.58, w * 0.5, trunk); L(c, x, y - h * 0.36, x + h * 0.16, y - h * 0.56, w * 0.5, trunk);
    el(c, cx, cy + r * 0.14, r * 1.14, r * 0.95, shade(col, -0.17));
    el(c, cx - r * 0.56, cy + r * 0.08, r * 0.62, r * 0.6, col); el(c, cx + r * 0.56, cy + r * 0.1, r * 0.6, r * 0.58, col); el(c, cx, cy - r * 0.24, r * 0.82, r * 0.78, col);
    el(c, cx - r * 0.26, cy - r * 0.46, r * 0.44, r * 0.36, shade(col, 0.13)); el(c, cx + r * 0.42, cy - r * 0.08, r * 0.26, r * 0.2, shade(col, 0.1));
    return [cx, cy, r];
  }
  function fence(c, x0, x1, y, h, step, col) { /* a post and rail fence */
    var x, sh = shade(col, -0.2); Rn(c, x0, y - h * 0.82, x1 - x0, h * 0.14, 0, col); Rn(c, x0, y - h * 0.44, x1 - x0, h * 0.14, 0, col); Rn(c, x0, y - h * 0.7, x1 - x0, h * 0.04, 0, sh); Rn(c, x0, y - h * 0.32, x1 - x0, h * 0.04, 0, sh);
    for (x = x0 + step * 0.5; x < x1; x += step) { Rn(c, x - h * 0.09, y - h, h * 0.18, h, h * 0.05, col); Rn(c, x + h * 0.03, y - h * 0.97, h * 0.06, h * 0.97, 0, sh); }
  }
  function cattail(c, x, y, h, t, i, col, head) {
    var sw = Math.sin(t * 1.1 + i * 1.7) * h * 0.06;
    c.strokeStyle = col; c.lineWidth = h * 0.035; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x, y - h * 0.5, x + sw, y - h); c.moveTo(x, y); c.quadraticCurveTo(x - h * 0.1, y - h * 0.4, x - h * 0.24 + sw, y - h * 0.62); c.moveTo(x, y); c.quadraticCurveTo(x + h * 0.08, y - h * 0.35, x + h * 0.22 + sw, y - h * 0.5); c.stroke();
    c.save(); c.translate(x + sw * 0.86, y - h * 0.84); c.rotate(sw / h * 1.5); Rn(c, -h * 0.045, -h * 0.11, h * 0.09, h * 0.22, h * 0.045, head); c.restore();
  }
  function tufts(c, W, y0, y1, n, seed, u, col, t) { /* blades of grass */
    var R0 = rnd(seed + 'tu'), i; c.strokeStyle = col; c.lineWidth = u * 0.34; c.lineCap = 'round'; c.beginPath();
    for (i = 0; i < n; i++) { var x = R0() * W, f = R0(), y = y0 + f * (y1 - y0), s = u * (0.9 + R0() * 1.1) * (0.7 + 0.7 * f), sw = Math.sin(t * 1.4 + i) * s * 0.2; c.moveTo(x - s * 0.5, y); c.quadraticCurveTo(x - s * 0.5, y - s * 0.7, x - s * 0.85 + sw, y - s * 1.2); c.moveTo(x, y); c.lineTo(x + sw, y - s * 1.6); c.moveTo(x + s * 0.5, y); c.quadraticCurveTo(x + s * 0.5, y - s * 0.7, x + s * 0.85 + sw, y - s * 1.1); }
    c.stroke();
  }
  function blooms(c, W, y0, y1, n, seed, u, cols, t, stem, x0, x1) { /* small wild flowers on stems */
    var R0 = rnd(seed + 'bl'), i, k; x0 = x0 == null ? 0 : x0; x1 = x1 == null ? W : x1;
    for (i = 0; i < n; i++) { var x = x0 + R0() * (x1 - x0), f = R0(), y = y0 + f * (y1 - y0), s = u * (0.55 + R0() * 0.5) * (0.7 + 0.8 * f), sw = Math.sin(t * 1.5 + i) * s * 0.3, col = cols[i % cols.length];
      c.strokeStyle = stem; c.lineWidth = u * 0.28; c.beginPath(); c.moveTo(x, y + s * 2.8); c.lineTo(x + sw, y); c.stroke();
      c.fillStyle = col; c.beginPath(); for (k = 0; k < 5; k++) { var a = k / 5 * TAU + i; c.moveTo(x + sw + Math.cos(a) * s * 0.62 + s * 0.5, y + Math.sin(a) * s * 0.62); c.arc(x + sw + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62, s * 0.5, 0, TAU); } c.fill();
      dot(c, x + sw, y, s * 0.4, '#ffd54a'); }
  }
  function groundShade(c, W, H, y0, col, a) { var g = c.createLinearGradient(0, y0, 0, H); g.addColorStop(0, alpha(col, 0)); g.addColorStop(1, alpha(col, a)); c.fillStyle = g; c.fillRect(0, y0, W, H - y0); }
  function rock(c, x, y, r, col) { c.beginPath(); c.moveTo(x - r, y); c.quadraticCurveTo(x - r * 1.05, y - r * 0.9, x - r * 0.2, y - r); c.quadraticCurveTo(x + r * 0.9, y - r * 1.05, x + r * 1.1, y); c.closePath(); c.fillStyle = col; c.fill(); c.beginPath(); c.moveTo(x - r * 0.7, y - r * 0.45); c.quadraticCurveTo(x - r * 0.5, y - r * 0.9, x - r * 0.05, y - r * 0.88); c.quadraticCurveTo(x - r * 0.4, y - r * 0.6, x - r * 0.7, y - r * 0.45); c.fillStyle = shade(col, 0.2); c.fill(); }
  /* one mountain: apex (ax, ay), half width bw at the base; a shaded east face and a zigzag snow cap */
  function peak(c, ax, ay, bw, base, col, snow, f) {
    var hh = base - ay; f = f || 0.34;
    poly(c, [[ax - bw, base], [ax, ay], [ax + bw, base]], col);
    poly(c, [[ax, ay], [ax + bw, base], [ax + bw * 0.22, base], [ax + bw * 0.04, ay + hh * 0.62], [ax + bw * 0.12, ay + hh * 0.42]], alpha('#141a48', 0.16));
    if (!snow) return;
    poly(c, [[ax, ay], [ax + bw * f, ay + hh * f], [ax + bw * 0.17, ay + hh * (f - 0.07)], [ax + bw * 0.07, ay + hh * (f + 0.06)], [ax - bw * 0.04, ay + hh * (f - 0.08)], [ax - bw * 0.15, ay + hh * (f + 0.04)], [ax - bw * 0.24, ay + hh * (f - 0.06)], [ax - bw * f, ay + hh * f]], snow);
    poly(c, [[ax, ay], [ax + bw * f, ay + hh * f], [ax + bw * 0.17, ay + hh * (f - 0.07)], [ax + bw * 0.07, ay + hh * (f + 0.06)], [ax + bw * 0.03, ay + hh * 0.18]], alpha('#3a4a8a', 0.2));
  }
  function canoe(c, x, y, len, col, rot) {
    var h = len * 0.13; c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.beginPath(); c.moveTo(-len / 2, -h); c.quadraticCurveTo(-len * 0.42, h, -len * 0.25, h); c.lineTo(len * 0.25, h); c.quadraticCurveTo(len * 0.42, h, len / 2, -h); c.quadraticCurveTo(len * 0.3, -h * 0.2, 0, -h * 0.2); c.quadraticCurveTo(-len * 0.3, -h * 0.2, -len / 2, -h); c.closePath(); c.fillStyle = col; c.fill();
    c.beginPath(); c.moveTo(-len / 2, -h); c.quadraticCurveTo(-len * 0.3, -h * 0.2, 0, -h * 0.2); c.quadraticCurveTo(len * 0.3, -h * 0.2, len / 2, -h); c.lineWidth = h * 0.24; c.strokeStyle = shade(col, 0.4); c.stroke();
    c.beginPath(); c.moveTo(-len * 0.33, h * 0.5); c.lineTo(len * 0.33, h * 0.5); c.lineWidth = h * 0.16; c.strokeStyle = shade(col, -0.2); c.stroke();
    c.restore();
  }
  function rowboat(c, x, y, len, col, t, ph) { /* afloat, bobbing */
    var h = len * 0.2; c.save(); c.translate(x, y + Math.sin(t * 1.3 + ph) * len * 0.012); c.rotate(Math.sin(t * 0.9 + ph) * 0.03);
    el(c, 0, h * 0.72, len * 0.52, h * 0.2, 'rgba(10,20,50,0.2)');
    c.beginPath(); c.moveTo(-len / 2, -h * 0.5); c.lineTo(len / 2, -h * 0.5); c.quadraticCurveTo(len * 0.42, h * 0.6, len * 0.28, h * 0.6); c.lineTo(-len * 0.3, h * 0.6); c.quadraticCurveTo(-len * 0.45, h * 0.5, -len / 2, -h * 0.5); c.closePath(); c.fillStyle = col; c.fill();
    Rn(c, -len / 2, -h * 0.62, len, h * 0.24, h * 0.1, shade(col, 0.45)); Rn(c, -len * 0.4, h * 0.04, len * 0.76, h * 0.13, h * 0.06, 'rgba(255,255,255,0.45)');
    L(c, -len * 0.06, -h * 0.75, len * 0.3, h * 0.85, h * 0.1, '#b98a52'); el(c, len * 0.32, h * 0.95, h * 0.14, h * 0.3, '#b98a52', -0.4);
    c.restore();
  }
  function smokeUp(c, x, y, s, t, col) { for (var i = 0; i < 4; i++) { var f = frac(t * 0.16 + i / 4); dot(c, x + Math.sin(f * 5 + i) * s * 0.4 + f * s * 1.2, y - f * s * 4.4, s * (0.35 + f * 0.75), alpha(col, 0.42 * (1 - f))); } }
  function falling(c, W, H, n, seed, t, u, cols, y1, petal) { /* leaves or petals coming down, looping */
    var R0 = rnd(seed + 'fa'), i;
    for (i = 0; i < n; i++) { var sp = 0.03 + R0() * 0.03, f = frac(R0() + t * sp), x = (R0() + Math.sin(t * 0.7 + i * 1.9) * 0.03 + f * 0.06) * W, y = f * y1, s = u * (0.9 + R0() * 0.9), a = f > 0.85 ? (1 - f) / 0.15 : 1;
      c.save(); c.translate(x, y); c.rotate(t * (0.8 + R0()) + i); c.globalAlpha = a; if (petal) el(c, 0, 0, s * 0.7, s * 0.4, cols[i % cols.length]); else { c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * 0.8, s, 0); c.quadraticCurveTo(0, s * 0.8, -s, 0); c.fillStyle = cols[i % cols.length]; c.fill(); } c.restore(); }
  }
  function lantern(c, x, y, s, lit, k, col) { /* a camp lantern hanging from (x, y) */
    L(c, x, y, x, y + s * 0.8, s * 0.12, col); if (lit) glow(c, x, y + s * 2, s * (6 + k), '#ffd98a', 0.4);
    Rn(c, x - s * 0.7, y + s * 0.8, s * 1.4, s * 0.5, s * 0.2, col); Rn(c, x - s * 0.6, y + s * 1.3, s * 1.2, s * 1.5, s * 0.25, lit ? '#ffe9a8' : shade(col, 0.5)); if (lit) Rn(c, x - s * 0.25, y + s * 1.6, s * 0.5, s * 0.9, s * 0.25, '#fff8dc'); Rn(c, x - s * 0.75, y + s * 2.8, s * 1.5, s * 0.45, s * 0.15, col);
    L(c, x - s * 0.6, y + s * 1.3, x - s * 0.6, y + s * 2.8, s * 0.1, col); L(c, x + s * 0.6, y + s * 1.3, x + s * 0.6, y + s * 2.8, s * 0.1, col);
  }

  /* ---------- a farm: patchwork fields to the horizon, a red barn and silo, a wind pump, hay bales, sunflowers and a hen ---------- */
  function barn(c, x, y, s, T, p, k) {
    var red = T.g(mix('#c63d2f', p.accent, 0.4)), w = s * 10, h = s * 6.4, wh = T.g(mix('#ffffff', p.paper, 0.4)), roof = T.g('#5b4a55'), sx = x + w * 0.5 + s * 0.6, i;
    Rn(c, sx, y - h * 1.9, s * 3.6, h * 1.9, 0, T.g('#cfd5dc')); Rn(c, sx + s * 2.4, y - h * 1.9, s * 1.2, h * 1.9, 0, T.g('#aab2bd')); el(c, sx + s * 1.8, y - h * 1.9, s * 1.8, s * 1.5, T.g('#8f98a6')); Rn(c, sx, y - h * 1.9, s * 3.6, s * 0.8, 0, T.g('#8f98a6'));
    for (i = 1; i < 5; i++) Rn(c, sx, y - h * 1.9 + i * h * 0.38, s * 3.6, s * 0.18, 0, T.g('#8f98a6'));
    Rn(c, x - w / 2, y - h, w, h, 0, red);
    poly(c, [[x - w * 0.5, y - h + 1], [x - w * 0.5, y - h - s * 0.2], [x - w * 0.36, y - h - s * 2.9], [x, y - h - s * 4.9], [x + w * 0.36, y - h - s * 2.9], [x + w * 0.5, y - h - s * 0.2], [x + w * 0.5, y - h + 1]], red);
    c.strokeStyle = alpha('#2a1420', 0.14); c.lineWidth = s * 0.14; c.beginPath(); for (i = 1; i < 8; i++) { c.moveTo(x - w / 2 + i * w / 8, y - h - s * 1.5); c.lineTo(x - w / 2 + i * w / 8, y); } c.stroke();
    c.beginPath(); c.moveTo(x - w * 0.58, y - h + s * 0.2); c.lineTo(x - w * 0.38, y - h - s * 3); c.lineTo(x, y - h - s * 5.1); c.lineTo(x + w * 0.38, y - h - s * 3); c.lineTo(x + w * 0.58, y - h + s * 0.2); c.lineWidth = s * 0.85; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = roof; c.stroke();
    if (T.lit) glow(c, x, y - h - s * 1.6, s * 8, '#ffd98a', 0.3 + 0.05 * k);
    Rn(c, x - s * 1.2, y - h - s * 2.7, s * 2.4, s * 2.2, s * 0.2, wh); Rn(c, x - s * 0.9, y - h - s * 2.4, s * 1.8, s * 1.6, s * 0.1, T.lit ? '#ffdf8a' : T.g('#4a3540')); L(c, x, y - h - s * 2.4, x, y - h - s * 0.8, s * 0.2, wh);
    Rn(c, x - s * 2.4, y - s * 4.5, s * 4.8, s * 4.5, 0, wh); Rn(c, x - s * 2, y - s * 4.1, s * 4, s * 4.1, 0, T.g(shade(mix('#c63d2f', p.accent, 0.4), -0.18)));
    c.strokeStyle = wh; c.lineWidth = s * 0.34; c.beginPath(); c.moveTo(x - s * 2, y - s * 4.1); c.lineTo(x + s * 2, y); c.moveTo(x + s * 2, y - s * 4.1); c.lineTo(x - s * 2, y); c.moveTo(x, y - s * 4.1); c.lineTo(x, y); c.stroke();
    for (i = -1; i <= 1; i += 2) { Rn(c, x + i * s * 3.7 - s * 0.7, y - s * 4.1, s * 1.4, s * 1.6, s * 0.1, wh); Rn(c, x + i * s * 3.7 - s * 0.45, y - s * 3.85, s * 0.9, s * 1.1, 0, T.lit ? '#ffdf8a' : T.g('#4a3540')); }
    L(c, x, y - h - s * 5.2, x, y - h - s * 7, s * 0.2, roof); L(c, x - s * 0.9, y - h - s * 6.4, x + s * 0.9, y - h - s * 6.4, s * 0.2, roof); poly(c, [[x + s * 0.9, y - h - s * 6.9], [x + s * 1.7, y - h - s * 6.4], [x + s * 0.9, y - h - s * 5.9]], roof);
  }
  function windpump(c, x, y, h, t, col, vane) {
    var i, n = 5; c.strokeStyle = col; c.lineWidth = h * 0.02; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - h * 0.13, y); c.lineTo(x - h * 0.02, y - h); c.moveTo(x + h * 0.13, y); c.lineTo(x + h * 0.02, y - h);
    for (i = 0; i < n; i++) { var f0 = i / n, f1 = (i + 1) / n, w0 = h * (0.13 - 0.11 * f0), w1 = h * (0.13 - 0.11 * f1); c.moveTo(x - w0, y - h * f0); c.lineTo(x + w1, y - h * f1); c.moveTo(x + w0, y - h * f0); c.lineTo(x - w1, y - h * f1); c.moveTo(x - w1, y - h * f1); c.lineTo(x + w1, y - h * f1); }
    c.stroke();
    poly(c, [[x, y - h], [x + h * 0.3, y - h * 1.06], [x + h * 0.36, y - h], [x + h * 0.3, y - h * 0.94]], vane);
    c.save(); c.translate(x, y - h); c.rotate(t * 0.7); c.fillStyle = col; for (i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(-h * 0.008, -h * 0.05); c.lineTo(h * 0.008, -h * 0.05); c.lineTo(h * 0.04, -h * 0.22); c.lineTo(-h * 0.035, -h * 0.22); c.closePath(); c.fill(); }
    c.beginPath(); c.arc(0, 0, h * 0.225, 0, TAU); c.lineWidth = h * 0.012; c.strokeStyle = col; c.stroke(); c.restore(); dot(c, x, y - h, h * 0.035, vane);
  }
  function bale(c, x, y, r, col) { /* a round hay bale, base at y */
    el(c, x, y, r * 1.15, r * 0.2, 'rgba(40,30,10,0.18)'); el(c, x, y - r, r, r, shade(col, -0.12)); el(c, x - r * 0.06, y - r * 1.04, r * 0.9, r * 0.9, col);
    c.strokeStyle = shade(col, -0.22); c.lineWidth = r * 0.07; c.beginPath(); c.arc(x - r * 0.06, y - r * 1.04, r * 0.6, 0.4, 5.2); c.moveTo(x + r * 0.26, y - r * 1.04); c.arc(x - r * 0.06, y - r * 1.04, r * 0.32, 0, 4.6); c.stroke();
  }
  function sunflower(c, x, y, h, t, ph, G, pet) {
    var sw = Math.sin(t * 1.1 + ph) * h * 0.03, hx = x + sw, hy = y - h, r = h * 0.2, i;
    c.strokeStyle = G; c.lineWidth = h * 0.05; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - h * 0.04, y - h * 0.5, hx, hy); c.stroke();
    leaf(c, x - h * 0.01, y - h * 0.32, h * 0.32, -0.5, G); leaf(c, x - h * 0.02, y - h * 0.5, h * 0.3, PI + 0.5, shade(G, 0.12));
    c.save(); c.translate(hx, hy); c.rotate(ph); c.fillStyle = pet; for (i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.ellipse(0, -r * 1.05, r * 0.28, r * 0.6, 0, 0, TAU); c.fill(); } c.restore();
    dot(c, hx, hy, r * 0.74, '#6b4423'); dot(c, hx - r * 0.14, hy - r * 0.14, r * 0.42, '#8a5a30');
  }
  function hen(c, x, y, s, t, ph, col) {
    var pk = Math.pow(Math.max(0, Math.sin(t * 2.4 + ph)), 3), hx = x + s * (0.95 + pk * 0.35), hy = y - s * (1.7 - pk * 1.25);
    L(c, x - s * 0.2, y - s * 0.5, x - s * 0.2, y, s * 0.12, '#e8a23a'); L(c, x + s * 0.25, y - s * 0.5, x + s * 0.25, y, s * 0.12, '#e8a23a');
    poly(c, [[x - s * 0.7, y - s * 0.8], [x - s * 1.6, y - s * 1.9], [x - s * 0.3, y - s * 1.5]], shade(col, -0.12));
    L(c, x + s * 0.55, y - s * 1.1, hx, hy, s * 0.55, col); el(c, x, y - s, s, s * 0.72, col); el(c, x - s * 0.15, y - s, s * 0.5, s * 0.36, shade(col, -0.14));
    dot(c, hx - s * 0.04, hy - s * 0.36, s * 0.18, '#d8362c'); dot(c, hx + s * 0.14, hy - s * 0.3, s * 0.13, '#d8362c'); dot(c, hx, hy, s * 0.36, col);
    poly(c, [[hx + s * 0.3, hy - s * 0.1], [hx + s * 0.66, hy + s * 0.05], [hx + s * 0.3, hy + s * 0.16]], '#e8a23a'); dot(c, hx + s * 0.1, hy - s * 0.06, s * 0.075, '#2b2118');
  }
  Art.add('backdrop', 'farm', function (c, W, H, t, p, o, u) {
    var T = time(p, o.variant), i, j, R0 = rnd(o.seed + 'farm'), hz = H * 0.6, G = grassOf(p), k = Math.exp(-5 * o.beat);
    sky(c, W, H, t, p, o, u, T, hz + u * 2, T.dusk ? W * 0.6 : W * 0.76, H * 0.1);
    if (!T.night) birds(c, frac(0.2 + t * 0.008) * W * 1.3 - W * 0.15, H * 0.2, u * 1.7, 5, t, alpha(T.g('#4a4458'), 0.7), o.seed);
    hill(c, W, H, hz - u * 6, u * 3.5, T.g(mix(mix(G, p.bg, 0.45), '#ffffff', 0.15)), o.seed + 'f1', 0.6);
    var f2 = hill(c, W, H, hz - u * 2.2, u * 1.6, T.g(mix(G, p.bg2, 0.3)), o.seed + 'f2', 0.9);
    for (i = 0; i < 12; i++) { var bx = W * (0.26 + i * 0.045 + R0() * 0.02), br = u * (1.3 + R0() * 1.3); el(c, bx, f2(bx) - br * 0.5, br, br, T.g(mix(shade(G, -0.25), p.bg, 0.25))); }
    /* the fields: strips that run away to one point */
    var vx = W * 0.5, vy = hz - u * 34, cols = [mix('#e9cb5e', p.gold, 0.35), mix(G, '#ffffff', 0.14), mix('#b07c45', p.bg2, 0.22), shade(G, -0.06), mix('#d9d06a', G, 0.3)], q = (hz - vy) / (H - vy), n = 11;
    c.fillStyle = T.g(cols[1]); c.fillRect(0, hz - 1, W, H - hz + 1);
    for (i = 0; i < n; i++) { var x0 = vx + (i - n / 2) * W * 0.46, x1 = x0 + W * 0.46, col = T.g(cols[i % 5]);
      poly(c, [[vx + (x0 - vx) * q, hz], [vx + (x1 - vx) * q, hz], [x1, H], [x0, H]], col);
      c.strokeStyle = alpha(shade(col, -0.35), 0.26); c.lineWidth = u * 0.28; c.beginPath(); for (j = 1; j < 6; j++) { var xr = x0 + (x1 - x0) * j / 6; c.moveTo(vx + (xr - vx) * q, hz); c.lineTo(xr, H); } c.stroke(); }
    c.fillStyle = T.g(shade(G, -0.22)); c.fillRect(0, hz - u * 0.4, W, u * 0.9);
    for (i = 0; i < 22; i++) { var hx = (i + R0() * 0.8) / 22 * W, hr = u * (0.9 + R0() * 1); if (hx > W * 0.3 && hx < W * 0.7 && i % 2) continue; el(c, hx, hz - hr * 0.3, hr * 1.3, hr, T.g(shade(G, -0.2 - R0() * 0.1))); }
    /* a little tractor far off */
    var tx = W * (0.6 + 0.03 * Math.sin(t * 0.1)), ty = hz + u * 3.4, ts = u * 0.8, tr = T.g(mix('#d8452f', p.accent, 0.5));
    smokeUp(c, tx - ts * 1.6, ty - ts * 4.6, ts * 0.6, t, '#ffffff'); Rn(c, tx - ts * 2.6, ty - ts * 2.6, ts * 3.2, ts * 1.6, ts * 0.3, tr); Rn(c, tx + ts * 0.2, ty - ts * 4.4, ts * 2.2, ts * 3.2, ts * 0.3, tr); Rn(c, tx + ts * 0.6, ty - ts * 4, ts * 1.4, ts * 1.3, ts * 0.2, T.lit ? '#ffe9a8' : T.g('#cfe6f5')); L(c, tx - ts * 1.6, ty - ts * 2.6, tx - ts * 1.6, ty - ts * 4.2, ts * 0.3, T.g('#4a4458'));
    dot(c, tx + ts * 1.3, ty - ts * 0.6, ts * 1.5, T.g('#3a3340')); dot(c, tx + ts * 1.3, ty - ts * 0.6, ts * 0.6, T.g('#e8c95a')); dot(c, tx - ts * 1.8, ty - ts * 0.2, ts * 0.9, T.g('#3a3340')); dot(c, tx - ts * 1.8, ty - ts * 0.2, ts * 0.35, T.g('#e8c95a'));
    bale(c, W * 0.34, hz + u * 8, u * 2.3, T.g(cols[0])); bale(c, W * 0.71, hz + u * 11, u * 2.9, T.g(cols[0])); bale(c, W * 0.44, hz + u * 4, u * 1.4, T.g(cols[0]));
    el(c, W * 0.15, hz + u * 1.6, u * 15, u * 1.5, alpha('#20142a', 0.14)); barn(c, W * 0.14, hz + u * 1.4, u * 2.1, T, p, k);
    windpump(c, W * 0.87, hz + u * 2, u * 27, t, T.g('#6a6470'), T.g(mix('#c63d2f', p.accent, 0.4)));
    /* the near verge: a white fence, sunflowers at the corners, a hen */
    groundShade(c, W, H, H * 0.74, T.g(shade(G, -0.5)), 0.3);
    var fv = hill(c, W, H, H * 0.905, u * 1, T.g(shade(G, -0.1)), o.seed + 'f3', 1.3); hill(c, W, H, H * 0.945, u * 0.8, T.g(shade(G, -0.2)), o.seed + 'f4', 1.7);
    fence(c, -u, W + u, H * 0.928, u * 5.4, u * 10.5, T.g(mix('#ffffff', p.paper, 0.5)));
    tufts(c, W, H * 0.93, H * 0.995, 26, o.seed, u, T.g(shade(G, 0.18)), t);
    var pet = T.g(mix('#ffcc33', p.gold, 0.35)), sg = T.g(shade(G, -0.28));
    sunflower(c, u * 4.5, H + u * 1, u * 15, t, 0.3, sg, pet); sunflower(c, u * 11, H + u * 1, u * 10.5, t, 1.6, sg, pet); sunflower(c, u * 17, H + u * 2, u * 7.5, t, 2.7, sg, pet);
    sunflower(c, W - u * 5, H + u * 1, u * 13.5, t, 3.9, sg, pet); sunflower(c, W - u * 12, H + u * 1.5, u * 9, t, 5.1, sg, pet);
    hen(c, W * 0.4, H * 0.975, u * 1.7, t, 0, T.g('#fffaf0')); hen(c, W * 0.66, H * 0.962, u * 1.4, t, 2.2, T.g(mix('#c98a4a', p.gold, 0.2)));
    if (T.lit) fireflies(c, W, H * 0.62, H * 0.9, 8, o.seed, t, u);
    void fv;
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- a pumpkin patch: rows of pumpkins on the vine, a scarecrow, an autumn tree, crows and straw bales ---------- */
  function pumpkin(c, x, y, r, col, stem, face, lit, k) { /* centre (x, y) */
    el(c, x, y + r * 0.7, r * 1.15, r * 0.18, 'rgba(30,15,10,0.2)');
    if (face && lit) glow(c, x, y, r * 2.6, '#ffb84a', 0.3 + 0.08 * k);
    el(c, x - r * 0.5, y, r * 0.6, r * 0.72, shade(col, -0.13)); el(c, x + r * 0.5, y, r * 0.6, r * 0.72, shade(col, -0.13)); el(c, x - r * 0.24, y, r * 0.5, r * 0.77, shade(col, -0.05)); el(c, x + r * 0.24, y, r * 0.5, r * 0.77, shade(col, -0.05)); el(c, x, y, r * 0.36, r * 0.79, col);
    el(c, x - r * 0.42, y - r * 0.3, r * 0.12, r * 0.28, 'rgba(255,255,255,0.24)', 0.3);
    c.beginPath(); c.moveTo(x - r * 0.1, y - r * 0.72); c.quadraticCurveTo(x, y - r * 1.0, x + r * 0.22, y - r * 1.08); c.lineWidth = r * 0.2; c.lineCap = 'round'; c.strokeStyle = stem; c.stroke();
    if (face) { var f = lit ? '#ffd65a' : shade(col, -0.55); poly(c, [[x - r * 0.42, y - r * 0.1], [x - r * 0.26, y - r * 0.38], [x - r * 0.1, y - r * 0.1]], f); poly(c, [[x + r * 0.42, y - r * 0.1], [x + r * 0.26, y - r * 0.38], [x + r * 0.1, y - r * 0.1]], f);
      c.beginPath(); c.moveTo(x - r * 0.5, y + r * 0.12); c.quadraticCurveTo(x, y + r * 0.7, x + r * 0.5, y + r * 0.12); c.lineTo(x + r * 0.26, y + r * 0.24); c.lineTo(x + r * 0.14, y + r * 0.16); c.lineTo(x, y + r * 0.3); c.lineTo(x - r * 0.14, y + r * 0.16); c.lineTo(x - r * 0.26, y + r * 0.24); c.closePath(); c.fillStyle = f; c.fill(); }
  }
  function crow(c, x, y, s, d, col) { el(c, x, y - s * 0.6, s, s * 0.55, col, -0.25 * d); poly(c, [[x - d * s * 0.7, y - s * 0.5], [x - d * s * 1.9, y - s * 0.2], [x - d * s * 0.8, y - s * 0.9]], col); dot(c, x + d * s * 0.75, y - s * 1.05, s * 0.42, col); poly(c, [[x + d * s * 1.05, y - s * 1.2], [x + d * s * 1.7, y - s * 1.0], [x + d * s * 1.05, y - s * 0.86]], '#e8a23a'); dot(c, x + d * s * 0.85, y - s * 1.12, s * 0.09, '#ffffff'); L(c, x, y - s * 0.1, x, y + s * 0.3, s * 0.1, col); }
  function scarecrow(c, x, y, h, t, p, T) {
    var sw = Math.sin(t * 0.9) * 0.03, straw = T.g(mix('#e9c55a', p.gold, 0.3)), shirt = T.g(mix(p.accent, '#c8452c', 0.3)), sack = T.g('#e6cfa0'), wood = T.g('#7a5230'), i;
    Rn(c, x - h * 0.02, y - h * 0.62, h * 0.04, h * 0.62, 0, wood);
    c.save(); c.translate(x, y - h * 0.6); c.rotate(sw);
    Rn(c, -h * 0.36, -h * 0.085, h * 0.72, h * 0.04, h * 0.02, wood);
    for (i = -1; i <= 1; i += 2) { Rn(c, i * h * 0.3 - h * 0.09, -h * 0.115, h * 0.18, h * 0.1, h * 0.03, shirt); c.strokeStyle = straw; c.lineWidth = h * 0.014; c.lineCap = 'round'; c.beginPath(); for (var j = -2; j <= 2; j++) { c.moveTo(i * h * 0.38, -h * 0.065); c.lineTo(i * h * 0.46, -h * 0.065 + j * h * 0.028); } c.stroke(); }
    c.beginPath(); c.moveTo(-h * 0.14, -h * 0.13); c.lineTo(h * 0.14, -h * 0.13); c.lineTo(h * 0.17, h * 0.2); c.lineTo(-h * 0.17, h * 0.2); c.closePath(); c.fillStyle = shirt; c.fill();
    c.strokeStyle = alpha(shade(shirt, -0.4), 0.5); c.lineWidth = h * 0.012; c.beginPath(); for (i = -1; i <= 1; i++) { c.moveTo(i * h * 0.08, -h * 0.12); c.lineTo(i * h * 0.09, h * 0.2); } for (i = 0; i < 3; i++) { c.moveTo(-h * 0.15, -h * 0.05 + i * h * 0.08); c.lineTo(h * 0.15, -h * 0.05 + i * h * 0.08); } c.stroke();
    Rn(c, -h * 0.05, h * 0.02, h * 0.07, h * 0.07, h * 0.01, T.g(mix(p.gold, '#ffffff', 0.2)));
    c.strokeStyle = straw; c.lineWidth = h * 0.014; c.beginPath(); for (i = -4; i <= 4; i++) { c.moveTo(i * h * 0.035, h * 0.2); c.lineTo(i * h * 0.042, h * 0.27); c.moveTo(i * h * 0.03, -h * 0.13); c.lineTo(i * h * 0.04, -h * 0.085); } c.stroke();
    dot(c, 0, -h * 0.25, h * 0.115, sack); dot(c, -h * 0.03, -h * 0.28, h * 0.07, shade(sack, 0.12));
    dot(c, -h * 0.042, -h * 0.265, h * 0.017, '#3a2a20'); dot(c, h * 0.042, -h * 0.265, h * 0.017, '#3a2a20'); poly(c, [[-h * 0.012, -h * 0.235], [h * 0.012, -h * 0.235], [0, -h * 0.205]], T.g('#e0862a'));
    c.strokeStyle = '#3a2a20'; c.lineWidth = h * 0.01; c.beginPath(); c.arc(0, -h * 0.225, h * 0.055, 0.2 * PI, 0.8 * PI); c.stroke(); c.beginPath(); for (i = -2; i <= 2; i++) { var a = PI / 2 + i * 0.3; c.moveTo(Math.cos(a) * h * 0.047, -h * 0.225 + Math.sin(a) * h * 0.047); c.lineTo(Math.cos(a) * h * 0.064, -h * 0.225 + Math.sin(a) * h * 0.064); } c.stroke();
    el(c, 0, -h * 0.335, h * 0.2, h * 0.035, straw); c.beginPath(); c.moveTo(-h * 0.1, -h * 0.34); c.quadraticCurveTo(-h * 0.08, -h * 0.47, 0, -h * 0.47); c.quadraticCurveTo(h * 0.08, -h * 0.47, h * 0.1, -h * 0.34); c.closePath(); c.fillStyle = shade(straw, -0.08); c.fill(); Rn(c, -h * 0.1, -h * 0.375, h * 0.2, h * 0.03, 0, shirt);
    c.restore();
  }
  function strawBale(c, x, y, w, h, col) { Rn(c, x - w / 2, y - h, w, h, h * 0.12, col); Rn(c, x - w / 2, y - h, w, h * 0.22, h * 0.1, shade(col, 0.18)); Rn(c, x - w * 0.28, y - h, w * 0.05, h, 0, shade(col, -0.3)); Rn(c, x + w * 0.23, y - h, w * 0.05, h, 0, shade(col, -0.3)); }
  Art.add('backdrop', 'pumpkinpatch', function (c, W, H, t, p, o, u) {
    var T = time(p, o.variant), i, j, R0 = rnd(o.seed + 'pp'), hz = H * 0.61, G = grassOf(p), k = Math.exp(-5 * o.beat), soil = T.g(mix('#8f5e36', p.bg2, 0.2));
    var or = mix('#f08a24', p.accent, 0.14), aut = [mix('#e0862a', p.gold, 0.2), mix('#c8452c', p.accent, 0.3), mix('#e8b83a', p.gold, 0.3), mix('#9aa23a', G, 0.3)], stem = T.g(shade(G, -0.35));
    sky(c, W, H, t, p, o, u, T, hz + u * 2, T.dusk ? W * 0.42 : W * 0.25, H * 0.1);
    hill(c, W, H, hz - u * 7, u * 3.5, T.g(mix(mix(aut[0], p.bg2, 0.45), '#ffffff', 0.12)), o.seed + 'p1', 0.7);
    for (i = 0; i < 17; i++) { var bx = (i + R0() * 0.7) / 16 * W, br = u * (2.6 + R0() * 3) * (bx > W * 0.3 && bx < W * 0.7 ? 0.7 : 1.15), bc = T.g(mix(aut[i % 4], p.bg2, 0.18)); Rn(c, bx - br * 0.08, hz - br * 0.9, br * 0.16, br, 0, T.g('#6a4a3a')); el(c, bx, hz - br * 1.2, br, br * 0.92, shade(bc, -0.12)); el(c, bx - br * 0.12, hz - br * 1.3, br * 0.8, br * 0.72, bc); }
    c.fillStyle = soil; c.fillRect(0, hz - 1, W, H - hz + 1);
    var vx = W * 0.5, vy = hz - u * 24, q = (hz - vy) / (H - vy), n = 16; c.fillStyle = shade(soil, 0.1);
    for (i = 0; i < n; i += 2) { var x0 = vx + (i - n / 2) * W * 0.26, x1 = x0 + W * 0.26; c.beginPath(); c.moveTo(vx + (x0 - vx) * q, hz); c.lineTo(vx + (x1 - vx) * q, hz); c.lineTo(x1, H); c.lineTo(x0, H); c.closePath(); c.fill(); }
    c.fillStyle = T.g(shade(G, -0.18)); c.fillRect(0, hz - u * 0.3, W, u * 1);
    groundShade(c, W, H, H * 0.76, shade(soil, -0.5), 0.34);
    /* straw bales and a far stack of pumpkins, the vines, then the pumpkins from far to near */
    var sb = T.g(mix('#e9c55a', p.gold, 0.3));
    strawBale(c, W * 0.69, hz + u * 6.4, u * 9, u * 4.4, sb); strawBale(c, W * 0.75, hz + u * 6.8, u * 9, u * 4.4, shade(sb, -0.06)); strawBale(c, W * 0.72, hz + u * 2.2, u * 8.4, u * 4.2, sb);
    pumpkin(c, W * 0.72, hz - u * 3.6, u * 2.2, T.g(or), stem, false, false, k);
    for (i = 0; i < 34; i++) { var f = (i + R0() * 0.9) / 34, py = hz + u * 2.5 + (H * 0.99 - hz - u * 2.5) * Math.pow(f, 1.25), px = R0() * W, pr = u * (0.9 + 4.6 * f) * (0.75 + R0() * 0.5), pc = T.g(i % 7 === 3 ? mix('#f3e3c0', p.paper, 0.3) : i % 5 === 1 ? shade(or, -0.14) : i % 5 === 3 ? mix(or, '#ffcf4a', 0.3) : or);
      if (px > W * 0.3 && px < W * 0.7 && f > 0.25 && f < 0.6) px = px < W * 0.5 ? px - W * 0.26 : px + W * 0.26;
      c.strokeStyle = T.g(shade(G, -0.25)); c.lineWidth = pr * 0.13; c.lineCap = 'round'; c.beginPath(); c.moveTo(px + pr * 0.2, py - pr * 0.9); c.bezierCurveTo(px + pr * 1.6, py - pr * 1.5, px + pr * 1.6, py + pr * 0.4, px + pr * 2.6, py + pr * 0.5); c.stroke();
      leaf(c, px + pr * 1.3, py - pr * 0.6, pr * 1.1, -0.5 + Math.sin(t * 1.2 + i) * 0.06, T.g(shade(G, -0.12))); leaf(c, px + pr * 2, py + pr * 0.3, pr * 0.9, 0.4, T.g(G));
      pumpkin(c, px, py, pr, pc, stem, false, false, k); }
    scarecrow(c, W * 0.13, hz + u * 5, u * 30, t, p, T); crow(c, W * 0.13 + u * 8.6, hz + u * 5 - u * 30 * 0.685, u * 1.25, -1, T.g('#2a2630'));
    /* the old tree on the right, turning */
    var tc = tree(c, W * 0.9, hz + u * 6, u * 46, T.g(aut[0]), T.g('#5c4334'), Math.sin(t * 0.7) * u * 0.4, 0.07);
    for (i = 0; i < 16; i++) { var a = R0() * TAU, d = Math.sqrt(R0()) * tc[2] * 0.95; el(c, tc[0] + Math.cos(a) * d, tc[1] + Math.sin(a) * d * 0.8, tc[2] * 0.2, tc[2] * 0.16, T.g(aut[1 + i % 3])); }
    crow(c, tc[0] - tc[2] * 1.05, tc[1] + tc[2] * 0.62, u * 1.1, 1, T.g('#2a2630'));
    falling(c, W, H, 9, o.seed, t, u, [T.g(aut[0]), T.g(aut[1]), T.g(aut[2])], H * 0.8);
    /* the big ones up front: two carved, their faces lit at dusk */
    pumpkin(c, W * 0.09, H * 0.948, u * 7.2, T.g(or), stem, true, T.lit, k); pumpkin(c, W * 0.24, H * 0.975, u * 4.6, T.g(shade(or, -0.12)), stem, false, false, k); pumpkin(c, W * 0.385, H * 0.983, u * 3.3, T.g(mix('#f3e3c0', p.paper, 0.3)), stem, false, false, k);
    pumpkin(c, W * 0.76, H * 0.978, u * 4.8, T.g(mix(or, '#ffcf4a', 0.3)), stem, false, false, k); pumpkin(c, W * 0.91, H * 0.95, u * 7.6, T.g(shade(or, -0.06)), stem, true, T.lit, k);
    leaf(c, W * 0.17, H * 0.93, u * 6, -0.9, T.g(shade(G, -0.1))); leaf(c, W * 0.83, H * 0.93, u * 6, PI + 0.9, T.g(G));
    if (T.lit) fireflies(c, W, H * 0.6, H * 0.9, 9, o.seed, t, u);
    void j;
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- an orchard: two rows of trees running away down a mown path; blossom in spring, red apples in autumn ---------- */
  function crate(c, x, y, w, col, fruit, n) { /* a slatted crate heaped with apples, base centre (x, y) */
    var h = w * 0.5, i; for (i = 0; i < n; i++) { var ax = x - w * 0.36 + (i % 4) * w * 0.24 + (i > 3 ? w * 0.12 : 0), ay = y - h - w * 0.02 - (i > 3 ? w * 0.16 : 0); dot(c, ax, ay, w * 0.13, fruit[i % fruit.length]); dot(c, ax - w * 0.04, ay - w * 0.05, w * 0.04, 'rgba(255,255,255,0.4)'); }
    Rn(c, x - w / 2, y - h, w, h, w * 0.03, shade(col, -0.2)); for (i = 0; i < 3; i++) Rn(c, x - w / 2, y - h + i * h * 0.36, w, h * 0.26, w * 0.02, col); Rn(c, x - w * 0.46, y - h, w * 0.08, h, 0, shade(col, 0.12)); Rn(c, x + w * 0.38, y - h, w * 0.08, h, 0, shade(col, 0.12));
  }
  function beehive(c, x, y, s, col) { Rn(c, x - s * 1.2, y - s * 0.4, s * 0.3, s * 0.4, 0, shade(col, -0.4)); Rn(c, x + s * 0.9, y - s * 0.4, s * 0.3, s * 0.4, 0, shade(col, -0.4)); Rn(c, x - s * 1.3, y - s * 2.1, s * 2.6, s * 1.7, s * 0.1, col); Rn(c, x - s * 1.3, y - s * 1.3, s * 2.6, s * 0.14, 0, shade(col, -0.16)); Rn(c, x - s * 0.5, y - s * 0.75, s * 1, s * 0.2, s * 0.1, '#3a2a20'); poly(c, [[x - s * 1.6, y - s * 2.05], [x, y - s * 2.9], [x + s * 1.6, y - s * 2.05]], shade(col, -0.22)); }
  Art.add('backdrop', 'orchard', function (c, W, H, t, p, o, u) {
    var au = o.variant === 'autumn', T = time(p, 'day'), i, j, k, R0 = rnd(o.seed + 'or'), hz = H * 0.6, G = au ? mix(grassOf(p), '#b9a84a', 0.3) : mix(grassOf(p), '#9fd65a', 0.25);
    var S = sky(c, W, H, t, p, o, u, T, hz + u * 2, W * 0.25, H * 0.095), haze = S.low;
    var crown = au ? mix('#86a83e', p.gold, 0.28) : mix('#f7bcd2', p.accent, 0.16), trunk = '#7a5a44', apple = [mix('#d8362c', p.accent, 0.3), mix('#e8562c', p.accent, 0.2), mix('#e8a82c', p.gold, 0.4)], bl = ['#ffffff', mix('#ff9ec0', p.accent, 0.25), '#ffe3ee'];
    hill(c, W, H, hz - u * 5, u * 3, mix(mix(G, p.bg, 0.4), '#ffffff', 0.2), o.seed + 'o1', 0.6); hill(c, W, H, hz - u * 1.5, u * 1.2, mix(G, haze, 0.35), o.seed + 'o2', 0.9);
    c.fillStyle = G; c.fillRect(0, hz, W, H - hz);
    var g = c.createLinearGradient(0, hz, 0, hz + u * 16); g.addColorStop(0, alpha(haze, 0.5)); g.addColorStop(1, alpha(haze, 0)); c.fillStyle = g; c.fillRect(0, hz, W, u * 16);
    /* the mown path between the rows */
    for (i = 0; i < 5; i++) { var w0 = W * (0.44 - i * 0.085), a0 = i % 2 ? shade(G, 0.2) : shade(G, 0.11); if (w0 <= 0) break; poly(c, [[W / 2 - u * 0.6 * (5 - i) / 5, hz], [W / 2 + u * 0.6 * (5 - i) / 5, hz], [W / 2 + w0, H], [W / 2 - w0, H]], a0); }
    groundShade(c, W, H, H * 0.78, shade(G, -0.5), 0.3);
    var S5 = [0.3, 0.4, 0.54, 0.74, 1];
    for (k = 0; k < 5; k++) for (j = -1; j <= 1; j += 2) {
      var s = S5[k], tx = W / 2 + j * W * 0.47 * Math.pow(s, 0.9), ty = hz + (H * 0.8 - hz) * Math.pow((s - 0.3) / 0.7, 0.9) + u * 1, th = u * 70 * s, fade = (1 - s) * 0.55, cc = mix(k % 2 ? shade(crown, -0.05) : crown, haze, fade);
      el(c, tx, ty, th * 0.3, th * 0.035, alpha(shade(G, -0.5), 0.3));
      var q = tree(c, tx, ty, th, cc, mix(trunk, haze, fade), Math.sin(t * 0.6 + k + j) * u * 0.25 * s, 0.07), n = Math.round(5 + 14 * s);
      for (i = 0; i < n; i++) { var a = R0() * TAU, d = Math.sqrt(R0()) * q[2] * 0.98, ax = q[0] + Math.cos(a) * d * 1.05, ay = q[1] + Math.sin(a) * d * 0.82 + q[2] * 0.05;
        if (au) { dot(c, ax, ay, q[2] * 0.075, mix(apple[i % 3], haze, fade)); dot(c, ax - q[2] * 0.022, ay - q[2] * 0.026, q[2] * 0.024, 'rgba(255,255,255,0.45)'); if (i % 3 === 0) el(c, ax + q[2] * 0.2, ay + q[2] * 0.1, q[2] * 0.16, q[2] * 0.11, mix(i % 2 ? mix('#e0a030', p.gold, 0.3) : shade(crown, -0.14), haze, fade)); }
        else { K.flower(c, ax, ay, q[2] * (0.09 + (i % 3) * 0.02), mix(bl[i % 3], haze, fade * 0.6), '#ffd54a', i); if (i % 4 === 0) el(c, ax + q[2] * 0.18, ay + q[2] * 0.12, q[2] * 0.13, q[2] * 0.08, mix('#9fcf6a', haze, fade), 0.5); } }
      if (au) for (i = 0; i < 2 + k; i++) { var fx = tx + (R0() - 0.5) * th * 0.5, fy = ty + R0() * th * 0.05; dot(c, fx, fy, th * 0.02, mix(apple[i % 3], haze, fade)); }
    }
    if (au) { /* a ladder up the near right tree, crates of apples, leaves coming down */
      var lx = W * 0.83, ly = H * 0.79, wood = '#b98a52';
      c.save(); c.translate(lx, ly); c.rotate(0.2); Rn(c, -u * 2.6, -u * 30, u * 0.9, u * 30, u * 0.3, wood); Rn(c, u * 1.7, -u * 30, u * 0.9, u * 30, u * 0.3, shade(wood, -0.12)); for (i = 1; i < 9; i++) Rn(c, -u * 2.2, -i * u * 3.3, u * 4.4, u * 0.7, u * 0.2, shade(wood, 0.1)); c.restore();
      crate(c, W * 0.12, H * 0.965, u * 15, mix('#c99a5e', p.gold, 0.15), apple, 7); crate(c, W * 0.27, H * 0.985, u * 11, mix('#b98a52', p.gold, 0.15), apple, 6); crate(c, W * 0.87, H * 0.972, u * 14, mix('#c99a5e', p.gold, 0.15), apple, 7);
      for (i = 0; i < 9; i++) { var gx = W * (0.34 + R0() * 0.4), gy = H * (0.9 + R0() * 0.09); dot(c, gx, gy, u * 1.15, apple[i % 3]); dot(c, gx - u * 0.35, gy - u * 0.4, u * 0.35, 'rgba(255,255,255,0.4)'); L(c, gx, gy - u * 1.1, gx + u * 0.3, gy - u * 1.7, u * 0.22, '#6a4a2a'); }
      for (i = 0; i < 24; i++) { var qx = R0() * W, qy = H * (0.82 + R0() * 0.17); el(c, qx, qy, u * 1.1, u * 0.5, alpha(i % 2 ? mix('#e0a030', p.gold, 0.3) : mix('#c8562c', p.accent, 0.3), 0.8), R0() * 3); }
      falling(c, W, H, 11, o.seed, t, u, [mix('#e0a030', p.gold, 0.3), mix('#c8562c', p.accent, 0.3), shade(crown, -0.05)], H * 0.84);
    } else { /* white hives, daisies and tulips, petals on the air, two butterflies */
      beehive(c, W * 0.87, H * 0.972, u * 3.4, mix('#ffffff', p.paper, 0.5)); beehive(c, W * 0.955, H * 0.99, u * 2.8, mix('#ffe9a8', p.gold, 0.25));
      for (i = 0; i < 5; i++) { var bt = t * 1.3 + i * 1.7, hx = W * 0.87 + Math.cos(bt) * u * (5 + i) - u * 2, hy = H * 0.925 + Math.sin(bt * 1.7) * u * 2.4; dot(c, hx, hy, u * 0.5, '#ffcf3a'); dot(c, hx - u * 0.3, hy - u * 0.4, u * 0.36, 'rgba(255,255,255,0.7)'); }
      blooms(c, W, H * 0.885, H * 0.975, 30, o.seed, u * 1.5, ['#ffffff', mix('#ff8fb4', p.accent, 0.3), '#ffffff', mix('#ffd84a', p.gold, 0.3)], t, shade(G, -0.3));
      tufts(c, W, H * 0.9, H * 0.995, 22, o.seed, u, shade(G, 0.16), t);
      falling(c, W, H, 18, o.seed, t, u, bl, H * 0.86, true);
      K.bfly(c, W * 0.3 + Math.sin(t * 0.5) * u * 8, H * 0.52 + Math.cos(t * 0.7) * u * 4, u * 2.2, p.gold, t, 0); K.bfly(c, W * 0.7 + Math.sin(t * 0.45 + 2) * u * 7, H * 0.47 + Math.cos(t * 0.6 + 1) * u * 4, u * 1.9, '#ffffff', t, 2.5);
    }
  }, { variants: ['spring', 'autumn'], stage: 'band-low' });

  /* ---------- a campsite: a lit tent among tall pines, a fire with log seats, a lantern on a pole, a pack and a guitar ---------- */
  function tent(c, x, y, w, h, col, T, k) { /* base centre (x, y) */
    var a = [x - w * 0.5, y], ap = [x - w * 0.14, y - h], b = [x + w * 0.22, y], back = [x + w * 0.52, y - h * 0.08], rd = [x + w * 0.26, y - h * 0.95], i;
    el(c, x, y + h * 0.02, w * 0.62, h * 0.07, 'rgba(10,10,30,0.22)');
    poly(c, [ap, rd, back, b], shade(col, -0.2)); poly(c, [a, ap, b], col);
    poly(c, [[x - w * 0.32, y], [x - w * 0.14, y - h * 0.74], [x + w * 0.04, y]], T.lit ? '#ffdc8a' : shade(col, -0.55));
    if (T.lit) { glow(c, x - w * 0.14, y - h * 0.3, w * 0.75, '#ffd98a', 0.34 + 0.06 * k); poly(c, [[x - w * 0.24, y], [x - w * 0.14, y - h * 0.4], [x - w * 0.04, y]], '#fff3c8'); }
    poly(c, [[x - w * 0.14, y - h * 0.74], [x - w * 0.32, y], [x - w * 0.39, y], [x - w * 0.2, y - h * 0.5]], shade(col, 0.2)); poly(c, [[x - w * 0.14, y - h * 0.74], [x + w * 0.04, y], [x + w * 0.11, y], [x - w * 0.07, y - h * 0.5]], shade(col, 0.2));
    c.strokeStyle = shade(col, 0.42); c.lineWidth = w * 0.022; c.lineJoin = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(ap[0], ap[1]); c.lineTo(b[0], b[1]); c.moveTo(ap[0], ap[1]); c.lineTo(rd[0], rd[1]); c.stroke();
    for (i = 1; i < 4; i++) L(c, ap[0] + (rd[0] - ap[0]) * i / 4, ap[1] + (rd[1] - ap[1]) * i / 4, b[0] + (back[0] - b[0]) * i / 4, b[1] + (back[1] - b[1]) * i / 4, w * 0.008, alpha('#000000', 0.14));
    L(c, ap[0], ap[1], ap[0], ap[1] - h * 0.2, w * 0.014, '#6a4a32'); poly(c, [[ap[0], ap[1] - h * 0.2], [ap[0] + w * 0.1, ap[1] - h * 0.15], [ap[0], ap[1] - h * 0.1]], T.g('#ffd23f'));
    L(c, a[0] + w * 0.1, y - h * 0.28, a[0] - w * 0.1, y + h * 0.04, w * 0.008, alpha('#ffffff', 0.5)); L(c, back[0] - w * 0.06, back[1] - h * 0.3, back[0] + w * 0.1, back[1] + h * 0.1, w * 0.008, alpha('#ffffff', 0.5));
  }
  function campfire(c, x, y, s, t, k) {
    var i; glow(c, x, y - s * 2, s * (19 + k * 2), '#ffb04a', 0.4); el(c, x, y + s * 0.3, s * 5, s * 1.1, 'rgba(20,10,10,0.28)');
    for (i = 0; i < 9; i++) { var a = i / 9 * TAU, sy = Math.sin(a); if (sy < 0) rock(c, x + Math.cos(a) * s * 3.7, y + sy * s * 0.9 + s * 0.4, s * 0.85, i % 2 ? '#8a8894' : '#75727f'); }
    for (i = -1; i <= 1; i += 2) { c.save(); c.translate(x, y - s * 0.3); c.rotate(i * 0.42); Rn(c, -s * 3.2, -s * 0.55, s * 6.4, s * 1.1, s * 0.5, i < 0 ? '#6a4226' : '#7c5030'); el(c, i * s * 3, 0, s * 0.3, s * 0.52, '#d9b07a'); c.restore(); }
    flame(c, x - s * 1.2, y - s * 0.5, s * 2.2, s * 4, t, 2); flame(c, x + s * 1.3, y - s * 0.5, s * 2, s * 3.5, t, 4); flame(c, x, y - s * 0.5, s * 3.8, s * 7, t, 0);
    for (i = 0; i < 9; i++) { var f = frac(t * 0.33 + i / 9); dot(c, x + Math.sin(f * 6 + i * 2.1) * s * 1.8, y - s * 5 - f * s * 13, s * (0.3 - 0.18 * f), 'rgba(255,214,130,' + (0.95 * (1 - f)).toFixed(3) + ')'); }
    for (i = 0; i < 9; i++) { var a2 = i / 9 * TAU, sy2 = Math.sin(a2); if (sy2 >= 0) rock(c, x + Math.cos(a2) * s * 3.7, y + sy2 * s * 0.9 + s * 0.4, s * 0.9, i % 2 ? '#9a98a4' : '#807d8a'); }
  }
  function logSeat(c, x, y, w, col) { el(c, x, y + w * 0.02, w * 0.56, w * 0.07, 'rgba(10,10,30,0.22)'); Rn(c, x - w / 2, y - w * 0.3, w, w * 0.3, w * 0.14, col); Rn(c, x - w * 0.42, y - w * 0.27, w * 0.8, w * 0.06, w * 0.03, shade(col, 0.2)); el(c, x + w * 0.44, y - w * 0.15, w * 0.07, w * 0.14, '#dcb884'); el(c, x + w * 0.44, y - w * 0.15, w * 0.035, w * 0.07, '#b98a52'); }
  function guitar(c, x, y, s, rot) { /* leaning, its foot at (x, y) */
    c.save(); c.translate(x, y); c.rotate(rot); el(c, 0, -s * 1.5, s * 1.5, s * 1.5, '#b9763a'); el(c, 0, -s * 3.4, s * 1.1, s * 1.1, '#b9763a'); el(c, 0, -s * 1.5, s * 1.25, s * 1.25, '#e0a55a'); el(c, 0, -s * 3.4, s * 0.88, s * 0.88, '#e0a55a'); Rn(c, -s * 0.9, -s * 3, s * 1.8, s * 1, 0, '#e0a55a');
    dot(c, 0, -s * 2.7, s * 0.5, '#4a2c1a'); Rn(c, -s * 0.5, -s * 1.3, s * 1, s * 0.25, s * 0.1, '#4a2c1a'); Rn(c, -s * 0.22, -s * 8, s * 0.44, s * 5, 0, '#6a4226'); Rn(c, -s * 0.36, -s * 9, s * 0.72, s * 1.2, s * 0.2, '#4a2c1a');
    L(c, -s * 0.1, -s * 8.4, -s * 0.1, -s * 1.2, s * 0.05, 'rgba(255,255,255,0.6)'); L(c, s * 0.1, -s * 8.4, s * 0.1, -s * 1.2, s * 0.05, 'rgba(255,255,255,0.6)'); c.restore();
  }
  function backpack(c, x, y, s, col, col2) { Rn(c, x - s * 2.2, y - s * 6.4, s * 4.4, s * 1.6, s * 0.8, col2); dot(c, x - s * 2.2, y - s * 5.6, s * 0.8, shade(col2, 0.3)); Rn(c, x - s * 2, y - s * 5, s * 4, s * 5, s * 1, col); Rn(c, x - s * 2, y - s * 5, s * 4, s * 1.7, s * 0.8, shade(col, 0.15)); Rn(c, x - s * 1.3, y - s * 2.6, s * 2.6, s * 2, s * 0.5, shade(col, -0.15)); Rn(c, x - s * 0.3, y - s * 3.6, s * 0.6, s * 0.8, s * 0.15, '#f2c14e'); L(c, x - s * 1.3, y - s * 1.9, x + s * 1.3, y - s * 1.9, s * 0.14, shade(col, 0.3)); }
  Art.add('backdrop', 'campsite', function (c, W, H, t, p, o, u) {
    var T = time(p, o.variant), i, hz = H * 0.62, G = mix(grassOf(p), '#5f8a4a', 0.4), k = Math.exp(-5 * o.beat), pc = mix('#2f6a55', p.accent2, 0.25);
    var S = sky(c, W, H, t, p, o, u, T, hz + u * 2, T.night ? W * 0.74 : W * 0.4, H * 0.115);
    if (T.night) { c.save(); c.translate(W * 0.42, H * 0.24); c.rotate(-0.55); el(c, 0, 0, Math.max(W, H) * 0.6, u * 9, 'rgba(200,210,255,0.06)'); el(c, 0, 0, Math.max(W, H) * 0.5, u * 4.5, 'rgba(220,225,255,0.07)'); c.restore(); K.skyStars(c, W, H, 50, o.seed + 'mw', t, hz * 0.7, '#ffffff'); }
    var mc = T.g(mix(mix('#7a7fae', p.bg, 0.35), S.low, T.dusk ? 0.3 : 0.12)), sn = T.dusk ? '#ffcdb4' : T.g('#f4f6ff');
    peak(c, W * 0.2, hz - u * 21, u * 30, hz + u, mc, sn, 0.3); peak(c, W * 0.83, hz - u * 24, u * 33, hz + u, mc, sn, 0.3); peak(c, W * 0.52, hz - u * 12, u * 26, hz + u, shade(mc, 0.07), null);
    var f1 = hill(c, W, H, hz - u * 3, u * 2.2, T.g(mix(pc, S.low, 0.34)), o.seed + 'c1', 1); K.pinesOn(c, W, f1, 16, o.seed + 'c1', u * 6, u * 12, T.g(mix(pc, S.low, 0.2)), null);
    hill(c, W, H, H * 0.69, u * 1.4, T.g(G), o.seed + 'c2', 0.8); hill(c, W, H, H * 0.8, u * 1.6, T.g(shade(G, -0.08)), o.seed + 'c3', 1.2);
    groundShade(c, W, H, H * 0.74, T.g(shade(G, -0.55)), 0.35);
    pine(c, W * 0.14, H * 0.735, u * 40, T.g(shade(pc, 0.06)), null, 4); pine(c, W * 0.89, H * 0.73, u * 46, T.g(shade(pc, 0.04)), null, 4);
    /* the lantern pole */
    var lx = W * 0.75, ly = H * 0.725, wd = T.g('#7a5230'); Rn(c, lx - u * 0.5, ly - u * 21, u * 1, u * 21, u * 0.3, wd); L(c, lx, ly - u * 20, lx - u * 4, ly - u * 21.5, u * 0.7, wd); lantern(c, lx - u * 4, ly - u * 21.5, u * 1.25, true, k, T.g('#3a3340'));
    tent(c, W * 0.34, H * 0.718, u * 29, u * 18, T.night ? mix(T.g(p.accent), p.accent, 0.55) : T.g(p.accent), T, k);
    pine(c, W * 0.07, H * 0.765, u * 52, T.g(shade(pc, -0.05)), null, 5); pine(c, W * 0.945, H * 0.77, u * 58, T.g(shade(pc, -0.06)), null, 5);
    pine(c, W * 0.005, H * 0.8, u * 70, T.g(shade(pc, -0.14)), null, 5); pine(c, W * 1.0, H * 0.81, u * 78, T.g(shade(pc, -0.16)), null, 5);
    /* round the fire */
    var fy = H * 0.957;
    logSeat(c, W * 0.5 - u * 22, fy + u * 1, u * 18, T.g('#7c5030')); logSeat(c, W * 0.5 + u * 22, fy + u * 1.6, u * 18, T.g('#6f462a'));
    campfire(c, W * 0.5, fy, u * 2.1, t, k);
    L(c, W * 0.5 - u * 15.5, fy - u * 4.2, W * 0.5 - u * 4.6, fy - u * 9.6, u * 0.45, T.g('#8a6444')); dot(c, W * 0.5 - u * 4.8, fy - u * 9.5, u * 1, '#fff6ea'); dot(c, W * 0.5 - u * 6.5, fy - u * 8.65, u * 1, '#fff0dc');
    backpack(c, W * 0.1, H * 0.99, u * 2.5, mix(T.g(p.accent2), p.accent2, 0.4), mix(T.g(p.gold), p.gold, 0.4)); guitar(c, W * 0.5 + u * 32, fy + u * 2, u * 1.75, 0.24);
    tufts(c, W, H * 0.9, H * 0.995, 22, o.seed, u, T.g(shade(G, 0.2)), t);
    fireflies(c, W, H * 0.45, H * 0.9, T.night ? 16 : 8, o.seed, t, u);
  }, { variants: ['dusk', 'night'], stage: 'band-low' });

  /* ---------- a lake: snow peaks and a pine shore, still water with a rowboat, reeds, a cabin over the water, a canoe on the grass ---------- */
  function duck(c, x, y, s, d, body, head, t, ph) {
    y += Math.sin(t * 1.6 + ph) * s * 0.08;
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = s * 0.1; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - d * s * 1.2, y + s * 0.3); c.lineTo(x - d * s * 3.2, y + s * 0.1); c.moveTo(x - d * s * 1.2, y + s * 0.42); c.lineTo(x - d * s * 3, y + s * 0.8); c.stroke();
    poly(c, [[x - d * s * 0.8, y - s * 0.2], [x - d * s * 1.6, y - s * 0.65], [x - d * s * 0.7, y + s * 0.25]], body); el(c, x, y, s * 1.1, s * 0.55, body); el(c, x - d * s * 0.1, y - s * 0.05, s * 0.6, s * 0.3, shade(body, -0.16));
    dot(c, x + d * s * 0.85, y - s * 0.7, s * 0.42, head); poly(c, [[x + d * s * 1.2, y - s * 0.8], [x + d * s * 1.8, y - s * 0.62], [x + d * s * 1.2, y - s * 0.5]], '#e8a23a'); dot(c, x + d * s * 0.95, y - s * 0.78, s * 0.08, '#1a1a20');
  }
  function cabin(c, x, y, s, T, p, t, k) { /* a log cabin, base centre (x, y); s = its unit */
    var wood = T.g('#96633c'), roof = T.g(mix('#7a3d3a', p.accent, 0.3)), i;
    smokeUp(c, x + s * 2.6, y - s * 7.4, s * 0.8, t, '#ffffff'); Rn(c, x + s * 2, y - s * 7, s * 1.2, s * 2.6, 0, T.g('#8a8894'));
    Rn(c, x - s * 4.5, y - s * 4, s * 9, s * 4, s * 0.3, wood); for (i = 1; i < 4; i++) Rn(c, x - s * 4.5, y - s * 4 + i * s, s * 9, s * 0.16, 0, shade(wood, -0.25));
    poly(c, [[x - s * 5.4, y - s * 3.8], [x, y - s * 7.2], [x + s * 5.4, y - s * 3.8]], roof); poly(c, [[x - s * 5.4, y - s * 3.8], [x, y - s * 7.2], [x + s * 0.8, y - s * 6.7], [x - s * 4.4, y - s * 3.8]], shade(roof, 0.16));
    if (T.lit) glow(c, x + s * 2, y - s * 2.2, s * 6, '#ffd98a', 0.34 + 0.05 * k);
    Rn(c, x - s * 3, y - s * 3, s * 1.8, s * 3, s * 0.2, shade(wood, -0.3)); dot(c, x - s * 1.6, y - s * 1.5, s * 0.16, '#f2c14e');
    Rn(c, x + s * 0.9, y - s * 3.2, s * 2.3, s * 2, s * 0.2, shade(wood, 0.3)); Rn(c, x + s * 1.15, y - s * 2.95, s * 1.8, s * 1.5, s * 0.1, T.lit ? '#ffdf8a' : T.g('#cfe6f5')); L(c, x + s * 2.05, y - s * 2.95, x + s * 2.05, y - s * 1.45, s * 0.14, shade(wood, 0.3)); L(c, x + s * 1.15, y - s * 2.2, x + s * 2.95, y - s * 2.2, s * 0.14, shade(wood, 0.3));
  }
  Art.add('backdrop', 'lake', function (c, W, H, t, p, o, u) {
    var T = time(p, o.variant), i, R0 = rnd(o.seed + 'lk'), hz = H * 0.585, wy = H * 0.77, G = grassOf(p), k = Math.exp(-5 * o.beat), sx = T.night ? W * 0.66 : T.dusk ? W * 0.4 : W * 0.27, cbx = W * 0.57;
    var S = sky(c, W, H, t, p, o, u, T, hz + u, sx, H * 0.11), pc = T.g(mix('#2f6a55', p.accent2, 0.25));
    var mc = T.g(mix(mix('#7f86b8', p.bg, 0.4), S.low, 0.22)), sn = T.dusk ? '#ffd2bc' : T.g('#ffffff');
    peak(c, W * 0.13, hz - u * 25, u * 31, hz, mc, sn); peak(c, W * 0.9, hz - u * 28, u * 36, hz, mc, sn); peak(c, W * 0.38, hz - u * 13, u * 24, hz, shade(mc, 0.08), sn, 0.26); peak(c, W * 0.64, hz - u * 10, u * 22, hz, shade(mc, 0.08), null);
    if (!T.night) birds(c, frac(0.6 + t * 0.007) * W * 1.3 - W * 0.15, H * 0.24, u * 1.6, 4, t, alpha(T.g('#4a4458'), 0.7), o.seed);
    var f1 = hill(c, W, H, hz - u * 2.6, u * 1.3, mix(pc, S.low, 0.3), o.seed + 'l1', 1.1); K.pinesOn(c, W, f1, 20, o.seed + 'l1', u * 4, u * 8.5, mix(pc, S.low, 0.16), null);
    cabin(c, cbx, hz + u * 0.3, u * 1.05, T, p, t, k);
    var wc = T.night ? dk(mix(p.bg, '#1c3f78', 0.45), S.k * 0.8) : T.dusk ? mix(mix(p.bg, '#56509e', 0.72), '#f08a7a', 0.16) : mix(p.bg, '#2f8ac8', 0.66);
    water(c, W, hz, wy, mix(S.low, wc, 0.45), wc, t, u, o.seed, 'rgba(255,255,255,0.8)', 44);
    var g = c.createLinearGradient(0, hz, 0, hz + u * 9); g.addColorStop(0, alpha(pc, 0.5)); g.addColorStop(1, alpha(pc, 0)); c.fillStyle = g; c.fillRect(0, hz, W, u * 9);
    c.fillStyle = alpha('#ffffff', 0.35); c.fillRect(0, hz, W, u * 0.25);
    if (T.lit) { c.globalAlpha = 0.5; Rn(c, cbx + u * 1.2, hz + u * 0.8, u * 1.9, u * 5, u * 0.8, '#ffdf8a'); c.globalAlpha = 1; }
    glitter(c, sx, hz + u * 0.8, wy - u * 9, u * 9, T.night ? '#fff3d2' : T.dusk ? '#ffe9a8' : '#ffffff', t, u);
    if (!T.night) { var bx = W * (0.36 + 0.06 * Math.sin(t * 0.07)), by = hz + u * 4.6; el(c, bx, by + u * 0.9, u * 3, u * 0.4, 'rgba(10,20,50,0.18)'); poly(c, [[bx - u * 2.6, by], [bx + u * 2.6, by], [bx + u * 1.8, by + u * 0.9], [bx - u * 2, by + u * 0.9]], T.g('#ffffff')); L(c, bx, by, bx, by - u * 5.6, u * 0.16, T.g('#6a4a32')); poly(c, [[bx + u * 0.3, by - u * 5.4], [bx + u * 2.5, by - u * 0.5], [bx + u * 0.3, by - u * 0.5]], T.g('#ffffff')); poly(c, [[bx - u * 0.3, by - u * 4.6], [bx - u * 2, by - u * 0.5], [bx - u * 0.3, by - u * 0.5]], T.g(p.accent)); }
    var dxx = W * (0.6 + 0.02 * Math.sin(t * 0.12)), dyy = hz + u * 10.5; duck(c, dxx, dyy, u * 1.3, 1, T.g('#b98a5a'), T.g('#2f7a55'), t, 0); duck(c, dxx - u * 4.4, dyy + u * 0.9, u * 0.8, 1, T.g('#f2d46a'), T.g('#f2d46a'), t, 1); duck(c, dxx - u * 7, dyy + u * 0.5, u * 0.8, 1, T.g('#f2d46a'), T.g('#f2d46a'), t, 2.2);
    rowboat(c, W * 0.3, H * 0.7, u * 18, T.g(p.accent), t, 0);
    for (i = 0; i < 8; i++) { var px = W * (0.52 + R0() * 0.3), py = H * (0.705 + R0() * 0.022), pr = u * (1.3 + R0() * 1.1), pa = R0() * TAU; c.beginPath(); c.ellipse(px, py, pr, pr * 0.36, 0, pa, pa + TAU * 0.9); c.lineTo(px, py); c.closePath(); c.fillStyle = T.g(i % 2 ? shade(G, -0.1) : G); c.fill(); if (i % 3 === 0) { dot(c, px, py - pr * 0.2, pr * 0.36, T.g('#ffd0e0')); dot(c, px, py - pr * 0.25, pr * 0.18, '#ffe27a'); } }
    /* the near shore: a strip of sand, then grass */
    var sand = T.g(mix('#e8cf9a', p.bg2, 0.3)), bank = function (x) { return H * (0.716 + 0.024 * Math.sin(PI * x / W)) + Math.sin(x / W * 13) * u * 0.4; }, pass;
    for (pass = 0; pass < 2; pass++) { c.beginPath(); c.moveTo(0, H); for (i = 0; i <= 28; i++) c.lineTo(i / 28 * W, bank(i / 28 * W) + (pass ? u * 1.3 : 0)); c.lineTo(W, H); c.closePath(); c.fillStyle = pass ? T.g(G) : sand; c.fill(); }
    hill(c, W, H, H * 0.81, u * 1.5, T.g(shade(G, -0.08)), o.seed + 'l3', 1.2); groundShade(c, W, H, H * 0.76, T.g(shade(G, -0.55)), 0.32);
    for (i = 0; i < 9; i++) { var cx = i < 5 ? W * (0.015 + i * 0.045 + R0() * 0.02) : W * (0.83 + (i - 5) * 0.04 + R0() * 0.02); cattail(c, cx, bank(cx) + u * 1.6, u * (10 + R0() * 7), t, i, T.g(shade(G, -0.3)), T.g('#6b4423')); }
    pine(c, W * 0.03, H * 0.785, u * 62, T.g(mix('#2a5f4c', p.accent2, 0.2)), null, 5); pine(c, W * 0.12, H * 0.745, u * 34, T.g(mix('#347058', p.accent2, 0.2)), null, 4);
    var bt = tree(c, W * 0.955, H * 0.79, u * 80, T.g(mix('#8fca5a', G, 0.4)), T.g('#f2eee2'), Math.sin(t * 0.6) * u * 0.4, 0.04);
    for (i = 0; i < 9; i++) Rn(c, W * 0.955 - u * (1.6 - (i % 3) * 1.1), H * 0.79 - u * (4 + i * 4.3), u * (1 + (i % 2) * 0.7), u * 0.42, u * 0.2, T.g('#4a4048'));
    for (i = 0; i < 7; i++) { var la = PI * 0.25 + i * 0.36, lx = bt[0] + Math.cos(la) * bt[2] * 1.02, ly = bt[1] + Math.sin(la) * bt[2] * 0.9; c.strokeStyle = T.g(mix('#6fae4a', G, 0.4)); c.lineWidth = u * 0.9; c.lineCap = 'round'; c.beginPath(); c.moveTo(lx, ly - u * 2); c.quadraticCurveTo(lx + Math.sin(t * 0.8 + i) * u * 0.8, ly + u * 4, lx + Math.sin(t * 0.8 + i) * u * 1.6, ly + u * (6 + (i % 3) * 3)); c.stroke(); }
    /* on the grass: a canoe and its paddle, stones, flowers */
    canoe(c, W * 0.66, H * 0.955, u * 38, mix(T.g(p.accent2), p.accent2, T.night ? 0.3 : 0), -0.05); L(c, W * 0.5, H * 0.985, W * 0.7, H * 0.925, u * 0.6, T.g('#c99a5e')); el(c, W * 0.71, H * 0.921, u * 2.6, u * 1.1, T.g('#c99a5e'), -0.3);
    rock(c, W * 0.1, H * 0.985, u * 4.4, T.g('#9a98a4')); rock(c, W * 0.2, H * 0.995, u * 2.8, T.g('#85828f')); rock(c, W * 0.93, H * 0.99, u * 3.4, T.g('#8f8c99'));
    blooms(c, W, H * 0.89, H * 0.97, 14, o.seed, u * 1.4, [T.g('#ffffff'), T.g(p.gold), T.g(mix('#ff8fb4', p.accent, 0.3))], t, T.g(shade(G, -0.3)), 0, W * 0.42);
    tufts(c, W, H * 0.9, H * 0.995, 24, o.seed, u, T.g(shade(G, 0.2)), t);
    if (T.lit) fireflies(c, W, H * 0.55, H * 0.9, T.night ? 14 : 7, o.seed, t, u);
  }, { variants: ['day', 'dusk', 'night'], stage: 'band-low' });

  /* ---------- a fishing dock: a plank deck over the water, mooring posts and rope, a lantern, a rod with its float out, a gull, a bucket of fish ---------- */
  function post(c, x, top, bot, w, col, rope) { Rn(c, x - w / 2, top, w, bot - top, w * 0.2, col); Rn(c, x + w * 0.12, top, w * 0.38, bot - top, w * 0.2, shade(col, -0.18)); el(c, x, top, w / 2, w * 0.2, shade(col, 0.25)); Rn(c, x - w * 0.56, top + w * 0.9, w * 1.12, w * 0.3, w * 0.1, shade(rope, 0.15)); Rn(c, x - w * 0.56, top + w * 1.35, w * 1.12, w * 0.3, w * 0.1, rope); }
  function gull(c, x, y, s, d) { L(c, x - s * 0.2, y - s * 0.6, x - s * 0.2, y, s * 0.1, '#e8a23a'); L(c, x + s * 0.2, y - s * 0.6, x + s * 0.2, y, s * 0.1, '#e8a23a'); el(c, x, y - s * 1.1, s * 1.15, s * 0.62, '#ffffff', -0.15 * d); poly(c, [[x - d * s * 0.3, y - s * 1.5], [x - d * s * 1.9, y - s * 0.95], [x - d * s * 0.2, y - s * 0.8]], '#9aa6b8'); poly(c, [[x - d * s * 1.5, y - s * 1.05], [x - d * s * 2.1, y - s * 0.85], [x - d * s * 1.5, y - s * 0.8]], '#3a3a44'); dot(c, x + d * s * 0.9, y - s * 1.75, s * 0.46, '#ffffff'); poly(c, [[x + d * s * 1.25, y - s * 1.9], [x + d * s * 2, y - s * 1.65], [x + d * s * 1.25, y - s * 1.5]], '#f2b53a'); dot(c, x + d * s * 1, y - s * 1.82, s * 0.08, '#1a1a20'); }
  Art.add('backdrop', 'dock', function (c, W, H, t, p, o, u) {
    var T = time(p, o.variant), i, j, R0 = rnd(o.seed + 'dk'), hz = H * 0.56, dy = H * 0.7, k = Math.exp(-5 * o.beat), sx = T.night ? W * 0.7 : T.dusk ? W * 0.6 : W * 0.27;
    var S = sky(c, W, H, t, p, o, u, T, hz + u, sx, H * 0.11), pc = T.g(mix('#2f6a55', p.accent2, 0.25)), wood = T.g(mix('#c0935f', p.bg2, 0.15)), dark = T.g('#8a6444');
    if (!T.night) birds(c, frac(0.1 + t * 0.008) * W * 1.3 - W * 0.15, H * 0.2, u * 1.7, 4, t, alpha(T.g('#4a4458'), 0.7), o.seed);
    hill(c, W, H, hz - u * 6, u * 3.4, mix(mix(pc, p.bg, 0.3), S.low, 0.5), o.seed + 'd0', 0.8);
    var f1 = hill(c, W, H, hz - u * 2.4, u * 1.4, mix(pc, S.low, 0.3), o.seed + 'd1', 1.1); K.pinesOn(c, W, f1, 22, o.seed + 'd1', u * 3.4, u * 7, mix(pc, S.low, 0.16), null);
    var wc = T.night ? dk(mix(p.bg, '#1c3f78', 0.45), S.k * 0.8) : T.dusk ? mix(mix(p.bg, '#56509e', 0.72), '#f08a7a', 0.16) : mix(p.bg, '#2f8ac8', 0.66);
    water(c, W, hz, dy + u * 2, mix(S.low, wc, 0.45), wc, t, u, o.seed, 'rgba(255,255,255,0.8)', 44);
    var g = c.createLinearGradient(0, hz, 0, hz + u * 8); g.addColorStop(0, alpha(pc, 0.5)); g.addColorStop(1, alpha(pc, 0)); c.fillStyle = g; c.fillRect(0, hz, W, u * 8); c.fillStyle = alpha('#ffffff', 0.35); c.fillRect(0, hz, W, u * 0.25);
    glitter(c, sx, hz + u * 0.8, dy - u * 2, u * 9, T.night ? '#fff3d2' : T.dusk ? '#ffe9a8' : '#ffffff', t, u);
    /* a far fishing boat, a buoy, the float and its rings */
    var bx = W * (0.42 + 0.05 * Math.sin(t * 0.06)), by = hz + u * 3.6; el(c, bx, by + u * 1, u * 3.6, u * 0.4, 'rgba(10,20,50,0.2)'); poly(c, [[bx - u * 3.4, by - u * 0.4], [bx + u * 3.6, by - u * 0.4], [bx + u * 2.6, by + u * 1], [bx - u * 2.6, by + u * 1]], T.g(p.accent2)); Rn(c, bx - u * 1.6, by - u * 2.4, u * 2.6, u * 2, u * 0.3, T.g('#ffffff')); Rn(c, bx - u * 1.1, by - u * 2, u * 1.6, u * 0.9, u * 0.1, T.lit ? '#ffdf8a' : T.g('#8fc0e6')); L(c, bx + u * 1.6, by - u * 0.4, bx + u * 1.6, by - u * 4.4, u * 0.18, T.g('#6a4a32'));
    var uy = hz + u * 8 + Math.sin(t * 1.4) * u * 0.25, ux = W * 0.8; c.save(); c.translate(ux, uy); c.rotate(Math.sin(t * 1.1) * 0.1); el(c, 0, u * 0.9, u * 1.6, u * 0.3, 'rgba(10,20,50,0.2)'); poly(c, [[-u * 1, u * 0.8], [-u * 0.5, -u * 1.6], [u * 0.5, -u * 1.6], [u * 1, u * 0.8]], T.g(mix('#e8452f', p.accent, 0.4))); Rn(c, -u * 0.78, -u * 0.5, u * 1.56, u * 0.6, 0, T.g('#ffffff')); L(c, 0, -u * 1.6, 0, -u * 2.5, u * 0.2, T.g('#4a4458')); dot(c, 0, -u * 2.7, u * 0.4, T.lit ? '#ffe9a8' : T.g('#ffd23f')); c.restore(); if (T.lit) glow(c, ux, uy - u * 2.7, u * 3, '#ffe9a8', 0.5);
    var fx = W * 0.6, fy = dy - u * 5.2 + Math.sin(t * 1.7) * u * 0.2;
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = u * 0.2; for (i = 0; i < 2; i++) { var rf = frac(t * 0.3 + i * 0.5); c.globalAlpha = 1 - rf; c.beginPath(); c.ellipse(fx, fy + u * 0.5, u * (1 + rf * 4.5), u * (0.3 + rf * 1.2), 0, 0, TAU); c.stroke(); } c.globalAlpha = 1;
    rowboat(c, W * 0.25, dy - u * 3.4, u * 21, T.g(p.accent), t, 1);
    /* the deck */
    vgrad2(c, 0, dy, W, H - dy, wood, shade(wood, -0.24));
    var n = 9; for (i = 1; i <= n; i++) { var y0 = dy + (H - dy) * Math.pow((i - 1) / n, 1.45), y1 = dy + (H - dy) * Math.pow(i / n, 1.45); if (i % 2) { c.fillStyle = alpha('#ffffff', 0.06); c.fillRect(0, y0, W, y1 - y0); } c.fillStyle = shade(wood, -0.42); c.fillRect(0, y1 - u * 0.2, W, Math.max(1, u * 0.34)); c.fillStyle = alpha('#ffffff', 0.14); c.fillRect(0, y0, W, Math.max(1, u * 0.16));
      for (j = 0; j < 3; j++) { var sxx = W * ((j + R0()) / 3); c.fillStyle = shade(wood, -0.42); c.fillRect(sxx, y0, Math.max(1, u * 0.3), y1 - y0); var nr = u * (0.16 + 0.24 * i / n); dot(c, sxx - nr * 5, y0 + (y1 - y0) * 0.3, nr, shade(wood, -0.5)); dot(c, sxx + nr * 6, y0 + (y1 - y0) * 0.3, nr, shade(wood, -0.5)); dot(c, sxx - nr * 5, y0 + (y1 - y0) * 0.72, nr, shade(wood, -0.5)); dot(c, sxx + nr * 6, y0 + (y1 - y0) * 0.72, nr, shade(wood, -0.5)); } }
    Rn(c, 0, dy - u * 0.9, W, u * 1.9, 0, shade(wood, 0.16)); Rn(c, 0, dy + u * 0.7, W, u * 0.5, 0, shade(wood, -0.35));
    groundShade(c, W, H, H * 0.8, shade(wood, -0.6), 0.26);
    /* mooring posts, rope, a lantern, a life ring, a gull */
    var px = [W * 0.045, W * 0.25, W * 0.75, W * 0.955], pt = [dy - u * 17, dy - u * 8, dy - u * 8, dy - u * 17];
    c.lineCap = 'round'; for (i = 0; i < 3; i += 2) { c.beginPath(); c.moveTo(px[i], pt[i] + u * 3.6); c.quadraticCurveTo((px[i] + px[i + 1]) / 2, dy - u * 1.5, px[i + 1], pt[i + 1] + u * 3.6); c.lineWidth = u * 0.9; c.strokeStyle = T.g('#d9c494'); c.stroke(); c.lineWidth = u * 0.25; c.strokeStyle = T.g('#b9a070'); c.stroke(); }
    c.beginPath(); c.moveTo(px[1], pt[1] + u * 4.5); c.quadraticCurveTo(W * 0.27, dy - u * 2, W * 0.31, dy - u * 4); c.lineWidth = u * 0.35; c.strokeStyle = T.g('#d9c494'); c.stroke();
    for (i = 0; i < 4; i++) post(c, px[i], pt[i], dy + u * 4.5, i % 3 ? u * 3.6 : u * 4.6, dark, T.g('#d9c494'));
    L(c, px[0], pt[0] + u * 1.4, px[0] + u * 7, pt[0] - u * 2, u * 0.8, T.g('#3a3340')); lantern(c, px[0] + u * 7, pt[0] - u * 2, u * 1.9, T.lit, k, T.g('#3a3340'));
    var ry = pt[3] + u * 9.5, rc = T.g(mix('#e8452f', p.accent, 0.4)); c.lineWidth = u * 1.7; c.strokeStyle = T.g('#ffffff'); c.beginPath(); c.arc(px[3], ry, u * 3.1, 0, TAU); c.stroke(); c.strokeStyle = rc; for (i = 0; i < 4; i++) { c.beginPath(); c.arc(px[3], ry, u * 3.1, i * PI / 2 + 0.3, i * PI / 2 + 1.27); c.lineCap = 'butt'; c.stroke(); } c.lineCap = 'round';
    if (!T.night) gull(c, px[2], pt[2] - u * 0.2, u * 1.7, -1);
    /* the rod, propped on the rail, its line out to the float */
    var tx = W * 0.615, ty = dy - u * 25; c.beginPath(); c.moveTo(W * 0.7, dy + u * 3.4); c.quadraticCurveTo(W * 0.67, dy - u * 12, tx, ty); c.lineWidth = u * 0.6; c.strokeStyle = T.g('#4a3a34'); c.stroke(); dot(c, W * 0.694, dy - u * 1.2, u * 1.1, T.g('#c9cfd6')); dot(c, W * 0.694, dy - u * 1.2, u * 0.45, T.g('#6a6470')); Rn(c, W * 0.7 - u * 0.6, dy + u * 0.4, u * 1.2, u * 3.4, u * 0.5, T.g('#c98a4a'));
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(fx - u * 0.6, fy - u * 12, fx, fy); c.lineWidth = Math.max(0.7, u * 0.12); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    dot(c, fx, fy, u * 0.75, T.g('#ffffff')); c.beginPath(); c.arc(fx, fy, u * 0.75, PI, 0); c.fillStyle = rc; c.fill(); L(c, fx, fy - u * 0.7, fx, fy - u * 1.5, u * 0.14, rc);
    /* by our feet: a tackle box, a coil of rope, a bucket of fish */
    var bxx = W * 0.15, byy = H * 0.982, tb = mix(T.g(p.accent2), p.accent2, T.night ? 0.3 : 0); c.save(); c.translate(bxx, byy); c.scale(1.45, 1.45); c.translate(-bxx, -byy); el(c, bxx, byy, u * 7.4, u * 0.9, 'rgba(20,10,10,0.22)'); Rn(c, bxx - u * 6.5, byy - u * 6, u * 13, u * 6, u * 0.8, tb); Rn(c, bxx - u * 6.5, byy - u * 6, u * 13, u * 2.2, u * 0.8, shade(tb, 0.2)); Rn(c, bxx - u * 6.5, byy - u * 4, u * 13, u * 0.3, 0, shade(tb, -0.3)); Rn(c, bxx - u * 1, byy - u * 4.6, u * 2, u * 1.5, u * 0.3, T.g('#f2c14e')); c.beginPath(); c.arc(bxx, byy - u * 6, u * 2.2, PI, 0); c.lineWidth = u * 0.6; c.strokeStyle = shade(tb, -0.35); c.stroke(); c.restore();
    for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(W * 0.42, H * 0.975 - i * u * 0.9, u * (6 - i * 0.4), u * (1.8 - i * 0.1), 0, 0, TAU); c.lineWidth = u * 1.2; c.strokeStyle = T.g(i % 2 ? '#d9c494' : '#c9b282'); c.stroke(); }
    var kx = W * 0.85, ky = H * 0.985, kc = T.g('#a9bccf'), fc = [T.g(mix('#8fd0e6', p.accent2, 0.3)), T.g('#c9d4e0'), T.g(mix('#ffb08a', p.accent, 0.3))];
    c.save(); c.translate(kx, ky); c.scale(1.4, 1.4); c.translate(-kx, -ky);
    el(c, kx, ky, u * 5, u * 0.9, 'rgba(20,10,10,0.22)');
    for (i = 0; i < 3; i++) { var qx = kx + (i - 1) * u * 2.4, wag = Math.sin(t * 3 + i * 2) * 0.18 * (i === 1 ? 1 : 0.3); c.save(); c.translate(qx, ky - u * 7.4); c.rotate((i - 1) * 0.3 + wag); el(c, 0, u * 0.6, u * 1, u * 2.4, fc[i]); poly(c, [[0, -u * 1.2], [-u * 1.5, -u * 3.2], [0, -u * 2.5], [u * 1.5, -u * 3.2]], shade(fc[i], -0.14)); c.restore(); }
    poly(c, [[kx - u * 4.4, ky - u * 7.6], [kx + u * 4.4, ky - u * 7.6], [kx + u * 3.4, ky], [kx - u * 3.4, ky]], kc); Rn(c, kx - u * 4.7, ky - u * 8, u * 9.4, u * 1.1, u * 0.5, shade(kc, 0.25)); Rn(c, kx - u * 4, ky - u * 4.6, u * 8, u * 0.5, 0, shade(kc, -0.2)); poly(c, [[kx - u * 3.4, ky - u * 6.6], [kx - u * 2.4, ky - u * 6.6], [kx - u * 2, ky - u * 0.6], [kx - u * 2.8, ky - u * 0.6]], 'rgba(255,255,255,0.3)'); c.restore();
    if (T.lit) fireflies(c, W, hz, dy, T.night ? 9 : 5, o.seed, t, u);
  }, { variants: ['day', 'dusk', 'night'], stage: 'band-low' });

  /* ---------- a river: it winds down from an old stone bridge between a willow and round trees; stepping stones, ducks, a heron ---------- */
  function heron(c, x, y, s, d, t, col) { /* standing in the shallows, feet at (x, y) */
    var nod = Math.sin(t * 0.7) * s * 0.12, hx = x + d * s * 1.5, hy = y - s * 6.3 + nod;
    L(c, x - s * 0.3, y, x - s * 0.2, y - s * 2.6, s * 0.14, '#6a6470'); L(c, x + s * 0.4, y, x + s * 0.3, y - s * 2.6, s * 0.14, '#6a6470');
    poly(c, [[x - d * s * 1.2, y - s * 3.2], [x - d * s * 2.6, y - s * 2.3], [x - d * s * 0.8, y - s * 2.5]], shade(col, -0.25)); el(c, x, y - s * 3.3, s * 1.5, s * 0.95, col, -0.3 * d); el(c, x - d * s * 0.3, y - s * 3.2, s * 1, s * 0.55, shade(col, -0.16), -0.3 * d);
    c.beginPath(); c.moveTo(x + d * s * 0.9, y - s * 3.7); c.bezierCurveTo(x + d * s * 2.3, y - s * 4.2, x + d * s * 0.2, y - s * 5.4, hx, hy); c.lineWidth = s * 0.42; c.lineCap = 'round'; c.strokeStyle = shade(col, 0.25); c.stroke();
    dot(c, hx, hy, s * 0.42, shade(col, 0.25)); poly(c, [[hx + d * s * 0.3, hy - s * 0.22], [hx + d * s * 2.1, hy + s * 0.12], [hx + d * s * 0.3, hy + s * 0.22]], '#e8a23a'); L(c, hx - d * s * 0.2, hy - s * 0.2, hx - d * s * 1.3, hy - s * 0.1, s * 0.16, '#3a3a50'); dot(c, hx + d * s * 0.12, hy - s * 0.08, s * 0.09, '#1a1a20');
  }
  function willow(c, x, y, h, t, col, trunk) {
    var i, cx = x + h * 0.08, cy = y - h * 0.72, r = h * 0.34;
    c.beginPath(); c.moveTo(x - h * 0.06, y); c.quadraticCurveTo(x - h * 0.01, y - h * 0.3, x + h * 0.04, y - h * 0.62); c.lineTo(x + h * 0.12, y - h * 0.62); c.quadraticCurveTo(x + h * 0.06, y - h * 0.3, x + h * 0.08, y); c.closePath(); c.fillStyle = trunk; c.fill();
    L(c, x + h * 0.07, y - h * 0.55, x + h * 0.26, y - h * 0.72, h * 0.03, trunk); L(c, x + h * 0.06, y - h * 0.5, x - h * 0.12, y - h * 0.7, h * 0.03, trunk);
    el(c, cx, cy, r, r * 0.7, shade(col, -0.14)); el(c, cx - r * 0.1, cy - r * 0.12, r * 0.86, r * 0.56, col);
    c.lineCap = 'round';
    for (i = 0; i < 17; i++) { var f = i / 16, sx = cx - r * 0.98 + f * r * 1.96, sy = cy + Math.sqrt(Math.max(0, 1 - Math.pow(f * 2 - 1, 2))) * r * 0.3, len = h * (0.26 + 0.2 * Math.sin(f * PI) + (i % 3) * 0.035), sw = Math.sin(t * 0.8 + i * 0.7) * h * 0.016;
      c.beginPath(); c.moveTo(sx, sy - h * 0.05); c.quadraticCurveTo(sx + sw * 0.4, sy + len * 0.5, sx + sw, sy + len); c.lineWidth = h * (0.034 - (i % 2) * 0.008); c.strokeStyle = i % 3 === 0 ? shade(col, 0.14) : i % 3 === 1 ? col : shade(col, -0.1); c.stroke(); }
    el(c, cx - r * 0.3, cy - r * 0.3, r * 0.4, r * 0.2, shade(col, 0.16));
  }
  Art.add('backdrop', 'river', function (c, W, H, t, p, o, u) {
    var T = time(p, o.variant), i, R0 = rnd(o.seed + 'rv'), hz = H * 0.58, G = grassOf(p), k = Math.exp(-5 * o.beat), sx = T.dusk ? W * 0.5 : W * 0.75;
    var S = sky(c, W, H, t, p, o, u, T, hz + u, sx, H * 0.11);
    var mc = T.g(mix(mix('#7f86b8', p.bg, 0.4), S.low, 0.3));
    peak(c, W * 0.2, hz - u * 17, u * 30, hz, mc, T.dusk ? '#ffd2bc' : T.g('#ffffff'), 0.26); peak(c, W * 0.74, hz - u * 13, u * 28, hz, shade(mc, 0.07), null);
    if (!T.night) birds(c, frac(0.4 + t * 0.008) * W * 1.3 - W * 0.15, H * 0.22, u * 1.7, 5, t, alpha(T.g('#4a4458'), 0.7), o.seed);
    var f0 = hill(c, W, H, hz - u * 4.5, u * 3, T.g(mix(mix(G, p.bg, 0.4), S.low, 0.25)), o.seed + 'r0', 0.7);
    for (i = 0; i < 16; i++) { var bx = (i + R0() * 0.8) / 16 * W, br = u * (2 + R0() * 2.4); el(c, bx, f0(bx) - br * 0.2, br, br * 0.9, T.g(mix(shade(G, -0.22), S.low, 0.25))); }
    hill(c, W, H, hz - u * 0.6, u * 1, T.g(mix(G, S.low, 0.22)), o.seed + 'r1', 1);
    c.fillStyle = T.g(G); c.fillRect(0, hz + u * 0.6, W, H - hz);
    groundShade(c, W, H, H * 0.76, T.g(shade(G, -0.55)), 0.3);
    /* the river: a centre line and a half width, both by depth f (0 at the bridge, 1 at our feet) */
    var cxf = function (f) { return W * (0.5 + 0.11 * Math.sin(f * PI * 1.7 + 0.5) * (1 - f * 0.75)); }, hwf = function (f) { return W * (0.014 + 0.3 * Math.pow(f, 1.45)); }, yf = function (f) { return hz + u * 0.4 + (H - hz - u * 0.4) * f; }, N = 30, pass;
    var wc = T.dusk ? mix(mix(p.bg, '#56509e', 0.72), '#f08a7a', 0.16) : mix(p.bg, '#2f8ac8', 0.66), wg = c.createLinearGradient(0, hz, 0, H); wg.addColorStop(0, mix(S.low, wc, 0.3)); wg.addColorStop(0.5, wc); wg.addColorStop(1, shade(wc, -0.14));
    for (pass = 0; pass < 2; pass++) { c.beginPath(); for (i = 0; i <= N; i++) { var f = i / N, e = pass ? 0 : u * (0.5 + 1.6 * f); if (i) c.lineTo(cxf(f) - hwf(f) - e, yf(f)); else c.moveTo(cxf(f) - hwf(f) - e, yf(f)); } for (i = N; i >= 0; i--) { var f2 = i / N, e2 = pass ? 0 : u * (0.5 + 1.6 * f2); c.lineTo(cxf(f2) + hwf(f2) + e2, yf(f2)); } c.closePath(); c.fillStyle = pass ? wg : T.g(mix('#e3cf9c', p.bg2, 0.3)); c.fill(); }
    if (T.dusk) for (i = 0; i < 16; i++) { var gf = 0.02 + i / 16 * 0.9, gw = hwf(gf) * (0.5 + 0.4 * Math.sin(t * 1.5 + i * 1.3)); c.globalAlpha = 0.5 - 0.3 * gf; Rn(c, cxf(gf) - gw / 2 + Math.sin(t + i * 2) * hwf(gf) * 0.15, yf(gf), gw, u * (0.25 + 0.4 * gf), u * 0.3, '#ffe9a8'); } c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineCap = 'round';
    for (i = 0; i < 36; i++) { var rf = frac(R0() + t * (0.02 + R0() * 0.02)), lat = (R0() - 0.5) * 1.7, rx = cxf(rf) + lat * hwf(rf), ry = yf(rf), len = u * (0.5 + 5 * rf); c.globalAlpha = 0.6 * Math.sin(PI * rf); c.lineWidth = u * (0.14 + 0.3 * rf); c.beginPath(); c.moveTo(rx - len / 2, ry); c.quadraticCurveTo(rx, ry + len * 0.08, rx + len / 2, ry); c.stroke(); }
    c.globalAlpha = 1;
    /* the bridge */
    var bf = 0.085, bx2 = cxf(bf), by2 = yf(bf), st = T.g(mix('#c2b6a6', p.bg2, 0.2));
    c.beginPath(); c.moveTo(bx2 - u * 9, by2 + u * 1.2); c.lineTo(bx2 - u * 9, by2 - u * 1.6); c.quadraticCurveTo(bx2, by2 - u * 5.4, bx2 + u * 9, by2 - u * 1.6); c.lineTo(bx2 + u * 9, by2 + u * 1.2); c.lineTo(bx2 + u * 3.6, by2 + u * 1.2); c.quadraticCurveTo(bx2, by2 - u * 3.6, bx2 - u * 3.6, by2 + u * 1.2); c.closePath(); c.fillStyle = st; c.fill();
    c.beginPath(); c.moveTo(bx2 - u * 9, by2 - u * 1.6); c.quadraticCurveTo(bx2, by2 - u * 5.4, bx2 + u * 9, by2 - u * 1.6); c.lineWidth = u * 0.8; c.strokeStyle = shade(st, 0.2); c.stroke(); c.beginPath(); c.moveTo(bx2 - u * 3.6, by2 + u * 1.2); c.quadraticCurveTo(bx2, by2 - u * 3.6, bx2 + u * 3.6, by2 + u * 1.2); c.lineWidth = u * 0.5; c.strokeStyle = shade(st, -0.22); c.stroke();
    for (i = -1; i <= 1; i += 2) { Rn(c, bx2 + i * u * 8.6 - u * 0.6, by2 - u * 4.2, u * 1.2, u * 3, u * 0.2, shade(st, -0.12)); if (T.lit) glow(c, bx2 + i * u * 8.6, by2 - u * 4.8, u * 5, '#ffd98a', 0.5 + 0.08 * k); dot(c, bx2 + i * u * 8.6, by2 - u * 4.8, u * 0.9, T.lit ? '#ffe9a8' : shade(st, 0.3)); }
    /* stepping stones, rocks with a little foam, the ducks going down */
    for (i = 0; i < 5; i++) { var sf = 0.6 + (i % 2) * 0.025, sxx = cxf(sf) + (i - 2) * hwf(sf) * 0.42, syy = yf(sf); el(c, sxx, syy + u * 0.5, u * 3.4, u * 0.9, 'rgba(255,255,255,0.4)'); el(c, sxx, syy, u * 3, u * 1, T.g('#8f8c99')); el(c, sxx - u * 0.4, syy - u * 0.3, u * 2.2, u * 0.6, T.g('#b0adb9')); }
    var df = 0.4 + 0.03 * Math.sin(t * 0.15), dx = cxf(df) + Math.sin(t * 0.2) * hwf(df) * 0.3, dy2 = yf(df);
    duck(c, dx, dy2, u * 1.5, -1, T.g('#b98a5a'), T.g('#2f7a55'), t, 0); for (i = 1; i <= 3; i++) duck(c, dx + i * u * 3.5, dy2 - u * 0.4 * i + Math.sin(t * 0.9 + i) * u * 0.3, u * 0.85, -1, T.g('#f2d46a'), T.g('#f2d46a'), t, i * 1.3);
    rock(c, cxf(0.8) - hwf(0.8) - u * 1, yf(0.8) + u * 1, u * 3.6, T.g('#9a98a4')); rock(c, cxf(0.93) + hwf(0.93) + u * 2, yf(0.93) + u * 1, u * 4.4, T.g('#85828f')); rock(c, cxf(0.5) + hwf(0.5) + u * 1, yf(0.5) + u * 0.6, u * 2.2, T.g('#9a98a4'));
    heron(c, cxf(0.74) + hwf(0.74) - u * 3.5, yf(0.74) + u * 1, u * 1.9, -1, t, T.g('#8f9ab8'));
    /* the banks: a willow leaning over the left one, round trees right, reeds, flowers */
    tree(c, W * 0.81, H * 0.7, u * 36, T.g(mix('#4f9a4a', G, 0.4)), T.g('#6a4a3a'), Math.sin(t * 0.6 + 1) * u * 0.3);
    willow(c, W * 0.06, H * 0.745, u * 66, t, T.g(mix('#8fc25a', G, 0.45)), T.g('#6a4e3a'));
    tree(c, W * 0.95, H * 0.765, u * 62, T.g(mix('#5fae4a', G, 0.45)), T.g('#6a4a3a'), Math.sin(t * 0.6) * u * 0.4);
    for (i = 0; i < 8; i++) { var cf = 0.84 + (i % 4) * 0.045, sd = i < 4 ? -1 : 1, cx2 = cxf(cf) + sd * (hwf(cf) + u * (1 + R0() * 2.5)); cattail(c, cx2, yf(cf) + u * 2, u * (9 + R0() * 6), t, i, T.g(shade(G, -0.3)), T.g('#6b4423')); }
    blooms(c, W, H * 0.88, H * 0.97, 9, o.seed, u * 1.5, [T.g('#ffffff'), T.g(p.gold), T.g(mix('#ff8fb4', p.accent, 0.3))], t, T.g(shade(G, -0.3)), 0, W * 0.15); blooms(c, W, H * 0.88, H * 0.97, 9, o.seed + 'b', u * 1.5, [T.g(p.gold), T.g('#ffffff'), T.g(mix('#c89aff', p.accent, 0.3))], t, T.g(shade(G, -0.3)), W * 0.84, W);
    tufts(c, W * 0.2, H * 0.86, H * 0.995, 9, o.seed, u, T.g(shade(G, 0.2)), t); c.save(); c.translate(W * 0.8, 0); tufts(c, W * 0.2, H * 0.86, H * 0.995, 9, o.seed + 'r', u, T.g(shade(G, 0.2)), t); c.restore();
    if (T.lit) fireflies(c, W, H * 0.5, H * 0.92, 12, o.seed, t, u);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- a sunny wood: great trunks at the sides, a leafy roof, sunbeams on a mossy path, ferns and toadstools; green or in autumn colour ---------- */
  function fern(c, x, y, len, rot, col, t, ph) {
    var i; c.save(); c.translate(x, y); c.rotate(rot + Math.sin(t * 0.9 + ph) * 0.04);
    c.strokeStyle = shade(col, -0.22); c.lineWidth = len * 0.03; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.24, len, 0); c.stroke();
    for (i = 1; i < 10; i++) { var f = i / 10, px = len * f, py = -len * 0.48 * f * (1 - f), l = len * 0.24 * (1 - f * 0.75); el(c, px - l * 0.15, py - l * 0.5, l * 0.17, l * 0.56, i % 2 ? col : shade(col, 0.1), 0.4); el(c, px - l * 0.15, py + l * 0.5, l * 0.17, l * 0.56, shade(col, -0.08), -0.4); }
    c.restore();
  }
  function toadstool(c, x, y, s, cap) { Rn(c, x - s * 0.3, y - s * 1.3, s * 0.6, s * 1.3, s * 0.25, '#f6ead6'); c.beginPath(); c.ellipse(x, y - s * 1.2, s, s * 0.85, 0, PI, 0); c.closePath(); c.fillStyle = cap; c.fill(); el(c, x, y - s * 1.2, s, s * 0.16, shade(cap, -0.2)); dot(c, x - s * 0.4, y - s * 1.55, s * 0.17, '#ffffff'); dot(c, x + s * 0.3, y - s * 1.7, s * 0.14, '#ffffff'); dot(c, x + s * 0.55, y - s * 1.42, s * 0.11, '#ffffff'); }
  Art.add('backdrop', 'woods', function (c, W, H, t, p, o, u) {
    var au = o.variant === 'autumn', i, j, s, R0 = rnd(o.seed + 'wd'), gr = H * 0.69, G = au ? mix(grassOf(p), '#c2a548', 0.45) : mix(grassOf(p), '#7fbf4a', 0.2);
    var LC = au ? [mix('#e8962a', p.gold, 0.25), mix('#d2562c', p.accent, 0.3), mix('#f0c23a', p.gold, 0.3), mix('#b8742a', p.accent, 0.15)] : [mix('#5fae4a', p.accent2, 0.3), mix('#86c85a', p.accent2, 0.2), mix('#3f8f4a', p.accent2, 0.3), mix('#a6d86a', p.gold, 0.15)];
    var haze = mix(p.bg2, au ? '#ffe2a0' : '#eaffc0', 0.45), bark = mix('#5c4334', p.ink, 0.25), sunx = W * 0.64;
    vgrad(c, W, H, [mix(p.bg, LC[2], 0.3), mix(p.bg, haze, 0.5), haze, mix(haze, '#ffffff', 0.3)], 0, gr);
    glow(c, sunx, H * 0.1, Math.max(W, H) * 0.62, '#fff8d0', 0.42);
    for (i = 0; i < 12; i++) { var x = (i + R0() * 0.7) / 12 * W, w = u * (1.2 + R0() * 1.8); c.fillStyle = mix(mix(bark, p.bg, 0.3), haze, 0.66); c.fillRect(x, 0, w, gr + u); }
    for (i = 0; i < 14; i++) { var bx = (i + R0() * 0.8) / 14 * W, br = u * (4 + R0() * 4.5); el(c, bx, gr - br * 0.3, br * 1.2, br, mix(LC[i % 4], haze, 0.6)); }
    c.save(); c.globalAlpha = 0.13; c.fillStyle = '#fff6c8'; for (i = 0; i < 5; i++) { var rx = W * (0.08 + i * 0.21 + 0.015 * Math.sin(t * 0.25 + i)); c.beginPath(); c.moveTo(sunx - u * 3 + i * u * 1.5, -u * 2); c.lineTo(rx - W * 0.05, gr + u * 8); c.lineTo(rx + W * 0.05, gr + u * 8); c.closePath(); c.fill(); } c.restore();
    for (i = 0; i < 6; i++) { var sd = i % 2 ? 1 : -1, fx = 0.2 + R0() * 0.14, x2 = (sd < 0 ? fx : 1 - fx) * W, w2 = u * (2.4 + R0() * 1.8), mc = mix(bark, haze, 0.38); c.fillStyle = mc; c.beginPath(); c.moveTo(x2 - w2 / 2, 0); c.lineTo(x2 + w2 / 2, 0); c.lineTo(x2 + w2 * 0.7, gr + u * 2); c.lineTo(x2 - w2 * 0.7, gr + u * 2); c.closePath(); c.fill(); for (j = 0; j < 2; j++) { var by = H * (0.14 + R0() * 0.3), d = R0() < 0.5 ? 1 : -1; L(c, x2, by, x2 + d * u * 6, by - u * 3, u * 0.7, mc); el(c, x2 + d * u * 7, by - u * 4, u * 4.2, u * 2.6, mix(LC[(i + j) % 4], haze, 0.35)); el(c, x2 + d * u * 5, by - u * 5.4, u * 3, u * 2, mix(LC[(i + j + 1) % 4], haze, 0.3)); } }
    /* the floor: moss, a path that wanders off, pools of light */
    hill(c, W, H, gr, u * 1.4, mix(G, haze, 0.3), o.seed + 'w1', 0.9); hill(c, W, H, H * 0.75, u * 1.6, G, o.seed + 'w2', 1.2);
    var pth = mix(mix('#d9bf8a', p.bg2, 0.3), G, 0.25), N = 20; c.beginPath(); for (i = 0; i <= N; i++) { var f = i / N, cx = W * (0.5 + 0.09 * Math.sin(f * 4.2 + 1) * (1 - f * 0.6)), hw = W * (0.012 + 0.16 * f * f), y = gr + u * 2.5 + (H - gr - u * 2.5) * f; if (i) c.lineTo(cx - hw, y); else c.moveTo(cx - hw, y); } for (i = N; i >= 0; i--) { var f2 = i / N; c.lineTo(W * (0.5 + 0.09 * Math.sin(f2 * 4.2 + 1) * (1 - f2 * 0.6)) + W * (0.012 + 0.16 * f2 * f2), gr + u * 2.5 + (H - gr - u * 2.5) * f2); } c.closePath(); c.fillStyle = pth; c.fill();
    groundShade(c, W, H, H * 0.78, shade(G, -0.55), 0.32);
    for (i = 0; i < 9; i++) el(c, W * (0.08 + R0() * 0.84), H * (0.74 + R0() * 0.22), u * (5 + R0() * 6), u * (1 + R0() * 1), 'rgba(255,248,190,' + (0.12 + 0.05 * Math.sin(t * 0.8 + i * 1.7)).toFixed(3) + ')');
    if (au) for (i = 0; i < 46; i++) el(c, R0() * W, H * (0.73 + R0() * 0.26), u * (0.9 + R0() * 0.6), u * 0.5, alpha(LC[i % 4], 0.85), R0() * 3);
    /* the great trunks at the sides */
    for (i = 0; i < 6; i++) {
      var side = i % 2 ? 1 : -1, fx2 = [0.035, 0.05, 0.17, 0.15, 0.26, 0.255][i], x3 = (side < 0 ? fx2 : 1 - fx2) * W, w3 = u * [10, 9, 6.5, 7, 4.4, 4.2][i], sway = Math.sin(t * 0.5 + i) * u * 0.2, col = i < 2 ? bark : mix(bark, haze, 0.14), base = gr + u * [9, 8, 5, 6, 3, 3.4][i], lit = sunx > x3 ? 1 : -1;
      c.beginPath(); c.moveTo(x3 - w3 / 2 + sway, 0); c.lineTo(x3 + w3 / 2 + sway, 0); c.lineTo(x3 + w3 * 0.6, base - w3 * 0.7); c.quadraticCurveTo(x3 + w3 * 0.68, base - w3 * 0.1, x3 + w3 * 1.15, base); c.lineTo(x3 - w3 * 1.15, base); c.quadraticCurveTo(x3 - w3 * 0.68, base - w3 * 0.1, x3 - w3 * 0.6, base - w3 * 0.7); c.closePath(); c.fillStyle = col; c.fill();
      c.fillStyle = alpha(au ? '#ffd9a0' : '#f0ffc8', 0.16); c.fillRect(x3 + (lit > 0 ? w3 * 0.24 : -w3 * 0.44), 0, w3 * 0.2, base - w3 * 0.6);
      c.strokeStyle = alpha(shade(col, -0.4), 0.5); c.lineWidth = u * 0.35; c.lineCap = 'round'; c.beginPath(); for (j = 0; j < 7; j++) { var ky = H * (0.05 + j * 0.095 + R0() * 0.03), kx = x3 + (R0() - 0.5) * w3 * 0.6; c.moveTo(kx, ky); c.lineTo(kx + u * 0.2, ky + u * (2.4 + R0() * 2)); } c.stroke();
      el(c, x3, base, w3 * 1.5, u * 1.3, mix(G, '#5f9a3a', 0.3));
      for (j = 0; j < 2; j++) { var by2 = H * (0.2 + j * 0.2 + R0() * 0.08), bd = -side, bl = u * (8 + R0() * 6); L(c, x3, by2, x3 + bd * bl, by2 - u * 4, u * 1.1, col); for (s = 0; s < 4; s++) el(c, x3 + bd * (bl + u * (s - 1.5) * 2.6), by2 - u * (4.6 + (s % 2) * 2.2) + Math.sin(t * 0.8 + i + s) * u * 0.25, u * 4.4, u * 2.8, LC[(i + j + s) % 4]); }
    }
    Rn(c, W * 0.035 - u * 1.6, H * 0.47, u * 3.2, u * 4.4, u * 1.6, shade(bark, -0.45)); dot(c, W * 0.035 - u * 0.5, H * 0.47 + u * 1.8, u * 0.42, '#ffe27a'); dot(c, W * 0.035 + u * 0.6, H * 0.47 + u * 1.8, u * 0.42, '#ffe27a');
    /* the roof of leaves, lower at the corners */
    for (j = 0; j < 2; j++) for (i = 0; i < 17; i++) { var cx3 = (i + (j ? 0.5 : 0)) / 16 * W, e = Math.pow(Math.abs(cx3 / W - 0.5) * 2, 2), cr = u * (9 + R0() * 6), cy3 = H * (j ? 0.012 : 0.035) + e * H * (j ? 0.06 : 0.085) - u * 3 + Math.sin(t * 0.6 + i + j * 2) * u * 0.25; el(c, cx3, cy3, cr * 1.2, cr, j ? LC[(i + 1) % 4] : shade(LC[i % 4], -0.16)); if (j) el(c, cx3 - cr * 0.3, cy3 + cr * 0.3, cr * 0.5, cr * 0.34, shade(LC[(i + 1) % 4], 0.16)); }
    /* a small bird on a bough */
    var qx = W * 0.2, qy = H * 0.385 + Math.sin(t * 2) * u * 0.15; L(c, W * 0.05, H * 0.4, W * 0.27, H * 0.39, u * 0.9, bark); el(c, qx, qy - u * 1.5, u * 2, u * 1.6, '#8a6a52'); el(c, qx + u * 0.5, qy - u * 1.2, u * 1.3, u * 1.1, mix('#f08a4a', p.accent, 0.4)); dot(c, qx + u * 1.3, qy - u * 2.8, u * 1.1, '#8a6a52'); poly(c, [[qx + u * 2.2, qy - u * 3.1], [qx + u * 3.3, qy - u * 2.7], [qx + u * 2.2, qy - u * 2.4]], '#e8a23a'); dot(c, qx + u * 1.6, qy - u * 3, u * 0.22, '#1a1a20'); poly(c, [[qx - u * 1.6, qy - u * 1.6], [qx - u * 4, qy - u * 0.6], [qx - u * 1.4, qy - u * 0.6]], '#6a4e3a');
    /* ferns, toadstools, flowers or acorn-brown leaves at our feet */
    var fc = au ? mix('#b8a03a', G, 0.4) : mix('#3f9a4a', G, 0.4);
    fern(c, u * 2, H * 0.985, u * 22, -0.9, fc, t, 0); fern(c, u * 4, H * 0.995, u * 19, -0.35, shade(fc, 0.1), t, 1); fern(c, u * 1, H * 0.99, u * 17, -1.35, shade(fc, -0.1), t, 2);
    fern(c, W - u * 2, H * 0.985, u * 22, PI + 0.9, fc, t, 3); fern(c, W - u * 4, H * 0.995, u * 19, PI + 0.35, shade(fc, 0.1), t, 4); fern(c, W - u * 1, H * 0.99, u * 17, PI + 1.35, shade(fc, -0.1), t, 5);
    var capc = mix('#e2452f', p.accent, 0.3); toadstool(c, W * 0.25, H * 0.975, u * 3.4, capc); toadstool(c, W * 0.31, H * 0.99, u * 2.2, capc); toadstool(c, W * 0.2, H * 0.992, u * 1.7, mix('#e8b25a', p.gold, 0.3)); toadstool(c, W * 0.77, H * 0.98, u * 3, capc); toadstool(c, W * 0.71, H * 0.992, u * 1.9, mix('#e8b25a', p.gold, 0.3));
    if (au) falling(c, W, H, 16, o.seed, t, u * 1.3, LC, H * 0.9);
    else { blooms(c, W, H * 0.9, H * 0.975, 12, o.seed, u * 1.4, [mix('#7a8cff', p.accent2, 0.2), '#ffffff', mix('#b89aff', p.accent, 0.2)], t, shade(G, -0.3), W * 0.34, W * 0.68); K.bfly(c, W * 0.36 + Math.sin(t * 0.5) * u * 7, H * 0.55 + Math.cos(t * 0.7) * u * 4, u * 2.2, p.gold, t, 0); K.bfly(c, W * 0.66 + Math.sin(t * 0.45 + 2) * u * 7, H * 0.5 + Math.cos(t * 0.6 + 1) * u * 4, u * 1.9, '#ffffff', t, 2.5); }
    for (i = 0; i < 14; i++) { var mx = (R0() + Math.sin(t * 0.2 + i) * 0.02) * W, my = H * (0.15 + R0() * 0.5) + Math.cos(t * 0.3 + i * 2) * u * 2; dot(c, mx, my, u * (0.2 + R0() * 0.3), 'rgba(255,250,210,' + (0.3 + 0.3 * Math.sin(t * 1.1 + i * 1.9)).toFixed(3) + ')'); }
  }, { variants: ['day', 'autumn'], stage: 'band-low' });

  /* ---------- mountains: two ranges of snow peaks with a low pass between, pine foothills, a cabin on an alpine meadow, a goat on a ledge ---------- */
  Art.add('backdrop', 'mountains', function (c, W, H, t, p, o, u) {
    var T = time(p, o.variant), i, R0 = rnd(o.seed + 'mt'), hz = H * 0.64, G = mix(grassOf(p), '#8fc85a', 0.2), k = Math.exp(-5 * o.beat), pc = mix('#2f6a55', p.accent2, 0.25);
    var S = sky(c, W, H, t, p, o, u, T, H * 0.56, W * 0.5, H * 0.105);
    if (T.night) { c.save(); c.translate(W * 0.5, H * 0.2); c.rotate(-0.5); el(c, 0, 0, Math.max(W, H) * 0.6, u * 9, 'rgba(200,210,255,0.06)'); el(c, 0, 0, Math.max(W, H) * 0.5, u * 4.5, 'rgba(220,225,255,0.07)'); c.restore(); K.skyStars(c, W, H, 50, o.seed + 'mw', t, H * 0.4, '#ffffff'); }
    var m1 = T.g(mix(mix('#8a90c4', p.bg, 0.4), S.low, 0.34)), m2 = T.g(mix(mix('#6a70a8', p.bg, 0.3), S.low, 0.08)), sn = T.dusk ? '#ffcdb4' : T.night ? mix(T.g('#ffffff'), '#aab8f0', 0.4) : '#ffffff', sn1 = mix(sn, m1, 0.25);
    var far = [[0.08, 0.3, 30], [0.33, 0.41, 24], [0.52, 0.475, 22], [0.7, 0.42, 24], [0.93, 0.28, 32]], near = [[-0.02, 0.41, 26], [0.2, 0.335, 31], [0.42, 0.52, 20], [0.63, 0.535, 18], [0.83, 0.365, 31], [1.03, 0.44, 24]];
    for (i = 0; i < far.length; i++) peak(c, W * far[i][0], H * far[i][1], u * far[i][2], hz, m1, sn1, 0.36);
    var g = c.createLinearGradient(0, H * 0.44, 0, hz); g.addColorStop(0, alpha(S.low, 0)); g.addColorStop(1, alpha(S.low, 0.5)); c.fillStyle = g; c.fillRect(0, H * 0.44, W, hz - H * 0.44);
    if (!T.night) { for (i = 0; i < 3; i++) { var cw = u * (26 + i * 8), cx = frac(0.2 + i * 0.37 + t * 0.003 * (1 + i * 0.3)) * (W + cw * 2) - cw; el(c, cx, H * (0.4 + i * 0.045), cw, u * 1.6, alpha('#ffffff', T.dusk ? 0.25 : 0.5)); el(c, cx + cw * 0.3, H * (0.4 + i * 0.045) - u * 1.2, cw * 0.5, u * 1.3, alpha('#ffffff', T.dusk ? 0.2 : 0.4)); } }
    for (i = 0; i < near.length; i++) peak(c, W * near[i][0], H * near[i][1], u * near[i][2], hz + u * 2, i % 2 ? m2 : shade(m2, 0.05), sn, 0.32);
    /* a goat on a ledge of the great east peak, an eagle turning over the pass */
    var gx = W * 0.83 - u * 10, gy = H * 0.365 + (hz + u * 2 - H * 0.365) * 0.345, gc = T.g('#fffaf0'); Rn(c, gx - u * 2.6, gy - u * 0.1, u * 5.4, u * 0.7, u * 0.3, shade(m2, -0.2));
    L(c, gx - u * 0.9, gy - u * 1.4, gx - u * 1, gy, u * 0.3, gc); L(c, gx + u * 0.9, gy - u * 1.4, gx + u * 1, gy, u * 0.3, gc); el(c, gx, gy - u * 1.9, u * 1.6, u * 0.95, gc); dot(c, gx - u * 1.7, gy - u * 2.9, u * 0.7, gc); L(c, gx - u * 1.6, gy - u * 3.4, gx - u * 1, gy - u * 4.2, u * 0.2, T.g('#8a8894')); L(c, gx - u * 1.9, gy - u * 3.4, gx - u * 1.6, gy - u * 4.3, u * 0.2, T.g('#8a8894')); L(c, gx - u * 1.9, gy - u * 2.4, gx - u * 2, gy - u * 1.7, u * 0.22, gc);
    if (!T.night) birds(c, W * (0.5 + 0.13 * Math.cos(t * 0.14)), H * (0.27 + 0.02 * Math.sin(t * 0.28)), u * 2.8, 1, t * 0.25, alpha(T.g('#3a3448'), 0.8), o.seed);
    var f1 = hill(c, W, H, hz - u * 3, u * 2.6, T.g(mix(pc, m2, 0.4)), o.seed + 'm1', 1); K.pinesOn(c, W, f1, 18, o.seed + 'm1', u * 5, u * 9, T.g(mix(pc, m2, 0.28)), null);
    var f2 = hill(c, W, H, hz + u * 2, u * 2.4, T.g(pc), o.seed + 'm2', 1.3); K.pinesOn(c, W, f2, 11, o.seed + 'm2', u * 8, u * 14, T.g(shade(pc, -0.08)), null);
    hill(c, W, H, H * 0.705, u * 1.6, T.g(G), o.seed + 'm3', 0.7); hill(c, W, H, H * 0.82, u * 1.5, T.g(shade(G, -0.07)), o.seed + 'm4', 1.2);
    /* the trail up to the cabin */
    var N = 16, tr = T.g(mix('#e3cf9c', p.bg2, 0.3)); c.beginPath(); for (i = 0; i <= N; i++) { var f = i / N, tx = W * (0.3 + 0.24 * f + 0.07 * Math.sin(f * 5)), ty = H * 0.715 + (H * 1.0 - H * 0.715) * f, tw = u * (0.5 + 6 * f * f); if (i) c.lineTo(tx - tw, ty); else c.moveTo(tx - tw, ty); } for (i = N; i >= 0; i--) { var f3 = i / N; c.lineTo(W * (0.3 + 0.24 * f3 + 0.07 * Math.sin(f3 * 5)) + u * (0.5 + 6 * f3 * f3), H * 0.715 + (H * 1.0 - H * 0.715) * f3); } c.closePath(); c.fillStyle = tr; c.fill();
    groundShade(c, W, H, H * 0.76, T.g(shade(G, -0.55)), 0.3);
    cabin(c, W * 0.27, H * 0.716, u * 1.7, T, p, t, k);
    pine(c, W * 0.13, H * 0.735, u * 36, T.g(shade(pc, 0.04)), null, 4); pine(c, W * 0.88, H * 0.735, u * 42, T.g(shade(pc, 0.02)), null, 4);
    pine(c, W * 0.02, H * 0.79, u * 60, T.g(shade(pc, -0.12)), null, 5); pine(c, W * 0.985, H * 0.8, u * 68, T.g(shade(pc, -0.14)), null, 5);
    rock(c, W * 0.12, H * 0.985, u * 6, T.g('#9a98a4')); rock(c, W * 0.21, H * 0.995, u * 3.4, T.g('#85828f')); rock(c, W * 0.88, H * 0.985, u * 5.4, T.g('#8f8c99')); rock(c, W * 0.8, H * 0.997, u * 2.8, T.g('#9a98a4'));
    blooms(c, W, H * 0.885, H * 0.975, 30, o.seed, u * 1.5, [T.g('#ffffff'), T.g(mix('#ff7fa8', p.accent, 0.3)), T.g(p.gold), T.g(mix('#8f9aff', p.accent2, 0.2))], t, T.g(shade(G, -0.3)));
    tufts(c, W, H * 0.9, H * 0.995, 22, o.seed, u, T.g(shade(G, 0.2)), t);
    if (T.lit) fireflies(c, W, H * 0.6, H * 0.9, T.night ? 10 : 6, o.seed, t, u);
    void R0;
  }, { variants: ['day', 'dusk', 'night'], stage: 'band-low' });

  /* ---------- a ski slope: a white mountain with a gondola line, a run of slalom gates and a skier, a snowed-in chalet, skis in a drift, a sledge ---------- */
  function chalet(c, x, y, s, T, p, t, k, snow) { /* base centre (x, y) */
    var wood = T.g('#9a6238'), dkw = T.g('#6f4426'), i, j, win = T.night ? '#ffdf8a' : mix('#ffe9a8', '#cfe6f5', 0.35);
    smokeUp(c, x + s * 4.6, y - s * 11.4, s * 0.9, t, '#ffffff'); Rn(c, x + s * 3.9, y - s * 11, s * 1.5, s * 3.4, 0, T.g('#8a8894')); Rn(c, x + s * 3.6, y - s * 11.5, s * 2.1, s * 0.8, s * 0.4, snow);
    Rn(c, x - s * 7, y - s * 2.2, s * 14, s * 2.2, 0, T.g('#a9a6b2')); Rn(c, x - s * 7, y - s * 7, s * 14, s * 4.9, 0, wood); for (i = 1; i < 5; i++) Rn(c, x - s * 7, y - s * 7 + i * s, s * 14, s * 0.14, 0, shade(wood, -0.22));
    poly(c, [[x - s * 7, y - s * 6.9], [x, y - s * 11.6], [x + s * 7, y - s * 6.9]], wood);
    if (T.night) glow(c, x, y - s * 4.6, s * 13, '#ffd98a', 0.26 + 0.05 * k);
    for (i = -1; i <= 1; i++) { Rn(c, x + i * s * 4.2 - s * 1.2, y - s * 6.2, s * 2.4, s * 2.3, s * 0.2, dkw); Rn(c, x + i * s * 4.2 - s * 0.95, y - s * 5.95, s * 1.9, s * 1.8, s * 0.1, win); L(c, x + i * s * 4.2, y - s * 5.95, x + i * s * 4.2, y - s * 4.15, s * 0.14, dkw); L(c, x + i * s * 4.2 - s * 0.95, y - s * 5.05, x + i * s * 4.2 + s * 0.95, y - s * 5.05, s * 0.14, dkw); for (j = -1; j <= 1; j += 2) Rn(c, x + i * s * 4.2 + j * s * 1.5 - s * 0.35, y - s * 6.2, s * 0.7, s * 2.3, s * 0.1, T.g(mix('#3f8a5a', p.accent2, 0.4))); }
    dot(c, x, y - s * 8.7, s * 0.95, dkw); dot(c, x, y - s * 8.7, s * 0.7, win);
    Rn(c, x - s * 7.4, y - s * 3.6, s * 14.8, s * 0.5, s * 0.2, dkw); for (i = 0; i <= 12; i++) Rn(c, x - s * 7.2 + i * s * 1.18, y - s * 3.4, s * 0.3, s * 1.3, 0, dkw); Rn(c, x - s * 7.4, y - s * 2.3, s * 14.8, s * 0.4, 0, dkw); Rn(c, x - s * 7.5, y - s * 4, s * 15, s * 0.5, s * 0.25, snow);
    Rn(c, x - s * 1.1, y - s * 2.1, s * 2.2, s * 2.1, s * 0.2, dkw); dot(c, x + s * 0.6, y - s * 1, s * 0.16, '#f2c14e');
    c.beginPath(); c.moveTo(x - s * 8.6, y - s * 6.3); c.lineTo(x, y - s * 12.2); c.lineTo(x + s * 8.6, y - s * 6.3); c.lineTo(x + s * 7.6, y - s * 5.9); c.lineTo(x, y - s * 10.9); c.lineTo(x - s * 7.6, y - s * 5.9); c.closePath(); c.fillStyle = dkw; c.fill();
    c.beginPath(); c.moveTo(x - s * 8.9, y - s * 6.6); c.quadraticCurveTo(x - s * 4, y - s * 10.6, x, y - s * 13.2); c.quadraticCurveTo(x + s * 4, y - s * 10.6, x + s * 8.9, y - s * 6.6); c.quadraticCurveTo(x + s * 8.4, y - s * 5.9, x + s * 7.8, y - s * 6.5); c.lineTo(x, y - s * 11.9); c.lineTo(x - s * 7.8, y - s * 6.5); c.quadraticCurveTo(x - s * 8.4, y - s * 5.9, x - s * 8.9, y - s * 6.6); c.closePath(); c.fillStyle = snow; c.fill();
    L(c, x - s * 5.6, y, x - s * 6, y - s * 4.6, s * 0.34, T.g(p.accent)); L(c, x - s * 5, y, x - s * 5.2, y - s * 4.6, s * 0.34, T.g(p.gold));
  }
  function gate(c, x, y, s, col) { L(c, x - s, y, x - s, y - s * 2.6, s * 0.2, col); L(c, x + s, y, x + s, y - s * 2.6, s * 0.2, col); Rn(c, x - s, y - s * 2.6, s * 2, s * 1.1, s * 0.1, col); Rn(c, x - s * 0.6, y - s * 2.3, s * 1.2, s * 0.5, 0, 'rgba(255,255,255,0.7)'); }
  Art.add('backdrop', 'skislope', function (c, W, H, t, p, o, u) {
    var T = time(p, o.variant), i, R0 = rnd(o.seed + 'sk'), hz = H * 0.6, k = Math.exp(-5 * o.beat), nb = dk(p.bg, pull(p, 0.74));
    var snow = T.night ? mix(mix('#ffffff', nb, 0.36), '#4a5aaa', 0.22) : mix('#ffffff', p.bg2, 0.1), sh = T.night ? mix(snow, nb, 0.3) : mix(snow, mix(p.bg, '#7f9ae0', 0.5), 0.3), pc = T.g(mix('#2f6a55', p.accent2, 0.25)), psn = T.night ? mix(snow, '#ffffff', 0.25) : '#ffffff';
    var S = sky(c, W, H, t, p, o, u, T, hz, T.night ? W * 0.2 : W * 0.78, H * 0.105);
    var m1 = T.g(mix(mix('#8a90c4', p.bg, 0.4), S.low, 0.3));
    peak(c, W * 0.74, H * 0.36, u * 30, hz, m1, mix(snow, m1, 0.2), 0.5); peak(c, W * 1.0, H * 0.4, u * 26, hz, shade(m1, 0.05), mix(snow, m1, 0.2), 0.5); peak(c, W * 0.5, H * 0.45, u * 22, hz, shade(m1, 0.05), mix(snow, m1, 0.2), 0.5);
    /* the white mountain: its top at the left, the run coming down toward us */
    var topx = W * 0.26, topy = H * 0.34;
    c.beginPath(); c.moveTo(-u, H * 0.47); c.quadraticCurveTo(W * 0.1, H * 0.36, topx, topy); c.bezierCurveTo(W * 0.46, H * 0.36, W * 0.6, H * 0.53, W + u, H * 0.6); c.lineTo(W + u, H); c.lineTo(-u, H); c.closePath(); c.fillStyle = sh; c.fill();
    c.beginPath(); c.moveTo(-u, H * 0.5); c.quadraticCurveTo(W * 0.1, H * 0.39, topx - u * 2, topy + u * 1.4); c.bezierCurveTo(W * 0.36, H * 0.42, W * 0.4, H * 0.56, W * 0.7, H * 0.66); c.lineTo(W + u, H * 0.72); c.lineTo(W + u, H); c.lineTo(-u, H); c.closePath(); c.fillStyle = snow; c.fill();
    for (i = 0; i < 9; i++) { var fx = [0.03, 0.09, 0.47, 0.54, 0.6, 0.66, 0.4, 0.14, 0.72][i], fy = [0.47, 0.435, 0.455, 0.5, 0.535, 0.56, 0.41, 0.41, 0.585][i]; pine(c, W * fx, H * fy + u * 1.2, u * (5.5 + (i % 3) * 1.6), mix(pc, sh, 0.25), psn, 3); }
    /* the gondola line: three pylons, cabins going up and coming down */
    var x0 = W * 1.04, y0 = H * 0.565, x1 = topx + u * 3, y1 = topy - u * 2.4, cab = T.g(mix('#e8452f', p.accent, 0.45)), st = T.g('#5a5868');
    Rn(c, topx - u * 0.5, topy - u * 2.6, u * 6, u * 3, u * 0.3, T.g('#9a6238')); poly(c, [[topx - u * 1.2, topy - u * 2.5], [topx + u * 2.5, topy - u * 4.6], [topx + u * 6.2, topy - u * 2.5]], psn); Rn(c, topx + u * 1.6, topy - u * 1.8, u * 1.6, u * 1.2, u * 0.1, T.night ? '#ffdf8a' : T.g('#4a4458')); if (T.night) glow(c, topx + u * 2.4, topy - u * 1.2, u * 5, '#ffd98a', 0.4);
    for (i = 1; i <= 3; i++) { var pf = i / 4, px = x0 + (x1 - x0) * pf, py = y0 + (y1 - y0) * pf; Rn(c, px - u * 0.3, py - u * 1.2, u * 0.6, u * (6.5 + (3 - i)), 0, st); Rn(c, px - u * 1.5, py - u * 1.4, u * 3, u * 0.5, u * 0.2, st); }
    L(c, x0, y0 - u * 1.2, x1, y1 - u * 1.2, Math.max(0.8, u * 0.16), st);
    for (i = 0; i < 6; i++) { var gf = frac(t * 0.012 + i / 6), gx = x0 + (x1 - x0) * gf, gy = y0 + (y1 - y0) * gf - u * 1.2, sw = Math.sin(t * 1.2 + i) * 0.05; c.save(); c.translate(gx, gy); c.rotate(sw); L(c, 0, 0, 0, u * 1.4, u * 0.16, st); Rn(c, -u * 1.25, u * 1.3, u * 2.5, u * 2.3, u * 0.6, i % 2 ? cab : T.g(mix('#f2c14e', p.gold, 0.5))); Rn(c, -u * 0.95, u * 1.6, u * 1.9, u * 0.95, u * 0.3, T.night ? '#ffe9a8' : '#d8ecf8'); c.restore(); }
    /* the run: two carved tracks, the gates, a skier coming down */
    var rxf = function (f) { return W * (0.3 + 0.2 * f + 0.075 * Math.sin(f * 9) * (0.4 + f)); }, ryf = function (f) { return topy + u * 4 + (H * 0.71 - topy - u * 4) * Math.pow(f, 0.85); };
    c.strokeStyle = alpha(sh, 0.9); c.lineCap = 'round'; for (i = 0; i < 2; i++) { c.beginPath(); for (var q = 0; q <= 30; q++) { var f = q / 30, xx = rxf(f) + (i ? u * (0.3 + 1.2 * f) : 0), yy = ryf(f); if (q) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.lineWidth = u * 0.3; c.stroke(); }
    for (i = 0; i < 6; i++) { var qf = 0.14 + i * 0.15; gate(c, rxf(qf) + (i % 2 ? 1 : -1) * u * (2.2 + qf * 3.4), ryf(qf) + u * 0.6, u * (0.55 + qf * 1.05), i % 2 ? T.g(mix('#e8452f', p.accent, 0.4)) : T.g(mix('#2f6ad8', p.accent2, 0.25))); }
    var kf = frac(t * 0.05), kx = rxf(kf), ky = ryf(kf), ks = u * (0.5 + 1.2 * kf), ln = Math.cos(kf * 9) * 0.5; c.save(); c.translate(kx, ky); c.rotate(ln);
    for (i = 0; i < 4; i++) dot(c, -ln * ks * (2 + i * 1.4), -ks * (0.2 + i * 0.5), ks * (0.7 - i * 0.12), alpha('#ffffff', 0.7 - i * 0.15));
    L(c, -ks * 1.4, 0, ks * 1.6, ks * 0.2, ks * 0.26, T.g('#3a3448')); L(c, -ks * 0.2, 0, 0, -ks * 1.3, ks * 0.5, T.g('#3a4a8a')); L(c, 0, -ks * 1.3, ks * 0.3, -ks * 2.5, ks * 0.75, T.g(p.accent)); dot(c, ks * 0.45, -ks * 3.2, ks * 0.55, T.g('#f6cfa8')); c.beginPath(); c.arc(ks * 0.45, -ks * 3.3, ks * 0.6, PI, 0); c.fillStyle = T.g(p.gold); c.fill(); L(c, ks * 0.3, -ks * 2.1, ks * 1.3, -ks * 0.9, ks * 0.16, T.g('#3a3448')); c.restore();
    /* night: lamps down the run */
    if (T.night) for (i = 0; i < 3; i++) { var lf = 0.3 + i * 0.27, lx = rxf(lf) - u * (9 + lf * 8), ly = ryf(lf) + u; Rn(c, lx - u * 0.25, ly - u * 9, u * 0.5, u * 9, 0, st); Rn(c, lx - u * 0.2, ly - u * 9.4, u * 2.6, u * 0.8, u * 0.3, st); var bg = c.createLinearGradient(0, ly - u * 9, 0, ly + u * 3); bg.addColorStop(0, 'rgba(255,244,200,0.3)'); bg.addColorStop(1, 'rgba(255,244,200,0)'); c.fillStyle = bg; c.beginPath(); c.moveTo(lx + u * 1.2, ly - u * 8.8); c.lineTo(lx + u * 12, ly + u * 3); c.lineTo(lx - u * 3, ly + u * 3); c.closePath(); c.fill(); glow(c, lx + u * 1.3, ly - u * 8.8, u * 4, '#fff4c8', 0.6 + 0.1 * k); dot(c, lx + u * 1.3, ly - u * 8.8, u * 0.6, '#fffbe0'); }
    /* the chalet, the near drifts, the big firs */
    c.beginPath(); c.moveTo(-u, H * 0.72); c.quadraticCurveTo(W * 0.3, H * 0.69, W * 0.55, H * 0.715); c.quadraticCurveTo(W * 0.8, H * 0.74, W + u, H * 0.7); c.lineTo(W + u, H); c.lineTo(-u, H); c.closePath(); c.fillStyle = mix(snow, sh, 0.35); c.fill();
    chalet(c, W * 0.79, H * 0.705, u * 1.75, T, p, t, k, psn);
    hill(c, W, H, H * 0.76, u * 1.4, snow, o.seed + 's2', 0.9); pine(c, W * 0.16, H * 0.745, u * 30, pc, psn, 4);
    pine(c, W * 0.035, H * 0.8, u * 58, T.g(mix('#2a5f4c', p.accent2, 0.2)), psn, 5); pine(c, W * 0.985, H * 0.81, u * 44, T.g(mix('#2a5f4c', p.accent2, 0.2)), psn, 4);
    hill(c, W, H, H * 0.9, u * 1.6, T.night ? mix(snow, '#ffffff', 0.12) : '#ffffff', o.seed + 's3', 1.3); groundShade(c, W, H, H * 0.9, sh, 0.5);
    /* skis and poles stood in the drift, a sledge */
    var sx = W * 0.1, sy = H * 0.985, cols = [mix(T.g(p.accent), p.accent, 0.5), mix(T.g(p.accent2), p.accent2, 0.5)];
    for (i = 0; i < 2; i++) { c.save(); c.translate(sx + i * u * 3.6, sy); c.rotate(-0.1 + i * 0.16); c.beginPath(); c.moveTo(-u * 1, 0); c.lineTo(-u * 1, -u * 17); c.quadraticCurveTo(-u * 1, -u * 20, u * 0.8, -u * 20.4); c.quadraticCurveTo(u * 1, -u * 18.6, u * 1, -u * 17); c.lineTo(u * 1, 0); c.closePath(); c.fillStyle = cols[i]; c.fill(); Rn(c, -u * 1, -u * 13, u * 2, u * 1.4, 0, 'rgba(255,255,255,0.6)'); Rn(c, -u * 0.8, -u * 8.4, u * 1.6, u * 2.4, u * 0.3, T.g('#3a3448')); c.restore(); }
    for (i = 0; i < 2; i++) { var qx = sx + u * (8.4 + i * 2.6), qr = 0.06 + i * 0.1; c.save(); c.translate(qx, sy); c.rotate(qr); L(c, 0, 0, 0, -u * 14.5, u * 0.36, T.g('#5a5868')); Rn(c, -u * 0.45, -u * 15.6, u * 0.9, u * 2.4, u * 0.4, T.g('#3a3448')); c.beginPath(); c.ellipse(0, -u * 1.6, u * 1.3, u * 0.45, 0, 0, TAU); c.lineWidth = u * 0.3; c.strokeStyle = T.g('#5a5868'); c.stroke(); c.restore(); }
    el(c, sx + u * 4, sy + u * 0.4, u * 9, u * 1.4, T.night ? mix(snow, '#ffffff', 0.2) : '#ffffff');
    var lx2 = W * 0.82, ly2 = H * 0.972, wd = T.g('#c98a4a'), rn = mix(T.g(p.accent), p.accent, 0.5); el(c, lx2, ly2 + u * 0.8, u * 10, u * 1, alpha(sh, 0.8));
    c.beginPath(); c.moveTo(lx2 - u * 8, ly2); c.lineTo(lx2 + u * 6.4, ly2); c.quadraticCurveTo(lx2 + u * 9.6, ly2, lx2 + u * 9, ly2 - u * 3.4); c.lineWidth = u * 0.8; c.lineCap = 'round'; c.strokeStyle = rn; c.stroke();
    L(c, lx2 - u * 5.4, ly2, lx2 - u * 5, ly2 - u * 2.6, u * 0.7, rn); L(c, lx2 + u * 4, ly2, lx2 + u * 4, ly2 - u * 2.6, u * 0.7, rn);
    for (i = 0; i < 3; i++) Rn(c, lx2 - u * 7.4, ly2 - u * (3.5 + 0) - i * 0, u * 14.4, u * 1.2, u * 0.4, wd); Rn(c, lx2 - u * 7.4, ly2 - u * 3.5, u * 14.4, u * 0.4, u * 0.2, shade(wd, 0.25)); for (i = 1; i < 4; i++) Rn(c, lx2 - u * 7.4 + i * u * 3.6, ly2 - u * 3.5, u * 0.25, u * 1.2, 0, shade(wd, -0.25));
    c.beginPath(); c.moveTo(lx2 + u * 9, ly2 - u * 3.4); c.quadraticCurveTo(lx2 + u * 13, ly2 - u * 1, lx2 + u * 15, ly2 + u * 1.4); c.lineWidth = u * 0.3; c.strokeStyle = T.g('#d9c494'); c.stroke();
    /* glints on the snow by day, a few flakes always */
    if (!T.night) for (i = 0; i < 9; i++) twinkle(c, W * (0.1 + R0() * 0.8), H * (0.74 + R0() * 0.24), u * (0.7 + 1 * Math.abs(Math.sin(t * 1.6 + i * 1.3))), '#ffffff');
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); for (i = 0; i < 26; i++) { var ff = frac(R0() + t * (0.03 + R0() * 0.03)), fx2 = (R0() + Math.sin(t * 0.6 + i) * 0.02) * W, fr = u * (0.25 + R0() * 0.4); c.moveTo(fx2 + fr, ff * H); c.arc(fx2, ff * H, fr, 0, TAU); } c.fill();
  }, { variants: ['day', 'night'], stage: 'band-low' });
});
