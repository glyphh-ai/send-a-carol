'use strict';
// library/props/life.js : the props of art/pack-props-life.js (weddings, babies, new homes, new jobs, retirement).
// roles: hero = the big centre piece; floor = small, beside the cast; sky = floats in a top corner; fly = crosses the sky.
module.exports = [
  { name: 'rings', label: 'two linked wedding rings', tags: ['wedding', 'engagement', 'anniversary', 'rings', 'love'], roles: ['hero', 'sky'], size: 0.8, float: true },
  { name: 'weddingcake', label: 'a three-tier wedding cake with flowers', tags: ['wedding', 'anniversary', 'cake', 'love'], roles: ['hero', 'floor'], size: 0.9, float: false },
  { name: 'floralarch', label: 'an arch covered in flowers', tags: ['wedding', 'engagement', 'garden', 'flowers', 'spring'], roles: ['hero'], size: 1, float: false },
  { name: 'dovepair', label: 'two doves carrying a ribbon', tags: ['wedding', 'anniversary', 'love', 'doves', 'birds'], roles: ['sky', 'fly', 'hero'], size: 0.8, float: true },
  { name: 'stroller', label: 'a pram with a sleeping baby', tags: ['baby', 'newborn', 'shower', 'parents'], roles: ['hero', 'floor'], size: 0.85, float: false },
  { name: 'babybottle', label: 'a baby bottle', tags: ['baby', 'newborn', 'shower'], roles: ['floor', 'hero'], size: 0.6, float: false },
  { name: 'teddy', label: 'a waving teddy bear', tags: ['baby', 'kids', 'toy', 'get-well', 'love'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'babyblocks', label: 'a stack of toy blocks', tags: ['baby', 'kids', 'toy', 'shower', 'birthday'], roles: ['floor', 'hero'], size: 0.7, float: false },
  { name: 'onesieline', label: 'onesies drying on a clothesline', tags: ['baby', 'newborn', 'shower', 'laundry'], roles: ['hero'], size: 0.95, float: false },
  { name: 'cribmobile', label: 'a crib mobile of stars and a moon', tags: ['baby', 'newborn', 'nursery', 'night'], roles: ['sky', 'hero'], size: 0.8, float: true },
  { name: 'bundle', label: 'a swaddled baby with a bow', tags: ['baby', 'newborn', 'arrival', 'adoption'], roles: ['hero', 'floor'], size: 0.75, float: false },
  { name: 'housekey', label: 'a gold key with a little house on its ring', tags: ['home', 'moving', 'housewarming', 'key'], roles: ['hero', 'sky'], size: 0.75, float: true },
  { name: 'movingbox', label: 'an open moving box', tags: ['home', 'moving', 'housewarming', 'farewell'], roles: ['floor', 'hero'], size: 0.75, float: false },
  { name: 'movingvan', label: 'a little moving van', tags: ['home', 'moving', 'farewell', 'van'], roles: ['hero', 'floor'], size: 0.9, float: false },
  { name: 'yardsign', label: 'a blank sign on a post', tags: ['home', 'moving', 'housewarming', 'sign', 'welcome'], roles: ['hero', 'floor'], size: 0.85, float: false },
  { name: 'houseplant', label: 'a leafy plant in a pot', tags: ['home', 'housewarming', 'plant', 'office', 'get-well'], roles: ['floor', 'hero'], size: 0.7, float: false },
  { name: 'toolbox', label: 'a toolbox full of tools', tags: ['home', 'diy', 'dad', 'work', 'housewarming'], roles: ['floor', 'hero'], size: 0.75, float: false },
  { name: 'frontdoor', label: 'a front door with a wreath of leaves', tags: ['home', 'housewarming', 'welcome', 'moving'], roles: ['hero'], size: 1, float: false },
  { name: 'briefcase', label: 'a leather briefcase', tags: ['work', 'job', 'promotion', 'office', 'retirement'], roles: ['floor', 'hero'], size: 0.7, float: false },
  { name: 'rocket', label: 'a rocket taking off', tags: ['work', 'job', 'launch', 'congratulations', 'graduation', 'space'], roles: ['fly', 'sky', 'hero'], size: 0.8, float: true },
  { name: 'podiumstairs', label: 'steps going up to a flag', tags: ['work', 'promotion', 'job', 'achievement', 'graduation'], roles: ['hero', 'floor'], size: 0.85, float: false },
  { name: 'nameplate', label: 'a blank desk nameplate', tags: ['work', 'promotion', 'job', 'office', 'desk'], roles: ['floor', 'hero'], size: 0.75, float: false },
  { name: 'hammock', label: 'a hammock between two palms', tags: ['retirement', 'holiday', 'beach', 'rest', 'summer'], roles: ['hero'], size: 1, float: false },
  { name: 'goldwatch', label: 'a gold pocket watch', tags: ['retirement', 'anniversary', 'work', 'time'], roles: ['hero', 'sky'], size: 0.75, float: true },
  { name: 'fishingrod', label: 'a fishing rod with a float on the water', tags: ['retirement', 'fishing', 'dad', 'lake', 'outdoors'], roles: ['hero', 'floor'], size: 0.85, float: false },
  { name: 'golfbag', label: 'a golf bag and a ball on its tee', tags: ['retirement', 'golf', 'dad', 'sport', 'outdoors'], roles: ['floor', 'hero'], size: 0.8, float: false }
];
