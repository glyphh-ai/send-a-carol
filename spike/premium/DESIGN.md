# Send a Carol Premium: the group carol

A design from a feasibility spike (2026-11-18, branch `premium-spike`). Nothing here is built into the product.
Sources are linked where a fact comes from one; they were read on 2026-11-18. The legal parts are issues for a
lawyer, not advice. Nobody has heard the spike's audio: where this says "measured", it is a number, not an ear.

## The hard rules

1. **Purpose-limited consent.** A singer's photo, voice recording and the voice model made from it are used for
   the ONE carol they were invited to and nothing else: not another carol (by the same producer or anyone), not
   another product, not training, marketing, examples, the landing page, the gallery or testing. Enforced in code
   and by deletion, not only by wording (see "Enforcement").
2. **Each singer records themselves.** On their own device, with the microphone, after reading the consent. No
   uploaded audio file. A producer never supplies another person's voice or ticks consent for them.
3. **Adults only for voices.** The provider forbids it otherwise: "You may not submit voice recordings of anyone
   under 18 to create or train a voice model" (https://elevenlabs.io/use-policy).
4. **The standard carol does not change** (next section).
5. No machine-learning model in our own code: the avatar is a photo cut-out moved by arithmetic; the pitch
   correction is arithmetic. Photos are never sent to any outside service.

## What does not change

"The current carols are perfect." The standard carol (one maker, photos, the agent's words, the service's own
singing voice, the 33 templates, the video, $4.99 / 5 for $14.99 / 10 for $24.99) stays exactly as it is for
anyone who never touches premium:

- Premium has its own entry point (`/group`), its own pages and scripts, its own tables (`groups`, `singers`,
  `consents`, `voice_jobs`) and its own job kinds. No existing route, column, config key or price changes meaning.
- `engine.js`, `templates.js`, `art.js`, `song.js`, `beat.js`, `render.js` draw and make the same bytes for a
  standard card. The avatar stage is a separate module that draws only when a card carries a `premium` block (the
  spike does this by wrapping the draw call in its own process, with no product file changed).
- `test/contract.json`, the fixtures and every existing test must pass unchanged; premium adds tests, edits none.
- The landing page keeps leading with the standard carol. Premium is a section further down: "And for a group…".

## What premium is

A **group carol**: a music video in which each invited person appears as an avatar with their own photo for a
head, dressed by the template (elves, snowmen, carolers, the office party…), and sings their lines in a voice made
from their own recording; everyone sings the hook together. For a family, a friend group, a team at work, a class
reunion, a choir, a sports team.

- **Producer**: the buyer. Pays $49.99 once (premium on their account, for good), then one carol credit per group
  carol like any other carol. Starts the carol, invites, sees who is invited / started / ready, can nudge or remove
  a singer, builds the carol when enough are ready.
- **Singer**: anyone the producer invites. Never pays, needs no account: the emailed (or shared) invite link is
  their identity for that one carol, and the same link is where they later see and remove themselves.

## The flow

1. Producer picks an occasion and a template, writes the brief with the agent as today (words can be approved now
   or after the singers are in), and adds invitees: a name and an email, or "copy a link" per singer.
