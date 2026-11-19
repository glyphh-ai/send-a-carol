'use strict';
// marketing/instagram/make-ad.cjs : the two Instagram Reels ads (1080x1920, 30 fps, H.264 + AAC, -14 LUFS).
// Made from what record.cjs recorded on a phone from the real pages (and the real carols make-cards.cjs made):
//   1. OPEN   the card page on a phone: the wrapped present (an envelope for Thanksgiving), four taps (a touch dot and
//             a ripple are drawn where the taps were), the unwrap, and the card coming out (the page's own blips)
//   2. SONG   flowing on: the card plays with its song, cut only in a measured quiet gap between sung lines
//   3. STEPS  who it's for / add a few photos / we write it and sing it (the song carries on, lower)
//   4. SHARE  the maker's "Your carol is ready" screen on the phone, a tap on Share, then sendacarol.com (the song
//             ends in the next quiet gap). No price anywhere. Words sit in clear space, never over the phone.
//   node marketing/instagram/make-ad.cjs [christmas|thanksgiving]   -> marketing/instagram/out/<ad>.mp4 + <ad>-cover.jpg
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const HERE = __dirname, ROOT = path.join(HERE, '..', '..'), CARDS = process.env.ADS_DIR || '/tmp/carol-time/ads', REC = process.env.REC_DIR || '/tmp/carol-time/rec', OUTDIR = path.join(HERE, 'out');
const canvas = require(path.join(ROOT, 'node_modules', '@napi-rs', 'canvas'));
require(path.join(ROOT, 'fonts.js')).registerNode(canvas, path.join(ROOT, 'fonts'));
const CFG = require(path.join(ROOT, 'config.js')), B = CFG.brand;

const W = 1080, H = 1920, FPS = 30, STEP = 2.2;
// Song cut points, picked by measuring each song's vocal band (300-3500 Hz, 20 ms windows) around the line
// boundaries the take recorded, and cutting in the quiet gap, never inside a sung word:
//   card: where the card section ends and the steps begin (the song carries on, lower, from there)
//   end:  where the song fades out, at the end of the share screen
const ADS = {
  christmas: { pill: 'Christmas cards that sing', bg: ['#8a1538', '#1d1230'], fall: 'snow', slug: 'pemberton-dad',
    card: 18.45,   // after "...but never know the words to any song." (line 5 enters at 18.6)
    end: 30.0,     // after "Naughty or nice? The verdict's in: it's nice!" (the last line enters at 30.1)
    typed: 'It\'s for Dad. He ate Santa\'s cookies and blamed the dog.', photos: ['5860043', '5860044', '5860105'] },
  thanksgiving: { pill: 'Thanksgiving cards that sing', bg: ['#b4541c', '#3a1a12'], fall: 'leaves', slug: 'whitfield-grandparents',
    card: 19.9,    // after "...And we laugh just as hard, all of us folks." (the chorus enters at 20.5)
    end: 32.45,    // after "No one leaves hungry, no one feels alone," (the last line enters at 32.6)
    typed: 'It\'s for Grandma Rose and Grandpa Hank. Every Thanksgiving is at their house.', photos: ['5591206', '5591173', '5591233'] },
};

