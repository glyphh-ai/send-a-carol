/* Send a Carol art pack: people, set A (cheerleaders, superheroes of our own, pirates, astronauts, chefs, gardeners,
   the knitting circle). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var SKIN = ['#f6cfa8', '#b9774a', '#e3ac7c', '#7c4a2d'], HAIR = ['#6a3d22', '#221a18', '#d49a3a', '#a0452a'];
  var INK = '#2b2118';

  /* ---------- the shared body: legs, torso, two-part arms ---------- */
  function OL(c, x1, y1, x2, y2, w, col) { if (K.ow() > 0) L(c, x1, y1, x2, y2, w + K.ow() * 1.6, shade(col, -0.34)); L(c, x1, y1, x2, y2, w, col); }
  function legs(c, col, shoe, o) { /* o: sp spread, w width, top, sock colour, shoe height */
    o = o || {}; var sp = o.sp || 6.5, w = o.w || 7, top = o.top || -27, i;
    for (i = -1; i <= 1; i += 2) {
      OL(c, i * sp * 0.92, top, i * sp, -6, w, col);
      if (o.sock) L(c, i * sp, -11, i * sp, -6, w, o.sock);
      if (o.boot) R(c, i * sp - w * 0.62, -o.boot, w * 1.24, o.boot - 3, 2, shoe);
      R(c, i * (sp + 1.2) - 6.6, -7.2, 13.2, 7.2, 3.4, shoe);
    }
  }
  function torso(c, col, o) { /* o: wt top half-width, wb bottom half-width, top, bot */
    o = o || {}; var wt = o.wt || 12.5, wb = o.wb || 16, top = o.top || -56, bot = o.bot || -23;
    c.beginPath(); c.moveTo(-wt, top); c.quadraticCurveTo(-wb - 1, (top + bot) / 2, -wb, bot); c.quadraticCurveTo(0, bot + 4, wb, bot); c.quadraticCurveTo(wb + 1, (top + bot) / 2, wt, top); c.quadraticCurveTo(0, top - 3, -wt, top); c.closePath(); F(c, col);
  }
  /* upper arm then forearm; angles as in K.arm (0 down, PI/2 out, PI up). Returns the hand point. */
  function arm2(c, sx, sy, s, a1, l1, a2, l2, w, col, hand, hr) {
    var e = K.arm(c, sx, sy, s, a1, l1, w, col);
    var h = K.arm(c, e[0], e[1], s, a2, l2, w, col, hand, hr);
    dot(c, e[0], e[1], w * 0.5, col);
    return h;
  }
  function waveA(m) { return 2.55 + Math.sin(m.t * 9) * 0.32; }
  function sparkle(c, x, y, r, col) { K.twinkle(c, x, y, r, col); }

  /* ================= cheer: four cheerleaders with pom-poms, plain uniforms ================= */
  function pomf(c, x, y, r, c1, c2, rot) {
    var i, a;
    for (i = 0; i < 9; i++) { a = rot + i / 9 * TAU; E(c, x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.44, r * 0.44, i % 2 ? c1 : c2); }
    E(c, x, y, r * 0.56, r * 0.56, c1);
    for (i = 0; i < 6; i++) { a = rot * 1.7 + i / 6 * TAU + 0.4; L(c, x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2, x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, 0.7, shade(i % 2 ? c2 : c1, 0.35)); }
  }
  Art.add('character', 'cheer', function (c, m, p) {
    var v = m.v, sk = SKIN[v], hr = HAIR[[2, 1, 0, 3][v]], col = [p.accent, p.accent2, '#2f6fd0', '#8a4fc0'][v], tr = [p.paper, p.gold, p.gold, p.paper][v];
    var hx = m.sw * 2.2, hy = -70 + m.k * 2, i, skirt = v !== 1, aa = K.armAngles(m, 2.25, 0.55);
    /* hair that hangs behind the head */
    if (v === 0) { c.save(); c.translate(hx - 9, hy - 9); c.rotate(0.5 - m.sw * 0.5 - m.k * 0.25); E(c, -4, 9, 5.2, 12, hr); c.restore(); }
    if (v === 3) K.hairdo(c, hx, hy, 13.6, hr, 2);
    if (v === 2) for (i = -1; i <= 1; i += 2) E(c, hx + i * 12.5, hy - 10 - m.k * 1.5, 6.4, 6.4, hr);
    if (skirt) legs(c, sk, p.paper, { sock: p.paper, w: 6, sp: 6 }); else legs(c, shade(col, -0.18), p.paper, { w: 7.2 });
    for (i = -1; i <= 1; i += 2) L(c, i * 7.5 - 4, -3.8, i * 7.5 + 4, -3.8, 1.2, col);
    /* top and skirt */
    torso(c, col, { wt: 11.5, wb: 12.5, bot: skirt ? -31 : -24 });
    c.beginPath(); c.moveTo(-9, -55); c.lineTo(0, -43); c.lineTo(9, -55); c.lineWidth = 3; c.strokeStyle = tr; c.stroke();
    c.beginPath(); c.moveTo(-5, -56); c.lineTo(0, -49.5); c.lineTo(5, -56); c.lineWidth = 1.4; c.strokeStyle = shade(col, -0.3); c.stroke();
    if (skirt) {
      var sx = m.sw * 3.2;
      Pg(c, [[-12.5, -33], [12.5, -33], [19 + sx, -17.5], [-19 + sx, -17.5]], col);
      for (i = -2; i <= 2; i++) Pg(c, [[i * 4.6 - 1, -33], [i * 4.6 + 1.2, -33], [i * 7.2 + 2.6 + sx, -17.5], [i * 7.2 - 1.2 + sx, -17.5]], i % 2 ? shade(col, -0.2) : tr, true);
      Rn(c, -13, -35, 26, 3.6, 1.8, tr);
    } else { Rn(c, -13.5, -27.5, 27, 3.6, 1.8, tr); L(c, -9.5, -22, -9.5, -8, 1.4, tr); L(c, 9.5, -22, 9.5, -8, 1.4, tr); }
    K.head(c, hx, hy, 13, sk, m);
    if (v === 0) { K.hairdo(c, hx, hy, 13, hr, 0); K.bow(c, hx - 8, hy - 11.5, 9, tr === p.paper ? p.gold : tr); }
    else if (v === 1) { K.hairdo(c, hx, hy, 13, hr, 0); Rn(c, hx - 12.6, hy - 9.6, 25.2, 3, 1.5, tr); }
    else if (v === 2) { K.hairdo(c, hx, hy, 13, hr, 1); for (i = -1; i <= 1; i += 2) dot(c, hx + i * 11, hy - 7.5, 1.7, p.accent); }
    else { K.hairdo(c, hx, hy, 13, hr, 0); c.beginPath(); c.arc(hx, hy - 2, 13.6, PI * 1.14, PI * 1.86); c.lineWidth = 2.6; c.strokeStyle = p.gold; c.stroke(); }
    /* arms up in a V, pom-poms shaking */
    var c1 = v === 1 ? p.gold : col, c2 = v === 3 ? p.gold : v === 1 ? p.accent2 : tr, sh = Math.sin(m.t * 11) * 0.5 + m.k * 2;
    var hl = K.arm(c, -12.5, -52, -1, m.wave ? 0.95 + m.k * 0.3 : v === 3 ? 1.2 + m.sw * 0.5 : aa[0], 17, 5.4, sk, sk, 3.2), hrp = K.arm(c, 12.5, -52, 1, aa[1], 17, 5.4, sk, sk, 3.2);
    for (i = -1; i <= 1; i += 2) R(c, i * 12.5 - 4.2, -56.5, 8.4, 6.6, 3.2, col);
    pomf(c, hl[0] - 1.5, hl[1] - 3, 9.2 + m.k * 1.3, c1, c2, sh);
    pomf(c, hrp[0] + 1.5, hrp[1] - 3, 9.2 + m.k * 1.3, c1, c2, -sh + 1);
  }, { wide: 0.95, variants: ['ponytail in a skirt', 'shorts and headband', 'puffs in blue', 'long hair in violet'] });

  /* ================= hero: four superheroes of our own ================= */
  Art.add('character', 'hero', function (c, m, p) {
    var v = m.v, sk = SKIN[(v + 1) % 4], hr = HAIR[[1, 0, 3, 2][v]], suit = ['#2f6fd0', '#d8362f', '#8a4fc0', '#1f9a78'][v], cape = [p.accent, p.gold, '#ff8ab8', p.paper][v], tr = [p.gold, '#2b3a67', p.gold, p.gold][v];
    var hx = m.sw * 2, hy = -71 + m.k * 2, i, sx = m.sw * 7, bil = m.k * 5 + Math.sin(m.t * 3.1) * 1.6, len = v === 3 ? -24 : -7;
    if (cape === suit) cape = p.gold;
    /* cape: billows on the beat, swings with the sway */
    c.beginPath(); c.moveTo(-11, -57); c.bezierCurveTo(-25 - bil, -46, -27 - bil + sx * 0.5, len - 18, -21 + sx, len);
    c.quadraticCurveTo(-10 + sx, len - 5, sx, len); c.quadraticCurveTo(10 + sx, len - 5, 21 + sx, len);
    c.bezierCurveTo(27 + bil + sx * 0.5, len - 18, 25 + bil, -46, 11, -57); c.closePath(); F(c, cape);
    c.lineWidth = 1; c.strokeStyle = shade(cape, -0.2); for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * 9, -54); c.quadraticCurveTo(i * 15 + sx * 0.4, -34, i * 11 + sx, len - 3); c.stroke(); }
    if (v === 2) K.hairdo(c, hx, hy, 13.8, hr, 2);
    legs(c, suit, tr, { boot: 17, w: 7.2 });
    for (i = -1; i <= 1; i += 2) Rn(c, i * 6.5 - 5, -18.6, 10, 2.2, 1, shade(tr, 0.3));
    torso(c, suit, { wt: 13.5, wb: 12.5, bot: -25 });
    Pg(c, [[-12.6, -30], [12.6, -30], [5, -21.5], [-5, -21.5]], shade(suit, -0.22), true);
    Rn(c, -13, -31.5, 26, 4.2, 2, tr); R(c, -3.4, -32.4, 6.8, 6, 1.6, p.gold);
    /* the emblem: star, bolt, heart, ring */
    E(c, 0, -44, 7.6, 7.2, v === 1 ? p.gold : p.paper);
    if (v === 0) { K.starPath(c, 0, -43.6, 6, 2.6, 5, 0); c.fillStyle = p.accent; c.fill(); }
    else if (v === 1) Pg(c, [[2.2, -50], [-3.8, -43], [-0.4, -43], [-2.2, -37.6], [3.8, -45], [0.4, -45]], suit, true);
    else if (v === 2) { K.heartPath(c, 0, -44.2, 8.6); c.fillStyle = '#ff5a8a'; c.fill(); }
    else { c.beginPath(); c.arc(0, -44, 3.9, 0, TAU); c.lineWidth = 2.2; c.strokeStyle = suit; c.stroke(); dot(c, 0, -44, 1.3, p.gold); }
    L(c, -8.5, -57, 8.5, -57, 3.4, cape); dot(c, -8.5, -57, 2.2, p.gold); dot(c, 8.5, -57, 2.2, p.gold);
    /* head, mask */
    if (v === 1) { E(c, hx, hy - 1, 14.2, 14, suit); Pg(c, [[hx - 3, hy - 13], [hx, hy - 22 - m.k * 2], [hx + 3, hy - 13]], p.gold); }
    K.head(c, hx, hy, 13, sk, m);
    if (v === 0) K.hairdo(c, hx, hy, 13, hr, 0);
    else if (v === 1) { c.beginPath(); c.arc(hx, hy, 13.3, PI * 1.02, PI * 1.98); c.quadraticCurveTo(hx + 7, hy - 5, hx, hy - 3.2); c.quadraticCurveTo(hx - 7, hy - 5, hx - 13.3, hy - 0.8); c.closePath(); F(c, suit); }
    else if (v === 2) { K.hairdo(c, hx, hy, 13, hr, 0); Pg(c, [[hx - 9, hy - 9.5], [hx - 5, hy - 12], [hx, hy - 17 - m.k], [hx + 5, hy - 12], [hx + 9, hy - 9.5], [hx, hy - 8.4]], p.gold); dot(c, hx, hy - 12.2, 1.5, '#ff5a8a'); }
    else K.hairdo(c, hx, hy, 13, hr, 1);
    var mk = [p.accent, '#2b3a67', '#5b2f8a', '#17604c'][v];
    if (v === 3) { R(c, hx - 12.8, hy - 4.2, 25.6, 8.2, 4, alpha('#8ff0ff', 0.55)); K.rrp(c, hx - 12.8, hy - 4.2, 25.6, 8.2, 4); c.lineWidth = 1.5; c.strokeStyle = p.gold; c.stroke(); L(c, hx - 9, hy - 2, hx - 4, hy - 2, 1, 'rgba(255,255,255,0.8)'); K.eyes(c, hx, hy + 0.6, 5.5, 1.7, m); }
    else {
      c.beginPath(); c.moveTo(hx - 13.6, hy - 2.5); c.quadraticCurveTo(hx - 7, hy - 6.5, hx, hy - 3.6); c.quadraticCurveTo(hx + 7, hy - 6.5, hx + 13.6, hy - 2.5 - (v === 0 ? 2.5 : 0));
      c.quadraticCurveTo(hx + 9, hy + 5.6, hx + 3.4, hy + 4.2); c.quadraticCurveTo(hx, hy + 2, hx - 3.4, hy + 4.2); c.quadraticCurveTo(hx - 9, hy + 5.6, hx - 13.6, hy - 2.5 - (v === 0 ? 2.5 : 0)); c.closePath(); F(c, mk);
      K.eyes(c, hx, hy + 0.4, 5.6, 2.1, m, '#ffffff');
    }
    /* arms: one fist on the hip, one punching the sky (0, 2); a double flex (1, 3) */
    var gl = tr, wA = waveA(m);
    if (v % 2 === 0) {
      arm2(c, -13.5, -52, -1, 1.05, 11, -0.55, 10, 6.4, suit, gl, 4);
      var up = m.wave ? wA : 2.25 + m.k * 0.75, h = K.arm(c, 13.5, -52, 1, up, 19, 6.4, suit, gl, 4.4);
      if (!m.wave && m.k > 0.35) { sparkle(c, h[0] + 5, h[1] - 6, 3.2 * m.k, p.gold); sparkle(c, h[0] - 5, h[1] - 8, 2 * m.k, p.snow); }
    } else {
      var fl = 2.75 + m.sw * 0.35 + m.k * 0.2;
      arm2(c, -13.5, -52, -1, 1.5 + m.k * 0.15, 10.5, fl, 10, 6.6, suit, gl, 4.2);
      if (m.wave) K.arm(c, 13.5, -52, 1, wA, 19, 6.4, suit, gl, 4.4); else arm2(c, 13.5, -52, 1, 1.5 + m.k * 0.15, 10.5, 2.75 - m.sw * 0.35 + m.k * 0.2, 10, 6.6, suit, gl, 4.2);
    }
  }, { wide: 1.0, variants: ['star hero in blue', 'bolt hero in red', 'heart hero in violet', 'ring hero in green'] });

  /* ================= pirate: four friendly pirates ================= */
  function parrot(c, x, y, m, p) {
    var b = m.k * 1.5;
    Pg(c, [[x - 2, y - 2], [x - 7, y + 9 + m.sw], [x - 3, y + 8], [x + 1, y - 1]], '#2f8fd8');
    E(c, x, y - 5 - b, 5, 6.6, '#3dbb5e'); E(c, x + 1.2, y - 3.5 - b, 2.8, 4.2, '#ffd23f');
    E(c, x + 0.6, y - 12.5 - b, 4.4, 4.2, '#e8473f');
    Pg(c, [[x + 3.6, y - 14 - b], [x + 8.4, y - 12 - b], [x + 4, y - 9.6 - b]], '#ffb52e');
    dot(c, x + 1.6, y - 13.4 - b, 0.95, INK); dot(c, x + 1.9, y - 13.7 - b, 0.35, '#fff');
    c.save(); c.translate(x - 3.5, y - 7 - b); c.rotate(-0.3 + m.sw * 0.35 - m.k * 0.5); E(c, -1.5, 3, 2.8, 5.6, '#2a9a4c'); c.restore();
  }
  Art.add('character', 'pirate', function (c, m, p) {
    var v = m.v, sk = SKIN[[2, 3, 0, 1][v]], hr = HAIR[[1, 1, 3, 0][v]], coat = [p.accent, p.paper, '#3a6ea5', '#5d4a7a'][v], tro = ['#3b3340', '#2f5d8a', '#4a3a30', '#3b3340'][v];
    var hx = m.sw * 2, hy = -69 + m.k * 2, i, aa = K.armAngles(m, 1.15, 0.75), wd = '#8a5a34', lea = '#6b4226', h, hl;
    if (v === 2) K.hairdo(c, hx, hy, 14, hr, 2);
    /* legs: v3 has a peg leg */
    if (v === 3) {
      OL(c, -6, -27, -6.5, -15, 7.4, tro); OL(c, -6.5, -15, -6.5, -1.5, 2.8, wd); Rn(c, -9.5, -16.5, 6, 2.6, 1, shade(wd, -0.3)); E(c, -6.5, -1.2, 2.6, 1.4, shade(wd, -0.3));
      OL(c, 6, -27, 6.5, -6, 7.4, tro); R(c, 6.5 - 5, -17, 10, 13, 2, lea); R(c, 1, -7.2, 13.6, 7.2, 3.4, lea); Rn(c, 0.6, -18.4, 11.8, 3.2, 1.4, shade(lea, 0.25));
    } else {
      legs(c, tro, lea, { boot: 16, w: 7.4 });
      for (i = -1; i <= 1; i += 2) Rn(c, i * 6.5 - 5.9, -18.2, 11.8, 3.2, 1.4, shade(lea, 0.25));
    }
    /* body */
    if (v === 0) { /* captain's long coat */
      c.beginPath(); c.moveTo(-12.5, -56); c.quadraticCurveTo(-18, -36, -19 + m.sw * 1.5, -14); c.lineTo(-6, -15.5); c.lineTo(-2.5, -28); c.lineTo(2.5, -28); c.lineTo(6, -15.5); c.lineTo(19 + m.sw * 1.5, -14); c.quadraticCurveTo(18, -36, 12.5, -56); c.closePath(); F(c, coat);
      Pg(c, [[-5.5, -56], [5.5, -56], [3.5, -31], [-3.5, -31]], p.paper, true);
      for (i = 0; i < 3; i++) { dot(c, -7.4, -49 + i * 7, 1.5, p.gold); dot(c, 7.4, -49 + i * 7, 1.5, p.gold); }
      Pg(c, [[-5, -56.5], [0, -53], [5, -56.5], [3.6, -47.5], [0, -50.5], [-3.6, -47.5]], '#ffffff');
    } else if (v === 1) { /* striped shirt */
      torso(c, coat, { wt: 12.5, wb: 14, bot: -25 }); c.save(); c.clip(); for (i = 0; i < 6; i++) { c.fillStyle = p.accent; c.fillRect(-18, -54 + i * 6.2, 36, 2.8); } c.restore();
    } else if (v === 2) { /* white shirt, open vest */
      torso(c, '#fbf6ec', { wt: 12.5, wb: 14, bot: -25 });
      Pg(c, [[-12.6, -56], [-4.5, -56], [-6.5, -27], [-14.6, -27]], coat); Pg(c, [[12.6, -56], [4.5, -56], [6.5, -27], [14.6, -27]], coat);
      dot(c, -7.6, -44, 1.2, p.gold); dot(c, -8, -37, 1.2, p.gold); L(c, -2, -53, 2, -49, 0.7, '#b9a98f'); L(c, 2, -53, -2, -49, 0.7, '#b9a98f');
    } else { torso(c, coat, { wt: 13.5, wb: 16, bot: -24 }); Pg(c, [[-4, -57], [4, -57], [0, -47]], sk, true); }
    /* sash and belt */
    Rn(c, -15, -31.5, 30, 5, 2, v === 1 ? p.accent2 : p.gold === coat ? p.accent : v === 0 ? '#2b2118' : p.accent);
    R(c, -3.6, -32.4, 7.2, 6.8, 1.4, p.gold); Rn(c, -1.6, -30.6, 3.2, 3.2, 0.6, '#2b2118');
    if (v !== 0) Pg(c, [[10, -30], [16 + m.sw * 2, -18], [11 + m.sw * 2, -18.5], [8.5, -29]], v === 1 ? p.accent2 : p.accent);
    /* head */
    K.head(c, hx, hy, 13, sk, m, { noMouth: v === 3 });
    if (v === 3) { /* a big beard and an eye patch */
      c.beginPath(); c.moveTo(hx - 12.8, hy + 1.5); c.quadraticCurveTo(hx - 13, hy + 20, hx, hy + 22 + m.k); c.quadraticCurveTo(hx + 13, hy + 20, hx + 12.8, hy + 1.5); c.quadraticCurveTo(hx + 8, hy + 6, hx, hy + 5.2); c.quadraticCurveTo(hx - 8, hy + 6, hx - 12.8, hy + 1.5); c.closePath(); F(c, hr);
      K.mouth(c, hx, hy + 9.5, 5.4, m, '#f3e6d6');
      L(c, hx - 12.4, hy - 6.5, hx + 12.4, hy - 2, 1.1, INK); E(c, hx + 5.5, hy + 0.6, 3.9, 3.5, INK);
    }
    if (v === 0) { /* tricorn */
      K.hairdo(c, hx, hy, 13, hr, 0);
      c.beginPath(); c.moveTo(hx - 20, hy - 8.5); c.quadraticCurveTo(hx - 12, hy - 15, hx - 8, hy - 21); c.quadraticCurveTo(hx, hy - 27, hx + 8, hy - 21); c.quadraticCurveTo(hx + 12, hy - 15, hx + 20, hy - 8.5); c.quadraticCurveTo(hx, hy - 15, hx - 20, hy - 8.5); c.closePath(); F(c, '#2b2a3a');
      c.beginPath(); c.moveTo(hx - 19, hy - 9); c.quadraticCurveTo(hx, hy - 15.5, hx + 19, hy - 9); c.lineWidth = 1.8; c.strokeStyle = p.gold; c.stroke();
      c.save(); c.translate(hx + 6, hy - 20); c.rotate(0.5 + m.sw * 0.2 + m.k * 0.2); E(c, 0, -7, 3, 8.5, p.paper); L(c, 0, 0, 0, -13, 0.6, shade(p.paper, -0.25)); c.restore();
      dot(c, hx - 1, hy - 17, 2.2, p.gold);
    } else if (v === 1 || v === 3) { /* bandana with a knot */
      var bc = v === 1 ? p.accent : p.accent2;
      c.beginPath(); c.arc(hx, hy - 1, 13.4, PI * 1.05, PI * 1.95); c.quadraticCurveTo(hx, hy - 9.5, hx - 13.3, hy - 3); c.closePath(); F(c, bc);
      for (i = 0; i < 5; i++) dot(c, hx - 8 + i * 4, hy - 10 - (i % 2) * 3, 0.95, p.paper);
      c.save(); c.translate(hx - 13, hy - 4); c.rotate(m.sw * 0.3); Pg(c, [[0, 0], [-8, 2.5], [-6.5, 7]], bc); Pg(c, [[0, 0], [-4, 7.5], [0.5, 9]], bc); c.restore(); dot(c, hx - 13, hy - 4, 1.9, shade(bc, -0.2));
      if (v === 1) { c.beginPath(); c.arc(hx + 13.4, hy + 5.5, 2.6, 0, TAU); c.lineWidth = 1.2; c.strokeStyle = p.gold; c.stroke(); }
    } else { /* wide hat with a feather */
      K.hairdo(c, hx, hy, 13, hr, 0);
      E(c, hx, hy - 10.5, 21, 4.6, '#3b2b3a'); c.beginPath(); c.moveTo(hx - 11, hy - 11); c.quadraticCurveTo(hx - 11, hy - 23, hx, hy - 23); c.quadraticCurveTo(hx + 11, hy - 23, hx + 11, hy - 11); c.closePath(); F(c, '#3b2b3a');
      Rn(c, hx - 11, hy - 14.6, 22, 3.2, 1, p.accent);
      c.save(); c.translate(hx - 9, hy - 14); c.rotate(-0.7 + m.sw * 0.22 - m.k * 0.25); E(c, 0, -8.5, 3.6, 10, p.gold); L(c, 0, 0, 0, -16, 0.6, shade(p.gold, -0.3)); c.restore();
    }
    /* arms and what they carry (left hand holds, right hand dances or waves) */
    var slv = v === 2 ? '#fbf6ec' : v === 1 ? p.paper : coat;
    h = K.arm(c, 13.5, -52, 1, aa[1], 17, 6.2, slv, sk, 3.6);
    if (v === 0) { /* spyglass, lifted on the beat */
      hl = K.arm(c, -13.5, -52, -1, 1.7 + m.k * 0.5, 16, 6.2, slv, sk, 3.6);
      c.save(); c.translate(hl[0], hl[1]); c.rotate(-0.5 - m.k * 0.3); R(c, -15, -2.6, 11, 5.2, 1, wd); R(c, -6, -2, 10, 4, 1, p.gold); R(c, -19, -3.4, 5, 6.8, 1.2, p.gold); dot(c, -19.4, 0, 1.6, '#bfe6ff'); c.restore();    } else if (v === 1) { /* parrot on the shoulder, a rolled map */
      hl = K.arm(c, -13.5, -52, -1, aa[0], 17, 6.2, slv, sk, 3.6);
      c.save(); c.translate(hl[0], hl[1]); c.rotate(0.4 + m.sw * 0.2); R(c, -2.6, -10, 5.2, 18, 2.4, '#efdcae'); Rn(c, -2.6, -3, 5.2, 2.4, 0, p.accent); c.restore();
      parrot(c, -15, -56, m, p);
    } else if (v === 2) { /* a wooden cutlass held high */
      hl = K.arm(c, -13.5, -52, -1, 2.2 + m.k * 0.5 + m.sw * 0.15, 17, 6.2, slv, sk, 3.6);
      c.save(); c.translate(hl[0], hl[1]); c.rotate(-0.45 - m.sw * 0.25);
      c.beginPath(); c.moveTo(-1.8, -2); c.lineTo(-1.6, -19); c.quadraticCurveTo(1, -25, 5.5, -26); c.quadraticCurveTo(3.6, -21, 2.6, -2); c.closePath(); F(c, '#dfe6ee');
      R(c, -4.6, -3, 9.6, 2.8, 1.2, p.gold); R(c, -1.5, -0.6, 3, 5.6, 1.2, lea); c.restore();
    } else { /* a small chest under the arm; a gold coin flipped on the beat */
      hl = K.arm(c, -13.5, -52, -1, 0.75, 14, 6.4, slv, sk, 3.6);
      R(c, -25, -44, 15, 10.5, 1.6, wd); c.beginPath(); c.moveTo(-25, -43); c.quadraticCurveTo(-17.5, -51, -10, -43); c.closePath(); F(c, shade(wd, 0.15)); Rn(c, -25.4, -44.2, 15.8, 1.8, 0.5, p.gold); R(c, -19, -44.6, 3, 3.8, 0.8, p.gold);
      dot(c, hl[0], hl[1], 3.6, sk);
      if (!m.wave) { var cy = h[1] - 6 - Math.sin(Math.min(1, (1 - m.k)) * PI) * 9; E(c, h[0], cy, 3.4, 3.4 * Math.abs(Math.cos(m.t * 7)) + 0.6, p.gold); sparkle(c, h[0] + 4, cy - 4, 1.8 + m.k, p.snow); }
    }
  }, { wide: 1.1, variants: ['captain with a spyglass', 'deckhand with a parrot', 'swashbuckler in a feathered hat', 'bearded pirate with a treasure chest'] });

  /* ================= astronaut: four suit colours ================= */
  Art.add('character', 'astronaut', function (c, m, p) {
    var v = m.v, sk = SKIN[[1, 0, 3, 2][v]], hr = HAIR[[1, 3, 1, 0][v]], suit = ['#f4f6fa', '#f59a3e', '#5aa7e8', '#f29ac2'][v], tr = [p.accent, '#3b4a6b', p.gold, '#7a4fb0'][v], gr = '#8e98ab';
    var hx = m.sw * 1.8, hy = -66 + m.k * 2.2, i, aa = K.armAngles(m, 1.3, 0.7), h, hl, lit = (m.n + v) % 2 === 0;
    /* life-support pack (and the jets on 2) */
    if (v === 2 && !m.calm) for (i = -1; i <= 1; i += 2) { c.save(); c.translate(i * 13, -22); c.scale(1, -1); K.flame(c, 0, 0, 6, 13 + m.k * 9, m.t, i); c.restore(); R(c, i * 13 - 4, -27, 8, 6, 2, gr); }
    R(c, -19, -60, 38, 33, 6, shade(suit, -0.16));
    /* legs */
    for (i = -1; i <= 1; i += 2) { OL(c, i * 7, -27, i * 7.6, -8, 10.5, suit); Rn(c, i * 7.4 - 5.3, -17, 10.6, 2.8, 1, tr); R(c, i * 8.4 - 8, -8.6, 16, 8.6, 4, gr); Rn(c, i * 8.4 - 8, -2.6, 16, 2.6, 1.2, shade(gr, -0.25)); }
    /* arms: left one carries */
    h = K.arm(c, 16, -50, 1, aa[1], 16, 9, suit, tr, 5.2);
    hl = K.arm(c, -16, -50, -1, v === 2 ? aa[0] : 1.45 + m.k * 0.3, 16, 9, suit, tr, 5.2);
    torso(c, suit, { wt: 15, wb: 15.5, bot: -24 });
    Rn(c, -15.5, -29.5, 31, 3.6, 1.6, tr);
    R(c, -8, -47, 16, 11, 2.4, '#e9eef5'); dot(c, -4.4, -43.4, 1.6, lit ? '#ff5a5f' : '#7a3a3c'); dot(c, 0, -43.4, 1.6, lit ? '#3d5a4a' : '#5ad1a0'); dot(c, 4.4, -43.4, 1.6, '#ffd23f'); Rn(c, -5.6, -40, 11.2, 1.6, 0.8, gr);
    K.starPath(c, -10.6, -51.5, 2.6, 1.1, 5, 0); c.fillStyle = tr; c.fill();
    for (i = -1; i <= 1; i += 2) R(c, i * 16 - 5.6, -56, 11.2, 7, 3.4, tr);
    /* helmet: collar, shell, face inside, glass */
    R(c, -11, -57.5, 22, 5.4, 2.6, gr);
    E(c, hx, hy - 5, 20, 19.5, suit);
    E(c, hx, hy - 4, 15.6, 15, '#24304f');
    c.save(); c.beginPath(); c.ellipse(hx, hy - 4, 15, 14.4, 0, 0, TAU); c.clip();
    c.fillStyle = '#3a4d7c'; c.fillRect(hx - 16, hy - 20, 32, 32);
    var o = K.ow(); K.ow(0.8);
    if (v === 3) K.hairdo(c, hx, hy - 2, 11.4, hr, 2);
    K.head(c, hx, hy - 2, 10.6, sk, m);
    K.hairdo(c, hx, hy - 2, 10.6, hr, [0, 1, 3, 0][v]);
    K.ow(o); c.restore();
    c.beginPath(); c.arc(hx, hy - 4, 12.4, PI * 1.08, PI * 1.42); c.lineWidth = 2; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke(); dot(c, hx + 9, hy + 4, 1.3, 'rgba(255,255,255,0.6)');
    for (i = -1; i <= 1; i += 2) R(c, hx + i * 19.6 - 2.6, hy - 9, 5.2, 9, 2, tr);
    L(c, hx + 10, hy - 21.5, hx + 13, hy - 30 - m.k * 1.5, 1.1, gr); dot(c, hx + 13, hy - 30.6 - m.k * 1.5, 2.1, lit ? '#ff5a5f' : p.gold); if (lit) dot(c, hx + 13, hy - 30.6 - m.k * 1.5, 4, 'rgba(255,90,95,0.3)');
    /* what the left glove carries */
    if (v === 0) { /* a flag with a star, planted */
      var fx = hl[0] - 1, fw = Math.sin(m.t * 4) * 1.5;
      L(c, fx, -1, fx, -86, 1.6, '#c9d2de');
      c.beginPath(); c.moveTo(fx, -85); c.quadraticCurveTo(fx - 7, -88 + fw, fx - 14, -84); c.lineTo(fx - 14, -72); c.quadraticCurveTo(fx - 7, -76 + fw, fx, -73); c.closePath(); F(c, p.accent2);
      K.starPath(c, fx - 7, -79.5, 3.6, 1.5, 5, 0); c.fillStyle = p.gold; c.fill(); dot(c, hl[0], hl[1], 5.2, tr);
    } else if (v === 1) { /* a caught star */
      var sy = hl[1] - 11 - m.k * 3; dot(c, hl[0] - 2, sy, 9 + m.k * 3, alpha(p.gold, 0.28));
      K.starPath(c, hl[0] - 2, sy, 8.2, 3.7, 5, m.sw * 0.25); F(c, p.gold); dot(c, hl[0] - 3.6, sy - 1.6, 1.3, 'rgba(255,255,255,0.8)'); sparkle(c, hl[0] - 11, sy - 7, 2.2 * (0.5 + m.k), p.snow);
    } else if (v === 3) { /* a ringed-planet balloon */
      var bx = hl[0] - 3 + m.sw * 3, by = hl[1] - 30 - m.k * 2;
      c.beginPath(); c.moveTo(hl[0], hl[1]); c.quadraticCurveTo(hl[0] - 3, hl[1] - 14, bx, by + 8); c.lineWidth = 0.7; c.strokeStyle = '#c9d2de'; c.stroke();
      E(c, bx, by, 8.4, 8.4, p.accent2); c.beginPath(); c.arc(bx, by, 8.4, 0.2, 1.1); c.lineWidth = 2; c.strokeStyle = shade(p.accent2, -0.2); c.stroke();
      c.beginPath(); c.ellipse(bx, by, 13.5, 3.6, -0.35, 0.1, PI - 0.1); c.lineWidth = 2; c.strokeStyle = p.gold; c.stroke(); dot(c, bx - 3, by - 3, 1.8, 'rgba(255,255,255,0.7)');
    }
  }, { wide: 1.15, variants: ['white suit with a flag', 'orange suit with a caught star', 'blue suit with jets', 'pink suit with a planet balloon'] });

  /* ================= chef: four cooks ================= */
  function toque(c, hx, hy, tall, k, sw) {
    var w = '#ffffff', top = hy - 15 - tall, i;
    for (i = -1; i <= 1; i++) E(c, hx + i * 7.5 + sw * (1 + Math.abs(i)) * 0.6, top - (i ? 0 : 3.5) - k * 1.5, 7.6, 7.2, w);
    c.beginPath(); c.moveTo(hx - 11, hy - 11); c.lineTo(hx - 12.5 + sw, top); c.lineTo(hx + 12.5 + sw, top); c.lineTo(hx + 11, hy - 11); c.closePath(); c.fillStyle = w; c.fill();
    for (i = -1; i <= 1; i++) L(c, hx + i * 5, hy - 13, hx + i * 5.6 + sw, top + 1, 0.6, '#d8d4cc');
    R(c, hx - 12, hy - 15, 24, 5.6, 2, w);
  }
  Art.add('character', 'chef', function (c, m, p) {
    var v = m.v, sk = SKIN[[0, 3, 2, 1][v]], hr = HAIR[[0, 1, 3, 1][v]], wh = '#fbfaf5', nk = [p.accent, p.accent2, '#ff8ab8', p.accent][v], tro = ['#4a5568', '#2f3a55', '#6b5a78', '#3f3f46'][v];
    var hx = m.sw * 2, hy = -69 + m.k * 2, i, aa = K.armAngles(m, 1.2, 0.7), h, hl, wA = waveA(m);
    if (v === 2) K.hairdo(c, hx, hy, 13.8, hr, 2);
    legs(c, tro, '#2f2a33', { w: 7.6 });
    for (i = -1; i <= 1; i += 2) { L(c, i * 4.4, -22, i * 4.8, -9, 0.6, shade(tro, 0.25)); L(c, i * 8.4, -22, i * 8.8, -9, 0.6, shade(tro, 0.25)); }
    torso(c, wh, { wt: 13, wb: v === 3 ? 17.5 : 15.5, bot: -22 });
    /* jacket: double row of buttons, or an apron */
    if (v === 0 || v === 1) { L(c, -1, -55, 3, -24, 0.8, '#d8d4cc'); for (i = 0; i < 3; i++) { dot(c, -4.6, -46 + i * 7.4, 1.5, v ? p.gold : '#3b3340'); dot(c, 6.2, -46 + i * 7.4, 1.5, v ? p.gold : '#3b3340'); } }
    else {
      var ap = v === 2 ? '#ffc2d6' : p.paper; R(c, -11, -46, 22, 28, 3, ap); L(c, -8, -46, -6, -56, 1.4, ap); L(c, 8, -46, 6, -56, 1.4, ap);
      if (v === 3) { c.save(); K.rrp(c, -11, -46, 22, 28, 3); c.clip(); for (i = -2; i <= 2; i++) Rn(c, i * 5 - 1, -47, 2, 30, 0, p.accent2); c.restore(); }
      else { K.heartPath(c, 0, -34, 7); c.fillStyle = '#ff5a8a'; c.fill(); }
      Rn(c, -6, -29.5 + (v === 3 ? 0 : 5), 12, 1.2, 0.6, shade(ap, -0.2));
    }
    /* neckerchief */
    Pg(c, [[-7, -57], [7, -57], [1.5, -48.5], [-1.5, -48.5]], nk); Rn(c, -8, -58.6, 16, 3.6, 1.8, nk);
    K.head(c, hx, hy, 13, sk, m);
    if (v === 0) { K.hairdo(c, hx, hy, 13, hr, 0); toque(c, hx, hy, 14, m.k, m.sw); }
    else if (v === 1) { /* a tied cook's cap */
      c.beginPath(); c.arc(hx, hy - 2, 13.5, PI * 1.03, PI * 1.97); c.quadraticCurveTo(hx, hy - 10, hx - 13.4, hy - 3.2); c.closePath(); F(c, nk);
      c.beginPath(); c.moveTo(hx - 12, hy - 9); c.quadraticCurveTo(hx, hy - 23 - m.k, hx + 12, hy - 9); c.closePath(); F(c, nk); Rn(c, hx - 13, hy - 9.6, 26, 3, 1.4, shade(nk, 0.35));
    } else if (v === 2) { K.hairdo(c, hx, hy, 13, hr, 0); for (i = -1; i <= 1; i++) E(c, hx + i * 8 + m.sw, hy - 17 - (i ? 0 : 3) - m.k, 7.4, 6.2, '#ffffff'); R(c, hx - 12, hy - 15, 24, 5, 2, '#ffffff'); }
    else { K.hairdo(c, hx, hy, 13, hr, 0); toque(c, hx, hy, 5, m.k, m.sw);
      c.beginPath(); c.moveTo(hx, hy + 4.4); c.quadraticCurveTo(hx - 4, hy + 2.4, hx - 8.5, hy + 5.6 - m.k); c.quadraticCurveTo(hx - 4, hy + 7.4, hx, hy + 5.4); c.quadraticCurveTo(hx + 4, hy + 7.4, hx + 8.5, hy + 5.6 - m.k); c.quadraticCurveTo(hx + 4, hy + 2.4, hx, hy + 4.4); c.closePath(); c.fillStyle = hr; c.fill(); }
    /* hands at work */
    if (v === 0) { /* bowl and whisk */
      hl = K.arm(c, -13.5, -52, -1, 0.95, 15, 6.4, wh, sk, 3.6);
      var bx = hl[0] - 2, by = hl[1] - 1; c.beginPath(); c.moveTo(bx - 10, by - 5); c.quadraticCurveTo(bx - 9, by + 6, bx, by + 6); c.quadraticCurveTo(bx + 9, by + 6, bx + 10, by - 5); c.closePath(); F(c, p.accent2); E(c, bx, by - 5, 10, 2.6, '#fff3d6'); Rn(c, bx - 8.6, by - 1, 17.2, 1.6, 0.8, shade(p.accent2, 0.35));
      if (m.wave) K.arm(c, 13.5, -52, 1, wA, 17, 6.4, wh, sk, 3.6);
      else { var wa2 = Math.sin(m.t * 12) * 0.35; h = arm2(c, 13.5, -52, 1, 1.0, 10, 2.3 + m.k * 0.3, 10, 6.4, wh, sk, 3.6); c.save(); c.translate(h[0], h[1]); c.rotate(-0.5 + wa2 - m.k * 0.2); L(c, 0, 0, 0, -9, 1.5, '#8a5a34'); c.lineWidth = 0.8; c.strokeStyle = '#aab3c0'; for (i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(0, -14, 1 + Math.abs(i) * 2.4, 5.4, 0, 0, TAU); c.stroke(); } c.restore(); }
    } else if (v === 1) { /* frying pan, the pancake flips on the beat */
      hl = K.arm(c, -13.5, -52, -1, 1.35 + m.k * 0.35, 16, 6.4, wh, sk, 3.6);
      var px = hl[0] - 12, py = hl[1] - 1 - m.k * 1.5, fly = Math.sin(clamp(1 - m.k, 0, 1) * PI) * 15;
      L(c, hl[0] + 2, hl[1], px + 6, py, 2.4, '#3b3340'); R(c, px - 9, py - 1.6, 18, 4.6, 2, '#4a4458'); E(c, px, py - 1.6, 9, 2.2, '#2f2a3a');
      c.save(); c.translate(px, py - 3.5 - fly); c.rotate(fly * 0.22); E(c, 0, 0, 7, 1.9 + Math.abs(Math.sin(fly * 0.22)) * 3.2, '#f0b860'); dot(c, -1.5, -0.3, 1.3, '#fff3c4'); c.restore();
      K.arm(c, 13.5, -52, 1, aa[1], 17, 6.4, wh, sk, 3.6);
    } else if (v === 2) { /* a cupcake on a plate */
      hl = K.arm(c, -13.5, -52, -1, 1.25 + m.k * 0.25, 15, 6.4, wh, sk, 3.6);
      var cx = hl[0] - 4, cy = hl[1] - 4; E(c, cx, cy + 2, 10, 2.2, '#ffffff'); Pg(c, [[cx - 5, cy - 6], [cx + 5, cy - 6], [cx + 3.6, cy + 1.4], [cx - 3.6, cy + 1.4]], p.gold);
      E(c, cx, cy - 7.4, 6.6, 3.6, '#ff9ec2'); E(c, cx, cy - 10.6, 4.4, 3, '#ffb6d2'); E(c, cx, cy - 13.4, 2.4, 2, '#ffc9de'); dot(c, cx, cy - 16 - m.k, 1.7, '#e0283c');
      K.arm(c, 13.5, -52, 1, aa[1], 17, 6.4, wh, sk, 3.6);
    } else { /* pizza dough spun high */
      var up = 2.75 + m.sw * 0.12; hl = K.arm(c, -13.5, -52, -1, up, 17, 6.4, wh, sk, 3.6);
      var dy = hl[1] - 6 - Math.sin(clamp(1 - m.k, 0, 1) * PI) * 7, sq = 2.2 + Math.abs(Math.sin(m.t * 5)) * 1.6; E(c, hl[0], dy, 13, sq, '#f3ddb0'); c.beginPath(); c.ellipse(hl[0], dy, 9.5, sq * 0.6, 0, m.t * 6, m.t * 6 + 1.4); c.lineWidth = 0.8; c.strokeStyle = '#d9b877'; c.stroke();
      K.arm(c, 13.5, -52, 1, m.wave ? wA : Math.max(aa[1], 0.9), 17, 6.4, wh, sk, 3.6);
    }
    for (i = -1; i <= 1; i += 2) Rn(c, i * 13.5 - 3.4, -55.5, 6.8, 5, 2.4, wh);
  }, { wide: 1.0, variants: ['chef with whisk and bowl', 'cook flipping a pancake', 'pastry chef with a cupcake', 'pizza maker spinning dough'] });

  /* ================= gardener: four people in the garden ================= */
  Art.add('character', 'gardener', function (c, m, p) {
    var v = m.v, sk = SKIN[[1, 0, 3, 2][v]], hr = HAIR[[1, 2, 1, 0][v]], shirt = ['#fbf3df', '#f2a65a', '#f4d35e', '#9cc9ea'][v], ov = ['#3f7fb5', '#4d9a63', '#b5562b', '#7a8f4a'][v], well = ['#e0a22c', '#c8443c', '#3d9468', '#3b6ea8'][v], grn = '#3f9a5c';
    var hx = m.sw * 2, hy = -69 + m.k * 2, i, aa = K.armAngles(m, 1.2, 0.7), h, hl;
    if (v === 2) K.hairdo(c, hx, hy, 13.8, hr, 2);
    legs(c, ov, well, { boot: 15, w: 7.8 });
    for (i = -1; i <= 1; i += 2) Rn(c, i * 6.5 - 5.6, -16.6, 11.2, 2.4, 1, shade(well, 0.3));
    torso(c, shirt, { wt: 13, wb: 15, bot: -24 });
    if (v === 0) { c.save(); c.clip(); c.lineWidth = 0.9; c.strokeStyle = alpha(p.accent, 0.55); for (i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 4.5, -60); c.lineTo(i * 4.5, -20); c.stroke(); c.beginPath(); c.moveTo(-20, -40 + i * 4.5); c.lineTo(20, -40 + i * 4.5); c.stroke(); } c.restore(); }
    /* dungarees (0, 2), apron (1), waistcoat (3) */
    if (v === 0 || v === 2) { R(c, -9, -47, 18, 14, 2.4, ov); c.beginPath(); c.moveTo(-15.4, -33); c.lineTo(15.4, -33); c.lineTo(15, -22); c.quadraticCurveTo(0, -19, -15, -22); c.closePath(); F(c, ov); L(c, -7.6, -46, -10, -56, 2.6, ov); L(c, 7.6, -46, 10, -56, 2.6, ov); dot(c, -7, -45, 1.5, p.gold); dot(c, 7, -45, 1.5, p.gold); R(c, -4.5, -42.5, 9, 6, 1.4, shade(ov, 0.14)); K.leaf(c, -1, -36.5, 6, -1.2 + m.sw * 0.2, grn); }
    else if (v === 1) { R(c, -11.5, -45, 23, 27, 3, ov); L(c, -8, -45, -6, -56, 1.5, ov); L(c, 8, -45, 6, -56, 1.5, ov); R(c, -7.5, -33, 15, 9, 2, shade(ov, 0.16)); L(c, 0, -33, 0, -24.5, 0.6, shade(ov, -0.2)); L(c, -4, -33, -4.6, -38, 1.2, '#8a5a34'); Pg(c, [[3, -33], [4, -39], [5.4, -33]], '#c9d2de'); }
    else { Pg(c, [[-13, -56], [-4, -56], [-2, -25], [-15, -25]], ov); Pg(c, [[13, -56], [4, -56], [2, -25], [15, -25]], ov); dot(c, -4.4, -40, 1.2, p.gold); dot(c, -4, -33, 1.2, p.gold); }
    K.head(c, hx, hy, 13, sk, m);
    /* hats */
    if (v === 0) { /* wide straw hat */
      var st = '#eac877'; E(c, hx, hy - 9.5, 22.5, 5, st); c.beginPath(); c.moveTo(hx - 11.5, hy - 10); c.quadraticCurveTo(hx - 11, hy - 23, hx, hy - 23); c.quadraticCurveTo(hx + 11, hy - 23, hx + 11.5, hy - 10); c.closePath(); F(c, st);
      Rn(c, hx - 11.5, hy - 14, 23, 3.4, 1, p.accent); c.lineWidth = 0.6; c.strokeStyle = shade(st, -0.2); c.beginPath(); c.ellipse(hx, hy - 9.5, 17, 3.2, 0, 0.1, PI - 0.1); c.stroke(); K.flower(c, hx + 8.5, hy - 13, 3.4, p.paper, p.gold, m.t * 0.4);
    } else if (v === 1) { K.hairdo(c, hx, hy, 13, hr, 3); c.beginPath(); c.arc(hx, hy - 3, 13.5, PI * 1.12, PI * 1.88); c.lineWidth = 3; c.strokeStyle = p.accent2; c.stroke(); c.beginPath(); c.moveTo(hx - 12, hy - 8); c.quadraticCurveTo(hx, hy - 4, hx + 12, hy - 8); c.quadraticCurveTo(hx + 17, hy - 4, hx, hy - 1.5); c.quadraticCurveTo(hx - 17, hy - 4, hx - 12, hy - 8); c.closePath(); F(c, p.accent2); }
    else if (v === 2) { /* headscarf with a knot */
      var sc = p.accent; c.beginPath(); c.arc(hx, hy - 1, 13.5, PI * 1.0, PI * 2.0); c.quadraticCurveTo(hx, hy - 12, hx - 13.5, hy - 1); c.closePath(); F(c, sc); for (i = 0; i < 6; i++) dot(c, hx - 9 + i * 3.6, hy - 9.5 - (i % 2) * 3, 0.9, p.paper);
      for (i = -1; i <= 1; i += 2) { c.save(); c.translate(hx + 2, hy - 14.5); c.rotate(i * 0.9 + m.sw * 0.25); E(c, 0, -4.4, 2.4, 5, sc); c.restore(); } dot(c, hx + 2, hy - 14.5, 2, shade(sc, -0.2));
    } else { /* bucket hat and a tidy beard */
      c.beginPath(); c.moveTo(hx - 12.4, hy + 3); c.quadraticCurveTo(hx - 11, hy + 15.5, hx, hy + 16 + m.k * 0.6); c.quadraticCurveTo(hx + 11, hy + 15.5, hx + 12.4, hy + 3); c.quadraticCurveTo(hx + 7, hy + 4, hx + 5.5, hy + 3.4); c.lineTo(hx - 5.5, hy + 3.4); c.quadraticCurveTo(hx - 7, hy + 4, hx - 12.4, hy + 3); c.closePath(); F(c, hr);
      K.mouth(c, hx, hy + 7.5, 5, m, '#f6e7d2');
      var bh = '#d9c9a0'; c.beginPath(); c.moveTo(hx - 17.5, hy - 6.5); c.quadraticCurveTo(hx - 12, hy - 9, hx - 10.5, hy - 20); c.quadraticCurveTo(hx, hy - 25, hx + 10.5, hy - 20); c.quadraticCurveTo(hx + 12, hy - 9, hx + 17.5, hy - 6.5); c.quadraticCurveTo(hx, hy - 11.5, hx - 17.5, hy - 6.5); c.closePath(); F(c, bh); Rn(c, hx - 11, hy - 14.6, 22, 2.6, 1, p.accent2);
    }
    /* right arm dances or waves; the left hand carries */
    K.arm(c, 13.5, -52, 1, aa[1], 17, 6.2, shirt, sk, 3.6);
    if (v === 0) { /* watering can, tipped on the beat, drops falling */
      hl = K.arm(c, -13.5, -52, -1, 1.25, 15, 6.2, shirt, sk, 3.6);
      c.save(); c.translate(hl[0] - 6, hl[1] + 3); c.rotate(-0.25 - m.k * 0.45);
      c.beginPath(); c.arc(4, -7, 6, PI, 0); c.lineWidth = 1.8; c.strokeStyle = shade(p.accent2, -0.3); c.stroke();
      Pg(c, [[-6, -3], [-17, -9], [-18, -6.6], [-6, 2]], p.accent2); R(c, -7, -7, 14, 13, 2, p.accent2); E(c, -18.4, -8, 2.4, 3.4, shade(p.accent2, 0.25), 0.5); Rn(c, -7, -3, 14, 1.6, 0, shade(p.accent2, 0.3)); c.restore();
      for (i = 0; i < 4; i++) { var f = frac(m.t * 1.6 + i * 0.25), dx = hl[0] - 24 - i * 1.5 - f * 3, dy = hl[1] - 3 + f * f * 26; if (dy < -1) E(c, dx, dy, 1.1, 1.7, 'rgba(120,200,255,0.9)'); }
    } else if (v === 1) { /* a potted flower that nods */
      hl = K.arm(c, -13.5, -52, -1, 1.2 + m.k * 0.2, 15, 6.2, shirt, sk, 3.6);
      var px = hl[0] - 4, py = hl[1] + 1, fx = px + m.sw * 2.5, fy = py - 21 - m.k * 2.5;
      c.beginPath(); c.moveTo(px, py - 6); c.quadraticCurveTo(px - 1, py - 14, fx, fy); c.lineWidth = 1.5; c.strokeStyle = grn; c.stroke(); K.leaf(c, px, py - 10, 7, -0.5, grn); K.leaf(c, px, py - 12, 7, PI + 0.5, grn);
      K.flower(c, fx, fy, 6.4, p.accent, p.gold, m.t * 0.5);
      Pg(c, [[px - 7, py - 6], [px + 7, py - 6], [px + 5, py + 5], [px - 5, py + 5]], '#c8693c'); R(c, px - 8, py - 8, 16, 3.6, 1.4, '#d97b4a');
    } else if (v === 2) { /* a bunch of carrots */
      hl = K.arm(c, -13.5, -52, -1, 1.5 + m.k * 0.4, 15, 6.2, shirt, sk, 3.6);
      for (i = -1; i <= 1; i++) { c.save(); c.translate(hl[0], hl[1] + 1); c.rotate(i * 0.3 + m.sw * 0.12); K.leaf(c, 0, -1, 9, -PI / 2 - 0.3, grn); K.leaf(c, 0, -1, 9, -PI / 2 + 0.3, '#57b36f'); Pg(c, [[-2.6, 0], [2.6, 0], [0.3, 15]], '#f08a2c'); L(c, -1.2, 4, 0.8, 4.4, 0.5, '#c96a1a'); L(c, -0.6, 8, 0.8, 8.3, 0.5, '#c96a1a'); c.restore(); }
      dot(c, hl[0], hl[1], 3.6, sk);
    } else { /* a tall sunflower */
      hl = K.arm(c, -13.5, -52, -1, 1.3, 15, 6.2, shirt, sk, 3.6);
      var sx = hl[0] - 1, tx = sx + m.sw * 3.5, ty = -84 - m.k * 2;
      c.beginPath(); c.moveTo(sx, -1); c.quadraticCurveTo(sx - 1, -50, tx, ty); c.lineWidth = 3; c.strokeStyle = shade(grn, -0.3); c.stroke(); c.lineWidth = 1.8; c.strokeStyle = grn; c.stroke();
      K.leaf(c, sx, -24, 9, PI + 0.5 + m.sw * 0.1, grn); K.leaf(c, sx, -58, 8, PI + 0.6, '#57b36f');
      for (i = 0; i < 10; i++) { var a = i / 10 * TAU + m.t * 0.3; E(c, tx + Math.cos(a) * 7.4, ty + Math.sin(a) * 7.4, 3.6, 2.4, '#ffc928', a); } E(c, tx, ty, 5.6, 5.6, '#6b4226'); dot(c, tx - 1.4, ty - 1.4, 1.6, '#8a5a34');
      dot(c, hl[0], hl[1], 3.6, sk);
    }
  }, { wide: 1.15, variants: ['straw hat and watering can', 'apron and a potted flower', 'headscarf and carrots', 'bucket hat and a sunflower'] });

  /* ================= knitter: the grandparents' knitting circle (0, 2 grandmas; 1, 3 grandpas) ================= */
  var GREY = ['#dcd8d3', '#f1eee9', '#f7f4ef', '#c9c4bd'];
  function specs(c, hx, hy, round, col) {
    var i; c.lineWidth = 0.9; c.strokeStyle = col;
    for (i = -1; i <= 1; i += 2) { if (round) { c.beginPath(); c.arc(hx + i * 5.5, hy + 0.6, 3.9, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fill(); c.stroke(); } else { K.rrp(c, hx + i * 5.5 - 4, hy - 1.6, 8, 5.2, 1.6); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fill(); c.stroke(); } }
    L(c, hx - 1.7, hy + 0.2, hx + 1.7, hy + 0.2, 0.9, col);
  }
  Art.add('character', 'knitter', function (c, m, p) {
    var v = m.v, sk = SKIN[[0, 2, 3, 1][v]], hr = GREY[v], top = [p.accent, '#4d7a5c', '#8a4fc0', '#2f5d8a'][v], yarn = [p.gold, p.accent, '#ff8ab8', p.accent2][v], y2 = [p.paper, p.gold, p.paper, p.gold][v], gran = v % 2 === 0;
    var hx = m.sw * 1.6, hy = -65 + m.k * 1.6, i, h, hl, wA = waveA(m), slip = ['#c8443c', '#6b4a2e', '#5a4a8a', '#7a3b3b'][v];
    /* the ball of yarn at the feet, its thread running up to the needles */
    var bx = 22 + m.sw * 1.2, by = -6.5, kx = m.wave ? -8 : 0, ky = -37 - m.k * 1.5;
    c.beginPath(); c.moveTo(bx - 3, by - 3); c.bezierCurveTo(bx - 8, -22, kx + 14, ky + 22, kx + 5, ky + 6); c.lineWidth = 0.9; c.strokeStyle = shade(yarn, -0.1); c.stroke();
    E(c, bx, by, 6.6, 6.4, yarn); c.lineWidth = 0.7; c.strokeStyle = shade(yarn, -0.25); for (i = 0; i < 3; i++) { c.beginPath(); c.ellipse(bx, by, 6, 2 + i * 1.6, 0.6 + i * 0.5 + m.sw * 0.3, 0, PI); c.stroke(); } dot(c, bx - 2, by - 2.4, 1.4, shade(yarn, 0.45));
    /* legs: long skirt and slippers, or trousers and slippers */
    if (gran) {
      for (i = -1; i <= 1; i += 2) { L(c, i * 5.5, -12, i * 5.5, -5, 4.4, sk); R(c, i * 6.6 - 6, -6.4, 12, 6.4, 3, slip); dot(c, i * 7.6, -5.4, 1.7, p.paper); }
      var sc = v === 0 ? '#5d6b8a' : '#3f6b6b'; c.beginPath(); c.moveTo(-13.5, -30); c.lineTo(13.5, -30); c.lineTo(17.5 + m.sw * 1.5, -9.5); c.quadraticCurveTo(m.sw * 1.5, -6.5, -17.5 + m.sw * 1.5, -9.5); c.closePath(); F(c, sc);
      for (i = -2; i <= 2; i++) L(c, i * 4.6, -27, i * 6 + m.sw * 1.5, -10.5, 0.6, shade(sc, -0.18)); c.beginPath(); c.moveTo(-16.6 + m.sw * 1.5, -12.5); c.quadraticCurveTo(m.sw * 1.5, -9.5, 16.6 + m.sw * 1.5, -12.5); c.lineWidth = 1.2; c.strokeStyle = shade(sc, 0.3); c.stroke();
    } else { legs(c, v === 1 ? '#7a6a58' : '#565f73', slip, { w: 7.6, top: -26 }); for (i = -1; i <= 1; i += 2) { L(c, i * 7.7 - 3.6, -5.2, i * 7.7 + 3.6, -3, 0.7, shade(slip, 0.4)); L(c, i * 7.7 + 3.6, -5.2, i * 7.7 - 3.6, -3, 0.7, shade(slip, 0.4)); } }
    /* cardigan, argyle vest, shawl, chunky jumper */
    torso(c, v === 1 ? '#f4efe4' : top, { wt: 13, wb: 16.5, top: -52, bot: -24 });
    if (v === 0) { Pg(c, [[-3.4, -53.5], [3.4, -53.5], [1.6, -26], [-1.6, -26]], '#fbf6ec', true); L(c, 3, -52, 2, -25, 0.8, shade(top, -0.3)); for (i = 0; i < 3; i++) dot(c, 5.6, -46 + i * 7.5, 1.4, p.gold); R(c, -13, -34, 7, 6, 1.4, shade(top, 0.14)); dot(c, -4.5, -53, 2, '#f7f4ef'); dot(c, 4.5, -53, 2, '#f7f4ef'); dot(c, 0, -52, 2, '#f7f4ef'); }
    else if (v === 1) { c.beginPath(); c.moveTo(-10.5, -52.5); c.lineTo(0, -41); c.lineTo(10.5, -52.5); c.quadraticCurveTo(16.5, -40, 16, -25); c.quadraticCurveTo(0, -21, -16, -25); c.quadraticCurveTo(-16.5, -40, -10.5, -52.5); c.closePath(); F(c, top); c.save(); c.clip(); for (i = -2; i <= 2; i++) Pg(c, [[i * 7.4, -39], [i * 7.4 + 3.7, -33], [i * 7.4, -27], [i * 7.4 - 3.7, -33]], i % 2 ? p.gold : shade(top, 0.4), true); c.restore(); K.bow(c, 0, -51, 9, p.accent); }
    else if (v === 2) { c.beginPath(); c.moveTo(-14, -53.5); c.quadraticCurveTo(0, -48, 14, -53.5); c.quadraticCurveTo(21, -42, 17.5, -33); c.lineTo(0, -24 + m.k); c.lineTo(-17.5, -33); c.quadraticCurveTo(-21, -42, -14, -53.5); c.closePath(); F(c, shade(top, 0.3)); for (i = -3; i <= 3; i++) L(c, i * 5, -32.5 + Math.abs(i) * -2.2 + 7.5, i * 5.4, -29.4 + Math.abs(i) * -2.2 + 7.5, 0.8, shade(top, 0.55)); dot(c, 0, -47.5, 2.3, p.gold); }
    else { for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-15, -46 + i * 6); c.quadraticCurveTo(0, -43.5 + i * 6, 15, -46 + i * 6); c.lineWidth = 0.9; c.strokeStyle = shade(top, i % 2 ? 0.3 : -0.2); c.stroke(); } Rn(c, -16, -28, 32, 4, 1.6, shade(top, 0.22)); R(c, -8, -55, 16, 5, 2.4, shade(top, 0.22)); }
    /* head */
    K.head(c, hx, hy, 12.6, sk, m, { noMouth: v === 3 });
    L(c, hx - 8, hy + 5.6, hx - 6, hy + 6.6, 0.5, shade(sk, -0.25)); L(c, hx + 8, hy + 5.6, hx + 6, hy + 6.6, 0.5, shade(sk, -0.25));
    if (v === 0) { K.hairdo(c, hx, hy, 12.6, hr, 3); L(c, hx - 5, hy - 19, hx + 6, hy - 13, 0.9, p.accent2); L(c, hx + 5, hy - 19.5, hx - 5, hy - 13, 0.9, p.gold); specs(c, hx, hy, true, '#8a5a34'); }
    else if (v === 1) { for (i = -1; i <= 1; i += 2) { E(c, hx + i * 11.6, hy - 3.5, 4.2, 5.6, hr); E(c, hx + i * 10, hy - 8.5, 3.4, 3.4, hr); } dot(c, hx - 4, hy - 9.5, 1.5, 'rgba(255,255,255,0.35)');
      c.beginPath(); c.moveTo(hx, hy + 3); c.quadraticCurveTo(hx - 5, hy + 1.6, hx - 9, hy + 6.2 - m.k); c.quadraticCurveTo(hx - 4, hy + 7, hx, hy + 5); c.quadraticCurveTo(hx + 4, hy + 7, hx + 9, hy + 6.2 - m.k); c.quadraticCurveTo(hx + 5, hy + 1.6, hx, hy + 3); c.closePath(); F(c, hr); specs(c, hx, hy, false, '#3b3340'); }
    else if (v === 2) { K.hairdo(c, hx, hy, 12.8, hr, 1); for (i = -1; i <= 1; i += 2) E(c, hx + i * 12, hy - 3, 3.6, 4.4, hr); dot(c, hx - 12.6, hy + 4.6, 1.4, p.gold); dot(c, hx + 12.6, hy + 4.6, 1.4, p.gold); specs(c, hx, hy, true, p.accent); }
    else { /* white beard, flat cap */
      c.beginPath(); c.moveTo(hx - 12.4, hy + 1.5); c.quadraticCurveTo(hx - 12, hy + 15, hx, hy + 17 + m.k * 0.6); c.quadraticCurveTo(hx + 12, hy + 15, hx + 12.4, hy + 1.5); c.quadraticCurveTo(hx + 7, hy + 5, hx, hy + 4.2); c.quadraticCurveTo(hx - 7, hy + 5, hx - 12.4, hy + 1.5); c.closePath(); F(c, '#f4f1ec'); K.mouth(c, hx, hy + 8.5, 5, m, '#8a7f76');
      var cap = '#8a6f52'; c.beginPath(); c.moveTo(hx - 13.4, hy - 6); c.quadraticCurveTo(hx - 13, hy - 17, hx + 1, hy - 16.6); c.quadraticCurveTo(hx + 14, hy - 16, hx + 13.6, hy - 7); c.quadraticCurveTo(hx, hy - 10.5, hx - 13.4, hy - 6); c.closePath(); F(c, cap); c.beginPath(); c.moveTo(hx - 14, hy - 6.4); c.quadraticCurveTo(hx - 22, hy - 6, hx - 19.5, hy - 3.2); c.quadraticCurveTo(hx - 12, hy - 5, hx - 6, hy - 8); c.closePath(); F(c, shade(cap, -0.15)); dot(c, hx + 1, hy - 15.6, 1.3, shade(cap, 0.3));
    }
    /* hands: needles click on the beat; the knitting hangs below and swings */
    var slv = v === 1 ? '#f4efe4' : v === 2 ? shade(top, 0.3) : top, cl = 0.55 + m.k * 0.35 + Math.sin(m.t * 10) * 0.05;
    hl = arm2(c, -13.5, -49, -1, 0.4, 9.5, -0.95 + m.k * 0.15, 9.5, 6.2, slv, sk, 3.3);
    if (m.wave) h = K.arm(c, 13.5, -49, 1, wA, 16, 6.2, slv, sk, 3.3); else h = arm2(c, 13.5, -49, 1, 0.4, 9.5, -0.95 + m.k * 0.15, 9.5, 6.2, slv, sk, 3.3);
    var len = [24, 9, 8, 15][v], w = [9, 9, 8, 15][v], sx = m.sw * 2.4;
    c.save(); c.translate(kx, ky);
    if (v === 2) { c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.lineTo(w / 2 + sx * 0.4, len * 0.55); c.quadraticCurveTo(w / 2 + sx, len + 2, sx, len + 2); c.quadraticCurveTo(-w / 2 + sx, len + 2, -w / 2 + sx * 0.4, len * 0.55); c.closePath(); F(c, yarn); Rn(c, -w / 2, 0, w, 2.6, 0.6, y2); }
    else { Pg(c, [[-w / 2, 0], [w / 2, 0], [w / 2 + sx, len], [-w / 2 + sx, len]], yarn); c.save(); c.clip(); for (i = 0; i < 6; i++) Rn(c, -12, 3 + i * (v === 0 ? 6 : 4.6), 30, v === 0 ? 3 : 1.6, 0, y2); c.restore(); if (v === 0) for (i = -2; i <= 2; i++) L(c, i * 2 + sx, len, i * 2 + sx, len + 3, 0.7, y2); if (v === 3) { K.heartPath(c, sx * 0.5, len * 0.55, 6); c.fillStyle = p.accent; c.fill(); } }
    for (i = -3; i <= 3; i++) dot(c, i * w / 7, 0, 0.9, shade(yarn, -0.2));
    for (i = -1; i <= 1; i += 2) { if (m.wave && i > 0) continue; c.save(); c.translate(i * (w / 2 + 1.5), 0.5); c.rotate(i * (PI / 2 - cl)); L(c, 0, 6, 0, -17, 1.9, '#5a4632'); L(c, 0, 6, 0, -17, 1.1, '#e9d9b8'); dot(c, 0, 6.6, 1.6, p.accent); c.restore(); }
    if (m.wave) L(c, w / 2 + 1, 0.5, -w / 2 - 6, -4, 1.1, '#e9d9b8');
    c.restore();
    dot(c, hl[0], hl[1], 3.3, sk); if (!m.wave) dot(c, h[0], h[1], 3.3, sk);
  }, { wide: 1.05, variants: ['grandma knitting a long scarf', 'grandpa in an argyle vest', 'grandma in a shawl knitting a hat', 'grandpa in a flat cap knitting a jumper'] });
});
