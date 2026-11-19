/* Send a Carol art pack: quiet props (sympathy, remembrance), pet things, garden and kitchen pieces. Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var GR = '#5fae6e', GRD = '#3f8a56', WOOD = '#a9744a', IRON = '#4a4652', SHADOW = 'rgba(0,0,0,0.13)';

  /* stroke the current path as a fat outlined line (the hand's outline, then the colour) */
  function st(c, w, col) { var o = K.ow(); c.lineCap = 'round'; c.lineJoin = 'round'; if (o > 0) { c.lineWidth = w + o * 2; c.strokeStyle = shade(col, -0.34); c.stroke(); } c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  function curve(c, x0, y0, cx, cy, x1, y1) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); }
  function ground(c, y, rx) { c.beginPath(); c.ellipse(0, y, rx, rx * 0.11, 0, 0, TAU); c.fillStyle = SHADOW; c.fill(); }
  function blade(c, x, y, len, rot, w, col) { /* a long pointed leaf growing from x,y */
    c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(-w * 0.7, -len * 0.55, 0, -len); c.quadraticCurveTo(w * 0.7, -len * 0.55, w / 2, 0); c.closePath(); F(c, col); c.restore();
  }
  function tuft(c, x, y, s, col) { blade(c, x - s * 0.3, y, s * 0.8, -0.5, s * 0.3, col); blade(c, x + s * 0.3, y, s * 0.75, 0.5, s * 0.3, col); blade(c, x, y, s, 0.05, s * 0.32, shade(col, 0.12)); }
  function lilyBloom(c, x, y, r, rot, col) {
    var i, a; c.save(); c.translate(x, y); c.rotate(rot);
    for (i = 0; i < 6; i++) {
      c.save(); c.rotate((i % 2 ? 0.52 : 0) + Math.floor(i / 2) * TAU / 3 + (i % 2 ? 0 : 0)); if (i % 2 === 0) c.rotate(0); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(r * 0.44, -r * 0.3, r * 0.34, -r * 0.82, 0, -r); c.bezierCurveTo(-r * 0.34, -r * 0.82, -r * 0.44, -r * 0.3, 0, 0);
      F(c, i % 2 ? col : shade(col, -0.07)); L(c, 0, -r * 0.22, 0, -r * 0.76, r * 0.035, shade(col, -0.2)); c.restore();
    }
    dot(c, 0, 0, r * 0.2, '#cfe3a8');
    for (i = 0; i < 5; i++) { a = i / 5 * TAU + 0.3; L(c, 0, 0, Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, r * 0.035, '#9cc27a'); dot(c, Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, r * 0.075, '#d98a2b'); }
    c.restore();
  }

  /* ---------- quiet pieces: sympathy and remembrance (still, gentle, no faces) ---------- */
  Art.add('prop', 'lily', function (c, t, p, o) {
    var sw = Math.sin(t * 0.8) * 0.018, w = p.snow, i, fl = [[-22, -10, 20, -0.5], [3, -27, 22, 0.1], [24, -5, 19, 0.6]];
    c.save(); c.translate(0, 44); c.rotate(sw); c.translate(0, -44);
    blade(c, -4, 40, 46, -0.62, 9, GRD); blade(c, 4, 40, 44, 0.66, 9, GRD); blade(c, -2, 42, 34, -1.05, 8, GR); blade(c, 3, 42, 32, 1.1, 8, GR);
    for (i = 0; i < 3; i++) { curve(c, fl[i][0], fl[i][1], fl[i][0] * 0.5, 14, i - 1, 44); st(c, 2.4, GRD); }
    curve(c, -8, -38, -6, 0, -1, 44); st(c, 2, GRD);
    c.beginPath(); c.moveTo(-8, -30); c.quadraticCurveTo(-14, -40, -9, -50); c.quadraticCurveTo(-3, -40, -8, -30); c.closePath(); F(c, mix(w, '#cfe3a8', 0.45)); /* a bud */
    blade(c, -3, 20, 22, -0.9, 6, GR); blade(c, 3, 16, 22, 0.95, 6, GR);
    for (i = 0; i < 3; i++) lilyBloom(c, fl[i][0], fl[i][1], fl[i][2], fl[i][3] + Math.sin(t * 0.9 + i * 2) * 0.03, w);
    Pg(c, [[-3, 33], [-11, 45], [-5, 44], [0, 35]], shade(p.paper, -0.12)); Pg(c, [[3, 33], [10, 46], [5, 44], [0, 35]], shade(p.paper, -0.12)); R(c, -6.5, 27, 13, 7.5, 2.4, p.paper);
    c.restore();
  });

  function wing(c, x, y, len, rot, col) {
    var i; c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, -1);
    c.beginPath(); c.moveTo(-2, -10); c.quadraticCurveTo(len * 0.6, -14, len, -3);
    for (i = 4; i >= 0; i--) c.quadraticCurveTo(len * (i + 0.75) / 5.4, 2 + (5 - i) * 2.6, len * i / 5.4, 5 + (5 - i) * 1.6);
    c.quadraticCurveTo(-8, 4, -2, -10); c.closePath(); F(c, col);
    for (i = 1; i < 5; i++) L(c, len * i / 5.4, 3 + (5 - i) * 1.4, len * (i + 0.5) / 5.4, -3, 0.7, shade(col, -0.14));
    c.restore();
  }
  Art.add('prop', 'dove', function (c, t, p, o) {
    var fl = Math.sin(t * 2.1), w = p.snow, i;
    K.glow(c, 0, -4, 50, p.snow, 0.3);
    c.save(); c.translate(0, 8 + Math.sin(t * 2.1 - 0.7) * 1.6); c.rotate(-0.1);
    wing(c, -6, -4, 36, -1.95 - fl * 0.2, shade(w, -0.1));
    Pg(c, [[-20, 0], [-44, -3], [-41, 3], [-46, 7], [-41, 10], [-43, 15], [-18, 12]], shade(w, -0.05)); L(c, -24, 5, -39, 4, 0.8, shade(w, -0.2)); L(c, -24, 8, -38, 10, 0.8, shade(w, -0.2));
    c.beginPath(); c.moveTo(-26, 2); c.bezierCurveTo(-14, -14, 14, -18, 24, -8); c.bezierCurveTo(30, 6, 12, 19, -4, 17); c.bezierCurveTo(-16, 16, -24, 10, -26, 2); c.closePath(); F(c, w);
    c.beginPath(); c.moveTo(-18, 10); c.quadraticCurveTo(0, 18, 18, 8); c.lineWidth = 1.6; c.strokeStyle = shade(w, -0.1); c.stroke();
    Pg(c, [[31, -13.5], [40, -10.5], [31, -8.5]], '#e2b877'); E(c, 24, -12, 9.5, 8.8, w); dot(c, 27, -13.5, 1.5, '#4a4250');
    wing(c, -2, -5, 40, -1.5 - fl * 0.26, w);
    curve(c, 37, -10, 43, -4, 46, 3); c.lineWidth = 1.3; c.strokeStyle = GRD; c.stroke(); /* an olive sprig */
    K.leaf(c, 40, -7, 9, 0.2, GR); K.leaf(c, 43, -2, 9, 2.2, GR); K.leaf(c, 45, 2, 8, 1.1, GRD);
    c.restore();
  });

  Art.add('prop', 'memorialcandle', function (c, t, p, o) {
    var fk = Math.sin(t * 5) * 0.5 + Math.sin(t * 8.3) * 0.5, gl = '#ffdc8a', wax = shade(p.paper, -0.03);
    K.glow(c, 0, -6, 48 + fk, gl, 0.5);
    ground(c, 42, 30); E(c, 0, 39, 27, 5, mix(WOOD, p.gold, 0.2)); E(c, 0, 37.6, 23, 3.6, shade(mix(WOOD, p.gold, 0.2), 0.15));
    R(c, -12, 2, 24, 35, 3, wax);
    c.beginPath(); c.moveTo(-12, 8); c.lineTo(-12, 4); c.quadraticCurveTo(0, -1, 12, 4); c.lineTo(12, 12); c.quadraticCurveTo(9, 17, 7, 10); c.quadraticCurveTo(3, 6, 0, 13); c.quadraticCurveTo(-4, 19, -7, 10); c.quadraticCurveTo(-10, 6, -12, 8); c.closePath(); c.fillStyle = shade(wax, -0.1); c.fill();
    L(c, 0, 2, 0, -3, 1.1, '#4a4250'); K.flame(c, 0, -2, 8.5, 17, t * 0.5, 0.7);
    K.rrp(c, -19, -22, 38, 60, 6); c.fillStyle = alpha('#ffffff', 0.16); c.fill(); c.lineWidth = 1.5; c.strokeStyle = alpha(mix('#8fa6b8', p.ink, 0.3), 0.9); c.stroke();
    c.beginPath(); c.ellipse(0, -22, 19, 3.6, 0, 0, TAU); c.fillStyle = alpha('#ffffff', 0.22); c.fill(); c.stroke();
    L(c, -14.5, -14, -14.5, 28, 2.4, alpha('#ffffff', 0.6)); L(c, 14, -4, 14, 12, 1.4, alpha('#ffffff', 0.4));
    blade(c, -22, 40, 17, -1.1, 6, GR); blade(c, -20, 40, 15, -0.45, 5.5, GRD); blade(c, 22, 40, 14, 1.0, 5.5, GR);
    K.flower(c, -25, 34, 5, p.snow, '#f3d36b', 0.3); K.flower(c, 25, 36, 4, p.snow, '#f3d36b', 1);
  });

  Art.add('prop', 'willow', function (c, t, p, o) {
    var i, n = 15, tr = mix('#7a5a44', p.ink, 0.15), g1 = mix(GRD, p.accent2, 0.2), g2 = mix(GR, p.accent2, 0.15), g3 = shade(g2, 0.22), R0 = rnd('willow');
    ground(c, 42, 40); c.beginPath(); c.ellipse(0, 41, 36, 5, 0, 0, TAU); F(c, g2);
    function strands(back) {
      for (i = 0; i < n; i++) {
        var f = i / (n - 1), a = PI * (1.05 - f * 1.1), x0 = Math.cos(a) * 34 * (back ? 0.8 : 1), y0 = -20 - Math.sin(a) * 18, len = 34 + R0() * 18 + Math.sin(f * PI) * (back ? 6 : -2), s = Math.sin(t * 0.9 + i * 0.7 + (back ? 2 : 0)) * 2.4;
        if (!back && Math.abs(x0) < 9) len *= 0.55;
        var x1 = x0 * 1.2 + s, y1 = Math.min(y0 + len, 38);
        curve(c, x0, y0, x0 * 1.22 + s * 0.3, y0 + len * 0.4, x1, y1); c.lineCap = 'round'; c.lineWidth = back ? 4 : 3.4; c.strokeStyle = back ? shade(g1, -0.12) : (i % 2 ? g2 : g3); c.stroke();
      }
    }
    strands(true);
    c.beginPath(); c.moveTo(-8, 41); c.quadraticCurveTo(-3, 20, -5, -6); c.lineTo(-14, -22); c.lineTo(-9, -24); c.lineTo(-1, -10); c.lineTo(8, -26); c.lineTo(13, -23); c.lineTo(5, -4); c.quadraticCurveTo(4, 22, 9, 41); c.closePath(); F(c, tr);
    L(c, -1, 6, 0, 30, 1.1, shade(tr, -0.2)); L(c, 3, 14, 3.5, 24, 1, shade(tr, -0.2));
    c.beginPath(); c.moveTo(-38, -18); c.bezierCurveTo(-40, -44, -14, -50, 0, -46); c.bezierCurveTo(16, -50, 40, -42, 38, -18); c.bezierCurveTo(26, -8, 12, -16, 0, -12); c.bezierCurveTo(-12, -16, -26, -8, -38, -18); c.closePath(); F(c, g1);
    c.beginPath(); c.ellipse(-8, -34, 19, 9, -0.2, 0, TAU); c.fillStyle = alpha(g3, 0.55); c.fill();
    strands(false);
    tuft(c, -26, 42, 7, g3); tuft(c, 24, 43, 6, g3);
  });

  Art.add('prop', 'gardenbench', function (c, t, p, o) {
    var w = mix(WOOD, p.gold, 0.18), wd = shade(w, -0.14), i, s;
    ground(c, 40, 46);
    for (s = -1; s <= 1; s += 2) { L(c, s * 31, -26, s * 31, 14, 4.6, shade(IRON, -0.3)); L(c, s * 31, -26, s * 31, 14, 3, IRON); }
    for (i = 0; i < 3; i++) R(c, -37, -29 + i * 10.5, 74, 8, 2.5, i % 2 ? wd : w);
    for (i = 0; i < 3; i++) L(c, -32, -26.4 + i * 10.5, 30, -26.4 + i * 10.5, 0.9, alpha('#ffffff', 0.35));
    for (s = -1; s <= 1; s += 2) {
      c.beginPath(); c.moveTo(s * 36, 38); c.lineTo(s * 36, 14); st(c, 3.6, IRON); c.beginPath(); c.moveTo(s * 29, 34); c.lineTo(s * 31, 14); st(c, 3, shade(IRON, 0.1));
      c.beginPath(); c.moveTo(s * 33, -14); c.bezierCurveTo(s * 46, -18, s * 47, -2, s * 40, 1); c.bezierCurveTo(s * 36, 3, s * 37, 8, s * 39, 9); st(c, 3, IRON);
    }
    R(c, -41, 6, 82, 9, 3, w); Rn(c, -39, 12.4, 78, 2.2, 1, alpha('#000000', 0.12)); L(c, -36, 8.6, 34, 8.6, 1, alpha('#ffffff', 0.4));
    c.save(); c.translate(9, 4.6); c.rotate(-0.12); L(c, -10, 0, 4, 0, 1.3, GRD); K.leaf(c, -6, 0, 7, -2.5, GR); lilyBloom(c, 8, 0, 6.5, 1.2, p.snow); c.restore(); /* one flower left on the seat */
    tuft(c, -44, 40, 9, GR); tuft(c, 43, 40, 8, GRD); tuft(c, -20, 41, 5, GR); tuft(c, 14, 41, 5.5, GR);
    K.flower(c, -41, 27 + Math.sin(t * 1.1) * 0.6, 4.4, p.snow, '#f3d36b', 0.2); K.flower(c, 46, 30 + Math.cos(t * 1.2) * 0.6, 3.8, shade(p.accent, 0.55), '#f3d36b', 1);
  });

  Art.add('prop', 'stillpond', function (c, t, p, o) {
    var wa = mix('#86bcd9', p.bg, 0.22), i, k, f, bank = mix(GR, p.accent2, 0.2), sw;
    c.beginPath(); c.ellipse(0, 18, 48, 22, 0, 0, TAU); F(c, bank); c.beginPath(); c.ellipse(0, 16, 48, 21, 0, 0, TAU); c.fillStyle = shade(bank, 0.14); c.fill();
    for (i = 0; i < 2; i++) { sw = Math.sin(t * 0.8 + i) * 0.03; blade(c, -30 + i * 7, 6, 38 - i * 8, -0.12 + sw, 4.5, GRD); }
    c.beginPath(); c.ellipse(0, 19, 41, 16, 0, 0, TAU); F(c, wa);
    c.save(); c.beginPath(); c.ellipse(0, 19, 41, 16, 0, 0, TAU); c.clip();
    c.beginPath(); c.ellipse(-6, 10, 40, 9, 0, 0, TAU); c.fillStyle = alpha('#ffffff', 0.16); c.fill();
    for (k = 0; k < 3; k++) { f = frac(t * 0.16 + k / 3); c.beginPath(); c.ellipse(10, 21, 3 + f * 24, (3 + f * 24) * 0.36, 0, 0, TAU); c.lineWidth = 1.3 * (1 - f) + 0.3; c.strokeStyle = alpha('#ffffff', 0.75 * (1 - f)); c.stroke(); }
    L(c, -24, 27, -10, 27, 1, alpha('#ffffff', 0.45)); L(c, 22, 12, 31, 12, 1, alpha('#ffffff', 0.4));
    c.restore();
    c.beginPath(); c.moveTo(-17, 25); c.arc(-17, 25, 8, 0.5, TAU - 0.1); c.closePath(); c.save(); c.translate(-17, 25); c.scale(1, 0.45); c.translate(17, -25); F(c, GR); c.restore();
    lilyBloom(c, -18, 23.5, 4.6, 0.3, p.snow); c.beginPath(); c.ellipse(24, 28, 5, 2.1, 0, 0, TAU); F(c, GRD);
    for (i = 0; i < 4; i++) { /* reeds and cattails */
      var rx = [-36, -27, 33, 40][i], h = [44, 54, 48, 36][i], by = [14, 10, 11, 17][i]; sw = Math.sin(t * 0.9 + i * 1.3) * 1.6;
      curve(c, rx, by, rx + sw * 0.3, by - h * 0.5, rx + sw, by - h); st(c, 1.5, GRD);
      c.save(); c.translate(rx + sw * 0.8, by - h * 0.78); c.rotate(sw * 0.03); R(c, -2.6, -7, 5.2, 14, 2.6, '#7a5238'); c.restore();
      blade(c, rx + (i < 2 ? 4 : -4), by + 1, h * 0.62, (i < 2 ? 0.3 : -0.3) + sw * 0.02, 4.4, GR);
    }
    tuft(c, 12, 37, 6, GRD); tuft(c, -40, 27, 6, GR);
  });

  Art.add('prop', 'collar', function (c, t, p, o) {
    var col = mix(p.accent, '#7a3b3b', 0.15), g = p.gold, sw = Math.sin(t * 1.1) * 0.05, i, a;
    ground(c, 30, 40);
    c.beginPath(); c.ellipse(0, -8, 36, 19, 0, 0, TAU); st(c, 9, col);
    c.beginPath(); c.ellipse(0, -8, 36, 19, 0, 0, TAU); c.setLineDash([2.6, 3.6]); c.lineWidth = 0.9; c.strokeStyle = alpha(p.paper, 0.75); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.ellipse(0, -8, 31.4, 14.6, 0, PI * 1.05, PI * 1.95); c.lineWidth = 1.2; c.strokeStyle = alpha('#000000', 0.16); c.stroke();
    for (i = 0; i < 4; i++) { a = PI * (1.62 + i * 0.07); dot(c, Math.cos(a) * 36, -8 + Math.sin(a) * 19, 1.3, shade(col, -0.45)); }
    c.save(); c.translate(-25, -21.5); c.rotate(-0.5); R(c, -6.5, -7.5, 13, 15, 2.5, g); Rn(c, -3.4, -4.6, 6.8, 9.2, 1.4, col); L(c, -3, 0, 5, 0, 1.5, shade(g, -0.2)); c.restore();
    c.save(); c.translate(26, -21); c.rotate(0.52); R(c, -2.4, -6.6, 4.8, 13.2, 1.6, shade(col, -0.16)); c.restore(); /* the keeper loop */
    c.beginPath(); c.arc(0, 13.5, 5, 0, TAU); c.lineWidth = 3.2; c.strokeStyle = shade(g, -0.4); c.stroke(); c.lineWidth = 1.8; c.strokeStyle = shade(g, 0.1); c.stroke();
    c.save(); c.translate(0, 17); c.rotate(sw); c.beginPath(); c.arc(0, 15, 13, 0, TAU); F(c, g); c.beginPath(); c.arc(0, 15, 10.4, 0, TAU); c.lineWidth = 0.8; c.strokeStyle = shade(g, -0.22); c.stroke();
    dot(c, 0, 5.4, 1.7, shade(g, -0.45)); K.heartPath(c, 0, 16, 10); c.fillStyle = shade(g, -0.28); c.fill(); K.shine(c, -6, 9.5, 3); c.restore();
    K.twinkle(c, 15, 22, 3 + Math.sin(t * 1.6) * 1.2, alpha('#ffffff', 0.9));
  });

  Art.add('prop', 'pawheart', function (c, t, p, o) {
    var k = 1 + Math.sin(t * 1.4) * 0.012, col = mix(p.accent, p.paper, 0.18);
    K.glow(c, 0, 0, 50, p.snow, 0.22); c.save(); c.scale(k, k);
    K.heartPath(c, 0, 4, 80); F(c, col);
    c.save(); K.heartPath(c, 0, 4, 80); c.clip(); c.beginPath(); c.ellipse(10, 22, 44, 40, 0, 0, TAU); c.fillStyle = alpha('#000000', 0.07); c.fill(); c.beginPath(); c.ellipse(-8, -6, 40, 36, 0, 0, TAU); c.fillStyle = col; c.fill(); c.restore();
    c.beginPath(); c.moveTo(-31, -4); c.quadraticCurveTo(-32, -22, -19, -27); c.lineWidth = 3; c.lineCap = 'round'; c.strokeStyle = alpha('#ffffff', 0.5); c.stroke();
    var sow = K.ow(); K.ow(0.8); K.paw(c, 0, 4, 46, 0, p.paper); K.ow(sow);
    c.restore();
  });

  /* ---------- pet things ---------- */
  Art.add('prop', 'petbowl', function (c, t, p, o) {
    var col = p.accent, i, R0 = rnd('kibble'), kb = ['#a8703f', '#8f5a30', '#c08a52'];
    ground(c, 37, 44);
    c.beginPath(); c.moveTo(-31, 2); c.lineTo(31, 2); c.lineTo(39, 31); c.quadraticCurveTo(40, 37, 33, 37); c.lineTo(-33, 37); c.quadraticCurveTo(-40, 37, -39, 31); c.closePath(); F(c, col);
    c.beginPath(); c.moveTo(-37, 29); c.lineTo(37, 29); c.lineTo(38.6, 33); c.quadraticCurveTo(39, 36.4, 33, 36.4); c.lineTo(-33, 36.4); c.quadraticCurveTo(-39, 36.4, -38.6, 33); c.closePath(); c.fillStyle = shade(col, -0.16); c.fill();
    E(c, 0, 2, 32, 8.5, shade(col, 0.22)); E(c, 0, 3, 27, 6.2, shade(col, -0.4));
    c.save(); c.beginPath(); c.ellipse(0, 3, 27, 6.2, 0, 0, TAU); c.rect(-30, -30, 60, 33); c.clip();
    for (i = 0; i < 26; i++) { var a = R0() * PI, rr = Math.sqrt(R0()), kx = Math.cos(a) * rr * 25, ky = 4 - Math.sin(a) * rr * (11 - Math.abs(kx) * 0.22); E(c, kx, ky, 3.6, 3.1, kb[i % 3]); dot(c, kx - 1, ky - 1, 0.9, alpha('#ffffff', 0.35)); }
    c.restore();
    c.beginPath(); c.ellipse(0, 3, 27, 6.2, 0, 0.05, PI - 0.05); c.lineWidth = 1.4; c.strokeStyle = shade(col, -0.34); c.stroke();
    K.bone(c, 0, 19, 30, -0.06, p.paper); L(c, -29, 9, -33, 25, 2.2, alpha('#ffffff', 0.4));
    K.twinkle(c, 37, -8, 3.4 + Math.sin(t * 2.2) * 1.4, p.snow);
  });

  Art.add('prop', 'tennisball', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), y = -4 - k * 5, col = '#d3e24a', i, R0 = rnd('fuzz');
    c.beginPath(); c.ellipse(0, 38, 26 - k * 4, 3.4 - k * 0.5, 0, 0, TAU); c.fillStyle = SHADOW; c.fill();
    c.save(); c.translate(0, y); c.rotate(Math.sin(t * 0.9) * 0.2);
    c.beginPath(); c.arc(0, 0, 32, 0, TAU); F(c, col);
    c.save(); c.beginPath(); c.arc(0, 0, 32, 0, TAU); c.clip();
    c.beginPath(); c.ellipse(9, 10, 34, 32, 0, 0, TAU); c.rect(-40, -40, 80, 80); c.fillStyle = alpha('#ffffff', 0.22); c.fill('evenodd');
    c.beginPath(); c.arc(8, 8, 34, 0.2, PI * 0.75); c.lineWidth = 9; c.strokeStyle = alpha('#6f8a1e', 0.22); c.stroke();
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(i * 37, -4, 27, 0, TAU); c.lineWidth = 4.6; c.strokeStyle = shade(col, -0.2); c.stroke(); c.lineWidth = 3; c.strokeStyle = p.paper; c.stroke(); }
    for (i = 0; i < 22; i++) { var a = R0() * TAU, r = R0() * 28, fx = Math.cos(a) * r, fy = Math.sin(a) * r; L(c, fx, fy, fx + 1.4, fy - 1.6, 0.6, alpha('#ffffff', 0.4)); }
    c.restore(); K.shine(c, -12, -17, 6.5); c.restore();
    for (i = 0; i < 3; i++) L(c, -41 + i * 3, 14 - i * 9 + y * 0.3, -46 + i * 3, 16 - i * 9 + y * 0.3, 1.4, alpha(p.snow, 0.3 + k * 0.5));
  });

  Art.add('prop', 'doghouse', function (c, t, p, o) {
    var w = mix('#e9cfa2', p.paper, 0.3), rf = p.accent, i;
    ground(c, 42, 46); tuft(c, -41, 42, 8, GR); tuft(c, 43, 42, 7, GRD);
    R(c, -29, -8, 58, 50, 2.5, w);
    for (i = 1; i < 5; i++) L(c, -28, -8 + i * 10, 28, -8 + i * 10, 0.8, shade(w, -0.16));
    Pg(c, [[-29, -8], [0, -34], [29, -8]], shade(w, -0.06));
    c.beginPath(); c.moveTo(-14, 42); c.lineTo(-14, 18); c.arc(0, 18, 14, PI, 0); c.lineTo(14, 42); c.closePath(); F(c, mix('#3a2a2a', p.ink, 0.4));
    c.beginPath(); c.moveTo(-14, 42); c.lineTo(-14, 18); c.arc(0, 18, 14, PI, 0); c.lineTo(14, 42); c.lineWidth = 2.6; c.strokeStyle = shade(w, -0.28); c.stroke();
    c.beginPath(); c.moveTo(-39, -3); c.lineTo(0, -41); c.lineTo(39, -3); st(c, 8, rf);
    c.beginPath(); c.moveTo(-36, -4.5); c.lineTo(0, -38.5); c.lineWidth = 1.4; c.strokeStyle = alpha('#ffffff', 0.4); c.stroke();
    for (i = 1; i < 5; i++) { L(c, -i * 8 - 2.6, -38 + i * 7.8 + 3.2, -i * 8 + 2.6, -38 + i * 7.8 - 3.2, 1, shade(rf, -0.3)); L(c, i * 8 - 2.6, -38 + i * 7.8 - 3.2, i * 8 + 2.6, -38 + i * 7.8 + 3.2, 1, shade(rf, -0.3)); }
    R(c, -13, -13, 26, 11, 3, p.paper); var sow = K.ow(); K.ow(0.6); K.bone(c, 0, -7.5, 19, 0, p.gold); K.ow(sow);
    K.paw(c, -2, 33, 9, 0.2, alpha('#ffffff', 0.16));
    c.beginPath(); c.moveTo(22, 34); c.lineTo(42, 34); c.lineTo(45, 42); c.lineTo(19, 42); c.closePath(); F(c, p.accent2); E(c, 32, 34, 10, 2.6, shade(p.accent2, -0.35));
  });

  Art.add('prop', 'fishbowl', function (c, t, p, o) {
    var wa = mix('#8fd0ee', p.bg, 0.12), i, fx = Math.sin(t * 0.7) * 9, dir = Math.cos(t * 0.7) >= 0 ? 1 : -1, fy = 6 + Math.sin(t * 1.3) * 3, tw = Math.sin(t * 6) * 0.3, R0 = rnd('pebble'), pc = ['#e8d9b8', '#c9b28a', p.accent2, '#f3ead6'];
    ground(c, 42, 34);
    c.beginPath(); c.arc(0, 4, 38, -PI * 0.5 + 0.62, PI * 1.5 - 0.62); c.closePath(); c.fillStyle = alpha('#ffffff', 0.2); c.fill();
    c.save(); c.beginPath(); c.arc(0, 4, 38, -PI * 0.5 + 0.62, PI * 1.5 - 0.62); c.closePath(); c.clip();
    c.fillStyle = wa; c.fillRect(-40, -17, 80, 62); c.fillStyle = alpha('#ffffff', 0.3); c.beginPath(); c.ellipse(0, -17, 34, 3.4 + Math.sin(t * 1.5) * 0.4, 0, 0, TAU); c.fill();
    for (i = 0; i < 3; i++) { var sx = [-20, -13, 22][i], sh = [30, 22, 24][i], swy = Math.sin(t * 1.1 + i) * 3; curve(c, sx, 40, sx + swy, 40 - sh * 0.5, sx - swy * 0.6, 40 - sh); c.lineWidth = 3.2; c.lineCap = 'round'; c.strokeStyle = i % 2 ? GR : GRD; c.stroke(); }
    for (i = 0; i < 16; i++) { var px = -30 + i * 4 + R0() * 2; E(c, px, 38 + R0() * 3 - Math.cos(px / 22) * 3, 3.4 + R0() * 1.6, 2.8, pc[i % 4]); }
    c.save(); c.translate(fx, fy); c.scale(dir, 1); /* the goldfish */
    c.save(); c.translate(-11, 0); c.rotate(tw); Pg(c, [[0, 0], [-13, -8], [-10, 0], [-13, 8]], '#ff9a3c'); c.restore();
    Pg(c, [[-4, -6], [2, -12], [6, -6]], '#ff9a3c'); E(c, 0, 0, 13, 8, '#ff8a2a'); c.beginPath(); c.ellipse(1, 3, 9, 3.6, 0, 0, TAU); c.fillStyle = alpha('#ffe2a8', 0.75); c.fill();
    Pg(c, [[-1, 2], [-6, 8], [2, 5]], '#ffb056'); dot(c, 7.5, -2, 2.3, '#ffffff'); dot(c, 8.1, -2, 1.3, '#2b2118');
    c.restore();
    for (i = 0; i < 3; i++) { var bf = frac(t * 0.35 + i * 0.37); c.beginPath(); c.arc(14 + i * 4 + Math.sin(t * 2 + i) * 1.5, 28 - bf * 42, 1.4 + i * 0.5, 0, TAU); c.lineWidth = 0.8; c.strokeStyle = alpha('#ffffff', 0.9 * (1 - bf)); c.stroke(); }
    c.restore();
    c.beginPath(); c.arc(0, 4, 38, -PI * 0.5 + 0.62, PI * 1.5 - 0.62); c.lineWidth = 2; c.strokeStyle = alpha(mix('#7fa0b8', p.ink, 0.3), 0.95); c.stroke();
    c.beginPath(); c.ellipse(0, -27, 22.6, 4, 0, 0, TAU); c.fillStyle = alpha('#ffffff', 0.3); c.fill(); c.lineWidth = 2.2; c.strokeStyle = alpha(mix('#7fa0b8', p.ink, 0.3), 0.95); c.stroke();
    c.beginPath(); c.arc(0, 4, 32, PI * 0.95, PI * 1.3); c.lineWidth = 3.4; c.lineCap = 'round'; c.strokeStyle = alpha('#ffffff', 0.7); c.stroke(); dot(c, -22, -19, 2, alpha('#ffffff', 0.7));
  });

  Art.add('prop', 'cattree', function (c, t, p, o) {
    var cp = mix(p.accent2, p.paper, 0.35), cd = shade(cp, -0.16), ro = '#dcc199', i, sw = Math.sin(t * 2.2) * 0.35 + (Math.exp(-5 * o.beat) - 0.3) * 0.1;
    ground(c, 44, 44);
    function post(x, y0, y1) { R(c, x - 5.5, y0, 11, y1 - y0, 2, ro); c.save(); K.rrp(c, x - 5.5, y0, 11, y1 - y0, 2); c.clip(); for (var j = y0 - 4; j < y1 + 6; j += 4.2) L(c, x - 7, j + 3, x + 7, j, 0.9, shade(ro, -0.22)); c.restore(); }
    post(-18, -30, 36); post(21, -2, 36);
    R(c, -40, 35, 80, 8, 3.5, cp); Rn(c, -38, 40, 76, 2.4, 1.2, alpha('#000000', 0.1));
    R(c, 4, 6, 34, 26, 5, cd); c.beginPath(); c.arc(21, 20, 8.6, 0, TAU); F(c, mix('#3a2a2a', p.ink, 0.4)); /* the cubby */
    Pg(c, [[16, 17], [17.5, 13], [19.6, 16]], shade(cp, -0.5), true); Pg(c, [[22.4, 16], [24.5, 13], [26, 17]], shade(cp, -0.5), true);
    dot(c, 18.6, 20, 1.3, '#f6e27a'); dot(c, 23.4, 20, 1.3, '#f6e27a'); /* somebody is in there */
    R(c, -2, 0, 44, 7, 3.2, cp);
    R(c, -40, -8, 30, 6.5, 3, cp); /* the low step */
    R(c, -38, -36, 44, 8, 3.6, cp); E(c, -34, -38, 6, 5, cd); E(c, 2, -38, 6, 5, cd); Rn(c, -33, -40.6, 34, 4.4, 2, shade(cp, 0.2));
    c.save(); c.translate(1, -28); c.rotate(sw); L(c, 0, 0, 0, 17, 0.9, shade(p.ink, 0.3)); K.pom(c, 0, 20, 4.6, p.accent); c.restore();
    c.save(); c.translate(-30, -1.5); c.rotate(-sw * 0.5); L(c, 0, 0, 0, 10, 0.9, shade(p.ink, 0.3)); Pg(c, [[0, 9], [-3, 15], [0, 18], [3, 15]], p.gold); c.restore();
  });

  /* ---------- garden ---------- */
  Art.add('prop', 'wateringcan', function (c, t, p, o) {
    var col = p.accent2, d = shade(col, -0.16), i, f;
    ground(c, 41, 36);
    for (i = 0; i < 5; i++) { f = frac(t * 0.8 + i * 0.2); var dx = -41 - (i % 3) * 3.4 - f * 5, dy = -14 + f * 46 + (i % 2) * 3; c.beginPath(); c.moveTo(dx, dy - 3); c.quadraticCurveTo(dx + 2.4, dy + 1, dx, dy + 2.4); c.quadraticCurveTo(dx - 2.4, dy + 1, dx, dy - 3); c.fillStyle = alpha(mix('#5fb4ea', p.snow, 0.2), 0.95 * (1 - f * f)); c.fill(); }
    c.beginPath(); c.arc(27, 12, 15, -PI * 0.5, PI * 0.5); st(c, 5, d);
    c.beginPath(); c.arc(5, -9, 17, PI * 1.02, PI * 1.98); st(c, 4, d);
    Pg(c, [[-12, 22], [-12, 12], [-37, -17], [-42, -12], [-14, 30]], d);
    c.save(); c.translate(-40, -15.5); c.rotate(-0.86); E(c, 0, 0, 9, 4.4, shade(col, 0.12)); for (i = -1; i <= 1; i++) dot(c, i * 4.4, -0.4, 0.9, shade(col, -0.5)); c.restore();
    c.beginPath(); c.moveTo(-15, -6); c.lineTo(25, -6); c.lineTo(28, 34); c.quadraticCurveTo(28, 40, 22, 40); c.lineTo(-12, 40); c.quadraticCurveTo(-18, 40, -18, 34); c.closePath(); F(c, col);
    Rn(c, -17.4, 4, 44.6, 3, 0, alpha('#000000', 0.12)); Rn(c, -17.8, 30, 45.6, 3, 0, alpha('#000000', 0.12));
    E(c, 5, -6, 20, 4.6, shade(col, 0.2)); E(c, 5, -5.6, 16, 3, shade(col, -0.45));
    K.flower(c, 6, 18, 8, p.paper, p.gold, 0.3 + Math.sin(t) * 0.05); L(c, -12.5, 0, -14.5, 30, 2.2, alpha('#ffffff', 0.4));
  });

  Art.add('prop', 'wheelbarrow', function (c, t, p, o) {
    var col = p.accent, i, fl = [[-18, -22, p.gold], [-4, -29, p.paper], [10, -23, shade(p.accent, 0.5)], [22, -17, p.gold], [-28, -14, p.paper]];
    ground(c, 42, 44);
    c.beginPath(); c.moveTo(-30, 30); c.lineTo(-6, 20); c.lineTo(48, -8); st(c, 4, mix(WOOD, p.gold, 0.1));
    c.beginPath(); c.moveTo(12, 16); c.lineTo(16, 40); c.lineTo(25, 40); st(c, 3, IRON);
    c.beginPath(); c.moveTo(42, -5); c.lineTo(49, -8.5); st(c, 5.6, IRON);
    E(c, 0, -9, 30, 7, '#6b4a34');
    for (i = 0; i < 5; i++) { var sy = Math.sin(t * 1.2 + i) * 0.8; L(c, fl[i][0] * 0.8, -8, fl[i][0], fl[i][1] + sy, 1.5, GRD); K.leaf(c, fl[i][0] * 0.9, (fl[i][1] - 8) / 2, 8, i % 2 ? -0.6 : -2.5, GR); }
    for (i = 0; i < 5; i++) K.flower(c, fl[i][0], fl[i][1] + Math.sin(t * 1.2 + i) * 0.8, i % 2 ? 6.4 : 5.6, fl[i][2], i % 2 ? p.gold : '#fff3c4', i);
    c.beginPath(); c.moveTo(-38, -11); c.lineTo(34, -11); c.lineTo(22, 16); c.quadraticCurveTo(20, 20, 15, 20); c.lineTo(-18, 20); c.quadraticCurveTo(-24, 20, -26, 15); c.closePath(); F(c, col);
    R(c, -40, -13, 76, 5, 2.5, shade(col, 0.2)); L(c, -29, -4, -22, 12, 2.2, alpha('#ffffff', 0.35));
    c.beginPath(); c.moveTo(-10, 19); c.lineTo(20, 4); c.lineWidth = 1; c.strokeStyle = alpha('#000000', 0.12); c.stroke();
    c.save(); c.translate(-29, 30); c.rotate(t * 0.0); K.wheel(c, 0, 0, 11.5, shade(col, -0.1)); c.restore();
  });

  Art.add('prop', 'birdhouse', function (c, t, p, o) {
    var w = mix(p.paper, '#e9cfa2', 0.35), rf = p.accent, bob = Math.sin(t * 2.4) * 0.8, i;
    R(c, -4, 24, 8, 26, 1.5, WOOD); L(c, -1.4, 28, -1.4, 48, 0.9, shade(WOOD, -0.2));
    K.leaf(c, 3, 40, 13, -0.5, GR); K.leaf(c, -3, 44, 12, -2.6, GRD);
    R(c, -27, 21, 54, 6, 2, shade(WOOD, 0.12));
    Pg(c, [[-22, 22], [-22, -14], [0, -34], [22, -14], [22, 22]], w);
    for (i = 0; i < 3; i++) L(c, -21, -6 + i * 10, 21, -6 + i * 10, 0.8, shade(w, -0.14));
    c.beginPath(); c.arc(0, -3, 10.5, 0, TAU); F(c, mix('#3a2a2a', p.ink, 0.4));
    c.save(); c.beginPath(); c.arc(0, -3, 10.5, 0, TAU); c.clip(); /* a little bird looking out */
    E(c, 1, 2 + bob, 8.4, 8.4, p.accent2); E(c, 2, 7 + bob, 5.4, 4.6, shade(p.accent2, 0.45)); Pg(c, [[7, -0.6 + bob], [12.4, 1.4 + bob], [7, 3.2 + bob]], p.gold); dot(c, 3.4, -1.4 + bob, 1.4, '#2b2118'); dot(c, 3.9, -1.9 + bob, 0.5, '#ffffff');
    c.restore();
    c.beginPath(); c.arc(0, -3, 10.5, 0, TAU); c.lineWidth = 2; c.strokeStyle = shade(w, -0.3); c.stroke();
    L(c, 0, 13, 0, 13, 4.6, shade(WOOD, -0.34)); L(c, 0, 13, 0, 13, 3, WOOD); R(c, -1.6, 11.4, 3.2, 3.2, 1.6, shade(WOOD, 0.2));
    c.beginPath(); c.moveTo(-31, -9); c.lineTo(0, -39); c.lineTo(31, -9); st(c, 7.5, rf);
    c.beginPath(); c.moveTo(-28, -10.5); c.lineTo(0, -37); c.lineWidth = 1.3; c.strokeStyle = alpha('#ffffff', 0.4); c.stroke();
    K.heartPath(c, 0, -21, 6.5); c.fillStyle = rf; c.fill();
    K.flower(c, -15, 16, 3.6, p.gold, p.paper, 0.4); K.flower(c, 15, 16, 3.6, p.gold, p.paper, 1.1);
  });

  Art.add('prop', 'beehive', function (c, t, p, o) {
    var st0 = mix('#eec35a', p.gold, 0.5), i, ws = [25, 44, 56, 64, 66], y = -34;
    ground(c, 43, 44); R(c, -40, 34, 80, 6.5, 2.5, WOOD); R(c, -30, 39.5, 8, 6, 1.5, shade(WOOD, -0.14)); R(c, 22, 39.5, 8, 6, 1.5, shade(WOOD, -0.14));
    E(c, 0, -37, 6, 4.4, shade(st0, -0.1));
    for (i = 0; i < 5; i++) { var h = 14.4; R(c, -ws[i] / 2, y, ws[i], h, 7, i % 2 ? shade(st0, -0.08) : st0); L(c, -ws[i] / 2 + 6, y + 3.6, -ws[i] / 2 + 6 + ws[i] * 0.3, y + 3.6, 1.6, alpha('#ffffff', 0.45)); y += 13.6; }
    c.beginPath(); c.moveTo(-9, 34); c.lineTo(-9, 24); c.arc(0, 24, 9, PI, 0); c.lineTo(9, 34); c.closePath(); F(c, mix('#3a2a2a', p.ink, 0.4));
    for (i = 0; i < 3; i++) { /* bees going round */
      var a = t * (1.1 + i * 0.25) + i * 2.1, bx = Math.cos(a) * (34 + i * 5), by = [-22, 2, -34][i] + Math.sin(a * 2) * 7, dir = -Math.sin(a) >= 0 ? 1 : -1, fl = Math.sin(t * 30 + i) * 0.4;
      c.save(); c.translate(bx, by); c.scale(dir, 1);
      c.beginPath(); c.ellipse(-1, -4, 2.6, 4.4, -0.5 + fl, 0, TAU); c.fillStyle = alpha('#ffffff', 0.8); c.fill(); c.beginPath(); c.ellipse(2, -4.4, 2.6, 4.4, 0.3 + fl, 0, TAU); c.fill();
      E(c, 0, 0, 5.4, 3.8, '#ffd23f'); c.save(); c.beginPath(); c.ellipse(0, 0, 5.4, 3.8, 0, 0, TAU); c.clip(); Rn(c, -2.6, -4, 1.8, 8, 0, '#3a2a22'); Rn(c, 0.6, -4, 1.8, 8, 0, '#3a2a22'); c.restore(); dot(c, 4, -0.6, 0.8, '#3a2a22');
      c.restore();
    }
    K.flower(c, -41, 28, 4.4, p.paper, p.gold, 0.3); K.flower(c, 42, 29, 4, shade(p.accent, 0.5), p.gold, 1); tuft(c, -44, 44, 6, GR); tuft(c, 45, 44, 6, GR);
  });

  function mush(c, x, y, s, col, spot, lean) {
    c.save(); c.translate(x, y); c.rotate(lean); c.scale(s, s);
    c.beginPath(); c.moveTo(-9, -30); c.quadraticCurveTo(-8, -6, -13, 0); c.quadraticCurveTo(0, 5, 13, 0); c.quadraticCurveTo(8, -6, 9, -30); c.closePath(); F(c, '#f6ead2');
    c.beginPath(); c.moveTo(-9.4, -22); c.quadraticCurveTo(0, -14, 9.4, -22); c.lineTo(11, -17); c.quadraticCurveTo(0, -9, -11, -17); c.closePath(); F(c, '#fff8e8');
    E(c, 0, -31, 34, 7, '#f1dfc0');
    c.beginPath(); c.moveTo(-36, -31); c.bezierCurveTo(-36, -76, 36, -76, 36, -31); c.quadraticCurveTo(0, -22, -36, -31); c.closePath(); F(c, col);
    c.save(); c.clip(); c.beginPath(); c.ellipse(8, -34, 40, 34, 0, 0, TAU); c.rect(-50, -90, 100, 90); c.fillStyle = alpha('#000000', 0.08); c.fill('evenodd');
    E(c, -14, -50, 8, 6.4, spot, -0.4); E(c, 10, -57, 7, 5.6, spot, 0.2); E(c, 22, -40, 5.4, 4.4, spot, 0.5); E(c, -27, -35, 4.6, 3.8, spot, -0.6); E(c, 1, -39, 4.4, 3.6, spot); E(c, -3, -67, 4.6, 3, spot);
    c.restore(); c.restore();
  }
  Art.add('prop', 'mushroom', function (c, t, p, o) {
    var sw = Math.sin(t * 1.2) * 0.02;
    ground(c, 41, 42);
    mush(c, 27, 40, 0.48, shade(p.accent, -0.08), p.paper, 0.16 - sw); mush(c, -30, 41, 0.34, p.accent, p.paper, -0.2 + sw);
    mush(c, -3, 40, 1, p.accent, p.paper, sw);
    tuft(c, -17, 42, 9, GR); tuft(c, 13, 43, 8, GRD); tuft(c, 42, 42, 6, GR); tuft(c, -43, 42, 5, GRD);
    K.flower(c, 41, 30, 3.6, p.paper, p.gold, 0.4); K.twinkle(c, 30, -30, 3.4 + Math.sin(t * 2.4) * 1.4, alpha(p.snow, 0.9)); K.twinkle(c, -36, -10, 2.6 + Math.cos(t * 2.8) * 1.2, alpha(p.snow, 0.9));
  });

  /* ---------- kitchen and table ---------- */
  Art.add('prop', 'teaset', function (c, t, p, o) {
    var w = p.paper, a = p.accent, i;
    ground(c, 40, 46);
    c.save(); c.translate(-41, -18); c.rotate(-0.5); K.steam(c, 0, 0, 13, t, 2); c.restore();
    c.beginPath(); c.arc(15, 2, 13, -PI * 0.55, PI * 0.55); st(c, 4.6, w);
    c.beginPath(); c.moveTo(-27, 12); c.quadraticCurveTo(-38, 8, -40, -10); c.lineTo(-33, -12); c.quadraticCurveTo(-32, -2, -24, -2); c.closePath(); F(c, w);
    c.beginPath(); c.moveTo(-31, 4); c.bezierCurveTo(-31, -20, 21, -20, 21, 4); c.bezierCurveTo(21, 20, 10, 24, -5, 24); c.bezierCurveTo(-20, 24, -31, 20, -31, 4); c.closePath(); F(c, w);
    c.save(); c.clip(); Rn(c, -34, 12, 60, 3.4, 0, a); Rn(c, -34, 17.4, 60, 1.4, 0, p.gold); c.beginPath(); c.ellipse(4, 8, 30, 24, 0, 0, TAU); c.rect(-40, -30, 70, 60); c.fillStyle = alpha('#000000', 0.06); c.fill('evenodd'); c.restore();
    K.flower(c, -5, 0, 6.4, a, p.gold, 0.2); K.leaf(c, 2, 2, 8, 0.3, GR); K.leaf(c, -12, 2, 8, 2.8, GR);
    E(c, -5, -13.4, 15, 3.6, shade(w, -0.06)); E(c, -5, -17.4, 4, 3.6, a); R(c, -19, 22, 28, 4, 2, shade(w, -0.08));
    L(c, -25, -4, -27, 8, 2, alpha('#ffffff', 0.7));
    K.steam(c, 28, 8, 12, t + 1, 2); /* the cup */
    E(c, 28, 38, 19, 4.4, w); E(c, 28, 37.4, 12, 2.4, shade(w, -0.08));
    c.beginPath(); c.arc(41, 25, 5.4, -PI * 0.5, PI * 0.6); st(c, 2.6, w);
    c.beginPath(); c.moveTo(15, 17); c.lineTo(41, 17); c.quadraticCurveTo(41, 36, 28, 36); c.quadraticCurveTo(15, 36, 15, 17); c.closePath(); F(c, w);
    c.save(); c.clip(); Rn(c, 12, 26, 32, 2.6, 0, a); c.restore();
    E(c, 28, 17, 13, 3.4, shade(w, -0.04)); E(c, 28, 17.4, 10.6, 2.3, '#b8703a');
  });

  Art.add('prop', 'coffeecup', function (c, t, p, o) {
    var col = p.accent2, sa = shade(p.paper, -0.04), i, bn = '#6b3f26';
    ground(c, 40, 46); K.steam(c, 0, -22, 20, t, 3);
    E(c, 0, 33, 44, 8.6, sa); E(c, 0, 32, 30, 5, shade(sa, -0.1));
    c.beginPath(); c.arc(31, 6, 11, -PI * 0.55, PI * 0.6); st(c, 5.4, col);
    c.beginPath(); c.moveTo(-31, -10); c.lineTo(31, -10); c.bezierCurveTo(31, 14, 22, 31, 10, 31); c.lineTo(-10, 31); c.bezierCurveTo(-22, 31, -31, 14, -31, -10); c.closePath(); F(c, col);
    c.save(); c.clip(); c.beginPath(); c.ellipse(-8, -6, 32, 36, 0, 0, TAU); c.rect(-40, -20, 80, 60); c.fillStyle = alpha('#000000', 0.1); c.fill('evenodd'); Rn(c, -34, 8, 68, 2.4, 0, alpha(p.paper, 0.75)); c.restore();
    E(c, 0, -10, 31, 9.6, shade(col, 0.3)); E(c, 0, -9.4, 27, 7.6, '#8a5530');
    c.save(); c.translate(0, -9.4); c.scale(1, 0.3); c.beginPath(); c.arc(0, 0, 21, 0, TAU); c.lineWidth = 2.4; c.strokeStyle = alpha('#f6e3c4', 0.5); c.stroke(); c.rotate(Math.sin(t * 0.6) * 0.06); K.heartPath(c, 0, 0, 26); c.fillStyle = '#f6e3c4'; c.fill(); K.heartPath(c, 0, 1, 13); c.fillStyle = '#b87a48'; c.fill(); c.restore();
    L(c, -25, 0, -19, 20, 2.4, alpha('#ffffff', 0.4));
    for (i = 0; i < 2; i++) { c.save(); c.translate(-34 + i * 9, 36 + i * 3); c.rotate(0.5 - i * 1.2); E(c, 0, 0, 4.6, 3.2, bn); curve(c, -3.4, 0, 0, 1.4, 3.4, 0); c.lineWidth = 0.8; c.strokeStyle = shade(bn, 0.35); c.stroke(); c.restore(); }
  });

  Art.add('prop', 'croissant', function (c, t, p, o) {
    var col = '#e2a24c', i, j, order = [-3, 3, -2, 2, -1, 1, 0], pl = shade(p.paper, -0.03);
    ground(c, 37, 46); E(c, 0, 26, 46, 10.5, pl); E(c, 0, 25, 34, 6.6, shade(pl, -0.08));
    c.beginPath(); c.ellipse(0, 25, 44, 9, 0, PI * 0.1, PI * 0.5); c.lineWidth = 1.6; c.strokeStyle = p.accent; c.stroke();
    c.save(); c.translate(0, -2 + Math.sin(t * 1.5) * 0.4);
    for (i = 0; i < 7; i++) {
      j = order[i]; var a = j * 0.27, m = Math.abs(j), x = j * 11.6 - j * m * 0.5, y = 6 + m * m * 2.3, rx = 9.6 - m * 0.5, ry = 16.5 - m * 3.7, cc = m % 2 ? shade(col, -0.08) : col;
      c.save(); c.translate(x, y); c.rotate(a);
      { E(c, 0, 0, rx, ry, cc); c.beginPath(); c.ellipse(-rx * 0.2, -ry * 0.2, rx * 0.42, ry * 0.6, 0, PI * 1.05, PI * 1.6); c.lineWidth = 2; c.lineCap = 'round'; c.strokeStyle = alpha('#fff0c0', 0.75); c.stroke(); c.beginPath(); c.ellipse(0, 0, rx * 0.8, ry * 0.86, 0, PI * 0.1, PI * 0.5); c.lineWidth = 1.4; c.strokeStyle = alpha('#8a4a18', 0.3); c.stroke(); }
      c.restore();
    }
    c.restore();
    dot(c, -30, 29, 1.2, shade(col, -0.1)); dot(c, 27, 30, 1, shade(col, -0.1)); dot(c, 12, 31.4, 1.2, col); dot(c, -14, 31, 0.9, col);
    c.save(); c.translate(-4, -30); K.steam(c, 0, 0, 11, t, 2); c.restore();
  });

  Art.add('prop', 'breadbasket', function (c, t, p, o) {
    var bk = '#cf9f5e', br = '#dba050', i, j;
    ground(c, 41, 44);
    c.save(); c.translate(8, 0); c.rotate(0.5); R(c, -8, -50, 16, 60, 8, br); for (i = 0; i < 4; i++) { curve(c, -4.6, -40 + i * 10, 0, -40 + i * 10, 4.6, -34 + i * 10); c.lineWidth = 2; c.lineCap = 'round'; c.strokeStyle = '#f6dfae'; c.stroke(); } L(c, -5, -42, -5, -6, 1.4, alpha('#ffffff', 0.3)); c.restore();
    c.save(); c.translate(-22, -4); c.rotate(-0.42); R(c, -7, -34, 14, 44, 7, shade(br, -0.07)); for (i = 0; i < 3; i++) { curve(c, 4, -26 + i * 10, 0, -26 + i * 10, -4, -20 + i * 10); c.lineWidth = 1.8; c.strokeStyle = '#f6dfae'; c.stroke(); } c.restore();
    E(c, -8, -4, 19, 15, shade(br, -0.12)); for (i = -1; i <= 1; i++) { curve(c, -14 + i * 7, -13, -8 + i * 7, -10, -6 + i * 7, -3); c.lineWidth = 1.8; c.strokeStyle = '#f6dfae'; c.stroke(); }
    E(c, 23, -1, 11, 9.4, br); L(c, 19, -5, 27, -3, 1.6, '#f6dfae'); dot(c, -19, -10, 0.8, '#fff3d0'); dot(c, -2, -14, 0.8, '#fff3d0');
    Pg(c, [[-37, 4], [37, 4], [29, 39], [-29, 39]], bk);
    c.save(); c.clip();
    for (j = 0; j < 5; j++) for (i = -4; i < 5; i++) { var x = i * 9.4 + (j % 2 ? 4.7 : 0); Rn(c, x - 4.2, 6 + j * 7, 8.4, 5.6, 2.4, (i + j) % 2 ? shade(bk, 0.16) : shade(bk, -0.14)); }
    c.restore();
    Pg(c, [[-12, 3], [18, 3], [12, 24], [3, 30], [-5, 23]], p.accent); c.save(); Pg(c, [[-12, 3], [18, 3], [12, 24], [3, 30], [-5, 23]], p.accent, true); c.clip(); for (i = -2; i < 5; i++) { Rn(c, -14 + i * 8, 0, 2.6, 34, 0, alpha(p.paper, 0.7)); Rn(c, -14, 4 + i * 8, 36, 2.6, 0, alpha(p.paper, 0.5)); } c.restore();
    R(c, -40, 0, 80, 8, 4, shade(bk, 0.1)); for (i = -4; i <= 4; i++) L(c, i * 8.6 - 2, 1.6, i * 8.6 + 2, 6.4, 1.1, shade(bk, -0.22));
    Pg(c, [[-12, 6.6], [18, 6.6], [17.4, 9.4], [-11.4, 9.4]], shade(p.accent, -0.12), true);
  });

  Art.add('prop', 'rollingpin', function (c, t, p, o) {
    var dg = '#f4e3bd', wd = mix('#dcb27a', p.gold, 0.12), i, R0 = rnd('flour'), rk = Math.sin(t * 1.6) * 3;
    ground(c, 38, 46);
    for (i = 0; i < 14; i++) dot(c, -46 + R0() * 92, 22 + R0() * 18, 0.7 + R0() * 1.2, alpha(p.snow, 0.75));
    c.beginPath(); c.moveTo(-40, 20); c.bezierCurveTo(-44, 4, -12, 0, 6, 2); c.bezierCurveTo(30, 0, 46, 10, 42, 22); c.bezierCurveTo(40, 36, 10, 38, -8, 37); c.bezierCurveTo(-26, 38, -38, 32, -40, 20); c.closePath(); F(c, dg);
    c.beginPath(); c.ellipse(0, 17, 34, 11, 0, PI * 1.05, PI * 1.6); c.lineWidth = 2; c.strokeStyle = alpha('#ffffff', 0.6); c.stroke();
    K.starPath(c, -20, 22, 7, 3.2, 5, 0.2); F(c, shade(dg, -0.16)); K.heartPath(c, 24, 24, 11); F(c, shade(dg, -0.16)); c.beginPath(); c.arc(2, 28, 5, 0, TAU); F(c, shade(dg, -0.16));
    c.save(); c.translate(rk, -12); c.rotate(-0.3);
    R(c, -47, -4, 16, 8, 4, p.accent); R(c, 31, -4, 16, 8, 4, p.accent); R(c, -33, -2.6, 5, 5.2, 1, shade(wd, -0.2)); R(c, 28, -2.6, 5, 5.2, 1, shade(wd, -0.2));
    R(c, -30, -10.5, 60, 21, 8, wd); L(c, -23, -6, 23, -6, 2.4, alpha('#ffffff', 0.5)); L(c, -22, 6.4, 22, 6.4, 1.6, alpha('#000000', 0.1));
    curve(c, -8, 0, 0, -3, 9, 0); c.lineWidth = 0.9; c.strokeStyle = shade(wd, -0.2); c.stroke(); curve(c, -16, 3, -10, 1.4, -5, 3); c.stroke();
    c.restore();
  });

  /* ---------- music and moving ---------- */
  Art.add('prop', 'recordplayer', function (c, t, p, o) {
    var base = mix(WOOD, p.accent, 0.3), top = shade(p.paper, -0.05), i, a = t * 2.2, k = Math.exp(-5 * o.beat);
    ground(c, 41, 44); R(c, -42, -30, 84, 70, 8, base); R(c, -38, -34, 76, 66, 7, top); Rn(c, -36, 27, 72, 2.4, 1.2, alpha('#000000', 0.08));
    c.beginPath(); c.arc(-8, -2, 27.5, 0, TAU); F(c, shade(p.ink, 0.25)); c.beginPath(); c.arc(-8, -2, 25.6, 0, TAU); F(c, '#24222a');
    for (i = 0; i < 4; i++) { c.beginPath(); c.arc(-8, -2, 12.6 + i * 3.4, 0, TAU); c.lineWidth = 0.6; c.strokeStyle = alpha('#ffffff', 0.13); c.stroke(); }
    for (i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-8, -2); c.arc(-8, -2, 25.2, a + i * PI - 0.22, a + i * PI + 0.22); c.closePath(); c.fillStyle = alpha('#ffffff', 0.13); c.fill(); }
    c.beginPath(); c.arc(-8, -2, 9.4, 0, TAU); F(c, p.accent); c.save(); c.translate(-8, -2); c.rotate(a); K.starPath(c, 0, -5, 2.6, 1.1, 5, 0); c.fillStyle = p.gold; c.fill(); Rn(c, -4.4, 3, 8.8, 1.3, 0.6, alpha(p.paper, 0.8)); c.restore(); dot(c, -8, -2, 1.5, p.paper);
    c.beginPath(); c.arc(27, -22, 6.4, 0, TAU); F(c, shade(top, -0.2)); /* the arm */
    c.save(); c.translate(27, -22); c.rotate(0.3 + Math.sin(t * 0.5) * 0.03);
    c.beginPath(); c.moveTo(0, -5); c.lineTo(0, 24); c.lineTo(-7, 33); st(c, 2.6, '#c9ccd4'); R(c, -11, 29, 8, 9.6, 1.6, IRON); R(c, -3, -9, 6, 8, 1.6, IRON); c.restore(); dot(c, 27, -22, 2.4, p.gold);
    c.beginPath(); c.arc(29, 22, 4.4, 0, TAU); F(c, p.gold); L(c, 29, 22, 31, 19.4, 1, shade(p.gold, -0.4)); c.beginPath(); c.arc(18, 24, 2.6, 0, TAU); F(c, p.accent2);
    dot(c, 29, 10.6, 1.4 + k * 0.7, k > 0.35 ? '#ff5a5f' : '#b84a4f');
    for (i = 0; i < 2; i++) { var f = frac(t * 0.3 + i * 0.5), nx = -34 + i * 10 + Math.sin(t * 2 + i) * 2, ny = -34 - f * 12; c.globalAlpha = (1 - f) * 0.9; dot(c, nx, ny, 2.2, p.snow); L(c, nx + 1.8, ny, nx + 1.8, ny - 7, 1, p.snow); L(c, nx + 1.8, ny - 7, nx + 5, ny - 5.6, 1.4, p.snow); c.globalAlpha = 1; }
  });

  Art.add('prop', 'dumbbell', function (c, t, p, o) {
    var col = p.accent2, d = shade(col, -0.2), k = Math.exp(-5 * o.beat), i, s, mt = '#b9bdc8';
    c.beginPath(); c.ellipse(0, 36, 40 - k * 3, 4.4, 0, 0, TAU); c.fillStyle = SHADOW; c.fill();
    c.save(); c.translate(0, 2 - k * 3); c.rotate(-0.22);
    R(c, -24, -4.4, 48, 8.8, 2, mt); for (i = -4; i <= 4; i++) L(c, i * 3 - 1.4, -3, i * 3 + 1.4, 3, 0.7, shade(mt, -0.3)); L(c, -22, -2.4, 22, -2.4, 1.1, alpha('#ffffff', 0.7));
    for (s = -1; s <= 1; s += 2) {
      R(c, s * 41 - 3.5, -5, 7, 10, 2, shade(mt, -0.12));
      R(c, s * 35 - 4.5, -15, 9, 30, 3.4, d); R(c, s * 26 - 5.5, -23, 11, 46, 4.4, col);
      L(c, s * 26 - 2.4, -17, s * 26 - 2.4, 12, 2, alpha('#ffffff', 0.4)); L(c, s * 35 - 2, -10, s * 35 - 2, 4, 1.4, alpha('#ffffff', 0.25));
      R(c, s * 19 - 2, -7, 4, 14, 1.6, shade(mt, -0.2));
    }
    c.restore();
    K.twinkle(c, 36, -28, 4 + Math.sin(t * 3) * 1.8, p.snow); K.twinkle(c, -38, -8, 3 + Math.cos(t * 3.4) * 1.4, p.snow);
    for (i = 0; i < 2; i++) L(c, -6 + i * 12, -34 - k * 4, -8 + i * 16, -40 - k * 5, 1.6, alpha(p.snow, 0.35 + k * 0.6));
  });

  function shoe(c, x, y, rot, col, p) {
    var i; c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.moveTo(-29, 9); c.lineTo(-30, -9); c.quadraticCurveTo(-25, -19, -17, -12); c.quadraticCurveTo(-12, -9, -7, -14); c.lineTo(-1, -21); c.quadraticCurveTo(3, -22, 4, -17); c.quadraticCurveTo(12, -5, 26, -2); c.quadraticCurveTo(33, 1, 32, 9); c.closePath(); F(c, col);
    c.save(); c.clip(); c.beginPath(); c.ellipse(27, 8, 13, 11, 0, 0, TAU); F(c, p.paper); c.beginPath(); c.ellipse(-31, 0, 8, 13, 0, 0, TAU); F(c, shade(col, -0.18)); Rn(c, -10, 0, 30, 2.4, 0, alpha('#000000', 0.08)); c.restore();
    c.beginPath(); c.moveTo(-7, -14); c.quadraticCurveTo(-1, -4, 12, 0); c.lineWidth = 1; c.strokeStyle = shade(col, -0.3); c.stroke();
    for (i = 0; i < 4; i++) L(c, -3 + i * 4.4, -15 + i * 3.6, 3 + i * 3.6, -9.4 + i * 3, 1.5, p.paper);
    c.beginPath(); c.moveTo(-3, -17); c.quadraticCurveTo(-10, -24, -5, -27); c.quadraticCurveTo(-1, -24, -1, -18); c.lineWidth = 1.3; c.strokeStyle = p.paper; c.stroke();
    c.beginPath(); c.arc(-10, 0, 4.4, 0, TAU); F(c, p.gold);
    R(c, -31, 7, 65, 8.4, 4.2, p.paper); Rn(c, -29, 12, 61, 2, 1, alpha('#000000', 0.12)); for (i = 0; i < 5; i++) L(c, 14 + i * 3.4, 9, 14 + i * 3.4, 11, 0.8, shade(p.paper, -0.25));
    c.restore();
  }
  Art.add('prop', 'sneakers', function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), tap = o.n % 2 ? k : 0, tap2 = o.n % 2 ? 0 : k;
    ground(c, 40, 46);
    shoe(c, -9 + 0, -12 - tap2 * 3, -0.1 - tap2 * 0.16, shade(p.accent, -0.1), p);
    c.beginPath(); c.ellipse(8, 37, 36, 3.4, 0, 0, TAU); c.fillStyle = SHADOW; c.fill();
    shoe(c, 8, 22 - tap * 3, -tap * 0.18, p.accent, p);
    K.twinkle(c, 40, -6, 3.4 + Math.sin(t * 3) * 1.4, p.snow); K.twinkle(c, -40, 14, 2.6 + Math.cos(t * 3.3) * 1.2, p.snow);
  });
});
