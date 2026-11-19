/* Send a Carol art pack: backdrops of the town (a city street, a rooftop, a market, a library, a book cafe, a diner,
   a bakery, a flower shop, a record shop, a classroom). Blocks only come in through CarolArt.add; nothing here
   replaces launch art. Shop signs carry shapes and icons only: no words, no brands. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, dot = K.dot, Rn = K.Rn, L = K.L, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd, glow = K.glow, vgrad = K.vgrad, vgrad2 = K.vgrad2;

  /* ---------- small tools ---------- */
  function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function poly(c, pts, col) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fillStyle = col; c.fill(); }
  function ell(c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = col; c.fill(); }
  function ring(c, x, y, r, w, col) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  /* the time of day: k = how far the light has gone (0 day .. 1 night) */
  function env(v) { var k = v === 'night' ? 1 : v === 'evening' ? 0.7 : v === 'dusk' ? 0.5 : 0; return { v: v || 'day', k: k, night: k === 1 }; }
  /* an outdoor colour in that light */
  function tint(col, e) { if (!e.k) return col; return e.night ? mix(col, '#0e1236', 0.6) : mix(mix(col, '#8a4a6a', e.k * 0.4), '#1c1640', e.k * 0.3); }
  /* an indoor colour in that light (lamps are on, the room keeps its colour) */
  function dim(col, e) { return e.k ? mix(col, '#241a3c', e.k * 0.36) : col; }
  function horizonCol(p, e) { return e.night ? mix(p.bg2, '#2a2f7a', 0.62) : e.k ? mix(p.bg2, '#ffb37a', 0.55) : p.bg2; }

  function sky(c, W, H, p, e, hz, o, t, u, sx, sy, x0, x1) { /* sky down to hz, with its sun or moon at (sx, sy) and drifting clouds */
    var i, R0 = rnd(o.seed + 'sky');
    if (!e.k) vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.5), p.bg2], 0, hz);
    else if (!e.night) vgrad(c, W, H, [mix(p.bg, '#1f1a52', 0.5), mix(p.bg, '#7a468c', 0.36), mix(p.bg2, '#ff8f66', 0.5), mix(p.bg2, '#ffd58a', 0.6)], 0, hz);
    else vgrad(c, W, H, [mix(p.bg, '#04061a', 0.75), mix(p.bg, '#0e164a', 0.62), mix(p.bg2, '#2a2f7a', 0.62)], 0, hz);
    if (e.night) { K.skyStars(c, W, H, 70, o.seed, t, hz * 0.82); K.moonDisc(c, sx, sy, u * 6, '#fff6d8'); }
    else if (!e.k) { glow(c, sx, sy, u * 30, '#fff6c8', 0.55); dot(c, sx, sy, u * 7, '#ffe27a'); dot(c, sx - u * 1.8, sy - u * 1.8, u * 4.2, 'rgba(255,255,255,0.28)'); }
    else { K.skyStars(c, W, H, 16, o.seed, t, hz * 0.3); glow(c, sx, hz - u * 5, u * 46, '#ffd27a', 0.55); dot(c, sx, hz - u * 5, u * 10, '#ffe9a8'); }
    var cc = e.night ? 'rgba(170,180,232,0.13)' : e.k ? 'rgba(255,205,180,0.5)' : 'rgba(255,255,255,0.9)';
    for (i = 0; i < 4; i++) { var cw = u * (15 + R0() * 15), cx = frac(R0() + t * 0.005 * (1 + i * 0.3)) * (W + cw * 2) - cw, cy = H * (0.045 + R0() * 0.22); K.cloud(c, cx, cy, cw, cc); }
  }

  function skyline(c, W, base, u, seed, col, hmin, hmax, e, t, side, wa) { /* a row of far buildings, taller toward the sides */
    var R0 = rnd(seed), x = -u * 3, i = 0, j, k, lit = e.night ? '#ffe39a' : e.k ? '#ffd98a' : shade(col, 0.2), pr = e.night ? 0.5 : e.k ? 0.36 : 0.4;
    while (x < W) {
      var bw = u * (5 + R0() * 6.5), f = Math.abs((x + bw / 2) / W - 0.5) * 2, bh = (hmin + R0() * (hmax - hmin)) * (1 - side + side * (0.2 + f * 1.15)), top = base - bh, kind = Math.floor(R0() * 6);
      c.fillStyle = col; c.fillRect(x, top, bw + 0.6, bh + 1);
      if (kind === 0) { c.fillRect(x + bw * 0.46, top - u * 4, u * 0.35, u * 4); if (e.k) dot(c, x + bw * 0.46 + u * 0.17, top - u * 4, u * 0.5, Math.sin(t * 2.2 + i) > 0 ? '#ff6a6a' : alpha('#ff6a6a', 0.3)); }
      else if (kind === 1) c.fillRect(x + bw * 0.2, top - u * 1.8, bw * 0.6, u * 2);
      else if (kind === 2) poly(c, [x, top + 1, x + bw / 2, top - bw * 0.32, x + bw + 0.6, top + 1], col);
      else if (kind === 3) { c.fillRect(x + bw * 0.25, top - u * 3, bw * 0.4, u * 2); poly(c, [x + bw * 0.2, top - u * 3, x + bw * 0.45, top - u * 4.2, x + bw * 0.7, top - u * 3], col); c.fillRect(x + bw * 0.28, top - u * 1.1, u * 0.3, u * 1.2); c.fillRect(x + bw * 0.6, top - u * 1.1, u * 0.3, u * 1.2); }
      else if (kind === 4) { c.fillRect(x + bw * 0.1, top - u, bw * 0.28, u * 1.2); c.fillRect(x + bw * 0.62, top - u * 1.6, bw * 0.18, u * 1.8); }
      c.fillStyle = lit; c.globalAlpha = wa;
      var nc = Math.max(1, Math.floor((bw - u) / (u * 1.7))), nr = Math.min(11, Math.floor((bh - u * 1.5) / (u * 2.3))), gx = (bw - nc * u * 1.7) / 2;
      for (j = 0; j < nr; j++) for (k = 0; k < nc; k++) { var r = R0(); if (r < pr || (r > 0.93 && Math.sin(t * 0.5 + i * 3 + j + k * 2) > 0.2)) c.fillRect(x + gx + k * u * 1.7 + u * 0.35, top + u * 1.3 + j * u * 2.3, u, u * 1.3); }
      c.globalAlpha = 1;
      x += bw + (R0() < 0.25 ? u * 1.2 : 0); i++;
    }
  }

  function bulbs(c, x1, y1, x2, y2, sag, n, u, o, t, col, on) { /* a drooping wire of warm bulbs; lit ones swap on the beat */
    var i, k = Math.exp(-5 * o.beat), cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + sag * 2;
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(cx, cy, x2, y2); c.lineWidth = Math.max(0.6, u * 0.32); c.strokeStyle = 'rgba(36,28,44,0.75)'; c.stroke();
    for (i = 0; i < n; i++) {
      var f = (i + 0.5) / n, g = 1 - f, bx = g * g * x1 + 2 * g * f * cx + f * f * x2, by = g * g * y1 + 2 * g * f * cy + f * f * y2 + u * 1.1, lit = (i + o.n) % 2 === 0;
      if (on) dot(c, bx, by, u * (lit ? 2.7 + k * 1.3 : 1.9), alpha(col, lit ? 0.3 : 0.15));
      rect(c, bx - u * 0.32, by - u * 1.2, u * 0.64, u * 0.7, '#3a3040');
      dot(c, bx, by, u * 0.82, on ? (lit ? '#fff8dc' : mix(col, '#ffffff', 0.25)) : mix(col, '#ffffff', 0.55));
    }
  }

  function awning(c, x, y, w, h, n, c1, c2, u, ins) { /* a striped awning with a scalloped hem; ins = how far the top is set in */
    var i, sw = w / n, tw = (w - (ins || 0) * 2) / n, tx = x + (ins || 0);
    for (i = 0; i < n; i++) poly(c, [tx + i * tw, y, tx + (i + 1) * tw + 0.5, y, x + (i + 1) * sw + 0.5, y + h, x + i * sw, y + h], i % 2 ? c2 : c1);
    rect(c, x, y + h - u * 0.5, w, u * 0.5, 'rgba(0,0,0,0.1)');
    for (i = 0; i < n; i++) { c.beginPath(); c.arc(x + (i + 0.5) * sw, y + h - 0.5, sw / 2, 0, PI); c.fillStyle = shade(i % 2 ? c2 : c1, -0.1); c.fill(); }
    poly(c, [tx, y, tx + w - (ins || 0) * 2, y, x + w, y + h * 0.3, x, y + h * 0.3], 'rgba(255,255,255,0.13)');
  }

  function icon(c, kind, x, y, s, col, col2) { /* the little pictures on shop signs */
    var i, a;
    if (kind === 'cup') { Rn(c, x - s * 0.34, y - s * 0.1, s * 0.56, s * 0.46, s * 0.12, col); c.beginPath(); c.arc(x + s * 0.24, y + s * 0.1, s * 0.15, -PI / 2, PI / 2); c.lineWidth = s * 0.09; c.strokeStyle = col; c.stroke(); c.lineCap = 'round'; c.lineWidth = s * 0.07; for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(x - s * 0.06 + i * s * 0.13, y - s * 0.18); c.quadraticCurveTo(x - s * 0.06 + i * s * 0.13 + s * 0.11, y - s * 0.3, x - s * 0.06 + i * s * 0.13, y - s * 0.42); c.stroke(); } }
    else if (kind === 'loaf') { ell(c, x, y + s * 0.04, s * 0.44, s * 0.27, col); for (i = -1; i <= 1; i++) L(c, x + i * s * 0.2 - s * 0.06, y - s * 0.09, x + i * s * 0.2 + s * 0.06, y + s * 0.1, s * 0.07, col2); }
    else if (kind === 'flower') { for (i = 0; i < 6; i++) { a = i / 6 * TAU; ell(c, x + Math.cos(a) * s * 0.25, y + Math.sin(a) * s * 0.25, s * 0.19, s * 0.19, col); } dot(c, x, y, s * 0.15, col2); }
    else if (kind === 'note') { ell(c, x - s * 0.12, y + s * 0.26, s * 0.18, s * 0.14, col, -0.4); rect(c, x + s * 0.01, y - s * 0.36, s * 0.08, s * 0.62, col); poly(c, [x + s * 0.01, y - s * 0.38, x + s * 0.34, y - s * 0.2, x + s * 0.3, y - s * 0.02, x + s * 0.09, y - s * 0.16], col); }
    else if (kind === 'book') { poly(c, [x, y - s * 0.2, x - s * 0.42, y - s * 0.3, x - s * 0.42, y + s * 0.2, x, y + s * 0.3], col); poly(c, [x, y - s * 0.2, x + s * 0.42, y - s * 0.3, x + s * 0.42, y + s * 0.2, x, y + s * 0.3], shade(col, -0.22)); L(c, x - s * 0.3, y - s * 0.08, x - s * 0.1, y - s * 0.03, s * 0.05, col2); L(c, x - s * 0.3, y + s * 0.06, x - s * 0.1, y + s * 0.11, s * 0.05, col2); }
    else if (kind === 'wheat') { L(c, x, y + s * 0.42, x, y - s * 0.3, s * 0.07, col); for (i = 0; i < 4; i++) { ell(c, x - s * 0.13, y - s * 0.3 + i * s * 0.17, s * 0.13, s * 0.07, col, 0.8); ell(c, x + s * 0.13, y - s * 0.3 + i * s * 0.17, s * 0.13, s * 0.07, col, -0.8); } ell(c, x, y - s * 0.4, s * 0.07, s * 0.12, col); }
    else { K.starPath(c, x, y, s * 0.42, s * 0.19, 5, 0); c.fillStyle = col; c.fill(); }
  }
  function hangSign(c, x, y, r, dir, kind, bg, fg, fg2, u, t) { /* a round sign on a bracket reaching out from a wall at (x, y) */
    var sx = x + dir * r * 1.25;
    L(c, x, y, sx + dir * r * 0.2, y, u * 0.5, '#2a2430'); L(c, x, y + r * 0.9, x + dir * r * 0.8, y, u * 0.3, '#2a2430');
    c.save(); c.translate(sx, y); c.rotate(Math.sin(t * 1.3 + x * 0.01) * 0.07);
    L(c, 0, 0, 0, r * 0.4, u * 0.3, '#2a2430'); dot(c, 0, r * 1.35, r, shade(fg, -0.25)); dot(c, 0, r * 1.35, r * 0.86, bg); icon(c, kind, 0, r * 1.35, r * 1.35, fg, fg2);
    c.restore();
  }

  /* a street house: rows of windows with boxes of flowers, a shop with an awning at its foot */
  function facade(c, x, w, top, base, col, e, t, seed, u, p, awn, ic, dir) {
    var R0 = rnd(seed), bc = tint(col, e), i, j, k, sh = u * 15, wy0 = top + u * 4.6, nC = Math.max(2, Math.round(w / (u * 6.8))), cw = w / nC, ww = cw * 0.5, nR = Math.max(1, Math.floor((base - sh - wy0) / (u * 10.5))), rh = (base - sh - wy0) / nR, wh = Math.min(u * 6.6, rh * 0.62), fr = shade(bc, 0.32),
      glass = e.night ? mix(bc, '#0a0e2a', 0.6) : mix(bc, e.k ? '#ffc9a0' : '#d4ecfa', 0.66), warm = e.k > 0.3;
    rect(c, x, top, w, base - top, bc);
    c.fillStyle = shade(bc, -0.07); for (i = 0; i < 18; i++) c.fillRect(x + R0() * (w - u * 2.6), wy0 + R0() * (base - sh - wy0 - u), u * 2.6, u * 0.7);
    rect(c, x - u * 0.7, top - u * 1.3, w + u * 1.4, u * 2.4, shade(bc, 0.24)); rect(c, x - u * 0.7, top + u * 1.1, w + u * 1.4, u * 0.6, shade(bc, -0.22));
    c.fillStyle = shade(bc, 0.14); for (i = 0; i * u * 2 + u * 1.4 < w; i++) c.fillRect(x + i * u * 2 + u * 0.4, top + u * 1.7, u, u * 0.8);
    for (j = 0; j < nR; j++) for (i = 0; i < nC; i++) {
      var wx = x + cw * i + (cw - ww) / 2, wy = wy0 + j * rh + (rh - wh) * 0.3, r = R0(), lit = e.k > 0 && (r < e.k * 0.62 || (r > 0.9 && Math.sin(t * 0.35 + i * 2 + j * 3) > 0));
      c.beginPath(); c.arc(wx + ww / 2, wy, ww / 2 + u * 0.6, PI, 0); c.fillStyle = fr; c.fill();
      rect(c, wx - u * 0.6, wy, ww + u * 1.2, wh + u * 0.6, fr);
      c.beginPath(); c.arc(wx + ww / 2, wy, ww / 2, PI, 0); c.fillStyle = lit ? '#ffdf8a' : glass; c.fill(); rect(c, wx, wy - 0.5, ww, wh + 0.5, lit ? '#ffdf8a' : glass);
      if (lit) { rect(c, wx, wy + wh * 0.6, ww, wh * 0.4, 'rgba(255,160,60,0.28)'); poly(c, [wx, wy - ww * 0.3, wx + ww * 0.36, wy - ww * 0.3, wx, wy + wh * 0.7], alpha(p.accent, 0.5)); poly(c, [wx + ww, wy - ww * 0.3, wx + ww * 0.64, wy - ww * 0.3, wx + ww, wy + wh * 0.7], alpha(p.accent, 0.5)); }
      else poly(c, [wx + ww * 0.12, wy + wh, wx + ww * 0.62, wy, wx + ww * 0.92, wy, wx + ww * 0.42, wy + wh], 'rgba(255,255,255,0.18)');
      rect(c, wx, wy + wh * 0.42, ww, u * 0.45, fr); rect(c, wx + ww / 2 - u * 0.22, wy - ww / 2, u * 0.45, wh * 0.42 + ww / 2, fr);
      rect(c, wx - u, wy + wh + u * 0.5, ww + u * 2, u * 0.8, shade(bc, -0.2));
      if ((i + j * 2 + (dir > 0 ? 1 : 0)) % 3 === 0) { rect(c, wx - u * 0.6, wy + wh - u * 0.7, ww + u * 1.2, u * 1.6, tint(mix('#8a5a34', p.ink, 0.2), e)); for (k = 0; k < 4; k++) dot(c, wx + ww * (k + 0.5) / 4, wy + wh - u * (1 + (k % 2) * 0.35) + Math.sin(t * 1.4 + k + i) * u * 0.08, u * 0.9, tint(k % 2 ? p.accent2 : (j % 2 ? p.gold : p.accent), e)); }
    }
    var sy = base - sh, dw = Math.min(u * 4.6, w * 0.3), dx = dir > 0 ? x + u * 1.2 : x + w - dw - u * 1.2, gx = dir > 0 ? dx + dw + u : x + u * 1.2, gw = w - dw - u * 3.4, shc = tint(shade(awn, -0.38), e), gl = warm ? '#ffe2a0' : mix(shc, '#dcf0fa', 0.72);
    rect(c, x, sy, w, sh, shc); rect(c, x, sy, w, u * 0.7, shade(shc, -0.2));
    rect(c, gx, sy + u * 5.8, gw, sh - u * 8.4, gl);
    if (warm) rect(c, gx, sy + sh - u * 5.4, gw, u * 2.8, 'rgba(255,150,60,0.3)'); else poly(c, [gx, sy + sh - u * 3.4, gx + gw * 0.5, sy + u * 5.8, gx + gw * 0.85, sy + u * 5.8, gx + gw * 0.2, sy + sh - u * 2.6, gx, sy + sh - u * 2.6], 'rgba(255,255,255,0.2)');
    for (i = 0; i < 3; i++) { var ix = gx + gw * (i + 0.5) / 3; rect(c, ix - u * 0.7, sy + sh - u * 4.1, u * 1.4, u * 1.5, alpha(shc, 0.6)); dot(c, ix, sy + sh - u * 4.9, u * (0.9 + (i % 2) * 0.3), alpha(i % 2 ? tint(p.accent, e) : tint(awn, e), 0.75)); }
    rect(c, gx - u * 0.4, sy + sh - u * 2.7, gw + u * 0.8, u * 0.6, shade(shc, 0.3));
    rect(c, dx, sy + u * 5.8, dw, sh - u * 5.8, tint(shade(awn, -0.08), e)); rect(c, dx + u * 0.7, sy + u * 6.6, dw - u * 1.4, (sh - u * 5.8) * 0.5, gl); dot(c, dx + (dir > 0 ? dw - u * 0.8 : u * 0.8), sy + u * 5.8 + (sh - u * 5.8) * 0.66, u * 0.42, p.gold);
    awning(c, x - u, sy + u * 0.6, w + u * 2, u * 4.4, Math.max(4, Math.round(w / (u * 2.7))), tint(awn, e), tint(p.paper, e), u, u * 1.4);
    if (ic) hangSign(c, dir > 0 ? x + w : x, sy - u * 6.5, u * 2.9, dir, ic, tint(p.paper, e), tint(shade(awn, -0.2), e), tint(p.paper, e), u, t);
    if (warm) glow(c, x + w / 2, base, w * 0.95, '#ffd27a', 0.3 * e.k);
  }

  function lampPost(c, x, base, h, dir, e, u) {
    var col = e.night ? '#16162c' : '#2e2c3e', lx = x + dir * u * 4.4, ly = base - h - u * 0.2;
    rect(c, x - u, base - u * 2.4, u * 2, u * 2.4, col); rect(c, x - u * 0.45, base - h, u * 0.9, h, col); rect(c, x - u * 0.8, base - h * 0.55, u * 1.6, u * 0.6, col);
    c.beginPath(); c.moveTo(x, base - h + u * 0.4); c.quadraticCurveTo(x + dir * u * 0.4, base - h - u * 2.6, lx, base - h - u * 1.6); c.lineWidth = u * 0.8; c.strokeStyle = col; c.lineCap = 'round'; c.stroke();
    if (e.night) poly(c, [lx - u * 1.5, ly + u * 1.4, lx + u * 1.5, ly + u * 1.4, lx + u * 10, base, lx - u * 10, base], 'rgba(255,226,160,0.08)');
    if (e.k) glow(c, lx, ly + u, u * (e.night ? 20 : 13), '#ffe2a0', e.night ? 0.55 : 0.38);
    poly(c, [lx - u * 2, ly + u * 1.1, lx - u * 1.1, ly - u * 1.4, lx + u * 1.1, ly - u * 1.4, lx + u * 2, ly + u * 1.1], col);
    ell(c, lx, ly + u * 1.2, u * 1.6, u * 0.9, e.k ? '#fff3c8' : '#f4f0e4');
  }

  function car(c, x, y, s, dir, col, e, t) { /* wheels stand on y */
    var b = Math.sin(t * 9) * 0.03, gl = e.k ? '#ffe9a8' : '#d8effa';
    c.save(); c.translate(x, y); c.scale(dir * s, s);
    if (e.k) poly(c, [1.6, -0.75, 5, -1.25, 5, 0, 1.6, -0.45], 'rgba(255,240,180,0.2)');
    ell(c, 0, 0, 1.9, 0.14, 'rgba(0,0,0,0.25)');
    c.beginPath(); c.moveTo(-1, -0.9 + b); c.quadraticCurveTo(-0.78, -1.66 + b, -0.15, -1.66 + b); c.lineTo(0.45, -1.66 + b); c.quadraticCurveTo(0.95, -1.6 + b, 1.22, -0.9 + b); c.closePath(); c.fillStyle = shade(col, -0.14); c.fill();
    Rn(c, -1.65, -1 + b, 3.3, 0.78, 0.3, col); rect(c, -1.65, -0.5 + b, 3.3, 0.1, shade(col, -0.2)); rect(c, -1.5, -0.95 + b, 3, 0.1, 'rgba(255,255,255,0.3)');
    Rn(c, -0.7, -1.52 + b, 0.64, 0.5, 0.1, gl); Rn(c, 0.06, -1.52 + b, 0.72, 0.5, 0.1, gl);
    dot(c, -0.95, -0.32, 0.37, '#22202a'); dot(c, -0.95, -0.32, 0.16, '#cfcfd8'); dot(c, 0.95, -0.32, 0.37, '#22202a'); dot(c, 0.95, -0.32, 0.16, '#cfcfd8');
    dot(c, 1.56, -0.66 + b, 0.13, '#fff3c0'); rect(c, -1.66, -0.78 + b, 0.1, 0.24, '#ff5a5a');
    c.restore();
  }

  /* ---------- the city street ---------- */
  Art.add('backdrop', 'citystreet', function (c, W, H, t, p, o, u) {
    var e = env(o.variant), fl = H * 0.68, i, R0 = rnd(o.seed + 'cs'), hzc = horizonCol(p, e), ink = tint(p.ink, e), side = H * 0.068, road = fl + side;
    sky(c, W, H, p, e, fl, o, t, u, e.night ? W * 0.7 : e.k ? W * 0.44 : W * 0.72, H * 0.1);
    if (!e.k) { c.strokeStyle = alpha(p.ink, 0.5); c.lineWidth = u * 0.3; c.lineCap = 'round'; for (i = 0; i < 4; i++) { var bx = frac(0.2 + i * 0.07 + t * 0.012) * (W + u * 20) - u * 10, by = H * (0.2 + (i % 2) * 0.03 + i * 0.012) + Math.sin(t * 0.9 + i) * u, fp = Math.sin(t * 7 + i * 2) * u * 0.5; c.beginPath(); c.moveTo(bx - u * 1.3, by - fp); c.quadraticCurveTo(bx - u * 0.5, by - u * 0.7, bx, by); c.quadraticCurveTo(bx + u * 0.5, by - u * 0.7, bx + u * 1.3, by - fp); c.stroke(); } }
    skyline(c, W, fl, u, o.seed + 'f', mix(hzc, ink, 0.2), u * 12, u * 30, e, t, 0.5, e.k ? 0.75 : 0.5);
    skyline(c, W, fl, u, o.seed + 'n', mix(hzc, ink, 0.4), u * 7, u * 17, e, t, 0.62, e.k ? 0.95 : 0.5);
    for (i = 0; i < 6; i++) { var tx = W * (0.3 + i * 0.08), th = u * (7.5 + R0() * 3), g = mix(tint(p.accent2, e), hzc, 0.3), sw = Math.sin(t * 0.8 + i) * u * 0.15; rect(c, tx - u * 0.3, fl - th * 0.5, u * 0.6, th * 0.5, mix(hzc, ink, 0.6)); dot(c, tx - th * 0.2 + sw, fl - th * 0.55, th * 0.25, shade(g, -0.1)); dot(c, tx + th * 0.2 + sw, fl - th * 0.58, th * 0.23, shade(g, -0.04)); dot(c, tx + sw, fl - th * 0.74, th * 0.33, g); dot(c, tx - th * 0.08 + sw, fl - th * 0.82, th * 0.16, shade(g, 0.14)); }
    var fc = [mix(p.accent, p.paper, 0.42), mix(p.gold, p.paper, 0.3), mix(p.accent2, p.paper, 0.45), mix(mix(p.accent, p.gold, 0.55), p.paper, 0.35)];
    facade(c, W * 0.13, W * 0.105, H * 0.41, fl, fc[1], e, t, o.seed + 'b', u, p, p.accent2, 'loaf', 1);
    facade(c, -u, W * 0.13 + u, H * 0.19, fl, fc[0], e, t, o.seed + 'a', u, p, p.gold, null, 1);
    facade(c, W * 0.765, W * 0.105, H * 0.45, fl, fc[3], e, t, o.seed + 'd', u, p, p.accent, 'cup', -1);
    facade(c, W * 0.87, W * 0.13 + u, H * 0.26, fl, fc[2], e, t, o.seed + 'c', u, p, p.accent, null, -1);
    /* pavement, kerb, road */
    var pv = tint(mix(p.paper, p.ink, 0.2), e), rc = tint(mix('#5d5f72', p.ink, 0.4), e);
    rect(c, 0, fl, W, side, pv); c.fillStyle = 'rgba(0,0,0,0.09)'; for (i = 0; i * u * 9 < W; i++) c.fillRect(i * u * 9 + u * 3, fl, u * 0.3, side); c.fillRect(0, fl, W, u * 0.5);
    rect(c, 0, road, W, H - road, rc); rect(c, 0, road, W, u * 1.2, shade(pv, -0.3)); vgrad2(c, 0, road, W, H - road, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.2)');
    c.fillStyle = alpha(tint(p.gold, e), 0.85); for (i = 0; i * u * 14 < W; i++) c.fillRect(i * u * 14 + u * 2, H * 0.902, u * 8, u * 0.8);
    var zx = W * 0.5, zw = W * 0.13; for (i = 0; i < 6; i++) { var f0 = i / 6, f1 = (i + 0.55) / 6, y0 = road + u * 2.4 + (H - road) * f0, y1 = road + u * 2.4 + (H - road) * f1; poly(c, [zx - zw * (1 + f0 * 0.5), y0, zx + zw * (1 + f0 * 0.5), y0, zx + zw * (1 + f1 * 0.5), y1, zx - zw * (1 + f1 * 0.5), y1], alpha(tint('#f4f1e8', e), 0.9)); }
    ell(c, W * 0.82, H * 0.945, u * 3.4, u * 1.1, 'rgba(0,0,0,0.2)'); ell(c, W * 0.82, H * 0.943, u * 2.8, u * 0.8, shade(rc, 0.12));
    lampPost(c, W * 0.275, fl + side * 0.55, u * 34, 1, e, u); lampPost(c, W * 0.725, fl + side * 0.55, u * 34, -1, e, u);
    var hx = W * 0.325, hy = fl + side * 0.8, hc = tint(p.accent, e); ell(c, hx, hy, u * 2, u * 0.5, 'rgba(0,0,0,0.2)'); Rn(c, hx - u * 1.1, hy - u * 3.4, u * 2.2, u * 3.4, u * 0.4, hc); Rn(c, hx - u * 1.5, hy - u * 0.7, u * 3, u * 0.8, u * 0.3, shade(hc, -0.2)); dot(c, hx, hy - u * 3.6, u * 1.1, hc); rect(c, hx - u * 1.7, hy - u * 2.6, u * 3.4, u * 0.9, shade(hc, -0.12)); dot(c, hx, hy - u * 2.1, u * 0.45, tint(p.gold, e));
    car(c, W + u * 20 - frac(t * 0.035 + 0.3) * (W + u * 40), H * 0.972, u * 5.6, -1, tint(p.accent, e), e, t);
    car(c, frac(t * 0.028 + 0.62) * (W + u * 40) - u * 20, H * 0.998, u * 6.2, 1, tint(p.gold, e), e, t + 1);
  }, { variants: ['day', 'dusk', 'night'], stage: 'band-low' });

  /* ---------- more small things, shared by the places below ---------- */
  function cat(c, x, y, s, col, t, eye) { /* a cat sitting on y, s tall, its tail flicking */
    c.beginPath(); c.moveTo(x - s * 0.2, y - s * 0.1); c.quadraticCurveTo(x - s * 0.75, y, x - s * 0.62 + Math.sin(t * 1.6) * s * 0.14, y - s * 0.5); c.lineWidth = s * 0.11; c.lineCap = 'round'; c.strokeStyle = col; c.stroke();
    ell(c, x, y - s * 0.3, s * 0.3, s * 0.32, col); dot(c, x + s * 0.06, y - s * 0.7, s * 0.21, col);
    poly(c, [x - s * 0.13, y - s * 0.78, x - s * 0.08, y - s * 1.02, x + s * 0.04, y - s * 0.86], col); poly(c, [x + s * 0.08, y - s * 0.86, x + s * 0.2, y - s * 1.02, x + s * 0.26, y - s * 0.76], col);
    if (eye) { dot(c, x - s * 0.02, y - s * 0.72, s * 0.035, eye); dot(c, x + s * 0.14, y - s * 0.72, s * 0.035, eye); }
  }
  function plant(c, x, base, s, pot, leaf, t) { /* a leafy pot standing on base */
    var i, sw = Math.sin(t * 0.9 + x * 0.01) * 0.05;
    for (i = 0; i < 7; i++) K.leaf(c, x, base - s * 0.42, s * (0.64 - Math.abs(i - 3) * 0.06), -PI / 2 + (i - 3) * 0.37 + sw, i % 2 ? leaf : shade(leaf, -0.14));
    poly(c, [x - s * 0.24, base - s * 0.46, x + s * 0.24, base - s * 0.46, x + s * 0.17, base, x - s * 0.17, base], pot); rect(c, x - s * 0.27, base - s * 0.5, s * 0.54, s * 0.1, shade(pot, 0.16));
  }
  function mug(c, x, base, s, col, t, st) {
    c.beginPath(); c.arc(x + s * 0.5, base - s * 0.42, s * 0.22, -PI / 2, PI / 2); c.lineWidth = s * 0.13; c.strokeStyle = col; c.stroke();
    Rn(c, x - s * 0.5, base - s * 0.8, s, s * 0.8, s * 0.16, col); ell(c, x, base - s * 0.76, s * 0.4, s * 0.1, shade(col, -0.35)); rect(c, x - s * 0.36, base - s * 0.5, s * 0.12, s * 0.3, 'rgba(255,255,255,0.3)');
    if (st) K.steam(c, x, base - s * 0.9, s * 1.1, t + x, 2);
  }
  function dome(c, x, base, s, cake, top, plate) { /* a cake under a glass dome on a stand */
    rect(c, x - s * 0.08, base - s * 0.3, s * 0.16, s * 0.3, plate); ell(c, x, base, s * 0.3, s * 0.06, plate); ell(c, x, base - s * 0.3, s * 0.56, s * 0.08, plate);
    Rn(c, x - s * 0.34, base - s * 0.62, s * 0.68, s * 0.3, s * 0.06, cake); rect(c, x - s * 0.34, base - s * 0.5, s * 0.68, s * 0.06, shade(cake, 0.3)); Rn(c, x - s * 0.36, base - s * 0.68, s * 0.72, s * 0.12, s * 0.06, top); dot(c, x, base - s * 0.72, s * 0.06, '#e8364a');
    c.beginPath(); c.arc(x, base - s * 0.36, s * 0.5, PI, 0); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fill(); c.lineWidth = Math.max(0.6, s * 0.03); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke(); dot(c, x, base - s * 0.88, s * 0.05, plate);
    c.beginPath(); c.arc(x, base - s * 0.36, s * 0.4, PI * 1.15, PI * 1.4); c.lineWidth = s * 0.05; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke();
  }
  function stool(c, x, base, h, r, col, metal) {
    ell(c, x, base, r * 0.9, r * 0.22, 'rgba(0,0,0,0.2)'); ell(c, x, base - r * 0.1, r * 0.7, r * 0.18, metal); rect(c, x - r * 0.12, base - h, r * 0.24, h, metal); ell(c, x, base - h * 0.4, r * 0.55, r * 0.1, shade(metal, -0.2));
    ell(c, x, base - h + r * 0.14, r, r * 0.3, shade(metal, 0.1)); ell(c, x, base - h, r, r * 0.3, col); ell(c, x - r * 0.2, base - h - r * 0.06, r * 0.5, r * 0.1, 'rgba(255,255,255,0.25)');
  }

  /* ---------- rooms ---------- */
  function planks(c, W, H, fl, col, u) { /* floorboards running to the back wall */
    var i; vgrad2(c, 0, fl, W, H - fl, col, shade(col, -0.3));
    c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = Math.max(0.6, u * 0.22); c.beginPath(); for (i = -9; i <= 9; i++) { c.moveTo(W / 2 + i * W * 0.075, fl); c.lineTo(W / 2 + i * W * 0.2, H); } c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.06)'; for (i = 0; i < 12; i++) c.fillRect(frac(i * 0.381 + 0.07) * W, fl + (H - fl) * frac(i * 0.618 + 0.11), u * (5 + (i % 3) * 3), u * 0.3);
    rect(c, 0, fl, W, u * 0.7, 'rgba(0,0,0,0.18)');
  }
  function checker(c, W, H, fl, c1, c2, u, n) { /* a tiled floor seen from the door */
    var r, k, rows = 7, d = H - fl, cw = W / n, h = Math.ceil(n / 2) + 1;
    rect(c, 0, fl, W, d, c1); c.fillStyle = c2; c.beginPath();
    for (r = 0; r < rows; r++) { var y0 = fl + d * Math.pow(r / rows, 1.5), y1 = fl + d * Math.pow((r + 1) / rows, 1.5), s0 = 1 + 1.5 * (y0 - fl) / d, s1 = 1 + 1.5 * (y1 - fl) / d;
      for (k = -h; k < h; k++) if ((r + k) & 1) { c.moveTo(W / 2 + k * cw * s0, y0); c.lineTo(W / 2 + (k + 1) * cw * s0, y0); c.lineTo(W / 2 + (k + 1) * cw * s1, y1 + 0.5); c.lineTo(W / 2 + k * cw * s1, y1 + 0.5); c.closePath(); } }
    c.fill(); vgrad2(c, 0, fl, W, d, 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0)'); rect(c, 0, fl, W, u * 0.7, 'rgba(0,0,0,0.2)');
  }
  function view(c, x, y, w, h, p, e, o, t, u, seed) { /* what a window shows: the sky of the hour over far roofs */
    var R0 = rnd(seed), i, j, g = c.createLinearGradient(0, y, 0, y + h), xx = x - u, far;
    if (e.night) { g.addColorStop(0, mix('#070a26', p.bg, 0.2)); g.addColorStop(1, mix('#2c3186', p.bg2, 0.25)); far = '#141a44'; }
    else if (e.k) { g.addColorStop(0, mix('#3d2f7a', p.bg, 0.25)); g.addColorStop(0.62, mix('#e07a8a', p.bg2, 0.2)); g.addColorStop(1, '#ffcf8a'); far = '#4a3266'; }
    else { g.addColorStop(0, mix('#8fd0f5', p.bg, 0.3)); g.addColorStop(1, mix('#f1faff', p.bg2, 0.3)); far = mix(mix('#9fb6cc', p.bg, 0.3), p.ink, 0.12); }
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = g; c.fillRect(x, y, w, h);
    if (e.night) { c.fillStyle = '#ffffff'; for (i = 0; i < 26; i++) { c.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (1 + R0() * 2) + i)); c.fillRect(x + R0() * w, y + R0() * h * 0.72, u * 0.4, u * 0.4); } c.globalAlpha = 1; dot(c, x + w * 0.76, y + h * 0.26, u * 5.5, 'rgba(255,246,216,0.16)'); dot(c, x + w * 0.76, y + h * 0.26, u * 2.8, '#fff6d8'); }
    else if (e.k) { dot(c, x + w * 0.3, y + h * 0.74, u * 7, 'rgba(255,233,168,0.3)'); dot(c, x + w * 0.3, y + h * 0.74, u * 3.6, '#ffe9a8'); }
    else { dot(c, x + w * 0.8, y + h * 0.24, u * 5.5, 'rgba(255,246,190,0.4)'); dot(c, x + w * 0.8, y + h * 0.24, u * 3, '#fff3b0'); for (i = 0; i < 2; i++) K.cloud(c, x + frac(R0() + t * 0.006 * (1 + i * 0.4)) * (w + u * 18) - u * 9, y + h * (0.2 + i * 0.24), u * (9 + i * 3), 'rgba(255,255,255,0.85)'); }
    i = 0; while (xx < x + w) { var bw = u * (3.5 + R0() * 4.5), bh = h * (0.12 + R0() * 0.3), rf = R0();
      c.fillStyle = i % 2 ? far : shade(far, e.k ? 0.1 : -0.07); c.fillRect(xx, y + h - bh, bw + 0.5, bh + 1); if (rf < 0.4) { c.beginPath(); c.moveTo(xx, y + h - bh + 0.5); c.lineTo(xx + bw / 2, y + h - bh - bw * 0.3); c.lineTo(xx + bw + 0.5, y + h - bh + 0.5); c.fill(); }
      if (e.k) { c.fillStyle = '#ffe39a'; for (j = 0; j < 6; j++) if (R0() < 0.5) c.fillRect(xx + u * 0.7 + (j % 2) * (bw - u * 2.2), y + h - bh + u * (1 + Math.floor(j / 2) * 1.9), u * 0.8, u); }
      xx += bw; i++; }
    c.restore();
  }
  function sheen(c, x, y, w, h) { poly(c, [x + w * 0.08, y + h, x + w * 0.42, y, x + w * 0.6, y, x + w * 0.26, y + h], 'rgba(255,255,255,0.12)'); poly(c, [x + w * 0.66, y + h, x + w, y + h * 0.1, x + w, y + h * 0.36, x + w * 0.78, y + h], 'rgba(255,255,255,0.08)'); }
  function sash(c, x, y, w, h, col, u, nx, ny) { /* the frame, bars and sill of a window */
    var th = u * 1.1, i; c.fillStyle = col;
    c.fillRect(x - th, y - th, w + th * 2, th); c.fillRect(x - th, y + h, w + th * 2, th); c.fillRect(x - th, y, th, h); c.fillRect(x + w, y, th, h);
    for (i = 1; i < nx; i++) c.fillRect(x + w * i / nx - th * 0.3, y, th * 0.6, h); for (i = 1; i < ny; i++) c.fillRect(x, y + h * i / ny - th * 0.3, w, th * 0.6);
    rect(c, x - th * 2.2, y + h + th, w + th * 4.4, th * 1.3, shade(col, -0.08)); rect(c, x - th * 2.2, y + h + th * 2.3, w + th * 4.4, th * 0.5, 'rgba(0,0,0,0.16)');
  }
  function pendant(c, x, len, r, col, e, u) { /* a hanging lamp, on */
    rect(c, x - u * 0.18, 0, u * 0.36, len, '#2a2430');
    glow(c, x, len + r * 0.8, r * (e.k ? 6 : 3.8), '#ffe2a0', e.k ? 0.45 : 0.22); dot(c, x, len + r * 0.78, r * 0.42, '#fff6d0');
    c.beginPath(); c.arc(x, len + r * 0.78, r, PI, 0); c.closePath(); c.fillStyle = col; c.fill();
    rect(c, x - r, len + r * 0.78 - u * 0.25, r * 2, u * 0.5, shade(col, -0.22)); rect(c, x - r * 0.22, len - r * 0.36, r * 0.44, r * 0.3, shade(col, -0.3));
    c.beginPath(); c.arc(x, len + r * 0.78, r * 0.74, PI * 1.12, PI * 1.42); c.lineWidth = r * 0.12; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();
  }
  function books(c, x, y, w, h, seed, cols, u) { /* a row of spines standing on y + h */
    var R0 = rnd(seed), xx = x + u * 0.3, n = 0, j;
    while (xx < x + w - u * 1.7) { var bw = u * (1.1 + R0() * 1.3), bh = h * (0.6 + R0() * 0.38), col = cols[Math.floor(R0() * cols.length)], r = R0();
      if (r < 0.09 && xx < x + w - u * 6) { for (j = 0; j < 3; j++) rect(c, xx + j * u * 0.25, y + h - (j + 1) * u * 1.15, u * (3.8 - j * 0.5), u * 1.05, cols[(n + j) % cols.length]); xx += u * 4.6; }
      else if (r < 0.15) xx += u * 1.4;
      else { rect(c, xx, y + h - bh, bw, bh, col); rect(c, xx, y + h - bh * 0.84, bw, u * 0.35, shade(col, 0.32)); rect(c, xx + bw - u * 0.22, y + h - bh, u * 0.22, bh, 'rgba(0,0,0,0.16)'); xx += bw + u * 0.12; }
      n++; }
  }
  function shelfCase(c, x, y, w, h, wood, seed, cols, u, rowH) { /* a bookcase full of books */
    var n = Math.max(2, Math.round(h / rowH)), rh = h / n, i;
    rect(c, x, y, w, h, shade(wood, -0.32));
    for (i = 0; i < n; i++) { books(c, x + u * 1.2, y + i * rh + u * 1.5, w - u * 2.4, rh - u * 2.4, seed + i, cols, u); rect(c, x, y + (i + 1) * rh - u * 0.9, w, u * 0.9, wood); if (i < n - 1) rect(c, x, y + (i + 1) * rh, w, u * 0.45, 'rgba(0,0,0,0.22)'); }
    rect(c, x, y, u * 1.2, h, wood); rect(c, x + w - u * 1.2, y, u * 1.2, h, wood); rect(c, x - u * 0.7, y - u * 1.7, w + u * 1.4, u * 2.1, shade(wood, 0.16)); rect(c, x, y + u * 0.4, w, u * 0.45, 'rgba(0,0,0,0.22)');
  }
  function wallFloorShade(c, W, fl, u) { vgrad2(c, 0, fl - u * 5, W, u * 5, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.1)'); }

  /* ---------- the rooftop ---------- */
  Art.add('backdrop', 'rooftop', function (c, W, H, t, p, o, u) {
    var e = env(o.variant), hz = H * 0.635, pt = H * 0.628, fl = H * 0.685, i, j, hzc = horizonCol(p, e), ink = tint(p.ink, e), d = H - fl;
    sky(c, W, H, p, e, hz, o, t, u, e.night ? W * 0.7 : W * 0.5, H * 0.1);
    skyline(c, W, hz, u, o.seed + 'f', mix(hzc, ink, 0.2), u * 14, u * 36, e, t, 0.4, 0.75);
    skyline(c, W, hz, u, o.seed + 'n', mix(hzc, ink, 0.42), u * 8, u * 22, e, t, 0.55, 0.95);
    /* the parapet */
    var brick = tint(mix('#b0604a', p.accent, 0.3), e), cope = tint(mix(p.paper, p.ink, 0.25), e), bh = (fl - pt - u * 1.4) / 4;
    rect(c, 0, pt, W, fl - pt, brick); c.fillStyle = shade(brick, -0.16);
    for (j = 0; j < 4; j++) { c.fillRect(0, pt + u * 1.4 + j * bh, W, u * 0.25); for (i = 0; i * u * 5 < W + u * 5; i++) c.fillRect(i * u * 5 + (j % 2) * u * 2.5, pt + u * 1.4 + j * bh, u * 0.25, bh); }
    rect(c, 0, pt - u * 0.5, W, u * 1.9, cope); rect(c, 0, pt - u * 0.5, W, u * 0.5, shade(cope, 0.2)); rect(c, 0, pt + u * 1.4, W, u * 0.5, 'rgba(0,0,0,0.2)');
    /* the roof */
    var rf = tint(mix('#7c8194', p.bg2, 0.3), e); vgrad2(c, 0, fl, W, d, rf, shade(rf, -0.32));
    c.strokeStyle = 'rgba(0,0,0,0.13)'; c.lineWidth = Math.max(0.6, u * 0.25); c.beginPath(); for (i = -8; i <= 8; i++) { c.moveTo(W / 2 + i * W * 0.085, fl); c.lineTo(W / 2 + i * W * 0.23, H); } for (i = 1; i < 6; i++) { c.moveTo(0, fl + d * Math.pow(i / 6, 1.5)); c.lineTo(W, fl + d * Math.pow(i / 6, 1.5)); } c.stroke();
    rect(c, 0, fl, W, u * 0.9, 'rgba(0,0,0,0.22)');
    /* the water tower */
    var tx = W * 0.135, tw = W * 0.2, tT = H * 0.335, tB = H * 0.46, wd = tint(mix('#a66a3e', p.gold, 0.2), e), st = e.night ? '#16162c' : mix('#3a3848', ink, 0.3), lb = fl + u * 2.6;
    for (i = -1; i <= 1; i += 2) { L(c, tx + i * tw * 0.36, tB, tx + i * tw * 0.46, lb, u * 1, st); L(c, tx + i * tw * 0.36, tB + (lb - tB) * 0.08, tx - i * tw * 0.42, tB + (lb - tB) * 0.62, u * 0.5, st); }
    L(c, tx - tw * 0.4, tB + (lb - tB) * 0.64, tx + tw * 0.4, tB + (lb - tB) * 0.64, u * 0.6, st); L(c, tx, tB, tx, lb - u * 0.6, u * 0.6, st);
    rect(c, tx - tw * 0.5, tT, tw, tB - tT, wd); c.fillStyle = shade(wd, -0.16); for (i = 1; i < 9; i++) c.fillRect(tx - tw * 0.5 + tw * i / 9, tT, u * 0.25, tB - tT);
    rect(c, tx - tw * 0.5, tT, tw * 0.16, tB - tT, 'rgba(255,255,255,0.12)'); rect(c, tx + tw * 0.3, tT, tw * 0.2, tB - tT, 'rgba(0,0,0,0.16)');
    for (i = 0; i < 3; i++) rect(c, tx - tw * 0.5, tT + (tB - tT) * (0.16 + i * 0.32), tw, u * 0.6, alpha(st, 0.8));
    rect(c, tx - tw * 0.57, tB - u * 0.3, tw * 1.14, u * 1.3, st);
    poly(c, [tx - tw * 0.58, tT + u * 0.4, tx, tT - H * 0.045, tx + tw * 0.58, tT + u * 0.4], tint(mix(p.accent2, p.ink, 0.45), e)); poly(c, [tx - tw * 0.58, tT + u * 0.4, tx, tT - H * 0.045, tx - tw * 0.2, tT + u * 0.4], 'rgba(255,255,255,0.12)'); dot(c, tx, tT - H * 0.045, u * 0.8, st);
    L(c, tx + tw * 0.6, tT + u * 2, tx + tw * 0.6, lb, u * 0.35, st); L(c, tx + tw * 0.72, tT + u * 2, tx + tw * 0.72, lb, u * 0.35, st); for (i = 0; tT + u * 4 + i * u * 2.6 < lb - u; i++) L(c, tx + tw * 0.6, tT + u * 4 + i * u * 2.6, tx + tw * 0.72, tT + u * 4 + i * u * 2.6, u * 0.3, st);
    /* the stair hut */
    var hx = W * 0.775, hT = H * 0.43, hb = fl + u * 3, hw = W - hx, hc = tint(mix(p.accent, p.paper, 0.4), e), dw = hw * 0.46, dx = hx + hw * 0.22, dT = hb - (hb - hT) * 0.6;
    rect(c, hx, hT, hw + 1, hb - hT, hc); rect(c, hx, hT, u * 1.4, hb - hT, 'rgba(0,0,0,0.12)'); c.fillStyle = shade(hc, -0.1); for (i = 0; i < 16; i++) c.fillRect(hx + u * 2 + frac(i * 0.37) * (hw - u * 5), hT + u * 3 + frac(i * 0.61) * (hb - hT - u * 5), u * 2.6, u * 0.7);
    rect(c, hx - u * 1.3, hT - u * 1.7, hw + u * 2, u * 2.3, cope); rect(c, hx - u * 1.3, hT + u * 0.6, hw + u * 2, u * 0.5, 'rgba(0,0,0,0.2)');
    Rn(c, dx - u * 0.6, dT - u * 0.6, dw + u * 1.2, hb - dT + u * 0.6, u * 0.6, shade(hc, -0.3)); rect(c, dx, dT, dw, hb - dT, tint(p.accent2, e)); Rn(c, dx + dw * 0.2, dT + u * 1.6, dw * 0.6, (hb - dT) * 0.34, u * 0.5, '#ffdf8a'); rect(c, dx + dw * 0.2, dT + u * 1.6 + (hb - dT) * 0.2, dw * 0.6, (hb - dT) * 0.14, 'rgba(255,150,60,0.3)'); dot(c, dx + dw * 0.84, dT + (hb - dT) * 0.58, u * 0.5, p.gold);
    glow(c, dx + dw / 2, dT - u * 3.4, u * 13, '#ffe2a0', 0.5); poly(c, [dx + dw / 2 - u * 1.6, dT - u * 3, dx + dw / 2 + u * 1.6, dT - u * 3, dx + dw / 2 + u * 0.9, dT - u * 4.4, dx + dw / 2 - u * 0.9, dT - u * 4.4], st); ell(c, dx + dw / 2, dT - u * 2.9, u * 1.3, u * 0.7, '#fff3c8');
    var ax = W * 0.93, aT = hT - H * 0.085; L(c, ax, hT - u * 1.7, ax, aT, u * 0.4, st); L(c, ax - u * 2.4, aT + u * 2, ax + u * 2.4, aT + u * 2, u * 0.35, st); L(c, ax - u * 1.6, aT + u * 4, ax + u * 1.6, aT + u * 4, u * 0.35, st); dot(c, ax, aT, u * 0.6, Math.sin(t * 2.4) > 0 ? '#ff6a6a' : alpha('#ff6a6a', 0.35));
    rect(c, hx + u * 2.4, hT - u * 5.4, u * 2.6, u * 3.8, st); rect(c, hx + u * 1.9, hT - u * 6, u * 3.6, u * 1, st);
    for (i = 0; i < 2; i++) { var gx = hx + hw * (0.42 + i * 0.16), gy = hT - u * 1.7, bob = Math.sin(t * 3 + i * 2) > 0.6 ? u * 0.3 : 0; ell(c, gx, gy - u * 0.9, u * 1.3, u * 0.9, tint('#9aa2b8', e)); dot(c, gx + (i ? -1 : 1) * u * 1.1, gy - u * 1.7 + bob, u * 0.6, tint('#8088a0', e)); }
    /* strings of bulbs from the tower to the hut */
    bulbs(c, -u * 2, H * 0.25, tx + tw * 0.2, tT - H * 0.03, u * 2, 4, u, o, t, p.gold, true);
    bulbs(c, tx + tw * 0.2, tT - H * 0.03, hx + u * 1, hT - u * 1.7, u * 5, 13, u, o, t, p.gold, true);
    bulbs(c, hx + u * 1, hT - u * 1.7, W + u * 2, H * 0.31, u * 2, 4, u, o, t, p.gold, true);
    /* on the wall: a cat watching the town, pots of green */
    cat(c, W * 0.37, pt - u * 0.4, u * 6.2, e.night ? '#0c0c20' : '#2a2238', t, e.k ? '#ffe9a0' : null);
    var pot = tint(mix('#c9744a', p.accent, 0.3), e), lf = tint(mix('#5aa860', p.accent2, 0.4), e);
    plant(c, W * 0.585, pt - u * 0.4, u * 6, pot, lf, t); plant(c, W * 0.645, pt - u * 0.4, u * 4.4, tint(p.gold, e), shade(lf, 0.12), t + 2); dot(c, W * 0.645, pt - u * 4.4, u * 0.8, tint(p.accent, e)); dot(c, W * 0.63, pt - u * 3.5, u * 0.7, tint(p.accent, e));
    /* a planter box against the wall */
    var wdc = tint(mix('#9a6a44', p.ink, 0.15), e), bx = W * 0.26, bw = W * 0.2;
    for (i = 0; i < 9; i++) { dot(c, bx + bw * (i + 0.5) / 9, fl - u * (0.8 + (i % 3) * 0.7) + Math.sin(t * 1.2 + i) * u * 0.1, u * 1.7, i % 2 ? lf : shade(lf, -0.12)); if (i % 2 === 0) dot(c, bx + bw * (i + 0.5) / 9, fl - u * (2 + (i % 3) * 0.6), u * 0.8, tint(i % 4 ? p.accent : p.gold, e)); }
    rect(c, bx, fl + u * 0.2, bw, u * 3.4, wdc); rect(c, bx, fl + u * 0.2, bw, u * 0.6, shade(wdc, 0.2)); rect(c, bx, fl + u * 1.9, bw, u * 0.3, shade(wdc, -0.2));
    /* a skylight, a crate with a lantern, a pouf */
    var sT = H * 0.905, sB = H * 0.978; poly(c, [W * 0.37, sT, W * 0.63, sT, W * 0.67, sB, W * 0.33, sB], cope); poly(c, [W * 0.385, sT + u * 0.9, W * 0.615, sT + u * 0.9, W * 0.648, sB - u * 1, W * 0.352, sB - u * 1], e.night ? '#ffdf8a' : '#ffe9b0');
    L(c, W * 0.5, sT + u * 0.9, W * 0.5, sB - u * 1, u * 0.6, cope); L(c, W * 0.44, sT + u * 0.9, W * 0.425, sB - u * 1, u * 0.5, cope); L(c, W * 0.56, sT + u * 0.9, W * 0.575, sB - u * 1, u * 0.5, cope); glow(c, W * 0.5, (sT + sB) / 2, u * 24, '#ffd27a', e.night ? 0.3 : 0.2);
    /* a striped rug between them */
    var rT2 = H * 0.8, rB2 = H * 0.885, rcl = [tint(p.accent, e), tint(p.paper, e), tint(p.gold, e), tint(p.paper, e)]; for (i = 0; i < 8; i++) { var g0 = i / 8, g1 = (i + 1) / 8, ya = rT2 + (rB2 - rT2) * g0, yb = rT2 + (rB2 - rT2) * g1; poly(c, [W * (0.36 - g0 * 0.04), ya, W * (0.64 + g0 * 0.04), ya, W * (0.64 + g1 * 0.04), yb + 0.5, W * (0.36 - g1 * 0.04), yb + 0.5], rcl[i % 4]); }
    for (i = 0; i < 9; i++) { L(c, W * (0.365 + i * 0.0338), rT2, W * (0.365 + i * 0.0338), rT2 - u * 1, u * 0.3, rcl[1]); L(c, W * (0.322 + i * 0.0445), rB2, W * (0.322 + i * 0.0445), rB2 + u * 1.2, u * 0.3, rcl[1]); }
    var cx = W * 0.2, cy = H * 0.915; c.save(); c.translate(cx, cy); c.scale(1.6, 1.6); c.translate(-cx, -cy); ell(c, cx, cy, u * 6.4, u * 1.2, 'rgba(0,0,0,0.22)'); rect(c, cx - u * 5, cy - u * 5.4, u * 10, u * 5.4, wdc); c.fillStyle = shade(wdc, -0.2); for (i = 1; i < 3; i++) c.fillRect(cx - u * 5, cy - u * 5.4 + i * u * 1.8, u * 10, u * 0.3); rect(c, cx - u * 5.4, cy - u * 6, u * 10.8, u * 0.9, shade(wdc, 0.2));
    glow(c, cx - u * 1.6, cy - u * 8, u * 12, '#ffd27a', 0.45); Rn(c, cx - u * 2.8, cy - u * 10, u * 2.4, u * 4, u * 0.4, st); Rn(c, cx - u * 2.4, cy - u * 9.4, u * 1.6, u * 2.8, u * 0.3, '#ffe9a0'); K.flame(c, cx - u * 1.6, cy - u * 6.9, u * 0.8, u * 1.7, t, 1); c.beginPath(); c.arc(cx - u * 1.6, cy - u * 10, u * 0.9, PI, 0); c.lineWidth = u * 0.3; c.strokeStyle = st; c.stroke();
    mug(c, cx + u * 2.4, cy - u * 6, u * 2, tint(p.accent, e), t, true);
    c.restore();
    var px = W * 0.8, py = H * 0.915, pc = tint(p.accent2, e); c.save(); c.translate(px, py); c.scale(1.5, 1.5); c.translate(-px, -py); ell(c, px, py, u * 6.6, u * 1.3, 'rgba(0,0,0,0.22)'); Rn(c, px - u * 5.6, py - u * 5, u * 11.2, u * 5.2, u * 2.4, shade(pc, -0.14)); ell(c, px, py - u * 4.8, u * 5.4, u * 1.7, pc); dot(c, px, py - u * 4.9, u * 0.6, shade(pc, -0.3)); for (i = -2; i <= 2; i++) if (i) L(c, px + i * u * 2, py - u * 3.2, px + i * u * 2.2, py - u * 0.6, u * 0.3, shade(pc, -0.28));
    c.restore();
  }, { variants: ['dusk', 'night'], stage: 'band-low' });

  /* ---------- the open-air market ---------- */
  function stall(c, x, w, top, table, base, a1, kind, e, t, u, p, seed) {
    var R0 = rnd(seed), i, j, post = tint(mix('#8a5a34', p.ink, 0.25), e), ah = (table - top) * 0.3, n = 3, cw = (w - u * 3) / n, wood = tint(mix('#c08a52', p.gold, 0.2), e),
      fr = [mix('#ff9a2e', p.gold, 0.25), mix('#e2413a', p.accent, 0.4), mix('#6cba4a', p.accent2, 0.4), mix('#ffe04a', p.gold, 0.4), mix('#8a4a9a', p.accent, 0.2), mix('#f2a0b8', p.accent, 0.25)];
    rect(c, x + u, top + ah * 0.5, w - u * 2, table - top, tint(mix(shade(a1, -0.3), p.ink, 0.3), e));
    for (i = 0; i < 4; i++) rect(c, x + u + (w - u * 2) * (i + 0.5) / 4 - u * 0.2, top + ah * 0.5, u * 0.4, table - top, 'rgba(0,0,0,0.12)');
    rect(c, x + u * 0.6, top, u * 1.3, base - top, post); rect(c, x + w - u * 1.9, top, u * 1.3, base - top, post);
    for (i = 0; i < 3; i++) { var hx = x + w * (0.24 + i * 0.26), hl = u * (2.4 + (i % 2) * 1.6) + ah, sw = Math.sin(t * 1.1 + i * 2 + x) * u * 0.25; L(c, hx, top + ah * 0.6, hx + sw, top + hl, u * 0.25, post);
      if (i === 1) { if (e.k) glow(c, hx + sw, top + hl + u * 2, u * 14, '#ffd27a', 0.55); Rn(c, hx + sw - u * 1.5, top + hl, u * 3, u * 4, u * 0.7, tint('#3a3040', e)); Rn(c, hx + sw - u * 1, top + hl + u * 0.7, u * 2, u * 2.6, u * 0.4, e.k ? '#fff0b8' : '#f4e6c0'); }
      else for (j = 0; j < 5; j++) dot(c, hx + sw * (0.5 + j * 0.12) + (j % 2 ? 1 : -1) * u * 0.7, top + hl + j * u * 1.15, u * 1, tint(kind ? fr[(j + i) % 2 ? 5 : 3] : (i ? fr[1] : fr[3]), e)); }
    /* the table, its cloth, the crates */
    rect(c, x, table, w, base - table, tint(p.paper, e)); c.fillStyle = tint(a1, e); for (i = 0; i * u * 5 < w; i++) c.fillRect(x + i * u * 5, table, u * 2.5, base - table - u * 1.4); rect(c, x, table, w, u * 1.6, 'rgba(0,0,0,0.14)');
    for (i = 0; i * u * 2.5 < w; i++) { c.beginPath(); c.arc(x + (i + 0.5) * u * 2.5, base - u * 1.5, u * 1.25, 0, PI); c.fillStyle = i % 2 ? tint(p.paper, e) : tint(a1, e); c.fill(); }
    rect(c, x - u * 0.6, table - u * 1.3, w + u * 1.2, u * 1.7, shade(post, 0.22));
    for (i = 0; i < n; i++) { var cx = x + u * 1.5 + i * cw, ch = u * (5.6 + (i % 2) * 2.2), cy = table - u * 1.3, col = tint(fr[(i * 2 + (kind ? 1 : 0) + Math.floor(R0() * 2)) % 6], e), r = cw / 7.4;
      for (j = 0; j < 9; j++) { var fx = cx + r * 1.2 + (j % 5) * r * 1.5 + (j > 4 ? r * 0.75 : 0), fy = cy - ch - (j > 4 ? r * 1.5 : r * 0.3); dot(c, fx, fy, r, j % 3 ? col : shade(col, -0.1)); dot(c, fx - r * 0.3, fy - r * 0.3, r * 0.32, 'rgba(255,255,255,0.35)'); }
      rect(c, cx, cy - ch, cw - u * 0.6, ch, wood); c.fillStyle = shade(wood, -0.22); c.fillRect(cx, cy - ch + ch * 0.45, cw - u * 0.6, u * 0.35); c.fillRect(cx, cy - ch, u * 0.5, ch); c.fillRect(cx + cw - u * 1.1, cy - ch, u * 0.5, ch); rect(c, cx, cy - ch, cw - u * 0.6, u * 0.5, shade(wood, 0.2));
      L(c, cx + cw * 0.5, cy - ch - r * 1.4, cx + cw * 0.5, cy - ch - r * 4.6, u * 0.3, post); Rn(c, cx + cw * 0.5 - u * 1.5, cy - ch - r * 4.6 - u * 2, u * 3, u * 2.2, u * 0.4, tint(p.paper, e)); dot(c, cx + cw * 0.5, cy - ch - r * 4.6 - u * 0.9, u * 0.55, col); }
    awning(c, x - u * 1.6, top, w + u * 3.2, ah, Math.max(5, Math.round(w / (u * 3.4))), tint(a1, e), tint(p.paper, e), u, u * 1.6);
    if (e.k) glow(c, x + w / 2, table, w * 0.8, '#ffd27a', 0.22);
  }
  Art.add('backdrop', 'market', function (c, W, H, t, p, o, u) {
    var e = env(o.variant), fl = H * 0.675, i, j, R0 = rnd(o.seed + 'mk'), hzc = horizonCol(p, e), ink = tint(p.ink, e), d = H - fl;
    sky(c, W, H, p, e, fl, o, t, u, e.k ? W * 0.5 : W * 0.74, H * 0.11);
    /* the town behind: gabled houses and trees */
    var hw = W / 9, fc = [p.accent, p.gold, p.accent2, p.paper];
    for (i = -1; i < 10; i++) { var bx = i * hw + R0() * u, bh = H * (0.06 + R0() * 0.05) * (1 + Math.abs(i - 4) * 0.12), bc = mix(tint(mix(fc[(i + 5) % 4], p.paper, 0.4), e), hzc, 0.5), rc = mix(tint(mix(p.accent, p.ink, 0.3), e), hzc, 0.5);
      rect(c, bx, fl - bh, hw + 1, bh + 1, bc); poly(c, [bx - u * 0.6, fl - bh + 0.5, bx + hw / 2, fl - bh - hw * 0.42, bx + hw + u * 0.6, fl - bh + 0.5], rc); if (i % 3 === 0) rect(c, bx + hw * 0.66, fl - bh - hw * 0.4, u * 1.3, hw * 0.3, rc);
      c.fillStyle = e.k ? '#ffe39a' : shade(bc, -0.16); for (j = 0; j < 2; j++) c.fillRect(bx + hw * (0.22 + j * 0.36), fl - bh + u * 1.6, hw * 0.2, u * 2.2); }
    for (i = 0; i < 5; i++) { var tx = W * (0.32 + i * 0.09), th = u * (7 + R0() * 3), g = mix(tint(p.accent2, e), hzc, 0.35); rect(c, tx - u * 0.3, fl - th * 0.5, u * 0.6, th * 0.5, mix(hzc, ink, 0.55)); dot(c, tx + Math.sin(t * 0.8 + i) * u * 0.15, fl - th * 0.66, th * 0.34, g); dot(c, tx - th * 0.1, fl - th * 0.76, th * 0.16, shade(g, 0.14)); }
    /* far stalls, pale */
    for (i = 0; i < 3; i++) { var sx = W * (0.335 + i * 0.115), sw = W * 0.1, sc = mix(tint(fc[i], e), hzc, 0.35), pc = mix(tint(p.paper, e), hzc, 0.35);
      rect(c, sx + u * 0.5, fl - u * 9, u * 0.5, u * 9, mix(hzc, ink, 0.5)); rect(c, sx + sw - u * 1, fl - u * 9, u * 0.5, u * 9, mix(hzc, ink, 0.5)); rect(c, sx, fl - u * 4, sw, u * 4, pc); rect(c, sx, fl - u * 4, sw, u * 1, sc);
      for (j = 0; j < 5; j++) dot(c, sx + sw * (j + 0.5) / 5, fl - u * 4.6, u * 0.9, mix(tint(fc[(i + j) % 3], e), hzc, 0.3)); awning(c, sx - u * 0.6, fl - u * 10.5, sw + u * 1.2, u * 2.8, 5, sc, pc, u, u * 0.8); }
    /* cobbles */
    var gc = tint(mix('#cdb99c', p.bg2, 0.4), e); vgrad2(c, 0, fl, W, d, gc, shade(gc, -0.24)); rect(c, 0, fl, W, u * 0.6, 'rgba(0,0,0,0.14)');
    for (j = 0; j < 8; j++) { var y = fl + d * Math.pow((j + 0.5) / 8, 1.35), cw = u * (5 + j * 1.5), chh = d * (Math.pow((j + 1) / 8, 1.35) - Math.pow(j / 8, 1.35)) * 0.4; for (i = -1; i * cw < W + cw; i++) ell(c, i * cw + (j % 2) * cw * 0.5, y, cw * 0.44, chh, (i + j) % 3 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'); }
    /* the two near stalls */
    stall(c, -u * 1.5, W * 0.3, H * 0.365, H * 0.585, fl + u * 3.4, p.accent, 0, e, t, u, p, o.seed + 'l');
    stall(c, W * 0.715, W * 0.3, H * 0.345, H * 0.585, fl + u * 3.4, p.accent2, 1, e, t, u, p, o.seed + 'r');
    /* at their feet: a basket, buckets of flowers, a sack */
    var wk = tint(mix('#c79a5a', p.gold, 0.25), e), by = fl + u * 6.4, bx2 = W * 0.31;
    ell(c, bx2, by, u * 5, u * 1, 'rgba(0,0,0,0.2)'); for (i = 0; i < 6; i++) dot(c, bx2 + (i - 2.5) * u * 1.4, by - u * (4.6 + (i % 2) * 0.9), u * 1.3, tint(mix('#e2413a', p.accent, 0.4), e)); poly(c, [bx2 - u * 4.6, by - u * 4.4, bx2 + u * 4.6, by - u * 4.4, bx2 + u * 3.6, by, bx2 - u * 3.6, by], wk); c.fillStyle = shade(wk, -0.2); for (i = 0; i < 3; i++) c.fillRect(bx2 - u * 4.3 + i * u * 0.3, by - u * 3.4 + i * u * 1.2, u * 8.6 - i * u * 0.6, u * 0.3); rect(c, bx2 - u * 4.9, by - u * 4.8, u * 9.8, u * 0.9, shade(wk, 0.18));
    for (j = 0; j < 2; j++) { var fx = W * (0.655 + j * 0.055), fy = fl + u * (5.6 + j * 1.6), bc2 = tint(j ? '#8fa0b4' : '#a9b6c6', e); ell(c, fx, fy, u * 3, u * 0.7, 'rgba(0,0,0,0.2)');
      for (i = 0; i < 6; i++) { var a = -PI / 2 + (i - 2.5) * 0.24 + Math.sin(t * 1.2 + i + j) * 0.03, len = u * (8 + (i % 2) * 1.6); L(c, fx, fy - u * 4, fx + Math.cos(a) * len, fy - u * 4 + Math.sin(a) * len, u * 0.3, tint(mix('#4a9a58', p.accent2, 0.4), e)); dot(c, fx + Math.cos(a) * len, fy - u * 4 + Math.sin(a) * len, u * 1.3, tint(j ? (i % 2 ? p.gold : p.paper) : (i % 2 ? p.accent : mix(p.accent, p.paper, 0.5)), e)); dot(c, fx + Math.cos(a) * len, fy - u * 4 + Math.sin(a) * len, u * 0.5, tint(j ? p.accent : p.gold, e)); }
      poly(c, [fx - u * 2.5, fy - u * 4.6, fx + u * 2.5, fy - u * 4.6, fx + u * 1.9, fy, fx - u * 1.9, fy], bc2); rect(c, fx - u * 2.7, fy - u * 4.9, u * 5.4, u * 0.7, shade(bc2, 0.2)); rect(c, fx - u * 1.6, fy - u * 4, u * 0.6, u * 3.4, 'rgba(255,255,255,0.25)'); }
    /* a pigeon after crumbs */
    for (j = 0; j < 2; j++) { var bw3 = u * 21, bx3 = j ? W - bw3 - u * 1.5 : u * 1.5, bb3 = H * 0.988, bh3 = u * 8, fr3 = tint(j ? mix('#6cba4a', p.accent2, 0.4) : mix('#ff9a2e', p.gold, 0.25), e), r3 = u * 2;
      ell(c, bx3 + bw3 / 2, bb3, bw3 * 0.56, u * 1.2, 'rgba(0,0,0,0.2)'); for (i = 0; i < 11; i++) { var ox3 = bx3 + r3 * 1.3 + (i % 6) * r3 * 1.75 + (i > 5 ? r3 * 0.9 : 0), oy3 = bb3 - bh3 - (i > 5 ? r3 * 1.7 : r3 * 0.2); dot(c, ox3, oy3, r3, i % 3 ? fr3 : shade(fr3, -0.1)); dot(c, ox3 - r3 * 0.3, oy3 - r3 * 0.3, r3 * 0.3, 'rgba(255,255,255,0.35)'); if (j && i % 2) K.leaf(c, ox3, oy3 - r3 * 0.6, r3 * 1.3, -PI / 2 + (i % 3 - 1) * 0.5, shade(fr3, -0.2)); }
      rect(c, bx3, bb3 - bh3, bw3, bh3, wk); c.fillStyle = shade(wk, -0.22); c.fillRect(bx3, bb3 - bh3 * 0.66, bw3, u * 0.4); c.fillRect(bx3, bb3 - bh3 * 0.33, bw3, u * 0.4); c.fillRect(bx3, bb3 - bh3, u * 0.8, bh3); c.fillRect(bx3 + bw3 - u * 0.8, bb3 - bh3, u * 0.8, bh3); rect(c, bx3, bb3 - bh3, bw3, u * 0.7, shade(wk, 0.2)); }
    for (j = 0; j < 2; j++) { c.save(); c.translate(W * (0.44 + j * 0.15) + Math.sin(t * 0.4 + j * 2) * u * 3, H * (0.93 + j * 0.022)); c.scale(j ? -1.5 : 1.8, j ? 1.5 : 1.8); pigeon(c, u, e, p, t + j * 1.3); c.restore(); }
    for (i = 0; i < 5; i++) dot(c, W * 0.5 + u * (1 + i * 1.5), H * 0.935 + u * (0.4 + (i % 2) * 0.9), u * 0.3, tint(p.paper, e));
    /* flags and bulbs overhead */
    K.flagRow(c, -u * 2, H * 0.022, W + u * 2, H * 0.022, u * 4, Math.max(7, Math.round(W / (u * 9))), [tint(p.accent, e), tint(p.gold, e), tint(p.accent2, e), tint(p.paper, e)], u * 6, t);
    bulbs(c, -u * 2, H * 0.1, W * 0.5, H * 0.085, u * 3, 8, u, o, t, p.gold, e.k > 0); bulbs(c, W * 0.5, H * 0.085, W + u * 2, H * 0.1, u * 3, 8, u, o, t, p.gold, e.k > 0);
  }, { variants: ['day', 'evening'], stage: 'band-low' });
  function pigeon(c, u, e, p, t) { /* at (0, 0), pecking */
    var gx = 0, gy = 0, pk = Math.sin(t * 5) > 0.3 ? u * 0.9 : 0, pg = tint('#8f96ac', e); ell(c, gx, gy, u * 2.6, u * 0.5, 'rgba(0,0,0,0.18)'); L(c, gx - u * 0.4, gy - u * 1, gx - u * 0.4, gy, u * 0.25, tint('#d9705a', e)); L(c, gx + u * 0.5, gy - u * 1, gx + u * 0.5, gy, u * 0.25, tint('#d9705a', e));
    ell(c, gx, gy - u * 1.9, u * 2.2, u * 1.4, pg); poly(c, [gx - u * 1.6, gy - u * 2.4, gx - u * 3.6, gy - u * 2.2, gx - u * 1.4, gy - u * 1.2], shade(pg, -0.16)); dot(c, gx + u * 1.9, gy - u * 3 + pk, u * 0.95, shade(pg, -0.1)); poly(c, [gx + u * 2.6, gy - u * 3.1 + pk, gx + u * 3.5, gy - u * 2.8 + pk, gx + u * 2.6, gy - u * 2.6 + pk], tint(p.gold, e)); dot(c, gx + u * 2.1, gy - u * 3.2 + pk, u * 0.2, '#1a1a22'); ell(c, gx - u * 0.2, gy - u * 2, u * 1.3, u * 0.8, shade(pg, 0.14));
  }

  /* ---------- the library ---------- */
  Art.add('backdrop', 'library', function (c, W, H, t, p, o, u) {
    var e = env('day'), fl = H * 0.69, i, j, wall = p.bg, wood = mix('#7c4a2a', p.ink, 0.18), brass = mix('#d9a94a', p.gold, 0.5), d = H - fl,
      cols = [p.accent, p.accent2, p.gold, mix(p.accent, p.ink, 0.45), mix(p.accent2, p.ink, 0.4), mix(p.paper, p.gold, 0.25), mix(p.accent, p.gold, 0.5), mix(p.accent2, p.paper, 0.45)];
    vgrad(c, W, H, [shade(wall, -0.14), wall, shade(wall, 0.06)], 0, fl);
    for (j = 0; j * u * 9 < fl; j++) for (i = 0; i < 6; i++) K.twinkle(c, W * 0.3 + (i + (j % 2) * 0.5) * W * 0.08, j * u * 9 + u * 4, u * 1.2, alpha(p.paper, 0.1));
    /* the tall arched window */
    var ww = W * 0.3, wx = W / 2 - ww / 2, wy = H * 0.105, wh = H * 0.37, fr = shade(wood, 0.2);
    K.archPath(c, wx - u * 1.6, wy - u * 1.6, ww + u * 3.2, wh + u * 1.6); c.fillStyle = fr; c.fill();
    c.save(); K.archPath(c, wx, wy, ww, wh); c.clip(); view(c, wx, wy, ww, wh, p, e, o, t, u, o.seed + 'v'); sheen(c, wx, wy, ww, wh); c.restore();
    c.fillStyle = fr; c.fillRect(wx + ww / 2 - u * 0.4, wy, u * 0.8, wh); for (i = 0; i < 3; i++) c.fillRect(wx, wy + ww / 2 + (wh - ww / 2) * i / 3 - u * 0.3, ww, u * 0.6);
    for (i = -1; i <= 1; i += 2) L(c, wx + ww / 2, wy + ww / 2, wx + ww / 2 + i * ww * 0.36, wy + ww * 0.14, u * 0.6, fr);
    rect(c, wx - u * 3.4, wy + wh, ww + u * 6.8, u * 1.6, shade(fr, 0.12)); rect(c, wx - u * 3.4, wy + wh + u * 1.6, ww + u * 6.8, u * 0.5, 'rgba(0,0,0,0.18)');
    /* panelling */
    var wT = H * 0.565, pn = shade(wall, -0.2), np = 4; rect(c, 0, wT, W, fl - wT, pn); rect(c, 0, wT, W, u * 1, shade(pn, 0.2)); for (i = 0; i < np; i++) { var px = W * 0.27 + i * W * 0.46 / np + u * 1; Rn(c, px, wT + u * 2.4, W * 0.46 / np - u * 2, fl - wT - u * 4.6, u * 0.5, shade(pn, -0.12)); Rn(c, px + u * 0.5, wT + u * 2.9, W * 0.46 / np - u * 3, fl - wT - u * 5.6, u * 0.4, shade(pn, 0.07)); }
    rect(c, 0, fl - u * 1.4, W, u * 1.4, shade(pn, -0.2));
    /* walls of books */
    var sT = H * 0.075, sw = W * 0.255;
    shelfCase(c, -u, sT, sw + u, fl - sT, wood, o.seed + 'L', cols, u, u * 10.5); shelfCase(c, W - sw, sT, sw + u, fl - sT, wood, o.seed + 'R', cols, u, u * 10.5);
    rect(c, 0, sT + H * 0.085, sw, u * 0.5, brass); rect(c, W - sw, sT + H * 0.085, sw, u * 0.5, brass);
    /* the floor, a rug */
    planks(c, W, H, fl, mix('#b07a48', p.bg2, 0.3), u);
    var ry = fl + d * 0.6; ell(c, W / 2, ry, W * 0.36, d * 0.3, shade(p.accent, -0.2)); ell(c, W / 2, ry, W * 0.34, d * 0.27, p.accent); c.beginPath(); c.ellipse(W / 2, ry, W * 0.3, d * 0.22, 0, 0, TAU); c.lineWidth = u * 0.8; c.strokeStyle = p.gold; c.stroke(); c.beginPath(); c.ellipse(W / 2, ry, W * 0.25, d * 0.17, 0, 0, TAU); c.lineWidth = u * 0.35; c.strokeStyle = alpha(p.paper, 0.6); c.stroke();
    for (i = 0; i < 10; i++) { var a = i / 10 * TAU; K.twinkle(c, W / 2 + Math.cos(a) * W * 0.275, ry + Math.sin(a) * d * 0.195, u * 1.3, alpha(p.paper, 0.7)); }
    /* light through the window, dust in it */
    poly(c, [wx, wy + wh, wx + ww, wy + wh, wx + ww + u * 16, H, wx - u * 16, H], 'rgba(255,244,200,0.07)');
    for (i = 0; i < 18; i++) { var f = frac(i * 0.618 + t * 0.012 * (1 + (i % 3) * 0.4)); dot(c, wx + ww * frac(i * 0.37 + 0.1) + Math.sin(t * 0.5 + i) * u * 2, wy + wh * 0.3 + f * (H * 0.92 - wy - wh * 0.3), u * (0.22 + (i % 3) * 0.1), 'rgba(255,250,220,' + (0.55 * Math.sin(f * PI)).toFixed(3) + ')'); }
    /* the rolling ladder */
    var lc = mix('#d0a060', p.gold, 0.3), lx0 = W * 0.19, lx1 = W * 0.25, ly0 = fl + u * 4, ly1 = sT + H * 0.085, n = Math.round((ly0 - ly1) / (u * 4.4));
    ell(c, lx0 + u * 3, ly0 + u * 0.4, u * 6, u * 0.9, 'rgba(0,0,0,0.18)');
    for (i = 1; i < n; i++) { var g = i / n; L(c, lx0 + (lx1 - lx0) * g, ly0 + (ly1 - ly0) * g, lx0 + (lx1 - lx0) * g + u * 5.6, ly0 + (ly1 - ly0) * g, u * 0.7, shade(lc, -0.16)); }
    L(c, lx0, ly0, lx1, ly1, u * 1.1, lc); L(c, lx0 + u * 5.6, ly0, lx1 + u * 5.6, ly1, u * 1.1, lc); dot(c, lx1, ly1, u * 0.9, brass); dot(c, lx1 + u * 5.6, ly1, u * 0.9, brass); dot(c, lx0, ly0, u * 0.9, '#2a2430'); dot(c, lx0 + u * 5.6, ly0, u * 0.9, '#2a2430');
    /* a globe */
    var gx = W * 0.335, gb = fl + d * 0.3, gr = u * 5, sea = mix('#4a9ad0', p.accent2, 0.35), land = mix('#6cba5a', p.gold, 0.3);
    ell(c, gx, gb, u * 5, u * 0.9, 'rgba(0,0,0,0.2)'); for (i = -1; i <= 1; i++) L(c, gx, gb - u * 9, gx + i * u * 3.6, gb, u * 0.7, wood); rect(c, gx - u * 0.5, gb - u * 12, u * 1, u * 4, wood);
    dot(c, gx, gb - u * 16.4, gr, sea); c.save(); c.beginPath(); c.arc(gx, gb - u * 16.4, gr, 0, TAU); c.clip(); for (i = 0; i < 4; i++) { var bx = gx - gr * 2 + frac(i * 0.28 + t * 0.02) * gr * 4; ell(c, bx, gb - u * 16.4 + (i % 2 ? 1 : -1) * gr * 0.3, gr * (0.5 - (i % 2) * 0.14), gr * 0.36, land, i); } dot(c, gx - gr * 0.35, gb - u * 16.4 - gr * 0.35, gr * 0.5, 'rgba(255,255,255,0.2)'); c.restore();
    c.beginPath(); c.arc(gx, gb - u * 16.4, gr + u * 0.8, -PI * 0.42, PI * 0.58); c.lineWidth = u * 0.6; c.strokeStyle = brass; c.stroke();
    /* a reading desk with a green lamp */
    var dx = W * 0.565, dw = W * 0.2, dy = fl + d * 0.2, db = fl + d * 0.52, dc = shade(wood, 0.12);
    ell(c, dx + dw / 2, db, dw * 0.6, u * 1.2, 'rgba(0,0,0,0.2)'); rect(c, dx + u * 1, dy, u * 1.4, db - dy, wood); rect(c, dx + dw - u * 2.4, dy, u * 1.4, db - dy, wood); rect(c, dx + u * 1, dy + u * 1.6, dw - u * 2, u * 3, shade(wood, -0.1)); dot(c, dx + dw / 2, dy + u * 3.1, u * 0.5, brass);
    glow(c, dx + dw * 0.72, dy - u * 4, u * 15, '#fff0b0', 0.4); rect(c, dx - u * 1, dy - u * 0.6, dw + u * 2, u * 1.9, dc); rect(c, dx - u * 1, dy - u * 0.6, dw + u * 2, u * 0.5, shade(dc, 0.2));
    poly(c, [dx + u * 2, dy - u * 0.9, dx + u * 7, dy - u * 2.2, dx + u * 7, dy - u * 0.5, dx + u * 2, dy - u * 0.2], p.paper); poly(c, [dx + u * 12, dy - u * 0.9, dx + u * 7, dy - u * 2.2, dx + u * 7, dy - u * 0.5, dx + u * 12, dy - u * 0.2], shade(p.paper, -0.08)); for (i = 0; i < 2; i++) L(c, dx + u * 3, dy - u * (1 + i * 0.5), dx + u * 6, dy - u * (1.7 + i * 0.5), u * 0.2, alpha(p.ink, 0.35));
    var lx = dx + dw * 0.74; ell(c, lx, dy - u * 0.8, u * 2.4, u * 0.6, brass); rect(c, lx - u * 0.3, dy - u * 6, u * 0.6, u * 5.2, brass); Rn(c, lx - u * 3.6, dy - u * 8, u * 7.2, u * 2.6, u * 1.3, mix('#2f8a5a', p.accent2, 0.4)); rect(c, lx - u * 2.6, dy - u * 7.6, u * 3, u * 0.5, 'rgba(255,255,255,0.3)'); rect(c, lx - u * 3, dy - u * 5.6, u * 6, u * 0.4, '#fff3c0');
    for (i = 0; i < 4; i++) rect(c, dx + dw + u * (1.4 + (i % 2) * 0.5), db - (i + 1) * u * 1.5, u * (7 - (i % 2)), u * 1.4, cols[(i * 3 + 1) % cols.length]);
    pendant(c, W * 0.3, H * 0.035, u * 3.2, brass, e, u); pendant(c, W * 0.7, H * 0.035, u * 3.2, brass, e, u);
    cat(c, W * 0.705, fl - u * 1.4, u * 5.6, mix('#3a3040', p.ink, 0.4), t, null);
  }, { variants: ['one'], stage: 'cast-low' });

  /* ---------- the book cafe ---------- */
  Art.add('backdrop', 'bookcafe', function (c, W, H, t, p, o, u) {
    var e = env(o.variant), fl = H * 0.69, i, j, d = H - fl, wall = dim(p.bg, e), wood = dim(mix('#8a5632', p.ink, 0.15), e), pap = dim(p.paper, e), metal = dim('#c9ced8', e), ink = mix('#2a2430', p.ink, 0.4),
      cols = [p.accent, p.accent2, p.gold, mix(p.accent, p.ink, 0.45), mix(p.paper, p.gold, 0.25), mix(p.accent2, p.paper, 0.45), mix(p.accent, p.gold, 0.5)].map(function (x) { return dim(x, e); });
    vgrad(c, W, H, [shade(wall, -0.1), wall], 0, fl);
    c.fillStyle = shade(wall, 0.06); for (i = 0; i * u * 8 < W; i += 2) c.fillRect(i * u * 8, 0, u * 8, fl);
    /* boards below the rail */
    var wT = H * 0.545, bd = dim(mix('#c79a68', p.bg2, 0.3), e); rect(c, 0, wT, W, fl - wT, bd); c.fillStyle = shade(bd, -0.12); for (i = 0; i * u * 4 < W; i++) c.fillRect(i * u * 4, wT, u * 0.3, fl - wT); rect(c, 0, wT - u * 0.4, W, u * 1.5, shade(bd, 0.16)); rect(c, 0, wT + u * 1.1, W, u * 0.4, 'rgba(0,0,0,0.15)'); rect(c, 0, fl - u * 1.6, W, u * 1.6, shade(bd, -0.22));
    /* the window on the street, a cat on its sill */
    var ww = W * 0.42, wx = W / 2 - ww / 2, wy = H * 0.12, wh = H * 0.31;
    view(c, wx, wy, ww, wh, p, e, o, t, u, o.seed + 'v'); sheen(c, wx, wy, ww, wh); sash(c, wx, wy, ww, wh, pap, u, 3, 2);
    awning(c, wx - u * 4, wy - u * 5.4, ww + u * 8, u * 4.2, 9, dim(p.accent, e), pap, u, u * 1.4);
    cat(c, wx + ww * 0.24, wy + wh + u * 1.1, u * 6, e.k ? '#1c1830' : mix('#3a3040', p.ink, 0.4), t, null);
    plant(c, wx + ww * 0.72, wy + wh + u * 1.1, u * 6.4, dim(mix('#c9744a', p.accent, 0.3), e), dim(mix('#5aa860', p.accent2, 0.4), e), t); mug(c, wx + ww * 0.86, wy + wh + u * 1.1, u * 2.2, dim(p.gold, e), t, false);
    if (e.k) bulbs(c, wx - u * 2, wy + u * 0.5, wx + ww + u * 2, wy + u * 0.5, u * 2.2, 9, u, o, t, p.gold, true);
    /* books up the left wall */
    var sT = H * 0.13, sw = W * 0.215; shelfCase(c, -u, sT, sw + u, fl + u * 1.5 - sT, wood, o.seed + 'L', cols, u, u * 10.5);
    plant(c, sw * 0.3, sT - u * 1.7, u * 7, dim(p.accent2, e), dim(mix('#5aa860', p.accent2, 0.4), e), t + 1); for (i = 0; i < 3; i++) rect(c, sw * 0.56 + (i % 2) * u * 0.4, sT - u * 1.7 - (i + 1) * u * 1.3, u * 6, u * 1.2, cols[(i * 2 + 1) % cols.length]);
    /* the counter: the machine, a cake, cups; a board of pictures above */
    var cx = W * 0.715, cT = H * 0.555, cb = fl + u * 3.2, cc = dim(mix(p.accent2, p.ink, 0.25), e);
    var bx = W * 0.745, bw = W * 0.225, bT = H * 0.185, bH = H * 0.165, kinds = ['cup', 'loaf', 'star'];
    Rn(c, bx - u * 1, bT - u * 1, bw + u * 2, bH + u * 2, u * 0.8, wood); Rn(c, bx, bT, bw, bH, u * 0.4, dim(mix('#2b3340', p.ink, 0.3), e));
    for (i = 0; i < 3; i++) { var iy = bT + bH * (i + 0.5) / 3; icon(c, kinds[i], bx + bw * 0.18, iy, Math.min(bH / 3.6, bw * 0.24), alpha(p.paper, 0.9), alpha(p.ink, 0.5)); for (j = 0; j < 5; j++) dot(c, bx + bw * (0.4 + j * 0.085), iy, u * 0.3, alpha(p.paper, 0.55)); dot(c, bx + bw * 0.88, iy, u * 1, alpha(i === 1 ? p.gold : p.accent, 0.9)); }
    var shy = H * 0.44; rect(c, cx + u * 2, shy, W - cx, u * 1, wood); rect(c, cx + u * 2, shy + u * 1, W - cx, u * 0.4, 'rgba(0,0,0,0.18)'); for (i = 0; i < 5; i++) { var jx = cx + u * 5 + i * u * 5; if (i % 2) { Rn(c, jx - u * 1.5, shy - u * 4.6, u * 3, u * 4.6, u * 0.6, 'rgba(255,255,255,0.3)'); rect(c, jx - u * 1.5, shy - u * 3, u * 3, u * 3, dim(i === 1 ? mix('#6a4028', p.ink, 0.2) : p.gold, e)); rect(c, jx - u * 1.7, shy - u * 5.2, u * 3.4, u * 0.9, metal); } else mug(c, jx, shy, u * 2.6, cols[i % 3], t, false); }
    rect(c, cx, cT, W - cx, cb - cT, cc); for (i = 0; i < 3; i++) Rn(c, cx + u * 2 + i * (W - cx - u * 2) / 3, cT + u * 3.4, (W - cx - u * 2) / 3 - u * 1.6, cb - cT - u * 6, u * 0.6, shade(cc, 0.1)); rect(c, cx, cb - u * 1.6, W - cx, u * 1.6, shade(cc, -0.25));
    rect(c, cx - u * 1.2, cT - u * 0.6, W - cx + u * 1.2, u * 2, pap); rect(c, cx - u * 1.2, cT + u * 1.4, W - cx + u * 1.2, u * 0.5, 'rgba(0,0,0,0.18)');
    var mx = W * 0.875, mw = u * 13, mb = cT - u * 0.6; c.save(); c.translate(mx, mb); c.scale(1.35, 1.35); c.translate(-mx, -mb); Rn(c, mx - mw / 2, mb - u * 9.6, mw, u * 9.6, u * 1.2, metal); Rn(c, mx - mw / 2, mb - u * 9.6, mw, u * 3, u * 1.2, dim(p.accent, e)); rect(c, mx - mw / 2 + u * 1, mb - u * 6, mw - u * 2, u * 0.5, shade(metal, -0.2));
    for (i = -1; i <= 1; i += 2) { rect(c, mx + i * u * 3 - u * 1, mb - u * 5.5, u * 2, u * 1.2, ink); L(c, mx + i * u * 3, mb - u * 4.6, mx + i * u * 3 + i * u * 2.2, mb - u * 4, u * 0.6, ink); mug(c, mx + i * u * 3, mb, u * 2, pap, t + i, true); }
    dot(c, mx - u * 4, mb - u * 8.1, u * 0.7, pap); dot(c, mx, mb - u * 8.1, u * 0.7, dim(p.gold, e)); dot(c, mx + u * 4, mb - u * 8.1, u * 0.7, pap); rect(c, mx - mw / 2 + u * 0.6, mb - u * 0.8, mw - u * 1.2, u * 0.8, shade(metal, -0.25)); c.restore();
    dome(c, W * 0.755, cT - u * 0.6, u * 10.5, dim(mix('#f2c9a0', p.paper, 0.3), e), dim(p.accent, e), metal);
    /* the floor: a rug, a little table for two */
    planks(c, W, H, fl, dim(mix('#b07a48', p.bg2, 0.3), e), u);
    var ry = fl + d * 0.66, rc = dim(p.accent2, e); ell(c, W / 2, ry, W * 0.33, d * 0.27, shade(rc, -0.2)); ell(c, W / 2, ry, W * 0.31, d * 0.245, rc); c.beginPath(); c.ellipse(W / 2, ry, W * 0.26, d * 0.19, 0, 0, TAU); c.lineWidth = u * 0.9; c.strokeStyle = alpha(pap, 0.7); c.setLineDash([u * 2, u * 1.6]); c.stroke(); c.setLineDash([]);
    var tx = W / 2, ty = fl + d * 0.52, tb = fl + d * 0.84, tc = dim(mix('#d9b58a', p.paper, 0.3), e);
    stool(c, tx - W * 0.17, tb + u * 1, (tb - ty) * 0.66, u * 4.4, dim(p.accent, e), ink); stool(c, tx + W * 0.17, tb + u * 1, (tb - ty) * 0.66, u * 4.4, dim(p.gold, e), ink);
    ell(c, tx, tb, u * 6.4, u * 1.3, 'rgba(0,0,0,0.2)'); ell(c, tx, tb - u * 0.3, u * 4.6, u * 1, ink); rect(c, tx - u * 0.7, ty, u * 1.4, tb - ty, ink); ell(c, tx, ty + u * 0.9, u * 11, u * 2.5, shade(tc, -0.25)); ell(c, tx, ty, u * 11, u * 2.5, tc);
    mug(c, tx - u * 5, ty + u * 0.3, u * 3, pap, t, true); mug(c, tx + u * 5.6, ty + u * 0.5, u * 3, dim(p.accent, e), t + 2, true);
    for (i = 0; i < 3; i++) rect(c, tx - u * 2.2 + (i % 2) * u * 0.4, ty - (i + 1) * u * 1.1 + u * 0.2, u * 5, u * 1, cols[(i * 2) % cols.length]);
    var fpx = W * 0.27, fpb = fl + u * 4.6; ell(c, fpx, fpb, u * 4.4, u * 0.9, 'rgba(0,0,0,0.2)'); plant(c, fpx, fpb, u * 15, dim(p.paper, e), dim(mix('#4a9a58', p.accent2, 0.4), e), t + 3);
    wallFloorShade(c, W, fl, u);
    pendant(c, W * 0.2, H * 0.05, u * 3.6, dim(p.gold, e), e, u); pendant(c, W * 0.8, H * 0.05, u * 3.6, dim(p.gold, e), e, u); pendant(c, W * 0.5, H * 0.03, u * 3, dim(p.accent, e), e, u);
    if (e.k) { glow(c, W / 2, ty, W * 0.5, '#ffd27a', 0.16); glow(c, mx, cT, u * 26, '#ffd27a', 0.2); }
  }, { variants: ['day', 'evening'], stage: 'cast-low' });

  /* ---------- the diner ---------- */
  function neonPath(c, kind, x, y, s) {
    c.beginPath();
    if (kind === 'cup') { c.moveTo(x - s * 0.42, y - s * 0.1); c.lineTo(x - s * 0.3, y + s * 0.36); c.lineTo(x + s * 0.16, y + s * 0.36); c.lineTo(x + s * 0.28, y - s * 0.1); c.closePath(); c.moveTo(x + s * 0.26, y); c.quadraticCurveTo(x + s * 0.56, y + s * 0.04, x + s * 0.2, y + s * 0.26); c.moveTo(x - s * 0.5, y + s * 0.48); c.lineTo(x + s * 0.4, y + s * 0.48); c.moveTo(x - s * 0.2, y - s * 0.22); c.quadraticCurveTo(x - s * 0.06, y - s * 0.34, x - s * 0.2, y - s * 0.48); c.moveTo(x + s * 0.06, y - s * 0.22); c.quadraticCurveTo(x + s * 0.2, y - s * 0.34, x + s * 0.06, y - s * 0.48); }
    else if (kind === 'ring') { c.arc(x, y, s * 0.5, 0, TAU); }
    else if (kind === 'bolt') { c.moveTo(x + s * 0.12, y - s * 0.5); c.lineTo(x - s * 0.24, y + s * 0.04); c.lineTo(x + s * 0.04, y + s * 0.04); c.lineTo(x - s * 0.1, y + s * 0.5); c.lineTo(x + s * 0.28, y - s * 0.1); c.lineTo(x, y - s * 0.1); c.closePath(); }
    else K.starPath(c, x, y, s * 0.5, s * 0.22, 5, 0);
  }
  function neon(c, kind, x, y, s, col, on, k) { /* a glass tube bent into a picture */
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (on) { neonPath(c, kind, x, y, s); c.lineWidth = s * 0.26; c.strokeStyle = alpha(col, 0.16 + 0.1 * k); c.stroke(); neonPath(c, kind, x, y, s); c.lineWidth = s * 0.14; c.strokeStyle = alpha(col, 0.4); c.stroke(); }
    neonPath(c, kind, x, y, s); c.lineWidth = s * 0.075; c.strokeStyle = on ? mix(col, '#ffffff', 0.25) : mix(col, '#ffffff', 0.5); c.stroke();
    if (on) { neonPath(c, kind, x, y, s); c.lineWidth = s * 0.025; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke(); }
  }
  Art.add('backdrop', 'diner', function (c, W, H, t, p, o, u) {
    var e = env(o.variant), fl = H * 0.69, i, j, d = H - fl, k = Math.exp(-5 * o.beat), wall = dim(p.bg, e), pap = dim(p.paper, e), red = dim(p.accent, e), teal = dim(p.accent2, e), chrome = dim('#cfd4de', e), dark = mix('#2a2a34', p.ink, 0.5);
    vgrad(c, W, H, [shade(wall, -0.12), wall], 0, fl);
    /* the long window, its blinds, neon pictures in the glass */
    var wx = W * 0.05, ww = W * 0.9, wy = H * 0.105, wh = H * 0.24;
    view(c, wx, wy, ww, wh, p, e, o, t, u, o.seed + 'v'); sheen(c, wx, wy, ww * 0.5, wh); sheen(c, wx + ww * 0.5, wy, ww * 0.5, wh);
    for (i = 0; i < 4; i++) rect(c, wx, wy + i * u * 1.7, ww, u * 1.2, alpha(pap, 0.8)); rect(c, wx, wy + u * 6.8, ww, u * 0.5, alpha(pap, 0.9));
    sash(c, wx, wy, ww, wh, chrome, u, 3, 1);
    rect(c, 0, H * 0.052, W, u * 1.2, red); rect(c, 0, H * 0.052 + u * 1.8, W, u * 0.5, chrome);
    /* tiles below the window, a shelf of pies */
    var tT = wy + wh + u * 3.2, tl = dim(mix(p.paper, p.bg, 0.2), e), ts = u * 3.4; rect(c, 0, tT, W, fl - tT, tl); c.fillStyle = shade(tl, -0.1); for (i = 0; i * ts < W; i++) c.fillRect(i * ts, tT, u * 0.25, fl - tT); for (j = 0; tT + j * ts < fl; j++) c.fillRect(0, tT + j * ts, W, u * 0.25);
    for (i = 0; i * ts < W; i++) { rect(c, i * ts, tT, ts, ts, i % 2 ? teal : pap); } rect(c, 0, tT - u * 0.7, W, u * 0.8, chrome); rect(c, 0, tT + ts, W, u * 0.5, chrome);
    checker(c, W, H, fl, dim(mix('#f4f0e6', p.paper, 0.5), e), dim(dark, e), u, 10);
    /* the counter and its stools */
    var cx = W * 0.345, cw = W * 0.43, cT = H * 0.565, kb = fl + u * 1.2;
    var sy = cT - H * 0.075; rect(c, cx + u * 2, sy, cw - u * 4, u * 1, chrome); rect(c, cx + u * 2, sy + u * 1, cw - u * 4, u * 0.4, 'rgba(0,0,0,0.15)');
    for (i = 0; i < 4; i++) { var px = cx + cw * (0.14 + i * 0.24); if (i % 2) { ell(c, px, sy, u * 3.4, u * 0.6, pap); poly(c, [px - u * 2.6, sy - u * 0.3, px + u * 2.6, sy - u * 0.3, px + u * 2.2, sy - u * 2.4, px - u * 1.4, sy - u * 2.8], dim(mix('#e0a85a', p.gold, 0.3), e)); rect(c, px - u * 2.4, sy - u * 1.4, u * 4.8, u * 0.6, dim(i === 1 ? p.accent : mix('#6a4a8a', p.accent, 0.3), e)); } else { mug(c, px - u * 1.6, sy, u * 2.4, pap, t, false); mug(c, px + u * 1.8, sy, u * 2.4, i ? teal : red, t, false); } }
    rect(c, cx, cT, cw, kb - cT, red); for (i = 0; i * u * 3 < cw; i++) rect(c, cx + i * u * 3 + u * 1.2, cT + u * 2, u * 0.6, kb - cT - u * 2, shade(red, -0.14)); rect(c, cx, cT + (kb - cT) * 0.42, cw, u * 2.2, pap); rect(c, cx, cT + (kb - cT) * 0.42 + u * 0.7, cw, u * 0.8, teal);
    rect(c, cx - u * 1.4, cT - u * 0.7, cw + u * 2.8, u * 2.2, chrome); rect(c, cx - u * 1.4, cT - u * 0.7, cw + u * 2.8, u * 0.6, 'rgba(255,255,255,0.5)'); rect(c, cx - u * 1.4, cT + u * 1.5, cw + u * 2.8, u * 0.5, 'rgba(0,0,0,0.2)');
    dome(c, cx + cw * 0.16, cT - u * 0.7, u * 9, dim(mix('#f6dcae', p.paper, 0.3), e), dim(mix('#f48fb1', p.accent, 0.3), e), chrome);
    var bx = cx + cw * 0.5; Rn(c, bx - u * 2.2, cT - u * 5.4, u * 4.4, u * 4.7, u * 0.5, chrome); rect(c, bx - u * 1.6, cT - u * 4, u * 3.2, u * 0.4, pap); rect(c, bx - u * 1.6, cT - u * 3, u * 3.2, u * 0.4, pap);
    var kx = cx + cw * 0.8; poly(c, [kx - u * 2.4, cT - u * 0.7, kx + u * 2.4, cT - u * 0.7, kx + u * 1.9, cT - u * 6.2, kx - u * 1.9, cT - u * 6.2], 'rgba(255,255,255,0.35)'); poly(c, [kx - u * 2.3, cT - u * 0.7, kx + u * 2.3, cT - u * 0.7, kx + u * 2.05, cT - u * 3.8, kx - u * 2.05, cT - u * 3.8], dim('#5a3420', e)); rect(c, kx - u * 2.2, cT - u * 7, u * 4.4, u * 1, dark); c.beginPath(); c.arc(kx + u * 2.4, cT - u * 3.6, u * 1.6, -PI / 2, PI / 2); c.lineWidth = u * 0.7; c.strokeStyle = dark; c.stroke(); K.steam(c, kx, cT - u * 7.4, u * 3, t, 2);
    for (i = 0; i < 4; i++) stool(c, cx + cw * (0.14 + i * 0.24), fl + u * 4.5, fl + u * 4.5 - H * 0.612, u * 4.2, i % 2 ? teal : red, chrome);
    /* a booth: its seat, its table, a milkshake */
    var bT = H * 0.455, bb = fl + u * 5.5, bwid = W * 0.17;
    Rn(c, -u * 3, bT, bwid + u * 3, bb - bT, u * 3, red); for (i = 1; i < 5; i++) rect(c, -u * 0.4 + i * bwid / 5, bT + u * 2.4, u * 0.5, bb - bT - u * 8, shade(red, -0.16)); Rn(c, -u * 3, bT, bwid + u * 3, u * 2.4, u * 1.2, shade(red, 0.16)); rect(c, -u, bT + u * 2.6, bwid, u * 0.5, pap);
    Rn(c, -u * 3, bb - u * 9.5, bwid + u * 7, u * 4.2, u * 2, shade(red, 0.08)); rect(c, -u, bb - u * 5.3, bwid + u * 4, u * 5.3, chrome); rect(c, -u, bb - u * 5.3, bwid + u * 4, u * 0.7, shade(chrome, -0.2)); rect(c, -u, bb - u * 2.6, bwid + u * 4, u * 0.6, red);
    var tx0 = W * 0.165, tx1 = W * 0.325, tY = H * 0.618, tpx = W * 0.265; ell(c, tpx, bb + u * 0.4, u * 5, u * 1.1, 'rgba(0,0,0,0.2)'); ell(c, tpx, bb, u * 4, u * 0.9, chrome); rect(c, tpx - u * 0.8, tY, u * 1.6, bb - tY, chrome); rect(c, tpx - u * 0.8, tY, u * 0.5, bb - tY, 'rgba(255,255,255,0.4)');
    Rn(c, tx0, tY - u * 0.9, tx1 - tx0, u * 2.2, u * 1, chrome); Rn(c, tx0, tY - u * 1.2, tx1 - tx0, u * 1.5, u * 0.7, pap);
    var mxs = tx0 + (tx1 - tx0) * 0.3, my = tY - u * 1.2, pink = dim(mix('#f7a8c4', p.accent, 0.25), e); poly(c, [mxs - u * 2.1, my - u * 7, mxs + u * 2.1, my - u * 7, mxs + u * 1.3, my - u * 0.8, mxs - u * 1.3, my - u * 0.8], pink); poly(c, [mxs - u * 2.1, my - u * 7, mxs - u * 1.2, my - u * 7, mxs - u * 0.7, my - u * 0.8, mxs - u * 1.3, my - u * 0.8], 'rgba(255,255,255,0.3)'); rect(c, mxs - u * 1.6, my - u * 0.8, u * 3.2, u * 0.8, chrome);
    dot(c, mxs - u * 1, my - u * 7.4, u * 1.3, pap); dot(c, mxs + u * 1, my - u * 7.4, u * 1.3, pap); dot(c, mxs, my - u * 8.4, u * 1.4, pap); dot(c, mxs + u * 0.2, my - u * 9.8, u * 0.8, '#e8364a'); L(c, mxs + u * 1.2, my - u * 6.4, mxs + u * 3, my - u * 11.4, u * 0.5, teal);
    for (i = 0; i < 2; i++) { var qx = tx0 + (tx1 - tx0) * (0.62 + i * 0.17), qc = i ? dim(p.gold, e) : dim('#d8323c', e); Rn(c, qx - u * 0.9, my - u * 4, u * 1.8, u * 4, u * 0.6, qc); poly(c, [qx - u * 0.6, my - u * 4, qx + u * 0.6, my - u * 4, qx + u * 0.25, my - u * 5.6, qx - u * 0.25, my - u * 5.6], shade(qc, 0.2)); rect(c, qx - u * 0.9, my - u * 2.8, u * 1.8, u * 1, 'rgba(255,255,255,0.4)'); }
    /* a jukebox, playing */
    var jw = W * 0.185, jx = W * 0.8, jT = H * 0.43, jb = fl + u * 5.5, jh = jb - jT, jc = dim(mix('#8a4a2a', p.ink, 0.2), e), cols = [p.accent, p.gold, p.accent2];
    ell(c, jx + jw / 2, jb, jw * 0.6, u * 1.3, 'rgba(0,0,0,0.22)'); if (e.night) glow(c, jx + jw / 2, jT + jh * 0.4, jw * 1.5, p.gold, 0.2 + 0.06 * k);
    K.archPath(c, jx, jT, jw, jh); c.fillStyle = jc; c.fill();
    for (i = 0; i < 3; i++) { var ins = u * (1.2 + i * 1.5), on = (i + o.n) % 3 === 0; K.archPath(c, jx + ins, jT + ins, jw - ins * 2, jh * 0.62 - ins); c.lineWidth = u * 1.1; c.strokeStyle = on ? mix(cols[i], '#ffffff', 0.35 + 0.3 * k) : dim(cols[i], e); c.stroke(); }
    var iw = jw - u * 11.4; if (iw > u * 4) { K.archPath(c, jx + u * 5.7, jT + u * 5.7, iw, jh * 0.62 - u * 7.4); c.fillStyle = '#fff3c8'; c.fill(); var rr = Math.min(iw * 0.42, jh * 0.16), rcx = jx + jw / 2, rcy = jT + u * 5.7 + iw / 2 + u * 0.6; dot(c, rcx, rcy, rr, '#1c1a24'); dot(c, rcx, rcy, rr * 0.4, red); dot(c, rcx, rcy, rr * 0.08, pap); c.beginPath(); c.arc(rcx, rcy, rr * 0.7, t * 3, t * 3 + 0.9); c.lineWidth = rr * 0.1; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke(); }
    rect(c, jx + u * 1.6, jT + jh * 0.64, jw - u * 3.2, u * 2.4, chrome); for (i = 0; i < 6; i++) dot(c, jx + u * 3 + i * (jw - u * 6) / 5, jT + jh * 0.64 + u * 1.2, u * 0.6, i === (o.n % 6) ? '#fff3c8' : dim(cols[i % 3], e));
    Rn(c, jx + u * 2.2, jT + jh * 0.72, jw - u * 4.4, jh * 0.22, u * 1, dark); for (i = 0; i < 6; i++) rect(c, jx + u * 3.2 + i * (jw - u * 7) / 5, jT + jh * 0.735, u * 0.6, jh * 0.19, dim(p.gold, e)); rect(c, jx, jb - u * 1.8, jw, u * 1.8, shade(jc, -0.3));
    /* after dark the room sinks back and the neon takes over */
    if (e.night) { rect(c, 0, 0, W, H, 'rgba(16,10,44,0.26)'); glow(c, W * 0.2, fl + d * 0.3, u * 34, p.accent, 0.26); glow(c, W * 0.8, fl + d * 0.3, u * 34, p.gold, 0.2); glow(c, wx + ww * 0.165, wy + wh * 0.56, u * 26, p.accent, 0.26 + 0.1 * k); glow(c, wx + ww * 0.835, wy + wh * 0.56, u * 26, p.gold, 0.26 + 0.1 * k); glow(c, jx + jw / 2, jT + jh * 0.35, jw * 1.2, p.gold, 0.22 + 0.08 * k); }
    neon(c, 'cup', wx + ww * 0.165, wy + wh * 0.56, Math.min(wh * 0.62, ww * 0.2), p.accent, true, e.night ? k : -1); neon(c, 'star', wx + ww * 0.835, wy + wh * 0.56, Math.min(wh * 0.62, ww * 0.2), p.gold, true, e.night ? k : -1);
    pendant(c, W * 0.42, H * 0.03, u * 3, red, e, u); pendant(c, W * 0.58, H * 0.03, u * 3, red, e, u);
  }, { variants: ['day', 'night'], stage: 'cast-low' });

  /* ---------- the bakery ---------- */
  function bread(c, kind, x, y, s, crust, p) { /* something baked, sitting on y */
    var i, dk = shade(crust, -0.22), lt = shade(crust, 0.3);
    if (kind === 0) { ell(c, x, y - s * 0.28, s * 0.5, s * 0.28, crust); ell(c, x, y - s * 0.1, s * 0.46, s * 0.1, dk); for (i = -1; i <= 1; i++) L(c, x + i * s * 0.22 - s * 0.06, y - s * 0.44, x + i * s * 0.22 + s * 0.06, y - s * 0.24, s * 0.06, lt); }
    else if (kind === 1) { ell(c, x, y - s * 0.34, s * 0.42, s * 0.34, crust); ell(c, x, y - s * 0.08, s * 0.38, s * 0.08, dk); L(c, x - s * 0.18, y - s * 0.5, x + s * 0.18, y - s * 0.3, s * 0.05, lt); L(c, x + s * 0.18, y - s * 0.5, x - s * 0.18, y - s * 0.3, s * 0.05, lt); }
    else if (kind === 2) { for (i = 0; i < 4; i++) { c.save(); c.translate(x + (i - 1.5) * s * 0.17, y - s * 0.3); c.rotate((i - 1.5) * 0.16); Rn(c, -s * 0.09, -s * 0.9, s * 0.18, s * 0.95, s * 0.09, i % 2 ? crust : shade(crust, -0.08)); for (var j = 0; j < 3; j++) L(c, -s * 0.05, -s * (0.74 - j * 0.2), s * 0.05, -s * (0.68 - j * 0.2), s * 0.035, lt); c.restore(); }
      poly(c, [x - s * 0.44, y - s * 0.46, x + s * 0.44, y - s * 0.46, x + s * 0.34, y, x - s * 0.34, y], mix('#c79a5a', p.gold, 0.25)); c.fillStyle = 'rgba(0,0,0,0.14)'; for (i = 0; i < 3; i++) c.fillRect(x - s * 0.42 + i * s * 0.03, y - s * 0.36 + i * s * 0.12, s * 0.84 - i * s * 0.06, s * 0.035); rect(c, x - s * 0.47, y - s * 0.5, s * 0.94, s * 0.09, mix('#dab06a', p.gold, 0.25)); }
    else if (kind === 3) { for (i = -2; i <= 2; i++) ell(c, x + i * s * 0.17, y - s * 0.2 - (2 - Math.abs(i)) * s * 0.05, s * 0.16, s * (0.22 - Math.abs(i) * 0.04), i % 2 ? crust : shade(crust, 0.14), i * 0.3); }
    else if (kind === 4) { poly(c, [x - s * 0.26, y - s * 0.36, x + s * 0.26, y - s * 0.36, x + s * 0.18, y, x - s * 0.18, y], p.paper); c.fillStyle = 'rgba(0,0,0,0.1)'; for (i = -1; i <= 1; i++) c.fillRect(x + i * s * 0.12 - s * 0.015, y - s * 0.34, s * 0.03, s * 0.34); dot(c, x - s * 0.14, y - s * 0.4, s * 0.17, crust); dot(c, x + s * 0.14, y - s * 0.4, s * 0.17, crust); dot(c, x, y - s * 0.52, s * 0.19, shade(crust, 0.12)); dot(c, x, y - s * 0.72, s * 0.08, '#e8364a'); }
    else if (kind === 5) { ell(c, x, y - s * 0.12, s * 0.46, s * 0.12, dk); ell(c, x, y - s * 0.2, s * 0.46, s * 0.14, crust); ell(c, x, y - s * 0.22, s * 0.34, s * 0.09, p.accent); for (i = -1; i <= 1; i++) dot(c, x + i * s * 0.17, y - s * 0.23, s * 0.05, shade(p.accent, 0.4)); }
    else { c.beginPath(); c.arc(x, y - s * 0.24, s * 0.18, 0, TAU); c.lineWidth = s * 0.17; c.strokeStyle = crust; c.stroke(); c.beginPath(); c.arc(x, y - s * 0.27, s * 0.18, PI * 1.05, PI * 1.95); c.lineWidth = s * 0.1; c.strokeStyle = p.accent; c.stroke(); }
  }
  Art.add('backdrop', 'bakery', function (c, W, H, t, p, o, u) {
    var e = env('day'), fl = H * 0.69, i, j, d = H - fl, wall = p.bg, pap = p.paper, wood = mix('#9a6238', p.ink, 0.12), crust = mix('#d99a52', p.gold, 0.3), brick = mix('#b5654a', p.accent, 0.3), metal = '#cfd4de', ink = mix('#2a2430', p.ink, 0.4);
    vgrad(c, W, H, [shade(wall, -0.08), wall, shade(wall, 0.08)], 0, fl);
    var ts = u * 4.2; c.fillStyle = 'rgba(255,255,255,0.1)'; for (j = 0; j * ts < fl; j++) { c.fillRect(0, j * ts, W, u * 0.25); for (i = -1; i * ts * 2 < W; i++) c.fillRect(i * ts * 2 + (j % 2) * ts, j * ts, u * 0.25, ts); }
    /* a round window, high up, morning in it */
    var wr = Math.min(W * 0.13, H * 0.09), wcx = W / 2, wcy = H * 0.19; dot(c, wcx, wcy, wr + u * 1.6, pap); c.save(); c.beginPath(); c.arc(wcx, wcy, wr, 0, TAU); c.clip(); view(c, wcx - wr, wcy - wr, wr * 2, wr * 2, p, e, o, t, u, o.seed + 'v'); sheen(c, wcx - wr, wcy - wr, wr * 2, wr * 2); c.restore(); rect(c, wcx - u * 0.4, wcy - wr, u * 0.8, wr * 2, pap); rect(c, wcx - wr, wcy - u * 0.4, wr * 2, u * 0.8, pap);
    /* racks of bread on the left */
    var rx = W * 0.02, rw = W * 0.27, rT = H * 0.13, rB = H * 0.555, n = Math.max(3, Math.round((rB - rT) / (u * 14))), rh = (rB - rT) / n, per = [[0, 1, 0], [2, 1, 2], [1, 3, 0], [3, 0, 1], [0, 2, 1]];
    rect(c, rx, rT, rw, rB - rT, shade(wall, -0.2)); rect(c, rx, rT, u * 1.2, rB - rT + u * 3, wood); rect(c, rx + rw - u * 1.2, rT, u * 1.2, rB - rT + u * 3, wood);
    for (j = 0; j < n; j++) { var sy = rT + (j + 1) * rh - u * 1; for (i = 0; i < 3; i++) bread(c, per[j % 5][i], rx + rw * (0.2 + i * 0.3), sy, Math.min(rw * 0.3, rh * 0.95), i % 2 ? shade(crust, -0.08) : crust, p); rect(c, rx - u * 0.6, sy, rw + u * 1.2, u * 1.1, shade(wood, 0.16)); rect(c, rx, sy + u * 1.1, rw, u * 0.5, 'rgba(0,0,0,0.2)'); }
    /* the brick oven on the right, its fire going */
    var ox = W * 0.71, ow = W - ox, oT = H * 0.3, acx = ox + ow * 0.52, aw = ow * 0.58, aT = H * 0.4, aB = H * 0.545, fk = 0.75 + 0.15 * Math.sin(t * 5) + 0.1 * Math.sin(t * 11);
    poly(c, [ox + ow * 0.3, 0, ox + ow * 0.74, 0, ox + ow * 0.86, oT, ox + ow * 0.18, oT], shade(brick, -0.12));
    rect(c, ox, oT, ow + 1, fl - oT, brick); c.fillStyle = shade(brick, -0.16); for (j = 0; oT + j * u * 2.6 < fl; j++) { c.fillRect(ox, oT + j * u * 2.6, ow, u * 0.25); for (i = 0; i * u * 5.4 < ow + u * 5; i++) c.fillRect(ox + i * u * 5.4 + (j % 2) * u * 2.7, oT + j * u * 2.6, u * 0.25, u * 2.6); }
    rect(c, ox - u * 1, oT - u * 1, ow + u * 2, u * 2.2, shade(brick, 0.26)); rect(c, ox, oT + u * 1.2, ow, u * 0.5, 'rgba(0,0,0,0.2)');
    K.archPath(c, acx - aw / 2 - u * 1.6, aT - u * 1.6, aw + u * 3.2, aB - aT + u * 1.6); c.fillStyle = shade(brick, 0.22); c.fill(); K.archPath(c, acx - aw / 2, aT, aw, aB - aT); c.fillStyle = '#2a1410'; c.fill();
    c.save(); K.archPath(c, acx - aw / 2, aT, aw, aB - aT); c.clip(); glow(c, acx, aB, aw * 0.9, '#ff9a3a', 0.85 * fk); for (i = -1; i <= 1; i++) K.flame(c, acx + i * aw * 0.26, aB - u * 0.4, aw * 0.2, (aB - aT) * (0.5 - Math.abs(i) * 0.1), t, i * 2 + 1); bread(c, 0, acx - aw * 0.1, aB - u * 0.2, aw * 0.36, shade(crust, -0.25), p); c.restore();
    glow(c, acx, aB, aw * 1.5, '#ff9a3a', 0.2 * fk); rect(c, ox, aB, ow, u * 1.6, shade(brick, 0.26));
    var plx = ox + u * 3; L(c, plx, fl + u * 1, plx + u * 2, H * 0.36, u * 0.8, mix('#d0a060', p.gold, 0.3)); c.save(); c.translate(plx + u * 2.3, H * 0.33); c.rotate(0.06); Rn(c, -u * 2.6, -u * 5, u * 5.2, u * 7, u * 1.6, mix('#d0a060', p.gold, 0.3)); c.restore();
    /* the glass counter, full of sweet things */
    var cT = H * 0.572, cb = fl + u * 3.4, cx0 = W * 0.045, cw = W * 0.91, gh = (cb - cT) * 0.62, pal = [p.accent, crust, mix('#f7a8c4', p.accent, 0.25), mix('#7a4a2a', p.ink, 0.2), p.gold];
    Rn(c, cx0, cT, cw, cb - cT, u * 1, mix(p.accent2, p.ink, 0.15)); rect(c, cx0 + u * 1.4, cT + u * 1.6, cw - u * 2.8, gh, mix(pap, wall, 0.25));
    for (j = 0; j < 2; j++) { var gy = cT + u * 1.6 + gh * (j + 1) / 2 - u * 0.5; for (i = 0; i < 9; i++) bread(c, [4, 5, 6, 3, 4, 6, 5, 4, 3][(i + j * 4) % 9], cx0 + cw * (i + 0.6) / 9.2, gy, Math.min(gh * 0.52, cw / 13), pal[(i + j * 2) % 5], p); rect(c, cx0 + u * 1.4, gy, cw - u * 2.8, u * 0.5, 'rgba(255,255,255,0.7)'); }
    rect(c, cx0 + u * 1.4, cT + u * 1.6, cw - u * 2.8, gh, 'rgba(255,255,255,0.12)'); sheen(c, cx0 + u * 1.4, cT + u * 1.6, cw * 0.5, gh); for (i = 1; i < 3; i++) rect(c, cx0 + cw * i / 3 - u * 0.3, cT + u * 1.6, u * 0.6, gh, metal);
    for (i = 0; i * u * 5 < cw - u * 3; i += 2) rect(c, cx0 + u * 1.4 + i * u * 5, cT + gh + u * 3, Math.min(u * 5, cw - u * 2.8 - i * u * 5), cb - cT - gh - u * 4.4, alpha(pap, 0.3));
    rect(c, cx0 - u * 1, cT - u * 0.7, cw + u * 2, u * 2.1, pap); rect(c, cx0 - u * 1, cT + u * 1.4, cw + u * 2, u * 0.5, 'rgba(0,0,0,0.16)');
    /* on the counter: a scale, a cake, paper bags, a bell */
    var sx = W * 0.16, sb = cT - u * 0.7; poly(c, [sx - u * 3, sb, sx + u * 3, sb, sx + u * 2.2, sb - u * 3.4, sx - u * 2.2, sb - u * 3.4], p.accent); dot(c, sx, sb - u * 1.8, u * 1.3, pap); L(c, sx, sb - u * 1.8, sx + Math.sin(t * 1.2) * u * 0.7, sb - u * 2.8, u * 0.25, ink); rect(c, sx - u * 0.4, sb - u * 5, u * 0.8, u * 1.8, metal); ell(c, sx, sb - u * 5.2, u * 4.4, u * 0.9, metal); bread(c, 1, sx, sb - u * 5.4, u * 5, crust, p);
    dome(c, W * 0.37, sb, u * 10, mix('#f6dcae', pap, 0.3), mix('#f7a8c4', p.accent, 0.3), metal);
    for (i = 0; i < 3; i++) { var bx = W * (0.57 + i * 0.045), bh = u * (6.4 - i * 0.8), bc = shade(mix('#d9b98a', p.gold, 0.2), -i * 0.06); poly(c, [bx - u * 2.2, sb, bx + u * 2.2, sb, bx + u * 2.2, sb - bh, bx, sb - bh - u * 0.9, bx - u * 2.2, sb - bh], bc); icon(c, 'wheat', bx, sb - bh * 0.48, u * 3, shade(bc, -0.3)); }
    var blx = W * 0.8; ell(c, blx, sb, u * 2.6, u * 0.5, shade(p.gold, -0.2)); c.beginPath(); c.arc(blx, sb - u * 0.3, u * 2.1, PI, 0); c.closePath(); c.fillStyle = p.gold; c.fill(); dot(c, blx, sb - u * 2.6, u * 0.55, shade(p.gold, -0.2)); dot(c, blx - u * 0.8, sb - u * 1.5, u * 0.5, 'rgba(255,255,255,0.5)');
    /* the floor: small tiles, sacks of flour, a basket of long loaves */
    checker(c, W, H, fl, mix(pap, p.bg2, 0.2), mix(mix(pap, p.bg2, 0.5), p.ink, 0.16), u, 16);
    for (i = 0; i < 2; i++) { var fx = W * (0.27 + i * 0.12), fb = fl + d * (0.42 + i * 0.14), fs = u * (17 - i * 2.5), fc = shade(mix('#efe3c8', pap, 0.4), -i * 0.06); ell(c, fx, fb, fs * 0.6, fs * 0.12, 'rgba(0,0,0,0.2)'); Rn(c, fx - fs * 0.46, fb - fs * 0.95, fs * 0.92, fs * 0.95, fs * 0.22, fc); poly(c, [fx - fs * 0.22, fb - fs * 0.92, fx + fs * 0.22, fb - fs * 0.92, fx + fs * 0.32, fb - fs * 1.14, fx - fs * 0.32, fb - fs * 1.14], fc); rect(c, fx - fs * 0.24, fb - fs * 0.98, fs * 0.48, fs * 0.08, mix('#b08a5a', p.gold, 0.3)); icon(c, 'wheat', fx, fb - fs * 0.46, fs * 0.5, mix('#c79a5a', p.gold, 0.4)); }
    ell(c, W * 0.7, fl + d * 0.56, u * 10.5, u * 1.9, 'rgba(0,0,0,0.2)'); bread(c, 2, W * 0.7, fl + d * 0.56, u * 21, crust, p);
    dot(c, W * 0.42, fl + d * 0.3, u * 2.4, 'rgba(255,255,255,0.14)'); dot(c, W * 0.45, fl + d * 0.34, u * 1.4, 'rgba(255,255,255,0.12)');
    /* a striped pelmet, lamps */
    awning(c, -u, -u * 0.6, W + u * 2, H * 0.046, Math.max(10, Math.round(W / (u * 5))), p.accent, pap, u, 0);
    pendant(c, W * 0.25, H * 0.085, u * 3.6, p.gold, e, u); pendant(c, W * 0.75, H * 0.085, u * 3.6, p.gold, e, u);
  }, { variants: ['day'], stage: 'cast-low' });

  /* ---------- the flower shop ---------- */
  function bucket(c, x, base, s, col, fcol, mid, kind, t, ph, leafc) { /* a pail of cut flowers standing on base */
    var i, n = 7;
    for (i = 0; i < n; i++) { var a = -PI / 2 + (i - 3) * 0.2 + Math.sin(t * 1.1 + ph + i) * 0.025, len = s * (1.25 + ((i * 7) % 3) * 0.18 - Math.abs(i - 3) * 0.06), fx = x + Math.cos(a) * len, fy = base - s * 0.8 + Math.sin(a) * len, r = s * 0.2;
      L(c, x + (i - 3) * s * 0.06, base - s * 0.8, fx, fy, s * 0.045, leafc); if (i % 2) K.leaf(c, x + (fx - x) * 0.5, base - s * 0.8 + (fy - base + s * 0.8) * 0.5, s * 0.34, a + (i % 4 === 1 ? 0.9 : -0.9), leafc);
      if (kind === 0) { ell(c, fx, fy - r * 0.3, r * 0.72, r, fcol); poly(c, [fx - r * 0.72, fy - r * 0.5, fx - r * 0.4, fy - r * 1.5, fx, fy - r * 0.7, fx + r * 0.4, fy - r * 1.5, fx + r * 0.72, fy - r * 0.5], fcol); ell(c, fx - r * 0.2, fy - r * 0.3, r * 0.2, r * 0.6, 'rgba(255,255,255,0.22)'); }
      else if (kind === 1) K.flower(c, fx, fy, r * 1.15, fcol, mid, i);
      else if (kind === 2) { dot(c, fx, fy, r * 1.05, fcol); dot(c, fx + r * 0.1, fy + r * 0.05, r * 0.66, shade(fcol, -0.14)); dot(c, fx - r * 0.06, fy - r * 0.1, r * 0.34, shade(fcol, 0.2)); }
      else if (kind === 3) { for (var k = 0; k < 10; k++) ell(c, fx + Math.cos(k / 10 * TAU) * r * 0.95, fy + Math.sin(k / 10 * TAU) * r * 0.95, r * 0.5, r * 0.24, fcol, k / 10 * TAU); dot(c, fx, fy, r * 0.66, mid); }
      else { for (var q = 0; q < 5; q++) dot(c, fx - Math.cos(a) * q * r * 0.5 + (q % 2 ? 1 : -1) * r * 0.2, fy - Math.sin(a) * q * r * 0.5, r * (0.5 - q * 0.05), q % 2 ? fcol : shade(fcol, 0.2)); } }
    poly(c, [x - s * 0.36, base - s * 0.86, x + s * 0.36, base - s * 0.86, x + s * 0.27, base, x - s * 0.27, base], col); rect(c, x - s * 0.39, base - s * 0.9, s * 0.78, s * 0.11, shade(col, 0.2)); rect(c, x - s * 0.24, base - s * 0.72, s * 0.09, s * 0.6, 'rgba(255,255,255,0.25)'); rect(c, x - s * 0.33, base - s * 0.34, s * 0.66, s * 0.05, shade(col, -0.16));
  }
  function basket(c, x, top, s, col, lf, fcol, t, ph) { /* a hanging basket trailing green */
    var i, sw = Math.sin(t * 0.9 + ph) * s * 0.04;
    L(c, x, top, x - s * 0.42 + sw, top + s * 0.8, s * 0.03, '#3a3040'); L(c, x, top, x + s * 0.42 + sw, top + s * 0.8, s * 0.03, '#3a3040'); L(c, x, top, x + sw, top + s * 0.8, s * 0.03, '#3a3040');
    for (i = 0; i < 7; i++) { var tx = x + sw + (i - 3) * s * 0.15, tl = s * (0.5 + ((i * 5) % 3) * 0.22), w = Math.sin(t * 1.2 + i + ph) * s * 0.05; c.beginPath(); c.moveTo(tx, top + s * 0.86); c.quadraticCurveTo(tx + (i - 3) * s * 0.08, top + s * 0.9 + tl * 0.5, tx + (i - 3) * s * 0.05 + w, top + s * 0.86 + tl); c.lineWidth = s * 0.05; c.strokeStyle = lf; c.stroke(); dot(c, tx + (i - 3) * s * 0.05 + w, top + s * 0.86 + tl, s * 0.07, i % 2 ? fcol : lf); }
    for (i = 0; i < 8; i++) { dot(c, x + sw + (i - 3.5) * s * 0.13, top + s * (0.72 - (i % 3) * 0.08), s * 0.16, i % 2 ? lf : shade(lf, -0.12)); if (i % 2) dot(c, x + sw + (i - 3.5) * s * 0.13, top + s * (0.62 - (i % 3) * 0.06), s * 0.08, fcol); }
    c.beginPath(); c.arc(x + sw, top + s * 0.8, s * 0.46, 0, PI); c.closePath(); c.fillStyle = col; c.fill(); rect(c, x + sw - s * 0.48, top + s * 0.77, s * 0.96, s * 0.07, shade(col, 0.2));
  }
  Art.add('backdrop', 'flowershop', function (c, W, H, t, p, o, u) {
    var fl = H * 0.675, i, j, d = H - fl, wall = p.bg, pap = p.paper, lf = mix('#4a9a58', p.accent2, 0.4), wood = mix('#9a6a44', p.ink, 0.12), tin = ['#a9b6c6', mix(p.accent2, pap, 0.3), '#8fa0b4', mix(p.gold, pap, 0.25)],
      fc = [p.accent, p.gold, mix(p.accent, pap, 0.55), mix('#9a6ad0', p.accent, 0.25), pap, mix('#ff8a3c', p.gold, 0.4)];
    /* the shop front: boards, a wide window, the awning */
    vgrad(c, W, H, [shade(wall, -0.06), wall], 0, fl); c.fillStyle = 'rgba(0,0,0,0.06)'; for (j = 0; j * u * 3.6 < fl; j++) c.fillRect(0, j * u * 3.6, W, u * 0.3); c.fillStyle = 'rgba(255,255,255,0.08)'; for (j = 0; j * u * 3.6 < fl; j++) c.fillRect(0, j * u * 3.6 + u * 0.3, W, u * 0.3);
    var wx = W * 0.25, ww = W * 0.5, wy = H * 0.135, wh = H * 0.415, gl = mix(mix('#dff4ff', p.bg2, 0.35), wall, 0.22);
    rect(c, wx, wy, ww, wh, gl); vgrad2(c, wx, wy, ww, wh, 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)');
    for (i = 0; i < 3; i++) rect(c, wx, wy + wh * (0.34 + i * 0.24), ww, u * 0.5, alpha(wood, 0.16));
    for (i = 0; i < 9; i++) { var gx = wx + ww * (i + 0.5) / 9, gy = wy + wh * (0.34 + (i % 3) * 0.24), gs = u * (3.2 + (i % 2)); rect(c, gx - gs * 0.3, gy - gs * 0.5, gs * 0.6, gs * 0.5, alpha(p.accent, 0.14)); dot(c, gx, gy - gs * 0.9, gs * 0.5, alpha(lf, 0.2)); dot(c, gx + gs * 0.3, gy - gs * 1.2, gs * 0.3, alpha(fc[i % 4], 0.22)); }
    sheen(c, wx, wy, ww, wh); sash(c, wx, wy, ww, wh, pap, u, 2, 1); rect(c, wx, wy + wh * 0.16, ww, u * 0.6, pap);
    icon(c, 'flower', W / 2, wy + wh * 0.08, Math.min(u * 6, wh * 0.14), alpha(pap, 0.75), alpha(p.gold, 0.8));
    /* a box of blooms under the window */
    var by = wy + wh + u * 2.6; for (i = 0; i < 16; i++) { var fx = wx + ww * (i + 0.5) / 16, fy = by - u * (1.4 + (i % 3) * 1.2) + Math.sin(t * 1.3 + i) * u * 0.12; dot(c, fx, fy + u * 0.8, u * 2, i % 2 ? lf : shade(lf, -0.12)); if (i % 3 !== 1) K.flower(c, fx, fy - u * 0.6, u * 1.5, fc[i % 6], i % 6 === 1 ? p.accent : p.gold, i); }
    for (i = 0; i < 6; i++) { var vx = wx + ww * (i + 0.5) / 6; c.beginPath(); c.moveTo(vx, by + u * 1); c.quadraticCurveTo(vx + u, by + u * 5, vx + Math.sin(t + i) * u * 0.5, by + u * (7 + (i % 2) * 2.4)); c.lineWidth = u * 0.5; c.strokeStyle = lf; c.stroke(); dot(c, vx + Math.sin(t + i) * u * 0.5, by + u * (7 + (i % 2) * 2.4), u * 0.8, shade(lf, 0.15)); }
    Rn(c, wx - u * 2, by, ww + u * 4, u * 4, u * 0.6, wood); rect(c, wx - u * 2, by, ww + u * 4, u * 0.7, shade(wood, 0.2)); rect(c, wx - u * 2, by + u * 2.2, ww + u * 4, u * 0.3, shade(wood, -0.2));
    rect(c, 0, fl - u * 3.4, W, u * 3.4, shade(wall, -0.24)); rect(c, 0, fl - u * 3.4, W, u * 0.6, shade(wall, -0.1));
    /* the pavement */
    var pv = mix(mix(pap, p.ink, 0.18), p.bg2, 0.2); vgrad2(c, 0, fl, W, d, pv, shade(pv, -0.2)); c.strokeStyle = 'rgba(0,0,0,0.1)'; c.lineWidth = Math.max(0.6, u * 0.25); c.beginPath(); for (i = -7; i <= 7; i++) { c.moveTo(W / 2 + i * W * 0.1, fl); c.lineTo(W / 2 + i * W * 0.26, H); } for (i = 1; i < 5; i++) { c.moveTo(0, fl + d * Math.pow(i / 5, 1.5)); c.lineTo(W, fl + d * Math.pow(i / 5, 1.5)); } c.stroke(); rect(c, 0, fl, W, u * 0.8, 'rgba(0,0,0,0.18)');
    /* the stands of pails, left and right */
    for (j = 0; j < 2; j++) { var dir = j ? -1 : 1, ex = j ? W : 0, sw = W * 0.235;
      for (i = 2; i >= 0; i--) { var sy = fl + u * 3 - (i + 1) * H * 0.068, stw = sw * (1 - i * 0.26), x0 = j ? W - stw : 0; rect(c, x0, sy, stw, fl + u * 3 - sy, shade(wood, -0.08 - i * 0.05)); rect(c, x0 - (j ? u * 0.8 : 0), sy - u * 1, stw + u * 0.8, u * 1.2, shade(wood, 0.18)); }
      for (i = 2; i >= 0; i--) { var sy2 = fl + u * 3 - (i + 1) * H * 0.068 - u * 1, n = 3 - i, k; for (k = 0; k < n; k++) { var idx = j * 5 + i * 2 + k, bx = ex + dir * (sw * (1 - i * 0.26)) * ((k + 0.55) / (n + 0.1)) * (i === 0 ? 0.94 : 0.98); bucket(c, bx, sy2, u * (10 - i * 0.6), tin[idx % 4], fc[idx % 6], idx % 6 === 1 ? mix('#6a4028', p.ink, 0.2) : p.gold, [0, 3, 2, 1, 4, 2, 1, 0, 3, 2, 4][idx % 11], t, idx, lf); } } }
    /* hanging baskets under the awning */
    basket(c, W * 0.115, H * 0.07, u * 12, mix('#8a5a34', p.ink, 0.2), lf, p.accent, t, 0); basket(c, W * 0.885, H * 0.07, u * 12, mix('#8a5a34', p.ink, 0.2), lf, p.gold, t, 2);
    awning(c, -u * 2, -u * 0.6, W + u * 4, H * 0.078, Math.max(8, Math.round(W / (u * 6.6))), p.accent2, pap, u, 0); rect(c, 0, H * 0.078 + u * 1.6, W, u * 1.2, 'rgba(0,0,0,0.07)');
    /* out front: a watering can, a board with a flower on it, petals */
    bucket(c, W * 0.1, H * 0.99, u * 15, tin[1], fc[2], p.gold, 0, t, 21, lf); bucket(c, W * 0.215, H * 0.975, u * 11, tin[0], fc[1], mix('#6a4028', p.ink, 0.2), 3, t, 22, lf);
    bucket(c, W * 0.9, H * 0.99, u * 15, tin[3], fc[3], p.gold, 4, t, 23, lf); bucket(c, W * 0.785, H * 0.975, u * 11, tin[2], fc[0], p.gold, 2, t, 24, lf);
    var cx = W * 0.35, cy = fl + d * 0.52, cc = mix(p.accent2, '#8fa0b4', 0.4); c.save(); c.translate(cx, cy); c.scale(1.6, 1.6); c.translate(-cx, -cy); ell(c, cx, cy, u * 6, u * 1.1, 'rgba(0,0,0,0.18)'); L(c, cx + u * 3, cy - u * 3, cx + u * 8, cy - u * 7.4, u * 1, cc); ell(c, cx + u * 8.4, cy - u * 7.8, u * 1.6, u * 1, shade(cc, 0.14), -0.7); c.beginPath(); c.arc(cx - u * 3.4, cy - u * 3.6, u * 2.6, PI * 0.5, PI * 1.5); c.lineWidth = u * 0.8; c.strokeStyle = shade(cc, -0.14); c.stroke();
    Rn(c, cx - u * 3.6, cy - u * 6.6, u * 7.2, u * 6.6, u * 1, cc); rect(c, cx - u * 3.6, cy - u * 5.4, u * 7.2, u * 0.6, shade(cc, -0.16)); rect(c, cx - u * 2.6, cy - u * 4.4, u * 0.9, u * 3.4, 'rgba(255,255,255,0.25)'); for (i = 0; i < 3; i++) { var f = frac(t * 0.6 + i / 3); dot(c, cx + u * 9.4 + f * u * 1.6, cy - u * 7 + f * f * u * 6, u * 0.35, 'rgba(210,235,255,' + (0.8 * (1 - f)).toFixed(3) + ')'); }
    c.restore();
    var ax = W * 0.65, ab = fl + d * 0.6, ah = u * 22, awd = u * 14; ell(c, ax, ab, awd * 0.7, u * 1.2, 'rgba(0,0,0,0.18)'); L(c, ax - awd * 0.5, ab, ax - awd * 0.36, ab - ah, u * 1, wood); L(c, ax + awd * 0.5, ab, ax + awd * 0.36, ab - ah, u * 1, wood); poly(c, [ax - awd * 0.46, ab - u * 2.4, ax + awd * 0.46, ab - u * 2.4, ax + awd * 0.38, ab - ah + u * 0.6, ax - awd * 0.38, ab - ah + u * 0.6], mix('#2b3340', p.ink, 0.3));
    icon(c, 'flower', ax, ab - ah * 0.62, u * 7.6, alpha(pap, 0.92), p.gold); L(c, ax, ab - ah * 0.44, ax, ab - u * 5, u * 0.6, alpha(pap, 0.8)); K.leaf(c, ax, ab - u * 7.4, u * 3.6, -0.5, alpha(pap, 0.8));
    for (i = 0; i < 14; i++) { var px = frac(i * 0.381 + 0.2) * W, py = fl + d * (0.12 + frac(i * 0.618) * 0.85); ell(c, px, py, u * 0.9, u * 0.45, alpha(fc[i % 4], 0.8), i); }
    for (i = 0; i < 2; i++) K.bfly(c, W * (0.3 + i * 0.4) + Math.sin(t * 0.5 + i * 2) * u * 7, H * (0.6 + i * 0.03) + Math.cos(t * 0.7 + i) * u * 3, u * 1.8, i ? p.gold : pap, t, i * 2);
  }, { variants: ['day'], stage: 'band-low' });

  /* ---------- the record shop ---------- */
  function sleeve(c, x, y, s, k, cols, p) { /* a record sleeve with a picture of shapes on it */
    var a = cols[k % cols.length], b = cols[(k + 2) % cols.length], d = cols[(k + 3) % cols.length], kind = k % 8, i;
    rect(c, x + s * 0.05, y + s * 0.05, s, s, 'rgba(0,0,0,0.2)'); rect(c, x, y, s, s, a); c.save(); c.beginPath(); c.rect(x, y, s, s); c.clip();
    if (kind === 0) { for (i = 3; i > 0; i--) dot(c, x + s / 2, y + s / 2, s * 0.14 * i, i % 2 ? b : d); }
    else if (kind === 1) { dot(c, x + s * 0.5, y + s * 0.62, s * 0.26, b); for (i = 0; i < 9; i++) L(c, x + s * 0.5 + Math.cos(PI + i / 8 * PI) * s * 0.32, y + s * 0.62 + Math.sin(PI + i / 8 * PI) * s * 0.32, x + s * 0.5 + Math.cos(PI + i / 8 * PI) * s * 0.46, y + s * 0.62 + Math.sin(PI + i / 8 * PI) * s * 0.46, s * 0.04, b); rect(c, x, y + s * 0.62, s, s * 0.4, d); }
    else if (kind === 2) { for (i = -2; i < 5; i++) poly(c, [x + i * s * 0.3, y + s, x + i * s * 0.3 + s * 0.14, y + s, x + i * s * 0.3 + s * 0.74, y, x + i * s * 0.3 + s * 0.6, y], i % 2 ? b : d); }
    else if (kind === 3) { dot(c, x + s * 0.7, y + s * 0.28, s * 0.13, p.paper); poly(c, [x, y + s, x + s * 0.38, y + s * 0.36, x + s * 0.7, y + s], b); poly(c, [x + s * 0.36, y + s, x + s * 0.7, y + s * 0.52, x + s, y + s], d); }
    else if (kind === 4) { rect(c, x, y, s * 0.5, s, b); dot(c, x + s * 0.5, y + s * 0.5, s * 0.24, d); }
    else if (kind === 5) { for (i = 0; i < 9; i++) dot(c, x + s * (0.22 + (i % 3) * 0.28), y + s * (0.22 + Math.floor(i / 3) * 0.28), s * 0.08, i % 2 ? b : d); }
    else if (kind === 6) { c.lineWidth = s * 0.06; c.lineCap = 'round'; for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x - s * 0.1, y + s * (0.26 + i * 0.17)); c.bezierCurveTo(x + s * 0.3, y + s * (0.06 + i * 0.17), x + s * 0.7, y + s * (0.46 + i * 0.17), x + s * 1.1, y + s * (0.26 + i * 0.17)); c.strokeStyle = i % 2 ? b : d; c.stroke(); } }
    else { K.starPath(c, x + s / 2, y + s / 2, s * 0.34, s * 0.15, 5, 0.2); c.fillStyle = b; c.fill(); }
    c.restore(); rect(c, x, y, s * 0.06, s, 'rgba(255,255,255,0.2)');
  }
  function crate(c, x, base, w, h, wood, cols, seed, u, p) { /* a bin of records, their tops showing */
    var R0 = rnd(seed), i, n = Math.max(4, Math.round(w / (u * 1.5))), sw = (w - u * 1.6) / n;
    for (i = 0; i < n; i++) { var hh = h * (0.34 + R0() * 0.2), tab = R0() < 0.22; rect(c, x + u * 0.8 + i * sw, base - h - hh, sw - u * 0.1, hh + u, cols[Math.floor(R0() * cols.length)]); rect(c, x + u * 0.8 + i * sw, base - h - hh, sw - u * 0.1, u * 0.3, 'rgba(255,255,255,0.3)'); if (tab) Rn(c, x + u * 0.8 + i * sw - u * 0.4, base - h - hh - u * 1.8, sw + u * 1.6, u * 2.2, u * 0.4, p.paper); }
    rect(c, x, base - h, w, h, wood); rect(c, x, base - h, w, u * 0.7, shade(wood, 0.22)); c.fillStyle = shade(wood, -0.18); c.fillRect(x, base - h * 0.52, w, u * 0.35); c.fillRect(x, base - u * 0.9, w, u * 0.9); c.fillRect(x, base - h, u * 0.7, h); c.fillRect(x + w - u * 0.7, base - h, u * 0.7, h);
    Rn(c, x + w * 0.36, base - h * 0.86, w * 0.28, h * 0.2, u * 0.6, shade(wood, -0.34));
  }
  Art.add('backdrop', 'vinylshop', function (c, W, H, t, p, o, u) {
    var e = env('day'), fl = H * 0.69, i, j, d = H - fl, k = Math.exp(-5 * o.beat), wall = p.bg, pap = p.paper, wood = mix('#a8703e', p.ink, 0.1), ink = mix('#1c1a24', p.ink, 0.3),
      cols = [p.accent, p.accent2, p.gold, mix(p.accent, p.ink, 0.5), pap, mix(p.accent2, p.ink, 0.45), mix(p.accent, p.gold, 0.5), mix(p.gold, pap, 0.5)];
    vgrad(c, W, H, [shade(wall, -0.12), wall], 0, fl);
    /* a great record on the wall, turning slowly */
    var rcx = W / 2, rcy = H * 0.3, rr = Math.min(W * 0.3, H * 0.2); dot(c, rcx, rcy, rr, alpha(p.ink, 0.1)); for (i = 1; i < 5; i++) { c.beginPath(); c.arc(rcx, rcy, rr * (0.36 + i * 0.14), 0, TAU); c.lineWidth = u * 0.3; c.strokeStyle = alpha(pap, 0.07); c.stroke(); }
    dot(c, rcx, rcy, rr * 0.3, alpha(p.accent, 0.2)); dot(c, rcx, rcy, rr * 0.05, alpha(pap, 0.3)); for (i = 0; i < 2; i++) { c.beginPath(); c.arc(rcx, rcy, rr * 0.8, t * 0.4 + i * PI, t * 0.4 + i * PI + 0.5); c.lineWidth = rr * 0.3; c.strokeStyle = alpha(pap, 0.05); c.stroke(); }
    /* sleeves on ledges up both walls */
    var ss = W * 0.108, sT = H * 0.1, sB = H * 0.5, n = Math.max(2, Math.round((sB - sT) / (ss + u * 4.4))), rh = (sB - sT) / n;
    for (j = 0; j < n; j++) for (i = 0; i < 4; i++) { var sx = i < 2 ? W * 0.025 + i * (ss + u * 1.6) : W - W * 0.025 - (4 - i) * ss - (3 - i) * u * 1.6, sy = sT + j * rh + (rh - ss - u * 1.2); if (i === 0 || i === 2) { rect(c, i ? W - W * 0.275 : 0, sy + ss, W * 0.275, u * 1.2, wood); rect(c, i ? W - W * 0.275 : 0, sy + ss + u * 1.2, W * 0.275, u * 0.5, 'rgba(0,0,0,0.2)'); } c.save(); c.translate(sx + ss / 2, sy + ss); c.rotate(((i + j) % 2 ? 1 : -1) * 0.025); sleeve(c, -ss / 2, -ss, ss, j * 4 + i + 1, cols, p); c.restore(); }
    /* boards below, bins of records along them */
    var wT = H * 0.535, bd = shade(wall, -0.24); rect(c, 0, wT, W, fl - wT, bd); c.fillStyle = shade(bd, -0.12); for (i = 0; i * u * 4.4 < W; i++) c.fillRect(i * u * 4.4, wT, u * 0.3, fl - wT); rect(c, 0, wT - u * 0.4, W, u * 1.4, shade(bd, 0.2));
    planks(c, W, H, fl, mix('#b07a48', p.bg2, 0.3), u);
    var cb = fl + u * 3.4, chh = H * 0.075; for (i = 0; i < 2; i++) { crate(c, i ? W * 0.72 : -u * 1, cb - chh - u * 1.4, W * 0.28 + u, chh, shade(wood, -0.12), cols, o.seed + 'u' + i, u, p); crate(c, i ? W * 0.7 : -u * 1, cb, W * 0.3 + u, chh, wood, cols, o.seed + 'd' + i, u, p); }
    /* the counter with the turntable */
    var cx = W * 0.34, cw = W * 0.32, cT = H * 0.578, cc = mix(p.accent2, p.ink, 0.3);
    rect(c, cx, cT, cw, fl + u * 1.6 - cT, cc); for (i = 0; i < 3; i++) Rn(c, cx + u * 1.6 + i * (cw - u * 1.6) / 3, cT + u * 3, (cw - u * 1.6) / 3 - u * 1.6, fl - cT - u * 3.6, u * 0.6, shade(cc, 0.1)); rect(c, cx - u * 1, cT - u * 0.6, cw + u * 2, u * 1.9, wood); rect(c, cx - u * 1, cT + u * 1.3, cw + u * 2, u * 0.5, 'rgba(0,0,0,0.2)');
    var tx = cx + cw * 0.36, tb = cT - u * 0.6, tw = u * 15; Rn(c, tx - tw / 2, tb - u * 3, tw, u * 3, u * 0.6, shade(wood, 0.2)); rect(c, tx - tw / 2, tb - u * 0.8, tw, u * 0.8, shade(wood, -0.2)); ell(c, tx - u * 1.6, tb - u * 3.3, u * 5.2, u * 1.5, ink); ell(c, tx - u * 1.6, tb - u * 3.4, u * 1.7, u * 0.5, p.accent); c.beginPath(); c.ellipse(tx - u * 1.6, tb - u * 3.3, u * 3.8, u * 1.1, 0, t * 2.4, t * 2.4 + 0.8); c.lineWidth = u * 0.4; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.stroke();
    L(c, tx + u * 5.6, tb - u * 4.6, tx + u * 1.6, tb - u * 3.5, u * 0.5, '#cfd4de'); dot(c, tx + u * 5.6, tb - u * 4.6, u * 0.9, '#cfd4de');
    for (i = 0; i < 3; i++) { var nf = frac(t * 0.3 + i / 3), nx = tx - u * 1 + Math.sin(nf * 5 + i * 2) * u * 2.4 + nf * u * 4, ny = tb - u * 6 - nf * u * 13; icon(c, 'note', nx, ny, u * (2.6 + (i % 2) * 0.8) * (1 + k * 0.15), alpha(i % 2 ? p.gold : pap, 0.85 * Math.sin(nf * PI)), '#000'); }
    var hx = cx + cw * 0.8; c.beginPath(); c.arc(hx, tb - u * 3.6, u * 2.8, PI, 0); c.lineWidth = u * 0.7; c.strokeStyle = ink; c.stroke(); Rn(c, hx - u * 3.7, tb - u * 4.4, u * 1.8, u * 4.4, u * 0.8, p.accent); Rn(c, hx + u * 1.9, tb - u * 4.4, u * 1.8, u * 4.4, u * 0.8, p.accent);
    /* a round rug like a record, a tall speaker, a stool, a plant */
    var ry = fl + d * 0.64; ell(c, W / 2, ry, W * 0.31, d * 0.26, ink); for (i = 1; i < 4; i++) { c.beginPath(); c.ellipse(W / 2, ry, W * (0.31 - i * 0.04), d * (0.26 - i * 0.034), 0, 0, TAU); c.lineWidth = u * 0.3; c.strokeStyle = 'rgba(255,255,255,0.1)'; c.stroke(); } ell(c, W / 2, ry, W * 0.115, d * 0.097, p.accent); ell(c, W / 2, ry, W * 0.07, d * 0.059, p.gold); ell(c, W / 2, ry, W * 0.014, d * 0.012, ink);
    var spx = W * 0.285, spb = fl + d * 0.4, spw = u * 15, sph = H * 0.15; ell(c, spx, spb, spw * 0.66, u * 1.3, 'rgba(0,0,0,0.22)'); Rn(c, spx - spw / 2, spb - sph, spw, sph, u * 1, shade(wood, -0.3)); Rn(c, spx - spw / 2 + u * 0.9, spb - sph + u * 0.9, spw - u * 1.8, sph - u * 1.8, u * 0.6, ink);
    var r1 = Math.min(spw * 0.34, sph * 0.24) * (1 + k * 0.09), r2 = Math.min(spw * 0.2, sph * 0.13); dot(c, spx, spb - sph * 0.36, r1, '#3a3844'); dot(c, spx, spb - sph * 0.36, r1 * 0.72, '#24222c'); dot(c, spx, spb - sph * 0.36, r1 * 0.3, p.accent2); dot(c, spx, spb - sph * 0.78, r2, '#3a3844'); dot(c, spx, spb - sph * 0.78, r2 * 0.45, p.gold);
    for (i = 0; i < 2; i++) { c.beginPath(); c.arc(spx, spb - sph * 0.36, r1 * (1.5 + i * 0.5 + (1 - k) * 0.5), -0.5, 0.5); c.lineWidth = u * 0.35; c.strokeStyle = alpha(pap, 0.3 * k); c.stroke(); }
    stool(c, W * 0.7, fl + d * 0.42, H * 0.085, u * 5.6, p.gold, ink);
    var fpx = W * 0.8, fpb = fl + d * 0.32; ell(c, fpx, fpb, u * 5.4, u * 1, 'rgba(0,0,0,0.2)'); plant(c, fpx, fpb, u * 20, pap, mix('#4a9a58', p.accent2, 0.4), t);
    wallFloorShade(c, W, fl, u);
    /* flags across the top, lamps */
    K.flagRow(c, -u * 2, H * 0.02, W + u * 2, H * 0.02, u * 3.4, Math.max(7, Math.round(W / (u * 9))), [p.accent, p.gold, p.accent2, pap], u * 5.4, t);
    pendant(c, W * 0.34, H * 0.07, u * 3.4, ink, e, u); pendant(c, W * 0.66, H * 0.07, u * 3.4, ink, e, u);
  }, { variants: ['one'], stage: 'cast-low' });

  /* ---------- the classroom ---------- */
  Art.add('backdrop', 'classroom', function (c, W, H, t, p, o, u) {
    var e = env('day'), fl = H * 0.69, i, j, d = H - fl, wall = p.bg, pap = p.paper, wood = mix('#c08a52', p.gold, 0.2), ink = mix('#2a2430', p.ink, 0.4), cols = [p.accent, p.gold, p.accent2, mix(p.accent, pap, 0.5), mix(p.accent2, pap, 0.5)];
    vgrad(c, W, H, [shade(wall, -0.06), wall, shade(wall, 0.08)], 0, fl);
    /* the board, chalk drawings round its edge */
    var bx = W * 0.2, bw = W * 0.6, bT = H * 0.125, bH = H * 0.37, bc = mix('#2f5d4a', p.accent2, 0.25);
    Rn(c, bx - u * 1.6, bT - u * 1.6, bw + u * 3.2, bH + u * 3.2, u * 0.8, wood); rect(c, bx, bT, bw, bH, bc); vgrad2(c, bx, bT, bw, bH, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.08)');
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (i = 0; i < 5; i++) c.fillRect(bx + bw * frac(i * 0.37 + 0.1), bT + bH * frac(i * 0.61 + 0.2), bw * 0.24, u * 2.4);
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.fillStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = u * 0.5; c.lineCap = 'round'; c.lineJoin = 'round';
    var sx = bx + u * 6.5, sy = bT + u * 6.5; c.beginPath(); c.arc(sx, sy, u * 2.4, 0, TAU); c.stroke(); for (i = 0; i < 8; i++) { var a = i / 8 * TAU + t * 0.2; c.beginPath(); c.moveTo(sx + Math.cos(a) * u * 3.4, sy + Math.sin(a) * u * 3.4); c.lineTo(sx + Math.cos(a) * u * 4.8, sy + Math.sin(a) * u * 4.8); c.stroke(); }
    K.starPath(c, bx + bw - u * 6, bT + u * 6, u * 3.2, u * 1.4, 5, 0); c.stroke();
    c.beginPath(); c.moveTo(bx + u * 3.4, bT + bH - u * 3.4); c.lineTo(bx + u * 7.4, bT + bH - u * 10); c.lineTo(bx + u * 11.4, bT + bH - u * 3.4); c.closePath(); c.stroke(); c.strokeRect(bx + u * 13.4, bT + bH - u * 8, u * 4.6, u * 4.6);
    var fx = bx + bw - u * 6, fy = bT + bH - u * 9; for (i = 0; i < 5; i++) { c.beginPath(); c.arc(fx + Math.cos(i / 5 * TAU) * u * 1.9, fy + Math.sin(i / 5 * TAU) * u * 1.9, u * 1.3, 0, TAU); c.stroke(); } c.beginPath(); c.moveTo(fx, fy + u * 3); c.quadraticCurveTo(fx - u, fy + u * 5, fx, fy + u * 6.4); c.stroke();
    c.strokeStyle = alpha(p.gold, 0.8); c.beginPath(); for (i = 0; i <= 10; i++) { var qx = bx + bw - u * 20 + i * u * 1, qy = bT + bH - u * 4 + (i % 2 ? -1 : 1) * u * 0.9; if (i) c.lineTo(qx, qy); else c.moveTo(qx, qy); } c.stroke();
    rect(c, bx - u * 1.6, bT + bH + u * 1.6, bw + u * 3.2, u * 1.4, shade(wood, 0.16)); rect(c, bx - u * 1.6, bT + bH + u * 3, bw + u * 3.2, u * 0.5, 'rgba(0,0,0,0.18)');
    Rn(c, bx + bw * 0.12, bT + bH + u * 0.4, u * 5, u * 1.4, u * 0.3, ink); rect(c, bx + bw * 0.12, bT + bH + u * 0.4, u * 5, u * 0.5, cols[0]); for (i = 0; i < 4; i++) Rn(c, bx + bw * (0.5 + i * 0.07), bT + bH + u * 0.9, u * 2.6, u * 0.8, u * 0.4, [pap, cols[1], cols[3], cols[4]][i]);
    /* shape cards strung across the top */
    var nc = Math.max(6, Math.round(W / (u * 12))); L(c, 0, H * 0.03, W, H * 0.03, u * 0.25, alpha(ink, 0.6));
    for (i = 0; i < nc; i++) { var kx = (i + 0.5) / nc * W, ks = Math.min(u * 7.4, W / nc * 0.76, H * 0.062), col = cols[i % 5], sh = shade(col, -0.32); c.save(); c.translate(kx, H * 0.03); c.rotate(Math.sin(t * 1.1 + i) * 0.04); Rn(c, -ks / 2, 0, ks, ks, u * 0.5, pap); Rn(c, -ks / 2 + u * 0.5, u * 0.5, ks - u, ks - u, u * 0.4, col); rect(c, -u * 0.5, -u * 0.7, u * 1, u * 1.5, wood);
      if (i % 4 === 0) dot(c, 0, ks / 2, ks * 0.24, sh); else if (i % 4 === 1) poly(c, [-ks * 0.26, ks * 0.72, 0, ks * 0.26, ks * 0.26, ks * 0.72], sh); else if (i % 4 === 2) rect(c, -ks * 0.22, ks * 0.28, ks * 0.44, ks * 0.44, sh); else { K.starPath(c, 0, ks / 2, ks * 0.28, ks * 0.12, 5, 0); c.fillStyle = sh; c.fill(); } c.restore(); }
    /* a window on the left, a clock and paintings on the right */
    var wx = W * 0.025, ww = W * 0.135, wy = H * 0.15, wh = H * 0.3; view(c, wx, wy, ww, wh, p, e, o, t, u, o.seed + 'v'); sheen(c, wx, wy, ww, wh); sash(c, wx, wy, ww, wh, pap, u, 2, 3); plant(c, wx + ww * 0.5, wy + wh + u * 1.1, u * 5.4, cols[0], mix('#5aa860', p.accent2, 0.4), t);
    var kcx = W * 0.905, kcy = H * 0.155 + u * 5.4, kr = Math.min(u * 5.6, W * 0.07); dot(c, kcx, kcy, kr + u * 0.9, ink); dot(c, kcx, kcy, kr, pap); for (i = 0; i < 12; i++) dot(c, kcx + Math.cos(i / 12 * TAU) * kr * 0.82, kcy + Math.sin(i / 12 * TAU) * kr * 0.82, u * (i % 3 ? 0.22 : 0.4), ink); L(c, kcx, kcy, kcx + kr * 0.42, kcy - kr * 0.26, u * 0.6, ink); L(c, kcx, kcy, kcx + Math.cos(t * 0.1 - 1.5) * kr * 0.68, kcy + Math.sin(t * 0.1 - 1.5) * kr * 0.68, u * 0.4, ink); L(c, kcx, kcy, kcx + Math.cos(Math.floor(t) / 60 * TAU - PI / 2) * kr * 0.74, kcy + Math.sin(Math.floor(t) / 60 * TAU - PI / 2) * kr * 0.74, u * 0.2, p.accent); dot(c, kcx, kcy, u * 0.5, ink);
    for (i = 0; i < 2; i++) { var px = W * (0.842 + (i % 2) * 0.006), py = H * (0.27 + i * 0.105), pw = W * 0.125, ph = H * 0.085; c.save(); c.translate(px + pw / 2, py); c.rotate(i ? 0.04 : -0.04); Rn(c, -pw / 2, 0, pw, ph, u * 0.4, pap); if (i) { rect(c, -pw / 2 + u, ph * 0.66, pw - u * 2, ph * 0.24, alpha(cols[2], 0.7)); poly(c, [-pw * 0.3, ph * 0.66, -pw * 0.3, ph * 0.38, -pw * 0.12, ph * 0.2, pw * 0.06, ph * 0.38, pw * 0.06, ph * 0.66], cols[0]); dot(c, pw * 0.28, ph * 0.26, ph * 0.11, cols[1]); } else { dot(c, 0, ph * 0.42, ph * 0.2, cols[1]); for (j = 0; j < 6; j++) dot(c, Math.cos(j / 6 * TAU) * ph * 0.3, ph * 0.42 + Math.sin(j / 6 * TAU) * ph * 0.3, ph * 0.12, cols[0]); L(c, 0, ph * 0.66, 0, ph * 0.9, u * 0.5, cols[2]); } dot(c, 0, u * 0.9, u * 0.6, p.accent); c.restore(); }
    /* panels under the rail */
    var wT = H * 0.555, bd = shade(wall, -0.2); rect(c, 0, wT, W, fl - wT, bd); rect(c, 0, wT - u * 0.4, W, u * 1.3, shade(bd, 0.22)); c.fillStyle = shade(bd, -0.1); for (i = 0; i * u * 5 < W; i++) c.fillRect(i * u * 5, wT + u * 0.9, u * 0.3, fl - wT); rect(c, 0, fl - u * 1.6, W, u * 1.6, shade(bd, -0.2));
    /* the floor */
    checker(c, W, H, fl, mix(mix('#e6d6b8', p.bg2, 0.4), pap, 0.2), mix(mix('#d2bd98', p.bg2, 0.4), p.ink, 0.06), u, 8);
    /* a shelf of books and a globe on the left */
    var shw = W * 0.225, shT = H * 0.585, shb = fl + u * 3; shelfCase(c, -u, shT, shw + u, shb - shT, shade(wood, -0.1), o.seed + 'S', cols.concat([mix(p.accent, p.ink, 0.4)]), u, u * 9);
    var gx = shw * 0.36, gb = shT - u * 1.7, gr = u * 4.2, sea = mix('#4a9ad0', p.accent2, 0.35); rect(c, gx - u * 2.4, gb - u * 0.9, u * 4.8, u * 0.9, ink); rect(c, gx - u * 0.4, gb - u * 2.6, u * 0.8, u * 2, ink); dot(c, gx, gb - u * 2.2 - gr, gr, sea); c.save(); c.beginPath(); c.arc(gx, gb - u * 2.2 - gr, gr, 0, TAU); c.clip(); for (i = 0; i < 4; i++) ell(c, gx - gr * 2 + frac(i * 0.28 + t * 0.02) * gr * 4, gb - u * 2.2 - gr + (i % 2 ? 1 : -1) * gr * 0.3, gr * (0.5 - (i % 2) * 0.14), gr * 0.36, mix('#6cba5a', p.gold, 0.3), i); c.restore(); c.beginPath(); c.arc(gx, gb - u * 2.2 - gr, gr + u * 0.7, -PI * 0.42, PI * 0.58); c.lineWidth = u * 0.5; c.strokeStyle = p.gold; c.stroke();
    for (i = 0; i < 3; i++) { var pc = cols[i]; rect(c, shw * 0.68 + i * u * 1.5, gb - u * 5.6, u * 1.1, u * 5.6, pc); poly(c, [shw * 0.68 + i * u * 1.5, gb - u * 5.6, shw * 0.68 + i * u * 1.5 + u * 0.55, gb - u * 7, shw * 0.68 + i * u * 1.5 + u * 1.1, gb - u * 5.6], pap); } Rn(c, shw * 0.64, gb - u * 3.6, u * 5.4, u * 3.6, u * 0.6, cols[4]);
    /* the teacher's desk: an apple, books, a lamp */
    var dx = W * 0.735, dw = W * 0.28, dT = H * 0.6, db = fl + u * 4; rect(c, dx, dT, dw, db - dT, shade(wood, -0.12)); Rn(c, dx + u * 2, dT + u * 3.2, dw * 0.4, db - dT - u * 5.4, u * 0.5, shade(wood, -0.02)); Rn(c, dx + u * 3.4 + dw * 0.4, dT + u * 3.2, dw * 0.4, db - dT - u * 5.4, u * 0.5, shade(wood, -0.02)); dot(c, dx + u * 2 + dw * 0.2, dT + u * 5, u * 0.6, p.gold); rect(c, dx - u * 1.2, dT - u * 0.6, dw + u * 1.2, u * 2, shade(wood, 0.18)); rect(c, dx - u * 1.2, dT + u * 1.4, dw + u * 1.2, u * 0.5, 'rgba(0,0,0,0.18)');
    var apx = dx + u * 4.4, apb = dT - u * 0.6, red = mix('#e2413a', p.accent, 0.4); dot(c, apx - u * 0.9, apb - u * 2, u * 2, red); dot(c, apx + u * 0.9, apb - u * 2, u * 2, red); dot(c, apx - u * 1.3, apb - u * 2.7, u * 0.6, 'rgba(255,255,255,0.4)'); L(c, apx, apb - u * 3.4, apx + u * 0.4, apb - u * 4.8, u * 0.4, '#5a3a22'); K.leaf(c, apx + u * 0.3, apb - u * 4.3, u * 2, -0.3, mix('#5aa860', p.accent2, 0.4));
    for (i = 0; i < 3; i++) rect(c, dx + u * 9 + (i % 2) * u * 0.5, apb - (i + 1) * u * 1.4, u * 7, u * 1.3, cols[(i + 1) % 5]);
    var mgx = dx + dw * 0.78; mug(c, mgx, apb, u * 3.2, cols[2], t, false); for (i = 0; i < 3; i++) { L(c, mgx + (i - 1) * u * 0.8, apb - u * 2.4, mgx + (i - 1) * u * 1.6, apb - u * 6.4, u * 0.6, cols[i]); dot(c, mgx + (i - 1) * u * 1.6, apb - u * 6.4, u * 0.4, ink); }
    /* two small desks waiting */
    for (i = 0; i < 2; i++) { var qx2 = W * (0.385 + i * 0.23), qb = fl + d * 0.62, qw = W * 0.17, qh = d * 0.3, mc = mix('#8f96a8', p.ink, 0.1); ell(c, qx2, qb, qw * 0.62, u * 1.3, 'rgba(0,0,0,0.16)'); L(c, qx2 - qw * 0.42, qb, qx2 - qw * 0.4, qb - qh, u * 0.8, mc); L(c, qx2 + qw * 0.42, qb, qx2 + qw * 0.4, qb - qh, u * 0.8, mc); L(c, qx2 - qw * 0.41, qb - qh * 0.3, qx2 + qw * 0.41, qb - qh * 0.3, u * 0.5, mc);
      Rn(c, qx2 - qw * 0.3, qb - qh * 1.5, qw * 0.6, qh * 0.46, u * 1.2, cols[i ? 2 : 0]); L(c, qx2 - qw * 0.22, qb - qh * 1.04, qx2 - qw * 0.22, qb - qh * 0.6, u * 0.7, mc); L(c, qx2 + qw * 0.22, qb - qh * 1.04, qx2 + qw * 0.22, qb - qh * 0.6, u * 0.7, mc);
      Rn(c, qx2 - qw / 2, qb - qh - u * 1.8, qw, u * 2.6, u * 0.8, shade(wood, -0.16)); Rn(c, qx2 - qw / 2, qb - qh - u * 2.4, qw, u * 2, u * 0.8, shade(wood, 0.12)); rect(c, qx2 - qw * 0.3, qb - qh - u * 3, qw * 0.3, u * 0.7, pap); L(c, qx2 + qw * 0.1, qb - qh - u * 2.7, qx2 + qw * 0.32, qb - qh - u * 2.9, u * 0.5, cols[1]); }
    wallFloorShade(c, W, fl, u);
    /* a paper plane on its way across */
    var pf = frac(t * 0.045 + 0.3), ppx = -u * 6 + pf * (W + u * 12), ppy = H * 0.092 + Math.sin(pf * TAU * 1.5) * u * 2.4; c.save(); c.translate(ppx, ppy); c.rotate(Math.cos(pf * TAU * 1.5) * 0.22); poly(c, [u * 4, 0, -u * 3, -u * 2, -u * 1.6, 0], pap); poly(c, [u * 4, 0, -u * 3, u * 1.5, -u * 1.6, 0], shade(pap, -0.14)); poly(c, [u * 4, 0, -u * 1.6, 0, -u * 2, u * 2.2], shade(pap, -0.26)); c.restore();
  }, { variants: ['day'], stage: 'cast-low' });
});
