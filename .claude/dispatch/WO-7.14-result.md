# WO-7.14: result

**The fix is in, and the tree has no live mutation.** Acceptance lines 1 to 4 are ticked. Line 5 (👤)
is not ticked. I made no commit and wrote no `CHANGELOG.md` entry. The row still reads `🤖 CLAIMED`,
and changing it is the orchestrator's call. The mutation only ever existed in a scratch
`git worktree`, and I removed that worktree before writing any prose. After that,
`grep -rn "MUTATION WO-7.14"` over `*.js`, `*.mjs` and `*.html` in the main tree found nothing
(exit 1).

## What changed

- **`src/auth.js`: new export `refused()`.** It sets `session = null` and does nothing else:
  - no `revoke()`;
  - no announcement and no paint (`syncNow()` does both);
  - no storage write;
  - `lastError` is left alone.

  Comments: the state block now lists the session's three writers (`acceptTokenResponse()`,
  `disconnect()`, `refused()`). `authState()`, `ensureFreshToken()` and `refreshAuthChrome()` no
  longer say that `signedIn` follows the clock alone. `refused()` has its own comment giving the
  reason for each thing it does not do. The module still imports `src/live-region.js` and nothing
  else.
- **`src/drive-sync.js`: `refused()` is called in `syncNow()`'s `catch`**, only when
  `e.code === 'expired'`, and before `settle('signed-out', …)`. `network` and `drive` faults do not
  reach it. The import is one-way (drive-sync into auth). Three comments were corrected: the
  `fault()` note, the no-token arm (~544), and the `finally` repaint (~601).
- **`src/sync-button.js`: comments only.** The tap already branches on `authState().signedIn`, so
  the fix reaches it without a code change. The Traps line says not to fix this here. Three
  comments changed: the header's "THE LAPSE IS NOT WATCHED", the `lapsed` ladder entry, and a line
  above the `!signedIn` branch in `tapSyncButton()`.
- **`sw.js`: `CACHE` v140 → v141.**
- **`tools/verify/drive-sync.mjs`: two new checks and one revised clause.**
  - **New: the refusal check.** It runs after WO-7.13's check and copies its shape:
    1. About is opened on a 3599s token, and the "Connected" premise is asserted.
    2. `__drive.failNext = 401`.
    3. A real `clickSel('[data-drive-sync]')` goes through the delegated listener, with the modal
       never closed.

    It then asserts:
    - `authState().signedIn === false`, `accessToken() === null`, and the session fields are empty;
    - Connect is shown, Sync is hidden, and the status line does not start with "Connected";
    - every `planbook_` localStorage key is byte-identical before and after, and
      `planbook_driveSyncOptIn` is `"true"`;
    - the header `#syncBtn` is still drawn, with a label ending "Tap to sign in to Google and sync
      now."

    The opt-in is switched on for this block only. The stored value is put back at the foot, and
    the existing Disconnect tap further down clears it and repaints the header, as it already did.
    The red on `HEAD` does not depend on a paint, because `signedIn` is read off the module.
  - **New: the negative.** The network-failure sync and the two-files (`drive`) refusal both leave
    `signedIn === true`.
  - **Revised: see the decision below.**
- **`tools/README.md`:** the call-site line goes from 1540 to 1542, plus a WO-7.14 paragraph.
- **`TESTING.md`:** new § WO-7.14.
- **`plans/work-orders/phase-7-sync.md`:** Acceptance 1 to 4 ticked. The `CLAIMED` status was
  already in the tree, from the orchestrator.

## Against the Acceptance list

1. **Red on `HEAD`, green with the change, recorded: met (ticked).**
   - Both red runs used a `git worktree` of `74bdc30`. `git diff --stat -- src sw.js` was empty
     there, and only the new harness file had been copied in.
   - `red1` printed `1553 checks · 1552 passed · 1 failed`, `EXIT=1`. The one failure was the new
     check: `signedIn = true, a token to hand out = true, session fields =
     ["token","expiresAt","granted"], Connect shown = false, Sync shown = true, status = "Connected
     to Google Drive…"`, header label `…Tap to sync now.`
   - `red2` used the final harness. It printed `1553 · 1551 passed · 2 failed`, 591s, `EXIT=1`: the
     new check, plus the revised ~877 clause.
   - `green2` ran on the final tree. It printed `1553 checks · 1553 passed · 0 failed · 0 skipped`,
     592s, `EXIT=0`.