// ---------- helpers ----------
const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
const easeOut = function (t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
const easeBack = function (t) { t = clamp(t, 0, 1); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ff(args) { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y'].concat(args), { maxBuffer: 1 << 26 }); if (r.status) throw new Error('ffmpeg: ' + String(r.stderr).slice(-600)); return r; }
function fitFont(c, text, family, size, maxW) { let s = size; c.font = s + 'px "' + family + '"'; while (c.measureText(text).width > maxW && s > 30) { s -= 2; c.font = s + 'px "' + family + '"'; } return s; }
function note(c, x, y, s, col) { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, s * 0.55, s * 0.4, -0.4, 0, Math.PI * 2); c.fill(); c.fillRect(s * 0.38, -s * 1.6, s * 0.16, s * 1.6); c.beginPath(); c.moveTo(s * 0.54, -s * 1.6); c.quadraticCurveTo(s * 1.2, -s * 1.2, s * 1.0, -s * 0.6); c.quadraticCurveTo(s * 0.9, -s * 1.0, s * 0.54, -s * 1.05); c.fill(); c.restore(); }
function sparkle(c, x, y, s, col) { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? s * 0.25 : s; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore(); }
function leaf(c, x, y, r, col, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(r * 0.9, -r * 0.2, 0, r); c.quadraticCurveTo(-r * 0.9, -r * 0.2, 0, -r); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -r * 0.8); c.lineTo(0, r); c.stroke(); c.restore(); }
function makeBg(ad) {
  let s = 7; const rnd = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const bits = Array.from({ length: ad.fall === 'snow' ? 90 : 34 }, function () { return { x: rnd() * W, y: rnd() * H, r: ad.fall === 'snow' ? 3 + rnd() * 8 : 16 + rnd() * 16, v: 60 + rnd() * 120, sway: rnd() * 6, rot: rnd() * 6, col: ['#e8892a', '#d9a520', '#c2410c', '#f2b632', '#b45309'][Math.floor(rnd() * 5)] }; });
  const tw = Array.from({ length: 26 }, function () { return { x: rnd() * W, y: rnd() * H, p: rnd() * 6, s: 6 + rnd() * 10 }; });
  return function (c, t) {
    const g = c.createRadialGradient(W / 2, H * 0.42, 100, W / 2, H * 0.5, H * 0.75); g.addColorStop(0, ad.bg[0]); g.addColorStop(1, ad.bg[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    tw.forEach(function (k) { c.globalAlpha = (0.25 + 0.75 * Math.max(0, Math.sin(t * 3 + k.p))) * 0.8; sparkle(c, k.x, k.y, k.s, B.gold); }); c.globalAlpha = 1;
    bits.forEach(function (b) {
      const y = (b.y + t * b.v) % (H + 80) - 40, x = b.x + Math.sin(t * 1.3 + b.sway) * 30;
      if (ad.fall === 'snow') { c.globalAlpha = 0.75; c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, b.r, 0, Math.PI * 2); c.fill(); } else { c.globalAlpha = 0.9; leaf(c, x, y, b.r, b.col, b.rot + t * 1.5); }
    });
    c.globalAlpha = 1;
  };
}
function pill(c, text, y) {
  c.save(); c.font = '44px "CT Sans Bold"'; const w = c.measureText(text).width + 76;
  rr(c, (W - w) / 2, y - 40, w, 80, 40); c.fillStyle = B.cream; c.fill();
  c.fillStyle = B.berry; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, y + 2); c.restore();
}
function bigText(c, text, y, size, k, color, family) {
  if (k <= 0) return;
  c.save(); const s = 0.6 + 0.4 * easeBack(k); c.globalAlpha = clamp(k * 3, 0, 1);
  c.translate(W / 2, y); c.scale(s, s); fitFont(c, text, family || 'CT Lobster', size, W - 120);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 18; c.shadowOffsetY = 6;
  c.fillStyle = color || B.cream; c.fillText(text, 0, 0); c.restore();
}

// ---------- the phone: an iPhone-sized screen (393 x 852 points): status bar, the page (393 x 660, as recorded), Safari's bar ----------
const PT = { w: 393, h: 852, status: 54, page: 660 };
function phone(c, img, o) {   // o = { cx, top, k (pixels per point), url, pop (0..1) }
  const sw = PT.w * o.k, sh = PT.h * o.k, bz = 18 * o.k / 1.7, x = o.cx - sw / 2, y = o.top, s = 0.85 + 0.15 * easeBack(o.pop == null ? 1 : o.pop);
  c.save(); c.translate(o.cx, y + sh / 2); c.scale(s, s); c.translate(-o.cx, -(y + sh / 2));
  c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 50; c.shadowOffsetY = 20; rr(c, x - bz, y - bz, sw + bz * 2, sh + bz * 2, 58 * o.k / 1.7 + bz); c.fillStyle = '#16121c'; c.fill(); c.shadowColor = 'transparent';
  c.save(); rr(c, x, y, sw, sh, 52 * o.k / 1.7); c.clip();
  c.fillStyle = '#0d0b10'; c.fillRect(x, y, sw, sh);
  c.drawImage(img, x, y + PT.status * o.k, sw, PT.page * o.k);
  // status bar: the time, the island, signal and battery
  c.fillStyle = '#fff'; c.font = Math.round(16 * o.k) + 'px "CT Sans Semi"'; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText('9:41', x + 62 * o.k, y + 30 * o.k);
  rr(c, o.cx - 62 * o.k, y + 12 * o.k, 124 * o.k, 36 * o.k, 18 * o.k); c.fillStyle = '#000'; c.fill();
  c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) c.fillRect(x + sw - 98 * o.k + i * 6 * o.k, y + (34 - 3 * i) * o.k, 4 * o.k, (5 + 3 * i) * o.k);
  c.strokeStyle = '#fff'; c.lineWidth = 1.5 * o.k; rr(c, x + sw - 62 * o.k, y + 24 * o.k, 26 * o.k, 13 * o.k, 4 * o.k); c.stroke(); c.fillRect(x + sw - 59 * o.k, y + 27 * o.k, 18 * o.k, 7 * o.k);
  // Safari's bottom bar with the address
  const by = y + (PT.status + PT.page) * o.k, bh = sh - (PT.status + PT.page) * o.k;
  c.fillStyle = '#1f1b24'; c.fillRect(x, by, sw, bh);
  rr(c, x + 14 * o.k, by + 10 * o.k, sw - 28 * o.k, 44 * o.k, 14 * o.k); c.fillStyle = '#3a3542'; c.fill();
  c.fillStyle = '#fff'; c.font = Math.round(16 * o.k) + 'px "CT Sans Semi"'; c.textAlign = 'center'; c.fillText(o.url, o.cx, by + 33 * o.k);
  c.fillStyle = 'rgba(255,255,255,.85)'; rr(c, o.cx - 67 * o.k, y + sh - 13 * o.k, 134 * o.k, 5 * o.k, 3 * o.k); c.fill();
  c.restore(); c.restore();
}
// a finger's touch on the screen, as screen recordings show it: a soft dot that presses, and a ripple
function touch(c, x, y, k, press, ripple, alpha) {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha = alpha;
  if (ripple > 0 && ripple < 1) { c.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - ripple)) + ')'; c.lineWidth = 6 * (1 - ripple) + 2; c.beginPath(); c.arc(x, y, (24 + 70 * easeOut(ripple)) * k / 1.7, 0, Math.PI * 2); c.stroke(); }
  const r = (30 - 8 * press) * k / 1.7; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 16; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,' + (0.55 + 0.25 * press) + ')'; c.fill();
  c.shadowColor = 'transparent'; c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 3; c.stroke();
  c.restore();
}
function touches(c, taps, t, o) {   // the dot comes in before the first tap, presses at each, leaves after the last
  if (!taps.length) return;
  const first = taps[0].t, last = taps[taps.length - 1].t, alpha = clamp((t - (first - 0.35)) / 0.2, 0, 1) * clamp(1 - (t - (last + 0.35)) / 0.2, 0, 1);
  let i = 0; while (i < taps.length - 1 && t > (taps[i].t + taps[i + 1].t) / 2) i++;
  const tp = taps[i], dt = t - tp.t, press = dt > -0.08 && dt < 0.12 ? 1 - Math.abs(dt - 0.02) / 0.1 : 0;
  let ripple = 0; taps.forEach(function (q) { const d = t - q.t; if (d >= 0 && d < 0.45) ripple = d / 0.45; });
  touch(c, o.cx - PT.w * o.k / 2 + tp.x * o.k, o.top + (PT.status + tp.y) * o.k, o.k, clamp(press, 0, 1), ripple, alpha);
}

