# Send a Carol

Singing greeting cards for any occasion. A person signs in, tells an agent who the card is for, adds photos and a
few true details, and gets **a carol**: a short song written for that one person, sung, set to an animated card with
their photos, at a link `sendacarol.com/<card-name>` that plays it, plus an mp4 to download or post. "A carol" is
the brand's word for the song for EVERY occasion (a carol for her birthday, a carol for Dad); the page the recipient
opens is "the card". Christmas is the launch occasion, not the product.

The name, the domain, the tagline, the prices and the limits are in ONE file, `config.js`. Nothing else types them.
The folder is still called `carol-time` (the working name); the app's id everywhere is `send-a-carol`.

A Glyphh game. Built locally; deployed only by `./deploy.sh`, by its owner.

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
| `email.js` | the sign-in link, "a carol for you" and "your carol is ready" emails (Resend), and "don't email me again" |
| `admin.js`, `admin.html`, `admin-ui.js` | the admin: tools used by the /admin page and by `/mcp?admin=<key>` |
| `connect.js`, `oauth.js`, `connect-rules.js`, `connect-ui.js`, `mcp-app.js` | THE CONNECTOR for a person's own Claude at `/mcp` (see "The connector"): its tools, its sign-in (OAuth 2.1), the rules held in words Claude writes, its pages (the panel in the chat, the preview link, the upload page), and the MCP Apps bridge the panel carries (`@modelcontextprotocol/ext-apps`, bundled) |
| `brand.js` | the lockup: the mark as SVG, and the icons, default share image and email header drawn from it |
| `landing.html`, `landing.js`, `app.html`, `app.js`, `card.html`, `card.js`, `style.css`, `net.js` | the pages: landing, the maker's flow, the recipient's card; `net.js` is the outbox and the safe reload |
| `legal/` | terms, privacy, refunds, acceptable use, photos: careful drafts under a "Draft: under legal review" banner |
| `fonts/` | twenty open-licence faces (OFL 1.1 and Apache 2.0; the licences are in the folder), registered under our own family names in both renderers |
| `examples/` | the three real carols the landing page's hero plays (made by `tools/proof.cjs`) |
| `tools/proof.cjs` | the real, paid end-to-end run |
| `tools/email-proof.cjs`, `tools/stripe-proof.cjs`, `tools/r2-proof.cjs` | the real services, each exercised once by hand: one real email, test-mode Checkout paid on Stripe's own page, the storage adapter against a real bucket under `send-a-carol/test/` |
| `tools/pgtest.cjs`, `tools/dockercheck.cjs` | the whole test suite and `--check` on a throwaway local Postgres (Unix socket, no port); the image built and checked with no network |
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
   **The card is made at the conversation's first answer** (not at the first photo): from then on it is a draft in
   "My carols", listed by who it is for, where it can be carried on or deleted. Photos can be added only after the
   maker ticks that they may use them (the one thing a maker confirms; the legal pages are drafts and nothing is
   recorded as agreed to). **HEIC** (an iPhone's own format) is accepted: the page converts it where the browser
   can read it (Safari), otherwise the server does, with `heif-convert` (Debian's `libheif-examples`, in the
   image) or `sips` on a Mac; only when neither can is it refused, with a sentence.
   Who it is for, who it is from and what they are to the maker are typed in ONE panel (`whoFields` in `app.js`):
   the conversation's second question and the editor's "Who it is for" are both it.
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
7. **Send by email** from the product to the people the maker knows (no limit per carol; the account's daily email cap still holds), with a short note. Never a marketing list.
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
art is drawn in code (`art.js`): no stock art, no emoji, no copyrighted characters.

**Which frame a photo gets, and how it sits in it** (plain arithmetic on shapes; nothing looks at the picture, and
there is no model of any kind). A round or shaped frame (ornament, snow globe, wreath, locket, star, bubble, bowl,
medal, balloon) crops hard, so it only gets a photo the maker marked "One person"; when none is marked, the first
upright photo gets the template's shaped frame. Every other photo gets one of the template's rectangular frames (a
plain one if it has none), and a wide photo makes that frame wide (`aspectFor`). In its window a photo is
cover-fitted but never loses more than 14% of its width or 20% of its height, so a group stays whole (where it then
does not fill the window, a darkened close-up of itself fills the rest); a "one person" photo fills the window. The
maker can **move a photo in its frame** in the editor (drag, zoom): a point and a zoom kept with the photo
(`scene.fit`), which outlives a rewrite by the agent. With few photos the cast performs between them in lyric
scenes: no drawn stand-in scene, no repeated "For <name>" tag. The gallery is search + occasion
and family filters + pagination from day one (`/api/templates`). The list is at the end of this file.

### One renderer

`CarolEngine.draw(ctx, W, H, card, t, env)` uses no DOM: the same code draws the editor's preview and the recipient's
interactive card in the browser, and every frame of the video on the server (`render.js`: `@napi-rs/canvas`, which
installed without trouble, so node-canvas is not used; frames go down a pipe to `ffmpeg` as raw RGBA). Output:
H.264 + AAC mp4, 30 frames a second, 1080x1920 (stories, reels, TikTok) and 1080x1080 (feeds, email); a poster jpg
in both shapes; a small silent gif (360 px, 4 seconds) for link unfurls. The fonts are bundled and registered under
the same family names in both places (`fonts.js`).

Rendering is a background job: rows in `jobs` (queued, running, done, failed; stage and percent), one at a time on a
machine (`limits.jobsAtOnce`), at most 3 tries. **A job is claimed with a lease** (`jobs.owner`, `jobs.lease`): the
claim is one UPDATE only one asker can win; the holder renews its lease while it works; a machine's own start puts
back what it was running; another machine's start leaves a held job alone and takes it only when its lease (a
minute) has run out; a machine that finds its lease gone stops and writes nothing. So neither a second machine nor
a restart runs a job twice, and a song that was already made is found by its job id and is not asked for (or paid
for) twice. A server that is stopping kills the render and leaves the job to be run at the next start. Caps: 60
seconds and 80 MB a video (`config.video`).

**The machine stops when idle** (`fly.toml`: `auto_stop_machines = "stop"`, `min_machines_running = 0`). While a
job runs the machine asks for its own `/healthz` through the public address (traffic keeps it up); a maker's
progress page asks every 1.5 s; at a start (`boot()`), with no request needed, what the machine was running is put
back and run (`test/restart.cjs` kills a real worker process in the middle of a video, with `kill -9` and with
SIGTERM, and starts it again); and a carol finished with nobody watching is announced to its maker by email
("Your carol is ready").

**The card knows when its video is older than its last edit**: `cards.rendered` is a hash of what the video was made
from; the maker's view says `stale` when the card would now draw something else, and "Update the video" (in the
editor and on the ready screen) is offered from that, never from something the page remembers.

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

