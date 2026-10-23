# WO-3.69 — a category can drop each student's lowest N scores · implementer result

**Status: 9 of 10 Acceptance lines ticked, each from evidence on disk. Line 9 is 👤 and is open. The
mutation was made, went red, and was reverted before anything else was written. The reverted tree was
then re-run green. Nothing is committed, and `CHANGELOG.md` is untouched (a draft is at the foot).**

## What changed

- `src/grade-engine.js`
  - New private helpers: `dropCountOf()`, `categoryOf()`, `dueOrder()`, `droppedIds()` and
    `categoryWalk()`.
  - New export `isDropped(doc, cls, termId, studentId, assignmentId)`. It answers from the same
    `categoryWalk()` that `categoryResult()` sums from, so the grade and the mark cannot break a tie
    differently.
  - `categoryResult()` now leaves the dropped ids out. With nothing dropped, the filter keeps every
    column in order, so existing grades are the same float.
  - Comments added at `openWork()` (unchanged by construction) and `projectedClassGrade()` (the drop is
    taken as it stands, and the figure errs low).
- `src/categories.js`
  - `dropField()` and `dropShown()`: a *drop lowest* number field on every category row.
  - The `dropLowest` branch in `editCategoryField()`: blank or 0 deletes the key, and a whole number
    above 0 is written. Anything else writes nothing and shows a message in `#categoryError`.
- `src/shell.css`: `.category-drop-field`, `.category-drop-before` and `.category-drop`, plus their
  coarse-pointer rules (44px min-height, 52px min-width).
- `src/scores.js`
  - Imports `isDropped`.
  - New `paintDropped()`, called from `paintGrades()`. It sets the `.dropped` class, the `dropped` tag
    and the accessible name.
  - New `droppedClause()`. `cellLabel()` takes a `dropped` argument.
- `src/scores.css`
  - `.scores-input.dropped` is a second selector on WO-3.68's one strike rule. It is not a second
    rule.
  - New `.scores-dropped` tag in the bottom-left corner, plus its coarse size.
- `src/grades-report.js`
  - Imports `isDropped`.
  - `markText(mark, dropped)` prints `Dr (62)` or `Dr (18 L)`.
  - Each cell carries `dropped`, and the printed span gets a `dropped` class.
  - A `Dr` key entry, drawn only when a cell is dropped.
- `src/detail.js`
  - Imports `isDropped` and `scoreMark`.
  - New `droppedPieces()`, `droppedScore()` and `droppedCard()`. The *Dropped from the grade* card
    sits under the held card.
  - `detailModel().dropped`.
  - `studentCsv()` adds Work rows reading `dropped — scored X of Y[, late], not counted`.
- `src/detail.css`: `.detail-dropped-score` (struck through) and `.detail-dropped-mark`, plus print
  and coarse sizes.
- `src/signals.js`: a comment only, at `scorePercents()`. It records ruling 5: it does not ask
  `isDropped()`, on purpose.
- `src/shell.js`: the hook census line for `data-category-field` now names `dropLowest`. Comment
  only.
- `index.html`: one shared `.class-hint` at the end of the categories panel. It is still the panel's
  last child, which `categories-weights.mjs`' WO-3.64 check needs.
- `docs/data-model.md`: the key in the sketch, plus a new section *Dropping each student's lowest N*
  with the six rulings and a reader table.
- `sw.js`: `planbook-shell-v196` → `planbook-shell-v197`.
- `tools/verify/drop-lowest.mjs` (new, 20 call sites, 21 results). It is registered in
  `tools/verify-shell.mjs` after `excused-kept.mjs`.
- `tools/verify/categories-weights.mjs`: *every field still live* now expects 9 fields (3 rows × name,
  weight, drop), not 6.
- `tools/README.md`: the call-site count goes 2069 → 2089, taken from the sweep's own count, plus a
  WO-3.69 entry.
- `TESTING.md` § WO-3.69: written, under Phase 3, after WO-3.68.
- `plans/work-orders/phase-3-gradebook.md`: 9 boxes ticked. The 👤 box is left open. The status is
  untouched: no `--tick` and no `--handoff`.

## Acceptance, line by line

