# WO-3.38 — result (implementer, Claude Opus, 2026-10-03)

**Summary.** I followed the owner's ruling (b). Student detail now works out, from the cells it already reads, whether a row holds graded work. `src/grade-engine.js` is untouched: `git diff src/grade-engine.js` prints nothing. In a points class, a row whose only graded work is a bonus graded at 0 is no longer called empty, on screen or in the CSV. A student whose only graded work is that 0 is no longer told there is no graded work. A weighted class never calls the new function. **Both Acceptance lines are met, and I ticked both.** There are no 👤 lines. Nothing is committed.

## What changed

- **`src/detail.js`**
  - **`gradedPieces(doc, cls, termId, studentId)`**: the one function the owner's ruling asks for. It walks the class's assignments in the term and reads this student's cell on each. It returns `{ ids: [filed category ids holding a graded piece], loose: bool }`.
    - It is a yes/no per row, never a sum. It reads a score only to check whether one is present. It computes no earned, no possible and no percentage.
    - Filed and unfiled work are told apart the way the engine's `looseAssignments()` does it.
  - **`rowIsGraded(category, graded)`**: looks a grade row up in that answer. The `no category` row has `id: null`.
  - **`rowShowsEmpty(category, byPoints, graded)`**: `rowIsEmpty()` and no graded cell. This is the one test both `breakdown()` and `pointsSection()` use, so the screen and the file cannot disagree. In a weighted class `graded` is `null`, so this is exactly `rowIsEmpty()`.
  - **`noGradeMessage(grade, graded)`**: returns the engine's own `message` in every case except one. That case is a points class with reason `no-graded-work`, every row empty by the engine's numbers, and something graded anyway. Then it returns *"The only work graded so far is extra credit, graded at 0, so there is no grade yet."* Both the to-move card and the hero's `aria-label` use it. Those are the two places the engine's sentence was printed. The CSV never printed it.
  - **New row wording**: *"extra credit, graded at 0 — it adds no points to either side"*. It never says the 0 "adds" anything.
    - **On screen**: the row is not `.empty`. It shows `— · 0 / 0 · <sentence>` and has no cents. This holds both with a grade and without one.
    - **In the CSV**: `Bonus,,0,0,<sentence>,`.
  - **Wiring**: `renderDetail()` computes `graded` only when `gradingModeOf(cls) === 'points'`, and passes it to `breakdown()` and the to-move card. `detailModel()` gains `graded` (`null` in weighted mode), and `studentCsv()` passes it to `pointsSection()`.
  - **Imports**: `categoriesOf` is now imported from `./categories.js`.
- **`sw.js`**: `CACHE` bumped from `planbook-shell-v156` to `v157`.
- **`tools/verify/points-grade.mjs`**: WO-3.34's class gains five students, and three `check()` calls follow the WO-3.35 extra-credit-only check. Details are under Acceptance 1.
- **`tools/README.md`**: call-site count changed from 1667 to 1670, plus a WO-3.38 paragraph with the executed count (1678 to 1681) and the run figures.
- **`TESTING.md`**: new § WO-3.38 with the evidence for both lines and the mutation table.
- **`plans/work-orders/phase-3-gradebook.md`**: both Acceptance boxes ticked, each with a dated evidence note. I did not touch the Status line (it still reads 🤖 CLAIMED).

## A decision the work order left open: what counts as "graded"

The brief said "scored means a score is present". It also said to match the gradebook's own definition in `docs/data-model.md` and `src/past-due.js`. I used the cell rule from `docs/data-model.md` § Grade math and `src/scores.js` `isUngraded()`:
- **A value is graded**, with or without `late`.
- **`missing` is graded.** It is a marked zero, the teacher's decision, and the engine counts it. So a `missing` mark on a bonus also reads "graded at 0". That is why the wording says "graded", not "scored".
- **`excused` is not graded.** It drops out of the grade in both directions.
- **A blank is not graded.** That means no key, or a cell with neither a value nor a meaningful flag, including a `late` with no score yet.

The comment above `gradedPieces()` states all four. **If you read "a score is present" strictly, so that `missing` should not count, it is a one-line change.** The harness fixture does not exercise `missing` either way.

## Acceptance, line by line

