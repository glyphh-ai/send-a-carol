'use strict';
// spike/classics/make.cjs : the finished classic carols. For each one: our arrangement (arrange.cjs), the lead sung by
// a stock voice (sing.cjs: speech made to sing), the two mixed, brought to the product's loudness, written as mp3, and
// the lead measured (measure.cjs). A SPIKE: nothing here is loaded by the product.
//   node spike/classics/make.cjs [name ...]      (no names: all of them)    -> OUT/mix/<name>.mp3 and OUT/report.json
// Every speech call is cached on disk (lib.cjs), so running it again costs nothing.
const fs = require('fs'), path = require('path'), L = require('./lib.cjs'), Score = require('./score.cjs'), A = require('./arrange.cjs'), Sing = require('./sing.cjs'), M = require('./measure.cjs'), S = require('./synth.cjs');

// what is made: the carol, other words (or none), the voice, the arrangement, a key change (semitones) for the voice
const SONGS = [
  { name: 'jingle-bells', id: 'jingle-bells', voice: 'sarah', style: 'acoustic' },
  { name: 'silent-night', id: 'silent-night', voice: 'sarah', style: 'acoustic', transpose: 2 },
  { name: 'deck-the-halls', id: 'deck-the-halls', voice: 'eric', style: 'musicbox' },
  { name: 'jingle-bells-hollisters', id: 'jingle-bells', words: 'jingle-bells-hollisters', voice: 'sarah', style: 'acoustic' },
  { name: 'silent-night-hollisters', id: 'silent-night', words: 'silent-night-hollisters', voice: 'sarah', style: 'acoustic', transpose: 2 },
  { name: 'deck-the-halls-hollisters', id: 'deck-the-halls', words: 'deck-the-halls-hollisters', voice: 'eric', style: 'musicbox' },
  { name: 'silent-night-voice-changer', id: 'silent-night', voice: 'sarah', style: 'acoustic', transpose: 2, sts: 'sarah' }
];

// the lead's own chain (ffmpeg): low cut, a little presence, gentle compression, a short doubling echo
function polish(y, file) {
  const raw = file.replace(/\.wav$/, '-raw.wav'); L.wav(raw, S.level([y], 0.8)[0]);
  L.ff(['-i', raw, '-af', 'highpass=f=110,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=2.5,deesser=i=0.4,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2', '-ac', '1', '-ar', String(L.RATE), file]);
  fs.rmSync(raw, { force: true });
  return L.pcm(file, L.RATE);
}

async function make(song) {
  const sc = Score.load(song.id, song.words || null, { transpose: song.transpose || 0 });
  if (sc.problems.length) throw new Error(song.name + ': ' + sc.problems.join('; '));
  const dir = path.join(L.OUT, 'mix'); fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now(), lead = await Sing.track(sc, song.voice, { plan: 'cut', wanderSec: 0.03, perPass: 1.5 });
  // (the voice-changer variant: our sung lead as the guide, changed by the provider, retuned again by us)
  if (song.sts) { const c = await require('./sts.cjs').convert(lead, song.sts); console.log(M.say(song.name + ' (changed, before our second retune)', M.of(Object.assign({}, lead, { y: c.raw })))); lead.y = c.tuned; }
  const m = M.of(lead);
  const voc = polish(lead.y, path.join(dir, song.name + '-lead.wav'));
  const band = A.backing(sc, song.style, { lead: 0.32, seed: 11 });
  const D = S.Desk(Math.max(band[0].length, voc.length) / L.RATE + 0.5);
  D.put(band[0], 0, 0.707, -1, 0); D.put(band[1], 0, 0.707, 1, 0);
  D.put(voc, 0, song.voiceGain || 1.25, 0, 0.32);
  // (a quiet copy 18 ms later, a little to each side: the lead sounds less like one dry speaker)
  D.put(voc, 0.018, 0.16, -0.6, 0.2); D.put(voc, 0.027, 0.16, 0.6, 0.2);
  const pair = S.level(D.mix(0.83, 0.3), 0.85), wav = L.wav(path.join(dir, song.name + '.wav'), pair), mp3 = L.finish(wav, path.join(dir, song.name + '.mp3'), 2);
  const r = { name: song.name, title: sc.title, voice: song.voice, style: song.style, transpose: song.transpose || 0, seconds: Math.round(L.seconds(mp3) * 10) / 10, madeIn: Math.round((Date.now() - t0) / 100) / 10, chars: lead.chars, measure: m };
  console.log(M.say(song.name, m));
  return r;
}

(async function () {
  const want = process.argv.slice(2), out = [], file = path.join(L.OUT, 'report.json');
  const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  for (const s of SONGS) if (!want.length || want.indexOf(s.name) >= 0) out.push(await make(s));
  const merged = old.filter(function (o) { return !out.some(function (n) { return n.name === o.name; }); }).concat(out);
  fs.writeFileSync(file, JSON.stringify(merged, null, 1));
  console.log('spent so far:', JSON.stringify(L.spent()));
})().catch(function (e) { console.error('STOPPED:', e.stack || e.message); process.exit(1); });
