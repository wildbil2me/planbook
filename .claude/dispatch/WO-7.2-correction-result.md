# WO-7.2 — correction round 1 · result

**Implementer** Claude (work-order-implementer), 2026-09-07.
**Brief** `.claude/dispatch/WO-7.2-correction-brief.md`, over `.claude/dispatch/WO-7.2-brief.md`,
which I read in full first and treated as still governing.
**Tree** staged and uncommitted, as I found it. **Nothing committed, nothing pushed.**
**No 👤 line ticked.** No mutation left in the tree.

## The commands, and what they printed

Every figure below is from output I read, not from a prediction. `verify-shell.mjs` takes ~7.5
minutes on this machine, not the ~160s the brief's parent instructions assume; **six** full runs were
made and each was waited out to its own `EXIT=` line before anything was written about it.

| Run | Tree | Result |
|---|---|---|
| 1 (baseline) | as delivered | `1331 checks · 1331 passed · 0 failed · 0 skipped`, 41,286 lines, 437s, **exit 0** |
| 2 | after the repair | `1334 checks · 1334 passed · 0 failed · 0 skipped`, 41,328 lines, 436s, **exit 0** |
| 3 | MUTATION 1 | `1334 checks · 1333 passed · 1 failed`, 449s, **exit 1** |
| 4 | MUTATION 2 | `1334 checks · 1332 passed · 2 failed`, 454s, **exit 1** |
| 5 | MUTATION 3 | `1334 checks · 1331 passed · 3 failed`, 453s, **exit 1** |
| 6 (final) | the tree as it stands now | `1334 checks · 1334 passed · 0 failed · 0 skipped`, 41,335 lines, 31.0 lines per check, 451s, **exit 0** |

Run 6 exists because runs 2–5 predate a comment I added to the harness afterwards: the quoted final
figure is the tree as it actually stands, not the tree it stood at when the checks were written.

- `node tools/wo-sweep.mjs` — `41 checks · 38 passed · 0 failed · 3 to review`, **exit 0**. The
  three to review are the same three the delivered tree carried (sensitive field names outside
  `src/backup.js`, due-date beside late/missing, the two mockup banners); none of them moved.
- `node tools/wo-gate.mjs --audit` — **PASS**, exit 0. `overall row 65/81`, every dashboard row
  matching its own boxes, every `Owes` pointer landing.
- `grep -rn MUTATION` over `src/` and `tools/verify/drive-sync.mjs` after every revert and again at
  the end: the only hit anywhere in `src/` is `src/shell.js:852`, *"A CLASS MUTATION ADDED LATER
  ADDS ITS LINE HERE"*, which is pre-existing prose and not a plant.

---

## ❌ DEFECT-1 — Connecting never reveals the Sync button

**Fixed.** `src/shell.js`.

The decision the brief asked me to make out loud: **the repaint is chained from `src/shell.js`'s two
handlers, not from a notification `src/auth.js` publishes.** Three reasons, and they are written at
the point a future reader hits them (the new `afterDriveAuthChange()` block and the rewritten comment
over the two handlers):

1. `src/auth.js` cannot call `refreshSyncChrome()` without importing `src/drive-sync.js`, which
   reverses the one-way dependency that module's fourth decision rests on. That is not a soft
   convention here — `tools/verify/drive-sign-in.mjs` asserts `src/auth.js` imports
   `./live-region.js` **and nothing else**, so the wrong answer turns the harness red one section
   before mine.
2. A subscriber list inside `src/auth.js` keeps the import pointing the right way, and it was
   refused for what it costs: a general-purpose notification bus in the file whose whole claim is
   that it reaches nothing, for two call sites that live in one function.
