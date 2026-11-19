'use strict';
// spike/classics/sts.cjs : the provider's VOICE CHANGER (speech-to-speech) run over our own sung lead, as a guide
// vocal, to see whether it smooths what our arithmetic leaves behind (buzz on held vowels, seams between grains).
// The changed vocal drifts off the notes a little, so it is retuned once more with our own dsp.psola() (time kept,
// only the pitch moved to the score's note).
//   convert(lead, voice) -> Float32Array    (lead: what sing.track() returns)
// PAID: one call per lead, cached on disk by a hash of the audio sent. Stock voices only; nobody is cloned.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), L = require('./lib.cjs'), D = require('./dsp.cjs'), Score = require('./score.cjs');
const RATE = L.RATE, MODEL = process.env.ELEVEN_STS_MODEL || 'eleven_multilingual_sts_v2';

async function credits() { const r = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' } }); return r.ok ? (await r.json()).character_count : null; }

async function change(lead, voice) {
  const dir = path.join(L.OUT, 'sts'); fs.mkdirSync(dir, { recursive: true });
  const src = L.wav(path.join(dir, 'in.wav'), lead.y), mp3 = path.join(dir, 'in.mp3'); L.ff(['-i', src, '-c:a', 'libmp3lame', '-b:a', '192k', mp3]);
  const buf = fs.readFileSync(mp3), key = crypto.createHash('sha1').update(buf).update(voice + MODEL).digest('hex').slice(0, 16), out = path.join(dir, voice + '-' + key + '.mp3');
  if (!fs.existsSync(out)) {
    const fd = new FormData(); fd.append('audio', new Blob([buf], { type: 'audio/mpeg' }), 'lead.mp3'); fd.append('model_id', MODEL); fd.append('remove_background_noise', 'false');
    fd.append('voice_settings', JSON.stringify({ stability: 0.7, similarity_boost: 0.8, style: 0 }));
    const before = await credits(), t0 = Date.now(), r = await fetch('https://api.elevenlabs.io/v1/speech-to-speech/' + L.VOICES[voice].id + '?output_format=mp3_44100_128', { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' }, body: fd, signal: AbortSignal.timeout(300000) });
    if (!r.ok) { const said = (await r.text()).slice(0, 400); L.note('voice changer REFUSED', { voice: voice, status: r.status, said: said }); throw new Error('the voice changer answered ' + r.status + ': ' + said); }
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); await new Promise(function (ok) { setTimeout(ok, 1500); });
    const after = await credits(), sec = L.seconds(mp3);
    // (the tally counts characters; a voice-changer credit is priced like a character, so its credits go in the same column)
    L.note('voice changer', { voice: voice, seconds: sec, ms: Date.now() - t0, credits: after !== null && before !== null ? after - before : null, chars: after !== null && before !== null ? after - before : Math.round(sec / 60 * 1000) });
  }
  return out;
}

// the changed vocal back onto the notes: the same times, each voiced pulse spaced for the note sounding then
function retune(y, notes) {
  const fx = D.f0(y, RATE), dur = y.length / RATE, sorted = notes.slice().sort(function (a, b) { return a.t - b.t; });
  const pitch = function (t) { let n = sorted[0]; for (const x of sorted) { if (x.t <= t + 0.03) n = x; else break; } return Score.hz(n.m); };
  return D.psola(y, RATE, fx, [{ o0: 0, o1: dur, s0: 0, s1: dur }], pitch).subarray(0, y.length);
}

async function convert(lead, voice) {
  const file = await change(lead, voice), y = L.pcm(file, RATE), n = new Float32Array(lead.y.length); n.set(y.subarray(0, Math.min(y.length, n.length)));
  return { raw: n, tuned: retune(n, lead.notes) };
}
module.exports = { convert: convert, retune: retune };
