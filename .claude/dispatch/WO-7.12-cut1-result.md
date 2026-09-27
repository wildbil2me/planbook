# WO-7.12 — result

**Stopped and reported on the brief's "if it is the app" branch. No fix landed.** `tools/` and `src/`
read exactly as `HEAD` (`git diff --stat HEAD -- tools src` is empty). Every diagnostic mutation was
reverted with `git checkout -- tools/verify/drive-sync.mjs` before this file was written. No
Acceptance box ticked, `TESTING.md` untouched, `CHANGELOG.md` untouched. The row still reads
`🤖 CLAIMED`. Whether to `--release` it or re-cut it is the orchestrator's call.

## The cause, in two layers

**Layer 1: the trigger is in the harness. The WO-7.11 implementer's hypothesis is confirmed.**
`verify/drive-sign-in.mjs` ends on a real Connect tap. Its `connect()` is still waiting on Google's
live library when `auth.disconnect()` runs at that section's foot. `disconnect()` clears `busy` and
the session. It does not clear `pending`, and it does not stop `connect()`. So the request is still
in flight when `drive-sync` starts. That section's trace reads `gis=false` at its first line in all
three instrumented runs: Google's script was still loading. Later the library loads and
`requestAccessToken()` fails with `popup_failed_to_open`, because a headless browser blocks a window
opened with no gesture behind it. Then `connect()` runs its closing `refreshAuthChrome()` against
whatever state `drive-sync` has seeded. That state is nearly always a signed-in token, so the paint
hides Connect.

**Layer 2: the reason that paint can turn the check red is in `src/`.** The check at `drive-sync.mjs`
~906 asserts *"the Connect button back on the screen"* after a lapsed-token sync. **Nothing in the
app puts it back.** `syncNow()` settling `signed-out` repaints only the sync half of the panel
(`refreshSyncChrome()`). Nothing repaints the auth half: Connect, Disconnect and the status line.
The comment at `src/drive-sync.js:541-544` says otherwise:

> the Connect button is back on screen because authState() computes `signedIn` from the clock.

That is false. `signedIn` is computed from the clock, but Connect's `hidden` class is written only by
`refreshAuthChrome()`, and nothing in the sync path calls it. So when the check is green, Connect is
still showing from the paint made by `auth.disconnect()` at ~line 566. That paint happened about
340 lines earlier and has nothing to do with the lapse. When the leftover `connect()` settles inside
that window, the most recent paint hides Connect, and the check goes red. **The check is not
unsteady. It is reading a stale paint, and the race decides which stale paint it gets.**

**A teacher can reach this.** She opens About while signed in, the token lapses while the modal is
open (on the iPad a resume does not reload the page, so the modal stays open), and she taps *Sync
this year now*. Afterwards the panel has **no Connect button, no Sync button, and an empty sync
line**, and the status line still says *"Connected to Google Drive. This access ends at …"*. The
only place the sentence *"Your Google sign-in has run out … Tap Connect Google Drive above"* appears
is the live region, and it points at a button that is not drawn. That is the silent failure the check
exists to rule out, and it is **a repaint the panel owes and does not make**, which is the brief's
stop condition.

## The runs that show it

