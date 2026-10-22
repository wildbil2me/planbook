# WO-3.68 — an excused cell keeps the score it had · implementer result

**Status: 8 of 10 Acceptance lines ticked, from evidence on disk. Two are left open. Line 9 is 👤.
Line 4 is open because one of the four surfaces it names, the student report's CSV, never lists an
excused piece, so it cannot show a kept score (details below). The engine mutation is reverted.
Nothing is committed.**

## What changed

- `src/scores.js`
  - `cellFor()` keeps `v` on `excused`. `missing` still clears it.
  - `applyFlag()` keeps the score when it sets excused. It says *"The 80 is kept, struck through, and
    no longer counts."*
  - X again takes the flag off, keeps the score, and says *"The 80 it kept counts in the grade again."*
  - `editScore()`: typing into an excused cell keeps the flag (ruling 2). `missing` still drops its
    flag. Emptying the field keeps the flag.
  - New `flagClause()`: a kept score's accessible name reads *"— excused, 80 kept and not counted"*.
    The name is repainted on the typing path when an excused cell's kept score changes.
  - The three comments that argued the old behaviour are rewritten in place: `cellFor()`, the
    `editScore()` exception, and the `applyFlag()` header. The cell-draw and `paintCell()` comments
    say where the strike comes from.
- `src/scores.css`: one rule, `.scores-input.excused:not(:placeholder-shown)`, with a 2px
  `line-through`. It sits outside every `@media` block, and nothing else in the file names
  `text-decoration` on `.scores-input`.
- `src/grades-report.js`: `markText()` asks the flag first and prints `Ex (62)`. The legend's `Ex`
  entry is widened, not duplicated, because `held-readers.mjs` counts key entries. The header comment
  is updated.
- `src/score-history.js`: the trail reads *"Excused, 18 kept"*.
- `src/past-due.js`: the decision-1 comment no longer says excused holds no number (comment only).
- `docs/data-model.md`: an example line, a table row, and a paragraph after the table. No
  `SCHEMA_VERSION` bump. It says plainly that a score erased by an earlier build is not recovered.
- `sw.js`: `planbook-shell-v195` → `v196`.
- `tools/verify/excused-kept.mjs` (new; 20 call sites, 19 results). Registered in
  `tools/verify-shell.mjs` after `past-due.mjs`.
- `tools/verify/score-grid.mjs`: the three-flags check now asserts the kept 63, struck through. The
  `0x1f` comment is corrected.
- `tools/README.md`: call-site count 2049 → 2069, plus an entry for this work order.
- `TESTING.md` § WO-3.68: written.
- `plans/work-orders/phase-3-gradebook.md`: 8 boxes ticked.
- **Not touched:** `src/grade-engine.js`. `git diff --stat` on it is empty, and `cmp` against a
  pre-mutation copy reads identical.

## Acceptance, line by line

1. **[x]** Kept `v`, and the same grade in both modes. The engine was asked over clones of the
   document: weighted 75 = 75 (80 counted would be 78), points 75 = 75 (80 counted would be 79.17).
   The grid matched: X pressed on a real cell gave `{"v":80,"flag":"excused"}`, grid 75.00% in both
   modes.
2. **[x]** X again gives `{"v":80}`. The grid then reads 78, the engine's figure for the 80, and the
   sentence says it counts again.
3. **[x]** Typing 65 gives `{"v":65,"flag":"excused"}`, drawn struck. Emptying gives
   `{"v":null,"flag":"excused"}`, drawn exactly as an old excused blank. Ruling 3 checked: M clears
   the score, and typing into missing takes the flag off.
4. **[ ] left open.**
   - **Shown:** the printed grade sheet, its CSV (`gradesCsv()`, which prints `Ex (80)` / `Ex (7)`),
     the legend, and the score history (*"18 (Sep 20) → Excused, 18 kept (Oct 1)"*). The score
     history is student detail's only list of an excused piece.
   - **Not shown:** the other CSV is `studentCsv()` in `src/detail.js`, and it lists only
     `openWork()` rows (outstanding and missing). Excused work is in neither shape, so there is no row
     a kept score could go on.
   - **What I proved instead:** that file is byte-identical whether the cell keeps its 7 or not.
   - **Decision for the owner:** either "both CSVs" meant the grade sheet's CSV and the student CSV,
     and the student report needs a new kind of row (out of scope, so not built), or the line is met
     as written and can be ticked.
