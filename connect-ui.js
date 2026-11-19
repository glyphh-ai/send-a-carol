'use strict';
// connect-ui.js : THE PAGES OF THE CONNECTOR (connect.js), each built here as one string of HTML.
//   panel()        the MCP App: the live card inside Claude. One self-contained page (the engine and its art inlined,
//                  no storage, nothing asked of the site but fonts, photos and the song), with a bridge that asks
//                  for the carol through the connector's own tool, so it follows every edit made in the chat.
//   previewPage()  the same player as a page of the site, behind a short-lived link: what a client with no panel is given.
//   uploadInner()  the page a person adds photos on (camera or library, the rights tick), behind a short-lived link.
// PLAYER is the player both use: CarolEngine.draw on a canvas at the song's time, or on the template's own tempo
// (silent, a click track's timing) until there is a song.
const B = require('./config.js').brand;

const PLAYER = `
(function () {
  var $ = function (id) { return document.getElementById(id); }, cv = $('cv'), ctx = cv.getContext('2d');
  var S = { card: null, rev: '', images: [], seen: {}, audio: null, songKey: '', sound: false, playing: true, at: 0, last: 0, dur: 30, shape: 'story', data: null, drew: 0, error: '' };
  var P = window.SAC_PLAYER = { state: S };
  function size() {
    var box = $('stage'), w = Math.min(box.clientWidth || 320, S.shape === 'story' ? 320 : 420), h = S.shape === 'story' ? w * 16 / 9 : w, k = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * k); cv.height = Math.round(h * k);
  }
  function say() {
    var d = S.data || {}; $('title').textContent = d.title || 'Your carol'; $('status').textContent = S.error || d.status || '';
    $('sound').hidden = !S.audio; $('sound').textContent = S.sound ? 'Sound off' : 'Play with sound'; $('play').textContent = S.playing ? 'Pause' : 'Play';
    $('shape').textContent = S.shape === 'story' ? 'Square' : 'Tall';
    var o = $('open'); o.hidden = !d.card_url; if (d.card_url) o.setAttribute('href', d.card_url);
  }
  function place() { var ph = (S.data && S.data.photos) || []; S.images = ph.map(function (p) { var r = S.seen[p.id]; return r && r.ok ? r.img : null; }); }
  // a new look at the carol: only what changed is loaded again (a photo is kept by its id, the song by its take)
  P.set = function (d) {
    if (!d || !d.engine) return; S.data = d; S.error = '';
    if (d.template && window.CarolTemplates && CarolTemplates.add) CarolTemplates.add(d.template);
    if (d.rev !== S.rev) {
      S.rev = d.rev; S.card = d.engine;
      (d.photos || []).forEach(function (p) {
        if (S.seen[p.id]) return;
        var img = new Image(), rec = S.seen[p.id] = { img: img, ok: false };
        img.onload = function () { rec.ok = true; place(); }; img.onerror = function () { delete S.seen[p.id]; };
        img.src = p.url;
      });
      place();
      try { S.dur = CarolEngine.timing(S.card).duration || 30; } catch (e) { S.dur = 30; }
      var key = d.song ? d.song.id : '';
      if (key !== S.songKey) { if (S.audio) { try { S.audio.pause(); } catch (e) {} } S.songKey = key; S.sound = false; S.audio = null; if (d.song) { S.audio = new Audio(); S.audio.preload = 'none'; S.audio.src = d.song.url; S.audio.onended = function () { S.sound = false; S.at = 0; say(); }; } }
    }
    say();
  };
  function frame(now) {
    requestAnimationFrame(frame);
    if (!S.card) return;
    var dt = Math.min(0.1, (now - (S.last || now)) / 1000); S.last = now;
    if (S.sound && S.audio && !S.audio.paused) S.at = S.audio.currentTime; else if (S.playing) { S.at += dt; if (S.at > S.dur + 1) S.at = 0; }
    try { ctx.save(); CarolEngine.draw(ctx, cv.width, cv.height, S.card, Math.min(S.at, S.dur), { images: S.images }); ctx.restore(); S.drew++; }
    catch (e) { ctx.restore(); if (!S.error) { S.error = 'This preview could not be drawn here. Use the link instead.'; S.why = String(e && e.message || e); say(); } }
  }
  $('play').onclick = function () { S.playing = !S.playing; if (S.audio && S.sound) { if (S.playing) S.audio.play().catch(function () {}); else S.audio.pause(); } say(); };
  $('sound').onclick = function () {
    if (!S.audio) return; S.sound = !S.sound;
    if (S.sound) { S.playing = true; try { S.audio.currentTime = 0; } catch (e) {} S.at = 0; S.audio.play().catch(function () { S.sound = false; say(); }); } else S.audio.pause();
    say();
  };
  $('shape').onclick = function () { S.shape = S.shape === 'story' ? 'square' : 'story'; size(); say(); };
  $('open').onclick = function (e) { if (window.SAC_LINK) { e.preventDefault(); window.SAC_LINK(this.getAttribute('href')); } };
  window.addEventListener('resize', size); size(); say();
  if (window.CarolFonts) CarolFonts.loadBrowser(document, window.SAC_FONTS || '/fonts/').catch(function () {});
  requestAnimationFrame(frame);
})();`;