3. `src/shell.js`'s one delegated listener already carries every other cross-module consequence in
   the app — the year switch, the restore, the categories, the bands, the thresholds. The comment
   that stood over these two handlers *predicted this exact line* ("the day one does, it is WO-7.2
   that adds the line, exactly as the categories, the bands and the thresholds each added theirs").
   The delivered build left the prediction and omitted the line.

`connect()` is async, so the chain is on **the far end of the promise and on both of its arms** —
`auth.connect().then(afterDriveAuthChange, afterDriveAuthChange)`. Both arms because a refusal
repaints too: a failed connect does not clear an existing session, so the panel has to describe what
it finds. A repaint fired on the line *after* the call would paint the state the tap started in,
which is the defect wearing a fix, and the static check below asserts against exactly that shape.

`afterDriveAuthChange()` is `refreshSyncChrome()` then `primeSyncChrome()` — the About-open path's
pair, in its order and for its reason (one is synchronous and settles whether the control exists;
the other reads the bookmark out of IndexedDB and fills in a footnote, and is not awaited).

**Verified** by two new checks (below) and by run 6's `PASS` on both, plus MUTATION 2.

## ❌ DEFECT-2 — Disconnecting leaves the Sync button and the last-synced line on screen

**Fixed**, same helper. `auth.disconnect()` is synchronous and has already dropped the session by
the time it returns, so the repaint is the next statement rather than a `.then`.

Driven proof, run 6, with the modal never closed:
`before the tap: Sync shown = true … after: Sync shown = false, line = "", Connect shown = true,
About still open = true`.

## ❌ DEFECT-3 — the two-device procedure predicted `download` where the code produces `conflict`

**Fixed.** `TESTING.md` § WO-7.2. The procedure is now five steps, and the corrected bootstrap is the
one `docs/sync.md` already describes: restore into B → **sync B, which is a conflict and says so** →
sync A, which downloads → *then* Acceptance 1 (now step 4) and Acceptance 2 (now step 5).

I traced it against the code rather than transcribing the verifier's summary, and two things came out
of that trace that the brief did not name and that the step now says:

- **Why it is a conflict is stated, not just that it is.** B holds A's `docId` at a rev of its own
  with no bookmark, because `restoreDocument()` preserves `incoming.docId` and **nothing but
  `src/drive-sync.js` ever writes the `sync` store** (`grep -rn writeSyncState src/` → three call
  sites, all in that module). That is `docs/sync.md`'s *no bookmark, remote exists* row. A step that
  only said "expect a conflict" would be a step a teacher reads as a defect she should report.
- **The bootstrap leaves a spare file, and it has to be deleted before step 5.** Both conflict copies
  are named for the losing side's device on the day they are made, so the bootstrap's copy and
  Acceptance 2's copy carry **the same filename**, and step 5's "Open Drive: two files" cannot be
  read past it. The step says to delete it, says what it is (A's Drive copy as it stood before B was
  restored), and says to read it first if A was edited between the backup and the sync — because in
  that one case it is that edit's only copy, which is the design working rather than a wrinkle.

## ❌ DEFECT-4 — `TESTING.md` says a control will be absent that DEFECT-2 left present

**Fixed**, and it changes direction rather than wording: with DEFECT-2 repaired, "then tap Sync" is
an instruction for a button that is correctly no longer there. The paragraph now says to tap
**Disconnect** and watch the panel *without closing About* — the Sync button and its line leave in
the same tap, there is nothing left to tap, and tapping **Connect** again brings the button back in
the same modal session. It names the driven checks and says what the first build did, so a reader
who meets an old build knows what they are looking at. The token-expiry half of the paragraph is
unchanged.

## The two smaller findings

- **`src/auth.js:514`** — corrected. The comment said `ensureFreshToken()` "has no caller in this
  build" and named the save indicator's `syncing` state as the same shape; both stopped being true
  in the same landing. It now says who calls it (`src/drive-sync.js`, once per tap of Sync, before
  anything is read or written), that it is still the only caller, and that the dependency points one
  way. `src/auth.js` is otherwise untouched.
- **`TESTING.md`'s six boxes** — the four desk-provable ones are now ticked with evidence parens in
  WO-7.1's style, and they agree with `plans/work-orders/phase-7-sync.md`. The two 👤 lines are left
  open and now carry a note saying what is driven at the desk and what is not, mirroring the phase
  file. A lead-in above the list says the phase file holds the long form and the mutation record, so
  the two records point at each other instead of drifting into two accounts.
  **I ticked no 👤 line, and the evidence in each paren is a check I read in the harness source and
  watched pass in run 6** — I deliberately did not restate the delivered mutation counts there,
  because I did not re-run those seven mutations and a third copy of a claim is a third thing to keep
  in step.

## The check that would have caught it

Three new `check()` sites, one of which is a failure arm that never fires on a green run.

- **Static, in the Node half of `tools/verify/drive-sync.mjs`**: both branches in `src/shell.js` that
  flip a sign-in chain `afterDriveAuthChange()`, the connect one on **both arms of the promise**, and
  the helper calls both painters. Over `codeOnly()` output, for § 20's reason. This one cannot be
  skipped and does not need a browser.
- **Driven, at the foot of the section**: one tap of **Disconnect** with the modal never closed, then
  one tap of **Connect** with the modal never closed. The existing reopen check is untouched — it
  asserts something real about a returning session, as the brief says.

Two things about the connect check that are judgement calls, both written at the check:

1. **The token goes in through `src/auth.js`'s seam and the tap is a real tap.** A headless browser
   cannot complete a Google handshake, so `connect()` fails here whatever the machine can reach — but
   a failed connect does not clear a session, so the seeded one is still standing when it settles,
   and what is asserted is the only thing the pair is about: that the tap ran the chain. **The step
   before it is what makes it non-vacuous** — the token is seeded with the modal already open and the
   button is read as *still hidden*, because `acceptTokenResponse()` paints nothing. Nothing but the
   tap can be what reveals it.
2. **It is bounded at six seconds and skips rather than going red if it runs out**, for trap 8's
   reason: this machine does reach `accounts.google.com` (the sign-in section's own detail line reads
   `GIS <script> tags now = 1`), so on some runs the real library is answering on its own schedule and
   `src/auth.js` waits 25 seconds for a silent attempt. **It did not skip on any run here** — the
   button appeared 619ms after the tap on run 2 and the check passed on runs 2 and 6 — but a skip is
   announced and listed, and the static half cannot be skipped either way.

**On "consider whether the seeded-session seam is hiding the same shape elsewhere":** I looked. The
sync half of the panel is now repainted on all three paths that can change it — the modal opening,
either auth control, and `syncNow()`'s own `finally` — and the auth half was always repainted by
`src/auth.js` itself. The one repaint nobody makes is after a **year switch**, since `syncState()`
reads `store.getDoc()`; I could not find a way to switch years with About open, so I have booked it
below rather than built it.

## The mutation round

**One mutation per run, each reverted by name (`git checkout -- <file>`, against a fully staged tree)
before anything else was written.** My own edits were staged first, so a checkout could not eat them.

**MUTATION 1 — the one the verifier said was owed: preserve-then-overwrite, swapped.** The
`createFile()` of the conflict copy moved below the `updateFile()` of the live file in `keepBoth()`.
`1334 checks · 1333 passed · 1 failed`, exit 1, and the one that reddens is the ordering check, with
its detail line naming the order: `["GET api:list","GET api:read","PATCH upload","POST upload"]`.
**What makes it the right mutation is what stays green under it**: both files still exist, the
conflict copy still holds the remote bytes, the live file still holds this device's, the message is
still correct — keep-both is intact and *only the order* is destroyed, which is the whole of the
guarantee and the only thing that check is for.

**MUTATION 2 — the Connect branch put back exactly as delivered** (`auth.connect(); return;`).
`1332 passed · 2 failed`, exit 1: the static check, naming which branch (`connect chains it on both
arms of the promise = false`), and the driven one taking its **failure** arm rather than its skip arm
— *"the tap settled — authState().busy is false — and the Sync button is still not on the screen
6099ms later: Sync shown = false, signedIn = true, About open = true"*. That is DEFECT-1 reproduced
and named by the harness.

**MUTATION 3 — the Disconnect branch put back as delivered.** `1331 passed · 3 failed`, exit 1: the
static check, the driven disconnect check (whose detail line is DEFECT-2 verbatim — *"after: Sync
shown = true, line = 'Your Google sign-in has run out … The last sync that worked was on 9/7/2026 at
2:11 PM.', Connect shown = true"*), **and the connect check, which is the interesting one**. The two
driven checks are chained — the second starts from the state the first tap left — so a build that
breaks only the sign-out repaint turns both red, the second on its own non-vacuity clause because the
button it needs to see hidden is still on the screen. It fails loudly rather than passing quietly,
which is the right failure, but a future red run should not be chased twice: I added a paragraph at
the checks saying so. Decoupling them would mean closing and reopening the modal between the two,
which is the one thing neither check is allowed to do.

## Bookkeeping the sweep enforces

`tools/wo-sweep.mjs` went red on the recorded `check()` call-site count the moment I added checks
(1320 → 1324). Both halves are updated from runs rather than by arithmetic: the count line at
`tools/README.md:1174`, and a **new entry in that file's count log** carrying the before figure, the
after figure and all three mutation runs. WO-7.2 itself moved the count 1288 → 1320 and left no
entry, so the new one is its entry as well as the correction's — that omission is the shape the log
exists to prevent and it was one paragraph, not a work order, to repair.

## What I did not do, and why

- **`sw.js` `CACHE` is still `v112`.** The rule is a bump for any change to a `SHELL` file and this
  round changed two (`src/shell.js`, `src/auth.js`) — but v112 has never been deployed, so no device
  has the build these files are inside. Bumping again would retire a version number nothing ever
  served. **If this is committed and deployed in a separate push from the rest of WO-7.2, that
  reasoning stops holding and it needs v113.**
- **`plans/work-orders/phase-7-sync.md` is untouched.** The brief says to tick nothing there beyond
  what is already ticked, and nothing in its Acceptance list moved. Its status stays
  `🔍 AWAITING VERDICT`.
- **No `CHANGELOG.md` entry.** A draft, for the teacher to accept, reword or bin: *"Connecting or
  disconnecting Google Drive now updates the whole Drive panel in the same tap — the Sync button
  appears when you connect and leaves when you disconnect, without closing and reopening About."*
- **The three findings the verifier booked but did not block on** are still unbuilt, as instructed:
  the bookmark is read once and never re-read from IndexedDB; no check puts two bookmarks in the
  `sync` store and asks for one by `docId`; and the conflict filename's date is matched by shape and
  never by value, so `todayLocal()`'s whole reason for existing is untested and
  `verify-shell.mjs --today=` would make it cheap.

## Proposed follow-ups (booked, not built)

1. **The stale sync outcome survives a sign-out and a reconnect inside one modal session.** After a
   sync that failed with *"Your Google sign-in has run out … Tap Connect Google Drive above, then
   sync again"*, tapping Connect now repaints the sync line — with that same sentence, because
   `outcome` is module state and nothing clears it. It is a true sentence about a sync that really
   did fail, and it reads as an instruction she has just followed. **This is pre-existing, not
   introduced**: before the repair the modal-reopen path drew the same stale outcome. I left it alone
   because clearing `outcome` inside `refreshSyncChrome()` would also blank the one place a
   *lapsed-token* failure is written, and that trade is a ruling rather than a tidy-up.
2. **Nothing repaints the Drive panel after a year switch.** `syncState()` reads `store.getDoc()`, so
   a year change under an open About modal would leave the last-synced line describing the previous
   year. I could not reach that state by hand and did not widen the work order to chase it.
3. **`TESTING.md` § WO-7.1 still says `https://localhost:8443` is "the OAuth client's only authorized
   JavaScript origin"**, two sentences before saying the client's list already carries the deployed
   one. That is the same false claim `0f77a37` swept out of eight files and `CLAUDE.md` records as
   the ninth place; this is a tenth. Out of scope here — it is WO-7.1's paragraph, not WO-7.2's — and
   worth its own row.
4. **`src/auth.js` ~line 68's "the client's ONLY authorized JavaScript origin"** is the same claim,
   already booked by the original brief's trap 4 and still deliberately unfixed.

## Files changed this round

- `src/shell.js` — `afterDriveAuthChange()` added beside the other `after*` chains; the two Drive
  control branches rewritten to use it; the comment over them rewritten.
- `src/auth.js` — the `ensureFreshToken()` header comment corrected. No code change.
- `tools/verify/drive-sync.mjs` — `aboutOpen` and `authBusy` added to the `READ` round trip; one
  static check; two driven checks with a bounded skip arm; the block comment for both.
- `TESTING.md` — the two-device procedure rewritten to the corrected bootstrap; the sign-out
  paragraph rewritten; the six boxes brought into line with the phase file.
- `tools/README.md` — the recorded call-site count 1320 → 1324, and a new count-log entry with the
  runs and the three mutations.

Everything is **staged and uncommitted**. The one file I did not stage is
`.claude/dispatch/WO-7.2-status.md`, whose unstaged delta predates this dispatch and is not mine.

## What I could not verify

- **Nothing on an iPad, and no 👤 line.** The two-device procedure needs two browser profiles and a
  real Google account; I have neither. Acceptance 1 and 2 stay open. The iPad has nothing new to show
  anyway while `hostAllowsSignIn()` is shut — that is WO-7.3.
- **The corrected bootstrap is traced, not run.** I followed it through `restoreDocument()`,
  `readSyncState()`, `planFor()`, `keepBoth()` and `bringDown()` against the code and against
  `docs/sync.md`'s own walkthrough, and the harness proves every one of those transitions
  individually against a stand-in Drive. **No run of any kind has executed the five steps in order
  across two IndexedDBs.** If the owner finds step 3 behaving differently, that is the first place to
  look and the prose is mine.
- **I did not re-run WO-7.2's original seven mutations.** The verifier reviewed them; I added the
  eighth it said was owed and two of my own. The evidence parens I wrote into `TESTING.md` cite
  checks I watched pass, never mutation results I did not take.
