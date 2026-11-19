/* Send a Carol art pack: everyday people, set B (kid, grad, newlywed, medic, teacher, dancer, hiker, traveler).
   Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var SKIN = ['#f6cfa8', '#b9774a', '#e3ac7c', '#7c4a2d'], HAIR = ['#6a3d22', '#221a18', '#d49a3a', '#2a1c16', '#a0452a', '#c9c4bc'];
  var INK = '#2b2118';

  /* ---------- the shared person: legs, body, arms, head, hair; the caller adds the dress and what is held ---------- */
  function hairB(c, hx, hy, r, col, st, m) { /* the hair that sits behind the head */
    var s;
    if (st === 'long') { c.beginPath(); c.moveTo(hx - r * 1.16, hy + r * 1.0); c.quadraticCurveTo(hx - r * 1.34, hy - r * 1.25, hx, hy - r * 1.15); c.quadraticCurveTo(hx + r * 1.34, hy - r * 1.25, hx + r * 1.16, hy + r * 1.0); c.quadraticCurveTo(hx + r * 0.6, hy + r * 1.22, hx + r * 0.5, hy + r * 0.6); c.lineTo(hx - r * 0.5, hy + r * 0.6); c.quadraticCurveTo(hx - r * 0.6, hy + r * 1.22, hx - r * 1.16, hy + r * 1.0); c.closePath(); F(c, col); }
    else if (st === 'afro') E(c, hx, hy - r * 0.28, r * 1.42, r * 1.3, col);
    else if (st === 'pig') for (s = -1; s <= 1; s += 2) { c.save(); c.translate(hx + s * r * 1.02, hy - r * 0.25); c.rotate(-s * 0.45 + m.sw * 0.3); E(c, 0, r * 0.55, r * 0.34, r * 0.62, col); c.restore(); }
    else if (st === 'pony') { c.save(); c.translate(hx - r * 0.85, hy - r * 0.55); c.rotate(0.55 + m.sw * 0.3); E(c, 0, r * 0.75, r * 0.36, r * 0.85, col); c.restore(); }
    else if (st === 'puffs') for (s = -1; s <= 1; s += 2) E(c, hx + s * r * 0.92, hy - r * 0.92 - m.k, r * 0.5, r * 0.5, col);
  }
  function hairF(c, hx, hy, r, col, st, m) { /* the hair in front: fringe, curls, bun */
    var s;
    if (st === 'curly') K.hairdo(c, hx, hy, r, col, 1);
    else if (st === 'bun') K.hairdo(c, hx, hy, r, col, 3);
    else if (st === 'afro' || st === 'puffs' || st === 'crop') { c.beginPath(); c.arc(hx, hy - r * 0.12, r * 1.02, PI * 1.03, PI * 1.97); c.quadraticCurveTo(hx, hy - r * (st === 'crop' ? 0.98 : 0.72), hx - r * 1.02, hy - r * 0.2); c.closePath(); F(c, col); }
    else if (st === 'bald') for (s = -1; s <= 1; s += 2) E(c, hx + s * r * 0.96, hy - r * 0.3, r * 0.24, r * 0.42, col);
    else if (st !== 'none') K.hairdo(c, hx, hy, r, col, 0);
    if (st === 'pig') for (s = -1; s <= 1; s += 2) dot(c, hx + s * r * 0.98, hy - r * 0.3, r * 0.14, '#ff8ad0');
  }
  function person(c, m, o) {
    var r = o.r || 12.5, top = o.top || -57, hy = (o.hy || -69) + m.k * 2, hx = m.sw * 2, sw = o.sw || 13, hem = o.hem || -24, hemW = o.hemW || 15.5, skx = o.skx || 0, i;
    var al = o.armLen || 17, aw = o.armW || 6.5, sl = o.sleeve || o.col, lw = o.legW || 7, fx = o.feet || 7;
    if (o.back) o.back(hx, hy);
    if (!o.noLegs) for (i = -1; i <= 1; i += 2) {
      var lx = i * (fx - 0.5), kx = o.kick && i === (m.sw > 0 ? 1 : -1) ? i * o.kick * Math.abs(m.sw) : 0;
      L(c, i * (fx - 1.5), hem - 3, lx + kx, -6, lw + 1.7, shade(o.legs, -0.34)); L(c, i * (fx - 1.5), hem - 3, lx + kx, -6, lw, o.legs);
      if (o.shorts) { var mx = i * (fx - 1.5) + (lx + kx - i * (fx - 1.5)) * 0.42, my = hem - 3 + (hem * -1 - 3) * 0.42; L(c, i * (fx - 1.5), hem - 3, mx, my, lw + 3.6, shade(o.shorts, -0.34)); L(c, i * (fx - 1.5), hem - 3, mx, my, lw + 2, o.shorts); }
      if (o.flare) Pg(c, [[lx + kx - 3.6, -16], [lx + kx + 3.6, -16], [lx + kx + 7.5, -5], [lx + kx - 7.5, -5]], o.legs);
      if (o.sock) Rn(c, lx + kx - lw / 2, -11.5, lw, 4, 1, o.sock);
      R(c, lx + kx + i * 1.5 - 6.5, -8 - Math.abs(kx) * 0.25, 13, 8, 3.5, o.shoe || '#4a3526');
    }
    c.beginPath(); c.moveTo(-sw + 4, top); c.quadraticCurveTo(-sw - 1, top, -sw - 1.5, top + 6); c.quadraticCurveTo(-sw - 3, (top + hem) / 2, -hemW + skx, hem);
    c.quadraticCurveTo(skx, hem + (o.sag == null ? 4 : o.sag), hemW + skx, hem); c.quadraticCurveTo(sw + 3, (top + hem) / 2, sw + 1.5, top + 6); c.quadraticCurveTo(sw + 1, top, sw - 4, top); c.closePath(); F(c, o.col);
    if (o.deco) o.deco(hx, hy);
    var aa = K.armAngles(m, o.base == null ? 0.9 : o.base, o.amp == null ? 0.6 : o.amp);
    var aL = o.aL != null ? o.aL : aa[0], aR = m.wave || o.aR == null ? aa[1] : o.aR;
    var hl = K.arm(c, -sw - 0.5, top + 5.5, -1, aL, al, aw, o.bare ? o.sk : sl, o.sk, aw * 0.56), hr;
    var right = function () { hr = K.arm(c, sw + 0.5, top + 5.5, 1, aR, al, aw, o.bare ? o.sk : sl, o.sk, aw * 0.56); if (o.bare) K.arm(c, sw + 0.5, top + 5.5, 1, aR, al * 0.36, aw + 1, sl); };
    if (o.bare) K.arm(c, -sw - 0.5, top + 5.5, -1, aL, al * 0.36, aw + 1, sl);
    if (!m.wave) right(); /* a waving hand goes in front of the head and the hat */
    if (o.hs) hairB(c, hx, hy, r, o.hair, o.hs, m);
    K.head(c, hx, hy, r, o.sk, m);
    if (o.hs) hairF(c, hx, hy, r, o.hair, o.hs, m);
    if (o.specs) { for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(hx + i * r * 0.42, hy + r * 0.05, r * 0.3, 0, TAU); c.lineWidth = 0.9; c.strokeStyle = o.specs; c.stroke(); } L(c, hx - r * 0.12, hy + r * 0.03, hx + r * 0.12, hy + r * 0.03, 0.8, o.specs); }
    if (o.hat) o.hat(hx, hy, r);
    if (m.wave) right();
    return { hx: hx, hy: hy, l: hl, r: hr, aL: aL, aR: aR };
  }

  /* ---------- little things people hold ---------- */
  function balloon(c, x0, y0, x, y, r, col, heart) {
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + (x - x0) * 0.2, (y0 + y) / 2, x, y + r * 1.15); c.lineWidth = 0.7; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke();
    if (heart) { K.heartPath(c, x, y, r * 2.1); F(c, col); } else { E(c, x, y, r, r * 1.16, col); Pg(c, [[x - 1.6, y + r * 1.14], [x + 1.6, y + r * 1.14], [x, y + r * 1.14 + 2.6]], col); }
    K.shine(c, x - r * 0.38, y - r * 0.45, r * 0.26);
  }
  function teddy(c, x, y, s) {
    var b = '#c8935a', cr = '#f3dcb8';
    c.save(); c.translate(x, y); c.scale(s, s);
    E(c, -4, 7, 2.6, 2.2, b); E(c, 4, 7, 2.6, 2.2, b); E(c, -5.5, 0, 2, 2.6, b); E(c, 5.5, 0, 2, 2.6, b);
    E(c, 0, 2, 5, 5.6, b); E(c, 0, 3, 2.8, 3.2, cr); E(c, -4, -9.5, 2.1, 2.1, b); E(c, 4, -9.5, 2.1, 2.1, b); E(c, 0, -6, 5.2, 4.8, b); E(c, 0, -4.6, 2.3, 1.8, cr);
    dot(c, -2, -7, 0.7, INK); dot(c, 2, -7, 0.7, INK); dot(c, 0, -5.2, 0.8, INK);
    c.restore();
  }
  function bouquet(c, x, y, rot, cols, t) {
    c.save(); c.translate(x, y); c.rotate(rot);
    Pg(c, [[-2.2, 9], [2.2, 9], [5.5, -2], [-5.5, -2]], '#fdfaf2'); L(c, -3.2, 3.5, 3.2, 3.5, 1.4, cols[0]);
    K.leaf(c, -3, -3, 8, -2.6, '#3f9a5c'); K.leaf(c, 3, -3, 8, -0.55, '#57b36f');
    K.flower(c, -4.6, -5.5, 4, cols[1], '#ffd54a', 0.4); K.flower(c, 4.6, -5.5, 4, cols[2], '#ffd54a', 1.1); K.flower(c, 0, -9.5, 4.6, cols[0], '#ffd54a', t || 0);
    c.restore();
  }
  function scroll(c, x, y, rot, rib) { c.save(); c.translate(x, y); c.rotate(rot); R(c, -8.5, -2.6, 17, 5.2, 2.4, '#fffdf4'); E(c, -8.5, 0, 1.3, 2.6, '#efe6d2'); E(c, 8.5, 0, 1.3, 2.6, '#efe6d2'); R(c, -1.6, -3.1, 3.2, 6.2, 1, rib); Pg(c, [[-1.4, 3], [-3, 7.5], [-0.4, 6], [0.6, 8], [1.6, 3]], rib); c.restore(); }
  function clipboard(c, x, y, rot, col) { c.save(); c.translate(x, y); c.rotate(rot); R(c, -6.5, -8.5, 13, 17, 1.6, '#a9703f'); Rn(c, -5.2, -6.6, 10.4, 14, 0.8, '#fffdf4'); R(c, -2.8, -10, 5.6, 3, 1, '#9aa3b1'); for (var i = 0; i < 4; i++) L(c, -3.6, -3.6 + i * 2.8, i === 3 ? 0.5 : 3.6, -3.6 + i * 2.8, 0.6, i === 0 ? col : '#b3aa9c'); c.restore(); }

  /* ---------- kid: four children ---------- */
  Art.add('character', 'kid', function (c, m, p) {
    var v = m.v, sk = SKIN[v], col = [p.accent, p.accent2, '#4a6fa5', '#7a5bd0'][v], i;
    c.scale(1.14, 1.14); /* a child is small, but not lost beside the grown-ups (the dispatcher restores) */
    var q = person(c, m, {
      r: 15.5, hy: -57, top: -42, sw: 10.5, hem: v === 1 ? -15 : -19, hemW: v === 1 ? 17 : 12.5, skx: v === 1 ? m.sw * 2 : 0, armLen: 14, armW: 5.6, legW: v === 1 ? 4.6 : 6.2, feet: 6,
      sk: sk, hair: HAIR[[0, 4, 2, 1][v]], hs: ['short', 'pig', 'curly', 'puffs'][v], col: col, sleeve: v === 2 ? p.gold : col, bare: v !== 3,
      legs: v === 1 ? sk : v === 0 ? '#4a6fa5' : v === 2 ? '#4a6fa5' : '#56617f', shoe: [p.gold, p.accent, '#c8323c', '#f4f1ea'][v],
      aL: v === 0 || v === 3 ? 1.5 + m.k * 0.25 : null, base: 1.0, amp: 0.75,
      deco: function () {
        c.save(); c.clip();
        if (v === 0) for (i = 0; i < 5; i++) Rn(c, -16, -40 + i * 5.2, 32, 2.4, 0, p.paper);
        if (v === 1) { for (i = 0; i < 9; i++) dot(c, -12 + (i % 5) * 6 + (i > 4 ? 3 : 0) + m.sw * 1.2, i > 4 ? -20 : -26, 1.1, p.paper); Rn(c, -20, -19.5, 40, 2, 0, shade(col, 0.3)); }
        if (v === 2) { Rn(c, -16, -44, 32, 10, 0, p.gold); Rn(c, -8, -44, 2.6, 12, 0, col); Rn(c, 5.4, -44, 2.6, 12, 0, col); R(c, -4.5, -32, 9, 6.5, 1.5, shade(col, 0.16)); dot(c, -6.7, -33.5, 1.1, p.gold); dot(c, 6.7, -33.5, 1.1, p.gold); }
        if (v === 3) { R(c, -7, -29, 14, 7, 3, shade(col, -0.14)); L(c, -2.5, -41, -3, -34, 0.8, p.paper); L(c, 2.5, -41, 3, -34, 0.8, p.paper); }
        c.restore();
        if (v === 1) R(c, -6, -43.5, 12, 3.6, 1.8, p.paper);
        if (v === 3) { c.beginPath(); c.arc(0, -42, 8.5, 0.1 * PI, 0.9 * PI); c.lineWidth = 3.4; c.strokeStyle = shade(col, -0.2); c.stroke(); }
      }
    });
    var hx = q.l[0], hy = q.l[1];
    if (v === 0) balloon(c, hx, hy, hx - 4 + m.sw * 4, hy - 34 - m.k * 2, 9, p.gold);
    if (v === 1) teddy(c, hx - 2, hy + 3 - m.k, 1);
    if (v === 2) { /* pinwheel */
      L(c, hx, hy + 3, hx - 3, hy - 19, 1.3, '#f4f1ea'); c.save(); c.translate(hx - 3, hy - 19); c.rotate(m.t * 4);
      for (i = 0; i < 4; i++) { c.rotate(TAU / 4); Pg(c, [[0, 0], [8.5, -1], [4.5, -6]], i % 2 ? p.accent : p.accent2); }
      c.restore(); dot(c, hx - 3, hy - 19, 1.3, p.gold);
    }
    if (v === 3) { /* swirl lollipop */
      L(c, hx, hy + 2, hx - 2, hy - 13, 1.3, '#f4f1ea'); E(c, hx - 2.4, hy - 16, 6, 6, p.paper);
      c.beginPath(); for (i = 0; i < 26; i++) { var a = i * 0.5 + m.t * 2, rr = i * 0.21; c.lineTo(hx - 2.4 + Math.cos(a) * rr, hy - 16 + Math.sin(a) * rr); } c.lineWidth = 1.5; c.strokeStyle = p.accent; c.stroke();
    }
  }, { wide: 0.85, variants: ['striped tee and balloon', 'dotted dress and teddy', 'overalls and pinwheel', 'hoodie and lollipop'] });

  /* ---------- grad: four graduates in cap and gown ---------- */
  function mortar(c, x, y, rot, col, tas, sw) {
    c.save(); c.translate(x, y); c.rotate(rot);
    R(c, -9.5, -4, 19, 7.5, 2.5, shade(col, -0.12)); Pg(c, [[-18, -5], [0, -11.5], [18, -5], [0, 1.5]], col); dot(c, 0, -5, 1.4, tas);
    c.beginPath(); c.moveTo(0, -5); c.lineTo(12.5, -3.2); c.lineTo(13.5 + sw * 3, 7); c.lineWidth = 1; c.strokeStyle = tas; c.stroke(); R(c, 12 + sw * 3, 6, 3, 5.5, 1, tas);
    c.restore();
  }
  Art.add('character', 'grad', function (c, m, p) {
    var v = m.v, sk = SKIN[(v + 1) % 4], col = [p.accent, '#2f4f86', p.accent2, '#5a3470'][v], stole = [p.gold, p.paper, p.gold, p.accent2][v], i;
    var q = person(c, m, {
      sk: sk, hair: HAIR[[1, 2, 4, 5][v]], hs: ['afro', 'long', 'pony', 'bald'][v], col: col, armW: 8, hem: -8, hemW: 19, skx: m.sw * 1.5, sag: 3, legs: '#3b3340', shoe: '#2f2a33', legW: 5,
      specs: v === 3 ? INK : null, aL: v === 1 ? 2.5 + m.k * 0.2 : 1.55 + m.k * 0.45, base: 0.9, amp: 0.5,
      deco: function () {
        Pg(c, [[-6, -57], [6, -57], [0, -47]], p.paper);
        for (i = -1; i <= 1; i += 2) Pg(c, [[i * 10.5, -56], [i * 5.2, -56.5], [i * 2.6, -26], [i * 6, -22.5], [i * 9.4, -26]], stole);
        for (i = -1; i <= 1; i += 2) { K.starPath(c, i * 6.3, -33, 2.3, 1, 5, 0); c.fillStyle = v === 1 ? p.accent : p.paper; c.fill(); }
        if (v === 3) { c.beginPath(); c.moveTo(-9, -55); c.quadraticCurveTo(-13, -34, -11 + m.sw, -27); c.moveTo(9, -55); c.quadraticCurveTo(13, -34, 11 + m.sw, -27); c.lineWidth = 1.3; c.strokeStyle = p.gold; c.stroke(); dot(c, -11 + m.sw, -26, 1.7, p.gold); dot(c, 11 + m.sw, -26, 1.7, p.gold); }
        L(c, -16 + m.sw * 1.5, -13, 16 + m.sw * 1.5, -13, 0.8, shade(col, -0.22));
      },
      hat: function (hx, hy) { if (v !== 1) mortar(c, hx, hy - 8.5 - m.k, m.sw * 0.04, shade(col, -0.22), p.gold, m.sw); }
    });
    var x = q.l[0], y = q.l[1];
    if (v === 1) mortar(c, x - 3 + m.sw * 2, y - 16 - Math.abs(Math.sin(m.t * 3.2)) * 9, -0.35 + Math.sin(m.t * 3.2) * 0.3, shade(col, -0.22), p.gold, m.sw);
    else if (v === 2) bouquet(c, x - 1, y - 3, -0.25 + m.sw * 0.1, [p.accent, p.gold, p.paper], m.t * 0.5);
    else scroll(c, x - 1, y - 2.5, -0.5 + m.sw * 0.15, v === 0 ? p.accent2 : p.accent);
  }, { wide: 0.9, variants: ['scroll held high', 'cap tossed in the air', 'bouquet', 'honour cords and scroll'] });

  /* ---------- newlywed: 0 suit, 1 gown, 2 another suit, 3 another gown (any two make a couple) ---------- */
  Art.add('character', 'newlywed', function (c, m, p) {
    var v = m.v, sk = SKIN[[2, 0, 3, 1][v]], gown = v % 2 === 1, col = ['#465487', '#fffaf3', '#c7a877', '#fde6e2'][v], i;
    var q = person(c, m, {
      sk: sk, hair: HAIR[[0, 2, 1, 3][v]], hs: ['short', 'bun', 'curly', 'long'][v], col: col, sw: gown ? 10.5 : 13.5, bare: gown, armW: gown ? 5.6 : 6.8,
      noLegs: gown, hem: v === 1 ? -1.5 : v === 3 ? -5 : -24, hemW: v === 1 ? 25 : v === 3 ? 13 : 15.5, sag: gown ? 1.5 : 4, skx: gown ? m.sw * 2.5 : 0,
      legs: shade(col, -0.08), shoe: v === 0 ? '#1f1c24' : '#6a4a30', aL: gown ? 1.05 + m.k * 0.2 : v === 0 ? 2.0 + m.k * 0.3 : 1.7 + m.k * 0.5, base: 0.9, amp: 0.5,
      back: function (hx, hy) {
        if (v === 1) { /* veil */
          c.beginPath(); c.moveTo(hx - 6, hy - 13); c.quadraticCurveTo(hx - 27 - m.sw * 3, hy + 6, -24 - m.sw * 5, -22); c.quadraticCurveTo(0, -30, 24 - m.sw * 5, -22); c.quadraticCurveTo(hx + 27 - m.sw * 3, hy + 6, hx + 6, hy - 13); c.closePath();
          c.fillStyle = 'rgba(255,255,255,0.62)'; c.fill(); c.lineWidth = 0.8; c.strokeStyle = 'rgba(190,180,200,0.8)'; c.stroke();
        }
        if (v === 3) { c.beginPath(); c.moveTo(-10 + m.sw * 2, -17); c.quadraticCurveTo(-24 + m.sw * 3, -4, -22 + m.sw * 3, -1); c.quadraticCurveTo(m.sw * 3, 2.5, 22 + m.sw * 3, -1); c.quadraticCurveTo(24 + m.sw * 3, -4, 10 + m.sw * 2, -17); c.closePath(); F(c, shade(col, -0.07)); }
      },
      deco: function () {
        if (!gown) {
          Pg(c, [[-5.5, -57], [5.5, -57], [0, -39]], '#fffdf7');
          Pg(c, [[-5.5, -57], [-10, -56], [-1, -37]], shade(col, v === 0 ? 0.14 : -0.14)); Pg(c, [[5.5, -57], [10, -56], [1, -37]], shade(col, v === 0 ? 0.14 : -0.14));
          dot(c, 0, -33, 1.1, shade(col, -0.4)); dot(c, 0, -28.5, 1.1, shade(col, -0.4));
          if (v === 0) K.bow(c, 0, -54.5, 9, p.accent); else { Pg(c, [[-1.8, -55.5], [1.8, -55.5], [2.4, -44], [0, -40.5], [-2.4, -44]], p.accent2); R(c, -2.3, -57, 4.6, 3.2, 1, p.accent2); }
          K.flower(c, -8.6, -47, 2.5, v === 0 ? p.paper : p.accent, p.gold, 0.3); K.leaf(c, -8.6, -47, 4.5, 2.2, '#3f9a5c');
          Rn(c, 5, -46.5, 5, 1.6, 0.5, v === 0 ? p.accent : p.paper);
        } else {
          c.save(); c.clip();
          if (v === 1) { for (i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 2.2, -38); c.quadraticCurveTo(i * 9 + m.sw * 2, -18, i * 11 + m.sw * 2.5, 0); c.lineWidth = 0.8; c.strokeStyle = '#e4d8cc'; c.stroke(); } for (i = 0; i < 7; i++) K.twinkle(c, -18 + i * 6 + m.sw * 2, -7 - (i % 2) * 5, 1.5, p.gold); }
          else { c.beginPath(); c.moveTo(-14, -24); c.quadraticCurveTo(0, -17, 14, -28); c.lineWidth = 0.8; c.strokeStyle = shade(col, -0.16); c.stroke(); for (i = 0; i < 5; i++) dot(c, -8 + i * 4, -8 - (i % 2) * 2.5, 0.9, p.gold); }
          c.restore();
          c.beginPath(); c.moveTo(-10, -57); c.quadraticCurveTo(-5, -50, 0, -54); c.quadraticCurveTo(5, -50, 10, -57); c.closePath(); c.fillStyle = sk; c.fill(); /* sweetheart neckline */
          R(c, -9.5, -41, 19, 3.2, 1.6, v === 1 ? p.gold : p.accent); if (v === 3) K.bow(c, 7, -39.5, 7, p.accent);
        }
      },
      hat: function (hx, hy, r) {
        if (v === 1) { for (i = -2; i <= 2; i++) dot(c, hx + i * 3.4, hy - r * 0.86 + Math.abs(i) * 0.9, 1.25, p.gold); dot(c, hx, hy - r * 0.86 - 1.6, 1.3, p.paper); }
        if (v === 3) { for (i = -2; i <= 2; i++) K.flower(c, hx + i * 5, hy - r * 0.84 + Math.abs(i) * 1.6, 2.7, i % 2 ? p.paper : p.accent, p.gold, i); }
      }
    });
    var x = q.l[0], y = q.l[1];
    if (gown) bouquet(c, x + 3, y - 2, 0.25 + m.sw * 0.1, v === 1 ? [p.accent, p.paper, '#f7b4c4'] : [p.gold, p.accent, p.paper], m.t * 0.5);
    else if (v === 0) { /* a flute raised in a toast */
      L(c, x - 1, y, x - 1.6, y - 6, 0.9, '#f4f1ea'); Pg(c, [[x - 4.4, y - 14.5], [x + 1, y - 14.5], [x - 0.6, y - 6], [x - 2.8, y - 6]], '#fff6d6'); Rn(c, x - 3.9, y - 11.5, 4.4, 5, 0.6, p.gold);
      for (i = 0; i < 3; i++) dot(c, x - 2 + Math.sin(m.t * 3 + i * 2) * 1.6, y - 16 - frac(m.t * 0.9 + i * 0.33) * 7, 0.7, p.paper);
    } else { /* a top hat doffed */
      c.save(); c.translate(x - 2, y - 4); c.rotate(-0.5 + m.sw * 0.15); R(c, -9.5, -1.5, 19, 3.2, 1.5, '#3b3340'); R(c, -6, -12, 12, 11, 1.5, '#3b3340'); Rn(c, -6, -5, 12, 2.6, 0, p.accent2); c.restore();
    }
  }, { wide: 1.0, variants: ['dark suit and bow tie', 'ball gown and veil', 'tan suit and top hat', 'slim gown and flower crown'] });

  /* ---------- medic: nurse, doctor, two more in scrubs ---------- */
  function stetho(c, y, m) { c.beginPath(); c.moveTo(-6, y); c.quadraticCurveTo(-7, y + 12, 0, y + 12); c.quadraticCurveTo(7, y + 12, 6, y); c.moveTo(0, y + 12); c.lineTo(m.sw, y + 17); c.lineWidth = 1.3; c.strokeStyle = '#56617f'; c.stroke(); E(c, m.sw, y + 18.5, 2.3, 2.3, '#cfd6e0'); }
  Art.add('character', 'medic', function (c, m, p) {
    var v = m.v, sk = SKIN[(v + 2) % 4], col = ['#35a79c', '#f8f6f0', '#7a5bd0', '#ef8198'][v], i;
    var q = person(c, m, {
      sk: sk, hair: HAIR[[4, 5, 1, 3][v]], hs: ['bun', 'short', 'none', 'afro'][v], col: col, bare: v !== 1, specs: v === 1 ? INK : null,
      hem: v === 1 ? -17 : -25, hemW: v === 1 ? 17 : 15, legs: v === 1 ? '#56617f' : shade(col, -0.1), shoe: v === 1 ? '#3a2a22' : '#f4f1ea',
      aL: v === 0 ? 0.8 + m.k * 0.15 : v === 1 ? 0.3 + m.sw * 0.12 : v === 2 ? 1.5 + m.k * 0.25 : null, base: 0.95, amp: 0.6,
      deco: function () {
        if (v === 1) {
          Pg(c, [[-6, -57], [6, -57], [0, -38]], p.accent2); Pg(c, [[-1.6, -56], [1.6, -56], [2, -46], [0, -43.5], [-2, -46]], p.gold);
          Pg(c, [[-6, -57], [-10.5, -56], [-2, -36]], '#e8e4da'); Pg(c, [[6, -57], [10.5, -56], [2, -36]], '#e8e4da'); L(c, 0, -37, 0, -18, 0.8, '#cfc8ba');
          R(c, 5, -30, 8, 8, 1.2, '#efece4'); R(c, -12, -46, 7, 6, 1, '#efece4'); L(c, -10, -47.5, -10, -43.5, 1, p.accent); L(c, -7.8, -47.5, -7.8, -43.5, 1, '#56617f');
          stetho(c, -56, m);
        } else {
          Pg(c, [[-5.5, -57], [5.5, -57], [0, -48]], sk); L(c, -5.5, -57, 0, -48, 1.2, shade(col, -0.2)); L(c, 5.5, -57, 0, -48, 1.2, shade(col, -0.2));
          R(c, 3.5, -45, 7.5, 7, 1.2, shade(col, -0.1)); L(c, 6, -46.5, 6, -42.5, 1, p.gold);
          R(c, -11, -45, 6, 7.5, 1, '#fffdf4'); Rn(c, -9.8, -43.6, 3.6, 2.6, 0.6, sk); L(c, -9.6, -39.6, -6.4, -39.6, 0.6, '#9aa3b1');
          L(c, -15.5, -31, 15.5, -31, 0.8, shade(col, -0.2));
          if (v === 2) for (i = 0; i < 6; i++) K.heartPath(c, -9 + (i % 3) * 9, i > 2 ? -27 : -36, 2.4), c.fillStyle = shade(col, 0.3), c.fill();
          if (v === 3) stetho(c, -56, m);
        }
      },
      hat: function (hx, hy, r) {
        if (v === 2) { /* scrub cap */
          c.beginPath(); c.moveTo(hx - r * 1.06, hy - r * 0.2); c.quadraticCurveTo(hx - r * 1.15, hy - r * 1.3, hx, hy - r * 1.22); c.quadraticCurveTo(hx + r * 1.15, hy - r * 1.3, hx + r * 1.06, hy - r * 0.2); c.quadraticCurveTo(hx, hy - r * 0.72, hx - r * 1.06, hy - r * 0.2); c.closePath(); F(c, p.gold);
          for (i = 0; i < 7; i++) dot(c, hx - 9 + i * 3, hy - r * (0.82 + (i % 2) * 0.2), 0.95, i % 2 ? p.accent : p.paper);
          Pg(c, [[hx - r * 1.02, hy - r * 0.3], [hx - r * 1.4, hy - r * 0.05 + m.sw], [hx - r * 1.3, hy - r * 0.5]], p.gold);
        }
        if (v === 0) { R(c, hx - 5, hy - r * 1.02, 10, 3, 1.4, p.paper); K.heartPath(c, hx, hy - r * 0.9, 2.6); c.fillStyle = p.accent; c.fill(); }
      }
    });
    var x = q.l[0], y = q.l[1];
    if (v === 0) clipboard(c, x + 5, y - 3, 0.18 + m.sw * 0.06, p.accent);
    if (v === 1) { /* the doctor's bag */
      c.save(); c.translate(x - 1, y + 2); c.rotate(m.sw * 0.14); c.beginPath(); c.arc(0, 1.5, 4.5, PI, 0); c.lineWidth = 1.5; c.strokeStyle = '#5a3a25'; c.stroke();
      R(c, -9, 1.5, 18, 12, 2.6, '#8a5a34'); Rn(c, -9, 4, 18, 1.6, 0, '#6b4226'); R(c, -1.8, 2.6, 3.6, 3.6, 0.8, p.gold); K.heartPath(c, 0, 9.4, 4.4); c.fillStyle = p.accent; c.fill(); c.restore();
    }
    if (v === 2) balloon(c, x, y, x - 5 + m.sw * 4, y - 30 - m.k * 2, 8.5, p.accent, true);
    if (v === 3) teddy(c, x - 2, y + 3 - m.k, 1.1);
  }, { wide: 0.95, variants: ['nurse with a clipboard', 'doctor in a white coat', 'scrubs, cap and a heart balloon', 'scrubs and a teddy'] });

  /* ---------- hats ---------- */
  function brimHat(c, hx, hy, r, col, band, wide) {
    E(c, hx, hy - r * 0.6, r * wide, r * 0.3, col);
    c.beginPath(); c.arc(hx, hy - r * 0.66, r * 0.8, PI, 0); c.quadraticCurveTo(hx, hy - r * 0.46, hx - r * 0.8, hy - r * 0.66); c.closePath(); F(c, col);
    c.beginPath(); c.moveTo(hx - r * 0.8, hy - r * 0.72); c.quadraticCurveTo(hx, hy - r * 0.5, hx + r * 0.8, hy - r * 0.72); c.lineWidth = r * 0.2; c.strokeStyle = band; c.stroke();
  }
  function ballCap(c, hx, hy, r, col, s) {
    c.beginPath(); c.arc(hx, hy - r * 0.3, r * 1.04, PI, 0); c.quadraticCurveTo(hx, hy - r * 0.62, hx - r * 1.04, hy - r * 0.3); c.closePath(); F(c, col);
    E(c, hx + s * r * 0.8, hy - r * 0.36, r * 0.66, r * 0.17, shade(col, -0.14)); dot(c, hx, hy - r * 1.33, r * 0.11, shade(col, 0.4));
  }

  /* ---------- teacher: four teachers ---------- */
  Art.add('character', 'teacher', function (c, m, p) {
    var v = m.v, sk = SKIN[[1, 0, 3, 2][v]], col = [p.accent2, '#4f7fb8', '#f4efe4', p.accent][v], i;
    var q = person(c, m, {
      sk: sk, hair: HAIR[[1, 5, 4, 0][v]], hs: ['bun', 'bald', 'curly', 'long'][v], col: col, specs: v < 2 ? INK : null, sleeve: v === 2 ? '#f4efe4' : col,
      hem: v === 3 ? -14 : -24, hemW: v === 3 ? 18.5 : 15.5, skx: v === 3 ? m.sw * 2 : 0, legW: v === 3 ? 4.8 : 7, legs: v === 3 ? sk : ['#7d6c96', '#8a7660', '#4a6fa5', sk][v], shoe: ['#3a2a22', '#3a2a22', p.accent, '#3b3340'][v],
      aL: [1.65 + m.k * 0.35, 0.85 + m.k * 0.12, 1.3 + m.sw * 0.08, 1.1 + m.k * 0.15][v], base: 0.9, amp: 0.55,
      deco: function () {
        c.save(); c.clip();
        if (v === 0) { Pg(c, [[-5, -58], [5, -58], [7, -22], [-7, -22]], p.paper); for (i = 0; i < 3; i++) dot(c, 8.5, -44 + i * 7, 1.2, p.gold); L(c, -7, -57, -7, -22, 0.8, shade(col, -0.25)); L(c, 7, -57, 7, -22, 0.8, shade(col, -0.25)); }
        if (v === 1) { Pg(c, [[-12, -58], [12, -58], [15, -22], [-15, -22]], p.gold); Pg(c, [[-5.5, -58], [5.5, -58], [0, -46]], col); for (i = -1; i <= 1; i++) { Pg(c, [[i * 8, -42], [i * 8 + 4, -35], [i * 8, -28], [i * 8 - 4, -35]], i ? p.accent : p.accent2, true); } Rn(c, -16, -26.5, 32, 3, 0, shade(p.gold, -0.18)); }
        if (v === 2) { for (i = 0; i < 6; i++) Rn(c, -18, -56 + i * 6, 36, 2.2, 0, p.accent2); }
        if (v === 3) { for (i = 0; i < 8; i++) K.flower(c, -13 + (i % 4) * 8.5 + (i > 3 ? 4 : 0) + m.sw * 1.5, i > 3 ? -19 : -29, 2.1, p.paper, p.gold, i); R(c, -16, -41, 32, 3.2, 1.5, p.gold); }
        c.restore();
        if (v === 0) { Pg(c, [[-5, -57], [0, -52], [-6.5, -50]], p.paper); Pg(c, [[5, -57], [0, -52], [6.5, -50]], p.paper); }
        if (v === 1) { Pg(c, [[-1.7, -56], [1.7, -56], [2.2, -49], [0, -46.5], [-2.2, -49]], p.accent); }
        if (v === 2) { /* the art teacher's apron */
          L(c, -6, -57, -7, -46, 1.2, p.accent); L(c, 6, -57, 7, -46, 1.2, p.accent); R(c, -11, -47, 22, 25, 3, p.accent); R(c, -6.5, -36, 13, 8, 1.5, shade(p.accent, -0.14));
          dot(c, -6, -42, 1.5, p.gold); dot(c, 6.5, -41, 1.2, p.paper); dot(c, 3, -26, 1.4, p.accent2); L(c, -3, -38, -3.6, -33, 1.2, p.gold); L(c, 0.5, -38.5, 0.5, -33, 1.2, '#58b4ff');
        }
        if (v === 3) R(c, -6, -58.5, 12, 3.4, 1.7, p.paper);
      },
      hat: function (hx, hy, r) {
        if (v === 1) { c.beginPath(); c.arc(hx, hy + r * 0.34, r * 0.5, 1.1 * PI, 1.9 * PI); c.lineWidth = 2.2; c.strokeStyle = HAIR[5]; c.stroke(); } /* moustache */
        if (v === 2) { L(c, hx + r * 0.75, hy - r * 0.95, hx + r * 1.5, hy - r * 0.5, 1.5, p.gold); dot(c, hx + r * 0.75, hy - r * 0.95, 1.1, '#ff8ad0'); } /* pencil behind the ear */
      }
    });
    var x = q.l[0], y = q.l[1];
    if (v === 0) { E(c, x - 1, y - 6.5, 6, 5.6, p.accent); K.shine(c, x - 3.2, y - 8.6, 1.5); L(c, x - 1, y - 11, x - 0.4, y - 14, 1.1, '#6b4226'); K.leaf(c, x - 0.4, y - 13, 5, -0.5, '#57b36f'); }
    if (v === 1) { /* an open book */
      c.save(); c.translate(x + 5, y - 2); c.rotate(m.sw * 0.06); Pg(c, [[-11, -6], [0, -4], [11, -6], [11, 6], [0, 8], [-11, 6]], shade(p.accent, -0.15)); Pg(c, [[-9.6, -7.5], [0, -5], [0, 6.5], [-9.6, 4.5]], p.paper); Pg(c, [[9.6, -7.5], [0, -5], [0, 6.5], [9.6, 4.5]], p.paper);
      for (i = 0; i < 3; i++) { L(c, -7.6, -3.8 + i * 3, -2, -2.7 + i * 3, 0.5, '#9a8f84'); L(c, 7.6, -3.8 + i * 3, 2, -2.7 + i * 3, 0.5, '#9a8f84'); } c.restore();
    }
    if (v === 2) { /* a giant pencil */
      c.save(); c.translate(x - 1, y + 2); c.rotate(-0.12 + m.sw * 0.1); R(c, -2.6, -30, 5.2, 34, 1, p.gold); L(c, 0, -29, 0, 3, 0.7, shade(p.gold, -0.2)); R(c, -2.6, -35.5, 5.2, 5, 2, '#ff8ad0'); Rn(c, -2.9, -31.4, 5.8, 2.2, 0, '#b9c0cc');
      Pg(c, [[-2.6, 4], [2.6, 4], [0, 11]], '#f3dcb8'); Pg(c, [[-1, 8.3], [1, 8.3], [0, 11]], INK, true); c.restore();
    }
    if (v === 3) { /* a slate with chalk marks */
      c.save(); c.translate(x - 4, y - 7); c.rotate(-0.1 + m.sw * 0.08); R(c, -11, -9, 22, 18, 1.6, '#a9703f'); Rn(c, -9.2, -7.2, 18.4, 14.4, 0.8, '#3d6b58');
      K.starPath(c, -3.6, -0.4, 4.2, 1.8, 5, m.sw * 0.2); c.lineWidth = 0.9; c.strokeStyle = '#fff'; c.stroke(); c.beginPath(); c.moveTo(2.6, 0.5); c.lineTo(4.4, 3); c.lineTo(7.6, -3.4); c.stroke(); c.restore();
    }
  }, { wide: 0.95, variants: ['cardigan and an apple', 'argyle vest and a book', 'art apron and a giant pencil', 'flowered dress and a slate'] });

  /* ---------- dancer: four ballroom and party dancers ---------- */
  Art.add('character', 'dancer', function (c, m, p) {
    var v = m.v, sk = SKIN[[2, 0, 3, 1][v]], col = [p.accent, '#fffaf3', '#7a5bd0', p.accent2][v], dress = v === 0 || v === 3, i;
    var q = person(c, m, {
      sk: sk, hair: HAIR[[1, 0, 3, 4][v]], hs: ['pony', 'short', 'afro', 'short'][v], col: col, bare: dress, sw: dress ? 11 : 13,
      hem: v === 0 ? -17 : v === 3 ? -19 : -24, hemW: v === 0 ? 23 : v === 3 ? 15 : 15, skx: dress ? m.sw * 4.5 : 0, sag: v === 0 ? 2 : 4,
      legs: dress ? sk : v === 1 ? '#56617f' : col, legW: dress ? 4.8 : 6.6, kick: 5, flare: v === 2, shoe: [p.accent, '#fffaf3', p.gold, p.gold][v],
      aL: v === 2 ? 2.35 + m.k * 0.45 : null, base: v === 2 ? 0.7 : 1.45, amp: 0.95,
      back: function () { if (v === 0) { c.beginPath(); c.moveTo(-23 + m.sw * 4.5, -17); for (i = 0; i < 6; i++) c.arc(-19 + i * 7.7 + m.sw * 5.5, -14.5, 3.85, PI, 0, true); c.closePath(); F(c, shade(col, -0.16)); } },
      deco: function () {
        if (v === 0) { c.save(); c.clip(); for (i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-26, -30 + i * 7); c.quadraticCurveTo(m.sw * 4, -24 + i * 7, 26, -32 + i * 7); c.lineWidth = 1; c.strokeStyle = shade(col, -0.18); c.stroke(); } c.restore(); R(c, -9.5, -41, 19, 3, 1.5, p.gold); Pg(c, [[-5, -57], [5, -57], [0, -51]], sk, true); }
        if (v === 1) { for (i = -1; i <= 1; i += 2) L(c, i * 6.5, -56, i * 7.5, -25, 2.2, p.accent); K.bow(c, 0, -54.5, 9, p.accent); for (i = 0; i < 3; i++) dot(c, 0, -46 + i * 6.5, 0.9, '#b9c0cc'); Rn(c, -15, -27, 30, 3, 0, '#56617f'); }
        if (v === 2) { Pg(c, [[-6, -57], [6, -57], [0, -40]], sk, true); Pg(c, [[-6, -57], [-12, -55], [-5, -44]], p.paper); Pg(c, [[6, -57], [12, -55], [5, -44]], p.paper); R(c, -15, -31, 30, 4, 1.5, p.gold); K.starPath(c, 0, -29, 3.6, 1.6, 5, 0); F(c, p.paper); for (i = 0; i < 5; i++) K.twinkle(c, [-9, 8, -4, 10, -11][i], [-38, -44, -22, -24, -24][i], 1.6, p.gold); }
        if (v === 3) { /* fringe that swings */
          for (var row = 0; row < 3; row++) for (i = -6; i <= 6; i++) L(c, i * 2.3 + m.sw * row, -38 + row * 7, i * 2.3 + m.sw * (2 + row * 1.5), -31.5 + row * 7, 1.1, row % 2 ? shade(col, 0.3) : shade(col, -0.2));
          Pg(c, [[-5, -57], [5, -57], [0, -50]], sk, true); c.beginPath(); c.moveTo(-6, -56); c.quadraticCurveTo(m.sw * 2, -36, 6, -56); c.lineWidth = 1; c.setLineDash([0.1, 2.2]); c.strokeStyle = p.paper; c.stroke(); c.setLineDash([]);
        }
      },
      hat: function (hx, hy, r) {
        if (v === 0) K.flower(c, hx + r * 0.8, hy - r * 0.72, 4, p.gold, p.paper, m.t);
        if (v === 1) { E(c, hx, hy - r * 0.7, r * 1.32, r * 0.24, '#56617f'); c.beginPath(); c.moveTo(hx - r * 0.8, hy - r * 0.72); c.quadraticCurveTo(hx - r * 0.85, hy - r * 1.7, hx, hy - r * 1.5); c.quadraticCurveTo(hx + r * 0.85, hy - r * 1.7, hx + r * 0.8, hy - r * 0.72); c.closePath(); F(c, '#56617f'); Rn(c, hx - r * 0.8, hy - r * 1.0, r * 1.6, r * 0.22, 0, p.accent); }
        if (v === 3) { R(c, hx - r * 1.02, hy - r * 0.62, r * 2.04, r * 0.28, 1.4, p.gold); K.flower(c, hx - r * 0.82, hy - r * 0.5, 3.4, p.paper, p.accent, m.t * 0.6); for (var j = 0; j < 4; j++) dot(c, hx - r * 0.2 + j * r * 0.32, hy - r * 0.48, 0.8, p.paper); }
      }
    });
    if (v === 2) K.twinkle(c, q.l[0] - 2, q.l[1] - 7, 3 + m.k * 2.5, p.gold);
    if (v === 1 && !m.wave) { /* cane twirled in the right hand */ c.save(); c.translate(q.r[0], q.r[1]); c.rotate(m.sw * 0.9); L(c, 0, 8, 0, -16, 1.8, '#3b3340'); dot(c, 0, -16, 1.8, p.gold); c.restore(); }
  }, { wide: 1.1, variants: ['ruffled salsa dress', 'braces, bow tie and hat', 'disco jumpsuit', 'fringed dress and beads'] });

  /* ---------- hiker: four walkers, each with a pack and a hat ---------- */
  Art.add('character', 'hiker', function (c, m, p) {
    var v = m.v, sk = SKIN[[0, 3, 2, 1][v]], col = [p.accent2, p.accent, '#f4efe4', '#d9793f'][v], pack = [p.accent, '#4a6fa5', p.gold, p.accent2][v], i;
    var q = person(c, m, {
      sk: sk, hair: HAIR[[2, 1, 4, 5][v]], hs: ['short', 'crop', 'pony', 'short'][v], col: col, bare: v !== 3,
      legs: v === 3 ? '#8a7660' : sk, shorts: v === 3 ? null : ['#b89a68', '#56617f', '#6f8f5a', null][v], legW: v === 3 ? 7 : 5.6, sock: v === 3 ? null : p.paper, shoe: '#7a4f2c',
      aL: [0.95 + m.sw * 0.1, 1.75 + m.k * 0.3, 1.0 + m.k * 0.12, 1.0 + m.sw * 0.1][v], base: 0.9, amp: 0.55,
      back: function () { /* the pack, seen past the shoulders */
        var by = m.k * 1.5;
        R(c, -18, -62 + by, 36, 36, 9, pack); R(c, -12, -70 + by, 24, 11, 5, shade(pack, -0.14));
        if (v === 3) { R(c, -19, -76 + by, 38, 9, 4.5, '#6f8f5a'); L(c, -9, -76 + by, -9, -67 + by, 1.2, '#3a2a22'); L(c, 9, -76 + by, 9, -67 + by, 1.2, '#3a2a22'); c.beginPath(); c.arc(-19, -71.5 + by, 2.6, 0, TAU); c.lineWidth = 0.8; c.strokeStyle = shade('#6f8f5a', -0.3); c.stroke(); }
        if (v === 1) { c.save(); c.translate(19, -40 + by); c.rotate(m.sw * 0.2); R(c, -3, 0, 6, 11, 2.5, '#9fd3e6'); R(c, -2, -2.5, 4, 3, 1, '#56617f'); c.restore(); }
        if (v === 2) { c.save(); c.translate(-19, -36 + by); c.rotate(m.sw * 0.25); R(c, -3.5, 0, 7, 6.5, 2, '#cfd6e0'); c.beginPath(); c.arc(0, 0, 2.6, PI, 0); c.lineWidth = 1; c.strokeStyle = '#9aa3b1'; c.stroke(); c.restore(); }
      },
      deco: function () {
        c.save(); c.clip();
        if (v === 1) { for (i = -3; i <= 3; i++) Rn(c, i * 5.5 - 0.9, -58, 1.8, 36, 0, shade(col, -0.2)); for (i = 0; i < 5; i++) Rn(c, -18, -53 + i * 6.5, 36, 1.8, 0, shade(col, 0.28)); }
        if (v === 2) { Pg(c, [[-14, -58], [-4, -58], [-3, -22], [-17, -22]], '#6f8f5a'); Pg(c, [[14, -58], [4, -58], [3, -22], [17, -22]], '#6f8f5a'); R(c, 5.5, -36, 7, 6.5, 1, shade('#6f8f5a', -0.12)); R(c, -12.5, -36, 7, 6.5, 1, shade('#6f8f5a', -0.12)); }
        if (v === 3) { Rn(c, -18, -30, 36, 4, 0, shade(col, -0.18)); }
        c.restore();
        if (v === 0) { Pg(c, [[-5, -57], [0, -51], [-7, -50]], shade(col, 0.25)); Pg(c, [[5, -57], [0, -51], [7, -50]], shade(col, 0.25)); R(c, 3.5, -44, 7.5, 6.5, 1, shade(col, -0.12)); }
        for (i = -1; i <= 1; i += 2) L(c, i * 9.5, -57, i * 10.5, -30, 2.6, shade(pack, -0.2)); /* straps */
        L(c, -10, -45, 10, -45, 1.6, shade(pack, -0.2)); R(c, -2.2, -47, 4.4, 4, 1, '#3a2a22');
        if (v === 1) { /* binoculars on a strap */ c.beginPath(); c.moveTo(-5, -56); c.lineTo(-3.4, -39 + m.k); c.moveTo(5, -56); c.lineTo(3.4, -39 + m.k); c.lineWidth = 0.8; c.strokeStyle = '#3a2a22'; c.stroke(); R(c, -6.8, -40 + m.k, 6.4, 9, 2, '#3a3550'); R(c, 0.4, -40 + m.k, 6.4, 9, 2, '#3a3550'); dot(c, -3.6, -32.6 + m.k, 2, '#9fd3e6'); dot(c, 3.6, -32.6 + m.k, 2, '#9fd3e6'); }
      },
      hat: function (hx, hy, r) {
        if (v === 0) brimHat(c, hx, hy, r, '#c9a877', '#7a4f2c', 1.55);
        if (v === 1) { /* a floppy bucket hat */
          c.beginPath(); c.moveTo(hx - r * 1.38, hy - r * 0.34); c.quadraticCurveTo(hx - r * 0.95, hy - r * 0.8, hx - r * 0.8, hy - r * 0.86); c.quadraticCurveTo(hx - r * 0.72, hy - r * 1.5, hx, hy - r * 1.46); c.quadraticCurveTo(hx + r * 0.72, hy - r * 1.5, hx + r * 0.8, hy - r * 0.86); c.quadraticCurveTo(hx + r * 0.95, hy - r * 0.8, hx + r * 1.38, hy - r * 0.34); c.quadraticCurveTo(hx, hy - r * 0.74, hx - r * 1.38, hy - r * 0.34); c.closePath(); F(c, p.gold);
          c.beginPath(); c.moveTo(hx - r * 0.8, hy - r * 0.86); c.quadraticCurveTo(hx, hy - r * 1.06, hx + r * 0.8, hy - r * 0.86); c.lineWidth = 1.8; c.strokeStyle = p.accent2; c.stroke(); c.lineWidth = 0.6; c.setLineDash([1.2, 1.2]); c.strokeStyle = shade(p.gold, -0.3); c.beginPath(); c.moveTo(hx - r * 1.1, hy - r * 0.5); c.quadraticCurveTo(hx, hy - r * 0.86, hx + r * 1.1, hy - r * 0.5); c.stroke(); c.setLineDash([]);
        }
        if (v === 2) ballCap(c, hx, hy, r, p.accent, 1);
        if (v === 3) { /* a rolled bandana and a beard */
          c.beginPath(); c.moveTo(hx - r * 0.95, hy + r * 0.25); c.quadraticCurveTo(hx, hy + r * 1.75, hx + r * 0.95, hy + r * 0.25); c.quadraticCurveTo(hx + r * 0.55, hy + r * 0.84, hx, hy + r * 0.84); c.quadraticCurveTo(hx - r * 0.55, hy + r * 0.84, hx - r * 0.95, hy + r * 0.25); c.closePath(); F(c, HAIR[5]);
          R(c, hx - r * 1.03, hy - r * 0.74, r * 2.06, r * 0.34, 2, p.accent); Pg(c, [[hx + r * 0.98, hy - r * 0.6], [hx + r * 1.5, hy - r * 0.3 + m.sw], [hx + r * 1.42, hy - r * 0.86 + m.sw]], p.accent); dot(c, hx - 4, hy - r * 0.57, 0.8, p.paper); dot(c, hx + 2, hy - r * 0.57, 0.8, p.paper);
        }
      }
    });
    var x = q.l[0], y = q.l[1];
    if (v === 0) { L(c, x + 1, y - 4, x - 5, -y * 0 - 1, 1.6, '#9aa3b1'); R(c, x - 1.2, y - 9, 4.4, 6.5, 1.6, '#3a3550'); Pg(c, [[x - 7, -6], [x - 1.5, -6], [x - 4.6, -3]], '#3a3550', true); }
    if (v === 2) { /* a map with a dotted trail */
      c.save(); c.translate(x + 4, y - 4); c.rotate(-0.1 + m.sw * 0.07); Pg(c, [[-11, -7], [-3.6, -8.5], [3.6, -7], [11, -8.5], [11, 6.5], [3.6, 8], [-3.6, 6.5], [-11, 8]], '#fdf6e0'); L(c, -3.6, -8.5, -3.6, 6.5, 0.5, '#d8cdb0'); L(c, 3.6, -7, 3.6, 8, 0.5, '#d8cdb0');
      c.beginPath(); c.moveTo(-8, 4); c.quadraticCurveTo(-3, -5, 1, 1); c.quadraticCurveTo(4, 4, 7, -3); c.lineWidth = 0.8; c.setLineDash([1.3, 1.3]); c.strokeStyle = p.accent; c.stroke(); c.setLineDash([]); L(c, 6, -5, 8.4, -2.6, 0.9, p.accent); L(c, 8.4, -5, 6, -2.6, 0.9, p.accent); Pg(c, [[-9, -1], [-6.5, -5], [-4.4, -1]], '#6f8f5a', true); c.restore();
    }
    if (v === 3) { L(c, x + 2, y - 26, x - 3, -1, 3.6, shade('#8f6238', -0.34)); L(c, x + 2, y - 26, x - 3, -1, 2.2, '#8f6238'); dot(c, x + 2, y - 26, 2.2, '#a9703f'); }
    if (v === 1) K.twinkle(c, x - 4, y - 6, 2.2 + m.k * 2, p.gold);
  }, { wide: 1.05, variants: ['wide hat and trekking pole', 'bucket hat and binoculars', 'cap, vest and a map', 'bandana, beard and walking stick'] });

  /* ---------- traveler: four travellers, a suitcase or a camera ---------- */
  function suitcase(c, x, hx, hy, col, m, stick) { /* stands on the floor at x, its handle up to the hand */
    L(c, x - 3.5, -24, hx - 1.5, hy, 1.1, '#9aa3b1'); L(c, x + 3.5, -24, hx + 1.5, hy, 1.1, '#9aa3b1'); L(c, hx - 2.4, hy, hx + 2.4, hy, 2, '#3a3550');
    dot(c, x - 6, -1.6, 2, '#3a3550'); dot(c, x + 6, -1.6, 2, '#3a3550');
    R(c, x - 10, -26, 20, 23.5, 3.5, col); for (var i = -1; i <= 1; i++) L(c, x + i * 5, -23, x + i * 5, -5.5, 1, shade(col, -0.18));
    Rn(c, x - 10, -16.5, 20, 2.4, 0, shade(col, 0.3));
    if (stick) { K.heartPath(c, x - 4, -10, 5); c.fillStyle = stick[0]; c.fill(); K.starPath(c, x + 4.5, -20.5, 3, 1.3, 5, 0.3); c.fillStyle = stick[1]; c.fill(); dot(c, x + 4, -8, 2.2, stick[2]); }
  }
  Art.add('character', 'traveler', function (c, m, p) {
    var v = m.v, sk = SKIN[[1, 2, 0, 3][v]], col = [p.accent, p.accent2, '#4a6fa5', p.gold][v], i;
    var q = person(c, m, {
      sk: sk, hair: HAIR[[3, 0, 4, 1][v]], hs: ['long', 'short', 'curly', 'crop'][v], col: col, bare: v !== 2, sw: v === 0 ? 11 : 13,
      hem: v === 0 ? -15 : -24, hemW: v === 0 ? 18 : 15.5, skx: v === 0 ? m.sw * 2 : 0, legW: v === 0 ? 4.8 : v === 2 ? 7 : 5.6,
      legs: v === 2 ? '#56617f' : sk, shorts: v === 1 ? '#c9a877' : v === 3 ? '#f4efe4' : null, shoe: [p.gold, '#f4f1ea', p.accent, '#c9793f'][v],
      aL: [0.75 + m.sw * 0.08, 2.05 + m.k * 0.2, 0.3 + m.sw * 0.12, 0.75 + m.sw * 0.08][v], aR: v === 2 ? 2.2 + m.k * 0.3 : null, base: 0.9, amp: 0.55,
      back: function () {
        if (v === 2) { R(c, -17, -60 + m.k, 34, 30, 8, p.accent2); R(c, -11, -66 + m.k, 22, 9, 4, shade(p.accent2, -0.14)); }
      },
      deco: function () {
        c.save(); c.clip();
        if (v === 0) { for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-22, -30 + i * 6); c.quadraticCurveTo(m.sw * 2, -34 + i * 6, 22, -30 + i * 6); c.lineWidth = 1.8; c.strokeStyle = p.paper; c.stroke(); } }
        if (v === 3) for (i = 0; i < 9; i++) { K.flower(c, -11 + (i % 3) * 11 + (Math.floor(i / 3) % 2) * 4, -51 + Math.floor(i / 3) * 10, 2.6, i % 2 ? p.accent : p.paper, i % 2 ? p.paper : p.accent2, i); }
        c.restore();
        if (v === 0) { R(c, -10, -42, 20, 3, 1.5, p.paper); Pg(c, [[-5, -57], [5, -57], [0, -51]], sk, true); }
        if (v === 1) { Pg(c, [[-5, -57], [0, -51], [-7, -50]], shade(col, 0.25)); Pg(c, [[5, -57], [0, -51], [7, -50]], shade(col, 0.25)); for (i = 0; i < 3; i++) dot(c, 0, -46 + i * 7, 0.9, p.paper); R(c, -12, -31, 9, 5.5, 1.5, '#8a5a34'); L(c, -13, -56, 12, -30, 1.6, '#8a5a34'); }
        if (v === 2) { /* straps and a neck pillow */ for (i = -1; i <= 1; i += 2) L(c, i * 9.5, -56, i * 10.5, -32, 2.4, shade(p.accent2, -0.2)); R(c, -6.5, -32, 13, 7, 3, shade(col, -0.14)); c.beginPath(); c.arc(0, -59.5, 9.5, 0.08 * PI, 0.92 * PI); c.lineWidth = 6.6; c.lineCap = 'round'; c.strokeStyle = shade(p.gold, -0.34); c.stroke(); c.lineWidth = 5; c.strokeStyle = p.gold; c.stroke(); }
        if (v === 3) { Pg(c, [[-5, -57], [0, -49], [-8, -50]], shade(col, 0.3)); Pg(c, [[5, -57], [0, -49], [8, -50]], shade(col, 0.3)); L(c, 0, -49, 0, -24, 0.7, shade(col, -0.25)); }
      },
      hat: function (hx, hy, r) {
        if (v === 0) brimHat(c, hx, hy, r, '#f3dfb0', p.accent, 1.75);
        if (v === 1) ballCap(c, hx, hy, r, p.accent, -1);
        if (v === 3) { brimHat(c, hx, hy, r, '#e7c98a', p.accent2, 1.4); for (i = -1; i <= 1; i += 2) R(c, hx + i * r * 0.44 - r * 0.36, hy - r * 0.2, r * 0.72, r * 0.5, r * 0.2, '#2b2540'); L(c, hx - r * 0.1, hy - r * 0.04, hx + r * 0.1, hy - r * 0.04, 1, '#2b2540'); for (i = -1; i <= 1; i += 2) L(c, hx + i * r * 0.5 - 1.4, hy + r * 0.14, hx + i * r * 0.5 + 0.6, hy - r * 0.08, 0.7, 'rgba(255,255,255,0.7)'); }
      }
    });
    var x = q.l[0], y = q.l[1];
    if (v === 0) suitcase(c, x - 4, x, y, p.accent2, m);
    if (v === 3) suitcase(c, x - 4, x, y, p.accent2, m, [p.accent, p.paper, p.gold]);
    if (v === 1) { /* a camera, and its flash on the beat */
      c.save(); c.translate(x + 3, y - 4); c.rotate(-0.12 + m.sw * 0.06); R(c, -2, -9.5, 7, 4, 1.2, '#56617f'); R(c, -9, -7, 18, 13, 2.4, '#3a3550'); Rn(c, -9, -4.4, 18, 1.8, 0, p.gold); E(c, 0, 0, 4.6, 4.6, '#cfd6e0'); dot(c, 0, 0, 2.8, '#2b3a5a'); dot(c, -1, -1, 0.9, '#fff'); dot(c, 6, -4.8, 1, p.accent); c.restore();
      if (m.k > 0.45) { K.twinkle(c, x + 4, y - 15, 3 + m.k * 6, '#fff'); K.twinkle(c, x + 4, y - 15, 2 + m.k * 3, p.gold); }
    }
    if (v === 2) { /* a duffel in one hand, a ticket and passport in the other */
      c.save(); c.translate(x - 2, y + 2); c.rotate(m.sw * 0.12); c.beginPath(); c.arc(0, 3, 6, PI, 0); c.lineWidth = 1.6; c.strokeStyle = '#3a2a22'; c.stroke(); R(c, -13, 3, 26, 12.5, 6, p.accent); Rn(c, -4, 3.6, 2.4, 11.4, 0, shade(p.accent, -0.2)); Rn(c, 1.6, 3.6, 2.4, 11.4, 0, shade(p.accent, -0.2)); L(c, -9, 6.5, 9, 6.5, 0.7, p.paper); c.restore();
      if (!m.wave) { c.save(); c.translate(q.r[0] + 2, q.r[1] - 5); c.rotate(0.3 + m.sw * 0.12); R(c, -3, -9, 9, 5, 1, p.paper); L(c, -1, -6.5, 4, -6.5, 0.6, p.accent); R(c, -5, -6, 9, 12, 1.4, '#2f5d8a'); c.beginPath(); c.arc(-0.5, -0.6, 2.4, 0, TAU); c.moveTo(-2.9, -0.6); c.lineTo(1.9, -0.6); c.lineWidth = 0.6; c.strokeStyle = p.gold; c.stroke(); c.restore(); }
    }
  }, { wide: 1.15, variants: ['sun hat and a rolling case', 'cap and a camera', 'backpack, neck pillow and duffel', 'flowered shirt, sunglasses and a stickered case'] });
});
