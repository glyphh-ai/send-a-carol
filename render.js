'use strict';
// render.js : the video. The SAME engine that draws the live preview in the browser (engine.js, templates.js, art.js)
// draws every frame here on a canvas (@napi-rs/canvas), and the frames go down a pipe to ffmpeg, which makes
// H.264 + AAC mp4s (30 frames a second): 1080x1920 for stories and reels, 1080x1080 for feeds and email; then a
// poster (jpg) and a small silent animated preview (gif) for link unfurls.
//   render({ card, images: [Buffer|null], audio: path to the song, dir, sizes?, onProgress(pct, stage), stop() }) -> { story, square, poster, preview, seconds, frames }
const cp = require('child_process'), fs = require('fs'), path = require('path');
const canvas = require('@napi-rs/canvas');
const Engine = require('./engine.js'), Fonts = require('./fonts.js'), CFG = require('./config.js');

const seam = { ffmpeg: process.env.FFMPEG || 'ffmpeg' };
let fontsIn = false;
const fonts = function () { if (!fontsIn) { Fonts.registerNode(canvas, path.join(__dirname, 'fonts')); fontsIn = true; } };
const tick = function () { return new Promise(function (ok) { setImmediate(ok); }); };

async function pictures(buffers) {
  const out = [];
  for (const b of buffers || []) { let img = null; if (b) { try { img = await canvas.loadImage(b); } catch (e) { img = null; } } out.push(img); }
  return out;
}
function ffmpeg(args) {
  const p = cp.spawn(seam.ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y'].concat(args), { stdio: ['pipe', 'ignore', 'pipe'] }), err = [];
  p.stderr.on('data', function (c) { err.push(c); });
  const done = new Promise(function (ok, fail) { p.on('error', function (e) { fail(new Error('ffmpeg could not be run: ' + e.message)); }); p.on('close', function (code) { if (code) fail(new Error('ffmpeg: ' + Buffer.concat(err).toString().trim().slice(-400))); else ok(); }); });
  p.stdin.on('error', function () { /* ffmpeg says why on stderr */ });
  return { p: p, done: done };
}
// one size: every frame drawn and piped. The event loop is let go between frames so the server keeps answering.
async function film(card, images, audio, W, H, file, each) {
  const V = CFG.video, timing = Engine.timing(card), seconds = Math.min(timing.duration, V.hardCapSec), frames = Math.max(1, Math.round(seconds * V.fps));
  const cv = canvas.createCanvas(W, H), ctx = cv.getContext('2d'), env = { images: images, quality: 'full' };
  const args = ['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', W + 'x' + H, '-r', String(V.fps), '-i', 'pipe:0'].concat(audio ? ['-i', audio] : [], ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(V.fps), '-g', String(V.fps * 2)], audio ? ['-c:a', 'aac', '-b:a', '160k', '-ar', '44100'] : [], ['-t', seconds.toFixed(3), '-movflags', '+faststart', '-fs', String(V.maxBytes), file]);
  const f = ffmpeg(args); let failed = null; const closed = f.done.catch(function (e) { failed = e; });
  f.p.stdin.setMaxListeners(0);
  for (let i = 0; i < frames && !failed; i++) {
    ctx.save(); Engine.draw(ctx, W, H, card, i / V.fps, env); ctx.restore();
    if (!f.p.stdin.write(cv.data())) await Promise.race([new Promise(function (ok) { f.p.stdin.once('drain', ok); }), closed]);
    if (i % 5 === 0) { await tick(); if (each && await each(i / frames) === false) { f.p.kill('SIGKILL'); await f.done.catch(function () { }); throw Object.assign(new Error('stopped'), { stopped: true }); } }
  }
  f.p.stdin.end(); await f.done; if (failed) throw failed;
  return { frames: frames, seconds: seconds };
}
async function render(o) {
  fonts();
  const t0 = Date.now(), sizes = o.sizes || CFG.video.sizes, names = Object.keys(sizes), images = await pictures(o.images), out = { frames: 0 }, say = o.onProgress || function () { };
  let n = 0;
  for (const name of names) {
    const W = sizes[name][0], H = sizes[name][1], file = path.join(o.dir, name + '.mp4'), base = n / names.length;
    const r = await film(o.card, images, o.audio, W, H, file, function (p) { return say(Math.round((base + p / names.length) * 94), 'rendering'); });
    out[name] = file; out.frames += r.frames; out.duration = r.seconds; n++;
  }
  // the poster: the most attractive still, at the story's shape and at the square's (the square one is what unfurls)
  const pt = Engine.posterTime(o.card), sq = sizes.square || sizes[names[0]];
  const still = async function (W, H, file) { const cv = canvas.createCanvas(W, H), ctx = cv.getContext('2d'); Engine.draw(ctx, W, H, o.card, pt, { images: images, quality: 'full' }); fs.writeFileSync(file, await cv.encode('jpeg', 88)); return file; };
  out.poster = await still(sq[0], sq[1], path.join(o.dir, 'poster.jpg'));
  if (sizes.story) out.posterStory = await still(sizes.story[0], sizes.story[1], path.join(o.dir, 'poster-story.jpg'));
  await say(96, 'rendering');
  // the small animated preview, from the square film (silent, a few seconds from the poster's moment)
  const V = CFG.video, from = Math.max(0, Math.min(pt, (out.duration || 0) - V.previewSec)), src = out.square || out[names[0]];
  const g = ffmpeg(['-ss', from.toFixed(2), '-t', String(V.previewSec), '-i', src, '-vf', 'fps=8,scale=' + V.previewPx + ':-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', path.join(o.dir, 'preview.gif')]);
  g.p.stdin.end(); await g.done; out.preview = path.join(o.dir, 'preview.gif');
  out.seconds = Math.round((Date.now() - t0) / 100) / 10;
  await say(100, 'rendering');
  return out;
}
// a smaller copy of an uploaded photo (the longest side at most px), as a JPEG: what the video and the editor use
async function resize(buffer, px) {
  const img = await canvas.loadImage(buffer), k = Math.min(1, px / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
  const cv = canvas.createCanvas(w, h), ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
  return { data: await cv.encode('jpeg', 86), w: w, h: h, from: { w: img.width, h: img.height } };
}
module.exports = { render: render, resize: resize, pictures: pictures, fonts: fonts, seam: seam, canvas: canvas };