5. **[x]** Old-shape `{v:null, flag:'excused'}` cells are in the file, parse back, survive a real
   restore and confirm onto IndexedDB, and draw as before: empty, Ex placeholder, X glyph, no strike.
6. **[x]** Past-due over homework due 2020-01-06: it offers 1 blank, the review lists only the true
   blank, and Accept writes only that cell. The excused blank and the excused 7 are unchanged.
7. **[x]** Mutation in `tally()`, `src/grade-engine.js:120`: a kept score is summed instead of
   skipped. The run went `2080 · 2075 · 5 failed`, `EXIT=1`, and all five reds are the new grade
   checks plus the student-CSV identity. It was reverted with `git checkout` before anything else was
   written. `cmp` reads identical, and `grep "MUTATION WO-3.68"` finds nothing. No older grade check
   went red, because every older fixture plants only `{v:null}` excused cells. That is worth knowing,
   but it is not a gap in this work order.
8. **[x]** `verify-shell.mjs`: `2080 checks · 2080 passed · 0 failed · 0 skipped`, 1148s, `EXIT=0`,
   2026-10-22, real clock (run 2, before the mutation; `src/` was not touched between run 2 and the
   revert). `wo-sweep.mjs`: `52 · 49 · 0 failed · 3 to review` (the standing three), re-run after the
   doc edits. Run 1 was red on 5 harness assertions only: the old score-grid ruling, and my own
   label/CSV-order regexes. All were fixed before run 2.
9. **[ ] 👤** Not ticked; it needs eyes on the iPad. The harness reads computed
   `text-decoration-line: line-through` on a kept score in four states: at rest, with the caret in
   it, under presentation mode, and under an emulated coarse pointer (44px). Whether it reads as "not
   counted" is for the owner, after a force-quit at v196.
10. **[x]** The section is written.

## Audit result

No reader in `src/` reads a cell's value before its flag, so nothing needed a fix. The full list is
in `TESTING.md` § WO-3.68: engine, signals, graded-pieces and past-due ask the flag first; the counters
count keys; the attendance and IEP uses of `excused` are a different thing.

## Decisions the work order didn't settle

- **The strike keys off `:not(:placeholder-shown)`, not a JS-added class.** Every excused field
  carries the `Ex` placeholder, so any number in one is struck from the first keystroke, whichever
  path put it there. Nothing can forget to add a class. The work order's wording ("on
  `.scores-input.excused` when the cell holds a value") is met by the field's own contents.
- **The legend line was widened rather than added**, to keep `held-readers.mjs`'s key count intact.
- **The trail says "Excused, 62 kept", not "Excused, 62"**: plain text cannot strike, and without
  the word it reads like "Late, 70", a score that counted.
- **Excused → Late** keeps the kept score, which then counts as a late score (`cellFor(value,
  'late')`). **Excused → Missing** clears it (ruling 3). Neither was spelled out; both follow from
  the rulings.

## Out-of-scope temptations, declined

- `index.html`'s Excused button title (*"Drops out of the grade entirely — neither earned nor
  possible."*) and the hint paragraph are still true, but say nothing about the kept score. A
  one-line follow-up if the owner wants the button's tooltip to say "a score in the cell is kept,
  struck through."
- An excused row on the student report and its CSV (see line 4).

## CHANGELOG draft (the teacher's to decide)

> **Excused keeps the score.** Marking a scored cell excused no longer erases the number. It stays in
> the cell, struck through, and still counts toward nothing. Press X again and it counts. Typing into
> an excused cell changes the kept score and leaves it excused. The grade sheet and its CSV print it
> as `Ex (62)`, and the score history says "Excused, 62 kept". Scores erased by earlier builds are not
> recovered.
