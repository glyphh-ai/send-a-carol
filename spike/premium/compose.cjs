'use strict';
// spike/premium/compose.cjs : one new carol made with the product's own code (song.js: plan, compose, finish), for a
// group that is not a family. The words are written here by hand (no call to the writing agent). The one difference
// from a standard carol's request: the voices asked for are ONE solo lead and no harmonies, because the guide vocal
// is going to be replaced by the group's own voices and a stem with a choir in it cannot be followed note by note.
//   node spike/premium/compose.cjs <name> <template id>     -> OUT/<name>/{raw.mp3, song.m4a, timing.json, doc.json}
// PAID: one call to the music service (about 38 seconds).
const L = require('./lib.cjs'), fs = require('fs'), path = require('path');
const Song = require('../../song.js'), Templates = require('../../templates.js');
const WORDS = {
  team: { answers: { to: 'Everyone', from: 'Team Lantern', relation: 'team' }, script: { title: 'A Year of Team Lantern', greeting: 'Happy holidays, everyone!', signoff: 'Happy holidays from Team Lantern',
    lyrics: [{ section: 'verse', lines: ['We shipped the big release with an hour to spare,', 'Dee fixed the printer with a paperclip and flair,', 'Kenji\'s sourdough got us through the crunch,', 'And Rosa never once forgot the Friday lunch,'] }, { section: 'hook', lines: ['Happy holidays from all of us to you,', 'Here\'s to the team and everything we do,', 'Raise your mugs up, the year is through,', 'Happy holidays, from our whole crew!'] }],
    music: { voices: 'one clear solo lead singer, a single voice, no harmonies, no backing vocals, no choir' } } }
};
(async function () {
  const name = process.argv[2], tpl = Templates.get(process.argv[3]), doc = WORDS[name]; if (!doc || !tpl) throw new Error('which words, which template?');
  const dir = path.join(L.OUT, name); fs.mkdirSync(dir, { recursive: true });
  const p = Song.plan(Object.assign({ lyrics: doc.script.lyrics, music: doc.script.music }), tpl), raw = path.join(dir, 'raw.mp3');
  if (!fs.existsSync(raw)) { const before = await L.used(), t0 = Date.now(), audio = await Song.compose(p); fs.writeFileSync(raw, audio); const after = await L.used(); L.note('music: ' + name, { seconds: p.total, ms: Date.now() - t0, credits: after.used - before.used, dollarsAtListPrice: Math.round(p.total / 60 * 0.15 * 1000) / 1000 }); }
  const done = await Song.finish(fs.readFileSync(raw), p);
  fs.writeFileSync(path.join(dir, 'song.m4a'), done.audio); fs.writeFileSync(path.join(dir, 'timing.json'), JSON.stringify(done.timing)); fs.writeFileSync(path.join(dir, 'doc.json'), JSON.stringify(doc));
  console.log(name, 'asked for', p.total, 's at', p.bpm, 'bpm; got', done.timing.duration, 's at', done.timing.bpm, 'bpm; levels', JSON.stringify(done.levels));
})().catch(function (e) { console.error('STOPPED:', e.message); process.exit(1); });
