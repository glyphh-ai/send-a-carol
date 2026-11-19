'use strict';
// spike/premium/account.cjs : what the account is and which stock voices it can use (reads only, costs nothing).
//   node spike/premium/account.cjs            the plan, credits used, voice slots, and the voices (id, name, labels)
const L = require('./lib.cjs'), fs = require('fs'), path = require('path');
(async function () {
  const u = await L.used(); console.log('ACCOUNT', JSON.stringify(u));
  const r = await L.get('/v2/voices?page_size=100&include_total_count=true'); if (r.status !== 200) { console.log('voices:', r.status, r.text.slice(0, 300)); return; }
  const list = r.json.voices.map(function (v) { const l = v.labels || {}; return { id: v.voice_id, name: v.name, category: v.category, gender: l.gender, age: l.age, accent: l.accent, descriptive: l.descriptive || l.description, use: l.use_case }; });
  fs.writeFileSync(path.join(L.OUT, 'voices.json'), JSON.stringify(list, null, 1));
  console.log('total', r.json.total_count); list.forEach(function (v) { console.log([v.id, v.name, v.category, v.gender, v.age, v.accent, v.descriptive, v.use].join(' | ')); });
  const m = await L.get('/v1/models'); if (m.status === 200) console.log('MODELS that can do voice conversion:', m.json.filter(function (x) { return x.can_do_voice_conversion; }).map(function (x) { return x.model_id + ' (max ' + (x.max_characters_request_subscribed_user || '?') + ')'; }).join(', '));
})();
