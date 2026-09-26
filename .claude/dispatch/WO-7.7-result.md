# WO-7.7 — result (implementer)

**Summary.** After a sync that downloads, the open screen is now redrawn from both doors, About's
**Sync** and the header button. The redraw happens only when that sync's own outcome is `downloaded`.
Lines 1 and 2 are ticked, each resting on a green final run and a mutation round. Line 3 is 👤 and
still open. Nothing is committed. The status row still reads `🤖 CLAIMED`; `--handoff` is the
orchestrator's step.

## Decisions the work order left open

1. **The repaint is a named sibling, `afterDownload(result)`, in `src/shell.js` beside
   `afterRestore()`. It runs `backup.refreshBackupNag()` and then `afterRestore()`.** It is not
   `afterYearChange()`.
   - A download replaces the whole document the way a restore does. So it takes the restore's chain
     whole, including `outreachView.resetOutreach()`: an open draft is about a student in the
     replaced document, and `afterYearChange()` has no such line.
   - It adds back the one line `afterRestore()` leaves out on purpose, the backup nag. The restore's
     reason for leaving it out ("src/backup.js re-evaluates that itself on the path that just wrote
     the file") does not apply to a download. Nothing on the download path touches `src/backup.js`,
     and the nag's answer reads the document (`hasSomethingToLose`).
   - The reasoning is written at the function.
2. **The header door gets the promise back.** `tapSyncButton()` now returns `{ door, syncing }`
   instead of a bare string. `src/shell.js` chains `afterDownload` onto `tap.syncing`, the same way
   it chains it onto `syncNow()` for About's Sync.
   - `src/sync-button.js` imports nothing new.
   - I rejected a registered "after a download" callback. It would be a store subscriber by another
     name: a standing listener that module would own on behalf of other modules' screens.
   - `src/shell.js` was the only caller of `tapSyncButton()` (checked by grep).
   - The reasoning is written at `tapSyncButton()`.
3. **"Only on `downloaded`" reads the value `syncNow()` resolves with, not `syncState().outcome`.** I
   checked the brief's trap about the sticky outcome field:
   - `syncNow()` sets `outcome = null` when a transfer starts, and settles before it returns on
     every path, including its own `catch`.
   - So by the time the chain runs, the sticky field already names this sync. On today's tree the
     two cannot disagree. Mutation M4 below measured this.
   - I read the resolved value anyway, so the gate does not depend on the internal order of
     statements in another module.
   - A rejection repaints nothing.

## Acceptance, line by line

- [x] **1. A download from each door changes what the open screen draws; mutation-proved.**
  - **Setup.** A new block in `tools/verify/sync-button.mjs`, placed before LAPSED, reuses that
    section's fake Drive. It opens the attendance register of the class with the most students and
    changes one student's `last` name in the Drive copy (rev + 5, with the file's `appProperties`
    rev matching).
  - **Test.** It taps the door, then reads `#classView` with no navigation in between. The About
    door's reading is taken while About is still open over the register.
  - **Final run, header door:** `class tab c_b1 with 26 student(s) … outcome = downloaded; after: {"shown":true,"has":true,"stillHasOld":false,"held":1,"kept":0}`
  - **Final run, About door:** `outcome = downloaded; after: {…"has":true,"stillHasOld":false,"held":1,"kept":0,"aboutOpen":true}`
  - **Mutation M1+M2** (both chains deleted, one run; the two doors are independent, so each red
    belongs to its own door): `1517 checks · 1513 passed · 4 failed`, exit 1.
    - Header check red: `"has":false,"stillHasOld":true,"kept":1`.
    - About check red: `"has":false`.
    - The two no-redraw checks also went red, but only as a knock-on: `held 0`, because the planted
      name never reached the page to be tagged.
- [x] **2. An upload and an in-sync sync do not redraw the screen.**
  - **How it is read.** Before each tap, the leaf elements carrying the student's name are held in a
    page variable. After the tap, the test asks whether each is still `isConnected`. The two download
    checks serve as the positive control for this: there the count goes to `kept 0`.
  - **Order.** Each sync runs directly after a download. A failure was added alongside upload and
    in-sync.
  - **Final run:** `upload: outcome uploaded, rows kept 1/1 · in-sync: outcome in-sync, kept 1/1 · failure: outcome failed (bad true), kept 1/1`, and About's in-sync `rows kept 1/1`.
  - **Mutation M3** (the `downloaded` guard deleted): `1517 checks · 1515 passed · 2 failed`,
    exit 1. Exactly the two no-redraw checks went red (`kept 0/1`); both download checks stayed
    green.
  - **Mutation M4** (guard keyed on the sticky `syncState().outcome`): `1517 · 1517 passed`, exit 0.
    It was not caught, and that is correct: it is an equivalent mutant on today's paths (see
    decision 3).
  - My first-draft comments in `src/shell.js` and the harness claimed the "after a download"
    ordering would catch M4. They were wrong, and I rewrote both to say what was measured before
    reporting.
