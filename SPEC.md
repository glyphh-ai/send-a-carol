# Send a Carol

Singing greeting cards for any occasion. A person signs in, tells an agent who the card is for, adds photos and a
few true details, and gets **a carol**: a short song written for that one person, sung, set to an animated card with
their photos, at a link `sendacarol.com/<card-name>` that plays it, plus an mp4 to download or post. "A carol" is
the brand's word for the song for EVERY occasion (a carol for her birthday, a carol for Dad); the page the recipient
opens is "the card". Christmas is the launch occasion, not the product.

The name, the domain, the tagline, the prices and the limits are in ONE file, `config.js`. Nothing else types them.
The folder is still called `carol-time` (the working name); the app's id everywhere is `send-a-carol`.

A Glyphh game. Version 1, built locally: no GitHub repository, no Fly app, no domain, nothing deployed.

## What is here

| File | What it is |
| --- | --- |
| `config.js` | name, domain, tagline, brand colours, packs and prices, limits, video sizes, our costs, occasions, reserved card names |
| `server.js` | everything served: pages, the API, a card's page and media, jobs, Stripe, the admin's MCP endpoint, `--check` |
| `store.js` | media storage: Cloudflare R2 by SigV4 when all five R2 settings are there, a folder on disk otherwise |
| `agent.js` | the writing agent (Claude API through the official SDK, structured output, refusals, usage numbers) |
| `song.js`, `beat.js` | the song (ElevenLabs music API), loudness and fade (ffmpeg), where the beats are (plain arithmetic) |
| `engine.js`, `templates.js`, `art.js`, `fonts.js` | THE TEMPLATE ENGINE: one set of plain JS that draws a frame at time `t` on a 2D canvas, used by the browser (live preview, the recipient's interactive card) and by the server (the mp4) |
| `render.js` | the server's renderer: `@napi-rs/canvas` frames piped to `ffmpeg` |
| `email.js` | the sign-in link and "a carol for you" emails (Resend), and "don't email me again" |
| `admin.js`, `admin.html`, `admin-ui.js` | the admin: tools used by the /admin page and by `/mcp?admin=<key>` |
| `brand.js` | the lockup: the mark as SVG, and the icons, default share image and email header drawn from it |
| `landing.html`, `landing.js`, `app.html`, `app.js`, `card.html`, `card.js`, `style.css`, `net.js` | the pages: landing, the maker's flow, the recipient's card; `net.js` is the outbox and the safe reload |
| `legal/` | terms, privacy, refunds, acceptable use, photos: careful drafts under a "Draft: under legal review" banner |
| `fonts/` | twenty open-licence faces (OFL 1.1 and Apache 2.0; the licences are in the folder), registered under our own family names in both renderers |
| `examples/` | the three real carols the landing page's hero plays (made by `tools/proof.cjs`) |
| `tools/proof.cjs` | the real, paid end-to-end run |
| `test/` | the tests (`npm test`); `test/kit.cjs` is the in-process harness with fakes for everything outside |
| `deploy.sh`, `fly.toml`, `Dockerfile` | written and syntax-checked; never run |

Run nothing as a server here: the tests call `handle(req, res)` in-process, and browser checks route a made-up
origin into it.

## The product

1. **Sign in** with Google or an emailed link (hashed, single-use, 15 minutes; a GET shows a button and spends nothing).
2. **The agent's conversation** (`/make`): one question at a time, each skippable: the occasion; who it is for and
   from, and what they are to you; the mood (a template); photos (0 to 8, originals up to 25 MB kept privately, a
   1600 px copy made on the server); a few true details; optionally a line that must be in the song, or their own
   lyrics. The questions are the page's own (they cost nothing); the writing is one call to the agent.
3. **The agent writes the carol**: a title, a lyric of 6 to 8 lines (a verse and a hook) that fits 20 to 40 seconds,
   the on-screen greeting and sign-off, the music direction, and which photo goes in which scene with a caption.
   The answer is JSON held to a schema by the API (structured outputs) and checked again in `agent.check()`.
   The maker can edit every line, reorder photos, change captions, switch template, and ask for another take
   ("funnier", "shorter", "mention Grandpa's truck"): all before anything is paid for.
   The agent refuses, kindly and with a way forward: words meant to demean a person, sexual content, anything about a
   child that is not wholesome, hate, and copying a copyrighted song's lyrics or melody (public-domain songs may
   inspire mood and metre; it writes new words).
