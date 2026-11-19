'use strict';
// connect-rules.js : WHAT THE CONNECTOR CHECKS IN WORDS IT DID NOT WRITE. On the site the product's own writer
// (agent.js) writes the carol and refuses what must not be written. Through the connector a person's own Claude may
// write or edit the lines itself (set_lyrics, set_text, set_music), so the same rules are held here, in code:
//   - the shape the writer's answer is held to (sections, lines, lengths: agent.js SCHEMA and check()),
//   - whether the lines can be sung in the time they get (song.js plan(): the same arithmetic the song is asked for with),
//   - what a carol never says: words that demean a person, sexual content, anything not wholesome about a child, hate,
//     and lines or tunes of existing songs,
//   - what the music service refuses in a music direction: an artist, a band, a songwriter, a song or an album.
// Every problem comes back as one plain sentence that says what to change. This is a screen of words and patterns:
// it catches what can be named, and it is narrower than a writer's judgement; the tool descriptions carry the rest.
const CFG = require('./config.js'), Song = require('./song.js');

// (accents, and straight and curly apostrophes, are taken out before words are compared; written by their numbers so this file stays plain ASCII)
const MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g'), QUOTES = new RegExp('[\'' + String.fromCharCode(0x2018, 0x2019) + ']', 'g'), CURLY = new RegExp('[' + String.fromCharCode(0x201c, 0x201d) + ']');
const norm = function (s) { return ' ' + String(s == null ? '' : s).toLowerCase().normalize('NFKD').replace(MARKS, '').replace(QUOTES, '').replace(/[^a-z0-9]+/g, ' ').trim() + ' '; };
const has = function (text, list) { for (const w of list) if (text.indexOf(' ' + w + ' ') >= 0) return w; return ''; };

const SEXUAL = ['sex', 'sexy', 'sexual', 'sexier', 'sexiest', 'porn', 'porno', 'nude', 'nudes', 'naked', 'horny', 'orgasm', 'erotic', 'boobs', 'tits', 'pussy', 'penis', 'vagina', 'blowjob', 'handjob', 'masturbate', 'kinky', 'fetish', 'slut', 'whore', 'hooker', 'make love', 'making love', 'in my bed', 'in your bed', 'between the sheets', 'turn me on', 'turns me on', 'get laid', 'one night stand'];
const UNCLEAN = ['fuck', 'fucking', 'fucked', 'fucker', 'motherfucker', 'shit', 'shitty', 'bullshit', 'goddamn', 'piss off'];
const DEMEAN = ['idiot', 'moron', 'loser', 'worthless', 'pathetic', 'disgusting', 'i hate you', 'we hate you', 'hate you', 'nobody likes you', 'nobody loves you', 'no one likes you', 'no one loves you', 'fatso', 'fat pig', 'fat cow', 'you are ugly', 'youre ugly', 'so ugly', 'ugly face', 'go to hell', 'kill you', 'kill yourself', 'wish you were dead', 'hope you die', 'bitch', 'asshole', 'bastard', 'scumbag', 'you are stupid', 'youre stupid', 'so stupid', 'you suck', 'serves you right'];
const HATE = ['nigger', 'nigga', 'faggot', 'fag', 'kike', 'spic', 'chink', 'tranny', 'wetback', 'retard', 'retarded', 'towelhead', 'gook', 'dyke'];
const CHILD = ['kid', 'kids', 'child', 'children', 'toddler', 'baby boy', 'baby girl', 'little boy', 'little girl', 'son', 'daughter', 'grandson', 'granddaughter', 'niece', 'nephew', 'newborn', 'little one', 'first grader', 'kindergarten', 'preschool'];
const NOT_FOR_A_CHILD = ['drunk', 'wasted', 'stoned', 'weed', 'vape', 'vaping', 'cigarette', 'cigarettes', 'booze', 'hangover', 'hungover', 'tequila', 'vodka', 'whiskey', 'bikini', 'hot body', 'hottie', 'gun', 'guns'];
// distinctive lines of songs that are somebody's (their words may not be copied, nor a recognisable rewrite of them)
const SONGS = ['all i want for christmas is you', 'last christmas i gave you my heart', 'rockin around the christmas tree', 'rocking around the christmas tree', 'jingle bell rock', 'rudolph the red nosed reindeer', 'frosty the snowman', 'santa claus is coming to town', 'santa claus is comin to town',
  'dreaming of a white christmas', 'let it snow let it snow', 'have yourself a merry little christmas', 'beginning to look a lot like christmas', 'youre a mean one mr grinch', 'baby its cold outside', 'simply having a wonderful christmastime', 'do they know its christmas', 'feliz navidad prospero ano',
  'wish you a merry christmas from the bottom of my heart', 'its the most wonderful time of the year', 'chestnuts roasting on an open fire', 'sleigh bells ring are you listening', 'walking in a winter wonderland', 'santa baby', 'grandma got run over by a reindeer', 'i saw mommy kissing santa claus',
  'blue christmas without you', 'ill be home for christmas', 'little drummer boy', 'do you hear what i hear', 'so this is christmas and what have you done', 'let it go let it go', 'do you want to build a snowman', 'we dont talk about bruno', 'i will always love you', 'cant help falling in love',
  'you are my sunshine my only sunshine', 'what a wonderful world', 'all you need is love', 'hey jude', 'dont stop believin', 'dont stop believing', 'sweet caroline', 'we are the champions', 'we will rock you', 'happy birthday to ya', 'you say its your birthday', 'they say its your birthday', 'isnt she lovely',
  'thank you for the music', 'thank u next', 'shake it off shake it off', 'never gonna give you up', 'somewhere over the rainbow', 'my heart will go on', 'i just called to say i love you', 'youve got a friend in me', 'lean on me when youre not strong', 'wind beneath my wings', 'you raise me up', 'baby shark doo doo',
  'dancing queen young and sweet', 'celebrate good times come on', 'girls just want to have fun', 'eye of the tiger', 'simply the best better than all the rest', 'yesterday all my troubles seemed so far away', 'imagine all the people', 'i gotta feeling that tonight', 'cause baby youre a firework', 'call me maybe'];
