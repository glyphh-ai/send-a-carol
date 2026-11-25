// The legal pages: the Markdown files beside this one, each drawn as one whole HTML page. No dependency, no script
// on the page, nothing a file says is ever passed through as HTML: every word is escaped, and the only Markdown
// understood is a small, safe part of it (headings, paragraphs, lists, tables, bold, italic, and links to this
// site's own paths, to a place on the same page, or to an email address). A link to anywhere else is drawn as
// plain words.
//
// The product's name, address, prices and limits are never typed in a Markdown file. They are tokens ({{name}},
// {{domain}}, {{site}}, {{packs}}, {{takes}}, {{photos}}), filled in here from ../config.js, so a
// rename or a new price is one change in one file.
//
//   list()         every page: { slug, title, short, version, updated, effective, summary, path, hash, placeholders }
//   page(slug)     the page as a complete HTML document (a string), or null when there is no such page
//   index()        /legal: every page with its summary, as one page
//   missing()      the page for an address under /legal that has no page
//   version(slug)  the version a person accepts ("2026-11-18.1"), or null
//   hash(slug)          the SHA-256 of the file as it is on disk
//   placeholders(slug)  every [[OWNER: ...]] still in the file. A page with any is not ready.
//   ready(slug)         true when the page has no placeholder left
//   doc(slug)           the page read: { meta, body, html, ids, links, placeholders }
//   CSP                 the Content-Security-Policy to send with every page here: nothing may load or run, and the
//                       only style is the page's own (named by its hash)
//
// THESE ARE DRAFTS FOR A LAWYER'S REVIEW, written by someone who is not a lawyer. Every page says so in a small
// plain banner at its top, "Draft: under legal review", whether or not it still has a placeholder. One switch
// takes the banner off: LEGAL_DRAFT_BANNER=off (anything else, or unset, leaves it on). Each file's front matter
// carries `status: draft ...`, which is not shown on the page.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DIR = __dirname;
const SLUGS = ['terms', 'privacy', 'refunds', 'acceptable-use', 'photos'];

// ---- the product's name and address: the repo's config module, or these when it is not there yet ----
const CFG = { name: 'Send a Carol', domain: 'sendacarol.com', site: 'https://sendacarol.com', support: 'support@glyphh.ai', company: 'Glyphh AI LLC',
  packs: [{ id: 'one', credits: 1, cents: 299, label: '1 carol' }, { id: 'five', credits: 5, cents: 999, label: '5 carols' }, { id: 'ten', credits: 10, cents: 1799, label: '10 carols' }],
  finalSale: 'One-time purchase. Not refundable.', limits: { takesPerCarol: 3, photosPerCarol: 8, photoBytes: 25 * 1024 * 1024, freeDrafts: 3 },
  brand: { ink: '#2a1a2e', berry: '#c2185b', coral: '#ff6b5e', gold: '#f2b632', cream: '#fff8ee', night: '#1d1230' } };
