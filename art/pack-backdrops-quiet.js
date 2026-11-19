/* Send a Carol art pack: the quiet backdrops (moving day, a new home, a pier, a lake at dawn, a garden bench, a hill
   under stars, a chapel garden, a recovery room, a nursery, a porch dressed to welcome someone home). The three
   restrained ones (dawnlake, gardenbench, starhill) are for sympathy and memorial cards: still, almost no motion.
   Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, dot = K.dot, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd,
    vgrad = K.vgrad, vgrad2 = K.vgrad2, glow = K.glow, vignette = K.vignette, hill = K.hill, cloud = K.cloud, leaf = K.leaf;

  /* ---------- small shared pieces ---------- */
  function el(c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = col; c.fill(); }
  function quad(c, x1, y1, x2, y2, x3, y3, x4, y4, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.lineTo(x4, y4); c.closePath(); c.fillStyle = col; c.fill(); }
  function dark(p) { var r = K.rgbOf(p.bg) || [0, 0, 0]; return r[0] * 0.3 + r[1] * 0.59 + r[2] * 0.11 < 95; }
  /* a natural colour brought into the palette and the hour */
  function tint(col, p, v) {
    var out = v === 'night' ? mix(col, shade(p.bg, -0.3), 0.6) : v === 'dusk' ? mix(mix(col, '#c9705a', 0.16), p.bg, 0.2) : mix(col, p.bg2, 0.12);
    return v !== 'night' && dark(p) ? mix(out, p.bg, 0.34) : out;
  }
  function sky(c, W, H, p, v, hz) {
    vgrad(c, W, H, v === 'night' ? [shade(p.bg, -0.4), p.bg, mix(p.bg, p.bg2, 0.7), p.bg2] : v === 'dusk' ? [shade(p.bg, -0.12), p.bg, mix(p.bg2, '#ff9d73', 0.4), mix(p.bg2, '#ffe0a8', 0.55)] : [p.bg, mix(p.bg, p.bg2, 0.55), mix(p.bg2, '#ffffff', 0.25)], 0, hz);
  }
  function sun(c, x, y, r, col, a) { glow(c, x, y, r * 4.2, col, a == null ? 0.5 : a); dot(c, x, y, r, col); dot(c, x - r * 0.25, y - r * 0.25, r * 0.6, 'rgba(255,255,255,0.25)'); }
  function clouds(c, W, n, seed, t, y0, y1, col, u, speed) { var R0 = rnd(seed + 'cl'), i; for (i = 0; i < n; i++) { var cw = u * (16 + R0() * 18), cx = frac(R0() + t * (speed == null ? 0.005 : speed) * (1 + i * 0.3)) * (W + cw * 2) - cw, cy = y0 + R0() * (y1 - y0); cloud(c, cx, cy, cw, col); } }
  /* a round leafy tree; base centre at (x, y) */
  function tree(c, x, y, h, col, trunk, sw) {
    var r = h * 0.3; sw = sw || 0;
    quad(c, x - h * 0.04, y, x + h * 0.04, y, x + h * 0.022 + sw, y - h * 0.55, x - h * 0.022 + sw, y - h * 0.55, trunk);
    L(c, x, y - h * 0.38, x + h * 0.12 + sw, y - h * 0.56, h * 0.022, trunk); L(c, x, y - h * 0.32, x - h * 0.11 + sw, y - h * 0.5, h * 0.02, trunk);
    el(c, x - r * 0.62 + sw, y - h * 0.58, r * 0.72, r * 0.66, shade(col, -0.14)); el(c, x + r * 0.66 + sw, y - h * 0.6, r * 0.7, r * 0.64, shade(col, -0.08));
    el(c, x + sw, y - h * 0.74, r, r * 0.92, col); el(c, x - r * 0.3 + sw, y - h * 0.82, r * 0.5, r * 0.4, shade(col, 0.14)); el(c, x + r * 0.4 + sw, y - h * 0.7, r * 0.3, r * 0.22, shade(col, 0.09));
  }
  function bush(c, x, y, w, col) { el(c, x - w * 0.28, y - w * 0.18, w * 0.3, w * 0.24, shade(col, -0.1)); el(c, x + w * 0.26, y - w * 0.2, w * 0.32, w * 0.26, shade(col, -0.05)); el(c, x, y - w * 0.3, w * 0.34, w * 0.3, col); el(c, x - w * 0.08, y - w * 0.4, w * 0.16, w * 0.1, shade(col, 0.14)); Rn(c, x - w * 0.56, y - w * 0.2, w * 1.14, w * 0.2, w * 0.1, shade(col, -0.08)); }
  function blooms(c, x, y, w, n, cols, seed, r) { var R0 = rnd(seed), i; for (i = 0; i < n; i++) { var bx = x + (R0() - 0.5) * w, by = y - R0() * w * 0.34; dot(c, bx, by, r, cols[i % cols.length]); dot(c, bx, by, r * 0.36, 'rgba(255,240,170,0.9)'); } }
  /* a cardboard box; bottom-left corner at (x, y) */
  function box(c, x, y, w, h, col, u) {
    Rn(c, x, y - h, w, h, u * 0.4, col); Rn(c, x - u * 0.5, y - h - u * 0.4, w + u, u * 1.9, u * 0.4, shade(col, 0.14)); Rn(c, x, y - h + u * 1.5, w, u * 0.5, 0, shade(col, -0.16));
    Rn(c, x + w * 0.44, y - h - u * 0.4, w * 0.12, h * 0.42, 0, alpha('#fff6dc', 0.6)); Rn(c, x + w * 0.2, y - h * 0.42, w * 0.2, u * 1.1, u * 0.55, shade(col, -0.3));
  }
  /* a small house front; bottom-left at (x, base) */
  function house(c, x, base, w, h, wall, roof, door, win, u) {
    Rn(c, x, base - h, w, h + 1, 0, wall); Rn(c, x, base - h, w, u * 0.9, 0, shade(wall, -0.14));
    Rn(c, x + w * 0.68, base - h - w * 0.38, w * 0.12, w * 0.3, 0, shade(roof, -0.2));
    Pg(c, [[x - w * 0.08, base - h], [x + w / 2, base - h - w * 0.42], [x + w * 1.08, base - h]], roof, true); Pg(c, [[x - w * 0.08, base - h], [x + w / 2, base - h - w * 0.42], [x + w / 2, base - h - w * 0.33], [x + w * 0.04, base - h]], shade(roof, 0.14), true);
    var dh = Math.min(h * 0.5, w * 0.44); Rn(c, x + w * 0.4, base - dh, w * 0.2, dh, w * 0.03, door); dot(c, x + w * 0.56, base - dh * 0.5, w * 0.014, '#ffe9a0');
    for (var s = 0; s < 2; s++) { var wx = x + w * (s ? 0.68 : 0.12), wy = base - Math.min(h * 0.72, dh + w * 0.2); Rn(c, wx - w * 0.015, wy - w * 0.015, w * 0.23, w * 0.25, w * 0.02, shade(wall, 0.3)); Rn(c, wx, wy, w * 0.2, w * 0.22, 0, win); Rn(c, wx + w * 0.092, wy, w * 0.016, w * 0.22, 0, shade(wall, 0.3)); }
    dot(c, x + w / 2, base - h - w * 0.14, w * 0.05, win);
  }
  function lampGlow(c, x, y, r, a, t, ph) { glow(c, x, y, r, '#ffd98a', a * (0.92 + 0.08 * Math.sin(t * 1.3 + ph))); }
  /* a window on a wall: the sky outside, a cross bar, a sill; returns nothing. kind 0 = day sky with hills, 1 = night */
  function pane(c, x, y, w, h, u, frame, top, bot, clip) {
    Rn(c, x - u * 1.4, y - u * 1.4, w + u * 2.8, h + u * 2.8, u * 0.9, frame);
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(x, y, w, h);
    if (clip) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); clip(); c.restore(); }
    Rn(c, x + w / 2 - u * 0.45, y, u * 0.9, h, 0, frame); Rn(c, x, y + h * 0.45 - u * 0.4, w, u * 0.8, 0, frame);
    Rn(c, x - u * 2.6, y + h + u * 1, w + u * 5.2, u * 1.6, u * 0.6, shade(frame, -0.08));
  }

  /* ---------- movingday: the van at the kerb, boxes on the pavement, the new street behind ---------- */
  Art.add('backdrop', 'movingday', function (c, W, H, t, p, o, u) {
    var v = 'day', i, R0 = rnd(o.seed + 'md'), hz = H * 0.6, py = H * 0.69, x, n = 0;
    var card = tint(mix('#c99a62', p.gold, 0.18), p, v), gr = tint(mix('#7cbf68', p.accent2, 0.4), p, v), walls = [p.paper, mix(p.accent, p.paper, 0.6), mix(p.gold, p.paper, 0.55), mix(p.accent2, p.paper, 0.62), mix(p.bg, p.paper, 0.6)];
    sky(c, W, H, p, v, hz); sun(c, W * 0.84, H * 0.09, u * 6, '#fff0b0', 0.5);
    clouds(c, W, 5, o.seed, t, H * 0.05, H * 0.3, alpha(p.snow, 0.9), u);
    hill(c, W, H, hz - u * 7, u * 3, mix(gr, p.bg2, 0.5), o.seed + 'a', 0.7);
    for (i = 0; i < 6; i++) tree(c, W * (0.04 + i * 0.19) + R0() * u * 4, hz + u * 0.5, u * (15 + R0() * 7), shade(gr, -0.08 + R0() * 0.12), tint('#7a5a40', p, v), Math.sin(t * 0.7 + i) * u * 0.14);
    x = -u * 6; /* the street: low in the middle, taller at the sides */
    while (x < W) { var w = u * (17 + R0() * 6), e = Math.abs(x + w / 2 - W / 2) / (W / 2), h = u * (9 + e * 9 + R0() * 3); house(c, x, hz + u * 0.6, w, h, tint(walls[n % 5], p, v), tint(n % 2 ? shade(p.accent, -0.22) : mix(p.ink, p.bg, 0.35), p, v), tint(n % 3 ? p.accent2 : p.accent, p, v), mix(p.bg, '#ffffff', 0.55), u); x += w + u * (1.5 + R0() * 3); n++; }
    for (i = 0; i < 9; i++) bush(c, (i + 0.5) / 9 * W + (R0() - 0.5) * u * 4, hz + u * 1.6, u * (5 + R0() * 2.5), shade(gr, -0.16));
    c.fillStyle = tint(mix('#8f93a0', p.bg, 0.22), p, v); c.fillRect(0, hz + u * 1.2, W, py - hz); /* the road */
    c.fillStyle = alpha(p.snow, 0.5); for (i = 0; i * u * 12 < W; i++) c.fillRect(i * u * 12 + u * 2, hz + (py - hz) * 0.42, u * 6, u * 0.5);
    /* the van, plain: a white box, a stripe, a cab */
    var vx = u * 3, vb = py - u * 0.6, body = mix(p.paper, p.bg2, 0.12), vk = H > W * 1.3 ? 1.3 : 1;
    c.save(); c.translate(vx, vb); c.scale(vk, vk); c.translate(-vx, -vb);
    el(c, vx + u * 20, vb + u * 0.4, u * 22, u * 1.3, 'rgba(0,0,0,0.16)');
    quad(c, vx + u * 39, vb - u * 3.2, vx + u * 40.5, vb - u * 3.2, vx + u * 53, vb + u * 0.6, vx + u * 50, vb + u * 0.6, shade(body, -0.32)); /* ramp */
    Rn(c, vx, vb - u * 13.5, u * 11, u * 11, u * 2.4, p.accent); Rn(c, vx + u * 1.3, vb - u * 12, u * 6.4, u * 5, u * 1.2, mix(p.bg, '#ffffff', 0.6)); Rn(c, vx + u * 1.3, vb - u * 12, u * 2.2, u * 5, u * 1, 'rgba(255,255,255,0.35)');
    Rn(c, vx - u * 0.8, vb - u * 4.4, u * 3, u * 1.6, u * 0.6, shade(p.accent, -0.3)); dot(c, vx + u * 0.3, vb - u * 5.8, u * 0.8, '#ffe9a0');
    Rn(c, vx + u * 9.5, vb - u * 22, u * 30.5, u * 19.6, u * 1.1, body); Rn(c, vx + u * 9.5, vb - u * 22, u * 30.5, u * 1.3, u * 0.6, shade(body, -0.1));
    Rn(c, vx + u * 9.5, vb - u * 11.6, u * 30.5, u * 2.6, 0, p.accent); Rn(c, vx + u * 9.5, vb - u * 8.4, u * 30.5, u * 0.8, 0, p.gold);
    c.fillStyle = shade(body, -0.07); for (i = 1; i < 5; i++) c.fillRect(vx + u * 9.5 + i * u * 6.1, vb - u * 20.4, u * 0.35, u * 8.4);
    Rn(c, vx + u * 9.5, vb - u * 3.2, u * 31, u * 1.2, u * 0.5, shade(body, -0.4));
    K.wheel(c, vx + u * 7, vb - u * 2.6, u * 3.1, shade(body, -0.3)); K.wheel(c, vx + u * 31, vb - u * 2.6, u * 3.1, shade(body, -0.3));
    box(c, vx + u * 43.5, vb - u * 1.2, u * 6, u * 5, card, u * 0.7);
    c.restore();
    /* the pavement */
    var pv = tint(mix('#ded6c6', p.bg2, 0.3), p, v);
    vgrad2(c, 0, py, W, H - py, pv, shade(pv, -0.12)); Rn(c, 0, py, W, u * 1.1, 0, shade(pv, 0.18)); Rn(c, 0, py + u * 1.1, W, u * 0.5, 0, shade(pv, -0.2));
    c.strokeStyle = shade(pv, -0.12); c.lineWidth = Math.max(0.6, u * 0.22); c.beginPath(); for (i = -7; i <= 7; i++) { c.moveTo(W / 2 + i * W * 0.1, py + u * 1.6); c.lineTo(W / 2 + i * W * 0.17, H); } c.moveTo(0, py + (H - py) * 0.42); c.lineTo(W, py + (H - py) * 0.42); c.stroke();
    /* what came off the van: stacks at the right, the plant and the rug at the very front */
    var bx = W - u * 25, by = H * 0.752;
    el(c, bx + u * 11, by + u * 0.3, u * 14, u * 1.1, 'rgba(0,0,0,0.13)');
    box(c, bx, by, u * 13, u * 9.5, card, u); box(c, bx + u * 1.5, by - u * 9.9, u * 9.5, u * 7, shade(card, 0.08), u); box(c, bx + u * 14, by, u * 9.5, u * 12.5, shade(card, -0.06), u);
    L(c, bx + u * 19, by - u * 12.5, bx + u * 19.8, by - u * 22, u * 0.6, shade(p.ink, 0.3)); Pg(c, [[bx + u * 16.6, by - u * 21], [bx + u * 23, by - u * 21], [bx + u * 21.6, by - u * 26.6], [bx + u * 18, by - u * 26.6]], mix(p.gold, p.paper, 0.35), true); /* a lamp travelling in its box */
    var fy = H * 0.985;
    el(c, u * 13, fy, u * 13, u * 1.1, 'rgba(0,0,0,0.13)'); box(c, u * 3, fy, u * 17, u * 11.5, card, u);
    for (i = 0; i < 7; i++) leaf(c, u * 11.5, fy - u * 12, u * (8 + (i % 3) * 2), -PI / 2 + (i - 3) * 0.36 + Math.sin(t * 0.9 + i) * 0.03, i % 2 ? gr : shade(gr, -0.16));
    el(c, W - u * 13, fy, u * 12, u * 1, 'rgba(0,0,0,0.13)'); box(c, W - u * 21, fy, u * 14, u * 9, shade(card, 0.05), u);
    c.save(); c.translate(W - u * 5.5, fy); c.rotate(0.16); Rn(c, -u * 2.2, -u * 25, u * 4.4, u * 25, u * 2, p.accent2); for (i = 0; i < 5; i++) Rn(c, -u * 2.2, -u * 22 + i * u * 4.6, u * 4.4, u * 1, 0, p.gold); el(c, 0, -u * 25, u * 2.2, u * 0.9, shade(p.accent2, -0.25)); el(c, 0, -u * 25, u * 1.1, u * 0.45, p.gold); c.restore();
  }, { variants: ['day'], stage: 'band-low', pal: 'light' });

  /* ---------- newhome: the front of the house, its door, its path ---------- */
  Art.add('backdrop', 'newhome', function (c, W, H, t, p, o, u) {
    var v = o.variant, lit = v !== 'day', i, s, R0 = rnd(o.seed + 'nh'), eave = H * 0.2, gy = H * 0.645, cx = W / 2;
    var wall = tint(mix(p.paper, p.bg2, 0.25), p, v), roof = tint(mix(p.accent, p.ink, 0.45), p, v), gr = tint(mix('#7cbf68', p.accent2, 0.4), p, v), trim = tint(p.snow, p, v), glass = lit ? '#ffdf8a' : mix(p.bg, '#ffffff', 0.6);
    sky(c, W, H, p, v, eave + u * 4); if (lit) K.skyStars(c, W, H, 18, o.seed, t, H * 0.14, '#fff4e0');
    tree(c, -u * 2, gy + u, u * 60, shade(gr, -0.2), tint('#6a4a36', p, v), Math.sin(t * 0.6) * u * 0.2); tree(c, W + u * 3, gy + u, u * 66, shade(gr, -0.26), tint('#6a4a36', p, v), Math.sin(t * 0.6 + 2) * u * 0.2);
    /* the wall in clapboard, the gable above it */
    var x0 = u * 7, x1 = W - u * 7;
    Rn(c, x0, eave, x1 - x0, gy - eave, 0, wall); c.fillStyle = shade(wall, -0.07); for (i = 1; eave + i * u * 3.4 < gy; i++) c.fillRect(x0, eave + i * u * 3.4, x1 - x0, u * 0.3);
    Pg(c, [[x0 - u * 5, eave + u * 1], [cx, H * 0.045], [x1 + u * 5, eave + u * 1]], roof, true); Pg(c, [[x0 + u * 6, eave + u * 1], [cx, H * 0.045 + u * 6], [x1 - u * 6, eave + u * 1]], shade(wall, -0.05), true);
    Rn(c, x0 - u * 5, eave, x1 - x0 + u * 10, u * 2, u * 0.8, shade(roof, -0.18)); dot(c, cx, eave - u * 6.5, u * 3.4, trim); dot(c, cx, eave - u * 6.5, u * 2.5, glass);
    Rn(c, x0, eave + u * 2, u * 2, gy - eave - u * 2, 0, trim); Rn(c, x1 - u * 2, eave + u * 2, u * 2, gy - eave - u * 2, 0, trim);
    /* two windows with boxes of flowers at the sides */
    var ww = Math.min(u * 19, (x1 - x0) * 0.22), wh = ww * 1.35, wy = gy - wh - u * 12;
    for (s = 0; s < 2; s++) {
      var wx = s ? x1 - u * 6 - ww : x0 + u * 6;
      if (lit) lampGlow(c, wx + ww / 2, wy + wh / 2, ww * 1.5, 0.3, t, s);
      pane(c, wx, wy, ww, wh, u, trim, glass, lit ? '#ffc76a' : mix(p.bg2, '#ffffff', 0.6));
      quad(c, wx - u * 5, wy - u * 1, wx - u * 1.8, wy - u * 1, wx - u * 1.8, wy + wh + u, wx - u * 5, wy + wh + u, tint(p.accent2, p, v)); quad(c, wx + ww + u * 1.8, wy - u, wx + ww + u * 5, wy - u, wx + ww + u * 5, wy + wh + u, wx + ww + u * 1.8, wy + wh + u, tint(p.accent2, p, v));
      Rn(c, wx - u * 2, wy + wh + u * 2.4, ww + u * 4, u * 3.6, u * 0.8, tint(mix('#a8703f', p.gold, 0.2), p, v));
      for (i = 0; i < 6; i++) leaf(c, wx + (i + 0.5) / 6 * ww, wy + wh + u * 2.8, u * 3.4, -PI / 2 + (i - 2.5) * 0.3, gr);
      blooms(c, wx + ww / 2, wy + wh + u * 1.6, ww * 1.05, 9, [p.accent, p.gold, p.snow], o.seed + 'fb' + s, u * 1.15);
    }
    /* the door, its lamp, its mat */
    var dw = u * 15, dh = u * 27, dx = cx - dw / 2, dy = gy - dh;
    Rn(c, dx - u * 2, dy - u * 2, dw + u * 4, dh + u * 2, u * 1, trim); Rn(c, dx, dy, dw, dh, u * 0.6, tint(p.accent, p, v));
    Rn(c, dx + u * 2, dy + u * 2, dw - u * 4, u * 7.5, u * 0.6, glass); Rn(c, dx + u * 2, dy + u * 12, dw - u * 4, u * 12.5, u * 0.6, shade(tint(p.accent, p, v), -0.12)); dot(c, dx + dw - u * 2.2, dy + dh * 0.56, u * 0.9, p.gold);
    for (s = -1; s <= 1; s += 2) { var lx = cx + s * (dw / 2 + u * 6), ly = dy + u * 6; if (lit) lampGlow(c, lx, ly, u * 15, 0.5, t, s); Rn(c, lx - u * 1.2, ly - u * 2, u * 2.4, u * 4, u * 0.6, lit ? '#ffe9a8' : mix(p.paper, p.gold, 0.3)); Pg(c, [[lx - u * 1.9, ly - u * 2], [lx + u * 1.9, ly - u * 2], [lx, ly - u * 4]], shade(p.ink, 0.15), true); Rn(c, lx - u * 1.5, ly + u * 2, u * 3, u * 0.7, u * 0.3, shade(p.ink, 0.15)); }
    /* porch step, lawn, the path to the bottom of the card */
    Rn(c, x0 - u * 3, gy - u * 0.4, x1 - x0 + u * 6, u * 2.6, u * 0.6, shade(trim, -0.1)); Rn(c, cx - dw * 0.9, gy - u * 1.6, dw * 1.8, u * 1.5, u * 0.5, tint(mix(p.gold, '#a8703f', 0.5), p, v));
    vgrad2(c, 0, gy + u * 2.2, W, H - gy, gr, shade(gr, -0.2)); c.fillStyle = shade(gr, 0.1); for (i = 0; i < 60; i++) { var gx = R0() * W, gyy = gy + u * 4 + R0() * (H - gy - u * 5); c.fillRect(gx, gyy, u * 0.3, u * 1.1); }
    var pth = tint(mix('#e2d6c0', p.bg2, 0.3), p, v);
    quad(c, cx - dw * 0.75, gy + u * 2.2, cx + dw * 0.75, gy + u * 2.2, cx + W * 0.34, H, cx - W * 0.34, H, pth);
    c.strokeStyle = shade(pth, -0.14); c.lineWidth = Math.max(0.6, u * 0.3); c.beginPath(); for (i = 1; i < 7; i++) { var f = i / 7, yy = gy + u * 2.2 + (H - gy - u * 2.2) * f * f, hw = dw * 0.75 + (W * 0.34 - dw * 0.75) * f * f; c.moveTo(cx - hw, yy); c.lineTo(cx + hw, yy); } c.stroke();
    for (s = 0; s < 2; s++) for (i = 0; i < 3; i++) { var bx = s ? W - u * (6 + i * 9) : u * (6 + i * 9), bw = u * (11 - i * 1.6); bush(c, bx, gy + u * (4.6 + i * 0.4), bw, shade(gr, -0.2 + i * 0.05)); blooms(c, bx, gy + u * 2.2, bw, 4, [p.snow, p.gold, p.accent], o.seed + 'b' + s + i, u * 0.9); }
    /* a letterbox by the path */
    var mx = W * 0.14, my = H * 0.9; Rn(c, mx - u * 0.6, my - u * 12, u * 1.2, u * 12, 0, tint('#7a5a40', p, v)); Rn(c, mx - u * 4, my - u * 16, u * 8, u * 5, u * 2.2, tint(p.accent, p, v)); Rn(c, mx + u * 2.6, my - u * 17.6, u * 0.7, u * 3.4, 0, p.gold); Rn(c, mx + u * 2.6, my - u * 17.6, u * 2.6, u * 1.6, 0, p.gold);
    if (lit) { vignette(c, W, H, shade(p.bg, -0.4), 0.3); }
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- pier: boards running out to the horizon ---------- */
  Art.add('backdrop', 'pier', function (c, W, H, t, p, o, u) {
    var v = o.variant, dusk = v === 'dusk', i, s, R0 = rnd(o.seed + 'pi'), hz = H * 0.5, cx = W / 2, sx = dusk ? W * 0.5 : W * 0.8, sy = dusk ? hz - u * 6 : H * 0.1;
    var sea = tint(mix('#3f8fb8', p.bg, 0.4), p, v), wood = tint(mix('#b98a5c', p.gold, 0.15), p, v), sunc = dusk ? '#ffd9a0' : '#fff0b0';
    sky(c, W, H, p, v, hz); if (dusk) K.skyStars(c, W, H, 20, o.seed, t, H * 0.16, '#fff4e0');
    sun(c, sx, sy, u * (dusk ? 11 : 6), sunc, dusk ? 0.6 : 0.5);
    clouds(c, W, 5, o.seed, t, H * 0.06, H * 0.34, dusk ? alpha(mix(p.snow, '#ffb7a0', 0.5), 0.75) : alpha(p.snow, 0.9), u);
    vgrad2(c, 0, hz, W, H - hz, mix(sea, dusk ? '#ffb38a' : '#ffffff', dusk ? 0.42 : 0.3), shade(sea, -0.22));
    c.fillStyle = mix(sea, p.bg, 0.45); c.beginPath(); c.moveTo(0, hz); c.lineTo(0, hz - u * 2.4); c.quadraticCurveTo(W * 0.12, hz - u * 4.6, W * 0.3, hz); c.closePath(); c.fill(); /* a far headland */
    for (i = 0; i < 46; i++) { var f = R0(), yy = hz + u * 0.8 + f * f * (H - hz), ww = u * (2 + f * 9) * (0.5 + R0()), xx = R0() * W + Math.sin(t * 0.5 + i) * u * 1.2, near = Math.abs(xx - sx) < u * (5 + f * 16); c.fillStyle = near ? alpha(sunc, 0.55 + 0.3 * Math.sin(t * 1.4 + i)) : alpha(p.snow, 0.13 + 0.07 * Math.sin(t * 0.9 + i)); c.fillRect(xx - ww / 2, yy, ww, u * (0.25 + f * 0.4)); }
    var sb = frac(t * 0.006 + 0.2) * (W + u * 30) - u * 15; Pg(c, [[sb - u * 3, hz - u * 0.3], [sb + u * 3, hz - u * 0.3], [sb + u * 2.2, hz + u * 0.7], [sb - u * 2.2, hz + u * 0.7]], mix(p.paper, sea, 0.2), true); Pg(c, [[sb, hz - u * 6.5], [sb, hz - u * 0.8], [sb + u * 3.2, hz - u * 0.8]], p.paper, true); Pg(c, [[sb - u * 0.5, hz - u * 5.4], [sb - u * 0.5, hz - u * 0.8], [sb - u * 2.6, hz - u * 0.8]], mix(p.accent, p.paper, 0.3), true);
    /* the deck: wide at the bottom, to a point of light at the horizon */
    var far = u * 2.4, hw = function (y) { return far + (y - hz) / (H - hz) * (W * 0.62 - far); };
    quad(c, cx - far, hz, cx + far, hz, cx + W * 0.62, H, cx - W * 0.62, H, wood);
    c.strokeStyle = shade(wood, -0.2); c.lineWidth = Math.max(0.6, u * 0.28); c.beginPath(); for (i = 1; i < 30; i++) { var q = i / 30, py = hz + (H - hz) * q * q * q * 0.2 + (H - hz) * q * 0.8; if (py > hz + u * 2) { c.moveTo(cx - hw(py), py); c.lineTo(cx + hw(py), py); } } c.stroke();
    quad(c, cx - far, hz, cx - far * 0.4, hz, cx - W * 0.2, H, cx - W * 0.62, H, alpha(shade(wood, -0.3), 0.16)); if (dusk) quad(c, cx - far * 0.5, hz, cx + far * 0.5, hz, cx + W * 0.16, H, cx - W * 0.16, H, alpha('#ffd9a0', 0.16));
    Rn(c, cx - u * 3.4, hz - u * 5.6, u * 6.8, u * 5.6, u * 0.4, mix(wood, p.bg, 0.35)); Pg(c, [[cx - u * 4.4, hz - u * 5.4], [cx, hz - u * 8.6], [cx + u * 4.4, hz - u * 5.4]], mix(p.accent, p.bg, 0.3), true); Rn(c, cx - u * 0.9, hz - u * 3.4, u * 1.8, u * 3.4, u * 0.3, dusk ? '#ffe2a0' : mix(p.paper, p.bg, 0.3)); /* the little hut at the end */
    /* posts, rope and lamps along both rails */
    for (s = -1; s <= 1; s += 2) {
      var px0 = null, py0 = null;
      for (i = 6; i >= 0; i--) {
        var d = Math.pow(0.56, i), y = hz + (H * 0.99 - hz) * d, x = cx + s * hw(y) * 0.985, ph = (H - hz) * d * 0.34, pw = Math.max(u * 0.4, ph * 0.085), lamp = i % 2 === 0;
        if (px0 != null) { c.beginPath(); c.moveTo(px0, py0); c.quadraticCurveTo((px0 + x) / 2, (py0 + y - ph * 0.8) / 2 + ph * 0.22, x, y - ph * 0.8); c.lineWidth = Math.max(0.7, pw * 0.36); c.strokeStyle = mix(p.paper, wood, 0.35); c.stroke(); }
        if (lamp) { Rn(c, x - pw * 0.3, y - ph * 2.2, pw * 0.6, ph * 1.4, 0, shade(wood, -0.42)); if (dusk) lampGlow(c, x, y - ph * 2.3, ph * 1.5, 0.5, t, i + s); dot(c, x, y - ph * 2.3, pw * 1.05, dusk ? '#ffe9a8' : mix(p.paper, p.bg2, 0.2)); Rn(c, x - pw * 1.1, y - ph * 2.3 - pw * 1.6, pw * 2.2, pw * 0.7, pw * 0.3, shade(wood, -0.42)); }
        Rn(c, x - pw / 2, y - ph, pw, ph, pw * 0.3, shade(wood, -0.24)); Rn(c, x - pw / 2, y - ph, pw * 0.36, ph, pw * 0.2, shade(wood, -0.08)); Rn(c, x - pw * 0.7, y - ph, pw * 1.4, pw * 0.6, pw * 0.25, shade(wood, -0.36));
        px0 = x; py0 = y - ph * 0.8;
      }
    }
    for (i = 0; i < 4; i++) { var gx = W * (0.16 + i * 0.22) + Math.sin(t * 0.3 + i * 2) * u * 5, gy = H * (0.13 + (i % 2) * 0.09 + i * 0.02) + Math.cos(t * 0.4 + i) * u * 1.4, gs = u * (2 + (i % 3) * 0.7), fl = Math.sin(t * 2.4 + i * 1.7) * 0.5; c.beginPath(); c.moveTo(gx - gs, gy - gs * (0.2 + fl * 0.5)); c.quadraticCurveTo(gx - gs * 0.4, gy - gs * 0.6, gx, gy); c.quadraticCurveTo(gx + gs * 0.4, gy - gs * 0.6, gx + gs, gy - gs * (0.2 + fl * 0.5)); c.lineWidth = Math.max(0.8, u * 0.5); c.strokeStyle = dusk ? alpha(shade(p.bg, -0.4), 0.7) : alpha(p.snow, 0.95); c.stroke(); }
    if (dusk) vignette(c, W, H, shade(p.bg, -0.4), 0.26);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ================= the three restrained ones: still, gentle, nothing that asks to be looked at ================= */
  function ridge(c, W, hz, hgt, amp, col, seed, f, flip) { /* a far shore standing on the line hz; flip = its reflection below */
    var R0 = rnd(seed + 'r'), a1 = R0() * 6.3, a2 = R0() * 6.3, i, n = 30, d = flip ? -0.86 : 1;
    c.beginPath(); c.moveTo(0, hz); for (i = 0; i <= n; i++) { var x = i / n; c.lineTo(x * W, hz - d * Math.max(0, hgt + (Math.sin(x * 4.2 * f + a1) * 0.65 + Math.sin(x * 9.3 * f + a2) * 0.35) * amp)); } c.lineTo(W, hz); c.closePath(); c.fillStyle = col; c.fill();
  }
  function mist(c, x, y, r, a, col) { c.save(); c.translate(x, y); c.scale(1, 0.1); glow(c, 0, 0, r, col, a); c.restore(); }
  function reeds(c, x, y, n, h, u, col, head, t, seed) {
    var R0 = rnd(seed), i; c.lineCap = 'round';
    for (i = 0; i < n; i++) { var rx = x + (R0() - 0.5) * n * u * 1.1, rh = h * (0.55 + R0() * 0.45), bend = (R0() - 0.5) * u * 4 + Math.sin(t * 0.35 + i) * u * 0.25; c.beginPath(); c.moveTo(rx, y); c.quadraticCurveTo(rx, y - rh * 0.6, rx + bend, y - rh); c.lineWidth = Math.max(0.7, u * 0.4); c.strokeStyle = col; c.stroke(); if (i % 3 === 0) { c.save(); c.translate(rx + bend * 0.86, y - rh * 0.9); c.rotate(bend / rh); Rn(c, -u * 0.6, -u * 2.2, u * 1.2, u * 4.2, u * 0.6, head); c.restore(); } else if (i % 3 === 1) leaf(c, rx, y - rh * 0.3, rh * 0.5, -PI / 2 + (bend > 0 ? 0.5 : -0.5), col); }
  }

  /* ---------- dawnlake: still water, first light, mist on the far shore ---------- */
  Art.add('backdrop', 'dawnlake', function (c, W, H, t, p, o, u) {
    var i, R0 = rnd(o.seed + 'dl'), hz = H * 0.5, bank = H * 0.672, dk = dark(p);
    var blush = mix(p.bg2, '#ffd6bd', dk ? 0.3 : 0.5), pale = mix(blush, '#ffffff', dk ? 0.12 : 0.4), top = mix(p.bg, p.bg2, 0.12), far = mix(mix(p.bg, p.bg2, 0.5), p.ink, 0.12), sx = W * 0.3, sy = hz - u * 8;
    vgrad(c, W, H, [top, mix(p.bg, p.bg2, 0.55), blush, pale], 0, hz);
    glow(c, sx, sy, u * 46, '#fff1d0', 0.5); dot(c, sx, sy, u * 4.6, '#fff6e2');
    for (i = 0; i < 4; i++) { var cy = H * (0.1 + i * 0.075), cw = W * (0.5 + R0() * 0.4), cx = W * (0.15 + R0() * 0.7) + Math.sin(t * 0.02 + i) * u * 3; c.save(); c.translate(cx, cy); c.scale(1, 0.05); glow(c, 0, 0, cw, i % 2 ? '#ffe2cc' : p.snow, 0.34); c.restore(); } /* long thin clouds, hardly moving */
    /* far shores, each paler than the one in front, and the same again in the water */
    vgrad2(c, 0, hz, W, H - hz, pale, mix(p.bg, p.bg2, 0.4));
    var L3 = [[u * 7, u * 3, 0.72, 0.7, 'a'], [u * 4.4, u * 2.6, 0.5, 1.3, 'b'], [u * 2.2, u * 1.6, 0.28, 2.1, 'c']];
    for (i = 0; i < 3; i++) ridge(c, W, hz, L3[i][0], L3[i][1], mix(far, pale, L3[i][2]), o.seed + L3[i][4], L3[i][3], false);
    for (i = 0; i < 3; i++) ridge(c, W, hz, L3[i][0], L3[i][1], alpha(mix(far, pale, L3[i][2]), 0.5), o.seed + L3[i][4], L3[i][3], true);
    c.save(); c.translate(sx, hz); c.scale(0.16, 1); glow(c, 0, 0, bank - hz, '#fff3d8', 0.7); c.restore(); /* the light lying on the water */
    for (i = 0; i < 9; i++) { var lw = u * (7 - i * 0.6) * (0.7 + 0.3 * Math.sin(i * 2.1)); c.fillStyle = alpha('#fff6e2', 0.5 - i * 0.045); c.fillRect(sx - lw / 2, hz + u * 0.8 + i * (bank - hz) * 0.085, lw, Math.max(0.7, u * 0.28)); }
    for (i = 0; i < 16; i++) { var f = R0(), yy = hz + u * 1.5 + f * (bank - hz - u * 2), ww = u * (5 + f * 16); c.fillStyle = alpha(p.snow, 0.1 + 0.03 * Math.sin(t * 0.3 + i)); c.fillRect(R0() * W - ww / 2, yy, ww, Math.max(0.6, u * 0.2)); }
    for (i = 0; i < 6; i++) mist(c, W * (0.08 + i * 0.19) + Math.sin(t * 0.03 + i * 1.7) * u * 5, hz + u * (i % 2 ? 1.2 : -1.4), W * (0.3 + (i % 3) * 0.07), 0.5, p.snow);
    /* a rowing boat, tied up, not going anywhere */
    var bx = W * 0.7, by = bank - u * 3.4, hull = mix(far, p.ink, 0.45);
    c.fillStyle = alpha(hull, 0.3); c.beginPath(); c.moveTo(bx - u * 8, by); c.quadraticCurveTo(bx, by + u * 3.2, bx + u * 8.6, by); c.closePath(); c.fill();
    c.fillStyle = hull; c.beginPath(); c.moveTo(bx - u * 8.4, by - u * 2.3); c.lineTo(bx + u * 9.2, by - u * 2.6); c.quadraticCurveTo(bx + u * 6, by + u * 0.2, bx, by + u * 0.2); c.quadraticCurveTo(bx - u * 6.6, by + u * 0.2, bx - u * 8.4, by - u * 2.3); c.closePath(); c.fill();
    L(c, bx - u * 8.2, by - u * 2.3, bx + u * 9, by - u * 2.6, Math.max(0.8, u * 0.45), mix(hull, pale, 0.5)); L(c, bx - u * 1, by - u * 2.4, bx - u * 0.6, by - u * 0.6, u * 0.5, mix(hull, pale, 0.3));
    /* the near bank: where anyone stands */
    var bk = mix(mix('#55786a', p.accent2, 0.25), p.bg, dk ? 0.5 : 0.28);
    hill(c, W, H, bank, u * 0.9, bk, o.seed + 'k', 0.6); vgrad2(c, 0, bank + u * 2, W, H - bank, alpha(shade(bk, -0.3), 0), alpha(shade(bk, -0.3), 0.55));
    mist(c, W * 0.5, bank + u * 0.5, W * 0.7, 0.3, p.snow);
    reeds(c, u * 7, bank + u * 3, 13, u * 24, u, shade(bk, -0.28), shade(mix('#7a5a40', bk, 0.3), -0.2), t, o.seed + 'rl'); reeds(c, W - u * 6, bank + u * 4, 11, u * 20, u, shade(bk, -0.24), shade(mix('#7a5a40', bk, 0.3), -0.2), t, o.seed + 'rr');
    for (i = 0; i < 7; i++) { var stx = R0() * W, sty = bank + u * 5 + R0() * (H - bank - u * 7), sr = u * (1.6 + R0() * 2.4); el(c, stx, sty, sr, sr * 0.5, mix(bk, pale, 0.3)); el(c, stx - sr * 0.2, sty - sr * 0.14, sr * 0.6, sr * 0.22, mix(bk, pale, 0.48)); }
    c.strokeStyle = shade(bk, 0.16); c.lineWidth = Math.max(0.6, u * 0.3); c.beginPath(); for (i = 0; i < 70; i++) { var tx = R0() * W, ty = bank + u * 3 + R0() * (H - bank - u * 4); c.moveTo(tx, ty); c.lineTo(tx + (R0() - 0.5) * u, ty - u * (0.8 + R0())); } c.stroke();
    vignette(c, W, H, mix(p.bg, p.ink, 0.5), 0.2);
  }, { variants: ['one'], stage: 'band-low', pal: 'light' });

  /* ---------- gardenbench: an empty bench under an old tree, by a wall of roses ---------- */
  function bench(c, x, y, w, u, col) { /* seat centre-bottom at (x, y); w across */
    var h = w * 0.5, i, d = shade(col, -0.26);
    for (i = -1; i <= 1; i += 2) { Rn(c, x + i * w * 0.42 - u * 0.7, y - h * 0.5, u * 1.4, h * 0.5, u * 0.3, d); Rn(c, x + i * w * 0.46 - u * 0.7, y - h, u * 1.4, h * 0.62, u * 0.4, d); }
    for (i = 0; i < 4; i++) Rn(c, x - w * 0.47, y - h * (0.98 - i * 0.115), w * 0.94, h * 0.085, u * 0.4, i % 2 ? col : shade(col, 0.07));
    Rn(c, x - w * 0.5, y - h * 0.5, w, h * 0.1, u * 0.5, shade(col, 0.12)); Rn(c, x - w * 0.5, y - h * 0.42, w, h * 0.07, u * 0.3, d);
    for (i = -1; i <= 1; i += 2) { Rn(c, x + i * w * 0.5 - u * 0.9, y - h * 0.7, u * 1.8, h * 0.24, u * 0.5, d); Rn(c, x + i * w * 0.5 - u * 1.6, y - h * 0.74, u * 3.2, u * 1.1, u * 0.5, col); }
  }
  Art.add('backdrop', 'gardenbench', function (c, W, H, t, p, o, u) {
    var v = o.variant, dusk = v === 'dusk', i, R0 = rnd(o.seed + 'gbn'), wt = H * 0.5, gy = H * 0.635;
    var gr = tint(mix(mix('#7aa873', p.accent2, 0.3), p.paper, 0.14), p, v), stone = tint(mix('#c2b8a8', p.bg2, 0.3), p, v), bark = tint(mix('#6f5646', p.ink, 0.2), p, v), soft = [mix(p.snow, p.bg2, 0.1), mix(p.accent, p.snow, 0.7), mix(p.gold, p.snow, 0.6)];
    sky(c, W, H, p, v, wt + u * 4); c.fillStyle = alpha(p.paper, 0.14); c.fillRect(0, 0, W, wt + u * 4); if (dusk) K.skyStars(c, W, H, 14, o.seed, t * 0.3, H * 0.2, '#fff4e0');
    glow(c, W * 0.74, H * 0.2, u * 40, dusk ? '#ffd9b0' : '#fff6d8', dusk ? 0.34 : 0.4);
    for (i = 0; i < 8; i++) el(c, (i + 0.5) / 8 * W + (R0() - 0.5) * u * 6, wt - u * (1 + R0() * 4), u * (10 + R0() * 6), u * (8 + R0() * 6), mix(gr, mix(p.bg, p.bg2, 0.6), 0.5 + (i % 2) * 0.1)); /* trees beyond the wall, far and soft */
    /* the old wall */
    Rn(c, 0, wt, W, gy - wt + u, 0, stone);
    for (var r = 0; wt + r * u * 3.3 < gy; r++) { var sxx = -(r % 2) * u * 4 - R0() * u * 2; while (sxx < W) { var sw = u * (6 + R0() * 5); Rn(c, sxx + u * 0.3, wt + r * u * 3.3 + u * 0.3, sw - u * 0.6, u * 2.7, u * 0.7, shade(stone, (R0() - 0.6) * 0.12)); sxx += sw; } }
    Rn(c, 0, wt - u * 1.3, W, u * 2, u * 0.6, shade(stone, 0.12)); vgrad2(c, 0, wt, W, gy - wt, alpha(p.ink, 0), alpha(p.ink, 0.1));
    /* a pale climbing rose over the right end of it */
    for (i = 0; i < 26; i++) { var f = R0(), lx = W - f * f * W * 0.42, ly = wt - u * 2 + R0() * (gy - wt) * (1 - f * 0.6); leaf(c, lx, ly, u * (3 + R0() * 2), R0() * TAU, i % 2 ? shade(gr, -0.2) : shade(gr, -0.08)); if (i % 3 === 0) { dot(c, lx, ly, u * 1.3, soft[i % 2]); dot(c, lx, ly, u * 0.5, mix(soft[1], p.accent, 0.25)); } }
    /* lawn, a flagstone walk, a low border of white flowers along the wall */
    vgrad2(c, 0, gy, W, H - gy, gr, shade(gr, -0.2));
    c.strokeStyle = shade(gr, 0.12); c.lineWidth = Math.max(0.6, u * 0.3); c.beginPath(); for (i = 0; i < 80; i++) { var tx = R0() * W, ty = gy + u * 3 + R0() * (H - gy - u * 4); c.moveTo(tx, ty); c.lineTo(tx + (R0() - 0.5) * u, ty - u * (0.7 + R0())); } c.stroke();
    for (i = 0; i < 8; i++) { var q = i / 7, fx = W * (0.6 - 0.26 * Math.sin(q * 2.4)) + q * W * 0.1, fyy = gy + u * 5 + q * q * (H - gy - u * 9) + q * u * 6, fr = u * (3 + q * 6); el(c, fx, fyy + fr * 0.08, fr, fr * 0.36, shade(gr, -0.2)); el(c, fx, fyy, fr, fr * 0.36, mix(stone, gr, 0.14)); el(c, fx - fr * 0.2, fyy - fr * 0.06, fr * 0.6, fr * 0.16, shade(mix(stone, gr, 0.14), 0.1)); }
    for (i = 0; i < 9; i++) { var bx = (i + 0.5) / 9 * W + (R0() - 0.5) * u * 3, bw = u * (8 + R0() * 4); if (bx > W * 0.1 && bx < W * 0.44) continue; bush(c, bx, gy + u * 2.2, bw, shade(gr, -0.16)); blooms(c, bx, gy + u * 0.2, bw, 5, soft, o.seed + 'w' + i, u * 0.95); }
    /* the tree: trunk at the left edge, its crown over the top of the card */
    var tx0 = u * 5, cr = shade(gr, -0.22);
    c.fillStyle = bark; c.beginPath(); c.moveTo(tx0 - u * 9, gy + u * 5); c.quadraticCurveTo(tx0 - u * 3, gy - u * 4, tx0 - u * 3.5, H * 0.2); c.lineTo(tx0 + u * 4, H * 0.2); c.quadraticCurveTo(tx0 + u * 3.4, gy - u * 5, tx0 + u * 10, gy + u * 5.4); c.closePath(); c.fill();
    c.strokeStyle = bark; c.lineCap = 'round'; c.lineWidth = u * 2.6; c.beginPath(); c.moveTo(tx0 + u * 2, H * 0.3); c.quadraticCurveTo(W * 0.24, H * 0.2, W * 0.42, H * 0.13); c.stroke(); c.lineWidth = u * 1.5; c.beginPath(); c.moveTo(W * 0.22, H * 0.22); c.quadraticCurveTo(W * 0.3, H * 0.25, W * 0.36, H * 0.24); c.stroke();
    c.strokeStyle = shade(bark, 0.14); c.lineWidth = Math.max(0.7, u * 0.4); c.beginPath(); for (i = 0; i < 5; i++) { c.moveTo(tx0 - u * 1.5 + i * u * 1.1, gy - u * (2 + i * 3)); c.lineTo(tx0 - u * 1.2 + i * u * 1.1, gy - u * (9 + i * 3)); } c.stroke();
    for (i = 0; i < 22; i++) { var a = R0(), ex = a * W * 0.74 - u * 6, ey = H * (0.02 + R0() * 0.2 * (1 - a * 0.6)) + a * u * 2, er = u * (9 + R0() * 7) * (1 - a * 0.3); el(c, ex, ey, er, er * 0.72, i % 3 === 0 ? shade(cr, 0.1) : i % 3 === 1 ? cr : shade(cr, -0.1)); }
    for (i = 0; i < 12; i++) { var hx = R0() * W * 0.62, hy = H * (0.17 + R0() * 0.07) * (1 - hx / W * 0.5) + u * 4; leaf(c, hx, hy, u * (3.4 + R0() * 2), PI / 2 + (R0() - 0.5) * 0.8 + Math.sin(t * 0.3 + i) * 0.02, i % 2 ? cr : shade(cr, 0.12)); }
    el(c, tx0 + u * 20, gy + u * 9, u * 30, u * 4, alpha(shade(gr, -0.4), 0.26)); /* its shade on the grass */
    /* the bench, empty */
    var bcx = W * 0.27, bcy = gy + u * 9.5, bw2 = Math.min(u * 36, W * 0.36);
    bench(c, bcx, bcy, bw2, u, tint(mix('#a98463', p.paper, 0.2), p, v));
    if (dusk) { var lx2 = bcx + bw2 * 0.66, ly2 = bcy + u * 0.6; glow(c, lx2, ly2 - u * 3, u * 18, '#ffd98a', 0.42 + 0.03 * Math.sin(t * 1.1)); Rn(c, lx2 - u * 1.7, ly2 - u * 5.4, u * 3.4, u * 5.4, u * 0.5, shade(p.ink, 0.12)); Rn(c, lx2 - u * 1.1, ly2 - u * 4.6, u * 2.2, u * 3.8, u * 0.3, '#ffe9a8'); Pg(c, [[lx2 - u * 2.1, ly2 - u * 5.2], [lx2 + u * 2.1, ly2 - u * 5.2], [lx2, ly2 - u * 7.4]], shade(p.ink, 0.12), true); }
    /* a birdbath at the right, a few fallen petals */
    var px = W * 0.86, pyy = gy + u * 10.5; el(c, px, pyy, u * 5, u * 1.2, alpha(shade(gr, -0.4), 0.3)); Rn(c, px - u * 3, pyy - u * 1.6, u * 6, u * 1.8, u * 0.6, shade(stone, -0.08)); quad(c, px - u * 1.3, pyy - u * 1.4, px + u * 1.3, pyy - u * 1.4, px + u * 0.9, pyy - u * 10, px - u * 0.9, pyy - u * 10, stone);
    el(c, px, pyy - u * 10.6, u * 6.4, u * 1.8, shade(stone, -0.1)); el(c, px, pyy - u * 11.2, u * 6.4, u * 1.6, shade(stone, 0.1)); el(c, px, pyy - u * 11.2, u * 5.2, u * 1.05, mix(p.bg, '#ffffff', 0.5));
    for (i = 0; i < 16; i++) el(c, R0() * W, gy + u * 6 + R0() * (H - gy - u * 8), u * 0.8, u * 0.4, alpha(soft[i % 2], 0.7), R0() * 3);
    vignette(c, W, H, dusk ? shade(p.bg, -0.4) : mix(p.bg, p.ink, 0.4), dusk ? 0.3 : 0.14);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- starhill: one tree on a hill, and all the stars ---------- */
  Art.add('backdrop', 'starhill', function (c, W, H, t, p, o, u) {
    var i, R0 = rnd(o.seed + 'sh'), nt = shade(p.bg, -0.5), hl = mix(shade(p.bg, -0.55), p.accent2, 0.06), tr = shade(p.bg, -0.72);
    vgrad(c, W, H, [nt, shade(p.bg, -0.22), mix(p.bg, p.bg2, 0.6), mix(p.bg2, p.snow, 0.14)], 0, H * 0.68);
    c.save(); c.translate(W * 0.42, H * 0.22); c.rotate(-0.55); c.scale(1, 0.2); glow(c, 0, 0, Math.max(W, H) * 0.62, p.snow, 0.12); glow(c, 0, 0, Math.max(W, H) * 0.34, mix(p.snow, p.accent2, 0.3), 0.1); c.restore(); /* the pale band across the sky */
    for (i = 0; i < 170; i++) { var x = R0() * W, y = R0() * R0() * H * 0.66 + R0() * H * 0.06, s = u * (0.1 + R0() * R0() * 0.36), tw = 0.72 + 0.28 * Math.sin(t * (0.25 + R0() * 0.5) + R0() * 6.3); c.globalAlpha = (0.35 + R0() * 0.6) * tw; c.fillStyle = i % 11 === 0 ? mix(p.gold, p.snow, 0.6) : p.snow; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    var bsx = W * 0.2, bsy = H * 0.085, bp = 1 + 0.05 * Math.sin(t * 0.5); glow(c, bsx, bsy, u * 13, p.snow, 0.3); K.twinkle(c, bsx, bsy, u * 3.2 * bp, '#ffffff'); dot(c, bsx, bsy, u * 0.6, '#ffffff'); /* one star brighter than the rest */
    glow(c, W * 0.62, H * 0.66, W * 0.75, mix(p.bg2, p.gold, 0.25), 0.2);
    hill(c, W, H, H * 0.61, u * 2.2, mix(hl, mix(p.bg, p.bg2, 0.6), 0.5), o.seed + 'f', 0.7);
    /* the hill, climbing to the right */
    var crx = W * 0.77, cry = H * 0.6, hy = function (x) { var d = (x - crx) / W; return cry + (d < 0 ? d * d * H * 0.2 : d * d * H * 0.5); };
    c.fillStyle = hl; c.beginPath(); c.moveTo(0, H); for (i = 0; i <= 30; i++) c.lineTo(i / 30 * W, hy(i / 30 * W)); c.lineTo(W, H); c.closePath(); c.fill();
    c.strokeStyle = alpha(p.snow, 0.13); c.lineWidth = Math.max(0.8, u * 0.4); c.beginPath(); for (i = 8; i <= 30; i++) { if (i === 8) c.moveTo(i / 30 * W, hy(i / 30 * W)); else c.lineTo(i / 30 * W, hy(i / 30 * W)); } c.stroke(); /* starlight on the brow */
    /* the tree */
    var tx = crx + u * 1, ty = hy(tx) + u * 0.6, th = Math.min(u * 36, H * 0.3);
    c.fillStyle = tr; c.beginPath(); c.moveTo(tx - th * 0.07, ty); c.quadraticCurveTo(tx - th * 0.03, ty - th * 0.3, tx - th * 0.035, ty - th * 0.55); c.lineTo(tx + th * 0.035, ty - th * 0.55); c.quadraticCurveTo(tx + th * 0.03, ty - th * 0.3, tx + th * 0.08, ty); c.closePath(); c.fill();
    c.strokeStyle = tr; c.lineCap = 'round'; var BR = [[-0.3, 0.72, 0.03], [0.32, 0.7, 0.03], [-0.16, 0.86, 0.022], [0.14, 0.9, 0.022], [-0.4, 0.56, 0.02], [0.42, 0.55, 0.02]];
    for (i = 0; i < 6; i++) { c.lineWidth = th * BR[i][2]; c.beginPath(); c.moveTo(tx, ty - th * 0.42); c.quadraticCurveTo(tx + BR[i][0] * th * 0.3, ty - th * 0.56, tx + BR[i][0] * th, ty - th * BR[i][1]); c.stroke(); }
    var CR = [[0, 0.82, 0.25], [-0.26, 0.7, 0.2], [0.27, 0.69, 0.2], [-0.42, 0.56, 0.13], [0.44, 0.55, 0.13], [-0.1, 0.96, 0.15], [0.14, 0.94, 0.14], [0, 0.66, 0.2]];
    for (i = 0; i < 8; i++) el(c, tx + CR[i][0] * th, ty - CR[i][1] * th, CR[i][2] * th * 1.12, CR[i][2] * th * 0.92, tr);
    c.strokeStyle = alpha(p.snow, 0.12); c.lineWidth = Math.max(0.8, u * 0.4); for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(tx + CR[i][0] * th, ty - CR[i][1] * th, CR[i][2] * th * 1.12, CR[i][2] * th * 0.92, 0, PI * 1.15, PI * 1.6); c.stroke(); }
    /* nearer ground: long grass and a few small pale flowers */
    hill(c, W, H, H * 0.8, u * 1.6, shade(hl, -0.2), o.seed + 'n', 0.6);
    c.strokeStyle = mix(hl, p.snow, 0.1); c.lineWidth = Math.max(0.6, u * 0.3); c.beginPath(); for (i = 0; i < 110; i++) { var gx = R0() * W, gy = hy(gx) + u * 2 + R0() * (H - hy(gx) - u * 3); c.moveTo(gx, gy); c.lineTo(gx + (R0() - 0.5) * u * 1.2, gy - u * (0.9 + R0() * 1.3)); } c.stroke();
    for (i = 0; i < 22; i++) { var fx = R0() * W, fy = hy(fx) + u * 3 + R0() * (H - hy(fx) - u * 4); dot(c, fx, fy, u * 1.5, alpha(p.snow, 0.07)); dot(c, fx, fy, u * 0.45, alpha(mix(p.snow, p.gold, 0.2), 0.75)); }
    vignette(c, W, H, shade(p.bg, -0.7), 0.34);
  }, { variants: ['night'], stage: 'band-low', pal: 'dark' });

  /* ================= gatherings and rooms ================= */
  function warmString(c, x1, y1, x2, y2, sag, n, u, t, lit, o) { /* a wire of small plain bulbs, all one warm white */
    var i, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag * 2, k = Math.exp(-5 * o.beat);
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.lineWidth = Math.max(0.6, u * 0.35); c.strokeStyle = 'rgba(70,60,60,0.7)'; c.stroke();
    for (i = 0; i < n; i++) { var f = (i + 0.5) / n, bx = (1 - f) * (1 - f) * x1 + 2 * (1 - f) * f * mx + f * f * x2, by = (1 - f) * (1 - f) * y1 + 2 * (1 - f) * f * my + f * f * y2 + u * 0.8, on = lit && (i + o.n) % 3 !== 0; if (lit) dot(c, bx, by, u * (2.4 + (on ? k * 0.5 : 0)), alpha('#ffd98a', on ? 0.3 : 0.16)); dot(c, bx, by, u * 0.8, lit ? (on ? '#fff3c8' : '#ffe2a0') : '#f4ecd8'); }
  }
  function chair(c, x, y, s, col, bow) { /* a white folding chair seen from behind; feet at (x, y) */
    L(c, x - s * 0.2, y - s * 0.5, x - s * 0.24, y, s * 0.05, shade(col, -0.22)); L(c, x + s * 0.2, y - s * 0.5, x + s * 0.24, y, s * 0.05, shade(col, -0.22));
    Rn(c, x - s * 0.25, y - s, s * 0.5, s * 0.5, s * 0.1, col); Rn(c, x - s * 0.17, y - s * 0.9, s * 0.34, s * 0.17, s * 0.05, shade(col, -0.12)); Rn(c, x - s * 0.28, y - s * 0.52, s * 0.56, s * 0.1, s * 0.04, shade(col, -0.07));
    if (bow) { el(c, x - s * 0.1, y - s * 0.62, s * 0.1, s * 0.06, bow, -0.4); el(c, x + s * 0.1, y - s * 0.62, s * 0.1, s * 0.06, bow, 0.4); dot(c, x, y - s * 0.62, s * 0.045, shade(bow, -0.2)); L(c, x, y - s * 0.6, x - s * 0.06, y - s * 0.4, s * 0.035, bow); L(c, x, y - s * 0.6, x + s * 0.07, y - s * 0.42, s * 0.035, bow); }
  }

  /* ---------- chapelgarden: an arch of flowers, an aisle, rows of white chairs; nothing of any one faith ---------- */
  Art.add('backdrop', 'chapelgarden', function (c, W, H, t, p, o, u) {
    var v = o.variant, dusk = v === 'dusk', i, j, s, R0 = rnd(o.seed + 'cg'), hz = H * 0.55, gy = H * 0.655, cx = W / 2;
    var gr = tint(mix('#7cbf68', p.accent2, 0.4), p, v), wh = tint(p.snow, p, v), fl = [p.snow, mix(p.accent, p.snow, 0.55), p.accent, mix(p.gold, p.snow, 0.45), mix(p.accent, p.gold, 0.5)];
    sky(c, W, H, p, v, hz + u * 3); if (dusk) K.skyStars(c, W, H, 26, o.seed, t, H * 0.2, '#fff4e0');
    if (dusk) glow(c, cx, hz, W * 0.7, '#ffcf9a', 0.4); else { sun(c, W * 0.85, H * 0.07, u * 5, '#fff0b0', 0.5); clouds(c, W, 4, o.seed, t, H * 0.05, H * 0.24, alpha(p.snow, 0.85), u, 0.004); }
    hill(c, W, H, hz - u * 5, u * 2.5, mix(gr, mix(p.bg, p.bg2, 0.7), 0.55), o.seed + 'a', 0.7);
    for (i = 0; i < 8; i++) { var e = i < 4 ? i : 11 - i, zx = e < 4 ? u * (3 + e * 8.5) : W - u * (3 + (e - 4) * 8.5), zh = u * (20 - (e % 4) * 2.4 + R0() * 3); el(c, zx, hz + u * 2 - zh / 2, u * 3, zh / 2, shade(gr, -0.3 + (i % 2) * 0.06)); } /* tall dark trees at the sides */
    c.fillStyle = shade(gr, -0.2); c.fillRect(0, hz, W, gy - hz + u); c.beginPath(); for (i = 0; i < 16; i++) { c.moveTo((i + 0.5) / 16 * W + u * 4.5, hz + u * 0.6); c.arc((i + 0.5) / 16 * W, hz + u * 0.6, u * 4.5, 0, TAU); } c.fill();
    blooms(c, cx, hz + u * 5, W, 46, fl, o.seed + 'h', u * 0.8);
    vgrad2(c, 0, gy, W, H - gy, gr, shade(gr, -0.2));
    c.fillStyle = shade(gr, 0.07); for (i = 0; i < 9; i++) c.fillRect(0, gy + (H - gy) * (i / 9) * (i / 9) + (i % 2 ? 0 : 0), W, (H - gy) * 0.03 * (i % 2)); /* mown stripes */
    /* the aisle and its petals */
    var ah = function (y) { return u * 6 + (y - gy) / (H - gy) * (W * 0.26 - u * 6); }, runner = tint(mix(p.paper, p.bg2, 0.14), p, v);
    quad(c, cx - ah(gy), gy, cx + ah(gy), gy, cx + ah(H), H, cx - ah(H), H, runner); quad(c, cx - ah(gy), gy, cx - ah(gy) + u * 1, gy, cx - ah(H) + u * 3, H, cx - ah(H), H, shade(runner, -0.1)); quad(c, cx + ah(gy), gy, cx + ah(gy) - u * 1, gy, cx + ah(H) - u * 3, H, cx + ah(H), H, shade(runner, -0.1));
    for (i = 0; i < 60; i++) { var pf = R0(), pyy = gy + u * 1 + pf * (H - gy - u * 2), side = i % 2 ? 1 : -1, pxx = cx + side * (ah(pyy) + (R0() - 0.6) * u * 5 * (0.4 + pf)); el(c, pxx, pyy, u * (0.5 + pf * 0.7), u * (0.25 + pf * 0.3), alpha(fl[i % 3], 0.9), R0() * 3); }
    /* the chairs, row behind row */
    var RW = [[0.06, 8], [0.25, 11.5], [0.52, 16], [0.92, 22]];
    for (j = 0; j < 4; j++) { var cy = gy + u * 4 + (H - gy - u * 4) * RW[j][0], cs = u * RW[j][1]; for (s = -1; s <= 1; s += 2) for (i = 3; i >= 0; i--) { var chx = cx + s * (ah(cy) + cs * 0.5 + i * cs * 0.66); el(c, chx, cy, cs * 0.3, cs * 0.05, 'rgba(0,0,0,0.12)'); chair(c, chx, cy, cs, wh, i === 0 ? (j % 2 ? p.gold : p.accent) : null); } }
    /* the arch: white posts dressed in leaves and flowers, heavier at the shoulders, light over the top */
    var aw = Math.min(W * 0.41, u * 41), ay = H * 0.27, ry = H * 0.235, N = 64, pts = [];
    for (i = 0; i <= N; i++) { var q = i / N, ax, ayy; if (q < 0.3) { ax = cx - aw; ayy = gy + u * 2 - (gy + u * 2 - ay) * (q / 0.3); } else if (q > 0.7) { ax = cx + aw; ayy = ay + (gy + u * 2 - ay) * ((q - 0.7) / 0.3); } else { var an = PI + (q - 0.3) / 0.4 * PI; ax = cx + Math.cos(an) * aw; ayy = ay + Math.sin(an) * ry; } pts.push([ax, ayy]); }
    c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); for (i = 0; i <= N; i++) { if (i) c.lineTo(pts[i][0], pts[i][1]); else c.moveTo(pts[i][0], pts[i][1]); } c.lineWidth = u * 2.6; c.strokeStyle = shade(wh, -0.16); c.stroke(); c.lineWidth = u * 1.5; c.strokeStyle = wh; c.stroke();
    for (i = 0; i <= N; i++) { var top = Math.abs(pts[i][0] - cx) < aw * 0.55, lx = pts[i][0] + (R0() - 0.5) * u * 3, ly = pts[i][1] + (R0() - 0.5) * u * 3, sw = Math.sin(t * 0.8 + i) * 0.04; leaf(c, lx, ly, u * (top ? 3.6 : 5.2), R0() * TAU + sw, shade(gr, -0.26)); leaf(c, lx, ly, u * (top ? 3.2 : 4.6), R0() * TAU + sw, shade(gr, -0.1)); }
    for (i = 0; i <= N; i++) { var top2 = Math.abs(pts[i][0] - cx) < aw * 0.55, r1 = R0(), r2 = R0(), r3 = R0(); if (top2 && i % 3) continue; K.bloom(c, pts[i][0] + (r1 - 0.5) * u * 3.4, pts[i][1] + (r2 - 0.5) * u * 3.4, u * (top2 ? 2 : 2.3 + r3 * 1.7), fl[i % 5], t * 0.5, i); }
    for (s = -1; s <= 1; s += 2) { var ux = cx + s * (aw + u * 0.4), uy = gy + u * 3.4; Pg(c, [[ux - u * 3.2, uy - u * 5.4], [ux + u * 3.2, uy - u * 5.4], [ux + u * 2.3, uy], [ux - u * 2.3, uy]], tint(mix('#c88a5a', p.gold, 0.2), p, v), true); Rn(c, ux - u * 3.7, uy - u * 6.2, u * 7.4, u * 1.5, u * 0.6, tint(mix('#d99a68', p.gold, 0.2), p, v)); bush(c, ux, uy - u * 5, u * 8, shade(gr, -0.14)); blooms(c, ux, uy - u * 6.6, u * 8, 7, fl, o.seed + 'u' + s, u * 1.1); }
    /* lights from the arch out to the edges; lanterns down the aisle at dusk */
    warmString(c, -u * 2, H * 0.035, cx - aw * 0.7, ay - ry * 0.72, u * 3, 6, u, t, dusk, o); warmString(c, cx + aw * 0.7, ay - ry * 0.72, W + u * 2, H * 0.035, u * 3, 6, u, t, dusk, o);
    if (dusk) { for (j = 0; j < 3; j++) for (s = -1; s <= 1; s += 2) { var ly2 = gy + u * 2 + (H - gy) * [0.02, 0.17, 0.4][j], ls = u * [1.3, 1.9, 2.8][j], lx2 = cx + s * (ah(ly2) - ls * 1.4); glow(c, lx2, ly2 - ls * 1.4, ls * 8, '#ffd98a', 0.4 + 0.04 * Math.sin(t * 1.4 + j + s)); Rn(c, lx2 - ls * 0.8, ly2 - ls * 2.6, ls * 1.6, ls * 2.6, ls * 0.2, shade(p.ink, 0.12)); Rn(c, lx2 - ls * 0.5, ly2 - ls * 2.2, ls, ls * 1.8, ls * 0.15, '#ffe9a8'); Pg(c, [[lx2 - ls, ly2 - ls * 2.5], [lx2 + ls, ly2 - ls * 2.5], [lx2, ly2 - ls * 3.5]], shade(p.ink, 0.12), true); } vignette(c, W, H, shade(p.bg, -0.4), 0.28); }
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- hospitalroom: a bright recovery room: the window, flowers, balloons, a made bed ---------- */
  Art.add('backdrop', 'hospitalroom', function (c, W, H, t, p, o, u) {
    var i, s, R0 = rnd(o.seed + 'hr'), fl = H * 0.7, dk = dark(p), wall = mix(mix(p.bg, p.paper, dk ? 0.3 : 0.62), p.bg2, 0.15), trim = mix(p.snow, wall, 0.12), flo = mix(mix('#e6dccb', p.bg2, 0.25), wall, dk ? 0.5 : 0.1), cols = [p.accent, p.gold, p.accent2];
    c.fillStyle = wall; c.fillRect(0, 0, W, fl); vgrad2(c, 0, 0, W, fl, alpha('#ffffff', 0.16), alpha('#ffffff', 0));
    var wn = fl - u * 15; Rn(c, 0, wn, W, fl - wn, 0, mix(wall, p.accent2, 0.22)); Rn(c, 0, wn - u * 1.2, W, u * 1.4, 0, trim); Rn(c, 0, fl - u * 2.4, W, u * 2.4, 0, trim); /* a band of colour along the wall, a skirting */
    /* the window at the left: a sunny day outside */
    var ww = Math.min(W * 0.36, u * 36), wh = Math.min(H * 0.22, ww * 1.15), wx = u * 7, wy = H * 0.1;
    glow(c, wx + ww * 0.5, wy + wh * 0.5, ww * 1.6, '#fff6d0', 0.34);
    pane(c, wx, wy, ww, wh, u, trim, mix(p.bg, '#8fcdf2', 0.5), mix('#dff2fb', p.bg2, 0.2), function () {
      dot(c, wx + ww * 0.74, wy + wh * 0.24, u * 3.4, '#ffe9a0'); glow(c, wx + ww * 0.74, wy + wh * 0.24, u * 11, '#fff3c0', 0.5);
      cloud(c, wx + frac(0.2 + t * 0.006) * (ww + u * 20) - u * 10, wy + wh * 0.3, u * 12, 'rgba(255,255,255,0.95)'); cloud(c, wx + frac(0.7 + t * 0.004) * (ww + u * 20) - u * 10, wy + wh * 0.52, u * 9, 'rgba(255,255,255,0.85)');
      el(c, wx + ww * 0.3, wy + wh * 1.04, ww * 0.6, wh * 0.2, mix('#8cc27a', p.accent2, 0.3)); el(c, wx + ww * 0.86, wy + wh * 1.05, ww * 0.5, wh * 0.26, mix('#74b266', p.accent2, 0.3)); tree(c, wx + ww * 0.2, wy + wh * 0.96, wh * 0.52, mix('#5fa85a', p.accent2, 0.3), '#7a5a40', Math.sin(t * 0.7) * u * 0.1);
    });
    for (s = 0; s < 2; s++) { var kx = s ? wx + ww + u * 1.4 : wx - u * 5.6, cc = mix(p.gold, p.paper, 0.5); for (i = 0; i < 3; i++) { c.fillStyle = i % 2 ? shade(cc, -0.08) : cc; c.beginPath(); c.moveTo(kx + i * u * 1.4, wy - u * 3); c.lineTo(kx + (i + 1) * u * 1.4 + 0.5, wy - u * 3); c.lineTo(kx + (i + 1) * u * 1.4 + 0.5 + Math.sin(t * 0.6 + i + s) * u * 0.14, wy + wh + u * 5); c.lineTo(kx + i * u * 1.4, wy + wh + u * 5); c.closePath(); c.fill(); } }
    Rn(c, wx - u * 7.5, wy - u * 4.4, ww + u * 15, u * 1.5, u * 0.7, shade(trim, -0.12));
    /* a child's rainbow taped up, a clock */
    c.save(); c.translate(W - u * 17, H * 0.16); c.rotate(0.05); Rn(c, -u * 8, -u * 6.5, u * 16, u * 13, u * 0.5, p.paper); c.lineWidth = u * 1.25; c.lineCap = 'butt'; var rb = [p.accent, p.gold, p.accent2, mix(p.bg, '#58a4e0', 0.6)]; for (i = 0; i < 4; i++) { c.beginPath(); c.arc(0, u * 3.6, u * (6.4 - i * 1.25), PI, 0); c.strokeStyle = rb[i]; c.stroke(); } dot(c, -u * 6.2, u * 3.8, u * 1.5, '#ffffff'); dot(c, u * 6.2, u * 3.8, u * 1.5, '#ffffff'); Rn(c, -u * 2.2, -u * 7.3, u * 4.4, u * 1.7, 0, alpha(p.gold, 0.7)); c.restore(); c.lineCap = 'round';
    /* the curtain on its rail, drawn back at the right */
    var rail = H * 0.345, cw = u * 11, cb = fl - u * 5, cur = mix(p.accent2, p.paper, 0.55);
    Rn(c, W * 0.52, rail - u * 0.5, W * 0.5, u * 0.8, u * 0.4, shade(trim, -0.22));
    for (i = 0; i < 6; i++) { var fx = W - cw + i * cw / 6, sw = Math.sin(t * 0.5 + i) * u * 0.18; c.fillStyle = i % 2 ? shade(cur, -0.1) : cur; c.beginPath(); c.moveTo(fx, rail); c.lineTo(fx + cw / 6 + 0.6, rail); c.lineTo(fx + cw / 6 + 0.6 + sw, cb); c.quadraticCurveTo(fx + cw / 12 + sw, cb + u * 1.5, fx + sw, cb); c.closePath(); c.fill(); dot(c, fx + cw / 12, rail, u * 0.6, shade(trim, -0.3)); }
    /* the floor */
    vgrad2(c, 0, fl, W, H - fl, flo, shade(flo, -0.1)); c.strokeStyle = shade(flo, -0.1); c.lineWidth = Math.max(0.6, u * 0.22); c.beginPath(); for (i = -8; i <= 8; i++) { c.moveTo(W / 2 + i * W * 0.09, fl); c.lineTo(W / 2 + i * W * 0.17, H); } for (i = 1; i < 5; i++) { var ty = fl + (H - fl) * (i / 5) * (0.5 + i / 10); c.moveTo(0, ty); c.lineTo(W, ty); } c.stroke();
    quad(c, wx + u * 2, fl + u * 1, wx + ww * 0.9, fl + u * 1, wx + ww * 1.4, fl + (H - fl) * 0.5, wx + u * 9, fl + (H - fl) * 0.5, alpha('#fff6d0', 0.22)); /* sun on the floor */
    /* the bed along the right, made up and bright */
    var rgy = fl + (H - fl) * 0.62; el(c, W / 2, rgy, W * 0.37, (H - fl) * 0.27, mix(p.accent2, flo, 0.45)); el(c, W / 2, rgy, W * 0.33, (H - fl) * 0.23, mix(p.paper, flo, 0.3)); c.beginPath(); c.ellipse(W / 2, rgy, W * 0.27, (H - fl) * 0.18, 0, 0, TAU); c.setLineDash([u * 1.6, u * 1.6]); c.lineWidth = u * 0.7; c.strokeStyle = mix(p.gold, flo, 0.3); c.stroke(); c.setLineDash([]);
    var k = H > W * 1.3 ? 1.45 : 1; c.save(); c.translate(W, fl); c.scale(k, k); c.translate(-W, -fl);
    var bx = W - W * 0.47 / k, bt = fl - u * 9, bl = fl + u * 6.5, quilt = mix(p.accent, p.paper, 0.25);
    el(c, (bx + W) / 2, bl + u * 0.4, (W - bx) * 0.56, u * 1.6, 'rgba(0,0,0,0.12)');
    Rn(c, W - u * 5, bt - u * 13, u * 7, bl - bt + u * 13, u * 1.6, shade(trim, -0.16)); Rn(c, bx + u * 1.4, bl - u * 5, u * 1.6, u * 5, 0, shade(trim, -0.3)); dot(c, bx + u * 2.2, bl - u * 0.6, u * 1.2, shade(p.ink, 0.3));
    Rn(c, bx, bt + u * 1, W - bx, u * 8, u * 1.6, p.snow); Rn(c, bx, bt + u * 6.4, W - bx, u * 2.8, u * 0.8, shade(trim, -0.2));
    Rn(c, W - u * 21, bt - u * 3.4, u * 16, u * 5.6, u * 2.6, p.snow); Rn(c, W - u * 21, bt - u * 0.4, u * 16, u * 2.6, u * 1.3, shade(p.snow, -0.08));
    Rn(c, bx - u * 0.6, bt, (W - bx) * 0.62, u * 8.6, u * 1.8, quilt); Rn(c, bx + (W - bx) * 0.5, bt, (W - bx) * 0.13, u * 8.6, u * 1.2, p.paper);
    for (i = 0; i < 9; i++) { var qx = bx + u * 2.4 + (i % 5) * (W - bx) * 0.1 + (i > 4 ? u * 2.2 : 0), qy = bt + u * (i > 4 ? 6 : 2.6); K.starPath(c, qx, qy, u * 1.1, u * 0.5, 5, 0); c.fillStyle = alpha(p.paper, 0.75); c.fill(); }
    Rn(c, bx - u * 1.6, bt - u * 3.5, u * 2.2, bl - bt + u * 3.5, u * 1, shade(trim, -0.16)); Rn(c, bx - u * 1.2, bt - u * 0.6, u * 7, u * 5.4, u * 0.6, p.paper); L(c, bx + u * 0.2, bt + u * 1, bx + u * 4.4, bt + u * 1, u * 0.35, alpha(p.ink, 0.4)); L(c, bx + u * 0.2, bt + u * 2.4, bx + u * 3.4, bt + u * 2.4, u * 0.35, alpha(p.ink, 0.4)); Rn(c, bx + u * 1, bt - u * 1.2, u * 2.6, u * 1.1, u * 0.4, p.gold); /* the chart at the foot */
    /* three balloons tied to the bed head */
    for (i = 0; i < 3; i++) { var ax = W - u * (5.5 + i * 6.2) + Math.sin(t * 0.9 + i * 2) * u * 0.7, ay = bt - u * (30 - (i % 2) * 4.5) + Math.cos(t * 0.8 + i) * u * 0.5; c.beginPath(); c.moveTo(ax, ay + u * 5.6); c.quadraticCurveTo(ax + u * 1.4, ay + u * 12, W - u * 3, bt - u * 12.6); c.lineWidth = Math.max(0.6, u * 0.25); c.strokeStyle = alpha(p.ink, 0.4); c.stroke(); Pg(c, [[ax - u * 0.9, ay + u * 6.4], [ax + u * 0.9, ay + u * 6.4], [ax, ay + u * 4.8]], shade(cols[i], -0.14), true); el(c, ax, ay, u * 4.4, u * 5.5, cols[i]); el(c, ax - u * 1.5, ay - u * 2.2, u * 1, u * 0.6, 'rgba(255,255,255,0.6)', -0.6); }
    /* the bedside table at the left: flowers, a card, a cup */
    c.restore(); c.save(); c.translate(0, fl); c.scale(k, k); c.translate(0, -fl);
    var tx = u * 4, tt = fl - u * 10, tw = u * 22, wood = mix(mix('#c99a6a', p.gold, 0.15), wall, dk ? 0.3 : 0);
    el(c, tx + tw / 2, fl + u * 5.4, tw * 0.56, u * 1.3, 'rgba(0,0,0,0.12)'); Rn(c, tx + u * 1, tt, tw - u * 2, u * 15, u * 0.8, wood); Rn(c, tx + u * 2.4, tt + u * 3, tw - u * 4.8, u * 4.6, u * 0.6, shade(wood, -0.1)); Rn(c, tx + u * 2.4, tt + u * 9, tw - u * 4.8, u * 4.6, u * 0.6, shade(wood, -0.1)); dot(c, tx + tw / 2, tt + u * 5.3, u * 0.7, p.gold); dot(c, tx + tw / 2, tt + u * 11.3, u * 0.7, p.gold); Rn(c, tx, tt - u * 0.6, tw, u * 1.8, u * 0.7, shade(wood, 0.14));
    var vx = tx + u * 7, vy = tt - u * 0.6;
    for (i = 0; i < 7; i++) { var an = -PI / 2 + (i - 3) * 0.3, len = u * (9 + (i % 3) * 2.4), hx = vx + Math.cos(an) * len, hy = vy - u * 5 + Math.sin(an) * len; L(c, vx, vy - u * 5, hx, hy, u * 0.45, mix('#4f9a5a', p.accent2, 0.4)); if (i % 2) leaf(c, vx + Math.cos(an) * len * 0.5, vy - u * 5 + Math.sin(an) * len * 0.5, u * 4, an + 0.9, mix('#5fa85a', p.accent2, 0.4)); }
    for (i = 0; i < 7; i++) { var an2 = -PI / 2 + (i - 3) * 0.3, len2 = u * (9 + (i % 3) * 2.4); K.bloom(c, vx + Math.cos(an2) * len2, vy - u * 5 + Math.sin(an2) * len2, u * (2.5 + (i % 2) * 0.6), [p.accent, p.gold, p.snow, mix(p.accent, p.snow, 0.5)][i % 4], t * 0.4, i); }
    Pg(c, [[vx - u * 2.6, vy - u * 6.4], [vx + u * 2.6, vy - u * 6.4], [vx + u * 1.9, vy], [vx - u * 1.9, vy]], mix(p.bg, '#bfe6f5', 0.6), true); Rn(c, vx - u * 2.1, vy - u * 3.4, u * 4.2, u * 3.2, u * 0.5, alpha('#ffffff', 0.3));
    c.save(); c.translate(tx + u * 15.4, vy); c.rotate(-0.06); Rn(c, -u * 3, -u * 7.6, u * 6, u * 7.6, u * 0.4, p.paper); K.heartPath(c, 0, -u * 4, u * 3); c.fillStyle = p.accent; c.fill(); c.restore();
    Rn(c, tx + u * 18.4, vy - u * 3.2, u * 2.8, u * 3.2, u * 0.5, p.snow); Rn(c, tx + u * 18.4, vy - u * 2.2, u * 2.8, u * 0.8, 0, p.accent2);
    c.restore();
  }, { variants: ['day'], stage: 'cast-low', pal: 'light' });

  /* ---------- nurseryroom: an everyday nursery: the cot and its mobile, a rocking chair, a window ---------- */
  Art.add('backdrop', 'nurseryroom', function (c, W, H, t, p, o, u) {
    var v = o.variant, night = v === 'night', i, j, R0 = rnd(o.seed + 'nr'), fl = H * 0.7, dk = dark(p), k = H > W * 1.3 ? 1.4 : 1;
    var wall = night ? mix(p.bg, p.bg2, 0.35) : mix(mix(p.bg, p.paper, dk ? 0.3 : 0.62), p.bg2, 0.12), trim = night ? mix(p.snow, wall, 0.45) : mix(p.snow, wall, 0.08), P4 = [mix(p.accent, p.paper, 0.6), mix(p.gold, p.paper, 0.5), mix(p.accent2, p.paper, 0.55), mix(p.bg, p.paper, 0.45)];
    var pc = function (n) { return night ? mix(P4[n % 4], wall, 0.3) : P4[n % 4]; }, wood = night ? mix(p.snow, wall, 0.36) : p.snow, flo = mix(mix('#e6cfab', p.bg2, 0.25), wall, night ? 0.55 : dk ? 0.4 : 0.05);
    c.fillStyle = wall; c.fillRect(0, 0, W, fl); vgrad2(c, 0, 0, W, fl, alpha('#ffffff', night ? 0 : 0.14), alpha('#ffffff', 0));
    for (j = 0; j * u * 10 < fl - u * 18; j++) for (i = -1; i * u * 10 < W + u * 10; i++) { var sx = i * u * 10 + (j % 2) * u * 5, sy = j * u * 10 + u * 4, gl = night && (i * 3 + j * 5) % 4 === 0; K.twinkle(c, sx, sy, u * (gl ? 1.7 : 1.3), gl ? alpha(mix(p.gold, '#eaffc8', 0.5), 0.5 + 0.2 * Math.sin(t * 0.7 + i + j)) : alpha(p.snow, night ? 0.1 : 0.4)); } /* little stars on the wallpaper; a few glow in the dark */
    var wn = fl - u * 17; Rn(c, 0, wn, W, fl - wn, 0, mix(wall, wood, 0.6)); c.fillStyle = alpha(p.ink, 0.07); for (i = 0; i * u * 6 < W; i++) c.fillRect(i * u * 6, wn + u * 1.4, Math.max(0.6, u * 0.25), fl - wn); Rn(c, 0, wn - u * 0.6, W, u * 1.8, u * 0.5, wood); Rn(c, 0, fl - u * 2, W, u * 2, 0, wood);
    /* the window */
    var ww = Math.min(W * 0.34, u * 34), wh = Math.min(H * 0.2, ww * 1.1), wx = W - u * 9 - ww, wy = H * 0.1;
    glow(c, wx + ww / 2, wy + wh / 2, ww * 1.5, night ? '#cfdcff' : '#fff6d0', night ? 0.2 : 0.34);
    pane(c, wx, wy, ww, wh, u, wood, night ? shade(p.bg, -0.45) : mix(p.bg, '#8fcdf2', 0.5), night ? mix(p.bg, p.bg2, 0.5) : mix('#dff2fb', p.bg2, 0.2), function () {
      if (night) { for (i = 0; i < 16; i++) dot(c, wx + frac(i * 0.618) * ww, wy + frac(i * 0.377) * wh * 0.8, u * (0.25 + (i % 3) * 0.12), alpha('#ffffff', 0.6 + 0.3 * Math.sin(t * 0.8 + i))); glow(c, wx + ww * 0.3, wy + wh * 0.3, u * 12, '#fff3c8', 0.4); c.save(); c.translate(wx + ww * 0.3, wy + wh * 0.3); c.rotate(-0.4); K.crescent(c, 0, 0, u * 4.2, '#ffeeb0'); c.restore(); }
      else { cloud(c, wx + frac(0.3 + t * 0.005) * (ww + u * 20) - u * 10, wy + wh * 0.3, u * 12, 'rgba(255,255,255,0.95)'); cloud(c, wx + frac(0.8 + t * 0.004) * (ww + u * 20) - u * 10, wy + wh * 0.6, u * 9, 'rgba(255,255,255,0.85)'); }
      el(c, wx + ww * 0.4, wy + wh * 1.06, ww * 0.7, wh * 0.2, night ? shade(p.bg, -0.5) : mix('#8cc27a', p.accent2, 0.3));
    });
    for (j = 0; j < 2; j++) { var kx = j ? wx + ww + u * 1.4 : wx - u * 6.4; c.fillStyle = pc(1); c.beginPath(); c.moveTo(kx, wy - u * 3); c.lineTo(kx + u * 5, wy - u * 3); c.quadraticCurveTo(kx + u * (j ? 4.6 : 5.4), wy + wh * 0.4, kx + u * (j ? 1.4 : 3.6), wy + wh * 0.62); c.lineTo(kx + u * (j ? 0 : 5), wy + wh + u * 4.6); c.lineTo(kx + u * (j ? 0 : 5) + (j ? u * 4.6 : -u * 4.6), wy + wh + u * 4.6); c.quadraticCurveTo(kx + u * (j ? 4.4 : 0.6), wy + wh * 0.5, kx + (j ? u * 5 : 0), wy + u * 4); c.closePath(); c.fill(); Rn(c, kx + u * (j ? 0.4 : 2.4), wy + wh * 0.58, u * 2.4, u * 1.2, u * 0.6, pc(0)); }
    Rn(c, wx - u * 8, wy - u * 4.4, ww + u * 16, u * 1.5, u * 0.7, wood);
    /* the floor and a round rug with a scalloped edge */
    vgrad2(c, 0, fl, W, H - fl, flo, shade(flo, -0.12)); c.strokeStyle = shade(flo, -0.12); c.lineWidth = Math.max(0.6, u * 0.22); c.beginPath(); for (i = 1; i < 6; i++) { var py = fl + (H - fl) * (i / 6) * (0.45 + i / 11); c.moveTo(0, py); c.lineTo(W, py); c.moveTo(frac(i * 0.37) * W, py); c.lineTo(frac(i * 0.37) * W, py + (H - fl) * 0.12); } c.stroke();
    if (night) quad(c, wx - u * 4, fl + u * 1, wx + ww * 0.7, fl + u * 1, wx + ww * 0.3, fl + (H - fl) * 0.6, wx - ww * 0.5, fl + (H - fl) * 0.6, alpha('#cfdcff', 0.13)); /* moonlight on the floor */
    var rgy = fl + (H - fl) * 0.6, rx = W * 0.36, ry = (H - fl) * 0.26; c.fillStyle = pc(2); c.beginPath(); for (i = 0; i < 28; i++) { var an = i / 28 * TAU, ex = W / 2 + Math.cos(an) * rx, ey = rgy + Math.sin(an) * ry; c.moveTo(ex + u * 2.2, ey); c.ellipse(ex, ey, u * 2.2, u * 1.3, 0, 0, TAU); } c.fill(); el(c, W / 2, rgy, rx, ry, pc(2)); el(c, W / 2, rgy, rx * 0.86, ry * 0.84, night ? mix(p.paper, wall, 0.5) : p.paper); el(c, W / 2, rgy, rx * 0.6, ry * 0.56, pc(1)); K.starPath(c, W / 2, rgy, rx * 0.3, rx * 0.13, 5, 0); c.save(); c.translate(W / 2, rgy); c.scale(1, ry / rx); c.translate(-W / 2, -rgy); K.starPath(c, W / 2, rgy, rx * 0.36, rx * 0.16, 5, 0); c.fillStyle = night ? mix(p.paper, wall, 0.4) : p.paper; c.fill(); c.restore();
    /* the cot at the left, a blanket over its rail, the mobile turning above */
    c.save(); c.translate(0, fl); c.scale(k, k); c.translate(0, -fl);
    var cx0 = u * 3.5, cw = u * 34, cb = fl + u * 5.5, ct = fl - u * 15, d = shade(wood, -0.14);
    el(c, cx0 + cw / 2, cb + u * 0.3, cw * 0.56, u * 1.5, 'rgba(0,0,0,0.12)');
    Rn(c, cx0 + u * 1, cb - u * 9.5, cw - u * 2, u * 4, u * 1, pc(3)); Rn(c, cx0 + u * 1, cb - u * 11.2, cw - u * 2, u * 2.6, u * 1.2, night ? mix(p.paper, wall, 0.4) : p.paper); Rn(c, cx0 + u * 3, cb - u * 13.4, u * 8.5, u * 3.2, u * 1.5, pc(0));
    for (i = 0; i < 11; i++) Rn(c, cx0 + u * 2.3 + i * (cw - u * 5.6) / 10, ct, u * 1, cb - ct - u * 5.2, u * 0.5, i % 2 ? wood : d);
    Rn(c, cx0, ct - u * 0.8, cw, u * 1.9, u * 0.9, wood); Rn(c, cx0, cb - u * 6, cw, u * 1.9, u * 0.9, d);
    for (j = 0; j < 2; j++) { var ex2 = cx0 + (j ? cw - u * 2.2 : 0); Rn(c, ex2, ct - u * 4, u * 2.2, cb - ct + u * 4, u * 0.9, wood); dot(c, ex2 + u * 1.1, ct - u * 4.6, u * 1.6, wood); dot(c, ex2 + u * 0.7, ct - u * 5, u * 0.6, alpha('#ffffff', night ? 0.2 : 0.7)); }
    c.fillStyle = pc(0); c.beginPath(); c.moveTo(cx0 + cw * 0.5, ct - u * 1); c.lineTo(cx0 + cw * 0.86, ct - u * 1); c.lineTo(cx0 + cw * 0.86, ct + u * 8); c.quadraticCurveTo(cx0 + cw * 0.77, ct + u * 9.6, cx0 + cw * 0.68, ct + u * 8); c.quadraticCurveTo(cx0 + cw * 0.59, ct + u * 6.4, cx0 + cw * 0.5, ct + u * 8); c.closePath(); c.fill(); for (i = 0; i < 6; i++) dot(c, cx0 + cw * (0.56 + (i % 3) * 0.12), ct + u * (1.6 + Math.floor(i / 3) * 3.4), u * 0.7, alpha(p.paper, 0.8));
    var mx = cx0 + cw * 0.46, my = ct - u * 27; c.beginPath(); c.moveTo(cx0 + u * 1.1, ct - u * 5); c.quadraticCurveTo(cx0 + u * 1, my - u * 3, mx, my); c.lineWidth = u * 0.8; c.strokeStyle = wood; c.stroke();
    L(c, mx - u * 9, my + u * 1.6, mx + u * 9, my + u * 1.6, u * 0.6, wood); L(c, mx, my, mx, my + u * 1.6, u * 0.5, wood);
    for (i = 0; i < 4; i++) { var hx = mx + (i - 1.5) * u * 6, len = u * (6 + (i % 2) * 3.4), sw = Math.sin(t * 0.8 + i * 1.6) * u * 0.7, hy = my + u * 1.6 + len; L(c, hx, my + u * 1.6, hx + sw, hy, Math.max(0.6, u * 0.22), alpha(p.ink, night ? 0.5 : 0.35)); c.save(); c.translate(hx + sw, hy + u * 1.8); c.rotate(sw / u * 0.12); if (i === 0) { K.starPath(c, 0, 0, u * 2.4, u * 1.1, 5, 0); c.fillStyle = night ? mix(p.gold, wall, 0.25) : p.gold; c.fill(); } else if (i === 1) { c.rotate(-0.5); K.crescent(c, 0, 0, u * 2.2, pc(3)); } else if (i === 2) cloud(c, 0, 0, u * 5.6, night ? mix(p.snow, wall, 0.35) : '#ffffff'); else { K.heartPath(c, 0, 0, u * 3.8); c.fillStyle = pc(0); c.fill(); } c.restore(); }
    c.restore();
    /* the rocking chair and a lamp at the right */
    c.save(); c.translate(W, fl); c.scale(k, k); c.translate(-W, -fl);
    var rc = W - u * 18, rb = fl + u * 6, rk = Math.sin(t * 0.6) * 0.012, lx = W - u * 4.5, lt = fl - u * 25;
    Rn(c, lx - u * 0.4, lt, u * 0.8, rb - lt - u * 1, 0, d); el(c, lx, rb - u * 1.2, u * 3, u * 0.9, d); if (night) { glow(c, lx, lt - u * 1, u * 34, '#ffd98a', 0.6 + 0.02 * Math.sin(t * 1.2)); el(c, lx - u * 6, rb, u * 16, u * 3, alpha('#ffd98a', 0.16)); } Pg(c, [[lx - u * 4.4, lt + u * 1.6], [lx + u * 4.4, lt + u * 1.6], [lx + u * 2.8, lt - u * 4.6], [lx - u * 2.8, lt - u * 4.6]], night ? '#ffe9a8' : pc(1), true);
    el(c, rc, rb + u * 0.4, u * 12, u * 1.3, 'rgba(0,0,0,0.12)');
    c.translate(rc, rb); c.rotate(rk); c.translate(-rc, -rb);
    c.beginPath(); c.moveTo(rc - u * 11.5, rb - u * 2.2); c.quadraticCurveTo(rc, rb + u * 2, rc + u * 11.5, rb - u * 2.6); c.lineWidth = u * 1.3; c.lineCap = 'round'; c.strokeStyle = d; c.stroke();
    L(c, rc - u * 6.5, rb - u * 0.4, rc - u * 6, rb - u * 9, u * 1.2, d); L(c, rc + u * 6.5, rb - u * 0.6, rc + u * 6, rb - u * 9, u * 1.2, d);
    for (i = 0; i < 5; i++) Rn(c, rc + u * 0.4 + i * u * 1.9, rb - u * 27, u * 1, u * 18, u * 0.5, i % 2 ? d : wood); Rn(c, rc - u * 0.8, rb - u * 28.4, u * 11.4, u * 2.6, u * 1.3, wood); Rn(c, rc - u * 0.2, rb - u * 27, u * 1.5, u * 19, u * 0.6, wood); Rn(c, rc + u * 8.4, rb - u * 27, u * 1.5, u * 19, u * 0.6, wood);
    Rn(c, rc - u * 8.5, rb - u * 10.6, u * 19, u * 2.4, u * 1.1, wood); Rn(c, rc - u * 7.6, rb - u * 13.4, u * 15.6, u * 3.4, u * 1.7, pc(2)); Rn(c, rc + u * 1.8, rb - u * 23, u * 8, u * 10, u * 2.4, pc(0)); K.heartPath(c, rc + u * 5.8, rb - u * 18, u * 3); c.fillStyle = alpha(p.paper, 0.8); c.fill();
    L(c, rc - u * 7.4, rb - u * 10, rc - u * 7.8, rb - u * 16, u * 1.1, d); Rn(c, rc - u * 9, rb - u * 17, u * 11, u * 1.7, u * 0.8, wood);
    c.restore();
    /* toys at the front: plain blocks, stacking rings, a ball */
    var by = H * 0.955, bs = u * 5 * k, bx = W * 0.29; Rn(c, bx, by - bs, bs, bs, bs * 0.14, pc(0)); Rn(c, bx + bs * 1.06, by - bs, bs, bs, bs * 0.14, pc(3)); Rn(c, bx + bs * 0.5, by - bs * 2.03, bs, bs, bs * 0.14, pc(1)); dot(c, bx + bs * 0.5, by - bs * 0.5, bs * 0.2, alpha(p.paper, 0.7)); K.starPath(c, bx + bs, by - bs * 1.53, bs * 0.26, bs * 0.12, 5, 0); c.fillStyle = alpha(p.paper, 0.8); c.fill(); Rn(c, bx + bs * 1.3, by - bs * 0.72, bs * 0.5, bs * 0.44, bs * 0.08, alpha(p.paper, 0.7));
    var sxx = W * 0.66; for (i = 0; i < 4; i++) Rn(c, sxx - bs * (0.9 - i * 0.17), by - bs * 0.42 * (i + 1), bs * (1.8 - i * 0.34), bs * 0.44, bs * 0.22, pc(i + 1)); dot(c, sxx, by - bs * 1.86, bs * 0.26, night ? mix(p.gold, wall, 0.3) : p.gold);
    dot(c, sxx + bs * 2.2, by - bs * 0.62, bs * 0.62, pc(0)); c.beginPath(); c.arc(sxx + bs * 2.2, by - bs * 0.62, bs * 0.62, -0.5, 1.2); c.arc(sxx + bs * 2.6, by - bs * 1.1, bs * 0.7, 1.9, 2.9); c.closePath(); c.fillStyle = pc(1); c.fill();
    if (night) { c.fillStyle = alpha(shade(p.bg, -0.5), 0.14); c.fillRect(0, 0, W, H); vignette(c, W, H, shade(p.bg, -0.6), 0.34); }
  }, { variants: ['day', 'night'], stage: 'cast-low' });

  /* ---------- welcomehome: the porch dressed for someone coming home: yellow ribbons, a blank banner, the light on.
     No flag, no insignia, no words: it belongs to whoever is coming home. ---------- */
  function ribbon(c, x, y, s, col, t, ph) {
    var d = shade(col, -0.2), sw = Math.sin(t * 1.1 + ph) * 0.07, g;
    for (g = -1; g <= 1; g += 2) { c.save(); c.translate(x, y); c.rotate(g * 0.3 + sw); Pg(c, [[-s * 0.12, 0], [s * 0.12, 0], [s * 0.17, s * 1.0], [0, s * 0.84], [-s * 0.17, s * 1.0]], g < 0 ? d : col, true); c.restore(); }
    for (g = -1; g <= 1; g += 2) { c.save(); c.translate(x, y); c.rotate(g * -0.32); el(c, g * s * 0.38, 0, s * 0.4, s * 0.22, col); el(c, g * s * 0.4, 0, s * 0.22, s * 0.1, d); c.restore(); }
    Rn(c, x - s * 0.11, y - s * 0.13, s * 0.22, s * 0.26, s * 0.08, shade(col, 0.16));
  }
  Art.add('backdrop', 'welcomehome', function (c, W, H, t, p, o, u) {
    var v = o.variant, dusk = v === 'dusk', i, s, R0 = rnd(o.seed + 'wh'), pf = H * 0.655, st = H * 0.8, cx = W / 2, q = u * (H > W * 1.3 ? 1.35 : 1);
    var wall = tint(mix(p.paper, p.bg2, 0.25), p, v), trim = tint(p.snow, p, v), yel = mix('#ffd21f', p.gold, 0.35), gr = tint(mix('#7cbf68', p.accent2, 0.4), p, v), glass = dusk ? '#ffdf8a' : mix(p.bg, '#ffffff', 0.6), board = tint(mix('#b89a7c', p.bg2, 0.2), p, v), door = tint(p.accent, p, v);
    c.fillStyle = wall; c.fillRect(0, 0, W, pf); c.fillStyle = shade(wall, -0.07); for (i = 1; i * u * 3.4 < pf; i++) c.fillRect(0, i * u * 3.4, W, Math.max(0.6, u * 0.3));
    vgrad2(c, 0, 0, W, H * 0.3, alpha(shade(p.bg, -0.5), dusk ? 0.42 : 0.2), alpha(shade(p.bg, -0.5), 0)); /* the shade under the porch roof */
    /* windows with shutters, either side */
    var ww = q * 17, wh = q * 25, wy = pf - wh - q * 9;
    for (s = 0; s < 2; s++) { var wx = s ? W - u * 17 - ww : u * 17; if (dusk) lampGlow(c, wx + ww / 2, wy + wh / 2, ww * 1.6, 0.34, t, s); pane(c, wx, wy, ww, wh, q, trim, glass, dusk ? '#ffc76a' : mix(p.bg2, '#ffffff', 0.6)); Rn(c, wx - q * 5.6, wy - q, q * 3.6, wh + q * 2, q * 0.4, tint(p.accent2, p, v)); Rn(c, wx + ww + q * 2, wy - q, q * 3.6, wh + q * 2, q * 0.4, tint(p.accent2, p, v)); for (i = 0; i < 5; i++) { Rn(c, wx - q * 5, wy + i * wh / 5 + q * 0.6, q * 2.4, q * 0.5, 0, shade(tint(p.accent2, p, v), -0.16)); Rn(c, wx + ww + q * 2.6, wy + i * wh / 5 + q * 0.6, q * 2.4, q * 0.5, 0, shade(tint(p.accent2, p, v), -0.16)); } }
    /* the door: a wreath of leaves with a yellow bow, the lamps beside it */
    var dw = q * 17, dh = q * 33, dx = cx - dw / 2, dy = pf - dh;
    Rn(c, dx - q * 2, dy - q * 7, dw + q * 4, dh + q * 7, q * 1, trim); Rn(c, dx, dy - q * 5.2, dw, q * 3.8, q * 0.5, glass); Rn(c, dx, dy, dw, dh, q * 0.6, door);
    Rn(c, dx + q * 2, dy + q * 2, dw - q * 4, q * 13.5, q * 0.6, shade(door, -0.12)); Rn(c, dx + q * 2, dy + q * 17.5, dw - q * 4, q * 13, q * 0.6, shade(door, -0.12)); dot(c, dx + dw - q * 2, dy + dh * 0.54, q * 0.9, p.gold);
    for (i = 0; i < 18; i++) { var an = i / 18 * TAU; leaf(c, cx + Math.cos(an) * q * 4.6, dy + q * 8.8 + Math.sin(an) * q * 4.6, q * 3.4, an + 1.1, i % 2 ? gr : shade(gr, -0.2)); } ribbon(c, cx, dy + q * 13.2, q * 4.6, yel, t, 3);
    for (s = -1; s <= 1; s += 2) { var lx = cx + s * (dw / 2 + q * 6.5), ly = dy + q * 7; if (dusk) lampGlow(c, lx, ly, q * 17, 0.55, t, s); Rn(c, lx - q * 1.3, ly - q * 2.2, q * 2.6, q * 4.4, q * 0.6, dusk ? '#ffe9a8' : mix(p.paper, p.gold, 0.3)); Pg(c, [[lx - q * 2, ly - q * 2.2], [lx + q * 2, ly - q * 2.2], [lx, ly - q * 4.4]], shade(p.ink, 0.15), true); Rn(c, lx - q * 1.6, ly + q * 2.2, q * 3.2, q * 0.8, q * 0.3, shade(p.ink, 0.15)); }
    /* the beam, the lights along it, and the banner: blank */
    Rn(c, 0, 0, W, H * 0.026, 0, shade(trim, -0.12)); Rn(c, 0, H * 0.026, W, u * 0.8, 0, shade(trim, -0.3));
    warmString(c, u * 8, H * 0.03, W - u * 8, H * 0.03, u * 2.2, Math.max(8, Math.round(W / (u * 9))), u, t, dusk, o);
    var bw = W * 0.6, bh = Math.min(H * 0.046, u * 8), by = H * 0.036 + u * 1.5, bl = cx - bw / 2, n = 24, wv = function (f) { return Math.sin(f * 7 + t * 0.9) * u * 0.35 + Math.sin(f * PI) * u * 1.3; };
    L(c, bl + u * 2, by + wv(0.03), bl - u * 3, H * 0.026, Math.max(0.6, u * 0.3), 'rgba(70,60,60,0.7)'); L(c, bl + bw - u * 2, by + wv(0.97), bl + bw + u * 3, H * 0.026, Math.max(0.6, u * 0.3), 'rgba(70,60,60,0.7)');
    c.beginPath(); c.moveTo(bl - u * 3, by + wv(0)); for (i = 0; i <= n; i++) c.lineTo(bl + bw * i / n, by + wv(i / n)); c.lineTo(bl + bw + u * 3, by + wv(1)); c.lineTo(bl + bw, by + bh / 2 + wv(1)); c.lineTo(bl + bw + u * 3, by + bh + wv(1)); for (i = n; i >= 0; i--) c.lineTo(bl + bw * i / n, by + bh + wv(i / n)); c.lineTo(bl - u * 3, by + bh + wv(0)); c.lineTo(bl, by + bh / 2 + wv(0)); c.closePath(); c.fillStyle = 'rgba(0,0,0,0.14)'; c.save(); c.translate(u * 0.5, u * 0.8); c.fill(); c.restore(); c.fillStyle = tint(p.paper, p, dusk ? 'day' : v); c.fill();
    c.beginPath(); for (i = 1; i < n; i++) { var f = i / n; if (i === 1) c.moveTo(bl + bw * f, by + u * 1 + wv(f)); else c.lineTo(bl + bw * f, by + u * 1 + wv(f)); } c.lineWidth = u * 0.5; c.strokeStyle = yel; c.stroke(); c.beginPath(); for (i = 1; i < n; i++) { var f2 = i / n; if (i === 1) c.moveTo(bl + bw * f2, by + bh - u * 1 + wv(f2)); else c.lineTo(bl + bw * f2, by + bh - u * 1 + wv(f2)); } c.stroke();
    ribbon(c, bl + u * 1.5, by + u * 0.6 + wv(0.02), u * 3.6, yel, t, 1); ribbon(c, bl + bw - u * 1.5, by + u * 0.6 + wv(0.98), u * 3.6, yel, t, 2);
    /* the porch floor, the steps, the path and the garden below */
    vgrad2(c, 0, pf, W, st - pf, shade(board, -0.1), board); c.strokeStyle = shade(board, -0.18); c.lineWidth = Math.max(0.6, u * 0.25); c.beginPath(); for (i = -9; i <= 9; i++) { c.moveTo(cx + i * W * 0.075, pf); c.lineTo(cx + i * W * 0.1, st); } c.stroke();
    Rn(c, 0, pf - u * 1.6, W, u * 1.8, 0, trim); Rn(c, cx - dw * 0.8, pf + u * 1.4, dw * 1.6, (st - pf) * 0.26, u * 0.8, tint(mix(p.accent2, '#a8703f', 0.5), p, v)); c.strokeStyle = alpha(p.paper, 0.6); c.lineWidth = Math.max(0.6, u * 0.4); c.strokeRect(cx - dw * 0.8 + u * 1.2, pf + u * 2.4, dw * 1.6 - u * 2.4, (st - pf) * 0.26 - u * 2);
    var sh = (H * 0.9 - st) / 2; vgrad2(c, 0, H * 0.9, W, H * 0.1 + 1, gr, shade(gr, -0.2));
    quad(c, cx - W * 0.3, H * 0.9, cx + W * 0.3, H * 0.9, cx + W * 0.4, H, cx - W * 0.4, H, tint(mix('#e2d6c0', p.bg2, 0.3), p, v));
    Rn(c, 0, st - 1, W, H * 0.9 - st + 2, 0, shade(board, -0.3));
    for (i = 0; i < 2; i++) { var sy = st + i * sh, inx = i ? 0 : u * 3; Rn(c, inx, sy, W - inx * 2, sh + 1, 0, shade(board, -0.24 + i * 0.04)); Rn(c, inx - u * 0.6, sy, W - inx * 2 + u * 1.2, sh * 0.34, u * 0.4, shade(board, 0.1 - i * 0.04)); }
    /* the posts and their ribbons */
    for (s = 0; s < 2; s++) {
      var px = s ? W - u * 8 : u * 8, pw = u * 5.2, ry = H * 0.43;
      Rn(c, px - pw / 2, 0, pw, pf, 0, trim); Rn(c, px - pw / 2, 0, pw * 0.3, pf, 0, shade(trim, 0.12)); Rn(c, px + pw * 0.24, 0, pw * 0.26, pf, 0, shade(trim, -0.1)); Rn(c, px - pw * 0.75, pf - u * 5, pw * 1.5, u * 5, u * 0.5, trim); Rn(c, px - pw * 0.75, H * 0.026, pw * 1.5, u * 3, u * 0.5, trim); Rn(c, px - pw * 0.75, pf - u * 5, pw * 1.5, u * 0.8, 0, shade(trim, -0.12));
      Rn(c, px - pw / 2 - u * 0.3, ry - u * 1.5, pw + u * 0.6, u * 3, u * 0.6, shade(yel, -0.12)); ribbon(c, px, ry, u * 11.5, yel, t, s * 2);
      var rx0 = s ? px + pw / 2 : 0, rx1 = s ? W : px - pw / 2; Rn(c, rx0, pf - u * 12, rx1 - rx0, u * 1.3, 0, trim); for (i = 0; i < 3; i++) Rn(c, rx0 + (rx1 - rx0) * (i + 0.5) / 3 - u * 0.5, pf - u * 11, u * 1, u * 9.6, 0, shade(trim, -0.08));
      /* a hanging basket inside each post */
      var hx = s ? W - u * 19 : u * 19, hy = H * 0.175 + Math.sin(t * 0.7 + s * 2) * u * 0.2; L(c, hx - u * 3.4, hy, hx, H * 0.03, Math.max(0.6, u * 0.25), 'rgba(70,60,60,0.7)'); L(c, hx + u * 3.4, hy, hx, H * 0.03, Math.max(0.6, u * 0.25), 'rgba(70,60,60,0.7)');
      for (i = 0; i < 7; i++) leaf(c, hx + (i - 3) * u * 1.2, hy + u * 0.6, u * (4.4 + (i % 2) * 1.6), PI / 2 + (i - 3) * 0.42 + Math.sin(t * 0.6 + i) * 0.03, i % 2 ? gr : shade(gr, -0.18));
      c.beginPath(); c.arc(hx, hy, u * 4.2, 0, PI); c.closePath(); c.fillStyle = tint(mix('#a8703f', p.gold, 0.2), p, v); c.fill(); bush(c, hx, hy + u * 0.4, u * 8, shade(gr, -0.08)); blooms(c, hx, hy - u * 1.6, u * 8, 8, [yel, p.snow, mix(yel, p.snow, 0.5)], o.seed + 'hb' + s, u * 1.05);
      /* a pot of yellow flowers on the step */
      var ox = s ? W - u * 22 : u * 22, oy = st + sh * 0.34; Pg(c, [[ox - u * 3.6, oy - u * 6], [ox + u * 3.6, oy - u * 6], [ox + u * 2.6, oy], [ox - u * 2.6, oy]], tint(mix('#c8794a', p.accent, 0.2), p, v), true); Rn(c, ox - u * 4.1, oy - u * 6.8, u * 8.2, u * 1.6, u * 0.6, tint(mix('#d98a5a', p.accent, 0.2), p, v)); bush(c, ox, oy - u * 5.6, u * 9, shade(gr, -0.12)); blooms(c, ox, oy - u * 7.4, u * 9, 9, [yel, mix(yel, p.snow, 0.4), p.snow], o.seed + 'pt' + s, u * 1.15);
    }
    /* a plain kit bag and a pair of boots, set down by the step */
    var kx = W * 0.64, ky = H * 0.955, ks = u * (H > W * 1.3 ? 1.25 : 1), kb = tint(mix('#7d8560', p.accent2, 0.2), p, v), bt = tint(mix('#6a4a36', p.ink, 0.25), p, v);
    el(c, kx + ks * 4, ky + ks * 0.3, ks * 15, ks * 1.2, 'rgba(0,0,0,0.14)'); Rn(c, kx - ks * 8, ky - ks * 8.4, ks * 18, ks * 8.4, ks * 4, kb); el(c, kx + ks * 8.4, ky - ks * 4.2, ks * 2, ks * 4, shade(kb, -0.16)); Rn(c, kx - ks * 3.4, ky - ks * 8.4, ks * 1.5, ks * 8.4, 0, shade(kb, -0.2)); Rn(c, kx + ks * 2.6, ky - ks * 8.4, ks * 1.5, ks * 8.4, 0, shade(kb, -0.2));
    c.beginPath(); c.moveTo(kx - ks * 2.6, ky - ks * 8.2); c.quadraticCurveTo(kx + ks * 0.4, ky - ks * 13, kx + ks * 3.4, ky - ks * 8.2); c.lineWidth = ks * 1.1; c.strokeStyle = shade(kb, -0.3); c.stroke();
    for (i = 0; i < 2; i++) { var b0 = kx + ks * (13 + i * 5.4); Rn(c, b0, ky - ks * 8.6 + i * ks * 0.6, ks * 3.8, ks * 7.6, ks * 1, i ? bt : shade(bt, -0.12)); Rn(c, b0, ky - ks * 3.2, ks * 6.4, ks * 3.2, ks * 1.4, i ? bt : shade(bt, -0.12)); Rn(c, b0 - ks * 0.2, ky - ks * 0.9, ks * 6.8, ks * 0.9, ks * 0.3, shade(bt, -0.4)); for (s = 0; s < 3; s++) L(c, b0 + ks * 1.4, ky - ks * (4.4 + s * 1.3), b0 + ks * 3.4, ky - ks * (4.4 + s * 1.3), Math.max(0.5, ks * 0.25), mix(bt, p.paper, 0.5)); }
    for (s = 0; s < 2; s++) { var gx = s ? W - u * 5 : u * 5; bush(c, gx, H * 0.985, u * 13, shade(gr, -0.18)); blooms(c, gx, H * 0.955, u * 12, 6, [yel, p.snow], o.seed + 'gb' + s, u * 1.1); }
    if (dusk) vignette(c, W, H, shade(p.bg, -0.45), 0.34);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });
});
