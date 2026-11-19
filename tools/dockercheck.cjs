'use strict';
// tools/dockercheck.cjs : THE IMAGE Fly would run, built here and looked into. Nothing is deployed and no port is
// published: every look is a one-off `docker run --rm --network none`.
//   1. docker build -t send-a-carol:check .
//   2. node server.js --check starts on SQLite inside it and passes
//   3. ffmpeg is there, with libx264 and aac
//   4. the twenty fonts register, and text measures differently in different families (so they are really used)
//   5. a short render (6 seconds, small sizes, a tone made by the container's ffmpeg) goes through render.js: two mp4s,
//      two posters, the gif
//   6. heif-convert (libheif-examples) turns a real HEIC, made on this Mac by `sips` from a code-drawn photo and
//      mounted read-only, into a JPEG that the canvas library loads
// and the image's size.          node tools/dockercheck.cjs   (--no-build to look into the image that is there)
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..'), TAG = 'send-a-carol:check';
const sh = function (cmd, args, o) { return cp.spawnSync(cmd, args, Object.assign({ encoding: 'utf8', cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }, o)); };
let failed = 0; const ok = function (cond, what) { console.log((cond ? 'ok    ' : 'FAIL  ') + what); if (!cond) failed++; return cond; };
if (sh('docker', ['info', '--format', '{{.ServerVersion}}']).status !== 0) { console.log('DOCKER CHECK NOT RUN: Docker is not running on this machine'); process.exit(2); }
const work = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sac-docker-')), IN = path.join(work, 'in'), OUT = path.join(work, 'out'); fs.mkdirSync(IN); fs.mkdirSync(OUT); fs.chmodSync(OUT, 0o777);
const inside = function (args, more) { return sh('docker', ['run', '--rm', '--network', 'none', '-v', IN + ':/work/in:ro', '-v', OUT + ':/work/out'].concat(more || [], [TAG], args), { timeout: 300000 }); };
try {
  if (process.argv.indexOf('--no-build') < 0) { const t0 = Date.now(), b = sh('docker', ['build', '-t', TAG, '.'], { timeout: 1200000 }); if (!ok(b.status === 0, 'docker build -t ' + TAG + ' . (' + Math.round((Date.now() - t0) / 1000) + ' s)')) { console.log(String(b.stderr).slice(-1500)); throw new Error('the image did not build'); } }
  const size = sh('docker', ['image', 'inspect', TAG, '--format', '{{.Size}} {{.Architecture}} {{.Os}}']).stdout.trim().split(' ');
  console.log('      the image: ' + (size[0] / 1048576).toFixed(0) + ' MB (' + size[2] + '/' + size[1] + ')');

  let r = inside(['node', 'server.js', '--check']);
  ok(r.status === 0 && /CHECK PASSED/.test(r.stdout) && /against a SQLite file/.test(r.stdout), 'node server.js --check inside the image, on SQLite, with no network: exit ' + r.status); console.log(r.stdout.trim().split('\n').map(function (l) { return '        ' + l; }).join('\n') + (r.status ? '\n' + r.stderr.slice(-600) : ''));
  r = inside(['node', '-e', 'require("http").createServer().listen(0, () => { console.log("node " + process.version); process.exit(0); })']); const nodev = r.stdout.trim();

  r = inside(['sh', '-c', 'ffmpeg -hide_banner -version | head -1; ffmpeg -hide_banner -encoders 2>/dev/null | grep -E " (libx264|aac) " | awk \'{print $2}\' | tr "\\n" " "; echo; dpkg-query -W -f "libheif-examples \${Version}\\n" libheif-examples; cat /etc/os-release | grep PRETTY']);
  ok(r.status === 0 && /ffmpeg version/.test(r.stdout) && /libx264/.test(r.stdout) && /\baac\b/.test(r.stdout), 'ffmpeg is in the image with libx264 and aac: ' + r.stdout.trim().split('\n').join(' | ') + ' | ' + nodev);

  // the scripts the container runs (they load the app's own modules from /app)
  fs.writeFileSync(path.join(IN, 'fonts.cjs'), [
    "const R = require('/app/render.js'), F = require('/app/fonts.js'), c = R.canvas; R.fonts();",
    "const has = F.families.filter(function (f) { return c.GlobalFonts.has(f); }), ctx = c.createCanvas(10, 10).getContext('2d'), w = {};",
    "F.families.forEach(function (f) { ctx.font = '100px \"' + f + '\"'; w[f] = Math.round(ctx.measureText('Send a Carol 123').width); });",
    "ctx.font = '100px \"No Such Family At All\"'; const fallback = Math.round(ctx.measureText('Send a Carol 123').width);",
    "console.log(JSON.stringify({ families: F.families.length, registered: has.length, distinct: new Set(Object.values(w)).size, sameAsFallback: Object.keys(w).filter(function (f) { return w[f] === fallback; }), widths: w }));"].join('\n'));
  fs.writeFileSync(path.join(IN, 'render.cjs'), [
    "const cp = require('child_process'), fs = require('fs'), R = require('/app/render.js'), T = require('/app/templates.js'), E = require('/app/engine.js');",
    "const dir = fs.mkdtempSync('/tmp/r-'), audio = dir + '/tone.m4a';",
    "let x = cp.spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=4', '-c:a', 'aac', audio]); if (x.status) throw new Error('tone: ' + x.stderr);",
    "const photo = fs.existsSync('/work/out/heic.jpg') ? fs.readFileSync('/work/out/heic.jpg') : null;",
    "const card = { template: T.list[0].id, to: 'Grandma Dot', from: 'The Hollisters', title: 'A Carol for Grandma Dot', greeting: 'Merry Christmas!', signoff: 'Love, the Hollisters', lyrics: [{ section: 'verse', lines: ['The lights are up along the street tonight'] }, { section: 'hook', lines: ['So here is a carol, made for you'] }], scenes: photo ? [{ photo: 0, caption: 'All of us' }] : [], timing: { duration: 6, bpm: 120, offset: 0.5 } };",
    "const t0 = Date.now(); R.render({ card: card, images: [photo], audio: audio, dir: dir, sizes: { story: [360, 640], square: [360, 360] } }).then(function (o) {",
    "  const probe = function (f) { const p = cp.spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height:format=duration', '-of', 'json', f], { encoding: 'utf8' }); const j = JSON.parse(p.stdout); return j.streams.map(function (s) { return s.codec_name + (s.width ? ' ' + s.width + 'x' + s.height : ''); }).join('+') + ' ' + (+j.format.duration).toFixed(1) + 's ' + fs.statSync(f).size + 'b'; };",
    "  console.log(JSON.stringify({ ms: Date.now() - t0, frames: o.frames, seconds: E.timing(card).duration, story: probe(o.story), square: probe(o.square), poster: fs.statSync(o.poster).size, posterStory: fs.statSync(o.posterStory).size, gif: fs.statSync(o.preview).size, photo: !!photo }));",
    "  fs.copyFileSync(o.poster, '/work/out/poster.jpg'); process.exit(0);",
    "}).catch(function (e) { console.error(e.stack); process.exit(1); });"].join('\n'));
  fs.writeFileSync(path.join(IN, 'heic.cjs'), [
    "const cp = require('child_process'), fs = require('fs'), R = require('/app/render.js');",
    "const x = cp.spawnSync('heif-convert', ['-q', '92', '/work/in/photo.heic', '/tmp/photo.jpg'], { encoding: 'utf8' }); if (x.status) { console.error('heif-convert: ' + x.stdout + x.stderr); process.exit(1); }",
    "const b = fs.readFileSync('/tmp/photo.jpg'); R.canvas.loadImage(b).then(async function (img) { const small = await R.resize(b, 1600); fs.writeFileSync('/work/out/heic.jpg', small.data);",
    "  const cv = R.canvas.createCanvas(img.width, img.height), c = cv.getContext('2d'); c.drawImage(img, 0, 0); const d = c.getImageData(0, 0, img.width, img.height).data; let lo = 255, hi = 0; for (let i = 0; i < d.length; i += 4 * 997) { lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); }",
    "  console.log(JSON.stringify({ w: img.width, h: img.height, jpegBytes: b.length, jpeg: b[0] === 0xff && b[1] === 0xd8, redFrom: lo, redTo: hi, resized: small.w + 'x' + small.h })); }).catch(function (e) { console.error('the canvas could not load it: ' + e.message); process.exit(1); });"].join('\n'));

  r = inside(['node', '/work/in/fonts.cjs']); let j = null; try { j = JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { j = null; }
  ok(r.status === 0 && j && j.registered === j.families && j.families === 20 && j.distinct >= 18 && j.sameAsFallback.length === 0, 'the fonts: ' + (j ? j.registered + ' of ' + j.families + ' families registered; one line measures ' + j.distinct + ' different widths across them, none the width of the fallback face' : r.stderr.slice(-400)));

  // a real HEIC, made here: a code-drawn photo (test/kit.cjs) written by sips, as an iPhone would
  const png = path.join(work, 'photo.png'), heic = path.join(IN, 'photo.heic'); fs.writeFileSync(png, require('../test/kit.cjs').photo(5, 1512, 2016));
  const s = sh('sips', ['-s', 'format', 'heic', png, '--out', heic]), head = s.status === 0 ? fs.readFileSync(heic).subarray(0, 12).toString('latin1') : '';
  if (ok(s.status === 0 && head.slice(4, 8) === 'ftyp' && /heic|heix|mif1/.test(head.slice(8)), 'a real HEIC made on this Mac with sips (' + (s.status === 0 ? fs.statSync(heic).size + ' bytes, brand ' + head.slice(8) : String(s.stderr).trim()) + ')')) {
    r = inside(['node', '/work/in/heic.cjs']); j = null; try { j = JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { j = null; }
    ok(r.status === 0 && j && j.jpeg && j.w === 1512 && j.h === 2016 && j.redTo - j.redFrom > 40, 'heif-convert in the image turns it into a JPEG the canvas library loads: ' + (j ? j.w + 'x' + j.h + ', ' + j.jpegBytes + ' bytes, a picture and not a flat colour (red ' + j.redFrom + ' to ' + j.redTo + '), resized to ' + j.resized : (r.stdout + r.stderr).slice(-500)));
  }
  r = inside(['node', '/work/in/render.cjs']); j = null; try { j = JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { j = null; }
  ok(r.status === 0 && j && /h264 360x640\+aac/.test(j.story) && /h264 360x360\+aac/.test(j.square) && j.poster > 3000 && j.gif > 3000, 'a short render through render.js in the image: ' + (j ? j.frames + ' frames in ' + (j.ms / 1000).toFixed(1) + ' s; story ' + j.story + '; square ' + j.square + '; posters ' + j.poster + 'b and ' + j.posterStory + 'b; gif ' + j.gif + 'b' + (j.photo ? '; with the converted HEIC as its photo' : '') : (r.stdout + r.stderr).slice(-800)));
  if (fs.existsSync(path.join(OUT, 'poster.jpg'))) { fs.mkdirSync('/tmp/carol-time/pass2', { recursive: true }); fs.copyFileSync(path.join(OUT, 'poster.jpg'), '/tmp/carol-time/pass2/docker-render-poster.jpg'); console.log('      its poster: /tmp/carol-time/pass2/docker-render-poster.jpg'); }
  r = sh('docker', ['ps', '--filter', 'ancestor=' + TAG, '--format', '{{.ID}} {{.Ports}}']); ok(r.stdout.trim() === '', 'no container of the image is left running, and none ever published a port');
} catch (e) { console.error('DOCKER CHECK STOPPED: ' + e.message); failed++; }
finally { fs.rmSync(work, { recursive: true, force: true }); }
console.log(failed ? 'DOCKER CHECK FAILED: ' + failed : 'DOCKER CHECK PASSED');
process.exit(failed ? 1 : 0);
