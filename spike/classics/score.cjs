'use strict';
// spike/classics/score.cjs : a carol as data. Reads scores/<id>.json (the tune, the words under it, the chords),
// checks it, and gives the other scripts the notes with their times.
//   node spike/classics/score.cjs            checks every score and every set of new words, and writes each tune as
//                                            plain tones (with a tick on every bar) to OUT/check/<id>-tones.wav, so a
//                                            wrong note can be HEARD later by a person
//   load(id, words?)  -> the score; `words` names scores/words/<words>.json: other words under the same notes
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, 'scores');
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midiOf = function (s) { const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!m) throw new Error('not a note: ' + s); return PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (parseInt(m[3], 10) + 1); };
const hz = function (midi) { return 440 * Math.pow(2, (midi - 69) / 12); };
const letters = function (s) { return String(s).toLowerCase().replace(/[^a-z]/g, ''); };
// a chord's name -> its root (0..11) and its tones as semitones above the root
function chord(name, tr) { const m = /^([A-G])([#b]?)(m?)(7?)$/.exec(name); if (!m) throw new Error('not a chord: ' + name); const root = (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? 11 : 0) + 120 + (tr || 0)) % 12, t = [0, m[3] ? 3 : 4, 7]; if (m[4]) t.push(10); return { name: name, root: root, tones: t, pcs: t.map(function (x) { return (root + x) % 12; }) }; }

// opt: { transpose: semitones (the key is ours to choose for the voice), introBars: a longer intro (for a spoken greeting) }
function load(id, words, opt) {
  opt = opt || {}; const tr = opt.transpose || 0;
  const j = JSON.parse(fs.readFileSync(path.join(DIR, id + '.json'), 'utf8')), barBeats = j.meter[0], problems = [];
  const w = words ? JSON.parse(fs.readFileSync(path.join(DIR, 'words', words + '.json'), 'utf8')) : null;
  if (w && w.base !== id) throw new Error(words + ' is written for ' + w.base + ', not ' + id);
  let at = 0; const lines = [], all = [];
  j.lines.forEach(function (ln, li) {
    const notes = [], other = w ? w.lines[li] : null, text = other ? other.text : ln.text, give = other ? other.syl.trim().split(/\s+/) : null; let g = 0;
    ln.notes.trim().split(/\s+/).forEach(function (tok) {
      if (tok === '|') { if (Math.abs(at / barBeats - Math.round(at / barBeats)) > 1e-6) problems.push('line ' + (li + 1) + ' ("' + ln.text + '"): a bar line at beat ' + at + ', which is not the end of a bar of ' + barBeats); return; }
      const p = tok.split('/'), len = parseFloat(p[1]); if (!(len > 0)) { problems.push('line ' + (li + 1) + ': no length in ' + tok); return; }
      if (p[0] === 'r') { at += len; return; }
      let syl = p[2] || ''; if (give && syl !== '_') { syl = give[g++]; if (syl === undefined) { problems.push('line ' + (li + 1) + ' of ' + words + ': fewer syllables than notes'); syl = 'la'; } }
      const n = { midi: midiOf(p[0]) + tr, start: at, len: len, syl: syl, line: li }; notes.push(n); all.push(n); at += len;
    });
    if (give && g !== give.length) problems.push('line ' + (li + 1) + ' of ' + words + ' ("' + text + '"): ' + give.length + ' syllables for ' + g + ' notes');
    // the syllables (a syllable owns its note and every _ note after it), and the words they make
    const syls = []; notes.forEach(function (n) { if (n.syl === '_' && syls.length) { const s = syls[syls.length - 1]; s.notes.push(n); s.len = n.start + n.len - s.start; } else syls.push({ text: n.syl.replace(/-$/, ''), more: /-$/.test(n.syl), start: n.start, len: n.len, notes: [n] }); });
    const wordsOf = []; let cur = null; syls.forEach(function (s) { if (!cur) { cur = { text: '', syls: [] }; wordsOf.push(cur); } cur.text += s.text; cur.syls.push(s); s.word = cur; if (!s.more) cur = null; });
    const said = text.split(/\s+/).map(letters).filter(Boolean), sung = wordsOf.map(function (x) { return letters(x.text); });
    if (said.join(' ') !== sung.join(' ')) problems.push('line ' + (li + 1) + ': the text says "' + said.join(' ') + '" and the notes sing "' + sung.join(' ') + '"');
    lines.push({ section: ln.section, text: text, notes: notes, syls: syls, words: wordsOf, start: notes[0].start, end: notes[notes.length - 1].start + notes[notes.length - 1].len });
  });
  // the chords: one or more to a bar, sharing it evenly
  const chords = []; j.chords.split('|').forEach(function (bar, b) { const names = bar.trim().split(/\s+/); names.forEach(function (nm, k) { chords.push(Object.assign(chord(nm, tr), { start: (b + k / names.length) * barBeats, len: barBeats / names.length, bar: b })); }); });
  const bars = j.chords.split('|').length;
  if (Math.abs(at - bars * barBeats) > 1e-6) problems.push('the notes fill ' + at + ' beats and the chords ' + bars + ' bars of ' + barBeats + ' (' + bars * barBeats + ' beats)');
  if (opt.introBars) j.introBars = opt.introBars;
  const beatSec = 60 / j.bpm, intro = j.introBars * barBeats * beatSec, S = { id: id, words: words || null, title: w && w.title || j.title, credit: j.credit, meter: j.meter, bpm: j.bpm, beatSec: beatSec, barBeats: barBeats, barSec: barBeats * beatSec, bars: bars, introBars: j.introBars, intro: intro, lines: lines, notes: all, chords: chords, problems: problems };
  S.time = function (beat) { return intro + beat * beatSec; };                       // seconds from the start of the track
  S.chordAt = function (beat) { let c = chords[0]; for (const x of chords) if (x.start <= beat + 1e-6) c = x; return c; };
  S.end = S.time(bars * barBeats);                                                    // where the last written bar ends
  S.duration = S.end + S.barSec * 2;                                                  // with the ending's ring
  harmonise(S);
  return S;
}
// OUR OWN HARMONY LINE: under every note of the tune, the chord's tone a third to a sixth below it (thirds and sixths
// before fourths and fifths), moving as little as it can from the harmony note before
function harmonise(S) {
  let last = null;
  S.notes.forEach(function (n) {
    const c = S.chordAt(n.start); let best = null, bs = 1e9;
    for (let d = 3; d <= 9; d++) { const m = n.midi - d; if (c.pcs.indexOf(((m % 12) + 12) % 12) < 0) continue; const s = (d === 3 || d === 4 ? 0 : d === 8 || d === 9 ? 1 : 2.5) + (last === null ? 0 : Math.abs(m - last) * 0.35); if (s < bs) { bs = s; best = m; } }
    n.harmony = best === null ? n.midi - 4 : best; last = n.harmony;
  });
}

module.exports = { load: load, hz: hz, midiOf: midiOf, chord: chord, letters: letters, DIR: DIR };

if (require.main === module) {
  const L = require('./lib.cjs'), out = path.join(L.OUT, 'check'); fs.mkdirSync(out, { recursive: true }); let bad = 0;
  const names = function (m) { return ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][m % 12] + (Math.floor(m / 12) - 1); };
  const sets = fs.readdirSync(DIR).filter(function (f) { return /\.json$/.test(f); }).map(function (f) { return [f.replace('.json', ''), null]; });
  if (fs.existsSync(path.join(DIR, 'words'))) fs.readdirSync(path.join(DIR, 'words')).forEach(function (f) { const w = JSON.parse(fs.readFileSync(path.join(DIR, 'words', f), 'utf8')); sets.push([w.base, f.replace('.json', '')]); });
  sets.forEach(function (x) {
    const S = load(x[0], x[1]), ms = S.notes.map(function (n) { return n.midi; }), lo = Math.min.apply(null, ms), hi = Math.max.apply(null, ms);
    console.log((x[1] ? x[1] + ' (new words for ' + x[0] + ')' : x[0]) + ': ' + S.bars + ' bars of ' + S.meter.join('/') + ', ' + S.notes.length + ' notes, ' + S.lines.reduce(function (n, l) { return n + l.syls.length; }, 0) + ' syllables in ' + S.lines.length + ' lines, range ' + names(lo) + ' to ' + names(hi) + ', ' + S.bpm + ' beats a minute, sung part ' + (S.end - S.intro).toFixed(1) + ' s, track ' + S.duration.toFixed(1) + ' s: ' + (S.problems.length ? 'PROBLEMS\n  ' + S.problems.join('\n  ') : 'bars add up, words match the notes'));
    bad += S.problems.length;
    if (x[1]) return;
    // the tune as plain tones: a sine with two overtones per note, a tick on every bar
    const n = Math.ceil((S.end - S.intro + 1) * L.RATE), y = new Float32Array(n);
    S.notes.forEach(function (nt) { const f = hz(nt.midi), a = Math.round(nt.start * S.beatSec * L.RATE), len = Math.round(nt.len * S.beatSec * L.RATE); for (let i = 0; i < len && a + i < n; i++) { const t = i / L.RATE, e = Math.min(1, i / 200) * Math.min(1, (len - i) / 800) * Math.exp(-t * 1.2); y[a + i] += 0.3 * e * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t) + 0.1 * Math.sin(6 * Math.PI * f * t)); } });
    for (let b = 0; b < S.bars; b++) { const a = Math.round(b * S.barSec * L.RATE); for (let i = 0; i < 300 && a + i < n; i++) y[a + i] += 0.25 * Math.sin(i * 0.9) * (1 - i / 300); }
    console.log('  tones: ' + L.wav(path.join(out, S.id + '-tones.wav'), y));
  });
  process.exit(bad ? 1 : 0);
}
