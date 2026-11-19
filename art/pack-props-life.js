/* Send a Carol art pack: props for life's milestones (weddings, babies, new homes, new jobs, retirement). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var WOOD = '#b98552', GREEN = '#4fa866', SHADOW = 'rgba(0,0,0,0.14)';
  function add(name, fn) { Art.add('prop', name, fn, {}); }
  function pulse(o) { return Math.exp(-5 * o.beat); }
  function shadow(c, w, y) { E(c, 0, y == null ? 42 : y, w, 4, SHADOW); }
  /* a thick outlined stroke along the current path */
  function tube(c, lw, col) { c.lineJoin = 'round'; c.lineWidth = lw + K.ow() * 2; c.strokeStyle = shade(col, -0.34); c.stroke(); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); }
  function band(c, x, y, r, lw, col, a0, a1) { /* a metal ring, or a piece of one */
    c.lineCap = 'butt'; c.beginPath(); c.arc(x, y, r, a0, a1); c.lineWidth = lw + K.ow() * 2; c.strokeStyle = shade(col, -0.34); c.stroke(); c.lineWidth = lw; c.strokeStyle = col; c.stroke();
    c.beginPath(); c.arc(x, y, r + lw * 0.2, a0, a1); c.lineWidth = lw * 0.22; c.strokeStyle = shade(col, 0.5); c.stroke();
    c.beginPath(); c.arc(x, y, r - lw * 0.3, a0, a1); c.lineWidth = lw * 0.18; c.strokeStyle = shade(col, -0.16); c.stroke(); c.lineCap = 'round';
  }
  function star(c, x, y, r, col, rot) { K.starPath(c, x, y, r, r * 0.46, 5, rot || 0); F(c, col); }
  function heart(c, x, y, s, col) { K.heartPath(c, x, y, s); F(c, col); }

  /* ---------- wedding ---------- */
  add('rings', function (c, t, p, o) {
    var g = p.gold, g2 = shade(p.gold, 0.2), k = pulse(o);
    shadow(c, 40);
    c.save(); c.rotate(-0.06 + Math.sin(t * 1.5) * 0.03);
    band(c, -14, 12, 24, 7.5, g, 0, TAU);
    band(c, 15, 6, 21, 6, g2, 0, TAU);
    band(c, -14, 12, 24, 7.5, g, -1.3, -0.5); /* linked: the big ring passes over at the top, under at the bottom */
    R(c, 9, -21, 12, 6, 2, shade(g, -0.1)); /* the setting */
    Pg(c, [[7, -36], [23, -36], [29, -29], [15, -17], [1, -29]], '#bfeaff');
    Pg(c, [[7, -36], [23, -36], [19, -29], [11, -29]], '#e9f9ff', true); Pg(c, [[11, -29], [19, -29], [15, -17]], '#8fd2f2', true);
    c.beginPath(); c.moveTo(1, -29); c.lineTo(29, -29); c.lineWidth = 0.7; c.strokeStyle = '#6fb2d2'; c.stroke();
    c.beginPath(); c.arc(-14, 12, 24, PI * 1.05, PI * 1.35); c.lineWidth = 2.2; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke();
    c.restore();
    K.twinkle(c, 22, -42, 7 + k * 3 + Math.sin(t * 3) * 1.5, '#ffffff'); K.twinkle(c, -38, -16, 4.5 + Math.cos(t * 3.4) * 1.6, p.snow); K.twinkle(c, 40, 22, 3.6 + Math.sin(t * 4 + 1) * 1.4, p.snow);
    heart(c, -14, 12, 9 + k * 1.5, p.accent);
  });

  add('weddingcake', function (c, t, p, o) {
    var i, k = pulse(o), ic = p.paper, sp = shade(p.paper, -0.07), fc = [p.accent, '#ff9ab8', p.gold, shade(p.accent, 0.45)];
    shadow(c, 40, 44); R(c, -16, 39, 32, 5, 2, shade(p.gold, -0.1)); R(c, -4, 33, 8, 7, 1, p.gold); R(c, -40, 29, 80, 5.5, 2.7, shade(p.gold, 0.25));
    var tiers = [[-32, 6, 64, 24], [-23, -15, 46, 22], [-14, -33, 28, 19]];
    for (i = 0; i < 3; i++) {
      var q = tiers[i]; R(c, q[0], q[1], q[2], q[3], 3, sp);
      Rn(c, q[0] + 1, q[1] + q[3] - 6, q[2] - 2, 2.2, 0, p.accent2); /* a ribbon round each tier */
      K.icing(c, q[0] - 1.5, q[0] + q[2] + 1.5, q[1] - 1, 5 + (2 - i) * 2, 5.5, ic);
      for (var j = 0; j < 5 + (2 - i) * 2; j++) dot(c, q[0] + 4 + j * (q[2] - 8) / (4 + (2 - i) * 2), q[1] + q[3] - 9.5, 1.1, p.gold);
    }
    /* a cascade of flowers down one side */
    var fl = [[-12, -33, 5.5], [-19, -17, 6.5], [-13, -11, 4.5], [-27, 4, 7], [-19, 10, 5], [-30, 24, 6], [20, 5, 5.5], [14, -15, 4.2]];
    for (i = 0; i < fl.length; i++) { if (i % 2 === 0) K.leaf(c, fl[i][0], fl[i][1], fl[i][2] * 2, 2.4 + i, mix(GREEN, p.accent2, 0.4)); K.flower(c, fl[i][0], fl[i][1], fl[i][2], fc[i % 4], i % 4 === 2 ? '#fff3c4' : p.gold, t * 0.25 + i); }
    /* the topper: two hearts */
    c.save(); c.translate(0, -37); c.scale(1 + k * 0.1, 1 + k * 0.1); L(c, -4, 2, -4, -4, 1, p.gold); L(c, 4, 2, 4, -4, 1, p.gold); heart(c, -4.5, -9, 10, p.accent); heart(c, 4.5, -8, 10, shade(p.accent, 0.3)); c.restore();
    K.twinkle(c, 24, -34, 4.5 + Math.sin(t * 3) * 1.6, '#ffffff'); K.twinkle(c, -30, -24, 3.2 + Math.cos(t * 3.7) * 1.3, '#ffffff');
  });

  add('floralarch', function (c, t, p, o) {
    var i, R0 = rnd('floralarch'), gr = mix(GREEN, p.accent2, 0.4), fc = [p.accent, '#ff9ab8', p.paper, p.gold, shade(p.accent, 0.4)], k = pulse(o);
    function pt(f) { var d = f * 200.5, a; if (d < 50) return [-32, 44 - d, PI]; if (d < 150.5) { a = PI + (d - 50) / 32; return [Math.cos(a) * 32, -6 + Math.sin(a) * 32, a]; } return [32, -6 + (d - 150.5), 0]; }
    E(c, 0, 44, 46, 4.5, SHADOW);
    c.beginPath(); c.moveTo(-24, 44); c.quadraticCurveTo(0, 36, 24, 44); c.closePath(); c.fillStyle = alpha(p.paper, 0.5); c.fill(); /* a pale path through */
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * 26, -30); c.quadraticCurveTo(i * 20, -6, i * 25 + Math.sin(t * 1.3 + i) * 2, 16); c.lineWidth = 9; c.strokeStyle = alpha(p.snow, 0.55); c.stroke(); } /* soft drapes */
    c.beginPath(); c.moveTo(-32, 44); c.lineTo(-32, -6); c.arc(0, -6, 32, PI, 0); c.lineTo(32, 44); tube(c, 5.5, p.paper);
    for (i = 0; i < 9; i++) { var q = pt(0.06 + i * 0.11); L(c, q[0] - Math.cos(q[2]) * 2.6, q[1] - Math.sin(q[2]) * 2.6, q[0] + Math.cos(q[2]) * 2.6, q[1] + Math.sin(q[2]) * 2.6, 0.7, shade(p.paper, -0.25)); }
    for (i = 0; i < 34; i++) { var f = 0.04 + R0() * 0.92, a = pt(f), sd = R0() < 0.5 ? -1 : 1, ln = 7 + R0() * 6; K.leaf(c, a[0], a[1], ln, a[2] + sd * (0.5 + R0() * 0.9) + Math.sin(t * 1.2 + i) * 0.05, i % 3 ? gr : shade(gr, i % 2 ? -0.18 : 0.2)); }
    var fs = [0.07, 0.19, 0.3, 0.37, 0.44, 0.5, 0.56, 0.63, 0.7, 0.81, 0.93, 0.25, 0.75, 0.47];
    for (i = 0; i < fs.length; i++) { var b = pt(fs[i]), off = (R0() - 0.4) * 5, r = 4.2 + R0() * 3 + (i === 5 ? 2 + k : 0); K.flower(c, b[0] + Math.cos(b[2]) * off, b[1] + Math.sin(b[2]) * off, r, fc[i % 5], i % 5 === 3 ? '#fff3c4' : p.gold, t * 0.2 + i * 1.3); }
    for (i = -1; i <= 1; i += 2) { K.leaf(c, i * 32, 44, 10, -PI / 2 + i * 0.7, gr); K.leaf(c, i * 32, 44, 9, -PI / 2 - i * 0.5, shade(gr, 0.2)); K.flower(c, i * 38, 40, 4, fc[i + 1], p.gold, i); K.flower(c, i * 27, 41, 3.2, fc[i + 2], p.gold, i * 2); }
  });

  function dove(c, x, y, dir, s, t, ph, p) {
    var w = p.snow, sh = shade(p.snow, -0.12);
    c.save(); c.translate(x, y + Math.sin(t * 2.2 + ph) * 1.6); c.scale(dir * s, s);
    Pg(c, [[-12, 0], [-31, -7], [-27, 0], [-30, 6], [-14, 9]], sh);
    c.beginPath(); c.ellipse(0, 2, 18, 11.5, -0.15, 0, TAU); F(c, w);
    c.beginPath(); c.ellipse(1, 6, 13, 6, -0.15, 0, PI); c.fillStyle = sh; c.fill();
    E(c, 15, -8, 8.2, 7.6, w); Pg(c, [[22, -9.5], [29, -7], [22, -4.5]], p.gold);
    dot(c, 17, -9.5, 1.5, '#2b2118'); dot(c, 17.5, -10, 0.5, '#fff'); dot(c, 13, -5, 2.2, 'rgba(240,96,110,0.4)');
    c.save(); c.translate(-1, -3); c.rotate(-0.25 + Math.sin(t * 5 + ph) * 0.3);
    c.beginPath(); c.moveTo(4, 2); c.bezierCurveTo(-2, -20, -22, -30, -30, -24); c.bezierCurveTo(-24, -14, -14, 0, -4, 6); c.closePath(); F(c, w);
    L(c, -22, -22, -9, -4, 0.8, sh); L(c, -15, -22, -4, -4, 0.8, sh); c.restore();
    c.restore();
  }
  add('dovepair', function (c, t, p, o) {
    var k = pulse(o);
    c.beginPath(); c.moveTo(-4, 6); c.bezierCurveTo(-10, 24, -2, 30, -8, 42 + Math.sin(t * 2) * 2); c.moveTo(4, 6); c.bezierCurveTo(10, 22, 2, 32, 9, 40 + Math.cos(t * 2) * 2); c.lineWidth = 2.6; c.strokeStyle = p.accent2; c.stroke(); /* the ribbon they carry */
    dove(c, -24, 6, 1, 0.74, t, 0, p); dove(c, 24, 6, -1, 0.74, t, 1.7, p);
    K.bow(c, 0, 7, 12, p.accent2);
    c.save(); c.translate(0, -26 + Math.sin(t * 2) * 1.5); c.scale(1 + k * 0.14, 1 + k * 0.14); heart(c, 0, 0, 18, p.accent); c.beginPath(); c.arc(-3.4, -2.6, 2.8, PI * 1.05, PI * 1.5); c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke(); c.restore();
    K.twinkle(c, -22, -34, 3.6 + Math.sin(t * 3) * 1.4, p.gold); K.twinkle(c, 24, -38, 4.4 + Math.cos(t * 3.3) * 1.5, p.gold);
  });

  /* ---------- baby ---------- */
  add('stroller', function (c, t, p, o) {
    var i, j, col = p.accent2, hood = shade(p.accent2, 0.25), mt = '#c9cfd8', a = t * 2.4;
    shadow(c, 40, 44);
    c.save(); c.translate(Math.sin(t * 1.6) * 1.6, 0);
    L(c, -22, 34, 16, 14, 2.6, shade(mt, -0.3)); L(c, 20, 34, -16, 14, 2.6, shade(mt, -0.3)); L(c, -22, 34, 16, 14, 1.4, mt); L(c, 20, 34, -16, 14, 1.4, mt);
    c.beginPath(); c.moveTo(27, 0); c.lineTo(42, -27); c.lineTo(36, -31); tube(c, 2, mt); L(c, 42, -27, 35, -32, 4.4, '#3b3340');
    /* the hood, a fan of panels */
    for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-2, -5); c.arc(-2, -5, 31, PI + i * 0.36, PI + (i + 1) * 0.36 + 0.01); c.closePath(); F(c, i % 2 ? hood : shade(hood, 0.3)); }
    for (i = 0; i < 9; i++) dot(c, -2 + Math.cos(PI + i * 0.18) * 31, -5 + Math.sin(PI + i * 0.18) * 31, 1.5, p.paper);
    /* baby asleep under a blanket */
    E(c, 12, -7, 7, 6.4, '#f6cfa8'); c.beginPath(); c.arc(10, -6.5, 1.4, 0.15 * PI, 0.85 * PI); c.moveTo(16.6, -6.1); c.arc(15.2, -6.5, 1.4, 0.15 * PI, 0.85 * PI); c.lineWidth = 0.8; c.strokeStyle = '#2b2118'; c.stroke(); dot(c, 9, -3.6, 1.5, 'rgba(240,96,110,0.45)'); c.beginPath(); c.arc(12, -13, 2.2, PI * 0.9, PI * 2.2); c.lineWidth = 1; c.strokeStyle = '#8a5a34'; c.stroke();
    c.beginPath(); c.moveTo(-31, -5); c.lineTo(29, -5); c.quadraticCurveTo(29, 22, 5, 22); c.lineTo(-9, 22); c.quadraticCurveTo(-31, 22, -31, -5); c.closePath(); F(c, col);
    c.save(); c.clip(); Rn(c, -34, 1, 68, 5, 0, p.paper); for (i = -4; i <= 4; i++) star(c, i * 8, 12 + (i % 2 ? 3 : 0), 2.2, alpha(p.paper, 0.9)); c.restore();
    K.icing(c, -32, 30, -6, 8, 4.5, p.paper);
    for (i = -1; i <= 1; i += 2) { var wx = i < 0 ? -22 : 20; K.wheel(c, wx, 34, 9.5, p.accent); for (j = 0; j < 3; j++) L(c, wx - Math.cos(a + j * 1.047) * 5.4, 34 - Math.sin(a + j * 1.047) * 5.4, wx + Math.cos(a + j * 1.047) * 5.4, 34 + Math.sin(a + j * 1.047) * 5.4, 0.9, '#f3ece0'); }
    c.restore();
    var z = frac(t * 0.4); c.font = 'bold 9px "CT Sans Bold"'; c.textAlign = 'center'; c.fillStyle = alpha(p.snow, 1 - z); c.fillText('z', 24 + z * 6, -18 - z * 14); c.fillStyle = alpha(p.snow, 0.8 * (1 - frac(z + 0.5))); c.fillText('z', 21 + frac(z + 0.5) * 6, -18 - frac(z + 0.5) * 14);
  });

  add('babybottle', function (c, t, p, o) {
    var i, gl = '#eaf6fb', k = pulse(o);
    shadow(c, 24, 44);
    c.save(); c.rotate(0.14 + Math.sin(t * 1.7) * 0.04);
    c.beginPath(); c.moveTo(-6, -27); c.bezierCurveTo(-7, -36, -4, -39, -3.4, -44); c.quadraticCurveTo(0, -49, 3.4, -44); c.bezierCurveTo(4, -39, 7, -36, 6, -27); c.closePath(); F(c, '#f2c79a'); /* the teat */
    dot(c, -1.6, -42, 1.2, 'rgba(255,255,255,0.6)');
    R(c, -19, 2, 38, 40, 9, gl); R(c, -17, -14, 34, 22, 8, gl);
    c.save(); K.rrp(c, -19, 2, 38, 40, 9); c.clip(); var ml = -2 + Math.sin(t * 1.7) * 1.2; Rn(c, -22, ml + 6, 44, 44, 0, '#fffdf4'); c.beginPath(); c.ellipse(0, ml + 6, 22, 2.4, -0.06, 0, TAU); c.fillStyle = '#ffffff'; c.fill(); c.restore();
    K.rrp(c, -19, 2, 38, 40, 9); c.lineWidth = K.ow(); c.strokeStyle = shade(gl, -0.34); c.stroke();
    for (i = 0; i < 5; i++) L(c, 8, 34 - i * 7, i % 2 ? 13 : 15, 34 - i * 7, 1.1, p.accent2);
    heart(c, -5, 22, 12 + k * 1.5, p.accent);
    L(c, -13, -8, -13, 30, 2.4, 'rgba(255,255,255,0.8)');
    R(c, -17, -28, 34, 11, 3.5, p.accent); for (i = -3; i <= 3; i++) L(c, i * 4.4, -26, i * 4.4, -19.5, 0.9, shade(p.accent, -0.22)); Rn(c, -15, -26.5, 30, 1.8, 1, shade(p.accent, 0.35));
    c.restore();
    star(c, 30, -22, 5 + k * 1.5, p.gold, Math.sin(t * 2) * 0.3); star(c, -31, 8, 3.4, p.gold, Math.cos(t * 2.3) * 0.3); K.twinkle(c, 34, 6, 3.4 + Math.sin(t * 3.4) * 1.4, p.snow);
  });

  add('teddy', function (c, t, p, o) {
    var fur = '#c98d54', pale = '#f1d3a8', dk = '#5a3a22', i, k = pulse(o), blink = frac(t * 0.31) < 0.04;
    shadow(c, 34, 43);
    for (i = -1; i <= 1; i += 2) { E(c, i * 18, 33, 12, 10, fur, i * 0.3); E(c, i * 20, 34, 6.4, 6, pale); dot(c, i * 20, 35.4, 2, shade(pale, -0.18)); for (var j = -1; j <= 1; j++) dot(c, i * 20 + j * 3.2, 31 - (j ? 0 : 0.9), 1.1, shade(pale, -0.18)); }
    c.save(); c.translate(-20, 2); c.rotate(0.55 + Math.sin(t * 2) * 0.05); E(c, 0, 9, 7.4, 13, fur); c.restore();
    E(c, 0, 14, 22, 23, fur); E(c, 0, 18, 13.5, 15, pale);
    c.save(); c.translate(20, 2); c.rotate(-2.2 + Math.sin(t * 7) * 0.22 * (0.5 + k)); E(c, 0, 10, 7.4, 13.5, fur); E(c, 0, 19, 4.4, 4, pale); c.restore(); /* a waving paw */
    heart(c, 0, 20, 12 + k * 1.6, p.accent); L(c, -4, 16, -1.4, 18, 0.7, shade(p.accent, 0.5)); /* a stitched heart */
    c.save(); c.translate(0, -19); c.rotate(Math.sin(t * 1.4) * 0.07);
    for (i = -1; i <= 1; i += 2) { E(c, i * 19, -15, 9.4, 9.4, fur); dot(c, i * 19, -14.4, 5, pale); }
    E(c, 0, 0, 25, 22, fur);
    E(c, 0, 8, 11, 8.6, pale); E(c, 0, 4, 4.2, 3, dk); dot(c, -1, 3.2, 1, 'rgba(255,255,255,0.6)');
    c.beginPath(); c.moveTo(0, 7); c.lineTo(0, 9.5); c.moveTo(-4, 10); c.quadraticCurveTo(-2, 12.6, 0, 9.5); c.quadraticCurveTo(2, 12.6, 4, 10); c.lineWidth = 1; c.strokeStyle = dk; c.stroke();
    for (i = -1; i <= 1; i += 2) { if (blink) { c.beginPath(); c.arc(i * 9.5, -3.4, 2.4, 0.15 * PI, 0.85 * PI); c.lineWidth = 1.2; c.strokeStyle = dk; c.stroke(); } else { dot(c, i * 9.5, -3, 2.7, dk); dot(c, i * 9.5 + 0.9, -4, 1, '#fff'); } }
    K.blush(c, 0, 5, 16, 3.6);
    c.restore();
    K.bow(c, 0, -1, 24, p.accent2); dot(c, 0, -1, 1.2, shade(p.accent2, 0.4));
  });

  function block(c, x, y, s, rot, col, shape, p) {
    var h = s / 2, d = s * 0.24;
    c.save(); c.translate(x, y); c.rotate(rot);
    Pg(c, [[-h, -h], [-h + d, -h - d * 0.8], [h + d, -h - d * 0.8], [h, -h]], shade(col, 0.3));
    Pg(c, [[h, -h], [h + d, -h - d * 0.8], [h + d, h - d * 0.8], [h, h]], shade(col, -0.2));
    R(c, -h, -h, s, s, s * 0.1, col); Rn(c, -h + s * 0.13, -h + s * 0.13, s * 0.74, s * 0.74, s * 0.07, p.paper);
    if (shape === 0) star(c, 0, s * 0.03, s * 0.27, col);
    else if (shape === 1) heart(c, 0, s * 0.02, s * 0.44, col);
    else if (shape === 2) { E(c, 0, 0, s * 0.2, s * 0.2, col); dot(c, 0, 0, s * 0.09, p.paper); }
    else Pg(c, [[0, -s * 0.22], [s * 0.24, s * 0.18], [-s * 0.24, s * 0.18]], col);
    dot(c, -h + s * 0.2, -h + s * 0.2, s * 0.035, shade(col, 0.2)); dot(c, h - s * 0.2, h - s * 0.2, s * 0.035, shade(col, 0.2));
    c.restore();
  }
  add('babyblocks', function (c, t, p, o) {
    var k = pulse(o);
    shadow(c, 42, 43);
    block(c, 20, 26, 30, 0.02, p.accent2, 1, p);
    block(c, -19, 25, 32, -0.03, p.accent, 0, p);
    c.save(); c.translate(-2, 9); c.rotate(0.12 + Math.sin(t * 2.2) * 0.035 * (1 + k)); block(c, 2, -15, 29, 0, p.gold, 2, p); c.restore();
    c.save(); c.translate(-2, -22); c.rotate(-0.16 + Math.sin(t * 2.2 + 1) * 0.05 * (1 + k)); block(c, 0, -11, 22, 0, mix('#58b4ff', p.bg, 0.25), 3, p); c.restore();
    K.twinkle(c, 30, -22, 4.4 + Math.sin(t * 3) * 1.6, p.snow); K.twinkle(c, -32, -8, 3.2 + Math.cos(t * 3.6) * 1.3, p.snow);
  });

  function onesie(c, x, y, s, rot, col, motif, p) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(0, 5, 5, 0); c.lineTo(11, 2); c.lineTo(17, 9); c.lineTo(12.5, 13.5); c.lineTo(9, 11); c.lineTo(9, 22); c.quadraticCurveTo(8, 28, 3.4, 28); c.quadraticCurveTo(0, 22.5, -3.4, 28); c.quadraticCurveTo(-8, 28, -9, 22); c.lineTo(-9, 11); c.lineTo(-12.5, 13.5); c.lineTo(-17, 9); c.lineTo(-11, 2); c.closePath(); F(c, col);
    c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(0, 5, 5, 0); c.lineWidth = 1.6; c.strokeStyle = p.paper; c.stroke();
    L(c, -15.6, 10.4, -11.6, 6.4, 1.3, p.paper); L(c, 15.6, 10.4, 11.6, 6.4, 1.3, p.paper);
    dot(c, -2.4, 25.4, 0.8, p.paper); dot(c, 2.4, 25.4, 0.8, p.paper);
    if (motif === 0) heart(c, 0, 13.5, 8, p.paper); else if (motif === 1) star(c, 0, 13.5, 4.6, p.paper); else { Rn(c, -9, 10, 18, 2.2, 0, alpha(p.paper, 0.9)); Rn(c, -9, 15, 18, 2.2, 0, alpha(p.paper, 0.9)); }
    R(c, -7.6, -4, 2.6, 6.5, 0.8, WOOD); R(c, 5, -4, 2.6, 6.5, 0.8, WOOD); /* pegs */
    c.restore();
  }
  add('onesieline', function (c, t, p, o) {
    var i, cols = [p.accent, p.gold, p.accent2], xs = [-28, 0, 28];
    E(c, 0, 43, 46, 3.6, SHADOW);
    for (i = -1; i <= 1; i += 2) { R(c, i * 46 - 1.8, -40, 3.6, 84, 1.5, WOOD); R(c, i * 46 - 5, -36, 10, 3, 1.2, shade(WOOD, -0.15)); K.leaf(c, i * 46, 44, 8, -PI / 2 + i * 0.6, GREEN); K.leaf(c, i * 46, 44, 7, -PI / 2 - i * 0.4, shade(GREEN, 0.2)); }
    c.beginPath(); c.moveTo(-46, -34); c.quadraticCurveTo(0, -20, 46, -34); c.lineWidth = 1.1; c.strokeStyle = shade(p.paper, -0.3); c.stroke();
    /* a laundry basket waiting underneath */
    E(c, 2, 27, 15, 6, p.paper); E(c, -5, 27, 8, 5, shade(p.accent, 0.5)); E(c, 8, 26, 8, 5, shade(p.accent2, 0.5));
    Pg(c, [[-18, 28], [22, 28], [18, 43], [-14, 43]], '#d9b07a'); for (i = -3; i <= 4; i++) L(c, i * 5, 30, i * 4.4 + 0.3, 42, 0.8, shade('#d9b07a', -0.25)); L(c, -16, 35, 20, 35, 0.8, shade('#d9b07a', -0.25)); R(c, -20, 26, 44, 4, 2, shade('#d9b07a', 0.2));
    for (i = 0; i < 3; i++) { var f = (xs[i] + 46) / 92, y = (1 - f) * (1 - f) * -34 + 2 * (1 - f) * f * -20 + f * f * -34; onesie(c, xs[i] * 1.07, y + 2, i === 1 ? 1.22 : 1.1, Math.sin(t * 1.8 + i * 1.3) * 0.09 + (i - 1) * 0.07, cols[i], i, p); }
    K.bfly(c, 30 + Math.sin(t * 0.9) * 4, -44 + Math.cos(t * 1.3) * 2, 5, p.snow, t, 0.4);
  });

  add('cribmobile', function (c, t, p, o) {
    var i, k = pulse(o), wd = '#e8d2b0', xs = [-34, -17, 0, 17, 34], ys = [-2, 16, 30, 14, 0], sw = Math.sin(t * 1.1) * 0.05;
    c.save(); c.translate(0, -48); c.rotate(sw); c.translate(0, 48);
    c.beginPath(); c.arc(0, -45, 3.4, 0, TAU); c.lineWidth = 2.2; c.strokeStyle = shade(wd, -0.3); c.stroke();
    for (i = 0; i < 5; i++) L(c, 0, -41, xs[i], -24 + (i % 2 ? 4.6 : i === 2 ? 6.4 : 0), 0.7, shade(wd, -0.3));
    c.beginPath(); c.ellipse(0, -24, 37, 6.5, 0, PI, TAU); tube(c, 2.6, shade(wd, -0.12)); /* the far half of the hoop */
    for (i = 0; i < 5; i++) {
      var top = -24 + (i % 2 ? 4.6 : i === 2 ? 6.4 : 0), x = xs[i] + Math.sin(t * 1.5 + i * 1.4) * 2.2, y = ys[i], a = Math.sin(t * 1.5 + i * 1.4) * 0.16;
      L(c, xs[i], top, x, y - 6, 0.7, shade(wd, -0.3)); dot(c, (xs[i] + x) / 2, (top + y - 6) / 2, 1.5, [p.accent, p.gold, p.accent2][i % 3]);
      c.save(); c.translate(x, y); c.rotate(a); c.scale(1.25, 1.25);
      if (i === 0) star(c, 0, 0, 8.5, p.gold);
      else if (i === 1) { K.cloud(c, 0.6, 1.2, 21, shade(p.snow, -0.2)); K.cloud(c, 0, 0, 21, p.snow); dot(c, -3, 0.4, 0.8, '#7b8aa0'); dot(c, 3, 0.4, 0.8, '#7b8aa0'); }
      else if (i === 2) { c.rotate(-0.4); K.crescent(c, 0, 0, 10 + k, '#fff3b8'); c.beginPath(); c.arc(-3.4, 1, 1.6, PI * 0.1, PI * 0.9); c.lineWidth = 0.8; c.strokeStyle = '#8a7340'; c.stroke(); dot(c, -5.6, 4, 1.4, 'rgba(240,96,110,0.4)'); }
      else if (i === 3) heart(c, 0, 0, 15, p.accent);
      else star(c, 0, 0, 8.5, p.accent2);
      c.restore();
    }
    c.beginPath(); c.ellipse(0, -24, 37, 6.5, 0, 0, PI); tube(c, 2.6, wd);
    c.restore();
    K.twinkle(c, -24, 34, 3.4 + Math.sin(t * 3) * 1.4, p.snow); K.twinkle(c, 28, 30, 4 + Math.cos(t * 3.4) * 1.5, p.snow);
  });

  add('bundle', function (c, t, p, o) {
    var i, k = pulse(o), bl = mix(p.paper, p.accent2, 0.22), st = mix(p.paper, p.accent2, 0.6), blink = 1;
    shadow(c, 28, 44);
    c.save(); c.translate(0, 40); c.rotate(Math.sin(t * 1.5) * 0.07); c.translate(0, -40);
    E(c, 0, -19, 19, 19, shade(bl, -0.08)); /* the hood of the blanket */
    c.beginPath(); c.moveTo(-20, -14); c.bezierCurveTo(-34, 8, -24, 40, 0, 42); c.bezierCurveTo(24, 40, 34, 8, 20, -14); c.quadraticCurveTo(0, -2, -20, -14); c.closePath(); F(c, bl);
    c.save(); c.clip(); for (i = 0; i < 9; i++) { dot(c, -24 + (i % 3) * 20 + (i > 5 ? 8 : i > 2 ? -6 : 0), 4 + Math.floor(i / 3) * 13, 2, st); star(c, -14 + (i % 3) * 20 + (i > 2 && i < 6 ? -6 : 0), 10 + Math.floor(i / 3) * 13, 1.8, alpha(p.gold, 0.9)); }
    c.beginPath(); c.moveTo(-30, -10); c.quadraticCurveTo(6, 6, 16, 46); c.lineTo(40, 46); c.lineTo(40, -20); c.closePath(); c.fillStyle = alpha(shade(bl, -0.3), 0.16); c.fill(); c.restore();
    c.beginPath(); c.moveTo(-21, -13); c.quadraticCurveTo(4, 2, 13, 40); c.lineWidth = 1.2; c.strokeStyle = shade(bl, -0.3); c.stroke(); /* the fold */
    E(c, 0, -19, 13.5, 13, '#f6cfa8');
    c.beginPath(); c.arc(-5, -18, 2.4, 0.15 * PI, 0.85 * PI); c.moveTo(7.2, -17.3); c.arc(5, -18, 2.4, 0.15 * PI, 0.85 * PI); c.lineWidth = 1.2; c.strokeStyle = '#2b2118'; c.stroke();
    K.blush(c, 0, -14, 8.4, 2.6); c.beginPath(); c.arc(0, -13.5, 2, 0.2 * PI, 0.8 * PI); c.lineWidth = 1; c.strokeStyle = '#8a4a3a'; c.stroke();
    c.beginPath(); c.arc(1, -30, 3, PI * 0.8, PI * 2.3); c.lineWidth = 1.3; c.strokeStyle = '#8a5a34'; c.stroke(); /* one curl */
    c.beginPath(); c.arc(0, -19, 16.5, PI * 0.95, PI * 2.05); tube(c, 4, bl);
    K.bow(c, 0, 8, 26 + k * 2, p.accent); dot(c, 0, 8, 1.3, shade(p.accent, 0.4));
    c.restore();
    heart(c, 30, -30 + Math.sin(t * 2) * 1.5, 9 + k * 2, p.accent); heart(c, -31, -20 + Math.cos(t * 2) * 1.5, 6, shade(p.accent, 0.3)); K.twinkle(c, 34, 4, 3.4 + Math.sin(t * 3.3) * 1.4, p.snow);
  });

  /* ---------- new home ---------- */
  add('housekey', function (c, t, p, o) {
    var g = p.gold, k = pulse(o), sw = Math.sin(t * 2.2) * 0.14;
    c.save(); c.rotate(0.72 + Math.sin(t * 1.4) * 0.03);
    R(c, -12, -4, 58, 8, 3, g); Rn(c, -10, -2.6, 54, 2, 1, shade(g, 0.45));
    R(c, 20, 3, 5.5, 9, 1.2, g); R(c, 28.5, 3, 5.5, 13, 1.2, g); R(c, 37, 3, 5.5, 7, 1.2, g);
    band(c, -24, 0, 13, 8, g, 0, TAU); dot(c, -33, -8, 2, 'rgba(255,255,255,0.8)');
    c.restore();
    /* the ring and a little house fob swinging from it */
    c.save(); c.translate(-20, -18); c.rotate(sw);
    c.beginPath(); c.arc(-3, 7, 8, 0, TAU); c.lineWidth = 2.6; c.strokeStyle = shade('#c9cfd8', -0.34); c.stroke(); c.lineWidth = 1.4; c.strokeStyle = '#e3e8ee'; c.stroke();
    c.translate(-7, 15);
    Pg(c, [[-12, 12], [12, 12], [12, 34], [-12, 34]], p.paper); Pg(c, [[-16, 13], [0, -2], [16, 13]], p.accent);
    R(c, -3.6, 21, 7.2, 13, 1.5, p.accent2); dot(c, 1.6, 28, 0.9, p.gold); R(c, 5, 17, 5, 5, 1, '#bfe4f7'); R(c, -10, 17, 5, 5, 1, '#bfe4f7');
    R(c, 6, 0, 4, 8, 0.8, shade(p.accent, -0.15)); dot(c, 0, 5, 1.8, '#3b3340'); heart(c, 0, 12.6, 4.4, p.paper);
    c.restore();
    K.twinkle(c, 34, -22, 6 + k * 3 + Math.sin(t * 3) * 1.5, '#ffffff'); K.twinkle(c, 6, -36, 3.6 + Math.cos(t * 3.5) * 1.4, p.snow); K.twinkle(c, 40, 40, 3 + Math.sin(t * 4) * 1.2, p.snow);
  });

  add('movingbox', function (c, t, p, o) {
    var i, cb = '#d6a86e', k = pulse(o), gr = mix(GREEN, p.accent2, 0.35);
    shadow(c, 42, 43);
    /* what is peeking out */
    c.save(); c.translate(-14, -8); c.rotate(-0.12 + Math.sin(t * 1.6) * 0.04); L(c, 0, 4, 0, -16, 1.6, shade(gr, -0.2)); bigleaf(c, 0, -14, 20, -PI / 2 - 0.5, gr); bigleaf(c, 0, -12, 18, -PI / 2 + 0.55, shade(gr, 0.18)); bigleaf(c, 0, -18, 16, -PI / 2, shade(gr, -0.12)); c.restore();
    c.save(); c.translate(15, -10); c.rotate(0.14); L(c, 0, 8, 0, -12, 2.2, shade(p.gold, -0.2)); Pg(c, [[-11, -12], [11, -12], [6, -30], [-6, -30]], p.accent); Rn(c, -9.6, -16, 19.2, 2, 0, p.paper); dot(c, 0, -10, 6 + k * 3, alpha('#ffe9a0', 0.4)); c.restore(); /* a lamp */
    R(c, -8, -24, 16, 20, 1.5, p.paper); R(c, -5.6, -21.6, 11.2, 12, 1, shade(p.accent2, 0.45)); heart(c, 0, -15.4, 6, p.accent); /* a framed picture */
    /* the box */
    Pg(c, [[-32, -4], [-47, -15], [-20, -19], [-5, -6]], shade(cb, 0.12)); Pg(c, [[32, -4], [47, -13], [22, -18], [5, -6]], shade(cb, 0.12));
    R(c, -32, -4, 64, 46, 2.5, cb); Rn(c, -31.4, -3.4, 62.8, 5, 1, shade(cb, -0.12));
    for (i = 0; i < 7; i++) L(c, -28 + i * 9.4, 39, -25 + i * 9.4, 39, 0.8, shade(cb, -0.16));
    Rn(c, -6, -3.4, 12, 16, 0, alpha(p.paper, 0.75)); Pg(c, [[-6, 12.4], [-3, 10.6], [0, 12.4], [3, 10.6], [6, 12.4], [6, 9], [-6, 9]], alpha(p.paper, 0.75), true);
    /* this way up, and a heart */
    for (i = 0; i < 2; i++) { var ax = -22 + i * 9; Pg(c, [[ax, 20], [ax + 4, 26], [ax + 1.4, 26], [ax + 1.4, 34], [ax - 1.4, 34], [ax - 1.4, 26], [ax - 4, 26]], shade(cb, -0.38), true); }
    L(c, -27, 36.4, -8, 36.4, 1.4, shade(cb, -0.38));
    heart(c, 19, 26, 14 + k * 1.6, p.accent);
    L(c, -30, 0, -30, 38, 1.6, alpha('#ffffff', 0.25));
    K.twinkle(c, 36, -30, 4.4 + Math.sin(t * 3) * 1.6, p.snow); K.twinkle(c, -38, -30, 3 + Math.cos(t * 3.6) * 1.2, p.snow);
  });
  function bigleaf(c, x, y, len, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(len * 0.2, -len * 0.5, len * 0.8, -len * 0.42, len, 0); c.bezierCurveTo(len * 0.8, len * 0.42, len * 0.2, len * 0.5, 0, 0); c.closePath(); F(c, col);
    c.beginPath(); c.moveTo(len * 0.06, 0); c.lineTo(len * 0.9, 0); for (var i = 1; i <= 3; i++) { c.moveTo(len * i * 0.22, 0); c.lineTo(len * (i * 0.22 + 0.14), -len * 0.2); c.moveTo(len * i * 0.22, 0); c.lineTo(len * (i * 0.22 + 0.14), len * 0.2); }
    c.lineWidth = Math.max(0.5, len * 0.03); c.strokeStyle = shade(col, 0.32); c.stroke(); c.restore();
  }

  add('movingvan', function (c, t, p, o) {
    var i, j, a = t * 5, bob = Math.abs(Math.sin(t * 6)) * 0.8, cab = p.accent, bx = p.paper;
    shadow(c, 46, 40);
    for (i = 0; i < 3; i++) { var f = frac(t * 1.4 + i / 3); L(c, -50 - f * 6, -12 + i * 12, -50 - f * 6 + 7, -12 + i * 12, 1.4, alpha(p.snow, 0.7 * (1 - f))); }
    c.save(); c.translate(0, -bob);
    R(c, -46, 24, 90, 5, 2, '#4a4654');
    R(c, -44, -30, 58, 55, 4, bx); /* the box of the van */
    Rn(c, -43.4, 8, 56.8, 6, 0, p.accent2); Rn(c, -43.4, 15.5, 56.8, 2, 0, p.gold);
    for (i = 0; i < 3; i++) L(c, -44 + 14.5 * (i + 1), -29, -44 + 14.5 * (i + 1), 6, 0.6, shade(bx, -0.14));
    /* its sign: a house and a heart, no words */
    Pg(c, [[-25, -8], [-7, -8], [-7, 3], [-25, 3]], shade(p.accent2, 0.3)); Pg(c, [[-28, -7], [-16, -18], [-4, -7]], p.accent); R(c, -18.4, -3.4, 4.8, 6.6, 1, p.paper); heart(c, -16, -10.4, 4.4, p.paper);
    c.beginPath(); c.moveTo(14, -12); c.lineTo(30, -12); c.quadraticCurveTo(35, -12, 37, -7); c.lineTo(42, 5); c.quadraticCurveTo(46, 6, 46, 11); c.lineTo(46, 25); c.lineTo(14, 25); c.closePath(); F(c, cab);
    c.beginPath(); c.moveTo(20, -7); c.lineTo(30, -7); c.quadraticCurveTo(33, -7, 34, -4); c.lineTo(37.6, 5); c.lineTo(20, 5); c.closePath(); F(c, '#bfe4f7'); L(c, 23, -4, 26, 3, 1.6, 'rgba(255,255,255,0.7)');
    E(c, 28, 2, 3.6, 4, '#f6cfa8'); Rn(c, 24.4, 3.4, 7.2, 1.8, 0, '#bfe4f7'); /* someone driving */
    L(c, 21, 10, 26, 10, 1.4, shade(cab, -0.3)); R(c, 42, 12, 5, 5, 1.5, '#ffe9a0'); dot(c, 47, 14.5, 5, alpha('#ffe9a0', 0.35)); R(c, 40, 21, 8, 4.5, 1.5, '#c9cfd8');
    Rn(c, 14.6, 17, 30.8, 2, 0, shade(cab, 0.3));
    c.restore();
    for (i = 0; i < 2; i++) { var wx = i ? 28 : -26; K.wheel(c, wx, 29, 9.5, p.gold); for (j = 0; j < 2; j++) L(c, wx - Math.cos(a + j * 1.57) * 5.2, 29 - Math.sin(a + j * 1.57) * 5.2, wx + Math.cos(a + j * 1.57) * 5.2, 29 + Math.sin(a + j * 1.57) * 5.2, 1, '#f3ece0'); }
  });

  add('yardsign', function (c, t, p, o) {
    var i, sw = Math.sin(t * 1.7) * 0.06, k = pulse(o), gr = mix(GREEN, p.accent2, 0.35), wh = p.paper;
    E(c, 0, 42, 44, 6.5, gr); for (i = -5; i <= 5; i++) { L(c, i * 7.6, 39, i * 7.6 - 1.6, 34 - (i % 2 ? 2 : 0), 1.2, shade(gr, i % 2 ? 0.2 : -0.12)); }
    R(c, -33, -44, 6.5, 86, 2, wh); Rn(c, -31.6, -42, 1.6, 82, 0.8, shade(wh, -0.08));
    R(c, -40, -37, 78, 5.5, 2, wh); R(c, -35, -47, 10.5, 4, 1.5, shade(wh, -0.1)); L(c, -27, -22, -14, -32, 2, shade(wh, -0.2));
    c.save(); c.translate(8, -32); c.rotate(sw);
    for (i = -1; i <= 1; i += 2) { L(c, i * 19, 0, i * 19, 7, 1, '#8a909c'); dot(c, i * 19, 0.6, 1.4, '#8a909c'); }
    R(c, -27, 7, 54, 38, 3, p.accent); R(c, -23.5, 10.5, 47, 31, 2, wh); /* blank: the card's words go here */
    K.rrp(c, -21, 13, 42, 26, 1.5); c.lineWidth = 0.8; c.strokeStyle = alpha(p.accent, 0.5); c.stroke();
    for (i = -1; i <= 1; i += 2) { L(c, i * 15, 45, i * 15, 49, 1, '#8a909c'); }
    R(c, -21, 49, 42, 10, 2, p.accent2); Rn(c, -18.6, 51.2, 37.2, 5.6, 1, alpha(p.paper, 0.22)); /* the rider, blank too */
    star(c, 24, 10, 6 + k * 1.4, p.gold, sw * 3);
    c.restore();
    K.flower(c, -22, 37, 4.4, p.accent, p.gold, t * 0.3); K.flower(c, -40, 39, 3.4, p.gold, '#fff3c4', 1); K.flower(c, 30, 38, 4, p.paper, p.gold, 2); K.flower(c, 14, 41, 3, shade(p.accent, 0.4), p.gold, 3);
  });

  add('houseplant', function (c, t, p, o) {
    var i, gr = mix('#3f9a5c', p.accent2, 0.3), pot = p.accent, k = pulse(o);
    var lv = [[-0.95, 30, -0.1], [0.95, 30, 0.12], [-0.5, 34, 0.18], [0.5, 35, -0.16], [-1.35, 22, -0.12], [1.35, 23, 0.2], [0, 36, 0.05]];
    shadow(c, 30, 44); R(c, -19, 40, 38, 4.5, 2, shade(pot, -0.12));
    for (i = 0; i < lv.length; i++) { var a = lv[i][0] + Math.sin(t * 1.3 + i * 1.1) * 0.045, ln = lv[i][1], ex = Math.sin(a) * 15, ey = 6 - Math.cos(a) * 15; c.beginPath(); c.moveTo(0, 12); c.quadraticCurveTo(ex * 0.3, ey + 2, ex, ey); c.lineWidth = 1.8; c.strokeStyle = shade(gr, -0.25); c.stroke(); bigleaf(c, ex, ey, ln, a - PI / 2, shade(gr, lv[i][2])); }
    c.save(); c.translate(5, -6); c.rotate(0.3 + Math.sin(t * 1.3) * 0.05); c.beginPath(); c.moveTo(0, 12); c.quadraticCurveTo(-2, 0, 0, -8); c.quadraticCurveTo(4.4, 0, 0, 12); F(c, shade(gr, 0.42)); c.restore(); /* a new leaf, still rolled */
    Pg(c, [[-19, 12], [19, 12], [14, 40], [-14, 40]], pot);
    c.save(); c.beginPath(); c.moveTo(-19, 12); c.lineTo(19, 12); c.lineTo(14, 40); c.lineTo(-14, 40); c.closePath(); c.clip(); Rn(c, -20, 24, 40, 4, 0, p.paper); Rn(c, -20, 30.5, 40, 1.6, 0, p.gold); Rn(c, -20, 12, 7, 30, 0, alpha('#ffffff', 0.18)); c.restore();
    R(c, -22, 7, 44, 8, 3, shade(pot, 0.14)); Rn(c, -19, 8.6, 20, 1.6, 0.8, alpha('#ffffff', 0.4));
    K.twinkle(c, 34, -30, 3.6 + k * 2 + Math.sin(t * 3) * 1.3, p.snow); K.twinkle(c, -38, -12, 3 + Math.cos(t * 3.5) * 1.2, p.snow);
  });

  add('toolbox', function (c, t, p, o) {
    var i, st = '#c9cfd8', k = pulse(o), bx = p.accent;
    shadow(c, 44, 43);
    /* tools standing in the open tray */
    c.save(); c.translate(-20, 2); c.rotate(-0.16 + Math.sin(t * 2) * 0.03); R(c, -3, -30, 6, 34, 2, WOOD); R(c, -13, -42, 24, 12, 2.5, '#8a909c'); Pg(c, [[11, -41], [19, -44], [19, -39], [11, -32]], '#8a909c'); Rn(c, -11, -40, 20, 2, 1, 'rgba(255,255,255,0.45)'); c.restore();
    c.save(); c.translate(3, 0); c.rotate(0.1 + Math.sin(t * 2 + 1) * 0.03); R(c, -3.4, -30, 6.8, 34, 2, st); c.beginPath(); c.arc(0, -36, 9, PI * 1.78, PI * 1.22); c.lineTo(-3.4, -34); c.lineTo(-3.4, -41.5); c.lineTo(3.4, -41.5); c.lineTo(3.4, -34); c.closePath(); F(c, st); Rn(c, -1.6, -26, 1.4, 22, 0.7, 'rgba(255,255,255,0.6)'); c.restore();
    c.save(); c.translate(23, 0); c.rotate(0.24 + Math.sin(t * 2 + 2) * 0.03); R(c, -1.5, -24, 3, 22, 1, st); Pg(c, [[-2.6, -24], [2.6, -24], [1.6, -29], [-1.6, -29]], st); R(c, -5.5, -14, 11, 20, 4, p.accent2); for (i = 0; i < 3; i++) L(c, -3 + i * 3, -11, -3 + i * 3, 2, 0.9, shade(p.accent2, -0.22)); c.restore();
    c.beginPath(); c.moveTo(-17, -3); c.lineTo(-17, -15); c.quadraticCurveTo(-17, -20, -12, -20); c.lineTo(12, -20); c.quadraticCurveTo(17, -20, 17, -15); c.lineTo(17, -3); tube(c, 4.4, '#3b3340'); R(c, -9, -23.4, 18, 6.6, 3, p.gold); /* the handle */
    R(c, -40, 6, 80, 34, 5, bx); R(c, -42, -4, 84, 14, 4, shade(bx, 0.16));
    Rn(c, -39, -2, 78, 2.4, 1.2, 'rgba(255,255,255,0.4)'); Rn(c, -38.6, 30, 77.2, 3, 0, shade(bx, -0.14));
    for (i = -1; i <= 1; i += 2) { R(c, i * 27 - 5, 3, 10, 12, 2, st); R(c, i * 27 - 3, 9, 6, 4, 1, '#8a909c'); dot(c, i * 36, 35, 1.2, shade(bx, -0.3)); }
    R(c, -12, 16, 24, 14, 2, shade(bx, -0.1)); heart(c, 0, 23, 9 + k * 1.4, p.paper);
    /* a bolt and a nut beside it */
    E(c, 37, 41, 4.6, 3, st); dot(c, 37, 41, 1.6, '#6a707c'); L(c, -40, 42, -31, 42, 2.4, st); dot(c, -41, 42, 2.4, '#8a909c');
    K.twinkle(c, 36, -22, 4.4 + Math.sin(t * 3) * 1.6, '#ffffff'); K.twinkle(c, -38, -22, 3 + Math.cos(t * 3.6) * 1.2, p.snow);
  });

  add('frontdoor', function (c, t, p, o) {
    var i, k = pulse(o), dr = p.accent, wh = p.paper, gr = mix(GREEN, p.accent2, 0.35), R0 = rnd('frontdoor');
    R(c, -38, 39, 76, 6, 2, '#b9b2a6'); R(c, -32, 34, 64, 6, 2, '#d3ccc0');
    R(c, -26, -46, 52, 81, 3, wh); R(c, -29, -49, 58, 6, 2, shade(wh, -0.06));
    R(c, -20, -26, 40, 61, 1.5, dr);
    /* a fanlight over the door */
    R(c, -20, -41, 40, 12, 2, '#bfe4f7'); for (i = -1; i <= 1; i++) L(c, i * 10, -40.4, i * 10, -29.6, 1, wh); L(c, -17, -32, -12, -39, 1.4, 'rgba(255,255,255,0.7)');
    for (i = 0; i < 4; i++) { var px = i % 2 ? 2.5 : -16.5, py = i < 2 ? 4 : 19; R(c, px, py, 14, i < 2 ? 12 : 12.5, 1.2, shade(dr, -0.12)); Rn(c, px + 1.4, py + 1.4, 11.2, 1.4, 0.7, shade(dr, 0.18)); }
    Rn(c, -19.4, -25.4, 3, 59.8, 0, alpha('#ffffff', 0.14));
    E(c, 15, 4, 2.4, 2.4, p.gold); dot(c, 14.4, 3.4, 0.8, '#fff'); R(c, -6, 0.4, 12, 2.6, 1, p.gold);
    /* a wreath of leaves (no holly), a few small flowers, a bow */
    c.beginPath(); c.arc(0, -11, 10, 0, TAU); c.lineWidth = 7.5; c.strokeStyle = shade(gr, -0.4); c.stroke(); c.lineWidth = 5.4; c.strokeStyle = shade(gr, -0.12); c.stroke();
    for (i = 0; i < 18; i++) { var a = i / 18 * TAU + Math.sin(t * 1.2) * 0.02; K.leaf(c, Math.cos(a) * 9, -11 + Math.sin(a) * 9, 8.5, a + 1.0 + (i % 2 ? 0.7 : 0), i % 2 ? shade(gr, 0.3) : gr); }
    for (i = 0; i < 4; i++) { var b = -0.5 + i * 1.3 + (i > 1 ? 1.0 : 0); dot(c, Math.cos(b) * 10.5, -11 + Math.sin(b) * 10.5, 2.2, p.paper); dot(c, Math.cos(b) * 10.5, -11 + Math.sin(b) * 10.5, 0.9, p.gold); }
    K.bow(c, 0, -1, 12, p.gold);
    /* a porch lamp, lit */
    dot(c, 33, -22, 8 + k * 3, alpha('#ffe9a0', 0.3 + 0.2 * k)); R(c, 30, -27, 6, 9, 1.5, '#ffe9a0'); Pg(c, [[28, -27], [38, -27], [33, -32]], '#3b3340'); Rn(c, 29, -18.6, 8, 1.6, 0.6, '#3b3340');
    /* potted trees on the step, a mat */
    for (i = -1; i <= 1; i += 2) { var x = i * 35; Pg(c, [[x - 6, 24], [x + 6, 24], [x + 4.6, 34], [x - 4.6, 34]], shade(p.accent2, -0.1)); L(c, x, 24, x, 14, 1.6, WOOD); c.save(); c.translate(x, 8); c.rotate(Math.sin(t * 1.4 + i) * 0.04); E(c, 0, 0, 8.5, 9.5, gr); dot(c, -2.4, -3, 4, shade(gr, 0.18)); for (var j = 0; j < 4; j++) dot(c, (R0() - 0.5) * 11, (R0() - 0.5) * 12, 1.3, j % 2 ? p.gold : p.paper); c.restore(); }
    R(c, -15, 35.4, 30, 4.4, 1.5, mix('#c9a56c', p.gold, 0.3)); for (i = -3; i <= 3; i++) L(c, i * 4, 36.4, i * 4, 38.8, 0.7, shade('#c9a56c', -0.25));
  });

  /* ---------- new job ---------- */
  add('briefcase', function (c, t, p, o) {
    var i, lt = mix('#9a6238', p.accent, 0.12), dk = shade(lt, -0.2), g = p.gold, k = pulse(o), sw = Math.sin(t * 2.1) * 0.16;
    shadow(c, 44, 43);
    c.save(); c.rotate(-0.03 + Math.sin(t * 1.5) * 0.015);
    /* papers and a pencil that would not stay in */
    c.save(); c.translate(-14, -16); c.rotate(-0.12); R(c, -12, -14, 24, 20, 1.2, p.paper); for (i = 0; i < 3; i++) L(c, -8, -9 + i * 4, 8 - i * 3, -9 + i * 4, 0.8, shade(p.paper, -0.25)); c.restore();
    c.save(); c.translate(18, -14); c.rotate(0.3); R(c, -2, -20, 4, 24, 1, p.gold); Pg(c, [[-2, -20], [2, -20], [0, -26]], '#f2d9b0'); Pg(c, [[-0.8, -23.6], [0.8, -23.6], [0, -26]], '#3b3340', true); c.restore();
    c.beginPath(); c.moveTo(-15, -12); c.lineTo(-15, -22); c.quadraticCurveTo(-15, -28, -9, -28); c.lineTo(9, -28); c.quadraticCurveTo(15, -28, 15, -22); c.lineTo(15, -12); tube(c, 4.6, dk);
    R(c, -42, -12, 84, 52, 7, lt);
    c.beginPath(); c.moveTo(-42, -5); c.lineTo(-42, 4); c.quadraticCurveTo(0, 16, 42, 4); c.lineTo(42, -5); c.quadraticCurveTo(42, -12, 35, -12); c.lineTo(-35, -12); c.quadraticCurveTo(-42, -12, -42, -5); c.closePath(); F(c, shade(lt, 0.12));
    c.setLineDash([2.4, 2.6]); K.rrp(c, -38.5, -8.5, 77, 45, 4.5); c.lineWidth = 0.8; c.strokeStyle = shade(lt, 0.4); c.stroke(); c.setLineDash([]);
    Rn(c, -36, -9.4, 50, 2, 1, 'rgba(255,255,255,0.3)');
    for (i = -1; i <= 1; i += 2) { R(c, i * 24 - 5, 3, 10, 11, 2, g); Rn(c, i * 24 - 3, 5, 6, 2, 1, shade(g, 0.5)); dot(c, i * 24, 10.4, 1.3, shade(g, -0.35)); Pg(c, [[i * 42, 40], [i * 30, 40], [i * 42, 28]], dk); }
    R(c, -5, 5, 10, 8, 2, shade(g, -0.1)); dot(c, 0, 9, 1.4, '#3b3340');
    c.restore();
    /* a tag with a heart on the handle */
    c.save(); c.translate(15, -18); c.rotate(-0.2 + sw); L(c, 0, 0, 3, 8, 0.9, '#7a6a5a'); Pg(c, [[-4, 8], [10, 8], [10, 24], [3, 28], [-4, 24]], p.accent); dot(c, 3, 11, 1.2, p.paper); heart(c, 3, 18.6, 7 + k, p.paper); c.restore();
    K.twinkle(c, 36, -30, 4.6 + k * 2 + Math.sin(t * 3) * 1.5, p.snow); K.twinkle(c, -38, -26, 3.2 + Math.cos(t * 3.6) * 1.3, p.snow);
  });

  add('rocket', function (c, t, p, o) {
    var i, k = pulse(o), by = p.paper;
    for (i = 0; i < 6; i++) { var f = frac(t * 0.9 + i / 6), sx = -22 - f * 26 + Math.sin(i * 2.4) * 6 * f, sy = 26 + f * 20 + Math.cos(i * 1.9) * 5 * f; dot(c, sx, sy, 4 + f * 8, alpha(p.snow, 0.65 * (1 - f))); } /* a trail of puffs */
    c.save(); c.translate(Math.sin(t * 2.3) * 1.2, Math.cos(t * 2.9) * 1.4); c.rotate(0.62);
    c.save(); c.translate(0, 27); c.rotate(PI); K.flame(c, 0, 0, 15, 26 + k * 6, t, 0.4); c.restore();
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * 11, 8); c.quadraticCurveTo(i * 27, 16, i * 25, 34); c.lineTo(i * 11, 25); c.closePath(); F(c, p.accent); }
    c.beginPath(); c.moveTo(0, -46); c.bezierCurveTo(17, -30, 17, 8, 12, 28); c.lineTo(-12, 28); c.bezierCurveTo(-17, 8, -17, -30, 0, -46); c.closePath(); F(c, by);
    c.save(); c.clip(); Rn(c, -20, -50, 40, 23, 0, p.accent); Rn(c, -20, 17, 40, 4, 0, p.gold); Rn(c, -20, 22.4, 40, 8, 0, shade(p.accent2, -0.05)); c.fillStyle = alpha('#223', 0.1); c.fillRect(4, -50, 20, 90); c.restore();
    c.beginPath(); c.moveTo(0, -46); c.bezierCurveTo(17, -30, 17, 8, 12, 28); c.lineTo(-12, 28); c.bezierCurveTo(-17, 8, -17, -30, 0, -46); c.closePath(); c.lineWidth = K.ow(); c.strokeStyle = shade(by, -0.34); c.stroke();
    E(c, 0, -8, 9.4, 9.4, p.gold); E(c, 0, -8, 6.4, 6.4, '#8fd2f2'); c.beginPath(); c.arc(0, -8, 4.2, PI * 1.05, PI * 1.5); c.lineWidth = 1.3; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke();
    star(c, 0, 8.6, 4, p.accent2);
    Pg(c, [[-3, 16], [3, 16], [2.4, 35], [-2.4, 35]], shade(p.accent, -0.12));
    L(c, -9, -30, -11.4, -6, 1.8, 'rgba(255,255,255,0.7)');
    c.restore();
    star(c, -34, -30, 5 + Math.sin(t * 3) * 1, p.gold, t * 0.4); star(c, 38, 26, 3.6, p.gold, -t * 0.5); K.twinkle(c, -18, -42, 3.4 + Math.cos(t * 3.4) * 1.3, p.snow); K.twinkle(c, 42, -6, 4.2 + Math.sin(t * 3.8) * 1.5, p.snow);
  });

  add('podiumstairs', function (c, t, p, o) {
    var i, k = pulse(o), n = 4, w = 21, cols = [shade(p.accent2, 0.28), shade(p.accent2, 0.12), p.accent2, shade(p.accent2, -0.14)];
    shadow(c, 46, 43);
    for (i = n - 1; i >= 0; i--) {
      var x = -42 + i * w, y = 26 - i * 15;
      R(c, x, y, w + (i === n - 1 ? 0 : 1), 42 - y, 1.5, cols[i]);
      R(c, x - 1.5, y - 3.4, w + 3, 5, 2, p.paper);
      star(c, x + w / 2, y + 9.5, 3.4, alpha(p.paper, 0.85));
      Rn(c, x + 1, y + 2, 2.4, 40 - y, 0, alpha('#ffffff', 0.16));
    }
    /* the flag at the top */
    var fx = 31.5, fy = -22, wv = Math.sin(t * 4) * 2.2;
    R(c, fx - 1.2, fy - 26, 2.4, 26, 1, '#c9cfd8'); dot(c, fx, fy - 27, 2.4, p.gold);
    c.beginPath(); c.moveTo(fx + 1.2, fy - 24); c.bezierCurveTo(fx - 8, fy - 27 + wv, fx - 14, fy - 20 - wv, fx - 24, fy - 23 + wv * 0.6); c.lineTo(fx - 20, fy - 16.5 + wv * 0.5); c.lineTo(fx - 24, fy - 10 + wv * 0.6); c.bezierCurveTo(fx - 14, fy - 7 - wv, fx - 8, fy - 14 + wv, fx + 1.2, fy - 11); c.closePath(); F(c, p.accent);
    star(c, fx - 9, fy - 17.2 + wv * 0.1, 3.6, p.paper);
    /* a little gold ball hopping up, one step a beat */
    var st = (o.n % 4 + 4) % 4, f = clamp(o.beat * 1.6, 0, 1), from = st === 0 ? -1 : st - 1, bx = -42 + (from + f) * w + w / 2, base = 26 - (from + f) * 15 - 3.4, hop = Math.sin(f * PI) * 13;
    if (st === 0) { bx = -42 + w / 2; base = 26 - 3.4; hop = Math.sin(f * PI) * 6; }
    E(c, bx, base - 4.4 - hop, 4.4, 4.4, p.gold); dot(c, bx - 1.3, base - 5.8 - hop, 1.3, 'rgba(255,255,255,0.8)');
    c.setLineDash([1.6, 3]); c.beginPath(); c.moveTo(-40, 12); c.quadraticCurveTo(-18, -22, 10, -30); c.lineWidth = 1.1; c.strokeStyle = alpha(p.snow, 0.7); c.stroke(); c.setLineDash([]);
    Pg(c, [[14, -31], [8.4, -33.6], [9.6, -27.4]], alpha(p.snow, 0.85), true);
    K.twinkle(c, 42, -44, 4.2 + k * 2 + Math.sin(t * 3) * 1.4, p.snow); K.twinkle(c, -34, -20, 3 + Math.cos(t * 3.5) * 1.2, p.snow);
  });

  add('nameplate', function (c, t, p, o) {
    var i, wd = mix('#8a5a34', p.ink, 0.15), g = p.gold, k = pulse(o), gr = mix(GREEN, p.accent2, 0.35);
    E(c, 0, 37, 48, 4.5, SHADOW);
    /* a cup of pens behind, a small succulent beside */
    for (i = 0; i < 3; i++) { c.save(); c.translate(-26 + i * 5, -10); c.rotate(-0.3 + i * 0.3 + Math.sin(t * 1.5 + i) * 0.02); R(c, -1.7, -26, 3.4, 26, 1, [p.accent, p.gold, p.accent2][i]); Pg(c, [[-1.7, -26], [1.7, -26], [0, -31]], i === 1 ? '#f2d9b0' : '#3b3340'); c.restore(); }
    Pg(c, [[-34, -14], [-12, -14], [-14, 10], [-32, 10]], shade(p.accent2, 0.3)); Rn(c, -33, -9, 20, 2.4, 0, p.paper); R(c, -35, -17, 24, 5, 2, shade(p.accent2, 0.45));
    for (i = -2; i <= 2; i++) bigleaf(c, 27, -2, 13 - Math.abs(i) * 1.4, -PI / 2 + i * 0.55 + Math.sin(t * 1.3 + i) * 0.03, shade(gr, i % 2 ? 0.2 : -0.05));
    Pg(c, [[18, -3], [36, -3], [33.6, 10], [20.4, 10]], p.accent); R(c, 16.6, -5.4, 20.8, 4.4, 2, shade(p.accent, 0.16));
    /* the plate: a wooden wedge with a blank gold face */
    Pg(c, [[-40, 6], [40, 6], [46, 36], [-46, 36]], wd); Rn(c, -44.6, 31, 89.2, 4, 0, shade(wd, -0.2)); Pg(c, [[-40, 6], [40, 6], [41, 10.4], [-41, 10.4]], shade(wd, 0.2), true);
    R(c, -37, 12, 74, 17, 2, g); Rn(c, -34.6, 14, 69.2, 13, 1.2, shade(g, 0.42));
    c.save(); K.rrp(c, -34.6, 14, 69.2, 13, 1.2); c.clip(); var sx = -60 + frac(t * 0.22) * 150; c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(sx, 30); c.lineTo(sx + 8, 10); c.lineTo(sx + 16, 10); c.lineTo(sx + 8, 30); c.closePath(); c.fill(); c.restore();
    dot(c, -35.4, 20.5, 0.9, shade(g, -0.35)); dot(c, 35.4, 20.5, 0.9, shade(g, -0.35));
    star(c, 39, 4, 5 + k * 1.6, p.gold, Math.sin(t * 2) * 0.25); K.twinkle(c, -42, -30, 3.4 + Math.sin(t * 3.2) * 1.3, p.snow); K.twinkle(c, 6, -24, 4 + Math.cos(t * 3) * 1.5, p.snow);
  });

  /* ---------- retirement ---------- */
  add('hammock', function (c, t, p, o) {
    var i, s, gr = mix(GREEN, p.accent2, 0.35), sw = Math.sin(t * 1.4) * 2.4, k = pulse(o);
    E(c, 0, 43, 46, 4, SHADOW); E(c, 0, 41, 40, 4.4, mix('#e8c98a', p.bg2, 0.3));
    for (s = -1; s <= 1; s += 2) { /* two leaning palms */
      c.beginPath(); c.moveTo(s * 42, 42); c.quadraticCurveTo(s * 44, 4, s * 34, -30); tube(c, 5, WOOD);
      for (i = 0; i < 5; i++) { var f = (i + 0.6) / 5.6, tx = s * (42 + (2 * (1 - f) * f * 2) - f * f * 8), ty = 42 - f * 72; L(c, tx - 2.4, ty + 2 * f, tx + 2.4, ty - 1 + 2 * f, 0.8, shade(WOOD, -0.28)); }
      for (i = 0; i < 5; i++) bigleaf(c, s * 34, -31, 21 - (i % 2) * 3, (s > 0 ? 0 : PI) + s * (-1.5 + i * 0.62) + Math.sin(t * 1.5 + i + s) * 0.05, shade(gr, i % 2 ? 0.16 : -0.08));
      dot(c, s * 34, -30, 2.6, shade(WOOD, -0.25)); dot(c, s * 31.4, -27.4, 2.4, shade(WOOD, -0.1));
    }
    var ax = -38.6, ay = -8, bx = 38.6, by = -8, mx = sw, my = 30;
    L(c, ax, ay, ax + 9, ay + 6, 1.1, '#7a6a5a'); L(c, bx, by, bx - 9, by + 6, 1.1, '#7a6a5a');
    /* someone's sun hat and toes say the hammock is taken */
    c.beginPath(); c.moveTo(ax + 9, ay + 6); c.quadraticCurveTo(mx, my + 14, bx - 9, by + 6); c.quadraticCurveTo(mx, my - 8, ax + 9, ay + 6); c.closePath(); F(c, p.accent);
    c.save(); c.clip(); for (i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 8 + mx * 0.6 - 2, -10); c.quadraticCurveTo(i * 9 + mx, 20, i * 8 + mx * 0.6 - 2, 44); c.lineWidth = 2.6; c.strokeStyle = i % 2 ? p.paper : p.gold; c.stroke(); } c.restore();
    c.beginPath(); c.moveTo(ax + 9, ay + 6); c.quadraticCurveTo(mx, my - 8, bx - 9, by + 6); c.lineWidth = K.ow(); c.strokeStyle = shade(p.accent, -0.34); c.stroke();
    E(c, -17 + mx * 0.7, 5, 9, 5.4, p.paper, 0.35); /* a pillow */
    c.save(); c.translate(-9 + mx * 0.8, 4); c.rotate(0.3 + Math.sin(t * 1.4) * 0.03); E(c, 0, 2.4, 12, 4, mix('#e8c98a', p.gold, 0.4)); c.beginPath(); c.arc(0, 1.6, 6.4, PI, 0); c.closePath(); F(c, mix('#e8c98a', p.gold, 0.4)); Rn(c, -6.2, -0.6, 12.4, 2, 0, p.accent2); c.restore();
    for (i = 0; i < 2; i++) { E(c, 19 + i * 5 + mx * 0.8, 4.4 - i * 1.2, 2.6, 3.6, '#e3ac7c', 0.2); }
    for (i = -3; i <= 3; i++) L(c, i * 7 + mx, 19.4 - Math.abs(i) * 1.5, i * 7 + mx, 23.4 - Math.abs(i) * 1.5, 1, p.paper);
    /* a cold drink in the sand */
    Pg(c, [[-5, 28], [5, 28], [3.6, 40], [-3.6, 40]], alpha('#bfe4f7', 0.95)); Rn(c, -4.4, 32, 8.8, 7.6, 0, alpha(p.gold, 0.85)); L(c, 1, 32, 5, 22, 1, p.accent); c.beginPath(); c.arc(-2, 26, 5.4, PI, 0); c.closePath(); F(c, p.accent2); L(c, -2, 26, -1, 31, 0.7, '#7a6a5a');
    c.font = 'bold 8px "CT Sans Bold"'; c.textAlign = 'center'; for (i = 0; i < 2; i++) { var z = frac(t * 0.4 + i * 0.5); c.fillStyle = alpha(p.snow, 0.9 * (1 - z)); c.fillText('z', -14 + z * 7 + i * 2, -8 - z * 16); }
    K.twinkle(c, 0, -40, 3.4 + k * 1.5 + Math.sin(t * 3) * 1.2, p.snow);
  });

  add('goldwatch', function (c, t, p, o) {
    var i, g = p.gold, k = pulse(o), cx = -4, cy = 9;
    shadow(c, 34, 44);
    /* the chain */
    c.beginPath(); c.moveTo(cx, cy - 38); c.bezierCurveTo(10, -52, 30, -46, 34, -30); c.bezierCurveTo(38, -14, 46, -10, 44, 6 + Math.sin(t * 2) * 2); c.setLineDash([3.4, 2.2]); c.lineCap = 'butt'; c.lineWidth = 3.6; c.strokeStyle = shade(g, -0.34); c.stroke(); c.lineWidth = 2; c.strokeStyle = shade(g, 0.15); c.stroke(); c.setLineDash([]); c.lineCap = 'round';
    c.beginPath(); c.arc(cx, cy - 38, 5, 0, TAU); c.lineWidth = 3.4; c.strokeStyle = shade(g, -0.34); c.stroke(); c.lineWidth = 1.8; c.strokeStyle = g; c.stroke();
    R(c, cx - 4, cy - 35, 8, 6, 2, shade(g, -0.08)); for (i = -1; i <= 1; i++) L(c, cx + i * 2, cy - 34, cx + i * 2, cy - 30.4, 0.6, shade(g, -0.35));
    E(c, cx, cy, 31, 31, g); E(c, cx, cy, 27, 27, shade(g, 0.3)); E(c, cx, cy, 24, 24, p.paper);
    for (i = 0; i < 12; i++) { var a = i / 12 * TAU, r0 = i % 3 ? 20.6 : 18.4; L(c, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, i % 3 ? 0.9 : 1.7, i % 3 ? shade(p.paper, -0.4) : '#3b3340'); }
    c.beginPath(); c.arc(cx, cy + 10, 5.4, 0, TAU); c.lineWidth = 0.7; c.strokeStyle = shade(p.paper, -0.3); c.stroke(); L(c, cx, cy + 10, cx + Math.cos(t * 2) * 4, cy + 10 + Math.sin(t * 2) * 4, 0.6, '#3b3340');
    heart(c, cx, cy - 10, 6 + k, p.accent);
    var ha = -PI / 2 + 1.05 + t * 0.01, ma = -PI / 2 - 1.05 + t * 0.12, sa = -PI / 2 + (o.n + Math.min(1, o.beat * 6)) / 60 * TAU;
    L(c, cx, cy, cx + Math.cos(ha) * 11.5, cy + Math.sin(ha) * 11.5, 2.4, '#3b3340'); L(c, cx, cy, cx + Math.cos(ma) * 17.5, cy + Math.sin(ma) * 17.5, 1.7, '#3b3340');
    L(c, cx - Math.cos(sa) * 4, cy - Math.sin(sa) * 4, cx + Math.cos(sa) * 20, cy + Math.sin(sa) * 20, 0.8, p.accent); dot(c, cx, cy, 2, p.accent); dot(c, cx, cy, 0.8, p.paper);
    c.beginPath(); c.arc(cx, cy, 20.5, PI * 1.08, PI * 1.42); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    c.beginPath(); c.arc(cx, cy, 29, PI * 0.15, PI * 0.5); c.lineWidth = 1.6; c.strokeStyle = shade(g, -0.18); c.stroke();
    K.twinkle(c, -34, -22, 6 + k * 3 + Math.sin(t * 3) * 1.5, '#ffffff'); K.twinkle(c, 26, 36, 3.8 + Math.cos(t * 3.5) * 1.4, p.snow); K.twinkle(c, -38, 30, 3 + Math.sin(t * 4) * 1.2, p.snow);
  });

  add('fishingrod', function (c, t, p, o) {
    var i, k = pulse(o), wat = mix('#58b4ff', p.bg, 0.3), bob = Math.sin(t * 2.4) * 1.6, fx = 24, wy = 30, tipx = 30 + Math.sin(t * 2.4) * 0.8, tipy = -42 + bob * 0.5;
    /* water with rings */
    E(c, 6, wy + 6, 44, 9, wat); c.beginPath(); c.ellipse(-12, wy + 8.6, 12, 2, 0, 0, TAU); c.fillStyle = alpha('#ffffff', 0.28); c.fill();
    for (i = 0; i < 2; i++) { var rf = frac(t * 0.5 + i * 0.5); c.beginPath(); c.ellipse(fx, wy + 4, 5 + rf * 12, 1.4 + rf * 3, 0, 0, TAU); c.lineWidth = 1; c.strokeStyle = alpha('#ffffff', 0.8 * (1 - rf)); c.stroke(); }
    /* a little fish, leaping once in a while */
    for (i = 0; i < 3; i++) { var rx = -36 + i * 5, rs = Math.sin(t * 1.3 + i) * 1.4; c.beginPath(); c.moveTo(rx, wy + 4); c.quadraticCurveTo(rx - 1, wy - 8, rx + rs, wy - 18 - i * 4); c.lineWidth = 1.3; c.strokeStyle = shade(GREEN, -0.15); c.stroke(); R(c, rx + rs - 1.7, wy - 27 - i * 4, 3.4, 9, 1.7, '#7a4a2a'); } /* cattails */
    E(c, 2, wy + 9, 7, 2.6, mix(GREEN, p.accent2, 0.35)); Pg(c, [[2, wy + 9], [9, wy + 7.4], [9, wy + 10]], wat, true); K.flower(c, 1, wy + 7.6, 2.2, p.paper, p.gold, 0.4);
    var jf = frac(t * 0.45), ja = clamp(jf * 1.5, 0, 1);
    if (ja >= 1) { var sf = (jf - 0.667) * 3; c.beginPath(); c.ellipse(-24 + sf * 14, wy + 6, 6, 2, 0, 0, TAU); c.fillStyle = alpha(shade(wat, -0.4), 0.45); c.fill(); Pg(c, [[-30 + sf * 14, wy + 6], [-34 + sf * 14, wy + 4], [-34 + sf * 14, wy + 8]], alpha(shade(wat, -0.4), 0.45), true); }
    if (ja < 1) { var jx = -22 + ja * 22, jy = wy + 2 - Math.sin(ja * PI) * 22, jr = -1.0 + ja * 2.0; c.save(); c.translate(jx, jy); c.rotate(jr); Pg(c, [[-6, 0], [-12, -4.4], [-12, 4.4]], shade(p.accent, -0.1)); E(c, 0, 0, 8, 4.6, p.accent); c.beginPath(); c.ellipse(1, 1.4, 6, 2.4, 0, 0, PI); c.fillStyle = shade(p.accent, 0.4); c.fill(); dot(c, 4.4, -1, 1, '#2b2118'); c.restore(); dot(c, -22, wy + 2, 1.4, alpha('#fff', 0.8 * (1 - ja))); dot(c, -19, wy - 1 - ja * 6, 1, alpha('#fff', 0.8 * (1 - ja))); }
    /* the line and the float */
    c.beginPath(); c.moveTo(tipx, tipy); c.quadraticCurveTo(tipx + 4, 0, fx, wy - 6 + bob); c.lineWidth = 0.7; c.strokeStyle = alpha(p.snow, 0.9); c.stroke(); c.lineWidth = 0.35; c.strokeStyle = '#6a707c'; c.stroke();
    L(c, fx, wy - 12 + bob, fx, wy - 6 + bob, 1, '#3b3340'); E(c, fx, wy - 1 + bob, 5, 5.6, p.paper); c.beginPath(); c.arc(fx, wy - 1 + bob, 5, PI, 0); c.closePath(); F(c, p.accent); dot(c, fx - 1.6, wy - 3.4 + bob, 1.2, 'rgba(255,255,255,0.8)');
    c.beginPath(); c.ellipse(fx, wy + 4, 7, 1.8, 0, 0, PI); c.fillStyle = wat; c.fill();
    /* the rod, bending to the catch */
    c.beginPath(); c.moveTo(-34, 20); c.quadraticCurveTo(6, -18, tipx, tipy); c.lineWidth = 4.4; c.strokeStyle = shade(p.accent2, -0.4); c.stroke(); c.lineWidth = 2.8; c.strokeStyle = p.accent2; c.stroke();
    for (i = 1; i <= 4; i++) { var f = i / 4.3, gx = (1 - f) * (1 - f) * -34 + 2 * (1 - f) * f * 6 + f * f * tipx, gy = (1 - f) * (1 - f) * 20 + 2 * (1 - f) * f * -18 + f * f * tipy; c.beginPath(); c.arc(gx + 1.2, gy + 1.6, 1.7, 0, TAU); c.lineWidth = 0.8; c.strokeStyle = '#c9cfd8'; c.stroke(); }
    c.save(); c.translate(-34, 20); c.rotate(-0.76); R(c, -15, -3.4, 19, 6.8, 3, '#d9b07a'); for (i = 0; i < 4; i++) L(c, -12 + i * 4, -2.4, -12 + i * 4, 2.4, 0.6, shade('#d9b07a', -0.22)); R(c, 4, -3, 5, 6, 1.5, p.gold);
    L(c, 12, 2, 12, 7, 2, '#8a909c'); E(c, 12, 10.4, 6.4, 6.4, '#c9cfd8'); dot(c, 12, 10.4, 3.4, '#8a909c'); var ra = t * 4; L(c, 12, 10.4, 12 + Math.cos(ra) * 7.4, 10.4 + Math.sin(ra) * 7.4, 1.4, '#3b3340'); dot(c, 12 + Math.cos(ra) * 7.4, 10.4 + Math.sin(ra) * 7.4, 1.8, p.accent); c.restore();
    K.twinkle(c, -30, -30, 4 + k * 2 + Math.sin(t * 3) * 1.4, p.snow); K.twinkle(c, 44, 6, 3 + Math.cos(t * 3.5) * 1.2, p.snow);
  });

  add('golfbag', function (c, t, p, o) {
    var i, k = pulse(o), bg = p.accent, st = '#c9cfd8', gr = mix(GREEN, p.accent2, 0.35);
    E(c, 2, 42, 44, 5.4, gr); for (i = -4; i <= 5; i++) L(c, i * 8, 39.6, i * 8 - 1.4, 35.6, 1.1, shade(gr, i % 2 ? 0.22 : -0.12));
    c.save(); c.translate(-6, 40); c.rotate(-0.12 + Math.sin(t * 1.4) * 0.012);
    L(c, 10, -40, 30, 1, 2.6, shade(st, -0.34)); L(c, 10, -40, 30, 1, 1.4, st); /* the stand */
    /* clubs: two irons, a putter and a wood in a knitted cover */
    L(c, -8, -52, -11, -78, 1.8, st); c.save(); c.translate(-11, -78); c.rotate(-0.3); R(c, -9, -5, 11, 7, 2, st); L(c, -7, -3, 0, -3, 0.6, '#8a909c'); L(c, -7, -0.6, 0, -0.6, 0.6, '#8a909c'); c.restore();
    L(c, -1, -52, -1, -84, 1.8, st); c.save(); c.translate(-1, -84); c.rotate(0.1); R(c, -2, -5, 12, 7, 2, st); L(c, 1, -3, 8, -3, 0.6, '#8a909c'); L(c, 1, -0.6, 8, -0.6, 0.6, '#8a909c'); c.restore();
    L(c, 6, -52, 10, -74, 1.8, st); R(c, 6, -78, 12, 4.4, 1.5, '#8a909c');
    c.save(); c.translate(13, -58); c.rotate(0.34 + Math.sin(t * 2) * 0.03); L(c, 0, 6, 0, -8, 1.8, st); E(c, 2, -16, 8.4, 10, p.accent2); for (i = -2; i <= 2; i++) L(c, -5, -16 + i * 3.6, 9, -16 + i * 3.6, 1, shade(p.accent2, i % 2 ? 0.3 : -0.15)); Rn(c, -4, -8, 12, 3, 1.2, p.paper); K.pom(c, 2, -27.4, 4 + k, p.gold); c.restore();
    /* the bag */
    R(c, -15, -52, 30, 54, 7, bg); Rn(c, -13, -50, 4, 50, 2, alpha('#ffffff', 0.2));
    R(c, -17, -56, 34, 9, 4, shade(bg, -0.16)); E(c, 0, -55.4, 14, 2.6, '#3b3340');
    R(c, -11, -30, 22, 15, 3, shade(bg, 0.16)); L(c, -8, -26, 8, -26, 0.9, p.gold); dot(c, 8.6, -26, 1.3, p.gold);
    R(c, -11, -11, 22, 10, 3, p.paper); star(c, 0, -6, 3.4, p.accent2);
    R(c, -16, -2.6, 32, 5.4, 2.4, '#3b3340');
    c.beginPath(); c.moveTo(-14, -46); c.bezierCurveTo(-30, -40, -30, -16, -14, -9); c.lineWidth = 4.2; c.strokeStyle = shade(p.gold, -0.36); c.stroke(); c.lineWidth = 2.6; c.strokeStyle = shade(p.gold, -0.05); c.stroke(); /* the strap */
    Pg(c, [[14, -40], [22, -38], [20, -24], [14, -26]], p.paper); L(c, 15.6, -35, 19.6, -34, 0.6, shade(p.paper, -0.3)); /* a towel */
    c.restore();
    /* a ball on its tee */
    L(c, 31, 40, 31, 34, 1.6, p.gold); Pg(c, [[28.6, 33.4], [33.4, 33.4], [31, 36.4]], p.gold); E(c, 31, 29, 5, 5, p.snow); dot(c, 29.6, 27.6, 0.6, '#b9c2cc'); dot(c, 32, 28.4, 0.6, '#b9c2cc'); dot(c, 30.4, 30.4, 0.6, '#b9c2cc'); dot(c, 33, 30.6, 0.6, '#b9c2cc');
    K.twinkle(c, 36, -20, 4.2 + Math.sin(t * 3) * 1.5, p.snow); K.twinkle(c, -38, -8, 3 + Math.cos(t * 3.6) * 1.2, p.snow);
  });
});
