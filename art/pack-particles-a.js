/* Send a Carol art pack: particles and motion sets (leaves, window rain, streamers, sparkles, bokeh, paper planes, rising
   balloons, dandelion seeds, sky lanterns, cherry blossom, shamrocks, dust motes, shooting stars, sprinkles, feathers,
   butterflies, glitter, soft snow). Blocks only come in through CarolArt.add; nothing here replaces launch art.
   A particle set is drawn over the backdrop and under the photos and the words: present, never in the way. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, dot = K.dot, L = K.L, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;

  /* ---------- helpers ---------- */
  function lum(col) { var q = K.rgbOf(col) || [128, 128, 128]; return (q[0] * 0.299 + q[1] * 0.587 + q[2] * 0.114) / 255; }
  function lightPal(p) { return (lum(p.bg) + lum(p.bg2)) / 2 > 0.6; }
  /* the soft edge that keeps a pale thing readable on a pale backdrop */
  function rimOf(p, a) { return alpha(mix(p.ink, p.bg, 0.3), a); }

  /* ---------- leaves: autumn leaves tumbling down (beech, maple, oak) ---------- */
  var MAPLE = [[-0.7, 0], [-0.78, 0.5], [-0.36, 0.3], [-0.26, 0.96], [-0.04, 0.6], [0.3, 0.76], [0.24, 0.3], [0.6, 0.4], [0.58, 0.15], [1, 0]];
  function leafShape(c, s, kind, col) {
    var i, a, w, x;
    c.fillStyle = col; c.beginPath();
    if (kind === 0) { c.moveTo(-s, 0); c.quadraticCurveTo(-s * 0.1, -s * 0.8, s, 0); c.quadraticCurveTo(-s * 0.1, s * 0.8, -s, 0); }
    else if (kind === 1) { for (i = 0; i < MAPLE.length; i++) { if (i) c.lineTo(MAPLE[i][0] * s, MAPLE[i][1] * s); else c.moveTo(MAPLE[i][0] * s, MAPLE[i][1] * s); } for (i = MAPLE.length - 2; i >= 0; i--) c.lineTo(MAPLE[i][0] * s, -MAPLE[i][1] * s); }
    else {
      for (i = 0; i <= 20; i++) { a = i / 20; w = s * 0.56 * Math.pow(Math.sin(PI * a), 0.6) * (0.72 + 0.28 * Math.cos(a * TAU * 4 + PI)); if (i) c.lineTo(-s + 2 * s * a, -w); else c.moveTo(-s, 0); }
      for (i = 19; i >= 1; i--) { a = i / 20; w = s * 0.56 * Math.pow(Math.sin(PI * a), 0.6) * (0.72 + 0.28 * Math.cos(a * TAU * 4 + PI)); c.lineTo(-s + 2 * s * a, w); }
    }
    c.closePath(); c.lineJoin = 'round'; c.fill();
    c.strokeStyle = shade(col, -0.3); c.lineCap = 'round'; c.lineWidth = s * 0.09; c.beginPath(); c.moveTo(-s * 1.42, s * 0.1); c.quadraticCurveTo(-s * 1.1, 0, -s * 0.8, 0); c.lineTo(s * 0.72, 0);
    for (i = 0; i < 3; i++) { x = s * (-0.45 + i * 0.36); w = s * (kind === 1 ? 0.34 : 0.24); c.moveTo(x, 0); c.lineTo(x + w, -w); c.moveTo(x, 0); c.lineTo(x + w, w); }
    c.stroke();
  }
  Art.add('particles', 'leaves', function (c, W, H, t, p, o, u) {
    var n = Math.round(20 * o.amount), i, R0 = rnd(o.seed + 'lv'), m = u * 6,
      cols = [mix('#e2711d', p.accent, 0.22), mix('#f2b134', p.gold, 0.4), mix('#b5452c', p.accent, 0.3), '#9a6230', mix('#d9a441', p.gold, 0.3), mix('#8b9a3c', p.accent2, 0.3)];
    for (i = 0; i < n; i++) {
      var far = i % 3 === 0, sp = (0.034 + R0() * 0.034) * (far ? 0.7 : 1), ph = R0() * 6.3, sf = 0.5 + R0() * 0.6,
        x = frac(R0() + t * 0.01 + Math.sin(t * sf + ph) * 0.035) * (W + m * 2) - m, y = frac(R0() + t * sp) * (H + m * 2) - m,
        s = u * (far ? 1.9 + R0() * 0.8 : 3 + R0() * 1.9), rot = R0() * 6.3 + Math.sin(t * sf + ph + 1.2) * 0.9 + t * (R0() - 0.5) * 0.8, fl = Math.cos(t * (0.9 + R0() * 1.4) + ph), col = cols[i % 6];
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, 0.32 + 0.68 * Math.abs(fl)); c.globalAlpha = far ? 0.62 : 0.94;
      leafShape(c, s, i % 3 === 0 ? (i % 2 ? 0 : 2) : i % 3, fl > 0 ? col : shade(col, -0.16));
      c.restore();
    }
  });

  /* ---------- rain: rain on a window pane: far streaks, beads resting on the glass, drops that run and leave a trail ---------- */
  function beads(c, B, u, body, rim, hi) {
    var i;
    c.fillStyle = body; c.beginPath(); for (i = 0; i < B.length; i += 3) { c.moveTo(B[i] + B[i + 2], B[i + 1]); c.ellipse(B[i], B[i + 1], B[i + 2], B[i + 2] * 1.14, 0, 0, TAU); } c.fill();
    c.strokeStyle = rim; c.lineWidth = u * 0.16; c.lineCap = 'round'; c.beginPath(); for (i = 0; i < B.length; i += 3) { c.moveTo(B[i] + B[i + 2] * 0.93, B[i + 1] + B[i + 2] * 0.2); c.arc(B[i], B[i + 1] + B[i + 2] * 0.08, B[i + 2] * 0.95, 0.06 * PI, 0.94 * PI); } c.stroke();
    c.fillStyle = hi; c.beginPath(); for (i = 0; i < B.length; i += 3) { c.moveTo(B[i], B[i + 1]); c.ellipse(B[i] - B[i + 2] * 0.3, B[i + 1] - B[i + 2] * 0.4, B[i + 2] * 0.3, B[i + 2] * 0.2, -0.6, 0, TAU); } c.fill();
  }
  function wob(y, u, x0, k1, k2) { return x0 + Math.sin(y / u * 0.09 + k1) * u * 0.8 + Math.sin(y / u * 0.031 + k2) * u * 1.3; }
  Art.add('particles', 'rain', function (c, W, H, t, p, o, u) {
    var lt = lightPal(p), i, j, R0 = rnd(o.seed + 'rn'), n = Math.round(24 * o.amount), wet = mix(p.bg, '#ffffff', lt ? 0.72 : 0.4), dark = shade(p.bg, -0.5),
      body = alpha(wet, lt ? 0.62 : 0.3), rim = alpha(dark, lt ? 0.3 : 0.5), hi = alpha('#ffffff', lt ? 0.95 : 0.75), B = [];
    c.lineCap = 'round'; c.lineWidth = u * 0.16; c.strokeStyle = lt ? alpha(dark, 0.14) : 'rgba(255,255,255,0.13)'; c.beginPath();
    for (i = 0; i < n; i++) { var x = R0() * W * 1.1, y = frac(R0() + t * (0.5 + R0() * 0.3)) * (H * 1.2) - H * 0.1, l = u * (3 + R0() * 4.5); c.moveTo(x, y); c.lineTo(x - l * 0.16, y + l); }
    c.stroke();
    n = Math.round(46 * o.amount);
    for (i = 0; i < n; i++) { var r = u * (0.32 + R0() * R0() * 1.2); B.push(R0() * W, R0() * H + Math.sin(t * 0.5 + i) * r * 0.12, r); }
    n = Math.round(8 * o.amount);
    for (i = 0; i < n; i++) {
      var per = 4.5 + R0() * 5, ph = t / per + R0(), cyc = Math.floor(ph), f = ph - cyc, R1 = rnd(o.seed + 'rr' + i + '.' + (cyc % 53)), x0 = R1() * W, y0 = H * (R1() * 0.55 - 0.08), len = H * (0.4 + R1() * 0.5), k1 = R1() * 6.3, k2 = R1() * 6.3, hr = u * (0.85 + R1() * 0.6),
        g = f + Math.sin(f * TAU * 3 + k1) * 0.045, yh = y0 + len * g, a = Math.min(1, f * 10, (1 - f) * 6), tl = Math.max(0, Math.min(yh - y0, H * 0.2));
      for (j = 0; j < 9; j++) { var ya = yh - tl * j / 9, yb = yh - tl * (j + 1) / 9; c.beginPath(); c.moveTo(wob(ya, u, x0, k1, k2), ya); c.lineTo(wob(yb, u, x0, k1, k2), yb); c.lineWidth = hr * (1.15 - j * 0.1); c.strokeStyle = alpha(wet, a * (lt ? 0.6 : 0.3) * (1 - j / 9)); c.stroke(); }
      for (j = 1; j <= 3; j++) { var ybd = y0 + len * (j * 0.22 + R1() * 0.08), ab = a * clamp(1 - (yh - ybd) / (H * 0.3), 0, 1); if (yh > ybd + hr * 2 && ab > 0.05) { c.globalAlpha = ab; beads(c, [wob(ybd, u, x0, k1, k2), ybd, hr * 0.38], u, body, rim, hi); } }
      c.globalAlpha = a; beads(c, [wob(yh, u, x0, k1, k2), yh, hr * 1.05], u, body, rim, hi); c.globalAlpha = 1;
    }
    beads(c, B, u, body, rim, hi);
  });

  /* ---------- streamers: paper serpentine curling as it falls ---------- */
  Art.add('particles', 'streamers', function (c, W, H, t, p, o, u) {
    var n = Math.round(9 * o.amount), i, j, pass, R0 = rnd(o.seed + 'sm'), cols = [p.accent, p.gold, p.accent2, '#58b4ff', '#ff8ad0', p.snow], m = u * 16, N = 30;
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (i = 0; i < n; i++) {
      var sp = 0.03 + R0() * 0.035, x = frac(R0() + Math.sin(t * (0.3 + R0() * 0.3) + i) * 0.02) * W, y = frac(R0() + t * sp) * (H + m * 2) - m, len = u * (19 + R0() * 15), A = u * (1.7 + R0() * 1.1), turns = 2.4 + R0() * 1.6,
        spin = t * (1.4 + R0() * 1.2) * (i % 2 ? 1 : -1) + R0() * 6.3, col = cols[i % 6], tilt = (R0() - 0.5) * 0.7 + Math.sin(t * 0.6 + i) * 0.22;
      c.save(); c.translate(x, y); c.rotate(tilt); c.lineWidth = u * 1.3;
      for (pass = 0; pass < 2; pass++) {
        c.beginPath();
        for (j = 0; j < N; j++) {
          var a0 = j / N, a1 = (j + 1) / N, th0 = a0 * turns * TAU + spin, th1 = a1 * turns * TAU + spin, front = Math.cos((th0 + th1) / 2) > 0;
          if (front !== (pass === 1)) continue;
          c.moveTo(Math.sin(th0) * A * (0.55 + 0.45 * a0), (a0 - 0.5) * len); c.lineTo(Math.sin(th1) * A * (0.55 + 0.45 * a1), (a1 - 0.5) * len);
        }
        c.strokeStyle = pass ? col : shade(col, -0.3); c.stroke();
      }
      c.restore();
    }
  });

  /* ---------- sparkles: long-rayed sparkles that bloom and fade, each with its little companions ---------- */
  Art.add('particles', 'sparkles', function (c, W, H, t, p, o, u) {
    var n = Math.round(13 * o.amount), i, j, k = Math.exp(-5 * o.beat), lt = lightPal(p), cols = lt ? ['#ffffff', p.gold, '#ffffff', mix(p.accent, '#ffffff', 0.6)] : [p.gold, '#ffffff', mix(p.accent, '#ffffff', 0.5), p.gold], edge = alpha(shade(p.gold, -0.3), 0.75);
    for (i = 0; i < n; i++) {
      var per = 2.2 + (i % 5) * 0.43, ph = t / per + i * 0.618, cyc = Math.floor(ph), f = ph - cyc, R1 = rnd(o.seed + 'sp' + i + '.' + (cyc % 89)), x = R1() * W, y = R1() * H, big = u * (2.8 + R1() * 3.4) * (1 + k * 0.18), e = Math.sin(f * PI), s = e * e * big, col = cols[i % 4], rot = (R1() - 0.5) * 0.5 + (f - 0.5) * 0.6;
      if (s < u * 0.12) continue;
      dot(c, x, y, s * 0.8, alpha(lt ? '#ffffff' : p.gold, (lt ? 0.3 : 0.17) * e));
      c.save(); c.translate(x, y); c.rotate(rot);
      K.starPath(c, 0, 0, s, s * 0.13, 4, 0); c.fillStyle = col; c.fill(); if (lt) { c.lineWidth = u * 0.16; c.lineJoin = 'round'; c.strokeStyle = edge; c.stroke(); }
      K.starPath(c, 0, 0, s * 0.44, s * 0.11, 4, PI / 4); c.fillStyle = col; c.fill();
      dot(c, 0, 0, s * 0.15, '#ffffff');
      c.restore();
      for (j = 0; j < 3; j++) { var an = R1() * TAU, d = big * (0.65 + R1() * 0.6), e2 = Math.sin(clamp(f * 1.5 - 0.2 - j * 0.12, 0, 1) * PI), s2 = e2 * e2 * big * (0.2 + R1() * 0.14); if (s2 > u * 0.1) K.twinkle(c, x + Math.cos(an) * d, y + Math.sin(an) * d, s2, j % 2 ? col : (lt ? p.gold : '#ffffff')); }
    }
  });

  /* ---------- bokeh: soft out-of-focus lights drifting slowly up ---------- */
  Art.add('particles', 'bokeh', function (c, W, H, t, p, o, u) {
    var n = Math.round(15 * o.amount), i, R0 = rnd(o.seed + 'bo'), cols = [p.gold, p.snow, shade(p.accent, 0.35), shade(p.accent2, 0.4), '#ffe9b0'], m = u * 16;
    for (i = 0; i < n; i++) {
      var x = frac(R0() + Math.sin(t * (0.1 + R0() * 0.12) + i) * 0.025) * (W + m * 2) - m, y = frac(R0() - t * (0.005 + R0() * 0.009)) * (H + m * 2) - m, r = u * (3 + R0() * R0() * 12),
        a = (0.12 + R0() * 0.16) * (0.7 + 0.3 * Math.sin(t * (0.5 + R0() * 1.1) + i * 1.7)), col = cols[i % 5];
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = alpha(col, a * 0.6); c.fill(); c.lineWidth = u * 0.35; c.strokeStyle = alpha(col, a * 1.25); c.stroke();
      c.beginPath(); c.arc(x, y, r * 0.72, PI * 1.08, PI * 1.5); c.lineWidth = r * 0.12; c.lineCap = 'round'; c.strokeStyle = alpha('#ffffff', a * 0.8); c.stroke();
      if (i % 3 === 0) dot(c, x + r * 0.9, y + r * 0.75, r * 0.3, alpha(col, a * 0.7));
    }
  });

  /* ---------- paperplanes: folded paper planes gliding across, a dashed trail behind each ---------- */
  function glide(f, q) { return [q.x0 + q.dx * f, q.y0 + Math.sin(f * q.w + q.ph) * q.amp - f * q.rise]; }
  Art.add('particles', 'paperplanes', function (c, W, H, t, p, o, u) {
    var n = Math.round(4 * o.amount), i, j, R0 = rnd(o.seed + 'pp'), lt = lightPal(p), m = u * 8, tr = lt ? mix(p.ink, p.bg, 0.3) : '#ffffff', edge = alpha(mix(p.ink, p.bg, 0.2), 0.55);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (i = 0; i < n; i++) {
      var dir = i % 2 ? -1 : 1, f = frac(R0() + t * (0.03 + R0() * 0.025)), q = { x0: dir > 0 ? -m : W + m, dx: dir * (W + m * 2), y0: H * (0.1 + R0() * 0.78), w: TAU * (0.8 + R0() * 0.9), ph: R0() * 6.3, amp: u * (4 + R0() * 5), rise: u * (6 + R0() * 10) },
        s = u * (3.4 + R0() * 2.2), P0 = glide(f, q), P1 = glide(f + 0.004, q), ang = Math.atan2(P1[1] - P0[1], P1[0] - P0[0]), pc = i % 3 === 2 ? mix(p.paper, p.gold, 0.25) : p.paper;
      c.lineWidth = u * 0.38;
      for (j = 1; j < 18; j += 2) { var fa = f - 0.02 - j * 0.0095, fb = fa - 0.0075; if (fb < 0) break; var A = glide(fa, q), B = glide(fb, q); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.strokeStyle = alpha(tr, (1 - j / 18) * (lt ? 0.6 : 0.7)); c.stroke(); }
      c.save(); c.translate(P0[0], P0[1]); c.rotate(ang); if (dir < 0) c.scale(1, -1); c.rotate(Math.sin(t * 1.7 + i) * 0.06);
      c.lineWidth = u * 0.16; c.strokeStyle = edge;
      c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.95, s * 0.24); c.lineTo(-s * 0.5, -s * 0.02); c.closePath(); c.fillStyle = shade(pc, -0.16); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.5, -s * 0.02); c.lineTo(-s * 0.6, s * 0.52); c.closePath(); c.fillStyle = shade(pc, -0.3); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(s, 0); c.lineTo(-s, -s * 0.62); c.lineTo(-s * 0.5, -s * 0.02); c.closePath(); c.fillStyle = pc; c.fill(); c.stroke();
      c.restore();
    }
  });

  /* ---------- balloonsup: party balloons let go, rising with their strings ---------- */
  Art.add('particles', 'balloonsup', function (c, W, H, t, p, o, u) {
    var n = Math.round(9 * o.amount), i, R0 = rnd(o.seed + 'bu'), lt = lightPal(p), m = u * 16, cols = [p.accent, p.gold, p.accent2, mix(p.accent, '#ffffff', 0.4), '#58b4ff', '#ff8ad0'], str = lt ? alpha(p.ink, 0.42) : 'rgba(255,255,255,0.6)';
    c.lineCap = 'round';
    for (i = 0; i < n; i++) {
      var far = i % 3 === 2, f = frac(R0() + t * (0.028 + R0() * 0.028) * (far ? 0.7 : 1)), ph = R0() * 6.3, sf = 0.5 + R0() * 0.5, x = frac(R0() + Math.sin(t * sf + ph) * 0.02) * W, y = (1 - f) * (H + m * 2) - m, r = u * (far ? 2 + R0() * 0.8 : 3 + R0() * 2.2), col = cols[i % 6], tilt = Math.cos(t * sf + ph) * 0.16, sw = Math.sin(t * 1.6 + ph) * r * 0.35;
      c.save(); c.translate(x, y); c.rotate(tilt); c.globalAlpha = far ? 0.72 : 0.96;
      c.beginPath(); c.moveTo(0, r * 1.32); c.bezierCurveTo(r * 0.4 + sw, r * 2.2, -r * 0.4 - sw, r * 3.2, sw * 0.6, r * 4.3); c.lineWidth = u * 0.16; c.strokeStyle = str; c.stroke();
      c.beginPath(); c.moveTo(0, r * 1.12); c.lineTo(r * 0.24, r * 1.42); c.lineTo(-r * 0.24, r * 1.42); c.closePath(); c.fillStyle = shade(col, -0.22); c.fill();
      c.beginPath(); c.ellipse(0, 0, r, r * 1.2, 0, 0, TAU); c.fillStyle = shade(col, -0.18); c.fill();
      c.beginPath(); c.ellipse(-r * 0.09, -r * 0.1, r * 0.88, r * 1.06, 0, 0, TAU); c.fillStyle = col; c.fill();
      c.beginPath(); c.ellipse(-r * 0.4, -r * 0.52, r * 0.2, r * 0.36, 0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fill();
      c.restore();
    }
  });

  /* ---------- dandelion: dandelion seeds carried off on the breeze ---------- */
  Art.add('particles', 'dandelion', function (c, W, H, t, p, o, u) {
    var n = Math.round(13 * o.amount), i, j, pass, R0 = rnd(o.seed + 'dn'), lt = lightPal(p), m = u * 6, rim = rimOf(p, lt ? 0.5 : 0.25), seed = mix('#7a5a34', p.ink, 0.3);
    c.lineCap = 'round';
    for (i = 0; i < n; i++) {
      var ph = R0() * 6.3, x = frac(R0() + t * (0.012 + R0() * 0.014) + Math.sin(t * (0.3 + R0() * 0.3) + ph) * 0.03) * (W + m * 2) - m, y = frac(R0() - t * (0.008 + R0() * 0.012)) * (H + m * 2) - m + Math.sin(t * (0.6 + R0() * 0.5) + ph) * u * 2.2,
        s = u * (2.2 + R0() * 2), rot = 0.4 + Math.sin(t * (0.7 + R0() * 0.5) + ph) * 0.3, far = i % 4 === 3;
      c.save(); c.translate(x, y); c.rotate(rot); if (far) c.scale(0.7, 0.7); c.globalAlpha = far ? 0.7 : 1;
      dot(c, 0, -s * 0.45, s * 0.95, alpha('#ffffff', lt ? 0.16 : 0.1));
      for (pass = 0; pass < 2; pass++) {
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, s * 1.5);
        for (j = 0; j < 9; j++) { var a = -PI / 2 + (j - 4) * 0.3, ln = s * (0.92 + (j % 2) * 0.1); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a) * ln * 0.4, -ln * 0.55, Math.cos(a) * ln, Math.sin(a) * ln * 0.85 - s * 0.1); }
        c.lineWidth = pass ? u * 0.13 : u * 0.34; c.strokeStyle = pass ? '#ffffff' : rim; c.stroke();
      }
      c.fillStyle = '#ffffff'; c.beginPath(); for (j = 0; j < 9; j++) { var a2 = -PI / 2 + (j - 4) * 0.3, l2 = s * (0.92 + (j % 2) * 0.1), tx = Math.cos(a2) * l2, ty = Math.sin(a2) * l2 * 0.85 - s * 0.1; c.moveTo(tx + u * 0.2, ty); c.arc(tx, ty, u * 0.2, 0, TAU); } c.fill();
      c.beginPath(); c.ellipse(0, s * 1.62, s * 0.11, s * 0.26, 0, 0, TAU); c.fillStyle = seed; c.fill();
      c.restore();
    }
  });

  /* ---------- lanternsup: paper sky lanterns rising, each with its own small flame ---------- */
  Art.add('particles', 'lanternsup', function (c, W, H, t, p, o, u) {
    var n = Math.round(8 * o.amount), i, R0 = rnd(o.seed + 'lu'), m = u * 14, cols = ['#ff9a3c', '#ffb347', mix('#ff7a59', p.accent, 0.35), mix('#ffc04d', p.gold, 0.5)], lt = lightPal(p),
      G = c.createRadialGradient(0, 0, 0, 0, 0, 1), gc = lt ? '#fff1c4' : '#ffc061';
    G.addColorStop(0, alpha(gc, lt ? 0.6 : 0.36)); G.addColorStop(0.45, alpha(gc, lt ? 0.26 : 0.15)); G.addColorStop(1, alpha(gc, 0));
    for (i = 0; i < n; i++) {
      var far = i % 3 === 1, f = frac(R0() + t * (0.016 + R0() * 0.014) * (far ? 0.65 : 1)), ph = R0() * 6.3, x = frac(R0() + Math.sin(t * (0.25 + R0() * 0.25) + ph) * 0.018 + t * 0.002) * W, y = (1 - f) * (H + m * 2) - m, s = u * (far ? 1.5 + R0() * 0.7 : 2.5 + R0() * 1.9), col = cols[i % 4], fk = 0.85 + 0.15 * Math.sin(t * 7 + ph) * Math.sin(t * 3.1 + i);
      c.save(); c.translate(x, y + s * 0.3); c.scale(s * 3.6, s * 3.6); c.globalAlpha = fk; c.fillStyle = G; c.fillRect(-1, -1, 2, 2); c.restore();
      c.save(); c.translate(x, y); c.rotate(Math.sin(t * 0.5 + ph) * 0.09); c.globalAlpha = far ? 0.8 : 1;
      c.beginPath(); c.moveTo(-s * 0.62, -s * 1.2); c.quadraticCurveTo(0, -s * 1.46, s * 0.62, -s * 1.2); c.bezierCurveTo(s * 1.06, -s * 0.6, s * 0.95, s * 0.5, s * 0.55, s * 1.2); c.lineTo(-s * 0.55, s * 1.2); c.bezierCurveTo(-s * 0.95, s * 0.5, -s * 1.06, -s * 0.6, -s * 0.62, -s * 1.2); c.closePath(); c.fillStyle = col; c.fill();
      c.lineWidth = Math.max(0.5, s * 0.05); c.strokeStyle = alpha(shade(col, -0.4), 0.55); c.stroke();
      c.beginPath(); c.ellipse(0, s * 0.35, s * 0.6, s * 0.8, 0, 0, TAU); c.fillStyle = alpha('#ffe08a', 0.75 * fk); c.fill();
      c.beginPath(); c.ellipse(0, s * 0.78, s * 0.34, s * 0.38, 0, 0, TAU); c.fillStyle = alpha('#fff8d8', 0.95 * fk); c.fill();
      c.strokeStyle = alpha(shade(col, -0.35), 0.3); c.lineWidth = Math.max(0.4, s * 0.045); c.beginPath(); c.moveTo(-s * 0.26, -s * 1.3); c.quadraticCurveTo(-s * 0.5, 0, -s * 0.24, s * 1.2); c.moveTo(s * 0.26, -s * 1.3); c.quadraticCurveTo(s * 0.5, 0, s * 0.24, s * 1.2); c.stroke();
      c.fillStyle = shade(col, -0.42); c.fillRect(-s * 0.58, s * 1.12, s * 1.16, s * 0.16);
      c.beginPath(); c.ellipse(-s * 0.2, -s * 1.0, s * 0.3, s * 0.12, -0.25, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.28)'; c.fill();
      c.restore();
    }
  });

  /* ---------- sakura: cherry blossom on the wind: notched petals, and now and then a whole flower ---------- */
  function sakuraPetal(c, s) { c.beginPath(); c.moveTo(0, s); c.bezierCurveTo(-s * 0.95, s * 0.3, -s * 0.85, -s * 0.75, -s * 0.28, -s); c.lineTo(0, -s * 0.66); c.lineTo(s * 0.28, -s); c.bezierCurveTo(s * 0.85, -s * 0.75, s * 0.95, s * 0.3, 0, s); c.closePath(); }
  Art.add('particles', 'sakura', function (c, W, H, t, p, o, u) {
    var n = Math.round(24 * o.amount), i, j, R0 = rnd(o.seed + 'sk'), m = u * 5, cols = ['#ffc2d4', '#ffe1ea', '#ff9ebb', mix('#ffb3c9', p.accent, 0.25)], edge = 'rgba(201,86,125,0.38)', gust = Math.sin(t * 0.35) * 0.012;
    c.lineJoin = 'round';
    for (i = 0; i < n; i++) {
      var ph = R0() * 6.3, x = frac(R0() + t * (0.018 + R0() * 0.016) + gust + Math.sin(t * (0.5 + R0() * 0.5) + ph) * 0.03) * (W + m * 2) - m, y = frac(R0() + t * (0.03 + R0() * 0.03)) * (H + m * 2) - m, s = u * (1.15 + R0() * 1.05), rot = R0() * 6.3 + t * (0.5 + R0() * 0.9) * (i % 2 ? 1 : -1), fl = Math.cos(t * (1.3 + R0() * 1.8) + ph), col = cols[i % 4];
      c.save(); c.translate(x, y); c.rotate(rot); c.lineWidth = u * 0.13; c.strokeStyle = edge;
      if (i % 6 === 5) {
        c.scale(1, 0.8 + 0.2 * Math.abs(fl));
        for (j = 0; j < 5; j++) { c.save(); c.rotate(j / 5 * TAU); c.translate(0, -s * 1.02); sakuraPetal(c, s * 0.92); c.fillStyle = j % 2 ? cols[0] : cols[1]; c.fill(); c.stroke(); c.restore(); }
        dot(c, 0, 0, s * 0.42, '#f47aa0'); for (j = 0; j < 5; j++) { var a = j / 5 * TAU + 0.6; dot(c, Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.12, '#ffd54a'); } dot(c, 0, 0, s * 0.16, '#ffe9a0');
      } else {
        c.scale(1, 0.34 + 0.66 * Math.abs(fl)); c.globalAlpha = 0.95;
        sakuraPetal(c, s); c.fillStyle = fl > 0 ? col : shade(col, -0.08); c.fill(); c.stroke();
        c.beginPath(); c.ellipse(0, s * 0.55, s * 0.2, s * 0.36, 0, 0, TAU); c.fillStyle = 'rgba(240,110,150,0.4)'; c.fill();
      }
      c.restore();
    }
  });

  /* ---------- shamrockfall: three-leaf shamrocks floating down, a glint of gold among them ---------- */
  Art.add('particles', 'shamrockfall', function (c, W, H, t, p, o, u) {
    var n = Math.round(15 * o.amount), i, j, R0 = rnd(o.seed + 'sh'), m = u * 6, cols = ['#2e9e5b', '#56c271', '#1f8048', mix('#3fae68', p.accent2, 0.4)], k = Math.exp(-5 * o.beat);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (i = 0; i < n; i++) {
      var ph = R0() * 6.3, sf = 0.5 + R0() * 0.6, x = frac(R0() + Math.sin(t * sf + ph) * 0.03) * (W + m * 2) - m, y = frac(R0() + t * (0.028 + R0() * 0.03)) * (H + m * 2) - m, s = u * (1.5 + R0() * 1.5), rot = (R0() - 0.5) * 1.2 + Math.cos(t * sf + ph) * 0.55, fl = Math.cos(t * (0.7 + R0()) + ph), col = cols[i % 4], far = i % 4 === 0;
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(0.45 + 0.55 * Math.abs(fl), 1); if (far) c.scale(0.7, 0.7); c.globalAlpha = far ? 0.7 : 0.96;
      c.beginPath(); c.moveTo(0, s * 0.1); c.quadraticCurveTo(s * 0.1, s * 0.9, s * 0.5, s * 1.45); c.lineWidth = s * 0.17; c.strokeStyle = shade(col, -0.25); c.stroke();
      for (j = 0; j < 3; j++) {
        c.save(); c.rotate(j * TAU / 3); K.heartPath(c, 0, -s * 0.62, s * 1.16); c.fillStyle = j ? col : shade(col, 0.12); c.fill(); c.lineWidth = s * 0.07; c.strokeStyle = shade(col, -0.3); c.stroke();
        c.beginPath(); c.moveTo(0, -s * 0.12); c.lineTo(0, -s * 0.78); c.lineWidth = s * 0.06; c.strokeStyle = shade(col, 0.32); c.stroke(); c.restore();
      }
      c.restore();
    }
    n = Math.round(7 * o.amount);
    for (i = 0; i < n; i++) { var per = 2 + (i % 3) * 0.5, pg = t / per + i * 0.618, cy = Math.floor(pg), fg = pg - cy, R1 = rnd(o.seed + 'sg' + i + '.' + (cy % 71)), e = Math.sin(fg * PI); K.twinkle(c, R1() * W, R1() * H, e * e * u * (1 + R1() * 1.2) * (1 + k * 0.25), p.gold); }
  });

  /* ---------- motes: dust in a shaft of light: slow, sparse, calm ---------- */
  Art.add('particles', 'motes', function (c, W, H, t, p, o, u) {
    var lt = lightPal(p), i, R0 = rnd(o.seed + 'mo'), n = Math.round(24 * o.amount), TH = 0.42, cs = Math.cos(TH), sn = Math.sin(TH), beam = lt ? '#ffffff' : mix(p.gold, '#ffffff', 0.5), core = mix(p.gold, '#ffffff', lt ? 0.75 : 0.55), halo = lt ? mix(p.gold, '#ffffff', 0.2) : p.gold,
      BM = [[W * 0.2, u * 13, 0.9], [W * 0.62, u * 22, 0.7]], b;
    for (b = 0; b < 2; b++) {
      var bw = BM[b][1], ba = (lt ? 0.2 : 0.075) * BM[b][2] * (0.8 + 0.2 * Math.sin(t * 0.23 + b * 2)), g;
      c.save(); c.translate(BM[b][0], -H * 0.04); c.rotate(TH); g = c.createLinearGradient(-bw, 0, bw, 0); g.addColorStop(0, alpha(beam, 0)); g.addColorStop(0.5, alpha(beam, ba)); g.addColorStop(1, alpha(beam, 0)); c.fillStyle = g; c.fillRect(-bw, 0, bw * 2, H * 1.3); c.restore();
    }
    for (i = 0; i < n; i++) {
      var ph = R0() * 6.3, x = frac(R0() + t * 0.0015 + Math.sin(t * (0.07 + R0() * 0.09) + ph) * 0.02) * W, y = frac(R0() - t * (0.003 + R0() * 0.005)) * H + Math.cos(t * (0.11 + R0() * 0.1) + ph) * u * 2, r = u * (0.16 + R0() * R0() * 0.5), br = 0.5 + 0.5 * Math.sin(t * (0.3 + R0() * 0.45) + ph), inb = 0;
      for (b = 0; b < 2; b++) { var lx = (x - BM[b][0]) * cs + (y + H * 0.04) * sn; inb = Math.max(inb, 1 - Math.abs(lx) / BM[b][1]); }
      var a = clamp(0.3 + 0.45 * br + 0.45 * inb, 0, 1);
      dot(c, x, y, r * 4.2, alpha(halo, (lt ? 0.22 : 0.12) * a)); dot(c, x, y, r, alpha(core, 0.35 + 0.65 * a));
    }
  });

  /* ---------- starfall: shooting stars across a sky of small steady ones ---------- */
  Art.add('particles', 'starfall', function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'sf'), n = Math.round(16 * o.amount), lt = lightPal(p), gold = lt ? shade(p.gold, -0.1) : p.gold, hot = lt ? mix(p.gold, '#ffffff', 0.6) : '#ffffff';
    for (i = 0; i < n; i++) { var x = R0() * W, y = R0() * H, s = u * (0.22 + R0() * 0.3), tw = 0.5 + 0.5 * Math.sin(t * (0.8 + R0() * 1.6) + R0() * 6.3); if (i % 4 === 0) K.twinkle(c, x, y, s * (2.6 + tw * 1.4), alpha(i % 8 ? gold : hot, 0.5 + 0.4 * tw)); else dot(c, x, y, s, alpha(hot, 0.3 + 0.5 * tw)); }
    n = Math.round(5 * o.amount);
    for (i = 0; i < n; i++) {
      var per = 2.7 + (i % 4) * 0.55, ph = t / per + i * 0.37, cyc = Math.floor(ph), f = ph - cyc, R1 = rnd(o.seed + 'ss' + i + '.' + (cyc % 67));
      if (f > 0.6) continue;
      var g = f / 0.6, an = 0.5 + R1() * 0.45, dx = -Math.cos(an), dy = Math.sin(an), D = u * (40 + R1() * 40), e = 1 - Math.pow(1 - g, 2), sx = W * (0.25 + R1() * 0.85) + dx * D * e, sy = H * (R1() * 0.62 - 0.03) + dy * D * e, a = Math.pow(Math.sin(g * PI), 0.7), tl = u * (13 + R1() * 12) * Math.sin(g * PI), lay = [[0.95, 0.16, gold], [0.52, 0.4, gold], [0.2, 0.9, hot]];
      for (j = 0; j < 3; j++) { var hw = u * lay[j][0]; c.beginPath(); c.moveTo(sx - dy * hw, sy + dx * hw); c.lineTo(sx - dx * tl * (1 - j * 0.12), sy - dy * tl * (1 - j * 0.12)); c.lineTo(sx + dy * hw, sy - dx * hw); c.closePath(); c.fillStyle = alpha(lay[j][2], lay[j][1] * a); c.fill(); }
      for (j = 0; j < 5; j++) { var q = R1(), off = (R1() - 0.5) * u * 1.6, tk = 0.5 + 0.5 * Math.sin(t * 11 + j * 2.1 + i); dot(c, sx - dx * tl * (0.3 + q * 0.8) - dy * off, sy - dy * tl * (0.3 + q * 0.8) + dx * off, u * (0.12 + 0.16 * tk), alpha(j % 2 ? gold : hot, a * (0.4 + 0.5 * tk))); }
      dot(c, sx, sy, u * 2.4, alpha(gold, 0.2 * a)); c.globalAlpha = a; K.twinkle(c, sx, sy, u * (1.7 + 0.3 * Math.sin(t * 14 + i)), gold); dot(c, sx, sy, u * 0.5, '#ffffff'); c.globalAlpha = 1;
    }
  });

  /* ---------- sprinkles: cake sprinkles: sugar rods, pearls and little rings ---------- */
  Art.add('particles', 'sprinkles', function (c, W, H, t, p, o, u) {
    var n = Math.round(40 * o.amount), i, R0 = rnd(o.seed + 'sx'), m = u * 3, cols = ['#ff6fa3', '#ffd23f', '#5ec8f2', '#7be0a4', '#ffffff', '#b48cf2', p.accent, p.gold];
    c.lineCap = 'round';
    for (i = 0; i < n; i++) {
      var x = frac(R0() + Math.sin(t * (0.5 + R0() * 0.6) + i) * 0.012) * W, y = frac(R0() + t * (0.03 + R0() * 0.04)) * (H + m * 2) - m, s = u * (0.8 + R0() * 0.7), rot = R0() * 6.3 + t * (0.5 + R0() * 1.1) * (i % 2 ? 1 : -1), col = cols[i % 8], dk = shade(col, -0.3), kind = i % 5;
      c.save(); c.translate(x, y); c.rotate(rot);
      if (kind < 3) {
        c.beginPath(); c.moveTo(-s * 1.1, 0); c.lineTo(s * 1.1, 0); c.lineWidth = s * 0.95; c.strokeStyle = dk; c.stroke(); c.lineWidth = s * 0.68; c.strokeStyle = col; c.stroke();
        c.beginPath(); c.moveTo(-s * 0.85, -s * 0.12); c.lineTo(s * 0.2, -s * 0.12); c.lineWidth = s * 0.16; c.strokeStyle = 'rgba(255,255,255,0.6)'; c.stroke();
      } else if (kind === 3) { dot(c, 0, 0, s * 0.62, dk); dot(c, -s * 0.05, -s * 0.05, s * 0.5, col); dot(c, -s * 0.2, -s * 0.2, s * 0.17, 'rgba(255,255,255,0.75)'); }
      else { c.beginPath(); c.arc(0, 0, s * 0.72, 0, TAU); c.lineWidth = s * 0.6; c.strokeStyle = dk; c.stroke(); c.lineWidth = s * 0.4; c.strokeStyle = col; c.stroke(); }
      c.restore();
    }
  });

  /* ---------- feathers: soft feathers rocking down like a pendulum ---------- */
  function feather(c, s, col, rim) {
    var i, q, bx, by, w;
    c.beginPath(); c.moveTo(-s * 0.6, s * 0.04); c.bezierCurveTo(-s * 0.25, -s * 0.54, s * 0.6, -s * 0.46, s, -s * 0.06); c.bezierCurveTo(s * 0.65, s * 0.32, -s * 0.1, s * 0.44, -s * 0.6, s * 0.04); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = Math.max(0.5, s * 0.04); c.lineJoin = 'round'; c.strokeStyle = rim; c.stroke();
    c.beginPath(); c.moveTo(-s * 0.6, s * 0.04); c.quadraticCurveTo(s * 0.1, -s * 0.12, s, -s * 0.06); c.bezierCurveTo(s * 0.65, s * 0.32, -s * 0.1, s * 0.44, -s * 0.6, s * 0.04); c.closePath(); c.fillStyle = shade(col, -0.09); c.fill();
    c.lineCap = 'round'; c.lineWidth = Math.max(0.4, s * 0.028); c.beginPath();
    for (i = 0; i < 7; i++) { q = 0.12 + i * 0.12; bx = (1 - q) * (1 - q) * -s * 0.6 + 2 * q * (1 - q) * s * 0.1 + q * q * s; by = (1 - q) * (1 - q) * s * 0.04 + 2 * q * (1 - q) * -s * 0.12 + q * q * -s * 0.06; w = s * 0.24 * Math.pow(Math.sin(PI * (0.1 + q * 0.85)), 0.6); c.moveTo(bx, by); c.lineTo(bx + s * 0.13, by - w); c.moveTo(bx, by); c.lineTo(bx + s * 0.13, by + w * 0.95); }
    c.stroke();
    c.beginPath(); c.moveTo(-s * 1.05, s * 0.16); c.quadraticCurveTo(-s * 0.8, s * 0.08, -s * 0.6, s * 0.04); c.quadraticCurveTo(s * 0.1, -s * 0.12, s * 0.96, -s * 0.06); c.lineWidth = Math.max(0.6, s * 0.055); c.stroke();
    c.strokeStyle = col; c.lineWidth = Math.max(0.6, s * 0.06); c.beginPath(); c.moveTo(-s * 0.68, s * 0.06); c.quadraticCurveTo(-s * 0.74, -s * 0.12, -s * 0.56, -s * 0.2); c.moveTo(-s * 0.7, s * 0.08); c.quadraticCurveTo(-s * 0.74, s * 0.26, -s * 0.54, s * 0.3); c.moveTo(-s * 0.8, s * 0.1); c.quadraticCurveTo(-s * 0.9, 0, -s * 0.8, -s * 0.1); c.stroke();
  }
  Art.add('particles', 'feathers', function (c, W, H, t, p, o, u) {
    var n = Math.round(9 * o.amount), i, R0 = rnd(o.seed + 'fe'), lt = lightPal(p), m = u * 8, cols = [p.snow, p.paper, mix(p.snow, p.accent, 0.16), mix(p.snow, p.bg, 0.22)], rim = rimOf(p, lt ? 0.6 : 0.5);
    for (i = 0; i < n; i++) {
      var ph = R0() * 6.3, sf = 0.55 + R0() * 0.45, th = t * sf + ph, x = frac(R0()) * (W + m * 2) - m + Math.sin(th) * u * 7, y = frac(R0() + t * (0.018 + R0() * 0.016)) * (H + m * 2) - m - Math.abs(Math.sin(th)) * u * 2.2, s = u * (4.4 + R0() * 2.8), rot = (i % 2 ? PI : 0) + 0.25 - Math.sin(th) * 0.55, far = i % 4 === 3;
      c.save(); c.translate(x, y); c.rotate(rot); if (far) c.scale(0.65, 0.65); c.globalAlpha = far ? 0.75 : 0.97; c.scale(1, 1.25 + 0.2 * Math.cos(th * 0.7 + i));
      feather(c, s, cols[i % 4], rim);
      c.restore();
    }
  });

  /* ---------- butterflydrift: butterflies wandering through, wings beating ---------- */
  function butterfly(c, s, col, flap) { /* heading up */
    var i, dk = shade(col, -0.36), pale = shade(col, 0.4);
    for (i = -1; i <= 1; i += 2) {
      c.save(); c.scale(i * flap, 1);
      c.beginPath(); c.moveTo(0, -s * 0.1); c.bezierCurveTo(s * 0.25, -s * 1.02, s * 1.18, -s * 1.02, s * 1.02, -s * 0.35); c.bezierCurveTo(s * 0.96, 0, s * 0.4, s * 0.1, 0, s * 0.05); c.closePath(); c.fillStyle = dk; c.fill();
      c.beginPath(); c.moveTo(s * 0.08, -s * 0.16); c.bezierCurveTo(s * 0.3, -s * 0.82, s * 0.96, -s * 0.84, s * 0.85, -s * 0.36); c.bezierCurveTo(s * 0.78, -s * 0.1, s * 0.4, -s * 0.02, s * 0.08, -s * 0.04); c.closePath(); c.fillStyle = col; c.fill();
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(s * 0.6, s * 0.05, s * 0.92, s * 0.5, s * 0.56, s * 0.82); c.bezierCurveTo(s * 0.3, s * 0.96, s * 0.05, s * 0.5, 0, s * 0.15); c.closePath(); c.fillStyle = dk; c.fill();
      c.beginPath(); c.ellipse(s * 0.4, s * 0.42, s * 0.22, s * 0.3, -0.5, 0, TAU); c.fillStyle = pale; c.fill();
      dot(c, s * 0.8, -s * 0.62, s * 0.09, '#ffffff'); dot(c, s * 0.6, -s * 0.4, s * 0.1, pale); dot(c, s * 0.93, -s * 0.4, s * 0.06, '#ffffff');
      c.restore();
    }
    c.lineCap = 'round'; c.strokeStyle = '#3a2a22'; c.lineWidth = s * 0.06; c.beginPath(); c.moveTo(0, -s * 0.42); c.quadraticCurveTo(-s * 0.12, -s * 0.75, -s * 0.32, -s * 0.9); c.moveTo(0, -s * 0.42); c.quadraticCurveTo(s * 0.12, -s * 0.75, s * 0.32, -s * 0.9); c.stroke();
    L(c, 0, -s * 0.34, 0, s * 0.42, s * 0.17, '#3a2a22'); dot(c, 0, -s * 0.42, s * 0.12, '#3a2a22');
  }
  Art.add('particles', 'butterflydrift', function (c, W, H, t, p, o, u) {
    var n = Math.round(7 * o.amount), i, R0 = rnd(o.seed + 'bd'), m = u * 6, cols = [p.accent, p.gold, mix(p.accent2, '#ffffff', 0.2), '#ff9ab8', '#8ecbff', '#ffb347'];
    for (i = 0; i < n; i++) {
      var dir = i % 2 ? -1 : 1, ph = R0() * 6.3, wa = 0.35 + R0() * 0.3, wb = 0.5 + R0() * 0.4, x = frac(R0() + dir * t * (0.01 + R0() * 0.008) + Math.sin(t * wa + ph) * 0.05) * (W + m * 2) - m, y = H * (0.06 + 0.86 * R0()) + Math.sin(t * wb + ph * 2) * u * 7 + Math.sin(t * 2.3 + i) * u * 1.2,
        s = u * (2.6 + R0() * 2), vx = dir * 0.012 + Math.cos(t * wa + ph) * wa * 0.05, vy = Math.cos(t * wb + ph * 2) * wb * u * 7 / H, rot = Math.atan2(vx * W / H, -vy) * 0.6 + Math.sin(t * 1.9 + ph) * 0.12, flap = 0.22 + 0.78 * Math.abs(Math.sin(t * (7 + R0() * 2.5) + ph));
      c.save(); c.translate(x, y); c.rotate(rot);
      butterfly(c, s, cols[i % 6], flap);
      c.restore();
    }
  });

  /* ---------- glitter: fine glitter turning in the light: most flecks dim, a few flashing ---------- */
  Art.add('particles', 'glitter', function (c, W, H, t, p, o, u) {
    var n = Math.round(96 * o.amount), i, g, R0, k = Math.exp(-5 * o.beat), lt = lightPal(p), cols = [p.gold, lt ? shade(p.gold, -0.14) : p.snow, mix(p.accent, '#ffffff', 0.45)], FL = [];
    for (g = 0; g < 3; g++) {
      R0 = rnd(o.seed + 'gl' + g); c.fillStyle = alpha(cols[g], 0.62); c.beginPath();
      for (i = g; i < n; i += 3) {
        var ph = R0() * 6.3, x = frac(R0() + Math.sin(t * (0.3 + R0() * 0.4) + ph) * 0.008) * W, y = frac(R0() + t * (0.012 + R0() * 0.022)) * H, s = u * (0.2 + R0() * 0.36), fz = Math.sin(t * (1.3 + R0() * 2.8) + ph), fl = fz > 0 ? Math.pow(fz, 7) : 0, w = s * (0.35 + 0.65 * Math.abs(Math.cos(t * 1.7 + ph)));
        c.moveTo(x, y - s); c.lineTo(x + w, y); c.lineTo(x, y + s); c.lineTo(x - w, y); c.closePath();
        if (fl > 0.2) FL.push(x, y, s, fl, g);
      }
      c.fill();
    }
    for (i = 0; i < FL.length; i += 5) { var r = FL[i + 2] * (2.2 + FL[i + 3] * 3.4) * (1 + k * 0.2); dot(c, FL[i], FL[i + 1], r * 0.7, alpha(p.gold, 0.2 * FL[i + 3])); c.globalAlpha = FL[i + 3]; K.twinkle(c, FL[i], FL[i + 1], r, FL[i + 4] === 2 ? cols[2] : (lt ? p.gold : '#ffffff')); dot(c, FL[i], FL[i + 1], r * 0.18, '#ffffff'); }
    c.globalAlpha = 1;
  });

  /* ---------- snowsoft: a few big soft flakes, in no hurry: slow, sparse, calm ---------- */
  Art.add('particles', 'snowsoft', function (c, W, H, t, p, o, u) {
    var n = Math.round(14 * o.amount), i, R0 = rnd(o.seed + 'ss'), lt = lightPal(p), m = u * 6, G = c.createRadialGradient(0, 0, 0, 0, 0, 1), D = c.createRadialGradient(0, 0, 0.3, 0, 0, 1), dk = shade(p.bg, -0.45);
    G.addColorStop(0, alpha(p.snow, 0.96)); G.addColorStop(0.3, alpha(p.snow, 0.85)); G.addColorStop(0.62, alpha(p.snow, 0.28)); G.addColorStop(1, alpha(p.snow, 0));
    D.addColorStop(0, alpha(dk, 0.2)); D.addColorStop(1, alpha(dk, 0));
    for (i = 0; i < n; i++) {
      var ph = R0() * 6.3, x = frac(R0() + Math.sin(t * (0.14 + R0() * 0.14) + ph) * 0.025 + t * 0.0015) * (W + m * 2) - m, y = frac(R0() + t * (0.011 + R0() * 0.011)) * (H + m * 2) - m, r = u * (1.5 + R0() * 2.6);
      c.save(); c.translate(x, y); c.scale(r, r); if (lt) { c.fillStyle = D; c.fillRect(-1.25, -1.1, 2.5, 2.5); } c.globalAlpha = 0.8 + 0.2 * Math.sin(t * 0.4 + ph); c.fillStyle = G; c.fillRect(-1, -1, 2, 2); c.restore();
    }
    n = Math.round(10 * o.amount); c.fillStyle = alpha(p.snow, lt ? 0.7 : 0.45); c.beginPath();
    for (i = 0; i < n; i++) { var x = frac(R0() + Math.sin(t * (0.2 + R0() * 0.2) + i) * 0.012) * W, y = frac(R0() + t * (0.006 + R0() * 0.006)) * H, r = u * (0.22 + R0() * 0.2); c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
    c.fill();
  });
});
