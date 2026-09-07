# Sync (opt-in)

Planbook is fully usable with no account. Sync exists only to carry the year document between
the teacher's laptop and iPad, and it is off until they turn it on.

## The scope, and only this scope

```
https://www.googleapis.com/auth/drive.file
```

"See, edit, create, and delete **only the specific Google Drive files you use with this app**."
It grants access to files this app created and nothing else — the rest of the teacher's Drive is
invisible to it.

**Never add `spreadsheets`.** It reads every spreadsheet the teacher owns, and its only use would
be reading a sheet the app didn't create. **Never add a mail scope** — outreach goes out through
`mailto:`, which needs no permission at all. Those two additions are what put "Google hasn't
verified this app" in front of a teacher, and the whole point of this architecture is that they
never see it.

`drive.file` is still a *sensitive* scope, so the OAuth client needs Google verification before
public launch — a privacy policy, a verified domain, and a demo video. Days, not months, and no
CASA security assessment (that's restricted scopes only). Until it's verified, sync stays behind a
flag; the local-first app ships without it.

## Auth

Google Identity Services token flow, browser-only, no client secret and no backend. Consequences
worth knowing up front:

- Access tokens last about an hour and **there is no refresh token in a browser-only flow**. Sync
  happens while the app is open and the teacher is signed in; a silent re-auth (`prompt: ''`)
  usually renews it, but sometimes they'll click. Background or scheduled sync is not possible —
  don't design a feature that assumes it.
- One OAuth client, owned and verified by us. Teachers deploy nothing.

### What WO-7.1 settled — 2026-08-24

The three things the protocol above did not answer, decided when the sign-in was built. All three
live in [`src/auth.js`](../src/auth.js), argued at length in its header; this is the short form.

**The token lives in memory and only in memory.** A module variable, so a reload is a sign-out.
It is not student data and not a UI preference, so `src/prefs.js`'s `PREF_DEFAULTS` would refuse
it — but the reason is stronger than the closed door: an access token is a bearer credential, and
in `localStorage` it outlives the tab and survives a laptop handed to a substitute. Persisting it
would buy nothing anyway, because there is no refresh token and the thing that makes the next
sign-in silent is the teacher's own Google session rather than our storage.

**The control is in the About modal, not in Backup & restore.** Backup was the tempting home and it
loses on one sentence from this document: *sync is not a backup.* A Connect button under "Download
a backup" teaches the misconception that costs a term of grades. About already carries the sentence
a sign-in qualifies — "There is no account and no server" — and that is where the footnote belongs.

**The flag is the origin.** `hostAllowsSignIn()` answers for loopback and nothing else, and **that
is the code holding itself back rather than a limit Google imposes** — the client's authorized-origin
list has carried `https://planbook.hwgteach.com` beside `https://localhost:8443` since 2026-08-21,
confirmed 2026-08-24. Loopback is simply where a handshake can succeed with the code's list as it
stands. On the deployed app the section is not drawn, no Google script is ever fetched, and
[`../privacy.html`](../privacy.html)'s claim that Planbook loads no third-party code of any kind
stays true word for word — **which is what the hold buys, and what widening the list costs.**
**WO-7.3 widens that one function, and that is all that is left of the pair**; the console half was
paid on the dates above. Either half alone gives a button that ends in `origin_mismatch`, and today
the code is the half that is behind, which is the safe direction.

*(This paragraph read* "the OAuth client's **only** authorized JavaScript origin (`https://localhost:8443`)"
*until 2026-09-07, four lines above the sentence naming the second origin — a contradiction inside one
paragraph.* `0f77a37` *swept that instruction out of eight files on 2026-08-24 and reached the WO-7.3
sentence below rather than this one. **The claim travelled before it was caught**: it is where*
`CLAUDE.md`*'s copy came from, and a reading of WO-7.2 on 2026-09-07 concluded from it that the iPad
was blocked behind Google's review queue, when the block is one line in* `hostAllowsSignIn()` *and
the deploy that would widen it.)*

Two more things worth carrying forward. A grant that does not contain this scope is **refused**
rather than held, so a token whose consent screen said something else never gets stored. And
`acceptTokenResponse()` copies three fields out of Google's answer rather than keeping the answer,
which is how "no refresh token is stored" is a property of the shape instead of a check for a name.

**The panel said nothing is uploaded yet, and that line was a deliverable.** WO-7.1 signed in and
stopped; WO-7.2 moved a document, so the sentence went in the same sitting as the code that made it
false — which is what "whatever moves a document says so in the same words" is for. What replaced it
is two notes in the same panel: **what sync puts in a teacher's Drive**, named field by field down
to the accommodations, the medical needs and the behavior plans, and **sync is not a backup**. The
first is `CLAUDE.md`'s one-exception rule applied a second time — the downloadable backup is the
exception "and its own UI says so", and sync is now the second place that data leaves the device, so
its own UI says so too. Do not soften either, and do not filter the upload to make the first go
away.

### What WO-7.2 settled — 2026-09-07

Four things decided while the transfer was built, each argued at length in `src/drive-sync.js`'s
header; this is the short form. The restore question is the fifth and has a section of its own,
under the model below.

**`baseRev` lives in IndexedDB, in a store of its own, keyed by `docId`.** It existed in this
document and in no line of code until WO-7.2. It could not go in the year document — that is the
thing being synced, so a per-device bookmark inside it would travel to the other device and be read
as that device's own, and writing it would itself bump `rev` and put the document permanently ahead
of the bookmark just written. It could not go in `localStorage` either: `src/prefs.js` is UI
preferences and refuses an undeclared key, and the state of a data transfer is not a switch
position. `src/store.js` is the only file in the repository that opens IndexedDB and it stays that
way, which is why the two readers live there rather than in the sync module.

**One multipart request per write, and never a resumable upload.** A resumable upload is what
Google's documentation reaches for at three to six megabytes, and it is exactly what creates a
half-written state with a name — a session URI and bytes at Drive belonging to a transfer nobody
finished. A single request has no such state: Drive commits the whole body or the previous revision
stands. That is the "never half-written" acceptance line as a property of the shape rather than as a
cleanup path that has to be got right.

**Preserve, then overwrite.** On a conflict the losing copy is downloaded and written to a new Drive
file *before* the live file is touched. A failure anywhere before that write leaves Drive exactly as
it was, so an interrupted conflict is a conflict that has not happened. The conflict copy carries
`conflictOf` rather than `docId`, so `files.list` can never match it again.

**The save chip gets `syncing` and `retry` and never `error`.** `queued` does not come back — it was
Roll Call!'s outbox state and this app has no outbox. `error` is refused because it draws "✕ Save
failed": every failure path leaves the document on the device untouched, so painting it would tell a
teacher her grades are in danger at the moment they are not. A failed sync reports in the Drive
panel.

## The model: whole document, last writer wins

The teacher never edits two devices at once — that was established up front, and it's what makes
this sound rather than lazy. Each save bumps `rev`; the app remembers `baseRev`, the rev it last
knows landed in Drive. The remote file carries its `rev` in `appProperties`, so ordering is
readable without downloading it.

```
remote.rev == baseRev   → local is ahead      → upload
remote.rev >  baseRev   → remote is ahead     → download (if local is unchanged since baseRev)
both changed            → conflict            → keep both, never discard
```

### What a restore does to `rev`

A restore is the one operation that puts a document on the device without a save producing it, so
it has to answer to the ordering above. It does, and the rule is already implemented in
`src/store.js` (`restoreDocument()`, and the reasoning block above it):

```
restored.rev = max(this device's rev for that year, the file's rev) + 1
```

**`rev` never goes backwards for a year on a device.** A backup taken at rev 12 and restored over a
year that had reached rev 50 here becomes rev 51, not rev 12. Reverting to the file's number would
let a later sync compare against a rev the document on this device never had, which is the one thing
the table above cannot survive.

The consequence is deliberate and is the behavior a teacher restoring on purpose expects: the
restored document is **ahead of `baseRev`**, so it uploads, and an old file restored knowingly
**supersedes** the Drive copy rather than quietly losing to it. A restore is a decision; sync must
not overturn it on the next poll.

`updatedAt` becomes now, for the same reason — both are save bookkeeping, not content. Everything
the teacher typed comes back exactly as the file holds it.

### What a restore from a *different device* does — answered 2026-09-07 (WO-7.2)

This paragraph was an open question until the day sync was built. It read: a backup restored from a
different device brings that file's `docId` with it, `docId` is what `files.list` matches on, and
whatever builds sync has to decide what that means — "most likely re-point `baseRev` and re-match
the remote file rather than assume the local pairing still holds. Write the answer here when it
exists."

**The answer is that nothing needs to be detected, because the bookmark is keyed by `docId`.**
`baseRev` lives in IndexedDB in a store of its own, one small record per document, keyed by the
document's own id (`src/store.js`, `readSyncState()`, which carries the argument for that home and
for the two places it was refused). So a document restored from another device asks for a bookmark
under an id this device has never synced, and there is none. **"No bookmark" is a state the
comparison already had to handle**, and its answer is the conservative one:

