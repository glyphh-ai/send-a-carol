'use strict';
// marketing/instagram/make-simple.cjs : the simple, all-cartoon Instagram Reel (1080x1920, 30 fps, H.264 + AAC, -14 LUFS)
// and the still ad image. Three scenes, nothing else:
//   1. OPEN   a drawn envelope pops in, its flap opens, the card comes out
//   2. CAROL  the card plays with its song for about 20 seconds (cut in a quiet gap between sung lines)
//   3. CLOSE  the brand, the tagline and the address, as the song's next line ends
// The card is the landing page's own example carol (examples/for-uncle-dave.mp4: made-up people, code-drawn pictures,
// a real song), so nothing here costs money and no real person is shown. No price anywhere. Words sit in clear
// space, never over the card.
//   node marketing/instagram/make-simple.cjs   -> out/christmas-cartoon.mp4, -cover.jpg (9:16), -ad.jpg (4:5)
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const HERE = __dirname, ROOT = path.join(HERE, '..', '..'), OUTDIR = path.join(HERE, 'out');
const canvas = require(path.join(ROOT, 'node_modules', '@napi-rs', 'canvas'));
require(path.join(ROOT, 'fonts.js')).registerNode(canvas, path.join(ROOT, 'fonts'));
const CFG = require(path.join(ROOT, 'config.js')), B = CFG.brand, Brand = require(path.join(ROOT, 'brand.js'));

const W = 1080, H = 1920, FPS = 30, NAME = 'christmas-cartoon';
const SRC = path.join(ROOT, 'examples', 'for-uncle-dave.mp4'), PILL = 'Christmas cards that sing';
// Song cut points, measured on the song's vocal band (300-3500 Hz, 100 ms windows): the quiet gaps between sung lines.
const CARD = 21.3;    // the card leaves after "Shout it loud for Uncle Dave," (the gap before line 6)
const END = 24.9;     // the song fades out after "Undefeated at charades!" (the gap before line 7)
const T0 = 2.6;       // the ad second at which the card (and its song) starts
const TOTAL = T0 + END + 0.5;
const CW = 864, CH = 1536, CX = W / 2, CY = 236 + CH / 2;   // the card on the screen: 1.6 times the example video

