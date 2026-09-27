# WO-7.13: result

**The fix is in and there is no live mutation in the tree.** Acceptance lines 1 to 4 are ticked and
line 5 (👤) is not. I made no commit and wrote no `CHANGELOG.md` entry. The row still reads
`🤖 CLAIMED`, and changing it is the orchestrator's call. After the revert,
`grep -rn MUTATION src/ tools/ sw.js index.html` found only prose that was already there (`src/shell.js:937`,
`tools/README.md`, `keys-legend-guards.mjs`, `outreach.mjs:1572`, `score-grid.mjs:1674`,
`wo-gate.mjs:2539`).

## The draft check (§ 0 RESUME): what I kept and what I rewrote

I read the +86-line draft line by line against Deliverable 3 and the determinism trap.

**Kept:**
- The set-up: close the modals, `reset()`, open About on a 3599s token, seed a 10s token with the
  modal open, then a real `clickSel('[data-drive-sync]')` through the delegated listener. This is
  the `WO712PROBE` shape.
- The MutationObserver on `#drivePanel`, filing records by delivery batch.
- The claim itself: `#driveStatus` was written in the batch where `#driveSyncBtn`'s `disabled`
  came off. This is what makes the red deterministic. A paint from another task, such as
  drive-sign-in's leftover `connect()`, lands in a different batch. It can fix the end state but
  cannot turn the check green.
- The end-state assertions (Connect shown, Sync hidden, status does not start with "Connected",
  About still open, `signed-out`, zero calls) and the diagnostic string.
- The ~906 check and `verify/drive-sign-in.mjs` are untouched. The draft had left both alone too.

**Rewrote (one defect, and it was on the green side):**
- The draft's settle predicate was "a `disabled` record whose old value is not null". It also
  matches a redundant write. `btn.disabled = true` on a button that is already disabled is still a
  `setAttribute`, and it files a `disabled` record with old value `''`.
- So if a `refreshSyncChrome()` from somewhere else landed mid-sync, that batch would be taken for
  the settle. The obvious source is the leftover `connect()`'s `afterDriveAuthChange()` in
  `src/shell.js`. The batch holds no `#driveStatus` record, so a build *with* the repaint would go
  red on it. That is WO-7.12's flake arriving from the other direction.
- Fix: each batch now also records whether the button is enabled at delivery (`enabledNow`), and
  the settle predicate requires both conditions. I factored the predicate into one `SETTLE_BATCH`
  string that the wait loop and the final read share, and added a comment paragraph explaining the
  double reading.
- I never saw this happen in a run. It is a reading of the reflected-attribute semantics, so this
  is a hardening, not a repair of an observed failure.

## Against the Acceptance list

