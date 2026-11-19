'use strict';
// marketing/instagram/make-ad.cjs : the two Instagram Reels ads (1080x1920, 30 fps, H.264 + AAC), cut from the real
// carols make-cards.cjs made (their story.mp4, drawn by the product's own engine, with their own songs).
// Each ad: four quick clips of finished cards (one per member of one made-up family, the song audible), then three
// quick steps (who it's for / add photos / we write it and sing it), then the end card (the Send a Carol lockup,
// "Custom greeting cards that sing.", sendacarol.com, "from $4.99"). The last card's song carries on, a little
// lower, under the steps and the end card. On-screen words sit in clear space, never over a card.
//   node marketing/instagram/make-ad.cjs [christmas|thanksgiving]   -> marketing/instagram/out/<ad>.mp4 + <ad>-cover.jpg
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const HERE = __dirname, ROOT = path.join(HERE, '..', '..'), CARDS = process.env.ADS_DIR || '/tmp/carol-time/ads', OUTDIR = path.join(HERE, 'out');
const canvas = require(path.join(ROOT, 'node_modules', '@napi-rs', 'canvas'));
require(path.join(ROOT, 'fonts.js')).registerNode(canvas, path.join(ROOT, 'fonts'));
const Brand = require(path.join(ROOT, 'brand.js')), CFG = require(path.join(ROOT, 'config.js')), B = CFG.brand;

const W = 1080, H = 1920, FPS = 30, CLIP = 4.8, STEP = 2.0, END = 4.2;
// the card on screen: two thirds of its size, the top band (y < 260) and the bottom band (y > 1560) left for words
const CW = 720, CH = 1280, CX = (W - CW) / 2, CY = 268;
const ADS = {
  christmas: {
    pill: 'Christmas cards that sing', bg: ['#8a1538', '#1d1230'], fall: 'snow', poster: 'pemberton-theo',
    clips: [
      { slug: 'pemberton-theo', at: 1.4, label: 'For Theo' },
      { slug: 'pemberton-marshmallow', at: 1.4, label: 'For Marshmallow, the dog' },
      { slug: 'pemberton-mom', at: 1.6, label: 'For Mom' },
      { slug: 'pemberton-dad', at: 1.6, label: 'For Dad' },
    ],
    typed: 'It\'s for Theo. He\'s 3 and loves the tree lights.',
    photos: ['5860105', '5860026', '5860043'],
  },
  thanksgiving: {
    pill: 'Thanksgiving cards that sing', bg: ['#b4541c', '#3a1a12'], fall: 'leaves', poster: 'whitfield-kids',
    clips: [
      { slug: 'whitfield-grandparents', at: 18.0, label: 'For Grandma & Grandpa' },
      { slug: 'whitfield-mom', at: 1.6, label: 'For Mom' },
      { slug: 'whitfield-kids', at: 1.4, label: 'For Ruby & Leo' },
      { slug: 'whitfield-dad', at: 1.6, label: 'For Dad' },
    ],
    typed: 'It\'s for Grandma and Grandpa. Every Thanksgiving is at their house.',
    photos: ['5591206', '5591233', '5591231'],
  },
};

// ---------- helpers ----------
const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
const easeOut = function (t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
const easeBack = function (t) { t = clamp(t, 0, 1); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ff(args, opts) { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y'].concat(args), Object.assign({ maxBuffer: 1 << 26 }, opts)); if (r.status) throw new Error('ffmpeg: ' + String(r.stderr).slice(-600)); return r; }
function fitFont(c, text, family, size, maxW) { let s = size; c.font = s + 'px "' + family + '"'; while (c.measureText(text).width > maxW && s > 30) { s -= 2; c.font = s + 'px "' + family + '"'; } return s; }
function note(c, x, y, s, col) { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, s * 0.55, s * 0.4, -0.4, 0, Math.PI * 2); c.fill(); c.fillRect(s * 0.38, -s * 1.6, s * 0.16, s * 1.6); c.beginPath(); c.moveTo(s * 0.54, -s * 1.6); c.quadraticCurveTo(s * 1.2, -s * 1.2, s * 1.0, -s * 0.6); c.quadraticCurveTo(s * 0.9, -s * 1.0, s * 0.54, -s * 1.05); c.fill(); c.restore(); }
function heart(c, x, y, s, col) { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); c.moveTo(0, s * 0.35); c.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.05, 0, -s * 0.45); c.bezierCurveTo(s * 0.45, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35); c.fill(); c.restore(); }
function sparkle(c, x, y, s, col) { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? s * 0.25 : s; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore(); }
function leaf(c, x, y, r, col, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(r * 0.9, -r * 0.2, 0, r); c.quadraticCurveTo(-r * 0.9, -r * 0.2, 0, -r); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -r * 0.8); c.lineTo(0, r); c.stroke(); c.restore(); }

