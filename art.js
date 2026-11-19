/* Carol Time art library: every picture is drawn in code (Canvas 2D), no image files.
   Works in browsers and in node canvas. Deterministic: no clock, no Math.random. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CarolArt = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var TAU = Math.PI * 2, PI = Math.PI;
  var CarolArt = {};

  /* ---------- helpers ---------- */
  function hash(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rnd(seed) {
    var a = typeof seed === 'number' && isFinite(seed) ? ((Math.floor(seed * 1000003) ^ 0x9e3779b9) >>> 0) : hash(seed == null ? 'carol' : seed);
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function frac(v) { return v - Math.floor(v); }
  var DEF = { bg: '#1d3557', bg2: '#2c5282', ink: '#2b2118', accent: '#d62839', accent2: '#2a9d5c', gold: '#f2c14e', snow: '#ffffff', paper: '#fff8ea' };
  function P(pal) { if (!pal) return DEF; var o = {}; for (var k in DEF) o[k] = pal[k] || DEF[k]; return o; }
  var shadeCache = {};
  function rgbOf(col) {
    var m;
    if (typeof col !== 'string') return null;
    if ((m = /^#([0-9a-f]{3})$/i.exec(col))) { var s = m[1]; return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)]; }
    if ((m = /^#([0-9a-f]{6})/i.exec(col))) { var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
    if ((m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(col))) return [+m[1], +m[2], +m[3]];
    return null;
  }
  /* shade(col, -0.3) = darker, shade(col, 0.3) = lighter */
  function shade(col, amt) {
    var key = col + '|' + amt, hit = shadeCache[key]; if (hit) return hit;
    var c = rgbOf(col), out = col;
    if (c) {
      var t = amt < 0 ? [34, 20, 40] : [255, 255, 255], a = Math.abs(amt);
      out = 'rgb(' + Math.round(c[0] + (t[0] - c[0]) * a) + ',' + Math.round(c[1] + (t[1] - c[1]) * a) + ',' + Math.round(c[2] + (t[2] - c[2]) * a) + ')';
    }
    shadeCache[key] = out; return out;
  }
  function alpha(col, a) { var c = rgbOf(col) || [255, 255, 255]; return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')'; }

  var ow = 1.1; /* outline width in the current drawing space; 0 = no outline */
  function F(c, fill) { c.fillStyle = fill; c.fill(); if (ow > 0 && fill.charCodeAt(3) !== 97 /* no outline on rgba() fills */) { c.lineWidth = ow; c.lineJoin = 'round'; c.strokeStyle = shade(fill, -0.34); c.stroke(); } }
  function E(c, x, y, rx, ry, fill, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); F(c, fill); }
  function dot(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); c.fillStyle = fill; c.fill(); }
  function rrp(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function R(c, x, y, w, h, r, fill) { rrp(c, x, y, w, h, r); F(c, fill); }
  function Rn(c, x, y, w, h, r, fill) { rrp(c, x, y, w, h, r); c.fillStyle = fill; c.fill(); }
  function L(c, x1, y1, x2, y2, w, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineCap = 'round'; c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  function Pg(c, pts, fill, noOutline) {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath();
    if (noOutline) { c.fillStyle = fill; c.fill(); } else F(c, fill);
  }
  function ball(c, x, y, rx, ry, fill, sh) {
    E(c, x, y, rx, ry, sh || shade(fill, -0.14));
    c.beginPath(); c.ellipse(x - rx * 0.09, y - ry * 0.1, rx * 0.86, ry * 0.86, 0, 0, TAU); c.fillStyle = fill; c.fill();
  }
  function starPath(c, x, y, ro, ri, n, rot) {
    c.beginPath();
    for (var i = 0; i < n * 2; i++) { var a = (rot || 0) - PI / 2 + i * PI / n, r = i % 2 ? ri : ro; if (i) c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.closePath();
  }
  function heartPath(c, x, y, s) { /* centred, width ~ s, height ~ s */
    var w = s / 2, t = y - s * 0.22;
    c.beginPath(); c.moveTo(x, y + s * 0.48);
    c.bezierCurveTo(x - w * 2.1, y - s * 0.12, x - w * 0.9, t - s * 0.52, x, t);
    c.bezierCurveTo(x + w * 0.9, t - s * 0.52, x + w * 2.1, y - s * 0.12, x, y + s * 0.48); c.closePath();
  }
  function shine(c, x, y, r) { c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.ellipse(x, y, r, r * 0.55, -0.6, 0, TAU); c.fill(); }
  function twinkle(c, x, y, r, col) { /* four-point sparkle */
    c.fillStyle = col; c.beginPath();
    c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
  }

  /* ---------- faces and limbs ---------- */
  function eyes(c, x, y, dx, r, m, col) {
    var blink = frac(m.t * 0.31 + m.ph) < 0.035;
    for (var s = -1; s <= 1; s += 2) {
      if (blink || m.calm) { c.beginPath(); c.arc(x + s * dx, y - r * 0.2, r, 0.15 * PI, 0.85 * PI); c.lineWidth = r * 0.55; c.lineCap = 'round'; c.strokeStyle = col || '#2b2118'; c.stroke(); }
      else { dot(c, x + s * dx, y, r, col || '#2b2118'); dot(c, x + s * dx + r * 0.3, y - r * 0.38, r * 0.36, '#fff'); }
    }
  }
  function blush(c, x, y, dx, r, col) { c.fillStyle = col || 'rgba(240,96,110,0.42)'; for (var s = -1; s <= 1; s += 2) { c.beginPath(); c.ellipse(x + s * dx, y, r, r * 0.68, 0, 0, TAU); c.fill(); } }
  function mouth(c, x, y, w, m, col) {
    if (m.open > 0.12) {
      c.beginPath(); c.ellipse(x, y + w * 0.15, w * 0.5, w * (0.22 + 0.5 * m.open), 0, 0, TAU); c.fillStyle = '#6a1d2a'; c.fill();
      c.beginPath(); c.ellipse(x, y + w * (0.3 + 0.45 * m.open), w * 0.3, w * 0.16, 0, 0, TAU); c.fillStyle = '#e8707e'; c.fill();
    } else { c.beginPath(); c.arc(x, y - w * 0.25, w * 0.6, 0.18 * PI, 0.82 * PI); c.lineWidth = Math.max(0.7, w * 0.2); c.lineCap = 'round'; c.strokeStyle = col || '#2b2118'; c.stroke(); }
  }
  /* arm from the shoulder; a = 0 hangs down, PI/2 points out to side s, PI points up. Returns the hand point. */
  function arm(c, sx, sy, s, a, len, w, col, hand, hr) {
    var ex = sx + s * Math.sin(a) * len, ey = sy + Math.cos(a) * len;
    if (ow > 0) L(c, sx, sy, ex, ey, w + ow * 1.6, shade(col, -0.34));
    L(c, sx, sy, ex, ey, w, col);
    if (hand) { c.beginPath(); c.arc(ex, ey, hr || w * 0.62, 0, TAU); F(c, hand); }
    return [ex, ey];
  }
  function armAngles(m, base, amp) { /* arms alternate with the beat; wave lifts the right one */
    var l = base + m.sw * amp, r = base - m.sw * amp;
    if (m.wave) r = 2.55 + Math.sin(m.t * 9) * 0.32;
    return [l, r];
  }
  function scarf(c, x, y, w, col, m, s, col2) {
    var sw = m.sw * 3, tx = x + s * w * 0.55;
    c.beginPath(); c.moveTo(tx - 3, y); c.lineTo(tx + 3, y); c.lineTo(tx + 4 + sw, y + 15); c.lineTo(tx - 3.5 + sw, y + 15); c.closePath(); F(c, col);
    for (var i = 0; i < 4; i++) L(c, tx - 3 + sw + i * 2.2, y + 15, tx - 3 + sw + i * 2.2, y + 18, 0.9, col2 || shade(col, -0.25));
    if (col2) { L(c, tx - 2.6 + sw * 0.5, y + 8, tx + 3.2 + sw * 0.5, y + 8, 1.6, col2); }
    R(c, x - w, y - 3, w * 2, 6.5, 3.2, col);
    if (col2) for (var j = -1; j <= 1; j++) L(c, x + j * w * 0.55, y - 2, x + j * w * 0.55, y + 2.4, 1.6, col2);
  }
  function pom(c, x, y, r, col) { E(c, x, y, r, r, col); dot(c, x - r * 0.25, y - r * 0.25, r * 0.45, shade(col, 0.5)); }
  var SKIN = ['#f6cfa8', '#e3ac7c', '#b9774a', '#7c4a2d'], HAIR = ['#6a3d22', '#221a18', '#d49a3a', '#a0452a'];
  var SNSH = '#cfdff0';
  function head(c, x, y, r, skin, m, o) { /* a person's head with ears, eyes, blush, mouth */
    o = o || {};
    E(c, x - r * 0.98, y + r * 0.1, r * 0.2, r * 0.26, skin); E(c, x + r * 0.98, y + r * 0.1, r * 0.2, r * 0.26, skin);
    E(c, x, y, r, r * 0.96, skin);
    eyes(c, x, y + r * 0.05, r * 0.42, r * 0.13, m, o.eye);
    blush(c, x, y + r * 0.38, r * 0.62, r * 0.2);
    if (!o.noMouth) mouth(c, x, y + r * 0.5, r * 0.42, m, shade(skin, -0.55));
  }

  /* ---------- characters (drawn in a 100-unit-high space, feet at 0,0, up is -y) ---------- */
  var CH = {};

  CH.snowman = function (c, m, p) {
    var sn = p.snow, hx = m.sw * 2, hy = -73 + m.k * 1.5, aa = armAngles(m, 2.0, 0.5), i;
    for (i = -1; i <= 1; i += 2) { /* twig arms */
      var a = i < 0 ? aa[0] : aa[1], h = arm(c, i * 15, -55, i, a, 21, 1.8, '#6b4226');
      L(c, h[0], h[1], h[0] + i * 4, h[1] - 5, 1.2, '#6b4226'); L(c, h[0], h[1], h[0] + i * 5.5, h[1] + 1, 1.2, '#6b4226');
    }
    ball(c, 0, -21, 26, 21, sn, SNSH); ball(c, m.sw, -51, 18.5, 16, sn, SNSH);
    dot(c, m.sw, -55, 1.9, p.ink); dot(c, m.sw * 0.8, -47, 1.9, p.ink); dot(c, m.sw * 0.4, -30, 2.1, p.ink);
    ball(c, hx, hy, 14, 13.2, sn, SNSH);
    scarf(c, hx * 0.6, -62.5, 14.5, p.accent, m, -1, p.gold);
    R(c, hx - 13.5, hy - 13.5, 27, 4.4, 2.2, p.ink); R(c, hx - 8.5, hy - 27, 17, 15, 2.5, p.ink);
    Rn(c, hx - 8.5, hy - 17.6, 17, 4, 0, p.accent2); dot(c, hx + 5, hy - 15.6, 1.5, p.gold);
    eyes(c, hx, hy - 2.5, 5.2, 1.8, m, p.ink); blush(c, hx, hy + 3, 8.6, 2.4);
    if (m.open > 0.12) mouth(c, hx, hy + 5, 5, m);
    else for (i = -2; i <= 2; i++) dot(c, hx + i * 2.2, hy + 7.2 - Math.abs(i) * 0.9, 0.85, p.ink);
    Pg(c, [[hx, hy - 0.6], [hx + 11, hy + 2.2], [hx, hy + 3.2]], '#f28a25');
  };

  CH.elf = function (c, m, p) {
    var g = p.accent2, r = p.accent, sk = SKIN[0], hx = m.sw * 2.5, hy = -58 + m.k * 2, aa = armAngles(m, 1.5, 0.9), i;
    for (i = -1; i <= 1; i += 2) { /* striped legs and curly shoes */
      var lx = i * 6 + m.sw * 0.6;
      L(c, lx, -24, lx, -6, 5.6, shade(p.snow, -0.3)); L(c, lx, -24, lx, -6, 4, p.snow);
      for (var j = 0; j < 3; j++) L(c, lx - 1.6, -20 + j * 5.4, lx + 1.6, -20 + j * 5.4, 2, r);
      c.beginPath(); c.moveTo(lx - 3.4, -6); c.quadraticCurveTo(lx - 4, 0, lx + i * 2, 0); c.lineTo(lx + i * 9, 0); c.quadraticCurveTo(lx + i * 14, -1, lx + i * 12.5, -6.5);
      c.quadraticCurveTo(lx + i * 10, -3, lx + 3.4, -6); c.closePath(); F(c, g); dot(c, lx + i * 12.6, -7.4, 1.5, p.gold);
    }
    arm(c, -10, -40, -1, aa[0], 15, 4.4, g, sk, 3); arm(c, 10, -40, 1, aa[1], 15, 4.4, g, sk, 3);
    c.beginPath(); c.moveTo(-10, -44); c.quadraticCurveTo(0, -48, 10, -44); c.lineTo(14, -22); c.lineTo(7, -25); c.lineTo(0, -21); c.lineTo(-7, -25); c.lineTo(-14, -22); c.closePath(); F(c, g);
    Rn(c, -11, -32.5, 22, 3.6, 0, p.ink); R(c, -2.6, -33.4, 5.2, 5.2, 1, p.gold);
    Pg(c, [[-9, -44], [-4, -40], [0, -44.5], [4, -40], [9, -44], [5, -47], [-5, -47]], r);
    for (i = -1; i <= 1; i += 2) Pg(c, [[hx + i * 12, hy - 3], [hx + i * 23, hy - 9], [hx + i * 13.5, hy + 5]], sk); /* pointy ears */
    head(c, hx, hy, 14.5, sk, m);
    dot(c, hx, hy + 3.2, 1.5, shade(sk, -0.2));
    var tx = hx - 17 - m.sw * 5, ty = hy - 30 + m.k * 3; /* floppy hat */
    c.beginPath(); c.moveTo(hx - 14.5, hy - 6); c.quadraticCurveTo(hx - 8, hy - 34, tx, ty); c.quadraticCurveTo(hx + 6, hy - 40, hx + 14.5, hy - 6); c.closePath(); F(c, g);
    R(c, hx - 16, hy - 10, 32, 6, 3, r); for (i = -2; i <= 2; i++) dot(c, hx + i * 6, hy - 7, 1.1, p.gold);
    pom(c, tx, ty, 3.3, p.gold);
  };

  CH.reindeer = function (c, m, p) {
    var br = '#a9703f', dk = '#6f4526', cr = '#f3dfc1', hx = m.sw * 2.2, hy = -60 + m.k * 2, aa = armAngles(m, 1.3, 0.8), i;
    for (i = -1; i <= 1; i += 2) { E(c, i * 9, -4, 7, 4.5, dk); L(c, i * 8, -18, i * 9, -7, 7, br); }
    arm(c, -13, -38, -1, aa[0], 16, 5.5, br, dk, 3.4); arm(c, 13, -38, 1, aa[1], 16, 5.5, br, dk, 3.4);
    E(c, 0, -27, 17, 19, br); E(c, 0, -23, 10.5, 12.5, cr);
    for (i = -1; i <= 1; i += 2) { /* antlers */
      var ax = hx + i * 7, ay = hy - 13, w = m.sw * 1.2;
      c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(ax + i * 3, ay - 12, ax + i * 11 + w, ay - 25);
      c.moveTo(ax + i * 3, ay - 10); c.lineTo(ax - i * 2 + w, ay - 20); c.moveTo(ax + i * 7, ay - 17); c.lineTo(ax + i * 16 + w, ay - 17);
      c.lineCap = 'round'; c.lineWidth = 4.2; c.strokeStyle = shade(cr, -0.45); c.stroke(); c.lineWidth = 2.6; c.strokeStyle = '#e2c79c'; c.stroke();
      E(c, hx + i * 16, hy - 6, 7.5, 4, br, i * -0.5); c.beginPath(); c.ellipse(hx + i * 16, hy - 6, 4.5, 2, i * -0.5, 0, TAU); c.fillStyle = '#e9a9a0'; c.fill();
    }
    E(c, hx, hy, 15, 14.5, br); E(c, hx, hy + 6.5, 10, 7.5, cr);
    eyes(c, hx, hy - 1.5, 6.5, 2, m); blush(c, hx, hy + 4.5, 11, 2.4);
    E(c, hx, hy + 3.4, 3.6, 2.6, '#3a2620'); dot(c, hx - 1, hy + 2.6, 0.9, 'rgba(255,255,255,0.7)');
    mouth(c, hx, hy + 8.2, 4.2, m, '#3a2620');
    R(c, -13, -47.5, 26, 5.5, 2.7, p.accent); /* collar with bells */
    for (i = -1; i <= 1; i++) { E(c, i * 8 + m.sw, -42.5 + Math.abs(i) * -1, 2.5, 2.5, p.gold); dot(c, i * 8 + m.sw, -41.8 - Math.abs(i), 0.6, p.ink); }
  };

  CH.santa = function (c, m, p) {
    var red = p.accent, wh = p.snow, sk = SKIN[1], hx = m.sw * 2, hy = -62 + m.k * 2, aa = armAngles(m, 1.25, 0.75), i;
    for (i = -1; i <= 1; i += 2) { R(c, i * 9 - 6.5, -9, 13, 9, 4, p.ink); Rn(c, i * 9 - 6.5, -10.5, 13, 3.4, 1.6, wh); }
    for (i = -1; i <= 1; i += 2) { var h = arm(c, i * 19, -43, i, i < 0 ? aa[0] : aa[1], 17, 8.5, red); E(c, h[0], h[1], 5, 5, p.accent2); L(c, h[0] - i * 1.5 - 3, h[1] - 4.4 * Math.cos(i < 0 ? aa[0] : aa[1]), h[0] - i * 1.5 + 3, h[1] - 4.4 * Math.cos(i < 0 ? aa[0] : aa[1]), 3, wh); }
    c.beginPath(); c.moveTo(-17, -50); c.quadraticCurveTo(-31, -22, -22, -8); c.lineTo(22, -8); c.quadraticCurveTo(31, -22, 17, -50); c.closePath(); F(c, red);
    R(c, -23, -12, 46, 6.5, 3.2, wh); Rn(c, -3, -46, 6, 36, 0, wh);
    Rn(c, -25.5, -28, 51, 5.5, 0, p.ink); R(c, -5, -30, 10, 9.5, 2, p.gold); Rn(c, -2.4, -27.6, 4.8, 4.7, 1, p.ink);
    head(c, hx, hy, 13.5, sk, m, { noMouth: true });
    c.beginPath(); c.moveTo(hx - 14, hy - 1); /* big scalloped beard */
    c.bezierCurveTo(hx - 20, hy + 12, hx - 13, hy + 27, hx - 5, hy + 25); c.quadraticCurveTo(hx, hy + 32, hx + 5, hy + 25);
    c.bezierCurveTo(hx + 13, hy + 27, hx + 20, hy + 12, hx + 14, hy - 1); c.quadraticCurveTo(hx + 7, hy + 9, hx, hy + 3.5); c.quadraticCurveTo(hx - 7, hy + 9, hx - 14, hy - 1); c.closePath(); F(c, wh);
    c.beginPath(); c.arc(hx - 6, hy + 17, 4, 0.2, 2.4); c.moveTo(hx + 9, hy + 15); c.arc(hx + 5, hy + 15, 4, 0, 2.2); c.lineWidth = 0.9; c.strokeStyle = SNSH; c.stroke();
    if (m.open > 0.12) mouth(c, hx, hy + 8.5, 5.5, m);
    c.beginPath(); c.moveTo(hx, hy + 4.5); c.bezierCurveTo(hx - 4, hy + 2, hx - 12, hy + 5, hx - 13, hy + 9); c.bezierCurveTo(hx - 8, hy + 10, hx - 3, hy + 9, hx, hy + 6.5);
    c.bezierCurveTo(hx + 3, hy + 9, hx + 8, hy + 10, hx + 13, hy + 9); c.bezierCurveTo(hx + 12, hy + 5, hx + 4, hy + 2, hx, hy + 4.5); c.closePath(); F(c, wh);
    E(c, hx, hy + 2.6, 3, 2.6, shade(sk, -0.12)); dot(c, hx - 0.8, hy + 1.8, 0.8, 'rgba(255,255,255,0.6)');
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(hx + i * 5.7, hy + 0.7, 3.5, 0, TAU); c.lineWidth = 0.9; c.strokeStyle = p.gold; c.stroke(); } /* round glasses */
    var tx = hx + 17 + m.sw * 4, ty = hy - 20 + m.k * 3; /* soft cap with holly */
    c.beginPath(); c.moveTo(hx - 13.5, hy - 7); c.quadraticCurveTo(hx - 9, hy - 30, hx + 4, hy - 30); c.quadraticCurveTo(hx + 15, hy - 31, tx, ty); c.quadraticCurveTo(hx + 12, hy - 20, hx + 13.5, hy - 7); c.closePath(); F(c, red);
    R(c, hx - 16, hy - 12, 32, 7.5, 3.7, wh); pom(c, tx, ty + 1, 4.2, wh);
    E(c, hx - 9, hy - 9.5, 3.6, 1.8, p.accent2, -0.5); E(c, hx - 5, hy - 10.4, 3.6, 1.8, p.accent2, 0.4); dot(c, hx - 7.2, hy - 8, 1.3, shade(red, 0.15));
  };

  CH.mrsclaus = function (c, m, p) {
    var red = p.accent, wh = p.snow, sk = SKIN[0], hx = m.sw * 2, hy = -64 + m.k * 2, aa = armAngles(m, 1.2, 0.7), i;
    for (i = -1; i <= 1; i += 2) E(c, i * 8, -3.5, 7, 4, p.ink);
    var hl = arm(c, -15, -45, -1, aa[0], 16, 6.5, red, sk, 3.2), hr = arm(c, 15, -45, 1, aa[1], 16, 6.5, red, sk, 3.2);
    c.beginPath(); c.moveTo(-13, -52); c.quadraticCurveTo(-18, -34, -29, -8); c.quadraticCurveTo(0, -1, 29, -8); c.quadraticCurveTo(18, -34, 13, -52); c.closePath(); F(c, red);
    c.beginPath(); c.moveTo(-27.5, -11.5); c.quadraticCurveTo(0, -5, 27.5, -11.5); c.lineWidth = 4.5; c.lineCap = 'round'; c.strokeStyle = wh; c.stroke();
    c.beginPath(); c.moveTo(-8, -36); c.lineTo(8, -36); c.lineTo(13, -12); c.quadraticCurveTo(0, -8, -13, -12); c.closePath(); F(c, wh); /* apron */
    Rn(c, -14.5, -38.5, 29, 3.4, 1.5, wh); heartPath(c, 0, -24, 8); c.fillStyle = red; c.fill();
    R(c, -11, -53.5, 22, 5, 2.5, wh);
    /* a wooden spoon in her right hand */
    L(c, hr[0], hr[1], hr[0] + 3, hr[1] - 13, 1.8, '#b98048'); E(c, hr[0] + 3.5, hr[1] - 15.5, 3, 4, '#c99258');
    E(c, hx, hy - 15, 8, 7, wh); /* bun */
    E(c, hx, hy - 2, 15.5, 14, wh); head(c, hx, hy, 13, sk, m);
    c.beginPath(); c.moveTo(hx - 13, hy - 2); c.quadraticCurveTo(hx - 12, hy - 14, hx, hy - 13); c.quadraticCurveTo(hx + 12, hy - 14, hx + 13, hy - 2); c.quadraticCurveTo(hx + 6, hy - 9, hx, hy - 8); c.quadraticCurveTo(hx - 6, hy - 9, hx - 13, hy - 2); c.closePath(); F(c, wh);
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(hx + i * 5.5, hy + 0.7, 3.6, 0, TAU); c.lineWidth = 0.9; c.strokeStyle = p.gold; c.stroke(); }
    L(c, hx - 2, hy + 0.5, hx + 2, hy + 0.5, 0.8, p.gold);
    bow(c, hx, hy - 20.5, 13, red); E(c, hx - 9.5, hy - 12, 3.4, 1.7, p.accent2, -0.5); E(c, hx - 6, hy - 13.4, 3.4, 1.7, p.accent2, 0.3); dot(c, hx - 8, hy - 11.4, 1.3, p.gold);
  };

  CH.gingerbread = function (c, m, p) {
    var gb = '#c5803f', ic = p.snow, hx = m.sw * 2, hy = -74 + m.k * 2, aa = armAngles(m, 1.75, 0.6), i, j;
    var limbs = [[-9, -52, -1, aa[0], 22], [9, -52, 1, aa[1], 22], [-7, -24, -1, 0.32 - m.sw * 0.1, 19], [7, -24, 1, 0.32 + m.sw * 0.1, 19]];
    for (i = 0; i < 4; i++) { var q = limbs[i], h = arm(c, q[0], q[1], q[2], q[3], q[4], 12.5, gb); limbs[i].push(h); }
    R(c, -13.5, -60, 27, 44, 12, gb);
    for (i = 0; i < 4; i++) { /* icing cuffs: little zigzags near the ends */
      var q2 = limbs[i], e = q2[5], a = q2[3], s = q2[2], px = Math.cos(a) * 4.6, py = -s * Math.sin(a) * 4.6, bx = e[0] - s * Math.sin(a) * 4.5, by = e[1] - Math.cos(a) * 4.5;
      c.beginPath(); for (j = -2; j <= 2; j++) { var ox = bx + px * j / 2 + (j % 2 ? s * Math.sin(a) * 1.6 : 0), oy = by + py * j / 2 + (j % 2 ? Math.cos(a) * 1.6 : 0); if (j === -2) c.moveTo(ox, oy); else c.lineTo(ox, oy); }
      c.lineWidth = 1.5; c.strokeStyle = ic; c.stroke();
    }
    E(c, hx, hy, 17, 16, gb);
    c.beginPath(); for (i = 0; i <= 8; i++) { var an = PI * 1.08 + i * PI * 0.84 / 8, rr = i % 2 ? 12.4 : 14.2; if (i) c.lineTo(hx + Math.cos(an) * rr, hy + Math.sin(an) * rr); else c.moveTo(hx + Math.cos(an) * rr, hy + Math.sin(an) * rr); }
    c.lineWidth = 1.5; c.strokeStyle = ic; c.stroke(); /* icing hair */
    eyes(c, hx, hy - 1, 6, 2.1, m, '#3a2014'); blush(c, hx, hy + 4.5, 10.5, 2.6, 'rgba(235,90,90,0.5)');
    if (m.open > 0.12) mouth(c, hx, hy + 6, 5.5, m); else { c.beginPath(); c.arc(hx, hy + 2.5, 6, 0.2 * PI, 0.8 * PI); c.lineWidth = 1.6; c.strokeStyle = ic; c.stroke(); }
    Pg(c, [[0, -55.5], [-8, -59.5], [-8, -51.5]], p.accent); Pg(c, [[0, -55.5], [8, -59.5], [8, -51.5]], p.accent); dot(c, 0, -55.5, 2, shade(p.accent, -0.25)); /* bow tie */
    E(c, 0, -44, 2.8, 2.8, p.accent2); E(c, 0, -35, 2.8, 2.8, p.gold); E(c, 0, -26, 2.8, 2.8, p.accent);
    dot(c, -0.8, -44.8, 0.9, 'rgba(255,255,255,0.7)'); dot(c, -0.8, -35.8, 0.9, 'rgba(255,255,255,0.7)'); dot(c, -0.8, -26.8, 0.9, 'rgba(255,255,255,0.7)');
  };

  CH.penguin = function (c, m, p) {
    var nv = '#2d3a5c', or = '#f59a23', hy = m.k * 2, hx = m.sw * 1.5, aa = armAngles(m, 0.75, 0.75), i;
    for (i = -1; i <= 1; i += 2) E(c, i * 10 + m.sw, -3, 9, 4, or, i * 0.15);
    for (i = -1; i <= 1; i += 2) { /* flippers */
      var a = i < 0 ? aa[0] : aa[1];
      c.save(); c.translate(i * 22, -50); c.rotate(-i * a); c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(-i * 2 - 6, 20, 0, 27); c.quadraticCurveTo(7 - i * 2, 16, 4, 0); c.closePath(); F(c, nv); c.restore();
    }
    c.beginPath(); c.moveTo(0, -92 + hy); c.bezierCurveTo(26, -92 + hy, 30, -40, 27, -22); c.bezierCurveTo(25, -2, -25, -2, -27, -22); c.bezierCurveTo(-30, -40, -26, -92 + hy, 0, -92 + hy); c.closePath(); F(c, nv);
    c.beginPath(); c.moveTo(0, -60); c.bezierCurveTo(19, -62, 21, -30, 19, -20); c.bezierCurveTo(16, -5, -16, -5, -19, -20); c.bezierCurveTo(-21, -30, -19, -62, 0, -60); c.closePath(); c.fillStyle = p.snow; c.fill();
    E(c, hx - 7.5, -70 + hy, 8.5, 9, p.snow); E(c, hx + 7.5, -70 + hy, 8.5, 9, p.snow);
    c.fillStyle = p.snow; c.fillRect(hx - 7, -72 + hy, 14, 10);
    eyes(c, hx, -71 + hy, 7, 2.1, m); blush(c, hx, -64.5 + hy, 12.5, 2.6);
    if (m.open > 0.12) { Pg(c, [[hx - 5, -67 + hy], [hx + 5, -67 + hy], [hx, -63.5 + hy]], or); Pg(c, [[hx - 4, -63 + hy + m.open], [hx + 4, -63 + hy + m.open], [hx, -58.5 + hy + m.open * 4]], shade(or, -0.15)); }
    else Pg(c, [[hx - 5.5, -67 + hy], [hx + 5.5, -67 + hy], [hx, -60.5 + hy]], or);
    c.beginPath(); c.arc(hx, -77 + hy, 21, PI * 1.08, PI * 1.92); c.lineWidth = 3; c.strokeStyle = p.gold; c.stroke(); /* earmuffs */
    for (i = -1; i <= 1; i += 2) pom(c, hx + i * 22, -72 + hy, 6.5, p.accent);
    scarf(c, m.sw * 0.6, -54, 21.5, p.accent2, m, 1, p.snow);
  };

  function tabbyTail(c, x, y, s, m, col, tip) {
    var w = Math.sin(m.t * 3) * 3 + m.sw * 5;
    c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + s * 18, y + 2, x + s * 22 + w, y - 22, x + s * 12 + w, y - 32);
    c.lineCap = 'round'; c.lineWidth = 8; c.strokeStyle = shade(col, -0.34); c.stroke(); c.lineWidth = 5.8; c.strokeStyle = col; c.stroke();
    dot(c, x + s * 12 + w, y - 32, 2.9, tip);
  }
  CH.cat = function (c, m, p) {
    var og = '#f0a04b', dk = '#c9742a', cr = '#fff3e0', hx = m.sw * 3, hy = -62 + m.k * 3, i;
    var bulbs = [p.accent, p.gold, p.accent2, '#4aa8ff', '#ff7ac0'];
    tabbyTail(c, 16, -8, 1, m, og, cr);
    c.beginPath(); c.moveTo(0, -60); c.bezierCurveTo(22, -58, 27, -18, 24, -6); c.quadraticCurveTo(22, 0, 0, 0); c.quadraticCurveTo(-22, 0, -24, -6); c.bezierCurveTo(-27, -18, -22, -58, 0, -60); c.closePath(); F(c, og);
    E(c, 0, -22, 12, 16, cr);
    for (i = -1; i <= 1; i += 2) { E(c, i * 9, -4, 8, 5, cr); L(c, i * 9 - 2.5, -2, i * 9 - 2.5, -5, 0.7, dk); L(c, i * 9 + 2.5, -2, i * 9 + 2.5, -5, 0.7, dk); }
    /* string lights wound round the body */
    c.beginPath(); c.moveTo(-27, -44); c.bezierCurveTo(-10, -30, 12, -34, 27, -46); c.moveTo(27, -30); c.bezierCurveTo(8, -12, -12, -16, -27, -26); c.moveTo(-26, -12); c.quadraticCurveTo(0, -2, 28, -14);
    c.lineWidth = 1.2; c.strokeStyle = '#2f4a38'; c.stroke();
    var bp = [[-19, -39, 0], [-6, -34, 1], [8, -35, 2], [20, -40, 3], [18, -22, 4], [4, -15, 0], [-10, -17, 1], [-21, -22, 2], [-12, -8, 3], [6, -7, 4], [20, -10, 1]];
    for (i = 0; i < bp.length; i++) { var on = ((i + m.n) % 3 !== 0) ? 1 : 0.45 + 0.55 * m.k; c.globalAlpha = on; E(c, bp[i][0], bp[i][1] + 2.6, 2.3, 3.2, bulbs[bp[i][2]]); c.globalAlpha = 1; dot(c, bp[i][0] - 0.7, bp[i][1] + 1.6, 0.7, 'rgba(255,255,255,0.8)'); }
    var pa = m.wave ? 2.5 + Math.sin(m.t * 9) * 0.3 : 1.2 - m.sw * 0.8; /* one paw batting a bulb */
    var h = arm(c, 15, -42, 1, pa, 15, 6.5, og, cr, 4);
    L(c, h[0], h[1] - 4, h[0] + 2, h[1] - 10, 1, '#2f4a38'); E(c, h[0] + 2.4, h[1] - 12.5, 2.3, 3.2, p.gold);
    for (i = -1; i <= 1; i += 2) { Pg(c, [[hx + i * 6, hy - 12], [hx + i * 17, hy - 25], [hx + i * 18.5, hy - 5]], og); Pg(c, [[hx + i * 10, hy - 13], [hx + i * 15.6, hy - 20], [hx + i * 16.4, hy - 9]], '#f6b4b0', true); }
    E(c, hx, hy, 19, 16, og);
    for (i = -1; i <= 1; i++) L(c, hx + i * 4, hy - 15, hx + i * 3.4, hy - 9.5, 1.7, dk);
    for (i = -1; i <= 1; i += 2) { L(c, hx + i * 18, hy - 2, hx + i * 13.5, hy - 1, 1.5, dk); L(c, hx + i * 18, hy + 3, hx + i * 14, hy + 2.6, 1.5, dk); }
    E(c, hx, hy + 6, 8.5, 6, cr);
    eyes(c, hx, hy - 1.5, 7.5, 2.5, m, '#2e3b1f'); blush(c, hx, hy + 4.5, 13.5, 2.6);
    Pg(c, [[hx - 2, hy + 2.6], [hx + 2, hy + 2.6], [hx, hy + 4.8]], '#e8707e', true);
    if (m.open > 0.12) mouth(c, hx, hy + 6.5, 4.2, m);
    else { c.beginPath(); c.arc(hx - 2.2, hy + 5, 2.2, 0.1, PI * 0.95); c.moveTo(hx + 4.4, hy + 5); c.arc(hx + 2.2, hy + 5, 2.2, 0.05, PI * 0.9); c.lineWidth = 0.9; c.strokeStyle = '#6a3a22'; c.stroke(); }
    for (i = -1; i <= 1; i += 2) { L(c, hx + i * 9, hy + 5.5, hx + i * 21, hy + 4, 0.5, '#fff'); L(c, hx + i * 9, hy + 7, hx + i * 20.5, hy + 8.5, 0.5, '#fff'); }
  };

  CH.dog = function (c, m, p) {
    var tan = '#d9a566', dk = '#8a5a34', cr = '#fbefd9', hx = m.sw * 3, hy = -64 + m.k * 3, i;
    var wag = Math.sin(m.t * 14) * 0.35 + m.sw * 0.3; /* tail wags fast */
    c.save(); c.translate(-18, -10); c.rotate(-0.6 + wag); R(c, -3, -22, 6, 23, 3, tan); Rn(c, -2.2, -21.4, 4.4, 6, 2, cr); c.restore();
    c.beginPath(); c.moveTo(0, -58); c.bezierCurveTo(20, -56, 25, -18, 23, -6); c.quadraticCurveTo(21, 0, 0, 0); c.quadraticCurveTo(-21, 0, -23, -6); c.bezierCurveTo(-25, -18, -20, -56, 0, -58); c.closePath(); F(c, tan);
    E(c, 0, -22, 11.5, 16, cr);
    for (i = -1; i <= 1; i += 2) E(c, i * 16, -5, 8.5, 5.2, tan);
    var pa = m.wave ? 2.5 + Math.sin(m.t * 9) * 0.3 : 0.5 + Math.max(0, -m.sw) * 0.9, pb = 0.5 + Math.max(0, m.sw) * 0.9;
    arm(c, -10, -31, -1, pb - 0.35, 17, 7, tan, cr, 4.4); arm(c, 10, -31, 1, pa - 0.35, 17, 7, tan, cr, 4.4);
    scarf(c, hx * 0.4, -49, 15.5, p.accent, m, 1, p.snow);
    for (i = -1; i <= 1; i += 2) { /* floppy ears bounce */
      c.save(); c.translate(hx + i * 14, hy - 10); c.rotate(i * (-0.25 - m.k * 0.5)); c.beginPath(); c.moveTo(-5, -2); c.bezierCurveTo(-9 + i * 2, 12, -5 + i * 3, 24, i * 2, 24); c.bezierCurveTo(9 + i * 2, 22, 7, 4, 5, -2); c.closePath(); F(c, dk); c.restore();
    }
    E(c, hx, hy, 17.5, 16, tan);
    c.beginPath(); c.ellipse(hx + 7.5, hy - 2.5, 6.5, 7, 0.2, 0, TAU); c.fillStyle = dk; c.fill(); /* eye patch */
    E(c, hx, hy + 7, 10.5, 8, cr);
    eyes(c, hx, hy - 2, 7.2, 2.3, m); blush(c, hx, hy + 4, 13.5, 2.5);
    E(c, hx, hy + 2.6, 3.8, 2.8, '#33231f'); dot(c, hx - 1.1, hy + 1.7, 0.9, 'rgba(255,255,255,0.7)');
    if (m.open > 0.12) mouth(c, hx, hy + 8, 6, m);
    else { c.beginPath(); c.arc(hx - 3, hy + 6.5, 3, 0.1, PI * 0.9); c.moveTo(hx + 6, hy + 6.5); c.arc(hx + 3, hy + 6.5, 3, 0.05, PI * 0.9); c.lineWidth = 1; c.strokeStyle = '#33231f'; c.stroke(); R(c, hx - 2.2, hy + 9, 4.4, 5 + m.k * 2, 2.2, '#f0707f'); }
  };

  CH.polarbear = function (c, m, p) {
    var wh = '#fbfdff', sh = '#d3e0ee', hx = m.sw * 2, hy = -70 + m.k * 2.5, aa = armAngles(m, 0.9, 0.7), i;
    for (i = -1; i <= 1; i += 2) { E(c, i * 15, -5, 12, 6.5, wh); for (var j = -1; j <= 1; j++) dot(c, i * 15 + j * 4 + i * 2, -2.2, 1.1, '#9fb3c8'); }
    arm(c, -24, -52, -1, aa[0], 22, 11.5, wh, wh, 6.5); arm(c, 24, -52, 1, aa[1], 22, 11.5, wh, wh, 6.5);
    c.beginPath(); c.moveTo(0, -66); c.bezierCurveTo(30, -66, 36, -22, 31, -9); c.quadraticCurveTo(26, -1, 0, -1); c.quadraticCurveTo(-26, -1, -31, -9); c.bezierCurveTo(-36, -22, -30, -66, 0, -66); c.closePath(); F(c, sh);
    c.beginPath(); c.ellipse(-2, -34, 27, 29, 0, 0, TAU); c.fillStyle = wh; c.fill();
    /* knitted jumper band */
    c.save(); c.beginPath(); c.moveTo(0, -66); c.bezierCurveTo(30, -66, 36, -22, 31, -9); c.quadraticCurveTo(26, -1, 0, -1); c.quadraticCurveTo(-26, -1, -31, -9); c.bezierCurveTo(-36, -22, -30, -66, 0, -66); c.clip();
    c.fillStyle = p.accent; c.fillRect(-40, -52, 80, 30); c.fillStyle = p.snow; c.fillRect(-40, -43, 80, 2); c.fillRect(-40, -31, 80, 2);
    for (i = -4; i <= 4; i++) { Pg(c, [[i * 8 + m.sw, -41], [i * 8 + 4 + m.sw, -37], [i * 8 + m.sw, -33], [i * 8 - 4 + m.sw, -37]], i % 2 ? p.accent2 : p.gold, true); }
    c.fillStyle = shade(p.accent, -0.25); c.fillRect(-40, -24.5, 80, 2.5); c.restore();
    for (i = -1; i <= 1; i += 2) { E(c, hx + i * 14, hy - 12, 6.5, 6.5, wh); dot(c, hx + i * 14, hy - 11.5, 3.3, '#f3b9b9'); }
    ball(c, hx, hy, 19, 16.5, wh, sh);
    E(c, hx, hy + 6, 9.5, 7, '#eef3f8');
    eyes(c, hx, hy - 1.5, 8, 2.1, m); blush(c, hx, hy + 4, 14, 2.8);
    E(c, hx, hy + 2.8, 4, 2.9, '#2b2630'); dot(c, hx - 1.2, hy + 1.9, 1, 'rgba(255,255,255,0.7)');
    mouth(c, hx, hy + 8.2, 4.4, m, '#2b2630');
    c.beginPath(); c.moveTo(hx - 16, hy - 8.5); c.quadraticCurveTo(hx, hy - 34, hx + 16, hy - 8.5); c.closePath(); F(c, p.accent2); /* bobble hat */
    R(c, hx - 17.5, hy - 13, 35, 6.5, 3.2, p.snow); pom(c, hx, hy - 23.5 + m.k * 1.5, 5, p.gold);
  };

  CH.owl = function (c, m, p) {
    var br = '#9a6a45', dk = '#6e4628', cr = '#f4e3c3', hy = m.k * 2.5, i, j;
    R(c, -34, -7, 68, 6, 3, '#6b4226'); Rn(c, -30, -8.6, 60, 3.4, 1.7, p.snow); /* snowy branch */
    for (i = -1; i <= 1; i += 2) for (j = -1; j <= 1; j++) L(c, i * 8 + j * 3, -9, i * 8 + j * 3.6, -5.5, 1.8, '#f0a030');
    var flap = m.wave ? 0.7 + Math.sin(m.t * 9) * 0.2 : 0.12 + m.k * 0.6;
    for (i = -1; i <= 1; i += 2) { /* wings lift on the beat */
      var a = flap * (i * m.sw > 0 ? 1.25 : 0.75);
      c.save(); c.translate(i * 24, -58 + hy); c.rotate(-i * a); c.beginPath(); c.moveTo(-6, -2); c.bezierCurveTo(-i * 4 - 10, 18, -4, 28, i * 2, 30); c.bezierCurveTo(10 - i * 4, 22, 8, 6, 6, -2); c.closePath(); F(c, dk);
      L(c, i * 1, 10, i * 1.5, 23, 1, br); c.restore();
    }
    c.beginPath(); c.moveTo(0, -90 + hy); c.bezierCurveTo(34, -92 + hy, 36, -30, 27, -16); c.quadraticCurveTo(18, -6, 0, -6); c.quadraticCurveTo(-18, -6, -27, -16); c.bezierCurveTo(-36, -30, -34, -92 + hy, 0, -90 + hy); c.closePath(); F(c, br);
    for (i = -1; i <= 1; i += 2) Pg(c, [[i * 12, -86 + hy], [i * 27, -99 + hy], [i * 26, -76 + hy]], br); /* ear tufts */
    E(c, 0, -34, 17, 22, cr);
    c.lineWidth = 1.5; c.strokeStyle = '#d9b98a'; c.lineCap = 'round';
    for (j = 0; j < 3; j++) for (i = -2 + (j % 2 ? 0.5 : 0); i <= 2; i++) { c.beginPath(); c.arc(i * 6.5, -40 + j * 9, 3, 0.15 * PI, 0.85 * PI); c.stroke(); }
    for (i = -1; i <= 1; i += 2) { E(c, i * 11.5, -68 + hy, 12, 12, cr); E(c, i * 11.5, -68 + hy, 8, 8, '#fff'); }
    eyes(c, 0, -68 + hy, 11.5 + m.sw * 0.8, 4.4, m, '#2b2118');
    Pg(c, [[-4, -61 + hy], [4, -61 + hy], [0, -54 + hy + (m.open > 0.12 ? 0 : 0)]], '#f0a030');
    if (m.open > 0.12) Pg(c, [[-3, -55 + hy + m.open], [3, -55 + hy + m.open], [0, -51 + hy + m.open * 4]], '#d98820');
    blush(c, 0, -57 + hy, 21, 3);
    scarf(c, 0, -48 + hy * 0.5, 22, p.accent, m, -1, p.gold);
  };

  CH.mouse = function (c, m, p) {
    var gr = '#b9b3bd', pk = '#f4b6c2', cr = '#f5eef0', hx = m.sw * 2.5, hy = -52 + m.k * 3, aa = armAngles(m, 1.4, 0.8), i;
    var w = Math.sin(m.t * 2.5) * 3 + m.sw * 3; /* long curly tail */
    c.beginPath(); c.moveTo(-12, -6); c.bezierCurveTo(-34, -2, -40 + w, -22, -30 + w, -30); c.bezierCurveTo(-24 + w, -35, -22 + w, -26, -27 + w, -25);
    c.lineCap = 'round'; c.lineWidth = 3.4; c.strokeStyle = shade(pk, -0.34); c.stroke(); c.lineWidth = 2; c.strokeStyle = pk; c.stroke();
    for (i = -1; i <= 1; i += 2) E(c, i * 8, -3, 7.5, 4, pk);
    arm(c, -12, -27, -1, aa[0], 12, 4.5, gr, pk, 2.8); var h = arm(c, 12, -27, 1, aa[1], 12, 4.5, gr, pk, 2.8);
    L(c, h[0], h[1] + 2, h[0] + 1, h[1] - 16, 2.4, p.snow); /* tiny candy cane */
    c.beginPath(); c.arc(h[0] + 4.5, h[1] - 16, 3.5, PI, 0); c.lineWidth = 2.4; c.strokeStyle = p.snow; c.stroke();
    for (i = 0; i < 4; i++) L(c, h[0] - 0.6 + i * 0.25, h[1] - 2 - i * 4, h[0] + 1.4 + i * 0.25, h[1] - 3.4 - i * 4, 1.3, p.accent);
    E(c, 0, -19, 16, 18, gr); E(c, 0, -15, 9.5, 12, cr);
    for (i = -1; i <= 1; i += 2) { E(c, hx + i * 18, hy - 12 - m.k * 2, 13, 13, gr); E(c, hx + i * 18, hy - 12 - m.k * 2, 8.5, 8.5, pk); } /* huge ears */
    E(c, hx, hy, 17, 15.5, gr);
    E(c, hx, hy + 6, 8, 6, cr);
    eyes(c, hx, hy - 1.5, 7, 2.4, m); blush(c, hx, hy + 4.5, 12.5, 2.6);
    dot(c, hx, hy + 2.5, 2.2, '#e8707e'); dot(c, hx - 0.6, hy + 1.9, 0.6, 'rgba(255,255,255,0.8)');
    if (m.open > 0.12) mouth(c, hx, hy + 6.5, 4.4, m); else { mouth(c, hx, hy + 7, 3.4, m, '#5a4650'); Rn(c, hx - 1.2, hy + 7.8, 2.4, 2.6, 0.6, '#fff'); }
    for (i = -1; i <= 1; i += 2) { L(c, hx + i * 8, hy + 5, hx + i * 19, hy + 3, 0.45, '#fff'); L(c, hx + i * 8, hy + 6.5, hx + i * 19, hy + 8, 0.45, '#fff'); }
    var tx = hx + 15 + m.sw * 4, ty = hy - 30 + m.k * 3; /* nightcap */
    c.beginPath(); c.moveTo(hx - 11, hy - 11); c.quadraticCurveTo(hx - 2, hy - 34, tx, ty); c.quadraticCurveTo(hx + 10, hy - 22, hx + 11, hy - 11); c.closePath(); F(c, p.accent);
    c.save(); c.clip(); for (i = 0; i < 4; i++) L(c, hx - 16, hy - 15 - i * 6, hx + 22, hy - 19 - i * 6, 2, p.snow); c.restore();
    R(c, hx - 12.5, hy - 14.5, 25, 5, 2.5, p.snow); pom(c, tx, ty, 3.4, p.snow);
  };

  CH.nutcracker = function (c, m, p) {
    var red = p.accent, bl = '#27406e', sk = SKIN[0], hx = m.sw * 1.2, hy = -64 + m.k * 1.5, i;
    for (i = -1; i <= 1; i += 2) { R(c, i * 6.5 - 5, -30, 10, 22, 2, p.snow); R(c, i * 6.5 - 5.5, -12, 11, 12, 2.5, p.ink); Rn(c, i * 6.5 - 5.5, -12, 11, 2.4, 1, p.gold); }
    var aL = 0.25 + Math.max(0, m.sw) * 1.5, aR = m.wave ? 2.5 + Math.sin(m.t * 9) * 0.3 : 0.25 + Math.max(0, -m.sw) * 1.5; /* stiff arms swing up in turn */
    for (i = -1; i <= 1; i += 2) { var h = arm(c, i * 15, -50, i, i < 0 ? aL : aR, 20, 7, red, p.snow, 3.6); }
    R(c, -13, -55, 26, 27, 4, red);
    Rn(c, -13, -32.5, 26, 4.5, 1, p.ink); R(c, -3.5, -34, 7, 7, 1.5, p.gold);
    for (i = 0; i < 3; i++) { L(c, -6, -50 + i * 5.5, 6, -50 + i * 5.5, 1.5, p.gold); dot(c, -6, -50 + i * 5.5, 1.4, p.gold); dot(c, 6, -50 + i * 5.5, 1.4, p.gold); }
    for (i = -1; i <= 1; i += 2) { R(c, i * 15 - 6, -57, 12, 5, 2.5, p.gold); for (var j = -1; j <= 1; j++) L(c, i * 15 + j * 3.4, -52, i * 15 + j * 3.4, -49.5, 1.2, p.gold); } /* epaulettes */
    R(c, hx - 13, hy - 10, 26, 3.5, 1, p.snow); /* hair */
    R(c, hx - 11, hy - 11, 22, 22, 5, sk);
    c.fillStyle = p.snow; c.fillRect(hx - 12.5, hy - 5, 2.6, 13); c.fillRect(hx + 9.9, hy - 5, 2.6, 13);
    eyes(c, hx, hy - 3, 5, 1.9, m); blush(c, hx, hy + 1.5, 7.6, 2.5, 'rgba(230,70,80,0.6)');
    L(c, hx - 7.5, hy - 6.6, hx - 3, hy - 7.6, 1.5, p.ink); L(c, hx + 7.5, hy - 6.6, hx + 3, hy - 7.6, 1.5, p.ink);
    var jaw = m.open > 0.12 ? m.open * 4 : m.k * 1.2; /* wooden jaw drops */
    Rn(c, hx - 5.5, hy + 5, 11, 3 + jaw, 0.5, '#6a1d2a'); R(c, hx - 6, hy + 6 + jaw, 12, 5.5, 1.5, shade(sk, -0.08));
    for (i = -2; i <= 2; i++) Rn(c, hx + i * 2.1 - 0.9, hy + 5, 1.8, 2.2, 0.3, '#fff');
    c.beginPath(); c.moveTo(hx, hy + 2); c.quadraticCurveTo(hx - 6, hy + 0.5, hx - 10.5, hy + 4.5); c.quadraticCurveTo(hx - 5, hy + 6, hx, hy + 3.6); c.quadraticCurveTo(hx + 5, hy + 6, hx + 10.5, hy + 4.5); c.quadraticCurveTo(hx + 6, hy + 0.5, hx, hy + 2); c.closePath(); F(c, p.snow);
    R(c, hx - 11.5, hy - 34, 23, 24.5, 3, bl); Rn(c, hx - 11.5, hy - 14.5, 23, 4.6, 1, p.gold); /* tall hat */
    starPath(c, hx, hy - 24, 5.5, 2.4, 5, 0); F(c, p.gold);
    L(c, hx, hy - 34, hx + m.sw * 2, hy - 38.5, 2.2, red); pom(c, hx + m.sw * 2, hy - 38.2 + 2, 2.2, red);
  };

  CH.angel = function (c, m, p) {
    var gown = p.snow, sk = SKIN[(m.v + 1) % 4], hr = HAIR[(m.v + 2) % 4], hx = m.sw * 1.6, hy = -66 + m.k * 1.5, i, j;
    var fl = 0.12 + m.k * 0.28 + Math.sin(m.t * 2) * 0.05;
    for (i = -1; i <= 1; i += 2) { /* feathered wings */
      c.save(); c.translate(i * 6, -50); c.rotate(-i * fl); c.beginPath(); c.moveTo(0, 2);
      c.bezierCurveTo(i * 12, -34, i * 38, -30, i * 37, -8); c.quadraticCurveTo(i * 37, 0, i * 30, 2); c.quadraticCurveTo(i * 32, 10, i * 23, 11); c.quadraticCurveTo(i * 24, 19, i * 14, 18); c.quadraticCurveTo(i * 6, 20, 0, 12); c.closePath(); F(c, '#fffdf2');
      c.beginPath(); c.moveTo(i * 8, -6); c.quadraticCurveTo(i * 20, -18, i * 31, -8); c.moveTo(i * 8, 2); c.quadraticCurveTo(i * 17, -5, i * 25, 3); c.lineWidth = 1; c.strokeStyle = shade(p.gold, 0.35); c.stroke(); c.restore();
    }
    c.beginPath(); c.moveTo(-9, -52); c.quadraticCurveTo(-13, -30, -22, -3); c.quadraticCurveTo(-11, 2, 0, -1.5); c.quadraticCurveTo(11, 2, 22, -3); c.quadraticCurveTo(13, -30, 9, -52); c.closePath(); F(c, gown);
    c.beginPath(); c.moveTo(-20, -8.5); c.quadraticCurveTo(-10, -4, 0, -7); c.quadraticCurveTo(10, -4, 20, -8.5); c.lineWidth = 1.6; c.strokeStyle = p.gold; c.stroke();
    for (i = -1; i <= 1; i++) twinkle(c, i * 9, -20 + Math.abs(i) * 2, 2.2, p.gold);
    L(c, -8, -41, 8, -41, 2, p.gold);
    var w = m.wave ? 1 : 0; /* sleeves meet in front, hands together */
    for (i = -1; i <= 1; i += 2) {
      if (i > 0 && w) { arm(c, 9, -48, 1, 2.5 + Math.sin(m.t * 9) * 0.3, 15, 6, gown, sk, 3); continue; }
      c.beginPath(); c.moveTo(i * 9, -50); c.quadraticCurveTo(i * 15, -42, i * 3, -34 - m.k * 2); c.lineTo(i * 1, -40 - m.k * 2); c.closePath(); F(c, gown);
    }
    E(c, 0, -38.5 - m.k * 2, 3.4, 3.8, sk);
    E(c, hx, hy + 1, 15, 15.5, hr); /* hair behind */
    head(c, hx, hy, 12.5, sk, m);
    c.beginPath(); c.moveTo(hx - 12.6, hy + 1); c.quadraticCurveTo(hx - 13, hy - 14, hx, hy - 13.4); c.quadraticCurveTo(hx + 13, hy - 14, hx + 12.6, hy + 1); c.quadraticCurveTo(hx + 8, hy - 7, hx + 1, hy - 8); c.quadraticCurveTo(hx - 7, hy - 7, hx - 12.6, hy + 1); c.closePath(); F(c, hr);
    c.beginPath(); c.ellipse(hx, hy - 21 - m.k * 1.5 + Math.sin(m.t * 2.4) * 0.8, 10, 2.8, 0, 0, TAU); c.lineWidth = 2.2; c.strokeStyle = shade(p.gold, -0.2); c.stroke(); c.lineWidth = 1.3; c.strokeStyle = shade(p.gold, 0.25); c.stroke();
  };

  CH.fawn = function (c, m, p) { /* a baby deer on four wobbly legs, seen from the side */
    var br = '#c98d55', dk = '#8a5a34', cr = '#fbead0', hx = 15 + m.sw * 2, hy = -60 + m.k * 3, i, by = -34 + m.k * 2;
    var lg = [[-15, 0.5], [-8, -0.5], [9, 0.5], [16, -0.5]];
    for (i = 0; i < 4; i++) { var lift = Math.max(0, m.sw * lg[i][1]) * 5, fx = lg[i][0] + m.sw * lg[i][1] * 3; L(c, lg[i][0], by + 6, fx, -3 - lift, 5.6, shade(br, -0.34)); L(c, lg[i][0], by + 6, fx, -3 - lift, 4, i % 2 ? br : shade(br, -0.12)); R(c, fx - 2.9, -4.5 - lift, 5.8, 4.5, 1.5, dk); }
    c.save(); c.translate(-21, by - 5); c.rotate(-0.5 + Math.sin(m.t * 10) * 0.3 * (0.3 + m.e)); E(c, -3, -3, 5, 3.5, cr); c.restore(); /* flick tail */
    E(c, 0, by, 22, 13, br); c.beginPath(); c.ellipse(1, by + 6, 15, 5.5, 0, 0, TAU); c.fillStyle = cr; c.fill();
    var sp = [[-12, -6], [-5, -8], [3, -7], [-9, -1], [-1, -2], [-15, -1]]; for (i = 0; i < sp.length; i++) dot(c, sp[i][0], by + sp[i][1], 1.6, cr);
    c.beginPath(); c.moveTo(11, by - 8); c.lineTo(hx - 6, hy + 4); c.lineTo(hx + 6, hy + 8); c.lineTo(20, by + 4); c.closePath(); F(c, br);
    for (i = -1; i <= 1; i += 2) { c.save(); c.translate(hx + i * 11, hy - 9); c.rotate(i * (0.9 + m.k * 0.35)); E(c, 0, -8, 5, 10, br); c.beginPath(); c.ellipse(0, -8, 2.6, 7, 0, 0, TAU); c.fillStyle = '#f6b4b0'; c.fill(); c.restore(); } /* big ears */
    L(c, hx - 4, hy - 14, hx - 5, hy - 19, 2.2, '#e2c79c'); L(c, hx + 4, hy - 14, hx + 5, hy - 19, 2.2, '#e2c79c');
    E(c, hx, hy, 14, 13.5, br); E(c, hx, hy + 6.5, 8, 6, cr);
    dot(c, hx - 4, hy - 9, 1.2, cr); dot(c, hx + 1, hy - 10.5, 1.2, cr); dot(c, hx + 5, hy - 8.5, 1.2, cr);
    eyes(c, hx, hy - 0.5, 6.5, 2.7, m); blush(c, hx, hy + 4.5, 11, 2.4);
    E(c, hx, hy + 4, 2.7, 2, '#3a2620'); mouth(c, hx, hy + 8, 3.4, m, '#3a2620');
    R(c, 9, by - 5, 12, 4, 2, p.accent); E(c, 16, by + 1.5, 2.6, 2.6, p.gold); /* ribbon collar and bell */
    Pg(c, [[11, by - 3], [5, by - 8], [5, by + 1]], p.accent);
  };

  CH.robot = function (c, m, p) {
    var tin = '#9fd0cf', tin2 = '#e86a4a', mt = '#dfe6ea', hx = m.sw * 1.5, hy = -68 + m.k * 2, aa = armAngles(m, 1.2, 0.9), i;
    c.save(); c.translate(18, -38); /* wind-up key turns */
    L(c, 0, 0, 9, 0, 2.2, shade(p.gold, -0.25)); var kx = Math.cos(m.t * 4); E(c, 12, -4.5, 3.6 * Math.max(0.25, Math.abs(kx)), 4.5, p.gold); E(c, 12, 4.5, 3.6 * Math.max(0.25, Math.abs(kx)), 4.5, p.gold); c.restore();
    for (i = -1; i <= 1; i += 2) { for (var j = 0; j < 3; j++) R(c, i * 8 - 3.5, -20 + j * 4.6, 7, 4.2, 1.6, mt); R(c, i * 9 - 7, -7, 14, 7, 2.5, tin2); }
    for (i = -1; i <= 1; i += 2) { /* bendy arms with clamp hands */
      var a = i < 0 ? aa[0] : aa[1], h = arm(c, i * 16, -44, i, a, 15, 4.6, mt);
      c.beginPath(); c.arc(h[0], h[1], 4, 0, TAU); c.lineWidth = 2.6; c.strokeStyle = shade(tin2, -0.3); c.stroke();
      c.beginPath(); c.arc(h[0], h[1], 4, -i * (a - PI / 2) + PI / 2 - 1.0 + (i < 0 ? PI : 0) * 0, 0); c.lineWidth = 0;
      dot(c, h[0], h[1], 2.6, tin2);
    }
    R(c, -16, -52, 32, 33, 5, tin);
    Rn(c, -16, -26, 32, 3, 0, shade(tin, -0.2));
    R(c, -11, -47, 22, 13, 2.5, p.paper); /* chest meter */
    c.beginPath(); c.arc(0, -35.5, 9, PI * 1.15, PI * 1.85); c.lineWidth = 0.8; c.strokeStyle = p.ink; c.stroke();
    var nd = PI * 1.5 + m.sw * 0.5 + m.k * 0.2; L(c, 0, -35.5, Math.cos(nd) * 9, -35.5 + Math.sin(nd) * 9, 1, p.accent);
    heartPath(c, -7, -28.5, 4 + m.k * 1.6); c.fillStyle = p.accent; c.fill(); dot(c, 1, -28.5, 1.7, p.gold); dot(c, 7.5, -28.5, 1.7, p.accent2);
    for (i = -1; i <= 1; i += 2) { dot(c, i * 13.5, -49.5, 0.8, shade(tin, -0.35)); dot(c, i * 13.5, -22, 0.8, shade(tin, -0.35)); }
    R(c, -5, -57, 10, 6, 1.5, mt);
    for (i = -1; i <= 1; i += 2) R(c, hx + i * 17 - 2.5, hy - 5, 5, 10, 2, tin2); /* ear bolts */
    R(c, hx - 16, hy - 12, 32, 24, 6, tin);
    for (i = -1; i <= 1; i += 2) { E(c, hx + i * 7, hy - 2, 5.2, 5.2, p.paper); }
    eyes(c, hx + m.sw * 0.8, hy - 2, 7, 2.4, m);
    blush(c, hx, hy + 4.5, 12, 2.2, 'rgba(232,106,74,0.55)');
    if (m.open > 0.12) { R(c, hx - 5, hy + 4, 10, 2.5 + m.open * 4, 1.2, '#3b2a2a'); }
    else { R(c, hx - 6, hy + 4.6, 12, 4, 1.5, p.paper); for (i = -1; i <= 1; i++) L(c, hx + i * 3, hy + 5, hx + i * 3, hy + 8.2, 0.7, shade(tin, -0.4)); }
    L(c, hx, hy - 12, hx + m.sw * 2.5, hy - 22, 1.4, mt); /* antenna bulb blinks on the beat */
    c.globalAlpha = 0.35 + 0.65 * Math.max(m.k, 0.3); dot(c, hx + m.sw * 2.5, hy - 24, 5.5 * (0.6 + m.k * 0.5), alpha(p.gold, 0.45)); c.globalAlpha = 1;
    E(c, hx + m.sw * 2.5, hy - 24, 3, 3, p.accent); dot(c, hx + m.sw * 2.5 - 0.8, hy - 24.8, 0.9, 'rgba(255,255,255,0.8)');
  };

  /* a standing person: legs, coat/torso and head; clothes are added by the caller */
  function hairdo(c, hx, hy, r, col, style) {
    if (style === 0) { c.beginPath(); c.moveTo(hx - r, hy); c.quadraticCurveTo(hx - r * 1.05, hy - r * 1.15, hx, hy - r * 1.08); c.quadraticCurveTo(hx + r * 1.05, hy - r * 1.15, hx + r, hy); c.quadraticCurveTo(hx + r * 0.5, hy - r * 0.65, hx - r * 0.2, hy - r * 0.6); c.quadraticCurveTo(hx - r * 0.7, hy - r * 0.55, hx - r, hy); c.closePath(); F(c, col); }
    else if (style === 1) { for (var i = -2; i <= 2; i++) E(c, hx + i * r * 0.42, hy - r * (0.92 - Math.abs(i) * 0.14), r * 0.36, r * 0.36, col); }
    else if (style === 2) { c.beginPath(); c.moveTo(hx - r * 1.05, hy + r * 1.1); c.quadraticCurveTo(hx - r * 1.25, hy - r * 1.2, hx, hy - r * 1.1); c.quadraticCurveTo(hx + r * 1.25, hy - r * 1.2, hx + r * 1.05, hy + r * 1.1); c.lineTo(hx + r * 0.82, hy - r * 0.1); c.quadraticCurveTo(hx, hy - r * 0.95, hx - r * 0.82, hy - r * 0.1); c.closePath(); F(c, col); }
    else { c.beginPath(); c.arc(hx, hy - r * 0.12, r * 1.02, PI * 1.02, PI * 1.98); c.quadraticCurveTo(hx, hy - r * 0.75, hx - r * 1.02, hy - r * 0.18); c.closePath(); F(c, col); E(c, hx, hy - r * 1.2, r * 0.42, r * 0.36, col); }
  }
  var COATS = ['#2f5d8a', '#7a3b69', '#2c6e49', '#b5562b'];
  CH.caroler = function (c, m, p) {
    var v = m.v, sk = SKIN[v], hr = HAIR[(v + 1) % 4], coat = v === 0 ? p.accent2 : v === 2 ? p.accent : COATS[v], hx = m.sw * 2, hy = -70 + m.k * 2, i;
    for (i = -1; i <= 1; i += 2) { L(c, i * 6, -26, i * 6.5, -6, 7, '#3a3550'); R(c, i * 7 - 6.5, -8, 13, 8, 3.5, '#5a3a25'); }
    c.beginPath(); c.moveTo(-12, -55); c.quadraticCurveTo(-16, -38, -19, -17); c.quadraticCurveTo(0, -12, 19, -17); c.quadraticCurveTo(16, -38, 12, -55); c.closePath(); F(c, coat);
    L(c, 0, -52, 0, -16, 1, shade(coat, -0.3)); for (i = 0; i < 3; i++) { dot(c, -3.5, -44 + i * 8, 1.5, p.gold); dot(c, 3.5, -44 + i * 8, 1.5, p.gold); }
    Rn(c, -19, -20.5, 38, 4, 2, shade(coat, 0.3));
    if (v === 2 && !m.calm) hairdo(c, hx, hy, 13.5, hr, 2);
    head(c, hx, hy, 13, sk, m);
    if (v !== 1) hairdo(c, hx, hy, 13, hr, v === 3 ? 0 : v);
    scarf(c, hx * 0.5, -56, 13.5, v === 0 ? p.accent : p.gold, m, -1, p.snow);
    /* songbook held in both mittens, lifts on the beat */
    var bx = m.sw * 1.5, by = -40 - m.k * 3;
    if (m.wave) { arm(c, 13, -50, 1, 2.5 + Math.sin(m.t * 9) * 0.3, 16, 6.5, coat, p.accent, 3.8); bx = -6; }
    else arm(c, 13, -50, 1, 0.5, 13, 6.5, coat);
    arm(c, -13, -50, -1, 0.5, 13, 6.5, coat);
    c.save(); c.translate(bx, by); c.rotate(m.sw * 0.06);
    Pg(c, [[-12, -7], [0, -5], [12, -7], [12, 6], [0, 8], [-12, 6]], shade(p.accent, -0.2)); Pg(c, [[-10.5, -8.5], [0, -6], [0, 6.5], [-10.5, 4.5]], p.paper); Pg(c, [[10.5, -8.5], [0, -6], [0, 6.5], [10.5, 4.5]], p.paper);
    for (i = 0; i < 3; i++) { L(c, -8.5, -4.5 + i * 3, -2, -3.3 + i * 3, 0.5, '#9a8f84'); L(c, 8.5, -4.5 + i * 3, 2, -3.3 + i * 3, 0.5, '#9a8f84'); }
    dot(c, 5, -1.4, 0.9, p.ink); L(c, 5.8, -1.4, 5.8, -4.6, 0.5, p.ink);
    E(c, -11, 2, 3.6, 3.6, v === 0 ? p.accent : p.gold); if (!m.wave) E(c, 11, 2, 3.6, 3.6, v === 0 ? p.accent : p.gold); c.restore();
    if (v === 1 || v === 3) { /* bobble hat */
      var hc = v === 1 ? p.accent : p.accent2;
      c.beginPath(); c.moveTo(hx - 13.2, hy - 5); c.quadraticCurveTo(hx - 12, hy - 22, hx, hy - 22); c.quadraticCurveTo(hx + 12, hy - 22, hx + 13.2, hy - 5); c.closePath(); F(c, hc);
      R(c, hx - 14.5, hy - 9.5, 29, 6, 3, p.snow); pom(c, hx, hy - 24 + m.k, 4.2, p.snow);
    } else if (v === 0) { for (i = -1; i <= 1; i += 2) pom(c, hx + i * 14, hy + 1, 4.6, p.snow); c.beginPath(); c.arc(hx, hy - 2, 14.5, PI * 1.1, PI * 1.9); c.lineWidth = 2; c.strokeStyle = p.snow; c.stroke(); }
    else { R(c, hx - 12, hy - 13.5, 24, 4.4, 2, p.accent2); E(c, hx + 8, hy - 12, 2.2, 2.2, p.gold); }
  };

  CH.officemate = function (c, m, p) {
    var v = m.v, sk = SKIN[(v + 2) % 4], hr = HAIR[v], sw = [p.accent, p.accent2, '#2f5d8a', '#7a3b69'][v], hx = m.sw * 2, hy = -71 + m.k * 2, i, j;
    for (i = -1; i <= 1; i += 2) { L(c, i * 6.5, -28, i * 7, -6, 8, '#6c7385'); R(c, i * 8 - 7, -7, 14, 7, 3, '#3b3340'); }
    var aL = armAngles(m, 1.0, 0.7)[0];
    arm(c, -15, -51, -1, aL, 17, 7, sw, sk, 3.6);
    c.beginPath(); c.moveTo(-14, -56); c.quadraticCurveTo(-19, -40, -18, -24); c.quadraticCurveTo(0, -20, 18, -24); c.quadraticCurveTo(19, -40, 14, -56); c.closePath(); F(c, sw);
    c.save(); c.clip(); /* the ugly sweater: zigzags, argyle, a tree, pom-poms */
    c.beginPath(); for (i = -5; i <= 5; i++) { c.lineTo(i * 4, -50 + (i % 2 ? 0 : 3)); } c.lineWidth = 1.6; c.strokeStyle = p.snow; c.stroke();
    for (i = -3; i <= 3; i++) Pg(c, [[i * 6.5, -33], [i * 6.5 + 3.2, -29.5], [i * 6.5, -26], [i * 6.5 - 3.2, -29.5]], i % 2 ? p.gold : p.snow, true);
    c.fillStyle = shade(sw, -0.25); c.fillRect(-20, -27, 40, 6); c.restore();
    Pg(c, [[0, -47.5], [6, -36], [-6, -36]], v === 1 ? p.accent : p.accent2, true); Rn(c, -1.2, -36, 2.4, 2.4, 0, '#7a5230');
    var bl = [p.gold, p.snow, v === 0 ? p.gold : p.accent, '#58b4ff']; for (i = 0; i < 4; i++) dot(c, [-2, 2.2, -3, 0.6][i], [-40, -38.5, -37, -43][i], 1.05, bl[(i + m.n) % 4]);
    starPath(c, 0, -48, 2.2, 1, 5, 0); c.fillStyle = p.gold; c.fill();
    R(c, -7.5, -58.5, 15, 4.6, 2.3, shade(sw, 0.3));
    L(c, -5, -55, -1, -46, 0.7, '#2d6cdf'); L(c, 5, -55, 9, -44, 0.7, '#2d6cdf'); R(c, 6, -44.5, 6.5, 8, 1, p.paper); Rn(c, 7.4, -43, 3.7, 2.6, 0.5, '#b9c6d8'); /* lanyard badge */
    if (v === 2) hairdo(c, hx, hy, 13.5, hr, 2);
    head(c, hx, hy, 13, sk, m);
    hairdo(c, hx, hy, 13, hr, v === 2 ? 0 : v === 0 ? 0 : v);
    if (v % 2 === 0) { for (i = -1; i <= 1; i += 2) { rrp(c, hx + i * 5.6 - 3.8, hy - 2.6, 7.6, 6.4, 2); c.lineWidth = 1; c.strokeStyle = p.ink; c.stroke(); } L(c, hx - 1.8, hy, hx + 1.8, hy, 0.9, p.ink); }
    for (i = -1; i <= 1; i += 2) { L(c, hx + i * 6, hy - 14, hx + i * 13, hy - 24 + m.k * 2, 2.4, '#8a5a34'); L(c, hx + i * 10, hy - 20, hx + i * 15, hy - 19, 1.8, '#8a5a34'); } /* antler headband */
    c.beginPath(); c.arc(hx, hy - 3, 13.4, PI * 1.2, PI * 1.8); c.lineWidth = 2; c.strokeStyle = p.accent; c.stroke();
    /* mug raised on the beat, with steam */
    var ma = m.wave ? 2.5 + Math.sin(m.t * 9) * 0.3 : 1.35 + m.k * 0.5 - m.sw * 0.15, h = arm(c, 15, -51, 1, ma, 16, 7, sw, sk, 3.6), mx = h[0] + 2, my = h[1] - 5;
    c.beginPath(); c.arc(mx + 5.5, my + 1, 3.4, -PI / 2, PI / 2); c.lineWidth = 1.8; c.strokeStyle = p.snow; c.stroke();
    R(c, mx - 5.5, my - 5, 11, 11.5, 2, p.snow); heartPath(c, mx, my + 1, 4.6); c.fillStyle = p.accent; c.fill();
    c.lineWidth = 1.1; c.strokeStyle = 'rgba(255,255,255,0.7)'; for (j = -1; j <= 1; j += 2) { var st = Math.sin(m.t * 3 + j) * 1.5; c.beginPath(); c.moveTo(mx + j * 2, my - 7); c.quadraticCurveTo(mx + j * 2 + 3 + st, my - 11, mx + j * 2 + st, my - 15); c.stroke(); }
  };

  CH.shepherd = function (c, m, p) {
    var robe = '#a8845c', over = '#6f8f86', cloth = p.paper, sk = SKIN[2], hx = m.sw * 1.2, hy = -72 + m.k, i;
    m.calm = true; /* eyes gently closed: quiet and reverent */
    for (i = -1; i <= 1; i += 2) E(c, i * 7, -2.5, 6.5, 3.2, '#6b4a2e');
    c.beginPath(); c.moveTo(-11, -58); c.quadraticCurveTo(-16, -30, -19, -4); c.quadraticCurveTo(0, 0, 19, -4); c.quadraticCurveTo(16, -30, 11, -58); c.closePath(); F(c, robe);
    c.beginPath(); c.moveTo(-11, -58); c.quadraticCurveTo(-15, -36, -15, -12); c.lineTo(-4, -10); c.quadraticCurveTo(-1, -40, 6, -58); c.closePath(); F(c, over);
    L(c, -13, -34, 14, -36, 2.2, '#7a5230'); L(c, 6, -35, 5, -24, 1.6, '#7a5230');
    for (i = -3; i <= 3; i++) L(c, i * 5, -6.5, i * 5, -3.2, 0.8, shade(robe, -0.25));
    arm(c, -13, -53, -1, -0.85, 13, 6.5, over, sk, 3.2); /* hand over heart */
    c.beginPath(); c.moveTo(hx - 13.5, hy + 13); c.quadraticCurveTo(hx - 17, hy - 15, hx, hy - 15.5); c.quadraticCurveTo(hx + 17, hy - 15, hx + 13.5, hy + 13); c.quadraticCurveTo(hx, hy + 18, hx - 13.5, hy + 13); c.closePath(); F(c, cloth);
    head(c, hx, hy, 11.5, sk, m);
    c.beginPath(); c.moveTo(hx - 11.5, hy + 2.5); c.quadraticCurveTo(hx, hy + 22, hx + 11.5, hy + 2.5); c.quadraticCurveTo(hx + 7, hy + 9.5, hx, hy + 9.5); c.quadraticCurveTo(hx - 7, hy + 9.5, hx - 11.5, hy + 2.5); c.closePath(); F(c, '#5b4030'); /* beard */
    c.beginPath(); c.moveTo(hx - 12.5, hy + 1); c.quadraticCurveTo(hx - 13, hy - 13.5, hx, hy - 13); c.quadraticCurveTo(hx + 13, hy - 13.5, hx + 12.5, hy + 1); c.quadraticCurveTo(hx + 10, hy - 7, hx, hy - 7.5); c.quadraticCurveTo(hx - 10, hy - 7, hx - 12.5, hy + 1); c.closePath(); F(c, cloth);
    L(c, hx - 12.5, hy - 7.5, hx + 12.5, hy - 7.5, 2.4, p.accent);
    var sx = 20 + m.sw * 1.5; /* staff with crook */
    c.beginPath(); c.moveTo(sx + 1, 0); c.lineTo(sx - 1, -84); c.arc(sx - 7, -85, 6.5, 0, -PI * 0.95, true); c.lineCap = 'round'; c.lineWidth = 4.2; c.strokeStyle = shade('#7a5230', -0.34); c.stroke(); c.lineWidth = 2.6; c.strokeStyle = '#8f6238'; c.stroke();
    arm(c, 12, -53, 1, 1.25, 12, 6.5, over, sk, 3.2);
  };

  CH.yeti = function (c, m, p) {
    var fur = '#f4f8fc', sh = '#c4d6ea', face = '#8fb9de', hx = m.sw * 2, hy = -68 + m.k * 3, aa = armAngles(m, 2.1, 0.55), i;
    for (i = -1; i <= 1; i += 2) { E(c, i * 16, -5, 14, 7, sh); for (var j = -1; j <= 1; j++) E(c, i * 16 + j * 7, -2, 3, 2.6, face); }
    for (i = -1; i <= 1; i += 2) { /* long shaggy arms raised */
      var a = i < 0 ? aa[0] : aa[1], h = arm(c, i * 25, -55, i, a, 27, 12, fur, face, 6.5);
      var mx = (i * 25 + h[0]) / 2, my = (-55 + h[1]) / 2; Pg(c, [[mx - 4, my + 2], [mx, my + 11], [mx + 4, my + 2]], fur);
    }
    c.beginPath(); c.moveTo(0, -92 + m.k * 3); /* shaggy body with a zigzag hem */
    c.bezierCurveTo(34, -92, 38, -40, 35, -12); c.lineTo(28, -5); c.lineTo(22, -12); c.lineTo(15, -4); c.lineTo(8, -12); c.lineTo(0, -4); c.lineTo(-8, -12); c.lineTo(-15, -4); c.lineTo(-22, -12); c.lineTo(-28, -5); c.lineTo(-35, -12);
    c.bezierCurveTo(-38, -40, -34, -92, 0, -92 + m.k * 3); c.closePath(); F(c, sh);
    c.beginPath(); c.ellipse(-2, -50, 30, 36, 0, 0, TAU); c.fillStyle = fur; c.fill();
    c.lineWidth = 1.3; c.strokeStyle = sh; for (i = 0; i < 6; i++) { var fx = [-18, -6, 8, 19, -12, 4][i], fy = [-36, -30, -34, -40, -20, -22][i]; c.beginPath(); c.moveTo(fx - 3, fy); c.lineTo(fx, fy + 4); c.lineTo(fx + 3, fy); c.stroke(); }
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(hx + i * 15, hy - 14); c.quadraticCurveTo(hx + i * 25, hy - 20, hx + i * 23, hy - 30); c.quadraticCurveTo(hx + i * 17, hy - 24, hx + i * 9, hy - 19); c.closePath(); F(c, '#f3dfb8'); } /* little horns */
    E(c, hx, hy + 2, 19, 16, face);
    eyes(c, hx, hy - 3, 8, 2.6, m); blush(c, hx, hy + 3, 14, 3, 'rgba(240,120,150,0.5)');
    L(c, hx - 11.5, hy - 9, hx - 5, hy - 8, 1.8, fur); L(c, hx + 11.5, hy - 9, hx + 5, hy - 8, 1.8, fur);
    dot(c, hx, hy + 1.5, 2, shade(face, -0.35));
    var mo = 0.35 + (m.open > 0.12 ? m.open * 0.65 : m.k * 0.3); /* big friendly grin, one tooth */
    c.beginPath(); c.moveTo(hx - 10, hy + 6); c.quadraticCurveTo(hx, hy + 6 + mo * 14, hx + 10, hy + 6); c.quadraticCurveTo(hx, hy + 8.5, hx - 10, hy + 6); c.closePath(); c.fillStyle = '#4a2440'; c.fill();
    Rn(c, hx + 2.5, hy + 6.8, 3.6, 3.4, 0.8, '#fff');
    scarf(c, 0, -47, 24, p.accent, m, 1, p.gold);
  };

  //@@CHARS

  function character(name, ctx, x, y, h, pose, pal) {
    var f = CH[name]; if (!f || !ctx || !(h > 0)) return;
    pose = pose || {};
    var p = P(pal), beat = frac(num(pose.beat, 0)), e = clamp(num(pose.energy, 0.7), 0, 1), mood = pose.mood || 'dance';
    var n = Math.floor(num(pose.n, 0)), side = (n & 1) ? -1 : 1, t = num(pose.t, 0);
    var amp = mood === 'idle' ? 0.3 : mood === 'wave' ? 0.6 : 1;
    var k = Math.exp(-6 * beat) * e * amp;
    var m = {
      k: k, e: e, t: t, n: n, mood: mood, wave: mood === 'wave', v: ((Math.floor(num(pose.variant, 0)) % 4) + 4) % 4,
      sw: side * (1 - 2 * Math.exp(-5 * beat)) * (0.25 + 0.75 * e) * amp + Math.sin(t * 1.7) * 0.06,
      open: mood === 'sing' ? 0.3 + 0.7 * Math.exp(-3 * beat) * (0.4 + 0.6 * e) : 0, ph: (hash(name) % 97) / 97, calm: false
    };
    var s = h / 100, sow = ow;
    ctx.save();
    ctx.translate(x, y); ctx.scale(pose.flip ? -s : s, s);
    /* THE MOVE, on the beat: a crouch just before it (anticipation), the hit (squash, then a stretch and a hop that lands
       before the next crouch), a lean that changes side every beat, and an accent on every 4th beat that is this mood's
       own (dance: a bigger jump with a twist; sing: up on the toes, leaning back into the note; wave: a deep bow of the
       whole body). Each character is a little out of step with the others (ph), so a cast never moves as one block. */
    var acc = ((n % 4) + 4) % 4 === 3 ? 1 : 0, a = e * amp, late = clamp(beat - m.ph * 0.05, 0, 1);
    var ant = late > 0.8 ? Math.sin((late - 0.8) / 0.2 * Math.PI / 2) : 0;                        /* 0..1 as the next beat comes */
    var air = late < 0.5 ? Math.sin(late / 0.5 * Math.PI) : 0;                                   /* 0..1..0: off the ground */
    var hopH = (mood === 'dance' ? 3 + 2 * acc : mood === 'sing' ? 1.1 + 2.4 * acc : mood === 'wave' ? 1.4 : 0.4) * a;
    var lean = mood === 'dance' ? m.sw * (0.05 + 0.05 * acc) + side * acc * 0.1 * Math.exp(-4 * beat) * a
      : mood === 'sing' ? Math.sin((n + beat) * Math.PI / 2 + m.ph * 3) * 0.045 * a - acc * 0.05 * air * a
      : mood === 'wave' ? m.sw * 0.035 + acc * 0.09 * Math.sin(beat * Math.PI) * a : m.sw * 0.02;
    ctx.translate(mood === 'dance' ? side * (1 - Math.exp(-5 * beat)) * 1.6 * a : 0, -hopH * air);
    ctx.rotate(lean);
    ctx.scale(1 + 0.055 * k + 0.035 * ant * a - 0.03 * air * a, 1 - 0.075 * k - 0.05 * ant * a + 0.045 * air * a + Math.sin(t * 2.3 + m.ph * 6) * 0.008 - 0.008);
    ow = 1.1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    try { f(ctx, m, p); } finally { ow = sow; ctx.restore(); }
  }
  CarolArt.rnd = rnd;
  CarolArt.character = character;
  CarolArt.characters = ['snowman', 'elf', 'reindeer', 'santa', 'mrsclaus', 'gingerbread', 'penguin', 'cat', 'dog', 'polarbear', 'owl', 'mouse', 'nutcracker', 'angel', 'fawn', 'robot', 'caroler', 'officemate', 'shepherd', 'yeti'];

  /* ---------- shared pieces ---------- */
  var WOOD = '#8a5a34', WOOD2 = '#a9703f', PINE = '#2f7d55';
  function pine(c, x, y, h, col, snow, n) { /* base centre at (x,y) */
    n = n || 3; var w = h * 0.62, th = h * 0.88 * (n === 1 ? 1 : 0.5), step = n === 1 ? 0 : (h * 0.88 - th) / (n - 1), i;
    Rn(c, x - h * 0.05, y - h * 0.14, h * 0.1, h * 0.14, 0, snow ? '#7a5230' : shade(col, -0.3));
    for (i = 0; i < n; i++) {
      var yb = y - h * 0.12 - i * step, yt = yb - th, wi = w * (1 - i * 0.6 / n) / 2;
      c.beginPath(); c.moveTo(x, yt); c.lineTo(x + wi, yb); c.quadraticCurveTo(x + wi * 0.5, yb + th * 0.1, x, yb); c.quadraticCurveTo(x - wi * 0.5, yb + th * 0.1, x - wi, yb); c.closePath(); F(c, i % 2 ? shade(col, 0.08) : col);
      if (snow) for (var s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(x + s * wi, yb); c.lineTo(x + s * wi * 0.5, yt + th * 0.5); c.quadraticCurveTo(x + s * wi * 0.5, yt + th * 0.72, x + s * wi * 0.66, yt + th * 0.78); c.quadraticCurveTo(x + s * wi * 0.7, yt + th * 0.95, x + s * wi, yb); c.closePath(); c.fillStyle = snow; c.fill(); }
      if (snow && i === n - 1) { c.beginPath(); c.moveTo(x, yt); c.lineTo(x + wi * 0.5, yt + th * 0.5); c.quadraticCurveTo(x + wi * 0.3, yt + th * 0.36, x + wi * 0.12, yt + th * 0.48); c.quadraticCurveTo(x, yt + th * 0.34, x - wi * 0.15, yt + th * 0.47); c.quadraticCurveTo(x - wi * 0.3, yt + th * 0.36, x - wi * 0.5, yt + th * 0.5); c.closePath(); c.fillStyle = snow; c.fill(); }
    }
  }
  function flame(c, x, y, w, h, t, ph) {
    var wob = Math.sin(t * 9 + ph) * w * 0.14, hh = h * (1 + Math.sin(t * 13 + ph * 2) * 0.09), k;
    for (k = 0; k < 2; k++) {
      var ww = k ? w * 0.5 : w, h2 = k ? hh * 0.58 : hh, wb = k ? wob * 0.5 : wob;
      c.beginPath(); c.moveTo(x - ww / 2, y); c.bezierCurveTo(x - ww * 0.75, y - h2 * 0.5, x - ww * 0.1 + wb, y - h2 * 0.6, x + wb, y - h2);
      c.bezierCurveTo(x + ww * 0.2 + wb, y - h2 * 0.6, x + ww * 0.75, y - h2 * 0.5, x + ww / 2, y); c.quadraticCurveTo(x, y + ww * 0.3, x - ww / 2, y); c.closePath(); c.fillStyle = k ? '#ffe27a' : '#ff8a1f'; c.fill();
    }
  }
  function bow(c, x, y, w, col) {
    var i, d = shade(col, -0.2);
    for (i = -1; i <= 1; i += 2) { Pg(c, [[x, y], [x + i * w * 0.28, y + w * 0.62], [x + i * w * 0.05, y + w * 0.5]], d); }
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + i * w * 0.2, y - w * 0.45, x + i * w * 0.62, y - w * 0.35, x + i * w * 0.5, y); c.bezierCurveTo(x + i * w * 0.62, y + w * 0.3, x + i * w * 0.2, y + w * 0.3, x, y); c.closePath(); F(c, col); }
    E(c, x, y, w * 0.12, w * 0.13, d);
  }
  function hollyLeaf(c, x, y, len, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot); var w = len * 0.26, i;
    c.beginPath(); c.moveTo(0, 0);
    for (i = 0; i < 3; i++) c.quadraticCurveTo(len * (i + 0.5) / 3, w * 0.35, len * (i + 1) / 3, i === 2 ? 0 : w);
    for (i = 2; i >= 0; i--) c.quadraticCurveTo(len * (i + 0.5) / 3, -w * 0.35, len * i / 3, i === 0 ? 0 : -w);
    c.closePath(); F(c, col); L(c, len * 0.08, 0, len * 0.86, 0, Math.max(0.3, len * 0.03), shade(col, 0.25)); c.restore();
  }
  function hollySprig(c, x, y, s, rot, p) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    hollyLeaf(c, 0, 0, s * 0.55, -2.5, shade(p.accent2, -0.1)); hollyLeaf(c, 0, 0, s * 0.55, -0.64, p.accent2); hollyLeaf(c, 0, 0, s * 0.5, 0.95, shade(p.accent2, -0.05));
    E(c, -s * 0.06, s * 0.02, s * 0.085, s * 0.085, p.accent); E(c, s * 0.07, -s * 0.05, s * 0.085, s * 0.085, p.accent); E(c, s * 0.04, s * 0.09, s * 0.085, s * 0.085, shade(p.accent, -0.12));
    dot(c, -s * 0.08, 0, s * 0.025, 'rgba(255,255,255,0.75)'); dot(c, s * 0.05, -s * 0.07, s * 0.025, 'rgba(255,255,255,0.75)'); c.restore();
  }
  function wreathRing(c, x, y, r, th, p, t, seed) { /* evergreen ring: outer radius r, band th */
    var n = Math.max(14, Math.round(r * TAU / (th * 0.62))), i, R0 = rnd(seed || 7), sw = ow; ow = 0;
    for (i = 0; i < n; i++) { var a = i / n * TAU, rr = r - th / 2; E(c, x + Math.cos(a) * rr, y + Math.sin(a) * rr, th * 0.62, th * 0.5, i % 2 ? shade(p.accent2, -0.22) : shade(p.accent2, -0.1), a + 0.8); }
    for (i = 0; i < n; i++) { var a2 = (i + 0.5) / n * TAU, r2 = r - th / 2 + (R0() - 0.5) * th * 0.3; E(c, x + Math.cos(a2) * r2, y + Math.sin(a2) * r2, th * 0.4, th * 0.2, i % 3 ? p.accent2 : shade(p.accent2, 0.22), a2 + 2.2); }
    for (i = 0; i < n; i += 2) { var a3 = (i + 0.2) / n * TAU, r3 = r - th / 2 + (R0() - 0.5) * th * 0.5, tw = 0.75 + 0.25 * Math.sin(t * 3 + i); dot(c, x + Math.cos(a3) * r3, y + Math.sin(a3) * r3, th * 0.15, i % 4 ? p.accent : p.gold); dot(c, x + Math.cos(a3) * r3 - th * 0.05, y + Math.sin(a3) * r3 - th * 0.05, th * 0.05 * tw, 'rgba(255,255,255,0.8)'); }
    ow = sw;
  }
  function wheel(c, x, y, r, hub) { E(c, x, y, r, r, '#2a2a30'); dot(c, x, y, r * 0.62, '#f3ece0'); dot(c, x, y, r * 0.42, hub); dot(c, x, y, r * 0.14, '#f3ece0'); }
  function steam(c, x, y, h, t, n) {
    c.lineCap = 'round'; c.lineWidth = h * 0.09; c.strokeStyle = 'rgba(255,255,255,0.65)';
    for (var i = 0; i < (n || 2); i++) { var ox = (i - ((n || 2) - 1) / 2) * h * 0.4, w = Math.sin(t * 2.4 + i * 1.7) * h * 0.14; c.beginPath(); c.moveTo(x + ox, y); c.bezierCurveTo(x + ox + h * 0.25 + w, y - h * 0.33, x + ox - h * 0.25 + w, y - h * 0.66, x + ox + w, y - h); c.stroke(); }
  }
  function giftBox(c, x, y, w, h, col, rib) { /* base centre at x,y */
    R(c, x - w / 2, y - h * 0.78, w, h * 0.78, w * 0.06, col); Rn(c, x - w * 0.08, y - h * 0.78, w * 0.16, h * 0.78, 0, rib);
    R(c, x - w * 0.56, y - h, w * 1.12, h * 0.26, w * 0.05, shade(col, 0.12)); Rn(c, x - w * 0.09, y - h, w * 0.18, h * 0.26, 0, rib);
    bow(c, x, y - h, w * 0.6, rib);
  }
  function cloud(c, x, y, w, col) { var sw = ow; ow = 0; E(c, x - w * 0.25, y, w * 0.25, w * 0.17, col); E(c, x + w * 0.22, y + w * 0.02, w * 0.28, w * 0.16, col); E(c, x, y - w * 0.09, w * 0.24, w * 0.2, col); Rn(c, x - w * 0.42, y, w * 0.86, w * 0.17, w * 0.085, col); ow = sw; }

  /* ---------- props (drawn in a 100-unit box centred at 0,0) ---------- */
  var PR = {};
  var BULBS = ['#ff5a5f', '#ffd166', '#5ad1a0', '#58b4ff', '#ff8ad0'];

  PR.tree = function (c, t, p, o) {
    var i, col = PINE, k = Math.exp(-5 * o.beat);
    E(c, 0, 44, 30, 4.5, alpha(p.snow, 0.9)); R(c, -9, 32, 18, 12, 2, p.accent); Rn(c, -10.5, 31, 21, 3.6, 1.5, shade(p.accent, 0.2));
    pine(c, 0, 38, 82, col, null, 4);
    var gy = [18, 3, -11, -24], gw = [22, 17.5, 12.5, 7.5];
    for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-gw[i], gy[i] - 4); c.quadraticCurveTo(0, gy[i] + 7, gw[i], gy[i] - 4); c.lineWidth = 1.5; c.strokeStyle = p.gold; c.stroke(); }
    var b = [[-16, 22], [-4, 25], [10, 22], [19, 14], [-11, 7], [3, 10], [13, 4], [-7, -7], [6, -5], [-3, -19], [5, -21], [0, -31]];
    for (i = 0; i < b.length; i++) { var on = 0.55 + 0.45 * Math.sin(t * 4 + i * 2.1); if (on > 0.8) dot(c, b[i][0], b[i][1], 4.2, alpha(BULBS[i % 5], 0.3)); E(c, b[i][0], b[i][1], 2.5, 2.5, BULBS[i % 5]); dot(c, b[i][0] - 0.8, b[i][1] - 0.8, 0.8, 'rgba(255,255,255,0.8)'); }
    dot(c, 0, -44, 9 + k * 3, alpha(p.gold, 0.28)); starPath(c, 0, -44, 7 + k, 3.2, 5, Math.sin(t * 2) * 0.1); F(c, p.gold);
  };

  PR.truck = function (c, t, p, o) {
    var red = p.accent, by = Math.sin(t * 8) * 0.5, i;
    E(c, 0, 33, 46, 3.5, 'rgba(0,0,0,0.15)');
    c.save(); c.translate(0, by);
    c.save(); c.translate(-9, 2); c.rotate(-PI / 2 - 0.1); pine(c, 0, 0, 42, PINE, alpha(p.snow, 0.9), 3); c.restore(); /* the tree in the bed */
    L(c, -30, -4, -8, 3, 0.8, p.gold); L(c, -18, -8, -14, 5, 0.8, p.gold);
    R(c, -44, 4, 46, 17, 3, red); for (i = 0; i < 3; i++) L(c, -41, 8.5 + i * 4, -1, 8.5 + i * 4, 0.7, shade(red, -0.25));
    c.beginPath(); c.moveTo(0, 21); c.lineTo(0, -14); c.quadraticCurveTo(0, -19, 5, -19); c.lineTo(17, -19); c.quadraticCurveTo(22, -19, 25, -8); c.lineTo(40, -5); c.quadraticCurveTo(46, -3, 46, 4); c.lineTo(46, 21); c.closePath(); F(c, red);
    c.beginPath(); c.moveTo(4, -5); c.lineTo(4, -13); c.quadraticCurveTo(4, -15.5, 7, -15.5); c.lineTo(15, -15.5); c.quadraticCurveTo(18, -15.5, 20.5, -5); c.closePath(); F(c, '#bfe3f2'); L(c, 8, -13, 13, -7, 1.2, 'rgba(255,255,255,0.7)');
    Rn(c, 2, -21.5, 21, 3.4, 1.7, p.snow); L(c, 6, 3, 10, 3, 1.2, p.snow);
    R(c, -46, 17, 94, 4.5, 2.2, '#e9e3d6'); E(c, 43.5, 6, 2.6, 3.4, '#ffe9a0'); dot(c, 43.5, 6, 6, 'rgba(255,233,160,0.25)');
    c.beginPath(); c.arc(28, 10, 6, 0, TAU); c.strokeStyle = PINE; c.lineWidth = 2.2; c.stroke(); dot(c, 28, 15.5, 1.3, p.gold); /* little wreath on the door */
    c.restore();
    wheel(c, -26, 24, 9.5, red); wheel(c, 28, 24, 9.5, red);
  };

  PR.fireplace = function (c, t, p, o) {
    var br = '#b85c44', i, j;
    R(c, -40, -22, 80, 66, 2, br);
    c.strokeStyle = shade(br, -0.22); c.lineWidth = 0.7; c.beginPath();
    for (j = 0; j < 8; j++) { c.moveTo(-40, -14 + j * 8); c.lineTo(40, -14 + j * 8); for (i = 0; i < 6; i++) { var bx = -40 + i * 16 + (j % 2 ? 8 : 0); if (bx >= 40) continue; c.moveTo(bx, -22 + j * 8); c.lineTo(bx, -14 + j * 8); } } c.stroke();
    c.beginPath(); c.moveTo(-22, 44); c.lineTo(-22, 6); c.quadraticCurveTo(-22, -10, 0, -10); c.quadraticCurveTo(22, -10, 22, 6); c.lineTo(22, 44); c.closePath(); F(c, '#2b1a18');
    dot(c, 0, 34, 20, 'rgba(255,150,40,0.22)');
    flame(c, -8, 40, 12, 22, t, 1); flame(c, 8, 40, 12, 20, t, 3.1); flame(c, 0, 41, 16, 30, t, 5.2);
    c.save(); c.translate(0, 41); c.rotate(0.12); R(c, -16, -3, 32, 6, 3, WOOD); c.restore(); c.save(); c.translate(0, 41); c.rotate(-0.14); R(c, -15, -2.5, 30, 6, 3, WOOD2); c.restore();
    R(c, -46, 40, 92, 6, 2, shade(br, -0.3));
    R(c, -47, -30, 94, 9, 2.5, WOOD2); Rn(c, -47, -30, 94, 2.6, 1.2, shade(WOOD2, 0.25));
    c.beginPath(); c.moveTo(-44, -30); for (i = 0; i < 4; i++) c.quadraticCurveTo(-33 + i * 22, -22, -22 + i * 22, -30); c.lineWidth = 4; c.strokeStyle = PINE; c.stroke();
    for (i = 0; i < 9; i++) dot(c, -40 + i * 10, -27.6 + (i % 2) * 2.2, 1.5, i % 2 ? p.gold : p.accent);
    for (i = -1; i <= 1; i++) { c.save(); c.translate(i * 26, -21); c.rotate(Math.sin(t * 2 + i) * 0.06); c.scale(0.3, 0.3); c.translate(4, 26); ow = 3; PR.stocking(c, t, p, { beat: 0, col: [p.accent, p.accent2, p.gold][i + 1], plain: true }); ow = 1.2; c.restore(); }
    for (i = -1; i <= 1; i += 2) { R(c, i * 36 - 2, -42, 4, 12, 1, p.paper); flame(c, i * 36, -42, 3.6, 7, t, i); }
  };

  PR.snowglobe = function (c, t, p, o) {
    var i, R0 = rnd(11);
    c.beginPath(); c.moveTo(-26, 22); c.lineTo(26, 22); c.lineTo(32, 42); c.quadraticCurveTo(0, 48, -32, 42); c.closePath(); F(c, p.accent);
    R(c, -29, 20, 58, 6, 3, p.gold); R(c, -14, 30, 28, 8, 2, p.gold);
    E(c, 0, -8, 36, 36, '#cfeaf7');
    c.save(); c.beginPath(); c.arc(0, -8, 35, 0, TAU); c.clip(); var sw = ow; ow = 0;
    c.fillStyle = '#9fd3ee'; c.fillRect(-40, -50, 80, 90); E(c, 0, 34, 46, 18, p.snow);
    pine(c, -11, 20, 34, PINE, p.snow, 3); pine(c, 14, 19, 22, shade(PINE, -0.12), p.snow, 3);
    R(c, 2, 10, 13, 9, 1, p.accent); Pg(c, [[0, 11], [8.5, 3], [17, 11]], p.snow, true); Rn(c, 6.5, 13.5, 3.6, 5.5, 0.5, '#ffe08a');
    for (i = 0; i < 26; i++) { var a = R0() * TAU, rr = Math.sqrt(R0()) * 33, fx = Math.cos(a) * rr + Math.sin(t * 1.3 + i) * 3, fy = -8 + ((Math.sin(a) * rr + 33 + t * (6 + R0() * 6)) % 66) - 33; dot(c, fx, fy, 0.7 + R0() * 0.9, '#fff'); }
    ow = sw; c.restore();
    c.beginPath(); c.arc(0, -8, 30, PI * 1.08, PI * 1.42); c.lineWidth = 3; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke(); dot(c, -19, -30, 1.6, 'rgba(255,255,255,0.8)');
  };

  PR.present = function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat);
    E(c, 0, 40, 36, 4, 'rgba(0,0,0,0.14)');
    c.save(); c.rotate(Math.sin(t * 2.2) * 0.03); c.translate(0, 40); c.scale(1 + k * 0.04, 1 - k * 0.05);
    giftBox(c, 0, 0, 60, 62, o.col || p.accent, p.gold);
    for (var i = -1; i <= 1; i += 2) { dot(c, i * 18, -18, 2, alpha(p.snow, 0.55)); dot(c, i * 21, -34, 2, alpha(p.snow, 0.55)); dot(c, i * 14, -32 + 22, 2, alpha(p.snow, 0.55)); }
    c.restore();
  };

  PR.wreath = function (c, t, p, o) {
    c.save(); c.rotate(Math.sin(t * 1.5) * 0.03);
    wreathRing(c, 0, 0, 42, 20, p, t, 5);
    bow(c, 0, 30, 30, p.accent); c.restore();
  };

  PR.bell = function (c, t, p, o) {
    var k = Math.exp(-4 * o.beat), sw = Math.sin(t * 5) * 0.16 * (0.5 + k);
    c.save(); c.translate(0, -34); c.rotate(sw);
    c.save(); c.rotate(-sw * 2.2); L(c, 0, 50, 0, 62, 2, shade(p.gold, -0.3)); E(c, 0, 66, 6, 6, shade(p.gold, -0.18)); c.restore();
    c.beginPath(); c.moveTo(0, -2); c.bezierCurveTo(18, -2, 20, 22, 24, 44); c.quadraticCurveTo(26, 52, 36, 58); c.lineTo(-36, 58); c.quadraticCurveTo(-26, 52, -24, 44); c.bezierCurveTo(-20, 22, -18, -2, 0, -2); c.closePath(); F(c, p.gold);
    R(c, -38, 56, 76, 7, 3.5, shade(p.gold, -0.12)); L(c, -22, 40, 22, 40, 1.4, shade(p.gold, -0.22));
    c.beginPath(); c.moveTo(-9, 6); c.quadraticCurveTo(-14, 22, -16, 38); c.lineWidth = 3.2; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.6)'; c.stroke();
    c.restore();
    hollySprig(c, 0, -36, 34, 0, p);
  };

  PR.stocking = function (c, t, p, o) {
    var col = o.col || p.accent, k = Math.exp(-5 * o.beat || 0);
    c.save(); if (!o.plain) c.rotate(Math.sin(t * 1.8) * 0.05);
    if (!o.plain) { L(c, 0, -20, -4, -42, 5, p.snow); c.beginPath(); c.arc(1.5, -41, 5.5, PI, -0.2); c.lineWidth = 5; c.strokeStyle = p.snow; c.stroke(); for (var i = 0; i < 4; i++) L(c, -2.2 - i * 0.9, -24 - i * 5, 1.2 - i * 0.9, -25.6 - i * 5, 2, p.accent); starPath(c, -15, -30 - k * 2, 6, 2.6, 5, 0.2); F(c, p.gold); }
    c.beginPath(); c.moveTo(-20, -24); c.lineTo(8, -24); c.lineTo(8, 14); c.quadraticCurveTo(8, 22, 20, 24); c.quadraticCurveTo(34, 27, 33, 37); c.quadraticCurveTo(32, 45, 18, 45); c.lineTo(-2, 45); c.quadraticCurveTo(-20, 45, -20, 28); c.closePath(); F(c, col);
    c.beginPath(); c.moveTo(-20, 30); c.quadraticCurveTo(-8, 30, -5, 45); c.lineTo(-2, 45); c.quadraticCurveTo(-20, 45, -20, 28); c.closePath(); c.fillStyle = shade(col, -0.22); c.fill();
    c.beginPath(); c.moveTo(22, 25); c.quadraticCurveTo(34, 27, 33, 37); c.quadraticCurveTo(32, 45, 20, 45); c.quadraticCurveTo(26, 36, 22, 25); c.closePath(); c.fillStyle = shade(col, -0.22); c.fill();
    L(c, -17, -2, 5, -2, 2.4, alpha(p.snow, 0.7)); L(c, -17, 6, 5, 6, 2.4, alpha(p.snow, 0.7));
    R(c, -24, -30, 36, 13, 5, p.snow);
    c.restore();
  };

  PR.ornament = function (c, t, p, o) {
    var col = o.col || p.accent, sw = Math.sin(t * 1.7) * 0.07;
    c.save(); c.translate(0, -46); c.rotate(sw); c.translate(0, 46);
    c.beginPath(); c.arc(0, -40, 5, PI, 0); c.lineWidth = 1.6; c.strokeStyle = p.gold; c.stroke();
    R(c, -7, -36, 14, 9, 2, p.gold);
    ball(c, 0, 6, 36, 36, col);
    c.save(); c.beginPath(); c.arc(0, 6, 35, 0, TAU); c.clip();
    c.fillStyle = p.snow; c.fillRect(-40, -4, 80, 3); c.fillRect(-40, 14, 80, 3);
    c.beginPath(); for (var i = -5; i <= 5; i++) c.lineTo(i * 8, 6.5 + (i % 2 ? 4.5 : -4.5)); c.lineWidth = 2.4; c.strokeStyle = p.gold; c.stroke(); c.restore();
    shine(c, -14, -12, 9); dot(c, -22, -1, 2, 'rgba(255,255,255,0.7)');
    c.restore();
  };

  PR.candycane = function (c, t, p, o) {
    c.save(); c.rotate(0.2 + Math.sin(t * 2) * 0.04);
    function path() { c.beginPath(); c.moveTo(-10, 44); c.lineTo(-10, -22); c.arc(8, -22, 18, PI, 0); c.lineTo(26, -14); }
    c.lineCap = 'round'; path(); c.lineWidth = 15.5; c.strokeStyle = shade(p.snow, -0.3); c.stroke(); c.lineWidth = 13; c.strokeStyle = p.snow; c.stroke();
    c.save(); path(); c.lineWidth = 13; c.lineCap = 'butt'; c.setLineDash([7, 9]); c.lineDashOffset = 3; c.strokeStyle = p.accent; c.stroke(); c.setLineDash([]); c.restore();
    c.beginPath(); c.moveTo(-13.5, 40); c.lineTo(-13.5, -20); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
    bow(c, -10, 8, 22, p.accent2); c.restore();
  };

  PR.holly = function (c, t, p, o) { c.save(); c.rotate(Math.sin(t * 1.6) * 0.04); hollySprig(c, 0, 4, 84, 0, p); c.restore(); };

  PR.mistletoe = function (c, t, p, o) {
    var g = '#7fb069', i; c.save(); c.translate(0, -44); c.rotate(Math.sin(t * 1.5) * 0.08);
    var st = [[0, 8, -16, 54], [0, 8, 16, 56], [0, 8, 0, 74], [-6, 30, -28, 62], [6, 30, 28, 66]];
    for (i = 0; i < st.length; i++) L(c, st[i][0], st[i][1], st[i][2], st[i][3], 1.8, shade(g, -0.25));
    var lv = [[-16, 54, 2.0], [-22, 46, 2.9], [16, 56, 1.1], [23, 48, 0.3], [0, 74, 1.9], [0, 74, 1.2], [-28, 62, 2.4], [-28, 62, 1.5], [28, 66, 1.7], [28, 66, 0.7], [-6, 30, 3.3], [6, 30, -0.2]];
    for (i = 0; i < lv.length; i++) { c.save(); c.translate(lv[i][0], lv[i][1]); c.rotate(lv[i][2]); E(c, 9, 0, 10, 4.2, i % 2 ? g : shade(g, -0.1)); c.restore(); }
    var bs = [[-3, 46], [4, 50], [0, 40], [-18, 58], [18, 60]]; for (i = 0; i < bs.length; i++) { E(c, bs[i][0], bs[i][1], 3.6, 3.6, p.snow); dot(c, bs[i][0] - 1, bs[i][1] - 1, 1, '#fff'); }
    L(c, 0, -4, 0, 8, 2, p.accent); bow(c, 0, 10, 26, p.accent); c.restore();
  };

  PR.sleigh = function (c, t, p, o) {
    var red = p.accent, i; c.save(); c.translate(0, Math.sin(t * 2.5) * 1.2); c.rotate(Math.sin(t * 2.5 + 1) * 0.02);
    c.beginPath(); c.moveTo(-40, 36); c.lineTo(30, 36); c.bezierCurveTo(46, 36, 48, 20, 38, 18); c.lineCap = 'round'; c.lineWidth = 4.6; c.strokeStyle = shade(p.gold, -0.34); c.stroke(); c.lineWidth = 3; c.strokeStyle = p.gold; c.stroke();
    L(c, -24, 36, -22, 22, 2.6, p.gold); L(c, 18, 36, 16, 22, 2.6, p.gold);
    E(c, -18, -12, 15, 17, '#9b6b43'); L(c, -18, -30, -14, -24, 1.6, p.gold); /* sack and gifts */
    giftBox(c, 2, -2, 16, 18, p.accent2, p.gold); giftBox(c, -4, -8, 12, 14, p.gold, p.accent);
    c.beginPath(); c.moveTo(-44, -22); c.bezierCurveTo(-48, -2, -44, 24, -30, 25); c.lineTo(22, 25); c.bezierCurveTo(40, 25, 46, 6, 44, -8); c.bezierCurveTo(42, -16, 32, -14, 33, -6); c.bezierCurveTo(30, 2, 22, 2, 14, 2); c.lineTo(-18, 2); c.bezierCurveTo(-28, 2, -30, -12, -34, -24); c.bezierCurveTo(-37, -30, -44, -28, -44, -22); c.closePath(); F(c, red);
    c.beginPath(); c.moveTo(-36, 12); c.quadraticCurveTo(-10, 20, 24, 14); c.lineWidth = 1.6; c.strokeStyle = p.gold; c.stroke();
    c.beginPath(); c.arc(-8, 13, 4, 0, PI * 1.5); c.stroke(); twinkle(c, 12, 10, 3.5, p.gold);
    c.beginPath(); c.arc(38.5, -8, 3, 0, TAU); c.fillStyle = p.gold; c.fill();
    c.restore();
  };

  PR.star = function (c, t, p, o) {
    var k = Math.exp(-4 * o.beat), pu = 1 + Math.sin(t * 3) * 0.05 + k * 0.08, i;
    var g = c.createRadialGradient(0, -8, 2, 0, -8, 46); g.addColorStop(0, alpha(p.gold, 0.55)); g.addColorStop(1, alpha(p.gold, 0)); c.fillStyle = g; c.fillRect(-50, -54, 100, 100);
    c.save(); c.translate(0, -8);
    for (i = 0; i < 8; i++) { var a = i * PI / 4 + PI / 8, l = (i % 2 ? 26 : 32) * pu; L(c, Math.cos(a) * 15, Math.sin(a) * 15, Math.cos(a) * l, Math.sin(a) * l, 1.2, alpha(p.gold, 0.7)); }
    c.beginPath(); c.moveTo(0, -40 * pu); c.quadraticCurveTo(2.5, -3, 36 * pu, 0); c.quadraticCurveTo(2.5, 3, 0, 56 * pu); c.quadraticCurveTo(-2.5, 3, -36 * pu, 0); c.quadraticCurveTo(-2.5, -3, 0, -40 * pu); c.closePath(); c.fillStyle = shade(p.gold, 0.45); c.fill();
    starPath(c, 0, 0, 17 * pu, 7.5 * pu, 5, Math.sin(t) * 0.06); F(c, p.gold); dot(c, -2, -2, 3.2, 'rgba(255,255,255,0.8)');
    c.restore();
  };

  PR.candle = function (c, t, p, o) {
    var i; dot(c, 0, -26, 22 + Math.sin(t * 7) * 1.5, 'rgba(255,214,110,0.22)');
    E(c, 0, 40, 26, 6, p.gold); E(c, 0, 37.5, 17, 3.6, shade(p.gold, -0.15)); c.beginPath(); c.arc(27, 38, 6, -PI * 0.6, PI * 0.9); c.lineWidth = 2.4; c.strokeStyle = shade(p.gold, -0.1); c.stroke();
    R(c, -10, -12, 20, 50, 3, p.paper);
    c.beginPath(); c.moveTo(-10, -9); c.lineTo(-10, -12); c.quadraticCurveTo(0, -16, 10, -12); c.lineTo(10, 2); c.quadraticCurveTo(8, 8, 6, 0); c.quadraticCurveTo(3, -6, 0, 4); c.quadraticCurveTo(-2, 12, -5, 2); c.quadraticCurveTo(-8, -6, -10, -4); c.closePath(); c.fillStyle = shade(p.paper, -0.1); c.fill();
    L(c, 0, -13, 0, -18, 1.2, p.ink); flame(c, 0, -17, 11, 24, t, 0.5);
    hollySprig(c, -8, 33, 26, -0.3, p);
  };

  PR.lantern = function (c, t, p, o) {
    var mt = '#3d3a44', i; dot(c, 0, 6, 34 + Math.sin(t * 6) * 1.5, 'rgba(255,205,100,0.2)');
    c.beginPath(); c.arc(0, -34, 9, PI, 0); c.lineWidth = 2.4; c.strokeStyle = mt; c.stroke();
    Pg(c, [[-18, -22], [0, -34], [18, -22]], mt); Rn(c, -19, -23.5, 38, 4, 2, p.snow);
    R(c, -16, -20, 32, 52, 2, '#ffe9a8'); flame(c, 0, 26, 9, 18, t, 2); R(c, -4, 24, 8, 8, 1, p.paper);
    c.lineWidth = 2.6; c.strokeStyle = mt; c.strokeRect(-16, -20, 32, 52); L(c, 0, -20, 0, 8, 1.6, mt); L(c, -16, 8, 16, 8, 1.6, mt);
    R(c, -20, 32, 40, 7, 2, mt); Rn(c, -17, 30.5, 34, 3, 1.5, p.snow);
    hollySprig(c, 0, -22, 22, 0, p);
  };

  PR.mailbox = function (c, t, p, o) {
    var bl = '#3f6fb0', i;
    E(c, 2, 43, 28, 6, p.snow); R(c, -4, 4, 8, 38, 1, WOOD);
    c.beginPath(); c.moveTo(-30, 8); c.lineTo(-30, -14); c.quadraticCurveTo(-30, -30, -14, -30); c.lineTo(18, -30); c.quadraticCurveTo(34, -30, 34, -14); c.lineTo(34, 8); c.closePath(); F(c, bl);
    c.beginPath(); c.moveTo(-30, 8); c.lineTo(-30, -14); c.quadraticCurveTo(-30, -30, -14, -30); c.quadraticCurveTo(2, -30, 2, -14); c.lineTo(2, 8); c.closePath(); F(c, shade(bl, 0.14));
    dot(c, -14, -8, 2.4, p.gold); Rn(c, -22, -1, 16, 2.2, 1, shade(bl, -0.2));
    c.beginPath(); c.moveTo(-31, -15); c.quadraticCurveTo(-30, -35, -13, -34); c.lineTo(18, -34); c.quadraticCurveTo(36, -35, 35, -15); c.quadraticCurveTo(30, -26, 18, -26.5); c.lineTo(-13, -26.5); c.quadraticCurveTo(-26, -26, -31, -15); c.closePath(); F(c, p.snow);
    c.save(); c.translate(22, -4); c.rotate(Math.sin(t * 2) * 0.05); R(c, -1.5, -26, 3, 28, 1, shade(p.accent, -0.2)); Pg(c, [[1.5, -26], [15, -22], [1.5, -17]], p.accent); c.restore(); /* flag up */
    c.save(); c.translate(-14, -18); c.rotate(-0.18); R(c, -9, -6, 18, 12, 1, p.paper); L(c, -9, -6, 0, 1, 0.8, shade(p.paper, -0.3)); L(c, 9, -6, 0, 1, 0.8, shade(p.paper, -0.3)); heartPath(c, 0, 1.4, 4.5); c.fillStyle = p.accent; c.fill(); c.restore();
  };

  PR.airplane = function (c, t, p, o) {
    var i, bob = Math.sin(t * 2.2) * 2.5;
    c.setLineDash([2.5, 4]); c.beginPath(); c.moveTo(-46, 26 + bob * 0.3); c.bezierCurveTo(-36, 6, -20, 30, -14, 6 + bob); c.lineWidth = 1.5; c.strokeStyle = alpha(p.snow, 0.85); c.stroke(); c.setLineDash([]);
    for (i = 0; i < 3; i++) { var hx = -44 + i * 13, hy = 32 - i * 9 + Math.sin(t * 3 + i) * 2; heartPath(c, hx, hy, 6 + i * 1.5); c.fillStyle = alpha(p.accent, 0.55 + i * 0.2); c.fill(); }
    c.save(); c.translate(10, bob - 2); c.rotate(-0.16 + Math.sin(t * 2.2 + 1) * 0.03);
    Pg(c, [[-22, -4], [-32, -20], [-22, -20], [-12, -6]], p.accent2); /* tail */
    c.beginPath(); c.moveTo(-28, -2); c.quadraticCurveTo(-20, -12, 6, -12); c.quadraticCurveTo(28, -12, 32, 0); c.quadraticCurveTo(28, 10, 4, 10); c.quadraticCurveTo(-16, 10, -28, -2); c.closePath(); F(c, p.accent);
    Rn(c, -18, 0, 44, 2.6, 1.3, p.snow);
    c.beginPath(); c.moveTo(4, -12); c.quadraticCurveTo(8, -21, 16, -19); c.quadraticCurveTo(21, -17, 21, -11.4); c.closePath(); F(c, '#cdeaf5');
    E(c, 1, 9, 6.5, 16, p.gold, 0.4); /* wing */
    E(c, 33, 0, 2.6, 3.4, p.ink); var pr = Math.abs(Math.sin(t * 30)) * 0.8 + 0.2; c.globalAlpha = 0.55; E(c, 35.5, 0, 1.6, 15 * pr + 3, p.paper); c.globalAlpha = 1;
    heartPath(c, -12, -4.6, 5); c.fillStyle = p.snow; c.fill();
    c.restore();
  };

  function litWindow(c, x, y, w, h, t, ph) { R(c, x, y, w, h, w * 0.12, '#ffdf8a'); Rn(c, x, y, w, h, w * 0.12, 'rgba(255,170,60,' + (0.18 + 0.12 * Math.sin(t * 5 + ph)).toFixed(3) + ')'); L(c, x + w / 2, y, x + w / 2, y + h, 0.9, '#7a5230'); L(c, x, y + h / 2, x + w, y + h / 2, 0.9, '#7a5230'); }
  function smoke(c, x, y, s, t) { for (var i = 0; i < 3; i++) { var f = frac(t * 0.25 + i / 3); dot(c, x + Math.sin(f * 5 + i) * s * 0.3 + f * s * 0.5, y - f * s * 2.2, s * (0.3 + f * 0.5), 'rgba(255,255,255,' + (0.5 * (1 - f)).toFixed(3) + ')'); } }
  PR.house = function (c, t, p, o) {
    E(c, 0, 40, 46, 8, p.snow); smoke(c, 21, -34, 7, t);
    R(c, 16, -34, 10, 18, 1, '#a85a44'); Rn(c, 14.5, -36.5, 13, 4, 2, p.snow);
    R(c, -30, -6, 60, 44, 2, '#e9c9a0');
    c.beginPath(); c.moveTo(-40, -4); c.lineTo(0, -40); c.lineTo(40, -4); c.lineTo(33, -1); c.lineTo(0, -29); c.lineTo(-33, -1); c.closePath(); F(c, p.snow);
    Pg(c, [[-31, -4], [0, -30], [31, -4]], '#d9b488');
    c.beginPath(); c.arc(0, -13, 5, 0, TAU); F(c, '#ffdf8a'); L(c, -5, -13, 5, -13, 0.8, '#7a5230'); L(c, 0, -18, 0, -8, 0.8, '#7a5230');
    litWindow(c, -24, 6, 13, 14, t, 0); litWindow(c, 11, 6, 13, 14, t, 2); Rn(c, -25.5, 19, 16, 3, 1.5, p.snow); Rn(c, 9.5, 19, 16, 3, 1.5, p.snow);
    R(c, -7, 10, 14, 28, 2, p.accent); dot(c, 3.5, 25, 1.2, p.gold); c.beginPath(); c.arc(0, 17, 3.6, 0, TAU); c.lineWidth = 2; c.strokeStyle = PINE; c.stroke(); dot(c, 0, 20.6, 1, p.accent2 === PINE ? p.gold : p.gold);
    c.beginPath(); c.moveTo(-31, -6); for (var i = 0; i < 6; i++) c.quadraticCurveTo(-26 + i * 10.4, 0, -20.6 + i * 10.4, -6); c.lineWidth = 0.8; c.strokeStyle = '#3d5a45'; c.stroke();
    for (i = 0; i < 6; i++) dot(c, -26 + i * 10.4, -2.4, 1.5, BULBS[(i + Math.floor(t * 2)) % 5]);
  };

  PR.church = function (c, t, p, o) {
    var wall = '#f2e6d0', i; c.translate(0, 6); c.scale(0.9, 0.9); E(c, 0, 42, 46, 7, p.snow);
    R(c, -11, -30, 22, 40, 1, wall); Pg(c, [[-14, -29], [0, -52], [14, -29]], '#7c5a48'); Pg(c, [[-14, -29], [0, -52], [14, -29], [10, -29], [0, -45], [-10, -29]], p.snow);
    L(c, 0, -52, 0, -62, 1.8, p.gold); L(c, -3.4, -58, 3.4, -58, 1.8, p.gold);
    c.beginPath(); c.arc(0, -18, 4.5, PI, 0); c.lineTo(4.5, -12); c.lineTo(-4.5, -12); c.closePath(); F(c, '#3b3340'); E(c, 0, -15 + Math.sin(t * 3) * 0.6, 2.4, 2.6, p.gold);
    R(c, -32, 2, 64, 38, 1, wall); Pg(c, [[-38, 4], [0, -18], [38, 4]], '#7c5a48');
    c.beginPath(); c.moveTo(-38, 4); c.lineTo(0, -18); c.lineTo(38, 4); c.lineTo(31, 5); c.lineTo(0, -11); c.lineTo(-31, 5); c.closePath(); F(c, p.snow);
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * 20 - 4.5, 28); c.lineTo(i * 20 - 4.5, 16); c.arc(i * 20, 16, 4.5, PI, 0); c.lineTo(i * 20 + 4.5, 28); c.closePath(); F(c, '#ffdf8a'); L(c, i * 20, 12, i * 20, 28, 0.7, '#7a5230'); Rn(c, i * 20 - 6, 27.5, 12, 2.6, 1.3, p.snow); }
    c.beginPath(); c.moveTo(-7, 40); c.lineTo(-7, 22); c.arc(0, 22, 7, PI, 0); c.lineTo(7, 40); c.closePath(); F(c, '#8a4a34'); L(c, 0, 15, 0, 40, 0.8, '#5f3324');
    dot(c, 0, 5, 3.4, '#ffdf8a'); pine(c, -40, 44, 22, PINE, p.snow, 3); pine(c, 41, 44, 17, PINE, p.snow, 3);
  };

  PR.manger = function (c, t, p, o) {
    var dk = '#3b2a22', i, pu = 1 + Math.sin(t * 2.5) * 0.06;
    var g = c.createRadialGradient(0, -36, 1, 0, -36, 30); g.addColorStop(0, alpha(p.gold, 0.5)); g.addColorStop(1, alpha(p.gold, 0)); c.fillStyle = g; c.fillRect(-40, -50, 80, 60);
    c.beginPath(); c.moveTo(0, -50 * pu + 14 * (pu - 1) * 0); c.quadraticCurveTo(1.2, -37, 11 * pu, -36); c.quadraticCurveTo(1.2, -35, 0, -8); c.quadraticCurveTo(-1.2, -35, -11 * pu, -36); c.quadraticCurveTo(-1.2, -37, 0, -50 * pu); c.closePath(); c.fillStyle = shade(p.gold, 0.4); c.fill();
    var sw = ow; ow = 0;
    c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(0, 28, 0, 40); c.lineTo(-30, 40); c.lineTo(30, 40); c.closePath();
    var g2 = c.createRadialGradient(0, 30, 2, 0, 30, 34); g2.addColorStop(0, 'rgba(255,220,130,0.55)'); g2.addColorStop(1, 'rgba(255,220,130,0)'); c.fillStyle = g2; c.fillRect(-36, -4, 72, 46);
    Pg(c, [[-44, 0], [0, -24], [44, 0], [40, 5], [0, -16], [-40, 5]], dk, true); /* stable roof */
    Rn(c, -36, 2, 5, 40, 1, dk); Rn(c, 31, 2, 5, 40, 1, dk); Rn(c, -46, 40, 92, 4, 2, dk);
    L(c, -34, 4, -22, -8, 2.4, dk); L(c, 34, 4, 22, -8, 2.4, dk);
    /* the crib: a simple trough on crossed legs with a soft glow, no figures */
    L(c, -9, 40, 7, 24, 2.4, dk); L(c, 9, 40, -7, 24, 2.4, dk);
    c.beginPath(); c.moveTo(-13, 20); c.lineTo(13, 20); c.lineTo(10, 30); c.lineTo(-10, 30); c.closePath(); c.fillStyle = dk; c.fill();
    for (i = -3; i <= 3; i++) L(c, i * 3.4, 20, i * 4.4, 15.5 - (i % 2 ? 1.5 : 0), 1, p.gold);
    dot(c, 0, 17, 5, 'rgba(255,240,190,0.85)'); dot(c, 0, 17, 9, 'rgba(255,240,190,0.3)');
    ow = sw;
  };

  PR.mug = function (c, t, p, o) {
    var i; steam(c, 0, -28, 18, t, 3); E(c, 0, 40, 32, 4.5, 'rgba(0,0,0,0.13)');
    c.beginPath(); c.arc(25, 8, 12, -PI * 0.5, PI * 0.5); c.lineWidth = 7.5; c.strokeStyle = shade(p.accent, -0.34); c.stroke(); c.lineWidth = 5; c.strokeStyle = p.accent; c.stroke();
    c.beginPath(); c.moveTo(-26, -20); c.lineTo(26, -20); c.lineTo(22, 34); c.quadraticCurveTo(22, 40, 14, 40); c.lineTo(-14, 40); c.quadraticCurveTo(-22, 40, -22, 34); c.closePath(); F(c, p.accent);
    E(c, 0, -20, 26, 7, p.snow); E(c, 0, -19.5, 22, 5, '#6b3f26');
    E(c, -7, -21, 6.5, 4, p.snow); E(c, 6, -19.5, 6.5, 4, p.snow); E(c, 0, -23, 6, 3.8, p.snow); /* marshmallows */
    for (i = -2; i <= 2; i++) { twinkle(c, i * 9.5, 10 + (i % 2 ? 6 : 0), 4, p.snow); }
    Rn(c, -22.5, 26, 45, 3, 0, p.gold);
    c.save(); c.translate(15, -22); c.rotate(0.35); L(c, 0, 2, 0, -17, 3.4, p.snow); c.setLineDash([2.4, 3]); c.lineCap = 'butt'; L(c, 0, 2, 0, -17, 3.4, p.accent2); c.setLineDash([]); c.restore();
  };

  PR.cookie = function (c, t, p, o) {
    var gb = '#d19a55', i; c.save(); c.rotate(Math.sin(t * 2) * 0.05);
    starPath(c, 0, 2, 44, 23, 5, 0); c.lineJoin = 'round'; c.lineWidth = 10; c.strokeStyle = shade(gb, -0.34); c.stroke(); c.lineWidth = 7.6; c.strokeStyle = gb; c.stroke(); c.fillStyle = gb; c.fill();
    starPath(c, 0, 2, 35, 18, 5, 0); c.lineWidth = 2.4; c.strokeStyle = p.snow; c.stroke();
    var sp = [[0, -16], [-12, 0], [12, 0], [-8, 16], [8, 16], [0, 4], [-20, -4], [20, -4]]; for (i = 0; i < sp.length; i++) dot(c, sp[i][0], sp[i][1], 2.2, [p.accent, p.accent2, p.gold][i % 3]);
    c.restore();
  };

  PR.crib = function (c, t, p, o) {
    var wd = '#e8d2b0', i, rock = Math.sin(t * 1.6) * 0.05;
    L(c, 30, -6, 34, -40, 1.8, shade(wd, -0.3)); c.beginPath(); c.moveTo(34, -40); c.quadraticCurveTo(22, -50, 4, -44); c.lineWidth = 1.8; c.strokeStyle = shade(wd, -0.3); c.stroke(); /* mobile arm */
    var mob = [[4, 0, 0], [14, 1, 1], [24, 0, 2]];
    for (i = 0; i < 3; i++) { var mx = mob[i][0] + Math.sin(t * 1.5 + i) * 1.5, my = -30 + mob[i][1] * 4 + i * 0; L(c, mob[i][0], -45 + i * 1.5, mx, my - 4, 0.6, shade(wd, -0.3)); if (i === 0) { starPath(c, mx, my, 5, 2.2, 5, t * 0.5); F(c, p.gold); } else if (i === 1) { c.beginPath(); c.arc(mx, my, 5, 0.5, PI * 1.5); c.quadraticCurveTo(mx + 1, my, mx + 4.4, my + 2.4); c.closePath(); F(c, '#fff3b8'); } else { heartPath(c, mx, my, 8); F(c, p.accent); } }
    c.save(); c.translate(0, 40); c.rotate(rock); c.translate(0, -40);
    c.beginPath(); c.moveTo(-38, 34); c.quadraticCurveTo(0, 50, 38, 34); c.lineWidth = 6; c.strokeStyle = shade(wd, -0.34); c.stroke(); c.lineWidth = 4; c.strokeStyle = wd; c.stroke();
    E(c, -6, -4, 22, 9, p.snow); E(c, 8, -4, 20, 9, alpha(p.accent2, 1)); for (i = 0; i < 3; i++) twinkle(c, 0 + i * 9, -6 + (i % 2) * 3, 2.4, p.snow);
    c.beginPath(); c.moveTo(-34, -6); c.lineTo(34, -6); c.lineTo(28, 30); c.quadraticCurveTo(0, 38, -28, 30); c.closePath(); F(c, wd);
    for (i = -3; i <= 3; i++) L(c, i * 8.5, -2, i * 7.4, 30, 1, shade(wd, -0.2));
    R(c, -37, -10, 74, 6, 3, shade(wd, 0.2)); R(c, -38, -26, 7, 22, 3, wd); heartPath(c, 0, 14, 11); F(c, p.snow);
    c.restore();
  };

  PR.rattle = function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat); c.save(); c.rotate(-0.6 + Math.sin(t * 9) * 0.1 * (0.4 + k));
    R(c, -4, 0, 8, 34, 4, p.gold); c.beginPath(); c.arc(0, 40, 7.5, 0, TAU); c.lineWidth = 6.6; c.strokeStyle = shade(p.accent2, -0.34); c.stroke(); c.lineWidth = 4.4; c.strokeStyle = p.accent2; c.stroke();
    ball(c, 0, -18, 24, 24, p.accent); c.save(); c.beginPath(); c.arc(0, -18, 23, 0, TAU); c.clip(); c.fillStyle = p.snow; c.fillRect(-30, -22, 60, 8); c.restore();
    for (var i = -1; i <= 1; i++) { starPath(c, i * 12, -18, 3.4, 1.5, 5, 0); c.fillStyle = p.gold; c.fill(); }
    shine(c, -9, -30, 6); bow(c, 0, 5, 18, p.accent2);
    c.restore();
  };

  PR.heart = function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), s = 1 + k * 0.1 + Math.sin(t * 3) * 0.02; c.save(); c.scale(s, s);
    heartPath(c, 0, 2, 84); F(c, o.col || p.accent);
    heartPath(c, -2, 0, 66); c.fillStyle = shade(o.col || p.accent, 0.14); c.fill();
    c.beginPath(); c.arc(-17, -12, 13, PI * 1.05, PI * 1.5); c.lineWidth = 5; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    c.restore(); twinkle(c, 34, -34, 6 + Math.sin(t * 4) * 2, p.gold);
  };

  PR.envelope = function (c, t, p, o) {
    c.save(); c.rotate(-0.08 + Math.sin(t * 1.8) * 0.03);
    R(c, -42, -26, 84, 56, 4, p.paper);
    c.save(); rrp(c, -42, -26, 84, 56, 4); c.clip(); c.lineWidth = 5; for (var i = -8; i < 12; i++) { L(c, -46 + i * 9, 32, -40 + i * 9, 26, 3, i % 2 ? p.accent : p.accent2); L(c, -46 + i * 9, -24, -40 + i * 9, -30, 3, i % 2 ? p.accent2 : p.accent); } c.restore();
    c.beginPath(); c.moveTo(-42, 28); c.lineTo(-6, 0); c.moveTo(42, 28); c.lineTo(6, 0); c.lineWidth = 1; c.strokeStyle = shade(p.paper, -0.25); c.stroke();
    c.beginPath(); c.moveTo(-41, -24); c.lineTo(0, 8); c.lineTo(41, -24); c.lineWidth = 1.2; c.strokeStyle = shade(p.paper, -0.3); c.stroke();
    E(c, 0, 6, 9, 9, p.accent); heartPath(c, 0, 6.6, 8); c.fillStyle = shade(p.accent, 0.3); c.fill();
    c.restore();
  };

  PR.globe = function (c, t, p, o) {
    var sea = '#4f9fd8', land = '#6fbf73', i;
    L(c, 0, 30, 0, 40, 4, p.gold); E(c, 0, 43, 20, 4.5, p.gold);
    c.beginPath(); c.arc(0, -6, 39, -PI * 0.42, PI * 0.62); c.lineWidth = 2.6; c.strokeStyle = p.gold; c.stroke();
    ball(c, 0, -6, 34, 34, sea);
    c.save(); c.beginPath(); c.arc(0, -6, 33.4, 0, TAU); c.clip(); var sw = ow; ow = 0;
    var dr = frac(t * 0.04) * 20;
    c.beginPath(); c.moveTo(-28 + dr, -26); c.bezierCurveTo(-10 + dr, -34, -6 + dr, -18, -14 + dr, -10); c.bezierCurveTo(-8 + dr, 0, -18 + dr, 12, -22 + dr, 2); c.bezierCurveTo(-34 + dr, -6, -34 + dr, -18, -28 + dr, -26); F(c, land);
    c.beginPath(); c.moveTo(6 + dr, -22); c.bezierCurveTo(22 + dr, -30, 34 + dr, -16, 26 + dr, -8); c.bezierCurveTo(30 + dr, 4, 18 + dr, 14, 12 + dr, 2); c.bezierCurveTo(2 + dr, -4, 0 + dr, -16, 6 + dr, -22); F(c, land);
    E(c, -2 + dr, 20, 9, 5, land); E(c, 0, -39, 16, 5, p.snow); E(c, 0, 27.5, 14, 4, p.snow);
    ow = sw; c.restore();
    shine(c, -15, -24, 7);
    c.setLineDash([2.2, 3.2]); c.lineDashOffset = -t * 6; c.beginPath(); c.moveTo(-18, -8); c.quadraticCurveTo(2, -42, 20, -10); c.lineWidth = 1.8; c.strokeStyle = p.paper; c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    dot(c, -18, -8, 2.6, p.accent); heartPath(c, 20, -11, 8); F(c, p.accent);
    var f = frac(t * 0.25), px = (1 - f) * (1 - f) * -18 + 2 * (1 - f) * f * 2 + f * f * 20, py = (1 - f) * (1 - f) * -8 + 2 * (1 - f) * f * -42 + f * f * -10;
    Pg(c, [[px + 5, py], [px - 4, py - 3.5], [px - 2, py], [px - 4, py + 3.5]], p.paper);
  };

  PR.microphone = function (c, t, p, o) {
    var ch = '#d9dde3', i, k = Math.exp(-5 * o.beat);
    E(c, 0, 42, 22, 5, '#3b3340'); L(c, 0, 40, 0, 14, 4, ch);
    c.beginPath(); c.arc(0, -8, 27, 0.15 * PI, 0.85 * PI); c.lineWidth = 4; c.strokeStyle = shade(ch, -0.3); c.stroke(); c.lineWidth = 2.4; c.strokeStyle = ch; c.stroke();
    R(c, -17, -40, 34, 54, 16, ch);
    c.save(); rrp(c, -17, -40, 34, 54, 16); c.clip(); for (i = 0; i < 7; i++) Rn(c, -17, -34 + i * 7, 34, 3.4, 0, '#4a4654'); Rn(c, -3.5, -40, 7, 54, 0, ch); c.restore();
    R(c, -19, -13, 38, 8, 2, p.accent); starPath(c, 0, -9, 3.4, 1.5, 5, 0); c.fillStyle = p.gold; c.fill();
    L(c, -8, -34, -11, -18, 2, 'rgba(255,255,255,0.6)');
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(i * 26, -22, 8 + k * 3, i > 0 ? -0.7 : PI - 0.7, i > 0 ? 0.7 : PI + 0.7); c.lineWidth = 1.8; c.strokeStyle = alpha(p.gold, 0.4 + 0.6 * k); c.stroke(); c.beginPath(); c.arc(i * 26, -22, 14 + k * 4, i > 0 ? -0.6 : PI - 0.6, i > 0 ? 0.6 : PI + 0.6); c.stroke(); }
  };

  PR.cassette = function (c, t, p, o) {
    var i, a = t * 3; c.save(); c.rotate(-0.06 + Math.sin(t * 2) * 0.02);
    R(c, -44, -28, 88, 56, 5, '#3b3340'); R(c, -38, -23, 76, 34, 3, p.paper);
    Rn(c, -38, -23, 76, 8, 2, p.accent); Rn(c, -38, -15, 76, 2.4, 0, p.gold); Rn(c, -38, -12.6, 76, 2.4, 0, p.accent2);
    L(c, -30, -19, 8, -19, 1.4, p.paper);
    R(c, -24, -6, 48, 14, 7, '#2a2530');
    for (i = -1; i <= 1; i += 2) { dot(c, i * 14, 1, 5.4, p.paper); for (var j = 0; j < 3; j++) L(c, i * 14, 1, i * 14 + Math.cos(a + j * 2.094) * 5, 1 + Math.sin(a + j * 2.094) * 5, 1.2, '#2a2530'); dot(c, i * 14, 1, 1.8, '#2a2530'); }
    Rn(c, -5.5, -3, 11, 8, 1, '#6b4a3a');
    Pg(c, [[-26, 28], [-21, 15], [21, 15], [26, 28]], '#2a2530'); dot(c, -14, 22, 1.6, p.paper); dot(c, 14, 22, 1.6, p.paper);
    for (i = -1; i <= 1; i += 2) { dot(c, i * 39, -23, 1.3, '#8a8590'); dot(c, i * 39, 23, 1.3, '#8a8590'); }
    c.restore();
  };

  PR.discoball = function (c, t, p, o) {
    var i, j, k = Math.exp(-4 * o.beat), cols = ['#dfe7ee', '#b9c6d3', '#f4f8fb', '#9fb0c2'];
    L(c, 0, -50, 0, -32, 1.6, '#c9cfd6'); R(c, -5, -35, 10, 5, 1.5, '#9aa3ad');
    E(c, 0, 4, 34, 34, '#aebccb');
    c.save(); c.beginPath(); c.arc(0, 4, 33.4, 0, TAU); c.clip();
    for (j = -4; j <= 4; j++) { var y = 4 + Math.sin(j * 0.36) * 34, hh = Math.cos(j * 0.36) * 8.4, rw = Math.cos(j * 0.36) * 34, off = frac(t * 0.12) * 2; for (i = -5; i <= 5; i++) { var a1 = (i + off - 0.5) * 0.36, a2 = (i + off + 0.5) * 0.36; if (a1 < -PI / 2 || a2 > PI / 2) continue; var x1 = Math.sin(a1) * rw, x2 = Math.sin(a2) * rw; c.fillStyle = cols[((i + j * 3) % 4 + 4) % 4]; c.fillRect(x1 + 0.35, y - hh / 2 + 0.35, x2 - x1 - 0.7, hh - 0.7); } }
    c.fillStyle = alpha(p.accent, 0.16); c.fillRect(-40, -30, 40, 70); c.fillStyle = alpha(p.accent2, 0.16); c.fillRect(0, -30, 40, 70);
    c.restore();
    var sp = [[-14, -12], [16, 8], [-6, 22], [24, -16]]; for (i = 0; i < 4; i++) twinkle(c, sp[i][0], sp[i][1], 5 + 5 * Math.abs(Math.sin(t * 3 + i * 1.7)) + k * 3, '#fff');
    for (i = 0; i < 6; i++) { var a = i * 1.05 + t * 0.4; L(c, Math.cos(a) * 38, 4 + Math.sin(a) * 38, Math.cos(a) * 46, 4 + Math.sin(a) * 46, 1.3, alpha(i % 2 ? p.gold : p.snow, 0.6)); }
  };

  PR.radio = function (c, t, p, o) {
    var wd = WOOD2, i, k = Math.exp(-5 * o.beat);
    c.beginPath(); c.moveTo(-42, 36); c.lineTo(-42, -4); c.quadraticCurveTo(-42, -34, 0, -34); c.quadraticCurveTo(42, -34, 42, -4); c.lineTo(42, 36); c.closePath(); F(c, wd);
    c.beginPath(); c.moveTo(-36, 12); c.lineTo(-36, -4); c.quadraticCurveTo(-36, -28, 0, -28); c.quadraticCurveTo(36, -28, 36, -4); c.lineTo(36, 12); c.closePath(); F(c, '#f0dfb8');
    c.save(); c.clip(); for (i = -6; i <= 6; i++) Rn(c, i * 6 - 1.2, -30, 2.4, 44, 0, '#c9a56c'); c.restore();
    R(c, -16, -12, 32, 13, 3, '#fff3c4'); for (i = -3; i <= 3; i++) L(c, i * 4, -9.5, i * 4, -6.5, 0.6, p.ink); L(c, Math.sin(t * 0.8) * 10, -11, Math.sin(t * 0.8) * 10, -1, 1, p.accent);
    for (i = -1; i <= 1; i += 2) { E(c, i * 24, 24, 7, 7, '#3b3340'); L(c, i * 24, 24, i * 24 + Math.cos(t + i) * 5, 24 + Math.sin(t + i) * 5, 1.4, p.gold); }
    R(c, -10, 20, 20, 8, 2, p.gold);
    R(c, -36, 36, 12, 5, 2, shade(wd, -0.3)); R(c, 24, 36, 12, 5, 2, shade(wd, -0.3));
    L(c, 30, -30, 41, -44, 1.4, '#c9cfd6'); dot(c, 41, -44, 2, p.accent);
    hollySprig(c, -24, -30, 22, -0.3, p);
    c.font = 'bold 13px sans-serif'; c.fillStyle = alpha(p.snow, 0.5 + 0.5 * k); c.textAlign = 'center';
    for (i = 0; i < 2; i++) { var nx = -38 + i * 20 + Math.sin(t * 2 + i) * 3, ny = -40 - i * 5 - k * 3; E(c, nx, ny, 3, 2.3, alpha(p.snow, 0.9), -0.4); L(c, nx + 2.6, ny, nx + 2.6, ny - 9, 1.1, alpha(p.snow, 0.9)); }
  };

  PR.laptop = function (c, t, p, o) {
    var gy = '#c9cfd8', i;
    R(c, -34, -34, 68, 48, 4, '#3b3f4a'); R(c, -30, -30, 60, 40, 2, '#17324d');
    c.save(); rrp(c, -30, -30, 60, 40, 2); c.clip(); var sw = ow; ow = 0;
    E(c, 0, 12, 40, 6, p.snow); pine(c, 0, 9, 32, PINE, null, 3);
    for (i = 0; i < 6; i++) dot(c, [-5, 4, -2, 6, -7, 1][i], [2, 4, -6, -3, 6, -13][i], 1.3, BULBS[(i + Math.floor(t * 3)) % 5]);
    starPath(c, 0, -21, 3.4, 1.5, 5, 0); c.fillStyle = p.gold; c.fill();
    for (i = 0; i < 9; i++) dot(c, -27 + ((i * 17) % 55), -28 + frac(i * 0.37 + t * 0.2) * 36, 0.8, '#fff');
    ow = sw; c.restore();
    dot(c, 0, -32, 0.8, '#8a909c');
    c.beginPath(); c.moveTo(-34, 14); c.lineTo(34, 14); c.lineTo(44, 30); c.quadraticCurveTo(45, 34, 40, 34); c.lineTo(-40, 34); c.quadraticCurveTo(-45, 34, -44, 30); c.closePath(); F(c, gy);
    for (i = 0; i < 3; i++) Rn(c, -31 - i * 2.4, 17 + i * 4, 62 + i * 4.8, 2.6, 1, '#8a909c');
    Rn(c, -9, 29, 18, 3, 1, '#aab1bd');
    hollySprig(c, 30, -32, 18, 0.5, p);
  };

  PR.watercooler = function (c, t, p, o) {
    var i, bub = frac(t * 0.6);
    R(c, -18, -2, 36, 46, 3, '#e9edf2'); Rn(c, -18, 36, 36, 8, 2, '#b9c2cc');
    R(c, -12, 6, 24, 14, 2, '#cfd7e0'); R(c, -9, 9, 5, 5, 1, '#3f8fd8'); R(c, 4, 9, 5, 5, 1, p.accent);
    R(c, -14, -8, 28, 7, 2, '#b9c2cc');
    c.beginPath(); c.moveTo(-15, -8); c.lineTo(-15, -36); c.quadraticCurveTo(-15, -42, -8, -44); c.lineTo(-6, -48); c.lineTo(6, -48); c.lineTo(8, -44); c.quadraticCurveTo(15, -42, 15, -36); c.lineTo(15, -8); c.closePath(); F(c, '#a9dcf5');
    Rn(c, -14, -30, 28, 21, 0, '#6fc0ee'); L(c, -14, -30, 14, -30, 1, '#d6f0fb');
    for (i = 0; i < 3; i++) { var f = frac(bub + i / 3); dot(c, -6 + i * 6, -10 - f * 18, 1.3 + i * 0.4, 'rgba(255,255,255,0.75)'); }
    L(c, -10, -40, -10, -14, 1.8, 'rgba(255,255,255,0.6)');
    c.beginPath(); c.moveTo(-16, -34); c.quadraticCurveTo(0, -27, 16, -34); c.lineWidth = 3.4; c.strokeStyle = PINE; c.stroke(); for (i = -2; i <= 2; i++) dot(c, i * 6.4, -30.6 + Math.abs(i) * -1.1, 1.6, BULBS[(i + 7) % 5]); /* tiny garland */
    Pg(c, [[22, 14], [32, 14], [30, 28], [24, 28]], p.paper); L(c, 18, 28, 36, 28, 1.2, '#b9c2cc');
  };

  function paw(c, x, y, s, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.beginPath(); c.moveTo(0, -s * 0.06); c.bezierCurveTo(s * 0.3, -s * 0.12, s * 0.44, s * 0.2, s * 0.26, s * 0.36); c.quadraticCurveTo(0, s * 0.3, -s * 0.26, s * 0.36); c.bezierCurveTo(-s * 0.44, s * 0.2, -s * 0.3, -s * 0.12, 0, -s * 0.06); c.closePath(); F(c, col);
    var tz = [[-0.33, -0.12, -0.4], [-0.12, -0.33, -0.1], [0.12, -0.33, 0.1], [0.33, -0.12, 0.4]];
    for (var i = 0; i < 4; i++) E(c, tz[i][0] * s, tz[i][1] * s, s * 0.1, s * 0.135, col, tz[i][2]);
    c.restore();
  }
  function bone(c, x, y, s, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot || 0); var r = s * 0.13, l = s * 0.3;
    for (var k = 0; k < 2; k++) {
      var g = k ? 0 : ow, i; c.fillStyle = k ? col : shade(col, -0.34); if (!k && ow <= 0) continue;
      c.beginPath(); for (i = 0; i < 4; i++) { var bx = (i < 2 ? -l : l), by = (i % 2 ? r * 0.85 : -r * 0.85); c.moveTo(bx + r + g, by); c.arc(bx, by, r + g, 0, TAU); }
      c.rect(-l, -r * 0.8 - g, l * 2, r * 1.6 + g * 2); c.fill();
    }
    c.restore();
  }
  PR.pawprint = function (c, t, p, o) { var k = Math.exp(-5 * o.beat); paw(c, 0, 4, 92 * (1 + k * 0.06), Math.sin(t * 2) * 0.06 - 0.1, o.col || p.accent); };
  PR.bone = function (c, t, p, o) {
    c.save(); c.rotate(-0.3 + Math.sin(t * 2.2) * 0.06); bone(c, 0, 0, 104, 0, p.paper); L(c, -24, -6, 18, -6, 2.4, 'rgba(255,255,255,0.8)');
    R(c, -5, -11, 10, 22, 2, p.accent); bow(c, 0, -12, 26, p.accent); c.restore();
  };
  PR.yarn = function (c, t, p, o) {
    var i, col = o.col || p.accent;
    c.beginPath(); c.moveTo(18, 26); c.bezierCurveTo(40, 44, 20, 46, 34, 36); c.bezierCurveTo(48, 28, 46, 44, 40, 44 + Math.sin(t * 2) * 2); c.lineWidth = 2.6; c.lineCap = 'round'; c.strokeStyle = col; c.stroke();
    ball(c, -4, 2, 36, 36, col);
    c.save(); c.beginPath(); c.arc(-4, 2, 35, 0, TAU); c.clip(); c.lineWidth = 1.5; c.strokeStyle = shade(col, 0.3);
    for (i = -3; i <= 3; i++) { c.beginPath(); c.ellipse(-4 + i * 4, 2, 36, 15 + Math.abs(i) * 6, 0.7 + i * 0.12, 0, TAU); c.stroke(); }
    c.strokeStyle = shade(col, -0.2); for (i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(-4, 2 + i * 6, 38, 12 + Math.abs(i) * 5, -0.6, 0, TAU); c.stroke(); }
    c.restore();
    L(c, -30, -34, 10, 28, 2.6, '#d9b98a'); L(c, 8, -40, -24, 30, 2.6, '#c9a56c'); dot(c, -30, -34, 3, '#d9b98a'); dot(c, 8, -40, 3, '#c9a56c');
  };
  function crescent(c, x, y, r, col) { c.beginPath(); c.arc(x, y, r, PI * 0.28, PI * 1.72); c.bezierCurveTo(x + r * 0.1, y - r * 0.55, x + r * 0.1, y + r * 0.55, x + r * 0.63, y + r * 0.77); c.closePath(); F(c, col); }
  PR.moon = function (c, t, p, o) {
    dot(c, 0, 0, 46, alpha('#fff3b8', 0.14)); c.save(); c.rotate(-0.35 + Math.sin(t * 0.9) * 0.04);
    crescent(c, 0, 0, 38, '#fff3b8'); dot(c, -20, -10, 4, '#f3e2a0'); dot(c, -24, 8, 2.6, '#f3e2a0'); dot(c, -10, 22, 3.2, '#f3e2a0');
    c.beginPath(); c.arc(-13, 5, 3, PI * 0.1, PI * 0.9); c.lineWidth = 1.5; c.strokeStyle = '#8a7340'; c.stroke(); /* sleepy eye */
    dot(c, -19, 14, 3.2, 'rgba(240,96,110,0.4)');
    c.restore();
    twinkle(c, 24, -22, 6 + Math.sin(t * 3) * 2, p.snow); twinkle(c, 34, 6, 3.5 + Math.cos(t * 4) * 1.5, p.snow);
  };
  PR.cloud = function (c, t, p, o) { c.save(); c.translate(Math.sin(t * 0.8) * 3, 0); cloud(c, 2, 8, 92, shade(p.snow, -0.14)); cloud(c, 0, 4, 92, p.snow); blush(c, 0, 12, 14, 4); c.beginPath(); c.arc(-8, 4, 2.6, PI * 0.1, PI * 0.9); c.moveTo(10.6, 4.8); c.arc(8, 4, 2.6, PI * 0.1, PI * 0.9); c.lineWidth = 1.4; c.strokeStyle = '#7b8aa0'; c.stroke(); c.restore(); };
  PR.pine = function (c, t, p, o) { E(c, 0, 44, 30, 5, p.snow); c.save(); c.translate(0, 44); c.rotate(Math.sin(t * 1.3) * 0.015); pine(c, 0, 0, 92, PINE, p.snow, 4); c.restore(); };
  PR.snowpile = function (c, t, p, o) {
    var sw = ow; ow = 0; c.beginPath(); c.moveTo(-48, 30); c.bezierCurveTo(-40, 6, -22, -4, -8, 4); c.bezierCurveTo(2, -14, 26, -12, 32, 6); c.bezierCurveTo(42, 8, 48, 20, 48, 30); c.closePath(); c.fillStyle = SNSH; c.fill();
    c.beginPath(); c.moveTo(-48, 30); c.bezierCurveTo(-42, 12, -24, 2, -10, 10); c.bezierCurveTo(0, -8, 22, -6, 28, 10); c.bezierCurveTo(38, 12, 46, 22, 48, 30); c.closePath(); c.fillStyle = p.snow; c.fill(); ow = sw;
    twinkle(c, -20, 14, 3 + Math.sin(t * 3) * 1.5, '#fff'); twinkle(c, 12, 4, 3.5 + Math.cos(t * 3.4) * 1.5, '#fff'); twinkle(c, 30, 20, 2.4 + Math.sin(t * 4 + 1) * 1.2, '#fff');
  };

  //@@PROPS

  function prop(name, ctx, x, y, s, t, pal, opts) {
    var f = PR[name]; if (!f || !ctx || !(s > 0)) return;
    var o = { beat: frac(num(opts && opts.beat, 0.5)), n: Math.floor(num(opts && opts.n, 0)), col: opts && opts.col }, sow = ow, k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ow = 1.2;
    try { f(ctx, num(t, 0), P(pal), o); } finally { ow = sow; ctx.restore(); }
  }
  CarolArt.prop = prop;
  CarolArt.props = ['tree', 'truck', 'fireplace', 'snowglobe', 'present', 'wreath', 'bell', 'stocking', 'ornament', 'candycane', 'holly', 'mistletoe', 'sleigh', 'star', 'candle', 'lantern', 'mailbox', 'airplane', 'house', 'church', 'manger', 'mug', 'cookie', 'crib', 'rattle', 'heart', 'envelope', 'globe', 'microphone', 'cassette', 'discoball', 'radio', 'laptop', 'watercooler', 'pawprint', 'bone', 'yarn', 'moon', 'cloud', 'pine', 'snowpile'];

  /* ---------- photo frames ---------- */
  function placeholder(c, x, y, w, h, p) { /* a soft panel with two simple people, used when there is no photo yet */
    var g = c.createLinearGradient(x, y, x, y + h), m = Math.min(w, h), i;
    g.addColorStop(0, shade(p.gold, 0.55)); g.addColorStop(1, shade(p.accent, 0.5)); c.fillStyle = g; c.fillRect(x, y, w, h);
    var cx = x + w / 2, cy = y + h * 0.42, pe = [[-0.17, 0.02, 0.15, 'rgba(255,255,255,0.5)'], [0.15, -0.03, 0.165, 'rgba(255,255,255,0.72)']];
    for (i = 0; i < 2; i++) {
      var hx = cx + pe[i][0] * m, hy = cy + pe[i][1] * m, r = pe[i][2] * m; c.fillStyle = pe[i][3];
      c.beginPath(); c.arc(hx, hy, r, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(hx - r * 2, y + h); c.bezierCurveTo(hx - r * 2, hy + r * 1.1, hx + r * 2, hy + r * 1.1, hx + r * 2, y + h); c.closePath(); c.fill();
    }
    heartPath(c, cx - m * 0.01, cy - m * 0.3, m * 0.09); c.fillStyle = alpha(p.accent, 0.55); c.fill();
  }
  var KB = null; /* set by frame(): { z: zoom >= 1, x, y: pan as a fraction of the picture, art: function (c, x, y, w, h) drawn instead of a photo } */
  /* A PHOTO IN ITS WINDOW. Plain arithmetic on the photo's and the window's sizes; nothing looks at the picture.
     - the sender placed it (KB.fit = [x, y, zoom]): that point of the photo sits in the middle, at that zoom of "cover";
     - it is marked as one person (KB.solo): cover, centred a little above the middle, where a face is;
     - otherwise (KB.keep): cover, but never losing more than 14% of the photo's width or 20% of its height: a group
       stays whole. Where the photo then does not fill the window, a darkened close-up of itself fills the rest. */
  function drawPhoto(c, img, x, y, w, h, p) {
    if (KB && KB.art) { KB.art(c, x, y, w, h); return; }
    var iw = img && img.width, ih = img && img.height;
    if (iw > 0 && ih > 0) {
      var cover = Math.max(w / iw, h / ih), z = 1, fx = 0.5, fy = 0.42;
      if (KB && KB.fit) { fx = KB.fit[0]; fy = KB.fit[1]; z = KB.fit[2]; }
      else if (KB && KB.keep) z = clamp(Math.min((w / iw) / (cover * 0.86), (h / ih) / (cover * 0.8)), 0.25, 1);
      var sc = cover * z * (KB ? KB.z : 1), sw = Math.min(iw, w / sc), sh = Math.min(ih, h / sc), tw = sw * sc, th = sh * sc, tx = x + (w - tw) / 2, ty = y + (h - th) / 2, bands = tw < w - 0.5 || th < h - 0.5;
      var sx = clamp(iw * (fx + (KB ? KB.x : 0)) - sw / 2, 0, iw - sw), sy = clamp(ih * (fy + (KB ? KB.y : 0)) - sh / 2, 0, ih - sh);
      try {
        if (bands) { var bs = cover * 1.7, bw = w / bs, bh = h / bs; c.drawImage(img, (iw - bw) / 2, clamp(ih * 0.42 - bh / 2, 0, ih - bh), bw, bh, x, y, w, h); c.fillStyle = 'rgba(24,14,30,0.5)'; c.fillRect(x, y, w, h); }
        c.drawImage(img, sx, sy, sw, sh, tx, ty, tw, th);
        if (bands) { c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = Math.max(1, Math.min(w, h) * 0.008); c.strokeRect(tx, ty, tw, th); }
        return;
      } catch (e) { /* fall through to the placeholder */ }
    }
    placeholder(c, x, y, w, h, p);
  }
  function photoRect(c, img, x, y, w, h, r, p) { c.save(); rrp(c, x, y, w, h, r); c.clip(); drawPhoto(c, img, x, y, w, h, p); c.restore(); return { x: x, y: y, w: w, h: h }; }
  function photoCircle(c, img, cx, cy, r, p) { c.save(); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.clip(); drawPhoto(c, img, cx - r, cy - r, r * 2, r * 2, p); c.restore(); return { x: cx - r, y: cy - r, w: r * 2, h: r * 2, round: true }; }
  function ringStroke(c, cx, cy, r, lw, col) { c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); }
  function lightString(c, x1, y1, x2, y2, sag, n, u, o, t) { /* a drooping wire with bulbs that twinkle on the beat */
    var i, k = Math.exp(-5 * o.beat);
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag * 2, x2, y2); c.lineWidth = Math.max(0.6, u * 0.7); c.strokeStyle = '#2f4a38'; c.stroke();
    for (i = 0; i < n; i++) {
      var f = (i + 0.5) / n, bx = x1 + (x2 - x1) * f, by = (1 - f) * (1 - f) * y1 + 2 * (1 - f) * f * ((y1 + y2) / 2 + sag * 2) + f * f * y2, lit = ((i + o.n) % 2 === 0), col = BULBS[i % 5];
      if (lit) dot(c, bx, by + u * 2.4, u * (3.2 + k * 1.6), alpha(col, 0.28 + 0.2 * k));
      Rn(c, bx - u * 0.8, by - u * 0.2, u * 1.6, u * 1.4, u * 0.3, '#2f4a38');
      c.globalAlpha = lit ? 1 : 0.6; E(c, bx, by + u * 2.6, u * 1.5, u * 2.1, lit ? col : shade(col, -0.25)); c.globalAlpha = 1;
      if (lit) dot(c, bx - u * 0.5, by + u * 2, u * 0.45, 'rgba(255,255,255,0.8)');
    }
  }
  var FR = {};

  FR.ornament = function (c, img, w, h, t, p, o, u) {
    var cx = w / 2, r = Math.min(w * 0.48, h * 0.425), cy = h - r - u, a = Math.sin(t * 1.1) * 0.025, pr = r * 0.8, i;
    c.translate(cx, 0); c.rotate(a); c.translate(-cx, 0);
    L(c, cx, 0, cx, cy - r - u * 6, u * 2.2, p.accent2);
    ringStroke(c, cx, cy - r - u * 9, u * 3.4, u * 1.4, p.gold);
    R(c, cx - u * 8, cy - r - u * 6.5, u * 16, u * 9, u * 2, p.gold); for (i = -2; i <= 2; i++) L(c, cx + i * u * 2.8, cy - r - u * 5, cx + i * u * 2.8, cy - r + u * 1, u * 0.6, shade(p.gold, -0.25));
    E(c, cx, cy, r, r, p.accent);
    for (i = 0; i < 20; i++) { var an = i / 20 * TAU; if (i % 2) dot(c, cx + Math.cos(an) * r * 0.905, cy + Math.sin(an) * r * 0.905, u * 1.1, p.snow); else twinkle(c, cx + Math.cos(an) * r * 0.905, cy + Math.sin(an) * r * 0.905, u * (2 + 0.8 * Math.sin(t * 3 + i)), p.gold); }
    var q = photoCircle(c, img, cx, cy, pr, p);
    ringStroke(c, cx, cy, pr, u * 1.8, p.gold);
    c.beginPath(); c.arc(cx, cy, r * 0.93, PI * 1.12, PI * 1.34); c.lineWidth = u * 2.4; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    bow(c, cx, cy - r - u * 1, u * 20, p.accent2);
    q.a = a; q.px = cx; q.py = 0; return q;
  };

  FR.snowglobe = function (c, img, w, h, t, p, o, u) {
    var r = Math.min(w * 0.48, h * 0.42), cx = w / 2, cy = r + u, pr = r * 0.94, by = cy + r * 0.84, bh = h - by - u, i, R0 = rnd(o.seed + 'globe');
    c.beginPath(); c.moveTo(cx - r * 0.72, by); c.lineTo(cx + r * 0.72, by); c.lineTo(cx + r * 0.9, by + bh); c.quadraticCurveTo(cx, by + bh + u * 1.5, cx - r * 0.9, by + bh); c.closePath(); F(c, p.accent);
    R(c, cx - r * 0.8, by + bh * 0.28, r * 1.6, bh * 0.2, u, p.gold); R(c, cx - r * 0.3, by + bh * 0.58, r * 0.6, bh * 0.26, u, p.gold);
    E(c, cx, cy, r, r, '#d6eef9');
    var q = photoCircle(c, img, cx, cy, pr, p);
    c.save(); c.beginPath(); c.arc(cx, cy, pr, 0, TAU); c.clip();
    c.beginPath(); c.ellipse(cx, cy + pr * 1.18, pr * 0.9, pr * 0.36, 0, 0, TAU); c.fillStyle = p.snow; c.fill(); /* settled snow, low */
    for (i = 0; i < 34; i++) { /* drifting flakes kept to the rim so faces stay clear */
      var an = R0() * TAU + t * (0.12 + R0() * 0.2), rr = pr * (0.72 + R0() * 0.26), wob = Math.sin(t * 1.4 + i) * u;
      dot(c, cx + Math.cos(an) * rr + wob, cy + Math.sin(an) * rr, u * (0.6 + R0() * 1), 'rgba(255,255,255,0.9)');
    }
    c.restore();
    ringStroke(c, cx, cy, pr, u * 1.4, 'rgba(255,255,255,0.65)');
    c.beginPath(); c.arc(cx, cy, r * 0.86, PI * 1.1, PI * 1.38); c.lineWidth = u * 2.6; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke(); dot(c, cx - r * 0.56, cy - r * 0.68, u * 1.5, 'rgba(255,255,255,0.8)');
    return q;
  };

  FR.polaroid = function (c, img, w, h, t, p, o, u) {
    var cx = w / 2, top = u * 11, cw = Math.min(w * 0.84, (h - top - u * 3) / 1.2), ch = cw * 1.2, m = cw * 0.065, a = Math.sin(t * 1.3) * 0.028;
    lightString(c, 0, u * 3, w, u * 3, u * 2.6, Math.max(5, Math.round(w / (u * 13))), u, o, t);
    c.translate(cx, top); c.rotate(a); c.translate(-cx, -top);
    Rn(c, cx - cw / 2 + u * 1.5, top + u * 2, cw, ch, u, 'rgba(0,0,0,0.18)');
    R(c, cx - cw / 2, top, cw, ch, u * 1.2, '#fffdf7');
    var q = photoRect(c, img, cx - cw / 2 + m, top + m, cw - m * 2, ch - m - cw * 0.2, u * 0.5, p);
    c.lineWidth = u * 0.5; c.strokeStyle = 'rgba(0,0,0,0.12)'; c.strokeRect(q.x, q.y, q.w, q.h);
    heartPath(c, cx + cw * 0.34, top + ch - cw * 0.1, cw * 0.07); c.fillStyle = p.accent; c.fill(); if (o.festive) hollySprig(c, cx - cw * 0.33, top + ch - cw * 0.1, cw * 0.14, 0.2, p); else twinkle(c, cx - cw * 0.33, top + ch - cw * 0.1, cw * 0.055, p.gold);
    R(c, cx - u * 2.6, top - u * 6.5, u * 5.2, u * 11, u * 1, '#d9a866'); L(c, cx - u * 2.6, top - u * 1.5, cx + u * 2.6, top - u * 1.5, u * 0.7, '#8f6238'); /* clothes-peg */
    q.a = a; q.px = cx; q.py = top; return q;
  };

  FR.mantel = function (c, img, w, h, t, p, o, u) {
    var sh = u * 9, fh = h - sh - u * 5, fw = Math.min(w * 0.86, fh * (w > h * 1.05 ? 1.6 : 0.86)), th = u * 7, cx = w / 2, i, j; fh = Math.min(fh, fw * 1.4);   /* (a wide box, for a wide photo, gets a wide picture frame) */ var fy = h - sh - fh, fx = cx - fw / 2;
    R(c, 0, h - sh, w, sh, u * 1.5, WOOD2); Rn(c, 0, h - sh, w, u * 2.6, u * 1.2, shade(WOOD2, 0.25)); Rn(c, u * 3, h - u * 3.4, w - u * 6, u * 1.2, u * 0.6, shade(WOOD2, -0.25));
    Rn(c, fx + u * 2, h - sh - u * 1.2, fw, u * 2.4, u, 'rgba(0,0,0,0.2)');
    Pg(c, [[cx - u * 10, fy + u], [cx, fy - u * 4.5], [cx + u * 10, fy + u]], p.gold); /* crest */
    R(c, fx, fy, fw, fh, u * 2.5, WOOD); R(c, fx + u * 1.6, fy + u * 1.6, fw - u * 3.2, fh - u * 3.2, u * 1.8, p.gold);
    R(c, fx + th - u * 1.4, fy + th - u * 1.4, fw - th * 2 + u * 2.8, fh - th * 2 + u * 2.8, u, shade(p.gold, -0.22));
    var q = photoRect(c, img, fx + th, fy + th, fw - th * 2, fh - th * 2, u * 0.6, p);
    for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) { var ox = fx + (i ? fw - th * 0.55 : th * 0.55), oy = fy + (j ? fh - th * 0.55 : th * 0.55); E(c, ox, oy, u * 3, u * 3, p.gold); twinkle(c, ox, oy, u * (2 + ((i + j) % 2 ? 1 : -1) * 0.7 * Math.sin(t * 3)), '#fff8d8'); }
    for (i = 1; i < 6; i++) { dot(c, fx + fw * i / 6, fy + th * 0.52, u * 0.8, shade(p.gold, 0.4)); dot(c, fx + fw * i / 6, fy + fh - th * 0.52, u * 0.8, shade(p.gold, 0.4)); }
    dot(c, cx, fy - u * 0.6, u * 1.6, p.accent);
    if (fx > u * 12) { hollySprig(c, fx - u * 7, h - sh - u * 2, u * 14, -0.2, p); hollySprig(c, fx + fw + u * 7, h - sh - u * 2, u * 14, 2.6, p); }
    return q;
  };

  FR.sleigh = function (c, img, w, h, t, p, o, u) {
    var k = Math.min(w / 100, h / 112), cx = w / 2, pw = 60 * k, ph = Math.min(h - 47 * k, pw * 1.35), sy = h - 43 * k, px = cx - 33 * k, py = sy + 6 * k - ph, bob = Math.sin(t * 2.2) * k * 0.9, i;
    c.translate(0, bob);
    c.beginPath(); c.moveTo(cx + 40 * k, sy - 9 * k); c.quadraticCurveTo(cx + 46 * k, sy - 24 * k + bob, w, sy - 30 * k - bob); c.lineWidth = k * 0.9; c.strokeStyle = p.gold; c.stroke(); /* reins lead off to the team */
    for (i = 1; i <= 2; i++) dot(c, cx + (40 + i * 3.2) * k, sy - (9 + i * 6.4) * k, k * 1.5, p.gold);
    R(c, px - k * 1.6, py - k * 1.6, pw + k * 3.2, ph + k * 3.2, k * 1.5, p.paper);
    var q = photoRect(c, img, px, py, pw, ph, k * 0.8, p);
    bow(c, px + pw / 2, py - k * 1.2, k * 15, p.accent2);
    c.save(); c.translate(cx, sy); c.scale(k, k); var sw = ow; ow = 1.1;
    c.beginPath(); c.moveTo(-42, 38); c.lineTo(30, 38); c.bezierCurveTo(47, 38, 49, 22, 39, 20); c.lineCap = 'round'; c.lineWidth = 4.6; c.strokeStyle = shade(p.gold, -0.34); c.stroke(); c.lineWidth = 3; c.strokeStyle = p.gold; c.stroke();
    L(c, -24, 38, -22, 24, 2.6, p.gold); L(c, 18, 38, 16, 24, 2.6, p.gold);
    c.beginPath(); c.moveTo(-44, -18); c.bezierCurveTo(-48, 0, -44, 26, -30, 27); c.lineTo(22, 27); c.bezierCurveTo(40, 27, 46, 8, 44, -6); c.bezierCurveTo(42, -14, 32, -12, 33, -4); c.bezierCurveTo(30, 6, 22, 6, 14, 6); c.lineTo(-18, 6); c.bezierCurveTo(-28, 6, -31, -8, -34, -20); c.bezierCurveTo(-37, -26, -44, -24, -44, -18); c.closePath(); F(c, p.accent);
    c.beginPath(); c.moveTo(-37, 15); c.quadraticCurveTo(-10, 23, 26, 16); c.lineWidth = 1.6; c.strokeStyle = p.gold; c.stroke(); c.beginPath(); c.arc(-8, 16, 4, 0, PI * 1.5); c.stroke(); twinkle(c, 12, 13.5, 3 + Math.sin(t * 3), p.gold); dot(c, 38.5, -6, 3, p.gold);
    ow = sw; c.restore();
    q.h = Math.max(1, sy + 6 * k - q.y); q.y += bob; return q;
  };

  FR.wreath = function (c, img, w, h, t, p, o, u) {
    var r = Math.min(w, h) * 0.455, cx = w / 2, cy = h / 2 - r * 0.03, th = r * 0.3, a = Math.sin(t * 1.2) * 0.02, sw = ow;
    c.translate(cx, cy); c.rotate(a); c.translate(-cx, -cy);
    var q = photoCircle(c, img, cx, cy, r - th * 0.8, p);
    wreathRing(c, cx, cy, r, th, p, t, o.seed + 'w');
    ow = sw; bow(c, cx, cy + r - th * 0.6, r * 0.38, p.accent);
    q.x += th * 0.12; q.y += th * 0.12; q.w -= th * 0.24; q.h -= th * 0.24; q.a = a; q.px = cx; q.py = cy; return q;
  };

  FR.stamp = function (c, img, w, h, t, p, o, u) {
    var m = u * 3.5, d = u * 5.2, i, nx = Math.max(4, Math.round((w - m * 2) / d)), ny = Math.max(4, Math.round((h - m * 2) / d)), b = u * 8.5;
    c.fillStyle = p.paper; c.beginPath();
    for (i = 0; i <= nx; i++) { var x = m + (w - m * 2) * i / nx; c.moveTo(x + u * 2, m); c.arc(x, m, u * 2, 0, TAU); c.moveTo(x + u * 2, h - m); c.arc(x, h - m, u * 2, 0, TAU); }
    for (i = 0; i <= ny; i++) { var y = m + (h - m * 2) * i / ny; c.moveTo(m + u * 2, y); c.arc(m, y, u * 2, 0, TAU); c.moveTo(w - m + u * 2, y); c.arc(w - m, y, u * 2, 0, TAU); }
    c.fill(); c.fillRect(m, m, w - m * 2, h - m * 2);
    var q = photoRect(c, img, b, b, w - b * 2, h - b * 2, 0, p);
    c.lineWidth = u * 0.6; c.strokeStyle = p.accent; c.strokeRect(b - u * 1.4, b - u * 1.4, w - b * 2 + u * 2.8, h - b * 2 + u * 2.8);
    /* postmark: ring and waves in the lower right corner only */
    var mx = w - b - u * 9, my = h - b - u * 8, ink = alpha(p.ink, 0.6), wob = Math.sin(t * 1.5) * u * 0.3;
    c.save(); c.translate(mx, my); c.rotate(-0.2); ringStroke(c, 0, 0, u * 8, u * 0.8, ink); ringStroke(c, 0, 0, u * 5.6, u * 0.5, ink); starPath(c, 0, 0, u * 3, u * 1.3, 5, 0); c.fillStyle = ink; c.fill();
    c.lineWidth = u * 0.8; c.strokeStyle = ink;
    for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-u * 9, i * u * 3.2); for (var j = 0; j < 4; j++) c.quadraticCurveTo(-u * (11 + j * 5), i * u * 3.2 + (j % 2 ? 1 : -1) * (u * 1.8 + wob), -u * (13.5 + j * 5), i * u * 3.2); c.stroke(); }
    c.restore();
    return q;
  };

  FR.window = function (c, img, w, h, t, p, o, u) {
    var th = u * 6, sill = u * 9, top = u * 4, fx = u * 4, fw = w - u * 8, fh = h - sill - top, i, R0 = rnd(o.seed + 'win');
    R(c, fx, top, fw, fh, u * 2, WOOD2);
    var q = photoRect(c, img, fx + th, top + th, fw - th * 2, fh - th * 2, u, p), fr = Math.min(q.w, q.h) * 0.19;
    c.save(); rrp(c, q.x, q.y, q.w, q.h, u); c.clip();
    for (i = 0; i < 4; i++) { var gx = q.x + (i % 2 ? q.w : 0), gy = q.y + (i > 1 ? q.h : 0), g = c.createRadialGradient(gx, gy, 0, gx, gy, fr * (i > 1 ? 1.25 : 1)); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.55, 'rgba(235,246,255,0.55)'); g.addColorStop(1, 'rgba(235,246,255,0)'); c.fillStyle = g; c.fillRect(gx - fr * 1.3, gy - fr * 1.3, fr * 2.6, fr * 2.6); }
    for (i = 0; i < 4; i++) twinkle(c, q.x + (i % 2 ? q.w - fr * 0.45 : fr * 0.45), q.y + (i > 1 ? q.h - fr * 0.4 : fr * 0.4), u * (1.6 + Math.sin(t * 2.5 + i * 1.3) * 0.8), '#fff');
    c.restore();
    c.lineWidth = u * 1; c.strokeStyle = shade(WOOD2, -0.3); c.strokeRect(q.x, q.y, q.w, q.h);
    c.fillStyle = p.snow; c.beginPath(); c.moveTo(fx - u, top + u * 2.4); c.quadraticCurveTo(fx + fw * 0.25, top - u * 4.5, fx + fw * 0.5, top - u * 1.5); c.quadraticCurveTo(fx + fw * 0.8, top - u * 5, fx + fw + u, top + u * 2.4); c.quadraticCurveTo(fx + fw * 0.5, top + u * 4.4, fx - u, top + u * 2.4); c.fill();
    for (i = 0; i < 6; i++) { var ix = q.x + q.w * (0.08 + 0.84 * i / 5), il = u * (3 + R0() * 4.5); c.beginPath(); c.moveTo(ix - u * 1.2, q.y - u * 0.4); c.lineTo(ix, q.y + il); c.lineTo(ix + u * 1.2, q.y - u * 0.4); c.closePath(); c.fillStyle = 'rgba(232,245,255,0.92)'; c.fill(); }
    R(c, 0, h - sill, w, sill - u, u * 2, shade(WOOD2, 0.12));
    c.fillStyle = p.snow; c.beginPath(); c.moveTo(u, h - sill + u * 1.4); c.bezierCurveTo(w * 0.2, h - sill - u * 5.5, w * 0.4, h - sill - u * 1, w * 0.55, h - sill - u * 2.4); c.bezierCurveTo(w * 0.75, h - sill - u * 5.5, w * 0.9, h - sill - u * 2, w - u, h - sill + u * 1.4); c.closePath(); c.fill();
    q.h = Math.min(q.h, h - sill - u * 3 - q.y); return q;
  };

  FR.tv = function (c, img, w, h, t, p, o, u) {
    var bw = w - u * 4, bh = Math.min(h - u * 24, bw * 0.98), bx = u * 2, by = (h - bh) / 2 + u * 3, pan = u * 17, i, k = Math.exp(-5 * o.beat);
    L(c, w / 2, by, w / 2 - u * 16, by - u * 13, u * 1.2, '#c9cfd6'); L(c, w / 2, by, w / 2 + u * 14, by - u * 14, u * 1.2, '#c9cfd6'); dot(c, w / 2 - u * 16, by - u * 13, u * 1.6, p.accent); dot(c, w / 2 + u * 14, by - u * 14, u * 1.6, p.accent2); E(c, w / 2, by, u * 5, u * 2.2, '#4a4654');
    Pg(c, [[bx + u * 12, by + bh - u], [bx + u * 20, by + bh - u], [bx + u * 12, by + bh + u * 8], [bx + u * 8, by + bh + u * 8]], WOOD); Pg(c, [[bx + bw - u * 12, by + bh - u], [bx + bw - u * 20, by + bh - u], [bx + bw - u * 12, by + bh + u * 8], [bx + bw - u * 8, by + bh + u * 8]], WOOD);
    R(c, bx, by, bw, bh, u * 8, WOOD2); R(c, bx + u * 3, by + u * 3, bw - u * 6, bh - u * 6, u * 6, shade(WOOD2, 0.16));
    var sx = bx + u * 7, sy = by + u * 7, sw2 = bw - u * 14 - pan, sh2 = bh - u * 14;
    R(c, sx - u * 2, sy - u * 2, sw2 + u * 4, sh2 + u * 4, u * 9, '#3b3340');
    var q = photoRect(c, img, sx, sy, sw2, sh2, u * 7.5, p);
    c.save(); rrp(c, sx, sy, sw2, sh2, u * 7.5); c.clip(); c.fillStyle = 'rgba(255,255,255,0.14)'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + sw2 * 0.34, sy); c.lineTo(sx, sy + sh2 * 0.26); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.05)'; var ly = sy + frac(t * 0.15) * sh2; c.fillRect(sx, ly, sw2, u * 2); c.restore();
    var kx = bx + bw - u * 5 - pan / 2;
    for (i = 0; i < 2; i++) { E(c, kx, sy + u * 6 + i * u * 14, u * 5, u * 5, p.gold); var ka = t * (i ? -0.6 : 0.4) + i * 2; L(c, kx, sy + u * 6 + i * u * 14, kx + Math.cos(ka) * u * 4, sy + u * 6 + i * u * 14 + Math.sin(ka) * u * 4, u * 1.2, '#3b3340'); }
    for (i = 0; i < 5; i++) { var gy2 = sy + u * 30 + i * u * 3.6; if (gy2 < by + bh - u * 9) L(c, kx - u * 5, gy2, kx + u * 5, gy2, u * 1.3, shade(WOOD2, -0.3)); }
    dot(c, kx, by + bh - u * 6, u * (1.3 + k * 0.5), alpha(p.accent, 0.5 + 0.5 * k));
    q.x += u * 2.2; q.w -= u * 4.4; q.y += u * 2.2; q.h -= u * 4.4; return q;
  };

  function chain(c, x1, y1, x2, y2, u, col) { var n = Math.max(3, Math.round(Math.hypot(x2 - x1, y2 - y1) / (u * 2.6))), i; for (i = 0; i <= n; i++) { c.beginPath(); c.arc(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n, u * 0.95, 0, TAU); c.lineWidth = u * 0.6; c.strokeStyle = i % 2 ? col : shade(col, -0.2); c.stroke(); } }
  FR.locket = function (c, img, w, h, t, p, o, u) {
    var s = Math.min(w * 0.85, (h - u * 15) * 1.0), cx = w / 2, cy = h - s * 0.5 - u * 3, a = Math.sin(t * 1.2) * 0.02, ps = s * 0.84, top = cy - s * 0.3;
    c.translate(cx, 0); c.rotate(a); c.translate(-cx, 0);
    chain(c, cx - u * 14, 0, cx - u * 1.5, top - u * 3, u, p.gold); chain(c, cx + u * 14, 0, cx + u * 1.5, top - u * 3, u, p.gold);
    ringStroke(c, cx, top - u * 1, u * 3, u * 1.5, shade(p.gold, -0.15));
    heartPath(c, cx, cy, s); F(c, p.gold);
    heartPath(c, cx, cy, s * 0.93); c.lineWidth = u * 0.7; c.strokeStyle = shade(p.gold, 0.45); c.stroke();
    c.save(); heartPath(c, cx, cy, ps); c.clip(); drawPhoto(c, img, cx - ps * 0.54, cy - ps * 0.48, ps * 1.08, ps * 0.98, p); c.restore();
    heartPath(c, cx, cy, ps); c.lineWidth = u * 1.1; c.strokeStyle = shade(p.gold, -0.25); c.stroke();
    c.beginPath(); c.arc(cx - s * 0.25, cy - s * 0.2, s * 0.2, PI * 1.05, PI * 1.45); c.lineWidth = u * 1.6; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke();
    twinkle(c, cx + s * 0.4, cy - s * 0.36, u * (3.5 + Math.sin(t * 3) * 1.5), '#fffbe6'); twinkle(c, cx - s * 0.2, cy + s * 0.32, u * (2.2 + Math.cos(t * 3.4) * 1), '#fffbe6');
    return { x: cx - ps * 0.52, y: cy - ps * 0.45, w: ps * 1.04, h: ps * 0.9, a: a, px: cx, py: 0 };
  };

  FR.tag = function (c, img, w, h, t, p, o, u) {
    var top = u * 9, th = h - top - u * 2, tw = Math.min(w * 0.86, th * 0.8), cx = w / 2, a = Math.sin(t * 1.25) * 0.03, x0 = cx - tw / 2, ch = tw * 0.2, m = u * 5.5, i;
    c.translate(cx, top + u * 6); c.rotate(a); c.translate(-cx, -top - u * 6);
    c.beginPath(); c.moveTo(cx, top + u * 6); c.bezierCurveTo(cx - u * 10, top - u * 2, cx - u * 4, -u * 4, cx + u * 3, 0); c.moveTo(cx, top + u * 6); c.bezierCurveTo(cx + u * 12, top, cx + u * 12, -u * 2, cx + u * 7, 0); c.lineWidth = u * 1.1; c.strokeStyle = p.accent; c.stroke();
    Rn(c, x0 + u * 1.5, top + u * 2, tw, th, u * 2, 'rgba(0,0,0,0.16)');
    c.beginPath(); c.moveTo(x0 + ch, top); c.lineTo(x0 + tw - ch, top); c.lineTo(x0 + tw, top + ch); c.lineTo(x0 + tw, top + th - u * 3); c.quadraticCurveTo(x0 + tw, top + th, x0 + tw - u * 3, top + th); c.lineTo(x0 + u * 3, top + th); c.quadraticCurveTo(x0, top + th, x0, top + th - u * 3); c.lineTo(x0, top + ch); c.closePath(); F(c, p.paper);
    c.setLineDash([u * 2, u * 1.6]); c.beginPath(); c.moveTo(x0 + ch + u, top + u * 2.4); c.lineTo(x0 + tw - ch - u, top + u * 2.4); c.lineTo(x0 + tw - u * 2.4, top + ch + u); c.lineTo(x0 + tw - u * 2.4, top + th - u * 2.4); c.lineTo(x0 + u * 2.4, top + th - u * 2.4); c.lineTo(x0 + u * 2.4, top + ch + u); c.closePath(); c.lineWidth = u * 0.7; c.strokeStyle = p.accent; c.stroke(); c.setLineDash([]);
    E(c, cx, top + u * 6, u * 3.6, u * 3.6, p.gold); dot(c, cx, top + u * 6, u * 1.9, shade(p.paper, -0.5));
    var py = top + Math.max(ch, u * 11) + u, q = photoRect(c, img, x0 + m, py, tw - m * 2, top + th - m - py - u * 8, u * 1.2, p);
    c.lineWidth = u * 0.6; c.strokeStyle = alpha(p.ink, 0.25); c.strokeRect(q.x, q.y, q.w, q.h);
    for (i = -2; i <= 2; i++) { if (i === 0) { heartPath(c, cx, top + th - u * 7, u * 4.4); c.fillStyle = p.accent; c.fill(); } else twinkle(c, cx + i * u * 8, top + th - u * 7, u * (1.6 + 0.6 * Math.sin(t * 3 + i)), i % 2 ? p.gold : p.accent2); }
    if (o.festive) hollySprig(c, x0 + tw - ch * 0.55, top + ch * 0.7, u * 13, 0.6, p);
    q.a = a; q.px = cx; q.py = top + u * 6; return q;
  };

  FR.film = function (c, img, w, h, t, p, o, u) {
    var sw2 = Math.min(w * 0.96, h * 0.86), x0 = (w - sw2) / 2, side = sw2 * 0.115, cw = sw2 - side * 2, ch = Math.min(h - u * 22, cw * 1.25), cy0 = (h - ch) / 2, dk = '#1f1b24', i, gap = u * 3;
    c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
    Rn(c, x0, -u, sw2, h + u * 2, 0, dk);
    Rn(c, x0 + side, cy0 - gap - ch, cw, ch, u, '#3a3442'); Rn(c, x0 + side, cy0 + ch + gap, cw, ch, u, '#3a3442');
    var pitch = sw2 * 0.105, n = Math.ceil(h / pitch) + 1;
    for (i = 0; i < n; i++) { var hy = i * pitch + pitch * 0.2; Rn(c, x0 + side * 0.22, hy, side * 0.56, pitch * 0.58, u * 0.8, '#efe8da'); Rn(c, x0 + sw2 - side * 0.78, hy, side * 0.56, pitch * 0.58, u * 0.8, '#efe8da'); }
    var q = photoRect(c, img, x0 + side, cy0, cw, ch, u, p);
    c.fillStyle = alpha(p.gold, 0.8); c.font = 'bold ' + (u * 3.2).toFixed(1) + 'px sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
    for (i = 0; i < 3; i++) Pg(c, [[x0 + side + u * 2 + i * u * 4, cy0 - gap / 2 - u * 0.9], [x0 + side + u * 4.4 + i * u * 4, cy0 - gap / 2], [x0 + side + u * 2 + i * u * 4, cy0 - gap / 2 + u * 0.9]], alpha(p.gold, 0.85), true);
    var fl = 0.04 + 0.03 * Math.sin(t * 11) + 0.02 * Math.sin(t * 27); Rn(c, q.x, q.y, q.w, q.h, u, 'rgba(255,240,200,' + Math.max(0, fl).toFixed(3) + ')'); /* projector flicker */
    c.restore(); return q;
  };

  FR.starcut = function (c, img, w, h, t, p, o, u) {
    var ro = Math.min(w / 2.02, h / 1.92), ri = ro * 0.6, cx = w / 2, cy = (h - ro * 1.81) / 2 + ro, gb = '#c8894a', a = Math.sin(t * 1.1) * 0.025, pr = ro * 0.84, pi = ri * 0.96, i;
    c.translate(cx, cy); c.rotate(a); c.translate(-cx, -cy); c.lineJoin = 'round';
    starPath(c, cx, cy, ro * 0.93, ri * 1.02, 5, 0); c.lineWidth = ro * 0.13 + ow * 2; c.strokeStyle = shade(gb, -0.34); c.stroke(); c.lineWidth = ro * 0.13; c.strokeStyle = gb; c.stroke(); c.fillStyle = gb; c.fill();
    c.save(); starPath(c, cx, cy, pr, pi, 5, 0); c.clip(); drawPhoto(c, img, cx - pr * 1.25, cy - pr * 1.02, pr * 2.5, pr * 2.5, p); c.restore();
    starPath(c, cx, cy, pr, pi, 5, 0); c.lineWidth = u * 3.2; c.strokeStyle = p.snow; c.stroke(); c.lineWidth = u * 0.6; c.strokeStyle = shade(p.snow, -0.2); c.stroke();
    for (i = 0; i < 10; i++) { var an = -PI / 2 + i * PI / 5, rr = (i % 2 ? ri : ro) * 0.955, col = [p.accent, p.accent2, p.gold][i % 3]; if (i % 2 === 0) { dot(c, cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, u * 1.7, col); dot(c, cx + Math.cos(an) * rr - u * 0.5, cy + Math.sin(an) * rr - u * 0.5, u * 0.5, 'rgba(255,255,255,0.8)'); } }
    twinkle(c, cx + ro * 0.62, cy - ro * 0.72, u * (3 + Math.sin(t * 3) * 1.4), p.gold);
    return { x: cx - pr * 0.6, y: cy - pr * 0.62, w: pr * 1.2, h: pr * 1.26, a: a, px: cx, py: cy };
  };

  function archPath(c, x, y, w, h) { var r = w / 2; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + r); c.arc(x + r, y + r, r, PI, 0); c.lineTo(x + w, y + h); c.closePath(); }
  FR.arch = function (c, img, w, h, t, p, o, u) {
    var aw = Math.min(w - u * 2, (h - u * 2) * 0.8), ah = h - u * 2, x0 = (w - aw) / 2, y0 = u, band = aw * 0.13, lead = '#2a2236', glass = [p.accent, '#3f7fd0', p.gold, p.accent2, '#8a4fc0'], i;
    var ix = x0 + band, iy = y0 + band, iw = aw - band * 2, ih = ah - band - u * 5, R1 = aw / 2, R2 = iw / 2, cx = w / 2, cyA = y0 + R1;
    archPath(c, x0, y0, aw, ah); F(c, lead);
    var sw = ow, n = 9; ow = 0;
    for (i = 0; i < n; i++) { /* glass around the arch */
      var a1 = PI + i * PI / n + 0.025, a2 = PI + (i + 1) * PI / n - 0.025, col = glass[i % 5], gl = 0.12 + 0.12 * Math.sin(t * 1.6 + i * 1.9);
      c.beginPath(); c.arc(cx, cyA, R1 - u * 1.6, a1, a2); c.arc(cx, cyA, R2 + u * 1.6, a2, a1, true); c.closePath(); c.fillStyle = shade(col, gl); c.fill();
    }
    var rows = Math.max(2, Math.round((ah - R1) / (band * 1.5))), rh = (ah - R1 - u * 2) / rows;
    for (i = 0; i < rows; i++) for (var s = 0; s < 2; s++) { var col2 = glass[(i * 2 + s * 3 + 1) % 5], gx = s ? x0 + aw - band + u * 1.6 : x0 + u * 1.6, gy = cyA + i * rh + u * 0.8, gl2 = 0.12 + 0.12 * Math.sin(t * 1.6 + i * 2.3 + s); Rn(c, gx, gy, band - u * 3.2, rh - u * 1.6, u * 0.6, shade(col2, gl2)); Pg(c, [[gx + (band - u * 3.2) / 2, gy + u], [gx + band - u * 4.2, gy + rh / 2 - u * 0.8], [gx + (band - u * 3.2) / 2, gy + rh - u * 2.6], [gx + u, gy + rh / 2 - u * 0.8]], 'rgba(255,255,255,0.22)', true); }
    ow = sw;
    c.save(); archPath(c, ix, iy, iw, ih); c.clip(); drawPhoto(c, img, ix, iy, iw, ih, p); c.restore();
    archPath(c, ix, iy, iw, ih); c.lineWidth = u * 1.5; c.strokeStyle = p.gold; c.stroke();
    archPath(c, x0 + u * 0.8, y0 + u * 0.8, aw - u * 1.6, ah - u * 1.6); c.lineWidth = u * 1.1; c.strokeStyle = p.gold; c.stroke();
    R(c, x0 - u * 0.5, y0 + ah - u * 5, aw + u, u * 5, u * 1.2, p.gold); for (i = 1; i < 8; i++) dot(c, x0 + aw * i / 8, y0 + ah - u * 2.5, u * 0.9, lead);
    starPath(c, cx, y0 + band * 0.5, band * 0.42, band * 0.18, 4, 0); c.fillStyle = shade(p.gold, 0.3 + 0.2 * Math.sin(t * 3)); c.fill();
    return { x: ix, y: iy + R2 * 0.29, w: iw, h: ih - R2 * 0.29 - u * 4 };
  };

  FR.bubble = function (c, img, w, h, t, p, o, u) {
    var r = Math.min(w * 0.375, h * 0.33), cx = w * 0.55, cy = h * 0.46, bob = Math.sin(t * 1.3) * u * 1.2, i, moon = '#fff0b0';
    c.translate(0, bob);
    for (i = 0; i < 3; i++) { var sx = cx - r * 0.5 + i * r * 0.75, sl = u * (5 + (i % 2) * 5) + Math.sin(t * 1.5 + i) * u; L(c, sx, -bob, sx, cy - r - sl - u * 3, u * 0.5, alpha(p.snow, 0.7)); starPath(c, sx, cy - r - sl, u * 3.6, u * 1.6, 5, Math.sin(t * 2 + i) * 0.3); F(c, i === 1 ? p.snow : p.gold); }
    E(c, cx - r * 0.2, cy + r * 0.13, r * 1.22, r * 1.22, moon); /* the moon cradles the photo */
    dot(c, cx - r * 1.2, cy + r * 0.2, r * 0.07, shade(moon, -0.1)); dot(c, cx - r * 1.02, cy + r * 0.75, r * 0.05, shade(moon, -0.1)); dot(c, cx - r * 0.5, cy + r * 1.16, r * 0.06, shade(moon, -0.1));
    var q = photoCircle(c, img, cx, cy, r, p);
    ringStroke(c, cx, cy, r, u * 2.2, p.snow); ringStroke(c, cx, cy, r + u * 1.1, u * 0.5, shade(moon, -0.2));
    var sw = ow; ow = u * 0.6;
    cloud(c, cx - r * 0.75, cy + r * 1.05, r * 1.1, p.snow); cloud(c, cx + r * 0.55, cy + r * 1.12, r * 1.25, p.snow); cloud(c, cx - r * 0.05, cy + r * 1.3, r * 0.9, shade(p.snow, -0.06));
    ow = sw;
    c.beginPath(); c.arc(cx - r * 1.0, cy - r * 0.42, r * 0.07, PI * 0.1, PI * 0.9); c.lineWidth = u * 0.9; c.strokeStyle = '#a08a4a'; c.stroke(); dot(c, cx - r * 1.06, cy - r * 0.2, r * 0.07, 'rgba(240,96,110,0.4)');
    twinkle(c, cx + r * 1.05, cy - r * 0.75, u * (3 + Math.sin(t * 3) * 1.2), p.snow); twinkle(c, cx - r * 1.1, cy - r * 1.05, u * (2.4 + Math.cos(t * 2.6) * 1), p.snow);
    q.y += bob; q.h -= r * 0.12; return q;
  };

  FR.badge = function (c, img, w, h, t, p, o, u) {
    var top = u * 13, bh = h - top - u * 2, bw = Math.min(w * 0.8, bh * 0.74), cx = w / 2, x0 = cx - bw / 2, a = Math.sin(t * 1.3) * 0.03, m = u * 6, hd = u * 12, i, R0 = rnd(o.seed + 'bar');
    c.translate(cx, 0); c.rotate(a); c.translate(-cx, 0);
    L(c, cx - u * 13, 0, cx - u * 2, top - u * 2, u * 3.4, shade(p.accent2, -0.34)); L(c, cx + u * 13, 0, cx + u * 2, top - u * 2, u * 3.4, shade(p.accent2, -0.34)); L(c, cx - u * 13, 0, cx - u * 2, top - u * 2, u * 2.4, p.accent2); L(c, cx + u * 13, 0, cx + u * 2, top - u * 2, u * 2.4, p.accent2);
    for (i = 1; i < 4; i++) { dot(c, cx - u * 13 + i * u * 2.75, (top - u * 2) * i / 4, u * 0.6, p.snow); dot(c, cx + u * 13 - i * u * 2.75, (top - u * 2) * i / 4, u * 0.6, p.snow); }
    R(c, cx - u * 3, top - u * 5, u * 6, u * 8, u * 1.2, '#c9cfd6');
    Rn(c, x0 + u * 1.5, top + u * 2, bw, bh, u * 4, 'rgba(0,0,0,0.16)'); R(c, x0, top, bw, bh, u * 4, '#fdfdfb');
    c.save(); rrp(c, x0, top, bw, bh, u * 4); c.clip(); c.fillStyle = p.accent; c.fillRect(x0, top, bw, hd); c.fillStyle = p.gold; c.fillRect(x0, top + hd, bw, u * 1.2); c.restore();
    Rn(c, cx - u * 5, top + u * 2.2, u * 10, u * 2.6, u * 1.3, shade(p.accent, -0.4));
    for (i = -1; i <= 1; i += 2) { starPath(c, cx + i * bw * 0.32, top + hd * 0.58, u * 2.6, u * 1.1, 5, 0); c.fillStyle = p.snow; c.fill(); }
    var py = top + hd + u * 5, q = photoRect(c, img, x0 + m, py, bw - m * 2, bh * 0.6, u * 2, p);
    c.lineWidth = u * 0.7; c.strokeStyle = alpha(p.ink, 0.2); rrp(c, q.x, q.y, q.w, q.h, u * 2); c.stroke();
    var ly = q.y + q.h + u * 4.5; Rn(c, x0 + m, ly, bw * 0.5, u * 3, u * 1.5, alpha(p.ink, 0.75)); Rn(c, x0 + m, ly + u * 5, bw * 0.34, u * 2, u, alpha(p.ink, 0.3));
    var bx = x0 + bw - m - bw * 0.26; for (i = 0; i < 9; i++) { var ww = u * (0.5 + R0() * 1.1); if (bx + ww > x0 + bw - m) break; Rn(c, bx, ly, ww, Math.min(u * 8, top + bh - ly - u * 3), 0, alpha(p.ink, 0.8)); bx += ww + u * (0.5 + R0() * 0.8); }
    if (o.festive) hollySprig(c, x0 + bw - u * 5, top + hd + u * 1, u * 12, 0.5, p);
    q.a = a; q.px = cx; q.py = 0; return q;
  };

  FR.bowl = function (c, img, w, h, t, p, o, u) {
    var r = Math.min(w * 0.47, (h - u * 12) * 0.48), cx = w / 2, cy = r + u * 2, i, band = r * 0.15, k = Math.exp(-5 * o.beat), col = alpha(p.paper, 0.85), sw = ow;
    ow = 0; var m = Math.min(w, h); paw(c, m * 0.09, h - m * 0.1, m * 0.15, -0.4, col); paw(c, w - m * 0.09, h - m * 0.1, m * 0.15, 0.4, col);
    if (h - (cy + r) > m * 0.2 || w - r * 2 > m * 0.2) { paw(c, m * 0.08, m * 0.09, m * 0.12, -0.5, col); paw(c, w - m * 0.08, m * 0.09, m * 0.12, 0.5, col); }
    ow = sw;
    E(c, cx, cy, r, r, p.accent); ringStroke(c, cx, cy, r - band * 0.2, u * 0.5, shade(p.accent, 0.3)); ringStroke(c, cx, cy, r - band * 0.84, u * 0.5, shade(p.accent, 0.3));
    for (i = 0; i < 16; i++) { var an = (i + 0.5) / 16 * TAU; if (Math.abs(an - PI / 2) < 0.3) continue; dot(c, cx + Math.cos(an) * (r - band * 0.52), cy + Math.sin(an) * (r - band * 0.52), u * 1.5, p.gold); dot(c, cx + Math.cos(an) * (r - band * 0.52) - u * 0.4, cy + Math.sin(an) * (r - band * 0.52) - u * 0.4, u * 0.5, 'rgba(255,255,255,0.75)'); }
    var q = photoCircle(c, img, cx, cy, r - band, p); ringStroke(c, cx, cy, r - band, u * 1, p.gold);
    var ta = Math.sin(t * 3) * 0.12 * (0.5 + k); /* the bone tag swings from the collar */
    c.save(); c.translate(cx, cy + r - band * 0.5); c.rotate(ta); ringStroke(c, 0, u * 2.2, u * 2.4, u * 1, shade(p.gold, -0.15)); bone(c, 0, u * 9.5, u * 30, 0, p.gold); ow = 0; paw(c, 0, u * 9.2, u * 6, 0, shade(p.gold, -0.35)); ow = sw; c.restore();
    return q;
  };

  FR.plain = function (c, img, w, h, t, p, o, u) {
    var m = u * 8, i, g = p.gold;
    Rn(c, 0, 0, w, h, u * 1, p.paper);
    c.lineWidth = u * 0.9; c.strokeStyle = g; c.strokeRect(u * 1.8, u * 1.8, w - u * 3.6, h - u * 3.6); c.lineWidth = u * 0.4; c.strokeRect(u * 4.4, u * 4.4, w - u * 8.8, h - u * 8.8);
    var q = photoRect(c, img, m, m, w - m * 2, h - m * 2, u * 0.5, p);
    c.lineWidth = u * 0.5; c.strokeStyle = shade(g, -0.2); c.strokeRect(m, m, w - m * 2, h - m * 2);
    for (i = 0; i < 4; i++) { /* corner flourishes: a little curl each way and a twinkle */
      var sx = i % 2 ? -1 : 1, sy = i > 1 ? -1 : 1; c.save(); c.translate(i % 2 ? w : 0, i > 1 ? h : 0); c.scale(sx, sy);
      Rn(c, u * 0.6, u * 0.6, u * 7.6, u * 7.6, u, p.paper);
      c.beginPath(); c.moveTo(u * 1.8, u * 12); c.quadraticCurveTo(u * 1.8, u * 1.8, u * 12, u * 1.8); c.moveTo(u * 4.4, u * 10); c.bezierCurveTo(u * 4, u * 5, u * 7.4, u * 3.4, u * 8, u * 6.2); c.moveTo(u * 10, u * 4.4); c.bezierCurveTo(u * 5, u * 4, u * 3.4, u * 7.4, u * 6.2, u * 8); c.lineWidth = u * 0.7; c.strokeStyle = g; c.stroke();
      twinkle(c, u * 3.3, u * 3.3, u * (1.5 + 0.5 * Math.sin(t * 2.5 + i * 1.6)), g); c.restore();
    }
    Pg(c, [[w / 2, u * 1.4], [w / 2 + u * 3, u * 3.1], [w / 2, u * 4.8], [w / 2 - u * 3, u * 3.1]], g, true); Pg(c, [[w / 2, h - u * 1.4], [w / 2 + u * 3, h - u * 3.1], [w / 2, h - u * 4.8], [w / 2 - u * 3, h - u * 3.1]], g, true);
    return q;
  };

  //@@FRAMES

  function frame(name, ctx, img, x, y, w, h, t, pal, opts) {
    x = num(x, 0); y = num(y, 0); w = num(w, 0); h = num(h, 0);
    var f = FR[name] || FR.plain; if (!ctx || !(w > 2) || !(h > 2) || !f) return { x: x, y: y, w: Math.max(1, w), h: Math.max(1, h) };
    opts = opts || {};
    var o = { beat: frac(num(opts.beat, 0.5)), n: Math.floor(num(opts.n, 0)), seed: opts.seed == null ? 1 : opts.seed, festive: opts.festive !== false }, tilt = clamp(num(opts.tilt, 0), -0.35, 0.35);
    KB = { z: clamp(num(opts.zoom, 1), 1, 1.3), x: clamp(num(opts.panX, 0), -0.06, 0.06), y: clamp(num(opts.panY, 0), -0.06, 0.06), art: typeof opts.art === 'function' ? opts.art : null,
      fit: Array.isArray(opts.fit) && opts.fit.length === 3 ? [clamp(num(opts.fit[0], 0.5), 0, 1), clamp(num(opts.fit[1], 0.42), 0, 1), clamp(num(opts.fit[2], 1), 0.5, 4)] : null, solo: !!opts.solo, keep: !!opts.keep };
    var sc = 1 / (1 + 1.25 * (Math.abs(tilt) + 0.028)), u = Math.min(w, h) / 100, sow = ow, q, cx = x + w / 2, cy = y + h / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.rotate(tilt); ctx.translate(-w / 2, -h / 2); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ow = u * 0.9;
    try { q = f(ctx, img, w, h, num(t, 0), P(pal), o, u); } finally { ow = sow; KB = null; ctx.restore(); }
    if (!q) return { x: x, y: y, w: w, h: h };
    /* the photo's bounding box back in canvas space */
    var a = q.a || 0, ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt), minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, i;
    function tf(px, py) {
      var dx = px - (q.px || 0), dy = py - (q.py || 0), lx = (q.px || 0) + dx * ca - dy * sa - w / 2, ly = (q.py || 0) + dx * sa + dy * ca - h / 2;
      return [cx + sc * (lx * ct - ly * st), cy + sc * (lx * st + ly * ct)];
    }
    if (q.round) { var cc = tf(q.x + q.w / 2, q.y + q.h / 2), rr = q.w / 2 * sc; return { x: cc[0] - rr, y: cc[1] - rr, w: rr * 2, h: rr * 2 }; }
    for (i = 0; i < 4; i++) { var pt = tf(q.x + (i % 2 ? q.w : 0), q.y + (i > 1 ? q.h : 0)); minx = Math.min(minx, pt[0]); maxx = Math.max(maxx, pt[0]); miny = Math.min(miny, pt[1]); maxy = Math.max(maxy, pt[1]); }
    return { x: minx, y: miny, w: maxx - minx, h: maxy - miny };
  }
  CarolArt.frame = frame;
  CarolArt.frames = ['ornament', 'snowglobe', 'polaroid', 'mantel', 'sleigh', 'wreath', 'stamp', 'window', 'tv', 'locket', 'tag', 'film', 'starcut', 'arch', 'bubble', 'badge', 'bowl', 'plain'];

  /* ---------- backdrops (paint the whole W x H canvas; u = 1% of the short side) ---------- */
  function vgrad(c, W, H, stops, y0, y1) { var g = c.createLinearGradient(0, y0 || 0, 0, y1 == null ? H : y1), i; for (i = 0; i < stops.length; i++) g.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), stops[i]); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  function vignette(c, W, H, col, a) { var g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.56); g.addColorStop(0, alpha(col, 0)); g.addColorStop(1, alpha(col, a)); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  function glow(c, x, y, r, col, a) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, alpha(col, a)); g.addColorStop(1, alpha(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  function skyStars(c, W, H, n, seed, t, maxY, col) {
    var R0 = rnd(seed + 'st'), i, u = Math.min(W, H) / 100; c.fillStyle = col || '#fff';
    for (i = 0; i < n; i++) { var x = R0() * W, y = R0() * maxY, s = u * (0.12 + R0() * 0.32), tw = 0.45 + 0.55 * Math.sin(t * (0.8 + R0() * 2.2) + R0() * 6.3); c.globalAlpha = 0.35 + 0.65 * tw; if (i % 9 === 0) twinkle(c, x, y, s * 3.6, col || '#fff'); else { c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); } }
    c.globalAlpha = 1;
  }
  function hill(c, W, H, y, amp, col, seed, f) { /* a rolling hill from y down to the bottom */
    var R0 = rnd(seed + 'h'), a1 = R0() * 6.3, a2 = R0() * 6.3, i, n = 24; f = f || 1;
    c.beginPath(); c.moveTo(0, H); for (i = 0; i <= n; i++) { var x = i / n; c.lineTo(x * W, y + (Math.sin(x * 4.2 * f + a1) * 0.65 + Math.sin(x * 9.3 * f + a2) * 0.35) * amp); } c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.fill();
    return function (x) { x = x / W; return y + (Math.sin(x * 4.2 * f + a1) * 0.65 + Math.sin(x * 9.3 * f + a2) * 0.35) * amp; };
  }
  function pinesOn(c, W, fy, n, seed, hmin, hmax, col, snow) { var R0 = rnd(seed + 'p'), i; for (i = 0; i < n; i++) { var x = (i + 0.15 + R0() * 0.7) / n * W, hh = hmin + R0() * (hmax - hmin); pine(c, x, fy(x) + hh * 0.06, hh, i % 2 ? col : shade(col, -0.1), snow, 3); } }
  function moonDisc(c, x, y, r, col) { glow(c, x, y, r * 3.2, col, 0.22); dot(c, x, y, r, col); dot(c, x - r * 0.3, y - r * 0.2, r * 0.18, shade(col, -0.08)); dot(c, x + r * 0.25, y + r * 0.3, r * 0.12, shade(col, -0.08)); dot(c, x + r * 0.3, y - r * 0.4, r * 0.09, shade(col, -0.08)); }
  function houseSil(c, x, base, w, h, col, t, i, snow, lit) { /* little house: snowy roof, lit windows */
    Rn(c, x, base - h, w, h + 2, 0, col); Pg(c, [[x - w * 0.1, base - h], [x + w / 2, base - h - w * 0.45], [x + w * 1.1, base - h]], shade(col, -0.15), true);
    c.beginPath(); c.moveTo(x - w * 0.12, base - h + w * 0.02); c.lineTo(x + w / 2, base - h - w * 0.47); c.lineTo(x + w * 1.12, base - h + w * 0.02); c.lineTo(x + w * 0.98, base - h + w * 0.03); c.lineTo(x + w / 2, base - h - w * 0.34); c.lineTo(x + w * 0.02, base - h + w * 0.03); c.closePath(); c.fillStyle = snow; c.fill();
    Rn(c, x + w * 0.7, base - h - w * 0.42, w * 0.14, w * 0.3, 0, shade(col, -0.15)); Rn(c, x + w * 0.68, base - h - w * 0.46, w * 0.18, w * 0.06, w * 0.03, snow);
    var rows = Math.max(1, Math.floor(h / (w * 0.42))), r, k;
    for (r = 0; r < rows; r++) for (k = 0; k < 2; k++) { var on = ((i * 7 + r * 3 + k * 5) % 5) !== 0, fl = 0.85 + 0.15 * Math.sin(t * 3 + i + r + k * 2); Rn(c, x + w * (0.16 + k * 0.42), base - h + w * 0.12 + r * w * 0.42, w * 0.24, w * 0.24, w * 0.03, on ? alpha(lit, fl) : shade(col, 0.12)); }
  }
  var BD = {};

  BD.snowyhills = function (c, W, H, t, p, o, u) {
    vgrad(c, W, H, [shade(p.bg, -0.15), p.bg, p.bg2, '#c98aa8', '#f7b79a', '#ffe0b0'], 0, H * 0.66);
    skyStars(c, W, H, 46, o.seed, t, H * 0.4);
    moonDisc(c, W * 0.78, H * 0.14, u * 6.5, '#fff6d8');
    var f1 = hill(c, W, H, H * 0.58, u * 5, '#b9c3e6', o.seed + 1, 0.8); pinesOn(c, W, f1, 9, o.seed + 1, u * 5, u * 9, '#5a7a9a', '#dfe8f7');
    var f2 = hill(c, W, H, H * 0.66, u * 4.5, '#dbe3f6', o.seed + 2, 1.2); pinesOn(c, W, f2, 6, o.seed + 2, u * 9, u * 15, '#3f7a68', '#f1f5fc');
    var hx = W * 0.2, hy = f2(hx); /* a far cottage with a warm window */
    houseSil(c, hx, hy + u * 0.5, u * 6.5, u * 4.4, '#7c5a58', t, 1, '#f4f7fd', '#ffd97a'); glow(c, hx + u * 3, hy - u * 2, u * 9, '#ffd97a', 0.25);
    var f3 = hill(c, W, H, H * 0.76, u * 4, '#eef2fb', o.seed + 3, 0.7);
    pine(c, W * 0.07, f3(W * 0.07) + u * 2, u * 26, '#2f6e58', p.snow, 4); pine(c, W * 0.93, f3(W * 0.93) + u * 2, u * 31, '#2a6450', p.snow, 4); pine(c, W * 0.84, f3(W * 0.84) + u * 1, u * 17, '#35785f', p.snow, 3);
    hill(c, W, H, H * 0.88, u * 2.5, p.snow, o.seed + 4, 1.1);
  };

  BD.nightvillage = function (c, W, H, t, p, o, u) {
    vgrad(c, W, H, [shade(p.bg, -0.35), p.bg, p.bg2, shade(p.bg2, 0.25)], 0, H * 0.75);
    skyStars(c, W, H, 70, o.seed, t, H * 0.55); moonDisc(c, W * 0.2, H * 0.13, u * 7, '#fff6d8');
    var R0 = rnd(o.seed + 'v'), i, far = shade(p.bg2, -0.2), base = H * 0.7, x = -u * 3;
    hill(c, W, H, H * 0.6, u * 6, shade(p.bg2, -0.1), o.seed + 1, 0.7);
    i = 0; while (x < W) { var w = u * (7 + R0() * 5), h = u * (5 + R0() * 9); houseSil(c, x, base - u * 6, w, h, far, t, i + 3, alpha(p.snow, 0.75), '#ffd98a'); x += w * 1.25; i++; }
    hill(c, W, H, base - u * 2.5, u * 1.5, shade(p.snow, -0.22), o.seed + 2, 1.5);
    x = -u * 5; i = 0; var cols = ['#7a4a52', '#5d5a7e', '#8a5a44', '#4f6a7a'];
    while (x < W) { var w2 = u * (13 + R0() * 7), h2 = u * (9 + R0() * 11), bx = x, by = base + u * 5; houseSil(c, bx, by, w2, h2, cols[i % 4], t, i, p.snow, '#ffe08a'); glow(c, bx + w2 / 2, by - h2 / 2, w2 * 0.9, '#ffd98a', 0.12);
      var f = frac(t * 0.12 + i * 0.37), k; for (k = 0; k < 3; k++) { var ff = frac(f + k / 3); dot(c, bx + w2 * 0.77 + Math.sin(ff * 5 + i) * u * 1.4 + ff * u * 3, by - h2 - w2 * 0.46 - ff * u * 11, u * (0.9 + ff * 2), 'rgba(255,255,255,' + (0.3 * (1 - ff)).toFixed(3) + ')'); }
      x += w2 * 1.28; i++; }
    var fg = hill(c, W, H, base + u * 5, u * 2.2, shade(p.snow, -0.08), o.seed + 3, 1.1); hill(c, W, H, H * 0.86, u * 3, p.snow, o.seed + 4, 0.8);
    pine(c, W * 0.05, fg(W * 0.05) + u * 9, u * 24, '#2a6450', p.snow, 4); pine(c, W * 0.96, fg(W * 0.96) + u * 8, u * 20, '#2f6e58', p.snow, 4);
  };

  function windowNight(c, x, y, w, h, t, seed, u, frameCol, sky1, sky2) { /* a window with night and falling snow outside */
    var R0 = rnd(seed + 'wn'), i, th = u * 1.6;
    Rn(c, x - th, y - th, w + th * 2, h + th * 2, u * 0.8, frameCol);
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, sky1); g.addColorStop(1, sky2); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = '#eef3fb'; c.beginPath(); c.ellipse(x + w * 0.3, y + h * 1.05, w * 0.6, h * 0.22, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + w * 0.85, y + h * 1.06, w * 0.5, h * 0.2, 0, 0, TAU); c.fill();
    pine(c, x + w * 0.2, y + h * 0.9, h * 0.42, '#2f6e58', '#eef3fb', 3); pine(c, x + w * 0.82, y + h * 0.92, h * 0.3, '#2a6450', '#eef3fb', 3);
    c.fillStyle = 'rgba(255,255,255,0.9)'; for (i = 0; i < 26; i++) { var fx = x + frac(R0() + Math.sin(t * 0.5 + i) * 0.02) * w, fy = y + frac(R0() + t * (0.05 + R0() * 0.06)) * h; c.beginPath(); c.arc(fx, fy, u * (0.25 + R0() * 0.4), 0, TAU); c.fill(); }
    c.restore();
    Rn(c, x + w / 2 - th * 0.4, y, th * 0.8, h, 0, frameCol); Rn(c, x, y + h * 0.5 - th * 0.4, w, th * 0.8, 0, frameCol);
    Rn(c, x - th * 2, y + h + th * 0.6, w + th * 4, th * 1.5, th * 0.5, shade(frameCol, 0.15));
  }
  function garland(c, x1, y1, x2, y2, sag, n, u, o, t) { /* evergreen swag with twinkling lights */
    var i, k = Math.exp(-5 * o.beat), cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + sag * 2;
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(cx, cy, x2, y2); c.lineCap = 'round'; c.lineWidth = u * 3; c.strokeStyle = '#256b4a'; c.stroke(); c.lineWidth = u * 1.4; c.setLineDash([u * 1.6, u * 1.6]); c.strokeStyle = '#3d9468'; c.stroke(); c.setLineDash([]);
    for (i = 0; i < n; i++) { var f = (i + 0.5) / n, bx = (1 - f) * (1 - f) * x1 + 2 * (1 - f) * f * cx + f * f * x2, by = (1 - f) * (1 - f) * y1 + 2 * (1 - f) * f * cy + f * f * y2, lit = (i + o.n) % 2 === 0, col = BULBS[i % 5]; if (lit) dot(c, bx, by + u * 0.6, u * (2.2 + k * 1.2), alpha(col, 0.3)); dot(c, bx, by + u * 0.6, u * 0.95, lit ? col : shade(col, -0.3)); }
  }

  BD.livingroom = function (c, W, H, t, p, o, u) {
    var fl = H * 0.8, i, wall = p.bg, st = W / Math.max(6, Math.round(W / (u * 12)));
    c.fillStyle = wall; c.fillRect(0, 0, W, fl);
    c.fillStyle = shade(wall, 0.07); for (i = 0; i * st < W; i += 2) c.fillRect(i * st, 0, st, fl); /* wallpaper stripes with tiny sprigs */
    for (i = 0; i * st < W; i++) for (var j = 0; j * u * 14 < fl; j++) { var mx = i * st + st / 2, my = j * u * 14 + ((i % 2) ? u * 7 : u * 2); twinkle(c, mx, my, u * 1.1, alpha(p.gold, 0.5)); }
    vgrad2(c, 0, 0, W, fl, alpha('#000000', 0.22), alpha('#000000', 0));
    var ww = Math.min(W * 0.46, u * 52), wh = Math.min(H * 0.22, ww * 0.8), wx = W / 2 - ww / 2, wy = H * 0.07;
    windowNight(c, wx, wy, ww, wh, t, o.seed, u, p.paper, '#16264a', '#3a5a94');
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(W / 2 + i * (ww / 2 + u * 4.5), wy - u * 3); c.lineTo(W / 2 + i * (ww / 2 - u * 4), wy - u * 3); c.quadraticCurveTo(W / 2 + i * (ww / 2 - u * 2), wy + wh * 0.5, W / 2 + i * (ww / 2 + u * 1), wy + wh * 0.72); c.lineTo(W / 2 + i * (ww / 2 + u * 2.5), wy + wh + u * 4); c.lineTo(W / 2 + i * (ww / 2 + u * 6.5), wy + wh + u * 4); c.closePath(); c.fillStyle = p.accent; c.fill(); Rn(c, W / 2 + i * (ww / 2 + u * 1) - u * 2.4, wy + wh * 0.7, u * 4.8, u * 1.6, u * 0.8, p.gold); }
    Rn(c, wx - u * 7, wy - u * 4.6, ww + u * 14, u * 1.8, u * 0.9, p.gold);
    garland(c, 0, u * 1.5, W / 2, u * 1.5, u * 3, 7, u, o, t); garland(c, W / 2, u * 1.5, W, u * 1.5, u * 3, 7, u, o, t);
    Rn(c, 0, fl - u * 5, W, u * 5, 0, p.paper); Rn(c, 0, fl - u * 5, W, u * 0.8, 0, shade(p.paper, -0.15));
    c.fillStyle = '#9a6a45'; c.fillRect(0, fl, W, H - fl); c.fillStyle = '#86593a'; var pl = (H - fl) / 4; for (i = 0; i < 4; i++) { c.fillRect(0, fl + i * pl, W, u * 0.35); for (j = 0; j < 5; j++) c.fillRect(frac(i * 0.37 + j * 0.23) * W, fl + i * pl, u * 0.35, pl); }
    c.beginPath(); c.ellipse(W / 2, fl + (H - fl) * 0.56, W * 0.44, (H - fl) * 0.36, 0, 0, TAU); c.fillStyle = shade(p.accent, -0.12); c.fill(); /* rug */
    c.beginPath(); c.ellipse(W / 2, fl + (H - fl) * 0.56, W * 0.4, (H - fl) * 0.3, 0, 0, TAU); c.lineWidth = u * 0.9; c.strokeStyle = p.gold; c.stroke(); c.beginPath(); c.ellipse(W / 2, fl + (H - fl) * 0.56, W * 0.3, (H - fl) * 0.2, 0, 0, TAU); c.fillStyle = p.accent; c.fill();
    glow(c, W / 2, fl, Math.max(W, H) * 0.5, '#ffcf8a', 0.14);
  };
  function vgrad2(c, x, y, w, h, c1, c2) { var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2); c.fillStyle = g; c.fillRect(x, y, w, h); }

  BD.office = function (c, W, H, t, p, o, u) {
    var cub = H * 0.56, fl = H * 0.86, i, j, R0 = rnd(o.seed + 'of'), wall = '#e6e2d8';
    c.fillStyle = wall; c.fillRect(0, 0, W, cub);
    var ww = Math.min(W * 0.62, u * 70), wh = Math.min(H * 0.28, u * 44), wx = W * 0.5 - ww / 2, wy = H * 0.08; /* window with a dusk skyline */
    Rn(c, wx - u * 1.5, wy - u * 1.5, ww + u * 3, wh + u * 3, u * 0.8, '#b9c0c8');
    var g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#22335e'); g.addColorStop(0.7, '#8a6a9a'); g.addColorStop(1, '#f2a98a'); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
    c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
    var x = wx - u; i = 0; while (x < wx + ww) { var bw = u * (4 + R0() * 5), bh = wh * (0.3 + R0() * 0.55); c.fillStyle = i % 2 ? '#1c2748' : '#263560'; c.fillRect(x, wy + wh - bh, bw, bh); c.fillStyle = '#ffd98a'; for (j = 0; j < 12; j++) { if (R0() < 0.45) { var fx = x + u * 0.8 + (j % 3) * (bw - u * 1.6) / 3, fy = wy + wh - bh + u * 1 + Math.floor(j / 3) * u * 2.4; if (fy < wy + wh - u) { c.globalAlpha = 0.7 + 0.3 * Math.sin(t * 2 + i + j); c.fillRect(fx, fy, u * 0.8, u * 1); } } } c.globalAlpha = 1; x += bw + u * 0.4; i++; }
    c.fillStyle = 'rgba(255,255,255,0.85)'; for (i = 0; i < 18; i++) { c.beginPath(); c.arc(wx + frac(R0() + Math.sin(t * 0.4 + i) * 0.02) * ww, wy + frac(R0() + t * (0.04 + R0() * 0.05)) * wh, u * 0.35, 0, TAU); c.fill(); }
    c.restore(); Rn(c, wx + ww / 3 - u * 0.4, wy, u * 0.8, wh, 0, '#b9c0c8'); Rn(c, wx + ww * 2 / 3 - u * 0.4, wy, u * 0.8, wh, 0, '#b9c0c8');
    var cl = Math.min(u * 6, wx * 0.36); if (cl > u * 2.5) { dot(c, wx * 0.5, wy + u * 8, cl, '#fdfdfb'); c.beginPath(); c.arc(wx * 0.5, wy + u * 8, cl, 0, TAU); c.lineWidth = u * 0.8; c.strokeStyle = p.ink; c.stroke(); L(c, wx * 0.5, wy + u * 8, wx * 0.5 + Math.cos(t * 0.1 - 1.5) * cl * 0.7, wy + u * 8 + Math.sin(t * 0.1 - 1.5) * cl * 0.7, u * 0.6, p.ink); L(c, wx * 0.5, wy + u * 8, wx * 0.5 + cl * 0.42, wy + u * 8 - cl * 0.2, u * 0.8, p.accent); }
    c.fillStyle = '#8fa3b5'; c.fillRect(0, cub, W, fl - cub); /* cubicle wall: fabric panels */
    var pw = W / Math.max(2, Math.round(W / (u * 38))); for (i = 0; i * pw < W; i++) { Rn(c, i * pw + u * 1.2, cub + u * 3.4, pw - u * 2.4, fl - cub - u * 5, u * 1.2, i % 2 ? '#9db0c1' : '#97abbd'); }
    c.fillStyle = 'rgba(255,255,255,0.07)'; for (i = 0; i < 60; i++) c.fillRect(R0() * W, cub + u * 4 + R0() * (fl - cub - u * 7), u * 2, u * 0.25);
    Rn(c, 0, cub, W, u * 2.6, 0, '#6f8191');
    var notes = [p.gold, '#ff9ab0', '#9ee0b0', p.gold]; for (i = 0; i < 4; i++) { var nx = (i < 2 ? u * 5 + i * u * 9 : W - u * 13 - (i - 2) * u * 9), ny = cub + u * 8 + (i % 2) * u * 5; c.save(); c.translate(nx, ny); c.rotate((i - 1.5) * 0.07); Rn(c, 0, 0, u * 7, u * 7, u * 0.3, notes[i]); L(c, u * 1.2, u * 2.4, u * 5.6, u * 2.4, u * 0.4, alpha(p.ink, 0.45)); L(c, u * 1.2, u * 4.2, u * 4.4, u * 4.2, u * 0.4, alpha(p.ink, 0.45)); dot(c, u * 3.5, u * 0.7, u * 0.6, p.accent); c.restore(); }
    var seg = Math.max(2, Math.round(W / (u * 34))); for (i = 0; i < seg; i++) garland(c, i * W / seg, cub + u * 0.6, (i + 1) * W / seg, cub + u * 0.6, u * 2.6, 6, u, o, t);
    c.fillStyle = '#5d6672'; c.fillRect(0, fl, W, H - fl); c.fillStyle = 'rgba(255,255,255,0.05)'; for (i = 0; i < 40; i++) c.fillRect(R0() * W, fl + R0() * (H - fl), u * 1.5, u * 0.3);
    Rn(c, 0, fl, W, u * 0.8, 0, '#4a525d');
  };

  BD.holynight = function (c, W, H, t, p, o, u) {
    vgrad(c, W, H, ['#060b24', '#0e1a47', '#1d2f6e', '#3b4a8c'], 0, H * 0.72);
    skyStars(c, W, H, 110, o.seed, t, H * 0.66);
    var sx = W * 0.62, sy = H * 0.17, pu = 1 + Math.sin(t * 1.6) * 0.05, gy = H * 0.7, i;
    var g = c.createLinearGradient(0, sy, 0, gy); g.addColorStop(0, 'rgba(255,240,190,0.4)'); g.addColorStop(1, 'rgba(255,240,190,0)'); /* the beam falls on the town */
    c.fillStyle = g; c.beginPath(); c.moveTo(sx - u * 0.4, sy); c.lineTo(sx - u * 7, gy); c.lineTo(sx + u * 5, gy); c.lineTo(sx + u * 0.4, sy); c.closePath(); c.fill();
    glow(c, sx, sy, u * 26, '#fff0be', 0.4);
    c.fillStyle = '#fff6da'; c.beginPath(); c.moveTo(sx, sy - u * 15 * pu); c.quadraticCurveTo(sx + u * 0.8, sy - u * 0.8, sx + u * 11 * pu, sy); c.quadraticCurveTo(sx + u * 0.8, sy + u * 0.8, sx, sy + u * 24 * pu); c.quadraticCurveTo(sx - u * 0.8, sy + u * 0.8, sx - u * 11 * pu, sy); c.quadraticCurveTo(sx - u * 0.8, sy - u * 0.8, sx, sy - u * 15 * pu); c.fill();
    c.save(); c.translate(sx, sy); c.rotate(PI / 4); twinkle(c, 0, 0, u * 6 * pu, '#fff6da'); c.restore(); dot(c, sx, sy, u * 1.8, '#ffffff');
    hill(c, W, H, H * 0.62, u * 4, '#2a2f66', o.seed + 1, 0.6);
    var R0 = rnd(o.seed + 'town'), x = sx - u * 20, base = H * 0.66, tc = '#161a3e'; i = 0; /* tiny town: flat roofs and domes */
    while (x < sx + u * 18) { var w = u * (2.6 + R0() * 3), h = u * (2 + R0() * 4.5); c.fillStyle = tc; c.fillRect(x, base - h, w, h + u * 3); if (i % 3 === 1) { c.beginPath(); c.arc(x + w / 2, base - h, w * 0.42, PI, 0); c.fill(); } if (R0() < 0.6) { c.fillStyle = 'rgba(255,214,130,' + (0.75 + 0.25 * Math.sin(t * 2 + i)).toFixed(3) + ')'; c.fillRect(x + w * 0.35, base - h * 0.6, u * 0.55, u * 0.8); } x += w + u * 0.1; i++; }
    var f2 = hill(c, W, H, H * 0.68, u * 3.5, '#1b1f4c', o.seed + 2, 0.9);
    for (i = 0; i < 2; i++) { var px = W * (i ? 0.9 : 0.1), py = f2(px) + u, ph = u * (13 + i * 4), j; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + u * 1.5, py - ph * 0.5, px + u * (i ? -1 : 1), py - ph); c.lineWidth = u * 0.9; c.strokeStyle = '#11143a'; c.lineCap = 'round'; c.stroke(); for (j = 0; j < 6; j++) { var a = -PI * 0.95 + j * PI * 0.18 + Math.sin(t * 0.8 + j) * 0.03, tx = px + u * (i ? -1 : 1), ty = py - ph; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * u * 4, ty + Math.sin(a) * u * 4 - u * 1.5, tx + Math.cos(a) * u * 6.5, ty + Math.sin(a) * u * 3 + u * 2); c.lineWidth = u * 0.8; c.stroke(); } }
    hill(c, W, H, H * 0.78, u * 3, '#141740', o.seed + 3, 0.7); hill(c, W, H, H * 0.9, u * 2, '#0d1030', o.seed + 4, 1.2);
    glow(c, sx - u, gy, u * 22, '#fff0be', 0.16);
  };

  BD.sunburst = function (c, W, H, t, p, o, u) {
    var cx = W / 2, cy = H * 0.45, n = 28, i, r = Math.hypot(W, H), rot = t * 0.05, k = Math.exp(-4 * o.beat), R0 = rnd(o.seed + 'sb');
    c.fillStyle = p.bg; c.fillRect(0, 0, W, H);
    c.fillStyle = p.bg2; c.beginPath(); for (i = 0; i < n; i += 2) { var a1 = rot + i / n * TAU, a2 = rot + (i + 1) / n * TAU; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r); c.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r); c.closePath(); } c.fill();
    glow(c, cx, cy, Math.min(W, H) * 0.75, p.paper, 0.4);
    for (i = 0; i < 3; i++) { c.beginPath(); c.arc(cx, cy, u * (46 + i * 3.4 + k * 1.2), 0, TAU); c.lineWidth = u * 0.6; c.strokeStyle = alpha(p.paper, 0.35 - i * 0.09); c.stroke(); }
    for (i = 0; i < 14; i++) { /* atomic-age sparkles */
      var x = R0() * W, y = R0() * H, s = u * (2 + R0() * 4) * (1 + 0.25 * Math.sin(t * 2 + i)), col = [p.gold, p.paper, p.accent, p.accent2][i % 4]; if (Math.hypot(x - cx, y - cy) < u * 30) continue;
      if (i % 3 === 0) { twinkle(c, x, y, s * 1.5, col); } else if (i % 3 === 1) { for (var j = 0; j < 4; j++) L(c, x - Math.cos(j * PI / 4) * s, y - Math.sin(j * PI / 4) * s, x + Math.cos(j * PI / 4) * s, y + Math.sin(j * PI / 4) * s, u * 0.45, col); dot(c, x, y, u * 0.8, col); } else { c.beginPath(); c.arc(x, y, s * 0.6, 0, TAU); c.lineWidth = u * 0.5; c.strokeStyle = col; c.stroke(); dot(c, x, y, s * 0.2, col); }
    }
    vignette(c, W, H, shade(p.bg, -0.5), 0.35);
  };

  BD.grid80s = function (c, W, H, t, p, o, u) {
    var hz = H * 0.58, i, cx = W / 2, sr = Math.min(W * 0.3, H * 0.2), k = Math.exp(-4 * o.beat);
    vgrad(c, W, H, ['#07131f', '#0d2a2c', shade(p.accent2, -0.45), shade(p.accent, -0.3), p.accent], 0, hz);
    skyStars(c, W, H, 50, o.seed, t, hz * 0.7);
    glow(c, cx, hz - sr * 0.4, sr * 2.4, p.gold, 0.25 + 0.1 * k);
    c.save(); c.beginPath(); c.rect(0, 0, W, hz); c.clip(); /* the striped sun */
    var g = c.createLinearGradient(0, hz - sr * 1.6, 0, hz); g.addColorStop(0, '#fff2b0'); g.addColorStop(0.5, p.gold); g.addColorStop(1, p.accent); c.fillStyle = g; c.beginPath(); c.arc(cx, hz - sr * 0.55, sr, 0, TAU); c.fill();
    c.fillStyle = shade(p.accent, -0.3); for (i = 0; i < 6; i++) { var sy = hz - sr * 0.95 + i * sr * 0.17 + frac(t * 0.08) * sr * 0.17; c.fillRect(cx - sr, sy, sr * 2, sr * (0.02 + i * 0.016)); }
    c.restore();
    var R0 = rnd(o.seed + 'g8'); for (i = 0; i < 12; i++) { var px = (i + R0() * 0.6) / 12 * W; if (Math.abs(px - cx) < sr * 0.75) continue; pine(c, px, hz + u * 0.5, u * (6 + R0() * 9), '#06221c', null, 3); }
    vgrad2(c, 0, hz, W, H - hz, '#0a2622', '#03100e');
    c.strokeStyle = alpha(p.accent2 === DEF.accent2 ? '#4dffa6' : p.accent2, 0.9); c.lineWidth = Math.max(1, u * 0.28); c.beginPath();
    for (i = -14; i <= 14; i++) { c.moveTo(cx + i * W * 0.03, hz); c.lineTo(cx + i * W * 0.24, H); }
    var ph = frac(t * 0.35); for (i = 0; i < 12; i++) { var z = (i + ph) / 12, y = hz + (H - hz) * z * z; c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
    vgrad2(c, 0, hz, W, (H - hz) * 0.4, alpha(p.accent, 0.5), alpha(p.accent, 0));
    Rn(c, 0, hz - u * 0.25, W, u * 0.5, 0, '#fff2b0');
  };

  BD.plaid = function (c, W, H, t, p, o, u) {
    var s = Math.max(W, H) / (W > H * 0.8 ? 4 : 5), i, nx = Math.ceil(W / s) + 1, ny = Math.ceil(H / s) + 1;
    c.fillStyle = p.accent; c.fillRect(0, 0, W, H);
    for (i = 0; i < nx; i++) { var x = i * s; c.fillStyle = alpha(shade(p.accent2, -0.3), 0.55); c.fillRect(x + s * 0.12, 0, s * 0.34, H); c.fillStyle = alpha(p.ink, 0.28); c.fillRect(x + s * 0.62, 0, s * 0.12, H); c.fillStyle = alpha(p.gold, 0.8); c.fillRect(x + s * 0.285, 0, s * 0.014, H); c.fillStyle = alpha(p.snow, 0.55); c.fillRect(x + s * 0.86, 0, s * 0.012, H); }
    for (i = 0; i < ny; i++) { var y = i * s; c.fillStyle = alpha(shade(p.accent2, -0.3), 0.55); c.fillRect(0, y + s * 0.12, W, s * 0.34); c.fillStyle = alpha(p.ink, 0.28); c.fillRect(0, y + s * 0.62, W, s * 0.12); c.fillStyle = alpha(p.gold, 0.8); c.fillRect(0, y + s * 0.285, W, s * 0.014); c.fillStyle = alpha(p.snow, 0.55); c.fillRect(0, y + s * 0.86, W, s * 0.012); }
    c.save(); c.globalAlpha = 0.07; c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, u * 0.22); c.beginPath(); var d = u * 1.1; for (i = -H; i < W; i += d) { c.moveTo(i, 0); c.lineTo(i + H, H); } c.stroke(); c.restore(); /* twill weave */
    vignette(c, W, H, '#1a0a0a', 0.45); glow(c, W / 2, H * 0.45, Math.max(W, H) * 0.6, '#fff0d0', 0.1 + 0.02 * Math.sin(t * 1.5));
  };

  function miniIcon(c, kind, x, y, s, p, col) { /* tiny flat icons for patterns; s = size */
    switch (kind) {
      case 0: Pg(c, [[x, y - s * 0.5], [x + s * 0.3, y - s * 0.05], [x - s * 0.3, y - s * 0.05]], col, true); Pg(c, [[x, y - s * 0.22], [x + s * 0.4, y + s * 0.34], [x - s * 0.4, y + s * 0.34]], col, true); Rn(c, x - s * 0.07, y + s * 0.34, s * 0.14, s * 0.16, 0, '#8a5a34'); dot(c, x, y - s * 0.5, s * 0.08, p.gold); break;
      case 1: starPath(c, x, y, s * 0.46, s * 0.2, 5, 0.2); c.fillStyle = col; c.fill(); break;
      case 2: Rn(c, x - s * 0.36, y - s * 0.2, s * 0.72, s * 0.58, s * 0.05, col); Rn(c, x - s * 0.07, y - s * 0.2, s * 0.14, s * 0.58, 0, p.gold); Rn(c, x - s * 0.36, y + s * 0.02, s * 0.72, s * 0.12, 0, p.gold); E(c, x - s * 0.13, y - s * 0.3, s * 0.13, s * 0.09, p.gold, 0.5); E(c, x + s * 0.13, y - s * 0.3, s * 0.13, s * 0.09, p.gold, -0.5); break;
      case 3: c.beginPath(); c.moveTo(x - s * 0.12, y + s * 0.45); c.lineTo(x - s * 0.12, y - s * 0.2); c.arc(x + s * 0.08, y - s * 0.2, s * 0.2, PI, 0); c.lineCap = 'round'; c.lineWidth = s * 0.16; c.strokeStyle = p.snow; c.stroke(); c.setLineDash([s * 0.12, s * 0.14]); c.lineCap = 'butt'; c.strokeStyle = col; c.stroke(); c.setLineDash([]); c.lineCap = 'round'; break;
      case 4: E(c, x - s * 0.2, y, s * 0.28, s * 0.13, col, -0.5); E(c, x + s * 0.2, y, s * 0.28, s * 0.13, col, 0.5); dot(c, x, y - s * 0.04, s * 0.1, p.accent); dot(c, x + s * 0.02, y + s * 0.14, s * 0.09, p.accent); break;
      case 5: for (var i = 0; i < 3; i++) L(c, x - Math.cos(i * PI / 3) * s * 0.42, y - Math.sin(i * PI / 3) * s * 0.42, x + Math.cos(i * PI / 3) * s * 0.42, y + Math.sin(i * PI / 3) * s * 0.42, s * 0.08, col); dot(c, x, y, s * 0.1, col); break;
      case 6: heartPath(c, x, y, s * 0.8); c.fillStyle = col; c.fill(); break;
      default: dot(c, x, y + s * 0.06, s * 0.36, col); Rn(c, x - s * 0.09, y - s * 0.42, s * 0.18, s * 0.14, s * 0.03, p.gold); dot(c, x - s * 0.12, y - s * 0.06, s * 0.08, 'rgba(255,255,255,0.7)');
    }
  }
  BD.wrapping = function (c, W, H, t, p, o, u) {
    var cell = u * 14, nx = Math.ceil(W / cell) + 1, ny = Math.ceil(H / (cell * 0.86)) + 1, i, j, cols = [p.accent, p.accent2, p.gold, p.accent, p.accent2];
    c.fillStyle = p.paper; c.fillRect(0, 0, W, H);
    c.fillStyle = alpha(p.gold, 0.16); for (i = 0; i < nx * 2; i++) c.fillRect(i * cell * 0.5 - u * 0.15, 0, u * 0.3, H);
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      var id = (i * 3 + j * 5) % 8, x = i * cell + (j % 2 ? cell / 2 : 0), y = j * cell * 0.86 + cell * 0.3, wob = Math.sin(t * 1.6 + i * 1.3 + j * 0.7) * 0.12;
      c.save(); c.translate(x, y); c.rotate(wob + ((i + j) % 3 - 1) * 0.12); miniIcon(c, id, 0, 0, u * 7.2, p, id === 0 || id === 4 ? p.accent2 : id === 1 ? p.gold : id === 5 ? shade(p.bg2, 0.2) : cols[(i + j * 2) % 5]); c.restore();
      dot(c, x + cell * 0.5, y + cell * 0.02, u * 0.5, alpha(p.gold, 0.5 + 0.4 * Math.sin(t * 3 + i + j)));
    }
    vignette(c, W, H, shade(p.gold, -0.5), 0.16);
  };

  function bunting(c, W, y, sag, n, u, t, cols) {
    var i; c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(W / 2, y + sag * 2, W, y); c.lineWidth = u * 0.4; c.strokeStyle = 'rgba(120,110,120,0.7)'; c.stroke();
    for (i = 0; i < n; i++) { var f = (i + 0.5) / n, x = f * W, yy = y + 4 * sag * f * (1 - f) * 0.5 * 2 * 0.5 + sag * 2 * 2 * f * (1 - f) * 0.5, sw = Math.sin(t * 1.6 + i * 0.9) * 0.1, s = W / n * 0.42; c.save(); c.translate(x, yy); c.rotate(sw + (0.5 - f) * -0.25); Pg(c, [[-s, 0], [s, 0], [0, s * 2.1]], cols[i % cols.length], true); dot(c, 0, s * 0.7, s * 0.22, 'rgba(255,255,255,0.7)'); c.restore(); }
  }
  BD.nursery = function (c, W, H, t, p, o, u) {
    var fl = H * 0.84, i, j, R0 = rnd(o.seed + 'nu'), past = ['#f9c6cf', '#bfe3d7', '#fde6a8', '#c6d8f5', '#e2cdf2'];
    vgrad(c, W, H, ['#dcefee', '#eef5ee', '#fdeee6'], 0, fl);
    c.fillStyle = 'rgba(255,255,255,0.6)'; for (j = 0; j * u * 9 < fl; j++) for (i = 0; i * u * 9 < W + u * 9; i++) { c.beginPath(); c.arc(i * u * 9 + (j % 2 ? u * 4.5 : 0), j * u * 9 + u * 3, u * 0.7, 0, TAU); c.fill(); }
    for (i = 0; i < 5; i++) { var cw = u * (18 + R0() * 16), cy = H * (0.14 + R0() * 0.5), sp = 0.006 + R0() * 0.008, cx = frac(R0() + t * sp) * (W + cw * 2) - cw; if (i === 2) cy = H * 0.3; cloud(c, cx + u * 0.6, cy + u * 0.8, cw, 'rgba(160,190,205,0.25)'); cloud(c, cx, cy, cw, '#ffffff'); }
    var mx = W * 0.82, my = H * 0.2; glow(c, mx, my, u * 20, '#fff0b0', 0.4); c.save(); c.translate(mx, my); c.rotate(-0.4); crescent(c, 0, 0, u * 7, '#ffe9a0'); c.restore();
    for (i = 0; i < 5; i++) { var sx = W * (0.1 + i * 0.13 + (i > 2 ? 0.05 : 0)), sl = H * (0.1 + frac(i * 0.37) * 0.09), sw = Math.sin(t * 1.2 + i * 1.4) * u * 0.8; if (Math.abs(sx - mx) < u * 9) continue; L(c, sx, u * 6, sx + sw, sl, u * 0.3, 'rgba(120,110,120,0.5)'); starPath(c, sx + sw, sl + u * 2.2, u * 2.6, u * 1.15, 5, sw * 0.05); c.fillStyle = i % 2 ? '#ffd97a' : '#ffffff'; c.fill(); }
    bunting(c, W, u * 2, u * 3.2, Math.max(7, Math.round(W / (u * 9))), u, t, past);
    c.fillStyle = '#ffffff'; c.fillRect(0, fl - u * 3.6, W, u * 3.6); c.fillStyle = '#e8ded6'; c.fillRect(0, fl - u * 3.6, W, u * 0.5);
    vgrad2(c, 0, fl, W, H - fl, '#f2dcc6', '#e9cdb4'); c.fillStyle = 'rgba(255,255,255,0.25)'; for (i = 1; i < 4; i++) c.fillRect(0, fl + (H - fl) * i / 4, W, u * 0.3);
    c.beginPath(); c.ellipse(W / 2, fl + (H - fl) * 0.55, W * 0.4, (H - fl) * 0.32, 0, 0, TAU); c.fillStyle = '#ffffff'; c.fill(); c.beginPath(); c.ellipse(W / 2, fl + (H - fl) * 0.55, W * 0.34, (H - fl) * 0.24, 0, 0, TAU); c.lineWidth = u * 0.8; c.setLineDash([u * 1.6, u * 1.6]); c.strokeStyle = past[0]; c.stroke(); c.setLineDash([]);
  };

  BD.windowfar = function (c, W, H, t, p, o, u) {
    var th = u * 7, sill = H * 0.88, i, R0 = rnd(o.seed + 'wf'), hz = H * 0.62;
    vgrad(c, W, H, ['#070b1e', '#111c44', '#27386e', '#5a5a92', '#c98a8e'], 0, hz);
    skyStars(c, W, H, 80, o.seed, t, hz * 0.85); moonDisc(c, W * 0.74, H * 0.16, u * 5, '#fff6d8');
    hill(c, W, H, hz - u * 6, u * 5, '#2a3566', o.seed + 1, 0.6); hill(c, W, H, hz - u * 2, u * 3, '#1d2650', o.seed + 2, 1.1);
    c.fillStyle = '#141b3d'; c.fillRect(0, hz, W, H - hz);
    for (i = 0; i < 90; i++) { /* the far town: a scatter of small lights and their shimmer on the water */
      var cl = R0() < 0.7 ? 0.5 + (R0() - 0.5) * 0.5 * R0() * 2 : R0(), x = cl * W, y = hz - R0() * u * 3, tw = 0.6 + 0.4 * Math.sin(t * (1 + R0() * 2) + i), col = i % 7 === 0 ? '#ff9a8a' : i % 5 === 0 ? '#bfe0ff' : '#ffd98a';
      c.globalAlpha = tw; c.fillStyle = col; c.fillRect(x, y, u * 0.5, u * 0.5); c.globalAlpha = tw * 0.22; c.fillRect(x, hz + (hz - y) + u * 0.5, u * 0.5, u * (2 + R0() * 5));
    }
    c.globalAlpha = 1; glow(c, W / 2, hz, W * 0.55, '#ffd98a', 0.16);
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (i = 0; i < 9; i++) c.fillRect(R0() * W, hz + u * 3 + R0() * (sill - hz - u * 4), u * (5 + R0() * 12), u * 0.25);
    var f = frac(t * 0.02 + 0.2), px = -u * 10 + f * (W + u * 20), py = H * 0.3 - f * H * 0.08; /* a small plane on its way, far off */
    c.setLineDash([u * 0.8, u * 1.3]); c.beginPath(); c.moveTo(px - u * 22, py + u * 4.4); c.quadraticCurveTo(px - u * 10, py + u * 1.2, px - u * 1.5, py + u * 0.3); c.lineWidth = u * 0.3; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke(); c.setLineDash([]);
    Pg(c, [[px + u * 2, py], [px - u * 1.6, py - u * 0.9], [px - u * 0.9, py], [px - u * 1.6, py + u * 0.9]], '#dfe6f5', true); dot(c, px + u * 0.4, py, u * 0.45, Math.sin(t * 6) > 0 ? '#ff6a6a' : '#ffffff');
    var R1 = rnd(o.seed + 'wfs'); c.fillStyle = 'rgba(255,255,255,0.8)'; for (i = 0; i < 30; i++) { c.beginPath(); c.arc(frac(R1() + Math.sin(t * 0.4 + i) * 0.015) * W, frac(R1() + t * (0.03 + R1() * 0.04)) * sill, u * (0.2 + R1() * 0.4), 0, TAU); c.fill(); }
    /* the room side: frame, sill, a candle keeping watch */
    var wd = '#5a3a2a', wd2 = '#7a5238';
    for (i = 0; i < 4; i++) { var gx = i % 2 ? W - th : th, gy = i > 1 ? sill : th, g = c.createRadialGradient(gx, gy, 0, gx, gy, u * 16); g.addColorStop(0, 'rgba(235,245,255,0.75)'); g.addColorStop(1, 'rgba(235,245,255,0)'); c.fillStyle = g; c.fillRect(gx - u * 16, gy - u * 16, u * 32, u * 32); }
    c.fillStyle = wd; c.fillRect(0, 0, W, th); c.fillRect(0, 0, th, H); c.fillRect(W - th, 0, th, H); c.fillStyle = wd2; c.fillRect(th * 0.72, th * 0.72, W - th * 1.44, th * 0.28); c.fillRect(th * 0.72, th * 0.72, th * 0.28, sill - th * 0.72); c.fillRect(W - th, th * 0.72, th * 0.28, sill - th * 0.72);
    c.fillStyle = wd2; c.fillRect(0, sill, W, H - sill); c.fillStyle = shade(wd2, 0.2); c.fillRect(0, sill, W, u * 1.4); c.fillStyle = wd; c.fillRect(0, sill + (H - sill) * 0.55, W, u * 0.5);
    var cx = W * 0.16, cy = sill + u * 0.4; glow(c, cx, cy - u * 9, u * 24, '#ffcf7a', 0.4 + 0.05 * Math.sin(t * 7));
    Rn(c, cx - u * 1.8, cy - u * 8, u * 3.6, u * 8, u * 0.6, p.paper); flame(c, cx, cy - u * 8.6, u * 2.4, u * 5, t, 1); E(c, cx, cy, u * 4, u * 1, p.gold);
    var sw = ow; ow = u * 0.5; hollySprig(c, W * 0.84, sill + u * 1, u * 12, -0.3, p); ow = sw;
  };

  function toy(c, kind, x, y, s, p, t) { /* small shelf toys; base centre at (x,y) */
    switch (kind) {
      case 0: giftBox(c, x, y, s * 0.8, s * 0.85, p.accent, p.gold); break;
      case 1: ball(c, x, y - s * 0.4, s * 0.4, s * 0.4, p.accent2); Rn(c, x - s * 0.4, y - s * 0.46, s * 0.8, s * 0.12, 0, p.gold); starPath(c, x, y - s * 0.4, s * 0.16, s * 0.07, 5, 0); c.fillStyle = p.snow; c.fill(); break;
      case 2: R(c, x - s * 0.5, y - s * 0.4, s * 0.4, s * 0.4, s * 0.04, p.gold); R(c, x - s * 0.06, y - s * 0.4, s * 0.4, s * 0.4, s * 0.04, '#58a4e0'); R(c, x - s * 0.28, y - s * 0.8, s * 0.4, s * 0.4, s * 0.04, p.accent); starPath(c, x - s * 0.08, y - s * 0.6, s * 0.12, s * 0.05, 5, 0); c.fillStyle = p.snow; c.fill(); break;
      case 3: R(c, x - s * 0.4, y - s * 0.62, s * 0.8, s * 0.62, s * 0.04, p.accent); Rn(c, x - s * 0.42, y - s * 0.66, s * 0.84, s * 0.12, s * 0.03, p.gold); Rn(c, x - s * 0.42, y - s * 0.1, s * 0.84, s * 0.12, s * 0.03, p.gold); c.beginPath(); for (var i = 0; i <= 6; i++) c.lineTo(x - s * 0.4 + i * s * 0.8 / 6, y - (i % 2 ? s * 0.12 : s * 0.52)); c.lineWidth = s * 0.04; c.strokeStyle = p.snow; c.stroke(); break;
      case 4: R(c, x - s * 0.5, y - s * 0.42, s * 0.58, s * 0.3, s * 0.05, p.accent2); R(c, x + s * 0.06, y - s * 0.7, s * 0.4, s * 0.58, s * 0.05, p.accent); R(c, x - s * 0.36, y - s * 0.66, s * 0.14, s * 0.26, s * 0.03, p.ink); Rn(c, x + s * 0.14, y - s * 0.6, s * 0.22, s * 0.2, s * 0.03, '#cdeaf5'); wheel(c, x - s * 0.28, y - s * 0.12, s * 0.13, p.gold); wheel(c, x + s * 0.26, y - s * 0.12, s * 0.13, p.gold); break;
      default: pine(c, x, y, s, PINE, p.snow, 3);
    }
  }
  BD.workshop = function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'ws'), bench = H * 0.86, pl = W / Math.max(5, Math.round(W / (u * 16))), wd = '#b98352';
    c.fillStyle = wd; c.fillRect(0, 0, W, H);
    for (i = 0; i * pl < W; i++) { c.fillStyle = i % 2 ? '#b27b4b' : '#c08a59'; c.fillRect(i * pl, 0, pl, bench); c.fillStyle = 'rgba(90,50,20,0.25)'; c.fillRect(i * pl, 0, u * 0.3, bench); for (j = 0; j < 3; j++) { c.fillStyle = 'rgba(90,50,20,0.14)'; c.beginPath(); c.ellipse(i * pl + pl * (0.3 + R0() * 0.4), R0() * bench, u * 0.8, u * 2.2, 0, 0, TAU); c.fill(); } }
    glow(c, W / 2, H * 0.4, Math.max(W, H) * 0.6, '#ffe0a0', 0.3);
    var sw = ow, ys = [H * 0.2, H * 0.38]; ow = u * 0.45;
    for (j = 0; j < 2; j++) { /* shelves of toys along the top, the middle stays calm */
      var sy = ys[j], n = Math.max(3, Math.round(W / (u * 17))), s = Math.min(u * 12, H * 0.1);
      for (i = 0; i < n; i++) { var tx = (i + 0.5) / n * W, wob = Math.sin(t * 2 + i + j * 3) * 0.02 * (((i + j) % 3) === 0 ? 3 : 1); c.save(); c.translate(tx, sy); c.rotate(wob); toy(c, (i * 2 + j * 3 + Math.floor(R0() * 2)) % 6, 0, 0, s * (0.85 + R0() * 0.3), p, t); c.restore(); }
      ow = 0; Rn(c, 0, sy, W, u * 2.2, 0, '#7a4f2e'); Rn(c, 0, sy, W, u * 0.7, 0, '#96663e'); Rn(c, 0, sy + u * 2.2, W, u * 1.2, 0, 'rgba(60,30,10,0.22)');
      for (i = 0; i < 2; i++) Pg(c, [[W * (0.12 + i * 0.76) - u * 1, sy + u * 2.2], [W * (0.12 + i * 0.76) + u * 1, sy + u * 2.2], [W * (0.12 + i * 0.76) + u * 1, sy + u * 7], [W * (0.12 + i * 0.76) - u * 1, sy + u * 4.5]], '#6b4326', true);
      ow = u * 0.45;
    }
    ow = 0; var seg = Math.max(2, Math.round(W / (u * 36))); for (i = 0; i < seg; i++) garland(c, i * W / seg, u * 1, (i + 1) * W / seg, u * 1, u * 2.4, 6, u, o, t);
    c.fillStyle = '#8a5a34'; c.fillRect(0, bench, W, H - bench); c.fillStyle = '#a9703f'; c.fillRect(0, bench, W, u * 2.4); c.fillStyle = 'rgba(60,30,10,0.3)'; c.fillRect(0, bench + u * 2.4, W, u * 0.8);
    for (i = 0; i < 9; i++) { var cxx = R0() * W, cyy = bench + u * 5 + R0() * (H - bench - u * 6); c.beginPath(); c.arc(cxx, cyy, u * (0.8 + R0()), 0.3, PI * 1.6); c.lineWidth = u * 0.4; c.strokeStyle = '#e9c99a'; c.stroke(); } /* wood shavings */
    ow = sw; vignette(c, W, H, '#3a1e0a', 0.4);
  };

  BD.forest = function (c, W, H, t, p, o, u) {
    var i, R0 = rnd(o.seed + 'fo'), gr = H * 0.8;
    vgrad(c, W, H, ['#0b1a36', '#17305a', '#2b4c7e', '#56789f'], 0, gr);
    skyStars(c, W, H, 40, o.seed, t, H * 0.4); moonDisc(c, W * 0.5, H * 0.16, u * 8, '#f4f8ff'); glow(c, W * 0.5, H * 0.16, Math.max(W, H) * 0.55, '#bcd6ff', 0.25);
    var f0 = hill(c, W, H, gr - u * 8, u * 2, '#6f8fb6', o.seed + 1, 1); pinesOn(c, W, f0, 12, o.seed + 1, u * 8, u * 16, '#3d5f86', '#9db8d8');
    for (i = 0; i < 9; i++) { var x = (i + R0() * 0.7) / 9 * W, w = u * (1.6 + R0() * 1.4); c.fillStyle = '#34507a'; c.fillRect(x, 0, w, gr); } /* far trunks */
    c.save(); c.globalAlpha = 0.1; c.fillStyle = '#dbe9ff'; for (i = 0; i < 5; i++) { var bx = W * (0.08 + i * 0.21); c.beginPath(); c.moveTo(W * 0.5 - u * 2 + i * u, H * 0.16); c.lineTo(bx - W * 0.05, gr); c.lineTo(bx + W * 0.05, gr); c.closePath(); c.fill(); } c.restore();
    hill(c, W, H, gr - u * 3, u * 2, '#c9d9ee', o.seed + 2, 1.3);
    for (i = 0; i < 7; i++) { /* near trunks stand to the sides, the middle is a clearing */
      var side = i % 2 ? 1 : -1, fx = 0.03 + R0() * 0.26, x2 = (side < 0 ? fx : 1 - fx) * W, w2 = u * (4 + R0() * 4), sway = Math.sin(t * 0.5 + i) * u * 0.3, col = i < 3 ? '#16233f' : '#1f3052', j;
      c.beginPath(); c.moveTo(x2 - w2 / 2 + sway, 0); c.lineTo(x2 + w2 / 2 + sway, 0); c.lineTo(x2 + w2 * 0.62, gr + u * 2); c.lineTo(x2 - w2 * 0.62, gr + u * 2); c.closePath(); c.fillStyle = col; c.fill();
      c.fillStyle = 'rgba(200,220,255,0.16)'; c.fillRect(x2 + (W * 0.5 > x2 ? w2 * 0.28 : -w2 * 0.5), 0, w2 * 0.2, gr);
      for (j = 0; j < 3; j++) { var by = H * (0.12 + R0() * 0.5), bl = u * (5 + R0() * 7) * (R0() < 0.5 ? 1 : -1); L(c, x2, by, x2 + bl, by - u * 3, u * 0.9, col); L(c, x2 + bl * 0.2, by - u * 1.6, x2 + bl * 0.95, by - u * 4, u * 0.5, '#e6eefb'); }
      c.fillStyle = '#e6eefb'; c.beginPath(); c.ellipse(x2, gr + u * 2, w2 * 1.3, u * 1.8, 0, 0, TAU); c.fill();
    }
    hill(c, W, H, gr + u * 2, u * 1.6, '#e6eefb', o.seed + 3, 0.9); hill(c, W, H, H * 0.91, u * 1.8, p.snow, o.seed + 4, 1.4);
    c.fillStyle = 'rgba(120,150,200,0.2)'; for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(W * (0.2 + i * 0.2), gr + u * 5 + (i % 2) * u * 4, u * 9, u * 1, 0, 0, TAU); c.fill(); }
  };

  function auroraBands(c, W, H, t, seed, y0, y1, cols) {
    var R0 = rnd(seed + 'au'), b, i, n = 26;
    for (b = 0; b < cols.length; b++) {
      var base = y0 + (y1 - y0) * (0.12 + b * 0.2), amp = (y1 - y0) * 0.1, ph = R0() * 6.3, sp = 0.12 + R0() * 0.14, hh = (y1 - y0) * (0.42 + R0() * 0.22);
      /* a curtain: crisp wavy lower hem that fades upward */
      var g = c.createLinearGradient(0, base - hh, 0, base + amp * 1.4); g.addColorStop(0, alpha(cols[b], 0)); g.addColorStop(0.7, alpha(cols[b], 0.16)); g.addColorStop(1, alpha(cols[b], 0.34)); c.fillStyle = g;
      c.beginPath(); c.moveTo(0, base - hh); c.lineTo(W, base - hh);
      for (i = n; i >= 0; i--) { var x = i / n; c.lineTo(x * W, base + Math.sin(x * 5 + ph + t * sp) * amp + Math.sin(x * 11 + ph * 2 - t * sp * 1.7) * amp * 0.4); } c.closePath(); c.fill();
      c.beginPath(); for (i = 0; i <= n; i++) { var xh = i / n; c.lineTo(xh * W, base + Math.sin(xh * 5 + ph + t * sp) * amp + Math.sin(xh * 11 + ph * 2 - t * sp * 1.7) * amp * 0.4); } /* soft glowing hem */
      c.lineCap = 'butt'; c.lineJoin = 'round'; c.lineWidth = amp * 1.5; c.strokeStyle = alpha(cols[b], 0.1); c.stroke(); c.lineWidth = amp * 0.7; c.strokeStyle = alpha(cols[b], 0.14); c.stroke(); c.lineWidth = amp * 0.2; c.strokeStyle = alpha(shade(cols[b], 0.5), 0.3); c.stroke();
      c.lineWidth = W / 110; c.lineCap = 'butt'; for (i = 0; i < 18; i++) { var xr = frac(R0() + t * 0.004 * (b + 1)), xx = xr * W, yy = base + Math.sin(xr * 5 + ph + t * sp) * amp + Math.sin(xr * 11 + ph * 2 - t * sp * 1.7) * amp * 0.4, ll = hh * (0.4 + R0() * 0.5), g3 = c.createLinearGradient(0, yy - ll, 0, yy); g3.addColorStop(0, alpha(cols[b], 0)); g3.addColorStop(1, alpha('#ffffff', 0.22)); c.strokeStyle = g3; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy - ll); c.stroke(); }
      c.lineCap = 'round';
    }
  }
  BD.icepond = function (c, W, H, t, p, o, u) {
    var hz = H * 0.6, i, R0 = rnd(o.seed + 'ip');
    vgrad(c, W, H, ['#050b22', '#0b1b3e', '#143056', '#2c5a70'], 0, hz);
    skyStars(c, W, H, 60, o.seed, t, hz * 0.8); auroraBands(c, W, H, t, o.seed, H * 0.03, hz * 0.95, ['#58f0b0', '#58c8ff', '#b08aff']);
    var f1 = hill(c, W, H, hz - u * 3, u * 3, '#27486a', o.seed + 1, 0.8); pinesOn(c, W, f1, 11, o.seed + 1, u * 7, u * 14, '#12283f', null);
    hill(c, W, H, hz + u * 2, u * 2, '#cfe0f2', o.seed + 2, 1.1);
    var py = H * 0.82, ry = H * 0.13, rx = W * 0.56; /* the pond */
    c.beginPath(); c.ellipse(W / 2, py, rx + u * 2.5, ry + u * 2, 0, 0, TAU); c.fillStyle = '#eef4fb'; c.fill();
    c.save(); c.beginPath(); c.ellipse(W / 2, py, rx, ry, 0, 0, TAU); c.clip();
    vgrad2(c, 0, py - ry, W, ry * 2, '#8fd0e6', '#4f8fc0');
    c.globalAlpha = 0.3; auroraBands(c, W, H, t, o.seed, py - ry * 1.4, py + ry * 1.6, ['#58f0b0', '#b08aff']); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = u * 0.3; for (i = 0; i < 7; i++) { var ax = W * (0.2 + R0() * 0.6), ay = py + (R0() - 0.5) * ry * 1.2; c.beginPath(); c.ellipse(ax, ay, u * (6 + R0() * 12), u * (1.5 + R0() * 3), R0() * 0.6 - 0.3, R0() * 3, R0() * 3 + 2.2); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(W * 0.36, py - ry * 0.45, rx * 0.3, ry * 0.12, -0.08, 0, TAU); c.fill();
    c.restore();
    for (i = 0; i < 6; i++) twinkle(c, W * (0.15 + R0() * 0.7), py + (R0() - 0.5) * ry * 1.4, u * (1 + 1.2 * Math.abs(Math.sin(t * 2 + i * 1.3))), '#fff');
    pine(c, W * 0.06, py - ry * 0.5, u * 22, '#1c4a4a', p.snow, 4); pine(c, W * 0.95, py - ry * 0.3, u * 27, '#184242', p.snow, 4);
    hill(c, W, H, H * 0.97, u * 1.4, p.snow, o.seed + 3, 1.6);
  };

  BD.kitchen = function (c, W, H, t, p, o, u) {
    var ct = H * 0.8, i, j, g = u * 5, R0 = rnd(o.seed + 'ki'), sw = ow;
    c.fillStyle = p.paper; c.fillRect(0, 0, W, ct);
    c.fillStyle = alpha(p.accent, 0.3); for (i = 0; i * g < W; i += 2) c.fillRect(i * g, 0, g, ct); for (j = 0; j * g < ct; j += 2) c.fillRect(0, j * g, W, g); /* gingham */
    var sy = H * 0.2; ow = u * 0.45;
    var n = Math.max(4, Math.round(W / (u * 15))); for (i = 0; i < n; i++) { var x = (i + 0.5) / n * W, k = (i + Math.floor(R0() * 3)) % 4, s = u * 8;
      if (k === 0) { R(c, x - s * 0.36, sy - s * 0.95, s * 0.72, s * 0.95, s * 0.14, '#d9eef2'); Rn(c, x - s * 0.3, sy - s * 0.6, s * 0.6, s * 0.56, s * 0.08, i % 2 ? '#c98a4a' : '#f3e2c0'); R(c, x - s * 0.4, sy - s * 1.08, s * 0.8, s * 0.18, s * 0.05, p.accent); }
      else if (k === 1) { R(c, x - s * 0.34, sy - s * 0.62, s * 0.68, s * 0.62, s * 0.08, p.accent2); c.beginPath(); c.arc(x + s * 0.4, sy - s * 0.32, s * 0.16, -PI / 2, PI / 2); c.lineWidth = s * 0.09; c.strokeStyle = p.accent2; c.stroke(); heartPath(c, x, sy - s * 0.3, s * 0.3); c.fillStyle = p.snow; c.fill(); steam(c, x, sy - s * 0.7, s * 0.5, t + i, 2); }
      else if (k === 2) { E(c, x, sy - s * 0.52, s * 0.52, s * 0.52, p.snow); c.beginPath(); c.arc(x, sy - s * 0.52, s * 0.36, 0, TAU); c.lineWidth = s * 0.05; c.strokeStyle = alpha(p.accent, 0.6); c.stroke(); }
      else { c.save(); c.translate(x, sy); c.scale(0.011 * s, 0.011 * s); c.translate(0, -44); ow = 3; PR.candle(c, t, p, { beat: 0 }); c.restore(); ow = u * 0.45; } }
    ow = 0; Rn(c, 0, sy, W, u * 2, 0, '#a9703f'); Rn(c, 0, sy + u * 2, W, u * 1, 0, 'rgba(60,30,10,0.2)');
    var seg = Math.max(2, Math.round(W / (u * 36))); for (i = 0; i < seg; i++) garland(c, i * W / seg, u * 1, (i + 1) * W / seg, u * 1, u * 2.4, 6, u, o, t);
    c.fillStyle = '#7fb3a8'; c.fillRect(0, ct, W, H - ct); c.fillStyle = '#f4ede0'; c.fillRect(0, ct - u * 1.2, W, u * 2.8); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, ct + u * 1.6, W, u * 0.7); /* counter and cabinets */
    var ow2 = Math.min(W * 0.36, u * 38), ox = W / 2 - ow2 / 2, oy = ct + u * 3.6, oh = H - oy - u * 1.5, fl = 0.6 + 0.2 * Math.sin(t * 5) + 0.1 * Math.sin(t * 11);
    for (i = 0; i < 2; i++) { var cx = i ? ox + ow2 + u * 3 : u * 3, cw = ox - u * 6; if (cw > u * 8) { Rn(c, cx, oy, cw, oh, u * 1, '#8fc0b5'); Rn(c, cx + u * 1.5, oy + u * 1.5, cw - u * 3, oh - u * 3, u * 0.8, '#7fb3a8'); dot(c, i ? cx + u * 3 : cx + cw - u * 3, oy + oh * 0.3, u * 0.9, p.gold); } }
    Rn(c, ox, oy - u * 1, ow2, oh + u * 1, u * 1.4, '#e9e6e0'); Rn(c, ox + u * 2.4, oy + u * 3.6, ow2 - u * 4.8, oh - u * 5.4, u * 1.2, '#3b2a22');
    glow(c, W / 2, oy + oh * 0.6, ow2 * 0.9, '#ff9a3a', 0.35 * fl); Rn(c, ox + u * 3.4, oy + u * 4.6, ow2 - u * 6.8, oh - u * 7.4, u * 0.8, alpha('#ff9a3a', 0.55 * fl + 0.2));
    for (i = -1; i <= 1; i++) { c.save(); c.translate(W / 2 + i * ow2 * 0.24, oy + oh * 0.62); c.scale(u * 0.07, u * 0.07); c.translate(0, 40); ow = 2; CH.gingerbread(c, { k: 0, sw: 0, e: 0, t: t, n: 0, open: 0, ph: 0.5, wave: false, calm: false, v: 0, mood: 'idle' }, p); c.restore(); }
    ow = 0; Rn(c, ox + u * 4, oy + u * 1, ow2 - u * 8, u * 1.1, u * 0.5, '#b9c0c8'); for (i = 0; i < 3; i++) dot(c, ox + ow2 * (0.3 + i * 0.2), oy - u * 0.1, u * 0.7, i === 1 ? p.accent : '#8a909c');
    ow = sw;
  };

  function chalk(c, u, a) { c.strokeStyle = 'rgba(255,255,255,' + a + ')'; c.fillStyle = 'rgba(255,255,255,' + a + ')'; c.lineWidth = u * 0.55; c.lineCap = 'round'; c.lineJoin = 'round'; }
  BD.chalkboard = function (c, W, H, t, p, o, u) {
    var i, th = u * 3.4, R0 = rnd(o.seed + 'ch'), boil = Math.floor(t * 4), J = rnd(o.seed + 'b' + (boil % 3));
    c.fillStyle = '#2f5d4a'; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.035)'; for (i = 0; i < 26; i++) { c.save(); c.translate(R0() * W, R0() * H); c.rotate(R0() * 0.6 - 0.3); c.fillRect(-u * 14, -u * 2, u * 28, u * (2 + R0() * 5)); c.restore(); } /* wiped chalk dust */
    vignette(c, W, H, '#10261d', 0.5);
    function jx() { return (J() - 0.5) * u * 0.35; }
    for (i = 0; i < 16; i++) { /* doodles keep to the edges */
      var edge = i % 4, f = (Math.floor(i / 4) + 0.2 + R0() * 0.6) / 4, x = edge === 0 ? W * (0.07 + R0() * 0.1) : edge === 1 ? W * (0.93 - R0() * 0.1) : f * W, y = edge < 2 ? H * (0.08 + f * 0.82) : edge === 2 ? H * (0.05 + R0() * 0.07) : H * (0.9 - R0() * 0.05), s = u * (4 + R0() * 3.5), kind = (i * 3 + Math.floor(R0() * 2)) % 6, j;
      c.save(); c.translate(x + jx(), y + jx()); c.rotate((R0() - 0.5) * 0.5); chalk(c, u, 0.6 + R0() * 0.3); c.beginPath();
      if (kind === 0) { for (j = 0; j < 5; j++) { var a = -PI / 2 + j * TAU * 2 / 5; if (j) c.lineTo(Math.cos(a) * s + jx(), Math.sin(a) * s + jx()); else c.moveTo(Math.cos(a) * s, Math.sin(a) * s); } c.closePath(); }
      else if (kind === 1) { for (j = 0; j < 3; j++) { c.moveTo(-Math.cos(j * PI / 3) * s, -Math.sin(j * PI / 3) * s); c.lineTo(Math.cos(j * PI / 3) * s + jx(), Math.sin(j * PI / 3) * s + jx()); } }
      else if (kind === 2) { c.moveTo(0, -s); c.lineTo(s * 0.5, -s * 0.3); c.lineTo(s * 0.2, -s * 0.3); c.lineTo(s * 0.7, s * 0.4); c.lineTo(-s * 0.7 + jx(), s * 0.4); c.lineTo(-s * 0.2, -s * 0.3); c.lineTo(-s * 0.5, -s * 0.3); c.closePath(); c.moveTo(0, s * 0.4); c.lineTo(0, s * 0.8); }
      else if (kind === 3) { for (j = 0; j < 40; j++) { var aa = j * 0.33, rr = s * j / 40; c.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } }
      else if (kind === 4) { c.moveTo(0, s * 0.8); c.bezierCurveTo(-s * 1.6, -s * 0.3, -s * 0.4, -s * 1.1 + jx(), 0, -s * 0.3); c.bezierCurveTo(s * 0.4, -s * 1.1, s * 1.6 + jx(), -s * 0.3, 0, s * 0.8); }
      else { c.moveTo(-s * 0.3, s * 0.9); c.lineTo(-s * 0.3, -s * 0.3); c.arc(s * 0.1, -s * 0.3 + jx(), s * 0.4, PI, 0); }
      c.stroke(); c.restore();
    }
    chalk(c, u, 0.4); c.setLineDash([u * 2, u * 1.6]); c.strokeRect(th + u * 2.5, th + u * 2.5, W - th * 2 - u * 5, H - th * 2 - u * 5); c.setLineDash([]);
    c.fillStyle = '#9a6a45'; c.fillRect(0, 0, W, th); c.fillRect(0, H - th, W, th); c.fillRect(0, 0, th, H); c.fillRect(W - th, 0, th, H); c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(0, 0, W, th * 0.3); c.fillRect(0, H - th, W, th * 0.3); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(th, th, W - th * 2, u * 0.6); c.fillRect(th, th, u * 0.6, H - th * 2);
    Rn(c, W * 0.6, H - th - u * 1.2, u * 6, u * 1.4, u * 0.5, '#ffffff'); Rn(c, W * 0.6 + u * 8, H - th - u * 1.2, u * 4, u * 1.4, u * 0.5, '#ffd0d8'); Rn(c, W * 0.2, H - th - u * 2.2, u * 9, u * 2.4, u * 0.5, '#6b4a3a');
  };

  BD.kraft = function (c, W, H, t, p, o, u) {
    var i, R0 = rnd(o.seed + 'kr'), m = u * 3.2, ink = alpha(p.ink, 0.4);
    c.fillStyle = '#c9a47a'; c.fillRect(0, 0, W, H);
    for (i = 0; i < 140; i++) { c.fillStyle = i % 3 ? 'rgba(120,80,40,0.14)' : 'rgba(255,240,210,0.16)'; c.save(); c.translate(R0() * W, R0() * H); c.rotate(R0() * PI); c.fillRect(0, 0, u * (1 + R0() * 4), u * 0.22); c.restore(); } /* paper fibres */
    c.fillStyle = 'rgba(120,80,40,0.07)'; for (i = 0; i < 5; i++) c.fillRect(0, H * (i + 0.5) / 5, W, u * 0.3);
    vignette(c, W, H, '#5a3a1a', 0.3);
    c.lineWidth = u * 0.7; c.setLineDash([u * 2.2, u * 1.6]); c.strokeStyle = p.paper; c.strokeRect(m, m, W - m * 2, H - m * 2); c.strokeStyle = alpha(p.accent, 0.9); c.lineDashOffset = u * 1.9; c.setLineDash([u * 0.6, u * 3.2]); c.strokeRect(m, m, W - m * 2, H - m * 2); c.setLineDash([]); c.lineDashOffset = 0;
    /* stamps and postmarks tucked into the corners */
    var st = [[W - u * 16, u * 9, 0.08, p.accent, 0], [W - u * 27, u * 10.5, -0.06, p.accent2, 1], [u * 14, H - u * 12, -0.1, p.accent2, 5]];
    for (i = 0; i < st.length; i++) { var s = u * 9; c.save(); c.translate(st[i][0], st[i][1]); c.rotate(st[i][2] + Math.sin(t * 1.2 + i) * 0.01); Rn(c, -s * 0.5, -s * 0.6, s, s * 1.2, s * 0.04, p.paper); c.setLineDash([u * 0.5, u * 0.7]); c.lineWidth = u * 0.5; c.strokeStyle = '#c9a47a'; c.strokeRect(-s * 0.5, -s * 0.6, s, s * 1.2); c.setLineDash([]); Rn(c, -s * 0.4, -s * 0.5, s * 0.8, s, 0, alpha(st[i][3], 0.22)); miniIcon(c, st[i][4], 0, 0, s * 0.62, p, st[i][3]); c.restore(); }
    c.save(); c.translate(W - u * 30, u * 14); c.rotate(-0.25); ringStroke(c, 0, 0, u * 6, u * 0.5, ink); ringStroke(c, 0, 0, u * 4.2, u * 0.35, ink); starPath(c, 0, 0, u * 2.2, u * 1, 5, 0); c.fillStyle = ink; c.fill(); c.lineWidth = u * 0.5; c.strokeStyle = ink; for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-u * 7, i * u * 2.4); for (var j = 0; j < 4; j++) c.quadraticCurveTo(-u * (9 + j * 4), i * u * 2.4 + (j % 2 ? 1 : -1) * u * 1.4, -u * (11 + j * 4), i * u * 2.4); c.stroke(); } c.restore();
    c.save(); c.translate(u * 12, u * 10); c.rotate(-0.12); c.lineWidth = u * 0.5; c.strokeStyle = alpha(p.accent, 0.6); c.strokeRect(-u * 7, -u * 3, u * 14, u * 6); for (i = 0; i < 3; i++) twinkle(c, -u * 4 + i * u * 4, 0, u * 1.3, alpha(p.accent, 0.6)); c.restore();
    c.beginPath(); c.moveTo(W - u * 20, H - u * 6); c.bezierCurveTo(W - u * 14, H - u * 12, W - u * 10, H - u * 3, W - u * 5, H - u * 9); c.lineWidth = u * 0.6; c.strokeStyle = '#8a6a44'; c.stroke(); var sw = ow; ow = u * 0.4; bow(c, W - u * 13, H - u * 8, u * 8, '#e9dcc2'); ow = sw;
  };

  BD.aurora = function (c, W, H, t, p, o, u) {
    var hz = H * 0.74, i;
    vgrad(c, W, H, ['#040818', '#08153a', '#0f2a50', '#1d4a66'], 0, hz);
    skyStars(c, W, H, 90, o.seed, t, hz * 0.9);
    auroraBands(c, W, H, t, o.seed, H * 0.04, hz * 0.92, ['#52f2a8', '#58c8ff', '#c08aff', '#52f2a8']);
    c.fillStyle = '#16284a'; c.beginPath(); c.moveTo(0, hz); var R0 = rnd(o.seed + 'mt'), n = 9; for (i = 0; i <= n; i++) { c.lineTo((i - 0.2 + R0() * 0.4) / n * W, hz - u * (i % 2 ? 4 + R0() * 4 : 12 + R0() * 9)); } c.lineTo(W, hz); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill(); /* far mountains */
    var f1 = hill(c, W, H, hz - u * 1, u * 2.5, '#22486a', o.seed + 1, 1); pinesOn(c, W, f1, 13, o.seed + 1, u * 6, u * 13, '#0e2238', null);
    hill(c, W, H, hz + u * 4, u * 2.5, '#bcd6ea', o.seed + 2, 0.8); glow(c, W / 2, hz + u * 6, W * 0.7, '#52f2a8', 0.14 + 0.04 * Math.sin(t * 0.7));
    var f3 = hill(c, W, H, H * 0.86, u * 2.5, '#e3eef8', o.seed + 3, 1.2);
    pine(c, W * 0.08, f3(W * 0.08) + u * 3, u * 24, '#1c4a4a', p.snow, 4); pine(c, W * 0.9, f3(W * 0.9) + u * 3, u * 20, '#184242', p.snow, 4);
    hill(c, W, H, H * 0.94, u * 1.5, p.snow, o.seed + 4, 1.5);
  };

  function bokeh(c, W, H, n, seed, t, cols, u, yMin, yMax, heart) {
    var R0 = rnd(seed + 'bk'), i;
    for (i = 0; i < n; i++) {
      var x = R0() * W + Math.sin(t * (0.15 + R0() * 0.2) + i) * u * 3, y = H * (yMin + R0() * (yMax - yMin)) + Math.cos(t * (0.12 + R0() * 0.2) + i * 2) * u * 2, r = u * (3 + R0() * R0() * 13), a = (0.1 + R0() * 0.2) * (0.75 + 0.25 * Math.sin(t * (0.6 + R0() * 1.5) + i * 1.7)), col = cols[i % cols.length];
      if (heart) { heartPath(c, x, y, r * 2); c.fillStyle = alpha(col, a); c.fill(); c.lineWidth = u * 0.3; c.strokeStyle = alpha(col, a * 0.9); c.stroke(); }
      else { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = alpha(col, a); c.fill(); c.lineWidth = u * 0.35; c.strokeStyle = alpha(col, a * 0.8); c.stroke(); }
    }
  }
  BD.fireside = function (c, W, H, t, p, o, u) {
    var fl = 0.8 + 0.12 * Math.sin(t * 6) + 0.08 * Math.sin(t * 13.7), i;
    vgrad(c, W, H, ['#1c0c08', '#3a1a0e', '#6a2c12', '#a84a18']);
    glow(c, W / 2, H * 1.02, Math.max(W, H * 0.8) * 0.9, '#ffb04a', 0.6 * fl); glow(c, W / 2, H, Math.min(W, H) * 0.6, '#ffe08a', 0.5 * fl);
    for (i = 0; i < 5; i++) { /* big soft flames low in the picture */
      var fx = W * (0.14 + i * 0.18), fh = H * (0.1 + (i % 2 ? 0.07 : 0.03)) * (0.9 + 0.2 * Math.sin(t * 5 + i * 2.1)), fw = W * 0.2; c.globalAlpha = 0.35; flame(c, fx, H + u * 2, fw, fh, t * 0.8, i * 1.7); }
    c.globalAlpha = 1;
    bokeh(c, W, H, 26, o.seed, t, ['#ffd98a', '#ffb04a', '#fff0c8', '#ff8a4a'], u, 0.02, 0.8);
    var R0 = rnd(o.seed + 'fs'); for (i = 0; i < 12; i++) { var bx = W * (i + 0.5) / 12, by = H * 0.06 + Math.sin(i * 0.9) * u * 2 + 4 * u * Math.sin((i + 0.5) / 12 * PI), on = (i + o.n) % 2 === 0, col = BULBS[i % 5]; glow(c, bx, by, u * (5 + (on ? 3 * Math.exp(-4 * o.beat) + 1 : 0)), col, on ? 0.55 : 0.25); dot(c, bx, by, u * 0.9, alpha(shade(col, 0.5), on ? 0.9 : 0.5)); }
    vignette(c, W, H, '#0c0402', 0.6);
  };

  BD.confetti = function (c, W, H, t, p, o, u) {
    var i, R0 = rnd(o.seed + 'cf'), cols = [p.accent, p.gold, p.accent2, p.snow, '#ff8ad0', '#58b4ff'], k = Math.exp(-4 * o.beat);
    vgrad(c, W, H, [p.bg, p.bg2]);
    c.fillStyle = alpha(p.snow, 0.05); for (i = 0; i < 14; i++) { c.beginPath(); c.arc(R0() * W, R0() * H, u * (6 + R0() * 14), 0, TAU); c.fill(); }
    for (i = 0; i < 70; i++) { /* confetti stuck to the wall, drifting a little */
      var x = R0() * W, y = frac(R0() + t * 0.008 * (1 + R0())) * H, s = u * (0.9 + R0() * 1.5), col = cols[i % 6], rot = R0() * 6.3 + t * (R0() - 0.5) * 0.8;
      c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.globalAlpha = 0.85; if (i % 3 === 0) { c.beginPath(); c.arc(0, 0, s * 0.6, 0, TAU); c.fill(); } else if (i % 3 === 1) c.fillRect(-s, -s * 0.35, s * 2, s * 0.7); else { c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(-s * 0.5, -s, 0, 0); c.quadraticCurveTo(s * 0.5, s, s, 0); c.lineWidth = s * 0.35; c.strokeStyle = col; c.stroke(); } c.restore();
    }
    c.globalAlpha = 1;
    var n = Math.max(7, Math.round(W / (u * 11))); /* curly streamers hang from the top */
    for (i = 0; i < n; i++) { var sx = (i + 0.5) / n * W + (R0() - 0.5) * u * 4, len = H * (0.1 + R0() * 0.22) * (Math.abs((i + 0.5) / n - 0.5) * 1.4 + 0.5), sw = Math.sin(t * 1.4 + i * 1.3) * u * 1.4, j, col2 = cols[(i * 2) % 5], seg = 9;
      c.beginPath(); c.moveTo(sx, 0); for (j = 1; j <= seg; j++) { var yy = len * j / seg, amp = u * 2.2 * (j / seg); c.quadraticCurveTo(sx + (j % 2 ? amp : -amp) * 1.6 + sw * j / seg, yy - len / seg / 2, sx + sw * j / seg, yy); } c.lineWidth = u * 1.1; c.strokeStyle = shade(col2, -0.2); c.stroke(); c.lineWidth = u * 0.6; c.strokeStyle = col2; c.stroke(); }
    c.lineWidth = u * 0.45; for (i = 0; i * u * 0.9 < W; i++) { var hh = u * (5 + 4 * frac(i * 0.618)) + Math.sin(t * 2 + i) * u * 0.3, sh = Math.sin(t * 5 + i * 1.9) * 0.5 + 0.5; c.strokeStyle = sh > 0.75 - k * 0.3 ? '#fff6d0' : (i % 2 ? p.gold : shade(p.gold, -0.2)); c.beginPath(); c.moveTo(i * u * 0.9, 0); c.lineTo(i * u * 0.9 + Math.sin(t * 1.5 + i * 0.4) * u * 0.4, hh); c.stroke(); } /* tinsel fringe */
    vignette(c, W, H, shade(p.bg, -0.6), 0.3);
  };

  BD.candlelight = function (c, W, H, t, p, o, u) {
    var g = c.createRadialGradient(W / 2, H * 0.46, 0, W / 2, H * 0.46, Math.hypot(W, H) * 0.62), i, fl = 0.85 + 0.1 * Math.sin(t * 5.3) + 0.05 * Math.sin(t * 12.1);
    g.addColorStop(0, '#7a1c2e'); g.addColorStop(0.45, '#4e0f1e'); g.addColorStop(1, '#14030a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    glow(c, W / 2, H * 0.5, Math.min(W, H) * 0.7, '#ffb060', 0.14 * fl);
    bokeh(c, W, H, 14, o.seed + 'a', t, ['#ffcf8a', '#ffe6b0', '#ff9a5a'], u, 0.0, 0.3); bokeh(c, W, H, 22, o.seed + 'b', t, ['#ffcf8a', '#ffe6b0', '#ff9a5a', '#ffd070'], u, 0.66, 1.0);
    var n = Math.max(5, Math.round(W / (u * 16))), R0 = rnd(o.seed + 'cl'); /* a row of candles, soft, along the bottom */
    for (i = 0; i < n; i++) { var x = (i + 0.3 + R0() * 0.4) / n * W, hh = u * (5 + R0() * 9), y = H + u * 1; if (Math.abs(x - W / 2) < W * 0.08) hh *= 0.6; glow(c, x, y - hh - u * 3, u * 13, '#ffd070', 0.4 * fl); Rn(c, x - u * 1.5, y - hh, u * 3, hh, u * 0.5, '#f3e2c8'); Rn(c, x - u * 1.5, y - hh, u * 1, hh, u * 0.4, 'rgba(120,40,30,0.25)'); flame(c, x, y - hh - u * 0.4, u * 2.2, u * 5, t, i * 1.9); }
    vignette(c, W, H, '#080104', 0.55);
  };

  BD.starfield = function (c, W, H, t, p, o, u) {
    var i, R0 = rnd(o.seed + 'sf');
    vgrad(c, W, H, [shade(p.bg, -0.55), shade(p.bg, -0.3), p.bg, shade(p.bg2, -0.05)]);
    c.save(); c.translate(W / 2, H * 0.4); c.rotate(-0.5); var g = c.createLinearGradient(0, -H * 0.2, 0, H * 0.2); g.addColorStop(0, alpha(p.snow, 0)); g.addColorStop(0.5, alpha(p.snow, 0.07)); g.addColorStop(1, alpha(p.snow, 0)); c.fillStyle = g; c.fillRect(-W * 1.2, -H * 0.2, W * 2.4, H * 0.4); c.restore();
    skyStars(c, W, H, 170, o.seed, t, H, p.snow);
    for (i = 0; i < 7; i++) { var x = R0() * W, y = R0() * H * 0.9, tw = 0.5 + 0.5 * Math.sin(t * (0.9 + R0()) + i * 2.1); glow(c, x, y, u * 4 * tw + u, p.gold, 0.25 * tw); twinkle(c, x, y, u * (1.6 + 2 * tw), i % 2 ? p.gold : p.snow); }
    var f = frac(t * 0.07 + 0.3); if (f < 0.12) { var q = f / 0.12, sx = W * (0.15 + 0.5 * q), sy = H * (0.12 + 0.12 * q); c.globalAlpha = Math.sin(q * PI); var g2 = c.createLinearGradient(sx - u * 14, sy - u * 3.4, sx, sy); g2.addColorStop(0, alpha(p.snow, 0)); g2.addColorStop(1, alpha(p.snow, 0.9)); c.strokeStyle = g2; c.lineWidth = u * 0.4; c.beginPath(); c.moveTo(sx - u * 14, sy - u * 3.4); c.lineTo(sx, sy); c.stroke(); c.globalAlpha = 1; } /* a shooting star now and then */
    vignette(c, W, H, '#000000', 0.3);
  };

  BD.pawpattern = function (c, W, H, t, p, o, u) {
    var cell = u * 17, nx = Math.ceil(W / cell) + 1, ny = Math.ceil(H / cell) + 1, i, j, k = Math.exp(-5 * o.beat), light = shade(p.bg2, 0.16), dark = shade(p.bg, -0.14);
    vgrad(c, W, H, [p.bg2, p.bg]);
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      var x = i * cell + (j % 2 ? cell / 2 : 0), y = j * cell + cell * 0.4, id = (i * 2 + j * 3) % 7, rot = ((i * 37 + j * 53) % 9 - 4) * 0.12 + Math.sin(t * 1.5 + i + j * 2) * 0.07, sc = 1 + ((i + j + o.n) % 2 === 0 ? k * 0.12 : 0);
      if (id === 3) bone(c, x, y, u * 11 * sc, rot + 0.5, p.paper); else if (id === 6) { dot(c, x, y, u * 2.6 * sc, p.accent); c.beginPath(); c.arc(x, y, u * 2.6 * sc, 0.4, 2.2); c.lineWidth = u * 0.5; c.strokeStyle = p.snow; c.stroke(); }
      else if (id === 1) { heartPath(c, x, y, u * 4.4 * sc); c.fillStyle = alpha(p.accent, 0.85); c.fill(); }
      else paw(c, x, y, u * 9.5 * sc, rot, id % 2 ? light : (id === 0 ? p.gold : dark));
    }
    vignette(c, W, H, shade(p.bg, -0.6), 0.3);
  };

  BD.heartsnow = function (c, W, H, t, p, o, u) {
    var hz = H * 0.8, i;
    vgrad(c, W, H, ['#2a1b4e', '#5a2f72', '#a04a86', '#e87f93', '#ffc2a0'], 0, hz);
    skyStars(c, W, H, 40, o.seed, t, H * 0.4);
    glow(c, W / 2, hz, Math.max(W, H) * 0.5, '#ffd0b0', 0.35);
    bokeh(c, W, H, 30, o.seed, t, ['#ffd0e0', '#ff9ab8', '#fff0f4', p.accent, '#ffc2a0'], u, 0.03, 0.82, true);
    var f1 = hill(c, W, H, hz - u * 3, u * 3, '#b88ab4', o.seed + 1, 0.9); pinesOn(c, W, f1, 9, o.seed + 1, u * 5, u * 11, '#6a4a86', '#e9cfe6');
    hill(c, W, H, hz + u * 1, u * 2.5, '#f3d6e4', o.seed + 2, 1.2); var f3 = hill(c, W, H, H * 0.88, u * 2.2, '#fbeaf0', o.seed + 3, 0.8);
    pine(c, W * 0.07, f3(W * 0.07) + u * 3, u * 22, '#5a3f7a', p.snow, 4); pine(c, W * 0.94, f3(W * 0.94) + u * 3, u * 18, '#634688', p.snow, 4);
    hill(c, W, H, H * 0.95, u * 1.4, p.snow, o.seed + 4, 1.5);
  };

  //@@BACKS

  function backdrop(name, ctx, W, H, t, pal, opts) {
    var f = BD[name]; if (!ctx || !(W > 0) || !(H > 0)) return;
    var p = P(pal), o = { beat: frac(num(opts && opts.beat, 0.5)), n: Math.floor(num(opts && opts.n, 0)), seed: String(opts && opts.seed != null ? opts.seed : 1) }, sow = ow;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ow = 0;
    try { if (f) f(ctx, W, H, num(t, 0), p, o, Math.min(W, H) / 100); else { vgrad(ctx, W, H, [p.bg, p.bg2]); } } finally { ow = sow; ctx.restore(); }
  }
  CarolArt.backdrop = backdrop;
  CarolArt.backdrops = ['snowyhills', 'nightvillage', 'livingroom', 'office', 'holynight', 'sunburst', 'grid80s', 'plaid', 'wrapping', 'nursery', 'windowfar', 'workshop', 'forest', 'icepond', 'kitchen', 'chalkboard', 'kraft', 'aurora', 'fireside', 'confetti', 'candlelight', 'starfield', 'pawpattern', 'heartsnow'];

  /* ---------- particles (looping, deterministic from t) ---------- */
  var PT = {};
  PT.snow = function (c, W, H, t, p, o, u) { /* three depths: fine far flakes, mid flakes, a few big soft near ones */
    var L3 = [[70, 0.16, 0.34, 0.035, 0.55, 0.008], [34, 0.36, 0.7, 0.06, 0.8, 0.014], [9, 1.3, 2.4, 0.1, 0.3, 0.025]], l, i;
    for (l = 0; l < 3; l++) {
      var q = L3[l], n = Math.round(q[0] * o.amount), R0 = rnd(o.seed + 'sn' + l), m = u * q[2] * 2;
      c.fillStyle = alpha(p.snow, q[4]); c.beginPath();
      for (i = 0; i < n; i++) { var r = u * (q[1] + R0() * (q[2] - q[1])), x = frac(R0() + Math.sin(t * (0.3 + R0() * 0.5) + R0() * 6.3) * q[5] + t * 0.004 * (l + 1)) * (W + m * 2) - m, y = frac(R0() + t * q[3] * (0.7 + R0() * 0.6)) * (H + m * 2) - m; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
      c.fill();
      if (l === 2) { R0 = rnd(o.seed + 'sn' + l); c.fillStyle = alpha(p.snow, 0.35); c.beginPath(); for (i = 0; i < n; i++) { var r2 = u * (q[1] + R0() * (q[2] - q[1])), x2 = frac(R0() + Math.sin(t * (0.3 + R0() * 0.5) + R0() * 6.3) * q[5] + t * 0.004 * (l + 1)) * (W + m * 2) - m, y2 = frac(R0() + t * q[3] * (0.7 + R0() * 0.6)) * (H + m * 2) - m; c.moveTo(x2 + r2 * 0.5, y2); c.arc(x2, y2, r2 * 0.5, 0, TAU); } c.fill(); }
    }
  };
  PT.twinkle = function (c, W, H, t, p, o, u) {
    var n = Math.round(22 * o.amount), i, k = Math.exp(-5 * o.beat);
    for (i = 0; i < n; i++) { var per = 1.6 + (i % 5) * 0.37, ph = t / per + i * 0.618, cyc = Math.floor(ph), f = ph - cyc, R0 = rnd(o.seed + 'tw' + i + '.' + (cyc % 97)), x = R0() * W, y = R0() * H, s = Math.sin(f * PI); s = s * s * u * (1.2 + R0() * 2.6) * (1 + k * 0.3); c.globalAlpha = 0.9; twinkle(c, x, y, s, i % 3 ? p.gold : p.snow); if (i % 4 === 0) dot(c, x, y, s * 0.22, '#fff'); }
    c.globalAlpha = 1;
  };
  PT.confetti = function (c, W, H, t, p, o, u) {
    var n = Math.round(46 * o.amount), i, R0 = rnd(o.seed + 'co'), cols = [p.accent, p.gold, p.accent2, p.snow, '#ff8ad0', '#58b4ff'], m = u * 3;
    for (i = 0; i < n; i++) { var sp = 0.07 + R0() * 0.09, x = frac(R0() + Math.sin(t * (0.6 + R0()) + i) * 0.02) * W, y = frac(R0() + t * sp) * (H + m * 2) - m, s = u * (0.9 + R0() * 1.1), rot = R0() * 6.3 + t * (1 + R0() * 2) * (i % 2 ? 1 : -1), fl = Math.cos(t * (2 + R0() * 3) + i);
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, Math.abs(fl) * 0.85 + 0.15); c.fillStyle = fl > 0 ? cols[i % 6] : shade(cols[i % 6], -0.2); if (i % 4 === 0) { c.beginPath(); c.arc(0, 0, s * 0.7, 0, TAU); c.fill(); } else c.fillRect(-s, -s * 0.45, s * 2, s * 0.9); c.restore(); }
  };
  PT.stars = function (c, W, H, t, p, o, u) {
    var n = Math.round(20 * o.amount), i, R0 = rnd(o.seed + 'sr'), m = u * 4, k = Math.exp(-5 * o.beat);
    for (i = 0; i < n; i++) { var x = frac(R0() + Math.sin(t * (0.4 + R0() * 0.4) + i) * 0.02) * W, y = frac(R0() + t * (0.025 + R0() * 0.035)) * (H + m * 2) - m, s = u * (1 + R0() * 1.6) * (1 + k * 0.2), tw = 0.6 + 0.4 * Math.sin(t * (2 + R0() * 2) + i); c.globalAlpha = tw; starPath(c, x, y, s, s * 0.45, 5, t * (R0() - 0.5) * 1.5); c.fillStyle = i % 3 ? p.gold : p.snow; c.fill(); }
    c.globalAlpha = 1;
  };
  PT.hearts = function (c, W, H, t, p, o, u) {
    var n = Math.round(16 * o.amount), i, R0 = rnd(o.seed + 'he'), m = u * 5, k = Math.exp(-5 * o.beat), cols = [p.accent, shade(p.accent, 0.35), '#ff9ab8', p.snow];
    for (i = 0; i < n; i++) { var f = frac(R0() + t * (0.04 + R0() * 0.05)), x = frac(R0() + Math.sin(t * (0.7 + R0() * 0.6) + i * 1.3) * 0.025) * W, y = (1 - f) * (H + m * 2) - m, s = u * (1.8 + R0() * 2.6) * (1 + k * 0.15); c.globalAlpha = Math.min(1, f * 5, (1 - f) * 3) * 0.85; c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.2 + i) * 0.25); heartPath(c, 0, 0, s); c.fillStyle = cols[i % 4]; c.fill(); c.restore(); }
    c.globalAlpha = 1;
  };
  PT.embers = function (c, W, H, t, p, o, u) {
    var n = Math.round(30 * o.amount), i, R0 = rnd(o.seed + 'em');
    for (i = 0; i < n; i++) { var f = frac(R0() + t * (0.06 + R0() * 0.1)), x = (0.5 + (R0() - 0.5) * (0.5 + f * 0.6)) * W + Math.sin(t * (1 + R0() * 2) + i) * u * 2.5 * f, y = H - f * H * (0.5 + R0() * 0.5), s = u * (0.25 + R0() * 0.45), a = Math.min(1, f * 6) * (1 - f) * (0.7 + 0.3 * Math.sin(t * 9 + i)); dot(c, x, y, s * 3, 'rgba(255,150,50,' + (a * 0.25).toFixed(3) + ')'); dot(c, x, y, s, 'rgba(255,220,140,' + a.toFixed(3) + ')'); }
  };
  PT.bubbles = function (c, W, H, t, p, o, u) {
    var n = Math.round(18 * o.amount), i, R0 = rnd(o.seed + 'bu'), m = u * 5;
    for (i = 0; i < n; i++) { var f = frac(R0() + t * (0.03 + R0() * 0.05)), x = frac(R0() + Math.sin(t * (0.5 + R0() * 0.6) + i) * 0.03) * W, y = (1 - f) * (H + m * 2) - m, r = u * (1.2 + R0() * 3); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fill(); c.lineWidth = u * 0.25; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke(); c.beginPath(); c.arc(x, y, r * 0.65, PI * 1.1, PI * 1.5); c.lineWidth = u * 0.35; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke(); }
  };
  PT.notes = function (c, W, H, t, p, o, u) {
    var n = Math.round(12 * o.amount), i, R0 = rnd(o.seed + 'no'), m = u * 6, k = Math.exp(-5 * o.beat), cols = [p.snow, p.gold, p.snow, p.accent];
    c.lineCap = 'round';
    for (i = 0; i < n; i++) { var f = frac(R0() + t * (0.04 + R0() * 0.04)), x = frac(R0() + Math.sin(t * (0.8 + R0() * 0.5) + i * 1.7) * 0.03) * W, y = (1 - f) * (H + m * 2) - m, s = u * (1.6 + R0() * 1.4) * (1 + k * 0.25), col = cols[i % 4]; c.globalAlpha = Math.min(1, f * 5, (1 - f) * 3) * 0.9;
      c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.5 + i) * 0.25); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = s * 0.22;
      c.beginPath(); c.ellipse(0, 0, s * 0.62, s * 0.45, -0.4, 0, TAU); c.fill(); c.beginPath(); c.moveTo(s * 0.52, -s * 0.1); c.lineTo(s * 0.52, -s * 2.1);
      if (i % 2) { c.lineTo(s * 2.3, -s * 2.5); c.lineTo(s * 2.3, -s * 0.5); c.stroke(); c.beginPath(); c.ellipse(s * 1.78, -s * 0.4, s * 0.62, s * 0.45, -0.4, 0, TAU); c.fill(); c.beginPath(); c.moveTo(s * 0.52, -s * 1.7); c.lineTo(s * 2.3, -s * 2.1); c.stroke(); }
      else { c.quadraticCurveTo(s * 1.5, -s * 1.8, s * 1.3, -s * 1.0); c.stroke(); }
      c.restore(); }
    c.globalAlpha = 1;
  };
  function particles(name, ctx, W, H, t, pal, opts) {
    var f = PT[name]; if (!f || !ctx || !(W > 0) || !(H > 0)) return;
    var o = { amount: clamp(num(opts && opts.amount, 1), 0, 3), seed: String(opts && opts.seed != null ? opts.seed : 1), beat: frac(num(opts && opts.beat, 0.5)) }, sow = ow; if (o.amount <= 0) return;
    ctx.save(); ow = 0; try { f(ctx, W, H, num(t, 0), P(pal), o, Math.min(W, H) / 100); } finally { ow = sow; ctx.restore(); }
  }
  CarolArt.particles = particles;
  CarolArt.particleNames = ['snow', 'twinkle', 'confetti', 'stars', 'hearts', 'embers', 'bubbles', 'notes'];

  /* ---------- borders (stay inside the outer 4% of the canvas) ---------- */
  function ringClip(c, W, H, b) { c.beginPath(); c.rect(0, 0, W, H); c.rect(b, b, W - b * 2, H - b * 2); c.clip('evenodd'); }
  function edgeWalk(W, H, inset, step, fn) { /* calls fn(x, y, angle, index) at even steps around the rectangle */
    var w = W - inset * 2, h = H - inset * 2, sides = [[inset, inset, 1, 0, w, 0], [W - inset, inset, 0, 1, h, PI / 2], [W - inset, H - inset, -1, 0, w, PI], [inset, H - inset, 0, -1, h, -PI / 2]], s, i, idx = 0;
    for (s = 0; s < 4; s++) { var q = sides[s], n = Math.max(1, Math.round(q[4] / step)); for (i = 0; i < n; i++) { var d = (i + 0.5) / n * q[4]; fn(q[0] + q[2] * d, q[1] + q[3] * d, q[5], idx++, s); } }
  }
  var BO = {};
  BO.holly = function (c, W, H, t, p, o, b) {
    ow = b * 0.03;
    edgeWalk(W, H, b * 0.5, b * 1.25, function (x, y, a, i) { var wob = Math.sin(t * 1.5 + i) * 0.08; hollyLeaf(c, x - Math.cos(a) * b * 0.55, y - Math.sin(a) * b * 0.55, b * 1.05, a + (i % 2 ? 0.28 : -0.28) + wob, i % 2 ? p.accent2 : shade(p.accent2, -0.14)); });
    edgeWalk(W, H, b * 0.5, b * 3.75, function (x, y, a, i) { dot(c, x, y, b * 0.2, p.accent); dot(c, x + b * 0.3, y + b * 0.12, b * 0.17, shade(p.accent, -0.12)); dot(c, x - b * 0.06, y - b * 0.06, b * 0.06, 'rgba(255,255,255,0.8)'); });
  };
  BO.lights = function (c, W, H, t, p, o, b) {
    var k = Math.exp(-5 * o.beat), pts = [];
    c.beginPath(); edgeWalk(W, H, b * 0.22, b * 0.8, function (x, y, a, i) { var off = (i % 2 ? 1 : -1) * b * 0.07, px = x - Math.sin(a) * off, py = y + Math.cos(a) * off; if (i) c.lineTo(px, py); else c.moveTo(px, py); if (i % 2) pts.push([px, py, a]); }); c.closePath(); c.lineWidth = Math.max(1, b * 0.06); c.strokeStyle = '#1f3a2c'; c.stroke();
    for (var i = 0; i < pts.length; i++) { var q = pts[i], lit = (i + o.n) % 2 === 0, col = BULBS[i % 5], bx = q[0] - Math.sin(q[2]) * b * 0.24, by = q[1] + Math.cos(q[2]) * b * 0.24;
      if (lit) dot(c, bx, by, b * (0.3 + 0.12 * k), alpha(col, 0.25 + 0.3 * k)); dot(c, q[0] - Math.sin(q[2]) * b * 0.08, q[1] + Math.cos(q[2]) * b * 0.08, b * 0.1, '#1f3a2c');
      c.beginPath(); c.ellipse(bx, by, b * 0.15, b * 0.22, q[2], 0, TAU); c.fillStyle = lit ? shade(col, 0.15 + 0.3 * k) : shade(col, -0.35); c.fill(); if (lit) dot(c, bx - b * 0.04, by - b * 0.05, b * 0.05, 'rgba(255,255,255,0.85)'); }
  };
  BO.candy = function (c, W, H, t, p, o, b) {
    var w = b * 0.62, i, d = w * 1.5, off = frac(t * 0.15) * d * 2;
    c.save(); ringClip(c, W, H, w); c.fillStyle = p.snow; c.fillRect(0, 0, W, H); c.lineWidth = d * 0.62; c.strokeStyle = p.accent; c.lineCap = 'butt'; c.beginPath(); for (i = -H - d * 2 + off; i < W + d; i += d * 2) { c.moveTo(i, 0); c.lineTo(i + H, H); } c.stroke();
    c.lineWidth = d * 0.1; c.strokeStyle = p.accent2; c.beginPath(); for (i = -H - d * 2 + off + d; i < W + d; i += d * 2) { c.moveTo(i, 0); c.lineTo(i + H, H); } c.stroke(); c.restore();
    c.lineWidth = Math.max(1, b * 0.05); c.strokeStyle = 'rgba(0,0,0,0.18)'; c.strokeRect(w, w, W - w * 2, H - w * 2); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.strokeRect(w * 0.22, w * 0.22, W - w * 0.44, H - w * 0.44);
  };
  BO.goldline = function (c, W, H, t, p, o, b) {
    var i, per = (W + H) * 2, f = frac(t * 0.06);
    c.lineWidth = b * 0.09; c.strokeStyle = p.gold; c.strokeRect(b * 0.3, b * 0.3, W - b * 0.6, H - b * 0.6); c.lineWidth = b * 0.035; c.strokeRect(b * 0.56, b * 0.56, W - b * 1.12, H - b * 1.12);
    for (i = 0; i < 4; i++) { var x = i % 2 ? W - b * 0.43 : b * 0.43, y = i > 1 ? H - b * 0.43 : b * 0.43; Pg(c, [[x, y - b * 0.3], [x + b * 0.3, y], [x, y + b * 0.3], [x - b * 0.3, y]], p.gold, true); twinkle(c, x, y, b * (0.18 + 0.08 * Math.sin(t * 3 + i)), '#fffbe0'); }
    edgeWalk(W, H, b * 0.3, per / 4, function (x, y, a, i) { }); /* a glint runs round the line */
    var d = f * per, gx, gy; if (d < W) { gx = d; gy = b * 0.3; } else if (d < W + H) { gx = W - b * 0.3; gy = d - W; } else if (d < W * 2 + H) { gx = W - (d - W - H); gy = H - b * 0.3; } else { gx = b * 0.3; gy = H - (d - W * 2 - H); }
    twinkle(c, clamp(gx, b * 0.3, W - b * 0.3), clamp(gy, b * 0.3, H - b * 0.3), b * 0.3, '#fffbe0');
  };
  BO.plaidedge = function (c, W, H, t, p, o, b) {
    var w = b * 0.72, s = w * 1.6, i;
    c.save(); ringClip(c, W, H, w); c.fillStyle = p.accent; c.fillRect(0, 0, W, H);
    for (i = 0; i * s < W; i++) { c.fillStyle = alpha(shade(p.accent2, -0.3), 0.6); c.fillRect(i * s + s * 0.1, 0, s * 0.35, H); c.fillStyle = alpha(p.gold, 0.85); c.fillRect(i * s + s * 0.7, 0, s * 0.06, H); }
    for (i = 0; i * s < H; i++) { c.fillStyle = alpha(shade(p.accent2, -0.3), 0.6); c.fillRect(0, i * s + s * 0.1, W, s * 0.35); c.fillStyle = alpha(p.gold, 0.85); c.fillRect(0, i * s + s * 0.7, W, s * 0.06); }
    c.restore(); c.lineWidth = Math.max(1, b * 0.06); c.strokeStyle = p.gold; c.strokeRect(w, w, W - w * 2, H - w * 2);
  };
  BO.film = function (c, W, H, t, p, o, b) {
    var w = b * 0.8; c.save(); ringClip(c, W, H, w); c.fillStyle = '#1b1820'; c.fillRect(0, 0, W, H); c.restore();
    c.fillStyle = '#efe8da'; edgeWalk(W, H, w * 0.5, w * 1.05, function (x, y, a, i, s) { var hw = s % 2 ? w * 0.48 : w * 0.56, hh = s % 2 ? w * 0.56 : w * 0.48; rrp(c, x - hw / 2, y - hh / 2, hw, hh, w * 0.09); c.fill(); });
    c.lineWidth = Math.max(1, b * 0.04); c.strokeStyle = alpha(p.gold, 0.7); c.strokeRect(w, w, W - w * 2, H - w * 2);
  };
  BO.stitch = function (c, W, H, t, p, o, b) {
    var i; c.lineCap = 'round'; c.lineWidth = b * 0.12; c.setLineDash([b * 0.5, b * 0.4]); c.lineDashOffset = 0; c.strokeStyle = 'rgba(0,0,0,0.2)'; c.strokeRect(b * 0.5 + b * 0.04, b * 0.5 + b * 0.05, W - b, H - b); c.strokeStyle = p.paper; c.strokeRect(b * 0.5, b * 0.5, W - b, H - b); c.setLineDash([]);
    for (i = 0; i < 4; i++) { var x = i % 2 ? W - b * 0.5 : b * 0.5, y = i > 1 ? H - b * 0.5 : b * 0.5, s = b * 0.26; E(c, x, y, b * 0.36, b * 0.36, p.accent); L(c, x - s * 0.5, y - s * 0.5, x + s * 0.5, y + s * 0.5, b * 0.07, p.paper); L(c, x + s * 0.5, y - s * 0.5, x - s * 0.5, y + s * 0.5, b * 0.07, p.paper); }
  };
  BO.scallop = function (c, W, H, t, p, o, b) {
    var r = b * 0.46; c.fillStyle = p.paper; c.beginPath(); c.rect(0, 0, W, r * 0.75); c.rect(0, H - r * 0.75, W, r * 0.75); c.rect(0, 0, r * 0.75, H); c.rect(W - r * 0.75, 0, r * 0.75, H);
    edgeWalk(W, H, r * 0.75, r * 1.9, function (x, y) { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }); c.fill();
    edgeWalk(W, H, r * 0.75, r * 1.9, function (x, y, a, i) { dot(c, x, y, r * 0.3, i % 2 ? p.accent : p.accent2); });
    c.lineWidth = Math.max(1, b * 0.05); c.strokeStyle = alpha(p.gold, 0.9); c.strokeRect(b * 0.08, b * 0.08, W - b * 0.16, H - b * 0.16);
  };
  BO.pixel = function (c, W, H, t, p, o, b) {
    var s = b * 0.42, cols = [p.accent, p.snow, p.accent2, p.gold], ph = Math.floor(t * 3);
    edgeWalk(W, H, s * 0.5, s, function (x, y, a, i) { c.fillStyle = cols[((i + ph) % 4 + 4) % 4]; c.fillRect(x - s / 2 - 0.3, y - s / 2 - 0.3, s + 0.6, s + 0.6); });
    edgeWalk(W, H, s * 1.5, s, function (x, y, a, i) { if (i % 2) return; c.fillStyle = cols[((i / 2 + 2 - ph) % 4 + 8) % 4]; c.fillRect(x - s / 2, y - s / 2, s, s); });
  };
  BO.garland = function (c, W, H, t, p, o, b) {
    var k = Math.exp(-5 * o.beat), pts = [], g1 = '#1f6b47', g2 = '#3d9468';
    c.beginPath(); edgeWalk(W, H, b * 0.42, b * 0.9, function (x, y, a, i) { var off = Math.sin(i * 1.05) * b * 0.16, px = x - Math.sin(a) * off, py = y + Math.cos(a) * off; if (i) c.lineTo(px, py); else c.moveTo(px, py); if (i % 3 === 0) pts.push([px, py, i / 3]); }); c.closePath();
    c.lineJoin = 'round'; c.lineWidth = b * 0.52; c.strokeStyle = g1; c.stroke(); c.lineWidth = b * 0.3; c.setLineDash([b * 0.3, b * 0.34]); c.strokeStyle = g2; c.stroke(); c.lineWidth = b * 0.12; c.lineDashOffset = b * 0.3; c.strokeStyle = shade(g2, 0.25); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    for (var i = 0; i < pts.length; i++) { var q = pts[i], kind = q[2] % 3, col = [p.accent, p.gold, p.snow][kind], lit = (q[2] + o.n) % 2 === 0; if (kind === 1 && lit) dot(c, q[0], q[1], b * (0.36 + 0.12 * k), alpha(p.gold, 0.3 + 0.2 * k)); dot(c, q[0], q[1], b * 0.19, col); dot(c, q[0] - b * 0.06, q[1] - b * 0.06, b * 0.06, 'rgba(255,255,255,0.8)'); }
    for (i = 0; i < 2; i++) { var sw = ow; ow = b * 0.04; bow(c, i ? W - b * 0.5 : b * 0.5, b * 0.42, b * 0.85, p.accent); ow = sw; }
  };
  BO.none = function () { };
  function border(name, ctx, W, H, t, pal, opts) {
    var f = BO[name]; if (!f || !ctx || !(W > 0) || !(H > 0)) return;
    var o = { beat: frac(num(opts && opts.beat, 0.5)), n: Math.floor(num(opts && opts.n, 0)), seed: String(opts && opts.seed != null ? opts.seed : 1) }, sow = ow;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ow = 0; try { f(ctx, W, H, num(t, 0), P(pal), o, Math.min(W, H) * 0.04); } finally { ow = sow; ctx.restore(); }
  }
  CarolArt.border = border;
  CarolArt.borders = ['holly', 'lights', 'candy', 'goldline', 'plaidedge', 'film', 'stitch', 'scallop', 'pixel', 'garland', 'none'];

  /* =====================================================================================================
     Everyday art (birthday, love, thank you, congratulations): no snow, no Christmas dress.
     Same API, same registries; the names are appended to the lists at the end of this block.
     ===================================================================================================== */

  /* ---------- everyday cast ---------- */
  CH.bird = function (c, m, p) { /* the songbird that carries the letter: the brand's mascot */
    var body = p.accent, dk = shade(body, -0.2), belly = p.paper, bk = p.gold, hx = m.sw * 2.5, hy = -60 + m.k * 2.5, aa = armAngles(m, 1.0, 0.85), i;
    for (i = -1; i <= 1; i += 2) { L(c, i * 7, -10, i * 8, -2.5, 2.4, shade(bk, -0.25)); L(c, i * 8, -2.5, i * 8 - 4.5, -0.8, 2, shade(bk, -0.25)); L(c, i * 8, -2.5, i * 8 + 4.5, -0.8, 2, shade(bk, -0.25)); }
    for (i = 0; i < 3; i++) { c.save(); c.translate(-17, -20); c.rotate(-0.55 + i * 0.3 + m.sw * 0.15); E(c, -13, 0, 14, 5, i === 1 ? body : dk); c.restore(); } /* tail */
    c.save(); c.translate(-20, -40); c.rotate(aa[0]); E(c, 0, 11, 7.5, 14, dk); L(c, -2, 14, -2, 22, 0.8, shade(dk, -0.2)); L(c, 2, 14, 2, 22, 0.8, shade(dk, -0.2)); c.restore(); /* far wing */
    E(c, 0, -31, 24, 24.5, body);
    E(c, 3, -26, 15.5, 16.5, belly);
    for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(1 + i * 6.5, -24 + Math.abs(i) * -3); c.lineTo(3 + i * 6.5, -21.5 + Math.abs(i) * -3); c.lineTo(5 + i * 6.5, -24 + Math.abs(i) * -3); c.lineWidth = 0.9; c.strokeStyle = shade(belly, -0.16); c.stroke(); }
    var wa = m.wave ? 2.4 + Math.sin(m.t * 9) * 0.3 : Math.max(0.75, aa[1]), lx = 20 + Math.sin(wa) * 27, ly = -40 + Math.cos(wa) * 27; /* the wing that holds the letter */
    c.save(); c.translate(20, -40); c.rotate(-wa); E(c, 0, 11, 7.5, 14, dk); L(c, -2, 14, -2, 22, 0.8, shade(dk, -0.2)); L(c, 2, 14, 2, 22, 0.8, shade(dk, -0.2)); c.restore();
    c.save(); c.translate(lx, ly); c.rotate(0.3 + m.sw * 0.12); R(c, -12, -8.5, 24, 17, 1.8, '#fffdf7'); c.beginPath(); c.moveTo(-12, -8.5); c.lineTo(0, 2); c.lineTo(12, -8.5); c.lineWidth = 0.9; c.strokeStyle = '#c9bfae'; c.stroke(); heartPath(c, 0, 2, 7.5); c.fillStyle = p.accent2; c.fill(); c.restore();
    for (i = -1; i <= 1; i++) { c.save(); c.translate(hx + i * 2.5, hy - 14); c.rotate(i * 0.45 + m.sw * 0.2); E(c, 0, -5, 2.6, 6.5, i ? dk : body); c.restore(); } /* tuft */
    E(c, hx, hy, 17.5, 16, body); E(c, hx + 1, hy + 6, 10.5, 7.5, belly);
    eyes(c, hx, hy - 2.5, 7.5, 2.4, m); blush(c, hx, hy + 3.5, 12.5, 2.6);
    if (m.open > 0.12) { Pg(c, [[hx - 4, hy + 2.5], [hx + 4, hy + 2.5], [hx, hy + 5.5 + m.open * 5]], '#6a1d2a'); Pg(c, [[hx - 4.8, hy + 1], [hx + 4.8, hy + 1], [hx, hy + 5]], bk); Pg(c, [[hx - 3.6, hy + 6 + m.open * 4], [hx + 3.6, hy + 6 + m.open * 4], [hx, hy + 9.5 + m.open * 5]], shade(bk, -0.12)); }
    else Pg(c, [[hx - 4.8, hy + 1.5], [hx + 4.8, hy + 1.5], [hx, hy + 9]], bk);
  };

  CH.bear = function (c, m, p) { /* party bear: paper hat, bow tie */
    var br = '#bd8552', dk = '#8f5d36', cr = '#f6dfbd', hx = m.sw * 2, hy = -66 + m.k * 2.5, aa = armAngles(m, 1.0, 0.75), i;
    for (i = -1; i <= 1; i += 2) { E(c, i * 14, -5, 11.5, 6.5, br); E(c, i * 15, -3.8, 6, 3.2, cr); }
    arm(c, -23, -48, -1, aa[0], 20, 10.5, br, br, 6); arm(c, 23, -48, 1, aa[1], 20, 10.5, br, br, 6);
    E(c, 0, -31, 27, 29, br); E(c, 0, -26, 17, 19.5, cr);
    bow(c, 0, -52, 17, p.accent2);
    for (i = -1; i <= 1; i += 2) { E(c, hx + i * 14.5, hy - 12.5, 7, 7, br); dot(c, hx + i * 14.5, hy - 12, 3.6, '#eaa9a0'); }
    E(c, hx, hy, 19.5, 17, br);
    E(c, hx, hy + 6.2, 9.8, 7.2, cr);
    eyes(c, hx, hy - 1.5, 8, 2.2, m); blush(c, hx, hy + 4, 14, 2.8);
    E(c, hx, hy + 2.8, 4, 2.9, '#3a2620'); dot(c, hx - 1.2, hy + 1.9, 1, 'rgba(255,255,255,0.7)');
    mouth(c, hx, hy + 8.4, 4.4, m, '#3a2620');
    var tx = hx + m.sw * 2.5, ty = hy - 38 + m.k * 2; /* party hat */
    c.beginPath(); c.moveTo(hx - 10, hy - 14); c.lineTo(tx, ty); c.lineTo(hx + 10, hy - 14); c.closePath(); F(c, p.accent);
    c.save(); c.clip(); for (i = 0; i < 4; i++) L(c, hx - 14, hy - 17 - i * 6.5, hx + 14, hy - 21 - i * 6.5, 2.2, p.gold); c.restore();
    R(c, hx - 11.5, hy - 16.5, 23, 4.2, 2.1, p.paper); pom(c, tx, ty, 3.6, p.gold);
  };

  CH.bunny = function (c, m, p) { /* bunny with a flower */
    var wh = '#fffaf3', sh = '#eadccf', pk = '#f7b4c4', hx = m.sw * 2.4, hy = -52 + m.k * 3, aa = armAngles(m, 1.3, 0.8), i;
    pom(c, -15, -11, 5.5, '#ffffff');
    for (i = -1; i <= 1; i += 2) E(c, i * 10, -3.4, 10.5, 4.6, wh);
    arm(c, -12, -29, -1, aa[0], 13, 5.2, wh, wh, 3.2); var h = arm(c, 12, -29, 1, aa[1], 13, 5.2, wh, wh, 3.2);
    L(c, h[0], h[1] + 2, h[0] + 1.5, h[1] - 14, 1.5, '#3f9a5c'); E(c, h[0] + 4.5, h[1] - 6, 3.6, 1.7, '#57b36f', -0.5); /* flower */
    for (i = 0; i < 5; i++) { var fa = i / 5 * TAU + m.t * 0.6; E(c, h[0] + 1.5 + Math.cos(fa) * 3.6, h[1] - 15 + Math.sin(fa) * 3.6, 2.9, 2.9, p.accent); } dot(c, h[0] + 1.5, h[1] - 15, 2.3, p.gold);
    E(c, 0, -21, 17, 20, wh); E(c, 0, -17, 10, 12.5, '#ffffff');
    bow(c, 0, -37.5, 13, p.accent2);
    for (i = -1; i <= 1; i += 2) { c.save(); c.translate(hx + i * 7, hy - 11); c.rotate(i * 0.16 + m.sw * 0.12 + (i > 0 ? m.k * 0.35 : -m.k * 0.1)); E(c, 0, -18, 5.6, 19, wh); c.beginPath(); c.ellipse(0, -17, 2.8, 13.5, 0, 0, TAU); c.fillStyle = pk; c.fill(); c.restore(); }
    E(c, hx, hy, 17, 15, wh);
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(hx - 4.4, hy + 6.8, 5.2, 4, 0, 0, TAU); c.ellipse(hx + 4.4, hy + 6.8, 5.2, 4, 0, 0, TAU); c.fill();
    eyes(c, hx, hy - 1.5, 7.2, 2.3, m); blush(c, hx, hy + 3.6, 12.2, 2.6);
    Pg(c, [[hx - 2.2, hy + 2.2], [hx + 2.2, hy + 2.2], [hx, hy + 4.8]], '#ee7f95', true);
    if (m.open > 0.12) mouth(c, hx, hy + 7.6, 4, m); else Rn(c, hx - 1.7, hy + 7.4, 3.4, 3.4, 0.8, '#ffffff');
    for (i = -1; i <= 1; i += 2) { L(c, hx + i * 9, hy + 5.5, hx + i * 20, hy + 3.5, 0.45, sh); L(c, hx + i * 9, hy + 7, hx + i * 20, hy + 8.5, 0.45, sh); }
  };

  CH.fox = function (c, m, p) { /* fox with a neckerchief */
    var og = '#ec7b2f', dk = '#b8551d', cr = '#fff3e3', bl = '#3a2620', hx = m.sw * 2.4, hy = -59 + m.k * 2.5, aa = armAngles(m, 1.25, 0.8), i;
    c.save(); c.translate(13, -13); c.rotate(-0.55 + m.sw * 0.28 + Math.sin(m.t * 2.1) * 0.07); E(c, 15, 0, 18, 9.5, og); E(c, 29, 0, 8.5, 6.6, cr); c.restore(); /* tail */
    for (i = -1; i <= 1; i += 2) { L(c, i * 7, -18, i * 8, -5, 8, shade(og, -0.34)); L(c, i * 7, -18, i * 8, -5, 6.4, og); E(c, i * 9, -3, 7.2, 4, bl); }
    arm(c, -12, -40, -1, aa[0], 15, 5.6, og, bl, 3.3); arm(c, 12, -40, 1, aa[1], 15, 5.6, og, bl, 3.3);
    E(c, 0, -28, 15.5, 19, og); E(c, 0, -29, 9, 13, cr);
    Pg(c, [[-12, -46], [12, -46], [0, -33]], p.accent2); R(c, -12.5, -48.5, 25, 5, 2.5, p.accent2); dot(c, -5, -42.5, 1, p.paper); dot(c, 4, -41, 1, p.paper); dot(c, 0, -37.5, 1, p.paper);
    for (i = -1; i <= 1; i += 2) { Pg(c, [[hx + i * 5, hy - 10], [hx + i * 17, hy - 31 - m.k * 2], [hx + i * 19, hy - 5]], og); Pg(c, [[hx + i * 13.2, hy - 22], [hx + i * 17, hy - 31 - m.k * 2], [hx + i * 18, hy - 20]], bl, true); Pg(c, [[hx + i * 9, hy - 11], [hx + i * 15, hy - 21], [hx + i * 16, hy - 9]], '#f6c9a8', true); }
    c.beginPath(); c.moveTo(hx - 21, hy + 3); c.quadraticCurveTo(hx - 19, hy - 16, hx, hy - 16); c.quadraticCurveTo(hx + 19, hy - 16, hx + 21, hy + 3); c.quadraticCurveTo(hx + 11, hy + 15, hx, hy + 16); c.quadraticCurveTo(hx - 11, hy + 15, hx - 21, hy + 3); c.closePath(); F(c, og);
    c.beginPath(); c.moveTo(hx - 21, hy + 3); c.quadraticCurveTo(hx - 9, hy + 1, hx, hy + 7); c.quadraticCurveTo(hx + 9, hy + 1, hx + 21, hy + 3); c.quadraticCurveTo(hx + 11, hy + 15, hx, hy + 16); c.quadraticCurveTo(hx - 11, hy + 15, hx - 21, hy + 3); c.closePath(); F(c, cr);
    eyes(c, hx, hy - 2, 8.2, 2.3, m); blush(c, hx, hy + 5, 13.5, 2.5);
    E(c, hx, hy + 6.4, 3.2, 2.4, bl); dot(c, hx - 0.9, hy + 5.7, 0.8, 'rgba(255,255,255,0.7)');
    mouth(c, hx, hy + 10.6, 4, m, bl);
  };

  /* ---------- everyday props ---------- */
  var SPR = ['#ff5a5f', '#ffd166', '#5ad1a0', '#58b4ff', '#ff8ad0'];
  function icing(c, x0, x1, y, n, d, col) { var w = (x1 - x0) / n, i; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); for (i = 0; i < n; i++) c.arc(x1 - (i + 0.5) * w, y + d * (i % 2 ? 0.9 : 0.5), w / 2, 0, PI); c.closePath(); F(c, col); }
  function flower(c, x, y, r, col, mid, rot) { var i; for (i = 0; i < 5; i++) { var a = (rot || 0) + i / 5 * TAU; E(c, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, r * 0.5, col); } dot(c, x, y, r * 0.42, mid); }
  PR.cake = function (c, t, p, o) {
    var i, k = Math.exp(-5 * o.beat), sp = shade(p.accent, 0.55), R0 = rnd('cake');
    E(c, 0, 41, 42, 4.5, 'rgba(0,0,0,0.14)'); R(c, -42, 32, 84, 6.5, 3.2, '#f3ece0'); R(c, -9, 37, 18, 6, 2, '#ddd3c2');
    R(c, -34, 3, 68, 30, 4, sp); for (i = -3; i <= 3; i++) dot(c, i * 9.5, 22, 2.3, SPR[(i + 5) % 5]);
    c.beginPath(); c.moveTo(-34, 27); for (i = 0; i < 8; i++) c.quadraticCurveTo(-34 + (i + 0.5) * 8.5, 33, -34 + (i + 1) * 8.5, 27); c.lineWidth = 2.6; c.strokeStyle = p.paper; c.stroke();
    icing(c, -36, 36, 0, 8, 7, p.paper);
    R(c, -22, -24, 44, 25, 4, shade(p.accent2, 0.5)); icing(c, -24, 24, -27, 6, 6, p.paper);
    for (i = 0; i < 16; i++) { var sx = (R0() - 0.5) * 60 * (i % 2 ? 0.62 : 1), sy = i % 2 ? -22 - R0() * 3 : 4 + R0() * 3, sa = R0() * 3; L(c, sx, sy, sx + Math.cos(sa) * 2.2, sy + Math.sin(sa) * 1, 1.1, SPR[i % 5]); }
    for (i = -1; i <= 1; i++) { var cx = i * 12, col = [p.accent, p.gold, p.accent2][i + 1]; R(c, cx - 1.7, -42, 3.4, 15, 1, p.paper); L(c, cx - 1.4, -38, cx + 1.4, -39.5, 1.1, col); L(c, cx - 1.4, -33.5, cx + 1.4, -35, 1.1, col); dot(c, cx, -47, 6 + k * 2.5, 'rgba(255,200,90,0.22)'); flame(c, cx, -42.5, 5, 9.5, t, i * 2.1); }
  };
  PR.balloons = function (c, t, p, o) {
    var cols = [p.accent, p.gold, p.accent2], i, bx = [], by = [];
    for (i = 0; i < 3; i++) { bx.push([-21, 1, 22][i] + Math.sin(t * 1.2 + i * 2.1) * 2); by.push([-13, -25, -9][i] + Math.cos(t * 1.5 + i) * 1.6); c.beginPath(); c.moveTo(bx[i], by[i] + 19); c.quadraticCurveTo(bx[i] * 0.4, 18, 0, 42); c.lineWidth = 0.9; c.strokeStyle = '#8a8f98'; c.stroke(); }
    for (i = 0; i < 3; i++) { var j = [0, 2, 1][i]; Pg(c, [[bx[j] - 2.6, by[j] + 21.5], [bx[j] + 2.6, by[j] + 21.5], [bx[j], by[j] + 17]], shade(cols[j], -0.1)); E(c, bx[j], by[j], 15.5, 19, cols[j]); shine(c, bx[j] - 5.5, by[j] - 8.5, 4); }
    bow(c, 0, 42, 10, p.paper);
  };
  PR.partyhat = function (c, t, p, o) {
    var i, k = Math.exp(-5 * o.beat); c.save(); c.rotate(-0.14 + Math.sin(t * 2) * 0.04);
    c.beginPath(); c.moveTo(-27, 33); c.lineTo(0, -35); c.lineTo(27, 33); c.closePath(); F(c, p.accent);
    c.save(); c.clip(); for (i = 0; i < 7; i++) L(c, -34, 30 - i * 11, 34, 20 - i * 11, 3.4, i % 2 ? p.gold : p.accent2); c.restore();
    c.beginPath(); c.moveTo(-27, 33); c.lineTo(0, -35); c.lineTo(27, 33); c.closePath(); c.lineWidth = ow; c.strokeStyle = shade(p.accent, -0.34); c.stroke();
    for (i = -3; i <= 3; i++) E(c, i * 8.6, 34, 5.4, 5, p.paper); pom(c, 0, -37, 6.5 + k * 1.5, p.gold); c.restore();
  };
  PR.cupcake = function (c, t, p, o) {
    var i, fr = shade(p.accent, 0.5), wr = shade(p.accent2, 0.35), R0 = rnd('cup');
    E(c, 0, 40, 26, 3.6, 'rgba(0,0,0,0.14)'); Pg(c, [[-23, 8], [23, 8], [16, 39], [-16, 39]], wr); for (i = -3; i <= 3; i++) L(c, i * 6.4, 10, i * 4.6, 37, 1, shade(wr, -0.2));
    E(c, 0, 4, 27, 10.5, fr); E(c, 0, -6, 21, 9.5, fr); E(c, 0, -15, 14.5, 8, fr); E(c, 0, -22.5, 8, 6, fr);
    for (i = 0; i < 12; i++) { var a = R0() * TAU, r = 6 + R0() * 16, sx = Math.cos(a) * r, sy = -4 + Math.sin(a) * 9, sa = R0() * 3; L(c, sx, sy, sx + Math.cos(sa) * 2.2, sy + Math.sin(sa) * 1.2, 1.2, SPR[i % 5]); }
    R(c, -1.7, -41, 3.4, 17, 1, p.paper); L(c, -1.4, -36, 1.4, -37.5, 1.1, p.accent2); L(c, -1.4, -31, 1.4, -32.5, 1.1, p.accent2); dot(c, 0, -46, 7, 'rgba(255,200,90,0.22)'); flame(c, 0, -41.5, 5.4, 10, t, 1.3);
  };
  PR.bouquet = function (c, t, p, o) {
    var i, sw = Math.sin(t * 1.4) * 0.03, fl = [[-17, -17, 9.5, p.accent], [0, -27, 10.5, '#ff9ab8'], [17, -18, 9.5, p.gold], [-8, -6, 8.5, p.paper], [9, -7, 8.5, p.accent]];
    c.save(); c.rotate(sw);
    for (i = 0; i < 5; i++) L(c, fl[i][0] * 0.7, fl[i][1] + 6, 0, 26, 1.6, '#3f9a5c');
    E(c, -24, -4, 9, 4, '#57b36f', 0.7); E(c, 24, -5, 9, 4, '#57b36f', -0.7); E(c, -13, -30, 7, 3.2, '#57b36f', 1.2); E(c, 12, -32, 7, 3.2, '#57b36f', -1.2);
    for (i = 0; i < 5; i++) flower(c, fl[i][0], fl[i][1], fl[i][2], fl[i][3], i === 2 ? '#fff3c4' : p.gold, t * 0.2 + i);
    Pg(c, [[-21, 0], [21, 0], [7, 41], [-7, 41]], p.paper); Pg(c, [[-21, 0], [-2, 11], [-7, 41]], shade(p.paper, -0.1)); Pg(c, [[21, 0], [2, 11], [7, 41]], shade(p.paper, -0.05));
    bow(c, 0, 24, 19, p.accent2); c.restore();
  };
  PR.trophy = function (c, t, p, o) {
    var g = p.gold, k = Math.exp(-5 * o.beat), i;
    E(c, 0, 42, 30, 3.6, 'rgba(0,0,0,0.14)'); R(c, -21, 31, 42, 10, 2.5, '#6b4a2e'); R(c, -11, 33.5, 22, 5, 1.5, shade(g, 0.3)); R(c, -13, 23, 26, 9, 2, shade(g, -0.15));
    Pg(c, [[-5, 5], [5, 5], [8, 23], [-8, 23]], g);
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(i * 24, -19, 10.5, i < 0 ? PI * 0.5 : -PI * 0.5, i < 0 ? PI * 1.5 : PI * 0.5); c.lineWidth = 5.4; c.strokeStyle = shade(g, -0.34); c.stroke(); c.lineWidth = 3.4; c.strokeStyle = g; c.stroke(); }
    c.beginPath(); c.moveTo(-25, -35); c.lineTo(25, -35); c.quadraticCurveTo(25, 5, 0, 8); c.quadraticCurveTo(-25, 5, -25, -35); c.closePath(); F(c, g);
    c.beginPath(); c.moveTo(-18, -30); c.quadraticCurveTo(-18, -4, -6, 2); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
    R(c, -27.5, -40, 55, 6.5, 3.2, shade(g, 0.28)); starPath(c, 1, -16, 9.5 + k * 1.2, 4.2, 5, 0); F(c, p.paper);
    twinkle(c, 24, -42, 5 + Math.sin(t * 3) * 2, '#ffffff'); twinkle(c, -30, -8, 3.5 + Math.cos(t * 3.6) * 1.6, '#ffffff'); twinkle(c, 16, 14, 3 + Math.sin(t * 4 + 1) * 1.4, '#ffffff');
  };
  function burst(c, x, y, r, f, col, n, lw) { /* one firework at life f (0..1) */
    if (f < 0.1) { L(c, x, y + r * 1.2 * (1 - f * 10), x, y + r * 1.2 * (1 - f * 10) + r * 0.3, lw * 1.2, alpha(col, 0.8)); return; }
    var g = (f - 0.1) / 0.9, e = 1 - Math.pow(1 - g, 3), a = Math.pow(1 - g, 1.1), i, dr = g * g * r * 0.22;
    for (i = 0; i < n; i++) { var an = i / n * TAU + 0.2, r1 = r * e, r0 = r1 * (0.45 + 0.4 * g), cx = Math.cos(an), sy = Math.sin(an); L(c, x + cx * r0, y + sy * r0 + dr, x + cx * r1, y + sy * r1 + dr, lw * (1 - g * 0.6), alpha(col, a)); dot(c, x + cx * r1, y + sy * r1 + dr, lw * 0.9, alpha('#ffffff', a)); if (i % 2) dot(c, x + cx * r1 * 0.55, y + sy * r1 * 0.55 + dr, lw * 0.6, alpha(col, a * 0.8)); }
  }
  PR.firework = function (c, t, p, o) {
    var f1 = frac(t * 0.55), f2 = frac(t * 0.55 + 0.45), f3 = frac(t * 0.55 + 0.75);
    burst(c, -4, -8, 38, f1, o.col || p.gold, 16, 2.2); burst(c, 24, 16, 20, f2, p.accent, 12, 1.7); burst(c, -26, 18, 16, f3, p.accent2, 10, 1.5);
  };
  function flagRow(c, x1, y1, x2, y2, sag, n, cols, fh, t) { /* a drooping string of triangle flags */
    var i; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag * 2, x2, y2); c.lineWidth = Math.max(0.5, fh * 0.07); c.strokeStyle = '#7a6a5a'; c.stroke();
    for (i = 0; i < n; i++) {
      var fa = (i + 0.08) / n, fb = (i + 0.92) / n, my = (y1 + y2) / 2 + sag * 2;
      var ax = x1 + (x2 - x1) * fa, ay = (1 - fa) * (1 - fa) * y1 + 2 * (1 - fa) * fa * my + fa * fa * y2, bx = x1 + (x2 - x1) * fb, by = (1 - fb) * (1 - fb) * y1 + 2 * (1 - fb) * fb * my + fb * fb * y2;
      Pg(c, [[ax, ay], [bx, by], [(ax + bx) / 2 + Math.sin(t * 2 + i) * fh * 0.08, (ay + by) / 2 + fh]], cols[i % cols.length]);
    }
  }
  PR.bunting = function (c, t, p, o) { flagRow(c, -48, -22, 48, -22, 7, 6, [p.accent, p.gold, p.accent2, p.paper], 22, t); flagRow(c, -44, 4, 44, 4, 6, 5, [p.accent2, p.paper, p.accent, p.gold], 19, t + 1); };
  PR.rainbow = function (c, t, p, o) {
    var cols = ['#ff5a5f', '#ff9f43', '#ffd166', '#5ad1a0', '#58b4ff', '#9b7bea'], i;
    for (i = 0; i < 6; i++) { c.beginPath(); c.arc(0, 22, 44 - i * 5.2, PI, TAU); c.lineWidth = 5.6; c.lineCap = 'butt'; c.strokeStyle = cols[i]; c.stroke(); }
    c.lineCap = 'round'; cloud(c, -34 + Math.sin(t) * 1.2, 22, 34, '#ffffff'); cloud(c, 34 - Math.sin(t) * 1.2, 22, 34, '#ffffff');
  };
  PR.sun = function (c, t, p, o) {
    var i, k = Math.exp(-5 * o.beat), y = '#ffd54a'; dot(c, 0, 0, 46, alpha(y, 0.16));
    c.save(); c.rotate(t * 0.25); for (i = 0; i < 12; i++) { c.rotate(TAU / 12); Pg(c, [[-5, -27], [5, -27], [0, -38 - (i % 2) * 5 - k * 3]], i % 2 ? '#ffb53a' : y); } c.restore();
    E(c, 0, 0, 25, 25, y); dot(c, -6, -7, 15, 'rgba(255,255,255,0.18)');
    c.beginPath(); c.arc(-8.5, -2, 3.2, PI * 1.1, PI * 1.9); c.moveTo(11.5, -3); c.arc(8.5, -2, 3.2, PI * 1.1, PI * 1.9); c.lineWidth = 1.7; c.strokeStyle = '#8a5a1a'; c.stroke();
    c.beginPath(); c.arc(0, 2, 8, 0.15 * PI, 0.85 * PI); c.stroke(); blush(c, 0, 6, 14.5, 3.4, 'rgba(255,120,90,0.45)');
  };
  PR.gradcap = function (c, t, p, o) {
    var ink = p.ink, sw = Math.sin(t * 2.2) * 3;
    E(c, 0, 34, 30, 4, 'rgba(0,0,0,0.14)');
    c.beginPath(); c.moveTo(-23, -2); c.lineTo(-23, 18); c.quadraticCurveTo(0, 32, 23, 18); c.lineTo(23, -2); c.closePath(); F(c, shade(ink, 0.12));
    Pg(c, [[-44, -10], [0, -27], [44, -10], [0, 8]], ink); Pg(c, [[-44, -10], [0, 8], [0, 11], [-44, -7]], shade(ink, 0.2), true); Pg(c, [[44, -10], [0, 8], [0, 11], [44, -7]], shade(ink, 0.3), true);
    L(c, 0, -10, 31, -5, 1.6, p.gold); L(c, 31, -5, 31 + sw * 0.4, 16, 1.6, p.gold); R(c, 28 + sw * 0.4, 14, 6, 13, 1.5, p.gold); dot(c, 0, -10, 3, p.gold);
    twinkle(c, -30, -30, 5 + Math.sin(t * 3) * 2, p.gold); twinkle(c, 34, -32, 3.6 + Math.cos(t * 3.4) * 1.5, p.gold);
  };
  PR.loveletter = function (c, t, p, o) {
    var k = Math.exp(-5 * o.beat), i; c.save(); c.rotate(-0.08 + Math.sin(t * 1.6) * 0.04);
    E(c, 0, 34, 36, 3.6, 'rgba(0,0,0,0.12)'); R(c, -38, -22, 76, 50, 4, '#fffdf7');
    c.beginPath(); c.moveTo(-38, 26); c.lineTo(-6, 0); c.moveTo(38, 26); c.lineTo(6, 0); c.lineWidth = 1.1; c.strokeStyle = '#d6cbb8'; c.stroke();
    c.beginPath(); c.moveTo(-38, -20); c.lineTo(0, 9); c.lineTo(38, -20); c.lineTo(34, -22); c.lineTo(-34, -22); c.closePath(); F(c, '#f6efe0');
    heartPath(c, 0, 7, 19 * (1 + k * 0.1)); F(c, p.accent); shine(c, -4, 2, 3);
    c.restore();
    for (i = 0; i < 3; i++) { var f = frac(t * 0.35 + i * 0.33); c.globalAlpha = Math.min(1, f * 4) * (1 - f); heartPath(c, [-24, 6, 26][i] + Math.sin(t * 2 + i) * 3, -26 - f * 22, 7 + i * 1.5); c.fillStyle = i === 1 ? p.gold : p.accent; c.fill(); } c.globalAlpha = 1;
  };

  /* ---------- everyday photo frames ---------- */
  FR.balloonframe = function (c, img, w, h, t, p, o, u) { /* a card carried up by three balloons */
    var cx = w / 2, cw = Math.min(w * 0.9, h * 0.66 / 1.12), ch = cw * 1.12, top = h - ch - u * 2, cols = [p.accent, p.gold, p.accent2], i, a = Math.sin(t * 1.1) * 0.02, rx = Math.min(w * 0.115, h * 0.085), ry = rx * 1.22;
    c.translate(cx, top); c.rotate(a); c.translate(-cx, -top);
    for (i = 0; i < 3; i++) { var bx = cx + (i - 1) * rx * 2.05 + Math.sin(t * 1.3 + i * 2) * u * 1.2, by = top - ry * 1.5 - (i === 1 ? ry * 0.42 : 0) + Math.cos(t * 1.1 + i) * u; L(c, bx, by + ry, cx + (i - 1) * cw * 0.28, top + u * 2, u * 0.5, '#8a8f98'); }
    for (i = 0; i < 3; i++) { var j = [0, 2, 1][i], bx2 = cx + (j - 1) * rx * 2.05 + Math.sin(t * 1.3 + j * 2) * u * 1.2, by2 = top - ry * 1.5 - (j === 1 ? ry * 0.42 : 0) + Math.cos(t * 1.1 + j) * u; Pg(c, [[bx2 - u * 1.4, by2 + ry + u * 2], [bx2 + u * 1.4, by2 + ry + u * 2], [bx2, by2 + ry - u]], shade(cols[j], -0.1)); E(c, bx2, by2, rx, ry, cols[j]); shine(c, bx2 - rx * 0.36, by2 - ry * 0.42, rx * 0.26); }
    Rn(c, cx - cw / 2 + u * 1.5, top + u * 2, cw, ch, u * 3, 'rgba(0,0,0,0.18)'); R(c, cx - cw / 2, top, cw, ch, u * 3, p.paper);
    var m = cw * 0.07, q = photoRect(c, img, cx - cw / 2 + m, top + m, cw - m * 2, ch - m - cw * 0.17, u * 1.6, p);
    for (i = 0; i < 7; i++) dot(c, cx - cw * 0.36 + i * cw * 0.12, top + ch - cw * 0.085 + (i % 2 ? u * 1.3 : -u * 0.6), u * (1.1 + 0.3 * Math.sin(t * 3 + i)), [p.accent, p.gold, p.accent2][i % 3]);
    q.a = a; q.px = cx; q.py = top; return q;
  };
  FR.scallopcard = function (c, img, w, h, t, p, o, u) { /* a card with a scalloped edge and a bow */
    var cw = w * 0.9, ch = Math.min(h * 0.9, cw * 1.22), x0 = (w - cw) / 2, y0 = (h - ch) / 2 + u * 2, r = u * 3.1, a = Math.sin(t * 1.0) * 0.016, i, nx = Math.max(4, Math.round(cw / (r * 1.75))), ny = Math.max(4, Math.round(ch / (r * 1.75))), sw = ow;
    c.translate(w / 2, h / 2); c.rotate(a); c.translate(-w / 2, -h / 2);
    Rn(c, x0 + u * 1.4, y0 + u * 2, cw, ch, u * 2, 'rgba(0,0,0,0.16)');
    c.beginPath(); for (i = 0; i <= nx; i++) { c.moveTo(x0 + cw * i / nx + r, y0); c.arc(x0 + cw * i / nx, y0, r, 0, TAU); c.moveTo(x0 + cw * i / nx + r, y0 + ch); c.arc(x0 + cw * i / nx, y0 + ch, r, 0, TAU); }
    for (i = 1; i < ny; i++) { c.moveTo(x0 + r, y0 + ch * i / ny); c.arc(x0, y0 + ch * i / ny, r, 0, TAU); c.moveTo(x0 + cw + r, y0 + ch * i / ny); c.arc(x0 + cw, y0 + ch * i / ny, r, 0, TAU); }
    c.fillStyle = p.accent; c.fill(); c.lineWidth = ow; c.strokeStyle = shade(p.accent, -0.34); c.stroke(); ow = 0; R(c, x0, y0, cw, ch, u * 1, p.accent); ow = sw;
    Rn(c, x0 + u * 2, y0 + u * 2, cw - u * 4, ch - u * 4, u * 1.4, p.paper);
    var m = u * 5, q = photoRect(c, img, x0 + m, y0 + m, cw - m * 2, ch - m * 2 - u * 7, u * 1, p);
    c.lineWidth = u * 0.5; c.strokeStyle = alpha(p.gold, 0.9); c.strokeRect(q.x, q.y, q.w, q.h);
    for (i = -2; i <= 2; i++) { if (i === 0) { heartPath(c, w / 2, y0 + ch - u * 6.6, u * 5); c.fillStyle = p.accent; c.fill(); } else twinkle(c, w / 2 + i * cw * 0.15, y0 + ch - u * 6.6, u * (1.8 + 0.6 * Math.sin(t * 3 + i)), p.gold); }
    bow(c, w / 2, y0 - u * 0.5, u * 17, p.gold);
    q.a = a; q.px = w / 2; q.py = h / 2; return q;
  };
  FR.medal = function (c, img, w, h, t, p, o, u) { /* a gold medal on a striped ribbon */
    var cx = w / 2, r = Math.min(w * 0.47, h * 0.36), cy = h - r - u * 3, a = Math.sin(t * 1.2) * 0.03, i, g = p.gold, k = Math.exp(-5 * o.beat);
    c.translate(cx, 0); c.rotate(a); c.translate(-cx, 0);
    for (i = -1; i <= 1; i += 2) { var col = i < 0 ? p.accent : p.accent2; Pg(c, [[cx + i * r * 0.78, 0], [cx + i * r * 0.26, 0], [cx - i * r * 0.14, cy - r * 0.86], [cx + i * r * 0.36, cy - r * 0.86]], col); Pg(c, [[cx + i * r * 0.58, 0], [cx + i * r * 0.46, 0], [cx + i * r * 0.05, cy - r * 0.86], [cx + i * r * 0.17, cy - r * 0.86]], p.paper, true); }
    R(c, cx - u * 6, cy - r - u * 5.5, u * 12, u * 8, u * 2, g);
    E(c, cx, cy, r, r, g); for (i = 0; i < 28; i++) { var an = i / 28 * TAU; dot(c, cx + Math.cos(an) * r * 0.92, cy + Math.sin(an) * r * 0.92, u * 0.9, shade(g, i % 2 ? 0.45 : -0.2)); }
    E(c, cx, cy, r * 0.84, r * 0.84, shade(g, -0.16));
    var q = photoCircle(c, img, cx, cy, r * 0.77, p);
    ringStroke(c, cx, cy, r * 0.77, u * 1.5, shade(g, 0.42));
    c.beginPath(); c.arc(cx, cy, r * 0.96, PI * 1.12, PI * 1.32); c.lineWidth = u * 2.2; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    starPath(c, cx, cy + r * 0.88, u * (6 + k), u * 2.6, 5, 0); F(c, p.accent); twinkle(c, cx + r * 0.8, cy - r * 0.78, u * (3 + Math.sin(t * 3)), '#ffffff');
    q.a = a; q.px = cx; q.py = 0; return q;
  };

  /* ---------- everyday backdrops ---------- */
  BD.partywall = function (c, W, H, t, p, o, u) {
    var i, j, fl = H * 0.8, R0 = rnd(o.seed + 'pw'), cols = [p.accent, p.gold, p.accent2, '#58b4ff', '#ff8ad0'];
    vgrad(c, W, H, [p.bg, p.bg2]);
    c.fillStyle = alpha(p.snow, 0.09); for (j = 0; j * u * 11 < fl; j++) for (i = -1; i * u * 13 < W + u * 13; i++) { c.beginPath(); c.arc(i * u * 13 + (j % 2) * u * 6.5, j * u * 11 + u * 4, u * 2, 0, TAU); c.fill(); }
    var g = c.createLinearGradient(0, fl, 0, H); g.addColorStop(0, shade(p.bg, -0.28)); g.addColorStop(1, shade(p.bg, -0.45)); c.fillStyle = g; c.fillRect(0, fl, W, H - fl); c.fillStyle = alpha(p.snow, 0.16); c.fillRect(0, fl, W, u * 0.7);
    for (i = 0; i < 46; i++) { var fx = R0() * W, fy = fl + u * 2 + R0() * (H - fl - u * 3), fr = R0() * 3; c.save(); c.translate(fx, fy); c.rotate(fr); c.fillStyle = alpha(cols[i % 5], 0.85); c.fillRect(-u * 0.9, -u * 0.35, u * 1.8, u * 0.7); c.restore(); }
    for (i = 0; i < 8; i++) { var x = (i + 0.2 + R0() * 0.6) / 8 * W, len = H * (0.07 + R0() * 0.13), s; c.beginPath(); c.moveTo(x, 0); for (s = 1; s <= 12; s++) c.lineTo(x + Math.sin(s * 0.95 + t * 1.4 + i) * u * 1.5, s / 12 * len); c.lineWidth = u * 0.7; c.strokeStyle = cols[i % 5]; c.stroke(); }
    flagRow(c, -u * 2, H * 0.035, W + u * 2, H * 0.035, u * 4.5, Math.max(6, Math.round(W / (u * 11))), cols, u * 7.5, t);
    flagRow(c, -u * 2, H * 0.11, W + u * 2, H * 0.1, u * 6, Math.max(5, Math.round(W / (u * 14))), [p.gold, p.paper, p.accent2, p.accent], u * 6, t + 2);
    for (j = 0; j < 2; j++) for (i = 0; i < 3; i++) { var bx = (j ? W - u * 9 : u * 9) + (i - 1) * u * 6.5 * (j ? -1 : 1), by = H * 0.3 + [u * 3, -u * 4, u * 1][i] + Math.sin(t * 1.1 + i * 2 + j) * u * 0.8; c.beginPath(); c.moveTo(bx, by + u * 7); c.quadraticCurveTo(bx + u, by + u * 16, (j ? W - u * 9 : u * 9), by + u * 30); c.lineWidth = u * 0.3; c.strokeStyle = alpha(p.snow, 0.5); c.stroke(); c.beginPath(); c.ellipse(bx, by, u * 5.6, u * 7, 0, 0, TAU); c.fillStyle = cols[(i + j * 2) % 5]; c.fill(); c.beginPath(); c.ellipse(bx - u * 2, by - u * 3, u * 1.3, u * 0.8, -0.6, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fill(); }
  };
  function bfly(c, x, y, s, col, t, ph) { var f = Math.abs(Math.sin(t * 9 + ph)) * 0.8 + 0.2, i; c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.3 + ph) * 0.4); for (i = -1; i <= 1; i += 2) { c.beginPath(); c.ellipse(i * s * 0.5 * f, -s * 0.2, s * 0.5 * f, s * 0.62, i * 0.4, 0, TAU); c.fillStyle = col; c.fill(); c.beginPath(); c.ellipse(i * s * 0.36 * f, s * 0.42, s * 0.34 * f, s * 0.4, i * -0.3, 0, TAU); c.fillStyle = shade(col, 0.3); c.fill(); } c.fillStyle = '#4a3a2a'; c.fillRect(-s * 0.07, -s * 0.5, s * 0.14, s); c.restore(); }
  BD.sunnymeadow = function (c, W, H, t, p, o, u) {
    var i, R0 = rnd(o.seed + 'sm'), sx = W * 0.8, sy = H * 0.13, gr = p.accent2;
    vgrad(c, W, H, [p.bg, p.bg2, shade(p.bg2, 0.55)], 0, H * 0.72);
    glow(c, sx, sy, u * 34, '#fff6c8', 0.55); c.save(); c.translate(sx, sy); c.rotate(t * 0.12); c.fillStyle = 'rgba(255,238,160,0.5)'; for (i = 0; i < 14; i++) { c.rotate(TAU / 14); c.beginPath(); c.moveTo(-u * 1.4, -u * 10); c.lineTo(u * 1.4, -u * 10); c.lineTo(0, -u * (17 + (i % 2) * 4)); c.closePath(); c.fill(); } c.restore(); dot(c, sx, sy, u * 8, '#ffe27a'); dot(c, sx - u * 2, sy - u * 2, u * 5, 'rgba(255,255,255,0.25)');
    for (i = 0; i < 5; i++) { var cw = u * (16 + R0() * 16), cx = frac(R0() + t * 0.006 * (1 + i * 0.3)) * (W + cw * 2) - cw, cy = H * (0.07 + R0() * 0.3); cloud(c, cx, cy, cw, 'rgba(255,255,255,0.92)'); }
    hill(c, W, H, H * 0.6, u * 4, shade(gr, 0.42), o.seed + 'a', 0.7); hill(c, W, H, H * 0.69, u * 5, shade(gr, 0.2), o.seed + 'b', 1); var fy = hill(c, W, H, H * 0.8, u * 3.5, gr, o.seed + 'c', 0.8);
    var g = c.createLinearGradient(0, H * 0.8, 0, H); g.addColorStop(0, alpha(shade(gr, -0.3), 0)); g.addColorStop(1, alpha(shade(gr, -0.3), 0.5)); c.fillStyle = g; c.fillRect(0, H * 0.76, W, H * 0.24);
    for (i = 0; i < 40; i++) { var x = R0() * W, y = fy(x) + u * 2 + R0() * (H - fy(x) - u * 3), s = u * (0.9 + R0() * 1.1) * (0.6 + (y / H - 0.7) * 2), col = [p.accent, p.gold, '#ffffff', '#ff9ab8'][i % 4], k; c.strokeStyle = shade(gr, -0.3); c.lineWidth = u * 0.3; c.beginPath(); c.moveTo(x, y + s * 2.6); c.lineTo(x + Math.sin(t * 1.5 + i) * s * 0.3, y); c.stroke(); for (k = 0; k < 5; k++) { var a = k / 5 * TAU; c.beginPath(); c.arc(x + Math.sin(t * 1.5 + i) * s * 0.3 + Math.cos(a) * s * 0.6, y + Math.sin(a) * s * 0.6, s * 0.48, 0, TAU); c.fillStyle = col; c.fill(); } dot(c, x + Math.sin(t * 1.5 + i) * s * 0.3, y, s * 0.4, i % 4 === 1 ? '#fff3c4' : '#ffd54a'); }
    for (i = 0; i < 3; i++) bfly(c, W * (0.18 + 0.32 * i) + Math.sin(t * 0.5 + i * 2) * u * 8, H * (0.5 + 0.06 * i) + Math.cos(t * 0.7 + i) * u * 4, u * 2.2, [p.accent, '#ffffff', p.gold][i], t, i * 2);
  };
  BD.rosedusk = function (c, W, H, t, p, o, u) {
    var i, R0 = rnd(o.seed + 'rd'), mx = W * 0.72, my = H * 0.2;
    vgrad(c, W, H, [p.bg, p.bg2, '#ffb7a0', '#ffe0b8'], 0, H * 0.78);
    skyStars(c, W, H, 46, o.seed, t, H * 0.34, '#fff4e0');
    moonDisc(c, mx, my, u * 9, '#fff1d6');
    for (i = 0; i < 6; i++) { var cw = u * (26 + R0() * 26), cx = frac(R0() + t * 0.004 * (1 + i * 0.4)) * (W + cw * 2) - cw, cy = H * (0.3 + R0() * 0.3); c.fillStyle = alpha('#ffffff', 0.16 + R0() * 0.14); c.beginPath(); c.ellipse(cx, cy, cw, u * (2 + R0() * 2), 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(cx + cw * 0.3, cy - u * 1.6, cw * 0.55, u * 1.8, 0, 0, TAU); c.fill(); }
    hill(c, W, H, H * 0.66, u * 4, mix3(p.bg2, '#ffb7a0', 0.35), o.seed + 'a', 0.6); var f2 = hill(c, W, H, H * 0.74, u * 5, shade(p.bg2, -0.12), o.seed + 'b', 0.9); hill(c, W, H, H * 0.86, u * 3.5, shade(p.bg, -0.1), o.seed + 'c', 0.7);
    var tx = W * 0.16, ty = f2(tx) + u * 1.5, ts = u * 15, sw = Math.sin(t * 0.8) * 0.02; /* the tree with a heart for a crown */
    c.save(); c.translate(tx, ty); c.rotate(sw); c.fillStyle = shade(p.bg, -0.3); c.beginPath(); c.moveTo(-u * 0.9, 0); c.lineTo(-u * 0.5, -ts * 0.7); c.lineTo(u * 0.5, -ts * 0.7); c.lineTo(u * 0.9, 0); c.closePath(); c.fill(); heartPath(c, 0, -ts * 0.95, ts * 0.95); c.fillStyle = shade(p.accent, -0.18); c.fill(); heartPath(c, -ts * 0.06, -ts * 1.0, ts * 0.6); c.fillStyle = alpha(p.accent, 0.55); c.fill(); c.restore();
    for (i = 0; i < 12; i++) { var lx = R0() * W, ly = H * (0.9 + R0() * 0.09), tw = 0.5 + 0.5 * Math.sin(t * (1 + R0() * 2) + i); dot(c, lx, ly, u * 0.5, alpha('#ffe9b8', 0.3 + 0.5 * tw)); dot(c, lx, ly, u * 1.6, alpha('#ffe9b8', 0.08 + 0.1 * tw)); }
  };
  function mix3(a, b, k) { var x = rgbOf(a) || [0, 0, 0], y = rgbOf(b) || [0, 0, 0]; return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * k) + ',' + Math.round(x[1] + (y[1] - x[1]) * k) + ',' + Math.round(x[2] + (y[2] - x[2]) * k) + ')'; }
  BD.fireworksky = function (c, W, H, t, p, o, u) {
    var i, j, R0 = rnd(o.seed + 'fw'), cols = [p.accent, p.gold, p.accent2, p.snow, '#ff8ad0'], base = H * 0.86;
    vgrad(c, W, H, [shade(p.bg, -0.25), p.bg, p.bg2]);
    skyStars(c, W, H, 70, o.seed, t, H * 0.7);
    for (i = 0; i < 6; i++) { var per = 2.4 + i * 0.37, ph = t / per + i * 0.39, cyc = Math.floor(ph), f = ph - cyc, R1 = rnd(o.seed + 'b' + i + '.' + (cyc % 61)), x = W * (0.1 + 0.8 * R1()), y = H * (0.1 + 0.42 * R1()), r = u * (13 + R1() * 13), col = cols[(i + cyc) % 5]; if (f > 0.1) glow(c, x, y, r * 1.5, col, 0.22 * Math.pow(1 - f, 1.5)); burst(c, x, y, r, f, col, 14 + (i % 3) * 4, u * 0.55); }
    c.fillStyle = shade(p.bg, -0.5);
    for (i = 0; i < 16; i++) { var bw = W / 16 * (0.8 + R0() * 0.5), bh = u * (5 + R0() * 15), bx = i / 16 * W - u; c.fillStyle = shade(p.bg, -0.5); c.fillRect(bx, base - bh, bw + 1, bh + 1); for (j = 0; j < 9; j++) { if (R0() < 0.45) continue; var wx = bx + u * 0.8 + (j % 3) * bw * 0.3, wy = base - bh + u * 1.2 + Math.floor(j / 3) * u * 2.6; if (wy > base - u * 1.5) continue; c.fillStyle = alpha('#ffe9a0', 0.55 + 0.3 * Math.sin(t * 2 + i + j)); c.fillRect(wx, wy, u * 0.9, u * 1.2); } }
    c.fillStyle = shade(p.bg, -0.6); c.fillRect(0, base, W, H - base);
    var g = c.createLinearGradient(0, base, 0, H); g.addColorStop(0, alpha(p.accent, 0.16)); g.addColorStop(1, alpha(p.accent, 0)); c.fillStyle = g; c.fillRect(0, base, W, H - base);
  };
  function bloom(c, x, y, r, col, t, ph) { var i; c.save(); c.translate(x, y); c.rotate(Math.sin(t * 0.9 + ph) * 0.08 + ph); for (i = 0; i < 6; i++) { c.rotate(TAU / 6); c.beginPath(); c.ellipse(0, -r * 0.55, r * 0.36, r * 0.52, 0, 0, TAU); c.fillStyle = i % 2 ? col : shade(col, 0.16); c.fill(); } for (i = 0; i < 6; i++) { c.rotate(TAU / 6); c.beginPath(); c.ellipse(0, -r * 0.3, r * 0.2, r * 0.3, 0, 0, TAU); c.fillStyle = shade(col, 0.4); c.fill(); } dot(c, 0, 0, r * 0.2, '#ffd54a'); dot(c, -r * 0.05, -r * 0.05, r * 0.08, '#fff3c4'); c.restore(); }
  function leaf(c, x, y, len, rot, col) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0); c.fillStyle = col; c.fill(); c.strokeStyle = shade(col, 0.3); c.lineWidth = Math.max(0.4, len * 0.03); c.beginPath(); c.moveTo(len * 0.1, 0); c.lineTo(len * 0.85, 0); c.stroke(); c.restore(); }
  BD.gardenbloom = function (c, W, H, t, p, o, u) {
    var i, s, R0 = rnd(o.seed + 'gb'), cols = [p.accent, '#ff9ab8', p.gold, shade(p.accent, 0.4), '#ffffff'], gr = p.accent2;
    vgrad(c, W, H, [p.bg, p.bg2]);
    for (i = 0; i < 9; i++) dot(c, R0() * W, R0() * H, u * (8 + R0() * 16), alpha('#ffffff', 0.1 + R0() * 0.1));
    for (s = 0; s < 2; s++) for (i = 0; i < 9; i++) { /* climbing leaves and flowers down each side */
      var y = H * (0.02 + i / 9 * 0.86) + R0() * u * 3, x = s ? W - u * (1 + R0() * 4) : u * (1 + R0() * 4), d = s ? -1 : 1, sw = Math.sin(t * 1.1 + i + s) * 0.06;
      leaf(c, x, y, u * (9 + R0() * 5), (s ? PI : 0) + d * (0.5 + R0() * 0.5) + sw, i % 2 ? gr : shade(gr, -0.15)); leaf(c, x, y + u * 3, u * (8 + R0() * 4), (s ? PI : 0) - d * (0.4 + R0() * 0.5) + sw, shade(gr, 0.18));
      if (i % 2 === 0) bloom(c, x + d * u * (2 + R0() * 3), y + u * 5, u * (4.5 + R0() * 2.5), cols[(i + s) % 5], t, i + s);
    }
    c.fillStyle = shade(gr, -0.1); c.beginPath(); c.moveTo(0, H); for (i = 0; i <= 20; i++) c.lineTo(i / 20 * W, H * 0.93 + Math.sin(i * 1.7) * u * 1.2); c.lineTo(W, H); c.closePath(); c.fill();
    for (i = 0; i < 14; i++) { var bx = (i + 0.2 + R0() * 0.6) / 14 * W, by = H * (0.9 + R0() * 0.06), br = u * (3.2 + R0() * 3); leaf(c, bx, by + br, br * 1.6, -PI / 2 - 0.7, gr); leaf(c, bx, by + br, br * 1.6, -PI / 2 + 0.7, shade(gr, 0.15)); c.strokeStyle = shade(gr, -0.25); c.lineWidth = u * 0.45; c.beginPath(); c.moveTo(bx, H); c.lineTo(bx, by); c.stroke(); bloom(c, bx + Math.sin(t * 1.2 + i) * u * 0.5, by, br, cols[i % 5], t, i * 1.3); }
    for (i = 0; i < 2; i++) bfly(c, W * (0.3 + 0.4 * i) + Math.sin(t * 0.45 + i * 3) * u * 10, H * (0.12 + 0.05 * i) + Math.cos(t * 0.6 + i) * u * 3, u * 2, i ? p.gold : '#ffffff', t, i * 2.5);
  };
  BD.stage = function (c, W, H, t, p, o, u) {
    var i, s, fl = H * 0.8, R0 = rnd(o.seed + 'stg'), red = p.accent, k = Math.exp(-5 * o.beat);
    vgrad(c, W, H, [shade(p.bg, -0.35), p.bg, p.bg2]);
    for (i = 0; i < 60; i++) { var x = R0() * W, y = R0() * fl, tw = 0.5 + 0.5 * Math.sin(t * (1 + R0() * 3) + i); dot(c, x, y, u * (0.15 + R0() * 0.3), alpha(p.gold, 0.2 + 0.6 * tw)); }
    for (i = 0; i < 3; i++) { var tx = W * (0.2 + i * 0.3), bx = W * (0.5 + (i - 1) * 0.26) + Math.sin(t * 0.6 + i * 2) * W * 0.07, g = c.createLinearGradient(0, 0, 0, fl); g.addColorStop(0, alpha(i === 1 ? p.snow : p.gold, 0.26)); g.addColorStop(1, alpha(i === 1 ? p.snow : p.gold, 0.03)); c.fillStyle = g; c.beginPath(); c.moveTo(tx - u * 1.5, 0); c.lineTo(tx + u * 1.5, 0); c.lineTo(bx + u * 15, fl + u * 3); c.lineTo(bx - u * 15, fl + u * 3); c.closePath(); c.fill(); c.fillStyle = alpha(p.snow, 0.09); c.beginPath(); c.ellipse(bx, fl + u * 4, u * 15, u * 2.6, 0, 0, TAU); c.fill(); }
    var fg = c.createLinearGradient(0, fl, 0, H); fg.addColorStop(0, '#7a4c2a'); fg.addColorStop(1, '#3f2413'); c.fillStyle = fg; c.fillRect(0, fl, W, H - fl); c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = Math.max(0.6, u * 0.2); for (i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(W / 2 + i * W * 0.085, fl); c.lineTo(W / 2 + i * W * 0.2, H); c.stroke(); }
    c.fillStyle = shade('#7a4c2a', 0.25); c.fillRect(0, fl, W, u * 0.9);
    for (i = 0; i < 9; i++) { var lx = (i + 0.5) / 9 * W, on = (i + o.n) % 2 === 0; if (on) dot(c, lx, fl + u * 1, u * (3 + k), alpha('#ffe9a0', 0.3)); c.beginPath(); c.arc(lx, fl + u * 1.6, u * 1.3, PI, 0); c.fillStyle = on ? '#ffe9a0' : '#b9965a'; c.fill(); }
    for (s = 0; s < 2; s++) { /* side curtains */
      var cw = W * 0.15, x0 = s ? W - cw : 0, n = 5;
      for (i = 0; i < n; i++) { var fx = x0 + cw * i / n, sway = Math.sin(t * 0.7 + i + s * 2) * u * 0.4, bot = H * (0.86 - 0.012 * Math.abs((s ? n - 1 - i : i) - 0)); c.fillStyle = i % 2 ? shade(red, -0.18) : red; c.beginPath(); c.moveTo(fx, 0); c.lineTo(fx + cw / n + 1, 0); c.lineTo(fx + cw / n + 1 + sway, bot); c.quadraticCurveTo(fx + cw / n / 2 + sway, bot + u * 2.4, fx + sway, bot); c.closePath(); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(s ? x0 - u * 1.2 : x0 + cw, 0, u * 1.2, H * 0.84);
      c.fillStyle = p.gold; c.fillRect(x0, H * 0.5, cw, u * 1.4);
    }
    var nv = Math.max(5, Math.round(W / (u * 16))); c.fillStyle = shade(red, -0.1); c.fillRect(0, 0, W, H * 0.035);
    for (i = 0; i < nv; i++) { var vx = (i + 0.5) / nv * W, vw = W / nv / 2; c.beginPath(); c.moveTo(vx - vw, H * 0.03); c.quadraticCurveTo(vx, H * 0.105, vx + vw, H * 0.03); c.closePath(); c.fillStyle = i % 2 ? red : shade(red, -0.14); c.fill(); c.beginPath(); c.moveTo(vx - vw, H * 0.03); c.quadraticCurveTo(vx, H * 0.105, vx + vw, H * 0.03); c.lineWidth = u * 0.7; c.strokeStyle = p.gold; c.stroke(); dot(c, vx + vw, H * 0.034, u * 1.1, p.gold); }
  };
  BD.notepaper = function (c, W, H, t, p, o, u) {
    var i, R0 = rnd(o.seed + 'np'), cols = [p.accent, p.gold, p.accent2];
    c.fillStyle = p.bg; c.fillRect(0, 0, W, H);
    c.strokeStyle = alpha(p.accent2, 0.22); c.lineWidth = Math.max(0.6, u * 0.18); c.beginPath(); for (i = 1; i * u * 6.2 < H; i++) { c.moveTo(0, i * u * 6.2); c.lineTo(W, i * u * 6.2); } c.stroke();
    c.strokeStyle = alpha(p.accent, 0.4); c.lineWidth = Math.max(0.8, u * 0.28); c.beginPath(); c.moveTo(u * 9.5, 0); c.lineTo(u * 9.5, H); c.stroke();
    for (i = 0; i < 3; i++) { var hy = H * (0.2 + i * 0.3); dot(c, u * 4.6, hy, u * 1.7, shade(p.bg, -0.22)); dot(c, u * 4.6, hy + u * 0.3, u * 1.5, shade(p.bg, -0.4)); }
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (i = 0; i < 26; i++) { /* doodles around the edges */
      var side = i % 4, f = R0(), x = side === 0 ? u * (13 + R0() * 9) : side === 1 ? W - u * (4 + R0() * 9) : W * (0.14 + f * 0.8), y = side < 2 ? H * (0.05 + f * 0.9) : side === 2 ? u * (4 + R0() * 7) : H - u * (4 + R0() * 9), s = u * (1.8 + R0() * 1.8), kind = i % 5, wob = Math.sin(t * 1.5 + i) * 0.08, k;
      c.save(); c.translate(x, y); c.rotate(R0() * 0.8 - 0.4 + wob); c.strokeStyle = alpha(cols[i % 3], 0.75); c.fillStyle = alpha(cols[i % 3], 0.75); c.lineWidth = Math.max(0.8, u * 0.4);
      if (kind === 0) { starPath(c, 0, 0, s, s * 0.45, 5, 0); c.stroke(); }
      else if (kind === 1) { heartPath(c, 0, 0, s * 1.7); c.stroke(); }
      else if (kind === 2) { c.beginPath(); for (k = 0; k <= 8; k++) { if (k) c.lineTo(-s * 1.6 + k * s * 0.4, (k % 2 ? -1 : 1) * s * 0.4); else c.moveTo(-s * 1.6, s * 0.4); } c.stroke(); }
      else if (kind === 3) { c.beginPath(); for (k = 0; k < 22; k++) { var a = k * 0.6, r = s * 0.12 * k * 0.5; if (k) c.lineTo(Math.cos(a) * r, Math.sin(a) * r); else c.moveTo(0, 0); } c.stroke(); }
      else { for (k = 0; k < 5; k++) { var a2 = k / 5 * TAU; c.beginPath(); c.arc(Math.cos(a2) * s * 0.6, Math.sin(a2) * s * 0.6, s * 0.42, 0, TAU); c.stroke(); } c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fill(); }
      c.restore();
    }
    for (i = 0; i < 2; i++) { c.save(); c.translate(i ? W * 0.82 : W * 0.2, u * 2.4); c.rotate(i ? 0.12 : -0.1); c.fillStyle = alpha(cols[i * 2], 0.7); c.fillRect(-u * 9, -u * 2, u * 18, u * 4); c.fillStyle = 'rgba(255,255,255,0.3)'; for (var q = -4; q < 5; q++) c.fillRect(q * u * 2, -u * 2, u * 0.8, u * 4); c.restore(); }
    vignette(c, W, H, '#8a6a3a', 0.16);
  };
  BD.podium = function (c, W, H, t, p, o, u) {
    var i, s, cx = W / 2, cy = H * 0.34, fl = H * 0.8, g = p.gold, k = Math.exp(-5 * o.beat);
    vgrad(c, W, H, [p.bg, p.bg2]);
    c.save(); c.translate(cx, cy); c.rotate(t * 0.05); c.fillStyle = alpha(g, 0.085); for (i = 0; i < 18; i++) { c.rotate(TAU / 18); c.beginPath(); c.moveTo(0, 0); c.lineTo(-u * 9, -Math.max(W, H) * 1.2); c.lineTo(u * 9, -Math.max(W, H) * 1.2); c.closePath(); c.fill(); } c.restore();
    glow(c, cx, cy, u * 46, g, 0.22 + 0.05 * k);
    var fg = c.createLinearGradient(0, fl, 0, H); fg.addColorStop(0, shade(p.bg, -0.3)); fg.addColorStop(1, shade(p.bg, -0.5)); c.fillStyle = fg; c.fillRect(0, fl, W, H - fl); c.fillStyle = alpha(g, 0.5); c.fillRect(0, fl, W, u * 0.5);
    var bw = u * 17, hs = [u * 7, u * 11, u * 5], xs = [cx - bw * 1.5, cx - bw * 0.5, cx + bw * 0.5];
    for (i = 0; i < 3; i++) { var top = H * 0.9 - hs[i]; c.fillStyle = i === 1 ? shade(p.paper, -0.02) : shade(p.paper, -0.12); c.fillRect(xs[i], top, bw, H - top); c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(xs[i], top, bw, u * 0.9); c.fillStyle = i === 1 ? g : shade(g, -0.15); c.fillRect(xs[i], top - u * 1.1, bw, u * 1.3); if (i === 1) { starPath(c, cx, top + u * 6, u * 3.2 * (1 + 0.08 * k), u * 1.4, 5, 0); c.fillStyle = g; c.fill(); } else dot(c, xs[i] + bw / 2, top + u * 4, u * 1.4, alpha(g, 0.8)); }
    for (s = 0; s < 2; s++) { /* laurel sprays in the lower corners */
      var d = s ? -1 : 1, ox = s ? W - u * 4 : u * 4, oy = H * 0.76;
      for (i = 0; i < 9; i++) { var a = -PI / 2 + d * (0.25 - i * 0.07), rr = u * (4 + i * 4.2), lx = ox + d * Math.sin(i * 0.2) * rr * 0.55, ly = oy - rr * 0.9; leaf(c, lx, ly, u * 6.5, a + d * 0.9 + Math.sin(t + i) * 0.04, alpha(g, 0.75)); leaf(c, lx, ly, u * 6.5, a - d * 0.5 + Math.sin(t + i) * 0.04, alpha(shade(g, 0.3), 0.75)); }
    }
  };
  BD.stringlights = function (c, W, H, t, p, o, u) {
    var i, fl = H * 0.82, R0 = rnd(o.seed + 'sl');
    vgrad(c, W, H, [p.bg, p.bg2]);
    for (i = 0; i < 16; i++) { var x = R0() * W, y = R0() * fl, r = u * (4 + R0() * 9); dot(c, x, y, r, alpha(BULBS[i % 5], 0.05 + 0.04 * Math.sin(t * (0.6 + R0()) + i))); }
    c.fillStyle = 'rgba(255,255,255,0.03)'; for (i = 0; i * u * 12 < W; i++) c.fillRect(i * u * 12, 0, u * 6, fl);
    for (i = 0; i < 5; i++) { var y1 = H * (0.03 + i * 0.165), y2 = y1 + (i % 2 ? u * 3 : -u * 2); lightString(c, -u * 3, y1, W + u * 3, y2, u * (4 + (i % 2) * 2), Math.max(5, Math.round(W / (u * 10))), u * 1.05, { beat: o.beat, n: o.n + i }, t); }
    var fg = c.createLinearGradient(0, fl, 0, H); fg.addColorStop(0, '#8a5f3c'); fg.addColorStop(1, '#5a3a22'); c.fillStyle = fg; c.fillRect(0, fl, W, H - fl);
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = Math.max(0.6, u * 0.2); for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, fl + (H - fl) * i / 4); c.lineTo(W, fl + (H - fl) * i / 4); c.stroke(); }
    c.fillStyle = p.paper; c.fillRect(0, fl - u * 2.2, W, u * 2.2); c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(0, fl, W, u * 0.8);
  };

  /* ---------- more particles ---------- */
  PT.petals = function (c, W, H, t, p, o, u) {
    var n = Math.round(26 * o.amount), i, R0 = rnd(o.seed + 'pe'), cols = [shade(p.accent, 0.45), '#ffd1dc', p.snow, shade(p.accent, 0.2)], m = u * 3;
    for (i = 0; i < n; i++) { var x = frac(R0() + t * 0.012 + Math.sin(t * (0.5 + R0() * 0.5) + i) * 0.03) * (W + m * 2) - m, y = frac(R0() + t * (0.035 + R0() * 0.04)) * (H + m * 2) - m, s = u * (0.9 + R0() * 1.2), rot = R0() * 6.3 + t * (0.6 + R0()) * (i % 2 ? 1 : -1), fl = Math.cos(t * (1.5 + R0() * 2) + i);
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, 0.35 + 0.65 * Math.abs(fl)); c.globalAlpha = 0.9; c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * 0.9, s, 0); c.quadraticCurveTo(0, s * 0.9, -s, 0); c.fillStyle = cols[i % 4]; c.fill(); c.restore(); }
    c.globalAlpha = 1;
  };
  PT.fireflies = function (c, W, H, t, p, o, u) {
    var n = Math.round(20 * o.amount), i, R0 = rnd(o.seed + 'ff');
    for (i = 0; i < n; i++) { var x = frac(R0() + Math.sin(t * (0.2 + R0() * 0.2) + i) * 0.05) * W, y = (0.2 + 0.75 * R0()) * H + Math.sin(t * (0.5 + R0() * 0.6) + i * 2) * u * 4, a = 0.5 + 0.5 * Math.sin(t * (1.2 + R0() * 1.6) + i * 1.9), s = u * (0.35 + R0() * 0.35); dot(c, x, y, s * 4.5, alpha(p.gold, 0.14 * a)); dot(c, x, y, s, alpha('#fff6c8', 0.35 + 0.65 * a)); }
  };

  /* ---------- more borders ---------- */
  BO.bunting = function (c, W, H, t, p, o, b) {
    var cols = [p.accent, p.gold, p.accent2, p.paper], i = 0; ow = b * 0.03;
    flagRow(c, 0, b * 0.12, W, b * 0.12, b * 0.02, Math.max(6, Math.round(W / (b * 1.5))), cols, b * 0.8, t);
    ow = 0; edgeWalk(W, H, b * 0.45, b * 1.3, function (x, y, a, idx, s) { if (s === 0) return; dot(c, x, y, b * (0.13 + 0.05 * ((idx * 7) % 3)), cols[idx % 4]); });
  };
  BO.dots = function (c, W, H, t, p, o, b) {
    var cols = [p.accent, p.gold, p.accent2, p.paper], k = Math.exp(-5 * o.beat);
    edgeWalk(W, H, b * 0.5, b * 0.95, function (x, y, a, idx) { var lit = (idx + o.n) % 2 === 0; dot(c, x, y, b * (lit ? 0.24 + 0.06 * k : 0.17), cols[idx % 4]); });
  };
  BO.vine = function (c, W, H, t, p, o, b) {
    var gr = p.accent2;
    edgeWalk(W, H, b * 0.5, b * 0.85, function (x, y, a, idx) { var sw = Math.sin(t * 1.2 + idx) * 0.1; leaf(c, x, y, b * 0.62, a + (idx % 2 ? 0.7 : -0.7) + sw, idx % 2 ? gr : shade(gr, 0.2)); if (idx % 5 === 2) { var i; for (i = 0; i < 5; i++) { var an = i / 5 * TAU + t * 0.3; dot(c, x + Math.cos(an) * b * 0.17, y + Math.sin(an) * b * 0.17, b * 0.13, idx % 2 ? p.accent : p.paper); } dot(c, x, y, b * 0.1, p.gold); } });
  };
  BO.hearts = function (c, W, H, t, p, o, b) {
    var k = Math.exp(-5 * o.beat);
    edgeWalk(W, H, b * 0.5, b * 1.25, function (x, y, a, idx) { var lit = (idx + o.n) % 2 === 0; c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.3 + idx) * 0.2); heartPath(c, 0, 0, b * (lit ? 0.56 + 0.1 * k : 0.42)); c.fillStyle = idx % 3 === 0 ? p.paper : idx % 3 === 1 ? p.accent : shade(p.accent, 0.4); c.fill(); c.restore(); });
  };

  CarolArt.characters.push('bird', 'bear', 'bunny', 'fox');
  CarolArt.props.push('cake', 'balloons', 'partyhat', 'cupcake', 'bouquet', 'trophy', 'firework', 'bunting', 'rainbow', 'sun', 'gradcap', 'loveletter');
  CarolArt.frames.push('balloonframe', 'scallopcard', 'medal');
  CarolArt.backdrops.push('partywall', 'sunnymeadow', 'rosedusk', 'fireworksky', 'gardenbloom', 'stage', 'notepaper', 'podium', 'stringlights');
  CarolArt.particleNames.push('petals', 'fireflies');
  CarolArt.borders.push('bunting', 'dots', 'vine', 'hearts');
  /* names that carry no Christmas dress, for the non-seasonal occasions */
  CarolArt.everyday = {
    characters: ['bird', 'bear', 'bunny', 'fox'],
    props: ['cake', 'balloons', 'partyhat', 'cupcake', 'bouquet', 'trophy', 'firework', 'bunting', 'rainbow', 'sun', 'gradcap', 'loveletter', 'heart', 'microphone', 'discoball', 'moon', 'cloud', 'star', 'globe'],
    frames: ['balloonframe', 'scallopcard', 'medal', 'plain', 'film', 'locket', 'tv', 'starcut', 'bubble', 'polaroid', 'stamp', 'tag'], /* polaroid, tag and badge drop their holly with opts.festive = false */
    backdrops: ['partywall', 'sunnymeadow', 'rosedusk', 'fireworksky', 'gardenbloom', 'stage', 'notepaper', 'podium'],
    particles: ['confetti', 'hearts', 'stars', 'bubbles', 'notes', 'twinkle', 'petals', 'fireflies'],
    borders: ['bunting', 'dots', 'vine', 'hearts', 'goldline', 'film', 'stitch', 'scallop', 'none']
  };

  /* =====================================================================================================
     THE LIBRARY'S DOOR. The blocks above are the launch set and are never touched. Every later block lives in a
     pack (art/pack-*.js) and comes in through CarolArt.add: same registries, same dispatchers, same drawing
     conventions. A block is never replaced: a redesign gets a new name, so a carol made with the old one
     still draws the old one. `kit` is the helpers above, for the packs to draw in the same hand.
       add('character', name, function (c, m, p) {}, { wide: 0.9 })              100 units tall, feet at (0, 0)
       add('prop', name, function (c, t, p, o) {})                               centred at (0, 0), about 100 across
       add('frame', name, function (c, img, w, h, t, p, o, u) { return rect; }, { aspect: 0.8, shaped: true, flex: true })
       add('backdrop', name, function (c, W, H, t, p, o, u) {}, { variants: ['day', 'dusk', 'night'] })   o.variant; also named name:dusk ...
       add('particles', name, function (c, W, H, t, p, o, u) {})
       add('border', name, function (c, W, H, t, p, o, b) {})                    b = 4% of the short side
     ===================================================================================================== */
  var REG = { character: CH, prop: PR, frame: FR, backdrop: BD, particles: PT, border: BO };
  var LISTS = { character: CarolArt.characters, prop: CarolArt.props, frame: CarolArt.frames, backdrop: CarolArt.backdrops, particles: CarolArt.particleNames, border: CarolArt.borders };
  CarolArt.meta = { character: {}, prop: {}, frame: {}, backdrop: {}, particles: {}, border: {} };
  CarolArt.launch = { character: Object.keys(CH), prop: Object.keys(PR), frame: Object.keys(FR), backdrop: Object.keys(BD), particles: Object.keys(PT), border: Object.keys(BO) };
  CarolArt.add = function (kind, name, fn, meta) {
    var reg = REG[kind], vs = meta && meta.variants, i;
    if (!reg || typeof fn !== 'function' || !/^[a-z][a-z0-9]*$/.test(name)) throw new Error('CarolArt.add: bad ' + kind + ' "' + name + '"');
    if (reg[name]) throw new Error('CarolArt.add: the ' + kind + ' "' + name + '" is there already (a block is never replaced: a redesign gets a new name)');
    CarolArt.meta[kind][name] = meta || {};
    if (kind === 'backdrop' && vs && vs.length) {
      var wrap = function (v) { return function (c, W, H, t, p, o, u) { o.variant = v; return fn(c, W, H, t, p, o, u); }; };
      reg[name] = wrap(vs[0]); LISTS[kind].push(name);
      for (i = 0; i < vs.length; i++) { reg[name + ':' + vs[i]] = wrap(vs[i]); LISTS[kind].push(name + ':' + vs[i]); CarolArt.meta[kind][name + ':' + vs[i]] = meta; }
    } else { reg[name] = fn; LISTS[kind].push(name); }
    return fn;
  };
  CarolArt.has = function (kind, name) { return !!(REG[kind] && REG[kind][name]); };
  CarolArt.kit = { TAU: TAU, PI: PI, hash: hash, rnd: rnd, clamp: clamp, num: num, frac: frac, P: P, rgbOf: rgbOf, shade: shade, alpha: alpha, mix: mix3,
    F: F, E: E, dot: dot, rrp: rrp, R: R, Rn: Rn, L: L, Pg: Pg, ball: ball, starPath: starPath, heartPath: heartPath, shine: shine, twinkle: twinkle,
    eyes: eyes, blush: blush, mouth: mouth, arm: arm, armAngles: armAngles, scarf: scarf, pom: pom, head: head, hairdo: hairdo, tabbyTail: tabbyTail,
    pine: pine, flame: flame, bow: bow, wheel: wheel, steam: steam, giftBox: giftBox, cloud: cloud, litWindow: litWindow, smoke: smoke, paw: paw, bone: bone, crescent: crescent,
    drawPhoto: drawPhoto, photoRect: photoRect, photoCircle: photoCircle, ringStroke: ringStroke, lightString: lightString, chain: chain, archPath: archPath,
    vgrad: vgrad, vgrad2: vgrad2, vignette: vignette, glow: glow, skyStars: skyStars, hill: hill, pinesOn: pinesOn, moonDisc: moonDisc, houseSil: houseSil, miniIcon: miniIcon,
    bunting: bunting, auroraBands: auroraBands, bokeh: bokeh, ringClip: ringClip, edgeWalk: edgeWalk, icing: icing, flower: flower, burst: burst, flagRow: flagRow, bfly: bfly, bloom: bloom, leaf: leaf,
    /* the outline every F() adds: its width in the current drawing space (0 = none). ow() reads it, ow(v) sets it; a block that changes it puts it back. */
    ow: function (v) { if (v !== undefined) ow = v; return ow; } };

  //@@APPEND
  return CarolArt;
});
