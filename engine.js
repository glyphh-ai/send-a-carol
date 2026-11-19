/* Send a Carol engine: draws one frame of a carol (a short singing card video) for a time t.
   The SAME code draws the live preview in a browser canvas and the video frames on the server (@napi-rs/canvas).
   No DOM, no clock, no Math.random: draw(ctx, W, H, card, t, env) is deterministic for a given (card, t, env).
   Needs CarolArt (art.js) and CarolTemplates (templates.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { require('./art/index.js'); require('./library/index.js'); module.exports = factory(require('./art.js'), require('./templates.js')); }
  else root.CarolEngine = factory(root.CarolArt, root.CarolTemplates);
})(typeof self !== 'undefined' ? self : this, function (Art, Tpl) {
  'use strict';
  var E = { VERSION: 1 }, PI = Math.PI, TAU = PI * 2;

  /* ---------- small helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function frac(v) { return v - Math.floor(v); }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function outCubic(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function inOut(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function outBack(x) { x = clamp(x, 0, 1); var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function outBounce(x) { x = clamp(x, 0, 1); var n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; }
  function str(v) { return v == null ? '' : String(v).replace(/\s+/g, ' ').trim(); }
  function rgbOf(col) {
    var m;
    if ((m = /^#([0-9a-f]{3})$/i.exec(col))) { var s = m[1]; return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)]; }
    if ((m = /^#([0-9a-f]{6})/i.exec(col))) { var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
    if ((m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(col))) return [+m[1], +m[2], +m[3]];
    return [255, 255, 255];
  }
  function alpha(col, a) { var c = rgbOf(col); return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')'; }
  function mix(c1, c2, k) { var a = rgbOf(c1), b = rgbOf(c2); return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')'; }
  function dark(col, k) { return mix(col, '#170f1c', k); }
  function light(col, k) { return mix(col, '#ffffff', k); }
  function lum(col) { var c = rgbOf(col); return (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114) / 255; }
  /* contrast (the library's looks): relative luminance, the contrast ratio of two colours, and a colour moved toward dark or light until it reads on a ground */
  function rl(col) { var c = rgbOf(col), o = 0, i, v; for (i = 0; i < 3; i++) { v = c[i] / 255; o += [0.2126, 0.7152, 0.0722][i] * (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); } return o; }
  function crt(a, b) { var x = rl(a), y = rl(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function reads(col, ground, want) { var to = rl(ground) > 0.19 ? '#170f1c' : '#ffffff', k, c; want = want || 5; for (k = 0; k < 1.01; k += 0.1) { c = mix(col, to, k); if (crt(c, ground) >= want) return c; } return to; }
  function heartPath(c, x, y, s) { var w = s / 2, t = y - s * 0.22; c.beginPath(); c.moveTo(x, y + s * 0.48); c.bezierCurveTo(x - w * 2.1, y - s * 0.12, x - w * 0.9, t - s * 0.52, x, t); c.bezierCurveTo(x + w * 0.9, t - s * 0.52, x + w * 2.1, y - s * 0.12, x, y + s * 0.48); c.closePath(); }
  function starPath(c, x, y, r, rot) { c.beginPath(); for (var i = 0; i < 10; i++) { var an = -PI / 2 + i * PI / 5 + (rot || 0), rad = i % 2 ? r * 0.46 : r; c.lineTo(x + Math.cos(an) * rad, y + Math.sin(an) * rad); } c.closePath(); }
  function inked(c, col, line, lw) { c.fillStyle = col; c.fill(); if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } }
  function perim(x, y, w, h, d) { var P = 2 * (w + h); d = ((d % P) + P) % P; if (d < w) return [x + d, y]; d -= w; if (d < h) return [x + w, y + d]; d -= h; if (d < w) return [x + w - d, y + h]; return [x, y + h - (d - w)]; }
  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function fillRR(c, x, y, w, h, r, col) { rr(c, x, y, w, h, r); c.fillStyle = col; c.fill(); }
  function strokeRR(c, x, y, w, h, r, col, lw) { rr(c, x, y, w, h, r); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
  function disc(c, x, y, r, col) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); c.fillStyle = col; c.fill(); }
  function hits(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function tplOf(card) { return (card && Tpl.get(card.template, card.tv)) || Tpl.list[0]; }
  function metaOf(kind, name) { return (Art.meta && Art.meta[kind] && Art.meta[kind][name]) || {}; }   /* what a library block says about itself (art.js, CarolArt.add) */

  /* ---------- text: measure, fit (shrink, wrap to maxLines, then ellipsis), draw ---------- */
  function fontStr(fam, px) { return (Math.round(px * 10) / 10) + 'px "' + fam + '"'; }
  function mw(ctx, s) { return ctx.measureText(s).width; }
  function wrapTry(ctx, text, maxW, maxLines) {
    if (mw(ctx, text) <= maxW) return [text];
    if (maxLines < 2) return null;
    var words = text.split(' '), i, best = null, bw = 1e9;
    if (words.length < 2) return null;
    if (maxLines === 2) { /* the most balanced split that fits */
      for (i = 1; i < words.length; i++) { var a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), wa = mw(ctx, a), wb = mw(ctx, b), m = Math.max(wa, wb); if (m <= maxW && m < bw) { bw = m; best = [a, b]; } }
      return best;
    }
    var lines = [], cur = '';
    for (i = 0; i < words.length; i++) { var tr = cur ? cur + ' ' + words[i] : words[i]; if (mw(ctx, tr) <= maxW) cur = tr; else { if (!cur) return null; lines.push(cur); cur = words[i]; if (mw(ctx, cur) > maxW) return null; } }
    if (cur) lines.push(cur);
    return lines.length <= maxLines ? lines : null;
  }
  function cut(ctx, s, maxW) { /* the longest prefix that fits with "..." */
    var e = '...'; if (mw(ctx, s) <= maxW) return s;
    while (s.length > 1 && mw(ctx, s + e) > maxW) s = s.slice(0, -1).replace(/\s+$/, '');
    return s + e;
  }
  function wrapForce(ctx, text, maxW, maxLines) {
    var words = text.split(' '), lines = [], cur = '', i;
    for (i = 0; i < words.length; i++) {
      var tr = cur ? cur + ' ' + words[i] : words[i];
      if (mw(ctx, tr) <= maxW) { cur = tr; continue; }
      if (lines.length === maxLines - 1) { lines.push(cut(ctx, tr, maxW)); return lines; }
      if (!cur) { lines.push(cut(ctx, words[i], maxW)); cur = ''; if (lines.length === maxLines) return lines; } else { lines.push(cur); cur = words[i]; }
    }
    if (cur) lines.push(lines.length < maxLines ? cut(ctx, cur, maxW) : cur);
    return lines.slice(0, maxLines);
  }
  function fit(ctx, text, fam, maxW, maxPx, minPx, maxLines, noForce) {
    text = str(text); maxLines = maxLines || 1; minPx = Math.min(minPx, maxPx);
    var px = maxPx, lines = null, i, w = 0;
    if (!text) return { px: maxPx, lines: [], w: 0, lh: maxPx * 1.18, h: 0, fam: fam };
    for (;;) {
      ctx.font = fontStr(fam, px); lines = wrapTry(ctx, text, maxW, maxLines);
      if (lines || px <= minPx) break;
      px = Math.max(minPx, px * 0.93);
    }
    if (!lines) { if (noForce) return null; lines = wrapForce(ctx, text, maxW, maxLines); }
    for (i = 0; i < lines.length; i++) w = Math.max(w, mw(ctx, lines[i]));
    return { px: px, lines: lines, w: Math.min(w, maxW), lh: px * 1.18, h: lines.length * px * 1.18, fam: fam };
  }
  /* st: { fill, stroke, sw (stroke width as a fraction of px), shadow, sdx, sdy (fractions of px), glow } */
  function drawLines(ctx, ft, cx, top, st) {
    var i, px = ft.px, y;
    ctx.font = fontStr(ft.fam, px); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (st.glow) for (var g = 0; g < 3; g++) { ctx.strokeStyle = alpha(st.glow, [0.14, 0.26, 0.5][g]); ctx.lineWidth = px * [0.34, 0.2, 0.09][g]; for (i = 0; i < ft.lines.length; i++) ctx.strokeText(ft.lines[i], cx, top + (i + 0.5) * ft.lh); }
    if (st.shadow) { ctx.fillStyle = st.shadow; if (st.stroke) { ctx.strokeStyle = st.shadow; ctx.lineWidth = px * (st.sw || 0.14); } for (i = 0; i < ft.lines.length; i++) { y = top + (i + 0.5) * ft.lh; if (st.stroke) ctx.strokeText(ft.lines[i], cx + px * (st.sdx || 0), y + px * (st.sdy == null ? 0.07 : st.sdy)); ctx.fillText(ft.lines[i], cx + px * (st.sdx || 0), y + px * (st.sdy == null ? 0.07 : st.sdy)); } }
    if (st.stroke) { ctx.strokeStyle = st.stroke; ctx.lineWidth = px * (st.sw || 0.14); for (i = 0; i < ft.lines.length; i++) ctx.strokeText(ft.lines[i], cx, top + (i + 0.5) * ft.lh); }
    ctx.fillStyle = st.fill; for (i = 0; i < ft.lines.length; i++) ctx.fillText(ft.lines[i], cx, top + (i + 0.5) * ft.lh);
  }
  function pushBox(F, Lc, kind, x, y, w, h, what) { if (F.boxes && (!Lc || Lc.live)) F.boxes.push({ kind: kind, x: x, y: y, w: w, h: h, what: what }); }
  /* move a text rect off every face of this scene: below it if there is room, else above; null = no place */
  function clearOfFaces(F, Lc, r) {
    var i, k, sf = F.L.safe;
    for (k = 0; k < 3; k++) {
      var moved = false;
      for (i = 0; i < Lc.faces.length; i++) { var f = Lc.faces[i]; if (!hits(r, f)) continue; moved = true; if (f.y + f.h + r.h + F.L.u <= sf.y + sf.h) r.y = f.y + f.h + F.L.u * 0.6; else r.y = f.y - r.h - F.L.u * 0.6; }
      if (!moved) break;
    }
    for (i = 0; i < Lc.faces.length; i++) if (hits(r, Lc.faces[i])) return null;
    if (r.y < sf.y || r.y + r.h > sf.y + sf.h) return null;
    return r;
  }

  /* ---------- timing, beats, the plan ---------- */
  function flatLines(card) {
    var out = [], ly = card && card.lyrics, i, j;
    if (!Array.isArray(ly)) return out;
    for (i = 0; i < ly.length; i++) { var ls = ly[i] && ly[i].lines; if (!Array.isArray(ls)) continue; for (j = 0; j < ls.length; j++) { var s = str(ls[j]); if (s) out.push({ text: s, section: str(ly[i].section).toLowerCase() || 'verse' }); } }
    return out.slice(0, 16);
  }
  function timing(card) {
    var tp = tplOf(card), T = (card && card.timing) || {}, bpm = clamp(num(T.bpm, tp.music.bpm), 40, 240), per = 60 / bpm;
    var dur = clamp(num(T.duration, 30), 6, 180), off = clamp(num(T.offset, 0.5), 0, dur), beats, i, n = flatLines(card).length, lines = [];
    if (Array.isArray(T.beats)) {
      beats = T.beats.filter(function (b) { return typeof b === 'number' && isFinite(b) && b >= 0; }).slice().sort(function (a, b) { return a - b; });
      beats = beats.filter(function (b, k) { return k === 0 || b - beats[k - 1] > 0.08; });
      if (beats.length < 4) beats = undefined; else if (typeof T.offset !== 'number') off = beats[0];
    }
    var intro = num(T.intro, -1);
    if (!(intro >= 0)) { intro = off + 4 * per; while (intro < 2.2) intro += 4 * per; }
    intro = clamp(intro, 0, dur * 0.6);
    var ok = Array.isArray(T.lines) && T.lines.length >= n;
    if (ok) for (i = 0; i < n; i++) { var q = T.lines[i]; if (!q || !(num(q.t0, -1) >= 0) || !(q.t1 > q.t0)) { ok = false; break; } }
    if (ok) for (i = 0; i < n; i++) { var a0 = clamp(T.lines[i].t0, 0, dur - 0.2); lines.push({ t0: a0, t1: clamp(T.lines[i].t1, a0 + 0.15, dur) }); }
    else if (n) { /* a click track: the lines share the singable stretch evenly, each starting on a beat */
      var s0 = Math.min(intro, dur * 0.3), s1 = dur - Math.min(3.4, dur * 0.15), slot = (s1 - s0) / n;
      for (i = 0; i < n; i++) { var t0 = s0 + i * slot; if (slot > per * 2) t0 = off + Math.round((t0 - off) / per) * per; t0 = clamp(t0, 0, dur - 0.3); lines.push({ t0: t0, t1: Math.min(dur, t0 + slot * 0.9) }); }
    }
    var out = { duration: dur, bpm: bpm, offset: off, lines: lines, intro: intro };
    if (beats) out.beats = beats;
    return out;
  }
  function beatList(tm) { /* every beat from before 0 to past the end; i0 = index of the first real beat (beat number 0) */
    var out = [], per = 60 / tm.bpm, i, n0;
    if (tm.beats) {
      var b = tm.beats, iv = []; for (i = 1; i < b.length; i++) iv.push(b[i] - b[i - 1]); iv.sort(function (x, y) { return x - y; }); per = iv[Math.floor(iv.length / 2)] || per;
      n0 = Math.floor(b[0] / per + 1e-6); for (i = n0; i > 0; i--) out.push(b[0] - i * per);
      for (i = 0; i < b.length; i++) out.push(b[i]);
      var last = b[b.length - 1]; while (last <= tm.duration + per) { last += per; out.push(last); }
    } else {
      n0 = Math.floor(tm.offset / per + 1e-6);
      for (i = -n0; tm.offset + i * per <= tm.duration + per * 1.5; i++) out.push(tm.offset + i * per);
    }
    return { t: out, i0: n0, per: per };
  }
  /* WHICH FRAME A PHOTO GETS, from its shape and what its sender said about it (nothing here looks at the picture):
     - a round or shaped frame (an ornament, a star, a heart, a medal) crops hard, so it only gets a photo the sender
       marked "one person"; when no photo is marked, the first upright photo gets the template's shaped frame;
     - every other photo gets one of the template's rectangular frames (a plain one if it has none), and a wide photo
       makes that frame wide (aspectFor), so a group stays in view. */
  var SHAPED = { ornament: 1, snowglobe: 1, wreath: 1, locket: 1, starcut: 1, bubble: 1, bowl: 1, medal: 1, balloonframe: 1 };
  var FLEX = { plain: 1, polaroid: 1, mantel: 1, film: 1, stamp: 1, tv: 1, window: 1, scallopcard: 1 };
  function fitOf(f) { return Array.isArray(f) && f.length === 3 && isFinite(f[0] + f[1] + f[2]) ? [clamp(+f[0], 0, 1), clamp(+f[1], 0, 1), clamp(+f[2], 0.5, 4)] : null; }
  function frameFor(photos, fr) {
    var rect = [], shaped = [], i, anySolo = false, first = -1, k = 0, j = 0;
    for (i = 0; i < fr.length; i++) (SHAPED[fr[i]] || metaOf('frame', fr[i]).shaped ? shaped : rect).push(fr[i]);
    if (!rect.length) rect = ['plain'];
    for (i = 0; i < photos.length; i++) if (photos[i].solo) anySolo = true;
    if (!anySolo) for (i = 0; i < photos.length; i++) if (!(photos[i].ar > 0.95)) { first = i; break; }   /* (a photo whose shape is not known counts as upright) */
    for (i = 0; i < photos.length; i++) { var star = shaped.length && (anySolo ? photos[i].solo : i === first); photos[i].frame = star ? shaped[k++ % shaped.length] : rect[j++ % rect.length]; }
  }
  function lookOf(q) { return { ar: q.ar, solo: q.solo, fit: q.fit }; }
  function aspectFor(name, ar) { var a = ASPECT[name] || metaOf('frame', name).aspect || 0.82; return (FLEX[name] || metaOf('frame', name).flex) && ar > 0.95 ? clamp(a * ar / 0.78, a, 1.42) : a; }
  var MINLEN = 2.2;
  function buildPlan(card) {
    var tp = tplOf(card), tm = timing(card), B = beatList(tm), D = tm.duration, per = B.per, i, j;
    function pick(target, lo, hi) { /* nearest beat in [lo, hi]; a bar line wins when it is within about one beat of the target */
      var best = null, bd = 1e9, bar = null, bard = 1e9;
      for (var k = 0; k < B.t.length; k++) { var tb = B.t[k]; if (tb < lo - 1e-6 || tb > hi + 1e-6 || tb <= 0 || tb >= D) continue; var d = Math.abs(tb - target); if (d < bd) { bd = d; best = tb; } if ((((k - B.i0) % 4) + 4) % 4 === 0 && d < bard) { bard = d; bar = tb; } }
      return bar != null && bard <= per * 1.05 ? bar : best;
    }
    var tHi = Math.min(4, D * 0.28), tLo = Math.min(2.5, tHi * 0.7), tEnd = pick(clamp(tm.intro > 0 ? tm.intro : 3.2, tLo, tHi), tLo, tHi);
    if (tEnd == null) tEnd = pick(tHi, 0.6, D * 0.4); if (tEnd == null) tEnd = Math.min(3, D * 0.2);
    var sLo = D - Math.min(5, D * 0.3), sHi = D - Math.min(3.5, D * 0.2), sStart = pick(D - Math.min(4.2, D * 0.25), Math.max(sLo, tEnd + MINLEN), sHi);
    if (sStart == null) sStart = pick(D - 4, tEnd + 1, D - 1); if (sStart == null) sStart = Math.max(tEnd + 0.5, D - Math.min(4, D * 0.25));
    var M = sStart - tEnd, specs = tp.scenes, photos = [], seen = 0;
    var cs = card && Array.isArray(card.scenes) ? card.scenes : [];
    for (i = 0; i < cs.length && photos.length < 12; i++) { var ph = cs[i] && cs[i].photo; if (typeof ph === 'number' && ph >= 0 && ph === Math.floor(ph)) photos.push({ photo: ph, caption: str(cs[i].caption), ar: clamp(num(cs[i].ar, 0), 0, 4), solo: !!cs[i].solo, fit: fitOf(cs[i].fit) }); }
    frameFor(photos, tp.frames);
    var lyricSpecs = specs.filter(function (s) { return s.kind === 'lyric'; }), nLyric = Math.min(lyricSpecs.length, M >= 13 ? 2 : M >= 5.2 ? 1 : 0), lyricLen = clamp(M * 0.19, 2.6, 5);
    var avail = M - nLyric * lyricLen, P = photos.length, S = P ? clamp(Math.floor(avail / 2.9), 1, P) : clamp(Math.round(avail / 4.4), 1, 4), groups = [], seq = [];
    if (avail < MINLEN) { S = 0; }
    if (P && S) {
      for (i = 0; i < S; i++) groups.push([photos[i]]);
      var rest = photos.slice(S), g = S - 1; while (rest.length) { var guard = 0; while (groups[g].length >= 4 && guard++ < S) g = g > 0 ? g - 1 : S - 1; if (groups[g].length >= 4) break; groups[g].push(rest.shift()); g = g > 0 ? g - 1 : S - 1; }
      /* keep the order the sender chose: refill the groups front to back */
      var flat = photos.slice(0, groups.reduce(function (a, q) { return a + q.length; }, 0)), at = 0; for (i = 0; i < S; i++) { var len = groups[i].length; groups[i] = flat.slice(at, at + len); at += len; }
    }
    var fr = tp.frames, vg = tp.vignettes && tp.vignettes.length ? tp.vignettes : ['star'], wsum = 0, pi = 0;
    for (i = 0; i < S; i++) {
      if (P) { var gr = groups[i], w = gr.length === 1 ? 1 : gr.length === 2 ? 1.25 : 1.45; seq.push({ kind: 'photo', w: w, photo: gr[0].photo, photos: gr.map(function (q) { return q.photo; }), caption: gr[0].caption, captions: gr.map(function (q) { return q.caption; }), frames: gr.map(function (q) { return q.frame; }), looks: gr.map(lookOf) }); pi += gr.length; wsum += w; }
      else { seq.push({ kind: 'art', w: 1, photo: -1, photos: [], caption: '', captions: [], frames: [fr[i % fr.length]], vignette: vg[i % vg.length] }); wsum += 1; }
    }
    if (P && S && avail / S > 6.5) { /* few photos: the cast performs between them (the lyric band carries the words), so no scene sits still for long and no caption is repeated */
      var extra = Math.min(3, Math.round(avail / 4.6) - S), spot = 1;
      for (i = 0; i < extra; i++) { seq.splice(Math.min(spot, seq.length), 0, { kind: 'lyric', w: 0.8, photo: -1, photos: [], caption: '', captions: [], frames: [], frame: '', tableau: ['row', 'ride', 'hero'][i % 3], perform: true }); wsum += 0.8; spot += 2; }
      S = seq.length;
    }
    for (i = 0; i < seq.length; i++) { seq[i].len = avail * seq[i].w / wsum; seq[i].frame = seq[i].frames[0] || ''; }
    for (i = 0; i < nLyric; i++) { /* the lyric scene(s) sit between the photo scenes */
      var pos = nLyric === 1 ? Math.ceil(S / 2) : (i === 0 ? Math.ceil(S / 3) : Math.max(Math.ceil(S * 2 / 3), Math.ceil(S / 3) + 1));
      seq.splice(Math.min(seq.length, pos + i), 0, { kind: 'lyric', len: lyricLen, photo: -1, photos: [], caption: '', captions: [], frames: [], frame: '', tableau: (lyricSpecs[i] && lyricSpecs[i].tableau) || 'hero' });
    }
    for (i = 1; i < seq.length; i++) if (seq[i].kind === 'lyric' && seq[i - 1].kind === 'lyric' && seq[i].tableau === seq[i - 1].tableau) seq[i].tableau = seq[i].tableau === 'row' ? 'hero' : 'row';   /* two cast scenes in a row are not the same picture */
    if (!seq.length) seq.push({ kind: P ? 'photo' : 'art', len: M, photo: P ? photos[0].photo : -1, photos: P ? [photos[0].photo] : [], caption: P ? photos[0].caption : '', captions: P ? [photos[0].caption] : [], frames: [P ? photos[0].frame : fr[0]], frame: P ? photos[0].frame : fr[0], looks: P ? [lookOf(photos[0])] : [], vignette: vg[0] });
    var cuts = [tEnd], ideal = tEnd;
    for (j = 0; j < seq.length - 1; j++) {
      ideal += seq[j].len; var prev = cuts[cuts.length - 1], left = seq.length - 1 - j;
      var c = pick(ideal, prev + MINLEN, sStart - left * MINLEN); if (c == null) c = pick(ideal, prev + 0.9, sStart - left * 0.9);
      if (c == null) { seq.splice(j + 1, 1); ideal -= seq[j].len; j--; continue; } /* no beat to cut on: this scene runs on and the next one is dropped */
      cuts.push(c);
    }
    cuts.push(sStart);
    var first = P ? photos[0] : null, scenes = [], ti = (specs[0] && specs[0].kind === 'title' && specs[0]) || {}, so = specs[specs.length - 1] || {};
    scenes.push({ kind: 'title', t0: 0, t1: tEnd, photo: first ? first.photo : -1, photos: first ? [first.photo] : [], caption: '', captions: [''], frame: first ? first.frame : fr[0], frames: [first ? first.frame : fr[0]], looks: first ? [lookOf(first)] : [], layout: ti.layout || 'top' });
    for (j = 0; j < seq.length; j++) { var q2 = seq[j]; scenes.push({ kind: q2.kind, t0: cuts[j], t1: cuts[j + 1], photo: q2.photo, photos: q2.photos, caption: q2.caption, captions: q2.captions, frame: q2.frame, frames: q2.frames, looks: q2.looks || [], vignette: q2.vignette || '', tableau: q2.tableau || '', perform: !!q2.perform }); }
    var sp = photos.slice(0, 3);
    scenes.push({ kind: 'signoff', t0: sStart, t1: D, photo: sp.length ? sp[0].photo : -1, photos: sp.map(function (q) { return q.photo; }), caption: '', captions: sp.map(function () { return ''; }), frame: sp.length ? sp[0].frame : fr[fr.length > 1 ? 1 : 0], frames: sp.map(function (q) { return q.frame; }), looks: sp.map(lookOf), layout: so.layout || 'top' });
    for (j = 0; j < scenes.length; j++) { scenes[j].n = j; seen = 0; for (i = 0; i < j; i++) if (scenes[i].kind === scenes[j].kind) seen++; scenes[j].index = seen; }
    var fl = flatLines(card), lines = []; for (i = 0; i < fl.length; i++) lines.push({ text: fl[i].text, t0: tm.lines[i].t0, t1: tm.lines[i].t1, section: fl[i].section });
    var beats = []; for (i = 0; i < B.t.length; i++) if (B.t[i] >= 0 && B.t[i] <= D) beats.push(Math.round(B.t[i] * 1e4) / 1e4);
    for (j = 0; j < scenes.length; j++) { scenes[j].t0 = Math.round(scenes[j].t0 * 1e4) / 1e4; scenes[j].t1 = Math.round(scenes[j].t1 * 1e4) / 1e4; }
    return { plan: { duration: D, bpm: tm.bpm, intro: tm.intro, template: tp.id, beats: beats, scenes: scenes, lines: lines }, B: B };
  }
  var cache = { key: null, val: null };
  function planned(card) {
    var key = (card && card.template) + '@' + ((card && card.tv) || 0) + '|' + JSON.stringify((card && card.timing) || 0) + '|' + JSON.stringify((card && card.scenes) || 0) + '|' + JSON.stringify((card && card.lyrics) || 0);
    if (cache.key !== key) { cache.val = buildPlan(card || {}); cache.key = key; }
    return cache.val;
  }
  function plan(card) { return planned(card).plan; }
  function energyAt(pl, t) {
    var ls = pl.lines, e = 0.62, i, hook = 0;
    if (ls.length) {
      e -= 0.2 * (1 - sstep(ls[0].t0 - 1.2, ls[0].t0, t));
      for (i = 0; i < ls.length; i++) if (/hook|chorus|refrain/.test(ls[i].section)) hook = Math.max(hook, Math.min(sstep(ls[i].t0 - 0.4, ls[i].t0, t), 1 - sstep(ls[i].t1, ls[i].t1 + 0.6, t)));
      e += 0.38 * hook;
    }
    return clamp(e + 0.12 * sstep(pl.duration - 4, pl.duration - 3, t), 0, 1);
  }
  function beatAt(card, t) {
    var pd = planned(card), B = pd.B, a = B.t, lo = 0, hi = a.length - 1, mid;
    t = num(t, 0);
    if (t <= a[0]) return { n: -B.i0, phase: 0, bar: Math.floor(-B.i0 / 4), energy: energyAt(pd.plan, t) };
    while (lo < hi - 1) { mid = (lo + hi) >> 1; if (a[mid] <= t) lo = mid; else hi = mid; }
    var n = lo - B.i0;
    return { n: n, phase: clamp((t - a[lo]) / Math.max(1e-6, a[hi] - a[lo]), 0, 0.9999), bar: Math.floor(n / 4), energy: energyAt(pd.plan, t) };
  }
  function posterTime(card) { /* late in the title scene, everything settled, before the lyric band comes in */
    var pl = plan(card), t1 = pl.scenes[0].t1, t = Math.min(t1 - 0.25, Math.max(1.6, t1 * 0.72));
    if (pl.lines.length) t = Math.max(Math.min(1.2, t), Math.min(t, pl.lines[0].t0 - 0.7));
    return Math.round(t * 100) / 100;
  }

  /* ---------- layout: everything scales from W and H; tall (stories) and square are designed separately ---------- */
  function layout(W, H, tp) {
    var tall = H / W > 1.3, L = { W: W, H: H, tall: tall, u: Math.min(W, H) / 100 };
    L.safe = { x: W * 0.05, y: H * (tall ? 0.08 : 0.05), w: W * 0.9, h: H * (tall ? 0.8 : 0.9) };
    L.mode = tall ? (tp.look.stage === 'cast-low' ? 'cast-low' : 'band-low') : 'square';
    if (L.mode === 'band-low') { L.band = { x: W * 0.06, y: H * 0.748, w: W * 0.88, h: H * 0.127 }; L.stage = { x: W * 0.06, y: H * 0.085, w: W * 0.88, h: H * 0.64 }; L.floor = H * 0.742; L.castH = H * 0.15; L.castX = [0.15, 0.85, 0.5]; }
    else if (L.mode === 'cast-low') { L.band = { x: W * 0.06, y: H * 0.668, w: W * 0.88, h: H * 0.122 }; L.stage = { x: W * 0.06, y: H * 0.085, w: W * 0.88, h: H * 0.57 }; L.floor = H * 0.958; L.castH = H * 0.152; L.castX = [0.2, 0.8, 0.5]; }
    else { L.band = { x: W * 0.06, y: H * 0.776, w: W * 0.88, h: H * 0.172 }; L.stage = { x: W * 0.06, y: H * 0.056, w: W * 0.88, h: H * 0.706 }; L.floor = H * 0.772; L.castH = H * 0.25; L.castX = [0.115, 0.885, 0.5]; }
    return L;
  }
  var WIDE = { yeti: 1.28, polarbear: 1.09, owl: 1.07, santa: 0.98, mrsclaus: 0.98, snowman: 1.0, reindeer: 0.92, cat: 0.9, fawn: 1.15, dog: 0.95, mouse: 0.95, angel: 1.05, nutcracker: 0.8, robot: 0.9, yetiX: 1, bird: 0.95, bear: 0.95, bunny: 0.8, fox: 0.9 };
  var ASPECT = { ornament: 0.8, snowglobe: 0.8, polaroid: 0.8, mantel: 0.78, sleigh: 0.86, wreath: 0.92, stamp: 0.8, window: 0.8, tv: 0.9, locket: 0.92, tag: 0.76, film: 0.8, starcut: 1, arch: 0.76, bubble: 0.9, badge: 0.74, bowl: 0.88, plain: 0.8, balloonframe: 0.74, scallopcard: 0.82, medal: 0.78 };
  var SLOTS = { /* [centre x, centre y, width, height] as fractions of the region the frames share */
    album: [null, [[0.3, 0.36, 0.52, 0.7], [0.7, 0.52, 0.52, 0.7]], [[0.23, 0.6, 0.4, 0.56], [0.77, 0.6, 0.4, 0.56], [0.5, 0.29, 0.46, 0.58]]],
    albumSq: [null, [[0.33, 0.47, 0.4, 0.86], [0.67, 0.47, 0.4, 0.86]], [[0.26, 0.53, 0.3, 0.7], [0.74, 0.53, 0.3, 0.7], [0.5, 0.44, 0.3, 0.76]]],
    tall: [[[0.5, 0.46, 0.94, 0.9]], [[0.36, 0.26, 0.66, 0.5], [0.64, 0.71, 0.66, 0.5]], [[0.5, 0.25, 0.62, 0.48], [0.27, 0.72, 0.5, 0.44], [0.73, 0.72, 0.5, 0.44]], [[0.27, 0.25, 0.5, 0.46], [0.73, 0.27, 0.5, 0.46], [0.27, 0.72, 0.5, 0.44], [0.73, 0.74, 0.5, 0.44]]],
    square: [[[0.5, 0.47, 0.62, 0.92]], [[0.29, 0.47, 0.44, 0.86], [0.71, 0.47, 0.44, 0.86]], [[0.19, 0.5, 0.33, 0.72], [0.5, 0.44, 0.34, 0.76], [0.81, 0.5, 0.33, 0.72]], [[0.14, 0.5, 0.27, 0.62], [0.38, 0.43, 0.27, 0.62], [0.62, 0.5, 0.27, 0.62], [0.86, 0.43, 0.27, 0.62]]]
  };
  function castOf(tp, kind, role) { var out = [], i, cast = tp.cast || []; for (i = 0; i < cast.length; i++) if (cast[i].kind === kind && (!role || cast[i].role === role)) out.push(cast[i]); return out; }
  function calm(F) { return F.tp.look.calm === true; }   /* a restrained card (sympathy, memorial): nothing pulses or bounces */

  /* ---------- the cast ---------- */
  function pokeOf(F, name) { var p = F.env.interact && F.env.interact.poke; if (!p || p.name !== name) return 0; var d = F.t - num(p.at, -9); return d >= 0 && d < 0.9 ? d / 0.9 + 1e-6 : 0; }
  function drawChar(F, Lc, it, x, feet, h, mood, idx) {
    var name = it.name, wide = WIDE[name] || metaOf('character', name).wide || 0.82, k, r, pk = pokeOf(F, name), ctx = F.ctx;
    for (k = 0; k < 4; k++) { /* never over a face: shrink, then give up */
      r = { x: x - h * wide / 2, y: feet - h, w: h * wide, h: h }; var bad = false;
      for (var i = 0; i < Lc.faces.length; i++) if (hits(r, Lc.faces[i])) bad = true;
      if (!bad) break; if (k === 3) return; h *= 0.8;
    }
    var y = feet - (pk ? Math.sin(pk * PI) * h * 0.3 : 0);
    ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.beginPath(); ctx.ellipse(x, feet + h * 0.01, h * wide * 0.36 * (pk ? 1 - 0.3 * Math.sin(pk * PI) : 1), h * 0.035, 0, 0, TAU); ctx.fill();
    var en = clamp(F.energy + (pk ? 0.6 : 0), 0, 1); if (calm(F)) en *= 0.3;
    Art.character(name, ctx, x, y, h, { beat: F.bt.phase, n: F.bt.n + idx, energy: en, flip: (x > F.W * 0.5) !== !!it.flip, t: F.t, mood: pk ? 'wave' : (it.mood || mood), variant: it.variant || 0 }, F.pal);
    if (F.hitList && Lc.live) F.hitList.push({ name: name, x: r.x, y: r.y, w: r.w, h: r.h });
    if (F.castBoxes) pushBox(F, Lc, 'cast', r.x, r.y, r.w, r.h, name);   /* for the gates: where each character stands (asked for with env.castBoxes) */
  }
  function drawProp(F, Lc, name, x, y, s, o) {
    var pk = pokeOf(F, name), ctx = F.ctx, k = Math.exp(-5 * F.bt.phase) * F.energy;
    ctx.save(); ctx.translate(x, y);
    if (pk) { ctx.rotate(Math.sin(pk * TAU * 2) * 0.16 * (1 - pk)); var ps = 1 + 0.22 * Math.sin(pk * PI); ctx.scale(ps, ps); }
    else if ((!o || o.pulse !== false) && !calm(F)) { var b = 1 + 0.035 * k; ctx.scale(b, b); }
    Art.prop(name, ctx, 0, 0, s, F.t, F.pal, { beat: F.bt.phase, n: F.bt.n, col: o && o.col });
    ctx.restore();
    if (F.hitList && Lc.live) F.hitList.push({ name: name, x: x - s * 0.42, y: y - s * 0.42, w: s * 0.84, h: s * 0.84 });
  }
  function drawSky(F, Lc, R) { /* small props floating in the top corners of a region, and props that fly across it; all behind the frames */
    var sky = castOf(F.tp, 'prop', 'sky'), fly = castOf(F.tp, 'prop', 'fly'), W = F.W, u = F.L.u, i, s = W * 0.2;
    for (i = 0; i < sky.length && i < 3; i++) { var sx = [0.86, 0.14, 0.5][i] * W, sy = R.y + s * (i === 2 ? 0.3 : 0.42) + Math.sin(F.t * 1.1 + i * 2.2) * u * 1.2; drawProp(F, Lc, sky[i].name, sx, sy, s * (sky[i].size || 1), { pulse: true }); }
    for (i = 0; i < fly.length; i++) { var f = frac(F.t / (fly[i].every || 9) + 0.18 + i * 0.47), fs = W * 0.24 * (fly[i].size || 1), fx = -fs + f * (W + fs * 2), fy = R.y + R.h * (0.14 + i * 0.2) + Math.sin(F.t * 1.6 + i) * u * 2; drawProp(F, Lc, fly[i].name, fx, fy, fs, { pulse: false }); }
  }
  function flank(F, Lc, mood, wideOut) { /* the cast beside (or under) the photos; wideOut pushes them to the edges */
    var L = F.L, W = F.W, chars = castOf(F.tp, 'character'), i, low = L.mode === 'cast-low', cx = wideOut && !low ? [0.095, 0.905, 0.5] : L.castX;
    if (low) { var fp = castOf(F.tp, 'prop', 'floor'); for (i = 0; i < fp.length && i < 2; i++) { var ps = L.castH * 0.6 * (fp[i].size || 1); drawProp(F, Lc, fp[i].name, W * (i ? 0.66 : 0.35), L.floor - ps * 0.46, ps); } }
    var order = low ? [2, 0, 1] : [0, 1];
    if (!chars.length && !low) { /* a card with no characters: its floor props stand where the cast would */
      var fq = castOf(F.tp, 'prop', 'floor'), j;
      for (i = 0; i < fq.length && i < 2; i++) { var qs = Math.min(L.castH * 0.8, W * 0.2) * (fq[i].size || 1), qr = { x: cx[i] * W - qs * 0.42, y: L.floor - qs * 0.88, w: qs * 0.84, h: qs * 0.84 }, bad = false; for (j = 0; j < Lc.faces.length; j++) if (hits(qr, Lc.faces[j])) bad = true; if (!bad) drawProp(F, Lc, fq[i].name, cx[i] * W, L.floor - qs * 0.46, qs); }
    }
    for (i = 0; i < order.length; i++) { var c = chars[order[i]]; if (!c) continue; var wide = WIDE[c.name] || metaOf('character', c.name).wide || 0.82, h = Math.min(L.castH * (order[i] === 2 ? 0.86 : 1), W * (L.tall ? 0.3 : 0.26) / wide) * (c.size || 1); drawChar(F, Lc, c, cx[order[i]] * W, L.floor, h, mood, order[i]); }
  }
  function tableau(F, Lc, R, mood, kind) { /* the cast as a little stage picture: a hero prop, the characters around it, small props on the floor */
    var L = F.L, W = F.W, H = F.H, tp = F.tp, low = L.mode === 'cast-low', hero = castOf(tp, 'prop', 'hero')[0], chars = castOf(tp, 'character'), fp = castOf(tp, 'prop', 'floor'), i;
    var none = !chars.length;   /* a card with no characters: the hero prop (or a drawn stand-in) carries every scene, its floor props stand at the sides */
    if (none && !hero) { var hv = (tp.vignettes || []).filter(function (v) { return v.indexOf('c:') !== 0; })[0] || (fp[0] && fp[0].name); if (hv) hero = { name: hv, size: 0.72 }; }
    var hf = low ? L.stage.y + L.stage.h : L.floor, avail = Math.max(1, hf - R.y), row = ((kind === 'row' && !low) || !hero) && !(none && hero);
    if (kind === 'row' && (low || none) && hero) { /* the cast is under the band in this layout: a second lyric scene shows another prop on the stage instead */
      var alt = (tp.vignettes || []).filter(function (v) { return v.indexOf('c:') !== 0 && v !== hero.name; })[0];
      if (alt) hero = { name: alt, float: true, size: 0.72 };
    }
    var ch = Math.min(L.tall ? H * 0.235 : H * 0.3, low ? L.castH * 1.05 : avail * (row ? 0.82 : 0.62));
    if (hero && !row) {
      var s = Math.min(R.w * (L.tall ? 0.88 : 0.5), avail * 0.94) * (hero.size || 1), hy = hero.float ? R.y + avail * 0.4 + Math.sin(F.t * 1.3) * L.u * 1.4 : hf - s * 0.45, hx = W * 0.5;
      if (kind === 'ride') hx = W * (0.5 + 0.1 * Math.sin(F.t * 0.9));
      drawProp(F, Lc, hero.name, hx, hy, s);
    }
    var xs = row ? (chars.length >= 3 ? [0.24, 0.76, 0.5] : chars.length === 2 ? [0.3, 0.7] : [0.5]) : (low ? [0.2, 0.8, 0.5] : L.tall ? [0.17, 0.83, 0.36] : [0.15, 0.85, 0.3]);
    var cf = low ? L.floor : hf, order = [2, 0, 1];
    if (none) { for (i = 0; i < fp.length && i < 2; i++) { if (hero && fp[i].name === hero.name) continue; var ns = Math.min(ch * 0.8, W * 0.24) * (fp[i].size || 1); drawProp(F, Lc, fp[i].name, W * (low ? [0.22, 0.78] : L.tall ? [0.16, 0.84] : [0.14, 0.86])[i], cf - ns * 0.46, ns); } return; }
    for (i = 0; i < fp.length && i < 2; i++) { var ps = ch * 0.5 * (fp[i].size || 1), px = row ? [0.37, 0.63][i] : (low ? [0.35, 0.66][i] : [L.tall ? 0.66 : 0.71, L.tall ? 0.36 : 0.3][i]); if (!row && !low && i === 1 && chars.length >= 3) continue; drawProp(F, Lc, fp[i].name, W * px, cf - ps * 0.46, ps); }
    for (i = 0; i < 3; i++) { var c = chars[order[i]]; if (!c) continue; var wide = WIDE[c.name] || metaOf('character', c.name).wide || 0.82, h = Math.min(ch * (order[i] === 2 && !row ? 0.8 : 1), W * (row ? 0.34 : 0.32) / wide) * (c.size || 1); drawChar(F, Lc, c, xs[order[i]] * W, cf, h, mood, order[i]); }
  }

  /* ---------- photo frames ---------- */
  function enter(ctx, kind, a, cx, cy, bw, bh, i, F) { /* the frame eases in with overshoot */
    if (a >= 1) return;
    var e = outBack(a), s;
    if (calm(F)) { e = outCubic(a); if (kind === 'drop' || kind === 'swing') kind = 'rise'; }
    if (kind === 'drop') { ctx.translate(0, -(cy + bh) * (1 - outBounce(a))); }
    else if (kind === 'slide') { ctx.translate((i % 2 ? 1 : -1) * F.W * 1.1 * (1 - e), 0); }
    else if (kind === 'rise') { ctx.translate(0, (F.H - cy + bh) * (1 - e)); }
    else if (kind === 'swing') { ctx.translate(cx, cy - bh / 2); ctx.rotate(Math.pow(1 - a, 2) * 0.7 * Math.cos(a * 9)); ctx.translate(-cx, -(cy - bh / 2) - (cy + bh) * Math.pow(1 - a, 3)); }
    else if (kind === 'spin') { s = Math.max(0.02, e); ctx.translate(cx, cy); ctx.rotate((1 - outCubic(a)) * -1.1 * (i % 2 ? -1 : 1)); ctx.scale(s, s); ctx.translate(-cx, -cy); }
    else { s = Math.max(0.02, 0.3 + 0.7 * e); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
  }
  function vignetteArt(F, name) { /* drawn in place of a photo when a carol has none */
    return function (c, x, y, w, h) {
      var p = F.pal, g = c.createLinearGradient(x, y, x, y + h), m = Math.min(w, h), i, R0 = Art.rnd('vg' + name);
      g.addColorStop(0, light(p.bg2, 0.12)); g.addColorStop(1, p.bg); c.fillStyle = g; c.fillRect(x, y, w, h);
      for (i = 0; i < 14; i++) { var sx = x + R0() * w, sy = y + R0() * h * 0.8, tw = 0.5 + 0.5 * Math.sin(F.t * (1.5 + R0() * 2) + i); disc(c, sx, sy, m * 0.008 * (1 + tw), alpha(p.snow, 0.35 + 0.4 * tw)); }
      c.fillStyle = alpha(p.snow, 0.16); c.beginPath(); c.ellipse(x + w / 2, y + h * 0.86, w * 0.42, h * 0.07, 0, 0, TAU); c.fill();
      if (name.indexOf('c:') === 0) Art.character(name.slice(2), c, x + w / 2, y + h * 0.9, h * 0.62, { beat: F.bt.phase, n: F.bt.n, energy: F.energy, t: F.t, mood: 'sing' }, p);
      else Art.prop(name, c, x + w / 2, y + h * 0.5, m * 0.78, F.t, p, { beat: F.bt.phase, n: F.bt.n });
    };
  }
  function drawFrames(F, Lc, R, sc, o) {
    var ctx = F.ctx, L = F.L, n = Math.max(1, sc.kind === 'art' ? 1 : sc.photos.length), sl = SLOTS[o && o.album && n > 1 && n < 4 ? (L.tall ? 'album' : 'albumSq') : L.tall && R.w / R.h < 0.95 ? 'tall' : 'square'][Math.min(4, n) - 1], out = [], i, look = F.tp.look;
    for (i = 0; i < n && i < 4; i++) {
      var s = sl[i], cx = R.x + s[0] * R.w, cy = R.y + s[1] * R.h, sw = s[2] * R.w, sh = s[3] * R.h * (o && o.capRoom && n === 1 ? 0.93 : 1), name = sc.frames[i] || F.tp.frames[0], lk = (sc.looks && sc.looks[i]) || {}, asp = sc.kind === 'art' ? ASPECT[name] || metaOf('frame', name).aspect || 0.82 : aspectFor(name, lk.ar);
      if (asp > 1.05) sw = n === 1 ? Math.max(sw, R.w * 0.96) : sw * 1.28;   /* a wide frame takes the width (alone), or overlaps its neighbours a little (in a collage): never a small picture in a big gap */
      var bw = Math.min(sw, sh * asp), bh = bw / asp, a = clamp((Lc.lt - 0.04 - i * 0.13) / 0.6, 0, 1), art = sc.kind === 'art', idx = art ? -1 : sc.photos[i];
      if (o && o.capRoom && n === 1) cy -= R.h * 0.03;
      var img = idx >= 0 && F.env.images ? F.env.images[idx] || null : null, tilt = n > 1 ? (i % 2 ? 1 : -1) * 0.04 : num(look.tilt, 0) * (sc.n % 2 ? -1 : 1);
      var float = Math.sin(F.t * 0.9 + i * 1.7 + sc.n) * L.u * 0.5, kb = Lc.u;
      ctx.save(); enter(ctx, look.frameIn, a, cx, cy, bw, bh, i + sc.n, F);
      var q = Art.frame(name, ctx, img, cx - bw / 2, cy - bh / 2 + float, bw, bh, F.t, F.pal, { beat: F.bt.phase, n: F.bt.n + i, seed: sc.n * 7 + i, tilt: tilt, zoom: 1 + 0.07 * kb, panX: (i % 2 ? -1 : 1) * 0.014 * (kb - 0.5), panY: -0.012 * kb, art: art ? vignetteArt(F, sc.vignette || 'star') : null, festive: F.tp.occasion === 'christmas', fit: lk.fit || null, solo: !!lk.solo, keep: !lk.solo });
      ctx.restore();
      var face = null;
      if (!art) { face = { x: q.x + q.w * 0.22, y: q.y + q.h * 0.16 - L.u * 0.6, w: q.w * 0.56, h: q.h * 0.56 + L.u * 1.2 }; Lc.faces.push(face); pushBox(F, Lc, 'photo', q.x, q.y, q.w, q.h, idx); pushBox(F, Lc, 'face', q.x + q.w * 0.22, q.y + q.h * 0.16, q.w * 0.56, q.h * 0.56, idx); }
      out.push({ box: { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh }, q: q, face: face, a: a });
    }
    return out;
  }
  function tagText(F, Lc, text, cx, y, maxW, o) { /* a little paper tag with a caption; y is the wanted top */
    text = str(text); if (!text) return null;
    var ctx = F.ctx, L = F.L, W = F.W, p = F.pal, fam = F.tp.look.fonts.caption, pad = W * 0.022, sf = L.safe;
    maxW = Math.min(maxW, sf.w);
    var ft = fit(ctx, text, fam, maxW - pad * 2, W * (o && o.px || 0.042), W * 0.026, 2), w = ft.w + pad * 2, h = ft.h + pad * 0.9;
    var r = { x: clamp(cx - w / 2, sf.x, sf.x + sf.w - w), y: clamp(y, sf.y, (o && o.bottom != null ? o.bottom : sf.y + sf.h) - h), w: w, h: h };
    r = clearOfFaces(F, Lc, r); if (!r) return null;
    var a = o && o.a != null ? o.a : 1, e = outBack(a), ccx = r.x + r.w / 2, ccy = r.y + r.h / 2;
    if (calm(F)) e = outCubic(a);
    if (a <= 0.02) return r;
    ctx.save(); ctx.translate(ccx, ccy); ctx.scale(0.5 + 0.5 * e, 0.5 + 0.5 * e); ctx.translate(-ccx, -ccy); ctx.globalAlpha = clamp(a * 2, 0, 1);
    fillRR(ctx, r.x + L.u * 0.5, r.y + L.u * 0.7, r.w, r.h, L.u * 1.2, 'rgba(0,0,0,0.2)'); fillRR(ctx, r.x, r.y, r.w, r.h, L.u * 1.2, p.paper); strokeRR(ctx, r.x, r.y, r.w, r.h, L.u * 1.2, alpha(p.ink, 0.25), Math.max(1, L.u * 0.25));
    fillRR(ctx, ccx - L.u * 4, r.y - L.u * 1.1, L.u * 8, L.u * 2.2, L.u * 0.3, alpha(p.accent, 0.82));
    drawLines(ctx, ft, ccx, r.y + (r.h - ft.h) / 2, { fill: p.ink });
    ctx.restore(); pushBox(F, Lc, 'text', r.x, r.y, r.w, r.h, o && o.what || 'caption');
    return r;
  }

  /* ---------- titles ---------- */
  var TITLES = ['outline', 'plate', 'ribbon', 'neon', 'gold', 'pixel', 'chalk', 'sticker', 'sign'];
  function titleStyle(F) {
    var p = F.pal, lk = F.tp.look, k = lk.title || 'outline', st;
    if (k === 'plate') st = { fill: p.ink, sub: alpha(p.ink, 0.8), plate: 'plate' };
    else if (k === 'ribbon') st = { fill: p.paper, shadow: alpha(dark(p.accent, 0.6), 0.6), sdy: 0.05, sub: p.paper, plate: 'ribbon' };
    else if (k === 'sign') st = { fill: p.paper, shadow: 'rgba(40,20,8,0.55)', sdy: 0.05, sub: p.paper, plate: 'sign' };
    else if (k === 'neon') st = { fill: '#ffffff', glow: p.accent, sub: light(p.gold, 0.3), subGlow: p.gold };
    else if (k === 'gold') st = { fill: p.gold, stroke: dark(p.bg, 0.55), sw: 0.13, shadow: 'rgba(0,0,0,0.35)', sdy: 0.07, sub: p.paper, subStroke: dark(p.bg, 0.55) };
    else if (k === 'pixel') st = { fill: p.paper, shadow: p.accent, sdx: 0.09, sdy: 0.09, sub: p.gold, subShadow: dark(p.bg, 0.5) };
    else if (k === 'chalk') st = { fill: alpha(p.paper, 0.96), sub: alpha(p.paper, 0.8), plate: 'chalkline' };
    else if (k === 'sticker') st = { fill: p.accent, stroke: p.paper, sw: 0.26, shadow: 'rgba(0,0,0,0.28)', sdy: 0.08, sub: p.ink, subStroke: p.paper };
    else if (TP[k]) { st = TP[k](F); st.plate = k; }
    else st = { fill: p.paper, stroke: p.ink, sw: 0.16, shadow: 'rgba(0,0,0,0.3)', sdy: 0.08, sub: p.paper, subStroke: p.ink };
    if (lk.titleFill) st.fill = lk.titleFill; if (lk.titleStroke) { st.stroke = lk.titleStroke; if (st.subStroke) st.subStroke = lk.titleStroke; } if (lk.subFill) st.sub = lk.subFill; if (lk.titleSw) st.sw = lk.titleSw;
    return st;
  }
  /* ---------- more title cards (the library's looks; no launch template names one) ----------
     Each gives a title style with its own plate or shade: pad [x, y when tall, y when square] as fractions of W;
     draw(c, g, phase) with phase 0 behind the words, 1 after the big line, 2 after everything; g is the plate's rect and
     the text's metrics. The words always read on what is right behind them (reads(): a contrast of 5 or more). */
  var TP = {};
  function softShade(c, x, y, w, h, u, col) { for (var i = 0; i < 9; i++) fillRR(c, x - u * (1.6 + i * 0.95), y - u * (1 + i * 0.6), w + u * (3.2 + i * 1.9), h + u * (2 + i * 1.2), u * (2.4 + i * 1.1), alpha(col, 0.17)); }
  function tone(F) { /* words with no plate: a light shade and ink on a light backdrop, a dark shade and paper on a dark one */
    var p = F.pal, lt = lum(F.tp.look.dimColor || p.bg) > 0.62, sh = lt ? light(p.paper, 0.5) : dark(p.bg, 0.78);
    return { light: lt, sh: sh, tx: reads(lt ? p.ink : p.paper, sh, 9) };
  }
  TP.marquee = function (F) { var p = F.pal, body = reads(dark(p.accent, 0.5), '#ffffff', 9), bulb = '#ffe9a0';
    return { fill: reads(light(p.gold, 0.6), body, 8), sub: reads(p.paper, body, 8), shadow: 'rgba(0,0,0,0.45)', sdy: 0.05, pad: [0.064, 0.048, 0.038], topK: 0.6, below: 1.2,
      draw: function (c, g, ph) { if (ph) return; var u = g.u, x = g.x, y = g.y, w = g.w, h = g.h, i, P = 2 * (w + h - u * 6), n = Math.max(12, Math.round(P / (u * 3.4))), q, on;
        fillRR(c, x + u * 0.7, y + u * 1.1, w, h, u * 2, 'rgba(0,0,0,0.3)'); fillRR(c, x, y, w, h, u * 2, body); strokeRR(c, x, y, w, h, u * 2, p.gold, u * 0.55); fillRR(c, x + u * 3, y + u * 3, w - u * 6, h - u * 6, u * 1, 'rgba(0,0,0,0.3)');
        for (i = 0; i < n; i++) { q = perim(x + u * 1.5, y + u * 1.5, w - u * 3, h - u * 3, P * i / n); on = (((i - F.bt.n) % 3) + 3) % 3 === 0; if (on) disc(c, q[0], q[1], u * 1.5, alpha(bulb, 0.32)); disc(c, q[0], q[1], u * 0.72, on ? bulb : dark(bulb, 0.5)); } } }; };
  TP.stamp = function (F) { var p = F.pal, card = light(p.paper, 0.2), ink = reads(p.accent, card, 5.5);
    return { fill: ink, sub: ink, pad: [0.06, 0.042, 0.032], rot: -0.035, topK: 1.6, below: 2.4,
      draw: function (c, g, ph) { var u = g.u, x = g.x, y = g.y, w = g.w, h = g.h, i, R0;
        if (!ph) { fillRR(c, x + u * 0.6, y + u * 0.9, w, h, u * 1.4, 'rgba(0,0,0,0.22)'); fillRR(c, x, y, w, h, u * 1.4, card); strokeRR(c, x + u * 1.1, y + u * 1.1, w - u * 2.2, h - u * 2.2, u * 1.8, ink, u * 0.75); strokeRR(c, x + u * 2.25, y + u * 2.25, w - u * 4.5, h - u * 4.5, u * 1, ink, Math.max(1, u * 0.24)); }
        else if (ph === 2) { /* the ink did not take everywhere: flecks of the card show through the letters and the ring */
          R0 = Art.rnd('stamp'); c.fillStyle = card; for (i = 0; i < 60; i++) { var fx = x + R0() * w, fy = y + R0() * h, fr = u * (0.1 + R0() * 0.2); c.beginPath(); c.ellipse(fx, fy, fr * 1.7, fr, R0() * 3, 0, TAU); c.fill(); } } } }; };
  TP.pennant = function (F) { var p = F.pal, body = reads(p.accent2, '#ffffff', 5.4), dk = dark(body, 0.4), tx = reads(p.paper, body, 5);
    return { fill: tx, sub: tx, shadow: alpha(dk, 0.7), sdy: 0.05, pad: [0.07, 0.036, 0.027], topK: 1.8, below: 2.2,
      draw: function (c, g, ph) { if (ph) return; var u = g.u, x0 = g.x - u * 2.2, x1 = g.x + g.w + u * 2.2, y0 = g.y, y1 = g.y + g.h, ar = u * 1.5, nt = u * 3, ym = (y0 + y1) / 2 + ar, m;
        function shape(dx, dy, ins) { c.beginPath(); c.moveTo(x0 + dx + ins * 2.4, y0 + ar + dy + ins); c.quadraticCurveTo(g.cx + dx, y0 - ar + dy + ins, x1 + dx - ins * 2.4, y0 + ar + dy + ins); c.lineTo(x1 + dx - nt - ins * 1.3, ym + dy); c.lineTo(x1 + dx - ins * 2.4, y1 + ar + dy - ins); c.quadraticCurveTo(g.cx + dx, y1 - ar + dy - ins, x0 + dx + ins * 2.4, y1 + ar + dy - ins); c.lineTo(x0 + dx + nt + ins * 1.3, ym + dy); c.closePath(); }
        shape(u * 0.6, u * 1, 0); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill(); shape(0, 0, 0); inked(c, body, dk, Math.max(1, u * 0.3));
        shape(0, 0, u * 0.95); c.setLineDash([u * 1.2, u * 0.9]); c.strokeStyle = alpha(p.paper, 0.75); c.lineWidth = Math.max(1, u * 0.24); c.stroke(); c.setLineDash([]);
        for (m = 0; m < 2; m++) { var px = m ? x1 - u * 0.5 : x0 + u * 0.5; disc(c, px, y0 + ar, u * 1.1, dark(p.gold, 0.5)); disc(c, px, y0 + ar, u * 0.8, p.gold); disc(c, px - u * 0.22, y0 + ar - u * 0.22, u * 0.26, light(p.gold, 0.7)); } } }; };
  TP.kraft = function (F) { var p = F.pal, kc = '#cfa873', ink = '#3b2a1a';
    return { fill: ink, sub: ink, pad: [0.08, 0.034, 0.026], topK: 1, below: 1,
      draw: function (c, g, ph) { if (ph) return; var u = g.u, x = g.x, y = g.y, w = g.w, h = g.h, ch = Math.min(h * 0.3, u * 4.2), i, m, hx = x + u * 3.4, hy = y + h / 2;
        for (m = 0; m < 2; m++) { var dx = m ? 0 : u * 0.6, dy = m ? 0 : u * 0.9; c.beginPath(); c.moveTo(x + ch + dx, y + dy); c.lineTo(x + w + dx, y + dy); c.lineTo(x + w + dx, y + h + dy); c.lineTo(x + ch + dx, y + h + dy); c.lineTo(x + dx, y + h - ch + dy); c.lineTo(x + dx, y + ch + dy); c.closePath(); if (m) inked(c, kc, dark(kc, 0.4), Math.max(1, u * 0.3)); else { c.fillStyle = 'rgba(0,0,0,0.24)'; c.fill(); } }
        c.strokeStyle = alpha(dark(kc, 0.5), 0.16); c.lineWidth = Math.max(1, u * 0.2); for (i = 0; i < 9; i++) { var fx = x + w * (0.12 + 0.09 * i), fy = y + h * (0.16 + 0.68 * frac(i * 0.618)); c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + u * 3.2, fy + u * 0.3); c.stroke(); }
        c.setLineDash([u * 1.4, u * 1]); strokeRR(c, x + u * 6.2, y + u * 1.2, w - u * 7.4, h - u * 2.4, u * 0.6, 'rgba(255,255,255,0.7)', Math.max(1, u * 0.28)); c.setLineDash([]);
        c.lineCap = 'round'; for (m = 0; m < 2; m++) { c.strokeStyle = m ? '#f6eedd' : 'rgba(60,40,20,0.5)'; c.lineWidth = u * (m ? 0.42 : 0.75); c.beginPath(); c.moveTo(hx, hy); c.bezierCurveTo(hx - u * 5, hy - u * 1, x - u * 3.4, y + u * 0.5, x - u * 1.6, y - u * 2.8); c.moveTo(hx, hy); c.bezierCurveTo(hx - u * 4.4, hy + u * 1.4, x - u * 4.4, y + u * 1.6, x - u * 3.4, y - u * 2); c.stroke(); }
        disc(c, hx, hy, u * 1.7, light(kc, 0.5)); disc(c, hx, hy, u * 0.85, dark(kc, 0.6)); } }; };
  TP.bubble = function (F) { var p = F.pal, wh = '#ffffff';
    return { fill: reads(p.accent, wh, 5), sub: reads(p.ink, wh, 8), pad: [0.06, 0.04, 0.03], topK: 2.2, below: 4.2,
      draw: function (c, g, ph) { if (ph) return; var u = g.u, x = g.x, y = g.y, w = g.w, h = g.h, n = Math.max(4, Math.round(w / (u * 9))), i, m;
        for (m = 0; m < 2; m++) { var ox = m ? 0 : u * 0.5, oy = m ? 0 : u * 1.1; c.fillStyle = m ? wh : 'rgba(70,90,140,0.26)'; fillRR(c, x + ox, y + oy, w, h, Math.min(h * 0.42, u * 7), c.fillStyle);
          for (i = 0; i < n; i++) { var bx = x + w * (i + 0.5) / n + ox; c.beginPath(); c.ellipse(bx, y + u * 0.9 + oy, w / n * 0.6, u * (2.6 + (i % 2) * 0.8), 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(bx, y + h - u * 0.9 + oy, w / n * 0.6, u * (2.6 + ((i + 1) % 2) * 0.8), 0, 0, TAU); c.fill(); }
          disc(c, x + w * 0.17 + ox, y + h + u * 2.1 + oy, u * 1.15, c.fillStyle); disc(c, x + w * 0.13 + ox, y + h + u * 3.7 + oy, u * 0.62, c.fillStyle); } } }; };
  TP.tapestrip = function (F) { var p = F.pal, pc = light(p.paper, 0.15);
    return { fill: reads(p.ink, pc, 8), sub: reads(mix(p.ink, p.accent, 0.55), pc, 5.5), pad: [0.056, 0.03, 0.022], rot: 0.014, topK: 2.4, below: 1.2,
      draw: function (c, g, ph) { if (ph) return; var u = g.u, x = g.x, y = g.y, w = g.w, h = g.h, n = 10, i, m, k;
        function strip(dx, dy) { c.beginPath(); c.moveTo(x + dx, y + dy); c.lineTo(x + w + dx, y + dy); for (i = 0; i <= n; i++) c.lineTo(x + w + dx - (i % 2) * u * 0.7, y + dy + h * i / n); c.lineTo(x + dx, y + h + dy); for (i = n; i >= 0; i--) c.lineTo(x + dx + (i % 2) * u * 0.7, y + dy + h * i / n); c.closePath(); }
        strip(u * 0.5, u * 0.9); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fill(); strip(0, 0); c.fillStyle = pc; c.fill();
        for (m = 0; m < 2; m++) { c.save(); c.translate(m ? x + w - u * 1.2 : x + u * 1.2, y + u * 0.5); c.rotate(m ? 0.62 : -0.62); var tc = m ? p.accent2 : p.accent; c.fillStyle = alpha(tc, 0.86); c.fillRect(-u * 4.6, -u * 1.4, u * 9.2, u * 2.8); c.fillStyle = alpha(light(tc, 0.55), 0.8); for (k = 0; k < 5; k++) c.fillRect(-u * 4 + k * u * 1.8, -u * 1.4, u * 0.7, u * 2.8); c.restore(); } } }; };
  TP.letterpress = function (F) { var p = F.pal, pc = mix(p.paper, '#efe6d2', 0.55), ink = reads(mix(p.ink, p.accent, 0.3), pc, 7);
    return { fill: ink, shadow: 'rgba(255,255,255,0.95)', sdy: 0.03, sub: ink, pad: [0.062, 0.042, 0.032], topK: 0.6, below: 1,
      draw: function (c, g, ph) { if (ph) return; var u = g.u, x = g.x, y = g.y, w = g.w, h = g.h, lw = Math.max(1, u * 0.22), i, R0 = Art.rnd('press'), m;
        fillRR(c, x + u * 0.3, y + u * 0.5, w, h, u * 0.5, 'rgba(0,0,0,0.18)'); fillRR(c, x + u * 0.7, y + u * 1.2, w, h, u * 0.5, 'rgba(0,0,0,0.12)'); fillRR(c, x, y, w, h, u * 0.5, pc);
        c.fillStyle = alpha(dark(pc, 0.5), 0.07); for (i = 0; i < 46; i++) c.fillRect(x + R0() * (w - u * 2), y + R0() * (h - u), u * (0.4 + R0() * 1.6), Math.max(1, u * 0.14));
        strokeRR(c, x + u * 1.5, y + u * 1.5 + lw, w - u * 3, h - u * 3, u * 0.3, 'rgba(255,255,255,0.95)', lw); strokeRR(c, x + u * 1.5, y + u * 1.5, w - u * 3, h - u * 3, u * 0.3, alpha(dark(pc, 0.6), 0.55), lw);
        for (m = 0; m < 2; m++) { var dy = m ? y + h - u * 1.5 : y + u * 1.5; c.beginPath(); c.moveTo(g.cx, dy - u * 0.8); c.lineTo(g.cx + u * 0.8, dy); c.lineTo(g.cx, dy + u * 0.8); c.lineTo(g.cx - u * 0.8, dy); c.closePath(); c.fillStyle = pc; c.fill(); c.beginPath(); c.moveTo(g.cx, dy - u * 0.5); c.lineTo(g.cx + u * 0.5, dy); c.lineTo(g.cx, dy + u * 0.5); c.lineTo(g.cx - u * 0.5, dy); c.closePath(); c.fillStyle = ink; c.fill(); } } }; };
  TP.block3d = function (F) { var p = F.pal, tn = tone(F), side = reads(p.accent, '#ffffff', 4.2), edge = dark(side, 0.72), face = tn.light ? '#ffffff' : light(p.gold, 0.4);
    return { fill: face, sub: tn.tx, pad: [0.012, 0.004, 0.003], below: 1,
      draw: function (c, g, ph) { if (ph) return; var px = g.bf.px, d = px * 0.013, i;
        softShade(c, g.cx - g.bw / 2, g.top, g.bw, g.th, g.u, tn.sh);
        for (i = 6; i >= 0; i -= 2) drawLines(c, g.bf, g.cx + d * i, g.top + d * i, { fill: edge, stroke: edge, sw: 0.1 });
        for (i = 6; i >= 1; i--) drawLines(c, g.bf, g.cx + d * i, g.top + d * i, { fill: i > 3 ? dark(side, 0.16) : side }); } }; };
  TP.comic = function (F) { var p = F.pal, ink = dark(p.ink, 0.35), burst = light(p.gold, 0.12), sh = reads(p.accent, '#ffffff', 3.4);
    return { fill: '#ffffff', stroke: ink, sw: 0.2, shadow: ink, sdx: 0.05, sdy: 0.07, sub: reads(ink, burst, 8), pad: [0.07, 0.05, 0.038], topK: 3.6, below: 4.4,
      draw: function (c, g, ph) { if (ph) return; var u = g.u, A = g.w / 2, B = g.h / 2, cy = g.y + B, n = 28, i, j;
        function shape(dx, dy) { c.beginPath(); for (i = 0; i < n; i++) { var an = (i + 0.5) / n * TAU, ex = Math.cos(an), ey = Math.sin(an), sp = i % 2 ? 0 : u * (3 + 1.1 * Math.sin(i * 2.3)), qx = (ex < 0 ? -1 : 1) * Math.pow(Math.abs(ex), 0.55), qy = (ey < 0 ? -1 : 1) * Math.pow(Math.abs(ey), 0.55); c.lineTo(g.cx + dx + qx * (A + sp), cy + dy + qy * (B + sp)); } c.closePath(); }
        shape(u * 0.9, u * 1.2); c.fillStyle = sh; c.fill(); c.strokeStyle = ink; c.lineWidth = u * 0.5; c.lineJoin = 'miter'; c.stroke(); shape(0, 0); inked(c, burst, ink, u * 0.55);
        c.save(); shape(0, 0); c.clip(); c.fillStyle = alpha(sh, 0.3); for (j = 0; j < 7; j++) for (i = 0; i < 9; i++) { var r = u * 0.75 * (1 - (i + j) / 15); if (r > 0.3) disc(c, g.x + g.w + u * 1.5 - i * u * 2.4 - (j % 2) * u * 1.2, g.y + g.h + u * 1.5 - j * u * 2, r, c.fillStyle); } c.restore(); c.lineJoin = 'round'; } }; };
  TP.underline = function (F) { var p = F.pal, tn = tone(F), bar = crt(p.accent, tn.sh) >= crt(p.gold, tn.sh) ? p.accent : p.gold;
    return { fill: tn.tx, sub: tn.tx, pad: [0, 0, 0], gapK: 0.36, below: 1.6,
      draw: function (c, g, ph) { var px = g.bf.px;
        if (!ph) softShade(c, g.cx - g.bw / 2, g.top, g.bw, g.th + (g.sf ? 0 : px * 0.2), g.u, tn.sh);
        else if (ph === 1) { var bw = Math.max(g.bf.w * 0.56, g.u * 12) * outCubic((g.lt - 0.3) / 0.55), bh = Math.max(2, px * 0.085); if (bw > 1) fillRR(c, g.cx - g.bf.w / 2, g.top + g.bf.h + px * 0.07, Math.min(bw, g.bf.w), bh, bh / 2, bar); } } }; };
  TP.quiet = function (F) { var tn = tone(F);
    return { fill: tn.tx, sub: tn.tx, pad: [0, 0.026, 0.019], still: true, topK: 0.6, below: 0.6,
      draw: function (c, g, ph) { if (ph) return; var u = g.u, rw = Math.max(g.bw * 0.6, u * 16), lw = Math.max(1, u * 0.18), m;
        softShade(c, g.cx - g.bw / 2, g.y + u * 0.6, g.bw, g.h - u * 1.2, u, tn.sh);
        c.fillStyle = alpha(tn.tx, 0.72); for (m = 0; m < 2; m++) c.fillRect(g.cx - rw / 2, m ? g.y + g.h - u * 0.8 - lw : g.y + u * 0.8, rw, lw); } }; };
  TP.softglow = function (F) { var p = F.pal, sh = dark(p.bg, 0.82);
    return { fill: reads(light(p.gold, 0.74), sh, 10), glow: p.gold, sub: reads(light(p.gold, 0.55), sh, 8), pad: [0, 0, 0], below: 1,
      draw: function (c, g, ph) { if (ph) return; var cy = g.top + g.th / 2, r = g.bw * 0.62 + g.u * 6, gr;
        softShade(c, g.cx - g.bw / 2, g.top, g.bw, g.th, g.u, sh);
        c.save(); c.translate(g.cx, cy); c.scale(1, Math.min(1, (g.th * 0.9 + g.u * 6) / r)); gr = c.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, alpha(p.gold, 0.3)); gr.addColorStop(0.6, alpha(p.gold, 0.1)); gr.addColorStop(1, alpha(p.gold, 0)); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore(); } }; };
  TP.ticket = function (F) { var p = F.pal, body = mix(light(p.gold, 0.5), p.paper, 0.3), ink = reads(p.ink, body, 8), ac = reads(p.accent, body, 5);
    return { fill: ink, sub: ac, pad: [0.088, 0.038, 0.028], topK: 0.8, below: 1,
      draw: function (c, g, ph) { if (ph) return; var u = g.u, x = g.x, y = g.y, w = g.w, h = g.h, r = Math.min(h * 0.16, u * 2.6), sx = r * 2.7, m, k;
        for (m = 0; m < 2; m++) { var dx = m ? 0 : u * 0.6, dy = m ? 0 : u * 0.9; c.beginPath(); c.moveTo(x + dx, y + dy); c.lineTo(x + w + dx, y + dy); c.lineTo(x + w + dx, y + h / 2 - r + dy); c.arc(x + w + dx, y + h / 2 + dy, r, -PI / 2, PI / 2, true); c.lineTo(x + w + dx, y + h + dy); c.lineTo(x + dx, y + h + dy); c.lineTo(x + dx, y + h / 2 + r + dy); c.arc(x + dx, y + h / 2 + dy, r, PI / 2, -PI / 2, true); c.closePath(); c.fillStyle = m ? body : 'rgba(0,0,0,0.24)'; c.fill(); }
        c.fillStyle = ac; c.fillRect(x + sx, y + u * 0.9, w - sx * 2, Math.max(1, u * 0.45)); c.fillRect(x + sx, y + h - u * 0.9 - Math.max(1, u * 0.45), w - sx * 2, Math.max(1, u * 0.45));
        c.setLineDash([u * 0.9, u * 0.8]); c.strokeStyle = alpha(ink, 0.55); c.lineWidth = Math.max(1, u * 0.26); c.beginPath(); c.moveTo(x + sx, y + u * 0.6); c.lineTo(x + sx, y + h - u * 0.6); c.moveTo(x + w - sx, y + u * 0.6); c.lineTo(x + w - sx, y + h - u * 0.6); c.stroke(); c.setLineDash([]);
        for (m = 0; m < 2; m++) for (k = -1; k <= 1; k += 2) { starPath(c, m ? x + w - sx * 0.42 : x + sx * 0.42, y + h / 2 + k * Math.min(h * 0.3, r * 2.2), Math.min(u * 1.3, r * 0.6), 0); c.fillStyle = ac; c.fill(); } } }; };
  TP.parchment = function (F) { var p = F.pal, pc = '#f3e3bf', ink = '#3a2413';
    return { fill: ink, sub: '#5a3a1c', pad: [0.078, 0.036, 0.027], topK: 1.2, below: 1.4,
      draw: function (c, g, ph) { if (ph) return; var u = g.u, x = g.x, y = g.y, w = g.w, h = g.h, r = Math.min(h * 0.13, u * 2.3), m, i, n = 14;
        fillRR(c, x + r + u * 0.6, y + u * 1, w - r * 2, h, u * 0.5, 'rgba(0,0,0,0.22)');
        c.beginPath(); c.moveTo(x + r, y); for (i = 1; i <= n; i++) c.lineTo(x + r + (w - r * 2) * i / n, y + Math.sin(i * 1.9) * u * 0.22); for (i = n; i >= 0; i--) c.lineTo(x + r + (w - r * 2) * i / n, y + h + Math.sin(i * 2.7) * u * 0.22); c.closePath(); c.fillStyle = pc; c.fill();
        c.fillStyle = 'rgba(120,80,30,0.13)'; c.fillRect(x + r, y, w - r * 2, u * 1.1); c.fillRect(x + r, y + h - u * 1.1, w - r * 2, u * 1.1); c.fillStyle = 'rgba(120,80,30,0.2)'; c.fillRect(x + r * 2, y, u * 0.8, h); c.fillRect(x + w - r * 2 - u * 0.8, y, u * 0.8, h);
        for (m = 0; m < 2; m++) { var rx = m ? x + w - r * 2 : x; fillRR(c, rx, y - u * 0.8, r * 2, h + u * 1.6, r, '#dcc48f'); strokeRR(c, rx, y - u * 0.8, r * 2, h + u * 1.6, r, 'rgba(110,75,30,0.55)', Math.max(1, u * 0.25)); fillRR(c, rx + r * 0.45, y - u * 0.3, r * 0.5, h + u * 0.6, r * 0.25, 'rgba(255,255,255,0.4)'); disc(c, rx + r, y - u * 0.8, r * 0.72, dark(p.gold, 0.35)); disc(c, rx + r, y - u * 0.8, r * 0.5, p.gold); disc(c, rx + r, y + h + u * 0.8, r * 0.72, dark(p.gold, 0.35)); disc(c, rx + r, y + h + u * 0.8, r * 0.5, p.gold); } } }; };
  TITLES = TITLES.concat(Object.keys(TP));

  /* big line(s) in the title face and a smaller line under it, at the top of the stage; returns the y under the block.
     o.deco (a sign-off flourish, see SO) may ask for room above and below the block and draws around it. */
  function topText(F, Lc, big, small, o) {
    var ctx = F.ctx, L = F.L, W = F.W, S = L.stage, p = F.pal, fonts = F.tp.look.fonts, st = titleStyle(F), plate = st.plate, u = L.u, dec = o.deco || null, ds = L.tall ? 1 : 0.72;
    var padY = st.pad ? W * st.pad[L.tall ? 1 : 2] : plate && plate !== 'chalkline' ? W * (L.tall ? 0.03 : 0.02) : 0, padX = st.pad ? W * st.pad[0] : plate && plate !== 'chalkline' ? W * 0.05 : 0, maxW = S.w * 0.96 - padX * 2;
    var bf = fit(ctx, big, fonts.title, maxW, W * (o.bigPx || (L.tall ? 0.115 : 0.07)) * (fonts.titleScale || 1), W * 0.034, 2);
    var sf = small ? fit(ctx, small, fonts.body, maxW, W * (o.smallPx || (L.tall ? 0.05 : 0.036)), W * 0.026, o.smallLines || 1) : null;
    var gap = sf ? bf.px * 0.12 : 0, h = bf.h + (sf ? sf.h + gap : 0), top = S.y + padY + (plate === 'sign' ? W * 0.03 : 0) + (o.dy || 0), bw = Math.max(bf.w, sf ? sf.w : 0);
    if (st.gapK && sf) { h += bf.px * st.gapK - gap; gap = bf.px * st.gapK; }
    if (st.topK) top += u * st.topK * ds;
    var dv = u * (L.tall ? 1.6 : 1.05);   /* a flourish's unit */
    if (dec && dec.above) top += dv * dec.above;
    var a = clamp((Lc.lt - (o.delay || 0)) / 0.5, 0, 1), e = outBack(a), cx = W / 2, k = Math.exp(-6 * F.bt.phase) * F.energy;
    if (st.still || calm(F)) { k = 0; e = outCubic(a); }
    var bottom = top + h + padY, show = !F.hitOnly && a > 0.01;
    var G = st.draw || dec ? { x: cx - bw / 2 - padX, y: top - padY, w: bw + padX * 2, h: h + padY * 2, cx: cx, top: top, th: h, bw: bw, bf: bf, sf: sf, gap: gap, u: u, v: dv, W: W, lt: Lc.lt, a: a, da: clamp((Lc.lt - 0.3) / 0.5, 0, 1), tall: L.tall } : null;
    if (dec && show) { ctx.save(); dec.draw(ctx, F, G, 0); ctx.restore(); }
    if (a > 0.01) {
      ctx.save(); ctx.globalAlpha = clamp(a * 2.2, 0, 1); ctx.translate(cx, top + h / 2); var sc = (0.72 + 0.28 * e) * (1 + 0.016 * k); ctx.scale(sc, sc); if (st.rot) ctx.rotate(st.rot); ctx.translate(-cx, -(top + h / 2));
      var px0 = cx - bw / 2 - padX, pw = bw + padX * 2, py0 = top - padY, phh = h + padY * 2;
      if (!plate && !F.hitOnly) { /* a title with no plate of its own gets a soft shade behind it, so it reads over any backdrop (a window, curtains, a busy wall) */
        var shc = F.tp.look.title === 'sticker' ? p.paper : dark(F.tp.look.dimColor || p.bg, 0.55), sg; for (sg = 0; sg < 4; sg++) fillRR(ctx, cx - bw / 2 - u * (3 + sg * 2.2), top - u * (1.5 + sg * 1.6), bw + u * (6 + sg * 4.4), h + u * (3 + sg * 3.2), u * (5 + sg * 2.5), alpha(shc, 0.15));
      }
      if (plate === 'plate') { fillRR(ctx, px0 + u * 0.8, py0 + u * 1.1, pw, phh, u * 2.4, 'rgba(0,0,0,0.22)'); fillRR(ctx, px0, py0, pw, phh, u * 2.4, p.paper); strokeRR(ctx, px0 + u * 1.2, py0 + u * 1.2, pw - u * 2.4, phh - u * 2.4, u * 1.6, p.accent, Math.max(1, u * 0.45)); strokeRR(ctx, px0 + u * 2.1, py0 + u * 2.1, pw - u * 4.2, phh - u * 4.2, u * 1.1, alpha(p.gold, 0.9), Math.max(1, u * 0.22)); }
      else if (plate === 'ribbon') { var tl = u * 5, dk = dark(p.accent, 0.3), m, sgn;
        for (m = 0; m < 2; m++) { sgn = m ? 1 : -1; var ex = m ? px0 + pw : px0; ctx.beginPath(); ctx.moveTo(ex - sgn * u * 2, py0 + u * 2.4); ctx.lineTo(ex + sgn * tl, py0 + u * 2.4); ctx.lineTo(ex + sgn * (tl - u * 2.6), py0 + u * 2.4 + phh / 2); ctx.lineTo(ex + sgn * tl, py0 + u * 2.4 + phh); ctx.lineTo(ex - sgn * u * 2, py0 + u * 2.4 + phh); ctx.closePath(); ctx.fillStyle = dk; ctx.fill(); }
        fillRR(ctx, px0, py0, pw, phh, u * 0.8, p.accent); ctx.fillStyle = alpha(p.gold, 0.9); ctx.fillRect(px0, py0 + u * 1.1, pw, Math.max(1, u * 0.35)); ctx.fillRect(px0, py0 + phh - u * 1.45, pw, Math.max(1, u * 0.35)); }
      else if (plate === 'sign') { var wd = '#a9703f'; ctx.strokeStyle = dark(wd, 0.45); ctx.lineWidth = u * 0.7; ctx.beginPath(); ctx.moveTo(px0 + pw * 0.14, py0); ctx.lineTo(px0 + pw * 0.2, py0 - W * 0.05); ctx.moveTo(px0 + pw * 0.86, py0); ctx.lineTo(px0 + pw * 0.8, py0 - W * 0.05); ctx.stroke();
        fillRR(ctx, px0 + u * 0.7, py0 + u * 1, pw, phh, u * 1.6, 'rgba(0,0,0,0.25)'); fillRR(ctx, px0, py0, pw, phh, u * 1.6, wd); ctx.strokeStyle = alpha(dark(wd, 0.4), 0.45); ctx.lineWidth = Math.max(1, u * 0.25); for (m = 1; m < 4; m++) { ctx.beginPath(); ctx.moveTo(px0 + u * 2, py0 + phh * m / 4); ctx.lineTo(px0 + pw - u * 2, py0 + phh * m / 4 + Math.sin(m * 3) * u); ctx.stroke(); }
        strokeRR(ctx, px0, py0, pw, phh, u * 1.6, dark(wd, 0.4), Math.max(1, u * 0.5)); disc(ctx, px0 + u * 2.4, py0 + u * 2.4, u * 0.7, light(wd, 0.5)); disc(ctx, px0 + pw - u * 2.4, py0 + u * 2.4, u * 0.7, light(wd, 0.5)); disc(ctx, px0 + u * 2.4, py0 + phh - u * 2.4, u * 0.7, light(wd, 0.5)); disc(ctx, px0 + pw - u * 2.4, py0 + phh - u * 2.4, u * 0.7, light(wd, 0.5)); }
      if (st.draw && !F.hitOnly) st.draw(ctx, G, 0);
      drawLines(ctx, bf, cx, top, st);
      if (st.draw && !F.hitOnly) st.draw(ctx, G, 1);
      if (plate === 'chalkline') { ctx.strokeStyle = alpha(p.gold, 0.9); ctx.lineWidth = Math.max(1, u * 0.5); ctx.lineCap = 'round'; ctx.beginPath(); var x0 = cx - bf.w * 0.4, yy = top + bf.h + u * 0.2, q; ctx.moveTo(x0, yy); for (q = 1; q <= 12; q++) ctx.lineTo(x0 + bf.w * 0.8 * q / 12, yy + (q % 2 ? -1 : 1) * u * 0.55); ctx.stroke(); }
      if (sf) drawLines(ctx, sf, cx, top + bf.h + gap, { fill: st.sub, stroke: st.subStroke, sw: 0.2, shadow: st.subShadow, glow: st.subGlow });
      if (st.draw && !F.hitOnly) st.draw(ctx, G, 2);
      ctx.restore();
    }
    if (dec && show) { ctx.save(); dec.draw(ctx, F, G, 1); ctx.restore(); }
    pushBox(F, Lc, 'text', cx - bf.w / 2, top, bf.w, bf.h, o.what || 'title');
    if (sf) pushBox(F, Lc, 'text', cx - sf.w / 2, top + bf.h + gap, sf.w, sf.h, o.whatSmall || 'from');
    var under = bottom + (plate === 'ribbon' ? u * 2.4 : 0);
    if (st.below) under += u * st.below * ds;
    if (dec && dec.below) under += dv * dec.below;
    return under;
  }

  /* ---------- scenes ---------- */
  function sceneTitle(F, Lc) {
    var card = F.card, L = F.L, S = L.stage, sc = Lc.sc, to = str(card.to), title = str(card.title) || (to ? 'A Carol for ' + to : 'A Carol for You'), from = str(card.from);
    var by = topText(F, Lc, title, from ? 'from ' + from : '', { what: 'title' }), R = { x: S.x, y: by + L.u * 2, w: S.w, h: S.y + S.h - by - L.u * 2 };
    if (sc.photo >= 0) { drawSky(F, Lc, R); drawFrames(F, Lc, R, sc, null); flank(F, Lc, 'dance'); }
    else { drawSky(F, Lc, R); tableau(F, Lc, R, 'dance', 'hero'); }
  }
  function scenePhoto(F, Lc) {
    var L = F.L, S = L.stage, sc = Lc.sc, caps = sc.captions || [], any = false, i, W = F.W, card = F.card;
    for (i = 0; i < caps.length; i++) if (caps[i]) any = true;
    var artTag = sc.kind === 'art' && sc.index === 0 && str(card.to) ? 'For ' + str(card.to) : '';
    drawSky(F, Lc, S);
    var fr = drawFrames(F, Lc, S, sc, { capRoom: any || !!artTag });
    flank(F, Lc, 'dance');
    var bottom = (L.mode === 'cast-low' ? S.y + S.h + L.u * 1.5 : L.band.y - L.u * 0.8);
    for (i = 0; i < fr.length; i++) { var txt = sc.kind === 'art' ? artTag : caps[i]; if (!txt) continue; var b = fr[i].box, mwid = fr.length === 1 ? W * (L.tall ? 0.6 : 0.52) : Math.max(b.w * 1.04, W * 0.3); tagText(F, Lc, txt, b.x + b.w / 2, b.y + b.h - W * 0.035, mwid, { a: clamp((Lc.lt - 0.45 - i * 0.13) / 0.4, 0, 1), bottom: bottom, px: fr.length === 1 ? 0.052 : 0.038 }); }
  }
  function staff(F, Lc, S) { /* a ribbon of music flowing across the top of the lyric scene: five lines and notes that hop on the beat */
    var ctx = F.ctx, W = F.W, u = F.L.u, p = F.pal, t = F.t, a = clamp(Lc.lt / 0.7, 0, 1), i, k, y0 = S.y + S.h * (F.L.tall ? 0.17 : 0.1), gap = u * (F.L.tall ? 2.3 : 1.5), k2 = Math.exp(-6 * F.bt.phase) * F.energy, n = 44;
    function wave(x) { return (Math.sin(x / W * 5.2 + t * 0.9) * u * 3.2 + Math.sin(x / W * 11 - t * 0.6) * u * 1.1) * (F.L.tall ? 1.5 : 1); }
    var lightBg = lum(F.tp.look.dimColor || p.bg) > 0.62, cols = lightBg ? [p.accent, p.accent2, p.gold, p.ink] : [p.gold, p.paper, p.accent, p.paper];
    var op = 1; if (calm(F)) { op = 0.45; k2 = 0; }
    ctx.save(); if (op < 1) ctx.globalAlpha = op; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, u * 0.28); ctx.strokeStyle = lightBg ? alpha(p.ink, 0.3) : alpha(p.snow, 0.5); ctx.beginPath();
    for (k = 0; k < 5; k++) for (i = 0; i <= n; i++) { var x = W * a * i / n, y = y0 + wave(x) + (k - 2) * gap; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    for (i = 0; i < 7; i++) {
      var f = frac(i / 7 + t * 0.045), nx = f * W, row = [1, -2, 0, 2, -1, 1.5, -0.5][i], ny = y0 + wave(nx) + row * gap * 0.5 - (i % 2 === (F.bt.n & 1) ? k2 * u * 2.2 : 0), col = cols[i % 4], s = u * (F.L.tall ? 2.3 : 1.5);
      if (nx > W * a) continue;
      ctx.globalAlpha = Math.min(1, f * 8, (1 - f) * 8) * op; ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, u * 0.42);
      ctx.beginPath(); ctx.ellipse(nx, ny, s, s * 0.74, -0.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(nx + s * 0.86, ny - s * 0.2); ctx.lineTo(nx + s * 0.86, ny - s * 4.2);
      if (i % 3 === 0) { ctx.lineTo(nx + s * 3.6, ny - s * 4.8); ctx.lineTo(nx + s * 3.6, ny - s * 0.9); ctx.stroke(); ctx.beginPath(); ctx.ellipse(nx + s * 2.75, ny - s * 0.7, s, s * 0.74, -0.4, 0, TAU); ctx.fill(); }
      else { ctx.quadraticCurveTo(nx + s * 2.6, ny - s * 3.6, nx + s * 2.1, ny - s * 2.2); ctx.stroke(); }
    }
    ctx.restore();
  }
  function sceneLyric(F, Lc) {
    var S = F.L.stage, fx = F.tp.lyricFx === undefined ? 'notes' : F.tp.lyricFx;
    drawSky(F, Lc, S); if (!F.hitOnly) staff(F, Lc, S); tableau(F, Lc, S, Lc.sc.perform ? (Lc.sc.index % 2 ? 'wave' : 'dance') : 'sing', Lc.sc.tableau || 'hero');
    if (fx && !F.hitOnly) Art.particles(fx, F.ctx, F.W, F.L.band.y, F.t, F.pal, { amount: 0.55 * clamp(Lc.lt / 0.6, 0, 1), seed: 'ly' + Lc.sc.n, beat: F.bt.phase });
  }
  /* ---------- sign-off flourishes (look.signoff; none = the plain sign-off) ----------
     Drawn with the greeting and the sign-off line: so(name, room above, room below, draw). The rooms are in units
     (1% of the short side, smaller on a square) and are kept clear for the flourish: the words move down by the room
     above and the photos start under the room below, so a flourish is never over a word or a photo. draw runs twice:
     phase 0 behind the words' plate (rays, beams), phase 1 in the rooms around them. g = the block's rect. */
  var SO = {};
  var SOZ = { popper: 1.25, seal: 1.25, candleglow: 1.3, posy: 1.25, trophy: 1.3, doves: 1.3, balloons: 1.2, crescent: 1.3, laurel: 1.1, cardframe: 0.7 };   /* how large each is drawn (a single object is drawn larger than a row of small ones) */
  function so(name, above, below, fn) {
    var z = SOZ[name] || 1;
    SO[name] = { above: above * z, below: below * z, draw: function (c, F, g, ph) {
      if (g.da <= 0.01) return; var tn = tone(F), p = F.pal;
      c.globalAlpha = g.da; c.lineJoin = 'round'; c.lineCap = 'round';
      fn(c, F, g, ph, { v: g.v * z, yb: g.y + g.h, p: p, k: calm(F) ? 0 : Math.exp(-5 * F.bt.phase) * F.energy, tn: tn, ol: alpha(dark(p.ink, 0.45), 0.85), lc: tn.light ? reads(p.accent, '#ffffff', 4) : light(p.gold, 0.35), pop: calm(F) ? outCubic(g.da) : outBack(g.da) });
    } };
  }
  function outside(c, g, m) { c.beginPath(); c.rect(-g.W, -g.W * 3, g.W * 3, g.W * 9); c.rect(g.x - m, g.y - m, g.w + m * 2, g.h + m * 2); c.clip('evenodd'); }   /* clip to everywhere but the words' block: what is drawn behind them never lies under a word */
  function lineOn(c, q, col, lw) { c.strokeStyle = q.tn.light ? 'rgba(255,255,255,0.6)' : 'rgba(23,15,28,0.5)'; c.lineWidth = lw * 2.4; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }   /* the current path as a line that shows on any backdrop */
  function dove(c, x, y, v, dir, flap, q) {
    var wh = q.p.snow, lw = Math.max(1, v * 0.2);
    c.save(); c.translate(x, y); c.scale(dir, 1);
    c.beginPath(); c.moveTo(-1.5 * v, 0.1 * v); c.lineTo(-4.1 * v, -0.5 * v); c.lineTo(-3.7 * v, 0.4 * v); c.lineTo(-4 * v, 1.1 * v); c.lineTo(-1.4 * v, 1 * v); c.closePath(); inked(c, wh, q.ol, lw);
    c.beginPath(); c.ellipse(0, 0.3 * v, 2.3 * v, 1.3 * v, -0.12, 0, TAU); inked(c, wh, q.ol, lw);
    c.beginPath(); c.arc(1.9 * v, -0.75 * v, 0.95 * v, 0, TAU); inked(c, wh, q.ol, lw); disc(c, 1.6 * v, -0.3 * v, 0.8 * v, wh);
    c.beginPath(); c.moveTo(2.75 * v, -0.95 * v); c.lineTo(3.65 * v, -0.6 * v); c.lineTo(2.75 * v, -0.35 * v); c.closePath(); inked(c, q.p.gold, q.ol, lw * 0.8); disc(c, 2.2 * v, -0.9 * v, 0.17 * v, '#2a2433');
    c.translate(-0.1 * v, -0.2 * v); c.rotate(-0.25 + flap); c.beginPath(); c.moveTo(0.9 * v, 0.4 * v); c.bezierCurveTo(0.2 * v, -2.2 * v, -1.6 * v, -3.3 * v, -3.2 * v, -3 * v); c.bezierCurveTo(-2.6 * v, -1.6 * v, -1.8 * v, -0.2 * v, -0.9 * v, 0.7 * v); c.closePath(); inked(c, mix(wh, '#c3cee2', 0.4), q.ol, lw);
    c.restore();
  }
  so('seal', 0, 9.8, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, x = g.cx, y = q.yb + v * 4.5, r = v * 3.5 * q.pop, wax = mix(q.p.accent, '#8a1426', 0.3), i, m, lw = Math.max(1, v * 0.22);
    function blob(dx, dy) { c.beginPath(); for (i = 0; i <= 44; i++) { var an = i / 44 * TAU, rad = r * (1 + 0.07 * Math.sin(an * 9) + 0.035 * Math.sin(an * 4 + 1)); c.lineTo(x + dx + Math.cos(an) * rad, y + dy + Math.sin(an) * rad); } c.closePath(); }
    for (m = -1; m <= 1; m += 2) { c.beginPath(); c.moveTo(x + m * v * 0.3, y); c.lineTo(x + m * v * 3.5, y + v * 4.7); c.lineTo(x + m * v * 2.2, y + v * 4.1); c.lineTo(x + m * v * 1.4, y + v * 5.1); c.lineTo(x - m * v * 0.7, y + v * 1); c.closePath(); inked(c, dark(wax, 0.22), q.ol, lw); }
    blob(v * 0.4, v * 0.6); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill(); blob(0, 0); inked(c, wax, dark(wax, 0.45), lw);
    c.beginPath(); c.arc(x, y, r * 0.72, 0, TAU); c.strokeStyle = alpha(dark(wax, 0.5), 0.5); c.lineWidth = lw; c.stroke(); c.beginPath(); c.arc(x, y, r * 0.84, PI * 1.08, PI * 1.5); c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = lw * 1.6; c.stroke();
    heartPath(c, x + r * 0.05, y + r * 0.12, r * 0.86); c.fillStyle = dark(wax, 0.4); c.fill(); heartPath(c, x, y + r * 0.05, r * 0.86); c.fillStyle = light(wax, 0.34); c.fill(); });
  so('laurel', 0, 6.8, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, Lh = clamp(g.w * 0.4, v * 10, v * 20), y0 = q.yb + v * 5, y1 = q.yb + v * 2.4, col = q.tn.light ? reads(q.p.accent2, '#ffffff', 3.2) : q.p.gold, n = Math.round(Lh / (v * 2.3)), i, s;
    for (s = -1; s <= 1; s += 2) { var x0 = g.cx + s * v * 1.8, x1 = g.cx + s * Lh, mx = g.cx + s * Lh * 0.6, my = q.yb + v * 6.6;
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); lineOn(c, q, col, v * 0.3);
      for (i = 0; i < n; i++) { var t = (i + 0.8) / (n + 0.3), a1 = 1 - t, px = a1 * a1 * x0 + 2 * a1 * t * mx + t * t * x1, py = a1 * a1 * y0 + 2 * a1 * t * my + t * t * y1, an = Math.atan2(2 * a1 * (my - y0) + 2 * t * (y1 - my), 2 * a1 * (mx - x0) + 2 * t * (x1 - mx)) + (i % 2 ? 0.7 : -0.7) * s;
        c.beginPath(); c.ellipse(px + Math.cos(an) * v * 1.05, py + Math.sin(an) * v * 1.05, v * 1.25, v * 0.5, an, 0, TAU); inked(c, col, q.ol, Math.max(1, v * 0.15)); } }
    starPath(c, g.cx, y0 - v * 0.1, v * 1.5, 0); inked(c, q.p.gold, q.ol, Math.max(1, v * 0.18)); });
  so('heartsrow', 0, 6.4, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, sz = [2.3, 3, 3.9, 3, 2.3], i;
    for (i = 0; i < 5; i++) { var a = clamp((g.lt - 0.3 - i * 0.07) / 0.3, 0, 1), s = sz[i] * v * (calm(F) ? outCubic(a) : outBack(a)) * (1 + 0.16 * q.k * ((i + F.bt.n) % 2 ? 1 : 0.25)), x = g.cx + (i - 2) * v * 5.5, y = q.yb + v * 3.1; if (s < 0.5) continue;
      heartPath(c, x + v * 0.25, y + v * 0.4, s); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fill(); heartPath(c, x, y, s); c.strokeStyle = q.p.paper; c.lineWidth = v * 0.7; c.stroke(); c.fillStyle = i % 2 ? light(q.p.accent, 0.32) : q.p.accent; c.fill(); disc(c, x - s * 0.2, y - s * 0.16, s * 0.07, 'rgba(255,255,255,0.7)'); } });
  so('starsrow', 0, 6.4, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, sz = [1.5, 2.1, 2.8, 2.1, 1.5], i;
    for (i = 0; i < 5; i++) { var a = clamp((g.lt - 0.3 - i * 0.07) / 0.3, 0, 1), s = sz[i] * v * (calm(F) ? outCubic(a) : outBack(a)) * (1 + 0.1 * Math.sin(F.t * 3 + i * 1.7)), x = g.cx + (i - 2) * v * 5.6, y = q.yb + v * 3.2; if (s < 0.5) continue;
      starPath(c, x + v * 0.2, y + v * 0.35, s, 0); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fill(); starPath(c, x, y, s, Math.sin(F.t * 1.4 + i) * 0.16); inked(c, q.p.gold, dark(q.p.gold, 0.55), Math.max(1, v * 0.26)); disc(c, x - s * 0.18, y - s * 0.2, s * 0.1, 'rgba(255,255,255,0.8)'); } });
  so('swash', 0, 5.8, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, Lh = clamp(g.w * 0.3, v * 10, v * 22), yc = q.yb + v * 3.1, len = Lh * 1.3 + v * 9, pr = outCubic((g.lt - 0.35) / 0.8), s;
    for (s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(g.cx + s * v * 1.8, yc); c.bezierCurveTo(g.cx + s * Lh * 0.35, yc - v * 2.4, g.cx + s * Lh * 0.7, yc + v * 2.6, g.cx + s * Lh, yc - v * 0.1); c.bezierCurveTo(g.cx + s * (Lh + v * 2.6), yc - v * 1.9, g.cx + s * (Lh - v * 0.4), yc - v * 2.7, g.cx + s * (Lh - v * 1.3), yc - v * 0.9); c.setLineDash([len * pr, len * 3]); lineOn(c, q, q.lc, v * 0.5); c.setLineDash([]); }
    c.beginPath(); c.moveTo(g.cx, yc - v * 1.1); c.lineTo(g.cx + v * 1.1, yc); c.lineTo(g.cx, yc + v * 1.1); c.lineTo(g.cx - v * 1.1, yc); c.closePath(); lineOn(c, q, q.lc, v * 0.2); c.fillStyle = q.lc; c.fill(); });
  so('ribbonends', 0, 6.6, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, yc = q.yb + v * 3.2, Lh = clamp(g.w * 0.3, v * 10, v * 20), col = q.p.accent, dk = dark(col, 0.32), lw = Math.max(1, v * 0.22), s, x = g.cx;
    for (s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(x + s * v * 0.6, yc - v * 0.9); c.bezierCurveTo(x + s * Lh * 0.4, yc - v * 2.3, x + s * Lh * 0.7, yc + v * 0.9, x + s * Lh, yc - v * 0.7); c.lineTo(x + s * (Lh - v * 1.5), yc + v * 0.7); c.lineTo(x + s * (Lh + v * 0.3), yc + v * 2); c.bezierCurveTo(x + s * Lh * 0.7, yc + v * 3.5, x + s * Lh * 0.4, yc + v * 0.3, x + s * v * 0.6, yc + v * 1.1); c.closePath(); inked(c, col, q.ol, lw);
      c.beginPath(); c.moveTo(x + s * v * 1.4, yc + v * 0.1); c.bezierCurveTo(x + s * Lh * 0.4, yc - v * 1.1, x + s * Lh * 0.7, yc + v * 2.1, x + s * (Lh - v * 1), yc + v * 0.7); c.strokeStyle = alpha(q.p.gold, 0.9); c.lineWidth = Math.max(1, v * 0.2); c.stroke(); }
    for (s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(x, yc); c.bezierCurveTo(x + s * v * 1.5, yc - v * 3.3, x + s * v * 5.4, yc - v * 2.7, x + s * v * 4.5, yc - v * 0.1); c.bezierCurveTo(x + s * v * 4, yc + v * 1.5, x + s * v * 1.4, yc + v * 0.8, x, yc); c.closePath(); inked(c, light(col, 0.14), q.ol, lw); c.beginPath(); c.ellipse(x + s * v * 2.7, yc - v * 0.9, v * 1.1, v * 0.55, s * -0.35, 0, TAU); c.fillStyle = dk; c.fill(); }
    rr(c, x - v * 1, yc - v * 1.25, v * 2, v * 2.5, v * 0.7); inked(c, dk, q.ol, lw); });
  so('popper', 8, 0, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, p = q.p, cols = [p.accent, p.gold, p.accent2, p.paper], m, i, j, sp = calm(F) ? 0.25 : 0.55;
    for (m = 0; m < 2; m++) { var s = m ? -1 : 1, bx = g.cx - s * Math.min(g.w / 2 - v * 2.5, g.W * 0.5 - v * 5), by = g.y - v * 2.6, mx = bx + s * v * 1.2, my = by - v * 1.7, span = Math.abs(g.cx - mx) * 0.95;
      for (j = 0; j < 2; j++) { c.beginPath(); for (i = 0; i <= 20; i++) { var tt = i / 20, sx = mx + s * tt * span * (0.5 + j * 0.3), sy = my - Math.sin(tt * PI * 0.85) * v * (2.6 + j * 1.6) + Math.sin(tt * 15 + F.t * 3 + j) * v * 0.35 * tt; if (i) c.lineTo(sx, sy); else c.moveTo(sx, sy); } lineOn(c, q, j ? p.accent2 : p.gold, v * 0.3); }
      for (i = 0; i < 14; i++) { var r1 = frac(Math.sin(i * 12.9898 + m * 7.1) * 43758.5453), r2 = frac(Math.sin(i * 78.233 + m * 3.3) * 12543.117), f = frac(F.t * sp + i * 0.173 + m * 0.41), cxp = mx + s * f * span * (0.35 + 0.65 * r1), cyp = my - Math.sin(f * PI * 0.9) * v * (2 + 4 * r2) - f * v * 0.6;
        c.save(); c.globalAlpha = g.da * (1 - f * f * f); c.translate(cxp, cyp); c.rotate(F.t * (3 + r1 * 3) + i); c.fillStyle = cols[i % 4]; c.fillRect(-v * 0.45, -v * 0.26, v * 0.9, v * 0.52); c.strokeStyle = q.ol; c.lineWidth = Math.max(1, v * 0.1); c.strokeRect(-v * 0.45, -v * 0.26, v * 0.9, v * 0.52); c.restore(); }
      c.save(); c.translate(bx, by); c.rotate(s * 0.62); c.beginPath(); c.moveTo(0, v * 2.3); c.lineTo(-v * 1.7, -v * 2); c.lineTo(v * 1.7, -v * 2); c.closePath(); inked(c, m ? p.accent2 : p.accent, q.ol, Math.max(1, v * 0.22));
      c.strokeStyle = p.gold; c.lineWidth = v * 0.45; c.beginPath(); c.moveTo(-v * 0.95, -v * 0.3); c.lineTo(v * 0.95, -v * 0.3); c.moveTo(-v * 0.45, v * 1); c.lineTo(v * 0.45, v * 1); c.stroke(); c.beginPath(); c.ellipse(0, -v * 2, v * 1.7, v * 0.5, 0, 0, TAU); inked(c, light(p.gold, 0.2), q.ol, Math.max(1, v * 0.2)); c.restore(); } });
  so('sunrise', 6, 1.6, function (c, F, g, ph, q) { var v = q.v, p = q.p, rx = Math.min(g.w / 2 + v * 7, g.W * 0.5), ry = g.h + v * 5.6, n = 15, i;
    if (ph) { fillRR(c, g.cx - rx, q.yb + v * 0.5, rx * 2, Math.max(2, v * 0.45), v * 0.2, q.tn.light ? reads(p.gold, '#ffffff', 2.2) : p.gold); return; }
    c.save(); outside(c, g, v * 0.3); c.translate(g.cx, q.yb); c.scale(1, ry / rx); for (i = 0; i < n; i += 2) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, rx * (0.93 + 0.07 * Math.sin(F.t * 1.1 + i * 2)), PI + PI * i / n, PI + PI * (i + 1) / n); c.closePath(); c.fillStyle = alpha(p.gold, q.tn.light ? 0.75 : 0.5); c.fill(); } c.restore();
    c.beginPath(); c.arc(g.cx, g.y + v * 0.2, v * 3.8, PI, TAU); c.closePath(); inked(c, light(p.gold, 0.15), dark(p.gold, 0.5), Math.max(1, v * 0.25)); });
  so('postmark', 0, 8.8, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, col = q.tn.light ? reads(q.p.ink, '#ffffff', 7) : light(q.p.paper, 0.2), i, j;
    c.translate(g.cx, q.yb + v * 4.5); c.rotate(-0.07);
    for (j = 0; j < 5; j++) { c.beginPath(); for (i = 0; i <= 26; i++) { var x = -v * 16 + v * 18.4 * i / 26, y = (j - 2) * v * 1.15 + Math.sin(i * 0.8) * v * 0.38; if (i) c.lineTo(x, y); else c.moveTo(x, y); } lineOn(c, q, col, v * 0.3); }
    c.beginPath(); c.arc(v * 7, 0, v * 3.4, 0, TAU); c.fillStyle = q.tn.light ? 'rgba(255,255,255,0.6)' : 'rgba(23,15,28,0.5)'; c.fill(); lineOn(c, q, col, v * 0.4); c.beginPath(); c.arc(v * 7, 0, v * 2.5, 0, TAU); c.strokeStyle = col; c.lineWidth = Math.max(1, v * 0.2); c.stroke(); starPath(c, v * 7, 0, v * 1.3, 0.2); c.fillStyle = col; c.fill(); });
  so('signature', 0, 5.8, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, hl = clamp(g.w * 0.3, v * 9, v * 15), yc = q.yb + v * 3.2, n = 110, m = Math.floor(n * clamp((g.lt - 0.35) / 0.9, 0, 1)), i, x = 0, y = 0, b;
    if (m < 2) return; c.beginPath();   /* three loops, a run out to the right, and a sweep back under them */
    for (i = 0; i <= m; i++) { var tt = i / n;
      if (tt < 0.62) { b = tt / 0.62; x = g.cx - hl + b * hl * 1.5 + Math.sin(b * TAU * 3) * v * 1.3 * (1 - b * 0.4); y = yc + v * 0.6 - (1 - Math.cos(b * TAU * 3)) * v * 1.5 * (1 - b * 0.5); }
      else if (tt < 0.8) { b = (tt - 0.62) / 0.18; x = g.cx + hl * 0.5 + b * hl * 0.5; y = yc + v * 0.6 - b * v * 1.4; }
      else { b = (tt - 0.8) / 0.2; x = g.cx + hl - b * hl * 1.9; y = yc + v * (-0.8 + 3.4 * b - 0.9 * b * b); }
      if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    lineOn(c, q, q.lc, v * 0.42); });
  so('candleglow', 0, 9.4, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, p = q.p, x = g.cx, by = q.yb + v * 8.5, fl = 1 + 0.05 * Math.sin(F.t * 5.3) + 0.03 * Math.sin(F.t * 8.1), tip = by - v * 5.1 - v * 2.6 * fl, gr = c.createRadialGradient(x, by - v * 6, 0, x, by - v * 6, v * 6 * fl), lw = Math.max(1, v * 0.2);
    gr.addColorStop(0, alpha(p.gold, 0.5)); gr.addColorStop(0.5, alpha(p.gold, 0.18)); gr.addColorStop(1, alpha(p.gold, 0)); c.fillStyle = gr; c.beginPath(); c.arc(x, by - v * 6, v * 6 * fl, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x, by, v * 2.7, v * 0.75, 0, 0, TAU); inked(c, dark(p.gold, 0.2), q.ol, lw); rr(c, x - v * 1.05, by - v * 4.5, v * 2.1, v * 4.5, v * 0.4); inked(c, light(p.paper, 0.2), q.ol, lw); fillRR(c, x - v * 0.75, by - v * 4.2, v * 0.4, v * 3.6, v * 0.2, 'rgba(255,255,255,0.7)');
    c.strokeStyle = '#3a2a22'; c.lineWidth = Math.max(1, v * 0.22); c.beginPath(); c.moveTo(x, by - v * 4.5); c.lineTo(x, by - v * 5.2); c.stroke();
    c.beginPath(); c.moveTo(x, tip); c.bezierCurveTo(x + v * 1.15, tip + v * 1.4, x + v * 0.95, by - v * 5, x, by - v * 5); c.bezierCurveTo(x - v * 0.95, by - v * 5, x - v * 1.15, tip + v * 1.4, x, tip); c.closePath(); inked(c, p.gold, dark(p.gold, 0.45), Math.max(1, v * 0.16));
    c.beginPath(); c.ellipse(x, by - v * 5.75, v * 0.38, v * 0.7, 0, 0, TAU); c.fillStyle = '#fff8dc'; c.fill(); });
  so('doves', 6.8, 0, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, dx = clamp(g.w * 0.3, v * 8, v * 20), m;
    for (m = 0; m < 2; m++) dove(c, g.cx + (m ? 1 : -1) * dx, g.y - v * 2.9 + Math.sin(F.t * 1.2 + m * 2) * v * 0.3, v, m ? -1 : 1, Math.sin(F.t * 2.4 + m) * 0.3, q); });
  so('cardframe', 3.6, 3.6, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, col = q.tn.light ? reads(mix(q.p.ink, q.p.accent, 0.4), '#ffffff', 4.5) : q.p.gold, x = Math.max(g.x - v * 2.8, g.u * 1.5), w = g.W - x * 2, y = g.y - v * 2.8, h = g.h + v * 5.6, i;
    rr(c, x, y, w, h, v * 0.8); lineOn(c, q, col, Math.max(1.2, v * 0.36)); rr(c, x + v * 1, y + v * 1, w - v * 2, h - v * 2, v * 0.4); c.strokeStyle = col; c.lineWidth = Math.max(1, v * 0.16); c.stroke();
    for (i = 0; i < 4; i++) { var px = i % 2 ? x + w : x, py = i > 1 ? y + h : y; c.beginPath(); c.moveTo(px, py - v * 1.1); c.lineTo(px + v * 1.1, py); c.lineTo(px, py + v * 1.1); c.lineTo(px - v * 1.1, py); c.closePath(); lineOn(c, q, col, v * 0.2); c.fillStyle = col; c.fill(); } });
  so('pennants', 5.8, 0, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, p = q.p, xs = Math.max(g.x - v * 1.5, g.u), xe = g.W - xs, ys = g.y - v * 5.1, sag = v * 1.3, n = clamp(Math.round((xe - xs) / (v * 5.2)), 5, 15), cols = [p.accent, p.gold, p.accent2, p.paper], i;
    c.beginPath(); c.moveTo(xs, ys); c.quadraticCurveTo(g.cx, ys + sag * 2, xe, ys); lineOn(c, q, q.tn.light ? reads(p.ink, '#ffffff', 6) : p.paper, Math.max(1, v * 0.2));
    for (i = 0; i < n; i++) { var t = (i + 0.5) / n, px = xs + (xe - xs) * t, py = ys + sag * 4 * t * (1 - t), hw = Math.min(v * 1.9, (xe - xs) / n * 0.42), sw = Math.sin(F.t * 2 + i * 1.3) * v * 0.35; c.beginPath(); c.moveTo(px - hw, py); c.lineTo(px + hw, py); c.lineTo(px + sw, py + v * 3.3); c.closePath(); inked(c, cols[i % 4], q.ol, Math.max(1, v * 0.18)); } });
  so('fireworks', 7.4, 0, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, p = q.p, pts = [[g.x + v * 3.8, g.y - v * 3.8, 3.3, p.accent], [g.x + g.w - v * 3.8, g.y - v * 3.8, 3.3, p.accent2]], i, j, beat = calm(F) ? F.t * 0.35 : (F.bt.n + F.bt.phase) * 0.5;
    if (g.w > v * 30) pts.push([g.cx, g.y - v * 4.2, 2.9, p.gold]);
    for (j = 0; j < pts.length; j++) { var f = frac(beat + [0, 0.5, 0.25][j]), r = pts[j][2] * v * outCubic(f * 1.5), cl = q.tn.light ? dark(pts[j][3], 0.18) : light(pts[j][3], 0.25), x = pts[j][0], y = pts[j][1];
      c.globalAlpha = g.da * (1 - f * f); c.lineWidth = Math.max(1, v * 0.36);
      for (i = 0; i < 12; i++) { var an = i / 12 * TAU + j, ca = Math.cos(an), sa = Math.sin(an); c.beginPath(); c.moveTo(x + ca * r * 0.45, y + sa * r * 0.45); c.lineTo(x + ca * r, y + sa * r); lineOn(c, q, cl, Math.max(1, v * 0.36)); disc(c, x + ca * r, y + sa * r, v * 0.34, i % 2 ? cl : light(cl, 0.5)); }
      disc(c, x, y, v * 0.7 * (1 - f), '#fff8dc'); } });
  so('balloons', 8.8, 0, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, p = q.p, offs = [[-2.2, -3.5], [2, -4], [0, -6.1]], m, j, lw = Math.max(1, v * 0.2);
    for (m = 0; m < 2; m++) { var bx = m ? g.x + g.w - v * 3.2 : g.x + v * 3.2, cols = m ? [p.accent2, p.gold, p.accent] : [p.accent, p.gold, p.accent2], ty = g.y - v * 0.5;
      for (j = 2; j >= 0; j--) { var x = bx + offs[j][0] * v + Math.sin(F.t * 1.1 + j * 2 + m) * v * 0.28, y = g.y + offs[j][1] * v + Math.sin(F.t * 0.9 + j + m * 2) * v * 0.22;
        c.beginPath(); c.moveTo(x, y + v * 2.3); c.quadraticCurveTo(x + (bx - x) * 0.2, (y + v * 2.3 + ty) / 2 + v * 0.4, bx, ty); c.strokeStyle = q.tn.light ? reads(p.ink, '#ffffff', 5) : alpha(p.paper, 0.85); c.lineWidth = Math.max(1, v * 0.14); c.stroke();
        c.beginPath(); c.moveTo(x, y + v * 2.1); c.lineTo(x - v * 0.4, y + v * 2.75); c.lineTo(x + v * 0.4, y + v * 2.75); c.closePath(); inked(c, cols[j], q.ol, lw); c.beginPath(); c.ellipse(x, y, v * 1.8, v * 2.25, 0, 0, TAU); inked(c, cols[j], q.ol, lw); c.beginPath(); c.ellipse(x - v * 0.65, y - v * 0.85, v * 0.32, v * 0.62, 0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fill(); } } });
  so('posy', 0, 9.8, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, p = q.p, x = g.cx, offs = [-4.6, 4.6, -2.3, 2.3, 0], tops = [3.7, 3.7, 2.7, 2.7, 2.1], cols = [p.accent, p.accent, p.paper, p.gold, light(p.accent, 0.4)], grn = mix(p.accent2, '#2f7d55', 0.55), ty = q.yb + v * 6.9, lw = Math.max(1, v * 0.16), i, k;
    c.strokeStyle = dark(grn, 0.15); c.lineWidth = v * 0.34; for (i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x + offs[i] * v, q.yb + tops[i] * v); c.quadraticCurveTo(x + offs[i] * v * 0.5, ty - v * 1.5, x, ty); c.lineTo(x - offs[i] * v * 0.3, q.yb + v * 9.3); c.stroke(); }
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.ellipse(x + i * v * 3, q.yb + v * 5.7, v * 1.7, v * 0.62, i * -0.75, 0, TAU); inked(c, grn, q.ol, lw); }
    for (i = 0; i < 5; i++) { var fx = x + offs[i] * v, fy = q.yb + tops[i] * v, pr = v * (i === 4 ? 1.05 : 0.9); for (k = 0; k < 5; k++) { var an = k / 5 * TAU + i * 0.7 + Math.sin(F.t * 0.8 + i) * 0.08; c.beginPath(); c.arc(fx + Math.cos(an) * pr * 0.95, fy + Math.sin(an) * pr * 0.95, pr * 0.74, 0, TAU); inked(c, cols[i], q.ol, lw); } disc(c, fx, fy, pr * 0.62, cols[i] === p.gold ? p.accent : p.gold); }
    rr(c, x - v * 1, ty - v * 0.55, v * 2, v * 1.1, v * 0.35); inked(c, p.accent, q.ol, lw); });
  so('paws', 0, 6.4, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, col = q.tn.light ? reads(q.p.accent, '#ffffff', 3.6) : q.p.paper, edge = q.tn.light ? 'rgba(255,255,255,0.85)' : 'rgba(23,15,28,0.6)', toes = [[-1.15, -0.75], [-0.42, -1.4], [0.42, -1.4], [1.15, -0.75]], i, k, lw = v * 0.5;
    for (i = 0; i < 5; i++) { var a = clamp((g.lt - 0.35 - i * 0.16) / 0.25, 0, 1); if (a <= 0) continue; c.save(); c.globalAlpha = g.da * a; c.translate(g.cx + (i - 2) * v * 5.6, q.yb + v * (i % 2 ? 4.1 : 2.7)); c.rotate(0.9 + (i % 2 ? 0.22 : -0.22));
      c.beginPath(); c.ellipse(0, v * 0.45, v * 1.15, v * 0.95, 0, 0, TAU); c.strokeStyle = edge; c.lineWidth = lw; c.stroke(); c.fillStyle = col; c.fill(); for (k = 0; k < 4; k++) { c.beginPath(); c.arc(toes[k][0] * v, toes[k][1] * v, v * 0.46, 0, TAU); c.stroke(); c.fill(); } c.restore(); } });
  so('trophy', 0, 9.8, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, p = q.p, x = g.cx, top = q.yb + v * 1.5, gold = p.gold, dk = dark(gold, 0.5), lw = Math.max(1, v * 0.24), s, j;
    for (s = -1; s <= 1; s += 2) { c.beginPath(); c.arc(x + s * v * 2.6, top + v * 1.8, v * 1.25, 0, TAU); c.strokeStyle = dk; c.lineWidth = v * 1; c.stroke(); c.strokeStyle = gold; c.lineWidth = v * 0.52; c.stroke(); }
    rr(c, x - v * 2.5, top + v * 6.3, v * 5, v * 1.3, v * 0.3); inked(c, mix(dk, '#2a2433', 0.4), q.ol, lw); rr(c, x - v * 1.6, top + v * 5.6, v * 3.2, v * 0.9, v * 0.25); inked(c, gold, dk, lw); rr(c, x - v * 0.5, top + v * 4.4, v * 1, v * 1.4, 0); inked(c, gold, dk, lw);
    c.beginPath(); c.moveTo(x - v * 2.7, top); c.lineTo(x + v * 2.7, top); c.bezierCurveTo(x + v * 2.7, top + v * 3.4, x + v * 1.3, top + v * 4.6, x, top + v * 4.7); c.bezierCurveTo(x - v * 1.3, top + v * 4.6, x - v * 2.7, top + v * 3.4, x - v * 2.7, top); c.closePath(); inked(c, gold, dk, lw);
    rr(c, x - v * 3, top - v * 0.4, v * 6, v * 0.85, v * 0.4); inked(c, light(gold, 0.3), dk, lw); c.beginPath(); c.moveTo(x - v * 1.8, top + v * 0.9); c.quadraticCurveTo(x - v * 1.7, top + v * 2.6, x - v * 0.8, top + v * 3.6); c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = v * 0.42; c.stroke();
    starPath(c, x + v * 0.35, top + v * 2.15, v * 1.05, 0); c.fillStyle = light(p.paper, 0.3); c.fill();
    for (j = 0; j < 3; j++) { var sx = x + [-5, 5.2, -4.4][j] * v, sy = top + [0.6, 1.2, 4.4][j] * v, r = v * 0.95 * (0.55 + 0.45 * Math.sin(F.t * 3 + j * 2.1)), i; if (r < v * 0.2) continue; c.beginPath(); for (i = 0; i < 8; i++) { var an = i * PI / 4, rad = i % 2 ? r * 0.3 : r; c.lineTo(sx + Math.cos(an) * rad, sy + Math.sin(an) * rad); } c.closePath(); inked(c, light(gold, 0.6), dk, Math.max(1, v * 0.14)); } });
  so('crescent', 7.4, 0, function (c, F, g, ph, q) { if (!ph) return; var v = q.v, p = q.p, x = g.cx, y = g.y - v * 3.8, r = v * 2.8, d = r * 0.5, r2 = r * 0.86, ix = (d * d + r * r - r2 * r2) / (2 * d), iy = Math.sqrt(Math.max(0, r * r - ix * ix)), a1 = Math.atan2(iy, ix), a2 = Math.atan2(iy, ix - d), dk = dark(p.gold, 0.5), st = [[-9, -1.9, 1.15], [-5.6, -5, 0.8], [5.8, -4.8, 0.9], [9.6, -2.2, 1.2], [-13.6, -4.2, 0.7], [13.8, -4.6, 0.7]], j;
    disc(c, x, y, r * 1.9, alpha(p.gold, 0.16));
    c.save(); c.translate(x, y); c.rotate(-0.5); c.beginPath(); c.arc(0, 0, r, a1, TAU - a1, false); c.arc(d, 0, r2, TAU - a2, a2, true); c.closePath(); inked(c, light(p.gold, 0.25), dk, Math.max(1, v * 0.24)); c.restore();
    for (j = 0; j < st.length; j++) { starPath(c, x + st[j][0] * v, g.y + st[j][1] * v, st[j][2] * v * (0.78 + 0.22 * Math.sin(F.t * 2.2 + j * 1.9)), j); inked(c, light(p.gold, 0.35), dk, Math.max(1, v * 0.15)); } });
  so('spotlight', 0, 0, function (c, F, g, ph, q) { if (ph) return; var v = q.v, p = q.p, col = q.tn.light ? p.gold : '#fff3c4', al = q.tn.light ? 0.42 : 0.28, sy = Math.max(v * 1.6, g.y - v * 9), ty = q.yb + v * 1.5, half = Math.max(g.w * 0.24, v * 7), m;
    for (m = 0; m < 2; m++) { var s = m ? 1 : -1, sx = g.cx + s * Math.min(g.w * 0.5 + v * 2, g.W * 0.45), tx = g.cx - s * g.w * 0.13 + Math.sin(F.t * 0.7 + m * 2) * v * (calm(F) ? 0.6 : 2), gr = c.createLinearGradient(sx, sy, tx, ty);
      gr.addColorStop(0, alpha(col, al * 1.5)); gr.addColorStop(1, alpha(col, al * 0.45)); c.save(); outside(c, g, v * 0.3); c.fillStyle = gr; c.beginPath(); c.moveTo(sx - v * 0.8, sy); c.lineTo(sx + v * 0.8, sy); c.lineTo(tx + half, ty); c.lineTo(tx - half, ty); c.closePath(); c.fill(); c.restore();
      c.save(); c.translate(sx, sy); c.rotate(Math.atan2(ty - sy, tx - sx) - PI / 2); rr(c, -v * 1.4, -v * 2.4, v * 2.8, v * 2.6, v * 0.6); inked(c, '#2a2433', alpha(p.gold, 0.9), Math.max(1, v * 0.25)); fillRR(c, -v * 1.7, -v * 0.2, v * 3.4, v * 0.7, v * 0.3, light(p.gold, 0.3)); c.restore(); }
    c.fillStyle = alpha(col, al * 0.8); c.beginPath(); c.ellipse(g.cx, ty, g.w * 0.44, v * 1.1, 0, 0, TAU); c.fill(); });

  function sceneSignoff(F, Lc) {
    var card = F.card, L = F.L, S = L.stage, sc = Lc.sc, greeting = str(card.greeting) || str(card.title) || 'With love', sign = str(card.signoff) || (str(card.from) ? 'from ' + str(card.from) : '');
    var by = topText(F, Lc, greeting, sign, { what: 'greeting', whatSmall: 'signoff', smallLines: 2, smallPx: L.tall ? 0.06 : 0.042, bigPx: L.tall ? 0.105 : 0.066, deco: SO[F.tp.look.signoff] || null });
    var R = { x: S.x, y: by + L.u * 2, w: S.w, h: S.y + S.h - by - L.u * 2 };
    drawSky(F, Lc, R);
    if (sc.photos.length) { if (L.mode !== 'cast-low' && sc.photos.length > 1) R.h -= L.castH * (L.tall ? 0.5 : 0.2); drawFrames(F, Lc, R, sc, { album: true }); flank(F, Lc, 'wave', sc.photos.length > 1); } else tableau(F, Lc, R, 'wave', 'hero');
  }
  function drawScene(F, sc, start, live) {
    var Lc = { sc: sc, lt: Math.max(0, F.t - start), u: clamp((F.t - sc.t0) / Math.max(0.01, sc.t1 - sc.t0), 0, 1), faces: [], live: live };
    if (sc.kind === 'title') sceneTitle(F, Lc); else if (sc.kind === 'lyric') sceneLyric(F, Lc); else if (sc.kind === 'signoff') sceneSignoff(F, Lc); else scenePhoto(F, Lc);
  }

  /* ---------- transitions: they start a breath before the beat and land on it ---------- */
  var TRANSITIONS = ['cut', 'flash', 'fade', 'slide', 'rise', 'drop', 'wipe', 'iris', 'star', 'heart', 'diamond', 'curtain', 'blinds', 'pixel', 'clock', 'page'];
  var LEAD = 0.1, TDUR = 0.46;
  function clipFor(ctx, kind, p, W, H, n) {
    var hyp = Math.sqrt(W * W + H * H), i, j, e = inOut(p);
    ctx.beginPath();
    if (kind === 'wipe') { if (n % 2) ctx.rect(W * (1 - e), 0, W * e, H); else ctx.rect(0, 0, W * e, H); }
    else if (kind === 'curtain') ctx.rect(W / 2 - W / 2 * e, 0, W * e, H);
    else if (kind === 'blinds') { var nb = 7; for (i = 0; i < nb; i++) ctx.rect(0, H * i / nb, W, H / nb * e + 0.5); }
    else if (kind === 'pixel') { var cols = 8, cell = W / cols, rows = Math.ceil(H / cell), R0 = Art.rnd('px' + n); for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) if (R0() < p * 1.15 - 0.05) ctx.rect(i * cell - 0.5, j * cell - 0.5, cell + 1, cell + 1); }
    else if (kind === 'clock') { ctx.moveTo(W / 2, H / 2); ctx.arc(W / 2, H / 2, hyp, -PI / 2, -PI / 2 + TAU * e); ctx.closePath(); }
    else if (kind === 'page') { var s = H * 0.22, ex = -s + (W + s * 2) * e; ctx.moveTo(0, 0); ctx.lineTo(ex + s, 0); ctx.lineTo(ex - s, H); ctx.lineTo(0, H); ctx.closePath(); }
    else if (kind === 'diamond') { var d = (W + H) * 0.52 * e; ctx.moveTo(W / 2, H / 2 - d); ctx.lineTo(W / 2 + d, H / 2); ctx.lineTo(W / 2, H / 2 + d); ctx.lineTo(W / 2 - d, H / 2); ctx.closePath(); }
    else if (kind === 'star') { var ro = hyp * 1.35 * e, ri = ro * 0.46; for (i = 0; i < 10; i++) { var an = -PI / 2 + i * PI / 5 + e * 0.6, r = i % 2 ? ri : ro; if (i) ctx.lineTo(W / 2 + Math.cos(an) * r, H / 2 + Math.sin(an) * r); else ctx.moveTo(W / 2 + Math.cos(an) * r, H / 2 + Math.sin(an) * r); } ctx.closePath(); }
    else if (kind === 'heart') { var hs = hyp * 2.3 * e, x = W / 2, y = H / 2 - hs * 0.06, w = hs / 2, t = y - hs * 0.22; ctx.moveTo(x, y + hs * 0.48); ctx.bezierCurveTo(x - w * 2.1, y - hs * 0.12, x - w * 0.9, t - hs * 0.52, x, t); ctx.bezierCurveTo(x + w * 0.9, t - hs * 0.52, x + w * 2.1, y - hs * 0.12, x, y + hs * 0.48); ctx.closePath(); }
    else ctx.arc(W / 2, H / 2, hyp * 0.52 * e, 0, TAU);
    ctx.clip();
  }
  function backLayer(F) {
    var tp = F.tp, ctx = F.ctx, W = F.W, H = F.H, extra = num(F.env.interact && F.env.interact.snow, 0);
    if (F.hitOnly) return;
    Art.backdrop(tp.backdrop, ctx, W, H, F.t, F.pal, { beat: F.bt.phase, n: F.bt.n, seed: tp.id });
    if (tp.look.dim) { ctx.fillStyle = alpha(tp.look.dimColor || F.pal.bg, tp.look.dim); ctx.fillRect(0, 0, W, H); }
    if (tp.particles) Art.particles(tp.particles, ctx, W, H, F.t, F.pal, { amount: clamp((tp.particleAmount == null ? 1 : tp.particleAmount) * (F.env.quality === 'preview' ? 0.7 : 1) + extra * 0.6, 0, 3), seed: tp.id, beat: F.bt.phase });
  }
  function drawScenes(F) {
    var sc = F.pl.scenes, ctx = F.ctx, W = F.W, H = F.H, t = F.t, i, cur = 0, kind = F.tp.look.transition || 'cut';
    function st(k) { return k === 0 ? 0 : sc[k].t0 - LEAD; }
    for (i = 0; i < sc.length; i++) if (st(i) <= t) cur = i;
    var p = (t - st(cur)) / TDUR;
    backLayer(F);
    if (cur === 0 || p >= 1 || kind === 'cut') { drawScene(F, sc[cur], st(cur), true); return; }
    var old = sc[cur - 1], os = st(cur - 1), nw = sc[cur], ns = st(cur), e = inOut(p), dir = cur % 2 ? 1 : -1;
    if (kind === 'flash') { drawScene(F, nw, ns, true); if (!F.hitOnly) { ctx.fillStyle = alpha(F.pal.snow, Math.pow(1 - p, 2) * 0.85); ctx.fillRect(0, 0, W, H); } }
    else if (kind === 'fade') { if (p < 0.5) drawScene(F, old, os, false); else drawScene(F, nw, ns, true); if (!F.hitOnly) { ctx.fillStyle = alpha(dark(F.pal.bg, 0.35), 1 - Math.abs(p * 2 - 1)); ctx.fillRect(0, 0, W, H); } }
    else if (kind === 'slide') { ctx.save(); ctx.translate(-dir * W * e, 0); drawScene(F, old, os, false); ctx.restore(); ctx.save(); ctx.translate(dir * W * (1 - e), 0); drawScene(F, nw, ns, true); ctx.restore(); }
    else if (kind === 'rise') { ctx.save(); ctx.translate(0, -H * e); drawScene(F, old, os, false); ctx.restore(); ctx.save(); ctx.translate(0, H * (1 - e)); drawScene(F, nw, ns, true); ctx.restore(); }
    else if (kind === 'drop') { drawScene(F, old, os, false); ctx.save(); ctx.translate(0, -H * (1 - outBounce(p))); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); backLayer(F); drawScene(F, nw, ns, true); ctx.restore(); }
    else {
      drawScene(F, old, os, false); ctx.save(); clipFor(ctx, kind, p, W, H, cur); backLayer(F); drawScene(F, nw, ns, true); ctx.restore();
      if (kind === 'page' && !F.hitOnly) { var s = H * 0.22, ex = -s + (W + s * 2) * e, g = ctx.createLinearGradient(ex, 0, ex + W * 0.07, 0); g.addColorStop(0, 'rgba(0,0,0,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ex + s, 0); ctx.lineTo(ex + s + W * 0.07, 0); ctx.lineTo(ex - s + W * 0.07, H); ctx.lineTo(ex - s, H); ctx.closePath(); ctx.fill(); }
    }
  }

  /* ---------- karaoke: the band at the bottom, one line at a time, a sweep across the line being sung ---------- */
  var KS = {};
  function bulbs(ctx, b, u, F, cols) { var n = Math.max(8, Math.round(b.w / (u * 5.5))), i; for (i = 0; i < n; i++) { var x = b.x + b.w * (i + 0.5) / n, on = (i + F.bt.n) % 2 === 0, col = cols[i % cols.length]; for (var m = 0; m < 2; m++) { var y = m ? b.y + b.h : b.y; if (on) disc(ctx, x, y, u * 1.5, alpha(col, 0.3)); disc(ctx, x, y, u * 0.8, on ? col : dark(col, 0.45)); } } }
  KS.ribbon = function (F, b, u) { var c = F.ctx, p = F.pal, dk = dark(p.accent, 0.32), m, tl = u * 4.2, y = b.y + b.h * 0.08, h = b.h * 0.84;
    for (m = 0; m < 2; m++) { var s = m ? 1 : -1, ex = m ? b.x + b.w - tl : b.x + tl; c.beginPath(); c.moveTo(ex - s * u * 2, y + u * 2.2); c.lineTo(ex + s * tl, y + u * 2.2); c.lineTo(ex + s * (tl - u * 2.4), y + u * 2.2 + h / 2); c.lineTo(ex + s * tl, y + u * 2.2 + h); c.lineTo(ex - s * u * 2, y + u * 2.2 + h); c.closePath(); c.fillStyle = dk; c.fill(); }
    fillRR(c, b.x + tl, y, b.w - tl * 2, h, u * 1, p.accent); c.fillStyle = alpha(p.gold, 0.9); c.fillRect(b.x + tl, y + u * 1, b.w - tl * 2, Math.max(1, u * 0.3)); c.fillRect(b.x + tl, y + h - u * 1.3, b.w - tl * 2, Math.max(1, u * 0.3));
    return { base: alpha(p.paper, 0.5), hi: '#ffffff', next: alpha(p.paper, 0.5), ix: 0.09, iy: 0.16, ball: p.gold }; };
  KS.band = function (F, b, u) { var c = F.ctx, p = F.pal; c.fillStyle = alpha(dark(p.bg, 0.6), 0.72); c.fillRect(0, b.y, F.W, b.h); c.fillStyle = p.gold; c.fillRect(0, b.y, F.W, Math.max(1, u * 0.35)); c.fillRect(0, b.y + b.h - Math.max(1, u * 0.35), F.W, Math.max(1, u * 0.35));
    return { base: 'rgba(255,255,255,0.45)', hi: p.gold, next: 'rgba(255,255,255,0.4)', ix: 0.04, iy: 0.12 }; };
  KS.chalk = function (F, b, u) { var c = F.ctx, p = F.pal; fillRR(c, b.x, b.y, b.w, b.h, u * 1.2, '#8a5a34'); fillRR(c, b.x + u * 1.1, b.y + u * 1.1, b.w - u * 2.2, b.h - u * 2.2, u * 0.6, '#2f5d4a'); c.fillStyle = 'rgba(255,255,255,0.05)'; for (var i = 0; i < 5; i++) c.fillRect(b.x + u * 3 + i * b.w * 0.19, b.y + u * 2 + (i % 2) * b.h * 0.3, b.w * 0.14, u * 1.6);
    fillRR(c, b.x + b.w * 0.82, b.y + b.h - u * 1.6, u * 5, u * 1, u * 0.4, '#ffffff'); return { base: 'rgba(255,255,255,0.38)', hi: '#ffffff', next: 'rgba(255,255,255,0.35)', ix: 0.05, iy: 0.14 }; };
  KS.neon = function (F, b, u) { var c = F.ctx, p = F.pal, k = Math.exp(-5 * F.bt.phase), g; fillRR(c, b.x, b.y, b.w, b.h, b.h * 0.24, alpha('#0c0716', 0.86)); for (g = 0; g < 3; g++) strokeRR(c, b.x + u, b.y + u, b.w - u * 2, b.h - u * 2, b.h * 0.2, alpha(p.accent, [0.16, 0.3, 0.95][g] * (0.75 + 0.25 * k)), u * [2.6, 1.5, 0.5][g]);
    return { base: alpha(p.accent2, 0.5), hi: '#ffffff', hiGlow: p.accent, next: alpha(p.accent2, 0.45), ix: 0.06, iy: 0.15 }; };
  KS.tape = function (F, b, u) { var c = F.ctx, p = F.pal, i, n = 14; c.save(); c.translate(b.x + b.w / 2, b.y + b.h / 2); c.rotate(-0.008); c.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(b.x + u * 0.6, b.y + u * 0.9, b.w, b.h); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x + b.w, b.y); for (i = 0; i <= n; i++) c.lineTo(b.x + b.w - (i % 2) * u * 1.1, b.y + b.h * i / n); c.lineTo(b.x, b.y + b.h); for (i = n; i >= 0; i--) c.lineTo(b.x + (i % 2) * u * 1.1, b.y + b.h * i / n); c.closePath(); c.fillStyle = p.paper; c.fill();
    c.fillStyle = alpha(p.accent, 0.7); c.fillRect(b.x + b.w * 0.08, b.y - u * 1.2, u * 9, u * 2.6); c.fillStyle = alpha(p.accent2, 0.7); c.fillRect(b.x + b.w * 0.92 - u * 9, b.y - u * 1.2, u * 9, u * 2.6); c.restore();
    return { base: alpha(p.ink, 0.36), hi: p.ink, next: alpha(p.ink, 0.36), under: p.accent, ix: 0.06, iy: 0.15 }; };
  KS.scroll = function (F, b, u) { var c = F.ctx, pc = '#f3e3bf', r = b.h * 0.13, m; fillRR(c, b.x + r, b.y + u * 0.8, b.w - r * 2, b.h - u * 1.6, u * 0.5, pc); c.fillStyle = 'rgba(120,80,30,0.14)'; c.fillRect(b.x + r, b.y + u * 0.8, b.w - r * 2, u * 1.2); c.fillRect(b.x + r, b.y + b.h - u * 2, b.w - r * 2, u * 1.2);
    for (m = 0; m < 2; m++) { var x = m ? b.x + b.w - r * 2 : b.x; fillRR(c, x, b.y - u * 0.6, r * 2, b.h + u * 1.2, r, '#e2cc9c'); fillRR(c, x + r * 0.5, b.y - u * 0.6, r * 0.5, b.h + u * 1.2, r * 0.25, 'rgba(255,255,255,0.35)'); disc(c, x + r, b.y - u * 0.6, r * 0.7, F.pal.gold); disc(c, x + r, b.y + b.h + u * 0.6, r * 0.7, F.pal.gold); }
    return { base: 'rgba(90,60,30,0.4)', hi: '#3a2413', next: 'rgba(90,60,30,0.42)', ix: 0.1, iy: 0.14 }; };
  KS.pill = function (F, b, u) { var c = F.ctx, p = F.pal; fillRR(c, b.x + u * 0.7, b.y + u * 1.1, b.w, b.h, b.h * 0.3, 'rgba(0,0,0,0.2)'); fillRR(c, b.x, b.y, b.w, b.h, b.h * 0.3, '#ffffff'); strokeRR(c, b.x + u * 0.7, b.y + u * 0.7, b.w - u * 1.4, b.h - u * 1.4, b.h * 0.26, p.accent, u * 0.7);
    return { base: alpha(p.ink, 0.3), hi: p.accent, next: alpha(p.ink, 0.32), ix: 0.07, iy: 0.15, ball: p.accent2 }; };
  KS.ticket = function (F, b, u) { var c = F.ctx, p = F.pal, r = b.h * 0.16; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x + b.w, b.y); c.lineTo(b.x + b.w, b.y + b.h / 2 - r); c.arc(b.x + b.w, b.y + b.h / 2, r, -PI / 2, PI / 2, true); c.lineTo(b.x + b.w, b.y + b.h); c.lineTo(b.x, b.y + b.h); c.lineTo(b.x, b.y + b.h / 2 + r); c.arc(b.x, b.y + b.h / 2, r, PI / 2, -PI / 2, true); c.closePath(); c.fillStyle = p.gold; c.fill();
    strokeRR(c, b.x + r * 1.3, b.y + u * 1.2, b.w - r * 2.6, b.h - u * 2.4, u * 0.8, alpha(p.ink, 0.5), Math.max(1, u * 0.3)); for (var i = 0; i < 2; i++) { c.fillStyle = p.accent; c.save(); c.translate(i ? b.x + b.w - r * 2.4 : b.x + r * 2.4, b.y + b.h / 2); c.beginPath(); for (var k = 0; k < 10; k++) { var a = -PI / 2 + k * PI / 5, rad = k % 2 ? u * 0.8 : u * 1.8; c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } c.closePath(); c.fill(); c.restore(); }
    return { base: alpha(p.ink, 0.38), hi: p.ink, next: alpha(p.ink, 0.4), under: p.accent, ix: 0.13, iy: 0.14 }; };
  KS.snowbank = function (F, b, u) { var c = F.ctx, p = F.pal, n = 7, i; c.fillStyle = 'rgba(40,60,110,0.18)'; fillRR(c, b.x + u * 0.5, b.y + b.h * 0.2 + u, b.w, b.h * 0.8, b.h * 0.22, 'rgba(40,60,110,0.18)'); c.fillStyle = '#ffffff'; fillRR(c, b.x, b.y + b.h * 0.2, b.w, b.h * 0.8, b.h * 0.22, '#ffffff'); for (i = 0; i < n; i++) { c.beginPath(); c.ellipse(b.x + b.w * (i + 0.5) / n, b.y + b.h * 0.24, b.w / n * 0.62, b.h * (0.2 + 0.05 * Math.sin(i * 2.4)), 0, 0, TAU); c.fill(); }
    return { base: alpha('#30456e', 0.34), hi: p.accent, next: alpha('#30456e', 0.4), ix: 0.07, iy: 0.2, top: 0.06, ball: p.accent2 }; };
  KS.marquee = function (F, b, u) { var c = F.ctx, p = F.pal; fillRR(c, b.x, b.y, b.w, b.h, u * 1.6, dark(p.accent, 0.55)); strokeRR(c, b.x, b.y, b.w, b.h, u * 1.6, p.gold, u * 0.6); fillRR(c, b.x + u * 1.6, b.y + u * 1.6, b.w - u * 3.2, b.h - u * 3.2, u * 0.8, alpha('#000000', 0.25)); bulbs(c, { x: b.x + u * 2, y: b.y + u * 0.2, w: b.w - u * 4, h: b.h - u * 0.4 }, u, F, ['#ffe9a0']);
    return { base: 'rgba(255,255,255,0.4)', hi: '#ffe9a0', next: 'rgba(255,255,255,0.4)', ix: 0.06, iy: 0.17 }; };
  KS.pixel = function (F, b, u) { var c = F.ctx, p = F.pal, s = Math.max(1, Math.round(u * 0.9)); c.fillStyle = '#ffffff'; c.fillRect(b.x + s, b.y, b.w - s * 2, b.h); c.fillRect(b.x, b.y + s, b.w, b.h - s * 2); c.fillStyle = '#10131f'; c.fillRect(b.x + s * 2, b.y + s, b.w - s * 4, b.h - s * 2); c.fillRect(b.x + s, b.y + s * 2, b.w - s * 2, b.h - s * 4);
    if (frac(F.t * 1.6) < 0.5) { c.fillStyle = p.gold; c.fillRect(b.x + b.w - s * 6, b.y + b.h - s * 5, s * 2, s * 2); } return { base: 'rgba(255,255,255,0.38)', hi: p.gold, next: 'rgba(255,255,255,0.35)', ix: 0.06, iy: 0.16, scale: 0.8 }; };
  KS.label = function (F, b, u) { var c = F.ctx, p = F.pal, kc = '#c9a26b'; fillRR(c, b.x + u * 0.6, b.y + u * 0.9, b.w, b.h, u * 1.4, 'rgba(0,0,0,0.2)'); fillRR(c, b.x, b.y, b.w, b.h, u * 1.4, kc); c.setLineDash([u * 1.6, u * 1.2]); strokeRR(c, b.x + u * 1.3, b.y + u * 1.3, b.w - u * 2.6, b.h - u * 2.6, u * 0.8, alpha('#ffffff', 0.75), Math.max(1, u * 0.35)); c.setLineDash([]); disc(c, b.x + u * 3.6, b.y + b.h / 2, u * 1.3, dark(kc, 0.45)); disc(c, b.x + b.w - u * 3.6, b.y + b.h / 2, u * 1.3, dark(kc, 0.45));
    return { base: alpha('#3b2a1a', 0.42), hi: '#3b2a1a', next: alpha('#3b2a1a', 0.45), under: p.accent, ix: 0.09, iy: 0.15 }; };
  KS.glass = function (F, b, u) { var c = F.ctx, p = F.pal; fillRR(c, b.x, b.y, b.w, b.h, u * 3, 'rgba(255,255,255,0.8)'); strokeRR(c, b.x, b.y, b.w, b.h, u * 3, 'rgba(255,255,255,0.95)', Math.max(1, u * 0.4)); fillRR(c, b.x + u * 2, b.y + u * 1, b.w - u * 4, u * 0.6, u * 0.3, 'rgba(255,255,255,0.9)');
    return { base: alpha(p.ink, 0.32), hi: p.ink, next: alpha(p.ink, 0.36), under: p.accent, ix: 0.06, iy: 0.14 }; };
  KS.lowerthird = function (F, b, u) { var c = F.ctx, p = F.pal, bw = b.h * 0.5; fillRR(c, b.x + u * 0.5, b.y + u * 0.8, b.w, b.h, u * 0.8, 'rgba(0,0,0,0.18)'); fillRR(c, b.x, b.y, b.w, b.h, u * 0.8, '#ffffff'); c.fillStyle = p.accent; c.fillRect(b.x, b.y, bw, b.h); c.fillStyle = p.accent2; c.fillRect(b.x + bw, b.y, u * 0.9, b.h);
    var nx = b.x + bw / 2, ny = b.y + b.h / 2 + u * 1.2, k = Math.exp(-5 * F.bt.phase); c.fillStyle = '#ffffff'; c.strokeStyle = '#ffffff'; c.lineWidth = u * 0.7; c.beginPath(); c.ellipse(nx - u * 1, ny + u * 1.4, u * 1.6, u * 1.2, -0.4, 0, TAU); c.fill(); c.beginPath(); c.moveTo(nx + u * 0.4, ny + u * 1.2); c.lineTo(nx + u * 0.4, ny - u * (3.6 + k)); c.lineTo(nx + u * 3, ny - u * (2.8 + k)); c.stroke();
    return { base: alpha(p.ink, 0.32), hi: p.ink, next: alpha(p.ink, 0.38), under: p.accent, ix: 0.04, iy: 0.14, left: bw + u * 1.5 }; };
  KS.banner = function (F, b, u) { var c = F.ctx, p = F.pal, m; fillRR(c, b.x, b.y, b.w, b.h, u * 0.8, alpha(dark(p.bg, 0.45), 0.92)); strokeRR(c, b.x + u * 0.8, b.y + u * 0.8, b.w - u * 1.6, b.h - u * 1.6, u * 0.4, p.gold, Math.max(1, u * 0.35)); strokeRR(c, b.x + u * 1.7, b.y + u * 1.7, b.w - u * 3.4, b.h - u * 3.4, u * 0.2, alpha(p.gold, 0.5), Math.max(1, u * 0.18));
    for (m = 0; m < 2; m++) { var x = m ? b.x + b.w : b.x, y = b.y + b.h / 2; c.beginPath(); c.moveTo(x, y - u * 1.8); c.lineTo(x + u * 1.8, y); c.lineTo(x, y + u * 1.8); c.lineTo(x - u * 1.8, y); c.closePath(); c.fillStyle = p.gold; c.fill(); }
    return { base: alpha(p.paper, 0.42), hi: p.gold, next: alpha(p.paper, 0.4), ix: 0.06, iy: 0.15 }; };
  KS.cloud = function (F, b, u) { var c = F.ctx, p = F.pal, n = 6, i, m; for (m = 0; m < 2; m++) { c.fillStyle = m ? '#ffffff' : 'rgba(120,140,190,0.22)'; var oy = m ? 0 : u * 1.1; fillRR(c, b.x + b.w * 0.03, b.y + b.h * 0.2 + oy, b.w * 0.94, b.h * 0.72, b.h * 0.34, c.fillStyle); for (i = 0; i < n; i++) { c.beginPath(); c.ellipse(b.x + b.w * (0.1 + 0.8 * i / (n - 1)), b.y + b.h * (0.3 + 0.04 * (i % 2)) + oy, b.w * 0.105, b.h * (0.26 + 0.05 * ((i * 7) % 3)), 0, 0, TAU); c.fill(); } }
    return { base: alpha('#5a6b96', 0.4), hi: p.accent, next: alpha('#5a6b96', 0.45), ix: 0.09, iy: 0.22, top: 0.05, ball: p.gold }; };
  KS.heart = function (F, b, u) { var c = F.ctx, p = F.pal, m, k = Math.exp(-5 * F.bt.phase); fillRR(c, b.x + u * 0.5, b.y + u * 0.9, b.w, b.h, b.h * 0.22, 'rgba(90,20,50,0.2)'); fillRR(c, b.x, b.y, b.w, b.h, b.h * 0.22, light(p.accent, 0.86)); strokeRR(c, b.x + u * 0.9, b.y + u * 0.9, b.w - u * 1.8, b.h - u * 1.8, b.h * 0.18, alpha(p.accent, 0.55), Math.max(1, u * 0.35));
    for (m = 0; m < 2; m++) { var s = u * 4.4 * (1 + 0.14 * k), x = m ? b.x + b.w - u * 1 : b.x + u * 1, y = b.y + u * 1.5, w = s / 2, t = y - s * 0.22; c.beginPath(); c.moveTo(x, y + s * 0.48); c.bezierCurveTo(x - w * 2.1, y - s * 0.12, x - w * 0.9, t - s * 0.52, x, t); c.bezierCurveTo(x + w * 0.9, t - s * 0.52, x + w * 2.1, y - s * 0.12, x, y + s * 0.48); c.closePath(); c.fillStyle = p.accent; c.fill(); }
    return { base: alpha(dark(p.accent, 0.5), 0.36), hi: dark(p.accent, 0.3), next: alpha(dark(p.accent, 0.5), 0.4), ix: 0.07, iy: 0.15 }; };
  KS.vhs = function (F, b, u) { var c = F.ctx, p = F.pal, i; c.fillStyle = 'rgba(8,4,20,0.78)'; c.fillRect(b.x, b.y, b.w, b.h); c.fillStyle = 'rgba(255,255,255,0.05)'; for (i = 0; i < b.h; i += u * 1.2) c.fillRect(b.x, b.y + i, b.w, u * 0.5); c.fillStyle = p.accent; c.fillRect(b.x, b.y, b.w, u * 0.5); c.fillStyle = p.accent2; c.fillRect(b.x, b.y + b.h - u * 0.5, b.w, u * 0.5);
    if (frac(F.t) < 0.6) disc(c, b.x + u * 2.6, b.y + u * 2.8, u * 0.9, '#ff3b4e'); return { base: alpha(p.accent2, 0.5), hi: '#ffffff', hiShadow: p.accent, next: alpha(p.accent2, 0.5), ix: 0.07, iy: 0.16 }; };
  KS.icing = function (F, b, u) { var c = F.ctx, p = F.pal, gb = '#b9763f', n = Math.round(b.w / (u * 4)), i; fillRR(c, b.x + u * 0.6, b.y + u * 1, b.w, b.h, u * 3, 'rgba(0,0,0,0.2)'); fillRR(c, b.x, b.y, b.w, b.h, u * 3, gb); c.strokeStyle = '#ffffff'; c.lineWidth = u * 0.7; c.lineCap = 'round'; c.beginPath(); for (i = 0; i <= n; i++) { var x = b.x + u * 3 + (b.w - u * 6) * i / n; if (i) c.quadraticCurveTo(x - (b.w - u * 6) / n / 2, b.y + u * (i % 2 ? 3.4 : 1.2), x, b.y + u * 2.2); else c.moveTo(x, b.y + u * 2.2); } c.stroke(); c.beginPath(); for (i = 0; i <= n; i++) { var x2 = b.x + u * 3 + (b.w - u * 6) * i / n; if (i) c.quadraticCurveTo(x2 - (b.w - u * 6) / n / 2, b.y + b.h - u * (i % 2 ? 3.4 : 1.2), x2, b.y + b.h - u * 2.2); else c.moveTo(x2, b.y + b.h - u * 2.2); } c.stroke();
    disc(c, b.x + u * 3.4, b.y + b.h / 2, u * 1.2, p.accent); disc(c, b.x + b.w - u * 3.4, b.y + b.h / 2, u * 1.2, p.accent2); return { base: 'rgba(255,255,255,0.45)', hi: '#ffffff', next: 'rgba(255,255,255,0.45)', ix: 0.09, iy: 0.2 }; };
  KS.wood = function (F, b, u) { var c = F.ctx, wd = '#9b6a3c', i; fillRR(c, b.x + u * 0.6, b.y + u * 1, b.w, b.h, u * 1.4, 'rgba(0,0,0,0.25)'); fillRR(c, b.x, b.y, b.w, b.h, u * 1.4, wd); c.strokeStyle = alpha(dark(wd, 0.5), 0.35); c.lineWidth = Math.max(1, u * 0.25); for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(b.x + u * 2, b.y + b.h * i / 4); c.bezierCurveTo(b.x + b.w * 0.3, b.y + b.h * i / 4 + u, b.x + b.w * 0.6, b.y + b.h * i / 4 - u, b.x + b.w - u * 2, b.y + b.h * i / 4); c.stroke(); } strokeRR(c, b.x, b.y, b.w, b.h, u * 1.4, dark(wd, 0.45), Math.max(1, u * 0.5));
    for (i = 0; i < 4; i++) disc(c, i % 2 ? b.x + b.w - u * 2.4 : b.x + u * 2.4, i > 1 ? b.y + b.h - u * 2.4 : b.y + u * 2.4, u * 0.7, '#e7d2ae'); return { base: 'rgba(255,244,220,0.42)', hi: '#fff6e0', next: 'rgba(255,244,220,0.42)', ix: 0.07, iy: 0.15 }; };
  KS.grass = function (F, b, u) { var c = F.ctx, p = F.pal, n = Math.round(b.w / (u * 2.2)), i; fillRR(c, b.x + u * 0.5, b.y + u * 0.9, b.w, b.h, u * 2.4, 'rgba(0,0,0,0.16)'); fillRR(c, b.x, b.y, b.w, b.h, u * 2.4, '#fffdf4'); c.fillStyle = p.accent2; for (i = 0; i < n; i++) { var x = b.x + u * 2 + (b.w - u * 4) * i / n, hh = u * (1.6 + 1.3 * frac(Math.sin(i * 12.9898) * 43758.5453)); c.beginPath(); c.moveTo(x - u * 0.7, b.y + b.h); c.quadraticCurveTo(x, b.y + b.h - hh * 0.6, x + Math.sin(F.t * 2 + i) * u * 0.4, b.y + b.h - hh); c.quadraticCurveTo(x + u * 0.3, b.y + b.h - hh * 0.5, x + u * 0.7, b.y + b.h); c.closePath(); c.fill(); }
    disc(c, b.x + u * 4, b.y + b.h - u * 2.4, u * 0.9, p.accent); disc(c, b.x + b.w - u * 5, b.y + b.h - u * 2.2, u * 0.9, p.gold); return { base: alpha(p.ink, 0.32), hi: p.ink, next: alpha(p.ink, 0.38), under: p.accent, ix: 0.06, iy: 0.14, bottom: 0.08 }; };
  KS.ice = function (F, b, u) { var c = F.ctx, p = F.pal, n = 9, i, g = c.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, '#f4fbff'); g.addColorStop(1, '#bfe3f7'); fillRR(c, b.x + u * 0.5, b.y + u * 0.9, b.w, b.h, u * 2, 'rgba(20,50,90,0.25)'); rr(c, b.x, b.y, b.w, b.h, u * 2); c.fillStyle = g; c.fill(); c.fillStyle = '#d9f0fb';
    for (i = 0; i < n; i++) { var x = b.x + b.w * (i + 0.5) / n, w = b.w / n * 0.34, hh = u * (2 + 2.6 * frac(Math.sin(i * 7.31) * 9973)); c.beginPath(); c.moveTo(x - w, b.y + b.h - u * 0.3); c.lineTo(x + w, b.y + b.h - u * 0.3); c.lineTo(x, b.y + b.h + hh); c.closePath(); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = Math.max(1, u * 0.5); c.lineCap = 'round'; c.beginPath(); c.moveTo(b.x + u * 2.5, b.y + b.h * 0.6); c.lineTo(b.x + u * 2.5, b.y + u * 2.5); c.lineTo(b.x + b.w * 0.2, b.y + u * 2.5); c.stroke(); strokeRR(c, b.x, b.y, b.w, b.h, u * 2, '#8fc6e6', Math.max(1, u * 0.35));
    return { base: alpha('#1f4a78', 0.36), hi: '#143a66', next: alpha('#1f4a78', 0.42), under: p.accent, ix: 0.07, iy: 0.14 }; };
  KS.candy = function (F, b, u) { var c = F.ctx, p = F.pal, i, st = u * 3.2; fillRR(c, b.x + u * 0.6, b.y + u * 1, b.w, b.h, b.h * 0.26, 'rgba(0,0,0,0.2)'); c.save(); rr(c, b.x, b.y, b.w, b.h, b.h * 0.26); c.clip(); c.fillStyle = '#ffffff'; c.fillRect(b.x, b.y, b.w, b.h); c.fillStyle = p.accent; for (i = -4; i * st * 2 < b.w + b.h; i++) { c.beginPath(); c.moveTo(b.x + i * st * 2, b.y + b.h); c.lineTo(b.x + i * st * 2 + st, b.y + b.h); c.lineTo(b.x + i * st * 2 + st + b.h, b.y); c.lineTo(b.x + i * st * 2 + b.h, b.y); c.closePath(); c.fill(); } c.restore();
    fillRR(c, b.x + u * 1.6, b.y + u * 1.6, b.w - u * 3.2, b.h - u * 3.2, b.h * 0.2, '#ffffff'); return { base: alpha(p.ink, 0.32), hi: p.accent, next: alpha(p.ink, 0.36), ix: 0.07, iy: 0.17, ball: p.accent2 }; };
  /* more bands (the library's looks): the sung words read on the band at a contrast of 5 or more; words on a dark band are never darker than #999 */
  KS.linen = function (F, b, u) { var c = F.ctx, p = F.pal, pc = mix(p.paper, '#efe8d8', 0.6), ink = reads(p.ink, pc, 9), i, x = b.x, y = b.y + b.h * 0.07, h = b.h * 0.86, lw = Math.max(1, u * 0.16);
    fillRR(c, x + u * 0.4, y + u * 0.7, b.w, h, u * 0.6, 'rgba(0,0,0,0.16)'); fillRR(c, x, y, b.w, h, u * 0.6, pc);
    c.fillStyle = alpha(dark(pc, 0.5), 0.05); for (i = 1; i < 16; i++) c.fillRect(x + u, y + h * i / 16, b.w - u * 2, Math.max(1, u * 0.12)); for (i = 1; i < 60; i++) c.fillRect(x + b.w * i / 60, y + u, Math.max(1, u * 0.12), h - u * 2);
    c.fillStyle = alpha(ink, 0.42); c.fillRect(x + u * 2.2, y + u * 1.3, b.w - u * 4.4, lw); c.fillRect(x + u * 2.2, y + h - u * 1.3 - lw, b.w - u * 4.4, lw);
    return { base: alpha(ink, 0.45), hi: ink, next: alpha(ink, 0.5), ix: 0.06, iy: 0.19 }; };
  KS.minimal = function (F, b, u) { var c = F.ctx, p = F.pal, tn = tone(F), i;
    if (!F.hitOnly) for (i = 0; i < 9; i++) fillRR(c, b.x + u * (5 - i * 0.9), b.y + u * (2.4 - i * 0.4), b.w - u * (10 - i * 1.8), b.h - u * (4.8 - i * 0.8), u * (3 + i * 0.7), alpha(tn.sh, 0.17));
    return { base: alpha(tn.tx, 0.62), hi: tn.tx, next: alpha(tn.tx, 0.62), under: crt(p.accent, tn.sh) >= crt(p.gold, tn.sh) ? p.accent : p.gold, ix: 0.08, iy: 0.17 }; };
  KS.sticker = function (F, b, u) { var c = F.ctx, p = F.pal, body = reads(p.accent, '#ffffff', 5.2), x = b.x + u, y = b.y + b.h * 0.06, w = b.w - u * 2, h = b.h * 0.86, r = h * 0.3, e = u * 1.1, m;
    c.save(); c.translate(b.x + b.w / 2, b.y + b.h / 2); c.rotate(-0.014); c.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    fillRR(c, x + u * 0.5, y + u * 1, w, h, r, 'rgba(0,0,0,0.26)'); fillRR(c, x, y, w, h, r, '#ffffff'); fillRR(c, x + e, y + e, w - e * 2, h - e * 2, r - e, body);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = u * 0.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + e + r * 0.7, y + e + u * 1.1); c.lineTo(x + w * 0.32, y + e + u * 1.1); c.stroke();
    for (m = 0; m < 2; m++) { starPath(c, m ? x + w - e - u * 3 : x + e + u * 3, y + h / 2, u * 1.6, m ? 0.3 : -0.3); c.fillStyle = light(p.gold, 0.25); c.fill(); }
    c.restore();
    return { base: 'rgba(255,255,255,0.68)', hi: '#ffffff', hiShadow: dark(body, 0.55), next: 'rgba(255,255,255,0.7)', under: light(p.gold, 0.3), ix: 0.1, iy: 0.2, ball: light(p.gold, 0.25) }; };
  KS.ticker = function (F, b, u) { var c = F.ctx, p = F.pal, bar = dark(p.bg, 0.8), tab = reads(p.accent, '#ffffff', 4.6), y = b.y + b.h * 0.1, h = b.h * 0.8, tw = h * 0.5 + u * 5, lw = Math.max(1, u * 0.4), i;
    c.fillStyle = alpha(bar, 0.94); c.fillRect(0, y, F.W, h); c.fillStyle = p.accent2; c.fillRect(0, y, F.W, lw);
    c.fillStyle = 'rgba(255,255,255,0.16)'; for (i = -1; i < 25; i++) c.fillRect((i + frac(F.t * 0.25)) * F.W / 24, y + h - u * 0.95, F.W / 48, lw);
    c.beginPath(); c.moveTo(0, y); c.lineTo(b.x + tw, y); c.lineTo(b.x + tw - u * 2.4, y + h); c.lineTo(0, y + h); c.closePath(); c.fillStyle = tab; c.fill();
    c.lineWidth = u * 0.75; c.lineJoin = 'miter'; for (i = 0; i < 3; i++) { var cx = b.x + u * 1.6 + i * u * 2.3, cy = y + h / 2, s = Math.min(u * 1.5, h * 0.2); c.strokeStyle = (((i - F.bt.n) % 3) + 3) % 3 === 0 ? '#ffffff' : 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(cx - s * 0.5, cy - s); c.lineTo(cx + s * 0.5, cy); c.lineTo(cx - s * 0.5, cy + s); c.stroke(); } c.lineJoin = 'round';
    return { base: 'rgba(255,255,255,0.64)', hi: '#ffffff', next: 'rgba(255,255,255,0.64)', under: light(p.gold, 0.1), ix: 0.03, iy: 0.2, left: tw + u * 0.5 }; };
  KS.scoreboard = function (F, b, u) { var c = F.ctx, p = F.pal, bd = '#10131a', led = reads(light(p.gold, 0.15), bd, 9), dim = mix(led, '#ffffff', 0.5), i, j, q, P = 2 * (b.w + b.h - u * 8), n = Math.round(P / (u * 2.2)), sp = u * 1.3;
    fillRR(c, b.x + u * 0.5, b.y + u * 0.9, b.w, b.h, u * 1.2, 'rgba(0,0,0,0.3)'); fillRR(c, b.x, b.y, b.w, b.h, u * 1.2, '#2c313d'); fillRR(c, b.x + u * 0.8, b.y + u * 0.8, b.w - u * 1.6, b.h - u * 1.6, u * 0.7, bd);
    if (!F.hitOnly) { c.fillStyle = 'rgba(255,255,255,0.05)'; for (j = b.y + u * 3.4; j < b.y + b.h - u * 3; j += sp) for (i = b.x + u * 3.4; i < b.x + b.w - u * 3; i += sp) c.fillRect(i, j, sp * 0.42, sp * 0.42); }
    for (i = 0; i < n; i++) { q = perim(b.x + u * 2, b.y + u * 2, b.w - u * 4, b.h - u * 4, P * i / n); disc(c, q[0], q[1], u * 0.42, (((i - F.bt.n) % 4) + 4) % 4 === 0 ? led : alpha(led, 0.38)); }
    return { base: alpha(dim, 0.62), hi: led, hiGlow: led, next: alpha(dim, 0.62), ix: 0.06, iy: 0.22, scale: 0.94 }; };
  var KARAOKE = Object.keys(KS);
  function karaoke(F) {
    var lines = F.pl.lines, n = lines.length, t = F.t, i, ctx = F.ctx, L = F.L, u = L.u; if (!n) return;
    var vis = Math.min(sstep(lines[0].t0 - 0.6, lines[0].t0 - 0.25, t), 1 - sstep(lines[n - 1].t1 + 0.5, lines[n - 1].t1 + 0.9, t)); if (vis <= 0.004) return;
    var idx = -1, prog = 0;
    for (i = 0; i < n; i++) if (t >= lines[i].t0 && t < lines[i].t1) { idx = i; prog = (t - lines[i].t0) / (lines[i].t1 - lines[i].t0); }
    if (idx < 0) { for (i = 0; i < n; i++) if (lines[i].t0 > t) break; if (i < n && (i === 0 || lines[i].t0 - t <= 0.9 || t - lines[i - 1].t1 > 0.5)) { idx = i; prog = 0; } else { idx = Math.max(0, i - 1); prog = 1; } }
    var b = { x: L.band.x, y: L.band.y, w: L.band.w, h: L.band.h };
    ctx.save(); ctx.globalAlpha = vis; ctx.lineJoin = 'round';
    var st = (KS[F.tp.look.karaoke] || KS.band)(F, b, u), fam = F.tp.look.fonts.lyric, ks = (F.tp.look.fonts.lyricScale || 1) * (st.scale || 1);
    var ix = b.x + b.w * st.ix + (st.left || 0), iw = b.w * (1 - st.ix * 2) - (st.left || 0), iy = b.y + b.h * (st.iy + (st.top || 0)), ih = b.h * (1 - st.iy * 2 - (st.top || 0) - (st.bottom || 0));
    var maxPx = ih * 0.44 * ks, nextPx = ih * 0.25 * ks, text = lines[idx].text, nxt = idx + 1 < n ? lines[idx + 1].text : '';
    /* one big line with the next line dimmed under it when it fits; else two lines, as large as they go */
    var ft = fit(ctx, text, fam, iw, maxPx, maxPx * 0.66, 1, true), nf = null, two = null;
    if (!ft || ft.px < maxPx * 0.84) { two = fit(ctx, text, fam, iw, Math.min(maxPx, ih * 0.38 * ks), ih * 0.2, 2); if (!ft || two.px > ft.px * 1.12) ft = two; else two = null; }
    if (!two && nxt) nf = fit(ctx, nxt, fam, iw * 0.94, nextPx, nextPx * 0.8, 1);
    var gap = nf ? ih * 0.08 : 0, total = ft.h + (nf ? nf.h + gap : 0), top = iy + (ih - total) / 2, cx = ix + iw / 2;
    var age = prog > 0 && prog < 1 ? t - lines[idx].t0 : 1, ea = outCubic(age / 0.18), dy = (1 - ea) * ft.px * 0.35;
    ctx.globalAlpha = vis * (0.3 + 0.7 * ea);
    drawLines(ctx, ft, cx, top + dy, { fill: st.base });
    /* the sweep: sung text is redrawn in the highlight colour inside a clip that grows across the line(s) */
    var widths = [], sum = 0, done = 0; ctx.font = fontStr(fam, ft.px); for (i = 0; i < ft.lines.length; i++) { widths.push(mw(ctx, ft.lines[i])); sum += widths[i]; }
    var sung = prog * sum, headX = cx - widths[0] / 2, headY = top + dy;
    for (i = 0; i < ft.lines.length; i++) {
      var part = clamp((sung - done) / Math.max(1, widths[i]), 0, 1), lx = cx - widths[i] / 2, ly = top + dy + i * ft.lh; done += widths[i];
      if (part <= 0) continue;
      ctx.save(); ctx.beginPath(); ctx.rect(lx - ft.px * 0.3, ly - ft.px * 0.2, widths[i] * part + ft.px * 0.3, ft.lh + ft.px * 0.4); ctx.clip();
      drawLines(ctx, { px: ft.px, lines: [ft.lines[i]], lh: ft.lh, fam: fam }, cx, ly, { fill: st.hi, glow: st.hiGlow, shadow: st.hiShadow, sdx: st.hiShadow ? 0.06 : 0, sdy: st.hiShadow ? 0.03 : undefined });
      ctx.restore();
      if (st.under) { ctx.fillStyle = st.under; ctx.fillRect(lx, ly + ft.lh * 0.92, widths[i] * part, Math.max(1, ft.px * 0.07)); }
      headX = lx + widths[i] * part; headY = ly;
    }
    if (st.ball && prog > 0 && prog < 1 && !calm(F)) { var br = ft.px * 0.13; disc(ctx, headX, headY - br * 0.4 - Math.abs(Math.sin(F.bt.phase * PI)) * ft.px * 0.32, br, st.ball); }
    pushBox(F, null, 'text', cx - ft.w / 2, top, ft.w, ft.h, 'lyric');
    if (nf) { ctx.globalAlpha = vis; drawLines(ctx, nf, cx, top + ft.h + gap, { fill: st.next }); pushBox(F, null, 'text', cx - nf.w / 2, top + ft.h + gap, nf.w, nf.h, 'lyric-next'); }
    ctx.restore();
  }

  /* ---------- the frame ---------- */
  function frameState(ctx, W, H, card, t, env) {
    card = card || {}; env = env || {};
    var tp = tplOf(card), pd = planned(card), pl = pd.plan;
    t = clamp(num(t, 0), 0, pl.duration);
    var bt = beatAt(card, t), F = { ctx: ctx, W: W, H: H, card: card, t: t, env: env, tp: tp, pl: pl, pal: tp.look.pal, bt: bt, L: layout(W, H, tp), boxes: Array.isArray(env.boxes) ? env.boxes : null };
    F.energy = clamp(bt.energy + num(env.interact && env.interact.dance, 0) * 0.5, 0, 1);
    F.castBoxes = !!(F.boxes && env.castBoxes === true);
    return F;
  }
  function draw(ctx, W, H, card, t, env) {
    if (!ctx || !(W > 0) || !(H > 0)) return;
    var F = frameState(ctx, W, H, card, t, env);
    ctx.save(); ctx.globalAlpha = 1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    drawScenes(F);
    if (F.tp.look.border && F.tp.look.border !== 'none') Art.border(F.tp.look.border, ctx, W, H, F.t, F.pal, { beat: F.bt.phase, n: F.bt.n, seed: F.tp.id });
    karaoke(F);
    ctx.restore();
  }
  /* a canvas context that draws nothing: lets hit() run the same layout code without pixels */
  function stubCtx() {
    var c = { font: '10px x', globalAlpha: 1 }, names = 'save restore translate scale rotate beginPath closePath moveTo lineTo quadraticCurveTo bezierCurveTo arc arcTo ellipse rect fill stroke clip fillRect strokeRect clearRect fillText strokeText drawImage setTransform transform setLineDash'.split(' '), i;
    function nop() { }
    for (i = 0; i < names.length; i++) c[names[i]] = nop;
    c.createLinearGradient = c.createRadialGradient = function () { return { addColorStop: nop }; };
    c.measureText = function (s) { return { width: String(s).length * parseFloat(c.font) * 0.5 }; };
    return c;
  }
  function hit(card, W, H, t, x, y) {
    if (!(W > 0) || !(H > 0)) return null;
    var F = frameState(stubCtx(), W, H, card, t, { images: [] }), i;
    F.hitOnly = true; F.hitList = []; drawScenes(F);
    for (i = F.hitList.length - 1; i >= 0; i--) { var r = F.hitList[i]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.name; }
    return null;
  }

  E.draw = draw; E.timing = timing; E.plan = plan; E.beatAt = beatAt; E.posterTime = posterTime; E.hit = hit;
  E.layout = function (W, H, card) { return layout(W, H, tplOf(card)); };
  E.aspectFor = aspectFor; E.shapedFrames = Object.keys(SHAPED);
  E.signoffStyles = Object.keys(SO);
  E.karaokeStyles = KARAOKE; E.transitions = TRANSITIONS; E.titleStyles = TITLES; E.frameEntrances = ['pop', 'drop', 'slide', 'rise', 'swing', 'spin'];
  return E;
});
