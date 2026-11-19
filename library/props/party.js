'use strict';
// library/props/party.js : the party props (art/pack-props-party.js). roles: hero = the big centre piece, floor = small,
// beside the cast, sky = floats in a top corner, fly = crosses the sky. size = its usual scale; float = it hangs in the air.
const foil = function (n, words) {
  return { name: 'foil' + n, label: 'foil number balloons: ' + n, tags: ['balloon', 'foil', 'number', 'birthday', 'age-' + n].concat(words || []), roles: ['hero', 'sky'], size: 0.85, float: true, number: n };
};
module.exports = [
  { name: 'tiercake', label: 'a three-tier cake', tags: ['cake', 'birthday', 'wedding', 'anniversary', 'celebration', 'sweet'], roles: ['hero', 'floor'], size: 0.9, float: false },
  { name: 'giftstack', label: 'a stack of presents', tags: ['gift', 'present', 'birthday', 'celebration', 'shower'], roles: ['hero', 'floor'], size: 0.85, float: false },
  { name: 'popper', label: 'a party popper firing streamers', tags: ['popper', 'confetti', 'streamers', 'party', 'celebration', 'congrats', 'new-year'], roles: ['hero', 'floor', 'sky'], size: 0.8, float: false },
  { name: 'crown', label: 'a crown on a velvet cushion', tags: ['crown', 'royal', 'birthday', 'queen', 'king', 'winner'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'pinata', label: 'a burro pinata', tags: ['pinata', 'party', 'fiesta', 'birthday', 'kids'], roles: ['hero', 'sky'], size: 0.85, float: true },
  { name: 'candles', label: 'a row of lit birthday candles', tags: ['candles', 'birthday', 'cake', 'wish'], roles: ['hero', 'floor'], size: 0.85, float: false },
  { name: 'pizza', label: 'a pizza with a slice pulled away', tags: ['pizza', 'food', 'party', 'friends', 'sleepover'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'icecream', label: 'an ice-cream sundae', tags: ['icecream', 'sundae', 'sweet', 'treat', 'summer', 'kids'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'toastglasses', label: 'two clinking glasses', tags: ['toast', 'cheers', 'glasses', 'celebration', 'anniversary', 'wedding', 'new-year', 'congrats'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'partyblower', label: 'a party blower', tags: ['blower', 'party', 'birthday', 'new-year', 'funny'], roles: ['floor', 'sky', 'hero'], size: 0.7, float: false },
  { name: 'sparkler', label: 'two crossed sparklers', tags: ['sparkler', 'sparkle', 'celebration', 'new-year', 'night', 'wedding'], roles: ['hero', 'floor', 'sky'], size: 0.8, float: false },
  { name: 'banner', label: 'a blank banner on two poles', tags: ['banner', 'celebration', 'welcome', 'congrats', 'party'], roles: ['hero', 'floor'], size: 0.9, float: false },
  { name: 'foilstar', label: 'a foil star balloon', tags: ['balloon', 'foil', 'star', 'party', 'congrats'], roles: ['sky', 'hero'], size: 0.75, float: true },
  { name: 'foilheart', label: 'a foil heart balloon', tags: ['balloon', 'foil', 'heart', 'love', 'anniversary', 'valentine'], roles: ['sky', 'hero'], size: 0.75, float: true },
  foil(1, ['first-birthday', 'baby']), foil(5, ['kids']), foil(10, ['kids']), foil(16, ['teens', 'sweet-sixteen']), foil(18, ['teens', 'coming-of-age']),
  foil(21, ['coming-of-age']), foil(25, ['milestone', 'anniversary']), foil(30, ['milestone']), foil(40, ['milestone']), foil(50, ['milestone', 'anniversary']),
  foil(60, ['milestone']), foil(70, ['milestone']), foil(80, ['milestone']), foil(90, ['milestone']), foil(100, ['milestone', 'century'])
];