const CSS = 'html,body{margin:0;background:' + B.night + ';color:' + B.cream + ';font:15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}' +
  '#wrap{max-width:440px;margin:0 auto;padding:14px 14px 16px;text-align:center}#title{font:700 18px/1.25 Georgia,serif;color:' + B.gold + ';margin:0 0 2px;overflow-wrap:anywhere}' +
  '#status{color:#cdbfd8;font-size:13.5px;min-height:1.4em;margin:0 0 10px}#stage{display:flex;justify-content:center}#cv{display:block;border-radius:18px;background:#120a1f;box-shadow:0 18px 44px -18px rgba(0,0,0,.8)}' +
  '#bar{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}#bar button,#bar a{border:1px solid rgba(255,248,238,.35);background:rgba(255,248,238,.08);color:' + B.cream + ';border-radius:999px;font:600 14px system-ui,sans-serif;padding:9px 16px;min-height:40px;box-sizing:border-box;cursor:pointer;text-decoration:none}' +
  '#bar #sound{background:linear-gradient(180deg,#d81b68,' + B.berry + ');border-color:transparent;color:#fff}#bar [hidden]{display:none}';
const BODY = '<div id="wrap"><p id="title"></p><p id="status" role="status"></p><div id="stage"><canvas id="cv" width="320" height="568" aria-label="The card, playing"></canvas></div>' +
  '<div id="bar"><button id="sound" hidden>Play with sound</button><button id="play">Pause</button><button id="shape">Square</button><a id="open" hidden target="_blank" rel="noopener">Open the card</a></div></div>';