// old songs anybody may sing, whose own lines the music service still refuses (it refuses "lyrics from existing songs")
const OLD_SONGS = ['jingle bells jingle bells', 'jingle all the way', 'silent night holy night', 'deck the halls with boughs', 'fa la la la la la la', 'joy to the world the lord', 'o come all ye faithful', 'away in a manger no crib', 'should auld acquaintance be forgot', 'on the first day of christmas my true love'];
// names the music service refuses. These are looked for in every text; ARTISTS_IN_MUSIC adds the ones that are also
// everyday words or first names (a line may say "Aunt Adele" or "our trip to Disney"): refused only in a music direction.
const ARTISTS = ['taylor swift', 'beyonce', 'beatles', 'elvis presley', 'mariah carey', 'michael buble', 'frank sinatra', 'sinatra', 'bing crosby', 'nat king cole', 'ed sheeran', 'rihanna', 'bruno mars', 'billie eilish', 'ariana grande', 'justin bieber', 'lady gaga', 'coldplay', 'abba', 'elton john',
  'michael jackson', 'dolly parton', 'johnny cash', 'bob dylan', 'bob marley', 'rolling stones', 'pink floyd', 'led zeppelin', 'metallica', 'eminem', 'kanye west', 'jay z', 'kendrick lamar', 'harry styles', 'dua lipa', 'the weeknd', 'post malone', 'olivia rodrigo', 'sabrina carpenter', 'chappell roan',
  'bad bunny', 'shakira', 'whitney houston', 'celine dion', 'stevie wonder', 'louis armstrong', 'ella fitzgerald', 'david bowie', 'fleetwood mac', 'bee gees', 'beach boys', 'pentatonix', 'kelly clarkson', 'john legend', 'lizzo', 'katy perry', 'miley cyrus', 'luke combs', 'morgan wallen', 'garth brooks', 'shania twain',
  'willie nelson', 'hans zimmer', 'john williams', 'motown', 'mozart', 'beethoven', 'tchaikovsky', 'blackpink', 'one direction', 'backstreet boys', 'nsync', 'spice girls', 'the carpenters', 'andy williams', 'dean martin', 'tony bennett', 'josh groban', 'andrea bocelli', 'radiohead',
  'green day', 'foo fighters', 'red hot chili peppers', 'bon jovi', 'guns n roses', 'aerosmith', 'bruce springsteen', 'billy joel', 'paul mccartney', 'john lennon', 'aretha franklin', 'ray charles', 'james brown', 'marvin gaye', 'tupac', 'snoop dogg', 'cardi b', 'nicki minaj', 'doja cat', 'travis scott'];
const ARTISTS_IN_MUSIC = ARTISTS.concat(['elvis', 'adele', 'drake', 'madonna', 'nirvana', 'kanye', 'disney', 'pixar', 'nutcracker', 'bts', 'enya', 'u2', 'oasis', 'acdc', 'sza', 'wham', 'the eagles']);
const TUNE = /\b(?:to|in|on|with) the (?:tune|melody|music) of\b|\bsung (?:like|to|as)\b|\bparody of\b|\bcover of\b|\bversion of\b|\bsame (?:tune|melody) as\b/i;
const LIKE = /\b(?:in the |in a )?style of\b|\bsounds? like\b|\bsounding like\b|\binspired by\b|\btribute to\b|\bimpression of\b|\bsoundalike\b|\b(?:feat|ft)\.?\s|\besque\b|\ba la\b|"|\blike (?:the |a |an )?[A-Z][a-z]+ [A-Z][a-z]+/;

