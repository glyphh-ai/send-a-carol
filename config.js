'use strict';
// config.js : THE ONE PLACE for the name, the domain, the tagline, the prices and the limits. Change them here and
// nowhere else (the pages, the emails, the legal drafts, Stripe's line items and the tests all read this file).
// Tests may change a value before they load the server through CONFIG_OVERRIDE (a JSON string merged in below).
const env = process.env;

const config = {
  // ----- the brand -----
  app: 'send-a-carol',                 // the internal id: Stripe metadata.app, the storage prefix, cookie names
  name: 'Send a Carol',
  domain: 'sendacarol.com',
  site: (env.PUBLIC_URL || 'https://sendacarol.com').replace(/\/+$/, ''),
  tagline: 'Say it with a song.',
  taglines: ['Say it with a song.', 'A little song, made just for them.', 'The card that sings their name.'],
  noun: 'carol',                       // the brand's word for the song, for every occasion
  company: 'Glyphh AI LLC',
  support: 'support@glyphh.ai',
  emailFrom: 'Send a Carol <support@glyphh.ai>',
  brand: { ink: '#2a1a2e', berry: '#c2185b', coral: '#ff6b5e', gold: '#f2b632', cream: '#fff8ee', night: '#1d1230', leaf: '#1f7a5a' },

  // ----- money: one-off packs of carol credits, in US cents. A null price shows "coming soon" and cannot be bought. -----
  currency: 'usd',
  packs: [
    { id: 'one', credits: 1, cents: 499, label: '1 carol' },
    { id: 'five', credits: 5, cents: 1499, label: '5 carols' },
    { id: 'ten', credits: 10, cents: 2499, label: '10 carols' },
  ],
  finalSale: 'One-time purchase. Not refundable.',

  // ----- limits -----
  limits: {
    takesPerCarol: 3,            // songs per paid carol: the first and 2 more takes
    rewritesPerCarol: 10,        // times the agent rewrites one carol's words
    freeDrafts: 3,               // carols an account may draft with the agent before it has ever paid
    agentCallsPerDay: 40,        // every call to the writing agent, per account per day
    photosPerCarol: 8,
    photoBytes: 25 * 1024 * 1024,
    photoPx: 1600,               // the longest side of the resized copy the video is made from
    addressesPerSend: 50,        // email addresses in one send (a sanity size; there is no limit per carol)
    emailsPerDay: 30,            // per account
    detailsChars: 1200,
    lyricLines: 10,
    lineChars: 64,
    jobsAtOnce: 1,               // renders at a time on one machine
    carolsPerDay: 20,            // new drafts per account per day
  },

  // ----- the video -----
  video: { fps: 30, sizes: { story: [1080, 1920], square: [1080, 1080] }, minSec: 20, maxSec: 40, hardCapSec: 60, maxBytes: 80 * 1024 * 1024, previewSec: 4, previewPx: 360 },

  // ----- what a carol costs us (for the ledger; US dollars) -----
  cost: { textInPerMTok: 4, textOutPerMTok: 20, musicPerMinute: 0.15, stripePct: 0.029, stripeFixedCents: 30 },

  // ----- occasions: 'live' can be made, 'soon' is listed as coming soon, 'off' is hidden. featured = [from, to] as MM-DD
  //       (inclusive; may wrap the new year). The admin can switch each one and its dates (settings table). -----
  occasions: [
    { id: 'christmas', name: 'Christmas & holidays', state: 'live', featured: ['11-01', '12-31'], hello: 'Merry Christmas' },
    { id: 'birthday', name: 'Birthday', state: 'live', featured: null, hello: 'Happy birthday' },
    { id: 'love', name: 'Love & Valentine\'s', state: 'live', featured: ['01-20', '02-14'], hello: 'With love' },
    { id: 'thanks', name: 'Thank you', state: 'live', featured: null, hello: 'Thank you' },
    { id: 'congrats', name: 'Congratulations', state: 'live', featured: null, hello: 'Congratulations' },
    { id: 'anniversary', name: 'Anniversary', state: 'live', featured: null, hello: 'Happy anniversary' },
    { id: 'mothers-day', name: 'Mother\'s Day', state: 'live', featured: ['04-25', '05-12'], hello: 'Happy Mother\'s Day' },
    { id: 'fathers-day', name: 'Father\'s Day', state: 'live', featured: ['06-01', '06-21'], hello: 'Happy Father\'s Day' },
    { id: 'new-baby', name: 'New baby', state: 'live', featured: null, hello: 'Welcome, little one' },
    { id: 'wedding', name: 'Wedding', state: 'live', featured: null, hello: 'Congratulations' },
    { id: 'graduation', name: 'Graduation', state: 'live', featured: ['05-13', '05-31'], hello: 'Congratulations, graduate' },
    { id: 'get-well', name: 'Get well', state: 'live', featured: null, hello: 'Get well soon' },
    { id: 'miss-you', name: 'Thinking of you', state: 'live', featured: null, hello: 'Thinking of you' },
    { id: 'new-year', name: 'New Year', state: 'live', featured: null, hello: 'Happy New Year' },
    { id: 'hanukkah', name: 'Hanukkah', state: 'live', featured: null, hello: 'Happy Hanukkah' },
    { id: 'diwali', name: 'Diwali', state: 'live', featured: null, hello: 'Happy Diwali' },
    { id: 'eid', name: 'Eid', state: 'live', featured: null, hello: 'Eid Mubarak' },
    { id: 'easter', name: 'Easter', state: 'live', featured: null, hello: 'Happy Easter' },
    { id: 'halloween', name: 'Halloween', state: 'live', featured: null, hello: 'Happy Halloween' },
    { id: 'thanksgiving', name: 'Thanksgiving', state: 'live', featured: null, hello: 'Happy Thanksgiving' },
    // ...and after these, every other occasion the template library makes (library/occasions.js), live, never featured
  ],
  defaultOccasion: 'birthday',         // when no occasion is featured by the calendar

  // ----- names a carol's page may not take: the site's own addresses live at the root too -----
  reserved: ['legal', 'admin', 'api', 'mcp', 'make', 'gallery', 'pricing', 'about', 'help', 'login', 'logout', 'signin', 'signup', 'auth', 'healthz', 'assets', 'fonts', 'static', 's', 'm', 'c', 'p',
    'card', 'cards', 'carol', 'carols', 'new', 'edit', 'account', 'me', 'my', 'settings', 'support', 'contact', 'terms', 'privacy', 'refunds', 'report', 'reports', 'unsubscribe', 'stop', 'email', 'mail',
    'pay', 'buy', 'checkout', 'stripe', 'webhook', 'oauth', 'well-known', 'robots', 'sitemap', 'favicon', 'icon', 'index', 'home', 'landing', 'app', 'play', 'share', 'send', 'templates', 'template',
    'occasions', 'occasion', 'christmas', 'birthday', 'love', 'thanks', 'congrats', 'glyphh', 'www', 'null', 'undefined', 'test', 'demo', 'example', 'examples', 'status', 'blog', 'press', 'jobs', 'faq'],
};

// the library's other occasions, in its order (an occasion only goes live once it has templates: server.js occasions())
require('./library/occasions.js').forEach(function (o) {
  if (!config.occasions.some(function (x) { return x.id === o.id; })) config.occasions.push({ id: o.id, name: o.name, state: 'live', featured: null, hello: o.hello });
});

if (env.CONFIG_OVERRIDE) {
  const merge = function (into, from) { Object.keys(from).forEach(function (k) { if (from[k] && typeof from[k] === 'object' && !Array.isArray(from[k]) && into[k] && typeof into[k] === 'object') merge(into[k], from[k]); else into[k] = from[k]; }); };
  merge(config, JSON.parse(env.CONFIG_OVERRIDE));
}
module.exports = config;
