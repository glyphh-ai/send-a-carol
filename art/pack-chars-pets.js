/* Send a Carol art pack: the pets (pup, kitty, parrot, hamster, bowlfish, tortoise). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var eyes = K.eyes, blush = K.blush, mouth = K.mouth, arm = K.arm, armAngles = K.armAngles;
  var NOSE = '#33231f', PINK = '#f6b4b0', TONGUE = '#f0707f';

  /* ---------- shared pieces ---------- */
  function torsoPath(c, top, w) { /* a seated body: narrow shoulders, round haunches, flat on the floor */
    c.beginPath(); c.moveTo(0, top); c.bezierCurveTo(w * 0.87, top + 2, w * 1.09, -18, w, -6); c.quadraticCurveTo(w * 0.9, 0, 0, 0); c.quadraticCurveTo(-w * 0.9, 0, -w, -6); c.bezierCurveTo(-w * 1.09, -18, -w * 0.87, top + 2, 0, top); c.closePath();
  }
  function torso(c, top, w, fill) { torsoPath(c, top, w); F(c, fill); }
  function blinking(m) { return frac(m.t * 0.31 + m.ph) < 0.035; }
  function puff(c, x, y, r, col, sh) { E(c, x, y, r, r, col); c.beginPath(); c.arc(x, y, r * 0.6, 0.12 * PI, 0.72 * PI); c.lineWidth = r * 0.17; c.lineCap = 'round'; c.strokeStyle = sh; c.stroke(); }
  function wMouth(c, x, y, r, col, w) { c.beginPath(); c.arc(x - r, y, r, 0.1, PI * 0.92); c.moveTo(x + r * 2, y); c.arc(x + r, y, r, 0.05, PI * 0.9); c.lineWidth = w || 1; c.lineCap = 'round'; c.strokeStyle = col; c.stroke(); }
  function toes(c, x, y, col) { L(c, x - 2.6, y + 1.6, x - 2.6, y - 1.4, 0.7, col); L(c, x + 2.6, y + 1.6, x + 2.6, y - 1.4, 0.7, col); }
  function dogFace(c, hx, hy, m, mw, tongue) { /* nose, then the singing mouth or a happy pant */
    E(c, hx, hy + 2.6, 4, 2.9, NOSE); dot(c, hx - 1.2, hy + 1.7, 0.95, 'rgba(255,255,255,0.7)');
    if (m.open > 0.12) mouth(c, hx, hy + 8, mw, m);
    else { wMouth(c, hx, hy + 6.4, mw * 0.5, NOSE, 1); if (tongue) R(c, hx - 2.2, hy + 8.8, 4.4, 4.6 + m.k * 2.4, 2.2, TONGUE); }
  }

  /* ---------- pup: corgi, dachshund, poodle, labrador ---------- */
  Art.add('character', 'pup', function (c, m, p) {
    var v = m.v, i, sw = m.sw, k = m.k, wag = Math.sin(m.t * 14) * 0.35 + sw * 0.3, aa = armAngles(m, 0.8, 0.7), fur, dk, cr, hx, hy, h;
    if (v === 0) { /* corgi: short and wide, satellite-dish ears, white blaze, a bandana */
      fur = '#ee9a3f'; dk = '#bd6c20'; cr = '#fff7ea'; hx = sw * 3; hy = -58 + k * 3;
      c.save(); c.translate(-22, -14); c.rotate(wag * 0.7); puff(c, -3, 0, 7.5, cr, '#e6d3b8'); c.restore(); /* fluffy bob tail */
      torso(c, -49, 27, fur);
      c.beginPath(); c.moveTo(0, -48); c.bezierCurveTo(17, -44, 19, -9, 0, -6); c.bezierCurveTo(-19, -9, -17, -44, 0, -48); c.fillStyle = cr; c.fill();
      for (i = -1; i <= 1; i += 2) { E(c, i * 16, -4.6, 10.5, 5.6, cr); toes(c, i * 16, -3.4, '#d9c3a3'); }
      arm(c, -16, -35, -1, aa[0], 13.5, 8.5, fur, cr, 5.2); if (!m.wave) arm(c, 16, -35, 1, aa[1], 13.5, 8.5, fur, cr, 5.2);
      Pg(c, [[-16, -47], [16, -47], [sw * 1.5, -30]], p.accent); R(c, -17, -50.5, 34, 5.8, 2.9, p.accent); /* bandana */
      dot(c, -6, -43.5, 1.2, p.paper); dot(c, 5.5, -42, 1.2, p.paper); dot(c, 0, -37, 1.2, p.paper); dot(c, -1, -44.5, 0.9, p.gold);
      for (i = -1; i <= 1; i += 2) { /* the ears: huge, upright, a little apart */
        c.save(); c.translate(hx + i * 13, hy - 9); c.rotate(i * (0.12 + k * 0.1) + sw * 0.05);
        c.beginPath(); c.moveTo(-8, 2); c.quadraticCurveTo(-9 + i * 2, -22, i * 3, -31); c.quadraticCurveTo(10 + i * 2, -18, 9, 3); c.closePath(); F(c, fur);
        c.beginPath(); c.moveTo(-4.5, 0); c.quadraticCurveTo(-5 + i * 2, -16, i * 2.6, -24); c.quadraticCurveTo(6 + i * 2, -14, 5, 1); c.closePath(); c.fillStyle = PINK; c.fill(); c.restore();
      }
      E(c, hx, hy, 22.5, 17.5, fur);
      c.beginPath(); c.ellipse(hx, hy - 8, 3.4, 9.5, 0, 0, TAU); c.fillStyle = cr; c.fill(); /* blaze */
      c.beginPath(); c.moveTo(hx - 21, hy + 5); c.quadraticCurveTo(hx - 9, hy - 3, hx, hy + 1); c.quadraticCurveTo(hx + 9, hy - 3, hx + 21, hy + 5); c.quadraticCurveTo(hx + 12, hy + 17, hx, hy + 17.5); c.quadraticCurveTo(hx - 12, hy + 17, hx - 21, hy + 5); c.closePath(); F(c, cr);
      c.beginPath(); c.ellipse(hx, hy - 3, 3, 6, 0, 0, TAU); c.fillStyle = cr; c.fill();
      eyes(c, hx, hy - 3, 9, 2.5, m); blush(c, hx, hy + 5, 15, 2.8);
      dogFace(c, hx, hy + 2, m, 5.4, true);
      if (m.wave) arm(c, 19, -37, 1, aa[1] - 0.4, 17, 8.5, fur, cr, 5.4); /* the waving paw comes out in front */
    } else if (v === 1) { /* dachshund: the long one, in a striped jumper, long velvet ears */
      fur = '#b05f2e'; dk = '#7c3d1c'; cr = '#e6ae74'; hx = sw * 3; hy = -80 + k * 3;
      c.save(); c.translate(-10, -9); c.rotate(-0.75 + wag); R(c, -2, -20, 4, 21, 2, fur); c.restore(); /* whip tail */
      torso(c, -70, 15.5, fur);
      c.save(); torsoPath(c, -70, 15.5); c.clip(); /* the jumper: the body goes on and on */
      c.fillStyle = p.accent2; c.fillRect(-20, -66, 40, 45);
      for (i = 0; i < 5; i++) { c.fillStyle = i % 2 ? p.gold : p.paper; c.fillRect(-20, -59 + i * 8, 40, 2.6); }
      c.fillStyle = shade(p.accent2, -0.22); c.fillRect(-20, -24.5, 40, 3.5); c.restore();
      torsoPath(c, -70, 15.5); c.lineWidth = K.ow(); c.strokeStyle = shade(fur, -0.34); c.stroke();
      for (i = -1; i <= 1; i += 2) { E(c, i * 9.5, -3.6, 8, 4.6, cr); toes(c, i * 9.5, -2.6, dk); }
      arm(c, -13, -55, -1, aa[0], 11, 6.4, p.accent2, cr, 4); if (!m.wave) arm(c, 13, -55, 1, aa[1], 11, 6.4, p.accent2, cr, 4);
      R(c, -9.5, -67.5, 19, 5, 2.5, shade(p.accent2, 0.25)); /* roll neck */
      for (i = -1; i <= 1; i += 2) { /* ears swing out on the beat */
        c.save(); c.translate(hx + i * 12, hy - 7); c.rotate(i * (-0.12 - k * 0.55) - sw * 0.12);
        c.beginPath(); c.moveTo(-5, -3); c.bezierCurveTo(-10 + i * 2, 12, -7 + i * 3, 29, i * 2, 30); c.bezierCurveTo(10 + i * 2, 28, 8, 6, 5, -3); c.closePath(); F(c, dk); c.restore();
      }
      E(c, hx, hy, 15.5, 14, fur);
      E(c, hx, hy + 7.5, 8.6, 9.2, cr); /* long muzzle */
      dot(c, hx - 6.6, hy - 7.2, 1.7, cr); dot(c, hx + 6.6, hy - 7.2, 1.7, cr); /* tan eyebrows */
      eyes(c, hx, hy - 2.6, 6.6, 2.2, m); blush(c, hx, hy + 3.5, 12, 2.3);
      dogFace(c, hx, hy + 3.4, m, 4.6, false);
      if (m.wave) arm(c, 14, -55, 1, aa[1] - 0.45, 15, 6.4, p.accent2, cr, 4.2); /* the short arm waves out past the ear */
    } else if (v === 2) { /* poodle: pom-poms everywhere, a bow in the topknot */
      fur = '#fff6f4'; dk = '#eec3cf'; cr = '#ffffff'; hx = sw * 3; hy = -66 + k * 3;
      c.save(); c.translate(-9, -20); c.rotate(-0.7 + wag * 0.8); L(c, 0, 0, 0, -15, 3.6, shade(fur, -0.34)); L(c, 0, 0, 0, -15, 2.2, fur); puff(c, 0, -18, 6, fur, dk); c.restore();
      for (i = -1; i <= 1; i += 2) { L(c, i * 7.5, -22, i * 8.5, -7, 6.6, shade(fur, -0.34)); L(c, i * 7.5, -22, i * 8.5, -7, 5, fur); puff(c, i * 9.5, -5.5, 7, fur, dk); }
      E(c, 0, -32, 14, 16, fur);
      for (i = -1; i <= 1; i += 2) { /* arms with cuffs */
        if (i > 0 && m.wave) continue;
        h = arm(c, i * 13, -45, i, i < 0 ? aa[0] : aa[1], 14, 4.6, fur); puff(c, h[0], h[1], 5.4, fur, dk);
      }
      puff(c, -9.5, -43, 8.5, fur, dk); puff(c, 9.5, -43, 8.5, fur, dk); puff(c, 0, -38, 9, fur, dk); puff(c, 0, -48, 8, fur, dk); /* the mane */
      R(c, -8, -55.5, 16, 4.2, 2.1, p.accent); E(c, 0, -50.5, 2.4, 2.4, p.gold); /* collar and tag */
      for (i = -1; i <= 1; i += 2) { c.save(); c.translate(hx + i * 15, hy - 3); c.rotate(i * (-0.1 - k * 0.4) - sw * 0.1); puff(c, i * 2, 6, 7.5, fur, dk); puff(c, i * 3.5, 15, 8.5, fur, dk); c.restore(); } /* pom ears */
      puff(c, hx - 8, hy - 17 - k, 8, fur, dk); puff(c, hx + 8, hy - 17 - k, 8, fur, dk); puff(c, hx, hy - 22 - k * 2, 10.5, fur, dk); /* topknot */
      E(c, hx, hy, 15, 14, fur);
      puff(c, hx, hy - 13, 7.5, fur, dk);
      E(c, hx, hy + 7.2, 8, 6.8, cr);
      eyes(c, hx, hy - 2, 6.6, 2.3, m); blush(c, hx, hy + 3.4, 11.6, 2.5);
      dogFace(c, hx, hy + 2.4, m, 4.6, true);
      K.bow(c, hx + 9 + sw, hy - 25 - k * 2, 11, p.accent);
      if (m.wave) { h = arm(c, 15, -45, 1, aa[1] - 0.55, 19, 4.6, fur); puff(c, h[0], h[1], 5.8, fur, dk); }
    } else { /* labrador: big, golden, a tennis ball and an otter tail that never stops */
      fur = '#efc566'; dk = '#c99434'; cr = '#fae7b4'; hx = sw * 3; hy = -72 + k * 3;
      c.save(); c.translate(-20, -9); c.rotate(-0.85 + wag); R(c, -4, -26, 8, 27, 4, fur); c.restore();
      torso(c, -62, 27, fur);
      E(c, 0, -24, 14.5, 18.5, cr);
      for (i = -1; i <= 1; i += 2) { E(c, i * 18, -5, 10.5, 6, fur); toes(c, i * 18, -3.6, dk); }
      arm(c, -21, -47, -1, aa[0], 20, 10, fur, fur, 5.8);
      var ba = m.wave ? aa[1] : 1.3 + k * 0.55 - sw * 0.2; h = arm(c, 21, -47, 1, ba, 20, 10, fur, fur, 5.8);
      var bx = h[0] + 2, by = h[1] - 7 - (m.wave ? 0 : k * 7); /* the ball pops up off the paw on the beat */
      E(c, bx, by, 6.4, 6.4, '#d4e24a'); c.beginPath(); c.arc(bx - 7, by, 7, -0.75, 0.75); c.lineWidth = 1; c.strokeStyle = '#fbfbe8'; c.stroke(); c.beginPath(); c.arc(bx + 7, by, 7, PI - 0.75, PI + 0.75); c.stroke();
      R(c, -14, -57.5, 28, 6, 3, p.accent); E(c, 0, -49.5, 3.6, 3.6, p.gold); dot(c, -0.9, -50.4, 1, 'rgba(255,255,255,0.7)'); /* collar and tag */
      for (i = -1; i <= 1; i += 2) { /* soft folded ears */
        c.save(); c.translate(hx + i * 16, hy - 10); c.rotate(i * (-0.16 - k * 0.5));
        c.beginPath(); c.moveTo(-8, -4); c.bezierCurveTo(-13 + i * 3, 10, -7 + i * 5, 27, i * 3, 27); c.bezierCurveTo(12 + i * 3, 24, 10, 4, 8, -4); c.closePath(); F(c, dk);
        c.beginPath(); c.moveTo(-i * 4, 2); c.quadraticCurveTo(-i * 2, 13, i * 2, 21); c.lineWidth = 0.9; c.strokeStyle = shade(dk, -0.2); c.stroke(); c.restore();
      }
      E(c, hx, hy, 20.5, 17.5, fur);
      E(c, hx, hy + 7.6, 12.5, 9.2, cr);
      L(c, hx - 10.5, hy - 8.2, hx - 6, hy - 9, 1.1, dk); L(c, hx + 10.5, hy - 8.2, hx + 6, hy - 9, 1.1, dk); /* kind eyebrows */
      eyes(c, hx, hy - 2.4, 8.2, 2.5, m); blush(c, hx, hy + 4.4, 15, 2.8);
      E(c, hx, hy + 3, 4.8, 3.4, NOSE); dot(c, hx - 1.4, hy + 2, 1.1, 'rgba(255,255,255,0.7)');
      if (m.open > 0.12) mouth(c, hx, hy + 9, 6.4, m);
      else { wMouth(c, hx, hy + 7.4, 3.3, NOSE, 1.1); R(c, hx - 2.6, hy + 10.2, 5.2, 5.4 + k * 2.6, 2.6, TONGUE); }
    }
  }, { wide: 0.95, variants: ['corgi', 'dachshund', 'poodle', 'labrador'] });

  /* ---------- kitty: tabby, tuxedo, siamese, ginger ---------- */
  var KIT = [
    { fur: '#a7afb9', dk: '#626b78', cr: '#f6f2ea', iris: '#a6d94f', top: -57, w: 23, hy: -61, hr: 19 },
    { fur: '#38343f', dk: '#211f28', cr: '#ffffff', iris: '#f4cc45', top: -62, w: 20.5, hy: -66, hr: 18 },
    { fur: '#f5e9d3', dk: '#5e443b', cr: '#fffaf0', iris: '#58b6f2', top: -66, w: 17, hy: -70, hr: 16.5 },
    { fur: '#f39d3b', dk: '#cf7220', cr: '#fff1dc', iris: '#8fd25c', top: -53, w: 30, hy: -57, hr: 22 }];
  Art.add('character', 'kitty', function (c, m, p) {
    var v = m.v, S = KIT[v], fur = S.fur, dk = S.dk, cr = S.cr, top = S.top, w = S.w, hr = S.hr, sw = m.sw, k = m.k, hx = sw * 3, hy = S.hy + k * 3, i, h;
    var paw = v === 2 ? dk : v === 1 ? cr : v === 3 ? cr : fur, tw = Math.sin(m.t * 3) * 3 + sw * 5;
    /* tail */
    if (v === 3) { /* a great plume */
      c.beginPath(); c.moveTo(22, -8); c.bezierCurveTo(44, -6, 46 + tw, -34, 34 + tw, -46); c.lineCap = 'round'; c.lineWidth = 14.5; c.strokeStyle = shade(fur, -0.34); c.stroke(); c.lineWidth = 12.3; c.strokeStyle = fur; c.stroke();
      c.lineWidth = 2; c.strokeStyle = dk; for (i = 0; i < 3; i++) { var ty = -14 - i * 9, tx = 41 + tw * (i / 3) - i * 0.5; c.beginPath(); c.moveTo(tx - 5, ty + 1); c.lineTo(tx + 5, ty - 2); c.stroke(); }
      dot(c, 34 + tw, -46, 5.4, cr);
    } else K.tabbyTail(c, w - 7, -8, 1, m, v === 2 ? dk : fur, v === 0 ? dk : v === 1 ? cr : dk);
    torso(c, top, w, fur);
    if (v === 0 || v === 3) { /* stripes down the sides */
      c.save(); torsoPath(c, top, w); c.clip(); c.lineWidth = v === 3 ? 2.6 : 2.2; c.strokeStyle = dk; c.lineCap = 'round';
      for (i = 0; i < 4; i++) for (var s = -1; s <= 1; s += 2) { var sy = top + 16 + i * 9; c.beginPath(); c.moveTo(s * (w + 2), sy); c.quadraticCurveTo(s * (w - 4), sy + 1, s * (w - 9), sy + 3.5); c.stroke(); }
      c.restore();
    }
    if (v === 1) { c.beginPath(); c.moveTo(0, top + 3); c.bezierCurveTo(w * 0.7, top + 8, w * 0.62, -8, 0, -5); c.bezierCurveTo(-w * 0.62, -8, -w * 0.7, top + 8, 0, top + 3); c.fillStyle = cr; c.fill(); } /* the shirt front */
    else E(c, 0, -22, w * 0.52, 16, cr);
    for (i = -1; i <= 1; i += 2) { E(c, i * w * 0.42, -4, 8, 5, paw); toes(c, i * w * 0.42, -3, v === 2 ? shade(dk, 0.3) : shade(fur, -0.3)); }
    /* arms: the left holds something, the right bats and waves */
    var aa = armAngles(m, 1.0, 0.75), la = v === 0 || v === 3 ? 1.55 + k * 0.35 : aa[0], sy0 = top + 17;
    h = arm(c, -w * 0.62, sy0, -1, la, 14.5, 6.6, fur, paw, 4.1);
    if (v === 0) { /* a ball of wool, the thread trailing to the floor */
      var yx = h[0] - 3, yy = h[1] - 5;
      c.beginPath(); c.moveTo(yx - 2, yy + 5); c.bezierCurveTo(yx - 12, yy + 16, yx + 6 + sw * 3, yy + 22, yx - 6, -1.5); c.lineWidth = 1.1; c.strokeStyle = p.accent; c.stroke();
      E(c, yx, yy, 7.2, 7.2, p.accent); c.lineWidth = 0.9; c.strokeStyle = shade(p.accent, 0.4);
      for (i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(yx, yy, 6.4, 2.2 + Math.abs(i) * 1.8, 0.6 + i * 0.7, 0, PI); c.stroke(); }
    }
    if (v === 3) { /* a toy fish, held up proudly */
      c.save(); c.translate(h[0] - 3, h[1] - 6); c.rotate(-0.5 + sw * 0.25);
      Pg(c, [[-6, 0], [-12.5, -4.6], [-12.5, 4.6]], shade(p.accent2, -0.12)); E(c, 0, 0, 8, 5, p.accent2); dot(c, 3.6, -1.2, 1.2, '#fff'); dot(c, 3.9, -1.2, 0.6, NOSE);
      c.beginPath(); c.arc(-0.5, 0, 3.4, -0.9, 0.9); c.lineWidth = 0.8; c.strokeStyle = shade(p.accent2, 0.4); c.stroke(); c.restore();
    }
    if (!m.wave) arm(c, w * 0.62, sy0, 1, aa[1], 14.5, 6.6, fur, paw, 4.1);
    if (v === 1) K.bow(c, 0, top + 6.5, 15, p.accent);
    if (v === 2) { R(c, -8.5, top + 3.2, 17, 4.4, 2.2, p.accent2); E(c, 0, top + 9.4, 3, 3, p.gold); L(c, -1.6, top + 10.2, 1.6, top + 10.2, 0.7, shade(p.gold, -0.4)); } /* collar and bell */
    if (v === 0) { R(c, -10, top + 2.6, 20, 4.2, 2.1, p.accent2); E(c, 0, top + 8, 2.4, 2.4, p.gold); }
    /* ears */
    var eh = v === 2 ? 30 : v === 3 ? 22 : 26, ec = v === 2 ? dk : fur;
    for (i = -1; i <= 1; i += 2) {
      Pg(c, [[hx + i * hr * 0.3, hy - hr * 0.62], [hx + i * hr * 0.9, hy - eh - k * 2], [hx + i * hr * 0.98, hy - hr * 0.26]], ec);
      Pg(c, [[hx + i * hr * 0.52, hy - hr * 0.68], [hx + i * hr * 0.83, hy - eh + 6 - k * 2], [hx + i * hr * 0.87, hy - hr * 0.46]], v === 2 ? '#8a665c' : PINK, true);
    }
    if (v === 3) for (i = -1; i <= 1; i += 2) { Pg(c, [[hx + i * 19, hy + 1], [hx + i * 27, hy + 4.5], [hx + i * 19.5, hy + 7]], fur); Pg(c, [[hx + i * 18, hy + 6], [hx + i * 25, hy + 11], [hx + i * 16, hy + 12]], fur); } /* cheek ruff */
    E(c, hx, hy, hr, hr * 0.84, fur);
    c.save(); c.beginPath(); c.ellipse(hx, hy, hr - 0.5, hr * 0.84 - 0.5, 0, 0, TAU); c.clip();
    if (v === 0 || v === 3) { /* tabby marks */
      for (i = -1; i <= 1; i++) L(c, hx + i * 4.2, hy - hr * 0.84, hx + i * 3.5, hy - hr * 0.84 + 6.4 - Math.abs(i) * 1.2, 1.8, dk);
      for (i = -1; i <= 1; i += 2) { L(c, hx + i * (hr + 1), hy - 2, hx + i * (hr - 5), hy - 1, 1.6, dk); L(c, hx + i * (hr + 1), hy + 3.4, hx + i * (hr - 4.4), hy + 3, 1.6, dk); }
    }
    if (v === 1) { c.beginPath(); c.moveTo(hx, hy - 7); c.bezierCurveTo(hx + 4, hy - 1, hx + 15, hy + 5, hx + 13, hy + 20); c.lineTo(hx - 13, hy + 20); c.bezierCurveTo(hx - 15, hy + 5, hx - 4, hy - 1, hx, hy - 7); c.fillStyle = cr; c.fill(); } /* white blaze and chin */
    if (v === 2) { c.beginPath(); c.ellipse(hx, hy + 3.5, hr * 0.66, hr * 0.58, 0, 0, TAU); c.fillStyle = mix(dk, fur, 0.12); c.fill(); } /* the mask */
    c.restore();
    if (v !== 1) E(c, hx, hy + hr * 0.33, hr * 0.44, hr * 0.31, v === 2 ? '#8a665c' : cr);
    /* bright cat eyes */
    var bl = blinking(m), dx = hr * 0.41, ey = hy - 1.5;
    if (!bl) for (i = -1; i <= 1; i += 2) { c.beginPath(); c.ellipse(hx + i * dx, ey, 3.5, 3.8, 0, 0, TAU); c.fillStyle = S.iris; c.fill(); c.lineWidth = 0.7; c.strokeStyle = '#1d1a1e'; c.stroke(); }
    eyes(c, hx, ey, dx, bl ? 2.4 : 1.9, m, bl ? (v === 1 || v === 2 ? '#f1ece4' : '#2e2a26') : '#1d1a1e');
    blush(c, hx, hy + 4.8, hr * 0.72, 2.6, v === 1 || v === 2 ? 'rgba(255,140,150,0.5)' : undefined);
    Pg(c, [[hx - 2, hy + 2.8], [hx + 2, hy + 2.8], [hx, hy + 5]], '#ee7f95', true);
    if (m.open > 0.12) mouth(c, hx, hy + 6.6, 4.3, m);
    else wMouth(c, hx, hy + 5.2, 2.2, v === 2 ? '#2a1c18' : '#6a3a22', 0.9);
    for (i = -1; i <= 1; i += 2) { L(c, hx + i * hr * 0.5, hy + 5.4, hx + i * (hr + 3.5), hy + 3.6 - k, 0.5, '#fff'); L(c, hx + i * hr * 0.5, hy + 7, hx + i * (hr + 3), hy + 8.6 + k, 0.5, '#fff'); }
    if (m.wave) arm(c, w * 0.72, sy0 + 1, 1, aa[1] - 0.4, 18, 6.6, fur, paw, 4.4); /* the waving paw comes out in front */
  }, { wide: 0.95, variants: ['tabby', 'tuxedo', 'siamese', 'ginger'] });

  /* ---------- parrot: scarlet macaw, blue-and-gold macaw, green parrot, cockatoo ---------- */
  var PAR = [
    { b: '#e23a30', bel: '#f0563f', w1: '#f6c738', w2: '#2f7fd6', face: '#fff6ec', beak: '#f3e6c8', low: '#3a3038', tail: ['#2f7fd6', '#e23a30', '#f6c738'], tl: 31 },
    { b: '#2f8add', bel: '#f8c62f', w1: '#3ea0ea', w2: '#1e5aa8', face: '#fff6ec', beak: '#3d3640', low: '#2a242c', tail: ['#1e5aa8', '#2f8add', '#f8c62f'], tl: 31 },
    { b: '#42b05a', bel: '#74cc6c', w1: '#e23a30', w2: '#2f7fd6', face: null, beak: '#efe0bd', low: '#b9a37c', tail: ['#2f8f4a', '#42b05a', '#e23a30'], tl: 19 },
    { b: '#fffaf2', bel: '#ffffff', w1: '#ffe9a6', w2: '#ffd866', face: null, beak: '#5c5764', low: '#45414c', tail: ['#f3e4c9', '#fffaf2', '#fff0c2'], tl: 16 }];
  Art.add('character', 'parrot', function (c, m, p) {
    var v = m.v, S = PAR[v], b = S.b, sw = m.sw, k = m.k, hx = sw * 2.6, hy = -70 + k * 2.8, aa = armAngles(m, 0.95, 0.8), i, ft = '#77707c';
    for (i = -1; i <= 1; i += 2) { L(c, i * 7, -11, i * 8, -2.6, 2.6, ft); L(c, i * 8, -2.6, i * 8 - 4.6, -0.9, 2.2, ft); L(c, i * 8, -2.6, i * 8 + 4.6, -0.9, 2.2, ft); L(c, i * 8, -2.6, i * 8, -0.4, 2.2, ft); }
    for (i = 0; i < 3; i++) { c.save(); c.translate(-8, -20); c.rotate(-0.42 + i * 0.26 + sw * 0.14 + Math.sin(m.t * 2 + i) * 0.03); E(c, -S.tl * 0.55, 0, S.tl * 0.6, 4.6, S.tail[i]); c.restore(); } /* tail feathers */
    function wing(s, a) { c.save(); c.translate(s * 20, -47); c.rotate(-s * a); E(c, 0, 13, 9, 17.5, shade(b, -0.1)); E(c, s * 0.6, 17.5, 7.2, 12.6, S.w1); E(c, s * 1, 21.5, 5.4, 8.4, S.w2); L(c, -2, 23, -2, 29, 0.8, shade(S.w2, -0.25)); L(c, 2, 23, 2, 29, 0.8, shade(S.w2, -0.25)); c.restore(); }
    wing(-1, aa[0]);
    E(c, 0, -34, 21.5, 26.5, b);
    E(c, 2, -29, 13.5, 18.5, S.bel);
    c.lineWidth = 0.9; c.strokeStyle = shade(S.bel, -0.16); for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 6.4, -25 - Math.abs(i) * 3); c.lineTo(2 + i * 6.4, -22.5 - Math.abs(i) * 3); c.lineTo(4 + i * 6.4, -25 - Math.abs(i) * 3); c.stroke(); }
    wing(1, m.wave ? aa[1] : Math.max(0.5, aa[1]));
    if (v === 3) for (i = -2; i <= 2; i++) { c.save(); c.translate(hx + i * 2.4, hy - 13); c.rotate(i * (0.2 + k * 0.22) + sw * 0.15); E(c, 0, -9 - k * 3, 3, 10.5 + k * 2, i % 2 ? '#ffe37a' : '#f7cf38'); c.restore(); } /* the crest lifts on the beat */
    if (v < 3) for (i = -1; i <= 1; i++) { c.save(); c.translate(hx + i * 2.6, hy - 14.5); c.rotate(i * 0.5 + sw * 0.2); E(c, 0, -3.6 - k, 2.4, 5, i ? shade(b, -0.15) : b); c.restore(); }
    E(c, hx, hy, 17.5, 16, b);
    c.save(); c.beginPath(); c.ellipse(hx, hy, 17, 15.5, 0, 0, TAU); c.clip();
    if (v === 1) { c.beginPath(); c.ellipse(hx, hy - 14, 13, 6.5, 0, 0, TAU); c.fillStyle = '#58bb5c'; c.fill(); }
    if (v === 2) { c.beginPath(); c.ellipse(hx, hy - 13, 14, 8.5, 0, 0, TAU); c.fillStyle = '#f7d43a'; c.fill(); c.fillStyle = '#58a6e8'; c.fillRect(hx - 18, hy + 9, 36, 8); }
    if (S.face) { /* the bare white face of a macaw, with its little feather lines */
      c.beginPath(); c.ellipse(hx, hy + 1.5, 14.5, 9.6, 0, 0, TAU); c.fillStyle = S.face; c.fill();
      c.lineWidth = 0.6; c.strokeStyle = v === 0 ? '#e9897c' : '#3d3640'; for (i = -1; i <= 1; i += 2) for (var j = 0; j < 3; j++) { c.beginPath(); c.moveTo(hx + i * 9.5, hy + 4.5 + j * 1.9); c.lineTo(hx + i * 13.6, hy + 3.6 + j * 1.9); c.stroke(); }
      if (v === 1) { c.fillStyle = '#2a242c'; c.fillRect(hx - 9, hy + 11.2, 18, 6); }
    }
    c.restore();
    eyes(c, hx, hy - 2.4, 8, 2.4, m); blush(c, hx, hy + 3.4, 13, 2.4, v === 3 ? 'rgba(255,150,70,0.6)' : undefined);
    /* the great hooked beak */
    var op = m.open > 0.12 ? m.open : 0;
    if (op) { E(c, hx, hy + 11.5 + op * 3.5, 5.6, 3.4 + op * 4.6, '#6a1d2a'); dot(c, hx, hy + 13 + op * 6.5, 2.3, '#e8707e'); }
    c.beginPath(); c.ellipse(hx, hy + 10.6 + op * 10, 5.6, 3, 0, 0, PI); c.closePath(); F(c, S.low);
    if (op) hy -= op * 1.6; /* the top of the beak tips up as it sings */
    c.beginPath(); c.moveTo(hx - 7.6, hy + 1.6); c.quadraticCurveTo(hx, hy - 5.6, hx + 7.6, hy + 1.6); c.bezierCurveTo(hx + 7.4, hy + 7, hx + 3, hy + 9, hx, hy + 14.6); c.bezierCurveTo(hx - 3, hy + 9, hx - 7.4, hy + 7, hx - 7.6, hy + 1.6); c.closePath(); F(c, S.beak);
    c.beginPath(); c.ellipse(hx - 2.2, hy + 2.4, 2.2, 3.6, 0.35, 0, TAU); c.fillStyle = v === 1 || v === 3 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.6)'; c.fill();
    dot(c, hx - 2.4, hy - 0.2, 0.6, shade(S.beak, -0.45)); dot(c, hx + 2.4, hy - 0.2, 0.6, shade(S.beak, -0.45));
  }, { wide: 0.9, variants: ['scarlet macaw', 'blue-and-gold macaw', 'green parrot', 'cockatoo'] });

  /* ---------- hamster: golden, grey dwarf, cream, panda ---------- */
  var HAM = [
    { fur: '#f2ab58', dk: '#c9772c', cr: '#fff7e8', sc: 1 },
    { fur: '#aeb4bc', dk: '#69707b', cr: '#f7f4ef', sc: 0.86 },
    { fur: '#fbeed6', dk: '#e6c38e', cr: '#ffffff', sc: 0.95 },
    { fur: '#423e49', dk: '#28252e', cr: '#ffffff', sc: 0.93 }];
  Art.add('character', 'hamster', function (c, m, p) {
    var v = m.v, S = HAM[v], fur = S.fur, dk = S.dk, cr = S.cr, sw = m.sw, k = m.k, hx = sw * 2, hy = -60 + k * 3, pk = 1 + k * 0.16, i, hand = '#f7b9b0';
    c.save(); c.scale(S.sc, S.sc);
    E(c, -24 - sw, -9, 5, 4, hand); /* stub of a tail */
    for (i = -1; i <= 1; i += 2) { E(c, i * 13, -3.2, 9, 4.2, hand); toes(c, i * 13 + i * 2, -2.6, '#e08f88'); }
    if (v === 2) for (i = -1; i <= 1; i += 2) for (var q = 0; q < 4; q++) E(c, i * (29.5 - q * q * 1.1), -36 + q * 10.5, 7.5, 7, fur); /* long-haired: soft fluff down the sides */
    E(c, 0, -31, 31, 31, fur);
    if (v === 2) { c.lineWidth = 0.9; c.strokeStyle = dk; for (i = -1; i <= 1; i += 2) for (q = 0; q < 3; q++) { c.beginPath(); c.arc(i * (24 - q * 1.5), -34 + q * 10, 5, i > 0 ? -0.5 : PI - 0.7, i > 0 ? 0.7 : PI + 0.5); c.stroke(); } }
    E(c, 0, -26, 20, 21.5, cr);
    /* ears */
    for (i = -1; i <= 1; i += 2) { c.save(); c.translate(hx + i * 20, hy - 18); c.rotate(i * (0.2 + k * 0.25)); E(c, 0, 0, v === 1 ? 6.4 : 8, v === 1 ? 6.6 : 8.6, v === 3 ? dk : fur); dot(c, 0, 0.8, v === 1 ? 3.6 : 4.8, '#f3a9a8'); c.restore(); }
    E(c, hx, hy, 29, 24.5, fur);
    if (v === 1) { c.beginPath(); c.ellipse(hx, hy - 15, 3.6, 9, 0, 0, TAU); c.fillStyle = dk; c.fill(); } /* the dorsal stripe */
    if (v === 3) { for (i = -1; i <= 1; i++) { c.save(); c.translate(hx + i * 3, hy - 23); c.rotate(i * 0.5 + sw * 0.2); E(c, 0, -3.5 - k, 2.6, 5.4, fur); c.restore(); } }
    if (v === 0) { c.beginPath(); c.ellipse(hx, hy - 9, 4.2, 11, 0, 0, TAU); c.fillStyle = cr; c.fill(); }
    /* the cheek pouches: they puff on the beat */
    for (i = -1; i <= 1; i += 2) E(c, hx + i * 14, hy + 8.5, 14 * pk, 11.6 * pk, cr);
    c.beginPath(); c.ellipse(hx, hy + 8, 14, 10.5, 0, 0, TAU); c.fillStyle = cr; c.fill();
    eyes(c, hx, hy - 3.4, 10.5, 2.9, m); blush(c, hx, hy + 5.6, 19.5, 3.4);
    Pg(c, [[hx - 2.2, hy + 2.2], [hx + 2.2, hy + 2.2], [hx, hy + 4.6]], '#ee7f95', true);
    if (m.open > 0.12) mouth(c, hx, hy + 7.4, 4.6, m);
    else { wMouth(c, hx, hy + 5, 2.2, '#8a5a4a', 0.9); Rn(c, hx - 1.8, hy + 6.6, 3.6, 3.6, 0.8, '#ffffff'); L(c, hx, hy + 6.8, hx, hy + 10, 0.4, '#d8cfc4'); }
    for (i = -1; i <= 1; i += 2) { L(c, hx + i * 13, hy + 6.4, hx + i * 31, hy + 3.6 - k * 1.5, 0.5, v === 3 ? '#cfcad6' : shade(fur, -0.25)); L(c, hx + i * 13, hy + 8.6, hx + i * 30, hy + 10.6 + k * 1.5, 0.5, v === 3 ? '#cfcad6' : shade(fur, -0.25)); }
    if (v === 2) K.bow(c, hx + 17, hy - 22 - k, 11, p.accent2);
    /* the snack, nibbled on the beat; the right paw lets go to wave */
    var sx = -3 + sw * 1.2, sy = -36 - k * 3.5;
    if (v === 0) { /* a sunflower seed */
      c.save(); c.translate(sx, sy); c.rotate(0.2); c.beginPath(); c.moveTo(0, -9.5); c.bezierCurveTo(7, -3, 6, 6, 0, 8.5); c.bezierCurveTo(-6, 6, -7, -3, 0, -9.5); c.closePath(); F(c, '#4a4046');
      c.lineWidth = 1.1; c.strokeStyle = '#f3ead8'; c.beginPath(); c.moveTo(-2.4, -4.5); c.quadraticCurveTo(-3.6, 1, -1.8, 6); c.moveTo(2.4, -4.5); c.quadraticCurveTo(3.6, 1, 1.8, 6); c.moveTo(0, -7); c.lineTo(0, 7); c.stroke(); c.restore();
    } else if (v === 1) { /* a strawberry */
      c.beginPath(); c.moveTo(sx, sy + 9); c.bezierCurveTo(sx - 11, sy + 1, sx - 8, sy - 8, sx, sy - 6.5); c.bezierCurveTo(sx + 8, sy - 8, sx + 11, sy + 1, sx, sy + 9); c.closePath(); F(c, p.accent);
      for (i = 0; i < 5; i++) dot(c, sx + [-3.6, 3.4, 0, -1.6, 2][i], sy + [-1.5, -1, 1.8, 4.6, 4.4][i], 0.6, '#ffe9a8');
      Pg(c, [[sx - 6, sy - 6.4], [sx - 2, sy - 9.6], [sx, sy - 6.2], [sx + 2, sy - 9.6], [sx + 6, sy - 6.4], [sx, sy - 4.4]], '#4fae5c');
    } else if (v === 2) { /* a carrot */
      c.save(); c.translate(sx, sy); c.rotate(-0.5);
      for (i = -1; i <= 1; i++) { c.save(); c.translate(0, -8); c.rotate(i * 0.45); E(c, 0, -5, 1.9, 5.6, '#56b35f'); c.restore(); }
      c.beginPath(); c.moveTo(-5.4, -8); c.quadraticCurveTo(0, -11, 5.4, -8); c.quadraticCurveTo(3.4, 6, 0, 12); c.quadraticCurveTo(-3.4, 6, -5.4, -8); c.closePath(); F(c, '#f58a2c');
      L(c, -2.6, -3.6, 0.6, -3, 0.6, '#c9641a'); L(c, 2.6, 0.6, -0.4, 1.2, 0.6, '#c9641a'); L(c, -1.8, 5, 0.8, 5.4, 0.6, '#c9641a'); c.restore();
    } else { /* a biscuit with a bite out of it */
      E(c, sx, sy, 9, 9, '#dba55c'); dot(c, sx + 7.6, sy - 5.6, 3.6, cr);
      for (i = 0; i < 5; i++) dot(c, sx + [-3.6, 2.4, -0.6, 3.6, -4.4][i], sy + [-3, 1, 4.4, 5, 2.2][i], 1.25, '#5a3524');
    }
    E(c, sx - 8.5, sy + 2, 4.2, 3.6, hand);
    if (m.wave) arm(c, 26, -41, 1, armAngles(m, 1, 0)[1] - 0.5, 15, 6.6, fur, hand, 4.4);
    else E(c, sx + 8.5, sy + 2, 4.2, 3.6, hand);
    c.restore();
  }, { wide: 0.95, variants: ['golden hamster', 'grey dwarf hamster', 'long-haired cream hamster', 'panda hamster'] });

  /* ---------- bowlfish: a goldfish in its bowl, and the bowl hops ---------- */
  var FISH = [
    { b: '#ff8a2a', f: '#ffb44a', bel: '#ffd49a' },
    { b: '#fff4ea', f: '#ff8266', bel: '#ffffff' },
    { b: '#45404f', f: '#655f72', bel: '#58525f' },
    { b: '#ffd23f', f: '#ffe98c', bel: '#fff3c2' }];
  function bowlPath(c, cy, r) { c.beginPath(); c.arc(0, cy, r, -PI / 2 + 0.6, -PI / 2 - 0.6 + TAU); c.closePath(); }
  Art.add('character', 'bowlfish', function (c, m, p) {
    var v = m.v, S = FISH[v], sw = m.sw, k = m.k, t = m.t, cy = -40, r = 37, i, rimY = cy - r * Math.cos(0.6), rimX = r * Math.sin(0.6);
    var up = m.wave ? 1 : 0, fx = sw * 4 - 1, fy = up ? -74 + Math.sin(t * 4.5) * 1.6 : -36 - k * 5, tilt = sw * 3.2, wy = -61;
    R(c, -17, -7, 34, 7.5, 3.5, v === 1 ? p.accent2 : '#cfe9f6'); /* foot of the bowl */
    bowlPath(c, cy, r); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fill();
    c.save(); bowlPath(c, cy, r); c.clip();
    c.beginPath(); c.moveTo(-40, wy + tilt); c.quadraticCurveTo(-12, wy + tilt * 0.3 - k * 1.5, 0, wy); c.quadraticCurveTo(12, wy - tilt * 0.3 + k * 1.5, 40, wy - tilt); c.lineTo(40, 2); c.lineTo(-40, 2); c.closePath(); c.fillStyle = 'rgba(86,186,232,0.86)'; c.fill();
    c.lineWidth = 1.3; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.moveTo(-40, wy + tilt); c.quadraticCurveTo(-12, wy + tilt * 0.3 - k * 1.5, 0, wy); c.quadraticCurveTo(12, wy - tilt * 0.3 + k * 1.5, 40, wy - tilt); c.stroke();
    c.beginPath(); c.ellipse(0, -2, 34, 10.5, 0, 0, TAU); c.fillStyle = v === 2 ? '#f3c7d2' : '#f1d9a4'; c.fill(); /* gravel */
    var G = [p.accent, p.gold, '#ffffff', p.accent2, '#ff9ecb'];
    for (i = 0; i < 11; i++) dot(c, -25 + i * 5 + (i % 2), -9.4 + (i % 3) * 1.7 + Math.abs(i - 5) * 0.62, 1.5, G[i % 5]);
    if (v === 0 || v === 3) { /* waterweed */
      for (i = 0; i < 3; i++) { var gx = -22 + i * 5, gh = 20 + i * 7, bend = Math.sin(t * 1.6 + i) * 3 + sw * 3; c.beginPath(); c.moveTo(gx, -8); c.quadraticCurveTo(gx - 5 + bend, -8 - gh * 0.5, gx + bend, -8 - gh); c.lineWidth = 3.4; c.lineCap = 'round'; c.strokeStyle = i % 2 ? '#3d9a5a' : '#57b36f'; c.stroke(); }
    }
    if (v === 1) { /* a little castle */
      Rn(c, 14, -27, 13, 20, 1, shade(p.accent2, 0.25)); for (i = 0; i < 3; i++) Rn(c, 14 + i * 4.7, -30.5, 3.6, 4, 0.5, shade(p.accent2, 0.25));
      Rn(c, 18.2, -16, 4.6, 9, 2.3, shade(p.accent2, -0.3)); L(c, 20.5, -30, 20.5, -39, 0.8, '#6b5a4a'); Pg(c, [[20.5, -39], [26.5 + sw, -37], [20.5, -35]], p.accent, true);
    }
    if (v === 2) { /* a shell and its pearl */
      c.beginPath(); c.arc(20, -10, 9, PI, TAU); c.closePath(); c.fillStyle = '#ffb3c7'; c.fill(); c.lineWidth = 0.7; c.strokeStyle = '#e38aa4'; for (i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(20, -10); c.lineTo(20 + i * 3.6, -18 + Math.abs(i) * 1.4); c.stroke(); }
      dot(c, 20, -9.6, 2.6, '#ffffff'); dot(c, 19.2, -10.4, 0.9, 'rgba(255,255,255,0.9)');
      for (i = 0; i < 2; i++) { var qx = -24 + i * 5, bend2 = Math.sin(t * 1.6 + i) * 3 + sw * 3; c.beginPath(); c.moveTo(qx, -8); c.quadraticCurveTo(qx - 4 + bend2, -18, qx + bend2, -27 - i * 6); c.lineWidth = 3.2; c.lineCap = 'round'; c.strokeStyle = i ? '#b06ad0' : '#8f58b8'; c.stroke(); }
    }
    for (i = 0; i < 3; i++) { var bu = frac(t * 0.42 + i / 3), bx = 15 + i * 3.5 + Math.sin(t * 3 + i * 2) * 1.6, by = -22 - bu * 37; c.beginPath(); c.arc(bx, by, 1.5 + i * 0.6, 0, TAU); c.lineWidth = 0.75; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke(); }
    c.restore();
    function fish() {
      var tf = Math.sin(t * 7) * 0.3 + sw * 0.4, tl = v === 3 ? 19 : 13.5;
      c.save(); c.translate(fx, fy); c.rotate(up ? -0.3 : sw * 0.08 - k * 0.1);
      for (i = -1; i <= 1; i += 2) { c.save(); c.translate(-14, 0); c.rotate(i * 0.5 + tf); c.beginPath(); c.moveTo(2, 0); c.bezierCurveTo(-tl * 0.5, i * 2, -tl, i * 3, -tl - 2, i * 10); c.bezierCurveTo(-tl * 0.4, i * 12, -1, i * 6, 2, 0); c.closePath(); F(c, S.f); c.restore(); } /* fantail */
      c.beginPath(); c.moveTo(-9, -10.5); c.quadraticCurveTo(-4, -22 - (v === 3 ? 5 : 0), 6, -12); c.closePath(); F(c, S.f); /* dorsal fin */
      E(c, 0, 0, 17.5, 13.5, S.b);
      c.save(); c.beginPath(); c.ellipse(0, 0, 17, 13, 0, 0, TAU); c.clip();
      c.beginPath(); c.ellipse(2, 8, 15, 8, 0, 0, TAU); c.fillStyle = S.bel; c.fill();
      if (v === 1) { E(c, -8, -8, 7.5, 6, '#f2542d'); E(c, 9, -11, 6, 4.6, '#f2542d'); dot(c, -3, 4, 2.4, '#3a3038'); dot(c, -11, 2.6, 1.6, '#3a3038'); }
      c.lineWidth = 0.8; c.strokeStyle = v === 2 ? '#6f697c' : shade(S.b, -0.2); for (i = 0; i < 3; i++) { c.beginPath(); c.arc(-11 + i * 3.6, -1 + (i % 2) * 4, 3, -0.9, 0.9); c.stroke(); }
      c.restore();
      for (i = -1; i <= 1; i += 2) dot(c, 6.5 + i * 5.2, -2.4, 4.3, '#ffffff');
      eyes(c, 6.5, -2.2, 5.2, 2.5, { t: m.t, ph: m.ph + 0.37, calm: m.calm }); blush(c, 6.5, 3.4, 9, 2.2); /* its own blink time */
      if (m.open > 0.12) mouth(c, 7, 4.6, 3.8, m); else { c.beginPath(); c.arc(7, 4.8, 2.4, 0.2 * PI, 0.8 * PI); c.lineWidth = 0.9; c.strokeStyle = '#6a2a1d'; c.stroke(); }
      var fa = up ? 2.75 + Math.sin(t * 9) * 0.45 : 0.5 + Math.max(0, sw) * 0.9 + k * 0.4; /* the fin that waves */
      c.save(); if (up) { c.translate(14, 4); c.rotate(-fa); c.scale(1.2, 1.2); } else { c.translate(-2, 6); c.rotate(-fa + 0.4); } c.beginPath(); c.moveTo(-2.6, 0); c.quadraticCurveTo(-5, 9, 0, 12.5); c.quadraticCurveTo(5, 9, 2.6, 0); c.closePath(); F(c, S.f); c.restore();
      c.restore();
    }
    if (!up) fish();
    /* the glass in front */
    bowlPath(c, cy, r); c.lineWidth = 1.5; c.strokeStyle = 'rgba(46,84,120,0.6)'; c.stroke();
    c.beginPath(); c.arc(0, cy, r - 5, PI * 1.02, PI * 1.3); c.lineWidth = 3; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.78)'; c.stroke();
    c.beginPath(); c.arc(0, cy, r - 5, PI * 1.36, PI * 1.41); c.stroke();
    c.beginPath(); c.arc(0, cy, r - 4, 0.12 * PI, 0.3 * PI); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();
    c.beginPath(); c.ellipse(0, rimY, rimX, 4.4, 0, 0, TAU); c.lineWidth = 3.4; c.strokeStyle = 'rgba(46,84,120,0.6)'; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#eaf7fd'; c.stroke();
    if (up) { /* out for a look: the fish comes up through the rim, and a ring of splash with it */
      fish();
      for (i = -1; i <= 1; i += 2) { c.beginPath(); c.ellipse(i * 22, rimY - 7 - Math.abs(Math.sin(t * 4.5)) * 3, 1.7, 2.9, i * 0.5, 0, TAU); c.fillStyle = 'rgba(120,205,240,0.95)'; c.fill(); c.beginPath(); c.ellipse(i * 27, rimY - 1, 1.3, 2.2, i * 0.7, 0, TAU); c.fill(); }
    }
    if (k > 0.05 && !up) { /* drops jump on the beat */
      c.fillStyle = 'rgba(120,205,240,' + clamp(k * 1.4, 0, 0.95).toFixed(3) + ')';
      for (i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(i * 9 + sw * 3, rimY - 4 - k * (9 + Math.abs(i) * -3), 1.5, 2.5, 0, 0, TAU); c.fill(); }
    }
    if (v === 3) K.bow(c, rimX - 3, rimY + 5, 13, p.accent);
  }, { wide: 0.9, variants: ['goldfish', 'calico goldfish with a castle', 'black moor with a pearl', 'veiltail with a bow'] });

  /* ---------- tortoise: classic, the elder, the gardener, the hatchling ---------- */
  var TOR = [
    { sk: '#8fc76a', sh: '#96663a', sc: '#bd8c52', rim: '#dcb26e', top: -68, hr: 13.5 },
    { sk: '#aab78a', sh: '#5d6e58', sc: '#7f9172', rim: '#bcc79c', top: -62, hr: 13 },
    { sk: '#9bd27c', sh: '#e27d99', sc: '#f5a9ba', rim: '#ffd9df', top: -72, hr: 13.5 },
    { sk: '#b9df6c', sh: '#3d9a6c', sc: '#58b584', rim: '#f4d552', top: -56, hr: 16 }];
  Art.add('character', 'tortoise', function (c, m, p) {
    var v = m.v, S = TOR[v], sk = S.sk, top = S.top, sw = m.sw, k = m.k, i, far = shade(sk, -0.16), nail = '#f6efd8';
    var hx = 41 + sw * 2.4 + k, hy = top + 10 - k * 6 - (m.open > 0.12 ? 2 : 0), hr = S.hr, st = Math.max(0, sw) * 3, sb = Math.max(0, -sw) * 3;
    function leg(x, lift, col) { R(c, x - 6.8, -18 - lift, 13.6, 18, 5.6, col); for (var j = -1; j <= 1; j++) dot(c, x + j * 3.6, -1.9 - lift, 1.1, nail); }
    c.save(); c.translate(-4, 0);
    Pg(c, [[-37, -17], [-48, -9 + Math.sin(m.t * 5) * 1.2 + sw * 1.5], [-35, -8]], sk); /* tail */
    leg(-15, st, far); leg(21, sb, far);
    L(c, 25, -27, hx - 3, hy + 6, 12.6, shade(sk, -0.34)); L(c, 25, -27, hx - 3, hy + 6, 10.4, sk); /* the neck stretches on the beat */
    c.beginPath(); c.moveTo(-41, -19); c.bezierCurveTo(-41, top - 5, 35, top - 5, 35, -19); c.closePath(); F(c, S.sh);
    c.save(); c.beginPath(); c.moveTo(-41, -19); c.bezierCurveTo(-41, top - 5, 35, top - 5, 35, -19); c.closePath(); c.clip();
    var mid = (top - 19) / 2 - 1, hex = function (x, y, r) { var pts = [], a; for (a = 0; a < 6; a++) pts.push([x + Math.cos(a * PI / 3) * r, y + Math.sin(a * PI / 3) * r * 0.9]); Pg(c, pts, S.sc); c.beginPath(); c.moveTo(x - r * 0.45, y - r * 0.2); c.lineTo(x - r * 0.1, y - r * 0.5); c.lineWidth = 1.1; c.strokeStyle = shade(S.sc, 0.3); c.stroke(); };
    if (v === 0 || v === 2) { hex(-3, mid, 11.5); hex(-24.5, mid + 10, 10.5); hex(18.5, mid + 10, 10.5); hex(-14, mid - 19, 10.5); hex(8, mid - 19, 10.5); hex(-3, mid + 20, 9); }
    if (v === 1) { c.lineWidth = 1.8; c.strokeStyle = S.sc; for (i = 0; i < 3; i++) for (var q = 1; q <= 3; q++) { c.beginPath(); c.arc(-3 + (i - 1) * 25, -22 + (i === 1 ? -10 : 2), q * 6.2, PI, TAU); c.stroke(); } }
    if (v === 3) { var sp = [[-22, -28, 5.5], [-6, -40, 6.5], [13, -33, 5.5], [-3, -24, 4], [22, -24, 3.6], [-31, -22, 3]]; for (i = 0; i < sp.length; i++) dot(c, sp[i][0], sp[i][1], sp[i][2], '#f4d552'); }
    c.beginPath(); c.ellipse(-16, top + 10, 12, 4, -0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.2)'; c.fill();
    c.restore();
    R(c, -44, -23, 82, 9, 4.5, S.rim); for (i = 0; i < 7; i++) L(c, -34 + i * 10.4, -21, -34 + i * 10.4, -16.6, 0.9, shade(S.rim, -0.25)); /* the shell's edge */
    if (v === 2) { /* daisies growing on the shell */
      for (i = 0; i < 2; i++) { var dx = [-14, 6][i], dy = top + [3, 0][i], sway = sw * 2.5 + Math.sin(m.t * 2 + i) * 0.8; L(c, dx, dy + 4, dx + sway, dy - 8 - i * 3, 1.4, '#3f9a5c'); K.flower(c, dx + sway, dy - 9 - i * 3, 5.6 - i, '#ffffff', p.gold, m.t * 0.5 + i); }
      K.leaf(c, -14, top + 5, 7, -2.4, '#57b36f'); K.leaf(c, 6, top + 3, 7, -0.6, '#57b36f');
    }
    leg(-28, sb, sk);
    if (m.wave) { var wh = arm(c, 20, -17, 1, 1.85 + Math.sin(m.t * 9) * 0.42, 19, 11.5, sk, sk, 6.6); for (i = -1; i <= 1; i++) dot(c, wh[0] + 4.6, wh[1] + i * 3.4, 1.1, nail); } /* a front foot, held out and waved */
    else leg(11, st, sk);
    E(c, hx, hy, hr, hr * 0.88, sk);
    c.beginPath(); c.ellipse(hx - 3, hy - hr * 0.5, hr * 0.5, hr * 0.2, -0.3, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fill();
    eyes(c, hx + 2, hy - 2, hr * 0.42, hr * 0.17, m); blush(c, hx + 2, hy + hr * 0.3, hr * 0.72, hr * 0.17);
    dot(c, hx + 0.6, hy + hr * 0.18, 0.5, shade(sk, -0.45)); dot(c, hx + 3.4, hy + hr * 0.18, 0.5, shade(sk, -0.45));
    mouth(c, hx + 2, hy + hr * 0.5, hr * 0.3, m, shade(sk, -0.55));
    if (v === 0) { /* a straw boater, tipped on the beat */
      c.save(); c.translate(hx, hy - hr * 0.78); c.rotate(-0.12 + sw * 0.06 - k * 0.1); E(c, 0, 0, 13.5, 3, '#f0d68a'); R(c, -7.5, -7.6, 15, 7.6, 2, '#f0d68a'); Rn(c, -7.5, -3.4, 15, 2.6, 0, p.accent); c.restore();
    }
    if (v === 1) { /* round spectacles, snowy eyebrows */
      for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(hx + 2 + i * hr * 0.42, hy - 2, 4.3, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fill(); c.lineWidth = 1; c.strokeStyle = p.gold; c.stroke(); L(c, hx + 2 + i * 8.4, hy - 8.6, hx + 2 + i * 3, hy - 7.6 - k, 1.5, '#ffffff'); }
      L(c, hx + 0.8, hy - 2.4, hx + 3.2, hy - 2.4, 0.9, p.gold);
    }
    if (v === 3) { /* still wearing half its eggshell */
      c.save(); c.translate(hx, hy - hr * 0.6); c.rotate(0.14 + sw * 0.05);
      c.beginPath(); c.moveTo(-11, 2); c.lineTo(-8, -1.6); c.lineTo(-5, 2); c.lineTo(-1.6, -1.6); c.lineTo(1.6, 2); c.lineTo(5, -1.6); c.lineTo(8, 2); c.lineTo(11, -1); c.quadraticCurveTo(10, -13 - k, 0, -13.4 - k); c.quadraticCurveTo(-10, -13 - k, -11, 2); c.closePath(); F(c, '#fffaf0');
      dot(c, -4, -7, 1.1, '#e9dcc4'); dot(c, 3.4, -9, 0.9, '#e9dcc4'); c.restore();
    }
    c.restore();
  }, { wide: 1.15, variants: ['tortoise in a boater', 'old tortoise in spectacles', 'tortoise with daisies', 'hatchling in its eggshell'] });
});