// ---------- the steps ----------
function stepHead(c, n, text, ts) {
  const k = clamp(ts / 0.3, 0, 1);
  c.save(); const s = easeBack(k); c.translate(W / 2, 400); c.scale(s, s);
  c.beginPath(); c.arc(0, 0, 78, 0, Math.PI * 2); c.fillStyle = B.gold; c.fill(); c.fillStyle = B.ink; c.font = '92px "CT Sans Bold"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), 0, 8); c.restore();
  bigText(c, text, 1420, 104, clamp((ts - 0.08) / 0.35, 0, 1), B.cream);
}
function drawStep(c, ad, n, ts, tAll, pics, poster) {
  const slide = ts < 0.16 ? (1 - easeOut(ts / 0.16)) * W * 0.6 : 0;
  c.save(); c.translate(slide, 0);
  if (n === 1) {
    stepHead(c, 1, 'Tell us who it\'s for', ts);
    const text = ad.typed, shown = text.slice(0, Math.floor(clamp((ts - 0.2) / (STEP - 0.8), 0, 1) * text.length));
    c.font = '50px "CT Sans Semi"'; const lines = [], words = shown.split(' '); let cur = '';
    words.forEach(function (w) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > 760) { lines.push(cur); cur = w; } else cur = t; }); lines.push(cur);
    const bh = Math.max(1, lines.length) * 70 + 70, by = 840 - bh / 2;
    rr(c, 120, by, 840, bh, 44); c.fillStyle = '#fff'; c.fill(); c.beginPath(); c.moveTo(860, by + bh - 4); c.lineTo(940, by + bh + 50); c.lineTo(800, by + bh - 4); c.fill();
    c.fillStyle = B.ink; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; lines.forEach(function (l, i) { c.fillText(l + (i === lines.length - 1 && Math.floor(tAll * 3) % 2 ? '|' : ''), 160, by + 92 + i * 70); });
  } else if (n === 2) {
    stepHead(c, 2, 'Add a few photos', ts);
    pics.forEach(function (img, i) {
      const k = easeBack((ts - 0.15 - i * 0.18) / 0.4); if (k <= 0) return;
      const fx = [300, 540, 780][i], fy = [880, 820, 880][i], rot = [-0.16, 0.03, 0.15][i], from = [-700, 0, 700][i], pw = 430, ph = pw * img.height / img.width;
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
    for (let i = 0; i < 8; i++) { const p = ((ts * 0.9 + i / 8) % 1), side = i % 2 ? 1 : -1, x = W / 2 + side * (300 + 60 * Math.sin(i * 2 + ts * 4)), y = 1250 - p * 700; c.globalAlpha = Math.sin(p * Math.PI); note(c, x, y, 26 + (i % 3) * 8, [B.gold, B.coral, B.cream][i % 3]); } c.globalAlpha = 1;
  }
  c.restore();
}

// ---------- the sound: the page's blips, the song from the moment the card starts playing (lower under the steps
// and the share screen), faded out in its quiet gap at the very end; then two-pass loudnorm to -14 LUFS ----------
function sound(ad, rec, plan, file) {
  const song = path.join(CARDS, ad.slug, 'song.m4a'), v0 = plan.card - plan.t0;   // song time when the steps begin
  const f = '[1:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:' + ad.end + ",volume='if(lt(t," + v0 + "),1,max(0.6,1-(t-" + v0 + ')/0.4*0.4))\':eval=frame,afade=t=out:st=' + (ad.end - 0.35) + ':d=0.35,adelay=' + Math.round(plan.t0 * 1000) + '|' + Math.round(plan.t0 * 1000) + '[s];' +
    '[0:a]aresample=44100,aformat=channel_layouts=stereo[x];[x][s]amix=inputs=2:duration=longest:normalize=0[mix]';
  const raw = file + '.raw.wav';
  ff(['-i', rec.sfx, '-i', song, '-filter_complex', f, '-map', '[mix]', '-t', plan.total.toFixed(3), raw]);
  const m = cp.spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const j = JSON.parse(/\{[\s\S]*\}/.exec(m.stderr)[0]);
  ff(['-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=' + j.input_i + ':measured_TP=' + j.input_tp + ':measured_LRA=' + j.input_lra + ':measured_thresh=' + j.input_thresh + ':offset=' + j.target_offset + ':linear=true', '-ar', '44100', file]);
  fs.unlinkSync(raw);
}

async function make(name) {
  const ad = ADS[name], rec = JSON.parse(fs.readFileSync(path.join(REC, name, 'rec.json'), 'utf8')), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-ad-')), bg = makeBg(ad);
  fs.mkdirSync(OUTDIR, { recursive: true });
  // the plan, in seconds of the ad: t0 = where the song's 0 s falls (the card page's own clock said so, frame by frame)
  const p = rec.playFrame, plan = { t0: p / FPS - rec.clock[p].t };
  plan.card = plan.t0 + ad.card; plan.steps = plan.card + 3 * STEP; plan.total = plan.t0 + ad.end;
  const openFrame = function (t) { return path.join(REC, name, 'open', 'f' + String(clamp(Math.round(t * FPS) + 1, 1, rec.openFrames)).padStart(5, '0') + '.jpg'); };
  const shareFrame = function (t) { return path.join(REC, name, 'share', 'f' + String(clamp(Math.round(t * FPS) + 1, 1, rec.shareFrames)).padStart(5, '0') + '.jpg'); };
  const pics = []; for (const q of ad.photos) pics.push(await canvas.loadImage(fs.readFileSync(path.join(HERE, 'photos', 'pexels-' + q + '.jpg'))));
  const poster = await canvas.loadImage(fs.readFileSync(path.join(CARDS, ad.slug, 'poster-story.jpg')));
  const wav = path.join(tmp, 'sound.wav'); sound(ad, rec, plan, wav);
  const BIG = { cx: W / 2, top: 262, k: 1490 / PT.h, url: CFG.domain + '/' + ad.slug }, SMALL = { cx: W / 2, top: 236, k: 1270 / PT.h, url: CFG.domain + '/make' };
  const share = rec.buttons[0], tapAt = rec.shareScrollEnd / FPS + 0.45;   // the Share button, once the screen has glided to it
  const n = Math.round(plan.total * FPS), silent = path.join(tmp, 'video.mp4'), out = path.join(OUTDIR, name + '.mp4');
  const pr = cp.spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', W + 'x' + H, '-r', String(FPS), '-i', 'pipe:0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-g', String(FPS), silent], { stdio: ['pipe', 'ignore', 'inherit'] });
  const done = new Promise(function (ok, no) { pr.on('close', function (code) { if (code) no(new Error('ffmpeg ' + code)); else ok(); }); });
  const cv = canvas.createCanvas(W, H), c = cv.getContext('2d');
  const drawShare = async function (ts, t) {
    pill(c, 'Share it or send it', 150);
    phone(c, await canvas.loadImage(shareFrame(ts)), Object.assign({ pop: clamp(ts / 0.3, 0, 1) }, SMALL));
    touches(c, [{ t: tapAt, x: share.x, y: share.y }], ts, SMALL);
    bigText(c, CFG.domain, 1640, 84, clamp((ts - tapAt - 0.3) / 0.35, 0, 1), B.cream, 'CT Sans Bold');
  };
  for (let f = 0; f < n; f++) {
    const t = f / FPS; c.save(); bg(c, t);
    if (t < plan.card) { pill(c, ad.pill, 168); phone(c, await canvas.loadImage(openFrame(t)), BIG); touches(c, rec.taps, t, BIG); }
    else if (t < plan.steps) { const s = Math.floor((t - plan.card) / STEP); drawStep(c, ad, s + 1, t - plan.card - s * STEP, t, pics, poster); }
    else await drawShare(t - plan.steps, t);
    c.restore();
    if (!pr.stdin.write(cv.data())) await new Promise(function (ok) { pr.stdin.once('drain', ok); });
  }
  pr.stdin.end(); await done;
  ff(['-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out]);
  // the cover: the present about to be opened, the finger on it
  const ct = rec.taps[2].t; c.save(); bg(c, 2); pill(c, ad.pill, 168); phone(c, await canvas.loadImage(openFrame(ct)), BIG); touch(c, BIG.cx - PT.w * BIG.k / 2 + rec.taps[2].x * BIG.k, BIG.top + (PT.status + rec.taps[2].y) * BIG.k, BIG.k, 1, 0.3, 1); c.restore();
  fs.writeFileSync(path.join(OUTDIR, name + '-cover.jpg'), await cv.encode('jpeg', 90));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(name + ': ' + out + ' (' + plan.total.toFixed(2) + ' s; open + card 0-' + plan.card.toFixed(2) + ' (song 0-' + ad.card + ' s from ' + plan.t0.toFixed(2) + '), steps to ' + plan.steps.toFixed(2) + ', share to ' + plan.total.toFixed(2) + ' (song on to ' + ad.end + ' s))');
}

(async function () {
  for (const w of (process.argv[2] ? [process.argv[2]] : Object.keys(ADS))) await make(w);
})().catch(function (e) { console.error(e); process.exit(1); });