All logs are in the session scratchpad
(`C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\224ce31e-23d4-4c82-9cb3-112203fb48e5\scratchpad\`).
That folder is not durable, so the lines that matter are quoted here. The diagnostic diff, now
reverted, is `wo712-diagnostic.diff` in the same folder.

**Baseline, unmodified `HEAD` (`0a76439` plus the claim edit to the phase file), run twice before
any change:**
- `base1.log`: `1550 checks · 1549 passed · 1 failed · 0 skipped`, `EXIT=1`. The one failure is this
  check: `Connect shown = false, Sync shown = false`, `outcome = signed-out, calls = 0`.
- `base2.log`: `1550 checks · 1549 passed · 1 failed · 0 skipped`, `EXIT=1`. Same check, same
  reading.
- In `base1.log`, drive-sign-in's own Connect-tap check reads the line going to
  `"Waiting for Google…"` and 1 request to `https://accounts.google.com/gsi/client`. The foot check
  then reads `busy:false` after `disconnect()`, which is layer 1's "busy cleared, request not".

**Trace (MUTATION 1).** A MutationObserver on `#driveConnectBtn`'s attributes and `#driveStatus`'s
text, installed at the head of `drive-sync` right after its own `disconnect()`. It also logs a mark
at every `SEED`, and it is dumped just after the lapsed sync.
- `trace1.log`: `1550 · 1550 passed · 0 failed`, `EXIT=0`. No auth paint after `t=585` (the
  `disconnect()`). Green, and green for the stale reason.
- `trace2.log`: `1550 · 1549 passed · 1 failed`, `EXIT=1`, **caught**:
  ```
  t=566  connect-attr  hidden:false signedIn:false  "Not connected. …"            <- drive-sync's disconnect()
  t=570  seed wo72-synthetic-token-1                                               <- token seeded, no paint
  t=999  connect-attr  hidden:true  signedIn:true   "The browser blocked the Google sign-in window…"
  t=1254 seed-lapsing  hidden:true                                                 <- check reads Connect hidden
  ```
  Nothing in `drive-sync` taps Connect before the check. `t=999` is `connect()`'s closing paint from
  drive-sign-in's last tap: `lastError` is `describe('popup_failed_to_open')`, painted over a seeded
  session.

**Red on demand, and the teacher's path (MUTATIONS 2 and 3), `probe1.log`:**
`1550 · 1549 passed · 1 failed`, `EXIT=1`.
- *Widening:* a single `window.planbook.auth.refreshAuthChrome()` right after the
  `wo72-synthetic-token` seed turns the check red deterministically. That shows that any auth paint
  in the seeded window is enough, so the green depends on no paint arriving. (In the same run the
  natural late paint landed as well, at `t=817`: `"The browser blocked the Google sign-in window…"`.)
- *Probe:* About open, a 3599s token painted, then a 10s token seeded, then a **real tap on
  `[data-drive-sync]`** through the delegated listener:
  ```
  WO712PROBE {"openedAbout":true,"before":{"connect":false,"sync":true},
    "after":{"aboutOpen":true,"signedIn":false,"connect":false,"sync":false,"calls":0,
      "syncLine":"","authStatus":"Connected to Google Drive. This access ends at 11:41 AM, and closing
      Planbook ends it sooner — Planbook keeps no sign-in on this device."}}
  ```
  Signed out, no request made, and the modal still open over a panel with no control and a status
  line that says the reverse of the truth.

Tally for this check across the sitting: red in 3 of the 4 runs whose outcome was left to chance
(`base1`, `base2`, `trace2`; `trace1` green). The fifth run, `probe1`, was forced red, and the natural
paint fired in it as well. That matches WO-1.56's "more often than not".

## Why I did not land the harness fix

The Deliverable's harness fix is still right in itself: the drive-sign-in section should hand the
page on with nothing in flight. It would make this check steady green. **But it would be green on the
line-566 paint, over the defect above.** Right now the flake is the only thing in the repository that
shows the missing repaint, so landing only the harness half would hide the one symptom the defect has.
The brief says *stop and report*, and I read that literally.

## Proposed work orders (not booked)

1. **`src/` — a `signed-out` sync repaints the auth half of the Drive panel.** Small. `src/drive-sync.js`
   already imports from `src/auth.js` (`signInAvailable, authState, ensureFreshToken`), so importing
   `refreshAuthChrome` too keeps the dependency pointing the way `auth.js`'s "imports
   `src/live-region.js` and nothing else" requires. **Put the repaint in `syncNow()` (its `finally`, or
   on the `signed-out` arm), not in `src/shell.js`'s `[data-drive-sync]` chain.** Two reasons. The
   harness check calls `driveSync.syncNow()` directly, not through the tap, so a fix in the chain
   leaves the check reading a stale paint. And every caller should get the fix, not only one door.
   Correct the false comment at `src/drive-sync.js:541-544` in the same pass. Its acceptance should
   include the About-open probe above as a real harness check: About held open across a lapse and a
   Sync tap, asserting Connect shown and the status line no longer reading *Connected*. That check
   would have caught this the day WO-7.2 landed. Bump `CACHE` in `sw.js` (`src/drive-sync.js` is in
   `SHELL`).
   *A question for the owner, not for the build:* in the same state, `refreshSyncChrome()` blanks the
   sync line whenever `!on`, so the *"Tap Connect Google Drive above, then sync again"* sentence is
   never drawn and is only announced. The owner should decide whether that sentence belongs on the
   glass.
