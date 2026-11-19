/* Send a Carol art pack: the music-makers (mariachi, barbershop quartet, jazz combo, rock band, choir, marching band,
   instruments that play themselves, a dreidel pal). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var SKIN = ['#f6cfa8', '#e3ac7c', '#b9774a', '#7c4a2d'], HAIR = ['#6a3d22', '#221a18', '#d49a3a', '#a0452a'];
  var BRASS = '#f0c04a', WOODC = '#c98a4b', DARK = '#2b2118';

  /* ---------- shared pieces: a person, and the instruments ---------- */
  function wav(m) { return 2.5 + Math.sin(m.t * 9) * 0.3; }
  function OL(c, x1, y1, x2, y2, w, col) { L(c, x1, y1, x2, y2, w + 1.6, shade(col, -0.34)); L(c, x1, y1, x2, y2, w, col); }
  function legs(c, pants, shoe, sp) {
    sp = sp || 6;
    for (var i = -1; i <= 1; i += 2) { OL(c, i * sp, -27, i * (sp + 0.5), -6, 7, pants); R(c, i * (sp + 1.5) - 6.5, -8, 13, 8, 3.5, shoe); }
  }
  function torso(c, col, wt, wb, top, bot) {
    c.beginPath(); c.moveTo(-wt, top); c.quadraticCurveTo(-wb - 1.5, (top + bot) / 2, -wb, bot); c.quadraticCurveTo(0, bot + 4, wb, bot); c.quadraticCurveTo(wb + 1.5, (top + bot) / 2, wt, top); c.closePath(); F(c, col);
  }
  /* head with hair: st 0 short, 1 curls, 2 long, 3 bun, 4 none (a hat follows) */
  function person(c, m, hx, hy, r, sk, hr, st) {
    if (st === 2) K.hairdo(c, hx, hy, r + 0.5, hr, 2);
    K.head(c, hx, hy, r, sk, m);
    if (st < 4) K.hairdo(c, hx, hy, r, hr, st === 2 ? 0 : st);
  }
  function tache(c, hx, hy, col, big) {
    c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = big ? 2.6 : 1.7;
    for (var s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(hx, hy + 4.4); c.quadraticCurveTo(hx + s * 4, hy + (big ? 7 : 5.6), hx + s * (big ? 7 : 7.5), hy + (big ? 5.6 : 2.6)); c.stroke(); }
  }
  /* a stringed thing: body centred at (x, y), neck along +x before the turn. kind: ac, gtn (guitarron), vio, el, bass */
  function strings(c, x, y, rot, s, col, kind, m) {
    var i, el = kind === 'el' || kind === 'bass', nl = kind === 'gtn' ? 17 : kind === 'bass' ? 31 : kind === 'vio' ? 20 : 26, dk = shade(col, -0.34);
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    R(c, 6, -1.7, nl + 2, 3.4, 1, kind === 'vio' ? DARK : el ? '#e9d3a4' : '#6b4226');
    if (el) { for (i = 0; i < 5; i++) L(c, 14 + i * 4, -1.5, 14 + i * 4, 1.5, 0.4, '#8a7a5a'); }
    R(c, nl + 7, -3.2, 7.5, 6.4, 2, el ? col : kind === 'vio' ? shade(col, -0.2) : '#4a2c18');
    for (i = 0; i < 2; i++) { dot(c, nl + 9 + i * 3, -4, 1, '#e9e4d6'); dot(c, nl + 9 + i * 3, 4, 1, '#e9e4d6'); }
    if (el) {
      c.beginPath(); c.moveTo(-13, -2); c.quadraticCurveTo(-14, -10, -5, -9.5); c.quadraticCurveTo(1, -9, 5, -11.5); c.quadraticCurveTo(12, -13, 13, -7); c.quadraticCurveTo(8, -5.5, 8, -2);
      c.lineTo(8, 2); c.quadraticCurveTo(9, 5, 12, 6); c.quadraticCurveTo(10, 11.5, 4, 9.5); c.quadraticCurveTo(-2, 8, -6, 9.5); c.quadraticCurveTo(-14, 10, -13, -2); c.closePath(); F(c, col);
      c.beginPath(); c.moveTo(-9, 3); c.quadraticCurveTo(-4, 6.5, 5, 5); c.lineTo(6, 1); c.lineTo(-8, 0.5); c.closePath(); c.fillStyle = kind === 'bass' ? shade(col, 0.4) : '#fffdf4'; c.fill();
      Rn(c, -3, -2.2, 2.2, 4.4, 0.5, '#d9d4c8'); Rn(c, 2, -2.2, 2.2, 4.4, 0.5, '#d9d4c8'); dot(c, -8, 5.2, 1.1, DARK); dot(c, -4.6, 6.4, 1.1, DARK);
    } else {
      var fa = kind === 'gtn' ? 1.25 : 1, a1 = [-4, 0, 11, 9.6 * fa], a2 = [7.5, 0, 8, 7 * fa];
      c.lineWidth = K.ow() * 2; c.strokeStyle = dk; c.beginPath(); c.ellipse(a1[0], a1[1], a1[2], a1[3], 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(a2[0], a2[1], a2[2], a2[3], 0, 0, TAU); c.stroke();
      c.fillStyle = col; c.beginPath(); c.ellipse(a1[0], a1[1], a1[2], a1[3], 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(a2[0], a2[1], a2[2], a2[3], 0, 0, TAU); c.fill();
      c.fillStyle = shade(col, 0.22); c.beginPath(); c.ellipse(-6, -3 * fa, 6, 4 * fa, -0.3, 0, TAU); c.fill();
      if (kind === 'vio') { for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(-3, i * 4.6); c.quadraticCurveTo(0, i * 3.4, 3, i * 4.8); c.lineWidth = 0.9; c.strokeStyle = DARK; c.stroke(); } Rn(c, 4, -1.8, 9, 3.6, 0.5, DARK); Rn(c, -13, -2, 4, 4, 1, DARK); }
      else { dot(c, 3.5, 0, 3.6, shade(col, -0.6)); c.beginPath(); c.arc(3.5, 0, 4.6, 0, TAU); c.lineWidth = 0.8; c.strokeStyle = '#f4e3b8'; c.stroke(); Rn(c, -9.5, -3.2, 2.2, 6.4, 0.6, '#4a2c18'); }
    }
    c.lineWidth = 0.35; c.strokeStyle = 'rgba(255,250,235,0.9)';
    for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-8, i * 1.05); c.lineTo(nl + 8, i * 0.8 + (m ? Math.sin(m.t * 40 + i) * m.k * 0.3 : 0)); c.stroke(); }
    c.restore();
  }
  /* trumpet: mouthpiece at (x, y), bell along +x */
  function trumpet(c, x, y, rot, s, col, mute) {
    var i; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    Rn(c, -1.5, -1.3, 3, 2.6, 1, shade(col, -0.3)); OL(c, 0, 0, 20, 0, 2.2, col);
    K.rrp(c, 4.5, 0, 12.5, 5.2, 2.6); c.lineWidth = 2.6; c.strokeStyle = shade(col, -0.34); c.stroke(); c.lineWidth = 1.5; c.strokeStyle = col; c.stroke();
    for (i = 0; i < 3; i++) { R(c, 7 + i * 3.1, -5.2, 2.3, 6.4, 0.9, shade(col, 0.15)); dot(c, 8.15 + i * 3.1, -5.8, 1.15, '#fff6d8'); }
    c.beginPath(); c.moveTo(18.5, -1.6); c.quadraticCurveTo(25, -2.2, 29, -8); c.lineTo(29, 8); c.quadraticCurveTo(25, 2.2, 18.5, 1.6); c.closePath(); F(c, col);
    E(c, 29, 0, 2, 8, shade(col, 0.35)); if (mute) { Pg(c, [[29, -4.5], [35, -3], [35, 3], [29, 4.5]], '#c8323c'); } else dot(c, 29, 0, 1, shade(col, -0.4));
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(3, -0.9, 13, 0.6);
    c.restore();
  }
  /* saxophone: mouthpiece at (x, y), hangs down and curls up to the bell */
  function sax(c, x, y, rot, s, col) {
    var i, w; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    for (i = 0; i < 2; i++) {
      w = i ? 4.6 : 6.4; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(5, -1.5, 6.5, 4); c.lineTo(9.5, 27); c.quadraticCurveTo(11.5, 36, 18, 33); c.quadraticCurveTo(22, 30.5, 21.5, 23);
      c.lineCap = 'round'; c.lineWidth = w; c.strokeStyle = i ? col : shade(col, -0.34); c.stroke();
    }
    Rn(c, -3.5, -1.4, 5, 2.8, 1, DARK);
    c.beginPath(); c.moveTo(17.5, 24.5); c.lineTo(15.5, 17.5); c.lineTo(27.5, 16.5); c.lineTo(25, 24); c.closePath(); F(c, col); E(c, 21.5, 17, 6, 2.1, shade(col, 0.4), -0.08);
    for (i = 0; i < 4; i++) { dot(c, 7.2 + i * 0.5, 8 + i * 5, 1.7, shade(col, -0.3)); dot(c, 7.2 + i * 0.5, 8 + i * 5, 1.1, '#fff6d8'); }
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(12, 31.5, 1, 3.4, -1, 0, TAU); c.fill();
    c.restore();
  }
  function boater(c, x, y, rot, band) {
    var st = '#f2dc98'; c.save(); c.translate(x, y); c.rotate(rot);
    E(c, 0, 0, 17.5, 3.8, st); R(c, -10.5, -10, 21, 10.5, 1.6, st); Rn(c, -10.5, -5.2, 21, 4.2, 0, band); Rn(c, -10.5, -3.6, 21, 1, 0, shade(band, 0.45));
    c.lineWidth = 0.5; c.strokeStyle = shade(st, -0.2); c.beginPath(); c.ellipse(0, 0.3, 14, 2.4, 0, 0.1, PI - 0.1); c.stroke();
    c.restore();
  }
  function note(c, x, y, s, col) { c.save(); c.translate(x, y); c.rotate(-0.25); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 2.2 * s, 1.6 * s, 0, 0, TAU); c.fill(); L(c, 1.9 * s, 0, 1.9 * s, -7 * s, 0.8 * s, col); L(c, 1.9 * s, -7 * s, 5 * s, -5.6 * s, 1.2 * s, col); c.restore(); }
  function sticks(c, x1, y1, x2, y2) { OL(c, x1, y1, x2, y2, 1.3, '#e9c98c'); dot(c, x2, y2, 1.3, '#f6e2b4'); }

  /* ---------- mariachi: charro suits, wide sombreros, guitar / trumpet / violin / guitarron ---------- */
  Art.add('character', 'mariachi', function (c, m, p) {
    var v = m.v, suit = ['#3a3446', '#24386a', '#5c1f30', '#efe6d2'][v], trim = v % 2 ? p.gold : '#e6e2d8', sk = SKIN[(v + 1) % 4], hr = HAIR[v === 2 ? 0 : 1];
    var hx = m.sw * 2, hy = -68 + m.k * 2, i, j, h, sing = m.open > 0.12, hat = v === 3 ? '#f4ecd9' : suit;
    legs(c, suit, v === 3 ? '#6b4226' : '#1c1620');
    for (i = -1; i <= 1; i += 2) for (j = 0; j < 4; j++) dot(c, i * (9.2 + j * 0.12), -24 + j * 4.6, 0.95, trim);
    if (v === 0) { arm(c, -13, -50, -1, -0.45 + m.sw * 0.3, 0); }
    torso(c, suit, 12.5, 14.5, -56, -25);
    Pg(c, [[-4.5, -56], [4.5, -56], [0, -41]], p.paper, true);
    Rn(c, -14.5, -28.5, 29, 3.6, 1.5, shade(suit, v === 3 ? -0.3 : -0.4)); R(c, -2.6, -29.3, 5.2, 5, 1.2, trim);
    c.lineWidth = 0.9; c.strokeStyle = trim; c.lineCap = 'round';
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(i * 8.5, -47, 2.6, i > 0 ? PI : 0, i > 0 ? PI * 2.5 : PI * 1.5, i < 0); c.stroke(); c.beginPath(); c.arc(i * 9.5, -39.5, 2, 0, PI * 1.4); c.stroke(); dot(c, i * 5, -36, 0.9, trim); dot(c, i * 4.2, -32, 0.9, trim); }
    /* sombrero brim behind the head, tipped back so the face is clear */
    E(c, hx, hy - 10, 29, 9.5, hat); c.beginPath(); c.ellipse(hx, hy - 10, 25, 7, 0, 0, TAU); c.lineWidth = 1.5; c.strokeStyle = trim; c.stroke();
    for (j = 0; j < 12; j++) { var ba = j / 12 * TAU + 0.26; dot(c, hx + Math.cos(ba) * 21.5, hy - 10 + Math.sin(ba) * 5.4, 0.9, p.accent); }
    person(c, m, hx, hy, 13, sk, hr, v === 2 ? 2 : 4);
    if (v === 0) tache(c, hx, hy, HAIR[1], false); if (v === 3) tache(c, hx, hy, '#8c8680', true);
    c.beginPath(); c.moveTo(hx - 11.5, hy - 9.5); c.quadraticCurveTo(hx - 10.5, hy - 31, hx, hy - 31); c.quadraticCurveTo(hx + 10.5, hy - 31, hx + 11.5, hy - 9.5); c.quadraticCurveTo(hx, hy - 5.5, hx - 11.5, hy - 9.5); c.closePath(); F(c, hat);
    c.beginPath(); c.moveTo(hx - 11.2, hy - 12.5); c.quadraticCurveTo(hx, hy - 8.2, hx + 11.2, hy - 12.5); c.lineWidth = 2.6; c.strokeStyle = p.accent; c.stroke(); c.lineWidth = 0.7; c.strokeStyle = trim; c.stroke();
    K.starPath(c, hx, hy - 21, 3.6, 1.6, 4, 0); c.fillStyle = trim; c.fill(); dot(c, hx - 4, hy - 26, 1.6, shade(hat, v === 3 ? -0.1 : 0.25));
    K.bow(c, hx * 0.4, -54, 15, p.accent);
    function arm(cc, sx, sy, s, a, len) { return K.arm(cc, sx, sy, s, a, len, 6.5, suit, len ? sk : null, 3.4); }
    if (v === 0 || v === 3) {
      var big = v === 3, gy = big ? -35 : -37, gr = (big ? -0.6 : -0.38) + m.sw * 0.05, gs = big ? 1.28 : 0.95, nl = big ? 21 : 24;
      strings(c, -2 + m.sw, gy - m.k * 1.5, gr, gs, big ? '#b9773f' : WOODC, big ? 'gtn' : 'ac', m);
      arm(c, -13, -50, -1, -0.5 + m.sw * 0.32, big ? 17 : 14);
      if (m.wave) arm(c, 13, -50, 1, wav(m), 16); else { var nx = -2 + m.sw + Math.cos(gr) * nl * gs, ny = gy - m.k * 1.5 + Math.sin(gr) * nl * gs; K.arm(c, 13, -50, 1, Math.atan2(nx - 13, ny + 50), Math.sqrt((nx - 13) * (nx - 13) + (ny + 50) * (ny + 50)), 6.5, suit, sk, 3.4); }
    } else if (v === 1) {
      if (sing) { h = arm(c, 13, -50, 1, 0.75, 14); trumpet(c, h[0] - 12, h[1] + 2, -0.5 - m.k * 0.2, 0.95, BRASS); arm(c, 13, -50, 1, 0.75, 14); }
      else { trumpet(c, hx + 4, hy + 7.5, -0.12 - m.k * 0.3, 0.95, BRASS); K.arm(c, 13, -50, 1, 2.75, 13, 6.5, suit, sk, 3.4); }
      arm(c, -13, -50, -1, m.wave ? wav(m) : 0.5 + m.sw * 0.4, 16);
    } else {
      var bo = m.sw * 5;
      strings(c, hx - 8, hy + 15, PI - 0.28, 0.58, '#a8542a', 'vio', m); arm(c, -13, -50, -1, 1.45, 11);
      if (m.wave) { h = arm(c, 13, -50, 1, wav(m), 16); OL(c, h[0], h[1], h[0] + 6, h[1] - 22, 0.9, '#6b4226'); }
      else { h = arm(c, 13, -50, 1, -0.95 + m.sw * 0.3, 13); OL(c, h[0] + 3, h[1] + 1.5, hx - 22 + bo, hy + 4, 0.9, '#6b4226'); L(c, h[0] + 2, h[1] + 2.4, hx - 21 + bo, hy + 5.2, 0.4, '#fffdf4'); }
    }
  }, { wide: 0.95, variants: ['guitar', 'trumpet', 'violin', 'guitarron'] });

  /* ---------- barber: a barbershop quartet in striped vests and boaters ---------- */
  Art.add('character', 'barber', function (c, m, p) {
    var v = m.v, vest = [p.accent, p.accent2, '#2f5d8a', '#8a3f7a'][v], sk = SKIN[[0, 2, 1, 3][v]], hr = HAIR[[0, 1, 3, 1][v]], sh = '#fffdf4';
    var wb = [14, 13, 17.5, 12.5][v], hx = m.sw * 2, hy = -69 + m.k * 2, i, h, mx, my;
    c.save(); c.scale([1, 0.97, 1.08, 0.93][v], [1, 1.03, 0.93, 1.04][v]);
    legs(c, '#efe7d6', '#7a4a2a'); for (i = -1; i <= 1; i += 2) Rn(c, i * 7.5 - 6, -4.2, 6.5, 3.6, 1.5, '#fffdf4');
    function sleeve(s, a, len) { var q = K.arm(c, s * 13, -50, s, a, len, 6.2, sh, sk, 3.4); mx = s * 13 + (q[0] - s * 13) * 0.45; my = -50 + (q[1] + 50) * 0.45; L(c, mx - Math.cos(a) * 3.2, my - s * Math.sin(a) * 0 - 0, mx + Math.cos(a) * 3.2, my, 0, vest); c.save(); c.translate(mx, my); c.rotate(-s * a); Rn(c, -3.6, -1, 7.2, 2, 0.8, vest); c.restore(); return q; }
    var aL = [0.45, 0.7, 1.9 + m.sw * 0.3, -0.95][v], aR = [1.7 - m.sw * 0.4, 2.3 + m.k * 0.45, 1.9 - m.sw * 0.3, 1.5 - m.sw * 0.45][v];
    if (m.wave) aR = wav(m);
    if (v !== 3) h = sleeve(-1, aL, 16);
    if (v === 0) { OL(c, h[0] - 1, h[1] - 3, h[0] - 3 + m.sw * 2, -0.5, 1.6, '#4a2c18'); dot(c, h[0] - 1, h[1] - 3.5, 2, p.gold); K.arm(c, h[0], h[1], 1, 0, 0.01, 0.1, sk, sk, 3.4); }
    torso(c, sh, 12.5, wb, -56, -24);
    c.save(); c.beginPath(); c.moveTo(-12.5, -56); c.lineTo(-5, -56); c.lineTo(0, -40); c.lineTo(5, -56); c.lineTo(12.5, -56); c.quadraticCurveTo(wb + 1.5, -40, wb, -24); c.lineTo(3, -22); c.lineTo(0, -25); c.lineTo(-3, -22); c.lineTo(-wb, -24); c.quadraticCurveTo(-wb - 1.5, -40, -12.5, -56); c.closePath(); F(c, vest);
    c.clip(); c.fillStyle = sh; for (i = -5; i <= 5; i++) c.fillRect(i * 4.4 - 0.9 + (i < 0 ? -0.6 : 0.6), -58, 1.8, 40); c.restore();
    for (i = 0; i < 3; i++) dot(c, 0, -37 + i * 4.4, 1.05, p.gold);
    c.beginPath(); c.moveTo(-6, -30); c.quadraticCurveTo(-1, -27, 3, -31); c.lineWidth = 0.7; c.strokeStyle = p.gold; c.stroke(); /* watch chain */
    person(c, m, hx, hy, 13, sk, hr, [0, 0, 4, 2][v]);
    if (v === 0) { c.lineCap = 'round'; c.strokeStyle = hr; c.lineWidth = 1.7; for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(hx, hy + 4.6); c.quadraticCurveTo(hx + i * 5, hy + 7, hx + i * 8.5, hy + 3); c.quadraticCurveTo(hx + i * 9.6, hy + 1.2, hx + i * 8, hy + 1); c.stroke(); } }
    if (v === 2) { tache(c, hx, hy, hr, true); for (i = -1; i <= 1; i += 2) E(c, hx + i * 11.6, hy + 2, 2.4, 5, hr); }
    if (v === 1) { c.beginPath(); c.arc(hx, hy - 4, 12.6, PI * 1.25, PI * 1.5); c.lineWidth = 0.7; c.strokeStyle = shade(hr, 0.3); c.stroke(); }
    K.bow(c, hx * 0.4, -55, 12, v === 1 ? p.accent : v === 0 ? p.accent2 : p.gold);
    if (v === 3) sleeve(-1, aL, 13);
    h = sleeve(1, aR, 16);
    if (v === 1) boater(c, h[0] + 2, h[1] - 3, 0.5 + m.sw * 0.2, vest); else boater(c, hx + m.sw * 0.6, hy - 10.5 - m.k * 1.2, m.sw * 0.05 + (v === 2 ? -0.12 : v === 3 ? 0.14 : 0), vest);
    c.restore();
  }, { wide: 0.9, variants: ['lead with a cane', 'tenor tipping his boater', 'bass with a big moustache', 'baritone hand on heart'] });

  /* ---------- jazzer: a late-night combo (sax, upright bass, muted trumpet, brushes and snare) ---------- */
  Art.add('character', 'jazzer', function (c, m, p) {
    var v = m.v, jk = ['#44527a', '#6a5440', '#2f6258', '#75405a'][v], sk = SKIN[[2, 0, 3, 1][v]], hr = HAIR[[1, 3, 1, 0][v]], pants = '#34303f';
    var hx = m.sw * 2, hy = -69 + m.k * 2, i, h, sing = m.open > 0.12, off = v === 1 ? -11 : 0, hat = [shade(jk, -0.25), '', p.accent, '#3a3442'][v];
    function A(s, a, len) { return K.arm(c, s * 13, -50, s, a, len, 6.5, jk, sk, 3.4); }
    c.save(); c.translate(off, 0);
    legs(c, pants, '#221c26');
    if (v === 3) { for (i = -1; i <= 1; i++) OL(c, 0, -31, i * 11, -1, 1.3, '#b9b4c2'); }
    torso(c, jk, 12.5, 14.5, -56, -24);
    Pg(c, [[-5, -56], [5, -56], [0, -38]], p.paper, true); Pg(c, [[-1.3, -53], [1.3, -53], [1.7, -42], [0, -39.5], [-1.7, -42]], p.accent, true);
    L(c, -5, -56, -1, -38, 0.8, shade(jk, -0.35)); L(c, 5, -56, 1, -38, 0.8, shade(jk, -0.35)); dot(c, 0, -33, 1, shade(jk, -0.4)); dot(c, 0, -29, 1, shade(jk, -0.4));
    Pg(c, [[6.5, -47], [10.5, -47], [8.5, -44]], p.gold, true); /* pocket square */
    person(c, m, hx, hy, 13, sk, hr, [4, 1, 4, 4][v]);
    if (v === 1) { c.lineWidth = 0.9; c.strokeStyle = DARK; for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(hx + i * 5.5, hy + 0.6, 3.6, 0, TAU); c.stroke(); } L(c, hx - 1.9, hy + 0.4, hx + 1.9, hy + 0.4, 0.8, DARK); }
    if (v === 0 || v === 3) { /* pork-pie, fedora */
      E(c, hx, hy - 10.5, v === 3 ? 18.5 : 16, 3.4, hat);
      if (v === 0) R(c, hx - 10.5, hy - 19.5, 21, 9.5, 3, hat); else { c.beginPath(); c.moveTo(hx - 11, hy - 11); c.quadraticCurveTo(hx - 11, hy - 23, hx - 4, hy - 22); c.quadraticCurveTo(hx, hy - 19.5, hx + 4, hy - 22); c.quadraticCurveTo(hx + 11, hy - 23, hx + 11, hy - 11); c.closePath(); F(c, hat); }
      Rn(c, hx - 10.6, hy - 14.6, 21.2, 3, 0, v === 0 ? p.gold : p.accent2);
      if (v === 0) c.fillStyle = shade(hat, 0.25), c.fillRect(hx - 7, hy - 18.5, 9, 1);
    } else if (v === 2) { /* beret */
      c.beginPath(); c.moveTo(hx - 12.5, hy - 8); c.quadraticCurveTo(hx - 17, hy - 21, hx - 1, hy - 20.5); c.quadraticCurveTo(hx + 17, hy - 20, hx + 12.5, hy - 8); c.quadraticCurveTo(hx, hy - 12, hx - 12.5, hy - 8); c.closePath(); F(c, hat); L(c, hx + 1, hy - 20.5, hx + 2.5, hy - 23.5, 1.4, shade(hat, -0.3));
      Pg(c, [[hx - 3, hy + 10.4], [hx + 3, hy + 10.4], [hx, hy + 14]], hr, true); /* little goatee */
    }
    if (v === 0) {
      if (sing) sax(c, 3 + m.sw, -53 - m.k, 0.12 + m.sw * 0.06, 0.95, BRASS); else sax(c, hx + 1.5, hy + 7.5, 0.1 + m.sw * 0.07 - m.k * 0.06, 1.02, BRASS);
      K.arm(c, -13, -50, -1, -1.15, 18, 6.5, jk, sk, 3.4); if (m.wave) A(1, wav(m), 16); else A(1, -0.12, 13);
      if (!sing) { note(c, 26 + m.sw * 2, -52 - frac(m.t * 0.9) * 10, 1, alpha(p.gold, 1 - frac(m.t * 0.9))); }
    } else if (v === 1) {
      c.save(); c.translate(24, 0); c.rotate(m.sw * 0.05 - 0.06); var wd = '#b8652e';
      L(c, 0, 0, 0, -8, 1.4, '#3a3442'); R(c, -2, -96, 4, 44, 1.5, DARK); E(c, 0, -97.5, 3.6, 3.6, wd); dot(c, 0, -97.5, 1.4, shade(wd, -0.4));
      for (i = -1; i <= 1; i += 2) { dot(c, i * 3.6, -91, 1.2, '#e6e2d8'); dot(c, i * 3.6, -87, 1.2, '#e6e2d8'); }
      c.lineWidth = K.ow() * 2; c.strokeStyle = shade(wd, -0.34); c.beginPath(); c.ellipse(0, -24, 16, 18, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(0, -46, 11.5, 11, 0, 0, TAU); c.stroke();
      c.fillStyle = wd; c.beginPath(); c.ellipse(0, -24, 16, 18, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, -46, 11.5, 11, 0, 0, TAU); c.fill();
      c.fillStyle = shade(wd, 0.2); c.beginPath(); c.ellipse(-6, -30, 5, 9, 0.2, 0, TAU); c.fill();
      for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * 7.5, -37); c.quadraticCurveTo(i * 5.5, -32, i * 8, -27); c.lineWidth = 1.2; c.strokeStyle = DARK; c.stroke(); }
      Rn(c, -3.5, -22, 7, 2, 0.5, '#e9d3a4'); Rn(c, -2.6, -14, 5.2, 8, 1.5, DARK);
      c.lineWidth = 0.4; c.strokeStyle = 'rgba(255,250,235,0.9)'; for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 1.2, -93); c.quadraticCurveTo(i * 1.6 + Math.sin(m.t * 30 + i) * m.k * 1.2, -55, i * 2.2, -13); c.stroke(); }
      c.restore();
      K.arm(c, 13, -50, 1, 2.2 - m.k * 0.1, 15, 6.5, jk, sk, 3.4);
      if (m.wave) A(-1, wav(m), 16); else K.arm(c, 13, -47, 1, 0.75 + m.sw * 0.25, 13, 6.5, jk, sk, 3.4), A(-1, 0.4 + m.sw * 0.3, 16);
    } else if (v === 2) {
      if (sing) { h = A(1, 0.75, 14); trumpet(c, h[0] - 12, h[1] + 2, -0.5 - m.k * 0.2, 0.95, BRASS, true); A(1, 0.75, 14); }
      else { trumpet(c, hx + 4, hy + 7.5, -0.1 - m.k * 0.3, 0.95, BRASS, true); A(1, 2.75, 13); }
      A(-1, m.wave ? wav(m) : 0.7 + m.sw * 0.5, 16); if (!m.wave) { h = [-13 - Math.sin(0.7 + m.sw * 0.5) * 16, -50 + Math.cos(0.7 + m.sw * 0.5) * 16]; for (i = 0; i < 3; i++) L(c, h[0] - 4 - m.k * 2, h[1] - 3 + i * 2.6, h[0] - 6.5 - m.k * 2, h[1] - 3.6 + i * 3.2, 0.6, alpha(p.snow, 0.8 * m.k)); }
    } else {
      var hit = Math.max(0, m.sw), hit2 = Math.max(0, -m.sw), dc = p.accent;
      R(c, -14, -43, 28, 11, 2, dc); Rn(c, -14, -34.4, 28, 1.6, 0, '#d9d4c8'); for (i = -2; i <= 2; i++) L(c, i * 6, -41, i * 6 + 2.4, -34, 0.6, '#f0ece2');
      E(c, 0, -43, 14, 4, '#fbf6ea'); c.beginPath(); c.ellipse(0, -43, 14, 4, 0, 0, TAU); c.lineWidth = 1.3; c.strokeStyle = '#c9c4d0'; c.stroke();
      for (i = -1; i <= 1; i += 2) {
        if (i > 0 && m.wave) { A(1, wav(m), 16); continue; }
        var up = (i < 0 ? hit2 : hit) * 5, bx = i * (6 - up * 0.3), by = -44.5 + up * 0.25, q = K.arm(c, i * 13, -50, i, 0.5 - up * 0.05, 9 - up * 0.5, 6.5, jk, sk, 3.4), b;
        L(c, q[0], q[1], (q[0] + bx) / 2, (q[1] + by) / 2 - up * 0.4, 1.4, '#3a3442');
        for (b = -2; b <= 2; b++) L(c, (q[0] + bx) / 2, (q[1] + by) / 2 - up * 0.4, bx + b * 1.8 - i * 2, by - up, 0.7, '#8a8494');
      }
    }
    c.restore();
  }, { wide: 1.0, variants: ['saxophone', 'upright bass', 'muted trumpet', 'brushes and snare'] });

  /* ---------- rocker: a garage band (guitar, bass, drummer with sticks, singer with a mic) ---------- */
  Art.add('character', 'rocker', function (c, m, p) {
    var v = m.v, top = ['#2e2a36', p.accent2, p.gold, '#3a2f5a'][v], sk = SKIN[[0, 3, 1, 2][v]], hr = [HAIR[1], HAIR[3], HAIR[0], p.accent][v], jeans = ['#3d5a8a', '#2e2a36', '#4a4458', '#2e2a36'][v];
    var hx = m.sw * 2.4, hy = -69 + m.k * 2.5, i, h, sl = v === 2 ? sk : top;
    function A(s, a, len) { return K.arm(c, s * 13, -50, s, a, len, 6.5, sl, sk, 3.4); }
    legs(c, jeans, v === 3 ? p.accent : '#221c26', 7.5);
    for (i = -1; i <= 1; i += 2) { if (v === 0) L(c, i * 5.5, -17, i * 9.5, -16.4, 1, shade(jeans, 0.5)); Rn(c, i * 9 - 6, -3, 12, 2, 1, '#f4f0e6'); }
    if (v === 2) { A(-1, 0, 0); }
    torso(c, top, 12.5, 14, -56, -24);
    if (v === 0) { Pg(c, [[-4.5, -56], [4.5, -56], [3.4, -24.5], [-3.4, -24.5]], '#f4f0e6', true); K.starPath(c, 0, -42, 3.4, 1.5, 5, 0); c.fillStyle = p.accent; c.fill(); Pg(c, [[-12, -56], [-4.5, -56], [-6.5, -46]], shade(top, 0.22), true); Pg(c, [[12, -56], [4.5, -56], [6.5, -46]], shade(top, 0.22), true); for (i = 0; i < 3; i++) dot(c, -8.5, -40 + i * 5, 0.8, '#d9d4c8'); }
    else if (v === 1) { c.save(); torso(c, top, 12.5, 14, -56, -24); c.clip(); c.fillStyle = shade(top, -0.3); for (i = 0; i < 4; i++) c.fillRect(-16, -50 + i * 7, 32, 3); c.restore(); }
    else if (v === 2) { Pg(c, [[-2.5, -47], [1.5, -47], [-0.5, -41.5], [3, -41.5], [-2.5, -32], [-1, -38.5], [-4, -38.5]], DARK, true); }
    else { Pg(c, [[-4.5, -56], [4.5, -56], [3.4, -24.5], [-3.4, -24.5]], p.gold, true); K.heartPath(c, 0, -42, 5); c.fillStyle = p.accent; c.fill(); for (i = -1; i <= 1; i += 2) for (h = 0; h < 3; h++) dot(c, i * 12.5, -52 + h * 2.5, 0.9, '#d9d4c8'); }
    Rn(c, -14, -27.5, 28, 3, 1.2, DARK); R(c, -2.2, -28.2, 4.4, 4.4, 1, '#d9d4c8');
    if (v === 1) K.hairdo(c, hx, hy, 14, hr, 2);
    K.head(c, hx, hy, 13, sk, m);
    if (v === 0) { c.beginPath(); c.moveTo(hx - 13, hy - 2); for (i = 0; i <= 6; i++) { c.lineTo(hx - 13.5 + i * 4.3 + m.sw, hy - 21 - (i % 2 ? 0 : 3) - (i === 3 ? 3 : 0) - m.k * 2); c.lineTo(hx - 11 + i * 4.3, hy - 11.5); } c.lineTo(hx + 13, hy - 2); c.quadraticCurveTo(hx, hy - 13, hx - 13, hy - 2); c.closePath(); F(c, hr); }
    else if (v === 1) { K.hairdo(c, hx, hy, 13, hr, 0); c.beginPath(); c.moveTo(hx - 13.4, hy - 4); c.quadraticCurveTo(hx - 13, hy - 19, hx, hy - 19); c.quadraticCurveTo(hx + 13, hy - 19, hx + 13.4, hy - 4); c.quadraticCurveTo(hx, hy - 9, hx - 13.4, hy - 4); c.closePath(); F(c, p.accent); R(c, hx - 14, hy - 8.4, 28, 4.6, 2, shade(p.accent, -0.2)); }
    else if (v === 2) { K.hairdo(c, hx, hy, 13.4, hr, 1); R(c, hx - 13.2, hy - 9.5, 26.4, 4, 2, p.accent); Pg(c, [[hx + 12, hy - 8], [hx + 18 + m.sw * 2, hy - 4 + m.k * 2], [hx + 16, hy - 9.5]], p.accent); }
    else { for (i = -2; i <= 2; i++) { c.save(); c.translate(hx + i * 3.6, hy - 11); c.rotate(i * 0.22 + m.sw * 0.08); E(c, 0, -6.5 - (2 - Math.abs(i)) * 1.6 - m.k * 1.5, 3, 8.5, i % 2 ? shade(hr, -0.15) : hr); c.restore(); } for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(hx + i * 13.6, hy + 5, 1.8, 0, TAU); c.lineWidth = 0.8; c.strokeStyle = p.gold; c.stroke(); } }
    if (v === 0 || v === 1) {
      var bs = v === 1, gx = -2 + m.sw * 1.5, gy = -33 - m.k * 2, gr = -0.42 + m.sw * 0.07, nl = (bs ? 31 : 26) * 0.92, nx = gx + Math.cos(gr) * nl, ny = gy + Math.sin(gr) * nl;
      L(c, -11, -55, 10, -30, 2.2, DARK); strings(c, gx, gy, gr, 0.95, bs ? p.gold : p.accent, bs ? 'bass' : 'el', m);
      if (bs) A(-1, -0.4 + m.sw * 0.25, 18); else A(-1, m.k > 0.5 ? 2.6 : -0.45 + m.sw * 0.35, m.k > 0.5 ? 16 : 18);
      if (m.wave) A(1, wav(m), 16); else K.arm(c, 13, -50, 1, Math.atan2(nx - 13, ny + 50), Math.sqrt((nx - 13) * (nx - 13) + (ny + 50) * (ny + 50)), 6.5, sl, sk, 3.4);
    } else if (v === 2) {
      var a1 = 2.5 - Math.max(0, m.sw) * 1.5 - m.k * 0.3, a2 = m.wave ? wav(m) : 2.5 - Math.max(0, -m.sw) * 1.5 - m.k * 0.3;
      h = A(-1, a1, 16); sticks(c, h[0] + Math.sin(a1 + 0.7) * 3, h[1] - Math.cos(a1 + 0.7) * 3, h[0] - Math.sin(a1 + 0.7) * 15, h[1] + Math.cos(a1 + 0.7) * 15); K.arm(c, h[0], h[1], 1, 0, 0.01, 0.1, sk, sk, 3.4);
      h = A(1, a2, 16); sticks(c, h[0] - Math.sin(a2 + 0.7) * 3, h[1] - Math.cos(a2 + 0.7) * 3, h[0] + Math.sin(a2 + 0.7) * 15, h[1] + Math.cos(a2 + 0.7) * 15); K.arm(c, h[0], h[1], 1, 0, 0.01, 0.1, sk, sk, 3.4);
      for (i = 0; i < 3; i++) L(c, -3 + i * 3, hy - 30 - m.k * 4, -4.5 + i * 4.5, hy - 34 - m.k * 6, 0.8, alpha(p.gold, m.k));
    } else {
      var sx = -19 + m.sw * 3, ty = -60 - m.k * 1.5;
      L(c, -15, -1.5, -3, -1.5, 2.4, '#3a3442'); OL(c, -9, -1.5, sx, ty, 1.5, '#b9b4c2'); c.save(); c.translate(sx, ty); c.rotate(-0.5 + m.sw * 0.1); R(c, -1.7, -8, 3.4, 9, 1.4, '#3a3442'); E(c, 0, -10.5, 3.6, 4, '#c9c4d0'); L(c, -2.6, -11, 2.6, -11, 0.5, '#8a8494'); L(c, -3, -9.4, 3, -9.4, 0.5, '#8a8494'); c.restore();
      K.arm(c, -13, -50, -1, 1.35 + m.k * 0.1, 9, 6.5, sl, sk, 3.4);
      if (m.wave) A(1, wav(m), 16); else { h = A(1, 2.5 + m.k * 0.4 - Math.abs(m.sw) * 0.5, 16); for (i = -1; i <= 1; i += 2) L(c, h[0] + i * 1.2, h[1] - 3, h[0] + i * 2.6, h[1] - 8, 1.8, sk); }
    }
  }, { wide: 1.0, variants: ['guitarist', 'bassist', 'drummer', 'singer'] });

  /* ---------- chorister: a choir in robes, folders open ---------- */
  Art.add('character', 'chorister', function (c, m, p) {
    var v = m.v, robe = [p.accent, '#3a4f9a', p.accent2, '#6a3d8a'][v], sk = SKIN[[1, 3, 0, 2][v]], hr = HAIR[[1, 1, 2, 0][v]], st = [2, 0, 3, 1][v];
    var hx = m.sw * 2, hy = -69 + m.k * 2 - (m.open > 0.12 ? 1 : 0), i, sur = v % 2 === 1, stole = v === 0 ? p.gold : p.paper, fol = [DARK, '#5c1f30', '#1f2f52', '#2f4a3a'][v];
    c.save(); c.scale([1, 0.96, 1.07, 1][v], [1, 1.04, 0.92, 0.98][v]);
    for (i = -1; i <= 1; i += 2) R(c, i * 7 - 6, -6, 12, 6.5, 3, '#2e2a36');
    c.beginPath(); c.moveTo(-12, -56); c.quadraticCurveTo(-17, -32, -21, -5); c.quadraticCurveTo(-14, -1.5, -10.5, -4.5); c.quadraticCurveTo(-5, -1, 0, -4.5); c.quadraticCurveTo(5, -1, 10.5, -4.5); c.quadraticCurveTo(14, -1.5, 21, -5); c.quadraticCurveTo(17, -32, 12, -56); c.closePath(); F(c, robe);
    c.lineWidth = 0.9; c.strokeStyle = shade(robe, -0.22); for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 5, -30); c.quadraticCurveTo(i * 6.5, -18, i * 8, -5); c.stroke(); }
    if (sur) { /* white surplice over the robe */
      c.beginPath(); c.moveTo(-12, -56); c.quadraticCurveTo(-16.5, -40, -18.5, -24); c.quadraticCurveTo(-9, -19, 0, -22); c.quadraticCurveTo(9, -19, 18.5, -24); c.quadraticCurveTo(16.5, -40, 12, -56); c.closePath(); F(c, '#fffdf4');
      c.lineWidth = 0.8; c.strokeStyle = '#d9d2c2'; for (i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 5.5, -48); c.lineTo(i * 6.5, -23); c.stroke(); }
      for (i = -3; i <= 3; i++) dot(c, i * 5, -25.5 + Math.abs(i) * 0.5, 0.9, robe);
    } else { /* a stole with a small diamond at each end */
      for (i = -1; i <= 1; i += 2) { Pg(c, [[i * 4, -56], [i * 11, -56], [i * 12.5, -22], [i * 6.5, -22]], stole); Pg(c, [[i * 9.5, -30], [i * 11.2, -27.5], [i * 9.5, -25], [i * 7.8, -27.5]], v === 0 ? p.accent2 : p.gold, true); L(c, i * 6.7, -33, i * 12.2, -33, 0.7, shade(stole, -0.25)); }
    }
    person(c, m, hx, hy, 13, sk, hr, st);
    if (v === 2) { c.lineWidth = 0.9; c.strokeStyle = DARK; for (i = -1; i <= 1; i += 2) { K.rrp(c, hx + i * 5.6 - 3.6, hy - 2.4, 7.2, 6, 2); c.stroke(); } L(c, hx - 2, hy, hx + 2, hy, 0.8, DARK); }
    if (v === 1) R(c, hx - 3.4, hy + 9.6, 6.8, 3, 1.4, hr);
    c.beginPath(); c.moveTo(-9, -57.5); c.quadraticCurveTo(0, -49, 9, -57.5); c.quadraticCurveTo(0, -54, -9, -57.5); c.closePath(); F(c, sur ? robe : '#fffdf4'); /* collar */
    var sl = sur ? '#fffdf4' : robe, bx = m.sw * 1.5 + (m.wave ? -6 : 0), by = [-39, -43, -37, -40][v] - m.k * 3;
    if (m.wave) K.arm(c, 13, -50, 1, wav(m), 16, 8.5, sl, sk, 3.6); else K.arm(c, 13, -50, 1, 0.5, 13, 8.5, sl);
    K.arm(c, -13, -50, -1, 0.5, 13, 8.5, sl);
    c.save(); c.translate(bx, by); c.rotate(m.sw * 0.06);
    Pg(c, [[-13, -7.5], [0, -5.5], [13, -7.5], [13, 6.5], [0, 8.5], [-13, 6.5]], fol); Pg(c, [[-11, -9], [0, -6.5], [0, 6.5], [-11, 4.5]], '#fffdf4'); Pg(c, [[11, -9], [0, -6.5], [0, 6.5], [11, 4.5]], '#fffdf4');
    for (i = 0; i < 3; i++) { L(c, -9, -5 + i * 3, -2, -3.8 + i * 3, 0.45, '#9a8f84'); L(c, 9, -5 + i * 3, 2, -3.8 + i * 3, 0.45, '#9a8f84'); dot(c, -7 + i * 2.2, -5.3 + i * 3.2, 0.8, DARK); dot(c, 4 + i * 1.6, -4 + i * 2.8, 0.8, DARK); }
    L(c, 0.5, 6.5, 2.5, 12 + m.sw, 1, p.gold);
    E(c, -12, 2, 3.6, 3.6, sk); if (!m.wave) E(c, 12, 2, 3.6, 3.6, sk); c.restore();
    c.restore();
  }, { wide: 0.85, variants: ['soprano in a stole', 'tenor in a surplice', 'alto with glasses', 'bass in a surplice'] });

  /* ---------- marcher: a marching band (drum major, tuba, snare, cymbals) ---------- */
  Art.add('character', 'marcher', function (c, m, p) {
    var v = m.v, jk = [p.accent, '#2f5d8a', p.accent2, '#6a3d8a'][v], sk = SKIN[[3, 1, 2, 0][v]], hr = HAIR[[1, 0, 1, 2][v]], wh = '#fffdf4', pl = [p.gold, p.accent, p.gold, p.accent2][v];
    var hx = m.sw * 1.6, hy = -68 + m.k * 2, i, h, lift;
    function A(s, a, len) { return K.arm(c, s * 13, -50, s, a, len, 6.5, jk, wh, 3.5); }
    c.save(); c.scale(0.92, 0.92);
    for (i = -1; i <= 1; i += 2) { lift = Math.max(0, i * m.sw) * 6; OL(c, i * 6, -27, i * 6.5 + (lift ? i * 1.5 : 0), -6 - lift, 7, wh); L(c, i * 8.8, -25, i * 9.3 + (lift ? i * 1.5 : 0), -8 - lift, 1.1, jk); R(c, i * 8 - 6.5 + (lift ? i * 1.5 : 0), -8 - lift, 13, 8, 3.5, '#221c26'); }
    if (v === 1) { c.beginPath(); c.ellipse(1, -42, 21, 23, 0.15, 0, TAU); c.lineWidth = 8.6; c.strokeStyle = shade(BRASS, -0.34); c.stroke(); c.lineWidth = 7; c.strokeStyle = BRASS; c.stroke();
      c.save(); c.translate(hx * 0.5 + 15, hy - 22 - m.k * 2); c.rotate(0.3 + m.sw * 0.05); E(c, 0, 0, 19, 16, BRASS); E(c, 0, 0.5, 14.5, 12, shade(BRASS, -0.22)); E(c, 0, 1.5, 6.5, 5, shade(BRASS, -0.5)); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-11, -8, 2, 6, 0.9, 0, TAU); c.fill(); c.restore(); }
    torso(c, jk, 12.5, 14, -56, -24);
    for (i = 0; i < 4; i++) { L(c, -6.5 + i * 0.6, -51 + i * 5.6, 6.5 - i * 0.6, -51 + i * 5.6, 1.5, p.gold); dot(c, -6.5 + i * 0.6, -51 + i * 5.6, 1.3, p.gold); dot(c, 6.5 - i * 0.6, -51 + i * 5.6, 1.3, p.gold); }
    Rn(c, -14.2, -28, 28.4, 3.6, 1.2, wh); R(c, -2.4, -28.8, 4.8, 5, 1, p.gold);
    for (i = -1; i <= 1; i += 2) { R(c, i * 13 - 4.5, -57.5, 9, 3.6, 1.6, p.gold); for (h = -1; h <= 1; h++) L(c, i * 13 + h * 2.6, -54, i * 13 + h * 2.9, -51.6, 0.8, p.gold); }
    person(c, m, hx, hy, 13, sk, hr, v === 3 ? 2 : 4);
    c.beginPath(); c.arc(hx, hy + 1, 13.2, 0.12 * PI, 0.88 * PI); c.lineWidth = 0.9; c.strokeStyle = DARK; c.stroke(); /* chin strap */
    var th = v === 0 ? 20 : 15; /* shako with a plume */
    R(c, hx - 10.5, hy - 10 - th, 21, th + 1, 2.4, v === 0 ? wh : jk); Rn(c, hx - 10.5, hy - 14, 21, 3, 0, p.gold); E(c, hx, hy - 9.6, 12.5, 2.8, DARK);
    K.starPath(c, hx, hy - 10 - th * 0.52, 3.6, 1.6, v === 0 ? 8 : 5, 0); c.fillStyle = p.gold; c.fill();
    c.save(); c.translate(hx, hy - 10 - th); c.rotate(m.sw * 0.18); E(c, 0, -7 - m.k * 1.5, 4.6, 8.5, pl); c.fillStyle = shade(pl, 0.4); c.beginPath(); c.ellipse(-1.2, -9 - m.k * 1.5, 1.6, 4.6, 0, 0, TAU); c.fill(); Rn(c, -2, -1.5, 4, 3, 1, p.gold); c.restore();
    if (v === 0) { /* the drum major's mace, pumped on the beat */
      A(-1, 0.95, 9);
      h = A(1, m.wave ? wav(m) : 2.15 + m.k * 0.5, 16); c.save(); c.translate(h[0], h[1]); c.rotate((m.wave ? 0.25 : 0.2) + m.sw * 0.1); OL(c, 0, 16, 0, -22, 1.6, '#6b4226'); E(c, 0, -25, 4, 4.6, p.gold); dot(c, -1.2, -26.4, 1.3, '#fff6d8'); Pg(c, [[-1.4, 16], [1.4, 16], [0, 20]], p.gold, true); L(c, -1.5, -2, 1.5, 6, 0.8, wh); L(c, -1.5, 4, 1.5, 12, 0.8, wh); c.restore(); K.arm(c, h[0], h[1], 1, 0, 0.01, 0.1, wh, wh, 3.5);
      for (i = 0; i < 3; i++) dot(c, 5, -49.5 + i * 0, 0, wh);
    } else if (v === 1) {
      c.beginPath(); c.ellipse(1, -42, 21, 23, 0.15, 0.25 * PI, 0.85 * PI); c.lineWidth = 8.6; c.strokeStyle = shade(BRASS, -0.34); c.stroke(); c.lineWidth = 7; c.strokeStyle = BRASS; c.stroke();
      c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(1, -42, 22.5, 24.5, 0.15, 0.4 * PI, 0.7 * PI); c.stroke();
      for (i = 0; i < 3; i++) R(c, 4 + i * 3.6, -40 - (i === (m.n % 3 + 3) % 3 ? 0 : 1.6), 2.6, 6, 1, shade(BRASS, 0.2));
      A(-1, m.wave ? wav(m) : 0.35, 15); K.arm(c, 13, -50, 1, -0.35, 11, 6.5, jk, wh, 3.5);
      if (m.k > 0.25) for (i = -1; i <= 1; i++) L(c, hx * 0.5 + 34 + i, hy - 30 + i * 6, hx * 0.5 + 38 + m.k * 3, hy - 31 + i * 8, 0.9, alpha(p.gold, m.k));
    } else if (v === 2) {
      L(c, -9, -55, 6, -36, 2, wh);
      c.save(); c.translate(0, -31 - m.k); c.rotate(-0.1); R(c, -15, -6, 30, 12, 2, wh); for (i = -2; i <= 2; i++) L(c, i * 6.5 - 2, -5, i * 6.5 + 2, 5, 0.6, jk); Rn(c, -15, -6, 30, 2.2, 1, p.gold); Rn(c, -15, 4, 30, 2.2, 1, p.gold); E(c, 0, -6.5, 15, 3.8, '#fbf6ea'); c.restore();
      for (i = -1; i <= 1; i += 2) {
        if (i > 0 && m.wave) { h = A(1, wav(m), 16); sticks(c, h[0], h[1] + 2, h[0] + 4, h[1] - 13); continue; }
        var up = Math.max(0, -i * m.sw) * 7 + 0.5; h = A(i, 0.55 - up * 0.04, 10 - up * 0.3); sticks(c, h[0] + i * 1.5, h[1] - 1, i * 3.5, -38.5 - up);
      }
    } else {
      var gap = m.wave ? 0 : (1 - m.k) * 13 + 1.5, cy = -42 - m.k * 3;
      for (i = -1; i <= 1; i += 2) {
        if (i > 0 && m.wave) { h = A(1, wav(m), 16); E(c, h[0] + 1.5, h[1] - 2, 3, 11.5, BRASS, 0.3); dot(c, h[0] + 1.5, h[1] - 2, 1.6, shade(BRASS, -0.4)); continue; }
        var tx = i * (gap + 1.5), dx = tx - i * 13, dy = cy + 50; K.arm(c, i * 13, -50, i, Math.atan2(i * dx, dy) + (Math.abs(dx) < 1 ? 0 : 0), Math.sqrt(dx * dx + dy * dy) + 3, 6.5, jk, wh, 3.5);
        E(c, tx, cy, 3.2, 12.5, BRASS, -i * 0.1); E(c, tx - i * 0.6, cy, 1.5, 9.5, shade(BRASS, 0.3), -i * 0.1); dot(c, tx - i * 1.6, cy, 1.5, shade(BRASS, -0.4));
      }
      if (m.k > 0.3 && !m.wave) for (i = 0; i < 6; i++) { var sa = i / 6 * TAU + 0.5; L(c, Math.cos(sa) * 8, cy + Math.sin(sa) * 14, Math.cos(sa) * (10 + m.k * 5), cy + Math.sin(sa) * (16 + m.k * 5), 1, alpha(p.gold, m.k)); }
    }
    c.restore();
  }, { wide: 1.0, variants: ['drum major', 'tuba', 'snare drum', 'cymbals'] });

  /* ---------- instrument: a guitar, a drum, a saxophone and a keyboard that play themselves ---------- */
  function limb(c, x1, y1, x2, y2) { OL(c, x1, y1, x2, y2, 2.2, '#3a3442'); }
  function feet(c, x, col, m, top) { for (var i = -1; i <= 1; i += 2) { limb(c, i * x, top, i * (x + 1), -4); R(c, i * (x + 2.5) - 6, -6.5, 12, 6.5, 3, col); Rn(c, i * (x + 2.5) - 5, -2.4, 10, 1.6, 0.8, '#fffdf4'); } }
  function glove(c, x, y) { E(c, x, y, 3.4, 3.4, '#fffdf4'); }
  function face(c, m, x, y, s, col) { K.eyes(c, x, y, 6.5 * s, 2.3 * s, m); K.blush(c, x, y + 5 * s, 11 * s, 2.6 * s); K.mouth(c, x, y + 8 * s, 5 * s, m, col || DARK); }
  Art.add('character', 'instrument', function (c, m, p) {
    var v = m.v, i, h, hx = m.sw * 1.5, k = m.k, wv = m.wave ? wav(m) : 0;
    function armTo(sx, sy, tx, ty) { limb(c, sx, sy, tx, ty); glove(c, tx, ty); }
    function waveArm(sx, sy) { var ex = sx + Math.sin(wv) * 15, ey = sy + Math.cos(wv) * 15; armTo(sx, sy, ex, ey); }
    if (v === 0) { /* guitar: the sound hole sings */
      var wd = mix(WOODC, p.gold, 0.25), dk = shade(wd, -0.34);
      feet(c, 7, p.accent, m, -10);
      c.save(); c.translate(0, -4); c.rotate(m.sw * 0.04);
      R(c, -3.2, -90 + k, 6.4, 36, 1.5, '#6b4226'); for (i = 0; i < 5; i++) L(c, -3, -82 + i * 4.6 + k, 3, -82 + i * 4.6 + k, 0.5, '#e9d3a4');
      R(c, -5, -99 + k, 10, 11, 2.6, '#4a2c18'); for (i = -1; i <= 1; i += 2) { dot(c, i * 6.6, -96 + k, 1.5, '#e6e2d8'); dot(c, i * 6.6, -91.5 + k, 1.5, '#e6e2d8'); }
      c.lineWidth = K.ow() * 2; c.strokeStyle = dk; c.beginPath(); c.ellipse(0, -25, 23, 21, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(0, -50, 16.5, 14, 0, 0, TAU); c.stroke();
      c.fillStyle = wd; c.beginPath(); c.ellipse(0, -25, 23, 21, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, -50, 16.5, 14, 0, 0, TAU); c.fill();
      c.fillStyle = shade(wd, 0.22); c.beginPath(); c.ellipse(-11, -31, 6, 10, 0.4, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(0, -25, 20.5, 18.5, 0, 0.1 * PI, 0.9 * PI); c.lineWidth = 0.8; c.strokeStyle = shade(wd, -0.2); c.stroke();
      R(c, -9, -13.5, 18, 3.6, 1.2, '#4a2c18');
      c.lineWidth = 0.4; c.strokeStyle = 'rgba(255,250,235,0.85)'; for (i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 1.3, -26); c.quadraticCurveTo(i * 1.5 + Math.sin(m.t * 40 + i) * k, -19, i * 1.6, -12.5); c.stroke(); c.beginPath(); c.moveTo(i * 1.1, -89 + k); c.lineTo(i * 1.2, -58); c.stroke(); }
      K.eyes(c, hx * 0.6, -50, 7, 2.5, m); K.blush(c, hx * 0.6, -45, 12, 2.6);
      c.beginPath(); c.arc(0, -34, 6.6, 0, TAU); c.lineWidth = 1; c.strokeStyle = '#f4e3b8'; c.stroke();
      if (m.open > 0.12) { E(c, 0, -34, 4.6, 3 + m.open * 2.6, '#4a1622'); c.fillStyle = '#e8707e'; c.beginPath(); c.ellipse(0, -32.4 + m.open * 1.6, 2.6, 1.4, 0, 0, TAU); c.fill(); }
      else { dot(c, 0, -34, 5.2, shade(wd, -0.62)); c.beginPath(); c.arc(0, -36, 3.6, 0.2 * PI, 0.8 * PI); c.lineWidth = 1; c.lineCap = 'round'; c.strokeStyle = '#f4e3b8'; c.stroke(); }
      armTo(-21, -32, -3 + m.sw * 5, -20 - k * 2);
      if (m.wave) waveArm(15, -54); else armTo(15, -54, 4.5, -72 + m.sw * 4 + k);
      c.restore();
    } else if (v === 1) { /* drum: beats its own rim */
      var sh = p.accent, cy = -40 - k;
      feet(c, 9, p.accent2, m, -14);
      E(c, 0, cy, 32, 31, sh); for (i = 0; i < 10; i++) { var a = i / 10 * TAU + 0.31; c.save(); c.translate(Math.cos(a) * 29.2, cy + Math.sin(a) * 28.2); c.rotate(a); Rn(c, -1.6, -2.4, 3.2, 4.8, 1, p.gold); c.restore(); }
      E(c, 0, cy, 26, 25, '#fbf6ea'); c.fillStyle = 'rgba(120,100,140,0.1)'; c.beginPath(); c.ellipse(3, cy + 4, 21, 19, 0, 0, TAU); c.fill(); c.fillStyle = '#fbf6ea'; c.beginPath(); c.ellipse(-1, cy - 1, 21, 19.5, 0, 0, TAU); c.fill();
      face(c, m, hx, cy - 3, 1.25);
      for (i = -1; i <= 1; i += 2) {
        if (i > 0 && m.wave) { waveArm(30, cy); continue; }
        var up = Math.max(0, -i * m.sw) * 10 + (1 - k) * 2, ex = i * 37, ey = cy - 20 - up * 0.6, tx = i * 19, ty = cy - 31 - up;
        limb(c, i * 31, cy + 3, ex, ey); OL(c, ex, ey, tx, ty, 1.5, '#e9c98c'); E(c, tx, ty, 3.4, 3.4, '#fffdf4'); glove(c, ex, ey);
        if (up < 3.5) for (h = -1; h <= 1; h++) L(c, tx + h * 4, ty - 5, tx + h * 6.5, ty - 9, 0.9, alpha(p.gold, 0.9));
      }
    } else if (v === 2) { /* saxophone: fingers its own keys */
      var br = BRASS, bd = shade(br, -0.34), w;
      feet(c, 5, p.accent, m, -10);
      c.save(); c.translate(-4, 0); c.rotate(m.sw * 0.05);
      for (i = 0; i < 2; i++) { w = i ? 21 : 23.4; c.beginPath(); c.moveTo(-1, -66); c.lineTo(1, -30); c.quadraticCurveTo(3, -14, 17, -17); c.quadraticCurveTo(27, -20, 26, -34); c.lineCap = 'round'; c.lineWidth = w; c.strokeStyle = i ? br : bd; c.stroke(); }
      for (i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-1, -72); c.quadraticCurveTo(-1, -90 + k, -13, -90 + k); c.lineWidth = i ? 5.4 : 7.2; c.strokeStyle = i ? br : bd; c.stroke(); }
      R(c, -22 , -93 + k, 10, 5.6, 2, DARK); Rn(c, -7.5, -76, 13, 4, 1.5, shade(br, 0.3));
      c.beginPath(); c.moveTo(14.5, -33); c.lineTo(10, -47 - k); c.lineTo(44, -49 - k); c.lineTo(37.5, -33); c.closePath(); F(c, br); E(c, 27, -48 - k, 17, 4.6, shade(br, 0.38), -0.05); E(c, 27, -47.6 - k, 11.5, 2.6, shade(br, -0.45), -0.05);
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-6.5, -45, 1.8, 13, 0, 0, TAU); c.fill();
      face(c, m, hx * 0.6 - 0.5, -58, 1.1, shade(br, -0.7));
      for (i = 0; i < 4; i++) { var dn = ((m.n + i) % 4 + 4) % 4 === 0 ? 1 : 0; E(c, 9.8 + dn * -0.8, -44 + i * 6.4, 2.7, 2.7, shade(br, -0.22)); dot(c, 9.5 + dn * -0.8, -44.3 + i * 6.4, 1.6, '#fff6d8'); }
      armTo(-11, -34, 9.5, -38 + m.sw * 3); if (m.wave) waveArm(10, -62); else armTo(11, -62, 21 + m.sw * 2, -53 - k * 2);
      if (!m.wave) { note(c, 27 + m.sw * 3, -60 - frac(m.t * 0.8) * 16, 1.5, alpha(p.accent2, 1 - frac(m.t * 0.8))); note(c, 36, -58 - frac(m.t * 0.8 + 0.5) * 16, 1.2, alpha(p.accent, 1 - frac(m.t * 0.8 + 0.5))); }
      c.restore();
    } else { /* keyboard: plays its own keys */
      var bd2 = '#3a3550', ky = -40, n = 11, kw = 6.2, pr = ((m.n * 3) % n + n) % n, pr2 = ((m.n * 5 + 4) % n + n) % n;
      feet(c, 14, p.accent, m, -24);
      c.save(); c.translate(0, -k * 2); c.rotate(m.sw * 0.05);
      R(c, -39, -66, 78, 44, 5, bd2); Rn(c, -36, -63.5, 72, 2, 1, shade(bd2, 0.25));
      R(c, -34.6, ky - 1, kw * n + 1.2, 16.5, 1.2, '#fffdf4');
      for (i = 0; i < n; i++) { if (i === pr || i === pr2) Rn(c, -34 + i * kw, ky, kw, 15, 0, m.k > 0.2 ? p.gold : '#efe9da'); if (i) L(c, -34 + i * kw, ky, -34 + i * kw, ky + 15, 0.5, '#b9b4c2'); }
      for (i = 0; i < n - 1; i++) if ([1, 1, 0, 1, 1, 1, 0, 1, 1, 0][i]) Rn(c, -34 + (i + 1) * kw - 1.9, ky, 3.8, 9, 0.8, DARK);
      R(c, -15, -62.5, 30, 18.5, 4, shade(bd2, 0.16)); face(c, m, hx * 0.5, -56.5, 0.9, '#fffdf4');
      c.fillStyle = '#fffdf4'; for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(hx * 0.5 + i * 5.85, -56.5, 3.4, 0, TAU); c.fill(); } K.eyes(c, hx * 0.5, -56.5, 5.85, 2.1, m);
      for (i = 0; i < 3; i++) { E(c, -31 + i * 5.6, -58, 2, 2, [p.accent, p.gold, p.accent2][i]); L(c, -31 + i * 5.6, -58, -31 + i * 5.6 + Math.sin(m.t + i * 2) * 1.4, -59.6, 0.6, '#fffdf4'); }
      for (i = 0; i < 4; i++) Rn(c, 19.5 + i * 4, -50 - (1 + Math.abs(Math.sin(m.t * 5 + i * 1.7))) * 4 * (0.4 + m.k * 0.6), 2.6, (1 + Math.abs(Math.sin(m.t * 5 + i * 1.7))) * 4 * (0.4 + m.k * 0.6), 0.6, i % 2 ? p.accent2 : p.gold);
      armTo(-39, -48, -34 + (Math.min(pr, pr2) + 0.5) * kw * 0.5 - 6, ky + 10 - k * 2);
      if (m.wave) waveArm(39, -50); else armTo(39, -48, 12 + (Math.max(pr, pr2) % 4) * 4, ky + 10 + k * 1.5 - 2);
      c.restore();
      if (!m.wave) note(c, 30, -74 - frac(m.t * 0.8) * 14, 1.4, alpha(p.gold, 1 - frac(m.t * 0.8)));
      note(c, -30 + m.sw * 2, -72 - frac(m.t * 0.8 + 0.4) * 14, 1.2, alpha(p.accent, 1 - frac(m.t * 0.8 + 0.4)));
    }
  }, { wide: 1.1, variants: ['guitar', 'drum', 'saxophone', 'keyboard'] });

  /* ---------- dreidelpal: a spinning-top dreidel with a face and little feet (faces left plain: no lettering) ---------- */
  Art.add('character', 'dreidelpal', function (c, m, p) {
    var v = m.v, col = ['#3f7fd0', '#d9a44a', p.accent2, '#eef0f6'][v], tr = [p.gold, '#8a5a2a', p.paper, '#3f7fd0'][v], hw = [20, 19, 16, 24][v], top = [-74, -74, -80, -66][v], sh = [-40, -42, -40, -38][v], rad = [4, 9, 4, 6][v];
    var i, hx = m.sw * 1.5, k = m.k, side = clamp(m.sw, -1, 1), sd = Math.abs(side) * 6, dk = shade(col, -0.2);
    for (i = -1; i <= 1; i += 2) { limb(c, i * 6, -18, i * 8, -4); R(c, i * 10 - 6, -6.5, 12, 6.5, 3, v === 1 ? '#6b4226' : tr === p.paper ? p.gold : tr); }
    /* speed lines of the spin, strongest on the beat */
    c.lineWidth = 1.1; c.lineCap = 'round'; for (i = 0; i < 3; i++) { c.strokeStyle = alpha(p.snow, (0.25 + k * 0.6) * (1 - i * 0.25)); c.beginPath(); c.ellipse(0, -13 - i * 1.5, hw * 0.75 + i * 5, 3 + i * 1.2, 0, PI * (0.1 + frac(m.t * 1.3 + i * 0.3)), PI * (0.75 + frac(m.t * 1.3 + i * 0.3))); c.stroke(); }
    c.save(); c.rotate(m.sw * 0.07);
    R(c, -3.6, top - 17 + k, 7.2, 19, 3, tr === p.paper ? p.gold : tr); E(c, 0, top - 17 + k, 5.4, 3.6, shade(tr === p.paper ? p.gold : tr, 0.2));
    function body() { c.beginPath(); c.moveTo(-hw + rad, top); c.lineTo(hw - rad, top); c.quadraticCurveTo(hw, top, hw, top + rad); c.lineTo(hw, sh); c.quadraticCurveTo(hw * 0.75, sh + 16, 0, -11); c.quadraticCurveTo(-hw * 0.75, sh + 16, -hw, sh); c.lineTo(-hw, top + rad); c.quadraticCurveTo(-hw, top, -hw + rad, top); c.closePath(); }
    body(); F(c, col);
    c.save(); body(); c.clip();
    c.fillStyle = dk; if (side > 0) c.fillRect(-hw - 1, top - 1, sd, 80); else c.fillRect(hw + 1 - sd, top - 1, sd, 80); /* the side wall that comes round as it turns */
    c.fillStyle = alpha('#ffffff', 0.22); c.fillRect(-hw + (side > 0 ? sd : 0) + 2.5, top + 2.5, 3, sh - top - 4);
    if (v === 0) { c.fillStyle = tr; c.fillRect(-hw, top + 3, hw * 2, 2.2); c.fillRect(-hw, sh - 3.5, hw * 2, 2.2); }
    else if (v === 1) { c.strokeStyle = alpha('#8a5a2a', 0.45); c.lineWidth = 0.8; for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-hw, top + 6 + i * 9); c.quadraticCurveTo(0, top + 2 + i * 9 + (i % 2) * 5, hw, top + 7 + i * 9); c.stroke(); } }
    else if (v === 2) { for (i = 0; i < 5; i++) { K.twinkle(c, -hw + 4 + i * (hw * 2 - 8) / 4, top + 5.5, 2.4, tr); } c.fillStyle = shade(col, -0.3); c.fillRect(-hw, sh - 2, hw * 2, 1.6); }
    else { c.fillStyle = tr; c.fillRect(-hw, top + 2.5, hw * 2, 1.6); c.fillRect(-hw, top + 5.6, hw * 2, 3.2); c.fillRect(-hw, sh - 6, hw * 2, 3.2); c.fillRect(-hw, sh - 1.6, hw * 2, 1.6); }
    c.restore();
    var fy = (top + sh) / 2 + (v === 0 ? 1 : v === 3 ? 2 : 0), fx = hx - side * 1.5;
    K.eyes(c, fx, fy - 2, hw * 0.36, 2.5, m); K.blush(c, fx, fy + 3.6, hw * 0.6, 2.7); K.mouth(c, fx, fy + 6, 5, m);
    c.restore();
    var aa = K.armAngles(m, 1.5, 0.7), ay = (top + sh) / 2 + 4;
    for (i = -1; i <= 1; i += 2) { var a = i < 0 ? aa[0] : aa[1], ex = i * (hw - 1) + i * Math.sin(a) * 13, ey = ay + Math.cos(a) * 13; limb(c, i * (hw - 1), ay, ex, ey); glove(c, ex, ey); }
  }, { wide: 0.9, variants: ['blue with gold bands', 'wooden', 'tall with sparkles', 'silver and blue'] });

});