One-off packs of carol credits through Stripe Checkout (REST, no SDK): 1 for $2.99, 5 for $9.99, 10 for $17.99
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

## The connector

A person adds `https://sendacarol.com/mcp` to their own Claude (Settings, Connectors, Add custom connector; or
`claude mcp add --transport http send-a-carol https://sendacarol.com/mcp`), signs in, and makes a carol by talking.
The landing page says how ("Make it with Claude", `/#claude`); the maker's menu has "Use Claude".

**One door.** A tool does what the site's pages do by asking the site's own API in this process, as that person
(`connect.js` `ask()`): the same checks, limits per account per day, credits, emails and "don't email me again"
list, whichever door somebody comes through. The connector has no path of its own that spends, sends or deletes.
The two things the pages cannot do (lines written by the person's own Claude; a music direction set by hand) are
checked in `connect-rules.js` and saved with the server's own `saveDoc`.

**Signing in** (`oauth.js`). `/mcp` answers 401 with `WWW-Authenticate: Bearer resource_metadata=...`; the client
reads `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server`, registers itself
(`/oauth/register`: redirects must be https, or http on localhost), and sends the person to `/oauth/authorize`.
That page signs them in with the product's own accounts (Google's button, or the emailed link, which brings them
back to the same request wherever they open it: the request is put aside in `oauth_asks` for 30 minutes) and asks
them to allow it; the yes carries a mark only this server could make for that person and that request. The code
(5 minutes, once) is traded at `/oauth/token` with PKCE (S256); access tokens last 30 days; a refresh token works
once and is replaced. Only hashes of codes and tokens are kept. A closed account is shut out.

**The protocol.** Stateless JSON-RPC over POST: the 2026-07-28 revision (`server/discover`; lists and
`resources/read` carry `ttlMs` and `cacheScope`, which claude.ai needs to show a panel) and the earlier ones
(`initialize`); `tools/list`, `tools/call`, `ping`, notifications (202), batches of up to 20 (run in order).

**The tools** (32; every list is searched and paged, and no tool answers a whole list):

