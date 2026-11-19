'use strict';
// connect.js : THE CONNECTOR. The product as a set of tools for a person's own Claude, at /mcp: they add it in
// Claude, sign in with the account their carols are in (oauth.js), and can then make a carol by talking: pick a look,
// say who it is for, have the words written (by the product's writer, or by their own Claude: connect-rules.js holds
// those to the same rules), add photos on the product's own upload page, have the song made, share the card.
//
// ONE DOOR. Whatever the site's own pages can do, a tool does by asking the site's own API in this process, as that
// person (ask() below): the same checks, the same limits per account per day, the same credits, the same emails and
// "don't email me again" list, whichever door somebody comes through. Nothing here spends, sends or deletes by a
// path of its own. What the pages cannot do (lines written by somebody's own Claude, a music direction set by hand)
// is checked in connect-rules.js and saved through the server's own saveDoc.
//
// WHAT IS HELD HERE, IN CODE: a token reaches only its own person's carols; spending a credit, emailing people,
// taking a card down and deleting need confirm: true (without it the tool says what would happen and does nothing);
// the connector never takes payment and never gives credits; photos come in only through the upload page and its
// rights tick; no answer holds another person's address, a recipient's address, a storage key or a secret; the
// admin's tools are not here at all (they stay at /mcp?admin=<key>, server.js).
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { Readable, Writable } = require('stream');
const Rules = require('./connect-rules.js'), UI = require('./connect-ui.js'), OAuth = require('./oauth.js'), Lib = require('./library/index.js');

