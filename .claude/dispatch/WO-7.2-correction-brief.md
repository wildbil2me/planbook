# WO-7.2 — correction round 1

The work order is `plans/work-orders/phase-7-sync.md` line 194. The original brief is
`.claude/dispatch/WO-7.2-brief.md` and still governs — **read it, nothing in it is withdrawn.**
The row reads `🔍 AWAITING VERDICT` and stays there through this round.

A first-pass verifier read the delivered tree cold and returned **FAIL** on four defects. It also
re-ran every harness itself: verify-shell **1331/1331 EXIT=0**, sweep **41·38·0·3**, `--audit`
**PASS**, `grep -rn MUTATION` clean, and the NUL-byte repair at `tools/verify/drive-sync.mjs:713`
confirmed non-vacuous. **The state machine in `src/drive-sync.js` passed** — no merge anywhere,
correct preserve-then-overwrite ordering, `drive.file` still the only scope, one `indexedDB.open()`
in the repository, `sw.js` `CACHE` bumped to v112 with `./src/drive-sync.js` in `SHELL`. Acceptance
lines 3, 4, 5 and 6 are ✅ and every desk tick was substantiated.

**Do not touch the state machine, the conflict path, or the scope.** The defects are all in the
wiring that puts it on a teacher's screen, plus two wrong lines in `TESTING.md`.

---

## The verifier's ❌ lines, verbatim

> ### ❌ DEFECT-1 — Connecting never reveals the Sync button. The feature is unreachable in the modal session that signs in.
>
> `src/shell.js:1821`
> ```js
> if (e.target.closest('[data-drive-connect]')) { auth.connect(); return; }
> ```
> `auth.connect()` ends at `src/auth.js:471` with `refreshAuthChrome()`, and `refreshAuthChrome()` (`src/auth.js:556-591`) touches exactly four elements: `#drivePanel`, `#driveStatus`, `#driveConnectBtn`, `#driveDisconnectBtn`. It **never** touches `#driveSyncBtn` or `#driveSyncStatus` — those belong to `refreshSyncChrome()` in `src/drive-sync.js:772`, whose only callers are the About-modal-open branch at `src/shell.js:1779-1780` and `syncNow()`'s own `finally`.
>
> `index.html:2089` ships the button with `class="… hidden"`. So the real sequence is: open About → button hidden (correct, signed out) → tap **Connect** → status line changes to *"Connected to Google Drive…"*, **Disconnect** appears — **and "Sync this year now" is still not on the screen.** The teacher must close and reopen About before the feature she just enabled exists.
>
> **This is the static precondition, and it is why Acceptance 1 and 2 are ❌ rather than 🙋.** No iPad reading is needed to know the two-device procedure cannot be run as written.

> ### ❌ DEFECT-2 — Disconnecting leaves the Sync button and the last-synced line on screen.
>
> `src/shell.js:1822` — `auth.disconnect()`, same omission in the other direction. After a tap, the panel reads *"Not connected. Planbook works exactly the same either way."* directly above a live **Sync this year now** button and a line saying *"This school year last synced on …"*. The tap is fail-safe (`syncNow()` reaches `ensureFreshToken()` at `src/drive-sync.js:527`, gets null, settles `signed-out`, makes no request) — so no data is at risk. The panel is simply lying about its own state.

> ### ❌ DEFECT-3 — The two-device procedure predicts `download` where the code produces `conflict`, and Acceptance 1 cannot be demonstrated by following it.
>
> `TESTING.md:9570-9573`
> > restore A's backup file into B first … Then sync B: it should **download** and B should show A's classes and grades.
>
> Traced against the delivered code: `restoreDocument()` (`src/store.js:716`) preserves `incoming.docId` and sets `rev = max(existing, incoming) + 1`, so B holds A's `docId` at rev N+1. B's `sync` object store is empty, so `readSyncState(docId)` returns `null` and `baseRev` is `null`. `planFor()` at `src/drive-sync.js:245`:
> ```js
> if (baseRev === null || baseRev === undefined) return 'conflict';
> ```
> **B gets a conflict, not a download** — which is the designed answer, stated three times in the tree (`src/drive-sync.js:225-230`, `docs/sync.md` § *What a restore from a different device does*, and the new "no bookmark, remote exists → conflict" table row). `TESTING.md` is the only document that disagrees with all of them.
>
> It is worse than a wrong prediction. Following the procedure, step 3 (Acceptance 1) then lands A and B on **the same `rev` in two lineages**, and B's second sync reports `in-sync` while holding none of A's change — so the teacher would record Acceptance 1 as failed against working code. The correct bootstrap is one extra settling pass, and `docs/sync.md`'s own four-step walkthrough already describes it: restore into B → sync B (**conflict**, one spare file) → sync A (**download**) → *then* run Acceptance 1.

