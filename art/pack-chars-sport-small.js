/* Send a Carol art pack: sport and small characters (athlete, sporty, tot, stork, bug, hummingbird). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var SKIN = ['#f6cfa8', '#e3ac7c', '#b9774a', '#7c4a2d'], HAIR = ['#6a3d22', '#221a18', '#d49a3a', '#a0452a'], INK = '#2b2118';

  /* ---------- shared pieces ---------- */
  function limb(c, x1, y1, x2, y2, w, col) { if (K.ow() > 0) L(c, x1, y1, x2, y2, w + K.ow() * 1.6, shade(col, -0.34)); L(c, x1, y1, x2, y2, w, col); }
  function hop(k) { return 4 * k * (1 - k); } /* 0 on the beat, up fast, back down before the next one */
  /* a sports person's legs. o: skin, pants (a long leg's colour, or none for bare legs), sock, sockH (share of the shin), shoe, sole, lift [left, right] 0..1, blade */
  function legs(c, o) {
    var i;
    for (i = -1; i <= 1; i += 2) {
      var lf = o.lift ? o.lift[i < 0 ? 0 : 1] : 0, kx = i * (6.2 + 3.5 * lf), ky = -17 - lf * 5, fx = i * (6.8 + 1.5 * lf), fy = -6 - lf * 10 - (o.blade ? 1.8 : 0), lc = o.pants || o.skin;
      limb(c, i * 6, -28, kx, ky, 7.4, lc); limb(c, kx, ky, fx, fy, 6.6, lc);
      if (o.sock) { var sh = 1 - (o.sockH || 0.5); limb(c, kx + (fx - kx) * sh, ky + (fy - ky) * sh, fx, fy, 6.9, o.sock); if (o.band) L(c, kx + (fx - kx) * (sh + 0.12) - 3, ky + (fy - ky) * (sh + 0.12), kx + (fx - kx) * (sh + 0.12) + 3, ky + (fy - ky) * (sh + 0.12), 1.6, o.band); }
      R(c, fx - 6.3 + i * 1.4, fy - 1.5, 12.6, 7.2, 3.4, o.shoe);
      L(c, fx - 4.4 + i * 1.4, fy + 4.7, fx + 4.4 + i * 1.4, fy + 4.7, 1.3, o.sole || '#ffffff');
      if (o.lace) { L(c, fx - 1.5 + i * 1.4, fy + 0.6, fx + 1.5 + i * 1.4, fy + 0.6, 0.8, o.lace); L(c, fx - 1.5 + i * 1.4, fy + 2.2, fx + 1.5 + i * 1.4, fy + 2.2, 0.8, o.lace); }
      if (o.blade) { L(c, fx - 6.5 + i * 1.4, fy + 7.4, fx + 7.2 + i * 1.4, fy + 7.4, 1.3, '#dfe6ee'); L(c, fx - 3.5 + i * 1.4, fy + 5.6, fx - 3.5 + i * 1.4, fy + 7.2, 1, '#aab4c2'); L(c, fx + 4 + i * 1.4, fy + 5.6, fx + 4 + i * 1.4, fy + 7.2, 1, '#aab4c2'); }
    }
  }
  function shorts(c, col, len, stripe) {
    var y = -31 + len;
    Pg(c, [[-13.5, -32], [13.5, -32], [15, y], [1.6, y], [0, y - 4], [-1.6, y], [-15, y]], col);
    if (stripe) { L(c, -12.6, -30, -13.6, y - 1.2, 1.5, stripe); L(c, 12.6, -30, 13.6, y - 1.2, 1.5, stripe); }
  }
  function torsoPath(c, w) { w = w || 1; c.beginPath(); c.moveTo(-13 * w, -56); c.quadraticCurveTo(-18 * w, -41, -15.5, -27); c.quadraticCurveTo(0, -24, 15.5, -27); c.quadraticCurveTo(18 * w, -41, 13 * w, -56); c.closePath(); }
  /* an arm with a short (or long) sleeve; returns the hand */
  function sarm(c, sx, sy, s, a, skin, sleeve, sl, hand) {
    var h = K.arm(c, sx, sy, s, a, 17, 5.8, skin, hand || skin, hand ? 4.4 : 3.5);
    if (sleeve) K.arm(c, sx, sy, s, a, sl || 7, 7.8, sleeve);
    return h;
  }
  function waveA(m) { return 2.55 + Math.sin(m.t * 9) * 0.32; }
  function soccerBall(c, x, y, r, rot) {
    var i; E(c, x, y, r, r, '#ffffff'); c.save(); c.translate(x, y); c.rotate(rot);
    var pts = []; for (i = 0; i < 5; i++) pts.push([Math.cos(i / 5 * TAU - PI / 2) * r * 0.36, Math.sin(i / 5 * TAU - PI / 2) * r * 0.36]);
    Pg(c, pts, '#2b2b33', true);
    for (i = 0; i < 5; i++) { var a = i / 5 * TAU - PI / 2; L(c, Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, 0.7, '#2b2b33'); c.beginPath(); c.arc(0, 0, r * 0.93, a - 0.28, a + 0.28); c.lineWidth = r * 0.24; c.lineCap = 'butt'; c.strokeStyle = '#2b2b33'; c.stroke(); c.lineCap = 'round'; }
    c.restore(); dot(c, x - r * 0.35, y - r * 0.4, r * 0.2, 'rgba(255,255,255,0.8)');
  }
  function basketBall(c, x, y, r, rot) {
    var d = '#7a3a12'; E(c, x, y, r, r, '#ee8434'); c.save(); c.translate(x, y); c.rotate(rot); c.lineWidth = 0.8; c.strokeStyle = d;
    c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.moveTo(0, -r); c.lineTo(0, r); c.stroke();
    c.beginPath(); c.arc(-r * 1.25, 0, r * 0.95, -0.8, 0.8); c.stroke(); c.beginPath(); c.arc(r * 1.25, 0, r * 0.95, PI - 0.8, PI + 0.8); c.stroke();
    c.restore(); dot(c, x - r * 0.35, y - r * 0.42, r * 0.2, 'rgba(255,255,255,0.55)');
  }
  function smallBall(c, x, y, r, col, seam) {
    E(c, x, y, r, r, col); c.lineWidth = 0.6; c.strokeStyle = seam;
    c.beginPath(); c.arc(x - r * 1.1, y, r * 0.9, -0.75, 0.75); c.stroke(); c.beginPath(); c.arc(x + r * 1.1, y, r * 0.9, PI - 0.75, PI + 0.75); c.stroke();
  }
  function ponytail(c, hx, hy, col, m, s) { c.save(); c.translate(hx + s * 11, hy - 7); c.rotate(s * (-0.5 + m.sw * 0.3 * s - m.k * 0.25)); E(c, s * 3, 9, 4.8, 11, col); c.restore(); E(c, hx + s * 11.5, hy - 7, 2.4, 2.4, shade(col, 0.35)); }

  /* ---------- athlete: soccer, basketball, baseball, tennis ---------- */
  Art.add('character', 'athlete', function (c, m, p) {
    var v = m.v, hx = m.sw * 2, hy = -70 + m.k * 2, aa = K.armAngles(m, 1.1, 0.6), k = m.k, i, h, g, sk, hr, a;
    if (v === 0) { /* soccer: keeps the ball up off the right boot */
      sk = SKIN[1]; hr = HAIR[1]; var j = p.accent;
      legs(c, { skin: sk, sock: j, sockH: 0.8, band: p.paper, shoe: '#2b2b33', sole: p.gold, lift: [0, k * 0.75] });
      shorts(c, '#f7f4ee', 11, j);
      sarm(c, -14, -51, -1, aa[0], sk, j); sarm(c, 14, -51, 1, aa[1], sk, j);
      torsoPath(c); F(c, j); c.save(); c.clip(); c.fillStyle = p.paper; c.fillRect(-4.5, -58, 9, 34); c.fillStyle = shade(j, -0.2); c.fillRect(-20, -29.5, 40, 6); c.restore();
      Pg(c, [[-5.5, -57], [5.5, -57], [0, -50.5]], sk); L(c, -5.5, -57, 0, -50.5, 1.4, p.gold); L(c, 5.5, -57, 0, -50.5, 1.4, p.gold);
      K.head(c, hx, hy, 13, sk, m); K.hairdo(c, hx, hy, 13, hr, 0);
      for (i = -1; i <= 1; i++) E(c, hx + i * 4.5, hy - 13.5 - (i ? 0 : 1.5), 3.4, 3, hr); /* a messy fringe */
      soccerBall(c, 21 + m.sw * 2.5, -9.5 - k * 6 - hop(k) * 26, 7, m.t * 2.2);
    } else if (v === 1) { /* basketball: dribbles on the beat */
      sk = SKIN[3]; hr = HAIR[1]; g = p.accent2;
      legs(c, { skin: sk, sock: '#ffffff', sockH: 0.42, band: g, shoe: '#ffffff', sole: p.accent, lace: p.accent });
      shorts(c, g, 16, p.paper);
      var ra = m.wave ? waveA(m) : 0.85 - k * 0.3, la = m.wave ? 0.5 : aa[0];
      h = K.arm(c, 14, -51, 1, ra, 17, 5.8, sk, sk, 3.5); g = K.arm(c, -14, -51, -1, la, 17, 5.8, sk, sk, 3.5);
      for (i = -1; i <= 1; i += 2) { a = i < 0 ? la : ra; var wx = i * 14 + i * Math.sin(a) * 13, wy = -51 + Math.cos(a) * 13; L(c, wx - 2.4, wy, wx + 2.4, wy, 3, p.paper); } /* wristbands */
      torsoPath(c, 0.92); F(c, p.accent2); c.save(); c.clip(); c.fillStyle = p.paper; c.fillRect(-20, -34, 40, 2.6); c.fillRect(-20, -30, 40, 1.2); c.restore();
      c.beginPath(); c.arc(0, -57, 6.4, 0.1 * PI, 0.9 * PI); c.lineWidth = 1.8; c.strokeStyle = p.paper; c.stroke();
      K.starPath(c, 0, -43, 4.6, 2.1, 5, 0); c.fillStyle = p.gold; c.fill();
      K.head(c, hx, hy, 13, sk, m);
      for (i = -3; i <= 3; i++) E(c, hx + i * 4.2, hy - 12.5 + Math.abs(i) * 1.5 - (i % 2 ? 1.6 : 0), 4.6, 4.6, hr); for (i = -2; i <= 2; i++) E(c, hx + i * 4.4, hy - 17.5 + Math.abs(i) * 1.2, 4.4, 4.2, hr);
      R(c, hx - 12.6, hy - 10.5, 25.2, 4, 2, p.gold);
      if (m.wave) basketBall(c, g[0] - 1, g[1] - 5, 8, 0.4); else { var fl = -8; basketBall(c, h[0] + 3, fl - (1 - k) * (fl - (h[1] + 8.5)), 8, m.t * 3); }
    } else if (v === 2) { /* baseball: bat on the shoulder, a ball tossed on the beat */
      sk = SKIN[0]; hr = HAIR[3]; g = p.accent2;
      legs(c, { skin: sk, pants: '#ecebe6', sock: g, sockH: 0.62, shoe: '#2b2b33', sole: '#ffffff' });
      shorts(c, '#ecebe6', 9); L(c, -13.5, -31, 13.5, -31, 2.4, '#3a3038'); Rn(c, -1.8, -32.4, 3.6, 2.8, 0.6, p.gold);
      var lh = sarm(c, -14, -51, -1, 2.05, sk, g, 10);
      c.save(); c.translate(lh[0], lh[1]); c.rotate(-0.42 + m.sw * 0.09); /* the bat */
      c.beginPath(); c.moveTo(-1.2, 3); c.lineTo(-1.3, -12); c.quadraticCurveTo(-3.4, -22, -3.4, -34); c.quadraticCurveTo(0, -38.5, 3.4, -34); c.quadraticCurveTo(3.4, -22, 1.3, -12); c.lineTo(1.2, 3); c.closePath(); F(c, '#dba862');
      L(c, -1.4, -30, -1.4, -20, 0.8, 'rgba(255,255,255,0.5)'); E(c, 0, 3.6, 2.4, 1.5, '#b9813f'); L(c, -1.3, -3, 1.3, -3, 1, '#3a3038'); L(c, -1.3, -6, 1.3, -6, 1, '#3a3038'); c.restore();
      c.beginPath(); c.arc(lh[0], lh[1], 3.5, 0, TAU); F(c, sk);
      h = sarm(c, 14, -51, 1, m.wave ? waveA(m) : 1.15 + k * 0.5, sk, g, 10);
      torsoPath(c); F(c, '#f7f5ef'); c.save(); c.clip(); for (i = -4; i <= 4; i++) L(c, i * 4 + 2, -58, i * 4 + 2, -24, 0.5, alpha(g, 0.55)); c.restore();
      L(c, 0, -55, 0, -27, 0.8, shade('#f7f5ef', -0.25)); for (i = 0; i < 3; i++) dot(c, 0, -49 + i * 7, 1.1, g);
      R(c, -6.5, -58.5, 13, 4.2, 2.1, g);
      ponytail(c, hx, hy, hr, m, -1);
      K.head(c, hx, hy, 13, sk, m);
      E(c, hx - 12.3, hy - 1, 2.6, 4.4, hr); E(c, hx + 12.3, hy - 1, 2.6, 4.4, hr);
      c.beginPath(); c.moveTo(hx - 13.4, hy - 4.5); c.quadraticCurveTo(hx - 13.5, hy - 18.5, hx, hy - 18.5); c.quadraticCurveTo(hx + 13.5, hy - 18.5, hx + 13.4, hy - 4.5); c.closePath(); F(c, g);
      R(c, hx - 5, hy - 7.6, 23, 4.4, 2.2, shade(g, -0.18)); E(c, hx, hy - 18.6, 1.7, 1.2, shade(g, 0.3)); L(c, hx, hy - 17, hx, hy - 8, 0.6, shade(g, -0.3));
      if (!m.wave) smallBall(c, h[0] + 1, h[1] - 6.5 - hop(k) * 24, 4, '#ffffff', '#d23a3a');
    } else { /* tennis: a ball bounced on the strings */
      sk = SKIN[2]; hr = HAIR[1]; g = p.accent;
      legs(c, { skin: sk, sock: '#ffffff', sockH: 0.3, shoe: '#ffffff', sole: g, lace: g });
      a = m.wave ? waveA(m) : 1.5 - k * 0.35 - m.sw * 0.12;
      h = K.arm(c, 14, -51, 1, a, 16, 5.6, sk, sk, 3.5);
      c.save(); c.translate(h[0], h[1]); c.rotate(PI - a - (m.wave ? -0.25 : 0.85)); /* the racket */
      limb(c, 0, 2, 0, -8, 2.6, '#3a3038'); L(c, 0, -8, -3.4, -12.5, 1.5, p.accent2); L(c, 0, -8, 3.4, -12.5, 1.5, p.accent2);
      c.beginPath(); c.ellipse(0, -21, 8.2, 10, 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
      c.lineWidth = 0.35; c.strokeStyle = 'rgba(255,255,255,0.9)'; for (i = -2; i <= 2; i++) { var cw = Math.sqrt(1 - i * i / 9.5); c.beginPath(); c.moveTo(i * 2.7, -21 - 10 * cw); c.lineTo(i * 2.7, -21 + 10 * cw); c.moveTo(-8.2 * cw, -21 + i * 3.3); c.lineTo(8.2 * cw, -21 + i * 3.3); c.stroke(); }
      c.beginPath(); c.ellipse(0, -21, 8.2, 10, 0, 0, TAU); c.lineWidth = 3.2; c.strokeStyle = shade(p.accent2, -0.34); c.stroke(); c.lineWidth = 1.9; c.strokeStyle = p.accent2; c.stroke();
      if (!m.wave) smallBall(c, 0, -27 - hop(k) * 20, 3.6, '#d9ee4c', '#ffffff');
      c.restore();
      var wx2 = 14 + Math.sin(a) * 12.5, wy2 = -51 + Math.cos(a) * 12.5; dot(c, wx2, wy2, 3.3, g);
      K.arm(c, -14, -51, -1, aa[0], 16, 5.6, sk, sk, 3.5);
      c.beginPath(); c.moveTo(-13, -33); c.lineTo(13, -33); c.lineTo(19 + m.sw * 1.2, -18.5); c.quadraticCurveTo(0, -15.5, -19 + m.sw * 1.2, -18.5); c.closePath(); F(c, g); /* pleated skirt */
      for (i = -3; i <= 3; i++) L(c, i * 3.4, -32, i * 5 + m.sw * 1.2, -18.4 + Math.abs(i) * 0.3, 0.7, shade(g, -0.25));
      torsoPath(c, 0.9); F(c, '#fbf8f1'); R(c, -14.6, -34.5, 29.2, 3.6, 1.8, shade(g, 0.3));
      Pg(c, [[-7, -57.5], [0, -50], [-1.5, -57.5]], g); Pg(c, [[7, -57.5], [0, -50], [1.5, -57.5]], g); dot(c, 0, -46, 0.9, g); dot(c, 0, -42, 0.9, g);
      ponytail(c, hx, hy - 4, hr, m, -1);
      K.head(c, hx, hy, 13, sk, m); K.hairdo(c, hx, hy, 13, hr, 0);
      c.beginPath(); c.arc(hx, hy - 2.5, 13.6, PI * 1.08, PI * 1.92); c.lineWidth = 3.4; c.strokeStyle = shade('#ffffff', -0.3); c.stroke(); c.lineWidth = 2.2; c.strokeStyle = '#ffffff'; c.stroke(); /* visor */
      c.beginPath(); c.moveTo(hx - 11, hy - 8.5); c.quadraticCurveTo(hx + 3, hy - 15, hx + 15.5, hy - 8); c.quadraticCurveTo(hx + 3, hy - 9.5, hx - 11, hy - 8.5); c.closePath(); F(c, '#ffffff');
    }
  }, { wide: 0.95, variants: ['soccer', 'basketball', 'baseball', 'tennis'] });

  /* ---------- sporty: football (a plain oval ball), ice hockey, golf, runner ---------- */
  Art.add('character', 'sporty', function (c, m, p) {
    var v = m.v, hx = m.sw * 2, hy = -70 + m.k * 2, aa = K.armAngles(m, 1.1, 0.6), k = m.k, i, h, g, sk, hr, a;
    if (v === 0) { /* football: helmet, shoulder pads, the ball pumped in the air */
      sk = SKIN[2]; g = p.accent; var hc = p.gold;
      legs(c, { skin: sk, pants: '#f1eee6', sock: g, sockH: 0.55, band: p.paper, shoe: '#2b2b33', sole: '#ffffff' });
      shorts(c, '#f1eee6', 9, g);
      a = m.wave ? waveA(m) : 2.25 + k * 0.5 - m.sw * 0.1;
      h = sarm(c, 17, -52, 1, a, sk, g, 9); var fl2 = sarm(c, -17, -52, -1, m.wave ? 1.9 : aa[0], sk, g, 9);
      if (m.wave) h = [fl2[0] - 1, fl2[1] + 1];
      { c.save(); c.translate(h[0] + 1, h[1] - 6); c.rotate(m.wave ? 0.6 : -0.5 + m.sw * 0.2); E(c, 0, 0, 10, 6.2, '#8a4f2a'); L(c, -4, -1.2, 4, -1.2, 0.9, '#ffffff'); for (i = -1; i <= 1; i++) L(c, i * 2.6, -2.6, i * 2.6, 0.2, 0.8, '#ffffff'); c.beginPath(); c.ellipse(0, 0, 10, 6.2, 0, 0, TAU); c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(-7.6, -7, 1.3, 14); c.fillRect(6.3, -7, 1.3, 14); c.restore(); c.restore(); c.beginPath(); c.arc(h[0], h[1], 3.5, 0, TAU); F(c, sk); }
      torsoPath(c); F(c, g); R(c, -21.5, -59, 43, 11.5, 5.6, g); /* shoulder pads */
      c.save(); torsoPath(c); c.clip(); c.fillStyle = p.paper; c.fillRect(-20, -36, 40, 2.4); c.fillRect(-20, -32.4, 40, 1.2); c.restore();
      L(c, -19.5, -50.5, -13.5, -50.5, 1.4, p.paper); L(c, 19.5, -50.5, 13.5, -50.5, 1.4, p.paper);
      Pg(c, [[-5, -59], [5, -59], [0, -54]], shade(g, -0.25), true);
      K.head(c, hx, hy, 13, sk, m);
      L(c, hx - 8.5, hy + 4.2, hx - 4.5, hy + 4.6, 1.5, '#2b2118'); L(c, hx + 8.5, hy + 4.2, hx + 4.5, hy + 4.6, 1.5, '#2b2118'); /* eye black */
      for (i = -1; i <= 1; i += 2) R(c, hx + i * 13.2 - 3, hy - 5, 6, 12.5, 3, hc);
      c.beginPath(); c.moveTo(hx - 15.6, hy - 1); c.quadraticCurveTo(hx - 16.5, hy - 19.5, hx, hy - 19.5); c.quadraticCurveTo(hx + 16.5, hy - 19.5, hx + 15.6, hy - 1); c.quadraticCurveTo(hx + 12, hy - 8.5, hx, hy - 8.5); c.quadraticCurveTo(hx - 12, hy - 8.5, hx - 15.6, hy - 1); c.closePath(); F(c, hc);
      Rn(c, hx - 1.9, hy - 19, 3.8, 10.4, 1, g); K.shine(c, hx - 8, hy - 14.5, 3);
      c.beginPath(); c.moveTo(hx - 14.5, hy + 5); c.quadraticCurveTo(hx, hy + 24.5, hx + 14.5, hy + 5); c.lineWidth = 3; c.strokeStyle = '#6f7888'; c.stroke(); c.lineWidth = 1.7; c.strokeStyle = '#e3e8ef'; c.stroke(); /* face bar, under the mouth */
    } else if (v === 1) { /* ice hockey: skates, big jersey, the stick sweeping a puck */
      sk = SKIN[0]; g = p.accent; var bx = 25 + m.sw * 6;
      legs(c, { skin: sk, pants: p.paper, sock: p.paper, sockH: 0.9, band: g, shoe: '#3a3f52', sole: '#8d96a8', blade: true });
      shorts(c, '#2c3350', 12, p.gold);
      var top = sarm(c, -15, -51, -1, 0.55, g, null, 0, p.accent2);
      limb(c, top[0] + 1, top[1] - 3, bx, -3.5, 2.6, '#d7a565'); limb(c, bx, -3.2, bx + 9, -2, 3.4, '#3a3038'); L(c, top[0] + 1, top[1] - 3, top[0] + 3.5, top[1] + 0.5, 3, '#3a3038');
      E(c, bx + 15 + m.sw * 3, -2.2, 4.4, 2, '#2b2b33');
      torsoPath(c, 1.1); F(c, g); c.save(); c.clip(); c.fillStyle = p.paper; c.fillRect(-22, -33.5, 44, 4); c.fillStyle = p.accent2; c.fillRect(-22, -29.5, 44, 1.6); c.restore();
      Pg(c, [[-6, -57.5], [6, -57.5], [0, -49.5]], p.paper); L(c, -2, -53.5, 2, -53.5, 0.6, g); L(c, -1.2, -51.6, 1.2, -51.6, 0.6, g);
      K.starPath(c, 0, -42, 5, 2.3, 5, 0); c.fillStyle = p.gold; c.fill();
      c.beginPath(); c.arc(top[0], top[1], 4.6, 0, TAU); F(c, p.accent2);
      a = m.wave ? waveA(m) : 0.5 + k * 0.12; h = sarm(c, 15, -51, 1, a, g, null, 0, p.accent2);
      i = 15 + Math.sin(a) * 11.5; L(c, i - 3, -51 + Math.cos(a) * 11.5, i + 3, -51 + Math.cos(a) * 11.5, 2, p.paper);
      K.head(c, hx, hy, 13, sk, m); E(c, hx - 11.8, hy + 0.5, 2.4, 3.6, HAIR[2]); E(c, hx + 11.8, hy + 0.5, 2.4, 3.6, HAIR[2]);
      if (!(m.open > 0.12)) Rn(c, hx - 0.9, hy + 7.3, 1.8, 1.7, 0.3, '#ffffff'); /* the gap-toothed grin */
      c.beginPath(); c.moveTo(hx - 14.6, hy - 2); c.quadraticCurveTo(hx - 15.5, hy - 19, hx, hy - 19); c.quadraticCurveTo(hx + 15.5, hy - 19, hx + 14.6, hy - 2); c.quadraticCurveTo(hx + 11, hy - 8, hx, hy - 8); c.quadraticCurveTo(hx - 11, hy - 8, hx - 14.6, hy - 2); c.closePath(); F(c, p.accent2);
      for (i = -1; i <= 1; i++) L(c, hx + i * 5, hy - 16, hx + i * 5.6, hy - 12, 1.5, shade(p.accent2, -0.35)); K.shine(c, hx - 9.5, hy - 13, 2.4);
      for (i = -1; i <= 1; i += 2) R(c, hx + i * 13.4 - 2.4, hy - 4, 4.8, 8, 2.4, shade(p.accent2, -0.12));
    } else if (v === 2) { /* golf: flat cap, argyle vest, the club swinging like a pendulum */
      sk = SKIN[3]; hr = '#d9d3ca'; g = p.accent2;
      legs(c, { skin: sk, pants: '#d8c39a', shoe: '#ffffff', sole: '#7a4a2d', lace: '#7a4a2d' });
      shorts(c, '#d8c39a', 9); L(c, -13.5, -31, 13.5, -31, 2.2, '#7a4a2d');
      for (i = -1; i <= 1; i += 2) for (h = 0; h < 3; h++) L(c, i * 6.4 - 3.4, -24 + h * 6.5, i * 6.6 + 3.4, -24 + h * 6.5, 0.6, alpha(p.accent, 0.5)); /* plaid */
      var lh2 = sarm(c, -14, -51, -1, 0.55 + m.sw * 0.1, sk, '#fbf8f1', 8), cx = lh2[0] - 6 + m.sw * 9, cy = -3.2 - Math.abs(m.sw) * 5;
      limb(c, lh2[0], lh2[1] - 3, cx, cy, 1.6, '#c9d0da'); L(c, lh2[0], lh2[1] - 4, lh2[0] + (cx - lh2[0]) * 0.22, lh2[1] - 4 + (cy - lh2[1] + 4) * 0.22, 3, '#3a3038');
      c.save(); c.translate(cx, cy); c.rotate(m.sw * 0.5); R(c, -8, -2.6, 9, 5.2, 2, '#aeb7c4'); c.restore();
      c.beginPath(); c.arc(lh2[0], lh2[1], 3.5, 0, TAU); F(c, sk);
      L(c, -31, -0.5, -31, -4, 1.2, p.gold); E(c, -31, -6.3, 2.8, 2.8, '#ffffff'); /* the ball on its tee */
      sarm(c, 14, -51, 1, aa[1], sk, '#fbf8f1', 8);
      torsoPath(c); F(c, '#fbf8f1');
      c.beginPath(); c.moveTo(-10, -56); c.lineTo(0, -44); c.lineTo(10, -56); c.lineTo(14.6, -50); c.quadraticCurveTo(17, -40, 15.5, -27); c.quadraticCurveTo(0, -24, -15.5, -27); c.quadraticCurveTo(-17, -40, -14.6, -50); c.closePath(); F(c, g);
      c.save(); c.clip(); for (i = -1; i <= 1; i++) Pg(c, [[i * 9, -43], [i * 9 + 4.5, -36.5], [i * 9, -30], [i * 9 - 4.5, -36.5]], i ? p.gold : p.paper, true); c.lineWidth = 0.5; c.strokeStyle = alpha(p.paper, 0.8); c.beginPath(); for (i = -2; i <= 2; i++) { c.moveTo(i * 9 - 4.5, -43); c.lineTo(i * 9 + 4.5, -30); c.moveTo(i * 9 + 4.5, -43); c.lineTo(i * 9 - 4.5, -30); } c.stroke(); c.fillStyle = shade(g, -0.2); c.fillRect(-20, -29.4, 40, 5); c.restore();
      Pg(c, [[-7.5, -58], [-1, -57], [-3.5, -51.5]], '#fbf8f1'); Pg(c, [[7.5, -58], [1, -57], [3.5, -51.5]], '#fbf8f1');
      E(c, hx - 11.6, hy - 5, 3.4, 5.5, hr); E(c, hx + 11.6, hy - 5, 3.4, 5.5, hr);
      K.head(c, hx, hy, 13, sk, m);
      E(c, hx - 3, hy + 5.5, 3.3, 1.4, hr, -0.22); E(c, hx + 3, hy + 5.5, 3.3, 1.4, hr, 0.22); /* moustache */
      c.beginPath(); c.moveTo(hx - 14, hy - 7); c.quadraticCurveTo(hx - 15, hy - 18.5, hx - 1, hy - 18.5); c.quadraticCurveTo(hx + 15, hy - 18.5, hx + 14.5, hy - 9); c.quadraticCurveTo(hx, hy - 12, hx - 14, hy - 7); c.closePath(); F(c, p.accent);
      c.beginPath(); c.moveTo(hx - 3, hy - 10.2); c.quadraticCurveTo(hx + 8, hy - 12.5, hx + 18, hy - 7.6); c.quadraticCurveTo(hx + 8, hy - 7.2, hx - 3, hy - 7.2); c.closePath(); F(c, shade(p.accent, -0.2)); E(c, hx - 1, hy - 18.4, 1.6, 1.1, shade(p.accent, 0.3));
    } else { /* runner: jogging on the spot, a medal bouncing */
      sk = SKIN[1]; hr = HAIR[0]; g = p.gold;
      var lf = [clamp(-m.sw, 0, 1) * 0.95, clamp(m.sw, 0, 1) * 0.95];
      legs(c, { skin: sk, sock: '#ffffff', sockH: 0.22, shoe: p.accent, sole: '#ffffff', lace: '#ffffff', lift: lf });
      shorts(c, '#2c3350', 7.5, p.accent2);
      a = K.armAngles(m, 0.95, 0.95);
      for (i = -1; i <= 1; i += 2) { var ua = i < 0 ? a[0] : a[1], ex, ey; if (i > 0 && m.wave) { K.arm(c, 14, -51, 1, ua, 17, 5.8, sk, sk, 3.5); continue; } ex = i * 14 + i * Math.sin(ua * 0.6) * 9; ey = -51 + Math.cos(ua * 0.6) * 9; limb(c, i * 14, -51, ex, ey, 5.8, sk); limb(c, ex, ey, ex + i * Math.sin(ua + 0.9) * 9 - i * 3, ey - 2 - Math.sin(ua) * 7, 5.2, sk); c.beginPath(); c.arc(ex + i * Math.sin(ua + 0.9) * 9 - i * 3, ey - 2 - Math.sin(ua) * 7, 3.5, 0, TAU); F(c, sk); L(c, ex - 2.2, ey + 0.5, ex + 2.2, ey + 0.5, 0.01, sk); }
      torsoPath(c, 0.9); F(c, g); c.save(); c.clip(); c.fillStyle = shade(g, -0.16); c.fillRect(-20, -30, 40, 6); c.restore();
      c.beginPath(); c.arc(0, -57.5, 6.2, 0.08 * PI, 0.92 * PI); c.lineWidth = 1.6; c.strokeStyle = shade(g, -0.3); c.stroke();
      R(c, -8.5, -45.5, 17, 11.5, 1.4, '#fffdf7'); for (i = 0; i < 4; i++) dot(c, i % 2 ? 7 : -7, i < 2 ? -44 : -35.5, 0.7, '#9aa3b2'); L(c, -4.5, -41.5, 4.5, -41.5, 1.8, alpha(p.accent2, 0.75)); L(c, -3, -38, 3, -38, 1.2, alpha(p.accent2, 0.45)); /* a blank bib */
      var my = -31 - hop(k) * 4, mx = m.sw * 2.4; L(c, -5.5, -56, mx, my - 3, 1.6, p.accent); L(c, 5.5, -56, mx, my - 3, 1.6, p.accent); E(c, mx, my, 4.2, 4.2, '#f6c445'); K.starPath(c, mx, my, 2.4, 1.1, 5, 0); c.fillStyle = '#fff3b8'; c.fill();
      c.save(); c.translate(hx, hy); c.rotate(-m.sw * 0.07); K.hairdo(c, 0, 0, 13.5, hr, 2); c.restore();
      K.head(c, hx, hy, 13, sk, m); K.hairdo(c, hx, hy, 13, hr, 0);
      R(c, hx - 12.8, hy - 11.5, 25.6, 3.8, 1.9, p.accent); c.save(); c.translate(hx - 12.5, hy - 9.5); c.rotate(0.5 - m.sw * 0.3 + k * 0.3); Pg(c, [[0, 0], [-8, -2.5], [-7, 1.5]], p.accent); Pg(c, [[0, 0], [-7, 3], [-5, 6]], shade(p.accent, -0.15)); c.restore();
      for (i = 0; i < 2; i++) { var dx2 = hx + 16 + i * 3.5, dy2 = hy - 6 + i * 6 + frac(m.t * 1.3 + i * 0.5) * 6; c.beginPath(); c.moveTo(dx2, dy2 - 2.2); c.quadraticCurveTo(dx2 + 1.8, dy2 + 0.8, dx2, dy2 + 1.4); c.quadraticCurveTo(dx2 - 1.8, dy2 + 0.8, dx2, dy2 - 2.2); c.fillStyle = 'rgba(150,215,255,' + (0.9 - frac(m.t * 1.3 + i * 0.5) * 0.8).toFixed(2) + ')'; c.fill(); } /* sweat beads */
    }
  }, { wide: 1.0, variants: ['football', 'ice hockey', 'golf', 'runner'] });

  /* ---------- tot: a baby, sitting (rattle, bottle, bear hood with a teddy) or crawling ---------- */
  function babyFace(c, hx, hy, r, sk, m) {
    E(c, hx - r * 0.98, hy + r * 0.18, r * 0.17, r * 0.22, sk); E(c, hx + r * 0.98, hy + r * 0.18, r * 0.17, r * 0.22, sk);
    E(c, hx, hy, r, r * 0.93, sk);
    K.eyes(c, hx, hy + r * 0.14, r * 0.4, r * 0.14, m); K.blush(c, hx, hy + r * 0.46, r * 0.64, r * 0.2);
    dot(c, hx, hy + r * 0.34, r * 0.05, shade(sk, -0.3));
    K.mouth(c, hx, hy + r * 0.58, r * 0.3, m, shade(sk, -0.55));
    if (m.open > 0.12) Rn(c, hx - r * 0.07, hy + r * 0.52, r * 0.14, r * 0.1, 0.3, '#ffffff'); /* one tooth */
  }
  function teddy(c, x, y, s, rot) {
    var b = '#c8935c', i; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    for (i = -1; i <= 1; i += 2) { E(c, i * 4.6, 12, 2.6, 3.6, b, i * -0.4); E(c, i * 5.4, 4.5, 2.2, 3.2, b, i * 0.7); }
    E(c, 0, 7, 5.2, 6.2, b); E(c, 0, 8, 3, 3.8, '#f1ddb9');
    for (i = -1; i <= 1; i += 2) E(c, i * 4.4, -5, 2.3, 2.3, b);
    E(c, 0, -1, 5.6, 5.2, b); E(c, 0, 0.8, 2.6, 2, '#f1ddb9'); dot(c, -2.2, -1.6, 0.75, INK); dot(c, 2.2, -1.6, 0.75, INK); dot(c, 0, 0.2, 0.8, INK);
    c.restore();
  }
  Art.add('character', 'tot', function (c, m, p) {
    var v = m.v, sk = SKIN[[0, 2, 1, 3][v]], on = [p.accent, p.accent2, p.gold, '#b79be8'][v], hr = HAIR[[2, 1, 0, 1][v]], k = m.k, i, j, h, aa = K.armAngles(m, 1.25, 0.7);
    if (v === 2) { /* crawling, bottom wiggling */
      var hx2 = 19 + m.sw * 1.6, hy2 = -37 + k * 2.5, wg = m.sw * 2.2;
      limb(c, 18, -21, 22 - m.sw * 3.5, -5.5, 7, shade(on, -0.14)); E(c, 23.5 - m.sw * 3.5, -3.4, 4.6, 3.3, shade(sk, -0.1));
      limb(c, -15 + wg, -15, -8, -5, 9.5, on); limb(c, -8, -5, -24, -4.6 - k * 5, 7.4, on); E(c, -28, -5.6 - k * 6.5, 4.8, 3.9, sk, -0.3);
      for (i = 0; i < 3; i++) dot(c, -31.4 + i * 0.6, -8.4 - k * 6.5 + i * 2.4, 1.2, sk);
      E(c, -13 + wg, -24 - Math.abs(m.sw) * 1.5, 16, 14.5, on);
      E(c, 1, -22, 19, 12.5, on); c.beginPath(); c.ellipse(-4 + wg * 0.5, -23, 26, 13, 0, 0, TAU); c.save(); c.clip();
      for (i = 0; i < 9; i++) dot(c, -26 + (i % 5) * 9 + (i > 4 ? 4.5 : 0) + wg * 0.5, i > 4 ? -18 : -28, 1.9, alpha(p.paper, 0.9)); c.restore();
      if (m.wave) K.arm(c, 11, -24, 1, 2.3 + Math.sin(m.t * 9) * 0.3, 13, 7.2, on, sk, 4.4);
      else { limb(c, 10, -21, 11 + m.sw * 3.5, -6, 7.4, on); E(c, 12.5 + m.sw * 3.5, -3.4, 5, 3.5, sk); }
      R(c, 8, -32, 15, 5, 2.5, shade(on, 0.35));
      babyFace(c, hx2, hy2, 17, sk, m);
      for (i = -1; i <= 1; i++) { c.save(); c.translate(hx2 + i * 3, hy2 - 15); c.rotate(i * 0.5 + m.sw * 0.25); E(c, 0, -3.4, 2, 4.8, hr); c.restore(); }
      return;
    }
    var hx = m.sw * 2.2, hy = -53 + k * 2.6;
    for (i = -1; i <= 1; i += 2) { /* legs out in front, toes wiggling */
      var fy = -7 + i * m.sw * 1.6 - k * 1.2; limb(c, i * 9, -9, i * 19, fy + 1, 11.5, on);
      if (v === 1) { E(c, i * 23, fy, 6.6, 7.4, p.paper); dot(c, i * 23, fy + 0.5, 2, alpha(on, 0.6)); }
      else { E(c, i * 23, fy, 6.3, 7.2, sk); for (j = -1; j <= 1; j++) E(c, i * 23 + j * 3.6, fy - 6.6 + Math.abs(j) * 1 + Math.sin(m.t * 7 + j + i) * 0.5, 1.9, 2, sk); E(c, i * 23, fy + 1.2, 3, 3.4, shade(sk, -0.07)); }
    }
    var la = v === 0 ? aa[0] : 1.45 + m.sw * 0.2 + k * 0.25;
    var lh = K.arm(c, -14, -35, -1, la, 13.5, 7.8, on, sk, 4.5); h = K.arm(c, 14, -35, 1, aa[1], 13.5, 7.8, on, sk, 4.5);
    if (v === 0) { c.save(); c.translate(h[0], h[1]); c.rotate(0.5 + Math.sin(m.t * 15) * 0.3 * (0.3 + k)); limb(c, 0, 1, 0, -8, 2, p.paper); E(c, 0, -12.5, 6, 6, p.accent2); c.beginPath(); c.arc(0, -12.5, 6, 0, TAU); c.save(); c.clip(); c.fillStyle = p.paper; c.fillRect(-7, -14, 14, 3); c.restore(); dot(c, -2, -15.4, 1.3, 'rgba(255,255,255,0.7)'); E(c, 0, 2, 2.4, 2.4, p.accent2); c.restore(); c.beginPath(); c.arc(h[0], h[1], 4.5, 0, TAU); F(c, sk); }
    if (v === 1) { c.save(); c.translate(lh[0] - 1, lh[1] - 2); c.rotate(-0.5 + m.sw * 0.15); R(c, -4.5, -9, 9, 15, 3, '#f4f8fb'); Rn(c, -3.6, -3, 7.2, 8.2, 2.4, '#ffffff'); for (i = 0; i < 3; i++) L(c, -4.4, -5 + i * 3, -2, -5 + i * 3, 0.6, '#b9c6d8'); R(c, -5.2, -12, 10.4, 3.6, 1.6, p.gold); c.beginPath(); c.moveTo(-2.6, -12); c.quadraticCurveTo(-2.4, -15.5, -1.2, -16.2); c.quadraticCurveTo(0, -19, 1.2, -16.2); c.quadraticCurveTo(2.4, -15.5, 2.6, -12); c.closePath(); F(c, '#f3c9a0'); c.restore(); c.beginPath(); c.arc(lh[0], lh[1], 4.5, 0, TAU); F(c, sk); }
    if (v === 3) teddy(c, lh[0] - 3, lh[1] - 6, 1.25, -0.25 + m.sw * 0.25);
    E(c, 0, -20, 18.5, 19.5, on);
    c.beginPath(); c.ellipse(0, -20, 18.5, 19.5, 0, 0, TAU); c.save(); c.clip();
    if (v === 1) { c.fillStyle = alpha(p.paper, 0.85); for (i = 0; i < 5; i++) c.fillRect(-20, -36 + i * 7.5, 40, 3); }
    c.fillStyle = shade(on, -0.12); c.beginPath(); c.ellipse(0, 2, 22, 9, 0, 0, TAU); c.fill(); c.restore();
    if (v === 0) { K.starPath(c, 0, -21, 7.5, 3.5, 5, m.sw * 0.1); F(c, p.gold); }
    if (v === 3) { E(c, 0, -19, 10.5, 11.5, '#f3ecff'); K.heartPath(c, 0, -19.5, 7); c.fillStyle = p.accent; c.fill(); }
    for (i = -1; i <= 1; i++) dot(c, i * 4.5, -4.2 + Math.abs(i) * -0.6, 1.1, shade(on, 0.5));
    if (v === 3) { for (i = -1; i <= 1; i += 2) { E(c, hx + i * 16.5, hy - 18 - k, 7, 7, on); dot(c, hx + i * 16.5, hy - 17.5 - k, 3.6, '#f3ecff'); } E(c, hx, hy - 1.5, 23.5, 22, on); }
    else R(c, -9, -40, 18, 5, 2.5, shade(on, 0.35));
    babyFace(c, hx, hy, 19, sk, m);
    if (v === 0) { c.beginPath(); c.arc(hx + 1.5, hy - 19.5, 3.2, PI * 0.5, PI * 2.2); c.lineWidth = 2.6; c.lineCap = 'round'; c.strokeStyle = shade(hr, -0.3); c.stroke(); c.lineWidth = 1.5; c.strokeStyle = hr; c.stroke(); L(c, hx + 1.5, hy - 16.6, hx + 0.5, hy - 17.6, 1.5, hr); }
    if (v === 1) { for (i = -2; i <= 2; i++) E(c, hx + i * 5.2, hy - 16.6 + Math.abs(i) * 2.2, 3.6, 3.2, hr); c.beginPath(); c.arc(hx, hy - 2, 19.4, PI * 1.14, PI * 1.86); c.lineWidth = 2.6; c.strokeStyle = p.accent; c.stroke(); K.bow(c, hx + 9.5, hy - 18.5 - k, 12, p.accent); }
    if (v === 3) { c.beginPath(); c.moveTo(hx - 6, hy - 16.5); c.quadraticCurveTo(hx, hy - 11, hx + 6, hy - 16.5); c.quadraticCurveTo(hx, hy - 19.5, hx - 6, hy - 16.5); c.closePath(); F(c, hr); }
  }, { wide: 1.0, variants: ['rattle baby', 'bottle baby', 'crawler', 'bear-hood baby'] });

  /* ---------- stork: long legs, a bundle swinging from the beak ---------- */
  function bundle(c, x, y, rot, cloth, pat, sk, m, kind) {
    var i; c.save(); c.translate(x, y); c.rotate(rot);
    for (i = -1; i <= 1; i += 2) { c.save(); c.rotate(i * 0.75); E(c, 0, -4, 2.2, 4.6, cloth); c.restore(); }
    Pg(c, [[0, 0], [-10.5, 16], [10.5, 16]], shade(cloth, -0.1));
    E(c, 0, 21, 12.5, 11, shade(cloth, -0.16));
    E(c, 0, 16.5, 6.6, 6, sk); c.lineWidth = 0.8; c.lineCap = 'round'; c.strokeStyle = INK; /* the little one, asleep */
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(i * 2.7, 16.4, 1.3, 0.15 * PI, 0.85 * PI); c.stroke(); }
    dot(c, -4.2, 18.6, 1.2, 'rgba(240,96,110,0.45)'); dot(c, 4.2, 18.6, 1.2, 'rgba(240,96,110,0.45)');
    c.beginPath(); c.arc(0, 13.2, 1.6, PI * 0.6, PI * 2.1); c.lineWidth = 0.8; c.strokeStyle = shade(sk, -0.5); c.stroke();
    c.beginPath(); c.moveTo(-12.4, 19.5); c.quadraticCurveTo(0, 25.5, 12.4, 19.5); c.quadraticCurveTo(13.5, 33, 0, 33); c.quadraticCurveTo(-13.5, 33, -12.4, 19.5); c.closePath(); F(c, cloth);
    c.save(); c.clip();
    if (kind === 0) for (i = 0; i < 6; i++) dot(c, -8 + (i % 3) * 8 + (i > 2 ? -3 : 0), i > 2 ? 30 : 25.5, 1.5, pat);
    else if (kind === 1) for (i = -2; i <= 2; i++) L(c, i * 5.5 - 2, 19, i * 5.5 + 2, 34, 1.5, pat);
    else for (i = -1; i <= 1; i++) { K.starPath(c, i * 7, 27.5 - Math.abs(i) * 1.5, 2.6, 1.2, 5, i); c.fillStyle = pat; c.fill(); }
    c.restore(); E(c, 0, 0, 2.6, 2.4, cloth);
    c.restore();
  }
  Art.add('character', 'stork', function (c, m, p) {
    var v = m.v, wh = '#fffdf8', gr = '#e4e0ea', bk = '#2e2a36', og = '#f0683c', k = m.k, hx = 3 + m.sw * 2.2, hy = -84 + k * 2.4, i;
    var cloth = [p.accent2, p.accent, p.gold, p.accent][v], pat = v === 2 ? '#ffffff' : p.paper;
    /* legs: one stands, one lifts on the beat */
    limb(c, -13, -40, -13.5, -3, 2.3, og); E(c, -13.2, -21, 2.1, 2.1, og); for (i = -1; i <= 1; i++) L(c, -13.5, -2.5, -13.5 + i * 5 + 2, -0.8, 1.8, shade(og, -0.15));
    var kx = -3 + k * 5, ky = -22 - k * 3, fx = -4.5 - k * 1.5, fy = -3 - k * 11;
    limb(c, -5, -40, kx, ky, 2.3, og); limb(c, kx, ky, fx, fy, 2.3, og); E(c, kx, ky, 2.1, 2.1, og); for (i = -1; i <= 1; i++) L(c, fx, fy + 0.5, fx + i * 5 + 2, fy + 2.2 + k * 1.5, 1.8, shade(og, -0.15));
    for (i = 0; i < 3; i++) { c.save(); c.translate(-23, -47); c.rotate(-0.25 + i * 0.3 + m.sw * 0.1); E(c, -9, 0, 9.5, 3.4, bk); c.restore(); } /* tail */
    if (v === 3) bundle(c, hx + 13, hy + 5.5, -m.sw * 0.3 + 0.5, p.accent2, p.paper, SKIN[1], m, 0);
    /* neck, body, wing */
    c.beginPath(); c.moveTo(1, -56); c.quadraticCurveTo(15, -68, hx - 1, hy + 4); c.lineCap = 'round'; c.lineWidth = 9.6; c.strokeStyle = shade(wh, -0.34); c.stroke(); c.lineWidth = 7.4; c.strokeStyle = wh; c.stroke();
    E(c, -9, -51, 20.5, 15, wh, -0.12); c.beginPath(); c.ellipse(-9, -51, 20.5, 15, -0.12, 0, TAU); c.save(); c.clip(); c.fillStyle = gr; c.beginPath(); c.ellipse(-9, -39, 22, 8, -0.12, 0, TAU); c.fill(); c.restore();
    c.beginPath(); c.moveTo(1, -56); c.quadraticCurveTo(15, -68, hx - 1, hy + 4); c.lineWidth = 7.2; c.strokeStyle = wh; c.stroke();
    if (v === 1) K.bow(c, 7.5, -62.5, 11, p.accent);
    c.save(); c.translate(m.wave ? -9 : 1, -56); c.rotate(m.wave ? 1.1 + Math.sin(m.t * 9) * 0.3 : 0.12 + k * 0.5 + m.sw * 0.1);
    for (i = 0; i < 4; i++) { c.save(); c.translate(-20, 2 + i * 1.2); c.rotate(0.28 - i * 0.2); E(c, -8, 0, 9, 3, bk); c.restore(); }
    E(c, -12, 3.5, 15, 8.5, wh, 0.12); c.lineWidth = 0.8; c.strokeStyle = gr; for (i = 0; i < 3; i++) { c.beginPath(); c.arc(-10 - i * 5, 3, 4, 0.2 * PI, 0.75 * PI); c.stroke(); } c.restore();
    /* head and the long beak; the upper half lifts to sing */
    var op = m.open > 0.12 ? m.open : 0;
    c.save(); c.translate(hx + 5, hy + 1.5); c.rotate(0.2); Pg(c, [[0, -0.5], [25, 2.6], [0, 4]], shade(og, -0.12)); c.rotate(-op * 0.42); if (op) Pg(c, [[1, -1], [16, 0.4], [1, 2]], '#6a1d2a', true); Pg(c, [[0, -3.6], [26, 1.6], [0, 1.4]], og); c.restore();
    E(c, hx, hy, 9, 8.6, wh);
    K.eyes(c, hx + 2.6, hy - 1.2, 3.3, 1.5, m); dot(c, hx + 2, hy + 3.4, 1.9, 'rgba(240,96,110,0.42)');
    if (v === 0) { c.beginPath(); c.moveTo(hx - 9, hy - 3.6); c.quadraticCurveTo(hx - 8.6, hy - 14, hx + 0.5, hy - 13.6); c.quadraticCurveTo(hx + 8.6, hy - 13, hx + 8.8, hy - 4.6); c.closePath(); F(c, p.accent2); R(c, hx - 2, hy - 7.2, 17.5, 3.6, 1.8, shade(p.accent2, -0.2)); E(c, hx + 2, hy - 9.6, 2.2, 2.2, p.gold); }
    else if (v === 2) K.flower(c, hx - 3.5, hy - 8.2 - k, 4.6, p.accent, p.gold, m.sw * 0.3);
    else for (i = -1; i <= 1; i++) { c.save(); c.translate(hx - 3 + i * 1.6, hy - 7.6); c.rotate(-0.5 + i * 0.4 + m.sw * 0.2); E(c, 0, -3, 1.4, 3.6, wh); c.restore(); }
    var kx2 = hx + 5 + Math.cos(0.2) * 21 - Math.sin(0.2) * 3, ky2 = hy + 1.5 + Math.sin(0.2) * 21 + Math.cos(0.2) * 3;
    bundle(c, kx2, ky2, -m.sw * 0.24 + (v === 3 ? 0.2 : 0), cloth, pat, SKIN[[0, 2, 3, 1][v]], m, v === 3 ? 1 : v);
  }, { wide: 1.05, variants: ['delivery cap', 'bow tie', 'flower and stars', 'twins'] });

  /* ---------- bug: bee, ladybird, butterfly, snail ---------- */
  function feelers(c, hx, hy, m, col, tip, len) {
    for (var i = -1; i <= 1; i += 2) { var tx = hx + i * (8 + m.k * 1.5) + m.sw * 2.5, ty = hy - len - m.k * 2; c.beginPath(); c.moveTo(hx + i * 4.5, hy - 10); c.quadraticCurveTo(hx + i * 5, hy - len * 0.8, tx, ty); c.lineCap = 'round'; c.lineWidth = 1.5; c.strokeStyle = col; c.stroke(); E(c, tx, ty, 2.5, 2.5, tip); }
  }
  function gauze(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.72)'; c.fill(); c.lineWidth = 0.9; c.strokeStyle = 'rgba(120,160,205,0.85)'; c.stroke(); }
  function bugFeet(c, col) { for (var i = -1; i <= 1; i += 2) { limb(c, i * 7, -11, i * 8, -3.5, 3, col); E(c, i * 9.5, -2.4, 5.4, 2.6, col); } }
  Art.add('character', 'bug', function (c, m, p) {
    var v = m.v, k = m.k, aa = K.armAngles(m, 1.3, 0.75), i, j, hx = m.sw * 2.2, hy, dk = '#3a2a22', h;
    if (v === 0) { /* bee with a honey pot */
      var yl = '#ffc93c'; hy = -63 + k * 2.5;
      for (i = -1; i <= 1; i += 2) { c.save(); c.translate(i * 11, -46); c.rotate(i * (0.75 + Math.sin(m.t * 31) * 0.22 + k * 0.3)); gauze(c, 0, -13, 8, 15, 0); c.restore(); c.save(); c.translate(i * 12, -40); c.rotate(i * (1.55 + Math.sin(m.t * 31 + 1) * 0.2 + k * 0.2)); gauze(c, 0, -9, 5.5, 10.5, 0); c.restore(); }
      Pg(c, [[-4, -9], [4, -9], [0, -2.5]], dk); bugFeet(c, dk);
      var lh = K.arm(c, -16, -37, -1, m.wave ? 1.2 : 1.25 + k * 0.2, 11, 3.2, dk, dk, 2.6); K.arm(c, 16, -37, 1, aa[1], 11, 3.2, dk, dk, 2.6);
      E(c, 0, -29, 19, 21.5, yl); c.beginPath(); c.ellipse(0, -29, 19, 21.5, 0, 0, TAU); c.save(); c.clip();
      c.lineWidth = 6; c.strokeStyle = dk; for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-22, -37 + i * 11.5); c.quadraticCurveTo(0, -32 + i * 11.5, 22, -37 + i * 11.5); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.ellipse(-7, -36, 6, 11, 0.3, 0, TAU); c.fill(); c.restore();
      for (i = -3; i <= 3; i++) E(c, i * 4.6, -48.5 + Math.abs(i) * 0.9, 3.6, 3.4, '#fff6dc'); /* fluffy collar */
      c.save(); c.translate(lh[0] - 2, lh[1] + 1); c.rotate(m.sw * 0.1); R(c, -6.5, -5.5, 13, 12, 4, '#c9772e'); R(c, -7.2, -7.6, 14.4, 3.6, 1.6, '#e19a4b'); Rn(c, -4, -2, 8, 5, 1.2, p.paper); K.heartPath(c, 0, 0.6, 3.6); c.fillStyle = p.accent; c.fill();
      c.beginPath(); c.moveTo(-5.5, -7.6); c.quadraticCurveTo(-4, -10.6, 0, -9.6); c.quadraticCurveTo(4, -10.6, 5.5, -7.6); c.lineTo(4.6, -4.4 + k * 1.6); c.quadraticCurveTo(3.6, -2.6 + k * 1.6, 2.8, -4.6); c.lineTo(2.4, -6); c.lineTo(-5.5, -6); c.closePath(); c.fillStyle = '#ffd75e'; c.fill(); c.restore();
      feelers(c, hx, hy, m, dk, dk, 23);
      E(c, hx, hy, 16.5, 15, yl);
      K.eyes(c, hx, hy - 0.5, 6.8, 2.5, m); K.blush(c, hx, hy + 5, 11.5, 2.7); K.mouth(c, hx, hy + 6.6, 4.2, m, dk);
    } else if (v === 1) { /* ladybird: the wing cases open on the beat */
      var rd = '#e5383b', bl = '#2e2a33'; hy = -61 + k * 2.5;
      bugFeet(c, bl);
      for (i = -1; i <= 1; i += 2) { c.save(); c.translate(i * 2, -47); c.rotate(i * (0.5 + k * 0.5)); gauze(c, i * 2, 21, 9, 21, 0); c.restore(); }
      K.arm(c, -15, -37, -1, aa[0], 11, 3.2, bl, bl, 2.6); K.arm(c, 15, -37, 1, aa[1], 11, 3.2, bl, bl, 2.6);
      E(c, 0, -27, 15.5, 20, bl); E(c, 0, -25, 9.5, 13.5, '#57505f');
      for (i = -1; i <= 1; i += 2) { c.save(); c.translate(i * 1.5, -48); c.rotate(i * (0.1 + k * 0.42 + Math.abs(m.sw) * 0.06)); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(i * 22, -1, i * 29, 22, i * 15, 41); c.quadraticCurveTo(i * 9, 46, i * 6, 41); c.quadraticCurveTo(i * 9.5, 20, 0, 0); c.closePath(); F(c, rd);
        dot(c, i * 13.5, 11, 3.5, bl); dot(c, i * 17.5, 24, 3, bl); dot(c, i * 12, 34.5, 2.5, bl); c.beginPath(); c.ellipse(i * 17, 9, 1.6, 4.4, i * -0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill(); c.restore(); }
      feelers(c, hx, hy, m, bl, rd, 22);
      E(c, hx, hy, 16, 14.5, bl); dot(c, hx - 12.5, hy - 5.5, 2.5, '#ffffff'); dot(c, hx + 12.5, hy - 5.5, 2.5, '#ffffff');
      E(c, hx, hy + 2.2, 12.2, 10.6, '#fbe6d2');
      K.eyes(c, hx, hy + 0.5, 5.6, 2.4, m); K.blush(c, hx, hy + 5.6, 9, 2.3); K.mouth(c, hx, hy + 7, 3.8, m, bl);
    } else if (v === 2) { /* butterfly: four painted wings beating */
      var bd = '#5a3d6b', fl = 1 - 0.3 * k + Math.sin(m.t * 5) * 0.05, u1 = p.accent, u2 = p.accent2; hy = -57 + k * 2.5;
      for (i = -1; i <= 1; i += 2) { c.save(); c.translate(i * 2, 0); c.scale(fl, 1);
        c.beginPath(); c.moveTo(i * 1, -27); c.bezierCurveTo(i * 30, -34, i * 40, -14, i * 24, -5); c.quadraticCurveTo(i * 8, -4, i * 1, -22); c.closePath(); F(c, u2);
        c.beginPath(); c.ellipse(i * 20, -17.5, 8, 6.6, i * 0.4, 0, TAU); c.fillStyle = shade(u2, 0.4); c.fill(); dot(c, i * 21, -17, 3, p.gold);
        c.beginPath(); c.moveTo(i * 1, -46); c.bezierCurveTo(i * 18, -92, i * 52, -84, i * 44, -52); c.bezierCurveTo(i * 41, -36, i * 18, -30, i * 1, -32); c.closePath(); F(c, u1);
        c.beginPath(); c.moveTo(i * 7, -45); c.bezierCurveTo(i * 20, -76, i * 40, -73, i * 36, -53); c.bezierCurveTo(i * 33, -42, i * 18, -37, i * 7, -39); c.closePath(); c.fillStyle = shade(u1, 0.38); c.fill();
        E(c, i * 26, -56, 5.6, 5.6, p.gold); dot(c, i * 26, -56, 2.5, shade(u1, -0.25));
        for (j = 0; j < 4; j++) dot(c, i * (43.5 - j * j * 1.5), -78 + j * 9.5, 1.7, '#ffffff'); c.restore(); }
      for (i = -1; i <= 1; i += 2) { limb(c, i * 3, -13, i * 4.5, -3.5, 2.4, bd); E(c, i * 6, -2.3, 4.2, 2.3, bd); }
      K.arm(c, -6, -40, -1, aa[0], 10, 2.8, bd, bd, 2.3); K.arm(c, 6, -40, 1, aa[1], 10, 2.8, bd, bd, 2.3);
      E(c, 0, -29, 7, 18.5, bd); for (i = 0; i < 4; i++) { c.beginPath(); c.arc(0, -40 + i * 6.5, 7.5, 0.22 * PI, 0.78 * PI); c.lineWidth = 0.9; c.strokeStyle = shade(bd, 0.3); c.stroke(); }
      for (i = -1; i <= 1; i += 2) { var tx = hx + i * (9 + k * 2) + m.sw * 2, ty = hy - 25 - k * 2; c.beginPath(); c.moveTo(hx + i * 3.5, hy - 9); c.quadraticCurveTo(hx + i * 4, hy - 22, tx, ty); c.arc(tx + i * 2.2, ty, 2.2, i > 0 ? PI : 0, i > 0 ? PI * 2.6 : -PI * 1.6, i < 0); c.lineWidth = 1.4; c.strokeStyle = bd; c.stroke(); }
      E(c, hx, hy, 12.5, 11.5, '#f6dcb8');
      K.eyes(c, hx, hy - 0.5, 5.2, 2.1, m); K.blush(c, hx, hy + 3.6, 8.6, 2.2); K.mouth(c, hx, hy + 5, 3.5, m, bd);
    } else { /* snail: eyes on stalks, a lollipop shell */
      var bo = '#f2c9a0', sc = p.accent, sx = 21 + m.sw * 1.8, sy = -36 + k * 2.4, blink = frac(m.t * 0.31 + m.ph) < 0.035;
      c.beginPath(); c.moveTo(-37, -0.5); c.quadraticCurveTo(-30, -9 - k * 2, -14, -10); c.lineTo(8, -10); c.quadraticCurveTo(14, -24, sx - 8, sy + 3); c.lineTo(sx + 7, sy + 7); c.quadraticCurveTo(27, -12, 32, -4); c.quadraticCurveTo(34, -0.5, 29, -0.5); c.closePath(); F(c, bo);
      c.lineWidth = 1; c.strokeStyle = shade(bo, -0.18); c.beginPath(); for (i = 0; i < 6; i++) { c.moveTo(-28 + i * 10, -3.4); c.quadraticCurveTo(-25.5 + i * 10, -1.6, -23 + i * 10, -3.4); } c.stroke();
      c.save(); c.translate(-7, -9); c.rotate(m.sw * 0.07); c.scale(1 + k * 0.04, 1 - k * 0.05);
      E(c, 0, -22, 23, 23, sc); E(c, 1, -21, 16, 16, shade(sc, 0.28)); E(c, 2, -20, 9.5, 9.5, sc); E(c, 2.6, -19.6, 4, 4, shade(sc, 0.28));
      for (i = 0; i < 7; i++) { var a = -2.9 + i * 0.52; dot(c, Math.cos(a) * 19.6, -22 + Math.sin(a) * 19.6, 1.5, p.gold); }
      c.beginPath(); c.ellipse(-12, -34, 2.4, 6, 0.75, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill();
      K.flower(c, 13, -41, 4.6, '#ffffff', p.gold, m.t * 0.5); c.restore();
      for (i = -1; i <= 1; i += 2) { var ex = sx + i * 5.5 + m.sw * 2.4 + 1, ey = sy - 21 - k * 3.5 - (i > 0 ? 1.5 : 0); limb(c, sx + i * 3.6, sy - 7, ex, ey + 3, 2.8, bo); E(c, ex, ey, 5, 5, '#ffffff');
        if (blink) L(c, ex - 2.6, ey, ex + 2.6, ey, 1.1, INK); else { dot(c, ex + 0.8, ey + 0.4, 2.5, INK); dot(c, ex + 1.6, ey - 0.6, 0.9, '#ffffff'); } }
      E(c, sx, sy, 10.5, 9.5, bo);
      dot(c, sx - 3, sy + 3.2, 2.2, 'rgba(240,96,110,0.42)'); dot(c, sx + 7, sy + 3.2, 2, 'rgba(240,96,110,0.42)'); K.mouth(c, sx + 2.4, sy + 3.2, 3.8, m, shade(bo, -0.55));
      K.arm(c, 19, -19, 1, m.wave ? 2.35 + Math.sin(m.t * 9) * 0.32 : 1.0 + m.sw * 0.5, 9.5, 3.6, bo, bo, 2.7);
    }
  }, { wide: 1.05, variants: ['bee', 'ladybird', 'butterfly', 'snail'] });

  /* ---------- hummingbird: hovering at a flower, wings a blur ---------- */
  Art.add('character', 'hummingbird', function (c, m, p) {
    var v = m.v, k = m.k, i, body = ['#27a877', '#7a5cd6', '#2f8fd6', '#ee6fa3'][v], thr = [p.accent, p.gold, '#ff9a3c', '#fff6ea'][v], dk = shade(body, -0.28), gr = '#3f9a5c';
    var bx = -12 + m.sw * 2.4, by = -50 - Math.sin(m.t * 3.1) * 1.8 - k * 3.5, fxp = 39 + m.sw * 1.5, fyp = -56 - k * 1.5, fc = [p.accent, '#ffffff', p.accent, '#8fb8ff'][v];
    /* the flower it visits (this is what stands on the ground) */
    c.beginPath(); c.moveTo(36, 0); c.quadraticCurveTo(46, -30, fxp, fyp + 4); c.lineCap = 'round'; c.lineWidth = 3.4; c.strokeStyle = shade(gr, -0.34); c.stroke(); c.lineWidth = 2; c.strokeStyle = gr; c.stroke();
    K.leaf(c, 41, -18, 12, -2.6 + m.sw * 0.1, gr); K.leaf(c, 43, -30, 10, -0.5 - m.sw * 0.1, shade(gr, 0.15)); for (i = -1; i <= 1; i++) L(c, 36 + i * 3, 0, 36 + i * 6, -7 - (i ? 0 : 2), 1.6, gr);
    c.save(); c.translate(fxp, fyp); c.rotate(-0.5 + m.sw * 0.08);
    if (v === 1) K.flower(c, 0, 0, 9, fc, p.gold, m.t * 0.3);
    else if (v === 2) { for (i = -1; i <= 1; i++) { c.save(); c.rotate(i * 0.45); c.beginPath(); c.moveTo(-4.5, 3); c.quadraticCurveTo(-6.5, -7, 0, -12.5); c.quadraticCurveTo(6.5, -7, 4.5, 3); c.closePath(); F(c, i ? shade(fc, -0.12) : fc); c.restore(); } E(c, 0, 3.5, 5.4, 3, gr); }
    else if (v === 3) { c.beginPath(); c.moveTo(-3, -4); c.quadraticCurveTo(-10, 2, -9, 9); c.lineTo(-4.5, 6.5); c.lineTo(0, 10); c.lineTo(4.5, 6.5); c.lineTo(9, 9); c.quadraticCurveTo(10, 2, 3, -4); c.closePath(); F(c, fc); E(c, 0, -4.5, 3.6, 2.6, gr); L(c, 0, 5, 0, 11, 1, p.gold); dot(c, 0, 11.6, 1.5, p.gold); }
    else { c.beginPath(); c.moveTo(-2.6, 6); c.quadraticCurveTo(-3, -2, -10, -8); c.quadraticCurveTo(-5, -11.5, 0, -8.5); c.quadraticCurveTo(5, -11.5, 10, -8); c.quadraticCurveTo(3, -2, 2.6, 6); c.closePath(); F(c, fc); E(c, 0, -8.6, 6, 2.4, shade(fc, -0.25)); E(c, 0, 6, 3.4, 2.6, gr); for (i = -1; i <= 1; i++) { L(c, i * 1.6, -8.6, i * 3, -13, 0.7, p.gold); dot(c, i * 3, -13.4, 1.1, p.gold); } }
    c.restore();
    c.save(); c.translate(bx, by); c.rotate(-0.12 + m.sw * 0.05);
    /* tail */
    if (v === 1) for (i = 0; i < 2; i++) { c.save(); c.translate(-12, 5); c.rotate(-0.5 + i * 0.4 + m.sw * 0.12); c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(-16, -1, -27, 5 - i * 2); c.quadraticCurveTo(-15, 4, 0, 2.6); c.closePath(); F(c, i ? dk : body); c.restore(); }
    else for (i = 0; i < 4; i++) { c.save(); c.translate(-12, 5); c.rotate(-0.85 + i * 0.3 + m.sw * 0.12 + k * (i - 1.5) * 0.08); E(c, -9, 0, 9.5, 3.2, i % 2 ? body : dk); dot(c, -16.6, 0, 1.5, '#ffffff'); c.restore(); }
    /* far wing: a blur */
    var fa = Math.sin(m.t * 43) * 0.8, amp = 0.75 + k * 0.35;
    for (i = -2; i <= 2; i++) { c.save(); c.translate(1, -6); c.rotate(-0.25 + i * 0.36 * amp + fa * 0.12); c.beginPath(); c.ellipse(-2, -15, 5, 15, -0.12, 0, TAU); c.fillStyle = alpha(body, i === 0 ? 0.3 : 0.2); c.fill(); c.restore(); }
    L(c, 1, 8, 2.5, 11.5, 1, INK); L(c, 4.5, 8, 6, 11.2, 1, INK);
    E(c, 0, 0, 15.5, 10.5, body, -0.42); E(c, 3.5, 3, 10.5, 5.8, '#f4f1e8', -0.42);
    E(c, 13, -9.5, 9.6, 9.2, body);
    c.beginPath(); c.moveTo(7.5, -3.5); c.quadraticCurveTo(12, 6.5, 19.5, -2); c.quadraticCurveTo(21.5, -6, 20, -8); c.quadraticCurveTo(13, -1.5, 7.5, -3.5); c.closePath(); F(c, thr); /* the jewelled throat */
    dot(c, 12, -0.3, 0.9, 'rgba(255,255,255,0.75)'); dot(c, 15.5, -1.6, 0.8, 'rgba(255,255,255,0.75)'); dot(c, 17.6, -4.2, 0.7, 'rgba(255,255,255,0.75)');
    if (v === 3) for (i = 0; i < 3; i++) { c.save(); c.translate(11 - i * 2.2, -17.5); c.rotate(-0.9 + i * 0.32 - m.sw * 0.15 - k * 0.2); E(c, 0, -4, 1.7, 4.6, i % 2 ? dk : body); c.restore(); }
    var op = m.open > 0.12 ? m.open : 0; /* the long bill */
    c.save(); c.translate(21, -9.6); c.rotate(0.1); c.save(); c.rotate(op * 0.3); Pg(c, [[0, 0], [20, 0.6], [0, 2]], '#4a3a36', true); c.restore(); c.rotate(-op * 0.14); Pg(c, [[-0.5, -1.7], [22, 0], [-0.5, 0.9]], INK, true); L(c, 0, -1.5, 20, -0.2, 0.55, 'rgba(255,255,255,0.6)'); c.restore();
    var blink = frac(m.t * 0.31 + m.ph) < 0.035;
    if (blink) L(c, 13.4, -11, 17.6, -11, 1.1, INK); else { dot(c, 15.5, -11.2, 2.4, INK); dot(c, 16.3, -12.1, 0.9, '#ffffff'); }
    dot(c, 10.6, -12.4, 1.1, '#ffffff'); dot(c, 13.6, -6.6, 1.9, 'rgba(240,96,110,0.45)');
    c.beginPath(); c.arc(4, -7, 9, PI * 0.95, PI * 1.45); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();
    /* near wing: a blur while it hovers, held high and waved to say hello */
    if (m.wave) { c.save(); c.translate(-1, -4); c.rotate(0.05 + Math.sin(m.t * 9) * 0.4); c.beginPath(); c.moveTo(-3.5, 1); c.quadraticCurveTo(-9, -18, -3, -31); c.quadraticCurveTo(5, -18, 3.5, 1); c.closePath(); F(c, dk); L(c, -2, -8, -2.4, -24, 0.7, shade(body, 0.3)); L(c, 1, -8, 0, -20, 0.7, shade(body, 0.3)); c.restore(); }
    else { for (i = -2; i <= 2; i++) { c.save(); c.translate(-1, -4); c.rotate(-1.0 + i * 0.42 * amp - fa * 0.1); c.beginPath(); c.moveTo(-3.5, 1); c.quadraticCurveTo(-9, -18, -3, -30); c.quadraticCurveTo(5, -18, 3.5, 1); c.closePath(); c.fillStyle = alpha(dk, Math.abs(i - Math.round(fa * 2)) < 0.5 ? 0.85 : 0.22); c.fill(); c.restore(); } }
    c.restore();
    for (i = 0; i < 3; i++) { var f = frac(m.t * 0.9 + i / 3); K.twinkle(c, bx - 22 - f * 16, by + 10 + i * 5 - f * 6, 2.6 * (1 - f) + 0.4, alpha(i % 2 ? '#ffffff' : p.gold, (0.9 * (1 - f)).toFixed(2))); }
  }, { wide: 1.1, variants: ['emerald', 'violet swallowtail', 'sapphire', 'rose crested'] });
});