// the background: the holiday's gradient, things falling and a few twinkles (the same pattern every run)
function makeBg(ad) {
  let s = 7; const rnd = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const bits = Array.from({ length: ad.fall === 'snow' ? 90 : 34 }, function () { return { x: rnd() * W, y: rnd() * H, r: ad.fall === 'snow' ? 3 + rnd() * 8 : 16 + rnd() * 16, v: 60 + rnd() * 120, sway: rnd() * 6, rot: rnd() * 6, col: ['#e8892a', '#d9a520', '#c2410c', '#f2b632', '#b45309'][Math.floor(rnd() * 5)] }; });
  const tw = Array.from({ length: 26 }, function () { return { x: rnd() * W, y: rnd() * H, p: rnd() * 6, s: 6 + rnd() * 10 }; });
  return function (c, t) {
    const g = c.createRadialGradient(W / 2, H * 0.42, 100, W / 2, H * 0.5, H * 0.75); g.addColorStop(0, ad.bg[0]); g.addColorStop(1, ad.bg[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    tw.forEach(function (k) { const a = 0.25 + 0.75 * Math.max(0, Math.sin(t * 3 + k.p)); c.globalAlpha = a * 0.8; sparkle(c, k.x, k.y, k.s, B.gold); }); c.globalAlpha = 1;
    bits.forEach(function (b) {
      const y = (b.y + t * b.v) % (H + 80) - 40, x = b.x + Math.sin(t * 1.3 + b.sway) * 30;
      if (ad.fall === 'snow') { c.globalAlpha = 0.75; c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, b.r, 0, Math.PI * 2); c.fill(); }
      else { c.globalAlpha = 0.9; leaf(c, x, y, b.r, b.col, b.rot + t * 1.5); }
    });
    c.globalAlpha = 1;
  };
}
function pill(c, text, y, alpha) {
  c.save(); c.globalAlpha = alpha; c.font = '44px "CT Sans Bold"'; const w = c.measureText(text).width + 76;
  rr(c, (W - w) / 2, y - 40, w, 80, 40); c.fillStyle = B.cream; c.fill();
  c.fillStyle = B.berry; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, y + 2); c.restore();
}
function bigText(c, text, y, size, k, color, family) {   // a word line that pops in (k 0..1), with a soft shadow
  c.save(); const s = 0.6 + 0.4 * easeBack(k); c.globalAlpha = clamp(k * 3, 0, 1);
  c.translate(W / 2, y); c.scale(s, s); fitFont(c, text, family || 'CT Lobster', size, W - 120);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 18; c.shadowOffsetY = 6;
  c.fillStyle = color || B.cream; c.fillText(text, 0, 0); c.restore();
}

