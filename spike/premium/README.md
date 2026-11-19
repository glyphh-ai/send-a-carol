# spike/premium

A feasibility spike for the premium "group carol" (2026-11-18). **Not loaded by the product**: no product file
is changed, nothing here is deployed, and the product's tests do not read this folder. The design and the
decisions are in `DESIGN.md`; what to listen to and look at is in `/tmp/carol-premium/README.md`.

| File | What it does |
| --- | --- |
| `lib.cjs` | reads `.env` (never prints a value), the provider's API by plain fetch, ffmpeg, the tally of paid calls |
| `account.cjs` | the plan, credits used, voice slots, the stock voices (free) |
| `compose.cjs` | one new carol with the product's own `song.js`, asking for a solo guide vocal (paid) |
| `stems.cjs` | vocal + instrumental by the provider's stem separation (paid) |
| `convert.cjs` | the vocal stem sung in another voice by the provider's voice changer (paid; stock voices only) |
| `dsp.cjs` | plain arithmetic: the fundamental by autocorrelation; the retune (pitch-synchronous overlap-add) |
| `retune.cjs` | a converted stem put back on the tune |
| `measure.cjs`, `notes.cjs` | drift, pitch, loudness, onsets against the original; the notes sung, as text |
| `mix.cjs` | who sings which line (from the product's line timings), solo and group mixes, each singer's own part |
| `people.cjs` | code-drawn placeholder selfies of made-up people, with the two taps |
| `avatar.js` | the photo cut-out head, the costumes, the group layout, the stage |
| `video.cjs` | the music video through the product's `render.js`; layout stills and box checks |

The provider's model ids are settings, never written here: `ELEVEN_MUSIC_MODEL` (in `.env`) and
`ELEVEN_STS_MODEL` (given on the command line). Outputs go to `/tmp/carol-premium` (`PREMIUM_OUT`).
No real person's voice or photo is used anywhere, and no voice is created at the provider.
