/* Send a Carol art pack: work and play backdrops (an office, a gym, a bowling alley, a carnival, a ballroom, a theatre and four generic sports grounds).
   Blocks only come in through CarolArt.add; nothing here replaces launch art. Sports grounds carry no league, team or sponsor marks and no words. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var vgrad = K.vgrad, vgrad2 = K.vgrad2, glow = K.glow, cloud = K.cloud, twinkle = K.twinkle, leaf = K.leaf;

  /* ---------- shared pieces ---------- */
  function lum(col) { var q = K.rgbOf(col) || [128, 128, 128]; return (q[0] * 0.299 + q[1] * 0.587 + q[2] * 0.114) / 255; }
  /* how far a palette is pulled down for a night or a dark room: 0 for a dark palette, up to `max` for a pale one */
  function pull(p, max) { return clamp((lum(p.bg) - 0.22) * 1.5, 0, 1) * max; }
  function dk(col, k) { return k > 0 ? mix(col, '#0b0d28', k) : col; }
  function el(c, x, y, rx, ry, col) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, TAU); c.fillStyle = col; c.fill(); }
  function ring(c, x, y, rx, ry, lw, col, a0, a1) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, a0 == null ? 0 : a0, a1 == null ? TAU : a1); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); }
  /* the open sky of a day or a night; returns how far the palette was pulled down */
  function sky(c, W, H, t, p, o, u, night, yb, sx, sy) {
    var k = night ? pull(p, 0.74) : 0, i, R0 = rnd(o.seed + 'sky');
    if (night) { vgrad(c, W, H, [dk(shade(p.bg, -0.3), k), dk(p.bg, k), dk(p.bg2, k * 0.9)], 0, yb); K.skyStars(c, W, H, 60, o.seed, t, yb * 0.8, '#ffffff'); K.moonDisc(c, sx, sy, u * 5.2, '#fff3d2'); }
    else {
      vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.55), mix(p.bg2, '#ffffff', 0.35)], 0, yb);
      glow(c, sx, sy, u * 24, '#fff6c8', 0.5); dot(c, sx, sy, u * 5.6, mix('#ffe27a', p.gold, 0.3)); dot(c, sx - u * 1.4, sy - u * 1.4, u * 3.3, 'rgba(255,255,255,0.28)');
      for (i = 0; i < 4; i++) { var cw = u * (14 + R0() * 13), cx = frac(R0() + t * 0.005 * (1 + i * 0.3)) * (W + cw * 2) - cw, cy = yb * (0.08 + R0() * 0.4); cloud(c, cx, cy, cw, 'rgba(255,255,255,0.86)'); }
    }
    return k;
  }
  /* a lattice mast with a bank of lamps; s = its unit, dir = which way the bank leans */
  function tower(c, x, base, top, s, col, on, k, dir) {
    var w = s * 1.5, i, n = Math.max(3, Math.round((base - top) / (s * 4.4))), bw = s * 8.4, bh = s * 5.4;
    c.strokeStyle = col; c.lineWidth = s * 0.45; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - w, base); c.lineTo(x - w * 0.45, top); c.moveTo(x + w, base); c.lineTo(x + w * 0.45, top);
    for (i = 0; i < n; i++) { var f0 = i / n, f1 = (i + 1) / n, y0 = base + (top - base) * f0, y1 = base + (top - base) * f1, w0 = w * (1 - 0.55 * f0), w1 = w * (1 - 0.55 * f1); c.moveTo(x - w0, y0); c.lineTo(x + w1, y1); c.moveTo(x + w0, y0); c.lineTo(x - w1, y1); }
    c.stroke();
    c.save(); c.translate(x, top); c.rotate(dir * 0.12);
    if (on) glow(c, 0, -bh * 0.5, s * 17, '#fff4c8', 0.36 + 0.07 * k);
    Rn(c, -bw / 2, -bh, bw, bh, s * 0.7, shade(col, -0.12)); Rn(c, -bw / 2, -bh, bw, s * 0.7, s * 0.3, shade(col, 0.2));
    for (i = 0; i < 12; i++) dot(c, -bw / 2 + bw * (0.14 + (i % 4) * 0.24), -bh + bh * (0.24 + Math.floor(i / 4) * 0.28), s * 0.74, on ? '#fffbe0' : shade(col, 0.4));
    c.restore();
  }
  function beam(c, x, y, tx, ty, w, a) { var g = c.createLinearGradient(x, y, tx, ty); g.addColorStop(0, 'rgba(255,246,208,' + a + ')'); g.addColorStop(1, 'rgba(255,246,208,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(tx - w, ty); c.lineTo(tx + w, ty); c.closePath(); c.fill(); }
  /* rows of little heads between two edges (functions of x) */
  function crowd(c, x0, x1, yTop, yBot, rows, step, seed, cols) {
    var R0 = rnd(seed + 'cr'), n = cols.length, paths = [], q, r, x, j, a;
    for (q = 0; q < n; q++) paths.push([]);
    for (r = 0; r < rows; r++) for (x = x0 + (r % 2) * step * 0.5; x < x1; x += step) { var yt = yTop(x), yb = yBot(x), v1 = R0(), v2 = R0(); if (yb - yt < step || v1 < 0.1) continue; paths[Math.floor(v2 * n) % n].push(x + (v1 - 0.5) * step * 0.3, yt + (yb - yt) * (r + 0.5) / rows); }
    for (q = 0; q < n; q++) { c.fillStyle = cols[q]; c.beginPath(); a = paths[q]; for (j = 0; j < a.length; j += 2) { c.moveTo(a[j] + step * 0.37, a[j + 1]); c.arc(a[j], a[j + 1], step * 0.37, 0, TAU); } c.fill(); }
  }
  function flashes(c, x0, x1, yTop, yBot, n, seed, t, u) { /* cameras going off in a crowd */
    for (var i = 0; i < n; i++) { var per = 1.3 + (i % 4) * 0.31, ph = t / per + i * 0.37, cyc = Math.floor(ph), f = ph - cyc; if (f > 0.25) continue; var R1 = rnd(seed + 'fl' + i + '.' + (cyc % 53)), x = x0 + R1() * (x1 - x0), yt = yTop(x), y = yt + R1() * (yBot(x) - yt); twinkle(c, x, y, u * (0.5 + 2.2 * (1 - f * 4)), '#ffffff'); }
  }
  function turfH(c, W, y0, H, col, n) { /* mown bands across */
    var i; c.fillStyle = col; c.fillRect(0, y0, W, H - y0); c.fillStyle = shade(col, 0.09);
    for (i = 0; i < n; i += 2) { var a = y0 + (H - y0) * Math.pow(i / n, 1.7), b = y0 + (H - y0) * Math.pow((i + 1) / n, 1.7); c.fillRect(0, a, W, b - a); }
  }
  function turfV(c, W, y0, H, col, vy) { /* mown bands running away from us */
    var i, cx = W / 2, wt = W / 10, sc = (H - vy) / (y0 - vy); c.fillStyle = col; c.fillRect(0, y0, W, H - y0); c.fillStyle = shade(col, 0.09);
    for (i = -7; i <= 6; i += 2) { c.beginPath(); c.moveTo(cx + i * wt, y0); c.lineTo(cx + (i + 1) * wt, y0); c.lineTo(cx + (i + 1) * wt * sc, H); c.lineTo(cx + i * wt * sc, H); c.closePath(); c.fill(); }
  }
  function neon(c, col, w, k) { /* strokes the current path as a glowing tube */
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = alpha(col, 0.1 + 0.06 * k); c.lineWidth = w * 6; c.stroke(); c.strokeStyle = alpha(col, 0.3); c.lineWidth = w * 2.7; c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = w * 0.32; c.stroke();
  }
  function pennant(c, x, y, s, col, t, ph, pole) { /* a little plain flag on a pole, flying */
    var w = Math.sin(t * 3 + ph) * s * 0.18; L(c, x, y, x, y - s * 1.9, s * 0.16, pole);
    c.beginPath(); c.moveTo(x, y - s * 1.9); c.quadraticCurveTo(x + s * 0.6, y - s * 1.75 + w, x + s * 1.3, y - s * 1.45 + w); c.quadraticCurveTo(x + s * 0.6, y - s * 1.3 + w * 0.5, x, y - s * 1.05); c.closePath(); c.fillStyle = col; c.fill();
  }

  /* ---------- a modern office: a glass wall on the city, pendant lamps, a plant and the water cooler ---------- */
  Art.add('backdrop', 'modernoffice', function (c, W, H, t, p, o, u) {
    var eve = o.variant === 'evening', R0 = rnd(o.seed + 'mo'), i, j, k = Math.exp(-5 * o.beat), top = H * 0.05, sill = H * 0.6, fl = H * 0.665, kk = eve ? pull(p, 0.7) : 0, gh = sill - top;
    var base = dk(p.bg, kk), fr = eve ? mix(p.paper, base, 0.72) : mix(p.paper, p.bg, 0.16), cab = eve ? mix(p.paper, base, 0.5) : mix(p.paper, p.bg2, 0.25);
    var sb = eve ? mix(dk(p.bg2, kk * 0.5), '#ffb27a', 0.5) : mix(p.bg2, '#ffffff', 0.3);
    if (eve) vgrad(c, W, H, [dk(shade(p.bg, -0.2), kk), base, dk(mix(p.bg2, p.accent, 0.35), kk * 0.7), sb], top, sill);
    else vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.5), sb], top, sill);
    if (eve) { K.skyStars(c, W, H, 26, o.seed, t, top + gh * 0.5, '#ffffff'); K.moonDisc(c, W * 0.8, top + gh * 0.16, u * 3.6, '#fff3d2'); }
    else { glow(c, W * 0.8, top + gh * 0.14, u * 20, '#fff6c8', 0.5); dot(c, W * 0.8, top + gh * 0.14, u * 4.4, mix('#ffe27a', p.gold, 0.3)); for (i = 0; i < 3; i++) { var cw = u * (13 + R0() * 9); cloud(c, frac(R0() + t * 0.005 * (1 + i * 0.4)) * (W + cw * 2) - cw, top + gh * (0.12 + R0() * 0.3), cw, 'rgba(255,255,255,0.85)'); } }
    /* the city: two rows of towers, low in the middle */
    for (j = 0; j < 2; j++) {
      var R1 = rnd(o.seed + 'city' + j), x = -u * 3, col = j ? mix(sb, eve ? '#0b0d28' : p.ink, eve ? 0.62 : 0.3) : mix(sb, eve ? base : p.bg, eve ? 0.6 : 0.5), n = 0;
      while (x < W) {
        var bw = u * (5 + R1() * 5), ed = Math.abs((x + bw / 2) / W - 0.5) * 2, bh = Math.min(gh * 0.62, u * 46) * (0.16 + 0.6 * Math.pow(ed, 1.5) + R1() * 0.2) * (j ? 0.72 : 1), by = sill - bh, r, q;
        c.fillStyle = col; c.fillRect(x, by, bw + 1, bh + 1); if (n % 3 === 0) { c.fillRect(x + bw * 0.25, by - u * 1.2, bw * 0.5, u * 1.3); c.fillRect(x + bw * 0.48, by - u * 3.4, u * 0.3, u * 2.4); }
        if (j) { var cols = Math.max(2, Math.floor(bw / (u * 1.7))), rows = Math.min(11, Math.floor(bh / (u * 2.3)));
          for (r = 0; r < rows; r++) for (q = 0; q < cols; q++) { var v = R1(); if (eve) { if (v < 0.52) continue; c.fillStyle = alpha(v > 0.9 ? '#fff3d0' : '#ffd98a', 0.6 + 0.3 * Math.sin(t * 1.6 + n + r * 2 + q)); } else c.fillStyle = alpha(p.snow, 0.26); c.fillRect(x + u * 0.7 + q * (bw - u * 1.2) / cols, by + u * 1 + r * u * 2.3, u * 0.85, u * 1.2); } }
        x += bw + u * 0.3; n++;
      }
    }
    c.fillStyle = alpha(p.snow, 0.07); for (i = 0; i < 3; i++) { var gx = W * (0.06 + i * 0.37); c.beginPath(); c.moveTo(gx + u * 9, top); c.lineTo(gx + u * 16, top); c.lineTo(gx + u * 2, sill); c.lineTo(gx - u * 5, sill); c.closePath(); c.fill(); }
    /* frames, ceiling, pendant lamps */
    c.fillStyle = fr; c.fillRect(0, 0, W, top + u * 0.9); for (i = 0; i <= 4; i++) c.fillRect(i * W / 4 - u * 0.7, top, u * 1.4, gh); c.fillRect(0, top + gh * 0.24, W, u * 0.5);
    c.fillStyle = shade(fr, -0.14); c.fillRect(0, top + u * 0.9, W, u * 0.35); c.fillStyle = eve ? '#fff0c4' : shade(fr, 0.4); for (i = 0; i < 4; i++) Rn(c, W * (0.125 + i * 0.25) - u * 7, top * 0.42, u * 14, u * 0.8, u * 0.4, c.fillStyle);
    var lamps = [p.accent, p.gold, p.gold, p.accent2];
    for (i = 0; i < 4; i++) { var lx = W * (0.125 + i * 0.25), ly = top + u * (i === 0 || i === 3 ? 8 : 3.5); L(c, lx, top, lx, ly, u * 0.28, shade(fr, -0.45)); if (eve) glow(c, lx, ly + u * 3.4, u * 15, '#ffe2a0', 0.3 + 0.06 * k); c.beginPath(); c.arc(lx, ly + u * 3.2, u * 3.5, PI, 0); c.closePath(); c.fillStyle = lamps[i]; c.fill(); Rn(c, lx - u * 3.5, ly + u * 2.8, u * 7, u * 0.8, u * 0.4, shade(lamps[i], -0.2)); c.beginPath(); c.arc(lx - u * 1.2, ly + u * 1.9, u * 1.3, PI * 1.05, PI * 1.5); c.lineWidth = u * 0.4; c.strokeStyle = 'rgba(255,255,255,0.45)'; c.stroke(); dot(c, lx, ly + u * 3.8, u * 1, eve ? '#fff6d0' : shade(lamps[i], 0.6)); }
    /* the low cabinet under the glass, with the things people leave on it */
    c.fillStyle = cab; c.fillRect(0, sill, W, fl - sill); c.fillStyle = shade(cab, 0.25); c.fillRect(0, sill, W, u * 0.9); c.fillStyle = shade(cab, -0.12);
    var dn = Math.max(6, Math.round(W / (u * 12.5))); for (i = 0; i <= dn; i++) { c.fillRect(i * W / dn - u * 0.15, sill + u * 1.4, u * 0.3, fl - sill - u * 2); if (i < dn) Rn(c, (i + 0.5) * W / dn - u * 1.4, sill + u * 2.2, u * 2.8, u * 0.5, u * 0.25, shade(cab, -0.3)); }
    var bk = [p.accent, p.gold, p.accent2, shade(p.accent, 0.4), mix(p.ink, p.bg, 0.4), p.gold], bx = u * 17;
    for (i = 0; i < 6; i++) { var bw2 = u * (1.3 + (i * 7 % 3) * 0.4), bh2 = u * (4.4 + (i * 5 % 4) * 0.7); Rn(c, bx, sill - bh2, bw2, bh2, u * 0.25, bk[i]); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(bx + bw2 * 0.25, sill - bh2 * 0.8, bw2 * 0.5, u * 0.4); bx += bw2 + u * 0.15; }
    c.save(); c.translate(bx + u * 0.4, sill); c.rotate(0.3); Rn(c, 0, -u * 5, u * 1.5, u * 5, u * 0.25, p.accent2); c.restore();
    for (i = 0; i < 2; i++) { var px = W - u * (19 + i * 8.5), ps = u * (i ? 1.25 : 1); for (j = -2; j <= 2; j++) leaf(c, px, sill - ps * 2.6, ps * 4.4, -PI / 2 + j * 0.5 + Math.sin(t * 0.9 + i + j) * 0.04, j % 2 ? shade(p.accent2, 0.15) : p.accent2); Pg(c, [[px - ps * 1.9, sill - ps * 3], [px + ps * 1.9, sill - ps * 3], [px + ps * 1.4, sill], [px - ps * 1.4, sill]], i ? p.gold : shade(p.accent, 0.25), true); }
    var mgx = W - u * 36; Rn(c, mgx - u * 1.3, sill - u * 2.8, u * 2.6, u * 2.8, u * 0.5, p.paper); c.beginPath(); c.arc(mgx + u * 1.3, sill - u * 1.5, u * 0.9, -PI / 2, PI / 2); c.lineWidth = u * 0.4; c.strokeStyle = p.paper; c.stroke(); Rn(c, mgx - u * 1.3, sill - u * 1.9, u * 2.6, u * 0.6, 0, p.accent); K.steam(c, mgx, sill - u * 3.2, u * 3.4, t, 2);
    /* the floor: carpet tiles, a rug, the light the glass throws */
    var f1 = eve ? mix(mix('#c2a988', p.bg2, 0.4), base, 0.5) : mix('#c8ae8c', p.bg2, 0.45); vgrad2(c, 0, fl, W, H - fl, f1, shade(f1, -0.2));
    c.strokeStyle = alpha(p.ink, 0.07); c.lineWidth = Math.max(0.6, u * 0.18); c.beginPath(); for (i = 1; i < 6; i++) { var yy = fl + (H - fl) * Math.pow(i / 6, 1.6); c.moveTo(0, yy); c.lineTo(W, yy); } for (i = -9; i <= 9; i++) { c.moveTo(W / 2 + i * W * 0.085, fl); c.lineTo(W / 2 + i * W * 0.2, H); } c.stroke();
    var ry = fl + (H - fl) * 0.56; el(c, W / 2, ry, W * 0.37, (H - fl) * 0.3, mix(f1, p.accent2, 0.38)); ring(c, W / 2, ry, W * 0.33, (H - fl) * 0.25, u * 0.6, mix(f1, p.paper, 0.5)); el(c, W / 2, ry, W * 0.25, (H - fl) * 0.17, mix(f1, p.accent2, 0.5));
    for (i = 0; i < 4; i++) { var qx = i * W / 4 + u * 1.5; c.fillStyle = eve ? 'rgba(255,223,154,0.07)' : alpha(p.snow, 0.13); c.beginPath(); c.moveTo(qx, fl); c.lineTo(qx + W / 4 - u * 3, fl); c.lineTo(qx + W / 4 + u * 5, fl + (H - fl) * 0.42); c.lineTo(qx + u * 6, fl + (H - fl) * 0.42); c.closePath(); c.fill(); }
    c.fillStyle = shade(cab, -0.3); c.fillRect(0, fl - u * 0.5, W, u * 0.9);
    /* the big plant */
    var tx = u * 6.5, tb = fl + u * 6, gr = eve ? mix(p.accent2, base, 0.25) : p.accent2;
    el(c, tx, tb, u * 6, u * 1.1, 'rgba(0,0,0,0.14)');
    for (i = 0; i < 9; i++) { var a = -PI / 2 + (i - 4) * 0.29, sl = u * (9 + (i * 5 % 3) * 5.5), ex = tx + Math.cos(a) * sl, ey = tb - u * 7 + Math.sin(a) * sl, sw = Math.sin(t * 0.8 + i) * 0.05; L(c, tx, tb - u * 7, ex, ey, u * 0.5, shade(gr, -0.3)); leaf(c, ex, ey, u * (9 + (i % 2) * 3.5), a + sw, i % 2 ? gr : shade(gr, 0.18)); leaf(c, tx + (ex - tx) * 0.55, tb - u * 7 + (ey - tb + u * 7) * 0.55, u * 6.5, a + (i % 2 ? 0.8 : -0.8) + sw, shade(gr, -0.12)); }
    Pg(c, [[tx - u * 4.2, tb - u * 7.4], [tx + u * 4.2, tb - u * 7.4], [tx + u * 3.1, tb], [tx - u * 3.1, tb]], mix(p.paper, p.accent, 0.25), true); Rn(c, tx - u * 4.6, tb - u * 8, u * 9.2, u * 1.5, u * 0.7, mix(p.paper, p.accent, 0.4)); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(tx - u * 2.8, tb - u * 6, u * 1, u * 5);
    /* the water cooler, bubbling */
    var wx = W - u * 7, wb = fl + u * 6, wc = eve ? mix(p.paper, base, 0.25) : mix(p.paper, p.bg2, 0.12);
    el(c, wx, wb, u * 5, u * 1, 'rgba(0,0,0,0.14)'); Rn(c, wx - u * 3.6, wb - u * 15, u * 7.2, u * 15, u * 1, wc); Rn(c, wx - u * 2.7, wb - u * 12.6, u * 5.4, u * 4.6, u * 0.6, shade(wc, -0.14)); dot(c, wx - u * 1.2, wb - u * 11, u * 0.7, '#58b4ff'); dot(c, wx + u * 1.2, wb - u * 11, u * 0.7, p.accent); Rn(c, wx - u * 2.4, wb - u * 8.6, u * 4.8, u * 0.6, u * 0.3, shade(wc, -0.3)); Rn(c, wx - u * 3.6, wb - u * 1.4, u * 7.2, u * 1.4, u * 0.6, shade(wc, -0.2));
    Rn(c, wx - u * 1.3, wb - u * 16.6, u * 2.6, u * 2, u * 0.4, '#bfe6ff'); Rn(c, wx - u * 3.1, wb - u * 25.4, u * 6.2, u * 9.4, u * 2.2, 'rgba(170,222,255,0.9)'); Rn(c, wx - u * 3.1, wb - u * 25.4, u * 6.2, u * 2.6, u * 2.2, 'rgba(236,248,255,0.9)'); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(wx - u * 2.2, wb - u * 22.4, u * 0.7, u * 5);
    for (i = 0; i < 3; i++) { var bf = frac(t * 0.32 + i / 3); dot(c, wx + Math.sin(i * 2 + bf * 6) * u * 1.3, wb - u * 16.6 - bf * u * 6, u * (0.3 + bf * 0.35), 'rgba(255,255,255,' + (0.85 * (1 - bf)).toFixed(3) + ')'); }
  }, { variants: ['day', 'evening'], stage: 'cast-low' });

  /* ---------- a gym: wall bars, rings, a heavy bag, a rack of dumbbells, a mirror with a barre ---------- */
  Art.add('backdrop', 'gym', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'gy'), fl = H * 0.665, k = Math.exp(-5 * o.beat), wall = p.bg, wood = mix('#d2a064', p.bg2, 0.28), steel = mix('#8d97a6', p.bg, 0.25), cols = [p.accent, p.gold, p.accent2, mix('#58b4ff', p.bg, 0.2)];
    vgrad(c, W, H, [shade(wall, -0.1), wall, mix(wall, p.bg2, 0.4)], 0, fl);
    c.fillStyle = mix(wall, p.accent, 0.5); c.fillRect(0, H * 0.405, W, u * 2.6); c.fillStyle = mix(wall, p.gold, 0.55); c.fillRect(0, H * 0.405 + u * 3.3, W, u * 0.9);
    /* high windows and their light */
    for (i = 0; i < 4; i++) { var wx = W * (0.07 + i * 0.235), ww = W * 0.155, wy = H * 0.014, wh = Math.min(H * 0.05, u * 7); c.fillStyle = alpha(p.snow, 0.06); c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx + ww, wy + wh); c.lineTo(wx + ww + u * 16, H * 0.5); c.lineTo(wx + u * 10, H * 0.5); c.closePath(); c.fill(); Rn(c, wx - u * 0.6, wy - u * 0.6, ww + u * 1.2, wh + u * 1.2, u * 0.6, shade(wall, -0.3)); Rn(c, wx, wy, ww, wh, u * 0.3, mix(p.snow, p.bg2, 0.3)); c.fillStyle = shade(wall, -0.3); c.fillRect(wx + ww / 3 - u * 0.2, wy, u * 0.4, wh); c.fillRect(wx + ww * 2 / 3 - u * 0.2, wy, u * 0.4, wh); }
    /* the mirror and its barre */
    var mx = W * 0.22, mw = W * 0.56, my = H * 0.5, mh = fl - u * 1.6 - my; Rn(c, mx - u * 0.8, my - u * 0.8, mw + u * 1.6, mh + u * 1.6, u * 0.6, steel); vgrad2(c, mx, my, mw, mh, mix(wall, p.snow, 0.4), mix(wall, p.snow, 0.2));
    c.save(); c.beginPath(); c.rect(mx, my, mw, mh); c.clip(); c.fillStyle = alpha(p.snow, 0.2); for (i = 0; i < 4; i++) { var sx = mx + mw * (0.08 + i * 0.27); c.beginPath(); c.moveTo(sx + u * 5, my); c.lineTo(sx + u * (i % 2 ? 7 : 9), my); c.lineTo(sx + u * (i % 2 ? 2 : 4) - mh * 0.3, my + mh); c.lineTo(sx - mh * 0.3, my + mh); c.closePath(); c.fill(); } c.restore();
    c.fillStyle = steel; c.fillRect(mx + mw / 3 - u * 0.2, my, u * 0.4, mh); c.fillRect(mx + mw * 2 / 3 - u * 0.2, my, u * 0.4, mh);
    for (i = 0; i < 4; i++) L(c, mx + mw * (0.04 + i * 0.307), my + mh * 0.62, mx + mw * (0.04 + i * 0.307), my + mh * 0.62 + u * 1.6, u * 0.5, steel); Rn(c, mx - u * 1, my + mh * 0.62 - u * 0.6, mw + u * 2, u * 1.2, u * 0.6, wood); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(mx, my + mh * 0.62 - u * 0.4, mw, u * 0.3);
    /* wall bars */
    var x0 = u * 2.5, x1 = u * 15, y0 = Math.max(H * 0.25, fl - u * 62); Rn(c, x0 - u * 0.4, y0 - u * 1.5, u * 1.7, fl - y0 + u * 1.5, u * 0.5, shade(wood, -0.2)); Rn(c, x1 - u * 1.3, y0 - u * 1.5, u * 1.7, fl - y0 + u * 1.5, u * 0.5, shade(wood, -0.2));
    for (i = 0; y0 + i * u * 3.5 < fl - u * 2; i++) { Rn(c, x0, y0 + i * u * 3.5, x1 - x0, u * 1, u * 0.5, wood); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x0 + u * 1.5, y0 + i * u * 3.5 + u * 0.15, x1 - x0 - u * 3, u * 0.25); }
    Rn(c, x0 + u * 6, y0 + u * 7.4, u * 4.6, u * 9.5, u * 0.8, p.accent2); Rn(c, x0 + u * 6, y0 + u * 7, u * 4.6, u * 1.6, u * 0.8, shade(p.accent2, 0.25)); c.fillStyle = shade(p.accent2, 0.4); c.fillRect(x0 + u * 6, y0 + u * 14.6, u * 4.6, u * 0.7);
    /* rings */
    for (i = 0; i < 2; i++) { c.save(); c.translate(W * (0.25 + i * 0.075), 0); c.rotate(Math.sin(t * 0.9 + i * 0.5) * 0.05); var rl = Math.min(H * 0.075, u * 11); L(c, 0, 0, 0, rl, u * 0.55, mix(p.ink, wall, 0.3)); ring(c, 0, rl + u * 2.3, u * 2.3, u * 2.3, u * 0.9, wood); ring(c, 0, rl + u * 2.3, u * 2.7, u * 2.7, u * 0.2, shade(wood, -0.3)); c.restore(); }
    /* the clock */
    var kx = W * 0.72, ky = Math.min(H * 0.105, u * 14), kr = u * 3.6; dot(c, kx, ky, kr + u * 0.7, mix(p.ink, wall, 0.2)); dot(c, kx, ky, kr, p.paper); for (i = 0; i < 12; i++) { var ka = i / 12 * TAU; L(c, kx + Math.cos(ka) * kr * 0.8, ky + Math.sin(ka) * kr * 0.8, kx + Math.cos(ka) * kr * 0.92, ky + Math.sin(ka) * kr * 0.92, u * (i % 3 ? 0.18 : 0.36), p.ink); }
    L(c, kx, ky, kx + kr * 0.45, ky - kr * 0.3, u * 0.5, p.ink); L(c, kx, ky, kx - kr * 0.2, ky - kr * 0.68, u * 0.4, p.ink); L(c, kx, ky, kx + Math.cos(t * 0.6) * kr * 0.8, ky + Math.sin(t * 0.6) * kr * 0.8, u * 0.2, p.accent); dot(c, kx, ky, u * 0.5, p.accent);
    /* the heavy bag */
    c.save(); c.translate(W - u * 11, 0); Rn(c, -u * 3, 0, u * 6, u * 1.3, u * 0.4, steel); c.rotate(Math.sin(t * 1.1) * 0.035 + k * 0.012); var cl = Math.min(H * 0.2, u * 30); for (i = -1; i <= 1; i++) L(c, i * u * 0.4, u * 1, i * u * 3, cl, u * 0.35, steel);
    Rn(c, -u * 4.6, cl - u * 0.6, u * 9.2, u * 25, u * 3.4, p.accent); Rn(c, u * 1.2, cl, u * 3.2, u * 23.6, u * 2.6, 'rgba(0,0,0,0.12)'); Rn(c, -u * 4.6, cl - u * 0.6, u * 9.2, u * 3.4, u * 1.7, shade(p.accent, -0.25)); c.fillStyle = alpha(p.paper, 0.85); c.fillRect(-u * 4.6, cl + u * 8, u * 9.2, u * 1); c.fillRect(-u * 4.6, cl + u * 10, u * 9.2, u * 1); Rn(c, -u * 3.4, cl + u * 3.6, u * 1.1, u * 16, u * 0.55, 'rgba(255,255,255,0.28)'); c.restore();
    /* the floor: rubber tiles and a mat */
    var f1 = mix(p.bg2, '#4a5060', 0.42), fh = H - fl; vgrad2(c, 0, fl, W, fh, f1, shade(f1, -0.2));
    c.strokeStyle = alpha(p.ink, 0.1); c.lineWidth = Math.max(0.6, u * 0.2); c.beginPath(); for (i = 1; i < 6; i++) { var yy = fl + fh * Math.pow(i / 6, 1.6); c.moveTo(0, yy); c.lineTo(W, yy); } for (i = -9; i <= 9; i++) { c.moveTo(W / 2 + i * W * 0.085, fl); c.lineTo(W / 2 + i * W * 0.2, H); } c.stroke();
    c.fillStyle = alpha(p.snow, 0.1); for (i = 0; i < 46; i++) c.fillRect(R0() * W, fl + R0() * fh, u * 0.5, u * 0.3);
    var mt = mix(f1, p.accent2, 0.5); Pg(c, [[W * 0.3, fl + fh * 0.36], [W * 0.7, fl + fh * 0.36], [W * 0.79, fl + fh * 0.8], [W * 0.21, fl + fh * 0.8]], mt, true); Pg(c, [[W * 0.21, fl + fh * 0.8], [W * 0.79, fl + fh * 0.8], [W * 0.792, fl + fh * 0.83], [W * 0.208, fl + fh * 0.83]], shade(mt, -0.25), true); c.beginPath(); c.moveTo(W * 0.325, fl + fh * 0.4); c.lineTo(W * 0.675, fl + fh * 0.4); c.lineTo(W * 0.745, fl + fh * 0.76); c.lineTo(W * 0.255, fl + fh * 0.76); c.closePath(); c.lineWidth = u * 0.4; c.strokeStyle = alpha(p.snow, 0.35); c.stroke();
    c.fillStyle = shade(wall, -0.3); c.fillRect(0, fl - u * 1, W, u * 1.2);
    /* the rack of dumbbells */
    var rx = 0, rb = 0, rw = u * 23; c.save(); c.translate(u * 2.5, fl + u * 8); c.scale(1.4, 1.4); el(c, rx + rw / 2, rb, rw * 0.56, u * 1.2, 'rgba(0,0,0,0.16)'); L(c, rx + u * 1, rb, rx + u * 2.6, rb - u * 13, u * 1, shade(steel, -0.25)); L(c, rx + rw - u * 1, rb, rx + rw - u * 2.6, rb - u * 13, u * 1, shade(steel, -0.25));
    for (j = 0; j < 2; j++) { var sy = rb - u * (2.4 + j * 6.2); Rn(c, rx + u * 0.6, sy, rw - u * 1.2, u * 1, u * 0.4, steel); for (i = 0; i < 4; i++) { var dx = rx + u * (3.6 + i * 5.3), ds = u * (1 - i * 0.07 + j * 0.05), dc = cols[(i + j * 2) % 4]; Rn(c, dx - ds * 0.9, sy - ds * 2, ds * 1.8, ds * 0.8, ds * 0.3, shade(steel, 0.3)); Rn(c, dx - ds * 2.2, sy - ds * 3.1, ds * 1.5, ds * 3.1, ds * 0.5, dc); Rn(c, dx + ds * 0.7, sy - ds * 3.1, ds * 1.5, ds * 3.1, ds * 0.5, dc); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(dx - ds * 2, sy - ds * 2.8, ds * 1.1, ds * 0.4); c.fillRect(dx + ds * 0.9, sy - ds * 2.8, ds * 1.1, ds * 0.4); } }
    c.restore();
    /* a ball and kettlebells */
    var bx = W - u * 13, br = u * 9.5, by = fl + u * 9 - br; el(c, bx, by + br, br * 0.95, u * 1.3, 'rgba(0,0,0,0.18)'); dot(c, bx, by, br, p.accent2); dot(c, bx + br * 0.12, by + br * 0.12, br * 0.86, shade(p.accent2, -0.07)); dot(c, bx - br * 0.1, by - br * 0.1, br * 0.8, p.accent2); ring(c, bx, by, br * 0.99, br * 0.3, u * 0.25, shade(p.accent2, -0.2), 0, PI); ring(c, bx, by, br * 0.99, br * 0.62, u * 0.25, shade(p.accent2, -0.2), 0, PI); el(c, bx - br * 0.38, by - br * 0.45, br * 0.26, br * 0.15, 'rgba(255,255,255,0.5)');
    for (i = 0; i < 2; i++) { var qx = W - u * (27 + i * 7.5), qs = u * (i ? 0.78 : 1), qb = fl + u * (10.5 - i * 2.5), qc = i ? p.accent : p.gold; el(c, qx, qb, qs * 3.4, qs * 0.7, 'rgba(0,0,0,0.18)'); c.beginPath(); c.arc(qx, qb - qs * 4.6, qs * 1.9, PI * 0.95, PI * 0.05); c.lineWidth = qs * 1; c.strokeStyle = shade(qc, -0.2); c.stroke(); dot(c, qx, qb - qs * 2.5, qs * 2.9, qc); c.fillStyle = qc; c.fillRect(qx - qs * 2, qb - qs * 1.2, qs * 4, qs * 1.2); dot(c, qx - qs * 0.9, qb - qs * 3.3, qs * 0.9, 'rgba(255,255,255,0.35)'); }
  }, { variants: ['one'], stage: 'cast-low' });

  /* ---------- a bowling alley: three lanes under neon, pins at the end, a ball on its way ---------- */
  Art.add('backdrop', 'bowling', function (c, W, H, t, p, o, u) {
    var i, j, l, k = Math.exp(-5 * o.beat), kk = pull(p, 0.72), fl = H * 0.665, mk = H * 0.47, pd = H * 0.57, cx = W / 2, R0 = rnd(o.seed + 'bw'), sc = 2.3, lt = W * 0.3, gap = W * 0.05, yt = fl - u * 1.6;
    var n1 = shade(p.accent, 0.12), n2 = shade(p.accent2, 0.15), n3 = shade(p.gold, 0.12), dark = dk(shade(p.bg, -0.55), kk), ns = [n1, n2, n3];
    vgrad(c, W, H, [dk(shade(p.bg, -0.4), kk), dk(p.bg, kk), dk(mix(p.bg, p.bg2, 0.45), kk)], 0, mk);
    /* the wall: little shapes like an alley carpet */
    for (i = 0; i < 44; i++) { var sx = R0() * W, sy = R0() * mk, ss = u * (0.8 + R0() * 1.2), kind = i % 3; c.save(); c.translate(sx, sy); c.rotate(R0() * 6.3); c.strokeStyle = alpha(ns[i % 3], 0.2); c.fillStyle = alpha(ns[i % 3], 0.2); c.lineWidth = u * 0.35; if (kind === 0) { c.beginPath(); c.arc(0, 0, ss, 0, TAU); c.stroke(); } else if (kind === 1) { c.beginPath(); c.moveTo(-ss, ss * 0.8); c.lineTo(0, -ss); c.lineTo(ss, ss * 0.8); c.closePath(); c.fill(); } else { c.beginPath(); c.moveTo(-ss * 1.5, 0); c.lineTo(-ss * 0.5, -ss * 0.7); c.lineTo(ss * 0.5, ss * 0.7); c.lineTo(ss * 1.5, 0); c.stroke(); } c.restore(); }
    /* running chevrons along the top, tubes down the sides */
    var nc = Math.max(7, Math.round(W / (u * 12)));
    for (i = 0; i < nc; i++) { var vx = (i + 0.5) / nc * W, lit = (i + o.n) % 3 === 0; c.globalAlpha = lit ? 1 : 0.42; c.beginPath(); c.moveTo(vx - u * 3, u * 2); c.lineTo(vx, u * 5); c.lineTo(vx + u * 3, u * 2); neon(c, ns[i % 3], u * 0.55, lit ? k : 0); } c.globalAlpha = 1;
    for (i = 0; i < 2; i++) { c.beginPath(); c.moveTo(i ? W - u * 2 : u * 2, u * 9); c.lineTo(i ? W - u * 2 : u * 2, mk - u * 3); neon(c, n2, u * 0.6, k); }
    /* two signs: a pin and a ball, a shooting star */
    var sg = Math.min(H * 0.29, mk - u * 20), fk = Math.sin(t * 7.3) > 0.985 ? 0.5 : 1;
    c.save(); c.translate(W * 0.15, sg); c.globalAlpha = fk; var q = u * 1.4;
    c.beginPath(); c.moveTo(-q * 3.2, q * 10); c.bezierCurveTo(-q * 6.4, q * 3, -q * 2.4, -q * 1, -q * 1.7, -q * 4.6); c.bezierCurveTo(-q * 3.8, -q * 7, -q * 2.8, -q * 10.8, 0, -q * 10.8); c.bezierCurveTo(q * 2.8, -q * 10.8, q * 3.8, -q * 7, q * 1.7, -q * 4.6); c.bezierCurveTo(q * 2.4, -q * 1, q * 6.4, q * 3, q * 3.2, q * 10); c.closePath(); neon(c, n1, u * 0.6, k);
    c.beginPath(); c.moveTo(-q * 1.8, -q * 3.6); c.lineTo(q * 1.8, -q * 3.6); c.moveTo(-q * 2.1, -q * 2); c.lineTo(q * 2.1, -q * 2); neon(c, n3, u * 0.45, k);
    c.beginPath(); c.arc(q * 7.6, q * 6, q * 4.4, 0, TAU); neon(c, n2, u * 0.6, k); for (i = 0; i < 3; i++) dot(c, q * (6.4 + [0, 1.9, 1.3][i]), q * (4.4 + [0.6, 0, 1.8][i]), q * 0.6, n2); c.restore(); c.globalAlpha = 1;
    c.save(); c.translate(W * 0.85, sg - u * 4); c.rotate(-0.25 + Math.sin(t * 0.8) * 0.04); K.starPath(c, 0, 0, u * 10 * (1 + k * 0.04), u * 4.4, 5, 0); neon(c, n3, u * 0.6, k); c.beginPath(); for (i = -1; i <= 1; i++) { c.moveTo(-u * 8.5, u * (9 + i * 3.2)); c.lineTo(-u * (17 - Math.abs(i) * 4), u * (17 + i * 3.4)); } neon(c, n1, u * 0.5, k); c.restore();
    /* the mask over the pins */
    var mc = dk(mix(p.bg, p.accent, 0.3), kk * 0.85); c.fillStyle = mc; c.fillRect(0, mk, W, pd - mk); vgrad2(c, 0, mk, W, pd - mk, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.18)');
    c.beginPath(); var zs = W / Math.round(W / (u * 5.5)), zy = (mk + pd) / 2, za = Math.min(u * 1.8, (pd - mk) * 0.22); for (i = 0; i * zs <= W + 1; i++) { if (i) c.lineTo(i * zs, zy + (i % 2 ? -za : za)); else c.moveTo(0, zy + za); } neon(c, n2, u * 0.5, k);
    c.beginPath(); c.moveTo(0, mk + u * 0.6); c.lineTo(W, mk + u * 0.6); neon(c, n1, u * 0.4, k);
    /* pin decks, lanes, gutters */
    c.fillStyle = dark; c.fillRect(0, pd, W, H - pd);
    var lg = c.createLinearGradient(0, fl, 0, H), w1 = dk(mix('#e3b97e', p.bg2, 0.22), kk * 0.55); lg.addColorStop(0, w1); lg.addColorStop(1, dk(mix('#f3d7a4', p.bg2, 0.22), kk * 0.3));
    for (l = -1; l <= 1; l++) {
      var lc = cx + l * (lt + gap), xl = lc - lt / 2, xr = lc + lt / 2;
      Rn(c, xl, pd + u * 0.8, lt, yt - pd, u * 0.7, mix(dark, n2, 0.22)); vgrad2(c, xl, pd + u * 0.8, lt, yt - pd - u * 0.8, 'rgba(255,255,255,0)', 'rgba(255,255,255,0.2)');
      c.beginPath(); c.moveTo(xl, yt); c.lineTo(xr, yt); c.lineTo(cx + (xr - cx) * sc, H); c.lineTo(cx + (xl - cx) * sc, H); c.closePath(); c.fillStyle = lg; c.fill();
      c.strokeStyle = alpha(p.ink, 0.1); c.lineWidth = Math.max(0.6, u * 0.2); c.beginPath(); for (i = 1; i < 7; i++) { var bx = xl + lt * i / 7; c.moveTo(bx, yt); c.lineTo(cx + (bx - cx) * sc, H); } c.stroke();
      var af = 0.4, ay = yt + (H - yt) * af, as = 1 + (sc - 1) * af; c.fillStyle = alpha(n1, 0.85); for (i = -2; i <= 2; i++) { var ax = cx + (lc + i * lt * 0.17 - cx) * as, ad = ay - Math.abs(i) * u * 1.5 * as; c.beginPath(); c.moveTo(ax, ad - u * 1.5 * as); c.lineTo(ax + u * 0.7 * as, ad + u * 0.9 * as); c.lineTo(ax - u * 0.7 * as, ad + u * 0.9 * as); c.closePath(); c.fill(); }
      var gl = c.createLinearGradient(0, yt, 0, yt + (H - yt) * 0.5); gl.addColorStop(0, alpha(l ? n1 : n2, 0.3)); gl.addColorStop(1, alpha(l ? n1 : n2, 0)); c.fillStyle = gl; c.beginPath(); c.moveTo(xl, yt); c.lineTo(xr, yt); c.lineTo(cx + (xr - cx) * sc, H); c.lineTo(cx + (xl - cx) * sc, H); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.moveTo(lc - lt * 0.2, yt); c.lineTo(lc - lt * 0.1, yt); c.lineTo(cx + (lc - lt * 0.06 - cx) * sc, H); c.lineTo(cx + (lc - lt * 0.3 - cx) * sc, H); c.closePath(); c.fill();
      /* ten pins */
      var rows = [[4, -1.5, 5], [3, -0.4, 5.6], [2, 0.9, 6.2], [1, 2.3, 6.8]];
      for (j = 0; j < 4; j++) for (i = 0; i < rows[j][0]; i++) { var ph = u * rows[j][2], px = lc + (i - (rows[j][0] - 1) / 2) * lt * 0.19, py = yt + u * (rows[j][1] + 1.6), wh = j < 2 ? shade(p.snow, -0.1) : p.snow; el(c, px, py - ph * 0.34, ph * 0.21, ph * 0.34, wh); c.fillStyle = wh; c.fillRect(px - ph * 0.09, py - ph * 0.78, ph * 0.18, ph * 0.3); dot(c, px, py - ph * 0.86, ph * 0.14, wh); c.fillStyle = p.accent; c.fillRect(px - ph * 0.1, py - ph * 0.72, ph * 0.2, ph * 0.07); c.fillRect(px - ph * 0.11, py - ph * 0.62, ph * 0.22, ph * 0.07); }
    }
    for (l = -2; l <= 1; l++) { var gx = cx + (l + 0.5) * (lt + gap); c.beginPath(); c.moveTo(gx - gap * 0.16, yt); c.lineTo(gx + gap * 0.16, yt); c.lineTo(cx + (gx + gap * 0.16 - cx) * sc, H); c.lineTo(cx + (gx - gap * 0.16 - cx) * sc, H); c.closePath(); c.fillStyle = dk(mix(p.accent, '#201830', 0.45), kk * 0.5); c.fill(); c.beginPath(); c.moveTo(gx, yt); c.lineTo(cx + (gx - cx) * sc, H); neon(c, n1, u * 0.4, k); }
    /* the ball rolling down the middle lane */
    var bf = frac(t * 0.16), byy = H * 1.06 - (H * 1.06 - yt - u * 5) * bf, bs = 1 + (sc - 1) * (byy - yt) / (H - yt), br = u * 2.2 * bs, bxx = cx + (lt * 0.1 + Math.sin(bf * 4) * lt * 0.05) * bs, bc = mix(p.accent2, '#3aa0ff', 0.3);
    c.globalAlpha = clamp((1 - bf) * 12, 0, 1); el(c, bxx, byy + br * 0.92, br * 0.95, br * 0.24, 'rgba(0,0,0,0.3)'); dot(c, bxx, byy, br, shade(bc, -0.2)); dot(c, bxx - br * 0.1, byy - br * 0.1, br * 0.86, bc); for (i = 0; i < 3; i++) { var ha = t * 5 + i * 0.75; if (Math.cos(ha) > -0.2) dot(c, bxx + Math.sin(ha) * br * 0.5, byy - br * 0.1 + (i - 1) * br * 0.26, br * 0.11, shade(bc, -0.5)); } el(c, bxx - br * 0.36, byy - br * 0.42, br * 0.24, br * 0.14, 'rgba(255,255,255,0.6)'); c.globalAlpha = 1;
  }, { variants: ['one'], stage: 'cast-low', pal: 'dark' });

  /* ---------- a carnival: a big wheel turning, the striped big top, stalls and flags ---------- */
  Art.add('backdrop', 'carnival', function (c, W, H, t, p, o, u) {
    var night = o.variant === 'night', i, j, R0 = rnd(o.seed + 'cv'), k = Math.exp(-5 * o.beat), fl = H * 0.655, kk = sky(c, W, H, t, p, o, u, night, fl, W * 0.6, H * 0.075), dim = night ? 0.26 + kk * 0.3 : 0;
    var T = function (col) { return dim ? dk(col, dim) : col; }, sb = night ? dk(p.bg2, kk * 0.9) : mix(p.bg2, '#ffffff', 0.35), cols = [p.accent, p.gold, p.accent2, shade(p.accent, 0.4), p.paper], lit = '#fff2b0';
    if (night) for (i = 0; i < 2; i++) { var sa = -PI / 2 + (i ? 0.35 : -0.3) + Math.sin(t * 0.3 + i * 2) * 0.22, ox = W * (0.5 + i * 0.14), sl = H * 0.62; c.fillStyle = alpha(p.snow, 0.06); c.beginPath(); c.moveTo(ox, fl); c.lineTo(ox + Math.cos(sa - 0.07) * sl, fl + Math.sin(sa - 0.07) * sl); c.lineTo(ox + Math.cos(sa + 0.07) * sl, fl + Math.sin(sa + 0.07) * sl); c.closePath(); c.fill(); }
    K.hill(c, W, H, fl - u * 3.5, u * 1.6, T(mix(p.accent2, sb, 0.6)), o.seed + 'a', 0.9);
    /* stalls along the midway */
    for (i = 0; i < 3; i++) { var bx = 0, bb = 0, bw = u * 7.6, ac; c.save(); c.translate(W * (0.385 + i * 0.118), fl + u * 1); c.scale(1.45, 1.45); ac = i % 2 ? p.accent2 : p.accent; Rn(c, bx - bw * 0.42, bb - u * 5.6, bw * 0.84, u * 5.6, u * 0.3, T(mix(p.paper, p.bg2, 0.3))); if (night) Rn(c, bx - bw * 0.3, bb - u * 3.6, bw * 0.6, u * 2.2, u * 0.3, alpha('#ffd98a', 0.9)); else Rn(c, bx - bw * 0.3, bb - u * 3.6, bw * 0.6, u * 2.2, u * 0.3, T(mix(p.ink, p.bg2, 0.5)));
      for (j = 0; j < 4; j++) { c.fillStyle = T(j % 2 ? p.paper : ac); c.beginPath(); c.moveTo(bx - bw / 2 + j * bw / 4, bb - u * 5.2); c.lineTo(bx - bw / 2 + (j + 1) * bw / 4, bb - u * 5.2); c.lineTo(bx - bw * 0.36 + (j + 1) * bw * 0.18, bb - u * 7.8); c.lineTo(bx - bw * 0.36 + j * bw * 0.18, bb - u * 7.8); c.closePath(); c.fill(); c.beginPath(); c.arc(bx - bw / 2 + (j + 0.5) * bw / 4, bb - u * 5.2, bw / 8, 0, PI); c.fill(); }
      pennant(c, bx, bb - u * 7.8, u * 1.5, T(cols[(i + 1) % 3]), t, i, T(mix(p.ink, p.bg2, 0.3))); c.restore(); }
    for (i = 0; i < 3; i++) { var gx = W * 0.325 + (i - 1) * u * 1.6, gy = fl - u * (9 + (i % 2) * 2) + Math.sin(t * 1.2 + i * 2) * u * 0.4; L(c, gx, gy + u * 1.9, W * 0.325, fl + u * 0.4, u * 0.14, alpha(p.snow, 0.6)); el(c, gx, gy, u * 1.5, u * 1.9, T(cols[i])); el(c, gx - u * 0.5, gy - u * 0.7, u * 0.4, u * 0.3, 'rgba(255,255,255,0.6)'); }
    /* the ground: grass, a straw path, trodden confetti */
    var g1 = T(mix('#8fd06c', p.bg2, 0.35)); vgrad2(c, 0, fl, W, H - fl, g1, shade(g1, -0.22)); el(c, W / 2, H * 1.03, W * 0.66, (H - fl) * 0.86, night ? mix(T(mix('#ecd9a8', p.bg2, 0.4)), '#d9a25e', 0.3) : mix('#ecd9a8', p.bg2, 0.4)); el(c, W / 2, H * 1.05, W * 0.52, (H - fl) * 0.7, alpha(p.snow, 0.12));
    if (night) { glow(c, W * 0.5, fl + u * 4, u * 30, '#ffd98a', 0.22); glow(c, W - u * 14, fl + u * 6, u * 24, '#ffd98a', 0.3); glow(c, u * 8, fl + u * 6, u * 22, '#ffd98a', 0.2); }
    for (i = 0; i < 50; i++) { var fx = R0() * W, fy = fl + u * 1.5 + R0() * (H - fl - u * 2), fr = R0() * 3; c.save(); c.translate(fx, fy); c.rotate(fr); c.fillStyle = alpha(T(cols[i % 5]), 0.85); c.fillRect(-u * 0.8, -u * 0.3, u * 1.6, u * 0.6); c.restore(); }
    c.strokeStyle = shade(g1, -0.25); c.lineWidth = u * 0.35; c.beginPath(); for (i = 0; i < 26; i++) { var tx = (i % 2 ? R0() * 0.2 : 0.8 + R0() * 0.2) * W, ty = fl + u * 2 + R0() * (H - fl) * 0.6; c.moveTo(tx - u * 0.8, ty); c.lineTo(tx - u * 1.1, ty - u * 1.6); c.moveTo(tx, ty); c.lineTo(tx, ty - u * 2); c.moveTo(tx + u * 0.8, ty); c.lineTo(tx + u * 1.1, ty - u * 1.6); } c.stroke();
    /* the big wheel */
    var r = u * 27, wx = u * 6, wy = Math.max(r + u * 9, fl - u * 37), wc = T(mix(p.paper, p.bg, 0.25)), a0 = t * 0.12;
    L(c, wx, wy, wx - u * 13, fl + u * 3, u * 1.5, shade(wc, -0.2)); L(c, wx, wy, wx + u * 13, fl + u * 3, u * 1.5, shade(wc, -0.12)); L(c, wx - u * 8, fl - (fl - wy) * 0.35, wx + u * 8, fl - (fl - wy) * 0.35, u * 0.8, shade(wc, -0.2));
    c.strokeStyle = wc; c.lineWidth = u * 0.45; c.beginPath(); for (i = 0; i < 12; i++) { var sa2 = a0 + i / 12 * TAU, sn = a0 + (i + 1) / 12 * TAU; c.moveTo(wx, wy); c.lineTo(wx + Math.cos(sa2) * r, wy + Math.sin(sa2) * r); c.moveTo(wx + Math.cos(sa2) * r * 0.55, wy + Math.sin(sa2) * r * 0.55); c.lineTo(wx + Math.cos(sn) * r * 0.55, wy + Math.sin(sn) * r * 0.55); } c.stroke();
    ring(c, wx, wy, r, r, u * 1, T(p.accent)); ring(c, wx, wy, r * 0.88, r * 0.88, u * 0.5, wc);
    for (i = 0; i < 24; i++) { var la = a0 + i / 24 * TAU, lx = wx + Math.cos(la) * r, ly = wy + Math.sin(la) * r, on = (i + o.n) % 2 === 0; if (night && on) dot(c, lx, ly, u * (1.8 + k * 0.8), alpha(lit, 0.3)); dot(c, lx, ly, u * 0.62, night ? (on ? lit : '#b99a58') : p.gold); }
    for (i = 0; i < 8; i++) { var ga = a0 + i / 8 * TAU, cxg = wx + Math.cos(ga) * r, cyg = wy + Math.sin(ga) * r, gc = T(cols[i % 4]), swg = Math.sin(t * 1.3 + i) * u * 0.25; L(c, cxg, cyg, cxg + swg, cyg + u * 2, u * 0.3, wc); c.beginPath(); c.arc(cxg + swg, cyg + u * 3.6, u * 2.9, PI, 0); c.closePath(); c.fillStyle = shade(gc, -0.2); c.fill(); Rn(c, cxg + swg - u * 2.9, cyg + u * 3.4, u * 5.8, u * 4, u * 1.3, gc); Rn(c, cxg + swg - u * 2, cyg + u * 3.9, u * 4, u * 1.5, u * 0.4, night ? alpha(lit, 0.9) : alpha(p.snow, 0.7)); }
    dot(c, wx, wy, u * 3.2, T(p.gold)); K.starPath(c, wx, wy, u * 2.2, u * 1, 5, a0 * 2); c.fillStyle = T(p.accent); c.fill();
    /* the big top and a little one behind it */
    var tent = function (bx, base, w, wall, roof, c1, c2, fi) {
      var n = 8, q, sw2 = w / n, ey = base - wall, py = ey - roof;
      for (q = 0; q < n; q++) { c.fillStyle = T(q % 2 ? c2 : c1); c.fillRect(bx - w / 2 + q * sw2, ey, sw2 + 0.5, wall); c.beginPath(); c.moveTo(bx, py); c.quadraticCurveTo(bx + (q - n / 2) * sw2 * 0.5, ey - roof * 0.3, bx - w / 2 * 1.06 + q * sw2 * 1.06, ey); c.lineTo(bx - w / 2 * 1.06 + (q + 1) * sw2 * 1.06, ey); c.quadraticCurveTo(bx + (q + 1 - n / 2) * sw2 * 0.5, ey - roof * 0.3, bx, py); c.fill(); }
      for (q = 0; q < n; q++) { c.beginPath(); c.arc(bx - w / 2 * 1.06 + (q + 0.5) * sw2 * 1.06, ey, sw2 * 0.53, 0, PI); c.fillStyle = T(q % 2 ? c1 : c2); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(bx, ey, w / 2, wall); c.fillStyle = T(p.gold); c.fillRect(bx - w / 2 * 1.06, ey - u * 0.4, w * 1.06, u * 0.6);
      K.archPath(c, bx - w * 0.1, base - wall * 0.86, w * 0.2, wall * 0.86); c.fillStyle = night ? '#ffd98a' : T(mix(p.ink, c1, 0.3)); c.fill(); if (night) glow(c, bx, base - wall * 0.4, w * 0.3, '#ffd98a', 0.3);
      pennant(c, bx, py + u * 0.4, u * 3, T(p.gold), t, fi, T(mix(p.ink, p.bg2, 0.3))); dot(c, bx, py, u * 0.9, T(p.gold));
    };
    tent(W - u * 36, fl + u * 1.2, u * 17, u * 5, u * 9, p.accent2, p.paper, 2); tent(W - u * 14, fl + u * 2.6, u * 36, u * 10, u * 19, p.accent, p.paper, 0);
    /* flags over everything, lights at night */
    K.flagRow(c, -u * 2, H * 0.028, W + u * 2, H * 0.028, u * 4.5, Math.max(6, Math.round(W / (u * 11))), night ? [T(p.accent), T(p.gold), T(p.accent2), T(p.paper)] : [p.accent, p.gold, p.accent2, p.paper], u * 7, t);
    if (night) K.lightString(c, -u * 3, H * 0.085, W + u * 3, H * 0.075, u * 5, Math.max(6, Math.round(W / (u * 9))), u * 1.05, o, t);
  }, { variants: ['day', 'night'], stage: 'band-low' });

  /* ---------- a ballroom: chandeliers, tall mirrors, columns and a marble floor ---------- */
  function chandelier(c, x, drop, s, t, p, k, ph) {
    var g = p.gold, i, j, n = 5, tips = [];
    glow(c, x, drop + s * 5, s * 18, '#ffe9b0', 0.28 + 0.07 * k); L(c, x, 0, x, drop, s * 0.5, shade(g, -0.25)); for (i = 0; i * s * 1.6 < drop; i++) dot(c, x, i * s * 1.6, s * 0.45, g);
    c.lineCap = 'round'; c.strokeStyle = shade(g, -0.12); c.lineWidth = s * 0.6;
    for (i = 0; i < n; i++) { var f = i / (n - 1) * 2 - 1, ax = x + f * s * 10, ay = drop + s * (7.4 - Math.abs(f) * 1.6); tips.push(ax, ay); c.beginPath(); c.moveTo(x, drop + s * 4.5); c.quadraticCurveTo(x + f * s * 5, drop + s * 11.5, ax, ay); c.stroke(); }
    for (i = 0; i < n - 1; i++) for (j = 1; j < 5; j++) { var q = j / 5; dot(c, tips[i * 2] + (tips[i * 2 + 2] - tips[i * 2]) * q, tips[i * 2 + 1] + (tips[i * 2 + 3] - tips[i * 2 + 1]) * q + Math.sin(q * PI) * s * 2.4 + s * 1, s * 0.42, alpha(p.snow, 0.6 + 0.4 * Math.sin(t * 3 + i * 2 + j + ph))); }
    for (i = 0; i < n; i++) { var tx = tips[i * 2], ty = tips[i * 2 + 1]; Rn(c, tx - s * 0.45, ty - s * 3, s * 0.9, s * 2.6, s * 0.2, p.paper); K.flame(c, tx, ty - s * 3, s * 1.3, s * 2.6, t, i * 1.7 + ph); Rn(c, tx - s * 1.1, ty - s * 0.6, s * 2.2, s * 1, s * 0.5, g); dot(c, tx, ty + s * 1.6, s * 0.5, alpha(p.snow, 0.9)); }
    Rn(c, x - s * 1.7, drop - s * 0.4, s * 3.4, s * 1.6, s * 0.6, g); dot(c, x, drop + s * 2.8, s * 1.5, g); dot(c, x, drop + s * 5.6, s * 2.3, shade(g, 0.12)); dot(c, x - s * 0.7, drop + s * 4.9, s * 0.8, 'rgba(255,255,255,0.5)'); dot(c, x, drop + s * 8.7, s * 1.3, g);
    Pg(c, [[x - s * 0.8, drop + s * 10], [x + s * 0.8, drop + s * 10], [x, drop + s * 12.6]], alpha(p.snow, 0.9), true); twinkle(c, x + s * 4, drop + s * 3, s * (1 + k * 0.8), '#ffffff'); twinkle(c, x - s * 6.5, drop + s * 9.5, s * (0.8 + 0.5 * Math.sin(t * 2 + ph)), '#ffffff');
  }
  Art.add('backdrop', 'ballroom', function (c, W, H, t, p, o, u) {
    var i, j, s, R0 = rnd(o.seed + 'br'), k = Math.exp(-5 * o.beat), fl = H * 0.665, dado = H * 0.585, g = p.gold, wall = p.bg, cx = W / 2, mar = mix(p.paper, wall, 0.18);
    vgrad(c, W, H, [shade(wall, -0.16), wall, mix(wall, p.bg2, 0.45)], 0, dado);
    /* the wall: a gilded panel, wainscot */
    c.strokeStyle = alpha(g, 0.4); c.lineWidth = u * 0.4; K.rrp(c, W * 0.35, H * 0.2, W * 0.3, dado - H * 0.2 - u * 3, u * 2); c.stroke(); K.rrp(c, W * 0.35 + u * 1.4, H * 0.2 + u * 1.4, W * 0.3 - u * 2.8, dado - H * 0.2 - u * 5.8, u * 1.2); c.stroke();
    var wc = mix(wall, p.paper, 0.3); c.fillStyle = wc; c.fillRect(0, dado, W, fl - dado); c.strokeStyle = alpha(g, 0.45); c.lineWidth = u * 0.3; for (i = 0; i < 6; i++) { K.rrp(c, W * (0.07 + i * 0.145) + u * 1, dado + u * 1.6, W * 0.145 - u * 2, fl - dado - u * 3, u * 0.6); c.stroke(); }
    c.fillStyle = g; c.fillRect(0, dado - u * 0.4, W, u * 0.9); c.fillStyle = shade(g, 0.35); c.fillRect(0, dado - u * 0.4, W, u * 0.25);
    /* tall arched mirrors */
    for (s = 0; s < 2; s++) { var mw = u * 19, mx = s ? W - u * 9.5 - mw : u * 9.5, my = Math.max(H * 0.2, dado - u * 60), mh = dado - u * 2.5 - my;
      K.archPath(c, mx - u * 1.3, my - u * 1.3, mw + u * 2.6, mh + u * 1.3); c.fillStyle = g; c.fill(); K.archPath(c, mx, my, mw, mh); var mg = c.createLinearGradient(0, my, 0, my + mh); mg.addColorStop(0, mix(wall, p.snow, 0.5)); mg.addColorStop(1, mix(wall, p.snow, 0.22)); c.fillStyle = mg; c.fill();
      c.save(); K.archPath(c, mx, my, mw, mh); c.clip(); c.fillStyle = alpha(p.snow, 0.22); for (i = 0; i < 2; i++) { c.beginPath(); c.moveTo(mx + mw * (0.5 + i * 0.36), my); c.lineTo(mx + mw * (0.72 + i * 0.36), my); c.lineTo(mx + mw * (0.12 + i * 0.36) - mh * 0.2, my + mh); c.lineTo(mx + mw * (-0.1 + i * 0.36) - mh * 0.2, my + mh); c.closePath(); c.fill(); }
      for (i = 0; i < 7; i++) twinkle(c, mx + R0() * mw, my + R0() * mh * 0.6, u * (0.7 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1.4 + R0()) + i * 2))), alpha('#fff3c8', 0.9)); c.restore();
      K.archPath(c, mx + u * 1.2, my + u * 1.2, mw - u * 2.4, mh - u * 1.2); c.lineWidth = u * 0.3; c.strokeStyle = alpha(g, 0.7); c.stroke(); dot(c, mx + mw / 2, my - u * 1.4, u * 1.8, g); dot(c, mx + mw / 2, my - u * 1.4, u * 0.9, p.accent);
      Rn(c, mx - u * 2.4, my + mh, mw + u * 4.8, u * 1.4, u * 0.6, shade(g, -0.1)); }
    /* cornice and swags of cloth */
    c.fillStyle = mar; c.fillRect(0, 0, W, u * 3); c.fillStyle = g; c.fillRect(0, u * 3, W, u * 0.6); for (i = 0; i * u * 2.4 < W; i++) c.fillRect(i * u * 2.4, u * 1.7, u * 1.2, u * 1.3);
    for (s = 0; s < 2; s++) for (i = 0; i < 2; i++) { var x1 = s ? W - u * (5 + i * 15) : u * (5 + i * 15), x2 = s ? x1 - u * 15 : x1 + u * 15, y0 = u * 3.6, d = u * (9 - i * 2); c.beginPath(); c.moveTo(x1, y0); c.quadraticCurveTo((x1 + x2) / 2, y0 + d * 2, x2, y0); c.quadraticCurveTo((x1 + x2) / 2, y0 + d * 0.5, x1, y0); c.fillStyle = i ? shade(p.accent, -0.12) : p.accent; c.fill(); c.beginPath(); c.moveTo(x1, y0); c.quadraticCurveTo((x1 + x2) / 2, y0 + d * 2, x2, y0); c.lineWidth = u * 0.6; c.strokeStyle = g; c.stroke(); c.beginPath(); c.moveTo(x1, y0); c.quadraticCurveTo((x1 + x2) / 2, y0 + d * 1.3, x2, y0); c.lineWidth = u * 0.3; c.strokeStyle = 'rgba(0,0,0,0.16)'; c.stroke(); dot(c, x2, y0 + u * 0.6, u * 1.2, g); if (i) Pg(c, [[x2 - u * 0.6, y0 + u * 1.4], [x2 + u * 0.6, y0 + u * 1.4], [x2 + u * 0.9, y0 + u * 4.6], [x2 - u * 0.9, y0 + u * 4.6]], g, true); }
    /* columns */
    for (s = 0; s < 2; s++) { var cxl = s ? W - u * 6 : 0, cy0 = Math.min(H * 0.12, u * 15); Rn(c, cxl + u * 0.6, cy0, u * 4.8, fl - cy0 + u * 1, 0, mar); c.fillStyle = 'rgba(0,0,0,0.07)'; for (i = 0; i < 3; i++) c.fillRect(cxl + u * (1.3 + i * 1.5), cy0, u * 0.5, fl - cy0); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(cxl + u * 0.9, cy0, u * 0.4, fl - cy0);
      Rn(c, cxl - u * 0.6, cy0 - u * 2.6, u * 7.2, u * 2.8, u * 0.8, g); dot(c, cxl + u * 0.2, cy0 - u * 0.8, u * 1.3, shade(g, 0.2)); dot(c, cxl + u * 5.8, cy0 - u * 0.8, u * 1.3, shade(g, 0.2)); Rn(c, cxl, u * 3.4, u * 6, cy0 - u * 5.6, 0, mar); Rn(c, cxl - u * 0.6, fl - u * 2, u * 7.2, u * 3, u * 0.6, shade(mar, -0.1)); Rn(c, cxl - u * 0.6, fl - u * 2.4, u * 7.2, u * 0.9, u * 0.4, g); }
    /* the marble floor */
    var vy = fl - (H - fl) * 0.8, tw = W / 10, A = mix(p.paper, p.bg2, 0.35), B = mix(A, wall, 0.42), rows = 6, xa = function (x, y) { return cx + (x - cx) * (y - vy) / (fl - vy); };
    c.fillStyle = A; c.fillRect(0, fl, W, H - fl); c.fillStyle = B;
    for (i = 0; i < rows; i++) { var ya = fl + (H - fl) * Math.pow(i / rows, 1.5), yb = fl + (H - fl) * Math.pow((i + 1) / rows, 1.5); for (j = -6; j < 6; j++) { if ((i + j) & 1) continue; var xl = cx + j * tw, xr = xl + tw; c.beginPath(); c.moveTo(xa(xl, ya), ya); c.lineTo(xa(xr, ya), ya); c.lineTo(xa(xr, yb), yb); c.lineTo(xa(xl, yb), yb); c.closePath(); c.fill(); } }
    vgrad2(c, 0, fl, W, (H - fl) * 0.45, alpha(p.snow, 0.3), alpha(p.snow, 0)); for (i = 0; i < 3; i++) { var gxr = W * (0.2 + i * 0.3); var rg = c.createLinearGradient(0, fl, 0, H); rg.addColorStop(0, 'rgba(255,233,176,0.3)'); rg.addColorStop(1, 'rgba(255,233,176,0)'); c.fillStyle = rg; c.beginPath(); c.moveTo(gxr - u * 3, fl); c.lineTo(gxr + u * 3, fl); c.lineTo(xa(gxr, H) + u * 7, H); c.lineTo(xa(gxr, H) - u * 7, H); c.closePath(); c.fill(); }
    c.fillStyle = g; c.fillRect(0, fl - u * 0.3, W, u * 0.8);
    /* urns of flowers */
    for (s = 0; s < 2; s++) { var ux = s ? W - u * 12 : u * 12, ub = fl + u * 6, fc = [p.accent, shade(p.accent, 0.45), p.paper, p.gold, shade(p.accent, 0.25)]; el(c, ux, ub, u * 5, u * 1, 'rgba(0,0,0,0.14)'); Rn(c, ux - u * 3, ub - u * 7, u * 6, u * 7, u * 0.5, mar); Rn(c, ux - u * 3.7, ub - u * 7.6, u * 7.4, u * 1.4, u * 0.6, shade(mar, -0.08)); Rn(c, ux - u * 3.7, ub - u * 1.2, u * 7.4, u * 1.2, u * 0.5, shade(mar, -0.12));
      for (i = -3; i <= 3; i++) leaf(c, ux, ub - u * 11.5, u * (8.5 - Math.abs(i) * 0.6), -PI / 2 + i * 0.42 + Math.sin(t * 0.9 + i + s) * 0.04, i % 2 ? p.accent2 : shade(p.accent2, -0.15));
      for (i = 0; i < 5; i++) K.bloom(c, ux + [0, -3.6, 3.6, -1.9, 2][i] * u, ub - [17.6, 15, 15.2, 12.8, 12.6][i] * u, u * (i ? 2.6 : 3.1), fc[(i + s) % 5], t, i + s * 2);
      Pg(c, [[ux - u * 1, ub - u * 7.6], [ux + u * 1, ub - u * 7.6], [ux + u * 1.6, ub - u * 8.6], [ux - u * 1.6, ub - u * 8.6]], shade(g, -0.15), true); c.beginPath(); c.ellipse(ux, ub - u * 10.2, u * 3.5, u * 2.2, 0, 0, PI); c.fillStyle = g; c.fill(); Rn(c, ux - u * 3.9, ub - u * 10.9, u * 7.8, u * 1.1, u * 0.5, shade(g, 0.2)); }
    chandelier(c, cx, Math.min(H * 0.02, u * 3), u * 0.8, t, p, k, 0); chandelier(c, W * 0.2, Math.min(H * 0.055, u * 9), u * 1.15, t, p, k, 2); chandelier(c, W * 0.8, Math.min(H * 0.055, u * 9), u * 1.15, t, p, k, 4);
  }, { variants: ['one'], stage: 'cast-low' });

  /* ---------- a theatre: a gilded proscenium with bulbs, red curtains tied back, shell footlights ---------- */
  Art.add('backdrop', 'theatre', function (c, W, H, t, p, o, u) {
    var i, s, R0 = rnd(o.seed + 'th'), k = Math.exp(-5 * o.beat), kk = pull(p, 0.55), fl = H * 0.665, red = p.accent, g = p.gold, g2 = mix(g, '#8a5a20', 0.28), cx = W / 2;
    vgrad(c, W, H, [dk(shade(p.bg, -0.4), kk), dk(p.bg, kk), dk(mix(p.bg, p.bg2, 0.6), kk)], 0, fl);
    glow(c, cx, H * 0.4, u * 46, p.snow, 0.13); for (i = 0; i < 40; i++) { var sx = R0() * W, sy = R0() * fl * 0.9, tw = 0.5 + 0.5 * Math.sin(t * (1 + R0() * 2.5) + i); if (i % 6 === 0) twinkle(c, sx, sy, u * (0.6 + tw), alpha(g, 0.4 + 0.5 * tw)); else dot(c, sx, sy, u * (0.15 + R0() * 0.25), alpha(g, 0.2 + 0.6 * tw)); }
    for (i = 0; i < 5; i++) { var cw = u * (16 + R0() * 14), cxx = frac(R0() + t * 0.003 * (1 + i * 0.3)) * (W + cw * 2) - cw, cy = fl * (0.56 + R0() * 0.3); el(c, cxx, cy, cw, u * 2.2, alpha(p.snow, 0.06)); el(c, cxx + cw * 0.3, cy - u * 1.6, cw * 0.5, u * 1.8, alpha(p.snow, 0.06)); }
    vgrad2(c, 0, fl - H * 0.2, W, H * 0.2, 'rgba(255,233,160,0)', 'rgba(255,233,160,0.14)');
    /* the boards */
    var w1 = dk(mix('#a56a3c', p.bg2, 0.18), kk * 0.5); vgrad2(c, 0, fl, W, H - fl, w1, shade(w1, -0.42)); c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = Math.max(0.6, u * 0.2); c.beginPath(); for (i = -7; i <= 7; i++) { c.moveTo(cx + i * W * 0.075, fl); c.lineTo(cx + i * W * 0.2, H); } c.stroke();
    el(c, cx, fl + (H - fl) * 0.5, W * 0.36, (H - fl) * 0.3, alpha(p.snow, 0.08)); c.fillStyle = shade(w1, 0.28); c.fillRect(0, fl, W, u * 0.8);
    /* curtains tied back */
    for (s = 0; s < 2; s++) {
      c.save(); if (s) { c.translate(W, 0); c.scale(-1, 1); }
      var tw2 = W * 0.37, ty = Math.max(H * 0.42, fl - u * 44), bw = W * 0.17 + Math.sin(t * 0.6 + s * 2) * u * 0.4, yb = fl + u * 3.5, tx = W * 0.11, cg = c.createLinearGradient(0, 0, tw2, 0);
      cg.addColorStop(0, shade(red, -0.35)); cg.addColorStop(0.3, red); cg.addColorStop(0.6, shade(red, -0.12)); cg.addColorStop(1, shade(red, -0.3));
      c.beginPath(); c.moveTo(0, 0); c.lineTo(tw2, 0); c.bezierCurveTo(tw2 * 0.95, ty * 0.5, W * 0.2, ty - H * 0.05, tx + u * 1, ty); c.bezierCurveTo(W * 0.15, ty + (yb - ty) * 0.3, bw, yb - (yb - ty) * 0.4, bw, yb); c.lineTo(0, yb); c.closePath(); c.fillStyle = cg; c.fill();
      for (i = 1; i < 7; i++) { var f = i / 7; c.beginPath(); c.moveTo(tw2 * f, 0); c.bezierCurveTo(tw2 * f * 0.95, ty * 0.5, tx * (0.3 + f * 0.9), ty - H * 0.05, tx * (0.25 + f * 0.75), ty); c.bezierCurveTo(tx * (0.3 + f), ty + (yb - ty) * 0.3, bw * f, yb - (yb - ty) * 0.4, bw * f, yb); c.lineWidth = u * (i % 2 ? 0.9 : 0.5); c.strokeStyle = i % 2 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.13)'; c.stroke(); }
      c.beginPath(); c.moveTo(0, yb); for (i = 0; i < 6; i++) c.quadraticCurveTo(bw * (i + 0.5) / 6, yb + u * 1.6, bw * (i + 1) / 6, yb); c.lineTo(bw, yb - u * 1.4); c.lineTo(0, yb - u * 1.4); c.closePath(); c.fillStyle = g; c.fill();
      Rn(c, u * 3, ty - u * 1.5, tx - u * 0.6, u * 3, u * 1.5, g); Rn(c, u * 3, ty - u * 1.5, tx - u * 0.6, u * 0.9, u * 0.45, shade(g, 0.3)); L(c, tx + u * 0.6, ty + u * 1, tx + u * 1.6, ty + u * 5, u * 0.4, g); dot(c, tx + u * 1.6, ty + u * 5.4, u * 1.2, g); Pg(c, [[tx + u * 0.6, ty + u * 6], [tx + u * 2.6, ty + u * 6], [tx + u * 3.1, ty + u * 10], [tx + u * 0.1, ty + u * 10]], shade(g, -0.1), true);
      c.restore();
    }
    /* the valance */
    var nv = Math.max(5, Math.round(W / (u * 18))), vy = u * 2.4, d = u * 7; c.fillStyle = shade(red, -0.25); c.fillRect(0, 0, W, vy + u * 2);
    for (i = 0; i < nv; i++) { var x1 = i / nv * W, x2 = (i + 1) / nv * W, xm = (x1 + x2) / 2; c.beginPath(); c.moveTo(x1, vy); c.quadraticCurveTo(xm, vy + d * 2.5, x2, vy); c.closePath(); c.fillStyle = i % 2 ? red : shade(red, -0.12); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = u * 0.4; c.beginPath(); c.moveTo(x1 + u * 1, vy); c.quadraticCurveTo(xm, vy + d * 1.7, x2 - u * 1, vy); c.moveTo(x1 + u * 3, vy); c.quadraticCurveTo(xm, vy + d * 0.9, x2 - u * 3, vy); c.stroke(); c.beginPath(); c.moveTo(x1, vy); c.quadraticCurveTo(xm, vy + d * 2.5, x2, vy); c.lineWidth = u * 0.9; c.strokeStyle = g; c.stroke(); }
    for (i = 1; i < nv; i++) { var jx = i / nv * W; dot(c, jx, vy + u * 0.8, u * 1.3, g); Pg(c, [[jx - u * 0.7, vy + u * 1.6], [jx + u * 0.7, vy + u * 1.6], [jx + u * 1.1, vy + u * 5], [jx - u * 1.1, vy + u * 5]], shade(g, -0.08), true); }
    /* the gilded arch and its bulbs */
    c.fillStyle = g2; c.fillRect(0, 0, u * 4, H); c.fillRect(W - u * 4, 0, u * 4, H); c.fillRect(0, 0, W, u * 2.6); c.fillStyle = shade(g2, 0.3); c.fillRect(u * 3.5, u * 2.6, u * 0.5, H); c.fillRect(W - u * 4, u * 2.6, u * 0.5, H); c.fillRect(0, u * 2.2, W, u * 0.4);
    var nb = Math.round(H / (u * 5.5)), bulb = function (x, y, q) { var on = (q + o.n) % 3 === 0; if (on) dot(c, x, y, u * (2 + k * 0.9), 'rgba(255,240,180,0.3)'); dot(c, x, y, u * 0.85, on ? '#fff6c8' : shade(g, 0.25)); };
    for (i = 0; i < nb; i++) { bulb(u * 1.8, (i + 0.5) / nb * H, i); bulb(W - u * 1.8, (i + 0.5) / nb * H, i + 1); } var nt = Math.round(W / (u * 5.5)); for (i = 1; i < nt; i++) bulb(i / nt * W, u * 1.1, i);
    el(c, cx, u * 2.6, u * 7.5, u * 4.2, g2); el(c, cx, u * 2.6, u * 6.3, u * 3.2, g); K.starPath(c, cx, u * 2.8, u * 2.6 * (1 + k * 0.06), u * 1.15, 5, 0); c.fillStyle = p.paper; c.fill();
    /* footlights */
    var nf = Math.max(7, Math.round(W / (u * 12))); for (i = 0; i < nf; i++) { var fx = (i + 0.5) / nf * W, on2 = (i + o.n) % 2 === 0; if (on2) glow(c, fx, H - u * 2.5, u * 10, '#ffe9a0', 0.3 + 0.1 * k); c.beginPath(); c.arc(fx, H + u * 0.3, u * 3.3, PI, 0); c.closePath(); c.fillStyle = shade(g2, -0.2); c.fill(); c.strokeStyle = shade(g, 0.2); c.lineWidth = u * 0.3; c.beginPath(); for (s = -2; s <= 2; s++) { c.moveTo(fx, H); c.lineTo(fx + Math.sin(s * 0.5) * u * 3.1, H - Math.cos(s * 0.5) * u * 2.9); } c.stroke(); dot(c, fx, H - u * 0.6, u * 1, on2 ? '#fff6c8' : '#b9965a'); }
  }, { variants: ['one'], stage: 'cast-low', pal: 'dark' });

  /* ---------- a stadium: the bowl of stands, a roof with flags, floodlight masts, a running track round the turf ---------- */
  Art.add('backdrop', 'stadium', function (c, W, H, t, p, o, u) {
    var night = o.variant === 'night', i, k = Math.exp(-5 * o.beat), fl = H * 0.652, kk = sky(c, W, H, t, p, o, u, night, H * 0.52, W * 0.66, H * 0.07), dim = night ? 0.16 + kk * 0.3 : 0, cx = W / 2;
    var T = function (col) { return dim ? dk(col, dim) : col; }, mast = T(mix(p.paper, p.ink, 0.45)), rise = Math.min(H * 0.15, u * 17);
    var yT = function (x) { return H * 0.535 - Math.pow(Math.abs(x / W * 2 - 1), 1.7) * rise; }, yB = function (x) { return H * 0.638; }, yM = function (x) { return yT(x) * 0.48 + yB(x) * 0.52; };
    /* masts behind the stands */
    tower(c, W * 0.29, yT(W * 0.29) + u * 2, yT(W * 0.29) - u * 17, u * 0.62, mast, night, k, -1); tower(c, W * 0.71, yT(W * 0.71) + u * 2, yT(W * 0.71) - u * 17, u * 0.62, mast, night, k, 1);
    tower(c, u * 8, yT(u * 8) + u * 2, Math.max(H * 0.1, yT(u * 8) - u * 50), u * 1.15, mast, night, k, 1); tower(c, W - u * 8, yT(W - u * 8) + u * 2, Math.max(H * 0.1, yT(W - u * 8) - u * 50), u * 1.15, mast, night, k, -1);
    /* the bowl */
    var conc = T(mix(p.paper, p.bg, 0.4)), path = function (f) { c.beginPath(); c.moveTo(0, yB(0) + u); for (i = 0; i <= 30; i++) c.lineTo(i / 30 * W, f(i / 30 * W)); c.lineTo(W, yB(W) + u); c.closePath(); };
    path(yT); c.fillStyle = conc; c.fill(); path(yM); c.fillStyle = shade(conc, -0.1); c.fill();
    var cc = [T(p.accent), T(p.gold), T(p.accent2), T(p.paper), T(mix(p.bg, p.ink, 0.5)), T(shade(p.accent, 0.4))];
    crowd(c, 0, W, function (x) { return yT(x) + u * 1.6; }, function (x) { return yM(x) - u * 0.9; }, 6, u * 1.5, o.seed + 'u', cc); crowd(c, 0, W, function (x) { return yM(x) + u * 1.1; }, function (x) { return yB(x) - u * 0.4; }, 6, u * 1.65, o.seed + 'l', cc);
    c.beginPath(); for (i = 0; i <= 30; i++) { var mx = i / 30 * W; if (i) c.lineTo(mx, yM(mx)); else c.moveTo(mx, yM(mx)); } c.lineWidth = u * 1.3; c.strokeStyle = T(mix(p.paper, p.ink, 0.35)); c.stroke(); c.lineWidth = u * 0.3; c.strokeStyle = alpha(p.snow, 0.5); c.stroke();
    for (i = 1; i < 8; i++) { var ax = i / 8 * W; L(c, ax, yT(ax) + u * 1, ax + (ax - cx) * 0.05, yB(ax), u * 0.7, shade(conc, -0.22)); }
    if (night) { flashes(c, 0, W, function (x) { return yT(x) + u * 2; }, yB, 12, o.seed, t, u); }
    /* the roof and its flags */
    var roof = T(mix(p.paper, p.bg2, 0.25)); c.beginPath(); for (i = 0; i <= 30; i++) { var rx = i / 30 * W; if (i) c.lineTo(rx, yT(rx) - u * 2.2); else c.moveTo(rx, yT(rx) - u * 2.2); } for (i = 30; i >= 0; i--) { var rx2 = i / 30 * W; c.lineTo(rx2, yT(rx2) + u * 1.2); } c.closePath(); c.fillStyle = roof; c.fill();
    c.beginPath(); for (i = 0; i <= 30; i++) { var rx3 = i / 30 * W; if (i) c.lineTo(rx3, yT(rx3) + u * 1); else c.moveTo(rx3, yT(rx3) + u * 1); } c.lineWidth = u * 0.6; c.strokeStyle = shade(roof, -0.25); c.stroke(); if (night) { c.lineWidth = u * 0.3; c.strokeStyle = 'rgba(255,246,208,0.8)'; c.stroke(); }
    var fc = [p.accent, p.gold, p.accent2, p.paper]; for (i = 0; i < 9; i++) { var fx = (i + 0.5) / 9 * W; pennant(c, fx, yT(fx) - u * 2, u * 2, T(fc[i % 4]), t, i * 1.3, mast); }
    /* boards, the track, the turf */
    var bn = Math.round(W / (u * 9)); for (i = 0; i < bn; i++) { c.fillStyle = T([p.accent, p.paper, p.accent2, p.gold][i % 4]); c.fillRect(i * W / bn, H * 0.636, W / bn + 0.5, fl - H * 0.636 + u * 0.4); } c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(0, H * 0.636, W, u * 0.3);
    var tr = T(mix('#c9573f', p.accent, 0.3)), ty = fl + u * 0.4, tb = H * 0.7; vgrad2(c, 0, ty, W, tb - ty, shade(tr, -0.1), tr); c.strokeStyle = alpha(p.snow, 0.75); c.lineWidth = u * 0.3; c.beginPath(); [0.14, 0.36, 0.62, 0.94].forEach(function (f) { c.moveTo(0, ty + (tb - ty) * f); c.lineTo(W, ty + (tb - ty) * f); }); c.stroke();
    var gr = T(mix('#4fb35a', p.bg2, 0.22)); turfV(c, W, tb, H, gr, H * 0.52); vgrad2(c, 0, tb, W, H - tb, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.14)'); c.fillStyle = alpha(p.snow, 0.85); c.fillRect(0, tb + u * 1.2, W, u * 0.5);
    if (night) { beam(c, u * 8, H * 0.12, W * 0.3, H * 0.86, W * 0.2, 0.16); beam(c, W - u * 8, H * 0.12, W * 0.7, H * 0.86, W * 0.2, 0.16); el(c, W * 0.3, H * 0.86, W * 0.3, (H - tb) * 0.3, 'rgba(255,246,208,0.08)'); el(c, W * 0.7, H * 0.86, W * 0.3, (H - tb) * 0.3, 'rgba(255,246,208,0.08)'); }
  }, { variants: ['day', 'night'], stage: 'band-low' });

  /* ---------- an indoor court: hardwood, painted lines, a hoop at each end, pull-out bleachers ---------- */
  Art.add('backdrop', 'court', function (c, W, H, t, p, o, u) {
    var i, j, s, R0 = rnd(o.seed + 'ct'), k = Math.exp(-5 * o.beat), fl = H * 0.66, bl = H * 0.535, wall = p.bg, wood = mix('#e3ac6a', p.bg2, 0.3), steel = mix('#8d97a6', wall, 0.25), cx = W / 2, fh = H - fl, st = H * 0.44;
    vgrad(c, W, H, [shade(wall, -0.12), wall, mix(wall, p.bg2, 0.35)], 0, bl);
    c.fillStyle = alpha(p.snow, 0.05); for (j = 0; j * u * 5 < st; j++) for (i = -1; i * u * 11 < W; i++) c.fillRect(i * u * 11 + (j % 2) * u * 5.5 + u * 0.3, j * u * 5 + u * 0.3, u * 10.4, u * 4.4);
    c.fillStyle = mix(wall, p.accent, 0.6); c.fillRect(0, st, W, u * 2.4); c.fillStyle = mix(wall, p.gold, 0.6); c.fillRect(0, st + u * 2.4, W, u * 0.8);
    var pad = mix(wall, p.ink, 0.16); c.fillStyle = pad; c.fillRect(0, st + u * 3.2, W, bl - st - u * 3.2); c.fillStyle = shade(pad, -0.14); for (i = 0; i * u * 9 < W; i++) c.fillRect(i * u * 9, st + u * 3.2, u * 0.3, bl - st);
    /* the roof truss, lamps, plain banners */
    var ty = u * 1.2; c.strokeStyle = steel; c.lineWidth = u * 0.45; c.beginPath(); c.moveTo(0, ty); c.lineTo(W, ty); c.moveTo(0, ty + u * 3); c.lineTo(W, ty + u * 3); for (i = 0; i * u * 3 < W; i++) { c.moveTo(i * u * 3, ty + (i % 2 ? 0 : u * 3)); c.lineTo((i + 1) * u * 3, ty + (i % 2 ? u * 3 : 0)); } c.stroke();
    for (i = 0; i < 2; i++) { var lx = W * (0.4 + i * 0.2), ly = ty + u * 6; L(c, lx, ty + u * 3, lx, ly, u * 0.3, steel); glow(c, lx, ly + u * 3, u * 16, '#fff4c8', 0.2 + 0.04 * k); Pg(c, [[lx - u * 1.6, ly], [lx + u * 1.6, ly], [lx + u * 4.2, ly + u * 2.6], [lx - u * 4.2, ly + u * 2.6]], steel, true); Rn(c, lx - u * 3.6, ly + u * 2.4, u * 7.2, u * 0.9, u * 0.45, '#fff6d0'); }
    var bc = [p.accent, p.gold, p.accent2];
    for (s = 0; s < 2; s++) for (i = 0; i < 3; i++) { var bx = s ? W - u * (7 + i * 8) : u * (7 + i * 8), by = ty + u * 3.4, bw = u * 6, bh = u * (10 - (i % 2) * 1.2), sw = Math.sin(t * 0.9 + i + s * 2) * u * 0.3; c.fillStyle = bc[(i + s) % 3]; c.beginPath(); c.moveTo(bx - bw / 2, by); c.lineTo(bx + bw / 2, by); c.lineTo(bx + bw / 2 + sw, by + bh); c.lineTo(bx + sw, by + bh - u * 2.2); c.lineTo(bx - bw / 2 + sw, by + bh); c.closePath(); c.fill(); c.fillStyle = alpha(p.paper, 0.85); c.fillRect(bx - bw / 2, by + u * 2.2, bw, u * 1); c.fillRect(bx - bw / 2, by + u * 4, bw, u * 0.5); Rn(c, bx - bw / 2 - u * 0.4, by - u * 0.4, bw + u * 0.8, u * 0.9, u * 0.4, steel); }
    /* bleachers */
    var rh = (fl - bl) / 5, seat = shade(wood, 0.14); for (i = 0; i < 5; i++) { c.fillStyle = seat; c.fillRect(0, bl + i * rh, W, rh * 0.42); c.fillStyle = shade(wood, -0.2 - i * 0.03); c.fillRect(0, bl + i * rh + rh * 0.42, W, rh * 0.6); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(0, bl + i * rh, W, rh * 0.1); }
    for (i = 1; i < 4; i++) { var ax = i / 4 * W; c.fillStyle = shade(wood, -0.38); c.fillRect(ax - u * 1.6, bl, u * 3.2, fl - bl); c.fillStyle = shade(wood, -0.1); for (j = 0; j < 10; j++) c.fillRect(ax - u * 1.3, bl + j * rh / 2 + rh * 0.12, u * 2.6, rh * 0.16); L(c, ax - u * 1.6, bl - u * 2.4, ax - u * 1.6, bl + rh, u * 0.4, steel); L(c, ax + u * 1.6, bl - u * 2.4, ax + u * 1.6, bl + rh, u * 0.4, steel); L(c, ax - u * 1.6, bl - u * 2.4, ax + u * 1.6, bl - u * 2.4, u * 0.4, steel); }
    var gbx = W * 0.34, gby = bl + rh * 3; Rn(c, gbx - u * 3.4, gby - u * 3.2, u * 6.8, u * 3.2, u * 1.4, p.accent2); Rn(c, gbx - u * 3.4, gby - u * 2, u * 6.8, u * 0.6, 0, shade(p.accent2, 0.35)); c.beginPath(); c.arc(gbx, gby - u * 3, u * 1.8, PI, 0); c.lineWidth = u * 0.45; c.strokeStyle = shade(p.accent2, -0.25); c.stroke(); Rn(c, W * 0.63, bl + rh * 2 - u * 3.4, u * 1.5, u * 3.4, u * 0.5, p.paper); Rn(c, W * 0.63 + u * 0.3, bl + rh * 2 - u * 4.1, u * 0.9, u * 0.9, u * 0.2, p.accent); Rn(c, W * 0.66, bl + rh * 2 - u * 1.2, u * 5, u * 1.2, u * 0.5, p.gold);
    /* the floor */
    vgrad2(c, 0, fl, W, fh, shade(wood, 0.12), shade(wood, -0.12)); c.fillStyle = alpha(p.ink, 0.1); for (i = 1; i < 10; i++) { var yy = fl + fh * Math.pow(i / 10, 1.5), y2 = fl + fh * Math.pow((i + 1) / 10, 1.5); c.fillRect(0, yy, W, Math.max(0.6, u * 0.15)); for (j = 0; j < 6; j++) c.fillRect(frac(i * 0.37 + j * 0.21) * W, yy, Math.max(0.6, u * 0.15), y2 - yy); }
    var ln = alpha(p.snow, 0.92), lw = u * 0.6, ya = fl + fh * 0.3, yb = fl + fh * 0.72, ym = (ya + yb) / 2, kc = mix(wood, p.accent2, 0.55);
    for (s = 0; s < 2; s++) { c.save(); if (s) { c.translate(W, 0); c.scale(-1, 1); }
      ring(c, -u * 2, ym, W * 0.41, fh * 0.44, lw, ln, -PI / 2, PI / 2); c.beginPath(); c.moveTo(0, ya); c.lineTo(W * 0.19, ya); c.lineTo(W * 0.23, yb); c.lineTo(0, yb); c.closePath(); c.fillStyle = kc; c.fill(); c.lineWidth = lw; c.strokeStyle = ln; c.stroke(); ring(c, W * 0.21, ym, W * 0.07, (yb - ya) / 2, lw, ln, -PI / 2, PI / 2); c.restore(); }
    c.strokeStyle = ln; c.lineWidth = lw; c.beginPath(); c.moveTo(0, fl + u * 1.8); c.lineTo(W, fl + u * 1.8); c.moveTo(cx, fl + u * 1.8); c.lineTo(cx, H); c.stroke(); el(c, cx, fl + fh * 0.51, W * 0.17, fh * 0.2, mix(wood, p.accent, 0.5)); ring(c, cx, fl + fh * 0.51, W * 0.17, fh * 0.2, lw, ln); ring(c, cx, fl + fh * 0.51, W * 0.06, fh * 0.07, lw, ln); c.fillStyle = ln; c.fillRect(cx - lw / 2, fl + fh * 0.31, lw, fh * 0.4);
    vgrad2(c, 0, fl, W, fh * 0.4, alpha(p.snow, 0.26), alpha(p.snow, 0)); c.fillStyle = alpha(p.snow, 0.1); for (i = 0; i < 4; i++) { var gx = W * (0.14 + i * 0.24); c.beginPath(); c.moveTo(gx - u * 2, fl); c.lineTo(gx + u * 2, fl); c.lineTo(cx + (gx - cx) * 1.8 + u * 5, H); c.lineTo(cx + (gx - cx) * 1.8 - u * 5, H); c.closePath(); c.fill(); }
    c.fillStyle = shade(wood, -0.4); c.fillRect(0, fl - u * 0.3, W, u * 0.7);
    /* a hoop at each end, seen from the side */
    for (s = 0; s < 2; s++) { c.save(); if (s) { c.translate(W, 0); c.scale(-1, 1); } var hy = Math.max(H * 0.3, bl - u * 44), nsw = Math.sin(t * 1.6 + s) * u * 0.35 + k * u * 0.3, rimc = mix('#f0702c', p.accent, 0.25), rxm = u * 17.5, rym = hy + u * 6;
      L(c, 0, hy - u * 8, u * 9, hy + u * 3, u * 1, steel); Rn(c, -u * 1, hy + u * 1.5, u * 10.5, u * 2.6, u * 1.2, steel); Rn(c, -u * 1, hy + u * 1.5, u * 6, u * 2.6, u * 1.2, mix(p.accent, steel, 0.25));
      Pg(c, [[u * 9, hy - u * 7], [u * 12, hy - u * 8.6], [u * 12, hy + u * 9.6], [u * 9, hy + u * 8]], shade(p.paper, -0.04), true); c.beginPath(); c.moveTo(u * 9, hy - u * 7); c.lineTo(u * 12, hy - u * 8.6); c.lineTo(u * 12, hy + u * 9.6); c.lineTo(u * 9, hy + u * 8); c.closePath(); c.lineWidth = u * 0.5; c.strokeStyle = mix(p.ink, p.paper, 0.35); c.stroke(); c.beginPath(); c.moveTo(u * 9.8, hy + u * 1.2); c.lineTo(u * 11.3, hy + u * 0.6); c.lineTo(u * 11.3, hy + u * 6.6); c.lineTo(u * 9.8, hy + u * 6.4); c.closePath(); c.lineWidth = u * 0.4; c.strokeStyle = p.accent; c.stroke();
      ring(c, rxm, rym, u * 5, u * 1.5, u * 0.7, shade(rimc, -0.25), PI, TAU); c.strokeStyle = alpha(p.snow, 0.9); c.lineWidth = u * 0.28; c.beginPath(); for (i = 0; i <= 7; i++) { var f = i / 7 * 2 - 1; c.moveTo(rxm + f * u * 5, rym + Math.sqrt(1 - f * f) * u * 1.2); c.quadraticCurveTo(rxm + f * u * 3.6 + nsw * 0.5, rym + u * 4, rxm + f * u * 2.7 + nsw, rym + u * 7.4); } for (j = 1; j <= 3; j++) { var nf = j / 3.4; c.moveTo(rxm - u * (5 - 2.3 * nf) + nsw * nf, rym + u * 7.4 * nf); c.quadraticCurveTo(rxm + nsw * nf, rym + u * 7.4 * nf + u * 1.4, rxm + u * (5 - 2.3 * nf) + nsw * nf, rym + u * 7.4 * nf); } c.stroke();
      ring(c, rxm, rym, u * 5, u * 1.5, u * 0.75, rimc, 0, PI); Rn(c, u * 11.6, rym - u * 0.6, u * 1.6, u * 1.6, u * 0.3, rimc); c.restore(); }
    /* a ball left on the floor */
    var bxx = W * 0.64, br = u * 3.6, byy = H * 0.925 - br, ballc = mix('#e8782e', p.accent, 0.2); el(c, bxx, byy + br, br * 1, br * 0.24, 'rgba(0,0,0,0.2)'); dot(c, bxx, byy, br, shade(ballc, -0.14)); dot(c, bxx - br * 0.1, byy - br * 0.1, br * 0.86, ballc); c.save(); c.beginPath(); c.arc(bxx, byy, br, 0, TAU); c.clip(); c.strokeStyle = shade(ballc, -0.55); c.lineWidth = u * 0.3; c.beginPath(); c.moveTo(bxx - br, byy); c.lineTo(bxx + br, byy); c.moveTo(bxx, byy - br); c.lineTo(bxx, byy + br); c.stroke(); ring(c, bxx - br * 1.1, byy, br * 0.8, br * 0.9, u * 0.3, shade(ballc, -0.55)); ring(c, bxx + br * 1.1, byy, br * 0.8, br * 0.9, u * 0.3, shade(ballc, -0.55)); c.restore(); el(c, bxx - br * 0.4, byy - br * 0.45, br * 0.24, br * 0.14, 'rgba(255,255,255,0.5)');
  }, { variants: ['one'], stage: 'cast-low' });

  /* ---------- a ballpark: the diamond from behind home plate, the outfield wall, bleachers and a lamp-lit board ---------- */
  Art.add('backdrop', 'ballpark', function (c, W, H, t, p, o, u) {
    var night = o.variant === 'night', i, j, k = Math.exp(-5 * o.beat), R0 = rnd(o.seed + 'bp'), kk = sky(c, W, H, t, p, o, u, night, H * 0.6, W * 0.3, H * 0.085), dim = night ? 0.16 + kk * 0.3 : 0, cx = W / 2;
    var T = function (col) { return dim ? dk(col, dim) : col; }, mast = T(mix(p.paper, p.ink, 0.45)), wy = H * 0.6;
    var wT = function (x) { var e = x / W * 2 - 1; return wy + e * e * u * 1.6; }, sT = function (x) { return wT(x) - u * (6.5 + Math.pow(Math.abs(x / W * 2 - 1), 1.5) * 6); };
    tower(c, u * 9, sT(u * 9) + u * 2, Math.max(H * 0.11, sT(u * 9) - u * 48), u * 1.15, mast, night, k, 1); tower(c, W * 0.36, sT(W * 0.36) + u * 2, sT(W * 0.36) - u * 16, u * 0.62, mast, night, k, -1); tower(c, W - u * 5, sT(W) + u * 2, Math.max(H * 0.16, sT(W) - u * 40), u * 1, mast, night, k, -1);
    /* the board: lamps only */
    var bw = u * 30, bh = u * 13, bx = W * 0.9 - bw, by = sT(W * 0.75) - u * 3 - bh, bd = T(mix('#1f3b34', p.bg, 0.25));
    L(c, bx + u * 4, by + bh, bx + u * 4, wy, u * 1, mast); L(c, bx + bw - u * 4, by + bh, bx + bw - u * 4, wy, u * 1, mast); Rn(c, bx - u * 0.8, by - u * 0.8, bw + u * 1.6, bh + u * 1.6, u * 1, T(mix(p.paper, p.ink, 0.3))); Rn(c, bx, by, bw, bh, u * 0.6, bd);
    for (j = 0; j < 2; j++) for (i = 0; i < 9; i++) { var qx = bx + u * 1.6 + i * (bw - u * 3.2) / 9, qy = by + u * 3.6 + j * u * 4.4, qw = (bw - u * 3.2) / 9 - u * 0.5, v = R0(), d; Rn(c, qx, qy, qw, u * 3.4, u * 0.3, shade(bd, 0.12)); for (d = 0; d < 6; d++) { var onl = ((i * 7 + j * 3 + d * 5 + (d === 5 ? o.n : 0)) % 3) !== 0 && v > 0.25; dot(c, qx + qw * (0.3 + (d % 2) * 0.4), qy + u * (0.75 + Math.floor(d / 2) * 0.95), u * 0.33, onl ? alpha(p.gold, night ? 1 : 0.9) : shade(bd, 0.25)); } }
    for (i = 0; i < 7; i++) { var on = (i + o.n) % 2 === 0; dot(c, bx + bw * (0.2 + i * 0.1), by + u * 1.7, u * 0.6, on ? '#fff6c8' : shade(bd, 0.3)); }
    for (i = 0; i < 3; i++) pennant(c, bx + bw * (0.15 + i * 0.35), by - u * 0.6, u * 2.2, T([p.accent, p.gold, p.accent2][i]), t, i * 1.4, mast);
    if (night) glow(c, bx + bw / 2, by + bh / 2, u * 22, p.gold, 0.14);
    /* bleachers, then the wall */
    var conc = T(mix(p.paper, p.bg, 0.4)); c.beginPath(); c.moveTo(0, wy + u * 3); for (i = 0; i <= 24; i++) c.lineTo(i / 24 * W, sT(i / 24 * W)); c.lineTo(W, wy + u * 3); c.closePath(); c.fillStyle = conc; c.fill();
    crowd(c, 0, W, function (x) { return sT(x) + u * 1; }, function (x) { return wT(x) - u * 0.2; }, 7, u * 1.6, o.seed + 'b', [T(p.accent), T(p.gold), T(p.accent2), T(p.paper), T(mix(p.bg, p.ink, 0.5)), T(shade(p.accent, 0.4))]);
    c.beginPath(); for (i = 0; i <= 24; i++) { var rx = i / 24 * W; if (i) c.lineTo(rx, sT(rx)); else c.moveTo(rx, sT(rx)); } c.lineWidth = u * 0.7; c.strokeStyle = T(mix(p.paper, p.ink, 0.3)); c.stroke();
    if (night) flashes(c, 0, W, function (x) { return sT(x) + u * 1; }, wT, 9, o.seed, t, u);
    var wl = T(mix('#2e6e52', p.bg, 0.22)), wh = u * 4.4; c.beginPath(); for (i = 0; i <= 24; i++) { var wx = i / 24 * W; if (i) c.lineTo(wx, wT(wx)); else c.moveTo(wx, wT(wx)); } c.lineTo(W, wy + wh + u * 2); c.lineTo(0, wy + wh + u * 2); c.closePath(); c.fillStyle = wl; c.fill();
    c.fillStyle = shade(wl, -0.16); for (i = 1; i < 12; i++) c.fillRect(i / 12 * W, wT(i / 12 * W), u * 0.3, wh); c.beginPath(); for (i = 0; i <= 24; i++) { var yx = i / 24 * W; if (i) c.lineTo(yx, wT(yx) + u * 0.3); else c.moveTo(yx, wT(yx) + u * 0.3); } c.lineWidth = u * 0.7; c.strokeStyle = T(p.gold); c.stroke();
    for (i = 0; i < 2; i++) { var px = i ? W - u * 2.6 : u * 2.6; L(c, px, wT(px) + wh, px, wT(px) - u * 17, u * 0.8, T(p.gold)); c.fillStyle = alpha(T(p.gold), 0.3); c.fillRect(i ? px - u * 2.4 : px, wT(px) - u * 16, u * 2.4, u * 10); }
    /* warning track, outfield, the diamond */
    var dirt = T(mix('#cf9a62', p.bg2, 0.3)), gr = T(mix('#4fb35a', p.bg2, 0.22)), gy = wy + wh, hy = H * 0.99, first = [W * 0.86, H * 0.805], third = [W * 0.14, H * 0.805], second = [cx, H * 0.712];
    c.fillStyle = dirt; c.fillRect(0, gy, W, H - gy); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, gy, W, u * 0.7);
    for (j = 0; j < 8; j++) { var f = 1 - j * 0.115; el(c, cx, hy, W * 1.05 * f, (hy - gy - u * 2.4) * f, j % 2 ? shade(gr, 0.09) : gr); }
    c.beginPath(); c.moveTo(cx, H * 1.02); c.lineTo(third[0] - u * 7, third[1] + u * 1); c.quadraticCurveTo(cx, H * 0.565, first[0] + u * 7, first[1] + u * 1); c.closePath(); c.fillStyle = dirt; c.fill();
    Pg(c, [[cx, H * 0.93], [W * 0.765, H * 0.807], [cx, H * 0.737], [W * 0.235, H * 0.807]], gr, true); Pg(c, [[cx, H * 0.905], [W * 0.63, H * 0.845], [cx, H * 0.737], [W * 0.37, H * 0.845]], shade(gr, 0.09), true);
    var ln = alpha(p.snow, 0.9); L(c, cx, H * 0.972, cx + (first[0] - cx) * 1.5, H * 0.972 + (first[1] - H * 0.972) * 1.5, u * 0.5, ln); L(c, cx, H * 0.972, cx + (third[0] - cx) * 1.5, H * 0.972 + (third[1] - H * 0.972) * 1.5, u * 0.5, ln);
    el(c, cx, H * 0.818, u * 6.4, u * 2.3, dirt); el(c, cx, H * 0.818 - u * 0.3, u * 5, u * 1.6, shade(dirt, 0.1)); Rn(c, cx - u * 1.5, H * 0.818 - u * 0.6, u * 3, u * 0.7, u * 0.2, p.snow);
    el(c, cx, H * 0.965, u * 11, u * 4.2, dirt); c.strokeStyle = ln; c.lineWidth = u * 0.4; for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(cx + i * u * 2.6, H * 0.965 - u * 2); c.lineTo(cx + i * u * 6.4, H * 0.965 - u * 2); c.lineTo(cx + i * u * 7.4, H * 0.965 + u * 2.2); c.lineTo(cx + i * u * 3, H * 0.965 + u * 2.2); c.closePath(); c.stroke(); }
    Pg(c, [[cx - u * 1.5, H * 0.965 - u * 0.9], [cx + u * 1.5, H * 0.965 - u * 0.9], [cx + u * 1.5, H * 0.965 + u * 0.1], [cx, H * 0.965 + u * 1], [cx - u * 1.5, H * 0.965 + u * 0.1]], p.snow, true);
    [first, second, third].forEach(function (b) { el(c, b[0], b[1] + u * 0.3, u * 3.6, u * 1.3, dirt); Pg(c, [[b[0] - u * 1.9, b[1]], [b[0], b[1] - u * 0.8], [b[0] + u * 1.9, b[1]], [b[0], b[1] + u * 0.8]], p.snow, true); Pg(c, [[b[0] - u * 1.9, b[1]], [b[0], b[1] + u * 0.8], [b[0] + u * 1.9, b[1]], [b[0] + u * 1.9, b[1] + u * 0.45], [b[0], b[1] + u * 1.25], [b[0] - u * 1.9, b[1] + u * 0.45]], shade(p.snow, -0.2), true); });
    vgrad2(c, 0, gy, W, H - gy, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.12)');
    if (night) { beam(c, u * 9, H * 0.13, W * 0.34, H * 0.84, W * 0.22, 0.15); beam(c, W - u * 5, H * 0.18, W * 0.68, H * 0.84, W * 0.22, 0.13); el(c, cx, H * 0.84, W * 0.42, (H - gy) * 0.34, 'rgba(255,246,208,0.08)'); }
  }, { variants: ['day', 'night'], stage: 'band-low' });

  /* ---------- a soccer pitch: the goal and its net, the painted box, corner flags, a little stand under the hills ---------- */
  Art.add('backdrop', 'pitch', function (c, W, H, t, p, o, u) {
    var night = o.variant === 'night', i, j, k = Math.exp(-5 * o.beat), R0 = rnd(o.seed + 'pi'), fl = H * 0.652, kk = sky(c, W, H, t, p, o, u, night, fl, W * 0.74, H * 0.085), dim = night ? 0.18 + kk * 0.3 : 0, cx = W / 2, fh = H - fl;
    var T = function (col) { return dim ? dk(col, dim) : col; }, mast = T(mix(p.paper, p.ink, 0.45)), sb = night ? dk(p.bg2, kk * 0.9) : mix(p.bg2, '#ffffff', 0.35), tree = T(mix('#3f9a5a', p.accent2, 0.45));
    K.hill(c, W, H, fl - u * 11, u * 3.5, T(mix(p.accent2, sb, 0.68)), o.seed + 'a', 0.7); K.hill(c, W, H, fl - u * 5, u * 2, T(mix(p.accent2, sb, 0.42)), o.seed + 'b', 1.1);
    tower(c, W * 0.47, fl, fl - u * 27, u * 0.66, mast, night, k, -1); tower(c, u * 5, fl, Math.max(H * 0.12, fl - u * 52), u * 1.1, mast, night, k, 1); tower(c, W - u * 6, fl, Math.max(H * 0.12, fl - u * 52), u * 1.1, mast, night, k, -1);
    /* trees along the far side */
    for (i = 0; i < 7; i++) { var tx = W * (0.5 + i * 0.075) + R0() * u * 2, ts = u * (4.4 + R0() * 3.2), tb = fl - u * 1; Rn(c, tx - ts * 0.12, tb - ts * 1.1, ts * 0.24, ts * 1.2, 0, T(mix('#7a5230', p.ink, 0.3))); dot(c, tx, tb - ts * 1.6, ts * 0.85, i % 2 ? tree : shade(tree, -0.12)); dot(c, tx - ts * 0.55, tb - ts * 1.2, ts * 0.6, shade(tree, -0.06)); dot(c, tx + ts * 0.55, tb - ts * 1.25, ts * 0.62, i % 2 ? shade(tree, -0.12) : tree); dot(c, tx - ts * 0.2, tb - ts * 1.9, ts * 0.4, shade(tree, 0.14)); }
    /* the little stand */
    var sx = u * 4, sw = u * 37, sy = fl - u * 0.6, sh = u * 11.5, back = T(mix(p.paper, p.bg2, 0.25));
    Rn(c, sx, sy - sh, sw, sh, 0, back); for (i = 0; i < 4; i++) { c.fillStyle = shade(back, -0.1 - i * 0.04); c.fillRect(sx, sy - sh * 0.74 + i * sh * 0.185, sw, sh * 0.185); }
    crowd(c, sx + u * 1, sx + sw - u * 0.6, function () { return sy - sh * 0.78; }, function () { return sy - sh * 0.08; }, 4, u * 1.9, o.seed + 'p', [T(p.accent), T(p.gold), T(p.accent2), T(p.paper), T(shade(p.accent, 0.4))]);
    if (night) { c.fillStyle = 'rgba(255,240,190,0.85)'; c.fillRect(sx, sy - sh * 0.82, sw, u * 0.5); glow(c, sx + sw / 2, sy - sh * 0.5, sw * 0.6, '#ffe2a0', 0.2); flashes(c, sx, sx + sw, function () { return sy - sh * 0.75; }, function () { return sy - sh * 0.1; }, 4, o.seed, t, u); }
    for (i = 0; i <= 4; i++) L(c, sx + sw * i / 4, sy - sh * 1.05, sx + sw * i / 4, sy, u * 0.5, mast);
    Pg(c, [[sx - u * 2, sy - sh * 1.02], [sx + sw + u * 2, sy - sh * 1.02], [sx + sw + u * 0.4, sy - sh * 1.42], [sx - u * 0.4, sy - sh * 1.42]], T(p.accent), true); c.fillStyle = T(shade(p.accent, -0.25)); c.fillRect(sx - u * 2, sy - sh * 1.04, sw + u * 4, u * 1); c.fillStyle = T(p.paper); for (i = 0; i < 6; i++) c.fillRect(sx - u * 2 + (i * 2 + 1) * (sw + u * 4) / 12, sy - sh * 1.04, (sw + u * 4) / 12, u * 1);
    pennant(c, sx + u * 3, sy - sh * 1.42, u * 2.6, T(p.gold), t, 0, mast); pennant(c, sx + sw - u * 3, sy - sh * 1.42, u * 2.6, T(p.accent2), t, 2, mast);
    /* a white rail round the pitch */
    var rail = T(p.paper); c.fillStyle = rail; c.fillRect(0, fl - u * 2.6, W, u * 0.6); for (i = 0; i * u * 6 < W + u * 3; i++) c.fillRect(i * u * 6 - u * 0.3, fl - u * 2.6, u * 0.6, u * 3);
    /* the turf and its paint */
    var gr = T(mix('#4fb35a', p.bg2, 0.22)); turfH(c, W, fl, H, gr, 10); vgrad2(c, 0, fl, W, fh, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.14)');
    var py = function (f) { return fl + fh * f; }, sxf = function (f) { return 1 + f * 1.1; }, ln = alpha(p.snow, 0.9), box = function (a, f1) { c.beginPath(); c.moveTo(cx - a * sxf(0.035), py(0.035)); c.lineTo(cx - a * sxf(f1), py(f1)); c.lineTo(cx + a * sxf(f1), py(f1)); c.lineTo(cx + a * sxf(0.035), py(0.035)); c.stroke(); };
    c.strokeStyle = ln; c.lineWidth = u * 0.55; c.lineJoin = 'round'; c.beginPath(); c.moveTo(0, py(0.035)); c.lineTo(W, py(0.035)); c.stroke(); box(W * 0.2, 0.14); box(W * 0.33, 0.37);
    ring(c, cx, py(0.27), W * 0.17, fh * 0.17, u * 0.55, ln, 0.63, PI - 0.63); el(c, cx, py(0.27), u * 0.9, u * 0.5, ln); ring(c, cx, H + fh * 0.14, W * 0.36, fh * 0.36, u * 0.6, ln, PI, TAU);
    for (i = 0; i < 2; i++) ring(c, i ? W : 0, py(0.035), u * 3.4, u * 1.6, u * 0.5, ln, i ? PI / 2 : 0, i ? PI : PI / 2);
    /* the goal */
    var gw = W * 0.135, gy = py(0.035), gh = Math.min(u * 10, H * 0.085), gb = gy - u * 2.2, post = night ? '#f4f4ee' : p.snow;
    c.fillStyle = alpha(p.snow, 0.16); c.beginPath(); c.moveTo(cx - gw, gy); c.lineTo(cx - gw, gy - gh); c.lineTo(cx + gw, gy - gh); c.lineTo(cx + gw, gy); c.lineTo(cx + gw * 0.9, gb); c.lineTo(cx - gw * 0.9, gb); c.closePath(); c.fill();
    c.strokeStyle = alpha(p.snow, 0.5); c.lineWidth = Math.max(0.6, u * 0.16); c.beginPath(); for (i = 1; i < 12; i++) { var nx = cx - gw + gw * 2 * i / 12; c.moveTo(nx, gy - gh); c.lineTo(cx + (nx - cx) * 0.9, gb); } for (i = 1; i < 6; i++) { var ny = gy - gh + (gb - gy + gh) * i / 6, nw = gw * (1 - 0.1 * i / 6); c.moveTo(cx - nw, ny); c.lineTo(cx + nw, ny); } c.moveTo(cx - gw, gy - gh); c.lineTo(cx - gw * 0.9, gb); c.moveTo(cx + gw, gy - gh); c.lineTo(cx + gw * 0.9, gb); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = u * 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - gw, gy); c.lineTo(cx - gw, gy - gh); c.lineTo(cx + gw, gy - gh); c.lineTo(cx + gw, gy); c.stroke(); c.strokeStyle = post; c.lineWidth = u * 0.85; c.stroke();
    /* corner flags and a ball */
    for (i = 0; i < 2; i++) { var fx = i ? W - u * 3 : u * 3, fy = py(0.05), wv = Math.sin(t * 3 + i) * u * 0.5, d = i ? -1 : 1; L(c, fx, fy, fx, fy - u * 9.5, u * 0.5, T(p.paper)); c.beginPath(); c.moveTo(fx, fy - u * 9.5); c.quadraticCurveTo(fx + d * u * 2.4, fy - u * 9 + wv, fx + d * u * 4.6, fy - u * 7.6 + wv); c.quadraticCurveTo(fx + d * u * 2.2, fy - u * 6.8 + wv * 0.5, fx, fy - u * 6); c.closePath(); c.fillStyle = T(i ? p.gold : p.accent); c.fill(); }
    var bx = W * 0.73, br = u * 3.5, by = py(0.82) - br; el(c, bx, by + br, br, br * 0.24, 'rgba(0,0,0,0.22)'); dot(c, bx, by, br, shade(p.snow, -0.14)); dot(c, bx - br * 0.08, by - br * 0.08, br * 0.9, '#ffffff'); c.save(); c.beginPath(); c.arc(bx, by, br, 0, TAU); c.clip(); c.fillStyle = mix(p.ink, '#20222c', 0.5);
    for (j = 0; j < 6; j++) { var a0 = -PI / 2 + (j - 1) * TAU / 5 + 0.3, pr = j ? br * 0.86 : 0, pcx = bx + Math.cos(a0) * pr, pcy = by + Math.sin(a0) * pr; c.beginPath(); for (i = 0; i < 5; i++) { var a = a0 + PI + i * TAU / 5 + (j ? 0 : PI - 0.3); if (i) c.lineTo(pcx + Math.cos(a) * br * 0.36, pcy + Math.sin(a) * br * 0.36); else c.moveTo(pcx + Math.cos(a) * br * 0.36, pcy + Math.sin(a) * br * 0.36); } c.closePath(); c.fill(); }
    c.restore(); el(c, bx - br * 0.4, by - br * 0.5, br * 0.22, br * 0.13, 'rgba(255,255,255,0.7)');
    if (night) { beam(c, u * 5, H * 0.14, W * 0.3, H * 0.86, W * 0.2, 0.15); beam(c, W - u * 6, H * 0.14, W * 0.7, H * 0.86, W * 0.2, 0.15); el(c, cx, H * 0.84, W * 0.44, fh * 0.34, 'rgba(255,246,208,0.08)'); }
  }, { variants: ['day', 'night'], stage: 'band-low' });
});
