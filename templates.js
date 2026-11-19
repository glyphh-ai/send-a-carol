/* Send a Carol templates: pure data. Each one is a look (palette, type, border, karaoke band, transition),
   a cast, a backdrop, photo-frame styles, scene specs and directions for the music and the lyric.
   The engine (engine.js) draws them; nothing here draws.

   look.stage   'band-low' (default: the cast stands beside the photos, the lyric band sits low) or
                'cast-low' (rooms with a floor: the cast stands on the floor under the lyric band); square video has one layout.
   cast roles   character: lead (left), side (right), extra (joins in the big scenes)
                prop: hero (the big piece of the stage picture; float: true = it hovers), floor (small, by the cast),
                      sky (floats in the top corners), fly (crosses the sky every `every` seconds)
   vignettes    what is drawn inside the frames when a carol has no photos: prop names, or 'c:<character>'. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CarolTemplates = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var CarolTemplates = {};

  CarolTemplates.occasions = ['christmas', 'birthday', 'love', 'thanks', 'congrats'];
  CarolTemplates.families = [
    { id: 'family-cozy', name: 'Family & Cozy', occasion: 'christmas' },
    { id: 'funny', name: 'Funny', occasion: 'christmas' },
    { id: 'kids', name: 'Kids', occasion: 'christmas' },
    { id: 'grandparents', name: 'Grandparents', occasion: 'christmas' },
    { id: 'romantic', name: 'Romantic', occasion: 'christmas' },
    { id: 'pets', name: 'Pets', occasion: 'christmas' },
    { id: 'friends', name: 'Friends', occasion: 'christmas' },
    { id: 'work', name: 'Work & Clients', occasion: 'christmas' },
    { id: 'faith', name: 'Faith', occasion: 'christmas' },
    { id: 'retro', name: 'Retro', occasion: 'christmas' },
    { id: 'new-baby', name: 'New Baby / First Christmas', occasion: 'christmas' },
    { id: 'far-away', name: 'Far Away', occasion: 'christmas' },
    { id: 'birthday-party', name: 'Birthday Party', occasion: 'birthday' },
    { id: 'love-notes', name: 'Love Notes', occasion: 'love' },
    { id: 'thank-you', name: 'Thank You', occasion: 'thanks' },
    { id: 'well-done', name: 'Well Done', occasion: 'congrats' }
  ];

  /* shorthands */
  function ch(name, role, o) { var c = { kind: 'character', name: name, role: role || 'lead' }, k; if (o) for (k in o) c[k] = o[k]; return c; }
  function pr(name, role, o) { var c = { kind: 'prop', name: name, role: role || 'floor' }, k; if (o) for (k in o) c[k] = o[k]; return c; }
  function pal(bg, bg2, ink, accent, accent2, gold, snow, paper) { return { bg: bg, bg2: bg2, ink: ink, accent: accent, accent2: accent2, gold: gold, snow: snow, paper: paper }; }
  function fonts(title, body, lyric, caption, o) { var f = { title: title, body: body, lyric: lyric, caption: caption }, k; if (o) for (k in o) f[k] = o[k]; return f; }
  var NEG = ['heavy metal', 'screaming', 'harsh distortion', 'explicit lyrics', 'spoken word intro', 'long instrumental intro'];
  var S5 = [{ kind: 'title', layout: 'top' }, { kind: 'photo', layout: 'hero' }, { kind: 'lyric', tableau: 'hero' }, { kind: 'photo', layout: 'collage' }, { kind: 'signoff', layout: 'top' }];
  var S6 = [{ kind: 'title', layout: 'top' }, { kind: 'photo', layout: 'hero' }, { kind: 'lyric', tableau: 'hero' }, { kind: 'photo', layout: 'collage' }, { kind: 'lyric', tableau: 'row' }, { kind: 'signoff', layout: 'top' }];
  var list = [], order = 0;
  function T(t) {
    t.order = ++order;
    t.particleAmount = t.particleAmount == null ? 1 : t.particleAmount;
    var base = t.two ? S6 : S5, first = true; delete t.two;
    t.scenes = base.map(function (s) { var o = {}, k; for (k in s) o[k] = s[k]; if (o.kind === 'lyric') { if (first && t.tableau) o.tableau = t.tableau; first = false; } return o; });
    delete t.tableau;
    t.music.negative = (t.music.negative || []).concat(NEG);
    t.vignettes = t.vignettes || t.cast.filter(function (c) { return c.kind === 'prop'; }).map(function (c) { return c.name; });
    list.push(t); return t;
  }

  /* =================================================== CHRISTMAS =================================================== */

  /* ---------- Family & Cozy ---------- */
  T({ id: 'cozy-mantel', name: 'Cozy Mantel', occasion: 'christmas', family: 'family-cozy',
    blurb: 'Your photos in gold frames above a crackling fire, with Santa and his elf keeping time on the rug.',
    tags: ['family', 'cozy', 'fireplace', 'mantel', 'stockings', 'home', 'warm', 'classic', 'santa', 'elf'],
    look: { pal: pal('#1f2a44', '#34466b', '#2b2118', '#c8323c', '#2f8f5b', '#f2c14e', '#ffffff', '#fff6e4'), fonts: fonts('CT Xmas Bold', 'CT Hand Bold', 'CT Serif', 'CT Hand'), border: 'garland', karaoke: 'ribbon', transition: 'page', title: 'outline', frameIn: 'drop', stage: 'cast-low' },
    cast: [ch('santa', 'lead'), ch('elf', 'side'), pr('fireplace', 'hero'), pr('present', 'floor'), pr('stocking', 'floor')],
    backdrop: 'livingroom', particles: 'twinkle', particleAmount: 0.6, frames: ['mantel', 'ornament', 'plain'], vignettes: ['fireplace', 'tree', 'stocking', 'mug'],
    music: { styles: ['warm acoustic folk', 'fingerpicked guitar', 'upright piano', 'soft sleigh bells', 'brushed drums', 'gentle group harmonies', 'fireside singalong'], bpm: 96, voices: 'warm female lead with soft family harmonies', notes: 'Feels like singing in the living room on Christmas Eve, unhurried and close.' },
    tone: 'Warm, homey and specific to this family: little in-jokes and house details, gentle humour, never sappy.' });

  T({ id: 'plaid-pajamas', name: 'Matching Pajamas', occasion: 'christmas', family: 'family-cozy',
    blurb: 'Polaroids pegged on a string of lights over red plaid, like the hallway on Christmas morning.',
    tags: ['family', 'pajamas', 'plaid', 'flannel', 'polaroid', 'christmas morning', 'cabin', 'cocoa', 'reindeer', 'gingerbread'],
    look: { pal: pal('#7a1f2b', '#a32a36', '#2a1a16', '#c62f3b', '#2f7d55', '#f0c75e', '#ffffff', '#fff5e6'), fonts: fonts('CT Lobster', 'CT Sans Semi', 'CT Sans Semi', 'CT Hand Bold'), border: 'scallop', karaoke: 'tape', transition: 'slide', title: 'plate', frameIn: 'swing', tilt: 0.02, dim: 0.22, dimColor: '#3a0f16' },
    cast: [ch('reindeer', 'lead'), ch('gingerbread', 'side'), pr('tree', 'hero'), pr('mug', 'floor'), pr('cookie', 'floor')],
    backdrop: 'plaid', particles: 'twinkle', particleAmount: 0.5, frames: ['polaroid', 'tag'], vignettes: ['tree', 'mug', 'cookie', 'c:gingerbread'],
    music: { styles: ['cheerful folk-pop', 'strummed acoustic guitar', 'mandolin', 'hand claps', 'sleigh bells', 'tambourine', 'whistled hook'], bpm: 108, voices: 'friendly male and female duet trading lines', notes: 'Christmas-morning energy: pajamas, cocoa and everybody talking at once.' },
    tone: 'Cheerful and a bit teasing about the family\'s traditions, with one sincere line in the hook.' });

  /* ---------- Funny ---------- */
  T({ id: 'ugly-sweater-party', name: 'Ugly Sweater Party', occasion: 'christmas', family: 'funny',
    blurb: 'Knitted in glorious 8-bit: a polar bear in the loudest sweater ever hosts your photos on TV.',
    tags: ['funny', 'ugly sweater', 'party', 'pixel', '8-bit', 'knit', 'polar bear', 'nutcracker', 'silly'],
    look: { pal: pal('#fff4dc', '#ffe9c2', '#27323f', '#e0303c', '#1f9d63', '#f5b82e', '#ffffff', '#ffffff'), fonts: fonts('CT Pixel', 'CT Sans Bold', 'CT Sans Bold', 'CT Hand Bold', { titleScale: 0.6 }), border: 'pixel', karaoke: 'pixel', transition: 'pixel', title: 'plate', frameIn: 'spin', dim: 0.4, dimColor: '#fff4dc' },
    cast: [ch('polarbear', 'lead'), ch('nutcracker', 'side'), ch('gingerbread', 'extra'), pr('ornament', 'hero', { float: true, size: 0.8 }), pr('present', 'floor'), pr('candycane', 'floor'), pr('discoball', 'sky')],
    backdrop: 'wrapping', particles: 'confetti', particleAmount: 0.8, frames: ['tv', 'tag'], vignettes: ['c:polarbear', 'ornament', 'candycane', 'c:nutcracker'],
    music: { styles: ['goofy novelty pop', 'chiptune bleeps', 'tuba oompah bass', 'sleigh bells', 'kazoo', 'gang vocals', 'cheesy key change'], bpm: 132, voices: 'over-the-top showman lead with a rowdy gang shouting the hook', notes: 'A proudly tacky party anthem, played completely straight.' },
    tone: 'Roast-level funny but affectionate: exaggerate their quirks, land a real compliment in the last line.' });

  T({ id: 'naughty-or-nice', name: 'Naughty or Nice List', occasion: 'christmas', family: 'funny',
    blurb: 'An elf checks the list on the chalkboard and your photos are the evidence.',
    tags: ['funny', 'naughty', 'nice', 'list', 'elf', 'chalkboard', 'school', 'mrs claus', 'cheeky'],
    look: { pal: pal('#2f5d4a', '#3a6f58', '#1c2a24', '#e8525a', '#7fd1a0', '#ffd866', '#ffffff', '#fdfbf2'), fonts: fonts('CT Hand Bold', 'CT Hand', 'CT Hand Bold', 'CT Hand'), border: 'none', karaoke: 'chalk', transition: 'wipe', title: 'chalk', frameIn: 'pop', tilt: 0.03 },
    cast: [ch('elf', 'lead'), ch('mrsclaus', 'side'), pr('candycane', 'hero', { float: true, size: 0.75 }), pr('cookie', 'floor'), pr('present', 'floor'), pr('bell', 'sky')],
    backdrop: 'chalkboard', particles: 'twinkle', particleAmount: 0.4, frames: ['badge', 'polaroid'], vignettes: ['c:elf', 'cookie', 'bell', 'candycane'],
    music: { styles: ['playful swing', 'walking upright bass', 'muted trumpet', 'finger snaps', 'xylophone', 'sleigh bells', 'call and response'], bpm: 126, voices: 'sly crooner lead with sassy backing singers answering', notes: 'A wink-wink courtroom number: is this person naughty or nice?' },
    tone: 'Mock-serious verdict on their year: list their funny "crimes", then rule them nice after all.' });

  T({ id: 'yeti-to-party', name: 'Yeti to Party', occasion: 'christmas', family: 'funny',
    blurb: 'A gentle yeti throws a dance party under the northern lights and frames your photos in icy windows.',
    tags: ['funny', 'yeti', 'abominable', 'northern lights', 'aurora', 'dance', 'penguin', 'goofy', 'winter'],
    look: { pal: pal('#0f2a4a', '#1d4f73', '#13233b', '#ff5f6d', '#3ddc97', '#ffd166', '#ffffff', '#f4fbff'), fonts: fonts('CT Bangers', 'CT Sans Bold', 'CT Sans Bold', 'CT Hand Bold'), border: 'none', karaoke: 'ice', transition: 'drop', title: 'outline', frameIn: 'rise' },
    cast: [ch('yeti', 'lead'), ch('penguin', 'side'), pr('snowglobe', 'hero', { size: 0.85 }), pr('snowpile', 'floor'), pr('mug', 'floor')],
    backdrop: 'aurora', particles: 'snow', frames: ['window', 'wreath'], vignettes: ['c:yeti', 'snowglobe', 'c:penguin', 'mug'], two: true,
    music: { styles: ['funky disco-pop', 'slap bass', 'wah guitar', 'brass stabs', 'sleigh bells', 'vocoder ad-libs', 'four-on-the-floor kick'], bpm: 120, voices: 'big goofy baritone lead with falsetto party harmonies', notes: 'A lovable monster hits the dance floor: funky, big-hearted, ridiculous.' },
    tone: 'Silly and high-energy with pun-heavy lines ("yeti or not"), always kind to the person it is for.' });

  /* ---------- Kids ---------- */
  T({ id: 'snow-day', name: 'Snow Day Parade', occasion: 'christmas', family: 'kids',
    blurb: 'A snowman and a penguin march your photos across a sparkling snow day.',
    tags: ['kids', 'snowman', 'penguin', 'snow', 'play', 'sledding', 'children', 'fun', 'bright'],
    look: { pal: pal('#3d7fc4', '#8ec5ef', '#1f2f4f', '#e8404a', '#22a06b', '#ffcf40', '#ffffff', '#ffffff'), fonts: fonts('CT Chewy', 'CT Sans Bold', 'CT Chewy', 'CT Hand Bold'), border: 'candy', karaoke: 'candy', transition: 'iris', title: 'sticker', frameIn: 'pop', tilt: 0.03 },
    cast: [ch('snowman', 'lead'), ch('penguin', 'side'), ch('mouse', 'extra'), pr('pine', 'hero', { size: 0.9 }), pr('snowpile', 'floor'), pr('cloud', 'sky')],
    backdrop: 'snowyhills', particles: 'snow', frames: ['snowglobe', 'starcut', 'ornament'], vignettes: ['c:snowman', 'present', 'c:penguin', 'candycane'],
    music: { styles: ['bouncy kids pop', 'ukulele', 'glockenspiel', 'hand claps', 'jingle bell percussion', 'kazoo hook', 'happy whistling'], bpm: 122, voices: 'bright playful lead with a kids-choir shout-along on the hook', notes: 'Silly and bouncy, a tune a five-year-old sings back after one listen.' },
    tone: 'Playful and giggly with simple words, big rhymes and the child\'s name sung proudly in the hook.' });

  T({ id: 'elf-workshop', name: 'Elf Workshop', occasion: 'christmas', family: 'kids',
    blurb: 'Elves, a toy robot and a sleigh full of gifts tag your photos as "special delivery".',
    tags: ['kids', 'elf', 'elves', 'workshop', 'toys', 'robot', 'sleigh', 'north pole', 'gifts', 'santa'],
    look: { pal: pal('#7a4a2a', '#a56a3c', '#2b1a10', '#d8343f', '#2e9a5e', '#ffcb47', '#ffffff', '#fff3da'), fonts: fonts('CT Xmas Bold', 'CT Sans Bold', 'CT Chewy', 'CT Hand Bold'), border: 'lights', karaoke: 'ticket', transition: 'curtain', title: 'sign', frameIn: 'drop', stage: 'cast-low' },
    cast: [ch('elf', 'lead'), ch('robot', 'side'), ch('mouse', 'extra'), pr('sleigh', 'hero'), pr('present', 'floor'), pr('rattle', 'floor')],
    backdrop: 'workshop', particles: 'twinkle', particleAmount: 0.5, frames: ['tag', 'starcut'], vignettes: ['sleigh', 'c:robot', 'present', 'c:elf'],
    music: { styles: ['toy-box pop', 'pizzicato strings', 'toy piano', 'wood block ticks', 'sleigh bells', 'marching snare', 'cheerful choir "la la"'], bpm: 116, voices: 'chipper young-sounding lead with a helium-bright elf chorus', notes: 'Busy and tick-tocking like a toy factory the night before Christmas.' },
    tone: 'Excited and sweet: the elves made this song just for the child, name the things they love.' });

  /* ---------- Grandparents ---------- */
  T({ id: 'grandmas-kitchen', name: 'Grandma\'s Kitchen', occasion: 'christmas', family: 'grandparents',
    blurb: 'Gingham, a warm oven and a gingerbread helper: a carol that smells like cookies.',
    tags: ['grandma', 'grandpa', 'grandparents', 'kitchen', 'baking', 'cookies', 'gingerbread', 'gingham', 'recipe', 'nana'],
    look: { pal: pal('#f7c6c2', '#fbe3d6', '#4a2a2a', '#d9475a', '#3f9f8f', '#f2b84b', '#ffffff', '#fffaf0'), fonts: fonts('CT Script', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand', { titleScale: 0.9 }), border: 'stitch', karaoke: 'icing', transition: 'clock', title: 'plate', frameIn: 'pop', stage: 'cast-low', tilt: -0.02 },
    cast: [ch('mrsclaus', 'lead'), ch('gingerbread', 'side'), ch('mouse', 'extra'), pr('cookie', 'hero', { float: true, size: 0.8 }), pr('mug', 'floor'), pr('candycane', 'floor')],
    backdrop: 'kitchen', particles: 'twinkle', particleAmount: 0.3, frames: ['plain', 'wreath'], vignettes: ['cookie', 'mug', 'c:gingerbread', 'candycane'],
    music: { styles: ['gentle waltz', 'accordion', 'nylon-string guitar', 'soft clarinet', 'music-box bells', 'brushed snare', 'humming'], bpm: 88, voices: 'tender grandchild-like lead with warm humming harmonies', notes: 'A slow dance around the kitchen table while the cookies bake.' },
    tone: 'Tender and grateful: her recipes, her hands, the smell of her kitchen; sweet, with one playful line.' });

  T({ id: 'fireside-stories', name: 'Fireside Stories', occasion: 'christmas', family: 'grandparents',
    blurb: 'An owl and a sleepy cat by the embers, with your photos in a golden locket.',
    tags: ['grandparents', 'grandpa', 'grandma', 'fireside', 'stories', 'owl', 'cat', 'locket', 'memories', 'nostalgia', 'knitting'],
    look: { pal: pal('#2a1408', '#6a3412', '#2a1408', '#c8502a', '#5f8f4a', '#ffc65a', '#fff1d0', '#fff0d2'), fonts: fonts('CT Vibes', 'CT Serif', 'CT Serif', 'CT Hand', { titleScale: 1.15 }), border: 'holly', karaoke: 'wood', transition: 'fade', title: 'gold', frameIn: 'rise' },
    cast: [ch('owl', 'lead'), ch('cat', 'side'), pr('lantern', 'hero', { size: 0.8 }), pr('yarn', 'floor'), pr('mug', 'floor')],
    backdrop: 'fireside', particles: 'embers', particleAmount: 0.8, frames: ['locket', 'mantel'], vignettes: ['lantern', 'yarn', 'c:owl', 'mug'], lyricFx: 'twinkle',
    music: { styles: ['nostalgic lullaby ballad', 'felt piano', 'warm cello', 'soft acoustic guitar', 'vinyl crackle', 'distant sleigh bells', 'close harmony'], bpm: 76, voices: 'gentle storyteller lead, almost spoken, with a soft duet on the hook', notes: 'A bedtime-story carol: slow, golden and full of memory.' },
    tone: 'Nostalgic and loving: the stories they tell, the years together, thankful without being sad.' });

  /* ---------- Romantic ---------- */
  T({ id: 'mistletoe-kiss', name: 'Mistletoe Kiss', occasion: 'christmas', family: 'romantic',
    blurb: 'Two penguins under the mistletoe, hearts drifting through a plum-pink dusk.',
    tags: ['romantic', 'love', 'couple', 'mistletoe', 'kiss', 'hearts', 'penguin', 'wife', 'husband', 'girlfriend', 'boyfriend'],
    look: { pal: pal('#4a2a6a', '#a34a8a', '#2a1638', '#e8456b', '#3f9f7a', '#ffd27a', '#ffffff', '#fff3f6'), fonts: fonts('CT Lobster', 'CT Serif', 'CT Lobster', 'CT Script'), border: 'hearts', karaoke: 'heart', transition: 'heart', title: 'outline', titleStroke: '#4a1a4a', frameIn: 'swing' },
    cast: [ch('penguin', 'lead'), ch('penguin', 'side'), pr('heart', 'hero', { float: true, size: 0.7 }), pr('present', 'floor'), pr('mistletoe', 'sky')],
    backdrop: 'heartsnow', particles: 'hearts', particleAmount: 0.7, frames: ['locket', 'wreath'], vignettes: ['heart', 'mistletoe', 'c:penguin', 'present'],
    music: { styles: ['romantic jazz ballad', 'brushed drums', 'upright bass', 'smoky tenor saxophone', 'soft Rhodes piano', 'string pad', 'slow dance'], bpm: 80, voices: 'intimate velvety lead with a close whispered harmony', notes: 'A slow dance in the kitchen with the tree lights on.' },
    tone: 'Romantic and personal: how they met, small rituals, a little flirtation, sincere in the hook.' });

  T({ id: 'skating-waltz', name: 'Skating Waltz', occasion: 'christmas', family: 'romantic',
    blurb: 'A moonlit waltz on the frozen pond, your photos turning inside snow globes.',
    tags: ['romantic', 'skating', 'ice', 'waltz', 'pond', 'snow globe', 'moonlight', 'elegant', 'couple', 'anniversary'],
    look: { pal: pal('#1c3f6e', '#5fa8d8', '#16304f', '#d9486b', '#2f9f8a', '#ffd98a', '#ffffff', '#f4fbff'), fonts: fonts('CT Script', 'CT Sans Semi', 'CT Sans Semi', 'CT Hand'), border: 'none', karaoke: 'glass', transition: 'diamond', title: 'outline', titleStroke: '#16304f', frameIn: 'spin' },
    cast: [ch('fawn', 'lead'), ch('polarbear', 'side'), pr('pine', 'floor'), pr('snowpile', 'floor'), pr('moon', 'sky')],
    backdrop: 'icepond', particles: 'snow', particleAmount: 0.8, frames: ['snowglobe', 'bubble'], vignettes: ['snowglobe', 'moon', 'c:fawn', 'pine'], tableau: 'row',
    music: { styles: ['sweeping orchestral waltz', 'three-four time', 'celesta', 'pizzicato strings', 'harp glissando', 'French horn', 'sleigh bells'], bpm: 138, voices: 'graceful soprano lead with a tender tenor joining the hook', notes: 'A storybook waltz, gliding and a little breathless.' },
    tone: 'Elegant and dreamy: gliding together through the years, graceful images, heartfelt close.' });

  /* ---------- Pets ---------- */
  T({ id: 'paws-and-claus', name: 'Paws & Claus', occasion: 'christmas', family: 'pets',
    blurb: 'For the good boys and girls: paw prints, a big bone and your pet framed in the food bowl.',
    tags: ['pets', 'dog', 'puppy', 'cat', 'paw', 'bone', 'fur baby', 'good boy', 'treats', 'animal'],
    look: { pal: pal('#1f3a6b', '#2c5290', '#1a2440', '#e0343f', '#2f9f6b', '#ffc93c', '#ffffff', '#fff8ea'), fonts: fonts('CT Chewy', 'CT Sans Bold', 'CT Sans Bold', 'CT Hand Bold'), border: 'dots', karaoke: 'pill', transition: 'star', title: 'ribbon', frameIn: 'pop', dim: 0.3 },
    cast: [ch('dog', 'lead'), ch('cat', 'side'), ch('mouse', 'extra'), pr('bone', 'hero', { float: true, size: 0.8 }), pr('stocking', 'floor'), pr('present', 'floor')],
    backdrop: 'pawpattern', particles: 'snow', particleAmount: 0.5, frames: ['bowl', 'polaroid'], vignettes: ['c:dog', 'bone', 'c:cat', 'pawprint'],
    music: { styles: ['happy-go-lucky pop', 'bouncy ukulele', 'whistling', 'squeaky toy accents', 'hand claps', 'sleigh bells', 'walking bass'], bpm: 124, voices: 'cheerful lead singing as the adoring pet owner, playful "woof" and "meow" backing', notes: 'Tail-wagging happy, like the walk right after the first snow.' },
    tone: 'Sung to (or as) the pet: treats, zoomies, stolen socks; adoring and funny.' });

  T({ id: 'tangled-in-tinsel', name: 'Tangled in Tinsel', occasion: 'christmas', family: 'pets',
    blurb: 'The cat got into the lights again. Your photos hang as ornaments while a mouse cheers her on.',
    tags: ['pets', 'cat', 'kitten', 'lights', 'tinsel', 'tree', 'mischief', 'mouse', 'ornament', 'funny'],
    look: { pal: pal('#12383f', '#1f5a5a', '#10262a', '#ff5a5f', '#5ad1a0', '#ffd166', '#ffffff', '#fff8ea'), fonts: fonts('CT Xmas Bold', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand'), border: 'none', karaoke: 'neon', transition: 'flash', title: 'neon', frameIn: 'swing', stage: 'cast-low' },
    cast: [ch('cat', 'lead'), ch('mouse', 'side'), pr('tree', 'hero'), pr('yarn', 'floor'), pr('ornament', 'floor')],
    backdrop: 'stringlights', particles: 'twinkle', frames: ['ornament', 'tag'], vignettes: ['c:cat', 'tree', 'yarn', 'c:mouse'],
    music: { styles: ['sneaky pizzicato swing', 'plucked double bass', 'vibraphone', 'brushed hi-hat', 'tiny bell shakes', 'slide whistle', 'jazzy piano'], bpm: 112, voices: 'mischievous purring lead with playful doo-wop backing', notes: 'A cat-burglar caper around the Christmas tree.' },
    tone: 'Mischievous and fond: the pet\'s holiday crimes told like a heist, forgiven in the hook.' });

  /* ---------- Friends ---------- */
  T({ id: 'village-carolers', name: 'Carolers at the Door', occasion: 'christmas', family: 'friends',
    blurb: 'Three carolers sing under your window in a snowy village at night.',
    tags: ['friends', 'carolers', 'carol', 'village', 'neighbors', 'door', 'snow', 'night', 'choir', 'traditional'],
    look: { pal: pal('#1b2a52', '#2f4a86', '#1a1f38', '#c8323c', '#2f8f5b', '#ffd27a', '#ffffff', '#fff6e4'), fonts: fonts('CT Serif', 'CT Hand Bold', 'CT Xmas Bold', 'CT Hand'), border: 'holly', karaoke: 'snowbank', transition: 'rise', title: 'outline', frameIn: 'drop' },
    cast: [ch('caroler', 'lead', { variant: 0 }), ch('caroler', 'side', { variant: 1 }), ch('caroler', 'extra', { variant: 2, mood: 'sing' }), pr('house', 'hero'), pr('lantern', 'floor'), pr('bell', 'sky')],
    backdrop: 'nightvillage', particles: 'snow', frames: ['window', 'wreath'], vignettes: ['house', 'c:caroler', 'lantern', 'bell'], tableau: 'row',
    music: { styles: ['a cappella carol', 'four-part harmony', 'handbells', 'soft pump organ', 'sleigh bells', 'gentle tambourine', 'street choir'], bpm: 100, voices: 'small mixed choir of friends, one clear lead, everyone on the hook', notes: 'Friends singing on a doorstep with cold noses and big smiles.' },
    tone: 'Friendly and warm with a few shared memories and inside jokes, a toast to the friendship.' });

  T({ id: 'friendsmas-party', name: 'Friendsmas Party', occasion: 'christmas', family: 'friends',
    blurb: 'Disco ball, microphone, film-strip photos: the group chat throws a Christmas party.',
    tags: ['friends', 'friendsmas', 'party', 'disco', 'karaoke', 'squad', 'roommates', 'besties', 'dance', 'confetti'],
    look: { pal: pal('#1d2f5f', '#2f4f96', '#151d3a', '#ff4f6d', '#35c7a5', '#ffd447', '#ffffff', '#fff8ee'), fonts: fonts('CT Retro', 'CT Sans Bold', 'CT Sans Bold', 'CT Hand Bold'), border: 'lights', karaoke: 'marquee', transition: 'cut', title: 'ribbon', frameIn: 'spin' },
    cast: [ch('reindeer', 'lead'), ch('snowman', 'side'), ch('gingerbread', 'extra'), pr('microphone', 'hero', { size: 0.8 }), pr('mug', 'floor'), pr('present', 'floor'), pr('discoball', 'sky')],
    backdrop: 'confetti', particles: 'confetti', frames: ['film', 'polaroid'], vignettes: ['discoball', 'microphone', 'c:reindeer', 'mug'], two: true,
    music: { styles: ['upbeat dance-pop', 'four-on-the-floor kick', 'funky rhythm guitar', 'synth brass', 'hand claps', 'sleigh bells', 'crowd cheers'], bpm: 124, voices: 'confident pop lead with the whole friend group shouting the hook', notes: 'The song that gets everyone off the couch at the party.' },
    tone: 'Hype and affectionate: roast the friends lightly, celebrate the chaos, "best year yet" energy.' });

  /* ---------- Work & Clients ---------- */
  T({ id: 'happy-holidays-team', name: 'Happy Holidays, Team', occasion: 'christmas', family: 'work',
    blurb: 'The office party, tastefully: festive sweaters, ID-badge photos and a clean lower-third.',
    tags: ['work', 'office', 'team', 'colleagues', 'coworkers', 'company', 'boss', 'staff', 'happy holidays', 'professional', 'inclusive'],
    look: { pal: pal('#dfe6ee', '#b9c7d8', '#22303f', '#d6404a', '#1f8a70', '#f0b429', '#ffffff', '#ffffff'), fonts: fonts('CT Sans Bold', 'CT Sans', 'CT Sans Semi', 'CT Sans'), border: 'none', karaoke: 'lowerthird', transition: 'wipe', title: 'plate', frameIn: 'slide', stage: 'cast-low' },
    cast: [ch('officemate', 'lead', { variant: 0 }), ch('officemate', 'side', { variant: 1 }), ch('officemate', 'extra', { variant: 2 }), pr('watercooler', 'hero', { size: 0.8 }), pr('laptop', 'floor'), pr('mug', 'floor')],
    backdrop: 'office', particles: 'twinkle', particleAmount: 0.4, frames: ['badge', 'plain'], vignettes: ['laptop', 'mug', 'c:officemate', 'present'],
    music: { styles: ['bright corporate pop', 'clean electric guitar', 'light piano', 'hand claps', 'subtle sleigh bells', 'uplifting chorus', 'tight drums'], negative: ['religious references', 'drinking songs'], bpm: 112, voices: 'friendly, polished lead with an upbeat group on the hook', notes: 'Feel-good and tidy, safe to play at the all-hands.' },
    tone: 'Professional and inclusive: say "happy holidays", thank the team for specific wins, light office humour, nothing religious or edgy.' });

  T({ id: 'seasons-greetings', name: 'Season\'s Greetings', occasion: 'christmas', family: 'work',
    blurb: 'Navy and gold, a quiet night sky: an elegant thank-you for clients and partners.',
    tags: ['work', 'clients', 'customers', 'partners', 'business', 'elegant', 'gold', 'seasons greetings', 'happy holidays', 'corporate', 'thank you'],
    look: { pal: pal('#0f1b3d', '#1f2f63', '#0c1430', '#b23a48', '#2f7a6a', '#e9c46a', '#ffffff', '#fbf5e6'), fonts: fonts('CT Serif', 'CT Sans', 'CT Sans Semi', 'CT Serif'), border: 'goldline', karaoke: 'band', transition: 'iris', title: 'gold', frameIn: 'rise' },
    cast: [ch('nutcracker', 'lead'), ch('reindeer', 'side'), pr('globe', 'hero', { size: 0.8 }), pr('present', 'floor'), pr('star', 'sky')],
    backdrop: 'starfield', particles: 'stars', particleAmount: 0.5, frames: ['plain', 'stamp'], vignettes: ['globe', 'star', 'present', 'wreath'], lyricFx: 'twinkle',
    music: { styles: ['elegant orchestral pop', 'grand piano', 'warm string section', 'soft timpani', 'celesta', 'tasteful sleigh bells', 'cinematic swell'], negative: ['religious references', 'comedy sound effects'], bpm: 92, voices: 'smooth, assured lead with a small refined vocal ensemble', notes: 'Polished and gracious, like a hand-written card from the founder.' },
    tone: 'Gracious and professional: thank them for the partnership this year, wish them a bright new year, "happy holidays", no jokes at anyone\'s expense.' });

  /* ---------- Faith ---------- */
  T({ id: 'holy-night', name: 'Holy Night', occasion: 'christmas', family: 'faith',
    blurb: 'A reverent carol under the star: shepherds, an angel and your family in stained-glass light.',
    tags: ['faith', 'nativity', 'star', 'shepherd', 'angel', 'church', 'holy', 'reverent', 'christian', 'blessing', 'bethlehem'],
    look: { pal: pal('#141b3d', '#27306b', '#1a1430', '#b23a48', '#3f7a6a', '#f3cf7a', '#fff7dc', '#fff3d6'), fonts: fonts('CT Carol Bold', 'CT Carol', 'CT Serif', 'CT Serif', { titleScale: 0.82 }), border: 'goldline', karaoke: 'scroll', transition: 'fade', title: 'gold', frameIn: 'rise' },
    cast: [ch('shepherd', 'lead'), ch('angel', 'side'), pr('manger', 'hero'), pr('lantern', 'floor'), pr('star', 'sky')],
    backdrop: 'holynight', particles: 'stars', particleAmount: 0.5, frames: ['arch', 'plain'], vignettes: ['manger', 'star', 'church', 'candle'], lyricFx: 'twinkle',
    music: { styles: ['reverent choral carol', 'pipe organ pad', 'solo cello', 'soft harp', 'candlelight hymn', 'slow swelling strings', 'church choir'], negative: ['comedy', 'novelty sound effects', 'dance beat'], bpm: 72, voices: 'pure soprano lead with a hushed four-part choir', notes: 'Still and holy, like the last hymn of a candlelight service.' },
    tone: 'Reverent and grateful: the holy night, the star, peace and blessing on this family; no jokes.' });

  T({ id: 'candlelight-carol', name: 'Candlelight Carol', occasion: 'christmas', family: 'faith',
    blurb: 'A choir by candlelight outside the little church, singing peace over the people you love.',
    tags: ['faith', 'candlelight', 'church', 'choir', 'peace', 'prayer', 'hymn', 'christmas eve', 'service', 'joy'],
    look: { pal: pal('#3a0f18', '#6a1f2a', '#2a0c12', '#b8343f', '#3f7a5a', '#f3cf7a', '#fff4d6', '#fff3da'), fonts: fonts('CT Vibes', 'CT Serif', 'CT Serif', 'CT Serif', { titleScale: 1.2 }), border: 'none', karaoke: 'banner', transition: 'curtain', title: 'outline', titleFill: '#fff3da', titleStroke: '#2a0c12', titleSw: 0.07, frameIn: 'pop' },
    cast: [ch('caroler', 'lead', { variant: 1, mood: 'sing' }), ch('angel', 'side'), ch('caroler', 'extra', { variant: 2, mood: 'sing' }), pr('church', 'hero'), pr('candle', 'floor'), pr('star', 'sky')],
    backdrop: 'candlelight', particles: 'twinkle', particleAmount: 0.6, frames: ['wreath', 'arch'], vignettes: ['church', 'candle', 'c:angel', 'bell'], lyricFx: 'twinkle',
    music: { styles: ['traditional hymn', 'warm congregational choir', 'acoustic piano', 'handbells', 'soft organ', 'gentle strings', 'joyful final verse'], negative: ['comedy', 'novelty sound effects', 'electronic beat'], bpm: 84, voices: 'warm alto lead with a full congregation joining the hook', notes: 'Christmas Eve service, candles raised on the last chorus.' },
    tone: 'Joyful and prayerful: peace, hope, light in the darkness, a blessing spoken over the family by name.' });

  /* ---------- Retro ---------- */
  T({ id: 'neon-noel', name: 'Neon Noel', occasion: 'christmas', family: 'retro',
    blurb: 'A synth-soaked 80s Christmas: laser grid, a dancing robot and your photos on the big TV.',
    tags: ['retro', '80s', 'eighties', 'neon', 'synth', 'robot', 'arcade', 'vhs', 'disco'],
    look: { pal: pal('#150a2e', '#3a1160', '#12081f', '#ff3d8b', '#3df0e0', '#ffd23f', '#ffffff', '#fdf3ff'), fonts: fonts('CT Neon', 'CT Retro', 'CT Retro', 'CT Retro', { titleScale: 0.8 }), border: 'none', karaoke: 'vhs', transition: 'blinds', title: 'neon', frameIn: 'slide' },
    cast: [ch('robot', 'lead'), ch('reindeer', 'side'), pr('cassette', 'hero', { float: true, size: 0.8 }), pr('radio', 'floor'), pr('discoball', 'sky')],
    backdrop: 'grid80s', particles: 'stars', particleAmount: 0.6, frames: ['tv', 'film'], vignettes: ['cassette', 'discoball', 'radio', 'c:robot'], two: true,
    music: { styles: ['80s synth-pop', 'gated reverb drums', 'analog synth bass', 'sparkling arpeggios', 'sleigh bells', 'saxophone hook', 'big chorus'], bpm: 118, voices: 'confident pop lead with stacked glossy harmonies', notes: 'A lost 1985 holiday single: huge chorus, shiny and joyful.' },
    tone: 'Cheeky and upbeat with a wink at the 80s (mixtapes, arcades, big hair), still heartfelt about the person.' });

  T({ id: 'vintage-postcard', name: 'Vintage Postcard', occasion: 'christmas', family: 'retro',
    blurb: 'A 1950s postcard: the red truck brings home the tree and your photos become postage stamps.',
    tags: ['retro', 'vintage', '50s', 'fifties', 'postcard', 'truck', 'red truck', 'tree farm', 'stamp', 'classic', 'santa'],
    look: { pal: pal('#1f4e6b', '#2f7396', '#1d2a33', '#d8452f', '#2f8f6f', '#f2c14e', '#fff8e8', '#fff3d6'), fonts: fonts('CT Fat', 'CT Sans Semi', 'CT Retro', 'CT Type'), border: 'stitch', karaoke: 'label', transition: 'clock', title: 'ribbon', frameIn: 'slide', tilt: -0.03 },
    cast: [ch('santa', 'lead'), ch('reindeer', 'side'), pr('truck', 'hero'), pr('pine', 'floor'), pr('present', 'floor')],
    backdrop: 'sunburst', particles: 'snow', particleAmount: 0.6, frames: ['stamp', 'sleigh'], vignettes: ['truck', 'tree', 'bell', 'c:santa'], tableau: 'ride',
    music: { styles: ['1950s rockabilly swing', 'slapback echo guitar', 'upright bass slap', 'doo-wop backing vocals', 'tenor sax', 'sleigh bells', 'shuffle drums'], bpm: 140, voices: 'smooth crooner lead with doo-wop "shoo-bop" harmonies', notes: 'A jukebox Christmas shuffle, chrome diner and all.' },
    tone: 'Charming and old-fashioned with playful mid-century slang, sweet as a soda-shop sundae.' });

  /* ---------- New Baby / First Christmas ---------- */
  T({ id: 'babys-first-christmas', name: 'Baby\'s First Christmas', occasion: 'christmas', family: 'new-baby',
    blurb: 'A pastel nursery, a rocking crib and a polar bear singing your little one\'s very first carol.',
    tags: ['baby', 'newborn', 'first christmas', 'nursery', 'crib', 'lullaby', 'infant', 'new parents', 'pastel', 'little one'],
    look: { pal: pal('#cfe8f5', '#fbe9ef', '#3a3550', '#f08aa0', '#7cc8b0', '#ffd27a', '#ffffff', '#ffffff'), fonts: fonts('CT Sans Bold', 'CT Sans Semi', 'CT Sans Semi', 'CT Hand Bold'), border: 'scallop', karaoke: 'cloud', transition: 'star', title: 'sticker', frameIn: 'pop', stage: 'cast-low' },
    cast: [ch('polarbear', 'lead'), ch('mouse', 'side'), pr('crib', 'hero', { size: 0.85 }), pr('rattle', 'floor'), pr('present', 'floor'), pr('moon', 'sky')],
    backdrop: 'nursery', particles: 'stars', particleAmount: 0.6, frames: ['bubble', 'starcut'], vignettes: ['crib', 'rattle', 'moon', 'c:polarbear'],
    music: { styles: ['gentle lullaby pop', 'music box', 'soft ukulele', 'glockenspiel', 'warm pad', 'light shaker', 'cooing harmonies'], negative: ['loud drums', 'fast tempo'], bpm: 84, voices: 'soft, smiling lead like a parent singing at the crib, airy harmonies', notes: 'A lullaby with a little bounce: sweet, small and brand new.' },
    tone: 'Soft and wonder-struck: tiny fingers, first snow, first lights; the baby\'s name sung gently in the hook.' });

  T({ id: 'woodland-lullaby', name: 'Woodland Lullaby', occasion: 'christmas', family: 'new-baby',
    blurb: 'Deep in a moonlit forest a fawn and an owl hush the snow for your newest arrival.',
    tags: ['baby', 'first christmas', 'woodland', 'forest', 'fawn', 'deer', 'owl', 'lullaby', 'moon', 'gentle', 'newborn'],
    look: { pal: pal('#16264a', '#2f4f86', '#101a33', '#e0566a', '#4fa57a', '#ffe08a', '#ffffff', '#f6f9ff'), fonts: fonts('CT Xmas', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand'), border: 'none', karaoke: 'snowbank', transition: 'fade', title: 'outline', titleStroke: '#101a33', frameIn: 'drop' },
    cast: [ch('fawn', 'lead'), ch('owl', 'side'), ch('mouse', 'extra'), pr('star', 'hero', { float: true, size: 0.7 }), pr('snowpile', 'floor'), pr('lantern', 'floor')],
    backdrop: 'forest', particles: 'snow', particleAmount: 0.7, frames: ['wreath', 'snowglobe'], vignettes: ['c:fawn', 'star', 'c:owl', 'lantern'], lyricFx: 'twinkle',
    music: { styles: ['hushed folk lullaby', 'fingerpicked nylon guitar', 'soft flute', 'kalimba', 'warm upright bass', 'wind chimes', 'whispered harmonies'], negative: ['loud drums', 'fast tempo'], bpm: 78, voices: 'breathy, tender lead with a low humming harmony', notes: 'Snow falling through tall trees; everything quiet for the baby.' },
    tone: 'Hushed and tender, written to the baby: the world is new, the family has been waiting, welcome.' });

  /* ---------- Far Away ---------- */
  T({ id: 'missing-you-window', name: 'Candle in the Window', occasion: 'christmas', family: 'far-away',
    blurb: 'A candle on the sill, city lights across the water and a little plane carrying your love home.',
    tags: ['far away', 'missing you', 'long distance', 'window', 'candle', 'airplane', 'deployed', 'abroad', 'miles apart', 'homesick'],
    look: { pal: pal('#1a2447', '#3a4a80', '#1c1a2a', '#d8504a', '#3f8f7a', '#ffd98a', '#ffffff', '#fff6e6'), fonts: fonts('CT Type', 'CT Hand', 'CT Type', 'CT Hand'), border: 'none', karaoke: 'glass', transition: 'rise', title: 'plate', frameIn: 'slide', stage: 'cast-low', tilt: 0.03 },
    cast: [ch('mouse', 'lead'), ch('cat', 'side'), pr('envelope', 'hero', { float: true, size: 0.7 }), pr('candle', 'floor'), pr('globe', 'floor'), pr('airplane', 'fly', { every: 10 })],
    backdrop: 'windowfar', particles: 'snow', particleAmount: 0.5, frames: ['stamp', 'polaroid'], vignettes: ['candle', 'envelope', 'globe', 'airplane'], lyricFx: 'twinkle',
    music: { styles: ['wistful indie folk', 'soft piano', 'fingerpicked guitar', 'distant sleigh bells', 'warm cello', 'tape hiss', 'hopeful lift in the chorus'], bpm: 86, voices: 'close, honest lead, a second voice joins from "far away" in the hook', notes: 'Bittersweet but hopeful: a light left on for someone coming home.' },
    tone: 'Honest about the distance and the missing, hopeful about the next visit; specific places and time zones welcome.' });

  T({ id: 'airmail-christmas', name: 'Airmail Christmas', occasion: 'christmas', family: 'far-away',
    blurb: 'A brown-paper parcel with stamps and string: an owl posts your carol across the miles.',
    tags: ['far away', 'airmail', 'parcel', 'post', 'mail', 'stamps', 'letter', 'overseas', 'miss you', 'owl', 'kraft'],
    look: { pal: pal('#c9a26b', '#b98f58', '#3b2a1a', '#c8323c', '#2f7d55', '#f2c14e', '#ffffff', '#fff8ea'), fonts: fonts('CT Hand Bold', 'CT Hand', 'CT Hand Bold', 'CT Hand'), border: 'none', karaoke: 'tape', transition: 'page', title: 'plate', frameIn: 'spin', tilt: 0.04 },
    cast: [ch('owl', 'lead'), ch('snowman', 'side'), pr('mailbox', 'hero'), pr('envelope', 'floor'), pr('globe', 'floor'), pr('airplane', 'fly', { every: 8 })],
    backdrop: 'kraft', particles: 'twinkle', particleAmount: 0.3, frames: ['stamp', 'tag'], vignettes: ['mailbox', 'envelope', 'airplane', 'globe'],
    music: { styles: ['jaunty travelling folk', 'ukulele', 'accordion', 'brushed train-beat drums', 'whistling', 'sleigh bells', 'singalong chorus'], bpm: 110, voices: 'bright, friendly lead with a cheerful group on the hook', notes: 'A postcard on its way: light on its feet, every mile a smile.' },
    tone: 'Cheerful and loving across the miles: what they would do together if they were here, a hug in the mail.' });

  /* =================================================== BIRTHDAY =================================================== */
  T({ id: 'birthday-bash', name: 'Birthday Bash', occasion: 'birthday', family: 'birthday-party',
    blurb: 'A party bear, a bunny, a big cake and your photos floating in on balloons.',
    tags: ['birthday', 'party', 'cake', 'balloons', 'bear', 'bunny', 'kids', 'bright', 'confetti', 'celebrate'],
    look: { pal: pal('#6a4bd8', '#a56bf0', '#2a1a4a', '#ff5d8f', '#22c1a8', '#ffd23f', '#ffffff', '#fffaf0'), fonts: fonts('CT Chewy', 'CT Sans Bold', 'CT Chewy', 'CT Hand Bold'), border: 'bunting', karaoke: 'pill', transition: 'star', title: 'sticker', frameIn: 'rise', stage: 'cast-low' },
    cast: [ch('bear', 'lead'), ch('bunny', 'side'), ch('bird', 'extra'), pr('cake', 'hero'), pr('partyhat', 'floor'), pr('cupcake', 'floor')],
    backdrop: 'partywall', particles: 'confetti', frames: ['balloonframe', 'starcut', 'polaroid'], vignettes: ['cake', 'balloons', 'c:bear', 'cupcake'], two: true,
    music: { styles: ['bouncy party pop', 'funky bass', 'hand claps', 'brass stabs', 'ukulele', 'party horns', 'shout-along chorus'], bpm: 126, voices: 'bright, grinning lead with a whole party shouting the name on the hook', notes: 'Candles lit, everyone crowding in: pure cake-time joy.' },
    tone: 'Joyful and personal: their age, their quirks, what everyone loves about them; no stock birthday-song lines.' });

  T({ id: 'birthday-spotlight', name: 'Birthday Spotlight', occasion: 'birthday', family: 'birthday-party',
    blurb: 'Curtain up! A fox on the mic, a disco ball and tonight\'s star: the birthday legend.',
    tags: ['birthday', 'stage', 'spotlight', 'show', 'star', 'disco', 'fox', 'grown-up', 'milestone', '30th', '40th', '50th'],
    look: { pal: pal('#2a1238', '#4a1f4f', '#1a0c24', '#d8283c', '#35c7c0', '#ffcf4a', '#ffffff', '#fff6e8'), fonts: fonts('CT Retro', 'CT Sans Semi', 'CT Sans Bold', 'CT Hand Bold'), border: 'none', karaoke: 'marquee', transition: 'curtain', title: 'neon', frameIn: 'drop', stage: 'cast-low' },
    cast: [ch('fox', 'lead'), ch('bird', 'side'), pr('microphone', 'hero', { size: 0.85 }), pr('cupcake', 'floor'), pr('balloons', 'floor'), pr('discoball', 'sky')],
    backdrop: 'stage', particles: 'stars', particleAmount: 0.6, frames: ['film', 'tv'], vignettes: ['microphone', 'discoball', 'cake', 'c:fox'],
    music: { styles: ['big band swing pop', 'punchy horn section', 'walking bass', 'swinging drums', 'jazz piano', 'show-stopper ending', 'crowd applause'], bpm: 132, voices: 'charismatic showman lead with a brassy backing trio', notes: 'An awards-show opening number in honour of one person.' },
    tone: 'A playful tribute: introduce them like a legend, tease the age gently, big applause in the hook.' });

  /* =================================================== LOVE =================================================== */
  T({ id: 'love-letter', name: 'Love Letter', occasion: 'love', family: 'love-notes',
    blurb: 'Two songbirds, a letter sealed with a heart and a rose-coloured dusk.',
    tags: ['love', 'valentine', 'anniversary', 'letter', 'songbird', 'romantic', 'wife', 'husband', 'partner', 'sweetheart', 'dusk'],
    look: { pal: pal('#4a2a6a', '#c8568a', '#2a1638', '#e8456b', '#7a5ad8', '#ffd27a', '#ffffff', '#fff3f6'), fonts: fonts('CT Vibes', 'CT Serif', 'CT Lobster', 'CT Script', { titleScale: 1.2 }), border: 'hearts', karaoke: 'heart', transition: 'heart', title: 'outline', titleStroke: '#4a1a4a', titleSw: 0.07, frameIn: 'swing' },
    cast: [ch('bird', 'lead'), ch('bird', 'side'), pr('loveletter', 'hero', { float: true, size: 0.7 }), pr('bouquet', 'floor'), pr('heart', 'sky')],
    backdrop: 'rosedusk', particles: 'hearts', particleAmount: 0.7, frames: ['locket', 'scallopcard'], vignettes: ['loveletter', 'heart', 'bouquet', 'c:bird'],
    music: { styles: ['tender acoustic love song', 'fingerpicked guitar', 'soft piano', 'warm strings', 'brushed drums', 'gentle harmonies', 'slow build'], bpm: 82, voices: 'intimate, sincere lead with a close harmony on the hook', notes: 'A love letter read out loud, just the two of them in the room.' },
    tone: 'Sincere and specific: how it started, the small daily things, a promise in the hook; no cliches.' });

  T({ id: 'bloom-for-you', name: 'Bloom for You', occasion: 'love', family: 'love-notes',
    blurb: 'A garden in full bloom, a bunny with a bouquet and petals falling around your favourite person.',
    tags: ['love', 'flowers', 'garden', 'bouquet', 'spring', 'sweet', 'crush', 'girlfriend', 'boyfriend', 'best friend', 'petals'],
    look: { pal: pal('#fdf3e3', '#d9f0dc', '#3a2a3f', '#f0607a', '#4fa868', '#ffc145', '#ffffff', '#ffffff'), fonts: fonts('CT Script', 'CT Sans Semi', 'CT Hand Bold', 'CT Hand', { titleScale: 0.92 }), border: 'vine', karaoke: 'grass', transition: 'iris', title: 'sticker', frameIn: 'pop', tilt: -0.02 },
    cast: [ch('bunny', 'lead'), ch('fox', 'side'), pr('bouquet', 'hero', { size: 0.85 }), pr('loveletter', 'floor'), pr('rainbow', 'sky')],
    backdrop: 'gardenbloom', particles: 'petals', frames: ['scallopcard', 'polaroid'], vignettes: ['bouquet', 'c:bunny', 'rainbow', 'heart'],
    music: { styles: ['sunny indie pop', 'ukulele', 'glockenspiel', 'hand claps', 'whistled hook', 'light tambourine', 'sweet duet harmonies'], bpm: 108, voices: 'sweet, smiling lead with a playful duet partner', notes: 'Butterflies-in-the-stomach happy, light as a spring morning.' },
    tone: 'Sweet and playful: what makes them wonderful, a couple of silly pet names, bright and affectionate.' });

  /* =================================================== THANK YOU =================================================== */
  T({ id: 'thanks-a-bunch', name: 'Thanks a Bunch', occasion: 'thanks', family: 'thank-you',
    blurb: 'A sunny meadow, a fox with flowers and a rainbow of thanks.',
    tags: ['thank you', 'thanks', 'gratitude', 'teacher', 'coach', 'nurse', 'friend', 'meadow', 'sunny', 'flowers', 'appreciation'],
    look: { pal: pal('#5ab8f0', '#bfe8ff', '#27405a', '#ff6b5e', '#5fb85a', '#ffc93c', '#ffffff', '#fffdf4'), fonts: fonts('CT Fat', 'CT Sans Semi', 'CT Sans Bold', 'CT Hand Bold'), border: 'dots', karaoke: 'cloud', transition: 'rise', title: 'outline', titleStroke: '#27405a', frameIn: 'rise' },
    cast: [ch('fox', 'lead'), ch('bird', 'side'), ch('bunny', 'extra'), pr('bouquet', 'hero', { size: 0.8 }), pr('cupcake', 'floor'), pr('rainbow', 'sky')],
    backdrop: 'sunnymeadow', particles: 'petals', particleAmount: 0.6, frames: ['polaroid', 'plain'], vignettes: ['bouquet', 'sun', 'rainbow', 'c:fox'],
    music: { styles: ['sunny folk-pop', 'strummed acoustic guitar', 'hand claps', 'banjo', 'tambourine', 'whistling', 'big friendly chorus'], bpm: 116, voices: 'open-hearted lead with a cheerful group echoing "thank you"', notes: 'A grateful grin of a song, windows down on a bright day.' },
    tone: 'Warm and specific gratitude: name exactly what they did and what it meant, upbeat not gushing.' });

  T({ id: 'thank-you-note', name: 'Thank-You Note', occasion: 'thanks', family: 'thank-you',
    blurb: 'A hand-written note come to life: doodles in the margins and a songbird delivering it.',
    tags: ['thank you', 'note', 'handwritten', 'letter', 'teacher', 'mentor', 'host', 'gift', 'grateful', 'doodle', 'stationery'],
    look: { pal: pal('#fffaf0', '#fff1dc', '#2a3350', '#f0607a', '#3a8fd8', '#ffb72e', '#ffffff', '#ffffff'), fonts: fonts('CT Type', 'CT Hand Bold', 'CT Hand Bold', 'CT Hand'), border: 'stitch', karaoke: 'tape', transition: 'page', title: 'plate', frameIn: 'spin', tilt: 0.04 },
    cast: [ch('bird', 'lead'), ch('bunny', 'side'), pr('heart', 'hero', { float: true, size: 0.6 }), pr('loveletter', 'floor'), pr('sun', 'sky')],
    backdrop: 'notepaper', particles: 'notes', particleAmount: 0.5, frames: ['stamp', 'tag'], vignettes: ['loveletter', 'c:bird', 'heart', 'sun'],
    music: { styles: ['cozy singer-songwriter', 'upright piano', 'brushed snare', 'acoustic guitar', 'melodica', 'finger snaps', 'gentle singalong'], bpm: 98, voices: 'conversational, heartfelt lead with a soft friend harmony', notes: 'Like reading a thank-you card aloud with a smile.' },
    tone: 'Personal and humble: one clear thing they did, how it helped, a little humour, a real thank you by name.' });

  /* =================================================== CONGRATULATIONS =================================================== */
  T({ id: 'hip-hip-hooray', name: 'Hip Hip Hooray', occasion: 'congrats', family: 'well-done',
    blurb: 'Fireworks over the skyline, a trophy and a fox leading the cheer for the big win.',
    tags: ['congratulations', 'congrats', 'fireworks', 'trophy', 'win', 'new job', 'promotion', 'engaged', 'new home', 'celebrate', 'hooray'],
    look: { pal: pal('#141a4a', '#3a2468', '#0f1230', '#ff4f8b', '#35d0c0', '#ffd23f', '#ffffff', '#fff8ee'), fonts: fonts('CT Bangers', 'CT Sans Bold', 'CT Sans Bold', 'CT Hand Bold'), border: 'none', karaoke: 'neon', transition: 'flash', title: 'outline', titleFill: '#ffd23f', titleStroke: '#0f1230', frameIn: 'pop', stage: 'cast-low' },
    cast: [ch('fox', 'lead'), ch('bear', 'side'), pr('trophy', 'hero', { size: 0.8 }), pr('balloons', 'floor'), pr('partyhat', 'floor'), pr('firework', 'sky')],
    backdrop: 'fireworksky', particles: 'confetti', particleAmount: 0.7, frames: ['starcut', 'film'], vignettes: ['trophy', 'firework', 'balloons', 'c:fox'], two: true,
    music: { styles: ['triumphant pop anthem', 'stadium drums', 'bright brass fanfare', 'gang vocals', 'hand claps', 'soaring synth lead', 'victory chant'], bpm: 128, voices: 'powerful, proud lead with a stadium crowd on the hook', notes: 'The moment the whole room jumps up and cheers.' },
    tone: 'Proud and loud: name the achievement, the work it took, and tell them they earned it.' });

  T({ id: 'gold-medal', name: 'Gold Medal Moment', occasion: 'congrats', family: 'well-done',
    blurb: 'Top of the podium: laurels, gold rays and your champion\'s photo on a medal.',
    tags: ['congratulations', 'congrats', 'graduation', 'graduate', 'medal', 'podium', 'champion', 'award', 'retirement', 'proud', 'achievement'],
    look: { pal: pal('#0f3a4a', '#1f6a70', '#0c2a36', '#e0563f', '#2f9fd8', '#f5c542', '#ffffff', '#fdf8ea'), fonts: fonts('CT Serif', 'CT Sans Semi', 'CT Sans Semi', 'CT Serif'), border: 'goldline', karaoke: 'banner', transition: 'diamond', title: 'gold', frameIn: 'drop', stage: 'cast-low' },
    cast: [ch('bird', 'lead'), ch('bunny', 'side'), ch('bear', 'extra'), pr('gradcap', 'hero', { float: true, size: 0.7 }), pr('trophy', 'floor'), pr('bouquet', 'floor'), pr('star', 'sky')],
    backdrop: 'podium', particles: 'confetti', particleAmount: 0.6, frames: ['medal', 'plain'], vignettes: ['trophy', 'gradcap', 'star', 'c:bird'],
    music: { styles: ['uplifting orchestral pop', 'noble brass theme', 'snare roll', 'grand piano', 'string swells', 'choir "ahs"', 'triumphant finale'], bpm: 104, voices: 'warm, proud lead with a choir lifting the hook', notes: 'The medal ceremony: chin up, eyes shining, anthem swelling.' },
    tone: 'Dignified and proud: the long road, the people cheering, what comes next; heartfelt, lightly humorous.' });

  CarolTemplates.list = list;
  var byId = {};
  list.forEach(function (t) { byId[t.id] = t; });
  /* THE LIBRARY (library/): thousands more templates, made from blocks by recipes. They are not in this file and not in
     `list` (the 33 above are the launch set and stay as they are). The server resolves a library id through
     `resolve` (library/index.js sets it); a page is handed the definitions it needs by the API and keeps them with
     `add`. A definition carries its version `v`: get(id, v) answers that version while it is known. */
  var extra = {};
  CarolTemplates.resolve = null;
  CarolTemplates.add = function (t) { if (!t || !t.id || byId[t.id]) return null; extra[t.id + '@' + (t.v || 1)] = t; if (!extra[t.id] || (extra[t.id].v || 1) <= (t.v || 1)) extra[t.id] = t; return t; };
  CarolTemplates.get = function (id, v) { return byId[id] || (v && extra[id + '@' + v]) || (CarolTemplates.resolve && CarolTemplates.resolve(id, v)) || extra[id] || null; };
  /* search({ q, occasion, family, page, per }) -> { items, total, page, pages } : every word of q must match somewhere */
  CarolTemplates.search = function (o) {
    o = o || {};
    var words = String(o.q || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), per = Math.max(1, Math.min(100, Math.floor(o.per) || 12));
    var fams = {}; CarolTemplates.families.forEach(function (f) { fams[f.id] = f.name; });
    var items = list.filter(function (t) {
      if (o.occasion && t.occasion !== o.occasion) return false;
      if (o.family && t.family !== o.family) return false;
      if (!words.length) return true;
      var hay = (t.id + ' ' + t.name + ' ' + t.occasion + ' ' + t.family + ' ' + (fams[t.family] || '') + ' ' + t.blurb + ' ' + t.tags.join(' ') + ' ' + t.cast.map(function (c) { return c.name; }).join(' ')).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) >= 0; });
    }).sort(function (a, b) { return a.order - b.order; });
    var total = items.length, pages = Math.max(1, Math.ceil(total / per)), page = Math.max(1, Math.min(pages, Math.floor(o.page) || 1));
    return { items: items.slice((page - 1) * per, page * per), total: total, page: page, pages: pages };
  };
  return CarolTemplates;
});
