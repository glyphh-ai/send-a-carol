/* spike/premium/avatar.js : THE SINGING AVATAR, a spike. A photo cut-out head on a body drawn by the template.
   Plain canvas arithmetic only: nothing looks at the picture, there is no model of any kind, no face tracking.
   The singer gives two things on their photo: an OVAL over the face and a LINE across the mouth. From those:
     prepHead(img, taps, makeCanvas)   the head, turned so the mouth line lies flat, cut to the oval with a soft edge
     drawHead(ctx, head, size, open)   the head with the jaw dropped by `open` (0..1): everything under the mouth line
                                       moves down, the skin beside the mouth is stretched across the gap, the mouth
                                       itself opens dark with a hint of teeth
     COSTUMES.<name>                   a body with what is worn BEHIND the head (ears, a snowball, a hood), ON it (a hat
                                       over the top of the oval, so it reads as worn) and IN FRONT of the chin (a scarf, a collar)
     arrange(n, stage)                 2 to 20 avatars in rows (a choir on risers when one row is not enough)
     drawStage(ctx, W, H, card, t, env, deps)   the whole stage for a time t (deps = { Art, Engine })
   No DOM, no clock, no Math.random: as engine.js, the same code could draw in a browser and on the server.
   Not loaded by the product. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CarolAvatar = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var A = {}, PI = Math.PI, TAU = PI * 2, ENV_FPS = 60;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function rgb(col) { var m = /^#([0-9a-f]{6})$/i.exec(col); if (m) { var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; } m = /(\d+)[^\d]+(\d+)[^\d]+(\d+)/.exec(col); return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128]; }
  function mix(a, b, k) { var x = rgb(a), y = rgb(b); return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * k) + ',' + Math.round(x[1] + (y[1] - x[1]) * k) + ',' + Math.round(x[2] + (y[2] - x[2]) * k) + ')'; }
  function dark(c, k) { return mix(c, '#1a1020', k); }
  function light(c, k) { return mix(c, '#ffffff', k); }
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r); c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.closePath(); }
  function fillRR(c, x, y, w, h, r, col) { rr(c, x, y, w, h, r); c.fillStyle = col; c.fill(); }
  function disc(c, x, y, r, col) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); c.fillStyle = col; c.fill(); }
  function ell(c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = col; c.fill(); }
  function limb(c, x1, y1, x2, y2, w, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w; c.lineCap = 'round'; c.strokeStyle = col; c.stroke(); }

  /* ---------- the head ---------- */
  var OH = 420, PAD = 14;
  A.prepHead = function (img, taps, makeCanvas) {
    var o = taps.oval, m = taps.mouth, x1 = m.x1, y1 = m.y1, x2 = m.x2, y2 = m.y2, t;
    if (x2 < x1) { t = x1; x1 = x2; x2 = t; t = y1; y1 = y2; y2 = t; }
    var ang = clamp(Math.atan2(y2 - y1, x2 - x1), -0.6, 0.6), k = OH / (2 * o.ry), OW = Math.round(2 * o.rx * k), cw = OW + PAD * 2, ch = OH + PAD * 2, cv = makeCanvas(cw, ch), c = cv.getContext('2d');
    c.save(); c.translate(cw / 2, ch / 2); c.rotate(-ang); c.scale(k, k); c.translate(-o.cx, -o.cy); c.drawImage(img, 0, 0); c.restore();
    /* the soft edge: everything outside the oval goes, the last tenth of the way fades */
    c.save(); c.globalCompositeOperation = 'destination-in'; c.translate(cw / 2, ch / 2); c.scale(OW / 2, OH / 2);
    var g = c.createRadialGradient(0, 0, 0.88, 0, 0, 1); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(-2, -2, 4, 4); c.restore();
    var co = Math.cos(-ang), si = Math.sin(-ang), at = function (x, y) { var dx = (x - o.cx) * k, dy = (y - o.cy) * k; return [cw / 2 + dx * co - dy * si, ch / 2 + dx * si + dy * co]; }, a = at(x1, y1), b = at(x2, y2);
    var ym = clamp(Math.round((a[1] + b[1]) / 2), ch * 0.45, ch * 0.9), skin = '#d9a273';
    try { /* the skin's colour, for ears and hands: the average of a patch on each cheek */
      var sum = [0, 0, 0], n = 0; [-0.3, 0.3].forEach(function (fx) { var d = c.getImageData(Math.round(cw / 2 + OW * fx) - 5, Math.round(ym - OH * 0.13) - 5, 10, 10).data, i; for (i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { sum[0] += d[i]; sum[1] += d[i + 1]; sum[2] += d[i + 2]; n++; } });
      if (n) skin = 'rgb(' + Math.round(sum[0] / n) + ',' + Math.round(sum[1] / n) + ',' + Math.round(sum[2] / n) + ')';
    } catch (e) { /* a canvas that will not be read: the default colour stands */ }
    return { canvas: cv, cw: cw, ch: ch, OW: OW, OH: OH, ym: ym, mx1: a[0], mx2: b[0], skin: skin, aspect: OW / OH, tilt: ang };
  };
  /* origin = the middle of the oval; size = the oval's height in pixels */
  A.JAW = 0.1;   /* the furthest the jaw drops, as a share of the oval's height: more reads as a puppet, less as a mumble */
  A.drawHead = function (c, hd, size, open) {
    var s = size / hd.OH, d = clamp(open, 0, 1) * hd.OH * A.JAW, cv = hd.canvas, cw = hd.cw, ch = hd.ch, ym = hd.ym;
    c.save(); c.scale(s, s); c.translate(-cw / 2, -ch / 2);
    if (d < 0.6) { c.drawImage(cv, 0, 0); c.restore(); return; }
    var mxc = (hd.mx1 + hd.mx2) / 2, mw = (hd.mx2 - hd.mx1) / 2;
    c.drawImage(cv, 0, ym - 2, cw, 2, 0, ym - 0.5, cw, d + 1.5);                      /* the skin beside the mouth, stretched across the gap */
    c.drawImage(cv, 0, ym, cw, ch - ym, 0, ym + d, cw, ch - ym);                       /* the jaw */
    c.beginPath(); c.ellipse(mxc, ym + d * 0.5, mw * 0.86, d * 0.5 + 0.8, 0, 0, TAU); c.fillStyle = '#3d1016'; c.fill();   /* the open mouth */
    if (d > hd.OH * 0.032) { c.save(); c.beginPath(); c.ellipse(mxc, ym + d * 0.5, mw * 0.86, d * 0.5 + 0.8, 0, 0, TAU); c.clip(); fillRR(c, mxc - mw * 0.5, ym - 2, mw, Math.min(d * 0.34, hd.OH * 0.022) + 2, 3, '#f3ede2'); ell(c, mxc, ym + d + 1, mw * 0.5, d * 0.3, '#b8505a'); c.restore(); }
    c.drawImage(cv, 0, 0, cw, ym, 0, 0, cw, ym);                                      /* the head above the line */
    c.restore();
  };

  /* ---------- costumes. Body frame: origin at the feet, y up is negative, h = the avatar's height (feet to the top of
     the oval). Head frame: origin at the middle of the oval, hw / hh = half its width / height. m = the avatar's
     measures and its motion (m.arm: how far the arms are up, m.v: which of the costume's colourways). ---------- */
  var NECK = 0.57, HEAD = 0.45;   /* the chin sits at 0.57 h above the feet; the oval is 0.45 h tall (a big head: the face is the point) */
  function arms(c, m, col, hand, w) {
    /* from straight down (0) outwards: resting at about 0.45; the arm on the singer's own side goes up as they sing */
    var sy = -m.h * 0.555, sx = m.h * 0.13, len = m.h * 0.2, k;
    for (k = -1; k <= 1; k += 2) { var ang = 0.45 + (k === m.dir ? m.arm * 1.7 : 0) + Math.sin(m.wave + k) * 0.1, ex = k * sx + k * Math.sin(ang) * len, ey = sy + Math.cos(ang) * len; limb(c, k * sx, sy, ex, ey, w || m.h * 0.062, col); disc(c, ex, ey, m.h * 0.036, hand); }
  }
  function scarf(c, m, col, col2) {
    var y = -m.h * (NECK - 0.012), w = m.h * 0.125, hgt = m.h * 0.06, i;
    c.save(); fillRR(c, m.dir * w * 0.35 - m.h * 0.035, y + hgt * 0.5, m.h * 0.07, m.h * 0.17, m.h * 0.015, col); c.fillStyle = col2; for (i = 0; i < 3; i++) c.fillRect(m.dir * w * 0.35 - m.h * 0.035, y + hgt * 0.5 + m.h * (0.045 + i * 0.045), m.h * 0.07, m.h * 0.016);
    fillRR(c, -w, y - hgt * 0.5, w * 2, hgt, hgt * 0.5, col); rr(c, -w, y - hgt * 0.5, w * 2, hgt, hgt * 0.5); c.clip(); c.fillStyle = col2; for (i = -3; i <= 3; i++) c.fillRect(i * w * 0.32 - w * 0.06, y - hgt, w * 0.12, hgt * 2); c.restore();
  }
  function topHat(c, m, col, band) {
    var by = -m.hh * 0.56, bw = m.hw * 1.36, cwid = m.hw * 0.92, chh = m.hh * 0.78;
    c.save(); c.rotate(-0.07 * m.dir);
    fillRR(c, -cwid, by - chh, cwid * 2, chh + 2, m.hw * 0.1, col); c.fillStyle = band; c.fillRect(-cwid, by - chh * 0.3, cwid * 2, chh * 0.24);
    fillRR(c, -bw, by - m.hh * 0.06, bw * 2, m.hh * 0.14, m.hh * 0.07, col); c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(-cwid * 0.8, by - chh * 0.94, cwid * 0.25, chh * 0.56);
    c.restore();
  }
  function beanie(c, m, col, col2) {
    var by = -m.hh * 0.5, w = m.hw * 1.05;
    c.beginPath(); c.moveTo(-w, by); c.bezierCurveTo(-w * 1.02, by - m.hh * 0.95, w * 1.02, by - m.hh * 0.95, w, by); c.closePath(); c.fillStyle = col; c.fill();
    fillRR(c, -w * 1.06, by - m.hh * 0.1, w * 2.12, m.hh * 0.28, m.hh * 0.1, col2); c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = m.hw * 0.035; for (var i = -5; i <= 5; i++) { c.beginPath(); c.moveTo(i * w * 0.19, by - m.hh * 0.07); c.lineTo(i * w * 0.19, by + m.hh * 0.15); c.stroke(); }
    disc(c, 0, by - m.hh * 0.74, m.hw * 0.26, col2);
  }
  var C = {};
  C.elf = {
    cols: [['#2e9a5e', '#d8343f'], ['#d8343f', '#2e9a5e'], ['#2a8f8a', '#ffcb47'], ['#7ab648', '#d8343f']],
    body: function (c, m) {
      var h = m.h, col = m.cols[0], col2 = m.cols[1], k, i;
      for (k = -1; k <= 1; k += 2) { /* striped stockings and curly shoes */
        c.save(); rr(c, k * h * 0.07 - h * 0.035, -h * 0.28, h * 0.07, h * 0.25, h * 0.02); c.clip(); c.fillStyle = '#ffffff'; c.fillRect(k * h * 0.07 - h * 0.04, -h * 0.3, h * 0.08, h * 0.3); c.fillStyle = col2; for (i = 0; i < 6; i++) c.fillRect(k * h * 0.07 - h * 0.04, -h * 0.28 + i * h * 0.05, h * 0.08, h * 0.025); c.restore();
        ell(c, k * h * 0.095, -h * 0.02, h * 0.075, h * 0.034, col); c.beginPath(); c.arc(k * h * 0.165, -h * 0.045, h * 0.028, 0, TAU); c.lineWidth = h * 0.022; c.strokeStyle = col; c.stroke(); disc(c, k * h * 0.165, -h * 0.045, h * 0.014, '#ffcb47');
      }
      arms(c, m, col, m.skin);
      c.beginPath(); c.moveTo(-h * 0.135, -h * 0.585); c.lineTo(h * 0.135, -h * 0.585); c.lineTo(h * 0.2, -h * 0.25); for (i = 4; i >= -4; i--) c.lineTo(i * h * 0.05, -h * (i % 2 ? 0.2 : 0.25)); c.closePath(); c.fillStyle = col; c.fill();
      c.fillStyle = '#2b1a10'; c.fillRect(-h * 0.172, -h * 0.385, h * 0.344, h * 0.045); fillRR(c, -h * 0.035, -h * 0.395, h * 0.07, h * 0.065, h * 0.01, '#ffcb47'); fillRR(c, -h * 0.018, -h * 0.38, h * 0.036, h * 0.035, h * 0.006, '#2b1a10');
    },
    back: function (c, m) { /* the ears show: pointed, the colour of the singer's own cheeks */
      for (var k = -1; k <= 1; k += 2) { c.beginPath(); c.moveTo(k * m.hw * 0.8, m.hh * 0.16); c.quadraticCurveTo(k * m.hw * 1.2, m.hh * 0.02, k * m.hw * 1.62, -m.hh * 0.42); c.quadraticCurveTo(k * m.hw * 1.02, -m.hh * 0.3, k * m.hw * 0.8, -m.hh * 0.2); c.closePath(); c.fillStyle = m.skin; c.fill(); c.beginPath(); c.moveTo(k * m.hw * 0.95, m.hh * 0.04); c.quadraticCurveTo(k * m.hw * 1.2, -m.hh * 0.08, k * m.hw * 1.4, -m.hh * 0.28); c.lineWidth = m.hw * 0.05; c.strokeStyle = dark(m.skin, 0.25); c.stroke(); }
    },
    on: function (c, m) {
      var by = -m.hh * 0.56, w = m.hw * 1.02, tipX = m.dir * m.hw * (1.25 + Math.sin(m.wave) * 0.12), tipY = -m.hh * 1.5;
      c.beginPath(); c.moveTo(-w, by); c.quadraticCurveTo(-w * 0.5, by - m.hh * 1.05, tipX, tipY); c.quadraticCurveTo(w * 0.9, by - m.hh * 0.75, w, by); c.closePath(); c.fillStyle = m.cols[0]; c.fill();
      fillRR(c, -w * 1.08, by - m.hh * 0.1, w * 2.16, m.hh * 0.26, m.hh * 0.13, '#ffffff'); c.fillStyle = m.cols[1]; for (var i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * w * 0.42 - w * 0.2, by + m.hh * 0.14); c.lineTo(i * w * 0.42, by + m.hh * 0.3); c.lineTo(i * w * 0.42 + w * 0.2, by + m.hh * 0.14); c.fill(); }
      disc(c, tipX, tipY, m.hw * 0.17, '#ffcb47'); disc(c, tipX - m.hw * 0.04, tipY - m.hw * 0.04, m.hw * 0.05, '#fff3c4');
    },
    front: function (c, m) { /* a jagged collar over the bottom of the chin */
      var y = -m.h * (NECK + 0.006), i; c.fillStyle = m.cols[1]; c.beginPath(); c.moveTo(-m.h * 0.15, y - m.h * 0.012); for (i = -3; i <= 3; i++) { c.lineTo(i * m.h * 0.046 - m.h * 0.023, y + m.h * 0.075); c.lineTo(i * m.h * 0.046 + m.h * 0.023, y + m.h * 0.012); } c.lineTo(m.h * 0.15, y - m.h * 0.012); c.closePath(); c.fill();
      disc(c, 0, y + m.h * 0.085, m.h * 0.017, '#ffcb47');
    }
  };
  C.snowman = {
    cols: [['#d8343f', '#ffffff'], ['#22a06b', '#ffcf40'], ['#3d7fc4', '#ffffff'], ['#f08a24', '#7b3fa0']],
    body: function (c, m) {
      var h = m.h, k, ball = function (y, r) { var g = c.createRadialGradient(-r * 0.3, y - r * 0.35, r * 0.1, 0, y, r * 1.05); g.addColorStop(0, '#ffffff'); g.addColorStop(0.75, '#eef4fb'); g.addColorStop(1, '#c9d9ec'); c.beginPath(); c.arc(0, y, r, 0, TAU); c.fillStyle = g; c.fill(); };
      for (k = -1; k <= 1; k += 2) { /* stick arms */ var up = k === m.dir ? m.arm : 0.1, ex = k * h * (0.3 + 0.02 * Math.sin(m.wave)), ey = -h * (0.47 + up * 0.2 + 0.015 * Math.sin(m.wave + k)); limb(c, k * h * 0.12, -h * 0.47, ex, ey, h * 0.018, '#6b4a2e'); limb(c, ex - k * h * 0.035, ey + h * 0.006, ex + k * h * 0.012, ey - h * 0.045, h * 0.012, '#6b4a2e'); limb(c, ex - k * h * 0.02, ey, ex + k * h * 0.04, ey + h * 0.02, h * 0.012, '#6b4a2e'); }
      ball(-h * 0.2, h * 0.2); ball(-h * 0.455, h * 0.155);
      for (k = 0; k < 3; k++) disc(c, 0, -h * (0.5 - k * 0.07), h * 0.017, '#2a2a33');
    },
    back: function (c, m) { /* the face sits in a ball of snow */
      var g = c.createRadialGradient(-m.hw * 0.4, -m.hh * 0.5, m.hw * 0.2, 0, 0, m.hh * 1.3); g.addColorStop(0, '#ffffff'); g.addColorStop(0.8, '#eef4fb'); g.addColorStop(1, '#c9d9ec'); c.beginPath(); c.ellipse(0, -m.hh * 0.02, m.hw * 1.3, m.hh * 1.17, 0, 0, TAU); c.fillStyle = g; c.fill();
    },
    on: function (c, m) { topHat(c, m, '#23232b', m.cols[0]); },
    front: function (c, m) { scarf(c, m, m.cols[0], m.cols[1]); }
  };
  C.caroler = {
    cols: [['#8e2434', '#f2e3c8'], ['#215f4a', '#f2c14e'], ['#27407a', '#e9eef7'], ['#5a2d6b', '#f2b6c6']],
    body: function (c, m) {
      var h = m.h, col = m.cols[0], k;
      for (k = -1; k <= 1; k += 2) ell(c, k * h * 0.075, -h * 0.02, h * 0.07, h * 0.033, '#2a1c16');
      c.beginPath(); c.moveTo(-h * 0.13, -h * 0.585); c.lineTo(h * 0.13, -h * 0.585); c.quadraticCurveTo(h * 0.16, -h * 0.3, h * 0.215, -h * 0.06); c.lineTo(-h * 0.215, -h * 0.06); c.quadraticCurveTo(-h * 0.16, -h * 0.3, -h * 0.13, -h * 0.585); c.fillStyle = col; c.fill();
      fillRR(c, -h * 0.225, -h * 0.085, h * 0.45, h * 0.05, h * 0.025, m.cols[1]); c.fillStyle = dark(col, 0.25); c.fillRect(-h * 0.006, -h * 0.5, h * 0.012, h * 0.42); for (k = 0; k < 3; k++) disc(c, h * 0.03, -h * (0.44 - k * 0.09), h * 0.013, m.cols[1]);
    },
    back: function () { },
    on: function (c, m) { if (m.v % 2) topHat(c, m, '#2a2230', m.cols[0]); else beanie(c, m, m.cols[0], m.cols[1]); },
    front: function (c, m) { /* a scarf, and a songbook held up in both hands */
      var h = m.h, by = -h * (0.4 + m.arm * 0.03), k; scarf(c, m, m.cols[1], m.cols[0]);
      for (k = -1; k <= 1; k += 2) { limb(c, k * h * 0.13, -h * 0.55, k * h * 0.115, by + h * 0.02, h * 0.06, m.cols[0]); }
      c.save(); c.translate(0, by); for (k = -1; k <= 1; k += 2) { c.beginPath(); c.moveTo(0, -h * 0.05); c.lineTo(k * h * 0.115, -h * 0.065); c.lineTo(k * h * 0.115, h * 0.045); c.lineTo(0, h * 0.06); c.closePath(); c.fillStyle = '#c8323c'; c.fill(); c.beginPath(); c.moveTo(0, -h * 0.04); c.lineTo(k * h * 0.1, -h * 0.053); c.lineTo(k * h * 0.1, h * 0.035); c.lineTo(0, h * 0.048); c.closePath(); c.fillStyle = '#fff6e4'; c.fill(); }
      c.restore(); for (k = -1; k <= 1; k += 2) disc(c, k * h * 0.115, by + h * 0.02, h * 0.034, m.cols[1]);
    }
  };
  C.office = {
    cols: [['#d6404a', '#ffffff'], ['#1f8a70', '#f0b429'], ['#2d4f8f', '#ffffff'], ['#f0b429', '#22303f'], ['#7b4fa3', '#ffffff'], ['#22303f', '#d6404a']],
    body: function (c, m) {
      var h = m.h, col = m.cols[0], k, i;
      for (k = -1; k <= 1; k += 2) { fillRR(c, k * h * 0.07 - h * 0.045, -h * 0.3, h * 0.09, h * 0.28, h * 0.02, '#2c3644'); ell(c, k * h * 0.085, -h * 0.02, h * 0.07, h * 0.032, '#1c222c'); }
      arms(c, m, col, m.skin);
      fillRR(c, -h * 0.15, -h * 0.59, h * 0.3, h * 0.34, h * 0.05, col);
      c.save(); rr(c, -h * 0.15, -h * 0.59, h * 0.3, h * 0.34, h * 0.05); c.clip(); /* a winter-sweater band: zigzag and dots, no symbols */
      c.strokeStyle = m.cols[1]; c.lineWidth = h * 0.012; c.beginPath(); for (i = -6; i <= 6; i++) c.lineTo(i * h * 0.027, -h * (0.42 + (i % 2 ? 0.02 : -0.012))); c.stroke(); for (i = -3; i <= 3; i++) disc(c, i * h * 0.045, -h * 0.365, h * 0.008, m.cols[1]);
      c.fillStyle = dark(col, 0.18); c.fillRect(-h * 0.15, -h * 0.285, h * 0.3, h * 0.04); c.restore();
    },
    back: function () { },
    on: function (c, m) {
      var by = -m.hh * 0.56, k, i;
      if (m.v % 3 === 0) { /* a paper party hat */ c.save(); c.rotate(0.12 * m.dir); c.beginPath(); c.moveTo(-m.hw * 0.62, by + m.hh * 0.12); c.lineTo(0, by - m.hh * 0.95); c.lineTo(m.hw * 0.62, by + m.hh * 0.12); c.closePath(); c.fillStyle = m.cols[1] === '#ffffff' ? '#f0b429' : m.cols[1]; c.fill(); c.clip(); c.fillStyle = m.cols[0]; for (i = 0; i < 4; i++) c.fillRect(-m.hw, by - m.hh * (0.1 + i * 0.26), m.hw * 2, m.hh * 0.1); c.restore(); c.save(); c.rotate(0.12 * m.dir); disc(c, 0, by - m.hh * 0.95, m.hw * 0.16, '#ffffff'); c.restore(); }
      else if (m.v % 3 === 1) { /* a headband with felt antlers */ c.beginPath(); c.arc(0, 0, m.hh * 1.04, PI * 1.12, PI * 1.88); c.lineWidth = m.hh * 0.1; c.strokeStyle = '#7a4a2a'; c.lineCap = 'round'; c.stroke(); for (k = -1; k <= 1; k += 2) { limb(c, k * m.hw * 0.55, -m.hh * 0.92, k * m.hw * 0.8, -m.hh * 1.5, m.hh * 0.1, '#a9703f'); limb(c, k * m.hw * 0.68, -m.hh * 1.2, k * m.hw * 1.1, -m.hh * 1.34, m.hh * 0.08, '#a9703f'); limb(c, k * m.hw * 0.74, -m.hh * 1.36, k * m.hw * 0.5, -m.hh * 1.58, m.hh * 0.07, '#a9703f'); } }
      else beanie(c, m, m.cols[0], m.cols[1]);
    },
    front: function (c, m) { /* a ribbed collar, a lanyard and a badge */
      var h = m.h, y = -h * (NECK - 0.012); c.beginPath(); c.ellipse(0, y, h * 0.085, h * 0.03, 0, 0, TAU); c.fillStyle = dark(m.cols[0], 0.2); c.fill();
      c.strokeStyle = '#22303f'; c.lineWidth = h * 0.008; c.beginPath(); c.moveTo(-h * 0.06, y + h * 0.01); c.lineTo(m.dir * -h * 0.02, -h * 0.47); c.lineTo(h * 0.06, y + h * 0.01); c.stroke();
      fillRR(c, m.dir * -h * 0.02 - h * 0.035, -h * 0.475, h * 0.07, h * 0.085, h * 0.008, '#ffffff'); c.fillStyle = '#1f8a70'; c.fillRect(m.dir * -h * 0.02 - h * 0.035, -h * 0.475, h * 0.07, h * 0.02); disc(c, m.dir * -h * 0.02, -h * 0.428, h * 0.014, m.skin);
    }
  };
  A.COSTUMES = C;
  /* costumes a template could add later, drawn the same way (not built in this spike) */
  A.IDEAS = ['reindeer onesie (hood with antlers behind the head, a red nose is NOT put on the face)', 'Santa suit (hat on, beard as a collar under the chin)', 'gingerbread person', 'angel choir robe', 'nutcracker', 'birthday party outfit', 'graduation gown'];

  /* ---------- one avatar: the costume's body, the head (behind / the photo / on), what is worn over the chin ---------- */
  A.drawAvatar = function (c, av, x, feet, h, mo) {
    var cs = C[av.costume] || C.caroler, hd = av.head, hh = h * HEAD, hw = hh * hd.aspect, v = av.variant || 0;
    var m = { h: h, hh: hh / 2, hw: hw / 2, skin: hd.skin, cols: cs.cols[v % cs.cols.length], v: v, dir: mo.dir, arm: mo.arm, wave: mo.wave };
    c.save(); c.translate(x, feet);
    ell(c, 0, h * 0.005, h * 0.2, h * 0.028, 'rgba(0,0,0,0.16)');
    c.translate(0, -mo.hop * h); c.rotate(mo.sway); c.scale(mo.scale, mo.scale);
    cs.body(c, m);
    c.save(); c.translate(0, -h * NECK); c.rotate(mo.tilt); c.translate(0, -hh / 2 + h * 0.01);   /* the head turns about the chin */
    cs.back(c, m); A.drawHead(c, hd, hh, mo.open); cs.on(c, m);
    c.restore();
    cs.front(c, m);
    c.restore();
  };
  /* a little sung note: a head, a stem, a flag */
  function note(c, x, y, s, col, a) { c.save(); c.globalAlpha = a; c.translate(x, y); ell(c, 0, 0, s * 0.5, s * 0.36, col, -0.4); c.fillStyle = col; c.fillRect(s * 0.36, -s * 1.5, s * 0.14, s * 1.45); c.beginPath(); c.moveTo(s * 0.5, -s * 1.5); c.quadraticCurveTo(s * 1.2, -s * 1.2, s * 0.95, -s * 0.6); c.quadraticCurveTo(s * 0.95, -s * 1.05, s * 0.5, -s * 1.1); c.fill(); c.restore(); }

  /* ---------- the group: rows that make the avatars as large as the stage allows. One row while it is the largest;
     then two, three, four (a choir on risers): a back row stands 0.82 h higher and a little smaller, so every face is
     clear of the hats in front. -> [{ i, x, feet, h, row }] drawn back to front ---------- */
  var WF = 0.56, RISE = 0.82, HAT = 0.28;
  A.arrange = function (n, S) {
    var best = null, r, j;
    for (r = 1; r <= 4 && r <= n; r++) {
      var counts = [], left = n; for (j = r - 1; j >= 0; j--) { var cnt = Math.floor(left / (j + 1)); counts[j] = cnt; left -= cnt; }   /* the front row (0) gets the extra */
      counts.sort(function (a, b) { return b - a; });
      var h = Math.min(S.w * 0.97 / (counts[0] * WF), S.h / (1 + HAT + RISE * (r - 1) * 0.95));
      if (!best || h > best.h * 1.04) best = { h: h, counts: counts, r: r };
    }
    var out = [], i = 0, rows = [];
    for (j = best.r - 1; j >= 0; j--) rows.push(j);
    var idx = []; /* who stands where: singers are dealt front row first, left to right */
    var start = 0; for (j = 0; j < best.r; j++) { idx[j] = []; for (i = 0; i < best.counts[j]; i++) idx[j].push(start++); }
    rows.forEach(function (row) {
      var k = Math.pow(0.94, row), hgt = best.h * k, cnt = best.counts[row], slot = Math.min(S.w / cnt, best.h * WF * 1.12), x0 = S.x + S.w / 2 - slot * (cnt - 1) / 2;
      for (i = 0; i < cnt; i++) out.push({ i: idx[row][i], x: x0 + i * slot, feet: S.y + S.h - row * RISE * best.h, h: hgt, row: row, slot: slot, count: cnt });
    });
    return out;
  };

  /* ---------- the envelope: how open a singer's mouth is at t, from THEIR OWN vocal part. envelope(samples, rate) is
     made once per singer: loudness 60 times a second, measured against the singer's own loud passages, with a noise
     gate (what is quieter than an eighth of that is silence: a singer who is not singing keeps their mouth shut),
     a fast attack and a slower release so the jaw does not flutter. ---------- */
  A.envelope = function (x, rate) {
    var hop = Math.round(rate / ENV_FPS), n = Math.floor(x.length / hop), e = new Float32Array(n), i, j, s, sorted, top, o = new Float32Array(n), act = new Float32Array(n), v = 0;
    for (i = 0; i < n; i++) { s = 0; for (j = i * hop; j < i * hop + hop; j++) s += x[j] * x[j]; e[i] = Math.sqrt(s / hop); }
    sorted = Array.prototype.slice.call(e).sort(function (a, b) { return a - b; }); top = sorted[Math.floor(n * 0.95)] || 0;
    if (top < 0.004) return { open: o, act: act, fps: ENV_FPS, silent: true };
    for (i = 0; i < n; i++) { var g = e[i] / top, want = g < 0.125 ? 0 : Math.pow(clamp((g - 0.125) / 0.875, 0, 1), 0.55); v += (want - v) * (want > v ? 0.6 : 0.22); o[i] = v < 0.02 ? 0 : v; }
    /* "is singing": open at any moment within a third of a second, eased (drives the lean-in, the arm, the notes) */
    var w = Math.round(ENV_FPS * 0.33), run = 0, a = 0; for (i = 0; i < n; i++) { if (o[i] > 0.05) run = w; else if (run > 0) run--; a += ((run > 0 ? 1 : 0) - a) * 0.12; act[i] = a; }
    return { open: o, act: act, fps: ENV_FPS, silent: false };
  };
  function sample(arr, fps, t) { var f = t * fps, i = Math.floor(f), k = f - i; if (i < 0) return 0; if (i >= arr.length - 1) return arr.length ? arr[arr.length - 1] * 0 : 0; return arr[i] + (arr[i + 1] - arr[i]) * k; }

  /* ---------- the stage. card.premium = { title, signoff, costume, members: [{ head, env, variant, costume? }] } ---------- */
  A.stageRect = function (W, H, L) { var tall = H / W > 1.3, u = L.u, top = H * (tall ? 0.118 : 0.132), bottom = L.band.y - u * 2.2; return { x: W * 0.03, y: top, w: W * 0.94, h: bottom - top, top: top, bottom: bottom }; };
  A.drawStage = function (ctx, W, H, card, t, env, deps) {
    var Art = deps.Art, Engine = deps.Engine, tp = deps.template, P = card.premium, L = Engine.layout(W, H, card), u = L.u, pal = tp.look.pal, bt = Engine.beatAt(card, t), S = A.stageRect(W, H, L), tm = Engine.timing(card), boxes = env && env.premiumBoxes;
    var cutY = L.band.y - u * 0.9, n = P.members.length, i;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, cutY); ctx.clip();
    Art.backdrop(tp.backdrop, ctx, W, H, t, pal, { beat: bt.phase, n: bt.n, seed: tp.id });
    if (tp.look.dim) { ctx.fillStyle = 'rgba(0,0,0,' + tp.look.dim * 0.5 + ')'; ctx.fillRect(0, 0, W, H); }
    /* a floor to stand on: a soft band of the template's paper colour under the front row */
    var fl = ctx.createLinearGradient(0, S.bottom - S.h * 0.16, 0, cutY); fl.addColorStop(0, 'rgba(255,255,255,0)'); fl.addColorStop(0.35, mix(pal.snow || '#ffffff', pal.bg, 0.25)); fl.addColorStop(1, mix(pal.snow || '#ffffff', pal.bg, 0.45)); ctx.fillStyle = fl; ctx.fillRect(0, S.bottom - S.h * 0.16, W, cutY - S.bottom + S.h * 0.16);
    var slots = A.arrange(n, { x: S.x, y: S.y, w: S.w, h: S.h - u * 1.2 }), acts = [], all = 1, any = 0;
    for (i = 0; i < n; i++) { var e = P.members[i].env; acts[i] = e ? sample(e.act, e.fps, t) : 0; all = Math.min(all, acts[i]); any = Math.max(any, acts[i]); }
    var together = sstep(0.5, 0.9, all), beatPos = bt.n + bt.phase, lastRow = -1;
    slots.forEach(function (sl) {
      var av = P.members[sl.i], e = av.env, sing = acts[sl.i], open = e ? sample(e.open, e.fps, t) : 0, own = sl.i % 2 ? 1 : -1, dir = own;
      if (sl.row !== lastRow && sl.row > 0) { /* the riser this row stands on */ var x0 = sl.x - sl.h * 0.3, x1 = sl.x + sl.slot * (sl.count - 1) + sl.h * 0.3; var step = mix(pal.paper || '#ffffff', pal.bg2 || pal.bg, 0.45); fillRR(ctx, x0, sl.feet - sl.h * 0.012, x1 - x0, sl.h * 0.8, sl.h * 0.03, dark(step, 0.12)); fillRR(ctx, x0, sl.feet - sl.h * 0.012, x1 - x0, sl.h * 0.045, sl.h * 0.02, light(step, 0.35)); }
      lastRow = sl.row;
      /* the beat: a hop on every beat and a sway over two. Alone, neighbours sway opposite ways and half a beat
         apart; when everyone sings the hook they move as one */
      var ph = beatPos + (1 - together) * (sl.i % 2 ? 0.5 : 0), hopA = Math.abs(Math.sin(PI * ph)), swayDir = together * 1 + (1 - together) * own;
      var mo = { open: open, dir: dir, hop: (0.012 + 0.022 * sing) * Math.pow(hopA, 1.5) * (0.6 + 0.4 * bt.energy), sway: Math.sin(PI * beatPos) * 0.028 * swayDir, tilt: Math.sin(PI * beatPos + 0.7) * 0.05 * swayDir - 0.035 * sing * own, arm: sing * (0.55 + 0.25 * Math.sin(PI * beatPos)), wave: beatPos * PI + sl.i, scale: 0.97 + 0.06 * sing };
      A.drawAvatar(ctx, { head: av.head, costume: av.costume || P.costume, variant: av.variant === undefined ? sl.i : av.variant }, sl.x, sl.feet, sl.h, mo);
      if (sing > 0.3) for (var k = 0; k < 2; k++) { var f = (t * 0.7 + k * 0.5 + sl.i * 0.37) % 1, nx = sl.x + own * sl.h * (0.2 + 0.08 * f) + Math.sin(f * 6 + k) * sl.h * 0.02, ny = sl.feet - sl.h * (0.74 + 0.28 * f); if (ny > S.top - u) note(ctx, nx, ny, sl.h * 0.035, pal.gold || '#ffd27a', (sing - 0.3) / 0.7 * (1 - f) * 0.95); }
      if (boxes) { var hh = sl.h * HEAD, hw = hh * av.head.aspect, cx = sl.x - Math.sin(mo.sway) * sl.h * 0.8, cy = sl.feet - mo.hop * sl.h - sl.h * (NECK + HEAD / 2); boxes.push({ kind: 'face', i: sl.i, row: sl.row, x: cx - hw / 2, y: cy - hh / 2, w: hw, h: hh + A.JAW * hh }); boxes.push({ kind: 'avatar', i: sl.i, row: sl.row, x: sl.x - sl.h * WF / 2, y: sl.feet - sl.h * (1 + HAT), w: sl.h * WF, h: sl.h * (1 + HAT) }); }
    });
    if (tp.particles) Art.particles(tp.particles, ctx, W, H, t, pal, { amount: (tp.particleAmount == null ? 1 : tp.particleAmount) * 0.6, seed: tp.id, beat: bt.phase });
    /* the ribbon at the top: the carol's title; the sign-off for the last seconds */
    var fam = tp.look.fonts.title, lastLine = tm.lines.length ? tm.lines[tm.lines.length - 1].t1 : tm.duration - 3, end = sstep(lastLine + 0.2, lastLine + 0.9, t), text = end > 0.5 ? P.signoff : P.title, a = end > 0.5 ? sstep(0.5, 1, end) : (1 - sstep(0, 0.5, end)) * sstep(0.15, 0.7, t);
    var px = H * (H / W > 1.3 ? 0.034 : 0.043), maxW = W * 0.84, tw; ctx.font = Math.round(px) + 'px "' + fam + '"'; tw = ctx.measureText(text).width; if (tw > maxW) { px *= maxW / tw; ctx.font = Math.round(px) + 'px "' + fam + '"'; tw = ctx.measureText(text).width; }
    var rh = px * 1.75, ry = S.top - rh - u * 2.2, rx = W / 2 - tw / 2 - px * 0.9, rw = tw + px * 1.8;
    ctx.globalAlpha = a; fillRR(ctx, rx + u * 0.4, ry + u * 0.6, rw, rh, rh * 0.3, 'rgba(0,0,0,0.22)'); fillRR(ctx, rx, ry, rw, rh, rh * 0.3, pal.paper || '#fff8ee'); rr(ctx, rx + u * 0.5, ry + u * 0.5, rw - u, rh - u, rh * 0.25); ctx.lineWidth = Math.max(1, u * 0.25); ctx.strokeStyle = pal.accent; ctx.stroke();
    ctx.fillStyle = pal.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W / 2, ry + rh * 0.54); ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (boxes) { boxes.push({ kind: 'ribbon', x: rx, y: ry, w: rw, h: rh }); boxes.push({ kind: 'band', x: L.band.x, y: L.band.y, w: L.band.w, h: L.band.h }); boxes.push({ kind: 'frame', x: 0, y: 0, w: W, h: H }); }
    ctx.restore();
    if (tp.look.border && tp.look.border !== 'none') { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, cutY); ctx.clip(); Art.border(tp.look.border, ctx, W, H, t, pal, { beat: bt.phase, n: bt.n, seed: tp.id }); ctx.restore(); }
  };
  return A;
});