const safe = function (s) { return String(s).replace(/<\/script/gi, '<\\/script'); };
// JSON to be written inside a <script>: no "<", and neither of the two line separators a script may not hold raw
const data = function (o) { return JSON.stringify(o).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029'); };

// THE MCP APP. o = { name, site, art, engine, fonts, sdk } (the texts of art.js, engine.js, fonts.js and mcp-app.js).
// The template library is NOT inlined (it may hold thousands): the tool's answer carries the one template its carol
// uses, and the page keeps the ones it has been given.
function panel(o) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + String(o.name).replace(/[&<>"]/g, '') + '</title><style>' + CSS + '</style>\n' +
    '<script>window.SAC_PANEL = true; window.SAC_FONTS = ' + data(o.site + '/mcp/fonts/') + ';\n' +
    '(function () { var by = {}, T = self.CarolTemplates = { list: [], families: [], occasions: [], get: function (id) { return by[id] || null; }, add: function (t) { if (t && t.id && !by[t.id]) { by[t.id] = t; T.list.push(t); } } }; })();</script>\n' +
    '<script>' + safe(o.art) + '</script>\n<script>' + safe(o.engine) + '</script>\n<script>' + safe(o.fonts) + '</script>\n</head><body>' + BODY + '\n<script>' + safe(PLAYER) + '</script>\n' +
    '<script type="module">' + safe(o.sdk) + '</script>\n<script type="module">\n' +
    'const app = new window.McpApp({ name: "send-a-carol", version: "1" }, {}, { autoResize: true });\n' +
    'let id = null, busy = false;\n' +
    'const tool = async (name, args) => { const r = await app.callServerTool({ name: name, arguments: args || {} }); if (!r || r.isError) throw new Error((r && r.content && r.content[0] && r.content[0].text) || "failed"); return r.structuredContent || {}; };\n' +
    'const show = (s) => { if (s && s.preview) { id = s.id || id; window.SAC_PLAYER.set(s.preview); } };\n' +
    'app.ontoolresult = (r) => show(r && r.structuredContent);\n' +
    'window.SAC_LINK = (url) => { app.openLink({ url: url }).catch(() => {}); };\n' +
    '// the card follows the chat: every few seconds the carol is asked for again through the connector\n' +
    'setInterval(() => { if (!id || busy || document.hidden) return; busy = true; tool("preview_carol", { id: id }).then(show, () => {}).then(() => { busy = false; }); }, window.SAC_EVERY || 5000);\n' +
    'window.SAC_BRIDGE = { app: app, tool: tool };\n' +
    'app.connect().catch(() => {});\n</script></body></html>';
}

// THE SAME PLAYER AS A PAGE OF THE SITE. o = { build, title, data (given once) or dataUrl (asked for every few seconds) }
function previewPage(o) {
  const v = '?v=' + o.build;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><title>' + String(o.title).replace(/[&<>"]/g, '') + '</title>' +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>' + CSS + 'body{min-height:100vh;display:grid;place-items:center}</style>' +
    '<script src="/art.js' + v + '"></script><script src="/templates.js' + v + '"></script><script src="/engine.js' + v + '"></script><script src="/fonts.js' + v + '"></script></head><body>' + BODY +
    '<script>' + safe(PLAYER) + '</script><script>(function () {' +
    (o.data ? 'window.SAC_PLAYER.set(' + data(o.data) + ');' :
      'function ask() { if (document.hidden) return; fetch(' + data(o.dataUrl) + ', { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) { if (j && j.preview) window.SAC_PLAYER.set(j.preview); else if (j && j.error) document.getElementById("status").textContent = j.error; }).catch(function () {}); } ask(); setInterval(ask, 5000);') +
    '})();</script></body></html>';
}

// THE UPLOAD PAGE (the inside of the site's small page). o = { base (the link's own path), bytes }
function uploadInner(o) {
  return '<style>.up .pick{display:block;margin:6px 0 16px}.up input[type=file]{position:absolute;width:1px;height:1px;opacity:0}.up .tick{display:flex;gap:12px;align-items:flex-start;text-align:left;font-size:16px;color:#e6d8f0;margin:0 0 18px;cursor:pointer}.up .tick input{width:26px;height:26px;flex:none;margin:1px 0 0;accent-color:' + B.berry + '}.up .tick a{color:' + B.gold + '}' +
    '.up #grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 16px}.up #grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;background:rgba(255,248,238,.12)}.up #say{min-height:1.5em;color:#e6d8f0}.up #say.bad{color:#ffb4a8}.up .btn[aria-disabled=true]{opacity:.45;cursor:not-allowed}.up #count{color:#cdbfd8;font-size:15px;margin:0 0 12px}.up #done{display:none}</style>' +
    '<div class="up"><h1>Add photos</h1><p>For <b id="for">your carol</b>. Up to <span id="max">a few</span> photos; they are kept privately and used only to make this card.</p>' +
    '<p id="count" aria-live="polite"></p><div id="grid" aria-label="Photos in this carol"></div>' +
    '<label class="tick"><input type="checkbox" id="ok"><span><b>These are photos I may use.</b> For photos of children, I am their parent or guardian, or I have permission. <a href="/legal/photos" target="_blank" rel="noopener">About photos</a>.</span></label>' +
    '<label class="pick"><input type="file" id="files" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" multiple disabled><span class="btn" id="choose" role="button" tabindex="0" aria-disabled="true">Choose photos</span></label>' +
    '<p id="say" role="status" aria-live="polite"></p><p id="done"><b>They are in.</b> Go back to Claude and say the photos are added. You can add more here until this link runs out.</p></div>' +
    '<script>(function () { var base = ' + data(o.base) + ', MAX = ' + (+o.bytes || 0) + ', $ = function (id) { return document.getElementById(id); }, ok = $("ok"), files = $("files"), choose = $("choose"), say = $("say"), room = 0, busy = false;' +
    'function tell(t, bad) { say.textContent = t; say.className = bad ? "bad" : ""; }' +
    'function able() { var off = !ok.checked || busy || room < 1; choose.setAttribute("aria-disabled", String(off)); files.disabled = off; }' +
    'function list() { return fetch(base + "/list", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) { if (j.error) { tell(j.error, true); room = 0; able(); return; } $("for").textContent = j.title; $("max").textContent = j.max; room = j.room; $("count").textContent = j.photos.length ? j.photos.length + " of " + j.max + " added" : "None added yet"; var g = $("grid"); g.textContent = ""; j.photos.forEach(function (p) { var i = new Image(); i.alt = "A photo in this carol"; i.src = p.url; g.appendChild(i); }); if (room < 1) tell("This carol has all the photos it can hold."); able(); }); }' +
    'ok.onchange = function () { able(); if (ok.checked) tell(""); };' +
    'choose.onclick = function (e) { if (!ok.checked) { e.preventDefault(); tell("Tick the box first: these must be photos you may use.", true); } };' +
    'choose.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!ok.checked) tell("Tick the box first: these must be photos you may use.", true); else files.click(); } };' +
    'files.onchange = async function () { var all = Array.prototype.slice.call(files.files || []); files.value = ""; if (!all.length || !ok.checked) return; var put = 0, bad = ""; busy = true; able();' +
    ' for (var i = 0; i < all.length; i++) { var f = all[i]; if (put >= room) { bad = "This carol holds up to " + $("max").textContent + " photos: the rest were left out."; break; } if (MAX && f.size > MAX) { bad = f.name + " is larger than " + Math.round(MAX / 1048576) + " MB."; continue; }' +
    '  tell("Sending " + (i + 1) + " of " + all.length + "..."); try { var r = await fetch(base, { method: "POST", headers: { "Content-Type": f.type || "application/octet-stream", "X-Photos-Ok": ok.checked ? "yes" : "" }, body: await f.arrayBuffer() }), j = await r.json(); if (j && j.ok) put++; else bad = (j && j.error) || "That photo did not go through."; } catch (e) { bad = "That photo did not go through. Check your connection and try again."; } }' +
    ' busy = false; await list().catch(function () {}); if (put) $("done").style.display = "block"; tell(bad || (put ? put + (put === 1 ? " photo" : " photos") + " added." : ""), !!bad); };' +
    'list().catch(function () { tell("This page could not load. Check your connection and reload.", true); }); })();</script>';
}
module.exports = { panel: panel, previewPage: previewPage, uploadInner: uploadInner, PLAYER: PLAYER };