```
no bookmark + a remote file exists  → conflict → keep both
```

Both copies survive, the teacher is told what happened and where the other one is, and the bookmark
written afterwards means it happens exactly once — the next sync of that document is an ordinary
one.

**Why not re-point `baseRev` to the remote's rev and upload, which is what the open question
guessed at.** Because the restored document and the Drive file are two different lineages that
happen to share an id, and `rev` counts saves *of a document* rather than ticks of a global clock:
the other device may have saved fifty times since the backup was taken, so a restored file at rev 12
can be genuinely older than a Drive file at rev 40 or genuinely newer than one at rev 8, and nothing
available on this device says which. Re-pointing and uploading is a guess that overwrites; keeping
both is not a guess at all. **A spare file in Drive is the price of being wrong in the safe
direction**, and this design has already decided which direction that is.

### Three cases the table above does not name, and why all three are `conflict`

The table is the whole of the ordering when there is a bookmark and a readable remote rev. The
implementation (`planFor()` in `src/drive-sync.js`) adds three arms, and the direction is the point:
**this device replaces its own gradebook only on proof that the remote is a later version of that
same document, and otherwise keeps both.**

| case | answer | why |
|---|---|---|
| no remote file at all | upload | nothing to compare with; the first sync creates the file |
| no bookmark, remote exists | conflict | the case above — two lineages, no ordering |
| remote's `rev` unreadable | conflict | a file whose place in the order is unknown; unknown is not "the beginning" |
| remote's `rev` *below* `baseRev` | conflict | another device overwrote the file with a document whose save count is lower — not a descendant of anything this device knows |

