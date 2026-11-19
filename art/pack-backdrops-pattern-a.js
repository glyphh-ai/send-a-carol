/* Send a Carol art pack: pattern backdrops A (stripes, polka, terrazzo, sunburst2, watercolor, mesh, artdecofan, memphis,
   gingham, floralpattern). Every colour comes from the palette; a variant is a different ARRANGEMENT of the pattern, not a
   time of day. Each one keeps its centre calm and lays a floor from y = 0.705 H down, so a cast never floats.
   Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, dot = K.dot, Rn = K.Rn, L = K.L, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd,
    vgrad = K.vgrad, vgrad2 = K.vgrad2, vignette = K.vignette, twinkle = K.twinkle;
  var FY = 0.705; /* where every floor here begins, as a fraction of H */

  /* ---------- palette helpers ---------- */
  function lum(col) { var r = K.rgbOf(col) || [128, 128, 128]; return (r[0] * 0.299 + r[1] * 0.587 + r[2] * 0.114) / 255; }
  function dk(p) { return lum(p.bg) < 0.42; }
  function inkOf(p) { return dk(p) ? p.snow : p.ink; }                                   /* line work that shows on this palette */
  function deep(p, k) { return dk(p) ? mix(p.bg, '#05040c', k == null ? 0.5 : k) : mix(p.bg, p.ink, k == null ? 0.5 : k); }
  function tone(p, col, a) { return dk(p) ? shade(col, a) : mix(col, p.ink, a); }        /* a step away from col that still shows */
  function second(p, k, lift) { var m = mix(p.bg, p.bg2, k); return dk(p) ? shade(m, lift == null ? 0.13 : lift) : m; }   /* the pattern's second colour: dark palettes sit close together, so it is lifted */

  /* ---------- shared pieces ---------- */
  function soft(c, x, y, rx, ry, col, a) { /* a soft oval of colour, fading to nothing */
    c.save(); c.translate(x, y); c.scale(1, ry / rx);
    var g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, alpha(col, a)); g.addColorStop(0.55, alpha(col, a * 0.72)); g.addColorStop(1, alpha(col, 0));
    c.fillStyle = g; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore();
  }
  function calm(c, W, H, col, a) { soft(c, W / 2, H * 0.4, W * 0.66, H * 0.36, col, a); }  /* quiets the pattern where titles and photos go */
  function quiet(x, y, W, H) { var dx = (x - W / 2) / (W * 0.4), dy = (y - H * 0.4) / (H * 0.3); return dx * dx + dy * dy < 1; }  /* inside the calm centre? */
  function ground(c, W, H, u, p, q) { /* the floor: a deeper band with a lit edge and a contact shadow under it. a < 1 lets the pattern show through */
    q = q || {}; var fy = H * FY, col = q.col || deep(p), a = q.a == null ? 0.55 : q.a, sh = shade(col, -0.6);
    vgrad2(c, 0, fy, W, H - fy, alpha(col, a), alpha(shade(col, -0.28), Math.min(1, a + 0.22)));
    vgrad2(c, 0, fy, W, u * 6, alpha(sh, 0.4), alpha(sh, 0));
    if (q.line !== 0) Rn(c, 0, fy - u * 0.3, W, u * 0.6, 0, alpha(q.lineCol || p.snow, q.line || 0.5));
    return fy;
  }
  function skirting(c, W, H, u, col) { /* a moulded board where wall meets floor */
    var fy = H * FY, h = u * 2.2; Rn(c, 0, fy - h, W, h, 0, col); Rn(c, 0, fy - h, W, u * 0.4, 0, 'rgba(255,255,255,0.4)'); Rn(c, 0, fy - h + u * 0.9, W, u * 0.18, 0, 'rgba(0,0,0,0.12)'); Rn(c, 0, fy - u * 0.35, W, u * 0.35, 0, 'rgba(0,0,0,0.2)');
  }
  function bands(c, W, H, ang, s, off, fn) { /* a striped field turned by ang: fn(x, D, i) draws one period with fillRect(x + .., -D, w, D * 2) */
    var D = Math.hypot(W, H) / 2 + s, n = Math.ceil(D * 2 / s) + 1, i;
    c.save(); c.translate(W / 2, H / 2); c.rotate(ang); for (i = 0; i < n; i++) fn(-D + i * s + off, D, i); c.restore();
  }
  function sheen(c, W, H, t, col, a) { /* a slow band of light crossing the pattern */
    var f = frac(t * 0.035), x = (f * 1.8 - 0.4) * W, g = c.createLinearGradient(x - W * 0.3, 0, x + W * 0.3, H * 0.35);
    g.addColorStop(0, alpha(col, 0)); g.addColorStop(0.5, alpha(col, a * Math.sin(f * PI))); g.addColorStop(1, alpha(col, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }

  /* =====================================================================================
     stripes: diagonal (tone on tone with pinstripes), awning (a shop awning over a striped wall), candy (sweet-shop stripes)
     ===================================================================================== */
  Art.add('backdrop', 'stripes', function (c, W, H, t, p, o, u) {
    var v = o.variant, d = dk(p), i, fy = H * FY, s, a, b;
    if (v === 'awning') {
      a = mix(p.bg, p.bg2, 0.3); b = mix(p.bg, p.bg2, 0.52); var n = Math.max(7, Math.round(W / (u * 9.5))) | 1, sw = W / n, ah = u * 7.5, wn = n * 2;
      c.fillStyle = a; c.fillRect(0, 0, W, H);
      c.fillStyle = b; for (i = 0; i < wn; i += 2) c.fillRect(i * W / wn, 0, W / wn, fy);                                  /* the wall: quiet upright stripes */
      c.fillStyle = alpha(p.snow, 0.16); for (i = 0; i < wn; i++) c.fillRect(i * W / wn - u * 0.12, 0, u * 0.24, fy);
      calm(c, W, H, mix(a, b, 0.5), 0.55);
      var dy = H * 0.57, dc = tone(p, mix(a, b, 0.5), d ? 0.1 : 0.16), pn = Math.max(3, Math.round(W / (u * 24))), pw = W / pn;   /* a panelled dado under the stripes, like a shop front */
      Rn(c, 0, dy, W, fy - dy, 0, dc); Rn(c, 0, dy - u * 1.2, W, u * 1.6, 0, shade(dc, 0.3)); Rn(c, 0, dy - u * 1.2, W, u * 0.35, 0, alpha(p.snow, 0.5)); Rn(c, 0, dy + u * 0.4, W, u * 0.5, 0, 'rgba(10,6,20,0.16)');
      for (i = 0; i < pn; i++) { var qx = i * pw + u * 2.2, qy = dy + u * 3, qw = pw - u * 4.4, qh = fy - dy - u * 5.6; Rn(c, qx, qy, qw, qh, u * 0.6, 'rgba(10,6,20,0.14)'); Rn(c, qx + u * 0.5, qy + u * 0.5, qw - u * 0.5, qh - u * 0.5, u * 0.5, shade(dc, 0.1)); Rn(c, qx + u * 0.5, qy + qh - u * 0.4, qw - u * 0.5, u * 0.4, 0, alpha(p.snow, 0.2)); }
      /* pavement */
      var pv = d ? shade(deep(p, 0.3), 0.08) : mix(p.bg2, p.ink, 0.2); ground(c, W, H, u, p, { col: pv, a: 1, line: 0 });
      c.strokeStyle = d ? alpha(p.snow, 0.14) : alpha(shade(pv, -0.5), 0.3); c.lineWidth = Math.max(1, u * 0.22); c.beginPath();
      for (i = 1; i < 5; i++) { var z = i / 5, y = fy + (H - fy) * z * z * 0.9 + u * 2.4; c.moveTo(0, y); c.lineTo(W, y); }
      for (i = -8; i <= 8; i++) { c.moveTo(W / 2 + i * W * 0.11, fy + u * 2.4); c.lineTo(W / 2 + i * W * 0.2, H); }
      c.stroke();
      Rn(c, 0, fy, W, u * 2.4, 0, shade(pv, 0.22)); Rn(c, 0, fy, W, u * 0.5, 0, alpha(p.snow, 0.5)); Rn(c, 0, fy + u * 2.1, W, u * 0.4, 0, alpha(shade(pv, -0.5), 0.35));   /* the kerb */
      /* the awning */
      vgrad2(c, 0, ah, W, u * 13, alpha(deep(p, 0.7), 0.36), alpha(deep(p, 0.7), 0));
      for (i = 0; i < n; i++) { c.fillStyle = i % 2 ? p.paper : p.accent; c.fillRect(i * sw - 0.5, 0, sw + 1, ah); }
      vgrad2(c, 0, 0, W, ah, 'rgba(20,10,30,0.3)', 'rgba(20,10,30,0)');
      for (i = 0; i < n; i++) { var cx = i * sw + sw / 2, sy = ah + Math.sin(t * 1.5 + i * 0.7) * u * 0.3, col = i % 2 ? p.paper : p.accent;   /* the valance, lifting a little in the air */
        c.beginPath(); c.moveTo(cx - sw / 2, ah - 1); c.lineTo(cx - sw / 2, sy + u * 1.6); c.arc(cx, sy + u * 1.6, sw / 2, PI, 0, true); c.lineTo(cx + sw / 2, ah - 1); c.closePath(); c.fillStyle = col; c.fill();
        c.beginPath(); c.arc(cx, sy + u * 1.6, sw / 2 - u * 0.7, PI * 0.9, PI * 0.1, true); c.lineWidth = u * 0.4; c.strokeStyle = i % 2 ? alpha(p.accent, 0.55) : alpha(p.paper, 0.6); c.stroke();
        dot(c, cx + sw / 2, sy + u * 1.7, u * 0.95, p.gold); dot(c, cx + sw / 2 - u * 0.25, sy + u * 1.45, u * 0.35, 'rgba(255,255,255,0.7)'); }
      Rn(c, 0, ah - u * 0.35, W, u * 0.7, 0, alpha(deep(p, 0.8), 0.3)); Rn(c, 0, 0, W, u * 1.1, 0, shade(p.gold, -0.12)); Rn(c, 0, u * 0.25, W, u * 0.25, 0, 'rgba(255,255,255,0.5)');
      vignette(c, W, H, deep(p, 0.8), 0.22);
      return;
    }
    if (v === 'candy') {
      a = d ? mix(p.bg, p.paper, 0.1) : mix(p.paper, p.bg2, 0.25); s = u * 17;
      c.fillStyle = a; c.fillRect(0, 0, W, H);
      bands(c, W, H, 0.62, s, frac(t * 0.012) * s, function (x, D) {
        c.fillStyle = p.accent; c.fillRect(x, -D, s * 0.34, D * 2);
        c.fillStyle = alpha(p.snow, 0.3); c.fillRect(x + s * 0.045, -D, s * 0.035, D * 2);
        c.fillStyle = alpha(deep(p, 0.8), 0.16); c.fillRect(x + s * 0.3, -D, s * 0.04, D * 2);
        c.fillStyle = p.accent2; c.fillRect(x + s * 0.5, -D, s * 0.05, D * 2); c.fillRect(x + s * 0.62, -D, s * 0.05, D * 2);
        c.fillStyle = alpha(p.gold, 0.9); c.fillRect(x + s * 0.83, -D, s * 0.022, D * 2);
      });
      calm(c, W, H, a, 0.62);
      sheen(c, W, H, t, p.snow, 0.2);
      ground(c, W, H, u, p, { col: mix(p.accent, deep(p, 0.7), 0.6), a: 0.6, line: 0 }); skirting(c, W, H, u, d ? shade(p.bg, 0.16) : p.paper);
      vignette(c, W, H, deep(p, 0.8), 0.24);
      return;
    }
    /* diagonal */
    a = p.bg; b = second(p, d ? 0.62 : 0.72, 0.08); s = u * 15;
    c.fillStyle = a; c.fillRect(0, 0, W, H);
    bands(c, W, H, -0.62, s, frac(t * 0.014) * s, function (x, D) {
      c.fillStyle = b; c.fillRect(x, -D, s * 0.5, D * 2);
      c.fillStyle = alpha(p.snow, 0.22); c.fillRect(x + s * 0.035, -D, s * 0.016, D * 2); c.fillRect(x + s * 0.45, -D, s * 0.016, D * 2);
      c.fillStyle = alpha(p.accent, 0.9); c.fillRect(x + s * 0.71, -D, s * 0.05, D * 2);
      c.fillStyle = alpha(p.gold, 0.85); c.fillRect(x + s * 0.8, -D, s * 0.018, D * 2);
      c.fillStyle = alpha(deep(p, 0.7), 0.1); c.fillRect(x + s * 0.5, -D, s * 0.03, D * 2);
    });
    calm(c, W, H, mix(a, b, 0.5), 0.66);
    sheen(c, W, H, t, p.snow, 0.14);
    ground(c, W, H, u, p, { a: 0.62, line: 0 }); skirting(c, W, H, u, mix(b, p.paper, 0.45));
    vignette(c, W, H, deep(p, 0.8), 0.26);
  }, { variants: ['diagonal', 'awning', 'candy'], stage: 'band-low' });

  /* =====================================================================================
     polka: classic (an even dot), scatter (party dots of every size), rings (hoops and pips)
     ===================================================================================== */
  function polkaFloor(c, W, H, u, p, col, dotCol) { /* dots laid flat on the floor, growing toward you */
    var fy = ground(c, W, H, u, p, { col: col, a: 1 }), k, i; c.fillStyle = dotCol; c.beginPath();
    for (k = 0; k < 5; k++) { var z = (k + 0.5) / 5, y = fy + (H - fy) * Math.pow(z, 1.5) + u * 1.5, rx = u * (2 + 4 * z), sp = rx * 4.4, n = Math.ceil(W / sp) + 2;
      for (i = -1; i < n; i++) { var x = W / 2 + (i - n / 2 + (k % 2) * 0.5 + 0.5) * sp; c.moveTo(x + rx, y); c.ellipse(x, y, rx, rx * 0.36, 0, 0, TAU); } }
    c.fill();
  }
  Art.add('backdrop', 'polka', function (c, W, H, t, p, o, u) {
    var v = o.variant, d = dk(p), i, j, fy = H * FY, R0 = rnd(o.seed + 'pk'), k = Math.exp(-4 * o.beat), x, y, r;
    if (v === 'scatter') {
      var base = mix(p.bg2, p.bg, d ? 0.3 : 0.12), cols = [p.bg, p.accent, p.gold, p.accent2, d ? shade(p.bg2, 0.3) : p.paper, p.accent], cell = u * 9.5, nx = Math.ceil(W / cell) + 1, ny = Math.ceil(fy / cell) + 1, q;
      c.fillStyle = base; c.fillRect(0, 0, W, H);
      for (q = 0; q < cols.length; q++) { c.fillStyle = cols[q]; c.beginPath();
        for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) { var jx = R0(), jy = R0(), rr = R0(), pick = Math.floor(R0() * 97); if (pick % cols.length !== q) continue;
          x = (i + 0.15 + jx * 0.7) * cell; y = (j + 0.15 + jy * 0.7) * cell + Math.sin(t * 0.8 + i * 1.7 + j) * u * 0.35; r = u * (0.7 + rr * rr * 4.2) * (1 + 0.06 * k * ((i + j) % 2)); if (quiet(x, y, W, H)) r = Math.min(r, u * 1.5);
          c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
        c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); R0 = rnd(o.seed + 'pk'); /* a little gloss on the bigger dots */
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) { var jx2 = R0(), jy2 = R0(), rr2 = R0(); R0(); x = (i + 0.15 + jx2 * 0.7) * cell; y = (j + 0.15 + jy2 * 0.7) * cell + Math.sin(t * 0.8 + i * 1.7 + j) * u * 0.35; r = u * (0.7 + rr2 * rr2 * 4.2); if (r < u * 2.4 || quiet(x, y, W, H)) continue; c.moveTo(x, y - r * 0.4); c.ellipse(x - r * 0.3, y - r * 0.4, r * 0.3, r * 0.17, -0.6, 0, TAU); }
      c.fill();
      calm(c, W, H, base, 0.6);
      polkaFloor(c, W, H, u, p, mix(p.bg, deep(p, 0.6), 0.45), alpha(p.gold, 0.5));
      vignette(c, W, H, deep(p, 0.8), 0.22);
      return;
    }
    if (v === 'rings') {
      var bs = p.bg, ring = second(p, 0.7, 0.1), cl = u * 15, mx = Math.ceil(W / cl) + 1, my = Math.ceil(fy / (cl * 0.5)) + 1;
      vgrad(c, W, H, [shade(bs, d ? 0.06 : 0.1), bs]);
      c.lineWidth = u * 1.1; c.strokeStyle = ring; c.beginPath();
      for (j = 0; j < my; j++) for (i = -1; i < mx; i++) { x = i * cl + (j % 2) * cl / 2 + cl * 0.25; y = j * cl * 0.5 + cl * 0.2; r = u * (4.3 + 0.25 * Math.sin(t * 1.1 + i * 0.9 + j * 0.6)); c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
      c.stroke();
      c.lineWidth = u * 0.3; c.strokeStyle = alpha(p.snow, 0.3); c.beginPath();
      for (j = 0; j < my; j++) for (i = -1; i < mx; i++) { x = i * cl + (j % 2) * cl / 2 + cl * 0.25; y = j * cl * 0.5 + cl * 0.2; c.moveTo(x + u * 5.6, y); c.arc(x, y, u * 5.6, 0, TAU); }
      c.stroke();
      for (var q2 = 0; q2 < 3; q2++) { c.fillStyle = [p.accent, p.gold, p.accent2][q2]; c.beginPath();
        for (j = 0; j < my; j++) for (i = -1; i < mx; i++) { if ((((i + 1) * 2 + j) % 3) !== q2) continue; x = i * cl + (j % 2) * cl / 2 + cl * 0.25; y = j * cl * 0.5 + cl * 0.2; r = u * (1.5 + 0.35 * k * ((i + j + o.n) % 2 ? 1 : 0)); c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
        c.fill(); }
      calm(c, W, H, bs, 0.7);
      polkaFloor(c, W, H, u, p, deep(p, 0.5), alpha(ring, d ? 0.5 : 0.3));
      vignette(c, W, H, deep(p, 0.8), 0.26);
      return;
    }
    /* classic */
    var bg = p.bg, dc = second(p, d ? 0.75 : 0.9, 0.2), ce = u * 11, ax = Math.ceil(W / ce) + 1, ay = Math.ceil(fy / (ce * 0.5)) + 1, pass;
    vgrad(c, W, H, [shade(bg, d ? 0.07 : 0.1), bg]);
    for (pass = 0; pass < 3; pass++) { c.fillStyle = [dc, p.accent, p.gold][pass]; c.beginPath();
      for (j = 0; j < ay; j++) for (i = -1; i < ax; i++) { x = i * ce + (j % 2) * ce / 2 + ce * 0.3; y = j * ce * 0.5 + ce * 0.18; var h = (i * 7 + j * 13 + 700) % 19, kind = !quiet(x, y, W, H) && (h === 0 || h === 9) ? (h ? 2 : 1) : 0; if (kind !== pass) continue;
        r = u * 2.5 * (1 + 0.05 * Math.sin(t * 0.9 + i * 0.6 + j * 0.45)) * (kind ? 1 + 0.1 * k : 1); c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
      c.fill(); }
    calm(c, W, H, bg, 0.62);
    polkaFloor(c, W, H, u, p, deep(p, 0.48), alpha(dc, d ? 0.5 : 0.32));
    vignette(c, W, H, deep(p, 0.8), 0.26);
  }, { variants: ['classic', 'scatter', 'rings'], stage: 'band-low' });

  /* =====================================================================================
     terrazzo: chips (fine angular chips), pebble (rounded river stones), paving (big broken slabs with pale grout)
     ===================================================================================== */
  function chipPath(c, x, y, r, R0) { var n = 4 + Math.floor(R0() * 3), a0 = R0() * TAU, sq = 0.6 + R0() * 0.4, i; for (i = 0; i < n; i++) { var a = a0 + (i + R0() * 0.55) / n * TAU, rr = r * (0.6 + R0() * 0.45), px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * sq; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); }
  function chipField(c, x0, y0, w, h, n, seed, cols, rmin, rmax, round, skip, W, H) {
    var q, i, per = Math.ceil(n / cols.length);
    for (q = 0; q < cols.length; q++) { var R0 = rnd(seed + 'c' + q); c.fillStyle = cols[q]; c.beginPath();
      for (i = 0; i < per; i++) { var x = x0 + R0() * w, y = y0 + R0() * h, rr = R0(), r = rmin + Math.pow(rr, 1.5) * (rmax - rmin), rot = R0() * PI; if (skip && quiet(x, y, W, H)) r = Math.min(r, rmin * 2.2);
        if (round) { var ry = r * (0.55 + R0() * 0.35); c.moveTo(x + Math.cos(rot) * r, y + Math.sin(rot) * r); c.ellipse(x, y, r, ry, rot, 0, TAU); } else chipPath(c, x, y, r, R0); }
      c.fill(); }
  }
  Art.add('backdrop', 'terrazzo', function (c, W, H, t, p, o, u) {
    var v = o.variant, d = dk(p), i, j, fy = H * FY, area = W * H / (u * u), R0, base;
    if (v === 'paving') {
      base = d ? mix(p.bg, p.paper, 0.2) : mix(p.paper, p.bg, 0.12); var cell = u * 12.5, nx = Math.ceil(W / cell) + 1, ny = Math.ceil(H / cell) + 1, P = [], cols = [p.bg, mix(p.bg, p.bg2, 0.5), mix(p.bg, p.bg2, 0.8), tone(p, p.bg, 0.14), p.accent, p.gold, p.accent2], q;
      R0 = rnd(o.seed + 'pv'); for (j = 0; j <= ny; j++) { P.push([]); for (i = 0; i <= nx; i++) P[j].push([(i - 0.5 + (R0() - 0.5) * 0.62) * cell, (j - 0.5 + (R0() - 0.5) * 0.62) * cell]); }
      c.fillStyle = base; c.fillRect(0, 0, W, H);
      for (q = 0; q < cols.length; q++) { c.fillStyle = cols[q]; c.beginPath();
        for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) { var hsh = (i * 5 + j * 11 + ((i * j) % 3)) % 13, ci = hsh < 4 ? 0 : hsh < 7 ? 1 : hsh < 9 ? 2 : hsh < 10 ? 3 : hsh < 11 ? 4 : hsh < 12 ? 5 : 6; if (ci !== q) continue;
          var A = P[j][i], B = P[j][i + 1], C = P[j + 1][i + 1], D = P[j + 1][i], mx = (A[0] + B[0] + C[0] + D[0]) / 4, my = (A[1] + B[1] + C[1] + D[1]) / 4, sh = 0.88, pts = [A, B, C, D], e;
          for (e = 0; e < 4; e++) { var px = mx + (pts[e][0] - mx) * sh, py = my + (pts[e][1] - my) * sh; if (e) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); }
        c.fill(); }
      R0 = rnd(o.seed + 'sp'); c.fillStyle = alpha(deep(p, 0.8), 0.16); c.beginPath(); for (i = 0; i < area / 60; i++) { var sx = R0() * W, sy = R0() * H, sr = u * (0.12 + R0() * 0.22); c.moveTo(sx + sr, sy); c.arc(sx, sy, sr, 0, TAU); } c.fill();
      calm(c, W, H, mix(p.bg, p.bg2, 0.4), 0.6);
      sheen(c, W, H, t, p.snow, 0.16);
      ground(c, W, H, u, p, { a: 0.6, line: 0 }); skirting(c, W, H, u, d ? shade(p.bg, 0.2) : p.paper);
      vignette(c, W, H, deep(p, 0.8), 0.22);
      return;
    }
    var round = v === 'pebble', cols2;
    if (round) { base = p.bg; cols2 = [mix(p.bg, p.bg2, 0.55), mix(p.bg, p.bg2, 0.85), tone(p, p.bg, 0.16), p.accent, p.gold, d ? shade(p.bg, 0.2) : p.paper, p.accent2]; }
    else { base = d ? mix(p.bg, p.bg2, 0.25) : mix(p.paper, p.bg2, 0.4); cols2 = [p.accent, p.accent2, p.gold, p.bg, d ? shade(p.bg2, 0.35) : mix(p.bg, p.ink, 0.55), d ? p.paper : mix(p.bg, p.bg2, 0.5)]; }
    c.fillStyle = base; c.fillRect(0, 0, W, H);
    chipField(c, -u * 3, -u * 3, W + u * 6, fy + u * 3, area * FY / (round ? 34 : 21), o.seed + 'w', cols2, u * (round ? 1.2 : 0.9), u * (round ? 5 : 3.8), round, true, W, H);
    if (round) { /* a pale glint on each pebble's shoulder would cost too much; a few soft highlights carry it */
      R0 = rnd(o.seed + 'hl'); c.fillStyle = 'rgba(255,255,255,0.14)'; c.beginPath(); for (i = 0; i < 40; i++) { var hx = R0() * W, hy = R0() * fy, hr = u * (0.5 + R0()); c.moveTo(hx + hr, hy); c.ellipse(hx, hy, hr, hr * 0.5, -0.5, 0, TAU); } c.fill(); }
    R0 = rnd(o.seed + 'sp'); c.fillStyle = alpha(d ? p.snow : deep(p, 0.8), 0.2); c.beginPath(); for (i = 0; i < area / 50; i++) { var x = R0() * W, y = R0() * fy, r = u * (0.1 + R0() * 0.22); c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.fill();
    calm(c, W, H, base, 0.66);
    /* the floor: the same stone, laid bigger and polished */
    var fl = round ? deep(p, 0.42) : (d ? deep(p, 0.35) : mix(base, p.ink, 0.3));
    ground(c, W, H, u, p, { col: fl, a: 1, line: 0 });
    c.save(); c.beginPath(); c.rect(0, fy + u * 0.3, W, H - fy); c.clip();
    chipField(c, -u * 4, fy, W + u * 8, H - fy + u * 4, area * (1 - FY) / (round ? 150 : 110), o.seed + 'f', cols2.map(function (q3) { return alpha(q3, 0.62); }), u * 1.6, u * (round ? 8 : 6.5), round, false, W, H);
    c.restore();
    vgrad2(c, 0, fy, W, u * 7, alpha(shade(fl, -0.6), 0.42), alpha(shade(fl, -0.6), 0));
    soft(c, W / 2, H * 0.9, W * 0.7, H * 0.09, p.snow, 0.12 + 0.03 * Math.sin(t * 0.9));
    Rn(c, 0, fy - u * 0.35, W, u * 0.7, 0, d ? shade(p.bg, 0.3) : p.paper); Rn(c, 0, fy + u * 0.35, W, u * 0.3, 0, alpha(p.gold, 0.8));
    R0 = rnd(o.seed + 'tw'); for (i = 0; i < 7; i++) { var tx = R0() * W, ty = R0() * H, ts = Math.max(0, Math.sin(t * (0.9 + R0()) + i * 2.1)); if (quiet(tx, ty, W, H)) continue; twinkle(c, tx, ty, u * 2.2 * ts, alpha(p.snow, 0.8)); }
    vignette(c, W, H, deep(p, 0.8), 0.22);
  }, { variants: ['chips', 'pebble', 'paving'], stage: 'band-low' });

  /* =====================================================================================
     sunburst2: rise (a sun coming up behind the floor), corner (a sun in the top corner), swirl (a slow pinwheel)
     ===================================================================================== */
  function fanRays(c, ox, oy, a0, a1, n, r, col, t, wob) {
    var i; c.fillStyle = col; c.beginPath();
    for (i = 0; i < n; i += 2) { var x1 = a0 + (a1 - a0) * i / n + Math.sin(t * 0.45 + i * 1.3) * wob, x2 = a0 + (a1 - a0) * (i + 1) / n + Math.sin(t * 0.45 + (i + 1) * 1.3) * wob; c.moveTo(ox, oy); c.lineTo(ox + Math.cos(x1) * r, oy + Math.sin(x1) * r); c.lineTo(ox + Math.cos(x2) * r, oy + Math.sin(x2) * r); c.closePath(); }
    c.fill();
  }
  function sunDisc(c, x, y, r, p, u, k) {
    K.glow(c, x, y, r * 3.2, p.gold, 0.4); dot(c, x, y, r * 1.36 + k * u * 0.5, alpha(p.paper, 0.3)); dot(c, x, y, r * 1.16, alpha(p.gold, 0.55)); dot(c, x, y, r, p.gold); dot(c, x, y, r * 0.72, shade(p.gold, 0.28)); dot(c, x - r * 0.2, y - r * 0.24, r * 0.3, 'rgba(255,255,255,0.35)');
  }
  function dashRing(c, x, y, r, u, col) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = u * 0.45; c.setLineDash([u * 0.5, u * 2.6]); c.lineCap = 'round'; c.strokeStyle = col; c.stroke(); c.setLineDash([]); }
  Art.add('backdrop', 'sunburst2', function (c, W, H, t, p, o, u) {
    var v = o.variant, d = dk(p), i, fy = H * FY, R = Math.hypot(W, H), a = p.bg, b = second(p, d ? 0.5 : 0.62, 0.12), k = Math.exp(-4 * o.beat), R0 = rnd(o.seed + 's2');
    if (v === 'swirl') {
      var cx = W / 2, cy = H * 0.4, n = 14, rot = t * 0.035, j, steps = 14, tw = 1.25;
      c.fillStyle = a; c.fillRect(0, 0, W, H);
      c.fillStyle = b; c.beginPath();
      for (i = 0; i < n; i += 2) { c.moveTo(cx, cy);
        for (j = 1; j <= steps; j++) { var r1 = R * j / steps, a1 = rot + i / n * TAU + tw * j / steps; c.lineTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1); }
        for (j = steps; j >= 1; j--) { var r2 = R * j / steps, a2 = rot + (i + 1) / n * TAU + tw * j / steps; c.lineTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2); }
        c.closePath(); }
      c.fill();
      c.lineWidth = u * 0.35; c.strokeStyle = alpha(p.gold, 0.7); c.beginPath(); /* a gold seam down one side of every blade */
      for (i = 0; i < n; i += 2) { c.moveTo(cx, cy); for (j = 1; j <= steps; j++) { var r3 = R * j / steps, a3 = rot + i / n * TAU + tw * j / steps; c.lineTo(cx + Math.cos(a3) * r3, cy + Math.sin(a3) * r3); } }
      c.stroke();
      for (i = 0; i < 3; i++) dashRing(c, cx, cy, u * (52 + i * 17 + k * 0.8), u, alpha(p.paper, 0.5 - i * 0.1));
      for (i = 0; i < 16; i++) { var an = R0() * TAU + t * 0.05, rr = u * (50 + R0() * 60), sx = cx + Math.cos(an) * rr, sy = cy + Math.sin(an) * rr * 1.15, ss = u * (1.2 + R0() * 1.8) * (0.8 + 0.3 * Math.sin(t * 2 + i)); if (sy > fy - u * 3) continue; if (i % 2) twinkle(c, sx, sy, ss * 1.5, [p.gold, p.paper][i % 4 > 1 ? 1 : 0]); else dot(c, sx, sy, ss * 0.5, [p.accent, p.accent2][i % 4 > 1 ? 1 : 0]); }
      calm(c, W, H, mix(a, b, 0.5), 0.6);
      ground(c, W, H, u, p, { a: 0.72 });
      soft(c, W / 2, fy + u * 2, W * 0.6, u * 9, p.gold, 0.16);
      vignette(c, W, H, deep(p, 0.8), 0.3);
      return;
    }
    if (v === 'corner') {
      var ox = -u * 3, oy = -u * 3, sr = Math.min(W, H) * 0.2;
      c.fillStyle = a; c.fillRect(0, 0, W, H);
      fanRays(c, ox, oy, -0.06, PI / 2 + 0.06, 15, R * 1.1, b, t, 0.012);
      c.strokeStyle = alpha(p.gold, 0.55); c.lineWidth = u * 0.3; c.beginPath(); for (i = 0; i <= 15; i += 2) { var la = -0.06 + (PI / 2 + 0.12) * i / 15 + Math.sin(t * 0.45 + i * 1.3) * 0.012; c.moveTo(ox, oy); c.lineTo(ox + Math.cos(la) * R * 1.1, oy + Math.sin(la) * R * 1.1); } c.stroke();
      for (i = 0; i < 4; i++) dashRing(c, ox, oy, sr * (1.75 + i * 0.75) + k * u * 0.8, u, alpha(p.paper, 0.55 - i * 0.1));
      sunDisc(c, ox, oy, sr, p, u, k);
      for (i = 0; i < 12; i++) { var an2 = 0.1 + R0() * (PI / 2 - 0.2), r4 = sr * (2 + R0() * 3.4), x = ox + Math.cos(an2) * r4, y = oy + Math.sin(an2) * r4, s = u * (1.4 + R0() * 2) * (0.8 + 0.3 * Math.sin(t * 2.2 + i * 1.7)); if (quiet(x, y, W, H) || y > fy - u * 4) continue; if (i % 3 === 0) twinkle(c, x, y, s * 1.5, p.paper); else if (i % 3 === 1) dot(c, x, y, s * 0.5, p.accent); else { K.ringStroke(c, x, y, s * 0.7, u * 0.4, p.gold); } }
      calm(c, W, H, mix(a, b, 0.5), 0.55);
      ground(c, W, H, u, p, { a: 0.7 });
      c.save(); c.beginPath(); c.rect(0, fy, W, H - fy); c.clip(); fanRays(c, ox, fy - (fy - oy) * 0.25, 0.05, PI / 2 - 0.4, 9, R, alpha(p.gold, 0.07), t, 0.012); c.restore();   /* the light falls across the floor too */
      vignette(c, W, H, deep(p, 0.8), 0.28);
      return;
    }
    /* rise */
    var sx2 = W / 2, sr2 = Math.min(W, H) * 0.17;
    vgrad(c, W, H, [a, mix(a, p.bg2, 0.2)], 0, fy);
    fanRays(c, sx2, fy, PI - 0.02, TAU + 0.02, 19, R, b, t, 0.01);
    c.strokeStyle = alpha(p.gold, 0.5); c.lineWidth = u * 0.3; c.beginPath(); for (i = 1; i < 19; i++) { var lb = PI - 0.02 + (PI + 0.04) * i / 19 + Math.sin(t * 0.45 + i * 1.3) * 0.01; c.moveTo(sx2, fy); c.lineTo(sx2 + Math.cos(lb) * R, fy + Math.sin(lb) * R); } c.stroke();
    for (i = 0; i < 4; i++) dashRing(c, sx2, fy, sr2 * (1.7 + i * 0.85) + k * u * 0.8, u, alpha(p.paper, 0.55 - i * 0.1));
    for (i = 0; i < 14; i++) { var an3 = PI + 0.08 + R0() * (PI - 0.16), r5 = sr2 * (2 + R0() * 4), x2 = sx2 + Math.cos(an3) * r5, y2 = fy + Math.sin(an3) * r5, s2 = u * (1.4 + R0() * 2) * (0.8 + 0.3 * Math.sin(t * 2.2 + i * 1.7)); if (quiet(x2, y2, W, H)) continue; if (i % 3 === 0) twinkle(c, x2, y2, s2 * 1.5, p.paper); else if (i % 3 === 1) dot(c, x2, y2, s2 * 0.5, p.accent); else K.ringStroke(c, x2, y2, s2 * 0.7, u * 0.4, p.gold); }
    calm(c, W, H, mix(a, b, 0.5), 0.5);
    sunDisc(c, sx2, fy, sr2, p, u, k);
    var fl = deep(p, 0.5); ground(c, W, H, u, p, { col: fl, a: 1, lineCol: p.gold, line: 0.9 });
    soft(c, sx2, fy, W * 0.55, u * 12, p.gold, 0.4);
    c.fillStyle = alpha(p.gold, 0.3); for (i = 0; i < 7; i++) { var z = (i + 0.5) / 7, ry = fy + (H - fy) * z * z + u * 1.2, rw = sr2 * (1.9 - z * 0.9) * (1 + 0.06 * Math.sin(t * 1.6 + i * 1.4)); c.fillRect(sx2 - rw, ry, rw * 2, u * (0.35 + z * 0.5)); }   /* its light on the floor */
    vignette(c, W, H, deep(p, 0.8), 0.3);
  }, { variants: ['rise', 'corner', 'swirl'], stage: 'band-low' });

  /* =====================================================================================
     watercolor: wash (a sky wash over wet paper), blooms (colour blooming in from the corners), strokes (broad brush strokes)
     ===================================================================================== */
  function wblob(c, x, y, rx, ry, ph, col, a, u, t) { /* a pool of paint: three thinning layers and a darker tide line */
    var k, i, N = 60;
    for (k = 0; k < 3; k++) { var s = 1 - k * 0.17; c.beginPath();
      for (i = 0; i <= N; i++) { var th = i / N * TAU, r = s * (1 + 0.1 * Math.sin(th * 3 + ph + k * 0.8) + 0.06 * Math.sin(th * 5 - ph * 1.7 + k * 2 + t * 0.25) + 0.03 * Math.sin(th * 11 + ph * 2.3)), px = x + Math.cos(th) * rx * r, py = y + Math.sin(th) * ry * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
      c.closePath(); c.fillStyle = alpha(col, a); c.fill(); if (!k) { c.lineWidth = u * 0.35; c.strokeStyle = alpha(col, a * 1.1); c.stroke(); } }
  }
  function wband(c, W, y0, y1, ph, col, a, u, t, rag) { /* a wash right across: wobbling top and bottom edges */
    var i, N = 40, k;
    for (k = 0; k < 2; k++) { c.beginPath();
      for (i = 0; i <= N; i++) { var x = -u * 2 + (W + u * 4) * i / N, y = y0 + k * u * 1.6 + (Math.sin(i * 0.55 + ph + k) * 0.6 + Math.sin(i * 1.3 - ph * 2 + t * 0.2) * 0.4) * rag; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      for (i = N; i >= 0; i--) { var x2 = -u * 2 + (W + u * 4) * i / N, y2 = y1 - k * u * 1.6 + (Math.sin(i * 0.47 + ph * 3 + k) * 0.6 + Math.sin(i * 1.1 + ph) * 0.4) * rag; c.lineTo(x2, y2); }
      c.closePath(); c.fillStyle = alpha(col, a); c.fill(); if (!k) { c.lineWidth = u * 0.35; c.strokeStyle = alpha(col, a * 0.9); c.stroke(); } }
  }
  function splatter(c, W, H, u, seed, cols, n, ymax) { var R0 = rnd(seed + 'spl'), i, q; for (q = 0; q < cols.length; q++) { c.fillStyle = cols[q]; c.beginPath(); for (i = 0; i < n; i++) { var x = R0() * W, y = R0() * ymax, r = u * (0.15 + R0() * R0() * 0.9); if (quiet(x, y, W, H)) continue; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.fill(); } }
  function grain(c, W, H, u, seed, col) { var R0 = rnd(seed + 'gr'), i, n = Math.round(W * H / (u * u) / 55); c.fillStyle = col; c.beginPath(); for (i = 0; i < n; i++) { var x = R0() * W, y = R0() * H; c.rect(x, y, u * (0.3 + R0() * 0.9), u * 0.14); } c.fill(); }
  Art.add('backdrop', 'watercolor', function (c, W, H, t, p, o, u) {
    var v = o.variant, d = dk(p), i, fy = H * FY, R0 = rnd(o.seed + 'wc'), paper = d ? mix(p.bg, '#05040c', 0.3) : mix(p.paper, p.bg2, 0.3),
      w1 = d ? shade(p.bg, 0.22) : p.bg, w2 = d ? shade(p.bg2, 0.25) : mix(p.bg2, p.accent, 0.3), k = d ? 1.25 : 1, br = 1 + 0.012 * Math.sin(t * 0.7), m = Math.min(W, H);
    c.fillStyle = paper; c.fillRect(0, 0, W, H);
    if (v === 'blooms') {
      var spots = [[0.02, 0.03, 0.5, p.accent], [0.98, 0.02, 0.46, w1], [0.0, 0.42, 0.3, p.gold], [1.0, 0.4, 0.34, p.accent2], [0.3, -0.02, 0.3, p.gold], [0.72, -0.03, 0.32, p.accent], [0.02, 0.66, 0.26, w1], [0.99, 0.63, 0.28, p.gold]];
      for (i = 0; i < spots.length; i++) { var s = spots[i], rr = m * s[2] * br; wblob(c, W * s[0], H * s[1], rr, rr * (0.8 + 0.25 * R0()), i * 1.9 + R0() * 6, s[3], 0.17 * k, u, t); }
      for (i = 0; i < 6; i++) { var bx = i % 2 ? W * (0.9 + R0() * 0.08) : W * (0.02 + R0() * 0.08), by = H * (0.08 + R0() * 0.55), r2 = u * (3 + R0() * 4); wblob(c, bx, by, r2, r2, i * 2.7, [p.accent, p.gold, p.accent2][i % 3], 0.2 * k, u, t); }   /* small back-runs */
      splatter(c, W, H, u, o.seed, [alpha(p.accent, 0.5), alpha(p.gold, 0.6), alpha(p.accent2, 0.5)], 26, fy);
    } else if (v === 'strokes') {
      var n = 7, cols = [w1, p.accent, w2, p.gold, w1, p.accent2, w1];
      for (i = 0; i < n; i++) { var y = fy * (i + 0.5) / n, hh = fy / n * 0.74, mid = Math.abs((i + 0.5) / n - 0.56) < 0.3, a = (mid ? 0.12 : 0.3) * k * (d ? 1.5 : 1), x0 = (i % 2 ? -0.02 : 0.04) * W, x1 = (i % 2 ? 0.95 : 1.03) * W, j, col = cols[i], dir = i % 2 ? -1 : 1, N = 26, kk;
        for (kk = 0; kk < 2; kk++) { c.beginPath();
          for (j = 0; j <= N; j++) { var px = x0 + (x1 - x0) * j / N, py = y - hh / 2 + kk * u * 1.1 + Math.sin(j * 0.7 + i * 2 + kk) * u * 0.7 + (j / N - 0.5) * dir * u * 2.2; if (j) c.lineTo(px, py); else c.moveTo(px, py); }
          for (j = N; j >= 0; j--) { var px2 = x0 + (x1 - x0) * j / N, py2 = y + hh / 2 - kk * u * 1.1 + Math.sin(j * 0.6 + i * 3.1 + kk) * u * 0.8 + (j / N - 0.5) * dir * u * 2.2; c.lineTo(px2, py2); }
          c.closePath(); c.fillStyle = alpha(col, a); c.fill(); }
        c.strokeStyle = alpha(paper, 0.5); c.lineWidth = u * 0.3; c.beginPath(); /* dry bristle marks where the brush ran out */
        for (j = 0; j < 7; j++) { var by2 = y - hh * 0.4 + hh * 0.8 * (j + R0() * 0.6) / 7, ex = i % 2 ? x0 : x1, len = W * (0.1 + R0() * 0.16) * (i % 2 ? 1 : -1); c.moveTo(ex + len, by2 + (i % 2 ? -1 : 1) * dir * u * 0.8); c.lineTo(ex, by2 + dir * u * (i % 2 ? -1.1 : 1.1)); }
        c.stroke(); }
      splatter(c, W, H, u, o.seed, [alpha(p.accent, 0.45), alpha(w1, 0.6)], 22, fy);
    } else { /* wash */
      wband(c, W, -u * 4, H * 0.2 * br, 1.3, w1, 0.3 * k, u, t, u * 2.6);
      wband(c, W, -u * 4, H * 0.31 * br, 4.1, w1, 0.16 * k, u, t, u * 3.4);
      wband(c, W, H * 0.5, fy + u * 2, 2.2, w2, 0.1 * k, u, t, u * 3);
      wblob(c, W * 0.03, H * 0.12, m * 0.3 * br, m * 0.36, 0.8, p.accent2, 0.15 * k, u, t); wblob(c, W * 0.98, H * 0.2, m * 0.28, m * 0.4 * br, 2.9, p.accent, 0.15 * k, u, t);
      wblob(c, W * 0.0, H * 0.55, m * 0.2, m * 0.3, 4.4, p.gold, 0.16 * k, u, t); wblob(c, W * 1.0, H * 0.56, m * 0.19 * br, m * 0.26, 5.9, w1, 0.2 * k, u, t);
      wblob(c, W * 0.8, H * 0.045, m * 0.13, m * 0.1, 3.3, p.gold, 0.3 * k, u, t);    /* a pale sun bleeding into the sky */
      splatter(c, W, H, u, o.seed, [alpha(w1, 0.6), alpha(p.accent, 0.4)], 22, fy);
    }
    calm(c, W, H, paper, 0.5);
    /* the ground: a darker wash pooled along the bottom */
    var g1 = d ? mix(p.bg2, p.accent2, 0.35) : mix(p.accent2, p.ink, 0.25), g2 = d ? shade(g1, -0.3) : mix(g1, p.ink, 0.35);
    wband(c, W, fy, H + u * 6, 0.7, g1, 0.5, u, t, u * 1.3); wband(c, W, fy + (H - fy) * 0.34, H + u * 6, 3.7, g2, 0.42, u, t, u * 1.8); wband(c, W, fy + (H - fy) * 0.7, H + u * 6, 5.2, g2, 0.4, u, t, u * 2);
    c.strokeStyle = alpha(d ? p.snow : paper, 0.5); c.lineWidth = u * 0.3; c.beginPath(); for (i = 0; i < 9; i++) { var gx = (i + 0.2 + R0() * 0.6) / 9 * W, gy = fy + u * (3.5 + R0() * 3), gl = u * (4 + R0() * 8); c.moveTo(gx, gy); c.lineTo(gx + gl, gy + u * 0.3); } c.stroke();
    grain(c, W, H, u, o.seed, d ? 'rgba(255,255,255,0.05)' : 'rgba(90,70,50,0.07)');
    vignette(c, W, H, d ? '#05040c' : mix(p.paper, p.ink, 0.5), d ? 0.35 : 0.14);
  }, { variants: ['wash', 'blooms', 'strokes'], stage: 'band-low' });

  /* =====================================================================================
     mesh: drift (colour drifting corner to corner), halo (a ring of colour round a pale middle), tide (soft layered bands)
     ===================================================================================== */
  Art.add('backdrop', 'mesh', function (c, W, H, t, p, o, u) {
    var v = o.variant, d = dk(p), i, fy = H * FY, m = Math.max(W, H), s = Math.min(W, H), B, R0 = rnd(o.seed + 'ms'), aa = d ? 0.62 : 0.7;
    function mv(i2, amp) { return Math.sin(t * (0.21 + i2 * 0.037) + i2 * 2.1) * amp; }
    if (v === 'halo') {
      c.fillStyle = mix(p.bg2, d ? p.bg : p.paper, 0.4); c.fillRect(0, 0, W, H);
      B = [[0.0, 0.02, 0.8, p.bg], [1.0, 0.04, 0.72, p.accent], [1.02, 0.5, 0.6, p.gold], [-0.02, 0.48, 0.62, p.accent2], [0.5, -0.08, 0.6, mix(p.bg, p.accent, 0.5)], [0.02, 0.86, 0.7, p.accent], [0.98, 0.9, 0.72, p.bg]];
      for (i = 0; i < B.length; i++) soft(c, W * B[i][0] + mv(i, u * 5), H * B[i][1] + mv(i + 3, u * 5), s * B[i][2], s * B[i][2], B[i][3], aa);
      soft(c, W / 2, H * 0.4, W * 0.6, H * 0.34, d ? shade(p.bg2, 0.2) : p.paper, d ? 0.3 : 0.6);
    } else if (v === 'tide') {
      vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.6), p.bg2]);
      B = [[0.2, 0.03, p.accent], [0.85, 0.16, p.gold], [0.1, 0.33, p.bg2], [0.9, 0.47, p.accent2], [0.15, 0.6, p.bg], [0.75, 0.72, p.accent], [0.3, 0.9, p.gold]];
      for (i = 0; i < B.length; i++) soft(c, W * B[i][0] + mv(i, u * 9), H * B[i][1] + mv(i + 2, u * 2.5), W * 1.05, H * 0.11, B[i][2], aa * 0.82);
    } else {
      vgrad(c, W, H, [p.bg, p.bg2]);
      B = [[0.05, 0.05, 0.85, p.accent], [0.45, 0.28, 0.6, p.bg2], [0.98, 0.22, 0.7, p.accent2], [0.0, 0.62, 0.7, p.gold], [0.62, 0.62, 0.6, p.bg], [1.0, 0.92, 0.85, p.accent]];
      for (i = 0; i < B.length; i++) soft(c, W * B[i][0] + mv(i, u * 6), H * B[i][1] + mv(i + 4, u * 6), s * B[i][2], s * B[i][2], B[i][3], aa);
      soft(c, W / 2, H * 0.4, W * 0.55, H * 0.3, d ? p.bg2 : p.paper, d ? 0.2 : 0.3);
    }
    /* fine detail so it is not just a blur: hairline rings at the edges and a little dust */
    c.lineWidth = Math.max(1, u * 0.16); c.strokeStyle = alpha(p.snow, 0.26); c.beginPath();
    for (i = 0; i < 5; i++) { var rx = (i % 2 ? 1.02 : -0.02) * W, ry = H * (0.08 + i * 0.14), rr = s * (0.16 + i * 0.045) + mv(i, u * 1.2), j; for (j = 0; j < 3; j++) { c.moveTo(rx + rr + j * u * 2.2, ry); c.arc(rx, ry, rr + j * u * 2.2, 0, TAU); } }
    c.stroke();
    for (i = 0; i < 26; i++) { var x = R0() * W, y = R0() * fy, tw = 0.5 + 0.5 * Math.sin(t * (0.8 + R0() * 1.4) + i * 1.9), r = u * (0.25 + R0() * 0.4); if (quiet(x, y, W, H)) continue; if (i % 5 === 0) twinkle(c, x, y, u * 2 * tw, alpha(p.snow, 0.85)); else dot(c, x, y, r, alpha(p.snow, 0.25 + 0.5 * tw)); }
    /* the floor: a glassy shelf with a shadow under its lip */
    var fl = d ? mix(p.bg, '#05040c', 0.6) : mix(p.bg, p.ink, 0.6);
    vgrad2(c, 0, fy, W, H - fy, alpha(fl, 0.42), alpha(fl, 0.72)); vgrad2(c, 0, fy, W, u * 7, alpha(shade(fl, -0.6), 0.36), alpha(shade(fl, -0.6), 0));
    Rn(c, 0, fy - u * 0.3, W, u * 0.6, 0, alpha(p.snow, 0.6)); Rn(c, 0, fy + u * 1.5, W, u * 0.16, 0, alpha(p.snow, 0.22));
    soft(c, W / 2 + mv(1, u * 8), fy + u * 3, W * 0.5, u * 6, p.snow, 0.16);
    vignette(c, W, H, d ? '#05040c' : mix(p.bg, p.ink, 0.7), 0.24);
  }, { variants: ['drift', 'halo', 'tide'], stage: 'band-low' });

  /* =====================================================================================
     artdecofan: scales (the classic fan scale, gold on colour), grand (great fans in the corners, stepped pilasters, a marble floor)
     ===================================================================================== */
  function bigFan(c, ox, oy, r, a0, a1, n, colA, colB, line, u) {
    var i, q;
    for (q = 0; q < 2; q++) { c.fillStyle = q ? colB : colA; c.beginPath(); for (i = q; i < n; i += 2) { var x1 = a0 + (a1 - a0) * i / n, x2 = a0 + (a1 - a0) * (i + 1) / n; c.moveTo(ox, oy); c.arc(ox, oy, r, x1, x2); c.closePath(); } c.fill(); }
    c.strokeStyle = line; c.lineWidth = u * 0.4; c.beginPath();
    for (i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r); }
    for (i = 1; i <= 3; i++) { var rr = r * (0.34 + i * 0.22); c.moveTo(ox + Math.cos(a0) * rr, oy + Math.sin(a0) * rr); c.arc(ox, oy, rr, a0, a1); }
    c.stroke();
    c.lineWidth = u * 0.8; c.beginPath(); c.arc(ox, oy, r, a0, a1); c.stroke(); c.beginPath(); c.arc(ox, oy, r * 0.2, a0, a1); c.lineTo(ox, oy); c.closePath(); c.fillStyle = line; c.fill();
    for (i = 0; i < n; i++) { var am = a0 + (a1 - a0) * (i + 0.5) / n; dot(c, ox + Math.cos(am) * r * 1.06, oy + Math.sin(am) * r * 1.06, u * 0.7, line); }
  }
  function decoFloor(c, W, H, u, p, t) { /* dark polished floor: a gold frieze of little fans along its edge, inlaid lines, a sheen */
    var fy = H * FY, fl = dk(p) ? mix(p.bg, '#05040c', 0.62) : mix(p.bg, p.ink, 0.72), i, r = u * 2.7, n = Math.ceil(W / (r * 2)) + 1, x0 = W / 2 - n * r;
    ground(c, W, H, u, p, { col: fl, a: 1, line: 0 });
    c.strokeStyle = alpha(p.gold, 0.4); c.lineWidth = Math.max(1, u * 0.2); c.beginPath(); for (i = -9; i <= 9; i++) { c.moveTo(W / 2 + i * W * 0.085, fy + u * 4.4); c.lineTo(W / 2 + i * W * 0.2, H); } for (i = 1; i < 4; i++) { var y = fy + u * 4.4 + (H - fy - u * 4.4) * i * i / 16 * 1.4; c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
    soft(c, W / 2, fy + (H - fy) * 0.55, W * 0.6, (H - fy) * 0.4, p.gold, 0.1 + 0.03 * Math.sin(t * 0.8));
    Rn(c, 0, fy, W, u * 4.2, 0, shade(fl, dk(p) ? 0.1 : 0.14));
    c.strokeStyle = p.gold; c.lineWidth = u * 0.32; c.beginPath(); for (i = 0; i < n; i++) { var cx = x0 + i * r * 2 + r; c.moveTo(cx + r, fy + u * 3.6); c.arc(cx, fy + u * 3.6, r, 0, PI, true); c.moveTo(cx + r * 0.62, fy + u * 3.6); c.arc(cx, fy + u * 3.6, r * 0.62, 0, PI, true); c.moveTo(cx + r * 0.26, fy + u * 3.6); c.arc(cx, fy + u * 3.6, r * 0.26, 0, PI, true); } c.stroke();
    Rn(c, 0, fy - u * 0.35, W, u * 0.7, 0, p.gold); Rn(c, 0, fy - u * 0.35, W, u * 0.2, 0, 'rgba(255,255,255,0.5)'); Rn(c, 0, fy + u * 3.6, W, u * 0.5, 0, p.gold); Rn(c, 0, fy + u * 4.4, W, u * 0.16, 0, alpha(p.gold, 0.7));
  }
  Art.add('backdrop', 'artdecofan', function (c, W, H, t, p, o, u) {
    var v = o.variant, d = dk(p), i, j, fy = H * FY, k = Math.exp(-4 * o.beat), a = d ? p.bg : mix(p.bg, p.ink, 0.12), b = d ? shade(p.bg, 0.08) : mix(p.bg, p.bg2, 0.2), gold = p.gold;
    if (v === 'grand') {
      var s = Math.min(W, H), fr = s * 0.36, pw = u * 6.5;
      vgrad(c, W, H, [a, mix(a, p.bg2, d ? 0.25 : 0.4)], 0, fy);
      c.fillStyle = alpha(b, 0.6); for (i = 0; i * u * 6 < W; i += 2) c.fillRect(i * u * 6, 0, u * 6, fy);      /* a faint panelled wall */
      c.strokeStyle = alpha(gold, 0.2); c.lineWidth = Math.max(1, u * 0.16); c.beginPath(); for (i = 1; i * u * 6 < W; i++) { c.moveTo(i * u * 6, 0); c.lineTo(i * u * 6, fy); } c.stroke();
      calm(c, W, H, mix(a, b, 0.5), 0.7);
      bigFan(c, W / 2, fy, s * 0.3, PI, TAU, 12, mix(a, p.accent, 0.5), mix(a, p.accent2, 0.42), gold, u);   /* a fan rising behind the floor */
      bigFan(c, 0, 0, fr, 0, PI / 2, 8, mix(a, p.accent, 0.55), mix(a, p.bg2, 0.5), gold, u); bigFan(c, W, 0, fr, PI / 2, PI, 8, mix(a, p.accent, 0.55), mix(a, p.bg2, 0.5), gold, u);
      for (j = 0; j < 2; j++) { var px = j ? W - pw : 0, sg = j ? -1 : 1, y0 = fr * 1.12;   /* stepped pilasters down each side */
        Rn(c, px, y0, pw, fy - y0, 0, mix(a, '#05040c', 0.35)); Rn(c, j ? W - pw * 0.6 : 0, y0 + u * 3, pw * 0.6, fy - y0 - u * 3, 0, mix(a, p.accent2, 0.4)); Rn(c, j ? W - pw * 0.28 : 0, y0 + u * 6, pw * 0.28, fy - y0 - u * 6, 0, mix(a, p.accent, 0.6));
        c.fillStyle = gold; c.fillRect(j ? W - pw - u * 0.35 : pw, y0, u * 0.35, fy - y0); c.fillRect(j ? W - pw * 0.6 - u * 0.2 : pw * 0.6, y0 + u * 3, u * 0.2, fy - y0 - u * 3);
        for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(px + pw / 2 + sg * pw * 0.5, y0 - i * u * 1.6); c.lineTo(px + pw / 2 - sg * pw * 0.5, y0 - i * u * 1.6); c.lineTo(px + pw / 2 - sg * pw * 0.5, y0 - i * u * 1.6 - u * 1); c.lineTo(px + pw / 2 + sg * pw * (0.5 - i * 0.3) + sg * pw * 0.0, y0 - i * u * 1.6 - u * 1); c.closePath(); c.fillStyle = i % 2 ? shade(gold, -0.15) : gold; c.fill(); }
        for (i = 0; i < 6; i++) { var dy = y0 + (fy - y0) * (i + 0.5) / 6, tw = (i + j + o.n) % 3 === 0 ? k : 0, ds = u * (1 + tw * 0.4); c.beginPath(); c.moveTo(px + pw * 0.5 + sg * pw * 0.2, dy - ds * 1.5); c.lineTo(px + pw * 0.5 + sg * pw * 0.2 + ds, dy); c.lineTo(px + pw * 0.5 + sg * pw * 0.2, dy + ds * 1.5); c.lineTo(px + pw * 0.5 + sg * pw * 0.2 - ds, dy); c.closePath(); c.fillStyle = tw > 0.3 ? shade(gold, 0.45) : gold; c.fill(); } }
      decoFloor(c, W, H, u, p, t);
      sheen(c, W, H, t, p.snow, 0.1);
      vignette(c, W, H, '#05040c', 0.3);
      return;
    }
    /* scales */
    var r = u * 6.6, nx = Math.ceil(W / (r * 2)) + 2, ny = Math.ceil((fy + r) / r) + 1, x0 = W / 2 - nx * r, q, line = alpha(gold, 0.62);
    c.fillStyle = a; c.fillRect(0, 0, W, H);
    for (j = 0; j < ny; j++) { var y = j * r, off = (j % 2) * r, fill = j % 3 === 0 ? a : j % 3 === 1 ? b : mix(a, p.bg2, d ? 0.22 : 0.34);
      c.beginPath(); for (i = 0; i < nx; i++) { var cx = x0 + off + i * r * 2; c.moveTo(cx + r, y); c.arc(cx, y, r, 0, TAU); } c.fillStyle = fill; c.fill(); c.lineWidth = u * 0.42; c.strokeStyle = line; c.stroke();
      c.beginPath(); for (i = 0; i < nx; i++) { var cx2 = x0 + off + i * r * 2; for (q = 1; q <= 3; q++) { var rr = r * (1 - q * 0.21); c.moveTo(cx2 - rr, y); c.arc(cx2, y, rr, PI, TAU); } for (q = 1; q < 6; q++) { var an = PI + q * PI / 6; c.moveTo(cx2 + Math.cos(an) * r * 0.37, y + Math.sin(an) * r * 0.37); c.lineTo(cx2 + Math.cos(an) * r, y + Math.sin(an) * r); } }
      c.lineWidth = u * 0.2; c.strokeStyle = alpha(gold, 0.45); c.stroke(); }
    c.fillStyle = gold; c.beginPath(); for (j = 1; j < ny; j++) for (i = 0; i < nx; i++) { var px2 = x0 + (j % 2) * r + i * r * 2, py2 = j * r - r, on = (i * 3 + j * 7 + o.n) % 9 === 0, pr = u * (0.5 + (on ? 0.45 * k : 0)); if (quiet(px2, py2, W, H)) continue; c.moveTo(px2, py2 - pr * 1.6); c.lineTo(px2 + pr, py2); c.lineTo(px2, py2 + pr * 1.6); c.lineTo(px2 - pr, py2); c.closePath(); } c.fill();   /* a gold pip on every tip */
    calm(c, W, H, a, 0.74);
    sheen(c, W, H, t, gold, 0.2);
    decoFloor(c, W, H, u, p, t);
    vignette(c, W, H, '#05040c', 0.34);
  }, { variants: ['scales', 'grand'], stage: 'band-low' });

  /* =====================================================================================
     memphis: scatter (shapes tossed round the edges), blocks (big colour blocks and a few shapes), squiggle (a wall of little worms)
     ===================================================================================== */
  function mShape(c, kind, s, col, col2, line, u) { /* one 80s shape at the origin, about s across */
    var i, j;
    switch (kind) {
      case 0: c.beginPath(); c.moveTo(0, -s * 0.55); c.lineTo(s * 0.55, s * 0.42); c.lineTo(-s * 0.55, s * 0.42); c.closePath(); c.fillStyle = col; c.fill(); c.translate(s * 0.14, s * 0.12); c.beginPath(); c.moveTo(0, -s * 0.55); c.lineTo(s * 0.55, s * 0.42); c.lineTo(-s * 0.55, s * 0.42); c.closePath(); c.lineWidth = u * 0.55; c.strokeStyle = line; c.stroke(); break;
      case 1: dot(c, 0, 0, s * 0.46, col); c.beginPath(); c.arc(s * 0.13, s * 0.11, s * 0.46, 0, TAU); c.lineWidth = u * 0.55; c.strokeStyle = line; c.stroke(); break;
      case 2: c.beginPath(); c.moveTo(-s * 0.7, 0); for (i = 0; i < 4; i++) c.quadraticCurveTo(-s * 0.7 + (i + 0.5) * s * 0.35, (i % 2 ? 1 : -1) * s * 0.34, -s * 0.7 + (i + 1) * s * 0.35, 0); c.lineWidth = u * 1.1; c.lineCap = 'round'; c.strokeStyle = line; c.stroke(); break;
      case 3: c.beginPath(); for (i = 0; i <= 6; i++) { if (i) c.lineTo(-s * 0.66 + i * s * 0.22, (i % 2 ? -1 : 1) * s * 0.18); else c.moveTo(-s * 0.66, s * 0.18); } c.lineWidth = u * 1; c.lineJoin = 'miter'; c.lineCap = 'butt'; c.strokeStyle = col; c.stroke(); c.lineJoin = 'round'; c.lineCap = 'round'; break;
      case 4: c.fillStyle = line; c.beginPath(); for (j = 0; j < 4; j++) for (i = 0; i < 4; i++) { var x = (i - 1.5) * s * 0.26, y = (j - 1.5) * s * 0.26; c.moveTo(x + u * 0.5, y); c.arc(x, y, u * 0.5, 0, TAU); } c.fill(); break;
      case 5: Rn(c, -s * 0.5, -s * 0.15, s, s * 0.3, 0, col); Rn(c, -s * 0.15, -s * 0.5, s * 0.3, s, 0, col); break;
      case 6: c.beginPath(); c.arc(0, 0, s * 0.5, PI, TAU); c.closePath(); c.fillStyle = col; c.fill(); c.save(); c.beginPath(); c.arc(0, s * 0.14, s * 0.5, 0, PI); c.closePath(); c.clip(); c.fillStyle = col2; for (i = -4; i < 5; i += 2) c.fillRect(i * s * 0.11, 0, s * 0.11, s * 0.8); c.restore(); break;
      case 7: Rn(c, -s * 0.42, -s * 0.3, s * 0.84, s * 0.6, 0, col); c.lineWidth = u * 0.55; c.strokeStyle = line; c.strokeRect(-s * 0.3, -s * 0.18, s * 0.84, s * 0.6); break;
      default: c.beginPath(); c.arc(0, 0, s * 0.42, PI * 0.1, PI * 1.25); c.lineWidth = s * 0.2; c.lineCap = 'butt'; c.strokeStyle = col; c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.42, PI * 1.4, PI * 1.9); c.strokeStyle = col2; c.stroke(); c.lineCap = 'round';
    }
  }
  function memphisFloor(c, W, H, u, p, col) { /* a bold floor: a piano-key strip, then a plain colour with a few lines */
    var fy = H * FY, i, ink = dk(p) ? '#0c0a18' : p.ink, sw = u * 2.6, n = Math.ceil(W / sw) + 2;
    ground(c, W, H, u, p, { col: col, a: 1, line: 0 });
    c.strokeStyle = alpha(p.snow, 0.16); c.lineWidth = Math.max(1, u * 0.22); c.beginPath(); for (i = -9; i <= 9; i++) { c.moveTo(W / 2 + i * W * 0.09, fy + u * 3); c.lineTo(W / 2 + i * W * 0.22, H); } for (i = 1; i < 4; i++) { var y = fy + u * 3 + (H - fy - u * 3) * i * i / 16 * 1.4; c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
    Rn(c, 0, fy, W, u * 3, 0, p.paper); c.fillStyle = ink; c.beginPath(); for (i = -1; i < n; i += 2) { c.moveTo(i * sw, fy); c.lineTo(i * sw + sw, fy); c.lineTo(i * sw + sw + u * 1.6, fy + u * 3); c.lineTo(i * sw + u * 1.6, fy + u * 3); c.closePath(); } c.fill();
    Rn(c, 0, fy + u * 3, W, u * 0.7, 0, p.gold); vgrad2(c, 0, fy + u * 3.7, W, u * 5, 'rgba(10,6,20,0.3)', 'rgba(10,6,20,0)');
  }
  Art.add('backdrop', 'memphis', function (c, W, H, t, p, o, u) {
    var v = o.variant, d = dk(p), i, j, fy = H * FY, R0 = rnd(o.seed + 'mp'), ink = d ? p.snow : p.ink, k = Math.exp(-4 * o.beat), cols = [p.accent, p.gold, p.accent2, d ? shade(p.bg2, 0.35) : p.paper, p.accent, p.accent2, p.gold];
    if (v === 'squiggle') {
      var base = d ? mix(p.bg, p.bg2, 0.3) : mix(p.bg2, p.paper, 0.4), cell = u * 6.4, nx = Math.ceil(W / cell) + 1, ny = Math.ceil(fy / cell) + 1, q, lc = [alpha(ink, d ? 0.7 : 0.82), p.accent, p.accent2, p.gold];
      c.fillStyle = base; c.fillRect(0, 0, W, H);
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (q = 0; q < 4; q++) { R0 = rnd(o.seed + 'mp'); c.strokeStyle = lc[q]; c.lineWidth = u * (q ? 1.15 : 0.85); c.beginPath();
        for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) { var jx = R0(), jy = R0(), ro = R0() * PI, pk = Math.floor(R0() * 20), which = pk < 13 ? 0 : pk < 16 ? 1 : pk < 18 ? 2 : 3, x = (i + 0.2 + jx * 0.6) * cell, y = (j + 0.2 + jy * 0.6) * cell, s = cell * 0.36, wig = Math.sin(t * 1.3 + i * 1.9 + j * 1.1) * 0.25, ca = Math.cos(ro + wig * 0.4), sa = Math.sin(ro + wig * 0.4);
          if (which !== q) continue; if (quiet(x, y, W, H) && q) continue;
          c.moveTo(x - ca * s, y - sa * s); c.bezierCurveTo(x - ca * s * 0.4 - sa * s * (0.9 + wig), y - sa * s * 0.4 + ca * s * (0.9 + wig), x + ca * s * 0.4 + sa * s * (0.9 + wig), y + sa * s * 0.4 - ca * s * (0.9 + wig), x + ca * s, y + sa * s); }
        c.stroke(); }
      calm(c, W, H, base, 0.72);
      for (i = 0; i < 8; i++) { var sx = i % 2 ? W - u * (5 + R0() * 9) : u * (5 + R0() * 9), sy = H * (0.07 + (i >> 1) * 0.165 + R0() * 0.04), ss = u * (7 + R0() * 4); c.save(); c.translate(sx, sy); c.rotate(R0() * 1.2 - 0.6 + Math.sin(t * 0.9 + i) * 0.06); dot(c, u * 0.7, u * 0.7, ss * 0.62, alpha(d ? '#05040c' : p.ink, 0.25)); mShape(c, [1, 0, 5, 6, 7, 1, 0, 8][i], ss, cols[i % 7], cols[(i + 2) % 7], ink, u); c.restore(); }
      memphisFloor(c, W, H, u, p, mix(p.accent2, deep(p, 0.7), 0.45));
      vignette(c, W, H, deep(p, 0.85), 0.18);
      return;
    }
    if (v === 'blocks') {
      var bs = d ? mix(p.bg, p.bg2, 0.5) : p.bg2, s = Math.min(W, H);
      c.fillStyle = bs; c.fillRect(0, 0, W, H);
      c.fillStyle = p.bg; c.beginPath(); c.moveTo(0, 0); c.lineTo(W * 0.44, 0); c.lineTo(0, H * 0.3); c.closePath(); c.fill();                      /* a slab of colour, top left */
      dot(c, W, u * 2, s * 0.36, p.accent); K.ringStroke(c, W + u * 2, u * 5, s * 0.36, u * 0.6, ink);                                                    /* a great quarter disc, top right */
      c.fillStyle = p.accent2; c.beginPath(); c.moveTo(0, fy); c.lineTo(0, fy - s * 0.52); c.lineTo(s * 0.3, fy); c.closePath(); c.fill();           /* a tall wedge, bottom left */
      c.strokeStyle = ink; c.lineWidth = u * 0.6; c.beginPath(); c.moveTo(u * 2.4, fy); c.lineTo(u * 2.4, fy - s * 0.52 - u * 1); c.lineTo(s * 0.3 + u * 3, fy); c.stroke();
      c.save(); c.translate(W - u * 9, H * 0.5); c.rotate(-0.2); Rn(c, -u * 9, -u * 14, u * 18, u * 28, 0, p.gold); c.beginPath(); c.rect(-u * 9, -u * 14, u * 18, u * 28); c.clip(); c.fillStyle = alpha(ink, 0.85); for (i = -8; i < 12; i++) { c.beginPath(); c.moveTo(-u * 10, -u * 15 + i * u * 4.4); c.lineTo(u * 10, -u * 21 + i * u * 4.4); c.lineTo(u * 10, -u * 19.4 + i * u * 4.4); c.lineTo(-u * 10, -u * 13.4 + i * u * 4.4); c.closePath(); c.fill(); } c.restore();   /* a striped card, right */
      c.fillStyle = ink; c.beginPath(); for (j = 0; j < 9; j++) for (i = 0; i < 6; i++) { var gx = u * (3.5 + i * 2.7), gy = H * 0.34 + u * (j * 2.7); c.moveTo(gx + u * 0.55, gy); c.arc(gx, gy, u * 0.55, 0, TAU); } c.fill();    /* dot grid, left */
      for (i = 0; i < 9; i++) { var P2 = [[0.2, 0.045, 2, 9], [0.62, 0.03, 3, 9], [0.07, 0.24, 1, 8], [0.93, 0.3, 5, 6], [0.88, 0.66, 8, 9], [0.36, 0.02, 5, 4], [0.9, 0.2, 2, 7], [0.1, 0.655, 3, 8], [0.74, 0.075, 0, 6]][i];
        c.save(); c.translate(W * P2[0], H * P2[1] + Math.sin(t * 1.1 + i * 1.7) * u * 0.6); c.rotate((i % 3 - 1) * 0.35 + Math.sin(t * 0.8 + i) * 0.07); c.scale(1 + 0.05 * k * (i % 2), 1 + 0.05 * k * (i % 2)); mShape(c, P2[2], u * P2[3], cols[(i + 1) % 7], cols[(i + 3) % 7], ink, u); c.restore(); }
      calm(c, W, H, bs, 0.5);
      memphisFloor(c, W, H, u, p, mix(p.bg, deep(p, 0.75), 0.5));
      vignette(c, W, H, deep(p, 0.85), 0.16);
      return;
    }
    /* scatter */
    var b2 = p.bg, cw = u * 16.5, mx = Math.ceil(W / cw), my = Math.ceil(fy / cw), kind = 0;
    cw = W / mx; var chh = fy / my;
    vgrad(c, W, H, [shade(b2, d ? 0.06 : 0.1), b2]);
    c.fillStyle = alpha(p.snow, d ? 0.07 : 0.16); c.beginPath(); for (j = 0; j * u * 4 < fy; j++) for (i = 0; i * u * 4 < W; i++) { c.moveTo(i * u * 4 + u * 2.3, j * u * 4 + u * 2); c.arc(i * u * 4 + u * 2, j * u * 4 + u * 2, u * 0.3, 0, TAU); } c.fill();   /* a faint dot grid behind */
    for (j = 0; j < my; j++) for (i = 0; i < mx; i++) { var x2 = (i + 0.28 + R0() * 0.44) * cw, y2 = (j + 0.28 + R0() * 0.44) * chh, rot = R0() * TAU, sz = u * (6.5 + R0() * 4.5), ci = Math.floor(R0() * 7); kind = (kind + 1 + Math.floor(R0() * 3)) % 9;
      if (quiet(x2, y2, W, H)) { if ((i + j) % 2) continue; sz *= 0.42; }
      c.save(); c.translate(x2, y2 + Math.sin(t * 1.1 + i * 1.7 + j) * u * 0.5); c.rotate((kind === 4 || kind === 5 ? rot * 0.15 : rot) + Math.sin(t * 0.8 + i + j * 2) * 0.08); if ((i + j + o.n) % 4 === 0) c.scale(1 + 0.06 * k, 1 + 0.06 * k); mShape(c, kind, sz, cols[ci], cols[(ci + 2) % 7], ink, u); c.restore(); }
    calm(c, W, H, b2, 0.5);
    memphisFloor(c, W, H, u, p, mix(p.bg, deep(p, 0.75), 0.55));
    vignette(c, W, H, deep(p, 0.85), 0.2);
  }, { variants: ['scatter', 'blocks', 'squiggle'], stage: 'band-low' });

  /* =====================================================================================
     gingham: picnic (the classic small check), bias (cut on the diagonal), buffalo (a big bold check)
     ===================================================================================== */
  function check(c, W, H, s, col, a, ang) { /* woven check: crossing bands, darker where they cross */
    var D = Math.hypot(W, H) / 2 + s * 2, n = Math.ceil(D / s) + 1, i;
    c.save(); c.translate(W / 2, H / 2); c.rotate(ang); c.fillStyle = alpha(col, a);
    for (i = -n; i < n; i += 2) c.fillRect(i * s, -D, s, D * 2);
    for (i = -n; i < n; i += 2) c.fillRect(-D, i * s, D * 2, s);
    c.restore();
  }
  function weave(c, W, H, u, a) { c.save(); c.globalAlpha = a; c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, u * 0.2); c.beginPath(); var i, dd = u * 1.25; for (i = -H; i < W; i += dd) { c.moveTo(i, 0); c.lineTo(i + H, H); } c.stroke(); c.restore(); }
  function hem(c, W, H, u, p, col, t) { /* the cloth's hem: a folded band, a row of stitches and ric-rac trim, with the floor under it */
    var fy = H * FY, i, n = Math.ceil(W / (u * 2.4)) + 1, a = u * 0.8;
    ground(c, W, H, u, p, { col: col, a: 0.6, line: 0 });
    Rn(c, 0, fy - u * 1.9, W, u * 3.8, 0, alpha(col, 0.5)); Rn(c, 0, fy - u * 1.9, W, u * 0.3, 0, 'rgba(255,255,255,0.4)'); Rn(c, 0, fy + u * 1.9, W, u * 0.35, 0, 'rgba(10,6,20,0.25)');
    c.beginPath(); c.moveTo(-u, fy); for (i = 0; i < n; i++) c.quadraticCurveTo(-u + (i + 0.5) * u * 2.4, fy + (i % 2 ? a : -a) * 1.6 * (1 + 0.08 * Math.sin(t * 1.4 + i * 0.5)), -u + (i + 1) * u * 2.4, fy);
    c.lineWidth = u * 1.15; c.lineCap = 'round'; c.strokeStyle = 'rgba(10,6,20,0.22)'; c.save(); c.translate(0, u * 0.3); c.stroke(); c.restore(); c.strokeStyle = p.paper; c.stroke(); c.lineWidth = u * 0.25; c.strokeStyle = alpha(p.gold, 0.9); c.stroke();
    c.setLineDash([u * 1.1, u * 0.9]); c.lineCap = 'butt'; c.lineWidth = u * 0.3; c.strokeStyle = alpha(p.paper, 0.85); c.beginPath(); c.moveTo(0, fy - u * 1.35); c.lineTo(W, fy - u * 1.35); c.moveTo(0, fy + u * 1.4); c.lineTo(W, fy + u * 1.4); c.stroke(); c.setLineDash([]); c.lineCap = 'round';
  }
  Art.add('backdrop', 'gingham', function (c, W, H, t, p, o, u) {
    var v = o.variant, d = dk(p), base, col, fl;
    if (v === 'buffalo') { base = p.accent; col = d ? '#0c0a18' : p.ink; c.fillStyle = base; c.fillRect(0, 0, W, H); check(c, W, H, Math.max(W, H) / (W > H * 0.8 ? 7 : 11), col, 0.42, 0); calm(c, W, H, mix(base, col, 0.4), 0.5); fl = mix(base, col, 0.7); }
    else if (v === 'bias') { base = d ? mix(p.bg, p.paper, 0.14) : mix(p.paper, p.bg2, 0.3); col = d ? shade(p.accent2, 0.1) : p.accent2; c.fillStyle = base; c.fillRect(0, 0, W, H); check(c, W, H, u * 5.2, col, 0.46, PI / 4); calm(c, W, H, mix(base, col, 0.4), 0.55); fl = mix(col, deep(p, 0.8), 0.55); }
    else { base = d ? mix(p.bg, p.paper, 0.14) : mix(p.paper, p.bg2, 0.3); col = p.accent; c.fillStyle = base; c.fillRect(0, 0, W, H); check(c, W, H, u * 5.6, col, 0.46, 0); calm(c, W, H, mix(base, col, 0.4), 0.55); fl = mix(col, deep(p, 0.8), 0.55); }
    weave(c, W, H, u, 0.08);
    soft(c, W * (0.3 + 0.1 * Math.sin(t * 0.3)), H * 0.2, W * 0.8, H * 0.3, p.snow, 0.1 + 0.03 * Math.sin(t * 0.7));     /* light moving over the cloth */
    hem(c, W, H, u, p, fl, t);
    vignette(c, W, H, deep(p, 0.85), 0.26);
  }, { variants: ['picnic', 'bias', 'buffalo'], stage: 'band-low' });

  /* =====================================================================================
     floralpattern: ditsy (small scattered flowers), trellis (a lattice with climbing vines), bold (big blooms in every corner)
     ===================================================================================== */
  function leafPath(c, x, y, len, rot, w) { var ca = Math.cos(rot), sa = Math.sin(rot), nx = -sa * len * w, ny = ca * len * w, mx = x + ca * len * 0.5, my = y + sa * len * 0.5, ex = x + ca * len, ey = y + sa * len; c.moveTo(x, y); c.quadraticCurveTo(mx + nx, my + ny, ex, ey); c.quadraticCurveTo(mx - nx, my - ny, x, y); }
  function hedge(c, W, H, u, p, t, seed) { /* a clipped hedge of leaves for the cast to stand on, dotted with little flowers */
    var fy = H * FY, d = dk(p), g1 = d ? mix(p.accent2, '#05040c', 0.55) : mix(p.accent2, p.ink, 0.35), g2 = shade(g1, d ? 0.16 : 0.14), r = u * 3, n = Math.ceil(W / (r * 1.5)) + 2, i, R0 = rnd(seed + 'hg');
    c.fillStyle = g2; c.beginPath(); for (i = 0; i < n; i++) { var x = (i - 0.5) * r * 1.5, y = fy + u * 0.6 + (i % 2) * u * 0.5; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.fill();
    vgrad2(c, 0, fy + u * 0.8, W, H - fy, g1, shade(g1, -0.35));
    c.fillStyle = g1; c.beginPath(); for (i = 0; i < n; i++) { var x2 = (i - 0.1) * r * 1.5, y2 = fy + u * 2 + (i % 2) * u * 0.4; c.moveTo(x2 + r, y2); c.arc(x2, y2, r, 0, TAU); } c.fill();
    c.fillStyle = alpha(g2, 0.75); c.beginPath(); for (i = 0; i < 70; i++) { var lx = R0() * W, ly = fy + u * 1 + R0() * R0() * (H - fy), ll = u * (1.4 + R0() * 1.6); leafPath(c, lx, ly, ll, R0() * TAU, 0.4); } c.fill();
    vgrad2(c, 0, fy + u * 3, W, u * 6, 'rgba(10,6,20,0.0)', 'rgba(10,6,20,0.14)'); vgrad2(c, 0, fy + u * 9, W, H - fy - u * 9, 'rgba(10,6,20,0.14)', 'rgba(10,6,20,0.0)');
    c.fillStyle = alpha(g2, 0.5); c.beginPath(); for (i = 0; i < n; i++) { var x3 = (i + 0.3) * r * 1.5, y3 = fy + (H - fy) * 0.52 + (i % 2) * u * 0.6; c.moveTo(x3 + r, y3); c.arc(x3, y3, r, PI, TAU); } c.fill();   /* a second, lower tier of clipped leaves */
    for (i = 0; i < 16; i++) { var fx = (i + 0.2 + R0() * 0.6) / 16 * W, fy2 = fy + u * (0.6 + R0() * 4), fr = u * (0.8 + R0() * 0.5); K.flower(c, fx, fy2, fr, [p.paper, p.accent, p.gold][i % 3], i % 3 === 2 ? p.paper : p.gold, R0() * 6 + Math.sin(t * 1.2 + i) * 0.2); }
    for (i = 0; i < 14; i++) { var fx3 = R0() * W, fy3 = fy + (H - fy) * (0.3 + R0() * 0.66), fr3 = u * (0.9 + R0() * 0.8); K.flower(c, fx3, fy3, fr3, [p.accent, p.paper, p.gold][i % 3], i % 3 === 2 ? p.paper : p.gold, R0() * 6 + Math.sin(t * 1.2 + i) * 0.2); }
  }
  Art.add('backdrop', 'floralpattern', function (c, W, H, t, p, o, u) {
    var v = o.variant, d = dk(p), i, j, fy = H * FY, R0 = rnd(o.seed + 'fl'), k = Math.exp(-4 * o.beat), leafA = d ? mix(p.accent2, p.snow, 0.1) : mix(p.accent2, p.ink, 0.12), leafB = d ? mix(p.accent2, p.bg, 0.4) : shade(p.accent2, 0.25), fc = [p.accent, p.gold, d ? shade(p.bg2, 0.5) : p.paper, shade(p.accent, 0.3)];
    if (v === 'trellis') {
      var base = d ? mix(p.bg, p.bg2, 0.3) : mix(p.bg2, p.paper, 0.3), lat = d ? shade(base, 0.14) : mix(base, p.bg, 0.5), s = u * 13;
      c.fillStyle = base; c.fillRect(0, 0, W, H);
      for (j = 0; j < 2; j++) bands(c, W, H, j ? 0.62 : -0.62, s, 0, function (x, D) { c.fillStyle = lat; c.fillRect(x, -D, u * 1.5, D * 2); c.fillStyle = alpha(p.snow, 0.3); c.fillRect(x, -D, u * 0.3, D * 2); c.fillStyle = 'rgba(10,6,20,0.12)'; c.fillRect(x + u * 1.5, -D, u * 0.4, D * 2); });
      calm(c, W, H, base, 0.6);
      for (j = 0; j < 2; j++) { var sg = j ? -1 : 1, ex = j ? W - u * 6.5 : u * 6.5, N = 44, pts = [], ph = j * 2.3;   /* a vine up each side */
        for (i = 0; i <= N; i++) { var yy = fy + u * 2 - (fy + u * 6) * i / N; pts.push([ex + Math.sin(i * 0.42 + ph) * u * 3.6 + Math.sin(t * 0.9 + i * 0.3) * u * 0.25, yy]); }
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (i = 1; i <= N; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineWidth = u * 0.9; c.strokeStyle = leafA; c.stroke();
        c.fillStyle = leafB; c.beginPath(); for (i = 1; i < N; i += 2) leafPath(c, pts[i][0], pts[i][1], u * (4 + (i % 3)), (i % 4 < 2 ? -0.5 : PI + 0.5) + Math.sin(t * 1.1 + i) * 0.1, 0.36); c.fill();
        c.fillStyle = leafA; c.beginPath(); for (i = 2; i < N; i += 2) leafPath(c, pts[i][0], pts[i][1], u * (4.4 + (i % 3)), (i % 4 < 2 ? PI + 0.7 : -0.7) + Math.sin(t * 1.1 + i) * 0.1, 0.36); c.fill();
        for (i = 3; i < N; i += 5) { var bx = pts[i][0] + sg * u * (i % 2 ? 2.4 : -0.6), by = pts[i][1]; K.bloom(c, bx, by, u * (3.3 + (i % 3) * 0.6) * (1 + ((i + o.n) % 2 ? 0.05 * k : 0)), fc[(i + j) % 4], t, i * 1.3 + j); }
        for (i = 5; i < N; i += 5) dot(c, pts[i][0] - sg * u * 2.2, pts[i][1] - u * 1.2, u * 0.9, p.gold); }
      for (j = 0; j < 2; j++) { var cx = j ? W : 0, sg2 = j ? -1 : 1;   /* a spray in each top corner */
        c.fillStyle = leafA; c.beginPath(); for (i = 0; i < 7; i++) leafPath(c, cx + sg2 * u * 3, u * 3, u * (11 + (i % 3) * 3), (j ? PI : 0) + sg2 * (0.05 + i * 0.25), 0.3); c.fill();
        K.bloom(c, cx + sg2 * u * 7, u * 6, u * 5.6, fc[j], t, j * 2); K.bloom(c, cx + sg2 * u * 16, u * 4.5, u * 4, fc[j + 1], t, j * 2 + 1); K.bloom(c, cx + sg2 * u * 5, u * 15, u * 4.2, fc[j + 2], t, j * 2 + 3); }
      hedge(c, W, H, u, p, t, o.seed);
      vignette(c, W, H, deep(p, 0.85), 0.2);
      return;
    }
    if (v === 'bold') {
      var bb = p.bg, sh = tone(p, p.bg, d ? 0.1 : 0.12), m = Math.min(W, H);
      vgrad(c, W, H, [shade(bb, d ? 0.05 : 0.1), bb]);
      c.fillStyle = sh; c.beginPath(); for (i = 0; i < 40; i++) { var lx = R0() * W, ly = R0() * fy, ll = u * (7 + R0() * 9), lr = R0() * TAU; leafPath(c, lx, ly, ll, lr, 0.34); leafPath(c, lx, ly, ll * 0.8, lr + 0.7, 0.3); } c.fill();   /* leaf shadows, tone on tone */
      calm(c, W, H, bb, 0.72);
      var spots = [[0, 0, 0.8, 1.25], [1, 0, 2.35, 1.2], [0, 0.36, 0, 0.85], [1, 0.4, PI, 0.9], [0, 0.69, -0.5, 0.95], [1, 0.69, PI + 0.5, 1]];
      for (j = 0; j < spots.length; j++) { var S = spots[j], ox = S[0] * W, oy = S[1] * H + (S[1] ? 0 : u * 1), sc = S[3] * m / 100, dir = S[2], sw = Math.sin(t * 0.8 + j * 1.7) * 0.03;
        c.fillStyle = leafA; c.beginPath(); for (i = 0; i < 5; i++) leafPath(c, ox, oy, sc * (17 + (i % 2) * 5), dir + (i - 2) * 0.42 + sw, 0.3); c.fill();
        c.fillStyle = leafB; c.beginPath(); for (i = 0; i < 4; i++) leafPath(c, ox, oy, sc * (13 + (i % 2) * 4), dir + (i - 1.5) * 0.42 + sw, 0.3); c.fill();
        c.strokeStyle = alpha(p.snow, 0.3); c.lineWidth = u * 0.25; c.beginPath(); for (i = 0; i < 5; i++) { var la = dir + (i - 2) * 0.42 + sw; c.moveTo(ox + Math.cos(la) * sc * 3, oy + Math.sin(la) * sc * 3); c.lineTo(ox + Math.cos(la) * sc * (14 + (i % 2) * 5), oy + Math.sin(la) * sc * (14 + (i % 2) * 5)); } c.stroke();
        for (i = 0; i < 3; i++) { var ba = dir + (i - 1) * 0.62, bd = sc * (i === 1 ? 8.5 : 6.5), br = sc * (i === 1 ? 6.6 : 4.8) * (1 + ((i + j + o.n) % 2 ? 0.04 * k : 0)); K.bloom(c, ox + Math.cos(ba) * bd, oy + Math.sin(ba) * bd, br, fc[(i + j) % 4], t, j * 3 + i); }
        for (i = 0; i < 4; i++) { var da = dir + (i - 1.5) * 0.5, dd = sc * (15 + (i % 2) * 3); dot(c, ox + Math.cos(da) * dd, oy + Math.sin(da) * dd, sc * 1.1, p.gold); dot(c, ox + Math.cos(da) * dd - sc * 0.3, oy + Math.sin(da) * dd - sc * 0.3, sc * 0.4, 'rgba(255,255,255,0.6)'); } }
      hedge(c, W, H, u, p, t, o.seed);
      vignette(c, W, H, deep(p, 0.85), 0.22);
      return;
    }
    /* ditsy */
    var bd2 = p.bg, cell = u * 9.2, nx = Math.ceil(W / cell) + 1, ny = Math.ceil(fy / cell) + 1, F = [], q;
    vgrad(c, W, H, [shade(bd2, d ? 0.05 : 0.1), bd2]);
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) F.push([(i + 0.22 + R0() * 0.56 + (j % 2) * 0.5 - 0.25) * cell, (j + 0.22 + R0() * 0.56) * cell, R0() * TAU, R0(), Math.floor(R0() * 4)]);
    c.fillStyle = leafA; c.beginPath(); for (i = 0; i < F.length; i++) { var f = F[i], l = u * (2.3 + f[3] * 1.2); leafPath(c, f[0], f[1], l, f[2], 0.38); leafPath(c, f[0], f[1], l * 0.9, f[2] + 2.2, 0.38); } c.fill();
    c.fillStyle = alpha(p.snow, d ? 0.3 : 0.55); c.beginPath(); for (i = 0; i < F.length; i++) { var g = F[i], gx = g[0] + cell * 0.5, gy = g[1] + cell * 0.42; c.moveTo(gx + u * 0.4, gy); c.arc(gx, gy, u * 0.4, 0, TAU); c.moveTo(gx - cell * 0.2 + u * 0.28, gy + cell * 0.2); c.arc(gx - cell * 0.2, gy + cell * 0.2, u * 0.28, 0, TAU); } c.fill();
    for (q = 0; q < 4; q++) { c.fillStyle = fc[q]; c.beginPath(); for (i = 0; i < F.length; i++) { var h = F[i]; if (h[4] !== q) continue; var r = u * (1.5 + h[3] * 0.9) * (1 + ((i + o.n) % 3 === 0 ? 0.08 * k : 0)), rot = h[2] + Math.sin(t * 0.9 + i) * 0.25, e; for (e = 0; e < 5; e++) { var a = rot + e / 5 * TAU, px = h[0] + Math.cos(a) * r * 0.62, py = h[1] + Math.sin(a) * r * 0.62; c.moveTo(px + r * 0.5, py); c.arc(px, py, r * 0.5, 0, TAU); } } c.fill(); }
    for (q = 0; q < 2; q++) { c.fillStyle = q ? p.accent : p.gold; c.beginPath(); for (i = 0; i < F.length; i++) { var h2 = F[i]; if ((h2[4] === 1) !== !!q) continue; var r2 = u * (1.5 + h2[3] * 0.9) * 0.4; c.moveTo(h2[0] + r2, h2[1]); c.arc(h2[0], h2[1], r2, 0, TAU); } c.fill(); }
    calm(c, W, H, bd2, 0.66);
    hedge(c, W, H, u, p, t, o.seed);
    vignette(c, W, H, deep(p, 0.85), 0.22);
  }, { variants: ['ditsy', 'trellis', 'bold'], stage: 'band-low' });
});
