/* Send a Carol art pack: pattern backdrops, set B (confettidots, marblegold, linen, blueprint, halftone, checkerboard,
   waves70s, vaporsun, papercut, softglow). Every colour comes from the palette; a variant is a different arrangement.
   Each keeps the centre calm and lays a floor zone from about y=0.70 so a cast never floats.
   Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, dot = K.dot, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var vgrad = K.vgrad, vgrad2 = K.vgrad2, vignette = K.vignette, glow = K.glow, twinkle = K.twinkle, starPath = K.starPath;

  /* ---------- shared ---------- */
  function lum(col) { var c = K.rgbOf(col) || [128, 128, 128]; return (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114) / 255; }
  /* a colour that shows on `on`: towards the ink when `on` is pale, towards the snow when it is dark */
  function over(on, p, k) { return lum(on) > 0.55 ? mix(on, p.ink, k) : mix(on, p.snow, k); }
  function deep(col, k) { return mix(col, '#0c0a18', k); }
  /* wash the middle of the picture (where photos and titles go) back towards one colour */
  function calm(c, W, H, col, a, cy, ry) {
    c.save(); c.translate(W / 2, H * (cy || 0.4)); c.scale(W * 0.62, H * (ry || 0.36));
    var g = c.createRadialGradient(0, 0, 0.25, 0, 0, 1); g.addColorStop(0, alpha(col, a)); g.addColorStop(0.55, alpha(col, a * 0.75)); g.addColorStop(1, alpha(col, 0));
    c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
  }
  /* the soft shadow where wall meets floor, and under where a cast stands */
  function contact(c, W, H, fy, u, col, a) {
    vgrad2(c, 0, fy - u * 5, W, u * 5, alpha(col, 0), alpha(col, a * 0.7));
    vgrad2(c, 0, fy, W, u * 7, alpha(col, a), alpha(col, 0));
  }
  function castPools(c, W, H, u, col, a) { /* two soft pools where the cast stands, left and right */
    var y = H * 0.75, i; for (i = 0; i < 2; i++) { c.save(); c.translate(W * (i ? 0.85 : 0.15), y); c.scale(1, 0.26); glow(c, 0, 0, u * 17, col, a); c.restore(); }
  }

  /* ---------- confettidots: paper dots thrown at a wall, some landed on the floor ---------- */
  Art.add('backdrop', 'confettidots', function (c, W, H, t, p, o, u) {
    var v = o.variant, fy = H * 0.7, i, R0 = rnd(o.seed + 'cd' + v), k = Math.exp(-4 * o.beat), sh = deep(p.bg, 0.55);
    var cols = [p.accent, p.gold, p.accent2, p.snow, mix(p.accent, p.gold, 0.5), mix(p.accent2, p.snow, 0.45), p.paper];
    vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.55), p.bg2], 0, fy);
    for (i = 0; i < 9; i++) { var bx = (i % 2 ? 0.86 : 0.14) * W + (R0() - 0.5) * W * 0.3, by = R0() * fy; dot(c, bx, by, u * (9 + R0() * 12), alpha(i % 3 ? p.snow : p.gold, 0.07)); }
    var N = 300;
    for (i = 0; i < N; i++) {
      var fx = R0(), fy0 = R0(), sz = R0(), ph = R0() * TAU, sp = R0(), d, x, y;
      if (v === 'fall') fy0 = frac(fy0 + t * 0.006 * (0.6 + sp));
      var e = Math.hypot((fx - 0.5) / 0.44, (fy0 - 0.56) / 0.52);
      if (v === 'fall') d = Math.max(clamp(1.15 - fy0 / 0.3, 0, 1), clamp((e - 0.78) * 2.2, 0, 1) * clamp(1.5 - fy0 * 1.4, 0, 1));
      else if (v === 'corners') { var cd = Math.min(Math.hypot(fx, fy0 * 1.35), Math.hypot(1 - fx, fy0 * 1.35)); d = clamp(1.5 - cd * 2.1, 0, 1); }
      else d = clamp((e - 0.8) * 2.4, 0, 1);
      if (d < 0.12) continue;
      x = fx * W + Math.sin(t * (0.5 + sp) + ph) * u * 0.7; y = fy0 * fy + Math.cos(t * (0.4 + sp * 0.7) + ph) * u * 0.6;
      var r = u * (0.7 + sz * sz * 3.6) * (0.45 + 0.55 * d) * (1 + ((i + o.n) % 5 === 0 ? k * 0.22 : 0)), col = cols[i % 7];
      if (y + r > fy - u) continue;
      dot(c, x + u * 0.28, y + u * 0.36, r, alpha(sh, 0.2));
      if (i % 6 === 0) { c.beginPath(); c.arc(x, y, r * 0.8, 0, TAU); c.lineWidth = r * 0.42; c.strokeStyle = col; c.stroke(); }
      else { dot(c, x, y, r, col); if (r > u * 1.5) { c.beginPath(); c.arc(x, y, r * 0.66, PI * 1.05, PI * 1.6); c.lineWidth = r * 0.16; c.strokeStyle = alpha(p.snow, 0.5); c.stroke(); } }
    }
    calm(c, W, H, mix(p.bg, p.bg2, 0.4), 0.3);
    /* the floor: a darker shelf of the second colour with dots that have landed, bigger towards us */
    var fl = lum(p.bg2) > 0.5 ? mix(p.bg2, p.ink, 0.2) : deep(p.bg2, 0.3);
    vgrad2(c, 0, fy, W, H - fy, fl, mix(fl, sh, 0.3));
    Rn(c, 0, fy - u * 0.35, W, u * 0.7, 0, alpha(p.snow, 0.45));
    R0 = rnd(o.seed + 'cf');
    for (i = 0; i < 64; i++) {
      var q = R0(), gx = R0() * W, gy = fy + u * 1.2 + q * q * (H - fy), gr = u * (0.9 + q * 2.6 + R0() * 1.2), gc = cols[i % 7];
      if (Math.abs(gx - W / 2) < W * 0.3 && gy < fy + (H - fy) * 0.5 && i % 3) continue;
      c.beginPath(); c.ellipse(gx + u * 0.2, gy + u * 0.3, gr, gr * 0.36, 0, 0, TAU); c.fillStyle = alpha(sh, 0.22); c.fill();
      c.beginPath(); c.ellipse(gx, gy, gr, gr * 0.36, 0, 0, TAU); c.fillStyle = gc; c.fill();
    }
    contact(c, W, H, fy, u, sh, 0.22); castPools(c, W, H, u, sh, 0.2);
    vignette(c, W, H, sh, 0.22);
  }, { variants: ['scatter', 'fall', 'corners'], stage: 'band-low' });

  /* ---------- marblegold: polished stone with gold veins ---------- */
  function vein(R0, x, y, a, len, n, wig) { /* a wandering line as points */
    var pts = [[x, y]], i, st = len / n; for (i = 0; i < n; i++) { a += (R0() - 0.5) * wig; x += Math.cos(a) * st; y += Math.sin(a) * st; pts.push([x, y]); } return pts;
  }
  function strokePts(c, pts, w, col) { var i; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); c.lineTo(pts[i][0], pts[i][1]); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  Art.add('backdrop', 'marblegold', function (c, W, H, t, p, o, u) {
    var v = o.variant, fy = H * 0.7, i, j, R0 = rnd(o.seed + 'mg'), D = Math.hypot(W, H), sh = deep(p.bg, 0.6), pale = lum(p.bg) > 0.55;
    var grey = over(p.bg, p, 0.42), gold = p.gold, goldHi = shade(p.gold, 0.55), goldLo = mix(p.gold, sh, 0.4), golds = [];
    vgrad(c, W, H, [shade(p.bg, pale ? 0.18 : 0.08), p.bg, mix(p.bg, p.bg2, 0.45)]);
    for (i = 0; i < 12; i++) glow(c, R0() * W, R0() * H, u * (22 + R0() * 26), i % 2 ? shade(p.bg, 0.3) : mix(p.bg, p.bg2, 0.8), 0.22);
    for (i = 0; i < 9; i++) { /* broad soft clouds of stone, then the veins that run through them */
      var side = i % 2, sx = side ? W * (1.05 - R0() * 0.2) : W * (-0.05 + R0() * 0.2), sy = H * (i / 9 + R0() * 0.08) - H * 0.05, ang = (side ? PI : 0) + (side ? -1 : 1) * (0.45 + R0() * 0.5), pts = vein(R0, sx, sy, ang, D * (0.3 + R0() * 0.3), 16, 0.7);
      strokePts(c, pts, u * (4 + R0() * 5), alpha(grey, 0.07)); strokePts(c, pts, u * 1.7, alpha(grey, 0.2)); strokePts(c, pts, u * 0.36, alpha(grey, 0.6));
      for (j = 4; j < pts.length - 3; j += 5) { var br = vein(R0, pts[j][0], pts[j][1], ang + (R0() - 0.5) * 2.2, D * 0.1, 7, 0.9); strokePts(c, br, u * 0.18, alpha(grey, 0.38)); }
      if (i % 3 !== 1) { var gp = vein(R0, pts[2][0], pts[2][1] + u * (2 + R0() * 4), ang + (R0() - 0.5) * 0.3, D * (0.22 + R0() * 0.22), 14, 0.8); strokePts(c, gp, u * 2.2, alpha(gold, 0.13)); strokePts(c, gp, u * 0.95, goldLo); strokePts(c, gp, u * 0.68, gold); strokePts(c, gp, u * 0.18, goldHi); golds.push(gp); }
    }
    for (i = 0; i < 70; i++) dot(c, R0() * W, R0() * H, u * (0.12 + R0() * 0.3), alpha(i % 3 ? gold : grey, 0.5)); /* flecks */
    if (v === 'tiles') { /* big honed tiles set on the diagonal, a gold fillet in every joint */
      var s = Math.max(W, H) / 3.2; c.save(); c.translate(W / 2, H * 0.4); c.rotate(PI / 4);
      for (i = -4; i <= 4; i++) for (j = -4; j <= 4; j++) if ((i + j) & 1) { c.fillStyle = alpha(pale ? sh : p.snow, 0.055); c.fillRect(i * s, j * s, s, s); }
      for (i = -4; i <= 5; i++) { c.fillStyle = alpha(sh, 0.3); c.fillRect(i * s + u * 0.3, -s * 5, u * 0.3, s * 10); c.fillRect(-s * 5, i * s + u * 0.3, s * 10, u * 0.3); c.fillStyle = gold; c.fillRect(i * s - u * 0.22, -s * 5, u * 0.44, s * 10); c.fillRect(-s * 5, i * s - u * 0.22, s * 10, u * 0.44); }
      for (i = -4; i <= 5; i++) for (j = -4; j <= 5; j++) { c.save(); c.translate(i * s, j * s); c.rotate(PI / 4); Rn(c, -u * 1.5, -u * 1.5, u * 3, u * 3, 0, goldLo); Rn(c, -u * 1.1, -u * 1.1, u * 2.2, u * 2.2, 0, gold); c.restore(); }
      c.restore();
    } else if (v === 'inlay') { /* a deco frame of gold lines let into the stone, stepped corners and a fan in each top corner */
      var m = u * 4.5, st = u * 5, x0 = m, x1 = W - m, y0 = m, y1 = fy - u * 3.5, pass;
      for (pass = 0; pass < 2; pass++) {
        var ins = pass * u * 1.6, a0 = x0 + ins, a1 = x1 - ins, b0 = y0 + ins, b1 = y1 - ins, q = st - ins * 0.3;
        c.beginPath(); c.moveTo(a0 + q, b0); c.lineTo(a1 - q, b0); c.lineTo(a1 - q, b0 + q); c.lineTo(a1, b0 + q); c.lineTo(a1, b1 - q); c.lineTo(a1 - q, b1 - q); c.lineTo(a1 - q, b1); c.lineTo(a0 + q, b1); c.lineTo(a0 + q, b1 - q); c.lineTo(a0, b1 - q); c.lineTo(a0, b0 + q); c.lineTo(a0 + q, b0 + q); c.closePath();
        c.lineJoin = 'miter'; c.lineWidth = u * (pass ? 0.3 : 0.75); c.strokeStyle = goldLo; c.stroke(); c.lineWidth = u * (pass ? 0.18 : 0.5); c.strokeStyle = gold; c.stroke();
      }
      for (i = 0; i < 2; i++) { var fxc = i ? x1 - st : x0 + st, fyc = y0 + st, dir = i ? -1 : 1; for (j = 0; j < 7; j++) { var fa = j / 6 * PI / 2, len2 = u * (24 - (j % 2) * 7); L(c, fxc, fyc, fxc + dir * Math.cos(fa) * len2, fyc + Math.sin(fa) * len2, u * 0.5, gold); dot(c, fxc + dir * Math.cos(fa) * len2, fyc + Math.sin(fa) * len2, u * 0.9, goldHi); } c.beginPath(); c.moveTo(fxc, fyc); c.arc(fxc, fyc, u * 6, i ? PI / 2 : 0, i ? PI : PI / 2); c.closePath(); c.fillStyle = gold; c.fill(); c.beginPath(); c.moveTo(fxc, fyc); c.arc(fxc, fyc, u * 3.4, i ? PI / 2 : 0, i ? PI : PI / 2); c.closePath(); c.fillStyle = goldHi; c.fill(); }
      c.lineJoin = 'round';
    }
    calm(c, W, H, mix(p.bg, shade(p.bg, 0.2), 0.5), 0.5);
    /* the polished floor: a gold strip, darker stone laid in perspective, a soft reflection */
    c.save(); c.beginPath(); c.rect(0, fy, W, H - fy); c.clip();
    c.fillStyle = alpha(sh, pale ? 0.2 : 0.38); c.fillRect(0, fy, W, H - fy);
    c.strokeStyle = alpha(gold, 0.5); c.lineWidth = Math.max(1, u * 0.22); c.beginPath();
    for (i = -9; i <= 9; i++) { c.moveTo(W / 2 + i * W * 0.085, fy); c.lineTo(W / 2 + i * W * 0.34, H); }
    for (i = 1; i < 6; i++) { var z = i / 6, yy = fy + (H - fy) * z * z * 1.25; c.moveTo(0, yy); c.lineTo(W, yy); }
    c.stroke();
    vgrad2(c, 0, fy, W, (H - fy) * 0.6, alpha(p.snow, pale ? 0.3 : 0.12), alpha(p.snow, 0));
    c.restore();
    Rn(c, 0, fy - u * 1.1, W, u * 1.5, 0, goldLo); Rn(c, 0, fy - u * 1.1, W, u * 1.1, 0, gold); Rn(c, 0, fy - u * 0.95, W, u * 0.25, 0, goldHi);
    contact(c, W, H, fy + u * 0.4, u, sh, 0.2); castPools(c, W, H, u, sh, 0.22);
    for (i = 0; i < golds.length; i++) { /* a glint walks each gold vein */
      var g = golds[i], f = frac(t * 0.045 + i * 0.37), pos = f * (g.length - 1), i0 = Math.floor(pos), fr = pos - i0, gx = g[i0][0] + (g[i0 + 1][0] - g[i0][0]) * fr, gy = g[i0][1] + (g[i0 + 1][1] - g[i0][1]) * fr, a2 = Math.sin(f * PI);
      if (gy > fy - u * 2 || Math.hypot((gx - W / 2) / (W * 0.4), (gy - H * 0.4) / (H * 0.28)) < 1) continue;
      c.globalAlpha = a2; glow(c, gx, gy, u * 4, goldHi, 0.5); twinkle(c, gx, gy, u * (1.6 + 0.8 * Math.exp(-4 * o.beat)), goldHi); c.globalAlpha = 1;
    }
    vignette(c, W, H, sh, pale ? 0.16 : 0.34);
  }, { variants: ['veined', 'tiles', 'inlay'], stage: 'band-low' });

  /* ---------- linen: woven cloth paper, quiet enough for a sympathy card ---------- */
  Art.add('backdrop', 'linen', function (c, W, H, t, p, o, u) {
    var v = o.variant, fy = H * 0.72, i, R0 = rnd(o.seed + 'ln'), pale = lum(p.bg) > 0.55, sh = deep(p.bg, 0.55), hi = alpha(p.snow, pale ? 0.3 : 0.09), lo = alpha(sh, pale ? 0.1 : 0.2), st = u * 0.62;
    vgrad(c, W, H, [mix(p.bg, p.paper, pale ? 0.16 : 0.04), p.bg, mix(p.bg, p.bg2, 0.3)]);
    c.fillStyle = hi; c.beginPath(); for (i = 0; i * st < W; i++) if (R0() < 0.55) c.rect(i * st, 0, st * (0.25 + R0() * 0.4), H); for (i = 0; i * st < H; i++) if (R0() < 0.55) c.rect(0, i * st, W, st * (0.25 + R0() * 0.4)); c.fill();
    c.fillStyle = lo; c.beginPath(); for (i = 0; i * st < W; i++) if (R0() < 0.5) c.rect(i * st + st * 0.5, 0, st * (0.2 + R0() * 0.35), H); for (i = 0; i * st < H; i++) if (R0() < 0.5) c.rect(0, i * st + st * 0.5, W, st * (0.2 + R0() * 0.35)); c.fill();
    for (i = 0; i < 46; i++) { var sx = R0() * W, sy = R0() * H, sl = u * (3 + R0() * 9), hz = i % 2; c.fillStyle = i % 3 ? alpha(p.snow, pale ? 0.35 : 0.1) : alpha(sh, 0.12); if (hz) c.fillRect(sx, sy, sl, u * 0.34); else c.fillRect(sx, sy, u * 0.34, sl); } /* slubs */
    glow(c, W * (0.5 + 0.16 * Math.sin(t * 0.11)), H * 0.3, Math.max(W, H) * 0.5, p.paper, pale ? 0.16 : 0.07);
    var thread = mix(p.accent, p.bg, pale ? 0.35 : 0.2), leafc = mix(p.accent2, p.bg, 0.4);
    if (v === 'stitched') { /* a running stitch all round and a small sprig in each top corner */
      var m = u * 4.2; c.lineCap = 'round'; c.lineWidth = u * 0.5; c.setLineDash([u * 1.7, u * 1.5]); c.strokeStyle = alpha(sh, 0.2); c.strokeRect(m + u * 0.15, m + u * 0.25, W - m * 2, fy - m * 1.9); c.strokeStyle = thread; c.strokeRect(m, m, W - m * 2, fy - m * 1.9); c.setLineDash([]);
      for (i = 0; i < 2; i++) { var d = i ? -1 : 1, cx = i ? W - m - u * 3 : m + u * 3, cy = m + u * 3, j, sw = Math.sin(t * 0.7 + i) * 0.03; c.save(); c.translate(cx, cy); c.rotate(sw); c.scale(1.9, 1.9); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(d * u * 7, u * 1, d * u * 12, u * 7); c.lineWidth = u * 0.35; c.strokeStyle = leafc; c.stroke(); for (j = 0; j < 5; j++) { var f = (j + 1) / 6, lx = d * u * 12 * f, ly = u * 7 * f * f + u * 1 * f; K.leaf(c, lx, ly, u * 3.2, (j % 2 ? 1.3 : -0.2) * d + (d < 0 ? PI : 0), leafc); } dot(c, d * u * 12.4, u * 7.4, u * 0.7, thread); c.restore(); }
    } else if (v === 'folded') { /* a letter unfolded: two soft creases and a deckled edge */
      var ys = [H * 0.24, H * 0.5]; for (i = 0; i < 2; i++) { vgrad2(c, 0, ys[i] - u * 2.4, W, u * 2.4, alpha(sh, 0), alpha(sh, 0.09)); vgrad2(c, 0, ys[i], W, u * 2.4, alpha(p.snow, pale ? 0.3 : 0.1), alpha(p.snow, 0)); }
      var g = c.createLinearGradient(W / 2 - u * 2.4, 0, W / 2 + u * 2.4, 0); g.addColorStop(0, alpha(sh, 0)); g.addColorStop(0.5, alpha(sh, 0.08)); g.addColorStop(0.5, alpha(p.snow, pale ? 0.25 : 0.08)); g.addColorStop(1, alpha(p.snow, 0)); c.fillStyle = g; c.fillRect(W / 2 - u * 2.4, 0, u * 4.8, fy);
      c.fillStyle = alpha(sh, 0.1); c.beginPath(); for (i = 0; i * u * 1.4 < H; i++) { c.rect(0, i * u * 1.4, u * (0.5 + R0() * 1.1), u * 1.4); var rw = u * (0.5 + R0() * 1.1); c.rect(W - rw, i * u * 1.4, rw, u * 1.4); } for (i = 0; i * u * 1.4 < W; i++) c.rect(i * u * 1.4, 0, u * 1.4, u * (0.5 + R0() * 1.1)); c.fill();
    } else { /* plain: a woven selvedge down each side */
      for (i = 0; i < 2; i++) { var ex = i ? W - u * 3.2 : u * 3.2; Rn(c, ex - u * 0.9, 0, u * 1.8, H, 0, alpha(thread, 0.3)); Rn(c, ex - u * 0.12, 0, u * 0.24, H, 0, alpha(p.snow, pale ? 0.6 : 0.3)); Rn(c, ex + (i ? -1 : 1) * u * 1.7, 0, u * 0.22, H, 0, alpha(leafc, 0.55)); }
    }
    calm(c, W, H, p.bg, 0.2);
    /* the hem: a turned-up band of the same cloth, one row of stitching, a soft shadow above it */
    vgrad2(c, 0, fy, W, H - fy, alpha(sh, pale ? 0.1 : 0.22), alpha(sh, pale ? 0.2 : 0.36));
    Rn(c, 0, fy, W, u * 0.3, 0, alpha(p.snow, pale ? 0.55 : 0.18));
    c.lineCap = 'round'; c.lineWidth = u * 0.42; c.setLineDash([u * 1.6, u * 1.5]); c.strokeStyle = alpha(thread, 0.85); c.beginPath(); c.moveTo(u, fy + u * 2); c.lineTo(W, fy + u * 2); c.stroke(); c.setLineDash([]);
    contact(c, W, H, fy, u, sh, 0.13); castPools(c, W, H, u, sh, 0.16);
    vignette(c, W, H, sh, pale ? 0.14 : 0.3);
  }, { variants: ['plain', 'stitched', 'folded'], stage: 'band-low' });

  /* ---------- blueprint: a drawing-office sheet, the work drawn round the edges ---------- */
  function gear(c, x, y, r, n, rot, lw, col) {
    var i, a, d = TAU / n; c.beginPath();
    for (i = 0; i < n; i++) { a = rot + i * d; c.lineTo(x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.84); c.lineTo(x + Math.cos(a + d * 0.14) * r, y + Math.sin(a + d * 0.14) * r); c.lineTo(x + Math.cos(a + d * 0.42) * r, y + Math.sin(a + d * 0.42) * r); c.lineTo(x + Math.cos(a + d * 0.56) * r * 0.84, y + Math.sin(a + d * 0.56) * r * 0.84); }
    c.closePath(); c.lineWidth = lw; c.strokeStyle = col; c.stroke();
    c.beginPath(); c.arc(x, y, r * 0.62, 0, TAU); c.moveTo(x + r * 0.2, y); c.arc(x, y, r * 0.2, 0, TAU); c.lineWidth = lw * 0.7; c.stroke();
    for (i = 0; i < 5; i++) { a = rot + i * TAU / 5; L(c, x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, lw * 0.7, col); }
  }
  function dimLine(c, x1, y1, x2, y2, u, col, off) { /* a dimension line: arrowheads, end ticks, marching dashes */
    var a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a), ny = Math.cos(a), h = u * 1.5, i;
    c.strokeStyle = col; c.lineWidth = u * 0.28; c.setLineDash([u * 1.4, u * 0.9]); c.lineDashOffset = -off; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    for (i = 0; i < 2; i++) { var px = i ? x2 : x1, py = i ? y2 : y1, s = i ? -1 : 1; L(c, px - nx * u * 1.6, py - ny * u * 1.6, px + nx * u * 1.6, py + ny * u * 1.6, u * 0.3, col); Pg(c, [[px, py], [px + s * Math.cos(a) * h + nx * h * 0.35, py + s * Math.sin(a) * h + ny * h * 0.35], [px + s * Math.cos(a) * h - nx * h * 0.35, py + s * Math.sin(a) * h - ny * h * 0.35]], col, true); }
  }
  function target(c, x, y, r, u, col) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = u * 0.3; c.strokeStyle = col; c.stroke(); L(c, x - r * 1.5, y, x + r * 1.5, y, u * 0.2, col); L(c, x, y - r * 1.5, x, y + r * 1.5, u * 0.2, col); }
  Art.add('backdrop', 'blueprint', function (c, W, H, t, p, o, u) {
    var v = o.variant, fy = H * 0.7, i, j, pale = lum(p.bg) > 0.72, ln = pale ? mix(p.bg, p.ink, 0.72) : p.paper, sh = deep(p.bg, 0.5), k = Math.exp(-4 * o.beat), red = pale ? p.accent : mix(p.accent, p.snow, 0.25), hot = p.gold, a1 = alpha(ln, 0.85), a2 = alpha(ln, 0.55), lw = u * 0.34;
    vgrad(c, W, H, [mix(p.bg, sh, 0.12), p.bg, mix(p.bg, p.bg2, 0.22)]);
    c.lineCap = 'butt'; c.lineWidth = Math.max(0.6, u * 0.1); c.strokeStyle = alpha(ln, 0.12); c.beginPath(); for (i = 1; i * u * 2.5 < W; i++) { c.moveTo(i * u * 2.5, 0); c.lineTo(i * u * 2.5, H); } for (i = 1; i * u * 2.5 < H; i++) { c.moveTo(0, i * u * 2.5); c.lineTo(W, i * u * 2.5); } c.stroke();
    c.lineWidth = Math.max(0.8, u * 0.16); c.strokeStyle = alpha(ln, 0.26); c.beginPath(); for (i = 1; i * u * 12.5 < W; i++) { c.moveTo(i * u * 12.5, 0); c.lineTo(i * u * 12.5, H); } for (i = 1; i * u * 12.5 < H; i++) { c.moveTo(0, i * u * 12.5); c.lineTo(W, i * u * 12.5); } c.stroke();
    calm(c, W, H, p.bg, 0.55);
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (v === 'machine') {
      /* top left: a gear train turning; top right: a little rocket in section; down the sides a spring and a bolt */
      var gx = u * 9, gy = u * 11, gr = u * 12.5, rot = t * 0.25; gear(c, gx, gy, gr, 14, rot, lw, a1); gear(c, gx + gr * 1.52, gy + gr * 0.52, gr * 0.62, 8, -rot * 14 / 8 + 0.16, lw, a1); gear(c, gx - gr * 0.1, gy + gr * 1.5, gr * 0.5, 7, -rot * 2 + 0.5, lw * 0.9, a2);
      target(c, gx, gy, u * 1.2, u, red); target(c, gx + gr * 1.52, gy + gr * 0.52, u * 0.9, u, red);
      var rx = W - u * 11, ry = u * 15, rs = u * 1.15; c.save(); c.translate(rx, ry); c.rotate(0.22 + Math.sin(t * 0.6) * 0.015);
      c.beginPath(); c.moveTo(0, -rs * 11); c.bezierCurveTo(rs * 5, -rs * 6, rs * 4.2, rs * 2, rs * 3.2, rs * 7); c.lineTo(-rs * 3.2, rs * 7); c.bezierCurveTo(-rs * 4.2, rs * 2, -rs * 5, -rs * 6, 0, -rs * 11); c.closePath(); c.fillStyle = alpha(ln, 0.08); c.fill(); c.lineWidth = lw; c.strokeStyle = a1; c.stroke();
      for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * rs * 3.6, rs * 2.5); c.lineTo(i * rs * 7, rs * 9); c.lineTo(i * rs * 3.2, rs * 7); c.stroke(); }
      c.beginPath(); c.arc(0, -rs * 3.4, rs * 1.9, 0, TAU); c.moveTo(-rs * 2.2, rs * 7); c.lineTo(-rs * 1.5, rs * 9); c.lineTo(rs * 1.5, rs * 9); c.lineTo(rs * 2.2, rs * 7); c.moveTo(-rs * 3.9, rs * 1.5); c.lineTo(rs * 3.9, rs * 1.5); c.stroke();
      c.setLineDash([u * 2, u * 0.7, u * 0.4, u * 0.7]); c.lineWidth = u * 0.22; c.strokeStyle = red; c.beginPath(); c.moveTo(0, -rs * 14); c.lineTo(0, rs * 14); c.stroke(); c.setLineDash([]);
      for (i = 0; i < 3; i++) { var fl = rs * (2 + 1.6 * frac(t * 1.3 + i * 0.33)); c.beginPath(); c.moveTo((i - 1) * rs * 0.9, rs * 9.4); c.lineTo((i - 1) * rs * 1.3, rs * 9.4 + fl); c.lineWidth = u * 0.3; c.strokeStyle = alpha(hot, 0.9); c.stroke(); }
      c.restore();
      var sx = u * 7, sy0 = H * 0.36, sy1 = H * 0.6, n = 11, sq = 1 + 0.03 * Math.sin(t * 2); c.beginPath(); c.moveTo(sx, sy0); for (i = 0; i <= n * 2; i++) c.lineTo(sx + (i % 2 ? 1 : -1) * u * 3.4, sy0 + (sy1 - sy0) * (i + 0.5) / (n * 2 + 1) * sq); c.lineTo(sx, sy1); c.lineWidth = lw; c.strokeStyle = a1; c.stroke(); Rn(c, sx - u * 4.4, sy0 - u * 1.2, u * 8.8, u * 1.2, 0, a2); Rn(c, sx - u * 4.4, sy1, u * 8.8, u * 1.2, 0, a2);
      dimLine(c, sx + u * 6.5, sy0, sx + u * 6.5, sy1, u, red, t * u * 1.5);
      var bx = W - u * 8, by = H * 0.42; c.lineWidth = lw; c.strokeStyle = a1; Pg(c, [[bx - u * 4.4, by], [bx + u * 4.4, by], [bx + u * 4.4, by + u * 3.4], [bx - u * 4.4, by + u * 3.4]], alpha(ln, 0.08), true); c.strokeRect(bx - u * 4.4, by, u * 8.8, u * 3.4); c.strokeRect(bx - u * 2.1, by + u * 3.4, u * 4.2, H * 0.14); for (i = 0; i < 9; i++) L(c, bx - u * 2.1, by + u * 6 + i * u * 2.4, bx + u * 2.1, by + u * 4.8 + i * u * 2.4, u * 0.22, a2);
      dimLine(c, bx - u * 4.4, by - u * 3, bx + u * 4.4, by - u * 3, u, red, t * u * 1.5);
    } else {
      /* top left: a corner of a floor plan with a door swing; top right: a north point; stairs and a section mark down the sides */
      var px = u * 3.5, py = u * 4, pw = u * 27, ph = u * 21; c.lineWidth = u * 0.9; c.strokeStyle = a1; c.beginPath(); c.moveTo(px + pw, py); c.lineTo(px, py); c.lineTo(px, py + ph); c.lineTo(px + pw * 0.36, py + ph); c.moveTo(px + pw * 0.7, py + ph); c.lineTo(px + pw, py + ph); c.lineTo(px + pw, py + ph * 0.55); c.moveTo(px + pw * 0.5, py); c.lineTo(px + pw * 0.5, py + ph * 0.45); c.stroke();
      c.lineWidth = u * 0.26; c.strokeStyle = a2; c.beginPath(); c.moveTo(px + pw * 0.36, py + ph); c.lineTo(px + pw * 0.36, py + ph - pw * 0.34); c.arc(px + pw * 0.36, py + ph, pw * 0.34, -PI / 2, 0); c.stroke();
      c.strokeRect(px + u * 1.8, py + u * 1.8, u * 8, u * 4.5); c.beginPath(); c.arc(px + pw * 0.78, py + ph * 0.24, u * 2.6, 0, TAU); c.stroke(); c.strokeRect(px + pw * 0.78 - u * 3.6, py + ph * 0.24 - u * 3.6, u * 7.2, u * 7.2);
      for (i = 0; i < 4; i++) L(c, px + u * 2.2 + i * u * 2, py + u * 1.8, px + u * 2.2 + i * u * 2, py + u * 6.3, u * 0.18, a2);
      dimLine(c, px, py + ph + u * 3.4, px + pw, py + ph + u * 3.4, u, red, t * u * 1.5);
      var nx = W - u * 11, ny = u * 13, nr = u * 7, na = -0.35 + Math.sin(t * 0.5) * 0.04; c.beginPath(); c.arc(nx, ny, nr, 0, TAU); c.lineWidth = lw; c.strokeStyle = a1; c.stroke(); c.beginPath(); c.arc(nx, ny, nr * 0.8, 0, TAU); c.lineWidth = u * 0.18; c.stroke();
      for (i = 0; i < 16; i++) { var ta = i / 16 * TAU; L(c, nx + Math.cos(ta) * nr * (i % 4 ? 0.9 : 0.8), ny + Math.sin(ta) * nr * (i % 4 ? 0.9 : 0.8), nx + Math.cos(ta) * nr, ny + Math.sin(ta) * nr, u * 0.22, a1); }
      c.save(); c.translate(nx, ny); c.rotate(na); Pg(c, [[0, -nr * 1.3], [nr * 0.26, 0], [-nr * 0.26, 0]], red, true); Pg(c, [[0, nr * 0.95], [nr * 0.26, 0], [-nr * 0.26, 0]], alpha(ln, 0.5), true); dot(c, 0, 0, u * 0.6, p.bg); c.restore();
      var stx = W - u * 12, sty = H * 0.38, stw = u * 9; c.lineWidth = lw; c.strokeStyle = a1; c.strokeRect(stx, sty, stw, H * 0.2); for (i = 1; i < 10; i++) L(c, stx, sty + H * 0.02 * i, stx + stw, sty + H * 0.02 * i, u * 0.22, a2); L(c, stx + stw / 2, sty + H * 0.19, stx + stw / 2, sty + H * 0.03, u * 0.26, red); Pg(c, [[stx + stw / 2, sty + H * 0.015], [stx + stw / 2 - u * 1, sty + H * 0.03], [stx + stw / 2 + u * 1, sty + H * 0.03]], red, true);
      var cx = u * 8, cy = H * 0.46, cr = u * 3.2; L(c, cx, cy - H * 0.1, cx, cy + H * 0.1, u * 0.24, a2); c.beginPath(); c.arc(cx, cy, cr, 0, TAU); c.fillStyle = p.bg; c.fill(); c.lineWidth = lw; c.strokeStyle = a1; c.stroke(); L(c, cx - cr, cy, cx + cr, cy, u * 0.24, a1); c.beginPath(); c.arc(cx, cy, cr, PI, 0); c.fillStyle = alpha(ln, 0.3); c.fill();
      c.beginPath(); c.arc(u * 3, H * 0.6, u * 13, -PI * 0.42, PI * 0.1); c.lineWidth = u * 0.22; c.setLineDash([u * 1.2, u * 1]); c.strokeStyle = a2; c.stroke(); c.setLineDash([]);
    }
    for (i = 0; i < 4; i++) { var mx = [u * 4, W - u * 4, u * 4, W - u * 4][i], my = [H * 0.33, H * 0.34, fy - u * 5, fy - u * 5][i]; target(c, mx, my, u * 1, u, a2); dot(c, mx, my, u * (0.5 + 0.35 * ((i + o.n) % 2 ? k : 0)), hot); }
    /* the ground: a datum line with earth hatching under it, a darker sheet edge, a blank title block and a scale bar */
    vgrad2(c, 0, fy, W, H - fy, alpha(sh, pale ? 0.16 : 0.34), alpha(sh, pale ? 0.3 : 0.5));
    c.lineCap = 'butt'; Rn(c, 0, fy - u * 0.4, W, u * 0.8, 0, ln);
    c.lineWidth = u * 0.26; c.strokeStyle = a2; c.beginPath(); for (i = -2; i * u * 1.9 < W; i++) { c.moveTo(i * u * 1.9 + u * 2.6, fy + u * 0.4); c.lineTo(i * u * 1.9, fy + u * 3); } c.stroke();
    for (i = 0; i < 2; i++) { var tx = i ? W * 0.85 : W * 0.15; Pg(c, [[tx, fy - u * 0.4], [tx - u * 1.6, fy - u * 3], [tx + u * 1.6, fy - u * 3]], red, true); }
    var bw = u * 30, bh = u * 9, bx2 = W - bw - u * 3, by2 = H - bh - u * 3; c.lineWidth = u * 0.4; c.strokeStyle = a1; c.fillStyle = alpha(sh, 0.25); c.fillRect(bx2, by2, bw, bh); c.strokeRect(bx2, by2, bw, bh); c.lineWidth = u * 0.22; c.beginPath(); c.moveTo(bx2, by2 + bh * 0.42); c.lineTo(bx2 + bw, by2 + bh * 0.42); c.moveTo(bx2 + bw * 0.62, by2); c.lineTo(bx2 + bw * 0.62, by2 + bh); c.moveTo(bx2 + bw * 0.62, by2 + bh * 0.71); c.lineTo(bx2 + bw, by2 + bh * 0.71); c.stroke();
    Rn(c, bx2 + u * 1.4, by2 + bh * 0.14, bw * 0.4, u * 1.1, u * 0.3, a2); Rn(c, bx2 + u * 1.4, by2 + bh * 0.56, bw * 0.28, u * 0.7, u * 0.3, alpha(ln, 0.4)); Rn(c, bx2 + u * 1.4, by2 + bh * 0.76, bw * 0.46, u * 0.7, u * 0.3, alpha(ln, 0.4)); starPath(c, bx2 + bw * 0.81, by2 + bh * 0.21, u * 1.5, u * 0.65, 5, 0); c.fillStyle = hot; c.fill();
    for (i = 0; i < 6; i++) Rn(c, u * 3 + i * u * 4, H - u * 4.4, u * 4, u * 1, 0, i % 2 ? alpha(ln, 0.2) : a1); c.lineWidth = u * 0.2; c.strokeStyle = a1; c.strokeRect(u * 3, H - u * 4.4, u * 24, u * 1); for (i = 0; i <= 6; i++) L(c, u * 3 + i * u * 4, H - u * 5.6, u * 3 + i * u * 4, H - u * 4.4, u * 0.2, a1);
    contact(c, W, H, fy + u * 0.4, u, sh, 0.16); castPools(c, W, H, u, sh, 0.2);
    vignette(c, W, H, sh, 0.3);
  }, { variants: ['plan', 'machine'], stage: 'band-low' });

  /* ---------- halftone: comic-book pop ---------- */
  function tone(c, W, y0, y1, s, col, f) { /* a field of halftone dots; f(x 0..1, y px) gives the size 0..1 */
    var j, i, r, x, y, odd = 0; c.fillStyle = col; c.beginPath();
    for (y = y0; y < y1 + s; y += s * 0.5, odd ^= 1) for (x = odd ? s * 0.5 : 0; x < W + s; x += s) { r = f(x / W, y); if (r > 0.08) { r = Math.min(r, 1) * s * 0.52; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } }
    c.fill();
  }
  function pow(c, x, y, r, n, rot, fill, ink, lw, inner) { /* a spiky comic burst */
    var i, pts = []; for (i = 0; i < n * 2; i++) { var a = rot + i * PI / n, rr = i % 2 ? r * 0.62 : r * (0.9 + 0.1 * ((i * 7) % 5) / 4); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    c.lineJoin = 'miter'; Pg(c, pts.map(function (q) { return [q[0] + lw * 0.9, q[1] + lw * 1.1]; }), ink, true); Pg(c, pts, fill, true); c.lineWidth = lw; c.strokeStyle = ink; c.stroke();
    if (inner) { pts = []; for (i = 0; i < n * 2; i++) { var a2 = rot + i * PI / n, r2 = (i % 2 ? r * 0.62 : r * 0.92) * 0.6; pts.push([x + Math.cos(a2) * r2, y + Math.sin(a2) * r2]); } Pg(c, pts, inner, true); }
    c.lineJoin = 'round';
  }
  Art.add('backdrop', 'halftone', function (c, W, H, t, p, o, u) {
    var v = o.variant, fy = H * 0.7, i, k = Math.exp(-4 * o.beat), dark = lum(p.bg) < 0.3, ink = dark ? deep(p.bg, 0.65) : p.ink, lw = u * 0.7, s = u * 2.9, cx = W / 2, cy = H * 0.4, D = Math.hypot(W, H);
    var wave = function (x, y) { return 0.06 * Math.sin(t * 1.2 + x * 9 + y / H * 7); };
    var d1 = mix(p.bg, p.accent, 0.62), d2 = mix(p.bg, dark ? p.snow : p.ink, dark ? 0.22 : 0.2), floorCol = v === 'rays' ? p.accent2 : v === 'panels' ? p.gold : p.accent;
    c.fillStyle = p.bg; c.fillRect(0, 0, W, H);
    if (v === 'rays') {
      c.fillStyle = mix(p.bg, p.bg2, 0.5); c.beginPath(); for (i = 0; i < 22; i += 2) { var a1 = i / 22 * TAU + t * 0.03, a2 = (i + 1) / 22 * TAU + t * 0.03; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a1) * D, cy + Math.sin(a1) * D); c.lineTo(cx + Math.cos(a2) * D, cy + Math.sin(a2) * D); c.closePath(); } c.fill();
      tone(c, W, 0, fy, s, d1, function (x, y) { var e = Math.hypot((x - 0.5) * W, y - cy) / (D * 0.5); return (e - 0.5) * 1.9 + wave(x, y); });
      c.strokeStyle = ink; c.lineCap = 'butt'; for (i = 0; i < 44; i++) { var a = i / 44 * TAU + 0.07, r0 = D * (0.4 + 0.06 * ((i * 5) % 7) / 6 + 0.012 * Math.sin(t * 3 + i)); c.lineWidth = u * (0.3 + ((i * 3) % 4) * 0.22); c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * D, cy + Math.sin(a) * D); c.stroke(); }
      c.lineCap = 'round';
    } else if (v === 'panels') {
      /* panels cut across the corners, thick gutters, each with its own tone */
      var trace = function (pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var q = 1; q < pts.length; q++) c.lineTo(pts[q][0], pts[q][1]); c.closePath(); };
      var pan = function (pts, fill, dots, f) { c.save(); trace(pts); c.fillStyle = fill; c.fill(); c.clip(); tone(c, W, 0, fy, s, dots, f); c.restore(); trace(pts); c.lineJoin = 'miter'; c.lineWidth = u * 2.6; c.strokeStyle = p.paper; c.stroke(); c.lineWidth = u * 0.8; c.strokeStyle = ink; c.stroke(); c.lineJoin = 'round'; };
      tone(c, W, 0, fy, s, d2, function (x, y) { return 0.28 + wave(x, y) - Math.max(0, 1 - Math.hypot((x - 0.5) / 0.5, (y - cy) / (H * 0.36))) * 0.6; });
      pan([[-u * 4, -u * 4], [W * 0.62, -u * 4], [-u * 4, H * 0.3]], p.accent2, mix(p.accent2, ink, 0.35), function (x, y) { return 0.9 - (x + y / H * 1.6) * 1.5 + wave(x, y); });
      pan([[W + u * 4, -u * 4], [W + u * 4, H * 0.36], [W * 0.7, -u * 4]], p.accent, mix(p.accent, p.snow, 0.5), function (x, y) { return (x - 0.72) * 3.2 + wave(x, y); });
      pan([[-u * 4, H * 0.44], [W * 0.17, H * 0.56], [W * 0.1, fy + u * 4], [-u * 4, fy + u * 4]], p.bg2, mix(p.bg2, p.accent, 0.5), function (x, y) { return 0.3 + (y / H - 0.44) * 2.2 + wave(x, y); });
      pan([[W + u * 4, H * 0.42], [W * 0.84, H * 0.52], [W * 0.9, fy + u * 4], [W + u * 4, fy + u * 4]], p.gold, mix(p.gold, p.accent, 0.6), function (x, y) { return 0.2 + (0.72 - y / H) * 2 + wave(x, y); });
    } else {
      /* pop: big flat discs off the corners, tone swelling out of two of them */
      dot(c, W * 0.02, H * 0.03, u * 34, ink); dot(c, W * 0.02 - u * 0.8, H * 0.03 - u * 0.8, u * 33.4, p.accent2);
      dot(c, W * 1.02, H * 0.52, u * 27, ink); dot(c, W * 1.02 + u * 0.8, H * 0.52 - u * 0.8, u * 26.4, p.bg2);
      tone(c, W, 0, fy, s, d1, function (x, y) { var e1 = Math.hypot((x - 1) * W, y) / (D * 0.5), e2 = Math.hypot(x * W, y - fy) / (D * 0.42); return Math.max(1.05 - e1 * 1.5, 0.95 - e2 * 1.6) + wave(x, y); });
      tone(c, W, 0, H * 0.3, s, mix(p.accent2, ink, 0.3), function (x, y) { var e = Math.hypot(x * W - W * 0.02, y - H * 0.03) / (u * 33); return e < 1 ? e * 1.3 - 0.5 + wave(x, y) : 0; });
    }
    calm(c, W, H, p.bg, v === 'pop' ? 0.5 : 0.4);
    /* bursts, stars and action marks round the edge */
    var B = v === 'rays' ? [[0.1, 0.07, 13, p.gold], [0.9, 0.13, 10, p.accent], [0.92, 0.6, 8, p.gold]] : v === 'panels' ? [[0.86, 0.3, 11, p.paper], [0.1, 0.38, 9, p.gold]] : [[0.84, 0.1, 13, p.gold], [0.1, 0.5, 9, p.paper], [0.9, 0.36, 7, p.accent]];
    for (i = 0; i < B.length; i++) { var bs = u * B[i][2] * (1 + ((i + o.n) % 2 ? k * 0.1 : 0)); pow(c, W * B[i][0], H * B[i][1], bs, 11 + i * 2, Math.sin(t * 1.1 + i * 2) * 0.07 + i, B[i][3], ink, lw, B[i][3] === p.paper ? null : mix(B[i][3], p.snow, 0.55)); }
    var S = [[0.3, 0.035, 2.6], [0.62, 0.05, 1.8], [0.05, 0.3, 2.2], [0.95, 0.47, 2], [0.06, 0.63, 1.7], [0.74, 0.03, 1.4]];
    for (i = 0; i < S.length; i++) { var sx = W * S[i][0], sy = H * S[i][1], sr = u * S[i][2] * (1 + 0.15 * Math.sin(t * 2.2 + i * 1.7)); starPath(c, sx + u * 0.35, sy + u * 0.4, sr, sr * 0.45, 4, 0.3 + i); c.fillStyle = ink; c.fill(); starPath(c, sx, sy, sr, sr * 0.45, 4, 0.3 + i); c.fillStyle = i % 2 ? p.paper : p.gold; c.fill(); c.lineWidth = u * 0.3; c.strokeStyle = ink; c.stroke(); }
    for (i = 0; i < 2; i++) { var qx = i ? W * 0.93 : W * 0.07, qy = H * (i ? 0.24 : 0.2), d = i ? -1 : 1, j; for (j = 0; j < 3; j++) L(c, qx + d * j * u * 1.6, qy + j * u * 2.2, qx + d * (j * u * 1.6 + u * (5 - j)), qy + j * u * 2.2 - u * (2.5 - j * 0.5), u * 0.7, ink); }
    /* the floor: a slab of flat colour under a thick line, toned darker towards us */
    c.fillStyle = floorCol; c.fillRect(0, fy, W, H - fy);
    tone(c, W, fy + s, H, s, mix(floorCol, ink, 0.4), function (x, y) { return (y - fy) / (H - fy) * 0.95 - 0.12 + Math.abs(x - 0.5) * 0.3; });
    Rn(c, 0, fy + u * 0.5, W, u * 1.1, 0, mix(floorCol, p.snow, 0.55)); Rn(c, 0, fy - u * 0.6, W, u * 1.2, 0, ink);
    castPools(c, W, H, u, ink, 0.3);
  }, { variants: ['pop', 'rays', 'panels'], stage: 'band-low' });

  /* ---------- checkerboard ---------- */
  function checkFloor(c, W, H, fy, cols, rows, a, b, spread) { /* a tiled floor running away to the wall */
    var i, r, cx = W / 2, cw = W / cols, y0, y1, k0, k1, n = Math.ceil(cols / 2) + 1;
    c.fillStyle = a; c.fillRect(0, fy, W, H - fy); c.fillStyle = b; c.beginPath();
    for (r = 0; r < rows; r++) { y0 = fy + (H - fy) * Math.pow(r / rows, 1.7); y1 = fy + (H - fy) * Math.pow((r + 1) / rows, 1.7); k0 = 1 + (y0 - fy) / (H - fy) * spread; k1 = 1 + (y1 - fy) / (H - fy) * spread;
      for (i = -n; i < n; i++) if ((i + r) & 1) { c.moveTo(cx + i * cw * k0, y0); c.lineTo(cx + (i + 1) * cw * k0, y0); c.lineTo(cx + (i + 1) * cw * k1, y1 + 0.5); c.lineTo(cx + i * cw * k1, y1 + 0.5); c.closePath(); } }
    c.fill();
  }
  Art.add('backdrop', 'checkerboard', function (c, W, H, t, p, o, u) {
    var v = o.variant, fy = H * (v === 'floor' ? 0.64 : 0.7), i, j, k = Math.exp(-4 * o.beat), sh = deep(p.bg, 0.55), A = p.bg, B = Math.abs(lum(p.bg) - lum(p.bg2)) < 0.12 ? shade(p.bg2, 0.16) : p.bg2, mid = mix(A, B, 0.5);
    var fa = lum(p.paper) > 0.5 ? p.paper : p.snow, fb = v === 'harlequin' ? p.accent2 : p.accent, rail = p.gold, R0 = rnd(o.seed + 'ck');
    if (v === 'floor') { /* a quiet panelled wall over a deep tiled floor */
      vgrad(c, W, H, [A, mix(A, B, 0.6)], 0, fy);
      var wy = fy - H * 0.2; vgrad2(c, 0, wy, W, fy - wy, mix(mid, sh, 0.08), mix(mid, sh, 0.16)); Rn(c, 0, wy - u * 0.9, W, u * 1.8, 0, mix(B, p.snow, 0.35)); Rn(c, 0, wy + u * 0.9, W, u * 0.4, 0, alpha(sh, 0.2));
      var n = W > H * 0.8 ? 5 : 4, pw = W / n; for (i = 0; i < n; i++) { c.lineWidth = u * 0.5; c.strokeStyle = alpha(sh, 0.16); c.strokeRect(i * pw + u * 2.2, wy + u * 3.2, pw - u * 4, fy - wy - u * 6.4); c.strokeStyle = alpha(p.snow, 0.3); c.strokeRect(i * pw + u * 2, wy + u * 3, pw - u * 4, fy - wy - u * 6.4); }
      for (j = 0; j < 2; j++) { var cs = u * 3.4, x0 = j ? W - cs * 4 : 0, yy; for (i = 0; i < 4; i++) for (yy = 0; yy * cs < wy - u * 1; yy++) if ((i + yy) & 1) { c.fillStyle = alpha(B === p.bg2 ? p.bg2 : B, 0.5); c.fillRect(x0 + i * cs, yy * cs, cs, Math.min(cs, wy - u * 0.9 - yy * cs)); } } /* a checked stripe down each side */
      for (j = 0; j < 2; j++) Rn(c, j ? W - u * 3.4 * 4 - u * 0.5 : u * 3.4 * 4, 0, u * 0.5, wy, 0, alpha(rail, 0.8));
    } else if (v === 'harlequin') { /* tall diamonds, a gold stud where four meet */
      var dw = W / (W > H * 0.8 ? 6 : 4.5), dh = dw * 1.7; c.fillStyle = A; c.fillRect(0, 0, W, fy); c.fillStyle = B; c.beginPath();
      for (j = -1; j * dh / 2 < fy + dh; j++) for (i = -1; i * dw < W + dw; i++) { var hx = i * dw + (j & 1 ? dw / 2 : 0), hy = j * dh / 2; if (j & 1) continue; c.moveTo(hx, hy - dh / 2); c.lineTo(hx + dw / 2, hy); c.lineTo(hx, hy + dh / 2); c.lineTo(hx - dw / 2, hy); c.closePath(); }
      c.fill();
      c.strokeStyle = alpha(sh, 0.12); c.lineWidth = u * 0.3; c.stroke();
      for (j = -1; j * dh / 2 < fy; j++) for (i = -1; i * dw < W + dw; i++) { if (!(j & 1)) continue; var gx = i * dw + dw / 2, gy = j * dh / 2 + dh / 2 - dh / 2; if (Math.hypot((gx - W / 2) / (W * 0.4), (gy - H * 0.4) / (H * 0.27)) < 1) continue; dot(c, gx + u * 0.15, gy + u * 0.2, u * 0.95, alpha(sh, 0.3)); dot(c, gx, gy, u * (0.85 + ((i + j + o.n) % 3 === 0 ? k * 0.3 : 0)), rail); dot(c, gx - u * 0.25, gy - u * 0.25, u * 0.28, shade(rail, 0.6)); }
      calm(c, W, H, mid, 0.62);
    } else { /* classic: big squares, a few of them catching the light in turn */
      var s = W / (W > H * 0.8 ? 6 : 5); c.fillStyle = A; c.fillRect(0, 0, W, fy); c.fillStyle = B; c.beginPath(); for (j = 0; j * s < fy; j++) for (i = 0; i * s < W; i++) if ((i + j) & 1) c.rect(i * s, j * s, s, s); c.fill();
      for (i = 0; i < 9; i++) { var tx = Math.floor(R0() * W / s), ty = Math.floor(R0() * fy / s), tw = 0.5 + 0.5 * Math.sin(t * 0.9 + i * 2.4); c.fillStyle = alpha(i % 3 ? p.snow : p.gold, 0.16 * tw + ((i + o.n) % 4 === 0 ? 0.12 * k : 0)); c.fillRect(tx * s, ty * s, s, s); }
      c.strokeStyle = alpha(sh, 0.1); c.lineWidth = u * 0.3; c.beginPath(); for (i = 1; i * s < W; i++) { c.moveTo(i * s, 0); c.lineTo(i * s, fy); } for (j = 1; j * s < fy; j++) { c.moveTo(0, j * s); c.lineTo(W, j * s); } c.stroke();
      calm(c, W, H, mid, 0.66);
    }
    /* the floor and the board along the foot of the wall */
    checkFloor(c, W, H, fy, v === 'floor' ? 7 : 9, v === 'floor' ? 9 : 7, fa, fb, v === 'floor' ? 2.6 : 2);
    vgrad2(c, 0, fy, W, H - fy, alpha(sh, 0.3), alpha(sh, 0)); vgrad2(c, 0, fy, W, (H - fy) * 0.5, alpha(p.snow, 0.14), alpha(p.snow, 0));
    var bh = u * 2.6; Rn(c, 0, fy - bh, W, bh, 0, mix(B, sh, 0.3)); Rn(c, 0, fy - bh, W, u * 0.5, 0, rail); Rn(c, 0, fy - u * 0.45, W, u * 0.45, 0, alpha(sh, 0.35));
    contact(c, W, H, fy, u, sh, 0.2); castPools(c, W, H, u, sh, 0.24);
    vignette(c, W, H, sh, 0.26);
  }, { variants: ['classic', 'floor', 'harlequin'], stage: 'band-low' });

  /* ---------- waves70s: fat flowing stripes ---------- */
  Art.add('backdrop', 'waves70s', function (c, W, H, t, p, o, u) {
    var v = o.variant, fy = H * 0.7, i, x, k = Math.exp(-4 * o.beat), sh = deep(p.bg, 0.55), n = 5, st = Math.max(8, W / 36);
    var cols = [p.accent, mix(p.accent, p.gold, 0.5), p.gold, mix(p.gold, p.accent2, 0.6), p.accent2], base = mix(p.bg, p.bg2, 0.5), fl = mix(deep(p.accent2, 0.5), p.bg2, 0.12);
    vgrad(c, W, H, [p.bg, base, p.bg2], 0, fy);
    glow(c, W / 2, H * 0.38, Math.max(W, H) * 0.5, p.paper, 0.2);
    if (v === 'arches') { /* rainbows springing from the floor at both sides, half-suns in the top corners */
      c.fillStyle = fl; c.fillRect(0, fy, W, H - fy);
      var ro = Math.min(W * 0.4, H * 0.3);
      for (var sd = 0; sd < 2; sd++) {
        var ax = sd ? W * 1.02 : -W * 0.02, br = 1 + 0.012 * Math.sin(t * 1.3 + sd * 2);
        dot(c, ax + u * 0.6, fy + u * 0.5, ro * br + u * 1.2, alpha(sh, 0.16));
        for (i = 0; i < n; i++) dot(c, ax, fy, ro * br * (1 - i * 0.155), cols[sd ? n - 1 - i : i]);
        dot(c, ax, fy, ro * br * (1 - n * 0.155), base);
        var tr = Math.min(W * 0.26, H * 0.17), tx = sd ? W : 0;
        for (i = 0; i < 3; i++) dot(c, tx, 0, tr * (1 - i * 0.2) * (1 + ((sd + o.n) % 2 ? k * 0.03 : 0)), cols[sd ? i : n - 1 - i]);
        for (i = 0; i < 7; i++) { var ra = (sd ? PI / 2 : 0) + (i + 0.5) / 7 * PI / 2 + Math.sin(t * 0.4) * 0.03; L(c, tx + Math.cos(ra) * tr * 1.14, Math.sin(ra) * tr * 1.14, tx + Math.cos(ra) * tr * (1.34 + (i % 2) * 0.14), Math.sin(ra) * tr * (1.34 + (i % 2) * 0.14), u * 1.1, cols[2]); }
      }
      c.fillStyle = fl; c.fillRect(0, fy, W, H - fy);
      for (i = 0; i < n; i++) Rn(c, 0, fy + u * (1.2 + i * 2.1), W, u * 1.3, 0, alpha(cols[i], 0.9 - i * 0.12));
    } else if (v === 'swoosh') { /* one ribbon of stripes pours down the left side and runs off along the floor; its echo crosses the top right corner */
      vgrad2(c, 0, fy, W, H - fy, fl, mix(fl, sh, 0.35));
      var wob = Math.sin(t * 0.5) * u * 1.2, bw = u * 4.2, pass;
      for (pass = 0; pass <= n; pass++) {
        var wd = pass === 0 ? bw * (n * 2 - 1) + u * 2.4 : bw * ((n - pass) * 2 + 1), col = pass === 0 ? alpha(sh, 0.2) : cols[pass - 1], oy = pass === 0 ? u * 1 : 0;
        c.lineCap = 'butt'; c.lineWidth = wd; c.strokeStyle = col;
        c.beginPath(); c.moveTo(W * 0.16, -u * 30 + oy); c.bezierCurveTo(W * 0.2 + wob, H * 0.3, -W * 0.34 - wob, H * 0.56, W * 0.1, fy + u * 20 + oy); c.bezierCurveTo(W * 0.4, H * 0.93 + oy, W * 0.72 + wob, fy + u * 8 + oy, W * 1.3, fy + u * 28 + oy); c.stroke();
        c.lineWidth = wd * 0.5; c.beginPath(); c.moveTo(W * 0.52, -u * 12 + oy); c.bezierCurveTo(W * 0.8, H * 0.06 + oy, W * 0.98 - wob, H * 0.1, W * 1.12, H * 0.34 + oy); c.stroke();
      }
      c.lineCap = 'round';
    } else { /* bands: stripes sag from the top like a pelmet and roll along the bottom like hills */
      for (i = n - 1; i >= 0; i--) { c.beginPath(); c.moveTo(0, 0); for (x = 0; x <= W + st; x += st) { var f = x / W, sdp = Math.pow(Math.abs(f - 0.5) * 2, 2.2); c.lineTo(x, H * (0.012 + i * 0.021) + sdp * H * (0.07 + i * 0.022) + Math.sin(f * TAU * 1.5 + t * 0.4 + i * 0.7) * u * 1.3); } c.lineTo(W, 0); c.closePath(); c.fillStyle = cols[i]; c.fill(); }
      for (i = 0; i < n + 1; i++) { c.beginPath(); c.moveTo(0, H); for (x = 0; x <= W + st; x += st) { var f2 = x / W, s2 = Math.pow(Math.abs(f2 - 0.5) * 2, 2); c.lineTo(x, fy + i * u * 4.6 - s2 * H * (0.11 - i * 0.022) * (i < n ? 1 : 0.2) + Math.sin(f2 * TAU * 1.25 - t * 0.35 + i * 0.9) * u * 1.5 * (i < n ? 1 : 0.4)); } c.lineTo(W, H); c.closePath(); c.fillStyle = i < n ? cols[n - 1 - i] : fl; c.fill(); }
      for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, H); for (x = 0; x <= W + st; x += st) c.lineTo(x, fy + u * (29 + i * 6.5) + Math.sin(x / W * TAU * (1 + i * 0.2) + t * 0.3 + i * 1.7) * u * 1.6); c.lineTo(W, H); c.closePath(); c.fillStyle = i % 2 ? deep(fl, 0.22 + i * 0.06) : mix(fl, cols[4], 0.3 - i * 0.05); c.fill(); }
    }
    if (v !== 'bands') { vgrad2(c, 0, fy + (H - fy) * 0.45, W, (H - fy) * 0.55, alpha(sh, 0), alpha(sh, 0.4)); for (i = 0; i < 5; i++) Rn(c, 0, H - u * (2.5 + i * 2.3), W, u * 0.5, 0, alpha(cols[i], 0.3)); }
    for (i = 0; i < 9; i++) { /* a few fat sparkles and daisies in the spare corners */
      var Q = [[0.3, 0.2], [0.72, 0.16], [0.06, 0.4], [0.94, 0.38], [0.5, 0.045], [0.9, 0.56], [0.1, 0.57], [0.8, 0.05], [0.2, 0.06]][i], qx = W * Q[0], qy = H * Q[1], qs = u * (1.6 + (i % 3) * 0.7) * (1 + 0.14 * Math.sin(t * 1.8 + i * 1.3));
      if (v === 'bands' && (i === 4 || i > 6)) continue; if (v === 'swoosh' && (i === 2 || i === 6 || i === 7)) continue; if (v === 'arches' && (i === 5 || i === 6 || i > 6)) continue;
      if (i % 3 === 0) { for (var d = 0; d < 6; d++) dot(c, qx + Math.cos(d / 6 * TAU + t * 0.2) * qs * 0.95, qy + Math.sin(d / 6 * TAU + t * 0.2) * qs * 0.95, qs * 0.62, p.paper); dot(c, qx, qy, qs * 0.62, cols[2]); }
      else twinkle(c, qx, qy, qs * 1.5, i % 2 ? p.paper : cols[2]);
    }
    calm(c, W, H, base, 0.22);
    contact(c, W, H, fy, u, sh, v === 'arches' ? 0.2 : 0.08); castPools(c, W, H, u, sh, 0.26);
    vignette(c, W, H, sh, 0.2);
  }, { variants: ['bands', 'arches', 'swoosh'], stage: 'band-low' });

  /* ---------- vaporsun: a slatted sun over a glowing grid, wire mountains ---------- */
  function wireMount(c, pts, hz, fill, line, lw) { /* a faceted ridge: pts = peaks and saddles [x, y] left to right, each joined to the horizon */
    var i; c.beginPath(); c.moveTo(pts[0][0], hz); for (i = 0; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineTo(pts[pts.length - 1][0], hz); c.closePath(); c.fillStyle = fill; c.fill();
    c.lineWidth = lw; c.strokeStyle = line; c.lineJoin = 'round'; c.stroke(); c.beginPath();
    for (i = 0; i < pts.length; i++) { var px = pts[i][0], py = pts[i][1], pk = i % 2 === 1; if (pk) { c.moveTo(px, py); c.lineTo(px - (hz - py) * 0.18, hz); c.moveTo(px, py); c.lineTo(px + (hz - py) * 0.3, hz); if (i + 1 < pts.length) { c.moveTo((px + pts[i - 1][0]) / 2, (py + pts[i - 1][1]) / 2); c.lineTo((px + pts[i + 1][0]) / 2, (py + pts[i + 1][1]) / 2); } } else if (i > 0 && i < pts.length - 1) { c.moveTo(px, py); c.lineTo(px, hz); } }
    c.lineWidth = lw * 0.6; c.stroke();
  }
  Art.add('backdrop', 'vaporsun', function (c, W, H, t, p, o, u) {
    var v = o.variant, hz = H * 0.69, i, cx = W / 2, k = Math.exp(-4 * o.beat), dark = lum(p.bg) < 0.4, sky0 = deep(p.bg, dark ? 0.45 : 0.12), low = mix(p.bg2, p.accent, 0.55), sh = deep(p.bg, 0.7);
    var neon = mix(p.accent2, p.snow, 0.25), sr = v === 'peaks' ? Math.min(W * 0.27, H * 0.17) : Math.min(W * 0.47, H * 0.27), sy = hz - sr * (v === 'peaks' ? 0.5 : 0.36), R0 = rnd(o.seed + 'vs');
    vgrad(c, W, H, [sky0, p.bg, mix(p.bg, p.bg2, 0.7), low], 0, hz);
    if (dark) K.skyStars(c, W, H, 46, o.seed, t, hz * 0.5, p.snow);
    glow(c, cx, sy, sr * 2.3, p.gold, 0.26 + 0.08 * k);
    c.save(); c.beginPath(); c.rect(0, 0, W, hz); c.clip();
    var g = c.createLinearGradient(0, sy - sr, 0, sy + sr); g.addColorStop(0, mix(p.gold, p.snow, 0.45)); g.addColorStop(0.45, p.gold); g.addColorStop(1, p.accent); c.fillStyle = g; c.beginPath(); c.arc(cx, sy, sr, 0, TAU); c.fill();
    c.fillStyle = mix(low, p.bg2, 0.35); var ph = frac(t * 0.06); for (i = 0; i < 7; i++) { var z = (i + ph) / 7, yy = sy - sr * 0.1 + z * sr * 1.1; c.fillRect(cx - sr, yy, sr * 2, sr * (0.012 + z * 0.085)); } /* slats that widen as they sink */
    c.restore();
    for (i = 0; i < 5; i++) { var bw = W * (0.2 + R0() * 0.2), bx = frac(R0() + t * 0.004 * (i % 2 ? 1 : -1)) * (W + bw) - bw, by = H * (0.08 + R0() * 0.4); if (Math.abs(bx + bw / 2 - cx) < W * 0.26) by = H * (0.03 + R0() * 0.04); Rn(c, bx, by, bw, u * 0.9, u * 0.45, alpha(p.paper, 0.4)); Rn(c, bx + bw * 0.2, by + u * 1.7, bw * 0.55, u * 0.55, u * 0.3, alpha(p.paper, 0.28)); } /* streak clouds */
    var mf = mix(sky0, p.accent, 0.22), ml = mix(p.accent, p.snow, 0.3), mlw = Math.max(1, u * 0.35);
    if (v === 'peaks') {
      wireMount(c, [[-W * 0.1, hz - u * 6], [W * 0.1, hz - H * 0.2], [W * 0.22, hz - H * 0.09], [W * 0.31, hz - H * 0.13], [W * 0.42, hz]], hz, mf, ml, mlw);
      wireMount(c, [[W * 0.58, hz], [W * 0.7, hz - H * 0.11], [W * 0.78, hz - H * 0.07], [W * 0.92, hz - H * 0.23], [W * 1.1, hz - u * 5]], hz, mf, ml, mlw);
      var px = W * 0.83, py = H * 0.12, pr = u * 6.5; glow(c, px, py, pr * 2.6, p.accent2, 0.25); dot(c, px, py, pr, mix(p.accent2, p.bg, 0.25)); c.save(); c.beginPath(); c.arc(px, py, pr, 0, TAU); c.clip(); c.fillStyle = alpha(p.snow, 0.3); for (i = 0; i < 3; i++) c.fillRect(px - pr, py - pr * 0.6 + i * pr * 0.5, pr * 2, pr * 0.16); c.restore();
      c.save(); c.translate(px, py); c.rotate(-0.35); c.beginPath(); c.ellipse(0, 0, pr * 1.9, pr * 0.42, 0, -0.12, PI + 0.12); c.lineWidth = u * 0.7; c.strokeStyle = p.gold; c.stroke(); c.restore();
    } else {
      wireMount(c, [[-W * 0.1, hz - u * 4], [W * 0.06, hz - H * 0.09], [W * 0.15, hz - H * 0.04], [W * 0.2, hz - H * 0.06], [W * 0.28, hz]], hz, mf, ml, mlw);
      wireMount(c, [[W * 0.72, hz], [W * 0.8, hz - H * 0.055], [W * 0.86, hz - H * 0.035], [W * 0.95, hz - H * 0.1], [W * 1.1, hz - u * 4]], hz, mf, ml, mlw);
    }
    for (i = 0; i < 5; i++) { /* outline shapes turning slowly in the upper corners */
      var T = [[0.1, 0.07, 4.2, 3], [0.9, 0.3, 3.2, 3], [0.07, 0.3, 2.6, 4], [0.24, 0.035, 2, 4], [0.92, 0.5, 2.4, 3]][i]; if (v === 'peaks' && i === 1) continue;
      starPath(c, W * T[0], H * T[1] + Math.sin(t * 0.7 + i) * u * 0.8, u * T[2], u * T[2] * (T[3] === 3 ? 0.5 : 0.7), T[3], t * 0.15 * (i % 2 ? 1 : -1) + i); c.lineWidth = u * 0.45; c.lineJoin = 'miter'; c.strokeStyle = i % 2 ? neon : mix(p.gold, p.snow, 0.3); c.stroke(); c.lineJoin = 'round';
    }
    /* the floor: a dark plain ruled with light, the sun laid down on it in bars */
    vgrad2(c, 0, hz, W, H - hz, mix(deep(p.bg2, 0.5), p.accent, 0.12), sh);
    for (i = 0; i < 7; i++) { var rz = (i + 0.5) / 7, ry = hz + (H - hz) * rz * rz * 0.9 + u * 0.6, rw = sr * (0.95 - rz * 0.5) * (1 + 0.04 * Math.sin(t * 2 + i)); Rn(c, cx - rw, ry, rw * 2, u * (0.5 + rz * 2.2), u * 0.4, alpha(i % 2 ? p.accent : p.gold, 0.5 - rz * 0.3)); }
    c.strokeStyle = alpha(neon, 0.9); c.lineWidth = Math.max(1, u * 0.3); c.lineCap = 'butt'; c.beginPath();
    for (i = -14; i <= 14; i++) { c.moveTo(cx + i * W * 0.036, hz); c.lineTo(cx + i * W * 0.3, H); }
    var gp = frac(t * 0.3); for (i = 0; i < 11; i++) { var gz = (i + gp) / 11, gy = hz + (H - hz) * gz * gz; c.moveTo(0, gy); c.lineTo(W, gy); }
    c.stroke(); c.lineCap = 'round';
    vgrad2(c, 0, hz, W, (H - hz) * 0.45, alpha(low, 0.55), alpha(low, 0));
    glow(c, cx, hz, W * 0.6, p.gold, 0.16 + 0.1 * k); Rn(c, 0, hz - u * 0.3, W, u * 0.6, 0, mix(p.gold, p.snow, 0.6));
    castPools(c, W, H, u, sh, 0.34);
    vignette(c, W, H, sh, 0.3);
  }, { variants: ['sunset', 'peaks'], stage: 'band-low', pal: 'dark' });

  /* ---------- papercut: sheets of cut paper laid one on another, each with its shadow ---------- */
  function sheet(c, W, H, u, edge, col, sh, st) { /* everything below the line edge(x) */
    var x, pass; for (pass = 0; pass < 2; pass++) { var oy = pass ? 0 : -u * 0.9; c.beginPath(); c.moveTo(-st, H + st); for (x = -st; x <= W + st; x += st) c.lineTo(x, edge(x / W) + oy); c.lineTo(W + st, H + st); c.closePath(); c.fillStyle = pass ? col : sh; c.fill(); }
    c.beginPath(); for (x = -st; x <= W + st; x += st) c.lineTo(x, edge(x / W) + u * 0.22); c.lineWidth = u * 0.3; c.strokeStyle = alpha('#ffffff', 0.28); c.stroke();
  }
  function paperTree(c, x, y, s, col, sh, kind, sway) {
    c.save(); c.translate(x, y); c.rotate(sway); Rn(c, -s * 0.06, -s * 0.5, s * 0.12, s * 0.55, 0, mix(col, '#3a2418', 0.5));
    if (kind) { Pg(c, [[s * 0.06, -s * 1.22], [s * 0.4, -s * 0.3], [-s * 0.28, -s * 0.3]], sh, true); Pg(c, [[0, -s * 1.25], [s * 0.34, -s * 0.33], [-s * 0.34, -s * 0.33]], col, true); Pg(c, [[0, -s * 1.25], [s * 0.34, -s * 0.33], [0, -s * 0.33]], alpha('#ffffff', 0.14), true); }
    else { dot(c, s * 0.05, -s * 0.76, s * 0.4, sh); dot(c, 0, -s * 0.8, s * 0.38, col); c.beginPath(); c.arc(0, -s * 0.8, s * 0.38, -PI / 2, PI / 2); c.fillStyle = alpha('#ffffff', 0.14); c.fill(); }
    c.restore();
  }
  Art.add('backdrop', 'papercut', function (c, W, H, t, p, o, u) {
    var v = o.variant, i, st = Math.max(6, W / 60), shc = deep(p.bg, 0.6), sh = alpha(shc, 0.26), k = Math.exp(-4 * o.beat), R0 = rnd(o.seed + 'pc'), n = 6;
    var ramp = [mix(p.bg2, p.accent2, 0.22), mix(p.bg2, p.accent2, 0.5), mix(p.accent2, p.gold, 0.3), p.accent2, deep(p.accent2, 0.2), deep(p.accent2, 0.36)], tree = [p.accent, deep(p.accent2, 0.35), mix(p.gold, p.accent, 0.4)];
    vgrad(c, W, H, [p.bg, mix(p.bg, p.bg2, 0.75)], 0, H * 0.7);
    for (i = 0; i < 26; i++) { c.fillStyle = alpha(i % 2 ? p.snow : shc, 0.035); c.fillRect(R0() * W, R0() * H * 0.7, u * (3 + R0() * 9), u * 0.25); } /* paper grain */
    /* a paper sun with cut rays and two paper clouds */
    var sx = W * 0.8, sy = H * 0.105, rr = u * 7.5; for (i = 0; i < 12; i++) { var a = i / 12 * TAU + t * 0.05; Pg(c, [[sx + Math.cos(a - 0.1) * rr * 1.2, sy + Math.sin(a - 0.1) * rr * 1.2], [sx + Math.cos(a) * rr * (1.75 + (i % 2) * 0.3 + ((i + o.n) % 2 ? k * 0.1 : 0)), sy + Math.sin(a) * rr * (1.75 + (i % 2) * 0.3)], [sx + Math.cos(a + 0.1) * rr * 1.2, sy + Math.sin(a + 0.1) * rr * 1.2]], mix(p.gold, p.paper, 0.35), true); }
    dot(c, sx + u * 0.5, sy + u * 0.8, rr, sh); dot(c, sx, sy, rr, p.gold); dot(c, sx, sy, rr * 0.68, mix(p.gold, p.paper, 0.4));
    for (i = 0; i < 3; i++) { var cw = u * [26, 18, 15][i], cxx = frac([0.02, 0.6, 0.35][i] + t * 0.004 * (i + 1)) * (W + cw * 2) - cw, cyy = H * [0.17, 0.27, 0.045][i]; K.cloud(c, cxx + u * 0.5, cyy + u * 0.9, cw, sh); K.cloud(c, cxx, cyy, cw, p.paper); }
    if (v === 'frame') { /* a tunnel book: each sheet has a window cut in it, the windows growing towards us */
      for (i = 0; i < 5; i++) {
        var ins = u * (19 - i * 3.7), top = u * (13 - i * 2.6), bot = H * (0.655 + i * 0.024), ph = i * 1.9, pass, col = ramp[i + 1];
        for (pass = 0; pass < 2; pass++) {
          var ox = pass ? 0 : u * 0.7, oy = pass ? 0 : u * 1.1, x, y, m = 22, q;
          c.beginPath(); c.rect(-2, -2, W + 4, H + 4);
          for (q = 0; q <= m; q++) { x = ins + (W - ins * 2) * q / m; y = top + Math.sin(q * 1.1 + ph) * u * 1.3 + Math.pow(Math.abs(q / m - 0.5) * 2, 2.4) * u * 5; if (q) c.lineTo(x + ox, y + oy); else c.moveTo(x + ox, y + oy); }
          for (q = 1; q <= m; q++) { y = top + u * 5 + (bot - top - u * 5) * q / m; x = W - ins + Math.sin(q * 0.9 + ph) * u * 1.4; c.lineTo(x + ox, y + oy); }
          for (q = 1; q <= m; q++) { x = W - ins - (W - ins * 2) * q / m; y = bot + Math.sin(q * 0.8 + ph * 2) * u * 1.1 - Math.pow(Math.abs(q / m - 0.5) * 2, 2) * u * 3; c.lineTo(x + ox, y + oy); }
          for (q = 1; q < m; q++) { y = bot - (bot - top - u * 5) * q / m; x = ins + Math.sin(q * 0.9 + ph + 2) * u * 1.4; c.lineTo(x + ox, y + oy); }
          c.closePath(); c.fillStyle = pass ? col : sh; c.fill('evenodd');
        }
        if (i < 4) for (var s2 = 0; s2 < 2; s2++) { var tx = s2 ? W - ins - u * (2.5 + i) : ins + u * (2.5 + i); paperTree(c, tx, bot + u * 0.6, u * (8 + i * 1.6), tree[(i + s2) % 3], sh, (i + s2) % 2, Math.sin(t * 0.9 + i + s2) * 0.03); }
      }
    } else {
      var scallop = v === 'waves';
      for (i = 0; i < n; i++) {
        var edge = (function (i) { var b = H * (0.5 + i * 0.045), a1 = H * (0.2 - i * 0.03), f1 = 1.1 + (i * 0.37) % 1, p1 = i * 2.3 + (scallop ? Math.sin(t * 0.3 + i) * 0.25 : 0), sw = u * (scallop ? 9.5 - i * 0.6 : 0), off = (i % 2) * 0.5;
          return function (f) { var y = b - Math.pow(Math.abs(f - 0.5) * 2, 2) * a1 + Math.sin(f * TAU * f1 + p1) * u * (scallop ? 1.2 : 3.2); if (scallop) { var q = frac(f * W / sw + off) - 0.5; y -= Math.sqrt(Math.max(0, 0.25 - q * q)) * sw * 0.62; } return y; }; })(i);
        sheet(c, W, H, u, edge, ramp[i], sh, scallop ? Math.max(3, W / 180) : st);
        if (i > 0 && i < n - 1) for (var s3 = 0; s3 < 2; s3++) { var f = s3 ? 0.97 - i * 0.045 - R0() * 0.03 : 0.03 + i * 0.045 + R0() * 0.03; paperTree(c, f * W, edge(f) + u * 1.2, u * (7 + i * 1.5), tree[(i + s3) % 3], sh, (i + s3 + (scallop ? 1 : 0)) % 2, Math.sin(t * 0.9 + i + s3) * 0.03); if (!scallop && i % 2) paperTree(c, (f + (s3 ? -0.05 : 0.05)) * W, edge(f + (s3 ? -0.05 : 0.05)) + u * 1.2, u * (5 + i), tree[(i + s3 + 1) % 3], sh, (i + s3 + 1) % 2, Math.sin(t * 0.9 + i) * 0.03); }
      }
      if (scallop) { /* a scalloped valance of cloud-paper along the top */
        for (i = 2; i >= 0; i--) { var sw2 = u * (10 + i * 2), x2, yb = u * (2 + i * 3.4), pass2; for (pass2 = 0; pass2 < 2; pass2++) { c.beginPath(); c.moveTo(-sw2, -2); c.lineTo(W + sw2, -2); c.lineTo(W + sw2, yb); for (x2 = Math.ceil(W / sw2) + 1; x2 >= -1; x2--) c.arc(x2 * sw2 + (i % 2) * sw2 * 0.5 + Math.sin(t * 0.3 + i) * u, yb + (pass2 ? 0 : u * 0.9), sw2 * 0.52, 0, PI); c.closePath(); c.fillStyle = pass2 ? [p.paper, mix(p.paper, p.bg, 0.35), mix(p.paper, p.bg, 0.6)][i] : sh; c.fill(); } }
      }
    }
    for (i = 0; i < 3; i++) { var bx = W * (0.16 + i * 0.07) + Math.sin(t * 0.3 + i) * u * 2, by = H * (0.33 + (i % 2) * 0.02) + Math.cos(t * 0.4 + i) * u, fl = Math.sin(t * 5 + i * 2) * u * 0.6; c.beginPath(); c.moveTo(bx - u * 1.6, by - u * 0.6 + fl); c.quadraticCurveTo(bx - u * 0.6, by - u * 1.1, bx, by); c.quadraticCurveTo(bx + u * 0.6, by - u * 1.1, bx + u * 1.6, by - u * 0.6 + fl); c.lineWidth = u * 0.4; c.strokeStyle = alpha(shc, 0.55); c.stroke(); } /* three birds */
    /* the front sheet: cut grass blades and paper flowers along the foot, thicker at the sides */
    var front = ramp[5], blade = mix(ramp[4], p.gold, 0.18), R1 = rnd(o.seed + 'pf');
    for (i = 0; i < 34; i++) { var gx = R1() * W, gy = H * (0.8 + R1() * 0.2), gs = u * (2.2 + R1() * 2.6) * (0.7 + (gy / H - 0.8) * 3), lean = (R1() - 0.5) * 0.5 + Math.sin(t * 1.1 + i) * 0.05; Pg(c, [[gx - gs * 0.22, gy], [gx + Math.sin(lean) * gs, gy - gs], [gx + gs * 0.22, gy]], i % 3 ? blade : mix(front, shc, 0.25), true); }
    for (i = 0; i < 12; i++) { var e = R1(), fx = (i % 2 ? 1 - e * e * 0.42 : e * e * 0.42) * W, fy2 = H * (0.82 + R1() * 0.15), fs = u * (1.5 + R1() * 1.3) * (0.8 + (fy2 / H - 0.8) * 3), fc = [p.paper, p.gold, p.accent, mix(p.accent, p.paper, 0.5)][i % 4]; L(c, fx, fy2, fx + Math.sin(t * 1.1 + i) * u * 0.2, fy2 + fs * 1.9, u * 0.35, blade); K.flower(c, fx + u * 0.3, fy2 + u * 0.4, fs, sh, sh, i); K.flower(c, fx, fy2, fs, fc, fc === p.gold ? p.accent : p.gold, i + Math.sin(t * 0.8 + i) * 0.15); }
    castPools(c, W, H, u, shc, 0.26);
    vgrad2(c, 0, H * 0.86, W, H * 0.14, alpha(shc, 0), alpha(shc, 0.2));
    vignette(c, W, H, shc, 0.18);
  }, { variants: ['hills', 'frame', 'waves'], stage: 'band-low' });

  /* ---------- softglow: nothing but soft light; quiet enough for a sympathy card ---------- */
  Art.add('backdrop', 'softglow', function (c, W, H, t, p, o, u) {
    var v = o.variant, fy = H * 0.73, i, M = Math.max(W, H), sh = deep(p.bg, 0.5), light = mix(p.paper, p.gold, 0.18), R0 = rnd(o.seed + 'sg'), br = 0.5 + 0.5 * Math.sin(t * 0.35), pale = lum(p.bg) > 0.55, g;
    vgrad(c, W, H, [mix(p.bg, sh, 0.1), p.bg, mix(p.bg, p.bg2, 0.6), p.bg2], 0, fy);
    if (v === 'dawn') { /* light coming up from behind the floor line, thin haze lying over it */
      c.save(); c.translate(W / 2, fy); c.scale(1, 0.62); glow(c, 0, 0, M * 0.72, light, 0.5 + 0.06 * br); glow(c, 0, 0, M * 0.34, p.snow, 0.4); c.restore();
      for (i = 0; i < 5; i++) { var hy = fy - H * (0.03 + i * 0.05) + Math.sin(t * 0.2 + i) * u * 0.6, hh = u * (2.2 + i * 0.8), hx = Math.sin(t * 0.07 + i * 1.7) * W * 0.06; g = c.createLinearGradient(0, hy - hh, 0, hy + hh); g.addColorStop(0, alpha(p.snow, 0)); g.addColorStop(0.5, alpha(p.snow, pale ? 0.3 : 0.12)); g.addColorStop(1, alpha(p.snow, 0)); c.fillStyle = g; c.fillRect(hx - W * 0.1, hy - hh, W * 1.2, hh * 2); }
    } else if (v === 'shafts') { /* soft shafts falling from the top left */
      glow(c, W * 0.08, -H * 0.02, M * 0.75, light, 0.42);
      for (i = 0; i < 5; i++) { var a = 0.62 + i * 0.17 + Math.sin(t * 0.13 + i * 1.3) * 0.025, wd = 0.045 + (i % 2) * 0.03, len = M * 1.3, ox = -W * 0.08, oy = -H * 0.05; g = c.createLinearGradient(ox, oy, ox + Math.cos(a) * len, oy + Math.sin(a) * len); g.addColorStop(0, alpha(light, pale ? 0.42 : 0.2)); g.addColorStop(0.7, alpha(light, 0.04)); g.addColorStop(1, alpha(light, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a - wd) * len, oy + Math.sin(a - wd) * len); c.lineTo(ox + Math.cos(a + wd) * len, oy + Math.sin(a + wd) * len); c.closePath(); c.fill(); }
    } else { /* glow: one great soft light high in the middle */
      glow(c, W / 2, H * 0.34, M * (0.56 + 0.02 * br), light, 0.5); glow(c, W / 2, H * 0.34, M * 0.26, p.snow, 0.3 + 0.05 * br);
    }
    for (i = 0; i < 12; i++) { /* a few very soft discs out at the edges, drifting */
      var sd = i % 2, bx = (sd ? 0.9 : 0.1) * W + (R0() - 0.5) * W * 0.24 + Math.sin(t * (0.1 + R0() * 0.1) + i) * u * 3, by = R0() * fy * 0.96 + Math.cos(t * (0.08 + R0() * 0.1) + i * 2) * u * 2, rr = u * (5 + R0() * 11), al = (0.07 + R0() * 0.08) * (0.7 + 0.3 * Math.sin(t * (0.3 + R0() * 0.4) + i)) * (pale ? 1 : 0.55);
      glow(c, bx, by, rr * 1.5, i % 3 ? p.snow : light, al * 1.6);
    }
    for (i = 0; i < 16; i++) { var mx = R0() * W, my = frac(R0() - t * 0.006 * (0.5 + R0())) * fy, ma = 0.5 + 0.5 * Math.sin(t * (0.5 + R0()) + i * 2); if (Math.abs(mx - W / 2) < W * 0.3 && my > H * 0.1) continue; dot(c, mx, my, u * (0.2 + R0() * 0.3), alpha(p.snow, 0.5 * ma)); } /* motes */
    /* the ground: the same colour a little deeper, a soft bright line where it meets the light, a pool of light lying on it */
    vgrad2(c, 0, fy, W, H - fy, mix(p.bg2, sh, pale ? 0.14 : 0.3), mix(p.bg2, sh, pale ? 0.3 : 0.55));
    vgrad2(c, 0, fy - u * 2.5, W, u * 2.5, alpha(p.snow, 0), alpha(p.snow, pale ? 0.5 : 0.22)); vgrad2(c, 0, fy, W, u * 5, alpha(p.snow, pale ? 0.4 : 0.16), alpha(p.snow, 0));
    c.save(); c.translate(v === 'shafts' ? W * 0.6 : W / 2, fy + (H - fy) * 0.42); c.scale(1, 0.3); glow(c, 0, 0, W * 0.62, light, v === 'dawn' ? 0.34 : 0.22); c.restore();
    castPools(c, W, H, u, sh, 0.2);
    vignette(c, W, H, sh, pale ? 0.16 : 0.34);
  }, { variants: ['glow', 'dawn', 'shafts'], stage: 'band-low' });
});
