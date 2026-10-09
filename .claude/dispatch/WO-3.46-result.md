# WO-3.46 — result

**Implementer:** Claude (work-order-implementer), 2026-10-08. Not committed. No verifier was spawned.
The row's status is left as `🤖 CLAIMED`, with nine of ten Acceptance boxes ticked in
`plans/work-orders/phase-3-gradebook.md`. The 👤 box is open.

## What was built

- **`src/held-column.js` (new).** It holds the two writers, `holdColumn()` and `commitColumn()`, one
  `update()` each. It also holds the preview, `holdPreview()`, which asks `classGrade()` twice: once on
  the document and once on a shallow clone with the column flipped. And it holds the confirm:
  `openHoldConfirm()`, `confirmHold()` and `cancelHold()`. The file is on `SHELL`, and it is exposed as
  `window.planbook.heldColumn` for the harness.
- **The score grid (`src/scores.js`, `src/scores.css`).** Every column head has a last line. A live
  column shows *Hold*. A held column shows an indigo *Held* mark, an sr-only "out of the grade", a
  washed head and *Commit*. Every cell's accessible name ends ", held out of the grade" while its
  column is held. A new export, `focusColumnHold()`, puts focus back on the head control after the grid
  is rebuilt. The header comment records why a tap-opened confirm does not break the grid's "no dialog"
  rule. `scroll-padding-top` is now 126 (fine pointer) and 152 (coarse), because the head grew.
- **The assignment editor (`src/assignments.js`, `src/assignments.css`).** A fourth row, *Hold out of
  the grade*: a `role="checkbox"` button with `aria-checked`, styled like the copy dialog's tick. Two new
  exports: `tapEditorHold()` and `paintEditorHold()`.
- **`index.html`:** the `#holdModal` markup. **`src/shell.js`:** three hooks
  (`data-score-hold`, `data-hold-confirm`, `data-hold-cancel`) plus `data-assignment-hold`, the
  `afterHoldWrote()` repaint chain, the hook docs and the seam.
- **`tools/wo-sweep.mjs` § 30:** the writer exception and the destructured-parameter clause, in one edit.
- **`sw.js`:** `CACHE` v171 → v172, and `./src/held-column.js` added to `SHELL`.
- **`docs/data-model.md`:** the writers and the confirm, under *Held columns*.
- **Harness:** a new `heldWriters()` block in `tools/verify/held-readers.mjs` (11 sites), one check in
  `score-grid.mjs`'s coarse pass and one in `assigned-and-due.mjs` at 390px. `tools/README.md` has the
  new call-site count (1841 → 1854), a ledger paragraph and the § 30 text. `TESTING.md` has a
  § WO-3.46 section with the mutation tables.

## Acceptance, line by line

1. **[x] Hold writes `held: true` and `heldAt` and nothing else. Commit deletes `held`, stamps
   `committedAt` and touches no cell. Each is one `update()`, and `rev` moves by one.**
   The `held-readers.mjs` check *"holding a column writes `held: true` and `heldAt` and nothing else…"*
   drives E2 through the grid control and the confirm. It compares the assignment's keys before and
   after: the hold adds exactly `held` and `heldAt`, and the commit removes `held`, adds `committedAt`
   and keeps `heldAt`. It also compares the score column's JSON, which is unchanged both times. Both
   readings are taken after `flush()`, and `rev` goes 5 → 6 → 7. "One `update()`" is true from the code:
   each writer contains exactly one `update()` call. The harness can only see the result, `rev` +1.
   Mutation M7 (the hold also stamps `committedAt`) turns this check red.
2. **[x] The write moves exactly the grades the confirm named, to the figures it named, in a weighted
   class and in a points class, both directions.**
   - Weighted, column E2: Alpha has 60, Bravo is missing, Charlie is excused, Delta has no cell. Both
     the hold and the commit name only Alpha and Bravo. The set of students who moved equals the named
     set, each figure equals the preview's, and the line text carries both of the grid's figures.
   - Points, column PB: Papa only, 130/170 → 90/120, both ways.
   - Mutation M6 (the preview asks the document twice) turns 4 checks red.
3. **[x] A confirm that moves no grade says so in words, and declining either confirm leaves the
   document byte-identical (`flush()` awaited).**
   E3's confirm reads *"No student’s grade in WO-3.46 Term changes — holding it moves nothing yet."*
   Three declines were checked: Keep on E3, Escape on Q1's commit, and Keep on E1's hold. After each,
   `JSON.stringify(getDoc())` is identical following `flush()`, and `rev` is 7 → 7. Mutation M8 (a
   decline that writes) turns 2 checks red.