4. **The live preview** is the engine itself, in the page, on the template's tempo (a click track or silence until
   there is a song; the take's audio after).
5. **Make the song**: this, and only this, spends one carol credit for a carol. The words as they are then go to the
   music service; the audio is measured and finished; the video is rendered in both shapes. The page shows queued,
   writing the song, rendering 43%, done. Each paid carol has 3 takes of the song (the first and 2 more); every take
   is kept and the maker chooses.
6. **The card** at `/<card-name>`: a present addressed to the recipient that they tap, shake or unwrap; the card plays
   full screen with sound; toys during and after (tap a character and it dances, drag to make it snow or sparkle
   harder, pop an ornament or balloon per photo, ring the bells in time for a score); then three plain buttons: Save
   the video, Share, Make your own; and "Report this card".
7. **Send by email** from the product to up to 10 people per carol, with a short note. Never a marketing list.
8. **Take down / put back / delete** at any time. A deleted carol's page answers 404 and its media is removed from storage.

### Occasions

An occasion sits above template families. `config.occasions` lists them with a state (`live` can be made, `soon` is
listed as coming soon, `off` is hidden) and the dates each is featured (MM-DD to MM-DD, may wrap the new year). The
landing page's hero, default and seasonal dressing follow the occasion featured today; when none is, the default is
`birthday`. The admin can switch each occasion and its dates (settings table). An occasion with no templates cannot
be live. Live at launch: Christmas & holidays, Birthday, Love & Valentine's, Thank you, Congratulations.
Nothing in the shell (routes, tables, config keys, copy, emails, legal drafts, the agent's instructions) assumes
Christmas: snow belongs to a template or to the landing page's date-driven dressing.

### Templates

A template is data in `templates.js`: an occasion and a family, a look (palette, type pairing, border), a cast, a
backdrop, photo-frame styles, 4 to 6 timed scenes (title, photo scenes, a lyric scene, the sign-off), motion, how the
lyric appears (karaoke, line by line at the bottom, never over a face), and its music direction and lyric tone. All
art is drawn in code (`art.js`): no stock art, no emoji, no copyrighted characters. The gallery is search + occasion
and family filters + pagination from day one (`/api/templates`). The list is at the end of this file.

### One renderer

`CarolEngine.draw(ctx, W, H, card, t, env)` uses no DOM: the same code draws the editor's preview and the recipient's
interactive card in the browser, and every frame of the video on the server (`render.js`: `@napi-rs/canvas`, which
installed without trouble, so node-canvas is not used; frames go down a pipe to `ffmpeg` as raw RGBA). Output:
H.264 + AAC mp4, 30 frames a second, 1080x1920 (stories, reels, TikTok) and 1080x1080 (feeds, email); a poster jpg
in both shapes; a small silent gif (360 px, 4 seconds) for link unfurls. The fonts are bundled and registered under
the same family names in both places (`fonts.js`).

Rendering is a background job: rows in `jobs` (queued, running, done, failed; stage and percent), one at a time on a
machine (`limits.jobsAtOnce`), at most 3 tries. A restart puts what was running back in the queue; a song that was
already made is found by its job id and is not asked for (or paid for) twice; a server that is stopping kills the
render and leaves the job to be queued again. Caps: 60 seconds and 80 MB a video (`config.video`).

### The song

ElevenLabs' music API, as its documentation says (read 2026-11-18):

- https://elevenlabs.io/docs/api-reference/music/compose (`POST /v1/music`, `xi-api-key`, `output_format`, `composition_plan`)
- https://elevenlabs.io/docs/api-reference/music/compose-detailed (`with_timestamps`: the shape of what it returns is not documented)
- https://elevenlabs.io/docs/api-reference/music/stream , https://elevenlabs.io/docs/api-reference/music/create-composition-plan
- https://elevenlabs.io/docs/overview/capabilities/music , https://elevenlabs.io/docs/overview/capabilities/music/best-practices
- https://elevenlabs.io/docs/cookbooks/music/quickstart (errors `bad_prompt`, `bad_composition_plan`)
- https://elevenlabs.io/pricing/api ($0.15 a minute of music; API use needs a paid plan)
- https://elevenlabs.io/music-terms (what a prompt may not contain; what the output may be used for)

What we send: a composition plan of chunks, one per section: `[Intro]` (about 4 beats, at least 3 s), each section of
the words (`[Verse 1]`, `[Chorus]`, its lines one per line), `[Outro]`. A line gets two bars where that fits in 40
seconds. Each chunk has a `duration_ms` (3 to 120 s), `positive_styles` (the template's or the agent's style words,
the voices, the tempo) and `negative_styles`. The documented limits (30 lines a chunk, 200 characters a line) are far
above ours (10 lines, 64 characters).

**Timing.** Section durations are kept by the music model, so we know when each sung section starts and ends. The
beats are measured from the audio by `beat.js`: energy every 10 ms in two bands, onset strength (how much it rose),
the tempo by matching the onset strength against itself between 60 and 180 beats a minute with a gentle preference
for the tempo asked for, then the phase and a finer period by a comb. No library and no trained model. Scenes cut on
beats and characters move on them. The service gives no documented word timing, so **the lines of a section are
spread evenly across it** and each line's start is moved to the nearest beat within a quarter beat: the karaoke lands
roughly with the singing, not word for word.

**Finishing.** `ffmpeg`: `loudnorm` to -14 LUFS with a -1.5 dB true-peak ceiling, a fade over the last 1.5 s, AAC.

**What ElevenLabs' rules say, as verified on the pages above.** A prompt or plan may not contain an artist's,
songwriter's, publisher's or label's name, a song or album title, or "a substantial or distinctive portion of any
song's lyrics"; such a request is refused with `bad_prompt` / `bad_composition_plan` (with a suggestion unless the
material was harmful). The music terms say nothing that exempts public-domain songs from the "any song title" rule,
so the agent never names a song to the music service, also not a traditional one: a public-domain carol can inspire
the mood and metre of NEW words only. Use of the output: the plan table permits "all online and offline commercial
use ... except film, TV, radio, and Studio Games" below Enterprise, with streaming distribution from the Creator plan
up; the legal drafts carry this as a limit on what a card may be used for, with an owner blank to confirm the plan.

