# WO-3.76 — "N to grade" skips work filed under no category · result

**Implementer** Claude (Opus), 2026-11-01. Nothing committed and nothing pushed. Status left at
`🤖 CLAIMED`. All six Acceptance boxes are ticked in the phase file and in `TESTING.md` § WO-3.76. Box 3
rests on a reading that is stated below, so the verifier can dispute it.

## What was built

- `src/home.js` `ungradedCount()` and `src/glance.js` `queueRows()` each take the engine's
  `uncategorizedWork()` (WO-3.73) as a **third source** into the same `open`-only `take`. Each makes one
  forwarded call per roster student, following the existing `heldWork()` precedent. The order is
  `openWork` → `uncategorizedWork` → `heldWork`, so uncategorized rows come after the class's own
  categories and before held columns. Neither file tests a cell. `src/grade-engine.js` is untouched,
  so `openWork()` is not widened.
- In `src/glance.js` `queuePanel()`, a row whose `categoryId` is the engine's `null` is labelled with the
  engine's `LOOSE_NAME`, *no category*, which is the Record dialog's word. That is the "where a reader
  groups by category" deliverable. The queue panel is the only reader on these two screens that names a
  category. The card's chip is a bare count.
- I updated the banner comments in both files and the reader list in the `src/glance.js` header.
- `sw.js` `planbook-shell-v204` → `v205`.
- New harness section `tools/verify/uncategorized-to-grade.mjs`, registered in
  `tools/verify-shell.mjs` directly after `verify/ungraded-count.mjs`. It has 7 call sites and 6
  executed results (the 7th is the fixture-guard arm). It does no reload and changes no viewport or
  presentation mode, and it removes its fixture at the end.
- `tools/README.md`: the call-site count is now 2171 → 2178, plus a ledger paragraph.
- `TESTING.md` § WO-3.76, under Phase 3, placed before `## Phase 4`.
- The phase file's six Acceptance boxes are ticked.

## Acceptance, line by line

1. **[x] Card and queue show it, in both modes, and card = queue row count.** `verify-shell.mjs`
   2026-11-01: `PASS | WO-3.76: a class with one empty uncategorized assignment shows it …`. Both cards
   read `2 to grade`. Each class has two queue rows, Essays (1 blank) then uncategorized (`cat: null`,
   2 blanks). A second PASS covers the panel's drawn rows: `WO-3.76 Weighted · no category · 2 blanks`,
   and the same for the points class.
2. **[x] Dialog, card and queue agree.** `PASS | WO-3.76: the quarter dialog's empty-boxes count, the
   card and the queue agree …`. `emptyBoxes()` is 3 in each class, which equals the sum of that class's
   queue blanks (1 + 2). The card's 2 equals the queue's row count. The dialog names `["Essays","no
   category"]`.
   - **Decision.** The three count different units: the dialog counts cells, the card counts
     assignments, and the queue carries both. So "agree" is checked as dialog count = sum of the queue's
     `open`, and card = queue rows.
   - The fixture has no zero-point work and no held column while this check reads. Both of those
     already make the dialog and the card differ by older rulings (WO-3.26, WO-3.47, WO-3.72), and
     `TESTING.md` says so.
3. **[x] (stated reading) No projection moves; a held uncategorized column counts as held, not open.**
   - **Projection:** `PASS | WO-3.76: no projection's figures move …`. S1's grade and its projections at
     100% and 0% read `[80,90,40]` in the points class (counting the loose pile twice would give 93.33
     and 26.67) and `[80,80,80]` in the weighted class. The figures are identical before and after the
     home page draws.
   - **Held:** `PASS | WO-3.76: a held uncategorized column still counts as held, not open …`. While
     held, the column appears in no card figure, no queue row and no `emptyBoxes`, and it is on the
     dialog's `heldColumns()` line. Once committed it is open everywhere: card 3, a live queue row,
     `emptyBoxes` 5.
   - **The reading:** `heldWork()` walks categories only. So the card and the queue do **not** list a
     held uncategorized column *as held*. That was true before this work order, and it is the scope the
     owner ruled as built on 2026-11-01 (`TESTING.md` § WO-3.70, "It is not booked").
   - The only reader that counts such a column as held is the dialog's `heldColumns()`. Widening
     `heldWork()` would be an engine change outside these Deliverables. If the verifier reads "counts
     as held" as "the card and queue show it under *held*", this box is not met and needs that booking.