And one row of the table read honestly rather than literally: `remote.rev == baseRev` with the local
document also at `baseRev` is *nothing has changed anywhere*, which uploads nothing. Taken
literally, that row would send three megabytes to replace a file with its own contents on every tap.

### What two devices that both edited offline actually experience

Worth writing down because it takes three syncs to settle and the middle one looks alarming.
Laptop at rev 50 and iPad at rev 12 have both edited since their last sync.

1. **Laptop syncs.** Drive is at the laptop's own last upload, so `remote.rev == baseRev` and the
   laptop is ahead: ordinary upload. Drive now holds the laptop's document.
2. **iPad syncs.** Drive moved and so did the iPad: conflict. The iPad writes *the laptop's*
   document to `Planbook 2026-2027 (conflict from Windows PC 2026-11-14).json` and makes its own
   the live copy. Nothing is lost; two files exist; the iPad's teacher is told.
3. **Laptop syncs again.** Drive now holds rev 12 where the laptop's bookmark says 50 — the
   remote is *behind* the bookmark, which is the fourth row above: conflict again. The laptop
   preserves the iPad's document as a second conflict copy and re-uploads its own.
4. **iPad syncs again.** The iPad has nothing unsynced, and Drive is ahead of its bookmark:
   ordinary download. Both devices now hold the laptop's document, and both teachers' work is in
   Drive — one live, two in named conflict files.

**Two conflict files and no merge is the designed outcome, not a defect.** The thing to notice is
that the iPad's own edits leave its screen at step 4 without a message at that moment; what it was
told is at step 2, and the file named there is where its work is. That is the honest cost of whole
document last-writer-wins with a per-device `rev`, and it is bounded by the premise this whole model
rests on: **the teacher never edits two devices at once.** Do not fix it with a merge.

