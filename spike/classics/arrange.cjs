'use strict';
// spike/classics/arrange.cjs : OUR OWN ARRANGEMENT of a score, played by synth.cjs: an intro (the tune's last bars as
// a turnaround), the song, an ending that rings out. Everything here is written from the tune and its plain chords.
//   backing(score, style, { lead: 0..1 how loud the tune is played (soft under a singer, full on its own), seed })
//     -> [left, right]      styles: 'acoustic' (cozy: strummed nylon guitar, felt piano, bass, shaker, sleigh bells, pad)
//                                   'musicbox' (music box and bells)      'swing' (walking bass, brushes, comping, vibes)
//   In 6/8 every style becomes a lullaby: a picked guitar, a pad, a music box far away.
const S = require('./synth.cjs'), L = require('./lib.cjs');
const hz = S.hz;
// every note of a chord between two pitches
const voicing = function (c, lo, hi) { const out = []; for (let m = lo; m <= hi; m++) if (c.pcs.indexOf(m % 12) >= 0) out.push(m); return out; };
const rootIn = function (c, lo) { let m = lo; while (m % 12 !== c.root) m++; return m; };

function backing(score, style, o) {
  o = o || {}; const rnd = L.rng(o.seed || 11), lead = o.lead === undefined ? 1 : o.lead, D = S.Desk(score.duration + 1.5), bb = score.barBeats, six = score.meter[1] === 8, fast = score.bpm >= 150;
  const jit = function () { return (rnd() + rnd() - 1) * 0.007; }, vel = function (v) { return v * (0.86 + 0.28 * rnd()); };
  const at = function (beat) { return score.time(beat) + jit(); }, bs = score.beatSec;
  const play = function (inst, midi, beat, beats, v, gain, pan, send, extra) { D.put(S[inst](hz(midi), beats * bs, vel(v), rnd, extra), at(beat), gain, pan, send); };
  // the bars to play: the intro borrows the song's last bars (chords and tune), then the song
  const total = score.bars * bb, introBeats = score.introBars * bb;
  const chordAt = function (beat) { return score.chordAt(beat < 0 ? total + beat : Math.min(beat, total - 0.01)); };
  const tune = score.notes.map(function (n) { return { midi: n.midi, start: n.start, len: n.len }; }).concat(score.notes.filter(function (n) { return n.start >= total - introBeats; }).map(function (n) { return { midi: n.midi, start: n.start - total, len: n.len, intro: true }; }));
  const tonic = score.chords[score.chords.length - 1];
  const swung = function (b) { const f = b - Math.floor(b); return style === 'swing' && Math.abs(f - 0.5) < 0.01 ? Math.floor(b) + 2 / 3 : b; };

  // ----- the tune -----
  tune.forEach(function (n) {
    const b = swung(n.start), len = Math.max(0.3, n.len - (b - n.start)), g = n.intro ? Math.max(lead, 0.8) : lead; if (g <= 0) return;
    if (six) { play('musicbox', n.midi + 12, b, len, 0.6, 0.55 * g, 0.25, 0.5); if (n.intro || lead > 0.7) play('piano', n.midi, b, len, 0.55, 0.7 * g, -0.1, 0.3); }
    else if (style === 'musicbox') { play('musicbox', n.midi + 12, b, len, 0.75, 0.9 * g, 0.1, 0.4); play('musicbox', n.midi + 24, b, len, 0.4, 0.3 * g, -0.3, 0.5); }
    else if (style === 'swing') play('vibes', n.midi + 12, b, len * 0.9, 0.7, 0.95 * g, 0.2, 0.35);
    else { play('piano', n.midi, b, len, 0.62, 0.95 * g, 0.2, 0.3); play('piano', n.midi + 12, b, len, 0.4, 0.4 * g, 0.28, 0.3); if (o.glock) play('glock', n.midi + 24, b, len, 0.4, 0.3 * g, 0.4, 0.5); }
  });

  // ----- the band, bar by bar -----
  for (let bar = -score.introBars; bar < score.bars; bar++) {
    const b0 = bar * bb, quiet = bar < 0 ? 0.8 : 1;
    // a pad under each chord
    for (let k = 0; k < bb;) { const c = chordAt(b0 + k); let len = 1; while (k + len < bb && chordAt(b0 + k + len).name === c.name) len++; voicing(c, 55, 67).slice(0, 4).forEach(function (m, i) { play('pad', m, b0 + k, len, 0.6, (style === 'swing' ? 0.45 : 0.9) * quiet, i % 2 ? 0.5 : -0.5, 0.5); }); k += len; }
    if (six) {
      // a lullaby in six: the bass note, then the chord picked upward and back, one string to an eighth
      for (let k = 0; k < bb; k++) { const c = chordAt(b0 + k), v = voicing(c, 50, 67), first = k === 0 || chordAt(b0 + k - 1).name !== c.name, pos = k % 3 === 0 && !first ? 1 : [0, 2, 3, 4, 3, 2][k % 6];
        if (first) { play('bass', rootIn(c, 31), b0 + k, bb - k, 0.6, 0.8 * quiet, 0, 0.1); play('pluck', rootIn(c, 43), b0 + k, 3, 0.7, 0.85 * quiet, -0.25, 0.3, 0.35); }
        else play('pluck', v[Math.min(v.length - 1, pos)], b0 + k, 2, k % 3 === 0 ? 0.6 : 0.45, 0.8 * quiet, -0.25 + 0.08 * (k % 3), 0.35, 0.4); }
      if (bar >= 0 && bar % 2 === 0) play('glock', rootIn(chordAt(b0), 79), b0, 2, 0.3, 0.3, 0.5, 0.7);
      continue;
    }
    for (let k = 0; k < bb; k++) {
      const c = chordAt(b0 + k), changed = k === 0 || chordAt(b0 + k - 1).name !== c.name, strong = k % 2 === 0, next = chordAt(b0 + k + 1);
      if (style === 'swing') {
        // the bass walks: root, third, fifth, then a step into the next chord's root
        const r = rootIn(c, 36), walk = [r, r + c.tones[1], r + 7, rootIn(next, 36) + (rootIn(next, 36) > r ? -1 : 1)], m = changed ? r : walk[k % 4];
        play('bass', m > 50 ? m - 12 : m, b0 + k, 0.95, strong ? 0.8 : 0.7, 0.72 * quiet, 0, 0.1);
        D.put(S.noise('ride', vel(strong ? 0.55 : 0.75), rnd), at(b0 + k), 0.55 * quiet, 0.35, 0.25);
        if (!strong) { D.put(S.noise('ride', vel(0.45), rnd), at(b0 + k + 2 / 3), 0.5 * quiet, 0.35, 0.25); D.put(S.noise('tap', vel(0.6), rnd), at(b0 + k), 0.6 * quiet, -0.2, 0.3); }
        else D.put(S.noise('swish', vel(0.6), rnd), at(b0 + k), 0.6 * quiet, -0.2, 0.3);
        if (k === 0 || k === 1) { const cc = chordAt(b0 + (k ? 2 : 0)); voicing(cc, 55, 70).slice(0, 4).forEach(function (mm, i) { D.put(S.piano(hz(mm), 0.22, vel(0.55), rnd), at(b0 + (k ? 1 + 2 / 3 : 0)) + i * 0.004, 0.75 * quiet, -0.3, 0.3); }); }
        continue;
      }
      if (style === 'musicbox') {
        // the chord told upward on a second music box; a deep soft note under each bar; bells on the beat
        const v = voicing(c, 60, 79), steps = fast ? [0] : [0, 0.5];
        steps.forEach(function (h, i) { const idx = (k * steps.length + i) % (v.length * 2 - 2), m = v[idx < v.length ? idx : v.length * 2 - 2 - idx]; play('musicbox', m, b0 + k + h, 1, 0.42, 0.55 * quiet, -0.35, 0.45); });
        if (changed || k === 0) play('bass', rootIn(c, 36), b0 + k, Math.min(2, bb - k), 0.55, 0.75 * quiet, 0, 0.1);
        if (k === 0) play('glock', rootIn(c, 72), b0, 2, 0.45, 0.45 * quiet, 0.45, 0.6);
        D.put(S.sleigh(0, 0, vel(strong ? 0.6 : 0.4), rnd), at(b0 + k), 0.7 * quiet, 0.5, 0.35);
        continue;
      }
      // cozy acoustic: boom (the bass, with a soft kick) and chick (the strum), a shaker, sleigh bells
      const r = rootIn(c, 38);
      if (strong) { play('bass', changed || k === 0 ? r : (r + 7 > 52 ? r - 5 : r + 7), b0 + k, 1.6, 0.75, 0.68 * quiet, 0, 0.1); D.put(S.kick(vel(0.5)), at(b0 + k), 0.32 * quiet, 0, 0.05); }
      const strum = function (beat, v, up, gain) { const ns = voicing(c, 50, 72).slice(0, 6); if (up) ns.reverse(); const t0 = at(beat); ns.slice(0, up ? 3 : 6).forEach(function (m, i) { D.put(S.pluck(hz(m), 0.9 * bs * (fast ? 2 : 1.4), vel(v), rnd, 0.55), t0 + i * (0.011 + rnd() * 0.006), gain * quiet, -0.3, 0.3); }); };
      if (!strong) strum(b0 + k, 0.7, false, 0.5); else if (!fast) strum(b0 + k, 0.5, false, 0.36);
      if (!fast && !strong) strum(b0 + k + 0.5, 0.4, true, 0.3);
      (fast ? [0] : [0, 0.5]).forEach(function (h) { D.put(S.noise('shaker', vel(h || (!strong && fast) ? 0.7 : 0.45), rnd), at(b0 + k + h), 0.5 * quiet, -0.5, 0.2); });
      if (o.bells !== false) D.put(S.sleigh(0, 0, vel(strong ? 0.65 : 0.4), rnd), at(b0 + k), 0.85 * quiet, 0.5, 0.35);
    }
  }
  // ----- the ending: the home chord rolled from the bottom, a bell on top, left to ring -----
  const e = total, roll = voicing(tonic, 50, 74).slice(0, 6), inst = six ? 'pluck' : style === 'musicbox' ? 'musicbox' : style === 'swing' ? 'vibes' : 'pluck';
  D.put(S.bass(hz(rootIn(tonic, six ? 31 : 36)), bb * bs * 1.5, 0.7), score.time(e), 0.9, 0, 0.15);
  roll.forEach(function (m, i) { D.put(S[inst](hz(m + (inst === 'musicbox' ? 12 : 0)), bb * bs * 1.6, 0.6, rnd, 0.5), score.time(e) + i * 0.045, 0.55, -0.3 + i * 0.1, 0.5); });
  if (inst !== 'pluck' || !six) voicing(tonic, 60, 72).slice(0, 3).forEach(function (m, i) { D.put(S.piano(hz(m), bb * bs * 1.5, 0.5, rnd), score.time(e) + 0.02 + i * 0.03, 0.5, 0.2, 0.4); });
  D.put(S.glock(hz(rootIn(tonic, 84)), 2, 0.5), score.time(e) + roll.length * 0.045, 0.5, 0.4, 0.7);
  voicing(tonic, 55, 67).slice(0, 4).forEach(function (m, i) { D.put(S.pad(hz(m), bb * bs * 1.2, 0.6, rnd), score.time(e), 0.9, i % 2 ? 0.5 : -0.5, 0.5); });
  if (!six && style !== 'swing' && o.bells !== false) for (let i = 0; i < 6; i++) D.put(S.sleigh(0, 0, 0.6 - i * 0.07, rnd), score.time(e) + i * 0.085, 0.6, 0.5, 0.4);
  return S.level(D.mix(six ? 0.88 : 0.82, 0.3), 0.8);
}
module.exports = { backing: backing };

if (require.main === module) {
  // node spike/classics/arrange.cjs <score id> <style> [lead]  -> OUT/backing/<id>-<style>.wav
  const fs = require('fs'), path = require('path'), Score = require('./score.cjs'), id = process.argv[2], style = process.argv[3] || 'acoustic', sc = Score.load(id), t0 = Date.now(), dir = path.join(L.OUT, 'backing'); fs.mkdirSync(dir, { recursive: true });
  const f = L.wav(path.join(dir, id + '-' + style + '.wav'), backing(sc, style, { lead: process.argv[4] === undefined ? 1 : parseFloat(process.argv[4]), glock: true }));
  console.log(f, (L.seconds(f)).toFixed(1) + ' s, made in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s', JSON.stringify(L.loudness(f)));
}