### Money

One-off packs of carol credits through Stripe Checkout (REST, no SDK): 1 for $4.99, 5 for $14.99, 10 for $24.99
(`config.packs`, in cents; a pack whose price is `null` shows "coming soon" and cannot be bought). **All sales are
final.** Every buy button's sheet and Stripe's own page say "One-time purchase. Not refundable." (`config.finalSale`).
There is no code anywhere that gives money back. **There is no subscription** and nothing that renews.

- A credit is spent when the song is first made for a carol, never before. Credits do not expire.
- Writing with the agent and previewing are free, and limited: 3 carols drafted per account before a first purchase,
  10 rewrites per carol, 40 agent calls per account per day (`config.limits`; the admin can override a limit).
- The balance is the sum of `credit_log`; a `ref` (`buy:<session>`, `carol:<id>`) can be granted or spent once.
- A purchase is confirmed when the buyer comes back from Stripe (`/api/buy/confirm`, idempotent by session id) and,
  for a buyer who paid and never came back, at their next visit: every Checkout we open is in `checkouts`, and
  `/api/me` asks Stripe about the open ones (at most once a minute). **So there is no webhook**: with one-off
  payments only, confirm-on-return plus this recovery covers it, as in the other games.
- Every Stripe object carries `metadata.app = "send-a-carol"` (the Stripe account is shared with the other games).
- If a song cannot be made at all after a credit was spent, the credit is given back (a credit, never money).
- The ledger (`ledger`) records per carol what it cost us: the agent's tokens in and out by the API's own usage
  numbers, the music seconds asked for, the render seconds. The admin sees cost and margin per carol.