**A conflict is not resolvable by guessing.** Write the losing side to Drive as
`Planbook 2026-2027 (conflict from iPad 2026-11-14).json`, keep the winner active, and tell the
teacher plainly what happened and where the other copy is. Silent merge of two gradebooks is how
you lose a term of grades and never find out.

Finding the file: `drive.file` limits `files.list` to app-created files, so the app can list its
own and match on `appProperties.docId` — no folder picker, no stored file path.

## What sync is not

It isn't a backup. Drive holds one live copy that sync will happily overwrite with a newer one.
The downloadable JSON in [data-model.md](data-model.md) is the backup, and it stays mandatory
whether or not sync is on.

## Wanting it to be seamless — the conversation of 2026-09-07

**Nothing here is decided and none of it is a work order.** It is the shape of a conversation the
owner and a session had the day WO-7.2 landed, written down because the next person to want
invisible sync will re-derive the whole argument otherwise — and because two of the turns in it
are corrections that are easy to miss.

**The goal, in the owner's words: sync should be seamless, ideally invisible.**

**The ceiling is real and it is not a build problem.** *Invisible* taken literally means syncing
while the app is closed, and that is impossible here for the reason § Auth already gives: no
refresh token exists in a browser-only flow, so an unattended sync fails the moment the hour is up.
Getting past it needs a persisted bearer credential or a backend that refreshes one, and
[`CLAUDE.md`](../CLAUDE.md) refuses both — the first outlives the tab and survives a laptop handed
to a substitute, the second ends *no vendor server ever touches student data*. So the target worth
aiming at is **invisible while the app is open**, which is most of the felt benefit.

**Taken as a given: sync at natural moments while signed in.** App open, tab regains visibility, a
beat after the last save settles. No new scope, no new permission, and it behaves the same on both
devices. The one trap is ordering — it has to respect the `flush()` that `syncNow()` already does
first, or an auto-sync fires inside the 800ms debounce and uploads the document as it stood
*before* the grade that triggered it.

**The owner's second idea, and the line that runs through it: asking for authorization at launch.**
A version of this is fine and a version of it is fatal, and the difference is whether it **blocks**.

- **A blocking gate is refused twice over.** It breaks the standing rule that the app works fully
  signed-out forever — but the sharper objection is that this is a local-first offline app, so an
  auth step in the load path means **no wifi, no gradebook**. That is a strictly worse app in its
  core property, traded for a feature that is optional by design.
- **A non-blocking ask at launch fights nothing** — dismissible, skipped instantly when offline,
  the app renders either way.

**But a launch prompt does not buy invisibility, and this is the turn worth keeping.** The token
still lapses in an hour — `expires_in` is 3599 and `FRESH_MARGIN_MS` retires it a minute early, so
the usable window is ~59 minutes, and a reload or a close ends it outright. Prompt at 7:50 and the
panel reads disconnected by 9; one launch and a day of teaching puts the tap back in the middle of
the afternoon. **So the goal restated: not zero taps,
but taps at predictable, cheap moments.** A tap while setting up costs nothing. A tap discovered at
2pm because sync quietly stopped is the expensive one. That target is reachable without touching
the architecture, and it is better defined than *invisible*.

**The pragmatic shape, if it is built:** try `prompt: ''` silently on load and put up a
non-blocking reconnect affordance only when it fails. **Do not expect the silent half to carry the
iPad.** It renews off the teacher's own Google session rather than off anything we store, and iOS
blocks what that depends on — so the laptop mostly never sees the prompt and the tablet sees it
once a session. That is the device the whole feature exists for, so plan for the visible arm being
the normal one there rather than the fallback.

**Two things that do not improve with automation.**

- **A conflict can never be invisible.** Both sides moved, someone must choose, and merge logic is
  refused outright. The consolation is real though: syncing often *shrinks the windows*, so
  automation makes conflicts rarer — it helps the one case that most needs a human.
- **§ What sync is not gets harder to teach, not easier.** Silent sync earns trust, and damage
  propagates just as silently — delete a class, auto-sync, and Drive is wrong too. If sync becomes
  invisible, the backup habit wants reinforcing in the same change, not later.

