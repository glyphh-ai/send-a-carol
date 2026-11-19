/* Send a Carol art pack: the farmyard cast (pig, cow, lamb, hen, pony, goat), four of each. Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var HOOF = '#4a3b36', STRAW = '#e8c268', PINK = '#f6b4c0';

  /* ---------- shared farm pieces ---------- */
  /* eyes that still read on a dark face: a pale round behind each */
  function eyesD(c, x, y, dx, r, m) {
    if (frac(m.t * 0.31 + m.ph) < 0.035) { K.eyes(c, x, y, dx, r, m, '#f4ece4'); return; }
    dot(c, x - dx, y, r * 1.6, '#fffaf2'); dot(c, x + dx, y, r * 1.6, '#fffaf2'); K.eyes(c, x, y, dx, r, m);
  }
  function strawHat(c, x, y, w, rot, band) {
    c.save(); c.translate(x, y); c.rotate(rot);
    E(c, 0, 0, w, w * 0.27, STRAW);
    c.beginPath(); c.moveTo(-w * 0.56, -w * 0.03); c.quadraticCurveTo(-w * 0.54, -w * 0.66, 0, -w * 0.66); c.quadraticCurveTo(w * 0.54, -w * 0.66, w * 0.56, -w * 0.03); c.quadraticCurveTo(0, w * 0.12, -w * 0.56, -w * 0.03); c.closePath(); F(c, '#f2d584');
    c.beginPath(); c.moveTo(-w * 0.55, -w * 0.13); c.quadraticCurveTo(0, w * 0.02, w * 0.55, -w * 0.13); c.lineWidth = w * 0.13; c.lineCap = 'butt'; c.strokeStyle = band; c.stroke(); c.lineCap = 'round';
    L(c, -w * 0.2, -w * 0.5, -w * 0.05, -w * 0.3, 0.6, shade(STRAW, -0.2)); L(c, w * 0.15, -w * 0.55, w * 0.25, -w * 0.36, 0.6, shade(STRAW, -0.2));
    L(c, -w * 0.82, 0.5, -w * 0.62, w * 0.12, 0.6, shade(STRAW, -0.2)); L(c, w * 0.66, w * 0.1, w * 0.84, 0, 0.6, shade(STRAW, -0.2));
    c.restore();
  }
  function kerchief(c, y, w, col, spot) {
    Pg(c, [[-w, y + 2.5], [w, y + 2.5], [0, y + w * 1.08]], col); R(c, -w - 0.5, y, w * 2 + 1, 5, 2.5, col);
    dot(c, -w * 0.4, y + w * 0.36, 1, spot); dot(c, w * 0.34, y + w * 0.42, 1, spot); dot(c, 0, y + w * 0.74, 1, spot);
  }
  function bell(c, x, y, s, sw, col) {
    c.save(); c.translate(x, y); c.rotate(sw * 0.4);
    dot(c, 0, s * 1.62, s * 0.4, shade(col, -0.45));
    c.beginPath(); c.moveTo(-s * 1.05, s * 1.5); c.quadraticCurveTo(-s * 0.9, 0, 0, 0); c.quadraticCurveTo(s * 0.9, 0, s * 1.05, s * 1.5); c.closePath(); F(c, col);
    dot(c, -s * 0.3, s * 0.6, s * 0.22, 'rgba(255,255,255,0.75)');
    c.restore();
  }
  function daisy(c, x, y, r, col, rot) { K.flower(c, x, y, r, col, '#ffd23f', rot); }
  /* a stem held in the mouth, with something at its end */
  function sprig(c, x, y, s, m, kind, col) {
    var ex = x + s * 13, ey = y - 3 + m.sw * 1.2 + m.k * 1.5;
    L(c, x, y, ex, ey, 1.2, '#5d9a48');
    if (kind === 'wheat') { for (var i = 0; i < 3; i++) { E(c, ex + s * (1.5 + i * 2.6), ey - 1.6 - i * 0.5, 1.9, 1.2, '#e9bf55', -s * 0.6); E(c, ex + s * (1.5 + i * 2.6), ey + 1.2 - i * 0.5, 1.9, 1.2, '#e9bf55', s * 0.6); } E(c, ex + s * 9.5, ey - 2, 2.2, 1.2, '#e9bf55', -s * 0.2); }
    else { E(c, x + s * 7, ey + 1.4, 2.6, 1.3, '#6fb356', s * 0.5); daisy(c, ex + s * 2, ey - 0.5, 4.4, col, m.t * 0.5); }
  }
  /* patches kept inside an ellipse */
  function inEllipse(c, x, y, rx, ry, fn) { c.save(); c.beginPath(); c.ellipse(x, y, rx - 0.5, ry - 0.5, 0, 0, TAU); c.clip(); fn(); c.restore(); }
  function blob(c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fillStyle = col; c.fill(); }

  /* ---------- pig ---------- */
  Art.add('character', 'pig', function (c, m, p) {
    var v = m.v, T = [['#f8aabb', '#ee8ea5', '#fcd0d9'], ['#fbd5d3', '#f1a5ae', '#fdeae7'], ['#5a4f60', '#f3a3b3', '#6e6274'], ['#de8d4f', '#c96e3a', '#f1b684']][v];
    var sk = T[0], sn = T[1], lt = T[2], limb = v === 2 ? '#f3a3b3' : sk, hf = v === 2 ? '#3b3340' : shade(sk, -0.48), spot = '#5b5360';
    var hx = m.sw * 2.4, hy = -63 + m.k * 2.5, aa = K.armAngles(m, 1.1, 0.75), i;
    c.save(); c.translate(-21, -19); c.rotate(m.sw * 0.3 + Math.sin(m.t * 7) * 0.1); /* curly tail */
    for (i = 0; i < 2; i++) { c.beginPath(); c.moveTo(2, 1); c.bezierCurveTo(-9, 0, -13, -10, -7, -12.5); c.bezierCurveTo(-1, -14, 0.5, -6.5, -5, -7); c.lineWidth = i ? 2.6 : 4.4; c.lineCap = 'round'; c.strokeStyle = i ? sk : shade(sk, -0.34); c.stroke(); }
    c.restore();
    for (i = -1; i <= 1; i += 2) { E(c, i * 11.5, -4.5, 9.5, 5.8, limb); E(c, i * 12.5, -2.3, 6.6, 3, hf); L(c, i * 12.5, -4.6, i * 12.5, -0.6, 0.7, shade(hf, 0.25)); }
    K.arm(c, -21, -46, -1, aa[0], 18, 9.5, limb, hf, 5); K.arm(c, 21, -46, 1, aa[1], 18, 9.5, limb, hf, 5);
    E(c, 0, -30, 25.5, 27, sk);
    inEllipse(c, 0, -30, 25.5, 27, function () {
      if (v === 1) { blob(c, -15, -40, 8, 6.5, spot, 0.4); blob(c, 17, -22, 7, 9, spot, -0.3); blob(c, -12, -9, 7, 4.5, spot); blob(c, 6, -47, 4, 3, spot); }
      if (v === 2) { Rn(c, -30, -53, 60, 15, 0, '#f3a3b3'); }
    });
    if (v !== 3) E(c, 0, -24, 15, 16.5, lt);
    if (v === 0) kerchief(c, -51, 13, p.accent2, p.paper);
    if (v === 3) { /* dungarees */
      var dn = mix(p.accent2, '#3d6fb0', 0.45);
      L(c, -9, -44, -16, -54, 3.6, shade(dn, -0.34)); L(c, 9, -44, 16, -54, 3.6, shade(dn, -0.34)); L(c, -9, -44, -16, -54, 2.4, dn); L(c, 9, -44, 16, -54, 2.4, dn);
      c.beginPath(); c.moveTo(-11, -45); c.lineTo(11, -45); c.lineTo(12, -30); c.quadraticCurveTo(24, -28, 23.5, -14); c.quadraticCurveTo(18, -4.5, 0, -3.6); c.quadraticCurveTo(-18, -4.5, -23.5, -14); c.quadraticCurveTo(-24, -28, -12, -30); c.closePath(); F(c, dn);
      R(c, -6, -39, 12, 8.5, 1.8, shade(dn, 0.16)); L(c, -6, -36.4, 6, -36.4, 0.6, shade(dn, -0.25));
      dot(c, -8.8, -43, 1.5, p.gold); dot(c, 8.8, -43, 1.5, p.gold);
      Rn(c, 10, -16, 7, 6, 1.2, p.accent); L(c, 10.8, -14, 16.2, -14, 0.5, p.paper); /* a patch on the knee */
    }
    for (i = -1; i <= 1; i += 2) { /* ears that flop on the beat */
      c.save(); c.translate(hx + i * 14.5, hy - 12); c.rotate(i * (0.45 + m.k * 0.4));
      c.beginPath(); c.moveTo(-7, 4); c.quadraticCurveTo(-5, -14, 2, -15); c.quadraticCurveTo(10, -7, 7.5, 5); c.closePath(); F(c, v === 2 ? sk : shade(sk, -0.04));
      c.beginPath(); c.moveTo(-3.6, 2.5); c.quadraticCurveTo(-2.4, -9, 1.6, -10.5); c.quadraticCurveTo(5.8, -5, 4.4, 3); c.closePath(); c.fillStyle = sn; c.fill();
      c.restore();
    }
    E(c, hx, hy, 22.5, 18.5, sk);
    if (v === 1) inEllipse(c, hx, hy, 22.5, 18.5, function () { blob(c, hx - 15, hy - 11, 9, 8, spot, 0.5); blob(c, hx + 19, hy + 9, 5, 6, spot); });
    E(c, hx, hy + 5.5, 10.2, 7.3, sn);
    blob(c, hx - 3.5, hy + 5.4, 1.6, 2.5, shade(sn, -0.42)); blob(c, hx + 3.5, hy + 5.4, 1.6, 2.5, shade(sn, -0.42)); dot(c, hx - 5.4, hy + 2.2, 1.5, 'rgba(255,255,255,0.5)');
    if (v === 2) eyesD(c, hx, hy - 4.5, 10.5, 2.4, m); else K.eyes(c, hx, hy - 4.5, 10.5, 2.4, m);
    K.blush(c, hx, hy + 4.5, 16.5, 2.9, v === 2 ? 'rgba(246,150,170,0.5)' : undefined);
    K.mouth(c, hx, hy + 14.2, 4.8, m, shade(sn, -0.55));
    if (v === 1) strawHat(c, hx + 2 + m.sw, hy - 16.5 + m.k * 1.5, 19, 0.1 + m.sw * 0.05, p.accent);
    if (v === 2) { daisy(c, hx + 15, hy - 14, 5.6, p.accent, m.t * 0.4); }
    if (v === 0) { for (i = 0; i < 3; i++) L(c, hx - 2 + i * 2, hy - 18, hx - 3.5 + i * 3.2, hy - 22 - (i === 1 ? 1.5 : 0) - m.k, 0.9, shade(sk, -0.3)); }
  }, { wide: 1.0, variants: ['pink pig in a neckerchief', 'spotted pig in a straw hat', 'saddleback pig with a flower', 'ginger pig in dungarees'] });

  /* ---------- cow ---------- */
  Art.add('character', 'cow', function (c, m, p) {
    var v = m.v, T = [['#fffaf2', '#3d3742', '#f7b6bf'], ['#d39a64', '#b97a48', '#f7e0c4'], ['#cb752f', '#a9591f', '#edba8e'], ['#433d49', '#fffaf2', '#f4adb8']][v];
    var bd = T[0], pt = T[1], mz = T[2], horn = '#f3e6c8', hx = m.sw * 2.2, hy = -66 + m.k * 2.5, aa = K.armAngles(m, 1.0, 0.75), i, j;
    c.save(); c.translate(-20, -18); c.rotate(-0.2 + m.sw * 0.35 + Math.sin(m.t * 2.3) * 0.08); /* tail and its tuft */
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-13, -2, -14, -16); c.lineWidth = 3.8; c.strokeStyle = shade(bd, -0.34); c.stroke(); c.lineWidth = 2.2; c.strokeStyle = bd; c.stroke();
    E(c, -14.5, -20, 3.8, 6, v === 0 ? pt : v === 3 ? bd : shade(bd, -0.25), 0.15); c.restore();
    for (i = -1; i <= 1; i += 2) { E(c, i * 11.5, -4.5, 9.8, 5.8, bd); E(c, i * 12.2, -2.2, 7.2, 3.1, HOOF); L(c, i * 12.2, -4.6, i * 12.2, -0.5, 0.7, '#7a6a62'); }
    K.arm(c, -21, -47, -1, aa[0], 19, 9.5, bd, HOOF, 5.2); K.arm(c, 21, -47, 1, aa[1], 19, 9.5, bd, HOOF, 5.2);
    if (v === 2) for (i = -1; i <= 1; i += 2) for (j = 0; j < 4; j++) E(c, i * (21 - j * 1.5 + (j === 1 ? 3 : 0)), -40 + j * 9, 6, 6.5, bd); /* shaggy sides */
    E(c, 0, -30, 25.5, 27, bd);
    inEllipse(c, 0, -30, 25.5, 27, function () {
      if (v === 0) { blob(c, -17, -42, 11, 9, pt, 0.5); blob(c, 18, -20, 9, 12, pt, -0.2); blob(c, -9, -7, 9, 5.5, pt, 0.2); blob(c, 9, -50, 5, 3.5, pt); }
      if (v === 1) { blob(c, 0, -20, 15, 17, shade(bd, 0.3)); }
      if (v === 2) { for (j = 0; j < 5; j++) { c.beginPath(); c.arc(-12 + j * 6, -24 + (j % 2) * 5, 4.5, 0.15 * PI, 0.85 * PI); c.lineWidth = 0.9; c.strokeStyle = pt; c.stroke(); c.beginPath(); c.arc(-9 + j * 5, -10 + (j % 2) * 3, 4, 0.15 * PI, 0.85 * PI); c.stroke(); } }
      if (v === 3) { Rn(c, -30, -39, 60, 19, 0, pt); }
    });
    if (v === 0 || v === 2) E(c, 0, -5.5, 7.5, 4.2, PINK); /* a hint of udder */
    if (v === 0) { R(c, -13.5, -53.5, 27, 5, 2.5, p.accent); bell(c, 0, -49.5, 4.6, m.sw, p.gold); }
    if (v === 3) { kerchief(c, -53, 13.5, p.accent, p.paper); }
    if (v === 1) { for (j = -2; j <= 2; j++) daisy(c, j * 7, -40.5 - j * j * 1.7, 3.9, j % 2 ? p.accent : p.paper, j); } /* a daisy chain */
    if (v === 2) { R(c, -12, -53, 24, 4.4, 2.2, p.accent2); bell(c, 0, -49.5, 3.6, m.sw, p.gold); }
    for (i = -1; i <= 1; i += 2) { /* horns */
      c.save(); c.translate(hx + i * 10.5, hy - 14); c.rotate(i * (v === 2 ? 0.95 : 0.3)); c.scale(i * (v === 2 ? 1.25 : 1), v === 2 ? 1.9 : 1);
      c.beginPath(); c.moveTo(-3.2, 2); c.quadraticCurveTo(-3.6, -8, 3, -11.5); c.quadraticCurveTo(1.8, -4, 3.6, 2); c.closePath(); F(c, horn); c.restore();
    }
    for (i = -1; i <= 1; i += 2) { /* ears flick on the beat */
      c.save(); c.translate(hx + i * 16.5, hy - 5); c.rotate(i * (0.2 - m.k * 0.45));
      E(c, i * 8, 0, 9.5, 5.2, v === 0 && i > 0 ? pt : bd); blob(c, i * 8.6, 0.5, 6, 2.8, PINK); c.restore();
    }
    E(c, hx, hy, 19.5, 17.5, bd);
    inEllipse(c, hx, hy, 19.5, 17.5, function () {
      if (v === 0) { blob(c, hx - 16, hy - 15.5, 9, 6.5, pt, 0.6); blob(c, hx + 18, hy - 12, 6, 7, pt); }
      if (v === 3) { c.beginPath(); c.moveTo(hx - 2.6, hy - 19); c.quadraticCurveTo(hx - 5.5, hy - 4, hx - 9, hy + 6); c.lineTo(hx + 9, hy + 6); c.quadraticCurveTo(hx + 5.5, hy - 4, hx + 2.6, hy - 19); c.closePath(); c.fillStyle = pt; c.fill(); }
      if (v === 1) { blob(c, hx, hy - 14, 7, 6, shade(bd, 0.22)); }
    });
    E(c, hx, hy + 8.5, 13.8, 8.6, mz);
    blob(c, hx - 5.2, hy + 6.4, 1.8, 2.5, shade(mz, -0.4)); blob(c, hx + 5.2, hy + 6.4, 1.8, 2.5, shade(mz, -0.4)); dot(c, hx - 8.5, hy + 4.5, 1.6, 'rgba(255,255,255,0.5)');
    var ey = v === 2 ? hy - 1.8 : hy - 4;
    if (v === 3) eyesD(c, hx, ey, 9.2, 2.3, m); else K.eyes(c, hx, ey, 8.6, 2.3, m);
    K.blush(c, hx, hy + 1.2, 15.5, 2.6);
    K.mouth(c, hx, hy + 12.2, 4, m, shade(mz, -0.55));
    if (v === 2) { /* the highland fringe, over the brow */
      for (j = -2; j <= 2; j++) E(c, hx + j * 6.4, hy - 12 + Math.abs(j) * 1.6 + m.k * 0.8, 5.4, 7.6, j % 2 ? shade(bd, 0.14) : bd, j * 0.22 + m.sw * 0.05);
      sprig(c, hx + 4, hy + 12.5, 1, m, 'daisy', p.paper);
    }
    if (v === 0) for (j = -1; j <= 1; j++) E(c, hx + j * 3.6, hy - 16.5 - (j ? 0 : 1.5), 3, 3.6, bd); /* a little topknot */
    if (v === 3) for (j = -1; j <= 1; j++) E(c, hx + j * 3.6, hy - 16.5 - (j ? 0 : 1.5), 3, 3.6, pt);
  }, { wide: 1.05, variants: ['black-and-white cow with a bell', 'fawn cow in a daisy chain', 'shaggy highland cow', 'belted cow in a neckerchief'] });

  /* ---------- lamb ---------- */
  function curls(c, x, y, s, col, list) { c.lineWidth = 0.9; c.strokeStyle = col; for (var i = 0; i < list.length; i++) { c.beginPath(); c.arc(x + list[i][0] * s, y + list[i][1] * s, 3.4 * s, PI * (0.9 + list[i][2]), PI * (1.9 + list[i][2])); c.stroke(); } }
  Art.add('character', 'lamb', function (c, m, p) {
    var v = m.v, T = [['#fffdf8', '#fae0d2', '#f0c9b4'], ['#fbf2e0', '#3f3945', '#3f3945'], ['#d2a676', '#f8e6d0', '#8f6642'], ['#5a5564', '#e6ded8', '#3d3843']][v];
    var wl = T[0], fc = T[1], lg = T[2], hf = v === 1 || v === 3 ? '#26222b' : HOOF, hx = m.sw * 2.4, hy = -63 + m.k * 2.8, aa = K.armAngles(m, 1.2, 0.8), i, a;
    var puff = 7.6 + m.k * 0.7;
    E(c, -20 + m.sw * 1.5, -16 - m.k * 2, 5.4, 5.4, wl); /* tail */
    for (i = -1; i <= 1; i += 2) { L(c, i * 8, -17, i * 8.6, -4.5, 7.2, shade(lg, -0.34)); L(c, i * 8, -17, i * 8.6, -4.5, 5.4, lg); E(c, i * 9, -2.6, 5.8, 3.3, hf); }
    var hl = K.arm(c, -15, -43, -1, aa[0], 16, 5.8, lg, hf, 3.5), hr = K.arm(c, 15, -43, 1, aa[1], 16, 5.8, lg, hf, 3.5);
    for (i = 0; i < 11; i++) { a = i / 11 * TAU + 0.3; E(c, Math.cos(a) * 16.5, -32 + Math.sin(a) * 17, puff, puff, wl); }
    blob(c, 0, -32, 18, 18.5, wl);
    curls(c, 0, -32, 1, shade(wl, v === 3 ? 0.16 : -0.12), [[-9, -6, 0], [6, -9, 0.4], [-2, 4, 0.2], [10, 5, -0.3], [-11, 9, 0.5], [2, -2, -0.5], [-4, 13, 0], [9, 13, 0.3]]);
    if (v === 3) { /* a ball of yarn in the left hoof */
      c.beginPath(); c.moveTo(hl[0], hl[1]); c.quadraticCurveTo(hl[0] - 6, hl[1] + 14, -27 + m.sw * 2, -3); c.lineWidth = 0.9; c.strokeStyle = p.accent; c.stroke();
      E(c, hl[0] - 1, hl[1] - 3, 6.4, 6.4, p.accent); c.lineWidth = 0.7; c.strokeStyle = shade(p.accent, 0.4);
      for (i = 0; i < 3; i++) { c.beginPath(); c.ellipse(hl[0] - 1, hl[1] - 3, 5.6, 1.6 + i * 1.6, 0.7 + m.t * 0.3, 0, PI); c.stroke(); }
    }
    for (i = -1; i <= 1; i += 2) { /* ears droop and bounce */
      c.save(); c.translate(hx + i * 12, hy - 2); c.rotate(i * (0.5 - m.k * 0.55));
      E(c, i * 8, 0, 8.4, 4.4, fc); blob(c, i * 8.6, 0.4, 5.2, 2.2, v === 1 ? '#6a6170' : PINK); c.restore();
    }
    if (v === 2) for (i = -1; i <= 1; i += 2) { /* the ram's curled horns */
      E(c, hx + i * 16.5, hy - 4, 8.2, 8.2, '#ead6ac'); c.lineWidth = 1; c.strokeStyle = '#b79a68';
      c.beginPath(); c.arc(hx + i * 16.5, hy - 4, 5, i > 0 ? -PI * 0.6 : -PI * 0.4, i > 0 ? PI * 0.9 : PI * 0.1 + PI, i < 0); c.stroke();
      c.beginPath(); c.arc(hx + i * 17, hy - 3.6, 2.1, 0, TAU); c.stroke();
    }
    E(c, hx, hy, 14.8, 13.8, fc);
    E(c, hx - 8.6, hy - 11, 6.2, 6.2, wl); E(c, hx + 8.6, hy - 11, 6.2, 6.2, wl); E(c, hx, hy - 14.5 - m.k, 8, 7.4, wl); blob(c, hx, hy - 10.6, 9, 4.6, wl);
    curls(c, hx, hy - 13, 0.8, shade(wl, v === 3 ? 0.16 : -0.12), [[-9, 2, 0], [0, -3, 0.3], [9, 2, -0.2]]);
    if (v === 1) eyesD(c, hx, hy - 0.4, 6.6, 2.2, m); else K.eyes(c, hx, hy - 0.4, 6.6, 2.2, m);
    K.blush(c, hx, hy + 4.4, 10.4, 2.3, v === 1 ? 'rgba(246,150,170,0.55)' : undefined);
    Pg(c, [[hx - 2, hy + 3.6], [hx + 2, hy + 3.6], [hx, hy + 5.8]], v === 1 ? '#f3a3b3' : '#ee7f95', true);
    if (m.open > 0.12) K.mouth(c, hx, hy + 7.6, 3.6, m);
    else { L(c, hx, hy + 5.8, hx, hy + 7.4, 0.7, v === 1 ? '#f4ece4' : '#6a4a3a'); c.beginPath(); c.arc(hx, hy + 5.6, 3, 0.2 * PI, 0.8 * PI); c.lineWidth = 0.8; c.strokeStyle = v === 1 ? '#f4ece4' : '#6a4a3a'; c.stroke(); }
    if (v === 0) { K.bow(c, 0, -48.5, 13, p.accent); bell(c, 0, -47, 2.6, m.sw, p.gold); }
    if (v === 1) { for (i = -1; i <= 1; i++) daisy(c, hx + i * 8.4, hy - 16 + Math.abs(i) * 3.4 - m.k, 4.2, i ? p.accent : p.accent2, i + m.t * 0.3); }
    if (v === 2) kerchief(c, -50, 10.5, p.accent2, p.paper);
    if (v === 3) { K.bow(c, hx + 9, hy - 14, 9.5, p.gold); }
    void hr;
  }, { wide: 0.95, variants: ['white lamb with a bow and bell', 'black-faced sheep in a daisy crown', 'caramel ram with curled horns', 'black sheep with a ball of yarn'] });

  /* ---------- hen: hen, rooster, chick, turkey ---------- */
  Art.add('character', 'hen', function (c, m, p) {
    var v = m.v, T = [['#cc743c', '#a85628', '#f5dcb6'], ['#9a3f2a', '#74291c', '#c9653c'], ['#ffd95c', '#f3bd2e', '#fff1ad'], ['#8c5c3d', '#6c4329', '#ab7650']][v];
    var body = T[0], dk = T[1], br = T[2], bk = '#f5a623', lg = '#e8922a', red = '#e23b3f', sc = v === 2 ? 0.74 : v === 1 ? 1.07 : 1;
    var by = v === 2 ? -27 : -31, hr = v === 3 ? 12.5 : v === 2 ? 16.5 : 15.5, hx = m.sw * 2.5, hy = (v === 3 ? -66 : v === 2 ? -53 : -61) + m.k * 2.5, aa = K.armAngles(m, 1.0, 0.85), i, a;
    var head = v === 3 ? '#dc9a86' : body;
    c.save(); c.scale(sc, sc);
    for (i = -1; i <= 1; i += 2) { L(c, i * 7, -10, i * 8, -2.5, 2.6, shade(lg, -0.3)); L(c, i * 8, -2.5, i * 8 - 4.8, -0.8, 2.1, shade(lg, -0.3)); L(c, i * 8, -2.5, i * 8 + 4.8, -0.8, 2.1, shade(lg, -0.3)); L(c, i * 7, -10, i * 8, -2.5, 1.5, lg); L(c, i * 8, -2.5, i * 8 - 4.8, -0.8, 1.1, lg); L(c, i * 8, -2.5, i * 8 + 4.8, -0.8, 1.1, lg); }
    if (v === 0) for (i = 0; i < 3; i++) { c.save(); c.translate(-15, -30); c.rotate(0.75 - i * 0.34 + m.sw * 0.12); E(c, -13, 0, 12, 5.2, i === 1 ? body : dk); c.restore(); }
    if (v === 2) { c.save(); c.translate(-15, -22); c.rotate(0.6 + m.sw * 0.3); E(c, -6, 0, 6.5, 3.6, dk); c.restore(); }
    if (v === 1) { /* the rooster's sickle tail */
      var tc = ['#17454d', p.accent2, '#1e6f6b', p.gold, '#2b8a7e'];
      for (i = 0; i < 5; i++) {
        c.save(); c.translate(-13, -26); c.rotate(-0.5 + i * 0.27 + m.sw * 0.1 + m.k * 0.04 * i);
        c.beginPath(); c.moveTo(1, 3); c.quadraticCurveTo(-8, -44, -36, -31); c.quadraticCurveTo(-15, -30, -5, 2); c.closePath(); F(c, tc[i]); c.restore();
      }
    }
    if (v === 3) { /* the turkey's fan, opening a little on the beat */
      for (i = 0; i < 9; i++) {
        a = (i - 4) * (0.33 + m.k * 0.012) + m.sw * 0.03;
        c.save(); c.translate(0, -27); c.rotate(a);
        E(c, 0, -33, 7.4, 19, i % 2 ? '#b8743c' : '#7d4b2c');
        c.save(); c.beginPath(); c.ellipse(0, -33, 6.9, 18.5, 0, 0, TAU); c.clip(); Rn(c, -9, -54, 18, 9, 0, '#f6e6c4'); Rn(c, -9, -45.5, 18, 4, 0, i % 2 ? p.accent : p.gold); Rn(c, -9, -41, 18, 1.6, 0, '#4a2c1a'); c.restore();
        L(c, 0, -40, 0, -16, 0.6, '#5a3620'); c.restore();
      }
    }
    c.save(); c.translate(-19, by - 9); c.rotate(aa[0]); E(c, 0, 10, 7.2, v === 2 ? 9 : 13.5, dk); if (v !== 2) { L(c, -2, 13, -2, 21, 0.8, shade(dk, -0.2)); L(c, 2, 13, 2, 21, 0.8, shade(dk, -0.2)); } c.restore();
    E(c, 0, by, v === 2 ? 20 : 23.5, v === 2 ? 20 : 23.5, body);
    E(c, 2, by + 5, v === 2 ? 12 : 14.5, v === 2 ? 12.5 : 15.5, br);
    if (v === 0 || v === 3) for (i = -1; i <= 1; i++) for (a = 0; a < 2; a++) { c.beginPath(); c.moveTo(-0.5 + i * 6.5 + a * 3, by + 5 + a * 6 - Math.abs(i) * 2); c.lineTo(1.5 + i * 6.5 + a * 3, by + 7.5 + a * 6 - Math.abs(i) * 2); c.lineTo(3.5 + i * 6.5 + a * 3, by + 5 + a * 6 - Math.abs(i) * 2); c.lineWidth = 0.9; c.strokeStyle = shade(br, -0.2); c.stroke(); }
    if (v === 2) { c.lineWidth = 0.9; c.strokeStyle = shade(br, -0.16); for (i = -1; i <= 1; i++) { c.beginPath(); c.arc(2 + i * 5, by + 6 + Math.abs(i) * -2, 2.4, 0.2 * PI, 0.8 * PI); c.stroke(); } }
    var wa = m.wave ? 2.4 + Math.sin(m.t * 9) * 0.3 : Math.max(0.6, aa[1]);
    c.save(); c.translate(19, by - 9); c.rotate(-wa); E(c, 0, 10, 7.2, v === 2 ? 9 : 13.5, dk); if (v !== 2) { L(c, -2, 13, -2, 21, 0.8, shade(dk, -0.2)); L(c, 2, 13, 2, 21, 0.8, shade(dk, -0.2)); } c.restore();
    if (v === 3) R(c, hx * 0.5 - 6, hy + 4, 12, 16, 5, head); /* neck */
    if (v === 1) for (i = -2; i <= 2; i++) E(c, hx * 0.6 + i * 5.6, -46 - Math.abs(i) * 1.2, 4.6, 8.5, i % 2 ? shade('#f0b23e', -0.1) : '#f0b23e', -i * 0.24); /* golden hackles */
    if (v === 0) { E(c, hx - 5, hy - 12.5, 3.6, 3.8, red); E(c, hx + 5, hy - 12.5, 3.6, 3.8, red); E(c, hx, hy - 15.4 - m.k, 4.4, 4.6, red); }
    if (v === 1) { for (i = -1; i <= 2; i++) E(c, hx - 2 + i * 5, hy - 15 - (i === 0 || i === 1 ? 4 : 0) - m.k * 1.2, 4.4, 6.2, red, i * 0.2); }
    if (v === 2) for (i = -1; i <= 1; i++) { c.save(); c.translate(hx + i * 2, hy - 14); c.rotate(i * 0.5 + m.sw * 0.25); E(c, 0, -4, 2, 5, i ? dk : body); c.restore(); }
    if (v === 0 || v === 1) { var wl = v === 1 ? 6 : 3.4; for (i = -1; i <= 1; i += 2) E(c, hx + i * 2.6 + m.sw * (v === 1 ? 1.2 : 0.5), hy + 8.5 + wl * 0.6, 2.4, wl, red); }
    if (v === 3) { E(c, hx - 1.5 + m.sw, hy + 12, 2.6, 4.6, red); E(c, hx + 2 + m.sw, hy + 13, 2.2, 3.8, shade(red, -0.12)); }
    E(c, hx, hy, hr, hr * 0.93, head);
    if (v !== 3) E(c, hx + 0.8, hy + 5.6, hr * 0.6, hr * 0.44, br);
    K.eyes(c, hx, hy - 2.5, hr * 0.44, v === 2 ? 2.6 : 2.3, m); K.blush(c, hx, hy + 3.4, hr * 0.74, 2.5);
    if (m.open > 0.12) { Pg(c, [[hx - 4, hy + 2.5], [hx + 4, hy + 2.5], [hx, hy + 5.5 + m.open * 5]], '#6a1d2a'); Pg(c, [[hx - 4.8, hy + 1], [hx + 4.8, hy + 1], [hx, hy + 5]], bk); Pg(c, [[hx - 3.6, hy + 6 + m.open * 4], [hx + 3.6, hy + 6 + m.open * 4], [hx, hy + 9.5 + m.open * 5]], shade(bk, -0.12)); }
    else Pg(c, [[hx - 4.8, hy + 1.5], [hx + 4.8, hy + 1.5], [hx, hy + 8.6]], bk);
    if (v === 3) { c.save(); c.translate(hx + 4.6, hy + 0.4); c.rotate(-0.5 - m.sw * 0.3); E(c, 0, 5, 1.9, 6, red); c.restore(); } /* the snood */
    if (v === 2) { /* still wearing a bit of the shell */
      c.save(); c.translate(hx, hy - 8); c.rotate(-0.12 + m.sw * 0.06); c.translate(0, -m.k * 1.5);
      c.beginPath(); c.moveTo(-13.5, 0); c.lineTo(-9, -3.5); c.lineTo(-5, 0.5); c.lineTo(-0.5, -3.5); c.lineTo(4, 0.5); c.lineTo(8.5, -3.5); c.lineTo(13.5, 0); c.quadraticCurveTo(13, -15, 0, -15.5); c.quadraticCurveTo(-13, -15, -13.5, 0); c.closePath(); F(c, '#fffaf0');
      dot(c, -5, -9.5, 1.8, 'rgba(255,255,255,0.9)'); L(c, 4, -12, 6.5, -8, 0.6, '#d8cdb8'); L(c, 6.5, -8, 5, -6, 0.6, '#d8cdb8'); c.restore();
    }
    if (v === 0) { /* a gingham apron bib */
      c.save(); c.beginPath(); c.moveTo(-9, by + 9); c.lineTo(13, by + 9); c.quadraticCurveTo(15, by + 20, 2, by + 22.5); c.quadraticCurveTo(-11, by + 20, -9, by + 9); c.closePath(); F(c, p.paper); c.clip();
      for (i = 0; i < 5; i++) { Rn(c, -10 + i * 6, by + 8, 2.6, 16, 0, alpha(p.accent, 0.55)); Rn(c, -12, by + 10 + i * 4.6, 28, 2, 0, alpha(p.accent, 0.4)); } c.restore();
    }
    c.restore();
  }, { wide: 1.0, variants: ['hen', 'rooster', 'chick', 'turkey'] });

  /* ---------- pony ---------- */
  Art.add('character', 'pony', function (c, m, p) {
    var v = m.v, T = [['#bb6c3d', '#5c3421', '#ecccac'], ['#c4c9d3', '#4d5160', '#eef0f4'], ['#edc26c', '#fff6e0', '#f9e6bc'], ['#fffaf2', '#2f2a2e', '#f4cbc6']][v];
    var ct = T[0], mn = T[1], mz = T[2], pt = '#5a4038', hf = v === 2 ? '#8a6a3a' : HOOF, hx = m.sw * 2.4, hy = -63 + m.k * 2.5, aa = K.armAngles(m, 1.15, 0.8), i, j;
    var sway = m.sw * 0.3 + Math.sin(m.t * 2.2) * 0.07;
    c.save(); c.translate(-16, -22); c.rotate(sway); /* a long tail that swishes */
    c.beginPath(); c.moveTo(1, -2); c.bezierCurveTo(-17, -10, -25, 6, -17, 22); c.bezierCurveTo(-15, 12, -9, 9, -6, 15); c.bezierCurveTo(-6, 6, -1, 5, 1, -2); c.closePath(); F(c, mn);
    c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(-15, 2, -14, 14); c.lineWidth = 0.8; c.strokeStyle = shade(mn, v === 2 ? -0.14 : 0.2); c.stroke(); c.restore();
    for (i = -1; i <= 1; i += 2) { E(c, i * 10.5, -5, 8.6, 6, ct); E(c, i * 11, -2.4, 7, 3.2, hf); if (v === 1 || v === 3) blob(c, i * 10.5, -6.6, 6.8, 2.4, v === 3 ? pt : '#fff'); }
    K.arm(c, -18, -46, -1, aa[0], 18.5, 8.4, ct, hf, 4.8); K.arm(c, 18, -46, 1, aa[1], 18.5, 8.4, ct, hf, 4.8);
    E(c, 0, -30, 21.5, 26, ct);
    inEllipse(c, 0, -30, 21.5, 26, function () {
      if (v !== 3) blob(c, 0, -22, 12.5, 15.5, shade(ct, 0.2));
      if (v === 1) { var D = [[-13, -40, 2.6], [-15, -28, 2], [-11, -16, 2.6], [13, -38, 2.2], [15, -25, 2.8], [11, -13, 2], [-5, -47, 1.8], [6, -8, 2.2]]; for (j = 0; j < D.length; j++) dot(c, D[j][0], D[j][1], D[j][2], 'rgba(255,255,255,0.75)'); }
      if (v === 3) { blob(c, -15, -40, 10, 9, pt, 0.4); blob(c, 16, -17, 9, 12, pt, -0.3); blob(c, -6, -6, 8, 4.5, pt); }
    });
    if (v === 0) { /* a first-prize rosette */
      Pg(c, [[5, -37], [9, -36], [8, -24], [6, -27], [3.5, -25]], p.accent2); Pg(c, [[9, -37], [13, -37], [15, -25.5], [12, -28], [10, -24.5]], p.accent2);
      for (j = 0; j < 8; j++) E(c, 9 + Math.cos(j / 8 * TAU) * 4.6, -40 + Math.sin(j / 8 * TAU) * 4.6, 2.6, 2.6, p.accent);
      E(c, 9, -40, 3.8, 3.8, p.gold); dot(c, 8, -41, 1.1, 'rgba(255,255,255,0.8)');
    }
    if (v === 1) for (j = -2; j <= 2; j++) daisy(c, j * 6, -50.5 - Math.abs(j) * 1.6, 3.5, j % 2 ? p.paper : p.accent, j);
    if (v === 2) kerchief(c, -52, 12, p.accent2, p.paper);
    if (v === 3) { c.beginPath(); c.moveTo(-10, -53); c.quadraticCurveTo(0, -42, 10, -53); c.lineWidth = 0.9; c.strokeStyle = '#7a5a3a'; c.stroke(); c.beginPath(); c.arc(m.sw, -40.5, 3.6, 0.15 * PI, 0.85 * PI, true); c.lineWidth = 3.2; c.lineCap = 'butt'; c.strokeStyle = shade(p.gold, -0.34); c.stroke(); c.lineWidth = 1.9; c.strokeStyle = p.gold; c.stroke(); c.lineCap = 'round'; }
    /* the mane behind the head */
    if (v === 0) { c.save(); c.translate(hx + 13, hy - 6); c.rotate(-0.15 + sway * 0.4); E(c, 4, 4, 7, 12, mn); E(c, 5, 15, 5.6, 9, mn); blob(c, 3, 6, 5, 12, mn); c.restore(); }
    if (v === 1 || v === 2) for (i = -1; i <= 1; i += 2) { c.save(); c.translate(hx + i * 14, hy - 8); c.rotate(i * -0.12 + sway * 0.35); E(c, i * 3, 5, 6.6, 11, mn); E(c, i * 5, 16, 5.6, 9.5, mn); if (v === 2) E(c, i * 4, 27, 4.6, 7.5, mn); blob(c, i * 3, 9, 5, 14, mn); c.restore(); }
    if (v === 3) for (j = -2; j <= 2; j++) Pg(c, [[hx + j * 4 - 3.4, hy - 15], [hx + j * 4.6 + m.sw * 1.5, hy - 28 + Math.abs(j) * 2.4 - m.k * 2], [hx + j * 4 + 3.4, hy - 15]], mn);
    for (i = -1; i <= 1; i += 2) { /* ears */
      var tipx = hx + i * 11.5, tipy = hy - 30 - m.k * 2;
      c.beginPath(); c.moveTo(hx + i * 5.5, hy - 14); c.quadraticCurveTo(hx + i * 6.5, hy - 26, tipx, tipy); c.quadraticCurveTo(hx + i * 16.5, hy - 22, hx + i * 15.5, hy - 11); c.closePath(); F(c, v === 3 && i > 0 ? pt : ct);
      c.beginPath(); c.moveTo(hx + i * 8.6, hy - 15); c.quadraticCurveTo(hx + i * 9, hy - 23, tipx - i * 0.4, tipy + 3.6); c.quadraticCurveTo(hx + i * 13.8, hy - 21, hx + i * 13.2, hy - 14); c.closePath(); c.fillStyle = PINK; c.fill();
    }
    E(c, hx, hy - 3, 16.5, 16, ct);
    inEllipse(c, hx, hy - 3, 16.5, 16, function () {
      if (v === 0) { c.beginPath(); c.moveTo(hx - 2.2, hy - 20); c.quadraticCurveTo(hx - 4.6, hy - 6, hx - 3, hy + 6); c.lineTo(hx + 3, hy + 6); c.quadraticCurveTo(hx + 4.6, hy - 6, hx + 2.2, hy - 20); c.closePath(); c.fillStyle = '#fff5e6'; c.fill(); }
      if (v === 3) { blob(c, hx + 13, hy - 12, 9.5, 9, pt, 0.3); }
      if (v === 1) { dot(c, hx - 11, hy - 10, 1.8, 'rgba(255,255,255,0.75)'); dot(c, hx + 12, hy - 8, 1.6, 'rgba(255,255,255,0.75)'); dot(c, hx - 13.5, hy - 3, 1.3, 'rgba(255,255,255,0.75)'); }
    });
    if (v === 2) K.twinkle(c, hx, hy - 9.5, 4.4, '#fffdf4');
    E(c, hx, hy + 8.6, 12.6, 9, mz);
    blob(c, hx - 4.6, hy + 7, 1.7, 2.4, shade(mz, -0.42)); blob(c, hx + 4.6, hy + 7, 1.7, 2.4, shade(mz, -0.42)); dot(c, hx - 7.6, hy + 4.4, 1.5, 'rgba(255,255,255,0.5)');
    K.eyes(c, hx, hy - 3.6, 8.8, 2.4, m); K.blush(c, hx, hy + 1.6, 14.2, 2.5);
    K.mouth(c, hx, hy + 12.6, 3.7, m, shade(mz, -0.55));
    /* the forelock */
    if (v === 0) { c.save(); c.translate(hx, hy - 17); c.rotate(m.sw * 0.08); E(c, -3, -1.5, 5.4, 4, mn, -0.3); E(c, 4, 2, 7.6, 4.6, mn, 0.5); blob(c, 0, 0, 5, 3.4, mn, 0.3); c.restore(); }
    if (v === 1) { for (i = -1; i <= 1; i += 2) E(c, hx + i * 4.6, hy - 17.5, 6.2, 3.8, mn, i * 0.45 + m.sw * 0.06); blob(c, hx, hy - 19, 4, 2.6, mn); daisy(c, hx + 11, hy - 16.5, 4.6, p.accent, m.t * 0.4); }
    if (v === 2) { E(c, hx - 6, hy - 17.5, 6, 4.4, mn, -0.4); E(c, hx + 6, hy - 17.5, 6, 4.4, mn, 0.4); E(c, hx, hy - 19.5 - m.k, 6.6, 5.2, mn); blob(c, hx, hy - 16.5, 8, 2.8, mn); }
  }, { wide: 1.0, variants: ['chestnut pony with a rosette', 'dapple-grey pony in daisies', 'palomino pony in a neckerchief', 'pinto pony with a spiky mane'] });

  /* ---------- goat ---------- */
  Art.add('character', 'goat', function (c, m, p) {
    var v = m.v, T = [['#fbf6ea', '#e9dfcc', '#f7cdc8', '#cdb794'], ['#c08c5d', '#7c5438', '#f5dfc6', '#d9c6a2'], ['#48424f', '#fffaf2', '#ece2da', '#dccba8'], ['#a5aab3', '#6c707b', '#f0f1f4', '#c2b190']][v];
    var ct = T[0], mk = T[1], mz = T[2], hn = T[3], lg = v === 1 ? mk : v === 3 ? mk : ct, hf = v === 2 ? '#25212a' : HOOF, sc = v === 1 ? 0.84 : 1;
    var hx = m.sw * 2.4, hy = -64 + m.k * 2.6, aa = K.armAngles(m, 1.2, 0.8), i, j, brd = v === 2 ? mk : v === 3 ? '#e4e6ea' : shade(ct, -0.06);
    c.save(); c.scale(sc, sc);
    c.save(); c.translate(-16, -20); c.rotate(-0.7 + Math.sin(m.t * 12) * 0.25 + m.sw * 0.2); E(c, 0, -6, 3.6, 7.4, v === 2 ? mk : ct); c.restore(); /* a tail that flicks */
    for (i = -1; i <= 1; i += 2) { L(c, i * 7.6, -17, i * 8.4, -4.5, 7.4, shade(lg, -0.34)); L(c, i * 7.6, -17, i * 8.4, -4.5, 5.6, lg); E(c, i * 8.8, -2.6, 5.8, 3.3, hf); L(c, i * 8.8, -4.8, i * 8.8, -0.8, 0.6, '#8a7a72'); }
    K.arm(c, -14.5, -44, -1, aa[0], 17, 6.2, lg, hf, 3.7); K.arm(c, 14.5, -44, 1, aa[1], 17, 6.2, lg, hf, 3.7);
    E(c, 0, -30, 19, 24, ct);
    inEllipse(c, 0, -30, 19, 24, function () {
      if (v === 0 || v === 1) blob(c, 0, -22, 11, 14, v === 1 ? mz : '#ffffff');
      if (v === 2) Rn(c, -22, -24, 44, 22, 0, mk);
      if (v === 3) blob(c, 0, -22, 11, 15, mz);
    });
    if (v === 2 || v === 3) Pg(c, [[-8, -47], [8, -47], [6.4, -37.5], [3.2, -41], [0, -34.5 + m.k], [-3.2, -41], [-6.4, -37.5]], v === 2 ? shade(ct, 0.14) : mz); /* a shaggy chest */
    if (v === 0) R(c, -12, -52.5, 24, 4.8, 2.4, p.accent);
    if (v === 2) kerchief(c, -53, 10.5, p.accent, p.paper);
    if (v === 1) { K.bow(c, 0, -50, 11, p.accent2); }
    c.beginPath(); c.moveTo(hx - 4.4, hy + 13.5); c.quadraticCurveTo(hx - 3 + m.sw * 3, hy + 25, hx + m.sw * 4.5, hy + (v === 1 ? 20 : v === 0 ? 24 : 30) + m.k * 2); c.quadraticCurveTo(hx + 3 + m.sw * 3, hy + 25, hx + 4.4, hy + 13.5); c.closePath(); if (v !== 1) F(c, brd); /* the beard wags */
    for (i = -1; i <= 1; i += 2) { /* horns */
      if (v === 1) { E(c, hx + i * 6.5, hy - 17.5, 2.6, 4, hn, i * 0.3); continue; }
      if (v === 3) { /* big swept-back curls */
        for (j = 0; j < 2; j++) { c.beginPath(); c.arc(hx + i * 13.5, hy - 17, 10.5, i > 0 ? PI * 1.05 : PI * 1.95, i > 0 ? PI * 0.2 : PI * 0.8, i < 0); c.lineWidth = j ? 4.6 : 6.4; c.lineCap = 'round'; c.strokeStyle = j ? hn : shade(hn, -0.34); c.stroke(); }
        for (j = 0; j < 5; j++) { var ra = (i > 0 ? PI * 1.15 + j * 0.42 : PI * 1.85 - j * 0.42); L(c, hx + i * 13.5 + Math.cos(ra) * 8.6, hy - 17 + Math.sin(ra) * 8.6, hx + i * 13.5 + Math.cos(ra) * 12.4, hy - 17 + Math.sin(ra) * 12.4, 0.7, shade(hn, -0.3)); }
        continue;
      }
      c.save(); c.translate(hx + i * 7.5, hy - 15.5); c.rotate(i * (v === 2 ? 0.5 : 0.22)); c.scale(i, v === 2 ? 2.1 : 1.35);
      c.beginPath(); c.moveTo(-3, 2); c.quadraticCurveTo(-3.4, -8, 3.4, -11.5); c.quadraticCurveTo(1.6, -4, 3.2, 2); c.closePath(); F(c, hn);
      c.lineWidth = 0.5; c.strokeStyle = shade(hn, -0.3); for (j = 0; j < 3; j++) { c.beginPath(); c.moveTo(-2.8 + j * 0.6, -1 - j * 2.6); c.lineTo(2.4 + j * 0.2, -1.6 - j * 2.6); c.stroke(); }
      c.restore();
    }
    for (i = -1; i <= 1; i += 2) { /* sideways ears */
      c.save(); c.translate(hx + i * 13.5, hy - 7); c.rotate(i * (0.18 - m.k * 0.5 + (v === 1 ? 0.3 : 0)));
      E(c, i * 8.5, 0, v === 1 ? 10.5 : 9.4, 4.4, v === 3 ? mk : ct); blob(c, i * 9, 0.4, 6, 2.2, PINK); c.restore();
    }
    c.beginPath(); c.moveTo(hx - 16, hy - 6); c.quadraticCurveTo(hx - 15.5, hy - 18.5, hx, hy - 18.5); c.quadraticCurveTo(hx + 15.5, hy - 18.5, hx + 16, hy - 6); c.quadraticCurveTo(hx + 13.5, hy + 9, hx + 8.5, hy + 14.5); c.quadraticCurveTo(hx, hy + 19, hx - 8.5, hy + 14.5); c.quadraticCurveTo(hx - 13.5, hy + 9, hx - 16, hy - 6); c.closePath(); F(c, ct);
    c.save(); c.clip();
    if (v === 2) { for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(hx + i * 5, hy - 19); c.quadraticCurveTo(hx + i * 11.5, hy - 6, hx + i * 6, hy + 8); c.lineTo(hx + i * 11.5, hy + 8); c.quadraticCurveTo(hx + i * 16, hy - 6, hx + i * 9.5, hy - 19); c.closePath(); c.fillStyle = mk; c.fill(); } }
    if (v === 3 || v === 1) { c.beginPath(); c.moveTo(hx - 3.6, hy - 19); c.quadraticCurveTo(hx - 2.6, hy - 8, hx, hy + 1); c.quadraticCurveTo(hx + 2.6, hy - 8, hx + 3.6, hy - 19); c.closePath(); c.fillStyle = mk; c.fill(); }
    c.restore();
    E(c, hx, hy + 10.4, 8.8, 6.6, mz);
    Pg(c, [[hx - 2.6, hy + 6.8], [hx + 2.6, hy + 6.8], [hx, hy + 9.6]], v === 2 ? '#5a4f5c' : '#e98a9a', true);
    K.eyes(c, hx, hy - 3, v === 2 ? 8 : 7.6, 2.3, m);
    K.blush(c, hx, hy + 3.4, 12.2, 2.4, v === 2 ? 'rgba(246,150,170,0.5)' : undefined);
    K.mouth(c, hx, hy + 12.6, 3.2, m, shade(mz, -0.55));
    if (v === 1) { for (j = -1; j <= 1; j++) E(c, hx + j * 3, hy - 17.5 - (j ? 0 : 1.4) - m.k, 2.8, 3.6, ct); sprig(c, hx + 3, hy + 13, 1, m, 'daisy', p.paper); }
    if (v === 0) { for (j = -1; j <= 1; j++) E(c, hx + j * 3.2, hy - 17 - (j ? 0 : 1.6) - m.k, 3, 3.8, ct); bell(c, -9.5, -48.5, 3.9, m.sw, p.gold); }
    if (v === 3) sprig(c, hx + 3, hy + 13, 1, m, 'wheat');
    c.restore();
  }, { wide: 0.95, variants: ['white nanny goat with a bell', 'brown kid with a daisy', 'black-and-white billy goat', 'grey mountain goat with big horns'] });

  void clamp; void rnd; void R;
});
