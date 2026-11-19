'use strict';
// library/props/holidays-a.js : the props of art/pack-props-holidays-a.js (Hanukkah, Kwanzaa, New Year, Lunar New
// Year, Valentine's, St Patrick's, Easter, Passover, spring). Religious and cultural symbols: use each only on the
// occasion it belongs to (the tags say which); none of them carries lettering.
module.exports = [
  { name: 'menorah', label: 'a Hanukkah menorah, all nine candles lit', tags: ['hanukkah', 'menorah', 'candles', 'jewish', 'faith', 'lights'], roles: ['hero', 'floor'], size: 0.9, float: false },
  { name: 'dreidel', label: 'a spinning dreidel', tags: ['hanukkah', 'dreidel', 'game', 'jewish', 'kids'], roles: ['hero', 'floor'], size: 0.7, float: false },
  { name: 'gelt', label: 'gold foil chocolate coins', tags: ['hanukkah', 'gelt', 'coins', 'chocolate', 'jewish', 'treat'], roles: ['floor', 'hero'], size: 0.65, float: false },
  { name: 'sufganiyah', label: 'jelly doughnuts dusted with sugar', tags: ['hanukkah', 'doughnut', 'food', 'treat', 'jewish'], roles: ['hero', 'floor'], size: 0.7, float: false },
  { name: 'starofdavid', label: 'a Star of David', tags: ['hanukkah', 'jewish', 'star', 'faith', 'barmitzvah', 'batmitzvah'], roles: ['hero', 'sky'], size: 0.75, float: true },
  { name: 'kinara', label: 'a kinara with its seven candles', tags: ['kwanzaa', 'kinara', 'candles', 'lights'], roles: ['hero', 'floor'], size: 0.9, float: false },
  { name: 'unitycup', label: 'a carved wooden unity cup', tags: ['kwanzaa', 'unity', 'cup'], roles: ['hero', 'floor'], size: 0.7, float: false },
  { name: 'cornears', label: 'three ears of corn', tags: ['kwanzaa', 'corn', 'harvest', 'thanksgiving', 'autumn'], roles: ['floor', 'hero'], size: 0.7, float: false },
  { name: 'fruitbasket', label: 'a woven basket of fruit', tags: ['kwanzaa', 'harvest', 'fruit', 'basket', 'getwell', 'thanks'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'clockmidnight', label: 'a clock striking twelve', tags: ['newyear', 'midnight', 'clock', 'countdown', 'party'], roles: ['hero', 'sky'], size: 0.8, float: false },
  { name: 'redlantern', label: 'a round red paper lantern', tags: ['lunarnewyear', 'lantern', 'red', 'festival', 'midautumn'], roles: ['sky', 'hero'], size: 0.75, float: true },
  { name: 'redenvelope', label: 'red envelopes with gold seals', tags: ['lunarnewyear', 'envelope', 'red', 'gift', 'luck'], roles: ['hero', 'floor'], size: 0.7, float: false },
  { name: 'plumblossom', label: 'a branch of plum blossom', tags: ['lunarnewyear', 'blossom', 'spring', 'flowers', 'branch'], roles: ['sky', 'hero'], size: 0.8, float: true },
  { name: 'firecrackers', label: 'a string of red firecrackers', tags: ['lunarnewyear', 'firecrackers', 'red', 'festival', 'party'], roles: ['sky', 'hero'], size: 0.8, float: true },
  { name: 'tangerines', label: 'tangerines with their leaves', tags: ['lunarnewyear', 'tangerine', 'fruit', 'luck'], roles: ['floor', 'hero'], size: 0.65, float: false },
  { name: 'paperdragon', label: 'a dancing festival dragon', tags: ['lunarnewyear', 'dragon', 'dance', 'festival', 'parade'], roles: ['hero', 'floor'], size: 0.95, float: false },
  { name: 'cupidarrow', label: 'a heart with an arrow through it', tags: ['valentine', 'love', 'heart', 'arrow', 'romantic', 'anniversary'], roles: ['hero', 'sky'], size: 0.75, float: true },
  { name: 'chocbox', label: 'a heart-shaped box of chocolates', tags: ['valentine', 'love', 'chocolate', 'gift', 'romantic', 'anniversary'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'rose', label: 'a single red rose', tags: ['valentine', 'love', 'rose', 'flower', 'romantic', 'anniversary', 'mothersday'], roles: ['hero', 'floor'], size: 0.75, float: false },
  { name: 'shamrock', label: 'a three-leaf shamrock', tags: ['stpatricks', 'shamrock', 'irish', 'luck', 'green'], roles: ['hero', 'sky', 'floor'], size: 0.7, float: true },
  { name: 'potofgold', label: 'a pot of gold', tags: ['stpatricks', 'gold', 'luck', 'irish', 'congrats'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'easterbasket', label: 'an Easter basket of painted eggs', tags: ['easter', 'basket', 'eggs', 'spring', 'kids'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'easteregg', label: 'three painted eggs in the grass', tags: ['easter', 'eggs', 'spring', 'kids'], roles: ['floor', 'hero'], size: 0.7, float: false },
  { name: 'tulips', label: 'a bunch of tulips', tags: ['easter', 'spring', 'tulips', 'flowers', 'mothersday', 'getwell', 'thanks'], roles: ['hero', 'floor'], size: 0.8, float: false },
  { name: 'simplecross', label: 'a plain cross with spring flowers', tags: ['easter-faith', 'christian', 'faith', 'cross', 'baptism', 'communion', 'confirmation'], roles: ['hero'], size: 0.85, float: false },
  { name: 'sederplate', label: 'a Seder plate', tags: ['passover', 'seder', 'jewish', 'faith', 'spring'], roles: ['hero', 'floor'], size: 0.85, float: false },
  { name: 'matzah', label: 'a stack of matzah', tags: ['passover', 'matzah', 'jewish', 'food'], roles: ['floor', 'hero'], size: 0.7, float: false },
  { name: 'kiddushcup', label: 'a silver Kiddush cup of wine', tags: ['passover', 'shabbat', 'kiddush', 'jewish', 'faith', 'cup', 'barmitzvah', 'batmitzvah'], roles: ['hero', 'floor'], size: 0.75, float: false },
  { name: 'springbranch', label: 'a budding branch in spring', tags: ['spring', 'branch', 'blossom', 'easter', 'passover', 'newbeginnings'], roles: ['sky', 'hero'], size: 0.8, float: true }
];