1. **[x] Hand-worked fixture, dropLowest 1 and 2, both modes.**
   - The fixture's arithmetic is written out at the head of `tools/verify/drop-lowest.mjs` and in
     `TESTING.md`. Every expected value is a literal.
   - Ada, weighted: 71.25 at drop 1 and 71.666… at drop 2. Points: 70.666… and 71.428….
   - Baseline with no drop: 69.1666… weighted and 68.2352… points.
   - All five checks PASS in runs 2 and 4. The grid shows all six students' hand figures.
2. **[x] A lower score takes the drop over.**
   - Typing 3 into Ada's Quiz 4 at the grid moves the strike and tag there, and Quiz 2 counts again.
     The grade is 67.00% (hand: 27/50 → 54%, so (54+80)/2 = 67).
   - Typing 8 back returns the drop to Quiz 2 at 71.25%. The cells hold only `{"v":10}` and `{"v":8}`.
3. **[x] Excused, ungraded and held cells never count toward N; rulings 1, 2 and 6.**
   - `isDropped()` gives exactly the literal set in both modes.
   - Each exclusion is placed where breaking it would change the answer:
     - Ben's excused 1/10 and held 2/10 are below his dropped 5/10.
     - Cy's 70% tie is broken by due date against column order.
     - Dee's tie is on the same due date and broken by column. Her bonus 0 would rank first if it were
       a candidate.
     - Eve's missing zero is below her dropped 6/10.
   - Ruling 4: at drop 2 and drop 5, Eve keeps her best.
4. **[x] Grid, grade sheet, both CSVs and student detail mark the same cells.**
   - Each surface is read for the cells it marks: grid `.dropped`, `gradesRecord()`, the parsed
     `gradesCsv()`, the printed `.grades-report-mark.dropped`, each student's detail card, and each
     student's `studentCsv()`.
   - All of them equal the same literal six-cell set.
   - Unlike WO-3.68, the student CSV now has rows to carry this. I added them, because this work
     order's Deliverables name "both CSVs and student detail" explicitly.
5. **[x] Signals and merge fields read the screen's grade; the low-score run counts a dropped score.**
   - `signals.evaluate()` *grade below* reports Fred at 56.00%. `{{grade.percent}}` resolves to 56.00%
     for Fred and 71.25% for Ada. All three match the grid's text.
   - *A run of low scores* for Fred: `{"run":3,"scores":[50,40,30]}`. The 30 is the dropped Quiz 5.
     Without it the run would be two, and the rule would stay silent.
6. **[x] A backup with no `dropLowest` key restores and grades as before.**
   - The key is taken off, then `buildBackup()` runs. The word does not appear anywhere in the file.
   - It parses and restores through the real confirm.
   - The grid shows the six hand no-drop figures (69.17% … 52.50%), and no cell is marked.
   - `newYearDocument()` carries no such key.
   - Every older grade fixture in the harness also stays green.
7. **[x] The mutation goes red, is reverted, and the red output is in TESTING.md.** Details below.
8. **[x] verify-shell and wo-sweep pass.**
   - `verify-shell.mjs` run 2: `2101 checks · 2101 passed · 0 failed · 0 skipped`, 1161s, EXIT=0.
   - Run 4, after the revert: `2101 checks · 2101 passed · 0 failed · 0 skipped`, 66,998 lines, 1147s,
     EXIT=0. Both on 2026-10-22, real clock.
   - `wo-sweep.mjs`: `52 checks · 49 passed · 0 failed · 3 to review` (the three standing reviews).
     Re-run after the last doc edit.
9. **[ ] 👤 Not ticked.** This needs eyes on the iPad. **Force-quit from the app switcher first, then
   check the build reads v197.**
   - What the harness measured: under an emulated coarse pointer the field is 44×52, and the dropped
     cell is 44px, struck 2px, with its tag drawn.
   - Still to judge by eye: whether the small slate `dropped` tag is legible at arm's length, and
     whether it reads as different from an excused strike.
10. **[x]** The `TESTING.md` section is written.

## The mutation

- **What was planted.** In `src/grade-engine.js`, the first line of `isDropped()` became
  `/* MUTATION WO-3.69: isDropped() drops nothing — REVERT */ return false;`.
