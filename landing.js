// landing.js : the visitor's page (/). Everything that could change (the name, prices, limits, occasions, which
// occasion is in season) comes from GET /api/landing; nothing here assumes a season or types a price.
(function () {
  'use strict';
  const D = document, $ = function (s, r) { return (r || D).querySelector(s); };
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cfg = null, fonts = false;

  function h(tag, a) {
    const el = D.createElement(tag); a = a || {};
    Object.keys(a).forEach(function (k) { const v = a[k]; if (v == null || v === false) return; if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v); });
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, kid) { if (kid == null || kid === false) return; if (Array.isArray(kid)) return kid.forEach(function (k) { add(el, k); }); el.appendChild(typeof kid === 'object' ? kid : D.createTextNode(String(kid))); }
  const money = function (cents) { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(cfg.currency || 'usd').toUpperCase() }).format(cents / 100); } catch (e) { return (cents / 100).toFixed(2); } };

  // ----- words a live preview sings before anybody has written anything (per occasion) -----
  const SAMPLE = {
    christmas: { to: 'Grandma Dot', from: 'The Hollisters', title: 'A Carol for Grandma Dot', greeting: 'Merry Christmas, Grandma!', signoff: 'Love, the Hollisters', lines: ['The lights are up along the street tonight', 'And Waffles ate the gingerbread again', 'We saved your seat beside the fire', 'So here is a carol, sung for you'] },
    birthday: { to: 'Maya', from: 'Dad', title: 'Maya Turns Nine', greeting: 'Happy birthday, Maya!', signoff: 'Love, Dad', lines: ['Nine whole years of cartwheels in the hall', 'You lost a tooth and won the spelling bee', 'Blow the candles, make it loud', 'This one is your birthday carol'] },
    love: { to: 'Sam', from: 'Ada', title: 'Still You, Sam', greeting: 'For you, Sam', signoff: 'Yours, Ada', lines: ['You burned the toast the day we met', 'And I have loved you ever since', 'Every road trip, every rainy day', 'This little carol is all yours'] },
    thanks: { to: 'Ms. Okafor', from: 'Room 12', title: 'Thank You, Ms. Okafor', greeting: 'Thank you!', signoff: 'From all of Room 12', lines: ['You stayed late and you made it fun', 'You knew our names by day one', 'For every gold star on the wall', 'Here is a carol from us all'] },
    congrats: { to: 'Priya', from: 'The whole team', title: 'You Did It, Priya', greeting: 'Congratulations!', signoff: 'Cheering, the whole team', lines: ['Four long years and a thousand cups of tea', 'Now look at you up there', 'We always knew, we always knew', 'So here is a carol just for you'] },
  };
  function sampleCard(t) {
    const o = (cfg && cfg.occasions || []).find(function (x) { return x.id === t.occasion; });
    const s = SAMPLE[t.occasion] || (o ? { to: 'Sam', from: 'Ada', title: 'A Carol for Sam', greeting: o.hello + ', Sam', signoff: 'With love, Ada', lines: ['We wrote you a song of your own', 'With your name in every line', 'Every memory, every smile', 'This little carol is yours'] } : SAMPLE.birthday);
    return { template: t.id, to: s.to, from: s.from, title: s.title, greeting: s.greeting, signoff: s.signoff, lyrics: [{ section: 'verse', lines: s.lines.slice(0, 2) }, { section: 'hook', lines: s.lines.slice(2) }], scenes: [], timing: null };
  }

  // ----- the season: one attribute on <html>, one canvas of ambient particles -----
  const BRAND = { bg: '#1d1230', bg2: '#2c1a44', ink: '#2a1a2e', accent: '#ff6b5e', accent2: '#c2185b', gold: '#f2b632', snow: '#ffffff', paper: '#fff8ee' };
  const SEASON = { christmas: [['snow', 0.5]], love: [['hearts', 0.6]], birthday: [['confetti', 0.4], ['notes', 0.35]], congrats: [['confetti', 0.4], ['stars', 0.3]] };
  function season() {
    const f = cfg.featured || 'none', cv = $('#ambient'), layers = SEASON[f] || [['notes', 0.5], ['confetti', 0.18]];
    D.documentElement.setAttribute('data-season', f);
    const occ = (cfg.occasions || []).find(function (o) { return o.id === f; });
    if (occ) { $('#season').hidden = false; $('#season span').textContent = (occ.now ? 'In season: ' : 'Singing now: ') + occ.name; }
    if (!cv || !window.CarolArt) return;
    const ctx = cv.getContext('2d'); let last = 0;
    const paint = function (now) {
      const w = window.innerWidth, hh = window.innerHeight; if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
      ctx.clearRect(0, 0, w, hh);
      layers.forEach(function (l, i) { CarolArt.particles(l[0], ctx, w, hh, now / 1000, BRAND, { amount: l[1] * Math.min(1.5, Math.max(0.6, w / 900)), seed: 'amb' + i }); });
    };
    const loop = function (now) { requestAnimationFrame(loop); if (D.hidden || now - last < 45 || window.scrollY > window.innerHeight * 1.2 && !nearDark()) return; last = now; paint(now); };
    const nearDark = function () { return window.scrollY + window.innerHeight > D.body.scrollHeight - 900; };   // the closing band and the footer are dark too
    if (still) paint(4000); else requestAnimationFrame(loop);
  }

  // ----- live thumbnails: drawn when they scroll into view, moving while hovered/tapped, and gently while in view if the frame budget allows -----
  const Thumbs = (function () {
    const items = []; let at = 0;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { const it = items.find(function (x) { return x.cv === e.target; }); if (it) { it.vis = e.isIntersecting; if (it.vis && !it.drawn) paint(it, performance.now(), true); } }); }, { rootMargin: '160px' }) : null;
    function fit(cv) { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * d), hh = Math.round(r.height * d); if (w > 0 && hh > 0 && (cv.width !== w || cv.height !== hh)) { cv.width = w; cv.height = hh; } return w > 0 && hh > 0; }
    function paint(it, now, first) {
      if (!fonts || !fit(it.cv)) return; const ctx = it.cv.getContext('2d'), W = it.cv.width, H = it.cv.height;
      const t = first || still && !it.hot ? it.poster : it.poster + ((now - it.t0) / 1000) % Math.max(1, it.dur - it.poster - 0.2);
      try { if (it.draw) it.draw(ctx, W, H, first ? 1.2 : now / 1000); else CarolEngine.draw(ctx, W, H, it.card, t, { images: [] }); it.drawn = true; } catch (e) { it.dead = true; }
      it.last = now;
    }
    function loop(now) {
      requestAnimationFrame(loop); if (D.hidden || !fonts) return;
      const t0 = performance.now(); let n = items.length;
      while (n-- > 0 && performance.now() - t0 < 7) { at = (at + 1) % items.length; const it = items[at]; if (it.dead || !it.vis || !D.body.contains(it.cv)) continue; if (!it.drawn) paint(it, now, true); else if (!still && now - it.last > (it.hot ? 30 : 110)) paint(it, now); else if (still && it.hot && now - it.last > 30) paint(it, now); }
    }
    requestAnimationFrame(loop);
    return {
      add: function (cv, o) {   // o: { card } or { draw(ctx, W, H, t) }, hot: always at full rate
        const it = { cv: cv, card: o.card, draw: o.draw, hot: !!o.hot, vis: !io, drawn: false, last: 0, t0: performance.now(), poster: 0, dur: 30 };
        if (it.card) { try { it.poster = CarolEngine.posterTime(it.card); it.dur = CarolEngine.timing(it.card).duration; } catch (e) { it.poster = 2; } }
        items.push(it); if (io) io.observe(cv);
        if (!o.hot) { const on = function () { it.hot = true; it.t0 = performance.now() - 100; }, off = function () { it.hot = false; }; const host = o.host || cv; host.addEventListener('pointerenter', on); host.addEventListener('pointerleave', off); host.addEventListener('focusin', on); host.addEventListener('focusout', off); host.addEventListener('touchstart', on, { passive: true }); }
        return it;
      },
      clear: function (root) { for (let i = items.length - 1; i >= 0; i--) if (root.contains(items[i].cv)) { if (io) io.unobserve(items[i].cv); items.splice(i, 1); } },
      kick: function () { items.forEach(function (it) { it.drawn = false; }); },
    };
  })();

  // ----- the hero's phone: three real example cards, or three live templates while there are none -----
  function player(examples) {
    const slides = $('#slides'), dots = $('#pdots'), cap = $('#pcap'); let cur = 0, list = [], timer = 0, sound = false;
    slides.textContent = '';
    const show = function (i, user) {
      cur = (i + list.length) % list.length;
      list.forEach(function (s, k) { s.el.classList.toggle('on', k === cur); if (s.dot) s.dot.setAttribute('aria-current', k === cur ? 'true' : 'false'); if (s.it) s.it.hot = k === cur; if (s.video) { if (k === cur) { s.video.muted = !sound; s.video.currentTime = 0; const p = s.video.play(); if (p && p.catch) p.catch(function () { }); } else s.video.pause(); } });
      cap.textContent = ''; add(cap, [h('b', { text: list[cur].title }), h('span', { text: list[cur].sub })]);
      if (user) clearInterval(timer);
    };
    const finish = function () {
      if (list.length > 1) list.forEach(function (s, k) { s.dot = h('button', { 'aria-label': 'Example ' + (k + 1) + ': ' + s.title, onclick: function () { show(k, true); } }); dots.appendChild(s.dot); });
      show(0);
    };
    const occName = function (id) { const o = (cfg.occasions || []).find(function (x) { return x.id === id; }); return o ? o.name : ''; };
    if (examples && examples.length) {
      examples.slice(0, 3).forEach(function (ex) {
        const v = h('video', { src: ex.video, poster: ex.poster, playsinline: true, preload: 'metadata', 'aria-label': ex.title }); v.muted = true; v.loop = examples.length === 1;
        v.addEventListener('ended', function () { if (sound) { v.currentTime = 0; v.play(); } else show(cur + 1); });
        const el = h('div', { class: 'slide' }, v); slides.appendChild(el);
        list.push({ el: el, video: v, title: ex.title, sub: [occName(ex.occasion), ex.to ? 'for ' + ex.to : ''].filter(Boolean).join(' · ') });
      });
      const btn = h('button', { class: 'sound', 'aria-pressed': 'false' }); const label = function () { btn.textContent = ''; btn.insertAdjacentHTML('afterbegin', sound ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.500 8.500a5 5 0 0 1 0 7M19 6a8.500 8.500 0 0 1 0 12"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9.500 5 5m0-5-5 5"/></svg>'); btn.appendChild(D.createTextNode(sound ? 'Sound on' : 'Tap for sound')); btn.setAttribute('aria-pressed', String(sound)); };
      btn.onclick = function () { sound = !sound; label(); const v = list[cur].video; v.muted = !sound; if (sound) { v.currentTime = 0; const p = v.play(); if (p && p.catch) p.catch(function () { }); } };
      label(); slides.appendChild(btn); finish();
    } else {
      SAC.read('/api/templates?per=3&occasion=' + encodeURIComponent(cfg.featured || '')).then(function (r) {
        (r.items || []).forEach(function (t) {
          const cv = h('canvas', { 'aria-label': t.name + ': a live preview' }), el = h('div', { class: 'slide' }, cv); slides.appendChild(el);
          list.push({ el: el, it: Thumbs.add(cv, { card: sampleCard(t), hot: true }), title: t.name, sub: 'A live preview of this template' });
        });
        if (!list.length) { cap.textContent = ''; return; }
        list.forEach(function (s) { s.it.hot = false; });
        slides.appendChild(h('span', { class: 'tag gold live', text: 'Live preview' })); finish();
        if (list.length > 1 && !still) timer = setInterval(function () { if (!D.hidden) show(cur + 1); }, 9000);
      });
    }
  }

  // ----- little drawings (how it works, and the two that float by the phone) -----
  function arts() {
    const A = window.CarolArt; if (!A) return;
    const has = function (n) { return A.props.indexOf(n) >= 0; }, P = function (n, c, x, y, s, t, o) { if (has(n)) A.prop(n, c, x, y, s, t, BRAND, o); };
    const beat = function (t) { return (t * 1.6) % 1; };
    const scenes = {
      tell: function (c, W, H, t) { const u = H / 100; A.particles('hearts', c, W, H, t, BRAND, { amount: 0.5, seed: 'a' }); P('envelope', c, W * 0.36, H * 0.56 + Math.sin(t * 1.4) * u * 2, u * 62, t, { beat: beat(t) }); P('heart', c, W * 0.7, H * 0.4 + Math.cos(t * 1.7) * u * 3, u * 34, t, { beat: beat(t) }); },
      sing: function (c, W, H, t) { const u = H / 100; A.particles('notes', c, W, H, t, BRAND, { amount: 1, seed: 'b', beat: beat(t) }); P('microphone', c, W * 0.34, H * 0.54, u * 66, t, { beat: beat(t) }); P('radio', c, W * 0.7, H * 0.6, u * 46, t, { beat: beat(t) }); },
      send: function (c, W, H, t) { const u = H / 100; A.particles('stars', c, W, H, t, BRAND, { amount: 0.7, seed: 'c' }); P('globe', c, W * 0.7, H * 0.6, u * 50, t, { beat: beat(t) }); P('airplane', c, W * 0.36 + Math.sin(t * 0.9) * u * 5, H * 0.42 + Math.cos(t * 1.3) * u * 4, u * 62, t, { beat: beat(t) }); },
    };
    D.querySelectorAll('canvas[data-art]').forEach(function (cv) { const f = scenes[cv.getAttribute('data-art')]; if (f) Thumbs.add(cv, { draw: function (c, W, H, t) { c.clearRect(0, 0, W, H); f(c, W, H, t); }, host: cv.parentNode }); });
    const pair = { christmas: ['ornament', 'bell'], love: ['heart', 'envelope'] }[cfg.featured] || ['envelope', 'microphone'];
    ['#float1', '#float2'].forEach(function (id, i) { const cv = $(id); if (cv) Thumbs.add(cv, { hot: true, draw: function (c, W, H, t) { c.clearRect(0, 0, W, H); c.save(); c.translate(W / 2, H / 2); c.rotate(Math.sin(t * 0.9 + i * 2) * 0.12 + (i ? 0.2 : -0.2)); P(pair[i], c, 0, Math.sin(t * 1.3 + i) * H * 0.04, H * 0.66, t, { beat: beat(t) }); c.restore(); } }); });
  }

  // ----- occasions and the gallery -----
  const G = { q: '', occasion: '', family: '', page: 1, n: 0 };
  function occasions() {
    const row = $('#occs'), soon = $('#soon'), live = cfg.occasions.filter(function (o) { return o.state === 'live'; }), later = cfg.occasions.filter(function (o) { return o.state === 'soon'; });
    // the first occasions (today's first) as chips; every occasion, A to Z, in a list after them
    const FEW = 11, first = live.filter(function (o) { return o.id === cfg.featured; }).concat(live.filter(function (o) { return o.id !== cfg.featured; })).slice(0, FEW);
    const more = live.length > FEW ? h('select', { class: 'input chip-select', 'aria-label': 'More occasions', onchange: function () { if (more.value) pick(more.value); } }) : null;
    const pick = function (id) { G.occasion = id; G.family = ''; G.page = 1; row.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.id === id)); }); if (more) more.value = first.some(function (o) { return o.id === id; }) ? '' : id; gallery(); };
    row.appendChild(h('button', { class: 'chip', 'data-id': '', 'aria-pressed': 'true', text: 'All occasions', onclick: function () { pick(''); } }));
    if (more) { more.appendChild(h('option', { value: '', text: 'Every occasion (' + live.length + ')' })); live.slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; }).forEach(function (o) { more.appendChild(h('option', { value: o.id, text: o.name })); }); row.appendChild(more); }
    first.forEach(function (o) { row.appendChild(h('button', { class: 'chip', 'data-id': o.id, 'aria-pressed': 'false', text: o.name, onclick: function () { pick(o.id); } })); });
    if (later.length) { soon.hidden = false; add(soon, ['Coming soon:', later.map(function (o) { return h('span', { class: 'chip soon', text: o.name }); })]); }
  }
  function gallery() {
    const grid = $('#tgrid'), pager = $('#tpager'), n = ++G.n, wide = window.innerWidth >= 960;
    SAC.read('/api/templates?per=' + (wide ? 8 : 6) + '&page=' + G.page + '&q=' + encodeURIComponent(G.q) + '&occasion=' + encodeURIComponent(G.occasion) + '&family=' + encodeURIComponent(G.family)).then(function (r) {
      if (n !== G.n) return;
      Thumbs.clear(grid); grid.textContent = '';
      if (r.error) { grid.appendChild(h('div', { class: 'empty' }, h('b', { text: 'The templates did not load' }), r.error, h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn sm soft', text: 'Try again', onclick: gallery })))); pager.hidden = true; return; }
      const fams = {}, sel = $('#tfam'); (r.families || []).forEach(function (f) { fams[f.id] = f.name; });
      const keep = G.family; sel.textContent = ''; sel.appendChild(h('option', { value: '', text: 'All styles' })); (r.families || []).forEach(function (f) { sel.appendChild(h('option', { value: f.id, text: f.name })); }); sel.value = keep;
      if (!r.items.length) { grid.appendChild(h('div', { class: 'empty' }, h('b', { text: 'Nothing matches that yet' }), 'Try another word, or clear the filters.', h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn sm soft', text: 'Show everything', onclick: function () { G.q = ''; G.family = ''; $('#tq').value = ''; G.page = 1; gallery(); } })))); pager.hidden = true; return; }
      r.items.forEach(function (t) {
        const cv = h('canvas', { 'aria-hidden': 'true' }), th = h('a', { class: 'thumb', href: '/make?template=' + encodeURIComponent(t.id), 'aria-label': 'Use ' + t.name }, cv);
        const card = h('article', { class: 'card tpl' }, th, h('div', { class: 'meta' }, h('span', { class: 'fam', text: fams[t.family] || '' }), h('h3', { text: t.name }), h('p', { text: t.blurb }), h('a', { class: 'btn sm', href: '/make?template=' + encodeURIComponent(t.id), text: 'Use this' })));
        grid.appendChild(card); Thumbs.add(cv, { card: sampleCard(t), host: card });
      });
      pager.hidden = r.pages < 2; pager.textContent = '';
      if (r.pages > 1) add(pager, [h('button', { class: 'btn sm soft', text: 'Back', disabled: r.page <= 1, onclick: function () { G.page = r.page - 1; gallery(); $('#templates').scrollIntoView(); } }), h('span', { text: 'Page ' + r.page + ' of ' + r.pages }), h('button', { class: 'btn sm soft', text: 'More', disabled: r.page >= r.pages, onclick: function () { G.page = r.page + 1; gallery(); $('#templates').scrollIntoView(); } })]);
    }, function () { if (n === G.n) { grid.textContent = ''; grid.appendChild(h('div', { class: 'empty' }, h('b', { text: 'The templates did not load' }), 'Check your connection and try again.')); } });
  }

  // ----- pricing: every amount is config's -----
  function pricing() {
    const box = $('#packs'), packs = cfg.packs || [], one = packs.find(function (p) { return p.credits === 1 && !p.soon; }), best = packs.filter(function (p) { return !p.soon && p.credits > 1; })[0];
    box.textContent = '';
    packs.forEach(function (p) {
      const each = p.cents / p.credits, save = one && p.credits > 1 && !p.soon ? Math.round((1 - each / one.cents) * 100) : 0;
      box.appendChild(h('article', { class: 'card pack' + (best && p.id === best.id ? ' best' : '') },
        best && p.id === best.id ? h('span', { class: 'tag gold flag', text: 'Most loved' }) : null,
        h('h3', { text: p.label }),
        p.soon ? h('div', { class: 'price', style: 'font-size:34px;padding:10px 0', text: 'Coming soon' }) : h('div', { class: 'price', text: money(p.cents) }),
        h('div', { class: 'each' }, p.soon ? '' : p.credits > 1 ? [money(Math.round(each)) + ' a carol', save > 0 ? [' · ', h('b', { text: 'save ' + save + '%' })] : null] : 'One carol, start to finish'),
        p.soon ? null : h('a', { class: 'btn block' + (best && p.id === best.id ? '' : ' ghost'), href: '/make?buy=' + encodeURIComponent(p.id), text: 'Get ' + p.label }),
        p.soon ? null : h('p', { class: 'final' }, cfg.finalSale + ' ', h('a', { href: '/legal/refunds', text: 'Details' }))));
    });
    D.querySelectorAll('[data-v]').forEach(function (el) { const v = el.getAttribute('data-v').split('.').reduce(function (o, k) { return o && o[k]; }, cfg); if (v != null) el.textContent = v; });
    if (cfg.limits && cfg.limits.freeDrafts) $('#herofine').textContent = 'Writing it with the agent is free to try. You pay only when you want it sung.';
  }

  // ----- the page -----
  function says() {
    const el = $('#says'), list = cfg.occasions.filter(function (o) { return o.state === 'live'; }).map(function (o) { return o.hello; }); if (!list.length) return;
    let i = Math.max(0, cfg.occasions.filter(function (o) { return o.state === 'live'; }).findIndex(function (o) { return o.id === cfg.featured; }));
    const put = function () { el.textContent = ''; el.appendChild(h('span', { text: list[i % list.length] + '.' })); };
    put(); if (!still && list.length > 1) setInterval(function () { if (!D.hidden) { i++; put(); } }, 2600);
  }
  function chrome() {
    const head = $('#head'), menu = $('#menu'), stick = function () { head.classList.toggle('stuck', window.scrollY > 12); };
    window.addEventListener('scroll', stick, { passive: true }); stick();
    const shut = function () { head.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
    menu.onclick = function () { const on = !head.classList.contains('open'); head.classList.toggle('open', on); menu.setAttribute('aria-expanded', String(on)); };
    $('#nav').addEventListener('click', shut); D.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    let qt = 0; $('#tq').addEventListener('input', function (e) { clearTimeout(qt); qt = setTimeout(function () { G.q = e.target.value.trim(); G.page = 1; gallery(); }, 260); });
    $('#tfam').addEventListener('change', function (e) { G.family = e.target.value; G.page = 1; gallery(); });
    const to = { '/gallery': '#templates', '/pricing': '#pricing', '/help': '#faq', '/about': '#how' }[location.pathname];
    if (to && !location.hash) setTimeout(function () { const el = $(to); if (el) el.scrollIntoView(); }, 60);
  }

  chrome();
  if (window.CarolFonts) CarolFonts.loadBrowser(D).then(function () { fonts = true; Thumbs.kick(); });
  SAC.read('/api/landing').then(function (r) {
    if (!r || !r.config) throw new Error('no config');
    cfg = r.config; season(); says(); occasions(); pricing(); arts(); player(r.examples); gallery();
  }).catch(function () {
    $('#packs').textContent = ''; $('#packs').appendChild(h('div', { class: 'empty' }, h('b', { text: 'We could not load the page fully' }), 'Check your connection and reload.'));
    $('#slides').textContent = '';
  });
})();
