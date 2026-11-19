/* Send a Carol art pack: outdoors and sky props (the beach, the desert, space, the sea, the fair, days out, and the small pieces that float in or cross the sky). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var SHADOW = 'rgba(0,0,0,0.14)', WOOD = '#b98a5a', STEEL = '#cfd5dc', GLASS = '#bfe6f7', LEAFG = '#57b36f', SAND = '#ecd29a', TYRE = '#2a2a30';

  /* the current path as a tube: a dark outline under a coloured line */
  function tube(c, w, col) { c.lineCap = 'round'; c.lineJoin = 'round'; if (K.ow() > 0) { c.lineWidth = w + K.ow() * 1.7; c.strokeStyle = shade(col, -0.34); c.stroke(); } c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  function pulse(o) { return Math.exp(-5 * o.beat); }
  function star(c, x, y, r, col, rot) { K.starPath(c, x, y, r, r * 0.45, 5, rot || 0); c.fillStyle = col; c.fill(); }
  function plain(fn) { var s = K.ow(); K.ow(0); try { fn(); } finally { K.ow(s); } }
  function sandpile(c, y, w, p) { var s = mix(SAND, p.bg2, 0.15); c.beginPath(); c.moveTo(-w, y + 6); c.quadraticCurveTo(-w * 0.6, y - 5, 0, y - 4); c.quadraticCurveTo(w * 0.7, y - 5, w, y + 6); c.closePath(); F(c, s); dot(c, -w * 0.5, y + 1.5, 0.9, shade(s, -0.2)); dot(c, w * 0.3, y + 2.4, 0.9, shade(s, -0.2)); dot(c, w * 0.62, y + 3, 0.7, shade(s, -0.2)); return s; }
  /* a flag on a pole top at (x, y), waving */
  function flag(c, x, y, w, h, col, t, s) { s = s || 1; var a = Math.sin(t * 5) * h * 0.22, b = Math.sin(t * 5 + 1.6) * h * 0.22; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * w * 0.5, y - a, x + s * w, y + h * 0.5 + b); c.quadraticCurveTo(x + s * w * 0.5, y + h - a, x, y + h); c.closePath(); F(c, col); }

  /* ---------- the beach and the desert ---------- */
  Art.add('prop', 'surfboard', function (c, t, p, o) {
    var k = pulse(o), col = p.accent, i;
    E(c, 4, 44, 30, 3.6, SHADOW);
    c.save(); c.translate(0, 40); c.rotate(0.16 + Math.sin(t * 1.5) * 0.02); c.translate(0, -40 - k * 1.2);
    /* the fin peeking out behind */
    Pg(c, [[10, 26], [22, 36], [10, 36]], shade(col, -0.3));
    c.beginPath(); c.moveTo(0, -48); c.bezierCurveTo(19, -34, 19, 20, 9, 42); c.lineTo(-9, 42); c.bezierCurveTo(-19, 20, -19, -34, 0, -48); c.closePath(); F(c, p.paper);
    c.save(); c.clip();
    Rn(c, -22, -6, 44, 14, 0, col); Rn(c, -22, 10, 44, 5, 0, p.gold); Rn(c, -22, -50, 44, 16, 0, p.accent2); Rn(c, -22, -35.5, 44, 2.6, 0, p.gold);
    Rn(c, -2, -50, 4, 96, 0, mix(WOOD, p.paper, 0.2));
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-9, -8, 3, 30, 0.06, 0, TAU); c.fill();
    c.restore();
    c.beginPath(); c.moveTo(0, -48); c.bezierCurveTo(19, -34, 19, 20, 9, 42); c.lineTo(-9, 42); c.bezierCurveTo(-19, 20, -19, -34, 0, -48); c.closePath(); c.lineWidth = K.ow(); c.strokeStyle = shade(p.paper, -0.4); c.stroke();
    /* a hibiscus on the deck */
    plain(function () { K.flower(c, 0, 1, 7.5, p.paper, p.gold, t * 0.3); });
    c.restore();
    var s = sandpile(c, 40, 30, p);
    /* a starfish and a shell */
    K.starPath(c, -20, 40, 6.5, 3, 5, 0.3 + Math.sin(t * 2) * 0.06); F(c, mix(p.accent, '#ffb07a', 0.5)); dot(c, -20, 40, 1, shade(s, 0.4));
    E(c, 22, 41.5, 4.4, 3.4, shade(p.paper, -0.04)); for (i = -1; i <= 1; i++) L(c, 22, 44, 22 + i * 2.6, 39.4, 0.6, shade(p.paper, -0.3));
  });

  function frond(c, a, len, col, sw) {
    c.save(); c.rotate(a + sw);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.42, len, len * 0.16); c.quadraticCurveTo(len * 0.55, -len * 0.08, 0, 5); c.closePath(); F(c, col);
    c.beginPath(); c.moveTo(2, 1); c.quadraticCurveTo(len * 0.5, -len * 0.26, len * 0.92, len * 0.12); c.lineWidth = 0.8; c.strokeStyle = shade(col, 0.28); c.stroke();
    c.restore();
  }
  Art.add('prop', 'palmtree', function (c, t, p, o) {
    var i, sw = Math.sin(t * 1.3) * 0.05, tr = mix(WOOD, '#8a5a2e', 0.35), g = mix(LEAFG, p.accent2, 0.35), k = pulse(o);
    E(c, 0, 44, 36, 3.6, SHADOW);
    /* the curved trunk, in rings */
    for (i = 0; i <= 9; i++) { var f = i / 9, x = -8 + 16 * f * f + sw * 30 * f * f, y = 38 - 62 * f, w = 6.2 - f * 2.2; c.save(); c.translate(x, y); c.rotate(0.28 * f + sw * f); R(c, -w, -4.4, w * 2, 8.4, 2.6, i % 2 ? tr : shade(tr, 0.14)); c.restore(); }
    sandpile(c, 40, 32, p);
    c.save(); c.translate(8 + sw * 30, -26 - k * 1);
    var A = [0.5, -0.1, -0.75], Ln = [28, 36, 33];
    for (i = 0; i < 3; i++) { c.save(); c.scale(-1, 1); frond(c, A[i] - 0.1, Ln[i] - 2, i % 2 ? g : shade(g, -0.12), -sw * (1 + i * 0.3)); c.restore(); frond(c, A[i], Ln[i], i % 2 ? shade(g, -0.12) : g, sw * (1 + i * 0.3)); }
    frond(c, -1.45, 24, shade(g, 0.14), sw);
    for (i = 0; i < 3; i++) { K.ball(c, [-4, 3.4, -0.4][i], [4, 4.6, 8.4][i], 4, 4, '#7a4a2a'); }
    c.restore();
    /* a little crab waves from the sand */
    c.save(); c.translate(22, 40 - Math.abs(Math.sin(t * 4)) * 1); L(c, -4, 0, -7, -3 - Math.sin(t * 6) * 1.2, 1.2, shade(p.accent, -0.2)); L(c, 4, 0, 7, -3 + Math.sin(t * 6) * 1.2, 1.2, shade(p.accent, -0.2)); E(c, 0, 0, 4.6, 3.2, p.accent); dot(c, -1.5, -0.8, 0.7, '#2b2118'); dot(c, 1.5, -0.8, 0.7, '#2b2118'); c.restore();
  });

  Art.add('prop', 'beachumbrella', function (c, t, p, o) {
    var i, k = pulse(o), cols = [p.accent, p.paper], n = 6, r = 40;
    E(c, 0, 44, 38, 3.6, SHADOW);
    /* a towel and a ball on the sand */
    var s = sandpile(c, 40, 40, p);
    Pg(c, [[4, 37], [34, 35], [38, 41], [8, 43]], p.accent2); L(c, 13, 36.6, 16.6, 42.4, 2.2, p.paper); L(c, 24, 35.8, 27.6, 41.6, 2.2, p.paper);
    c.save(); c.translate(-25, 35 - Math.abs(Math.sin(t * 3.2)) * 2.4); c.rotate(t * 1.4); E(c, 0, 0, 7.4, 7.4, p.paper); plain(function () { for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 7.2, i * 2.094, i * 2.094 + 1.047); c.closePath(); c.fillStyle = [p.accent, p.gold, p.accent2][i]; c.fill(); } }); dot(c, 0, 0, 1.5, p.paper); c.restore();
    c.save(); c.translate(0, 40); c.rotate(-0.2 + Math.sin(t * 1.4) * 0.025); c.translate(0, -40);
    L(c, 0, 40, 0, -30, 4.2, shade(WOOD, -0.34)); L(c, 0, 40, 0, -30, 2.6, mix(WOOD, p.paper, 0.4));
    c.translate(0, -8 - k * 1.2);
    /* the canopy: six panels with a scalloped hem */
    for (i = 0; i < n; i++) {
      var x0 = -r + i * (2 * r / n), x1 = x0 + 2 * r / n, y0 = -Math.sqrt(Math.max(0, 1 - Math.pow(x0 / r, 2))) * 30, y1 = -Math.sqrt(Math.max(0, 1 - Math.pow(x1 / r, 2))) * 30;
      c.beginPath(); c.moveTo(0, -34); c.quadraticCurveTo(x0 * 0.9, -32 - (i < 3 ? 0 : 0), x0, 0); c.quadraticCurveTo((x0 + x1) / 2, 6, x1, 0); c.quadraticCurveTo(x1 * 0.9, -32, 0, -34); c.closePath(); F(c, i % 2 ? shade(cols[1], i > 3 ? -0.08 : 0) : shade(cols[0], i > 3 ? -0.12 : 0));
    }
    c.beginPath(); c.moveTo(-22, -22); c.quadraticCurveTo(-30, -14, -33, -5); c.lineWidth = 2.4; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();
    E(c, 0, -35, 2.8, 2.8, p.gold);
    c.restore();
  });

  Art.add('prop', 'sandcastle', function (c, t, p, o) {
    var i, j, s = mix(SAND, p.bg2, 0.12), dk = shade(s, -0.16), k = pulse(o);
    E(c, 0, 44, 42, 3.6, SHADOW);
    c.beginPath(); c.moveTo(-46, 44); c.quadraticCurveTo(-30, 30, 0, 31); c.quadraticCurveTo(30, 30, 46, 44); c.closePath(); F(c, shade(s, 0.1));
    function tower(x, y, w, h) { R(c, x - w / 2, y - h, w, h, 1.5, s); Rn(c, x + w * 0.12, y - h + 0.6, w * 0.38 - 0.6, h - 1.2, 1, dk); for (j = -1; j <= 1; j++) R(c, x + j * w * 0.36 - w * 0.14, y - h - 5, w * 0.28, 6.4, 1, s); }
    tower(-26, 36, 17, 34); tower(26, 36, 17, 34);
    R(c, -19, 6, 38, 30, 1.5, s); for (i = -2; i <= 2; i++) R(c, i * 8 - 2.6, 1.4, 5.2, 6, 1, s);
    tower(0, 8, 19, 30);
    /* the gate, windows and a line of shells */
    c.beginPath(); c.moveTo(-6.5, 36); c.lineTo(-6.5, 23); c.arc(0, 23, 6.5, PI, 0); c.lineTo(6.5, 36); c.closePath(); F(c, shade(s, -0.42));
    for (i = -1; i <= 1; i += 2) { Rn(c, i * 26 - 2, 12, 4, 7, 2, shade(s, -0.42)); }
    Rn(c, -2.2, -12, 4.4, 8, 2.2, shade(s, -0.42));
    for (i = -1; i <= 1; i += 2) { dot(c, i * 13, 14, 1.8, p.paper); dot(c, i * 13, 20, 1.4, mix(p.accent, p.paper, 0.5)); }
    for (i = 0; i < 9; i++) dot(c, -36 + i * 9 + (i % 2), 39.5 + (i % 3) * 0.8, 0.8, dk);
    /* flags */
    L(c, 0, -27, 0, -43 - k * 1, 1.3, '#7a6a5a'); flag(c, 0, -43 - k * 1, 14, 8, p.accent, t);
    L(c, -26, -3, -26, -13, 1.1, '#7a6a5a'); flag(c, -26, -13, 9, 5.4, p.accent2, t + 1);
    L(c, 26, -3, 26, -13, 1.1, '#7a6a5a'); flag(c, 26, -13, 9, 5.4, p.gold, t + 2);
    /* the bucket and spade */
    c.save(); c.translate(-38, 37); c.rotate(-0.12); Pg(c, [[-6, -8], [6, -8], [4.4, 4], [-4.4, 4]], p.accent2); R(c, -7, -9.6, 14, 3, 1.4, shade(p.accent2, 0.25)); c.beginPath(); c.arc(0, -9, 6, PI, 0); c.lineWidth = 0.9; c.strokeStyle = '#7a6a5a'; c.stroke(); c.restore();
    c.save(); c.translate(39, 38); c.rotate(0.5); L(c, 0, -10, 0, 0, 1.8, p.accent); R(c, -3, -1, 6, 7.4, 2.4, p.gold); c.restore();
  });

  Art.add('prop', 'cactus', function (c, t, p, o) {
    var g = mix('#4fa56a', p.accent2, 0.3), dk = shade(g, -0.16), i, k = pulse(o), sw = Math.sin(t * 1.6) * 0.02, R0 = rnd('cactus');
    E(c, 0, 44, 34, 3.6, SHADOW);
    c.save(); c.translate(0, 40); c.rotate(sw); c.translate(0, -40);
    /* arms first, then the trunk over their shoulders */
    c.beginPath(); c.moveTo(-10, 10); c.lineTo(-22, 10); c.quadraticCurveTo(-27, 10, -27, 5); c.lineTo(-27, -10 - k); tube(c, 11, g);
    c.beginPath(); c.moveTo(10, 0); c.lineTo(21, 0); c.quadraticCurveTo(26, 0, 26, -5); c.lineTo(26, -24 - k); tube(c, 10, g);
    R(c, -12, -42, 24, 84, 12, g);
    c.save(); K.rrp(c, -12, -42, 24, 84, 12); c.clip(); Rn(c, 3, -44, 12, 90, 0, dk); c.restore();
    for (i = -1; i <= 1; i++) L(c, i * 5.6, -34, i * 5.6, 36, 0.8, shade(g, i > 0 ? -0.3 : 0.2));
    c.strokeStyle = shade(p.paper, -0.02); c.lineWidth = 0.7;
    for (i = 0; i < 16; i++) { var x = (R0() - 0.5) * 18, y = -34 + R0() * 66; c.beginPath(); c.moveTo(x - 1.2, y - 1.2); c.lineTo(x + 1.2, y + 1.2); c.moveTo(x + 1.2, y - 1.2); c.lineTo(x - 1.2, y + 1.2); c.stroke(); }
    for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-27 - 1.2, -4 + i * 5); c.lineTo(-27 + 1.2, -2 + i * 5); c.moveTo(26 - 1.2, -18 + i * 6); c.lineTo(26 + 1.2, -16 + i * 6); c.stroke(); }
    /* flowers */
    plain(function () { K.flower(c, 0, -43, 6.4 + k * 0.8, mix(p.accent, '#ff9ab8', 0.45), p.gold, t * 0.3); K.flower(c, -27, -17 - k, 4.2, p.gold, p.paper, 1); K.flower(c, 26, -30 - k, 4.4, mix(p.accent, '#ff9ab8', 0.45), p.gold, 2); });
    c.restore();
    var s = sandpile(c, 40, 32, p);
    E(c, -22, 40, 6, 4, shade(s, -0.28)); E(c, -15, 41.5, 3.6, 2.6, shade(s, -0.2)); E(c, 24, 41, 4.4, 3, shade(s, -0.28));
    Pg(c, [[14, 40], [15.4, 33], [17, 40]], LEAFG, true); Pg(c, [[16, 40], [19, 34.6], [19.4, 40]], shade(LEAFG, -0.12), true);
  });

  /* ---------- space ---------- */
  Art.add('prop', 'rocketship', function (c, t, p, o) {
    var i, k = pulse(o), body = p.paper, fin = p.accent, R0 = rnd('rk');
    c.save(); c.rotate(0.5 + Math.sin(t * 1.3) * 0.03); c.translate(Math.sin(t * 17) * 0.4, Math.sin(t * 2.1) * 1.6);
    /* the exhaust: flame and puffs trailing behind */
    for (i = 0; i < 5; i++) { var f = frac(t * 0.9 + i / 5), px = (R0() - 0.5) * 16 * f; dot(c, px, 34 + f * 22, 3 + f * 5, alpha(p.snow, 0.55 * (1 - f))); }
    K.flame(c, 0, 26, 17 + k * 3, -1, t, 0);
    c.save(); c.translate(0, 26); c.scale(1, -1); K.flame(c, 0, 0, 16 + k * 3, 24 + k * 6, t, 0.7); c.restore();
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * 12, 6); c.quadraticCurveTo(i * 30, 14, i * 27, 32); c.lineTo(i * 12, 24); c.closePath(); F(c, fin); }
    c.beginPath(); c.moveTo(0, -46); c.bezierCurveTo(22, -26, 19, 10, 13, 27); c.lineTo(-13, 27); c.bezierCurveTo(-19, 10, -22, -26, 0, -46); c.closePath(); F(c, body);
    c.save(); c.clip(); Rn(c, 5, -48, 20, 78, 0, shade(body, -0.1)); c.beginPath(); c.arc(0, -52, 22, 0, TAU); c.fillStyle = fin; c.fill(); Rn(c, -22, 17, 44, 4.4, 0, p.accent2); Rn(c, -22, 23, 44, 6, 0, shade(fin, -0.1)); c.restore();
    c.beginPath(); c.moveTo(0, -46); c.bezierCurveTo(22, -26, 19, 10, 13, 27); c.lineTo(-13, 27); c.bezierCurveTo(-19, 10, -22, -26, 0, -46); c.closePath(); c.lineWidth = K.ow(); c.strokeStyle = shade(body, -0.4); c.stroke();
    Pg(c, [[-3, 12], [3, 12], [2.4, 33], [-2.4, 33]], shade(fin, -0.14));
    E(c, 0, -9, 10, 10, p.gold); E(c, 0, -9, 7, 7, GLASS); K.shine(c, -2.4, -11.6, 2.6);
    dot(c, 0, 8, 1.6, shade(body, -0.3)); dot(c, -6, 8, 1.2, shade(body, -0.3)); dot(c, 6, 8, 1.2, shade(body, -0.3));
    c.restore();
    K.twinkle(c, -34, -30, 4 + Math.sin(t * 3) * 1.6, p.snow); K.twinkle(c, 38, 8, 3 + Math.cos(t * 3.4) * 1.4, p.snow); star(c, -38, 10, 3, p.gold, t * 0.5);
  });

  Art.add('prop', 'ufo', function (c, t, p, o) {
    var i, k = pulse(o), hull = mix(STEEL, p.accent2, 0.3), bob = Math.sin(t * 1.8) * 2.4;
    /* the beam */
    var g = c.createLinearGradient(0, 0, 0, 46); g.addColorStop(0, alpha(p.gold, 0.55)); g.addColorStop(1, alpha(p.gold, 0.04));
    c.beginPath(); c.moveTo(-11, -2 + bob); c.lineTo(11, -2 + bob); c.lineTo(27, 46); c.lineTo(-27, 46); c.closePath(); c.fillStyle = g; c.fill();
    for (i = 0; i < 3; i++) { var f = frac(t * 0.5 + i / 3); K.twinkle(c, [-8, 7, 0][i], 40 - f * 34, 2.6 * Math.sin(f * PI), alpha(p.snow, 0.9)); }
    c.save(); c.translate(0, -12 + bob); c.rotate(Math.sin(t * 1.3) * 0.05);
    /* the dome with a little visitor */
    c.beginPath(); c.arc(0, -4, 18, PI, 0); c.closePath(); F(c, GLASS);
    c.save(); c.beginPath(); c.arc(0, -4, 17, PI, 0); c.clip();
    var al = mix('#7fd67a', p.accent2, 0.25); E(c, 0, -6, 7.6, 8.4, al); L(c, -3, -13, -6, -18.5, 1.1, shade(al, -0.3)); L(c, 3, -13, 6, -18.5, 1.1, shade(al, -0.3)); dot(c, -6, -18.5, 1.5, p.gold); dot(c, 6, -18.5, 1.5, p.gold);
    E(c, -3, -7.4, 1.9, 2.5, '#2b2118'); E(c, 3, -7.4, 1.9, 2.5, '#2b2118'); dot(c, -2.4, -8.2, 0.7, '#fff'); dot(c, 3.6, -8.2, 0.7, '#fff');
    c.beginPath(); c.arc(0, -4.4, 2.4, 0.2 * PI, 0.8 * PI); c.lineWidth = 0.8; c.strokeStyle = '#2b2118'; c.stroke();
    c.restore();
    c.beginPath(); c.arc(0, -4, 13, PI * 1.12, PI * 1.4); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    E(c, 0, 2, 42, 11, hull); c.beginPath(); c.ellipse(0, -0.5, 36, 6.4, 0, 0, TAU); c.fillStyle = shade(hull, 0.22); c.fill();
    E(c, 0, 10, 15, 4.4, shade(hull, -0.25));
    for (i = -3; i <= 3; i++) { var on = ((i + 3 + o.n) % 2 === 0); dot(c, i * 10.6, 4.4 - Math.abs(i) * 0.9, 2.6 + (on ? k * 0.8 : 0), on ? p.gold : p.accent); dot(c, i * 10.6 - 0.7, 3.7 - Math.abs(i) * 0.9, 0.9, 'rgba(255,255,255,0.7)'); }
    c.restore();
  });

  Art.add('prop', 'planet', function (c, t, p, o) {
    var i, col = mix(p.accent, p.gold, 0.45), ring = p.paper, tilt = -0.36 + Math.sin(t * 0.8) * 0.03, k = pulse(o);
    function ringHalf(back) { c.save(); c.scale(1, 0.3); c.beginPath(); c.arc(0, 0, 44, back ? PI : 0, back ? TAU : PI); c.lineWidth = 9.6; c.strokeStyle = shade(ring, -0.42); c.lineCap = 'butt'; c.stroke(); c.lineWidth = 7.4; c.strokeStyle = back ? shade(ring, -0.16) : ring; c.stroke(); c.beginPath(); c.arc(0, 0, 44, back ? PI : 0, back ? TAU : PI); c.lineWidth = 1.6; c.strokeStyle = mix(p.accent2, ring, 0.3); c.stroke(); c.restore(); }
    K.glow(c, 0, 0, 50, p.snow, 0.16);
    c.save(); c.rotate(tilt);
    ringHalf(true);
    E(c, 0, 0, 27, 27, col);
    c.save(); c.beginPath(); c.arc(0, 0, 26.4, 0, TAU); c.clip();
    Rn(c, -30, -15, 60, 6, 3, shade(col, 0.24)); Rn(c, -30, -3, 60, 8.4, 4, shade(col, -0.14)); Rn(c, -30, 11, 60, 4.6, 2.3, shade(col, 0.16)); Rn(c, -14, 4.6, 34, 3, 1.5, shade(col, 0.3));
    E(c, 9 + Math.sin(t * 0.5) * 3, -9, 6, 3.4, mix(p.accent, col, 0.3));
    c.beginPath(); c.arc(8, 8, 30, 0, TAU); c.arc(0, 0, 40, 0, TAU, true); c.fillStyle = 'rgba(30,20,50,0.2)'; c.fill();
    c.restore(); K.shine(c, -11, -14, 5.4);
    ringHalf(false);
    /* a little moon on its round */
    var a = t * 0.9; if (Math.sin(a) > -0.2) { K.ball(c, Math.cos(a) * 40, Math.sin(a) * 12 - 22, 4.4, 4.4, shade(p.paper, -0.08)); }
    c.restore();
    K.twinkle(c, -36, -32, 4.4 + Math.sin(t * 3) * 1.8 + k, p.snow); K.twinkle(c, 36, 30, 3 + Math.cos(t * 3.6) * 1.4, p.snow); dot(c, 30, -36, 1.3, p.snow); dot(c, -40, 22, 1.1, p.snow);
  });

  Art.add('prop', 'telescope', function (c, t, p, o) {
    var i, brass = p.gold, tb = mix(p.accent, '#3b3340', 0.25), k = pulse(o), a = -0.62 + Math.sin(t * 0.9) * 0.05;
    E(c, 0, 44, 32, 3.6, SHADOW);
    /* the tripod */
    for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(0, 2); c.lineTo(i * 22, 42); tube(c, 3.4, i ? WOOD : shade(WOOD, -0.18)); dot(c, i * 22, 42, 2.4, '#3b3340'); }
    L(c, -11, 24, 11, 24, 1.4, shade(WOOD, -0.3));
    R(c, -5, -5, 10, 9, 3, shade(brass, -0.2));
    c.save(); c.translate(0, -8); c.rotate(a);
    R(c, -38, -5, 18, 10, 2.4, shade(tb, -0.12)); R(c, -43, -3.4, 7, 6.8, 2, brass);
    R(c, -22, -8, 54, 16, 3.5, tb); Rn(c, -21, -7, 52, 4, 2, 'rgba(255,255,255,0.22)');
    R(c, -24, -9.5, 6, 19, 2, brass); R(c, 8, -9.5, 5, 19, 2, brass); R(c, 30, -11, 8, 22, 3, brass);
    E(c, 38, 0, 3, 9.4, GLASS);
    R(c, -6, -14, 16, 4.6, 2, shade(tb, -0.2)); /* finder */
    c.restore();
    /* what it is looking at */
    K.twinkle(c, 34, -38, 6 + Math.sin(t * 3) * 2 + k * 1.5, p.snow); K.twinkle(c, 42, -18, 3 + Math.cos(t * 4) * 1.2, p.snow); star(c, 18, -42, 2.6, p.gold, t * 0.6); dot(c, 44, -44, 1.2, p.snow);
  });

  /* ---------- the sea ---------- */
  Art.add('prop', 'lighthouse', function (c, t, p, o) {
    var i, k = pulse(o), a = t * 1.1, red = p.accent, wh = p.paper;
    /* the turning beams */
    var bw = Math.cos(a); c.save(); c.translate(0, -31);
    for (i = -1; i <= 1; i += 2) { var len = 46 * Math.abs(bw) * (i * bw > 0 ? 1 : 0.55); if (len > 3) { var g = c.createLinearGradient(0, 0, i * len, 0); g.addColorStop(0, alpha('#fff3b8', 0.75)); g.addColorStop(1, alpha('#fff3b8', 0)); c.beginPath(); c.moveTo(0, -2); c.lineTo(i * len, -12); c.lineTo(i * len, 12); c.lineTo(0, 2); c.closePath(); c.fillStyle = g; c.fill(); } }
    c.restore();
    /* the rock and the sea */
    c.beginPath(); c.moveTo(-34, 42); c.quadraticCurveTo(-30, 26, -14, 27); c.lineTo(16, 27); c.quadraticCurveTo(32, 28, 36, 42); c.closePath(); F(c, mix('#7d8590', p.bg, 0.25));
    Pg(c, [[-13, 28], [-9, -22], [9, -22], [13, 28]], wh);
    c.save(); c.beginPath(); c.moveTo(-13, 28); c.lineTo(-9, -22); c.lineTo(9, -22); c.lineTo(13, 28); c.closePath(); c.clip();
    Rn(c, -14, -22, 28, 11, 0, red); Rn(c, -14, 0, 28, 12, 0, red); Rn(c, 3, -24, 12, 54, 0, 'rgba(30,20,50,0.13)'); c.restore();
    c.beginPath(); c.moveTo(-3.4, 28); c.lineTo(-3.4, 20); c.arc(0, 20, 3.4, PI, 0); c.lineTo(3.4, 28); c.closePath(); F(c, shade(red, -0.35));
    Rn(c, -2, -8, 4, 5.6, 2, '#3b4a60'); Rn(c, -2, 13.5, 4, 5, 2, '#3b4a60');
    R(c, -13, -25, 26, 4, 1.5, '#3b3340'); for (i = -2; i <= 2; i++) L(c, i * 5.6, -25, i * 5.6, -30, 0.8, '#3b3340'); L(c, -12, -30, 12, -30, 0.9, '#3b3340');
    R(c, -7, -37, 14, 12, 1.5, mix('#fff3b8', GLASS, 0.3)); dot(c, 0, -31, 3.4 + k * 0.8, '#fff8d0'); L(c, 0, -37, 0, -25, 0.8, '#3b3340');
    c.beginPath(); c.moveTo(-9.5, -37); c.quadraticCurveTo(0, -49, 9.5, -37); c.closePath(); F(c, red); dot(c, 0, -44.6, 1.6, p.gold);
    /* waves */
    for (i = 0; i < 2; i++) { var wc = i ? mix('#58b4ff', p.accent2, 0.3) : shade(mix('#58b4ff', p.accent2, 0.3), 0.3), y = 38 + i * 4, ph = t * 1.6 + i * 1.3, j; c.beginPath(); c.moveTo(-46, 47); c.lineTo(-46, y); for (j = 0; j < 8; j++) c.quadraticCurveTo(-46 + (j + 0.5) * 11.5 + Math.sin(ph) * 1.5, y - 4.4, -46 + (j + 1) * 11.5, y); c.lineTo(46, 47); c.closePath(); F(c, wc); }
    /* a gull */
    var gx = -30 + Math.sin(t * 0.7) * 4, gy = -18 + Math.cos(t * 0.9) * 2, fl = Math.sin(t * 6) * 2.4; c.beginPath(); c.moveTo(gx - 6, gy - fl); c.quadraticCurveTo(gx - 3, gy - 3, gx, gy); c.quadraticCurveTo(gx + 3, gy - 3, gx + 6, gy - fl); c.lineWidth = 1.4; c.lineCap = 'round'; c.strokeStyle = shade(p.snow, -0.05); c.stroke();
  });

  Art.add('prop', 'anchor', function (c, t, p, o) {
    var i, st = mix('#8497b3', p.paper, 0.12), k = pulse(o), rope = mix('#e8d2a0', p.paper, 0.3);
    c.save(); c.rotate(Math.sin(t * 1.3) * 0.07); c.translate(0, k * 1);
    /* the rope loops round the shank */
    c.beginPath(); c.moveTo(0, -37); c.bezierCurveTo(26, -34, 22, -8, 2, -4); c.bezierCurveTo(-22, 0, -24, 22, -6, 28); tube(c, 3, rope);
    c.beginPath(); c.arc(0, -37, 6.4, 0, TAU); tube(c, 4.2, st);
    c.beginPath(); c.moveTo(0, -30); c.lineTo(0, 34); tube(c, 7, st);
    c.beginPath(); c.moveTo(-15, -21); c.lineTo(15, -21); tube(c, 5.4, st); dot(c, -15, -21, 3.6, shade(st, -0.2)); dot(c, 15, -21, 3.6, shade(st, -0.2));
    c.beginPath(); c.moveTo(-29, 8); c.quadraticCurveTo(-27, 36, 0, 37); c.quadraticCurveTo(27, 36, 29, 8); tube(c, 7, st);
    for (i = -1; i <= 1; i += 2) Pg(c, [[i * 29, -2], [i * 39, 14], [i * 21, 14]], st);
    L(c, -1.6, -26, -1.6, 28, 1.4, 'rgba(255,255,255,0.35)');
    /* the rope crosses in front */
    c.beginPath(); c.moveTo(9, -6); c.bezierCurveTo(-4, -3, -10, 2, -12, 8); tube(c, 3, rope);
    c.beginPath(); c.moveTo(-6, 28); c.bezierCurveTo(4, 31, 12, 26, 14 + Math.sin(t * 2) * 2, 18); tube(c, 3, rope);
    c.restore();
    /* bubbles */
    for (i = 0; i < 3; i++) { var f = frac(t * 0.35 + i / 3); c.beginPath(); c.arc([34, 40, 30][i] + Math.sin(t * 2 + i) * 2, 20 - f * 50, 2 + i * 0.7, 0, TAU); c.lineWidth = 0.9; c.strokeStyle = alpha(p.snow, 0.8 * (1 - f)); c.stroke(); }
  });

  Art.add('prop', 'treasurechest', function (c, t, p, o) {
    var i, k = pulse(o), wd = mix('#8a5a2e', p.accent, 0.12), g = p.gold, R0 = rnd('chest');
    E(c, 0, 43, 40, 4, SHADOW);
    K.glow(c, 0, -6, 34, g, 0.35 + k * 0.15);
    /* the open lid, seen from inside */
    c.beginPath(); c.moveTo(-31, 2); c.lineTo(-33, -22); c.quadraticCurveTo(0, -44, 33, -22); c.lineTo(31, 2); c.closePath(); F(c, shade(wd, -0.25));
    c.beginPath(); c.moveTo(-26, 2); c.lineTo(-27.5, -19); c.quadraticCurveTo(0, -37, 27.5, -19); c.lineTo(26, 2); c.closePath(); c.fillStyle = shade(p.accent, -0.3); c.fill();
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * 15, 2); c.lineTo(i * 16, -29.6); c.lineWidth = 4; c.strokeStyle = shade(g, -0.2); c.stroke(); }
    /* the hoard */
    for (i = 0; i < 16; i++) { var x = (R0() - 0.5) * 50, y = 2 - R0() * 12 * (1 - Math.abs(x) / 30); E(c, x, y, 4.6, 3.2, i % 3 ? g : shade(g, 0.25)); }
    Pg(c, [[-12, -8], [-7, -14], [-2, -8], [-7, -1]], mix(p.accent2, '#5ad1e0', 0.4)); Pg(c, [[9, -6], [13, -11], [17, -6], [13, 0]], mix(p.accent, '#ff5a9a', 0.3));
    c.beginPath(); c.arc(0, -4, 9, PI * 1.05, PI * 1.95); c.lineWidth = 1.1; c.strokeStyle = p.paper; c.setLineDash([0.1, 2.6]); c.lineCap = 'round'; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
    /* a crown perched on top */
    Pg(c, [[-7, -12], [-8, -22], [-3.6, -17.5], [0, -24], [3.6, -17.5], [8, -22], [7, -12]], shade(g, 0.15)); dot(c, 0, -15, 1.3, p.accent);
    /* the box */
    R(c, -33, 2, 66, 38, 4, wd); for (i = 1; i < 3; i++) L(c, -32, 2 + i * 12.6, 32, 2 + i * 12.6, 0.8, shade(wd, -0.25));
    Rn(c, -33, 2, 66, 5, 2, shade(g, -0.1)); Rn(c, -33, 35, 66, 5, 2, shade(g, -0.1));
    for (i = -1; i <= 1; i += 2) { Rn(c, i * 22 - 3.4, 2, 6.8, 38, 1, g); dot(c, i * 22, 12, 1.2, shade(g, -0.35)); dot(c, i * 22, 30, 1.2, shade(g, -0.35)); }
    K.rrp(c, -33, 2, 66, 38, 4); c.lineWidth = K.ow(); c.strokeStyle = shade(wd, -0.4); c.stroke();
    R(c, -6, 4, 12, 13, 3, g); dot(c, 0, 9.6, 2, '#3b3340'); L(c, 0, 10, 0, 13.6, 1.4, '#3b3340');
    E(c, -38, 41, 4.4, 2.6, g); E(c, 37, 41.6, 4.4, 2.6, shade(g, 0.2)); E(c, 30, 40, 4.4, 2.6, g);
    K.twinkle(c, -22, -30, 5 + Math.sin(t * 3) * 2, '#fff'); K.twinkle(c, 26, -18, 4 + Math.cos(t * 3.7) * 1.8, '#fff'); K.twinkle(c, 3, -36, 3 + Math.sin(t * 4.4 + 1) * 1.4, '#fff');
  });

  /* ---------- the fair and days out ---------- */
  Art.add('prop', 'ferriswheel', function (c, t, p, o) {
    var i, n = 8, r = 34, a0 = t * 0.35, cols = [p.accent, p.gold, p.accent2, p.paper], k = pulse(o), fr = mix(STEEL, p.paper, 0.3);
    E(c, 0, 45, 34, 3.4, SHADOW);
    /* the legs */
    c.beginPath(); c.moveTo(-22, 44); c.lineTo(0, -6); c.lineTo(22, 44); tube(c, 3.6, shade(p.accent, -0.1));
    L(c, -13, 24, 13, 24, 1.6, shade(p.accent, -0.3));
    c.save(); c.translate(0, -6);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); tube(c, 3, fr);
    c.beginPath(); c.arc(0, 0, r * 0.62, 0, TAU); c.lineWidth = 1.2; c.strokeStyle = shade(fr, -0.2); c.stroke();
    for (i = 0; i < n; i++) { var a = a0 + i / n * TAU; L(c, 0, 0, Math.cos(a) * r, Math.sin(a) * r, 1.3, shade(fr, -0.2)); }
    /* bulbs on the rim chase round */
    for (i = 0; i < 16; i++) { var b = a0 + (i + 0.5) / 16 * TAU, on = (i + o.n) % 2 === 0; dot(c, Math.cos(b) * r, Math.sin(b) * r, on ? 1.7 + k * 0.5 : 1.2, on ? '#fff8d0' : p.gold); }
    /* the gondolas hang straight down */
    for (i = 0; i < n; i++) { var g = a0 + i / n * TAU, x = Math.cos(g) * r, y = Math.sin(g) * r, sw = Math.sin(t * 2 + i) * 0.08, col = cols[i % 4];
      c.save(); c.translate(x, y); c.rotate(sw); L(c, 0, 0, 0, 3.4, 0.9, '#5a5560'); c.beginPath(); c.moveTo(-5.6, 3.4); c.lineTo(5.6, 3.4); c.lineTo(4.4, 10.6); c.quadraticCurveTo(0, 12.4, -4.4, 10.6); c.closePath(); F(c, col); c.beginPath(); c.arc(0, 3.6, 5.4, PI, 0); c.lineWidth = 1.5; c.strokeStyle = shade(col, -0.3); c.stroke(); dot(c, 0, 0, 1.2, '#5a5560'); c.restore(); }
    E(c, 0, 0, 6, 6, p.gold); star(c, 0, 0.2, 3.8, p.paper, a0);
    c.restore();
    R(c, -27, 42, 54, 4.6, 2, '#5a5560');
  });

  Art.add('prop', 'carousel', function (c, t, p, o) {
    var i, k = pulse(o), cols = [p.accent, p.paper], ph = t * 0.8;
    E(c, 0, 45, 42, 3.6, SHADOW);
    R(c, -40, 36, 80, 8, 3, shade(p.accent, -0.12)); Rn(c, -40, 36, 80, 2.6, 1.3, p.gold); R(c, -34, 31, 68, 6, 2, p.paper);
    R(c, -3, -14, 6, 46, 2, p.gold);
    /* three horses on poles: they rise and fall in turn */
    for (i = -1; i <= 1; i++) {
      var x = i * 23, bob = Math.sin(ph * 2 + i * 2.1) * 4.4, hc = [mix(p.paper, WOOD, 0.1), mix(p.accent2, p.paper, 0.35), mix(p.gold, p.paper, 0.3)][i + 1], y = 12 + bob;
      L(c, x, -14, x, 32, 1.6, shade(p.gold, -0.15));
      c.save(); c.translate(x, y);
      L(c, -5, 3, -7.4, 10.4, 2, shade(hc, -0.3)); L(c, 4.6, 3, 7.6, 9.6, 2, shade(hc, -0.3));
      E(c, 0, 0, 8.4, 5.2, hc);
      c.beginPath(); c.moveTo(4, -2); c.lineTo(7.4, -11); c.quadraticCurveTo(12.6, -12, 13.4, -6.6); c.lineTo(9.6, -5.6); c.lineTo(8.4, 1); c.closePath(); F(c, hc);
      Pg(c, [[7, -11], [8.4, -14.4], [9.8, -11.4]], hc);
      c.beginPath(); c.moveTo(6.6, -11); c.quadraticCurveTo(2.4, -8, 3.4, -2); c.lineWidth = 2; c.strokeStyle = [p.accent, p.gold, p.accent][i + 1]; c.stroke();
      c.beginPath(); c.moveTo(-8, -1); c.quadraticCurveTo(-13, 0, -12, 6); c.lineWidth = 1.8; c.stroke();
      Rn(c, -3.4, -4.4, 6.8, 5.4, 1.6, [p.accent, p.accent, p.accent2][i + 1]); dot(c, 10.4, -8.6, 0.8, '#2b2118');
      c.restore();
    }
    /* the canopy: striped scalloped tent */
    c.beginPath(); c.moveTo(-42, -14); c.quadraticCurveTo(-20, -24, 0, -40); c.quadraticCurveTo(20, -24, 42, -14); c.closePath(); F(c, cols[0]);
    c.save(); c.clip(); for (i = -1; i <= 1; i += 2) { Pg(c, [[0, -42], [i * 8, -12], [i * 22, -12]], cols[1], true); Pg(c, [[0, -42], [i * 36, -12], [i * 50, -12]], cols[1], true); } c.restore();
    c.beginPath(); c.moveTo(-42, -14); c.quadraticCurveTo(-20, -24, 0, -40); c.quadraticCurveTo(20, -24, 42, -14); c.closePath(); c.lineWidth = K.ow(); c.strokeStyle = shade(cols[0], -0.36); c.stroke();
    for (i = 0; i < 7; i++) { c.beginPath(); c.arc(-36 + i * 12, -14, 6, 0, PI); c.closePath(); F(c, i % 2 ? p.gold : p.accent2); }
    for (i = 0; i < 8; i++) { var on = (i + o.n) % 2 === 0; dot(c, -42 + i * 12, -13.4, on ? 1.6 + k * 0.5 : 1.2, on ? '#fff8d0' : shade(p.gold, 0.2)); }
    L(c, 0, -40, 0, -46, 1.2, '#7a6a5a'); flag(c, 0, -47, 9, 5.4, p.gold, t);
  });

  Art.add('prop', 'popcorn', function (c, t, p, o) {
    var i, k = pulse(o), R0 = rnd('pop'), pc = mix('#fff6d8', p.paper, 0.5);
    function kernel(x, y, r, sd) { plain(function () { var Q = rnd(sd), j; for (j = 0; j < 3; j++) { var a = Q() * TAU; dot(c, x + Math.cos(a) * r * 0.5 + 0.5, y + Math.sin(a) * r * 0.5 + 0.6, r * 0.72, shade(pc, -0.2)); } for (j = 0; j < 3; j++) { var b = j * 2.1 + sd; dot(c, x + Math.cos(b) * r * 0.5, y + Math.sin(b) * r * 0.5, r * 0.7, pc); } dot(c, x, y, r * 0.45, mix(p.gold, pc, 0.55)); }); }
    E(c, 0, 44, 28, 3.6, SHADOW);
    /* popped ones jumping out on the beat */
    for (i = 0; i < 4; i++) { var f = frac(t * 0.8 + i / 4), sx = [-24, 22, -10, 14][i]; kernel(sx * (0.5 + f * 0.7), -30 - Math.sin(f * PI) * 16 + f * 6, 3.6, i + 20); }
    c.save(); c.translate(0, 42); c.rotate(Math.sin(t * 2) * 0.02); c.translate(0, -42);
    for (i = 0; i < 17; i++) { var x = (R0() - 0.5) * 46, y = -14 - R0() * 20 * (1 - Math.abs(x) / 30) - k * 1.5 * R0(); kernel(x, y, 5.4 + R0() * 1.6, i); }
    /* the striped box */
    Pg(c, [[-25, -12], [25, -12], [19, 42], [-19, 42]], p.paper);
    c.save(); c.beginPath(); c.moveTo(-25, -12); c.lineTo(25, -12); c.lineTo(19, 42); c.lineTo(-19, 42); c.closePath(); c.clip();
    for (i = -2; i <= 2; i++) Pg(c, [[i * 11 - 3, -12], [i * 11 + 3, -12], [i * 8.4 + 2.4, 42], [i * 8.4 - 2.4, 42]], p.accent, true);
    Rn(c, 8, -12, 20, 56, 0, 'rgba(30,20,50,0.1)'); c.restore();
    c.beginPath(); c.moveTo(-25, -12); c.lineTo(25, -12); c.lineTo(19, 42); c.lineTo(-19, 42); c.closePath(); c.lineWidth = K.ow(); c.strokeStyle = shade(p.paper, -0.42); c.stroke();
    icingTop(c, -27, 27, -12, p.paper);
    E(c, 0, 16, 11, 11, p.gold); star(c, 0, 16.4, 7, p.paper, 0);
    for (i = 0; i < 5; i++) kernel(-20 + i * 10, -14 - (i % 2) * 2, 5, i + 40);
    c.restore();
    kernel(-30, 41, 3.6, 60); kernel(29, 42, 3.2, 61);
  });
  function icingTop(c, x0, x1, y, col) { var n = 6, w = (x1 - x0) / n, i; c.beginPath(); c.moveTo(x0, y); for (i = 0; i < n; i++) c.arc(x0 + (i + 0.5) * w, y, w / 2, PI, 0); c.lineTo(x1, y + 4); c.lineTo(x0, y + 4); c.closePath(); F(c, col); }

  Art.add('prop', 'picnicbasket', function (c, t, p, o) {
    var i, j, k = pulse(o), wk = mix('#c9965a', p.gold, 0.2), dk = shade(wk, -0.22);
    E(c, 0, 44, 42, 4, SHADOW);
    /* the gingham blanket */
    Pg(c, [[-46, 44], [-34, 30], [34, 30], [46, 44]], p.paper);
    c.save(); c.beginPath(); c.moveTo(-46, 44); c.lineTo(-34, 30); c.lineTo(34, 30); c.lineTo(46, 44); c.closePath(); c.clip();
    c.fillStyle = alpha(p.accent, 0.55); for (i = -5; i <= 5; i += 2) { c.beginPath(); c.moveTo(i * 6.4, 30); c.lineTo(i * 6.4 + 6.4, 30); c.lineTo((i + 1) * 8.6, 44); c.lineTo(i * 8.6, 44); c.closePath(); c.fill(); } c.fillRect(-46, 33, 92, 3); c.fillRect(-46, 39.6, 92, 3.4); c.restore();
    /* the handle */
    c.beginPath(); c.moveTo(-21, 2); c.quadraticCurveTo(-21, -34, 0, -34 - k); c.quadraticCurveTo(21, -34, 21, 2); tube(c, 4.4, wk);
    /* what is sticking out: a baguette, a bottle, an apple, greens */
    c.save(); c.translate(-14, -2); c.rotate(-0.42); R(c, -4.4, -30, 8.8, 34, 4.4, '#e0a85a'); for (i = 0; i < 3; i++) L(c, -2.4, -22 + i * 7, 2.4, -24.4 + i * 7, 1, '#b97a34'); c.restore();
    c.save(); c.translate(11, 0); c.rotate(0.2); R(c, -4.6, -18, 9.2, 22, 3, mix(p.accent2, '#2f6a4a', 0.4)); R(c, -2, -28, 4, 12, 1.4, mix(p.accent2, '#2f6a4a', 0.4)); Rn(c, -2.4, -29.4, 4.8, 3.4, 1, p.gold); Rn(c, -4, -11, 8, 7, 1, p.paper); c.restore();
    K.ball(c, -1, -4, 6.4, 6, p.accent); L(c, -1, -9.6, 0, -12.6, 1, '#6b4226'); K.leaf(c, 0, -12, 5, -0.4, LEAFG);
    K.leaf(c, 20, 0, 10, -1.1, LEAFG); K.leaf(c, 22, 1, 9, -0.6, shade(LEAFG, -0.12));
    /* the basket: woven */
    c.beginPath(); c.moveTo(-28, 0); c.lineTo(28, 0); c.lineTo(23, 36); c.quadraticCurveTo(0, 40, -23, 36); c.closePath(); F(c, wk);
    c.save(); c.clip(); for (j = 0; j < 5; j++) for (i = -4; i <= 4; i++) Rn(c, i * 7 + (j % 2 ? 0 : 3.5) - 3, 3 + j * 7.4, 6, 3.6, 1.6, (i + j) % 2 ? dk : shade(wk, 0.16)); c.restore();
    R(c, -30, -3, 60, 7, 3.4, shade(wk, 0.1)); for (i = -4; i <= 4; i++) L(c, i * 6.4 - 1.4, -2, i * 6.4 + 1.4, 3, 1, dk);
    /* a checked cloth flopping over the rim */
    Pg(c, [[14, -3], [30, -3], [33, 13], [24, 9], [17, 15]], p.paper); L(c, 19, -2, 20.4, 11, 1.6, alpha(p.accent, 0.6)); L(c, 26, -2, 28.4, 10, 1.6, alpha(p.accent, 0.6)); L(c, 15, 4, 31.4, 4, 1.6, alpha(p.accent, 0.6));
    /* a ladybird visits */
    var lx = -36 + Math.sin(t * 0.8) * 3; E(c, lx, 37, 2.6, 2.1, '#d62839'); dot(c, lx + 2, 37, 1, '#2b2118'); dot(c, lx - 0.8, 36.4, 0.5, '#2b2118');
  });

  Art.add('prop', 'bicycle', function (c, t, p, o) {
    var i, k = pulse(o), fr = p.accent, a = t * 1.6, wr = 16.5;
    E(c, 0, 44, 40, 3.4, SHADOW);
    c.save(); c.translate(0, 6 - k * 0.8);
    for (i = -1; i <= 1; i += 2) { var x = i * 25, j; c.beginPath(); c.arc(x, 20, wr, 0, TAU); c.lineWidth = 4.2; c.strokeStyle = TYRE; c.stroke(); c.lineWidth = 1; c.strokeStyle = STEEL; c.beginPath(); c.arc(x, 20, wr - 2.6, 0, TAU); c.stroke(); for (j = 0; j < 8; j++) L(c, x, 20, x + Math.cos(a + j * TAU / 8) * (wr - 2.6), 20 + Math.sin(a + j * TAU / 8) * (wr - 2.6), 0.6, STEEL); dot(c, x, 20, 2.2, shade(STEEL, -0.2)); }
    /* mudguards */
    c.beginPath(); c.arc(-25, 20, wr + 3.4, PI * 1.05, PI * 1.75); tube(c, 2.2, p.paper); c.beginPath(); c.arc(25, 20, wr + 3.4, PI * 1.2, PI * 1.85); tube(c, 2.2, p.paper);
    /* the frame */
    c.beginPath(); c.moveTo(-25, 20); c.lineTo(-9, -6); c.lineTo(15, -8); c.lineTo(-1, 20); c.lineTo(-25, 20); c.moveTo(-9, -6); c.lineTo(-1, 20); c.moveTo(25, 20); c.lineTo(14, -14); tube(c, 3.2, fr);
    L(c, -9, -6, -11, -13, 2.4, shade(STEEL, -0.2)); R(c, -18, -17, 14, 5, 2.5, '#6b4a2e');
    c.beginPath(); c.moveTo(14, -14); c.lineTo(13, -20); c.quadraticCurveTo(9, -22, 6, -19); tube(c, 2.4, shade(STEEL, -0.1)); dot(c, 6, -19, 2, '#6b4a2e');
    /* pedals turn */
    E(c, -1, 20, 4.4, 4.4, STEEL); L(c, -1, 20, -1 + Math.cos(a) * 7, 20 + Math.sin(a) * 7, 1.8, '#5a5560'); R(c, -1 + Math.cos(a) * 7 - 3, 20 + Math.sin(a) * 7 - 1.2, 6, 2.4, 1, '#3b3340');
    /* the front basket with flowers */
    L(c, 15, -12, 22, -12, 1.4, '#5a5560');
    plain(function () { K.flower(c, 25, -22, 4.6, p.gold, p.paper, t * 0.4); K.flower(c, 32, -19.4, 4, p.paper, p.gold, 1); K.flower(c, 37, -22.4, 3.6, mix(p.accent, '#ff9ab8', 0.5), p.gold, 2); });
    Pg(c, [[20, -17], [40, -17], [37.4, -4], [22.6, -4]], mix('#c9965a', p.gold, 0.2)); for (i = 0; i < 3; i++) L(c, 21 + i * 0.6, -13.6 + i * 3.4, 39 - i * 0.6, -13.6 + i * 3.4, 0.7, '#8a5a2e'); for (i = 0; i < 4; i++) L(c, 24 + i * 4, -17, 24.6 + i * 3.6, -4, 0.7, '#8a5a2e');
    /* a bell and a ribbon streamer */
    dot(c, 9.6, -21.4, 2, p.gold);
    c.beginPath(); c.moveTo(6, -19); c.quadraticCurveTo(1, -16 + Math.sin(t * 5) * 2, -4, -18 + Math.sin(t * 5 + 1) * 2.4); c.lineWidth = 1.2; c.strokeStyle = p.accent2; c.stroke();
    c.restore();
  });

  Art.add('prop', 'skis', function (c, t, p, o) {
    var i, k = pulse(o), cols = [p.accent, p.accent2];
    /* a mound of snow with the skis and poles planted in it */
    E(c, 0, 44, 38, 3.6, SHADOW);
    c.save(); c.translate(0, 40); c.rotate(Math.sin(t * 1.4) * 0.015); c.translate(0, -40);
    for (i = -1; i <= 1; i += 2) { /* poles, crossed behind */
      c.save(); c.translate(i * 3, 34); c.rotate(i * 0.42); L(c, 0, 0, 0, -66, 3.6, shade(STEEL, -0.4)); L(c, 0, 0, 0, -66, 2, STEEL); R(c, -2.4, -76, 4.8, 12, 2.2, '#3b3340'); c.beginPath(); c.arc(-i * 1.6, -72, 4.4, 0, TAU); c.lineWidth = 1.1; c.strokeStyle = cols[i < 0 ? 0 : 1]; c.stroke(); E(c, 0, -8, 5, 1.8, shade(STEEL, -0.2)); c.restore();
    }
    for (i = -1; i <= 1; i += 2) {
      c.save(); c.translate(i * 9, 38); c.rotate(i * 0.13); var col = cols[i < 0 ? 0 : 1];
      c.beginPath(); c.moveTo(-5.4, 0); c.lineTo(-5.4, -68); c.quadraticCurveTo(-5.4, -82 - k, i * 3, -84 - k); c.quadraticCurveTo(5.4, -80, 5.4, -68); c.lineTo(5.4, 0); c.closePath(); F(c, col);
      c.save(); c.clip(); Rn(c, -6, -62, 12, 5, 0, p.paper); Rn(c, -6, -54, 12, 2.4, 0, p.gold); Pg(c, [[-6, -20], [6, -27], [6, -20], [-6, -13]], p.paper, true); Rn(c, 2, -90, 4, 92, 0, 'rgba(30,20,50,0.12)'); c.restore();
      star(c, 0, -43, 3.6, p.paper, 0);
      R(c, -4.4, -37, 8.8, 5, 1.5, '#3b3340'); R(c, -4.4, -29, 8.8, 4, 1.5, STEEL);
      c.restore();
    }
    c.restore();
    plain(function () { var sn = p.snow; c.beginPath(); c.moveTo(-40, 45); c.bezierCurveTo(-34, 28, -14, 28, -4, 33); c.bezierCurveTo(8, 25, 30, 28, 40, 45); c.closePath(); c.fillStyle = shade(sn, -0.13); c.fill(); c.beginPath(); c.moveTo(-40, 45); c.bezierCurveTo(-36, 32, -16, 31, -5, 36); c.bezierCurveTo(8, 29, 28, 32, 37, 45); c.closePath(); c.fillStyle = sn; c.fill(); });
    c.beginPath(); c.moveTo(-40, 45); c.bezierCurveTo(-34, 28, -14, 28, -4, 33); c.bezierCurveTo(8, 25, 30, 28, 40, 45); c.lineWidth = 0.9; c.strokeStyle = shade(p.snow, -0.3); c.stroke();
    for (i = 0; i < 4; i++) { var f = frac(t * 0.22 + i / 4), x = [-36, 32, -22, 40][i] + Math.sin(t * 1.4 + i) * 3; dot(c, x, -40 + f * 70, 1.5, alpha(p.snow, 0.9 * Math.sin(f * PI))); }
    K.twinkle(c, -24, 36, 2.6 + Math.sin(t * 3) * 1.2, '#fff'); K.twinkle(c, 22, 38, 2.2 + Math.cos(t * 3.4) * 1, '#fff');
  });

  /* ---------- sky and fly pieces: small in a top corner or crossing the sky, so bold and simple ---------- */
  Art.add('prop', 'kite', function (c, t, p, o) {
    var i, sw = Math.sin(t * 1.7) * 0.12, k = pulse(o), cols = [p.accent, p.gold, p.accent2, p.paper];
    c.save(); c.translate(6 + Math.sin(t * 1.1) * 2, -12 + Math.cos(t * 1.4) * 2); c.rotate(0.42 + sw);
    /* the tail: a ribbon with bows, snaking */
    var px = 0, py = 30, pts = [[0, 30]]; for (i = 1; i <= 6; i++) { px = Math.sin(t * 3 - i * 0.9) * (3 + i * 1.2) - i * 2.4; py = 30 + i * 6.4; pts.push([px, py]); }
    c.beginPath(); c.moveTo(0, 30); for (i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineWidth = 1.3; c.lineJoin = 'round'; c.strokeStyle = shade(p.paper, -0.2); c.stroke();
    for (i = 1; i < pts.length; i += 2) { c.save(); c.translate(pts[i][0], pts[i][1]); c.rotate(Math.sin(t * 3 - i) * 0.5); Pg(c, [[0, 0], [-5.4, -3.4], [-5.4, 3.4]], cols[(i >> 1) % 3]); Pg(c, [[0, 0], [5.4, -3.4], [5.4, 3.4]], cols[(i >> 1) % 3]); c.restore(); }
    /* the diamond in four panels */
    var T = [0, -34], Rr = [22, -6], B = [0, 30], Lf = [-22, -6], C = [0, -6];
    Pg(c, [T, Rr, C], cols[0]); Pg(c, [T, Lf, C], cols[1]); Pg(c, [Lf, B, C], cols[2]); Pg(c, [Rr, B, C], shade(cols[0], -0.14));
    L(c, 0, -34, 0, 30, 1.3, shade(WOOD, -0.25)); L(c, -22, -6, 22, -6, 1.3, shade(WOOD, -0.25));
    star(c, 0, -6, 5 + k, p.paper, 0);
    c.restore();
    /* the string runs down and away */
    c.beginPath(); c.moveTo(4 + Math.sin(t * 1.1) * 2, -16 + Math.cos(t * 1.4) * 2); c.quadraticCurveTo(-20, 20, -46, 46); c.lineWidth = 0.9; c.strokeStyle = shade(p.paper, -0.25); c.stroke();
  }, { });

  Art.add('prop', 'paperplane', function (c, t, p, o) {
    var i, pa = p.paper, bob = Math.sin(t * 1.8) * 2.6;
    /* the looping dotted trail it has flown */
    c.beginPath(); c.moveTo(-46, 30); c.bezierCurveTo(-30, 44, -8, 40, -14, 22); c.bezierCurveTo(-18, 8, -34, 18, -22, 28); c.bezierCurveTo(-12, 34, -2, 22, -4, 14 + bob);
    c.setLineDash([0.1, 5]); c.lineDashOffset = -t * 9; c.lineCap = 'round'; c.lineWidth = 2.2; c.strokeStyle = alpha(p.snow, 0.9); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    c.save(); c.translate(6, -6 + bob); c.rotate(-0.38 + Math.sin(t * 1.8 + 1) * 0.06);
    Pg(c, [[38, -8], [-34, -26], [-16, -2]], pa);                 /* far wing */
    Pg(c, [[38, -8], [-16, -2], [-10, 20]], shade(pa, -0.22));    /* the keel fold */
    Pg(c, [[38, -8], [-10, 20], [-2, 2]], shade(pa, -0.38));
    Pg(c, [[38, -8], [-2, 2], [-28, 16]], shade(pa, -0.06));      /* near wing */
    L(c, 30, -7, -18, 10, 0.8, mix(p.accent, pa, 0.3));
    c.restore();
    for (i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-40 + i * 6, -18 - i * 12 + bob); c.lineTo(-28 + i * 6, -16 - i * 12 + bob); c.lineWidth = 1.4; c.strokeStyle = alpha(p.snow, 0.7); c.stroke(); }
  });

  function gull(c, x, y, s, fl, col) { /* a bold bird seen from afar: two wings and a body */
    c.beginPath(); c.moveTo(x - s, y - fl * s * 0.5); c.quadraticCurveTo(x - s * 0.5, y - s * 0.55 - fl * s * 0.2, x, y); c.quadraticCurveTo(x + s * 0.5, y - s * 0.55 - fl * s * 0.2, x + s, y - fl * s * 0.5);
    c.quadraticCurveTo(x + s * 0.5, y - s * 0.22 - fl * s * 0.1, x + s * 0.08, y + s * 0.24); c.lineTo(x - s * 0.08, y + s * 0.24); c.quadraticCurveTo(x - s * 0.5, y - s * 0.22 - fl * s * 0.1, x - s, y - fl * s * 0.5); c.closePath(); F(c, col);
  }
  Art.add('prop', 'birdflock', function (c, t, p, o) {
    var i, B = [[14, -18, 15], [-10, -4, 12], [32, 0, 11], [-30, 12, 9.4], [8, 16, 9], [-44 + 6, 28, 7], [34, 26, 7]];
    /* dark birds against a pale sky, pale birds against a dark one */
    var rgb = K.rgbOf(p.bg) || [0, 0, 0], lum = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11, col = lum > 150 ? mix('#3b4a60', p.ink, 0.4) : p.paper;
    /* a V of birds, the leader up front, each flapping in its own time */
    for (i = B.length - 1; i >= 0; i--) { var b = B[i], fl = Math.sin(t * 5.4 + i * 1.3), x = b[0] + Math.sin(t * 0.9 + i) * 1.6, y = b[1] + Math.cos(t * 1.2 + i * 2) * 1.6 - 4; gull(c, x, y, b[2] * 1.12, fl, i % 3 === 0 ? col : shade(col, lum > 150 ? 0.14 : -0.07)); }
  });

  Art.add('prop', 'shootingstar', function (c, t, p, o) {
    var i, k = pulse(o), g = p.gold, f = frac(t * 0.35), R0 = rnd('ss');
    c.save(); c.rotate(-0.6); c.translate(Math.sin(t * 2.2) * 1.4, 0);
    /* three tapering trails */
    var cols = [alpha(p.accent, 0.85), alpha(g, 0.9), alpha(p.accent2, 0.85)];
    for (i = -1; i <= 1; i++) { var gr = c.createLinearGradient(-48, 0, 14, 0); gr.addColorStop(0, alpha(i ? (i < 0 ? p.accent : p.accent2) : g, 0)); gr.addColorStop(1, cols[i + 1]); c.beginPath(); c.moveTo(16, i * 8 - 3.4); c.lineTo(-46 + Math.abs(i) * 10, i * 13); c.lineTo(16, i * 8 + 3.4); c.closePath(); c.fillStyle = gr; c.fill(); }
    for (i = 0; i < 6; i++) { var ff = frac(f + i / 6), x = 6 - ff * 50, y = (R0() - 0.5) * 30 * ff; K.twinkle(c, x, y, (1 - ff) * 4 + 0.6, alpha(p.snow, 1 - ff)); }
    K.glow(c, 24, 0, 30, '#fff3b8', 0.4 + k * 0.15);
    c.save(); c.translate(24, 0); c.rotate(0.6 + Math.sin(t * 2) * 0.12); K.starPath(c, 0, 0, 20 + k * 1.6, 9.4, 5, 0); F(c, g); K.starPath(c, -1.4, -1.4, 11, 5, 5, 0); c.fillStyle = shade(g, 0.4); c.fill();
    c.restore(); c.restore();
    K.twinkle(c, -30, -32, 3.4 + Math.sin(t * 3) * 1.4, p.snow); K.twinkle(c, 34, 30, 2.6 + Math.cos(t * 3.4) * 1.2, p.snow);
  });

  Art.add('prop', 'blimp', function (c, t, p, o) {
    var i, col = p.accent, bob = Math.sin(t * 1.3) * 2, k = pulse(o);
    c.save(); c.translate(0, -4 + bob); c.rotate(-0.05 + Math.sin(t * 0.9) * 0.02);
    /* tail fins */
    Pg(c, [[-30, -4], [-46, -20], [-40, -2]], p.accent2); Pg(c, [[-30, 4], [-46, 20], [-40, 2]], p.accent2); Pg(c, [[-32, -1.6], [-48, -3], [-48, 3], [-32, 1.6]], shade(p.accent2, -0.15));
    /* the gondola */
    L(c, -8, 14, -6, 22, 0.9, '#5a5560'); L(c, 12, 14, 10, 22, 0.9, '#5a5560');
    R(c, -12, 20, 28, 9, 4, p.paper); for (i = 0; i < 3; i++) Rn(c, -8 + i * 7.4, 22.4, 4.6, 3.6, 1, GLASS);
    c.save(); c.translate(-13.4, 25); c.rotate(t * 14); L(c, 0, -4.4, 0, 4.4, 1.5, '#5a5560'); c.restore();
    /* the envelope: a blank panel on its side for nothing at all */
    E(c, 2, 0, 42, 19, col);
    c.save(); c.beginPath(); c.ellipse(2, 0, 41.4, 18.4, 0, 0, TAU); c.clip();
    c.beginPath(); c.ellipse(2, 12, 46, 14, 0, 0, TAU); c.fillStyle = 'rgba(30,20,50,0.14)'; c.fill();
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.ellipse(2, 0, 42, 9.6, 0, i > 0 ? 0 : PI, i > 0 ? PI : TAU); c.lineWidth = 0.8; c.strokeStyle = shade(col, -0.2); c.stroke(); }
    Rn(c, 30, -22, 6, 44, 0, p.gold); Rn(c, -34, -22, 4, 44, 0, p.gold);
    c.restore();
    R(c, -17, -8.4, 36, 15, 4, p.paper);
    c.beginPath(); c.ellipse(-4, -11, 22, 3.4, -0.05, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
    dot(c, 43.4, 0, 1.8 + k * 0.8, k > 0.4 ? '#fff8d0' : p.gold);
    c.restore();
  });

  Art.add('prop', 'bannerplane', function (c, t, p, o) {
    var i, bob = Math.sin(t * 1.6) * 1.8, col = p.accent, n = 7, bx0 = -4, w = 44, h = 15;
    c.save(); c.translate(0, bob - 2);
    /* the tow line and the blank banner, rippling */
    L(c, 12, 0, bx0, 0, 0.8, '#5a5560');
    function wy(x) { return Math.sin(t * 4.6 + x * 0.16) * 2.2 * ((bx0 - x) / w + 0.15); }
    c.beginPath(); c.moveTo(bx0, -h / 2 + wy(bx0)); for (i = 1; i <= n; i++) { var x = bx0 - w * i / n; c.lineTo(x, -h / 2 + wy(x)); }
    c.lineTo(bx0 - w + 5, wy(bx0 - w)); for (i = n; i >= 0; i--) { var x2 = bx0 - w * i / n; c.lineTo(x2, h / 2 + wy(x2)); } c.closePath(); F(c, p.paper);
    c.beginPath(); c.moveTo(bx0 - 3, -h / 2 + 3 + wy(bx0)); for (i = 1; i <= n - 1; i++) { var x3 = bx0 - 3 - (w - 9) * i / (n - 1); c.lineTo(x3, -h / 2 + 3 + wy(x3)); } c.lineWidth = 1.2; c.strokeStyle = p.accent2; c.stroke();
    c.beginPath(); c.moveTo(bx0 - 3, h / 2 - 3 + wy(bx0)); for (i = 1; i <= n - 1; i++) { var x4 = bx0 - 3 - (w - 9) * i / (n - 1); c.lineTo(x4, h / 2 - 3 + wy(x4)); } c.stroke();
    L(c, bx0, -h / 2 + wy(bx0), bx0, h / 2 + wy(bx0), 1.6, '#7a6a5a');
    /* the little plane */
    c.save(); c.translate(29, 0); c.rotate(-0.06 + Math.sin(t * 1.6 + 1) * 0.03);
    Pg(c, [[-16, -2], [-22, -12], [-15, -12], [-9, -3]], p.accent2);       /* tail */
    c.beginPath(); c.moveTo(-18, -3); c.quadraticCurveTo(-4, -8, 8, -7); c.quadraticCurveTo(17, -6, 17, 0); c.quadraticCurveTo(17, 6, 6, 6); c.quadraticCurveTo(-8, 6, -18, 1); c.closePath(); F(c, col);
    c.beginPath(); c.moveTo(1, -7); c.quadraticCurveTo(4, -12, 9, -6.4); c.closePath(); F(c, GLASS);
    R(c, -7, 0, 17, 4.4, 2.2, p.gold);                                      /* wing */
    L(c, 2, 6, 1, 10, 1, '#5a5560'); dot(c, 1, 10.6, 2.2, TYRE);
    E(c, 17.4, 0, 1.8, 3.4, p.paper);
    c.save(); c.translate(19.4, 0); c.scale(1, Math.sin(t * 30) * 0.3 + 0.9); c.beginPath(); c.ellipse(0, 0, 1.2, 9, 0, 0, TAU); c.fillStyle = 'rgba(90,85,96,0.55)'; c.fill(); c.restore();
    c.restore(); c.restore();
  });

  Art.add('prop', 'butterflies', function (c, t, p, o) {
    var i, cols = [p.accent, p.gold, mix(p.accent2, p.paper, 0.2)], B = [[-16, -16, 19], [22, 2, 15.5], [-4, 26, 12.5]];
    for (i = 0; i < 3; i++) {
      var b = B[i], x = b[0] + Math.sin(t * 1.1 + i * 2.1) * 5, y = b[1] + Math.cos(t * 1.5 + i * 1.3) * 4, s = b[2], f = Math.abs(Math.sin(t * 7 + i * 1.9)) * 0.75 + 0.25, col = cols[i], sd;
      /* a dotted loop behind each */
      c.beginPath(); c.arc(x - s * 1.1, y + s * 1.2, s * 0.9, -0.5, 2.4); c.setLineDash([0.1, 3.4]); c.lineCap = 'round'; c.lineWidth = 1.3; c.strokeStyle = alpha(p.snow, 0.75); c.stroke(); c.setLineDash([]);
      c.save(); c.translate(x, y); c.rotate([-0.4, 0.5, -0.2][i] + Math.sin(t * 1.3 + i) * 0.2);
      for (sd = -1; sd <= 1; sd += 2) {
        E(c, sd * s * 0.42 * f, s * 0.42, s * 0.4 * f, s * 0.42, shade(col, 0.3), sd * -0.3);
        E(c, sd * s * 0.56 * f, -s * 0.22, s * 0.56 * f, s * 0.66, col, sd * 0.4);
        dot(c, sd * s * 0.6 * f, -s * 0.34, s * 0.2 * f, p.paper); dot(c, sd * s * 0.44 * f, s * 0.5, s * 0.12 * f, p.paper);
      }
      R(c, -s * 0.09, -s * 0.5, s * 0.18, s * 1.05, s * 0.09, '#4a3a2a');
      c.beginPath(); c.moveTo(0, -s * 0.5); c.quadraticCurveTo(-s * 0.2, -s * 0.9, -s * 0.36, -s * 0.86); c.moveTo(0, -s * 0.5); c.quadraticCurveTo(s * 0.2, -s * 0.9, s * 0.36, -s * 0.86); c.lineWidth = 0.8; c.strokeStyle = '#4a3a2a'; c.stroke();
      c.restore();
    }
  });

  Art.add('prop', 'skylanterns', function (c, t, p, o) {
    var i, k = pulse(o), Ln = [[-22, 8, 1], [14, -14, 1.18], [30, 22, 0.72]], cols = [mix(p.accent, '#ff9a4a', 0.4), mix(p.gold, '#ffb45a', 0.35), mix(p.accent, '#ffc27a', 0.6)];
    for (i = 0; i < 3; i++) {
      var l = Ln[i], s = l[2], x = l[0] + Math.sin(t * 0.9 + i * 2) * 2.4, y = l[1] - Math.sin(t * 0.7 + i * 1.4) * 3, col = cols[i];
      K.glow(c, x, y + 4 * s, 30 * s, '#ffcf6a', 0.36 + 0.1 * Math.sin(t * 5 + i * 2) + k * 0.06);
      c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(t * 1.1 + i) * 0.06);
      /* the paper shade: wider at the top, lit from below */
      c.beginPath(); c.moveTo(-12, -16); c.quadraticCurveTo(0, -21, 12, -16); c.quadraticCurveTo(14, 2, 8.6, 15); c.lineTo(-8.6, 15); c.quadraticCurveTo(-14, 2, -12, -16); c.closePath();
      var g = c.createLinearGradient(0, -18, 0, 15); g.addColorStop(0, col); g.addColorStop(1, '#fff0b0'); c.fillStyle = g; c.fill(); c.lineWidth = K.ow() / s; c.strokeStyle = shade(col, -0.36); c.stroke();
      c.beginPath(); c.moveTo(-4.4, -18); c.quadraticCurveTo(-6, 0, -3.4, 15); c.moveTo(4.4, -18); c.quadraticCurveTo(6, 0, 3.4, 15); c.lineWidth = 0.7; c.strokeStyle = alpha(shade(col, -0.3), 0.6); c.stroke();
      R(c, -9, 14, 18, 2.8, 1.2, shade(col, -0.36));
      K.flame(c, 0, 14, 4.4, 7.4, t, i * 2.2);
      c.restore();
    }
    K.twinkle(c, -38, -30, 3 + Math.sin(t * 3) * 1.2, p.snow); K.twinkle(c, 40, -34, 2.4 + Math.cos(t * 3.4) * 1, p.snow); dot(c, -8, -38, 1.1, p.snow);
  });

  Art.add('prop', 'balloontrio', function (c, t, p, o) {
    var i, cols = [p.accent, p.gold, p.accent2], B = [[-20, -8, 15], [18, -2, 14], [0, -22, 17]], k = pulse(o), dr = Math.sin(t * 0.9) * 2;
    /* three balloons that got away, strings trailing loose */
    for (i = 0; i < 3; i++) {
      var b = B[i], x = b[0] + Math.sin(t * 1.2 + i * 2.1) * 2 + dr, y = b[1] + Math.cos(t * 1.4 + i) * 2 - (i === 2 ? k * 1.4 : 0), r = b[2], sw = Math.sin(t * 2.2 + i * 1.7) * 4;
      c.beginPath(); c.moveTo(x, y + r * 1.26); c.bezierCurveTo(x + sw, y + r * 1.26 + 9, x - sw, y + r * 1.26 + 18, x + sw * 0.6 + (0 - b[0]) * 0.2, y + r * 1.26 + 27); c.lineWidth = 1; c.lineCap = 'round'; c.strokeStyle = shade(p.paper, -0.22); c.stroke();
      Pg(c, [[x - 2.6, y + r * 1.36], [x + 2.6, y + r * 1.36], [x, y + r * 1.1]], shade(cols[i], -0.12));
      E(c, x, y, r, r * 1.2, cols[i]);
      c.beginPath(); c.ellipse(x + r * 0.2, y + r * 0.3, r * 0.78, r * 0.9, 0, 0.1, 1.5); c.lineWidth = r * 0.16; c.strokeStyle = 'rgba(30,20,50,0.1)'; c.stroke();
      K.shine(c, x - r * 0.36, y - r * 0.5, r * 0.26);
    }
  });

  Art.add('prop', 'cloudpair', function (c, t, p, o) {
    var d1 = Math.sin(t * 0.6) * 3, d2 = Math.sin(t * 0.45 + 2) * 4, sn = p.snow, sh = mix(shade(sn, -0.16), p.bg, 0.12);
    function cl(x, y, w, face) {
      K.cloud(c, x + w * 0.012, y + w * 0.05, w * 1.03, shade(sh, -0.25)); K.cloud(c, x, y + w * 0.035, w, sh); K.cloud(c, x - w * 0.01, y, w * 0.97, sn);
      if (face) { K.blush(c, x, y + w * 0.09, w * 0.16, w * 0.04); K.eyes(c, x, y + w * 0.03, w * 0.09, w * 0.024, { t: t, ph: 0.3 }, '#5b6b82'); c.beginPath(); c.arc(x, y + w * 0.06, w * 0.035, 0.15 * PI, 0.85 * PI); c.lineWidth = w * 0.014; c.lineCap = 'round'; c.strokeStyle = '#5b6b82'; c.stroke(); }
    }
    cl(14 + d2, -20, 50, false);
    cl(-8 + d1, 12, 76, true);
  });

  Art.add('prop', 'comet', function (c, t, p, o) {
    var i, k = pulse(o), ice = mix('#bfe9ff', p.snow, 0.3), R0 = rnd('comet');
    c.save(); c.rotate(0.62); c.translate(0, Math.sin(t * 1.6) * 1.2);
    /* the tail fans out behind, in layers */
    var tl = [[28, p.accent2, 0.8], [19, mix(ice, p.accent2, 0.25), 0.9], [9, p.snow, 0.95]];
    for (i = 0; i < 3; i++) { var w = tl[i][0], gr = c.createLinearGradient(-50, 0, 20, 0); gr.addColorStop(0, alpha(tl[i][1], 0)); gr.addColorStop(1, alpha(tl[i][1], tl[i][2])); var wv = Math.sin(t * 2.4 + i) * 3; c.beginPath(); c.moveTo(24, -w * 0.54); c.quadraticCurveTo(-8, -w * 0.5 + wv * 0.4, -52 + i * 10, wv - (1 - i) * 5); c.quadraticCurveTo(-8, w * 0.5 + wv * 0.4, 24, w * 0.54); c.closePath(); c.fillStyle = gr; c.fill(); }
    for (i = 0; i < 7; i++) { var f = frac(t * 0.5 + i / 7), y = (R0() - 0.5) * 30; dot(c, 14 - f * 60, y * (0.4 + f), 1.5 * (1 - f) + 0.4, alpha(p.snow, 1 - f)); }
    K.glow(c, 24, 0, 30, ice, 0.4 + k * 0.12);
    /* the icy head */
    E(c, 24, 0, 14.4, 14.4, ice); dot(c, 22, -2, 10.4, shade(ice, 0.35)); dot(c, 27.4, 4, 2.4, shade(ice, -0.16)); dot(c, 19, 6, 1.6, shade(ice, -0.16)); dot(c, 29, -5, 1.4, shade(ice, -0.16)); K.shine(c, 19.4, -5.4, 3.4);
    c.restore();
    K.twinkle(c, -34, -30, 3.4 + Math.sin(t * 3) * 1.4, p.snow); K.twinkle(c, 36, -22, 2.4 + Math.cos(t * 3.6) * 1, p.snow); dot(c, -20, 38, 1.2, p.snow);
  });
});