2. **Mutation-proved, reverted first: met (ticked).**
   - A third worktree held this change with `if (expired) refused();` commented out under a
     `MUTATION WO-7.14` marker.
   - `mut1` printed `1553 · 1552 passed · 1 failed`, 590s, `EXIT=1`. The new check went red with the
     same reading it gives on `HEAD`.
   - I removed the worktree with `git worktree remove --force` and grepped clean before writing any
     prose. The main tree never held the mutation.
   - One caveat: `mut1` carried the harness from before the ~877 clause was revised, so that clause
     was not part of the mutation proof. `red2` shows the revised clause is red whenever the session
     survives a 401, which is the same condition the mutation creates.
3. **No comment still says `signedIn` follows the clock alone: met (ticked).** After the edits I read
   the output of `grep -n -i clock` over all three files line by line. What is left is about:
   - the expiry being shown as a clock time;
   - the header's no-countdown rule;
   - date formatting;
   - one historical "this comment said the clock was enough";
   - the new sentences, which say the clock is not the only thing that ends a sign-in.
4. **No new failure in the whole harness: met (ticked).**
   - `green2` printed 1553/1553 with 0 skipped, `EXIT=0`.
   - `node tools/wo-sweep.mjs` printed `45 checks · 42 passed · 0 failed · 3 to review` (the three
     standing reviews).
   - One honest limit: after `green2` I edited only `tools/README.md`, `TESTING.md` and the phase
     file. Nothing in `src/`, `sw.js` or the harness changed after that run. I re-ran the sweep after
     those edits, but not the browser harness.
5. **👤 Laptop, deployed: not verified, not ticked.** It needs a real Google account, a revoke at
   myaccount.google.com, and the deployed v141. The procedure is written in `TESTING.md` § WO-7.14.

## A decision the work order did not settle: the ~877 check was asserting the defect

The brief expected that checks *after* the 401 might depend on the session surviving it. None did,
because the next check (the lapse) seeds its own token, so nothing needed re-seeding. The 401 check
*itself* did depend on it.

- Its last clause was `afterStale.lineClass === 'class-error'`: the sync line, painted red, holding
  the "connect again" sentence.
- `refreshSyncChrome()` draws that line only while `signedIn` is true. When signed out it draws
  nothing, by design and in its own comment.
- So that red line was reachable only because the 401 left the session standing, which is this work
  order's defect. `green1` went red on exactly that clause and nothing else: `1553 · 1552 · 1
  failed`, `line class = class-hint`.

I **replaced** the clause and did not delete it. It now asserts `signedIn === false`, Connect shown
and Sync hidden. That is the same end state the lapse check has asserted since WO-7.13, and it is
red on `HEAD` (`red2`: `signedIn = true, Connect shown = false, Sync shown = true, line class =
class-error`). The check's label gained "ends the sign-in and puts Connect back", and a comment at
the check explains the change. The one consequence the verifier and the owner should see:

- **After a 401, the "Your Google sign-in ran out part-way through… Tap Connect Google Drive above"
  sentence is no longer drawn in the panel.**
- It is still announced to the live region.
- The panel instead shows Connect and "Not connected". That is what a lapse has looked like since
  WO-7.13, and the owner read that state on hardware at v140.

If the owner wants that sentence visible after a refusal, that is a change to `refreshSyncChrome()`
and belongs in its own work order.

## Noticed, declined (out of scope)

- **The `expired` sentence says "ran out"** ("Your Google sign-in ran out part-way through…").
  After a revoke that is not literally what happened. Rewording it is user-facing copy, and the
  existing check matches `/sign-in ran out/`. Worth a follow-up if the owner cares.
- **Two more places still describe `signedIn` as clock-computed:** `docs/sync.md` lines 408 and 462,
  and `tools/verify/drive-sign-in.mjs:568`. Both are outside the three files the Acceptance names.
  The `docs/sync.md` lines read as history rather than a current contract, but a sweep would be
  cheap.
- **About's "Stop syncing on this device" after a refusal** depends on `noteSyncOptIn()` having been
  told. In the app it has been; the harness block does not call it, so that is not asserted.

## Files changed

- `src/auth.js`
- `src/drive-sync.js`
- `src/sync-button.js`
- `sw.js`
- `tools/verify/drive-sync.mjs`
- `tools/README.md`
- `TESTING.md`
- `plans/work-orders/phase-7-sync.md`

The logs (`red1`, `red2`, `green1`, `green2`, `mut1`) are in my session scratchpad, which does not
persist. The lines that matter are quoted above and in `TESTING.md`.

## CHANGELOG draft (for the teacher to take or leave)

> If Google stops accepting Planbook's sign-in before the hour is up (you removed its access, changed
> your password, or your school revoked it), Planbook now treats you as signed out straight away.
> About shows *Connect Google Drive*, and the next tap on the header's sync button asks Google to
> sign in again instead of failing the same way every time. Sync stays switched on for this device.
