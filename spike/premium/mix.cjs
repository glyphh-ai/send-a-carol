'use strict';
// spike/premium/mix.cjs : who sings what, and the mixes. From the product's own line timings (a take's timing.lines
// and timing.sections), the verse's lines go round the singers in turn (with more singers than lines, they pair up)
// and EVERYONE sings the hook. Each singer's part is cut from their own stem with 60 ms fades, made as loud as the
// original vocal, and laid over the instrumental; the result is finished like the product's songs (-14 LUFS).
//   node spike/premium/mix.cjs <name> <timing.json> <instrumental> <original vocal> <stems dir> <singer> [<singer> ...]
//     a singer is a stem's file name without its extension (found in <stems dir> as .wav or .mp3)
//   -> OUT/mix/<name>/{song.m4a, song.mp3, vocals.wav, part-<singer>.wav, plan.json}   (plan.json is what the video reads)
//   node spike/premium/mix.cjs --solo <instrumental> <original vocal> <stems dir> <singer> ...   -> OUT/solo/<singer>.mp3
const L = require('./lib.cjs'), fs = require('fs'), path = require('path');
const RATE = 44100;
function wav(file, s) { const b = Buffer.alloc(44 + s.length * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + s.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(s.length * 2, 40); for (let i = 0; i < s.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(s[i] * 32767))), 44 + i * 2); fs.writeFileSync(file, b); }
const stemOf = function (dir, name) { const w = path.join(dir, name + '.wav'), m = path.join(dir, name + '.mp3'); if (fs.existsSync(w)) return w; if (fs.existsSync(m)) return m; throw new Error('no stem for ' + name + ' in ' + dir); };
// how loud the sung part of a stem is: the RMS of the frames within 25 dB of its loudest (silence does not count)
function sungRms(x) { const h = 441, n = Math.floor(x.length / h), e = []; let top = 0; for (let i = 0; i < n; i++) { let s = 0; for (let j = i * h; j < i * h + h; j++) s += x[j] * x[j]; e.push(s / h); if (s / h > top) top = s / h; } let sum = 0, c = 0; e.forEach(function (v) { if (v > top * 0.003) { sum += v; c++; } }); return Math.sqrt(sum / Math.max(1, c)); }
// the finished song: vocals over the instrumental, evenly loud, as the product finishes its songs
function finish(vocals, instrumental, out) { L.ff(['-i', instrumental, '-i', vocals, '-filter_complex', '[0:a]volume=0.9[i];[1:a]volume=1.0[v];[i][v]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '44100', '-ac', '2'].concat(/\.m4a$/.test(out) ? ['-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'] : ['-b:a', '192k'], [out])); }

// WHO SINGS WHICH LINE: -> [ [singer index, ...] per line ]. Verse lines go round; the hook is everyone.
function assign(timing, n) {
  const out = []; let line = 0;
  timing.sections.forEach(function (s) {
    const hook = /chorus|hook/i.test(s.name), count = s.lines || 0;
    for (let i = 0; i < count; i++, line++) {
      if (hook) out.push(Array.from({ length: n }, function (x, k) { return k; }));
      else if (n <= count) out.push([line % n]);
      else out.push(Array.from({ length: n }, function (x, k) { return k; }).filter(function (k) { return k % count === i; }));
    }
  });
  return out;
}

if (process.argv[2] === '--solo') {
  const inst = process.argv[3], ref = sungRms(L.pcm(process.argv[4], RATE)), dir = process.argv[5], out = path.join(L.OUT, process.env.SOLO_DIR || 'solo'); fs.mkdirSync(out, { recursive: true });
  process.argv.slice(6).forEach(function (name) { const x = L.pcm(stemOf(dir, name), RATE), g = ref / (sungRms(x) || 1), y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i] * g; const tmp = path.join(out, name + '.vocal.wav'); wav(tmp, y); finish(tmp, inst, path.join(out, name + '.mp3')); fs.unlinkSync(tmp); console.log('solo', name, 'gain', (20 * Math.log10(g)).toFixed(1), 'dB'); });
} else {
  const name = process.argv[2], timing = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), inst = process.argv[4], ref = sungRms(L.pcm(process.argv[5], RATE)), dir = process.argv[6], singers = process.argv.slice(7), out = path.join(L.OUT, 'mix', name);
  fs.mkdirSync(out, { recursive: true });
  const who = assign(timing, singers.length), stems = singers.map(function (s) { const x = L.pcm(stemOf(dir, s), RATE), g = ref / (sungRms(x) || 1); return { x: x, g: g }; }), n = Math.max.apply(null, stems.map(function (s) { return s.x.length; }));
  const total = new Float32Array(n), parts = singers.map(function () { return new Float32Array(n); }), fade = Math.round(0.06 * RATE);
  timing.lines.forEach(function (ln, i) {
    // a line's stretch runs from a little before its start to the next line's start (the singing often runs on)
    const a = Math.max(0, Math.round((ln.t0 - 0.12) * RATE)), nextT = i + 1 < timing.lines.length ? timing.lines[i + 1].t0 - 0.12 : Math.min(timing.duration, ln.t1 + 1.2), b = Math.min(n, Math.round(nextT * RATE)), group = who[i] || [], k = 1.1 / Math.sqrt(Math.max(1, group.length));
    group.forEach(function (si) { const s = stems[si]; for (let j = a; j < b && j < s.x.length; j++) { const w = Math.min(1, (j - a) / fade, (b - j) / fade), v = s.x[j] * s.g * w; parts[si][j] += v; total[j] += v * k; } });
  });
  singers.forEach(function (s, i) { wav(path.join(out, 'part-' + s + '.wav'), parts[i]); });
  wav(path.join(out, 'vocals.wav'), total);
  finish(path.join(out, 'vocals.wav'), inst, path.join(out, 'song.m4a')); finish(path.join(out, 'vocals.wav'), inst, path.join(out, 'song.mp3'));
  fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify({ name: name, singers: singers, lines: timing.lines.map(function (ln, i) { return { t0: ln.t0, t1: ln.t1, who: who[i] }; }), parts: singers.map(function (s) { return path.join(out, 'part-' + s + '.wav'); }), song: path.join(out, 'song.m4a'), stemsFrom: dir }, null, 1));
  console.log(name + ':', who.map(function (g, i) { return (i + 1) + ':' + g.map(function (k) { return singers[k]; }).join('+'); }).join('  '));
  console.log('  loudness of the finished song', JSON.stringify(L.loudness(path.join(out, 'song.m4a'))), L.seconds(path.join(out, 'song.m4a')), 's');
}
module.exports = { assign: assign };
