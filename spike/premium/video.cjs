'use strict';
// spike/premium/video.cjs : the group's music video, made by the PRODUCT'S OWN renderer (render.js: the same canvas,
// the same ffmpeg pipe, both shapes, the poster). The engine draws its frame as always (the template's backdrop,
// border, cast, and its karaoke band with the line being sung); then the stage above the band is drawn again with
// the group on it (avatar.js). That is done here by wrapping Engine.draw IN THIS PROCESS ONLY: no product file is
// changed and nothing the product loads knows this exists.
//   node spike/premium/video.cjs <name> <mix plan.json> <template id> <costume> <title> <signoff> <person> [<person> ...]
//       -> OUT/video/<name>/{story.mp4, square.mp4, poster.jpg, sheet-story.png, sheet-square.png, jaw-*.png}
//   node spike/premium/video.cjs --stills    the layouts for 2..20 singers and each costume, as pictures, and the box checks
//   node spike/premium/video.cjs --heads     each placeholder photo with its two taps, and its head at five jaw openings
const fs = require('fs'), path = require('path');
const L = require('./lib.cjs'), People = require('./people.cjs'), Avatar = require('./avatar.js');
const R = require('../../render.js'), Engine = require('../../engine.js'), Art = require('../../art.js'), Templates = require('../../templates.js'), CFG = require('../../config.js');
const canvas = R.canvas, make = function (w, h) { return canvas.createCanvas(w, h); };
const SRC = path.join(L.OUT, process.env.PREMIUM_SRC || 'src'),   // the carol: its words (doc.json) and its take's timing (timing.json)
 doc = JSON.parse(fs.readFileSync(path.join(SRC, 'doc.json'), 'utf8')), timing = JSON.parse(fs.readFileSync(path.join(SRC, 'timing.json'), 'utf8'));
const hits = function (a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; };

const engineDraw = Engine.draw;
Engine.draw = function (ctx, W, H, card, t, env) {
  engineDraw(ctx, W, H, card, t, env);
  if (card && card.premium) { ctx.save(); Avatar.drawStage(ctx, W, H, card, Math.max(0, Math.min(t, Engine.timing(card).duration)), env, { Art: Art, Engine: Engine, template: Templates.get(card.template) }); ctx.restore(); }
};
async function member(id, i, envelope) { const p = People.person(id), img = await canvas.loadImage(p.png); return { id: id, name: p.name, head: Avatar.prepHead(img, p.taps, make), env: envelope || null, variant: i, photo: p, img: img }; }
function cardOf(template, costume, title, signoff, members) { return { template: template, to: doc.answers.to, from: doc.answers.from, title: doc.script.title, greeting: doc.script.greeting, signoff: doc.script.signoff, lyrics: doc.script.lyrics, scenes: [], timing: timing, premium: { costume: costume, title: title, signoff: signoff, members: members } }; }
// what must never happen, checked on a frame's boxes: a face off the frame, under the ribbon, under the lyric band,
// or behind another singer's body or hat
function check(boxes, label) {
  const bad = [], frame = boxes.find(function (b) { return b.kind === 'frame'; }), faces = boxes.filter(function (b) { return b.kind === 'face'; });
  faces.forEach(function (f) {
    if (f.x < 0 || f.y < 0 || f.x + f.w > frame.w || f.y + f.h > frame.h) bad.push(label + ': face ' + f.i + ' leaves the frame');
    boxes.forEach(function (b) { if ((b.kind === 'band' || b.kind === 'ribbon') && hits(f, b)) bad.push(label + ': face ' + f.i + ' is under the ' + b.kind); if (b.kind === 'avatar' && b.row < f.row && hits(f, { x: b.x + b.w * 0.2, y: b.y, w: b.w * 0.6, h: b.h })) bad.push(label + ': face ' + f.i + ' (row ' + f.row + ') is behind singer ' + b.i); });
  });
  return bad;
}
function sheet(file, src, cols, rows, every, crop) { L.ff(['-i', src, '-vf', 'fps=1/' + every + (crop ? ',' + crop : '') + ',scale=' + (crop ? 300 : 270) + ':-2,tile=' + cols + 'x' + rows + ':padding=6:color=white', '-frames:v', '1', file]); }