> ### ❌ DEFECT-4 — `TESTING.md:9597-9598` says a control will be absent that DEFECT-2 leaves present.
>
> > Sync, then sign out, then tap Sync — the button is not on the screen, which is the answer.
>
> It is on the screen. Consequence of DEFECT-2; listed separately because it is the line an owner would read as a failed check.

### And the two smaller findings, also to fix

> - `src/auth.js:514` — *"A fresh token for a caller that needs one now — WO-7.2's door, and it has no caller in this build."* False as of this landing: `src/drive-sync.js:527` calls it. `src/auth.js` is untouched in the diff; `src/save-indicator.js` got the equivalent correction and this one was missed.
> - `TESTING.md:9582-9589` leaves **all six** WO-7.2 boxes `[ ]` while `plans/work-orders/phase-7-sync.md` ticks four. WO-7.1's section ticks its desk-provable lines with evidence parens; this one does not. Two records of the same acceptance list disagreeing is the shape `--audit` cannot see.

---

## What to do, and the judgement in it

1. **DEFECT-1 and DEFECT-2.** Make the two panel painters agree about the panel. `auth.connect()` is
   async — handle its shape rather than firing and forgetting. The decision to make out loud, at the
   point you make it: whether `refreshSyncChrome()` gets called from `src/shell.js`'s two handlers,
   or whether `src/auth.js` gains a notification the sync module subscribes to. **`src/auth.js` must
   not import `src/drive-sync.js`** — the one-way dependency is one of the five decisions this work
   order settled and the verifier confirmed it holds. Whichever you pick, say why in a comment where
   a future reader will hit it.

2. **The check that would have caught it.** `tools/verify/drive-sync.mjs:859-861` closes and reopens
   the About modal immediately before the only check that asserts the Sync button is visible:
   ```js
   await shutModals();
   await clickSel('[data-modal-open="aboutModal"]');
   ```
   That is the one path which paints the button, and it is not the path a teacher takes. **Add a
   check that connects and asserts the button appears with the modal never closed**, and a mirror for
   disconnect. Do not delete the existing reopen check — it asserts something real about a returning
   session. Consider whether the seeded-session seam is hiding the same shape elsewhere.

3. **DEFECT-3 and DEFECT-4.** Rewrite `TESTING.md` § WO-7.2's procedure to the corrected bootstrap
   the verifier names (restore into B → sync B, **conflict**, one spare file → sync A, **download** →
   then Acceptance 1), and fix the sign-out line to say what the repaired code does. Make the six
   boxes agree with the phase file: tick the four desk-provable ones with evidence parens in WO-7.1's
   style, leave the two 👤 lines open. **Tick no 👤 line.**

4. **`src/auth.js:514`** — correct the comment; it now has a caller.

5. **Mutation round, and one plant is specifically owed.** The verifier's judgement:
   > **the seven mutations do not aim at Acceptance line 2's central claim.** Nothing mutated preserve-then-overwrite (swap `:702` and `:709`) or skipped the conflict copy entirely. The check at `:690` looks non-vacuous by inspection, but the Traps line — the one thing this work order most needs to be true — was not proved by mutation. One more plant is owed.

   Plant it, prove the check reddens, **take it out, and re-run.** Mutation-prove your new
   connect/disconnect checks the same way. **One mutation per run, and revert it before you write
   anything else** — `AGENTS.md` § "If you were dispatched with a work order". Four dead dispatches
   in this repository have left live mutations under already-ticked boxes.

## Three findings the verifier explicitly did NOT block on — book, do not build

Report these in your result file as proposed follow-ups. **Do not widen the work order into them.**
The bookmark is read once and never re-read from IndexedDB, so a `writeSyncState()` that failed
after the first sync would leave every check green; no check ever puts two bookmarks in the `sync`
store and asks for one by `docId`; and the conflict filename's date is matched by
`/\d{4}-\d{2}-\d{2}/` and never by value, so `todayLocal()`'s whole reason for existing
(`src/drive-sync.js:120` — local calendar fields, because UTC is tomorrow from ~7pm Eastern) is
untested, and `verify-shell.mjs --today=` makes it cheap.

## Before you return

Run and quote the exit codes: `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs`, plus
`node tools/wo-gate.mjs --audit`. Then `grep -rn MUTATION` over everything you touched. Write your
report to `.claude/dispatch/WO-7.2-correction-result.md` as your last act, **against the four ❌
lines by number**, saying for each what you changed and what proves it. The tree is staged and
uncommitted; leave it that way. Commit nothing. Tick nothing in the phase file beyond what is
already ticked.
