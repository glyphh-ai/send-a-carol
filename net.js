// net.js : how every page talks to the server, and how a page that was loaded before a deploy moves to the new
// build without costing anybody anything (SPEC.md, "Safe builds").
//   SAC.call(path, data, method, key)   one request; JSON in, JSON out with .status; an Idempotency-Key when given
//   SAC.read(path)                      a GET, tried again (3 more times) through a restart
//   SAC.send(path, data)                a write that must arrive once: it gets a key and is tried again until answered
//   SAC.save(cardId, data)              the outbox: the newest save of a carol is kept in localStorage and sent until
//                                       it is answered, also after a reload or with the tab closed in between
//   SAC.hold(name, on)                  "do not reload now": editing, uploading, paying, rendering on screen, playing
//   SAC.newKey()
// A NEW BUILD: every answer carries X-Build. When it differs from the build this page was served as, a note shows
// ("New version ready") and the page reloads itself at the first safe moment: nothing held, no field in use, nothing
// waiting in the outbox, the tab in view. Once per build, never in a loop. The note's button reloads at once.
(function (root) {
  'use strict';
  const BUILD = root.SAC_BUILD || '', BOX = 'sac.outbox', RL = 'sac.reload', holds = {};
  let fresh = '', freshT = 0, going = '', tries = 0, tryT = 0, mem = [], memOnly = false;
  const listeners = { saved: [], fresh: [], refused: [] };
  const emit = function (what, a, b) { listeners[what].forEach(function (f) { try { f(a, b); } catch (e) { /* a listener's own trouble */ } }); };
  const newKey = function () { const a = new Uint8Array(16); if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(a); else for (let i = 0; i < 16; i++) a[i] = Math.random() * 256; return Array.from(a, function (n) { return (n < 16 ? '0' : '') + n.toString(16); }).join(''); };

  function call(path, data, method, key, raw) {
    const h = {}; if (key) h['Idempotency-Key'] = key;
    const o = raw ? { method: method || 'POST', headers: Object.assign({ 'Content-Type': raw.type }, h), body: raw.body } : data || method ? { method: method || 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, h), body: JSON.stringify(data || {}) } : { cache: 'no-store', headers: h };
    return fetch(path, o).then(function (r) { seen(r.headers.get('X-Build')); return r.json().catch(function () { return { error: r.status >= 500 ? 'The server is restarting. Try again in a moment.' : 'That did not work. Try again.' }; }).then(function (j) { j.status = r.status; return j; }); });
  }
  function read(path, n) {
    n = n || 0;
    const again = function () { return new Promise(function (ok) { setTimeout(ok, [400, 1200, 2500][n]); }).then(function () { return read(path, n + 1); }); };
    return call(path).then(function (j) { return j.status >= 500 && n < 3 ? again() : j; }, function (e) { if (n < 3) return again(); throw e; });
  }
  // a write that must arrive once: the same key every try, until the server answers with something other than "later"
  function send(path, data, key, n) {
    key = key || newKey(); n = n || 0;
    const later = function () { return new Promise(function (ok) { setTimeout(ok, Math.min(8000, 600 * Math.pow(2, n))); }).then(function () { return send(path, data, key, n + 1); }); };
    return call(path, data, 'POST', key).then(function (j) { return (j.status === 408 || j.status === 429 && !j.error || j.status >= 500) && n < 6 ? later() : j; }, function (e) { if (n < 6) return later(); throw e; });
  }

  // ----- the outbox: saves of a carol -----
  const box = {
    get: function () { let a = mem; if (!memOnly) { try { a = JSON.parse(localStorage.getItem(BOX)) || []; } catch (e) { a = mem; } } return (Array.isArray(a) ? a : []).filter(function (x) { return x && x.k && x.c && x.b && x.at > Date.now() - 14 * 864e5; }); },
    set: function (a) { mem = a.slice(-30); try { localStorage.setItem(BOX, JSON.stringify(mem)); } catch (e) { memOnly = true; } },
  };
  function save(card, data) {   // only the newest save of a carol waits; it keeps the first one's time
    const all = box.get(), old = all.filter(function (x) { return x.c === card; }), k = newKey();
    box.set(all.filter(function (x) { return x.c !== card; }).concat([{ k: k, c: card, b: data, at: old.length ? old[0].at : Date.now() }]));
    flush(); return k;
  }
  const drop = function (k) { box.set(box.get().filter(function (x) { return x.k !== k; })); };
  function flush() {
    if (going) return;
    const x = box.get()[0]; if (!x) return;
    going = x.k; clearTimeout(tryT);
    call('/api/cards/' + x.c + '/save', x.b, 'POST', x.k).then(function (r) {
      going = '';
      if (r.status >= 200 && r.status < 300) { drop(x.k); tries = 0; emit('saved', x.c, r); flush(); }
      else if (r.status === 408 || r.status >= 500) later();
      else { drop(x.k); tries = 0; emit('refused', x.c, r); flush(); }   // a 4xx is an answer: said once, not sent again
    }, function () { going = ''; later(); });
  }
  function later() { tries = Math.min(tries + 1, 10); clearTimeout(tryT); tryT = setTimeout(flush, Math.min(120000, 500 * Math.pow(2, tries)) * (0.8 + Math.random() * 0.4)); }
  const waiting = function () { return box.get(); };

  // ----- the safe reload -----
  const wasReload = function () { try { return JSON.parse(sessionStorage.getItem(RL)) || {}; } catch (e) { return {}; } };
  function seen(b) {
    if (!b || !BUILD || b === BUILD || b === fresh) return;
    fresh = b; emit('fresh', b); note(true);
    clearInterval(freshT); freshT = setInterval(maybe, 1000); setTimeout(maybe, 0);   // (it looks; it asks the server nothing)
  }
  function safe() {
    const a = document.activeElement;
    if (Object.keys(holds).some(function (k) { return holds[k]; })) return false;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return false;
    return !waiting().length && !going;
  }
  function maybe() { if (fresh && !document.hidden && wasReload().to !== fresh && safe()) reload(); }
  function reload() { try { sessionStorage.setItem(RL, JSON.stringify({ to: fresh, at: Date.now() })); } catch (e) { /* no storage */ } clearInterval(freshT); location.reload(); }
  function hold(name, on) { if (on) holds[name] = true; else delete holds[name]; if (!on) setTimeout(maybe, 0); }
  function note(show) {
    let el = document.getElementById('sac-fresh');
    if (!el && show && document.body) {
      el = document.createElement('div'); el.id = 'sac-fresh'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;background:#1d1230;color:#fff8ee;border-radius:999px;padding:8px 8px 8px 16px;font:600 14px system-ui,sans-serif;display:flex;gap:8px;align-items:center;box-shadow:0 6px 24px rgba(0,0,0,.35)';
      const b = document.createElement('button'), x = document.createElement('button');
      el.appendChild(document.createTextNode('New version ready')); b.textContent = 'Reload'; x.textContent = 'Not now'; x.setAttribute('aria-label', 'Not now');
      b.style.cssText = 'border:0;border-radius:999px;background:#f2b632;color:#2a1a2e;font:700 14px system-ui,sans-serif;padding:8px 14px;cursor:pointer'; x.style.cssText = 'border:0;background:none;color:#cbb9d8;font:600 13px system-ui,sans-serif;cursor:pointer;padding:8px';
      b.onclick = reload; x.onclick = function () { el.hidden = true; }; el.appendChild(b); el.appendChild(x); document.body.appendChild(el);
    }
    if (el) el.hidden = !show;
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { tries = 0; flush(); maybe(); } });
  root.addEventListener('online', function () { tries = 0; flush(); });
  root.addEventListener('pageshow', function () { flush(); });

  root.SAC = Object.assign(root.SAC || {}, { build: BUILD, call: call, read: read, send: send, save: save, flush: flush, waiting: waiting, hold: hold, held: function () { return Object.keys(holds); }, newKey: newKey, seen: seen, safe: safe,
    on: function (what, f) { listeners[what].push(f); }, fresh: function () { return fresh; } });
})(typeof self !== 'undefined' ? self : this);
