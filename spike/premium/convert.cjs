'use strict';
// spike/premium/convert.cjs : the vocal stem sung again in another voice, by the service's voice changer
// (POST /v1/speech-to-speech/{voice_id}, multipart: audio, model_id, remove_background_noise, voice_settings).
//   ELEVEN_STS_MODEL=<id> node spike/premium/convert.cjs <vocal stem> <name>=<voice id> [<name>=<voice id> ...]
//   node spike/premium/convert.cjs --models         which of the service's models can convert a voice (free)
// PAID: one call per voice. Target voices in this spike are the service's own stock voices ONLY: nobody is cloned.
const L = require('./lib.cjs'), fs = require('fs'), path = require('path');
(async function () {
  if (process.argv[2] === '--models') { const m = await L.get('/v1/models'); console.log(m.status, m.status === 200 ? m.json.filter(function (x) { return x.can_do_voice_conversion; }).map(function (x) { return x.model_id; }).join(', ') : m.text.slice(0, 300)); return; }
  const src = process.argv[2], model = process.env.ELEVEN_STS_MODEL, dir = path.join(L.OUT, 'voices'), tag = process.env.STS_TAG || '';
  if (!src || !model) throw new Error('needs a vocal stem and ELEVEN_STS_MODEL');
  fs.mkdirSync(dir, { recursive: true });
  const secs = L.seconds(src), settings = process.env.STS_SETTINGS || '';
  for (const a of process.argv.slice(3)) {
    const name = a.split('=')[0], id = a.split('=')[1], before = await L.used(), fields = { model_id: model, remove_background_noise: 'false' };
    if (settings) fields.voice_settings = settings;
    const r = await L.postFile('/v1/speech-to-speech/' + id + '?output_format=' + (process.env.STS_FORMAT || 'mp3_44100_128'), fields, 'audio', src, 'audio/mpeg');
    await new Promise(function (ok) { setTimeout(ok, 1500); });
    const after = await L.used();
    L.note('voice changer -> ' + name + tag, { seconds: secs, status: r.status, ms: r.ms, bytes: r.buffer.length, credits: after.used - before.used, creditsAfter: after.used, settings: settings });
    if (r.status !== 200) { console.log(name, 'THE SERVICE SAID', r.status, r.buffer.toString().slice(0, 600)); continue; }
    const out = path.join(dir, name + tag + '.mp3'); fs.writeFileSync(out, r.buffer);
    console.log(name + tag, 'ok in', r.ms, 'ms;', L.seconds(out), 's (source', secs, 's); credits', after.used - before.used, '; cost header', r.headers['character-cost'] || r.headers['x-character-count'] || '(none)');
  }
})().catch(function (e) { console.error('STOPPED:', e.message); process.exit(1); });
