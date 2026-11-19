'use strict';
// brand.js : the lockup, made in code so it can be swapped in a minute. The NAME, the tagline and the colours are
// config.js's; this file holds only the little mark (a note rising out of an open envelope) and how the lockup,
// the icons, the default share image and the email header are drawn from it. Nothing here is baked into an image
// file: every PNG is drawn when first asked for.
const path = require('path');
const CFG = require('./config.js');
const B = CFG.brand;

// the mark, 64 x 64. mono: one colour (currentColor or the one given), lines only, for 24 px and for print.
function markSvg(o) {
  o = o || {};
  const size = o.size || 64, mono = !!o.mono, c = o.color || 'currentColor';
  const env = mono ? '<rect x="7" y="27" width="42" height="29" rx="6" fill="none" stroke="' + c + '" stroke-width="4"/><path d="M9.5 31.5 28 45l18.5-13.5" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
    : '<rect x="6" y="26" width="44" height="31" rx="7" fill="' + B.coral + '"/><path d="M6 33c0-3.9 3.1-7 7-7h30c3.900 0 7 3.100 7 7L28 48z" fill="' + B.berry + '"/><path d="M9.5 31 28 44.500 46.500 31" fill="none" stroke="' + B.cream + '" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>';
  const n = mono ? c : B.gold;
  const note = '<g transform="rotate(8 46 16)"><ellipse cx="41.500" cy="20.500" rx="6.200" ry="4.800" transform="rotate(-22 41.500 20.500)" fill="' + n + '"/><path d="M45.300 19.500V5.500" stroke="' + n + '" stroke-width="3.400" stroke-linecap="round"/><path d="M45.300 5.500c6.500 1.200 10.200 4.800 9.700 11.500-1.800-3.600-5.200-5.200-9.700-5.500z" fill="' + n + '"/></g>';
  const spark = mono ? '' : '<circle cx="30" cy="12" r="2.200" fill="' + B.gold + '"/><circle cx="57" cy="27" r="1.700" fill="' + B.coral + '"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="' + size + '" height="' + size + '" role="img" aria-label="' + esc(CFG.name) + '">' + env + note + spark + '</svg>';
}
const esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
// the icon: the mark on a rounded night square (favicon.svg, and what the PNG icons are drawn from)
function iconSvg(size) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="' + (size || 64) + '" height="' + (size || 64) + '"><rect width="64" height="64" rx="14" fill="' + B.night + '"/><g transform="translate(8.500 7) scale(.74)">' + markSvg().replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g></svg>';
}
// the lockup for a page: the mark and the name set in the wordmark face (the page's CSS styles .brand)
function lockupHtml(o) { return '<span class="brand' + (o && o.cls ? ' ' + o.cls : '') + '">' + markSvg({ size: o && o.size || 34 }) + '<b>' + esc(CFG.name) + '</b></span>'; }

// ----- PNGs, drawn on first use -----
const made = {};
const SHAPES = { 'icon-192': [192, 192], 'icon-512': [512, 512], 'apple-touch-icon': [180, 180], 'favicon-32': [32, 32], og: [1200, 630], 'email-header': [1200, 240], 'lockup-light': [900, 220], 'lockup-dark': [900, 220], 'lockup-mono': [900, 220] };
async function png(kind) {
  if (made[kind]) return made[kind];
  const s = SHAPES[kind]; if (!s) return null;
  const R = require('./render.js'), canvas = R.canvas; R.fonts();
  const W = s[0], H = s[1], cv = canvas.createCanvas(W, H), ctx = cv.getContext('2d');
  const svg = async function (text) { return canvas.loadImage(Buffer.from(text)); };
  const lockup = async function (x, y, h, ink, mono) {   // the mark and the name on one line, h = the mark's height; returns its width
    ctx.drawImage(await svg(markSvg({ size: 256, mono: mono, color: ink })), x, y, h, h);
    ctx.font = Math.round(h * 0.74) + 'px "CT Lobster"'; ctx.fillStyle = ink; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.fillText(CFG.name, x + h * 1.12, y + h * 0.80);
    return h * 1.12 + ctx.measureText(CFG.name).width;
  };
  if (/^icon|^apple|^favicon/.test(kind)) ctx.drawImage(await svg(iconSvg(512)), 0, 0, W, H);
  else if (kind === 'og') {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, B.night); g.addColorStop(1, '#4a1942'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // a scatter of notes and dots, the same every time
    let seed = 7; const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 46; i++) { ctx.globalAlpha = 0.10 + rnd() * 0.25; ctx.fillStyle = [B.gold, B.coral, B.cream][i % 3]; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 2 + rnd() * 7, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.drawImage(await svg(markSvg({ size: 512 })), W / 2 - 110, 70, 220, 220);
    ctx.textAlign = 'center'; ctx.fillStyle = B.cream; ctx.font = '120px "CT Lobster"'; ctx.fillText(CFG.name, W / 2, 420);
    ctx.fillStyle = B.gold; ctx.font = '40px "CT Sans Semi"'; ctx.fillText(CFG.tagline, W / 2, 492);
    ctx.fillStyle = '#d9c9e6'; ctx.font = '28px "CT Sans"'; ctx.fillText(CFG.domain, W / 2, 560);
  } else if (kind === 'email-header') {
    ctx.fillStyle = B.night; ctx.fillRect(0, 0, W, H);
    ctx.font = Math.round(120 * 0.74) + 'px "CT Lobster"'; const w = 120 * 1.12 + ctx.measureText(CFG.name).width;
    await lockup((W - w) / 2, 60, 120, B.cream, false);
  } else {
    const dark = kind === 'lockup-dark', mono = kind === 'lockup-mono';
    if (dark) { ctx.fillStyle = B.night; ctx.fillRect(0, 0, W, H); }
    await lockup(40, 40, 140, dark ? B.cream : B.ink, mono);
  }
  return (made[kind] = await cv.encode('png'));
}
module.exports = { markSvg: markSvg, iconSvg: iconSvg, lockupHtml: lockupHtml, png: png, SHAPES: SHAPES, fontFile: path.join('fonts', 'Lobster-Regular.ttf') };