// one text against what a carol never says. Returns '' or the sentence to give back.
// (o.lines: the text is several lines run together, each already looked at alone: the child rule is a line's own)
function wordsProblem(text, what, o) {
  const t = norm(text), where = what || 'That';
  let w;
  if ((w = has(t, HATE))) return where + ' uses a word of hate ("' + w + '"). ' + CFG.name + ' does not make that, in any carol. Write something kind about them instead.';
  if ((w = has(t, SEXUAL))) return where + ' has sexual content ("' + w + '"). A carol is warm and clean, for any ears: say what you love about them another way.';
  if ((w = has(t, UNCLEAN))) return where + ' has a word a carol does not sing ("' + w + '"). Carols are clean: pick another word.';
  if ((w = has(t, DEMEAN))) return where + ' reads as putting a person down ("' + w + '"). A carol is never meant to demean, humiliate or get back at someone. Gentle teasing they would laugh at is fine: try a kinder line.';
  if (!(o && o.lines) && has(t, CHILD) && (w = has(t, NOT_FOR_A_CHILD))) return where + ' puts a child beside something that is not for children ("' + w + '"). Anything about a child stays wholesome: leave that out.';
  if (TUNE.test(String(text))) return where + ' asks for the tune or the words of an existing song. Every carol is an original: describe the feel you want (warm, bouncy, a waltz) and write new words.';
  if ((w = has(t, SONGS))) return where + ' has a line from a song that belongs to somebody ("' + w + '"). Copying a copyrighted song, or rewriting it recognisably, is not something a carol does: write new words in your own way.';
  if ((w = has(t, OLD_SONGS))) return where + ' has a line of a well-known old song ("' + w + '"). The music service refuses lines from existing songs, old ones too: write new words in that spirit.';
  if ((w = has(t, ARTISTS))) return where + ' names an artist or a band ("' + w + '"). The music service refuses a song that names one: say it without the name.';
  return '';
}
// a music direction: no artist, band, songwriter, song title, album, label or existing lyric, and nothing a carol never says
function musicProblem(m) {
  const text = [].concat(m.styles || [], [m.voices || '', m.notes || '']).join('. '), t = norm(text);
  let w;
  if (LIKE.test(text) || CURLY.test(text) || TUNE.test(text)) return 'A music direction describes instruments, genre, tempo and feel in plain words (for example "warm acoustic folk, upright piano, brushed drums"). It cannot point at an artist, a band or a song ("in the style of...", "sounds like...", a quoted title): the music service refuses those.';
  if ((w = has(t, ARTISTS_IN_MUSIC))) return 'The music direction names an artist, a band or a composer ("' + w + '"). The music service refuses that: describe the sound instead (the instruments, the genre, the feel).';
  if ((w = has(t, SONGS.concat(OLD_SONGS)))) return 'The music direction names or quotes an existing song ("' + w + '"). The music service refuses that: describe the sound instead.';
  return wordsProblem(text, 'The music direction');
}