const LIMITS = CFG.limits;                                   // (the defaults, for a limit the config does not give)
try {
  const c = require('../config.js');
  ['name', 'domain', 'site', 'support', 'company', 'finalSale'].forEach(function (k) { if (c && typeof c[k] === 'string' && c[k].trim()) CFG[k] = c[k].trim(); });
  // (the packs and the limits are the config's own objects, not copies: a price changed there is the price here)
  if (c && Array.isArray(c.packs) && c.packs.length) CFG.packs = c.packs;
  if (c && c.limits && typeof c.limits === 'object') CFG.limits = c.limits;
  // (a colour goes into the page's style, so only a plain hex colour is taken from the config; anything else keeps the default)
  if (c && c.brand && typeof c.brand === 'object') { const b = {}; Object.keys(CFG.brand).forEach(function (k) { b[k] = typeof c.brand[k] === 'string' && /^#[0-9a-fA-F]{6}$/.test(c.brand[k]) ? c.brand[k].toLowerCase() : CFG.brand[k]; }); CFG.brand = b; }
} catch (e) { /* (no config module: the defaults above) */ }
CFG.site = CFG.site.replace(/\/+$/, '');
// The tokens a Markdown file may use, so that no name, price or limit is ever typed in one:
//   {{name}} {{domain}} {{site}}              the product's name and address
//   {{takes}} {{photos}}                      limits.takesPerCarol, limits.photosPerCarol
//   {{freeDrafts}} {{photoSize}}              limits.freeDrafts, and limits.photoBytes in words ("25 MB")
//   {{packs}}                                 a table of the packs: what each holds, its price, and the final-sale
//                                             sentence after every price. It stands alone, as a paragraph of its own.
const money = function (cents) { return '$' + (cents / 100).toFixed(2); };
const cell = function (v) { return String(v).replace(/[|\r\n]+/g, ' ').trim(); };
const packsTable = function () {
  return '| Pack | Price | The rule |\n| --- | --- | --- |\n' + CFG.packs.map(function (p) {
    const label = cell(p.label || (p.credits + (p.credits === 1 ? ' carol' : ' carols'))), priced = typeof p.cents === 'number' && p.cents > 0;
    return '| ' + label + ' | ' + (priced ? money(p.cents) : 'Coming soon') + ' | ' + (priced ? cell(CFG.finalSale) : 'Cannot be bought yet.') + ' |';
  }).join('\n');
};
const TOKENS = {
  name: function () { return CFG.name; }, domain: function () { return CFG.domain; }, site: function () { return CFG.site; },
  takes: function () { return String(lim('takesPerCarol')); }, photos: function () { return String(lim('photosPerCarol')); },
  freeDrafts: function () { return String(lim('freeDrafts')); },
  // {{photoSize}}: the largest original photo, limits.photoBytes in words ("25 MB")
  photoSize: function () { const mb = lim('photoBytes') / (1024 * 1024); return (mb >= 1 ? String(Math.round(mb * 10) / 10) + ' MB' : String(Math.round(lim('photoBytes') / 1024)) + ' KB'); },
  packs: packsTable,
};
function lim(k) { const v = CFG.limits[k]; return typeof v === 'number' && v > 0 ? v : LIMITS[k]; }
const fill = function (s) { return String(s).replace(/\{\{(name|domain|site|takes|photos|freeDrafts|photoSize|packs)\}\}/g, function (_, k) { return TOKENS[k](); }); };
// (what a drawn page depends on besides its file: when a price or a limit changes, the page is drawn again)
const sig = function () { return JSON.stringify([CFG.name, CFG.domain, CFG.site, CFG.finalSale, CFG.packs, CFG.limits.takesPerCarol, CFG.limits.photosPerCarol, CFG.limits.photoBytes, CFG.limits.freeDrafts]); };

const esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
const slugOf = function (s) { return String(s).toLowerCase().replace(/\[\[owner:[^\]]*\]\]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section'; };
// A link may go to a path on this site ("/legal/terms", "/legal/terms#contact", "/"), to a place on the same page
// ("#contact") or to an email address. Nothing else: no scheme, no "//host", no backslash, no control character.
const SAFE_PATH = /^\/(?!\/)[A-Za-z0-9\-._~\/%]*(\?[A-Za-z0-9\-._~%=&]*)?(#[A-Za-z0-9\-._~]*)?$/, SAFE_HASH = /^#[A-Za-z0-9\-._~]+$/, SAFE_MAIL = /^mailto:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\?subject=[A-Za-z0-9%\-._~+]*)?$/;
const safeHref = function (h) { return typeof h === 'string' && h.length < 300 && (SAFE_PATH.test(h) || SAFE_HASH.test(h) || SAFE_MAIL.test(h)); };
const OWNER = /\[\[OWNER:\s*([^\]]*)\]\]/g;

// ---- the words inside a block: escaped, then bold, italic, links and the owner's placeholders ----
function inline(raw, ctx) {
  const re = /\[\[OWNER:\s*([^\]]*)\]\]|\[([^\]\n]+)\]\(([^)\s]*)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let out = '', last = 0, m;
  while ((m = re.exec(raw))) {
    out += esc(raw.slice(last, m.index)); last = m.index + m[0].length;
    if (m[1] !== undefined) { ctx.placeholders.push(m[1].trim()); out += '<mark class="owner"><span class="vh">To be filled in by the owner: </span>' + esc(m[1].trim()) + '</mark>'; }
    else if (m[2] !== undefined) {
      if (safeHref(m[3])) { ctx.links.push(m[3]); out += '<a href="' + esc(m[3]) + '">' + inline(m[2], ctx) + '</a>'; }
      else { ctx.refused.push(m[3]); out += inline(m[2], ctx); }           // (a link this page may not make: its words only)
    }
    else if (m[4] !== undefined) out += '<strong>' + inline(m[4], ctx) + '</strong>';
    else out += '<em>' + inline(m[5], ctx) + '</em>';
  }
  return out + esc(raw.slice(last));
}
const cells = function (line) { return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return c.trim(); }); };
const isRule = function (line) { return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line); };