### 1. In a points fixture, a student whose only graded work is a bonus scored 0 is not told, on screen or in the CSV, that nothing is graded. Mutation-proved. — MET, ticked

The fixture is the WO-3.34 class in `verify/points-grade.mjs`, plus five students:
- **Fi**: Bonus `{ v: 0 }`, nothing else.
- **Iz**: `{ v: 0 }` on the unfiled zero-point piece.
- **Jo**: Tests 15/20 and Bonus `{ v: 0 }`.
- **Gus**: Bonus `{ v: null }`.
- **Hal**: Bonus `excused`, and a scoreless `late` on the unfiled piece.

The three checks:
- **Check 1 (Fi and Iz).** The engine still hands back `no-graded-work` / *"There is no graded work yet."*.
  - Fi's Bonus row is not `.empty` and reads exactly `['Bonus','—','0 / 0', ZERO_SAY]`.
  - Tests and Projects are empty.
  - The to-move card contains the zero sentence, and the hero label is exactly `No grade — <zero sentence>`.
  - Nothing on the page matches `/nothing graded|no graded work|nothing is graded|nothing has been graded/i`, with empty rows and the breakdown footnote removed as before. Neither do the card or the label.
  - The CSV Bonus row is `['Bonus','','0','0',ZERO_SAY,'']`, no other file row says "nothing graded" except the truly empty ones, and the Overall grade is blank.
  - Iz has no `no category` row, because the engine draws none for a 0/0. Every row is empty, and the card and label carry the zero sentence.
- **Check 2 (Jo).** 75.00% by hand (15/20).
  - The Bonus row is `['Bonus','—','0 / 0', ZERO_SAY]` with no cents.
  - The Contributes column sums to 75.00 under 75.00%, on screen and in the file.
  - The file's Bonus row is `['Bonus','','0','0',ZERO_SAY,'']`.
- **Check 3 (Gus and Hal), which covers the Trap.** Every row is empty.
  - The Bonus row reads *"nothing graded in it yet …"* on screen and in the file.
  - The card and label say *"There is no graded work yet."*, never the zero sentence.

**Mutation round.** I used a scratch copy of the entry harness holding only `localstorage-prefs` and `points-grade` (29 checks, all green on the delivered tree). Each mutation carried a `MUTATION` marker. After each, I restored `src/detail.js` from a saved copy and checked its SHA-256 against the pre-mutation bytes (`b5db2e73…`, identical each time).

