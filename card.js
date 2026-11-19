/* card.js : the recipient's page, /<card-name>. No account. One canvas, four stages:
     present  a wrapped present (or a sealed envelope) addressed to them: tap, shake or pull the ribbon to open it
     play     the carol drawn live by the engine in time with its song: tap a character, swipe for more sparkle
     end      play again, two little games (pop the ornaments/balloons, ring the bells in time), save, share, make your own
   Falls back to the mp4 in a <video> when the engine or the song cannot be used. Scores are kept nowhere.
   Tests and screenshots (only on a *.test host): ?at=open|end|bells|pop, &t=<seconds>, &wrap=present|envelope. */
(function () {
  'use strict';
  var NAME = window.SAC_CARD, TEST = /\.test$/.test(location.hostname), QS = new URLSearchParams(location.search), AT = TEST ? QS.get('at') : null;
  var $ = function (id) { return document.getElementById(id); }, noop = function () { };
  var cv = $('cv'), ctx = cv.getContext('2d'), VW = 0, VH = 0, DPR = 1, PI = Math.PI, TAU = PI * 2;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var BRAND = { bg: '#1d1230', bg2: '#3a1d4f', ink: '#2a1a2e', accent: '#c2185b', accent2: '#1f7a5a', gold: '#f2b632', snow: '#ffffff', paper: '#fff8ee' };
  var S = { stage: 'load', data: null, card: null, tpl: null, pal: BRAND, xmas: false, wrap: 'present', env: { images: [], interact: { snow: 0, dance: 0, poke: null } },
    R: { x: 0, y: 0, w: 1, h: 1, full: true }, muted: false, video: false, root: 0, note: 0, orbs: [], popped: 0, best: 0, opened: false, tm: 0 };
  var audio = new Audio(); audio.preload = 'auto';
  var clk = { t: 0, on: false, silent: false, dur: 30, wait: 0 };
  var parts = [];   // confetti, shards, sparks: every stage's bursts

  /* ---------- small helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outCubic(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function outBack(x) { x = clamp(x, 0, 1); var c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function rgb(c) { var m = /^#([0-9a-f]{6})/i.exec(c || ''); if (m) { var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; } m = /^#([0-9a-f]{3})$/i.exec(c || ''); if (m) return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)]; m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(c || ''); return m ? [+m[1], +m[2], +m[3]] : [255, 255, 255]; }
  function mix(a, b, k) { var x = rgb(a), y = rgb(b); return 'rgb(' + Math.round(lerp(x[0], y[0], k)) + ',' + Math.round(lerp(x[1], y[1], k)) + ',' + Math.round(lerp(x[2], y[2], k)) + ')'; }
  function al(c, a) { var x = rgb(c); return 'rgba(' + Math.round(x[0]) + ',' + Math.round(x[1]) + ',' + Math.round(x[2]) + ',' + a + ')'; }
  function lum(c) { var x = rgb(c); return (0.299 * x[0] + 0.587 * x[1] + 0.114 * x[2]) / 255; }
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fitFont(c, text, fam, px, maxW, min) { c.font = px + 'px "' + fam + '"'; var w = c.measureText(text).width; if (w > maxW) { px = Math.max(min || 6, px * maxW / w); c.font = px + 'px "' + fam + '"'; } return px; }
  function show(el, on) { el.hidden = !on; }
  function say(el, text) { el.textContent = text; }
  function pretty(name) { return ({ santa: 'Santa', mrsclaus: 'Mrs Claus', polarbear: 'polar bear', gingerbread: 'gingerbread man', caroler: 'singer' })[name] || name; }
  function scrims(top, bottom) {   // darker behind the words at the top and the hint at the bottom
    var g = ctx.createLinearGradient(0, 0, 0, VH * 0.5); g.addColorStop(0, al(S.dark, top)); g.addColorStop(1, al(S.dark, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH * 0.5);
    g = ctx.createLinearGradient(0, VH * 0.7, 0, VH); g.addColorStop(0, al(S.dark, 0)); g.addColorStop(1, al(S.dark, bottom)); ctx.fillStyle = g; ctx.fillRect(0, VH * 0.7, VW, VH * 0.3);
  }

  /* ---------- sound: every blip is made here (WebAudio), unlocked by the first tap ---------- */
  var AC = null, master = null, NB = null, PENTA = [0, 2, 4, 7, 9];
  function ac() {
    if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { AC = new C(); master = AC.createGain(); master.gain.value = S.muted ? 0 : 0.9; master.connect(AC.destination); } catch (e) { AC = null; return null; } }
    return AC;
  }
  function snd(fn) {
    var a = ac(), asked = performance.now(); if (!a) return;
    if (a.state === 'running') return fn(a, a.currentTime);
    a.resume().then(function () { if (performance.now() - asked < 300) fn(a, a.currentTime); }).catch(noop);
  }
  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function noteHz(k, oct) { var r = S.root > 6 ? S.root - 12 : S.root; k = ((k % 10) + 10) % 10; return hz(60 + (oct || 0) * 12 + r + PENTA[k % 5] + 12 * Math.floor(k / 5)); }
  function pluck(a, t, f, d, g, type) { var o = a.createOscillator(), v = a.createGain(); o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t); v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g || 0.25, t + 0.008); v.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(v); v.connect(master); o.start(t); o.stop(t + d + 0.05); return o; }
  function noise(a, t, d, f, g, f2) {
    if (!NB) { NB = a.createBuffer(1, a.sampleRate, a.sampleRate); var ch = NB.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
    var s = a.createBufferSource(), bp = a.createBiquadFilter(), v = a.createGain(); s.buffer = NB; bp.type = 'bandpass'; bp.Q.value = 0.9; bp.frequency.setValueAtTime(f, t); if (f2) bp.frequency.exponentialRampToValueAtTime(f2, t + d);
    v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(bp); bp.connect(v); v.connect(master); s.start(t, Math.random() * 0.5, d + 0.05);
  }
  function bellTone(a, t, f, g) { [[1, 1, 1.5], [2.76, 0.42, 0.9], [5.4, 0.22, 0.5], [8.93, 0.1, 0.25]].forEach(function (p) { pluck(a, t, f * p[0], p[2], (g || 0.2) * p[1], 'sine'); }); }
  var sfx = {
    tap: function (k) { snd(function (a, t) { pluck(a, t, noteHz(k, 0), 0.22, 0.24); pluck(a, t + 0.05, noteHz(k + 2, 0), 0.25, 0.16); noise(a, t, 0.09, 2600, 0.12, 900); }); },
    rustle: function () { snd(function (a, t) { noise(a, t, 0.07, 3200, 0.05, 1500); }); },
    burst: function () { snd(function (a, t) { noise(a, t, 0.5, 500, 0.3, 5000); for (var i = 0; i < 6; i++) pluck(a, t + 0.05 + i * 0.07, noteHz(i, 0), 0.5, 0.2); bellTone(a, t + 0.5, noteHz(5, 1), 0.2); }); },
    poke: function () { var k = S.note = (S.note + 1 + Math.floor(Math.random() * 3)) % 10; snd(function (a, t) { pluck(a, t, noteHz(k, 0), 0.3, 0.22); pluck(a, t + 0.09, noteHz(k + 2, 0), 0.3, 0.16, 'sine'); }); },
    spark: function () { snd(function (a, t) { pluck(a, t, noteHz(5 + Math.floor(Math.random() * 5), 1), 0.12, 0.035, 'sine'); }); },
    pop: function () { snd(function (a, t) { var o = pluck(a, t, 720, 0.16, 0.4, 'sine'); o.frequency.exponentialRampToValueAtTime(110, t + 0.13); noise(a, t, 0.08, 1800, 0.45, 600); bellTone(a, t + 0.12, noteHz(S.popped + 2, 1), 0.12); }); },
    bell: function (i) { snd(function (a, t) { bellTone(a, t, noteHz([0, 2, 4][i % 3], 1), 0.3); }); },
    drum: function (i) { snd(function (a, t) { if (i === 1) { for (var k = 0; k < 3; k++) noise(a, t + k * 0.012, 0.09, 1500, 0.4); return; } var o = pluck(a, t, i ? 210 : 150, 0.22, 0.6, 'sine'); o.frequency.exponentialRampToValueAtTime(i ? 90 : 55, t + 0.16); noise(a, t, 0.05, 900, 0.2); }); },
    miss: function () { snd(function (a, t) { var o = pluck(a, t, 160, 0.16, 0.14, 'sine'); o.frequency.exponentialRampToValueAtTime(90, t + 0.14); }); },
    win: function () { snd(function (a, t) { [0, 2, 4, 5, 7].forEach(function (k, i) { bellTone(a, t + i * 0.11, noteHz(k, 1), 0.16); }); }); }
  };
  // the song's key, roughly: the pitch class whose major triad carries the most energy. The blips are played in it.
  function findKey(buf) {
    var sr = buf.sampleRate, ch = buf.getChannelData(0), step = Math.max(1, Math.floor(sr / 8000)), fs = sr / step, i0 = Math.min(Math.floor(sr * 2), Math.max(0, ch.length - sr * 4)), i1 = Math.min(ch.length, i0 + sr * 18), e = [], pc, o, i;
    for (pc = 0; pc < 12; pc++) { e[pc] = 0; for (o = 0; o < 3; o++) { var w = 2 * Math.cos(TAU * hz(48 + pc + 12 * o) / fs), s1 = 0, s2 = 0, s0; for (i = i0; i < i1; i += step) { s0 = ch[i] + w * s1 - s2; s2 = s1; s1 = s0; } e[pc] += Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - w * s1 * s2)); } }
    var best = 0, bv = -1; for (pc = 0; pc < 12; pc++) { var v = e[pc] + 0.6 * e[(pc + 7) % 12] + 0.4 * e[(pc + 4) % 12]; if (v > bv) { bv = v; best = pc; } }
    return best;
  }
  function learnKey() {
    var a = ac(); if (!a || !S.data || !S.data.song || S.keyAsked) return; S.keyAsked = true;
    fetch(S.data.song).then(function (r) { return r.ok ? r.arrayBuffer() : Promise.reject(); }).then(function (b) { return new Promise(function (ok, no) { var p = a.decodeAudioData(b, ok, no); if (p && p.catch) p.catch(noop); }); }).then(function (buf) { S.root = findKey(buf); }).catch(noop);
  }

  /* ---------- particles ---------- */
  function burstAt(x, y, n, cols, o) {
    o = o || {}; if (reduce) n = Math.ceil(n / 4);
    for (var i = 0; i < n && parts.length < 700; i++) {
      var an = o.up ? -PI / 2 + (Math.random() - 0.5) * (o.spread || 2.4) : Math.random() * TAU, sp = (o.speed || 300) * (0.35 + Math.random() * 0.9);
      parts.push({ x: x, y: y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - (o.lift || 0), g: o.g == null ? 900 : o.g, r: (o.size || 7) * (0.6 + Math.random() * 0.9), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, col: cols[i % cols.length], life: 0, max: (o.life || 1.4) * (0.7 + Math.random() * 0.6), shape: o.shapes ? o.shapes[i % o.shapes.length] : 'rect', drag: o.drag || 1.2 });
    }
  }
  function stepParts(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life += dt; if (p.life > p.max || p.y > VH + 60) { parts.splice(i, 1); continue; }
      p.vx *= Math.exp(-p.drag * dt); p.vy = p.vy * Math.exp(-p.drag * 0.5 * dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      var a = clamp((p.max - p.life) / 0.35, 0, 1); ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
      if (p.shape === 'rect') ctx.fillRect(-p.r, -p.r * 0.45 * Math.abs(Math.cos(p.life * 9 + p.rot)) - 0.6, p.r * 2, p.r * 0.9 * Math.abs(Math.cos(p.life * 9 + p.rot)) + 1.2);
      else if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, p.r * 0.55, 0, TAU); ctx.fill(); }
      else if (p.shape === 'shard') { ctx.beginPath(); ctx.moveTo(-p.r, -p.r * 0.6); ctx.lineTo(p.r * 1.1, -p.r * 0.2); ctx.lineTo(-p.r * 0.2, p.r); ctx.closePath(); ctx.fill(); }
      else if (p.shape === 'heart') heart(ctx, 0, 0, p.r * 1.3);
      else star(ctx, 0, 0, p.r, p.r * 0.42, p.shape === 'spark' ? 4 : 5);
      ctx.restore();
    }
  }
  function star(c, x, y, ro, ri, n) { c.beginPath(); for (var i = 0; i < n * 2; i++) { var an = -PI / 2 + i * PI / n, r = i % 2 ? ri : ro; c.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); } c.closePath(); c.fill(); }
  function heart(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * 0.45); c.bezierCurveTo(x - s * 1.1, y - s * 0.2, x - s * 0.5, y - s * 0.95, x, y - s * 0.35); c.bezierCurveTo(x + s * 0.5, y - s * 0.95, x + s * 1.1, y - s * 0.2, x, y + s * 0.45); c.fill(); }
  function festive() { var p = S.pal; return [p.accent, p.gold, p.accent2, p.paper, mix(p.accent, '#ffffff', 0.4)]; }
  function shapesFor() { return S.xmas ? ['rect', 'star', 'dot', 'rect'] : S.data && S.data.occasion === 'love' ? ['heart', 'rect', 'dot'] : ['rect', 'rect', 'star', 'dot']; }

  /* ---------- the backdrop behind everything that is not the card itself ---------- */
  function backdrop(dim, calm) {
    var ok = false, p = S.pal, tm = S.tm;
    if (S.tpl && window.CarolArt) { try { CarolArt.backdrop(S.tpl.backdrop, ctx, VW, VH, calm ? tm * 0.5 : tm, p, { beat: 0.6, n: 0, seed: S.tpl.id }); ok = true; } catch (e) { ok = false; } }
    if (!ok) { var g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, p.bg); g.addColorStop(1, p.bg2); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); }
    if (dim > 0) { ctx.fillStyle = al(S.dark, dim); ctx.fillRect(0, 0, VW, VH); }
    if (S.tpl && window.CarolArt && !reduce) { try { CarolArt.particles(S.tpl.particles || 'twinkle', ctx, VW, VH, tm, p, { amount: 0.7, seed: 'card', beat: 0.6 }); } catch (e) { /* the art is still being made */ } }
    var v = ctx.createRadialGradient(VW / 2, VH * 0.5, Math.min(VW, VH) * 0.3, VW / 2, VH * 0.5, Math.max(VW, VH) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, VW, VH);
  }

  /* ---------- stage 1: the present ---------- */
  var U = { p: 0, a1: 0, a2: 0, a3: 0, kick: 0, taps: 0, done: false, drag: null, cx: 0, cy: 0, s: 100, assets: false, t0: 0 };
  function presentBox() {
    var land = VW > VH && VH < 520;
    U.s = land ? VH * 0.62 : Math.min(VW * 0.66, VH * 0.36, 360); U.cx = land ? VW * 0.68 : VW / 2; U.cy = land ? VH * 0.52 : VH * 0.55;
  }
  function ribbonCols() { var p = S.pal, rib = Math.abs(lum(p.gold) - lum(p.accent)) < 0.12 ? p.paper : p.gold; return { paper: p.accent, rib: rib, ribD: mix(rib, '#000000', 0.22), ribH: mix(rib, '#ffffff', 0.4) }; }
  function drawPresent() {
    var u = U.s / 100, p = S.pal, C = ribbonCols(), tm = S.tm, a1 = U.a1, a2 = U.a2, a3 = U.a3, i;
    var wig = reduce ? 0 : Math.sin(tm * 1.7) * 0.018 + Math.max(0, Math.sin(tm * 1.3) - 0.8) * 5 * Math.sin(tm * 26) * 0.035 + U.kick * Math.sin(tm * 40) * 0.07;
    var br = reduce ? 1 : 1 + Math.sin(tm * 2.1) * 0.014;
    // the glow it sits in
    var gl = ctx.createRadialGradient(U.cx, U.cy, U.s * 0.1, U.cx, U.cy, U.s * 1.25); gl.addColorStop(0, al(p.gold, 0.34 + 0.25 * a3)); gl.addColorStop(1, al(p.gold, 0)); ctx.fillStyle = gl; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.translate(U.cx, U.cy + 46 * u); ctx.rotate(wig); ctx.scale(br * (1 + U.kick * 0.07), br * (1 - U.kick * 0.09)); ctx.translate(0, -46 * u); ctx.scale(u, u); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 48, 52, 7, 0, 0, TAU); ctx.fill();
    // dressing behind: balloons for a birthday
    if (S.data.occasion === 'birthday') {
      var bl = [[-36, -82, p.accent2], [5, -96, p.gold], [39, -79, mix(p.accent, '#ffffff', 0.35)]];
      for (i = 0; i < 3; i++) { var bx = bl[i][0] + Math.sin(tm * 1.1 + i * 2) * 3 * (reduce ? 0 : 1), by = bl[i][1] + Math.cos(tm * 0.9 + i) * 2.5 * (reduce ? 0 : 1) - a2 * 60 * (i + 1) * 0.5; ctx.strokeStyle = al(p.paper, 0.75); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, -34); ctx.quadraticCurveTo(bx * 0.3, by * 0.55, bx, by + 20); ctx.stroke(); balloon(ctx, bx, by, 15, bl[i][2]); }
    }
    // the box under the paper, with the light inside it
    if (a3 > 0.01) { rr(ctx, -41, -17, 82, 62, 5); ctx.fillStyle = mix(p.paper, p.gold, 0.25); ctx.fill(); }
    // body
    ctx.save(); rr(ctx, -42, -18, 84, 64, 5); var g = ctx.createLinearGradient(-42, 0, 42, 0); g.addColorStop(0, mix(C.paper, '#ffffff', 0.1)); g.addColorStop(0.7, C.paper); g.addColorStop(1, mix(C.paper, '#000000', 0.25)); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    ctx.fillStyle = mix(C.paper, '#ffffff', 0.24);
    if (S.data.occasion === 'birthday') { ctx.save(); ctx.rotate(-0.6); for (i = -8; i < 9; i++) ctx.fillRect(i * 14, -90, 5, 180); ctx.restore(); }
    else for (i = 0; i < 70; i++) { var px = -39 + (i % 7) * 13 + (Math.floor(i / 7) % 2) * 6.5, py = -13 + Math.floor(i / 7) * 9; if (S.xmas) star(ctx, px, py, 2.4, 1, 4); else if (S.data.occasion === 'love') heart(ctx, px, py, 2.6); else { ctx.beginPath(); ctx.arc(px, py, 1.7, 0, TAU); ctx.fill(); } }
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(-42, -18, 84, 5);
    // the paper tears
    if (a3 > 0.01) {
      var tears = [[[-42, -6], [-20, -12], [-14, 2], [-24, 8], [-16, 20], [-30, 26], [-42, 22]], [[42, 4], [24, -2], [18, 12], [26, 22], [14, 34], [30, 46], [42, 46]], [[-12, 46], [-6, 30], [6, 36], [10, 46]]];
      for (i = 0; i < tears.length; i++) { var k = clamp(a3 * 2.2 - i * 0.45, 0, 1); if (k <= 0) continue; var T = tears[i], ox = T[0][0], oy = T[0][1]; ctx.beginPath(); for (var j = 0; j < T.length; j++) ctx.lineTo(ox + (T[j][0] - ox) * k, oy + (T[j][1] - oy) * k); ctx.closePath(); ctx.fillStyle = mix(p.paper, p.gold, 0.2); ctx.fill(); ctx.strokeStyle = mix(C.paper, '#ffffff', 0.55); ctx.lineWidth = 1.6; ctx.stroke(); }
    }
    ctx.restore();
    // the ribbon down the body (falls away in two halves)
    function band(x, y, w, h, side) { ctx.save(); ctx.globalAlpha = 1 - a2; ctx.translate(side * a2 * 26, a2 * a2 * 70); ctx.rotate(side * a2 * 0.5); var rg = ctx.createLinearGradient(x, 0, x + w, 0); rg.addColorStop(0, C.ribH); rg.addColorStop(0.5, C.rib); rg.addColorStop(1, C.ribD); ctx.fillStyle = rg; ctx.fillRect(x, y, w, h); ctx.restore(); }
    if (a2 < 0.99) { band(-8, -18, 8, 64, -1); band(0, -18, 8, 64, 1); }
    // the lid (lifts as the paper goes), the light under it
    ctx.save(); ctx.translate(0, -10 * a3); ctx.rotate(-0.07 * a3);
    if (a3 > 0.01) { var lg = ctx.createLinearGradient(0, -20, 0, 2); lg.addColorStop(0, al('#ffffff', 0.95 * a3)); lg.addColorStop(1, al(p.gold, 0)); ctx.fillStyle = lg; ctx.fillRect(-44, -18, 88, 22); }
    rr(ctx, -47, -34, 94, 18, 4); var g2 = ctx.createLinearGradient(-47, 0, 47, 0); g2.addColorStop(0, mix(C.paper, '#ffffff', 0.2)); g2.addColorStop(0.7, mix(C.paper, '#ffffff', 0.06)); g2.addColorStop(1, mix(C.paper, '#000000', 0.2)); ctx.fillStyle = g2; ctx.fill();
    if (S.xmas) { ctx.fillStyle = al('#ffffff', 0.92); ctx.beginPath(); ctx.moveTo(-47, -30); ctx.quadraticCurveTo(-47, -36, -42, -36); ctx.lineTo(42, -36); ctx.quadraticCurveTo(47, -36, 47, -30); ctx.quadraticCurveTo(40, -25, 33, -30); ctx.quadraticCurveTo(26, -24, 17, -30); ctx.quadraticCurveTo(-6, -27, -20, -30); ctx.quadraticCurveTo(-30, -24, -38, -30); ctx.quadraticCurveTo(-43, -27, -47, -30); ctx.fill(); }
    if (a2 < 0.99) { band(-8, -34, 8, 18, -1); band(0, -34, 8, 18, 1); }
    // the bow: loosens (a1), then drops off (a2)
    ctx.save(); ctx.translate(0, -34 + a2 * a2 * 150); ctx.rotate(a2 * 1.3); ctx.globalAlpha = 1 - a2 * a2;
    function loop(side) { ctx.save(); ctx.scale(side, 1); ctx.rotate(a1 * 0.55); ctx.scale(1 + a1 * 0.12, 1 - a1 * 0.5); ctx.fillStyle = C.rib; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-8, -26, -40, -30, -36, -9); ctx.bezierCurveTo(-34, 4, -12, 5, 0, 0); ctx.fill(); ctx.fillStyle = C.ribD; ctx.beginPath(); ctx.moveTo(-6, -3); ctx.bezierCurveTo(-11, -17, -29, -20, -28, -9); ctx.bezierCurveTo(-27, -2, -13, -1, -6, -3); ctx.fill(); ctx.restore(); }
    function tail(side) { ctx.fillStyle = C.ribD; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(side * (10 + a1 * 6), 8, side * (15 + a1 * 10), 22 + a1 * 12); ctx.lineTo(side * (9 + a1 * 8), 19 + a1 * 12); ctx.lineTo(side * (5 + a1 * 8), 25 + a1 * 12); ctx.quadraticCurveTo(side * 3, 10, 0, 0); ctx.fill(); }
    tail(-1); tail(1); loop(-1); loop(1);
    ctx.fillStyle = C.ribH; rr(ctx, -6.5, -7, 13, 12, 4); ctx.fill(); ctx.fillStyle = C.rib; rr(ctx, -5, -5.5, 10, 9, 3); ctx.fill();
    ctx.restore();
    if (S.xmas && window.CarolArt && a2 < 0.5) { try { ctx.save(); ctx.globalAlpha = 1 - a2 * 2; CarolArt.prop('holly', ctx, -31, -38, 24, tm, p, { beat: 0.6, n: 0 }); ctx.restore(); } catch (e) { ctx.restore(); } }
    ctx.restore();
    // the tag: "To: <them>", on a string
    var to = S.to.length > 26 ? S.to.slice(0, 25) + '…' : S.to;
    ctx.save(); ctx.translate(17, -3); ctx.rotate(0.13 + (reduce ? 0 : Math.sin(tm * 2.3) * 0.035) + U.kick * 0.2);
    ctx.strokeStyle = al(p.paper, 0.9); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-3, 3); ctx.quadraticCurveTo(-10, -6, -16, -24 + a2 * 6); ctx.stroke();
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 5 * u; ctx.shadowOffsetY = 2 * u; ctx.fillStyle = p.paper; ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(0, 0); ctx.lineTo(40, 0); ctx.lineTo(40, 26); ctx.lineTo(0, 26); ctx.lineTo(-6, 20); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = al(p.accent, 0.55); ctx.lineWidth = 0.6; ctx.setLineDash([1.6, 1.6]); ctx.strokeRect(2.5, 2.5, 35, 21); ctx.setLineDash([]);
    ctx.fillStyle = S.dark; ctx.beginPath(); ctx.arc(-1.5, 13, 1.5, 0, TAU); ctx.fill();
    ctx.fillStyle = al(p.ink, 0.7); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = '5px "CT Sans Semi"'; ctx.fillText('TO', 5, 9);
    ctx.fillStyle = p.ink; ctx.textAlign = 'center'; fitFont(ctx, to, 'CT Hand Bold', 9, 31, 4); ctx.fillText(to, 20.5, 19.5);
    ctx.restore();
    ctx.restore();
  }
  function balloon(c, x, y, r, col) {
    var g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.15); g.addColorStop(0, mix(col, '#ffffff', 0.55)); g.addColorStop(0.5, col); g.addColorStop(1, mix(col, '#000000', 0.25));
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r * 0.86, r, 0, 0, TAU); c.fill();
    c.fillStyle = mix(col, '#000000', 0.2); c.beginPath(); c.moveTo(x, y + r * 0.96); c.lineTo(x - r * 0.16, y + r * 1.18); c.lineTo(x + r * 0.16, y + r * 1.18); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(x - r * 0.36, y - r * 0.42, r * 0.14, r * 0.26, 0.5, 0, TAU); c.fill();
  }
  function bauble(c, x, y, r, col, gold) {
    c.fillStyle = gold; rr(c, x - r * 0.2, y - r * 1.2, r * 0.4, r * 0.3, r * 0.06); c.fill(); c.strokeStyle = gold; c.lineWidth = Math.max(1, r * 0.07); c.beginPath(); c.arc(x, y - r * 1.3, r * 0.14, 0, TAU); c.stroke();
    var g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r * 1.1); g.addColorStop(0, mix(col, '#ffffff', 0.6)); g.addColorStop(0.45, col); g.addColorStop(1, mix(col, '#000000', 0.35));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); c.strokeStyle = al(gold, 0.85); c.lineWidth = r * 0.09; c.beginPath(); c.ellipse(x, y - r * 1.25, r * 1.6, r * 1.5, 0, 0.2 * PI, 0.8 * PI); c.stroke(); c.beginPath(); c.ellipse(x, y - r * 0.85, r * 1.6, r * 1.5, 0, 0.2 * PI, 0.8 * PI); c.stroke();
    c.fillStyle = al('#ffffff', 0.8); for (var i = 0; i < 7; i++) star(c, x - r * 0.84 + i * r * 0.28, y + r * 0.42 - Math.pow(i - 3, 2) * r * 0.035, r * 0.07, r * 0.03, 4); c.restore();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(x - r * 0.4, y - r * 0.45, r * 0.13, r * 0.24, 0.6, 0, TAU); c.fill();
  }
  function drawEnvelope() {
    var u = U.s / 100, p = S.pal, tm = S.tm, a1 = U.a1, a2 = U.a2, a3 = U.a3, i, paper = p.paper, sealC = lum(p.accent) > 0.75 ? p.accent2 : p.accent;
    var wig = reduce ? 0 : Math.sin(tm * 1.7) * 0.02 + Math.max(0, Math.sin(tm * 1.3) - 0.8) * 5 * Math.sin(tm * 26) * 0.03 + U.kick * Math.sin(tm * 40) * 0.06, br = reduce ? 1 : 1 + Math.sin(tm * 2.1) * 0.014;
    var gl = ctx.createRadialGradient(U.cx, U.cy, U.s * 0.1, U.cx, U.cy, U.s * 1.25); gl.addColorStop(0, al(p.gold, 0.3 + 0.25 * a3)); gl.addColorStop(1, al(p.gold, 0)); ctx.fillStyle = gl; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.translate(U.cx, U.cy); ctx.rotate(wig - 0.04); ctx.scale(br * (1 + U.kick * 0.06) * u * 1.12, br * (1 - U.kick * 0.07) * u * 1.12); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(0, 40, 54, 6, 0, 0, TAU); ctx.fill();
    var open = clamp(a3 * 1.4, 0, 1);
    function flap(k, col) { ctx.save(); ctx.translate(0, -30); ctx.scale(1, k); ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.quadraticCurveTo(8, 34, 3, 37); ctx.quadraticCurveTo(0, 39.5, -3, 37); ctx.quadraticCurveTo(-8, 34, -50, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
    if (open > 0.5) flap(-(open - 0.5) * 1.8, mix(p.accent2, '#000000', 0.1));               // the flap, open: its lining shows
    if (a3 > 0.01) { ctx.save(); ctx.translate(0, -30 * a3); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 6; rr(ctx, -43, -26, 86, 58, 3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = p.gold; ctx.lineWidth = 1.6; rr(ctx, -40, -23, 80, 52, 2); ctx.stroke(); ctx.fillStyle = p.accent; heart(ctx, 0, -8, 7); ctx.restore(); }
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; rr(ctx, -50, -30, 100, 66, 4); var g = ctx.createLinearGradient(0, -30, 0, 36); g.addColorStop(0, mix(paper, '#000000', 0.03)); g.addColorStop(1, mix(paper, '#000000', 0.1)); ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = al(p.ink, 0.14); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-49, 35); ctx.lineTo(-4, 4); ctx.moveTo(49, 35); ctx.lineTo(4, 4); ctx.stroke();
    ctx.strokeStyle = al(p.accent, 0.5); ctx.lineWidth = 1.2; ctx.setLineDash([3, 2.4]); rr(ctx, -46.5, -26.5, 93, 59, 2.5); ctx.stroke(); ctx.setLineDash([]);
    // who it is for, written on it
    var to = S.to.length > 30 ? S.to.slice(0, 29) + '…' : S.to;
    ctx.fillStyle = al(p.ink, 0.62); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = '4.2px "CT Sans Semi"'; ctx.fillText('F O R', 0, 22.6);
    ctx.fillStyle = p.ink; fitFont(ctx, to, 'CT Hand Bold', 9, 78, 4.5); ctx.fillText(to, 0, 31.6);
    if (open <= 0.5) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2; flap(1 - open * 2, mix(paper, '#000000', 0.045)); ctx.restore(); }
    // the wax seal with the mark pressed into it: cracks (a1), then breaks in two (a2)
    if (a2 < 0.99) for (i = -1; i <= 1; i += 2) {
      ctx.save(); ctx.globalAlpha = 1 - a2; ctx.translate(i * (a1 * 0.9 + a2 * 22), 3.5 + a2 * a2 * 80); ctx.rotate(i * (a1 * 0.04 + a2 * 1.1));
      ctx.beginPath(); if (i < 0) { ctx.moveTo(-20, -20); ctx.lineTo(1, -20); ctx.lineTo(-2, -7); ctx.lineTo(2.5, -1); ctx.lineTo(-1.5, 6); ctx.lineTo(1, 20); ctx.lineTo(-20, 20); } else { ctx.moveTo(20, -20); ctx.lineTo(1, -20); ctx.lineTo(-2, -7); ctx.lineTo(2.5, -1); ctx.lineTo(-1.5, 6); ctx.lineTo(1, 20); ctx.lineTo(20, 20); } ctx.closePath(); ctx.clip();
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1.5; ctx.fillStyle = sealC; ctx.beginPath(); for (var k = 0; k <= 48; k++) { var an = k / 48 * TAU, rad = 12.5 + Math.sin(an * 9 + 1) * 0.9 + Math.sin(an * 4) * 0.5; ctx.lineTo(Math.cos(an) * rad, Math.sin(an) * rad); } ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent';
      var sg = ctx.createRadialGradient(-3, -4, 1, 0, 0, 10); sg.addColorStop(0, mix(sealC, '#ffffff', 0.28)); sg.addColorStop(1, mix(sealC, '#000000', 0.12)); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 9.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = mix(sealC, '#000000', 0.28); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(0, 0, 9.4, 0, TAU); ctx.stroke();
      if (S.mark && S.mark.complete && S.mark.naturalWidth) { ctx.globalAlpha = (1 - a2) * 0.9; try { ctx.drawImage(S.mark, -6.6, -7, 13.2, 13.2); } catch (e) { /* no mark, still a seal */ } }
      ctx.restore();
    }
    if (a1 > 0.01 && a2 < 0.5) { ctx.strokeStyle = al('#000000', 0.45 * a1); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(1, -9.5); ctx.lineTo(-2, -3.5); ctx.lineTo(2.5, 2.5); ctx.lineTo(-1.5, 9.5); ctx.lineTo(1, 16); ctx.stroke(); }
    ctx.restore();
  }
  function hintFor() {
    var k = Math.floor(U.p * 4 + 1e-6); say($('h-tap'), ['Tap to open', 'Keep going', 'Nearly there', 'One more!', 'Here it comes'][Math.min(4, k)]);
    if (k > 0) say($('h-sub'), '');
  }
  function advance(amt, x, y, tap) {
    if (U.done || S.stage !== 'present') return;
    var before = Math.floor(U.p * 4 + 1e-6); U.p = Math.min(1, U.p + amt); var after = Math.floor(U.p * 4 + 1e-6);
    if (tap || after > before) {
      U.kick = 1; var C = ribbonCols(), cols = after >= 3 && S.wrap === 'present' ? [C.paper, mix(C.paper, '#ffffff', 0.4), C.rib, S.pal.paper] : festive();
      burstAt(x, y, 12 + after * 6, cols, { speed: 260 + after * 60, lift: 160, shapes: after >= 3 ? ['shard', 'rect', 'shard', 'star'] : shapesFor(), life: 1.1 });
      sfx.tap(after + U.taps % 2); if (navigator.vibrate) { try { navigator.vibrate(after >= 4 ? [20, 40, 60] : 12); } catch (e) { /* not allowed here */ } }
      hintFor();
    } else if (Math.random() < 0.2) sfx.rustle();
    if (tap) U.taps++;
    if (U.p >= 1) { U.done = true; U.t0 = performance.now(); }
  }
  function firstTouch() {
    if (S.touched) return; S.touched = true;
    ac(); if (AC && AC.state !== 'running') AC.resume().catch(noop);
    if (window.SAC) SAC.hold('playing', true);
    // bless the song for iOS: a silent play inside this gesture lets it start later, when the present bursts
    if (S.data.song) { audio.muted = true; var pr = audio.play(); if (pr && pr.then) pr.then(function () { if (S.stage !== 'play' || !clk.on) { audio.pause(); try { audio.currentTime = 0; } catch (e) { /* not seekable yet */ } } audio.muted = S.muted; }).catch(function () { audio.muted = S.muted; }); }
    learnKey();
    if (!reduce && window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') show($('motion'), true);
  }
  var lastA = null, lastJolt = 0;
  function onMotion(e) {
    var a = e.accelerationIncludingGravity || e.acceleration; if (!a || a.x == null || S.stage !== 'present') return;
    if (lastA) { var d = Math.abs(a.x - lastA.x) + Math.abs(a.y - lastA.y) + Math.abs(a.z - lastA.z), now = performance.now(); if (d > 26 && now - lastJolt > 260) { lastJolt = now; firstTouchSoft(); advance(0.2, U.cx + (Math.random() - 0.5) * U.s * 0.6, U.cy - U.s * 0.1, true); } }
    lastA = { x: a.x, y: a.y, z: a.z };
  }
  function firstTouchSoft() { if (window.SAC) SAC.hold('playing', true); }
  function listenMotion() { if (reduce || !window.DeviceMotionEvent || S.motion) return; S.motion = true; window.addEventListener('devicemotion', onMotion); }

  /* ---------- stage 2: the burst, then the card ---------- */
  function fitCard() {
    var ar = VH / VW, R;
    if (VW < 700 && ar >= 1.5 && ar <= 2.4) R = { x: 0, y: 0, w: VW, h: VH, full: true };                               // a phone held upright: the whole screen
    else if (VW > VH && VH < 560) { var s = VH; R = { x: (VW - s) / 2, y: 0, w: s, h: s, full: false, flush: true }; }   // a phone on its side: the square cut
    else { var m = VW >= 700 ? 22 : 0, h = Math.min(VH - m * 2, (VW - m * 2) * 16 / 9), w = h * 9 / 16; R = { x: (VW - w) / 2, y: (VH - h) / 2, w: w, h: h, full: false }; }
    S.R = R; var st = document.documentElement.style; st.setProperty('--cx', R.x + 'px'); st.setProperty('--cy', R.y + 'px'); st.setProperty('--cw', R.w + 'px'); st.setProperty('--ch', R.h + 'px');
    var hud = $('hud').style; hud.setProperty('--ht', R.full || R.flush ? 'var(--st)' : '0px'); hud.setProperty('--hb', R.full || R.flush ? 'var(--sb)' : '0px'); hud.setProperty('--hr', R.full ? 'var(--sr)' : '0px');
  }
  function drawCard(t, k) {   // k: 0..1 how far the card has come out of the present
    var R = S.R, e = k >= 1 ? 1 : outBack(k), sc = lerp(0.2, 1, e), cx = lerp(U.cx, R.x + R.w / 2, outCubic(k)), cy = lerp(U.cy, R.y + R.h / 2, outCubic(k)), rad = R.full ? 0 : Math.min(22, R.w * 0.04);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-R.w / 2, -R.h / 2);
    if (!R.full || k < 1) { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14; rr(ctx, 0, 0, R.w, R.h, rad || 18 * (1 - k)); ctx.fillStyle = S.pal.bg; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; rr(ctx, 0, 0, R.w, R.h, rad || 18 * (1 - k)); ctx.clip(); }
    if (!S.video) { try { CarolEngine.draw(ctx, R.w, R.h, S.card, t, S.env); S.drew = true; } catch (err) { ctx.restore(); return engineBroke(err); } }
    ctx.restore();
    if (!R.full && k >= 1) { ctx.save(); ctx.strokeStyle = al(S.pal.paper, 0.35); ctx.lineWidth = 1.5; rr(ctx, R.x, R.y, R.w, R.h, rad); ctx.stroke(); ctx.restore(); }
  }
  function engineBroke(err) { if (TEST && window.console) console.error('engine: ' + (err && err.message)); toVideo(); }
  function startBurst() {
    S.stage = 'burst'; S.b0 = performance.now(); document.body.classList.add('gone'); cv.setAttribute('aria-label', 'The card. Tap a character, or tap anywhere else to pause.');
    setTimeout(function () { show($('addr'), false); show($('hint'), false); }, 500);
    if (!reduce) { burstAt(U.cx, U.cy, 150, festive(), { speed: 760, lift: 380, size: 8, life: 2.4, shapes: shapesFor(), drag: 1.5 }); burstAt(U.cx, U.cy, 40, [ribbonCols().paper, S.pal.paper], { speed: 520, lift: 300, size: 11, life: 1.6, shapes: ['shard'] }); }
    sfx.burst();
    if (!S.opened) { S.opened = true; if (window.SAC && !AT) SAC.call('/api/card/' + NAME + '/open', {}).catch(noop); }
    setTimeout(startPlay, reduce ? 150 : 780);
  }
  function drawBurst(now) {
    var b = (now - S.b0) / 1000, k = reduce ? 1 : clamp((b - 0.12) / 0.75, 0, 1);
    backdrop(0.5 + (S.R.full ? 0 : 0.24 * k), true);
    if (!reduce && b < 0.45) { ctx.save(); ctx.globalAlpha = 1 - b / 0.45; var sc = 1 + b * 1.4; ctx.translate(U.cx, U.cy); ctx.scale(sc, sc); ctx.translate(-U.cx, -U.cy); (S.wrap === 'envelope' ? drawEnvelope : drawPresent)(); ctx.restore(); }
    if (!reduce) { ctx.save(); ctx.translate(U.cx, U.cy); ctx.rotate(b * 0.8); ctx.fillStyle = al(S.pal.gold, 0.28 * clamp(1 - b / 0.9, 0, 1)); for (var i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-VW * 0.09, -VH * 1.2); ctx.lineTo(VW * 0.09, -VH * 1.2); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    if (!S.video) drawCard(0, k);
    if (!reduce && b < 0.7) { var f = ctx.createRadialGradient(U.cx, U.cy, 0, U.cx, U.cy, Math.max(VW, VH) * (0.2 + b * 1.6)); f.addColorStop(0, al('#ffffff', 0.95 * (1 - b / 0.7))); f.addColorStop(1, al(S.pal.gold, 0)); ctx.fillStyle = f; ctx.fillRect(0, 0, VW, VH); }
    if (b > (reduce ? 0.2 : 1.0) && S.stage === 'burst') S.stage = 'play';
  }
  function startPlay() {
    if (S.stage !== 'burst' && S.stage !== 'play') S.stage = 'play';
    if (S.songBad && !S.video) toVideo();
    if (S.video) show($('video'), true);
    show($('hud'), !S.video); show($('end'), false); $('end').classList.remove('on'); show($('gbar'), false); show($('gtip'), false); show($('score'), false);
    if (window.SAC) SAC.hold('playing', true);
    clk.t = 0; clk.wait = 0; S.env.interact.poke = null; setPaused(false);
    if (S.video) { var v = $('video'); try { v.currentTime = 0; } catch (e) { /* not loaded yet */ } v.play().catch(noop); return; }
    try { audio.currentTime = 0; } catch (e) { /* not seekable yet */ }
    playSong();
    if (!S.hinted) { S.hinted = true; var who = S.tpl && (S.tpl.cast || []).filter(function (c) { return c.kind === 'character'; })[0]; say($('toy'), (who ? 'Tap the ' + pretty(who.name) + '. ' : 'Tap the characters. ') + (S.xmas ? 'Swipe to make it snow.' : 'Swipe to make it sparkle.')); setTimeout(function () { $('toy').classList.add('on'); }, 1600); setTimeout(function () { $('toy').classList.remove('on'); }, 8200); }
  }
  function playSong() {
    clk.on = true; clk.silent = !S.data.song;
    if (!S.data.song) return;
    audio.muted = S.muted; var pr = audio.play();
    if (pr && pr.catch) pr.catch(function () { if (AT) { clk.silent = true; return; } setPaused(true, 'Tap to play with sound'); });   // no gesture yet (opened by a shake): one tap starts it
  }
  function setPaused(on, why) {
    S.paused = on; document.body.classList.toggle('paused', !!on); say($('big-say'), why || '');
    if (on) { clk.on = false; audio.pause(); } else if (S.stage === 'play' && !clk.on) playSong();
  }
  function tickClock(dt) {
    if (!clk.on) return;
    if (clk.silent) { clk.t += dt; return; }
    if (audio.paused || audio.readyState < 3) { clk.wait += dt; if (clk.wait > 9 && clk.t < 0.5 && S.stage === 'play') toVideo(); return; }
    clk.wait = 0; var a = audio.currentTime; clk.t += dt; if (Math.abs(clk.t - a) > 0.12) clk.t = a; else clk.t += (a - clk.t) * 0.12;
  }
  function drawPlay(dt) {
    var I = S.env.interact; I.snow *= Math.exp(-dt * 1.3); I.dance *= Math.exp(-dt * 1.6);
    if (!S.R.full) backdrop(0.74, true);
    if (S.video) return;
    drawCard(clk.t, 1);
    $('bar').firstElementChild.style.transform = 'scaleX(' + clamp(clk.t / clk.dur, 0, 1).toFixed(4) + ')';
    if (clk.on && (clk.t >= clk.dur - 0.03 || audio.ended)) toEnd();
  }
  function toVideo() {
    if (S.video || !S.data || !S.data.story) return; S.video = true; audio.pause(); clk.on = false;
    var v = $('video'); v.src = S.data.story; v.poster = S.data.poster; show(v, S.stage === 'play' || S.stage === 'burst'); show($('hud'), false); document.body.classList.remove('paused');
    v.onended = toEnd; if (S.stage === 'play') v.play().catch(noop);
  }
  function tapCard(x, y) {
    if (S.paused) return setPaused(false);
    var R = S.R, name = null; try { name = CarolEngine.hit(S.card, R.w, R.h, clk.t, x - R.x, y - R.y); } catch (e) { name = null; }
    if (name) { S.env.interact.poke = { name: name, at: clk.t }; S.env.interact.dance = 1; sfx.poke(); burstAt(x, y, 10, festive(), { speed: 200, lift: 120, size: 5, life: 0.8, shapes: ['spark', 'star', 'dot'] }); $('toy').classList.remove('on'); return; }
    if (x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.h) setPaused(true);
  }

  /* ---------- stage 3: the end screen and its two games ---------- */
  function orbCols() { var p = S.pal; return [p.accent, p.gold, p.accent2, mix(p.accent, '#ffffff', 0.35), mix(p.accent2, '#ffffff', 0.3), mix(p.gold, p.accent, 0.5), mix(p.accent, p.bg2, 0.4), p.paper]; }
  function makeOrbs(game) {
    var n = S.env.images.length, cols = orbCols(), r = clamp(Math.min(VW, VH) * (n > 5 ? 0.095 : 0.125), 36, 78), top = game ? 96 : 20, bot = game ? 120 : 20; S.orbs = [];
    for (var i = 0; i < n; i++) { var an = i * 2.4 + 0.7; S.orbs.push({ i: i, x: VW * (0.5 + 0.34 * Math.cos(an) * (0.5 + (i % 3) * 0.25)), y: lerp(top + r, VH - bot - r, n === 1 ? 0.45 : (i * 0.618 + 0.2) % 1), vx: Math.cos(an * 1.7) * 26, vy: Math.sin(an * 1.3) * 20, r: r * (0.9 + (i % 3) * 0.08), col: cols[i % cols.length], ph: i * 1.9, popped: false, top: top, bot: bot }); }
  }
  function stepOrbs(dt, alpha) {
    var O = S.orbs, i, j;
    for (i = 0; i < O.length; i++) {
      var o = O[i]; if (o.popped) continue;
      if (!reduce) { o.x += o.vx * dt; o.y += o.vy * dt; }
      for (j = i + 1; j < O.length; j++) { var q = O[j]; if (q.popped) continue; var dx = q.x - o.x, dy = q.y - o.y, d = Math.sqrt(dx * dx + dy * dy) || 1, need = (o.r + q.r) * 1.12; if (d < need) { var f = (need - d) / need * 60; o.vx -= dx / d * f * dt * 4; o.vy -= dy / d * f * dt * 4; q.vx += dx / d * f * dt * 4; q.vy += dy / d * f * dt * 4; } }
      var sp = Math.sqrt(o.vx * o.vx + o.vy * o.vy) || 1, want = 30; o.vx *= lerp(1, want / sp, 0.02); o.vy *= lerp(1, want / sp, 0.02);
      if (o.x < o.r + 6) { o.x = o.r + 6; o.vx = Math.abs(o.vx); } if (o.x > VW - o.r - 6) { o.x = VW - o.r - 6; o.vx = -Math.abs(o.vx); }
      if (o.y < o.top + o.r * 1.35) { o.y = o.top + o.r * 1.35; o.vy = Math.abs(o.vy); } if (o.y > VH - o.bot - o.r * 1.3) { o.y = VH - o.bot - o.r * 1.3; o.vy = -Math.abs(o.vy); }
      var bob = reduce ? 0 : Math.sin(S.tm * 1.6 + o.ph) * 5, sw = reduce ? 0 : Math.sin(S.tm * 1.2 + o.ph) * 0.09;
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(o.x, o.y + bob); ctx.rotate(sw);
      if (S.xmas) bauble(ctx, 0, 0, o.r, o.col, S.pal.gold); else { ctx.strokeStyle = al(S.pal.paper, 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, o.r * 1.18); ctx.bezierCurveTo(o.r * 0.3, o.r * 1.6, -o.r * 0.3, o.r * 1.9, 0, o.r * 2.4); ctx.stroke(); balloon(ctx, 0, 0, o.r, o.col); }
      ctx.restore();
    }
  }
  function toEnd() {
    S.stage = 'end'; clk.on = false; audio.pause(); S.rev = null; S.G = null; document.body.classList.remove('paused');
    show($('hud'), false); show($('video'), false); try { $('video').pause(); } catch (e) { /* never played */ } show($('gbar'), false); show($('gtip'), false); show($('score'), false);
    show($('end'), true); requestAnimationFrame(function () { $('end').classList.add('on'); });
    if (S.orbs.length !== S.env.images.length || S.orbs.some(function (o) { return o.popped || o.top > 50; })) makeOrbs(false);
    if (window.SAC) SAC.hold('playing', false);
    fetchShareFile(); cv.setAttribute('aria-label', 'The card has finished.');
  }
  function leaveEnd() { $('end').classList.remove('on'); show($('end'), false); if (window.SAC) SAC.hold('playing', true); }
  function drawEnd(dt) { backdrop(0.66, true); scrims(0.7, 0.5); if (VW >= 760 && VH >= 560) stepOrbs(dt, 0.95); }

  // --- pop the ornaments (christmas) / balloons (any other occasion): one per photo, each hides its photo
  function startPop() {
    if (!S.env.images.length) return; leaveEnd(); S.stage = 'pop'; S.popped = 0; S.rev = null; S.tray = []; makeOrbs(true);
    say($('g-title'), S.xmas ? 'Pop the ornaments' : 'Pop the balloons'); show($('gbar'), true); show($('gtip'), true); popSay();
  }
  function popSay() { var n = S.orbs.length; say($('g-n'), S.popped + ' / ' + n); say($('gtip'), S.rev ? (S.popped >= n ? 'That is all of them. Tap to finish.' : 'Tap to keep popping') : 'Tap one to pop it'); }
  function tapPop(x, y) {
    var now = performance.now();
    if (S.rev) { if (!S.rev.closing && now - S.rev.t0 > 350) { S.rev.closing = now; } return; }
    var best = null, bd = 1e9; S.orbs.forEach(function (o) { if (o.popped) return; var d = Math.hypot(o.x - x, o.y - y); if (d < o.r * 1.25 && d < bd) { bd = d; best = o; } });
    if (!best) return;
    best.popped = true; S.popped++; sfx.pop(); if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) { /* not allowed here */ } }
    burstAt(best.x, best.y, 26, [best.col, mix(best.col, '#ffffff', 0.5), mix(best.col, '#000000', 0.2)], { speed: 420, size: best.r * 0.16, life: 0.9, shapes: ['shard'], g: 700 });
    burstAt(best.x, best.y, 36, festive(), { speed: 520, lift: 200, size: 6, life: 1.6, shapes: shapesFor() });
    S.rev = { o: best, t0: now, closing: 0 }; popSay();
  }
  function traySlot(i) { var n = S.orbs.length, sz = Math.min(50, (VW - 40) / n - 8), w = n * (sz + 8) - 8; return { x: VW / 2 - w / 2 + i * (sz + 8), y: VH - 96 - sz / 2, s: sz }; }
  function drawPhotoCover(img, x, y, w, h) { var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; if (!iw || !ih) { ctx.fillStyle = S.pal.bg2; ctx.fillRect(x, y, w, h); return; } var s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s; ctx.drawImage(img, (iw - sw) / 2, (ih - sh) * 0.35, sw, sh, x, y, w, h); }
  function drawPop(dt, now) {
    backdrop(0.5, true);
    var n = S.orbs.length, i, sl;
    for (i = 0; i < n; i++) { sl = traySlot(i); ctx.save(); rr(ctx, sl.x, sl.y, sl.s, sl.s, 10); if (S.tray.indexOf(i) >= 0 && S.env.images[i]) { ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.clip(); drawPhotoCover(S.env.images[i], sl.x + 3, sl.y + 3, sl.s - 6, sl.s - 6); } else { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); } ctx.restore(); }
    stepOrbs(dt, 1);
    var rv = S.rev; if (!rv) return;
    var img = S.env.images[rv.o.i], cap = (S.card.scenes && S.card.scenes[rv.o.i] && S.card.scenes[rv.o.i].caption) || '', open = clamp((now - rv.t0) / 480, 0, 1), close = rv.closing ? clamp((now - rv.closing) / 300, 0, 1) : 0;
    var asp = img && img.naturalWidth ? clamp(img.naturalWidth / img.naturalHeight, 0.72, 1.4) : 0.8, pw = Math.min(VW * 0.82, 460), bd = pw * 0.055, foot = cap ? pw * 0.2 : bd * 1.5, ph = (pw - bd * 2) / asp, th = bd + ph + foot, maxH = VH - 250;
    if (th > maxH) { var k = maxH / th; pw *= k; bd *= k; foot *= k; ph *= k; th = maxH; }
    var e = reduce ? open : outBack(open), tx = VW / 2, ty = Math.max(96 + th / 2, VH * 0.46), cx = lerp(rv.o.x, tx, outCubic(open)), cy = lerp(rv.o.y, ty, outCubic(open)), sc = lerp(0.1, 1, e), rot = lerp(0.5, -0.035, outCubic(open));
    if (close) { sl = traySlot(rv.o.i); var c2 = outCubic(close); cx = lerp(tx, sl.x + sl.s / 2, c2); cy = lerp(ty, sl.y + sl.s / 2, c2); sc = lerp(1, sl.s / pw, c2); rot *= 1 - c2; }
    ctx.fillStyle = al(S.dark, 0.55 * open * (1 - close)); ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; ctx.fillStyle = '#fffdf8'; rr(ctx, -pw / 2, -th / 2, pw, th, pw * 0.02); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    if (img) drawPhotoCover(img, -pw / 2 + bd, -th / 2 + bd, pw - bd * 2, ph);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1; ctx.strokeRect(-pw / 2 + bd, -th / 2 + bd, pw - bd * 2, ph);
    if (cap) { ctx.fillStyle = S.pal.ink && lum(S.pal.ink) < 0.5 ? S.pal.ink : '#2a1a2e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; var fam = (S.tpl && S.tpl.look.fonts && S.tpl.look.fonts.caption) || 'CT Hand'; fitFont(ctx, cap, fam, pw * 0.095, pw - bd * 3, 10); ctx.fillText(cap, 0, th / 2 - foot / 2 - bd * 0.1); }
    ctx.save(); ctx.translate(0, -th / 2); ctx.rotate(-0.05); ctx.fillStyle = al(S.pal.accent, 0.8); ctx.fillRect(-pw * 0.13, -pw * 0.03, pw * 0.26, pw * 0.065); ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (i = 0; i < 6; i++) ctx.fillRect(-pw * 0.13 + i * pw * 0.045 + 3, -pw * 0.03, pw * 0.018, pw * 0.065); ctx.restore();
    ctx.restore();
    if (close >= 1) { S.tray.push(rv.o.i); S.rev = null; if (S.popped >= n) { say($('t-pop-s'), 'All ' + n + ' popped. Again?'); sfx.win(); setTimeout(function () { if (S.stage === 'pop') toEnd(); }, 900); say($('gtip'), 'All popped!'); say($('g-n'), n + ' / ' + n); } else popSay(); }
  }

  // --- ring the bells in time (drums for any other occasion): the hook plays again, tap on its beats
  function hookSpan() {
    var pl = CarolEngine.plan(S.card), L = pl.lines || [], i, a = -1, b = -1;
    for (i = 0; i < L.length; i++) { if (L[i].section === 'hook') { if (a < 0) a = i; b = i; } else if (a >= 0) break; }
    if (a < 0 && L.length) { a = Math.max(0, L.length - 2); b = L.length - 1; }
    var D = pl.duration, h0 = a >= 0 ? L[a].t0 : D * 0.4, h1 = a >= 0 ? L[b].t1 : D * 0.8; if (h1 - h0 < 7) h1 = Math.min(D - 0.4, h0 + 8); if (h1 - h0 < 5) h0 = Math.max(0.5, h1 - 8); if (h1 - h0 > 15) h1 = h0 + 15;
    var beats = (pl.beats && pl.beats.length >= 4 ? pl.beats : []).slice(), per = 60 / (pl.bpm || 100); if (!beats.length) for (var t = 0.5; t < D; t += per) beats.push(t);
    var iv = []; for (i = 1; i < beats.length; i++) iv.push(beats[i] - beats[i - 1]); iv.sort(function (x, y) { return x - y; }); per = iv[Math.floor(iv.length / 2)] || per;
    var tg = beats.filter(function (x) { return x >= h0 - 0.02 && x <= h1 + 0.02; }); if (per < 0.42) tg = tg.filter(function (x, k) { return k % 2 === 0; });
    return { h0: h0, h1: h1, per: per, targets: tg, lines: L.slice(Math.max(0, a), b + 1), start: Math.max(0, h0 - per * 4) };
  }
  function startBells(skip) {
    var H; try { H = hookSpan(); } catch (e) { return; } if (H.targets.length < 3) return;
    leaveEnd(); S.stage = 'bells'; show($('score'), false);
    S.G = { H: H, T: H.targets.map(function (t) { return { t: t, s: 0 }; }), score: 0, hits: 0, combo: 0, best: 0, fb: null, ring: [-9, -9, -9], over: false, tEnd: H.targets[H.targets.length - 1] + 0.7 };
    say($('g-title'), S.xmas ? 'Ring the bells in time' : 'Drum in time'); say($('g-n'), '0'); show($('gbar'), true); show($('gtip'), true); say($('gtip'), 'Tap anywhere on the beat');
    clk.t = H.start + (skip || 0); clk.on = true; clk.silent = !S.data.song || S.video; clk.wait = 0;
    if (!clk.silent) { try { audio.currentTime = clk.t; } catch (e) { /* not seekable */ } audio.muted = S.muted; audio.volume = 1; var pr = audio.play(); if (pr && pr.catch) pr.catch(function () { clk.silent = true; }); }
  }
  function tapBells(x) {
    var G = S.G; if (!G || G.over) return;
    var t = clk.t, best = null, bd = 9, i, which = x < VW * 0.36 ? 0 : x > VW * 0.64 ? 2 : 1; G.ring[which] = S.tm;
    if (S.xmas) sfx.bell(which); else sfx.drum(which);
    for (i = 0; i < G.T.length; i++) { var d = Math.abs(G.T[i].t - t); if (!G.T[i].s && d < bd) { bd = d; best = G.T[i]; } }
    var lx = VW * 0.24, ly = laneY();
    if (best && bd <= 0.12) { var perfect = bd <= 0.055; best.s = perfect ? 2 : 1; G.hits++; G.combo++; G.best = Math.max(G.best, G.combo); G.score += (perfect ? 100 : 60) + Math.min(G.combo, 10) * 5; G.fb = { text: perfect ? 'Perfect' : 'Good', at: S.tm, good: true }; burstAt(lx, ly, perfect ? 16 : 8, festive(), { speed: 260, lift: 100, size: 5, life: 0.7, shapes: ['spark', 'star', 'dot'] }); say($('g-n'), String(G.score)); }
    else { G.combo = 0; G.fb = { text: best && bd < 0.3 ? (best.t > t ? 'Early' : 'Late') : 'Wait for it', at: S.tm, good: false }; }
  }
  function laneY() { return VH > 520 ? VH * 0.4 : VH * 0.36; }
  function drawBells(dt) {
    backdrop(0.6, true);
    var G = S.G, H = G.H, t = clk.t, p = S.pal, i, lx = VW * 0.24, ly = laneY(), speed = Math.max(170, VW * 0.42), beat = 9;
    // the words being sung
    var line = null; for (i = 0; i < H.lines.length; i++) if (t >= H.lines[i].t0 - 0.3) line = H.lines[i];
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12;
    var fam = (S.tpl && S.tpl.look.fonts && S.tpl.look.fonts.lyric) || 'CT Serif', say1 = line ? line.text : 'Get ready…'; fitFont(ctx, say1, fam, Math.min(34, VW * 0.07), VW - 40, 13); ctx.fillText(say1, VW / 2, VH > 520 ? VH * 0.21 : VH * 0.2); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    // the lane
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; rr(ctx, 14, ly - 5, VW - 28, 10, 5); ctx.fill();
    for (i = 0; i < G.T.length; i++) {
      var T = G.T[i], d = T.t - t; if (!T.s && d < -0.12) { T.s = -1; G.combo = 0; G.fb = { text: 'Missed', at: S.tm, good: false }; }
      if (Math.abs(d) < Math.abs(beat)) beat = d;
      var x = lx + d * speed; if (x < -30 || x > VW + 30) continue; if (T.s > 0) continue;
      ctx.save(); ctx.globalAlpha = T.s < 0 ? 0.3 : 1; ctx.translate(x, ly); ctx.fillStyle = T.s < 0 ? '#ffffff' : p.gold; ctx.shadowColor = al(p.gold, 0.8); ctx.shadowBlur = T.s < 0 ? 0 : 12; star(ctx, 0, 0, 13, 6, 4); ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill(); ctx.restore();
    }
    var pulse = Math.exp(-Math.abs(beat) * 9);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 + pulse * 3; ctx.beginPath(); ctx.arc(lx, ly, 20 + pulse * 5, 0, TAU); ctx.stroke(); ctx.strokeStyle = al(p.gold, 0.9); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(lx, ly, 27 + pulse * 7, 0, TAU); ctx.stroke();
    if (G.fb && S.tm - G.fb.at < 0.7) { var fa = S.tm - G.fb.at; ctx.globalAlpha = clamp(1 - fa / 0.7, 0, 1); ctx.fillStyle = G.fb.good ? p.gold : '#ffffff'; ctx.font = (G.fb.good ? 26 : 19) + 'px "CT Sans Bold"'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8; ctx.textAlign = 'left'; ctx.fillText(G.fb.text, lx + 42, ly - 34 - fa * 24); ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.textAlign = 'center'; }
    if (G.combo >= 3) { ctx.fillStyle = '#ffffff'; ctx.font = '15px "CT Sans Semi"'; ctx.fillText(G.combo + ' in a row', VW / 2, ly + 40); }
    // the bells (or drums): they pulse on every beat and swing when rung
    var by = VH > 520 ? VH * 0.69 : VH * 0.72, bs = Math.min(VW * 0.27, VH * 0.24, 170);
    for (i = 0; i < 3; i++) {
      var bx = VW * (0.5 + (i - 1) * Math.min(0.31, 240 / VW)), age = S.tm - G.ring[i], swing = age < 1.2 ? Math.sin(age * 22) * 0.36 * Math.exp(-age * 3.6) : 0, sc = 1 + pulse * 0.07 + (age < 0.2 ? (0.2 - age) * 0.7 : 0);
      ctx.save(); ctx.translate(bx, by - bs * 0.5); ctx.rotate(swing); ctx.translate(0, bs * 0.5); ctx.scale(sc, sc);
      ctx.fillStyle = al(p.gold, 0.1 + pulse * 0.22); ctx.beginPath(); ctx.arc(0, 0, bs * 0.52, 0, TAU); ctx.fill();
      if (S.xmas) drawBell(ctx, 0, 0, bs, i); else drawDrum(ctx, 0, 0, bs, i);
      ctx.restore();
    }
    if (!G.over && t >= G.tEnd) endBells();
  }
  function drawBell(c, x, y, s, i) {
    var ok = false; if (window.CarolArt && CarolArt.props && CarolArt.props.indexOf('bell') >= 0) { try { CarolArt.prop('bell', c, x, y, s, S.tm, S.pal, { beat: 0.6, n: i }); ok = true; } catch (e) { ok = false; } }
    if (ok) return; var p = S.pal, r = s * 0.36;
    c.fillStyle = p.gold; c.beginPath(); c.moveTo(x - r, y + r * 0.7); c.quadraticCurveTo(x - r * 0.8, y - r * 0.2, x - r * 0.45, y - r * 0.8); c.quadraticCurveTo(x, y - r * 1.25, x + r * 0.45, y - r * 0.8); c.quadraticCurveTo(x + r * 0.8, y - r * 0.2, x + r, y + r * 0.7); c.closePath(); c.fill(); c.fillStyle = mix(p.gold, '#000000', 0.25); c.beginPath(); c.arc(x, y + r * 0.85, r * 0.2, 0, TAU); c.fill();
  }
  function drawDrum(c, x, y, s, i) {
    var p = S.pal, w = s * 0.7, h = s * 0.46, col = [p.accent, p.accent2, mix(p.accent, p.gold, 0.5)][i % 3];
    c.fillStyle = mix(col, '#000000', 0.15); c.beginPath(); c.ellipse(x, y + h * 0.5, w / 2, w * 0.17, 0, 0, TAU); c.fill();
    var g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, mix(col, '#ffffff', 0.2)); g.addColorStop(0.6, col); g.addColorStop(1, mix(col, '#000000', 0.3)); c.fillStyle = g; c.fillRect(x - w / 2, y - h * 0.5, w, h);
    c.strokeStyle = p.paper; c.lineWidth = s * 0.02; c.beginPath(); for (var k = 0; k <= 6; k++) c.lineTo(x - w / 2 + k * w / 6, y + (k % 2 ? 0.34 : -0.34) * h); c.stroke();
    c.fillStyle = p.gold; c.beginPath(); c.ellipse(x, y - h * 0.5, w / 2 + s * 0.02, w * 0.19, 0, 0, TAU); c.fill(); c.fillStyle = p.paper; c.beginPath(); c.ellipse(x, y - h * 0.5, w / 2 - s * 0.015, w * 0.155, 0, 0, TAU); c.fill();
    c.strokeStyle = p.gold; c.lineWidth = s * 0.035; c.beginPath(); c.ellipse(x, y + h * 0.5, w / 2, w * 0.17, 0, 0.04 * PI, 0.96 * PI); c.stroke();
  }
  function endBells() {
    var G = S.G; G.over = true; clk.on = false; var n = G.T.length, ratio = G.hits / n, stars = ratio >= 0.85 ? 3 : ratio >= 0.55 ? 2 : ratio >= 0.25 ? 1 : 0, v = 1;
    var fade = setInterval(function () { v -= 0.1; if (v <= 0) { clearInterval(fade); audio.pause(); audio.volume = 1; } else audio.volume = v; }, 40);
    S.best = Math.max(S.best, G.score); show($('gtip'), false);
    say($('s-h'), ['Keep at it', 'Nice ringing', 'Lovely timing', 'Pitch perfect'][stars]); if (!S.xmas) say($('s-h'), ['Keep at it', 'Nice drumming', 'Lovely timing', 'Right on the beat'][stars]);
    say($('s-pts'), String(G.score)); say($('s-say'), 'You hit ' + G.hits + ' of ' + n + ' beats' + (G.best >= 3 ? ', ' + G.best + ' in a row.' : '.'));
    var st = $('s-stars').children; for (var i = 0; i < 3; i++) st[i].setAttribute('class', i < stars ? 'on' : ''); $('s-stars').setAttribute('aria-label', stars + ' of 3 stars');
    say($('t-bell-s'), 'Best: ' + S.best + '. Again?'); show($('score'), true); if (stars >= 2) { sfx.win(); burstAt(VW / 2, VH * 0.3, 80, festive(), { speed: 520, lift: 200, life: 2, shapes: shapesFor() }); } $('s-again').focus();
  }

  /* ---------- save, share, report ---------- */
  function fetchShareFile() {
    if (S.file || S.fileAsked || !navigator.canShare || !window.File) return; S.fileAsked = true;
    try { if (!navigator.canShare({ files: [new File([''], 'a.mp4', { type: 'video/mp4' })] })) return; } catch (e) { return; }
    fetch(S.data.story).then(function (r) { return r.ok ? r.blob() : Promise.reject(); }).then(function (b) { S.file = new File([b], NAME + '.mp4', { type: 'video/mp4' }); }).catch(noop);
  }
  function shareNow() {
    var d = S.data, title = d.title || 'A singing card', done = function () { }, sheet = function () { copyLink(true); openSheet('sh-share'); };
    if (!navigator.share) return sheet();
    var withFile = S.file && navigator.canShare && navigator.canShare({ files: [S.file] });
    navigator.share(withFile ? { files: [S.file], title: title, text: title + ' ' + d.url } : { title: title, text: title, url: d.url }).then(done, function (e) { if (e && e.name === 'AbortError') return; if (withFile) navigator.share({ title: title, text: title, url: d.url }).catch(function (e2) { if (!e2 || e2.name !== 'AbortError') sheet(); }); else sheet(); });
  }
  function copyLink(quiet) {
    var url = S.data.url, ok = function () { var b = $('sh-copy'); b.classList.add('ok'); say(b, 'Copied'); say($('share-say'), 'Link copied'); clearTimeout(S.copyT); S.copyT = setTimeout(function () { b.classList.remove('ok'); say(b, 'Copy link'); say($('share-say'), 'Share'); }, 2600); };
    var old = function () { var ta = document.createElement('textarea'); ta.value = url; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-99px;top:0;opacity:0'; document.body.appendChild(ta); ta.select(); var good = false; try { good = document.execCommand('copy'); } catch (e) { good = false; } ta.remove(); if (good) ok(); else if (!quiet) say($('sh-copy'), 'Press and hold the link'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, old); else old();
  }
  var sheetBack = null;
  function openSheet(id) { var s = $(id); sheetBack = document.activeElement; show(s, true); requestAnimationFrame(function () { s.classList.add('on'); var f = s.querySelector('.x'); if (f) f.focus(); }); }
  function closeSheet(s) { s.classList.remove('on'); setTimeout(function () { show(s, false); }, 260); if (sheetBack && sheetBack.focus) sheetBack.focus(); }
  function wire() {
    var d = S.data, e = encodeURIComponent, title = d.title || 'A singing card', line = title + ' ' + d.url;
    $('save').href = '/' + NAME + '/story.mp4?dl=1'; $('square').href = '/' + NAME + '/square.mp4?dl=1'; say($('sh-url'), d.url.replace(/^https?:\/\//, ''));
    $('w-wa').href = 'https://wa.me/?text=' + e(line); $('w-fb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + e(d.url); $('w-x').href = 'https://twitter.com/intent/tweet?text=' + e(title) + '&url=' + e(d.url);
    $('w-sms').href = 'sms:?&body=' + e(line); $('w-mail').href = 'mailto:?subject=' + e(title) + '&body=' + e(line);
    $('share').onclick = shareNow; $('more').onclick = function () { openSheet('sh-share'); }; $('sh-copy').onclick = function () { copyLink(false); };
    $('again').onclick = function () { leaveEnd(); S.stage = 'play'; startPlay(); }; $('t-pop').onclick = startPop; $('t-bell').onclick = function () { startBells(0); };
    $('g-x').onclick = toEnd; $('s-done').onclick = toEnd; $('s-again').onclick = function () { startBells(0); };
    $('mute').onclick = function () { S.muted = !S.muted; audio.muted = S.muted; $('video').muted = S.muted; if (master) master.gain.value = S.muted ? 0 : 0.9; $('mute').classList.toggle('muted', S.muted); $('mute').setAttribute('aria-pressed', String(S.muted)); $('mute').setAttribute('aria-label', S.muted ? 'Sound on' : 'Mute'); };
    $('motion').onclick = function () { show($('motion'), false); try { DeviceMotionEvent.requestPermission().then(function (r) { if (r === 'granted') { listenMotion(); say($('h-sub'), 'Now give it a shake'); } }).catch(noop); } catch (err) { /* no motion on this device */ } };
    Array.prototype.forEach.call(document.querySelectorAll('.scrim'), function (s) { s.addEventListener('click', function (ev) { if (ev.target === s) closeSheet(s); }); s.querySelector('.x').onclick = function () { closeSheet(s); }; });
    // the report sheet
    var form = $('rp-form'), send = $('rp-send');
    $('report').onclick = function () { show(form, true); show($('rp-thanks'), false); say($('rp-err'), ''); openSheet('sh-report'); };
    form.addEventListener('change', function () { send.disabled = !form.querySelector('input[name=why]:checked'); });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); var why = form.querySelector('input[name=why]:checked'); if (!why || send.disabled) return; send.disabled = true; say(send, 'Sending…'); say($('rp-err'), '');
      SAC.call('/api/report', { slug: NAME, why: why.value, text: $('rp-text').value.slice(0, 600) }).then(function (r) { say(send, 'Send report'); if (r && r.ok) { show(form, false); show($('rp-thanks'), true); form.reset(); $('rp-close').focus(); } else { send.disabled = false; say($('rp-err'), (r && r.error) || 'That did not send. Try again.'); } }, function () { say(send, 'Send report'); send.disabled = false; say($('rp-err'), 'That did not send. Check your connection and try again.'); });
    });
    $('rp-close').onclick = function () { closeSheet($('sh-report')); };
    document.addEventListener('keydown', function (ev) {
      var open = document.querySelector('.scrim.on');
      if (ev.key === 'Escape') { if (open) closeSheet(open); else if (S.stage === 'pop' || S.stage === 'bells') toEnd(); return; }
      if (open || /^(TEXTAREA|INPUT|BUTTON|A)$/.test((ev.target && ev.target.tagName) || '')) return;
      if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); if (S.stage === 'present') { firstTouch(); advance(0.25, U.cx, U.cy, true); } else if (S.stage === 'play' && !S.video) setPaused(!S.paused); else if (S.stage === 'bells') tapBells(VW / 2); else if (S.stage === 'pop') { var o = S.orbs.filter(function (q) { return !q.popped; })[0]; if (S.rev) tapPop(0, 0); else if (o) tapPop(o.x, o.y); } }
    });
  }

  /* ---------- pointers ---------- */
  var P = null;
  cv.addEventListener('pointerdown', function (ev) {
    var x = ev.clientX, y = ev.clientY; P = { x: x, y: y, lx: x, ly: y, moved: 0, t: performance.now(), id: ev.pointerId }; try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* an old browser */ }
    if (S.stage === 'present') firstTouch(); else if (S.stage === 'pop') tapPop(x, y); else if (S.stage === 'bells') tapBells(x);
  });
  cv.addEventListener('pointermove', function (ev) {
    if (!P || ev.pointerId !== P.id) return; var x = ev.clientX, y = ev.clientY, d = Math.hypot(x - P.lx, y - P.ly); P.moved += d; P.lx = x; P.ly = y;
    if (S.stage === 'present' && P.moved > 10) { U.drag = { x: x, y: y }; advance(d / (U.s * 2.6), x, y, false); if (Math.random() < 0.3) burstAt(x, y, 1, festive(), { speed: 90, size: 4, life: 0.6, shapes: ['spark'] }); }
    else if (S.stage === 'play' && !S.video && !S.paused && P.moved > 10) { var I = S.env.interact; I.snow = Math.min(2.6, I.snow + d / (S.R.w * 0.22)); I.dance = Math.min(1, I.dance + d / (S.R.w * 0.8)); if (Math.random() < 0.45) { burstAt(x, y, 1, festive(), { speed: 110, size: 5, life: 0.7, g: 300, shapes: S.xmas ? ['spark', 'dot'] : shapesFor() }); if (Math.random() < 0.25) sfx.spark(); } $('toy').classList.remove('on'); }
  });
  function up(ev) {
    if (!P || ev.pointerId !== P.id) return; var q = P; P = null; U.drag = null;
    if (ev.type === 'pointercancel' || q.moved > 12 || performance.now() - q.t > 700) return;
    if (S.stage === 'present') advance(0.25, q.x, q.y, true); else if (S.stage === 'play' && !S.video) tapCard(q.x, q.y);
  }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  document.addEventListener('visibilitychange', function () { if (document.hidden && S.stage === 'play' && !S.video && !S.paused && clk.on) setPaused(true); else if (document.hidden && S.stage === 'bells' && S.G && !S.G.over) toEnd(); });

  /* ---------- the frame ---------- */
  var last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; S.tm += dt;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = 1;
    if (S.stage === 'load' || !S.data) { var g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, BRAND.bg); g.addColorStop(1, BRAND.bg2); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); return; }
    tickClock(dt);
    if (S.stage === 'present') {
      var k = U.p; U.a1 += ((k >= 0.25 ? 1 : k * 1.2) - U.a1) * Math.min(1, dt * 10); U.a2 += ((k >= 0.5 ? 1 : 0) - U.a2) * Math.min(1, dt * 5); U.a3 += ((k >= 0.75 ? 1 : 0) - U.a3) * Math.min(1, dt * 7); U.kick *= Math.exp(-dt * 7);
      backdrop(0.5, true); scrims(0.85, 0.6); (S.wrap === 'envelope' ? drawEnvelope : drawPresent)();
      if (U.drag && !U.done) { var C = ribbonCols(); ctx.strokeStyle = C.rib; ctx.lineWidth = Math.max(5, U.s * 0.07); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(U.cx, U.cy - U.s * 0.34); ctx.quadraticCurveTo((U.cx + U.drag.x) / 2, Math.max(U.cy, U.drag.y) + 30, U.drag.x, U.drag.y); ctx.stroke(); ctx.strokeStyle = C.ribH; ctx.lineWidth = Math.max(1.5, U.s * 0.018); ctx.stroke(); }
      if (U.done && (U.assets || now - U.t0 > 4500) && now - U.t0 > 260) startBurst();
      else if (U.done) say($('h-tap'), 'Here it comes');
    }
    else if (S.stage === 'burst') drawBurst(now);
    else if (S.stage === 'play') drawPlay(dt);
    else if (S.stage === 'end') drawEnd(dt);
    else if (S.stage === 'pop') drawPop(dt, now);
    else if (S.stage === 'bells') drawBells(dt);
    stepParts(dt);
  }
  function resize() {
    VW = window.innerWidth; VH = window.innerHeight; DPR = Math.min(window.devicePixelRatio || 1, VW * VH > 1.2e6 ? 1.5 : 2.5);
    cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR); presentBox(); fitCard();
    S.orbs.forEach(function (o) { o.x = clamp(o.x, o.r, VW - o.r); o.y = clamp(o.y, o.top + o.r, VH - o.bot - o.r); });
  }
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', function () { setTimeout(resize, 200); });

  /* ---------- start ---------- */
  function icons() {
    var a = $('t-pop').querySelector('canvas').getContext('2d'), b = $('t-bell').querySelector('canvas').getContext('2d'), p = S.pal, keep = ctx;
    a.clearRect(0, 0, 128, 128); b.clearRect(0, 0, 128, 128);
    if (S.xmas) { bauble(a, 44, 72, 34, p.accent, p.gold); bauble(a, 92, 62, 24, p.accent2, p.gold); } else { balloon(a, 46, 58, 36, p.accent); balloon(a, 94, 50, 26, p.gold); }
    ctx = b; if (S.xmas) drawBell(b, 64, 66, 118, 0); else drawDrum(b, 64, 70, 120, 0); ctx = keep;
  }
  function begin(d) {
    S.data = d; S.card = d.engine || {}; S.to = String(d.to || '').trim() || 'you'; S.from = String(d.from || '').trim();
    S.xmas = d.occasion === 'christmas';
    if (window.CarolTemplates && window.CarolEngine && window.CarolArt) { try { S.tpl = CarolTemplates.get(S.card.template) || null; if (S.tpl) { S.pal = Object.assign({}, BRAND, S.tpl.look.pal); clk.dur = CarolEngine.timing(S.card).duration; } } catch (e) { S.tpl = null; } }
    S.dark = mix(S.pal.bg, '#000000', 0.6);
    S.wrap = (TEST && QS.get('wrap')) || (d.occasion === 'christmas' || d.occasion === 'birthday' ? 'present' : 'envelope');
    var st = document.documentElement.style; st.setProperty('--bg', S.dark); st.setProperty('--hi', S.pal.gold);
    var tc = document.querySelector('meta[name=theme-color]'); if (tc) tc.setAttribute('content', S.dark);
    say($('a-eye'), S.wrap === 'envelope' ? 'A singing card for' : 'A little something for'); say($('a-to'), S.to); say($('a-from'), S.from ? 'from ' + S.from : '');
    say($('e-eye'), 'A carol for'); say($('e-to'), S.to); say($('e-from'), S.from ? 'from ' + S.from : '');
    cv.setAttribute('aria-label', (S.wrap === 'envelope' ? 'A sealed envelope for ' : 'A wrapped present for ') + S.to + (S.from ? ', from ' + S.from : '') + '. Tap to open it.');
    var touch = 'ontouchstart' in window, needAsk = window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function';
    var pull = S.wrap === 'envelope' ? 'drag across the seal' : 'pull the ribbon';
    say($('h-sub'), reduce ? '' : touch && window.DeviceMotionEvent && !needAsk ? 'or give it a shake, or ' + pull : 'or ' + pull);
    if (!needAsk) listenMotion();
    var n = (d.photos || []).length;
    say($('t-pop-b'), S.xmas ? 'Pop the ornaments' : 'Pop the balloons'); say($('t-pop-s'), n === 1 ? 'A photo is hiding inside' : n + ' photos are hiding inside');
    say($('t-bell-b'), S.xmas ? 'Ring the bells' : 'Drum along'); say($('t-bell-s'), 'Tap in time with the song');
    if (!n) { show($('t-pop'), false); $('toys').classList.add('one'); }
    wire();
    // while they unwrap: the fonts, the photos, the song, the mark for the seal
    var jobs = [];
    if (window.CarolFonts) jobs.push(CarolFonts.loadBrowser(document).catch(noop));
    S.env.images = (d.photos || []).map(function () { return null; });
    (d.photos || []).forEach(function (src, i) { jobs.push(new Promise(function (ok) { var im = new Image(); im.onload = function () { S.env.images[i] = im; ok(); }; im.onerror = ok; im.src = src; })); });
    S.mark = new Image(); S.mark.src = '/assets/mark.svg?mono&c=ffffff';
    Promise.all(jobs).then(function () { U.assets = true; icons(); });
    setTimeout(icons, 50);
    if (d.song) { audio.src = d.song; audio.addEventListener('error', function () { if (S.stage === 'play' || S.stage === 'burst') toVideo(); else S.songBad = true; }); audio.load(); }
    if (!S.tpl || !window.CarolEngine) { S.video = true; var v = $('video'); v.src = d.story; v.poster = d.poster; v.onended = toEnd; }
    resize(); $('load').classList.add('off'); S.stage = 'present'; show($('addr'), true); show($('hint'), true);
    if (TEST) window.__card = { S: S, U: U, clk: clk, audio: audio, advance: advance, toEnd: toEnd, startPop: startPop, startBells: startBells, tapPop: tapPop };
    if (AT) {
      var t = +QS.get('t') || 0; document.body.classList.add('gone'); show($('addr'), false); show($('hint'), false); S.hinted = AT !== 'open' || t > 0;
      var go = function () {
        if (AT === 'open') { S.stage = 'play'; startPlay(); clk.silent = true; clk.on = true; audio.pause(); clk.t = t; }
        else if (AT === 'end') toEnd(); else if (AT === 'pop') { toEnd(); startPop(); } else if (AT === 'bells') { toEnd(); startBells(t); clk.silent = true; audio.pause(); }
      };
      Promise.all(jobs).then(go);
    }
  }
  resize(); requestAnimationFrame(frame);
  if (!NAME || NAME === '{' + '{card}}') { show($('lost'), true); $('load').classList.add('off'); return; }
  (window.SAC ? SAC.read('/api/card/' + NAME) : fetch('/api/card/' + NAME).then(function (r) { return r.json(); })).then(function (d) {
    if (!d || d.error || !d.slug) { $('load').classList.add('off'); show($('lost'), true); return; }
    begin(d);
  }, function () { $('load').classList.add('off'); show($('lost'), true); });
})();