// ---- the blocks ----
function markdown(src, ctx) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n'), out = [], seen = {};
  const idFor = function (text) { let id = slugOf(text), n = 2; const base = id; while (seen[id]) id = base + '-' + n++; seen[id] = 1; ctx.ids.push(id); return id; };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{2,4})\s+(.+?)\s*#*$/.exec(line);
    if (h) { const lv = h[1].length, id = idFor(h[2].replace(/\*|\[|\]|\([^)]*\)/g, '')); if (lv === 2) ctx.toc.push({ id: id, text: h[2] }); out.push('<h' + lv + ' id="' + esc(id) + '">' + inline(h[2], ctx) + '</h' + lv + '>'); i++; continue; }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && isRule(lines[i + 1])) {
      const head = cells(line), rows = []; i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      ctx.tables++;
      out.push('<div class="tbl" role="region" tabindex="0" aria-label="Table ' + ctx.tables + ': ' + esc(head.join(', ')) + '"><table><thead><tr>' + head.map(function (c) { return '<th scope="col">' + inline(c, ctx) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr>' + head.map(function (_, k) { return (k === 0 ? '<th scope="row">' : '<td data-h="' + esc(head[k]) + '">') + inline(r[k] || '', ctx) + (k === 0 ? '</th>' : '</td>'); }).join('') + '</tr>'; }).join('') + '</tbody></table></div>');
      continue;
    }
    const ul = /^\s*[-*]\s+(.*)$/.exec(line), ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      const re = ul ? /^\s*[-*]\s+(.*)$/ : /^\s*\d+[.)]\s+(.*)$/, items = [];
      while (i < lines.length) {
        const m = re.exec(lines[i]);
        if (m) { items.push(m[1]); i++; }
        else if (lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += ' ' + lines[i].trim(); i++; }   // (a long item carried on to the next line)
        else break;
      }
      out.push((ul ? '<ul>' : '<ol>') + items.map(function (t) { return '<li>' + inline(t, ctx) + '</li>'; }).join('') + (ul ? '</ul>' : '</ol>'));
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,4})\s/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i]) && !(/^\s*\|.*\|\s*$/.test(lines[i]) && i + 1 < lines.length && isRule(lines[i + 1]))) para.push(lines[i++].trim());
    if (para.length) out.push('<p>' + inline(para.join(' '), ctx) + '</p>'); else i++;
  }
  return out.join('\n');
}