2. **WO-7.12 as written, after (1).** A named-condition wait at drive-sign-in's foot. **One trap for
   whoever builds it:** after `disconnect()`, `authState().busy` is **not** a signal that nothing is in
   flight, because `disconnect()` sets `busy = false` and leaves `pending` standing. So the wait has
   to go **before** the foot's `auth.disconnect()`: poll `authState().busy === false`, bounded, and
   announce a skip if the bound runs out (Google's timeouts are 25s silent plus 180s visible). The
   ordering is safe, because `settle()` clears `busy` and `ask(false)` sets it again within the same
   microtask run, and a CDP evaluate cannot land between the two. In the two instrumented runs where the
   late settle landed inside the trace, it arrived 999ms and 817ms after `drive-sync` started. In the
   third it never landed before the check. The foot's own comment, *"a
   request that is still out when this file ends is a timer in a browser that is about to be killed"*,
   is false: the next section runs in the same page. Correct it in the same pass.
3. *(Noted, not proposed.)* `disconnect()` during a pending `connect()` leaves `pending` set. On an
   opted-in device with no token, *Stop syncing on this device* is drawn while Connect is waiting, so a
   teacher who taps it and then taps Connect again gets *"Planbook is already waiting for Google"*
   until the old request times out (up to ~205s). That is an edge case and outside this work order.

## Acceptance, line by line

1. **The cause is named in `TESTING.md` § WO-7.12, with the run that shows it.** Not done. The cause
   is named here, with the runs. I did not write `TESTING.md`, because the stop branch applies and the
   section's final wording depends on how (1) and (2) are cut. The text above is written so it can be
   lifted in.
2. **Twenty consecutive runs green.** Not done. No fix landed, so there was nothing to count. This
   sitting had 5 whole-harness runs in total: 2 baseline on `HEAD`, 2 with the trace, and 1 with the
   probe (under mutation). None of them are counting runs.
3. **The whole browser harness shows no new failure.** Nothing to measure: the tree is `HEAD`. The
   `HEAD` baseline was `1550 · 1549 · 1 failed` both times, and the failure was this check.

## Tool readings

- `node tools/wo-sweep.mjs` after the revert: `45 checks · 42 passed · 0 failed · 3 to review` (the
  three standing REVIEWs).
- `grep -rn MUTATION tools src` is **not literally empty, and it cannot be on `HEAD`.** It reads 17
  occurrences, all in the committed tree: `tools/README.md` ×9, `tools/verify/keys-legend-guards.mjs`
  ×4, `tools/verify/outreach.mjs`, `tools/verify/score-grid.mjs`, `tools/wo-gate.mjs` and
  `src/shell.js` ×1 each. These counts come from `git grep -c MUTATION HEAD -- tools src`. They are
  prose about earlier mutation rounds and a constant name. **None are mine:** `git diff --stat HEAD --
  tools src` is empty.
- No scratch files in `tools/`. `git status --short` shows only the phase-file claim edit, the brief
  and the status file, all of which predate this session, plus this result file.

## Files changed

- `c:\dev\planbook\.claude\dispatch\WO-7.12-result.md` (this file). Nothing else.