// ---------- the parts ----------
function extract(clip, dir) {   // the card's frames for the clip's window, at the size it is shown
  const d = path.join(dir, clip.slug); fs.mkdirSync(d, { recursive: true });
  ff(['-ss', String(clip.at), '-t', String(CLIP), '-i', path.join(CARDS, clip.slug, 'story.mp4'), '-vf', 'fps=' + FPS + ',scale=' + CW + ':' + CH + ':flags=lanczos', '-q:v', '2', path.join(d, 'f%04d.jpg')]);
  return fs.readdirSync(d).filter(function (f) { return /\.jpg$/.test(f); }).sort().map(function (f) { return path.join(d, f); });
}
async function drawClip(c, ad, i, frames, tc, bg, tAll) {
  bg(c, tAll);
  pill(c, ad.pill, 168, 1);
  const img = await canvas.loadImage(frames[Math.min(frames.length - 1, Math.floor(tc * FPS))]);
  const k = easeBack(tc / 0.32), dir = i % 2 ? -1 : 1, tilt = dir * (1.2 + (1 - clamp(tc / 0.32, 0, 1)) * 7) * Math.PI / 180;
  const scale = 0.8 + 0.2 * k, dx = (1 - easeOut(tc / 0.26)) * 420 * dir;
  c.save(); c.translate(W / 2 + dx, CY + CH / 2); c.rotate(tilt); c.scale(scale, scale);
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.shadowOffsetY = 16; rr(c, -CW / 2 - 12, -CH / 2 - 12, CW + 24, CH + 24, 34); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent';
  c.save(); rr(c, -CW / 2, -CH / 2, CW, CH, 24); c.clip(); c.drawImage(img, -CW / 2, -CH / 2, CW, CH); c.restore();
  c.restore();
  // the label in the band under the card, with a note and a heart either side
  const kl = clamp((tc - 0.12) / 0.35, 0, 1);
  bigText(c, ad.clips[i].label, 1648, 88, kl, B.cream);
  if (kl > 0.5) { c.save(); c.font = '88px "CT Lobster"'; fitFont(c, ad.clips[i].label, 'CT Lobster', 88, W - 120); const w = Math.min(c.measureText(ad.clips[i].label).width, W - 120), bob = Math.sin(tAll * 8) * 6; c.restore(); if (w < W - 260) { note(c, W / 2 - w / 2 - 50, 1630 + bob, 22, B.gold); heart(c, W / 2 + w / 2 + 48, 1618 - bob, 26, B.coral); } }
  // a quick white flash on the cut
  if (tc < 0.12) { c.fillStyle = 'rgba(255,255,255,' + (0.75 * (1 - tc / 0.12)) + ')'; c.fillRect(0, 0, W, H); }
}
function stepHead(c, n, text, ts) {
  const k = clamp(ts / 0.3, 0, 1);
  c.save(); const s = easeBack(k); c.translate(W / 2, 400); c.scale(s, s);
  c.beginPath(); c.arc(0, 0, 78, 0, Math.PI * 2); c.fillStyle = B.gold; c.fill(); c.fillStyle = B.ink; c.font = '92px "CT Sans Bold"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), 0, 8); c.restore();
  bigText(c, text, 1420, 104, clamp((ts - 0.08) / 0.35, 0, 1), B.cream);
}
async function drawStep(c, ad, n, ts, bg, tAll, pics, poster) {
  bg(c, tAll);
  const slide = ts < 0.16 ? (1 - easeOut(ts / 0.16)) * W * 0.6 : 0;
  c.save(); c.translate(slide, 0);
  if (n === 1) {
    stepHead(c, 1, 'Tell us who it\'s for', ts);
    const text = ad.typed, shown = text.slice(0, Math.floor(clamp((ts - 0.2) / 1.2, 0, 1) * text.length));
    c.font = '50px "CT Sans Semi"'; const lines = [], words = shown.split(' '); let cur = '';
    words.forEach(function (w) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > 760) { lines.push(cur); cur = w; } else cur = t; }); lines.push(cur);
    const bh = Math.max(1, lines.length) * 70 + 70, by = 840 - bh / 2;
    rr(c, 120, by, 840, bh, 44); c.fillStyle = '#fff'; c.fill(); c.beginPath(); c.moveTo(860, by + bh - 4); c.lineTo(940, by + bh + 50); c.lineTo(800, by + bh - 4); c.fill();
    c.fillStyle = B.ink; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; lines.forEach(function (l, i) { c.fillText(l + (i === lines.length - 1 && Math.floor(tAll * 3) % 2 ? '|' : ''), 160, by + 92 + i * 70); });
  } else if (n === 2) {
    stepHead(c, 2, 'Add a few photos', ts);
    pics.forEach(function (img, i) {
      const k = easeBack((ts - 0.15 - i * 0.18) / 0.4); if (k <= 0) return;
      const fx = [300, 540, 780][i], fy = [880, 820, 880][i], rot = [-0.16, 0.03, 0.15][i], from = [-700, 0, 700][i];
      const pw = 400, ph = pw * img.height / img.width;
      c.save(); c.translate(fx + from * (1 - k), fy + (i === 1 ? -600 : 300) * (1 - k)); c.rotate(rot * k);
      c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 30; c.shadowOffsetY = 12; c.fillStyle = '#fff'; c.fillRect(-pw / 2 - 18, -ph / 2 - 18, pw + 36, ph + 80); c.shadowColor = 'transparent';
      c.drawImage(img, -pw / 2, -ph / 2, pw, ph); c.restore();
    });
  } else {
    stepHead(c, 3, 'We write it and sing it', ts);
    const k = easeBack((ts - 0.1) / 0.4), pw = 380, ph = pw * 16 / 9;
    c.save(); c.translate(W / 2, 860); c.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); c.rotate(-0.04);
    c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; rr(c, -pw / 2 - 10, -ph / 2 - 10, pw + 20, ph + 20, 24); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent';
    c.save(); rr(c, -pw / 2, -ph / 2, pw, ph, 16); c.clip(); c.drawImage(poster, -pw / 2, -ph / 2, pw, ph); c.restore(); c.restore();
    // notes flying up out of the card on both sides
    for (let i = 0; i < 8; i++) { const p = ((ts * 0.9 + i / 8) % 1), side = i % 2 ? 1 : -1, x = W / 2 + side * (300 + 60 * Math.sin(i * 2 + ts * 4)), y = 1250 - p * 700; c.globalAlpha = Math.sin(p * Math.PI); note(c, x, y, 26 + (i % 3) * 8, [B.gold, B.coral, B.cream][i % 3]); } c.globalAlpha = 1;
  }
  c.restore();
}
async function drawEnd(c, ad, te, bg, tAll, mark) {
  bg(c, tAll);
  const k1 = easeBack(te / 0.4), k2 = clamp((te - 0.15) / 0.4, 0, 1), k3 = clamp((te - 0.35) / 0.4, 0, 1), k4 = clamp((te - 0.55) / 0.4, 0, 1), k5 = clamp((te - 0.75) / 0.4, 0, 1);
  // the lockup as brand.js draws it: the mark, then the name in the wordmark face at 0.74 of the mark's height
  const mh = 170; c.font = Math.round(mh * 0.74) + 'px "CT Lobster"'; const lw = mh * 1.12 + c.measureText(CFG.name).width, lx = (W - lw) / 2, ly = 760;
  c.save(); c.translate(lx + mh / 2, ly + mh / 2 + Math.sin(tAll * 4) * 6); c.scale(k1, k1); c.rotate(Math.sin(tAll * 3) * 0.06); c.drawImage(mark, -mh / 2, -mh / 2, mh, mh); c.restore();
  if (k2 > 0) { c.save(); c.globalAlpha = clamp(k2 * 2.5, 0, 1); c.font = Math.round(mh * 0.74) + 'px "CT Lobster"'; c.fillStyle = B.cream; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 18; c.shadowOffsetY = 6; c.fillText(CFG.name, lx + mh * 1.12 + (1 - easeOut(k2)) * 60, ly + mh * 0.8); c.restore(); }
  bigText(c, 'Custom greeting cards that sing.', 1070, 54, k3, B.gold, 'CT Sans Semi');
  bigText(c, CFG.domain, 1210, 76, k4, B.cream, 'CT Sans Bold');
  if (k5 > 0) { c.save(); const s = easeBack(k5) * (1 + Math.sin(tAll * 6) * 0.03); c.translate(W / 2, 1350); c.scale(s, s); c.font = '58px "CT Sans Bold"'; const w = c.measureText('from $4.99').width + 90; rr(c, -w / 2, -52, w, 104, 52); c.fillStyle = B.coral; c.fill(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('from $4.99', 0, 4); c.restore(); }
  // sparkles bursting from behind the mark
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = 180 + easeOut(te / 1.2) * 300; c.globalAlpha = clamp(1 - te / 1.6, 0, 1); sparkle(c, W / 2 + Math.cos(a) * r * 1.6, 845 + Math.sin(a) * r, 16, i % 2 ? B.gold : B.cream); } c.globalAlpha = 1;
}