**And keep it off the critical path.** Attendance is marked while students walk in; anything at
launch competes with that directly. Whatever this becomes belongs beside the home screen, never in
front of it.

None of this is reachable until [WO-7.3](../plans/work-orders/phase-7-sync.md) opens the flag on the
deployed origin, so there is time for the shape to settle.

### And if it becomes automatic, it needs a status on the glass

The owner's third turn, same conversation: **a flag or icon showing connected vs disconnected.**

**It is not a nice-to-have — rung 1 requires it**, and the reason is a sentence already in the
code. [`src/drive-sync.js`](../src/drive-sync.js) explains why a failed sync deliberately does not
redden the save chip: *"A failed sync reports in the Drive panel, which is where the teacher
tapped."* That reasoning is correct and it rests entirely on **there having been a tap**. Take the
tap away and she is not looking at the panel, so a lapsed token goes silent. Today there is a
transient `↻ Syncing…` chip during a transfer and nothing persistent at all.

**But connected/disconnected is probably the wrong axis.** It reports whether a token is alive,
which is the thing the teacher cares least about. Four states have consequences:

- signed out
- connected, up to date
- connected, **local ahead** — work on this device that is not in Drive
- connected, **last sync failed**

A binary flag collapses the middle two, and those are the two that matter. *Connected* with three
grades unsynced is true and useless.

**The green dot has a trap of its own.** A permanent *connected* indicator reads as **your
gradebook is safe in the cloud** — § What sync is not, rendered on the glass as a standing
reassurance instead of corrected in a panel she chose to open. Connected-and-never-synced would
light it up.

**So the shape to consider is freshness, not connection:** *Synced 2 min ago* · *3 changes not
synced* · *Sync stopped — reconnect*. Disconnected becomes the extreme case of stale rather than a
concept of its own, every state names what to do about it, and the indicator survives whatever is
later decided about how manual sync is — freshness is the invariant, connection is an
implementation detail.

**Where it does not go:** into the save chip. That chip has an ownership rule worth keeping —
`src/store.js` owns every state about this device's own storage and sync owns `syncing` — and a
persistent freshness reading is a third kind of thing, state rather than event. Nor onto the home
screen's critical path, for the reason the section above gives about attendance.

### What actually happens at the hour — checked 2026-09-07, and it corrects the block above

**Silent renewal is already built.** `ensureFreshToken()` calls `requestToken(true)` — `prompt: ''`
— whenever the token is stale, and renews with no UI at all if the teacher's Google session is
still live in that browser. An earlier draft of the section above implied the hour simply runs out
flat. It does not.

**But the screen retires the entry point before that path can be used.** `signedIn` is computed
from the clock, so at ~59 minutes the Sync button hides and Connect returns — which means the
silent arm is reachable only in a narrow window, and the flow a teacher actually meets is the
visible one. **Worth a decision rather than an inheritance:** trying the silent renewal *before*
drawing Connect is possibly the cheapest step toward seamless that exists, because the machinery
is already here.

**And the lapse itself is silent — deliberately, and coherently, for as long as sync is manual.**
Nothing watches the clock: the only `setTimeout` in [`src/auth.js`](../src/auth.js) guards a
request in flight, `refreshAuthChrome()` runs on flips and on the About modal opening and never on
a schedule, and no sync state is drawn anywhere outside that modal. Two things keep it honest. A
panel left open does not go wrong, because the expiry is written as a clock time and not a
countdown — *"ends at 2:47"* stays true after 2:47. And **the lapse is silent while the
consequence is loud**: tapping Sync on a lapsed token spends zero calls, leaves the document
untouched, and says so in a sentence.

That holds because the teacher only needs to know she is connected at the moment she acts, and at
that moment she is told. **It stops holding the day sync runs without a tap** — no tap, no loud
failure, no indicator, and an app that has quietly stopped syncing looks exactly like one that is
working. That is the hole the freshness reading above closes, which is why it belongs *with*
rung 1 rather than after it.

### The one thing in this conversation that is already a build — 2026-09-07