4. **[x] A new assignment is live and its editor shows the box unticked. Ticking it on an existing
   column opens the same confirm as the grid's control.**
   The real *+ New assignment* opens an editor whose box has `role="checkbox"` and
   `aria-checked="false"`, and the assignment has no `held` key. Ticking the box on E2 opens a confirm
   whose title, label, button and lines match the grid's confirm for E2 exactly. Declining leaves the
   document byte-identical, the box unticked and the editor open. Confirming ticks the box, and
   unticking commits through the same confirm. A separate check at 390px on a coarse pointer finds the
   box ≥44px and unticked.
5. **[x] Edits typed through the grid into a held column and then committed reach `reviseCell()` with
   the column's state (rulings 1 and 2, end to end).**
   Scores were typed as real key events into the grid cells.
   - R1: held, then 72 → 74 leaves no `was`. After the commit, typing 75 gives `was` [74] (ruling 1).
   - R2: the trail is [55] and the 60 is a minute old. Held, then 65 → 66 gives `was` [55, 60].
     After the commit, typing 70 gives [55, 60, 66] (ruling 2).
6. **[x] A held column is driven through both callers, and each records no history while held and the
   committed figure after.**
   - `putCell()`: covered by line 5.
   - `acceptPastDue()`: the offer is painted while P1 is live, P1 is then held by its writer, and the
     offer is accepted. Alpha's trail [72] is kept as it was, while the live control column P2 pushes
     the blank ([72, null]). After the commit, typing 80 over Bravo's missing gives `was` [missing].
     P3 is committed two seconds after its blank was stamped, and then accepted; the blank is pushed,
     [70, null], which only the commit boundary does.
   - Harness mutation round: M1–M3 misname `held`, `heldAt` and `committedAt` in `putCell()`, and M4–M5
     misname `held` and `committedAt` in `acceptPastDue()`. Every one turns at least one check red. The
     plants were restored from copies and `cmp`-clean, and `git diff --quiet src/past-due.js` passes.
   - **Not covered, and it cannot be:** `heldAt` has no effect on `acceptPastDue()`. That function only
     writes over blanks, and a blank never counted, so a misnamed `heldAt` there would go unseen. This is
     stated in `TESTING.md` rather than claimed.
7. **[x] A held column that is the only work in its category leaves the category empty, and its weight
   is redistributed, checked against a hand computation.**
   On a hand-sized document, (80×50 + 90×20)/70 = 82.857142857…%. The engine's figure matches within
   1e-9, and it is the identical float when the column is deleted outright. The live figure is 73%. The
   effective weights are 71.43 / null / 28.57. The page's own held-only Quizzes category also reads
   `possible: 0`.
8. **[x] § 30 names the writer's file in the same edit, the sweep is green, and destructured
   parameters are caught and nothing wider.**
   - `node tools/wo-sweep.mjs`: `49 checks · 46 passed · 0 failed · 3 to review`, exit 0. The three
     reviews are the same three as at HEAD.
   - The HEAD sweep, pinned to this tree, reads the writer as three member reads: red, as the work order
     predicted.
   - Plants in `src/glance.js`, restored from a copy, with `git diff --quiet` clean: five parameter
     shapes went FAIL (arrow, function, a multi-line list with a default, async with `held` second, and a
     `for…of` destructure). Three negatives stayed PASS (a bare local, `{ held: true }` as a call
     argument, and a string).
   - Four writer-exception plants all went FAIL: a read in the writer, `= false`, a write in another
     file, and a stale exception.
   - The HEAD sweep with plant A did not name `src/glance.js`, which proves that before this change a
     destructured parameter passed.
   - The full table is in `TESTING.md` § WO-3.46.
9. **[x] `CACHE` is bumped:** `planbook-shell-v171` → `v172`.
10. **[ ] 👤 iPad. Not ticked: it needs a real iPad and a force-quit, and I have neither.** Also worth
    reading on the device: the head is now 48px taller on a coarse pointer (see the decisions below).

**Full harness on the final tree:** `node tools/verify-shell.mjs` printed
`1858 checks · 1858 passed · 0 failed · 0 skipped`, 59,161 lines, 31.8 lines per check, 882s, EXIT=0,
on 2026-10-08 with the real clock. I read the summary and the `EXIT=` line from the log after the
process exited. An earlier full run on the tree before R2's fixture change gave the same 1858/1858.

