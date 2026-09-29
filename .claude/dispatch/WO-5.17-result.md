# WO-5.17 — No check opens a draft and then restores · result

**Implementer** Claude (Opus), 2026-09-29. **Nothing under `src/` changed** (`git diff --stat -- src/`
is empty), so `CACHE` in `sw.js` did not move. There is no commit; that is not in the brief.

## Where the checks went, and why

- **The restore check is in `tools/verify/outreach.mjs`**, as a new block at the foot of
  § "the send flow (WO-5.3)", just before the fixture comes off. I did not use
  `backup-restore.mjs` because the draft helpers do not travel cleanly into it. That section runs
  long before this one, on a document with no template and no student this flow can address, so it
  would need the whole WO-5.3 fixture carried across. In `outreach.mjs`, Ada, her class and five
  templates are already on the document. The block sits after the section's last `rev` reading,
  because a restore writes.
  - It opens the draft through the student record's own `[data-outreach-draft]`, reached by the
    class tab, the register and `[data-student-detail]`.
  - **It asserts the precondition**: the modal is open, on "Ada Wo53Full", with a non-empty body,
    the projector off, on `detailView`.
  - It builds this run's own backup with `buildBackup()`, calls `restoreFromText()`, then waits
    (polled) until `document.elementFromPoint` at the centre of **Replace** is the button itself.
    Only then does it press `[data-backup-confirm]` with the real pointer event. That guard is
    there because a coordinate click that landed on the draft's backdrop would close the draft for
    the wrong reason.
  - Finally it reads `#outreachModal` hidden.
- **The download check is in `tools/verify/sync-button.mjs`**, as a new block directly after
  WO-7.7's. It uses that section's Drive stand-in (`window.__drive`, including its existing `delay`
  field) and its `tap()` of `#syncBtn`. No new plumbing was added.
  - **One decision the work order did not settle: the order of events.** A modal overlay covers the
    header, so a teacher cannot tap Sync with a draft already open. A pointer event at `#syncBtn`
    would hit the draft's backdrop and close it, which would be a false green. So the check does
    the one thing a teacher *can* do. The stand-in holds every response for 1.2s, the header
    button is tapped, and the draft is opened from the student record during the wait. The check
    then reads the modal open with a non-empty body **while `syncState().busy` is true and the
    outcome is not yet `downloaded`**. After that, the sync settles `downloaded` and the check
    reads the modal hidden. It also reads the planted school name `WO517-DOWNLOADED` in the open
    document, which shows the download actually landed.
  - Where the body comes from: this document has no templates until `templates.mjs` runs later. So
    the block writes two plain templates (one per tone) and uploads them first, which puts the
    device back at `current` so the next sync can download. At its foot it removes both templates,
    puts the school name back, syncs to `current` again (the WO-7.10 block after it expects that),
    and returns to the register.
- Neither check calls `afterDownload()`, `afterRestore()` or `resetOutreach()`, which is the work
  order's Traps line.
- Comments updated to match: the `BROWSER_SECTIONS` row comment in `tools/verify-shell.mjs` said
  `outreach.mjs` "restores nothing", which is no longer true, so I reworded it. The header of
  `outreach.mjs` gained a paragraph, and the Cal block's "It runs last" was adjusted.

## Check counts (all from runs I watched to exit)

| Run | Tree | Printed | Time | Exit |
|---|---|---|---|---|
| Baseline | before the two checks | `1596 checks · 1596 passed · 0 failed · 0 skipped` | 649s | 0 |
| New | with the two checks | `1598 checks · 1598 passed · 0 failed · 0 skipped` | 655s | 0 |
| Mutated | `resetOutreach()` deleted | `1598 checks · 1596 passed · 2 failed · 0 skipped` | 665s | 1 |
| Restored | mutation reverted by edit | `1598 checks · 1598 passed · 0 failed · 0 skipped` | 653s | 0 |