// about how many syllables a line has (a count of vowel groups: near enough to say "too long to sing")
function syllables(line) {
  return String(line).toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').split(/[\s-]+/).filter(Boolean).reduce(function (n, w) {
    if (/^\d+$/.test(w)) return n + Math.min(4, w.length * 2);
    const g = (w.replace(/'/g, '').replace(/(?:[^aeiouy]es|ed|[^aeiouyl]e)$/, '').match(/[aeiouy]+/g) || []).length;
    return n + Math.max(1, g);
  }, 0);
}
// THE SHAPE: what agent.check() holds the writer's answer to, said in sentences instead of being cut to fit.
// Returns { lyrics } (cleaned) or { problem }.
function lyricsShape(given) {
  const L = CFG.limits;
  if (!Array.isArray(given) || !given.length) return { problem: 'Send the lyrics as a list of sections, each { "section": "verse" or "hook", "lines": [...] }: a verse of about 4 lines, then a hook of 2 to 4.' };
  if (given.length > 6) return { problem: 'That is ' + given.length + ' sections. A carol is short: a verse and a hook, at most a second verse.' };
  const out = []; let n = 0;
  for (const s of given) {
    if (!s || typeof s !== 'object' || !Array.isArray(s.lines)) return { problem: 'Each section needs a "section" ("verse" or "hook") and its "lines" as a list of strings.' };
    if (s.section !== 'verse' && s.section !== 'hook') return { problem: 'A section is a "verse" or a "hook" (the part someone could hum afterwards).' };
    const lines = [];
    for (const l of s.lines) {
      if (typeof l !== 'string') return { problem: 'Every line is a string of words.' };
      const line = l.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim(); if (!line) continue; n++;
      if (/[\[\]{}<>]/.test(line)) return { problem: 'Line ' + n + ' has brackets in it. Lines are only the words to sing: no stage directions, no [Chorus] marks.' };
      if (line.length > L.lineChars) return { problem: 'Line ' + n + ' is ' + line.length + ' characters ("' + line.slice(0, 28) + '..."). A line is at most ' + L.lineChars + ' so it can be sung in one breath: shorten it or split it in two.' };
      lines.push(line);
    }
    if (lines.length) out.push({ section: s.section, lines: lines });
  }
  if (n < 4) return { problem: 'That is ' + n + ' line' + (n === 1 ? '' : 's') + '. A carol needs at least 4 lines to be a song (6 to 8 is best: a verse of 4 and a hook of 2 to 4).' };
  if (n > L.lyricLines) return { problem: 'That is ' + n + ' lines, and ' + L.lyricLines + ' is the most that can be sung in ' + CFG.video.maxSec + ' seconds. Cut it to 6 to 8 lines: the ones with their name and the best detail.' };
  return { lyrics: out, lines: n };
}
// DOES IT FIT THE TIME? The same plan the song will be asked for with: each line's share of its section, and
// whether its syllables can be sung in that. Returns { seconds, bpm, per_line_seconds, problem }.
function fit(lyrics, music, tpl) {
  const plan = Song.plan({ lyrics: lyrics, music: music || {} }, tpl), V = CFG.video;
  const out = { seconds: Math.round(plan.total * 10) / 10, bpm: plan.bpm, per_line_seconds: 0, problem: '' };
  let n = 0, i = 0;
  for (const c of plan.chunks) {
    if (!c.lines) continue;
    const per = c.duration_ms / 1000 / c.lines, most = Math.min(16, Math.floor(per * 5));
    out.per_line_seconds = Math.round(per * 10) / 10;
    for (const line of lyrics[i].lines) { n++; const syl = syllables(line); if (syl > most && !out.problem) out.problem = 'Line ' + n + ' ("' + line.slice(0, 28) + (line.length > 28 ? '...' : '') + '") has about ' + syl + ' syllables, and it gets ' + out.per_line_seconds + ' seconds at ' + plan.bpm + ' beats a minute: that is too many to sing clearly. Bring it down to ' + Math.min(most, 11) + ' or fewer (7 to 11 sings best).'; }
    i++;
  }
  if (!out.problem && (plan.total > V.maxSec + 0.5 || plan.total < V.minSec - 0.5)) out.problem = 'These lines come to ' + out.seconds + ' seconds of song, and a carol is ' + V.minSec + ' to ' + V.maxSec + ' seconds. ' + (plan.total > V.maxSec ? 'Cut a line or two.' : 'Add a line or two.');
  return out;
}
// the music direction as the site allows it (agent.check()'s limits), or the sentence that says what is wrong
function musicShape(a, was) {
  const m = Object.assign({ styles: [], bpm: 100, voices: '', notes: '' }, was), clean = function (v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n); };
  if (a.styles !== undefined) {
    if (!Array.isArray(a.styles) || !a.styles.length || !a.styles.every(function (s) { return typeof s === 'string'; })) return { problem: 'styles is a list of 3 to 10 short style words or phrases: instruments, genre, feel.' };
    const styles = a.styles.map(function (s) { return clean(s, 200); }).filter(Boolean);
    if (styles.length < 3 || styles.length > 10) return { problem: 'Give 3 to 10 style words or phrases (6 to 8 works best), for example "warm acoustic folk", "upright piano", "hand claps".' };
    const long = styles.find(function (s) { return s.length > 60; }); if (long) return { problem: 'A style is a few words, at most 60 characters ("' + long.slice(0, 30) + '..." is too long).' };
    m.styles = styles;
  }
  if (a.bpm !== undefined) { const b = Math.round(+a.bpm); if (!(b >= 60 && b <= 180)) return { problem: 'The tempo is 60 to 180 beats a minute (a lullaby is about 70, a party about 125).' }; m.bpm = b; }
  if (a.voices !== undefined) { if (typeof a.voices !== 'string' || a.voices.length > 160) return { problem: 'voices is one short description of who sings, at most 160 characters (for example "warm female lead with a children\'s choir on the hook").' }; m.voices = clean(a.voices, 160); }
  if (a.notes !== undefined) { if (typeof a.notes !== 'string' || a.notes.length > 240) return { problem: 'notes is one or two sentences about the feel, at most 240 characters.' }; m.notes = clean(a.notes, 240); }
  const bad = musicProblem(m); if (bad) return { problem: bad };
  return { music: m };
}
module.exports = { wordsProblem: wordsProblem, musicProblem: musicProblem, lyricsShape: lyricsShape, fit: fit, musicShape: musicShape, syllables: syllables, norm: norm };
