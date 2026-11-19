'use strict';
// library/particles/a.js : the particle and motion sets of art/pack-particles-a.js. A set is drawn over the backdrop and
// under the photos and the words. moods = the frame moods it suits; modes = the palette modes it reads well on
// (light, mid, dark); amount = its usual particleAmount; quiet: true = slow and sparse enough for a sympathy card.
module.exports = [
  { name: 'leaves', label: 'autumn leaves tumbling down', tags: ['leaves', 'autumn', 'fall', 'thanksgiving', 'harvest', 'school', 'woods', 'outdoors'], moods: ['calm', 'playful', 'retro'], modes: ['light', 'mid', 'dark'], amount: 1 },
  { name: 'rain', label: 'rain running down a window', tags: ['rain', 'window', 'cozy', 'missing-you', 'thinking-of-you', 'get-well', 'weather'], moods: ['calm', 'modern'], modes: ['light', 'mid', 'dark'], amount: 1 },
  { name: 'streamers', label: 'paper streamers curling as they fall', tags: ['streamers', 'party', 'birthday', 'congrats', 'new-year', 'celebration', 'retirement'], moods: ['playful', 'kids', 'retro', 'sporty'], modes: ['light', 'mid', 'dark'], amount: 1 },
  { name: 'sparkles', label: 'long-rayed sparkles that bloom and fade', tags: ['sparkle', 'shine', 'magic', 'wedding', 'anniversary', 'congrats', 'new-year', 'glam'], moods: ['elegant', 'modern', 'playful'], modes: ['mid', 'dark', 'light'], amount: 1 },
  { name: 'bokeh', label: 'soft out-of-focus lights', tags: ['bokeh', 'lights', 'evening', 'wedding', 'anniversary', 'romantic', 'city', 'soft'], moods: ['elegant', 'calm', 'modern'], modes: ['dark', 'mid', 'light'], amount: 1 },
  { name: 'paperplanes', label: 'paper planes gliding across', tags: ['paper-plane', 'travel', 'school', 'graduation', 'new-job', 'farewell', 'miss-you', 'kids'], moods: ['playful', 'kids', 'modern'], modes: ['light', 'mid', 'dark'], amount: 1 },
  { name: 'balloonsup', label: 'balloons let go, rising with their strings', tags: ['balloons', 'birthday', 'party', 'baby', 'congrats', 'celebration', 'kids'], moods: ['playful', 'kids'], modes: ['light', 'mid', 'dark'], amount: 1 },
  { name: 'dandelion', label: 'dandelion seeds on the breeze', tags: ['dandelion', 'wish', 'summer', 'meadow', 'thinking-of-you', 'mothers-day', 'gentle', 'spring'], moods: ['calm', 'elegant'], modes: ['mid', 'dark', 'light'], amount: 1, quiet: true },
  { name: 'lanternsup', label: 'sky lanterns rising', tags: ['lanterns', 'sky-lantern', 'wish', 'night', 'festival', 'new-year', 'memorial', 'romantic'], moods: ['calm', 'elegant'], modes: ['dark', 'mid'], amount: 1 },
  { name: 'sakura', label: 'cherry blossom on the wind', tags: ['sakura', 'cherry-blossom', 'blossom', 'spring', 'wedding', 'mothers-day', 'romantic', 'garden'], moods: ['elegant', 'calm', 'playful'], modes: ['light', 'mid', 'dark'], amount: 1 },
  { name: 'shamrockfall', label: 'three-leaf shamrocks floating down', tags: ['shamrock', 'st-patricks', 'luck', 'good-luck', 'green', 'irish'], moods: ['playful', 'kids', 'retro'], modes: ['light', 'mid', 'dark'], amount: 1 },
  { name: 'motes', label: 'dust drifting in a shaft of light', tags: ['motes', 'dust', 'light', 'sympathy', 'memorial', 'quiet', 'faith', 'restrained', 'thinking-of-you'], moods: ['calm', 'elegant'], modes: ['dark', 'mid', 'light'], amount: 1, quiet: true },
  { name: 'starfall', label: 'shooting stars over small steady ones', tags: ['shooting-star', 'stars', 'night', 'wish', 'graduation', 'new-year', 'space', 'dream'], moods: ['elegant', 'modern', 'kids'], modes: ['dark', 'mid'], amount: 1 },
  { name: 'sprinkles', label: 'cake sprinkles', tags: ['sprinkles', 'cake', 'birthday', 'sweet', 'baking', 'party', 'ice-cream', 'kids'], moods: ['playful', 'kids', 'retro'], modes: ['light', 'mid', 'dark'], amount: 1 },
  { name: 'feathers', label: 'soft feathers rocking down', tags: ['feathers', 'soft', 'baby', 'dove', 'peace', 'sympathy', 'angelic', 'gentle'], moods: ['calm', 'elegant'], modes: ['mid', 'dark', 'light'], amount: 1, quiet: true },
  { name: 'butterflydrift', label: 'butterflies wandering through', tags: ['butterflies', 'spring', 'garden', 'mothers-day', 'get-well', 'summer', 'meadow', 'easter'], moods: ['playful', 'calm', 'kids'], modes: ['light', 'mid', 'dark'], amount: 1 },
  { name: 'glitter', label: 'fine glitter turning in the light', tags: ['glitter', 'glam', 'party', 'new-year', 'disco', 'wedding', 'anniversary', 'gold'], moods: ['elegant', 'modern', 'retro', 'playful'], modes: ['dark', 'mid', 'light'], amount: 1 },
  { name: 'snowsoft', label: 'a few big soft snowflakes, in no hurry', tags: ['snow', 'winter', 'soft', 'sympathy', 'memorial', 'quiet', 'restrained', 'calm'], moods: ['calm', 'elegant'], modes: ['dark', 'mid', 'light'], amount: 1, quiet: true }
];