module.exports = function (d) {
  // d = { db, ready, CFG, env, root, build, handle, sessionCookie, accountOf, tooMany, page, mail, Templates, Engine, Render,
  //       occasions, tplOff, limit, spendDay, freeSlug, slugify, docOf, saveDoc, locked, note, balance, str }
  const db = d.db, CFG = d.CFG, SITE = CFG.site, NAME = CFG.name, env = d.env, Templates = d.Templates, str = d.str;
  const oauth = OAuth({ db: db, ready: d.ready, site: SITE, name: NAME, env: env, tooMany: d.tooMany, accountOf: d.accountOf, page: d.page, emailOn: function () { return d.mail.on(); } });
  const fail = function (msg, code, more) { return Object.assign(new Error(msg), { code: code || 400, said: true }, more); };
  const CARD = /^[A-Za-z0-9]{6,40}$/, PID = /^[A-Za-z0-9]{2,40}$/, UPLOAD_MINUTES = 30, VIEW_MINUTES = 120;
  const money = function (cents) { return '$' + (cents / 100).toFixed(2); }, plural = function (n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }, people = function (n) { return n === 1 ? '1 person' : n + ' people'; };

  // ---------- asking the site, as this person, in this process (no port, no network) ----------
  function ask(uid, method, url, body, more) {
    return new Promise(function (done) {
      const data = body == null ? null : Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body)), req = Readable.from(data ? [data] : []);
      Object.assign(req, { method: method, url: url, headers: Object.assign({ cookie: d.sessionCookie(uid).split(';')[0], 'content-type': 'application/json' }, data ? { 'content-length': String(data.length) } : {}, more) });
      const parts = [], res = new Writable({ write: function (c, e, next) { parts.push(Buffer.from(c)); next(); } });
      Object.assign(res, { status: 200, heads: {}, headersSent: false, setHeader: function (k, v) { this.heads[String(k).toLowerCase()] = v; }, getHeader: function (k) { return this.heads[String(k).toLowerCase()]; }, writeHead: function (c) { this.status = c; this.headersSent = true; return this; } });
      res.on('finish', function () { let j = null; try { j = JSON.parse(Buffer.concat(parts).toString()); } catch (e) { j = null; } done({ status: res.status, json: j || {} }); });
      d.handle(req, res);
    });
  }
  // the same, where anything but a 200 is the site's own sentence, given back as it is
  async function site(who, method, url, body) {
    const r = await ask(who.user.id, method, url, body, who.ip ? { 'fly-client-ip': who.ip } : {});
    if (r.status !== 200) throw fail(r.json.error || 'That did not work. Try again.', r.status >= 400 && r.status < 500 ? r.status : 502, { need: r.json.need });
    return r.json;
  }
  // a request that carries somebody else's stream or answer through to the site (photos and songs are sent as they are)
  function pass(uid, req, res, url, more) {
    const inner = Readable.from([]); Object.assign(inner, { method: 'GET', url: url, headers: Object.assign({ cookie: d.sessionCookie(uid).split(';')[0] }, req.headers.range ? { range: req.headers.range } : {}, more) });
    d.handle(inner, res);
  }

  // ---------- links that are good for a while, for one carol: the upload page ('u') and the preview and its media ('v') ----------
  const mac = function (s) { return crypto.createHmac('sha256', 'connect|' + String(env.SESSION_SECRET || '')).update(s).digest('base64url').slice(0, 32); };
  const seal = function (kind, card, minutes) { const b = Buffer.from(JSON.stringify([kind, card, Date.now() + minutes * 6e4])).toString('base64url'); return b + '.' + mac(b); };
  // -> { kind, row, uid } when the link is one of ours, for one of these kinds, not run out, and its carol is still there
  async function unseal(token, kinds) {
    const p = String(token || '').split('.');
    if (!env.SESSION_SECRET || p.length !== 2 || p[0].length > 200) return null;
    const want = Buffer.from(mac(p[0])), got = Buffer.from(p[1]);
    if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
    let v; try { v = JSON.parse(Buffer.from(p[0], 'base64url').toString()); } catch (e) { return null; }
    if (!Array.isArray(v) || kinds.indexOf(v[0]) < 0 || !(v[2] > Date.now()) || !CARD.test(String(v[1]))) return null;
    const row = await db.get('SELECT id, uid, state FROM cards WHERE id = ?', [v[1]]);
    if (!row || row.state === 'deleted') return null;
    const u = await db.get('SELECT banned FROM users WHERE id = ?', [row.uid]);
    return u && !u.banned ? { kind: v[0], row: row, uid: row.uid } : null;
  }

  // ---------- templates: always searched and paged, however many there are ----------
  let IDX = null;
  function index() {
    // the launch 33 (templates.js) and then the library's thousands (library/), as one list of template-like rows
    const lib = Lib.rows(), list = (Templates.list || []).concat(lib.map(function (r) { return { id: r.id, name: r.name, occasion: r.occ, family: r.fam, blurb: r.blurb, tone: r.tone, tags: r.tags, order: 1000 + (r.n || 0) }; }));
    if (IDX && IDX.lib === lib && IDX.n === list.length) return IDX.rows;
    const fam = {}; (Templates.families || []).concat(Lib.families()).forEach(function (f) { if (f && f.id) fam[f.id] = f.name; });
    const rows = list.map(function (t, i) {
      return { t: t, i: i, family: fam[t.family] || t.family || '', order: typeof t.order === 'number' ? t.order : 500, strong: Rules.norm([t.id, t.name, t.family, fam[t.family] || '', t.occasion].concat(t.tags || []).join(' ')), weak: Rules.norm((t.blurb || '') + ' ' + (t.tone || '')) };
    });
    IDX = { lib: lib, n: list.length, rows: rows }; return rows;
  }
  const liveOccasions = function () { const o = {}; d.occasions().list.forEach(function (x) { if (x.state === 'live') o[x.id] = x; }); return o; };
  const liveRows = function () { const live = liveOccasions(); return index().filter(function (r) { return live[r.t.occasion] && !d.tplOff(r.t.id); }); };
  const liveTemplate = function (id) { const t = Templates.get(str(id, 80)); return t && !d.tplOff(t.id) && liveOccasions()[t.occasion] ? t : null; };
  const wordsOf = function (s) { return Rules.norm(str(s, 300)).trim().split(' ').filter(function (w) { return w.length > 1; }).slice(0, 16); };
  const hit = function (hay, w) { return hay.indexOf(' ' + w) >= 0; };
  const short = function (r) { const t = r.t; return { id: t.id, name: t.name, occasion: t.occasion, style: r.family, blurb: str(t.blurb, 200), tags: (t.tags || []).slice(0, 8), tempo_bpm: t.music && t.music.bpm || undefined }; };
  function findTemplates(a) {
    let rows = liveRows();
    const occ = str(a.occasion, 40), style = Rules.norm(str(a.style, 60)).trim(), must = wordsOf(a.tone).concat(wordsOf(a.audience)), words = wordsOf(a.q), per = Math.max(1, Math.min(20, Math.floor(+a.per) || 8));
    if (occ) rows = rows.filter(function (r) { return r.t.occasion === occ; });
    const styles = {}; rows.forEach(function (r) { styles[r.t.family] = r.family; });
    if (style) rows = rows.filter(function (r) { return r.t.family === style.replace(/ /g, '-') || Rules.norm(r.family).trim() === style || hit(Rules.norm(r.family), style); });
    if (must.length) rows = rows.filter(function (r) { return must.every(function (w) { return hit(r.strong, w) || hit(r.weak, w); }); });
    const score = function (r) { let n = 0, all = true; words.forEach(function (w) { if (hit(r.strong, w)) n += 3; else if (hit(r.weak, w)) n += 1; else all = false; }); return { r: r, n: n, all: all }; };
    let scored = rows.map(score), closest = false;
    if (words.length) { const full = scored.filter(function (x) { return x.all; }); if (full.length) scored = full; else { scored = scored.filter(function (x) { return x.n > 0; }); closest = scored.length > 0; } }
    scored.sort(function (x, y) { return y.n - x.n || x.r.order - y.r.order || x.r.i - y.r.i; });
    const total = scored.length, pages = Math.max(1, Math.ceil(total / per)), page = Math.max(1, Math.min(pages, Math.floor(+a.page) || 1)), names = Object.keys(styles);
    return { items: scored.slice((page - 1) * per, page * per).map(function (x) { return short(x.r); }), total: total, page: page, pages: pages, per: per,
      note: !total ? 'Nothing matched. Try fewer or other words, or leave q out and filter by occasion.' : closest ? 'No template has every word; these are the closest.' : undefined,
      styles: names.slice(0, 30).map(function (k) { return { id: k, name: styles[k] }; }), more_styles: names.length > 30 ? names.length - 30 : undefined };
  }
  // from who it is for and the mood: three looks, with why
  const ALSO = { mom: ['mother', 'mum', 'family', 'cozy'], mum: ['mother', 'mom', 'family', 'cozy'], mother: ['mom', 'family', 'cozy'], dad: ['father', 'family'], father: ['dad', 'family'], parents: ['family', 'cozy'], grandma: ['grandparents', 'nana'], grandmother: ['grandma', 'grandparents'], nana: ['grandma', 'grandparents'], grandpa: ['grandparents'], grandfather: ['grandpa', 'grandparents'],
    wife: ['romantic', 'love', 'couple'], husband: ['romantic', 'love', 'couple'], girlfriend: ['romantic', 'love', 'couple'], boyfriend: ['romantic', 'love', 'couple'], partner: ['romantic', 'love', 'couple'], fiance: ['romantic', 'love'], fiancee: ['romantic', 'love'], crush: ['love', 'sweet'],
    son: ['kids', 'children'], daughter: ['kids', 'children'], kid: ['kids', 'children'], child: ['kids', 'children'], niece: ['kids'], nephew: ['kids'], grandson: ['kids'], granddaughter: ['kids'], baby: ['newborn', 'lullaby'], sister: ['family', 'friends', 'party'], brother: ['family', 'friends', 'party'], sibling: ['family', 'friends'],
    friend: ['friends', 'party'], bestie: ['friends', 'besties'], roommate: ['friends', 'roommates'], boss: ['work', 'office'], coworker: ['work', 'office', 'team'], colleague: ['work', 'colleagues', 'team'], team: ['work', 'office'], client: ['clients', 'work'], customer: ['clients', 'customers'], teacher: ['teacher', 'thank'], coach: ['coach', 'thank'], nurse: ['nurse', 'thank'],
    dog: ['pets', 'puppy'], cat: ['pets', 'kitten'], pet: ['pets'], funny: ['goofy', 'fun', 'silly'], silly: ['funny', 'goofy'], goofy: ['funny'], hilarious: ['funny', 'goofy'], playful: ['funny', 'fun', 'bright'], sweet: ['cozy', 'gentle', 'warm'], heartfelt: ['cozy', 'warm', 'gentle', 'nostalgia'], warm: ['cozy'], sentimental: ['nostalgia', 'memories', 'cozy'], cozy: ['family', 'warm'],
    elegant: ['classic', 'gold'], classy: ['elegant', 'classic'], romantic: ['love', 'couple'], religious: ['faith', 'church'], christian: ['faith'], church: ['faith'], upbeat: ['party', 'dance', 'bright'], party: ['dance', 'confetti'], retro: ['vintage'], nostalgic: ['retro', 'vintage', 'memories'], far: ['far away', 'missing you'], abroad: ['far away'], deployed: ['far away'], graduation: ['graduate'], promotion: ['congrats'], marathon: ['medal', 'champion', 'achievement'], race: ['medal', 'champion'], win: ['trophy', 'champion'], won: ['trophy', 'champion'] };
  function guessOccasion(a) {
    const live = liveOccasions(), given = str(a.occasion, 60).toLowerCase(); if (live[given]) return given;
    const text = Rules.norm([a.occasion, a.mood, a.details, a.relationship].join(' ')), by = [['christmas', ['christmas', 'xmas', 'holiday', 'holidays', 'noel']], ['birthday', ['birthday', 'bday', 'turning', 'turns']], ['love', ['valentine', 'valentines', 'anniversary', 'love you', 'romantic']], ['thanks', ['thank', 'thanks', 'grateful', 'gratitude']], ['congrats', ['congratulations', 'congrats', 'graduation', 'graduated', 'promotion', 'new job', 'marathon', 'won', 'retirement']]];
    for (const o of Object.keys(live)) if (hit(text, Rules.norm(live[o].name).trim()) || hit(text, o)) return o;
    for (const b of by) if (live[b[0]] && b[1].some(function (w) { return hit(text, w); })) return b[0];
    return '';
  }
  function suggest(a) {
    const occ = guessOccasion(a) || d.occasions().featured, said = wordsOf([a.relationship, a.mood, a.details].join(' ')), want = {};
    said.forEach(function (w) { want[w] = w; (ALSO[w] || ALSO[w.replace(/s$/, '')] || []).forEach(function (x) { if (!want[x]) want[x] = w; }); });
    const rows = liveRows().filter(function (r) { return r.t.occasion === occ; }), scored = rows.map(function (r) { const why = {}; let n = 0; Object.keys(want).forEach(function (w) { if (hit(r.strong, w)) { n += want[w] === w ? 3 : 2; why[want[w]] = 1; } else if (hit(r.weak, w)) { n += 1; why[want[w]] = 1; } }); return { r: r, n: n, why: Object.keys(why) }; })
      .sort(function (x, y) { return y.n - x.n || x.r.order - y.r.order || x.r.i - y.r.i; });
    const picks = [], fams = {};
    for (const s of scored) { if (picks.length >= 3) break; if (fams[s.r.t.family] && scored.length > 6) continue; fams[s.r.t.family] = 1; picks.push(s); }
    for (const s of scored) { if (picks.length >= 3) break; if (picks.indexOf(s) < 0) picks.push(s); }
    const o = liveOccasions()[occ];
    return { occasion: occ, occasion_name: o ? o.name : '', picks: picks.map(function (s) { return Object.assign(short(s.r), { why: s.n ? 'Fits what you said: ' + s.why.slice(0, 5).join(', ') + '.' : 'A good all-round look for ' + (o ? o.name.toLowerCase() : 'this') + '.' }); }),
      note: picks.length ? 'Tell the person about these three in a sentence each and let them choose; template shows one in full, find_templates searches the rest.' : 'There are no templates for that occasion yet: occasions lists what can be made.' };
  }
  const plainTemplate = function (t) { return JSON.parse(JSON.stringify(t)); };
  const musicOf = function (t) { const m = t && t.music || {}; return { styles: (m.styles || []).slice(0, 10), bpm: m.bpm || 100, voices: m.voices || '', notes: m.notes || '' }; };
  // a card to show a template by: made-up words where a person's own will go
  function sample(t) {
    const o = d.occasions().list.find(function (x) { return x.id === t.occasion; });
    return { template: t.id, to: 'Maya', from: 'All of us', title: t.name, greeting: (o && o.hello || 'Hello') + ', Maya!', signoff: 'With love, all of us', scenes: [], timing: null,
      lyrics: [{ section: 'verse', lines: ['This is where your own words go', 'Four lines about the one you know', 'Their name, the dog, the inside joke', 'The little things that make them glow'] }, { section: 'hook', lines: ['So here is a carol, made for you', 'Sing it loud, the whole way through'] }] };
  }
  const stills = new Map();
  async function still(t) {
    if (stills.has(t.id)) return stills.get(t.id);
    d.Render.fonts(); const W = 360, H = 640, cv = d.Render.canvas.createCanvas(W, H), ctx = cv.getContext('2d'), card = sample(t);
    d.Engine.draw(ctx, W, H, card, d.Engine.posterTime(card), { images: [], quality: 'full' });
    const jpg = await cv.encode('jpeg', 82); if (stills.size >= 200) stills.delete(stills.keys().next().value); stills.set(t.id, jpg); return jpg;
  }

  // ---------- a carol, as the tools tell it ----------
  const view = async function (who, id) { if (!CARD.test(String(id || ''))) throw fail('There is no such carol. my_carols lists yours.', 404); return (await site(who, 'GET', '/api/cards/' + id)).card; };
  const own = async function (who, id) { const row = CARD.test(String(id || '')) ? await db.get('SELECT * FROM cards WHERE id = ? AND uid = ?', [id, who.user.id]) : null; if (!row || row.state === 'deleted') throw fail('There is no such carol. my_carols lists yours.', 404); return row; };
  const progress = function (job) {
    if (!job) return null;
    if (job.state === 'failed') return { stage: 'failed', message: job.error || 'It did not work this time. Try again: nothing more is charged.' };
    if (job.state === 'queued' || job.stage === 'queued') return { stage: 'queued', percent: 0, message: 'Waiting its turn.' };
    if (job.stage === 'song') return { stage: 'writing the song', percent: job.pct || 5, message: 'The song is being sung (about a minute).' };
    return { stage: 'rendering', percent: job.pct || 30, message: 'Rendering the video: ' + (job.pct || 30) + '%.' };
  };
  const working = function (v) { return !!(v.job && v.job.state !== 'failed'); };
  function whereItIs(v) {
    const p = progress(v.job);
    if (p && p.stage !== 'failed') return 'Being made: ' + p.stage + (p.stage === 'rendering' ? ' ' + p.percent + '%' : '') + '. status says when it is ready.';
    if (v.state === 'down') return 'Taken down: its page answers "not here" until put_back.';
    if (v.state === 'ready') return (p ? 'The last try failed (' + p.message + '). ' : '') + 'Ready' + (v.stale ? ', and edited since its video was made: update_video brings the video up to date (free)' : '') + '. share_links gives the links.';
    if (p) return 'The last try failed: ' + p.message;
    if (!v.script) return 'A draft with no words yet. write_lyrics has the product\'s writer write it; set_lyrics takes lines you wrote with the person.';
    if (!v.takes.length) return 'The words are written and no song is made yet. preview_carol plays it silently; make_song has it sung (one credit, with the person\'s yes).';
    return 'It has a song. status says how the video is doing.';
  }
  function brief(v, tok) {
    const s = v.script, a = v.answers || {}, t = Templates.get(v.template), by = {}; ((s && s.scenes) || []).forEach(function (x, i) { by[x.pid] = Object.assign({ at: i }, x); });
    const photos = v.photos.map(function (p, i) { const x = by[p.id] || { at: 100 + i }; return { id: p.id, order: x.at, width: p.w, height: p.h, caption: x.caption || '', one_person: !!x.solo, position: Array.isArray(x.fit) ? { x: x.fit[0], y: x.fit[1], zoom: x.fit[2] } : null, view_url: tok ? SITE + '/mcp/media/' + tok + '/photo/' + p.id : undefined }; })
      .sort(function (x, y) { return x.order - y.order; }).map(function (p, i) { p.order = i + 1; return p; });
    return { id: v.id, state: v.state, where_it_is: whereItIs(v), occasion: v.occasion, template: { id: v.template, name: t ? t.name : v.template }, for: a.to || '', from: a.from || '', relationship: a.relation || '', details: a.details || '', must_include: a.must || '',
      title: s ? s.title || '' : '', greeting: s ? s.greeting || '' : '', signoff: s ? s.signoff || '' : '', lyrics: s ? s.lyrics || [] : [], writer_note: v.note || undefined, music: s ? s.music || musicOf(t) : musicOf(t),
      photos: photos, photos_room: Math.max(0, d.limit('photosPerCarol') - photos.length), rewrites_left: Math.max(0, d.limit('rewritesPerCarol') - (v.rewrites || 0)),
      song: { paid_for: !!v.paid, takes: v.takes.map(function (k) { return { id: k.id, number: k.n, seconds: k.seconds, chosen: k.id === v.take }; }), takes_left: v.paid ? v.takesLeft : d.limit('takesPerCarol'), making: progress(v.job) },
      video: working(v) ? 'being made' : v.media.indexOf('story') < 0 ? 'none yet' : v.stale ? 'older than the last edit (update_video)' : 'ready',
      card_name: v.slug || '', card_page: v.state === 'ready' && v.url ? v.url : '', shared: !!v.shared, opened: v.opens || 0, emailed_to: v.sent || 0, updated: new Date(v.updated || Date.now()).toISOString() };
  }
  const told = async function (who, id, more) { return Object.assign({}, more, { carol: brief(await view(who, id)) }); };
  // what the live preview draws from: the engine's own card, its one template, the photos and the song behind a link that runs out
  function previewOf(v) {
    const tok = seal('v', v.id, VIEW_MINUTES), t = Templates.get(v.template), p = progress(v.job), has = !!(v.take && v.takes.length);
    const status = p && p.stage !== 'failed' ? 'Being made: ' + p.stage + (p.stage === 'rendering' ? ' ' + p.percent + '%' : '') : v.state === 'ready' ? (v.stale ? 'Edited since the video was made' : 'With its song: this is what they will see') : has ? 'With its song' : !v.script ? 'No words yet: the look, on the template\'s own tempo' : 'Silent preview on the template\'s tempo: no song yet';
    return { tok: tok, preview: { rev: crypto.createHash('sha256').update(JSON.stringify([v.engine, v.pids, v.take])).digest('hex').slice(0, 12), title: v.title || (v.answers && v.answers.to ? 'For ' + v.answers.to : 'Your carol'), status: status, engine: v.engine, template: t ? plainTemplate(t) : null,
      photos: v.pids.map(function (pid) { return { id: pid, url: SITE + '/mcp/media/' + tok + '/photo/' + pid }; }), song: has ? { id: v.take, url: SITE + '/mcp/media/' + tok + '/song/' + v.take } : null, card_url: v.state === 'ready' && v.url ? v.url : '' } };
  }

  // ---------- the tools ----------
  const obj = function (props, req) { return { type: 'object', properties: props, required: req || [] }; };
  const ID = { type: 'string', description: 'The carol\'s id (from start_carol or my_carols).' }, PAGE = { type: 'integer', minimum: 1, description: 'The page, from 1.' };
  const KEY = { type: 'string', description: 'A fresh random string (8 or more characters) for this one action. Send the SAME one again only when you are trying again a call whose answer you never got: the action is then done once and you get the first answer. A new action needs a new one.' };
  const CONFIRM = { type: 'boolean', description: 'true only after the person has said yes to exactly this, in this conversation. Without it the tool says what would happen and does nothing.' };
  const LYRICS = { type: 'array', description: 'The song, in order: a verse of about 4 lines, then a hook of 2 to 4 that someone could hum (a second verse only if needed). 4 to ' + CFG.limits.lyricLines + ' lines in all (6 to 8 is best), each at most ' + CFG.limits.lineChars + ' characters and singable in one breath (7 to 11 syllables).',
    items: obj({ section: { type: 'string', enum: ['verse', 'hook'] }, lines: { type: 'array', items: { type: 'string' } } }, ['section', 'lines']) };
  const READ = { readOnlyHint: true }, WRITE = { readOnlyHint: false, destructiveHint: false }, GONE = { readOnlyHint: false, destructiveHint: true };
  const panelUri = function () { return 'ui://' + CFG.app + '/preview/' + d.build(); };
  const TOOLS = [
    { name: 'how_it_works', annotations: READ, description: 'READ THIS FIRST. What a carol is, the steps from "who is it for" to a card that sings, what is free and what costs a credit, what needs the person\'s yes, the limits, and what you must never do. Everything else here makes sense after it.', inputSchema: obj({}) },
    { name: 'occasions', annotations: READ, description: 'The occasions a carol can be made for today (birthday, thank you, love, congratulations, the holidays...), which are coming soon, and how many looks each has.', inputSchema: obj({}) },
    { name: 'find_templates', annotations: READ, description: 'Search the looks (templates): each is a little animated world with its own music. Search by words ("cozy grandma kitchen", "funny dog") and narrow by occasion, style, tone and audience. Always paged: there may be thousands. Use suggest_templates first when you know who the carol is for.',
      inputSchema: obj({ q: { type: 'string', description: 'Words to look for in names, tags and descriptions.' }, occasion: { type: 'string', description: 'An occasion id from occasions, for example "birthday".' }, style: { type: 'string', description: 'A style (family) id or name from an earlier answer\'s styles, for example "funny".' }, tone: { type: 'string', description: 'Words every result must have about its feel, for example "gentle" or "retro".' }, audience: { type: 'string', description: 'Words every result must have about who it suits, for example "kids", "grandparents", "clients".' }, page: PAGE, per: { type: 'integer', minimum: 1, maximum: 20, description: 'How many to a page (8 unless said, at most 20).' } }) },
    { name: 'suggest_templates', annotations: READ, description: 'Three looks that fit, each with why: give who the carol is for (what they are to the person), the occasion and the mood. Offer the three to the person in a sentence each and let them pick.',
      inputSchema: obj({ occasion: { type: 'string', description: 'An occasion id or plain words ("her 30th birthday").' }, relationship: { type: 'string', description: 'What they are to the person: "my sister", "our grandma", "a client".' }, mood: { type: 'string', description: 'The feel wanted: "funny", "sweet", "elegant"...' }, details: { type: 'string', description: 'Anything else that might steer the look: "she loves her dog", "just ran a marathon".' } }) },
    { name: 'template', annotations: READ, description: 'One look in full: what it shows, its tone, its music direction, and a link and a picture that show it (give the person the link: it plays the look with made-up words).', inputSchema: obj({ id: { type: 'string', description: 'The template\'s id.' } }, ['id']) },
    { name: 'start_carol', annotations: WRITE, description: 'Start a carol: a draft the person finds in "My carols" on the site too. Free. Give who it is for and from, what they are to each other, and the TRUE details to sing about (names, the dog, the inside joke, this year\'s big moment: only what the person told you, never invented). Leave template out and the best fit for the occasion is picked. Next: write_lyrics or set_lyrics.',
      inputSchema: obj({ for: { type: 'string', description: 'Who it is for, as the card should say it: "Maya", "Grandma Dot".' }, from: { type: 'string', description: 'Who it is from: "Sam and the kids".' }, relationship: { type: 'string', description: 'What they are to the sender: "my sister".' }, occasion: { type: 'string', description: 'An occasion id from occasions (needed when template is left out).' }, template: { type: 'string', description: 'A template id from suggest_templates or find_templates.' },
        details: { type: 'string', description: 'True details to sing about, in plain words (up to ' + CFG.limits.detailsChars + ' characters).' }, must_include: { type: 'string', description: 'One line that must be in the song word for word (optional).' }, mood: { type: 'string', description: 'Used only to pick a template when none is given.' }, idempotency_key: KEY }, ['for', 'idempotency_key']) },
    { name: 'my_carols', annotations: READ, description: 'The person\'s carols, newest first: drafts, ready ones and ones taken down. Search by title or card name, filter by state; 12 to a page.', inputSchema: obj({ q: { type: 'string', description: 'Words in its title or card name.' }, state: { type: 'string', enum: ['draft', 'ready', 'down'] }, page: PAGE }) },
    { name: 'carol', annotations: READ, description: 'Everything about one carol: who it is for, its words, music direction, photos (which have arrived, their order, captions and placing), takes of the song, where it is in being made, and its links.', inputSchema: obj({ id: ID }, ['id']) },
    { name: 'set_details', annotations: WRITE, description: 'Change who a carol is for or from, what they are to each other, the true details, or the line that must be in the song. The words already written do not change by themselves: write_lyrics (with ask) or set_lyrics does that.',
      inputSchema: obj({ id: ID, for: { type: 'string' }, from: { type: 'string' }, relationship: { type: 'string' }, details: { type: 'string' }, must_include: { type: 'string' }, idempotency_key: KEY }, ['id']) },
    { name: 'write_lyrics', annotations: WRITE, description: 'Have the product\'s own writer write the carol from the details (the first time), or write it again with a change ("funnier", "mention Grandpa\'s truck", "shorter"). Free, and counted exactly as on the site: ' + CFG.limits.freeDrafts + ' carols drafted before a first purchase, ' + CFG.limits.rewritesPerCarol + ' rewrites a carol, ' + CFG.limits.agentCallsPerDay + ' calls a day. It may refuse (unkind, sexual, not wholesome about a child, a copyrighted song): the answer then says why and what would work. Read the words to the person afterwards.',
      inputSchema: obj({ id: ID, ask: { type: 'string', description: 'For a rewrite: what to change, in a few words. Left out the first time.' }, idempotency_key: KEY }, ['id']) },
    { name: 'set_lyrics', annotations: WRITE, description: 'Save lines YOU wrote or edited with the person, instead of the product\'s writer. Free; does not count against the writer\'s limits. They are held to the same rules: the shape below, a check that every line can be sung in the seconds it gets, and the same refusals (nothing that demeans a person, nothing sexual, nothing about a child that is not wholesome, no hate, no line or tune of an existing song, no artist\'s name). A refusal comes back as one sentence saying what to change: fix that and send again. Use only true details the person gave you. Title, greeting and sign-off may be sent along.',
      inputSchema: obj({ id: ID, lyrics: LYRICS, title: { type: 'string', description: 'At most 56 characters.' }, greeting: { type: 'string', description: 'What the card says first, to them. At most 56.' }, signoff: { type: 'string', description: 'From the sender. At most 70.' }, idempotency_key: KEY }, ['id', 'lyrics']) },
    { name: 'set_text', annotations: WRITE, description: 'Change the words on the card that are not sung: its title, the greeting it opens with, the sign-off it ends on, and the caption under a photo (at most 40 characters; must not repeat a lyric line). Needs words to exist already. After a video exists, update_video redraws it (free).',
      inputSchema: obj({ id: ID, title: { type: 'string' }, greeting: { type: 'string' }, signoff: { type: 'string' }, captions: { type: 'array', items: obj({ photo: { type: 'string', description: 'The photo\'s id (from carol).' }, caption: { type: 'string' } }, ['photo', 'caption']) }, idempotency_key: KEY }, ['id']) },
    { name: 'add_photos', annotations: READ, description: 'Photos cannot be sent through this connector. This gives a link, good for ' + UPLOAD_MINUTES + ' minutes and for this one carol, to the product\'s own upload page: the person opens it (on their phone it offers the camera or the library), ticks that these are photos they may use, and adds up to ' + CFG.limits.photosPerCarol + '. Give them the link, wait for them to say they are done, then call carol to see what arrived. A carol with no photos is fine too.', inputSchema: obj({ id: ID }, ['id']) },
    { name: 'arrange_photos', annotations: WRITE, description: 'Put the photos in order and say how each sits: list them in the order they should appear (ones left out keep their place after). one_person: true lets a photo of one person go in the template\'s round or shaped frame; position moves a photo inside its frame (x and y from 0 to 1 are the point of the photo at the middle of the frame, zoom from 0.5 to 4 where 1 just fills it; null puts it back to automatic). Needs words to exist.',
      inputSchema: obj({ id: ID, photos: { type: 'array', items: obj({ photo: { type: 'string', description: 'The photo\'s id.' }, caption: { type: 'string' }, one_person: { type: 'boolean' }, position: { type: ['object', 'null'], properties: { x: { type: 'number' }, y: { type: 'number' }, zoom: { type: 'number' } } } }, ['photo']) }, idempotency_key: KEY }, ['id', 'photos']) },
    { name: 'remove_photo', annotations: GONE, description: 'Take one photo out of a carol; it is deleted from storage. Ask first if the person did not ask for exactly this.', inputSchema: obj({ id: ID, photo: { type: 'string', description: 'The photo\'s id (from carol).' } }, ['id', 'photo']) },
    { name: 'change_template', annotations: WRITE, description: 'Give a carol another look (a template of any live occasion). The words and photos stay. Its music direction stays as it was written too: set_music with use_template: true takes the new look\'s own sound.', inputSchema: obj({ id: ID, template: { type: 'string', description: 'A template id.' }, idempotency_key: KEY }, ['id', 'template']) },
    { name: 'set_music', annotations: WRITE, description: 'Change how the song should sound, before it is made (or before another_take): style words (instruments, genre, feel), the tempo, who sings. Plain descriptions only: NEVER an artist, a band, a songwriter, a song title, an album or "in the style of" anyone: the music service refuses those, and so does this tool. use_template: true goes back to the template\'s own direction.',
      inputSchema: obj({ id: ID, styles: { type: 'array', items: { type: 'string' }, description: '3 to 10 short style phrases, for example "warm acoustic folk", "upright piano", "hand claps".' }, bpm: { type: 'integer', minimum: 60, maximum: 180, description: 'Beats a minute.' }, voices: { type: 'string', description: 'Who sings, described: "bright female lead with a kids\' choir on the hook". At most 160 characters.' }, notes: { type: 'string', description: 'The feel in a sentence or two. At most 240.' }, use_template: { type: 'boolean' }, idempotency_key: KEY }, ['id']) },
    { name: 'preview_carol', annotations: READ, description: 'SHOW the carol: where Claude shows apps, a panel opens in the chat that plays the live card (silently on the template\'s tempo before there is a song, with the song after) and follows every edit. Everywhere else the answer has preview_url, a link that plays the same thing for ' + (VIEW_MINUTES / 60) + ' hours, and the poster once the carol is ready: give the person the link. Use it after the words are written and after each change they want to see.',
      inputSchema: obj({ id: ID }, ['id']), _meta: { ui: { resourceUri: '' } } },
    { name: 'make_song', annotations: WRITE, description: 'HAVE THE SONG MADE: the words as they are now are sung, then the video is rendered. THIS SPENDS ONE CAROL CREDIT (once for a carol; all sales are final). Call it first WITHOUT confirm: it answers exactly what will happen ("this uses 1 of your 3 credits...") and does nothing. Read that and the final words to the person, and only when they say yes call it again with confirm: true and an idempotency_key. With no credits it answers the link where the person buys some on the site: you cannot pay or give credits. Then follow with status.',
      inputSchema: obj({ id: ID, confirm: CONFIRM, idempotency_key: KEY }, ['id']) },
    { name: 'status', annotations: READ, description: 'How a carol being made is doing: queued, writing the song, rendering N%, ready, or failed with why. The song takes about a minute and the video about another: ask again every 15 seconds or so, and tell the person when it is ready.', inputSchema: obj({ id: ID }, ['id']) },
    { name: 'takes', annotations: READ, description: 'The takes of a carol\'s song (each paid carol has ' + CFG.limits.takesPerCarol + ': the first and ' + (CFG.limits.takesPerCarol - 1) + ' more), which one the card plays, how many are left, and a link to listen to each.', inputSchema: obj({ id: ID }, ['id']) },
    { name: 'another_take', annotations: WRITE, description: 'Have the song sung again, for a carol that already has one: the words and music direction as they are NOW. No new credit, but a carol has only ' + CFG.limits.takesPerCarol + ' takes in all, so ask the person first. Every take is kept; choose_take picks.', inputSchema: obj({ id: ID, idempotency_key: KEY }, ['id', 'idempotency_key']) },
    { name: 'choose_take', annotations: WRITE, description: 'Pick which take of the song the card plays; the video is made again with it (free).', inputSchema: obj({ id: ID, take: { type: 'string', description: 'The take\'s id or its number (1, 2, 3).' }, idempotency_key: KEY }, ['id', 'take']) },
    { name: 'update_video', annotations: WRITE, description: 'Make the video again when edits made it stale (captions, order, placing, greeting, sign-off, template). Free; carol says when the video is older than the last edit.', inputSchema: obj({ id: ID, idempotency_key: KEY }, ['id']) },
    { name: 'share_links', annotations: WRITE, description: 'The links of a ready carol: its card page (what to send people), the video in two shapes to post or download, and the poster. From the first time links are given out the card\'s name stays as it is, so set_card_name first if the person wants another.', inputSchema: obj({ id: ID }, ['id']) },
    { name: 'set_card_name', annotations: WRITE, description: 'Choose the card\'s address, ' + CFG.domain + '/<card-name>: 3 to 40 lowercase letters, digits and hyphens, like the-hollisters-2026. Only until the card is first shared.', inputSchema: obj({ id: ID, name: { type: 'string' }, idempotency_key: KEY }, ['id', 'name']) },
    { name: 'send_by_email', annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true }, description: 'Email a ready carol from ' + NAME + ' to people the person knows (up to ' + CFG.limits.recipientsPerCarol + ' a carol), with a short note. Never a list, never strangers. Call it first WITHOUT confirm: it says what will be sent and does nothing. Read that back, and only when the person says yes, and that these are people they know, call again with confirm: true and an idempotency_key. Addresses are not kept (only a hash) and are never given back; anyone who asked not to be emailed is skipped.',
      inputSchema: obj({ id: ID, to: { type: 'array', items: { type: 'string' }, description: 'Email addresses.' }, note: { type: 'string', description: 'A few words from the sender (up to 300 characters).' }, confirm: CONFIRM, idempotency_key: KEY }, ['id', 'to']) },
    { name: 'take_down', annotations: GONE, description: 'Take a ready carol\'s page down: its link answers "not here" for everyone until put_back. Needs confirm: true after the person says yes.', inputSchema: obj({ id: ID, confirm: CONFIRM }, ['id']) },
    { name: 'put_back', annotations: WRITE, description: 'Put a carol the person took down back up, at the same link as before. (A card taken down by the product itself stays down: the answer says to write to support.)', inputSchema: obj({ id: ID }, ['id']) },
    { name: 'delete_carol', annotations: GONE, description: 'Delete a carol for good: its page, photos, song and video are removed and cannot be brought back; a credit spent on a song that was made is not returned. Needs confirm: true after the person says yes to deleting THIS carol.', inputSchema: obj({ id: ID, confirm: CONFIRM }, ['id']) },
    { name: 'my_account', annotations: READ, description: 'The person\'s account: name, carol credits, and what is left today of each daily limit.', inputSchema: obj({}) },
    { name: 'buy_link', annotations: READ, description: 'Where the person buys carol credits: a link to the site, with the packs and prices. You cannot buy, pay or give credits; the person does it there, and the credits then show in my_account.', inputSchema: obj({ id: { type: 'string', description: 'A carol to come back to after buying (optional).' } }) },
  ];
  const WRITES = { start_carol: 1, set_details: 1, write_lyrics: 1, set_lyrics: 1, set_text: 1, arrange_photos: 1, change_template: 1, set_music: 1, make_song: 1, another_take: 1, choose_take: 1, update_video: 1, set_card_name: 1, send_by_email: 1 };
  const SAYS = NAME + ' (' + SITE + ') makes singing greeting cards: a short original song with their name in it (the brand calls it "a carol", for ANY occasion), set to an animated card with the person\'s photos, at a link to send. With these tools you make one with the person, start to finish. Call how_it_works first. In short: suggest_templates, start_carol, write_lyrics (the product\'s writer) or set_lyrics (lines you wrote with them), add_photos (a link they open), preview_carol to show it, then make_song. ' +
    'Making the song spends one of the person\'s carol credits, emailing reaches other people, and taking down or deleting cannot be shrugged off: for each, call the tool without confirm, tell the person what it answered, and pass confirm: true only after they say yes. You cannot pay or give credits. Use only true details the person gave; never name an artist or an existing song in a music direction.';
  const HOW = function () {
    const L = CFG.limits, lim = d.limit;
    return {
      what_a_carol_is: 'A carol is ' + NAME + '\'s word for a short song written for one person, for any occasion (a birthday, a thank you, love, congratulations, the holidays). It is sung by a music service and set to an animated card with the sender\'s photos: ' + CFG.video.minSec + ' to ' + CFG.video.maxSec + ' seconds. The card lives at ' + CFG.domain + '/<card-name>, with a video to download in two shapes.',
      the_steps: ['1. Ask who it is for, who it is from, what they are to each other, the occasion, the mood, and two or three TRUE details (names, the dog, the inside joke, this year\'s big moment).', '2. suggest_templates: offer the three looks; start_carol with the one they pick.',
        '3. The words: write_lyrics has the product\'s writer write them (then ask again with "funnier", "shorter"...), or write them WITH the person and set_lyrics. Read them back; change lines until they love them. set_text for title, greeting, sign-off and captions.',
        '4. Photos (optional, up to ' + lim('photosPerCarol') + '): add_photos gives a link the person opens to add them; carol shows what arrived; arrange_photos orders and places them.', '5. preview_carol shows the live card (silent until there is a song). set_music or change_template if they want another sound or look.',
        '6. make_song: first without confirm, tell them what it says, then with confirm: true when they say yes. status until it is ready (about two minutes).', '7. takes, another_take, choose_take if they want it sung again. share_links for the links; send_by_email to send it from here.'],
      what_is_free: 'Starting, writing, rewriting, photos, the live preview, changing the look and the music direction: free, within the limits below.',
      what_costs_a_credit: 'Only make_song: one carol credit, once for a carol. It buys the song (' + lim('takesPerCarol') + ' takes in all: the first and ' + (lim('takesPerCarol') - 1) + ' more with another_take), the video in two shapes, the card\'s page, and emailing it to up to ' + lim('recipientsPerCarol') + ' people. Credits are bought by the person on the site (buy_link): ' + CFG.packs.filter(function (p) { return p.cents > 0; }).map(function (p) { return p.label + ' ' + money(p.cents); }).join(', ') + '. ' + CFG.finalSale + ' If a song cannot be made at all, the credit comes back by itself (a credit, never money).',
      what_needs_the_persons_yes: 'make_song (spends a credit), send_by_email (reaches other people), take_down and delete_carol. Call the tool without confirm: it answers what would happen and does nothing. Tell the person exactly that. Pass confirm: true only after they say yes to it, in this conversation. Ask too before another_take (a carol has only ' + lim('takesPerCarol') + ') and before remove_photo.',
      limits: { free_drafts_before_a_first_purchase: lim('freeDrafts'), rewrites_per_carol_by_the_writer: lim('rewritesPerCarol'), writer_calls_per_day: lim('agentCallsPerDay'), new_carols_per_day: lim('carolsPerDay'), photos_per_carol: lim('photosPerCarol'), takes_per_carol: lim('takesPerCarol'), emails_per_carol: lim('recipientsPerCarol'), emails_per_day: lim('emailsPerDay'), lines_in_a_song: '4 to ' + L.lyricLines + ' (6 to 8 is best)', characters_in_a_line: L.lineChars,
        note: 'The same limits as on the site, per account, whichever door is used. When one is reached the tool says so in a sentence: usually "try again tomorrow", or for free drafts "buy a pack" (buy_link).' },
      writing_good_lines: ['A verse of 4 lines, then a hook of 2 to 4 that someone could hum afterwards.', 'Each line 7 to 11 syllables, one breath; lines of a section keep one metre so they scan; rhyme in couplets or alternate lines, true or near rhymes, never forced.', 'Their name and the true details are what make it theirs. If little was given, write warmly and generally for that relationship.',
        'Clean and warm. Funny is playful and kind, never mocking. A work or client card is professional and inclusive.', 'A caption must not repeat a lyric line.'],
      never: ['Never invent facts about real people: no made-up pets, places, jobs or events. Use only what the person told you.', 'Never write to demean, humiliate or get back at someone; nothing sexual; nothing about a child that is not wholesome; no hate.',
        'Never copy a copyrighted song\'s words, a recognisable rewrite of them, or ask for "the tune of" any song. Old songs anybody may sing can inspire mood and metre, with new words.', 'Never put an artist, a band, a songwriter, a song title or an album in a music direction (set_music), or "in the style of" anyone.',
        'Never pass confirm: true without the person\'s yes to exactly that action.', 'Never email anyone the person did not name, and never anyone they do not know.', 'Never tell the person a song or video is ready before status says so.', 'You cannot take payment, give credits, or see anyone else\'s carols.'],
      seeing_it: 'preview_carol opens the live card in the chat where Claude shows apps; elsewhere it gives preview_url (a link that plays it). add_photos, template and takes give links too. All such links run out; ask again for a new one.',
      if_something_fails: 'A tool that cannot do something says why in a sentence: act on it or tell the person. A song that fails gives its credit back by itself.',
    };
  };

  // a write that carries idempotency_key is done once: the first answer is kept a day for that person, tool, carol
  // and key, and a repeat is given it (replayed: true) without the work being done again. Two that arrive together
  // wait on the one piece of work. An answer that did nothing (it asked for the person's yes) is not kept.
  const flying = {};
  async function once(who, name, a, work) {
    const k = typeof a.idempotency_key === 'string' ? a.idempotency_key.trim() : '';
    if (!k) return work();
    if (k.length < 8 || k.length > 200) throw fail('idempotency_key is 8 to 200 characters: a fresh random string for each new action.');
    const ikey = 'mcp-' + crypto.createHash('sha256').update(name + '|' + String(a.id || '') + '|' + k).digest('base64url').slice(0, 40), fid = who.user.id + ' ' + ikey;
    const again = function (o) { return Object.assign({}, o, { replayed: true, replay_note: 'This is the answer to an earlier call with the same idempotency_key: nothing was done again. A new action needs a new key.' }); };
    if (flying[fid]) return again(await flying[fid]);
    let was = null;
    const first = (async function () {
      const row = await db.get('SELECT answer FROM idem WHERE uid = ? AND ikey = ?', [who.user.id, ikey]);
      if (row) { was = JSON.parse(row.answer); return was; }
      const out = await work();
      if (out && !out.nothing_done) await db.run('INSERT INTO idem (uid, ikey, at, code, answer) VALUES (?, ?, ?, 200, ?) ON CONFLICT DO NOTHING', [who.user.id, ikey, Date.now(), JSON.stringify(out)]);
      return out;
    })();
    flying[fid] = first;
    try { const out = await first; return was ? again(out) : out; } finally { delete flying[fid]; }
  }
  const needKey = function (a, what) { if (typeof a.idempotency_key !== 'string' || a.idempotency_key.trim().length < 8) throw fail('Pass idempotency_key with ' + what + ': a fresh random string of 8 or more characters, so that trying again can never do it twice.'); };
  const buyUrl = function (id) { return SITE + '/make?buy=1' + (id && CARD.test(String(id)) ? '&card=' + id : ''); };
  const packs = function () { return CFG.packs.filter(function (p) { return p.cents > 0; }).map(function (p) { return { pack: p.label, credits: p.credits, price: money(p.cents) }; }); };
  const noCredit = function (id, why) { return { started: false, nothing_done: true, why: why, buy_url: buyUrl(id), packs: packs(), note: 'Give the person the link: they buy on the site (' + CFG.finalSale + '), and their credits then show in my_account. You cannot pay or give credits.' }; };
  const refuse = function (sentence) { if (sentence) throw fail(sentence, 422, { refused: true }); };
  // a short text on the card (a title, a caption, a note), or the sentence that says it is too long
  const short56 = function (v, n, what) { if (v === undefined) return undefined; if (typeof v !== 'string') refuse(what + ' is a string of words.'); const s = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim(); if (s.length > n) refuse(what + ' is ' + s.length + ' characters, and it can be at most ' + n + '. Shorten it.'); return s; };

  async function call(name, a, who) {
    a = a && typeof a === 'object' && !Array.isArray(a) ? a : {};
    if (WRITES[name]) return once(who, name, a, function () { return run(name, a, who); });
    return run(name, a, who);
  }
  async function run(name, a, who) {
    const user = who.user, lim = d.limit;
    if (name === 'how_it_works') return HOW();
    if (name === 'occasions') {
      const rows = liveRows(), n = {}; rows.forEach(function (r) { n[r.t.occasion] = (n[r.t.occasion] || 0) + 1; });
      const o = d.occasions();
      return { occasions: o.list.filter(function (x) { return x.state !== 'off'; }).map(function (x) { return { id: x.id, name: x.name, can_be_made: x.state === 'live', coming_soon: x.state !== 'live' || undefined, templates: n[x.id] || 0, in_season: x.now || undefined }; }), featured_today: o.featured, note: 'A carol can be made for the ones with can_be_made. suggest_templates or find_templates { occasion } shows their looks.' };
    }
    if (name === 'find_templates') return findTemplates(a);
    if (name === 'suggest_templates') return suggest(a);
    if (name === 'template') {
      const t = liveTemplate(a.id); if (!t) throw fail('There is no template with that id. find_templates lists them.', 404);
      const fam = (Templates.families || []).find(function (f) { return f.id === t.family; });
      return { id: t.id, name: t.name, occasion: t.occasion, style: fam ? fam.name : t.family, blurb: t.blurb || '', tone: t.tone || '', tags: (t.tags || []).slice(0, 20), music: musicOf(t), cast: (t.cast || []).filter(function (c) { return c.kind === 'character'; }).map(function (c) { return c.name; }).slice(0, 8),
        preview_url: SITE + '/mcp/template/' + t.id, preview_image: SITE + '/mcp/template/' + t.id + '.jpg', note: 'preview_url plays this look with made-up words; give it to the person. start_carol { template } starts a carol with it; change_template gives it to one they have.' };
    }
    if (name === 'my_account') {
      const day = new Date().toISOString().slice(0, 10), used = {}; (await db.all('SELECT kind, n FROM usage_day WHERE uid = ? AND day = ?', [user.id, day])).forEach(function (r) { used[r.kind] = r.n; });
      const left = function (kind, max) { return Math.max(0, max - (used[kind] || 0)); }, credits = await d.balance(user.id);
      const out = { name: user.name || '', email: user.email || '', credits: credits, has_bought: !!user.paid, left_today: { writer_calls: left('agent', lim('agentCallsPerDay')), new_carols: left('card', lim('carolsPerDay')), emails: left('email', lim('emailsPerDay')), videos: left('render', 30) }, buy_url: buyUrl() };
      if (!user.paid) out.free_drafts_left = Math.max(0, lim('freeDrafts') - (await db.get("SELECT COUNT(*) AS n FROM events WHERE kind = 'written' AND uid = ?", [user.id])).n);
      return out;
    }
    if (name === 'buy_link') return { url: buyUrl(a.id), packs: packs(), credits_now: await d.balance(user.id), note: 'The person opens the link, signed in to the same account, and buys there. ' + CFG.finalSale + ' One credit makes one whole carol. You cannot buy, pay or give credits.' };
    if (name === 'my_carols') {
      const q = new URLSearchParams(); if (a.q) q.set('q', str(a.q, 60)); if (['draft', 'ready', 'down'].indexOf(a.state) >= 0) q.set('state', a.state); q.set('page', String(Math.max(1, Math.floor(+a.page) || 1)));
      const r = await site(who, 'GET', '/api/cards?' + q);
      return { carols: r.items.map(function (c) { return { id: c.id, title: c.title, state: c.state, occasion: c.occasion, template: c.template, song_paid_for: !!c.paid, card_page: c.state === 'ready' && c.slug ? SITE + '/' + c.slug : '', opened: c.opens || 0, updated: new Date(c.updated).toISOString() }; }), total: r.total, page: r.page, pages: r.pages, per: 12 };
    }
    if (name === 'start_carol') {
      needKey(a, 'start_carol'); if (!str(a.for, 80)) throw fail('Who is the carol for? Pass for: their name as the card should say it.');
      let t = null, picked = '';
      if (a.template !== undefined && a.template !== '') { t = liveTemplate(a.template); if (!t) throw fail('There is no template "' + str(a.template, 60) + '". suggest_templates or find_templates gives ids that can be used.', 404); }
      else { const s = suggest(a); if (!s.picks.length) throw fail('Say the occasion (occasions lists them) or pass a template id.'); t = Templates.get(s.picks[0].id); picked = 'No template was given, so "' + t.name + '" was picked (' + s.picks[0].why + ') change_template gives it another look.'; }
      const r = await site(who, 'POST', '/api/cards', { template: t.id, answers: { to: a.for, from: a.from, relation: a.relationship, details: a.details, must: a.must_include } });
      return { started: true, picked: picked || undefined, carol: brief(r.card), next: 'write_lyrics has the product\'s writer write the words; or write them with the person and set_lyrics. add_photos gives the link for photos.' };
    }

    // ---- everything below is about one carol of this person's ----
    const id = String(a.id || '');
    if (name === 'carol') { const v = await view(who, id); return { carol: brief(v, seal('v', v.id, VIEW_MINUTES)) }; }
    if (name === 'status') {
      const v = await view(who, id), p = progress(v.job);
      await ask(user.id, 'GET', '/api/cards/' + id + '/status');   // (the site knows somebody is watching: no "your carol is ready" email on top)
      if (p && p.stage !== 'failed') return Object.assign({ state: v.state }, p, { next: 'Ask again in about 15 seconds.' });
      if (p) return Object.assign({ state: v.state }, p, { credits: await d.balance(user.id), next: v.takes.length ? 'update_video tries the video again.' : 'make_song tries again: if the credit came back it is spent again, with the person\'s yes.' });
      if (v.state === 'ready' || v.state === 'down') return { state: v.state, stage: 'ready', percent: 100, card_page: v.state === 'ready' ? v.url : '', video: v.stale ? 'older than the last edit (update_video)' : 'ready', message: v.state === 'ready' ? 'It is ready. share_links gives the links; preview_carol shows it.' : 'It is made, and taken down.' };
      return { state: v.state, stage: v.takes.length ? 'has a song' : 'no song yet', message: whereItIs(v) };
    }
    if (name === 'preview_carol') {
      const v = await view(who, id), p = previewOf(v);
      return { id: v.id, title: p.preview.title, state: v.state, showing: p.preview.status, preview_url: SITE + '/mcp/preview/' + p.tok, poster: v.state === 'ready' && v.url ? v.url + '/poster.jpg' : undefined, preview: p.preview,
        note: 'Where Claude shows apps, the card is playing in the chat and follows your edits. Anywhere else, give the person preview_url: it plays the same card for ' + (VIEW_MINUTES / 60) + ' hours.' };
    }
    if (name === 'takes') {
      const v = await view(who, id), tok = seal('v', v.id, VIEW_MINUTES);
      return { takes: v.takes.map(function (k) { return { id: k.id, number: k.n, seconds: k.seconds, chosen: k.id === v.take, listen_url: SITE + '/mcp/media/' + tok + '/song/' + k.id }; }), takes_left: v.paid ? v.takesLeft : lim('takesPerCarol'), making: progress(v.job), note: v.takes.length ? 'The listen links work for ' + (VIEW_MINUTES / 60) + ' hours. choose_take picks which one the card plays.' : 'No song has been made yet: make_song.' };
    }
    if (name === 'add_photos') {
      const v = await view(who, id), room = lim('photosPerCarol') - v.photos.length;
      if (room < 1) throw fail('This carol already has ' + v.photos.length + ' photos, the most it holds. remove_photo makes room.', 409);
      return { upload_url: SITE + '/mcp/photos/' + seal('u', v.id, UPLOAD_MINUTES), good_for_minutes: UPLOAD_MINUTES, has: v.photos.length, room: room,
        how: 'Give the person this link. It opens ' + NAME + '\'s own page for this one carol: on a phone it offers the camera or the photo library. They tick that these are photos they may use, add up to ' + room + ', and come back here. Then call carol to see what arrived. JPEG, PNG, WebP and HEIC, up to ' + Math.round(lim('photoBytes') / 1048576) + ' MB each.' };
    }
    if (name === 'set_details') {
      await view(who, id); const ans = {}; [['for', 'to'], ['from', 'from'], ['relationship', 'relation'], ['details', 'details'], ['must_include', 'must']].forEach(function (k) { if (a[k[0]] !== undefined) ans[k[1]] = a[k[0]]; });
      if (!Object.keys(ans).length) throw fail('Pass at least one of: for, from, relationship, details, must_include.');
      await site(who, 'POST', '/api/cards/' + id + '/save', { answers: ans });
      return told(who, id, { saved: true, note: 'The words already written have not changed: write_lyrics { ask } or set_lyrics does that.' });
    }
    if (name === 'write_lyrics') {
      await view(who, id); let r;
      try { r = await ask(user.id, 'POST', '/api/cards/' + id + '/write', a.ask ? { ask: str(a.ask, 300) } : {}, who.ip ? { 'fly-client-ip': who.ip } : {}); } catch (e) { throw fail('The writer could not be reached. Try again in a moment.', 502); }
      if (r.status === 402) return { written: false, nothing_done: true, why: r.json.error, buy_url: buyUrl(id), note: 'The person can buy a pack on the site (you cannot), or you can write the lines with them and save them with set_lyrics, which is free.' };
      if (r.status !== 200) throw fail(r.json.error || 'The writer did not answer. Try again.', r.status >= 400 && r.status < 500 ? r.status : 502);
      if (r.json.refused) return { written: false, nothing_done: true, refused: true, why: r.json.message, note: 'The writer declined. Tell the person why, change what is asked for (set_details), and try again.' };
      return told(who, id, { written: true, next: 'Read the words to the person. Change them with write_lyrics { ask } or set_lyrics; preview_carol shows the card.' });
    }
    if (name === 'set_lyrics') {
      const shape = Rules.lyricsShape(a.lyrics); refuse(shape.problem);
      const title = short56(a.title, 56, 'The title'), greeting = short56(a.greeting, 56, 'The greeting'), signoff = short56(a.signoff, 70, 'The sign-off');
      let n = 0; for (const s of shape.lyrics) for (const l of s.lines) refuse(Rules.wordsProblem(l, 'Line ' + (++n)));
      refuse(Rules.wordsProblem(shape.lyrics.map(function (s) { return s.lines.join(' '); }).join(' '), 'The song', { lines: true }));
      [[title, 'The title'], [greeting, 'The greeting'], [signoff, 'The sign-off']].forEach(function (x) { if (x[0]) refuse(Rules.wordsProblem(x[0], x[1])); });
      const fit = await d.locked('write ' + id, async function () {
        const row = await own(who, id), doc = d.docOf(row), t = Templates.get(row.template), ans = doc.answers || {}, first = !doc.script, more = {};
        if (!t) throw fail('That template is gone. change_template gives the carol another.', 409);
        const music = doc.script && doc.script.music || musicOf(t), f = Rules.fit(shape.lyrics, music, t); refuse(f.problem);
        if (!await d.spendDay(user.id, 'ownwords', 300)) throw fail('That is a lot of edits for one day. Try again tomorrow.', 429);
        if (first) {
          const o = d.occasions().list.find(function (x) { return x.id === row.occasion; }), pids = (await db.all('SELECT id FROM photos WHERE card = ? ORDER BY n, at', [row.id])).map(function (p) { return p.id; });
          doc.script = { title: title || (ans.to ? 'A Carol for ' + ans.to : 'A carol for you'), greeting: greeting !== undefined ? greeting : str((o && o.hello || 'Hello') + (ans.to ? ', ' + ans.to : '') + '!', 56), signoff: signoff !== undefined ? signoff : str(ans.from ? 'With love, ' + ans.from : 'With love', 70), lyrics: shape.lyrics, music: music, scenes: pids.map(function (p) { return { pid: p, caption: '' }; }) };
          if (!row.slug) more.slug = await d.freeSlug(d.slugify((ans.from || ans.to || doc.script.title) + ' ' + new Date().getUTCFullYear()), row.id);
        } else { doc.script.lyrics = shape.lyrics; if (title) doc.script.title = title; if (greeting !== undefined) doc.script.greeting = greeting; if (signoff !== undefined) doc.script.signoff = signoff; }
        doc.note = '';
        await d.saveDoc(row, doc, more); if (first) await d.note('ownwords', row.id, user.id);
        return f;
      });
      const v = await view(who, id);
      return { saved: true, sings_in_seconds: fit.seconds, tempo_bpm: fit.bpm, carol: brief(v), note: v.takes.length ? 'The song already made keeps the words it was sung with: another_take sings these.' : 'preview_carol shows the card with these words; make_song has them sung.' };
    }
    if (name === 'set_text') {
      const v = await view(who, id); if (!v.script) throw fail('This carol has no words yet: write_lyrics or set_lyrics first. Its title, greeting and sign-off are written then, and can be changed after.', 409);
      const patch = {}, title = short56(a.title, 56, 'The title'), greeting = short56(a.greeting, 56, 'The greeting'), signoff = short56(a.signoff, 70, 'The sign-off');
      if (title !== undefined) { if (!title) throw fail('A carol needs a title.'); patch.title = title; } if (greeting !== undefined) patch.greeting = greeting; if (signoff !== undefined) patch.signoff = signoff;
      [[title, 'The title'], [greeting, 'The greeting'], [signoff, 'The sign-off']].forEach(function (x) { if (x[0]) refuse(Rules.wordsProblem(x[0], x[1])); });
      if (a.captions !== undefined) {
        if (!Array.isArray(a.captions)) throw fail('captions is a list of { photo, caption }.');
        const scenes = (v.script.scenes || []).map(function (x) { return Object.assign({}, x); });
        for (const c of a.captions) {
          const x = c && scenes.find(function (s) { return s.pid === c.photo; }); if (!x) throw fail('There is no photo "' + str(c && c.photo, 40) + '" in this carol. carol lists its photos.', 404);
          const cap = short56(c.caption, 40, 'A caption'); refuse(Rules.wordsProblem(cap, 'A caption'));
          if (cap && (v.script.lyrics || []).some(function (s) { return s.lines.some(function (l) { return Rules.norm(l) === Rules.norm(cap); }); })) throw fail('That caption repeats a line of the song ("' + cap + '"). A caption says something the song does not.');
          x.caption = cap;
        }
        patch.scenes = scenes;
      }
      if (!Object.keys(patch).length) throw fail('Pass at least one of: title, greeting, signoff, captions.');
      await site(who, 'POST', '/api/cards/' + id + '/save', { script: patch });
      return told(who, id, { saved: true });
    }
    if (name === 'arrange_photos') {
      const v = await view(who, id); if (!Array.isArray(a.photos) || !a.photos.length) throw fail('photos is the list of photos in the order they should appear, each { photo: its id, ... }.');
      if (!v.photos.length) throw fail('This carol has no photos yet. add_photos gives the link to add some.', 409);
      if (!v.script) throw fail('Photos are arranged once the carol has words: write_lyrics or set_lyrics first.', 409);
      const was = {}; (v.script.scenes || []).forEach(function (x) { was[x.pid] = x; }); const seen = {}, scenes = [];
      for (const p of a.photos) {
        const pid = p && String(p.photo || ''); if (!was[pid]) throw fail('There is no photo "' + str(pid, 40) + '" in this carol. carol lists its photos.', 404); if (seen[pid]) throw fail('A photo is listed twice.'); seen[pid] = 1;
        const x = { pid: pid, caption: was[pid].caption || '' }; if (was[pid].fit) x.fit = was[pid].fit; if (was[pid].solo) x.solo = 1;
        if (p.caption !== undefined) { x.caption = short56(p.caption, 40, 'A caption'); refuse(Rules.wordsProblem(x.caption, 'A caption')); }
        if (p.one_person !== undefined) { if (p.one_person === true) x.solo = 1; else delete x.solo; }
        if (p.position === null) delete x.fit;
        else if (p.position !== undefined) { const q = p.position || {}, ok = function (n, lo, hi) { return typeof n === 'number' && isFinite(n) && n >= lo && n <= hi; }; if (!ok(q.x, 0, 1) || !ok(q.y, 0, 1) || !ok(q.zoom, 0.5, 4)) throw fail('A position is { x, y, zoom }: x and y from 0 to 1 (the point of the photo at the middle of its frame; 0.5 and 0.5 is the centre), zoom from 0.5 to 4 (1 just fills the frame).'); x.fit = [q.x, q.y, q.zoom]; }
        scenes.push(x);
      }
      (v.script.scenes || []).forEach(function (x) { if (!seen[x.pid]) scenes.push(x); });
      await site(who, 'POST', '/api/cards/' + id + '/save', { script: { scenes: scenes } });
      return told(who, id, { saved: true });
    }
    if (name === 'remove_photo') {
      const v = await view(who, id), pid = String(a.photo || ''); if (!PID.test(pid) || !v.photos.some(function (p) { return p.id === pid; })) throw fail('There is no photo "' + str(pid, 40) + '" in this carol. carol lists its photos.', 404);
      await site(who, 'DELETE', '/api/cards/' + id + '/photos/' + pid); return told(who, id, { removed: true });
    }
    if (name === 'change_template') {
      await view(who, id); const t = liveTemplate(a.template); if (!t) throw fail('There is no template "' + str(a.template, 60) + '". suggest_templates or find_templates gives ids that can be used.', 404);
      await site(who, 'POST', '/api/cards/' + id + '/save', { template: t.id });
      return told(who, id, { saved: true, note: 'It now has the look "' + t.name + '". Its music direction is still the one it had: set_music { use_template: true } takes this look\'s own sound.' });
    }
    if (name === 'set_music') {
      const out = await d.locked('write ' + id, async function () {
        const row = await own(who, id), doc = d.docOf(row), t = Templates.get(row.template);
        if (!doc.script) throw fail('The music direction is set once the carol has words: write_lyrics or set_lyrics first. Until then it is the template\'s own.', 409);
        const m = a.use_template === true ? { music: musicOf(t) } : Rules.musicShape(a, doc.script.music || musicOf(t)); refuse(m.problem);
        if (a.use_template !== true && a.styles === undefined && a.bpm === undefined && a.voices === undefined && a.notes === undefined) throw fail('Pass at least one of: styles, bpm, voices, notes, use_template.');
        const f = Rules.fit(doc.script.lyrics || [], m.music, t); if (f.problem) refuse(f.problem + ' (At this tempo the lines get less time: slow it down, or shorten the line.)');
        if (!await d.spendDay(user.id, 'ownwords', 300)) throw fail('That is a lot of edits for one day. Try again tomorrow.', 429);
        doc.script.music = m.music; await d.saveDoc(row, doc); return f;
      });
      const v = await view(who, id);
      return { saved: true, sings_in_seconds: out.seconds, carol: brief(v), note: v.takes.length ? 'The song already made keeps its sound: another_take sings it this way.' : 'make_song will ask for this sound.' };
    }
    if (name === 'make_song') {
      const v = await view(who, id), credits = await d.balance(user.id), n = (v.script && v.script.lyrics || []).reduce(function (k, s) { return k + s.lines.length; }, 0);
      if (!v.script || !n) throw fail('Write the words first: write_lyrics or set_lyrics.', 409);
      if (working(v)) return { started: false, nothing_done: true, why: 'This carol is already being made. status says how it is doing.', making: progress(v.job) };
      if (v.takes.length) throw fail('This carol already has its song. another_take has it sung again (' + plural(v.takesLeft, 'take') + ' left); choose_take picks one; update_video redraws the video.', 409);
      if (!v.paid && credits < 1) return noCredit(id, 'Making the song takes one carol credit, and this account has none.');
      refuse(Rules.musicProblem(v.script.music || {}));
      const will = v.paid ? 'This carol is already paid for, so making its song uses no new credit.' : 'This uses 1 of your ' + plural(credits, 'credit') + '.';
      if (a.confirm !== true) return { started: false, nothing_done: true, needs_the_persons_yes: true, what_will_happen: will + ' The song takes about a minute, then the video about another. The words below are sung as they are. A credit that has made a song does not come back.',
        credits: credits, credits_after: v.paid ? credits : credits - 1, title: v.script.title, words_to_be_sung: v.script.lyrics, music: v.script.music, ask: 'Tell the person this and read them the words. When they say yes, call make_song again with confirm: true and an idempotency_key.' };
      needKey(a, 'confirm: true');
      let r; try { r = await site(who, 'POST', '/api/cards/' + id + '/song', {}); } catch (e) { if (e.code === 402) return noCredit(id, e.message); throw e; }
      return { started: true, stage: 'queued', credits_left: r.credits, takes_left_after_this: Math.max(0, lim('takesPerCarol') - 1), next: 'Ask status about every 15 seconds: the song takes about a minute, the video about another. Tell the person when it is ready, not before.' };
    }
    if (name === 'another_take') {
      needKey(a, 'another_take'); const v = await view(who, id);
      if (working(v)) return { started: false, nothing_done: true, why: 'This carol is already being made. status says how it is doing.', making: progress(v.job) };
      if (!v.takes.length) throw fail('This carol has no song yet: make_song makes the first one.', 409);
      if (v.takesLeft < 1) throw fail('This carol has had its ' + lim('takesPerCarol') + ' takes of the song. choose_take picks the one the person likes best.', 409);
      refuse(Rules.musicProblem(v.script && v.script.music || {}));
      await site(who, 'POST', '/api/cards/' + id + '/song', {});
      return { started: true, stage: 'queued', takes_left_after_this: v.takesLeft - 1, next: 'Ask status about every 15 seconds. The new take becomes the one the card plays; takes lists them all and choose_take goes back to another.' };
    }
    if (name === 'choose_take') {
      const v = await view(who, id), want = String(a.take || ''), k = v.takes.find(function (x) { return x.id === want || String(x.n) === want; });
      if (!k) throw fail('There is no such take. takes lists them.', 404);
      await site(who, 'POST', '/api/cards/' + id + '/take', { take: k.id });
      return { started: true, stage: 'queued', take: { id: k.id, number: k.n }, next: 'The video is being made again with take ' + k.n + ' (free). status says when it is ready.' };
    }
    if (name === 'update_video') {
      const v = await view(who, id); if (!v.takes.length || !v.take) throw fail('There is no song to make the video with yet: make_song first.', 409);
      if (working(v)) return { started: false, nothing_done: true, why: 'This carol is already being made. status says how it is doing.', making: progress(v.job) };
      if (!v.stale && v.media.indexOf('story') >= 0 && !(v.job && v.job.state === 'failed')) return { started: false, nothing_done: true, why: 'The video is up to date: nothing was edited since it was made.' };
      await site(who, 'POST', '/api/cards/' + id + '/render', {});
      return { started: true, stage: 'queued', next: 'The video is being made again (free). status says when it is ready.' };
    }
    if (name === 'set_card_name') {
      await view(who, id); const r = await site(who, 'POST', '/api/cards/' + id + '/save', { slug: str(a.name, 60).toLowerCase() });
      return { saved: true, card_name: r.card.slug, card_page: SITE + '/' + r.card.slug, note: r.card.state === 'ready' ? 'That is its address now.' : 'That will be its address once the carol is ready.' };
    }
    if (name === 'share_links') {
      let v = await view(who, id); if (v.state !== 'ready') throw fail(v.state === 'down' ? 'This carol is taken down: put_back first.' : 'This carol is not ready to share yet: it needs its song and video (make_song, then status).', 409);
      if (!v.shared) v = (await site(who, 'POST', '/api/cards/' + id + '/share', {})).card;
      const u = v.url;
      return { card_page: u, video_tall: u + '/story.mp4', video_square: u + '/square.mp4', download_tall: u + '/story.mp4?dl=1', download_square: u + '/square.mp4?dl=1', poster: u + '/poster.jpg', poster_tall: u + '/poster-story.jpg', animated_preview: u + '/preview.gif', opened: v.opens || 0,
        say: (v.answers.from ? v.answers.from + ' made ' : 'I made ') + (v.answers.to || 'you') + ' a carol: ' + u, note: 'card_page is what to send: it plays the card with sound. The tall video is for stories and reels, the square one for feeds and email. The card\'s name now stays as it is.' };
    }
    if (name === 'send_by_email') {
      const v = await view(who, id); if (v.state !== 'ready') throw fail('This carol is not ready to send yet: it needs its song and video first.', 409);
      if (!d.mail.on()) throw fail('Email is not set up yet. share_links gives the link to send instead.', 503);
      const given = Array.isArray(a.to) ? a.to : typeof a.to === 'string' ? a.to.split(/[\s,;]+/) : [], list = given.map(d.mail.addressOf).filter(function (x, i, all) { return x && all.indexOf(x) === i; }), bad = given.filter(function (x) { return String(x || '').trim() && !d.mail.addressOf(x); }).length;
      if (bad) throw fail((bad === 1 ? '1 address of those does' : bad + ' addresses of those do') + ' not look like an email address. Check them with the person and send the list again.');
      if (!list.length) throw fail('Add at least one email address.'); if (list.length > lim('recipientsPerCarol')) throw fail('A carol can be emailed to ' + lim('recipientsPerCarol') + ' people in all. share_links gives the link for everyone else.', 409);
      const note = short56(a.note === undefined ? '' : a.note, 300, 'The note'); refuse(Rules.wordsProblem(note, 'The note'));
      if (a.confirm !== true) return { sent: 0, nothing_done: true, needs_the_persons_yes: true, what_will_happen: NAME + ' will email "' + (v.title || 'the carol') + '" to ' + people(list.length) + ', as a picture that opens the card\'s page' + (note ? ', with the note: "' + note + '"' : '') + '. Each email says who it is from and has a "don\'t email me again" link. A carol can be emailed to ' + lim('recipientsPerCarol') + ' people in all (' + (v.sent || 0) + ' so far).',
        ask: 'Read the addresses and the note back to the person. When they say yes, and that these are people they know, call send_by_email again with confirm: true and an idempotency_key.' };
      needKey(a, 'confirm: true');
      const r = await site(who, 'POST', '/api/cards/' + id + '/email', { to: list, note: note, know: true });
      return { sent: r.sent, skipped_asked_not_to_be_emailed: r.stopped, failed: r.failed, note: (r.sent ? plural(r.sent, 'email') + ' sent.' : 'Nothing was sent.') + (r.stopped ? ' ' + people(r.stopped) + ' asked ' + NAME + ' not to be emailed, and ' + (r.stopped === 1 ? 'was' : 'were') + ' skipped: send them the link yourself (share_links).' : '') + (r.failed ? ' ' + r.failed + ' could not be sent: try those again later.' : '') };
    }
    if (name === 'take_down') {
      const v = await view(who, id); if (v.state === 'down') return { taken_down: true, nothing_done: true, why: 'It is already taken down.' }; if (v.state !== 'ready') throw fail('This carol is a draft: it has no page to take down yet.', 409);
      if (a.confirm !== true) return { taken_down: false, nothing_done: true, needs_the_persons_yes: true, what_will_happen: 'The page of "' + (v.title || 'this carol') + '" (' + v.url + ') will answer "not here" for everyone who has the link, until put_back. Nothing is deleted.', ask: 'When the person says yes, call take_down again with confirm: true.' };
      await site(who, 'POST', '/api/cards/' + id + '/down', {}); return told(who, id, { taken_down: true, note: 'put_back puts it up again at the same link.' });
    }
    if (name === 'put_back') { const v = await view(who, id); if (v.state !== 'down') return told(who, id, { put_back: false, nothing_done: true, why: v.state === 'ready' ? 'It is already up.' : 'This carol was not taken down.' }); await site(who, 'POST', '/api/cards/' + id + '/up', {}); return told(who, id, { put_back: true }); }
    if (name === 'delete_carol') {
      const v = await view(who, id);
      if (a.confirm !== true) return { deleted: false, nothing_done: true, needs_the_persons_yes: true, what_will_happen: '"' + (v.title || 'This carol') + '" will be deleted for good: ' + (v.state === 'ready' ? 'its page stops working for everyone who has the link, and ' : '') + 'its words, ' + plural(v.photos.length, 'photo') + (v.takes.length ? ', song and video are' : ' are') + ' removed and cannot be brought back.' + (v.paid && v.takes.length ? ' The credit spent on its song is not returned.' : ''), ask: 'When the person says yes to deleting this carol, call delete_carol again with confirm: true.' };
      await site(who, 'DELETE', '/api/cards/' + id); return { deleted: true };
    }
    throw fail('unknown tool');
  }

  // ---------- the MCP App: the live card as one self-contained page (connect-ui.js), kept per build ----------
  const PANEL_MIME = 'text/html;profile=mcp-app';
  let panelFor = '', panelPage = '';
  function panelHtml() {
    if (panelFor === d.build() && panelPage) return panelPage;
    const read = function (f) { return fs.readFileSync(path.join(d.root, f), 'utf8'); };
    panelPage = UI.panel({ name: NAME, site: SITE, art: read('art.js'), engine: read('engine.js'), fonts: read('fonts.js'), sdk: fs.readFileSync(path.join(__dirname, 'mcp-app.js'), 'utf8') }); panelFor = d.build();
    return panelPage;
  }
  const panelInfo = function () { return { uri: panelUri(), name: 'preview', title: NAME, description: 'The live card, playing in the chat: silent on the template\'s tempo before there is a song, with the song after, following every edit.', mimeType: PANEL_MIME }; };
  const isPanel = function (uri) { return typeof uri === 'string' && uri.indexOf('ui://' + CFG.app + '/preview/') === 0; };
  const toolList = function () { return TOOLS.map(function (t) { return t.name === 'preview_carol' ? Object.assign({}, t, { _meta: { ui: { resourceUri: panelUri() } } }) : t; }); };

  // ---------- MCP: the 2026-07-28 revision (no initialize; server/discover; results that say how long they keep) and the earlier ones ----------
  const MODERN = '2026-07-28', VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'], VKEY = 'io.modelcontextprotocol/protocolVersion';
  const SERVER = { name: CFG.app, title: NAME, version: '1.0.0' }, CAPS = { tools: {}, resources: {} }, KEPT = ['tools/list', 'resources/list', 'resources/templates/list', 'prompts/list', 'resources/read'];
  async function rpc(m, req, who) {
    if (!m || m.jsonrpc !== '2.0' || typeof m.method !== 'string') return { jsonrpc: '2.0', id: m && m.id !== undefined ? m.id : null, error: { code: -32600, message: 'not a JSON-RPC request' } };
    if (m.id === undefined) return null;                             // a notification: nothing to answer
    const meta = m.params && m.params._meta, modern = req.headers['mcp-protocol-version'] === MODERN || !!(meta && meta[VKEY]);
    const ok = function (result) {
      if (modern) { result = Object.assign({}, result, { resultType: 'complete', _meta: Object.assign({}, result._meta, { 'io.modelcontextprotocol/serverInfo': SERVER }) }); if (KEPT.indexOf(m.method) >= 0) result = Object.assign({ ttlMs: 0, cacheScope: 'private' }, result); }
      return { jsonrpc: '2.0', id: m.id, result: result };
    };
    if (m.method === 'initialize') { const want = m.params && m.params.protocolVersion; return ok({ protocolVersion: VERSIONS.indexOf(want) >= 0 ? want : VERSIONS[0], capabilities: CAPS, serverInfo: SERVER, instructions: SAYS }); }
    if (m.method === 'server/discover') return ok({ supportedVersions: [MODERN].concat(VERSIONS), capabilities: CAPS, instructions: SAYS });
    if (m.method === 'ping') return ok({});
    if (m.method === 'tools/list') return ok({ tools: toolList() });
    if (m.method === 'tools/call') {
      const p = m.params || {};
      if (!TOOLS.some(function (t) { return t.name === p.name; })) return { jsonrpc: '2.0', id: m.id, error: { code: -32602, message: 'unknown tool: ' + str(p.name, 60) } };
      try {
        const out = await call(p.name, p.arguments, { user: who.user, ip: who.ip });
        // (what the page in the chat draws from is for the page: the words Claude reads leave it out)
        const said = out && out.preview ? Object.assign({}, out, { preview: undefined }) : out;
        return ok({ content: [{ type: 'text', text: JSON.stringify(said, null, 1) }], structuredContent: out });
      } catch (e) {
        if (!e.said) { console.error('connector:', p.name, e.message); return ok({ content: [{ type: 'text', text: 'Could not do that: something went wrong on our side. Try again in a moment.' }], isError: true }); }
        return ok({ content: [{ type: 'text', text: (e.refused ? 'Not saved. ' : 'Could not do that: ') + e.message }], isError: true });
      }
    }
    if (m.method === 'resources/list') return ok({ resources: [panelInfo()] });
    if (m.method === 'resources/templates/list') return ok({ resourceTemplates: [] });
    if (m.method === 'resources/read') {
      if (!m.params || !isPanel(m.params.uri)) return { jsonrpc: '2.0', id: m.id, error: { code: -32602, message: 'there is no such resource' } };
      // the page may ask the site for fonts, photos and the song, and nothing else
      return ok({ contents: [{ uri: m.params.uri, mimeType: PANEL_MIME, text: panelHtml(), _meta: { ui: { prefersBorder: true, csp: { connectDomains: [SITE], resourceDomains: [SITE] } } } }] });
    }
    if (m.method === 'prompts/list') return ok({ prompts: [] });
    return { jsonrpc: '2.0', id: m.id, error: { code: -32601, message: 'method not found: ' + str(m.method, 60) } };
  }
  function bytes(req, max) {
    return new Promise(function (done, no) {
      const parts = []; let n = 0, over = false;
      req.on('data', function (c) { if (!Buffer.isBuffer(c)) c = Buffer.from(c); n += c.length; if (n > max) { if (!over) { over = true; no(fail('That is too large.', 413)); req.resume(); } } else parts.push(c); });
      req.on('end', function () { if (!over) done(Buffer.concat(parts)); }); req.on('error', no);
    });
  }
  // Streamable HTTP, without sessions: every POST is answered on its own with plain JSON.
  async function mcp(req, res) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, accept, authorization, mcp-protocol-version, mcp-session-id', 'Access-Control-Expose-Headers': 'WWW-Authenticate', 'Cache-Control': 'no-store' };
    const send = function (code, o, more) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json' }, cors, more)); res.end(o === undefined ? '' : JSON.stringify(o)); }, err = function (code, n, msg, more) { return send(code, { jsonrpc: '2.0', id: null, error: { code: n, message: msg } }, more); };
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    if (req.method !== 'POST') { res.writeHead(405, Object.assign({ Allow: 'POST, OPTIONS' }, cors)); return res.end(); }
    // (requests a minute for one token; five times that for one address. The admin may set the limit "connectorPerMinute".)
    const perMinute = d.limit('connectorPerMinute') > 0 ? d.limit('connectorPerMinute') : 120;
    if (d.tooMany(req, 'mcp', perMinute * 5, 6e4)) return err(429, -32000, 'too many requests, slow down', { 'Retry-After': '30' });
    await d.ready;
    const t = await oauth.playerOf(req), user = t && await db.get('SELECT * FROM users WHERE id = ?', [t.uid]);
    if (!user) d.tooMany(req, 'adminkey', 30, 6e5);   // (a knock on /mcp with no good token counts as one for this address, as it did when this door was only the admin's: server.js)
    if (!user) return err(401, -32001, 'Sign in to ' + NAME + ' to use this connector: add ' + SITE + '/mcp in Claude and sign in when it asks.', { 'WWW-Authenticate': oauth.challenge });
    if (user.banned) return err(403, -32001, 'This account has been closed. Write to ' + CFG.support + '.');
    if (d.tooMany(req, 'mcpt', perMinute, 6e4, t.key)) return err(429, -32000, 'too many requests for this connection: wait a minute', { 'Retry-After': '30' });
    let m; try { m = JSON.parse((await bytes(req, 200000)).toString() || 'null'); } catch (e) { return e.code === 413 ? err(413, -32600, 'that request is too large (200 kB at most)') : err(400, -32700, 'that is not JSON'); }
    const who = { user: user, ip: req.headers['fly-client-ip'] || '' };
    if (Array.isArray(m)) {
      if (m.length > 20) return err(400, -32600, 'at most 20 requests in a batch');
      const out = []; for (const x of m) { const r = await rpc(x, req, who); if (r) out.push(r); }   // (in order: a batch may hold writes)
      return out.length ? send(200, out) : (res.writeHead(202, cors), res.end());
    }
    const out = await rpc(m, req, who);
    if (!out) { res.writeHead(202, cors); return res.end(); }
    send(200, out);
  }

  // ---------- the connector's own pages: the upload page, the preview, their media, a template's picture ----------
  const HEAD = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' };
  const htmlOut = function (res, code, body, more) { res.writeHead(code, Object.assign({ 'Content-Type': 'text/html; charset=utf-8' }, HEAD, more)); res.end(body); };
  const jsonOut = function (res, code, o) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json' }, HEAD)); res.end(JSON.stringify(o)); };
  const spent = function (res, asJson) { const why = 'This link has run out, or is not one of ours. Ask Claude for a new one.'; return asJson ? jsonOut(res, 403, { error: why }) : htmlOut(res, 403, d.page('This link has run out', '<h1>This link has run out</h1><p>Links from Claude work for a little while, for one carol. Go back to Claude and ask for a new one.</p>'), { 'X-Frame-Options': 'DENY' }); };
  async function pages(req, res, url) {
    const p = url.pathname, get = req.method === 'GET' || req.method === 'HEAD';
    await d.ready;
    let m;
    if ((m = /^\/mcp\/fonts\/([A-Za-z0-9][\w-]{0,60}\.ttf)$/.exec(p)) && get) { res.setHeader('Access-Control-Allow-Origin', '*'); const inner = Readable.from([]); Object.assign(inner, { method: 'GET', url: '/fonts/' + m[1], headers: {} }); return d.handle(inner, res); }
    if ((m = /^\/mcp\/template\/([a-z0-9][a-z0-9-]{0,78})(\.jpg)?$/.exec(p)) && get) {
      if (d.tooMany(req, 'mcptpl', 240, 6e4)) return jsonOut(res, 429, { error: 'Slow down a little.' });
      const t = liveTemplate(m[1]); if (!t) return htmlOut(res, 404, d.page('No such look', '<h1>That look is not here</h1><p>It may have been switched off. Ask Claude for another.</p>'));
      if (m[2]) { const jpg = await still(t); res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': jpg.length, 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' }); return res.end(jpg); }
      return htmlOut(res, 200, UI.previewPage({ build: d.build(), title: t.name + ' · ' + NAME, data: { rev: 't', title: t.name, status: 'The look "' + t.name + '", with made-up words where yours will go', engine: sample(t), template: null, photos: [], song: null, card_url: '' } }), { 'Cache-Control': 'no-cache' });
    }
    if ((m = /^\/mcp\/photos\/([^\/]{1,300})(?:\/(list|photo\/[A-Za-z0-9]{2,40}))?$/.exec(p))) {
      const k = await unseal(m[1], ['u']), base = '/mcp/photos/' + m[1];
      if (!k) return spent(res, !!m[2] || !get);
      if (m[2] === 'list' && get) {
        const v = (await ask(k.uid, 'GET', '/api/cards/' + k.row.id)).json.card; if (!v) return spent(res, true);
        return jsonOut(res, 200, { title: (v.answers && v.answers.to) || v.title || 'your carol', max: d.limit('photosPerCarol'), room: Math.max(0, d.limit('photosPerCarol') - v.photos.length), photos: v.photos.map(function (ph) { return { id: ph.id, url: base + '/photo/' + ph.id }; }) });
      }
      if (m[2] && get) return pass(k.uid, req, res, '/api/cards/' + k.row.id + '/photos/' + m[2].slice(6));
      if (!m[2] && get) return htmlOut(res, 200, d.page('Add photos', UI.uploadInner({ base: base, bytes: d.limit('photoBytes') })), { 'X-Frame-Options': 'DENY' });
      if (!m[2] && req.method === 'POST') {
        // THE RIGHTS TICK: the page sends this only while its box is ticked, and nothing but this page adds a photo for the connector
        if (req.headers['x-photos-ok'] !== 'yes') { req.resume(); return jsonOut(res, 400, { error: 'Tick the box first: these must be photos you may use.' }); }
        if (d.tooMany(req, 'mcpup', 60, 36e5, k.row.id)) { req.resume(); return jsonOut(res, 429, { error: 'That is a lot of photos. Try again in a while.' }); }
        const max = d.limit('photoBytes'); if (+req.headers['content-length'] > max) { req.resume(); return jsonOut(res, 413, { error: 'That photo is larger than ' + Math.round(max / 1048576) + ' MB.' }); }
        let buf; try { buf = await bytes(req, max); } catch (e) { return jsonOut(res, 413, { error: 'That photo is larger than ' + Math.round(max / 1048576) + ' MB.' }); }
        const r = await ask(k.uid, 'POST', '/api/cards/' + k.row.id + '/photos', buf, { 'content-type': String(req.headers['content-type'] || 'application/octet-stream') });
        return jsonOut(res, r.status, r.status === 200 && r.json.photo ? { ok: true, photo: { id: r.json.photo.id, w: r.json.photo.w, h: r.json.photo.h } } : { error: r.json.error || 'That photo did not go through.' });
      }
    }
    if ((m = /^\/mcp\/preview\/([^\/]{1,300})(\/data)?$/.exec(p)) && get) {
      const k = await unseal(m[1], ['v']); if (!k) return spent(res, !!m[2]);
      if (!m[2]) return htmlOut(res, 200, UI.previewPage({ build: d.build(), title: 'Your carol · ' + NAME, dataUrl: '/mcp/preview/' + m[1] + '/data' }));
      const v = (await ask(k.uid, 'GET', '/api/cards/' + k.row.id)).json.card; if (!v) return spent(res, true);
      const pv = previewOf(v).preview, tok = m[1];   // (the page keeps the link it was opened with: its media runs out when it does)
      pv.photos = v.pids.map(function (pid) { return { id: pid, url: '/mcp/media/' + tok + '/photo/' + pid }; }); if (pv.song) pv.song.url = '/mcp/media/' + tok + '/song/' + v.take; pv.template = null;
      return jsonOut(res, 200, { preview: pv });
    }
    if ((m = /^\/mcp\/media\/([^\/]{1,300})\/(photo|song)\/([A-Za-z0-9]{2,40})$/.exec(p)) && get) {
      const k = await unseal(m[1], ['v']); if (!k) return spent(res, true);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return pass(k.uid, req, res, '/api/cards/' + k.row.id + (m[2] === 'photo' ? '/photos/' : '/song/') + m[3]);
    }
    jsonOut(res, 404, { error: 'There is nothing at this address.' });
  }

  // which requests are the connector's: /mcp without the admin's key (that one stays server.js's), its own pages, and signing in
  const owns = function (req, url) { const p = url.pathname; return (p === '/mcp' && !url.searchParams.has('admin') && !req.headers['x-admin-key']) || p.indexOf('/mcp/') === 0 || p.indexOf('/oauth/') === 0 || p.indexOf('/.well-known/oauth-') === 0 || p === '/.well-known/openid-configuration'; };
  async function handle(req, res, url) {
    if (url.pathname === '/mcp') return mcp(req, res);
    if (await oauth.handle(req, res, url)) return;
    return pages(req, res, url);
  }
  const ROUTES = OAuth.ROUTES.concat(['GET /mcp/photos/:token', 'POST /mcp/photos/:token', 'GET /mcp/preview/:token', 'GET /mcp/template/:id', 'GET /mcp/fonts/:file']);
  return { owns: owns, handle: handle, call: call, TOOLS: TOOLS, toolList: toolList, panelHtml: panelHtml, panelUri: panelUri, seal: seal, unseal: unseal, oauth: oauth, ROUTES: ROUTES, findTemplates: findTemplates, suggest: suggest, SAYS: SAYS };
};