// ---------- the sound: clips 1-3 as they are, clip 4's song carrying on lower under the steps and the end ----------
function sound(ad, file) {
  const total = ad.clips.length * CLIP + 3 * STEP + END, tail = total - (ad.clips.length - 1) * CLIP, inputs = [], parts = [];
  ad.clips.forEach(function (cl, i) {
    const last = i === ad.clips.length - 1, len = last ? tail : CLIP;
    inputs.push('-ss', String(cl.at), '-t', String(len), '-i', path.join(CARDS, cl.slug, 'story.mp4'));
    const vol = last ? ",volume='if(lt(t," + CLIP + "),1,0.8)':eval=frame,afade=t=out:st=" + (len - 1.6).toFixed(2) + ':d=1.6' : ',afade=t=out:st=' + (len - 0.06).toFixed(2) + ':d=0.06';
    parts.push('[' + i + ':a]aresample=44100,aformat=channel_layouts=stereo,afade=t=in:d=0.03' + vol + '[a' + i + ']');
  });
  const cat = parts.join(';') + ';' + ad.clips.map(function (x, i) { return '[a' + i + ']'; }).join('') + 'concat=n=' + ad.clips.length + ':v=0:a=1[mix]';
  const raw = file + '.raw.wav';
  ff(inputs.concat(['-filter_complex', cat, '-map', '[mix]', '-t', total.toFixed(3), raw]));
  // two-pass loudnorm to -14 LUFS
  const m = cp.spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const j = JSON.parse(/\{[\s\S]*\}/.exec(m.stderr)[0]);
  ff(['-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=' + j.input_i + ':measured_TP=' + j.input_tp + ':measured_LRA=' + j.input_lra + ':measured_thresh=' + j.input_thresh + ':offset=' + j.target_offset + ':linear=true', '-ar', '44100', file]);
  fs.unlinkSync(raw);
  return total;
}