// ---- a file: its front matter (key: value, one a line, between two lines of ---) and its body ----
function parse(text) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text.replace(/\r\n?/g, '\n')), meta = {};
  if (m) m[1].split('\n').forEach(function (l) { const k = /^([a-z_]+):\s*(.*)$/.exec(l); if (k) meta[k[1]] = k[2].trim(); });
  return { meta: meta, body: m ? text.replace(/\r\n?/g, '\n').slice(m[0].length) : text };
}
const cache = {};
function doc(slug) {
  if (SLUGS.indexOf(slug) < 0) return null;
  const file = path.join(DIR, slug + '.md');
  let stat; try { stat = fs.statSync(file); } catch (e) { return null; }
  const c = cache[slug], now = sig(); if (c && c.mtime === stat.mtimeMs && c.sig === now) return c.doc;
  // (the hash is of the file as it is; the name and the address are filled in before anything is read from it)
  const text = fs.readFileSync(file, 'utf8'), p = parse(fill(text)), ctx = { ids: [], links: [], refused: [], placeholders: [], toc: [], tables: 0 };
  const html = markdown(p.body, ctx), head = { ids: [], links: [], refused: [], placeholders: [], toc: [], tables: 0 };
  const d = { slug: slug, meta: p.meta, body: p.body, html: html, ids: ctx.ids, links: ctx.links, refused: ctx.refused, toc: ctx.toc, hash: crypto.createHash('sha256').update(text).digest('hex'),
    summaryHtml: inline(p.meta.summary || '', head), effectiveHtml: inline(p.meta.effective || '', head), placeholders: head.placeholders.concat(ctx.placeholders) };
  cache[slug] = { mtime: stat.mtimeMs, sig: now, doc: d };
  return d;
}
const dateWords = function (v) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][+m[2] - 1] + ' ' + +m[3] + ', ' + m[1] : ''; };

