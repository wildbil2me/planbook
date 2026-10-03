# WO-3.35 — implementer's result

**Implementer** Claude Opus (work-order-implementer), 2026-10-03. Nothing committed. `--start`, `--release`,
`--handoff` and `--tick` not run. The four Acceptance boxes in `plans/work-orders/phase-3-gradebook.md`
are ticked, because each has a harness check I watched pass and watched go red under mutation. There are
no 👤 or 📆 lines on this row. The status still reads `🤖 CLAIMED`.

## What was built

- **`rowIsEmpty(category, byPoints)`** (`src/detail.js`). It now takes the mode. In a points class a row
  is empty when `earned === 0 && possible === 0`. That is the same test the engine's `points()` uses to
  skip a row before it hands out shares. Whenever there is a grade it gives the same answer as the old
  two-null test. It differs only when total possible is 0. The weighted branch is the old test,
  unchanged. Both the screen (`breakdown()`) and the file (`studentCsv()`) call it, so there is no
  third copy.
- **Two shared sentences**, `POINTS_EMPTY_SAY` and `POINTS_BONUS_ONLY_SAY`. The screen and the CSV use
  the same strings.
- **`pointsRow()`** has a new case. If a row has points but no contribution (only possible when the
  student has no grade because all her graded work is extra credit), it shows `— · 2 / 0` and then
  *"extra credit — it counts once there is work worth points for it to add to"* in the caution wash
  across the last two columns.
