/* Send a Carol art pack: borders, set B (seasons, pets, music, the sea, geometric tiles, plain lines, ribbon, neon,
   pennants; `thinline` and `softedge` are the restrained ones for sympathy cards).
   Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var edgeWalk = K.edgeWalk, rrp = K.rrp;

  /* ---------- shared ---------- */
  function lum(col) { var c = K.rgbOf(col) || [0, 0, 0]; return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function lightBg(p) { return (lum(p.bg) + lum(p.bg2)) / 2 > 0.5; }
  function onBg(p) { return lightBg(p) ? p.ink : p.paper; } /* a line colour that reads on this palette's background */
  /* draw a motif in a space where 1 = s, centred at (x, y); the caller restores */
  function unit(c, x, y, rot, s) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(s, s); }
  function diamond(c, x, y, r, col) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); c.fillStyle = col; c.fill(); }
  function corners(W, H, inset, fn) { for (var i = 0; i < 4; i++) fn(i % 2 ? W - inset : inset, i > 1 ? H - inset : inset, i % 2 ? -1 : 1, i > 1 ? -1 : 1, i); }
  /* square tiles round the edge that meet exactly in the corners: fn(x, y, side, index, isCorner) */
  function tileWalk(W, H, w, fn) {
    var idx = 0, s, i;
    corners(W, H, w / 2, function (x, y) { fn(x, y, 0, idx++, true); });
    for (s = 0; s < 4; s++) { var len = (s % 2 ? H : W) - w * 2, n = Math.max(1, Math.round(len / w)); for (i = 0; i < n; i++) { var d = w + (i + 0.5) / n * len; fn(s === 0 ? d : s === 1 ? W - w / 2 : s === 2 ? W - d : w / 2, s === 0 ? w / 2 : s === 1 ? d : s === 2 ? H - w / 2 : H - d, s, idx++, false); } }
  }
  /* run fn with the canvas turned so that x runs along one side from a corner and +y points into the card */
  function eachSide(c, W, H, fn) {
    var T = [[0, 0, 0, W], [W, 0, PI / 2, H], [W, H, PI, W], [0, H, -PI / 2, H]];
    for (var s = 0; s < 4; s++) { c.save(); c.translate(T[s][0], T[s][1]); c.rotate(T[s][2]); fn(T[s][3], s); c.restore(); }
  }

  /* ---------- shamrocks: three heart leaves each, never four ---------- */
  function heartSub(c, s) { /* one heart leaf added to the open path: its point at (0, 0), its lobes toward -y */
    var w = s / 2, y = -0.48 * s, top = y - s * 0.22;
    c.moveTo(0, 0); c.bezierCurveTo(-w * 2.1, y - s * 0.12, -w * 0.9, top - s * 0.52, 0, top); c.bezierCurveTo(w * 0.9, top - s * 0.52, w * 2.1, y - s * 0.12, 0, 0); c.closePath();
  }
  function shamrock(c, g, veins) { /* the three leaves are one path (the canvas turns between them), so a leaf costs one fill */
    var i;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(0.02, 0.3, 0.17, 0.47); c.lineWidth = 0.075; c.lineCap = 'round'; c.strokeStyle = shade(g, -0.32); c.stroke();
    c.beginPath(); for (i = 0; i < 3; i++) { c.rotate(TAU / 3); heartSub(c, 0.47); } F(c, g);
    if (veins) { c.beginPath(); for (i = 0; i < 3; i++) { c.rotate(TAU / 3); c.moveTo(0, -0.08); c.lineTo(0, -0.31); } c.lineWidth = 0.035; c.strokeStyle = shade(g, 0.34); c.stroke(); }
  }
  Art.add('border', 'shamrocks', function (c, W, H, t, p, o, b) {
    var g = mix('#2e9b4e', p.accent2, 0.3), sow = K.ow(), R0 = rnd(o.seed + 'shm'), k = Math.exp(-5 * o.beat);
    K.ow(0.045);
    edgeWalk(W, H, b * 0.5, b * 0.74, function (x, y, a, i) {
      var big = i % 2 === 0, r = R0() - 0.5, sw = Math.sin(t * 1.4 + i * 1.7) * 0.12;
      if (!big && i % 4 === 1) { dot(c, x, y, b * 0.13, shade(p.gold, -0.3)); dot(c, x, y, b * 0.1, p.gold); dot(c, x - b * 0.03, y - b * 0.03, b * 0.035, 'rgba(255,255,255,0.8)'); return; }
      unit(c, x - Math.sin(a) * r * b * 0.2, y + Math.cos(a) * r * b * 0.2, r * 1.1 + sw, b * (big ? 0.92 + ((i / 2 + o.n) % 3 === 0 ? 0.1 * k : 0) : 0.52));
      shamrock(c, big ? (i % 4 ? shade(g, -0.1) : g) : shade(g, 0.24), big); c.restore();
    });
    K.ow(sow);
  });

  /* ---------- eggs: painted eggs with little daisies between ---------- */
  function eggPath(c) { c.beginPath(); c.moveTo(0, -0.45); c.bezierCurveTo(0.2, -0.45, 0.33, -0.08, 0.33, 0.1); c.bezierCurveTo(0.33, 0.3, 0.18, 0.42, 0, 0.42); c.bezierCurveTo(-0.18, 0.42, -0.33, 0.3, -0.33, 0.1); c.bezierCurveTo(-0.33, -0.08, -0.2, -0.45, 0, -0.45); c.closePath(); }
  function egg(c, col, col2, kind, paper) {
    /* the paint stops just short of the shell's edge (no clip: a clip per egg costs too much), the outline tidies it */
    var j, X = [-0.14, 0.1, -0.19, 0.02, 0.2, -0.1, 0.13], Y = [-0.2, -0.14, 0.04, 0.1, 0.12, 0.27, 0.3];
    function band(y, f) { var q = (y - 0.1) / (y < 0.1 ? 0.55 : 0.32), hw = 0.33 * Math.sqrt(Math.max(0, 1 - q * q)) * (f || 0.97); c.moveTo(-hw, y); c.lineTo(hw, y); }
    function spots(k, r) { c.beginPath(); for (j = k; j < 7; j += 2) { c.moveTo(X[j] + r, Y[j]); c.arc(X[j], Y[j], r, 0, TAU); } }
    eggPath(c); c.fillStyle = col; c.fill(); c.lineCap = 'butt'; c.lineJoin = 'round';
    if (kind === 0) { c.beginPath(); c.moveTo(-0.29, 0.06); for (j = 0; j < 6; j++) c.lineTo(-0.29 + (j + 1) * 0.0967, j % 2 ? 0.06 : -0.08); c.lineWidth = 0.065; c.strokeStyle = col2; c.stroke(); c.beginPath(); band(0.23); band(-0.22); c.lineWidth = 0.05; c.strokeStyle = paper; c.stroke(); }
    else if (kind === 1) { spots(0, 0.06); c.fillStyle = col2; c.fill(); spots(1, 0.06); c.fillStyle = paper; c.fill(); }
    else if (kind === 2) { c.beginPath(); band(-0.2); band(0.19); c.lineWidth = 0.1; c.strokeStyle = col2; c.stroke(); c.beginPath(); band(-0.01); band(0.31, 0.8); c.lineWidth = 0.045; c.strokeStyle = paper; c.stroke(); }
    else { c.beginPath(); c.moveTo(-0.3, 0.05); for (j = 0; j < 4; j++) c.quadraticCurveTo(-0.225 + j * 0.15, j % 2 ? 0.17 : -0.07, -0.15 + j * 0.15, 0.05); c.lineWidth = 0.06; c.strokeStyle = paper; c.stroke(); c.beginPath(); for (j = -1; j <= 1; j++) { c.moveTo(j * 0.13 + 0.045, -0.2); c.arc(j * 0.13, -0.2, 0.045, 0, TAU); c.moveTo(j * 0.15 + 0.045, 0.27); c.arc(j * 0.15, 0.27, 0.045, 0, TAU); } c.fillStyle = col2; c.fill(); }
    eggPath(c); c.lineWidth = 0.045; c.strokeStyle = shade(col, -0.36); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.65)'; c.beginPath(); c.ellipse(-0.14, -0.2, 0.045, 0.1, 0.45, 0, TAU); c.fill();
  }
  Art.add('border', 'eggs', function (c, W, H, t, p, o, b) {
    var cols = [mix('#ff9ec4', p.accent, 0.35), mix('#ffe07a', p.gold, 0.35), mix('#8fdcc0', p.accent2, 0.35), mix('#b9a6f2', p.accent, 0.15), mix('#8fd0ff', p.accent2, 0.15)], gr = mix('#58b368', p.accent2, 0.35), k = Math.exp(-5 * o.beat), r = b * 0.17, fl = [], q, m, n;
    /* the daisies first, on two blades of grass each; every part of a kind is one path (there are over a hundred) */
    c.beginPath();
    edgeWalk(W, H, b * 0.5, b * 0.65, function (x, y, a, i) {
      if (!(i % 2)) return;
      var sw = Math.sin(t * 1.3 + i) * b * 0.05;
      c.moveTo(x, y + b * 0.42); c.quadraticCurveTo(x - b * 0.04, y + b * 0.2, x - b * 0.2 + sw, y + b * 0.12); c.moveTo(x, y + b * 0.42); c.quadraticCurveTo(x + b * 0.04, y + b * 0.2, x + b * 0.2 + sw, y + b * 0.1);
      fl.push(x, y - b * 0.04, t * 0.4 + i, (i >> 1) % 2);
    });
    c.lineWidth = b * 0.07; c.lineCap = 'round'; c.strokeStyle = gr; c.stroke();
    for (q = 0; q < 2; q++) {
      c.beginPath();
      for (m = 0; m < fl.length; m += 4) if (fl[m + 3] === q) for (n = 0; n < 5; n++) { var an = fl[m + 2] + n / 5 * TAU, px = fl[m] + Math.cos(an) * r * 0.62, py = fl[m + 1] + Math.sin(an) * r * 0.62; c.moveTo(px + r * 0.52, py); c.arc(px, py, r * 0.52, 0, TAU); }
      c.fillStyle = q ? p.paper : shade(p.accent, 0.55); c.fill(); c.lineWidth = b * 0.025; c.strokeStyle = alpha(shade(p.accent, -0.3), 0.35); c.stroke();
    }
    c.beginPath(); for (m = 0; m < fl.length; m += 4) { c.moveTo(fl[m] + r * 0.42, fl[m + 1]); c.arc(fl[m], fl[m + 1], r * 0.42, 0, TAU); } c.fillStyle = p.gold; c.fill();
    edgeWalk(W, H, b * 0.5, b * 0.65, function (x, y, a, i) {
      var j = i >> 1;
      if (i % 2) return;
      unit(c, x, y, Math.sin(t * 1.6 + j * 2.1) * 0.13 + ((j * 7) % 5 - 2) * 0.05, b * (0.98 + ((j + o.n) % 4 === 0 ? 0.08 * k : 0)));
      egg(c, cols[j % 5], cols[(j + 2) % 5], j % 4, p.paper); c.restore();
    });
  });

  /* ---------- pumpkinvine: a curling vine with pumpkins, leaves and tendrils ---------- */
  function pumpkin(c, col, gr) {
    c.beginPath(); c.moveTo(-0.05, -0.2); c.quadraticCurveTo(-0.04, -0.38, 0.08, -0.43); c.lineTo(0.14, -0.35); c.quadraticCurveTo(0.06, -0.32, 0.06, -0.2); c.closePath(); F(c, shade(gr, -0.3));
    E(c, -0.22, 0.06, 0.2, 0.27, shade(col, -0.14)); E(c, 0.22, 0.06, 0.2, 0.27, shade(col, -0.14)); E(c, 0, 0.07, 0.2, 0.3, col);
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(-0.08, -0.06, 0.035, 0.1, 0.3, 0, TAU); c.fill();
  }
  Art.add('border', 'pumpkinvine', function (c, W, H, t, p, o, b) {
    var gr = mix('#4c8f3a', p.accent2, 0.35), or = mix('#f08a24', p.gold, 0.12), pts = [], sow = K.ow(), k = Math.exp(-5 * o.beat), i;
    var raw = [], N, A, B, C;
    edgeWalk(W, H, b * 0.5, b * 0.62, function (x, y, a, i) { var off = Math.sin(i * 1.3) * b * 0.2; raw.push([x - Math.sin(a) * off, y + Math.cos(a) * off, a]); });
    N = raw.length; c.beginPath(); /* the vine bends smoothly through the walk's points; pts are the places ON the curve where things grow */
    for (i = 0; i < N; i++) { A = raw[(i + N - 1) % N]; B = raw[i]; C = raw[(i + 1) % N]; if (!i) c.moveTo((A[0] + B[0]) / 2, (A[1] + B[1]) / 2); c.quadraticCurveTo(B[0], B[1], (B[0] + C[0]) / 2, (B[1] + C[1]) / 2); pts.push([A[0] * 0.125 + B[0] * 0.75 + C[0] * 0.125, A[1] * 0.125 + B[1] * 0.75 + C[1] * 0.125, B[2]]); }
    c.closePath();
    c.lineJoin = 'round'; c.lineWidth = b * 0.13; c.strokeStyle = shade(gr, -0.3); c.stroke(); c.lineWidth = b * 0.07; c.strokeStyle = shade(gr, 0.12); c.stroke();
    for (i = 0; i < pts.length; i++) { /* leaves and tendrils under the pumpkins */
      var q = pts[i], m = i % 4, sw = Math.sin(t * 1.2 + i) * 0.1;
      if (m === 1 || m === 3) { K.leaf(c, q[0], q[1], b * 0.6, q[2] + (m === 1 ? -0.9 : 0.9) + sw, m === 1 ? gr : shade(gr, 0.2)); }
      else if (m === 2) { c.beginPath(); c.arc(q[0] - Math.sin(q[2]) * b * 0.2, q[1] + Math.cos(q[2]) * b * 0.2, b * 0.13, q[2] + sw * 2, q[2] + PI * 1.5 + sw * 2); c.lineWidth = b * 0.045; c.strokeStyle = shade(gr, 0.1); c.stroke(); }
    }
    K.ow(0.045);
    for (i = 0; i < pts.length; i += 4) { q = pts[i]; var n = i >> 2; unit(c, q[0], q[1], Math.sin(t * 1.1 + n * 1.9) * 0.08 + (n % 3 - 1) * 0.12, b * (n % 3 === 1 ? 0.78 : 0.98) * (1 + ((n + o.n) % 3 === 0 ? 0.07 * k : 0))); pumpkin(c, n % 3 === 2 ? shade(or, 0.2) : n % 3 === 1 ? mix(or, p.accent, 0.25) : or, gr); c.restore(); }
    K.ow(sow);
  });

  /* ---------- autumnleaves: maple, oak and beech leaves tumbling round the edge, an acorn now and then ---------- */
  var MAPLE = [[0, -0.5], [0.09, -0.3], [0.27, -0.38], [0.23, -0.16], [0.48, -0.12], [0.33, 0.02], [0.4, 0.2], [0.14, 0.14], [0.04, 0.26], [-0.04, 0.26], [-0.14, 0.14], [-0.4, 0.2], [-0.33, 0.02], [-0.48, -0.12], [-0.23, -0.16], [-0.27, -0.38], [-0.09, -0.3]];
  function autumnLeaf(c, kind, col) {
    var j, v = shade(col, -0.3);
    c.lineCap = 'round';
    if (kind === 0) { Pg(c, MAPLE, col); c.beginPath(); c.moveTo(0.02, 0.5); c.lineTo(0, -0.36); c.moveTo(0, 0.12); c.lineTo(0.3, -0.08); c.moveTo(0, 0.12); c.lineTo(-0.3, -0.08); c.moveTo(0, 0.02); c.lineTo(0.17, -0.26); c.moveTo(0, 0.02); c.lineTo(-0.17, -0.26); }
    else if (kind === 1) { /* oak: round lobes */
      c.beginPath(); c.moveTo(0.08, 0.36); for (j = 0; j < 4; j++) c.quadraticCurveTo(0.36 - j * 0.045, 0.25 - j * 0.21, 0.08, 0.15 - j * 0.21); c.quadraticCurveTo(0, -0.58, -0.08, -0.48); for (j = 3; j >= 0; j--) c.quadraticCurveTo(-(0.36 - j * 0.045), 0.25 - j * 0.21, -0.08, 0.36 - j * 0.21); c.closePath(); F(c, col);
      c.beginPath(); c.moveTo(0.02, 0.52); c.lineTo(0, -0.38);
    } else { /* beech: a plain pointed leaf with side veins */
      c.beginPath(); c.moveTo(0, -0.5); c.quadraticCurveTo(0.38, -0.08, 0, 0.36); c.quadraticCurveTo(-0.38, -0.08, 0, -0.5); c.closePath(); F(c, col);
      c.beginPath(); c.moveTo(0.02, 0.5); c.lineTo(0, -0.4); for (j = 0; j < 3; j++) { c.moveTo(0, 0.16 - j * 0.17); c.lineTo(0.15 - j * 0.02, 0.02 - j * 0.17); c.moveTo(0, 0.16 - j * 0.17); c.lineTo(-0.15 + j * 0.02, 0.02 - j * 0.17); }
    }
    c.lineWidth = 0.035; c.strokeStyle = v; c.stroke(); /* the stalk and the veins in one stroke */
  }
  Art.add('border', 'autumnleaves', function (c, W, H, t, p, o, b) {
    var cols = [mix('#d9572b', p.accent, 0.25), mix('#eb9a2c', p.gold, 0.25), mix('#b2382a', p.accent, 0.25), mix('#d8b02a', p.gold, 0.3), '#96552c', mix('#e2742a', p.gold, 0.15)], R0 = rnd(o.seed + 'aut'), sow = K.ow();
    K.ow(0.04);
    edgeWalk(W, H, b * 0.5, b * 0.68, function (x, y, a, i) {
      var r1 = R0(), r2 = R0(), r3 = R0(), off = (r1 - 0.5) * b * 0.24, rock = Math.sin(t * (0.9 + r2 * 0.8) + i * 1.3) * 0.22;
      if (i % 7 === 4) { /* an acorn */
        unit(c, x - Math.sin(a) * off, y + Math.cos(a) * off, r2 * TAU + rock * 0.5, b * 0.62);
        E(c, 0, 0.12, 0.2, 0.27, '#c99a55'); c.beginPath(); c.moveTo(-0.25, -0.02); c.quadraticCurveTo(-0.25, -0.3, 0, -0.3); c.quadraticCurveTo(0.25, -0.3, 0.25, -0.02); c.closePath(); F(c, '#7a4a28'); L(c, 0, -0.3, 0.04, -0.42, 0.06, '#5a351c'); dot(c, -0.07, 0.08, 0.04, 'rgba(255,255,255,0.5)'); c.restore(); return;
      }
      unit(c, x - Math.sin(a) * off, y + Math.cos(a) * off, r2 * TAU + rock, b * (0.76 + r3 * 0.3));
      autumnLeaf(c, i % 3, cols[(i * 5 + (r1 * 3 | 0)) % 6]); c.restore();
    });
    K.ow(sow);
  });

  /* ---------- snowflakes: six-armed flakes, big and small, turning slowly (winter, not Christmas) ---------- */
  function flakePath(c, r, rich) {
    var i, j, s;
    c.beginPath();
    for (i = 0; i < 6; i++) {
      var a = i * PI / 3, ca = Math.cos(a), sa = Math.sin(a);
      c.moveTo(0, 0); c.lineTo(ca * r, sa * r);
      for (j = 0; j < (rich ? 2 : 1); j++) { var d = r * (rich ? 0.4 + j * 0.3 : 0.58), l = r * (rich ? 0.36 - j * 0.14 : 0.3); for (s = -1; s <= 1; s += 2) { c.moveTo(ca * d, sa * d); c.lineTo(ca * d + Math.cos(a + s * PI / 3) * l, sa * d + Math.sin(a + s * PI / 3) * l); } }
    }
  }
  Art.add('border', 'snowflakes', function (c, W, H, t, p, o, b) {
    var light = lightBg(p), under = alpha(mix(p.bg, p.ink, 0.7), 0.55), ice = mix(p.snow, '#cfe6ff', 0.3), k = Math.exp(-5 * o.beat), R0 = rnd(o.seed + 'snf');
    c.lineCap = 'round'; c.lineJoin = 'round';
    edgeWalk(W, H, b * 0.5, b * 0.74, function (x, y, a, i) {
      var r1 = R0(), r2 = R0(), big = i % 2 === 0, off = (r1 - 0.5) * b * (big ? 0.06 : 0.5), px = x - Math.sin(a) * off, py = y + Math.cos(a) * off;
      if (!big && i % 4 === 3) { if (light) dot(c, px, py, b * 0.11, under); dot(c, px, py, b * 0.08, ice); return; }
      var lit = big && (i / 2 + o.n) % 3 === 0, r = big ? 0.47 + (lit ? 0.04 * k : 0) : 0.25;
      unit(c, px, py, t * (big ? 0.25 : -0.4) * (r2 > 0.5 ? 1 : -1) + r2 * 2, b);
      flakePath(c, r, big); if (light) { c.lineWidth = big ? 0.1 : 0.09; c.strokeStyle = under; c.stroke(); } /* on a pale card the flakes get a quiet outline, or they vanish */
      c.lineWidth = big ? 0.052 : 0.046; c.strokeStyle = big ? (lit ? mix(p.snow, p.gold, 0.2 * k) : p.snow) : ice; c.stroke();
      c.restore();
    });
  });

  /* ---------- pawprints: a trail of paws walking round the card, one fresh step on each beat ---------- */
  var TOES = [[-0.33, -0.12, -0.4], [-0.12, -0.33, -0.1], [0.12, -0.33, 0.1], [0.33, -0.12, 0.4]];
  function pawPath(c) { /* the kit's paw, pad and toes as one path: one fill for a paw, there are many */
    c.beginPath(); c.moveTo(0, -0.06); c.bezierCurveTo(0.3, -0.12, 0.44, 0.2, 0.26, 0.36); c.quadraticCurveTo(0, 0.3, -0.26, 0.36); c.bezierCurveTo(-0.44, 0.2, -0.3, -0.12, 0, -0.06); c.closePath();
    for (var i = 0; i < 4; i++) { var q = TOES[i]; c.moveTo(q[0] + Math.cos(q[2]) * 0.1, q[1] + Math.sin(q[2]) * 0.1); c.ellipse(q[0], q[1], 0.1, 0.135, q[2], 0, TAU); }
  }
  Art.add('border', 'pawprints', function (c, W, H, t, p, o, b) {
    var sow = K.ow(), k = Math.exp(-5 * o.beat), col = p.accent, col2 = mix(p.accent, p.paper, 0.35);
    edgeWalk(W, H, b * 0.5, b * 0.84, function (x, y, a, i) {
      var side = i % 2 ? 1 : -1, px = x - Math.sin(a) * side * b * 0.17, py = y + Math.cos(a) * side * b * 0.17, lit = ((i - o.n) % 9 + 9) % 9 === 0;
      if (i % 11 === 5) { K.ow(b * 0.035); c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.3 + i) * 0.2); K.heartPath(c, 0, 0, b * 0.42); F(c, p.gold); c.restore(); return; }
      K.ow(0.05); unit(c, px, py, a + PI / 2 + side * 0.2, b * (lit ? 0.72 + 0.14 * k : 0.68)); pawPath(c); F(c, lit ? mix(col, p.gold, 0.55 * k + 0.2) : i % 4 < 2 ? col : col2); c.restore();
    });
    K.ow(sow);
  });

  /* ---------- musicnotes: notes hopping along a three-line staff ---------- */
  function note(c, kind, col, g) { /* g grows every part a little: drawn first in a dark colour it is the outline */
    var lw = 0.06 + g * 2;
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    if (kind === 2) {
      c.beginPath(); c.ellipse(-0.24, 0.27, 0.14 + g, 0.105 + g, -0.35, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0.18, 0.2, 0.14 + g, 0.105 + g, -0.35, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-0.115, 0.24); c.lineTo(-0.115, -0.26); c.moveTo(0.305, 0.17); c.lineTo(0.305, -0.33); c.stroke();
      c.beginPath(); c.moveTo(-0.115, -0.24); c.lineTo(0.305, -0.31); c.lineWidth = 0.13 + g * 2; c.stroke();
    } else {
      c.beginPath(); c.ellipse(-0.07, 0.25, 0.15 + g, 0.11 + g, -0.35, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(0.065, 0.21); c.lineTo(0.065, -0.34); c.stroke();
      if (kind === 1) { c.beginPath(); c.moveTo(0.065, -0.34); c.quadraticCurveTo(0.1, -0.16, 0.27, -0.1); c.quadraticCurveTo(0.33, -0.02, 0.26, 0.08); c.lineWidth = 0.075 + g * 2; c.stroke(); }
    }
  }
  Art.add('border', 'musicnotes', function (c, W, H, t, p, o, b) {
    var cols = [p.accent, p.gold, p.accent2, p.paper], line = alpha(onBg(p), lightBg(p) ? 0.3 : 0.4), k = Math.exp(-5 * o.beat), i;
    c.lineWidth = Math.max(1, b * 0.03); c.strokeStyle = line; for (i = 0; i < 3; i++) { var d = b * (0.28 + i * 0.22); c.strokeRect(d, d, W - d * 2, H - d * 2); }
    edgeWalk(W, H, b * 0.5, b * 0.98, function (x, y, a, i) {
      var hop = ((i + o.n) % 2 === 0 ? k : 0) * b * 0.1, up = (i * 5 % 3 - 1) * b * 0.07, col = cols[i % 4];
      unit(c, x, y + up - hop, Math.sin(t * 1.5 + i * 1.3) * 0.14, b * 0.94);
      note(c, i % 3, shade(col, -0.5), 0.028); note(c, i % 3, col, 0);
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(i % 3 === 2 ? -0.27 : -0.1, i % 3 === 2 ? 0.24 : 0.22, 0.045, 0.028, -0.35, 0, TAU); c.fill();
      c.restore();
    });
  });

  /* ---------- waves: two rows of curling surf rolling the same way round the card ---------- */
  function surf(c, len, base, amp, lam, off, b, fill, foam) {
    var x, x0 = -lam * 2 + off;
    function edge() { c.moveTo(x0, base); for (x = x0; x < len + lam; x += lam) { c.quadraticCurveTo(x + lam * 0.42, base + amp * 0.05, x + lam * 0.62, base + amp); c.quadraticCurveTo(x + lam * 0.86, base + amp * 1.02, x + lam * 0.8, base + amp * 0.5); c.quadraticCurveTo(x + lam * 0.7, base + amp * 0.2, x + lam, base); } }
    c.beginPath(); edge(); c.lineTo(x, -b); c.lineTo(x0, -b); c.closePath(); c.fillStyle = fill; c.fill();
    if (foam) { c.beginPath(); edge(); c.lineWidth = b * 0.07; c.lineJoin = 'round'; c.strokeStyle = foam; c.stroke(); }
  }
  Art.add('border', 'waves', function (c, W, H, t, p, o, b) {
    var sea = mix('#2487cf', p.accent2, 0.3), deep = shade(sea, lightBg(p) ? -0.12 : 0.02), pale = mix(shade(sea, 0.42), p.snow, 0.15), lam = b * 1.5, k = Math.exp(-5 * o.beat);
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip(); /* the water is drawn past the corners: keep it on the card */
    eachSide(c, W, H, function (len) {
      var l2 = len / Math.max(1, Math.round(len / lam)); /* whole waves on every side, so the roll loops */
      surf(c, len, b * 0.5, b * 0.42, l2, frac(-t * 0.1) * l2 + l2 * 0.5, b, pale, null);
      surf(c, len, b * 0.2, b * 0.44 + b * 0.04 * k, l2, frac(t * 0.14) * l2, b, deep, p.snow);
    });
    eachSide(c, W, H, function (len, s) { /* glints on the water, spray off the crests */
      var n = Math.max(1, Math.round(len / lam)), l2 = len / n, off = frac(t * 0.14) * l2, i;
      for (i = -1; i <= n; i++) { var x = i * l2 + off; L(c, x + l2 * 0.12, b * 0.1, x + l2 * 0.34, b * 0.1, b * 0.04, alpha(p.snow, 0.5)); dot(c, x + l2 * 0.9, b * (0.72 + 0.06 * Math.sin(t * 2 + i + s)), b * 0.05, alpha(p.snow, 0.9)); dot(c, x + l2 * 0.99, b * (0.58 + 0.05 * Math.cos(t * 2.3 + i)), b * 0.035, alpha(p.snow, 0.8)); }
    });
    c.restore();
  });

  /* ---------- startile: a band of geometric tiles, an eight-point star in each ---------- */
  var S8 = [[], []]; /* the eight-point star two squares make (inner radius 0.7654), upright and turned an eighth */
  (function () { for (var i = 0; i < 16; i++) { var a = -PI / 2 + i * PI / 8, cs = Math.cos(a), sn = Math.sin(a); S8[0].push(cs * (i % 2 ? 0.7654 : 1), sn * (i % 2 ? 0.7654 : 1)); S8[1].push(cs * (i % 2 ? 1 : 0.7654), sn * (i % 2 ? 1 : 0.7654)); } })();
  Art.add('border', 'startile', function (c, W, H, t, p, o, b) {
    var w = b * 0.9, base = mix(shade(p.accent2, -0.45), p.ink, 0.2), k = Math.exp(-5 * o.beat), T = [], r = w * 0.43;
    /* shape 0 a diamond, 1 a star, 2 a star turned; all the tiles of one colour are one path and one fill */
    function set(col, rr, shape, corner, lit) {
      var j, i, x, y, P;
      c.beginPath();
      for (j = 0; j < T.length; j += 4) {
        if (corner !== -1 && T[j + 2] !== corner) continue; if (lit !== -1 && T[j + 3] !== lit) continue;
        x = T[j]; y = T[j + 1];
        if (!shape) { c.moveTo(x, y - rr); c.lineTo(x + rr, y); c.lineTo(x, y + rr); c.lineTo(x - rr, y); }
        else { P = S8[shape - 1]; c.moveTo(x + P[0] * rr, y + P[1] * rr); for (i = 2; i < 32; i += 2) c.lineTo(x + P[i] * rr, y + P[i + 1] * rr); }
        c.closePath();
      }
      c.fillStyle = col; c.fill();
    }
    c.save(); K.ringClip(c, W, H, w); c.fillStyle = base; c.fillRect(0, 0, W, H); c.restore();
    tileWalk(W, H, w, function (x, y, s, i, corner) { T.push(x, y, corner ? 1 : 0, (i + o.n) % 4 === 0 ? 1 : 0); });
    set(shade(p.accent2, 0.1), w * 0.5, 0, 0, -1); set(p.gold, w * 0.5, 0, 1, -1);
    set(p.paper, r, 2, -1, -1);
    set(p.accent, r * 0.62, 1, 0, -1); set(p.accent2, r * 0.62, 1, 1, -1);
    set(p.gold, r * 0.3, 2, -1, 0); set(mix(p.gold, '#ffffff', 0.5 * k), r * 0.3, 2, -1, 1);
    c.lineWidth = Math.max(1, b * 0.055); c.strokeStyle = p.gold; c.strokeRect(w, w, W - w * 2, H - w * 2); c.strokeRect(b * 0.03, b * 0.03, W - b * 0.06, H - b * 0.06);
    c.lineWidth = Math.max(1, b * 0.025); c.strokeStyle = alpha(shade(base, -0.4), 0.5); c.strokeRect(w + b * 0.05, w + b * 0.05, W - w * 2 - b * 0.1, H - w * 2 - b * 0.1);
  });

  /* ---------- tricolorband: three plain bands, accent outside, ink, accent2 inside ---------- */
  Art.add('border', 'tricolorband', function (c, W, H, t, p, o, b) {
    var cols = [p.accent, p.ink, p.accent2], bw = b * 0.27, m = b * 0.07, i, d;
    c.lineJoin = 'miter';
    for (i = 0; i < 3; i++) { d = m + bw * (i + 0.5); c.lineWidth = bw + 0.6; c.strokeStyle = cols[i]; c.strokeRect(d, d, W - d * 2, H - d * 2); c.lineWidth = bw * 0.14; c.strokeStyle = shade(cols[i], lum(cols[i]) < 0.2 ? 0.22 : 0.26); d = m + bw * (i + 0.24); c.strokeRect(d, d, W - d * 2, H - d * 2); }
    c.lineWidth = Math.max(1, b * 0.035); c.strokeStyle = alpha(p.paper, 0.75); d = m; c.strokeRect(d, d, W - d * 2, H - d * 2); d = m + bw * 3; c.strokeRect(d, d, W - d * 2, H - d * 2);
  });

  /* ---------- thinline (restrained): one quiet line ---------- */
  Art.add('border', 'thinline', function (c, W, H, t, p, o, b) {
    var d = b * 0.52;
    rrp(c, d, d, W - d * 2, H - d * 2, b * 0.3); c.lineWidth = Math.max(1.2, b * 0.05); c.strokeStyle = alpha(onBg(p), (lightBg(p) ? 0.5 : 0.62) + 0.05 * Math.sin(t * 0.6)); c.stroke();
  });

  /* ---------- softedge (restrained): the edge of the card fades softly, nothing else ---------- */
  Art.add('border', 'softedge', function (c, W, H, t, p, o, b) {
    var light = lightBg(p), col = light ? p.paper : shade(p.bg, -0.7), a = (light ? 0.5 : 0.52) * (0.94 + 0.06 * Math.sin(t * 0.5)), s, g;
    /* four plain strips; they lie over each other in the corners, so the corners fade a little deeper and no seam shows */
    var G = [[0, 0, 0, b, 0, 0, W, b], [W, 0, W - b, 0, W - b, 0, b, H], [0, H, 0, H - b, 0, H - b, W, b], [0, 0, b, 0, 0, 0, b, H]];
    for (s = 0; s < 4; s++) { g = c.createLinearGradient(G[s][0], G[s][1], G[s][2], G[s][3]); g.addColorStop(0, alpha(col, a)); g.addColorStop(0.45, alpha(col, a * 0.38)); g.addColorStop(1, alpha(col, 0)); c.fillStyle = g; c.fillRect(G[s][4], G[s][5], G[s][6], G[s][7]); }
  });

  /* ---------- doubleline: a strong line and a fine one, tied with a small square at each corner ---------- */
  Art.add('border', 'doubleline', function (c, W, H, t, p, o, b) {
    var d1 = b * 0.26, d2 = b * 0.62, fine = alpha(onBg(p), 0.8), k = Math.exp(-5 * o.beat), s = b * 0.5;
    c.lineJoin = 'miter';
    c.lineWidth = b * 0.2; c.strokeStyle = shade(p.accent, -0.34); c.strokeRect(d1, d1, W - d1 * 2, H - d1 * 2); c.lineWidth = b * 0.13; c.strokeStyle = p.accent; c.strokeRect(d1, d1, W - d1 * 2, H - d1 * 2);
    c.lineWidth = Math.max(1, b * 0.045); c.strokeStyle = fine; c.strokeRect(d2, d2, W - d2 * 2, H - d2 * 2);
    corners(W, H, b * 0.44, function (x, y, sx, sy, i) {
      c.fillStyle = shade(p.accent, -0.34); c.fillRect(x - s / 2 - b * 0.035, y - s / 2 - b * 0.035, s + b * 0.07, s + b * 0.07); c.fillStyle = p.accent; c.fillRect(x - s / 2, y - s / 2, s, s);
      c.fillStyle = p.paper; c.fillRect(x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.6); diamond(c, x, y, s * (0.2 + ((i + o.n) % 4 === 0 ? 0.05 * k : 0)), p.gold);
    });
    edgeWalk(W, H, d2, Math.max(W, H), function (x, y) { diamond(c, x, y, b * 0.15, shade(p.accent, -0.34)); diamond(c, x, y, b * 0.11, p.accent); }); /* a small stud at the middle of each side */
  });

  /* ---------- cornerbrackets: four gold corners, the sides left open ---------- */
  Art.add('border', 'cornerbrackets', function (c, W, H, t, p, o, b) {
    var A = Math.min(W, H) * 0.21, d = b * 0.3, d2 = b * 0.7, k = Math.exp(-5 * o.beat), dk = shade(p.gold, -0.4);
    corners(W, H, 0, function (x0, y0, sx, sy, i) {
      var x = x0 + sx * d, y = y0 + sy * d, x2 = x0 + sx * d2, y2 = y0 + sy * d2, j;
      c.lineJoin = 'round'; c.lineCap = 'round';
      for (j = 0; j < 2; j++) { c.beginPath(); c.moveTo(x + sx * A, y); c.lineTo(x, y); c.lineTo(x, y + sy * A); c.lineWidth = b * (j ? 0.16 : 0.24); c.strokeStyle = j ? p.gold : dk; c.stroke(); }
      c.beginPath(); c.moveTo(x + sx * A * 0.97, y - sy * b * 0.035); c.lineTo(x + sx * b * 0.1, y - sy * b * 0.035); c.lineWidth = b * 0.04; c.strokeStyle = shade(p.gold, 0.5); c.stroke();
      c.beginPath(); c.moveTo(x2 + sx * A * 0.62, y2); c.lineTo(x2, y2); c.lineTo(x2, y2 + sy * A * 0.62); c.lineWidth = Math.max(1, b * 0.05); c.strokeStyle = p.accent; c.stroke();
      for (j = 0; j < 2; j++) { var ex = j ? x : x + sx * A, ey = j ? y + sy * A : y; dot(c, ex, ey, b * 0.2, dk); dot(c, ex, ey, b * 0.15, p.accent); dot(c, ex - b * 0.04, ey - b * 0.04, b * 0.045, 'rgba(255,255,255,0.75)'); dot(c, j ? x2 : x2 + sx * A * 0.62, j ? y2 + sy * A * 0.62 : y2, b * 0.07, p.accent); }
      diamond(c, x + sx * b * 0.14, y + sy * b * 0.14, b * 0.4, dk); diamond(c, x + sx * b * 0.14, y + sy * b * 0.14, b * 0.33, p.accent);
      K.twinkle(c, x + sx * b * 0.14, y + sy * b * 0.14, b * (0.2 + 0.1 * ((i + o.n) % 2 ? k : 0.3 + 0.3 * Math.sin(t * 2 + i))), '#fffbe0');
    });
  });

  /* ---------- dashes: fat dashes in four colours marching round ---------- */
  Art.add('border', 'dashes', function (c, W, H, t, p, o, b) {
    var cols = [p.accent, p.gold, p.accent2, p.paper], d = b * 0.5, r = b * 0.7, per = 2 * (W + H - d * 4) - 8 * r + TAU * r, n = Math.max(4, 4 * Math.round(per / (b * 1.02 * 4))), q = per / n, j, pass, march = t * b * 0.3;
    rrp(c, d, d, W - d * 2, H - d * 2, r); c.lineCap = 'round';
    for (pass = 0; pass < 2; pass++) for (j = 0; j < 4; j++) { c.setLineDash([q * 0.42, q * 3.58]); c.lineDashOffset = -j * q - march; c.lineWidth = b * (pass ? 0.24 : 0.32); c.strokeStyle = pass ? cols[j] : shade(cols[j], -0.36); c.stroke(); }
    for (j = 0; j < 4; j++) { c.setLineDash([q * 0.2, q * 3.8]); c.lineDashOffset = -j * q - march - q * 0.06; c.lineWidth = b * 0.05; c.strokeStyle = 'rgba(255,255,255,0.45)'; c.save(); c.translate(-b * 0.03, -b * 0.05); c.stroke(); c.restore(); }
    c.setLineDash([]); c.lineDashOffset = 0;
  });

  /* ---------- ribbonwrap: a satin ribbon round the card, folded at the corners, tied in a bow at the top ---------- */
  Art.add('border', 'ribbonwrap', function (c, W, H, t, p, o, b) {
    var col = p.accent, d = b * 0.42, w = b * 0.6, k = Math.exp(-5 * o.beat), sow = K.ow(), i, e;
    c.lineJoin = 'miter';
    c.lineWidth = w + b * 0.07; c.strokeStyle = shade(col, -0.36); c.strokeRect(d, d, W - d * 2, H - d * 2);
    c.lineWidth = w; c.strokeStyle = col; c.strokeRect(d, d, W - d * 2, H - d * 2);
    e = d - w * 0.2; c.lineWidth = w * 0.22; c.strokeStyle = shade(col, 0.22); c.strokeRect(e, e, W - e * 2, H - e * 2); /* the satin shine */
    e = d + w * 0.3; c.lineWidth = w * 0.16; c.strokeStyle = shade(col, -0.14); c.strokeRect(e, e, W - e * 2, H - e * 2);
    c.lineWidth = Math.max(1, b * 0.035); c.strokeStyle = p.gold; for (i = -1; i <= 1; i += 2) { e = d + i * w * 0.4; c.strokeRect(e, e, W - e * 2, H - e * 2); }
    corners(W, H, 0, function (x, y, sx, sy) { L(c, x + sx * (d - w / 2), y + sy * (d - w / 2), x + sx * (d + w / 2), y + sy * (d + w / 2), b * 0.05, shade(col, -0.36)); });
    K.ow(b * 0.04); c.save(); c.translate(W / 2, b * 0.46); c.rotate(Math.sin(t * 1.2) * 0.03); K.bow(c, 0, 0, b * (1.02 + 0.05 * k), shade(col, 0.1)); c.restore(); K.ow(sow);
    K.twinkle(c, W / 2 + b * 0.3, b * 0.3, b * (0.12 + 0.1 * k), '#fffbe0');
  });

  /* ---------- neontube: a glowing tube round the card and a second colour in the corners ---------- */
  Art.add('border', 'neontube', function (c, W, H, t, p, o, b) {
    var k = Math.exp(-5 * o.beat), fl = 0.8 + 0.2 * k, d = b * 0.4, r = b * 0.9, col = p.accent, col2 = p.accent2, d2 = b * 0.76, A = b * 2.6, light = lightBg(p);
    c.lineCap = 'round'; c.lineJoin = 'round';
    rrp(c, d, d, W - d * 2, H - d * 2, r);
    c.lineWidth = b * 0.76; c.strokeStyle = alpha(col, 0.13 * fl); c.stroke(); c.lineWidth = b * 0.5; c.strokeStyle = alpha(col, 0.2 * fl); c.stroke();
    c.lineWidth = b * 0.27; c.strokeStyle = alpha(shade(col, -0.55), light ? 0.55 : 0.3); c.stroke();
    c.lineWidth = b * 0.19; c.strokeStyle = shade(col, 0.08 + 0.12 * k); c.stroke(); c.lineWidth = b * 0.065; c.strokeStyle = alpha('#ffffff', 0.8); c.stroke();
    edgeWalk(W, H, d, b * 6.5, function (x, y, a) { L(c, x - Math.sin(a) * b * 0.18, y + Math.cos(a) * b * 0.18, x + Math.sin(a) * b * 0.18, y - Math.cos(a) * b * 0.18, b * 0.11, '#2a2733'); }); /* the clips that hold the tube */
    c.lineCap = 'round';
    corners(W, H, d2, function (x, y, sx, sy, i) {
      var on = 0.75 + 0.25 * ((i + o.n) % 2 ? k : 1 - k * 0.5);
      c.beginPath(); c.moveTo(x + sx * A, y); c.lineTo(x + sx * b * 0.4, y); c.quadraticCurveTo(x, y, x, y + sy * b * 0.4); c.lineTo(x, y + sy * A);
      c.lineWidth = b * 0.4; c.strokeStyle = alpha(col2, 0.2 * on); c.stroke(); c.lineWidth = b * 0.17; c.strokeStyle = alpha(shade(col2, -0.55), light ? 0.5 : 0.3); c.stroke();
      c.lineWidth = b * 0.11; c.strokeStyle = shade(col2, 0.25 * on - 0.1); c.stroke(); c.lineWidth = b * 0.035; c.strokeStyle = alpha('#ffffff', 0.75 * on); c.stroke();
    });
  });

  /* ---------- pennants: flags strung round all four sides, pointing in ---------- */
  Art.add('border', 'pennants', function (c, W, H, t, p, o, b) {
    var cols = [p.accent, p.gold, p.accent2, p.paper, shade(p.accent, 0.4)], d = b * 0.13, sow = K.ow(), i = 0, k = Math.exp(-5 * o.beat), dk = shade(p.gold, -0.4);
    c.lineWidth = Math.max(1, b * 0.055); c.strokeStyle = lightBg(p) ? '#7a6a5a' : '#b7a999'; c.strokeRect(d, d, W - d * 2, H - d * 2);
    K.ow(0.045);
    eachSide(c, W, H, function (len) { /* each side's flags stop short of the corners, so no two flags lie over each other there */
      var n = Math.max(1, Math.round((len - b * 1.9) / (b * 0.98))), st = (len - b * 1.9) / n, j;
      for (j = 0; j < n; j++, i++) {
        var col = cols[i % 5], sw = Math.sin(t * 2 + i * 1.1) * 0.07, m = i % 3, mark = col === p.paper ? p.accent : p.paper;
        unit(c, b * 0.95 + (j + 0.5) * st, d, 0, b);
        if (m === 2) { Pg(c, [[-0.36, 0], [0.36, 0], [0.36 + sw, 0.74], [sw, 0.52], [-0.36 + sw, 0.74]], col); Rn(c, -0.36, 0.14, 0.72, 0.1, 0, alpha(mark, 0.85)); Rn(c, -0.36, 0.3, 0.72, 0.05, 0, alpha(mark, 0.85)); }
        else { Pg(c, [[-0.41, 0], [0.41, 0], [sw * 1.5, 0.8]], col); if (m === 0) dot(c, sw * 0.4, 0.25, 0.12, alpha(mark, 0.9)); else { K.starPath(c, sw * 0.4, 0.26, 0.15, 0.07, 5, 0); c.fillStyle = alpha(mark, 0.9); c.fill(); } }
        Rn(c, -0.42, -0.06, 0.84, 0.1, 0.04, shade(col, -0.25));
        c.restore();
      }
    });
    K.ow(sow);
    corners(W, H, b * 0.42, function (x, y, sx, sy, n) { /* a gold button pins the string in each corner */
      L(c, x - sx * b * 0.29, y - sy * b * 0.29, x, y, Math.max(1, b * 0.055), lightBg(p) ? '#7a6a5a' : '#b7a999');
      dot(c, x, y, b * 0.3, dk); dot(c, x, y, b * 0.24, p.gold); dot(c, x, y, b * 0.13, p.accent); K.twinkle(c, x - b * 0.08, y - b * 0.08, b * (0.1 + 0.08 * ((n + o.n) % 2 ? k : 0)), '#fffbe0');
    });
  });
});