const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
const easeOut = function (t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
const easeIO = function (t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeBack = function (t) { t = clamp(t, 0, 1); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const lerp = function (a, b, k) { return a + (b - a) * k; };
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ff(args) { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y'].concat(args), { maxBuffer: 1 << 26 }); if (r.status) throw new Error('ffmpeg: ' + String(r.stderr).slice(-600)); return r; }
function note(c, x, y, s, col) { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, s * 0.55, s * 0.4, -0.4, 0, Math.PI * 2); c.fill(); c.fillRect(s * 0.38, -s * 1.6, s * 0.16, s * 1.6); c.beginPath(); c.moveTo(s * 0.54, -s * 1.6); c.quadraticCurveTo(s * 1.2, -s * 1.2, s * 1.0, -s * 0.6); c.quadraticCurveTo(s * 0.9, -s * 1.0, s * 0.54, -s * 1.05); c.fill(); c.restore(); }
function sparkle(c, x, y, s, col) { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? s * 0.25 : s; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore(); }

// ---------- the background: a deep berry night, gold twinkles, falling snow ----------
function makeBg(Wd, Hd) {
  let s = 7; const rnd = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const snow = Array.from({ length: 90 }, function () { return { x: rnd() * Wd, y: rnd() * Hd, r: 3 + rnd() * 8, v: 60 + rnd() * 120, sway: rnd() * 6 }; });
  const tw = Array.from({ length: 26 }, function () { return { x: rnd() * Wd, y: rnd() * Hd, p: rnd() * 6, s: 6 + rnd() * 10 }; });
  return function (c, t) {
    const g = c.createRadialGradient(Wd / 2, Hd * 0.42, 100, Wd / 2, Hd * 0.5, Hd * 0.75); g.addColorStop(0, '#8a1538'); g.addColorStop(1, B.night);
    c.fillStyle = g; c.fillRect(0, 0, Wd, Hd);
    tw.forEach(function (k) { c.globalAlpha = (0.25 + 0.75 * Math.max(0, Math.sin(t * 3 + k.p))) * 0.8; sparkle(c, k.x, k.y, k.s, B.gold); });
    c.globalAlpha = 0.75; c.fillStyle = '#fff';
    snow.forEach(function (b) { const y = (b.y + t * b.v) % (Hd + 80) - 40, x = b.x + Math.sin(t * 1.3 + b.sway) * 30; c.beginPath(); c.arc(x, y, b.r, 0, Math.PI * 2); c.fill(); });
    c.globalAlpha = 1;
  };
}
function pill(c, text, cx, y, k, size) {
  if (k <= 0) return;
  size = size || 44; c.save(); c.globalAlpha = clamp(k * 2, 0, 1); c.translate(cx, y); const s = 0.7 + 0.3 * easeBack(k); c.scale(s, s);
  c.font = size + 'px "CT Sans Bold"'; const w = c.measureText(text).width + size * 1.7, h = size * 1.8;
  c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 18; c.shadowOffsetY = 6; rr(c, -w / 2, -h / 2, w, h, h / 2); c.fillStyle = B.cream; c.fill(); c.shadowColor = 'transparent';
  c.fillStyle = B.berry; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 2); c.restore();
}
function words(c, text, cx, y, size, k, family, color) {
  if (k <= 0) return;
  c.save(); const s = 0.6 + 0.4 * easeBack(k); c.globalAlpha = clamp(k * 3, 0, 1); c.translate(cx, y); c.scale(s, s);
  c.font = size + 'px "' + (family || 'CT Lobster') + '"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 18; c.shadowOffsetY = 6; c.fillStyle = color || B.cream; c.fillText(text, 0, 0); c.restore();
}
// the card: the example video's frame in a white card edge, at (cx, cy), `w` wide, turned by `rot`
function card(c, img, cx, cy, w, rot) {
  const h = w * CH / CW, e = w * 0.014, r = w * 0.035;
  c.save(); c.translate(cx, cy); c.rotate(rot || 0);
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = w * 0.06; c.shadowOffsetY = w * 0.022; rr(c, -w / 2 - e, -h / 2 - e, w + e * 2, h + e * 2, r + e); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent';
  rr(c, -w / 2, -h / 2, w, h, r); c.clip(); c.imageSmoothingQuality = 'high'; c.drawImage(img, -w / 2, -h / 2, w, h); c.restore();
}
// ---------- the envelope, drawn: cream paper, a berry lining, a gold seal with a note on it ----------
const ENV = { w: 660, h: 440 };
function envBack(c, flap) {   // flap: 0 shut .. 1 open (the flap stands up behind, its lining showing)
  const w = ENV.w, h = ENV.h;
  c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 40; c.shadowOffsetY = 18; rr(c, -w / 2, -h / 2, w, h, 26); c.fillStyle = '#f3e6d0'; c.fill(); c.restore();
  rr(c, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 16); c.fillStyle = B.berry; c.fill();
  if (flap > 0.5) { const k = (flap - 0.5) * 2; c.beginPath(); c.moveTo(-w / 2 + 6, -h / 2 + 8); c.lineTo(0, -h / 2 - h * 0.56 * k); c.lineTo(w / 2 - 6, -h / 2 + 8); c.closePath(); c.fillStyle = '#a3144c'; c.fill(); c.strokeStyle = '#f3e6d0'; c.lineWidth = 12; c.lineJoin = 'round'; c.stroke(); }
}
function envFront(c, flap) {
  const w = ENV.w, h = ENV.h;
  c.save(); rr(c, -w / 2, -h / 2, w, h, 26); c.clip();
  c.fillStyle = B.cream; c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(0, h * 0.08); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2, h / 2); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(42,26,46,.14)'; c.lineWidth = 5; c.beginPath(); c.moveTo(-w / 2, h / 2); c.lineTo(-w * 0.06, -h * 0.02); c.moveTo(w / 2, h / 2); c.lineTo(w * 0.06, -h * 0.02); c.moveTo(-w / 2, -h / 2); c.lineTo(0, h * 0.08); c.lineTo(w / 2, -h / 2); c.stroke();
  c.restore();
  if (flap <= 0.5) {   // the flap, shut or closing: it folds up as it opens
    const k = 1 - flap * 2;
    c.save(); c.beginPath(); c.moveTo(-w / 2 + 4, -h / 2 + 4); c.lineTo(0, -h / 2 + h * 0.6 * k); c.lineTo(w / 2 - 4, -h / 2 + 4); c.closePath();
    c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = '#fbf0dc'; c.fill(); c.restore();
    if (k > 0.75) { const s = (k - 0.75) * 4; c.save(); c.translate(0, -h / 2 + h * 0.56 * k); c.scale(s, s); c.beginPath(); c.arc(0, 0, 54, 0, Math.PI * 2); c.fillStyle = B.gold; c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 10; c.shadowOffsetY = 4; c.fill(); c.shadowColor = 'transparent'; note(c, -12, 22, 30, B.ink); c.restore(); }
  }
}
function brandBlock(c, mark, cx, y, k, scale) {   // the mark, the name, the tagline; y = the mark's top
  const m = 250 * scale, s = easeBack(k); if (k <= 0) return;
  c.save(); c.translate(cx, y + m / 2); c.scale(s, s); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 40; c.shadowOffsetY = 16; c.drawImage(mark, -m / 2, -m / 2, m, m); c.restore();
}

async function main() {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sac-simple-')), bg = makeBg(W, H);
  // the card's frames, scaled up once (lanczos), and its song
  ff(['-i', SRC, '-t', (CARD + 0.6).toFixed(2), '-vf', 'scale=' + CW + ':' + CH + ':flags=lanczos', '-q:v', '2', path.join(tmp, 'f%05d.jpg')]);
  const nCard = fs.readdirSync(tmp).filter(function (f) { return /^f\d+\.jpg$/.test(f); }).length;
  const frame = function (ts) { return canvas.loadImage(path.join(tmp, 'f' + String(clamp(Math.round(ts * FPS) + 1, 1, nCard)).padStart(5, '0') + '.jpg')); };
  const mark = await canvas.loadImage(Buffer.from(Brand.markSvg({ size: 512 })));

  // ----- the sound: a three-note chime as the flap opens, the song from T0, faded out in its quiet gap; -14 LUFS -----
  const wav = path.join(tmp, 'sound.wav'), raw = path.join(tmp, 'raw.wav');
  const chime = [[1318.5, 0.95], [1568, 1.07], [2093, 1.19]].map(function (n) { return '0.16*sin(2*PI*' + n[0] + '*(t-' + n[1] + '))*exp(-5*(t-' + n[1] + '))*gte(t,' + n[1] + ')'; }).join('+');
  ff(['-f', 'lavfi', '-i', 'aevalsrc=\'' + chime + '\':s=44100:d=' + T0, '-i', SRC, '-filter_complex',
    '[0:a]aformat=channel_layouts=stereo[x];[1:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:' + END + ',afade=t=out:st=' + (END - 0.4) + ':d=0.4,adelay=' + T0 * 1000 + '|' + T0 * 1000 + '[s];[x][s]amix=inputs=2:duration=longest:normalize=0,apad[mix]',
    '-map', '[mix]', '-t', TOTAL.toFixed(3), raw]);
  const m = cp.spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const j = JSON.parse(/\{[\s\S]*\}/.exec(m.stderr)[0]);
  ff(['-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=' + j.input_i + ':measured_TP=' + j.input_tp + ':measured_LRA=' + j.input_lra + ':measured_thresh=' + j.input_thresh + ':offset=' + j.target_offset + ':linear=true', '-ar', '44100', wav]);

  // ----- the film -----
  const n = Math.round(TOTAL * FPS), silent = path.join(tmp, 'video.mp4'), out = path.join(OUTDIR, NAME + '.mp4');
  const pr = cp.spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', W + 'x' + H, '-r', String(FPS), '-i', 'pipe:0', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-g', String(FPS), silent], { stdio: ['pipe', 'ignore', 'inherit'] });
  const done = new Promise(function (ok, no) { pr.on('close', function (code) { if (code) no(new Error('ffmpeg ' + code)); else ok(); }); });
  const cv = canvas.createCanvas(W, H), c = cv.getContext('2d'), first = await frame(0), EY = 1080, SMALL = 540, CLOSE = T0 + CARD;
  for (let f = 0; f < n; f++) {
    const t = f / FPS; c.save(); bg(c, t);
    if (t < T0) {                                    // 1. OPEN
      const pop = easeBack(t / 0.45), wig = t < 0.95 ? Math.sin(t * 22) * 0.035 * clamp((t - 0.35) / 0.2, 0, 1) : 0, flap = easeIO((t - 0.9) / 0.5);
      const rise = easeOut((t - 1.35) / 0.55), grow = easeIO((t - 1.9) / 0.7), drop = easeIO((t - 1.85) / 0.6);
      pill(c, PILL, CX, 130, clamp((t - 0.15) / 0.35, 0, 1));
      const cw = lerp(SMALL, CW, grow), cy = lerp(lerp(EY + 40, EY - 300, rise), CY, grow);
      c.save(); c.translate(CX, EY + drop * 1300); c.rotate(wig); c.scale(pop, pop); envBack(c, flap); c.restore();
      if (t >= 1.3 && grow < 0.35) { c.save(); c.beginPath(); c.rect(0, 0, W, EY + drop * 1300 + ENV.h / 2 - 30); c.clip(); card(c, first, CX, cy, cw, 0); c.restore(); }   // (the part still inside the envelope is not seen below it)
      c.save(); c.translate(CX, EY + drop * 1300); c.rotate(wig); c.scale(pop, pop); envFront(c, flap); c.restore();
      if (grow >= 0.35) card(c, first, CX, cy, cw, 0);
      if (t > 0.95 && t < 1.9) for (let i = 0; i < 10; i++) { const a = i * 0.628 + 0.3, d = 120 + (t - 0.95) * 520, k = 1 - (t - 0.95) / 0.95; c.globalAlpha = clamp(k, 0, 1); sparkle(c, CX + Math.cos(a) * d * 1.1, EY - 200 + Math.sin(a) * d, 14 + (i % 3) * 8, i % 2 ? B.gold : B.cream); } c.globalAlpha = 1;
    } else if (t < CLOSE) {                          // 2. CAROL
      pill(c, PILL, CX, 130, 1); card(c, await frame(t - T0), CX, CY, CW, 0);
    } else {                                         // 3. CLOSE
      const ts = t - CLOSE, away = easeIO(ts / 0.45);
      if (away < 1) { pill(c, PILL, CX, 130, 1 - away); card(c, await frame(CARD), CX, CY + away * 1900, CW * (1 - 0.25 * away), away * 0.12); }
      brandBlock(c, mark, CX, 600, clamp((ts - 0.2) / 0.4, 0, 1), 1.2);
      words(c, CFG.name, CX, 1070, 150, clamp((ts - 0.4) / 0.4, 0, 1));
      words(c, 'Custom greeting cards that sing.', CX, 1180, 54, clamp((ts - 0.65) / 0.35, 0, 1), 'CT Sans Semi');
      pill(c, CFG.domain, CX, 1390, clamp((ts - 0.95) / 0.35, 0, 1), 64);
      for (let i = 0; i < 8; i++) { const p = ((ts * 0.45 + i / 8) % 1), side = i % 2 ? 1 : -1, x = CX + side * (465 + 30 * Math.sin(i * 2 + ts * 3)), y = 1650 - p * 1100; c.globalAlpha = Math.sin(p * Math.PI) * clamp(ts / 0.6, 0, 1) * clamp(Math.abs(y - 1110) / 120 - 1.2, 0, 1); note(c, x, y, 28 + (i % 3) * 9, [B.gold, B.coral, B.cream][i % 3]); } c.globalAlpha = 1;
    }
    c.restore();
    if (!pr.stdin.write(cv.data())) await new Promise(function (ok) { pr.stdin.once('drain', ok); });
  }
  pr.stdin.end(); await done;
  ff(['-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out]);

  // ----- the stills: the reel's cover (9:16) and the ad image (4:5). The card out of its envelope, the brand, the address. -----
  const hero = await frame(8.6);
  const still = async function (Hd, file) {
    const sc = canvas.createCanvas(W, Hd), s = sc.getContext('2d'), tall = Hd > 1500, top = tall ? 250 : 0;
    makeBg(W, Hd)(s, 2);
    words(s, 'Christmas cards', CX, top + 170, 128, 1); words(s, 'that sing', CX, top + 300, 128, 1, 'CT Lobster', B.gold);
    const g = tall ? 1.15 : 1;                       // the card floating out of its open envelope, as one group
    s.save(); s.translate(CX, top + 345); s.scale(g, g);
    s.save(); s.translate(0, 715); s.rotate(-0.03); s.scale(0.75, 0.75); envBack(s, 1); s.restore();
    card(s, hero, 8, 320, 360, 0.04);
    s.save(); s.translate(0, 715); s.rotate(-0.03); s.scale(0.75, 0.75); envFront(s, 1); s.restore();
    [[-390, 215, 46, B.gold], [390, 175, 54, B.coral], [-420, 475, 34, B.cream], [420, 455, 38, B.gold], [-340, 665, 30, B.coral], [360, 695, 32, B.cream]].forEach(function (q) { note(s, q[0], q[1], q[2], q[3]); });
    [[-290, 75, 20], [300, 55, 26], [-460, 335, 16], [460, 315, 18]].forEach(function (q) { sparkle(s, q[0], q[1], q[2], B.gold); });
    s.restore();
    const by = tall ? Hd - 250 : Hd - 62;
    s.drawImage(mark, CX - 330, by - 45, 90, 90); pill(s, CFG.domain, CX + 60, by, 1, 54);
    fs.writeFileSync(file, await sc.encode('jpeg', 92));
  };
  await still(1920, path.join(OUTDIR, NAME + '-cover.jpg'));
  await still(1350, path.join(OUTDIR, NAME + '-ad.jpg'));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(out + ' (' + TOTAL.toFixed(2) + ' s: open 0-' + T0 + ', carol to ' + CLOSE.toFixed(2) + ' (song 0-' + CARD + ' s), close to ' + TOTAL.toFixed(2) + ' (song on to ' + END + ' s))');
}
main().catch(function (e) { console.error(e); process.exit(1); });
