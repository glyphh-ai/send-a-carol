/* Send a Carol art pack: borders, set A (party, classic, botanical and festive edges). Blocks only come in through CarolArt.add; nothing here replaces launch art. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) factory(require('../art.js'));
  else factory(root.CarolArt);
})(typeof self !== 'undefined' ? self : this, function (Art) {
  'use strict';
  var K = Art.kit, TAU = K.TAU, PI = K.PI, F = K.F, E = K.E, dot = K.dot, R = K.R, Rn = K.Rn, L = K.L, Pg = K.Pg, shade = K.shade, alpha = K.alpha, mix = K.mix, clamp = K.clamp, frac = K.frac, rnd = K.rnd;
  var edgeWalk = K.edgeWalk;

  /* ---------- helpers ---------- */
  /* points round a rounded rectangle, clockwise from the top left: [x, y, nx, ny] with (nx, ny) the inward normal; the count is a multiple of `mult` */
  function loop(W, H, ins, rad, step, mult) {
    var w = W - ins * 2, h = H - ins * 2, sl = [w - rad * 2, h - rad * 2], q = PI / 2 * rad, Lp = 2 * (sl[0] + sl[1]) + 4 * q, m = mult || 1, n = Math.max(m, Math.round(Lp / step / m) * m), out = [], i, s;
    var st = [[ins + rad, ins], [W - ins, ins + rad], [W - ins - rad, H - ins], [ins, H - ins - rad]];
    for (i = 0; i < n; i++) {
      var d = i / n * Lp;
      for (s = 0; s < 4; s++) {
        var len = sl[s % 2], a = s * PI / 2, tx = Math.cos(a), ty = Math.sin(a), nx = -ty, ny = tx, sx = st[s][0], sy = st[s][1];
        if (d < len || (s === 3 && q <= 0)) { out.push([sx + tx * d, sy + ty * d, nx, ny]); break; }
        d -= len;
        if (d < q || s === 3) { var an = a - PI / 2 + d / rad, cx = sx + tx * len + nx * rad, cy = sy + ty * len + ny * rad; out.push([cx + Math.cos(an) * rad, cy + Math.sin(an) * rad, -Math.cos(an), -Math.sin(an)]); break; }
        d -= q;
      }
    }
    return out;
  }
  function tracePts(c, pts, off) { /* a closed path through the points, pushed inward by off(i) */
    var i, o; c.moveTo(pts[0][0] + pts[0][2] * (o = off ? off(0) : 0), pts[0][1] + pts[0][3] * o);
    for (i = 1; i < pts.length; i++) { o = off ? off(i) : 0; c.lineTo(pts[i][0] + pts[i][2] * o, pts[i][1] + pts[i][3] * o); }
    c.closePath();
  }
  function edgePt(d, W, H) { /* a point on the canvas edge at distance d round it: [x, y, nx, ny] */
    if (d < W) return [d, 0, 0, 1]; d -= W; if (d < H) return [W, d, -1, 0]; d -= H; if (d < W) return [W - d, H, 0, -1]; return [0, H - (d - W), 1, 0];
  }
  function band(c, W, H, a, b2) { /* the ring between two insets, as a path for an evenodd fill */
    c.beginPath(); c.rect(a, a, W - a * 2, H - a * 2); c.rect(b2, b2, W - b2 * 2, H - b2 * 2);
  }
  function corners(W, H, ins, fn) { /* fn(x, y, sx, sy, i): the four corners, sx/sy point into the canvas */
    fn(ins, ins, 1, 1, 0); fn(W - ins, ins, -1, 1, 1); fn(W - ins, H - ins, -1, -1, 2); fn(ins, H - ins, 1, -1, 3);
  }
  function lf(c, x, y, len, rot, col, wid, line) { /* a pointed leaf from its stalk, with an outline and a midrib */
    var w = len * (wid || 0.3), cs = Math.cos(rot), sn = Math.sin(rot), mx = x + cs * len * 0.5, my = y + sn * len * 0.5, ex = x + cs * len, ey = y + sn * len;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx - sn * w, my + cs * w, ex, ey); c.quadraticCurveTo(mx + sn * w, my - cs * w, x, y); c.closePath();
    c.fillStyle = col; c.fill();
    if (line) { c.lineWidth = Math.max(0.5, len * 0.05); c.strokeStyle = line; c.stroke(); }
    c.beginPath(); c.moveTo(x + cs * len * 0.12, y + sn * len * 0.12); c.lineTo(x + cs * len * 0.8, y + sn * len * 0.8); c.lineWidth = Math.max(0.4, len * 0.04); c.strokeStyle = line || shade(col, 0.3); c.stroke();
  }
  function star5(c, x, y, r, rot, col, line, lw) {
    K.starPath(c, x, y, r, r * 0.46, 5, rot); c.fillStyle = col; c.fill(); if (line) { c.lineWidth = lw; c.strokeStyle = line; c.stroke(); }
  }

  /* ---------- confettiedge: paper confetti that settled along every edge ---------- */
  Art.add('border', 'confettiedge', function (c, W, H, t, p, o, b) {
    var R0 = rnd(o.seed + 'ce'), per = 2 * (W + H), n = Math.round(per / b * 3.4), cols = [p.accent, p.gold, p.accent2, p.paper, shade(p.accent, 0.4), shade(p.accent2, 0.35)], k = Math.exp(-5 * o.beat), i;
    c.lineCap = 'round';
    for (i = 0; i < n; i++) {
      var q = edgePt(R0() * per, W, H), dep = b * (0.12 + 0.68 * Math.pow(R0(), 1.35)), s = b * (0.17 + 0.14 * R0()) * ((i + o.n) % 3 === 0 ? 1 + 0.22 * k : 1), sp = (R0() - 0.5) * 1.6, rot = R0() * TAU + t * sp, col = cols[i % 6], kind = i % 5;
      var x = q[0] + q[2] * dep + Math.sin(t * 0.9 + i) * b * 0.03, y = q[1] + q[3] * dep + Math.cos(t * 0.8 + i * 1.7) * b * 0.03, cs = Math.cos(rot), sn = Math.sin(rot);
      if (kind === 0 || kind === 4) { /* a paper rectangle that flips as it turns */
        var hw = s * 0.8, hh = s * 0.42 * (0.35 + 0.65 * Math.abs(Math.cos(t * (1.2 + sp) + i)));
        c.beginPath(); c.moveTo(x - cs * hw + sn * hh, y - sn * hw - cs * hh); c.lineTo(x + cs * hw + sn * hh, y + sn * hw - cs * hh); c.lineTo(x + cs * hw - sn * hh, y + sn * hw + cs * hh); c.lineTo(x - cs * hw - sn * hh, y - sn * hw + cs * hh); c.closePath(); c.fillStyle = col; c.fill();
        c.beginPath(); c.moveTo(x - cs * hw + sn * hh, y - sn * hw - cs * hh); c.lineTo(x + cs * hw + sn * hh, y + sn * hw - cs * hh); c.lineTo(x + cs * hw, y + sn * hw); c.lineTo(x - cs * hw, y - sn * hw); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.28)'; c.fill();
      } else if (kind === 1) { dot(c, x, y, s * 0.5, col); dot(c, x - s * 0.14, y - s * 0.16, s * 0.17, 'rgba(255,255,255,0.5)'); }
      else if (kind === 2) { c.beginPath(); c.moveTo(x + cs * s * 0.75, y + sn * s * 0.75); c.lineTo(x + Math.cos(rot + 2.1) * s * 0.75, y + Math.sin(rot + 2.1) * s * 0.75); c.lineTo(x + Math.cos(rot + 4.2) * s * 0.75, y + Math.sin(rot + 4.2) * s * 0.75); c.closePath(); c.fillStyle = col; c.fill(); }
      else { c.beginPath(); c.arc(x, y, s * 0.62, rot, rot + PI * 1.25); c.lineWidth = s * 0.34; c.strokeStyle = col; c.stroke(); }
    }
  });

  /* ---------- streamers: two twisted crepe streamers and a paper rosette in each corner ---------- */
  Art.add('border', 'streamers', function (c, W, H, t, p, o, b) {
    var pts = loop(W, H, b * 0.5, b * 0.7, b * 0.128, 36), n = pts.length, k = Math.exp(-5 * o.beat), s, m, j;
    var defs = [[p.accent2, -0.17, 0.2, 3, 0.7], [p.accent, 0.15, 0.22, 0, -0.9]];
    for (s = 0; s < 2; s++) {
      var d = defs[s], lite = d[0], dark = shade(d[0], -0.24), hi = shade(d[0], 0.3);
      for (m = 0; m < n / 6; m++) {
        var at = function (jj, sg) { var idx = (m * 6 + jj + d[3]) % n, q = pts[idx], off = b * (d[1] + 0.09 * Math.sin(idx / 36 * TAU + t * d[4])) + sg * b * d[2] * Math.sin(PI * jj / 6); return [q[0] + q[2] * off, q[1] + q[3] * off]; }, pt;
        c.beginPath(); pt = at(0, 1); c.moveTo(pt[0], pt[1]); for (j = 1; j <= 6; j++) { pt = at(j, 1); c.lineTo(pt[0], pt[1]); } for (j = 5; j >= 1; j--) { pt = at(j, -1); c.lineTo(pt[0], pt[1]); } c.closePath(); c.fillStyle = m % 2 ? dark : lite; c.fill();
        if (m % 2 === 0) { c.beginPath(); pt = at(1, 0.45); c.moveTo(pt[0], pt[1]); for (j = 2; j <= 5; j++) { pt = at(j, 0.45); c.lineTo(pt[0], pt[1]); } c.lineWidth = b * 0.045; c.strokeStyle = hi; c.stroke(); }
      }
    }
    corners(W, H, b * 0.62, function (x, y, sx, sy, i) { /* pleated rosettes */
      var r = b * (0.5 + ((i + o.n) % 2 === 0 ? 0.06 * k : 0)), col = i % 2 ? p.accent : p.gold, a0 = t * 0.25 * (i % 2 ? 1 : -1), w;
      dot(c, x + b * 0.03, y + b * 0.05, r, 'rgba(0,0,0,0.16)');
      for (w = 0; w < 12; w++) { c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, a0 + w / 12 * TAU, a0 + (w + 1) / 12 * TAU + 0.02); c.closePath(); c.fillStyle = w % 2 ? col : shade(col, -0.2); c.fill(); }
      dot(c, x, y, r * 0.36, p.paper); dot(c, x, y, r * 0.2, i % 2 ? p.gold : p.accent);
    });
  });

  /* ---------- laurel: a victor's wreath that climbs both sides from a bow to a star ---------- */
  Art.add('border', 'laurel', function (c, W, H, t, p, o, b) {
    var g1 = p.gold, g2 = shade(p.gold, -0.16), ln = shade(p.gold, -0.45), ins = b * 0.5, k = Math.exp(-5 * o.beat);
    c.lineCap = 'round'; c.lineWidth = b * 0.07; c.strokeStyle = ln;
    c.beginPath(); c.moveTo(W / 2 - b * 0.7, H - ins); c.lineTo(ins, H - ins); c.lineTo(ins, ins); c.lineTo(W / 2 - b * 1.0, ins); c.moveTo(W / 2 + b * 0.7, H - ins); c.lineTo(W - ins, H - ins); c.lineTo(W - ins, ins); c.lineTo(W / 2 + b * 1.0, ins); c.stroke();
    edgeWalk(W, H, ins, b * 0.62, function (x, y, a, i, s) {
      var g = a, dx = x - W / 2, sw = Math.sin(t * 1.3 + i * 0.8) * 0.07, len = b * 0.66;
      if (s === 0) { if (Math.abs(dx) < b * 1.25) return; if (dx > 0) g = a + PI; } else if (s === 1) g = a + PI; else if (s === 2) { if (Math.abs(dx) < b * 0.95) return; if (dx > 0) g = a + PI; }
      var bx = x - Math.cos(g) * len * 0.3, by = y - Math.sin(g) * len * 0.3;
      lf(c, bx, by, len, g + 0.62 + sw, i % 2 ? g1 : g2, 0.34, ln); lf(c, bx, by, len, g - 0.62 - sw, i % 2 ? g2 : g1, 0.34, ln);
      if (i % 4 === 1) { dot(c, bx, by, b * 0.1, p.accent); dot(c, bx - b * 0.03, by - b * 0.03, b * 0.035, 'rgba(255,255,255,0.7)'); }
    });
    var sow = K.ow(); K.ow(b * 0.04); K.bow(c, W / 2, H - ins - b * 0.08, b * 0.95, p.accent); K.ow(sow);
    star5(c, W / 2, ins + b * 0.02, b * (0.42 + 0.06 * k), Math.sin(t * 1.1) * 0.12, g1, ln, b * 0.05); K.twinkle(c, W / 2 - b * 0.1, ins - b * 0.1, b * (0.14 + 0.06 * Math.sin(t * 3)), '#fffbe0');
  });

  /* ---------- artdeco: a dark band with gold lines, diamonds and corner fans ---------- */
  Art.add('border', 'artdeco', function (c, W, H, t, p, o, b) {
    var gd = p.gold, dk = mix(p.ink, '#0c0c14', 0.35), ins = b * 0.51, k = Math.exp(-5 * o.beat), j;
    band(c, W, H, b * 0.14, b * 0.88); c.fillStyle = dk; c.fill('evenodd');
    c.lineJoin = 'miter'; c.lineCap = 'butt'; c.strokeStyle = gd; c.lineWidth = b * 0.07; c.strokeRect(b * 0.14, b * 0.14, W - b * 0.28, H - b * 0.28); c.lineWidth = b * 0.05; c.strokeRect(b * 0.88, b * 0.88, W - b * 1.76, H - b * 1.76);
    c.lineWidth = b * 0.025; c.strokeStyle = alpha(gd, 0.6); c.strokeRect(b * 0.25, b * 0.25, W - b * 0.5, H - b * 0.5); c.strokeRect(b * 0.77, b * 0.77, W - b * 1.54, H - b * 1.54);
    var step = b * 1.7;
    c.beginPath();
    edgeWalk(W, H, ins, step, function (x, y, a, i, s) {
      var len = (s % 2 ? H : W) - ins * 2, st = len / Math.max(1, Math.round(len / step)), tx = Math.cos(a), ty = Math.sin(a), nx = -ty, ny = tx, e = b * 0.36, hh = b * 0.2;
      c.moveTo(x - tx * e, y - ty * e); c.lineTo(x + nx * hh, y + ny * hh); c.lineTo(x + tx * e, y + ty * e); c.lineTo(x - nx * hh, y - ny * hh); c.closePath();
      for (j = -1; j <= 1; j++) { var mx = x + tx * (st / 2 + j * b * 0.13), my = y + ty * (st / 2 + j * b * 0.13), h2 = b * (j ? 0.11 : 0.2), w2 = b * 0.03; if (Math.abs((s % 2 ? my : mx) - (s % 2 ? H : W) / 2) > len / 2 - b * 1.6) continue; c.moveTo(mx - tx * w2 - nx * h2, my - ty * w2 - ny * h2); c.lineTo(mx + tx * w2 - nx * h2, my + ty * w2 - ny * h2); c.lineTo(mx + tx * w2 + nx * h2, my + ty * w2 + ny * h2); c.lineTo(mx - tx * w2 + nx * h2, my - ty * w2 + ny * h2); c.closePath(); }
    });
    c.fillStyle = gd; c.fill();
    edgeWalk(W, H, ins, step, function (x, y) { dot(c, x, y, b * 0.07, dk); });
    corners(W, H, b * 0.14, function (x, y, sx, sy, i) { /* quarter fans */
      var r = b * 1.75, a0 = Math.atan2(sy, sx) - PI / 4, f;
      c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, a0, a0 + PI / 2); c.closePath(); c.fillStyle = dk; c.fill(); c.lineWidth = b * 0.07; c.strokeStyle = gd; c.stroke();
      for (f = 1; f < 6; f++) { var an = a0 + f / 6 * PI / 2; c.beginPath(); c.moveTo(x + Math.cos(an) * r * 0.36, y + Math.sin(an) * r * 0.36); c.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); c.lineWidth = b * 0.04; c.stroke(); }
      c.beginPath(); c.moveTo(x, y); c.arc(x, y, r * 0.36, a0, a0 + PI / 2); c.closePath(); c.fillStyle = gd; c.fill();
      c.beginPath(); c.arc(x, y, r * 0.68, a0, a0 + PI / 2); c.lineWidth = b * 0.03; c.strokeStyle = alpha(gd, 0.7); c.stroke();
      K.twinkle(c, x + sx * r * 0.5, y + sy * r * 0.5, b * (0.2 + ((i + o.n) % 2 === 0 ? 0.16 * k : 0.04 * Math.sin(t * 2 + i))), '#fffbe0');
    });
  });

  /* ---------- greekkey: a meander on a pale band ---------- */
  Art.add('border', 'greekkey', function (c, W, H, t, p, o, b) {
    var o1 = b * 0.1, o2 = b * 0.95, ink = p.ink, k = Math.exp(-5 * o.beat), s, i, y0 = b * 0.3, y3 = b * 0.75, y1 = y0 + (y3 - y0) / 3, y2 = y0 + (y3 - y0) * 2 / 3;
    band(c, W, H, o1, o2); c.fillStyle = p.paper; c.fill('evenodd');
    c.lineJoin = 'miter'; c.lineCap = 'butt';
    for (s = 0; s < 4; s++) {
      var len = s % 2 ? H : W, run = len - o2 * 2 - b * 0.3, n = Math.max(1, Math.round(run / (b * 0.62))), ux = run / n / 4, xs = o2 + b * 0.15;
      c.save(); c.translate(s === 1 || s === 2 ? W : 0, s > 1 ? H : 0); c.rotate(s * PI / 2);
      c.beginPath(); c.moveTo(o2 - b * 0.02, y3); c.lineTo(len - o2 + b * 0.02, y3);
      for (i = 0; i < n; i++) { var x0 = xs + (i * 4 + 0.5) * ux; c.moveTo(x0, y3); c.lineTo(x0, y0); c.lineTo(x0 + ux * 3, y0); c.lineTo(x0 + ux * 3, y2); c.lineTo(x0 + ux, y2); c.lineTo(x0 + ux, y1 - b * 0.02); }
      c.lineWidth = b * 0.085; c.strokeStyle = ink; c.stroke();
      c.restore();
    }
    c.lineWidth = b * 0.05; c.strokeStyle = p.gold; c.strokeRect(o1, o1, W - o1 * 2, H - o1 * 2); c.strokeRect(o2, o2, W - o2 * 2, H - o2 * 2);
    corners(W, H, (o1 + o2) / 2, function (x, y, sx, sy, j) {
      var r = b * 0.3; c.lineWidth = b * 0.085; c.strokeStyle = ink; c.strokeRect(x - r, y - r, r * 2, r * 2);
      Pg(c, [[x, y - r * 0.62], [x + r * 0.62, y], [x, y + r * 0.62], [x - r * 0.62, y]], p.gold, true); dot(c, x, y, b * (0.06 + ((j + o.n) % 2 === 0 ? 0.04 * k : 0)), p.paper);
    });
  });

  /* ---------- wavy: three paper waves lapping in from the edge ---------- */
  Art.add('border', 'wavy', function (c, W, H, t, p, o, b) {
    var defs = [[p.accent2, 0.7, 0.13, 0.8, 0], [p.gold, 0.48, 0.11, -1.0, 2.1], [p.accent, 0.27, 0.09, 1.2, 4.0]], s;
    for (s = 0; s < 3; s++) {
      var d = defs[s], pts = loop(W, H, b * d[1], b * 1.3, b * 0.15, 16), off = (function (d) { return function (i) { return b * d[2] * Math.sin(i / 16 * TAU + t * d[3] + d[4]); }; })(d);
      c.beginPath(); c.rect(0, 0, W, H); tracePts(c, pts, off); c.fillStyle = d[0]; c.fill('evenodd');
      c.beginPath(); tracePts(c, pts, function (i) { return off(i) - b * 0.05; }); c.lineWidth = b * 0.045; c.strokeStyle = alpha(shade(d[0], 0.55), 0.75); c.stroke();
      c.beginPath(); tracePts(c, pts, off); c.lineWidth = b * 0.03; c.strokeStyle = shade(d[0], -0.3); c.stroke();
    }
  });

  /* ---------- rope: a twisted rope with a knot in each corner ---------- */
  Art.add('border', 'rope', function (c, W, H, t, p, o, b) {
    var rope = mix('#d8b07a', p.gold, 0.22), dk = shade(rope, -0.42), md = shade(rope, -0.2), pts = loop(W, H, b * 0.5, b * 0.95, b * 0.25), i, hw = b * 0.24, sl = b * 0.14;
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); tracePts(c, pts); c.lineWidth = b * 0.62; c.strokeStyle = dk; c.stroke(); c.lineWidth = b * 0.5; c.strokeStyle = rope; c.stroke();
    c.beginPath(); for (i = 0; i < pts.length; i++) { var q = pts[i], tx = q[3], ty = -q[2]; c.moveTo(q[0] + q[2] * hw - tx * sl, q[1] + q[3] * hw - ty * sl); c.lineTo(q[0] - q[2] * hw + tx * sl, q[1] - q[3] * hw + ty * sl); } c.lineWidth = b * 0.05; c.strokeStyle = md; c.stroke();
    c.beginPath(); for (i = 0; i < pts.length; i++) { var q2 = pts[i], n2 = pts[(i + 1) % pts.length], mx = (q2[0] + n2[0]) / 2, my = (q2[1] + n2[1]) / 2, t2x = q2[3], t2y = -q2[2]; c.moveTo(mx - q2[2] * hw * 0.55 + t2x * sl * 0.5, my - q2[3] * hw * 0.55 + t2y * sl * 0.5); c.lineTo(mx - q2[2] * hw * 0.1 + t2x * sl * 0.1, my - q2[3] * hw * 0.1 + t2y * sl * 0.1); } c.lineWidth = b * 0.05; c.strokeStyle = shade(rope, 0.4); c.stroke();
    corners(W, H, b * 0.62, function (x, y, sx, sy, j) { /* a knot with two frayed tails */
      var sw = Math.sin(t * 1.4 + j) * 0.12, e;
      for (e = -1; e <= 1; e += 2) { var an = Math.atan2(sy, sx) + e * (0.5 + sw * e), ex = x + Math.cos(an) * b * 0.82, ey = y + Math.sin(an) * b * 0.82; L(c, x, y, ex, ey, b * 0.3, dk); L(c, x, y, ex, ey, b * 0.2, rope); L(c, ex, ey, ex + Math.cos(an) * b * 0.08, ey + Math.sin(an) * b * 0.08, b * 0.34, dk); L(c, ex, ey, ex + Math.cos(an) * b * 0.07, ey + Math.sin(an) * b * 0.07, b * 0.25, shade(rope, 0.25)); L(c, x + Math.cos(an) * b * 0.6, y + Math.sin(an) * b * 0.6 - b * 0.08, x + Math.cos(an) * b * 0.66, y + Math.sin(an) * b * 0.66 + b * 0.08, b * 0.06, p.accent); }
      dot(c, x, y, b * 0.44, dk); dot(c, x, y, b * 0.37, rope);
      c.lineWidth = b * 0.055; c.strokeStyle = md; for (e = -1; e <= 1; e++) { c.beginPath(); c.arc(x + sx * b * 0.5 + e * sx * b * 0.2, y - sy * b * 0.3, b * 0.6, Math.atan2(sy, -sx) - 0.5, Math.atan2(sy, -sx) + 0.5); c.stroke(); }
      c.beginPath(); c.arc(x - b * 0.1, y - b * 0.1, b * 0.2, PI, PI * 1.5); c.strokeStyle = shade(rope, 0.4); c.stroke();
    });
  });

  /* ---------- floralcorners: a posy in each corner, trailing a little way down the edges ---------- */
  Art.add('border', 'floralcorners', function (c, W, H, t, p, o, b) {
    var gr = p.accent2, g2 = shade(gr, 0.22), g3 = shade(gr, -0.18), ln = shade(gr, -0.4), k = Math.exp(-5 * o.beat), s;
    c.lineWidth = b * 0.05; c.strokeStyle = alpha(p.gold, 0.95); c.strokeRect(b * 0.36, b * 0.36, W - b * 0.72, H - b * 0.72);
    for (s = 0; s < 4; s++) { /* a sprig at the middle of each side */
      var mx = s % 2 ? (s === 1 ? W - b * 0.36 : b * 0.36) : W / 2, my = s % 2 ? H / 2 : (s === 0 ? b * 0.36 : H - b * 0.36), a = s % 2 ? PI / 2 : 0, sw0 = Math.sin(t * 1.2 + s) * 0.08;
      lf(c, mx, my, b * 0.8, a + 0.18 + sw0, gr, 0.3, ln); lf(c, mx, my, b * 0.8, a + PI - 0.18 - sw0, g2, 0.3, ln); lf(c, mx, my, b * 0.5, a + 0.7, g3, 0.3, ln); lf(c, mx, my, b * 0.5, a + PI - 0.7, g3, 0.3, ln);
      K.flower(c, mx, my, b * 0.3, s % 2 ? p.accent : shade(p.accent, 0.4), p.gold, t * 0.3 + s);
    }
    corners(W, H, 0, function (x, y, sx, sy, i) {
      var z = i < 2 ? 1 : 0.86, P2 = function (u, v) { return [x + sx * u * b * z, y + sy * v * b * z]; }, an = function (dx, dy) { return Math.atan2(sy * dy, sx * dx); }, sw = Math.sin(t * 1.1 + i * 1.7) * 0.07, q, j, e;
      for (e = 0; e < 2; e++) { /* the trailing stems, one down each edge */
        var A = P2(e ? 0.5 : 1.2, e ? 1.2 : 0.5), B = P2(e ? 0.7 : 3.6, e ? 3.6 : 0.7), C2 = P2(e ? 0.38 : 5.9, e ? 5.9 : 0.38);
        c.beginPath(); c.moveTo(A[0], A[1]); c.quadraticCurveTo(B[0], B[1], C2[0], C2[1]); c.lineWidth = b * 0.07 * z; c.strokeStyle = ln; c.stroke();
        for (j = 0; j < 5; j++) { var f = 0.42 + j * 0.13, u = 1.2 + (5.9 - 1.2) * f, v = 0.5 + (0.38 - 0.5) * f + 0.2 * 4 * f * (1 - f) * 0.5, pt = e ? P2(v, u) : P2(u, v), side = j % 2 ? 1 : -1, base = e ? an(side * 0.75, 1) : an(1, side * 0.75); lf(c, pt[0], pt[1], b * z * (0.62 - j * 0.06), base + sw * side, j % 2 ? gr : g2, 0.32, ln); }
        q = e ? P2(0.42, 6.05) : P2(6.05, 0.42); dot(c, q[0], q[1], b * 0.13 * z, p.accent); q = e ? P2(0.62, 5.55) : P2(5.55, 0.62); dot(c, q[0], q[1], b * 0.1 * z, p.gold);
      }
      /* leaves behind the blooms */
      q = P2(0.95, 0.95);
      lf(c, q[0], q[1], b * z * 1.75, an(1, 0.12) + sw, g3, 0.26, ln); lf(c, q[0], q[1], b * z * 1.75, an(0.12, 1) - sw, g3, 0.26, ln); lf(c, q[0], q[1], b * z * 1.55, an(1, 1), gr, 0.3, ln);
      lf(c, q[0], q[1], b * z * 1.35, an(1, 0.5) + sw, g2, 0.3, ln); lf(c, q[0], q[1], b * z * 1.35, an(0.5, 1) - sw, g2, 0.3, ln);
      /* the posy */
      q = P2(2.15, 0.62); K.bloom(c, q[0], q[1], b * z * 0.52, shade(p.accent, 0.42), t, i + 1.3); q = P2(0.62, 2.15); K.bloom(c, q[0], q[1], b * z * 0.52, p.gold, t, i + 2.9);
      q = P2(0.92, 0.92); dot(c, q[0] + b * 0.04, q[1] + b * 0.06, b * z * 0.8, 'rgba(0,0,0,0.12)'); K.bloom(c, q[0], q[1], b * z * (0.86 + ((i + o.n) % 2 === 0 ? 0.05 * k : 0)), p.accent, t, i * 0.9);
      q = P2(1.75, 1.3); K.flower(c, q[0], q[1], b * z * 0.24, p.paper, p.gold, t * 0.4 + i); q = P2(1.3, 1.75); K.flower(c, q[0], q[1], b * z * 0.2, p.paper, p.gold, -t * 0.4 + i);
      q = P2(2.85, 0.5); K.flower(c, q[0], q[1], b * z * 0.22, shade(p.accent, 0.2), p.gold, t * 0.3); q = P2(0.5, 2.85); K.flower(c, q[0], q[1], b * z * 0.22, shade(p.accent, 0.2), p.gold, -t * 0.3);
    });
  });

  /* ---------- leafcorners: fern fronds and broad leaves fanning out of each corner ---------- */
  Art.add('border', 'leafcorners', function (c, W, H, t, p, o, b) {
    var gr = p.accent2, g2 = shade(gr, 0.25), g3 = shade(gr, -0.22), ln = shade(gr, -0.45);
    c.lineWidth = b * 0.06; c.strokeStyle = alpha(p.gold, 0.95); c.strokeRect(b * 0.3, b * 0.3, W - b * 0.6, H - b * 0.6); c.lineWidth = b * 0.025; c.strokeRect(b * 0.46, b * 0.46, W - b * 0.92, H - b * 0.92);
    corners(W, H, 0, function (x, y, sx, sy, i) {
      var z = i < 2 ? 1 : 0.88, sw = Math.sin(t * 1.0 + i * 2.1) * 0.05, e, j, s;
      for (e = 0; e < 2; e++) { /* a frond down each edge */
        var len = b * z * 6.6, dx = e ? 0 : sx, dy = e ? sy : 0, nx = e ? sx : 0, ny = e ? 0 : sy, bx = x + sx * b * 0.55 * z + dx * b * 0.6, by = y + sy * b * 0.55 * z + dy * b * 0.6, ga = Math.atan2(dy, dx), turn = (e ? -1 : 1) * sx * sy;
        c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + dx * len * 0.5 + nx * b * 0.14, by + dy * len * 0.5 + ny * b * 0.14, bx + dx * len - nx * b * 0.12, by + dy * len - ny * b * 0.12); c.lineWidth = b * 0.07; c.strokeStyle = ln; c.stroke();
        for (j = 0; j < 13; j++) { var f = (j + 0.6) / 13.4, bend = 0.14 * 4 * f * (1 - f) - 0.12 * f * f, px = bx + dx * len * f + nx * b * bend, py = by + dy * len * f + ny * b * bend, ll = b * z * (0.56 - 0.3 * f), w2 = Math.sin(t * 1.3 + j * 0.6 + i) * 0.06;
          for (s = -1; s <= 1; s += 2) lf(c, px, py, ll, ga + s * (0.95 - 0.3 * f) + w2 * s + sw, (j + (s > 0 ? 1 : 0)) % 2 ? gr : g2, 0.3, ln); }
        lf(c, bx + dx * len * 0.97 - nx * b * 0.11, by + dy * len * 0.97 - ny * b * 0.11, b * z * 0.34, ga + turn * 0.05, g2, 0.3, ln);
      }
      var cx = x + sx * b * 0.3 * z, cy = y + sy * b * 0.3 * z, d0 = Math.atan2(sy, sx), fans = [[-0.52, 1.75, g3], [0.52, 1.75, g3], [0, 2.1, gr], [-0.27, 1.5, g2], [0.27, 1.5, g2]];
      for (j = 0; j < 5; j++) { var fa = d0 + fans[j][0] + sw * (j % 2 ? 1 : -1), fl = b * z * fans[j][1]; lf(c, cx, cy, fl, fa, fans[j][2], 0.42, ln);
        if (j < 3) { c.beginPath(); for (s = 1; s <= 3; s++) { var vx = cx + Math.cos(fa) * fl * s * 0.2, vy = cy + Math.sin(fa) * fl * s * 0.2; c.moveTo(vx, vy); c.lineTo(vx + Math.cos(fa + 0.8) * fl * 0.2, vy + Math.sin(fa + 0.8) * fl * 0.2); c.moveTo(vx, vy); c.lineTo(vx + Math.cos(fa - 0.8) * fl * 0.2, vy + Math.sin(fa - 0.8) * fl * 0.2); } c.lineWidth = b * 0.03; c.strokeStyle = ln; c.stroke(); } }
      dot(c, cx + sx * b * 0.22, cy + sy * b * 0.22, b * 0.2 * z, p.gold); dot(c, cx + sx * b * 0.62, cy + sy * b * 0.16, b * 0.13 * z, p.accent); dot(c, cx + sx * b * 0.16, cy + sy * b * 0.62, b * 0.13 * z, p.accent); dot(c, cx + sx * b * 0.17, cy + sy * b * 0.17, b * 0.07 * z, 'rgba(255,255,255,0.7)');
    });
  });

  /* ---------- starsedge: a row of stars that take turns to shine ---------- */
  Art.add('border', 'starsedge', function (c, W, H, t, p, o, b) {
    var k = Math.exp(-5 * o.beat), ins = b * 0.5, step = b * 1.32;
    edgeWalk(W, H, ins, step, function (x, y, a, i, s) {
      var len = (s % 2 ? H : W) - ins * 2, st = len / Math.max(1, Math.round(len / step)), lit = (i + o.n) % 2 === 0, gold = i % 3 !== 1, col = gold ? p.gold : p.paper, r = b * (i % 2 ? 0.34 : 0.44) * (lit ? 1 + 0.16 * k : 1), rot = Math.sin(t * 1.2 + i * 1.3) * 0.22;
      if (lit) dot(c, x, y, r * 1.2, alpha('#fff3b8', 0.08 + 0.16 * k));
      star5(c, x, y, r, rot, col, shade(col, gold ? -0.42 : -0.3), b * 0.045);
      star5(c, x - r * 0.06, y - r * 0.08, r * 0.52, rot, shade(col, gold ? 0.45 : -0.08), null);
      var mx = x + Math.cos(a) * st / 2, my = y + Math.sin(a) * st / 2, w = 0.5 + 0.5 * Math.sin(t * 2.6 + i * 2.2);
      if (i % 2) K.twinkle(c, mx, my - Math.cos(a) * b * 0.12, b * (0.13 + 0.12 * w), i % 4 === 1 ? p.snow : p.gold); else { dot(c, mx - Math.sin(a) * b * 0.16, my + Math.cos(a) * b * 0.16, b * 0.07, p.accent); dot(c, mx + Math.sin(a) * b * 0.18, my - Math.cos(a) * b * 0.18, b * 0.055, p.accent2); }
    });
  });

  /* ---------- sunrays: sunbeams reaching in from every edge, a sun rising in each corner ---------- */
  Art.add('border', 'sunrays', function (c, W, H, t, p, o, b) {
    var g1 = p.gold, g2 = mix(p.gold, p.accent, 0.5), ln = shade(g2, -0.3), step = b * 0.56, k = Math.exp(-5 * o.beat), pass;
    for (pass = 0; pass < 2; pass++) {
      c.beginPath();
      edgeWalk(W, H, 0, step, function (x, y, a, i, s) {
        if ((i % 2) !== pass) return;
        var len = s % 2 ? H : W, st = len / Math.max(1, Math.round(len / step)), tx = Math.cos(a), ty = Math.sin(a), nx = -ty, ny = tx, d = b * (pass ? 0.9 + 0.07 * Math.sin(t * 1.8 + i * 0.7) : 0.55 + 0.07 * Math.sin(t * 1.8 + i * 0.7 + 2)), hw = st * (pass ? 0.56 : 0.5);
        c.moveTo(x - tx * hw, y - ty * hw); c.lineTo(x + nx * d, y + ny * d); c.lineTo(x + tx * hw, y + ty * hw); c.closePath();
      });
      c.fillStyle = pass ? g1 : g2; c.fill();
      if (pass) { c.lineWidth = b * 0.03; c.strokeStyle = alpha(ln, 0.55); c.stroke(); }
    }
    band(c, W, H, 0, b * 0.13); c.fillStyle = g1; c.fill('evenodd');
    corners(W, H, 0, function (x, y, sx, sy, i) {
      var r = b * (1.12 + ((i + o.n) % 2 === 0 ? 0.07 * k : 0)), a0 = Math.atan2(sy, sx) - PI / 4, j;
      for (j = 0; j < 5; j++) { var an = a0 + (j + 0.5) / 5 * PI / 2 + Math.sin(t * 0.8 + i) * 0.03, rr = r + b * (j % 2 ? 0.42 : 0.7); c.beginPath(); c.moveTo(x + Math.cos(an - 0.13) * r * 0.9, y + Math.sin(an - 0.13) * r * 0.9); c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); c.lineTo(x + Math.cos(an + 0.13) * r * 0.9, y + Math.sin(an + 0.13) * r * 0.9); c.closePath(); c.fillStyle = j % 2 ? g2 : g1; c.fill(); c.lineWidth = b * 0.03; c.strokeStyle = alpha(ln, 0.55); c.stroke(); }
      c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, a0, a0 + PI / 2); c.closePath(); c.fillStyle = g1; c.fill(); c.lineWidth = b * 0.05; c.strokeStyle = ln; c.stroke();
      c.beginPath(); c.moveTo(x, y); c.arc(x, y, r * 0.72, a0, a0 + PI / 2); c.closePath(); c.fillStyle = shade(g1, 0.35); c.fill();
      /* a sleepy face peeping round the corner */
      var fx = x + sx * r * 0.36, fy = y + sy * r * 0.36;
      c.lineWidth = b * 0.05; c.strokeStyle = shade(g2, -0.5); c.lineCap = 'round';
      c.beginPath(); c.arc(fx - b * 0.14, fy - b * 0.03, b * 0.07, PI * 0.1, PI * 0.9); c.stroke(); c.beginPath(); c.arc(fx + b * 0.14, fy - b * 0.03, b * 0.07, PI * 0.1, PI * 0.9); c.stroke();
      c.beginPath(); c.arc(fx, fy + b * 0.06, b * 0.1, PI * 0.15, PI * 0.85); c.stroke();
      dot(c, fx - b * 0.24, fy + b * 0.1, b * 0.06, alpha(p.accent, 0.5)); dot(c, fx + b * 0.24, fy + b * 0.1, b * 0.06, alpha(p.accent, 0.5));
    });
  });

  /* ---------- checker: two rows of checks, a few of them taking turns in colour ---------- */
  Art.add('border', 'checker', function (c, W, H, t, p, o, b) {
    var s = b * 0.43, nx = Math.max(6, Math.round(W / s)), ny = Math.max(6, Math.round(H / s)), cx = W / nx, cy = H / ny, dk = mix(p.ink, '#0a0a12', 0.25), i, j, pass;
    c.fillStyle = p.paper; c.fillRect(0, 0, W, cy * 2); c.fillRect(0, H - cy * 2, W, cy * 2); c.fillRect(0, 0, cx * 2, H); c.fillRect(W - cx * 2, 0, cx * 2, H);
    for (pass = 0; pass < 2; pass++) {
      c.beginPath();
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
        if (j > 1 && j < ny - 2 && i > 1 && i < nx - 2) { i = nx - 3; continue; }
        if ((i + j) % 2) continue;
        var outer = i === 0 || j === 0 || i === nx - 1 || j === ny - 1, hot = outer && ((i + j) / 2 + o.n) % 7 === 0;
        if (hot !== !!pass) continue;
        c.rect(i * cx, j * cy, cx + 0.4, cy + 0.4);
      }
      c.fillStyle = pass ? p.accent : dk; c.fill();
    }
    c.lineJoin = 'miter'; c.lineWidth = b * 0.04; c.strokeStyle = 'rgba(0,0,0,0.2)'; c.strokeRect(cx * 2 + b * 0.05, cy * 2 + b * 0.05, W - cx * 4 - b * 0.1, H - cy * 4 - b * 0.1);
    c.lineWidth = b * 0.08; c.strokeStyle = p.gold; c.strokeRect(cx * 2, cy * 2, W - cx * 4, H - cy * 4);
  });

  /* ---------- stripes: a striped awning with a scalloped hem ---------- */
  Art.add('border', 'stripes', function (c, W, H, t, p, o, b) {
    var cb = b * 0.9, d0 = b * 0.5, s, i, pass, cols = [p.accent, p.paper, p.accent2, p.paper], k = Math.exp(-5 * o.beat);
    for (s = 0; s < 4; s++) {
      var len = s % 2 ? H : W, run = len - cb * 2, n = Math.max(3, Math.round(run / (b * 0.58) / 2) * 2 + 1), sw = run / n;
      c.save(); c.translate(s === 1 || s === 2 ? W : 0, s > 1 ? H : 0); c.rotate(s * PI / 2);
      for (pass = 0; pass < 3; pass++) {
        c.beginPath();
        for (i = 0; i < n; i++) { if ((i % 2 ? 1 : i % 4 === 0 ? 0 : 2) !== pass) continue; var x = cb + i * sw, d = d0 + Math.sin(t * 2.2 + i * 0.7 + s) * b * 0.025; c.moveTo(x - 0.3, 0); c.lineTo(x - 0.3, d); c.arc(x + sw / 2, d, sw / 2 + 0.3, PI, 0, true); c.lineTo(x + sw + 0.3, 0); c.closePath(); }
        c.fillStyle = cols[pass === 1 ? 1 : pass]; c.fill();
      }
      c.beginPath(); for (i = 0; i < n; i++) { var x2 = cb + i * sw, d2 = d0 + Math.sin(t * 2.2 + i * 0.7 + s) * b * 0.025; c.moveTo(x2 + sw, d2); c.arc(x2 + sw / 2, d2, sw / 2, 0, PI); } c.lineWidth = b * 0.04; c.strokeStyle = 'rgba(40,20,40,0.28)'; c.stroke();
      c.beginPath(); for (i = 0; i < n; i += 2) { c.moveTo(cb + i * sw + sw * 0.26, b * 0.2); c.lineTo(cb + i * sw + sw * 0.26, d0); } c.lineWidth = sw * 0.12; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.3)'; c.stroke();
      c.fillStyle = p.gold; c.fillRect(cb - b * 0.02, 0, run + b * 0.04, b * 0.13); c.fillStyle = shade(p.gold, -0.3); c.fillRect(cb - b * 0.02, b * 0.13, run + b * 0.04, b * 0.035);
      c.restore();
    }
    corners(W, H, b * 0.47, function (x, y, sx, sy, j) {
      var r = b * 0.43; K.rrp(c, x - r, y - r, r * 2, r * 2, b * 0.14); c.fillStyle = p.gold; c.fill(); c.lineWidth = b * 0.05; c.strokeStyle = shade(p.gold, -0.35); c.stroke();
      star5(c, x, y, b * (0.27 + ((j + o.n) % 2 === 0 ? 0.05 * k : 0)), Math.sin(t * 1.2 + j) * 0.15, p.paper, shade(p.gold, -0.35), b * 0.035);
    });
  });

  /* ---------- ticketedge: a ticket stub's edge, bitten corners and perforations ---------- */
  Art.add('border', 'ticketedge', function (c, W, H, t, p, o, b) {
    var e = b * 0.1, inn = b * 0.94, Rc = b * 0.5, r = b * 0.13, s, i, k = Math.exp(-5 * o.beat), ln = shade(p.paper, -0.3);
    c.beginPath();
    for (s = 0; s < 4; s++) {
      var len = s % 2 ? H : W, run = len - (e + Rc) * 2, n = Math.max(1, Math.round(run / (b * 0.66))), st = run / n;
      c.save(); c.translate(s === 1 || s === 2 ? W : 0, s > 1 ? H : 0); c.rotate(s * PI / 2);
      if (s === 0) c.moveTo(e + Rc, e); else c.lineTo(e + Rc, e);
      for (i = 0; i < n; i++) c.arc(e + Rc + (i + 0.5) * st, e, r, PI, 0, true);
      c.lineTo(len - e - Rc, e); c.arc(len - e, e, Rc, PI, PI / 2, true);
      c.restore();
    }
    c.closePath(); c.rect(inn, inn, W - inn * 2, H - inn * 2);
    c.fillStyle = p.paper; c.fill('evenodd'); c.lineWidth = b * 0.035; c.strokeStyle = ln; c.stroke();
    c.lineCap = 'butt'; c.setLineDash([b * 0.16, b * 0.13]); c.lineWidth = b * 0.05; c.strokeStyle = p.accent; c.strokeRect(b * 0.78, b * 0.78, W - b * 1.56, H - b * 1.56); c.setLineDash([]);
    c.lineCap = 'round';
    edgeWalk(W, H, b * 0.5, b * 1.9, function (x, y, a, idx, sd) {
      var len = (sd % 2 ? H : W) - b, st = len / Math.max(1, Math.round(len / (b * 1.9))), tx = Math.cos(a), ty = Math.sin(a), nx = -ty, ny = tx, lit = (idx + o.n) % 2 === 0, j;
      if (Math.abs((sd % 2 ? y : x) - (sd % 2 ? H : W) / 2) > len / 2 - b * 0.5) return;
      star5(c, x, y - 0 * ny, b * (0.2 + (lit ? 0.05 * k : 0)), a + Math.sin(t * 1.1 + idx) * 0.2, p.gold, shade(p.gold, -0.4), b * 0.035);
      var mx = x + tx * st / 2, my = y + ty * st / 2; c.beginPath(); c.arc(mx, my, b * 0.15, 0, TAU); c.lineWidth = b * 0.05; c.strokeStyle = p.accent2; c.stroke(); dot(c, mx, my, b * 0.055, p.accent2);
      c.beginPath(); for (j = -1; j <= 1; j += 2) { var qx = x + tx * st / 4 * j, qy = y + ty * st / 4 * j, h2; for (h2 = -1; h2 <= 1; h2++) { c.moveTo(qx + tx * h2 * b * 0.09 - nx * b * 0.13, qy + ty * h2 * b * 0.09 - ny * b * 0.13); c.lineTo(qx + tx * h2 * b * 0.09 + nx * b * 0.13, qy + ty * h2 * b * 0.09 + ny * b * 0.13); } } c.lineCap = 'butt'; c.lineWidth = b * 0.04; c.strokeStyle = alpha(p.ink, 0.55); c.stroke();
    });
  });

  /* ---------- lanternstring: paper lanterns hanging all the way round, glowing in turn ---------- */
  function lantern(c, x, y, w, h, col, lit, k, sway, cap, tas) {
    c.save(); c.translate(x, y); c.rotate(sway);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, h * 0.14); c.lineWidth = w * 0.06; c.strokeStyle = cap; c.stroke();
    if (lit) dot(c, 0, h * 0.56, w * (0.72 + 0.18 * k), alpha(col, 0.2 + 0.2 * k));
    var body = lit ? shade(col, 0.1 + 0.22 * k) : col;
    c.beginPath(); c.ellipse(0, h * 0.56, w * 0.5, h * 0.39, 0, 0, TAU); c.fillStyle = body; c.fill(); c.lineWidth = w * 0.07; c.strokeStyle = shade(col, -0.36); c.stroke();
    c.beginPath(); c.ellipse(0, h * 0.56, w * 0.27, h * 0.39, 0, 0, TAU); c.moveTo(0, h * 0.17); c.lineTo(0, h * 0.95); c.lineWidth = w * 0.045; c.strokeStyle = shade(col, -0.2); c.stroke();
    c.beginPath(); c.ellipse(-w * 0.2, h * 0.42, w * 0.09, h * 0.13, 0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill();
    c.fillStyle = cap; c.fillRect(-w * 0.24, h * 0.12, w * 0.48, h * 0.1); c.fillRect(-w * 0.2, h * 0.9, w * 0.4, h * 0.08);
    c.beginPath(); c.moveTo(0, h * 0.98); c.lineTo(0, h * 1.2); c.lineWidth = w * 0.09; c.strokeStyle = tas; c.stroke();
    c.restore();
  }
  Art.add('border', 'lanternstring', function (c, W, H, t, p, o, b) {
    var cols = [p.accent, p.gold, p.accent2, shade(p.accent, 0.38), shade(p.accent2, 0.3)], wire = shade(p.gold, -0.42), cap = shade(p.gold, -0.3), k = Math.exp(-5 * o.beat), s, i, idx = 0, lw = b * 0.64, lh = b * 0.66;
    c.lineCap = 'round';
    for (s = 0; s < 2; s++) { /* top and bottom: a swagging string */
      var n = Math.max(4, Math.round(W / (b * 1.3) / 2) * 2), st = W / n, y0 = s ? H - b * 1.0 : b * 0.03;
      c.beginPath(); c.moveTo(0, y0 + b * 0.02); for (i = 0; i < n / 2; i++) c.quadraticCurveTo((i * 2 + 1) * st, y0 + b * 0.26, (i * 2 + 2) * st, y0 + b * 0.02); c.lineWidth = b * 0.05; c.strokeStyle = wire; c.stroke();
      for (i = 0; i < n; i++, idx++) { var f = i % 2 ? 0.75 : 0.25, yy = y0 + b * 0.02 + b * 0.24 * 2 * f * (1 - f); lantern(c, (i + 0.5) * st, yy, lw, lh * (i % 2 ? 0.92 : 1), cols[idx % 5], (idx + o.n) % 2 === 0, k, Math.sin(t * 1.5 + idx * 1.3) * 0.1, cap, p.gold); }
    }
    for (s = 0; s < 2; s++) { /* the sides: lanterns on short threads off a hanging line */
      var top = b * 1.35, bot = H - b * 1.2, m = Math.max(2, Math.round((bot - top) / (b * 1.4))), sy = (bot - top) / m, xw = s ? W - b * 0.11 : b * 0.11, dir = s ? -1 : 1;
      c.beginPath(); c.moveTo(xw, b * 0.1); for (i = 0; i < m * 2 + 2; i++) c.quadraticCurveTo(xw + dir * b * (i % 2 ? -0.05 : 0.09), top - sy * 0.5 + (i + 0.5) * sy / 2, xw, top - sy * 0.5 + (i + 1) * sy / 2); c.lineWidth = b * 0.05; c.strokeStyle = wire; c.stroke();
      for (i = 0; i < m; i++, idx++) { var ly = top + i * sy, lx = xw + dir * b * 0.42; c.beginPath(); c.moveTo(xw, ly - b * 0.14); c.quadraticCurveTo(lx, ly - b * 0.16, lx, ly); c.lineWidth = b * 0.04; c.strokeStyle = wire; c.stroke(); lantern(c, lx, ly, lw, lh, cols[idx % 5], (idx + o.n) % 2 === 0, k, Math.sin(t * 1.5 + idx * 1.3) * 0.1, cap, p.gold); }
    }
  });

  /* ---------- marigoldstring: a garland of marigolds, with leaves and little hanging tails along the top ---------- */
  function marigold(c, x, y, r, col, rot) {
    var i, a;
    dot(c, x, y, r, shade(col, -0.26));
    c.beginPath(); for (i = 0; i < 9; i++) { a = rot + i / 9 * TAU; c.moveTo(x + Math.cos(a) * r * 0.66 + r * 0.3, y + Math.sin(a) * r * 0.66); c.arc(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66, r * 0.3, 0, TAU); } c.fillStyle = col; c.fill();
    dot(c, x, y, r * 0.62, shade(col, -0.12));
    c.beginPath(); for (i = 0; i < 6; i++) { a = rot + 0.4 + i / 6 * TAU; c.moveTo(x + Math.cos(a) * r * 0.36 + r * 0.24, y + Math.sin(a) * r * 0.36); c.arc(x + Math.cos(a) * r * 0.36, y + Math.sin(a) * r * 0.36, r * 0.24, 0, TAU); } c.fillStyle = shade(col, 0.2); c.fill();
    dot(c, x, y, r * 0.2, shade(col, -0.16)); dot(c, x - r * 0.3, y - r * 0.34, r * 0.1, 'rgba(255,255,255,0.45)');
  }
  Art.add('border', 'marigoldstring', function (c, W, H, t, p, o, b) {
    var or = mix('#f58a1f', p.gold, 0.12), ye = mix('#ffc62e', p.gold, 0.3), dp = mix('#e2571c', p.accent, 0.15), gr = mix('#3c8a3f', p.accent2, 0.3), ln = shade(gr, -0.4), ins = b * 0.42, k = Math.exp(-5 * o.beat), step = b * 0.8;
    c.lineWidth = b * 0.06; c.strokeStyle = ln; c.strokeRect(ins, ins, W - ins * 2, H - ins * 2);
    edgeWalk(W, H, ins, step, function (x, y, a, i, s) { /* leaves, and the tails along the top */
      if (i % 3 !== 1) return; var sw = Math.sin(t * 1.3 + i) * 0.08;
      K.leaf(c, x, y, b * 0.6, a + PI / 2 + 0.5 + sw, gr); K.leaf(c, x, y, b * 0.6, a + PI / 2 - 0.5 + sw, shade(gr, 0.18));
      if (s === 0 && i % 6 === 1) { var dx = Math.sin(t * 1.4 + i) * b * 0.04; L(c, x, y, x + dx, y + b * 0.62, b * 0.04, ln); marigold(c, x + dx * 0.6, y + b * 0.44, b * 0.16, i % 12 === 1 ? ye : or, i); dot(c, x + dx, y + b * 0.66, b * 0.09, dp); }
    });
    var sets = [[], [], []], cs = [ye, or, dp], layer, g, j, q2, f, a2;
    edgeWalk(W, H, ins, step, function (x, y, a, i) {
      var lit = (i + o.n) % 2 === 0;
      sets[i % 2 ? 0 : i % 6 === 0 ? 2 : 1].push([x, y, b * (0.39 + (lit ? 0.03 * k : 0)), i * 1.7 + Math.sin(t * 0.9 + i) * 0.15]);
    });
    /* the whole garland layer by layer, one path per colour (a flower at a time costs too much) */
    var LAY = [[0, 1, 0, -0.26], [8, 0.32, 0.66, 0], [0, 0.62, 0, -0.12], [5, 0.26, 0.34, 0.2], [0, 0.2, 0, -0.16]];
    for (layer = 0; layer < 5; layer++) for (g = 0; g < 3; g++) {
      var Ly = LAY[layer], list = sets[g]; c.beginPath();
      for (j = 0; j < list.length; j++) { q2 = list[j];
        if (!Ly[0]) { c.moveTo(q2[0] + q2[2] * Ly[1], q2[1]); c.arc(q2[0], q2[1], q2[2] * Ly[1], 0, TAU); }
        else { a2 = q2[3] + (layer === 3 ? 0.4 : 0); c.moveTo(q2[0] + Math.cos(a2) * q2[2] * Ly[2], q2[1] + Math.sin(a2) * q2[2] * Ly[2]); c.arc(q2[0], q2[1], q2[2] * Ly[2], a2, a2 + TAU * 0.999); } }
      if (!Ly[0]) { c.fillStyle = shade(cs[g], Ly[3]); c.fill(); }
      else { /* a ring of round petals: one dotted stroke round each flower */
        c.lineCap = 'round'; c.lineWidth = b * 0.39 * Ly[1] * 2; c.setLineDash([0.01, TAU * b * 0.39 * Ly[2] / Ly[0] - 0.01]); c.strokeStyle = Ly[3] ? shade(cs[g], Ly[3]) : cs[g]; c.stroke(); c.setLineDash([]); }
    }
    c.beginPath(); for (g = 0; g < 3; g++) for (j = 0; j < sets[g].length; j++) { q2 = sets[g][j]; c.moveTo(q2[0] - q2[2] * 0.2, q2[1] - q2[2] * 0.34); c.arc(q2[0] - q2[2] * 0.3, q2[1] - q2[2] * 0.34, q2[2] * 0.1, 0, TAU); } c.fillStyle = 'rgba(255,255,255,0.45)'; c.fill();
  });

  /* ---------- ivy: a wandering ivy vine with lobed leaves ---------- */
  var IVY = [[-0.14, -0.4, 0.13, -0.56], [0.3, -0.42, 0.37, -0.3], [0.5, -0.5, 0.69, -0.41], [0.66, -0.24, 0.71, -0.16], [0.9, -0.13, 1, 0], [0.9, 0.13, 0.71, 0.16], [0.66, 0.24, 0.69, 0.41], [0.5, 0.5, 0.37, 0.3], [0.3, 0.42, 0.13, 0.56], [-0.14, 0.4, 0, 0]];
  var IVYV = [[0.06, 0, 0.86, 0], [0.1, 0, 0.16, 0.42], [0.1, 0, 0.16, -0.42], [0.22, 0, 0.6, 0.32], [0.22, 0, 0.6, -0.32]];
  function ivyOutline(c, q) { /* q = [x, y, size, rot]: adds one lobed leaf to the current path */
    var cs = Math.cos(q[3]) * q[2], sn = Math.sin(q[3]) * q[2], i, s;
    c.moveTo(q[0], q[1]);
    for (i = 0; i < 10; i++) { s = IVY[i]; c.quadraticCurveTo(q[0] + s[0] * cs - s[1] * sn, q[1] + s[0] * sn + s[1] * cs, q[0] + s[2] * cs - s[3] * sn, q[1] + s[2] * sn + s[3] * cs); }
    c.closePath();
  }
  function ivyVeins(c, q) {
    var cs = Math.cos(q[3]) * q[2], sn = Math.sin(q[3]) * q[2], i, s;
    for (i = 0; i < 5; i++) { s = IVYV[i]; c.moveTo(q[0] + s[0] * cs - s[1] * sn, q[1] + s[0] * sn + s[1] * cs); c.lineTo(q[0] + s[2] * cs - s[3] * sn, q[1] + s[2] * sn + s[3] * cs); }
  }
  Art.add('border', 'ivy', function (c, W, H, t, p, o, b) {
    var gr = mix('#3f8f52', p.accent2, 0.45), cols = [gr, shade(gr, -0.2), shade(gr, 0.24)], ln = shade(gr, -0.5), pts = loop(W, H, b * 0.5, b * 0.8, b * 0.125, 24), n = pts.length, i, g, j, sets = [[], [], []];
    var off = function (j2) { return b * 0.14 * Math.sin(j2 / 24 * TAU); };
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); tracePts(c, pts, off); c.lineWidth = b * 0.1; c.strokeStyle = ln; c.stroke(); c.lineWidth = b * 0.045; c.strokeStyle = shade(gr, -0.15); c.stroke();
    c.beginPath();
    for (i = 0; i < n; i += 4) { /* stalks and tendrils in one path; the leaves are gathered by colour (a leaf at a time costs too much) */
      var q = pts[i], d = off(i), x = q[0] + q[2] * d, y = q[1] + q[3] * d, side = (i / 4) % 2 ? 1 : -1, ta = Math.atan2(-q[2], q[3]), sw = Math.sin(t * 1.25 + i * 0.37) * 0.1, young = (i / 4) % 5 === 3, sz = b * (young ? 0.36 : 0.54 + 0.08 * Math.sin(i * 1.9));
      var an = ta + side * (0.95 + sw), sx = x + Math.cos(an) * b * 0.1, sy = y + Math.sin(an) * b * 0.1;
      c.moveTo(x, y); c.lineTo(sx, sy);
      if ((i / 4) % 7 === 5) { var tx = x - Math.cos(an) * b * 0.2, ty = y - Math.sin(an) * b * 0.2; c.moveTo(tx + Math.cos(an) * b * 0.12, ty + Math.sin(an) * b * 0.12); c.arc(tx, ty, b * 0.12, an, an + PI * 1.5); }
      sets[young ? 2 : (i / 4) % 2].push([sx, sy, sz, an]);
    }
    c.lineWidth = b * 0.045; c.strokeStyle = ln; c.stroke();
    for (g = 0; g < 3; g++) {
      c.beginPath(); for (j = 0; j < sets[g].length; j++) ivyOutline(c, sets[g][j]); c.fillStyle = cols[g]; c.fill(); c.lineWidth = b * 0.03; c.strokeStyle = ln; c.stroke();
      c.beginPath(); for (j = 0; j < sets[g].length; j++) ivyVeins(c, sets[g][j]); c.lineWidth = b * 0.02; c.strokeStyle = shade(cols[g], 0.32); c.stroke();
    }
  });
});