// ---- the page: the brand's year-round colours (config.brand). Night head, cream page, ink words, berry links, gold
//      rules, the system's own type. Gold is never the colour of words on cream (too faint): those are --oldgold. ----
const B = CFG.brand;
const CSS = [
  ':root{--ink:' + B.ink + ';--soft:#5f5263;--night:' + B.night + ';--cream:' + B.cream + ';--berry:' + B.berry + ';--coral:' + B.coral + ';--gold:' + B.gold + ';--oldgold:#7a5200;--line:#eadfce;--frost:#fbeedd;--pale:#ddd3e6;',
  '--serif:Georgia,"Iowan Old Style","Palatino Linotype","Times New Roman",serif;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Arial,sans-serif}',
  '*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-padding-top:20px}',
  'body{margin:0;background:var(--cream);color:var(--ink);font:17px/1.6 var(--sans);overflow-wrap:break-word}',
  'a{color:var(--berry);text-underline-offset:3px}a:hover{color:var(--ink)}',
  ':focus-visible{outline:3px solid var(--gold);outline-offset:3px;border-radius:6px}',
  '.skip{position:absolute;left:-999px;top:8px;background:#fff;color:var(--ink);padding:8px 14px;border-radius:8px;z-index:5}.skip:focus{left:8px}',
  '.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
  '.wrap{width:min(1080px,100% - 40px);margin:0 auto}',
  'header.top{background:var(--night);color:#fff;padding:env(safe-area-inset-top) 0 0;border-bottom:4px solid var(--gold)}',
  'header.top .bar{display:flex;align-items:center;gap:18px;min-height:60px}',
  '.mark{font:italic 700 25px var(--serif);color:#fff;text-decoration:none;white-space:nowrap}.mark:hover{color:#fff}',
  'header.top .back{margin-left:auto;font:700 clamp(11px,3vw,13px) var(--sans);letter-spacing:.04em;text-transform:uppercase;text-decoration:none;color:#fff;border:1px solid var(--gold);border-radius:999px;padding:9px clamp(11px,3.4vw,18px);white-space:nowrap}header.top .back:hover{background:rgba(255,255,255,.1);color:#fff}',
  'header.top .head{padding:34px 0 40px}',
  '.kick{font:700 13px var(--sans);letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:0 0 10px}',
  'h1{font:700 clamp(32px,6vw,50px)/1.1 var(--serif);letter-spacing:.01em;margin:0;color:#fff}',
  '.meta{margin:16px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px 22px;color:var(--pale);font-size:15px}.meta b{color:#fff;font-weight:600}',
  '.docs{background:var(--frost);border-bottom:1px solid var(--line)}',
  '.docs ul{list-style:none;margin:0;padding:10px 0;display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch}',
  '.docs a{display:block;white-space:nowrap;text-decoration:none;color:var(--ink);font-size:14.5px;font-weight:600;padding:8px 14px;border-radius:999px;background:#fff;border:1px solid var(--line)}',
  '.docs a[aria-current]{background:var(--berry);border-color:var(--berry);color:#fff}',
  '.cols{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"sum" "toc" "main";gap:24px;padding:28px 0 60px}',
  '.sum{grid-area:sum}.toc{grid-area:toc}main{grid-area:main}',
  '@media(min-width:960px){.cols{grid-template-columns:250px minmax(0,74ch);grid-template-areas:"toc sum" "toc main";gap:30px 54px;padding-top:44px}.toc{position:sticky;top:20px;align-self:start;max-height:calc(100vh - 40px);overflow:auto}}',
  '.toc{border:1px solid var(--line);border-radius:14px;background:#fff;padding:16px 18px}',
  '.toc h2{font:700 13px var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--oldgold);margin:0 0 8px}',
  '.toc ul{list-style:none;margin:0;padding:0;font-size:15px;line-height:1.4}.toc li{margin:8px 0}.toc a{text-decoration:none}.toc a:hover{text-decoration:underline}',
  'main{min-width:0}',
  '.sum{background:#fff;border:1px solid var(--line);border-left:5px solid var(--gold);border-radius:14px;padding:20px 22px}',
  '.sum h2{font:700 13px var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--night);margin:0 0 8px}',
  '.sum p{margin:0}.sum .not{margin-top:10px;font-size:15px;color:var(--soft)}',
  'article h2{font:700 27px/1.2 var(--serif);color:var(--night);margin:44px 0 12px;border-top:1px solid var(--gold);padding-top:26px}',
  'article>h2:first-child{margin-top:0;border-top:0;padding-top:0}',
  'article h3{font:700 21px/1.25 var(--serif);margin:30px 0 8px}article h4{font:700 16px var(--sans);margin:22px 0 6px}',
  'article p{margin:0 0 14px}article ul,article ol{margin:0 0 16px;padding-left:24px}article li{margin:0 0 8px}',
  'strong{font-weight:700}',
  '.tbl{overflow-x:auto;margin:6px 0 22px;border:1px solid var(--line);border-radius:14px;background:#fff}',
  'table{border-collapse:collapse;width:100%;font-size:15.5px;line-height:1.45}',
  'th,td{text-align:left;vertical-align:top;padding:12px 14px;border-bottom:1px solid var(--line)}',
  'thead th{font:700 12.5px var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--oldgold);background:var(--frost);white-space:nowrap}',
  'tbody th{font-weight:700;min-width:150px}tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}',
  // (on a phone a table is a stack of cards: each cell says which column it is)
  '@media(max-width:640px){.tbl{border:0;background:none;overflow:visible}table,tbody,tr,th,td{display:block;width:auto}thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}',
  'tbody tr{border:1px solid var(--line);border-radius:14px;background:#fff;margin:0 0 12px;padding:6px 0}tbody th{font:700 19px/1.25 var(--serif);color:var(--night);border:0;padding:10px 16px 4px;min-width:0}',
  'tbody td{border:0;padding:6px 16px}tbody td:empty{display:none}tbody td::before{content:attr(data-h);display:block;font:700 11.5px var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--oldgold);margin-bottom:1px}}',
  'mark.owner{background:#fff1b8;color:#4a3500;border:1px dashed #7a5c12;border-radius:6px;padding:1px 6px;font-weight:600;-webkit-box-decoration-break:clone;box-decoration-break:clone}',
  'mark.owner::before{content:"To fill in: ";font-weight:700}',
  // (the banner of a page under review, and the list of pages at /legal)
  '.draft{margin:0;background:#fff1b8;color:#4a3500;border-bottom:1px solid #7a5c12;text-align:center;font:600 14.5px/1.4 var(--sans);padding:8px 16px}',
  '.pages{list-style:none;margin:0;padding:34px 0 60px;display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr))}',
  '.pages li{background:#fff;border:1px solid var(--line);border-top:3px solid var(--gold);border-radius:14px;padding:20px 22px}.pages h2{font:700 24px/1.2 var(--serif);margin:0 0 6px}.pages h2 a{text-decoration:none}.pages p{margin:0 0 10px;font-size:15.5px}.pages small{color:var(--soft);font-size:13.5px}',
  'footer{background:var(--night);color:var(--pale);border-top:4px solid var(--gold);padding:34px 0 calc(34px + env(safe-area-inset-bottom));font-size:15px}',
  'footer a{color:#fff}footer p{margin:0 0 8px}footer ul{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px}',
  '@media print{header.top{background:none;color:#000;border:0}h1,.mark,.meta b{color:#000}.meta,.kick{color:#333}.docs,.toc,.back,.skip,footer ul{display:none}.cols{display:block;padding:0}footer{background:none;color:#000;border:0}footer a{color:#000}}',
].join('\n');