### The admin

`support@glyphh.ai` signed in by Google or by link is the admin, and so is the password in `ADMIN_PASSWORD`.
Overview (made, written, paid, ready, shared, opened, emailed, revenue, estimated Stripe fees, cost, margin), carols
(view, take down, restore, delete media), accounts (credits, grant with a reason, ban), the reports queue, jobs
(stuck and failed, retry), templates (on/off, order, usage), occasions (state, featured dates), prices and limits,
and the record of every admin action. Every list is search + filters + pages. The same tools answer Claude at
`/mcp?admin=<ADMIN_MCP_KEY>`. Prices are shown and not edited there: they are `config.js`'s.

### Privacy by construction

Originals and resized photos are private objects under `send-a-carol/cards/<id>/`. A card's page serves the video,
the poster, the song and the resized photos of a READY card only; a draft, a card taken down and a deleted card
answer 404. The maker's email is never in a card's page or data. Recipients' addresses are kept only as hashes
(`sends`, `suppress`). The agent is sent the maker's text, never photos. The music service is sent the lyrics and
style words, never photos or addresses.

## Safe builds

- **Build id**: a hash of every client file. `X-Build` on every answer; pages carry `window.SAC_BUILD`; scripts and
  styles are asked for with `?v=<build>` and cached for ever under that address.
- **Safe reload** (`net.js`): a page that learns of a new build shows "New version ready" and reloads itself once, at
  a moment that costs nothing: never while a carol is being edited, uploaded, paid for or rendered on screen, never
  while a card is playing, never with a field in use or an unsent save waiting (`SAC.hold`).
- **Outbox and idempotency keys**: edits go through `SAC.save` (kept in localStorage until answered); writes that
  cost something go through `SAC.send`; both carry an `Idempotency-Key`, and the server answers a repeat with the
  first answer (`idem` table) without doing the work again.
- **`/healthz`** answers 200 only when the database does.
- **`node server.js --check`** is Fly's release command: no port, no row changed. It refuses a build that removes or
  renames a table or column outside the cleanup list, applies the schema, reads every table with every column, plans
  every statement the code sends, opens every saved carol, and fails on a machine without `DATABASE_URL` or the R2
  settings.
- **The schema only grows.** Saved carols carry a version (`cards.v`, `doc.v`); `docOf()` is the one place an older
  one is brought up to date; fixtures of saved carols are kept in `test/fixtures`.
- **A contract snapshot** (`test/contract.json`): a route that goes, a field that goes or changes type, fails the tests.
- **`deploy.sh`** is the one way to deploy (tests, the build id, `fly deploy`, ask the live site, move the tag).

## Settings (names only)

| Name | For |
| --- | --- |
| `DATABASE_URL` | Postgres. Without it a SQLite file under `DATA_DIR` (tests, a laptop) |
| `SESSION_SECRET` | signs the session cookies and the "don't email me again" links |
| `PUBLIC_URL` | the site's address (default from `config.js`) |
| `GOOGLE_CLIENT_ID` | Google sign-in |
| `RESEND_API_KEY`, `EMAIL_FROM` | the sign-in link and the carol emails |
| `ADMIN_PASSWORD`, `ADMIN_EMAILS`, `ADMIN_MCP_KEY` | the admin (the MCP key must be 24 characters or more) |
| `STRIPE_SECRET_KEY` | payments |
| `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `CLAUDE_EFFORT` | the writing agent. The model's id is a setting: no model is named in this repository |
| `ELEVENLABS_API_KEY`, `ELEVEN_MUSIC_MODEL` | the song. The music model's id is a setting too |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_PREFIX`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | media. `R2_PREFIX` is `send-a-carol/` |
| `DATA_DIR`, `PORT`, `FFMPEG` | where the SQLite file and the local store live; the port; another ffmpeg |

