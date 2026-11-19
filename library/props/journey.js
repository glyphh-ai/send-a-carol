'use strict';
// library/props/journey.js : the props of art/pack-props-journey.js (travel and road trips, new drivers, school and
// graduation, teachers and coaches, get-well and thank-you-for-caring, comfort, the outdoors and camping).
// None of them carries lettering, a brand or a real mark.
module.exports = [
  { name: 'suitcase', label: 'a well-travelled suitcase with stickers and a swinging tag', tags: ['travel', 'trip', 'vacation', 'bon-voyage', 'luggage', 'moving', 'farewell'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'passport', label: 'a passport with a boarding pass tucked inside', tags: ['travel', 'passport', 'trip', 'bon-voyage', 'abroad', 'vacation', 'airport'], roles: ['hero', 'floor'], size: 0.7, float: false },
  { name: 'campervan', label: 'a two-tone camper van with a board on the roof', tags: ['road-trip', 'camper', 'van', 'travel', 'vacation', 'retirement', 'adventure', 'retro'], roles: ['hero', 'floor'], size: 0.95, float: false },
  { name: 'compass', label: 'a brass compass, its needle hunting for north', tags: ['compass', 'travel', 'adventure', 'journey', 'graduation', 'new-chapter', 'hiking'], roles: ['hero', 'floor', 'sky'], size: 0.7, float: false },
  { name: 'foldedmap', label: 'a folded map with a dotted route to an X', tags: ['map', 'travel', 'road-trip', 'adventure', 'journey', 'treasure', 'moving'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'signpost', label: 'a wooden signpost with three blank arrows and a bird on top', tags: ['signpost', 'journey', 'travel', 'crossroads', 'new-chapter', 'hiking', 'farewell'], roles: ['floor', 'hero'], size: 0.85, float: false },
  { name: 'carkey', label: 'a car key on a ring with a heart charm', tags: ['car', 'key', 'new-driver', 'driving', 'licence', 'new-car', 'teen'], roles: ['hero', 'floor'], size: 0.7, float: false },
  { name: 'idcard', label: 'a card on a lanyard with a face shape and plain lines', tags: ['licence', 'new-driver', 'badge', 'new-job', 'work', 'id', 'first-day'], roles: ['hero', 'floor'], size: 0.7, float: false },
  { name: 'littlecar', label: 'a round little car with a suitcase on the roof', tags: ['car', 'new-driver', 'driving', 'road-trip', 'new-car', 'travel', 'cute'], roles: ['hero', 'floor'], size: 0.9, float: false },
  { name: 'diploma', label: 'a rolled diploma with a ribbon and a gold seal', tags: ['graduation', 'diploma', 'school', 'degree', 'achievement', 'congratulations'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'bookstack', label: 'a stack of books with an open one on top, a page turning', tags: ['books', 'school', 'reading', 'teacher', 'study', 'graduation', 'library', 'back-to-school'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'backpack', label: 'a school backpack with badges, a bottle and a rolled mat', tags: ['backpack', 'school', 'back-to-school', 'first-day', 'hiking', 'kids', 'travel'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'pencil', label: 'a yellow pencil finishing a squiggle', tags: ['pencil', 'school', 'teacher', 'back-to-school', 'writing', 'art', 'kids'], roles: ['floor', 'hero'], size: 0.7, float: false },
  { name: 'apple', label: 'a shiny red apple with a friendly face', tags: ['apple', 'teacher', 'school', 'thank-you', 'autumn', 'healthy', 'cute'], roles: ['hero', 'floor'], size: 0.65, float: false },
  { name: 'schoolbus', label: 'a plain yellow school bus with friends at the windows', tags: ['school', 'bus', 'back-to-school', 'first-day', 'kids', 'teacher', 'driver'], roles: ['hero', 'floor'], size: 0.95, float: false },
  { name: 'whistle', label: 'a coach\'s whistle on a cord, mid-tweet', tags: ['whistle', 'coach', 'sport', 'team', 'referee', 'thank-you', 'pe'], roles: ['hero', 'floor'], size: 0.65, float: false },
  { name: 'clipboard', label: 'a clipboard with a list being ticked off', tags: ['clipboard', 'coach', 'work', 'checklist', 'teacher', 'nurse', 'organised', 'new-job'], roles: ['hero', 'floor'], size: 0.75, float: false },
  { name: 'stethoscope', label: 'a stethoscope listening to a little heart', tags: ['stethoscope', 'nurse', 'doctor', 'medic', 'get-well', 'thank-you', 'care', 'hospital'], roles: ['hero', 'floor'], size: 0.75, float: false },
  { name: 'teacup', label: 'a flowered teacup on its saucer, steaming, with a biscuit', tags: ['tea', 'comfort', 'get-well', 'thinking-of-you', 'cozy', 'grandparents', 'calm'], roles: ['hero', 'floor'], size: 0.7, float: false },
  { name: 'soupbowl', label: 'a steaming bowl of soup with a heel of bread', tags: ['soup', 'get-well', 'comfort', 'cozy', 'care', 'thinking-of-you', 'winter'], roles: ['hero', 'floor'], size: 0.75, float: false },
  { name: 'mendedheart', label: 'a heart stitched up with a little plaster on it', tags: ['get-well', 'heart', 'healing', 'sorry', 'care', 'recovery', 'thinking-of-you'], roles: ['hero', 'sky', 'floor'], size: 0.75, float: false },
  { name: 'umbrella', label: 'a striped umbrella keeping the rain off', tags: ['umbrella', 'rain', 'comfort', 'thinking-of-you', 'spring', 'shower', 'care'], roles: ['hero', 'floor'], size: 0.85, float: false },
  { name: 'sunflower', label: 'a smiling sunflower with a bee coming by', tags: ['sunflower', 'flower', 'get-well', 'thank-you', 'summer', 'cheer', 'garden', 'teacher'], roles: ['floor', 'hero'], size: 0.85, float: false },
  { name: 'hotairballoon', label: 'a striped hot-air balloon drifting between small clouds', tags: ['balloon', 'travel', 'adventure', 'sky', 'bon-voyage', 'dream', 'journey'], roles: ['sky', 'hero', 'fly'], size: 0.9, float: true },
  { name: 'sailboat', label: 'a little sailboat on rolling waves with a gull', tags: ['sailboat', 'boat', 'sea', 'travel', 'retirement', 'summer', 'bon-voyage', 'lake'], roles: ['hero', 'floor'], size: 0.9, float: false },
  { name: 'steamtrain', label: 'a toy-bright steam engine puffing along', tags: ['train', 'travel', 'journey', 'kids', 'retro', 'station', 'adventure'], roles: ['hero', 'floor'], size: 0.95, float: false },
  { name: 'tent', label: 'a tent among pines with a lantern lit inside', tags: ['tent', 'camping', 'outdoors', 'adventure', 'summer', 'scouts', 'night'], roles: ['hero', 'floor'], size: 0.9, float: false },
  { name: 'campfire', label: 'a crackling campfire in a ring of stones, a marshmallow toasting', tags: ['campfire', 'camping', 'outdoors', 'cozy', 'summer', 'night', 'friends', 'sing-along'], roles: ['hero', 'floor'], size: 0.85, float: false },
  { name: 'canoe', label: 'a packed canoe resting among the reeds, a lantern at the bow', tags: ['canoe', 'lake', 'river', 'camping', 'outdoors', 'adventure', 'summer', 'retirement'], roles: ['hero', 'floor'], size: 0.95, float: false }
];