| Mutation | Result |
|---|---|
| M1 · `gradedPieces()` ignores a scored 0 (`if (cell.v === 0) return;`) | **2 red**: checks 1 and 2 |
| M2 · blank test deleted, so a cell with no score counts as graded (the Trap) | **1 red**: check 3 |
| M3 · `pointsSection()` handed `null` instead of `model.graded` | **2 red**: checks 1 and 2. The failure detail shows the file's Bonus row reading "nothing graded" while the screen was right |
| M4 · `noGradeSays = grade.message` (the engine's sentence left on screen) | **1 red**: check 1 |

**Reverts confirmed.** After the round, `grep -rn MUTATION src tools` prints 19 lines. `git grep -n MUTATION HEAD -- src tools` prints the same 19, and I diffed the two lists: identical, all of them prose rather than markers. The scratch harness (`tools/wo338-scratch-harness.mjs`) is deleted.

### 2. A weighted class's student detail and CSV are byte-identical before and after, on the harness's existing fixtures. — MET, ticked

**How I captured them.** I added two temporary lines:
- One at the foot of `renderDetail()`. When the class was not points mode, it logged `{ class id, student id, #detailContent.innerHTML, studentCsv(detailModel()).text }`.
- One in `verify-shell.mjs`'s summary, which wrote those console lines to a scratch file.

**The two runs.**
- **Before**: a `git worktree` of `HEAD`, with the instrumentation and no `src/` edit. `1678 checks · 1678 passed · 0 failed · 0 skipped`, exit 0.
- **After**: the changed tree with the same instrumentation. `1681 checks · 1681 passed · 0 failed · 0 skipped`, exit 0.

**The comparison** was run by a script, not reasoned. Each run produced 45 renders across seven weighted classes: `c_b1, c_wo37, c_wo84, c_wo44, c_wo53, c_wo54, c_wo45`.
- **CSV: 45 of 45 byte-identical, raw.**
- **HTML: 37 of 45 byte-identical, raw.** The other 8 match once two run-minted values are normalised:
  - the avatar colour class, which `avatarClass()` hashes from a student id the run mints at random;
  - the wall-clock time on hall passes the run itself starts (*5:09 PM* in one run, *5:24 PM* in the other).

  After those two normalisations, 45 of 45 match and nothing else differs.

**Cleanup.** Both temporary lines are gone: `src/detail.js` and `tools/verify-shell.mjs` match the saved delivered copies, and `grep -rn WO338 src tools` is empty. The worktree is removed.

## Commands, as I read them

- `node tools/verify-shell.mjs` on the delivered tree, after the instrumentation came out: **`1681 checks · 1681 passed · 0 failed · 0 skipped`, 53,513 lines, 31.8 lines per check, 710s, EXIT=0.**
- `node tools/wo-sweep.mjs`: **`46 checks · 43 passed · 0 failed · 3 to review`, EXIT=0.**
  - The three reviews are the standing ones: sensitive field names, due-date with late/missing, and the mockup banner.
  - The `src/detail.js:682` hit in the second is a pre-existing sentence whose line number moved.
  - The call-site check reads 1670, matching `tools/README.md`.
- `git diff src/grade-engine.js`: empty.

## What I could not verify

- **The screen on a real iPad.** No 👤 line exists, and none was claimed.
- **Whether the sentences read well to a teacher.** That needs human eyes. The harness proves only which sentence appears where.

## Proposed follow-ups (not done, out of scope)

1. **The quiet list still prints the false sentence for this student.** The harness logs it without asserting it: *"In WO-3.34 Points, Fi Dunmore has no graded work yet and nothing has been written down, said or sent about them all term — 32 days."*
   - `quietSentence()` in `src/signals.js` keys on the engine's *"There is no graded work yet."*, which is still what the engine says for Fi.
   - I did not touch `src/signals.js`, as the brief said.
   - A fix would have to reach the same fact from `src/signals.js`, either by asking a shared reader or through an engine change. Under (b) that is the owner's call.
2. **One edge `noGradeMessage()` does not cover**, stated in its comment:
   - The case is extra credit scored +2 in one category and −2 in another, with nothing else graded.
   - The engine's earned nets to 0, so it says nothing is graded.
   - Rows here are not empty, so the screen keeps the engine's sentence.
   - Only negative extra credit in two places at once gets there.
3. **A loose (no category) bonus graded at 0 gets no row.** The engine draws a `no category` row only when it has non-zero earned or possible, and (b) forbids changing that. Only the no-grade sentence carries it (Iz), and the CSV has no row for it. Every category row in that file says "nothing graded", which is true of those categories.

## Conventions set

- I added `rowShowsEmpty()` beside `rowIsEmpty()` rather than widening `rowIsEmpty()`. `rowIsEmpty()` stays a pure reading of the engine's numbers, which `pointsRow()` and `noGradeMessage()` still need. `rowShowsEmpty()` is the question the screen and the file draw by.
- `graded` is `null`, not an empty answer, in a weighted class. That keeps "a weighted class never asks" structural: every new branch is gated on it.

## Draft CHANGELOG entry (for the teacher to accept, edit or drop)

> **Student detail no longer calls a bonus graded at 0 "nothing graded"** (WO-3.38). In a class graded on total points, a 0 on extra credit is 0 out of 0, the same as a blank, so the grade could not tell it had been graded. The student detail screen and its CSV now check the cells themselves. A row like that reads "extra credit, graded at 0 — it adds no points to either side", and a student whose only graded work is that 0 is told so, not that nothing is graded. The grade itself is calculated exactly as before. A blank cell is still ungraded, and weighted classes are unchanged byte for byte.

## Files changed

- `c:\dev\planbook\src\detail.js`
- `c:\dev\planbook\sw.js`
- `c:\dev\planbook\tools\verify\points-grade.mjs`
- `c:\dev\planbook\tools\README.md`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md`
- `c:\dev\planbook\.claude\dispatch\WO-3.38-result.md` (this file)