2. Each singer opens their link on their phone:
   a. **Who is asking and for what** (the consent screen, below). They must tick it before anything else opens.
   b. **Age**: "I am 18 or older" (required). Under 18: see "Children".
   c. **Photo**: take or choose a photo of THEMSELVES; drag an oval over the face; drag one line across the mouth.
      They see their avatar in costume, mouth moving, straight away (it is all drawn in the page).
   d. **Voice**: the microphone opens only now. They read a short script aloud, which begins with the consent
      sentence. Coaching on screen from the provider's guidance: a quiet room, one voice, 30 to 60 seconds, steady
      tone ("at least 5 seconds per file… 10 seconds in total"; "1-2 minutes of clear audio without any reverb…
      or background noise"; https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning).
      We measure level and length in the page and ask for another go when it is too quiet, clipped or short.
   e. **Preview before submitting**: their avatar singing a few seconds in their cloned voice (one short
      conversion of a fixed sung phrase: about 5 s, under a cent). They can re-record or back out. Then Submit.
3. The producer's page shows each singer as invited / opened / ready. When everyone, or enough, is ready, the
   producer assigns lines (default: verse lines go round the singers, everyone on the hook; drag to change) and
   presses **Make the carol**: that spends the credit.
4. The job: the song (guide vocal by the service's singer, asked for as ONE solo voice) → stems → each singer's
   voice is created at the provider, the guide vocal is converted into it, the voice is deleted → retune → mix →
   video in both shapes. The card page, sharing and takedown work as for any carol.

### The consent, as shown (draft for the lawyer)

> **[Producer's name] invited you to sing in "[carol title]", a Send a Carol video for [recipient].**
>
> If you agree, here is exactly what happens:
> - Your photo becomes a cartoon-bodied avatar with your face, in this one video.
> - Your recording is sent to our voice provider (ElevenLabs) to make a computer model of your voice. That voice
>   sings the words of this one carol.
> - [Producer's name] gets the finished video and can share it by link. They never get your recording or your voice model.
>
> What we will NOT do: use your photo, recording or voice for any other carol, video or product; use them for
> advertising, examples or testing; use them to train anything; sell or share them.
>
> We delete the voice model at the provider as soon as this carol's songs are made, and your photo and recording
> 30 days after the carol is finished (so [producer] can fix a mistake), or at once if you ask. The link in your
> invite email lets you remove yourself at any time: we then delete your photo and recording, and the video is
> taken down until it is rebuilt without you.
>
> You must be 18 or older, and this must be your own face and your own voice.
>
> [ ] I agree to this, for this carol only.

The first sentence they read aloud: **"I'm [first name], and I agree to my voice being used to sing in
'[carol title]' on Send a Carol, and nothing else."**

**The record kept** (`consents`): the exact text version shown (a hash and the version id), the tick's time, the
audio of the spoken sentence (kept as the consent record after the sample itself is deleted: confirm with the
lawyer how long), the invite id, the carol id, the address the invite went to, the device's user agent. No
consent row, no microphone.

### A second carol

A new invite and a new consent every time, also for the same producer and the same singer. The singer's page may
offer "Use the photo and recording I gave for [earlier carol] for this one too" as an explicit yes, only while
that earlier material still exists (30 days), never ticked by default, and never as a standing permission. There
is no reusable singer profile.

### Children

- **No child's voice is recorded or cloned.** The provider's rule above is absolute, and COPPA treats a child's
  voice recording and voiceprint as personal information needing verifiable parental consent
  (https://www.law.cornell.edu/cfr/text/16/312.2).
- Open question for the provider and the lawyer before any child appears at all: the same policy also says "You may
  not use our Services to create a voice, avatar or other content that uses the likeness of, or is designed to be
  recognized as, a specific real minor." A child's photo avatar "singing" in a stock voice made by that service may
  fall under it.
- Recommendation for version 1: **adults only**. Later, if cleared: a parent adds a child's photo inside the
  parent's own singer session; the child's avatar joins the hook with a stock voice, or stands and dances without
  singing.

### Withdrawal

One link, in the singer's invite email and on their singer page, no account: deletes the recording, the photo,
any voice still at the provider, and the singer's parts; records it. **Proposed (owner to confirm):** a carol
already made is taken down at once (its page answers as a taken-down card), the producer is told, and may rebuild
without that singer at no extra credit. An mp4 someone already downloaded cannot be recalled: the consent screen
should say so in a sentence.

## Voices: how they are created, stored and deleted

- **Instant voice cloning only** (`POST /v1/voices/add`: https://elevenlabs.io/docs/api-reference/voices/ivc/create).
  Professional cloning needs 30+ minutes of audio, hours of training, and "You can only create a Professional Voice
  Clone of your own voice" (https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning).
- **Created per render, deleted after** (`DELETE /v1/voices/{voice_id}`): the voice exists at the provider for
  the minutes the carol's songs take, and the deletion is recorded with the provider's answer. This is the
  purpose-limit rule in practice, and it is also forced by the plan: an account holds few custom voices (Starter 10,
  Creator 30, Pro 160, Scale 660, Business 2,200: https://elevenlabs.io/pricing).
- **THE SCALING LIMIT.** The provider caps voice add/edit operations per month: Starter 65, Creator 95, Pro 290,
  Scale 1,040, Business 1,040, Enterprise unlimited
  (https://elevenlabs.io/docs/help-center/account/general/is-there-a-limit-on-how-many-times-i-can-edit-add-voices;
  the page is undated; this account, on Starter, reports 65 through the API). One singer in one carol is one
  operation (more with retakes after deletion). So below Enterprise: about 1,000 singer-renders a month, perhaps
  200 group carols. December needs an Enterprise agreement.
- Our storage: the recording and the photo are private objects under the carol (`cards/<id>/singers/<sid>/`),
  never served to the producer or the public; only the keys are in the database, with `carol_id` on every row.

### Enforcement (rule 1 in code)

- **One choke point.** `voiceFor(singerId, carolId, purpose)` is the only function that reads a sample or calls
  the provider's voice endpoints. It refuses unless a consent row exists for exactly that singer and that carol,
  not withdrawn, of the current text version. A test asks for a singer's voice with another carol's id and must be
  refused; a test greps that no other file names the provider's voice endpoints or the samples' storage prefix.
- Provider voice: created in the render job, deleted in its `finally`; a sweep at start deletes any voice the
  account holds that a finished or dead job left behind, and the admin overview shows "voices at the provider
  now" (should read 0 when idle).
- Deletion schedule: samples and photos 30 days after the carol is finished; at once on withdrawal or when the
  producer deletes the carol or removes the singer. A daily sweep; every deletion logged.
- Admin: no export of samples; listening to or viewing a singer's media is an audited action with a reason. The
  producer's API never returns a sample or a voice id.
- Examples, the landing page and tests use stock voices and drawn people only (as this spike does).

### What the provider does with the samples (read this one)

- As an API customer we are the controller and ElevenLabs the processor (DPA §2.1: https://elevenlabs.io/dpa),
  and consent is ours to get (use policy: no cloning "without their explicit and informed consent";
  the terms: a voice "you are authorized to share with us", https://elevenlabs.io/terms-of-use §4(b)).
- **But the terms reserve the provider's own use of content for "research and development of its AI models", with
  an opt-out "of our use of your Content for training at any time" in the account's Data use setting (§4(i)).
  The opt-out must be switched on before the first singer records, and verified in writing with the provider:
  otherwise the samples are used beyond our purpose and rule 1 is broken.**
- Zero Retention Mode is Enterprise-only and does not cover cloning: "Voice cloning requires storing the clone to
  generate speech" (https://elevenlabs.io/docs/resources/zero-retention-mode). It does cover the voice changer.
- The provider's privacy policy keeps voice-derived data no "longer than 3 years after your last interaction"
  (https://elevenlabs.io/privacy-policy): what remains on their side after we delete a voice is a question to put
  to them in writing.
- Reselling: the use policy forbids giving "your own end users… terms more permissive than those that apply to
  you"; the OEM terms (https://elevenlabs.io/oem-terms) cover building their service into a product and speak of
  an Order Form. Nothing says a consumer product may or may not create clones for its users on a self-serve plan.
  **Ask their sales and legal before building**: Enterprise is needed anyway (the add/edit cap, the DPA, zero
  retention for conversions).

## The song

### What the spike proved and disproved

- **ElevenLabs Music cannot sing in a custom voice by API**: `POST /v1/music` has no voice parameter
  (https://elevenlabs.io/docs/api-reference/music/compose). Their "Vocals" feature is app-only.
- **Stem separation exists and works**: `POST /v1/music/stem-separation` returned a vocal and an instrumental of a
  40 s carol in 6 to 7 s (https://elevenlabs.io/docs/api-reference/music/separate-stems).
- **The voice changer keeps the timing and loses the tune.** Thirteen conversions into six stock voices, two
  carols: length +11.6 ms, loudness envelope within 5 ms, 81 to 94% of onsets within 50 ms; but only 0.4 to 19% of
  sung frames within 50 cents of the melody's note. It follows the tune's rise and fall (contour correlation up to
  0.92) while sliding into the target voice's speaking range. Settings and the other conversion model did not help.
  The docs never claim singing is kept.
- **Our own retune puts the tune back**: pitch-synchronous overlap-add, about 100 lines of arithmetic, 0.1 s per
  stem: 72 to 81% of frames within 50 cents, median 13 to 22 cents off, men an octave below women. Whether it
  SOUNDS good nobody has checked: the files are in `/tmp/carol-premium` with a listening order.
- Not tested: a real cloned voice (nobody was cloned). A clone from 45 seconds of phone speech may behave
  differently from a stock voice, better or worse.

### The two song routes

| | Original personalised carol | Famous public-domain carol |
| --- | --- | --- |
| Words | the agent's, as today | the traditional words, or new personalised words to the old tune |
| Tune and backing | the music service (as today, asking for one solo lead) | **cannot come from the music service** |
| Why | | its terms forbid "any song title" and "a substantial or distinctive portion of any song's lyrics" in a prompt, with no public-domain exemption, and it has no melody input: an audio reference "does not copy or remix the uploaded audio" (https://elevenlabs.io/music-terms §2.1; https://elevenlabs.io/docs/overview/capabilities/music) |
| So | proven end to end in this spike | needs OUR OWN backing track and guide vocal per carol: an arrangement we commission or make from the public-domain score (ours to own), and a guide singer we record once per carol (or a per-syllable melody map for the retuner). Personalised words to a famous tune then need the guide re-sung per carol: by text-to-speech in a stock voice, time-stretched to the syllables and retuned to the score. Plausible with the retuner built here; NOT proven |

Public domain in the US in 2026 means published before 1931 (https://cspd.law.duke.edu/publicdomainday/2026/).
Words and tune both clear: Jingle Bells (Pierpont, 1857), Silent Night (Mohr/Gruber 1818; English, Young 1859),
Joy to the World (Watts 1719; tune "Antioch", Mason), Hark! The Herald Angels Sing (Wesley 1739; Mendelssohn
1840/Cummings 1856), O Come All Ye Faithful (Wade c.1743; Oakeley 1841), The First Noel (1823/1833), O Little
Town of Bethlehem (Brooks/Redner 1868), It Came Upon the Midnight Clear (Sears 1849/Willis 1850), Away in a Manger
(1885/Murray 1887), Angels We Have Heard on High (Chadwick 1862), Good King Wenceslas (Neale 1853), O Holy Night
(Adam 1847; Dwight), God Rest Ye Merry Gentlemen, Deck the Halls (Oliphant 1862), Up on the Housetop (Hanby
1864), Jolly Old Saint Nicholas (1865/1874), O Christmas Tree, Auld Lang Syne (Burns 1788), The Twelve Days of
Christmas (Austin's 1909 tune). Sources: hymnary.org pages per carol; Wikipedia for the secular ones (flagged).
**Avoid or clear first**: We Wish You a Merry Christmas (the familiar version is Warrell's 1935 arrangement),
Carol of the Bells (English words 1936). **Not public domain**: Rudolph, Frosty, White Christmas, Santa Claus Is
Comin' to Town, Winter Wonderland, Let It Snow, Jingle Bell Rock, Have Yourself a Merry Little Christmas, Little
Drummer Boy, Do You Hear What I Hear, Feliz Navidad, Silver Bells, Sleigh Ride, The Christmas Song.
A modern recording, arrangement or MIDI file of a public-domain carol has its own copyright
(https://www.copyright.gov/circs/circ14.pdf, https://www.copyright.gov/circs/circ56.pdf): take scores from Mutopia
(per-piece CC or PD: https://www.mutopiaproject.org/legal.html) or IMSLP, and record our own.

## The video

Proven in the spike with the product's own renderer (`render.js`, both shapes, 40 s, about 35 to 80 s to render):

- **The head**: the singer's oval and mouth line. The photo is turned so the mouth lies flat, cut to the oval with
  a soft edge, split at the line; the jaw drops up to a tenth of the face's height, the skin beside the mouth is
  stretched across the gap, the mouth opens dark with a hint of teeth. No face tracking; eyes do not move.
- **The costume** is drawn in three layers: behind the head (elf ears in the singer's own skin colour, a
  snowman's snowball), on it (a hat over the top of the oval, so it reads as worn), in front of the chin (scarf,
  collar, songbook). Built: elf, snowman, caroler, office party. Each template would name its costume.
- **Singing**: the jaw follows the loudness of THAT singer's own part (gated: a silent singer's mouth stays shut;
  checked on every frame: 0 open-mouth frames outside a singer's own lines). The singer leans in, raises an arm
  and gives off notes; everyone hops on the beat; on the hook they sway as one.
- **Groups**: one row while that keeps avatars largest, then risers. Checked by box arithmetic for 2 to 20
  singers, four costumes, both shapes: no face off the frame, under the title ribbon, under the lyric band or
  behind a singer in front. Face height on the 1080-wide frame: 4 singers 209 to 241 px (story) and 198 px
  (square); 6 singers 209 to 241 and 135; 12 singers 143 to 164 and 124 (reads as a choir); 16 singers 117 to 121
  and 92; 20 singers 105 to 121 and 92 (fits, but faces are small on a phone). The lyric band is the engine's own.
- **Lines**: verse lines go round the singers (more singers than lines: they pair up); the hook is everyone.
- Honest limits: the test "photos" are drawings, kinder to a cut-out than real selfies (uneven light, turned
  heads, glasses glare, hands). The oval cuts hair off: long hair disappears under the hat and a singer can look
  bald-in-a-hat. A real-photo trial with the owner's own selfie is the first thing to do. The look is paper-puppet
  (think JibJab), and it is charming with the placeholders; it is not lip-sync.

**The generative alternative, for comparison only** (not recommended): services that animate a photo to sing cost
about $0.88 to $2.33 per 35 s clip per singer (Hedra $0.025 to $0.0625/s: https://www.hedra.com/develop/models/video/hedra-character-3;
HeyGen about $4/min: https://help.heygen.com/en/articles/11269603-heygen-avatar-iv-complete-guide), so $3.50 to
$9 for a family of four against a $4.99 carol; they forbid children's faces (HeyGen, Runway, ElevenLabs) or anyone
but yourself (Hedra's standard policy: https://www.hedra.com/acceptable-use); and they mean sending every
singer's face to a deepfake-style service. The cut-out costs nothing per carol and keeps photos with us.

## Money

- $49.99 once unlocks premium on the producer's account for good (a `premium` purchase row; Stripe keeps about
  $1.75). Each group carol then spends one carol credit. Singers never pay.
- **Cost of one group carol** (40 s; published API prices: music $0.15/min, voice changer $0.12/min, stems at
  half the music price, https://elevenlabs.io/pricing/api; a conversion measured at 400 credits per 40 s; creating
  a voice has no published fee):

| Singers | One take | All three takes | Margin on a $4.99 credit (after Stripe, $4.55) | On a 10-pack credit ($2.40 after Stripe) |
| --- | --- | --- | --- | --- |
| 2 | $0.35 | $0.97 | $4.20 to $3.58 | $2.05 to $1.43 |
| 4 | $0.51 | $1.45 | $4.04 to $3.10 | $1.89 to $0.95 |
| 6 | $0.67 | $1.93 | $3.88 to $2.62 | $1.73 to $0.47 |
| 12 | $1.15 | $3.37 | $3.40 to $1.18 | $1.25 to -$0.97 |
| 20 | $1.79 | $5.29 | $2.76 to -$0.74 | loss |

  (One take = words $0.04 + song $0.10 + stems $0.05 + $0.08 per singer. A take = song + stems + all conversions.)
- **Fair use**: up to 8 singers on one credit; 9 to 16 singers cost two credits; 16 is the cap. Group carols get 2
  takes, not 3. Converting only the lines a singer sings (not the whole vocal) would roughly halve the per-singer cost.
- Fixed costs that premium adds: the provider's Enterprise plan (price by quote; Business is $990/month and still
  capped at 1,040 voice operations), and a lawyer's review before launch.
- Invites: email through Resend as today; "copy link" / the phone's share sheet costs nothing and is sent by the
  producer themselves (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share). **No SMS in version 1**:
  it costs about $0.012 a text plus 10DLC registration (https://www.twilio.com/en-us/sms/pricing/us), and a text
  to a number the producer typed has no opt-in from its owner (CTIA best practices §5.1.2).

## Abuse controls

- Cloning someone without consent: the microphone-only recording with the spoken, carol-naming sentence; the
  invite goes to an address, and the record ties sample, address and time. The provider also blocks "celebrity and
  other high risk voices" and can answer `requires_verification`: treat that as a refusal with a kind sentence.
- A singer recording someone else's voice playing from a speaker: not preventable by us; the spoken consent
  sentence, the logged record and "Report this card" are the answer. Say so to the lawyer.
- Impersonation in words: the agent's existing refusals apply; a group carol's lyric also may not put words in a
  singer's mouth that demean them (the singer sees the carol's words on their page before they record, when the
  producer has approved them; if the words change after, singers are told and can withdraw).
- Limits: singers per carol (16), invites per producer per day, re-records per singer (5), previews per singer (3).
- Removal: singer's link, producer's "remove", admin takedown; all end in the same deletion path.

## The law, as issues for a lawyer

- **Texas** Bus. & Com. Code §503.001: a voiceprint is a biometric identifier; capture for a commercial purpose
  needs prior notice and consent; no sale; reasonable care; destroy within a reasonable time and at most a year
  after the purpose ends; up to $25,000 per violation, attorney general only
  (https://statutes.capitol.texas.gov/Docs/BC/htm/BC.503.htm). HB 149 (2026) adds an AI-training carve-out that
  does not apply when a system is used "for the purpose of uniquely identifying a specific individual"
  (https://capitol.texas.gov/tlodocs/89R/billtext/html/HB00149F.htm): does a voice clone fall in or out?
- **Illinois** BIPA (740 ILCS 14): a public written policy with a retention schedule (destroy when the purpose is
  met or within 3 years); written notice and a written release before collection (electronic signature counts
  since 2024); no profit from the data; a private right of action, $1,000 / $5,000 per violation
  (https://www.ilga.gov/Legislation/ILCS/Articles?ActID=3004&ChapterID=57). Singers will be in Illinois: the
  consent screen and the published retention schedule are what this demands. Geoblocking Illinois is an option to price.
- **COPPA** (16 CFR 312): a child's voice file and voiceprint are personal information; verifiable parental
  consent; no indefinite retention; the 2025 amendments are in force
  (https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm). Adults-only with an age tick; what
  more is needed to not have "actual knowledge"?
- **Tennessee** ELVIS Act: voice (including a simulation) is a property right; liability for a tool whose primary
  purpose is producing a person's voice without authorisation (https://www.capitol.tn.gov/Bills/113/Bill/HB2091.pdf).
  Our authorisation record is the defence. Washington's My Health My Data Act counts voice recordings "from which
  an identifier template can be extracted" (https://app.leg.wa.gov/RCW/default.aspx?cite=19.373.010). The federal
  NO FAKES Act is a bill, not law.
- Also for the lawyer: the consent text above; how long the spoken consent may be kept after the sample is gone;
  the 30 days; what a withdrawal owes when an mp4 was already downloaded; EU/UK singers (explicit consent for
  biometric data) or US-only at launch; the provider's music licence for a group product (Exhibit A of the music
  terms limits plans by organisation size, and bars "model resale" below Enterprise).

## Proven by this spike / assumed

| Proven (run for real) | Assumed or untested |
| --- | --- |
| Stems from the product's own songs, by API | How any of it sounds (nobody listened) |
| Voice changer keeps timing (ms) and loses the notes | A real cloned voice from a phone recording, sung through the changer |
| Our retune restores the notes (numbers) | That the retune's artefacts are acceptable to the ear |
| Mixes: lines alternating by the product's line timings, all on the hook, -14 LUFS | That instant clones can be created and deleted at the needed rate (no voice was created) |
| The cut-out avatar, four costumes, jaw from each singer's own part | Real photos; hair; small faces at 12+ on phones |
| 2 to 20 singers laid out without a face covered; real 40 s videos via render.js (4 and 6 singers) | The browser side: oval and mouth-line tool, microphone capture, level meter |
| Cost per conversion (400 credits / 40 s) | Famous carols with our own arrangements; personalised words to a famous tune |
| Standard product untouched (no product file changed) | The provider allowing this product on any plan; the law |

## Build plan

| Phase | What | Size |
| --- | --- | --- |
| 0 | **Listen** to the spike's files. The owner clones HIS OWN voice from a 45 s phone recording and we run it through the pipeline; his own selfie through the cut-out. Write to the provider (resale, minors, training opt-out, Enterprise, add/edit cap). Lawyer reads this document | days; decides everything after |
| 1 | Groups, invites, singer page (consent, age, photo + two taps, recorder with coaching), consent records, the choke point and its tests, deletion sweeps, withdrawal | 2 to 3 weeks |
| 2 | The premium render job: solo-guide song, stems, create/convert/delete per singer, retune, mix, line assignment editor, the avatar stage in the engine behind `card.premium`, costumes for the Christmas templates | 2 to 3 weeks |
| 3 | $49.99 purchase, fair-use credits, admin views (singers, consents, voices at the provider, audit), landing "for a group" section, a real-services proof run | 1 week |
| 4 | Famous carols: our own arrangements and guide vocals for 5 carols, traditional words first | 2 weeks plus the music itself |
| later | Children (if cleared), SMS, more costumes, choirs above 16 | |

## Decisions only the owner can make

1. **Does the retuned singing sound good enough to sell?** Listen to `/tmp/carol-premium/solo/female.mp3` against
   `solo-NOT-retuned/female.mp3`. *Recommendation: if not, stop before phase 1; the rest depends on it.*
2. **Adults only at launch, no children's voices ever, no children's photos until the provider and the lawyer
   clear it?** *Recommendation: yes.* It changes "the family" pitch: parents and grown children sing; kids can be in
   the standard carol's photos.
3. **Go to the provider for an Enterprise agreement before building?** *Recommendation: yes: the monthly voice cap,
   the training opt-out in writing, and permission to offer cloning to our users all need it.*
4. **Withdrawal after a carol is shared: take it down and let the producer rebuild free?** *Recommendation: yes.*
5. **Keep samples 30 days after the carol is finished?** *Recommendation: yes; 0 days is purer but a retake then
   needs every singer again.*
6. **Fair use: 8 singers per credit, two credits for 9 to 16, 2 takes?** *Recommendation: yes.*
7. **Premium for good at $49.99, with no included carol?** *Recommendation: include one group carol in the $49.99,
   so the first thing a buyer does is make one.*
8. **Famous carols in the first release?** *Recommendation: no: launch with original carols (proven), add five
   famous ones with our own arrangements after.*
9. **Is the paper-puppet look right for the brand?** Watch `/tmp/carol-premium/video/family-snowmen/story.mp4`.
   *Recommendation: yes, with a real-photo trial first.*
10. **US only at launch, and Illinois in or out?** *Recommendation: US only; ask the lawyer about Illinois before deciding.*
11. **Invites by email and share-link only, no texts?** *Recommendation: yes.*