## The templates at launch (33)

`templates.js` is the list (id, name, blurb, look, cast, scenes, music, tone); `test/templates.cjs` holds it to its
rules (every template drawn at both shapes with 0, 3 and 8 photos and long text; no text box over a face box or
outside the safe area; cuts on beats; families and occasions covered; everyday templates use no winter art).

- **Christmas & holidays (25)**. Family & Cozy: `cozy-mantel`, `plaid-pajamas`. Funny: `ugly-sweater-party`,
  `naughty-or-nice`, `yeti-to-party`. Kids: `snow-day`, `elf-workshop`. Grandparents: `grandmas-kitchen`,
  `fireside-stories`. Romantic: `mistletoe-kiss`, `skating-waltz`. Pets: `paws-and-claus`, `tangled-in-tinsel`.
  Friends: `village-carolers`, `friendsmas-party`. Work & Clients: `happy-holidays-team`, `seasons-greetings`.
  Faith: `holy-night`, `candlelight-carol`. Retro: `neon-noel`, `vintage-postcard`. New Baby:
  `babys-first-christmas`, `woodland-lullaby`. Far Away: `missing-you-window`, `airmail-christmas`.
- **Birthday**: `birthday-bash`, `birthday-spotlight`. **Love**: `love-letter`, `bloom-for-you`.
  **Thank you**: `thanks-a-bunch`, `thank-you-note`. **Congratulations**: `hip-hip-hooray`, `gold-medal`.

## The real run (2026-11-18, `tools/proof.cjs`)

Three carols made end to end with real calls (the writing agent, the music service, real renders), made-up people
and code-drawn placeholder photos: `the-timmermans-2026` (cozy-mantel), `for-uncle-dave` (ugly-sweater-party),
`nora-is-thirty` (birthday-bash). Used: 3 songs of the 5 allowed, 4 agent calls (3 carols and one refusal probe).
What each cost us, from the ledger: the words $0.03 to $0.05 (about 2,550 tokens in, 1,100 to 1,900 out), the song
$0.09 to $0.10 (35 to 40 seconds at $0.15 a minute); $0.12 to $0.15 a carol with one take, about $0.35 with all
three takes and a few rewrites. A render of both shapes took 32 to 46 seconds on the development Mac.
The music service kept every section's length to the millisecond and the measured tempo matched the tempo asked for
(95.99 for 96, 132.12 for 132, 125.98 for 126). Storage ran on the local-disk adapter: the R2 endpoint and bucket
were not available here, so R2 itself has not been exercised. Nobody has heard the songs.

## Decisions made where the brief was silent

- The agent's questions are the page's own; one call writes the carol, one more for each rewrite.
- Occasion chooses the template list; a template belongs to one occasion.
- A carol with no photos is complete: drawn "art" scenes stand in.
- The words sung in a take are kept with the take; editing the words later does not change a video until a new take.
- Captions, order, greeting and sign-off can change after the song: "Update the video" renders again, free (30 a day).
- A card's name is suggested from the sender and the year, can change until the card is first shared, then stays.
- The recipient's card is the engine running live with the song (so it can be played with); the mp4 is for saving,
  sharing and as the fallback.
- Card emails keep only a hash of each recipient's address. "Don't email me again" stops every maker's emails.
- The photo copy the video uses is 1600 px; HEIC is refused with a sentence (the canvas library cannot read it).
- Prices are config, not admin-editable; limits can be overridden in the admin.
- No webhook (see Money). One machine only: a second would take the first one's jobs at its start.
- X gets `summary_large_image` (a player card needs X's approval); the unfurl image is the square poster, then the gif.

## Next (not in version 1)

- A connector for makers (make a carol from Claude). Only the admin's tools are on `/mcp` today.
- The occasions marked `soon`, and Hanukkah, Diwali, Eid, Easter, Halloween, Thanksgiving.
- Word-by-word karaoke, if the music service documents its timestamps.
- A player card for X (it needs their approval), an account page with "delete my account".
