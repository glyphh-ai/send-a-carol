/* Send a Carol art pack: friendly spooky characters (ghost, witch, pumpkinpal, bat) and food with faces and little legs
   (veg, breakfast, sweet, fruit). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var INK = '#3a2620', LIMB = '#8a5f40';
  var SKIN = ['#f6cfa8', '#b9774a', '#7c4a2d', '#e3ac7c'];

  /* ---------- shared pieces ---------- */
  function legs(c, dx, y0, shoe, m, col) { /* two thin legs down to round shoes; the feet tap out on the beat */
    for (var i = -1; i <= 1; i += 2) { var fx = i * (dx + 2 + m.k * 1.5); L(c, i * dx, y0, fx - i * 1.5, -3.5, 3.6, shade(col || LIMB, -0.3)); L(c, i * dx, y0, fx - i * 1.5, -3.5, 2.4, col || LIMB); E(c, fx + i * 1.5, -3, 6.2, 3.6, shoe); dot(c, fx + i * 2.5, -4.2, 1.2, 'rgba(255,255,255,0.45)'); }
  }
  function arms(c, sx, sy, m, len, base, amp, col, hand) { /* two thin arms with mitten hands; returns the two hand points */
    var aa = K.armAngles(m, base, amp);
    return [K.arm(c, -sx, sy, -1, aa[0], len, 2.5, col || LIMB, hand || '#ffffff', 3.4), K.arm(c, sx, sy, 1, aa[1], len, 2.5, col || LIMB, hand || '#ffffff', 3.4)];
  }
  function face(c, x, y, s, m, ink) { K.eyes(c, x, y, 7 * s, 2.5 * s, m, ink || INK); K.blush(c, x, y + 4.6 * s, 11.5 * s, 2.7 * s); K.mouth(c, x, y + 6.6 * s, 4.6 * s, m, ink || INK); }
  function hl(c, x, y, rx, ry, rot, a) { c.fillStyle = 'rgba(255,255,255,' + (a || 0.4) + ')'; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fill(); }
  function shadow(c, w) { c.fillStyle = 'rgba(0,0,0,0.14)'; c.beginPath(); c.ellipse(0, -0.6, w, 2.6, 0, 0, TAU); c.fill(); }
  function star(c, x, y, r, col, rot) { K.starPath(c, x, y, r, r * 0.48, 5, rot || 0); F(c, col); }
  function leafE(c, x, y, len, w, rot, col) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.45, -w, len, 0); c.quadraticCurveTo(len * 0.45, w, 0, 0); c.closePath(); F(c, col); L(c, len * 0.12, 0, len * 0.8, 0, 0.6, shade(col, -0.22)); c.restore(); }

  /* ====================================================== SPOOKY ====================================================== */

  /* ---------- ghost: a friendly sheet ghost that hovers ---------- */
  var GH = [['#ffffff', '#d9e2f3'], ['#fff5e2', '#ecd6b4'], ['#efe6ff', '#cdbdf0'], ['#dffaf0', '#b4e2d0']];
  Art.add('character', 'ghost', function (c, m, p) {
    var v = m.v, col = GH[v][0], sh = GH[v][1], fl = Math.sin(m.t * 2.2 + m.ph * 6) * 1.6, hx = m.sw * 2.2, hy = -64 + m.k * 2.5 + fl, i, aa = K.armAngles(m, 1.25, 0.8);
    var hem = -9 + fl, w = 25, sx = -m.sw * 3;
    c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(0, -1, 17 - fl * 1.5, 2.8, 0, 0, TAU); c.fill();
    K.arm(c, -17, -47 + fl, -1, aa[0], 16, 10, col, col, 5.6); var h = K.arm(c, 17, -47 + fl, 1, aa[1], 16, 10, col, col, 5.6);
    c.beginPath(); c.moveTo(hx - 20, hy + 2); c.bezierCurveTo(hx - 20, hy - 29, hx + 20, hy - 29, hx + 20, hy + 2);
    c.quadraticCurveTo(w - 2, -34 + fl, w + sx, hem);
    for (i = 0; i < 5; i++) { var x0 = w - i * 10, x1 = x0 - 10; c.quadraticCurveTo((x0 + x1) / 2 + sx, hem + 9 + Math.sin(m.t * 5 + i * 1.7) * 1.6 + m.k * 2, x1 + sx, hem - (i === 4 ? 0 : 1.5)); }
    c.quadraticCurveTo(-w + 2, -34 + fl, hx - 20, hy + 2); c.closePath(); F(c, col);
    for (i = -1; i <= 1; i++) L(c, i * 10 + sx, hem - 2, i * 9 + sx * 0.4, hem - 15 - Math.abs(i) * 3, 1.3, sh); /* folds */
    c.fillStyle = alpha(sh, 0.5); c.beginPath(); c.ellipse(16 + sx * 0.5, -27 + fl, 4.5, 13, -0.1, 0, TAU); c.fill();
    hl(c, hx - 9, hy - 12, 5, 2.8, -0.6, 0.9);
    K.eyes(c, hx, hy - 1, 7.6, 3.3, m, '#2b2440'); K.blush(c, hx, hy + 5.5, 13, 3);
    K.mouth(c, hx, hy + 8.5, 5, m, '#2b2440');
    if (v === 0) { K.bow(c, hx * 0.5, -40 + fl, 15, p.accent); for (i = 0; i < 2; i++) dot(c, hx * 0.4, -30 + i * 8 + fl, 1.5, sh); }
    else if (v === 1) { /* party hat and a balloon */
      var tx = hx + m.sw * 2.5, ty = hy - 43 + m.k * 2;
      c.beginPath(); c.moveTo(hx - 10, hy - 18); c.lineTo(tx, ty); c.lineTo(hx + 10, hy - 18); c.closePath(); F(c, p.accent2);
      c.save(); c.clip(); for (i = 0; i < 4; i++) L(c, hx - 14, hy - 21 - i * 6.5, hx + 14, hy - 25 - i * 6.5, 2.2, p.gold); c.restore();
      R(c, hx - 11.5, hy - 20.5, 23, 4.2, 2.1, p.paper); K.pom(c, tx, ty, 3.4, p.accent);
      if (!m.wave) { var bx = h[0] + 5 + m.sw * 3, by = h[1] - 30; L(c, h[0], h[1], bx, by + 9, 0.7, '#8a8090'); E(c, bx, by, 8, 9.5, p.accent); Pg(c, [[bx - 1.6, by + 11.5], [bx + 1.6, by + 11.5], [bx, by + 9]], p.accent); hl(c, bx - 2.6, by - 3.6, 2.2, 3, -0.5, 0.55); }
    } else if (v === 2) { /* flower crown and a patch */
      var fc = [p.accent, p.gold, '#ff9ab8', p.gold, p.accent];
      for (i = -2; i <= 2; i++) { K.leaf(c, hx + i * 7.4 - 3, hy - 19.5 + Math.abs(i) * 2.6, 6, -0.4, '#57b36f'); K.flower(c, hx + i * 7.4, hy - 21 + Math.abs(i) * 2.6, i === 0 ? 4.6 : 3.8, fc[i + 2], '#fff6c4', m.t * 0.5 + i); }
      R(c, -12 + sx * 0.4, -28 + fl, 9, 8, 1.5, '#ffb3c8'); for (i = 0; i < 3; i++) L(c, -11.5 + sx * 0.4 + i * 3.3, -29.5 + fl, -11.5 + sx * 0.4 + i * 3.3, -27 + fl, 0.6, '#8a5a78');
    } else { /* little top hat, monocle and bow */
      c.save(); c.translate(hx + 2, hy - 20); c.rotate(0.14 + m.sw * 0.06); R(c, -9, -17 - m.k * 1.5, 18, 17, 2, '#3a3550'); Rn(c, -9, -6.5 - m.k * 0.6, 18, 3.6, 0, p.accent); R(c, -14, -2, 28, 4.4, 2.2, '#3a3550'); c.restore();
      c.beginPath(); c.arc(hx + 7.6, hy - 1, 5.2, 0, TAU); c.lineWidth = 1.1; c.strokeStyle = p.gold; c.stroke(); L(c, hx + 11.5, hy + 3, hx + 14, hy + 14, 0.6, p.gold);
      K.bow(c, hx * 0.5, -40 + fl, 12, p.gold);
    }
  }, { wide: 0.85, variants: ['bow-tie ghost', 'party ghost', 'flower-crown ghost', 'top-hat ghost'] });

  /* ---------- witch: a friendly witch, four of them ---------- */
  var WD = ['#6b3fa0', '#e0762b', '#1f8a8a', '#2f2a44'], WH = ['#4a2a78', '#2f2a44', '#16686a', '#2f2a44'], WHAIR = ['#d2622a', '#221a18', '#3a2418', '#e9e4ee'];
  Art.add('character', 'witch', function (c, m, p) {
    var v = m.v, sk = SKIN[v], dr = WD[v], hat = WH[v], hr = WHAIR[v], hx = m.sw * 2, hy = -62 + m.k * 2, i, j, aa = K.armAngles(m, 0.9, 0.55);
    var st = v === 1 ? '#2f2a44' : v === 3 ? p.accent : '#ffffff', st2 = v === 0 ? '#3fae6a' : v === 1 ? p.gold : v === 2 ? p.accent : '#2f2a44';
    for (i = -1; i <= 1; i += 2) { /* striped stockings and pointed boots */
      L(c, i * 6, -26, i * 6.5, -6, 6.4, shade(st, -0.34)); L(c, i * 6, -26, i * 6.5, -6, 5, st); for (j = 0; j < 3; j++) L(c, i * 6.2 - 2.3, -21 + j * 5.5, i * 6.2 + 2.3, -21 + j * 5.5, 2, st2);
      c.beginPath(); c.moveTo(i * 3, -7.5); c.lineTo(i * 10, -7.5); c.quadraticCurveTo(i * 17, -5, i * 17.5 + i * m.k, -9.5); c.quadraticCurveTo(i * 17, 0, i * 9, 0); c.lineTo(i * 3, 0); c.closePath(); F(c, '#3a2f4a');
    }
    /* the hand that holds something, behind the dress */
    var lh;
    if (v === 0) { /* broom */
      lh = K.arm(c, -12, -48, -1, 1.15 + m.sw * 0.12, 15, 5.5, dr, sk, 3.3);
      c.save(); c.translate(lh[0], lh[1]); c.rotate(-0.16 + m.sw * 0.07); L(c, 0, -30, 0, 24, 2.6, '#6b4226'); L(c, 0, -30, 0, 24, 1.5, '#a9703f');
      c.beginPath(); c.moveTo(-3, 24); c.lineTo(3, 24); c.lineTo(8 + m.sw * 1.5, 46); c.lineTo(-8 + m.sw * 1.5, 46); c.closePath(); F(c, '#e7b955'); for (i = -2; i <= 2; i++) L(c, i * 1, 28, i * 3 + m.sw * 1.5, 45, 0.6, '#b98a35'); R(c, -4, 23, 8, 3.4, 1.2, p.accent); c.restore();
      K.arm(c, -12, -48, -1, 1.15 + m.sw * 0.12, 15, 5.5, dr, sk, 3.3);
    } else lh = K.arm(c, -12, -48, -1, v === 1 ? 2.1 + m.sw * 0.3 + m.k * 0.2 : 1.0 + m.sw * 0.15, 15, 5.5, dr, sk, 3.3);
    K.arm(c, 12, -48, 1, m.wave ? aa[1] : 0.75 - m.sw * 0.5, 15, 5.5, dr, sk, 3.3);
    /* dress with a zigzag hem */
    c.beginPath(); c.moveTo(-11, -54); c.quadraticCurveTo(-15, -36, -21 - m.sw, -19); for (i = 0; i < 6; i++) { c.lineTo(-21 + i * 7 + 3.5 - m.sw, -14 - m.k); c.lineTo(-21 + (i + 1) * 7 - m.sw, -19); } c.quadraticCurveTo(15, -36, 11, -54); c.closePath(); F(c, dr);
    Rn(c, -12.5, -41, 25, 3.6, 1.2, shade(dr, -0.3)); R(c, -3, -42.4, 6, 6.2, 1.2, p.gold); Rn(c, -1.3, -40.8, 2.6, 3, 0.4, shade(dr, -0.3));
    if (v === 3) { star(c, -9, -29, 2.6, p.gold, 0.3); star(c, 7, -25, 2, p.gold, 0); star(c, 1, -32, 1.5, p.gold, 0.5); star(c, 12, -32, 1.4, p.gold, 0.2); }
    else if (v === 1) { for (i = -1; i <= 1; i++) dot(c, i * 9, -27 + Math.abs(i) * 2, 1.7, '#2f2a44'); }
    else if (v === 2) { c.beginPath(); c.arc(-8, -29, 3.4, 0.6, 4.2); c.lineWidth = 1.2; c.strokeStyle = p.gold; c.stroke(); dot(c, 8, -27, 1.4, p.gold); dot(c, 2, -31, 1, p.gold); }
    else { c.beginPath(); c.arc(0, -29, 4, 0, TAU); c.fillStyle = p.gold; c.fill(); c.beginPath(); c.arc(2, -30, 3.3, 0, TAU); c.fillStyle = dr; c.fill(); } /* a small moon */
    Pg(c, [[-9, -55], [0, -49], [9, -55], [0, -57]], shade(dr, 0.25)); /* collar */
    /* hair behind, head, hair in front */
    if (v === 0 || v === 2) K.hairdo(c, hx, hy, 13, hr, 2);
    if (v === 1) for (i = -1; i <= 1; i += 2) E(c, hx + i * 13.5, hy + 1, 6.5, 7.5, hr);
    K.head(c, hx, hy, 12, sk, m);
    if (v === 3) { K.hairdo(c, hx, hy, 12.2, hr, 0); for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(hx + i * 5, hy + 0.6, 3.5, 0, TAU); c.lineWidth = 0.8; c.strokeStyle = p.gold; c.stroke(); } L(c, hx - 1.5, hy + 0.6, hx + 1.5, hy + 0.6, 0.8, p.gold); }
    else if (v === 1) K.hairdo(c, hx, hy, 12.2, hr, 1); else K.hairdo(c, hx, hy, 12.2, hr, 0);
    /* the hat: every witch's is a different shape */
    var bh = [36, 27, 31, 22][v], bend = [9, -7, 13, 4][v], tx = hx + bend + m.sw * 4, ty = hy - 10 - bh - m.k * 2, bw = [22, 19, 26, 20][v];
    c.save(); c.translate(hx, hy - 10); c.rotate(m.sw * 0.04 + (v === 2 ? -0.1 : 0.05)); c.translate(-hx, -(hy - 10));
    E(c, hx, hy - 9.5, bw, 4.6, hat);
    c.beginPath(); c.moveTo(hx - 11, hy - 10.5); c.quadraticCurveTo(hx - 5, hy - 10 - bh * 0.7, tx, ty); c.quadraticCurveTo(hx + 4 + bend * 0.2, hy - 10 - bh * 0.55, hx + 11, hy - 10.5); c.quadraticCurveTo(hx, hy - 7.5, hx - 11, hy - 10.5); c.closePath(); F(c, hat);
    c.beginPath(); c.moveTo(hx - 10.6, hy - 12); c.quadraticCurveTo(hx, hy - 9, hx + 10.6, hy - 12); c.lineTo(hx + 9.6, hy - 16.5); c.quadraticCurveTo(hx, hy - 13.5, hx - 9.6, hy - 16.5); c.closePath(); F(c, v === 1 ? p.accent : v === 3 ? p.gold : p.accent2);
    if (v === 0 || v === 2) { R(c, hx - 3, hy - 16.6, 6, 5.6, 1, p.gold); Rn(c, hx - 1.4, hy - 15.2, 2.8, 2.8, 0.4, hat); }
    if (v === 1) K.flower(c, hx + 6, hy - 14.5, 3.6, p.gold, '#fff6c4', 0.3);
    if (v === 3) { star(c, hx - 1, hy - 23, 2.2, p.gold, 0.2); dot(c, hx + 4.5, hy - 19.5, 0.9, p.gold); }
    if (v === 2) K.pom(c, tx, ty, 2.6, p.gold);
    c.restore();
    /* what she holds */
    if (v === 1) { /* a star wand that sparkles on the beat */
      var wx = lh[0] - 6 - m.sw * 2, wy = lh[1] - 15; L(c, lh[0], lh[1], wx, wy, 2.2, '#3a2f4a'); L(c, lh[0], lh[1], wx, wy, 1.2, '#8a6a4a'); star(c, wx, wy, 5.4 + m.k * 1.2, p.gold, m.t * 1.2);
      for (i = 0; i < 3; i++) { var sa = m.t * 2.4 + i * 2.1; K.twinkle(c, wx + Math.cos(sa) * (9 + m.k * 3), wy + Math.sin(sa) * (8 + m.k * 3), 1.6 + m.k * 1.6, p.snow); }
    } else if (v === 2) { /* a bubbling potion */
      var px = lh[0] - 2, py = lh[1] - 3; R(c, px - 2.2, py - 12, 4.4, 6, 1, '#e8f6f4'); E(c, px, py, 7, 7, '#e8f6f4'); c.fillStyle = '#7be07f'; c.beginPath(); c.arc(px, py, 5.8, -0.1, PI + 0.1); c.fill(); R(c, px - 3, py - 14, 6, 2.6, 1, '#a9703f'); hl(c, px - 2.6, py - 2.6, 1.4, 2.2, -0.5, 0.7);
      for (i = 0; i < 3; i++) { var bt = frac(m.t * 0.8 + i * 0.37); c.globalAlpha = 1 - bt; dot(c, px + Math.sin(i * 2.3 + bt * 4) * 3, py - 15 - bt * 14, 1.2 + bt * 1.6, '#9af09c'); } c.globalAlpha = 1;
    } else if (v === 3) { /* a little lantern pumpkin */
      var qx = lh[0] - 1, qy = lh[1] + 7; c.beginPath(); c.arc(qx, qy - 6, 5.5, PI * 1.1, PI * 1.9); c.lineWidth = 0.9; c.strokeStyle = '#6b4226'; c.stroke();
      E(c, qx - 3.4, qy, 4.6, 5.6, '#f08a2c'); E(c, qx + 3.4, qy, 4.6, 5.6, '#f08a2c'); E(c, qx, qy, 4, 5.9, '#f59a3a'); Pg(c, [[qx - 3.6, qy - 1.4], [qx - 1.2, qy - 1.4], [qx - 2.4, qy - 3.4]], '#ffe27a', true); Pg(c, [[qx + 3.6, qy - 1.4], [qx + 1.2, qy - 1.4], [qx + 2.4, qy - 3.4]], '#ffe27a', true);
      c.beginPath(); c.arc(qx, qy + 0.6, 3, 0.1 * PI, 0.9 * PI); c.closePath(); c.fillStyle = '#ffe27a'; c.fill(); c.globalAlpha = 0.25 + m.k * 0.3; dot(c, qx, qy, 10, '#ffd54a'); c.globalAlpha = 1;
    }
  }, { wide: 0.9, variants: ['broom witch', 'wand witch', 'potion witch', 'granny witch with a lantern'] });

  /* ---------- pumpkinpal: a jack-o-lantern with legs ---------- */
  var PK = [['#f58a1f', 30, 25], ['#f6eedb', 28, 25], ['#93b548', 23, 31], ['#de5a22', 33, 20.5]];
  Art.add('character', 'pumpkinpal', function (c, m, p) {
    var v = m.v, col = PK[v][0], rx = PK[v][1], ry = PK[v][2], cy = -11 - ry + m.k * 1.5, hx = m.sw * 1.6, i, lit = '#ffe27a', dk = shade(col, -0.16), gr = '#4f9a4a';
    var blink = frac(m.t * 0.31 + m.ph + v * 0.13) < 0.035, boot = [p.accent2, '#7a5ab8', p.accent, '#3a3550'][v];
    shadow(c, rx * 0.85);
    legs(c, rx * 0.3, cy + ry - 3, boot, m, v === 1 ? '#8a8090' : '#5c7a2e');
    var hs = arms(c, rx - 2, cy + 2, m, 15, 1.15, 0.8, gr, gr);
    for (i = 0; i < 2; i++) leafE(c, hs[i][0], hs[i][1], 7, 3, (i ? -0.5 : PI + 0.5) - (i ? 1 : -1) * 0.4, '#6bbf5c');
    /* stem and curl, behind the body */
    var sx = hx * 0.6 + m.sw * 2, top = cy - ry;
    c.beginPath(); c.moveTo(-4, top + 4); c.quadraticCurveTo(-3, top - 6, sx - 2, top - 10 - m.k * 1.5); c.lineTo(sx + 4.5, top - 9 - m.k * 1.5); c.quadraticCurveTo(3, top - 3, 5, top + 4); c.closePath(); F(c, '#6b8a3a');
    c.beginPath(); c.moveTo(5, top + 1); c.bezierCurveTo(14, top - 8, 20 + m.sw * 2, top - 2, 15 + m.sw * 2, top - 7); c.lineWidth = 1.3; c.strokeStyle = gr; c.stroke();
    leafE(c, -3, top + 2, 13, 5.5, PI + 0.5 + m.sw * 0.15, '#6bbf5c');
    /* ribbed body */
    E(c, -rx * 0.5, cy, rx * 0.56, ry * 0.95, dk); E(c, rx * 0.5, cy, rx * 0.56, ry * 0.95, dk);
    E(c, -rx * 0.27, cy, rx * 0.5, ry * 0.99, col); E(c, rx * 0.27, cy, rx * 0.5, ry * 0.99, col);
    E(c, 0, cy, rx * 0.36, ry, shade(col, 0.1));
    hl(c, -rx * 0.42, cy - ry * 0.55, rx * 0.16, ry * 0.2, -0.5, 0.35);
    /* the carved face glows; the grin opens to sing */
    var ey = cy - ry * 0.2, ex = rx * 0.36, cut = shade(col, -0.5);
    c.globalAlpha = 0.22 + m.k * 0.2; c.fillStyle = lit; c.beginPath(); c.ellipse(hx, cy + 1, rx * 0.74, ry * 0.74, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
    c.lineJoin = 'round';
    for (i = -1; i <= 1; i += 2) {
      var x = hx + i * ex;
      if (blink) { L(c, x - 4, ey, x + 4, ey, 1.6, cut); continue; }
      c.beginPath();
      if (v === 0) { c.moveTo(x - 5.5, ey + 4); c.lineTo(x + 5.5, ey + 4); c.lineTo(x + i * -1.5, ey - 6); c.closePath(); }
      else if (v === 1) c.ellipse(x, ey - 0.5, 4, 5.8, i * -0.12, 0, TAU);
      else if (v === 2) K.starPath(c, x, ey, 5.6, 2.6, 5, 0);
      else { c.arc(x, ey + 2, 5.6, PI, TAU); c.closePath(); }
      c.fillStyle = lit; c.fill(); c.lineWidth = 1.2; c.strokeStyle = cut; c.stroke();
      if (v === 1) hl(c, x - 1.2, ey - 2.6, 1.2, 1.8, 0, 0.8);
    }
    Pg(c, [[hx - 2.4, ey + 9], [hx + 2.4, ey + 9], [hx, ey + 5]], lit, true); c.lineWidth = 1; c.strokeStyle = cut; c.stroke();
    var my = cy + ry * 0.36, mw = rx * 0.5, mh = 3.4 + m.open * 6.5;
    c.beginPath();
    if (v === 0 || v === 3) { /* zigzag grin */
      c.moveTo(hx - mw, my - 2.5); for (i = 1; i <= 6; i++) c.lineTo(hx - mw + i * mw / 3, my - 2.5 + (i % 2 ? 2.6 : 0) + (i === 6 ? 0 : 0.8)); c.quadraticCurveTo(hx + mw * 0.6, my + mh + 4, hx, my + mh + 4.5); c.quadraticCurveTo(hx - mw * 0.6, my + mh + 4, hx - mw, my - 2.5);
    } else if (v === 1) { c.moveTo(hx - mw, my - 1); c.quadraticCurveTo(hx, my + 2, hx + mw, my - 1); c.quadraticCurveTo(hx + mw * 0.5, my + mh + 5, hx, my + mh + 5); c.quadraticCurveTo(hx - mw * 0.5, my + mh + 5, hx - mw, my - 1); }
    else c.ellipse(hx, my + 2, 4.2 + m.open * 1.5, 3 + m.open * 5, 0, 0, TAU);
    c.closePath(); c.fillStyle = lit; c.fill(); c.lineWidth = 1.2; c.strokeStyle = cut; c.stroke();
    if (v === 1) { Rn(c, hx - 5.5, my + 0.2, 4, 3.4, 0.6, col); c.lineWidth = 0.8; c.strokeStyle = cut; c.strokeRect(hx - 5.5, my + 0.4, 4, 3.2); }
    K.blush(c, hx, cy + ry * 0.2, rx * 0.66, 2.8, 'rgba(230,70,60,0.3)');
    if (v === 3) { /* a crooked little witch hat */
      c.save(); c.translate(hx - 6, top + 3); c.rotate(-0.28 + m.sw * 0.06); E(c, 0, 0, 13, 3, '#3a3550'); c.beginPath(); c.moveTo(-7, -0.5); c.quadraticCurveTo(-2, -12, 4 + m.sw * 3, -19 - m.k * 2); c.quadraticCurveTo(3, -8, 7, -0.5); c.closePath(); F(c, '#3a3550'); Rn(c, -6.4, -4, 12.6, 2.6, 1, p.accent); c.restore();
    }
    if (v === 1) K.bow(c, hx, cy + ry - 2.5, 11, p.accent);
  }, { wide: 1.0, variants: ['classic jack-o-lantern', 'white pumpkin with a bow', 'tall green gourd', 'squat red pumpkin in a witch hat'] });

  /* ---------- bat: a round fuzzy bat that flaps on the beat ---------- */
  var BT = [['#7a5ab8', '#c9b4f0'], ['#a0683c', '#f3dcb8'], ['#6a6492', '#cfcae6'], ['#f29bb8', '#ffe3ec']];
  function batWing(c, s, a, col, in2, k) {
    c.save(); c.translate(s * 13, -38); c.scale(s, 1); c.rotate(-(a - PI / 2));
    c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(16, -17, 33, -12 - k); c.quadraticCurveTo(30, -3, 31, 6); c.quadraticCurveTo(25, 0, 21, 9); c.quadraticCurveTo(16, 2, 11, 10); c.quadraticCurveTo(6, 4, 0, 8); c.closePath(); F(c, col);
    c.lineWidth = 0.8; c.strokeStyle = in2; c.beginPath(); c.moveTo(2, -3); c.lineTo(31, 5); c.moveTo(2, -3); c.lineTo(21, 8); c.moveTo(2, -3); c.lineTo(11, 9); c.stroke();
    dot(c, 33, -12 - k, 1.5, in2); c.restore();
  }
  Art.add('character', 'bat', function (c, m, p) {
    var v = m.v, col = BT[v][0], lt = BT[v][1], dk = shade(col, -0.22), hx = m.sw * 2.2, hy = -56 + m.k * 2.5, i, aa = K.armAngles(m, 1.55, 0.6), fl = Math.sin(m.t * 7 + m.ph * 5) * 0.12;
    shadow(c, 14);
    batWing(c, -1, aa[0] + fl, shade(col, -0.1), shade(col, -0.4), m.k * 2); batWing(c, 1, aa[1] + (m.wave ? 0 : fl), shade(col, -0.1), shade(col, -0.4), m.k * 2);
    for (i = -1; i <= 1; i += 2) { L(c, i * 6, -13, i * 7, -4, 2.2, dk); E(c, i * 8.5, -2.8, 5.2, 3, dk); }
    E(c, 0, -29, 17, 19, col); E(c, 0, -26, 10.5, 13, lt);
    for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 5 - 2, -30 + Math.abs(i) * 2); c.lineTo(i * 5, -27.5 + Math.abs(i) * 2); c.lineTo(i * 5 + 2, -30 + Math.abs(i) * 2); c.lineWidth = 0.8; c.strokeStyle = shade(lt, -0.18); c.stroke(); }
    /* ears: each bat's are its own */
    for (i = -1; i <= 1; i += 2) {
      var ek = m.k * 2 * (i > 0 ? 1 : 0.4);
      if (v === 1) { E(c, hx + i * 14, hy - 14 - ek, 7.5, 9, col, i * 0.3); c.fillStyle = '#eaa9a0'; c.beginPath(); c.ellipse(hx + i * 14, hy - 13.5 - ek, 4, 5.6, i * 0.3, 0, TAU); c.fill(); }
      else if (v === 2) { E(c, hx + i * 15, hy - 15 - ek, 10, 12, col, i * 0.35); c.fillStyle = lt; c.beginPath(); c.ellipse(hx + i * 15, hy - 14 - ek, 6, 8, i * 0.35, 0, TAU); c.fill(); }
      else { var eh = v === 0 ? 27 : 19; Pg(c, [[hx + i * 4, hy - 10], [hx + i * (v === 0 ? 14 : 17), hy - eh - ek], [hx + i * 18, hy - 5]], col); Pg(c, [[hx + i * 8.5, hy - 11], [hx + i * (v === 0 ? 13.6 : 15.6), hy - eh + 6 - ek], [hx + i * 15.5, hy - 8]], v === 3 ? '#ffffff' : lt, true); }
    }
    E(c, hx, hy, 19, 16.5, col);
    if (v === 0) for (i = -1; i <= 1; i++) Pg(c, [[hx + i * 4 - 2.4, hy - 15.5], [hx + i * 4 + 2.4, hy - 15.5], [hx + i * 5, hy - 21 - m.k * 1.5]], col); /* tuft */
    if (v === 1) E(c, hx, hy + 6, 9.5, 7, lt); /* a fruit bat's snout */
    if (v === 3) for (i = -1; i <= 1; i += 2) E(c, hx + i * 13, hy + 8, 5, 3.6, col, i * -0.5); /* cheek fluff */
    K.eyes(c, hx, hy - 1.5, 7.8, v === 3 ? 2.9 : 2.5, m); K.blush(c, hx, hy + 4.2, 13.5, 2.8);
    E(c, hx, hy + 3.2, 2.4, 1.8, v === 1 ? INK : shade(col, -0.55));
    K.mouth(c, hx, hy + 8.2, 4.4, m, INK);
    if (m.open <= 0.12) for (i = -1; i <= 1; i += 2) Pg(c, [[hx + i * 2.6 - 1.1, hy + 8.4], [hx + i * 2.6 + 1.1, hy + 8.4], [hx + i * 2.6, hy + 11.2]], '#ffffff', true); /* tiny fangs */
    else for (i = -1; i <= 1; i += 2) Pg(c, [[hx + i * 2.4 - 1, hy + 6.6], [hx + i * 2.4 + 1, hy + 6.6], [hx + i * 2.4, hy + 9]], '#ffffff', true);
    if (v === 2) K.bow(c, hx * 0.4, -43, 13, p.accent);
    if (v === 1) { leafE(c, hx - 3, hy - 15, 9, 3.4, -2.2 + m.sw * 0.2, '#6bbf5c'); E(c, hx - 1, hy - 16.5, 3.6, 3.6, p.accent); hl(c, hx - 2, hy - 17.6, 1, 0.8, 0, 0.6); } /* a berry on its head */
    if (v === 3) K.flower(c, hx + 13, hy - 11, 4.4, p.gold, '#ffffff', m.t * 0.6);
    if (v === 0) { Pg(c, [[-8, -43], [8, -43], [0, -36]], p.accent2); dot(c, 0, -41, 1, p.paper); }
  }, { wide: 1.25, variants: ['purple bat', 'fruit bat', 'big-eared bat in a bow tie', 'pink bat'] });

  /* ======================================================= FOOD ======================================================= */

  /* ---------- veg: carrot, tomato, pea pod, corn ---------- */
  Art.add('character', 'veg', function (c, m, p) {
    var v = m.v, hx = m.sw * 1.8, i, j, by = m.k * 1.5, gr = '#4fa24a', gr2 = '#6bbf5c';
    if (v === 0) { /* carrot */
      var og = '#f58a2c';
      shadow(c, 11); legs(c, 4, -14 + by, p.accent2, m);
      for (i = -2; i <= 2; i++) { c.save(); c.translate(i * 3.5, -73 + by); c.rotate(i * 0.3 + m.sw * 0.18 + Math.sin(m.t * 2 + i) * 0.04); leafE(c, 0, 0, 22 - Math.abs(i) * 3 + m.k * 2, 5, -PI / 2, i % 2 ? gr : gr2); c.restore(); }
      arms(c, 15, -50 + by, m, 15, 1.2, 0.8);
      c.beginPath(); c.moveTo(-18, -66 + by); c.quadraticCurveTo(0, -84 + by, 18, -66 + by); c.quadraticCurveTo(15, -30, 4, -11 + by); c.quadraticCurveTo(0, -7 + by, -4, -11 + by); c.quadraticCurveTo(-15, -30, -18, -66 + by); c.closePath(); F(c, og);
      c.save(); c.clip(); c.fillStyle = alpha(shade(og, -0.3), 0.35); c.beginPath(); c.ellipse(15, -40, 9, 34, 0.12, 0, TAU); c.fill(); c.restore();
      L(c, -13, -33 + by, -6, -32 + by, 1.1, shade(og, -0.2)); L(c, 5, -24 + by, 10, -25 + by, 1.1, shade(og, -0.2)); L(c, -9, -21 + by, -4, -20 + by, 1.1, shade(og, -0.2)); L(c, 8, -68 + by, 13, -66 + by, 1.1, shade(og, -0.2));
      hl(c, -10, -62 + by, 3, 7, 0.2, 0.4);
      face(c, hx, -53 + by, 1, m);
    } else if (v === 1) { /* tomato */
      var rd = '#e5392e';
      shadow(c, 24); legs(c, 9, -12 + by, p.accent2, m);
      arms(c, 28, -36 + by, m, 14, 1.2, 0.8);
      E(c, 0, -35 + by, 31, 27, rd); c.save(); c.beginPath(); c.ellipse(0, -35 + by, 30.4, 26.4, 0, 0, TAU); c.clip(); c.fillStyle = alpha(shade(rd, -0.3), 0.3); c.beginPath(); c.ellipse(13, -27 + by, 16, 17, -0.5, 0, TAU); c.fill(); c.fillStyle = rd; c.beginPath(); c.ellipse(8, -32 + by, 17, 18, -0.5, 0, TAU); c.fill(); c.restore();
      hl(c, -17, -49 + by, 6, 3.6, -0.6, 0.55); hl(c, -23, -40 + by, 1.8, 2.6, 0, 0.45);
      for (i = 0; i < 5; i++) leafE(c, m.sw * 1.2, -60 + by, 14 + (i === 2 ? m.k * 2 : 0), 3.6, PI + i * PI / 4 + (i - 2) * 0.12, i % 2 ? gr : gr2);
      c.beginPath(); c.moveTo(-2 + m.sw * 1.2, -60 + by); c.quadraticCurveTo(-1, -68 + by, 3 + m.sw * 3, -71 + by - m.k); c.lineWidth = 4.2; c.strokeStyle = shade(gr, -0.34); c.stroke(); c.lineWidth = 2.8; c.strokeStyle = gr; c.stroke();
      face(c, hx, -34 + by, 1.12, m);
    } else if (v === 2) { /* pea pod: three peas, the middle one leads the song */
      var pd = '#3f9a4a', pea = '#8fd45a';
      shadow(c, 13); legs(c, 5, -10 + by, p.accent, m);
      arms(c, 17, -44 + by, m, 14, 1.2, 0.8);
      E(c, 0, -46 + by, 19, 39, pd);
      c.beginPath(); c.moveTo(0, -84 + by); c.bezierCurveTo(4, -92 + by, 12 + m.sw * 3, -92 + by, 10 + m.sw * 3, -86 + by - m.k); c.lineWidth = 1.5; c.strokeStyle = pd; c.stroke(); leafE(c, -1, -83 + by, 8, 3, PI + 0.6, gr2);
      c.fillStyle = shade(pd, -0.3); c.beginPath(); c.ellipse(0, -46 + by, 12.5, 33, 0, 0, TAU); c.fill();
      for (j = 0; j < 3; j++) { var py = -67 + j * 21 + by + (j === 1 ? 0 : (j ? 1 : -1) * m.k * 1.2), px = (j === 1 ? hx * 0.6 : -hx * 0.5); E(c, px, py, 10.5, 10.3, j === 1 ? pea : shade(pea, j ? -0.08 : 0.1)); hl(c, px - 4, py - 5, 2.6, 1.6, -0.6, 0.5);
        if (j === 1) face(c, px, py - 1.5, 0.74, m); else { K.eyes(c, px, py - 1, 3.8, 1.5, { t: m.t, ph: m.ph + 0.3 + j * 0.2, calm: false }, INK); K.blush(c, px, py + 2, 6.6, 1.6); c.beginPath(); c.arc(px, py + 1.6, 2.2, 0.2 * PI, 0.8 * PI); c.lineWidth = 0.8; c.strokeStyle = INK; c.stroke(); } }
      c.beginPath(); c.moveTo(-12, -74 + by); c.quadraticCurveTo(-19, -46 + by, -12, -18 + by); c.quadraticCurveTo(-23, -46 + by, -12, -74 + by); c.closePath(); c.fillStyle = shade(pd, 0.2); c.fill();
    } else { /* corn on the cob in its husk */
      var ye = '#ffd23f', hk = '#7dbb4e';
      shadow(c, 15); legs(c, 6, -12 + by, p.accent, m);
      for (i = 0; i < 5; i++) L(c, (i - 2) * 1.6, -82 + by, (i - 2) * 4.5 + m.sw * 3, -92 + by - m.k * 2 + Math.abs(i - 2), 0.9, i % 2 ? '#e9c877' : '#c99a4a'); /* silk */
      E(c, 0, -50 + by, 17, 35, ye);
      c.save(); c.beginPath(); c.ellipse(0, -50 + by, 16.4, 34.4, 0, 0, TAU); c.clip(); c.fillStyle = shade(ye, -0.16);
      for (j = 0; j < 9; j++) for (i = -2; i <= 2; i++) { if (j > 2 && j < 6 && Math.abs(i) < 2) continue; c.beginPath(); c.ellipse(i * 6.8 + (j % 2 ? 3.4 : 0), -82 + j * 7 + by, 2.6, 2.9, 0, 0, TAU); c.fill(); }
      c.restore(); hl(c, -9, -72 + by, 2.4, 6, 0.2, 0.5);
      for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(0, -10 + by); c.quadraticCurveTo(i * 26, -22 + by, i * (21 + m.sw * i * 2 + m.k * 2), -62 + by); c.quadraticCurveTo(i * 13, -40 + by, i * 3, -30 + by); c.quadraticCurveTo(i * 1, -18 + by, 0, -10 + by); c.closePath(); F(c, i < 0 ? hk : shade(hk, -0.1)); L(c, i * 4, -17 + by, i * 17, -46 + by, 0.7, shade(hk, -0.25)); }
      arms(c, 17, -44 + by, m, 14, 1.2, 0.8);
      face(c, hx, -55 + by, 0.92, m);
    }
  }, { wide: 0.85, variants: ['carrot', 'tomato', 'pea pod', 'corn on the cob'] });

  /* ---------- breakfast: toast, fried egg, pancake stack, coffee cup ---------- */
  Art.add('character', 'breakfast', function (c, m, p) {
    var v = m.v, hx = m.sw * 1.8, i, by = m.k * 1.5;
    if (v === 0) { /* a slice of toast with melting butter */
      var cr = '#c98845', br = '#f7dfae';
      shadow(c, 20); legs(c, 9, -13 + by, p.accent, m);
      arms(c, 25, -40 + by, m, 14, 1.2, 0.8);
      c.beginPath(); c.moveTo(-23, -13 + by); c.lineTo(-23, -52 + by); c.bezierCurveTo(-36, -58 + by, -30, -78 + by, -12, -73 + by); c.quadraticCurveTo(0, -77 + by, 12, -73 + by); c.bezierCurveTo(30, -78 + by, 36, -58 + by, 23, -52 + by); c.lineTo(23, -13 + by); c.quadraticCurveTo(0, -9 + by, -23, -13 + by); c.closePath(); F(c, cr);
      c.beginPath(); c.moveTo(-19, -17 + by); c.lineTo(-19, -54 + by); c.bezierCurveTo(-30, -59 + by, -25, -73 + by, -11, -69 + by); c.quadraticCurveTo(0, -73 + by, 11, -69 + by); c.bezierCurveTo(25, -73 + by, 30, -59 + by, 19, -54 + by); c.lineTo(19, -17 + by); c.quadraticCurveTo(0, -13.5 + by, -19, -17 + by); c.closePath(); c.fillStyle = br; c.fill();
      for (i = 0; i < 7; i++) dot(c, [-13, 12, -5, 15, -15, 3, 9][i], [-24, -22, -62, -30, -48, -20, -60][i] + by, 0.9, shade(br, -0.16));
      c.beginPath(); c.moveTo(4, -66 + by); c.lineTo(17, -67 + by); c.lineTo(18, -58 + by); c.quadraticCurveTo(19, -52 + by - m.k, 16, -52 + by); c.quadraticCurveTo(14, -56 + by, 11, -57 + by); c.lineTo(5, -57 + by); c.closePath(); F(c, '#ffd84a'); hl(c, 9, -63.5 + by, 3, 1.2, -0.1, 0.6);
      face(c, hx, -42 + by, 1.05, m);
    } else if (v === 1) { /* fried egg: the yolk is its face */
      var wh = '#fffdf6';
      shadow(c, 24); legs(c, 8, -13 + by, p.accent2, m);
      arms(c, 27, -34 + by, m, 14, 1.2, 0.8);
      c.beginPath(); c.moveTo(-30, -30 + by); c.bezierCurveTo(-38, -52 + by, -22, -66 + by, -6, -60 + by); c.bezierCurveTo(6, -70 + by, 28, -64 + by, 28, -48 + by); c.bezierCurveTo(40, -40 + by, 34, -18 + by, 20, -14 + by); c.bezierCurveTo(8, -6 + by, -6, -8 + by, -14, -13 + by); c.bezierCurveTo(-26, -10 + by, -34, -18 + by, -30, -30 + by); c.closePath(); F(c, wh);
      c.fillStyle = 'rgba(214,196,160,0.35)'; c.beginPath(); c.ellipse(4, -20 + by, 22, 7, -0.1, 0, TAU); c.fill();
      E(c, hx, -38 + by, 18, 17, '#ffc233'); c.fillStyle = '#ffd35c'; c.beginPath(); c.ellipse(hx - 2, -40 + by, 14, 13, 0, 0, TAU); c.fill(); hl(c, hx - 8, -48 + by, 4, 2.2, -0.6, 0.75);
      face(c, hx, -38.5 + by, 0.86, m);
      for (i = 0; i < 4; i++) dot(c, [-22, 22, 26, -19][i], [-46, -26, -50, -22][i] + by, 0.8, '#4a4040'); /* pepper */
    } else if (v === 2) { /* a stack of pancakes with butter and syrup */
      var pc = '#e9b566', ed = '#c98845', sy = '#a8551e';
      shadow(c, 24); legs(c, 10, -11 + by, p.accent, m);
      arms(c, 28, -30 + by, m, 13, 1.2, 0.8);
      for (i = 0; i < 5; i++) { var px = m.sw * i * 0.9 + (i % 2 ? 1.2 : -1.2), py = -19 - i * 10.5 + by + m.k * i * 0.5; R(c, px - 28 + i * 0.6, py - 6, 56 - i * 1.2, 12.5, 6, ed); Rn(c, px - 26.5 + i * 0.6, py - 6.4, 53 - i * 1.2, 7.5, 3.8, pc); }
      var tx = m.sw * 3.6 + 1.2, ty = -67.5 + by + m.k * 2;
      c.beginPath(); c.moveTo(tx - 24, ty + 1); c.quadraticCurveTo(tx, ty - 8, tx + 24, ty + 1); c.quadraticCurveTo(tx + 24, ty + 7, tx + 19, ty + 7); c.quadraticCurveTo(tx + 17, ty + 19 + m.k * 2, tx + 13, ty + 6); c.quadraticCurveTo(tx + 4, ty + 4, tx - 6, ty + 6); c.quadraticCurveTo(tx - 9, ty + 26, tx - 13, ty + 6); c.quadraticCurveTo(tx - 24, ty + 8, tx - 24, ty + 1); c.closePath(); F(c, sy); hl(c, tx - 12, ty - 0.5, 5, 1.2, -0.1, 0.4);
      R(c, tx - 7, ty - 8, 14, 7, 1.6, '#ffe27a'); hl(c, tx - 3, ty - 6.2, 3, 1, 0, 0.7);
      face(c, hx * 0.6 + 1, -36 + by, 0.95, m);
    } else { /* a coffee cup with steam */
      var mug = p.accent2, cof = '#6b4226';
      shadow(c, 20); legs(c, 8, -12 + by, p.accent, m);
      c.beginPath(); c.arc(22, -38 + by, 10, -PI * 0.5, PI * 0.5); c.lineWidth = 7.4; c.strokeStyle = shade(mug, -0.34); c.stroke(); c.lineWidth = 5; c.strokeStyle = mug; c.stroke();
      var hs = K.armAngles(m, 1.2, 0.8); K.arm(c, -22, -38 + by, -1, hs[0], 14, 2.5, LIMB, '#ffffff', 3.4); if (m.wave) K.arm(c, 22, -42 + by, 1, hs[1], 14, 2.5, LIMB, '#ffffff', 3.4);
      c.beginPath(); c.moveTo(-23, -62 + by); c.lineTo(23, -62 + by); c.quadraticCurveTo(23, -20 + by, 15, -12 + by); c.quadraticCurveTo(0, -9 + by, -15, -12 + by); c.quadraticCurveTo(-23, -20 + by, -23, -62 + by); c.closePath(); F(c, mug);
      c.fillStyle = alpha(shade(mug, -0.3), 0.3); c.beginPath(); c.moveTo(12, -60 + by); c.lineTo(22, -60 + by); c.quadraticCurveTo(22, -22 + by, 14, -13 + by); c.quadraticCurveTo(16, -30 + by, 12, -60 + by); c.fill();
      E(c, 0, -62 + by, 23, 6, shade(mug, 0.3)); c.fillStyle = cof; c.beginPath(); c.ellipse(0, -61.4 + by, 19.5, 4.2, 0, 0, TAU); c.fill(); c.fillStyle = '#d9b78a'; c.beginPath(); c.ellipse(-3 + m.sw * 2, -61.4 + by, 8, 1.7, 0, 0, TAU); c.fill();
      hl(c, -16, -44 + by, 2, 9, 0.05, 0.4);
      K.steam(c, 0, -68 + by, 20 + m.k * 4, m.t, 3);
      K.heartPath(c, 0, -19.5 + by, 6); c.fillStyle = shade(mug, 0.45); c.fill();
      face(c, hx, -42 + by, 1.05, m);
    }
  }, { wide: 0.9, variants: ['toast', 'fried egg', 'pancake stack', 'coffee cup'] });

  /* ---------- sweet: cupcake, donut, ice-cream cone, cookie ---------- */
  var SPR = ['#ff5a5f', '#ffd166', '#5ad1a0', '#58b4ff', '#ffffff', '#b98cf0'];
  function sprinkles(c, pts, by) { for (var i = 0; i < pts.length; i++) { var a = i * 2.4; L(c, pts[i][0] - Math.cos(a) * 1.5, pts[i][1] + by - Math.sin(a) * 1.5, pts[i][0] + Math.cos(a) * 1.5, pts[i][1] + by + Math.sin(a) * 1.5, 1.3, SPR[i % SPR.length]); } }
  Art.add('character', 'sweet', function (c, m, p) {
    var v = m.v, hx = m.sw * 1.8, i, by = m.k * 1.5;
    if (v === 0) { /* cupcake with a cherry */
      var wr = p.accent2, fr = '#ff9ec4';
      shadow(c, 16); legs(c, 7, -11 + by, p.accent, m);
      arms(c, 19, -34 + by, m, 14, 1.2, 0.8);
      c.beginPath(); c.moveTo(-22, -47 + by); c.lineTo(22, -47 + by); c.lineTo(16, -11 + by); c.quadraticCurveTo(0, -8 + by, -16, -11 + by); c.closePath(); F(c, wr);
      c.save(); c.clip(); for (i = -4; i <= 4; i++) L(c, i * 5.4, -48 + by, i * 4, -8 + by, 1.1, i % 2 ? shade(wr, -0.2) : shade(wr, 0.22)); c.restore();
      var fx = m.sw * 1.2;
      E(c, fx * 0.4, -51 + by, 27, 10.5, fr); E(c, fx * 0.8, -62 + by - m.k, 20, 9.5, shade(fr, 0.12)); E(c, fx * 1.2, -72 + by - m.k * 1.6, 12.5, 8, shade(fr, 0.24));
      c.beginPath(); c.arc(fx * 0.4, -49 + by, 22, PI * 1.12, PI * 1.5); c.lineWidth = 1; c.strokeStyle = shade(fr, 0.4); c.stroke();
      sprinkles(c, [[-17, -52], [-6, -56], [9, -53], [19, -50], [-11, -63], [8, -65], [-2, -72], [14, -60]], by - m.k * 0.6);
      var chx = fx * 1.5, chy = -82 + by - m.k * 2.2; c.beginPath(); c.moveTo(chx, chy - 3); c.quadraticCurveTo(chx + 2, chy - 12, chx + 8 + m.sw * 2, chy - 13); c.lineWidth = 1.1; c.strokeStyle = '#6b4226'; c.stroke();
      E(c, chx, chy, 5.6, 5.4, '#e0283c'); hl(c, chx - 1.8, chy - 2, 1.6, 1, -0.6, 0.7);
      face(c, hx, -32 + by, 0.98, m);
    } else if (v === 1) { /* donut: the hole is its singing mouth */
      var dg = '#e3a961', ic = '#ff8fbd';
      shadow(c, 24); legs(c, 9, -11 + by, p.accent2, m);
      arms(c, 28, -36 + by, m, 14, 1.2, 0.8);
      E(c, 0, -37 + by, 31, 28, dg);
      c.beginPath(); c.moveTo(-27.5, -36 + by); c.bezierCurveTo(-28, -72 + by, 28, -72 + by, 27.5, -36 + by);
      c.quadraticCurveTo(24, -24 + by, 19, -32 + by); c.quadraticCurveTo(13, -19 + by - m.k * 2, 8, -29 + by); c.quadraticCurveTo(1, -22 + by, -5, -30 + by); c.quadraticCurveTo(-11, -17 + by - m.k * 2, -16, -30 + by); c.quadraticCurveTo(-22, -24 + by, -27.5, -36 + by); c.closePath(); F(c, ic);
      hl(c, -15, -56 + by, 7, 2.6, -0.6, 0.5);
      sprinkles(c, [[-20, -46], [-9, -59], [6, -60], [19, -50], [22, -39], [-2, -51], [13, -44], [-23, -37]], by);
      var mo = m.open, mx = hx, my = -36 + by;
      E(c, mx, my, 5.6 + mo * 2.2, 4.6 + mo * 5.4, '#6a1d2a'); if (mo > 0.12) { c.fillStyle = '#e8707e'; c.beginPath(); c.ellipse(mx, my + 2.5 + mo * 3.4, 3 + mo, 1.8 + mo, 0, 0, TAU); c.fill(); }
      K.eyes(c, hx, -46 + by, 8.6, 2.6, m, INK); K.blush(c, hx, -40.5 + by, 14, 2.8);
    } else if (v === 2) { /* ice-cream cone, two scoops */
      var cn = '#e2a758', s1 = '#ff9ec4', s2 = '#a9e6c4';
      shadow(c, 10); legs(c, 3.6, -11 + by, p.accent, m);
      arms(c, 17, -50 + by, m, 14, 1.2, 0.8);
      Pg(c, [[-16, -47 + by], [16, -47 + by], [2.5, -8 + by], [-2.5, -8 + by]], cn);
      c.save(); c.clip(); c.lineWidth = 0.8; c.strokeStyle = shade(cn, -0.22); c.beginPath(); for (i = -6; i <= 6; i++) { c.moveTo(i * 6 - 20, -48 + by); c.lineTo(i * 6 + 20, -8 + by); c.moveTo(i * 6 + 20, -48 + by); c.lineTo(i * 6 - 20, -8 + by); } c.stroke(); c.restore();
      var sx = m.sw * 1.5;
      E(c, sx * 1.6, -77 + by - m.k * 1.5, 13.5, 12.5, s2); hl(c, sx * 1.6 - 5, -83 + by - m.k * 1.5, 3, 1.8, -0.6, 0.6);
      for (i = 0; i < 4; i++) dot(c, sx * 1.6 + [-5, 4, 8, -1][i], -76 + by - m.k * 1.5 + [3, -5, 3, -2][i], 1.1, '#5a3a25'); /* choc chips */
      E(c, sx * 0.6, -58 + by, 18.5, 15.5, s1);
      c.beginPath(); c.moveTo(-18.5 + sx * 0.6, -54 + by); c.quadraticCurveTo(-15, -42 + by, -10, -48 + by); c.quadraticCurveTo(-5, -38 + by - m.k * 2, 0, -47 + by); c.quadraticCurveTo(6, -41 + by, 10, -48 + by); c.quadraticCurveTo(15, -42 + by, 18.5 + sx * 0.6, -54 + by); c.quadraticCurveTo(0, -46 + by, -18.5 + sx * 0.6, -54 + by); c.closePath(); F(c, s1);
      hl(c, sx * 0.6 - 9, -67 + by, 4, 2, -0.6, 0.6);
      var wx = sx * 1.6 + 7, wy = -86 + by - m.k * 2; c.save(); c.translate(wx, wy); c.rotate(0.45 + m.sw * 0.08); R(c, -2.4, -13, 4.8, 15, 1.6, '#f3d08a'); L(c, -1, -11, 1, -9, 0.6, '#c99a4a'); L(c, -1, -7, 1, -5, 0.6, '#c99a4a'); c.restore();
      E(c, sx * 1.6 - 3, -90 + by - m.k * 2, 4, 3.9, '#e0283c'); hl(c, sx * 1.6 - 4.2, -91.4 + by - m.k * 2, 1.1, 0.8, -0.6, 0.7);
      face(c, hx + sx * 0.6, -60 + by, 0.9, m);
    } else { /* a chocolate-chip cookie with one bite gone */
      var ck = '#dba561', ch = '#5a3a25', cy = -37 + by, bx = Math.cos(-0.75) * 30, byy = cy + Math.sin(-0.75) * 30;
      shadow(c, 23); legs(c, 9, -11 + by, p.accent, m);
      arms(c, 28, -36 + by, m, 14, 1.2, 0.8);
      c.beginPath(); c.arc(0, cy, 30, -0.35, -1.15 + TAU, false); c.arc(bx, byy, 11.9, -2.52, 1.02, true); c.closePath(); F(c, ck);
      c.fillStyle = alpha(shade(ck, -0.3), 0.25); c.beginPath(); c.ellipse(6, cy + 12, 21, 13, -0.2, 0, TAU); c.fill(); c.fillStyle = ck; c.beginPath(); c.ellipse(2, cy + 8, 21, 14, -0.2, 0, TAU); c.fill();
      var chips = [[-19, -13, 3.6], [-5, -23, 3], [21, -2, 3.2], [-24, 5, 2.8], [10, 21, 3.2], [-11, 21, 2.6], [22, 14, 2.2], [6, -15, 2.2]];
      for (i = 0; i < chips.length; i++) { E(c, chips[i][0], cy + chips[i][1], chips[i][2], chips[i][2] * 0.9, ch, i); dot(c, chips[i][0] - chips[i][2] * 0.3, cy + chips[i][1] - chips[i][2] * 0.3, chips[i][2] * 0.26, 'rgba(255,255,255,0.35)'); }
      for (i = 0; i < 3; i++) dot(c, bx - 13 - i * 3 + m.k * i, byy + 14 + i * 4 - (i === 1 ? 26 : 0), 0.9, shade(ck, -0.12)); /* crumbs */
      face(c, hx - 2, cy + 1, 1.25, m);
    }
  }, { wide: 0.9, variants: ['cupcake', 'donut', 'ice-cream cone', 'cookie'] });

  /* ---------- fruit: strawberry, banana, pineapple, avocado ---------- */
  Art.add('character', 'fruit', function (c, m, p) {
    var v = m.v, hx = m.sw * 1.8, i, j, by = m.k * 1.5, gr = '#4fa24a', gr2 = '#6bbf5c';
    if (v === 0) { /* strawberry */
      var rd = '#ee3344';
      shadow(c, 15); legs(c, 6, -13 + by, p.accent2, m);
      arms(c, 23, -44 + by, m, 14, 1.2, 0.8);
      c.beginPath(); c.moveTo(0, -9 + by); c.bezierCurveTo(-16, -14 + by, -32, -44 + by, -25, -60 + by); c.bezierCurveTo(-19, -72 + by, 19, -72 + by, 25, -60 + by); c.bezierCurveTo(32, -44 + by, 16, -14 + by, 0, -9 + by); c.closePath(); F(c, rd);
      c.save(); c.clip(); c.fillStyle = alpha(shade(rd, -0.3), 0.28); c.beginPath(); c.ellipse(20, -34 + by, 11, 26, 0.3, 0, TAU); c.fill(); c.restore();
      var sd = [[-18, -56], [-9, -60], [9, -60], [18, -55], [-20, -42], [20, -41], [-14, -30], [14, -29], [-6, -21], [6, -21], [0, -14], [-20, -49], [0, -62]];
      for (i = 0; i < sd.length; i++) { c.fillStyle = '#ffe27a'; c.beginPath(); c.ellipse(sd[i][0], sd[i][1] + by, 1, 1.6, 0, 0, TAU); c.fill(); }
      hl(c, -15, -58 + by, 4, 2.2, -0.6, 0.45);
      for (i = 0; i < 5; i++) leafE(c, m.sw * 1.2, -67 + by, 15 + (i === 2 ? 0 : m.k * 1.5), 4.4, PI * 0.08 + i * PI * 0.21, i % 2 ? gr : gr2);
      c.beginPath(); c.moveTo(m.sw * 1.2, -68 + by); c.quadraticCurveTo(0, -76 + by, 4 + m.sw * 3, -79 + by - m.k); c.lineWidth = 4; c.strokeStyle = shade(gr, -0.34); c.stroke(); c.lineWidth = 2.6; c.strokeStyle = gr; c.stroke();
      face(c, hx, -43 + by, 1.02, m);
    } else if (v === 1) { /* banana */
      var ye = '#ffd93b', b0 = [9, -13 + by], b1 = [-24 - m.sw * 2, -48 + by], b2 = [8 + m.sw * 3, -89 + by - m.k * 1.5];
      shadow(c, 13); c.save(); c.translate(7, 0); legs(c, 4.5, -12 + by, p.accent, m); c.restore();
      K.arm(c, -14, -50 + by, -1, K.armAngles(m, 1.2, 0.8)[0], 14, 2.5, LIMB, '#ffffff', 3.4);
      c.lineCap = 'round'; c.beginPath(); c.moveTo(b0[0], b0[1]); c.quadraticCurveTo(b1[0], b1[1], b2[0], b2[1]); c.lineWidth = 24.4; c.strokeStyle = shade(ye, -0.34); c.stroke(); c.lineWidth = 22; c.strokeStyle = ye; c.stroke();
      c.beginPath(); c.moveTo(b0[0] + 5, b0[1] - 4); c.quadraticCurveTo(b1[0] + 9, b1[1], b2[0] + 5, b2[1] + 5); c.lineWidth = 7; c.strokeStyle = shade(ye, -0.12); c.stroke();
      c.beginPath(); c.moveTo(b0[0] - 6, b0[1] - 8); c.quadraticCurveTo(b1[0] - 2, b1[1], b2[0] - 5, b2[1] + 9); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
      R(c, b2[0] - 3.4, b2[1] - 16, 6.8, 9, 2, '#8a6a3a'); E(c, b0[0] + 3, b0[1] + 6, 3.4, 2.6, '#6b4a2a');
      K.arm(c, 5, -52 + by, 1, K.armAngles(m, 1.2, 0.8)[1], 14, 2.5, LIMB, '#ffffff', 3.4);
      face(c, -7 + hx * 0.6 - m.sw, -52 + by, 0.86, m);
    } else if (v === 2) { /* pineapple in sunglasses */
      var gd = '#f3b62f';
      shadow(c, 17); legs(c, 7, -11 + by, p.accent, m);
      for (i = -3; i <= 3; i++) { c.save(); c.translate(i * 3.4, -64 + by); c.rotate(i * 0.3 + m.sw * 0.12 + Math.sin(m.t * 2 + i) * 0.03); leafE(c, 0, 0, 30 - Math.abs(i) * 5 + m.k * 2, 5.5, -PI / 2, Math.abs(i) % 2 ? gr : gr2); c.restore(); }
      arms(c, 21, -38 + by, m, 14, 1.2, 0.8);
      E(c, 0, -38 + by, 23, 29, gd);
      c.save(); c.beginPath(); c.ellipse(0, -38 + by, 22.4, 28.4, 0, 0, TAU); c.clip(); c.lineWidth = 0.9; c.strokeStyle = shade(gd, -0.26); c.beginPath(); for (i = -8; i <= 8; i++) { c.moveTo(i * 9 - 30, -70 + by); c.lineTo(i * 9 + 30, -6 + by); c.moveTo(i * 9 + 30, -70 + by); c.lineTo(i * 9 - 30, -6 + by); } c.stroke();
      c.fillStyle = alpha(shade(gd, -0.3), 0.25); c.beginPath(); c.ellipse(19, -34 + by, 9, 26, 0.1, 0, TAU); c.fill(); c.restore();
      hl(c, -13, -56 + by, 4, 2.4, -0.6, 0.45);
      for (i = -1; i <= 1; i += 2) { R(c, hx + i * 8.6 - 7, -46 + by, 14, 9.6, 3.6, '#2b2440'); hl(c, hx + i * 8.6 - 2.6, -43.4 + by, 2.4, 1.1, -0.5, 0.5); }
      L(c, hx - 2, -43 + by, hx + 2, -43 + by, 1.4, '#2b2440'); L(c, hx - 15.6, -43 + by, hx - 22, -45 + by, 1.2, '#2b2440'); L(c, hx + 15.6, -43 + by, hx + 22, -45 + by, 1.2, '#2b2440');
      K.blush(c, hx, -33 + by, 13.5, 2.8); K.mouth(c, hx, -28 + by, 5, m, INK);
    } else { /* half an avocado: the stone is its tummy */
      var sk = '#3f7a3a', fl = '#d8e87a';
      shadow(c, 18); legs(c, 8, -11 + by, p.accent, m);
      arms(c, 24, -36 + by, m, 14, 1.2, 0.8);
      c.beginPath(); c.moveTo(0, -84 + by); c.bezierCurveTo(13, -84 + by, 15, -62 + by, 23, -48 + by); c.bezierCurveTo(34, -30 + by, 22, -9 + by, 0, -9 + by); c.bezierCurveTo(-22, -9 + by, -34, -30 + by, -23, -48 + by); c.bezierCurveTo(-15, -62 + by, -13, -84 + by, 0, -84 + by); c.closePath(); F(c, sk);
      c.beginPath(); c.moveTo(0, -79 + by); c.bezierCurveTo(9.5, -79 + by, 11, -60 + by, 18.5, -46 + by); c.bezierCurveTo(28, -30 + by, 18, -13.5 + by, 0, -13.5 + by); c.bezierCurveTo(-18, -13.5 + by, -28, -30 + by, -18.5, -46 + by); c.bezierCurveTo(-11, -60 + by, -9.5, -79 + by, 0, -79 + by); c.closePath(); c.fillStyle = fl; c.fill();
      c.lineWidth = 2; c.strokeStyle = '#f1f6b4'; c.stroke();
      E(c, m.sw * 0.8, -31 + by, 11.5, 12, '#8a5a34'); c.fillStyle = '#a9703f'; c.beginPath(); c.ellipse(m.sw * 0.8 - 1.5, -32.5 + by, 8.6, 9, 0, 0, TAU); c.fill(); hl(c, m.sw * 0.8 - 4.5, -37 + by, 2.6, 1.6, -0.6, 0.5);
      face(c, hx, -60 + by, 0.8, m);
    }
  }, { wide: 0.88, variants: ['strawberry', 'banana', 'pineapple', 'avocado'] });
});
