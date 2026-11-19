'use strict';
// spike/classics/sing.cjs : SINGING MADE FROM SPEECH. A stock voice SPEAKS a line (text-to-speech, with the time of
// every character); our own arithmetic turns that speech into the line sung on the score's notes.
//   1. words: from the character times. Syllables inside a word: split where the score's syllables split its letters,
//      then moved to the quietest moment within 35 ms (energy; no speech recogniser, no model).
//   2. in every syllable, the vowel: the longest loud voiced run (energy at least 45% of the syllable's peak, a pitch
//      found). What is before it is the consonant going in, what is after it the consonant going out.
//   3. the time plan ('cut'): the VOWEL starts on the note's beat (the consonant before it is sung early, as singers
//      do, and kept short); the consonants keep their spoken length; the vowel is stretched to fill the note, most of
//      the time spent on its first part (so "night" holds "nah" and closes late); a long hold wanders gently back and
//      forth over that first part so that no single pulse is repeated for long.
//      The comparison plan ('spoken'): the voice speaks the line slowly, and each WORD is laid over its notes as it
//      is, evenly, with no vowel logic: only the retune.
//   4. the pitch plan: the note, a short glide from the note before, a small scoop at the start of a phrase, vibrato
//      that grows on notes longer than 0.45 s.
//   5. dsp.psola() does both at once; then each syllable is brought to an even level.
//   track(score, voice, { part: 'melody' | 'harmony', plan: 'cut' | 'spoken', shift, lines }) -> { y, sung: [...] }
const L = require('./lib.cjs'), D = require('./dsp.cjs'), Score = require('./score.cjs');
const RATE = L.RATE, LAG = 0.03, clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

// the words of a spoken line: [{ t0, t1, chars: [{ c, t0, t1 }] }], from the alignment the service returns
function wordsOf(al) {
  const out = []; let cur = null;
  // (the decoded mp3 runs about 30 ms behind the times the service gives: measured on its own files, see DESIGN.md)
  al.characters.forEach(function (c, i) { if (/\s/.test(c)) { cur = null; return; } if (!cur) { cur = { chars: [] }; out.push(cur); } cur.chars.push({ c: c, t0: al.character_start_times_seconds[i] + LAG, t1: al.character_end_times_seconds[i] + LAG }); });
  return out.map(function (w) { const ls = w.chars.filter(function (c) { return /[a-z]/i.test(c.c); }); return ls.length ? { letters: ls, t0: ls[0].t0, t1: ls[ls.length - 1].t1 } : null; }).filter(Boolean);
}