1. **Red on `HEAD` 3 of 3, recorded, then green: met (ticked).**
   - I ran the whole of `node tools/verify-shell.mjs` three times with `src/` and `sw.js` exactly as
     `604db6c` (`git diff --stat -- src sw.js` was empty).
   - `red1`, `red2` and `red3` each printed `1551 checks · 1549 passed · 2 failed · 0 skipped`, then
     `EXIT=1` (`red3` took 586s).
   - The new check failed in all three with the same reading:
     `the batch the sync settled in = ["driveSyncBtn:disabled","driveSyncStatus:class"]; … Connect shown = false, Sync shown = false, status = "Connected to Google Drive. This access ends at …"`.
   - The other failure in each run was the ~906 check (WO-7.12's).
   - With the repaint in, `green1` printed `1551 checks · 1551 passed · 0 failed · 0 skipped`, 585s,
     `EXIT=0`. The settle batch now holds `driveStatus:class`, `driveStatus:childList`,
     `driveConnectBtn:class` and the rest.
   - Recorded in `TESTING.md` § WO-7.13.
2. **Mutation-proved and reverted first: met (ticked).**
   - I backed up `src/drive-sync.js` to the scratchpad, then commented out the new call under a
     `MUTATION WO-7.13` marker.
   - `mut1` printed `1551 · 1549 · 2 failed`, 587s, `EXIT=1`. The new check read exactly as it does
     on `HEAD`, and the ~906 check went red too.
   - I restored the file by copy and `cmp` was clean. I then ran the `grep` and read that it was
     clean, all before writing any prose. The next harness run after the revert (`green2`) was
     green.
3. **The comments are true and every caller is named: met (ticked).**
   - The comment at `src/drive-sync.js` ~542 now names the repaint in the `finally`.
   - `refreshAuthChrome()`'s header in `src/auth.js` claimed two things that were false: that it
     runs "after every flip" (a lapse is a flip that nothing repaints) and that "src/shell.js does
     the calling" (five of its callers are in `auth.js`). It now lists every caller.
   - `TESTING.md` names every caller by function and line: `connect()` ×3, `reconnect()` ×3,
     `disconnect()`, `noteSyncOptIn()`, `shell.js` `openAbout()`, the new `syncNow()` `finally`,
     and the harness's `drive-sign-in.mjs:444`.
   - I read every paint, repaint and redraw comment in both files. Two came close and are true: the
     "reads as signed out everywhere" comment in `authState()`, and the "already says Not
     connected" comment in `refreshSyncChrome()`, which was false on this path until now.
4. **No new failure in the whole harness: met (ticked).**
   - `green1` and `green2` (the run after the revert) each printed
     `1551 checks · 1551 passed · 0 failed · 0 skipped`, 585s, `EXIT=0`.
   - WO-7.12's check was green in both runs with the repaint and red in all four without it. It is
     now asserting something the app does, but the harness leak it is exposed to is still there.
   - `node tools/wo-sweep.mjs` printed `45 checks · 42 passed · 0 failed · 3 to review`. That is
     after I moved `tools/README.md:1226` from 1539 to 1540 and added a WO-7.13 paragraph on the
     call-site count.
5. **👤 Laptop, lapse with About open: NOT verified, not ticked.** It needs a real Google sign-in
   and about an hour of wall-clock time. The procedure is in `TESTING.md`.

## Decisions the work order left open

- **The repaint is in the `finally` and fires only on `outcome.kind === 'signed-out'`.** One call
  covers both arms that settle `signed-out`: no fresh token, and a 401 mid-flight. No other outcome
  says anything about the sign-in. The call reads `authState()` and writes nothing. It is a direct
  call, not a `subscribe()`. With About closed it paints the hidden panel, which does no harm:
  `refreshAuthChrome()` returns early only when `#drivePanel` is missing from the DOM, and the next
  About-open repaints the panel anyway. It sits after `refreshSyncChrome()`, so both paints share
  one batch, and before `announce()`.
- **`CACHE` v139 → v140.**

## Noticed, declined (out of scope)

- **A 401 part-way through settles `signed-out` while the token is still fresh by the clock.**
  `request()` does not clear the session, so after this repaint the panel honestly reads "Connected"
  with Connect hidden, while the sync line's message says "connect again". That is a separate
  defect from this one and I did not book it.
- I did not change either of the two owner questions.
- `src/shell.js`'s comments about the tap chain are unchanged. Acceptance 3 covers only
  `drive-sync.js` and `auth.js`, and I read nothing false in the shell ones on this point.

## Files changed

- `src/drive-sync.js`: the import, the repaint in `finally`, and the comment at ~542.
- `src/auth.js`: comment only (the header of `refreshAuthChrome()`).
- `sw.js`: `CACHE` v140.
- `tools/verify/drive-sync.mjs`: the new check (the draft, with the settle predicate hardened).
- `tools/README.md`: call-site count 1539 → 1540, and the WO-7.13 paragraph.
- `TESTING.md`: § WO-7.13.
- `plans/work-orders/phase-7-sync.md`: Acceptance 1 to 4 ticked. The `CLAIMED` status came from the
  orchestrator and was already in the tree.

The logs are in my session scratchpad (`red1`–`red3`, `green1`, `mut1`, `green2`), which is not
durable. The lines that matter are quoted above and in `TESTING.md`.

## CHANGELOG draft (for the teacher to take or leave)

> A Google sign-in that ran out while About was open no longer leaves the Drive panel saying
> "Connected" with no button under it. Tapping *Sync this year now* now puts *Connect Google Drive*
> back and says Not connected.