(async function () {
  R.fonts();
  const mode = process.argv[2];
  if (mode === '--heads') {
    const dir = path.join(L.OUT, 'heads'); fs.mkdirSync(dir, { recursive: true });
    const ids = Object.keys(People.CAST), cv = make(ids.length * 300, 620), c = cv.getContext('2d'); c.fillStyle = '#f4f1ec'; c.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < ids.length; i++) {
      const m = await member(ids[i], i), p = m.photo, k = 280 / p.w, x = i * 300 + 10; fs.writeFileSync(path.join(dir, 'photo-' + ids[i] + '.png'), p.png);
      c.drawImage(m.img, x, 10, p.w * k, p.h * k); c.strokeStyle = '#00e0ff'; c.lineWidth = 3; c.beginPath(); c.ellipse(x + p.taps.oval.cx * k, 10 + p.taps.oval.cy * k, p.taps.oval.rx * k, p.taps.oval.ry * k, 0, 0, 7); c.stroke(); c.strokeStyle = '#ff2d6f'; c.beginPath(); c.moveTo(x + p.taps.mouth.x1 * k, 10 + p.taps.mouth.y1 * k); c.lineTo(x + p.taps.mouth.x2 * k, 10 + p.taps.mouth.y2 * k); c.stroke();
      [0, 0.5, 1].forEach(function (open, j) { c.save(); c.translate(x + 50 + j * 92, 500); Avatar.drawHead(c, m.head, 150, open); c.restore(); });
    }
    fs.writeFileSync(path.join(dir, 'heads.png'), cv.toBuffer('image/png')); console.log(path.join(dir, 'heads.png')); return;
  }
  if (mode === '--stills') {
    const dir = path.join(L.OUT, 'stills'); fs.mkdirSync(dir, { recursive: true });
    const ids = Object.keys(People.CAST), all = []; for (let i = 0; i < 20; i++) all.push(await member(ids[i % ids.length], i));
    // every singer "singing" a steady note that opens and closes, so the stills show open mouths
    const fake = { open: new Float32Array(60 * 60).map(function (v, i) { return 0.5 + 0.5 * Math.sin(i / 7); }), act: new Float32Array(60 * 60).fill(1), fps: 60 };
    const looks = [['elf-workshop', 'elf'], ['snow-day', 'snowman'], ['village-carolers', 'caroler'], ['happy-holidays-team', 'office']], sizes = CFG.video.sizes, bad = [];
    for (const n of [2, 3, 4, 5, 6, 8, 12, 20]) {
      const cv = make(looks.length * 2 * 330, 600), c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); let col = 0;
      for (const lk of looks) for (const shape of ['story', 'square']) {
        const W = sizes[shape][0], H = sizes[shape][1], f = make(W, H), fc = f.getContext('2d'), boxes = [], card = cardOf(lk[0], lk[1], 'The Hollisters sing for Grandma Dot', doc.script.greeting, all.slice(0, n).map(function (m, i) { return Object.assign({}, m, { env: i % 2 || n < 4 ? fake : null }); }));
        Engine.draw(fc, W, H, card, 13.2, { images: [], quality: 'full', premiumBoxes: boxes });
        check(boxes, n + ' singers, ' + lk[1] + ', ' + shape).forEach(function (b) { bad.push(b); });
        const k = Math.min(320 / W, 590 / H); c.drawImage(f, col * 330 + 5, 5, W * k, H * k); col++;
        if (n === 4 || n === 6 || n === 12) fs.writeFileSync(path.join(dir, 'full-' + n + '-' + lk[1] + '-' + shape + '.jpg'), await f.encode('jpeg', 86));
      }
      fs.writeFileSync(path.join(dir, 'layout-' + String(n).padStart(2, '0') + '.jpg'), await cv.encode('jpeg', 84));
    }
    console.log(bad.length ? 'BOX CHECKS FAILED:\n  ' + bad.join('\n  ') : 'box checks: every face is on the frame, clear of the ribbon, the lyric band and the singers in front (2 to 20 singers, 4 costumes, both shapes)');
    return;
  }
  const name = mode, plan = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), template = process.argv[4], costume = process.argv[5], title = process.argv[6], signoff = process.argv[7], ids = process.argv.slice(8), dir = path.join(L.OUT, 'video', name);
  if (ids.length !== plan.singers.length) throw new Error('the mix has ' + plan.singers.length + ' singers, ' + ids.length + ' people were named');
  fs.mkdirSync(dir, { recursive: true });
  const members = []; for (let i = 0; i < ids.length; i++) { const env = Avatar.envelope(L.pcm(plan.parts[i], 22050), 22050); members.push(await member(ids[i], i, env)); }
  const card = cardOf(template, costume, title, signoff, members);
  // the checks, on every tenth frame of both shapes, before anything is filmed
  const bad = []; let openFrames = 0, shut = 0, frames = 0;
  Object.keys(CFG.video.sizes).forEach(function (shape) { const W = CFG.video.sizes[shape][0], H = CFG.video.sizes[shape][1], f = make(W, H), fc = f.getContext('2d'); for (let t = 0; t < timing.duration; t += 1 / 3) { const boxes = []; Engine.draw(fc, W, H, card, t, { images: [], quality: 'full', premiumBoxes: boxes }); check(boxes, shape + ' at ' + t.toFixed(1) + ' s').forEach(function (b) { if (bad.length < 12) bad.push(b); }); } });
  // and the mouths: a singer's mouth is open only while their own part sounds
  plan.lines.forEach(function (ln, li) { members.forEach(function (m, i) { const e = m.env; let open = 0, n = 0; for (let t = ln.t0 + 0.3; t < ln.t1 - 0.3; t += 1 / 30) { n++; if (e.open[Math.floor(t * e.fps)] > 0.15) open++; } frames += n; if (ln.who.indexOf(i) >= 0) openFrames += open; else if (open) { shut += open; } }); });
  console.log(name + ': box checks ' + (bad.length ? 'FAILED\n  ' + bad.join('\n  ') : 'pass') + '; frames with an open mouth while it is the singer\'s line: ' + openFrames + ', while it is NOT their line: ' + shut + ' (must be 0)');
  const t0 = Date.now(), out = await R.render({ card: card, images: [], audio: plan.song, dir: dir });
  console.log('  rendered by render.js in', ((Date.now() - t0) / 1000).toFixed(1), 's:', out.story, out.square, out.frames, 'frames,', out.duration, 's');
  sheet(path.join(dir, 'sheet-story.png'), out.story, 8, 2, 2.5); sheet(path.join(dir, 'sheet-square.png'), out.square, 6, 3, 2.25);
  // a close look at the mouths: 16 frames in a row (a little over half a second) from a verse line and from the hook
  [['verse', plan.lines[1].t0 + 0.8], ['hook', plan.lines[5].t0 + 0.9]].forEach(function (x) { L.ff(['-ss', x[1].toFixed(2), '-i', out.square, '-vf', 'crop=1080:520:0:150,scale=540:-2,tile=4x4:padding=4:color=white', '-frames:v', '1', path.join(dir, 'jaw-' + x[0] + '.png')]); });
  console.log('  sheets:', path.join(dir, 'sheet-story.png'), path.join(dir, 'sheet-square.png'), path.join(dir, 'jaw-verse.png'), path.join(dir, 'jaw-hook.png'));
})().catch(function (e) { console.error('STOPPED:', e.stack || e.message); process.exit(1); });
