'use strict';
// library/type.js : the type pairings a library template may be set in, from the families bundled in fonts.js.
// Recipes name them by tag, never by id; an id is stable for ever.
//   title    the big line (script and display faces live only here, with the scale they need to sit like the others)
//   body     the small line under the title          lyric    the sung line: always a face that reads small
//   caption  the paper tags and the sign-off's small words
// No two pairings share a (title, lyric) pair. Held to its rules by test/libdata.cjs, which also sets a long title and
// a 60-character sung line in every pairing, tall and square, and checks nothing leaves the safe area.
function Y(id, name, title, body, lyric, caption, tags, o) {
  var t = { id: id, name: name, title: title, body: body, lyric: lyric, caption: caption }, k;
  if (o) for (k in o) t[k] = o[k];
  t.tags = tags.split(' ');
  return t;
}
module.exports = [
  /* ---------- big display serifs ---------- */
  Y('poster-headline', 'Poster Headline', 'CT Fat', 'CT Sans Semi', 'CT Sans Bold', 'CT Hand Bold', 'bold friendly modern playful'),
  Y('jukebox-label', 'Jukebox Label', 'CT Fat', 'CT Sans Semi', 'CT Retro', 'CT Type', 'retro bold playful'),
  Y('gala-program', 'Gala Program', 'CT Fat', 'CT Serif', 'CT Serif', 'CT Serif', 'classic elegant bold'),
  Y('picture-book', 'Picture Book', 'CT Fat', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand', 'storybook friendly kids'),
  Y('front-page', 'Front Page', 'CT Fat', 'CT Sans', 'CT Type', 'CT Type', 'typewriter retro bold'),
  /* ---------- serif, quiet and classic ---------- */
  Y('letterhead', 'Letterhead', 'CT Serif', 'CT Sans', 'CT Sans Semi', 'CT Serif', 'classic formal elegant restrained'),
  Y('quiet-serif', 'Quiet Serif', 'CT Serif', 'CT Sans', 'CT Sans', 'CT Sans', 'restrained formal modern'),
  Y('book-serif', 'Book Serif', 'CT Serif', 'CT Serif', 'CT Serif', 'CT Serif', 'restrained classic formal elegant'),
  Y('bedtime-story', 'Bedtime Story', 'CT Serif', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand', 'storybook classic friendly hand'),
  Y('field-notes', 'Field Notes', 'CT Serif', 'CT Sans', 'CT Type', 'CT Type', 'typewriter classic'),
  /* ---------- clean sans ---------- */
  Y('clean-sans', 'Clean Sans', 'CT Sans Bold', 'CT Sans', 'CT Sans Semi', 'CT Sans', 'modern formal restrained'),
  Y('soft-sans', 'Soft Sans', 'CT Sans Semi', 'CT Sans', 'CT Sans', 'CT Sans', 'restrained modern'),
  Y('scoreboard-sans', 'Scoreboard Sans', 'CT Sans Bold', 'CT Sans Semi', 'CT Sans Bold', 'CT Sans Semi', 'modern bold sporty'),
  Y('nursery-sans', 'Nursery Sans', 'CT Sans Bold', 'CT Sans Semi', 'CT Hand Bold', 'CT Hand Bold', 'friendly modern kids'),
  Y('gallery-card', 'Gallery Card', 'CT Sans Semi', 'CT Sans', 'CT Serif', 'CT Serif', 'elegant modern restrained'),
  /* ---------- scripts (titles only) ---------- */
  Y('sign-painter', 'Sign Painter', 'CT Script', 'CT Sans Semi', 'CT Sans Semi', 'CT Hand', 'script friendly playful', { titleScale: 0.9 }),
  Y('bakery-box', 'Bakery Box', 'CT Script', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand', 'script hand friendly', { titleScale: 0.9 }),
  Y('soda-fountain', 'Soda Fountain', 'CT Script', 'CT Serif', 'CT Serif', 'CT Hand', 'script retro classic', { titleScale: 0.9 }),
  Y('engraved-invitation', 'Engraved Invitation', 'CT Vibes', 'CT Serif', 'CT Serif', 'CT Serif', 'script elegant formal classic', { titleScale: 1.2 }),
  Y('modern-calligraphy', 'Modern Calligraphy', 'CT Vibes', 'CT Sans', 'CT Sans Semi', 'CT Sans', 'script elegant formal modern', { titleScale: 1.2 }),
  Y('love-letter', 'Love Letter', 'CT Vibes', 'CT Serif', 'CT Lobster', 'CT Script', 'script elegant', { titleScale: 1.2 }),
  Y('diner-menu', 'Diner Menu', 'CT Lobster', 'CT Sans Semi', 'CT Sans Semi', 'CT Hand Bold', 'script retro friendly'),
  Y('sweetheart', 'Sweetheart', 'CT Lobster', 'CT Serif', 'CT Lobster', 'CT Script', 'script retro playful'),
  Y('market-chalkboard', 'Market Chalkboard', 'CT Lobster', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand', 'script hand retro friendly'),
  /* ---------- handwriting ---------- */
  Y('handwritten-note', 'Handwritten Note', 'CT Hand Bold', 'CT Hand', 'CT Hand Bold', 'CT Hand', 'hand friendly kids'),
  Y('sticky-note', 'Sticky Note', 'CT Hand Bold', 'CT Sans', 'CT Sans Semi', 'CT Hand', 'hand friendly modern'),
  Y('scrapbook', 'Scrapbook', 'CT Hand Bold', 'CT Hand', 'CT Type', 'CT Hand', 'hand typewriter friendly'),
  /* ---------- round and bouncy ---------- */
  Y('bouncy-castle', 'Bouncy Castle', 'CT Chewy', 'CT Sans Bold', 'CT Chewy', 'CT Hand Bold', 'kids playful bold'),
  Y('sticker-sheet', 'Sticker Sheet', 'CT Chewy', 'CT Sans Bold', 'CT Sans Bold', 'CT Hand Bold', 'kids playful friendly'),
  Y('crayon-box', 'Crayon Box', 'CT Chewy', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand', 'kids playful hand storybook'),
  /* ---------- loud ---------- */
  Y('game-day', 'Game Day', 'CT Bangers', 'CT Sans Bold', 'CT Sans Bold', 'CT Hand Bold', 'bold sporty playful'),
  Y('pennant', 'Pennant', 'CT Bangers', 'CT Sans Bold', 'CT Retro', 'CT Sans Semi', 'sporty bold retro'),
  Y('comic-fright', 'Comic Fright', 'CT Bangers', 'CT Sans Bold', 'CT Chewy', 'CT Hand Bold', 'spooky playful kids bold'),
  Y('midnight-matinee', 'Midnight Matinee', 'CT Bangers', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand', 'spooky hand playful'),
  /* ---------- retro display ---------- */
  Y('roller-rink', 'Roller Rink', 'CT Retro', 'CT Sans Bold', 'CT Sans Bold', 'CT Hand Bold', 'retro bold modern sporty'),
  Y('record-sleeve', 'Record Sleeve', 'CT Retro', 'CT Sans Semi', 'CT Retro', 'CT Retro', 'retro bold'),
  Y('neon-sign', 'Neon Sign', 'CT Neon', 'CT Retro', 'CT Retro', 'CT Retro', 'neon retro', { titleScale: 0.8 }),
  Y('night-drive', 'Night Drive', 'CT Neon', 'CT Sans Semi', 'CT Sans Bold', 'CT Sans Semi', 'neon modern bold', { titleScale: 0.8 }),
  Y('arcade-cabinet', 'Arcade Cabinet', 'CT Pixel', 'CT Sans Bold', 'CT Sans Bold', 'CT Hand Bold', 'pixel retro kids playful', { titleScale: 0.6 }),
  Y('high-score', 'High Score', 'CT Pixel', 'CT Sans Semi', 'CT Retro', 'CT Sans Semi', 'pixel retro neon', { titleScale: 0.6 }),
  /* ---------- engraved capitals ---------- */
  Y('royal-charter', 'Royal Charter', 'CT Carol Bold', 'CT Serif', 'CT Serif', 'CT Serif', 'formal elegant classic', { titleScale: 0.82 }),
  Y('museum-plaque', 'Museum Plaque', 'CT Carol Bold', 'CT Sans', 'CT Sans Semi', 'CT Sans', 'formal elegant modern', { titleScale: 0.82 }),
  Y('garden-party', 'Garden Party', 'CT Carol', 'CT Serif', 'CT Sans', 'CT Serif', 'elegant classic', { titleScale: 0.82 }),
  /* ---------- typewriter ---------- */
  Y('typed-letter', 'Typed Letter', 'CT Type', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand', 'typewriter hand friendly'),
  Y('telegram', 'Telegram', 'CT Type', 'CT Hand', 'CT Type', 'CT Hand', 'typewriter retro'),
  Y('memo', 'Memo', 'CT Type', 'CT Sans', 'CT Sans Semi', 'CT Type', 'typewriter modern'),
  /* ---------- wobbly storybook ---------- */
  Y('fairy-tale', 'Fairy Tale', 'CT Xmas Bold', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand', 'storybook playful kids hand'),
  Y('friendly-fright', 'Friendly Fright', 'CT Xmas Bold', 'CT Sans Bold', 'CT Chewy', 'CT Hand Bold', 'spooky storybook kids playful'),
  Y('toadstool', 'Toadstool', 'CT Xmas', 'CT Serif', 'CT Serif', 'CT Hand', 'storybook classic spooky')
];
