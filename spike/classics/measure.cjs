'use strict';
// spike/classics/measure.cjs : numbers for what nobody here can hear. All by our own arithmetic (dsp.cjs).
//   of(track)  for a part made by sing.track(): per line and in all
//     inTune    % of voiced 10 ms frames inside a note whose pitch is within 50 cents of that note (the note's own
//               glide, scoop and vibrato are part of what is measured), and the median distance in cents
//     onsets    for every syllable whose vowel rises out of a quieter moment: where the level first reaches half of
//               the vowel's level, against the beat it was meant for (ms; + is late)
//     held      in vowels stretched 1.5 times or more: the median spectral flux (how much each 23 ms differs from the
//               last), the share of frames that hardly change at all (flux < 0.03: a "frozen" buzz), and the number of
//               sudden jumps (flux > 0.5) per second: clicks, a wrong pulse, a seam
//     clipped   samples at full scale;  lufs  the part's own loudness
//   reference(file)   the same flux numbers for any recording's voiced frames (a real sung vocal, for comparison)
const fs = require('fs'), path = require('path'), L = require('./lib.cjs'), D = require('./dsp.cjs');
const RATE = L.RATE, cents = function (f, midi) { return 1200 * Math.log2(f / (440 * Math.pow(2, (midi - 69) / 12))); };
const pct = function (a, b) { return b ? Math.round(1000 * a / b) / 10 : 0; };

function of(tr) {
  const y = tr.y, fx = D.f0(y, RATE), en = D.energy(y, RATE), F = D.flux(y, RATE), per = {}, lineOf = function (i) { return per[i] || (per[i] = { frames: 0, ok: 0, err: [], on: [], fl: [], frozen: 0, jumps: 0, heldSec: 0 }); };
  tr.notes.forEach(function (n) { const P = lineOf(n.line); for (let i = Math.ceil(n.t / D.HOP); i * D.HOP < n.t + n.d && i < fx.length; i++) { if (!(fx[i] > 0)) continue; const c = Math.abs(cents(fx[i], n.m)); P.frames++; if (c <= 50) P.ok++; P.err.push(c); } });
  const eAt = function (t) { return en[Math.max(0, Math.min(en.length - 1, Math.round(t / D.EHOP)))]; };
  tr.sung.forEach(function (s) {
    const P = lineOf(s.line); let top = 0; for (let t = s.V; t < Math.min(s.E, s.V + 0.15); t += D.EHOP) top = Math.max(top, eAt(t));
    let low = 1e9; for (let t = s.V - 0.14; t < s.V + 0.02; t += D.EHOP) low = Math.min(low, eAt(t));
    if (top > 0 && low < top * 0.35) { for (let t = s.V - 0.14; t < s.V + 0.15; t += D.EHOP) if (eAt(t) >= top * 0.5 && eAt(t - D.EHOP) < top * 0.5) { P.on.push((t - s.V) * 1000); break; } }
    if (s.stretch >= 1.5 && s.hold1 - s.hold0 > 0.12) { for (let i = Math.ceil((s.hold0 + 0.03) / F.hop); i * F.hop < s.hold1 - 0.03 && i < F.flux.length; i++) { P.fl.push(F.flux[i]); if (F.flux[i] < 0.03) P.frozen++; if (F.flux[i] > 0.5) P.jumps++; P.heldSec += F.hop; } }
  });
  let clipped = 0; for (let i = 0; i < y.length; i++) if (Math.abs(y[i]) >= 0.999) clipped++;
  const sum = function (P) { const a = P.on.map(Math.abs); return { inTune: pct(P.ok, P.frames), medianCents: Math.round(D.median(P.err)), voicedFrames: P.frames, onsets: P.on.length, onsetMedianMs: Math.round(D.median(P.on)), onsetAbsMedianMs: Math.round(D.median(a)), onsetsWithin50: pct(a.filter(function (v) { return v <= 50; }).length, a.length), heldSec: Math.round(P.heldSec * 10) / 10, heldFlux: Math.round(D.median(P.fl) * 1000) / 1000, frozen: pct(P.frozen, P.fl.length), jumpsPerSec: P.heldSec ? Math.round(P.jumps / P.heldSec * 10) / 10 : 0 }; };
  const all = { frames: 0, ok: 0, err: [], on: [], fl: [], frozen: 0, jumps: 0, heldSec: 0 };
  Object.keys(per).forEach(function (k) { const P = per[k]; all.frames += P.frames; all.ok += P.ok; all.err = all.err.concat(P.err); all.on = all.on.concat(P.on); all.fl = all.fl.concat(P.fl); all.frozen += P.frozen; all.jumps += P.jumps; all.heldSec += P.heldSec; });
  const tmp = path.join(L.OUT, 'measure-tmp.wav'); L.wav(tmp, y); const loud = L.loudness(tmp); fs.rmSync(tmp, { force: true });
  return Object.assign(sum(all), { clipped: clipped, lufs: loud.lufs, peak: loud.peak, lines: tr.lines.map(function (l) { return Object.assign({ text: l.text }, sum(per[l.i] || all)); }) });
}
function reference(file) {
  const y = L.pcm(file, RATE), fx = D.f0(y, RATE), F = D.flux(y, RATE), fl = []; let frozen = 0, jumps = 0, sec = 0;
  for (let i = 1; i < F.flux.length; i++) { const k = Math.round(i * F.hop / D.HOP); if (!(fx[k] > 0) || !(fx[k - 1] > 0) || !(fx[k + 1] > 0)) continue; fl.push(F.flux[i]); if (F.flux[i] < 0.03) frozen++; if (F.flux[i] > 0.5) jumps++; sec += F.hop; }
  return { voicedSec: Math.round(sec * 10) / 10, flux: Math.round(D.median(fl) * 1000) / 1000, frozen: pct(frozen, fl.length), jumpsPerSec: sec ? Math.round(jumps / sec * 10) / 10 : 0 };
}
const say = function (name, m) { return name + ': in tune ' + m.inTune + '% (median ' + m.medianCents + ' cents off, ' + m.voicedFrames + ' frames); onsets ' + m.onsetAbsMedianMs + ' ms median from the beat, ' + m.onsetsWithin50 + '% within 50 ms (' + m.onsets + ' measured, bias ' + m.onsetMedianMs + ' ms); held vowels ' + m.heldSec + ' s: flux ' + m.heldFlux + ', frozen ' + m.frozen + '%, jumps ' + m.jumpsPerSec + '/s; ' + m.lufs + ' LUFS, peak ' + m.peak + ' dB, clipped ' + m.clipped; };
module.exports = { of: of, reference: reference, say: say };