async function make(name) {
  const ad = ADS[name], tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-ad-')), bg = makeBg(ad);
  fs.mkdirSync(OUTDIR, { recursive: true });
  const frames = ad.clips.map(function (cl) { return extract(cl, tmp); });
  const pics = []; for (const p of ad.photos) pics.push(await canvas.loadImage(fs.readFileSync(path.join(HERE, 'photos', 'pexels-' + p + '.jpg'))));
  const poster = await canvas.loadImage(fs.readFileSync(path.join(CARDS, ad.poster, 'poster-story.jpg')));
  const mark = await canvas.loadImage(Buffer.from(Brand.markSvg({ size: 600 })));
  const wav = path.join(tmp, 'sound.wav'), total = sound(ad, wav), n = Math.round(total * FPS);
  const silent = path.join(tmp, 'video.mp4'), out = path.join(OUTDIR, name + '.mp4');
  const p = cp.spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', W + 'x' + H, '-r', String(FPS), '-i', 'pipe:0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-g', String(FPS), silent], { stdio: ['pipe', 'ignore', 'inherit'] });
  const done = new Promise(function (ok, no) { p.on('close', function (code) { if (code) no(new Error('ffmpeg ' + code)); else ok(); }); });
  const cv = canvas.createCanvas(W, H), c = cv.getContext('2d'), clipEnd = ad.clips.length * CLIP;
  const frameAt = async function (t) {
    c.save();
    if (t < clipEnd) { const i = Math.floor(t / CLIP); await drawClip(c, ad, i, frames[i], t - i * CLIP, bg, t); }
    else if (t < clipEnd + 3 * STEP) { const s = Math.floor((t - clipEnd) / STEP); await drawStep(c, ad, s + 1, t - clipEnd - s * STEP, bg, t, pics, poster); }
    else await drawEnd(c, ad, t - clipEnd - 3 * STEP, bg, t, mark);
    c.restore();
  };
  for (let f = 0; f < n; f++) {
    await frameAt(f / FPS);
    if (!p.stdin.write(cv.data())) await new Promise(function (ok) { p.stdin.once('drain', ok); });
  }
  p.stdin.end(); await done;
  ff(['-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out]);
  // the cover: the first card at its photo moment, the pill above and the domain below
  c.save(); bg(c, 2); pill(c, ad.pill, 168, 1);
  const img = await canvas.loadImage(frames[0][Math.min(frames[0].length - 1, Math.round(3.2 * FPS))]);
  c.save(); c.translate(W / 2, CY + CH / 2); c.rotate(-0.02); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; rr(c, -CW / 2 - 12, -CH / 2 - 12, CW + 24, CH + 24, 34); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent'; c.save(); rr(c, -CW / 2, -CH / 2, CW, CH, 24); c.clip(); c.drawImage(img, -CW / 2, -CH / 2, CW, CH); c.restore(); c.restore();
  bigText(c, CFG.domain, 1648, 76, 1, B.cream, 'CT Sans Bold'); c.restore();
  fs.writeFileSync(path.join(OUTDIR, name + '-cover.jpg'), await cv.encode('jpeg', 90));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(name + ': ' + out + ' (' + total.toFixed(1) + ' s)');
}

(async function () {
  const which = process.argv[2] ? [process.argv[2]] : Object.keys(ADS);
  for (const w of which) await make(w);
})().catch(function (e) { console.error(e); process.exit(1); });