1596 + 2 = 1598. There are two new `check()` call sites, neither in a loop and neither a failure
arm, so two results. The sweep's call-site count went from 1582 to 1584, and `tools/README.md:1226`
was updated. A WO-5.17 ledger paragraph was added after WO-2.55's, in the same style.

Caveat on the baseline: I started it before my first edit. The section modules are static imports,
so they load at startup and the run measured the pre-edit harness. Its "50,923 lines" figure, though,
matches the later runs. The line count seems to be read at the end of the run, after my edits had
landed, so I do not cite that figure as a pre-edit number.

## Mutation round

- `outreachView.resetOutreach();` in `afterRestore()` (`src/shell.js:1775`) was replaced with a
  `/* MUTATION WO-5.17 */` comment, and the harness was run. **Exactly these two checks failed.**
  - The download check read `after: {"open":true,"body":27,…}` once the sync had settled
    `downloaded`.
  - The restore check read the draft still open after the confirm had closed.
- The line was restored with an Edit, not `git checkout`. Before anything else was written, I ran
  `grep -rn MUTATION src/ tools/`. It returned only pre-existing prose: `src/shell.js:956` "A CLASS
  MUTATION ADDED LATER…", the `tools/README.md` ledger, `keys-legend-guards.mjs`, `outreach.mjs:1578`,
  `score-grid.mjs:1674` and `wo-gate.mjs:2539`. None of them is a live plant.
- `git diff --stat -- src/` was empty. The restored run is the last row of the table above.
- Recorded in `TESTING.md` § WO-5.17, which is new and sits after § WO-5.16.

## Sweep

`node tools/wo-sweep.mjs`: **`45 checks · 42 passed · 0 failed · 3 to review`**. The three to review
are the standing three: sensitive field names, due-date/late-missing, and the mockup banner. The
call-site check reads `1584 … matching tools/README.md:1226`.

## Acceptance, line by line

1. **Restore closes the draft, precondition asserted.** Met. Green in the new and restored runs. The
   precondition fields are in the check's own detail string.
2. **Download closes the draft.** Met, with the order-of-events decision above.
3. **Mutation-proved.** Met. Both went red, then both went green, recorded in TESTING.md, and the
   mutation was reverted before any other write.
4. **Harness green, count rises by exactly the checks added.** Met: 1596 to 1598.

I ticked all four boxes in `plans/work-orders/phase-5-outreach.md` and in TESTING.md § WO-5.17. None
is 👤 or 📆. I did not change the status line from `🤖 CLAIMED`; that is the orchestrator's step.

## What I could not close, and notes

- Nothing is open. No iPad reading applies: this is harness-only.
- **Not taken up (out of scope):** the `BROWSER_SECTIONS` comment on `cooldown-quiet.mjs` still says
  it is "the only section that drives a real restore of the whole year document through
  backup.restoreFromText() and the confirm button". That was already false because of
  `templates.mjs`, and is now false twice. I left it alone because it is not this work order's
  sentence; it is worth a one-line fix in some sitting.
- **Not taken up:** `afterPull()` (WO-7.9) also runs `afterRestore()`, so a first-run pull under an
  open draft would take the same path. A pull only happens on an untouched device, which has no
  student to draft to, so there is no reachable case and I added no check for it.
- `CHANGELOG.md` was not touched. A possible entry: *"The harness now opens an outreach draft and
  then restores, and opens one during a sync that downloads, and reads the draft closed both times —
  so deleting the call that closes it now turns two checks red instead of none."*

## Files changed

- `tools/verify/outreach.mjs`: the restore check block, a header paragraph, and one sentence in the
  Cal block.
- `tools/verify/sync-button.mjs`: the download check block.
- `tools/verify-shell.mjs`: the `outreach.mjs` row comment.
- `tools/README.md`: call-site count 1582 → 1584, plus the WO-5.17 ledger paragraph.
- `TESTING.md`: new § WO-5.17.
- `plans/work-orders/phase-5-outreach.md`: four Acceptance boxes ticked, with evidence.
- `.claude/dispatch/WO-5.17-result.md`: this file.