async function line(score, ln, voice, o) {
  const v = L.VOICES[voice], plan = o.plan || 'cut', part = o.part || 'melody', shift = o.shift === undefined ? v.shift : o.shift;
  const said = await L.tts(voice, ln.text.replace(/[!?.]+$/, '') + '.', plan === 'spoken' ? { speed: 0.7, stability: 0.85 } : { speed: 1, stability: 0.6 });
  const x = L.pcm(said.file, RATE), fx = D.f0(x, RATE), en = D.energy(x, RATE), words = wordsOf(said.alignment);
  if (words.length !== ln.words.length) throw new Error('"' + ln.text + '": the speech has ' + words.length + ' words and the score ' + ln.words.length);
  const eAt = function (t) { return en[clamp(Math.round(t / D.EHOP), 0, en.length - 1)]; }, fAt = function (t) { return fx[clamp(Math.round(t / D.HOP), 0, fx.length - 1)]; };
  const quietest = function (t, w) { let best = t, bv = 1e9; for (let u = t - w; u <= t + w; u += D.EHOP) { const e = eAt(u) + Math.abs(u - t) * 0.02; if (e < bv) { bv = e; best = u; } } return best; };
  // ----- 1. syllables in the speech -----
  const pad = 0.3, t0 = score.time(ln.start) - pad, T = function (beat) { return score.time(beat) - t0; }, syls = [];
  ln.words.forEach(function (w, wi) {
    const sp = words[wi]; let used = 0; const total = w.syls.reduce(function (n, s) { return n + Math.max(1, Score.letters(s.text).length); }, 0);
    const a0 = Math.max(0, sp.t0 - 0.02), a1 = Math.min(x.length / RATE, sp.t1 + 0.03);
    w.syls.forEach(function (s, si) {
      const from = si === 0 ? a0 : syls[syls.length - 1].s1; used += Math.max(1, Score.letters(s.text).length);
      let to = a1; if (si < w.syls.length - 1) { const k = Math.min(sp.letters.length - 1, Math.round(used / total * sp.letters.length)); to = clamp(quietest(sp.letters[k].t0, 0.035), from + 0.04, a1 - 0.04); }
      syls.push({ syl: s, s0: from, s1: to });
    });
  });
  // ----- 2. the vowel of each -----
  syls.forEach(function (q) {
    let peak = 0; for (let u = q.s0; u < q.s1; u += D.EHOP) peak = Math.max(peak, eAt(u));
    let best = null, cur = null;
    for (let u = q.s0; u < q.s1 + 1e-9; u += D.EHOP) { const ok = u < q.s1 && fAt(u) > 0 && eAt(u) >= peak * 0.45; if (ok) { if (!cur) cur = { a: u, b: u }; cur.b = u + D.EHOP; } if (!ok && cur) { if (!best || cur.b - cur.a > best.b - best.a) best = cur; cur = null; } }
    if (cur && (!best || cur.b - cur.a > best.b - best.a)) best = cur;
    if (!best || best.b - best.a < 0.02) { const m = (q.s0 + q.s1) / 2, h = Math.min(0.03, (q.s1 - q.s0) / 4); best = { a: m - h, b: m + h }; q.weak = true; }
    q.n0 = best.a; q.n1 = Math.min(best.b, q.s1);
    const len = q.n1 - q.n0; q.a = q.n0 + Math.min(0.03, len * 0.2); q.b = q.n1 - Math.min(0.04, len * 0.25);
  });
  // ----- 3. the time plan -----
  const segs = [], sung = [];
  if (plan === 'spoken') {
    ln.words.forEach(function (w, wi) { const sp = words[wi], first = w.syls[0], last = w.syls[w.syls.length - 1], nx = ln.words[wi + 1], o0 = T(first.start), end = T(last.start + last.len), o1 = nx && Math.abs(nx.syls[0].start - (last.start + last.len)) < 1e-6 ? end : end - Math.min(0.06, (end - o0) * 0.1); segs.push({ o0: o0, o1: o1, s0: Math.max(0, sp.t0 - 0.02), s1: sp.t1 + 0.02 }); });
    syls.forEach(function (q) { sung.push({ text: q.syl.text, V: T(q.syl.start), E: T(q.syl.start + q.syl.len), hold0: T(q.syl.start), hold1: T(q.syl.start + q.syl.len), stretch: 0 }); });
  } else {
    // how much of each syllable's opening consonant is sung before the beat
    syls.forEach(function (q, i) { const prev = syls[i - 1], room = prev && Math.abs(prev.syl.start + prev.syl.len - q.syl.start) < 1e-6 ? prev.syl.len * score.beatSec * 0.42 : 0.22; q.lead = Math.min(q.n0 - q.s0, room, 0.16); });
    syls.forEach(function (q, i) {
      const nx = syls[i + 1], V = T(q.syl.start), noteEnd = T(q.syl.start + q.syl.len), joined = nx && Math.abs(nx.syl.start - (q.syl.start + q.syl.len)) < 1e-6, E = joined ? T(nx.syl.start) - nx.lead : noteEnd - Math.min(0.05, (noteEnd - V) * 0.08), avail = E - V;
      let t1 = q.a - q.n0, c = q.s1 - q.b; const most = avail * 0.7; if (t1 + c > most) { const k = most / (t1 + c); t1 *= k; c *= k; }
      if (q.lead > 0.004) segs.push({ o0: V - q.lead, o1: V, s0: q.s0, s1: q.n0 });
      segs.push({ o0: V, o1: V + t1, s0: q.n0, s1: q.a });
      const h0 = V + t1, h1 = E - c, span = h1 - h0, src = q.b - q.a;
      if (span > src * 1.5 && src > 0.012) {
        // a held vowel: into the vowel's loudest moment at no less than two thirds of spoken speed, the hold spent
        // there (wandering back and forth over a few pulses either side, so no single pulse is repeated for long),
        // then out through the rest of the vowel as it was spoken
        let pk = q.a, pv = -1; for (let u = q.a; u <= q.b; u += D.EHOP) if (eAt(u) > pv) { pv = eAt(u); pk = u; }
        const dl = Math.min(o.wanderSec === undefined ? 0.012 : o.wanderSec, src / 4); pk = clamp(pk, q.a + dl, q.b - dl);
        let d1 = (pk - dl - q.a) * 1.5, d2 = (q.b - pk - dl) * 1.5; const k2 = Math.min(1, span * 0.5 / Math.max(1e-6, d1 + d2)); d1 *= k2; d2 *= k2;
        const hold = span - d1 - d2, ratio = hold / (2 * dl); let passes = o.wander === false ? 1 : Math.max(1, Math.ceil(ratio / (o.perPass || 6))); if (passes % 2 === 0) passes++;
        if (d1 > 0) segs.push({ o0: h0, o1: h0 + d1, s0: q.a, s1: pk - dl });
        for (let p = 0; p < passes; p++) segs.push({ o0: h0 + d1 + hold * p / passes, o1: h0 + d1 + hold * (p + 1) / passes, s0: p % 2 ? pk + dl : pk - dl, s1: p % 2 ? pk - dl : pk + dl });
        if (d2 > 0) segs.push({ o0: h1 - d2, o1: h1, s0: pk + dl, s1: q.b });
        q.stretch = span / src;
      } else { segs.push({ o0: h0, o1: h1, s0: q.a, s1: q.b }); q.stretch = src > 0 ? span / src : 1; }
      segs.push({ o0: h1, o1: E, s0: q.b, s1: q.s1 });
      sung.push({ text: q.syl.text, V: V, E: E, hold0: h0, hold1: h1, stretch: q.stretch, weak: !!q.weak });
    });
  }
  // ----- 4. the pitch plan -----
  const notes = ln.notes.map(function (n) { return { t: T(n.start), d: n.len * score.beatSec, m: (part === 'harmony' ? n.harmony : n.midi) + shift, first: false }; }); notes[0].first = true;
  ln.notes.forEach(function (n, i) { if (i && Math.abs(ln.notes[i - 1].start + ln.notes[i - 1].len - n.start) > 1e-6) notes[i].first = true; });
  const rnd = L.rng(Math.round(ln.start * 131) + voice.length * 7 + (part === 'harmony' ? 5 : 0)), drift = rnd() * 6.28, ph = rnd() * 6.28, st = function (u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const pitch = function (t) {
    let i = 0; while (i + 1 < notes.length && notes[i + 1].t <= t) i++;
    const n = notes[i], since = t - n.t; let m = n.m;
    if (i > 0 && !n.first) m = notes[i - 1].m + (n.m - notes[i - 1].m) * st((since + 0.025) / 0.075); else if (since < 0.07) m -= 0.5 * (1 - st(Math.max(0, since) / 0.07));
    if (n.d >= 0.45 && since > 0.22) m += 0.22 * st((since - 0.22) / 0.3) * Math.sin(2 * Math.PI * 5.4 * since + ph);
    m += 0.04 * Math.sin(t * 1.7 + drift);
    return Score.hz(m);
  };
  const y = D.psola(x, RATE, fx, segs, pitch, { rnd: L.rng(ln.start * 97 + voice.length) });
  // ----- 5. each syllable to an even level (the gain moves smoothly between syllable centres), soft ends -----
  const pts = sung.map(function (s) { const a = Math.round(s.V * RATE), b = Math.min(y.length, Math.round(s.E * RATE)); let e = 0; for (let i = a; i < b; i++) e += y[i] * y[i]; const rms = Math.sqrt(e / Math.max(1, b - a)); return { t: (s.V + s.E) / 2, g: rms > 1e-4 ? clamp(0.085 / rms, 0.4, 3) : 1 }; });
  let k = 0; for (let i = 0; i < y.length; i++) { const t = i / RATE; while (k + 1 < pts.length && pts[k + 1].t <= t) k++; const p = pts[k], q = pts[k + 1]; y[i] *= !q || t <= p.t ? p.g : p.g + (q.g - p.g) * (t - p.t) / (q.t - p.t); }
  const src = fx.filter(function (f) { return f > 0; });
  return { y: y, t0: t0, sung: sung.map(function (s) { return Object.assign(s, { V: s.V + t0, E: s.E + t0, hold0: s.hold0 + t0, hold1: s.hold1 + t0 }); }), notes: notes.map(function (n) { return { t: n.t + t0, d: n.d, m: n.m }; }), spokenHz: D.median(src), spokenSec: x.length / RATE, text: ln.text, chars: ln.text.length + 1 };
}

// a whole part: every line sung and laid on the score's own grid
async function track(score, voice, o) {
  o = o || {}; const y = new Float32Array(Math.ceil((score.duration + 1) * RATE)), sung = [], notes = [], lines = []; let hz = [], chars = 0;
  for (let i = 0; i < score.lines.length; i++) {
    if (o.lines && o.lines.indexOf(i) < 0) continue;
    const r = await line(score, score.lines[i], voice, o), a = Math.round(r.t0 * RATE);
    for (let j = 0; j < r.y.length && a + j < y.length; j++) if (a + j >= 0) y[a + j] += r.y[j];
    r.sung.forEach(function (s) { s.line = i; sung.push(s); }); r.notes.forEach(function (n) { n.line = i; notes.push(n); }); hz.push(r.spokenHz); chars += r.chars;
    lines.push({ i: i, text: r.text, t0: score.time(score.lines[i].start), t1: score.time(score.lines[i].end) });
  }
  return { y: y, sung: sung, notes: notes, lines: lines, voice: voice, spokenHz: D.median(hz), chars: chars };
}
module.exports = { line: line, track: track, wordsOf: wordsOf };
