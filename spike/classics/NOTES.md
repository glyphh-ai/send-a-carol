# Classic carols, made by us (spike)

A spike, not loaded by the product. Question: can Send a Carol offer famous carols (Jingle Bells, Silent Night,
Deck the Halls) with our own recording, including personalised words to the famous tune, without the music
model? That model can't do this: its terms forbid naming songs, artists or lyrics, and it takes no melody.

## Method

1. **The carols as data** (`scores/*.json`, checked by `score.cjs`): we wrote out each public-domain tune, its words
   syllable by syllable, and its chords. Each file has its source. `score.cjs` checks that the bars add up and that
   the words fit the notes, and it writes plain tones so a wrong note can be heard. Personalised words
   (`scores/words/*-hollisters.json`, a made-up family) put one syllable under each note, and `score.cjs` counts them.
2. **The band** (`synth.cjs`, `arrange.cjs`): the instruments are all plain arithmetic. There are no samples and no
   library. A felt piano (slightly inharmonic partials), a plucked nylon string (Karplus-Strong), bass, pad, music
   box, glockenspiel, vibes, sleigh bells, shaker and brushes. They play in a Freeverb-style room on a stereo desk.
   The arrangements are ours: an intro made from the tune's last bars, then boom-chick guitar and piano
   ("acoustic"), a music box with bells, or a picked lullaby in 6/8 for Silent Night. A two-bar ending rings out.
3. **The lead** (`sing.cjs`, `dsp.cjs`): a stock voice speaks each line through ElevenLabs text-to-speech with
   character timestamps (Sarah, female; Eric, male, sung an octave down). Our code:
   - splits the words into syllables and finds each vowel (energy and pitch, no model);
   - puts the vowel on the beat, with the consonant just before it;
   - stretches the vowel to the note's length and keeps the consonants at their spoken length;
   - sets the pitch to the note, with a short glide between notes, a small scoop at each phrase start, and vibrato on
     long notes. The pitch and the stretch are one PSOLA pass (pitch-synchronous overlap-add, derived from
     `spike/premium` on branch `premium-spike`).
   On a held vowel the playback moves back and forth over the vowel's loudest ~60 ms, so no single pulse repeats.
   With `wanderSec 0.03, perPass 1.5` (tuned here) the share of "frozen" frames on held notes went from 14% to 1.4%.
4. **The mix** (`make.cjs`): the lead goes through a low cut, presence EQ, a de-esser and gentle compression, with
   two quiet doubles 18 and 27 ms later at the sides, then into the room. The finished song is set to the product's
   loudness (-14 LUFS, -1.5 dBTP) and written as 192 kbps mp3.
5. **Voice changer try** (`sts.cjs`): our sung Silent Night lead went through ElevenLabs speech-to-speech
   (`eleven_multilingual_sts_v2`, stock voice Sarah) and then through our retune again.
6. **Numbers** (`measure.cjs`): the share of voiced 10 ms frames within 50 cents of the note, how far each vowel's
   start is from its beat, and spectral flux on held vowels (a "frozen" buzz versus a living voice). The same flux
   was measured on a real sung vocal for comparison.

Run: `node spike/classics/make.cjs [name]`. Output goes to `/tmp/carol-classics/mix/`; the finished mp3s were
copied to `/tmp/carol-listen/classics/`.

## Results (measured, not heard)

| Track | Voice | In tune (within 50 c) | Median off | Onsets within 50 ms | Held-vowel flux | Frozen |
|---|---|---|---|---|---|---|
| jingle-bells | Sarah | 93.5% | 4 c | 71% | 0.10 | 2.3% |
| silent-night (in A) | Sarah | 95.5% | 7 c | 83% | 0.10 | 1.4% |
| deck-the-halls | Eric | 92.7% | 4 c | 89% | 0.14 | 0% |
| jingle-bells-hollisters | Sarah | 93.7% | 4 c | 78% | 0.13 | 0.4% |
| silent-night-hollisters | Sarah | 95.1% | 7 c | 60% | 0.12 | 2.6% |
| deck-the-halls-hollisters | Eric | 93.4% | 4 c | 94% | 0.16 | 0% |
| silent-night-voice-changer | Sarah via STS | 95.8% | 1 c | 83% | 0.08 | 6.4% |