- **`detailModel()`** gains `byPoints`. **`studentCsv()`** sends the category section to one of two
  functions:
  - `weightedSection()` is the old code moved into a function. Its only change is `rowIsEmpty(c, false)`
    in place of `percentage === null`, which gives the same answer in weighted mode.
  - `pointsSection()` writes six columns: `Category, Share of points %, Earned, Possible, Category %, Contributes`.
    The share comes from `effectiveWeight` and the cents from `model.share` (`contributionCents()`, the
    screen's allocation). Number columns are left blank rather than dashed. The two sentence rows put
    their sentence in the Category % cell, the same place the weighted file puts its own.

  The export works out no share and no sum.
- **`src/grade-engine.js` `points()`**: the no-grade *message* changes when `earned !== 0`. It now
  reads *"The only work graded so far is extra credit, so there is no grade yet for it to add to."*
  `reason` stays `no-graded-work` and the returned shape does not change. **This is a decision; see
  below.**
- `sw.js` `CACHE` is now `planbook-shell-v154`.

## Acceptance, line by line

1. **[x] In the points fixture, the CSV's Contributes column adds up to its Overall grade to the cent,
   for the extra-credit category and for the `no category` row. Mutation-proved.**
   - The checks are in `tools/verify/points-grade.mjs`, WO-3.34's block. The CSV is read through
     `detailModel()`/`studentCsv()` straight after each student's screen.
   - **Cy:** `Tests,100,15,20,75.00%,75.00` and `Bonus,0,2,0,,10.00`, which sum to 85.00 under
     `Overall grade,85.00%`.
   - **Di:** `no category,0,2,0,,10.00`, also 85.00.
   - A further check confirms the file's Contributes cells match the screen's, row by row.
   - **Mutation M1** (the CSV's empty test put back on `percentage === null`) turned 4 checks red.
     **Mutation M2** (the CSV always weighted) turned 5 red.
2. **[x] A points-class CSV contains no `Weight %`, `Counts at %` or "redistributes".**
   - Checked on all three fixture students' files, against those two strings and against WO-3.34's
     whole weight-word regex.
   - The header row is asserted exactly, and every row is six cells.
   - M2 turns this red.
3. **[x] A weighted class's CSV is byte-identical before and after.**
   - **Before any `src/` edit**, on `9a40109` (1665 · 1665 passed), I added a temporary env-gated dump
     to the two harness files. A full run wrote the CSVs of both WO-3.7 students and WO-4.4's logged
     student to my scratchpad.
   - A full run on the changed tree (1671 · 1671) dumped them again, and `cmp` said all three were
     identical.
   - The dump lines are removed: `grep WO335` finds nothing.
   - I left a permanent pin in `tools/verify/grade-detail.mjs`. Both WO-3.7 files are pinned byte for
     byte, with only the export date masked.
   - **Mutation M5** (a period added to the weighted empty-row sentence) turned only that pin red, 1 of
     1671. The older `/redistribut/` check stayed green.
4. **[x] A points-class student whose only graded work is extra credit is not told, on screen or in the
   CSV, that nothing is graded.**
   - The fixture student is new: Ed, with Bonus 2 of 0 and nothing else.
   - On screen, his Bonus row is not `.empty` and reads `Bonus · — · 2 / 0 · extra credit — …`.
   - I took the page with its empty rows and the breakdown's footnote removed, plus the to-move card
     and the hero's `aria-label`. None of them matches `/nothing graded|no graded work|nothing is graded|nothing has been graded/i`.
   - In the CSV, his Bonus row carries the same sentence and his Overall grade is blank. The only rows
     saying "nothing graded" are Tests and Projects, which have nothing earned and nothing possible.
   - **M3** (`rowIsEmpty` without its points branch) turned this check red, and so did **M4** (the
     engine message back to the old text).

All mutations were reverted in a `finally`, and each file was checked against its pre-mutation SHA-256.
`grep -rn MUTATION src/ index.html sw.js` finds only the prose line at `src/shell.js:963`, which was
already there before this work. Neither harness file I touched contains the word. The scratch harness
`tools/_wo335-scratch.mjs` (just `localstorage-prefs` and `points-grade`, used for M1–M4) is deleted.

## Final runs (the output I read)

- `node tools/verify-shell.mjs`: `1671 checks · 1671 passed · 0 failed · 0 skipped`, 53,270 lines, 31.9 lines per check, 686s, exit 0.
- `node tools/wo-sweep.mjs`: `46 checks · 43 passed · 0 failed · 3 to review`. These are the three
  standing reviews; the `src/detail.js:574` hit is the existing "Missing is marked by you" line.
- The sweep first went red on the `check()` call-site count. `tools/README.md` now says **1660**,
  taken from the sweep's own output, and has a WO-3.35 paragraph.

## Decisions the work order did not settle

- **I changed the engine's message, not its shape.** The to-move card prints `grade.message`, and the
  hero's `aria-label` is `'No grade — ' + grade.message`. So "There is no graded work yet." was a
  visible, false sentence about this student on student detail. Fixing it once in `points()` keeps a
  single source. The other options were overriding it in `detail.js`, which would be a second opinion
  about the grade, or leaving it, which fails line 4. A side effect: `src/grades-report.js:443` uses
  the same message in its own aria-label, so that label also becomes true for this student. The
  weighted message and every `reason` value are unchanged.
- **The extra-credit-only row's wording** is *"extra credit — it counts once there is work worth points
  for it to add to"*. It avoids "nothing graded" and invents no figure. The row shows no share and no
  cents because the engine gives it neither.
- **The CSV's points columns** are the weighted file's columns minus *Counts at %*, with *Share of
  points %* where *Weight %* was. That matches how the screen's five columns relate to its six. Earned
  and Possible stay in separate columns, as the weighted file already has them. An n/0 *Category %*
  is blank in the file where the screen shows "—", following the existing rule that a number column
  never gets a non-number.
- **The breakdown's points footnote** ("A category with nothing graded in it adds nothing to either
  side") is a definition shown for every student. I left it alone and kept it out of the line-4 scan,
  which is stated in the check's comment and in `TESTING.md`.
- **The engine reports nothing for a scored 0 on extra credit.** A bonus piece scored 0 gives earned 0
  and possible 0, the same as a blank. The engine (whose shape I may not change) cannot tell them
  apart, so such a row still reads "nothing graded in it yet". I did not fix this; it is a note for
  whoever owns the engine.

## What I could not close / did not do

- I took no device reading. None is owed: there is no 👤 line, and nothing reaches the mode until WO-3.31.
- `CHANGELOG.md` is untouched. Draft below.
- Nothing is staged or committed. I staged temporarily during the mutation round and reset the index
  afterwards.

## Files changed

- `src/detail.js`
- `src/grade-engine.js`
- `sw.js`
- `tools/verify/points-grade.mjs`
- `tools/verify/grade-detail.mjs`
- `tools/README.md`
- `TESTING.md` (new § WO-3.35)
- `plans/work-orders/phase-3-gradebook.md` (four boxes ticked; the row was already 🤖 CLAIMED)
- `.claude/dispatch/WO-3.35-result.md` (this file)

## Draft CHANGELOG entry (the teacher's call)

> **A points class's student CSV adds up, and extra credit alone is not "nothing graded".** The
> per-student file for a class graded on total points now has the screen's columns (a share of points
> in place of weights, no "counts at", no "redistributes"), and its Contributes column adds up to the
> Overall grade with extra credit in it. A student whose only graded work so far is extra credit is
> told so, on screen and in the file, rather than that nothing is graded. Weighted classes' files are
> byte-for-byte unchanged. Nothing a teacher can reach yet: points mode arrives with WO-3.31.
