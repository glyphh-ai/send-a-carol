/* Send a Carol art pack: outdoor backdrops D (a jungle, a savanna, a tulip field, a blossom park, an autumn park, a rainy
   street, a lantern street, an arched courtyard, a courtyard of little lamps, a window sill at night). The last four are
   places for cultural and religious evenings: generic architecture, no lettering; the occasion's own symbols are props.
   Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, dot = K.dot, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd,
    vgrad = K.vgrad, vgrad2 = K.vgrad2, glow = K.glow, vignette = K.vignette, hill = K.hill, skyStars = K.skyStars, leaf = K.leaf;

  /* ---------- small shared pieces ---------- */
  function quad(c, x1, y1, x2, y2, x3, y3, x4, y4, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.lineTo(x4, y4); c.closePath(); c.fillStyle = col; c.fill(); }
  function el(c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = col; c.fill(); }
  /* the sky of a variant, from the palette: day is the palette's own, dusk and night lean it warm or deep */
  function skyOf(c, W, H, p, v, hz) {
    if (v === 'night') vgrad(c, W, H, [mix(p.bg, '#050920', 0.62), mix(p.bg, '#141a4c', 0.48), mix(p.bg2, '#3a2f74', 0.55)], 0, hz);
    else if (v === 'dusk') vgrad(c, W, H, [mix(p.bg, '#2b2a6e', 0.42), mix(p.bg2, '#c8648c', 0.42), mix(p.bg2, '#ffa468', 0.55), mix(p.bg2, '#ffe0a8', 0.6)], 0, hz);
    else vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.6), shade(p.bg2, 0.3)], 0, hz);
  }
  /* an object's colour in a variant's light */
  function lit(col, v) { return v === 'night' ? mix(col, '#0c1038', 0.52) : v === 'dusk' ? mix(col, '#5a2a52', 0.26) : col; }
  function sunDisc(c, x, y, r, col) { glow(c, x, y, r * 4, col, 0.5); dot(c, x, y, r, col); dot(c, x - r * 0.25, y - r * 0.25, r * 0.6, 'rgba(255,255,255,0.22)'); }
  function clouds(c, W, H, t, seed, n, y0, y1, u, col) { var R0 = rnd(seed + 'cl'), i; for (i = 0; i < n; i++) { var cw = u * (16 + R0() * 18), cx = frac(R0() + t * 0.005 * (1 + i * 0.3)) * (W + cw * 2) - cw, cy = H * (y0 + R0() * (y1 - y0)); K.cloud(c, cx, cy, cw, col); } }
  function birds(c, x, y, s, n, t, col) { var i; c.strokeStyle = col; c.lineWidth = s * 0.14; c.lineCap = 'round'; c.beginPath(); for (i = 0; i < n; i++) { var bx = x + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * s * 1.5, by = y + Math.ceil(i / 2) * s * 0.8, f = Math.sin(t * 5 + i) * s * 0.18; c.moveTo(bx - s * 0.5, by - s * 0.25 - f); c.quadraticCurveTo(bx - s * 0.2, by - s * 0.3, bx, by); c.quadraticCurveTo(bx + s * 0.2, by - s * 0.3, bx + s * 0.5, by - s * 0.25 - f); } c.stroke(); }
  /* a round leafy tree, base centre at (x, y); spots = blossom or leaf flecks in the crown */
  function tree(c, x, y, h, col, trunk, t, ph, spots, spotCol) {
    var sw = Math.sin(t * 0.6 + ph) * h * 0.01, r = h * 0.3, i, R0;
    quad(c, x - h * 0.05, y, x + h * 0.05, y, x + h * 0.026 + sw, y - h * 0.5, x - h * 0.026 + sw, y - h * 0.5, trunk);
    L(c, x, y - h * 0.36, x + h * 0.17 + sw, y - h * 0.58, h * 0.03, trunk); L(c, x, y - h * 0.3, x - h * 0.16 + sw, y - h * 0.54, h * 0.026, trunk);
    el(c, x - r * 0.78 + sw, y - h * 0.56, r * 0.82, r * 0.68, shade(col, -0.16)); el(c, x + r * 0.82 + sw, y - h * 0.58, r * 0.8, r * 0.66, shade(col, -0.09));
    el(c, x + sw, y - h * 0.74, r * 1.08, r * 0.92, col); el(c, x - r * 0.3 + sw, y - h * 0.83, r * 0.56, r * 0.42, shade(col, 0.16)); el(c, x + r * 0.5 + sw, y - h * 0.7, r * 0.34, r * 0.24, shade(col, 0.1));
    if (spots) { R0 = rnd('tr' + ph); c.fillStyle = spotCol; c.beginPath(); for (i = 0; i < spots; i++) { var a = R0() * TAU, d = Math.sqrt(R0()), px = x + sw + Math.cos(a) * d * r * 1.55, py = y - h * 0.68 + Math.sin(a) * d * r * 0.86, pr = h * (0.011 + R0() * 0.014); c.moveTo(px + pr, py); c.arc(px, py, pr, 0, TAU); } c.fill(); }
  }
  /* a palm frond: a stem from (x, y) along rot with leaflets down both sides */
  function frond(c, x, y, len, rot, col, n) {
    var i; c.save(); c.translate(x, y); c.rotate(rot);
    for (i = 0; i < n; i++) { var f = (i + 0.6) / n, ll = len * (0.16 + 0.26 * Math.sin(f * PI)); leaf(c, len * f, 0, ll, 0.95 - f * 0.4, i % 2 ? col : shade(col, -0.08)); leaf(c, len * f, 0, ll, -0.95 + f * 0.4, i % 2 ? shade(col, 0.1) : col); }
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.lineWidth = len * 0.022; c.strokeStyle = shade(col, -0.25); c.stroke(); c.restore();
  }
  function lampPost(c, x, base, h, u, col, glowCol, a) { /* a street lamp with a lantern head */
    Rn(c, x - u * 0.45, base - h, u * 0.9, h, 0, col); Rn(c, x - u * 1.3, base - u * 1.6, u * 2.6, u * 1.6, u * 0.4, col); Rn(c, x - u * 0.9, base - h * 0.55, u * 1.8, u * 0.6, u * 0.3, col);
    if (a > 0) glow(c, x, base - h - u * 2, u * 16, glowCol, 0.42 * a);
    Pg(c, [[x - u * 1.6, base - h - u * 0.2], [x + u * 1.6, base - h - u * 0.2], [x + u * 2.1, base - h - u * 3.6], [x - u * 2.1, base - h - u * 3.6]], a > 0 ? mix(glowCol, '#ffffff', 0.3) : shade(glowCol, -0.3), true);
    Pg(c, [[x - u * 2.5, base - h - u * 3.5], [x + u * 2.5, base - h - u * 3.5], [x, base - h - u * 5.4]], col, true); dot(c, x, base - h - u * 5.6, u * 0.5, col);
  }
  function bench(c, x, y, w, u, col) { /* a park bench seen from the front, feet at y */
    var h = w * 0.42; Rn(c, x - w * 0.42, y - h * 0.5, w * 0.06, h * 0.5, 0, shade(col, -0.35)); Rn(c, x + w * 0.36, y - h * 0.5, w * 0.06, h * 0.5, 0, shade(col, -0.35));
    Rn(c, x - w * 0.5, y - h * 0.56, w, h * 0.13, h * 0.05, col); Rn(c, x - w * 0.47, y - h * 1.0, w * 0.94, h * 0.14, h * 0.05, col); Rn(c, x - w * 0.47, y - h * 0.8, w * 0.94, h * 0.14, h * 0.05, shade(col, -0.1));
    Rn(c, x - w * 0.46, y - h * 1.02, w * 0.05, h * 0.5, 0, shade(col, -0.25)); Rn(c, x + w * 0.41, y - h * 1.02, w * 0.05, h * 0.5, 0, shade(col, -0.25));
  }

  /* ---------- jungle: tall trunks, lianas and great leaves round a misty clearing ---------- */
  Art.add('backdrop', 'jungle', function (c, W, H, t, p, o, u) {
    var i, j, s, R0 = rnd(o.seed + 'jg'), q = Math.min(u, H / 150), gr = H * 0.66, g1 = mix('#2f8a4e', p.accent2, 0.45), deep = mix(g1, '#0d3a2c', 0.6), mist = mix(shade(g1, 0.55), p.bg2, 0.5);
    vgrad(c, W, H, [mix(p.bg, g1, 0.3), mix(p.bg2, shade(g1, 0.6), 0.45), mist], 0, gr);
    glow(c, W * 0.5, H * 0.16, Math.max(W, H) * 0.55, '#fffbd0', 0.45);
    for (j = 0; j < 3; j++) { /* far canopy, layer on layer, paler with distance */
      var col = mix(mist, g1, 0.18 + j * 0.2), base = H * (0.36 + j * 0.1);
      c.fillStyle = col; c.beginPath(); for (i = 0; i <= 9; i++) { var bx = (i + R0() * 0.5 - 0.2) / 9 * W, br = u * (8 + R0() * 7); c.moveTo(bx + br, base); c.arc(bx, base + R0() * u * 3, br, 0, TAU); } c.fill(); c.fillRect(0, base + u * 3, W, gr - base);
      for (i = 0; i < 4; i++) { var tx = W * (0.08 + R0() * 0.84); c.fillRect(tx, base, q * (1 + j * 0.5), gr - base); }
    }
    c.save(); c.globalAlpha = 0.11; c.fillStyle = '#fffbd0'; for (i = 0; i < 5; i++) { var sx = W * (0.14 + i * 0.18), sway = Math.sin(t * 0.25 + i) * u * 1.2; c.beginPath(); c.moveTo(sx - u * 2, 0); c.lineTo(sx + u * 3, 0); c.lineTo(sx + u * 13 + sway - W * 0.1, gr + u * 4); c.lineTo(sx - u * 4 + sway - W * 0.1, gr + u * 4); c.closePath(); c.fill(); } c.restore();
    /* the ground: dark earth, a mossy lip, a paler worn path through the middle */
    var earth = mix('#5a3d22', deep, 0.4), g = c.createLinearGradient(0, gr, 0, H); g.addColorStop(0, mix(g1, deep, 0.35)); g.addColorStop(0.3, mix(earth, g1, 0.3)); g.addColorStop(1, shade(earth, -0.3)); c.fillStyle = g; c.fillRect(0, gr, W, H - gr);
    quad(c, W * 0.4, gr, W * 0.6, gr, W * 0.84, H, W * 0.16, H, alpha(mix(earth, '#e8c98a', 0.4), 0.4));
    c.fillStyle = shade(g1, 0.1); c.beginPath(); c.moveTo(0, gr + u); for (i = 0; i <= 24; i++) c.lineTo(i / 24 * W, gr - u * (0.4 + (i % 2) * 0.9 + R0() * 0.6)); c.lineTo(W, gr + u); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.08)'; for (i = 0; i < 7; i++) { c.beginPath(); c.ellipse(W * (0.28 + R0() * 0.44), gr + (H - gr) * (0.15 + R0() * 0.8), u * (4 + R0() * 6), u * 0.7, 0, 0, TAU); c.fill(); }
    /* the great trunks at the sides, mossed and wound with vine */
    for (s = 0; s < 2; s++) for (j = 0; j < 2; j++) {
      var d = s ? -1 : 1, x = (s ? W : 0) + d * u * (j ? 21 : 6), w = u * (j ? 5 : 10), tc = j ? mix(deep, '#3a2a20', 0.4) : mix(deep, '#2a1c14', 0.55), by = gr + u * (j ? 2 : 5);
      c.beginPath(); c.moveTo(x - w * 0.42, 0); c.lineTo(x + w * 0.42, 0); c.lineTo(x + w * 0.56, by - u * 4); c.quadraticCurveTo(x + w * 0.7, by, x + w * 1.3, by + u * 1.5); c.lineTo(x - w * 1.3, by + u * 1.5); c.quadraticCurveTo(x - w * 0.7, by, x - w * 0.56, by - u * 4); c.closePath(); c.fillStyle = tc; c.fill();
      Rn(c, x + d * w * 0.12, 0, w * 0.2, by - u * 4, 0, 'rgba(255,255,220,0.1)');
      for (i = 0; i < 5; i++) el(c, x - d * w * 0.2, H * (0.1 + i * 0.12) + R0() * u * 4, w * 0.36, u * (1.5 + R0() * 2), alpha(shade(g1, 0.15), 0.55));
      if (!j) { c.beginPath(); for (i = 0; i <= 30; i++) { var vy = i / 30 * by, vx = x + Math.sin(i * 0.72 + s) * w * 0.5; if (i) c.lineTo(vx, vy); else c.moveTo(vx, vy); } c.lineWidth = u * 0.7; c.strokeStyle = shade(g1, -0.1); c.stroke();
        for (i = 1; i < 30; i += 2) leaf(c, x + Math.sin(i * 0.72 + s) * w * 0.5, i / 30 * by, u * 4.2, (i % 4 === 1 ? 0.5 : PI - 0.5) + Math.sin(t * 0.9 + i) * 0.08, i % 4 === 1 ? shade(g1, 0.22) : g1); }
    }
    /* lianas looping across the top, some hanging down the sides */
    c.lineCap = 'round';
    for (i = 0; i < 3; i++) { var y1 = H * (0.02 + i * 0.045), sag = u * (9 + i * 4) + Math.sin(t * 0.5 + i) * u * 0.5; c.beginPath(); c.moveTo(-u, y1); c.quadraticCurveTo(W * (0.4 + i * 0.1), y1 + sag * 2, W + u, y1 + u * (i - 1) * 3); c.lineWidth = u * (0.9 - i * 0.15); c.strokeStyle = mix(deep, g1, 0.3 + i * 0.15); c.stroke(); }
    for (i = 0; i < 8; i++) { var side = i % 2, hx = (side ? W - u * (3 + R0() * 26) : u * (3 + R0() * 26)), len = H * (0.12 + R0() * 0.3), sw2 = Math.sin(t * 0.6 + i * 1.7) * u * 1.4, vc = i % 3 ? g1 : shade(g1, -0.2);
      c.beginPath(); c.moveTo(hx, 0); c.quadraticCurveTo(hx + sw2 * 0.4, len * 0.5, hx + sw2, len); c.lineWidth = u * 0.5; c.strokeStyle = shade(vc, -0.2); c.stroke();
      for (j = 2; j <= 7; j++) { var f = j / 7; leaf(c, hx + sw2 * f * f, len * f, u * 3.6, (j % 2 ? 0.6 : PI - 0.6), j % 2 ? vc : shade(vc, 0.18)); } }
    /* great leaves crowd the top corners and the bottom corners */
    for (s = 0; s < 2; s++) {
      var dd = s ? -1 : 1, ox = s ? W : 0, a0 = s ? PI : 0, br2 = Math.sin(t * 0.7 + s * 2) * 0.03;
      leaf(c, ox - dd * u * 2, H * 0.015, u * 40, a0 + dd * (0.5 + br2), shade(g1, -0.22)); leaf(c, ox - dd * u * 2, -u * 2, u * 46, a0 + dd * (0.2 + br2), shade(g1, -0.05));
      frond(c, ox + dd * u * 4, -u * 1, u * 38, a0 + dd * (0.82 - br2), shade(g1, 0.12), 9); frond(c, ox - dd * u * 1, H * 0.09, u * 30, a0 + dd * (0.42 + br2), mix(g1, '#c8d84a', 0.25), 8);
      frond(c, ox - dd * u * 2, H * 0.985, u * 34, a0 - dd * (0.75 + br2), shade(g1, -0.12), 9); frond(c, ox - dd * u * 2, H * 0.97, u * 30, a0 - dd * (0.3 - br2), shade(g1, 0.08), 8);
      leaf(c, ox - dd * u * 2, gr + u * 9, u * 22, a0 - dd * (0.5 + br2), mix(g1, '#c8d84a', 0.2)); leaf(c, ox - dd * u * 2, gr + u * 11, u * 19, a0 - dd * (0.05 + br2), shade(g1, -0.18));
      for (i = 0; i < 3; i++) { var fx = ox + dd * u * (8 + i * 9), fy = H - (H - gr) * (0.1 + (i % 2) * 0.3) - u * 4; c.strokeStyle = shade(g1, -0.3); c.lineWidth = u * 0.4; c.beginPath(); c.moveTo(fx, fy + u * 7); c.lineTo(fx, fy); c.stroke(); K.bloom(c, fx, fy, u * (3.6 - i * 0.5), [p.accent, p.gold, mix(p.accent, '#ffffff', 0.5)][(i + s) % 3], t, i + s * 2); }
    }
    /* a bright bird on a liana, a pair of butterflies */
    var px = W * 0.83, py = H * 0.3 + Math.sin(t * 0.5) * u * 0.4, bob = Math.sin(t * 2.2) * u * 0.2;
    c.beginPath(); c.moveTo(W + u, py - u * 3); c.quadraticCurveTo(px, py + u * 2.4, W * 0.66, py - u * 9); c.lineWidth = u * 0.7; c.strokeStyle = mix(deep, g1, 0.3); c.stroke();
    quad(c, px - u * 1.6, py - u * 1, px + u * 0.4, py - u * 1, px - u * 0.4, py + u * 8, px - u * 2.4, py + u * 7.4, shade(p.accent, -0.2)); el(c, px, py - u * 3.4 + bob, u * 2.9, u * 4.1, p.accent, 0.15); el(c, px - u * 1.3, py - u * 2.6 + bob, u * 1.5, u * 3, p.accent2, 0.3); el(c, px - u * 1.5, py - u * 1.6 + bob, u * 0.9, u * 2, p.gold, 0.3);
    dot(c, px + u * 0.7, py - u * 7.4 + bob, u * 2.2, p.accent); el(c, px + u * 1.2, py - u * 7.3 + bob, u * 1.1, u * 1.3, '#ffffff'); dot(c, px + u * 1.4, py - u * 7.4 + bob, u * 0.45, '#2b2118');
    c.beginPath(); c.moveTo(px + u * 2.4, py - u * 8.2 + bob); c.quadraticCurveTo(px + u * 5.2, py - u * 8, px + u * 4.4, py - u * 5.4 + bob); c.quadraticCurveTo(px + u * 3.4, py - u * 6.6, px + u * 2.3, py - u * 6.4 + bob); c.closePath(); c.fillStyle = p.gold; c.fill();
    L(c, px - u * 0.4, py + u * 0.4, px + u * 0.6, py + u * 0.9, u * 0.5, '#4a3a2a');
    K.bfly(c, W * 0.2 + Math.sin(t * 0.5) * u * 6, H * 0.5 + Math.cos(t * 0.7) * u * 4, u * 2.3, p.gold, t, 0); K.bfly(c, W * 0.74 + Math.sin(t * 0.4 + 2) * u * 7, H * 0.58 + Math.cos(t * 0.6 + 1) * u * 3, u * 1.9, mix(p.accent, '#ffffff', 0.4), t, 2.5);
    vignette(c, W, H, deep, 0.35);
  }, { variants: ['day'], stage: 'band-low' });

  /* ---------- savanna: flat-topped acacias, gold grass, far giraffes; a huge low sun at dusk ---------- */
  function acacia(c, x, y, h, col, trunk, t, ph) {
    var sw = Math.sin(t * 0.5 + ph) * h * 0.008, i, w = h * 0.62;
    c.lineCap = 'round'; c.strokeStyle = trunk; c.lineWidth = h * 0.05; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + h * 0.06, y - h * 0.3, x - h * 0.02, y - h * 0.55); c.stroke();
    c.lineWidth = h * 0.028; c.beginPath(); c.moveTo(x - h * 0.01, y - h * 0.5); c.quadraticCurveTo(x - h * 0.2, y - h * 0.66, x - w * 0.7 + sw, y - h * 0.78); c.moveTo(x - h * 0.01, y - h * 0.5); c.quadraticCurveTo(x + h * 0.16, y - h * 0.66, x + w * 0.72 + sw, y - h * 0.8); c.moveTo(x, y - h * 0.52); c.lineTo(x + h * 0.03 + sw, y - h * 0.86); c.stroke();
    el(c, x + sw, y - h * 0.8, w, h * 0.09, shade(col, -0.18)); el(c, x - w * 0.42 + sw, y - h * 0.86, w * 0.56, h * 0.075, col); el(c, x + w * 0.4 + sw, y - h * 0.88, w * 0.6, h * 0.08, col); el(c, x + w * 0.02 + sw, y - h * 0.93, w * 0.6, h * 0.07, shade(col, 0.12));
    for (i = 0; i < 4; i++) el(c, x + (i - 1.5) * w * 0.38 + sw, y - h * (0.9 + (i % 2) * 0.04), w * 0.16, h * 0.022, shade(col, 0.24));
  }
  function giraffe(c, x, y, s, col, d) { /* a far silhouette, feet at (x, y) */
    c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = s * 0.07; c.beginPath(); c.moveTo(x - s * 0.2, y); c.lineTo(x - s * 0.17, y - s * 0.5); c.moveTo(x - s * 0.08, y); c.lineTo(x - s * 0.1, y - s * 0.5); c.moveTo(x + s * 0.12, y); c.lineTo(x + s * 0.1, y - s * 0.5); c.moveTo(x + s * 0.2, y); c.lineTo(x + s * 0.17, y - s * 0.5); c.stroke();
    el(c, x, y - s * 0.55, s * 0.26, s * 0.13, col); quad(c, x + d * s * 0.1, y - s * 0.52, x + d * s * 0.26, y - s * 0.56, x + d * s * 0.44, y - s * 1.12, x + d * s * 0.36, y - s * 1.14, col);
    el(c, x + d * s * 0.45, y - s * 1.15, s * 0.12, s * 0.06, col, d * 0.4); L(c, x + d * s * 0.38, y - s * 1.2, x + d * s * 0.37, y - s * 1.28, s * 0.03, col); L(c, x - d * s * 0.25, y - s * 0.56, x - d * s * 0.3, y - s * 0.3, s * 0.03, col);
  }
  Art.add('backdrop', 'savanna', function (c, W, H, t, p, o, u) {
    var i, v = o.variant, dusk = v === 'dusk', R0 = rnd(o.seed + 'sv'), q = Math.min(u, H / 150), hz = H * 0.64;
    var grass = dusk ? mix(mix('#b8703a', p.bg2, 0.25), '#5a2a40', 0.2) : mix('#e2bb5c', p.bg2, 0.3), sil = dusk ? mix('#2a1432', p.bg, 0.2) : null, far = dusk ? mix('#6a3a5a', p.bg2, 0.3) : mix(mix('#b9a88a', p.bg2, 0.5), p.bg, 0.25);
    if (dusk) vgrad(c, W, H, [mix(p.bg, '#3a2466', 0.45), mix(p.bg2, '#d85a7a', 0.5), mix(p.bg2, '#ff9648', 0.65), mix(p.bg2, '#ffd27a', 0.7)], 0, hz); else skyOf(c, W, H, p, 'day', hz);
    if (dusk) { skyStars(c, W, H, 26, o.seed, t, H * 0.2, '#fff4e0'); var sx = W * 0.3, sy = hz - u * 5; glow(c, sx, sy, u * 60, '#ffe9a0', 0.55); dot(c, sx, sy, u * 15, '#fff0b8'); dot(c, sx, sy, u * 13.4, '#ffe08a');
      c.fillStyle = alpha(mix(p.bg2, '#d85a7a', 0.6), 0.5); for (i = 0; i < 5; i++) { c.beginPath(); c.ellipse(W * (0.1 + R0() * 0.8) + Math.sin(t * 0.05 + i) * u * 3, H * (0.3 + R0() * 0.26), u * (16 + R0() * 22), u * (0.8 + R0() * 1.2), 0, 0, TAU); c.fill(); } }
    else { sunDisc(c, W * 0.8, H * 0.12, u * 7.5, '#fff0a8'); clouds(c, W, H, t, o.seed, 4, 0.06, 0.34, u, 'rgba(255,255,255,0.9)'); }
    /* far: a table mountain, low hills, giraffes walking the skyline */
    Pg(c, [[W * 0.52, hz], [W * 0.6, hz - q * 9], [W * 0.66, hz - q * 10.5], [W * 0.86, hz - q * 10], [W * 0.92, hz - q * 7], [W * 1.02, hz - q * 5], [W * 1.02, hz]], mix(far, dusk ? '#ffb070' : '#ffffff', 0.18), true);
    hill(c, W, H, hz - q * 2.4, q * 1.6, far, o.seed + 'a', 0.5);
    var gc = sil || mix(far, '#5a4030', 0.45), gx = W * 0.6 + Math.sin(t * 0.05) * u * 2; giraffe(c, gx, hz - q * 1.4, q * 9, gc, 1); giraffe(c, gx - q * 9, hz - q * 1.2, q * 7, gc, 1); giraffe(c, gx + q * 13, hz - q * 1.5, q * 4.6, gc, -1);
    for (i = 0; i < 5; i++) acacia(c, W * [0.33, 0.44, 0.72, 0.9, 0.05][i], hz - q * (0.6 + (i % 2) * 0.6), q * (7 + R0() * 5), sil || mix(far, '#5a7a3a', 0.5), sil || mix(far, '#4a3020', 0.5), t, i);
    birds(c, W * 0.24, H * 0.26 + Math.sin(t * 0.3) * u, u * 2.2, 5, t, sil || alpha(p.ink, 0.6));
    /* the plain */
    var g = c.createLinearGradient(0, hz - q * 2, 0, H); g.addColorStop(0, shade(grass, 0.2)); g.addColorStop(0.3, grass); g.addColorStop(1, shade(grass, -0.3)); c.fillStyle = g; c.fillRect(0, hz - q * 1, W, H - hz + q);
    c.fillStyle = alpha(shade(grass, 0.3), 0.5); for (i = 0; i < 14; i++) { c.beginPath(); c.ellipse(R0() * W, hz + R0() * (H - hz), u * (6 + R0() * 14), u * (0.3 + R0() * 0.5), 0, 0, TAU); c.fill(); }
    quad(c, W * 0.46, hz, W * 0.52, hz, W * 0.78, H, W * 0.3, H, alpha(mix(grass, '#c98a5a', 0.6), 0.45)); /* a dusty track */
    c.lineCap = 'round'; c.lineWidth = u * 0.3; c.strokeStyle = shade(grass, -0.22); c.beginPath(); for (i = 0; i < 70; i++) { var tx = R0() * W, ty = hz + u * 1 + R0() * R0() * (H - hz), ts = u * (0.8 + (ty - hz) / (H - hz) * 2.4), k; for (k = -1; k <= 1; k++) { c.moveTo(tx, ty); c.lineTo(tx + k * ts * 0.6 + Math.sin(t * 1.2 + i) * ts * 0.15, ty - ts); } } c.stroke();
    /* the near trees: a great acacia on the left, a smaller one right, a termite mound and rocks */
    var ac = sil || mix('#6f9440', p.accent2, 0.35), tk = sil || '#5a3d28';
    acacia(c, W * 0.9, hz + q * 5, q * 30, sil ? mix(sil, '#000', 0.1) : shade(ac, 0.1), tk, t, 7); acacia(c, W * 0.13, hz + q * 9, q * 52, sil ? mix(sil, '#000', 0.25) : ac, sil ? mix(sil, '#000', 0.25) : shade(tk, -0.1), t, 9);
    var rk = sil ? mix(sil, grass, 0.25) : mix('#a8703a', grass, 0.3), mx = W * 0.82, my = H * 0.82;
    c.beginPath(); c.moveTo(mx - u * 7, my); c.quadraticCurveTo(mx - u * 3, my - u * 6, mx - u * 2, my - u * 15); c.quadraticCurveTo(mx, my - u * 20, mx + u * 2, my - u * 12); c.quadraticCurveTo(mx + u * 5, my - u * 9, mx + u * 8, my); c.closePath(); c.fillStyle = rk; c.fill(); el(c, mx - u * 1, my - u * 10, u * 1.2, u * 4, 'rgba(255,255,255,0.12)');
    el(c, mx + u * 10, my - u * 0.5, u * 5, u * 3, shade(rk, -0.2)); el(c, mx + u * 9, my - u * 1.5, u * 3, u * 1.2, shade(rk, 0.12)); el(c, W * 0.06, H * 0.9, u * 7, u * 3.4, shade(rk, -0.22)); el(c, W * 0.05, H * 0.888, u * 4, u * 1.4, shade(rk, 0.1));
    /* tall grass along the bottom, swaying */
    for (i = 0; i < 46; i++) { var bx = (i + R0()) / 46 * W, bh = u * (5 + R0() * 9) * (Math.abs(bx / W - 0.5) * 1.4 + 0.3), sway = Math.sin(t * 1.3 + i * 0.7) * u * 1.2; c.beginPath(); c.moveTo(bx - u * 0.5, H); c.quadraticCurveTo(bx, H - bh * 0.6, bx + sway + u * 1.5, H - bh); c.quadraticCurveTo(bx + u * 0.6, H - bh * 0.5, bx + u * 0.6, H); c.closePath(); c.fillStyle = i % 3 ? shade(grass, -0.34) : shade(grass, -0.18); c.fill(); }
    if (dusk) glow(c, W * 0.3, hz, W * 0.7, '#ffb060', 0.22);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- tulipfield: bands of tulips running to a windmill on the horizon ---------- */
  function tulip(c, x, y, s, col, sway, stem) { /* head centre at (x, y) */
    c.strokeStyle = stem; c.lineWidth = s * 0.22; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - sway, y + s * 3.4); c.quadraticCurveTo(x - sway, y + s * 1.5, x, y + s * 0.5); c.stroke();
    leaf(c, x - sway, y + s * 3.4, s * 2.6, -PI / 2 - 0.45, stem); leaf(c, x - sway, y + s * 3.4, s * 2.2, -PI / 2 + 0.5, shade(stem, 0.15));
    c.beginPath(); c.moveTo(x - s * 0.9, y - s * 0.75); c.quadraticCurveTo(x - s * 0.45, y - s * 0.3, x, y - s * 1.0); c.quadraticCurveTo(x + s * 0.45, y - s * 0.3, x + s * 0.9, y - s * 0.75); c.bezierCurveTo(x + s * 1.15, y + s * 0.6, x + s * 0.4, y + s * 0.9, x, y + s * 0.9); c.bezierCurveTo(x - s * 0.4, y + s * 0.9, x - s * 1.15, y + s * 0.6, x - s * 0.9, y - s * 0.75); c.closePath(); c.fillStyle = col; c.fill();
    el(c, x, y + s * 0.05, s * 0.36, s * 0.82, shade(col, 0.22)); el(c, x - s * 0.5, y, s * 0.14, s * 0.5, 'rgba(255,255,255,0.25)', 0.2);
  }
  Art.add('backdrop', 'tulipfield', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'tf'), q = Math.min(u, H / 150), hz = H * 0.62, cx = W * 0.5, grn = mix('#4a9a4a', p.accent2, 0.5);
    var cols = [p.accent, p.gold, mix(p.accent, '#ffffff', 0.55), mix(p.accent, '#7a3ac8', 0.5), '#ffffff', mix(p.gold, p.accent, 0.5), mix(p.accent, '#ff5a9a', 0.5)];
    skyOf(c, W, H, p, 'day', hz); sunDisc(c, W * 0.2, H * 0.1, u * 7, '#fff3b0'); clouds(c, W, H, t, o.seed, 5, 0.05, 0.36, u, 'rgba(255,255,255,0.92)');
    birds(c, W * 0.7, H * 0.2 + Math.sin(t * 0.3) * u, u * 1.8, 3, t, alpha(p.ink, 0.5));
    /* far: a line of poplars, a farmhouse, the windmill turning */
    hill(c, W, H, hz - q * 2.2, q * 1, mix(grn, p.bg2, 0.55), o.seed + 'a', 0.5);
    for (i = 0; i < 16; i++) { var tx = (i + 0.3 + R0() * 0.4) / 16 * W, th = q * (5 + R0() * 4); if (tx > W * 0.7 && tx < W * 0.96) continue; el(c, tx, hz - q * 1.5 - th / 2, q * (1.1 + R0() * 0.5), th / 2, mix(grn, p.bg2, 0.3 + (i % 2) * 0.1)); }
    var hx = W * 0.1, hy = hz - q * 1.2; Rn(c, hx, hy - q * 4, q * 8, q * 4, 0, p.paper); Pg(c, [[hx - q * 0.8, hy - q * 4], [hx + q * 4, hy - q * 7.4], [hx + q * 8.8, hy - q * 4]], shade(p.accent, -0.2), true); Rn(c, hx + q * 1.2, hy - q * 2.8, q * 1.6, q * 1.4, 0, mix(p.bg, '#2a4a6a', 0.5)); Rn(c, hx + q * 5, hy - q * 2.8, q * 1.6, q * 2.8, 0, shade(p.accent, -0.3));
    var mx = W * 0.83, my = hz - q * 0.6, mh = q * 32, wc = mix(p.paper, '#c9a880', 0.25);
    Pg(c, [[mx - mh * 0.22, my], [mx + mh * 0.22, my], [mx + mh * 0.12, my - mh * 0.7], [mx - mh * 0.12, my - mh * 0.7]], wc, true); quad(c, mx, my, mx + mh * 0.22, my, mx + mh * 0.12, my - mh * 0.7, mx, my - mh * 0.7, shade(wc, -0.1));
    Rn(c, mx - mh * 0.3, my - mh * 0.34, mh * 0.6, mh * 0.03, 0, shade(wc, -0.3)); for (i = -3; i <= 3; i++) Rn(c, mx + i * mh * 0.09 - mh * 0.008, my - mh * 0.4, mh * 0.016, mh * 0.07, 0, shade(wc, -0.3));
    Pg(c, [[mx - mh * 0.15, my - mh * 0.7], [mx + mh * 0.15, my - mh * 0.7], [mx + mh * 0.09, my - mh * 0.86], [mx - mh * 0.09, my - mh * 0.86]], shade(p.accent, -0.25), true);
    Rn(c, mx - mh * 0.045, my - mh * 0.16, mh * 0.09, mh * 0.16, mh * 0.04, shade(p.accent, -0.3)); Rn(c, mx - mh * 0.035, my - mh * 0.56, mh * 0.07, mh * 0.09, mh * 0.03, mix(p.bg, '#2a4a6a', 0.5));
    c.save(); c.translate(mx, my - mh * 0.78); c.rotate(t * 0.35); for (i = 0; i < 4; i++) { c.rotate(PI / 2); Rn(c, -mh * 0.012, -mh * 0.62, mh * 0.024, mh * 0.62, 0, '#5a4030'); c.fillStyle = alpha(p.paper, 0.92); c.fillRect(mh * 0.012, -mh * 0.6, mh * 0.12, mh * 0.44); c.strokeStyle = '#5a4030'; c.lineWidth = mh * 0.008; c.beginPath(); for (j = 0; j <= 4; j++) { c.moveTo(mh * 0.012, -mh * (0.6 - j * 0.11)); c.lineTo(mh * 0.132, -mh * (0.6 - j * 0.11)); } c.moveTo(mh * 0.132, -mh * 0.6); c.lineTo(mh * 0.132, -mh * 0.16); c.stroke(); } c.restore(); dot(c, mx, my - mh * 0.78, mh * 0.03, '#5a4030');
    /* the field: colour bands fanning out from the vanishing point */
    c.fillStyle = shade(grn, -0.12); c.fillRect(0, hz - q * 0.8, W, H - hz + q);
    var n = 7, wTop = W * 0.085, wBot = W * 0.42, gap = 0.2, vy = hz - q * 0.8;
    for (i = -n; i < n; i++) { var col = cols[((i % 7) + 7) % 7]; quad(c, cx + (i + gap / 2) * wTop, vy, cx + (i + 1 - gap / 2) * wTop, vy, cx + (i + 1 - gap / 2) * wBot, H, cx + (i + gap / 2) * wBot, H, shade(col, -0.08)); }
    for (j = 0; j < 20; j++) { /* rows of heads, bigger as they come near */
      var f = Math.pow((j + 0.5) / 20, 1.9), y = vy + (H - vy) * f, ww = wTop + (wBot - wTop) * f, r = u * (0.35 + f * 2.2), sway = Math.sin(t * 1.2 + j) * r * 0.25, k;
      for (i = -n; i < n; i++) { var col2 = cols[((i % 7) + 7) % 7], x0 = cx + (i + gap / 2) * ww, x1 = cx + (i + 1 - gap / 2) * ww; if (x1 < -r || x0 > W + r) continue; var m = Math.max(1, Math.round((x1 - x0) / (r * 2.3)));
        c.fillStyle = j % 2 ? shade(col2, 0.14) : col2; c.beginPath(); for (k = 0; k < m; k++) { var px = x0 + (k + 0.5) / m * (x1 - x0) + sway; c.moveTo(px + r, y); c.ellipse(px, y, r * 0.8, r, 0, 0, TAU); } c.fill(); }
    }
    var g = c.createLinearGradient(0, hz, 0, H); g.addColorStop(0, alpha(p.bg2, 0.3)); g.addColorStop(0.35, alpha(p.bg2, 0)); c.fillStyle = g; c.fillRect(0, hz - q, W, H - hz + q);
    /* big tulips nod in the bottom corners */
    for (i = 0; i < 10; i++) { var side = i % 2, d = Math.floor(i / 2), tx2 = side ? W - u * (4 + d * 6.4) : u * (4 + d * 6.4), ty2 = H - u * (17 - d * 2.2 + (d % 2) * 3), sz = u * (3.6 - d * 0.25); tulip(c, tx2 + Math.sin(t * 1.1 + i) * u * 0.5, ty2, sz, cols[(i * 3 + 1) % 7], Math.sin(t * 1.1 + i) * u * 0.5, shade(grn, -0.2)); }
    K.bfly(c, W * 0.3 + Math.sin(t * 0.5) * u * 8, H * 0.55 + Math.cos(t * 0.7) * u * 3, u * 2, '#ffffff', t, 1);
  }, { variants: ['day'], stage: 'band-low' });

  /* ---------- the two parks share their bones: far hills, a lawn, a path, a lamp and a bench ---------- */
  function lawn(c, W, H, hz, col, pathCol, u, R0) {
    var g = c.createLinearGradient(0, hz, 0, H), i; g.addColorStop(0, shade(col, 0.2)); g.addColorStop(0.35, col); g.addColorStop(1, shade(col, -0.3)); c.fillStyle = g; c.fillRect(0, hz, W, H - hz);
    c.fillStyle = alpha(shade(col, 0.3), 0.35); for (i = 0; i < 10; i++) { c.beginPath(); c.ellipse(R0() * W, hz + R0() * (H - hz), u * (8 + R0() * 14), u * (0.5 + R0() * 0.8), 0, 0, TAU); c.fill(); }
    /* a path that wanders up from the bottom to the far gate */
    c.beginPath(); c.moveTo(W * 0.2, H); c.bezierCurveTo(W * 0.3, H - (H - hz) * 0.45, W * 0.62, H - (H - hz) * 0.55, W * 0.5, hz + u * 0.6); c.lineTo(W * 0.545, hz + u * 0.6); c.bezierCurveTo(W * 0.78, H - (H - hz) * 0.55, W * 0.72, H - (H - hz) * 0.4, W * 0.84, H); c.closePath(); c.fillStyle = pathCol; c.fill();
    c.fillStyle = alpha(shade(pathCol, -0.25), 0.3); for (i = 0; i < 26; i++) { var f = R0(), py = hz + (H - hz) * (0.12 + f * 0.86); c.beginPath(); c.ellipse(W * (0.36 + R0() * 0.3), py, u * (0.4 + f * 1.2), u * (0.15 + f * 0.35), 0, 0, TAU); c.fill(); }
  }
  function blossomBranch(c, x0, y0, mx, my, x1, y1, w, bark, cols, n, ph, u, sw) {
    var R0 = rnd('bb' + ph), i, k;
    c.lineCap = 'round'; c.strokeStyle = bark; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1 + sw, y1); c.stroke();
    for (i = 0; i < n; i++) { var f = (i + 0.7) / n, a = 1 - f, bx = a * a * x0 + 2 * a * f * mx + f * f * (x1 + sw), by = a * a * y0 + 2 * a * f * my + f * f * y1, tx = bx + (R0() - 0.5) * u * 13 + sw * f, ty = by + (R0() - 0.25) * u * 10;
      c.lineWidth = w * 0.28; c.strokeStyle = bark; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
      for (k = 0; k < 5; k++) dot(c, tx + (R0() - 0.5) * u * 6, ty + (R0() - 0.5) * u * 5, u * (1.5 + R0() * 1.9), cols[(i + k) % cols.length]);
      dot(c, tx, ty, u * 0.55, cols[3]); }
  }

  /* ---------- blossompark: cherry trees in bloom over a lawn and a pond, petals on the air ---------- */
  Art.add('backdrop', 'blossompark', function (c, W, H, t, p, o, u) {
    var i, v = o.variant, dusk = v === 'dusk', R0 = rnd(o.seed + 'bp'), q = Math.min(u, H / 150), hz = H * 0.63;
    var pk = lit(mix('#ffb3cf', p.accent, 0.22), v), pk2 = lit(mix('#ffe1ec', p.accent, 0.08), v), grn = lit(mix('#7cc27a', p.accent2, 0.4), v), bark = lit('#5a3a34', v), pcs = [pk, pk2, shade(pk, 0.25), lit(mix('#e0608a', p.accent, 0.3), v)];
    skyOf(c, W, H, p, v, hz);
    if (dusk) { skyStars(c, W, H, 30, o.seed, t, H * 0.25, '#fff4e0'); sunDisc(c, W * 0.7, hz - q * 7, u * 6, '#ffe6a0'); c.fillStyle = alpha(mix(p.bg2, '#e0708a', 0.6), 0.45); for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(W * (0.1 + R0() * 0.8) + Math.sin(t * 0.05 + i) * u * 3, H * (0.26 + R0() * 0.26), u * (18 + R0() * 20), u * (0.9 + R0()), 0, 0, TAU); c.fill(); } }
    else { sunDisc(c, W * 0.5, H * 0.07, u * 6, '#fff6c0'); clouds(c, W, H, t, o.seed, 4, 0.1, 0.36, u, 'rgba(255,255,255,0.9)'); }
    /* far hills, a far wood all in bloom, a little pavilion roof */
    hill(c, W, H, hz - q * 8, q * 3, mix(grn, p.bg2, 0.6), o.seed + 'a', 0.6); hill(c, W, H, hz - q * 4, q * 2, mix(grn, p.bg2, 0.35), o.seed + 'b', 0.9);
    for (i = 0; i < 11; i++) { var fx = (i + 0.2 + R0() * 0.6) / 11 * W; tree(c, fx, hz + q * 0.5, q * (9 + R0() * 7), mix(i % 3 ? pk : pk2, p.bg2, 0.25), mix(bark, p.bg2, 0.4), t, i); }
    var gx = W * 0.52, gy = hz + q * 0.6, gc = lit(mix(p.paper, '#c9b8a0', 0.3), v); Rn(c, gx - q * 3.2, gy - q * 5, q * 0.7, q * 5, 0, gc); Rn(c, gx + q * 2.5, gy - q * 5, q * 0.7, q * 5, 0, gc); Pg(c, [[gx - q * 5.4, gy - q * 5], [gx, gy - q * 8.6], [gx + q * 5.4, gy - q * 5]], lit(shade(p.accent, -0.2), v), true); dot(c, gx, gy - q * 8.8, q * 0.6, lit(p.gold, v));
    lawn(c, W, H, hz, grn, lit(mix(p.paper, '#e8c9a0', 0.4), v), u, R0);
    /* the pond, sky in it, at the right; two ducks */
    var px = W * 0.8, py = hz + q * 8, pw = W * 0.26, wc = mix(dusk ? mix(p.bg2, '#ffa468', 0.5) : p.bg, '#ffffff', 0.25);
    el(c, px, py + q * 0.5, pw + u, q * 4.4, shade(grn, -0.2)); el(c, px, py, pw, q * 3.8, wc); el(c, px - pw * 0.2, py - q * 1, pw * 0.5, q * 1.2, alpha(pk, 0.4));
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = u * 0.25; c.beginPath(); for (i = 0; i < 6; i++) { var rx = px - pw * 0.7 + R0() * pw * 1.2 + Math.sin(t * 0.6 + i) * u, ry = py - q * 2 + R0() * q * 4.4; c.moveTo(rx, ry); c.lineTo(rx + u * (2 + R0() * 4), ry); } c.stroke();
    for (i = 0; i < 2; i++) { var dx = px - pw * 0.35 + i * u * 6 + Math.sin(t * 0.2) * u * 4, dy = py + q * (0.4 - i * 1.2), dc = i ? lit(p.gold, v) : '#ffffff'; el(c, dx, dy, u * (1.8 - i * 0.5), u * (1 - i * 0.3), dc); dot(c, dx + u * (1.5 - i * 0.4), dy - u * (0.9 - i * 0.2), u * (0.75 - i * 0.2), dc); Pg(c, [[dx + u * (2.1 - i * 0.5), dy - u * 0.9], [dx + u * (3 - i * 0.7), dy - u * 0.7], [dx + u * (2.1 - i * 0.5), dy - u * 0.5]], '#f0a030', true); }
    /* trees in bloom on the lawn, a bench, a lamp */
    tree(c, W * 0.28, hz + q * 5, q * 30, pk, bark, t, 21, 46, pk2); tree(c, W * 0.93, hz + q * 3, q * 24, shade(pk, 0.14), bark, t, 22, 36, '#ffffff');
    el(c, W * 0.28, hz + q * 5.4, q * 9, q * 1.3, alpha(pk2, 0.5));
    bench(c, W * 0.36, hz + q * 9, u * 13, u, lit(mix('#8a5a3a', p.accent, 0.15), v));
    lampPost(c, W * 0.66, hz + q * 13, q * 24, u * 0.9, lit('#3a3a4a', v), '#ffd98a', dusk ? 1 : 0);
    c.fillStyle = alpha(pk2, 0.75); c.beginPath(); for (i = 0; i < 80; i++) { var sx = R0() * W, sy = hz + u + R0() * (H - hz - u), ss = u * (0.3 + (sy - hz) / (H - hz) * 0.7); c.moveTo(sx + ss, sy); c.ellipse(sx, sy, ss, ss * 0.5, 0, 0, TAU); } c.fill();
    /* the near tree: its trunk at the left edge, boughs heavy with blossom reaching over the top */
    var sw = Math.sin(t * 0.6) * u * 0.6, tb = shade(bark, -0.2);
    c.beginPath(); c.moveTo(-u * 2, H * 0.9); c.quadraticCurveTo(u * 9, H * 0.6, u * 3, H * 0.3); c.lineTo(u * 3, 0); c.lineTo(-u * 2, 0); c.closePath(); c.fillStyle = tb; c.fill(); el(c, u * 2, H * 0.89, u * 9, u * 2.4, tb);
    c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = u * 0.5; c.beginPath(); for (i = 0; i < 5; i++) { c.moveTo(u * (1 + i * 0.8), H * (0.4 + i * 0.07)); c.lineTo(u * (2.4 + i * 0.8), H * (0.52 + i * 0.07)); } c.stroke();
    blossomBranch(c, u * 2, H * 0.3, W * 0.2, H * 0.04, W * 0.56, H * 0.06, u * 2.6, tb, pcs, 13, 1, u, sw); blossomBranch(c, u * 1, H * 0.34, W * 0.16, H * 0.2, W * 0.3, H * 0.27, u * 1.8, tb, pcs, 7, 2, u, sw);
    blossomBranch(c, W + u * 2, H * 0.02, W * 0.86, H * 0.1, W * 0.62, H * 0.035, u * 2.2, tb, pcs, 9, 3, u, -sw); blossomBranch(c, W + u * 2, H * 0.1, W * 0.94, H * 0.24, W * 0.8, H * 0.3, u * 1.7, tb, pcs, 7, 4, u, -sw);
    for (i = 0; i < 16; i++) { var fx2 = frac(R0() + t * 0.012 + Math.sin(t * 0.6 + i) * 0.03) * W, fy2 = frac(R0() + t * (0.03 + R0() * 0.03)) * H, fs = u * (0.7 + R0() * 0.7); c.save(); c.translate(fx2, fy2); c.rotate(R0() * 6 + t * (0.6 + R0())); c.scale(1, 0.4 + 0.6 * Math.abs(Math.cos(t * 2 + i))); c.beginPath(); c.moveTo(-fs, 0); c.quadraticCurveTo(0, -fs * 0.9, fs, 0); c.quadraticCurveTo(0, fs * 0.9, -fs, 0); c.fillStyle = i % 2 ? pk2 : shade(pk, 0.2); c.fill(); c.restore(); }
    if (dusk) glow(c, W * 0.7, hz - q * 4, W * 0.6, '#ffb070', 0.2);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- autumnpark: a rail fence, maples on fire, leaves heaped and falling ---------- */
  function leafHeap(c, x, y, w, h, cols, seed, u) { var R0 = rnd('lh' + seed), i; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.5, y - h * 1.5, x, y - h); c.quadraticCurveTo(x + w * 0.6, y - h * 1.3, x + w, y); c.closePath(); c.fillStyle = shade(cols[0], -0.25); c.fill();
    for (i = 0; i < 26; i++) { var f = R0() * 2 - 1, lx = x + f * w * 0.86, ly = y - R0() * h * (1 - Math.abs(f) * 0.8) * 1.1; leaf(c, lx, ly, u * (2.2 + R0() * 1.6), R0() * TAU, cols[i % cols.length]); } }
  Art.add('backdrop', 'autumnpark', function (c, W, H, t, p, o, u) {
    var i, j, v = o.variant, dusk = v === 'dusk', R0 = rnd(o.seed + 'ap'), q = Math.min(u, H / 150), hz = H * 0.635;
    var or = lit(mix('#f08a2c', p.accent, 0.25), v), rd = lit(mix('#c8402a', p.accent, 0.4), v), gd = lit(mix('#f2c23c', p.gold, 0.5), v), br = lit('#9a5a2a', v), bark = lit('#4a3226', v), grass = lit(mix(mix('#b9b05a', p.accent2, 0.3), p.bg2, 0.12), v), lc = [or, gd, rd, br];
    skyOf(c, W, H, p, v, hz);
    if (dusk) { skyStars(c, W, H, 30, o.seed, t, H * 0.24, '#fff4e0'); K.moonDisc(c, W * 0.5, H * 0.075, u * 4.5, '#fff1d6'); c.fillStyle = alpha(mix(p.bg2, '#d86a6a', 0.6), 0.45); for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(W * (0.1 + R0() * 0.8) + Math.sin(t * 0.05 + i) * u * 3, H * (0.28 + R0() * 0.24), u * (18 + R0() * 20), u * (0.9 + R0()), 0, 0, TAU); c.fill(); } }
    else { sunDisc(c, W * 0.5, H * 0.075, u * 6, '#fff3c0'); clouds(c, W, H, t, o.seed, 4, 0.1, 0.34, u, 'rgba(255,255,255,0.88)'); birds(c, W * 0.36, H * 0.2 + Math.sin(t * 0.3) * u, u * 2, 5, t, alpha(p.ink, 0.5)); }
    /* far: hills quilted in autumn woods, a cottage with a lit window */
    var f1 = hill(c, W, H, hz - q * 10, q * 3.5, mix(or, p.bg2, 0.6), o.seed + 'a', 0.6), f2 = hill(c, W, H, hz - q * 5, q * 2.2, mix(rd, p.bg2, 0.45), o.seed + 'b', 0.9);
    for (j = 0; j < 2; j++) for (i = 0; i < 16; i++) { var fx = (i + R0()) / 16 * W, fy = (j ? f2 : f1)(fx) + q * (1 + R0() * 3), fr = q * (2 + R0() * 2.4); dot(c, fx, fy, fr, mix([or, gd, rd][(i + j) % 3], p.bg2, j ? 0.3 : 0.5)); }
    var hx = W * 0.56, hy = hz + q * 0.4, hc = lit(mix(p.paper, '#c9a880', 0.3), v); Rn(c, hx, hy - q * 4.5, q * 8, q * 4.5, 0, hc); Pg(c, [[hx - q * 0.9, hy - q * 4.5], [hx + q * 4, hy - q * 8.2], [hx + q * 8.9, hy - q * 4.5]], lit('#6a3a30', v), true); Rn(c, hx + q * 6, hy - q * 8.6, q * 1.2, q * 2.6, 0, lit('#6a3a30', v)); Rn(c, hx + q * 1.2, hy - q * 3.2, q * 1.8, q * 1.8, 0, dusk ? '#ffd98a' : mix(p.bg, '#2a4a6a', 0.5)); Rn(c, hx + q * 5, hy - q * 3, q * 1.6, q * 3, 0, lit('#6a3a30', v)); if (dusk) glow(c, hx + q * 2.1, hy - q * 2.3, q * 8, '#ffd98a', 0.4);
    K.smoke(c, hx + q * 6.6, hy - q * 9, q * 2.4, t);
    lawn(c, W, H, hz, grass, lit(mix(p.paper, '#d9b88a', 0.5), v), u, R0);
    /* a split-rail fence along the back of the lawn, a gap where the path goes through */
    var fc = lit('#8a6a4a', v), fy0 = hz + q * 3.4; for (i = 0; i <= 12; i++) { var px = i / 12 * W; if (i === 6) continue; Rn(c, px - q * 0.5, fy0 - q * 4, q * 1, q * 4.6, q * 0.3, shade(fc, -0.15)); if (i < 12 && i !== 5) { quad(c, px, fy0 - q * 3.2, px + W / 12, fy0 - q * 3.4, px + W / 12, fy0 - q * 2.7, px, fy0 - q * 2.5, fc); quad(c, px, fy0 - q * 1.6, px + W / 12, fy0 - q * 1.4, px + W / 12, fy0 - q * 0.7, px, fy0 - q * 0.9, fc); } }
    /* mid trees, each its own colour, with pools of fallen leaves */
    var ts = [[0.3, 5, 30, gd, 31], [0.74, 4, 27, rd, 32], [0.93, 8, 34, or, 33]];
    for (i = 0; i < 3; i++) { var a = ts[i]; el(c, W * a[0], hz + q * (a[1] + 0.5), q * a[2] * 0.36, q * 1.5, alpha(a[3], 0.55)); tree(c, W * a[0], hz + q * a[1], q * a[2], a[3], bark, t, a[4], 30, shade(a[3], 0.3)); }
    bench(c, W * 0.67, hz + q * 11, u * 13, u, lit(mix('#6a8a5a', p.accent2, 0.3), v));
    lampPost(c, W * 0.36, hz + q * 13, q * 25, u * 0.9, lit('#2f2f3a', v), '#ffd98a', dusk ? 1 : 0);
    for (i = 0; i < 70; i++) { var sx = R0() * W, sy = hz + u * 2 + R0() * (H - hz - u * 2), ss = u * (0.8 + (sy - hz) / (H - hz) * 1.8); leaf(c, sx, sy, ss, R0() * TAU, lc[i % 4]); }
    /* the near maple: trunk at the left edge, its crown a roof over the top */
    var sw = Math.sin(t * 0.6) * u * 0.5, tb = shade(bark, -0.2);
    c.beginPath(); c.moveTo(-u * 2, H * 0.9); c.quadraticCurveTo(u * 10, H * 0.6, u * 4, H * 0.24); c.lineTo(-u * 2, H * 0.2); c.closePath(); c.fillStyle = tb; c.fill(); el(c, u * 2, H * 0.89, u * 10, u * 2.4, tb);
    c.lineCap = 'round'; c.strokeStyle = tb; c.lineWidth = u * 2.4; c.beginPath(); c.moveTo(u * 3, H * 0.3); c.quadraticCurveTo(W * 0.14, H * 0.2, W * 0.32, H * 0.13); c.moveTo(u * 3, H * 0.36); c.quadraticCurveTo(W * 0.1, H * 0.3, W * 0.2, H * 0.3); c.stroke();
    var R1 = rnd(o.seed + 'cr'), cr = [[-0.02, 0.0, 30], [0.2, -0.02, 26], [0.42, 0.0, 20], [0.08, 0.12, 20], [0.3, 0.09, 16], [0.04, 0.22, 13], [0.19, 0.2, 12], [0.58, -0.01, 12], [1.0, -0.01, 26], [0.82, 0.0, 17], [0.97, 0.13, 15], [1.0, 0.22, 10]];
    for (i = 0; i < cr.length; i++) { var cxp = W * cr[i][0] + (cr[i][0] > 0.5 ? -sw : sw), cyp = H * cr[i][1], rr = u * cr[i][2] * 0.62, col = [or, rd, gd][i % 3]; el(c, cxp, cyp, rr * 1.2, rr * 0.9, i % 2 ? col : shade(col, -0.12)); el(c, cxp - rr * 0.25, cyp - rr * 0.25, rr * 0.6, rr * 0.4, shade(col, 0.16));
      for (j = 0; j < 7; j++) { var an = R1() * TAU, dd = 0.5 + R1() * 0.6; leaf(c, cxp + Math.cos(an) * rr * 1.2 * dd, cyp + Math.sin(an) * rr * 0.9 * dd, u * (2.6 + R1() * 1.6), an + 0.4, lc[(i + j) % 3]); } }
    leafHeap(c, W * 0.9, H * 0.985, u * 15, u * 7, lc, 1, u); leafHeap(c, W * 0.16, H * 0.99, u * 12, u * 5, lc, 2, u);
    for (i = 0; i < 14; i++) { var lx = frac(R0() + t * 0.01 + Math.sin(t * 0.5 + i) * 0.04) * W, ly = frac(R0() + t * (0.035 + R0() * 0.03)) * H; leaf(c, lx, ly, u * (2 + R0() * 1.4), R0() * 6 + t * (0.8 + R0()) * (i % 2 ? 1 : -1), lc[i % 3]); }
    if (dusk) vignette(c, W, H, '#2a1430', 0.3);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- rainystreet: shopfronts shining on wet cobbles, rain coming down ---------- */
  Art.add('backdrop', 'rainystreet', function (c, W, H, t, p, o, u) {
    var i, j, v = o.variant, night = v === 'night', R0 = rnd(o.seed + 'rs'), q = Math.min(u, H / 150), hz = H * 0.64, kerb = hz + q * 3.4, warm = '#ffd58a';
    if (night) vgrad(c, W, H, [mix(p.bg, '#060a20', 0.65), mix(p.bg, '#1a2046', 0.55), mix(p.bg2, '#3a3a66', 0.6)], 0, hz); else vgrad(c, W, H, [mix(p.bg, '#3a3f66', 0.55), mix(p.bg2, '#8a7a9a', 0.5), mix(p.bg2, '#f0a888', 0.5)], 0, hz);
    c.fillStyle = alpha(night ? '#2a2f52' : '#5a5878', 0.5); for (i = 0; i < 7; i++) { var cw = u * (22 + R0() * 22), cx = frac(R0() + t * 0.004 * (1 + i * 0.2)) * (W + cw * 2) - cw; c.beginPath(); c.ellipse(cx, H * (0.02 + R0() * 0.16), cw, u * (3 + R0() * 3), 0, 0, TAU); c.fill(); }
    /* far roofs, then the row of houses: tall at the sides, low in the middle */
    c.fillStyle = mix(night ? '#1c2244' : '#5a5a80', p.bg, 0.3); for (i = 0; i < 12; i++) { var fw = W / 12, fh = q * (14 + R0() * 16); c.fillRect(i * fw, hz - fh, fw + 1, fh); if (i % 3 === 0) Pg(c, [[i * fw, hz - fh], [i * fw + fw / 2, hz - fh - q * 4], [i * fw + fw, hz - fh]], c.fillStyle, true); }
    var x = -u * 2, n = 0, wet = mix(night ? '#10142c' : '#2c2a48', p.bg, 0.25), awn = [p.accent, p.accent2, p.gold, mix(p.accent, '#ffffff', 0.4)], refl = [];
    while (x < W) {
      var bw = u * (15 + R0() * 8), e = Math.abs((x + bw / 2) / W - 0.5) * 2, bh = q * (20 + e * e * 46 + R0() * 9), bc = mix(mix(['#8a6a72', '#6a7a92', '#9a8266', '#7a6a8a', '#688a84'][n % 5], p.bg2, 0.25), night ? '#10143a' : '#3a2f56', night ? 0.55 : 0.3), top = hz - bh;
      Rn(c, x, top, bw, bh + 1, 0, bc); Rn(c, x, top, bw * 0.12, bh, 0, 'rgba(0,0,0,0.12)');
      if (n % 2) Pg(c, [[x - u * 0.6, top], [x + bw / 2, top - bw * 0.36], [x + bw + u * 0.6, top]], shade(bc, -0.25), true); else { Rn(c, x - u * 0.5, top - u * 1, bw + u, u * 1.6, 0, shade(bc, -0.2)); Rn(c, x + bw * 0.62, top - u * 5, u * 2.4, u * 4.2, 0, shade(bc, -0.3)); }
      var rows = Math.floor((bh - q * 13) / (q * 7)), wc = 3;
      for (j = 0; j < rows; j++) for (i = 0; i < wc; i++) { var on = R0() < 0.55, wx = x + bw * (0.14 + i * 0.27), wy = top + q * 3 + j * q * 7; Rn(c, wx, wy, bw * 0.18, q * 4.2, bw * 0.03, on ? alpha(i % 2 ? warm : '#ffe9b8', 0.8 + 0.15 * Math.sin(t * 2 + n + i + j)) : shade(bc, -0.22)); if (on) Rn(c, wx + bw * 0.08, wy, bw * 0.02, q * 4.2, 0, shade(bc, -0.1)); Rn(c, wx - bw * 0.02, wy + q * 4.2, bw * 0.22, q * 0.6, 0, shade(bc, 0.14)); }
      /* the shop at street level: a wide lit window, a door, a striped awning */
      var sh = q * 9, ac = awn[n % 4], sy = hz - sh; Rn(c, x + bw * 0.08, sy, bw * 0.56, sh - q * 1.6, u * 0.4, '#ffe2a0'); Rn(c, x + bw * 0.08, sy + sh * 0.5, bw * 0.56, sh * 0.5 - q * 1.6, 0, 'rgba(255,170,80,0.35)'); Rn(c, x + bw * 0.7, sy + q * 0.6, bw * 0.2, sh - q * 0.6, u * 0.4, shade(ac, -0.35)); Rn(c, x + bw * 0.74, sy + q * 1.6, bw * 0.12, q * 3, u * 0.3, '#ffd58a');
      for (i = 0; i < 3; i++) dot(c, x + bw * (0.2 + i * 0.17), hz - q * 3.4, q * 1.3, shade(awn[(n + i + 1) % 4], -0.1));
      for (i = 0; i < 6; i++) quad(c, x + bw * i / 6, sy - q * 2.6, x + bw * (i + 1) / 6 + 0.5, sy - q * 2.6, x + bw * (i + 1) / 6 + 0.5, sy + q * 0.6, x + bw * i / 6, sy + q * 0.6, i % 2 ? ac : p.paper);
      c.fillStyle = i % 2 ? ac : p.paper; c.beginPath(); for (i = 0; i < 6; i++) { c.moveTo(x + bw * i / 6, sy + q * 0.5); c.arc(x + bw * (i + 0.5) / 6, sy + q * 0.5, bw / 12, 0, PI); } c.fillStyle = shade(ac, -0.12); c.fill();
      glow(c, x + bw * 0.36, hz - q * 3, bw * 0.9, warm, 0.26); refl.push([x + bw * 0.08, bw * 0.56, ac, bc, x, bw]);
      x += bw + u * 0.5; n++;
    }
    /* pavement, kerb and the wet road with everything shining back out of it */
    Rn(c, 0, hz, W, kerb - hz, 0, mix(wet, '#8a8aa0', 0.35)); c.fillStyle = 'rgba(0,0,0,0.18)'; for (i = 0; i < 18; i++) c.fillRect(i / 18 * W, hz, u * 0.25, kerb - hz - q * 0.8); Rn(c, 0, kerb - q * 0.9, W, q * 0.9, 0, mix(wet, '#b0b0c8', 0.4));
    var g = c.createLinearGradient(0, kerb, 0, H); g.addColorStop(0, shade(wet, 0.12)); g.addColorStop(1, shade(wet, -0.35)); c.fillStyle = g; c.fillRect(0, kerb, W, H - kerb);
    for (i = 0; i < refl.length; i++) { var r = refl[i], g2 = c.createLinearGradient(0, kerb, 0, kerb + (H - kerb) * 0.8); g2.addColorStop(0, alpha(warm, 0.5)); g2.addColorStop(1, alpha(warm, 0)); c.fillStyle = g2; c.fillRect(r[0] + Math.sin(t * 1.4 + i) * u * 0.3, kerb, r[1], (H - kerb) * 0.8);
      var g3 = c.createLinearGradient(0, kerb, 0, kerb + (H - kerb) * 0.4); g3.addColorStop(0, alpha(r[2], 0.3)); g3.addColorStop(1, alpha(r[2], 0)); c.fillStyle = g3; c.fillRect(r[4], kerb, r[5], (H - kerb) * 0.4); }
    c.fillStyle = alpha(wet, 0.55); for (j = 0; j < 9; j++) { var f = (j + 1) / 10, yy = kerb + (H - kerb) * f * f; c.fillRect(0, yy, W, Math.max(1, u * 0.25 * (1 + f))); } /* ripple bands break the reflections */
    c.strokeStyle = alpha('#000000', 0.16); c.lineWidth = Math.max(0.6, u * 0.2); c.beginPath(); for (j = 1; j < 7; j++) { var f2 = j / 7, y2 = kerb + (H - kerb) * f2 * f2, m = Math.round(8 + (1 - f2) * 10); for (i = 0; i < m; i++) { var cx2 = (i + (j % 2) * 0.5) / m * W; c.moveTo(cx2, y2); c.quadraticCurveTo(cx2 + W / m / 2, y2 - u * (0.6 + f2), cx2 + W / m, y2); } } c.stroke(); /* cobbles */
    /* lamp posts, their light a long streak in the road */
    for (i = 0; i < 2; i++) { var lx = W * (i ? 0.79 : 0.21), g4 = c.createLinearGradient(0, kerb, 0, H); g4.addColorStop(0, alpha('#fff0c0', 0.5)); g4.addColorStop(1, alpha('#fff0c0', 0)); c.fillStyle = g4; c.fillRect(lx - u * 2.2 + Math.sin(t * 1.7 + i) * u * 0.3, kerb, u * 4.4, H - kerb); lampPost(c, lx, kerb - q * 0.4, q * 30, u * 0.95, mix('#1c1c2c', p.bg, 0.2), '#ffe0a0', 1); }
    for (i = 0; i < 9; i++) { var pf = frac(t * 0.5 + R0()), rx = R0() * W, ry = kerb + u * 2 + R0() * (H - kerb - u * 3), rr = u * (1 + pf * 5) * (0.5 + (ry - kerb) / (H - kerb)); c.beginPath(); c.ellipse(rx, ry, rr, rr * 0.3, 0, 0, TAU); c.lineWidth = u * 0.22; c.strokeStyle = alpha('#ffffff', 0.4 * (1 - pf)); c.stroke(); }
    /* the rain */
    c.lineCap = 'round'; for (j = 0; j < 2; j++) { c.strokeStyle = alpha('#dfe8ff', j ? 0.42 : 0.22); c.lineWidth = u * (j ? 0.3 : 0.18); c.beginPath(); for (i = 0; i < 60; i++) { var dx = frac(R0() + t * 0.05) * (W + u * 20) - u * 10, dy = frac(R0() + t * (0.9 + R0() * 0.5 + j * 0.3)) * (H + u * 20) - u * 10, dl = u * (3 + j * 3 + R0() * 2); c.moveTo(dx, dy); c.lineTo(dx - dl * 0.22, dy + dl); } c.stroke(); }
    vignette(c, W, H, '#05061a', night ? 0.45 : 0.3);
  }, { variants: ['dusk', 'night'], stage: 'band-low' });

  /* ---------- lanternstreet: a festive street at night, hung from end to end with round red lanterns ----------
     A place for Lunar New Year: the lanterns are plain (no characters), the houses are any old town's. */
  function roundLantern(c, x, y, r, col, gold, sw, k) { /* hangs from (x, y) */
    var cy = y + r * 1.3;
    if (r > 6) glow(c, x, cy, r * 3.4, '#ff9a4a', 0.26 + 0.14 * k); else dot(c, x, cy, r * 2.2, alpha('#ff9a4a', 0.16 + 0.1 * k));
    L(c, x, y, x, cy - r * 0.95, Math.max(0.6, r * 0.08), shade(gold, -0.35));
    el(c, x, cy, r * 1.14, r, shade(col, -0.12)); el(c, x, cy, r * 0.8, r, col); el(c, x, cy, r * 0.4, r, mix(col, '#ffb060', 0.3 + 0.2 * k));
    el(c, x - r * 0.55, cy - r * 0.3, r * 0.16, r * 0.42, 'rgba(255,230,180,0.4)', 0.35);
    Rn(c, x - r * 0.5, cy - r * 1.1, r, r * 0.22, r * 0.06, gold); Rn(c, x - r * 0.42, cy + r * 0.9, r * 0.84, r * 0.2, r * 0.06, gold);
    L(c, x, cy + r * 1.1, x + sw * 0.4, cy + r * 1.45, Math.max(0.6, r * 0.08), gold); dot(c, x + sw * 0.4, cy + r * 1.5, r * 0.15, gold);
    Pg(c, [[x + sw * 0.4 - r * 0.13, cy + r * 1.55], [x + sw * 0.4 + r * 0.13, cy + r * 1.55], [x + sw + r * 0.2, cy + r * 2.5], [x + sw - r * 0.2, cy + r * 2.5]], mix(gold, col, 0.25), true);
  }
  Art.add('backdrop', 'lanternstreet', function (c, W, H, t, p, o, u) {
    var i, j, s, k, R0 = rnd(o.seed + 'ls'), q = Math.min(u, H / 150), hz = H * 0.62, kb = Math.exp(-5 * o.beat), red = mix('#d8261c', p.accent, 0.3), gold = mix('#f4c542', p.gold, 0.5), warm = '#ffd58a';
    /* a point on a side wall: f = depth 0 (near) .. 1 (far end), y0 = its height where the wall meets the edge of the picture */
    function X(sd, f) { return sd ? W - f * W * 0.44 : f * W * 0.44; }
    function Y(f, y0) { return hz + (y0 - hz) * (1 - f * 0.94); }
    function wq(sd, f1, f2, ya, yb, col) { quad(c, X(sd, f1), Y(f1, ya), X(sd, f2), Y(f2, ya), X(sd, f2), Y(f2, yb), X(sd, f1), Y(f1, yb), col); }
    skyOf(c, W, H, p, 'night', hz); skyStars(c, W, H, 60, o.seed, t, hz * 0.8, '#fff4e0'); K.moonDisc(c, W * 0.6, H * 0.075, u * 4.2, '#fff3d0');
    for (i = 0; i < 3; i++) { var per = 3 + i * 0.6, ph = t / per + i * 0.4, cyc = Math.floor(ph), ff = ph - cyc, R1 = rnd(o.seed + 'fw' + i + '.' + (cyc % 41)), bx = W * (0.38 + R1() * 0.24), by = H * (0.2 + R1() * 0.2); K.burst(c, bx, by, u * (6 + R1() * 5), ff, [gold, red, '#ffe9c0'][(i + cyc) % 3], 12, u * 0.35); }
    /* the far end of the street: roofs and a warm haze */
    c.fillStyle = mix('#2a1c30', p.bg, 0.4); for (i = 0; i < 5; i++) { var fw = W * 0.034, fh = q * (5 + R0() * 7), fx = W * 0.415 + i * fw; c.fillRect(fx, hz - fh, fw + 1, fh + q); Pg(c, [[fx - q * 0.4, hz - fh], [fx + fw / 2, hz - fh - q * 2], [fx + fw + q * 0.4, hz - fh]], c.fillStyle, true); for (j = 0; j < 3; j++) Rn(c, fx + fw * (0.2 + j * 0.25), hz - fh * 0.7, fw * 0.14, q * 1.2, 0, alpha(warm, 0.8)); }
    glow(c, W / 2, hz, W * 0.42, '#ff9a5a', 0.5);
    /* the street */
    var st = mix('#3a2a32', p.bg, 0.35), g = c.createLinearGradient(0, hz, 0, H); g.addColorStop(0, mix(st, '#ff9a5a', 0.3)); g.addColorStop(0.3, st); g.addColorStop(1, shade(st, -0.35)); c.fillStyle = g; c.fillRect(0, hz, W, H - hz);
    c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = Math.max(0.6, u * 0.2); c.beginPath(); for (i = -9; i <= 9; i++) { c.moveTo(W / 2 + i * W * 0.012, hz); c.lineTo(W / 2 + i * W * 0.22, H); } for (j = 1; j < 9; j++) { var yy = hz + (H - hz) * Math.pow(j / 9, 1.8); c.moveTo(0, yy); c.lineTo(W, yy); } c.stroke();
    for (i = 0; i < 6; i++) el(c, W * (0.1 + R0() * 0.8), hz + (H - hz) * (0.15 + R0() * 0.8), u * (9 + R0() * 9), u * (1.5 + R0() * 1.5), alpha(red, 0.1));
    /* the houses down both sides, near to far */
    var fs = [-0.12, 0.3, 0.56, 0.75, 0.89, 1], tops = [0.03, 0.13, 0.07, 0.16, 0.12], base = H * 0.745, wcol = ['#7a4a3c', '#5c4a5e', '#8a5c3e', '#4c4c66', '#74483e'], aw = [red, gold, mix(red, '#7a1430', 0.4), mix(p.accent2, '#1c5a4a', 0.4), red];
    for (s = 0; s < 2; s++) for (i = 4; i >= 0; i--) {
      var f1 = fs[i], f2 = fs[i + 1], ty = H * tops[(i + s * 2) % 5], wc = mix(mix(wcol[(i + s * 3) % 5], p.bg, 0.3), '#120c26', 0.3 + i * 0.03), df = f2 - f1;
      wq(s, f1, f2, ty, base, wc); wq(s, f1, f2, H * 0.56, base, shade(wc, -0.18));
      wq(s, f1 - 0.02, f2, ty - H * 0.012, ty + H * 0.02, mix('#3a2a36', p.bg, 0.3)); wq(s, f1 - 0.02, f2, ty + H * 0.02, ty + H * 0.028, gold); /* the eave */
      wq(s, f2 - df * 0.05, f2, ty, base, 'rgba(0,0,0,0.22)');
      for (j = 0; j < 2; j++) for (k = 0; k < 2; k++) { var wa = f1 + df * (0.14 + k * 0.42), wb = wa + df * 0.26, y0 = H * (0.2 + j * 0.16), on = R0() < 0.7; if (y0 < ty + H * 0.05) continue; wq(s, wa - df * 0.02, wb + df * 0.02, y0 - H * 0.008, y0 + H * 0.098, shade(wc, -0.3)); wq(s, wa, wb, y0, y0 + H * 0.09, on ? alpha(k ? warm : '#ffe6b0', 0.82 + 0.12 * Math.sin(t * 2 + i + j + k)) : shade(wc, -0.12)); if (on) wq(s, (wa + wb) / 2 - df * 0.01, (wa + wb) / 2 + df * 0.01, y0, y0 + H * 0.09, shade(wc, -0.3)); wq(s, wa - df * 0.04, wb + df * 0.04, y0 + H * 0.094, y0 + H * 0.104, shade(wc, 0.15)); }
      wq(s, f1 + df * 0.1, f1 + df * 0.62, H * 0.6, base - H * 0.012, alpha('#ffdf9a', 0.92)); wq(s, f1 + df * 0.1, f1 + df * 0.62, H * 0.67, base - H * 0.012, 'rgba(255,150,70,0.4)'); wq(s, f1 + df * 0.72, f1 + df * 0.92, H * 0.6, base, shade(aw[i], -0.45)); /* shop window and door */
      wq(s, f1, f2, H * 0.545, H * 0.585, aw[(i + s) % 5]); wq(s, f1, f2, H * 0.585, H * 0.594, shade(aw[(i + s) % 5], -0.25));
      for (k = 0; k < 3; k++) { var lf = f1 + df * (0.14 + k * 0.36), lr = u * 2.3 * (1 - lf * 0.9); if (lf < 0) continue; roundLantern(c, X(s, lf), Y(lf, ty + H * 0.03), lr, red, gold, Math.sin(t * 1.3 + i + k + s) * lr * 0.3, (k + i + o.n) % 2 ? kb : 0); }
      el(c, X(s, f1 + df * 0.4), Y(f1 + df * 0.4, base) + u, W * 0.1 * (1 - f1 * 0.8), u * 2 * (1 - f1 * 0.7), alpha(warm, 0.14));
    }
    /* scraps of red paper on the stones */
    for (i = 0; i < 70; i++) { var px = R0() * W, py = hz + u * 2 + Math.pow(R0(), 0.7) * (H - hz - u * 2), ps = u * (0.25 + (py - hz) / (H - hz) * 0.7); c.save(); c.translate(px, py); c.rotate(R0() * 3); c.fillStyle = i % 5 === 0 ? gold : i % 2 ? red : shade(red, -0.2); c.fillRect(-ps, -ps * 0.4, ps * 2, ps * 0.8); c.restore(); }
    /* strings of lanterns from house to house, far to near */
    var sf = [0.9, 0.76, 0.58, 0.34, 0.04], sy = [0.2, 0.14, 0.22, 0.12, 0.085];
    for (j = 0; j < 5; j++) { var f = sf[j], x1 = X(0, f), x2 = X(1, f), y1 = Y(f, H * sy[j]), sc = 1 - f * 0.9, sag = u * 7 * sc + Math.sin(t * 0.7 + j) * u * 0.4 * sc, n = [3, 3, 5, 5, 6][j], r = u * 5 * sc + u * 0.5;
      c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(W / 2, y1 + sag * 2, x2, y1); c.lineWidth = Math.max(0.6, u * 0.35 * sc); c.strokeStyle = mix('#2a1c24', p.bg, 0.2); c.stroke();
      for (i = 0; i < n; i++) { var a = (i + 0.5) / n, lx = x1 + (x2 - x1) * a, ly = y1 + sag * 4 * a * (1 - a); if (j === 4 && (i === 2 || i === 3)) r = u * 4; else if (j === 4) r = u * 5.5; roundLantern(c, lx, ly, r, i % 3 === 1 ? shade(red, 0.06) : red, gold, Math.sin(t * 1.2 + i * 1.7 + j) * r * 0.35, (i + j + o.n) % 2 ? kb : 0.25); }
    }
    vignette(c, W, H, '#0a0418', 0.42);
  }, { variants: ['night'], stage: 'band-low', pal: 'dark' });

  /* ---------- courtyard: an arcade of pointed arches round a tiled court, a thin crescent moon above ----------
     A place for Eid evenings. Generic architecture, patterns of plain geometry, no lettering; the moon is the sky's. */
  function pArch(c, x, y, w, h) { /* a pointed arch standing on y + h, its tip at (x, y) */
    c.beginPath(); c.moveTo(x - w / 2, y + h); c.lineTo(x - w / 2, y + h * 0.42); c.bezierCurveTo(x - w * 0.56, y + h * 0.2, x - w * 0.22, y + h * 0.08, x, y); c.bezierCurveTo(x + w * 0.22, y + h * 0.08, x + w * 0.56, y + h * 0.2, x + w / 2, y + h * 0.42); c.lineTo(x + w / 2, y + h); c.closePath();
  }
  function hangLamp(c, x, y, len, s, metal, glass, t, ph) { /* a pierced metal lamp on a chain from (x, y) */
    var sw = Math.sin(t * 0.8 + ph) * s * 0.25, cx = x + sw, cy = y + len, f = 0.85 + 0.15 * Math.sin(t * 5 + ph), i;
    L(c, x, y, cx, cy - s * 1.9, Math.max(0.6, s * 0.1), metal); glow(c, cx, cy, s * 6, '#ffc970', 0.34 * f);
    Pg(c, [[cx, cy - s * 2.1], [cx + s * 0.5, cy - s * 1.3], [cx - s * 0.5, cy - s * 1.3]], metal, true); dot(c, cx, cy - s * 2.1, s * 0.22, metal);
    Pg(c, [[cx - s * 0.55, cy - s * 1.3], [cx + s * 0.55, cy - s * 1.3], [cx + s * 1, cy - s * 0.3], [cx + s * 0.6, cy + s * 1.2], [cx - s * 0.6, cy + s * 1.2], [cx - s * 1, cy - s * 0.3]], glass, true);
    Pg(c, [[cx - s * 0.2, cy - s * 1.3], [cx + s * 0.2, cy - s * 1.3], [cx + s * 0.36, cy - s * 0.3], [cx + s * 0.22, cy + s * 1.2], [cx - s * 0.22, cy + s * 1.2], [cx - s * 0.36, cy - s * 0.3]], mix(glass, '#fff6d0', 0.6), true);
    c.strokeStyle = metal; c.lineWidth = Math.max(0.6, s * 0.12); c.beginPath(); c.moveTo(cx - s * 0.55, cy - s * 1.3); c.lineTo(cx - s * 1, cy - s * 0.3); c.lineTo(cx - s * 0.6, cy + s * 1.2); c.lineTo(cx + s * 0.6, cy + s * 1.2); c.lineTo(cx + s * 1, cy - s * 0.3); c.lineTo(cx + s * 0.55, cy - s * 1.3); c.closePath(); c.moveTo(cx - s * 1, cy - s * 0.3); c.lineTo(cx + s * 1, cy - s * 0.3); for (i = -1; i <= 1; i += 2) { c.moveTo(cx + i * s * 0.2, cy - s * 1.3); c.lineTo(cx + i * s * 0.36, cy - s * 0.3); c.lineTo(cx + i * s * 0.22, cy + s * 1.2); } c.stroke();
    Pg(c, [[cx - s * 0.6, cy + s * 1.2], [cx + s * 0.6, cy + s * 1.2], [cx, cy + s * 1.9]], metal, true); dot(c, cx, cy + s * 2.1, s * 0.2, metal);
  }
  function potTree(c, x, y, s, pot, grn, t, ph) { /* a clay pot with a small round tree, base centre at (x, y) */
    var sw = Math.sin(t * 0.7 + ph) * s * 0.02, i, R0 = rnd('pt' + ph);
    Rn(c, x - s * 0.04, y - s * 1.3, s * 0.08, s * 0.9, 0, mix(pot, '#3a2418', 0.6));
    el(c, x + sw, y - s * 1.55, s * 0.5, s * 0.46, shade(grn, -0.15)); el(c, x - s * 0.1 + sw, y - s * 1.62, s * 0.4, s * 0.36, grn); el(c, x - s * 0.2 + sw, y - s * 1.74, s * 0.18, s * 0.13, shade(grn, 0.2));
    for (i = 0; i < 6; i++) dot(c, x + sw + (R0() - 0.5) * s * 0.7, y - s * 1.55 + (R0() - 0.5) * s * 0.6, s * 0.06, '#f2a03a');
    Pg(c, [[x - s * 0.34, y - s * 0.5], [x + s * 0.34, y - s * 0.5], [x + s * 0.22, y], [x - s * 0.22, y]], pot, true); Rn(c, x - s * 0.38, y - s * 0.56, s * 0.76, s * 0.13, s * 0.04, shade(pot, 0.12)); Rn(c, x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.06, 0, shade(pot, -0.2)); el(c, x - s * 0.16, y - s * 0.24, s * 0.05, s * 0.18, 'rgba(255,255,255,0.18)');
  }
  Art.add('backdrop', 'courtyard', function (c, W, H, t, p, o, u) {
    var i, j, s, v = o.variant, night = v === 'night', R0 = rnd(o.seed + 'cy'), q = Math.min(u, H / 150), fl = H * 0.66, wt = H * 0.33;
    var stone = lit(mix('#e8c9a0', p.bg2, 0.3), night ? 'night' : 'dusk'), st2 = shade(stone, -0.14), tile = lit(mix('#2f8f94', p.accent2, 0.5), v), tile2 = lit(p.gold, night ? 'dusk' : 'day'), metal = mix('#3a2a20', p.ink, 0.3), deepSky = night ? mix(p.bg, '#0a1238', 0.5) : mix(p.bg, '#3a2f74', 0.4);
    skyOf(c, W, H, p, v, wt + q * 6);
    skyStars(c, W, H, night ? 70 : 28, o.seed, t, wt, '#fff6e0');
    /* the thin new moon */
    var mx = W * 0.72, my = H * 0.105, mr = u * 6.5; glow(c, mx, my, mr * 4, '#fff3c8', 0.3); c.save(); c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.clip(); c.beginPath(); c.rect(mx - mr * 2, my - mr * 2, mr * 4, mr * 4); c.arc(mx + mr * 0.42, my - mr * 0.12, mr * 0.86, 0, TAU, true); c.fillStyle = '#fff6d8'; c.fill('evenodd'); c.restore();
    c.fillStyle = alpha(night ? '#3a3a70' : mix(p.bg2, '#e08a8a', 0.5), 0.4); for (i = 0; i < 3; i++) { c.beginPath(); c.ellipse(W * (0.15 + i * 0.3) + Math.sin(t * 0.05 + i) * u * 3, H * (0.2 + (i % 2) * 0.06), u * (20 + i * 5), u * 1.2, 0, 0, TAU); c.fill(); }
    /* beyond the wall: flat roofs and palms against the last light */
    var sil = mix(deepSky, '#1a1230', 0.5);
    for (i = 0; i < 8; i++) { var rx = i / 8 * W, rw = W / 8 + 1, rh = q * (4 + R0() * 9); if (i > 2 && i < 5) rh *= 0.5; Rn(c, rx, wt - rh, rw, rh + q, 0, sil); if (i % 2) for (j = 0; j < 2; j++) Rn(c, rx + rw * (0.25 + j * 0.35), wt - rh * 0.7, rw * 0.12, q * 1.4, 0, alpha('#ffd58a', 0.75)); }
    for (i = 0; i < 4; i++) { var px = W * [0.08, 0.3, 0.64, 0.93][i], ph2 = q * (17 + (i % 2) * 6), sw = Math.sin(t * 0.6 + i) * 0.04; L(c, px, wt, px + q * 0.6, wt - ph2, q * 0.9, sil); for (j = 0; j < 7; j++) { var an = -PI / 2 + (j - 3) * 0.5 + sw; c.beginPath(); c.moveTo(px + q * 0.6, wt - ph2); c.quadraticCurveTo(px + q * 0.6 + Math.cos(an) * q * 5, wt - ph2 + Math.sin(an) * q * 5 - q * 1.5, px + q * 0.6 + Math.cos(an) * q * 8, wt - ph2 + Math.sin(an) * q * 6 + q * 2.5); c.lineWidth = q * 0.8; c.strokeStyle = sil; c.stroke(); } }
    /* the arcade: a wall of five pointed arches, the garden glowing through them */
    Rn(c, 0, wt, W, fl - wt, 0, stone); vgrad2(c, 0, wt, W, fl - wt, alpha('#000000', 0), alpha(night ? '#1a1040' : '#7a3a50', 0.22));
    for (i = 0; i * u * 5 < W + u * 5; i++) { Rn(c, i * u * 5 - u * 1.6, wt - u * 2.6, u * 3.2, u * 2.8, 0, stone); Pg(c, [[i * u * 5 - u * 1.6, wt - u * 2.6], [i * u * 5, wt - u * 4.4], [i * u * 5 + u * 1.6, wt - u * 2.6]], stone, true); }
    Rn(c, 0, wt + q * 1, W, q * 5, 0, tile); for (i = 0; i * q * 5 < W + q * 5; i++) { var tx = i * q * 5, ty = wt + q * 3.5; Pg(c, [[tx, ty - q * 2], [tx + q * 1.6, ty], [tx, ty + q * 2], [tx - q * 1.6, ty]], i % 2 ? tile2 : shade(tile, 0.35), true); dot(c, tx + q * 2.5, ty, q * 0.5, shade(tile, 0.4)); }
    Rn(c, 0, wt + q * 0.4, W, q * 0.7, 0, st2); Rn(c, 0, wt + q * 6, W, q * 0.7, 0, st2);
    var n = 5, aw = W / n, ah = fl - wt - q * 11, ay = wt + q * 11;
    for (i = 0; i < n; i++) { var ax = (i + 0.5) * aw, w = aw * 0.7;
      pArch(c, ax, ay - q * 1.5, w + q * 3, ah + q * 1.5); c.fillStyle = st2; c.fill();
      pArch(c, ax, ay, w, ah); var g = c.createLinearGradient(0, ay, 0, fl); g.addColorStop(0, deepSky); g.addColorStop(0.6, mix(deepSky, night ? '#5a4a8a' : '#e08a7a', 0.5)); g.addColorStop(1, mix(deepSky, '#ffb870', 0.6)); c.fillStyle = g; c.fill();
      c.save(); pArch(c, ax, ay, w, ah); c.clip();
      el(c, ax - w * 0.3, fl, w * 0.5, ah * 0.3, alpha(sil, 0.85)); el(c, ax + w * 0.35, fl + q, w * 0.4, ah * 0.22, alpha(sil, 0.7)); L(c, ax + w * 0.1, fl, ax + w * 0.12, fl - ah * 0.5, q * 0.7, sil); for (j = 0; j < 6; j++) { var a2 = -PI / 2 + (j - 2.5) * 0.55; L(c, ax + w * 0.12, fl - ah * 0.5, ax + w * 0.12 + Math.cos(a2) * q * 5, fl - ah * 0.5 + Math.sin(a2) * q * 3 + q * 2, q * 0.6, sil); }
      glow(c, ax, fl, w * 0.9, '#ffc070', 0.4); c.restore();
      /* stripes round the arch, a small hanging lamp inside */
      pArch(c, ax, ay, w, ah); c.setLineDash([q * 2.2, q * 2.2]); c.lineWidth = q * 1.3; c.strokeStyle = alpha(lit(p.accent, v), 0.6); c.stroke(); c.setLineDash([]);
      hangLamp(c, ax, ay + q * 1, ah * 0.2, q * 1.7, metal, lit(i % 2 ? p.accent : p.gold, 'dusk'), t, i);
    }
    for (i = 0; i <= n; i++) { var cx = i * aw, cw = aw * 0.13; Rn(c, cx - cw, ay + ah * 0.42, cw * 2, fl - ay - ah * 0.42, 0, shade(stone, 0.1)); Rn(c, cx - cw * 0.4, ay + ah * 0.42, cw * 0.5, fl - ay - ah * 0.42, 0, 'rgba(255,255,255,0.14)'); Rn(c, cx - cw * 1.4, ay + ah * 0.4, cw * 2.8, q * 1.6, q * 0.4, st2); Rn(c, cx - cw * 1.5, fl - q * 2, cw * 3, q * 2, q * 0.4, st2); Pg(c, [[cx, ay - q * 4.2], [cx + q * 1.5, ay - q * 2.4], [cx, ay - q * 0.6], [cx - q * 1.5, ay - q * 2.4]], tile, true); dot(c, cx, ay - q * 2.4, q * 0.6, tile2); }
    /* the court: diamond tiles running away, warm light pooled on them */
    var fc = lit(mix('#d9b48a', p.bg2, 0.3), v), g2 = c.createLinearGradient(0, fl, 0, H); g2.addColorStop(0, shade(fc, 0.1)); g2.addColorStop(1, shade(fc, -0.38)); c.fillStyle = g2; c.fillRect(0, fl, W, H - fl);
    var rows = 7; for (j = 0; j < rows; j++) { var f1 = Math.pow(j / rows, 1.6), f2 = Math.pow((j + 1) / rows, 1.6), y1 = fl + (H - fl) * f1, y2 = fl + (H - fl) * f2, ym = (y1 + y2) / 2, sp1 = W * (0.1 + f1 * 0.22), sp2 = W * (0.1 + f2 * 0.22), spm = (sp1 + sp2) / 2, m = Math.ceil(W / spm / 2) + 1;
      c.fillStyle = alpha(j % 2 ? tile : shade(tile, -0.15), 0.6); c.beginPath(); for (i = -m; i <= m; i++) { c.moveTo(W / 2 + i * sp1, y1); c.lineTo(W / 2 + (i + 0.5) * spm, ym); c.lineTo(W / 2 + i * sp2, y2); c.lineTo(W / 2 + (i - 0.5) * spm, ym); c.closePath(); } c.fill();
      c.fillStyle = alpha(tile2, 0.75); c.beginPath(); for (i = -m; i <= m; i++) { var dx = W / 2 + (i + 0.5) * sp1, dr = u * (0.35 + f1 * 0.8); c.moveTo(dx + dr, y1); c.ellipse(dx, y1, dr, dr * 0.5, 0, 0, TAU); } c.fill(); }
    Rn(c, 0, fl, W, q * 0.9, 0, shade(stone, 0.2)); Rn(c, 0, fl - q * 0.2, W, q * 0.5, 0, 'rgba(0,0,0,0.18)');
    for (i = 0; i < n; i++) el(c, (i + 0.5) * aw, fl + q * 3, aw * 0.36, q * 3, alpha('#ffc070', 0.18));
    /* potted orange trees by the pillars, two great lamps hanging in the top corners */
    potTree(c, W * 0.045, H * 0.92, u * 15, lit(mix('#c8703a', p.accent, 0.2), v), lit(mix('#3f8a55', p.accent2, 0.4), v), t, 1); potTree(c, W * 0.955, H * 0.92, u * 15, lit(mix('#c8703a', p.accent, 0.2), v), lit(mix('#3f8a55', p.accent2, 0.4), v), t, 2);
    potTree(c, W * 0.2, fl + q * 4, u * 7, lit('#b8683a', v), lit(mix('#3f8a55', p.accent2, 0.4), v), t, 3); potTree(c, W * 0.8, fl + q * 4, u * 7, lit('#b8683a', v), lit(mix('#3f8a55', p.accent2, 0.4), v), t, 4);
    hangLamp(c, W * 0.1, 0, H * 0.17, u * 4.2, metal, lit(p.accent, 'dusk'), t, 7); hangLamp(c, W * 0.9, 0, H * 0.2, u * 4.2, metal, lit(p.accent2, 'dusk'), t, 8); hangLamp(c, W * 0.26, 0, H * 0.075, u * 2.6, metal, lit(p.gold, 'dusk'), t, 9); hangLamp(c, W * 0.5, 0, H * 0.035, u * 2, metal, lit(p.gold, 'dusk'), t, 10);
    vignette(c, W, H, night ? '#06041c' : '#2a1238', night ? 0.42 : 0.28);
  }, { variants: ['dusk', 'night'], stage: 'band-low' });

  /* ---------- lightscourt: a house courtyard on a festival night, every ledge and step set with little oil lamps ----------
     A place for Diwali. The lamps are plain clay ones and the floor pattern plain geometry; garlands, rangoli and
     sweets are props. No figures, no lettering. */
  function oilLamp(c, x, y, s, clay, t, ph, big) { /* a small clay lamp, base centre at (x, y), flame at its lip */
    var fx = x + s * 0.95, fy = y - s * 0.66;
    if (big) glow(c, fx, fy - s * 0.5, s * 6, '#ffc060', 0.36 + 0.06 * Math.sin(t * 6 + ph)); else { dot(c, fx, fy - s * 0.4, s * 2.6, alpha('#ffc060', 0.07 + 0.02 * Math.sin(t * 6 + ph))); dot(c, fx, fy - s * 0.4, s * 1.5, alpha('#ffd080', 0.1)); }
    c.beginPath(); c.ellipse(x, y - s * 0.5, s, s * 0.6, 0, 0, PI); c.fillStyle = clay; c.fill(); Pg(c, [[x + s * 0.7, y - s * 0.52], [x + s * 1.4, y - s * 0.74], [x + s * 0.8, y - s * 0.2]], clay, true);
    el(c, x, y - s * 0.5, s, s * 0.22, shade(clay, 0.22)); el(c, x, y - s * 0.5, s * 0.74, s * 0.13, '#e8a838'); el(c, x - s * 0.4, y - s * 0.2, s * 0.14, s * 0.2, 'rgba(255,255,255,0.2)', 0.5);
    K.flame(c, fx, fy, s * 0.55, s * 1.35, t, ph);
  }
  Art.add('backdrop', 'lightscourt', function (c, W, H, t, p, o, u) {
    var i, j, s, R0 = rnd(o.seed + 'lc'), q = Math.min(u, H / 150), wt = H * 0.3, st = H * 0.615, fl = H * 0.675, kb = Math.exp(-5 * o.beat);
    var wall = mix(mix('#d98a5a', p.accent, 0.18), '#3a1a3a', 0.34), wall2 = shade(wall, -0.2), trim = mix(p.gold, '#7a4a1a', 0.3), clay = mix('#c8683a', p.accent, 0.12), stone = mix(mix('#b88a6a', p.bg2, 0.25), '#2a1a3a', 0.4), dark = mix('#1a0f2a', p.bg, 0.3);
    skyOf(c, W, H, p, 'night', wt + q * 4); skyStars(c, W, H, 70, o.seed, t, wt, '#fff4dc');
    for (i = 0; i < 3; i++) { var per = 3.2 + i * 0.7, ph = t / per + i * 0.37, cyc = Math.floor(ph), ff = ph - cyc, R1 = rnd(o.seed + 'fw' + i + '.' + (cyc % 43)), bx = W * (0.16 + R1() * 0.68), by = H * (0.07 + R1() * 0.14); K.burst(c, bx, by, u * (6 + R1() * 6), ff, [p.gold, p.accent, p.accent2][(i + cyc) % 3], 12, u * 0.35); }
    /* trees and a neighbour's roof behind the wall */
    for (i = 0; i < 2; i++) { var tx = i ? W * 0.86 : W * 0.12; L(c, tx, wt + q * 2, tx + (i ? -1 : 1) * q * 1.5, wt - q * 9, q * 1.6, dark); for (j = 0; j < 6; j++) el(c, tx + (R0() - 0.5) * q * 22 + Math.sin(t * 0.5 + j) * q * 0.3, wt - q * (8 + R0() * 11), q * (5 + R0() * 4), q * (3.4 + R0() * 2.4), j % 2 ? dark : mix(dark, '#2a4a3a', 0.3)); }
    Rn(c, W * 0.36, wt - q * 5, W * 0.3, q * 6, 0, dark); for (i = 0; i < 4; i++) Rn(c, W * (0.39 + i * 0.065), wt - q * 3.6, W * 0.022, q * 1.8, 0, alpha('#ffd58a', 0.7));
    /* the wall: a parapet lined with lamps, a tiled band, a door between four lamp niches */
    Rn(c, 0, wt, W, st - wt, 0, wall); vgrad2(c, 0, wt, W, st - wt, 'rgba(20,6,30,0.28)', 'rgba(255,170,80,0.16)');
    Rn(c, 0, wt - q * 1.6, W, q * 3, 0, shade(wall, 0.14)); Rn(c, 0, wt + q * 1.4, W, q * 0.7, 0, wall2);
    var nb = Math.max(9, Math.round(W / (u * 8.5))); for (i = 0; i < nb; i++) oilLamp(c, (i + 0.5) / nb * W - q * 0.6, wt - q * 1.5, q * 1.5, clay, t, i * 1.3, false);
    Rn(c, 0, wt + q * 6, W, q * 4.4, 0, wall2); for (i = 0; i * q * 6 < W + q * 6; i++) { var bx2 = i * q * 6, by2 = wt + q * 8.2, bc = [p.accent2, p.gold, p.accent][i % 3]; c.save(); c.translate(bx2, by2); c.rotate(PI / 4); Rn(c, -q * 1.25, -q * 1.25, q * 2.5, q * 2.5, 0, mix(bc, wall2, 0.25)); c.restore(); dot(c, bx2, by2, q * 0.6, p.paper); dot(c, bx2 + q * 3, by2, q * 0.45, trim); }
    var dw = Math.min(W * 0.26, u * 26), dh = (st - wt) * 0.62, dx = W / 2, dy = st - dh;
    K.archPath(c, dx - dw / 2 - q * 2, dy - q * 2, dw + q * 4, dh + q * 2); c.fillStyle = trim; c.fill(); K.archPath(c, dx - dw / 2, dy, dw, dh); c.fillStyle = mix('#5a2f1c', p.accent2, 0.25); c.fill();
    c.save(); K.archPath(c, dx - dw / 2, dy, dw, dh); c.clip(); Rn(c, dx - q * 0.4, dy, q * 0.8, dh, 0, 'rgba(0,0,0,0.4)'); for (j = 0; j < 4; j++) for (i = 0; i < 2; i++) { Rn(c, dx + (i ? q * 1.6 : -dw / 2 + q * 2), dy + dw * 0.5 + j * (dh - dw * 0.5) / 4 + q, dw / 2 - q * 3.6, (dh - dw * 0.5) / 4 - q * 2, q * 0.5, 'rgba(0,0,0,0.2)'); dot(c, dx + (i ? q * 1.6 : -dw / 2 + q * 2) + (dw / 2 - q * 3.6) / 2, dy + dw * 0.5 + (j + 0.5) * (dh - dw * 0.5) / 4, q * 0.7, trim); } c.restore();
    dot(c, dx - q * 2, st - dh * 0.4, q * 0.9, trim); dot(c, dx + q * 2, st - dh * 0.4, q * 0.9, trim);
    var nx = [0.1, 0.27, 0.73, 0.9], nw = Math.min(W * 0.1, u * 10), nh = nw * 1.5, ny = st - dh * 0.52 - nh / 2;
    for (i = 0; i < 4; i++) { var cx = W * nx[i]; K.archPath(c, cx - nw / 2 - q, ny - q, nw + q * 2, nh + q); c.fillStyle = shade(wall, 0.18); c.fill(); K.archPath(c, cx - nw / 2, ny, nw, nh); c.fillStyle = mix(wall2, '#2a0f24', 0.5); c.fill(); glow(c, cx, ny + nh * 0.6, nw * 1.5, '#ffb850', 0.5); Rn(c, cx - nw / 2 - q, ny + nh, nw + q * 2, q * 1.2, 0, shade(wall, 0.22)); oilLamp(c, cx - q * 0.8, ny + nh, q * 2.3, clay, t, i * 2.1, false); }
    /* strings of tiny lights falling down the wall, blinking with the beat */
    for (i = 0; i < 10; i++) { var sx = W * [0.03, 0.18, 0.35, 0.65, 0.82, 0.97, 0.185, 0.815, 0.345, 0.655][i], ln = (st - wt) * (i < 6 ? 0.3 + (i % 3) * 0.06 : 0.16), y0 = wt + q * 11; c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(sx - q * 0.12, y0, q * 0.24, ln); for (j = 0; j < 7; j++) { var on = (i + j + o.n) % 2 === 0, ly = y0 + (j + 0.5) / 7 * ln; if (on) dot(c, sx, ly, q * (1.5 + kb * 0.6), alpha('#ffd070', 0.3)); dot(c, sx, ly, q * 0.55, on ? '#fff0b0' : mix(p.gold, wall2, 0.4)); } }
    /* three steps across the foot of the wall, a row of lamps on each */
    for (j = 0; j < 3; j++) { var y1 = st + (fl - st) * j / 3, hh = (fl - st) / 3; Rn(c, 0, y1, W, hh + 1, 0, shade(stone, 0.16 - j * 0.07)); Rn(c, 0, y1, W, q * 0.6, 0, shade(stone, 0.34)); var m = Math.max(5, Math.round(W / (u * (15 - j * 2)))); for (i = 0; i < m; i++) { var lx = (i + (j % 2 ? 0.5 : 0.25)) / m * W; if (j < 2 && Math.abs(lx - dx) < dw * 0.42) continue; oilLamp(c, lx, y1 + hh * 0.85, q * (1.7 + j * 0.3), clay, t, i + j * 3, false); } }
    /* the court: stone flags, a round pattern laid in the middle of the floor, lamps set round it */
    var g = c.createLinearGradient(0, fl, 0, H); g.addColorStop(0, shade(stone, 0.06)); g.addColorStop(1, shade(stone, -0.4)); c.fillStyle = g; c.fillRect(0, fl, W, H - fl);
    c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = Math.max(0.6, u * 0.2); c.beginPath(); for (i = -8; i <= 8; i++) { c.moveTo(W / 2 + i * W * 0.085, fl); c.lineTo(W / 2 + i * W * 0.2, H); } for (j = 1; j < 6; j++) { var yy = fl + (H - fl) * Math.pow(j / 6, 1.5); c.moveTo(0, yy); c.lineTo(W, yy); } c.stroke();
    glow(c, W / 2, fl, W * 0.7, '#ffb050', 0.22);
    var pcx = W / 2, pcy = fl + (H - fl) * 0.63, pr = Math.min(W * 0.34, (H - fl) * 0.95), sq = 0.36, cols = [p.accent, p.gold, p.accent2, p.paper];
    c.save(); c.translate(pcx, pcy); c.scale(1, sq);
    dot(c, 0, 0, pr, alpha(cols[3], 0.9)); dot(c, 0, 0, pr * 0.95, mix(cols[0], '#3a0f2a', 0.25));
    for (i = 0; i < 16; i++) { c.save(); c.rotate(i / 16 * TAU); c.beginPath(); c.moveTo(pr * 0.5, 0); c.quadraticCurveTo(pr * 0.74, -pr * 0.15, pr * 0.92, 0); c.quadraticCurveTo(pr * 0.74, pr * 0.15, pr * 0.5, 0); c.fillStyle = i % 2 ? cols[1] : cols[3]; c.fill(); c.restore(); }
    dot(c, 0, 0, pr * 0.6, cols[3]); dot(c, 0, 0, pr * 0.56, cols[2]);
    for (i = 0; i < 8; i++) { c.save(); c.rotate((i + 0.5) / 8 * TAU); c.beginPath(); c.moveTo(pr * 0.1, 0); c.quadraticCurveTo(pr * 0.32, -pr * 0.17, pr * 0.54, 0); c.quadraticCurveTo(pr * 0.32, pr * 0.17, pr * 0.1, 0); c.fillStyle = i % 2 ? cols[0] : cols[1]; c.fill(); dot(c, pr * 0.34, 0, pr * 0.035, cols[3]); c.restore(); }
    dot(c, 0, 0, pr * 0.16, cols[3]); dot(c, 0, 0, pr * 0.11, cols[0]); c.fillStyle = cols[3]; c.beginPath(); for (i = 0; i < 32; i++) { var a = i / 32 * TAU; c.moveTo(Math.cos(a) * pr * 0.975 + pr * 0.014, Math.sin(a) * pr * 0.975); c.arc(Math.cos(a) * pr * 0.975, Math.sin(a) * pr * 0.975, pr * 0.014, 0, TAU); } c.fill();
    c.restore();
    for (i = 0; i < 12; i++) { var a2 = (i + 0.5) / 12 * TAU, lx2 = pcx + Math.cos(a2) * pr * 1.12, ly2 = pcy + Math.sin(a2) * pr * 1.12 * sq; if (Math.sin(a2) < 0) oilLamp(c, lx2, ly2 + u, u * (1.5 + Math.sin(a2) * 0.3), clay, t, i * 1.7, false); }
    for (i = 0; i < 12; i++) { var a3 = (i + 0.5) / 12 * TAU, lx3 = pcx + Math.cos(a3) * pr * 1.12, ly3 = pcy + Math.sin(a3) * pr * 1.12 * sq; if (Math.sin(a3) >= 0) oilLamp(c, lx3, ly3 + u, u * (1.6 + Math.sin(a3) * 0.5), clay, t, i * 1.7, false); }
    /* potted plants and big lamps at the near corners */
    for (s = 0; s < 2; s++) { var d = s ? -1 : 1, ox = s ? W : 0, grn = mix(mix('#3f8a55', p.accent2, 0.3), '#10203a', 0.3);
      for (i = 0; i < 5; i++) leaf(c, ox + d * u * 5, fl + u * 9, u * (15 - i), (s ? PI : 0) - d * (0.5 + i * 0.32) + Math.sin(t * 0.7 + i + s) * 0.03, i % 2 ? grn : shade(grn, 0.14));
      Pg(c, [[ox + d * u * 0.5, fl + u * 8], [ox + d * u * 9.5, fl + u * 8], [ox + d * u * 8, fl + u * 15], [ox + d * u * 2, fl + u * 15]], mix(clay, '#3a1a2a', 0.25), true); Rn(c, ox + (s ? -u * 10 : 0), fl + u * 7.4, u * 10, u * 1.6, u * 0.5, mix(clay, '#3a1a2a', 0.12));
      oilLamp(c, ox + d * u * 8, H - u * 3.4, u * 4.2, clay, t, s * 3 + 0.5, true); oilLamp(c, ox + d * u * 20, H - u * 1.6, u * 3.2, clay, t, s * 3 + 1.7, true); }
    vignette(c, W, H, '#0a0418', 0.45);
  }, { variants: ['night'], stage: 'cast-low', pal: 'dark' });

  /* ---------- sillwindow: a deep window sill at night, the city's lights beyond the glass ----------
     A quiet place for candle-lit evenings: the sill is left clear for the candles the recipe sets on it. */
  Art.add('backdrop', 'sillwindow', function (c, W, H, t, p, o, u) {
    var i, j, s, k, R0 = rnd(o.seed + 'sw'), q = Math.min(u, H / 150), sill = H * 0.7, th = u * 5, wood = mix(mix('#8a5a3a', p.bg2, 0.12), '#2a1420', 0.22), cur = mix(p.accent, '#2a1030', 0.3);
    vgrad(c, W, H, [mix(p.bg, '#050920', 0.62), mix(p.bg, '#141a4c', 0.5), mix(p.bg2, '#4a3a80', 0.5), mix(p.bg2, '#c07a90', 0.4)], 0, sill);
    skyStars(c, W, H, 80, o.seed, t, sill * 0.7); K.moonDisc(c, W * 0.7, H * 0.1, u * 5, '#fff6d8');
    c.fillStyle = 'rgba(255,255,255,0.06)'; for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(frac(R0() + t * 0.003) * W * 1.4 - W * 0.2, H * (0.16 + R0() * 0.2), u * (20 + R0() * 16), u * (1.4 + R0()), 0, 0, TAU); c.fill(); }
    /* the city, three depths of it */
    var skyLow = mix(p.bg2, '#4a3a80', 0.5), lights = ['#ffd58a', '#ffe9b8', '#ffc070', '#bfe0ff'];
    for (k = 0; k < 3; k++) { var x = -u * 3, n = 0, bc = mix(skyLow, '#0c0f2c', 0.4 + k * 0.24), wsz = q * (0.9 + k * 0.45);
      while (x < W) { var bw = u * (7 + R0() * 7 + k * 3), e = Math.abs((x + bw / 2) / W - 0.5) * 2, bh = q * ((30 - k * 9) + R0() * 16 + e * (10 + k * 8)), top = sill - bh;
        c.fillStyle = bc; c.fillRect(x, top, bw + 1, bh); var kind = Math.floor(R0() * 4);
        if (kind === 0) Pg(c, [[x, top], [x + bw / 2, top - bw * 0.3], [x + bw, top]], bc, true); else if (kind === 1) { c.fillRect(x + bw * 0.25, top - q * 3, bw * 0.5, q * 3); c.fillRect(x + bw * 0.48, top - q * 8, q * 0.4, q * 5); dot(c, x + bw * 0.5, top - q * 8, q * 0.5, Math.sin(t * 3 + n + k) > 0.3 ? '#ff6a6a' : bc); } else if (kind === 2) { c.fillRect(x + bw * 0.55, top - q * 3.4, q * 3.4, q * 2.6); c.fillRect(x + bw * 0.55 + q * 0.3, top - q * 0.9, q * 0.4, q * 1); c.fillRect(x + bw * 0.55 + q * 2.7, top - q * 0.9, q * 0.4, q * 1); Pg(c, [[x + bw * 0.55 - q * 0.3, top - q * 3.4], [x + bw * 0.55 + q * 1.7, top - q * 5], [x + bw * 0.55 + q * 3.7, top - q * 3.4]], bc, true); }
        var cols = Math.max(2, Math.floor(bw / (wsz * 2.6))), rws = Math.min(9, Math.floor(bh / (wsz * 3))); for (j = 0; j < rws; j++) for (i = 0; i < cols; i++) { var r = R0(); if (r > 0.36 + k * 0.08) continue; c.globalAlpha = 0.6 + 0.3 * Math.sin(t * (0.6 + r * 3) + i * 3 + j + n); c.fillStyle = lights[Math.floor(r * 37) % 4]; c.fillRect(x + (i + 0.3) / cols * bw, top + wsz * 1.6 + j * wsz * 3, wsz, wsz * 1.5); } c.globalAlpha = 1;
        x += bw + (k === 2 ? u * 1.5 : 0); n++; }
      vgrad2(c, 0, sill - q * 24, W, q * 24, alpha(skyLow, 0), alpha(mix(skyLow, '#ffb080', 0.3), 0.16)); }
    /* the glass: two long gleams, a breath of warm light low down where candles would stand */
    c.save(); c.globalAlpha = 0.05; c.fillStyle = '#ffffff'; for (i = 0; i < 2; i++) { var gx = W * (0.24 + i * 0.36); c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx + W * (0.1 - i * 0.05), 0); c.lineTo(gx + W * (0.1 - i * 0.05) - W * 0.3, sill); c.lineTo(gx - W * 0.3, sill); c.closePath(); c.fill(); } c.restore();
    glow(c, W / 2, sill, W * 0.62, '#ffb860', 0.3 + 0.02 * Math.sin(t * 5));
    /* the window: slim bars, a wooden frame */
    var wd2 = shade(wood, 0.16), wd3 = shade(wood, -0.25);
    Rn(c, W * 0.27 - u * 0.5, 0, u * 1, sill, 0, wd3); Rn(c, W * 0.73 - u * 0.5, 0, u * 1, sill, 0, wd3); Rn(c, 0, H * 0.3 - u * 0.5, W, u * 1, 0, wd3);
    Rn(c, 0, 0, W, th, 0, wood); Rn(c, 0, 0, th, sill, 0, wood); Rn(c, W - th, 0, th, sill, 0, wood); Rn(c, th * 0.75, th * 0.75, W - th * 1.5, th * 0.25, 0, wd3); Rn(c, th * 0.75, th, th * 0.25, sill - th, 0, wd3); Rn(c, W - th, th, th * 0.25, sill - th, 0, wd2);
    /* curtains drawn back to each side, a scalloped pelmet */
    for (s = 0; s < 2; s++) { var d = s ? -1 : 1, ox = s ? W : 0, cw = W * 0.17, tie = H * 0.47, sw = Math.sin(t * 0.5 + s * 2) * u * 0.3;
      c.beginPath(); c.moveTo(ox, 0); c.lineTo(ox + d * cw * 1.25, 0); c.quadraticCurveTo(ox + d * (cw * 1.2 + sw), tie * 0.6, ox + d * cw * 0.42, tie); c.quadraticCurveTo(ox + d * (cw * 0.9 + sw), tie + (sill - tie) * 0.5, ox + d * cw * 0.78, sill + u * 2); c.lineTo(ox, sill + u * 2); c.closePath(); c.fillStyle = cur; c.fill();
      c.strokeStyle = shade(cur, -0.25); c.lineWidth = u * 0.5; c.beginPath(); for (i = 1; i < 5; i++) { c.moveTo(ox + d * cw * 1.25 * i / 5, 0); c.quadraticCurveTo(ox + d * (cw * 1.1 * i / 5 + sw), tie * 0.6, ox + d * cw * 0.42 * (0.3 + i * 0.14), tie); c.moveTo(ox + d * cw * 0.42 * (0.3 + i * 0.14), tie); c.quadraticCurveTo(ox + d * (cw * 0.8 * i / 5 + sw), tie + (sill - tie) * 0.5, ox + d * cw * 0.78 * i / 5, sill + u * 2); } c.stroke();
      c.strokeStyle = alpha(shade(cur, 0.3), 0.5); c.lineWidth = u * 0.35; c.beginPath(); c.moveTo(ox + d * cw * 1.25, 0); c.quadraticCurveTo(ox + d * (cw * 1.2 + sw), tie * 0.6, ox + d * cw * 0.42, tie); c.quadraticCurveTo(ox + d * (cw * 0.9 + sw), tie + (sill - tie) * 0.5, ox + d * cw * 0.78, sill + u * 2); c.stroke();
      Rn(c, ox + (s ? -cw * 0.5 : 0), tie - u * 1, cw * 0.5, u * 2, u * 0.8, p.gold); L(c, ox + d * cw * 0.3, tie + u, ox + d * cw * 0.34, tie + u * 6, u * 0.5, p.gold); el(c, ox + d * cw * 0.34, tie + u * 7, u * 1, u * 1.6, shade(p.gold, -0.1)); }
    var np = Math.max(5, Math.round(W / (u * 17))); Rn(c, 0, 0, W, u * 4, 0, shade(cur, -0.15)); c.fillStyle = shade(cur, -0.15); c.beginPath(); for (i = 0; i < np; i++) { c.moveTo(i / np * W, u * 3.8); c.quadraticCurveTo((i + 0.5) / np * W, u * 11, (i + 1) / np * W, u * 3.8); } c.fill(); c.strokeStyle = p.gold; c.lineWidth = u * 0.5; c.beginPath(); for (i = 0; i < np; i++) { c.moveTo(i / np * W, u * 3.8); c.quadraticCurveTo((i + 0.5) / np * W, u * 11, (i + 1) / np * W, u * 3.8); } c.stroke(); for (i = 0; i <= np; i++) dot(c, i / np * W, u * 4, u * 0.9, p.gold);
    /* the sill: a broad board, grain running across, warm in the middle */
    var g = c.createLinearGradient(0, sill, 0, H); g.addColorStop(0, shade(wood, 0.24)); g.addColorStop(0.12, shade(wood, 0.08)); g.addColorStop(1, shade(wood, -0.3)); c.fillStyle = g; c.fillRect(0, sill, W, H - sill);
    Rn(c, 0, sill, W, u * 1.1, 0, shade(wood, 0.4)); Rn(c, 0, sill - u * 0.6, W, u * 0.6, 0, 'rgba(0,0,0,0.3)');
    c.fillStyle = 'rgba(40,15,5,0.14)'; for (i = 0; i < 30; i++) { c.beginPath(); c.ellipse(R0() * W, sill + u * 2.4 + R0() * (H - sill - u * 3), u * (5 + R0() * 16), u * (0.15 + R0() * 0.2), 0, 0, TAU); c.fill(); }
    var ey = sill + (H - sill) * 0.62; Rn(c, 0, ey, W, u * 0.8, 0, shade(wood, 0.3)); vgrad2(c, 0, ey + u * 0.8, W, H - ey, shade(wood, -0.3), shade(wood, -0.5)); /* the front edge and the wall under it */
    c.save(); c.translate(W / 2, sill + (ey - sill) * 0.5); c.scale(1, 0.3); glow(c, 0, 0, W * 0.55, '#ffc878', 0.34 + 0.03 * Math.sin(t * 6)); c.restore();
    /* at the two ends of the sill: a little plant, books and a cup */
    var px = W * 0.085, py = ey - u * 1.2, grn = mix(mix('#4a9a66', p.accent2, 0.35), '#101a3a', 0.25);
    el(c, px, py + u * 0.4, u * 6, u * 1, 'rgba(0,0,0,0.25)'); for (i = 0; i < 7; i++) leaf(c, px, py - u * 5.6, u * (7.4 - Math.abs(i - 3) * 0.6), -PI / 2 + (i - 3) * 0.42 + Math.sin(t * 0.6 + i) * 0.02, i % 2 ? grn : shade(grn, 0.16));
    Pg(c, [[px - u * 4, py - u * 6], [px + u * 4, py - u * 6], [px + u * 3, py], [px - u * 3, py]], mix(p.paper, wood, 0.2), true); Rn(c, px - u * 4.4, py - u * 6.6, u * 8.8, u * 1.5, u * 0.5, p.paper); Rn(c, px - u * 3.6, py - u * 3.6, u * 7.2, u * 0.8, 0, alpha(p.accent2, 0.7));
    var bx = W * 0.9, by = ey - u * 1.2; el(c, bx, by + u * 0.4, u * 9, u * 1, 'rgba(0,0,0,0.25)');
    Rn(c, bx - u * 8, by - u * 2.6, u * 15, u * 2.6, u * 0.4, mix(p.accent2, '#1a2a4a', 0.3)); Rn(c, bx - u * 7.4, by - u * 2.1, u * 13.8, u * 1.6, 0, p.paper); Rn(c, bx - u * 8, by - u * 2.6, u * 2, u * 2.6, u * 0.4, mix(p.accent2, '#1a2a4a', 0.45));
    Rn(c, bx - u * 6.6, by - u * 4.9, u * 13, u * 2.3, u * 0.4, mix(p.gold, '#6a3a1a', 0.3)); Rn(c, bx - u * 6, by - u * 4.5, u * 12, u * 1.5, 0, p.paper); Rn(c, bx - u * 6.6, by - u * 4.9, u * 1.8, u * 2.3, u * 0.4, mix(p.gold, '#6a3a1a', 0.5));
    c.beginPath(); c.arc(bx + u * 3.4, by - u * 7.8, u * 1.9, -PI / 2, PI / 2); c.lineWidth = u * 0.8; c.strokeStyle = p.paper; c.stroke(); Rn(c, bx - u * 2.6, by - u * 10.4, u * 6, u * 5.5, u * 1.2, p.paper); Rn(c, bx - u * 2.6, by - u * 8.6, u * 6, u * 1, 0, alpha(p.accent, 0.8)); el(c, bx + u * 0.4, by - u * 10.2, u * 2.6, u * 0.6, mix('#5a3020', p.ink, 0.3)); K.steam(c, bx + u * 0.4, by - u * 11, u * 3, t);
    vignette(c, W, H, '#0a0418', 0.42);
  }, { variants: ['night'], stage: 'band-low', pal: 'dark' });
});