- [ ] **3. 👤 Laptop and iPad on the deployed app.** Not verified: it needs a real iPad and a deploy.
  The procedure is written in `TESTING.md` § WO-7.7. Force-quit the app first, because the
  `CACHE` bump only takes effect on a cold launch.

**Other deliverables.**
- **The false comment above `[data-drive-sync]` in `src/shell.js` is rewritten.** It now says the
  chain is what repaints, and that no screen listens to `notify()`.
- **A second false note was in `src/store.js`:** "A screen re-reads getDoc() and re-renders itself".
  It now says no screen is a subscriber, the sync button is the only one, and anything that replaces
  the whole document owes a repaint chained in `src/shell.js`.
- **No other note makes that claim.** I grepped `src/` and `docs/` for `listens to`, `subscri`,
  `notify`, `redraw` and `repaint`. CLAUDE.md's WO-7.5 block is true and I left it alone.
- **`sw.js` `CACHE` is bumped** from `planbook-shell-v131` to `planbook-shell-v132`.

## Both tools, final tree

- **`node tools/verify-shell.mjs`:** `1517 checks · 1517 passed · 0 failed · 0 skipped`, 47,843
  lines, 571s, exit 0, 2026-09-26, real clock. I read it to its `EXIT=0` line.
- **Earlier clean run** (before a comments-only edit): also 1517/1517, exit 0.
- **Run 1 was red, 4 failed**, and all four were my own new checks. It was a fixture fault: the class
  picker looked only in `#classTabBar`, which is empty on the home view the section above leaves
  open. It now picks a class and clicks whichever copy of its tab is on screen (`clickVisible`).
- **`node tools/wo-sweep.mjs`:** `45 checks · 42 passed · 0 failed · 3 to review`. The three are the
  standing REVIEWs, and § 11 reads 1506 call sites. `tools/README.md`'s count was updated from
  1502 to 1506, and a ledger paragraph records the run.
- **Mutation plants: none left.** Each mutation was applied over a scratchpad copy of `src/shell.js`,
  marked `MUTATION M<n>`, and reverted by copying the file back as soon as the WO-7.7 checks
  printed; `cmp` read identical each time.
  - `grep -rn "MUTATION M[0-9]" src/ tools/` returns nothing.
  - A bare `grep -rn MUTATION src/ tools/` is **not** empty, but everything it returns was already
    in the tree before this work order. Per-file counts match HEAD exactly: `git grep -c MUTATION`
    gives shell.js 1 ("A CLASS MUTATION ADDED LATER"), README 9, keys-legend-guards 4, outreach 1,
    score-grid 1, wo-gate 1.

## Files changed

- `src/shell.js`: `afterDownload()`, chained from both doors; the comment above `[data-drive-sync]`
  corrected.
- `src/sync-button.js`: `tapSyncButton()` returns `{ door, syncing }`, with the comment saying why.
- `src/store.js`: the comment above `notify()`.
- `sw.js`: `CACHE` v132.
- `tools/verify/sync-button.mjs`: the WO-7.7 block, 4 `check()` sites; `clickVisible` added to the
  destructure.
- `tools/README.md`: 1502 changed to 1506, plus the WO-7.7 ledger paragraph.
- `TESTING.md`: new § WO-7.7 with the evidence, both tools, and the mutation round.
- `plans/work-orders/phase-7-sync.md`: Acceptance 1 and 2 ticked, with an evidence note.

## Proposed follow-ups (not done, out of scope)

- **`afterRestore()` calls `outreachView.resetOutreach()` twice** (the brief flagged this). It is
  harmless and idempotent, but one call and its comment should go.
- **`afterYearChange()` does not reset outreach.** `resetOutreach()`'s own header says it is "called
  by src/shell.js after a year switch and after a restore", but it is only called after a restore.
  Either the comment or the chain is wrong.
- **Possible race, not reproduced:** a save made while a download is in flight.
  - `planFor()` decides from the stored record read at the start of `syncNow()`.
  - If the teacher saves during the few seconds of transfer, `adoptRemoteDocument()` flushes her
    save with `leaveCurrent()`. It then compares revs, and if the remote rev is still higher, it
    overwrites her edit.
  - This is outside the repaint. The Traps say to report this kind of thing rather than guard
    against it, so it is reported here and not guarded.
- **The M4-shaped hazard is covered by construction, not by a check.** No check can reach it today,
  because it would need `syncNow()` to reject.

## CHANGELOG draft (the teacher decides)

> **Syncing now redraws the screen.** When a sync brings down a newer copy from Google Drive, the
> screen you are on (the register, the gradebook, a student) redraws with the new data right away,
> whether you synced from the header button or from About. Before this, the new data was saved but
> the screen kept showing the old copy until you moved to another screen. A sync that uploads, or
> finds nothing to do, leaves the screen alone.