4. **[x] Mutation red, reverted, shown.** I commented out the `uncategorizedWork` line in `queueRows()`
   and marked it `// MUTATION WO-3.76`.
   - The harness run was stopped after the section printed, so the log ends `EXIT=127` and has no
     summary line. By then it had printed 1,639 PASS lines.
   - Four checks went red, with the queue at one row per class while the card still read 2. The
     projection and cleanup checks stayed green.
   - I reverted by restoring the pre-mutation copy before writing anything else. `grep -rn MUTATION
     src/` now shows only the pre-existing prose at `src/shell.js:1095`. The red output is quoted in
     `TESTING.md`.
   - I also killed the orphaned headless Edge processes that the stopped run left behind.
5. **[x] Both tools pass.**
   - `node tools/verify-shell.mjs` (delivered `src/` and harness, real clock, before the README and
     TESTING edits): `2182 checks · 2182 passed · 0 failed · 0 skipped`, `70,702 lines · 32.4 lines
     per check · 1203s`, `EXIT=0`.
   - `node tools/wo-sweep.mjs`, last run after every edit: `52 checks · 49 passed · 0 failed · 3 to
     review`, exit 0. The 3 reviews are the standing ones. Call sites are `2178 … matching
     tools/README.md:1363`, and § 31 is green with the new import.
   - After that harness run, the only files written were docs: `tools/README.md`, `TESTING.md` and the
     phase file. The mutation went into `src/glance.js` and came back out byte-identical.
6. **[x] TESTING.md section.** `### WO-3.76 — "N to grade" skips work filed under no category`,
   `TESTING.md:19869`, with all six lines verbatim and evidence for each.

## What I could not verify

- There are no 👤 lines. I took no iPad reading of the card or the panel. The new *no category* label
  is text in an existing row, so it adds no control and needs no 44px work.

## The survey the Traps line asked for (in `TESTING.md`, not changed)

- **Student detail, Missing work card and student CSV `Work` rows:** they do **not** show uncategorized
  work, because they use `openWork()`. This is true even in a points class, where an uncategorized
  missing mark *is* in the grade.
- **Held card:** it does **not** show uncategorized work (`heldWork()` scope).
- **Excused card:** it **does** show uncategorized work (`excusedWork()`).
- **To-move card:** it counts uncategorized work in points mode but does not name it.
- **Grade sheet (screen, print) and its CSV:** they **do** show uncategorized work, as a column under
  *no category*.
- **Not named by the Traps line:** `{{missing.list}}`/`{{missing.count}}` and the signal engine's
  missing-count rule also count only categorized missing marks.

## Proposed follow-ups (none acted on)

1. **Student detail and the student CSV leave out uncategorized open and missing work.** The worst
   case is a points class, where a missing mark on uncategorized work is in the grade but not on the
   *Missing work* card. This would be a booking to add `uncategorizedWork()` to `detail.js`'s listings.
2. **`{{missing.list}}` / `{{missing.count}}` and the missing-count signal** skip uncategorized missing
   marks in points mode. Whether they should is a ruling for the owner.
3. **The WO-3.70 edge:** a held uncategorized column is listed nowhere as held on the card, queue or
   detail. It is already ruled "not booked". I mention it only because Acceptance 3's wording brushes
   against it.

## Files changed

- `src/home.js`, `src/glance.js`, `sw.js`
- `tools/verify/uncategorized-to-grade.mjs` (new), `tools/verify-shell.mjs`, `tools/README.md`
- `TESTING.md`, `plans/work-orders/phase-3-gradebook.md` (boxes)

## CHANGELOG draft (for the teacher to decide)

> **Work filed under no category now counts as work to grade.** The home card's *N to grade* and the
> *Waiting to be graded* list now include blanks in assignments that aren't in any category, in both
> weighted and points classes. The list names them *no category*, the same words the Record Q1 dialog
> uses, so the card, the list and the dialog's empty-box count agree. Grades and "what it would take"
> figures are unchanged.