For comparison, a real sung vocal (the music model's own singer, `/tmp/carol-listen/audio/original-vocal-only.mp3`)
has a flux of 0.17 across its voiced frames with 0.2% frozen. Our leads, measured the same way, have a flux of
0.08 to 0.13 with 1 to 8% frozen. Their vowels change about half as much as a singer's.

The voice changer kept the shape of our melody (pitch contour correlation 0.82) but pulled it down about 7.7
semitones into Sarah's speaking range, so it is unusable until retuned. After our second retune it is the most in
tune of all, but its held vowels are more static. It needs a human listen to say whether it sounds more human.

## Cost

- Text-to-speech: 57 calls, 1,414 characters. That includes 4 test calls and an earlier attempt, and it is cached on
  disk, so re-runs cost nothing. About $0.11 at the $0.08 per 1,000 published API rate, and up to about $0.24 at
  Starter-plan rates.
- Voice changer: one call on 42 s of audio. The account's counter did not move in time to read it. Estimated at about
  $0.10.
- **Total: about $0.20 to $0.35**, against a $6 budget. One personalised carol costs about 400 to 450 characters of
  speech, a few cents. The band costs nothing; it renders in a few seconds of CPU.

## Honest verdict

**Not good enough to sell as "famous carols, recorded by us", and good enough to prove the plumbing.**

- What works: the tunes and harmony are correct and the scores are checked. The band is pleasant and fully ours.
  The words land on the notes: 93 to 96% of frames are within 50 cents, about 4 to 7 cents off at the median.
  Timing is mostly on the beat. Personalised words to a famous tune work mechanically, and any family's words can be
  fitted in seconds.
- What doesn't: the lead is speech tuned onto notes, not singing. By ear it will read as a robotic, auto-tuned
  speaking voice ("talk-singing"), not a singer. There is no sung vowel shaping, no breath support and no legato.
  Held notes are steadier than a human's (flux half a real singer's). Fast syllables (Deck the Halls' fa-la-las,
  Jingle Bells' verse) stay clipped and talky. The synth band sounds clean but like a "home keyboard", not a
  recording. This is my reading of the numbers and the spectrogram; I could not listen. Chris's ears decide.
- It may pass as a novelty: a cheeky robot-carol style that is clearly a gag. It does not pass as a warm card.

## What a product version would need

1. **A real singing voice for the lead.** Pick one:
   - (a) A session singer records each classic once in our arrangement. That is ours to own; the tunes are public
     domain. Standard words then need no synthesis. Personalised words need either the singer recording a syllable
     bank on the melody, with our code splicing it in (far better than speech), or
   - (b) A licensed singing-voice synthesiser driven from our score data: a commercial SVS engine or voicebank with
     a server licence, or an open DiffSinger/NNSVS-style model trained on a licensed singer. Our score format
     already gives notes, syllables and timing, which is exactly its input.
   - The speech-to-speech route only re-voices what it gets. It can turn a real guide vocal into stock voices
     (premium spike) but cannot turn speech into singing.
2. **A better band**: licensed sampled instruments (an sfz/SoundFont piano, strings, bells) rendered from the same
   arrangement code, or a one-off arrangement recorded per carol.
3. **More carols**: about 10 to 15 public-domain classics written as scores and checked (title, tune and words before
   1929 in the US; check each source).
4. **A lyric-writing step**: Claude writes the family's words under the syllable count and stress of each line.
   `score.cjs` already rejects a wrong count, and a stress check would be next.
5. **A human listening panel** before anything ships. The numbers here measure tuning and timing, not charm.
