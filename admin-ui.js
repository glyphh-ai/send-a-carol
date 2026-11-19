/* admin-ui.js : /admin. Everything it shows and does goes through the admin tools (POST /api/admin/tool { name, args }),
   the same ones the admin MCP uses. Every list is search + filters + pages (20 a page, from the tool). Every action
   asks for a reason first, shows the tool's answer or its error sentence, and reloads the list.
   Whatever a user wrote (titles, names, lyrics, reports) is put on the page as text, never as HTML. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var ST = { tab: 'overview', args: {}, days: 30, over: null, occ: null, fams: null, poll: 0, reload: null };
  var TABS = [['overview', 'Overview'], ['carols', 'Carols'], ['accounts', 'Accounts'], ['reports', 'Reports'], ['jobs', 'Jobs'], ['templates', 'Templates'], ['occasions', 'Occasions'], ['prices', 'Prices & limits'], ['audit', 'Audit']];
  var ACTIONS = ['admin_take_down', 'admin_delete_media', 'admin_grant', 'admin_ban', 'admin_report', 'admin_retry_job', 'admin_template', 'admin_occasion', 'admin_limit'];

  /* ---------- building the page: text only ---------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = String(text); return e; }
  function add(p) { for (var i = 1; i < arguments.length; i++) { var k = arguments[i]; if (k === null || k === undefined || k === false) continue; p.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k); } return p; }
  function btn(text, cls, fn) { var b = el('button', 'b ' + (cls || ''), text); b.type = 'button'; b.onclick = function (ev) { ev.stopPropagation(); fn(b); }; return b; }
  function tag(text, kind) { return el('span', 'tag ' + (kind || ''), text); }
  function q(v) { return v && typeof v === 'object' && 'quoted' in v ? v.quoted : v; }          // what a user wrote, unwrapped (still only ever shown as text)
  function quoted(text, cls) { var s = el('span', 'q-text ' + (cls || ''), text); return s; }
  function when(ms) { if (!ms) return ''; var d = new Date(+ms); return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  function usd(n) { if (n === null || n === undefined) return 'n/a'; var neg = n < 0; n = Math.abs(n); return (neg ? '-$' : '$') + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(n) { return (+n || 0).toLocaleString('en-US'); }
  function show(e, on) { e.hidden = !on; }
  function toast(text) { var t = $('toast'); t.textContent = text; show(t, true); clearTimeout(toast.t); toast.t = setTimeout(function () { show(t, false); }, 3600); }
  function stateTag(s) { return tag(s, { ready: 'ok', done: 'ok', live: 'ok', draft: '', queued: 'warn', running: 'warn', soon: 'warn', open: 'warn', down: 'bad', failed: 'bad', deleted: 'off', off: 'off' }[s] || ''); }
  function cardLink(name, ready) { if (!name) return el('span', 'sub', 'no card name yet'); if (!ready) return el('span', 'mono', '/' + name); var a = el('a', 'mono', '/' + name); a.href = '/' + encodeURIComponent(name); a.target = '_blank'; a.rel = 'noopener'; a.onclick = function (ev) { ev.stopPropagation(); }; return a; }

  /* ---------- the tools ---------- */
  function tool(name, args) {
    return SAC.call('/api/admin/tool', { name: name, args: args || {} }).then(function (r) {
      if (r.status === 401) { gate(r); throw new Error('Sign in again.'); }
      if (r.error) throw new Error(r.error);
      return r;
    });
  }

  /* ---------- the gate ---------- */
  function boot() {
    return SAC.call('/api/admin/data').then(function (r) {
      if (r.status === 401) return gate(r);
      if (r.error) { gate({}); return fail(r.error); }
      ST.over = r; clearInterval(ST.poll); show($('gate'), false); show($('app'), true); tabs(); go((location.hash || '').slice(1) || 'overview');
    }, function () { gate({}); fail('The server did not answer. Try again in a moment.'); });
  }
  function fail(text) { var e = $('g-err'); e.textContent = text; show(e, !!text); }
  function gate(r) {
    show($('app'), false); show($('gate'), true); closeDrawer(); show($('dlg'), false);
    show($('g-mail'), !!r.emailSignIn);
    SAC.call('/api/me').then(function (me) { show($('g-refused'), !!(me && me.user && !me.user.admin)); }).catch(function () { });
    if (r.google && !gate.gis) {
      gate.gis = true; var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = function () {
        try {
          window.google.accounts.id.initialize({ client_id: r.google, callback: function (g) { SAC.call('/api/auth/google', { credential: g.credential }).then(function (a) { if (a.error) fail(a.error); else boot(); }); } });
          window.google.accounts.id.renderButton($('g-google'), { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', width: 300 }); show($('g-google-wrap'), true);
        } catch (e) { show($('g-google-wrap'), false); }
      };
      document.head.appendChild(s);
    }
  }
  $('g-pass').addEventListener('submit', function (ev) {
    ev.preventDefault(); fail('');
    SAC.call('/api/admin/login', { password: $('g-pw').value }).then(function (r) { if (r.error) return fail(r.error); $('g-pw').value = ''; boot(); }, function () { fail('The server did not answer. Try again in a moment.'); });
  });
  $('g-mail').addEventListener('submit', function (ev) {
    ev.preventDefault(); fail('');
    SAC.call('/api/auth/link', { email: $('g-email').value.trim(), back: '/admin' }).then(function (r) {
      if (r.error) return fail(r.error); show($('g-mail-ok'), true); clearInterval(ST.poll);
      ST.poll = setInterval(function () { SAC.call('/api/admin/data').then(function (d) { if (d.status === 200) boot(); else SAC.call('/api/me').then(function (me) { if (me.user && !me.user.admin) { clearInterval(ST.poll); show($('g-refused'), true); } }); }).catch(function () { }); }, 4000);
    }, function () { fail('The server did not answer. Try again in a moment.'); });
  });
  function signOut() { Promise.all([SAC.call('/api/admin/logout', {}), SAC.call('/api/auth/out', {})]).then(function () { show($('g-refused'), false); boot(); }, function () { boot(); }); }
  $('out').onclick = signOut; $('g-out').onclick = signOut;

  /* ---------- the frame ---------- */
  function tabs() {
    var box = $('tabs'); box.textContent = '';
    TABS.forEach(function (t) {
      var b = el('button', '', t[1]); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(ST.tab === t[0])); b.dataset.tab = t[0];
      var n = ST.over && (t[0] === 'reports' ? ST.over.open_reports : t[0] === 'jobs' ? ST.over.failed_jobs : 0); if (n) add(b, el('span', 'n', n));
      b.onclick = function () { go(t[0]); }; box.appendChild(b);
    });
  }
  function go(tab, preset) {
    if (!TABS.some(function (t) { return t[0] === tab; })) tab = 'overview';
    ST.tab = tab; if (preset) ST.args[tab] = Object.assign({ page: 1 }, preset);
    if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
    tabs(); var cur = $('tabs').querySelector('[aria-selected=true]'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    var m = $('main'); m.textContent = ''; window.scrollTo(0, 0);
    VIEWS[tab](m);
  }
  function head(m, title) { var t = el('div', 'top'); add(t, el('h1', '', title)); m.appendChild(t); return t; }
  function refreshCounts() { SAC.call('/api/admin/data').then(function (r) { if (r.status === 200) { ST.over = r; tabs(); } }).catch(function () { }); }

  /* ---------- one list: search + filters + pages ---------- */
  // def: { id, title, tool, noun, search, filters: [{ k, label, opts: [[value, label]], bool }], cols, heads: [..], row(item, reload) -> [{ v, cls }], open(item) }
  function list(m, def) {
    var a = ST.args[def.id] = ST.args[def.id] || { page: 1 }, top = head(m, def.title), bar = el('div', 'bar'), box = el('div', 'list'), pager = el('div', 'pager'), timer = 0, seq = 0;
    box.style.setProperty('--cols', def.cols);
    if (def.search) {
      var s = el('input', 'in q'); s.type = 'search'; s.placeholder = def.search; s.value = a.q || ''; s.setAttribute('aria-label', 'Search ' + def.noun);
      s.oninput = function () { clearTimeout(timer); timer = setTimeout(function () { a.q = s.value.trim(); a.page = 1; load(); }, 280); }; bar.appendChild(s);
    }
    (def.filters || []).forEach(function (f) {
      var lab = el('label', '', f.label), sel = el('select', 'in'); (f.bool ? [['', 'Any'], ['yes', f.yes || 'Yes'], ['no', f.no || 'No']] : f.opts()).forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; sel.appendChild(op); });
      sel.value = a[f.k] === true ? 'yes' : a[f.k] === false ? 'no' : a[f.k] || (f.first || ''); sel.onchange = function () { a[f.k] = f.bool ? (sel.value === 'yes' ? true : sel.value === 'no' ? false : undefined) : sel.value; a.page = 1; load(); };
      add(lab, sel); bar.appendChild(lab);
    });
    add(m, bar, box, pager);
    function load() {
      var args = {}, mine = ++seq; Object.keys(a).forEach(function (k) { if (a[k] !== '' && a[k] !== undefined) args[k] = a[k]; });
      (def.local ? def.local(args) : tool(def.tool, args)).then(function (r) {
        if (mine !== seq) return; box.textContent = '';
        var hd = el('div', 'row head'); def.heads.forEach(function (t) { add(hd, el('div', 'c' + (/^#/.test(t) ? ' num' : ''), t.replace(/^#/, ''))); }); box.appendChild(hd);
        if (!r.items.length) box.appendChild(el('div', 'empty', a.q || Object.keys(args).length > 1 ? 'Nothing matches. Clear the search or the filters.' : 'No ' + def.noun + ' yet.'));
        r.items.forEach(function (it) {
          var row = el('div', 'row' + (def.open ? ' go' : ''));
          def.row(it, load).forEach(function (c, i) { var cell = el('div', 'c ' + (c.cls || '')); cell.dataset.h = def.heads[i].replace(/^#/, ''); add(cell, c.v === '' || c.v === null || c.v === undefined ? el('span', 'sub', '—') : c.v); row.appendChild(cell); });
          if (def.open) { row.tabIndex = 0; row.setAttribute('role', 'button'); row.onclick = function () { def.open(it, load); }; row.onkeydown = function (ev) { if (ev.target === row && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); def.open(it, load); } }; }
          box.appendChild(row);
        });
        pager.textContent = '';
        add(pager, el('span', '', num(r.total) + ' ' + def.noun + (r.pages > 1 ? ' · page ' + r.page + ' of ' + r.pages : '')));
        var nav = el('div'), prev = btn('Previous', 'sm', function () { a.page = r.page - 1; load(); }), next = btn('Next', 'sm', function () { a.page = r.page + 1; load(); }); prev.disabled = r.page <= 1; next.disabled = r.page >= r.pages; add(nav, prev, next); pager.appendChild(nav);
      }).catch(function (e) { if (mine !== seq) return; box.textContent = ''; box.appendChild(el('div', 'empty', e.message)); });
    }
    ST.reload = load; load(); return { top: top, bar: bar, load: load };
  }

  /* ---------- an action: always a reason, then the tool's answer ---------- */
  // o: { title, say, yes, warn, fields: [{ k, label, type, value, min, max, placeholder }], run(values, reason) -> Promise<answer>, after() }
  function ask(o) {
    var form = $('d-form'), extra = $('d-extra'), inputs = {}, done = false, confirmArgs = null, back = document.activeElement;
    $('d-h').textContent = o.title; $('d-say').textContent = o.say || ''; show($('d-say'), !!o.say); extra.textContent = ''; $('d-reason').value = ''; show($('d-err'), false); show($('d-out'), false); show($('d-reason'), true); show($('d-reason-l'), true); show(extra, true);
    $('d-yes').textContent = o.yes || 'Do it'; $('d-yes').className = 'b ' + (o.warn ? 'pri' : 'gold'); $('d-yes').disabled = false; $('d-no').textContent = 'Cancel'; show($('d-no'), true);
    (o.fields || []).forEach(function (f) { var id = 'd-f-' + f.k, lab = el('label', '', f.label), inp = el('input', 'in'); lab.htmlFor = id; inp.id = id; inp.type = f.type || 'text'; if (f.min !== undefined) inp.min = f.min; if (f.max !== undefined) inp.max = f.max; if (f.value !== undefined) inp.value = f.value; if (f.placeholder) inp.placeholder = f.placeholder; inp.required = true; lab.style.display = 'block'; lab.style.margin = '0 0 4px'; inp.style.marginBottom = '6px'; add(extra, lab, inp); inputs[f.k] = inp; });
    show($('dlg'), true); var first = (o.fields && o.fields.length ? inputs[o.fields[0].k] : $('d-reason')); first.focus();
    function close() { show($('dlg'), false); form.onsubmit = null; document.removeEventListener('keydown', esc); if (back && back.focus && document.contains(back)) back.focus(); }
    function esc(ev) { if (ev.key === 'Escape') close(); }
    document.addEventListener('keydown', esc); $('d-no').onclick = close;
    form.onsubmit = function (ev) {
      ev.preventDefault(); if (done) return close();
      var reason = $('d-reason').value.trim(), vals = {}; Object.keys(inputs).forEach(function (k) { vals[k] = inputs[k].type === 'number' ? +inputs[k].value : inputs[k].value.trim(); });
      if (reason.replace(/[^A-Za-z0-9]/g, '').length < 3) { $('d-err').textContent = 'Say why, in a few words.'; show($('d-err'), true); $('d-reason').focus(); return; }
      $('d-yes').disabled = true; show($('d-err'), false);
      o.run(vals, reason, confirmArgs).then(function (r) {
        $('d-yes').disabled = false;
        if (r && r.needs_confirm) {   // a preview first (deleting media): say what it would do, ask once more
          confirmArgs = true; $('d-say').textContent = 'This would ' + r.this_would + '. It cannot be undone.'; show($('d-say'), true); $('d-yes').textContent = 'Yes, delete for good'; $('d-yes').className = 'b pri'; return;
        }
        done = true; var out = $('d-out'); out.textContent = Object.keys(r || {}).filter(function (k) { return k !== 'status'; }).map(function (k) { var v = r[k]; return k.replace(/_/g, ' ') + ': ' + (v && typeof v === 'object' ? JSON.stringify(v) : v); }).join('\n'); show(out, true);
        show($('d-reason'), false); show($('d-reason-l'), false); show(extra, false); show($('d-no'), false); $('d-yes').textContent = 'Close'; $('d-yes').className = 'b gold'; $('d-yes').focus();
        if (o.after) o.after(r); refreshCounts();
      }, function (e) { $('d-yes').disabled = false; $('d-err').textContent = e.message; show($('d-err'), true); });
    };
  }

  /* ---------- the views ---------- */
  var VIEWS = {};

  VIEWS.overview = function (m) {
    var top = head(m, 'Overview'), seg = el('div', 'seg'), body = el('div');
    [7, 30, 90].forEach(function (d) { var b = el('button', '', d + ' days'); b.type = 'button'; b.setAttribute('aria-pressed', String(ST.days === d)); b.onclick = function () { ST.days = d; go('overview'); }; seg.appendChild(b); });
    add(top, seg); m.appendChild(body); body.appendChild(el('div', 'empty', 'Loading…'));
    tool('admin_overview', { days: ST.days }).then(function (o) {
      ST.over = o; tabs(); body.textContent = '';
      var chips = el('div', 'chips');
      [['Open reports', o.open_reports, 'reports', { state: 'open' }], ['Failed jobs', o.failed_jobs, 'jobs', { state: 'failed' }], ['Waiting jobs', o.waiting_jobs, 'jobs', { state: 'queued' }], ['Accounts', o.accounts, 'accounts', {}]].forEach(function (c, i) {
        var b = el('button', 'chip ' + (i < 2 && c[1] ? 'hot' : i === 3 || !c[1] ? 'calm' : '')); b.type = 'button'; add(b, el('b', '', num(c[1])), c[0]); b.onclick = function () { go(c[2], c[3]); }; chips.appendChild(b);
      });
      body.appendChild(chips);
      var tiles = el('div', 'tiles'), R = o.recent, A = o.all_time;
      [['made', 'Carols made'], ['written', 'Written'], ['paid', 'Paid'], ['ready', 'Ready'], ['shared', 'Shared'], ['opened', 'Opened'], ['emailed', 'Emails sent'], ['purchases', 'Purchases'], ['revenue_usd', 'Revenue', 1], ['stripe_fees_usd_estimated', 'Stripe fees (est.)', 1], ['cost_usd', 'Cost', 1], ['margin_usd', 'Margin', 2]].forEach(function (t) {
        var f = t[2] ? usd : num, box = el('div', 'tile' + (t[2] === 1 ? ' money' : t[2] === 2 ? ' margin' : ''));
        add(box, el('div', 'k', t[1]), el('div', 'v' + (t[2] === 2 ? (R[t[0]] < 0 ? ' neg' : ' pos') : ''), f(R[t[0]])), el('div', 'a', 'all time ' + f(A[t[0]]))); tiles.appendChild(box);
      });
      add(body, add(el('h2', 'sec', 'The last ' + o.days + ' days'), el('small', '', 'with the all-time number under each')), tiles);
      var two = el('div', 'two'), left = el('div'), right = el('div');
      var ct = el('div', 'list t3'); ct.style.setProperty('--cols', '1.4fr .6fr .9fr .9fr .8fr .8fr');
      var hd = el('div', 'row head'); ['Kind', '#Calls', '#Tokens in', '#Tokens out', '#Seconds', '#Cost'].forEach(function (t) { add(hd, el('div', 'c' + (/^#/.test(t) ? ' num' : ''), t.replace(/^#/, ''))); }); ct.appendChild(hd);
      var KIND = { text: 'Words (text tokens)', music: 'Music (seconds made)', render: 'Video (render seconds)' }, total = 0;
      if (!o.cost_by_kind.length) ct.appendChild(el('div', 'empty', 'Nothing has cost anything yet.'));
      o.cost_by_kind.forEach(function (c) { total += c.usd; var r = el('div', 'row'); [[KIND[c.kind] || c.kind, 'wide'], [num(c.calls), 'num'], [c.kind === 'text' ? num(c.tokens_in) : '', 'num'], [c.kind === 'text' ? num(c.tokens_out) : '', 'num'], [c.kind === 'text' ? '' : num(c.units), 'num'], [usd(c.usd), 'num']].forEach(function (x, i) { var cell = el('div', 'c ' + x[1], x[0] === '' ? '—' : x[0]); cell.dataset.h = ['Kind', 'Calls', 'Tokens in', 'Tokens out', 'Seconds', 'Cost'][i]; r.appendChild(cell); }); ct.appendChild(r); });
      add(left, add(el('h2', 'sec', 'Cost by kind'), el('small', '', 'all time · ' + usd(Math.round(total * 100) / 100) + ' in all · ' + (o.cost_per_paid_carol_usd === null ? 'no paid carol yet' : usd(o.cost_per_paid_carol_usd) + ' per paid carol'))), ct);
      var pt = el('div', 'list t3'); pt.style.setProperty('--cols', '1fr .7fr .8fr .9fr .9fr');
      hd = el('div', 'row head'); ['Pack', '#Carols', '#Price', '#After Stripe', '#Per carol'].forEach(function (t) { add(hd, el('div', 'c' + (/^#/.test(t) ? ' num' : ''), t.replace(/^#/, ''))); }); pt.appendChild(hd);
      o.packs.forEach(function (p) { var r = el('div', 'row'); [[p.id, ''], [num(p.credits), 'num'], [usd(p.price_usd), 'num'], [usd(p.after_stripe_usd), 'num'], [usd(p.per_carol_usd), 'num']].forEach(function (x, i) { var cell = el('div', 'c ' + x[1], x[0]); cell.dataset.h = ['Pack', 'Carols', 'Price', 'After Stripe', 'Per carol'][i]; r.appendChild(cell); }); pt.appendChild(r); });
      add(right, add(el('h2', 'sec', 'Packs'), el('small', '', 'what each sale leaves')), pt);
      add(two, left, right); body.appendChild(two);
    }).catch(function (e) { body.textContent = ''; body.appendChild(el('div', 'empty', e.message)); });
  };

  function occOpts() { return [['', 'Any']].concat((ST.occ || []).map(function (o) { return [o.id, o.name]; })); }
  function need(what) {   // the occasions and families for the filters, asked once
    var jobs = [];
    if (!ST.occ) jobs.push(tool('admin_occasions', {}).then(function (r) { ST.occ = r.items; }));
    if (what === 'fams' && !ST.fams) jobs.push(SAC.call('/api/templates?per=1').then(function (r) { ST.fams = r.families || []; }));
    return Promise.all(jobs).catch(function () { ST.occ = ST.occ || []; ST.fams = ST.fams || []; });
  }

  VIEWS.carols = function (m) {
    need().then(function () {
      if (ST.tab !== 'carols') return;
      list(m, { id: 'carols', title: 'Carols', tool: 'admin_cards', noun: 'carols', search: 'Title, card name, maker\'s email or id', cols: '2.2fr 1.5fr .8fr 1fr .6fr .6fr 1fr',
        filters: [{ k: 'state', label: 'State', opts: function () { return [['', 'Any'], ['draft', 'Draft'], ['ready', 'Ready'], ['down', 'Down'], ['deleted', 'Deleted']]; } }, { k: 'occasion', label: 'Occasion', opts: occOpts }, { k: 'paid', label: 'Paid', bool: true }],
        heads: ['Carol', 'Maker', 'State', 'Occasion', 'Paid', '#Opens', 'Updated'],
        row: function (c) { return [
          { cls: 'wide', v: add(el('span'), q(c.title) ? add(el('b'), quoted(q(c.title))) : el('span', 'sub', 'untitled'), add(el('span', 'sub'), cardLink(c.card_name, !!c.url), ' · ' + c.template)) },
          { v: c.maker || '' }, { v: add(el('span'), stateTag(c.state), c.why ? el('span', 'sub', c.why) : null) }, { v: c.occasion }, { v: c.paid ? tag('paid', 'ok') : tag('no', 'off') }, { cls: 'num', v: num(c.opens) }, { v: when(c.updated) }]; },
        open: function (c, reload) { openCard(c.id, reload); } });
    });
  };

  function closeDrawer() { show($('drawer'), false); show($('shade'), false); document.removeEventListener('keydown', closeDrawer.esc); }
  closeDrawer.esc = function (ev) { if (ev.key === 'Escape' && $('dlg').hidden) closeDrawer(); };
  $('shade').onclick = closeDrawer;
  function openCard(id, reload) {
    var d = $('drawer'); d.textContent = ''; d.appendChild(el('div', 'empty', 'Loading…')); show(d, true); show($('shade'), true); document.addEventListener('keydown', closeDrawer.esc);
    var again = function () { openCard(id, reload); if (reload) reload(); };
    tool('admin_card', { id: id }).then(function (c) {
      d.textContent = ''; var s = q(c.script) || {}, a = q(c.answers) || {};
      var hd = el('header'), x = btn('Close', 'sm', closeDrawer); add(hd, s.title ? add(el('h2'), quoted(s.title)) : el('h2', '', 'Untitled carol'), x); d.appendChild(hd);
      var kv = el('dl', 'kv'); function row(k, v) { add(kv, el('dt', '', k), add(el('dd'), v)); }
      row('State', add(el('span'), stateTag(c.state), ' ', c.paid ? tag('paid', 'ok') : tag('not paid', 'off'), c.why ? el('span', 'sub', c.why) : null));
      row('Link', cardLink(c.card_name, !!c.url)); row('Maker', c.maker ? add(el('span'), c.maker.email || c.maker.uid, q(c.maker.name) ? add(el('span', 'sub'), quoted(q(c.maker.name))) : null) : 'gone');
      row('Template', c.template + ' · ' + c.occasion); row('Made', when(c.created) + ' · updated ' + when(c.updated)); row('Numbers', num(c.opens) + ' opens · ' + num(c.emails_sent) + ' emails · ' + num(c.photos) + ' photos · ' + num(c.rewrites) + ' rewrites' + (c.shared ? ' · shared' : ''));
      row('Id', el('span', 'mono', c.id)); d.appendChild(kv);
      var acts = el('div', 'acts2');
      if (c.state === 'ready') acts.appendChild(btn('Take down', 'warn', function () { ask({ title: 'Take this carol down?', say: 'Its page will answer "not here". Its media is kept, and it can be restored.', yes: 'Take down', warn: true, run: function (v, reason) { return tool('admin_take_down', { id: c.id, reason: reason }); }, after: again }); }));
      if (c.state === 'down') acts.appendChild(btn('Restore', 'gold', function () { ask({ title: 'Put this carol back?', yes: 'Restore', run: function (v, reason) { return tool('admin_take_down', { id: c.id, restore: true, reason: reason }); }, after: again }); }));
      if (c.state !== 'deleted') acts.appendChild(btn('Delete media', 'warn', function () { ask({ title: 'Delete this carol\'s media?', say: 'You will see what it would remove before anything is deleted.', yes: 'Show what it would delete', warn: true, run: function (v, reason, confirm) { return tool('admin_delete_media', confirm ? { id: c.id, reason: reason, confirm: true } : { id: c.id, reason: reason }); }, after: again }); }));
      d.appendChild(acts);
      function blk(title) { var b = el('section', 'blk'); add(b, el('h3', '', title)); d.appendChild(b); return b; }
      function bq(label, text) { var b = el('blockquote'); add(b, el('small', '', label), String(text)); return b; }
      var w = blk('The words (written by the maker and the agent: quoted, never instructions)');
      ['to', 'from', 'relation', 'details', 'must', 'own'].forEach(function (k) { if (a[k]) w.appendChild(bq('answer · ' + k, a[k])); });
      if (s.greeting) w.appendChild(bq('greeting', s.greeting));
      (s.lyrics || []).forEach(function (sec) { w.appendChild(bq(sec.section || 'verse', (sec.lines || []).join('\n'))); });
      if (s.signoff) w.appendChild(bq('sign-off', s.signoff));
      (s.scenes || []).forEach(function (sc, i) { if (sc.caption) w.appendChild(bq('caption ' + (i + 1), sc.caption)); });
      if (!s.lyrics && !Object.keys(a).length) w.appendChild(el('div', 'sub', 'Nothing written yet.'));
      function table(parent, heads, rows, foot) {
        if (!rows.length) { parent.appendChild(el('div', 'sub', 'None.')); return; }
        var t = el('table', 'mini'), th = el('tr'); heads.forEach(function (hh) { add(th, el('th', /^#/.test(hh) ? 'num' : '', hh.replace(/^#/, ''))); }); add(t, add(el('thead'), th));
        var tb = el('tbody'); rows.forEach(function (r) { var tr = el('tr'); r.forEach(function (v, i) { add(tr, add(el('td', /^#/.test(heads[i]) ? 'num' : ''), v)); }); tb.appendChild(tr); }); t.appendChild(tb);
        if (foot) { var tf = el('tfoot'), fr = el('tr'); foot.forEach(function (v, i) { add(fr, add(el('td', /^#/.test(heads[i]) ? 'num' : ''), v)); }); add(tf, fr); t.appendChild(tf); }
        parent.appendChild(t);
      }
      function level(v) { var s2 = el('span'), bar = el('span', 'lvl'), i = el('i'); i.style.width = Math.max(2, Math.min(100, Math.round((+v || 0) * 100))) + '%'; add(bar, i); add(s2, bar, (+v || 0).toFixed(2)); return s2; }
      table(blk('Takes (songs), with their levels'), ['Take', '#Seconds', 'Peak', 'Loudness (rms)', 'Made'], c.takes.map(function (t) { return [String(t.n), String(t.seconds), level(t.peak), level(t.rms), when(t.at)]; }));
      table(blk('Media'), ['Kind', '#Size', 'Made'], c.media.map(function (x) { return [x.kind, (x.bytes / 1048576).toFixed(2) + ' MB', when(x.at)]; }));
      table(blk('Jobs'), ['Job', 'State', 'Stage', '#Tries', 'Error', 'Updated'], c.jobs.map(function (j) { return [j.kind, stateTag(j.state), j.stage + (j.pct ? ' ' + j.pct + '%' : ''), String(j.tries || 0), j.error || '', when(j.updated)]; }));
      table(blk('Reports'), ['When', 'Why', 'They said', 'State'], c.reports.map(function (r) { return [when(r.at), r.why, r.said ? quoted(r.said) : '', stateTag(r.state)]; }));
      var KIND = { text: 'words', music: 'music', render: 'video' };
      table(blk('What it cost us, line by line'), ['When', 'Kind', 'Detail', '#Tokens in / out', '#Seconds', '#Cost'], c.cost.lines.map(function (l) { return [when(l.at), KIND[l.kind] || l.kind, l.detail || '', l.kind === 'text' ? num(l.tokens_in) + ' / ' + num(l.tokens_out) : '', l.units ? String(Math.round(l.units * 10) / 10) : '', usd(l.usd)]; }), ['Total', '', '', '', '', usd(c.cost.total_usd)]);
      var mg = blk('Margin by pack');
      if (!c.cost.margin_usd_by_pack.length) mg.appendChild(el('div', 'sub', 'Not paid: no credit was spent on this carol.'));
      else table(mg, ['Bought in pack', '#A credit brings', '#Cost', '#Margin'], c.cost.margin_usd_by_pack.map(function (p) { return [p.pack, usd(p.a_credit_brings_usd), usd(c.cost.total_usd), add(el('b'), usd(p.margin_usd))]; }));
      x.focus();
    }).catch(function (e) { d.textContent = ''; add(d, el('div', 'empty', e.message), btn('Close', '', closeDrawer)); });
  }

  VIEWS.accounts = function (m) {
    list(m, { id: 'accounts', title: 'Accounts', tool: 'admin_accounts', noun: 'accounts', search: 'Email, name or id', cols: '2.2fr 1fr .6fr .6fr .7fr 1fr 1.7fr',
      filters: [{ k: 'banned', label: 'Banned', bool: true }, { k: 'paid', label: 'Has paid', bool: true }],
      heads: ['Account', 'Joined', '#Credits', '#Carols', '#Spent', 'Flags', 'Actions'],
      row: function (u, reload) { return [
        { cls: 'wide', v: add(el('span'), el('b', '', u.email || u.uid), q(u.name) ? add(el('span', 'sub'), quoted(q(u.name))) : null) }, { v: when(u.created) }, { cls: 'num', v: num(u.credits) }, { cls: 'num', v: num(u.carols) }, { cls: 'num', v: usd(u.spent_usd) },
        { v: add(el('span'), u.paid ? tag('paid', 'ok') : null, u.banned ? tag('banned', 'bad') : null, u.banned && u.why ? el('span', 'sub', u.why) : null, !u.paid && !u.banned ? el('span', 'sub', '—') : null) },
        { cls: 'acts', v: add(el('span', 'inl'),
          btn('Grant credits', 'sm', function () { ask({ title: 'Grant credits to ' + (u.email || u.uid), say: 'Carol credits only, never money. A negative number takes unused credits away.', yes: 'Grant', fields: [{ k: 'credits', label: 'Credits (1 to 50)', type: 'number', min: -50, max: 50, value: 1 }], run: function (v, reason) { return tool('admin_grant', { uid: u.uid, credits: v.credits, reason: reason }); }, after: reload }); }),
          u.banned ? btn('Lift ban', 'sm', function () { ask({ title: 'Lift the ban on ' + (u.email || u.uid) + '?', say: 'Its cards stay down until restored one by one.', yes: 'Lift ban', run: function (v, reason) { return tool('admin_ban', { uid: u.uid, lift: true, reason: reason }); }, after: reload }); })
            : btn('Ban', 'sm warn', function () { ask({ title: 'Close the account ' + (u.email || u.uid) + '?', say: 'It can no longer make, buy or send, and its ready cards are taken down.', yes: 'Ban', warn: true, run: function (v, reason) { return tool('admin_ban', { uid: u.uid, reason: reason }); }, after: reload }); })) }]; } });
  };

  var WHY = { 'not-ok': 'Not OK', me: 'I am in it', spam: 'Spam', other: 'Other' };
  VIEWS.reports = function (m) {
    list(m, { id: 'reports', title: 'Reports', tool: 'admin_reports', noun: 'reports', search: 'What they said, or the card name', cols: '.9fr .8fr 2fr 1.5fr .6fr 2.4fr',
      filters: [{ k: 'state', label: 'State', first: 'open', opts: function () { return [['open', 'Open'], ['done', 'Done'], ['all', 'All']]; } }],
      heads: ['When', 'Why', 'They said', 'Card', 'State', 'Actions'],
      row: function (r, reload) { return [
        { v: when(r.at) }, { v: tag(WHY[r.why] || r.why, r.why === 'me' || r.why === 'not-ok' ? 'bad' : '') }, { cls: 'wide', v: q(r.said) ? quoted(q(r.said)) : el('span', 'sub', 'nothing added') },
        { cls: 'wide', v: add(el('span'), cardLink(r.card_name, r.card_state === 'ready'), add(el('span', 'sub'), q(r.title) ? quoted(q(r.title)) : 'untitled', ' · ' + (r.card_state || 'gone'))) }, { v: stateTag(r.state) },
        { cls: 'acts', v: add(el('span', 'inl'), btn('Carol', 'sm', function () { if (r.card) openCard(r.card, reload); }),
          r.state === 'open' ? btn('Close', 'sm', function () { ask({ title: 'Close this report', say: 'Say what was done about it.', yes: 'Close report', run: function (v, reason) { return tool('admin_report', { id: r.id, reason: reason }); }, after: reload }); }) : null,
          r.card_state === 'ready' ? btn('Take the card down', 'sm warn', function () { ask({ title: 'Take /' + r.card_name + ' down?', say: 'Its page will answer "not here". Its media is kept.', yes: 'Take down', warn: true, run: function (v, reason) { return tool('admin_take_down', { id: r.card, reason: reason }); }, after: reload }); }) : null) }]; } });
  };

  VIEWS.jobs = function (m) {
    list(m, { id: 'jobs', title: 'Jobs', tool: 'admin_jobs', noun: 'jobs', search: 'A job id, a carol id, or words from the error', cols: '.7fr .8fr 1fr .5fr 2.4fr 1fr 1fr 1.3fr',
      filters: [{ k: 'state', label: 'State', opts: function () { return [['', 'Any'], ['queued', 'Queued'], ['running', 'Running'], ['failed', 'Failed'], ['done', 'Done']]; } }, { k: 'kind', label: 'Kind', opts: function () { return [['', 'Any'], ['song', 'Song'], ['render', 'Video']]; } }, { k: 'stuck', label: 'Stuck 10 min+', bool: true, yes: 'Only stuck', no: 'Any' }],
      heads: ['Kind', 'State', 'Stage', '#Tries', 'Error', 'Started', 'Updated', 'Actions'],
      row: function (j, reload) { return [
        { v: add(el('span'), el('b', '', j.kind === 'render' ? 'video' : j.kind), el('span', 'sub mono', j.id)) }, { v: stateTag(j.state) }, { v: j.stage + (j.pct && j.state !== 'done' ? ' ' + j.pct + '%' : '') }, { cls: 'num', v: num(j.tries) }, { cls: 'wide', v: j.error ? el('span', '', j.error) : '' }, { v: when(j.created) }, { v: when(j.updated) },
        { cls: 'acts', v: add(el('span', 'inl'), btn('Carol', 'sm', function () { openCard(j.card, reload); }), j.state !== 'done' ? btn('Retry', 'sm gold', function () { ask({ title: 'Put this ' + (j.kind === 'render' ? 'video' : 'song') + ' job back in the queue?', say: 'A song that was already made is not paid for again.', yes: 'Retry', run: function (v, reason) { return tool('admin_retry_job', { id: j.id, reason: reason }); }, after: reload }); }) : null) }]; } });
  };

  VIEWS.templates = function (m) {
    need('fams').then(function () {
      if (ST.tab !== 'templates') return;
      list(m, { id: 'templates', title: 'Templates', tool: 'admin_templates', noun: 'templates', search: 'Name, id or family', cols: '1.1fr 2fr 1fr 1.2fr .6fr .6fr .8fr',
        filters: [{ k: 'occasion', label: 'Occasion', opts: occOpts }, { k: 'family', label: 'Family', opts: function () { return [['', 'Any']].concat((ST.fams || []).map(function (f) { return [f.id, f.name]; })); } }, { k: 'off', label: 'In the gallery', bool: true, yes: 'Off', no: 'On' }],
        heads: ['Order', 'Template', 'Occasion', 'Family', '#Carols', '#Paid', 'On'],
        row: function (t, reload) {
          var ord = el('input', 'in'); ord.type = 'number'; ord.value = t.order; ord.setAttribute('aria-label', 'Order of ' + t.name);
          var sw = el('button', 'sw'); sw.type = 'button'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', String(!t.off)); sw.setAttribute('aria-label', t.name + ' in the gallery');
          sw.onclick = function () { ask({ title: 'Switch "' + t.name + '" ' + (t.off ? 'on' : 'off') + '?', say: t.off ? 'It will show in the gallery again.' : 'It leaves the gallery. Carols already made with it keep working.', yes: t.off ? 'Switch on' : 'Switch off', warn: !t.off, run: function (v, reason) { return tool('admin_template', { id: t.id, off: !t.off, reason: reason }); }, after: reload }); };
          return [{ v: add(el('span', 'inl'), ord, btn('Set', 'sm', function () { ask({ title: 'Move "' + t.name + '" to place ' + (+ord.value) + '?', say: 'Lower numbers come first in the gallery.', yes: 'Set order', run: function (v, reason) { return tool('admin_template', { id: t.id, order: +ord.value, reason: reason }); }, after: reload }); })) },
            { cls: 'wide', v: add(el('span'), el('b', '', t.name), el('span', 'sub mono', t.id)) }, { v: t.occasion }, { v: t.family }, { cls: 'num', v: num(t.carols) }, { cls: 'num', v: num(t.paid) }, { v: add(el('span', 'inl'), sw, el('span', 'sub', t.off ? 'off' : 'on')) }];
        } });
    });
  };

  VIEWS.occasions = function (m) {
    var today = '';
    var L = list(m, { id: 'occasions', title: 'Occasions', noun: 'occasions', search: 'Name or id', cols: '1.8fr 1.1fr 2.6fr .7fr',
      filters: [{ k: 'state', label: 'State', opts: function () { return [['', 'Any'], ['live', 'Live'], ['soon', 'Soon'], ['off', 'Off']]; } }],
      heads: ['Occasion', 'State', 'Featured (MM-DD to MM-DD)', '#Templates'],
      local: function (a) {   // the tool answers them all at once: searched, filtered and paged here
        return tool('admin_occasions', {}).then(function (r) {
          ST.occ = r.items; today = r.featured_today; var text = (a.q || '').toLowerCase(), items = r.items.filter(function (o) { return (!text || (o.id + ' ' + o.name).toLowerCase().indexOf(text) >= 0) && (!a.state || o.state === a.state); });
          var pages = Math.max(1, Math.ceil(items.length / 20)), page = Math.max(1, Math.min(pages, a.page || 1)); note.textContent = 'Featured today: ' + (r.featured_today || 'none') + '. When no occasion is featured by its dates, the site leads with "' + r.default_when_none + '".';
          return { items: items.slice((page - 1) * 20, page * 20), total: items.length, page: page, pages: pages };
        });
      },
      row: function (o, reload) {
        var sel = el('select', 'in'); ['live', 'soon', 'off'].forEach(function (s) { var op = el('option', '', s); op.value = s; sel.appendChild(op); }); sel.value = o.state; sel.setAttribute('aria-label', 'State of ' + o.name); sel.style.width = 'auto';
        sel.onchange = function () { var to = sel.value; sel.value = o.state; ask({ title: 'Set "' + o.name + '" to ' + to + '?', say: to === 'live' ? 'People can make carols for it.' : to === 'soon' ? 'It is listed as coming soon.' : 'It is hidden.', yes: 'Set to ' + to, warn: to === 'off', run: function (v, reason) { return tool('admin_occasion', { id: o.id, state: to, reason: reason }); }, after: reload }); };
        var f = o.featured || [], from = el('input', 'in'), to2 = el('input', 'in'); from.placeholder = 'MM-DD'; to2.placeholder = 'MM-DD'; from.value = f[0] || ''; to2.value = f[1] || ''; from.maxLength = 5; to2.maxLength = 5; from.setAttribute('aria-label', 'Featured from'); to2.setAttribute('aria-label', 'Featured to');
        return [{ cls: 'wide', v: add(el('span'), el('b', '', o.name), ' ', o.now || o.id === today ? tag('featured today', 'warn') : null, el('span', 'sub mono', o.id)) }, { v: sel },
          { cls: 'wide', v: add(el('span', 'inl'), from, el('span', 'sub', 'to'), to2,
            btn('Set', 'sm', function () { ask({ title: 'Feature "' + o.name + '" from ' + from.value + ' to ' + to2.value + '?', say: 'The landing page follows the featured occasion.', yes: 'Set dates', run: function (v, reason) { return tool('admin_occasion', { id: o.id, from: from.value.trim(), to: to2.value.trim(), reason: reason }); }, after: reload }); }),
            o.featured ? btn('None', 'sm', function () { ask({ title: 'Stop featuring "' + o.name + '"?', yes: 'Clear dates', run: function (v, reason) { return tool('admin_occasion', { id: o.id, clear: true, reason: reason }); }, after: reload }); }) : el('span', 'sub', 'not featured')) },
          { cls: 'num', v: num(o.templates) }];
      } });
    var note = el('p', 'sub'); note.style.cssText = 'color:var(--dim);margin:0 0 12px'; m.insertBefore(note, L.bar);
  };

  VIEWS.prices = function (m) {
    head(m, 'Prices & limits'); var body = el('div'); m.appendChild(body);
    function load() {
      tool('admin_prices', {}).then(function (p) {
        body.textContent = '';
        var pt = el('div', 'list'); pt.style.setProperty('--cols', '1fr 1fr 1fr 1fr');
        var hd = el('div', 'row head'); ['Pack', '#Carols', '#Price', 'Can be bought'].forEach(function (t) { add(hd, el('div', 'c' + (/^#/.test(t) ? ' num' : ''), t.replace(/^#/, ''))); }); pt.appendChild(hd);
        p.packs.forEach(function (k) { var r = el('div', 'row'); [[k.id, ''], [num(k.credits), 'num'], [k.price_usd === null ? 'coming soon' : usd(k.price_usd), 'num'], [k.buyable ? tag('yes', 'ok') : tag('no', 'off'), '']].forEach(function (x, i) { var cell = el('div', 'c ' + x[1]); cell.dataset.h = ['Pack', 'Carols', 'Price', 'Can be bought'][i]; add(cell, x[0]); r.appendChild(cell); }); pt.appendChild(r); });
        var n1 = el('p', ''); n1.style.cssText = 'color:var(--dim);margin:8px 2px 22px'; n1.textContent = 'Prices are read-only here: they are set in ' + p.prices_are_set_in + '. Currency: ' + String(p.currency).toUpperCase() + '. Every buy button says: "' + p.every_buy_says + '"';
        add(body, add(el('h2', 'sec', 'Packs')), pt, n1);
        var lt = el('div', 'list'); lt.style.setProperty('--cols', '1.6fr .8fr .9fr 2fr');
        hd = el('div', 'row head'); ['Limit', '#config.js', '#Now', 'Override'].forEach(function (t) { add(hd, el('div', 'c' + (/^#/.test(t) ? ' num' : ''), t.replace(/^#/, ''))); }); lt.appendChild(hd);
        p.limits.forEach(function (l) {
          var r = el('div', 'row'), inp = el('input', 'in'); inp.type = 'number'; inp.min = 0; inp.placeholder = String(l.config); if (l.overridden) inp.value = l.value; inp.setAttribute('aria-label', 'Override ' + l.name); inp.style.width = '110px';
          var cells = [[add(el('span'), el('b', 'mono', l.name)), 'wide'], [num(l.config), 'num'], [add(el('span'), num(l.value), l.overridden ? add(el('span'), ' ', tag('overridden', 'warn')) : null), 'num'],
            [add(el('span', 'inl'), inp, btn('Set', 'sm', function () { if (inp.value === '') return toast('Type a number first.'); ask({ title: 'Set ' + l.name + ' to ' + (+inp.value) + '?', say: 'config.js says ' + l.config + '. The override holds until it is reset.', yes: 'Set limit', run: function (v, reason) { return tool('admin_limit', { name: l.name, value: +inp.value, reason: reason }); }, after: load }); }),
              l.overridden ? btn('Reset', 'sm', function () { ask({ title: 'Put ' + l.name + ' back to ' + l.config + '?', yes: 'Reset', run: function (v, reason) { return tool('admin_limit', { name: l.name, reset: true, reason: reason }); }, after: load }); }) : null), 'wide']];
          cells.forEach(function (x, i) { var cell = el('div', 'c ' + x[1]); cell.dataset.h = ['Limit', 'config.js', 'Now', 'Override'][i]; add(cell, x[0]); r.appendChild(cell); }); lt.appendChild(r);
        });
        add(body, add(el('h2', 'sec', 'Limits'), el('small', '', 'config.js gives the value; an override here wins until it is reset')), lt);
      }).catch(function (e) { body.textContent = ''; body.appendChild(el('div', 'empty', e.message)); });
    }
    load();
  };

  VIEWS.audit = function (m) {
    list(m, { id: 'audit', title: 'Audit', tool: 'admin_audit', noun: 'actions', search: 'Reason, arguments or who', cols: '1fr 1.1fr 1.2fr 2fr 2fr 2fr',
      filters: [{ k: 'tool', label: 'Action', opts: function () { return [['', 'Any']].concat(ACTIONS.map(function (t) { return [t, t.replace(/^admin_/, '').replace(/_/g, ' ')]; })); } }],
      heads: ['When', 'Who', 'Action', 'On', 'Reason', 'Answer'],
      row: function (a) { return [{ v: when(a.at) }, { v: add(el('span'), a.who, el('span', 'sub', 'via ' + a.via)) }, { v: tag(String(a.tool).replace(/^admin_/, '').replace(/_/g, ' ')) }, { cls: 'wide', v: el('span', 'mono', a.args) }, { cls: 'wide', v: quoted(a.reason) }, { cls: 'wide', v: el('span', 'mono sub', a.result) }]; } });
  };

  window.addEventListener('hashchange', function () { var t = (location.hash || '').slice(1); if (!$('app').hidden && t && t !== ST.tab) go(t); });
  boot();
})();
