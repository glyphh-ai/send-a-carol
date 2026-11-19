// app.js : the maker's page (/make). One page, its screens swapped here: sign in, my carols, the conversation with
// the agent, the editor with its live preview, the pay sheet, the making-of progress, and ready/share.
// Deep links: /make (my carols), /make?new, /make?template=<id>, /make?card=<id> (&edit), /make?paid=<session>&card=<id>, /make?buy=<pack>.
(function () {
  'use strict';
  const D = document, $ = function (s, r) { return (r || D).querySelector(s); };
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = { me: null, cfg: null, user: null, card: null, fonts: false, clean: [] };
  const main = $('#main');

  // ---------- small things ----------
  function h(tag, a) {
    const el = D.createElement(tag); a = a || {};
    Object.keys(a).forEach(function (k) { const v = a[k]; if (v == null || v === false) return; if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else if (k === 'value') el.value = v; else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v); });
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, kid) { if (kid == null || kid === false) return el; if (Array.isArray(kid)) { kid.forEach(function (k) { add(el, k); }); return el; } el.appendChild(typeof kid === 'object' ? kid : D.createTextNode(String(kid))); return el; }
  const ICONS = {
    back: '<path d="m14 6-6 6 6 6"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', play: '<path d="M8 5.500v13l11-6.500z" fill="currentColor" stroke="none"/>', pause: '<path d="M8 5v14M16 5v14" stroke-width="3.200"/>',
    up: '<path d="m6 14 6-6 6 6"/>', down: '<path d="m6 10 6 6 6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.500"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>', share: '<path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 8 8 6 8-6"/>',
    chat: '<path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 4v-4a3 3 0 0 1-3-3z"/>', down2: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>', photo: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m4 17 5-5 4 4 3-3 4 4"/><circle cx="9" cy="9" r="1.500"/>',
    open: '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>', pencil: '<path d="m4 20 4-1L19 8l-3-3L5 16z"/>', min: '<path d="m7 14 5-5 5 5"/>', wa: '<path d="M4 20l1.300-4A8 8 0 1 1 8 18.700z"/><path d="M9 9c0 3 3 6 6 6l1-1.500-2-1-1 1c-1-.5-2-1.500-2.500-2.500l1-1-1-2z" fill="currentColor" stroke="none"/>',
    fb: '<path d="M14 21v-7h3l.500-4H14V8c0-1 .500-2 2-2h2V3h-3c-3 0-5 2-5 5v2H7v4h3v7z" fill="currentColor" stroke="none"/>', xx: '<path d="M5 4l14 16M19 4 5 20" stroke-width="2.400"/>', sms: '<path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 4v-4a3 3 0 0 1-3-3z"/><path d="M8.500 10h.01M12 10h.01M15.500 10h.01" stroke-width="2.800"/>',
  };
  function icon(n) { const s = D.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2.200'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = ICONS[n] || ''; return s; }
  const ibtn = function (n, label, fn, cls) { return h('button', { class: 'icon-btn ' + (cls || ''), type: 'button', 'aria-label': label, title: label, onclick: fn }, icon(n)); };
  const money = function (cents) { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(S.cfg.currency || 'usd').toUpperCase() }).format(cents / 100); } catch (e) { return (cents / 100).toFixed(2); } };
  const plural = function (n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); };
  const clock = function (t) { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); };
  const ok = function (r) { return r && r.status >= 200 && r.status < 300 && !r.error; };
  const store = { get: function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } }, set: function (k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* no storage */ } } };
  let toastT = 0;
  function say(text, bad) { const old = $('.toast'); if (old) old.remove(); clearTimeout(toastT); const t = h('div', { class: 'toast' + (bad ? ' bad' : ''), role: bad ? 'alert' : 'status', text: text }); D.body.appendChild(t); toastT = setTimeout(function () { t.remove(); }, bad ? 7000 : 3600); }
  const oops = function (r) { say(r && r.error || 'That did not work. Check your connection and try again.', true); };
  function avatar(cls) { const a = h('span', { class: 'avatar ' + (cls || ''), 'aria-hidden': 'true' }); a.appendChild($('#mark').content.cloneNode(true)); return a; }
  function busy(btn, on) { if (!btn) return; if (on) { btn.dataset.t = btn.textContent; btn.disabled = true; btn.textContent = ''; add(btn, [h('span', { class: 'spin' }), btn.dataset.t]); } else { btn.disabled = false; if (btn.dataset.t != null) btn.textContent = btn.dataset.t; } }
  function counter(input, max) { const c = h('span', { class: 'counter' }), up = function () { const n = input.value.length; c.textContent = n + ' / ' + max; c.className = 'counter' + (n >= max ? ' full' : n > max * 0.85 ? ' near' : ''); }; input.addEventListener('input', up); up(); return c; }

  // ---------- the season: one attribute, one canvas of ambient particles (dark screens only) ----------
  const BRAND = { bg: '#1d1230', bg2: '#2c1a44', ink: '#2a1a2e', accent: '#ff6b5e', accent2: '#c2185b', gold: '#f2b632', snow: '#ffffff', paper: '#fff8ee' };
  function season() {
    const f = S.cfg.featured || 'none', cv = $('#ambient'), layers = { christmas: [['snow', 0.5]], love: [['hearts', 0.6]], birthday: [['confetti', 0.4], ['notes', 0.35]], congrats: [['confetti', 0.4], ['stars', 0.3]] }[f] || [['notes', 0.5], ['confetti', 0.18]];
    D.documentElement.setAttribute('data-season', f);
    if (!cv || !window.CarolArt) return; const ctx = cv.getContext('2d'); let last = 0;
    const paint = function (now) { const w = window.innerWidth, hh = window.innerHeight; if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; } ctx.clearRect(0, 0, w, hh); layers.forEach(function (l, i) { CarolArt.particles(l[0], ctx, w, hh, now / 1000, BRAND, { amount: l[1] * Math.min(1.5, Math.max(0.6, w / 900)), seed: 'amb' + i }); }); };
    const loop = function (now) { requestAnimationFrame(loop); if (D.hidden || now - last < 45 || D.body.getAttribute('data-stage') !== 'dark') return; last = now; paint(now); };
    if (still) paint(4000); else requestAnimationFrame(loop);
  }

  // ---------- live thumbnails (the engine on small canvases): drawn when seen, moving when hot or when the frame budget allows ----------
  const Thumbs = (function () {
    const items = []; let at = 0;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { const it = items.find(function (x) { return x.cv === e.target; }); if (it) it.vis = e.isIntersecting; }); }, { rootMargin: '160px' }) : null;
    function fit(cv) { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * d), hh = Math.round(r.height * d); if (w > 0 && hh > 0 && (cv.width !== w || cv.height !== hh)) { cv.width = w; cv.height = hh; } return w > 0 && hh > 0; }
    function paint(it, now, first) {
      if (!S.fonts || !fit(it.cv)) return; const ctx = it.cv.getContext('2d'), W = it.cv.width, H = it.cv.height;
      try { if (it.draw) it.draw(ctx, W, H, now / 1000); else CarolEngine.draw(ctx, W, H, it.card, first || still && !it.hot ? it.poster : it.poster + ((now - it.t0) / 1000) % Math.max(1, it.dur - it.poster - 0.2), { images: it.images || [] }); it.drawn = true; } catch (e) { it.dead = true; }
      it.last = now;
    }
    function loop(now) {
      requestAnimationFrame(loop); if (D.hidden || !S.fonts || !items.length) return;
      const t0 = performance.now(); let n = items.length;
      while (n-- > 0 && performance.now() - t0 < 7) { at = (at + 1) % items.length; const it = items[at]; if (it.dead || !it.vis) continue; if (!it.drawn) paint(it, now, true); else if ((it.hot || !still) && now - it.last > (it.hot ? 30 : 110)) paint(it, now); }
    }
    requestAnimationFrame(loop);
    return {
      add: function (cv, o) {
        const it = { cv: cv, card: o.card, draw: o.draw, images: o.images, hot: !!o.hot, vis: !io, drawn: false, last: 0, t0: performance.now(), poster: 0, dur: 30 };
        if (it.card) { try { it.poster = CarolEngine.posterTime(it.card); it.dur = CarolEngine.timing(it.card).duration; } catch (e) { it.poster = 2; } }
        items.push(it); if (io) io.observe(cv);
        if (!o.hot && !o.draw) { const host = o.host || cv, on = function () { it.hot = true; it.t0 = performance.now(); }, off = function () { it.hot = false; }; host.addEventListener('pointerenter', on); host.addEventListener('pointerleave', off); host.addEventListener('focusin', on); host.addEventListener('focusout', off); }
        return it;
      },
      sweep: function () { for (let i = items.length - 1; i >= 0; i--) if (!D.body.contains(items[i].cv)) { if (io) io.unobserve(items[i].cv); items.splice(i, 1); } },
      kick: function () { items.forEach(function (it) { it.drawn = false; }); },
    };
  })();
  const SAMPLE = {
    christmas: ['Merry Christmas!', 'The lights are up along the street tonight', 'We saved your seat beside the fire'], birthday: ['Happy birthday!', 'Another year of cartwheels in the hall', 'Blow the candles, make it loud'],
    love: ['For you', 'You burned the toast the day we met', 'And I have loved you ever since'], thanks: ['Thank you!', 'You stayed late and you made it fun', 'Here is a carol from us all'], congrats: ['Congratulations!', 'Now look at you up there', 'We always knew, we always knew'],
  };
  function sampleCard(tid, occasion, o) { const s = SAMPLE[occasion] || SAMPLE.birthday; o = o || {}; return { template: tid, to: o.to || 'Sam', from: o.from || 'Ada', title: o.title || 'A Carol for ' + (o.to || 'Sam'), greeting: s[0], signoff: 'With love, ' + (o.from || 'Ada'), lyrics: [{ section: 'verse', lines: [s[1]] }, { section: 'hook', lines: [s[2]] }], scenes: [], timing: null }; }
  function thumb(card, o) { const cv = h('canvas', { 'aria-hidden': 'true' }), el = h('span', { class: 'thumb' }, cv); o = o || {}; setTimeout(function () { Thumbs.add(cv, { card: card, hot: o.hot, host: o.host || el, images: o.images }); }, 0); return el; }

  // ---------- dialogs and sheets: focus is trapped, Esc and the scrim close ----------
  function dialog(o) {
    const was = D.activeElement, id = 'dlg' + Date.now(), body = h('div', { class: 'body' }, o.body);
    const box = h('div', { class: 'dialog' + (o.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': id, tabindex: '-1' }, h('div', { class: 'dialog-head' }, h('h2', { id: id, text: o.title }), ibtn('x', 'Close', function () { close(); })), body);
    const scrim = h('div', { class: 'scrim', onpointerdown: function (e) { if (e.target === scrim) close(); } }, box);
    const key = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = Array.prototype.filter.call(box.querySelectorAll('a[href], button, input, textarea, select, summary, [tabindex="0"]'), function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return;
      if (e.shiftKey && (D.activeElement === f[0] || D.activeElement === box)) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && D.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    let shut = false;
    function close(v) { if (shut) return; shut = true; D.removeEventListener('keydown', key, true); scrim.remove(); D.body.style.overflow = ''; if (o.onClose) o.onClose(v); if (was && was.focus && D.body.contains(was)) was.focus(); Thumbs.sweep(); }
    D.addEventListener('keydown', key, true); D.body.appendChild(scrim); D.body.style.overflow = 'hidden';
    setTimeout(function () { const f = box.querySelector('[autofocus]') || box; f.focus(); }, 30);
    return { close: close, body: body, box: box };
  }
  function confirmBox(o) { return new Promise(function (done) { let said = false; const d = dialog({ title: o.title, body: [h('p', { text: o.text }), o.more ? h('p', { class: 'muted small', text: o.more }) : null, h('div', { class: 'foot' }, h('button', { class: 'btn soft', text: o.no || 'Cancel', onclick: function () { d.close(); } }), h('button', { class: 'btn' + (o.danger ? ' danger' : ''), text: o.yes, autofocus: true, onclick: function () { said = true; d.close(); } }))], onClose: function () { done(said); } }); }); }

  // ---------- moving between screens ----------
  function show(node, o) {
    o = o || {}; (S.live || []).forEach(function (f) { try { f(); } catch (e) { /* a screen's own trouble */ } }); S.live = S.clean.splice(0);   // a screen registers its clean-up (S.clean) before it is shown
    D.body.setAttribute('data-stage', o.dark ? 'dark' : 'light'); main.textContent = ''; main.appendChild(node); Thumbs.sweep(); window.scrollTo(0, 0);
    const h1 = $('h1', node); if (h1 && !o.quiet) { h1.setAttribute('tabindex', '-1'); try { h1.focus({ preventScroll: true }); } catch (e) { /* older browsers */ } }
  }
  const loading = function (text) { show(h('div', { class: 'center-screen' }, h('div', { class: 'loading' }, h('div', { class: 'spin' }), h('span', { text: text || 'One moment...' }))), { quiet: true }); };
  function go(url, replace) { if (replace) history.replaceState(null, '', url); else history.pushState(null, '', url); route(); }
  window.addEventListener('popstate', function () { route(); });
  function problem(title, text) { show(h('div', { class: 'center-screen' }, h('div', { class: 'empty', style: 'max-width:440px' }, h('b', { text: title }), text, h('div', { style: 'margin-top:16px' }, h('button', { class: 'btn', text: 'My carols', onclick: function () { go('/make'); } }))))); }
  async function route() {
    const q = new URLSearchParams(location.search), id = q.get('card');
    if (!S.user) return show(signIn(), { dark: true });
    if (id) {
      loading(); let r; try { r = await SAC.read('/api/cards/' + encodeURIComponent(id)); } catch (e) { r = null; }
      if (!r || !r.card) return problem('That carol is not here', r && r.error || 'Check your connection and try again.');
      S.card = r.card; return openCard(q.has('edit'));
    }
    S.card = null;
    if (q.has('new') || q.get('template')) return convo(null, q.get('template'));
    home(); if (q.get('buy')) { history.replaceState(null, '', '/make'); pay({ pack: q.get('buy') }); }
  }
  function openCard(edit) {
    const c = S.card, j = c.job;
    if (j && j.state !== 'failed') return progress();
    if (j && j.state === 'failed' && !store.get('sac.fail.' + j.id)) return progress();
    if (!c.script) return convo(c);
    if (!edit && (c.state === 'ready' || c.state === 'down') && c.media.indexOf('story') >= 0) return ready();
    editor();
  }

  // ---------- the header: credits and the account ----------
  function header() {
    const cr = $('#credits'), ac = $('#acct'), u = S.user;
    cr.hidden = ac.hidden = !u; if (!u) return;
    $('span', cr).textContent = plural(u.credits, 'credit'); cr.setAttribute('aria-label', plural(u.credits, 'carol credit') + '. Get more'); cr.onclick = function () { pay(); };
    ac.textContent = ((u.name || u.email || '?').trim()[0] || '?').toUpperCase();
    ac.onclick = function (e) {
      e.stopPropagation(); const old = $('.menu'); if (old) { old.remove(); ac.setAttribute('aria-expanded', 'false'); return; }
      const shut = function () { m.remove(); ac.setAttribute('aria-expanded', 'false'); D.removeEventListener('click', away); D.removeEventListener('keydown', esc); }, away = function (ev) { if (!m.contains(ev.target)) shut(); }, esc = function (ev) { if (ev.key === 'Escape') { shut(); ac.focus(); } };
      const m = h('div', { class: 'menu', role: 'menu' }, h('div', { class: 'who' }, h('b', { text: u.name || 'Your account' }), h('span', { text: u.email || '' })),
        h('button', { role: 'menuitem', text: 'My carols', onclick: function () { shut(); go('/make'); } }), h('button', { role: 'menuitem', text: 'Get carol credits', onclick: function () { shut(); pay(); } }),
        h('a', { role: 'menuitem', href: '/#claude', text: 'Use Claude' }),   // connector: how to make carols from Claude (the landing page's section)
        h('a', { role: 'menuitem', href: 'mailto:' + S.cfg.support, text: 'Help: ' + S.cfg.support }), h('button', { role: 'menuitem', text: 'Sign out', onclick: async function () { await SAC.call('/api/auth/out', {}); location.href = '/'; } }));
      $('.app-head').appendChild(m); ac.setAttribute('aria-expanded', 'true'); $('button', m).focus(); D.addEventListener('click', away); D.addEventListener('keydown', esc);
    };
    $('#homelink').onclick = function (e) { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); go('/make'); };
  }
  function credits(n) { if (!S.user || n == null) return; const up = n > S.user.credits; S.user.credits = n; header(); if (up) { const c = $('#credits'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } }

  // ---------- a. sign in ----------
  function signIn() {
    const me = S.me, box = h('div', { class: 'signin' }, avatar('lg'), h('h1', { text: 'First, who is singing?' }), h('p', { text: 'Sign in so your carols are yours on every device. It takes a few seconds.' }));
    let poll = 0; S.clean.push(function () { clearInterval(poll); });
    const entered = async function () { const r = await SAC.read('/api/me'); if (r && r.user) { clearInterval(poll); S.me = r; S.user = r.user; header(); const q = new URLSearchParams(location.search); if (q.get('paid')) await paidBack(q); route(); return true; } return false; };
    if (!me.google && !me.emailSignIn) { box.appendChild(h('div', { class: 'banner', text: 'Sign-in is not open yet. Come back soon.' })); return h('div', { class: 'center-screen' }, box); }
    if (me.google) {
      const slot = h('div', { class: 'gbtn' }, h('span', { class: 'muted small', text: 'Loading Google sign-in...' })); box.appendChild(slot);
      const start = function () { try { google.accounts.id.initialize({ client_id: me.google, callback: async function (g) { const r = await SAC.call('/api/auth/google', { credential: g.credential }); if (ok(r)) entered(); else oops(r); } }); slot.textContent = ''; google.accounts.id.renderButton(slot, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 300 }); } catch (e) { slot.textContent = ''; } };
      if (window.google && google.accounts) start(); else { const s = h('script', { src: 'https://accounts.google.com/gsi/client', async: true }); s.onload = start; s.onerror = function () { slot.textContent = ''; slot.appendChild(h('span', { class: 'muted small', text: me.emailSignIn ? 'Google sign-in did not load. Use an email link instead.' : 'Google sign-in did not load. Check your connection and reload.' })); }; D.head.appendChild(s); }
    }
    if (me.google && me.emailSignIn) box.appendChild(h('div', { class: 'or', text: 'or' }));
    if (me.emailSignIn) {
      const email = h('input', { class: 'input', type: 'email', name: 'email', autocomplete: 'email', inputmode: 'email', placeholder: 'you@example.com', required: true, 'aria-label': 'Your email address' }), err = h('p', { class: 'err', role: 'alert' }), btn = h('button', { class: 'btn block ' + (me.google ? 'soft' : ''), type: 'submit', text: 'Email me a link' });
      const form = h('form', { onsubmit: async function (e) {
        e.preventDefault(); err.textContent = ''; busy(btn, true); let r; try { r = await SAC.call('/api/auth/link', { email: email.value, back: '/make' + location.search }); } catch (x) { r = null; } busy(btn, false);
        if (!ok(r)) { err.textContent = r && r.error || 'That did not work. Try again.'; return; }
        form.textContent = ''; add(form, [h('div', { class: 'result', role: 'status' }, 'Check your email. We sent a sign-in link to ' + email.value + '.'), h('p', { class: 'muted small center', text: 'Open it on this device and this page will carry on by itself.' })]);
        poll = setInterval(entered, 4000);
      } }, email, btn, err); box.appendChild(form);
    }
    add(box, h('p', { class: 'fine' }, 'Before you start, read the ', h('a', { href: '/legal/terms', text: 'terms' }), ' and the ', h('a', { href: '/legal/privacy', text: 'privacy policy' }), ' (drafts, under legal review).'));   // (nothing is recorded as agreed to while they are drafts)
    return h('div', { class: 'center-screen' }, box);
  }

  // ---------- b. my carols ----------
  function home() {
    const G = { q: '', state: '', page: 1, n: 0 }, grid = h('div', { class: 'carol-grid', 'aria-live': 'polite' }), pager = h('div', { class: 'pager', hidden: true }), u = S.user;
    const search = h('input', { class: 'input', type: 'search', placeholder: 'Search your carols', 'aria-label': 'Search your carols' }), chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Show' });
    [['', 'All'], ['draft', 'Drafts'], ['ready', 'Ready'], ['down', 'Taken down']].forEach(function (s) { chips.appendChild(h('button', { class: 'chip sm', 'aria-pressed': String(s[0] === ''), text: s[1], onclick: function (e) { G.state = s[0]; G.page = 1; chips.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === e.currentTarget)); }); load(); } })); });
    let qt = 0; search.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { G.q = search.value.trim(); G.page = 1; load(); }, 260); });
    const tools = h('div', { class: 'tools', style: 'margin-top:0' }, h('label', { class: 'search' }, icon('search'), search), chips);
    const el = h('div', { class: 'screen wide' },
      h('section', { class: 'home-hero' }, h('div', {}, h('h1', { text: u.name ? 'Hello, ' + u.name.split(' ')[0] + '.' : 'Hello there.' }), h('p', { text: 'Who deserves a song today? Tell the agent about them and it will write the carol.' })), h('button', { class: 'btn big gold', text: 'Make a carol', onclick: function () { go('/make?new'); } })),
      h('div', { class: 'screen-head' }, h('h2', { style: 'font-size:28px', text: 'My carols' })), tools, grid, pager);
    async function load() {
      const n = ++G.n; if (!grid.children.length) for (let i = 0; i < 4; i++) grid.appendChild(h('div', { class: 'skel', style: 'aspect-ratio:.8' }));
      let r; try { r = await SAC.read('/api/cards?page=' + G.page + '&q=' + encodeURIComponent(G.q) + '&state=' + G.state); } catch (e) { r = { error: 'Your carols did not load. Check your connection.' }; }
      if (n !== G.n) return; grid.textContent = '';
      if (r.error || !r.items) { grid.appendChild(h('div', { class: 'empty' }, h('b', { text: 'Something went wrong' }), r.error || '', h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn sm soft', text: 'Try again', onclick: load })))); return; }
      tools.hidden = !r.total && !G.q && !G.state;
      if (!r.items.length) { grid.appendChild(G.q || G.state ? h('div', { class: 'empty' }, h('b', { text: 'Nothing matches' }), 'Try another word or filter.') : h('div', { class: 'empty' }, h('b', { text: 'No carols yet' }), 'Your first one is a few minutes away. Writing it with the agent is free to try.', h('div', { style: 'margin-top:16px' }, h('button', { class: 'btn', text: 'Make a carol', onclick: function () { go('/make?new'); } })))); pager.hidden = true; return; }
      r.items.forEach(function (c) {
        const label = { draft: 'Draft', ready: 'Ready', down: 'Taken down' }[c.state] || c.state, a = h('a', { class: 'card carol', href: '/make?card=' + c.id, onclick: function (e) { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); go('/make?card=' + c.id); } });
        const pic = c.poster ? h('span', { class: 'thumb' }, h('img', { src: c.poster, alt: '', loading: 'lazy' })) : thumb(Object.assign(sampleCard(c.template, c.occasion, { title: c.title }), { to: '', from: '', signoff: '' }), { host: a });
        pic.appendChild(h('span', { class: 'tag is-' + c.state, text: label }));
        add(a, [pic, h('b', { text: c.title }), h('span', { class: 'sub', text: c.state === 'ready' ? plural(c.opens, 'open') + ' · ' + S.cfg.domain + '/' + c.slug : c.state === 'draft' ? 'Carry on where you left it' : 'Nobody can open it now' })]);
        // a draft can be thrown away from the list (a finished carol is deleted from its own page, where what goes with it is said)
        const del = c.state === 'draft' && !c.paid ? ibtn('trash', 'Delete the draft ' + c.title, async function () {
          if (!await confirmBox({ title: 'Delete this draft?', text: '"' + c.title + '": its answers and photos are removed for good.', yes: 'Delete it', danger: true })) return;
          const x = await SAC.call('/api/cards/' + c.id, null, 'DELETE').catch(function () { return null; }); if (!ok(x)) return oops(x); say('Draft deleted.'); if (r.items.length === 1 && G.page > 1) G.page--; load();
        }, 'del') : null;
        if (del) del.style.cssText = 'position:absolute;top:8px;right:8px;z-index:2;background:rgba(29,18,48,.82);color:#fff;border-radius:999px';
        grid.appendChild(h('div', { style: 'position:relative;display:grid' }, a, del));
      });
      pager.hidden = r.pages < 2; pager.textContent = '';
      if (r.pages > 1) add(pager, [h('button', { class: 'btn sm soft', text: 'Back', disabled: r.page <= 1, onclick: function () { G.page--; load(); } }), h('span', { text: 'Page ' + r.page + ' of ' + r.pages }), h('button', { class: 'btn sm soft', text: 'More', disabled: r.page >= r.pages, onclick: function () { G.page++; load(); } })]);
    }
    show(el); load();
  }

  // ---------- e. the pay sheet ----------
  function includes() { const L = S.cfg.limits; return h('ul', { class: 'ticks small' }, h('li', { text: 'The song, sung for you, with up to ' + L.takes + ' takes' }), h('li', { text: 'The video in two shapes, and the card\'s own page' }), h('li', { text: 'Sending it by email to up to ' + L.recipients + ' people' })); }
  function pay(o) {
    o = o || {}; SAC.hold('paying', true);
    const cfg = S.cfg, packs = cfg.packs, one = packs.find(function (p) { return p.credits === 1 && !p.soon; }), best = packs.filter(function (p) { return !p.soon && p.credits > 1; })[0], err = h('p', { class: 'err', role: 'alert' }), rows = [], list = [];
    packs.forEach(function (p) {
      const each = p.cents / p.credits, save = one && p.credits > 1 && !p.soon ? Math.round((1 - each / one.cents) * 100) : 0, isBest = best && best.id === p.id || o.pack === p.id;
      const btn = p.soon || !cfg.payments ? null : h('button', { class: 'btn' + (isBest ? '' : ' ghost'), text: 'Buy', 'aria-label': 'Buy ' + p.label + ' for ' + money(p.cents), disabled: !cfg.payments, autofocus: isBest, onclick: async function () {
        err.textContent = ''; rows.forEach(function (b) { b.disabled = true; }); busy(btn, true);
        store.set('sac.buy', { credits: p.credits, card: S.card && S.card.id || '', then: o.then || '' });
        let r; try { r = await SAC.send('/api/buy', { pack: p.id, card: S.card && S.card.id || undefined }); } catch (e) { r = null; }
        if (r && r.url) { location.href = r.url; return; }
        busy(btn, false); rows.forEach(function (b) { b.disabled = false; }); err.textContent = r && r.error || 'That did not work. Check your connection and try again.';
      } });
      if (btn) rows.push(btn);
      list.push(h('div', { class: 'card payrow' + (isBest ? ' best' : '') },
        h('h3', {}, p.label, save > 0 ? h('span', { class: 'tag is-ready', text: 'save ' + save + '%' }) : null),
        h('div', { class: 'buy' }, p.soon ? h('span', { class: 'tag', text: 'Coming soon' }) : [h('b', { style: 'font:400 26px var(--serif)', text: money(p.cents) }), btn || h('span', { class: 'tag', text: 'Opens soon' })]),
        h('div', { class: 'each', text: p.soon ? '' : p.credits > 1 ? money(Math.round(each)) + ' a carol' : 'One carol, start to finish' }),
        p.soon ? null : h('p', { class: 'final' }, h('b', { text: cfg.finalSale }), ' ', h('a', { href: '/legal/refunds', target: '_blank', rel: 'noopener', text: 'Refund policy' }))));
    });
    const d = dialog({ title: 'Carol credits', body: [o.why ? h('div', { class: 'banner', text: o.why }) : null, h('div', { class: 'balance' }, avatar('sm'), 'You have ' + plural(S.user.credits, 'carol credit') + '. One credit makes one whole carol.'), includes(), !cfg.payments ? h('div', { class: 'banner', role: 'status', text: 'Purchases open soon. Nothing can be bought yet; writing a carol with the agent is open.' }) : null], onClose: function () { SAC.hold('paying', false); } });
    add(d.body, list); d.body.appendChild(err); d.body.appendChild(h('p', { class: 'muted small center', text: 'Pay once, no subscription. Credits wait until you use them.' }));
  }
  async function paidBack(q) {
    const was = store.get('sac.buy') || {}, card = q.get('card') || was.card || ''; store.set('sac.buy', null);
    let r; try { r = await SAC.read('/api/buy/confirm?session_id=' + encodeURIComponent(q.get('paid'))); } catch (e) { r = null; }
    history.replaceState(null, '', '/make' + (card ? '?card=' + encodeURIComponent(card) + (was.then ? '&edit' : '') : ''));
    if (r && r.credits != null) credits(r.credits);
    if (r && r.ok) setTimeout(function () {
      const d = dialog({ title: was.credits ? plural(was.credits, 'credit') + ' added' : 'Your credits are in', body: [h('div', { class: 'balance' }, avatar('sm'), 'Thank you! You now have ' + plural(S.user.credits, 'carol credit') + '.'),
        h('div', { class: 'foot' }, was.then === 'song' && card ? [h('button', { class: 'btn soft', text: 'Not yet', onclick: function () { d.close(); } }), h('button', { class: 'btn', text: 'Make the song', autofocus: true, onclick: function () { d.close(); if (S.makeSong) S.makeSong(); } })] : h('button', { class: 'btn', text: 'Lovely', autofocus: true, onclick: function () { d.close(); } }))] });
    }, 500);
    else say('We could not confirm that payment yet. If you paid, your credits will show up here shortly.', true);
  }

  // ---------- the mini gallery: search + style chips + pages of live thumbnails; the chosen one plays larger ----------
  function gallery(o) {   // { occasion, value, who, onPick(t) }
    const G = { q: '', family: '', page: 1, n: 0 }, pre = h('div', { class: 'gal-pre' }), grid = h('div', { class: 'gal-grid' }), fam = h('div', { class: 'chips scroll', role: 'group', 'aria-label': 'Style' }), pager = h('div', { class: 'pager', hidden: true });
    const search = h('input', { class: 'input', type: 'search', placeholder: 'Search looks', 'aria-label': 'Search looks' }); let fams = {}, qt = 0;
    (CarolTemplates.families || []).forEach(function (f) { fams[f.id] = f.name; });
    function preview(t) { pre.textContent = ''; add(pre, [thumb(sampleCard(t.id, t.occasion, o.who), { hot: true }), h('div', {}, h('span', { class: 'fam', text: fams[t.family] || '' }), h('h3', { text: t.name }), h('p', { text: t.blurb }))]); Thumbs.sweep(); }
    function pick(t) { o.value = t.id; grid.querySelectorAll('.gal-item').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.id === t.id)); }); preview(t); o.onPick(t); }
    async function load() {
      const n = ++G.n; let r; try { r = await SAC.read('/api/templates?per=' + (window.innerWidth >= 720 ? 8 : 6) + '&page=' + G.page + '&q=' + encodeURIComponent(G.q) + '&family=' + encodeURIComponent(G.family) + '&occasion=' + encodeURIComponent(o.occasion || '')); } catch (e) { r = { error: 'The looks did not load. Check your connection.' }; }
      if (n !== G.n) return; grid.textContent = '';
      if (r.error || !r.items) { grid.appendChild(h('div', { class: 'empty' }, h('b', { text: 'Something went wrong' }), r.error || '', h('div', { style: 'margin-top:12px' }, h('button', { class: 'btn sm soft', type: 'button', text: 'Try again', onclick: load })))); return; }
      if (!fam.children.length && (r.families || []).length > 1) { fam.appendChild(h('button', { class: 'chip sm', type: 'button', 'aria-pressed': 'true', 'data-id': '', text: 'All styles' })); r.families.forEach(function (f) { fam.appendChild(h('button', { class: 'chip sm', type: 'button', 'aria-pressed': 'false', 'data-id': f.id, text: f.name })); }); fam.onclick = function (e) { const b = e.target.closest('.chip'); if (!b) return; G.family = b.dataset.id; G.page = 1; fam.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); }); load(); }; }
      if (!r.items.length) { grid.appendChild(h('div', { class: 'empty' }, h('b', { text: 'No look matches that' }), 'Try another word or style.')); pager.hidden = true; return; }
      r.items.forEach(function (t) { const b = h('button', { class: 'gal-item', type: 'button', 'data-id': t.id, 'aria-pressed': String(t.id === o.value), 'aria-label': t.name + ': ' + t.blurb, onclick: function () { pick(t); } }); add(b, [thumb(sampleCard(t.id, t.occasion, o.who), { host: b }), h('span', { text: t.name })]); grid.appendChild(b); });
      const cur = o.value && CarolTemplates.get(o.value); if (!cur || o.occasion && cur.occasion !== o.occasion) pick(r.items[0]); else if (!pre.children.length) preview(cur);
      pager.hidden = r.pages < 2; pager.textContent = ''; if (r.pages > 1) add(pager, [h('button', { class: 'btn sm soft', type: 'button', text: 'Back', disabled: r.page <= 1, onclick: function () { G.page--; load(); } }), h('span', { text: r.page + ' of ' + r.pages }), h('button', { class: 'btn sm soft', type: 'button', text: 'More', disabled: r.page >= r.pages, onclick: function () { G.page++; load(); } })]);
      Thumbs.sweep();
    }
    search.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { G.q = search.value.trim(); G.page = 1; load(); }, 260); });
    load();
    return h('div', { class: 'gal' }, pre, h('label', { class: 'search' }, icon('search'), search), fam, grid, pager);
  }

  // ---------- c. the conversation with the agent: one question at a time, every answer a bubble you can tap to change ----------
  const RELS = ['Family', 'A friend', 'My partner', 'My grandparents', 'My mum or dad', 'My kid', 'My team at work', 'A client', 'A teacher', 'A neighbour'];
  const IDEAS = {
    christmas: ['What did the kids get up to this year?', 'Who always falls asleep after dinner?', 'The dog, the cat, the burnt cookies...', 'A family joke only you would get'],
    birthday: ['How old are they turning?', 'What do they love more than anything?', 'A story they tell every single time', 'The thing they are famous for in your family'],
    love: ['How did you meet?', 'The little thing they do that you love', 'Your place, your song, your trip', 'What you would never say out loud'],
    thanks: ['What did they do for you?', 'What changed because of it?', 'How would you describe them in three words?', 'A moment you will not forget'],
    congrats: ['What did they pull off?', 'How long did it take them?', 'Who doubted it? Who never did?', 'What comes next for them?'],
  };
  // ---------- photos a phone takes: HEIC is read here when this browser can (Safari), and by the server when it cannot ----------
  const PHOTO_TYPES = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
  const isHeic = function (f) { return /hei[cf]/i.test(f.type || '') || /\.hei[cf]$/i.test(f.name || ''); };
  const isPhoto = function (f) { return /^image\/(jpeg|png|webp)$/.test(f.type || '') || isHeic(f); };
  async function sendable(f) {   // -> { body, type } to upload
    if (!isHeic(f)) return { body: f, type: f.type };
    try {
      const bm = await createImageBitmap(f), cv = D.createElement('canvas'); cv.width = bm.width; cv.height = bm.height; cv.getContext('2d').drawImage(bm, 0, 0);
      const blob = await new Promise(function (done) { cv.toBlob(done, 'image/jpeg', 0.92); }); if (blob && blob.size > 2000) return { body: blob, type: 'image/jpeg', local: URL.createObjectURL(blob) };
    } catch (e) { /* this browser cannot read HEIC: the server converts it */ }
    return { body: f, type: 'image/heic' };
  }
  // THE PHOTO-RIGHTS TICK: photos can be added only once the maker has ticked that they may use them (kept for this
  // browser session; the buttons it is given stay shut until then). It is the one thing a maker confirms.
  function rightsTick(buttons) {
    const box = h('input', { type: 'checkbox', 'aria-label': 'I have the right to use these photos' }), set = function () { buttons.forEach(function (b) { if (b) b.disabled = !box.checked || S.cfg.storage === false; }); };
    box.checked = !!store.get('sac.rights'); box.addEventListener('change', function () { store.set('sac.rights', box.checked ? 1 : null); set(); }); set();
    return h('label', { class: 'check rights' }, box, h('span', {}, h('b', { text: 'These are photos I may use.' }), ' For photos of children, I am their parent or guardian, or I have permission. ', h('a', { href: '/legal/photos', target: '_blank', rel: 'noopener', text: 'About photos' }), '.'));
  }
  // ---------- WHO IT IS FOR: the one place a carol's to / from / what-they-are-to-you is typed. The conversation's
  // second question and the editor's "Who it is for" panel are both this; nothing else has an input for them. ----------
  function whoFields(d, changed) {
    const to = h('input', { value: d.to || '', maxlength: '80', placeholder: 'Grandma Dot', autocomplete: 'off', oninput: function () { d.to = to.value; changed('to'); } }), from = h('input', { value: d.from || '', maxlength: '80', placeholder: 'The Hollisters', autocomplete: 'off', oninput: function () { d.from = from.value; changed('from'); } });
    const rel = h('input', { class: 'input', value: RELS.indexOf(d.relation) < 0 ? d.relation || '' : '', maxlength: '60', placeholder: 'or say it your way: my college roommate', 'aria-label': 'What they are to you, in your words', oninput: function () { d.relation = rel.value; chips.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); }); changed('relation'); } });
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'They are' }, RELS.map(function (r) { return h('button', { class: 'chip sm', type: 'button', 'aria-pressed': String(d.relation === r), text: r, onclick: function (e) { const on = d.relation !== r; d.relation = on ? r : ''; rel.value = ''; chips.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(on && c === e.currentTarget)); }); changed('relation'); } }); }));
    return [h('div', { class: 'two' }, h('label', { class: 'field' }, h('span', { text: 'Who is it for?' }), to), h('label', { class: 'field' }, h('span', { text: 'Who is it from?' }), from)), h('div', { class: 'field' }, h('span', { class: 'label', text: 'They are...' }), chips, rel)];
  }
  const STARTS = [['Names', 'The names to mention: '], ['A pet', 'Their pet: '], ['This year', 'This year: '], ['An inside joke', 'Our inside joke: '], ['What I love', 'What I love about them: ']];
  function convo(card, tplId) {
    const cfg = S.cfg, L = cfg.limits, live = cfg.occasions.filter(function (o) { return o.state === 'live'; }), saved = !card && !tplId && store.get('sac.draft') || {};
    const t0 = card ? CarolTemplates.get(card.template) : tplId ? CarolTemplates.get(tplId) : null, a = card ? card.answers || {} : saved.answers || {};
    const d = { id: card ? card.id : '', occasion: card ? card.occasion : t0 ? t0.occasion : saved.occasion || '', template: card ? card.template : t0 ? t0.id : saved.template || '', to: a.to || '', from: a.from || '', relation: a.relation || '', details: a.details || '', must: a.must || '', own: a.own || '',
      photos: card ? card.photos.map(function (p) { return { id: p.id, url: p.url, note: p.note || '', state: 'done' }; }) : [], step: 0, reached: 0, writing: false, said: null };
    d.reached = card ? Math.max(store.get('sac.step.' + card.id) || 0, d.details ? 5 : d.photos.length ? 4 : d.to ? 2 : 1) : t0 ? 1 : saved.reached || 0; d.step = d.reached;
    const thread = h('div', { class: 'convo' }), delSlot = h('span', { style: 'margin-left:auto' }), el = h('div', { class: 'screen' }, h('div', { style: 'display:flex;align-items:center;gap:10px' }, h('button', { class: 'back', onclick: function () { go('/make'); } }, icon('back'), 'My carols'), delSlot), h('h1', { class: 'sr', text: 'Make a carol with the agent' }), thread);
    const answers = function () { return { to: d.to.trim(), from: d.from.trim(), relation: d.relation.trim(), details: d.details.trim(), must: d.must.trim(), own: d.own.trim() }; };
    const notes = function () { const n = {}; d.photos.forEach(function (p) { if (p.id && p.state === 'done') n[p.id] = p.note; }); return n; };
    const occ = function () { return cfg.occasions.find(function (o) { return o.id === d.occasion; }) || live[0] || { id: '', name: '', hello: '' }; };
    let saveT = 0, making = null, pumping = false, photoBox = null;
    function keep(now) { if (!d.id) return store.set('sac.draft', { occasion: d.occasion, template: d.template, answers: answers(), reached: d.reached }); store.set('sac.step.' + d.id, d.reached); clearTimeout(saveT); const f = function () { SAC.save(d.id, { answers: answers(), notes: notes(), template: d.template || undefined }); }; if (now) f(); else saveT = setTimeout(f, 600); }
    S.clean.push(function () { clearTimeout(saveT); SAC.hold('upload', false); });
    async function defaultTpl() { if (d.template) { const t = CarolTemplates.get(d.template); if (t && t.occasion === occ().id) return; } const r = await SAC.read('/api/templates?per=1&occasion=' + encodeURIComponent(occ().id)); if (!r.items || !r.items.length) throw { error: 'There is no look for that occasion yet. Pick another occasion.' }; d.template = r.items[0].id; }
    function ensureCard() {
      if (d.id) return Promise.resolve();
      if (!making) making = (async function () { await defaultTpl(); const r = await SAC.send('/api/cards', { template: d.template, answers: answers() }); if (!ok(r) || !r.card) throw r; d.id = r.card.id; S.card = r.card; store.set('sac.draft', null); store.set('sac.step.' + d.id, d.reached); history.replaceState(null, '', '/make?card=' + d.id); })().catch(function (e) { making = null; throw e; });
      return making;
    }
    // THE CARD IS MADE WHEN THE CONVERSATION STARTS: at its first answer, not at the first photo. From then on every
    // answer is saved to it, and it is in "My carols" as a draft, where it can be carried on or deleted.
    function done() {
      d.step = d.step < d.reached ? d.reached : d.step + 1; d.reached = Math.max(d.reached, d.step); d.said = null;
      if (d.id) keep(true); else ensureCard().then(function () { keep(true); delB.hidden = false; }, function (e) { keep(); if (e && e.error) say(e.error, true); });
      render(true);
    }
    const delB = h('button', { class: 'btn quiet sm', type: 'button', hidden: !d.id, onclick: async function () {
      if (!d.id || !await confirmBox({ title: 'Delete this draft?', text: 'Its answers and photos are removed for good.', yes: 'Delete it', danger: true })) return;
      clearTimeout(saveT); const r = await SAC.call('/api/cards/' + d.id, null, 'DELETE').catch(function () { return null; }); if (!ok(r)) return oops(r); store.set('sac.step.' + d.id, null); say('Draft deleted.'); go('/make', true);
    } }, icon('trash'), 'Delete this draft'); delSlot.appendChild(delB);
    const bubble = function (text, cls) { return h('div', { class: 'msg' }, avatar('sm' + (cls ? ' ' + cls : '')), h('div', { class: 'bubble say', text: text })); };
    const row = function (go2, label, skip, skipLabel) { return h('div', { class: 'row end' }, skip ? h('button', { class: 'btn quiet sm', type: 'button', text: skipLabel || 'Skip', onclick: skip }) : null, h('button', { class: 'btn', type: 'button', text: label || 'Continue', onclick: go2 })); };

    // --- photos ---
    function drawPhotos() {
      if (!photoBox) return; const have = d.photos.filter(function (p) { return p.state !== 'err'; }).length, up = d.photos.filter(function (p) { return p.state === 'wait' || p.state === 'up'; }).length, doneN = d.photos.filter(function (p) { return p.state === 'done'; }).length;
      photoBox.count.textContent = up ? 'Adding ' + (doneN + 1) + ' of ' + (doneN + up) + '...' : have ? plural(have, 'photo') + ' of up to ' + L.photos : 'Straight from your phone is fine (JPEG, PNG, WebP or HEIC). Up to ' + L.photos + '.';
      photoBox.next.disabled = up > 0; photoBox.next.textContent = up ? 'Adding photos...' : have ? 'Continue with ' + plural(have, 'photo') : 'Continue without photos';
      d.photos.forEach(function (p) {
        if (!p.el) { p.el = h('div', { class: 'ph' }); p.pic = h('div', { class: 'pic' }, h('img', { src: p.local || p.url, alt: 'Photo' })); p.mid = h('div', {}); add(p.el, [p.pic, p.mid, ibtn('trash', 'Remove this photo', function () { removePhoto(p); })]); photoBox.grid.appendChild(p.el); }
        if (p.shown === p.state) return; p.shown = p.state; p.mid.textContent = ''; p.el.classList.toggle('bad', p.state === 'err'); p.pic.classList.toggle('busy', p.state === 'up' || p.state === 'wait'); const sp = $('.spin', p.pic); if (sp) sp.remove();
        if (p.state === 'done') { const inp = h('input', { class: 'input', value: p.note, maxlength: '80', placeholder: 'Who is in it? (optional)', 'aria-label': 'Who is in this photo', oninput: function () { p.note = inp.value; keep(); } }); p.mid.appendChild(inp); }
        else if (p.state === 'err') p.mid.appendChild(h('div', { class: 'st', role: 'alert', text: p.error }));
        else { if (p.state === 'up') p.pic.appendChild(h('span', { class: 'spin' })); add(p.mid, [h('div', { class: 'st', text: p.state === 'up' ? 'Uploading...' : 'Waiting its turn' }), p.state === 'up' ? h('div', { class: 'bar' }, h('i')) : null]); }
      });
    }
    function addFiles(files) {
      let room = L.photos - d.photos.filter(function (p) { return p.state !== 'err'; }).length, over = 0;
      Array.prototype.forEach.call(files, function (f) {
        const p = { file: f, note: '', state: 'wait', heic: isHeic(f) };
        if (!isPhoto(f)) { p.state = 'err'; p.error = 'That is not a photo this can read. Send a JPEG, PNG, WebP or HEIC.'; }
        else if (f.size > L.photoBytes) { p.state = 'err'; p.error = 'That photo is larger than ' + Math.round(L.photoBytes / 1048576) + ' MB. Send a smaller copy.'; }
        else if (room <= 0) { over++; return; } else room--;
        if (p.state !== 'err' && !p.heic) { try { p.local = URL.createObjectURL(f); } catch (e) { p.local = ''; } } else p.url = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E';   // (a HEIC shows once it is converted)
        d.photos.push(p);
      });
      if (over) say('A carol holds up to ' + L.photos + ' photos, so ' + plural(over, 'photo') + ' did not fit.', true);
      drawPhotos(); pump();
    }
    async function pump() {
      if (pumping || !d.photos.some(function (p) { return p.state === 'wait'; })) return; pumping = true; SAC.hold('upload', true);
      try {
        await ensureCard();
        for (;;) { const p = d.photos.find(function (x) { return x.state === 'wait'; }); if (!p) break; p.state = 'up'; drawPhotos(); let r; try { const s = await sendable(p.file); r = await SAC.call('/api/cards/' + d.id + '/photos', null, 'POST', null, { type: s.type, body: s.body }); if (s.local) URL.revokeObjectURL(s.local); } catch (e) { r = { error: 'The upload did not get through. Check your connection and add it again.' }; }
          if (r.photo) { p.id = r.photo.id; p.url = r.photo.url; p.state = 'done'; p.file = null; if (p.heic && p.pic) { const im = $('img', p.pic); if (im) im.src = p.url; } } else { p.state = 'err'; p.error = r.error || 'That photo could not be added.'; } drawPhotos(); }
      } catch (r) { d.photos.forEach(function (p) { if (p.state === 'wait') { p.state = 'err'; p.error = r && r.error || 'Your carol could not be started. Try again.'; } }); drawPhotos(); }
      pumping = false; SAC.hold('upload', false);
    }
    async function removePhoto(p) { const i = d.photos.indexOf(p); if (i < 0 || p.state === 'up') return; d.photos.splice(i, 1); if (p.el) p.el.remove(); if (p.local) URL.revokeObjectURL(p.local); drawPhotos(); if (p.id && d.id) { const r = await SAC.call('/api/cards/' + d.id + '/photos/' + p.id, null, 'DELETE').catch(function () { return null; }); if (!ok(r)) oops(r); } }

    // --- the six questions ---
    const first = S.user.name ? ', ' + S.user.name.split(' ')[0] : '';
    const steps = [
      { ask: function () { return 'Hello' + first + '! I am your carol writer. What are we celebrating?'; }, told: function () { return occ().name; },
        ui: function () { const pickOcc = function (id) { d.occasion = id; const t = d.template && CarolTemplates.get(d.template); if (t && t.occasion !== id) d.template = ''; done(); }, cur = d.occasion || cfg.featured;
          return [h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Occasion' }, live.map(function (o) { return h('button', { class: 'chip', type: 'button', role: 'radio', 'aria-checked': String(o.id === cur), text: o.name, onclick: function () { pickOcc(o.id); } }); })),
            h('div', { class: 'row end' }, h('button', { class: 'btn quiet sm', type: 'button', text: 'Skip: ' + (cfg.occasions.find(function (o) { return o.id === cur; }) || live[0] || {}).name, onclick: function () { pickOcc(cur || (live[0] || {}).id); } }))]; } },
      { ask: function () { return 'Lovely. Who is this carol for, and who is it from?'; }, told: function () { return d.to || d.from ? [d.to ? 'For ' + d.to : '', d.from ? 'from ' + d.from : ''].filter(Boolean).join(', ') + (d.relation ? ' (' + d.relation.toLowerCase() + ')' : '') : 'I will keep that a surprise'; },
        ui: function () { return whoFields(d, function () { }).concat([row(done, 'Continue', function () { done(); })]); } },
      { ask: function () { return 'What should it feel like? Pick a look and I will match the music to it.'; }, told: function () { const t = CarolTemplates.get(d.template); return t ? t.name : 'You choose for me'; },
        ui: function () { return [gallery({ occasion: occ().id, value: d.template, who: { to: d.to.trim() || undefined, from: d.from.trim() || undefined }, onPick: function (t) { d.template = t.id; } }), row(done, 'Use this look', done, 'Skip: you choose')]; } },
      { ask: function () { return 'Got any photos? They dance right into the card. Add up to ' + L.photos + ', or none at all.'; }, told: function () { const n = d.photos.filter(function (p) { return p.state === 'done'; }).length; return n ? plural(n, 'photo') : 'No photos'; },
        ui: function () {
          const file = h('input', { type: 'file', accept: PHOTO_TYPES, multiple: true, class: 'sr', tabindex: '-1', 'aria-hidden': 'true', onchange: function () { addFiles(file.files); file.value = ''; } }), cam = h('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'sr', tabindex: '-1', 'aria-hidden': 'true', onchange: function () { addFiles(cam.files); cam.value = ''; } });
          const count = h('span', { class: 'muted small' }), grid = h('div', { class: 'ph-grid' }), next = h('button', { class: 'btn', type: 'button', onclick: done });
          const addB = h('button', { class: 'btn big', type: 'button', onclick: function () { file.click(); } }, icon('photo'), 'Add photos'), camB = h('button', { class: 'btn soft', type: 'button', onclick: function () { cam.click(); } }, icon('camera'), 'Take one');
          const drop = h('div', { class: 'drop', ondragover: function (e) { e.preventDefault(); drop.classList.add('over'); }, ondragleave: function () { drop.classList.remove('over'); }, ondrop: function (e) { e.preventDefault(); drop.classList.remove('over'); if (!store.get('sac.rights')) return say('Tick the box first: these must be photos you may use.', true); if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); } },
            h('div', { class: 'row', style: 'justify-content:center' }, addB, camB), count, file, cam);
          d.photos.forEach(function (p) { p.el = null; p.shown = null; }); photoBox = { count: count, grid: grid, next: next }; drawPhotos();
          return [cfg.storage === false ? h('div', { class: 'banner', role: 'status', text: cfg.closed && cfg.closed.storage || 'Photos cannot be added yet.' }) : null, rightsTick([addB, camB]), drop, grid, h('div', { class: 'row end' }, next)]; } },
      { ask: function () { return 'Now the good part. Tell me a few true things to sing about' + (d.to.trim() ? ' for ' + d.to.trim() : '') + '.'; }, told: function () { const t = d.details.trim(); return t ? (t.length > 90 ? t.slice(0, 88) + '...' : t) : 'Surprise me'; },
        ui: function () { const ideas = IDEAS[occ().id] || IDEAS.birthday; let i = 0; const hint = h('p', { class: 'prompt-line', 'aria-hidden': 'true' }), put = function () { hint.textContent = ''; add(hint, ['Stuck? ', h('b', { text: ideas[i % ideas.length] })]); }; put(); const iv = setInterval(function () { if (!D.body.contains(hint)) return clearInterval(iv); if (!D.hidden && !still) { i++; put(); } }, 3600);
          const ta = h('textarea', { class: 'input', maxlength: String(L.details), rows: '5', placeholder: 'Waffles the dog ate the whole gingerbread house. Milo lost his first tooth. She still beats everyone at cards.', 'aria-label': 'True details to sing about', oninput: function () { d.details = ta.value; keep(); } }); ta.value = d.details;
          return [ta, h('div', { class: 'row', style: 'justify-content:space-between' }, hint, counter(ta, L.details)), h('div', { class: 'chips' }, STARTS.map(function (s) { return h('button', { class: 'chip sm', type: 'button', text: '+ ' + s[0], onclick: function () { ta.value = (ta.value.trim() ? ta.value.replace(/\s*$/, '\n') : '') + s[1]; d.details = ta.value; ta.dispatchEvent(new Event('input')); ta.focus(); } }); })), row(done, 'Continue', function () { done(); }, 'Skip: surprise me')]; } },
      { ask: function () { return 'Last one, and you can skip it: anything I must work in?'; }, told: function () { return d.own.trim() ? 'My own lyrics' + (d.must.trim() ? ', and a line to keep' : '') : d.must.trim() ? 'Keep this line: "' + d.must.trim() + '"' : 'Nothing special'; },
        ui: function () { const must = h('input', { class: 'input', value: d.must, maxlength: '120', placeholder: 'You are my favourite hello', 'aria-label': 'A line that must be in the song', oninput: function () { d.must = must.value; } }), own = h('textarea', { class: 'input', maxlength: '900', rows: '6', placeholder: 'Type or paste your own words. I will fit them to the tune.', 'aria-label': 'Your own lyrics', oninput: function () { d.own = own.value; } }); own.value = d.own;
          return [h('details', { class: 'more', open: !!d.must }, h('summary', { text: 'A line that must be in the song' }), h('div', {}, must, counter(must, 120))), h('details', { class: 'more', open: !!d.own }, h('summary', { text: 'I have my own lyrics' }), h('div', {}, own, counter(own, 900))), row(done, 'Continue', function () { done(); }, 'Skip')]; } },
    ];

    // --- write my carol ---
    const HUMS = ['Humming a tune...', 'Finding a rhyme...', 'Counting the beats...', 'Putting the best bit in the chorus...', 'Reading it back out loud...'];
    async function write() {
      if (d.writing) return; d.writing = true; d.said = null; render(true); let r;
      try {
        await ensureCard(); await defaultTpl(); while (pumping) await new Promise(function (f) { setTimeout(f, 200); });
        clearTimeout(saveT); const sv = await SAC.call('/api/cards/' + d.id + '/save', { answers: answers(), notes: notes(), template: d.template || undefined }); if (!ok(sv)) throw sv;
        r = await SAC.call('/api/cards/' + d.id + '/write', { answers: answers() });
      } catch (e) { r = e && e.error ? e : { error: 'That did not get through. Check your connection and try again.' }; }
      d.writing = false; if (r.card) S.card = r.card;
      if (r.ok && r.card && r.card.script) { store.set('sac.step.' + d.id, null); store.set('sac.fresh', d.id); return go('/make?card=' + d.id + '&edit', true); }
      if (r.status === 402 && r.need === 'pack') { d.said = { text: r.error, retry: true }; render(true); return pay({ why: r.error }); }
      d.said = r.refused ? { text: r.message, hint: 'Change a detail above (tap any of your answers) and I will happily try again.', retry: true } : { text: r.error || 'Something went wrong. Try again.', retry: true }; render(true);
    }
    function render(scroll) {
      thread.textContent = ''; photoBox = null; let focusEl = null;
      for (let i = 0; i < steps.length && i <= d.reached; i++) {
        const st = steps[i]; thread.appendChild(bubble(st.ask()));
        if (i === d.step && !d.writing) { const c = h('div', { class: 'card composer' }, st.ui()); thread.appendChild(c); focusEl = c; }
        else if (i < d.reached) thread.appendChild(h('div', { class: 'msg me' }, h('button', { class: 'bubble', type: 'button', disabled: d.writing, 'aria-label': 'Change your answer: ' + st.told(), onclick: function () { d.step = i; render(true); } }, h('span', { text: st.told() }), h('small', { text: 'Change' }))));
      }
      if (d.reached >= steps.length) {
        if (d.writing) { const line = h('span', { text: HUMS[0] }); let k = 0; const iv = setInterval(function () { if (!D.body.contains(line)) return clearInterval(iv); line.textContent = HUMS[++k % HUMS.length]; }, 2400); focusEl = h('div', { class: 'msg', role: 'status' }, avatar('sm sing'), h('div', { class: 'bubble writing' }, h('div', { class: 'row', style: 'display:flex;gap:10px;align-items:center' }, h('span', { class: 'dots' }, h('i'), h('i'), h('i')), line), h('div', { class: 'bar' }, h('i')), h('span', { class: 'muted small', text: 'Writing your carol. This takes up to half a minute.' }))); thread.appendChild(focusEl); }
        else if (d.step >= steps.length) {
          if (d.said) thread.appendChild(h('div', { class: 'msg', role: 'alert' }, avatar('sm'), h('div', { class: 'bubble' }, h('div', { class: 'say', style: 'font:400 20px/1.25 var(--serif)', text: d.said.text }), d.said.hint ? h('p', { class: 'muted small', style: 'margin-top:8px', text: d.said.hint }) : null)));
          else thread.appendChild(bubble('That is everything I need' + (d.to.trim() ? ' for ' + d.to.trim() + '\'s carol' : '') + '. Shall I write it?'));
          focusEl = h('div', { class: 'composer', style: 'padding:0' }, h('button', { class: 'btn big block', type: 'button', text: d.said ? 'Try again' : 'Write my carol', onclick: write }), h('p', { class: 'muted small center', text: 'Free to try: you can change every line afterwards, and you pay only when you want it sung.' })); thread.appendChild(focusEl);
        }
      }
      Thumbs.sweep();
      if (scroll && focusEl) setTimeout(function () { const r = focusEl.getBoundingClientRect(); if (r.top < 70 || r.bottom > window.innerHeight) window.scrollTo({ top: window.scrollY + r.top - 150, behavior: still ? 'auto' : 'smooth' }); }, 60);
    }
    show(el, { quiet: true }); render(d.reached > 0);
  }

  // ---------- d. the editor with the live preview ----------
  const imgs = {};
  function photoImg(p, onload) { let im = imgs[p.id]; if (!im) { im = imgs[p.id] = new Image(); im.onload = onload; im.src = p.url; } return im.complete && im.naturalWidth ? im : null; }
  const KIND = { title: 'The title', photo: 'Your photos', art: 'A little scene', lyric: 'Sing-along', signoff: 'The sign-off' };
  SAC.on('saved', function (id, r) { if (S.onSaved) S.onSaved(id, r); }); SAC.on('refused', function (id, r) { if (S.onRefused) S.onRefused(id, r); });

  function editor() {
    const cfg = S.cfg, L = cfg.limits, id = S.card.id;
    const a0 = S.card.answers || {}, E = { script: JSON.parse(JSON.stringify(S.card.script)), answers: { to: a0.to || '', from: a0.from || '', relation: a0.relation || '' }, template: S.card.template, slug: S.card.slug, slugOk: true, dirty: false, click: false, saveT: 0 };
    E.script.scenes = E.script.scenes || []; E.script.lyrics = E.script.lyrics || [];
    const norm = function (l) { return String(l).replace(/\s+/g, ' ').trim(); };
    const lyr = function () { return E.script.lyrics.map(function (s) { return { section: s.section, lines: s.lines.map(norm).filter(Boolean) }; }).filter(function (s) { return s.lines.length; }); };
    const lineCount = function () { return E.script.lyrics.reduce(function (n, s) { return n + s.lines.length; }, 0); };
    const sung = function () { const c = S.card; return !!(c.take && c.engine && c.engine.timing && JSON.stringify(lyr()) === JSON.stringify((c.engine.lyrics || []).map(function (s) { return { section: s.section, lines: s.lines.map(norm) }; }))); };
    const arOf = function (pid) { const p = S.card.photos.find(function (q) { return q.id === pid; }); return p && p.w > 0 && p.h > 0 ? Math.round(p.w / p.h * 1000) / 1000 : 0; };
    const ecard = function () { const c = S.card, s = E.script; return { template: E.template, to: E.answers.to.trim(), from: E.answers.from.trim(), title: s.title, greeting: s.greeting, signoff: s.signoff, lyrics: lyr(), scenes: s.scenes.map(function (x, i) { return { photo: i, caption: x.caption || '', ar: arOf(x.pid), fit: x.fit || undefined, solo: x.solo ? 1 : undefined }; }), timing: sung() ? c.engine.timing : null }; };

    // --- the preview ---
    const cv = h('canvas', { 'aria-label': 'Live preview of your card', role: 'img' }), P = { t: 0, playing: false, card: null, plan: null, dur: 30, last: 0, raf: 0, audio: null, audioId: '', beat: -99, ac: null, drag: false };
    const phone = h('div', { class: 'phone' }, h('div', { class: 'screen' }, cv)), now = h('div', { class: 'now' }), sub = h('div', { class: 'sub' }), time = h('time'), marks = h('div', { class: 'marks' }), fill = h('b');
    const range = h('input', { type: 'range', min: '0', max: '1000', value: '0', 'aria-label': 'Position in the card', oninput: function () { P.drag = true; seek(range.value / 1000 * P.dur); }, onchange: function () { P.drag = false; } });
    const playB = ibtn('play', 'Play', function () { play(!P.playing); }, 'play');
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Shape' }, ['story', 'square'].map(function (k) { return h('button', { type: 'button', 'aria-pressed': String(k === 'story'), text: k === 'story' ? 'Story' : 'Square', onclick: function (e) { phone.classList.toggle('square', k === 'square'); seg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === e.currentTarget)); }); draw(); } }); }));
    const clickB = h('button', { class: 'tog', type: 'button', 'aria-pressed': 'false', onclick: function () { E.click = !E.click; clickB.setAttribute('aria-pressed', String(E.click)); if (E.click) actx(); } }, h('i'), 'Click track');
    const takeTag = h('span', { class: 'tag gold' });
    const stage = h('section', { class: 'stage', 'data-min': 'false', 'aria-label': 'Live preview' });
    const minB = ibtn('min', 'Make the preview smaller', function () { const on = stage.getAttribute('data-min') !== 'true'; stage.setAttribute('data-min', String(on)); minB.setAttribute('aria-label', on ? 'Make the preview larger' : 'Make the preview smaller'); minB.style.transform = on ? 'rotate(180deg)' : ''; setTimeout(draw, 30); }, 'minbtn');
    add(stage, h('div', { class: 'stage-in' }, phone, h('div', { class: 'pv-side' }, h('div', { class: 'txt' }, now, sub), seg, clickB, takeTag, minB), h('div', { class: 'pv-bar' }, playB, h('div', { class: 'scrub' }, marks, range), time)));
    function actx() { try { P.ac = P.ac || new (window.AudioContext || window.webkitAudioContext)(); if (P.ac.state === 'suspended') P.ac.resume(); } catch (e) { P.ac = null; } return P.ac; }
    function tick(n) { const ac = actx(); if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = n % 4 === 0 ? 1320 : 880; g.gain.setValueAtTime(0.14, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.07); }
    function images() { return E.script.scenes.map(function (x) { const p = S.card.photos.find(function (q) { return q.id === x.pid; }); return p ? photoImg(p, draw) : null; }); }
    function draw() {
      if (!P.card) return;
      if (S.fonts) { const r = cv.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1), w = Math.round(r.width * dpr), hh = Math.round(r.height * dpr); if (w > 0 && hh > 0) { if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; } try { CarolEngine.draw(cv.getContext('2d'), w, hh, P.card, P.t, { images: images() }); } catch (e) { /* a line being typed can be anything */ } } }
      if (!P.drag) range.value = String(Math.round(P.t / P.dur * 1000)); fill.style.width = (P.t / P.dur * 100) + '%'; time.textContent = clock(P.t) + ' / ' + clock(P.dur);
      if (P.plan) { const sc = P.plan.scenes.find(function (s) { return P.t >= s.t0 && P.t < s.t1; }) || P.plan.scenes[P.plan.scenes.length - 1]; if (sc && now.dataset.n !== String(sc.n)) { now.dataset.n = String(sc.n); now.textContent = KIND[sc.kind] || 'Scene'; sub.textContent = 'Scene ' + (sc.n + 1) + ' of ' + P.plan.scenes.length; } }
    }
    function refresh() {
      P.card = ecard(); try { P.plan = CarolEngine.plan(P.card); P.dur = P.plan.duration; } catch (e) { P.plan = null; }
      const tk = sung() && S.card.takes.find(function (t) { return t.id === S.card.take; });
      if (tk) { if (P.audioId !== tk.id) { if (P.audio) P.audio.pause(); P.audio = new Audio(tk.url); P.audio.preload = 'auto'; P.audioId = tk.id; P.audio.onended = function () { play(false); P.t = 0; draw(); }; } }
      else if (P.audio) { const was = P.playing; play(false); P.audio = null; P.audioId = ''; if (was) play(true); }
      clickB.hidden = !!tk; takeTag.hidden = !tk; if (tk) takeTag.textContent = 'Take ' + tk.n + ' · with the song';
      marks.textContent = ''; marks.appendChild(fill); if (P.plan) P.plan.scenes.forEach(function (s) { if (s.t0 > 0) marks.appendChild(h('i', { style: 'left:' + (s.t0 / P.dur * 100) + '%' })); });
      if (P.t > P.dur) P.t = 0; now.dataset.n = ''; draw();
    }
    function frame(t) {
      if (!P.playing) return; P.raf = requestAnimationFrame(frame);
      if (P.audio) P.t = Math.min(P.dur, P.audio.currentTime);
      else { P.t += Math.min(0.1, (t - P.last) / 1000); P.last = t; if (P.t >= P.dur) { P.t = 0; P.beat = -99; } if (E.click) { const b = CarolEngine.beatAt(P.card, P.t).n; if (b !== P.beat) { P.beat = b; tick(b); } } }
      draw();
    }
    function play(on) {
      P.playing = on; cancelAnimationFrame(P.raf); playB.textContent = ''; playB.appendChild(icon(on ? 'pause' : 'play')); playB.setAttribute('aria-label', on ? 'Pause' : 'Play');
      if (on) { P.last = performance.now(); if (P.audio) { if (P.t >= P.dur - 0.2) P.t = 0; try { P.audio.currentTime = P.t; } catch (e) { /* not loaded yet */ } const p = P.audio.play(); if (p && p.catch) p.catch(function () { play(false); }); } else if (E.click) actx(); P.raf = requestAnimationFrame(frame); }
      else if (P.audio) P.audio.pause();
    }
    function seek(t) { P.t = Math.max(0, Math.min(P.dur - 0.05, t)); P.beat = -99; if (P.audio) { try { P.audio.currentTime = P.t; } catch (e) { /* not loaded yet */ } } draw(); }
    function look(kind, i) {   // show the part of the card that is being edited (when it is not playing)
      if (P.playing || !P.plan) return; const pl = P.plan, sc = pl.scenes;
      if (kind === 'title') seek(CarolEngine.posterTime(P.card)); else if (kind === 'signoff') seek(sc[sc.length - 1].t0 + Math.min(1.6, (pl.duration - sc[sc.length - 1].t0) * 0.6));
      else if (kind === 'line' && pl.lines[i]) seek(pl.lines[i].t0 + (pl.lines[i].t1 - pl.lines[i].t0) * 0.6); else if (kind === 'photo') { const s = sc.find(function (x) { return x.kind === 'photo' && x.photos.indexOf(i) >= 0; }); if (s) seek(s.t0 + Math.min(1.4, (s.t1 - s.t0) * 0.7)); }
    }

    // --- saving: every edit shows at once and is saved 600 ms after the last key ---
    const savedEl = h('span', { class: 'saved', role: 'status', text: 'Saved' });
    function touched() { E.dirty = true; SAC.hold('editing', true); savedEl.className = 'saved busy'; savedEl.textContent = 'Saving...'; clearTimeout(E.saveT); E.saveT = setTimeout(push, 600); refresh(); action(); }
    function push() {
      clearTimeout(E.saveT); E.dirty = false; const s = E.script, data = { script: { title: s.title, greeting: s.greeting, signoff: s.signoff, scenes: s.scenes.map(function (x) { return { pid: x.pid, caption: x.caption || '', fit: x.fit || undefined, solo: x.solo ? true : undefined }; }) }, answers: { to: E.answers.to.trim(), from: E.answers.from.trim(), relation: E.answers.relation.trim() }, template: E.template }, ly = lyr();
      if (ly.reduce(function (n, x) { return n + x.lines.length; }, 0) >= 2) data.script.lyrics = ly;
      if (!S.card.shared && E.slugOk && E.slug && E.slug !== S.card.slug) data.slug = E.slug;
      SAC.save(id, data);
    }
    S.onSaved = function (cid, r) { if (cid !== id) return; if (r.card) { const keepPhotos = S.card.photos; S.card = r.card; if (!S.card.photos.length && keepPhotos.length) S.card.photos = keepPhotos; } if (!E.dirty && !SAC.waiting().length) { SAC.hold('editing', false); savedEl.className = 'saved'; savedEl.textContent = 'Saved'; } action(); };
    S.onRefused = function (cid, r) { if (cid !== id) return; savedEl.className = 'saved bad'; savedEl.textContent = 'Not saved'; SAC.hold('editing', false); say(r.error || 'That could not be saved.', true); if (r.status === 409 && slugMsg) { E.slugOk = false; slugMsg.className = 'err'; slugMsg.textContent = r.error; } };
    async function flushNow() { if (E.dirty) push(); for (let i = 0; i < 80 && SAC.waiting().length; i++) await new Promise(function (f) { setTimeout(f, 100); }); }

    // --- the form ---
    const form = h('div', { class: 'ed-form' }); let slugMsg = null;
    function text(label, key, max, kind) { const inp = h('input', { value: E.script[key] || '', maxlength: String(max), onfocus: function () { look(kind); }, oninput: function () { E.script[key] = inp.value; touched(); look(kind); } }); return h('label', { class: 'field' }, h('span', { style: 'display:flex;justify-content:space-between' }, label, counter(inp, max)), inp); }
    function words() {
      const box = h('div', { style: 'display:grid;gap:12px' }); let n = 0;
      E.script.lyrics.forEach(function (sec, si) {
        const v = h('div', { class: 'verse' + (sec.section === 'hook' ? ' hook' : '') }, h('div', { class: 'label' }, sec.section === 'hook' ? 'Hook: the part everyone sings' : 'Verse'));
        sec.lines.forEach(function (line, li) {
          const idx = n++, inp = h('input', { value: line, maxlength: String(L.lineChars), 'aria-label': (sec.section === 'hook' ? 'Hook' : 'Verse') + ' line ' + (li + 1), onfocus: function () { look('line', idx); }, oninput: function () { sec.lines[li] = inp.value; touched(); look('line', idx); } });
          v.appendChild(h('div', { class: 'line' }, inp, counter(inp, L.lineChars), ibtn('x', 'Remove this line', function () { if (lineCount() <= 2) return say('A carol needs at least two lines to sing.', true); sec.lines.splice(li, 1); if (!sec.lines.length) E.script.lyrics.splice(si, 1); touched(); build(); })));
        });
        v.appendChild(h('button', { class: 'btn quiet sm addline', type: 'button', disabled: lineCount() >= L.lines, onclick: function () { sec.lines.push(''); build(); const all = form.querySelectorAll('.verse')[si].querySelectorAll('input'); all[all.length - 1].focus(); } }, icon('plus'), lineCount() >= L.lines ? 'That is all ' + L.lines + ' lines' : 'Add a line'));
        box.appendChild(v);
      });
      return box;
    }
    function strip() {
      const box = h('div', { class: 'strip' }), sc = E.script.scenes; let from = -1;
      const move = function (a, b) { if (b < 0 || b >= sc.length || a === b) return; sc.splice(b, 0, sc.splice(a, 1)[0]); touched(); build(); const btns = form.querySelectorAll('.shot'); if (btns[b]) { const f = btns[b].querySelector('.mv button:not([disabled])'); if (f) f.focus(); } };
      sc.forEach(function (x, i) {
        const p = S.card.photos.find(function (q) { return q.id === x.pid; }); if (!p) return;
        const cap = h('input', { class: 'input', value: x.caption || '', maxlength: '40', placeholder: 'A caption (optional)', 'aria-label': 'Caption for photo ' + (i + 1), onfocus: function () { look('photo', i); }, oninput: function () { x.caption = cap.value; touched(); look('photo', i); } });
        const el = h('div', { class: 'shot', draggable: 'true', ondragstart: function (e) { from = i; el.classList.add('drag'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); } catch (er) { /* some browsers */ } }, ondragend: function () { el.classList.remove('drag'); }, ondragover: function (e) { if (from >= 0) { e.preventDefault(); el.classList.add('over'); } }, ondragleave: function () { el.classList.remove('over'); }, ondrop: function (e) { e.preventDefault(); el.classList.remove('over'); const a = from; from = -1; move(a, i); } },
          h('img', { src: p.url, alt: 'Photo ' + (i + 1), draggable: 'false' }), cap, h('div', { class: 'mv' }, h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move photo ' + (i + 1) + ' earlier', disabled: i === 0, onclick: function () { move(i, i - 1); } }, icon('up')), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move photo ' + (i + 1) + ' later', disabled: i === sc.length - 1, onclick: function () { move(i, i + 1); } }, icon('down')), ibtn('trash', 'Remove photo ' + (i + 1), function () { dropPhoto(x.pid); })));
        cap.addEventListener('mousedown', function () { el.draggable = false; }); cap.addEventListener('blur', function () { el.draggable = true; });
        // how this photo sits in its frame: "one person" lets it go in a round or shaped frame; "Move in frame" places it by hand
        const solo = h('input', { type: 'checkbox', 'aria-label': 'Photo ' + (i + 1) + ' is of one person', onchange: function () { x.solo = solo.checked ? 1 : undefined; touched(); look('photo', i); } }); solo.checked = !!x.solo;
        el.appendChild(h('div', { class: 'place', style: 'grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;font-size:14px' }, h('label', { style: 'display:inline-flex;gap:8px;align-items:center;min-height:36px;cursor:pointer', title: 'A photo of one person can go in a round or shaped frame. A group stays in a wide one, whole.' }, solo, 'One person'),
          h('button', { class: 'btn quiet sm', type: 'button', 'aria-label': 'Move photo ' + (i + 1) + ' in its frame', onclick: function () { place(x, i, p); } }, icon('pencil'), x.fit ? 'Placed by you: move it' : 'Move in frame')));
        box.appendChild(el);
      });
      const file = h('input', { type: 'file', accept: PHOTO_TYPES, multiple: true, class: 'sr', tabindex: '-1', 'aria-hidden': 'true', onchange: function () { addPhotos(file.files); file.value = ''; } });
      const full = sc.length >= L.photos, addB = h('button', { class: 'btn soft sm', type: 'button', style: 'justify-self:start', onclick: function () { file.click(); } }, icon('photo'), full ? 'That is all ' + L.photos + ' photos' : 'Add photos');
      add(box, [!sc.length ? h('p', { class: 'muted small', text: 'No photos yet. The card plays little drawn scenes instead, and photos make it theirs.' }) : null, file, full ? null : rightsTick([addB]), addB]); if (full) addB.disabled = true;
      return box;
    }
    async function addPhotos(files) {
      await flushNow(); SAC.hold('upload', true); let room = L.photos - E.script.scenes.length;
      for (const f of Array.prototype.slice.call(files)) {
        if (room <= 0) { say('A carol holds up to ' + L.photos + ' photos.', true); break; }
        if (!isPhoto(f)) { say('That is not a photo this can read. Send a JPEG, PNG, WebP or HEIC.', true); continue; }
        if (f.size > L.photoBytes) { say('That photo is larger than ' + Math.round(L.photoBytes / 1048576) + ' MB.', true); continue; }
        say('Adding ' + (f.name || 'your photo') + '...'); let r; try { const s = await sendable(f); r = await SAC.call('/api/cards/' + id + '/photos', null, 'POST', null, { type: s.type, body: s.body }); if (s.local) URL.revokeObjectURL(s.local); } catch (e) { r = null; }
        if (r && r.photo) { S.card.photos.push(r.photo); E.script.scenes.push({ pid: r.photo.id, caption: '' }); room--; } else oops(r);
      }
      SAC.hold('upload', false); await known(); build(); refresh(); action();
    }
    // (whether the video is older than the card is the SERVER's to say: asked again after something changed that is not a save)
    async function known() { try { const st = await SAC.read('/api/cards/' + id + '/status'); if (st && typeof st.stale === 'boolean') S.card.stale = st.stale; } catch (e) { /* the next save says */ } }
    async function dropPhoto(pid) { await flushNow(); const r = await SAC.call('/api/cards/' + id + '/photos/' + pid, null, 'DELETE').catch(function () { return null; }); if (!ok(r)) return oops(r); E.script.scenes = E.script.scenes.filter(function (x) { return x.pid !== pid; }); if (r.card) S.card = r.card; build(); refresh(); action(); }
    // MOVE A PHOTO IN ITS FRAME: drag it, and zoom with the slider (or the wheel, or + and -). What is kept is a point of
    // the photo and a zoom, with the photo (x.fit); "Automatic" forgets it. The picture drawn is the frame the card uses.
    function place(x, i, p) {
      const im = photoImg(p, function () { paint(); }) , pl = P.plan, sc = pl && pl.scenes.find(function (s) { return s.kind === 'photo' && s.photos.indexOf(i) >= 0; }), name = sc ? sc.frames[sc.photos.indexOf(i)] : 'plain';
      const tp = CarolTemplates.get(E.template) || CarolTemplates.list[0], asp = CarolEngine.aspectFor(name, arOf(x.pid)), W = 300, H = Math.round(W / asp), dpr = Math.min(2, window.devicePixelRatio || 1);
      const cvp = h('canvas', { width: String(W * dpr), height: String(H * dpr), tabindex: '0', role: 'img', 'aria-label': 'Photo ' + (i + 1) + ' in its frame. Drag to move it; arrow keys move it, plus and minus zoom.', style: 'width:' + W + 'px;max-width:100%;aspect-ratio:' + asp + ';touch-action:none;cursor:grab;display:block;margin:0 auto;border-radius:12px' });
      const f = x.fit ? x.fit.slice() : [0.5, 0.42, 1], zoom = h('input', { type: 'range', min: '50', max: '300', step: '1', value: String(Math.round(f[2] * 100)), 'aria-label': 'Zoom', oninput: function () { f[2] = zoom.value / 100; set(); } }), hint = h('p', { class: 'muted small center', role: 'status' });
      function paint() { const c = cvp.getContext('2d'), w = cvp.width, hh = cvp.height, img = photoImg(p, paint); c.clearRect(0, 0, w, hh); try { CarolArt.frame(name, c, img, 0, 0, w, hh, 1, tp.look.pal, { fit: x.fit || null, solo: !!x.solo, keep: !x.solo, festive: tp.occasion === 'christmas' }); } catch (e) { /* drawn again on the next change */ } hint.textContent = x.fit ? 'Placed by you.' : 'Placed automatically' + (x.solo ? ' (one person: filling the frame).' : ' (keeping everyone in view).'); }
      function set() { f[0] = Math.max(0, Math.min(1, f[0])); f[1] = Math.max(0, Math.min(1, f[1])); f[2] = Math.max(0.5, Math.min(3, f[2])); x.fit = [Math.round(f[0] * 1000) / 1000, Math.round(f[1] * 1000) / 1000, Math.round(f[2] * 100) / 100]; zoom.value = String(Math.round(f[2] * 100)); paint(); touched(); look('photo', i); }
      let from = null;
      cvp.addEventListener('pointerdown', function (e) { from = { x: e.clientX, y: e.clientY }; try { cvp.setPointerCapture(e.pointerId); } catch (er) { /* a mouse without capture */ } cvp.style.cursor = 'grabbing'; e.preventDefault(); });
      cvp.addEventListener('pointermove', function (e) { if (!from) return; const r = cvp.getBoundingClientRect(), dx = e.clientX - from.x, dy = e.clientY - from.y; if (!dx && !dy) return; from = { x: e.clientX, y: e.clientY }; f[0] -= dx / (r.width * 0.9 * f[2]); f[1] -= dy / (r.height * 0.9 * f[2]); set(); });
      ['pointerup', 'pointercancel'].forEach(function (k) { cvp.addEventListener(k, function () { from = null; cvp.style.cursor = 'grab'; }); });
      cvp.addEventListener('wheel', function (e) { e.preventDefault(); f[2] *= e.deltaY < 0 ? 1.06 : 1 / 1.06; set(); }, { passive: false });
      cvp.addEventListener('keydown', function (e) { const k = { ArrowLeft: [-0.03, 0, 1], ArrowRight: [0.03, 0, 1], ArrowUp: [0, -0.03, 1], ArrowDown: [0, 0.03, 1], '+': [0, 0, 1.08], '=': [0, 0, 1.08], '-': [0, 0, 1 / 1.08] }[e.key]; if (!k) return; e.preventDefault(); f[0] += k[0]; f[1] += k[1]; f[2] *= k[2]; set(); });
      const d = dialog({ title: 'Move it in its frame', body: [cvp, hint, h('label', { class: 'field' }, h('span', { text: 'Zoom' }), zoom),
        h('div', { class: 'foot' }, h('button', { class: 'btn soft', type: 'button', text: 'Automatic', onclick: function () { x.fit = undefined; f[0] = 0.5; f[1] = 0.42; f[2] = 1; zoom.value = '100'; paint(); touched(); look('photo', i); } }), h('button', { class: 'btn', type: 'button', text: 'Done', autofocus: true, onclick: function () { d.close(); } }))], onClose: function () { build(); } });
      if (!im) setTimeout(paint, 300); paint();
    }
    function lookPanel() {
      const t = CarolTemplates.get(E.template) || { name: 'This look', blurb: '', occasion: S.card.occasion };
      return h('section', { class: 'card panel' }, h('h2', { text: 'The look' }), h('div', { class: 'look' }, thumb(P.card || ecard(), {}), h('div', {}, h('b', { style: 'font:400 21px var(--serif)', text: t.name }), h('p', { class: 'muted small', text: t.blurb }), h('button', { class: 'btn soft sm', type: 'button', style: 'margin-top:10px', text: 'Change the look', onclick: function () {
        let pick = E.template; const d = dialog({ title: 'Change the look', wide: true, body: [gallery({ occasion: S.card.occasion, value: E.template, who: { to: S.card.answers.to || undefined, from: S.card.answers.from || undefined }, onPick: function (x) { pick = x.id; } }), h('div', { class: 'foot' }, h('button', { class: 'btn soft', type: 'button', text: 'Keep this one', onclick: function () { d.close(); } }), h('button', { class: 'btn', type: 'button', text: 'Use this look', onclick: function () { d.close(); if (pick !== E.template) { E.template = pick; touched(); build(); } } }))] });
      } }))));
    }
    function namePanel() {
      const c = S.card, inp = h('input', { value: E.slug || '', maxlength: '40', readonly: c.shared, autocapitalize: 'none', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'The card\'s name in its address' }); let t = 0, n = 0;
      slugMsg = h('p', { class: c.shared ? 'muted small' : 'ok', role: 'status', text: c.shared ? 'This card has been shared, so its address stays: links to it are already out there.' : E.slug ? 'This is where your card will live.' : '' });
      inp.addEventListener('input', function () {
        const s = inp.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-'); if (s !== inp.value) inp.value = s; E.slug = s; E.slugOk = false; clearTimeout(t); slugMsg.className = 'muted small'; slugMsg.textContent = 'Checking...'; const k = ++n;
        t = setTimeout(async function () { let r; try { r = await SAC.read('/api/slug?s=' + encodeURIComponent(s) + '&card=' + id); } catch (e) { r = { why: 'Could not check that name. Try again.' }; } if (k !== n) return; if (r.ok) { E.slugOk = true; slugMsg.className = 'ok'; slugMsg.textContent = cfg.domain + '/' + s + ' is yours.'; touched(); } else { slugMsg.className = 'err'; slugMsg.textContent = r.why || r.error || 'That name cannot be used.'; } }, 350);
      });
      return h('section', { class: 'card panel' }, h('h2', { text: 'The card\'s address' }), h('div', { class: 'slug' + (c.shared ? ' locked' : '') }, h('span', { text: cfg.domain + '/' }), inp), slugMsg);
    }
    function agentPanel() {
      const c = S.card, left = Math.max(0, L.rewrites - (c.rewrites || 0)), note = h('div', { class: 'bubble', text: E.said || c.note || 'Here is your carol. Change any line, or ask me for another go.' }), inp = h('input', { class: 'input', maxlength: '300', placeholder: 'mention Grandpa\'s truck', 'aria-label': 'Ask the agent for a change', onkeydown: function (e) { if (e.key === 'Enter') { e.preventDefault(); ask(inp.value); } } }), goB = h('button', { class: 'btn sm', type: 'button', text: 'Rewrite', onclick: function () { ask(inp.value); } }), av = avatar('sm');
      async function ask(what) {
        what = String(what || '').trim(); if (!what) { inp.focus(); return say('Say what to change, or tap one of the ideas.'); } if (E.asking) return; E.asking = true;
        busy(goB, true); av.classList.add('sing'); note.textContent = ''; add(note, [h('span', { class: 'dots' }, h('i'), h('i'), h('i')), ' Rewriting: ' + what.toLowerCase() + '...']); await flushNow();
        let r; try { r = await SAC.call('/api/cards/' + id + '/write', { ask: what }); } catch (e) { r = null; } E.asking = false; E.said = '';
        if (r && r.card) S.card = r.card;
        if (r && r.ok && r.card) { E.script = JSON.parse(JSON.stringify(r.card.script)); E.script.scenes = E.script.scenes || []; build(); refresh(); action(); return say('Here is the new take on the words.'); }
        if (r && r.refused) E.said = r.message; else if (r && r.status === 402 && r.need === 'pack') pay({ why: r.error }); else oops(r);
        build();
      }
      return h('section', { class: 'card panel' }, h('div', { class: 'agent-note' }, av, note), h('div', { class: 'ask' }, h('span', { class: 'label', style: 'display:flex;justify-content:space-between;gap:10px' }, 'Ask the agent for another take', h('span', { class: 'counter', text: plural(left, 'rewrite') + ' left' })),
        left > 0 ? [h('div', { class: 'chips' }, ['Funnier', 'Shorter', 'Warmer', 'More about the details', 'Rhyme more'].map(function (x) { return h('button', { class: 'chip sm', type: 'button', text: x, onclick: function () { ask(x); } }); })), h('div', { class: 'row' }, inp, goB)] : h('p', { class: 'muted small', text: 'The agent has rewritten this carol ' + L.rewrites + ' times, which is the most for one. You can still change every line yourself.' })));
    }
    function build() {
      const c = S.card, y = window.scrollY; form.textContent = ''; Thumbs.sweep();
      add(form, [h('div', {}, h('button', { class: 'back', type: 'button', onclick: function () { go('/make'); } }, icon('back'), 'My carols'), h('h1', { style: 'font-size:clamp(28px,7vw,38px)', text: E.script.title || 'Your carol' })),
        c.job && c.job.state === 'failed' ? h('div', { class: 'banner bad', role: 'alert', text: c.job.error || 'It did not work last time. Try again: nothing more is charged.' }) : null,
        agentPanel(),
        h('section', { class: 'card panel' }, h('h2', {}, 'The words', h('small', { text: lineCount() + ' of ' + L.lines + ' lines' })), text('Title', 'title', 56, 'title'), text('Greeting', 'greeting', 56, 'title'), words(), text('Sign-off', 'signoff', 70, 'signoff')),
        h('section', { class: 'card panel who' }, h('h2', {}, 'Who it is for', h('small', { text: 'On the card, in its link and in the email' })), whoFields(E.answers, function () { touched(); look('title'); })),
        h('section', { class: 'card panel' }, h('h2', {}, 'Photos', h('small', { text: 'Drag, or use the arrows, to reorder' })), strip()),
        lookPanel(), namePanel(),
        !c.takes.length && !c.paid ? h('section', { class: 'card panel' }, h('h2', { text: 'Housekeeping' }), h('div', { class: 'rowbtns' }, h('button', { class: 'btn danger sm', type: 'button', text: 'Delete this draft', onclick: async function () { if (!await confirmBox({ title: 'Delete this draft?', text: 'Its words and photos are removed for good.', yes: 'Delete it', danger: true })) return; clearTimeout(E.saveT); E.dirty = false; const r = await SAC.call('/api/cards/' + id, null, 'DELETE').catch(function () { return null; }); if (!ok(r)) return oops(r); say('Draft deleted.'); go('/make', true); } }))) : null]);
      window.scrollTo(0, y);
    }

    // --- the one big button ---
    const mainB = h('button', { class: 'btn big', type: 'button' }), moreB = h('button', { class: 'btn soft', type: 'button', hidden: true }), noteEl = h('div', { class: 'note' });
    const bar = h('div', { class: 'actionbar' }, h('div', { class: 'in' }, h('div', { class: 'row' }, savedEl, moreB, mainB), noteEl));
    function action() {
      const c = S.card, takes = c.takes.length, left = c.takesLeft; let fn, label, note = ''; moreB.hidden = true;
      if (!takes) { label = 'Make the song'; fn = makeSong; note = c.paid ? 'This carol is paid for: making the song uses no new credit.' : 'Uses 1 carol credit. You have ' + S.user.credits + '.'; }
      else if (!sung()) { if (left > 0) { label = 'Make another take (' + left + ' left)'; fn = makeSong; note = 'The words changed, so it is sung again. No new credit.'; } else { label = 'Go back to the sung words'; fn = function () { E.script.lyrics = JSON.parse(JSON.stringify(S.card.engine.lyrics)); touched(); build(); }; note = 'This carol has had its ' + L.takes + ' takes, so new words cannot be sung.'; } }
      else if (c.stale || E.dirty || c.state === 'draft' || c.media.indexOf('story') < 0) { label = 'Update the video'; fn = renderIt; note = c.stale || E.dirty ? 'You changed the card since its video was made. Same song, fresh video. No new credit.' : 'Same song, fresh video. No new credit.'; }   // (c.stale is the server's word: the card knows its video is older than its last edit)
      else { label = 'See the finished carol'; fn = function () { go('/make?card=' + id); }; note = 'Everything is up to date.'; if (left > 0) { moreB.hidden = false; moreB.textContent = 'Another take (' + left + ' left)'; moreB.onclick = makeSong; } }
      mainB.textContent = label; mainB.onclick = fn; noteEl.textContent = note;
    }
    async function makeSong() {
      const c = S.card;
      if (!c.paid && !c.takes.length && S.user.credits > 0 && !await confirmBox({ title: 'Make the song?', text: 'This uses 1 of your ' + plural(S.user.credits, 'carol credit') + '. The agent\'s words are sung and set to your video.', more: 'You get up to ' + L.takes + ' takes of the song for this one credit. ' + cfg.finalSale, yes: 'Make the song' })) return;
      busy(mainB, true); play(false); await flushNow(); let r; try { r = await SAC.send('/api/cards/' + id + '/song', {}); } catch (e) { r = null; } busy(mainB, false); action();
      if (r && r.status === 402) return pay({ why: r.error, then: 'song' });
      if (!ok(r)) return oops(r);
      S.card = r.card; credits(r.credits); go('/make?card=' + id, true);
    }
    async function renderIt() { busy(mainB, true); play(false); await flushNow(); let r; try { r = await SAC.send('/api/cards/' + id + '/render', {}); } catch (e) { r = null; } busy(mainB, false); action(); if (!ok(r)) return oops(r); S.card = r.card; go('/make?card=' + id, true); }
    S.makeSong = makeSong;

    S.clean.push(function () { play(false); if (E.dirty) push(); clearTimeout(E.saveT); SAC.hold('editing', false); SAC.hold('upload', false); S.onSaved = S.onRefused = S.makeSong = null; window.removeEventListener('resize', draw); if (P.ac) { try { P.ac.close(); } catch (e) { /* closed */ } } });
    window.addEventListener('resize', draw);
    show(h('div', { style: 'display:contents' }, h('div', { class: 'ed' }, stage, form), bar), { quiet: true });
    refresh(); build(); action(); seek(0); look('title');
    const again = setInterval(function () { if (!D.body.contains(cv)) return clearInterval(again); if (S.fonts && !P.playing) draw(); if (S.fonts && cv.width > 10) clearInterval(again); }, 300);
    if (store.get('sac.fresh') === id) { store.set('sac.fresh', null); say('Your carol is written. Press play, and change anything you like.'); }
  }

  // ---------- f. making it: the song, then the video ----------
  function progress() {
    const id = S.card.id, tp = CarolTemplates.get(S.card.template) || CarolTemplates.list[0], C = 2 * Math.PI * 104; let stop = false, timer = 0, creep = 0;
    SAC.hold('rendering', true); S.clean.push(function () { stop = true; clearTimeout(timer); SAC.hold('rendering', false); });
    const cv = h('canvas', { 'aria-hidden': 'true' }), ring = h('div', { class: 'ring' }), title = h('h1', { text: 'Warming up' }), pct = h('div', { class: 'pct', 'aria-live': 'polite' }), text = h('p'), stages = h('div', { class: 'stages', 'aria-hidden': 'true' }), acts = h('div', { class: 'rowbtns', style: 'justify-content:center' });
    ring.innerHTML = '<svg viewBox="0 0 236 236" aria-hidden="true"><defs><linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2b632"/><stop offset=".6" stop-color="#ff6b5e"/><stop offset="1" stop-color="#c2185b"/></linearGradient></defs><circle class="tr" cx="118" cy="118" r="104"/><circle class="fg" cx="118" cy="118" r="104" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/></svg>';
    ring.appendChild(cv); const fg = $('.fg', ring);
    const cast = (tp.cast || []).filter(function (x) { return x.kind === 'character'; }).slice(0, 3).map(function (x) { return x.name; }), bpm = tp.music && tp.music.bpm || 110;
    setTimeout(function () { Thumbs.add(cv, { hot: true, draw: function (c, W, H, t) {
      const b = t * bpm / 60; c.clearRect(0, 0, W, H); CarolArt.particles('notes', c, W, H, t, tp.look.pal, { amount: 0.7, seed: 'pr', beat: b % 1 });
      const n = cast.length || 1; (cast.length ? cast : []).forEach(function (name, i) { const x = W * (n === 1 ? 0.5 : 0.24 + 0.52 * i / (n - 1)), big = i === (n > 2 ? 1 : 0); CarolArt.character(name, c, x, H * (big ? 0.86 : 0.82), H * (n === 1 ? 0.6 : big ? 0.5 : 0.42), { beat: b % 1, n: Math.floor(b) + i, energy: 0.95, mood: i % 2 ? 'sing' : 'dance', t: t, flip: i === n - 1 && n > 1 }, tp.look.pal); });
      if (!cast.length) CarolArt.prop('microphone', c, W / 2, H * 0.55, H * 0.6, t, tp.look.pal, { beat: b % 1 });
    } }); }, 0);
    const NAMES = [['queued', 'In line'], ['song', 'The song'], ['rendering', 'The video'], ['done', 'Ready']];
    function paint(job) {
      const st = job.stage === 'song' || job.stage === 'rendering' ? job.stage : 'queued'; let p = Math.max(0, Math.min(100, job.pct || 0));
      if (st === 'song') { creep = Math.min(22, creep + 0.6); p = Math.max(p, 5 + creep); } else if (st === 'queued') p = 3;
      fg.style.strokeDashoffset = String(C * (1 - p / 100));
      title.textContent = st === 'song' ? 'Writing the song' : st === 'rendering' ? 'Making the video' : 'You are next in line';
      pct.textContent = st === 'rendering' ? 'Rendering ' + Math.round(p) + '%' : st === 'song' ? 'The band is tuning up' : 'Starting in a moment';
      text.textContent = st === 'rendering' ? 'Your photos are dancing into place. Nearly there.' : 'This takes a few minutes. You can close this page: it keeps going, and we will have it here when you are back.';
      stages.textContent = ''; const at = NAMES.findIndex(function (x) { return x[0] === st; }); NAMES.forEach(function (x, i) { stages.appendChild(h('span', { class: i === at ? 'on' : i < at ? 'done' : '', text: x[1] })); });
    }
    function failed(job) {
      SAC.hold('rendering', false); fg.style.strokeDashoffset = String(C); title.textContent = 'That one did not work'; pct.textContent = ''; text.textContent = job.error || 'It did not work this time. Try again: nothing more is charged.'; text.setAttribute('role', 'alert'); stages.textContent = ''; acts.textContent = '';
      const again = h('button', { class: 'btn gold', text: 'Try again', onclick: async function () { busy(again, true); let r; try { r = await SAC.send('/api/cards/' + id + (job.kind === 'song' ? '/song' : '/render'), {}); } catch (e) { r = null; } busy(again, false); if (r && r.status === 402) return pay({ why: r.error, then: 'song' }); if (!ok(r)) return oops(r); S.card = r.card; credits(r.credits); progress(); } });
      add(acts, [again, h('button', { class: 'btn ghost on-dark', text: 'Back to the editor', onclick: function () { store.set('sac.fail.' + job.id, 1); go('/make?card=' + id + '&edit'); } })]); again.focus();
    }
    async function poll() {
      let r; try { r = await SAC.read('/api/cards/' + id + '/status'); } catch (e) { r = null; } if (stop) return;
      if (r && r.status === 404) return go('/make', true);
      if (r && !r.error) {
        if (!r.job) { fg.style.strokeDashoffset = '0'; title.textContent = 'Your carol is ready'; pct.textContent = 'Done'; SAC.hold('rendering', false); return setTimeout(function () { if (!stop) go('/make?card=' + id, true); }, 700); }
        if (r.job.state === 'failed') return failed(r.job);
        paint(r.job);
      }
      timer = setTimeout(poll, 1500);
    }
    const j = S.card.job || { stage: 'queued', pct: 0 };
    show(h('div', { class: 'center-screen' }, h('div', { class: 'progress' }, ring, title, pct, text, stages, acts)), { dark: true });
    if (j.state === 'failed') failed(j); else { paint(j); timer = setTimeout(poll, 1200); }
  }

  // ---------- g. ready: play it, share it, send it ----------
  function ready() {
    const c = S.card, cfg = S.cfg, L = cfg.limits, id = c.id, down = c.state === 'down', v = '?v=' + encodeURIComponent(c.mv || c.v || ''), base = '/' + c.slug, title = c.script && c.script.title || 'A carol for you';
    const from = c.answers.from || '', msg = (from ? from + ' made you a carol' : 'I made you a carol') + ': ' + c.url; let shared = c.shared, file = null;
    const mark = async function () { if (shared) return; shared = true; const r = await SAC.call('/api/cards/' + id + '/share', {}).catch(function () { return null; }); if (r && r.card) S.card = r.card; };
    const again = function (r) { if (!ok(r) || !r.card) return oops(r); S.card = r.card; ready(); };
    const video = h('video', { src: down ? null : base + '/story.mp4' + v, poster: down ? null : base + '/poster-story.jpg' + v, controls: true, playsinline: true, preload: 'metadata', 'aria-label': title });
    video.addEventListener('play', function () { SAC.hold('playing', true); tune.pause(); }); ['pause', 'ended'].forEach(function (e) { video.addEventListener(e, function () { SAC.hold('playing', false); }); });
    const tune = new Audio(); let tuneB = null; tune.onended = tune.onpause = function () { if (tuneB) { tuneB.textContent = ''; tuneB.appendChild(icon('play')); tuneB = null; } };
    S.clean.push(function () { tune.pause(); video.pause(); SAC.hold('playing', false); });
    if (!down && navigator.canShare && window.File) fetch(base + '/story.mp4' + v).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) { if (!b) return; const f = new File([b], c.slug + '.mp4', { type: 'video/mp4' }); if (navigator.canShare({ files: [f] })) file = f; }).catch(function () { });
    const copy = async function () { await mark(); try { await navigator.clipboard.writeText(c.url); say('Link copied. Paste it anywhere.'); } catch (e) { const t = h('textarea', { class: 'sr' }); t.value = c.url; D.body.appendChild(t); t.select(); try { D.execCommand('copy'); say('Link copied. Paste it anywhere.'); } catch (x) { say('Copy this link: ' + c.url); } t.remove(); } };
    const link = function (name, ic, href) { return h('a', { href: href, target: '_blank', rel: 'noopener', onclick: function () { mark(); } }, icon(ic), name); };
    const e = encodeURIComponent;
    const top = h('section', { class: 'ready-top' },
      h('div', {}, h('h1', { text: down ? 'This card is resting' : 'Your carol is ready' }), h('p', { text: title })),
      h('div', { class: 'phone' }, h('div', { class: 'screen' }, down ? [thumb(c.engine, {}), h('div', { class: 'downed' }, 'Taken down', h('span', { style: 'font-weight:400;font-size:13.500px', text: 'Nobody can open it until you put it back.' }))] : video)),
      h('div', { class: 'stat' }, h('span', {}, h('b', { text: String(c.opens) }), ' ' + (c.opens === 1 ? 'open' : 'opens')), h('span', {}, h('b', { text: String(c.sent) }), ' emailed')),
      h('button', { class: 'btn ghost on-dark sm', onclick: function () { go('/make?card=' + id + '&edit'); } }, icon('pencil'), 'Edit this carol'));
    const takes = c.takes.length > 1 || c.takesLeft > 0 ? h('section', { class: 'card panel' }, h('h2', {}, 'Takes of the song', h('small', { text: c.takesLeft > 0 ? plural(c.takesLeft, 'more take') + ' left' : 'All ' + L.takes + ' made' })),
      h('div', { class: 'takes' }, c.takes.map(function (t) { const cur = t.id === c.take, pb = ibtn('play', 'Play take ' + t.n, function () { if (tuneB === pb) return tune.pause(); tune.pause(); video.pause(); tune.src = t.url; tuneB = pb; pb.textContent = ''; pb.appendChild(icon('pause')); const p = tune.play(); if (p && p.catch) p.catch(function () { tune.pause(); }); });
        return h('div', { class: 'take' + (cur ? ' cur' : '') }, pb, h('b', {}, 'Take ' + t.n, h('small', { text: clock(t.seconds) + (cur ? ' · in your card now' : '') })), cur ? h('span', { class: 'tag is-ready', text: 'In use' }) : h('button', { class: 'btn sm soft', text: 'Use this take', onclick: async function (ev) { const b = ev.currentTarget; busy(b, true); let r; try { r = await SAC.send('/api/cards/' + id + '/take', { take: t.id }); } catch (x) { r = null; } busy(b, false); if (!ok(r)) return oops(r); S.card = r.card; go('/make?card=' + id, true); } })); })),
      c.takesLeft > 0 ? h('p', { class: 'muted small' }, 'Want it sung differently? ', h('a', { href: '/make?card=' + id + '&edit', onclick: function (ev) { ev.preventDefault(); go('/make?card=' + id + '&edit'); }, text: 'Open the editor' }), ' and make another take. No new credit.') : null) : null;
    const share = down ? h('section', { class: 'card panel' }, h('h2', { text: 'It is taken down' }), h('p', { class: 'muted', text: 'The link shows nothing right now. Put it back and everything works as before.' }), h('button', { class: 'btn', text: 'Put it back', onclick: async function () { again(await SAC.call('/api/cards/' + id + '/up', {}).catch(function () { return null; })); } }))
      : h('section', { class: 'card panel' }, h('h2', { text: 'Send it' }),
        h('div', { class: 'linkbox' }, h('output', { text: c.url.replace(/^https?:\/\//, '') }), h('button', { class: 'btn sm', onclick: copy }, icon('copy'), 'Copy')),
        shared ? null : h('p', { class: 'muted small', text: 'Once you share it, this address stays as it is.' }),
        h('div', { class: 'rowbtns' }, navigator.share ? h('button', { class: 'btn', onclick: async function () { await mark(); try { await navigator.share(file ? { files: [file], title: title, text: msg } : { title: title, text: (from ? from + ' made you a carol' : 'I made you a carol'), url: c.url }); } catch (x) { /* closed */ } } }, icon('share'), 'Share') : null,
          h('button', { class: 'btn' + (navigator.share ? ' soft' : ''), onclick: function () { emailForm(mark); } }, icon('mail'), 'Send by email'), h('a', { class: 'btn soft', href: base, target: '_blank', rel: 'noopener' }, icon('open'), 'Open the card')),
        h('div', { class: 'share-grid' }, link('WhatsApp', 'wa', 'https://wa.me/?text=' + e(msg)), link('Facebook', 'fb', 'https://www.facebook.com/sharer/sharer.php?u=' + e(c.url)), link('X', 'xx', 'https://twitter.com/intent/tweet?text=' + e(title) + '&url=' + e(c.url)), link('Text', 'sms', 'sms:?&body=' + e(msg)), link('Email app', 'mail', 'mailto:?subject=' + e(title) + '&body=' + e(msg)),
          h('button', { onclick: copy }, icon('copy'), 'Copy link')),
        h('span', { class: 'label', text: 'Download the video' }),
        h('div', { class: 'rowbtns' }, h('a', { class: 'btn soft sm', href: base + '/story.mp4?dl=1', download: c.slug + '-story.mp4', onclick: function () { mark(); } }, icon('down2'), 'Tall: stories and reels'), h('a', { class: 'btn soft sm', href: base + '/square.mp4?dl=1', download: c.slug + '.mp4', onclick: function () { mark(); } }, icon('down2'), 'Square: feeds and email')));
    const care = h('section', { class: 'card panel' }, h('h2', { text: 'Housekeeping' }), h('div', { class: 'rowbtns' },
      down ? null : h('button', { class: 'btn soft sm', text: 'Take it down', onclick: async function () { if (await confirmBox({ title: 'Take this card down?', text: 'The link will show nothing until you put it back. Nothing is deleted.', yes: 'Take it down' })) again(await SAC.call('/api/cards/' + id + '/down', {}).catch(function () { return null; })); } }),
      h('button', { class: 'btn danger sm', text: 'Delete this carol', onclick: async function () { if (!await confirmBox({ title: 'Delete this carol?', text: 'Its photos, its song and its video are removed for good, and its link stops working.', more: 'A credit that was used for it does not come back.', yes: 'Delete it', danger: true })) return; const r = await SAC.call('/api/cards/' + id, null, 'DELETE').catch(function () { return null; }); if (!ok(r)) return oops(r); say('Deleted.'); go('/make', true); } })));
    // the card says its video is older than its last edit (the server's word, c.stale): offered here too, not only in the editor
    const upB = h('button', { class: 'btn sm', type: 'button', text: 'Update the video', onclick: async function () { busy(upB, true); let r; try { r = await SAC.send('/api/cards/' + id + '/render', {}); } catch (x) { r = null; } busy(upB, false); if (!ok(r)) return oops(r); S.card = r.card; go('/make?card=' + id, true); } });
    const stale = c.stale && !down ? h('section', { class: 'banner', role: 'status', style: 'display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between' }, h('span', {}, h('b', { text: 'You changed this card after its video was made. ' }), 'The link still plays the old one.'), upB) : null;
    show(h('div', { class: 'screen wide' }, h('button', { class: 'back', onclick: function () { go('/make'); } }, icon('back'), 'My carols'), h('div', { class: 'ready' }, top, h('div', { style: 'display:grid;gap:18px;min-width:0' }, stale, share, takes, care))));
  }
  function emailForm(mark) {
    const c = S.card, L = S.cfg.limits, id = c.id, list = [], left = Math.max(0, L.recipients - (c.sent || 0)), err = h('p', { class: 'err', role: 'alert' }); let sentAny = false;
    const inp = h('input', { type: 'email', inputmode: 'email', autocomplete: 'off', placeholder: 'june@example.com', 'aria-label': 'Add an email address', autofocus: true }), box = h('div', { class: 'mailchips', onclick: function (ev) { if (ev.target === box) inp.focus(); } }, inp);
    const draw = function () { box.querySelectorAll('.tag').forEach(function (x) { x.remove(); }); list.forEach(function (a, i) { box.insertBefore(h('span', { class: 'tag' }, a, h('button', { type: 'button', 'aria-label': 'Remove ' + a, onclick: function () { list.splice(i, 1); draw(); inp.focus(); } }, icon('x'))), inp); }); count.textContent = list.length + ' of ' + left; };
    const take = function () { let bad = ''; inp.value.split(/[\s,;]+/).filter(Boolean).forEach(function (a) { a = a.toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a)) bad = a + ' does not look like an email address.'; else if (list.indexOf(a) >= 0) return; else if (list.length >= left) bad = 'This carol can be emailed to ' + plural(left, 'more person').replace('persons', 'people') + '. Share the link with everyone else.'; else list.push(a); }); err.textContent = bad; if (!bad) inp.value = ''; draw(); return !bad; };
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ',' || ev.key === ' ') { if (inp.value.trim()) { ev.preventDefault(); take(); } else if (ev.key !== 'Enter') ev.preventDefault(); } else if (ev.key === 'Backspace' && !inp.value && list.length) { list.pop(); draw(); } });
    inp.addEventListener('blur', function () { if (inp.value.trim()) take(); }); inp.addEventListener('paste', function () { setTimeout(take, 0); });
    const count = h('span', { class: 'counter' }), note = h('textarea', { class: 'input', maxlength: '300', rows: '3', placeholder: 'Thinking of you. Turn the sound up!', style: 'min-height:84px', 'aria-label': 'A short note' }), know = h('input', { type: 'checkbox', required: true });
    const btn = h('button', { class: 'btn block', type: 'submit', text: 'Send it' }), who = c.answers.from || 'Someone';
    const form = h('form', { style: 'display:grid;gap:16px', novalidate: true, onsubmit: async function (ev) {
      ev.preventDefault(); if (inp.value.trim() && !take()) return; if (!list.length) { err.textContent = 'Add at least one email address.'; inp.focus(); return; } if (!know.checked) { err.textContent = 'Tick the box: these must be people you know.'; know.focus(); return; }
      err.textContent = ''; busy(btn, true); if (mark) await mark(); let r; try { r = await SAC.send('/api/cards/' + id + '/email', { to: list, note: note.value.trim(), know: true }); } catch (x) { r = null; } busy(btn, false);
      if (!ok(r)) { err.textContent = r && r.error || 'That did not get through. Check your connection and try again.'; return; }
      sentAny = true; if (r.card) S.card = r.card; const rest = Math.max(0, L.recipients - (S.card.sent || 0) - r.stopped - r.failed);
      form.textContent = ''; add(form, [h('div', { class: 'result', role: 'status' }, r.sent ? 'Sent to ' + plural(r.sent, 'person').replace('persons', 'people') + '. They will love it.' : 'Nothing was sent.'),
        r.stopped ? h('p', { class: 'muted', text: plural(r.stopped, 'address') .replace('addresss', 'addresses') + ' asked not to get these emails, so nothing went there. Send them the link yourself.' }) : null, r.failed ? h('p', { class: 'err', text: plural(r.failed, 'email') + ' could not be sent. Check the address and try again.' }) : null,
        h('p', { class: 'muted small', text: 'You can email this carol to ' + (rest === 1 ? '1 more person' : rest + ' more people') + '.' }), h('div', { class: 'foot' }, h('button', { class: 'btn', type: 'button', text: 'Done', autofocus: true, onclick: function () { d.close(); } }))]);
    } },
      left > 0 ? [h('div', { class: 'field' }, h('span', { class: 'label', style: 'display:flex;justify-content:space-between' }, 'Who should get it?', count), box, h('span', { class: 'hint', text: 'Up to ' + L.recipients + ' people for one carol. Press Enter after each address.' })),
        h('label', { class: 'field' }, h('span', { style: 'display:flex;justify-content:space-between' }, 'A short note (optional)', counter(note, 300)), note),
        h('div', { class: 'preview-mail' }, h('span', { text: 'What they will get' }), h('b', { text: c.script && c.script.title || 'Your carol' }), h('span', { text: 'An email saying "' + who + ' made you a singing card", your note, the card\'s picture and a big button that opens it. Your email address is not shown, and each person can ask not to be emailed again.' })),
        h('label', { class: 'check' }, know, h('span', {}, h('b', { text: 'These are people I know.' }), ' I am not sending this to strangers or to a list.')), err, btn]
        : h('p', { text: 'This carol has been emailed to ' + L.recipients + ' people, which is the most for one. Share the link with everyone else.' }));
    const d = dialog({ title: 'Send by email', body: form, onClose: function () { if (sentAny && S.card && S.card.id === id && $('.ready')) ready(); } }); draw();
  }

  // ---------- start ----------
  (async function boot() {
    if (window.CarolFonts) CarolFonts.loadBrowser(D).then(function () { S.fonts = true; Thumbs.kick(); });
    let me; try { me = await SAC.read('/api/me'); } catch (e) { me = null; }
    if (!me || !me.config) { main.textContent = ''; main.appendChild(h('div', { class: 'center-screen' }, h('div', { class: 'signin' }, h('h1', { text: 'We could not reach the studio' }), h('p', { text: me && me.error || 'Check your connection and try again.' }), h('button', { class: 'btn', text: 'Reload', onclick: function () { location.reload(); } })))); return; }
    S.me = me; S.cfg = me.config; S.user = me.user; season(); header();
    const q = new URLSearchParams(location.search); if (S.user && q.get('paid')) await paidBack(q);
    route();
    if (S.user && q.get('buy')) pay();   // connector: the link Claude gives when a carol needs a credit opens the packs
  })();
})();