## Decisions the work order did not settle

- **Where the preview lives: in the writer's file**, as `withColumnFlipped()` in
  `src/held-column.js`, not as a helper in `src/grade-engine.js`. Flipping the key on a copy is a write
  of the key, and the engine's job is reading it. § 30 needed no widening for it: the clone uses an
  object literal plus `delete copy.held`, which is one of the allowed write shapes.
- **The § 30 writer exception is by shape, not by whole file.** In `src/held-column.js` only
  `.held = true` and `delete ….held` are let through, so a read of the key there still goes red. That is
  narrower than "the writer's file as an exception". The rule that an unused exception goes red still
  applies.
- **A column the open create flow has only just written, with nothing entered on it, is held or
  committed on the tap, with no confirm.** Nothing on it can move a grade, and the deliverable says
  "changing it on an existing column goes through the same confirm". The moment a score is on it, the
  tap goes through the confirm. If the owner reads ruling 3 as "every hold, always", the change is one
  `if` in `tapEditorHold()`.
- **No-op flips are refused rather than written,** and the confirm re-checks the column's state at Yes,
  so a stale question writes nothing.
- **The editor's checkbox is a `role="checkbox"` button, not `<input type="checkbox">`.** The note in
  `src/shell.css` beside `.toggle-btn` refuses native checkboxes ("16px of target"). I used the checkbox
  role rather than the toggle's `aria-pressed` because the work order calls it a checkbox.
- **Indigo, not amber, for held.** Amber is the past-due tint on the same head. Indigo is
  `.toggle-btn.active`'s wash, and the colour this sheet uses for a choice the teacher made (the note
  mark).
- **The head grew by 29px (fine pointer) and 48px (coarse),** measured in headless Edge.
  `scroll-padding-top` was re-measured to 126 and 152. WO-3.27's four driven Enter checks went red with
  the old 96 and 104, then green. On a portrait iPad this costs about a row of scores above the fold.
  That is a design trade for the owner's 👤 reading, not something I could settle.
- **Harness technique:** a column is brought into the grid's scroll box with the app's own
  `revealScoreColumn()` before its head control is clicked. `clickSel()`'s `scrollIntoView` does not
  scroll a sticky head sideways, and the first run's clicks on columns past the fold landed beside the
  grid. That is a harness trap, not an app defect.

## Declined, or out of scope

- WO-3.47's readers: the queue, the home card, the grade sheet and student detail. The home card's
  *N to grade* still drops a held column, as the work order expects.
- The assignment **list** row does not mark a held column. No deliverable asked for it, and it is a
  reasonable candidate for WO-3.47's table.
- Tinting a held column's **cells**. I kept the wash on the head only, because a cell fill is this
  grid's flag grammar.

## Notes for whoever is next

- The subset runner I used for fast section runs is a scratch copy of `verify-shell.mjs` in the
  session scratchpad, with `ONLY=` filtering `BROWSER_SECTIONS`. Nothing was added to `tools/`. A real
  `--only` flag on `verify-shell.mjs` would have saved several 15-minute runs; I suggest it as a
  follow-up rather than building it here.

## Files changed

`src/held-column.js` (new), `src/scores.js`, `src/scores.css`, `src/assignments.js`,
`src/assignments.css`, `src/shell.js`, `index.html`, `sw.js`, `docs/data-model.md`,
`tools/wo-sweep.mjs`, `tools/verify/held-readers.mjs`, `tools/verify/score-grid.mjs`,
`tools/verify/assigned-and-due.mjs`, `tools/README.md`, `TESTING.md`,
`plans/work-orders/phase-3-gradebook.md` (nine ticks; the CLAIMED status line was already in the tree).

## MUTATION check

I ran `grep -rn MUTATION src tools sw.js index.html` as my last command before writing this file. Every
hit is prose that already existed, and the per-file counts match `git grep -c MUTATION HEAD` exactly
(shell.js 1, README 9, keys-legend-guards 4, outreach 1, score-grid 2, score-search 1, wo-gate 1). None
of the plants from this work order remains.

## Draft CHANGELOG entry (the teacher's to decide)

> A score column can now be held out of the grade. *Hold* on a column's head in the score grid (or
> *Hold out of the grade* in the assignment editor) shows which grades would move, by name, before and
> after, and then keeps the column counting toward nothing. Scores, flags and notes can still be typed
> into it, and nothing records their history until *Commit*. Committing shows the same list the other
> way and makes the column count. Built for reconciling against the SIS without a half-entered column
> moving every grade.