- **The red run.** Run 3: `2101 checks · 2091 passed · 10 failed · 0 skipped`, 1145s, EXIT=1.
  - All ten reds are drop-mark checks: the engine set at drop 1 and drop 2, the grid set, the drawn
    strike and tag, the take-over pair, the grade sheet and its CSV, the detail card and student CSV,
    the editor's grid-at-drop-2 half, and the coarse cell.
  - The grade checks stayed green, because the engine's walk still drops. That is exactly the Trap: the
    reds show the grid disagreeing with the grade.
- **The revert.** I copied back a copy of the file saved just before the plant. I did not use
  `git checkout`, because the engine's WO-3.69 changes are unstaged and it would have wiped them.
  - `cmp` reads identical.
  - `grep -rn "MUTATION WO-3.69" src tools` finds nothing.
  - Run 4 (above) is green on the reverted tree.

## Earlier runs

- Run 1 was `2101 · 2098 · 3 failed`. All three failures were in my own new section, and all were
  fixed before run 2:
  - The CSV State cell is quoted because it holds a comma.
  - The test score followed the quizzes in Fred's sequence, so the run read 4. The fixture now puts the
    test first in document order.
  - I opened the editor through the seam without the `gradingMode.paintEditor()` call that
    `src/shell.js`'s door chains. The check now chains it.
- Nothing else in the harness went red.

## Decisions the work order didn't settle

- **No due date.** A piece with no due date sorts after a dated one in a tie. A plain string compare
  would have put `''` first, making undated work the first to be dropped.
- **Malformed values.** A malformed `dropLowest` (non-integer, string, `true`) reads as absent. That
  follows `isHeld()`'s "a value nobody wrote on purpose leaves the grade as it was" posture. The
  editor shows such a value as blank.
- **Bad input in the editor.** A fraction or negative typed into the editor writes nothing and puts a
  sentence in `#categoryError`. That is the slot WO-3.64 kept for "a future refusal". The alternative
  was to leave a number on screen the document does not hold.
- **The grid mark.** It is WO-3.68's strike (a second selector on the same rule) plus a slate
  `dropped` tag in the bottom-left corner, the one corner no other mark uses. Slate is `#6b7a8d`, the
  sheet's secondary grey. A strike alone would read as excused.
- **Student detail** got a card of its own, *Dropped from the grade*, under the held card, on the held
  card's argument. Neither card's pieces are in the grade or the projection. Detail had no list of
  scored pieces to mark, so this was the minimal way to make "student detail marks it" true.
- **Projection.** The dropped set is taken as it stands, so the line stays straight and is solved, not
  searched. The documented limit: where a low projected score would take the drop over, the figure
  errs low, which is the conservative direction.
- **Sheet notation.** The grade sheet prints `Dr (62)`, bracketed like `Ex (62)`, and adds a key entry
  only when a cell on the sheet is dropped. That keeps every existing sheet byte-identical and leaves
  `held-readers.mjs`' key count alone.

## Out-of-scope temptations, declined

- **Copying a class does not copy `dropLowest`.** `copyCategories()` carries name and weight only, and
  copying is not in the Deliverables. A teacher who copies a class with a drop policy would lose it
  silently. `gradingMode` does come across on copy (WO-3.34), so there is precedent. This is a
  one-line follow-up, and probably wanted.
- **The breakdown table.** The category rows on student detail could say "1 dropped". I did not do
  it: the card covers the reader line.
- **The tag in presentation mode.** It is visible there too. It is a grade fact, not support data,
  and nothing in the rulings asks to hide it.

## CHANGELOG draft (the teacher's to decide)

> **Drop each student's lowest scores.** A category can now leave out each student's lowest N scores:
> set *drop lowest* beside its weight in Categories. The drop is worked out every time, never written
> into a cell, so a later, lower score takes it over by itself. Dropped scores stay on the Scores
> screen, struck through and tagged *dropped*. The grade sheet and its CSV print them as `Dr (62)`,
> and the student report lists them on a card of their own. A score marked missing is never dropped,
> extra credit is never dropped, and each student's best score is always kept. *A run of low scores*
> still notices a dropped score.
