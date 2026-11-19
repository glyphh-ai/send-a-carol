'use strict';
// spike/premium/retune.cjs : a converted vocal put back on the tune. The voice changer keeps the timing of the
// singing but not its notes (measured: see README), so the notes are put back here by plain arithmetic: the tune is
// read from the original vocal stem, and each converted stem's pulses are re-spaced to sing it (dsp.cjs retune),
// in the singer's own octave. No library, no trained anything.
//   node spike/premium/retune.cjs <original vocal> <converted> [<converted> ...]    -> OUT/tuned/<name>.wav
const L = require('./lib.cjs'), D = require('./dsp.cjs'), fs = require('fs'), path = require('path');
const RATE = 44100;
function wav(file, samples, rate) { const b = Buffer.alloc(44 + samples.length * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40); for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2); fs.writeFileSync(file, b); }
const MODE = process.env.RETUNE_OCTAVE === 'whole' ? 'whole' : 'nearest';   // see dsp.cjs ratios()
const files = process.argv.slice(2), dir = path.join(L.OUT, MODE === 'whole' ? 'tuned-whole-octave' : 'tuned'); fs.mkdirSync(dir, { recursive: true });
const tune = D.f0(L.pcm(files[0], 16000), 16000);
files.slice(1).forEach(function (f) {
  const x = L.pcm(f, RATE), fx = D.f0(L.pcm(f, 16000), 16000), t0 = Date.now(), r = D.retune(x, RATE, fx, tune, 0, MODE), out = path.join(dir, path.basename(f, '.mp3') + '.wav');
  wav(out, r.samples, RATE);
  const moved = Array.from(r.ratios).map(function (v) { return Math.abs(1200 * Math.log2(v)); });
  console.log(path.basename(out), 'in', Date.now() - t0, 'ms; median shift', Math.round(D.medianOf(moved)), 'cents; largest', Math.round(Math.max.apply(null, moved)), 'cents');
});