| Tool | What it does |
| --- | --- |
| `how_it_works` | the guide: what a carol is, the steps, what is free, what costs a credit, what needs a yes, the limits, never |
| `occasions` | the occasions that can be made today, the ones coming soon, how many looks each has |
| `find_templates` | search the looks by words, occasion, style, tone and audience; 8 to a page, at most 20 |
| `suggest_templates` | three looks from who it is for, the occasion and the mood, each with why |
| `template` | one look in full, with a link that plays it and a picture drawn by the engine |
| `start_carol` | a draft (who it is for and from, what they are to each other, true details); picks a look when none is given |
| `my_carols` | the person's carols: search, state, 12 to a page |
| `carol` | everything about one: words, music direction, photos, takes, where it is, links |
| `set_details` | change who it is for or from, the details, the line that must be in the song |
| `write_lyrics` | the product's own writer writes or rewrites it: the site's free-draft, rewrite and daily limits |
| `set_lyrics` | lines the person's own Claude wrote: the writer's shape, a fit-to-seconds check, the same refusals |
| `set_text` | title, greeting, sign-off, captions |
| `add_photos` | a link, good for 30 minutes and one carol, to the product's upload page |
| `arrange_photos` | order, caption, "one person" (the shaped frame), position in the frame |
| `remove_photo` | take one photo out |
| `change_template` | another look |
| `set_music` | style words, tempo, voices, notes; never an artist, a song or "in the style of" |
| `preview_carol` | the live card: an MCP App panel in the chat; elsewhere a link that plays it, and the poster |
| `make_song` | has the song made and the video rendered: **one credit**, `confirm: true` |
| `status` | queued, writing the song, rendering N%, ready, failed |
| `takes` | the takes, which one plays, links to listen |
| `another_take` | the song sung again, within the takes a carol has |
| `choose_take` | which take the card plays (the video is made again) |
| `update_video` | the video made again after edits made it stale |
| `share_links` | the card page, the mp4s, the poster (the card's name stays from then on) |
| `set_card_name` | the `/<card-name>` address, by the site's rules, until first shared |
| `send_by_email` | emails the carol to named people, with a note: `confirm: true` |
| `take_down` | the page answers "not here": `confirm: true` |
| `put_back` | up again at the same link |
| `delete_carol` | for good: `confirm: true` |
| `my_account` | name, credits, what is left today of each limit |
| `buy_link` | the site's own link to the packs; the connector never takes payment and never gives credits |

**What is held in code, not only in descriptions.**

- *Ownership.* A token stands for one account; every tool reads the carol as that person through the site's own
  `mine()`: another account's carol is "There is no such carol". The admin's tools are not in this list and stay at
  `/mcp?admin=<key>` (a player's token does not open that door).
- *The confirm rule.* `make_song`, `send_by_email`, `take_down` and `delete_carol` do nothing without
  `confirm: true` (the boolean, nothing else): they answer what would happen ("This uses 1 of your 3 credits. The
  song takes about a minute...") so Claude asks the person first. With no credits `make_song` answers the buy link.
- *Once.* A write that carries `idempotency_key` is done once per person, tool, carol and key: a repeat gets the
  first answer (`replayed: true`); two at once wait on one piece of work (`idem` table, a day).
  `start_carol`, `another_take`, and `make_song` and `send_by_email` with `confirm: true`, require one.
- *Limits.* Drafts, rewrites, the writer's calls a day, new carols a day, emails a carol and a day, videos a day,
  photos: the site's own counters. The connector itself: 120 requests a minute for a token (the admin's limit
  `connectorPerMinute`), 200 kB a request.
- *Words Claude wrote* (`connect-rules.js`): `set_lyrics` holds lines to the writer's shape (4 to 10 lines, 64
  characters, verse and hook), plans the song as `song.js` will and refuses a line with more syllables than its
  seconds can carry, and refuses, each in one sentence that says what to change: words that demean a person, sexual
  content, a child beside what is not for children, hate, a line or "the tune of" an existing song, an artist's
  name. `set_music` (and `make_song`, before a credit is spent) refuses a music direction that names an artist, a
  band, a composer or a song, or says "in the style of" or "sounds like". This is a screen of words and patterns: it
  is narrower than a writer's judgement, and the tool descriptions tell Claude the rules in full.
- *Photos.* The connector takes no files. `add_photos` gives a signed link (HMAC of kind, carol and expiry) to
  `/mcp/photos/<link>`: the product's own page (camera or library, HEIC, the "These are photos I may use" tick). A
  photo without the tick's header is refused, and no tool adds a photo.
- *Nothing leaks.* No answer holds a storage key, an account id, another person's address, or a recipient's
  address (hashes only, as on the site); photos and songs are shown through links that run out in two hours.

**Seeing it.** `preview_carol` points at a `ui://send-a-carol/preview/<build>` resource: one self-contained page
(`connect-ui.js`: `art.js`, `engine.js`, `fonts.js` and the bridge inlined; no storage) that draws the card with the
product's own engine, silently on the template's tempo before there is a song and with the song (behind a button)
after, and asks for the carol again every five seconds through the connector's own tool, so it follows the chat.
The answer carries the carol's one template, so the panel holds no template list however large the library is.
Where a client shows no panel the answer has `preview_url` (the same player as a page of the site, two hours) and,
once ready, the poster.

**Testing it.** `node test/connect.cjs` (in `npm test`): the whole sign-in flow, the protocol, every tool's happy
path and refusals, ownership, the confirm gates, the shared limits, the upload link, a library stubbed to 5,000
templates, and, in headless Chromium, the upload page and the panel in a sandboxed frame with no storage fed by a
stand-in host. `node tools/connect-proof.cjs` is one run as a client makes it, start to finish, with the model and
the music service as stand-ins and the video rendered for real at full size. **Not tested:** inside claude.ai and
the Claude apps (the panel there, the sign-in from there), and a real person's flow.

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
  renames a table or column outside the cleanup list, applies the schema (the first deploy's empty database gets it
  here), reads every table with every column, plans every statement the code sends and opens every saved carol. On
  the live machine it fails only for what makes the site unusable: no `DATABASE_URL`, no `SESSION_SECRET`.
- **A missing secret switches its feature off, and the site says so** (each is a line `off:  <feature> (no <NAME>)`
  in the check, never a failure): no Stripe key, and the pay sheet says purchases open soon and no Checkout is
  attempted (the admin can grant credits, with a reason); no Google client id, and only the emailed link is offered;
  no storage settings on the live machine, and uploads and songs are refused with a sentence (never the machine's
  own disk: it is thrown away at every start); no agent or music key, and writing or singing is closed with a sentence.
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
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | media: any S3-compatible bucket, as plain config |
| `R2_REGION`, `R2_PREFIX` | optional: the signing region (`auto`, R2's, by default) and the folder (`send-a-carol/` by default) |
| `DATA_DIR`, `PORT`, `FFMPEG`, `HEIF_CONVERT` | where the SQLite file and the local store live; the port; another ffmpeg; another heif-convert |
| `FLY_APP_NAME`, `FLY_MACHINE_ID` | set by Fly: "this is the live machine" (no folder to fall back to; it keeps itself awake while a job runs), and the name a job's lease is held under |
| `R2_TEST_ENDPOINT`, `R2_TEST_BUCKET`, `R2_TEST_ACCESS_KEY_ID`, `R2_TEST_SECRET_ACCESS_KEY` | only `tools/r2-proof.cjs` reads these (a laptop's `.env`), so that a local run of the app can never write to a shared bucket |

Only keys are ever written to the database (`photos.okey/skey`, `takes.akey`, `media.mkey`: `cards/<id>/...`),
never an address: moving to another bucket is a copy of the objects under the prefix and a change of these
settings. Photos and originals are never public: they are served only through the app.

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
(nobody's real name) and code-drawn placeholder photos: `the-hollisters-2026` (cozy-mantel; a wide group, an upright
"one person" photo, a wide pair), `for-uncle-dave` (ugly-sweater-party), `nora-is-thirty` (birthday-bash). Used in
all: 4 songs of the 5 allowed, 5 agent calls (4 carols, one of them since replaced, and one refusal probe).
What each cost us, from the ledger: the words $0.03 to $0.05 (about 2,550 tokens in, 1,100 to 1,900 out), the song
$0.09 to $0.10 (35 to 40 seconds at $0.15 a minute); $0.12 to $0.15 a carol with one take, about $0.35 with all
three takes and a few rewrites. A render of both shapes took 32 to 46 seconds on the development Mac.
The music service kept every section's length to the millisecond and the measured tempo matched the tempo asked for
(95.99 for 96, 132.12 for 132, 125.98 for 126). The carols' media ran on the local-disk adapter. Nobody has heard
the songs.

The real services, each once (2026-11-18): one carol email sent through Resend; three test-mode Checkout Sessions
(499, 1499, 2499) with one paid on Stripe's hosted page and confirmed once, and one paid and recovered at the next
`/api/me`; put, head, ranged get, list and delete through the storage adapter against a real bucket under
`send-a-carol/test/`, left empty; the suite and `--check` on Postgres 16; the image built, and inside it (no
network) the check, ffmpeg, the fonts, a short render and a HEIC conversion.

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
- The photo copy the video uses is 1600 px; a HEIC original is kept as it came, beside its JPEG copy.
- Prices are config, not admin-editable; limits can be overridden in the admin.
- No webhook (see Money). One machine is what `fly.toml` runs; the job lease is what makes a second one safe.
- The machine keeps itself awake during a job by asking for its own `/healthz` through the public address.
- X gets `summary_large_image` (a player card needs X's approval); the unfurl image is the square poster, then the gif.

## Next (not in version 1)

- The occasions marked `soon`, and Hanukkah, Diwali, Eid, Easter, Halloween, Thanksgiving.
- Word-by-word karaoke, if the music service documents its timestamps.
- A player card for X (it needs their approval), an account page with "delete my account".
