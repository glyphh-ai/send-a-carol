/* Send a Carol engine: draws one frame of a carol (a short singing card video) for a time t.
   The SAME code draws the live preview in a browser canvas and the video frames on the server (@napi-rs/canvas).
   No DOM, no clock, no Math.random: draw(ctx, W, H, card, t, env) is deterministic for a given (card, t, env).
   Needs CarolArt (art.js) and CarolTemplates (templates.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./art.js'), require('./templates.js'));
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
  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function fillRR(c, x, y, w, h, r, col) { rr(c, x, y, w, h, r); c.fillStyle = col; c.fill(); }
  function strokeRR(c, x, y, w, h, r, col, lw) { rr(c, x, y, w, h, r); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
  function disc(c, x, y, r, col) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); c.fillStyle = col; c.fill(); }
  function hits(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function tplOf(card) { return (card && Tpl.get(card.template)) || Tpl.list[0]; }

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
    for (i = 0; i < fr.length; i++) (SHAPED[fr[i]] ? shaped : rect).push(fr[i]);
    if (!rect.length) rect = ['plain'];
    for (i = 0; i < photos.length; i++) if (photos[i].solo) anySolo = true;
    if (!anySolo) for (i = 0; i < photos.length; i++) if (!(photos[i].ar > 0.95)) { first = i; break; }   /* (a photo whose shape is not known counts as upright) */
    for (i = 0; i < photos.length; i++) { var star = shaped.length && (anySolo ? photos[i].solo : i === first); photos[i].frame = star ? shaped[k++ % shaped.length] : rect[j++ % rect.length]; }
  }
  function lookOf(q) { return { ar: q.ar, solo: q.solo, fit: q.fit }; }
  function aspectFor(name, ar) { var a = ASPECT[name] || 0.82; return FLEX[name] && ar > 0.95 ? clamp(a * ar / 0.78, a, 1.42) : a; }
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
    var key = (card && card.template) + '|' + JSON.stringify((card && card.timing) || 0) + '|' + JSON.stringify((card && card.scenes) || 0) + '|' + JSON.stringify((card && card.lyrics) || 0);
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
  function castOf(tp, kind, role) { var out = [], i; for (i = 0; i < tp.cast.length; i++) if (tp.cast[i].kind === kind && (!role || tp.cast[i].role === role)) out.push(tp.cast[i]); return out; }

  /* ---------- the cast ---------- */
  function pokeOf(F, name) { var p = F.env.interact && F.env.interact.poke; if (!p || p.name !== name) return 0; var d = F.t - num(p.at, -9); return d >= 0 && d < 0.9 ? d / 0.9 + 1e-6 : 0; }
  function drawChar(F, Lc, it, x, feet, h, mood, idx) {
    var name = it.name, wide = WIDE[name] || 0.82, k, r, pk = pokeOf(F, name), ctx = F.ctx;
    for (k = 0; k < 4; k++) { /* never over a face: shrink, then give up */
      r = { x: x - h * wide / 2, y: feet - h, w: h * wide, h: h }; var bad = false;
      for (var i = 0; i < Lc.faces.length; i++) if (hits(r, Lc.faces[i])) bad = true;
      if (!bad) break; if (k === 3) return; h *= 0.8;
    }
    var y = feet - (pk ? Math.sin(pk * PI) * h * 0.3 : 0);
    ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.beginPath(); ctx.ellipse(x, feet + h * 0.01, h * wide * 0.36 * (pk ? 1 - 0.3 * Math.sin(pk * PI) : 1), h * 0.035, 0, 0, TAU); ctx.fill();
    Art.character(name, ctx, x, y, h, { beat: F.bt.phase, n: F.bt.n + idx, energy: clamp(F.energy + (pk ? 0.6 : 0), 0, 1), flip: (x > F.W * 0.5) !== !!it.flip, t: F.t, mood: pk ? 'wave' : (it.mood || mood), variant: it.variant || 0 }, F.pal);
    if (F.hitList && Lc.live) F.hitList.push({ name: name, x: r.x, y: r.y, w: r.w, h: r.h });
  }
  function drawProp(F, Lc, name, x, y, s, o) {
    var pk = pokeOf(F, name), ctx = F.ctx, k = Math.exp(-5 * F.bt.phase) * F.energy;
    ctx.save(); ctx.translate(x, y);
    if (pk) { ctx.rotate(Math.sin(pk * TAU * 2) * 0.16 * (1 - pk)); var ps = 1 + 0.22 * Math.sin(pk * PI); ctx.scale(ps, ps); }
    else if (!o || o.pulse !== false) { var b = 1 + 0.035 * k; ctx.scale(b, b); }
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
    for (i = 0; i < order.length; i++) { var c = chars[order[i]]; if (!c) continue; var wide = WIDE[c.name] || 0.82, h = Math.min(L.castH * (order[i] === 2 ? 0.86 : 1), W * (L.tall ? 0.3 : 0.26) / wide) * (c.size || 1); drawChar(F, Lc, c, cx[order[i]] * W, L.floor, h, mood, order[i]); }
  }
  function tableau(F, Lc, R, mood, kind) { /* the cast as a little stage picture: a hero prop, the characters around it, small props on the floor */
    var L = F.L, W = F.W, H = F.H, tp = F.tp, low = L.mode === 'cast-low', hero = castOf(tp, 'prop', 'hero')[0], chars = castOf(tp, 'character'), fp = castOf(tp, 'prop', 'floor'), i;
    var hf = low ? L.stage.y + L.stage.h : L.floor, avail = Math.max(1, hf - R.y), row = (kind === 'row' && !low) || !hero;
    if (kind === 'row' && low && hero) { /* the cast is under the band in this layout: a second lyric scene shows another prop on the stage instead */
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
    for (i = 0; i < fp.length && i < 2; i++) { var ps = ch * 0.5 * (fp[i].size || 1), px = row ? [0.37, 0.63][i] : (low ? [0.35, 0.66][i] : [L.tall ? 0.66 : 0.71, L.tall ? 0.36 : 0.3][i]); if (!row && !low && i === 1 && chars.length >= 3) continue; drawProp(F, Lc, fp[i].name, W * px, cf - ps * 0.46, ps); }
    for (i = 0; i < 3; i++) { var c = chars[order[i]]; if (!c) continue; var wide = WIDE[c.name] || 0.82, h = Math.min(ch * (order[i] === 2 && !row ? 0.8 : 1), W * (row ? 0.34 : 0.32) / wide) * (c.size || 1); drawChar(F, Lc, c, xs[order[i]] * W, cf, h, mood, order[i]); }
  }

  /* ---------- photo frames ---------- */
  function enter(ctx, kind, a, cx, cy, bw, bh, i, F) { /* the frame eases in with overshoot */
    if (a >= 1) return;
    var e = outBack(a), s;
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
      var s = sl[i], cx = R.x + s[0] * R.w, cy = R.y + s[1] * R.h, sw = s[2] * R.w, sh = s[3] * R.h * (o && o.capRoom && n === 1 ? 0.93 : 1), name = sc.frames[i] || F.tp.frames[0], lk = (sc.looks && sc.looks[i]) || {}, asp = sc.kind === 'art' ? ASPECT[name] || 0.82 : aspectFor(name, lk.ar);
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
    else st = { fill: p.paper, stroke: p.ink, sw: 0.16, shadow: 'rgba(0,0,0,0.3)', sdy: 0.08, sub: p.paper, subStroke: p.ink };
    if (lk.titleFill) st.fill = lk.titleFill; if (lk.titleStroke) { st.stroke = lk.titleStroke; if (st.subStroke) st.subStroke = lk.titleStroke; } if (lk.subFill) st.sub = lk.subFill; if (lk.titleSw) st.sw = lk.titleSw;
    return st;
  }
  /* big line(s) in the title face and a smaller line under it, at the top of the stage; returns the y under the block */
  function topText(F, Lc, big, small, o) {
    var ctx = F.ctx, L = F.L, W = F.W, S = L.stage, p = F.pal, fonts = F.tp.look.fonts, st = titleStyle(F), plate = st.plate, u = L.u;
    var padY = plate && plate !== 'chalkline' ? W * (L.tall ? 0.03 : 0.02) : 0, padX = plate && plate !== 'chalkline' ? W * 0.05 : 0, maxW = S.w * 0.96 - padX * 2;
    var bf = fit(ctx, big, fonts.title, maxW, W * (o.bigPx || (L.tall ? 0.115 : 0.07)) * (fonts.titleScale || 1), W * 0.034, 2);
    var sf = small ? fit(ctx, small, fonts.body, maxW, W * (o.smallPx || (L.tall ? 0.05 : 0.036)), W * 0.026, o.smallLines || 1) : null;
    var gap = sf ? bf.px * 0.12 : 0, h = bf.h + (sf ? sf.h + gap : 0), top = S.y + padY + (plate === 'sign' ? W * 0.03 : 0) + (o.dy || 0), bw = Math.max(bf.w, sf ? sf.w : 0);
    var a = clamp((Lc.lt - (o.delay || 0)) / 0.5, 0, 1), e = outBack(a), cx = W / 2, k = Math.exp(-6 * F.bt.phase) * F.energy;
    var bottom = top + h + padY;
    if (a > 0.01) {
      ctx.save(); ctx.globalAlpha = clamp(a * 2.2, 0, 1); ctx.translate(cx, top + h / 2); var sc = (0.72 + 0.28 * e) * (1 + 0.016 * k); ctx.scale(sc, sc); ctx.translate(-cx, -(top + h / 2));
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
      drawLines(ctx, bf, cx, top, st);
      if (plate === 'chalkline') { ctx.strokeStyle = alpha(p.gold, 0.9); ctx.lineWidth = Math.max(1, u * 0.5); ctx.lineCap = 'round'; ctx.beginPath(); var x0 = cx - bf.w * 0.4, yy = top + bf.h + u * 0.2, q; ctx.moveTo(x0, yy); for (q = 1; q <= 12; q++) ctx.lineTo(x0 + bf.w * 0.8 * q / 12, yy + (q % 2 ? -1 : 1) * u * 0.55); ctx.stroke(); }
      if (sf) drawLines(ctx, sf, cx, top + bf.h + gap, { fill: st.sub, stroke: st.subStroke, sw: 0.2, shadow: st.subShadow, glow: st.subGlow });
      ctx.restore();
    }
    pushBox(F, Lc, 'text', cx - bf.w / 2, top, bf.w, bf.h, o.what || 'title');
    if (sf) pushBox(F, Lc, 'text', cx - sf.w / 2, top + bf.h + gap, sf.w, sf.h, o.whatSmall || 'from');
    return bottom + (plate === 'ribbon' ? u * 2.4 : 0);
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
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, u * 0.28); ctx.strokeStyle = lightBg ? alpha(p.ink, 0.3) : alpha(p.snow, 0.5); ctx.beginPath();
    for (k = 0; k < 5; k++) for (i = 0; i <= n; i++) { var x = W * a * i / n, y = y0 + wave(x) + (k - 2) * gap; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    for (i = 0; i < 7; i++) {
      var f = frac(i / 7 + t * 0.045), nx = f * W, row = [1, -2, 0, 2, -1, 1.5, -0.5][i], ny = y0 + wave(nx) + row * gap * 0.5 - (i % 2 === (F.bt.n & 1) ? k2 * u * 2.2 : 0), col = cols[i % 4], s = u * (F.L.tall ? 2.3 : 1.5);
      if (nx > W * a) continue;
      ctx.globalAlpha = Math.min(1, f * 8, (1 - f) * 8); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, u * 0.42);
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
  function sceneSignoff(F, Lc) {
    var card = F.card, L = F.L, S = L.stage, sc = Lc.sc, greeting = str(card.greeting) || str(card.title) || 'With love', sign = str(card.signoff) || (str(card.from) ? 'from ' + str(card.from) : '');
    var by = topText(F, Lc, greeting, sign, { what: 'greeting', whatSmall: 'signoff', smallLines: 2, smallPx: L.tall ? 0.06 : 0.042, bigPx: L.tall ? 0.105 : 0.066 });
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
    if (st.ball && prog > 0 && prog < 1) { var br = ft.px * 0.13; disc(ctx, headX, headY - br * 0.4 - Math.abs(Math.sin(F.bt.phase * PI)) * ft.px * 0.32, br, st.ball); }
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
  E.karaokeStyles = KARAOKE; E.transitions = TRANSITIONS; E.titleStyles = TITLES; E.frameEntrances = ['pop', 'drop', 'slide', 'rise', 'swing', 'spin'];
  return E;
});