// the page's one style block, exactly as it is written into the page: the policy names it by its hash, so no
// other style and no script can be on a page here, whatever a file says
const STYLE = '\n' + CSS + '\n';
const CSP = "default-src 'none'; style-src 'sha256-" + crypto.createHash('sha256').update(STYLE).digest('base64') + "'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
// "Draft: under legal review": on every page, unless LEGAL_DRAFT_BANNER=off
const bannerOn = function () { return !/^(off|0|false|no)$/i.test(String(process.env.LEGAL_DRAFT_BANNER || '').trim()); };
const BANNER = '<p class="draft" role="note">Draft: under legal review</p>\n';
const NAME = esc(CFG.name), MAIL = esc(CFG.support);
const HEAD = function (title, descr, at) {
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="theme-color" content="' + B.night + '">\n' +
    '<title>' + esc(title) + ' · ' + NAME + '</title>\n<meta name="description" content="' + esc(descr) + '">\n<link rel="canonical" href="' + esc(CFG.site + at) + '">\n<style>' + STYLE + '</style>\n</head>\n<body>\n' + (bannerOn() ? BANNER : '');
};
const TOP = function (kick, h1, meta) {
  return '<header class="top"><div class="wrap"><div class="bar"><a class="mark" href="/" aria-label="' + NAME + ', home">' + NAME + '</a><a class="back" href="/">Back to ' + NAME + '</a></div>' +
    '<div class="head"><p class="kick">' + esc(kick) + '</p><h1>' + esc(h1) + '</h1>' + (meta || '') + '</div></div></header>\n';
};
const FOOT = function (all) {
  return '<footer><div class="wrap"><p>' + NAME + ' is a game by ' + esc(CFG.company) + '.</p><p>Questions: <a href="mailto:' + MAIL + '">' + MAIL + '</a> · (512) 489-6516</p><ul>' +
    all.map(function (x) { return '<li><a href="' + esc(x.path) + '">' + esc(x.short || x.title) + '</a></li>'; }).join('') + '<li><a href="/">Back to ' + NAME + '</a></li></ul></div></footer>\n</body>\n</html>\n';
};
// /legal: the pages, each with its summary
function index() {
  const all = list();
  return HEAD('Legal', 'The terms, the privacy policy, the refund policy, the acceptable use policy and the photo rules of ' + CFG.name + '.', '/legal') + '<a class="skip" href="#text">Skip to the list</a>\n' + TOP(CFG.name, 'Legal') +
    '<main class="wrap" id="text"><ul class="pages">' + all.map(function (x) { return '<li><h2><a href="' + esc(x.path) + '">' + esc(x.title) + '</a></h2><p>' + doc(x.slug).summaryHtml + '</p><small>Version ' + esc(x.version) + (dateWords(x.updated) ? ' · ' + esc(dateWords(x.updated)) : '') + '</small></li>'; }).join('') + '</ul></main>\n' + FOOT(all);
}
// an address under /legal with no page: said in the same look, with the way to the ones there are
function missing() {
  return HEAD('No such page', 'There is no such page here.', '/legal') + '<a class="skip" href="#text">Skip to the text</a>\n' + TOP('Legal', 'There is no such page') +
    '<main class="wrap" id="text"><ul class="pages"><li><p>The terms, the privacy policy, the refund policy, the acceptable use policy and the photo rules are all at <a href="/legal">Legal</a>.</p></li></ul></main>\n' + FOOT(list());
}
function page(slug) {
  const d = doc(slug); if (!d) return null;
  const m = d.meta, all = list(), title = m.title || slug, updated = dateWords(m.updated);
  return HEAD(title, (m.summary || '').replace(OWNER, '').slice(0, 300), '/legal/' + slug) +
    '<a class="skip" href="#text">Skip to the text</a>\n' +
    TOP('Legal', title, '<ul class="meta">' + (m.version ? '<li>Version <b>' + esc(m.version) + '</b></li>' : '') + (updated ? '<li>Last updated <b>' + esc(updated) + '</b></li>' : '') + (m.effective ? '<li>In effect from <b>' + (dateWords(m.effective) ? esc(dateWords(m.effective)) : d.effectiveHtml) + '</b></li>' : '') + '</ul>') +
    '<nav class="docs" aria-label="Legal pages"><div class="wrap"><ul>' + all.map(function (x) { return '<li><a href="' + esc(x.path) + '"' + (x.slug === slug ? ' aria-current="page"' : '') + '>' + esc(x.short || x.title) + '</a></li>'; }).join('') + '</ul></div></nav>\n' +
    // (on a phone: the summary, then what is on the page, then the text; on a wide screen what is on the page stays at the side)
    '<div class="wrap cols" id="text">\n' + (m.summary ? '<section class="sum" aria-labelledby="sum-h"><h2 id="sum-h">In plain words</h2><p>' + d.summaryHtml + '</p><p class="not">This summary is here to help. It does not replace the text below, which is what applies.</p></section>\n' : '') +
    (d.toc.length > 2 ? '<nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ul>' + d.toc.map(function (t) { return '<li><a href="#' + esc(t.id) + '">' + esc(t.text.replace(OWNER, '').replace(/\*/g, '')) + '</a></li>'; }).join('') + '</ul></nav>\n' : '') +
    '<main>\n<article>\n' + d.html + '\n</article>\n</main>\n</div>\n' + FOOT(all);
}
function list() {
  return SLUGS.map(doc).filter(Boolean).map(function (d) { return { slug: d.slug, title: d.meta.title || d.slug, short: d.meta.short || '', version: d.meta.version || '', updated: d.meta.updated || '', effective: d.meta.effective || '', summary: d.meta.summary || '', status: d.meta.status || '', path: '/legal/' + d.slug, hash: d.hash, placeholders: d.placeholders.length }; });
}
const version = function (slug) { const d = doc(slug); return d ? d.meta.version || null : null; };
const hash = function (slug) { const d = doc(slug); return d ? d.hash : null; };
const placeholders = function (slug) { const d = doc(slug); return d ? d.placeholders.slice() : []; };
const ready = function (slug) { const d = doc(slug); return !!d && d.placeholders.length === 0; };
module.exports = { page: page, index: index, missing: missing, CSP: CSP, SLUGS: SLUGS, ready: ready, placeholders: placeholders, bannerOn: bannerOn, BANNER: BANNER, money: money, list: list, version: version, hash: hash, doc: doc, CFG: CFG, fill: fill, esc: esc, inline: inline, markdown: markdown, safeHref: safeHref, CSS: CSS };
