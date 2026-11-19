/* Send a Carol art pack: journey props (travel, school, getting well, the outdoors). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var SHADOW = 'rgba(0,0,0,0.14)', TYRE = '#2a2a30', WOOD = '#b98a5a', STEEL = '#cfd5dc', GLASS = '#bfe6f7', LEAFG = '#57b36f';

  /* the current path as a tube: a dark outline under a coloured line */
  function tube(c, w, col) { c.lineCap = 'round'; c.lineJoin = 'round'; if (K.ow() > 0) { c.lineWidth = w + K.ow() * 1.7; c.strokeStyle = shade(col, -0.34); c.stroke(); } c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  function pulse(o) { return Math.exp(-5 * o.beat); }
  function star(c, x, y, r, col, rot) { K.starPath(c, x, y, r, r * 0.45, 5, rot || 0); c.fillStyle = col; c.fill(); }
  function heart(c, x, y, s, col, plain) { K.heartPath(c, x, y, s); if (plain) { c.fillStyle = col; c.fill(); } else F(c, col); }
  function grass(c, x, y, w, col) { for (var i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * w * 0.2 - w * 0.07, y); c.quadraticCurveTo(x + i * w * 0.24, y - w * 0.3, x + i * w * 0.32, y - w * (0.42 - Math.abs(i) * 0.07)); c.quadraticCurveTo(x + i * w * 0.24, y - w * 0.14, x + i * w * 0.2 + w * 0.07, y); c.closePath(); c.fillStyle = col; c.fill(); } }
  function wheel2(c, x, y, r, hub, a) { K.wheel(c, x, y, r, hub); for (var i = 0; i < 3; i++) L(c, x, y, x + Math.cos(a + i * 2.094) * r * 0.4, y + Math.sin(a + i * 2.094) * r * 0.4, r * 0.1, '#f3ece0'); }

  /* ---------- travel ---------- */
  Art.add('prop', 'suitcase', function (c, t, p, o) {
    var k = pulse(o), col = p.accent, dk = shade(col, -0.2), st = mix(p.gold, '#8a5a2e', 0.45), i, sw = Math.sin(t * 2.2) * 0.25;
    E(c, 0, 43, 36, 4, SHADOW);
    c.save(); c.translate(0, 42); c.rotate(Math.sin(t * 1.6) * 0.022); c.translate(0, -42 - k * 1.6);
    c.beginPath(); c.moveTo(-11, -22); c.lineTo(-11, -41); c.quadraticCurveTo(-11, -46, -6, -46); c.lineTo(6, -46); c.quadraticCurveTo(11, -46, 11, -41); c.lineTo(11, -22); tube(c, 3.2, STEEL);
    R(c, -8, -48.5, 16, 5.5, 2.6, '#3b3340');
    for (i = -1; i <= 1; i += 2) { E(c, i * 22, 38.5, 4.6, 4.6, TYRE); dot(c, i * 22, 38.5, 1.8, STEEL); }
    R(c, -34, -25, 68, 61, 10, col);
    c.save(); K.rrp(c, -34, -25, 68, 61, 10); c.clip();
    Rn(c, -34, 22, 68, 14, 0, dk); Rn(c, -34, -25, 68, 6, 0, shade(col, 0.16));
    for (i = -1; i <= 1; i += 2) { Rn(c, i * 20 - 3.6, -25, 7.2, 61, 0, st); Rn(c, i * 20 - 3.6, -25, 2, 61, 0, shade(st, 0.2)); }
    c.restore();
    K.rrp(c, -34, -25, 68, 61, 10); c.lineWidth = K.ow(); c.strokeStyle = shade(col, -0.34); c.stroke();
    for (i = -1; i <= 1; i += 2) { R(c, i * 20 - 5.4, -2, 10.8, 8.4, 2, p.gold); Rn(c, i * 20 - 2.2, 0.4, 4.4, 3.6, 1, shade(p.gold, -0.3)); }
    for (i = 0; i < 4; i++) { var cx = i % 2 ? 29 : -29, cy = i < 2 ? -20 : 31; c.beginPath(); c.arc(cx, cy, 4.4, 0, TAU); c.fillStyle = shade(p.gold, -0.1); c.fill(); dot(c, cx - 0.8, cy - 0.8, 1.6, shade(p.gold, 0.4)); }
    /* stickers from the road */
    c.save(); c.translate(-2, -11); c.rotate(-0.2); E(c, 0, 0, 8.6, 8.6, p.accent2); star(c, 0, 0.3, 5.6, p.paper, 0.2); c.restore();
    c.save(); c.translate(3, 12); c.rotate(0.14); R(c, -11, -6.5, 22, 13, 2, p.paper); Rn(c, -11, -6.5, 22, 4, 1.5, '#58b4ff'); dot(c, 5, -0.5, 2.6, p.gold); Pg(c, [[-9, 6], [-4, -1], [0, 4], [3, 0.5], [8, 6]], LEAFG, true); c.restore();
    c.save(); c.translate(-9, 2); c.rotate(-0.3); heart(c, 0, 0, 7.5, p.paper, true); c.restore();
    L(c, -29, -15, -29, 8, 2, 'rgba(255,255,255,0.4)');
    /* the luggage tag swings */
    c.save(); c.translate(11, -30); c.rotate(-0.25 + sw); L(c, 0, 0, 0, 7, 0.9, '#7a6a5a'); c.beginPath(); c.moveTo(-4.4, 9.5); c.lineTo(0, 5.6); c.lineTo(4.4, 9.5); c.lineTo(4.4, 19); c.lineTo(-4.4, 19); c.closePath(); F(c, p.paper); dot(c, 0, 9.4, 1.1, '#7a6a5a'); L(c, -2.4, 13, 2.4, 13, 0.8, shade(p.paper, -0.3)); L(c, -2.4, 15.6, 1.4, 15.6, 0.8, shade(p.paper, -0.3)); c.restore();
    c.restore();
  });

  Art.add('prop', 'passport', function (c, t, p, o) {
    var cov = mix(p.accent2, '#1d3557', 0.45), g = p.gold, i, k = pulse(o);
    E(c, 0, 43, 32, 3.6, SHADOW);
    c.save(); c.rotate(-0.1 + Math.sin(t * 1.5) * 0.025);
    /* the boarding pass tucked inside */
    c.save(); c.translate(14, -18 - k * 1.5); c.rotate(0.24); R(c, -15, -30, 30, 52, 3, p.paper); Rn(c, -15, -30, 30, 9, 2, p.accent);
    c.setLineDash([1.6, 1.8]); c.lineCap = 'butt'; c.beginPath(); c.moveTo(-15, -8); c.lineTo(15, -8); c.lineWidth = 0.8; c.strokeStyle = shade(p.paper, -0.35); c.stroke(); c.setLineDash([]);
    for (i = 0; i < 3; i++) L(c, -10, -17 + i * 3.4, 4 - i * 4, -17 + i * 3.4, 1.1, shade(p.paper, -0.3));
    Pg(c, [[9, -25.5], [3, -23], [5, -25.5], [3, -28]], p.paper, true); c.restore();
    R(c, -29, -38, 56, 78, 5, shade(cov, -0.25)); R(c, -27, -39, 55, 78, 4.5, p.paper); R(c, -30, -40, 56, 78, 5, cov);
    Rn(c, -30, -40, 5, 78, 2.5, shade(cov, -0.2));
    c.lineWidth = 0.9; c.strokeStyle = alpha(g, 0.75); K.rrp(c, -21.5, -35.5, 43, 69, 3); c.stroke();
    /* a globe mark */
    c.beginPath(); c.arc(0, -8, 15, 0, TAU); c.fillStyle = g; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = cov; c.lineCap = 'round';
    c.beginPath(); c.ellipse(0, -8, 6.4, 15, 0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(0, -23); c.lineTo(0, 7); c.moveTo(-15, -8); c.lineTo(15, -8); c.stroke();
    c.beginPath(); c.moveTo(-12.6, -16); c.quadraticCurveTo(0, -12.6, 12.6, -16); c.moveTo(-12.6, 0); c.quadraticCurveTo(0, -3.4, 12.6, 0); c.stroke();
    K.ringStroke(c, 0, -8, 15, 1.5, shade(g, -0.2));
    Rn(c, -15, 15, 30, 3.4, 1.7, g); Rn(c, -10, 21.5, 20, 2.6, 1.3, alpha(g, 0.8)); star(c, 0, 30.5, 3, g);
    star(c, -14, -29, 1.6, alpha(g, 0.9)); star(c, 14, -29, 1.6, alpha(g, 0.9));
    L(c, -20, -34, -20, -6, 1.6, 'rgba(255,255,255,0.22)');
    c.restore();
    K.twinkle(c, -33, -34, 3.6 + Math.sin(t * 3.4) * 1.6, p.gold);
  });

  Art.add('prop', 'campervan', function (c, t, p, o) {
    var k = pulse(o), col = p.accent, top = p.paper, i, by = -k * 1.6 + Math.sin(t * 7) * 0.35, wa = t * 3;
    E(c, 0, 37, 46, 4.4, SHADOW);
    for (i = 0; i < 3; i++) { var f = frac(t * 0.9 + i / 3); dot(c, -48 - f * 9, 29 - f * 6, 2 + f * 3, 'rgba(255,255,255,' + (0.5 * (1 - f)).toFixed(3) + ')'); }
    c.save(); c.translate(0, by);
    /* roof rack: a board and a bag */
    L(c, -22, -29, -22, -34, 1.4, '#6b4a2e'); L(c, 14, -29, 14, -34, 1.4, '#6b4a2e');
    c.beginPath(); c.moveTo(-34, -35); c.quadraticCurveTo(-4, -43, 24, -35); c.quadraticCurveTo(-4, -32.6, -34, -35); c.closePath(); F(c, p.gold); L(c, -24, -36, 14, -36.6, 1.1, p.accent2);
    R(c, -6, -44.5, 18, 8, 3, p.accent2); L(c, 3, -44.5, 3, -36.5, 1, shade(p.accent2, -0.3));
    /* body */
    c.beginPath(); c.moveTo(-44, 24); c.lineTo(-44, -14); c.quadraticCurveTo(-44, -30, -28, -30); c.lineTo(22, -30); c.quadraticCurveTo(36, -30, 41, -12); c.lineTo(45, 4); c.quadraticCurveTo(46, 8, 46, 12); c.lineTo(46, 24); c.quadraticCurveTo(46, 28, 42, 28); c.lineTo(-40, 28); c.quadraticCurveTo(-44, 28, -44, 24); c.closePath(); F(c, top);
    c.save(); c.clip(); Rn(c, -50, 1, 100, 30, 0, col); Rn(c, -50, 1, 100, 2.6, 0, shade(col, 0.3)); Rn(c, -50, 21, 100, 9, 0, shade(col, -0.16)); c.restore();
    c.beginPath(); c.moveTo(-44, 24); c.lineTo(-44, -14); c.quadraticCurveTo(-44, -30, -28, -30); c.lineTo(22, -30); c.quadraticCurveTo(36, -30, 41, -12); c.lineTo(45, 4); c.quadraticCurveTo(46, 8, 46, 12); c.lineTo(46, 24); c.quadraticCurveTo(46, 28, 42, 28); c.lineTo(-40, 28); c.quadraticCurveTo(-44, 28, -44, 24); c.closePath(); c.lineWidth = K.ow(); c.strokeStyle = shade(col, -0.34); c.stroke();
    /* windows with little curtains */
    for (i = 0; i < 2; i++) { var wx = -37 + i * 22; R(c, wx, -23, 18, 19, 4, GLASS); Pg(c, [[wx + 1, -22], [wx + 7, -22], [wx + 1.4, -9]], p.accent2, true); Pg(c, [[wx + 17, -22], [wx + 11, -22], [wx + 16.6, -9]], p.accent2, true); L(c, wx + 3, -7, wx + 8, -20, 1.2, 'rgba(255,255,255,0.6)'); }
    c.beginPath(); c.moveTo(9, -23); c.lineTo(22, -23); c.quadraticCurveTo(30, -23, 34, -11); c.lineTo(36, -4); c.lineTo(9, -4); c.closePath(); F(c, GLASS); L(c, 13, -7, 19, -20, 1.4, 'rgba(255,255,255,0.6)');
    L(c, 6, -2, 6, 24, 0.8, shade(col, -0.3)); R(c, -2, 6, 6, 2.4, 1.2, STEEL);
    heart(c, -17, 12, 8, top, true);
    E(c, 43, 10, 3.2, 4.2, '#fff3b8'); dot(c, 43, 10, 6 + k * 2, 'rgba(255,240,170,0.3)'); R(c, 40, 22, 9, 4.4, 2, STEEL); R(c, -47, 22, 7, 4.4, 2, STEEL); Rn(c, -45.4, 8, 2.6, 5, 1, '#ff5a5f');
    c.restore();
    c.fillStyle = shade(col, -0.45); c.beginPath(); c.arc(-24, 28 + by, 12, PI, 0); c.fill(); c.beginPath(); c.arc(25, 28 + by, 12, PI, 0); c.fill();
    wheel2(c, -24, 30, 9.6, top, wa); wheel2(c, 25, 30, 9.6, top, wa + 1);
  });

  Art.add('prop', 'compass', function (c, t, p, o) {
    var g = p.gold, i, k = pulse(o), a = Math.sin(t * 1.3) * 0.5 + Math.sin(t * 3.1) * 0.12 + k * 0.1 - 0.5;
    E(c, 0, 44, 30, 3.6, SHADOW);
    c.beginPath(); c.arc(0, -41, 5.4, 0, TAU); tube(c, 2.6, g); R(c, -4.5, -39, 9, 6, 2, shade(g, -0.12));
    E(c, 0, 3, 39, 39, g); c.beginPath(); c.arc(0, 3, 35.6, 0, TAU); c.fillStyle = shade(g, -0.2); c.fill();
    c.beginPath(); c.arc(0, 3, 32, 0, TAU); c.fillStyle = p.paper; c.fill(); K.ringStroke(c, 0, 3, 32, 1, shade(g, -0.34));
    c.beginPath(); c.arc(0, 3, 24, 0, TAU); c.fillStyle = shade(p.paper, -0.07); c.fill();
    for (i = 0; i < 32; i++) { var an = i / 32 * TAU, r0 = i % 8 === 0 ? 24.5 : i % 4 === 0 ? 26.5 : 28.6; L(c, Math.cos(an) * r0, 3 + Math.sin(an) * r0, Math.cos(an) * 31, 3 + Math.sin(an) * 31, i % 4 === 0 ? 1.3 : 0.7, p.ink); }
    /* the wind rose */
    c.save(); c.translate(0, 3);
    for (i = 0; i < 4; i++) { c.save(); c.rotate(PI / 4 + i * PI / 2); Pg(c, [[0, -13], [2.6, 0], [-2.6, 0]], shade(p.paper, -0.25), true); c.restore(); }
    for (i = 0; i < 4; i++) { c.save(); c.rotate(i * PI / 2); Pg(c, [[0, -21], [3.6, 0], [0, 0]], p.accent2, true); Pg(c, [[0, -21], [-3.6, 0], [0, 0]], shade(p.accent2, 0.4), true); c.restore(); }
    star(c, 0, -27.2, 2.6, p.accent);
    /* the needle hunts for north */
    c.rotate(a); c.beginPath(); c.moveTo(0, -23); c.lineTo(4.6, 0); c.lineTo(-4.6, 0); c.closePath(); F(c, p.accent); c.beginPath(); c.moveTo(0, 23); c.lineTo(4.6, 0); c.lineTo(-4.6, 0); c.closePath(); F(c, '#f3f5f8');
    Pg(c, [[0, -23], [4.6, 0], [0, 0]], shade(p.accent, -0.2), true); dot(c, 0, 0, 3.6, g); dot(c, -0.8, -0.8, 1.4, shade(g, 0.5));
    c.restore();
    c.beginPath(); c.arc(0, 3, 28, PI * 1.08, PI * 1.42); c.lineWidth = 3.4; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.6)'; c.stroke();
    K.twinkle(c, 31, -29, 4.4 + Math.sin(t * 3) * 1.8, '#ffffff');
  });

  Art.add('prop', 'foldedmap', function (c, t, p, o) {
    var pa = p.paper, i, k = pulse(o), xs = [-44, -22, 0, 22, 44], yt = [-27, -33, -27, -33, -27], yb = [29, 23, 29, 23, 29];
    var land = mix(LEAFG, pa, 0.45), sea = mix('#58b4ff', pa, 0.4);
    E(c, 0, 36, 44, 4, SHADOW);
    c.save(); c.rotate(-0.05 + Math.sin(t * 1.4) * 0.02);
    for (i = 0; i < 4; i++) {
      var q = [[xs[i], yt[i]], [xs[i + 1], yt[i + 1]], [xs[i + 1], yb[i + 1]], [xs[i], yb[i]]];
      Pg(c, q, i % 2 ? shade(pa, -0.09) : pa);
      c.save(); c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.lineTo(q[2][0], q[2][1]); c.lineTo(q[3][0], q[3][1]); c.closePath(); c.clip();
      c.fillStyle = i % 2 ? shade(land, -0.08) : land; c.beginPath(); c.ellipse(-30, -14, 17, 12, 0.3, 0, TAU); c.fill(); c.beginPath(); c.ellipse(26, 14, 20, 12, -0.3, 0, TAU); c.fill(); c.beginPath(); c.ellipse(8, -26, 12, 7, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-46, 16); c.bezierCurveTo(-26, 4, -16, 26, 0, 10); c.bezierCurveTo(14, -4, 28, -4, 46, -18); c.lineWidth = 4.4; c.strokeStyle = i % 2 ? shade(sea, -0.08) : sea; c.stroke();
      c.strokeStyle = alpha(p.ink, 0.12); c.lineWidth = 0.5; for (var gx = -40; gx <= 40; gx += 10) { c.beginPath(); c.moveTo(gx, -36); c.lineTo(gx, 32); c.stroke(); } for (var gy = -30; gy <= 30; gy += 10) { c.beginPath(); c.moveTo(-46, gy); c.lineTo(46, gy); c.stroke(); }
      c.restore();
    }
    /* the route: dashes walk to the X */
    c.setLineDash([3, 3.4]); c.lineDashOffset = -t * 5; c.beginPath(); c.moveTo(-32, 14); c.bezierCurveTo(-20, -16, -4, 8, 8, -8); c.bezierCurveTo(16, -18, 24, -2, 31, -12); c.lineWidth = 1.8; c.lineCap = 'round'; c.strokeStyle = p.accent; c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    L(c, 28, -15, 34, -9, 2, p.accent); L(c, 34, -15, 28, -9, 2, p.accent);
    Pg(c, [[-11, -19], [-8, -25], [-5, -19]], shade(LEAFG, -0.2), true); Pg(c, [[-5, -18], [-1.5, -26], [2, -18]], shade(LEAFG, -0.3), true);
    /* the pin */
    var py = 14 - k * 3; E(c, -32, 15, 3.4, 1.2, 'rgba(0,0,0,0.2)');
    c.beginPath(); c.moveTo(-32, py); c.bezierCurveTo(-41, py - 9, -40, py - 20, -32, py - 20); c.bezierCurveTo(-24, py - 20, -23, py - 9, -32, py); c.closePath(); F(c, p.accent); dot(c, -32, py - 13, 2.8, pa);
    /* a little compass rose in the corner */
    c.save(); c.translate(33, 17); for (i = 0; i < 4; i++) { c.rotate(PI / 2); Pg(c, [[0, -6.5], [1.6, 0], [-1.6, 0]], i % 2 ? p.ink : p.accent2, true); } dot(c, 0, 0, 1.3, pa); c.restore();
    c.restore();
  });

  Art.add('prop', 'signpost', function (c, t, p, o) {
    var i, k = pulse(o), wd = WOOD, cols = [p.accent, p.gold, p.accent2];
    E(c, 0, 43, 26, 4, SHADOW);
    R(c, -4, -40, 8, 84, 2.5, wd); L(c, -1.6, -34, -1.6, 38, 1.1, shade(wd, 0.25)); L(c, 1.8, -10, 1.8, 0, 0.7, shade(wd, -0.25)); L(c, 1.4, 22, 1.4, 30, 0.7, shade(wd, -0.25));
    R(c, -5.5, -44, 11, 5.5, 2.4, shade(wd, -0.15));
    /* three blank arrows, each its own way */
    var ar = [[-1, -27, 0.07, 36], [1, -7, -0.06, 40], [-1, 13, -0.05, 31]];
    for (i = 0; i < 3; i++) {
      var s = ar[i][0], w = ar[i][3], h = 14.5; c.save(); c.translate(0, ar[i][1]); c.rotate(ar[i][2] + Math.sin(t * 1.5 + i * 2) * 0.012); c.scale(s, 1);
      c.beginPath(); c.moveTo(-9, -h / 2); c.lineTo(w - 8, -h / 2); c.lineTo(w + 2, 0); c.lineTo(w - 8, h / 2); c.lineTo(-9, h / 2); c.lineTo(-6, 0); c.closePath(); F(c, cols[i]);
      L(c, -4, -h / 2 + 2.6, w - 9, -h / 2 + 2.6, 1.2, shade(cols[i], 0.35)); L(c, -2, 3.4, w - 14, 3.4, 0.7, shade(cols[i], -0.18));
      dot(c, 0, -3, 1.3, shade(cols[i], -0.45)); dot(c, 0, 3, 1.3, shade(cols[i], -0.45));
      c.restore();
    }
    /* a bird keeps the lookout */
    var by = -49.5 - k * 1.8; c.save(); c.translate(1, by); c.rotate(Math.sin(t * 2.4) * 0.08);
    Pg(c, [[-7, 0], [-13, -3.4], [-12, 1.6]], shade(p.accent2, -0.15)); E(c, 0, 0, 7.4, 5.8, p.accent2); E(c, 0.6, 2, 4.6, 3, shade(p.accent2, 0.5)); E(c, 5.4, -4.4, 4.4, 4.2, p.accent2);
    Pg(c, [[9, -5], [13.2, -3.6], [9, -2.4]], p.gold); dot(c, 6.4, -5.2, 0.9, p.ink); c.beginPath(); c.moveTo(-5, -1.6); c.quadraticCurveTo(-1, -4.6, 2.4, -0.6); c.quadraticCurveTo(-1, 1.6, -5, -1.6); c.fillStyle = shade(p.accent2, -0.2); c.fill(); c.restore();
    grass(c, -9, 43.5, 15, LEAFG); grass(c, 9, 44, 12, shade(LEAFG, -0.12)); K.flower(c, -15, 38.5, 3.2, p.paper, p.gold, t * 0.3); K.flower(c, 15, 40, 2.6, p.accent, p.gold, 1);
  });

  Art.add('prop', 'carkey', function (c, t, p, o) {
    var i, k = pulse(o), fob = '#3b3340', sw = Math.sin(t * 2.4) * 0.16 + k * 0.08;
    E(c, 2, 43, 28, 3.4, SHADOW);
    c.save(); c.rotate(0.5 + Math.sin(t * 1.6) * 0.03);
    /* the blade */
    c.beginPath(); c.moveTo(-4.4, 2); c.lineTo(-4.4, 36); c.lineTo(0, 42); c.lineTo(4.4, 36); c.lineTo(4.4, 30); c.lineTo(7.4, 27); c.lineTo(4.4, 24); c.lineTo(4.4, 19); c.lineTo(7.4, 16); c.lineTo(4.4, 13); c.lineTo(4.4, 2); c.closePath(); F(c, STEEL);
    L(c, -1.2, 5, -1.2, 36, 1.3, shade(STEEL, -0.25)); L(c, -3, 5, -3, 34, 0.7, '#ffffff');
    /* the fob */
    R(c, -15, -34, 30, 40, 9, fob); Rn(c, -12.4, -31.4, 5, 30, 2.5, 'rgba(255,255,255,0.14)');
    E(c, 0, -22, 5.6, 5.6, p.accent); star(c, 0, -21.8, 3.6, p.paper);
    R(c, -7.5, -13, 15, 5.6, 2.8, '#6b6474'); R(c, -7.5, -5, 15, 5.6, 2.8, '#6b6474'); dot(c, 9.4, -29, 1.3, k > 0.5 ? '#ff5a5f' : '#8a4046');
    dot(c, 0, -30.4, 2.6, '#1c1820');
    c.restore();
    /* the ring and what hangs on it */
    c.save(); c.translate(-15, -27);
    c.beginPath(); c.arc(-9, -6, 12, 0, TAU); tube(c, 2, STEEL);
    c.save(); c.translate(-17, 2.6); c.rotate(0.3 + sw); L(c, 0, 0, 0, 9, 1, STEEL); c.translate(0, 19); heart(c, 0, 0, 20, p.accent); c.beginPath(); c.arc(-4, -3.4, 3.4, PI * 1.05, PI * 1.5); c.lineWidth = 1.5; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke(); c.restore();
    c.save(); c.translate(-6, 5.6); c.rotate(-0.25 + sw * 0.7); L(c, 0, 0, 0, 7, 1, STEEL); R(c, -5, 7, 10, 17, 2.6, p.gold); star(c, 0, 16, 3.4, p.paper); c.restore();
    c.restore();
    K.twinkle(c, 33, 22, 3.6 + Math.sin(t * 3.6) * 1.6, '#ffffff');
  });

  Art.add('prop', 'idcard', function (c, t, p, o) {
    var i, k = pulse(o), ln = shade(p.paper, -0.3), sw = Math.sin(t * 1.7) * 0.05;
    c.save(); c.translate(0, -48); c.rotate(sw); c.translate(0, 48);
    /* the lanyard */
    c.beginPath(); c.moveTo(-13, -52); c.lineTo(-2.6, -29); c.moveTo(13, -52); c.lineTo(2.6, -29); tube(c, 4.4, p.accent2);
    R(c, -4.6, -31, 9.2, 8, 2, STEEL); R(c, -3, -25, 6, 7, 1.5, shade(STEEL, -0.2));
    R(c, -27, -19, 54, 63, 5, p.paper);
    c.save(); K.rrp(c, -27, -19, 54, 63, 5); c.clip(); Rn(c, -27, -19, 54, 14, 0, p.accent); Rn(c, -27, -5, 54, 2, 0, p.gold); Rn(c, -27, 39, 54, 5, 0, shade(p.accent, 0.5)); c.restore();
    Rn(c, -6, -22, 12, 3.6, 1.8, shade(p.paper, -0.4));
    star(c, -19, -12, 3.6, p.paper); Rn(c, -12, -14, 26, 2.6, 1.3, alpha(p.paper, 0.9)); Rn(c, -12, -9.6, 16, 2, 1, alpha(p.paper, 0.6));
    /* a face shape, nobody in particular */
    R(c, -22, 1, 21, 26, 3, mix(p.accent2, p.paper, 0.6));
    c.save(); K.rrp(c, -22, 1, 21, 26, 3); c.clip(); c.fillStyle = mix(p.accent2, p.ink, 0.25); c.beginPath(); c.ellipse(-11.5, 28, 9.4, 9, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(-11.5, 11, 5.4, 0, TAU); c.fill(); c.restore();
    for (i = 0; i < 4; i++) Rn(c, 4, 3 + i * 6, [18, 14, 18, 9][i], 2.4, 1.2, i === 0 ? shade(p.paper, -0.5) : ln);
    for (i = 0; i < 12; i++) Rn(c, -21 + i * 2.6, 31, i % 3 === 1 ? 1.6 : 0.9, 5.4, 0, shade(p.paper, -0.6));
    E(c, 17, 33, 5, 5, p.gold); star(c, 17, 33.2, 3, shade(p.gold, 0.5));
    L(c, -24, 12, -24, 36, 1.2, 'rgba(255,255,255,0.7)');
    c.restore();
    K.twinkle(c, 31, -14, 3.4 + k * 2 + Math.sin(t * 3) * 1.2, p.gold);
  });

  Art.add('prop', 'littlecar', function (c, t, p, o) {
    var k = pulse(o), col = p.accent2, i, by = -k * 1.8 + Math.sin(t * 8) * 0.3, wa = t * 3.4;
    E(c, 0, 33, 44, 4.2, SHADOW);
    for (i = 0; i < 3; i++) { var f = frac(t * 1.1 + i / 3); dot(c, -46 - f * 9, 24 - f * 7, 2 + f * 3.2, 'rgba(255,255,255,' + (0.55 * (1 - f)).toFixed(3) + ')'); }
    c.save(); c.translate(0, by);
    /* a suitcase strapped on top */
    R(c, -13, -34, 24, 11, 3, p.accent); Rn(c, -6.6, -34, 2.6, 11, 0, p.gold); Rn(c, 2, -34, 2.6, 11, 0, p.gold); L(c, -18, -23, 16, -23, 1.6, '#6b4a2e');
    /* cabin and body: a round little runabout */
    c.beginPath(); c.moveTo(-25, -1); c.quadraticCurveTo(-21, -23, -4, -23); c.lineTo(5, -23); c.quadraticCurveTo(20, -23, 27, -1); c.closePath(); F(c, col);
    c.beginPath(); c.moveTo(-20, -2); c.quadraticCurveTo(-17, -19, -4, -19); c.lineTo(-1, -19); c.lineTo(-1, -2); c.closePath(); F(c, GLASS);
    c.beginPath(); c.moveTo(3, -2); c.lineTo(3, -19); c.lineTo(5, -19); c.quadraticCurveTo(16, -19, 21.6, -2); c.closePath(); F(c, GLASS);
    L(c, -15, -5, -9, -16, 1.4, 'rgba(255,255,255,0.65)'); L(c, 7, -5, 11, -15, 1.4, 'rgba(255,255,255,0.65)');
    c.beginPath(); c.moveTo(-42, 22); c.lineTo(-43, 8); c.quadraticCurveTo(-43, -3, -30, -3); c.lineTo(30, -3); c.quadraticCurveTo(44, -1, 45, 12); c.lineTo(45, 22); c.quadraticCurveTo(45, 25, 42, 25); c.lineTo(-39, 25); c.quadraticCurveTo(-42, 25, -42, 22); c.closePath(); F(c, col);
    c.beginPath(); c.moveTo(-38, 1.6); c.quadraticCurveTo(0, -1.4, 37, 2.4); c.lineWidth = 1.8; c.lineCap = 'round'; c.strokeStyle = shade(col, 0.4); c.stroke();
    Rn(c, -41.6, 16, 86, 3, 1.5, p.paper);
    L(c, 1, -1, 1, 22, 0.8, shade(col, -0.3)); R(c, -8, 6, 6, 2.2, 1.1, STEEL);
    E(c, 42.4, 9, 3, 4.4, '#fff3b8'); dot(c, 43, 9, 6.4 + k * 2.4, 'rgba(255,240,170,0.3)'); Rn(c, -43.6, 6.4, 2.6, 5.6, 1.2, '#ff5a5f');
    R(c, 38, 20, 10, 4.4, 2.2, STEEL); R(c, -46, 20, 9, 4.4, 2.2, STEEL);
    c.restore();
    c.fillStyle = shade(col, -0.5); c.beginPath(); c.arc(-25, 25 + by, 11.6, PI, 0); c.fill(); c.beginPath(); c.arc(26, 25 + by, 11.6, PI, 0); c.fill();
    wheel2(c, -25, 26.6, 9.4, p.gold, wa); wheel2(c, 26, 26.6, 9.4, p.gold, wa + 1);
  });

  /* ---------- school ---------- */
  Art.add('prop', 'diploma', function (c, t, p, o) {
    var pa = p.paper, i, k = pulse(o), rib = p.accent;
    E(c, 0, 37, 42, 3.8, SHADOW);
    c.save(); c.rotate(-0.16 + Math.sin(t * 1.5) * 0.025);
    /* ribbon tails fall behind */
    Pg(c, [[-5, 4], [-14, 36 + Math.sin(t * 2) * 1.2], [-8.6, 32], [-3.6, 37], [2, 6]], shade(rib, -0.14)); Pg(c, [[5, 4], [15, 34 + Math.cos(t * 2) * 1.2], [9, 31], [4.6, 37], [-1, 6]], rib);
    /* the roll */
    R(c, -40, -13, 80, 26, 6, pa);
    c.save(); K.rrp(c, -40, -13, 80, 26, 6); c.clip(); Rn(c, -40, 5, 80, 9, 0, shade(pa, -0.1)); Rn(c, -40, -13, 80, 4.4, 0, '#ffffff'); for (i = 0; i < 5; i++) L(c, -30 + i * 4, -6 + (i % 2) * 5, -20 + i * 4, -6 + (i % 2) * 5, 0.7, shade(pa, -0.2)); c.restore();
    for (i = -1; i <= 1; i += 2) { E(c, i * 40, 0, 5.4, 13, shade(pa, -0.06)); c.beginPath(); c.ellipse(i * 40, 0, 3, 9, 0, 0, TAU); c.fillStyle = shade(pa, -0.22); c.fill(); c.beginPath(); c.ellipse(i * 40, 0, 1.2, 5, 0, 0, TAU); c.fillStyle = shade(pa, -0.4); c.fill(); }
    R(c, -7, -14.5, 14, 29, 2.4, rib); Rn(c, -7, -14.5, 4, 29, 2, shade(rib, 0.25));
    /* the seal */
    c.save(); c.translate(0, 1); c.rotate(t * 0.25); K.starPath(c, 0, 0, 12.6 + k * 1.2, 10.4 + k, 12, 0); F(c, p.gold); c.restore();
    dot(c, 0, 1, 7.6, shade(p.gold, 0.3)); star(c, 0, 1.2, 5, p.gold); dot(c, -2.6, -2, 1.6, 'rgba(255,255,255,0.7)');
    c.restore();
    K.twinkle(c, -32, -28, 4.4 + Math.sin(t * 3) * 1.8, p.gold); K.twinkle(c, 34, -22, 3 + Math.cos(t * 3.6) * 1.4, '#ffffff'); K.twinkle(c, 28, 30, 2.6 + Math.sin(t * 4 + 1) * 1.2, p.gold);
  });

  Art.add('prop', 'bookstack', function (c, t, p, o) {
    var i, k = pulse(o), pa = p.paper;
    function book(x, y, w, h, col, rot, band) {
      c.save(); c.translate(x, y); c.rotate(rot || 0);
      R(c, -w / 2, -h / 2, w, h, 2.4, col); R(c, -w / 2 + 3.4, -h / 2 + 2, w - 3.4, h - 4, 1.2, pa);
      for (var j = 1; j < 3; j++) L(c, -w / 2 + 12, -h / 2 + 2 + j * (h - 4) / 3, w / 2 - 1.6, -h / 2 + 2 + j * (h - 4) / 3, 0.6, shade(pa, -0.22));
      c.beginPath(); c.moveTo(-w / 2 + 12, -h / 2); c.lineTo(-w / 2 + 2.4, -h / 2); c.quadraticCurveTo(-w / 2 - 2, 0, -w / 2 + 2.4, h / 2); c.lineTo(-w / 2 + 12, h / 2); c.closePath(); F(c, col);
      Rn(c, -w / 2 + 4.6, -h / 2 + 0.8, 1.8, h - 1.6, 0, band); Rn(c, -w / 2 + 8, -h / 2 + 0.8, 1, h - 1.6, 0, band);
      Rn(c, -w / 2 + 12, -h / 2 - 0.2, w - 12, 2.2, 1, col); Rn(c, -w / 2 + 12, h / 2 - 2, w - 12, 2.2, 1, shade(col, -0.14)); c.restore();
    }
    E(c, 0, 43, 40, 4, SHADOW);
    book(1, 34, 74, 15, p.accent2, 0, p.gold); book(-3, 19.4, 64, 13.6, p.gold, 0, p.accent); book(3, 6, 68, 13, p.accent, 0, pa);
    /* a ribbon bookmark hangs out */
    Pg(c, [[26, 11], [31, 11], [31, 24 + Math.sin(t * 2.2) * 1], [28.5, 21], [26, 24 + Math.sin(t * 2.2) * 1]], p.accent2);
    book(-1, -7, 54, 12.4, mix(p.accent2, '#58b4ff', 0.6), -0.07, pa);
    /* an open book on top, a page turning */
    c.save(); c.translate(0, -17 - k * 1.4);
    c.beginPath(); c.moveTo(-28, -1); c.quadraticCurveTo(-14, 4, 0, 0); c.quadraticCurveTo(14, 4, 28, -1); c.lineTo(29, 3); c.quadraticCurveTo(14, 8, 0, 4); c.quadraticCurveTo(-14, 8, -29, 3); c.closePath(); F(c, p.accent);
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(0, 1); c.quadraticCurveTo(i * 7, -9, i * 27, -4.6); c.lineTo(i * 27, 1.4); c.quadraticCurveTo(i * 13, -2.4, 0, 3); c.closePath(); F(c, pa); for (var j = 0; j < 3; j++) { c.beginPath(); c.moveTo(i * 5, -1.6 - j * 1.6 + 1); c.quadraticCurveTo(i * 12, -5.6 - j * 0.8, i * 23, -3.4 - j * 0.4); c.lineWidth = 0.6; c.strokeStyle = shade(pa, -0.28); c.stroke(); } }
    var fl = frac(t * 0.28), fa = Math.min(1, fl * 2.2), fx = Math.cos(fa * PI) * 24, fy = -5 - Math.sin(fa * PI) * 13;
    c.beginPath(); c.moveTo(0, 1.4); c.quadraticCurveTo(fx * 0.4, fy - 4, fx, fy + 1); c.lineTo(fx, fy + 4); c.quadraticCurveTo(fx * 0.4, fy + 1, 0, 3); c.closePath(); F(c, '#ffffff');
    c.restore();
    K.twinkle(c, -30, -34, 3.6 + Math.sin(t * 3.2) * 1.5, p.gold); K.twinkle(c, 33, -26, 2.6 + Math.cos(t * 4) * 1.2, p.gold);
  });

  Art.add('prop', 'backpack', function (c, t, p, o) {
    var col = p.accent2, dk = shade(col, -0.18), i, k = pulse(o), sw = Math.sin(t * 2.4) * 0.14 + k * 0.1;
    E(c, 0, 43, 34, 4, SHADOW);
    c.save(); c.translate(0, 42); c.rotate(Math.sin(t * 1.5) * 0.02); c.scale(1 + k * 0.015, 1 - k * 0.02); c.translate(0, -42);
    c.beginPath(); c.arc(0, -36, 8, PI, 0); tube(c, 3.6, dk);
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * 22, -22); c.quadraticCurveTo(i * 37, 0, i * 27, 30); tube(c, 5, dk); }
    /* a rolled mat on top, a bottle in the side pocket */
    R(c, -22, -41, 44, 10, 5, p.gold); for (i = -1; i <= 1; i += 2) { Rn(c, i * 12 - 1.4, -41, 2.8, 10, 0, shade(p.gold, -0.3)); c.beginPath(); c.arc(i * 22 - i * 4.4, -36, 2.6, 0, TAU); c.lineWidth = 0.8; c.strokeStyle = shade(p.gold, -0.3); c.stroke(); }
    R(c, 26, 1, 8, 20, 3, '#58b4ff'); R(c, 27.6, -4, 4.8, 6, 1.5, p.paper); L(c, 28, 5, 28, 16, 1, 'rgba(255,255,255,0.6)'); R(c, 23, 12, 13, 21, 4, dk);
    /* the bag */
    c.beginPath(); c.moveTo(-26, 36); c.lineTo(-27, -8); c.quadraticCurveTo(-27, -34, 0, -34); c.quadraticCurveTo(27, -34, 27, -8); c.lineTo(26, 36); c.quadraticCurveTo(26, 42, 20, 42); c.lineTo(-20, 42); c.quadraticCurveTo(-26, 42, -26, 36); c.closePath(); F(c, col);
    c.beginPath(); c.moveTo(-21, -10); c.quadraticCurveTo(-20, -28, 0, -28); c.quadraticCurveTo(20, -28, 21, -10); c.lineWidth = 1.5; c.setLineDash([2.4, 2.2]); c.lineCap = 'butt'; c.strokeStyle = shade(col, 0.45); c.stroke(); c.setLineDash([]);
    L(c, -22, -14, -22, 20, 2, 'rgba(255,255,255,0.28)');
    /* front pocket with a zip */
    R(c, -19, 6, 38, 31, 7, shade(col, 0.16)); L(c, -14, 13, 14, 13, 1.6, shade(col, -0.34)); c.setLineDash([1.2, 1.6]); c.lineCap = 'butt'; c.beginPath(); c.moveTo(-14, 13); c.lineTo(14, 13); c.lineWidth = 1; c.strokeStyle = STEEL; c.stroke(); c.setLineDash([]);
    c.save(); c.translate(12, 13); c.rotate(sw); L(c, 0, 0, 0, 5, 1, STEEL); R(c, -2, 4, 4, 6.4, 1.6, p.accent); c.restore();
    /* badges */
    E(c, -8, 25, 5.6, 5.6, p.gold); star(c, -8, 25.2, 3.6, p.paper); heart(c, 6, 26, 9, p.accent); E(c, -10, -12, 4.2, 4.2, p.paper); dot(c, -10, -12, 2, '#58b4ff');
    R(c, -11, -3, 22, 4.6, 2.3, dk); R(c, -3.4, -4.4, 6.8, 7.4, 1.6, STEEL);
    c.restore();
  });

  Art.add('prop', 'pencil', function (c, t, p, o) {
    var y = p.gold, i, k = pulse(o), wig = Math.sin(t * 5) * 0.03;
    /* the line it has just drawn */
    c.beginPath(); c.moveTo(-40, 34); c.bezierCurveTo(-30, 24, -24, 44, -14, 36); c.bezierCurveTo(-8, 30, -36, 42, -27.4, 33.6); c.lineWidth = 1.8; c.lineCap = 'round'; c.strokeStyle = p.accent2; c.stroke();
    star(c, -6, 36, 3.4 + k * 1.4, p.accent, t * 0.6);
    c.save(); c.translate(-29, 33); c.rotate(-PI / 4 + wig);
    /* drawn pointing along +x from the tip at (0,0) */
    Pg(c, [[0, 0], [15, -7.6], [15, 7.6]], '#f0d2a4'); Pg(c, [[0, 0], [5.4, -2.7], [5.4, 2.7]], p.ink, true);
    R(c, 15, -7.6, 62, 15.2, 1, y);
    Rn(c, 15, -7.6, 62, 4.6, 0, shade(y, 0.3)); Rn(c, 15, 3.2, 62, 4.4, 0, shade(y, -0.16));
    c.beginPath(); c.moveTo(15, -7.6); c.lineTo(19, -5); c.lineTo(15, -2.6); c.lineTo(19, 0); c.lineTo(15, 2.6); c.lineTo(19, 5.2); c.lineTo(15, 7.6); c.closePath(); c.fillStyle = '#f0d2a4'; c.fill();
    for (i = 0; i < 3; i++) star(c, 34 + i * 12, 0, 2.2, alpha(p.accent2, 0.9), i);
    R(c, 77, -8.2, 10, 16.4, 1.4, STEEL); L(c, 80, -7.4, 80, 7.4, 0.9, shade(STEEL, -0.3)); L(c, 84, -7.4, 84, 7.4, 0.9, shade(STEEL, -0.3));
    R(c, 87, -7.4, 11, 14.8, 4.4, mix(p.accent, '#ff9ab8', 0.5)); L(c, 90, -4.6, 95, -4.6, 1.4, 'rgba(255,255,255,0.5)');
    c.restore();
    K.twinkle(c, 37, -37, 3.4 + Math.sin(t * 3.4) * 1.5, p.gold);
  });

  Art.add('prop', 'apple', function (c, t, p, o) {
    var col = mix('#e23b3b', p.accent, 0.4), i, k = pulse(o), s = 1 + k * 0.035;
    E(c, 0, 42, 30, 4, SHADOW);
    c.save(); c.translate(0, 42); c.rotate(Math.sin(t * 1.6) * 0.035); c.scale(s, 2 - s); c.translate(0, -42);
    c.beginPath(); c.moveTo(0, -20); c.bezierCurveTo(-14, -34, -42, -24, -39, 6); c.bezierCurveTo(-37, 30, -19, 46, 0, 39); c.bezierCurveTo(19, 46, 37, 30, 39, 6); c.bezierCurveTo(42, -24, 14, -34, 0, -20); c.closePath(); F(c, col);
    c.save(); c.clip(); c.beginPath(); c.ellipse(15, 14, 30, 34, 0.3, 0, TAU); c.fillStyle = shade(col, -0.12); c.fill(); c.beginPath(); c.ellipse(-17, -8, 15, 19, 0.4, 0, TAU); c.fillStyle = shade(col, 0.16); c.fill(); c.restore();
    c.beginPath(); c.ellipse(0, -19.4, 9, 3.4, 0, 0, PI); c.fillStyle = shade(col, -0.3); c.fill();
    c.beginPath(); c.arc(-19, -6, 12, PI * 1.02, PI * 1.5); c.lineWidth = 4.4; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke(); dot(c, -26.4, 3, 2.2, 'rgba(255,255,255,0.7)');
    c.beginPath(); c.moveTo(0, -19); c.quadraticCurveTo(1, -32, 7, -38); tube(c, 3.2, '#7a5230');
    c.save(); c.translate(4, -31); c.rotate(-0.5 + Math.sin(t * 2.2) * 0.08); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(11, -15, 27, -6); c.quadraticCurveTo(13, 6, 0, 0); c.closePath(); F(c, LEAFG); L(c, 3, -0.6, 21, -5, 0.9, shade(LEAFG, 0.4)); c.restore();
    /* a friendly face */
    dot(c, -10, 10, 2.6, p.ink); dot(c, 10, 10, 2.6, p.ink); dot(c, -9.2, 9, 0.9, '#fff'); dot(c, 10.8, 9, 0.9, '#fff'); K.blush(c, 0, 16, 17, 4.2, 'rgba(255,255,255,0.3)');
    c.beginPath(); c.arc(0, 13.6, 5.4, 0.16 * PI, 0.84 * PI); c.lineWidth = 1.5; c.strokeStyle = p.ink; c.stroke();
    c.restore();
  });

  Art.add('prop', 'schoolbus', function (c, t, p, o) {
    var k = pulse(o), y = mix('#ffc21a', p.gold, 0.4), i, by = -k * 1.5 + Math.sin(t * 7) * 0.3, wa = t * 3;
    E(c, 0, 33, 47, 4.2, SHADOW);
    c.save(); c.translate(0, by);
    c.beginPath(); c.moveTo(-46, 22); c.lineTo(-46, -22); c.quadraticCurveTo(-46, -28, -40, -28); c.lineTo(20, -28); c.quadraticCurveTo(26, -28, 27, -22); c.lineTo(29, -4); c.lineTo(42, -2); c.quadraticCurveTo(47, -1, 47, 5); c.lineTo(47, 22); c.quadraticCurveTo(47, 25, 44, 25); c.lineTo(-43, 25); c.quadraticCurveTo(-46, 25, -46, 22); c.closePath(); F(c, y);
    Rn(c, -45.4, -27.4, 70, 3.4, 1.7, shade(y, 0.35)); Rn(c, -45.4, 3, 92, 2.4, 0, p.ink); Rn(c, -45.4, 10, 92, 1.6, 0, p.ink); Rn(c, -45.4, 18, 92, 6.4, 0, shade(y, -0.14));
    /* windows, a few friends waving inside (plain shapes) */
    var kid = [p.accent, null, p.accent2, '#58b4ff'];
    for (i = 0; i < 4; i++) { var wx = -42 + i * 15.4; R(c, wx, -22, 12.4, 15, 2.6, GLASS); if (kid[i]) { c.save(); K.rrp(c, wx, -22, 12.4, 15, 2.6); c.clip(); var hb = Math.sin(t * 3 + i * 1.7) * 1; dot(c, wx + 6.2, -11.6 + hb, 3.6, ['#f6cfa8', '', '#b9774a', '#e3ac7c'][i]); c.fillStyle = kid[i]; c.beginPath(); c.ellipse(wx + 6.2, -3.6 + hb, 5.4, 4.6, 0, 0, TAU); c.fill(); c.restore(); } L(c, wx + 2, -10, wx + 5, -19.4, 1, 'rgba(255,255,255,0.6)'); }
    c.beginPath(); c.moveTo(19.6, -22); c.lineTo(23, -22); c.lineTo(25, -5); c.lineTo(19.6, -5); c.closePath(); F(c, GLASS);
    R(c, 12.4, -3, 6, 2, 1, p.ink);
    /* the stop paddle folds out on the beat */
    c.save(); c.translate(-46, -12); c.scale(0.35 + 0.65 * k, 1); K.starPath(c, -6, 0, 6, 5.5, 4, PI / 8); F(c, p.accent); dot(c, -6, 0, 2, p.paper); c.restore();
    E(c, 44.6, 8, 2.6, 3.8, '#fff3b8'); dot(c, 45, 8, 6 + k * 2.4, 'rgba(255,240,170,0.32)'); dot(c, 20, -25, 1.8, k > 0.5 ? '#ff5a5f' : '#c0504d'); dot(c, -41, -25, 1.8, k > 0.5 ? '#ffb347' : '#c98a3a');
    R(c, 40, 19, 9.4, 4.6, 2.2, p.ink); R(c, -48.4, 19, 6, 4.6, 2.2, p.ink);
    c.restore();
    c.fillStyle = shade(y, -0.55); c.beginPath(); c.arc(-27, 25 + by, 11.4, PI, 0); c.fill(); c.beginPath(); c.arc(29, 25 + by, 11.4, PI, 0); c.fill();
    wheel2(c, -27, 26.6, 9.2, y, wa); wheel2(c, 29, 26.6, 9.2, y, wa + 1);
  });

  Art.add('prop', 'whistle', function (c, t, p, o) {
    var col = p.accent, i, k = pulse(o), sw = Math.sin(t * 2) * 0.05;
    c.save(); c.translate(-14, -44); c.rotate(sw); c.translate(14, 44);
    /* the cord loops up and away */
    c.beginPath(); c.moveTo(-17, -9); c.bezierCurveTo(-36, -30, -30, -52, -12, -48); c.bezierCurveTo(4, -44, -4, -22, -14, -10); tube(c, 2.6, p.accent2);
    c.beginPath(); c.arc(-15, -7, 5.4, 0, TAU); tube(c, 2, STEEL);
    /* body: a round chamber and a mouthpiece */
    c.beginPath(); c.moveTo(-10, -11); c.lineTo(40, -11); c.quadraticCurveTo(44, -11, 44, -7); c.lineTo(44, 2); c.quadraticCurveTo(44, 5, 40, 5); c.lineTo(12, 5); c.closePath(); F(c, col);
    E(c, -8, 13, 24, 24, col);
    c.beginPath(); c.moveTo(-9, -10.4); c.lineTo(40, -10.4); c.quadraticCurveTo(43.4, -10.4, 43.4, -7); c.lineTo(43.4, 2); c.quadraticCurveTo(43.4, 4.4, 40, 4.4); c.lineTo(13, 4.4); c.lineTo(8, -4); c.closePath(); c.fillStyle = col; c.fill();
    Rn(c, -6, -10, 48, 3.6, 1.8, shade(col, 0.3)); Rn(c, 37, -10.4, 6.4, 14.8, 2, shade(col, -0.2));
    R(c, 9, -12.4, 13, 7.4, 1.6, '#3b3340');
    c.beginPath(); c.arc(-8, 13, 17, 0, TAU); c.fillStyle = shade(col, -0.13); c.fill(); c.beginPath(); c.arc(-10, 11, 14.4, 0, TAU); c.fillStyle = col; c.fill();
    dot(c, -6 + Math.sin(t * 11) * 4 * (0.3 + k), 16 + Math.cos(t * 9) * 3 * (0.3 + k), 5, p.gold); dot(c, -7.4 + Math.sin(t * 11) * 4 * (0.3 + k), 14.6 + Math.cos(t * 9) * 3 * (0.3 + k), 1.8, shade(p.gold, 0.5));
    c.beginPath(); c.arc(-8, 13, 20, PI * 1.05, PI * 1.45); c.lineWidth = 3; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.6)'; c.stroke();
    c.restore();
    /* tweet! */
    for (i = 0; i < 3; i++) { var a = -1.15 + i * 0.42, r0 = 9 + k * 3, r1 = 17 + k * 6 + (i === 1 ? 3 : 0); L(c, 16 + Math.cos(a) * r0, -18 + Math.sin(a) * r0, 16 + Math.cos(a) * r1, -18 + Math.sin(a) * r1, 2, alpha(p.gold, 0.45 + 0.55 * k)); }
    K.twinkle(c, 38, 30, 3 + Math.sin(t * 3.4) * 1.4, '#ffffff');
  });

  Art.add('prop', 'clipboard', function (c, t, p, o) {
    var i, k = pulse(o), wd = WOOD, pa = p.paper, done = Math.floor(frac(t * 0.12) * 5);
    E(c, 0, 44, 32, 3.6, SHADOW);
    c.save(); c.rotate(-0.07 + Math.sin(t * 1.5) * 0.02);
    R(c, -31, -38, 62, 80, 5, wd); Rn(c, -31, 34, 62, 8, 4, shade(wd, -0.14)); L(c, -27.6, -32, -27.6, 34, 1.4, shade(wd, 0.3));
    R(c, -25, -29, 51, 66, 2, shade(pa, -0.12)); R(c, -26, -30, 51, 66, 2, pa);
    /* a list being ticked off */
    for (i = 0; i < 4; i++) {
      var y = -17 + i * 13; R(c, -21, y - 4, 8, 8, 1.6, '#ffffff');
      if (i < done || (i === 0 && done === 0 && false)) { c.beginPath(); c.moveTo(-19.6, y - 0.4); c.lineTo(-17.4, y + 2.4); c.lineTo(-12, y - 5.4); c.lineWidth = 2.2; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = p.accent2; c.stroke(); }
      Rn(c, -9, y - 3.4, [28, 22, 26, 17][i], 2.6, 1.3, shade(pa, -0.32)); Rn(c, -9, y + 1.4, [18, 26, 14, 22][i], 2, 1, shade(pa, -0.18));
    }
    heart(c, 15, 30, 7, p.accent, true);
    /* the clip */
    R(c, -15, -42, 30, 11, 3, STEEL); R(c, -8, -47, 16, 9, 4, shade(STEEL, -0.18)); dot(c, 0, -43, 2.2, wd); Rn(c, -12, -40, 24, 2, 1, '#ffffff');
    c.restore();
    /* a pencil on a string */
    c.save(); c.translate(31, 4); c.rotate(0.16 + Math.sin(t * 2) * 0.06 + k * 0.04);
    c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(-8, -26, -19, -44); c.lineWidth = 0.8; c.strokeStyle = '#7a6a5a'; c.stroke();
    R(c, -3, -2, 6, 30, 1, p.gold); Rn(c, -3, -2, 2, 30, 0, shade(p.gold, 0.3)); R(c, -3, -7, 6, 5.6, 2, mix(p.accent, '#ff9ab8', 0.5)); Pg(c, [[-3, 28], [3, 28], [0, 36]], '#f0d2a4'); Pg(c, [[-1.2, 33], [1.2, 33], [0, 36]], p.ink, true);
    c.restore();
  });

  /* ---------- getting well, being cared for ---------- */
  Art.add('prop', 'stethoscope', function (c, t, p, o) {
    var k = pulse(o), col = p.accent2, s = 1 + k * 0.1, i;
    E(c, 4, 44, 30, 3.4, SHADOW);
    /* the tubing: a Y from the ear pieces down and round to the chest piece */
    c.beginPath(); c.moveTo(-22, -22); c.bezierCurveTo(-22, -4, -6, -8, -6, 6); c.moveTo(10, -22); c.bezierCurveTo(10, -4, -6, -8, -6, 6);
    c.moveTo(-6, 6); c.bezierCurveTo(-6, 44, 34, 46, 30, 12); tube(c, 4.4, col);
    c.beginPath(); c.moveTo(-22, -22); c.bezierCurveTo(-22, -4, -6, -8, -6, 6); c.lineWidth = 1.1; c.strokeStyle = shade(col, 0.4); c.stroke();
    /* the head set */
    c.beginPath(); c.moveTo(-22, -20); c.quadraticCurveTo(-27, -36, -18, -44); c.moveTo(10, -20); c.quadraticCurveTo(15, -36, 6, -44); tube(c, 2.6, STEEL);
    E(c, -16.6, -45, 3.6, 3.6, '#3b3340'); E(c, 4.6, -45, 3.6, 3.6, '#3b3340'); R(c, -9.4, 2, 7, 8, 2, STEEL);
    /* the chest piece listens to a heart */
    c.save(); c.translate(30, 4);
    R(c, -3, 2, 6, 8, 2, STEEL);
    E(c, 0, -6, 13.6, 13.6, STEEL); c.beginPath(); c.arc(0, -6, 10.4, 0, TAU); c.fillStyle = '#f3f5f8'; c.fill(); K.ringStroke(c, 0, -6, 10.4, 0.8, shade(STEEL, -0.3));
    c.scale(s, s); heart(c, 0, -6 / s, 12, p.accent, true); c.restore();
    c.beginPath(); c.arc(30, -2, 11, PI * 1.1, PI * 1.45); c.lineWidth = 1.6; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke();
    /* the beat it hears */
    c.beginPath(); c.moveTo(-44, 30); c.lineTo(-36, 30); c.lineTo(-33, 24); c.lineTo(-29, 37); c.lineTo(-25, 18 - k * 4); c.lineTo(-21, 30); c.lineTo(-13, 30); c.lineWidth = 2; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = alpha(p.accent, 0.55 + 0.45 * k); c.stroke();
    for (i = 0; i < 2; i++) { var f = frac(t * 0.5 + i * 0.5); c.save(); c.translate(42 + Math.sin(f * 6 + i) * 3, -16 - f * 24); K.heartPath(c, 0, 0, 5 + i * 2); c.fillStyle = alpha(p.accent, 0.85 * (1 - f)); c.fill(); c.restore(); }
  });

  Art.add('prop', 'teacup', function (c, t, p, o) {
    var col = p.paper, i, k = pulse(o), tr = p.accent;
    K.steam(c, -3, -19, 20, t, 3);
    E(c, 0, 40, 44, 5, SHADOW);
    /* saucer */
    E(c, 0, 33, 43, 8.6, col); c.beginPath(); c.ellipse(0, 32, 34, 5.6, 0, 0, TAU); c.lineWidth = 1.5; c.strokeStyle = tr; c.stroke(); c.beginPath(); c.ellipse(0, 33, 19, 3.4, 0, 0, TAU); c.fillStyle = shade(col, -0.12); c.fill();
    /* handle */
    c.beginPath(); c.moveTo(25, -6); c.bezierCurveTo(46, -10, 46, 16, 20, 17); tube(c, 4.6, col);
    /* cup */
    c.beginPath(); c.moveTo(-31, -12); c.bezierCurveTo(-31, 14, -22, 30, -8, 31); c.lineTo(8, 31); c.bezierCurveTo(22, 30, 31, 14, 31, -12); c.closePath(); F(c, col);
    c.save(); c.clip(); c.beginPath(); c.ellipse(18, 12, 18, 30, 0.2, 0, TAU); c.fillStyle = shade(col, -0.09); c.fill();
    for (i = -2; i <= 2; i++) K.flower(c, i * 13, 6 + (i % 2 ? 7 : 0), 4.6, i % 2 ? p.accent2 : tr, p.gold, i);
    Rn(c, -34, -12, 68, 5.4, 0, tr); c.restore();
    R(c, -9, 30, 18, 3.6, 1.6, shade(col, -0.1));
    E(c, 0, -12, 31, 8, col); E(c, 0, -11.4, 26.6, 5.8, mix('#b5651d', '#e0a060', 0.3)); c.beginPath(); c.ellipse(-7 + Math.sin(t * 1.3) * 2, -12.6, 9, 1.8, -0.1, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
    /* the tea-bag tag */
    c.beginPath(); c.moveTo(-18, -13); c.quadraticCurveTo(-30, -14, -31 + Math.sin(t * 1.8) * 1.2, 0); c.lineWidth = 0.8; c.strokeStyle = '#7a6a5a'; c.stroke();
    c.save(); c.translate(-31 + Math.sin(t * 1.8) * 1.2, 0); c.rotate(Math.sin(t * 1.8) * 0.2); R(c, -4.4, 0, 8.8, 10, 1.4, p.gold); heart(c, 0, 5.2, 5, tr, true); c.restore();
    /* a biscuit and a spoon on the saucer */
    E(c, 31, 31, 8, 3.6, '#d9a25e'); dot(c, 29, 30.4, 0.8, '#8a5a2e'); dot(c, 33, 31.6, 0.8, '#8a5a2e'); dot(c, 31.6, 29.6, 0.7, '#8a5a2e');
    L(c, -38, 31.4, -22, 34, 2, STEEL); E(c, -39.4, 31, 4.6, 2.4, STEEL, 0.15);
    L(c, -24, -4, -21, 16, 2.4, 'rgba(255,255,255,0.75)');
  });

  Art.add('prop', 'soupbowl', function (c, t, p, o) {
    var col = p.accent, i, k = pulse(o), soup = mix('#f0a13c', p.gold, 0.3);
    K.steam(c, -2, -18, 22, t, 3);
    E(c, 0, 40, 44, 5, SHADOW);
    /* a napkin underneath */
    Pg(c, [[-46, 34], [-10, 26], [44, 33], [6, 43]], mix(p.accent2, p.paper, 0.55)); L(c, -34, 34.6, 6, 40.6, 0.8, alpha(p.accent2, 0.7)); L(c, -22, 31.6, 20, 38, 0.8, alpha(p.accent2, 0.7));
    /* the spoon stands in the soup */
    c.save(); c.translate(17, -10); c.rotate(0.5 + Math.sin(t * 1.4) * 0.03); R(c, -2, -34, 4, 34, 2, STEEL); L(c, -0.6, -31, -0.6, -4, 0.9, '#ffffff'); c.restore();
    /* bowl */
    c.beginPath(); c.moveTo(-39, -9); c.bezierCurveTo(-38, 18, -24, 31, -11, 32); c.lineTo(11, 32); c.bezierCurveTo(24, 31, 38, 18, 39, -9); c.closePath(); F(c, col);
    c.save(); c.clip(); c.beginPath(); c.ellipse(22, 12, 20, 30, 0.2, 0, TAU); c.fillStyle = shade(col, -0.12); c.fill(); Rn(c, -42, 3, 84, 3.4, 0, p.paper); Rn(c, -42, 9.4, 84, 1.6, 0, p.paper);
    for (i = -3; i <= 3; i++) dot(c, i * 10, 18.4, 1.8, p.gold); c.restore();
    R(c, -12, 31, 24, 4.4, 2, shade(col, -0.16));
    E(c, 0, -9, 39, 9.4, shade(col, 0.2)); E(c, 0, -8.4, 34, 7, soup);
    /* what floats in it */
    c.save(); c.beginPath(); c.ellipse(0, -8.4, 33.4, 6.6, 0, 0, TAU); c.clip();
    var bits = [[-20, -8, '#ff8a3c'], [-8, -5, LEAFG], [4, -11, '#ff8a3c'], [-13, -12, '#fff3c4'], [24, -8, LEAFG], [-27, -9, '#fff3c4'], [10, -5, '#fff3c4']];
    for (i = 0; i < bits.length; i++) { var bx = bits[i][0] + Math.sin(t * 0.9 + i * 1.3) * 1.6, byy = bits[i][1] + Math.cos(t * 1.1 + i) * 0.6; c.beginPath(); c.ellipse(bx, byy, i % 3 === 2 ? 2.2 : 3.4, i % 3 === 2 ? 1.2 : 1.8, i, 0, TAU); c.fillStyle = bits[i][2]; c.fill(); }
    c.beginPath(); c.ellipse(-12, -11, 12, 1.6, -0.08, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill(); c.restore();
    L(c, -31, 0, -27, 15, 2.6, 'rgba(255,255,255,0.5)');
    /* a heel of bread */
    c.save(); c.translate(-33, 31); c.rotate(-0.2); c.beginPath(); c.moveTo(-10, 5); c.lineTo(-10, -2); c.quadraticCurveTo(-10, -9, 0, -9); c.quadraticCurveTo(10, -9, 10, -2); c.lineTo(10, 5); c.closePath(); F(c, '#d9a25e'); c.beginPath(); c.moveTo(-7.6, 3.4); c.lineTo(-7.6, -1.6); c.quadraticCurveTo(-7.6, -6.6, 0, -6.6); c.quadraticCurveTo(7.6, -6.6, 7.6, -1.6); c.lineTo(7.6, 3.4); c.closePath(); c.fillStyle = '#f6e2b8'; c.fill(); c.restore();
    heart(c, 0, 16.6 - k * 0, 11 + k * 1.6, p.paper, true);
  });

  Art.add('prop', 'mendedheart', function (c, t, p, o) {
    var k = pulse(o), s = 1 + k * 0.08 + Math.sin(t * 3) * 0.015, col = p.accent, i, pl = '#f3cfa4';
    E(c, 0, 44, 26, 3.4, SHADOW);
    c.save(); c.scale(s, s);
    K.heartPath(c, 0, 2, 82); F(c, col);
    K.heartPath(c, -2, 0, 64); c.fillStyle = shade(col, 0.14); c.fill();
    /* the mend: a neat line of stitches, and a little plaster across it */
    c.beginPath(); c.moveTo(1, -16); c.lineTo(-5, -6); c.lineTo(4, 3); c.lineTo(-4, 13); c.lineTo(3, 23); c.lineTo(0, 34); c.lineWidth = 1.5; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = shade(col, -0.34); c.stroke();
    var st = [[-2, -11], [0, 8], [-0.4, 18], [1.6, 28.6]]; for (i = 0; i < st.length; i++) L(c, st[i][0] - 4.4, st[i][1] - 1.2, st[i][0] + 4.4, st[i][1] + 1.2, 1.5, p.paper);
    c.beginPath(); c.arc(-17, -12, 13, PI * 1.05, PI * 1.5); c.lineWidth = 5; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    c.save(); c.translate(3, -2); c.rotate(-0.42);
    R(c, -23, -7.6, 46, 15.2, 7.6, pl); Rn(c, -7.6, -6.6, 15.2, 13.2, 2, shade(pl, 0.4));
    for (i = 0; i < 6; i++) { dot(c, -18 + (i % 3) * 3.6, -3 + Math.floor(i / 3) * 6, 0.8, shade(pl, -0.25)); dot(c, 11 + (i % 3) * 3.6, -3 + Math.floor(i / 3) * 6, 0.8, shade(pl, -0.25)); }
    K.heartPath(c, 0, 0.4, 7.4); c.fillStyle = col; c.fill(); L(c, -19, -5, -10, -5, 1, 'rgba(255,255,255,0.6)');
    c.restore();
    c.restore();
    K.twinkle(c, 36, -32, 5.4 + Math.sin(t * 3.4) * 2, p.gold); K.twinkle(c, -38, -26, 3.2 + Math.cos(t * 4) * 1.4, '#ffffff'); K.twinkle(c, 34, 24, 2.6 + Math.sin(t * 4.4 + 1) * 1.2, '#ffffff');
  });

  Art.add('prop', 'umbrella', function (c, t, p, o) {
    var i, k = pulse(o), cols = [p.accent, p.gold, p.accent2, p.paper], tilt = Math.sin(t * 1.4) * 0.05 - 0.1;
    /* rain on either side, none underneath */
    for (i = 0; i < 9; i++) { var side = i % 2 ? 1 : -1, rx = side * (33 + (i * 7) % 15), f = frac(t * 0.8 + i * 0.37), ry = -44 + f * 84; L(c, rx, ry, rx - 1.6, ry + 6, 1.4, alpha('#8fd0ff', 0.9 * Math.sin(f * PI))); }
    E(c, 2, 44, 20, 3, SHADOW); for (i = -1; i <= 1; i += 2) { c.beginPath(); c.ellipse(i * 34, 44, 6 + k * 3, 1.6 + k * 0.6, 0, 0, TAU); c.lineWidth = 0.9; c.strokeStyle = alpha('#8fd0ff', 0.5 + 0.4 * k); c.stroke(); }
    c.save(); c.translate(0, 40); c.rotate(tilt); c.translate(0, -40);
    /* shaft and crook */
    L(c, 0, -34, 0, 30, 3.6, shade(WOOD, -0.34)); L(c, 0, -34, 0, 30, 2.2, WOOD);
    c.beginPath(); c.moveTo(0, 28); c.lineTo(0, 35); c.arc(6.4, 35, 6.4, PI, 0, true); tube(c, 3.6, p.accent2);
    Pg(c, [[-1.8, -40], [1.8, -40], [0, -48]], p.gold);
    /* canopy: six panels, scalloped hem */
    var top = -40, hem = -8, w = 44, n = 6;
    c.beginPath(); c.moveTo(-w, hem); c.bezierCurveTo(-w, -30, -20, top, 0, top); c.bezierCurveTo(20, top, w, -30, w, hem);
    for (i = n - 1; i >= 0; i--) { var x0 = -w + (i + 1) * (2 * w / n), x1 = -w + i * (2 * w / n); c.quadraticCurveTo((x0 + x1) / 2, hem - 9, x1, hem); }
    c.closePath(); F(c, cols[0]);
    c.save(); c.clip();
    for (i = 0; i < n; i++) { var a = -w + i * (2 * w / n), b = a + 2 * w / n; c.beginPath(); c.moveTo(0, top - 2); c.quadraticCurveTo(a * 0.9, -26, a, hem + 2); c.lineTo(b, hem + 2); c.quadraticCurveTo(b * 0.9, -26, 0, top - 2); c.closePath(); c.fillStyle = cols[i % 2 ? 1 : 0]; c.fill(); }
    c.beginPath(); c.ellipse(-16, -30, 15, 6, -0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.28)'; c.fill(); c.restore();
    c.beginPath(); c.moveTo(-w, hem); c.bezierCurveTo(-w, -30, -20, top, 0, top); c.bezierCurveTo(20, top, w, -30, w, hem);
    for (i = n - 1; i >= 0; i--) { var y0 = -w + (i + 1) * (2 * w / n), y1 = -w + i * (2 * w / n); c.quadraticCurveTo((y0 + y1) / 2, hem - 9, y1, hem); }
    c.closePath(); c.lineWidth = K.ow(); c.strokeStyle = shade(cols[0], -0.34); c.stroke();
    for (i = 0; i <= n; i++) dot(c, -w + i * (2 * w / n), hem + 0.6, 1.5, shade(p.gold, -0.1));
    c.restore();
    /* drops bounce off the top */
    for (i = 0; i < 3; i++) { var g = frac(t * 1.3 + i / 3), dx = [-22, 3, 24][i]; dot(c, dx + (i - 1) * g * 5, -38 + Math.abs(dx) * 0.28 - Math.sin(g * PI) * 7, 1.5 * (1 - g * 0.5), alpha('#8fd0ff', 1 - g)); }
  });

  Art.add('prop', 'sunflower', function (c, t, p, o) {
    var i, k = pulse(o), sw = Math.sin(t * 1.3) * 0.045, pet = mix('#ffc21a', p.gold, 0.5), st = '#3f9a5c', seed = '#6b3f22';
    E(c, 0, 44, 22, 3.4, SHADOW);
    c.save(); c.translate(0, 44); c.rotate(sw);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-5, -30, 0, -58); tube(c, 4.4, st);
    for (i = -1; i <= 1; i += 2) { c.save(); c.translate(-1.6, i < 0 ? -24 : -11); c.rotate((i < 0 ? PI + 0.5 : -0.5) + Math.sin(t * 1.9 + i) * 0.07); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(8, -12, 22, -11, 28, -2); c.bezierCurveTo(20, 6, 8, 6, 0, 0); c.closePath(); F(c, LEAFG); L(c, 3, -0.4, 23, -2.4, 0.9, shade(LEAFG, 0.4)); c.restore(); }
    /* the head turns a little to the light */
    c.translate(0, -63); c.rotate(-sw * 0.6 + Math.sin(t * 0.7) * 0.03); var r = 12.6 + k * 0.8;
    for (i = 0; i < 14; i++) { c.save(); c.rotate(i / 14 * TAU + PI / 14); c.beginPath(); c.moveTo(-4.6, -r + 2); c.quadraticCurveTo(-6, -r - 11, 0, -r - 17); c.quadraticCurveTo(6, -r - 11, 4.6, -r + 2); c.closePath(); F(c, shade(pet, -0.1)); c.restore(); }
    for (i = 0; i < 14; i++) { c.save(); c.rotate(i / 14 * TAU); c.beginPath(); c.moveTo(-5, -r + 2); c.quadraticCurveTo(-6.6, -r - 13, 0, -r - 19.4); c.quadraticCurveTo(6.6, -r - 13, 5, -r + 2); c.closePath(); F(c, pet); L(c, 0, -r - 3, 0, -r - 13, 0.8, shade(pet, 0.4)); c.restore(); }
    E(c, 0, 0, r + 2.6, r + 2.6, seed); dot(c, 0, 0, r - 1, shade(seed, 0.12));
    for (i = 0; i < 34; i++) { var a = i * 2.39996, rr = Math.sqrt(i / 34) * (r + 0.6); dot(c, Math.cos(a) * rr, Math.sin(a) * rr, 0.95, i % 3 ? shade(seed, -0.3) : shade(pet, -0.1)); }
    /* a sunny face */
    dot(c, -4.6, -1.6, 1.7, '#2b2118'); dot(c, 4.6, -1.6, 1.7, '#2b2118'); c.beginPath(); c.arc(0, 1, 4.4, 0.15 * PI, 0.85 * PI); c.lineWidth = 1.3; c.lineCap = 'round'; c.strokeStyle = '#2b2118'; c.stroke(); K.blush(c, 0, 2.6, 8.4, 2, 'rgba(255,150,120,0.5)');
    c.restore();
    /* a bee comes by */
    var ba = t * 1.4, bx = 30 + Math.cos(ba) * 9, by = -20 + Math.sin(ba * 2) * 6;
    c.save(); c.translate(bx, by); c.rotate(Math.sin(ba) * 0.3); var wf = Math.abs(Math.sin(t * 22)); E(c, -1, -3.6, 2.6, 4 * (0.4 + 0.6 * wf), 'rgba(255,255,255,0.85)', -0.3); E(c, 2, -3.6, 2.6, 4 * (0.4 + 0.6 * wf), 'rgba(255,255,255,0.85)', 0.3);
    E(c, 0, 0, 4.6, 3.4, '#ffd23f'); Rn(c, -1.6, -3, 1.5, 6, 0, '#2b2118'); Rn(c, 1.2, -2.8, 1.4, 5.6, 0, '#2b2118'); dot(c, -3.4, -0.6, 0.6, '#2b2118'); c.restore();
  });

  /* ---------- the open air ---------- */
  Art.add('prop', 'hotairballoon', function (c, t, p, o) {
    var i, k = pulse(o), cols = [p.accent, p.paper, p.accent2, p.gold], bob = Math.sin(t * 1.1) * 2.4, tilt = Math.sin(t * 0.8) * 0.04, n = 7;
    c.save(); c.translate(0, bob); c.rotate(tilt);
    /* ropes, then the basket */
    L(c, -13, 12, -8, 30, 0.9, '#7a6a5a'); L(c, 13, 12, 8, 30, 0.9, '#7a6a5a'); L(c, -5, 14, -3, 30, 0.7, '#7a6a5a'); L(c, 5, 14, 3, 30, 0.7, '#7a6a5a');
    K.flame(c, 0, 22, 5 + k * 2, 9 + k * 5, t, 0.7); R(c, -3, 21, 6, 4, 1, STEEL);
    R(c, -10, 30, 20, 15, 3, WOOD); c.save(); K.rrp(c, -10, 30, 20, 15, 3); c.clip(); for (i = 0; i < 4; i++) L(c, -10, 33.6 + i * 3.4, 10, 33.6 + i * 3.4, 0.7, shade(WOOD, -0.25)); for (i = -2; i <= 2; i++) L(c, i * 4.4, 30, i * 4.4, 45, 0.7, shade(WOOD, -0.18)); c.restore();
    R(c, -11.6, 28.6, 23.2, 4, 2, shade(WOOD, 0.2)); R(c, -13.6, 34, 4.4, 7, 2, p.accent); R(c, 9.2, 34, 4.4, 7, 2, p.accent2);
    /* the envelope: striped gores */
    function env() { c.beginPath(); c.moveTo(-13, 12); c.bezierCurveTo(-30, -2, -40, -18, -37, -30); c.bezierCurveTo(-34, -52, 34, -52, 37, -30); c.bezierCurveTo(40, -18, 30, -2, 13, 12); c.closePath(); }
    env(); F(c, cols[0]);
    c.save(); env(); c.clip();
    for (i = 0; i < n; i++) { var a0 = -1 + i * 2 / n, a1 = a0 + 2 / n; c.beginPath(); c.moveTo(a0 * 14, 14); c.bezierCurveTo(a0 * 44, -6, a0 * 48, -40, a0 * 10, -50); c.lineTo(a1 * 10, -50); c.bezierCurveTo(a1 * 48, -40, a1 * 44, -6, a1 * 14, 14); c.closePath(); c.fillStyle = cols[i % 4]; c.fill(); }
    c.beginPath(); c.moveTo(-40, -14); c.quadraticCurveTo(0, -5, 40, -14); c.lineTo(40, -8); c.quadraticCurveTo(0, 1, -40, -8); c.closePath(); c.fillStyle = alpha(p.ink, 0.22); c.fill();
    for (i = -3; i <= 3; i++) star(c, i * 10.6, -9 + (1 - Math.abs(i) / 3) * 3.6 * 1 - 0.8, 2.3, p.paper, i);
    c.beginPath(); c.ellipse(20, -16, 20, 40, 0.2, 0, TAU); c.fillStyle = 'rgba(40,20,60,0.12)'; c.fill(); c.beginPath(); c.ellipse(-19, -30, 7, 13, 0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
    c.restore();
    env(); c.lineWidth = K.ow(); c.strokeStyle = shade(cols[0], -0.34); c.stroke();
    R(c, -13.6, 9.6, 27.2, 4.4, 2, shade(p.gold, -0.12));
    /* little flags on the rim */
    for (i = -1; i <= 1; i += 2) Pg(c, [[i * 13.6, 13.6], [i * 13.6, 19.6], [i * (19 + Math.sin(t * 5 + i) * 0.8), 16.6]], i < 0 ? p.accent2 : p.accent);
    c.restore();
    K.cloud(c, -36 + Math.sin(t * 0.4) * 3, 34, 22, 'rgba(255,255,255,0.8)'); K.cloud(c, 38 - Math.sin(t * 0.5) * 3, 14, 16, 'rgba(255,255,255,0.7)');
  });

  Art.add('prop', 'sailboat', function (c, t, p, o) {
    var i, k = pulse(o), rock = Math.sin(t * 1.5) * 0.06, bob = Math.sin(t * 1.5 + 1) * 1.6, hull = p.accent, sea = mix('#3f9fd8', p.accent2, 0.25), bl = 1 + Math.sin(t * 2.2) * 0.04;
    /* far water */
    c.beginPath(); c.ellipse(0, 36, 47, 9, 0, 0, TAU); c.fillStyle = alpha(sea, 0.45); c.fill();
    c.save(); c.translate(0, 28 + bob); c.rotate(rock);
    L(c, 0, -76, 0, 0, 3.4, shade(WOOD, -0.34)); L(c, 0, -76, 0, 0, 2, WOOD);
    /* mainsail and jib belly with the wind */
    c.beginPath(); c.moveTo(3, -72); c.quadraticCurveTo(30 * bl, -40, 34 * bl, -9); c.lineTo(3, -9); c.closePath(); F(c, p.paper);
    c.save(); c.clip(); c.beginPath(); c.moveTo(0, -30); c.quadraticCurveTo(22, -26, 40, -32); c.lineTo(40, -22); c.quadraticCurveTo(22, -16, 0, -20); c.closePath(); c.fillStyle = p.accent2; c.fill(); c.beginPath(); c.moveTo(0, -17); c.quadraticCurveTo(22, -13, 40, -19); c.lineTo(40, -15); c.quadraticCurveTo(22, -9, 0, -13); c.closePath(); c.fillStyle = p.gold; c.fill(); c.beginPath(); c.ellipse(8, -40, 5, 26, 0.12, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill(); c.restore();
    star(c, 14, -42, 5, p.accent, 0.2);
    c.beginPath(); c.moveTo(-3, -66); c.quadraticCurveTo(-20 * bl, -36, -26 * bl, -11); c.lineTo(-3, -11); c.closePath(); F(c, shade(p.paper, -0.07)); L(c, -6, -58, -6.6, -14, 1, shade(p.paper, -0.2));
    /* pennant */
    Pg(c, [[0, -84], [0, -76], [12 + Math.sin(t * 6) * 1.5, -80 + Math.sin(t * 5) * 1]], p.accent);
    /* hull */
    c.beginPath(); c.moveTo(-38, -7); c.lineTo(42, -7); c.quadraticCurveTo(34, 12, 18, 12); c.lineTo(-22, 12); c.quadraticCurveTo(-34, 10, -38, -7); c.closePath(); F(c, hull);
    c.save(); c.clip(); Rn(c, -40, 3, 84, 12, 0, shade(hull, -0.18)); Rn(c, -40, -7, 84, 3.6, 0, p.paper); c.restore();
    for (i = 0; i < 3; i++) { E(c, -16 + i * 14, 2.4, 2.8, 2.8, GLASS); }
    R(c, -24, -13, 18, 6.4, 2, WOOD); L(c, 28, -8, 36, -8, 1.3, STEEL);
    c.restore();
    /* near water: two rows of waves roll past, and a sparkle */
    for (var r = 0; r < 2; r++) { var off = frac(t * (0.12 + r * 0.06)) * 16, y = 32 + r * 6; c.beginPath(); c.moveTo(-50, 48); c.lineTo(-50, y); for (i = -4; i < 5; i++) { var x = i * 16 - off * (r ? 1 : -1) + (r ? 0 : -8); c.quadraticCurveTo(x + 4, y - 5, x + 8, y); c.quadraticCurveTo(x + 12, y + 4, x + 16, y); } c.lineTo(50, y); c.lineTo(50, 48); c.closePath(); c.save(); c.beginPath(); c.ellipse(0, 38, 48, 10, 0, 0, TAU); c.clip(); c.beginPath(); c.moveTo(-50, 48); c.lineTo(-50, y); for (i = -4; i < 5; i++) { var x2 = i * 16 - off * (r ? 1 : -1) + (r ? 0 : -8); c.quadraticCurveTo(x2 + 4, y - 5, x2 + 8, y); c.quadraticCurveTo(x2 + 12, y + 4, x2 + 16, y); } c.lineTo(50, y); c.lineTo(50, 48); c.closePath(); c.fillStyle = r ? shade(sea, -0.12) : sea; c.fill(); c.restore(); }
    L(c, -30, 39, -20, 39, 1.3, 'rgba(255,255,255,0.7)'); L(c, 14, 42, 26, 42, 1.3, 'rgba(255,255,255,0.7)'); K.twinkle(c, 36, 30, 2.6 + k * 2, '#ffffff');
    /* a gull */
    var gx = -32 + Math.sin(t * 0.6) * 4, gy = -30 + Math.cos(t * 0.9) * 2, gf = Math.sin(t * 6) * 2.4; c.beginPath(); c.moveTo(gx - 7, gy - gf); c.quadraticCurveTo(gx - 3, gy - 3, gx, gy); c.quadraticCurveTo(gx + 3, gy - 3, gx + 7, gy - gf); c.lineWidth = 1.6; c.lineCap = 'round'; c.strokeStyle = p.paper; c.stroke();
  });

  Art.add('prop', 'steamtrain', function (c, t, p, o) {
    var i, k = pulse(o), col = p.accent, dk = '#3b3340', wa = t * 3.2, by = -k * 1.2;
    E(c, 0, 37, 47, 4, SHADOW);
    /* the track */
    for (i = -5; i <= 5; i++) Rn(c, i * 9 - 2 + ((-frac(t * 0.6) * 9)) % 9, 36.6, 4, 3, 1, shade(WOOD, -0.25)); L(c, -48, 36, 48, 36, 1.6, STEEL);
    /* puffs from the stack, one on each beat */
    for (i = 0; i < 4; i++) { var f = frac(t * 0.45 + i / 4), px = 24 - f * 46, py = -36 - f * 12 - Math.sin(f * 3) * 4; dot(c, px, py, 4 + f * 9, 'rgba(255,255,255,' + (0.85 * (1 - f)).toFixed(3) + ')'); dot(c, px - 3 - f * 4, py + 2, 3 + f * 6, 'rgba(255,255,255,' + (0.6 * (1 - f)).toFixed(3) + ')'); }
    c.save(); c.translate(0, by);
    /* cab */
    R(c, -42, -30, 30, 50, 3, p.accent2); R(c, -46, -35, 38, 7, 3, shade(p.accent2, -0.22)); R(c, -36, -22, 18, 15, 3, GLASS); L(c, -33, -11, -28, -20, 1.2, 'rgba(255,255,255,0.65)'); Rn(c, -41.4, 8, 28.8, 3, 0, p.gold);
    /* boiler */
    R(c, -13, -12, 50, 32, 9, col); c.save(); K.rrp(c, -13, -12, 50, 32, 9); c.clip(); Rn(c, -13, 8, 50, 14, 0, shade(col, -0.16)); Rn(c, -13, -12, 50, 5, 0, shade(col, 0.25)); Rn(c, 2, -12, 3.4, 32, 0, p.gold); Rn(c, 18, -12, 3.4, 32, 0, p.gold); c.restore();
    E(c, 37, 4, 5.6, 15.6, shade(col, -0.2)); dot(c, 38, 4, 5 + k * 1.6, 'rgba(255,240,170,0.35)'); E(c, 38.4, 4, 3.4, 3.4, '#fff3b8');
    /* stack, dome, whistle */
    Pg(c, [[19, -12], [29, -12], [31, -31], [17, -31]], dk); R(c, 14.6, -35, 18.8, 5.6, 2.6, dk); Rn(c, 16, -34, 16, 1.6, 0.8, '#6b6474');
    c.beginPath(); c.arc(4, -12, 6.6, PI, 0); c.closePath(); F(c, p.gold); R(c, -8, -18, 3, 6.4, 1, p.gold); dot(c, -6.5, -19.6, 2, shade(p.gold, 0.3));
    /* running board and cow-catcher */
    R(c, -44, 19, 86, 5.4, 2.4, dk); Pg(c, [[40, 19], [49, 33], [38, 33]], dk); L(c, 42, 23, 45.6, 32, 0.9, STEEL);
    heart(c, -3, 4, 9, p.paper, true);
    c.restore();
    /* wheels and the rod that drives them */
    wheel2(c, -30, 27, 9.6, col, wa); wheel2(c, -6, 27, 9.6, col, wa); wheel2(c, 17, 29.6, 7, col, wa * 1.37); wheel2(c, 33, 29.6, 7, col, wa * 1.37 + 1);
    var rx = Math.cos(wa) * 5.2, ry = Math.sin(wa) * 5.2; L(c, -30 + rx, 27 + ry, -6 + rx, 27 + ry, 3.4, shade(STEEL, -0.34)); L(c, -30 + rx, 27 + ry, -6 + rx, 27 + ry, 2, STEEL); dot(c, -30 + rx, 27 + ry, 1.6, p.gold); dot(c, -6 + rx, 27 + ry, 1.6, p.gold);
  });

  Art.add('prop', 'tent', function (c, t, p, o) {
    var i, k = pulse(o), col = p.accent, in1 = mix(p.ink, '#2a1c3a', 0.5), fl = Math.sin(t * 1.6) * 1.4;
    E(c, 0, 40, 47, 6, mix(LEAFG, p.accent2, 0.3)); c.beginPath(); c.ellipse(0, 41.6, 40, 3.6, 0, 0, TAU); c.fillStyle = 'rgba(0,0,0,0.1)'; c.fill();
    /* a pine behind, guy ropes and pegs */
    K.pine(c, -33, 36, 46, shade(p.accent2, -0.12), null, 3); K.pine(c, 37, 37, 30, p.accent2, null, 3);
    L(c, -30, 2, -45, 36, 0.9, '#7a6a5a'); L(c, 30, 2, 45, 36, 0.9, '#7a6a5a'); L(c, -46.4, 33, -43.6, 39, 2, WOOD); L(c, 46.4, 33, 43.6, 39, 2, WOOD);
    /* the tent: two roof panels and a dark doorway with a glow */
    Pg(c, [[0, -30], [38, 38], [-38, 38]], col);
    Pg(c, [[0, -30], [38, 38], [15, 38]], shade(col, -0.16), true);
    c.beginPath(); c.moveTo(0, -30); c.lineTo(-38, 38); c.lineTo(-30.6, 38); c.lineTo(0, -17); c.closePath(); c.fillStyle = shade(col, 0.2); c.fill();
    Pg(c, [[0, -12], [15, 38], [-15, 38]], in1);
    c.save(); c.beginPath(); c.moveTo(0, -12); c.lineTo(15, 38); c.lineTo(-15, 38); c.closePath(); c.clip(); dot(c, 0, 38, 15 + k * 2, 'rgba(255,214,120,0.5)'); dot(c, 0, 38, 8.6, 'rgba(255,236,170,0.75)');
    /* a sleeping bag and a lantern inside */
    R(c, -11, 30, 16, 7, 3.4, p.accent2); E(c, -11.6, 33.4, 3, 3, '#f6cfa8'); R(c, 6, 28, 5, 8, 1.4, p.gold); dot(c, 8.5, 32, 1.6, '#fff8d8'); c.restore();
    /* the flap, tied back */
    c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(-14 + fl * 0.3, 10, -17.6, 38); c.lineTo(-10, 38); c.quadraticCurveTo(-11 + fl * 0.3, 14, 0, -12); c.closePath(); F(c, shade(col, 0.32)); dot(c, -12.4 + fl * 0.2, 20, 1.5, p.gold);
    for (i = 0; i < 5; i++) Pg(c, [[-31 + i * 3.2 * 0 + i * 13.4 - 0, 38], [-31 + i * 13.4 + 6.7, 38], [-31 + i * 13.4 + 3.3, 43]], p.gold, true);
    L(c, 0, -30, 0, -40, 1.4, WOOD); Pg(c, [[0, -41], [0, -33.4], [11 + Math.sin(t * 5) * 1.2, -37 + Math.sin(t * 4) * 0.8]], p.gold);
    /* fireflies and a star */
    for (i = 0; i < 3; i++) { var fx = [-26, 27, 12][i] + Math.sin(t * 0.9 + i * 2) * 4, fy = [-16, -8, -38][i] + Math.cos(t * 1.2 + i) * 3, fa = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.6 + i * 1.3)); dot(c, fx, fy, 3.2, alpha('#fff3a0', 0.25 * fa)); dot(c, fx, fy, 1.2, alpha('#fff8c8', fa)); }
    K.twinkle(c, -18, -36, 3.4 + Math.sin(t * 3) * 1.4, p.snow);
  });

  Art.add('prop', 'campfire', function (c, t, p, o) {
    var i, k = pulse(o), lg = '#8a5a34', st = '#9aa3ad';
    c.beginPath(); c.ellipse(0, 36, 46, 9, 0, 0, TAU); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fill();
    dot(c, 0, 4, 40 + k * 4, 'rgba(255,170,60,0.13)'); dot(c, 0, 8, 28 + k * 3, 'rgba(255,200,90,0.16)');
    /* sparks rise */
    for (i = 0; i < 7; i++) { var f = frac(t * 0.5 + i * 0.143), sx = Math.sin(i * 2.4 + f * 4) * (6 + f * 14), sy = -8 - f * 42; dot(c, sx, sy, 1.5 * (1 - f) + 0.4, alpha(i % 2 ? '#ffd166' : '#ff8a1f', 1 - f)); }
    /* a ring of stones behind */
    for (i = 0; i < 5; i++) E(c, -28 + i * 14, 26 + Math.abs(i - 2) * 1.4, 7.6, 5, shade(st, -0.12 + (i % 2) * 0.1));
    /* logs: a little teepee and two crossed */
    function log(x, y, len, rot, w) { c.save(); c.translate(x, y); c.rotate(rot); R(c, -len / 2, -w / 2, len, w, w * 0.4, lg); L(c, -len / 2 + 3, -w * 0.18, len / 2 - 5, -w * 0.18, 0.8, shade(lg, 0.3)); L(c, -len / 4, w * 0.2, len / 5, w * 0.2, 0.7, shade(lg, -0.25)); E(c, len / 2, 0, w * 0.3, w * 0.5, '#e6c79a'); c.beginPath(); c.ellipse(len / 2, 0, w * 0.14, w * 0.26, 0, 0, TAU); c.lineWidth = 0.6; c.strokeStyle = shade('#e6c79a', -0.3); c.stroke(); c.restore(); }
    log(-10, 22, 40, -1.05, 7.4); log(10, 22, 40, 1.05 + PI, 7.4);
    /* the fire */
    K.flame(c, -9, 28, 16, 34 + k * 5, t, 0.3); K.flame(c, 10, 28, 15, 30 + k * 4, t, 2.1); K.flame(c, 0, 29, 24, 52 + k * 8, t, 1.1);
    c.save(); c.globalAlpha = 0.9; c.beginPath(); var wb = Math.sin(t * 8) * 1.6; c.moveTo(-5, 28); c.bezierCurveTo(-8, 18, wb - 1, 14, wb, 6); c.bezierCurveTo(wb + 1, 14, 8, 18, 5, 28); c.closePath(); c.fillStyle = '#fff6c8'; c.fill(); c.restore();
    log(-2, 31, 50, 0.14, 8.4); log(3, 33.6, 46, -0.2 + PI, 8);
    for (i = 0; i < 6; i++) { if (i === 2 || i === 3) continue; E(c, -35 + i * 14, 36.6 - Math.abs(i - 2.5) * 0.4, 8.6, 5.6, i % 2 ? st : shade(st, 0.18)); L(c, -38.6 + i * 14, 34.4, -34 + i * 14, 33.4, 1, 'rgba(255,255,255,0.45)'); }
    /* a marshmallow on a stick, turning gold */
    c.save(); c.translate(49, 26); c.rotate(0.5 + Math.sin(t * 1.7) * 0.05); L(c, 0, 0, -46, 0, 2.4, shade(WOOD, -0.34)); L(c, 0, 0, -46, 0, 1.3, WOOD); R(c, -52, -4.4, 10, 8.8, 3, mix('#ffffff', '#e8b060', 0.25 + 0.2 * Math.sin(t * 0.7))); c.restore();
  });

  Art.add('prop', 'canoe', function (c, t, p, o) {
    var i, k = pulse(o), col = p.accent, sea = mix('#3f9fd8', p.accent2, 0.3), rock = Math.sin(t * 1.4) * 0.035, bob = Math.sin(t * 1.4 + 1) * 1.3;
    c.beginPath(); c.ellipse(0, 24, 48, 13, 0, 0, TAU); c.fillStyle = alpha(sea, 0.5); c.fill();
    /* ripples spread from the hull */
    for (i = 0; i < 2; i++) { var f = frac(t * 0.35 + i * 0.5); c.beginPath(); c.ellipse(0, 25, 30 + f * 17, 4 + f * 7, 0, 0, TAU); c.lineWidth = 1.1; c.strokeStyle = alpha('#ffffff', 0.55 * (1 - f)); c.stroke(); }
    /* reeds */
    for (i = 0; i < 3; i++) { var rx = -43 + i * 4.4, sw = Math.sin(t * 1.2 + i) * 2; c.beginPath(); c.moveTo(rx, 26); c.quadraticCurveTo(rx + sw * 0.4, 6, rx + sw, -10 - i * 5); c.lineWidth = 1.3; c.strokeStyle = shade(LEAFG, -0.15); c.stroke(); R(c, rx + sw - 1.5, -20 - i * 5, 3, 10, 1.5, '#7a4a2a'); }
    c.save(); c.translate(0, 12 + bob); c.rotate(rock);
    /* far gunwale, the load, then the near side */
    c.beginPath(); c.moveTo(-46, -8); c.quadraticCurveTo(0, -1, 46, -8); c.quadraticCurveTo(0, 6, -46, -8); c.closePath(); F(c, shade(col, -0.3));
    R(c, -22, -15, 16, 13, 3.4, p.accent2); Rn(c, -22, -10, 16, 2.2, 0, p.gold); R(c, -17, -18, 6, 4, 2, shade(p.accent2, -0.2));
    R(c, 0, -11, 12, 8, 2, WOOD); L(c, 0, -7, 12, -7, 0.7, shade(WOOD, -0.25)); E(c, 18, -8, 6, 5, p.gold); L(c, 13, -9.4, 23, -9.4, 0.8, shade(p.gold, -0.3));
    /* a lantern on a pole at the bow */
    L(c, 33, -8, 33, -27, 1.3, shade(WOOD, -0.2)); dot(c, 33, -29, 6 + k * 2, 'rgba(255,230,150,0.3)'); R(c, 30.4, -33, 5.2, 7.4, 1.4, p.gold); dot(c, 33, -29.4, 1.5, '#fff8d8');
    c.beginPath(); c.moveTo(-48, -10); c.quadraticCurveTo(0, 2, 48, -10); c.quadraticCurveTo(40, 13, 22, 14); c.lineTo(-22, 14); c.quadraticCurveTo(-40, 13, -48, -10); c.closePath(); F(c, col);
    c.save(); c.clip(); Rn(c, -50, 6, 100, 10, 0, shade(col, -0.16)); c.beginPath(); c.moveTo(-50, -8); c.quadraticCurveTo(0, 5, 50, -8); c.lineWidth = 3.4; c.strokeStyle = p.paper; c.stroke(); for (i = -2; i <= 2; i++) Pg(c, [[i * 13 - 3.4, 5], [i * 13, 0.4], [i * 13 + 3.4, 5], [i * 13, 9.6]], p.gold, true); c.restore();
    /* the paddle rests across, dripping */
    c.save(); c.translate(-6, -8); c.rotate(-0.32 + Math.sin(t * 1.4) * 0.03); L(c, -30, 0, 26, 0, 3.4, shade(WOOD, -0.34)); L(c, -30, 0, 26, 0, 2, WOOD); c.beginPath(); c.ellipse(-37, 0, 9, 5, 0, 0, TAU); F(c, shade(WOOD, 0.2)); R(c, 25, -3, 5, 6, 2, shade(WOOD, -0.15)); c.restore();
    c.restore();
    var df = frac(t * 0.7); dot(c, -41, 14 + df * 12, 1.4 * (1 - df * 0.4), alpha('#bfe6ff', 1 - df));
    /* near water over the keel */
    c.save(); c.beginPath(); c.ellipse(0, 26, 48, 12, 0, 0, TAU); c.clip(); var off = frac(t * 0.14) * 16, y = 23 + bob * 0.3; c.beginPath(); c.moveTo(-50, 44); c.lineTo(-50, y); for (i = -4; i < 5; i++) { var x = i * 16 - off; c.quadraticCurveTo(x + 4, y - 3.4, x + 8, y); c.quadraticCurveTo(x + 12, y + 3, x + 16, y); } c.lineTo(50, y); c.lineTo(50, 44); c.closePath(); c.fillStyle = sea; c.fill(); c.restore();
    L(c, -28, 30, -16, 30, 1.2, 'rgba(255,255,255,0.7)'); L(c, 10, 33, 24, 33, 1.2, 'rgba(255,255,255,0.7)'); K.twinkle(c, 38, 24, 2.4 + k * 1.8, '#ffffff');
  });

});
