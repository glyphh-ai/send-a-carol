/* Send a Carol art pack: backdrops of home (lounge, homekitchen, porch, cabin, bedroom, backyard, treehouse,
   windowseat, diningroom, garage). Blocks only come in through CarolArt.add; nothing here replaces launch art.
   The variant says what is there (sun or moon, lamps off or on); the palette says the colours: p.bg is the wall or
   the top of the sky, p.bg2 the floor or the bottom of the sky. The middle of every room is kept calm: the
   character of the place is at the sides, in the top corners and on the floor. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, dot = K.dot, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, frac = K.frac, rnd = K.rnd,
    glow = K.glow, cloud = K.cloud, leaf = K.leaf, flame = K.flame, steam = K.steam, twinkle = K.twinkle, heartPath = K.heartPath, starPath = K.starPath;
  var WARM = '#ffd98a';

  /* sizes are in `u`; a square canvas is short, so its u is made smaller and the rooms keep their proportions */
  function add(name, fn, meta) { Art.add('backdrop', name, function (c, W, H, t, p, o, u) { fn(c, W, H, t, p, o, Math.min(u, H / 160)); }, meta); }

  /* ---------- small tools ---------- */
  function box(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function grad(c, x, y, w, h, cols) { var g = c.createLinearGradient(0, y, 0, y + h), i; for (i = 0; i < cols.length; i++) g.addColorStop(i / (cols.length - 1), cols[i]); c.fillStyle = g; c.fillRect(x, y, w, h); }
  function ell(c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = col; c.fill(); }
  function part(v) { return v === 'night' ? 2 : (v === 'dusk' || v === 'evening') ? 1 : 0; } /* 0 = daylight, 1 = the sun going, 2 = night */
  function land(col, v) { var pt = part(v); return pt === 2 ? mix(col, '#131c44', 0.68) : pt === 1 ? mix(col, '#5a3a6e', 0.42) : v === 'morning' ? mix(col, '#ffd9a0', 0.2) : col; }
  function woodc(p) { return mix('#a06a3c', p.bg2, 0.22); }
  function floorc(p) { return mix(p.bg2, '#b98552', 0.45); }
  function dim(c, W, H, p, a) { box(c, 0, 0, W, H, alpha(mix('#1b1640', p.bg, 0.3), a)); }
  function skyOut(v, p) { /* the open sky: the palette's two colours, with what the hour adds */
    var pt = part(v);
    if (pt === 2) return [shade(p.bg, -0.4), p.bg, p.bg2];
    if (pt === 1) return [shade(p.bg, -0.08), mix(p.bg, p.bg2, 0.55), mix(p.bg2, '#ff9d6e', 0.5), mix(p.bg2, '#ffd08a', 0.6)];
    if (v === 'morning') return [p.bg, mix(p.bg2, '#ffd9b0', 0.4), mix(p.bg2, '#fff0c4', 0.5)];
    return [p.bg, mix(p.bg, p.bg2, 0.6), p.bg2];
  }
  function skyIn(v, p) { /* the sky seen through a window: its own colours, a little of the palette in them */
    var pt = part(v), a = pt === 2 ? ['#0c1434', '#1d2c62', '#34467f'] : pt === 1 ? ['#3d3a80', '#b4609a', '#ff9d6e', '#ffd08a'] : v === 'morning' ? ['#8fc6ee', '#ffd9b0', '#fff0c4'] : ['#6fbdf0', '#bfe6fb', '#eaf7ff'], i;
    for (i = 0; i < a.length; i++) a[i] = mix(a[i], p.bg, 0.12);
    return a;
  }
  function stars(c, x, y, w, h, n, seed, t, u) {
    var R0 = rnd(seed + 'st'), i; c.fillStyle = '#fff';
    for (i = 0; i < n; i++) { var sx = x + R0() * w, sy = y + R0() * h, s = u * (0.14 + R0() * 0.3), tw = 0.45 + 0.55 * Math.sin(t * (0.8 + R0() * 2.2) + R0() * 6.3); c.globalAlpha = 0.35 + 0.65 * tw; if (i % 8 === 0) twinkle(c, sx, sy, s * 3.4, '#fff'); else { c.beginPath(); c.arc(sx, sy, s, 0, TAU); c.fill(); } }
    c.globalAlpha = 1;
  }
  function clouds(c, x, y, w, h, n, seed, t, u, col, size) {
    var R0 = rnd(seed + 'cl'), i;
    for (i = 0; i < n; i++) { var cw = (size || u * 16) * (0.7 + R0() * 0.7), cx = x + frac(R0() + t * 0.006 * (1 + i * 0.3)) * (w + cw * 2) - cw, cy = y + h * (0.1 + R0() * 0.8); cloud(c, cx, cy, cw, col); }
  }
  /* sun, moon, stars and clouds for the hour; (sx, sy) is where the light sits, s its size, hz the horizon */
  function lights(c, x, y, w, h, v, t, o, u, sx, sy, s, hz) {
    var pt = part(v), i;
    if (pt === 2) {
      stars(c, x, y, w, h * 0.85, Math.round(14 + w * h / (u * u * 110)), o.seed, t, u);
      glow(c, sx, sy, s * 3.4, '#fff6d8', 0.24); dot(c, sx, sy, s, '#fff6d8'); dot(c, sx - s * 0.3, sy - s * 0.2, s * 0.18, '#e9dfbf'); dot(c, sx + s * 0.25, sy + s * 0.3, s * 0.12, '#e9dfbf'); dot(c, sx + s * 0.32, sy - s * 0.4, s * 0.09, '#e9dfbf');
    } else if (pt === 1) {
      stars(c, x, y, w, h * 0.3, Math.round(4 + w * h / (u * u * 500)), o.seed, t, u);
      glow(c, sx, hz - s * 0.4, s * 6, '#ffd08a', 0.5); dot(c, sx, hz - s * 0.4, s * 1.15, '#ffe9b0');
      for (i = 0; i < 3; i++) { var cw = w * (0.3 + 0.12 * i), cx = x + frac(0.2 + i * 0.37 + t * 0.004 * (1 + i * 0.4)) * (w + cw * 2) - cw, cy = y + (hz - y) * (0.42 + i * 0.17); ell(c, cx, cy, cw * 0.5, s * (0.32 - i * 0.05), alpha(i % 2 ? '#ffb7a0' : '#ffe0b8', 0.5)); ell(c, cx + cw * 0.18, cy - s * 0.3, cw * 0.28, s * 0.22, alpha('#ffd6c0', 0.4)); }
    } else if (v === 'morning') {
      glow(c, sx, hz, s * 8, '#fff3c4', 0.7); dot(c, sx, hz - s * 0.2, s * 1.2, '#fff6d0');
      clouds(c, x, y + h * 0.05, w, (hz - y) * 0.5, 3, o.seed + 'm', t, u, 'rgba(255,255,255,0.8)', s * 4.5);
    } else {
      glow(c, sx, sy, s * 4.4, '#fff6c8', 0.55);
      c.save(); c.translate(sx, sy); c.rotate(t * 0.12); c.fillStyle = 'rgba(255,238,160,0.5)'; for (i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(-s * 0.18, -s * 1.25); c.lineTo(s * 0.18, -s * 1.25); c.lineTo(0, -s * (1.9 + (i % 2) * 0.45)); c.closePath(); c.fill(); } c.restore();
      dot(c, sx, sy, s, '#ffe27a'); dot(c, sx - s * 0.25, sy - s * 0.25, s * 0.6, 'rgba(255,255,255,0.25)');
      clouds(c, x, y + h * 0.04, w, (hz - y) * 0.62, 4, o.seed + 'd', t, u, 'rgba(255,255,255,0.92)', s * 4.2);
    }
  }
  function tree(c, x, y, s, col, tr) { /* a round tree: base (x, y), height s */
    box(c, x - s * 0.05, y - s * 0.45, s * 0.1, s * 0.45, tr);
    dot(c, x, y - s * 0.62, s * 0.3, shade(col, -0.1)); dot(c, x - s * 0.2, y - s * 0.5, s * 0.22, col); dot(c, x + s * 0.2, y - s * 0.52, s * 0.23, col); dot(c, x - s * 0.06, y - s * 0.72, s * 0.2, shade(col, 0.12));
  }
  function cottage(c, x, base, w, wall, roof, win, door) {
    var h = w * 0.6; box(c, x + w * 0.68, base - h - w * 0.38, w * 0.12, w * 0.3, roof); box(c, x, base - h, w, h, wall);
    Pg(c, [[x - w * 0.1, base - h], [x + w * 0.5, base - h - w * 0.42], [x + w * 1.1, base - h]], roof, true);
    box(c, x + w * 0.13, base - h * 0.78, w * 0.22, h * 0.36, win); box(c, x + w * 0.65, base - h * 0.78, w * 0.22, h * 0.36, win); box(c, x + w * 0.42, base - h * 0.56, w * 0.16, h * 0.56, door);
  }
  /* what is outside a window: sky for the hour and a little country, town or forest */
  function view(c, x, y, w, h, v, p, t, o, u, kind) {
    var pt = part(v), i, R0 = rnd(o.seed + 'vw' + kind), lit = pt ? WARM : '#dff1ff', g1 = land(mix('#93d48c', p.accent2, 0.3), v), g2 = land(mix('#5fb070', p.accent2, 0.35), v), s = Math.min(w, h);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    grad(c, x, y, w, h, skyIn(v, p));
    lights(c, x, y, w, h, v, t, o, u, x + w * (pt === 1 || v === 'morning' ? 0.36 : 0.72), y + h * 0.24, s * 0.085, y + h * 0.78);
    if (kind === 'pines') {
      var m = land('#8fa0c4', v);
      for (i = 0; i < 3; i++) { var mx = x + w * (0.1 + i * 0.4), mh = h * (0.42 + (i % 2) * 0.12), mw = w * 0.36; Pg(c, [[mx - mw, y + h], [mx, y + h - mh], [mx + mw, y + h]], i % 2 ? shade(m, -0.08) : m, true); Pg(c, [[mx - mw * 0.2, y + h - mh * 0.8], [mx, y + h - mh], [mx + mw * 0.2, y + h - mh * 0.8], [mx + mw * 0.07, y + h - mh * 0.72], [mx - mw * 0.05, y + h - mh * 0.78]], land('#f4f8ff', v), true); }
      ell(c, x + w * 0.5, y + h * 1.04, w * 0.8, h * 0.2, g2);
      for (i = 0; i < 6; i++) K.pine(c, x + w * (0.06 + i * 0.18 + R0() * 0.05), y + h * (0.94 + R0() * 0.06), h * (0.26 + R0() * 0.2), i % 2 ? shade(g2, -0.25) : shade(g2, -0.36), null, 3);
    } else if (kind === 'town') {
      var bx = x - u; i = 0;
      while (bx < x + w) { var bw = w * (0.12 + R0() * 0.1), bh = h * (0.2 + R0() * 0.32), bc = land(i % 2 ? '#8a94b8' : '#a0a9c8', v), j; box(c, bx, y + h - bh, bw + 1, bh, bc); if (i % 3 === 0) Pg(c, [[bx, y + h - bh], [bx + bw / 2, y + h - bh - bw * 0.4], [bx + bw, y + h - bh]], shade(bc, -0.15), true); for (j = 0; j < 9; j++) { if (R0() < 0.4) continue; var fy = y + h - bh + bw * 0.15 + Math.floor(j / 3) * bw * 0.32; if (fy < y + h - bw * 0.2) box(c, bx + bw * (0.14 + (j % 3) * 0.28), fy, bw * 0.16, bw * 0.2, pt ? alpha(WARM, 0.75 + 0.25 * Math.sin(t * 2 + i + j)) : shade(bc, 0.22)); } bx += bw + u * 0.3; i++; }
    } else {
      ell(c, x + w * 0.28, y + h * 1.02, w * 0.7, h * 0.3, g1); ell(c, x + w * 0.92, y + h * 1.04, w * 0.62, h * 0.27, g2);
      cottage(c, x + w * 0.1, y + h * 0.8, w * 0.24, land('#f3e6d2', v), land(mix('#c8553f', p.accent, 0.4), v), lit, land('#7a4a34', v));
      tree(c, x + w * 0.82, y + h * 0.86, h * 0.34, shade(g2, -0.12), land('#7a5230', v)); tree(c, x + w * 0.62, y + h * 0.84, h * 0.2, shade(g2, -0.04), land('#7a5230', v));
    }
    c.restore();
  }
  /* a window in a wall: frame, the view, panes, a sill. again = true paints only the glass (after a room is dimmed) */
  function windowAt(c, x, y, w, h, v, p, t, o, u, kind, cols, rows, again, fp) { /* fp: the room's (dimmed) palette, for the frame */
    var fr = (fp || p).paper, th = u * 1.5, i;
    if (!again) { Rn(c, x - th * 1.15, y - th * 1.15, w + th * 2.3, h + th * 2.3, u * 1, shade(fr, -0.16)); Rn(c, x - th * 0.8, y - th * 0.8, w + th * 1.6, h + th * 1.6, u * 0.7, fr); }
    view(c, x, y, w, h, v, p, t, o, u, kind);
    c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.moveTo(x + w * 0.08, y + h); c.lineTo(x + w * 0.5, y); c.lineTo(x + w * 0.68, y); c.lineTo(x + w * 0.26, y + h); c.closePath(); c.fill();
    if (again) fr = mix(fr, '#3a3058', 0.25);
    for (i = 1; i < cols; i++) box(c, x + w * i / cols - th * 0.3, y, th * 0.6, h, fr);
    for (i = 1; i < rows; i++) box(c, x, y + h * i / rows - th * 0.3, w, th * 0.6, fr);
    if (!again) { Rn(c, x - th * 2, y + h + th * 0.6, w + th * 4, th * 1.3, th * 0.4, shade(fr, 0.1)); box(c, x - th * 1.6, y + h + th * 1.9, w + th * 3.2, th * 0.45, 'rgba(0,0,0,0.12)'); }
  }
  /* a tied-back curtain: (x, y) its top outer corner, d = 1 hangs to the right of x, -1 to the left */
  function curtain(c, x, y, w, h, col, d, u, tie) {
    var i;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + d * w, y); c.quadraticCurveTo(x + d * w * 0.95, y + h * 0.42, x + d * w * 0.38, y + h * 0.6); c.quadraticCurveTo(x + d * w * 0.6, y + h * 0.8, x + d * w * 0.66, y + h); c.lineTo(x, y + h); c.closePath(); c.fillStyle = col; c.fill();
    c.lineWidth = u * 0.45; c.lineCap = 'round'; c.strokeStyle = shade(col, -0.16);
    for (i = 1; i <= 3; i++) { c.beginPath(); c.moveTo(x + d * w * i * 0.23, y + u); c.quadraticCurveTo(x + d * w * i * 0.2, y + h * 0.4, x + d * w * 0.1 * i, y + h * 0.59); c.stroke(); c.beginPath(); c.moveTo(x + d * w * 0.1 * i, y + h * 0.64); c.lineTo(x + d * w * 0.17 * i, y + h - u); c.stroke(); }
    Rn(c, d > 0 ? x : x - w * 0.42, y + h * 0.585, w * 0.42, u * 1.5, u * 0.7, tie);
  }
  function planks(c, W, y0, H, col, u, rows) { /* a wooden floor going away from us */
    var i, j, hh = H - y0;
    grad(c, 0, y0, W, hh, [shade(col, 0.07), shade(col, -0.2)]);
    c.fillStyle = 'rgba(40,20,10,0.16)';
    for (i = 0; i < rows; i++) { var ya = y0 + hh * Math.pow(i / rows, 1.5), yb = y0 + hh * Math.pow((i + 1) / rows, 1.5); c.fillRect(0, ya, W, Math.max(1, u * 0.28)); for (j = 0; j < 4; j++) c.fillRect(frac(i * 0.37 + j * 0.27 + 0.11) * W, ya, Math.max(1, u * 0.28), yb - ya); }
    box(c, 0, y0, W, u * 0.9, 'rgba(0,0,0,0.13)');
  }
  function plant(c, x, y, s, p, t, kind, pot) { /* a pot plant: base centre (x, y), about s tall */
    var gr = mix(p.accent2, '#3f9a5a', 0.4), i, n, sw;
    pot = pot || mix('#c9724a', p.accent, 0.25);
    if (kind === 1) { n = 6; for (i = 0; i < n; i++) { sw = Math.sin(t * 0.9 + i) * 0.03; leaf(c, x + (i - 2.5) * s * 0.04, y - s * 0.28, s * (0.5 + (i % 3) * 0.12), -PI / 2 + (i - 2.5) * 0.16 + sw, i % 2 ? gr : shade(gr, -0.16)); } }
    else if (kind === 2) { n = 7; c.lineCap = 'round'; for (i = 0; i < n; i++) { var dx = (i - 3) * s * 0.11, len = s * (0.45 + frac(i * 0.37) * 0.5); sw = Math.sin(t * 1.1 + i) * s * 0.02; c.beginPath(); c.moveTo(x + dx * 0.5, y - s * 0.3); c.quadraticCurveTo(x + dx * 1.8, y - s * 0.42, x + dx * 1.9 + sw, y - s * 0.3 + len); c.lineWidth = s * 0.025; c.strokeStyle = shade(gr, -0.2); c.stroke(); for (var k = 1; k <= 3; k++) dot(c, x + dx * (1.5 + k * 0.13) + sw * k / 3, y - s * 0.3 + len * k / 3, s * 0.05, k % 2 ? gr : shade(gr, 0.2)); } ell(c, x, y - s * 0.32, s * 0.24, s * 0.1, gr); }
    else { n = 7; for (i = 0; i < n; i++) { sw = Math.sin(t * 0.8 + i * 1.3) * 0.04; leaf(c, x, y - s * 0.3, s * (0.46 + (i % 2) * 0.16), -PI / 2 + (i - 3) * 0.36 + sw, i % 2 ? gr : shade(gr, i % 3 ? -0.14 : 0.14)); } }
    Pg(c, [[x - s * 0.17, y - s * 0.32], [x + s * 0.17, y - s * 0.32], [x + s * 0.12, y], [x - s * 0.12, y]], pot, true); Rn(c, x - s * 0.19, y - s * 0.35, s * 0.38, s * 0.07, s * 0.03, shade(pot, 0.14));
  }
  function cat(c, x, y, s, col, t, ph) { /* a cat curled up asleep: base centre (x, y), s wide */
    var b = 1 + Math.sin(t * 1.6 + (ph || 0)) * 0.035;
    ell(c, x, y - s * 0.2 * b, s * 0.5, s * 0.22 * b, col); ell(c, x + s * 0.05, y - s * 0.23 * b, s * 0.34, s * 0.14 * b, shade(col, 0.1));
    c.beginPath(); c.moveTo(x + s * 0.42, y - s * 0.1); c.quadraticCurveTo(x + s * 0.1, y + s * 0.06, x - s * 0.3, y - s * 0.04); c.lineWidth = s * 0.09; c.lineCap = 'round'; c.strokeStyle = shade(col, -0.14); c.stroke();
    dot(c, x - s * 0.34, y - s * 0.2, s * 0.17, col);
    Pg(c, [[x - s * 0.48, y - s * 0.28], [x - s * 0.44, y - s * 0.46], [x - s * 0.33, y - s * 0.34]], col, true); Pg(c, [[x - s * 0.3, y - s * 0.35], [x - s * 0.22, y - s * 0.46], [x - s * 0.19, y - s * 0.29]], col, true);
    c.lineWidth = s * 0.022; c.strokeStyle = shade(col, -0.5); c.beginPath(); c.arc(x - s * 0.4, y - s * 0.2, s * 0.04, 0.1 * PI, 0.9 * PI); c.stroke(); c.beginPath(); c.arc(x - s * 0.28, y - s * 0.2, s * 0.04, 0.1 * PI, 0.9 * PI); c.stroke();
    dot(c, x - s * 0.34, y - s * 0.15, s * 0.018, '#e8707e');
  }
  function pillow(c, x, y, s, rot, col, col2, kind) { /* a scatter cushion, centre (x, y) */
    c.save(); c.translate(x, y); c.rotate(rot); Rn(c, -s / 2, -s / 2, s, s, s * 0.26, col);
    if (kind === 1) { c.fillStyle = col2; c.fillRect(-s * 0.5, -s * 0.16, s, s * 0.1); c.fillRect(-s * 0.5, s * 0.08, s, s * 0.1); }
    else if (kind === 2) { dot(c, 0, 0, s * 0.2, col2); dot(c, 0, 0, s * 0.09, col); }
    else if (kind === 3) { heartPath(c, 0, s * 0.02, s * 0.42); c.fillStyle = col2; c.fill(); }
    else { for (var i = 0; i < 4; i++) dot(c, (i % 2 ? 1 : -1) * s * 0.18, (i < 2 ? 1 : -1) * s * 0.18, s * 0.07, col2); }
    c.restore();
  }
  function books(c, x, base, w, hmax, u, p, R0) { /* a run of books standing on a shelf */
    var cols = [p.accent, p.gold, p.accent2, p.paper, shade(p.accent, -0.25), shade(p.accent2, 0.3), mix(p.gold, p.accent, 0.5)], bx = x, i = 0;
    while (bx < x + w - u * 1.2) { var bw = u * (1.2 + R0() * 1.3), bh = hmax * (0.62 + R0() * 0.38), col = cols[Math.floor(R0() * 7)]; if (bx + bw > x + w) break; box(c, bx, base - bh, bw, bh, col); box(c, bx, base - bh * 0.78, bw, bh * 0.07, shade(col, 0.3)); box(c, bx + bw - u * 0.2, base - bh, u * 0.2, bh, 'rgba(0,0,0,0.14)'); bx += bw; i++; }
    return bx;
  }
  function lampShade(c, x, y, w, h, col, on) { /* a lamp shade, its top centre at (x, y) */
    Pg(c, [[x - w * 0.3, y], [x + w * 0.3, y], [x + w * 0.5, y + h], [x - w * 0.5, y + h]], on ? mix(col, '#fff3c4', 0.65) : col, true);
    box(c, x - w * 0.5, y + h * 0.86, w, h * 0.14, on ? mix(col, '#ffd98a', 0.4) : shade(col, -0.14));
  }
  function bulbs(c, x1, y1, x2, y2, sag, n, u, o, t, on) { /* a string of warm festoon bulbs */
    var i, k = Math.exp(-5 * o.beat), my = (y1 + y2) / 2 + sag * 2;
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, my, x2, y2); c.lineWidth = Math.max(0.6, u * 0.35); c.strokeStyle = on ? '#3a2f3a' : '#5a5560'; c.stroke();
    for (i = 0; i < n; i++) {
      var f = (i + 0.5) / n, bx = x1 + (x2 - x1) * f, by = (1 - f) * (1 - f) * y1 + 2 * (1 - f) * f * my + f * f * y2, hot = on && (i + o.n) % 2 === 0;
      if (on) glow(c, bx, by + u * 1.5, u * (hot ? 5 + k * 2 : 4), WARM, hot ? 0.5 + 0.2 * k : 0.34);
      box(c, bx - u * 0.4, by - u * 0.1, u * 0.8, u * 0.8, '#4a4450'); ell(c, bx, by + u * 1.5, u * 0.85, u * 1.05, on ? (hot ? '#fff6d0' : '#ffe39a') : 'rgba(255,255,255,0.75)');
    }
  }
  function fireflies(c, x, y, w, h, n, seed, t, u) {
    var R0 = rnd(seed + 'ff'), i;
    for (i = 0; i < n; i++) { var fx = x + frac(R0() + Math.sin(t * (0.2 + R0() * 0.2) + i) * 0.05) * w, fy = y + R0() * h + Math.sin(t * (0.5 + R0() * 0.6) + i * 2) * u * 2.5, a = 0.5 + 0.5 * Math.sin(t * (1.2 + R0() * 1.6) + i * 1.9), s = u * (0.3 + R0() * 0.3); dot(c, fx, fy, s * 4.5, alpha('#ffe98a', 0.16 * a)); dot(c, fx, fy, s, alpha('#fff6c8', 0.35 + 0.65 * a)); }
  }
  function rug(c, x, y, rx, ry, col, col2, u) { /* an oval rug lying on the floor */
    ell(c, x, y + u * 0.5, rx, ry, 'rgba(0,0,0,0.12)'); ell(c, x, y, rx, ry, col); ell(c, x, y, rx * 0.88, ry * 0.84, col2); ell(c, x, y, rx * 0.8, ry * 0.74, col); ell(c, x, y, rx * 0.5, ry * 0.42, shade(col, 0.12));
    c.beginPath(); c.ellipse(x, y, rx * 0.65, ry * 0.58, 0, 0, TAU); c.setLineDash([u * 1.2, u * 1.6]); c.lineWidth = u * 0.5; c.strokeStyle = col2; c.stroke(); c.setLineDash([]);
  }
  function mug(c, x, y, s, col, t) { /* base centre (x, y) */
    c.beginPath(); c.arc(x + s * 0.42, y - s * 0.4, s * 0.22, -PI / 2, PI / 2); c.lineWidth = s * 0.12; c.strokeStyle = col; c.stroke();
    Rn(c, x - s * 0.4, y - s * 0.8, s * 0.8, s * 0.8, s * 0.14, col); box(c, x - s * 0.4, y - s * 0.62, s * 0.8, s * 0.12, shade(col, 0.3)); steam(c, x, y - s * 0.9, s * 0.9, t, 2);
  }
  function picture(c, x, y, w, h, u, p, kind, t) { /* a small framed picture on a wall */
    Rn(c, x - u * 0.9, y - u * 0.9, w + u * 1.8, h + u * 1.8, u * 0.4, shade(woodc(p), -0.1)); box(c, x, y, w, h, p.paper);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    if (kind === 0) { box(c, x, y, w, h, mix(p.paper, p.bg, 0.3)); dot(c, x + w * 0.68, y + h * 0.34, w * 0.14, p.gold); ell(c, x + w * 0.3, y + h, w * 0.5, h * 0.4, p.accent2); ell(c, x + w * 0.85, y + h * 1.05, w * 0.5, h * 0.36, shade(p.accent2, 0.2)); }
    else if (kind === 1) { heartPath(c, x + w / 2, y + h * 0.52, Math.min(w, h) * 0.56); c.fillStyle = p.accent; c.fill(); }
    else if (kind === 2) { starPath(c, x + w / 2, y + h / 2, Math.min(w, h) * 0.32, Math.min(w, h) * 0.14, 5, 0); c.fillStyle = p.gold; c.fill(); }
    else { box(c, x, y, w, h, mix(p.paper, p.accent, 0.16)); leaf(c, x + w * 0.5, y + h * 0.9, h * 0.6, -PI / 2 - 0.4, p.accent2); leaf(c, x + w * 0.5, y + h * 0.9, h * 0.66, -PI / 2 + 0.3, shade(p.accent2, -0.15)); }
    c.restore();
  }

  /* ---------- lounge: a bright living room (day, evening) ---------- */
  function sofa(c, x, fl, w, u, col, p) {
    var wd = shade(woodc(p), -0.2), i, cw = (w - u * 13) / 3;
    box(c, x + u * 3.5, fl - u * 2.6, u * 1.7, u * 2.6, wd); box(c, x + w - u * 5.2, fl - u * 2.6, u * 1.7, u * 2.6, wd);
    ell(c, x + w / 2, fl, w * 0.5, u * 1.3, 'rgba(0,0,0,0.14)');
    Rn(c, x + u * 3, fl - u * 28, w - u * 6, u * 22, u * 5, shade(col, -0.12));
    for (i = 0; i < 3; i++) { Rn(c, x + u * 6.5 + i * cw, fl - u * 26, cw - u * 0.7, u * 15, u * 3.2, col); Rn(c, x + u * 7.6 + i * cw, fl - u * 25, cw - u * 3, u * 3, u * 1.5, shade(col, 0.12)); }
    Rn(c, x + u * 5.5, fl - u * 13, w - u * 11, u * 7, u * 2.6, shade(col, 0.1)); box(c, x + w / 2 - u * 0.2, fl - u * 12.4, u * 0.4, u * 5.6, shade(col, -0.14));
    Rn(c, x + u * 1.5, fl - u * 7.4, w - u * 3, u * 5.4, u * 1.6, shade(col, -0.2));
    Rn(c, x, fl - u * 19, u * 8, u * 17, u * 3.6, shade(col, 0.06)); Rn(c, x + w - u * 8, fl - u * 19, u * 8, u * 17, u * 3.6, shade(col, 0.06));
    Rn(c, x + u * 1.2, fl - u * 18.2, u * 5.6, u * 2.6, u * 1.3, shade(col, 0.2)); Rn(c, x + w - u * 6.8, fl - u * 18.2, u * 5.6, u * 2.6, u * 1.3, shade(col, 0.2));
  }
  function floorLamp(c, x, fl, h, u, p, on) {
    ell(c, x, fl, u * 4.2, u * 1.1, shade(p.gold, -0.3)); box(c, x - u * 0.4, fl - h + u * 6, u * 0.8, h - u * 6, shade(p.gold, -0.2));
    lampShade(c, x, fl - h, u * 11, u * 8.5, mix(p.paper, p.gold, 0.3), on);
  }
  add('lounge', function (c, W, H, t, p, o, u) {
    var v = o.variant, pt = part(v), fl = H * 0.665, i, wd = woodc(p), R0 = rnd(o.seed + 'lounge'), st = u * 6.25;
    grad(c, 0, 0, W, fl, [shade(p.bg, 0.1), p.bg]);
    c.fillStyle = alpha(p.snow, 0.06); for (i = 0; i * st < W; i += 2) c.fillRect(i * st, 0, st, fl);
    box(c, 0, fl - u * 3.2, W, u * 3.2, p.paper); box(c, 0, fl - u * 3.2, W, u * 0.6, shade(p.paper, -0.14));
    planks(c, W, fl, H, floorc(p), u, 6);
    rug(c, W * 0.52, fl + (H - fl) * 0.56, W * 0.37, (H - fl) * 0.3, mix(p.accent2, p.bg2, 0.25), p.paper, u);
    /* the window, left */
    var wx = u * 8.5, wy = H * 0.095, ww = u * 25, wh = u * 37, cu = shade(p.accent2, 0.3);
    windowAt(c, wx, wy, ww, wh, v, p, t, o, u, 'garden', 2, 3);
    /* pictures between the window and the sofa */
    picture(c, u * 4.5, fl - u * 49, u * 11, u * 13, u, p, 0, t); picture(c, u * 20, fl - u * 47, u * 9, u * 9, u, p, 1, t); picture(c, u * 33, fl - u * 50, u * 8, u * 11, u, p, 3, t);
    /* the bookcase, right */
    var bx = W - u * 27, bw = u * 24, bt = fl - u * 66, sh = u * 13, j;
    Rn(c, bx, bt, bw, fl - bt, u * 0.9, shade(wd, -0.1)); box(c, bx + u * 1.3, bt + u * 1.3, bw - u * 2.6, fl - bt - u * 2.6, shade(wd, -0.36));
    for (j = 0; j < 5; j++) {
      var by = bt + u * 1.3 + (j + 1) * sh - u * 1.2, ix = bx + u * 1.6, iw = bw - u * 3.2;
      if (j < 4) box(c, bx + u * 1.3, by, bw - u * 2.6, u * 1.2, wd); else by = fl - u * 1.3;
      if (j === 1) { var e1 = books(c, ix, by, iw * 0.5, sh * 0.72, u, p, R0); plant(c, e1 + u * 6, by, u * 9.5, p, t, 0); }
      else if (j === 2) { picture(c, ix + u * 1.6, by - u * 8.2, u * 6, u * 7, u, p, 2, t); books(c, ix + u * 10.5, by, iw - u * 10.5, sh * 0.7, u, p, R0); }
      else if (j === 3) { var e3 = books(c, ix, by, iw * 0.62, sh * 0.74, u, p, R0); dot(c, e3 + u * 3.6, by - u * 3.4, u * 3.1, mix(p.bg, '#58b4ff', 0.5)); ell(c, e3 + u * 3, by - u * 4, u * 1.4, u * 1, mix(p.accent2, '#5fb070', 0.5)); ell(c, e3 + u * 4.6, by - u * 2.6, u * 1, u * 1.3, mix(p.accent2, '#5fb070', 0.5)); box(c, e3 + u * 2.4, by - u * 0.6, u * 2.4, u * 0.6, p.gold); }
      else books(c, ix, by, iw, sh * (j ? 0.78 : 0.66), u, p, R0);
    }
    plant(c, bx + bw * 0.3, bt, u * 13, p, t, 2, p.paper); box(c, bx + bw * 0.62, bt - u * 5, u * 6.5, u * 5, mix(p.gold, p.paper, 0.4)); dot(c, bx + bw * 0.62 + u * 3.25, bt - u * 2.5, u * 1.8, p.paper); L(c, bx + bw * 0.62 + u * 3.25, bt - u * 2.5, bx + bw * 0.62 + u * 3.25 + Math.cos(t * 0.1) * u * 1.2, bt - u * 2.5 + Math.sin(t * 0.1) * u * 1.2, u * 0.3, p.ink);
    /* lamp, sofa and what lives on it */
    var lx = W - u * 34.5, lh = u * 52;
    floorLamp(c, lx, fl + u * 1.5, lh, u, p, pt > 0);
    var sx = -u * 6, sw = u * 50;
    sofa(c, sx, fl + u * 2.5, sw, u, p.accent, p);
    pillow(c, sx + u * 13, fl - u * 12.5, u * 9.5, -0.18, p.gold, p.paper, 1); pillow(c, sx + u * 37.5, fl - u * 12.5, u * 9.5, 0.2, mix(p.accent2, p.paper, 0.2), p.paper, 3);
    cat(c, sx + u * 25.5, fl - u * 10.3, u * 11, mix('#e9a05a', p.gold, 0.25), t, 1);
    /* side table with a mug */
    var tx = u * 49.5; box(c, tx - u * 0.5, fl - u * 9, u * 1, u * 11.5, shade(wd, -0.15)); ell(c, tx, fl + u * 2.6, u * 3.4, u * 0.8, shade(wd, -0.2)); ell(c, tx, fl - u * 9.4, u * 5.2, u * 1.4, wd); ell(c, tx, fl - u * 9.8, u * 5.2, u * 1.3, shade(wd, 0.14));
    mug(c, tx - u * 0.6, fl - u * 9.9, u * 3.2, p.paper, t);
    Rn(c, wx - u * 7.5, wy - u * 4.8, ww + u * 15, u * 1.3, u * 0.65, p.gold); dot(c, wx - u * 7.5, wy - u * 4.15, u * 1.2, p.gold); dot(c, wx + ww + u * 7.5, wy - u * 4.15, u * 1.2, p.gold);
    curtain(c, wx - u * 6.5, wy - u * 3.6, u * 9, wh + u * 9, cu, 1, u, p.gold); curtain(c, wx + ww + u * 6.5, wy - u * 3.6, u * 9, wh + u * 9, cu, -1, u, p.gold);
    if (pt) {
      dim(c, W, H, p, 0.3);
      windowAt(c, wx, wy, ww, wh, v, p, t, o, u, 'garden', 2, 3, true);
      glow(c, lx, fl + u * 1.5 - lh + u * 6, u * 46, WARM, 0.42); lampShade(c, lx, fl + u * 1.5 - lh, u * 11, u * 8.5, mix(p.paper, p.gold, 0.3), true);
      c.fillStyle = alpha(WARM, 0.1); c.beginPath(); c.moveTo(lx - u * 5.5, fl + u * 1.5 - lh + u * 8.5); c.lineTo(lx + u * 5.5, fl + u * 1.5 - lh + u * 8.5); c.lineTo(lx + u * 20, fl + u * 4); c.lineTo(lx - u * 20, fl + u * 4); c.closePath(); c.fill();
      ell(c, lx, fl + u * 4, u * 21, u * 3.4, alpha(WARM, 0.16));
    } else {
      c.fillStyle = alpha('#fff6d0', 0.1); c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx + ww, wy + wh); c.lineTo(wx + ww + u * 34, H); c.lineTo(wx + u * 14, H); c.closePath(); c.fill();
    }
  }, { variants: ['day', 'evening'], stage: 'cast-low' });

  /* ---------- more small tools for the other rooms ---------- */
  /* a room after dark is drawn with a dimmed palette (the window's view keeps its own light); out of doors the near things take the hour's tint */
  function dimPal(p, a) { var d = mix('#1b1640', p.bg, 0.3), q = {}, k; for (k in p) q[k] = mix(p[k], d, a); return q; }
  function near(col, v) { var pt = part(v); return pt === 2 ? mix(col, '#161d4e', 0.5) : pt === 1 ? mix(col, '#7a4a70', 0.22) : col; }
  function tintPal(p, v) { if (!part(v)) return p; var q = {}, k; for (k in p) q[k] = near(p[k], v); return q; }
  function tiles(c, W, y0, H, a, b, u) { /* a chequered floor going away from us */
    var hh = H - y0, i, k, rows = 7, tw = u * 11, cx = W / 2;
    box(c, 0, y0, W, hh, a); c.fillStyle = b;
    for (i = 0; i < rows; i++) {
      var ya = y0 + hh * Math.pow(i / rows, 1.6), yb = y0 + hh * Math.pow((i + 1) / rows, 1.6), sa = 0.55 + 0.75 * (ya - y0) / hh, sb = 0.55 + 0.75 * (yb - y0) / hh;
      for (k = -14; k < 14; k++) { if ((k + i) & 1) continue; c.beginPath(); c.moveTo(cx + k * tw * sa, ya); c.lineTo(cx + (k + 1) * tw * sa, ya); c.lineTo(cx + (k + 1) * tw * sb, yb + 0.5); c.lineTo(cx + k * tw * sb, yb + 0.5); c.closePath(); c.fill(); }
    }
    grad(c, 0, y0, W, hh, ['rgba(40,20,40,0)', 'rgba(40,20,40,0.2)']); box(c, 0, y0, W, u * 0.9, 'rgba(0,0,0,0.13)');
  }
  function dog(c, x, y, s, col, t, ph) { /* a dog asleep, nose on its paws: base centre (x, y), s long */
    var b = 1 + Math.sin(t * 1.4 + (ph || 0)) * 0.04, dk = shade(col, -0.24);
    c.beginPath(); c.moveTo(x + s * 0.4, y - s * 0.14); c.quadraticCurveTo(x + s * 0.64, y - s * 0.26, x + s * 0.56, y - s * 0.03); c.lineWidth = s * 0.07; c.lineCap = 'round'; c.strokeStyle = dk; c.stroke();
    ell(c, x + s * 0.1, y - s * 0.17 * b, s * 0.4, s * 0.18 * b, col); ell(c, x + s * 0.3, y - s * 0.1, s * 0.17, s * 0.11, shade(col, -0.08));
    Rn(c, x - s * 0.52, y - s * 0.075, s * 0.34, s * 0.08, s * 0.04, shade(col, 0.14));
    ell(c, x - s * 0.3, y - s * 0.17, s * 0.17, s * 0.14, col); ell(c, x - s * 0.43, y - s * 0.12, s * 0.1, s * 0.07, shade(col, 0.22)); dot(c, x - s * 0.52, y - s * 0.13, s * 0.028, '#2b2118');
    ell(c, x - s * 0.2, y - s * 0.15, s * 0.07, s * 0.15, dk, 0.5);
    c.lineWidth = s * 0.02; c.strokeStyle = '#2b2118'; c.beginPath(); c.arc(x - s * 0.36, y - s * 0.19, s * 0.03, 0.1 * PI, 0.9 * PI); c.stroke();
  }
  function catSit(c, x, y, s, col, t) { /* a cat sitting with its back to us, watching: base centre (x, y), s tall */
    var dk = shade(col, -0.16), i;
    c.beginPath(); c.moveTo(x + s * 0.16, y - s * 0.05); c.quadraticCurveTo(x + s * 0.52, y + s * 0.02, x + s * 0.5 + Math.sin(t * 1.3) * s * 0.06, y - s * 0.24); c.lineWidth = s * 0.09; c.lineCap = 'round'; c.strokeStyle = dk; c.stroke();
    ell(c, x, y - s * 0.3, s * 0.25, s * 0.3, col); ell(c, x, y - s * 0.13, s * 0.31, s * 0.14, col);
    for (i = 0; i < 3; i++) { c.beginPath(); c.arc(x, y - s * (0.6 - i * 0.1), s * 0.2, 0.25 * PI, 0.75 * PI); c.lineWidth = s * 0.035; c.strokeStyle = dk; c.stroke(); }
    Pg(c, [[x - s * 0.19, y - s * 0.7], [x - s * 0.16, y - s * 0.95], [x - s * 0.02, y - s * 0.8]], col, true); Pg(c, [[x + s * 0.19, y - s * 0.7], [x + s * 0.16, y - s * 0.95], [x + s * 0.02, y - s * 0.8]], col, true);
    Pg(c, [[x - s * 0.15, y - s * 0.76], [x - s * 0.14, y - s * 0.88], [x - s * 0.07, y - s * 0.8]], '#f0a0a8', true); Pg(c, [[x + s * 0.15, y - s * 0.76], [x + s * 0.14, y - s * 0.88], [x + s * 0.07, y - s * 0.8]], '#f0a0a8', true);
    dot(c, x, y - s * 0.66, s * 0.19, col);
  }
  function teddy(c, x, y, s, col) { /* a sitting teddy bear: base centre (x, y), s tall */
    var lt = shade(col, 0.3), i;
    for (i = -1; i <= 1; i += 2) { dot(c, x + i * s * 0.19, y - s * 0.86, s * 0.1, col); dot(c, x + i * s * 0.19, y - s * 0.86, s * 0.05, lt); ell(c, x + i * s * 0.27, y - s * 0.36, s * 0.09, s * 0.16, shade(col, -0.08), i * 0.5); ell(c, x + i * s * 0.2, y - s * 0.07, s * 0.14, s * 0.1, shade(col, -0.08)); dot(c, x + i * s * 0.22, y - s * 0.07, s * 0.055, lt); }
    ell(c, x, y - s * 0.3, s * 0.26, s * 0.3, col); ell(c, x, y - s * 0.26, s * 0.15, s * 0.18, lt);
    dot(c, x, y - s * 0.68, s * 0.24, col); ell(c, x, y - s * 0.62, s * 0.11, s * 0.085, lt); dot(c, x, y - s * 0.65, s * 0.035, '#2b2118'); dot(c, x - s * 0.09, y - s * 0.73, s * 0.028, '#2b2118'); dot(c, x + s * 0.09, y - s * 0.73, s * 0.028, '#2b2118');
  }
  function armchair(c, x, base, w, u, col, p) {
    var wdk = shade(woodc(p), -0.2);
    box(c, x + u * 3, base - u * 2.4, u * 1.6, u * 2.4, wdk); box(c, x + w - u * 4.6, base - u * 2.4, u * 1.6, u * 2.4, wdk); ell(c, x + w / 2, base, w * 0.5, u * 1.2, 'rgba(0,0,0,0.14)');
    Rn(c, x + u * 3.5, base - u * 31, w - u * 7, u * 25, u * 6, shade(col, -0.12)); Rn(c, x + u * 6, base - u * 29, w - u * 12, u * 16, u * 4, col); Rn(c, x + u * 7.2, base - u * 28, w - u * 14.4, u * 3, u * 1.5, shade(col, 0.12));
    Rn(c, x + u * 5.5, base - u * 13.5, w - u * 11, u * 7, u * 2.6, shade(col, 0.1)); Rn(c, x + u * 1.5, base - u * 7.4, w - u * 3, u * 5.4, u * 1.6, shade(col, -0.2));
    Rn(c, x, base - u * 19, u * 7.5, u * 17, u * 3.4, shade(col, 0.06)); Rn(c, x + w - u * 7.5, base - u * 19, u * 7.5, u * 17, u * 3.4, shade(col, 0.06));
    Rn(c, x + u * 1.1, base - u * 18.2, u * 5.3, u * 2.6, u * 1.3, shade(col, 0.2)); Rn(c, x + w - u * 6.4, base - u * 18.2, u * 5.3, u * 2.6, u * 1.3, shade(col, 0.2));
  }
  function jar(c, x, y, w, h, col, lid) { /* a storage jar: base centre (x, y) */
    Rn(c, x - w / 2, y - h, w, h, w * 0.22, 'rgba(255,255,255,0.6)'); Rn(c, x - w * 0.4, y - h * 0.72, w * 0.8, h * 0.68, w * 0.16, col); Rn(c, x - w * 0.56, y - h - w * 0.2, w * 1.12, w * 0.32, w * 0.1, lid); box(c, x - w * 0.3, y - h * 0.85, w * 0.12, h * 0.6, 'rgba(255,255,255,0.4)');
  }
  function candle(c, x, y, w, h, col, t, ph) { box(c, x - w / 2, y - h, w, h, col); box(c, x + w * 0.2, y - h, w * 0.3, h, 'rgba(0,0,0,0.1)'); flame(c, x, y - h - w * 0.2, w * 1.1, w * 2.6, t, ph); }
  function boots(c, x, y, s, col) { /* a pair of rain boots: base (x, y), s tall */
    for (var i = 0; i < 2; i++) { var bx = x + i * s * 0.62; Rn(c, bx, y - s, s * 0.36, s, s * 0.08, col); Rn(c, bx - s * 0.2, y - s * 0.3, s * 0.56, s * 0.3, s * 0.13, col); box(c, bx - s * 0.2, y - s * 0.07, s * 0.56, s * 0.07, shade(col, -0.3)); box(c, bx, y - s, s * 0.36, s * 0.12, shade(col, 0.25)); }
  }
  function lantern(c, x, y, s, t, on, col) { /* a candle lantern: base centre (x, y), s tall */
    if (on) glow(c, x, y - s * 0.45, s * 2.6, WARM, 0.5);
    c.beginPath(); c.arc(x, y - s * 0.92, s * 0.14, PI, 0); c.lineWidth = s * 0.05; c.strokeStyle = col; c.stroke();
    Rn(c, x - s * 0.3, y - s * 0.86, s * 0.6, s * 0.12, s * 0.04, col); Rn(c, x - s * 0.34, y - s * 0.1, s * 0.68, s * 0.1, s * 0.04, col);
    box(c, x - s * 0.26, y - s * 0.76, s * 0.52, s * 0.68, on ? alpha('#ffe9a8', 0.9) : 'rgba(255,255,255,0.45)'); box(c, x - s * 0.28, y - s * 0.76, s * 0.05, s * 0.68, col); box(c, x + s * 0.23, y - s * 0.76, s * 0.05, s * 0.68, col);
    box(c, x - s * 0.06, y - s * 0.34, s * 0.12, s * 0.24, '#fff8ea'); flame(c, x, y - s * 0.34, s * 0.14, s * 0.3, t, 1);
  }

  /* ---------- homekitchen: the family kitchen (day, evening) ---------- */
  function pendant(c, x, len, u, col, on) {
    box(c, x - u * 0.15, 0, u * 0.3, len, '#4a4450'); Pg(c, [[x - u * 1.2, len], [x + u * 1.2, len], [x + u * 4.2, len + u * 4.6], [x - u * 4.2, len + u * 4.6]], col, true); box(c, x - u * 4.2, len + u * 4, u * 8.4, u * 0.9, shade(col, -0.16));
    ell(c, x, len + u * 5, u * 1.7, u * 1.1, on ? '#fff6d0' : 'rgba(255,255,255,0.85)');
  }
  add('homekitchen', function (c, W, H, t, p, o, u) {
    var v = o.variant, pt = part(v), pp = pt ? dimPal(p, 0.3) : p, fl = H * 0.665, i, j, wd = woodc(pp), ct = fl - u * 19, ty = ct - u * 21, cab = mix(pp.accent2, pp.paper, 0.3), tl = mix(pp.paper, pp.bg, 0.22), steel = pt ? '#8d91a6' : '#b9c0c8';
    grad(c, 0, 0, W, ty, [shade(pp.bg, 0.12), pp.bg]);
    /* tiles behind the counter */
    box(c, 0, ty, W, ct - ty, tl); c.fillStyle = shade(tl, -0.12);
    for (j = 0; j * u * 3.5 < ct - ty; j++) { c.fillRect(0, ty + j * u * 3.5, W, Math.max(1, u * 0.25)); for (i = 0; i * u * 7 < W + u * 7; i++) c.fillRect(i * u * 7 - (j % 2) * u * 3.5, ty + j * u * 3.5, Math.max(1, u * 0.25), u * 3.5); }
    c.fillStyle = alpha(pp.accent, 0.5); for (i = 0; i * u * 7 < W + u * 7; i += 3) c.fillRect(i * u * 7 + u * 0.25, ty + u * 7.25, u * 6.75, u * 3.25);
    box(c, 0, ty - u * 1, W, u * 1.3, pp.paper); box(c, 0, ty + u * 0.3, W, u * 0.5, 'rgba(0,0,0,0.08)');
    var fa = mix(pp.bg2, '#f4ead8', 0.45); tiles(c, W, fl, H, fa, mix(fa, pp.accent2, 0.3), u);
    /* copper pans on a rail, top right */
    var rx = W - u * 29, ry = H * 0.115; Rn(c, rx, ry, u * 25, u * 1, u * 0.5, steel);
    for (i = 0; i < 3; i++) { var pr = u * (4.4 - i * 0.7), pcx = rx + u * (5 + i * 8), pcy = ry + u * 6.5 + pr, cu = mix('#d98a52', pp.gold, 0.25 + i * 0.15); box(c, pcx - u * 0.5, ry + u * 0.6, u * 1, u * 6.4, '#4a4450'); dot(c, pcx, ry + u * 1.6, u * 0.9, '#4a4450'); dot(c, pcx, pcy, pr, shade(cu, -0.18)); dot(c, pcx, pcy, pr * 0.8, cu); c.beginPath(); c.arc(pcx, pcy, pr * 0.55, PI * 1.1, PI * 1.6); c.lineWidth = u * 0.5; c.strokeStyle = 'rgba(255,255,255,0.45)'; c.stroke(); }
    /* the window over the sink, with herbs on the sill */
    var wx = u * 8, wy = H * 0.1, ww = u * 26, wh = u * 30;
    windowAt(c, wx, wy, ww, wh, v, p, t, o, u, 'garden', 2, 2, false, pp);
    for (i = 0; i < 6; i++) { c.beginPath(); c.arc(wx + ww * (i + 0.5) / 6, wy - u * 0.2, ww / 12 + u * 0.3, 0, PI); c.fillStyle = i % 2 ? pp.accent : shade(pp.accent, 0.25); c.fill(); dot(c, wx + ww * (i + 0.5) / 6, wy + u * 1.1, u * 0.5, pp.paper); }
    Rn(c, wx - u * 2.5, wy - u * 2.4, ww + u * 5, u * 2.4, u * 0.8, pp.accent);
    plant(c, wx + u * 5, wy + wh + u * 0.9, u * 9, pp, t, 1); plant(c, wx + u * 13.5, wy + wh + u * 0.9, u * 7.5, pp, t, 0, pp.paper); plant(c, wx + u * 21.5, wy + wh + u * 0.9, u * 8.5, pp, t, 1, pp.gold);
    /* a shelf of jars, mugs on hooks under it */
    var sx = W - u * 51, sy = ty - u * 12, sw = u * 24;
    Pg(c, [[sx + u * 2, sy + u * 1.2], [sx + u * 5, sy + u * 1.2], [sx + u * 2, sy + u * 4.4]], shade(wd, -0.2), true); Pg(c, [[sx + sw - u * 2, sy + u * 1.2], [sx + sw - u * 5, sy + u * 1.2], [sx + sw - u * 2, sy + u * 4.4]], shade(wd, -0.2), true);
    Rn(c, sx, sy, sw, u * 1.4, u * 0.5, wd);
    jar(c, sx + u * 3.6, sy, u * 4.4, u * 7, mix('#e8c98a', pp.gold, 0.3), pp.accent); jar(c, sx + u * 9, sy, u * 4, u * 5.4, mix('#b9774a', pp.accent, 0.2), pp.accent2); jar(c, sx + u * 14, sy, u * 4.4, u * 7.6, mix('#f3ead8', pp.paper, 0.4), pp.gold);
    plant(c, sx + u * 20, sy, u * 8, pp, t, 2, pp.paper);
    for (i = 0; i < 3; i++) { var mx = sx + u * (7 + i * 5), mc = [pp.accent, pp.gold, pp.accent2][i]; box(c, mx - u * 0.15, sy + u * 1.4, u * 0.3, u * 1.2, steel); c.beginPath(); c.arc(mx + u * 1.5, sy + u * 4.2, u * 0.9, -PI / 2, PI / 2); c.lineWidth = u * 0.5; c.strokeStyle = mc; c.stroke(); Rn(c, mx - u * 1.5, sy + u * 2.5, u * 3, u * 3.2, u * 0.7, mc); box(c, mx - u * 1.5, sy + u * 3.2, u * 3, u * 0.5, shade(mc, 0.3)); }
    /* the counter and its cupboards */
    var nd = Math.round(W / (u * 12.5)), dw = W / nd;
    box(c, 0, ct, W, fl - ct, cab);
    for (i = 0; i < nd; i++) { Rn(c, i * dw + u * 1, ct + u * 3.4, dw - u * 2, fl - ct - u * 6.4, u * 0.8, shade(cab, 0.14)); Rn(c, i * dw + u * 2.3, ct + u * 4.7, dw - u * 4.6, fl - ct - u * 9, u * 0.5, cab); dot(c, i % 2 ? i * dw + u * 2.6 : (i + 1) * dw - u * 2.6, ct + u * 5.4, u * 0.75, pp.gold); }
    Rn(c, dw * 0.3, ct + u * 3, u * 5, u * 9, u * 0.5, pp.paper); box(c, dw * 0.3, ct + u * 9, u * 5, u * 0.8, pp.accent); box(c, dw * 0.3, ct + u * 10.4, u * 5, u * 0.4, pp.accent);
    box(c, 0, fl - u * 2.4, W, u * 2.4, shade(cab, -0.34));
    /* the cooker */
    var ox = W - u * 50, ovw = u * 22, fk = 0.6 + 0.2 * Math.sin(t * 5) + 0.1 * Math.sin(t * 11);
    Rn(c, ox, ct - u * 0.4, ovw, fl - ct + u * 0.4, u * 0.8, shade(pp.paper, -0.1)); box(c, ox, fl - u * 2.4, ovw, u * 2.4, '#3a3440');
    for (i = 0; i < 4; i++) dot(c, ox + u * (3.5 + i * 5), ct + u * 3.2, u * 1, i === 1 ? pp.accent : '#5a5560');
    Rn(c, ox + u * 2, ct + u * 6.4, ovw - u * 4, fl - ct - u * 10.4, u * 0.9, '#3b2f3a'); Rn(c, ox + u * 3, ct + u * 7.4, ovw - u * 6, fl - ct - u * 12.4, u * 0.6, alpha('#ff9a3a', 0.3 + 0.2 * fk));
    ell(c, ox + ovw / 2, fl - u * 5.6, u * 5.4, u * 1.5, '#c98a4a'); ell(c, ox + ovw / 2, fl - u * 6.1, u * 4.6, u * 1.1, '#e9b872');
    Rn(c, ox + u * 3, ct + u * 5, ovw - u * 6, u * 0.9, u * 0.45, steel);
    box(c, 0, ct - u * 0.4, W, u * 2.1, pp.paper); box(c, 0, ct + u * 1.7, W, u * 0.6, 'rgba(0,0,0,0.12)'); box(c, ox, ct - u * 0.8, ovw, u * 1.5, '#3a3440');
    /* on the counter: tap, drying rack, fruit, a pot on the boil, the kettle */
    var tx = wx + ww * 0.42; box(c, tx - u * 1.2, ct - u * 1.2, u * 2.4, u * 0.9, steel); c.beginPath(); c.moveTo(tx, ct - u * 1); c.lineTo(tx, ct - u * 6); c.arc(tx + u * 2.6, ct - u * 6, u * 2.6, PI, 0); c.lineTo(tx + u * 5.2, ct - u * 5); c.lineWidth = u * 0.9; c.lineCap = 'round'; c.strokeStyle = steel; c.stroke();
    Rn(c, wx - u * 3, ct - u * 5.6, u * 2.6, u * 5.2, u * 0.8, pp.accent2); box(c, wx - u * 2.2, ct - u * 7, u * 1, u * 1.6, pp.paper);
    for (i = 0; i < 4; i++) { ell(c, wx + ww + u * (1 + i * 2.3), ct - u * 3.6, u * 0.8, u * 3.2, i % 2 ? pp.paper : shade(pp.paper, -0.08)); ell(c, wx + ww + u * (1.2 + i * 2.3), ct - u * 3.6, u * 0.35, u * 2.4, alpha(pp.accent, 0.5)); } box(c, wx + ww - u * 0.6, ct - u * 1.3, u * 10.4, u * 0.9, steel);
    var bx = ox - u * 8.5; dot(c, bx - u * 2, ct - u * 3.6, u * 1.9, pp.accent); dot(c, bx + u * 1.6, ct - u * 3.9, u * 2, mix(pp.gold, '#ff9a3a', 0.4)); dot(c, bx + u * 0.2, ct - u * 5.4, u * 1.8, mix(pp.accent2, '#9ed05a', 0.5)); L(c, bx + u * 0.2, ct - u * 7, bx + u * 0.6, ct - u * 8, u * 0.35, shade(wd, -0.3));
    c.beginPath(); c.ellipse(bx, ct - u * 3.4, u * 5.4, u * 3.2, 0, 0, PI); c.fillStyle = pp.gold; c.fill(); box(c, bx - u * 5.4, ct - u * 3.8, u * 10.8, u * 0.8, shade(pp.gold, 0.25)); box(c, bx - u * 2, ct - u * 0.8, u * 4, u * 0.5, shade(pp.gold, -0.2));
    var px = ox + u * 7.5; Rn(c, px - u * 6.4, ct - u * 5.6, u * 12.8, u * 1.3, u * 0.6, shade(pp.accent, -0.25)); Rn(c, px - u * 4.6, ct - u * 7.2, u * 9.2, u * 6.4, u * 1, pp.accent); box(c, px - u * 4.6, ct - u * 5.4, u * 9.2, u * 0.7, shade(pp.accent, 0.25));
    Rn(c, px - u * 5, ct - u * 8.1 - Math.max(0, Math.sin(t * 7)) * u * 0.3, u * 10, u * 1.3, u * 0.6, shade(pp.accent, -0.15)); dot(c, px, ct - u * 8.8 - Math.max(0, Math.sin(t * 7)) * u * 0.3, u * 0.8, pp.gold); steam(c, px, ct - u * 9.6, u * 7, t, 3);
    var kx = ox + u * 17.2; Pg(c, [[kx + u * 2.4, ct - u * 3.6], [kx + u * 5.2, ct - u * 5.6], [kx + u * 4.9, ct - u * 6.3], [kx + u * 2, ct - u * 5]], shade(pp.accent2, -0.15), true); ell(c, kx, ct - u * 3.7, u * 3.3, u * 3.1, pp.accent2); ell(c, kx - u * 1, ct - u * 4.6, u * 1, u * 1.5, 'rgba(255,255,255,0.3)', 0.4); box(c, kx - u * 3.3, ct - u * 1.4, u * 6.6, u * 0.7, shade(pp.accent2, -0.3));
    c.beginPath(); c.arc(kx, ct - u * 6, u * 2.6, PI * 1.05, PI * 1.95); c.lineWidth = u * 0.7; c.strokeStyle = '#3a3440'; c.stroke(); dot(c, kx, ct - u * 6.9, u * 0.7, '#3a3440');
    /* the fridge */
    var fx = W - u * 25, fw = u * 21, ft = fl - u * 58, fc = shade(pp.paper, -0.03);
    box(c, fx + u * 1.5, fl - u * 0.4, u * 2.5, u * 1.4, '#3a3440'); box(c, fx + fw - u * 4, fl - u * 0.4, u * 2.5, u * 1.4, '#3a3440');
    Rn(c, fx, ft, fw, fl - ft, u * 2, shade(fc, -0.16)); Rn(c, fx + u * 0.8, ft + u * 0.8, fw - u * 1.6, u * 17, u * 1.4, fc); Rn(c, fx + u * 0.8, ft + u * 19, fw - u * 1.6, fl - ft - u * 20, u * 1.4, fc);
    Rn(c, fx + u * 2.2, ft + u * 6.5, u * 1.1, u * 9, u * 0.55, steel); Rn(c, fx + u * 2.2, ft + u * 21.5, u * 1.1, u * 13, u * 0.55, steel);
    c.save(); c.translate(fx + u * 12.5, ft + u * 28); c.rotate(-0.06); box(c, -u * 4, -u * 5, u * 8, u * 10, pp.paper === fc ? '#fff' : '#fffdf6'); dot(c, u * 1.8, -u * 2.6, u * 1.2, pp.gold); Pg(c, [[-u * 3, u * 0.4], [-u * 0.8, -u * 2.2], [u * 1.4, u * 0.4]], pp.accent, true); box(c, -u * 2.4, u * 0.4, u * 3.2, u * 2.6, pp.accent2); box(c, -u * 4, u * 3, u * 8, u * 0.5, mix(pp.accent2, '#5fb070', 0.5)); dot(c, 0, -u * 5, u * 0.9, pp.accent); c.restore();
    heartPath(c, fx + u * 9, ft + u * 8, u * 3); c.fillStyle = pp.accent; c.fill(); starPath(c, fx + u * 15.5, ft + u * 11.5, u * 1.9, u * 0.85, 5, 0.2); c.fillStyle = pp.gold; c.fill(); dot(c, fx + u * 14, ft + u * 5, u * 1.1, pp.accent2); dot(c, fx + u * 17, ft + u * 40, u * 1, pp.gold);
    Rn(c, fx + u * 2, ft - u * 5, u * 8, u * 5, u * 0.8, mix('#d2a36c', pp.gold, 0.25)); box(c, fx + u * 2, ft - u * 3.4, u * 8, u * 0.5, 'rgba(0,0,0,0.12)'); plant(c, fx + u * 15, ft, u * 10.5, pp, t, 0);
    /* on the floor: a mat by the sink and the pet's bowl */
    rug(c, wx + ww * 0.5 + u * 5, fl + (H - fl) * 0.27, u * 19, (H - fl) * 0.1, pp.accent, pp.paper, u);
    var pbx = W - u * 15, pby = fl + (H - fl) * 0.2; ell(c, pbx, pby + u * 0.3, u * 5.4, u * 1.2, 'rgba(0,0,0,0.14)'); Pg(c, [[pbx - u * 3.6, pby - u * 2.6], [pbx + u * 3.6, pby - u * 2.6], [pbx + u * 4.8, pby], [pbx - u * 4.8, pby]], pp.accent, true); ell(c, pbx, pby - u * 2.6, u * 3.6, u * 0.9, '#8a5a34'); K.bone(c, pbx, pby - u * 1.1, u * 3.4, 0, pp.paper);
    /* the lamps */
    var lx = [W * 0.34, W * 0.66], ll = u * 5;
    for (i = 0; i < 2; i++) pendant(c, lx[i], ll, u, pp.gold, pt > 0);
    if (pt) {
      for (i = 0; i < 2; i++) { glow(c, lx[i], ll + u * 5, u * 34, WARM, 0.36); c.fillStyle = alpha(WARM, 0.07); c.beginPath(); c.moveTo(lx[i] - u * 4, ll + u * 5); c.lineTo(lx[i] + u * 4, ll + u * 5); c.lineTo(lx[i] + u * 24, ct); c.lineTo(lx[i] - u * 24, ct); c.closePath(); c.fill(); pendant(c, lx[i], ll, u, p.gold, true); }
      glow(c, ox + ovw / 2, fl - u * 7, u * 16, '#ff9a3a', 0.3 * fk);
    } else {
      c.fillStyle = alpha('#fff6d0', 0.1); c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx + ww, wy + wh); c.lineTo(wx + ww + u * 30, H); c.lineTo(wx + u * 12, H); c.closePath(); c.fill();
    }
  }, { variants: ['day', 'evening'], stage: 'cast-low' });

  /* ---------- porch: looking out from the front porch (day, dusk, night) ---------- */
  function rocker(c, x, y, s, col, cush, t) { /* a rocking chair facing us: base centre (x, y), s tall */
    var i; c.save(); c.translate(x, y); c.rotate(Math.sin(t * 0.9) * 0.03);
    Rn(c, -s * 0.4, -s * 0.07, s * 0.2, s * 0.07, s * 0.03, shade(col, -0.2)); Rn(c, s * 0.2, -s * 0.07, s * 0.2, s * 0.07, s * 0.03, shade(col, -0.2));
    box(c, -s * 0.33, -s * 0.4, s * 0.06, s * 0.36, shade(col, -0.1)); box(c, s * 0.27, -s * 0.4, s * 0.06, s * 0.36, shade(col, -0.1));
    Rn(c, -s * 0.3, -s, s * 0.6, s * 0.6, s * 0.1, col); Rn(c, -s * 0.24, -s * 0.93, s * 0.48, s * 0.5, s * 0.06, 'rgba(30,20,40,0.28)');
    for (i = 0; i < 4; i++) box(c, -s * 0.2 + i * s * 0.117, -s * 0.93, s * 0.06, s * 0.5, col);
    Rn(c, -s * 0.36, -s * 0.44, s * 0.72, s * 0.1, s * 0.03, shade(col, 0.1)); Rn(c, -s * 0.31, -s * 0.53, s * 0.62, s * 0.11, s * 0.05, cush);
    Rn(c, -s * 0.44, -s * 0.64, s * 0.13, s * 0.07, s * 0.03, shade(col, 0.1)); Rn(c, s * 0.31, -s * 0.64, s * 0.13, s * 0.07, s * 0.03, shade(col, 0.1)); box(c, -s * 0.4, -s * 0.58, s * 0.05, s * 0.16, col); box(c, s * 0.35, -s * 0.58, s * 0.05, s * 0.16, col);
    c.restore();
  }
  function basket(c, x, y, s, p, t, wd) { /* a hanging basket of flowers: its rim centre at (x, y), hung from the eave at y0 = y - s * 1.2 */
    var i; L(c, x - s * 0.5, y, x, y - s * 1.2, s * 0.04, '#5a5560'); L(c, x + s * 0.5, y, x, y - s * 1.2, s * 0.04, '#5a5560');
    plant(c, x, y + s * 0.42, s * 1.3, p, t, 2, wd);
    c.beginPath(); c.ellipse(x, y, s * 0.55, s * 0.5, 0, 0, PI); c.fillStyle = wd; c.fill(); box(c, x - s * 0.58, y - s * 0.08, s * 1.16, s * 0.16, shade(wd, 0.16));
    for (i = 0; i < 4; i++) K.bloom(c, x + (i - 1.5) * s * 0.3, y - s * (0.2 + (i % 2) * 0.16), s * 0.2, [p.accent, p.gold, p.paper, p.accent][i], t, i * 1.7);
  }
  add('porch', function (c, W, H, t, p, o, u) {
    var v = o.variant, pt = part(v), fl = H * 0.665, hz = H * 0.6, q = tintPal(p, v), i, wh = q.paper, wd = woodc(q), R0 = rnd(o.seed + 'porch');
    var g1 = land(mix('#a6dc98', p.accent2, 0.28), v), g2 = land(mix('#74c07a', p.accent2, 0.34), v);
    grad(c, 0, 0, W, fl, skyOut(v, p));
    lights(c, 0, H * 0.035, W, hz, v, t, o, u, W * (pt === 1 ? 0.42 : 0.7), H * 0.19, u * 6, H * 0.52);
    var f1 = K.hill(c, W, H, H * 0.5, u * 2.6, g1, o.seed + 'pa', 0.7);
    cottage(c, W * 0.2, f1(W * 0.24) + u * 1, u * 13, land('#f3e6d2', v), land(mix('#c8553f', p.accent, 0.4), v), pt ? WARM : '#dff1ff', land('#7a4a34', v));
    if (pt) glow(c, W * 0.2 + u * 6.5, f1(W * 0.24) - u * 3, u * 9, WARM, 0.25);
    tree(c, W * 0.2 - u * 4, f1(W * 0.17) + u * 1, u * 12, shade(g2, -0.1), land('#7a5230', v)); tree(c, W * 0.2 + u * 19, f1(W * 0.34) + u * 1, u * 9, shade(g2, -0.04), land('#7a5230', v));
    var f2 = K.hill(c, W, H, H * 0.555, u * 1.8, g2, o.seed + 'pb', 1);
    for (i = 0; i < 4; i++) { var tx = W * (0.62 + i * 0.1) + R0() * u * 3; tree(c, tx, f2(tx) + u * 1, u * (11 + R0() * 7), shade(g2, -0.14 - (i % 2) * 0.08), land('#7a5230', v)); }
    c.beginPath(); c.moveTo(W * 0.43, fl); c.quadraticCurveTo(W * 0.5, H * 0.6, W * 0.4, H * 0.575); c.quadraticCurveTo(W * 0.33, H * 0.565, W * 0.3, f1(W * 0.3) + u * 2.4); c.lineTo(W * 0.32, f1(W * 0.3) + u * 2.4); c.quadraticCurveTo(W * 0.37, H * 0.565, W * 0.46, H * 0.575); c.quadraticCurveTo(W * 0.6, H * 0.6, W * 0.57, fl); c.closePath(); c.fillStyle = land(mix('#ecd9b0', p.bg2, 0.25), v); c.fill();
    var mbx = W * 0.6, mby = H * 0.6; box(c, mbx - u * 0.4, mby - u * 6, u * 0.8, u * 7, land('#7a5230', v)); Rn(c, mbx - u * 2.6, mby - u * 9, u * 5.2, u * 3.4, u * 1.4, land(p.accent, v)); box(c, mbx + u * 1.6, mby - u * 11, u * 0.4, u * 2.6, land(p.gold, v)); box(c, mbx + u * 1.6, mby - u * 11, u * 1.6, u * 1.1, land(p.gold, v));
    if (pt === 2) fireflies(c, 0, H * 0.46, W, H * 0.15, 10, o.seed, t, u); else if (pt === 1) fireflies(c, 0, H * 0.5, W, H * 0.1, 4, o.seed, t, u);
    /* the deck, the railing with a way out in the middle */
    planks(c, W, fl, H, floorc(q), u, 6);
    var ry = fl - u * 15, gl = W * 0.5 - u * 13, gr = W * 0.5 + u * 13, s;
    for (s = 0; s < 2; s++) {
      var x0 = s ? gr : 0, x1 = s ? W : gl;
      for (i = 0; x0 + u * 2.4 + i * u * 3.5 < x1 - u * 1.5; i++) box(c, x0 + u * 2.4 + i * u * 3.5, ry, u * 1.3, fl - ry, i % 2 ? wh : shade(wh, -0.06));
      box(c, x0, fl - u * 3.4, x1 - x0, u * 1.5, shade(wh, -0.08)); Rn(c, x0 - u, ry - u * 1.2, x1 - x0 + u * 2, u * 2.2, u * 0.8, wh); box(c, x0, ry + u * 1, x1 - x0, u * 0.5, 'rgba(0,0,0,0.1)');
      var nx = s ? gr : gl - u * 3; box(c, nx, ry - u * 3.4, u * 3, fl - ry + u * 4.4, wh); box(c, nx + u * 2.2, ry - u * 3.4, u * 0.8, fl - ry + u * 4.4, 'rgba(0,0,0,0.1)'); Rn(c, nx - u * 0.6, ry - u * 4.6, u * 4.2, u * 1.6, u * 0.6, wh); dot(c, nx + u * 1.5, ry - u * 5.6, u * 1.5, wh);
    }
    Pg(c, [[gl, fl], [gr, fl], [gr + u * 1.5, fl + u * 2.4], [gl - u * 1.5, fl + u * 2.4]], shade(floorc(q), 0.12), true);
    rug(c, W * 0.5, fl + (H - fl) * 0.6, W * 0.3, (H - fl) * 0.2, mix(q.accent2, q.bg2, 0.2), q.paper, u);
    /* the roof, its posts and what hangs from it */
    for (s = 0; s < 2; s++) { var px = s ? W - u * 6.5 : 0; box(c, px, 0, u * 6.5, fl + u * 1.6, wh); box(c, s ? px : px + u * 5.3, 0, u * 1.2, fl + u * 1.6, 'rgba(0,0,0,0.1)'); Rn(c, px - u * 1, fl - u * 2.5, u * 8.5, u * 5, u * 0.8, shade(wh, -0.05)); Rn(c, px - u * 1, u * 9, u * 8.5, u * 2.2, u * 0.8, shade(wh, -0.05));
      Pg(c, [[s ? W - u * 6.5 : u * 6.5, u * 7], [s ? W - u * 17 : u * 17, u * 7], [s ? W - u * 6.5 : u * 6.5, u * 18]], shade(wh, -0.04), true); dot(c, s ? W - u * 10.4 : u * 10.4, u * 10.8, u * 1.8, mix(skyOut(v, p)[0], wh, 0.25)); }
    box(c, 0, 0, W, u * 4.6, shade(wh, -0.2)); box(c, 0, u * 4.2, W, u * 3, wh); box(c, 0, u * 7.2, W, u * 0.6, 'rgba(0,0,0,0.12)');
    for (i = 0; i * u * 3.6 < W; i++) dot(c, i * u * 3.6 + u * 1.8, u * 7.3, u * 1.7, i % 2 ? wh : shade(wh, -0.06));
    bulbs(c, u * 6, u * 10, W - u * 6, u * 10, u * 3.6, Math.max(7, Math.round(W / (u * 8))), u, o, t, pt > 0);
    basket(c, u * 20, u * 23, u * 7, q, t, wd); basket(c, W - u * 20, u * 21, u * 7, q, t, wd);
    var cx = W - u * 32, sw = Math.sin(t * 1.2) * 0.06; L(c, cx, u * 7.5, cx, u * 12, u * 0.25, '#5a5560'); Rn(c, cx - u * 2.6, u * 12, u * 5.2, u * 1, u * 0.5, wd);
    for (i = 0; i < 4; i++) { c.save(); c.translate(cx + (i - 1.5) * u * 1.4, u * 13); c.rotate(sw * (1 + i * 0.3) * (i % 2 ? 1 : -1)); box(c, -u * 0.35, 0, u * 0.7, u * (5 + (i * 7 % 4)), near('#c9ccd4', v)); c.restore(); }
    /* the rocking chair, the dog, lemonade, boots and a fern */
    rocker(c, u * 21, fl + u * 12, u * 33, wh, q.accent, t); pillow(c, u * 21, fl - u * 9, u * 9, 0.1, q.gold, q.paper, 1);
    var tbx = W - u * 20, tby = fl + u * 9; box(c, tbx - u * 0.6, tby - u * 12, u * 1.2, u * 12, shade(wd, -0.15)); ell(c, tbx, tby, u * 4, u * 1, shade(wd, -0.2)); ell(c, tbx, tby - u * 12.4, u * 7.4, u * 1.8, wd); ell(c, tbx, tby - u * 12.9, u * 7.4, u * 1.7, shade(wd, 0.14));
    Rn(c, tbx - u * 4.6, tby - u * 20.4, u * 5, u * 7.6, u * 1, 'rgba(255,255,255,0.5)'); Rn(c, tbx - u * 4.2, tby - u * 18.2, u * 4.2, u * 5, u * 0.8, near('#ffe27a', v)); dot(c, tbx - u * 2.2, tby - u * 16, u * 1.2, near('#fff3a8', v)); c.beginPath(); c.arc(tbx + u * 0.6, tby - u * 17, u * 1.5, -PI / 2, PI / 2); c.lineWidth = u * 0.5; c.strokeStyle = 'rgba(255,255,255,0.6)'; c.stroke();
    Rn(c, tbx + u * 2.4, tby - u * 16.6, u * 2.6, u * 3.8, u * 0.5, 'rgba(255,255,255,0.5)'); box(c, tbx + u * 2.6, tby - u * 15, u * 2.2, u * 2, near('#ffe27a', v));
    plant(c, W - u * 9, fl + u * 20, u * 26, q, t, 0);
    dog(c, W - u * 34, fl + u * 21, u * 19, near(mix('#c98a4a', p.gold, 0.2), v), t, 2);
    boots(c, u * 37, fl + u * 7, u * 7, q.gold);
    lantern(c, u * 5, fl + u * 22, u * 12, t, pt > 0, near('#3a3440', v));
  }, { variants: ['day', 'dusk', 'night'], stage: 'cast-low' });

  /* ---------- cabin: inside a log cabin, the fire lit (day, night) ---------- */
  add('cabin', function (c, W, H, t, p, o, u) {
    var v = o.variant, pt = part(v), pp = pt ? dimPal(p, 0.36) : p, fl = H * 0.665, i, j, R0 = rnd(o.seed + 'cabin'), lg = mix('#b9824e', pp.bg, 0.24), wd = woodc(pp), lh = u * 7.4, fk = 0.7 + 0.18 * Math.sin(t * 5) + 0.12 * Math.sin(t * 11.3);
    /* the log wall */
    box(c, 0, 0, W, fl, lg);
    for (j = 0; j * lh < fl; j++) { var y = j * lh; box(c, 0, y, W, lh * 0.3, shade(lg, 0.1)); box(c, 0, y + lh * 0.8, W, lh * 0.2, shade(lg, -0.26)); for (i = 0; i < 3; i++) { box(c, R0() * W, y + lh * (0.4 + R0() * 0.25), u * (5 + R0() * 9), Math.max(1, u * 0.28), shade(lg, -0.12)); if (i === 0) { var kx = R0() * W; ell(c, kx, y + lh * 0.52, u * 1.5, u * 0.8, shade(lg, -0.2)); ell(c, kx, y + lh * 0.52, u * 0.7, u * 0.35, shade(lg, -0.34)); } } }
    box(c, 0, 0, W, u * 4.8, shade(wd, -0.34)); box(c, 0, u * 4.8, W, u * 0.8, 'rgba(0,0,0,0.16)');
    planks(c, W, fl, H, mix(floorc(pp), '#8a5a34', 0.3), u, 6);
    rug(c, W * 0.47, fl + (H - fl) * 0.56, W * 0.34, (H - fl) * 0.27, pp.accent, pp.gold, u);
    /* the window on the pines */
    var wx = u * 9.5, wy = H * 0.105, ww = u * 24, wh = u * 27;
    windowAt(c, wx, wy, ww, wh, v, p, t, o, u, 'pines', 2, 2, false, { paper: shade(wd, 0.12) });
    Rn(c, wx - u * 7, wy - u * 4.6, ww + u * 14, u * 1.3, u * 0.65, shade(wd, -0.3));
    for (i = 0; i < 2; i++) { var cxx = i ? wx + ww + u * 6 : wx - u * 6, d = i ? -1 : 1; curtain(c, cxx, wy - u * 3.6, u * 8, wh + u * 8, pp.accent, d, u, pp.gold); c.fillStyle = alpha(pp.paper, 0.3); for (j = 1; j < 6; j++) c.fillRect(d > 0 ? cxx : cxx - u * 5, wy - u * 3.6 + j * (wh + u * 8) / 6, u * 5, u * 0.7); }
    /* the stone chimney, right */
    var fx = W - u * 38, fw = u * 35, st = mix('#a59d94', pp.bg2, 0.2), my = fl - u * 36, ry = 0;
    box(c, fx, 0, fw, fl, shade(st, -0.34));
    for (j = 0; ry < fl; j++) { var rh = u * (5.4 + R0() * 2), sxx = fx - R0() * u * 4; while (sxx < fx + fw) { var sw = u * (6 + R0() * 6), a0 = Math.max(fx, sxx) + u * 0.35, a1 = Math.min(fx + fw, sxx + sw) - u * 0.35; if (a1 - a0 > u * 1.5) Rn(c, a0, ry + u * 0.35, a1 - a0, Math.min(rh, fl - ry) - u * 0.5, u * 1.5, shade(st, (R0() - 0.5) * 0.3)); else R0(); sxx += sw; } ry += rh; }
    var bx0 = fx + u * 6.5, bw = fw - u * 13, bt = fl - u * 25;
    c.beginPath(); c.moveTo(bx0, fl); c.lineTo(bx0, bt + bw * 0.3); c.quadraticCurveTo(bx0, bt, bx0 + bw / 2, bt); c.quadraticCurveTo(bx0 + bw, bt, bx0 + bw, bt + bw * 0.3); c.lineTo(bx0 + bw, fl); c.closePath(); c.lineWidth = u * 3; c.strokeStyle = shade(st, 0.16); c.stroke(); c.fillStyle = '#241a20'; c.fill();
    Rn(c, fx - u * 3, fl - u * 1.2, fw + u * 6, u * 4.4, u * 1, shade(st, 0.1)); box(c, fx - u * 3, fl + u * 2.4, fw + u * 6, u * 0.8, 'rgba(0,0,0,0.14)');
    Rn(c, fx - u * 2.6, my, fw + u * 5.2, u * 3.6, u * 0.9, shade(wd, -0.06)); box(c, fx - u * 2.6, my + u * 3.6, fw + u * 5.2, u * 0.9, 'rgba(0,0,0,0.2)'); box(c, fx - u * 2.6, my + u * 0.5, fw + u * 5.2, u * 0.5, shade(wd, 0.18));
    picture(c, fx + fw / 2 - u * 8, my - u * 17, u * 16, u * 12, u, pp, 0, t);
    lantern(c, fx + u * 4.6, my, u * 9, t, pt > 0, '#3a3440');
    Rn(c, fx + fw - u * 9.4, my - u * 5, u * 6.2, u * 5, u * 1.2, pp.accent2); dot(c, fx + fw - u * 6.3, my - u * 2.5, u * 1.9, pp.paper); L(c, fx + fw - u * 6.3, my - u * 2.5, fx + fw - u * 6.3 + Math.cos(t * 0.1 - 1) * u * 1.3, my - u * 2.5 + Math.sin(t * 0.1 - 1) * u * 1.3, u * 0.3, pp.ink); L(c, fx + fw - u * 6.3, my - u * 2.5, fx + fw - u * 5.5, my - u * 3.2, u * 0.3, pp.ink);
    for (i = 0; i < 3; i++) { K.pine(c, fx + fw / 2 - u * 3 + i * u * 3, my, u * (3.4 + (i % 2) * 1.4), mix(pp.accent2, '#3f8a5a', 0.4), null, 2); }
    /* firewood, the armchair with its blanket, boots by the hearth */
    var lx0 = fx - u * 14, lb = fl + u * 3;
    for (j = 0; j < 3; j++) for (i = 0; i < 4 - j; i++) { var lcx = lx0 + u * 2 + (i + j * 0.5) * u * 3.7, lcy = lb - u * 1.9 - j * u * 3.2, lc = j % 2 ? wd : shade(wd, -0.1); dot(c, lcx, lcy, u * 1.9, shade(lc, -0.3)); dot(c, lcx, lcy, u * 1.5, mix(lc, '#f0d0a0', 0.5)); dot(c, lcx, lcy, u * 0.7, mix(lc, '#f0d0a0', 0.25)); }
    armchair(c, -u * 3, fl + u * 6, u * 32, u, pp.accent2, pp);
    Rn(c, u * 20.6, fl - u * 14.4, u * 9.4, u * 15, u * 2, pp.accent); c.fillStyle = alpha(pp.paper, 0.4); for (i = 0; i < 3; i++) { c.fillRect(u * 20.6, fl - u * 11.4 + i * u * 4, u * 9.4, u * 0.9); c.fillRect(u * 22.4 + i * u * 2.9, fl - u * 14.4, u * 0.9, u * 15); } for (i = 0; i < 5; i++) box(c, u * 21.2 + i * u * 1.9, fl + u * 0.6, u * 0.6, u * 1.6, pp.accent);
    pillow(c, u * 11, fl - u * 13, u * 10, -0.12, pp.gold, pp.paper, 2);
    dog(c, fx - u * 4, fl + (H - fl) * 0.5, u * 19, mix('#9a6a48', pp.gold, 0.2), t, 0);
    /* a lantern from the beam */
    var hx = W * 0.4, hl = u * 8; L(c, hx, u * 4.8, hx, hl, u * 0.3, '#3a3440'); lantern(c, hx, hl + u * 8.4, u * 9, t, true, '#3a3440');
    /* the fire, always lit */
    var fcx = bx0 + bw / 2, fb = fl - u * 1.6;
    glow(c, fcx, fb - u * 5, u * (pt ? 54 : 30), '#ff9a3a', (pt ? 0.46 : 0.22) * fk); glow(c, fcx, fb - u * 4, bw * 0.7, '#ffb347', 0.7 * fk);
    ell(c, fcx - u * 3.4, fb, u * 6.4, u * 1.7, '#5a3a22', 0.14); ell(c, fcx + u * 3.6, fb, u * 6.2, u * 1.7, '#6a4426', -0.16); dot(c, fcx - u * 9.2, fb - u * 0.9, u * 1.5, '#b9824e'); dot(c, fcx + u * 9.2, fb - u * 1, u * 1.5, '#b9824e');
    flame(c, fcx - u * 4, fb - u * 0.8, u * 5.4, u * 9, t, 0.3); flame(c, fcx + u * 3.6, fb - u * 0.8, u * 5, u * 8, t, 2.1); flame(c, fcx, fb - u * 1.2, u * 7, u * 13, t, 4.2);
    for (i = 0; i < 6; i++) { var ef = frac(t * (0.25 + i * 0.04) + i * 0.37); dot(c, fcx + Math.sin(i * 2.4 + ef * 4) * bw * 0.3, fb - u * 4 - ef * u * 15, u * 0.35, alpha('#ffd98a', 1 - ef)); }
    if (pt) { ell(c, fcx, fl + u * 7, u * 30, u * 6, alpha('#ff9a3a', 0.14 * fk)); glow(c, hx, hl + u * 4, u * 26, WARM, 0.3); }
    else { c.fillStyle = alpha('#fff6d0', 0.1); c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx + ww, wy + wh); c.lineTo(wx + ww + u * 32, H); c.lineTo(wx + u * 12, H); c.closePath(); c.fill(); }
  }, { variants: ['day', 'night'], stage: 'cast-low' });

  /* ---------- bedroom: a cosy bedroom (morning, night) ---------- */
  add('bedroom', function (c, W, H, t, p, o, u) {
    var v = o.variant, pt = part(v), pp = pt ? dimPal(p, 0.4) : p, fl = H * 0.665, i, j, wd = woodc(pp), R0 = rnd(o.seed + 'bed');
    grad(c, 0, 0, W, fl, [shade(pp.bg, 0.1), pp.bg]);
    c.fillStyle = alpha(pp.snow, 0.1); c.beginPath(); for (j = 0; j * u * 9 < fl; j++) for (i = 0; i * u * 9 < W + u * 9; i++) { var dx = i * u * 9 + (j % 2) * u * 4.5, dy = j * u * 9 + u * 3; c.moveTo(dx + u * 0.9, dy); c.arc(dx, dy, u * 0.9, 0, TAU); } c.fill();
    box(c, 0, fl - u * 3.2, W, u * 3.2, pp.paper); box(c, 0, fl - u * 3.2, W, u * 0.6, shade(pp.paper, -0.14));
    planks(c, W, fl, H, floorc(pp), u, 6);
    rug(c, W * 0.56, fl + (H - fl) * 0.58, W * 0.3, (H - fl) * 0.25, mix(pp.accent, pp.paper, 0.3), pp.paper, u);
    /* the window, right, over a chest of drawers */
    var wx = W - u * 32, wy = H * 0.1, ww = u * 22, wh = u * 32, cu = shade(pp.accent2, 0.3);
    windowAt(c, wx, wy, ww, wh, v, p, t, o, u, 'garden', 2, 3, false, pp);
    Rn(c, wx - u * 7.5, wy - u * 4.8, ww + u * 15, u * 1.3, u * 0.65, pp.gold); dot(c, wx - u * 7.5, wy - u * 4.15, u * 1.2, pp.gold); dot(c, wx + ww + u * 7.5, wy - u * 4.15, u * 1.2, pp.gold);
    curtain(c, wx - u * 6.5, wy - u * 3.6, u * 8.5, wh + u * 8, cu, 1, u, pp.gold); curtain(c, wx + ww + u * 6.5, wy - u * 3.6, u * 8.5, wh + u * 8, cu, -1, u, pp.gold);
    var dx0 = W - u * 31, dw = u * 29, dt = fl - u * 21;
    box(c, dx0 + u * 2, fl, u * 2, u * 2.4, shade(wd, -0.3)); box(c, dx0 + dw - u * 4, fl, u * 2, u * 2.4, shade(wd, -0.3));
    Rn(c, dx0, dt, dw, fl - dt + u * 0.6, u * 1.2, wd); for (i = 0; i < 3; i++) { Rn(c, dx0 + u * 1.6, dt + u * 2.4 + i * u * 6.2, dw - u * 3.2, u * 5.2, u * 0.7, shade(wd, 0.16)); dot(c, dx0 + dw * 0.3, dt + u * 5 + i * u * 6.2, u * 0.8, pp.gold); dot(c, dx0 + dw * 0.7, dt + u * 5 + i * u * 6.2, u * 0.8, pp.gold); }
    Rn(c, dx0 - u * 1, dt - u * 0.6, dw + u * 2, u * 1.8, u * 0.8, shade(wd, 0.1));
    plant(c, dx0 + u * 5, dt - u * 0.6, u * 11, pp, t, 1); picture(c, dx0 + u * 11.5, dt - u * 9.4, u * 6.4, u * 7.6, u, pp, 1, t);
    Rn(c, dx0 + u * 20, dt - u * 2.2, u * 7.4, u * 1.6, u * 0.4, pp.accent2); Rn(c, dx0 + u * 20.6, dt - u * 3.8, u * 6.4, u * 1.6, u * 0.4, pp.gold); Rn(c, dx0 + u * 20.2, dt - u * 5.4, u * 6.8, u * 1.6, u * 0.4, pp.accent);
    /* on the wall over the bed: a shelf, pictures, a string of little lights */
    var shy = fl - u * 55; Rn(c, u * 3, shy, u * 26, u * 1.3, u * 0.5, wd); box(c, u * 6, shy + u * 1.3, u * 1, u * 2.6, shade(wd, -0.2)); box(c, u * 25, shy + u * 1.3, u * 1, u * 2.6, shade(wd, -0.2));
    var be = books(c, u * 4.4, shy, u * 12, u * 8, u, pp, R0); plant(c, be + u * 9, shy, u * 9, pp, t, 2, pp.paper);
    Rn(c, be + u * 1, shy - u * 4.6, u * 4.6, u * 4.6, u * 1.4, pp.accent); dot(c, be + u * 3.3, shy - u * 2.3, u * 1.6, pp.paper); L(c, be + u * 3.3, shy - u * 2.3, be + u * 3.3 + Math.cos(t * 0.1) * u * 1, shy - u * 2.3 + Math.sin(t * 0.1) * u * 1, u * 0.3, pp.ink); dot(c, be + u * 1.8, shy - u * 4.9, u * 0.9, pp.gold); dot(c, be + u * 4.8, shy - u * 4.9, u * 0.9, pp.gold);
    picture(c, u * 33, fl - u * 60, u * 10, u * 12, u, pp, 2, t); picture(c, u * 35, fl - u * 43, u * 8, u * 8, u, pp, 3, t);
    bulbs(c, -u * 2, H * 0.05, u * 50, H * 0.075, u * 3, 8, u * 0.75, o, t, pt > 0);
    /* the bed */
    var by = fl + u * 6, qx = u * 17, qw = u * 33, qy = by - u * 20, qh = u * 15, qc = [pp.accent, pp.gold, pp.accent2, pp.paper, shade(pp.accent, 0.35), shade(pp.accent2, 0.3)];
    c.save(); c.translate(0, by); c.scale(1.14, 1.14); c.translate(0, -by);
    box(c, u * 3, by - u * 3, u * 2.4, u * 3, shade(wd, -0.3)); box(c, u * 47, by - u * 3, u * 2.4, u * 3, shade(wd, -0.3)); ell(c, u * 26, by, u * 28, u * 1.3, 'rgba(0,0,0,0.14)');
    Rn(c, -u * 4, by - u * 42, u * 13, u * 40, u * 5.5, wd); Rn(c, -u * 2, by - u * 39.4, u * 9, u * 30, u * 4, shade(wd, 0.14));
    Rn(c, u * 1.5, by - u * 10, u * 50, u * 7.4, u * 1.6, wd); Rn(c, u * 3, by - u * 18.4, u * 47, u * 9.6, u * 3.4, pp.paper); box(c, u * 4.5, by - u * 10.6, u * 44, u * 0.7, shade(pp.paper, -0.16));
    Rn(c, u * 4.6, by - u * 25.4, u * 15, u * 8.6, u * 4, shade(pp.paper, -0.1)); Rn(c, u * 5.6, by - u * 26.6, u * 15, u * 8.6, u * 4, mix(pp.paper, '#ffffff', 0.5));
    teddy(c, u * 12.6, by - u * 18.2, u * 13, mix('#c08a52', pp.gold, 0.2));
    c.save(); K.rrp(c, qx, qy, qw, qh, u * 3.2); c.clip(); for (j = 0; j < 3; j++) for (i = 0; i < 7; i++) box(c, qx + i * u * 5, qy + j * u * 5, u * 5 + 1, u * 5 + 1, qc[(i * 2 + j * 5) % 6]); c.fillStyle = 'rgba(255,255,255,0.35)'; for (j = 0; j < 3; j++) for (i = 0; i < 7; i++) { c.fillRect(qx + i * u * 5 + u * 2.2, qy + j * u * 5 + u * 1.2, u * 0.6, u * 2.6); c.fillRect(qx + i * u * 5 + u * 1.2, qy + j * u * 5 + u * 2.2, u * 2.6, u * 0.6); } box(c, qx, qy + qh - u * 2, qw, u * 2, 'rgba(0,0,0,0.12)'); c.restore();
    Rn(c, qx - u * 1.4, qy - u * 1, u * 4.6, qh * 0.62, u * 2, mix(pp.paper, '#ffffff', 0.5));
    Rn(c, u * 47.5, by - u * 23, u * 5, u * 21, u * 2.2, wd); Rn(c, u * 48.4, by - u * 22, u * 3.2, u * 6, u * 1.4, shade(wd, 0.16));
    c.restore();
    for (i = 0; i < 2; i++) { ell(c, u * (27 + i * 5.4), fl + u * 10.6, u * 2.4, u * 1.2, shade(pp.accent2, -0.2)); ell(c, u * (26.6 + i * 5.4), fl + u * 10, u * 2.4, u * 1.2, pp.accent2); ell(c, u * (25.6 + i * 5.4), fl + u * 9.9, u * 1.3, u * 0.8, shade(pp.accent2, 0.35)); }
    /* the bedside table and its lamp */
    var nx = u * 60, nb = fl + u * 4, nt = nb - u * 17, ns = 0.82;
    c.save(); c.translate(nx, nb); c.scale(ns, ns); c.translate(-nx, -nb);
    box(c, nx + u * 1, nb - u * 2, u * 1.4, u * 2, shade(wd, -0.3)); box(c, nx + u * 9.6, nb - u * 2, u * 1.4, u * 2, shade(wd, -0.3));
    Rn(c, nx, nt, u * 12, u * 15.4, u * 1, wd); Rn(c, nx + u * 1.2, nt + u * 2.4, u * 9.6, u * 5, u * 0.6, shade(wd, 0.16)); dot(c, nx + u * 6, nt + u * 4.9, u * 0.8, pp.gold); Rn(c, nx - u * 0.8, nt - u * 0.6, u * 13.6, u * 1.7, u * 0.8, shade(wd, 0.1));
    ell(c, nx + u * 4.4, nt - u * 0.8, u * 2.4, u * 0.8, shade(pp.accent, -0.2)); Rn(c, nx + u * 3.2, nt - u * 6.4, u * 2.4, u * 5.6, u * 1.2, pp.accent); lampShade(c, nx + u * 4.4, nt - u * 12.6, u * 8.6, u * 6.4, mix(pp.paper, pp.gold, 0.3), pt > 0);
    mug(c, nx + u * 10, nt - u * 0.6, u * 2.6, pp.accent2, t);
    c.restore();
    if (pt) {
      glow(c, nx + u * 4.4 * ns, nb - u * 25 * ns, u * 38, WARM, 0.44); lampShade(c, nx + u * 4.4 * ns, nb - u * 29.6 * ns, u * 8.6 * ns, u * 6.4 * ns, mix(p.paper, p.gold, 0.3), true);
      c.fillStyle = alpha('#cfe0ff', 0.08); c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx + ww, wy + wh); c.lineTo(wx + ww - u * 16, H); c.lineTo(wx - u * 34, H); c.closePath(); c.fill();
      for (i = 0; i < 9; i++) { var gx = W * (0.06 + R0() * 0.5), gy = H * (0.1 + R0() * 0.14), tw = 0.6 + 0.4 * Math.sin(t * (0.8 + R0() * 1.4) + i); c.globalAlpha = 0.5 * tw; if (i % 3) { starPath(c, gx, gy, u * 1.3, u * 0.55, 5, R0()); c.fillStyle = '#eaffc0'; c.fill(); } else { R0(); K.crescent(c, gx, gy, u * 1.5, '#eaffc0'); } } c.globalAlpha = 1;
    } else {
      c.fillStyle = alpha('#fff3c4', 0.14); c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + ww, wy); c.lineTo(wx + ww - u * 20, H); c.lineTo(wx - u * 44, H); c.closePath(); c.fill();
    }
  }, { variants: ['morning', 'night'], stage: 'cast-low' });

  /* ---------- backyard: fence, the big tree, the grill corner (day, dusk, night) ---------- */
  function canopy(c, blobs, u, H, lf, t) { /* blobs: [x in u, y as a part of H, r in u]; a lighter dab on each */
    var i, b; for (i = 0; i < blobs.length; i++) { b = blobs[i]; dot(c, b[0], H * b[1], u * b[2], i % 2 ? lf : shade(lf, -0.12)); }
    for (i = 0; i < blobs.length; i++) { b = blobs[i]; dot(c, b[0] - u * b[2] * 0.25 + Math.sin(t * 0.7 + i) * u * 0.3, H * b[1] - u * b[2] * 0.3, u * b[2] * 0.5, shade(lf, 0.14)); }
  }
  add('backyard', function (c, W, H, t, p, o, u) {
    var v = o.variant, pt = part(v), gy = H * 0.625, q = tintPal(p, v), i, j, R0 = rnd(o.seed + 'yard'), gr = near(mix('#7ccb6a', p.accent2, 0.32), v), fc = near(mix('#e0bd8e', p.bg2, 0.22), v), tr = near(mix('#8a5a34', p.bg2, 0.12), v), lf = near(mix('#4fa860', p.accent2, 0.38), v), far = land(mix('#5fae6c', p.accent2, 0.3), v), ft = H * 0.5, pw = u * 4.4;
    grad(c, 0, 0, W, gy, skyOut(v, p));
    lights(c, 0, H * 0.03, W, gy, v, t, o, u, W * (pt === 1 ? 0.56 : 0.64), H * 0.16, u * 6, H * 0.5);
    /* over the fence: treetops and the neighbours */
    for (i = 0; i < 9; i++) dot(c, W * (i / 8) + (R0() - 0.5) * u * 6, ft + u * (1 + R0() * 3), u * (7 + R0() * 5), i % 2 ? far : shade(far, -0.1));
    cottage(c, W * 0.58, ft + u * 6, u * 19, land('#f3e6d2', v), land(mix('#c8553f', p.accent, 0.4), v), pt ? WARM : '#dff1ff', land('#7a4a34', v)); if (pt) glow(c, W * 0.58 + u * 9.5, ft, u * 12, WARM, 0.22);
    /* the fence */
    box(c, 0, ft + u * 4.6, W, u * 1.5, shade(fc, -0.24)); box(c, 0, gy - u * 4.4, W, u * 1.5, shade(fc, -0.24));
    for (i = 0; i * pw < W; i++) { var x = i * pw; Pg(c, [[x + u * 0.3, gy + u], [x + u * 0.3, ft + u * 2], [x + pw / 2, ft], [x + pw - u * 0.3, ft + u * 2], [x + pw - u * 0.3, gy + u]], i % 2 ? fc : shade(fc, 0.07), true); dot(c, x + pw / 2, ft + u * 5.3, u * 0.3, shade(fc, -0.3)); dot(c, x + pw / 2, gy - u * 3.7, u * 0.3, shade(fc, -0.3)); }
    /* the lawn */
    grad(c, 0, gy, W, H - gy, [shade(gr, 0.14), gr, shade(gr, -0.22)]);
    c.fillStyle = alpha(pt === 2 ? '#8aa0ff' : '#ffffff', 0.06); for (i = 0; i < 6; i += 2) { var ya = gy + (H - gy) * Math.pow(i / 6, 1.4), yb = gy + (H - gy) * Math.pow((i + 1) / 6, 1.4); c.fillRect(0, ya, W, yb - ya); }
    box(c, 0, gy, W, u * 1, 'rgba(0,0,0,0.1)');
    for (i = 0; i < 16; i++) { var bx = (i + 0.2 + R0() * 0.6) / 16 * W, bs = u * (1.5 + R0() * 1), bh = u * (3 + R0() * 4), bc = [q.accent, q.gold, q.paper, near('#ff9ab8', v)][i % 4]; L(c, bx, gy + u * 1.4, bx + Math.sin(t * 1.2 + i) * u * 0.3, gy + u * 1.4 - bh, u * 0.4, shade(gr, -0.3)); leaf(c, bx, gy + u * 1, bh * 0.6, -PI / 2 - 0.7, shade(gr, -0.14)); leaf(c, bx, gy + u * 1, bh * 0.6, -PI / 2 + 0.7, shade(gr, -0.06)); K.flower(c, bx + Math.sin(t * 1.2 + i) * u * 0.3, gy + u * 1.4 - bh, bs, bc, near('#ffd54a', v), i); }
    for (i = 0; i < 30; i++) { var dx = R0() * W, dy = gy + u * 5 + R0() * (H - gy - u * 6), ds = u * (0.35 + (dy - gy) / (H - gy) * 0.5); if (i % 3) { dot(c, dx, dy, ds * 1.5, q.paper); dot(c, dx, dy, ds * 0.7, near('#ffd54a', v)); } else { L(c, dx, dy, dx - ds * 1.4, dy - ds * 4, ds * 0.7, shade(gr, -0.2)); L(c, dx, dy, dx + ds * 1.2, dy - ds * 4.4, ds * 0.7, shade(gr, 0.12)); L(c, dx, dy, dx, dy - ds * 5, ds * 0.7, shade(gr, -0.1)); } }
    /* the string of bulbs from the tree to the pole */
    box(c, W - u * 5, H * 0.07, u * 1.5, gy + u * 9 - H * 0.07, tr); dot(c, W - u * 4.25, H * 0.07, u * 1.3, tr);
    bulbs(c, u * 12, H * 0.07, W - u * 4.2, H * 0.078, u * 3, Math.max(7, Math.round(W / (u * 9))), u, o, t, pt > 0);
    /* the big tree and its tyre swing */
    var tb = H * 0.72, bxs = u * 28, bys = H * 0.215, an = Math.sin(t * 0.9) * 0.07, len = H * 0.335, ex = bxs + Math.sin(an) * len, ey = bys + Math.cos(an) * len;
    ell(c, u * 10, tb, u * 13, u * 2, 'rgba(0,0,0,0.14)');
    c.beginPath(); c.moveTo(u * 8, H * 0.3); c.quadraticCurveTo(u * 22, H * 0.2, u * 38, H * 0.205); c.lineWidth = u * 2.8; c.lineCap = 'round'; c.strokeStyle = tr; c.stroke();
    Pg(c, [[-u * 1, tb], [u * 4, tb - u * 6], [u * 5.5, H * 0.3], [u * 3, 0], [u * 15, 0], [u * 13, H * 0.3], [u * 15, tb - u * 6], [u * 21, tb]], tr, true);
    c.strokeStyle = shade(tr, -0.2); c.lineWidth = u * 0.5; for (i = 0; i < 6; i++) { c.beginPath(); c.moveTo(u * (6.5 + (i % 3) * 2.4), H * (0.3 + i * 0.065)); c.quadraticCurveTo(u * (7.4 + (i % 3) * 2.4), H * (0.33 + i * 0.065), u * (6.5 + (i % 3) * 2.4), H * (0.36 + i * 0.065)); c.stroke(); }
    ell(c, u * 9.6, H * 0.47, u * 2.2, u * 3, shade(tr, -0.4));
    canopy(c, [[-u * 2, 0.05, 17], [u * 15, 0.025, 15], [u * 30, 0.05, 12], [u * 4, 0.15, 13], [u * 22, 0.13, 11], [u * 40, 0.085, 8.5], [-u * 4, 0.22, 10], [u * 34, 0.15, 7]], u, H, lf, t);
    L(c, bxs, bys, ex, ey - u * 4.6, u * 0.6, near('#d9c39a', v)); c.beginPath(); c.arc(ex, ey, u * 4.6, 0, TAU); c.lineWidth = u * 2.8; c.strokeStyle = near('#3a3640', v); c.stroke(); c.beginPath(); c.arc(ex, ey, u * 5.6, PI * 1.15, PI * 1.6); c.lineWidth = u * 0.5; c.strokeStyle = 'rgba(255,255,255,0.3)'; c.stroke();
    /* a bird house on the fence */
    var hx = W * 0.5 + u * 4; box(c, hx - u * 0.6, ft - u * 5, u * 1.2, u * 7, tr); Rn(c, hx - u * 3.4, ft - u * 11.6, u * 6.8, u * 7, u * 0.8, q.accent2); Pg(c, [[hx - u * 4.6, ft - u * 11], [hx, ft - u * 15.4], [hx + u * 4.6, ft - u * 11]], q.accent, true); dot(c, hx, ft - u * 8.4, u * 1.4, near('#3a2a2e', v)); box(c, hx - u * 0.3, ft - u * 6.4, u * 0.6, u * 1.6, tr);
    /* the grill corner */
    var gx = W - u * 18, gb = H * 0.745, gk = near('#2f2a36', v);
    ell(c, gx, gb, u * 9, u * 1.5, 'rgba(0,0,0,0.16)'); L(c, gx - u * 4.4, gb - u * 9, gx - u * 6.4, gb, u * 0.8, gk); L(c, gx + u * 4.4, gb - u * 9, gx + u * 6.4, gb - u * 1, u * 0.8, gk); L(c, gx, gb - u * 8, gx, gb - u * 1.4, u * 0.8, gk); dot(c, gx + u * 6.4, gb - u * 1, u * 1.4, gk); L(c, gx - u * 5.4, gb - u * 4, gx + u * 5.4, gb - u * 4, u * 0.5, gk);
    c.beginPath(); c.ellipse(gx, gb - u * 12, u * 8.4, u * 6.4, 0, 0, PI); c.fillStyle = gk; c.fill(); c.beginPath(); c.ellipse(gx, gb - u * 12.6, u * 8.4, u * 6.6, 0, PI, TAU); c.fillStyle = q.accent; c.fill(); box(c, gx - u * 8.6, gb - u * 13, u * 17.2, u * 1.2, near('#c9ccd4', v));
    c.beginPath(); c.arc(gx, gb - u * 18.6, u * 1.6, PI, 0); c.lineWidth = u * 0.7; c.strokeStyle = gk; c.stroke(); c.beginPath(); c.ellipse(gx - u * 3, gb - u * 16.4, u * 2.4, u * 1.4, -0.5, PI, TAU); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fill();
    Rn(c, gx + u * 8.4, gb - u * 13.4, u * 6, u * 1.1, u * 0.5, tr); K.smoke(c, gx + u * 3, gb - u * 20, u * 4, t);
    if (pt) glow(c, gx, gb - u * 12, u * 13, '#ff9a3a', 0.4);
    var kx = W - u * 36, kb = gb + u * 2; ell(c, kx + u * 5, kb, u * 6.4, u * 1.1, 'rgba(0,0,0,0.14)'); Rn(c, kx, kb - u * 6.4, u * 10, u * 6.4, u * 1, q.accent2); Rn(c, kx - u * 0.5, kb - u * 8.4, u * 11, u * 2.6, u * 1, q.paper); c.beginPath(); c.arc(kx + u * 5, kb - u * 8.4, u * 2.2, PI, 0); c.lineWidth = u * 0.6; c.strokeStyle = shade(q.paper, -0.3); c.stroke();
    /* a ball, a picnic blanket and its basket */
    var blx = u * 30, bly = H * 0.79; ell(c, blx, bly + u * 3.6, u * 4.2, u * 0.9, 'rgba(0,0,0,0.14)'); dot(c, blx, bly, u * 3.8, q.paper); for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(blx, bly); c.arc(blx, bly, u * 3.8, i * TAU / 3 + 0.4, i * TAU / 3 + 0.4 + TAU / 6); c.closePath(); c.fillStyle = [q.accent, q.gold, q.accent2][i]; c.fill(); } dot(c, blx - u * 1.2, bly - u * 1.4, u * 1, 'rgba(255,255,255,0.4)');
    var pb = [[u * 3, H * 0.905], [u * 40, H * 0.89], [u * 47, H * 0.985], [-u * 3, H]];
    c.save(); c.beginPath(); c.moveTo(pb[0][0], pb[0][1]); for (i = 1; i < 4; i++) c.lineTo(pb[i][0], pb[i][1]); c.closePath(); c.fillStyle = q.paper; c.fill(); c.clip(); c.fillStyle = alpha(q.accent, 0.5); for (i = -1; i < 12; i++) { c.beginPath(); c.moveTo(u * (3 + i * 5), H * 0.88); c.lineTo(u * (5.4 + i * 5), H * 0.88); c.lineTo(u * (3 + i * 6.4), H); c.lineTo(u * (0 + i * 6.4), H); c.closePath(); c.fill(); } for (j = 0; j < 4; j++) c.fillRect(-u * 4, H * (0.905 + j * 0.026), u * 54, H * 0.011); c.restore();
    var kbx = u * 12, kby = H * 0.935, wk = near(mix('#c99a5a', p.gold, 0.2), v); c.beginPath(); c.arc(kbx, kby - u * 6.4, u * 5, PI, 0); c.lineWidth = u * 0.9; c.strokeStyle = shade(wk, -0.2); c.stroke(); Rn(c, kbx - u * 6.4, kby - u * 7, u * 12.8, u * 7, u * 1.4, wk); c.fillStyle = shade(wk, -0.18); for (i = 0; i < 3; i++) c.fillRect(kbx - u * 6.4, kby - u * 5.6 + i * u * 2, u * 12.8, u * 0.5); Rn(c, kbx - u * 7, kby - u * 8, u * 14, u * 2, u * 0.8, shade(wk, 0.16)); Pg(c, [[kbx + u * 1, kby - u * 8], [kbx + u * 6.4, kby - u * 8], [kbx + u * 7.4, kby - u * 3.6], [kbx + u * 3, kby - u * 4.4]], q.accent, true);
    /* the sprinkler by day, fireflies after dark */
    if (!pt) { var spx = W * 0.62, spy = H * 0.93; box(c, spx - u * 2, spy - u * 0.6, u * 4, u * 1.2, near('#5a5560', v)); for (j = -1; j <= 1; j += 2) for (i = 0; i < 9; i++) { var f = frac(t * 0.7 + i / 9), ax = spx + j * f * u * 15 * (0.8 + 0.2 * Math.sin(t * 0.9)), ay = spy - Math.sin(f * PI) * u * 11; dot(c, ax, ay, u * (0.6 + 0.5 * f), alpha('#ffffff', 0.9 * (1 - f * 0.5))); dot(c, ax - j * u * 1.2, ay + u * 0.9, u * (0.4 + 0.3 * f), alpha('#dff4ff', 0.7 * (1 - f * 0.5))); } }
    else fireflies(c, W * 0.14, H * 0.5, W * 0.72, H * 0.36, pt === 2 ? 14 : 6, o.seed, t, u);
  }, { variants: ['day', 'dusk', 'night'], stage: 'band-low' });

  /* ---------- treehouse: the tree house in the big tree (day, dusk) ---------- */
  add('treehouse', function (c, W, H, t, p, o, u) {
    var v = o.variant, pt = part(v), gy = H * 0.645, q = tintPal(p, v), i, R0 = rnd(o.seed + 'tree'), gr = near(mix('#7ccb6a', p.accent2, 0.32), v), tr = near(mix('#8a5a34', p.bg2, 0.12), v), lf = near(mix('#4fa860', p.accent2, 0.38), v), pl = near(mix('#dcae76', p.bg2, 0.18), v), dk = near('#3a2a2e', v), py = H * 0.37;
    grad(c, 0, 0, W, gy + u * 2, skyOut(v, p));
    lights(c, 0, H * 0.03, W, gy, v, t, o, u, W * (pt === 1 ? 0.6 : 0.66), H * 0.2, u * 6, H * 0.57);
    K.hill(c, W, H, H * 0.55, u * 3, land(mix('#a6dc98', p.accent2, 0.25), v), o.seed + 'ta', 0.6); var f2 = K.hill(c, W, H, H * 0.595, u * 2.4, land(mix('#80c87e', p.accent2, 0.3), v), o.seed + 'tb', 0.9);
    for (i = 0; i < 5; i++) { var fx = W * (0.3 + i * 0.12) + R0() * u * 4; tree(c, fx, f2(fx) + u, u * (6 + R0() * 5), land(mix('#5fae6c', p.accent2, 0.3), v), land('#7a5230', v)); }
    var fg = K.hill(c, W, H, gy, u * 1.2, gr, o.seed + 'tc', 1.3); grad(c, 0, gy + u * 2, W, H - gy - u * 2, [alpha(shade(gr, -0.3), 0), alpha(shade(gr, -0.3), 0.45)]);
    /* the tree on the right: an owl in its hollow, a swing from its branch */
    var rb = H * 0.74, an = Math.sin(t * 1) * 0.06, sl = H * 0.3, sx0 = W - u * 30, sy0 = H * 0.285;
    c.beginPath(); c.moveTo(W - u * 6, H * 0.34); c.quadraticCurveTo(W - u * 20, H * 0.27, W - u * 36, H * 0.275); c.lineWidth = u * 2.4; c.lineCap = 'round'; c.strokeStyle = tr; c.stroke();
    Pg(c, [[W - u * 17, rb], [W - u * 12.5, rb - u * 5], [W - u * 11, H * 0.3], [W - u * 12.4, 0], [W - u * 1.4, 0], [W - u * 2, H * 0.3], [W - u * 1, rb - u * 5], [W + u * 3, rb]], tr, true);
    canopy(c, [[W - u * 3, 0.04, 16], [W - u * 20, 0.03, 12], [W - u * 33, 0.065, 8.5], [W + u * 2, 0.16, 11], [W - u * 15, 0.13, 9.5], [W - u * 27, 0.14, 6.5]], u, H, lf, t);
    var ox = W - u * 6.6, oy = H * 0.43, bl = frac(t * 0.19) < 0.03; ell(c, ox, oy, u * 3.4, u * 4.4, dk); ell(c, ox, oy + u * 1.2, u * 2.5, u * 3, near('#a07850', v)); Pg(c, [[ox - u * 2.3, oy - u * 0.4], [ox - u * 2, oy - u * 2.6], [ox - u * 0.6, oy - u * 1]], near('#a07850', v), true); Pg(c, [[ox + u * 2.3, oy - u * 0.4], [ox + u * 2, oy - u * 2.6], [ox + u * 0.6, oy - u * 1]], near('#a07850', v), true);
    if (bl) { box(c, ox - u * 1.7, oy + u * 0.1, u * 1.3, u * 0.3, dk); box(c, ox + u * 0.4, oy + u * 0.1, u * 1.3, u * 0.3, dk); } else { dot(c, ox - u * 1.05, oy + u * 0.2, u * 0.95, pt ? '#ffe98a' : '#fff'); dot(c, ox + u * 1.05, oy + u * 0.2, u * 0.95, pt ? '#ffe98a' : '#fff'); dot(c, ox - u * 1.05, oy + u * 0.2, u * 0.45, '#2b2118'); dot(c, ox + u * 1.05, oy + u * 0.2, u * 0.45, '#2b2118'); } Pg(c, [[ox - u * 0.4, oy + u * 1], [ox + u * 0.4, oy + u * 1], [ox, oy + u * 1.8]], near('#f2a23a', v), true);
    c.save(); c.translate(sx0, sy0); c.rotate(an); L(c, -u * 4, 0, -u * 4, sl, u * 0.5, near('#d9c39a', v)); L(c, u * 4, -u * 0.3, u * 4, sl, u * 0.5, near('#d9c39a', v)); Rn(c, -u * 6, sl, u * 12, u * 1.8, u * 0.6, q.accent); box(c, -u * 6, sl + u * 1.3, u * 12, u * 0.5, shade(q.accent, -0.25)); c.restore();
    var bhx = W - u * 12, bhy = H * 0.55; Rn(c, bhx - u * 3.2, bhy - u * 6.4, u * 6.4, u * 6.4, u * 0.8, q.gold); Pg(c, [[bhx - u * 4.4, bhy - u * 5.8], [bhx, bhy - u * 10], [bhx + u * 4.4, bhy - u * 5.8]], q.accent2, true); dot(c, bhx, bhy - u * 3.4, u * 1.3, dk); box(c, bhx - u * 0.3, bhy - u * 1.8, u * 0.6, u * 1.6, tr);
    /* the big tree on the left and the house in it */
    canopy(c, [[u * 2, 0.03, 17], [u * 20, 0.02, 15], [u * 34, 0.05, 12], [u * 46, 0.03, 8.5], [-u * 3, 0.15, 12], [u * 40, 0.125, 8], [u * 28, 0.115, 10]], u, H, shade(lf, -0.1), t);
    Pg(c, [[-u * 4, H * 0.75], [u * 3, H * 0.7], [u * 5, H * 0.3], [u * 3, 0], [u * 20, 0], [u * 18, H * 0.3], [u * 19, H * 0.7], [u * 27, H * 0.75]], tr, true);
    c.strokeStyle = shade(tr, -0.2); c.lineWidth = u * 0.5; for (i = 0; i < 6; i++) { c.beginPath(); c.moveTo(u * (7.5 + (i % 3) * 3.4), H * (0.4 + i * 0.05)); c.quadraticCurveTo(u * (8.6 + (i % 3) * 3.4), H * (0.425 + i * 0.05), u * (7.5 + (i % 3) * 3.4), H * (0.45 + i * 0.05)); c.stroke(); }
    L(c, u * 18, py + u * 15, u * 39, py + u * 2, u * 1.9, shade(pl, -0.3)); L(c, u * 6, py + u * 13, -u * 1, py + u * 2, u * 1.9, shade(pl, -0.3));
    var hx = u * 4, hw = u * 31, hh = u * 24, ht = py - hh;
    box(c, hx, ht, hw, hh, pl); c.fillStyle = shade(pl, -0.16); for (i = 1; i < 7; i++) c.fillRect(hx + i * hw / 7, ht, Math.max(1, u * 0.35), hh); c.fillStyle = shade(pl, 0.12); for (i = 0; i < 7; i += 2) c.fillRect(hx + i * hw / 7 + u * 0.4, ht, hw / 7 - u * 0.4, hh);
    c.save(); c.translate(hx + u * 21, ht + u * 19); c.rotate(-0.2); Rn(c, -u * 4, -u * 1.5, u * 8, u * 3, u * 0.4, shade(pl, 0.24)); dot(c, -u * 3, 0, u * 0.4, dk); dot(c, u * 3, 0, u * 0.4, dk); c.restore();
    Rn(c, hx + u * 3.6, py - u * 17, u * 10, u * 17, u * 5, dk); c.beginPath(); c.moveTo(hx + u * 3.6, py - u * 13); c.quadraticCurveTo(hx + u * 8.6, py - u * 17.5, hx + u * 13.6, py - u * 13); c.quadraticCurveTo(hx + u * 10, py - u * 8, hx + u * 11.4, py); c.lineTo(hx + u * 13.6, py); c.closePath(); c.fillStyle = q.accent2; c.fill();
    if (pt) glow(c, hx + u * 22, py - u * 13, u * 13, WARM, 0.5);
    dot(c, hx + u * 22, py - u * 13, u * 5.2, shade(pl, -0.3)); dot(c, hx + u * 22, py - u * 13, u * 4.2, pt ? '#ffe9a8' : mix('#bfe6fb', p.bg, 0.3)); box(c, hx + u * 21.6, py - u * 17.2, u * 0.8, u * 8.4, shade(pl, -0.3)); box(c, hx + u * 17.8, py - u * 13.4, u * 8.4, u * 0.8, shade(pl, -0.3));
    var rf = q.accent; Pg(c, [[hx - u * 4.4, ht + u * 1.4], [hx + hw / 2, ht - u * 13], [hx + hw + u * 4.4, ht + u * 1.4]], rf, true); c.strokeStyle = shade(rf, -0.2); c.lineWidth = u * 0.5; for (i = 1; i < 4; i++) { var ry = ht + u * 1.4 - i * u * 3.6, rw = (hw / 2 + u * 4.4) * (1 - i * 3.6 / 14.4); c.beginPath(); c.moveTo(hx + hw / 2 - rw, ry); c.lineTo(hx + hw / 2 + rw, ry); c.stroke(); } Pg(c, [[hx - u * 4.4, ht + u * 1.4], [hx + hw / 2, ht - u * 13], [hx + hw / 2 + u * 1, ht - u * 11.4], [hx - u * 2, ht + u * 1.4]], 'rgba(255,255,255,0.14)', true);
    var fpx = hx + hw / 2, fpy = ht - u * 12.6, wv = Math.sin(t * 3) * u * 0.8; box(c, fpx - u * 0.3, fpy - u * 9, u * 0.6, u * 9.4, dk); c.beginPath(); c.moveTo(fpx + u * 0.3, fpy - u * 9); c.quadraticCurveTo(fpx + u * 4, fpy - u * 9.6 + wv, fpx + u * 8, fpy - u * 6.8 - wv); c.quadraticCurveTo(fpx + u * 4, fpy - u * 5.6 + wv, fpx + u * 0.3, fpy - u * 5); c.closePath(); c.fillStyle = q.gold; c.fill();
    box(c, -u * 2, py, u * 46, u * 2.8, shade(pl, -0.14)); box(c, -u * 2, py + u * 2.8, u * 46, u * 0.7, 'rgba(0,0,0,0.18)'); for (i = 0; i < 3; i++) box(c, u * (36.4 + i * 3.4), py - u * 8, u * 1.1, u * 8, pl); Rn(c, u * 35, py - u * 9, u * 9.4, u * 1.5, u * 0.6, shade(pl, 0.12));
    canopy(c, [[-u * 1, 0.2, 8], [u * 9, 0.045, 7]], u, H, lf, t);
    bulbs(c, -u * 2, py + u * 3.6, u * 44, py + u * 3.6, u * 2.2, 6, u * 0.8, o, t, pt > 0);
    for (i = 0; i < 2; i++) { var jx = u * (24 + i * 9), jl = u * (9 + i * 4), jy = py + u * 3.5 + jl, js = Math.sin(t * 1.1 + i * 2) * u * 0.5; L(c, jx, py + u * 3.5, jx + js, jy, u * 0.25, dk); if (pt) glow(c, jx + js, jy + u * 2.4, u * 8, '#eaff9a', 0.5); Rn(c, jx + js - u * 1.7, jy, u * 3.4, u * 4.6, u * 1, pt ? alpha('#f4ffb8', 0.75) : 'rgba(255,255,255,0.5)'); box(c, jx + js - u * 1.3, jy - u * 0.5, u * 2.6, u * 0.9, near('#c9ccd4', v)); if (pt) for (var jf = 0; jf < 3; jf++) dot(c, jx + js + Math.sin(t * 2 + jf * 2 + i) * u * 0.8, jy + u * 2.4 + Math.cos(t * 1.6 + jf * 2.4) * u * 1, u * 0.3, '#fffbe0'); }
    var lsw = Math.sin(t * 0.8) * u * 0.8, lx = u * 31, lb = fg(u * 34) + u * 3; L(c, lx, py + u * 2.8, lx + lsw, lb, u * 0.5, near('#d9c39a', v)); L(c, lx + u * 5.4, py + u * 2.8, lx + u * 5.4 + lsw, lb, u * 0.5, near('#d9c39a', v));
    for (i = 1; i < 10; i++) { var lf2 = i / 10, lyy = py + u * 2.8 + (lb - py - u * 2.8) * lf2; Rn(c, lx - u * 0.6 + lsw * lf2, lyy, u * 6.6, u * 1.1, u * 0.5, pl); }
    /* a rope of flags from tree to tree, and what grows at the foot */
    K.flagRow(c, u * 30, H * 0.046, W - u * 24, H * 0.04, u * 2.6, Math.max(6, Math.round(W / (u * 10))), [q.accent, q.gold, q.accent2, q.paper], u * 4.4, t);
    for (i = 0; i < 4; i++) { var mx = [u * 24, u * 29, u * 2, W - u * 19][i], mb = H * 0.745 + (i % 2) * u * 1.4, ms = u * (2.6 + (i % 3) * 0.7); Rn(c, mx - ms * 0.3, mb - ms * 1.1, ms * 0.6, ms * 1.1, ms * 0.2, q.paper); c.beginPath(); c.ellipse(mx, mb - ms * 1.05, ms, ms * 0.8, 0, PI, TAU); c.fillStyle = q.accent; c.fill(); dot(c, mx - ms * 0.4, mb - ms * 1.4, ms * 0.17, q.paper); dot(c, mx + ms * 0.3, mb - ms * 1.5, ms * 0.14, q.paper); dot(c, mx + ms * 0.1, mb - ms * 1.2, ms * 0.1, q.paper); }
    for (i = 0; i < 22; i++) { var dx = R0() * W, dy = gy + u * 6 + R0() * (H - gy - u * 7), ds = u * (0.5 + (dy - gy) / (H - gy) * 0.6); if (i % 2) K.flower(c, dx, dy, ds * 1.6, [q.paper, q.gold, near('#ff9ab8', v)][i % 3], near('#ffd54a', v), i); else { L(c, dx, dy, dx - ds * 1.4, dy - ds * 4, ds * 0.6, shade(gr, -0.2)); L(c, dx, dy, dx + ds * 1.2, dy - ds * 4.4, ds * 0.6, shade(gr, 0.12)); L(c, dx, dy, dx, dy - ds * 5, ds * 0.6, shade(gr, -0.1)); } }
    /* a little wagon left out on the grass */
    var wgx = W - u * 34, wgy = H * 0.925; ell(c, wgx + u * 8, wgy + u * 3, u * 11, u * 1.2, 'rgba(0,0,0,0.14)'); L(c, wgx, wgy - u * 1, wgx - u * 7, wgy - u * 8, u * 0.7, dk); L(c, wgx - u * 8.4, wgy - u * 8.4, wgx - u * 5.6, wgy - u * 7.6, u * 0.9, dk);
    dot(c, wgx + u * 5.4, wgy - u * 7, u * 3, q.gold); dot(c, wgx + u * 4.4, wgy - u * 8, u * 1, 'rgba(255,255,255,0.4)'); teddy(c, wgx + u * 11.4, wgy - u * 4.6, u * 8, near(mix('#c08a52', p.gold, 0.2), v));
    Rn(c, wgx, wgy - u * 5.4, u * 16, u * 5.4, u * 1, q.accent); box(c, wgx, wgy - u * 5.4, u * 16, u * 1, shade(q.accent, 0.22)); for (i = 0; i < 2; i++) { dot(c, wgx + u * (3.2 + i * 9.6), wgy + u * 0.8, u * 2.3, dk); dot(c, wgx + u * (3.2 + i * 9.6), wgy + u * 0.8, u * 1, near('#c9ccd4', v)); }
    if (pt) fireflies(c, W * 0.2, H * 0.4, W * 0.6, H * 0.4, 9, o.seed, t, u);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- windowseat: a rainy window with cushions (day, night) ---------- */
  function rainView(c, x, y, w, h, v, p, t, o, u) {
    var n2 = part(v) === 2, R0 = rnd(o.seed + 'rain'), i, j, sk = n2 ? ['#0e1634', '#1d2a5a', '#3a467a'] : ['#8ea6be', '#b7c8d6', '#dbe5ea'], far, bx;
    for (i = 0; i < 3; i++) sk[i] = mix(sk[i], p.bg, 0.16);
    far = n2 ? mix('#1a2450', p.bg, 0.2) : mix('#8498ae', p.bg, 0.2);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    grad(c, x, y, w, h, sk);
    for (i = 0; i < 5; i++) ell(c, x + frac(R0() + t * 0.004 * (1 + i * 0.3)) * w * 1.5 - w * 0.25, y + h * (0.06 + R0() * 0.3), w * (0.25 + R0() * 0.2), h * (0.04 + R0() * 0.03), alpha(n2 ? '#5a6aa0' : '#ffffff', n2 ? 0.2 : 0.3));
    /* the far side of the street, soft in the rain */
    bx = x - u * 2; i = 0;
    while (bx < x + w) { var bw = u * (9 + R0() * 8), bh = h * (0.17 + R0() * 0.13), bc = i % 2 ? far : shade(far, n2 ? 0.1 : -0.07); box(c, bx, y + h - bh, bw + 1, bh, bc); if (i % 2 === 0) Pg(c, [[bx - u * 0.6, y + h - bh], [bx + bw / 2, y + h - bh - bw * 0.36], [bx + bw + u * 0.6, y + h - bh]], shade(bc, -0.12), true); else box(c, bx + bw * 0.6, y + h - bh - u * 3, u * 2, u * 3, bc);
      for (j = 0; j < 4; j++) { var lit = R0() < 0.6; if (bh > u * 6 + Math.floor(j / 2) * u * 5) box(c, bx + bw * (0.2 + (j % 2) * 0.42), y + h - bh + u * 2 + Math.floor(j / 2) * u * 5, bw * 0.2, u * 2.8, n2 ? (lit ? alpha(WARM, 0.6 + 0.2 * Math.sin(t * 1.5 + i + j)) : shade(bc, 0.1)) : shade(bc, 0.16)); } bx += bw; i++; }
    for (i = 0; i < 2; i++) { var tx = x + w * (i ? 0.93 : 0.07), sw = Math.sin(t * 0.9 + i * 2) * u * 0.6, tc = shade(far, n2 ? -0.2 : -0.14); box(c, tx - u * 0.7, y + h * 0.66, u * 1.4, h * 0.34, tc); dot(c, tx + sw, y + h * 0.6, u * 6, tc); dot(c, tx - u * 4 + sw, y + h * 0.66, u * 4.4, tc); dot(c, tx + u * 4 + sw, y + h * 0.67, u * 4.6, tc); }
    var lx = x + w * 0.7, ly = y + h * 0.56; box(c, lx - u * 0.4, ly, u * 0.8, h * 0.44, shade(far, -0.3)); box(c, lx - u * 0.4, ly, u * 3.4, u * 0.7, shade(far, -0.3)); glow(c, lx + u * 3, ly + u * 1.6, u * (n2 ? 17 : 8), WARM, n2 ? 0.6 : 0.3); dot(c, lx + u * 3, ly + u * 1.5, u * 1.2, n2 ? '#fff3c4' : '#fbf1cf');
    grad(c, x, y + h * 0.72, w, h * 0.28, [alpha(sk[2], 0), alpha(sk[2], 0.55)]);
    /* the rain falling */
    c.strokeStyle = alpha(n2 ? '#b9c8f0' : '#ffffff', n2 ? 0.3 : 0.5); c.lineWidth = Math.max(0.6, u * 0.22); c.lineCap = 'round'; c.beginPath();
    for (i = 0; i < 54; i++) { var rx = x + R0() * w, ry = y + frac(R0() + t * (0.8 + R0() * 0.6)) * (h + u * 8) - u * 8, len = u * (3 + R0() * 3.4); c.moveTo(rx, ry); c.lineTo(rx - len * 0.14, ry + len); } c.stroke();
    /* beads on the glass: some sit, some run down and leave a trail */
    for (i = 0; i < 30; i++) { var gx = x + R0() * w, per = 5 + R0() * 9, f = frac(R0() + t / per), ys = R0(), run = i % 3 === 0, gy = y + (run ? Math.pow(f, 1.7) : ys) * h, r = u * (0.4 + R0() * 0.45);
      if (run) L(c, gx, Math.max(y, gy - h * 0.16 * f), gx, gy, r * 0.9, 'rgba(255,255,255,0.14)');
      ell(c, gx, gy, r, r * 1.25, 'rgba(255,255,255,0.45)'); dot(c, gx - r * 0.3, gy - r * 0.45, r * 0.32, 'rgba(255,255,255,0.85)'); }
    c.restore();
  }
  add('windowseat', function (c, W, H, t, p, o, u) {
    var v = o.variant, pt = part(v), pp = pt ? dimPal(p, 0.36) : p, sy = H * 0.555, fl = H * 0.69, i, wd = woodc(pp), fr = pp.paper, cu = shade(pp.accent2, 0.25);
    grad(c, 0, 0, W, fl, [shade(pp.bg, 0.1), pp.bg]);
    c.fillStyle = alpha(pp.snow, 0.05); for (i = 0; i * u * 6.25 < W; i += 2) c.fillRect(i * u * 6.25, 0, u * 6.25, fl);
    /* the big window */
    var wx = u * 13, wy = H * 0.06, ww = W - u * 26, wh = sy - u * 4.6 - wy, cols = Math.max(2, Math.round(ww / (u * 27)));
    Rn(c, wx - u * 2.8, wy - u * 2.8, ww + u * 5.6, wh + u * 5.6, u * 1.6, shade(fr, -0.18)); Rn(c, wx - u * 2.1, wy - u * 2.1, ww + u * 4.2, wh + u * 4.2, u * 1.2, fr);
    rainView(c, wx, wy, ww, wh, v, p, t, o, u);
    c.fillStyle = 'rgba(255,255,255,0.07)'; c.beginPath(); c.moveTo(wx + ww * 0.1, wy + wh); c.lineTo(wx + ww * 0.42, wy); c.lineTo(wx + ww * 0.56, wy); c.lineTo(wx + ww * 0.24, wy + wh); c.closePath(); c.fill();
    for (i = 1; i < cols; i++) box(c, wx + ww * i / cols - u * 0.7, wy, u * 1.4, wh, fr); box(c, wx, wy + wh * 0.27, ww, u * 1.2, fr);
    bulbs(c, wx, wy + u * 0.6, wx + ww, wy + u * 0.6, u * 2.6, Math.max(6, Math.round(ww / (u * 8))), u * 0.75, o, t, pt > 0);
    /* the seat: board, cupboards under it, the long cushion */
    box(c, u * 4, sy + u * 0.4, W - u * 8, fl - sy, shade(fr, -0.07)); var nd = Math.max(3, Math.round((W - u * 8) / (u * 22))), dw = (W - u * 8) / nd;
    for (i = 0; i < nd; i++) { Rn(c, u * 4 + i * dw + u * 1.4, sy + u * 4.4, dw - u * 2.8, fl - sy - u * 7.6, u * 0.8, shade(fr, 0.4)); Rn(c, u * 4 + i * dw + u * 2.8, sy + u * 5.8, dw - u * 5.6, fl - sy - u * 10.4, u * 0.6, shade(fr, -0.05)); Rn(c, u * 4 + i * dw + dw / 2 - u * 2, sy + u * 7.4, u * 4, u * 1, u * 0.5, pp.gold); }
    box(c, u * 4, fl - u * 2, W - u * 8, u * 2, shade(fr, -0.22)); Rn(c, u * 2.6, sy + u * 0.2, W - u * 5.2, u * 2.4, u * 0.8, fr); box(c, u * 4, sy + u * 2.6, W - u * 8, u * 0.7, 'rgba(0,0,0,0.12)');
    Rn(c, u * 5, sy - u * 4.6, W - u * 10, u * 5.4, u * 2.4, shade(pp.accent, -0.14)); Rn(c, u * 5, sy - u * 4.6, W - u * 10, u * 4, u * 2, pp.accent); Rn(c, u * 7, sy - u * 4, W - u * 14, u * 1.1, u * 0.55, shade(pp.accent, 0.16));
    for (i = 1; i < nd * 2; i++) dot(c, u * 4 + i * dw / 2, sy - u * 1.6, u * 0.5, shade(pp.accent, -0.3));
    planks(c, W, fl, H, floorc(pp), u, 6);
    rug(c, W * 0.5, fl + (H - fl) * 0.56, W * 0.34, (H - fl) * 0.27, mix(pp.accent2, pp.bg2, 0.25), pp.paper, u);
    /* the curtains */
    Rn(c, -u * 1, wy - u * 6.4, W + u * 2, u * 1.4, u * 0.7, pp.gold);
    curtain(c, -u * 0.5, wy - u * 5.2, u * 13.5, sy - wy + u * 1, cu, 1, u, pp.gold); curtain(c, W + u * 0.5, wy - u * 5.2, u * 13.5, sy - wy + u * 1, cu, -1, u, pp.gold);
    /* on the seat: cushions, books and a mug, a candle lantern, the cat watching the rain */
    pillow(c, u * 15.5, sy - u * 10.4, u * 12, -0.16, pp.gold, pp.paper, 1); pillow(c, u * 25, sy - u * 9, u * 10, 0.2, mix(pp.accent2, pp.paper, 0.2), pp.paper, 2);
    var bkx = u * 34, bky = sy - u * 4.6, bcs = [pp.accent2, pp.gold, pp.paper];
    for (i = 0; i < 3; i++) { Rn(c, bkx + (i % 2) * u * 0.8, bky - (i + 1) * u * 2, u * 9, u * 2, u * 0.4, bcs[i]); box(c, bkx + (i % 2) * u * 0.8 + u * 0.6, bky - (i + 1) * u * 2 + u * 0.5, u * 7.8, u * 1, 'rgba(255,255,255,0.5)'); box(c, bkx + (i % 2) * u * 0.8, bky - (i + 1) * u * 2, u * 1.2, u * 2, shade(bcs[i], -0.2)); }
    mug(c, bkx + u * 4.6, bky - u * 6, u * 3.2, pp.accent, t);
    pillow(c, W - u * 15, sy - u * 10, u * 11.5, 0.14, mix(pp.accent2, pp.paper, 0.2), pp.paper, 3);
    catSit(c, W - u * 27, sy - u * 4.4, u * 17, pt ? '#2c2738' : '#4c4759', t);
    lantern(c, W - u * 38.5, sy - u * 4.5, u * 8.5, t, true, '#3a3440');
    /* on the floor: boots and the wet umbrella, a basket of wool */
    var ux = u * 7, ub = fl + u * 17; ell(c, ux + u * 6, ub + u * 0.6, u * 12, u * 1.6, alpha('#cfe0ff', 0.2));
    c.save(); c.translate(ux, ub); c.rotate(-0.16); c.beginPath(); c.arc(-u * 1.6, -u * 33, u * 1.6, PI, 0); c.lineWidth = u * 0.9; c.strokeStyle = wd; c.stroke(); box(c, -u * 0.45, -u * 33, u * 0.9, u * 33, shade(wd, -0.2)); Pg(c, [[-u * 2.6, -u * 26], [u * 2.6, -u * 26], [u * 0.5, -u * 1.6], [-u * 0.5, -u * 1.6]], pp.accent, true); Pg(c, [[-u * 0.9, -u * 26], [u * 0.9, -u * 26], [u * 0.2, -u * 1.6], [-u * 0.2, -u * 1.6]], shade(pp.accent, 0.2), true); Rn(c, -u * 2.2, -u * 15, u * 4.4, u * 1.2, u * 0.6, pp.gold); c.restore();
    boots(c, u * 13, fl + u * 15, u * 8.5, pp.gold);
    var kx = W - u * 15, kb = fl + u * 16, wk = mix('#c99a5a', pp.gold, 0.2); ell(c, kx, kb, u * 9, u * 1.4, 'rgba(0,0,0,0.14)');
    dot(c, kx - u * 3.4, kb - u * 9.6, u * 3.4, pp.accent); dot(c, kx + u * 2.4, kb - u * 10, u * 3.8, pp.accent2); dot(c, kx - u * 0.4, kb - u * 12.4, u * 3, pp.gold);
    c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = u * 0.35; for (i = 0; i < 3; i++) { c.beginPath(); c.arc(kx + u * 2.4, kb - u * 10, u * (1.2 + i * 0.9), 0.2, 2.2); c.stroke(); c.beginPath(); c.arc(kx - u * 3.4, kb - u * 9.6, u * (1 + i * 0.8), 3.4, 5.4); c.stroke(); }
    L(c, kx - u * 2, kb - u * 12, kx + u * 6, kb - u * 19, u * 0.5, shade(wd, 0.3)); L(c, kx + u * 1, kb - u * 12, kx - u * 6, kb - u * 18.4, u * 0.5, shade(wd, 0.3));
    Pg(c, [[kx - u * 8, kb - u * 9], [kx + u * 8, kb - u * 9], [kx + u * 6.4, kb], [kx - u * 6.4, kb]], wk, true); c.fillStyle = shade(wk, -0.18); for (i = 0; i < 3; i++) c.fillRect(kx - u * 7.4, kb - u * 7 + i * u * 2.4, u * 14.8, u * 0.5); Rn(c, kx - u * 8.6, kb - u * 10, u * 17.2, u * 2, u * 0.9, shade(wk, 0.16));
    if (pt) { glow(c, W - u * 38.5, sy - u * 8, u * 24, WARM, 0.3); c.fillStyle = alpha(WARM, 0.07); c.beginPath(); c.moveTo(wx + ww * 0.52, sy); c.lineTo(wx + ww * 0.9, sy); c.lineTo(W * 0.96, H); c.lineTo(W * 0.3, H); c.closePath(); c.fill(); }
    else { c.fillStyle = alpha('#eaf2ff', 0.07); c.beginPath(); c.moveTo(wx, fl); c.lineTo(wx + ww, fl); c.lineTo(W + u * 6, H); c.lineTo(-u * 6, H); c.closePath(); c.fill(); }
  }, { variants: ['day', 'night'], stage: 'cast-low' });

  /* ---------- diningroom: a long table set for many (day, evening) ---------- */
  function chandelier(c, x, y, s, col, t, on) { /* hangs from the top of the picture; y = the height of its arms, s = half its width */
    var i; box(c, x - s * 0.03, 0, s * 0.06, y - s * 0.3, col); dot(c, x, y - s * 0.3, s * 0.1, col); dot(c, x, y + s * 0.16, s * 0.07, col);
    c.lineWidth = s * 0.055; c.lineCap = 'round'; c.strokeStyle = col;
    for (i = -2; i <= 2; i++) { var ax = x + i * s * 0.46, ay = y - Math.abs(i) * s * 0.06; if (i) { c.beginPath(); c.moveTo(x, y - s * 0.22); c.quadraticCurveTo(x + i * s * 0.16, y + s * 0.26, ax, ay); c.stroke(); } if (on) glow(c, ax, ay - s * 0.3, s * 0.5, WARM, 0.5); ell(c, ax, ay, s * 0.1, s * 0.04, col); box(c, ax - s * 0.035, ay - s * 0.2, s * 0.07, s * 0.2, '#fff8ea'); flame(c, ax, ay - s * 0.2, s * 0.08, s * 0.2, t, i * 1.3); dot(c, ax, ay + s * 0.12, s * 0.035, 'rgba(255,255,255,0.85)'); }
  }
  add('diningroom', function (c, W, H, t, p, o, u) {
    var v = o.variant, pt = part(v), pp = pt ? dimPal(p, 0.3) : p, fl = H * 0.655, ty = H * 0.865, wn = fl - u * 24, i, j, wd = woodc(pp), R0 = rnd(o.seed + 'dine'), n = Math.max(3, Math.round(W / (u * 26))), cl = pp.paper;
    grad(c, 0, 0, W, wn, [shade(pp.bg, 0.1), pp.bg]);
    c.fillStyle = alpha(pp.snow, 0.08); c.beginPath(); for (j = 0; j * u * 8 < wn; j++) for (i = 0; i * u * 10 < W + u * 10; i++) { var dx = i * u * 10 + (j % 2) * u * 5, dy = j * u * 8 + u * 3; c.moveTo(dx, dy - u * 1.6); c.lineTo(dx + u * 1.1, dy); c.lineTo(dx, dy + u * 1.6); c.lineTo(dx - u * 1.1, dy); c.closePath(); } c.fill();
    box(c, 0, wn, W, fl - wn, pp.paper); var np = Math.max(4, Math.round(W / (u * 17))), pw = W / np; for (i = 0; i < np; i++) { Rn(c, i * pw + u * 1.6, wn + u * 4.4, pw - u * 3.2, fl - wn - u * 9, u * 0.7, shade(pp.paper, -0.08)); Rn(c, i * pw + u * 2.6, wn + u * 5.4, pw - u * 5.2, fl - wn - u * 11, u * 0.5, pp.paper); }
    Rn(c, 0, wn - u * 0.6, W, u * 2.2, 0, shade(pp.paper, 0.3)); box(c, 0, wn + u * 1.6, W, u * 0.6, shade(pp.paper, -0.16)); box(c, 0, fl - u * 2.6, W, u * 2.6, shade(pp.paper, -0.14));
    planks(c, W, fl, H, floorc(pp), u, 5);
    var rgc = mix(mix(pp.accent, pp.bg2, 0.5), floorc(pp), 0.25); Pg(c, [[W * 0.07, fl + u * 5], [W * 0.93, fl + u * 5], [W * 1.05, ty + u * 6], [-W * 0.05, ty + u * 6]], rgc, true); Pg(c, [[W * 0.1, fl + u * 7], [W * 0.9, fl + u * 7], [W * 1.0, ty + u * 6], [0, ty + u * 6]], shade(rgc, 0.12), true); Pg(c, [[W * 0.14, fl + u * 9.4], [W * 0.86, fl + u * 9.4], [W * 0.95, ty + u * 6], [W * 0.05, ty + u * 6]], rgc, true);
    /* the sideboard, left, under a mirror */
    var sb = fl + u * 2.4, st = sb - u * 25, sw = u * 31;
    box(c, u * 1, sb - u * 2, u * 2, u * 2.4, shade(wd, -0.3)); box(c, sw - u * 5, sb - u * 2, u * 2, u * 2.4, shade(wd, -0.3));
    Rn(c, -u * 2, st, sw, sb - st - u * 1.6, u * 1.2, wd); for (i = 0; i < 2; i++) { Rn(c, u * 0.6 + i * u * 13.6, st + u * 8.4, u * 12.4, u * 13, u * 0.8, shade(wd, 0.14)); Rn(c, u * 2 + i * u * 13.6, st + u * 9.8, u * 9.6, u * 10.2, u * 0.6, wd); dot(c, i ? u * 16 : u * 11.2, st + u * 15, u * 0.9, pp.gold); }
    Rn(c, u * 0.6, st + u * 2.4, u * 26, u * 4.6, u * 0.8, shade(wd, 0.14)); Rn(c, u * 11, st + u * 4.2, u * 5.4, u * 1, u * 0.5, pp.gold); Rn(c, -u * 3, st - u * 0.8, sw + u * 2, u * 2, u * 0.9, shade(wd, 0.1));
    var mx = u * 13.5, my = st - u * 22; ell(c, mx, my, u * 10, u * 13.4, shade(pp.gold, -0.2)); ell(c, mx, my, u * 9.2, u * 12.6, pp.gold); ell(c, mx, my, u * 7.6, u * 11, mix(pp.bg, '#ffffff', 0.55)); c.save(); c.beginPath(); c.ellipse(mx, my, u * 7.6, u * 11, 0, 0, TAU); c.clip(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.moveTo(mx - u * 9, my + u * 4); c.lineTo(mx + u * 3, my - u * 12); c.lineTo(mx + u * 7, my - u * 12); c.lineTo(mx - u * 5, my + u * 4); c.closePath(); c.fill(); c.restore(); dot(c, mx, my - u * 13.6, u * 1.6, pp.gold);
    var lpx = u * 5.6; ell(c, lpx, st - u * 1, u * 2.6, u * 0.8, shade(pp.accent2, -0.2)); ell(c, lpx, st - u * 4, u * 2.4, u * 3.2, pp.accent2); box(c, lpx - u * 0.4, st - u * 8.4, u * 0.8, u * 2, pp.gold); lampShade(c, lpx, st - u * 14.4, u * 9, u * 6.6, mix(pp.paper, pp.gold, 0.3), pt > 0);
    for (i = 0; i < 4; i++) ell(c, u * 16.5, st - u * 1.4 - i * u * 0.8, u * 4.4, u * 1, i % 2 ? shade(pp.paper, -0.1) : pp.paper);
    var fbx = u * 24.6; dot(c, fbx - u * 1.8, st - u * 4.2, u * 1.8, pp.accent); dot(c, fbx + u * 1.6, st - u * 4.4, u * 1.9, mix(pp.gold, '#ff9a3a', 0.4)); dot(c, fbx, st - u * 5.8, u * 1.7, mix(pp.accent2, '#9ed05a', 0.5)); c.beginPath(); c.ellipse(fbx, st - u * 3.8, u * 4.6, u * 3, 0, 0, PI); c.fillStyle = pp.accent2; c.fill(); box(c, fbx - u * 1.6, st - u * 1.2, u * 3.2, u * 0.5, shade(pp.accent2, -0.2));
    /* the window, right, and a tall plant in the corner */
    var wx = W - u * 31, wy = H * 0.1, ww = u * 21, wh = u * 40, cu = mix(pp.accent, pp.bg, 0.15);
    windowAt(c, wx, wy, ww, wh, v, p, t, o, u, 'garden', 2, 4, false, pp);
    Rn(c, wx - u * 8, wy - u * 5.4, ww + u * 16, u * 3.4, u * 1.2, shade(cu, -0.16)); for (i = 0; i < 5; i++) { c.beginPath(); c.arc(wx - u * 8 + (ww + u * 16) * (i + 0.5) / 5, wy - u * 2.2, (ww + u * 16) / 10, 0, PI); c.fillStyle = i % 2 ? cu : shade(cu, 0.12); c.fill(); }
    curtain(c, wx - u * 7, wy - u * 2.4, u * 9, wh + u * 10, cu, 1, u, pp.gold); curtain(c, wx + ww + u * 7, wy - u * 2.4, u * 9, wh + u * 10, cu, -1, u, pp.gold);
    plant(c, W - u * 6, fl + u * 5, u * 30, pp, t, 0, pp.gold);
    /* the chairs on the far side, then the table and its cloth */
    for (i = 0; i < n; i++) { var cx = (i + 0.5) / n * W, cb = shade(wd, -0.12); Rn(c, cx - u * 7, ty - u * 20, u * 1.9, u * 22, u * 0.9, cb); Rn(c, cx + u * 5.1, ty - u * 20, u * 1.9, u * 22, u * 0.9, cb); Rn(c, cx - u * 7.6, ty - u * 21.4, u * 15.2, u * 4.2, u * 2, wd); Rn(c, cx - u * 6, ty - u * 14.6, u * 12, u * 2.6, u * 1.2, wd); Rn(c, cx - u * 6, ty - u * 9.2, u * 12, u * 2.6, u * 1.2, wd); Rn(c, cx - u * 6, ty - u * 20.6, u * 12, u * 1, u * 0.5, shade(wd, 0.18)); }
    box(c, 0, ty - u * 0.6, W, u * 1.2, 'rgba(0,0,0,0.16)'); grad(c, 0, ty, W, H - ty, [mix(cl, '#ffffff', 0.4), cl, shade(cl, -0.1)]);
    var rn = mix(pp.accent2, cl, 0.4), ry = ty + (H - ty) * 0.1, rh = (H - ty) * 0.34; box(c, 0, ry, W, rh, rn); box(c, 0, ry + u * 0.8, W, u * 0.4, alpha(pp.gold, 0.8)); box(c, 0, ry + rh - u * 1.2, W, u * 0.4, alpha(pp.gold, 0.8));
    c.fillStyle = alpha(pp.paper, 0.4); for (i = 0; i * u * 5 < W; i++) { c.beginPath(); c.arc(i * u * 5 + u * 2.5, ry + rh / 2, u * 0.7, 0, TAU); c.fill(); }
    for (i = 0; i < n; i++) ell(c, (i + 0.5) / n * W, ty + u * 2, u * 6.4, u * 1.3, shade(cl, -0.1));
    /* each place: plate, napkin, knife and fork, a glass */
    var py = ty + (H - ty) * 0.72;
    for (i = 0; i < n; i++) { var sx = (i + 0.5) / n * W;
      ell(c, sx, py + u * 0.6, u * 8.6, u * 3.6, 'rgba(0,0,0,0.1)'); ell(c, sx, py, u * 8.4, u * 3.5, '#ffffff'); ell(c, sx, py, u * 7.4, u * 3, mix(pp.accent, '#ffffff', 0.55)); ell(c, sx, py, u * 6.6, u * 2.6, '#ffffff');
      Pg(c, [[sx - u * 3.4, py - u * 0.6], [sx + u * 2, py - u * 1.5], [sx + u * 3.4, py + u * 0.5], [sx - u * 2, py + u * 1.4]], pp.accent2, true); Pg(c, [[sx - u * 3.4, py - u * 0.6], [sx - u * 0.7, py - u * 1.05], [sx + u * 0.7, py + u * 0.95], [sx - u * 2, py + u * 1.4]], shade(pp.accent2, 0.25), true); Pg(c, [[sx + u * 0.4, py - u * 1.24], [sx + u * 1.1, py - u * 1.36], [sx + u * 2.5, py + u * 0.64], [sx + u * 1.8, py + u * 0.76]], pp.gold, true);
      L(c, sx - u * 11, py - u * 2, sx - u * 12, py + u * 2.6, u * 0.6, '#c9ccd4'); L(c, sx - u * 10.2, py - u * 2.2, sx - u * 10.6, py - u * 0.6, u * 0.4, '#c9ccd4'); L(c, sx - u * 11.8, py - u * 2.2, sx - u * 11.6, py - u * 0.6, u * 0.4, '#c9ccd4'); L(c, sx + u * 11, py - u * 2.2, sx + u * 12, py + u * 2.6, u * 0.7, '#c9ccd4');
      var gx = sx + u * 9, gy = py - u * 4.4; ell(c, gx, gy + u * 0.3, u * 1.8, u * 0.6, 'rgba(255,255,255,0.7)'); box(c, gx - u * 0.2, gy - u * 2.6, u * 0.4, u * 2.8, 'rgba(255,255,255,0.8)'); Pg(c, [[gx - u * 2, gy - u * 7], [gx + u * 2, gy - u * 7], [gx + u * 1.3, gy - u * 2.6], [gx - u * 1.3, gy - u * 2.6]], 'rgba(255,255,255,0.5)', true); Pg(c, [[gx - u * 1.7, gy - u * 5.2], [gx + u * 1.7, gy - u * 5.2], [gx + u * 1.3, gy - u * 2.8], [gx - u * 1.3, gy - u * 2.8]], alpha(pp.accent, 0.75), true);
    }
    /* down the middle: flowers, bread, a pie, the candles */
    var cy = ry + rh * 0.62;
    for (i = 0; i < n; i++) { var fxx = (i + 0.5) / n * W, kd = (i + (n > 3 ? 0 : 1)) % 3;
      if (kd === 0) { for (j = 0; j < 5; j++) leaf(c, fxx, cy - u * 3.4, u * 5.6, -PI / 2 + (j - 2) * 0.55, j % 2 ? pp.accent2 : shade(pp.accent2, -0.15)); for (j = 0; j < 5; j++) K.bloom(c, fxx + (j - 2) * u * 2.4, cy - u * (6 + (j % 2) * 2.4), u * 2.1, [pp.accent, pp.paper, pp.gold, pp.paper, pp.accent][j], t, j * 1.3 + i); c.beginPath(); c.ellipse(fxx, cy - u * 3.6, u * 4.6, u * 3.6, 0, 0, PI); c.fillStyle = pp.gold; c.fill(); box(c, fxx - u * 4.8, cy - u * 4, u * 9.6, u * 0.8, shade(pp.gold, 0.25)); }
      else if (kd === 1) { ell(c, fxx, cy, u * 7, u * 1.8, 'rgba(0,0,0,0.1)'); ell(c, fxx, cy - u * 0.8, u * 7, u * 2, '#c9ccd4'); ell(c, fxx, cy - u * 1.8, u * 6.2, u * 2, '#c98a4a'); ell(c, fxx, cy - u * 2.4, u * 5.4, u * 1.6, '#e9b872'); c.strokeStyle = '#c98a4a'; c.lineWidth = u * 0.45; for (j = -2; j <= 2; j++) { c.beginPath(); c.moveTo(fxx + j * u * 1.8 - u * 1, cy - u * 3.6); c.lineTo(fxx + j * u * 1.8 + u * 1, cy - u * 1.2); c.stroke(); } steam(c, fxx, cy - u * 4.4, u * 5, t + i, 2); }
      else { var wk = mix('#c99a5a', pp.gold, 0.2); ell(c, fxx - u * 2.4, cy - u * 4.4, u * 3.4, u * 2.2, '#d9a25e', -0.3); ell(c, fxx + u * 2.2, cy - u * 4.6, u * 3.6, u * 2.2, '#e2b06c', 0.3); ell(c, fxx, cy - u * 5.4, u * 3, u * 2, '#eec07e'); c.beginPath(); c.ellipse(fxx, cy - u * 3.6, u * 6.4, u * 3.8, 0, 0, PI); c.fillStyle = wk; c.fill(); box(c, fxx - u * 6.6, cy - u * 4.1, u * 13.2, u * 0.9, shade(wk, 0.18)); Pg(c, [[fxx - u * 3, cy - u * 3.4], [fxx + u * 1, cy - u * 3.4], [fxx - u * 0.6, cy - u * 0.6]], pp.paper, true); }
    }
    var cnx = []; for (i = 0; i <= n; i++) if (i > 0 && i < n) cnx.push(i / n * W); else cnx.push(i ? W - u * 4 : u * 4);
    for (i = 0; i < cnx.length; i++) { ell(c, cnx[i], cy, u * 2, u * 0.7, shade(pp.gold, -0.2)); box(c, cnx[i] - u * 0.5, cy - u * 3.4, u * 1, u * 3.4, pp.gold); ell(c, cnx[i], cy - u * 3.4, u * 1.5, u * 0.5, shade(pp.gold, 0.2)); }
    if (pt) dimEdge(c, W, H, ty);
    for (i = 0; i < cnx.length; i++) { if (pt) glow(c, cnx[i], cy - u * 10, u * 13, WARM, 0.5); candle(c, cnx[i], cy - u * 3.4, u * 1.2, u * 5.6, '#fff8ea', t, i * 1.7); }
    chandelier(c, W / 2, H * 0.062, u * 14, pp.gold, t, pt > 0);
    if (pt) { glow(c, W / 2, H * 0.06, u * 56, WARM, 0.3); glow(c, lpx, st - u * 10, u * 28, WARM, 0.4); lampShade(c, lpx, st - u * 14.4, u * 9, u * 6.6, mix(p.paper, p.gold, 0.3), true); }
    else { c.fillStyle = alpha('#fff6d0', 0.1); c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx + ww, wy + wh); c.lineTo(wx + ww - u * 26, ty); c.lineTo(wx - u * 50, ty); c.closePath(); c.fill(); }
  }, { variants: ['day', 'evening'], stage: 'band-low' });
  function dimEdge(c, W, H, ty) { grad(c, 0, ty, W, H - ty, ['rgba(27,22,64,0)', 'rgba(27,22,64,0.22)']); }

  /* ---------- garage: the garage where the band practises (one) ---------- */
  function drumkit(c, x, y, s, p, k) { /* base centre (x, y), s wide */
    var sh = p.accent2, ch = '#c9ccd4', hd = p.paper, i;
    for (i = -1; i <= 1; i += 2) { var sx = x + i * s * 0.43, sh2 = i < 0 ? 0.6 : 0.7; L(c, sx, y - s * 0.08, sx, y - s * sh2, s * 0.014, ch); L(c, sx, y - s * 0.1, sx - s * 0.08, y, s * 0.014, ch); L(c, sx, y - s * 0.1, sx + s * 0.08, y, s * 0.014, ch); }
    L(c, x + s * 0.2, y - s * 0.06, x + s * 0.18, y, s * 0.014, ch); L(c, x + s * 0.36, y - s * 0.06, x + s * 0.38, y, s * 0.014, ch); Rn(c, x + s * 0.17, y - s * 0.31, s * 0.22, s * 0.26, s * 0.02, sh); box(c, x + s * 0.17, y - s * 0.26, s * 0.22, s * 0.02, ch); ell(c, x + s * 0.28, y - s * 0.31, s * 0.11, s * 0.032, hd);
    L(c, x - s * 0.27, y - s * 0.3, x - s * 0.33, y, s * 0.014, ch); L(c, x - s * 0.27, y - s * 0.3, x - s * 0.2, y, s * 0.014, ch); Rn(c, x - s * 0.38, y - s * 0.38, s * 0.22, s * 0.09, s * 0.015, ch); ell(c, x - s * 0.27, y - s * 0.38, s * 0.11, s * 0.03, hd);
    L(c, x - s * 0.2, y - s * 0.02, x - s * 0.26, y, s * 0.02, ch); L(c, x + s * 0.2, y - s * 0.02, x + s * 0.26, y, s * 0.02, ch);
    dot(c, x, y - s * 0.2, s * 0.205, ch); dot(c, x, y - s * 0.2, s * 0.188, sh); dot(c, x, y - s * 0.2, s * 0.16 * (1 + 0.035 * k), hd); starPath(c, x, y - s * 0.2, s * 0.075, s * 0.032, 5, 0); c.fillStyle = p.accent; c.fill();
    for (i = 0; i < 8; i++) dot(c, x + Math.cos(i / 8 * TAU + 0.4) * s * 0.196, y - s * 0.2 + Math.sin(i / 8 * TAU + 0.4) * s * 0.196, s * 0.012, '#8a8f9c');
    for (i = -1; i <= 1; i += 2) { L(c, x + i * s * 0.06, y - s * 0.4, x + i * s * 0.1, y - s * 0.46, s * 0.016, ch); Rn(c, x + i * s * 0.12 - s * 0.085, y - s * 0.55, s * 0.17, s * 0.11, s * 0.02, sh); box(c, x + i * s * 0.12 - s * 0.085, y - s * 0.52, s * 0.17, s * 0.015, ch); ell(c, x + i * s * 0.12, y - s * 0.55, s * 0.085, s * 0.028, hd); }
    ell(c, x - s * 0.43, y - s * 0.6, s * 0.15, s * 0.024, shade(p.gold, -0.2), -0.12 + k * 0.1); ell(c, x - s * 0.43, y - s * 0.605, s * 0.14, s * 0.018, p.gold, -0.12 + k * 0.1); ell(c, x + s * 0.43, y - s * 0.7, s * 0.17, s * 0.026, shade(p.gold, -0.2), 0.1 - k * 0.1); ell(c, x + s * 0.43, y - s * 0.705, s * 0.16, s * 0.02, p.gold, 0.1 - k * 0.1);
    L(c, x - s * 0.33, y - s * 0.4, x - s * 0.2, y - s * 0.43, s * 0.012, '#e8cfa0'); L(c, x - s * 0.31, y - s * 0.43, x - s * 0.2, y - s * 0.39, s * 0.012, '#e8cfa0');
  }
  function guitar(c, x, y, s, rot, col, p) { /* an electric guitar standing on its end: (x, y) the bottom of the body, s long */
    c.save(); c.translate(x, y); c.rotate(rot);
    Rn(c, -s * 0.045, -s, s * 0.09, s * 0.12, s * 0.02, shade(col, -0.2)); box(c, -s * 0.025, -s * 0.9, s * 0.05, s * 0.56, '#7a5236'); c.fillStyle = 'rgba(255,255,255,0.4)'; for (var i = 0; i < 7; i++) c.fillRect(-s * 0.025, -s * (0.86 - i * 0.07), s * 0.05, s * 0.006);
    for (i = 0; i < 3; i++) { dot(c, -s * 0.06, -s * (0.975 - i * 0.035), s * 0.012, '#c9ccd4'); dot(c, s * 0.06, -s * (0.975 - i * 0.035), s * 0.012, '#c9ccd4'); }
    ell(c, 0, -s * 0.15, s * 0.17, s * 0.15, col); ell(c, 0, -s * 0.33, s * 0.125, s * 0.1, col); ell(c, -s * 0.04, -s * 0.18, s * 0.09, s * 0.1, shade(col, 0.16)); ell(c, s * 0.05, -s * 0.16, s * 0.075, s * 0.1, p.paper, 0.3);
    box(c, -s * 0.05, -s * 0.33, s * 0.1, s * 0.03, '#2e2a36'); box(c, -s * 0.05, -s * 0.24, s * 0.1, s * 0.03, '#2e2a36'); box(c, -s * 0.045, -s * 0.13, s * 0.09, s * 0.02, '#c9ccd4'); dot(c, s * 0.09, -s * 0.1, s * 0.014, '#2e2a36'); dot(c, s * 0.1, -s * 0.06, s * 0.014, '#2e2a36');
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(-s * 0.004, -s * 0.9, s * 0.008, s * 0.78);
    c.restore();
  }
  add('garage', function (c, W, H, t, p, o, u) {
    var fl = H * 0.665, i, j, R0 = rnd(o.seed + 'garage'), k = Math.exp(-5 * o.beat), wd = woodc(p), cn = mix('#a3a3ad', p.bg2, 0.38), dk = '#2e2a36', steel = '#b9c0c8';
    grad(c, 0, 0, W, fl, [shade(p.bg, -0.08), shade(p.bg, 0.08)]);
    c.fillStyle = alpha(p.snow, 0.07); for (j = 1; j * u * 8 < fl; j++) { c.fillRect(0, j * u * 8, W, Math.max(1, u * 0.3)); for (i = 0; i * u * 16 < W + u * 16; i++) c.fillRect(i * u * 16 - (j % 2) * u * 8, (j - 1) * u * 8, Math.max(1, u * 0.3), u * 8); }
    glow(c, W / 2, H * 0.12, u * 70, WARM, 0.14);
    /* the concrete floor */
    grad(c, 0, fl, W, H - fl, [shade(cn, 0.1), shade(cn, -0.2)]);
    c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = Math.max(0.6, u * 0.3); for (i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(W / 2 + i * W * 0.2, fl); c.lineTo(W / 2 + i * W * 0.42, H); c.stroke(); } c.beginPath(); c.moveTo(0, fl + (H - fl) * 0.36); c.lineTo(W, fl + (H - fl) * 0.36); c.stroke();
    ell(c, W * 0.66, fl + (H - fl) * 0.2, u * 9, u * 1.8, 'rgba(0,0,0,0.1)'); ell(c, W * 0.64, fl + (H - fl) * 0.21, u * 4, u * 1, 'rgba(0,0,0,0.1)');
    box(c, 0, fl - u * 3.4, W, u * 3.4, dk); c.fillStyle = p.gold; for (i = -1; i * u * 5 < W; i++) { c.beginPath(); c.moveTo(i * u * 5, fl); c.lineTo(i * u * 5 + u * 2.5, fl); c.lineTo(i * u * 5 + u * 5.4, fl - u * 3.4); c.lineTo(i * u * 5 + u * 2.9, fl - u * 3.4); c.closePath(); c.fill(); } box(c, 0, fl, W, u * 0.9, 'rgba(0,0,0,0.16)');
    rug(c, W * 0.5, fl + (H - fl) * 0.6, W * 0.33, (H - fl) * 0.25, mix(p.accent, '#5a2a3a', 0.35), p.gold, u);
    /* the pegboard and its tools, top left */
    var px = u * 5, py = H * 0.1, pw = u * 31, ph = u * 30, pg = mix('#e6cda4', p.paper, 0.3);
    Rn(c, px - u * 1.2, py - u * 1.2, pw + u * 2.4, ph + u * 2.4, u * 0.9, shade(wd, -0.12)); box(c, px, py, pw, ph, pg);
    c.fillStyle = shade(pg, -0.26); for (j = 0; j < 12; j++) for (i = 0; i < 12; i++) c.fillRect(px + u * 1.5 + i * u * 2.55, py + u * 1.4 + j * u * 2.5, u * 0.5, u * 0.5);
    c.save(); c.translate(px + u * 6, py + u * 5); c.rotate(-0.12); box(c, -u * 0.8, 0, u * 1.6, u * 12, wd); Rn(c, -u * 3.6, -u * 2.4, u * 7.2, u * 3.2, u * 0.6, '#8a8f9c'); box(c, -u * 3.6, -u * 2.4, u * 1.6, u * 3.2, '#6a6f7c'); c.restore();
    c.save(); c.translate(px + u * 13.5, py + u * 3.4); c.rotate(0.1); box(c, -u * 0.9, u * 1.6, u * 1.8, u * 11.4, steel); dot(c, 0, u * 1.2, u * 2.4, steel); dot(c, 0, u * 13.4, u * 1.9, steel); dot(c, 0, u * 13.4, u * 0.9, pg); Pg(c, [[-u * 1, -u * 1.6], [u * 1, -u * 1.6], [u * 0.7, u * 1.4], [-u * 0.7, u * 1.4]], pg, true); c.restore();
    Pg(c, [[px + u * 18, py + u * 4], [px + u * 29, py + u * 6], [px + u * 29, py + u * 9.6], [px + u * 18, py + u * 11.4]], steel, true); c.fillStyle = pg; for (i = 0; i < 7; i++) { c.beginPath(); c.moveTo(px + u * (19.6 + i * 1.4), py + u * (11.2 - i * 0.24)); c.lineTo(px + u * (20.3 + i * 1.4), py + u * (10 - i * 0.2)); c.lineTo(px + u * (21 + i * 1.4), py + u * (11 - i * 0.24)); c.closePath(); c.fill(); } Rn(c, px + u * 14.6, py + u * 3, u * 5, u * 9.4, u * 1.6, p.accent); Rn(c, px + u * 16, py + u * 5.4, u * 2.2, u * 4.6, u * 1, pg);
    for (i = 0; i < 3; i++) { var sx = px + u * (5 + i * 4.4), sc = [p.accent, p.gold, p.accent2][i]; box(c, sx - u * 0.3, py + u * 24 - u * (5 + i), u * 0.6, u * (5 + i), steel); Rn(c, sx - u * 1.1, py + u * 17.4 - u * i - u * 4, u * 2.2, u * 5.4, u * 1, sc); box(c, sx - u * 1.1, py + u * 15.6 - u * i, u * 2.2, u * 0.5, shade(sc, -0.2)); }
    c.beginPath(); c.arc(px + u * 22, py + u * 21, u * 3.6, 0, TAU); c.lineWidth = u * 2.2; c.strokeStyle = p.gold; c.stroke(); c.beginPath(); c.arc(px + u * 22, py + u * 21, u * 4.6, PI * 1.1, PI * 1.5); c.lineWidth = u * 0.4; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.stroke();
    box(c, px + u * 27.4, py + u * 16, u * 1.3, u * 7, wd); Rn(c, px + u * 26.6, py + u * 22.4, u * 2.9, u * 1.4, u * 0.3, steel); Pg(c, [[px + u * 26.4, py + u * 23.8], [px + u * 29.7, py + u * 23.8], [px + u * 30, py + u * 27.6], [px + u * 26.1, py + u * 27.6]], dk, true);
    /* two blank gig posters under it */
    c.save(); c.translate(u * 12, py + ph + u * 15); c.rotate(-0.05); box(c, -u * 7, -u * 9, u * 14, u * 18, p.paper); box(c, -u * 7, -u * 9, u * 14, u * 18, alpha(p.accent, 0.16)); starPath(c, 0, -u * 1.6, u * 5 * (1 + 0.05 * k), u * 2.2, 5, 0); c.fillStyle = p.accent; c.fill(); box(c, -u * 4.6, u * 4.8, u * 9.2, u * 0.9, alpha(p.ink, 0.5)); box(c, -u * 3.2, u * 6.6, u * 6.4, u * 0.7, alpha(p.ink, 0.35)); box(c, -u * 2, -u * 9.8, u * 4, u * 1.8, 'rgba(255,255,255,0.5)'); c.restore();
    c.save(); c.translate(u * 28.6, py + ph + u * 13.4); c.rotate(0.07); box(c, -u * 6, -u * 8, u * 12, u * 16, mix(p.accent2, '#1c1a22', 0.5)); Pg(c, [[u * 1.6, -u * 6], [-u * 3, u * 0.6], [-u * 0.2, u * 0.6], [-u * 1.8, u * 6], [u * 3.2, -u * 1.2], [u * 0.4, -u * 1.2]], p.gold, true); box(c, -u * 2, -u * 8.8, u * 4, u * 1.8, 'rgba(255,255,255,0.5)'); c.restore();
    /* the shelf, top right: paint, a box, and a bicycle wheel on its hook */
    var shx = W - u * 33, shy = H * 0.2, shw = u * 30;
    Pg(c, [[shx + u * 3, shy + u * 1.4], [shx + u * 6.4, shy + u * 1.4], [shx + u * 3, shy + u * 5]], dk, true); Pg(c, [[shx + shw - u * 3, shy + u * 1.4], [shx + shw - u * 6.4, shy + u * 1.4], [shx + shw - u * 3, shy + u * 5]], dk, true); Rn(c, shx, shy, shw, u * 1.5, u * 0.5, wd);
    for (i = 0; i < 3; i++) { var cxp = shx + u * (4.4 + i * 6), cc = [p.accent, p.accent2, p.gold][i], chh = u * (5.4 + (i % 2) * 1.2); Rn(c, cxp - u * 2.5, shy - chh, u * 5, chh, u * 0.5, steel); box(c, cxp - u * 2.5, shy - chh * 0.7, u * 5, chh * 0.42, cc); Rn(c, cxp - u * 2.7, shy - chh - u * 0.5, u * 5.4, u * 1, u * 0.4, '#8a8f9c'); Rn(c, cxp + u * 0.6, shy - chh - u * 0.2, u * 1.2, u * 2.6 + (i % 2) * u * 1, u * 0.6, cc); c.beginPath(); c.arc(cxp, shy - chh * 0.9, u * 2.3, PI * 1.1, PI * 1.9); c.lineWidth = u * 0.3; c.strokeStyle = '#6a6f7c'; c.stroke(); }
    var cbx = shx + u * 20.4; box(c, cbx, shy - u * 7.4, u * 8.4, u * 7.4, mix('#c99a5a', p.gold, 0.15)); box(c, cbx + u * 3.4, shy - u * 7.4, u * 1.6, u * 7.4, 'rgba(255,255,255,0.3)'); box(c, cbx, shy - u * 7.4, u * 8.4, u * 0.8, 'rgba(0,0,0,0.12)');
    var bwx = W - u * 15, bwy = shy + u * 16.4, bwr = u * 9.4, rot = t * 0.08; box(c, bwx - u * 0.5, shy + u * 1.5, u * 1, u * 5.6, dk);
    c.strokeStyle = alpha(steel, 0.8); c.lineWidth = Math.max(0.5, u * 0.18); c.beginPath(); for (i = 0; i < 14; i++) { c.moveTo(bwx, bwy); c.lineTo(bwx + Math.cos(rot + i / 14 * TAU) * bwr, bwy + Math.sin(rot + i / 14 * TAU) * bwr); } c.stroke();
    c.beginPath(); c.arc(bwx, bwy, bwr, 0, TAU); c.lineWidth = u * 1.5; c.strokeStyle = dk; c.stroke(); c.beginPath(); c.arc(bwx, bwy, bwr - u * 1, 0, TAU); c.lineWidth = u * 0.5; c.strokeStyle = steel; c.stroke(); dot(c, bwx, bwy, u * 1.1, steel);
    /* the drums, left */
    ell(c, u * 21, fl + u * 13, u * 22, u * 2.6, 'rgba(0,0,0,0.16)'); drumkit(c, u * 21, fl + u * 13, u * 42, p, k);
    /* the amplifier stack, the guitar leaning on it, the microphone */
    var ax = W - u * 29, aw = u * 25, ab = fl + u * 10;
    ell(c, ax + aw / 2, ab, aw * 0.6, u * 2, 'rgba(0,0,0,0.18)'); Rn(c, ax, ab - u * 27, aw, u * 27, u * 1.6, dk); Rn(c, ax + u * 1.5, ab - u * 25.5, aw - u * 3, u * 24, u * 1, shade(dk, 0.16));
    for (j = 0; j < 2; j++) for (i = 0; i < 2; i++) { var scx = ax + aw * (0.28 + i * 0.44), scy = ab - u * 19.4 + j * u * 11.6, pu = 1 + 0.05 * k * ((i + j) % 2 ? 1 : 0.6); dot(c, scx, scy, u * 4.9, '#1c1a22'); dot(c, scx, scy, u * 4 * pu, shade(dk, 0.34)); dot(c, scx, scy, u * 1.7 * pu, '#15131a'); }
    for (i = 0; i < 4; i++) dot(c, ax + (i % 2 ? aw - u * 1 : u * 1), ab - (i < 2 ? u * 26 : u * 1), u * 0.6, steel);
    Rn(c, ax + u * 1.6, ab - u * 37, aw - u * 3.2, u * 10, u * 1.3, dk); Rn(c, ax + u * 3.2, ab - u * 33, aw - u * 6.4, u * 4, u * 0.7, p.gold); for (i = 0; i < 5; i++) { dot(c, ax + u * 5.4 + i * u * 3, ab - u * 31, u * 1, dk); L(c, ax + u * 5.4 + i * u * 3, ab - u * 31, ax + u * 5.4 + i * u * 3 + Math.cos(i * 1.3 - 2) * u * 0.9, ab - u * 31 + Math.sin(i * 1.3 - 2) * u * 0.9, u * 0.25, p.gold); }
    glow(c, ax + aw - u * 5, ab - u * 31, u * (3 + 2 * k), p.accent, 0.8); dot(c, ax + aw - u * 5, ab - u * 31, u * 0.8, mix(p.accent, '#ffffff', 0.3 + 0.4 * k)); Rn(c, ax + aw / 2 - u * 3, ab - u * 37.8, u * 6, u * 1.4, u * 0.7, '#4a4450');
    c.beginPath(); c.moveTo(ax - u * 3, ab + u * 1.6); c.bezierCurveTo(ax - u * 14, ab + u * 9, ax + u * 2, ab + u * 13, ax + u * 12, ab + u * 6); c.bezierCurveTo(ax + u * 16, ab + u * 3.4, ax + u * 10, ab + u * 1, ax + u * 8, ab - u * 0.6); c.lineWidth = u * 0.6; c.strokeStyle = dk; c.stroke();
    guitar(c, ax - u * 4.4, ab + u * 2.4, u * 40, 0.2, p.accent, p);
    var mx = W - u * 41, mb = fl + u * 5; L(c, mx, mb, mx, mb - u * 34, u * 0.6, steel); L(c, mx, mb - u * 1.4, mx - u * 4.4, mb + u * 0.6, u * 0.6, steel); L(c, mx, mb - u * 1.4, mx + u * 4.4, mb + u * 0.6, u * 0.6, steel); L(c, mx, mb - u * 1.4, mx, mb + u * 1.4, u * 0.6, steel);
    c.save(); c.translate(mx, mb - u * 34); c.rotate(-0.5); Rn(c, -u * 0.9, -u * 4.4, u * 1.8, u * 5.4, u * 0.6, dk); dot(c, 0, -u * 5.2, u * 1.7, steel); c.strokeStyle = '#8a8f9c'; c.lineWidth = u * 0.25; c.beginPath(); c.arc(0, -u * 5.2, u * 1.7, 0.2, PI - 0.2); c.stroke(); c.restore();
    for (i = 0; i < 3; i++) { var pdx = W - u * 50 + i * u * 5.6, pdy = fl + u * 22; Rn(c, pdx, pdy - u * 2.6, u * 4.6, u * 3.4, u * 0.6, [p.accent2, p.gold, p.accent][i]); dot(c, pdx + u * 2.3, pdy - u * 0.4, u * 0.8, steel); dot(c, pdx + u * 1.2, pdy - u * 1.9, u * 0.4, dk); dot(c, pdx + u * 3.4, pdy - u * 1.9, u * 0.4, dk); dot(c, pdx + u * 2.3, pdy - u * 2, u * 0.35, (i + o.n) % 3 === 0 ? '#ff5a5a' : '#5a2a2a'); }
    bulbs(c, -u * 2, u * 2.4, W + u * 2, u * 2.4, u * 3.2, Math.max(7, Math.round(W / (u * 11))), u, o, t, true);
  }, { variants: ['one'], stage: 'cast-low' });
});
