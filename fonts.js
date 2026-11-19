/* Send a Carol fonts: our own family names for every .ttf in ./fonts.
   Use them as ctx.font = '48px "CT Sans"' (the weight lives in the family name, never 'bold'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CarolFonts = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var CarolFonts = {};
  CarolFonts.list = [
    { family: 'CT Xmas', file: 'MountainsofChristmas-Regular.ttf' },
    { family: 'CT Xmas Bold', file: 'MountainsofChristmas-Bold.ttf' },
    { family: 'CT Serif', file: 'DMSerifDisplay-Regular.ttf' },
    { family: 'CT Fat', file: 'AbrilFatface-Regular.ttf' },
    { family: 'CT Script', file: 'Pacifico-Regular.ttf' },
    { family: 'CT Vibes', file: 'GreatVibes-Regular.ttf' },
    { family: 'CT Hand', file: 'Kalam-Regular.ttf' },
    { family: 'CT Hand Bold', file: 'Kalam-Bold.ttf' },
    { family: 'CT Sans', file: 'Poppins-Regular.ttf' },
    { family: 'CT Sans Semi', file: 'Poppins-SemiBold.ttf' },
    { family: 'CT Sans Bold', file: 'Poppins-Bold.ttf' },
    { family: 'CT Chewy', file: 'Chewy-Regular.ttf' },
    { family: 'CT Bangers', file: 'Bangers-Regular.ttf' },
    { family: 'CT Retro', file: 'Righteous-Regular.ttf' },
    { family: 'CT Pixel', file: 'PressStart2P-Regular.ttf' },
    { family: 'CT Carol', file: 'CinzelDecorative-Regular.ttf' },
    { family: 'CT Carol Bold', file: 'CinzelDecorative-Bold.ttf' },
    { family: 'CT Lobster', file: 'Lobster-Regular.ttf' },
    { family: 'CT Type', file: 'SpecialElite-Regular.ttf' },
    { family: 'CT Neon', file: 'Monoton-Regular.ttf' }
  ];
  CarolFonts.families = CarolFonts.list.map(function (f) { return f.family; });

  /* Server: CarolFonts.registerNode(require('@napi-rs/canvas'), path.join(__dirname, 'fonts')) -> number registered. */
  CarolFonts.registerNode = function (canvasModule, dir) {
    var G = canvasModule && canvasModule.GlobalFonts, n = 0, i;
    if (!G || typeof G.registerFromPath !== 'function') throw new Error('CarolFonts.registerNode needs @napi-rs/canvas');
    dir = String(dir || 'fonts').replace(/[\\/]+$/, '');
    for (i = 0; i < CarolFonts.list.length; i++) { if (G.registerFromPath(dir + '/' + CarolFonts.list[i].file, CarolFonts.list[i].family)) n++; }
    return n;
  };

  /* Browser: CarolFonts.loadBrowser(document, '/fonts/') -> Promise that resolves when every font is ready.
     The only function here that touches the DOM; the engine never calls it. */
  CarolFonts.loadBrowser = function (doc, base) {
    doc = doc || (typeof document !== 'undefined' ? document : null);
    base = base == null ? '/fonts/' : String(base);
    if (!doc || !doc.fonts || typeof FontFace === 'undefined') return Promise.resolve(0);
    return Promise.all(CarolFonts.list.map(function (f) {
      var face = new FontFace(f.family, 'url(' + base + f.file + ')');
      return face.load().then(function (loaded) { doc.fonts.add(loaded); return 1; }, function () { return 0; });
    })).then(function (r) { return r.reduce(function (a, b) { return a + b; }, 0); });
  };
  return CarolFonts;
});