The owner's conclusion from the section above: **the indicator matters more than the automation,
and it should appear only IF the teacher opted into sync.** The conditional is right, and it has a
dependency that does not exist.

**Nothing about sync is persisted anywhere.** The token lives in memory by
[ruling](#what-wo-71-settled--2026-08-24), `signedIn` is computed from the clock, and no
`planbook_` key mentions Drive. So **after a reload the app cannot tell a teacher who syncs every
day from one who has never connected** — they are the same state. A conditional indicator has no
condition to read.

**What it wants is one preference key, and `PREF_DEFAULTS` is already its home.**
[`src/prefs.js`](../src/prefs.js) holds precisely this species of fact — when the install banner
was dismissed, which year this browser had open, when a backup was last started; *facts about this
browser's chrome, not about a student*. A boolean **this teacher uses Drive sync** sits beside them
without argument. **It is not a credential**: it records that she opted in, never anything she
could authenticate with, so the token-in-memory ruling is untouched and the `localStorage` rule
(UI preferences only, never student data) is satisfied on its own terms rather than by exception.

**One key, three things unlocked** — which is why it is worth doing before any of them:

1. **The indicator gets its condition.** Invisible to everyone who never opted in, which keeps the
   signed-out app exactly as clean as the standing rule requires.
2. **`lapsed, one tap away` becomes distinguishable from `never connected`.** Today these render
   identically and cost entirely different things to fix — the single most useful distinction the
   freshness reading could draw.
3. **A launch-time renewal attempt can target the people who want it**, instead of prompting
   everyone or nobody.

**Two things to decide if it is built.** What clears it — presumably *Disconnect*, or a teacher who
deliberately switches sync off keeps seeing an indicator about it. And whether opting in also means
*try to reconnect me at launch*, or whether those are two consents and not one.

**It is the cheapest item in this whole conversation and the only one that is a prerequisite rather
than a feature** — no architecture, no new permission, no new scope.

### A second Google account makes a latent hole reachable — found 2026-09-07

Raised by the owner while deciding whether to add the `@stjohnshigh.org` account as a second test
user on the OAuth client: *if I add it, it writes to its own Drive, right?* Yes — and the follow-on
is worth writing down before anyone does it.

**This app is account-blind by construction.** It requests no `openid`, no `profile` and no `email`
— [`src/auth.js`](../src/auth.js) argues that every scope costs — so it cannot know which account
is signed in. And the sync bookmark is four fields, `docId` · `year` · `baseRev` · `at`, with **no
record of whose Drive that `baseRev` was measured against.** Combined with `drive.file`, which only
ever sees files this app created *in the signed-in account*, two consequences follow.

**Two devices on two different accounts never find each other.** Each looks in its own Drive, finds
nothing, and does a `first-upload`. Two lineages, two files, no syncing — **and no error of any
kind.** To the teacher it reads as sync silently not working.

**Switching accounts on one device produces a spurious conflict later.** `planFor()` tests
`remoteRev === null` *before* it looks at `baseRev`, so a bookmark claiming rev 40 is ignored when
the new account's Drive is empty and the document uploads as if new. Sign back into the first
account and the revs no longer line up, so the pair goes to `conflict`. **Nothing is lost** — that
is keep-both doing exactly its job — but the teacher collects conflict copies across two Drives for
a reason no screen explains.

**The operating rule, until something changes: one Google account, used on every device.** Given
the argument in [`FERPA.md`](FERPA.md) that the accounts involved are ones the teacher *and often
the district* already control, that account should be the school Workspace one wherever real
student data is in play — a personal consumer account is outside the tenant that argument relies
on. Adding a second account as a *test user* to learn whether a Workspace admin blocks unverified
apps is a different act and is safe: sign in, read the answer, disconnect **without syncing**.

**What is worth booking.** `baseRev > 0` together with `remoteRev === null` is a suspicious pair:
it says *this device has a bookmark claiming a sync that this Drive has no file for.* It has
exactly two causes — the account changed, or the file was deleted out of Drive — and neither is
obviously a **first** upload. Today it becomes one silently. **This is not a WO-7.2 defect**: that
work order scoped one account, and with one account the state is unreachable. A second test user is
what makes it reachable, which is why it is written here rather than filed against the build.
