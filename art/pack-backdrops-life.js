/* Send a Carol art pack: backdrops for life's occasions (a harvest table, fireworks over the harbour, a clock square,
   a dance floor, studios, a school lab, a bus stop, a graduation lawn, a driveway). Blocks only come in through
   CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, E = K.E, dot = K.dot, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd,
    vgrad = K.vgrad, vgrad2 = K.vgrad2, glow = K.glow, vignette = K.vignette;

  /* ---------- small shared pieces ---------- */
  function quad(c, x1, y1, x2, y2, x3, y3, x4, y4, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.lineTo(x4, y4); c.closePath(); c.fillStyle = col; c.fill(); }
  function el(c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = col; c.fill(); }
  function ring(c, x, y, r, lw, col) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); }
  /* floor lines running to a vanishing point above the floor line */
  function fan(c, W, H, fl, n, spread, lw, col) { var i; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (i = -n; i <= n; i++) { c.moveTo(W / 2 + i * W / (n * 2) * 1.02, fl); c.lineTo(W / 2 + i * W / (n * 2) * spread, H); } c.stroke(); }
  /* a round leafy tree; base centre at (x, y) */
  function tree(c, x, y, h, col, trunk, t, ph) {
    var sw = Math.sin(t * 0.7 + ph) * h * 0.012, r = h * 0.3;
    quad(c, x - h * 0.035, y, x + h * 0.035, y, x + h * 0.022 + sw, y - h * 0.55, x - h * 0.022 + sw, y - h * 0.55, trunk);
    L(c, x, y - h * 0.38, x + h * 0.12 + sw, y - h * 0.56, h * 0.022, trunk); L(c, x, y - h * 0.32, x - h * 0.11 + sw, y - h * 0.5, h * 0.02, trunk);
    el(c, x - r * 0.62 + sw, y - h * 0.58, r * 0.72, r * 0.66, shade(col, -0.14)); el(c, x + r * 0.66 + sw, y - h * 0.6, r * 0.7, r * 0.64, shade(col, -0.08));
    el(c, x + sw, y - h * 0.74, r, r * 0.92, col); el(c, x - r * 0.3 + sw, y - h * 0.82, r * 0.5, r * 0.4, shade(col, 0.16)); el(c, x + r * 0.4 + sw, y - h * 0.7, r * 0.3, r * 0.22, shade(col, 0.1));
  }
  function lampPost(c, x, base, h, u, col, lit, a) { /* a street lamp with a round lantern */
    Rn(c, x - u * 0.45, base - h, u * 0.9, h, 0, col); Rn(c, x - u * 1.3, base - u * 1.6, u * 2.6, u * 1.6, u * 0.4, col); Rn(c, x - u * 0.9, base - h * 0.55, u * 1.8, u * 0.6, u * 0.3, col);
    L(c, x - u * 2.2, base - h, x + u * 2.2, base - h, u * 0.7, col);
    if (a > 0) glow(c, x, base - h - u * 2, u * 15, lit, 0.4 * a);
    Pg(c, [[x - u * 1.7, base - h - u * 0.2], [x + u * 1.7, base - h - u * 0.2], [x + u * 2.1, base - h - u * 3.6], [x - u * 2.1, base - h - u * 3.6]], a > 0 ? mix(lit, '#ffffff', 0.25) : shade(lit, -0.25), true);
    Pg(c, [[x - u * 2.5, base - h - u * 3.5], [x + u * 2.5, base - h - u * 3.5], [x, base - h - u * 5.4]], col, true); dot(c, x, base - h - u * 5.6, u * 0.5, col);
  }
  function candleLit(c, x, y, w, h, col, t, ph, u) { glow(c, x, y - h - w, w * 6, '#ffcf7a', 0.32 + 0.05 * Math.sin(t * 7 + ph)); Rn(c, x - w / 2, y - h, w, h, w * 0.2, col); Rn(c, x - w / 2, y - h, w * 0.3, h, w * 0.15, shade(col, 0.3)); K.flame(c, x, y - h - w * 0.1, w * 0.9, w * 2.1, t, ph); }

  /* ---------- harvesttable: a generous table and a woven mat, warm evening; nothing of one occasion drawn in ---------- */
  Art.add('backdrop', 'harvesttable', function (c, W, H, t, p, o, u) {
    var i, j, s, R0 = rnd(o.seed + 'ht'), tb = H * 0.655, rail = H * 0.5, wall = mix(p.bg, '#8a3d1c', 0.22), wood = mix('#a4633a', p.bg2, 0.18), cols = [p.accent, p.gold, p.accent2, p.paper, shade(p.ink, 0.1)];
    vgrad(c, W, H, [shade(wall, -0.34), shade(wall, -0.08), shade(wall, 0.1)], 0, tb);
    c.fillStyle = alpha(p.gold, 0.1); for (j = 0; j * u * 9 < rail; j++) for (i = -1; i * u * 9 < W + u * 9; i++) { var dx = i * u * 9 + (j % 2) * u * 4.5, dy = j * u * 9 + u * 3; c.beginPath(); c.moveTo(dx, dy - u * 1.3); c.lineTo(dx + u * 0.9, dy); c.lineTo(dx, dy + u * 1.3); c.lineTo(dx - u * 0.9, dy); c.closePath(); c.fill(); }
    /* panelled wainscot under a rail */
    var pan = mix(wood, wall, 0.45), pw = W / Math.max(4, Math.round(W / (u * 22)));
    c.fillStyle = shade(pan, -0.22); c.fillRect(0, rail, W, tb - rail);
    for (i = 0; i * pw < W; i++) { Rn(c, i * pw + u * 1.2, rail + u * 3, pw - u * 2.4, tb - rail - u * 3.6, u * 0.8, shade(pan, -0.1)); Rn(c, i * pw + u * 2.4, rail + u * 4.2, pw - u * 4.8, tb - rail - u * 6, u * 0.6, shade(pan, -0.17)); }
    Rn(c, 0, rail - u * 0.4, W, u * 2.2, 0, shade(pan, 0.12)); Rn(c, 0, rail + u * 1.8, W, u * 0.7, 0, 'rgba(30,10,0,0.25)');
    /* two tall windows at the sides: the last of the light */
    var ww = Math.min(W * 0.2, u * 21), wh = Math.min(H * 0.27, u * 40), wy = H * 0.14;
    for (s = 0; s < 2; s++) {
      var wx = s ? W - u * 5 - ww : u * 5, d = s ? -1 : 1, fr = shade(pan, 0.3);
      Rn(c, wx - u * 1.3, wy - u * 1.3, ww + u * 2.6, wh + u * 2.6, u * 1, fr);
      var g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, mix(p.bg, '#2a2450', 0.6)); g.addColorStop(0.55, mix(p.accent, '#ff9a5a', 0.6)); g.addColorStop(1, '#ffd58a'); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
      c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
      dot(c, wx + ww * (s ? 0.3 : 0.7), wy + wh * 0.86, u * 3.6, '#fff0c0'); el(c, wx + ww * 0.3, wy + wh * 1.02, ww * 0.7, wh * 0.16, mix('#3a2a3a', p.bg, 0.3)); el(c, wx + ww * 0.9, wy + wh * 1.03, ww * 0.6, wh * 0.2, mix('#2a1e30', p.bg, 0.3));
      tree(c, wx + ww * (s ? 0.75 : 0.25), wy + wh * 0.98, wh * 0.5, mix('#c8642a', p.accent, 0.3), '#3a2420', t, s);
      for (i = 0; i < 3; i++) { var bf = frac(t * 0.03 + i * 0.3 + s * 0.5), bx = wx + bf * ww, by = wy + wh * (0.2 + i * 0.1) + Math.sin(bf * 9) * u; c.beginPath(); c.moveTo(bx - u * 0.9, by - u * 0.4); c.quadraticCurveTo(bx - u * 0.4, by - u * 0.1, bx, by + u * 0.2); c.quadraticCurveTo(bx + u * 0.4, by - u * 0.1, bx + u * 0.9, by - u * 0.4); c.lineWidth = u * 0.25; c.strokeStyle = 'rgba(40,20,40,0.7)'; c.stroke(); }
      c.restore();
      Rn(c, wx + ww / 2 - u * 0.4, wy, u * 0.8, wh, 0, fr); Rn(c, wx, wy + wh * 0.4 - u * 0.4, ww, u * 0.8, 0, fr); Rn(c, wx - u * 2.4, wy + wh + u * 0.8, ww + u * 4.8, u * 1.5, u * 0.5, shade(fr, 0.15));
      /* a drawn-back curtain on the outer side */
      c.beginPath(); c.moveTo(wx + (s ? ww + u * 2 : -u * 2), wy - u * 3); c.lineTo(wx + (s ? ww - u * 6 : u * 6), wy - u * 3); c.quadraticCurveTo(wx + (s ? ww - u * 4 : u * 4), wy + wh * 0.45, wx + (s ? ww + u * 0.5 : -u * 0.5), wy + wh * 0.66); c.lineTo(wx + (s ? ww - u * 1 : u * 1), wy + wh + u * 4); c.lineTo(wx + (s ? ww + u * 3 : -u * 3), wy + wh + u * 4); c.closePath(); c.fillStyle = shade(p.accent, -0.12); c.fill();
      Rn(c, wx + (s ? ww - u * 1.6 : -u * 2.4), wy + wh * 0.63, u * 4, u * 1.3, u * 0.6, p.gold); Rn(c, wx - u * 3, wy - u * 4.2, ww + u * 6, u * 1.4, u * 0.7, shade(p.gold, -0.15));
      glow(c, wx + ww / 2, wy + wh * 0.7, ww * 1.5, '#ffb86a', 0.2);
      /* a hanging lamp inside each window bay */
      var lx = W / 2 + d * -W * 0.2, ly = H * 0.055 + Math.sin(t * 0.8 + s * 2) * u * 0.2;
      L(c, lx, 0, lx, ly, u * 0.35, shade(wall, -0.5)); glow(c, lx, ly + u * 3, u * 22, '#ffd28a', 0.3 + 0.04 * Math.sin(t * 3 + s));
      Pg(c, [[lx - u * 1.4, ly], [lx + u * 1.4, ly], [lx + u * 4.4, ly + u * 3.6], [lx - u * 4.4, ly + u * 3.6]], mix(p.gold, '#b9682a', 0.45), true); el(c, lx, ly + u * 3.6, u * 4.4, u * 0.9, '#ffe9b0'); dot(c, lx, ly + u * 4.2, u * 1.1, '#fff6d8');
    }
    /* chair backs wait behind the far edge, so it reads as a table and not a floor */
    for (i = 0; i < 4; i++) { var chx = W * [0.13, 0.32, 0.68, 0.87][i], chw = u * 7.5, chh = u * 15, chc = shade(wood, -0.32);
      Rn(c, chx - chw, tb - chh, u * 1.5, chh + u, u * 0.7, chc); Rn(c, chx + chw - u * 1.5, tb - chh, u * 1.5, chh + u, u * 0.7, chc);
      c.beginPath(); c.moveTo(chx - chw, tb - chh + u * 3.4); c.quadraticCurveTo(chx, tb - chh - u * 3.2, chx + chw, tb - chh + u * 3.4); c.lineTo(chx + chw, tb - chh + u * 0.2); c.quadraticCurveTo(chx, tb - chh - u * 6, chx - chw, tb - chh + u * 0.2); c.closePath(); c.fillStyle = shade(wood, -0.2); c.fill();
      for (j = -1; j <= 1; j++) Rn(c, chx + j * chw * 0.48 - u * 0.6, tb - chh - u * 0.6, u * 1.2, chh, u * 0.5, chc); Rn(c, chx - chw, tb - u * 5.5, chw * 2, u * 1.4, u * 0.5, chc); }
    /* the table: wide boards running away from us */
    var g2 = c.createLinearGradient(0, tb, 0, H); g2.addColorStop(0, shade(wood, 0.16)); g2.addColorStop(0.25, wood); g2.addColorStop(1, shade(wood, -0.3)); c.fillStyle = g2; c.fillRect(0, tb, W, H - tb);
    fan(c, W, H, tb, 5, 2.3, Math.max(0.8, u * 0.3), 'rgba(50,20,5,0.3)');
    c.fillStyle = 'rgba(50,20,5,0.13)'; for (i = 0; i < 26; i++) { var gx = R0() * W, gy = tb + u * 2 + R0() * (H - tb - u * 3); c.beginPath(); c.ellipse(gx, gy, u * (2 + R0() * 5), u * 0.22, 0, 0, TAU); c.fill(); }
    Rn(c, 0, tb, W, u * 0.9, 0, shade(wood, 0.34)); Rn(c, 0, tb - u * 1.2, W, u * 1.2, 0, 'rgba(30,10,0,0.22)');
    /* the woven mat down the middle */
    var my1 = tb + (H - tb) * 0.2, my2 = H - (H - tb) * 0.07, mw1 = W * 0.26, mw2 = W * 0.34, rows = 22, cx = W / 2;
    c.strokeStyle = shade(p.paper, -0.12); c.lineWidth = u * 0.3; c.beginPath(); for (i = 0; i <= 26; i++) { var ff = i / 26, fy1 = my1 + (my2 - my1) * ff, fw = mw1 + (mw2 - mw1) * ff; if (i === 0 || i === 26) continue; c.moveTo(cx - fw, fy1); c.lineTo(cx - fw - u * 1.8, fy1 + u * 0.3); c.moveTo(cx + fw, fy1); c.lineTo(cx + fw + u * 1.8, fy1 + u * 0.3); } c.stroke();
    quad(c, cx - mw1 + u * 0.6, my1 + u * 0.9, cx + mw1 + u * 0.6, my1 + u * 0.9, cx + mw2 + u * 0.6, my2 + u * 0.9, cx - mw2 + u * 0.6, my2 + u * 0.9, 'rgba(30,10,0,0.25)');
    for (i = 0; i < rows; i++) { var a0 = i / rows, a1 = (i + 1) / rows, ya = my1 + (my2 - my1) * a0, yb = my1 + (my2 - my1) * a1 + 0.6, wa = mw1 + (mw2 - mw1) * a0, wb = mw1 + (mw2 - mw1) * a1, band = [3, 0, 3, 1, 3, 2, 3, 4, 3, 0, 1][i % 11]; quad(c, cx - wa, ya, cx + wa, ya, cx + wb, yb, cx - wb, yb, band === 3 ? shade(p.paper, -0.06) : cols[band]); }
    c.strokeStyle = 'rgba(40,20,10,0.16)'; c.lineWidth = Math.max(0.6, u * 0.16); c.beginPath(); for (i = -14; i <= 14; i++) { c.moveTo(cx + i / 14 * mw1, my1); c.lineTo(cx + i / 14 * mw2, my2); } c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.14)'; for (i = 0; i < rows; i += 2) { var a2 = (i + 0.5) / rows, yc = my1 + (my2 - my1) * a2, wc = mw1 + (mw2 - mw1) * a2; for (j = -6; j <= 6; j++) c.fillRect(cx + j / 7 * wc, yc - u * 0.2, wc / 14, u * 0.4); }
    /* the far edge of the table: bread, a pitcher, bowls, candles (the middle stays clear) */
    var ey = tb + u * 4.6;
    for (s = 0; s < 2; s++) {
      var dd = s ? -1 : 1, ox = s ? W : 0;
      c.save(); c.translate(ox, ey); c.scale(1.42, 1.42); c.translate(-ox, -ey);
      el(c, ox + dd * u * 21, ey + u * 1.2, u * 16, u * 2.2, 'rgba(30,10,0,0.22)');
      candleLit(c, ox + dd * u * 31, ey + u * 0.6, u * 1.7, u * (9 + s * 2.5), p.paper, t, s * 2, u); el(c, ox + dd * u * 31, ey + u * 0.6, u * 2.6, u * 0.8, p.gold);
      candleLit(c, ox + dd * u * 35.5, ey + u * 1.4, u * 1.7, u * (6.5 - s * 1.2), p.paper, t, 1 + s * 2, u); el(c, ox + dd * u * 35.5, ey + u * 1.4, u * 2.6, u * 0.8, p.gold);
      if (!s) { /* a round loaf on a board, a slice cut */
        Rn(c, u * 3, ey - u * 0.2, u * 23, u * 1.8, u * 0.8, shade(wood, -0.25)); el(c, u * 13, ey - u * 3.4, u * 8, u * 4.6, '#b9722e'); el(c, u * 12.4, ey - u * 4.2, u * 6.8, u * 3.4, '#d79846');
        for (i = -1; i <= 1; i++) L(c, u * (11.4 + i * 3.2), ey - u * 6.6, u * (13.6 + i * 3.2), ey - u * 3.6, u * 0.6, '#f3d9a0');
        el(c, u * 23, ey - u * 2, u * 1.6, u * 3, '#f0d9a8', 0.25); c.beginPath(); c.ellipse(u * 23, ey - u * 2, u * 1.6, u * 3, 0.25, 0, TAU); c.lineWidth = u * 0.45; c.strokeStyle = '#b9722e'; c.stroke();
      } else { /* a pitcher and a bowl heaped with fruit */
        var px = W - u * 23, bx2 = W - u * 10.5;
        c.beginPath(); c.arc(px - u * 3.6, ey - u * 6.4, u * 2.6, PI * 0.5, PI * 1.5); c.lineWidth = u * 1; c.strokeStyle = shade(p.accent2, -0.2); c.stroke();
        c.beginPath(); c.moveTo(px - u * 3, ey); c.quadraticCurveTo(px - u * 4.6, ey - u * 5.5, px - u * 2.4, ey - u * 10.5); c.lineTo(px + u * 3.2, ey - u * 11.3); c.quadraticCurveTo(px + u * 4.2, ey - u * 5.5, px + u * 3, ey); c.closePath(); c.fillStyle = p.accent2; c.fill();
        Rn(c, px - u * 3.2, ey - u * 6.4, u * 6.6, u * 1.1, 0, alpha(p.paper, 0.75)); Rn(c, px - u * 3, ey - u * 4.6, u * 6.2, u * 0.5, 0, alpha(p.paper, 0.75)); el(c, px - u * 1.5, ey - u * 7.6, u * 0.7, u * 2.2, 'rgba(255,255,255,0.3)');
        var fr2 = [['#c9302c', -4.2, -5.2, 2.7], ['#e8a33a', 0.2, -6.4, 2.9], ['#8aa83a', 4.2, -5, 2.6], ['#d8642a', -1.8, -8.4, 2.4], ['#7a3a6a', 2.6, -8.6, 2.1]];
        for (i = 0; i < 5; i++) { dot(c, bx2 + fr2[i][1] * u, ey + fr2[i][2] * u, fr2[i][3] * u, fr2[i][0]); dot(c, bx2 + (fr2[i][1] - 0.8) * u, ey + (fr2[i][2] - 0.9) * u, fr2[i][3] * u * 0.3, 'rgba(255,255,255,0.4)'); }
        K.leaf(c, bx2 + u * 0.4, ey - u * 9.2, u * 2.6, -0.9, '#5a8a3a');
        c.beginPath(); c.moveTo(bx2 - u * 8, ey - u * 4.6); c.quadraticCurveTo(bx2 - u * 6.5, ey + u * 0.4, bx2 - u * 2.6, ey + u * 0.4); c.lineTo(bx2 + u * 2.6, ey + u * 0.4); c.quadraticCurveTo(bx2 + u * 6.5, ey + u * 0.4, bx2 + u * 8, ey - u * 4.6); c.closePath(); c.fillStyle = mix('#c98a4a', p.gold, 0.3); c.fill();
        c.strokeStyle = 'rgba(70,30,10,0.35)'; c.lineWidth = u * 0.35; for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(bx2 - u * (7.2 - i * 0.9), ey - u * (3.2 - i * 1.3)); c.lineTo(bx2 + u * (7.2 - i * 0.9), ey - u * (3.2 - i * 1.3)); c.stroke(); }
      }
      c.restore();
    }
    /* the near corners: a plate with a napkin, a squash and its little brother */
    var ny = H - (H - tb) * 0.13;
    c.save(); c.translate(0, H); c.scale(1.3, 1.3); c.translate(0, -H);
    el(c, u * 12, ny + u * 1, u * 12.5, u * 4.4, 'rgba(30,10,0,0.22)'); el(c, u * 12, ny, u * 12, u * 4.2, p.paper); el(c, u * 12, ny - u * 0.2, u * 8.4, u * 2.8, shade(p.paper, -0.09)); c.beginPath(); c.ellipse(u * 12, ny, u * 10.6, u * 3.6, 0, 0, TAU); c.lineWidth = u * 0.4; c.strokeStyle = alpha(p.accent, 0.7); c.stroke();
    Pg(c, [[u * 7, ny - u * 1.6], [u * 16.5, ny - u * 2.6], [u * 18, ny + u * 0.4], [u * 8.5, ny + u * 1.4]], p.accent2, true); L(c, u * 8.2, ny - u * 0.4, u * 17, ny - u * 1.4, u * 0.5, alpha(p.paper, 0.7));
    c.restore(); c.save(); c.translate(W, H); c.scale(1.3, 1.3); c.translate(-W, -H);
    var qx = W - u * 12;
    el(c, qx, ny + u * 1.4, u * 12, u * 2.6, 'rgba(30,10,0,0.25)');
    for (i = -2; i <= 2; i++) el(c, qx + i * u * 2.8, ny - u * 3.6, u * (4.2 - Math.abs(i) * 0.5), u * (5.4 - Math.abs(i) * 0.5), i % 2 ? '#e08a2e' : '#cf7424'); Rn(c, qx - u * 0.7, ny - u * 11, u * 1.4, u * 3, u * 0.5, '#6a7a3a');
    for (i = -1; i <= 1; i++) el(c, qx - u * 11 + i * u * 1.6, ny - u * 1.4, u * 2.3, u * 2.9, i ? '#d8b24a' : '#e6c462'); Rn(c, qx - u * 11.4, ny - u * 5.4, u * 0.9, u * 1.6, u * 0.3, '#6a7a3a');
    c.restore();
    glow(c, W / 2, tb + u * 6, Math.max(W, H) * 0.5, '#ffb866', 0.16); vignette(c, W, H, '#2a0e04', 0.34);
  }, { variants: ['evening'], stage: 'band-low', pal: 'warm' });

  /* ---------- harbourfireworks: fireworks over the water, seen from the quay ---------- */
  Art.add('backdrop', 'harbourfireworks', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'hf'), hz = H * 0.53, quay = H * 0.7, cols = [p.accent, p.gold, p.accent2, p.snow, mix(p.accent, '#ffffff', 0.45)], sil = shade(p.bg, -0.55), k = Math.exp(-5 * o.beat);
    vgrad(c, W, H, [shade(p.bg, -0.4), p.bg, p.bg2, mix(p.bg2, p.accent, 0.3)], 0, hz);
    K.skyStars(c, W, H, 60, o.seed, t, hz * 0.8);
    var g = c.createLinearGradient(0, hz, 0, quay); g.addColorStop(0, mix(p.bg2, p.bg, 0.4)); g.addColorStop(1, shade(p.bg, -0.38)); c.fillStyle = g; c.fillRect(0, hz, W, quay - hz + 1);
    /* the bursts, each with its light on the water */
    for (i = 0; i < 7; i++) {
      var per = 2.3 + i * 0.41, ph = t / per + i * 0.37, cyc = Math.floor(ph), f = ph - cyc, R1 = rnd(o.seed + 'b' + i + '.' + (cyc % 53)), side = (i + cyc) % 3, x = W * (side === 0 ? 0.06 + 0.26 * R1() : side === 1 ? 0.68 + 0.26 * R1() : 0.2 + 0.6 * R1()), y = H * (side === 2 ? 0.05 + 0.1 * R1() : 0.1 + 0.3 * R1()), r = u * (15 + R1() * 16), col = cols[(i + cyc) % 5], a = f > 0.1 ? Math.pow(1 - f, 1.4) : 0;
      if (a > 0) { glow(c, x, y, r * 1.6, col, 0.24 * a); c.fillStyle = alpha(col, 0.2 * a); for (j = 0; j < 6; j++) { var ry = hz + (quay - hz) * (0.08 + j * 0.15), rw = r * (0.5 - j * 0.05) * (1 + 0.2 * Math.sin(t * 3 + j + i)); c.fillRect(x - rw + Math.sin(t * 2 + j * 1.7 + i) * u, ry, rw * 2, u * 0.7); } }
      K.burst(c, x, y, r, f, col, 14 + (i % 3) * 4, u * 0.55);
      if (f > 0.25 && i % 2 === 0) for (j = 0; j < 10; j++) { var an = j / 10 * TAU + i, rr = r * (0.5 + 0.5 * f); dot(c, x + Math.cos(an) * rr * 0.7 + Math.sin(t * 9 + j) * u * 0.3, y + Math.sin(an) * rr * 0.7 + f * f * r * 0.5, u * 0.3, alpha(p.gold, a * (0.5 + 0.5 * Math.sin(t * 20 + j * 2)))); }
    }
    /* the far shore: a low town, a lighthouse sweeping */
    c.fillStyle = sil; c.beginPath(); c.moveTo(0, hz + 1); for (i = 0; i <= 24; i++) c.lineTo(i / 24 * W, hz - u * (1.5 + 2.2 * Math.abs(Math.sin(i * 0.9 + 1)) + (i < 6 ? (6 - i) * 0.9 : 0) + (i > 19 ? (i - 19) * 0.8 : 0))); c.lineTo(W, hz + 1); c.closePath(); c.fill();
    for (i = 0; i < 22; i++) { var bw = u * (2.2 + R0() * 3), bh = u * (2 + R0() * 5), bx = R0() * W, lit = alpha('#ffe2a0', 0.6 + 0.3 * Math.sin(t * 2 + i)); c.fillStyle = sil; c.fillRect(bx, hz - bh - u * 1.5, bw, bh + u * 1.5); if (i % 3 === 0) Pg(c, [[bx - u * 0.3, hz - bh - u * 1.5], [bx + bw / 2, hz - bh - u * 3], [bx + bw + u * 0.3, hz - bh - u * 1.5]], sil, true); c.fillStyle = lit; for (j = 0; j < 3; j++) if (R0() < 0.7) c.fillRect(bx + u * 0.5 + (j % 2) * bw * 0.45, hz - bh - u * 0.6 + Math.floor(j / 2) * u * 1.7, u * 0.6, u * 0.8); c.fillStyle = alpha('#ffe2a0', 0.12); c.fillRect(bx + bw * 0.3, hz + u * 0.4, u * 0.6, u * (2 + R0() * 4)); }
    var lhx = W * 0.86, lhy = hz - u * 3, sweep = Math.sin(t * 0.5);
    c.save(); c.translate(lhx, lhy - u * 11.6); c.rotate(sweep * 0.5 + PI); var bg = c.createLinearGradient(0, 0, W * 0.7, 0); bg.addColorStop(0, alpha(p.snow, 0.3)); bg.addColorStop(1, alpha(p.snow, 0)); c.fillStyle = bg; c.beginPath(); c.moveTo(0, 0); c.lineTo(W * 0.7, -u * 9); c.lineTo(W * 0.7, u * 9); c.closePath(); c.fill(); c.restore();
    Pg(c, [[lhx - u * 1.9, lhy], [lhx + u * 1.9, lhy], [lhx + u * 1.2, lhy - u * 10], [lhx - u * 1.2, lhy - u * 10]], p.paper, true); Pg(c, [[lhx - u * 1.66, lhy - u * 3.4], [lhx + u * 1.66, lhy - u * 3.4], [lhx + u * 1.45, lhy - u * 6.6], [lhx - u * 1.45, lhy - u * 6.6]], p.accent, true);
    Rn(c, lhx - u * 1.8, lhy - u * 10.6, u * 3.6, u * 0.7, 0, sil); Rn(c, lhx - u * 1.1, lhy - u * 12.6, u * 2.2, u * 2, 0, '#fff3c0'); Pg(c, [[lhx - u * 1.6, lhy - u * 12.6], [lhx + u * 1.6, lhy - u * 12.6], [lhx, lhy - u * 14.6]], sil, true); glow(c, lhx, lhy - u * 11.6, u * 9, '#fff3c0', 0.5);
    /* boats riding at anchor, lanterns in the rigging */
    for (i = 0; i < 4; i++) { var sx = W * [0.1, 0.3, 0.63, 0.9][i], sy = hz + (quay - hz) * [0.5, 0.26, 0.34, 0.62][i], ss = u * [7.5, 4.6, 5.2, 8.5][i], bob = Math.sin(t * 1.1 + i * 2) * ss * 0.04, rock = Math.sin(t * 0.9 + i) * 0.03;
      el(c, sx, sy + ss * 0.42, ss * 1.3, ss * 0.16, 'rgba(0,0,10,0.3)'); c.save(); c.translate(sx, sy + bob); c.rotate(rock);
      c.beginPath(); c.moveTo(-ss * 1.15, -ss * 0.1); c.lineTo(ss * 1.25, -ss * 0.1); c.quadraticCurveTo(ss * 0.95, ss * 0.42, ss * 0.6, ss * 0.42); c.lineTo(-ss * 0.75, ss * 0.42); c.closePath(); c.fillStyle = i % 2 ? shade(p.accent, -0.35) : shade(p.bg, -0.6); c.fill(); Rn(c, -ss * 1.15, -ss * 0.16, ss * 2.4, ss * 0.14, 0, alpha(p.paper, 0.7));
      Rn(c, -ss * 0.45, -ss * 0.5, ss * 0.8, ss * 0.36, ss * 0.06, shade(p.bg, -0.3)); Rn(c, -ss * 0.3, -ss * 0.42, ss * 0.22, ss * 0.18, 0, '#ffe2a0'); Rn(c, ss * 0.02, -ss * 0.42, ss * 0.22, ss * 0.18, 0, '#ffe2a0');
      L(c, ss * 0.1, -ss * 0.5, ss * 0.1, -ss * 2, ss * 0.06, shade(p.bg, -0.6)); L(c, ss * 0.1, -ss * 2, -ss * 1.1, -ss * 0.14, ss * 0.025, alpha(p.snow, 0.4)); L(c, ss * 0.1, -ss * 2, ss * 1.2, -ss * 0.14, ss * 0.025, alpha(p.snow, 0.4));
      for (j = 1; j < 5; j++) { var lf = j / 5, on = (j + i + o.n) % 2 === 0; dot(c, ss * 0.1 - lf * ss * 1.2, -ss * 2 + lf * ss * 1.86, ss * (on ? 0.1 + 0.03 * k : 0.07), on ? cols[(j + i) % 3] : shade(cols[(j + i) % 3], -0.3)); dot(c, ss * 0.1 + lf * ss * 1.1, -ss * 2 + lf * ss * 1.86, ss * (on ? 0.07 : 0.1 + 0.03 * k), on ? shade(cols[(j + i + 1) % 3], -0.3) : cols[(j + i + 1) % 3]); }
      c.restore(); c.fillStyle = alpha('#ffe2a0', 0.16); c.fillRect(sx - ss * 0.3, sy + ss * 0.5, ss * 0.5, ss * 0.12); c.fillRect(sx - ss * 0.2, sy + ss * 0.75, ss * 0.36, ss * 0.1); }
    c.fillStyle = alpha(p.snow, 0.07); for (i = 0; i < 26; i++) c.fillRect(frac(R0() + t * 0.004 * (i % 3 + 1)) * W, hz + u + R0() * (quay - hz - u * 2), u * (3 + R0() * 9), u * 0.22);
    /* the quay: stone edge, planks, bollards with rope, lamps at the sides */
    var st = mix('#6a6478', p.bg, 0.45); g = c.createLinearGradient(0, quay, 0, H); g.addColorStop(0, shade(st, 0.1)); g.addColorStop(1, shade(st, -0.45)); c.fillStyle = g; c.fillRect(0, quay, W, H - quay);
    fan(c, W, H, quay, 7, 2.4, Math.max(0.7, u * 0.22), 'rgba(0,0,10,0.28)'); c.fillStyle = 'rgba(0,0,10,0.2)'; for (i = 1; i < 6; i++) { var yy = quay + (H - quay) * Math.pow(i / 6, 1.6); c.fillRect(0, yy, W, Math.max(1, u * 0.2)); }
    Rn(c, 0, quay, W, u * 1.3, 0, shade(st, 0.3)); Rn(c, 0, quay + u * 1.3, W, u * 0.6, 0, 'rgba(0,0,10,0.3)');
    var nb = Math.max(4, Math.round(W / (u * 24))), ry0 = quay - u * 2.6;
    c.beginPath(); for (i = 0; i < nb; i++) { var x0 = (i + 0.5) / nb * W, x1 = (i + 1.5) / nb * W; c.moveTo(x0, ry0); c.quadraticCurveTo((x0 + x1) / 2, ry0 + u * 4.4, x1, ry0); } c.moveTo(0.5 / nb * W, ry0); c.quadraticCurveTo(0, ry0 + u * 3, -u * 4, ry0 + u * 1); c.lineWidth = u * 0.6; c.strokeStyle = mix('#c9a66a', p.bg, 0.3); c.stroke();
    for (i = 0; i < nb; i++) { var px = (i + 0.5) / nb * W; Rn(c, px - u * 1.1, quay - u * 3.6, u * 2.2, u * 4.6, u * 0.5, shade(p.bg, -0.6)); Rn(c, px - u * 1.6, quay - u * 4.2, u * 3.2, u * 1.3, u * 0.6, shade(p.bg, -0.5)); Rn(c, px - u * 1.6, quay - u * 4.2, u * 3.2, u * 0.4, u * 0.2, alpha(p.snow, 0.2)); }
    for (i = 0; i < 2; i++) { var lx = i ? W - u * 6 : u * 6; lampPost(c, lx, quay + u * 6, u * 30, u * 1.25, shade(p.bg, -0.62), '#ffd98a', 1); el(c, lx, quay + u * 6.4, u * 11, u * 2, alpha('#ffd98a', 0.14)); }
    c.fillStyle = alpha(p.accent, 0.1 + 0.05 * k); c.fillRect(0, quay, W, u * 6);
    /* the near corners: crates and a barrel on one side, a coil of rope and a lobster pot on the other */
    var cb = H - u * 3, cw = mix('#9a6a3e', p.bg, 0.35), rp = mix('#c9a66a', p.bg, 0.25);
    el(c, u * 13, cb + u * 0.8, u * 15, u * 2.2, 'rgba(0,0,10,0.3)');
    Rn(c, u * 2, cb - u * 10, u * 12, u * 10, u * 0.6, cw); Rn(c, u * 2, cb - u * 10, u * 12, u * 1.5, u * 0.4, shade(cw, 0.18)); Rn(c, u * 2, cb - u * 1.5, u * 12, u * 1.5, u * 0.4, shade(cw, -0.2)); L(c, u * 3.4, cb - u * 8, u * 12.6, cb - u * 2, u * 1.1, shade(cw, -0.15));
    Rn(c, u * 4.4, cb - u * 17, u * 8, u * 7, u * 0.5, shade(cw, 0.1)); Rn(c, u * 4.4, cb - u * 17, u * 8, u * 1.2, u * 0.4, shade(cw, 0.26)); L(c, u * 5.4, cb - u * 11.4, u * 11.4, cb - u * 15.2, u * 0.9, shade(cw, -0.1));
    Rn(c, u * 15.4, cb - u * 9, u * 8, u * 9, u * 2.2, shade(cw, -0.12)); for (i = 0; i < 3; i++) Rn(c, u * 15.2, cb - u * (8 - i * 3.3), u * 8.4, u * 0.8, u * 0.3, shade(p.bg, -0.5)); el(c, u * 19.4, cb - u * 9, u * 3.6, u * 0.9, shade(cw, 0.12));
    var rx = W - u * 9; el(c, rx - u * 3, cb + u * 0.8, u * 15, u * 2.2, 'rgba(0,0,10,0.3)');
    for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(rx, cb - u * (1 + i * 1.3), u * (6.4 - i * 0.3), u * 1.9, 0, 0, TAU); c.lineWidth = u * 1.4; c.strokeStyle = i % 2 ? rp : shade(rp, -0.14); c.stroke(); }
    var lpx = rx - u * 14; c.beginPath(); c.moveTo(lpx - u * 6, cb); c.lineTo(lpx - u * 6, cb - u * 4); c.quadraticCurveTo(lpx, cb - u * 10, lpx + u * 6, cb - u * 4); c.lineTo(lpx + u * 6, cb); c.closePath(); c.fillStyle = alpha(shade(cw, -0.3), 0.7); c.fill(); c.lineWidth = u * 0.6; c.strokeStyle = shade(cw, 0.1); c.stroke();
    for (i = -2; i <= 2; i++) L(c, lpx + i * u * 2.4, cb, lpx + i * u * 2.4, cb - u * (7 - Math.abs(i) * 1.3), u * 0.35, shade(cw, 0.1)); L(c, lpx - u * 6, cb - u * 3.4, lpx + u * 6, cb - u * 3.4, u * 0.35, shade(cw, 0.1));
  }, { variants: ['night'], stage: 'band-low', pal: 'dark' });

  /* ---------- clocksquare: a town square under its clock tower, minutes before midnight ---------- */
  Art.add('backdrop', 'clocksquare', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'cs'), fl = H * 0.66, k = Math.exp(-5 * o.beat), far = mix(p.bg2, '#0a0a20', 0.45), stone = mix('#7c7088', p.bg2, 0.4), cols = [p.accent, p.gold, p.accent2, p.snow];
    vgrad(c, W, H, [shade(p.bg, -0.45), p.bg, p.bg2, mix(p.bg2, p.accent, 0.25)], 0, fl);
    K.skyStars(c, W, H, 80, o.seed, t, H * 0.5); K.moonDisc(c, W * 0.8, H * 0.1, u * 4.6, '#fff6d8');
    /* far roofs, then the houses round the square */
    c.fillStyle = far; c.beginPath(); c.moveTo(0, fl); for (i = 0; i <= 30; i++) { var hx = i / 30 * W, hh = u * (10 + 7 * frac(Math.sin(i * 12.9) * 43758.5)); c.lineTo(hx, fl - hh); c.lineTo(hx + W / 60, fl - hh - u * 2.4); c.lineTo(hx + W / 30, fl - hh); } c.lineTo(W, fl); c.closePath(); c.fill();
    var x = -u * 4, hc = [mix('#8a4a52', p.bg, 0.35), mix('#5d5a8e', p.bg, 0.3), mix('#a06a44', p.bg, 0.35), mix('#4f6a8a', p.bg, 0.3)]; i = 0;
    while (x < W) { var w = u * (15 + R0() * 6), h = u * (15 + R0() * 9), mid = x + w / 2 > W * 0.3 && x + w / 2 < W * 0.7; if (mid) h *= 0.72;
      Rn(c, x, fl - h, w, h + 2, 0, hc[i % 4]); Pg(c, [[x - u * 0.8, fl - h], [x + w / 2, fl - h - w * 0.36], [x + w + u * 0.8, fl - h]], shade(hc[i % 4], -0.3), true); Rn(c, x + w * 0.68, fl - h - w * 0.34, w * 0.12, w * 0.24, 0, shade(hc[i % 4], -0.3));
      var rows = Math.max(1, Math.floor((h - u * 6) / (u * 5.6))), r, q; for (r = 0; r < rows; r++) for (q = 0; q < 3; q++) { var on = ((i * 7 + r * 3 + q * 5) % 4) !== 0, wx = x + w * (0.12 + q * 0.29), wy = fl - h + u * 2 + r * u * 5.6; Rn(c, wx, wy, w * 0.18, u * 3.4, w * 0.09, on ? alpha('#ffe08a', 0.8 + 0.2 * Math.sin(t * 2 + i + r + q * 2)) : shade(hc[i % 4], -0.2)); if (on) Rn(c, wx + w * 0.085, wy, u * 0.25, u * 3.4, 0, shade(hc[i % 4], -0.3)); }
      Rn(c, x + w * 0.38, fl - u * 5, w * 0.24, u * 5, w * 0.12, shade(hc[i % 4], -0.4)); if (i % 2) { for (q = 0; q < 5; q++) Rn(c, x + w * 0.08 + q * w * 0.17, fl - u * 7.4, w * 0.17 + 1, u * 2, 0, q % 2 ? p.paper : p.accent); }
      x += w + u * 0.3; i++; }
    glow(c, W / 2, fl, W * 0.7, '#ffd98a', 0.14);
    /* the clock tower, left of the middle so the photos leave its face alone */
    var tx = W * 0.17, tw = u * 15, top = H * 0.2, tc = mix(stone, p.bg, 0.15), cy = top + u * 11, cr = u * 5.6;
    Rn(c, tx - tw / 2, top, tw, fl - top + 2, 0, tc); Rn(c, tx - tw / 2, top, tw * 0.2, fl - top, 0, shade(tc, 0.12)); Rn(c, tx + tw * 0.3, top, tw * 0.2, fl - top, 0, shade(tc, -0.14));
    for (j = 0; j < 7; j++) { var by = top + u * 22 + j * u * 7; if (by > fl - u * 9) break; Rn(c, tx - u * 1.4, by, u * 2.8, u * 4.6, u * 1.4, j % 2 ? alpha('#ffe08a', 0.85) : shade(tc, -0.3)); Rn(c, tx - tw / 2, by + u * 5.6, tw, u * 0.5, 0, shade(tc, -0.2)); }
    Rn(c, tx - tw * 0.6, top - u * 1.2, tw * 1.2, u * 2.2, u * 0.4, shade(tc, 0.2)); Rn(c, tx - tw * 0.56, top + u * 19, tw * 1.12, u * 1.4, u * 0.3, shade(tc, 0.2));
    for (j = -2; j <= 2; j++) Rn(c, tx + j * tw * 0.24 - u * 1, top - u * 3, u * 2, u * 2, 0, shade(tc, 0.2));
    Pg(c, [[tx - tw * 0.42, top - u * 1.2], [tx + tw * 0.42, top - u * 1.2], [tx, top - u * 17]], shade(mix(p.accent, tc, 0.5), -0.25), true); Pg(c, [[tx - tw * 0.42, top - u * 1.2], [tx - tw * 0.1, top - u * 1.2], [tx, top - u * 17]], shade(mix(p.accent, tc, 0.5), -0.05), true);
    L(c, tx, top - u * 17, tx, top - u * 21, u * 0.4, p.gold); dot(c, tx, top - u * 17.4, u * 0.9, p.gold); Pg(c, [[tx, top - u * 21], [tx + u * 3.4 + Math.sin(t * 2) * u * 0.3, top - u * 20], [tx, top - u * 19]], p.accent, true);
    glow(c, tx, cy, cr * 3.2, '#fff0c0', 0.3 + 0.1 * k); dot(c, tx, cy, cr * 1.16, p.gold); dot(c, tx, cy, cr, '#fff6dc'); dot(c, tx, cy, cr * 0.82, '#fffdf2');
    for (j = 0; j < 12; j++) { var an = j / 12 * TAU; L(c, tx + Math.sin(an) * cr * (j % 3 ? 0.84 : 0.72), cy - Math.cos(an) * cr * (j % 3 ? 0.84 : 0.72), tx + Math.sin(an) * cr * 0.93, cy - Math.cos(an) * cr * 0.93, u * (j % 3 ? 0.3 : 0.55), p.ink); }
    var ma = -0.3 + 0.2 * clamp(t / 60, 0, 1), ha = -0.035, sa = Math.floor(t * 1.2) / 60 * TAU;
    L(c, tx, cy, tx + Math.sin(ha) * cr * 0.5, cy - Math.cos(ha) * cr * 0.5, u * 0.85, p.ink); L(c, tx, cy, tx + Math.sin(ma) * cr * 0.78, cy - Math.cos(ma) * cr * 0.78, u * 0.6, p.ink); L(c, tx, cy, tx + Math.sin(sa) * cr * 0.8, cy - Math.cos(sa) * cr * 0.8, u * 0.22, p.accent); dot(c, tx, cy, u * 0.7, p.accent);
    Rn(c, tx - u * 3, fl - u * 9, u * 6, u * 9, u * 3, shade(tc, -0.45)); Rn(c, tx - u * 2.2, fl - u * 8, u * 4.4, u * 8, u * 2.2, mix('#6a3a22', p.bg, 0.3));
    /* strings of lights swung out from the tower and across the square */
    K.lightString(c, tx, top + u * 20, W + u * 3, H * 0.33, u * 6, Math.max(7, Math.round(W / (u * 9))), u * 0.95, { beat: o.beat, n: o.n }, t);
    K.lightString(c, -u * 3, H * 0.43, tx - tw / 2, top + u * 24, u * 2, 2, u * 0.95, { beat: o.beat, n: o.n + 1 }, t);
    K.lightString(c, tx + tw / 2, H * 0.47, W + u * 3, H * 0.5, u * 4, Math.max(6, Math.round(W / (u * 11))), u * 0.9, { beat: o.beat, n: o.n + 1 }, t);
    /* the square: cobbles fanning out, lamps, planters, last year's streamers */
    var g = c.createLinearGradient(0, fl, 0, H); g.addColorStop(0, shade(stone, 0.02)); g.addColorStop(1, shade(stone, -0.5)); c.fillStyle = g; c.fillRect(0, fl, W, H - fl);
    c.strokeStyle = 'rgba(10,5,30,0.26)'; c.lineWidth = Math.max(0.7, u * 0.22); for (i = 1; i < 9; i++) { var yy = fl + (H - fl) * Math.pow(i / 9, 1.7), n = 9 + i, off = (i % 2) * 0.5; c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy); var y2 = fl + (H - fl) * Math.pow((i + 1) / 9, 1.7); for (j = -1; j <= n; j++) { c.moveTo((j + off) / n * W, yy); c.lineTo((j + off) / n * W, y2); } c.stroke(); }
    c.fillStyle = alpha(p.snow, 0.06); for (i = 0; i < 30; i++) { var px = R0() * W, py = fl + u * 2 + R0() * (H - fl - u * 3); c.beginPath(); c.ellipse(px, py, u * (1.5 + R0() * 2), u * 0.5, 0, 0, TAU); c.fill(); }
    Rn(c, 0, fl, W, u * 0.8, 0, shade(stone, 0.25));
    lampPost(c, W - u * 5.5, fl + u * 7, u * 27, u * 1.2, shade(p.bg, -0.62), '#ffd98a', 1);
    for (i = 0; i < 2; i++) { var bxp = i ? W - u * 13 : u * 15, byp = H - u * 4, pc = mix('#7a4a2a', p.bg, 0.3); /* planters in the near corners */
      el(c, bxp, byp + u * 0.6, u * 12, u * 1.8, 'rgba(0,0,10,0.3)'); for (j = -2; j <= 2; j++) el(c, bxp + j * u * 3.6, byp - u * (8.4 - Math.abs(j) * 1.1), u * 3.4, u * 3.6, j % 2 ? mix('#2f6e58', p.bg, 0.25) : mix('#3d8a66', p.bg, 0.25));
      for (j = 0; j < 7; j++) dot(c, bxp + (frac(j * 0.37 + i * 0.2) - 0.5) * u * 16, byp - u * (7 + frac(j * 0.61) * 4), u * 0.8, (j + o.n) % 2 ? cols[j % 3] : p.snow);
      Rn(c, bxp - u * 10, byp - u * 6.4, u * 20, u * 6.6, u * 0.8, pc); Rn(c, bxp - u * 10.6, byp - u * 7, u * 21.2, u * 1.6, u * 0.6, shade(pc, 0.2)); for (j = -1; j <= 1; j++) Rn(c, bxp + j * u * 6.4 - u * 0.2, byp - u * 5.4, u * 0.4, u * 5.4, 0, shade(pc, -0.25)); }
    lampPost(c, u * 5.2, fl + u * 13, u * 30, u * 1.3, shade(p.bg, -0.62), '#ffd98a', 1); el(c, u * 5.2, fl + u * 13.4, u * 12, u * 2.2, alpha('#ffd98a', 0.14)); el(c, W - u * 5.5, fl + u * 7.4, u * 11, u * 2, alpha('#ffd98a', 0.14));
    for (i = 0; i < 34; i++) { var sx = R0() * W, sy = fl + u * 3 + R0() * (H - fl - u * 4), cen = Math.abs(sx / W - 0.5) < 0.2 ? 0.5 : 1; c.save(); c.translate(sx, sy); c.rotate(R0() * 3); c.fillStyle = alpha(cols[i % 4], 0.75 * cen); if (i % 3) c.fillRect(-u * 0.8, -u * 0.3, u * 1.6, u * 0.6); else { c.beginPath(); c.arc(0, 0, u * 1.4, 0.3, 2.6); c.lineWidth = u * 0.35; c.strokeStyle = alpha(cols[i % 4], 0.75 * cen); c.stroke(); } c.restore(); }
    vignette(c, W, H, '#04020f', 0.3);
  }, { variants: ['night'], stage: 'band-low', pal: 'dark' });

  /* ---------- dancefloor: lit tiles, beams and speaker stacks ---------- */
  Art.add('backdrop', 'dancefloor', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'df'), fl = H * 0.63, k = Math.exp(-5 * o.beat), cols = [p.accent, p.gold, p.accent2, mix(p.accent, p.accent2, 0.5), p.snow], dk = shade(p.bg, -0.55);
    vgrad(c, W, H, [shade(p.bg, -0.6), shade(p.bg, -0.25), mix(p.bg, p.bg2, 0.6)], 0, fl);
    K.bokeh(c, W, fl, 26, o.seed, t, cols, u, 0, fl);
    /* glowing rings on the back wall, at the sides */
    for (i = 0; i < 2; i++) { var rx = i ? W * 0.86 : W * 0.14, ry = H * 0.4; for (j = 0; j < 3; j++) { var rr = u * (5 + j * 3.6) * (1 + 0.04 * k * (j + 1)); ring(c, rx, ry, rr, u * 2.2, alpha(cols[(j + i) % 3], 0.12)); ring(c, rx, ry, rr, u * 0.7, alpha(cols[(j + i) % 3], 0.75)); ring(c, rx, ry, rr, u * 0.22, alpha('#ffffff', 0.7)); } }
    /* the rig: a truss, five lamps, their beams sweeping */
    for (i = 0; i < 5; i++) { var lx = W * (0.1 + i * 0.2), by = fl + u * 5, bx = lx + Math.sin(t * 0.7 + i * 1.9) * W * 0.16, col = cols[i % 4], g = c.createLinearGradient(0, H * 0.05, 0, by); g.addColorStop(0, alpha(col, 0.34 + 0.1 * k)); g.addColorStop(1, alpha(col, 0.02)); c.fillStyle = g; c.beginPath(); c.moveTo(lx - u * 1.2, H * 0.05); c.lineTo(lx + u * 1.2, H * 0.05); c.lineTo(bx + u * 12, by); c.lineTo(bx - u * 12, by); c.closePath(); c.fill(); }
    Rn(c, 0, H * 0.018, W, u * 0.7, 0, dk); Rn(c, 0, H * 0.018 + u * 2.6, W, u * 0.7, 0, dk); c.strokeStyle = dk; c.lineWidth = u * 0.45; c.beginPath(); for (i = 0; i * u * 3.4 < W + u * 4; i++) { c.moveTo(i * u * 3.4, H * 0.018 + (i % 2 ? 0 : u * 3)); c.lineTo((i + 1) * u * 3.4, H * 0.018 + (i % 2 ? u * 3 : 0)); } c.stroke();
    for (i = 0; i < 5; i++) { var lx2 = W * (0.1 + i * 0.2), an = Math.sin(t * 0.7 + i * 1.9) * 0.3; c.save(); c.translate(lx2, H * 0.018 + u * 4.6); c.rotate(-an); Rn(c, -u * 2, -u * 1.6, u * 4, u * 4.4, u * 1, shade(p.bg, -0.7)); el(c, 0, u * 2.8, u * 1.9, u * 0.8, mix(cols[i % 4], '#ffffff', 0.5)); c.restore(); glow(c, lx2, H * 0.018 + u * 7, u * 8, cols[i % 4], 0.4); }
    /* a small mirror ball right at the top */
    var mx = W / 2, my = H * 0.018 + u * 7.4, mr = u * 3.4; L(c, mx, H * 0.02, mx, my - mr, u * 0.3, dk); dot(c, mx, my, mr, '#aab4d0'); c.save(); c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.clip(); for (i = -3; i <= 3; i++) for (j = -3; j <= 3; j++) { var sh = frac(Math.sin((i * 7 + j * 13 + Math.floor(t * 3)) * 12.9898) * 43758.5); c.fillStyle = sh > 0.75 ? '#ffffff' : sh > 0.4 ? '#cfd8ee' : '#7a86aa'; c.fillRect(mx + i * mr * 0.3 - mr * 0.13, my + j * mr * 0.3 - mr * 0.13, mr * 0.26, mr * 0.26); } c.restore();
    for (i = 0; i < 12; i++) { var da = i / 12 * TAU + t * 0.25, dr = u * (10 + (i % 4) * 9); dot(c, mx + Math.cos(da) * dr * 1.6, my + u * 6 + Math.abs(Math.sin(da)) * dr, u * 0.5, alpha(p.snow, 0.5)); }
    /* speaker stacks at the sides */
    for (i = 0; i < 2; i++) { var sx = i ? W - u * 15 : u * 1, sw = u * 14, sy = fl + u * 3;
      for (j = 0; j < 2; j++) { var top = sy - u * (17 + j * 15.6), hh = u * (j ? 15 : 17), ww = sw - j * u * 2, xx = sx + j * u; Rn(c, xx, top, ww, hh, u * 1, shade(p.bg, -0.72)); Rn(c, xx + u * 0.6, top + u * 0.6, ww - u * 1.2, hh - u * 1.2, u * 0.7, shade(p.bg, -0.6));
        var cr = ww * 0.3 * (1 + 0.06 * k), ccy = top + hh * 0.6; dot(c, xx + ww / 2, ccy, cr * 1.12, shade(p.bg, -0.78)); dot(c, xx + ww / 2, ccy, cr, mix(p.bg, '#3a3a50', 0.5)); ring(c, xx + ww / 2, ccy, cr * 0.7, u * 0.3, alpha(p.snow, 0.16)); dot(c, xx + ww / 2, ccy, cr * 0.36, shade(p.bg, -0.7)); dot(c, xx + ww / 2 - cr * 0.1, ccy - cr * 0.1, cr * 0.12, alpha(p.snow, 0.35));
        dot(c, xx + ww * 0.3, top + hh * 0.17, ww * 0.085, mix(p.bg, '#3a3a50', 0.5)); dot(c, xx + ww * 0.7, top + hh * 0.17, ww * 0.085, mix(p.bg, '#3a3a50', 0.5)); dot(c, xx + ww * 0.5, top + hh * 0.14, u * 0.45, (o.n + j) % 2 ? p.accent2 : p.accent); }
      el(c, sx + sw / 2, sy + u * 0.5, sw * 0.7, u * 1.6, 'rgba(0,0,10,0.4)'); }
    /* the floor: tiles that light in turn, running to a point behind the wall */
    c.fillStyle = shade(p.bg, -0.7); c.fillRect(0, fl, W, H - fl);
    var rows = 7, half = 5, vy = fl - (H - fl) * 0.75, tw = W * 0.2;
    for (i = 0; i < rows; i++) { var y1 = fl + (H - fl) * Math.pow(i / rows, 1.45), y2 = fl + (H - fl) * Math.pow((i + 1) / rows, 1.45), s1 = (y1 - vy) / (H - vy), s2 = (y2 - vy) / (H - vy);
      for (j = -half; j < half; j++) { var hsh = frac(Math.sin((i * 31 + j * 17 + o.n * 7) * 12.9898) * 43758.5453), col2 = cols[Math.floor(hsh * 97) % 4], lit = hsh > 0.45, a = lit ? 0.72 + 0.26 * k : 0.2, gp = u * 0.25;
        quad(c, W / 2 + j * tw * s1 + gp, y1 + gp, W / 2 + (j + 1) * tw * s1 - gp, y1 + gp, W / 2 + (j + 1) * tw * s2 - gp, y2 - gp, W / 2 + j * tw * s2 + gp, y2 - gp, alpha(col2, a));
        if (lit) quad(c, W / 2 + (j + 0.14) * tw * s1, y1 + (y2 - y1) * 0.12, W / 2 + (j + 0.86) * tw * s1, y1 + (y2 - y1) * 0.12, W / 2 + (j + 0.84) * tw * s1, y1 + (y2 - y1) * 0.3, W / 2 + (j + 0.16) * tw * s1, y1 + (y2 - y1) * 0.3, alpha('#ffffff', 0.16)); } }
    vgrad2(c, 0, fl, W, u * 10, alpha(shade(p.bg, -0.7), 0.75), alpha(shade(p.bg, -0.7), 0)); Rn(c, 0, fl - u * 0.5, W, u * 1, 0, alpha(p.snow, 0.3));
    glow(c, W / 2, H * 0.86, W * 0.8, p.accent, 0.1 + 0.06 * k); vignette(c, W, H, '#02010a', 0.42);
  }, { variants: ['one'], stage: 'cast-low', pal: 'dark' });

  /* ---------- studio: a recording studio, the red lamp lit ---------- */
  Art.add('backdrop', 'studio', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'rs'), fl = H * 0.65, k = Math.exp(-5 * o.beat), wall = mix(p.bg, '#2a2230', 0.3), dk = shade(wall, -0.5), wd = mix('#9a6238', p.bg2, 0.2);
    vgrad(c, W, H, [shade(wall, -0.3), wall, shade(wall, 0.08)], 0, fl);
    /* foam panels down both sides: little pyramids */
    var ps = u * 6.2, cols = Math.max(2, Math.round(W * 0.22 / ps));
    for (var s = 0; s < 2; s++) for (i = 0; i < cols; i++) for (j = 0; j * ps < fl - u * 3; j++) { var x = s ? W - (i + 1) * ps : i * ps, y = j * ps + u * 1, a = (i + j + s) % 2, cA = shade(wall, a ? -0.3 : -0.2), cB = shade(wall, a ? -0.12 : -0.38);
      Pg(c, [[x, y], [x + ps, y], [x + ps / 2, y + ps / 2]], a ? cA : cB, true); Pg(c, [[x, y + ps], [x + ps, y + ps], [x + ps / 2, y + ps / 2]], a ? cB : cA, true); Pg(c, [[x, y], [x, y + ps], [x + ps / 2, y + ps / 2]], shade(wall, -0.26), true); Pg(c, [[x + ps, y], [x + ps, y + ps], [x + ps / 2, y + ps / 2]], shade(wall, -0.34), true); }
    /* the control-room window: a desk, meters dancing, someone's lamp */
    var wx = W * 0.25, ww = W * 0.5, wy = H * 0.045, wh = Math.min(H * 0.15, u * 26);
    Rn(c, wx - u * 1.6, wy - u * 1.6, ww + u * 3.2, wh + u * 3.2, u * 1.4, shade(wd, -0.3)); Rn(c, wx, wy, ww, wh, u * 0.6, mix('#141826', p.bg, 0.3));
    c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
    glow(c, wx + ww * 0.78, wy + wh * 0.25, ww * 0.5, '#ffcf8a', 0.3); Pg(c, [[wx + ww * 0.74, wy + wh * 0.3], [wx + ww * 0.82, wy + wh * 0.3], [wx + ww * 0.8, wy + wh * 0.18], [wx + ww * 0.76, wy + wh * 0.18]], p.gold, true); L(c, wx + ww * 0.78, wy + wh * 0.3, wx + ww * 0.78, wy + wh * 0.62, u * 0.4, dk);
    Pg(c, [[wx - u, wy + wh], [wx + ww + u, wy + wh], [wx + ww * 0.94, wy + wh * 0.6], [wx + ww * 0.06, wy + wh * 0.6]], mix('#3a3f55', p.bg, 0.3), true);
    var nm = 14; for (i = 0; i < nm; i++) { var lv = 0.25 + 0.75 * Math.abs(Math.sin(t * (2 + (i % 5) * 0.7) + i * 1.3)) * (0.55 + 0.45 * k), mx = wx + ww * (0.1 + i / nm * 0.6), n = 5; for (j = 0; j < n; j++) { var on = j / n < lv; c.fillStyle = on ? (j > 3 ? p.accent : j > 2 ? p.gold : p.accent2) : 'rgba(255,255,255,0.08)'; c.fillRect(mx, wy + wh * 0.52 - j * u * 1.1, ww * 0.03, u * 0.8); } }
    for (i = 0; i < 16; i++) { var fx = wx + ww * (0.1 + i / 16 * 0.8), fy = wy + wh * (0.7 + 0.16 * frac(i * 0.37 + Math.sin(t * 0.3 + i) * 0.1)); L(c, fx, wy + wh * 0.66, fx, wy + wh * 0.95, u * 0.2, 'rgba(0,0,0,0.4)'); Rn(c, fx - u * 0.5, fy, u * 1, u * 0.8, u * 0.2, i % 4 ? p.paper : p.accent); }
    quad(c, wx, wy, wx + ww * 0.3, wy, wx + ww * 0.12, wy + wh, wx - ww * 0.18, wy + wh, 'rgba(255,255,255,0.05)'); quad(c, wx + ww * 0.4, wy, wx + ww * 0.48, wy, wx + ww * 0.3, wy + wh, wx + ww * 0.22, wy + wh, 'rgba(255,255,255,0.05)');
    c.restore();
    /* the recording lamp over the door side: a plain red light */
    var rl = 0.65 + 0.35 * Math.sin(t * 2.2); glow(c, W * 0.88, H * 0.07, u * 14, p.accent, 0.4 * rl); Rn(c, W * 0.88 - u * 5, H * 0.07 - u * 2.4, u * 10, u * 4.8, u * 1.2, dk); Rn(c, W * 0.88 - u * 4.2, H * 0.07 - u * 1.7, u * 8.4, u * 3.4, u * 0.8, mix(p.accent, '#ffffff', 0.25 * rl)); dot(c, W * 0.88, H * 0.07, u * 1.1, alpha('#ffffff', 0.5 + 0.4 * rl));
    /* gold records on the other side */
    for (i = 0; i < 2; i++) { var gx = W * 0.115, gy = H * (0.06 + i * 0.085), gs = u * 5.4; Rn(c, gx - gs, gy - gs, gs * 2, gs * 2, u * 0.5, shade(wd, -0.2)); Rn(c, gx - gs * 0.86, gy - gs * 0.86, gs * 1.72, gs * 1.72, u * 0.3, p.paper); dot(c, gx, gy, gs * 0.7, i ? '#cfd6e2' : p.gold); ring(c, gx, gy, gs * 0.5, u * 0.2, 'rgba(0,0,0,0.2)'); ring(c, gx, gy, gs * 0.36, u * 0.2, 'rgba(0,0,0,0.2)'); dot(c, gx, gy, gs * 0.2, p.accent); dot(c, gx, gy, gs * 0.05, p.paper); }
    /* floor: warm boards and a round rug */
    var g = c.createLinearGradient(0, fl, 0, H); g.addColorStop(0, shade(wd, 0.05)); g.addColorStop(1, shade(wd, -0.4)); c.fillStyle = g; c.fillRect(0, fl, W, H - fl); fan(c, W, H, fl, 7, 2.5, Math.max(0.7, u * 0.22), 'rgba(30,10,0,0.3)');
    Rn(c, 0, fl - u * 2.4, W, u * 2.4, 0, shade(wall, -0.45)); Rn(c, 0, fl, W, u * 0.7, 0, shade(wd, 0.3));
    var ry = fl + (H - fl) * 0.6; el(c, W / 2, ry, W * 0.46, (H - fl) * 0.33, shade(p.accent, -0.3)); c.beginPath(); c.ellipse(W / 2, ry, W * 0.42, (H - fl) * 0.29, 0, 0, TAU); c.lineWidth = u * 0.8; c.strokeStyle = alpha(p.gold, 0.8); c.stroke(); el(c, W / 2, ry, W * 0.36, (H - fl) * 0.24, shade(p.accent, -0.16)); c.beginPath(); c.ellipse(W / 2, ry, W * 0.27, (H - fl) * 0.17, 0, 0, TAU); c.setLineDash([u * 2, u * 2]); c.lineWidth = u * 0.6; c.strokeStyle = alpha(p.paper, 0.5); c.stroke(); c.setLineDash([]);
    /* left: a microphone on its boom, a pop shield, headphones hung on the stand */
    var bx = u * 12, bs = fl + u * 5;
    el(c, bx, bs + u * 0.4, u * 8, u * 1.6, 'rgba(0,0,10,0.35)'); L(c, bx, bs, bx - u * 6, bs + u * 1.6, u * 0.8, dk); L(c, bx, bs, bx + u * 6, bs + u * 1.6, u * 0.8, dk); L(c, bx, bs, bx, bs + u * 2.4, u * 0.8, dk);
    L(c, bx, bs, bx, bs - u * 34, u * 0.9, '#8a909c'); L(c, bx - u * 5, bs - u * 31, bx + u * 13, bs - u * 40, u * 0.8, '#8a909c'); dot(c, bx, bs - u * 33.5, u * 1.3, dk); dot(c, bx - u * 5, bs - u * 31, u * 1.6, dk);
    var mxx = bx + u * 13, myy = bs - u * 36; L(c, mxx, bs - u * 40, mxx, myy - u * 3, u * 0.6, dk); Rn(c, mxx - u * 2.2, myy - u * 3.4, u * 4.4, u * 8.4, u * 2.2, '#b9c0cc'); Rn(c, mxx - u * 2.2, myy - u * 3.4, u * 4.4, u * 4.6, u * 2.2, '#dfe4ec'); for (i = 0; i < 4; i++) L(c, mxx - u * 1.7, myy - u * 2.2 + i * u * 1, mxx + u * 1.7, myy - u * 2.2 + i * u * 1, u * 0.2, '#8a909c'); Rn(c, mxx - u * 2.4, myy + u * 1.2, u * 4.8, u * 0.9, u * 0.3, p.gold);
    ring(c, mxx + u * 5.6, myy - u * 0.4, u * 3.6, u * 0.5, dk); dot(c, mxx + u * 5.6, myy - u * 0.4, u * 3.3, alpha('#10121c', 0.45)); L(c, mxx + u * 2, myy + u * 3.6, mxx + u * 4.4, myy + u * 2.6, u * 0.4, dk);
    c.beginPath(); c.arc(bx, bs - u * 22, u * 3.2, PI, 0); c.lineWidth = u * 0.8; c.strokeStyle = dk; c.stroke(); Rn(c, bx - u * 4.4, bs - u * 22.6, u * 2.2, u * 4, u * 1, p.accent); Rn(c, bx + u * 2.2, bs - u * 22.6, u * 2.2, u * 4, u * 1, p.accent);
    /* right: an amp with a guitar leaning on it */
    var ax = W - u * 22, ay = fl + u * 6;
    el(c, ax + u * 10, ay + u * 0.4, u * 13, u * 1.8, 'rgba(0,0,10,0.35)'); Rn(c, ax, ay - u * 17, u * 19, u * 17, u * 1.4, mix('#2a2a34', p.bg, 0.2)); Rn(c, ax + u * 1.2, ay - u * 12.4, u * 16.6, u * 11.2, u * 0.9, mix('#8a7a5a', p.bg, 0.25));
    c.fillStyle = 'rgba(0,0,0,0.16)'; for (i = 0; i < 7; i++) c.fillRect(ax + u * 1.2, ay - u * 12 + i * u * 1.6, u * 16.6, u * 0.4); dot(c, ax + u * 9.5, ay - u * 6.8, u * 4.2 * (1 + 0.04 * k), 'rgba(0,0,0,0.2)');
    Rn(c, ax + u * 1.2, ay - u * 16, u * 16.6, u * 2.6, u * 0.6, p.gold); for (i = 0; i < 5; i++) dot(c, ax + u * (3.4 + i * 2.6), ay - u * 14.7, u * 0.8, dk); dot(c, ax + u * 16.2, ay - u * 14.7, u * 0.6, Math.sin(t * 3) > -0.5 ? p.accent : dk);
    c.save(); c.translate(ax - u * 3.5, ay); c.rotate(0.16); var gc = p.accent2;
    Rn(c, -u * 1, -u * 34, u * 2, u * 22, u * 0.4, '#6a4428'); Rn(c, -u * 1.6, -u * 38.6, u * 3.2, u * 5, u * 0.9, shade(gc, -0.3)); for (i = 0; i < 3; i++) { dot(c, -u * 2, -u * (37.6 - i * 1.4), u * 0.45, '#dfe4ec'); dot(c, u * 2, -u * (37.6 - i * 1.4), u * 0.45, '#dfe4ec'); }
    el(c, 0, -u * 5, u * 6.4, u * 5.2, gc); el(c, 0, -u * 11.6, u * 4.8, u * 4.2, gc); el(c, -u * 1.4, -u * 6.4, u * 3.6, u * 2.6, shade(gc, 0.18)); dot(c, 0, -u * 8.6, u * 1.9, shade(gc, -0.6)); Rn(c, -u * 2.2, -u * 4, u * 4.4, u * 1, u * 0.3, p.paper);
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = Math.max(0.5, u * 0.12); c.beginPath(); for (i = -1; i <= 1; i++) { c.moveTo(i * u * 0.5, -u * 34); c.lineTo(i * u * 0.6, -u * 3.6); } c.stroke(); c.restore();
    /* a cable finds its own way across the floor */
    c.beginPath(); c.moveTo(ax + u * 2, ay - u * 1); c.bezierCurveTo(W * 0.7, H * 0.99, W * 0.34, fl + (H - fl) * 0.05, bx + u * 2, bs + u * 0.6); c.lineWidth = u * 0.5; c.strokeStyle = 'rgba(10,10,20,0.6)'; c.stroke();
    glow(c, W / 2, fl + u * 4, W * 0.8, '#ffcf8a', 0.12); vignette(c, W, H, '#05030c', 0.36);
  }, { variants: ['one'], stage: 'cast-low', pal: 'dark' });

  /* ---------- artstudio: skylights, an easel, jars of brushes, paint on the boards ---------- */
  function jar(c, x, y, s, col, n, t) { /* a jar of brushes, base centre at (x, y) */
    var i, tips = ['#d8423a', '#3a7ad8', '#f2b63a', '#3aa86a', '#8a4ac8'];
    for (i = 0; i < n; i++) { var a = (i - (n - 1) / 2) * 0.2, bx = x + Math.sin(a) * s * 1.9, by = y - s * 0.9 - Math.cos(a) * s * 1.9; L(c, x + (i - (n - 1) / 2) * s * 0.14, y - s * 0.6, bx, by, s * 0.11, '#c9a66a'); L(c, bx, by, bx + Math.sin(a) * s * 0.34, by - Math.cos(a) * s * 0.34, s * 0.15, '#aab0bc'); L(c, bx + Math.sin(a) * s * 0.4, by - Math.cos(a) * s * 0.4, bx + Math.sin(a) * s * 0.62, by - Math.cos(a) * s * 0.62, s * 0.17, tips[(i + n) % 5]); }
    Rn(c, x - s * 0.5, y - s, s, s, s * 0.14, col); Rn(c, x - s * 0.56, y - s * 1.04, s * 1.12, s * 0.16, s * 0.07, shade(col, 0.25)); Rn(c, x - s * 0.36, y - s * 0.8, s * 0.14, s * 0.62, s * 0.07, 'rgba(255,255,255,0.4)');
  }
  Art.add('backdrop', 'artstudio', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'as'), fl = H * 0.65, wall = mix(p.paper, p.bg2, 0.35), wd = mix('#c69a62', p.bg2, 0.18), pc = [p.accent, p.gold, p.accent2, mix(p.bg, '#3a6ad8', 0.5), '#ffffff', mix(p.accent, p.gold, 0.5)];
    vgrad(c, W, H, [shade(wall, -0.06), wall, shade(wall, 0.2)], 0, fl);
    c.fillStyle = alpha(shade(wall, -0.3), 0.1); for (i = 0; i < 46; i++) { var bw = u * (6 + R0() * 10); c.fillRect(R0() * W, R0() * fl, bw, u * 0.25); c.fillRect(R0() * W, R0() * fl, u * 0.25, bw * 0.5); } /* a painted brick hint */
    /* a slanted row of skylight panes along the top: sky, a cloud going by */
    var sy = H * 0.02, sh = Math.min(H * 0.12, u * 21), n = Math.max(3, Math.round(W / (u * 30))), fr = mix('#5a5f6e', p.ink, 0.4);
    Rn(c, -u, sy - u * 1, W + u * 2, sh + u * 2, 0, fr); var g = c.createLinearGradient(0, sy, 0, sy + sh); g.addColorStop(0, p.bg); g.addColorStop(1, mix(p.bg, '#ffffff', 0.45)); c.fillStyle = g; c.fillRect(0, sy, W, sh);
    c.save(); c.beginPath(); c.rect(0, sy, W, sh); c.clip(); for (i = 0; i < 3; i++) { var cw = u * (18 + i * 5), cx = frac(0.2 + i * 0.37 + t * 0.006 * (1 + i * 0.3)) * (W + cw * 2) - cw; K.cloud(c, cx, sy + sh * (0.45 + i * 0.16), cw, 'rgba(255,255,255,0.9)'); } c.restore();
    for (i = 0; i <= n; i++) Rn(c, i / n * W - u * 0.6, sy, u * 1.2, sh, 0, fr); Rn(c, 0, sy + sh * 0.5 - u * 0.35, W, u * 0.7, 0, fr);
    for (i = 0; i < n; i++) { var lx = (i + 0.5) / n * W, lg = c.createLinearGradient(0, sy + sh, 0, fl); lg.addColorStop(0, 'rgba(255,255,255,0.22)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.beginPath(); c.moveTo(lx - W / n * 0.4, sy + sh + u); c.lineTo(lx + W / n * 0.4, sy + sh + u); c.lineTo(lx + W / n * 0.4 - u * 14, fl); c.lineTo(lx - W / n * 0.4 - u * 14, fl); c.closePath(); c.fill(); }
    /* canvases hung and leaning along the right wall, a shelf of jars on the left */
    for (i = 0; i < 3; i++) { var hx = W - u * (4 + [15, 12, 16][i]), hy = H * [0.17, 0.3, 0.42][i], hw = u * [15, 12, 16][i], hh = u * [12, 15, 11][i]; c.save(); c.translate(hx + hw / 2, hy + hh / 2); c.rotate([-0.03, 0.04, -0.02][i]); Rn(c, -hw / 2 + u * 0.5, -hh / 2 + u * 0.7, hw, hh, 0, 'rgba(60,40,30,0.18)'); Rn(c, -hw / 2, -hh / 2, hw, hh, 0, '#fffdf6');
      if (i === 0) { Rn(c, -hw / 2 + u, -hh / 2 + u, hw - u * 2, hh - u * 2, 0, mix(pc[3], '#ffffff', 0.5)); dot(c, hw * 0.16, -hh * 0.1, hh * 0.2, pc[1]); el(c, 0, hh / 2 - u, hw * 0.6, hh * 0.3, pc[2]); c.fillStyle = '#fffdf6'; c.fillRect(-hw / 2, hh / 2 - u, hw, u); }
      else if (i === 1) { for (j = 0; j < 5; j++) Rn(c, -hw / 2 + u, -hh / 2 + u + j * (hh - u * 2) / 5, hw - u * 2, (hh - u * 2) / 5 + 0.5, 0, pc[j % 4 === 3 ? 5 : j % 4]); dot(c, 0, 0, hw * 0.24, '#fffdf6'); dot(c, 0, 0, hw * 0.14, pc[0]); }
      else { Rn(c, -hw / 2 + u, -hh / 2 + u, hw - u * 2, hh - u * 2, 0, mix(pc[0], '#ffffff', 0.72)); for (j = 0; j < 5; j++) { K.flower(c, -hw * 0.3 + j * hw * 0.15, -hh * 0.05 + (j % 2) * hh * 0.14, u * 1.6, pc[j % 3], '#fff3c4', j); } L(c, -hw * 0.3, hh * 0.3, hw * 0.3, hh * 0.3, u * 0.5, pc[2]); }
      c.restore(); dot(c, hx + hw / 2, hy - u * 0.2, u * 0.5, fr); }
    var shx = u * 2, shw = Math.min(W * 0.24, u * 26), shy = H * 0.3; Rn(c, shx, shy, shw, u * 1.5, u * 0.4, shade(wd, -0.2)); Rn(c, shx, shy + u * 1.5, shw, u * 0.8, 0, 'rgba(60,40,30,0.15)'); Pg(c, [[shx + u * 2, shy + u * 1.5], [shx + u * 3.4, shy + u * 1.5], [shx + u * 2, shy + u * 5]], shade(wd, -0.3), true); Pg(c, [[shx + shw - u * 3.4, shy + u * 1.5], [shx + shw - u * 2, shy + u * 1.5], [shx + shw - u * 2, shy + u * 5]], shade(wd, -0.3), true);
    jar(c, shx + shw * 0.22, shy, u * 5, mix('#8ab8d8', p.bg, 0.3), 4, t); jar(c, shx + shw * 0.55, shy, u * 4.2, mix('#e8b86a', p.bg2, 0.2), 3, t); for (i = 0; i < 3; i++) { Rn(c, shx + shw * 0.74 + i * u * 2.5, shy - u * (3.6 + (i % 2)), u * 2.1, u * (3.6 + (i % 2)), u * 0.5, pc[i]); Rn(c, shx + shw * 0.74 + i * u * 2.5 + u * 0.5, shy - u * (4.6 + (i % 2)), u * 1.1, u * 1.1, u * 0.2, '#f3f3f3'); }
    /* a colour wheel pinned under the shelf */
    var cwx = shx + shw * 0.5, cwy = shy + u * 13, cwr = u * 5.6; for (i = 0; i < 8; i++) { c.beginPath(); c.moveTo(cwx, cwy); c.arc(cwx, cwy, cwr, i / 8 * TAU, (i + 1) / 8 * TAU + 0.02); c.closePath(); c.fillStyle = ['#e8423a', '#f28a3a', '#f2c63a', '#8ac83a', '#3aa88a', '#3a7ad8', '#6a4ac8', '#c84a9a'][i]; c.fill(); } dot(c, cwx, cwy, cwr * 0.36, wall); dot(c, cwx, cwy - cwr - u * 0.3, u * 0.6, p.accent);
    /* floor: pale boards, splashed */
    g = c.createLinearGradient(0, fl, 0, H); g.addColorStop(0, shade(wd, 0.14)); g.addColorStop(1, shade(wd, -0.22)); c.fillStyle = g; c.fillRect(0, fl, W, H - fl); fan(c, W, H, fl, 7, 2.5, Math.max(0.7, u * 0.22), 'rgba(70,40,10,0.24)');
    Rn(c, 0, fl - u * 2.6, W, u * 2.6, 0, shade(wall, -0.16)); Rn(c, 0, fl, W, u * 0.7, 0, shade(wd, 0.36));
    for (i = 0; i < 24; i++) { var sx = R0() * W, sy2 = fl + u * 3 + R0() * (H - fl - u * 4), sr = u * (0.6 + R0() * 2.2), edge = Math.abs(sx / W - 0.5) > 0.22 ? 0.85 : 0.4, col = pc[i % 4]; el(c, sx, sy2, sr * 1.8, sr * 0.6, alpha(col, edge)); for (j = 0; j < 3; j++) el(c, sx + (R0() - 0.5) * sr * 6, sy2 + (R0() - 0.5) * sr * 1.6, sr * 0.4, sr * 0.16, alpha(col, edge)); }
    /* the easel on the left, a work in progress on it */
    var ex = u * 15, eb = fl + u * 8, eh = u * 46, ec = shade(wd, -0.34);
    el(c, ex, eb + u * 0.5, u * 13, u * 2, 'rgba(60,40,30,0.25)'); L(c, ex, eb - eh, ex - u * 9, eb, u * 1.3, ec); L(c, ex, eb - eh, ex + u * 9, eb, u * 1.3, ec); L(c, ex, eb - eh, ex + u * 2, eb - u * 4, u * 1.1, shade(ec, -0.2));
    Rn(c, ex - u * 11, eb - u * 17, u * 22, u * 1.7, u * 0.4, ec); Rn(c, ex - u * 10.6, eb - u * 43, u * 21.2, u * 26, u * 0.3, '#fffdf6'); Rn(c, ex - u * 10.6, eb - u * 43, u * 21.2, u * 26, 0, alpha(mix(pc[3], '#ffffff', 0.6), 0.9));
    c.save(); c.beginPath(); c.rect(ex - u * 10.6, eb - u * 43, u * 21.2, u * 26); c.clip(); dot(c, ex + u * 4.4, eb - u * 35.5, u * 3.6, pc[1]); el(c, ex - u * 4, eb - u * 17, u * 12, u * 7.4, pc[2]); el(c, ex + u * 7, eb - u * 16.4, u * 10, u * 5.4, shade(pc[2], -0.14)); for (i = 0; i < 4; i++) L(c, ex - u * 9 + i * u * 1.2, eb - u * (30 - i * 1.7), ex - u * 2 + i * u * 1.2, eb - u * (31.4 - i * 1.7), u * 1, alpha('#ffffff', 0.8)); c.restore();
    c.lineWidth = u * 0.5; c.strokeStyle = shade(wd, -0.1); c.strokeRect(ex - u * 10.6, eb - u * 43, u * 21.2, u * 26); Rn(c, ex - u * 1.6, eb - u * 45, u * 3.2, u * 2.4, u * 0.4, ec);
    /* the right corner: a stool with a palette, tins of paint */
    var qx = W - u * 15, qb = fl + u * 9;
    el(c, qx, qb + u * 0.5, u * 14, u * 2, 'rgba(60,40,30,0.25)'); L(c, qx - u * 4, qb - u * 13, qx - u * 6, qb, u * 1.1, ec); L(c, qx + u * 4, qb - u * 13, qx + u * 6, qb, u * 1.1, ec); L(c, qx - u * 5, qb - u * 5, qx + u * 5, qb - u * 5, u * 0.8, ec); el(c, qx, qb - u * 13.4, u * 7, u * 1.9, shade(wd, -0.16)); Rn(c, qx - u * 7, qb - u * 13.4, u * 14, u * 1.3, 0, shade(wd, -0.3)); el(c, qx, qb - u * 13.6, u * 7, u * 1.9, shade(wd, -0.1));
    c.save(); c.translate(qx + u * 0.4, qb - u * 15.2); c.rotate(-0.1); el(c, 0, 0, u * 6.4, u * 2.2, '#d9b382'); el(c, u * 3.2, u * 0.3, u * 1, u * 0.5, shade(wd, -0.1)); for (i = 0; i < 5; i++) el(c, -u * 4.4 + i * u * 1.7, -u * 0.5 + Math.abs(i - 2) * u * 0.3, u * 0.8, u * 0.45, ['#e8423a', '#f2c63a', '#3a7ad8', '#3aa86a', '#ffffff'][i]); c.restore();
    for (i = 0; i < 2; i++) { var tx = qx + u * (i ? 10.5 : -11.6), tb = qb + u * (i ? 2.4 : 1.6), ts = u * (i ? 4 : 3.4), tc = pc[i ? 0 : 2]; Rn(c, tx - ts, tb - ts * 1.9, ts * 2, ts * 1.9, ts * 0.2, '#c9cfd8'); Rn(c, tx - ts, tb - ts * 1.25, ts * 2, ts * 0.9, 0, '#fffdf6'); dot(c, tx, tb - ts * 0.8, ts * 0.3, tc); el(c, tx, tb - ts * 1.9, ts, ts * 0.3, tc); c.beginPath(); c.moveTo(tx - ts * 0.6, tb - ts * 1.86); c.quadraticCurveTo(tx - ts * 0.66, tb - ts * 1.1, tx - ts * 0.4, tb - ts * 0.9 - Math.sin(t * 0.8 + i) * ts * 0.06); c.lineWidth = ts * 0.26; c.strokeStyle = tc; c.stroke(); c.beginPath(); c.arc(tx, tb - ts * 1.9, ts * 1.05, PI, 0); c.lineWidth = ts * 0.1; c.strokeStyle = '#8a909c'; c.stroke(); }
    glow(c, W / 2, fl, W * 0.8, '#ffffff', 0.12);
  }, { variants: ['day'], stage: 'cast-low' });

  /* ---------- lab: a school science lab: benches, glassware bubbling, a chart of shapes ---------- */
  function flask(c, x, y, s, liq, t, ph, kind) { /* base centre at (x, y); kind 0 conical, 1 round, 2 beaker, 3 test tube */
    var gl = 'rgba(255,255,255,0.4)', i, lv = 0.5 + 0.05 * Math.sin(t * 1.3 + ph);
    c.save(); c.beginPath();
    if (kind === 0) { c.moveTo(x - s * 0.22, y - s * 1.5); c.lineTo(x - s * 0.22, y - s * 0.95); c.lineTo(x - s * 0.72, y - s * 0.08); c.quadraticCurveTo(x - s * 0.76, y, x - s * 0.62, y); c.lineTo(x + s * 0.62, y); c.quadraticCurveTo(x + s * 0.76, y, x + s * 0.72, y - s * 0.08); c.lineTo(x + s * 0.22, y - s * 0.95); c.lineTo(x + s * 0.22, y - s * 1.5); }
    else if (kind === 1) { c.moveTo(x - s * 0.2, y - s * 1.55); c.lineTo(x - s * 0.2, y - s * 1.05); c.arc(x, y - s * 0.56, s * 0.56, -PI / 2 - 0.36, -PI / 2 + 0.36, true); c.lineTo(x + s * 0.2, y - s * 1.55); }
    else if (kind === 2) { c.rect(x - s * 0.55, y - s * 1.15, s * 1.1, s * 1.15); }
    else { c.moveTo(x - s * 0.17, y - s * 1.5); c.lineTo(x - s * 0.17, y - s * 0.17); c.arc(x, y - s * 0.17, s * 0.17, PI, 0, true); c.lineTo(x + s * 0.17, y - s * 1.5); }
    c.closePath(); c.fillStyle = gl; c.fill(); c.clip();
    c.fillStyle = liq; c.fillRect(x - s, y - s * 1.2 * lv, s * 2, s * 1.3); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x - s, y - s * 1.2 * lv, s * 2, s * 0.07);
    for (i = 0; i < 4; i++) { var f = frac(t * (0.35 + i * 0.09) + ph + i * 0.27); dot(c, x + Math.sin(f * 7 + i * 2 + ph) * s * 0.22, y - f * s * 1.2 * lv, s * (0.05 + 0.05 * (i % 2)), 'rgba(255,255,255,0.75)'); }
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x - s * (kind === 3 ? 0.11 : 0.4), y - s * 1.4, s * 0.09, s * 1.3);
    c.restore();
    if (kind !== 3) Rn(c, x - s * (kind === 2 ? 0.62 : 0.3), y - s * (kind === 2 ? 1.2 : 1.58), s * (kind === 2 ? 1.24 : 0.6), s * 0.1, s * 0.05, 'rgba(255,255,255,0.75)');
  }
  Art.add('backdrop', 'lab', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'lab'), fl = H * 0.66, wall = mix(p.bg, '#ffffff', 0.3), k = Math.exp(-5 * o.beat), ben = mix('#3d4a5c', p.ink, 0.35), liq = [p.accent2, p.accent, p.gold, mix(p.accent, '#7a4ac8', 0.6), mix(p.bg, '#3a8ad8', 0.5)];
    vgrad(c, W, H, [shade(wall, -0.06), wall, shade(wall, 0.14)], 0, fl);
    /* tiled lower wall */
    var ty = H * 0.5, ts = u * 5.2; c.fillStyle = mix(p.paper, wall, 0.3); c.fillRect(0, ty, W, fl - ty); c.strokeStyle = alpha(shade(wall, -0.35), 0.3); c.lineWidth = Math.max(0.6, u * 0.16); c.beginPath(); for (i = 0; i * ts < W; i++) { c.moveTo(i * ts, ty); c.lineTo(i * ts, fl); } for (j = 0; ty + j * ts < fl; j++) { c.moveTo(0, ty + j * ts); c.lineTo(W, ty + j * ts); } c.stroke(); Rn(c, 0, ty - u * 0.8, W, u * 1.4, 0, p.accent2);
    /* a window on the left, day outside; a chart of shapes on the right (no letters) */
    var wx = u * 4, wy = H * 0.07, ww = Math.min(W * 0.27, u * 28), wh = Math.min(H * 0.2, u * 34), fr = '#f6f7fa';
    Rn(c, wx - u * 1.2, wy - u * 1.2, ww + u * 2.4, wh + u * 2.4, u * 0.8, fr); var g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, mix(p.bg, '#6ab8f2', 0.6)); g.addColorStop(1, '#e8f6ff'); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
    c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip(); dot(c, wx + ww * 0.76, wy + wh * 0.24, u * 3.4, '#ffe27a'); K.cloud(c, wx + frac(t * 0.008 + 0.2) * (ww + u * 24) - u * 12, wy + wh * 0.36, u * 12, 'rgba(255,255,255,0.95)'); el(c, wx + ww * 0.3, wy + wh * 1.04, ww * 0.7, wh * 0.26, '#7ac87a'); el(c, wx + ww * 0.95, wy + wh * 1.05, ww * 0.6, wh * 0.32, '#5ab06a'); tree(c, wx + ww * 0.72, wy + wh * 0.94, wh * 0.5, '#3f9f5a', '#6a4a30', t, 1); c.restore();
    Rn(c, wx + ww / 2 - u * 0.4, wy, u * 0.8, wh, 0, fr); Rn(c, wx, wy + wh / 2 - u * 0.4, ww, u * 0.8, 0, fr); Rn(c, wx - u * 2.2, wy + wh + u * 0.8, ww + u * 4.4, u * 1.4, u * 0.5, shade(fr, -0.1));
    var px = W - u * 4 - ww, pw = ww, phh = wh * 0.92, cs = pw / 6.4;
    Rn(c, px - u * 0.4, wy - u * 0.9, pw + u * 0.8, u * 1.5, u * 0.5, shade(ben, 0.2)); Rn(c, px, wy, pw, phh, 0, p.paper); Rn(c, px - u * 0.4, wy + phh - u * 0.4, pw + u * 0.8, u * 1.5, u * 0.5, shade(ben, 0.2));
    for (j = 0; j < 4; j++) for (i = 0; i < 6; i++) { if ((j === 0 && i > 0 && i < 5) || (j === 1 && (i === 2 || i === 3))) continue; var cc = [p.accent, p.gold, p.accent2, liq[4], liq[3]][(i + j * 2) % 5]; Rn(c, px + cs * 0.2 + i * cs + cs * 0.06, wy + cs * 0.3 + j * cs * 0.92, cs * 0.86, cs * 0.8, cs * 0.12, mix(cc, p.paper, 0.35)); dot(c, px + cs * 0.2 + i * cs + cs * 0.49, wy + cs * 0.3 + j * cs * 0.92 + cs * 0.4, cs * 0.16, cc); }
    for (i = 0; i < 3; i++) { var ax = px + pw * (0.3 + i * 0.2), ay = wy + cs * 0.9; c.save(); c.translate(ax, ay); dot(c, 0, 0, cs * 0.14, p.accent); for (j = 0; j < 2; j++) { c.rotate(PI / 3 + j * 0.5); c.beginPath(); c.ellipse(0, 0, cs * 0.44, cs * 0.17, 0, 0, TAU); c.lineWidth = Math.max(0.5, cs * 0.05); c.strokeStyle = alpha(p.ink, 0.6); c.stroke(); } c.restore(); if (i < 2) break; }
    /* an orbiting model hung from the ceiling, top centre, small and pale */
    var ox = W / 2, oy = H * 0.05; L(c, ox, 0, ox, oy, u * 0.25, alpha(p.ink, 0.4)); dot(c, ox, oy, u * 1.7, p.gold); for (i = 0; i < 3; i++) { var orr = u * (4.4 + i * 3), oa = t * (0.5 - i * 0.12) + i * 2; c.beginPath(); c.ellipse(ox, oy, orr, orr * 0.3, 0, 0, TAU); c.lineWidth = u * 0.18; c.strokeStyle = alpha(p.ink, 0.25); c.stroke(); dot(c, ox + Math.cos(oa) * orr, oy + Math.sin(oa) * orr * 0.3, u * (0.8 + (i % 2) * 0.4), liq[i + 1]); }
    /* floor: speckled lino */
    g = c.createLinearGradient(0, fl, 0, H); g.addColorStop(0, mix('#c9d2dc', p.bg2, 0.3)); g.addColorStop(1, shade(mix('#c9d2dc', p.bg2, 0.3), -0.25)); c.fillStyle = g; c.fillRect(0, fl, W, H - fl);
    var rows = 6, vy = fl - (H - fl) * 0.8, tw = W * 0.2; for (i = 0; i < rows; i++) { var y1 = fl + (H - fl) * Math.pow(i / rows, 1.45), y2 = fl + (H - fl) * Math.pow((i + 1) / rows, 1.45), s1 = (y1 - vy) / (H - vy), s2 = (y2 - vy) / (H - vy); for (j = -5; j < 5; j++) if ((i + j) & 1) quad(c, W / 2 + j * tw * s1, y1, W / 2 + (j + 1) * tw * s1, y1, W / 2 + (j + 1) * tw * s2, y2, W / 2 + j * tw * s2, y2, alpha(p.accent2, 0.14)); }
    Rn(c, 0, fl - u * 1.8, W, u * 1.8, 0, shade(wall, -0.3));
    /* two benches at the sides with their experiments */
    for (var s = 0; s < 2; s++) { var bw = Math.min(W * 0.31, u * 33), bx = s ? W - bw : 0, bt = fl - u * 13, d = s ? -1 : 1;
      Rn(c, bx + (s ? u * 2 : 0), bt + u * 2, bw - u * 2, fl + u * 4 - bt - u * 2, 0, mix(p.paper, wall, 0.5)); Rn(c, bx + (s ? u * 4 : u * 2), bt + u * 4.4, bw - u * 6, u * 5, u * 0.5, shade(mix(p.paper, wall, 0.5), -0.08)); Rn(c, bx + bw / 2 - u * 2, bt + u * 6.4, u * 4, u * 0.9, u * 0.4, '#aab0bc'); Rn(c, bx + (s ? u * 4 : u * 2), bt + u * 10.6, bw - u * 6, u * 5.4, u * 0.5, shade(mix(p.paper, wall, 0.5), -0.08));
      Rn(c, bx - u, bt, bw + u * 2, u * 2.2, u * 0.5, ben); Rn(c, bx - u, bt, bw + u * 2, u * 0.6, u * 0.3, shade(ben, 0.3)); el(c, bx + bw / 2, fl + u * 4.4, bw * 0.55, u * 1.3, 'rgba(20,30,50,0.16)');
      if (!s) { /* a burner under a round flask, a rack of tubes */
        var fx = u * 9; Rn(c, fx - u * 3, bt - u * 1, u * 6, u * 1, u * 0.3, '#5a6270'); Rn(c, fx - u * 0.8, bt - u * 4.4, u * 1.6, u * 3.6, u * 0.3, '#8a909c'); K.flame(c, fx, bt - u * 4.4, u * 2, u * 3.4 + k * u * 0.6, t, 1); glow(c, fx, bt - u * 6, u * 8, '#7ab8ff', 0.25);
        L(c, fx - u * 5, bt, fx - u * 4, bt - u * 8.6, u * 0.4, '#5a6270'); L(c, fx + u * 5, bt, fx + u * 4, bt - u * 8.6, u * 0.4, '#5a6270'); L(c, fx - u * 4.6, bt - u * 8.6, fx + u * 4.6, bt - u * 8.6, u * 0.5, '#5a6270'); flask(c, fx, bt - u * 8.8, u * 6.4, alpha(liq[0], 0.85), t, 0.2, 1); K.steam(c, fx, bt - u * 19.4, u * 5, t, 2);
        var rx = u * 22; Rn(c, rx - u * 5.4, bt - u * 6.2, u * 10.8, u * 1, u * 0.3, shade('#c69a62', -0.1)); for (i = 0; i < 4; i++) flask(c, rx - u * 3.9 + i * u * 2.6, bt - u * 0.8, u * 5.8, alpha(liq[(i + 1) % 5], 0.85), t, i * 0.3, 3); Rn(c, rx - u * 5.4, bt - u * 1.2, u * 10.8, u * 1.2, u * 0.3, '#c69a62'); L(c, rx - u * 5, bt - u * 6, rx - u * 5, bt, u * 0.5, shade('#c69a62', -0.2)); L(c, rx + u * 5, bt - u * 6, rx + u * 5, bt, u * 0.5, shade('#c69a62', -0.2));
      } else { /* a microscope, a beaker and a conical flask fizzing over */
        var mx = W - u * 9, mc = mix('#4a5568', p.ink, 0.3); Rn(c, mx - u * 4.6, bt - u * 1.3, u * 9.2, u * 1.3, u * 0.5, mc); c.beginPath(); c.moveTo(mx + u * 3, bt - u * 1.2); c.quadraticCurveTo(mx + u * 5.6, bt - u * 9, mx - u * 0.6, bt - u * 12.6); c.lineWidth = u * 1.5; c.strokeStyle = mc; c.stroke(); Rn(c, mx - u * 3.6, bt - u * 5, u * 6, u * 0.8, u * 0.3, mc);
        c.save(); c.translate(mx - u * 0.8, bt - u * 11); c.rotate(-0.42); Rn(c, -u * 1.2, -u * 6, u * 2.4, u * 9, u * 0.6, '#dfe4ec'); Rn(c, -u * 1.5, -u * 7.2, u * 3, u * 1.6, u * 0.5, mc); Rn(c, -u * 0.8, u * 3, u * 1.6, u * 1.6, u * 0.3, mc); c.restore(); dot(c, mx + u * 3.6, bt - u * 7.4, u * 1.2, p.gold);
        flask(c, W - u * 19.5, bt, u * 5.6, alpha(liq[4], 0.8), t, 0.5, 2); flask(c, W - u * 27.5, bt, u * 6.6, alpha(liq[1], 0.85), t, 0.8, 0);
        for (i = 0; i < 6; i++) { var bf = frac(t * 0.22 + i / 6); dot(c, W - u * 27.5 + Math.sin(bf * 6 + i * 2) * u * (1 + bf * 3), bt - u * 10 - bf * u * 14, u * (0.5 + bf * 1.3), alpha(mix(liq[1], '#ffffff', 0.5), 0.75 * (1 - bf))); }
      } }
    /* near corners: a stool each side */
    for (s = 0; s < 2; s++) { var qx = s ? W - u * 10 : u * 10, qb = H - u * 3; el(c, qx, qb + u * 0.4, u * 8, u * 1.5, 'rgba(20,30,50,0.2)'); L(c, qx - u * 3.4, qb - u * 12, qx - u * 5.4, qb, u * 0.9, '#8a909c'); L(c, qx + u * 3.4, qb - u * 12, qx + u * 5.4, qb, u * 0.9, '#8a909c'); ring(c, qx, qb - u * 4.4, 0.1, 0, '#000'); L(c, qx - u * 4.6, qb - u * 4.4, qx + u * 4.6, qb - u * 4.4, u * 0.7, '#8a909c'); el(c, qx, qb - u * 12, u * 6.4, u * 1.9, shade(p.accent, -0.2)); el(c, qx, qb - u * 12.6, u * 6.4, u * 1.9, p.accent); el(c, qx - u * 1.6, qb - u * 13, u * 3, u * 0.7, 'rgba(255,255,255,0.25)'); }
    glow(c, wx + ww / 2, wy + wh, u * 40, '#ffffff', 0.14);
  }, { variants: ['day'], stage: 'cast-low' });

  /* ---------- busstop: the school bus stop on an autumn morning ---------- */
  function leafPile(c, x, y, s, cols, seed) { var R0 = rnd(seed), i; el(c, x, y, s * 1.5, s * 0.36, 'rgba(40,20,10,0.2)'); for (i = 0; i < 16; i++) { var a = R0() * PI, r = R0() * s; K.leaf(c, x + Math.cos(a) * r * 1.3 - s * 0.2, y - Math.sin(a) * r * 0.6, s * (0.38 + R0() * 0.2), R0() * 6.3, cols[i % cols.length]); } }
  Art.add('backdrop', 'busstop', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'bs'), hz = H * 0.6, walk = H * 0.665, road = H * 0.845, aut = [mix('#e8792a', p.accent, 0.25), mix('#d8a02a', p.gold, 0.4), mix('#c8442a', p.accent, 0.3), mix('#e8b83a', p.gold, 0.3)], gr = mix('#8aa84a', p.accent2, 0.4), trunk = mix('#5a3a28', p.ink, 0.3);
    vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.6), p.bg2, mix(p.bg2, '#ffd9a0', 0.6)], 0, hz);
    var sx = W * 0.22, sy = hz - u * 7; glow(c, sx, sy, u * 46, '#fff0c0', 0.6); dot(c, sx, sy, u * 6, '#fff3c8'); /* a low early sun */
    for (i = 0; i < 4; i++) { var cw = u * (16 + R0() * 14), cx = frac(R0() + t * 0.005 * (1 + i * 0.3)) * (W + cw * 2) - cw; K.cloud(c, cx, H * (0.08 + R0() * 0.22), cw, alpha(mix('#ffffff', '#ffe2c0', 0.4), 0.85)); }
    for (i = 0; i < 5; i++) { var bf = frac(t * 0.02 + i * 0.07), bx = W * (0.5 + i * 0.045) - bf * W * 0.3, by = H * (0.2 - (i % 2) * 0.012 + Math.abs(i - 2) * 0.012), fl2 = Math.sin(t * 6 + i) * u * 0.5; c.beginPath(); c.moveTo(bx - u * 1.1, by - fl2); c.quadraticCurveTo(bx - u * 0.5, by - u * 0.3, bx, by + u * 0.2); c.quadraticCurveTo(bx + u * 0.5, by - u * 0.3, bx + u * 1.1, by - fl2); c.lineWidth = u * 0.28; c.strokeStyle = alpha(p.ink, 0.6); c.stroke(); } /* geese heading south */
    K.hill(c, W, H, hz - u * 6, u * 3, mix(mix(aut[1], p.bg2, 0.55), '#ffffff', 0.15), o.seed + 'a', 0.7);
    /* the far side of the street: houses between trees, a hedge */
    for (i = 0; i < 4; i++) { var hx = W * [0.02, 0.3, 0.56, 0.82][i], hw = u * [15, 13, 14, 16][i], hh = u * [9, 8, 10, 8.4][i], hc = mix([p.paper, mix(p.accent, p.paper, 0.6), mix(p.bg, p.paper, 0.6), p.paper][i], p.bg2, 0.2);
      Rn(c, hx, hz - hh, hw, hh + u, 0, hc); Pg(c, [[hx - u, hz - hh], [hx + hw / 2, hz - hh - hw * 0.34], [hx + hw + u, hz - hh]], mix([p.accent, p.ink, p.accent2, p.accent][i], '#6a4a40', 0.5), true); Rn(c, hx + hw * 0.7, hz - hh - hw * 0.3, hw * 0.1, hw * 0.2, 0, mix(p.ink, '#6a4a40', 0.5));
      Rn(c, hx + hw * 0.42, hz - hh * 0.55, hw * 0.16, hh * 0.55 + u, 0, mix(p.accent, '#6a4a40', 0.4)); Rn(c, hx + hw * 0.12, hz - hh * 0.7, hw * 0.2, hh * 0.34, 0, i % 2 ? '#ffe9a8' : '#dff0fa'); Rn(c, hx + hw * 0.68, hz - hh * 0.7, hw * 0.2, hh * 0.34, 0, i % 2 ? '#dff0fa' : '#ffe9a8'); if (i === 1) K.smoke(c, hx + hw * 0.75, hz - hh - hw * 0.32, u * 2.4, t); }
    for (i = 0; i < 7; i++) { var tx = W * (0.08 + i * 0.145 + (R0() - 0.5) * 0.04); tree(c, tx, hz + u * 1, u * (20 + R0() * 9), aut[i % 4], trunk, t, i); }
    c.fillStyle = mix(gr, p.bg2, 0.2); c.beginPath(); c.moveTo(0, walk); for (i = 0; i <= 40; i++) c.lineTo(i / 40 * W, hz + u * (0.6 + 0.9 * Math.abs(Math.sin(i * 1.3)))); c.lineTo(W, walk); c.closePath(); c.fill();
    /* the bus comes along the far road, once in a while */
    var ff = frac(t * 0.03 + 0.42), busx = W * 1.25 - ff * W * 1.7, busy = hz + u * 4.8, bs = u * 1.5, by2 = busy + Math.abs(Math.sin(t * 7)) * bs * 0.12, yel = mix('#f6b81a', p.gold, 0.35);
    Rn(c, 0, hz + u * 2.4, W, u * 3.2, 0, mix('#7a7f8c', p.bg, 0.25)); el(c, busx, busy + bs * 0.3, bs * 9, bs * 0.7, 'rgba(20,20,40,0.25)');
    Rn(c, busx - bs * 8, by2 - bs * 6.2, bs * 14, bs * 5.6, bs * 0.9, yel); Rn(c, busx - bs * 10.4, by2 - bs * 3.6, bs * 3.4, bs * 3, bs * 0.6, yel); Rn(c, busx - bs * 8, by2 - bs * 2.5, bs * 14, bs * 0.45, 0, mix(p.ink, '#1a1a22', 0.5)); Rn(c, busx - bs * 10.6, by2 - bs * 1, bs * 1, bs * 0.6, bs * 0.2, '#c9cfd8');
    for (i = 0; i < 5; i++) Rn(c, busx - bs * 7.3 + i * bs * 2.55, by2 - bs * 5.5, bs * 2.05, bs * 2.2, bs * 0.3, i === 0 ? '#bfe4f5' : '#dff2fb'); for (i = 1; i < 4; i++) dot(c, busx - bs * 6.2 + i * bs * 2.55, by2 - bs * 3.9, bs * 0.62, [SKN[1], SKN[3], SKN[0], SKN[2]][i]);
    dot(c, busx - bs * 10.2, by2 - bs * 2.2, bs * 0.4, '#fff6c0'); dot(c, busx + bs * 5.9, by2 - bs * 5.9, bs * 0.34, Math.sin(t * 5) > 0 ? '#ff5a4a' : '#8a2a22'); K.wheel(c, busx - bs * 6.4, busy - bs * 0.5, bs * 1.25, '#c9cfd8'); K.wheel(c, busx + bs * 3.4, busy - bs * 0.5, bs * 1.25, '#c9cfd8');
    /* a picket fence, then the pavement and the kerb */
    var fy = walk - u * 0.4, fp = mix(p.paper, p.bg2, 0.12); Rn(c, 0, fy - u * 4.4, W, u * 0.8, 0, shade(fp, -0.1)); Rn(c, 0, fy - u * 2, W, u * 0.8, 0, shade(fp, -0.1)); c.fillStyle = fp; c.beginPath(); for (i = 0; i * u * 2.6 < W + u * 3; i++) { var px = i * u * 2.6 - u * 0.4; c.moveTo(px, fy); c.lineTo(px, fy - u * 5.6); c.lineTo(px + u * 0.85, fy - u * 6.8); c.lineTo(px + u * 1.7, fy - u * 5.6); c.lineTo(px + u * 1.7, fy); c.closePath(); } c.fill();
    var pv = mix('#d8cdb8', p.bg2, 0.3), g = c.createLinearGradient(0, walk, 0, road); g.addColorStop(0, shade(pv, 0.06)); g.addColorStop(1, shade(pv, -0.14)); c.fillStyle = g; c.fillRect(0, walk, W, road - walk);
    c.strokeStyle = 'rgba(60,40,30,0.18)'; c.lineWidth = Math.max(0.7, u * 0.2); c.beginPath(); for (i = -6; i <= 6; i++) { c.moveTo(W / 2 + i * W * 0.13, walk); c.lineTo(W / 2 + i * W * 0.19, road); } c.moveTo(0, walk + (road - walk) * 0.42); c.lineTo(W, walk + (road - walk) * 0.42); c.stroke();
    Rn(c, 0, road - u * 0.4, W, u * 2, 0, shade(pv, 0.2)); Rn(c, 0, road + u * 1.6, W, u * 0.8, 0, 'rgba(30,20,30,0.3)');
    var rd = mix('#5c606e', p.bg, 0.2); g = c.createLinearGradient(0, road, 0, H); g.addColorStop(0, rd); g.addColorStop(1, shade(rd, -0.3)); c.fillStyle = g; c.fillRect(0, road + u * 1.6, W, H - road);
    c.fillStyle = alpha(yel, 0.85); for (i = 0; i * u * 16 < W; i++) c.fillRect(i * u * 16 + u * 2, H - (H - road) * 0.34, u * 9, u * 1);
    /* the stop: a shelter with a bench on the left, the sign on its pole on the right */
    var shx = u * 1.5, shw = u * 22, shb = walk + u * 5.5, mt = mix('#4a5a6c', p.ink, 0.3);
    el(c, shx + shw / 2, shb + u * 0.6, shw * 0.6, u * 1.6, 'rgba(40,20,10,0.2)'); Rn(c, shx + u * 1, shb - u * 25, u * 1, u * 25, 0, mt); Rn(c, shx + shw - u * 2, shb - u * 25, u * 1, u * 25, 0, mt); Rn(c, shx + u * 2, shb - u * 23, shw - u * 4, u * 14, 0, 'rgba(220,240,255,0.3)'); quad(c, shx + u * 4, shb - u * 23, shx + u * 8, shb - u * 23, shx + u * 4, shb - u * 9, shx + u * 2, shb - u * 9, 'rgba(255,255,255,0.22)');
    quad(c, shx - u * 1.5, shb - u * 25, shx + shw + u * 2.5, shb - u * 26.6, shx + shw + u * 2.5, shb - u * 28.4, shx - u * 1.5, shb - u * 27, mix(p.accent, '#6a4a40', 0.15)); Rn(c, shx + u * 2.4, shb - u * 7, shw - u * 4.8, u * 1.5, u * 0.5, mix('#a8693a', p.bg2, 0.15)); Rn(c, shx + u * 2.4, shb - u * 11.6, shw - u * 4.8, u * 1.3, u * 0.5, mix('#a8693a', p.bg2, 0.15)); Rn(c, shx + u * 4, shb - u * 6, u * 0.9, u * 6, 0, mt); Rn(c, shx + shw - u * 5, shb - u * 6, u * 0.9, u * 6, 0, mt);
    c.save(); c.translate(shx + shw * 0.66, shb - u * 7); Rn(c, -u * 3, -u * 6.4, u * 6, u * 6.4, u * 1.6, p.accent2); Rn(c, -u * 2, -u * 3.6, u * 4, u * 2.6, u * 0.8, shade(p.accent2, -0.18)); c.beginPath(); c.arc(0, -u * 6.2, u * 1.9, PI, 0); c.lineWidth = u * 0.7; c.strokeStyle = shade(p.accent2, -0.25); c.stroke(); c.restore(); /* a satchel left on the bench */
    var px2 = W - u * 9, pb = walk + u * 6.5; el(c, px2, pb + u * 0.4, u * 4.6, u * 1.1, 'rgba(40,20,10,0.22)'); Rn(c, px2 - u * 0.55, pb - u * 33, u * 1.1, u * 33, 0, '#9aa2b0'); Rn(c, px2 - u * 0.55, pb - u * 33, u * 0.4, u * 33, 0, '#c9cfd8');
    c.save(); c.translate(px2, pb - u * 33); Rn(c, -u * 5.4, -u * 9.4, u * 10.8, u * 10.8, u * 1.8, shade(yel, -0.3)); Rn(c, -u * 4.8, -u * 8.8, u * 9.6, u * 9.6, u * 1.4, yel); Rn(c, -u * 3.3, -u * 6.6, u * 6.6, u * 4, u * 0.8, mix(p.ink, '#1a1a22', 0.5)); for (i = 0; i < 3; i++) Rn(c, -u * 2.7 + i * u * 2, -u * 6, u * 1.4, u * 1.5, u * 0.2, yel); dot(c, -u * 1.9, -u * 2.2, u * 0.9, mix(p.ink, '#1a1a22', 0.5)); dot(c, u * 1.9, -u * 2.2, u * 0.9, mix(p.ink, '#1a1a22', 0.5)); c.restore();
    /* leaves: in piles at the kerb, and coming down */
    leafPile(c, W * 0.36, road - u * 0.2, u * 5, aut, o.seed + 'l1'); leafPile(c, W * 0.74, road + u * 0.2, u * 6.4, aut, o.seed + 'l2'); leafPile(c, u * 7, H - u * 5, u * 8, aut, o.seed + 'l3'); leafPile(c, W - u * 9, H - u * 4, u * 9, aut, o.seed + 'l4');
    for (i = 0; i < 12; i++) K.leaf(c, R0() * W, walk + u * 2 + R0() * (road - walk - u * 3), u * 1.9, R0() * 6.3, alpha(aut[i % 4], 0.9));
    for (i = 0; i < 12; i++) { var lf = frac(R0() + t * (0.03 + R0() * 0.03)), lx = (R0() < 0.5 ? R0() * 0.28 : 0.72 + R0() * 0.28) * W + Math.sin(t * 0.9 + i * 2) * u * 4; K.leaf(c, lx, lf * H * 0.86, u * (1.5 + R0() * 1.2), t * (0.8 + R0()) + i, aut[i % 4]); }
    var lg = c.createLinearGradient(0, 0, W, H * 0.7); lg.addColorStop(0, 'rgba(255,236,190,0.2)'); lg.addColorStop(1, 'rgba(255,236,190,0)'); c.fillStyle = lg; c.fillRect(0, 0, W, H);
  }, { variants: ['morning'], stage: 'band-low' });
  var SKN = ['#f6cfa8', '#e3ac7c', '#b9774a', '#7c4a2d'];

  /* ---------- gradlawn: the lawn on graduation day: chairs, a little stage, caps in the air ---------- */
  function cap(c, x, y, s, rot, col, tas) { c.save(); c.translate(x, y); c.rotate(rot); Pg(c, [[-s * 0.55, s * 0.1], [s * 0.55, s * 0.1], [s * 0.5, s * 0.62], [-s * 0.5, s * 0.62]], shade(col, -0.2), true); Pg(c, [[0, -s * 0.42], [s, 0], [0, s * 0.42], [-s, 0]], col, true); Pg(c, [[0, -s * 0.42], [s, 0], [0, -s * 0.06], [-s, 0]], shade(col, 0.16), true); dot(c, 0, 0, s * 0.09, tas); L(c, 0, 0, s * 0.72, s * 0.12, s * 0.06, tas); L(c, s * 0.72, s * 0.12, s * 0.78, s * 0.7, s * 0.06, tas); Rn(c, s * 0.7, s * 0.62, s * 0.16, s * 0.34, s * 0.05, tas); c.restore(); }
  function chairBack(c, x, y, s, col) { /* a folding chair seen from behind, feet at (x, y) */
    el(c, x, y, s * 0.6, s * 0.1, 'rgba(20,40,20,0.2)'); L(c, x - s * 0.36, y - s * 0.62, x - s * 0.44, y, s * 0.07, shade(col, -0.25)); L(c, x + s * 0.36, y - s * 0.62, x + s * 0.44, y, s * 0.07, shade(col, -0.25)); L(c, x - s * 0.4, y - s * 0.3, x + s * 0.4, y - s * 0.3, s * 0.05, shade(col, -0.25));
    Rn(c, x - s * 0.46, y - s * 0.66, s * 0.92, s * 0.13, s * 0.04, shade(col, -0.12)); L(c, x - s * 0.36, y - s * 0.62, x - s * 0.36, y - s * 1.3, s * 0.07, shade(col, -0.2)); L(c, x + s * 0.36, y - s * 0.62, x + s * 0.36, y - s * 1.3, s * 0.07, shade(col, -0.2)); Rn(c, x - s * 0.42, y - s * 1.36, s * 0.84, s * 0.4, s * 0.1, col); Rn(c, x - s * 0.34, y - s * 1.3, s * 0.68, s * 0.1, s * 0.05, shade(col, 0.2));
  }
  Art.add('backdrop', 'gradlawn', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'gl'), dusk = o.variant === 'dusk', hz = H * 0.6, k = Math.exp(-5 * o.beat), gr = dusk ? mix(mix('#3f8a5a', p.accent2, 0.4), p.bg, 0.4) : mix('#6abf5a', p.accent2, 0.45), stone = dusk ? mix('#c9b8a8', p.bg2, 0.5) : mix('#f3e9d8', p.bg2, 0.25), lit = '#ffe08a';
    if (dusk) { vgrad(c, W, H, [shade(p.bg, -0.2), p.bg, p.bg2, mix(p.bg2, '#ff9a6a', 0.55), '#ffd09a'], 0, hz); K.skyStars(c, W, H, 46, o.seed, t, H * 0.34); glow(c, W * 0.5, hz, W * 0.8, '#ffb07a', 0.3); }
    else { vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.7), shade(p.bg2, 0.3)], 0, hz); glow(c, W * 0.84, H * 0.09, u * 30, '#fff6c8', 0.6); dot(c, W * 0.84, H * 0.09, u * 6, '#ffe27a'); for (i = 0; i < 4; i++) { var cw = u * (16 + R0() * 14), cx = frac(R0() + t * 0.005 * (1 + i * 0.3)) * (W + cw * 2) - cw; K.cloud(c, cx, H * (0.06 + R0() * 0.2), cw, 'rgba(255,255,255,0.92)'); } }
    /* the old hall behind: a pediment, columns, a cupola with a flag */
    var bw = Math.min(W * 0.8, u * 84), bx = W / 2 - bw / 2, bh = u * 17, by = hz - bh, roof = mix(dusk ? '#4a4a6a' : '#7a8a9a', p.bg, 0.3);
    Rn(c, bx - u * 9, by + u * 4, bw + u * 18, bh - u * 4 + 2, 0, shade(stone, -0.1)); for (i = 0; i < 12; i++) { var wx = bx - u * 7 + (i < 6 ? i * u * 3 : bw + u * 14 - (i - 5) * u * 3) - (i < 6 ? 0 : 0); if (i >= 3 && i < 9) continue; Rn(c, wx, by + u * 7, u * 1.7, u * 4.4, u * 0.85, dusk ? alpha(lit, 0.85) : mix('#8ab8d8', p.bg, 0.3)); }
    Rn(c, bx, by, bw, bh + 2, 0, stone); Pg(c, [[bx - u * 2, by], [W / 2, by - u * 9], [bx + bw + u * 2, by]], shade(stone, 0.1), true); Pg(c, [[bx + u * 5, by - u * 0.8], [W / 2, by - u * 6.6], [bx + bw - u * 5, by - u * 0.8]], shade(stone, -0.08), true); dot(c, W / 2, by - u * 3, u * 1.5, shade(stone, 0.14));
    var nc = Math.max(6, Math.round(bw / (u * 8))); for (i = 0; i <= nc; i++) { var colx = bx + u * 2 + i / nc * (bw - u * 4); Rn(c, colx - u * 1, by + u * 1.6, u * 2, bh - u * 2.4, 0, shade(stone, 0.16)); Rn(c, colx - u * 1, by + u * 1.6, u * 0.6, bh - u * 2.4, 0, shade(stone, 0.26)); Rn(c, colx - u * 1.5, by + u * 1, u * 3, u * 0.9, 0, shade(stone, 0.2)); if (i < nc) Rn(c, colx + u * 1.6, by + u * 4, (bw - u * 4) / nc - u * 3.2, bh - u * 4, u * 1.2, dusk ? alpha(lit, 0.5 + 0.1 * Math.sin(t * 2 + i)) : shade(stone, -0.2)); }
    Rn(c, bx - u * 1, by - u * 0.4, bw + u * 2, u * 1.6, 0, shade(stone, 0.2)); Rn(c, bx - u * 3, hz - u * 1.6, bw + u * 6, u * 1.8, 0, shade(stone, -0.06));
    Rn(c, W / 2 - u * 3, by - u * 15, u * 6, u * 7, 0, stone); Rn(c, W / 2 - u * 1.1, by - u * 13.6, u * 2.2, u * 3.6, u * 1.1, dusk ? lit : shade(stone, -0.25)); c.beginPath(); c.arc(W / 2, by - u * 15, u * 3.6, PI, 0); c.fillStyle = roof; c.fill(); L(c, W / 2, by - u * 18.4, W / 2, by - u * 24, u * 0.35, shade(roof, -0.2)); Pg(c, [[W / 2, by - u * 24], [W / 2 + u * 4 + Math.sin(t * 2) * u * 0.4, by - u * 23 + Math.sin(t * 2.6) * u * 0.3], [W / 2, by - u * 21.6]], p.accent, true);
    /* trees at the sides, the lawn in mown stripes */
    var tc = dusk ? mix('#2f6e4a', p.bg, 0.4) : mix('#3f9f5a', p.accent2, 0.35), tk = mix('#5a3a28', p.bg, dusk ? 0.3 : 0);
    tree(c, W * 0.06, hz + u * 3, u * 38, tc, tk, t, 0); tree(c, W * 0.95, hz + u * 2, u * 42, shade(tc, -0.08), tk, t, 2); tree(c, W * 0.2, hz + u * 0.6, u * 21, shade(tc, 0.1), tk, t, 4); tree(c, W * 0.82, hz + u * 0.6, u * 19, shade(tc, 0.06), tk, t, 5);
    var g = c.createLinearGradient(0, hz, 0, H); g.addColorStop(0, shade(gr, 0.2)); g.addColorStop(1, shade(gr, -0.2)); c.fillStyle = g; c.fillRect(0, hz, W, H - hz);
    for (i = -7; i < 7; i += 2) quad(c, W / 2 + i * W * 0.07, hz, W / 2 + (i + 1) * W * 0.07, hz, W / 2 + (i + 1) * W * 0.24, H, W / 2 + i * W * 0.24, H, alpha(shade(gr, 0.5), 0.14));
    /* the stage: steps, a lectern, drapes and a swag in the school's colours */
    var sw = Math.min(W * 0.56, u * 58), sx = W / 2 - sw / 2, st = hz + u * 2.2, dk = mix('#b98a5a', p.bg2, 0.2);
    el(c, W / 2, st + u * 5.4, sw * 0.56, u * 1.6, 'rgba(20,40,20,0.22)'); Rn(c, sx, st, sw, u * 5, 0, shade(dk, -0.2)); for (i = 0; i < 9; i++) Rn(c, sx + i / 9 * sw + u * 0.3, st + u * 1.3, sw / 9 - u * 0.6, u * 3.4, 0, i % 2 ? p.accent : shade(p.accent, -0.14)); Rn(c, sx - u * 0.8, st - u * 0.6, sw + u * 1.6, u * 1.6, u * 0.4, shade(dk, 0.12));
    for (i = 0; i < 2; i++) { var pxp = i ? sx + sw - u * 1 : sx + u * 1; Rn(c, pxp - u * 0.5, st - u * 19, u * 1, u * 19, 0, shade(dk, -0.3)); c.beginPath(); c.moveTo(pxp - (i ? u * 5 : -u * 5), st - u * 18.6); c.lineTo(pxp, st - u * 18.6); c.lineTo(pxp, st - u * 1); c.quadraticCurveTo(pxp + (i ? -u * 4 : u * 4), st - u * 9, pxp + (i ? -u * 5 : u * 5), st - u * 18.6); c.closePath(); c.fillStyle = p.accent; c.fill(); Rn(c, pxp + (i ? -u * 2.8 : u * 0.6), st - u * 9, u * 2.2, u * 0.9, u * 0.4, p.gold); }
    for (i = 0; i < 4; i++) { var sa = sx + u * 1 + i / 4 * (sw - u * 2), sb = sa + (sw - u * 2) / 4; c.beginPath(); c.moveTo(sa, st - u * 19); c.quadraticCurveTo((sa + sb) / 2, st - u * 13.4, sb, st - u * 19); c.closePath(); c.fillStyle = i % 2 ? p.gold : p.accent; c.fill(); }
    Rn(c, sx, st - u * 19.6, sw, u * 1.2, u * 0.5, shade(dk, -0.3));
    Pg(c, [[W / 2 - u * 2.6, st - u * 0.6], [W / 2 + u * 2.6, st - u * 0.6], [W / 2 + u * 2, st - u * 7], [W / 2 - u * 2, st - u * 7]], shade(dk, -0.1), true); Pg(c, [[W / 2 - u * 3.2, st - u * 6.6], [W / 2 + u * 3.2, st - u * 6.6], [W / 2 + u * 2.6, st - u * 8.4], [W / 2 - u * 2.6, st - u * 8.4]], dk, true); dot(c, W / 2, st - u * 4, u * 1.1, p.gold); L(c, W / 2 + u * 1, st - u * 8.2, W / 2 + u * 2.2, st - u * 10.6, u * 0.3, '#3a3a44'); dot(c, W / 2 + u * 2.2, st - u * 10.8, u * 0.55, '#3a3a44');
    /* bunting (and at dusk, lights) from the big trees to the stage */
    K.flagRow(c, -u * 2, H * 0.37, sx + u * 1, st - u * 19.4, u * 5, Math.max(5, Math.round(W * 0.3 / (u * 6))), [p.accent, p.gold, p.paper], u * 4.6, t); K.flagRow(c, sx + sw - u * 1, st - u * 19.4, W + u * 2, H * 0.36, u * 5, Math.max(5, Math.round(W * 0.3 / (u * 6))), [p.gold, p.accent, p.paper], u * 4.6, t + 1);
    if (dusk) { K.lightString(c, -u * 2, H * 0.43, sx + u * 1, st - u * 16, u * 4, 6, u * 0.9, { beat: o.beat, n: o.n }, t); K.lightString(c, sx + sw - u * 1, st - u * 16, W + u * 2, H * 0.42, u * 4, 6, u * 0.9, { beat: o.beat, n: o.n + 1 }, t); glow(c, W / 2, st - u * 8, sw * 0.6, lit, 0.28); }
    /* rows of chairs seen from behind, an aisle up the middle with a runner */
    quad(c, W / 2 - u * 5, st + u * 5.2, W / 2 + u * 5, st + u * 5.2, W / 2 + u * 22, H, W / 2 - u * 22, H, alpha(p.accent, dusk ? 0.5 : 0.6)); quad(c, W / 2 - u * 4.1, st + u * 5.2, W / 2 - u * 3.7, st + u * 5.2, W / 2 - u * 16.6, H, W / 2 - u * 18.4, H, alpha(p.gold, 0.8)); quad(c, W / 2 + u * 4.1, st + u * 5.2, W / 2 + u * 3.7, st + u * 5.2, W / 2 + u * 16.6, H, W / 2 + u * 18.4, H, alpha(p.gold, 0.8));
    var cc = dusk ? mix(p.paper, p.bg, 0.3) : p.paper, rws = 6;
    for (j = 0; j < rws; j++) { var f = j / (rws - 1), ry = st + u * 9 + (H + u * 4 - st - u * 9) * Math.pow(f, 1.5), cs = u * (4.6 + f * 9), aisle = u * (9 + f * 17), nn = 4;
      for (i = 0; i < nn; i++) for (var s = -1; s <= 1; s += 2) { var chx = W / 2 + s * (aisle + (i + 0.5) * cs * 1.12); if (Math.abs(chx - W / 2) > W / 2 + cs) continue; chairBack(c, chx, ry, cs, cc);
        if (j === rws - 1 || (j === rws - 2 && i === 0)) { /* a cap left on a seat, a ribbon on the aisle chair */ } if (i === 0) { dot(c, chx - s * cs * 0.44, ry - cs * 1.16, cs * 0.14, p.gold); L(c, chx - s * cs * 0.44, ry - cs * 1.1, chx - s * cs * 0.52, ry - cs * 0.74, cs * 0.06, p.gold); L(c, chx - s * cs * 0.44, ry - cs * 1.1, chx - s * cs * 0.38, ry - cs * 0.76, cs * 0.06, p.gold); } }
      if (dusk && j < rws - 1) for (s = -1; s <= 1; s += 2) { var lxx = W / 2 + s * (aisle - cs * 0.3); glow(c, lxx, ry - cs * 0.2, cs * 1.3, lit, 0.4); Rn(c, lxx - cs * 0.11, ry - cs * 0.36, cs * 0.22, cs * 0.36, cs * 0.05, '#fff3c0'); Rn(c, lxx - cs * 0.14, ry - cs * 0.42, cs * 0.28, cs * 0.08, cs * 0.03, '#3a3a44'); } }
    /* caps thrown high, tumbling at the sides */
    for (i = 0; i < 7; i++) { var per = 3.4 + (i % 3) * 0.6, ph = frac(t / per + i * 0.29), side = i % 2 ? 1 : -1, hx = W / 2 + side * W * (0.3 + (i % 4) * 0.05), up = 4 * ph * (1 - ph), hy = H * (0.5 - 0.36 * up - (i % 3) * 0.02); cap(c, hx + side * ph * u * 3, hy, u * (3 + (i % 3) * 0.7), ph * 9 * side + i, mix(p.ink, '#1a1a2a', 0.5), i % 2 ? p.gold : p.accent); }
    if (dusk) vignette(c, W, H, '#0a0620', 0.3);
  }, { variants: ['day', 'dusk'], stage: 'band-low' });

  /* ---------- driveway: a house, its garage and the drive ---------- */
  Art.add('backdrop', 'driveway', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'dw'), dusk = o.variant === 'dusk', hz = H * 0.62, k = Math.exp(-5 * o.beat), lit = '#ffe08a', dim = dusk ? 0.4 : 0, tone = function (col) { return dusk ? mix(col, p.bg, dim) : col; },
      gr = tone(mix('#6abf5a', p.accent2, 0.45)), sid = tone(mix(p.paper, p.bg2, 0.15)), roof = tone(mix(p.accent, '#7a4a48', 0.45)), trim = tone('#ffffff'), door = tone(p.accent), glass = dusk ? lit : mix('#9ad0f0', p.bg, 0.25);
    if (dusk) { vgrad(c, W, H, [shade(p.bg, -0.25), p.bg, p.bg2, mix(p.bg2, '#ff9a6a', 0.55), '#ffd09a'], 0, hz); K.skyStars(c, W, H, 50, o.seed, t, H * 0.3); K.moonDisc(c, W * 0.82, H * 0.08, u * 4, '#fff6d8'); for (i = 0; i < 4; i++) { var dw = u * (24 + R0() * 20); el(c, frac(R0() + t * 0.004) * (W + dw * 2) - dw, H * (0.22 + R0() * 0.2), dw, u * 2, alpha(mix('#ff9a8a', p.accent, 0.3), 0.3)); } }
    else { vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.7), shade(p.bg2, 0.3)], 0, hz); glow(c, W * 0.16, H * 0.08, u * 30, '#fff6c8', 0.6); dot(c, W * 0.16, H * 0.08, u * 6, '#ffe27a'); for (i = 0; i < 4; i++) { var cw = u * (16 + R0() * 14), cx = frac(R0() + t * 0.005 * (1 + i * 0.3)) * (W + cw * 2) - cw; K.cloud(c, cx, H * (0.05 + R0() * 0.2), cw, 'rgba(255,255,255,0.92)'); } }
    K.hill(c, W, H, hz - u * 5, u * 3, tone(mix(mix('#8ac88a', p.accent2, 0.3), p.bg2, 0.4)), o.seed + 'a', 0.8);
    var tc = tone(mix('#3f9f5a', p.accent2, 0.35)), tk = tone('#6a4a30');
    tree(c, W * 0.3, hz + u * 0.4, u * 50, shade(tc, 0.16), tk, t, 6); tree(c, W * 0.86, hz + u * 0.4, u * 40, shade(tc, 0.05), tk, t, 8); tree(c, W * 0.52, hz + u * 0.4, u * 30, shade(tc, 0.1), tk, t, 3);
    var fpc = tone(mix(p.paper, p.bg2, 0.1)); Rn(c, 0, hz - u * 4, W, u * 0.7, 0, shade(fpc, -0.1)); Rn(c, 0, hz - u * 1.8, W, u * 0.7, 0, shade(fpc, -0.1)); c.fillStyle = fpc; c.beginPath(); for (i = 0; i * u * 2.4 < W + u * 3; i++) { var fpx = i * u * 2.4; c.moveTo(fpx, hz + u * 1.4); c.lineTo(fpx, hz - u * 4.8); c.lineTo(fpx + u * 0.8, hz - u * 5.9); c.lineTo(fpx + u * 1.6, hz - u * 4.8); c.lineTo(fpx + u * 1.6, hz + u * 1.4); c.closePath(); } c.fill();
    /* the house on the left: two floors, a porch, a chimney */
    var hw = Math.min(W * 0.47, u * 50), hx = -u * 2, hh = u * 27, hy = hz - hh;
    Rn(c, hx + hw * 0.66, hy - u * 13, u * 4.6, u * 11, 0, tone(mix('#b0705a', p.accent, 0.3))); Rn(c, hx + hw * 0.66 - u * 0.5, hy - u * 13.6, u * 5.6, u * 1.5, u * 0.3, tone(mix('#8a5a4a', p.accent, 0.3))); if (dusk) K.smoke(c, hx + hw * 0.66 + u * 2.3, hy - u * 14, u * 3, t);
    Rn(c, hx, hy, hw, hh + u * 2, 0, sid); c.fillStyle = 'rgba(60,50,70,0.07)'; for (i = 1; i * u * 2.2 < hh; i++) c.fillRect(hx, hy + i * u * 2.2, hw, u * 0.3);
    Pg(c, [[hx - u * 3, hy + u * 0.4], [hx + hw / 2, hy - hw * 0.3], [hx + hw + u * 3, hy + u * 0.4]], roof, true); Pg(c, [[hx - u * 3, hy + u * 0.4], [hx + hw + u * 3, hy + u * 0.4], [hx + hw + u * 1.6, hy - u * 1.2], [hx - u * 1.6, hy - u * 1.2]], shade(roof, -0.16), true);
    c.strokeStyle = 'rgba(40,10,20,0.14)'; c.lineWidth = u * 0.3; for (i = 1; i < 5; i++) { var rf = i / 5; c.beginPath(); c.moveTo(hx - u * 3 + rf * (hw / 2 + u * 3), hy - rf * hw * 0.3); c.lineTo(hx + hw + u * 3 - rf * (hw / 2 + u * 3), hy - rf * hw * 0.3); c.stroke(); }
    dot(c, hx + hw / 2, hy - hw * 0.13, u * 2.6, trim); dot(c, hx + hw / 2, hy - hw * 0.13, u * 1.9, glass);
    for (i = 0; i < 4; i++) { var wxx = hx + hw * (0.18 + (i % 2) * 0.42), wyy = hy + u * (4 + Math.floor(i / 2) * 12.4), w2 = hw * 0.2, h2 = u * 7.4; if (i === 3) continue; Rn(c, wxx - u * 0.7, wyy - u * 0.7, w2 + u * 1.4, h2 + u * 1.4, u * 0.3, trim); Rn(c, wxx, wyy, w2, h2, 0, glass); if (dusk) Rn(c, wxx, wyy, w2, h2, 0, alpha('#ff9a3a', 0.12 + 0.06 * Math.sin(t * 3 + i))); else quad(c, wxx, wyy, wxx + w2 * 0.5, wyy, wxx + w2 * 0.2, wyy + h2, wxx, wyy + h2, 'rgba(255,255,255,0.3)'); Rn(c, wxx + w2 / 2 - u * 0.25, wyy, u * 0.5, h2, 0, trim); Rn(c, wxx, wyy + h2 / 2 - u * 0.25, w2, u * 0.5, 0, trim); Rn(c, wxx - u * 2.4, wyy, u * 1.9, h2, 0, tone(p.accent2)); Rn(c, wxx + w2 + u * 0.5, wyy, u * 1.9, h2, 0, tone(p.accent2));
      if (i === 2) { Rn(c, wxx - u * 1.4, wyy + h2 + u * 0.4, w2 + u * 2.8, u * 2, u * 0.4, tone('#a8693a')); for (j = 0; j < 5; j++) K.flower(c, wxx + j * w2 / 4, wyy + h2 + u * 0.2, u * 1.2, tone([p.accent, p.gold, '#ffffff'][j % 3]), tone('#ffd54a'), j); } }
    var dx = hx + hw * 0.62, dwid = hw * 0.18, dh = u * 12.6, dy = hz + u * 1.4 - dh; /* the front door under a little porch roof */
    Pg(c, [[dx - u * 4, dy - u * 1.4], [dx + dwid / 2, dy - u * 6], [dx + dwid + u * 4, dy - u * 1.4]], shade(roof, -0.1), true); Rn(c, dx - u * 3, dy - u * 1.6, u * 1, dh + u * 1.6, 0, trim); Rn(c, dx + dwid + u * 2, dy - u * 1.6, u * 1, dh + u * 1.6, 0, trim);
    Rn(c, dx - u * 0.6, dy - u * 0.6, dwid + u * 1.2, dh + u * 0.6, u * 0.3, trim); Rn(c, dx, dy, dwid, dh, 0, door); Rn(c, dx + dwid * 0.16, dy + u * 1.2, dwid * 0.68, u * 3.6, u * 0.3, glass); Rn(c, dx + dwid * 0.16, dy + u * 6, dwid * 0.68, u * 5.2, u * 0.3, shade(door, -0.14)); dot(c, dx + dwid * 0.84, dy + dh * 0.56, u * 0.6, tone(p.gold));
    Rn(c, dx - u * 3.6, hz + u * 1.2, dwid + u * 7.2, u * 1.4, u * 0.3, tone('#d8cdb8')); Rn(c, dx - u * 4.6, hz + u * 2.4, dwid + u * 9.2, u * 1.4, u * 0.3, tone('#c9bda6'));
    glow(c, dx + dwid + u * 3.6, dy + u * 2.6, u * (dusk ? 13 : 0.01), lit, 0.5); Rn(c, dx + dwid + u * 3, dy + u * 1.6, u * 1.4, u * 2.2, u * 0.4, dusk ? '#fff3c0' : '#f0f0f0'); Rn(c, dx + dwid + u * 2.8, dy + u * 1.1, u * 1.8, u * 0.7, u * 0.2, '#3a3a44');
    /* the garage on the right, a hoop over its door */
    var gw = Math.min(W * 0.4, u * 42), gx = W - gw + u * 3, gh = u * 18, gy = hz - gh;
    Rn(c, gx, gy, gw, gh + u * 2, 0, shade(sid, -0.05)); Pg(c, [[gx - u * 2.4, gy + u * 0.4], [gx + gw / 2, gy - gw * 0.26], [gx + gw + u * 2.4, gy + u * 0.4]], roof, true); Pg(c, [[gx - u * 2.4, gy + u * 0.4], [gx + gw + u * 2.4, gy + u * 0.4], [gx + gw + u * 1.2, gy - u * 1], [gx - u * 1.2, gy - u * 1]], shade(roof, -0.16), true);
    var gdw = gw * 0.66, gdx = gx + gw * 0.14, gdh = u * 12.6, gdy = hz + u * 1.4 - gdh; Rn(c, gdx - u * 0.8, gdy - u * 0.8, gdw + u * 1.6, gdh + u * 0.8, u * 0.4, trim); Rn(c, gdx, gdy, gdw, gdh, 0, tone(mix('#ffffff', p.bg2, 0.3)));
    for (j = 0; j < 4; j++) { c.fillStyle = 'rgba(60,50,70,0.12)'; c.fillRect(gdx, gdy + j * gdh / 4, gdw, u * 0.35); if (j === 0) for (i = 0; i < 4; i++) Rn(c, gdx + gdw * (0.05 + i * 0.235), gdy + u * 0.9, gdw * 0.19, gdh / 4 - u * 1.5, u * 0.2, glass); }
    var bbx = gdx + gdw / 2, bby = gy - gw * 0.1; Rn(c, bbx - u * 3.8, bby - u * 2.8, u * 7.6, u * 5.4, u * 0.5, trim); c.lineWidth = u * 0.4; c.strokeStyle = tone(p.accent); c.strokeRect(bbx - u * 1.6, bby - u * 0.4, u * 3.2, u * 2.4); c.beginPath(); c.ellipse(bbx, bby + u * 2.8, u * 1.9, u * 0.6, 0, 0, TAU); c.lineWidth = u * 0.5; c.stroke(); c.strokeStyle = alpha('#ffffff', 0.8); c.lineWidth = u * 0.2; c.beginPath(); for (i = -2; i <= 2; i++) { c.moveTo(bbx + i * u * 0.8, bby + u * 3.2); c.lineTo(bbx + i * u * 0.5, bby + u * 5.6); } c.stroke();
    for (i = 0; i < 2; i++) { var glx = i ? gdx + gdw + u * 2.6 : gdx - u * 2.6; if (dusk) glow(c, glx, gdy + u * 1.6, u * 10, lit, 0.45); Rn(c, glx - u * 0.7, gdy + u * 0.6, u * 1.4, u * 2.2, u * 0.4, dusk ? '#fff3c0' : '#f0f0f0'); Rn(c, glx - u * 0.9, gdy + u * 0.1, u * 1.8, u * 0.7, u * 0.2, '#3a3a44'); }
    /* lawn, the drive widening towards us, a path to the door */
    var g = c.createLinearGradient(0, hz, 0, H); g.addColorStop(0, shade(gr, 0.16)); g.addColorStop(1, shade(gr, -0.22)); c.fillStyle = g; c.fillRect(0, hz + u * 1.2, W, H - hz);
    var dr = tone(mix('#c9c4bc', p.bg2, 0.25)); quad(c, gdx - u * 1, hz + u * 1.4, gdx + gdw + u * 1, hz + u * 1.4, W + u * 6, H, W * 0.08, H, dr); quad(c, gdx - u * 1, hz + u * 1.4, gdx + u * 1, hz + u * 1.4, W * 0.08 + u * 5, H, W * 0.08, H, shade(dr, 0.14));
    c.strokeStyle = 'rgba(60,50,70,0.14)'; c.lineWidth = Math.max(0.7, u * 0.22); c.beginPath(); for (i = 1; i < 5; i++) { var yy = hz + u * 1.4 + (H - hz) * Math.pow(i / 5, 1.6), ff2 = (yy - hz - u * 1.4) / (H - hz - u * 1.4); c.moveTo(gdx - u + (W * 0.08 - gdx + u) * ff2, yy); c.lineTo(W, yy); } c.stroke();
    for (i = 0; i < 5; i++) { var pf = i / 4, spx = dx + dwid * 0.5 + pf * pf * u * 9 + pf * u * 3, spy = hz + u * 5.6 + pf * u * 12; el(c, spx, spy + u * 0.4, u * (3 + pf * 1.6), u * (0.9 + pf * 0.5), 'rgba(20,40,20,0.18)'); el(c, spx, spy, u * (3 + pf * 1.6), u * (0.9 + pf * 0.5), tone(i % 2 ? '#d8cdb8' : '#c9bda6')); } /* stepping stones from the door to the drive */
    for (i = 0; i < 9; i++) { var sxh = hx + u * 3 + i * hw * 0.068, big = i % 3 === 0; if (sxh > dx - u * 4.5) break; el(c, sxh, hz + u * 1.2, u * (big ? 3.4 : 2.6), u * (big ? 3.2 : 2.2), i % 2 ? tc : shade(tc, -0.1)); if (i % 2) for (j = 0; j < 3; j++) dot(c, sxh + (j - 1) * u * 1.3, hz + u * (0.2 - (j % 2) * 1.2), u * 0.6, tone([p.accent, '#ffffff', p.gold][(i + j) % 3])); }
    /* near corners: a plain mailbox with its flag up, a bike on its side; and a ball rolling to a stop */
    var mx = u * 8, mb = H - u * 5; el(c, mx, mb + u * 0.4, u * 5, u * 1.2, 'rgba(20,40,20,0.22)'); Rn(c, mx - u * 0.7, mb - u * 15, u * 1.4, u * 15, 0, tone('#8a5a3a')); Rn(c, mx - u * 5.4, mb - u * 22, u * 10.8, u * 7, u * 3, tone(p.accent2)); Rn(c, mx - u * 5.4, mb - u * 18.6, u * 10.8, u * 3.6, u * 0.4, tone(p.accent2)); el(c, mx - u * 5.2, mb - u * 18.4, u * 1.2, u * 3.3, shade(tone(p.accent2), -0.2)); Rn(c, mx + u * 2.6, mb - u * 25.4, u * 0.6, u * 5, 0, tone(p.accent)); Rn(c, mx + u * 2.6, mb - u * 25.4, u * 3, u * 2, u * 0.3, tone(p.accent));
    for (i = 0; i < 5; i++) { var fxx = mx - u * 6 + i * u * 3, sway = Math.sin(t * 1.3 + i) * u * 0.3; L(c, fxx, mb + u * 1, fxx + sway, mb - u * 3.4, u * 0.3, shade(gr, -0.3)); K.flower(c, fxx + sway, mb - u * 3.6, u * 1.3, tone([p.gold, '#ffffff', p.accent][i % 3]), tone('#ffd54a'), i); }
    var bkx = W - u * 15, bkb = H - u * 4.4, roll = clamp(1 - frac(t * 0.05) * 3, 0, 1), blx = W * 0.72 - roll * u * 12;
    el(c, blx, hz + u * 13.6, u * 3, u * 0.7, 'rgba(20,20,40,0.2)'); c.save(); c.translate(blx, hz + u * 11); c.rotate(-roll * 5); dot(c, 0, 0, u * 2.6, tone('#e8792a')); c.strokeStyle = 'rgba(60,20,10,0.6)'; c.lineWidth = u * 0.25; c.beginPath(); c.moveTo(-u * 2.6, 0); c.lineTo(u * 2.6, 0); c.moveTo(0, -u * 2.6); c.lineTo(0, u * 2.6); c.stroke(); c.beginPath(); c.arc(-u * 3.4, 0, u * 2.6, -0.8, 0.8); c.stroke(); c.beginPath(); c.arc(u * 3.4, 0, u * 2.6, PI - 0.8, PI + 0.8); c.stroke(); c.restore();
    el(c, bkx, bkb + u * 0.5, u * 11, u * 1.6, 'rgba(20,20,40,0.22)'); ring(c, bkx - u * 6, bkb - u * 4, u * 4, u * 0.7, '#3a3a44'); ring(c, bkx + u * 6, bkb - u * 4, u * 4, u * 0.7, '#3a3a44'); ring(c, bkx - u * 6, bkb - u * 4, u * 3.2, u * 0.2, '#c9cfd8'); ring(c, bkx + u * 6, bkb - u * 4, u * 3.2, u * 0.2, '#c9cfd8');
    var bc = tone(p.accent); L(c, bkx - u * 6, bkb - u * 4, bkx - u * 1.6, bkb - u * 9.6, u * 0.8, bc); L(c, bkx - u * 1.6, bkb - u * 9.6, bkx + u * 4.2, bkb - u * 9.6, u * 0.8, bc); L(c, bkx + u * 4.2, bkb - u * 9.6, bkx + u * 0.4, bkb - u * 4, u * 0.8, bc); L(c, bkx + u * 0.4, bkb - u * 4, bkx - u * 6, bkb - u * 4, u * 0.8, bc); L(c, bkx - u * 1.6, bkb - u * 9.6, bkx + u * 0.4, bkb - u * 4, u * 0.8, bc); L(c, bkx + u * 6, bkb - u * 4, bkx + u * 4, bkb - u * 12, u * 0.8, bc); L(c, bkx + u * 2.4, bkb - u * 12.4, bkx + u * 5.6, bkb - u * 11.6, u * 0.9, '#3a3a44'); Rn(c, bkx - u * 3.6, bkb - u * 11.2, u * 4, u * 1.2, u * 0.6, '#3a3a44'); L(c, bkx - u * 1.6, bkb - u * 9.6, bkx - u * 1.8, bkb - u * 10.4, u * 0.6, bc);
    if (dusk) { for (i = 0; i < 9; i++) { var fa = 0.5 + 0.5 * Math.sin(t * (1.2 + R0()) + i * 2), ffx = R0() * W, ffy = hz + u * 4 + R0() * (H - hz - u * 8) + Math.sin(t * 0.6 + i) * u * 2; dot(c, ffx, ffy, u * 1.8, alpha(lit, 0.12 * fa)); dot(c, ffx, ffy, u * 0.4, alpha('#fff6c8', 0.4 + 0.6 * fa)); } vignette(c, W, H, '#0a0620', 0.3); }
  }, { variants: ['day', 'dusk'], stage: 'band-low' });
});
