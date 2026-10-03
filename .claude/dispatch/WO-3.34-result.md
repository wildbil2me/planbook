# WO-3.34 — student detail draws a points class in a weighted class's words · implementer result

**Every mutation is reverted.** `grep -rn MUTATION src/ index.html` prints one line,
`src/shell.js:963: A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE…`. That is existing prose: `git grep -n MUTATION HEAD -- src/ index.html`
prints the same line at `67b1cc7`. It is not a marker. Each mutated file was restored from a copy in a
`finally`. Each one was compared byte for byte with its pre-round copy and again with a copy taken
before the round. All matched. The scratch harness `tools/verify-scratch-334.mjs` is deleted, and so
is the `git worktree` used for the baseline. Nothing is committed. I did not run `--handoff` or
`--tick`.

## Verification, as run

- **`node tools/verify-shell.mjs`** on the delivered tree printed
  `1665 checks · 1665 passed · 0 failed · 0 skipped`, `53,095 lines · 31.9 lines per check · 696s`,
  `EXIT=0`, on 2026-10-03 with the real clock. It ran after the scratch harness was deleted. I waited
  for the exit and read the summary from the log.
- **`node tools/wo-sweep.mjs`** printed `46 checks · 43 passed · 0 failed · 3 to review`. The three
  reviews are the standing ones: sensitive field names, due date beside late/missing, and mockup
  banners. The due-date hit `src/detail.js:538` is the existing missing-card sentence, moved down by
  the new lines. Before I updated `tools/README.md` the sweep was red on the call-site count (1654
  against 1648 recorded). That is fixed.
- **`node tools/wo-gate.mjs --audit`** printed PASS.
- **Baseline.** A full scratch-harness run on a `git worktree` of `67b1cc7` printed
  `1659 checks · 1659 passed · 0 failed · 0 skipped`, `EXIT=0`. My first baseline attempt captured
  nothing because of a quoting bug in the scratch hook. I fixed it and re-ran. The figure above is
  from the re-run.

## Acceptance, line by line (all five ticked in the phase file; none is 👤 or 📆)

1. **[x] Extra-credit-only category: the column sums to the Overall to the cent, and the row shows
   its earned points and cents. Mutation-proved.** This is a new block at the foot of
   `tools/verify/points-grade.mjs`, on its own class (`c_wo334`) so that WO-3.30's figures do not
   move. Cy has Tests 15/20 and Bonus puzzle 2 (of 0), which is 17/20 = 85.00% by hand. Student
   detail opens from the grid name. The Bonus row reads `Bonus · 0% · 2 / 0 · — · 10.00` and is not
   `.empty`. The printed column sums to 85.00 (75.00 + 10.00) under an Overall of `85.00%`.
   **M1** puts `rowIsEmpty()` back to `percentage === null`, and this check plus line 2's go red. The
   M1 log shows Bonus drawn empty and `"columnSums":"75.00"` under `85.00%`. That is the verifier's
   defect, reproduced.
2. **[x] The same for a `no category` row whose only graded work is extra credit.** Di has Tests 15/20
   and an unfiled 0-point piece scored 2. The row reads `no category · 0% · 2 / 0 · — · 10.00`, and
   the column sums to 85.00 under `85.00%`. M1 turns this red too.
3. **[x] A weighted class's student detail is byte-identical before and after, on the existing
   fixtures.** The method:
   - A scratch copy of `verify-shell.mjs` (deleted afterwards) wrapped `h.evalJs` and `h.clickSel`.
   - After every call, whenever `#detailView` was showing, it recorded two things: the breakdown
     card's `outerHTML` and the whole `#detailContent` `innerHTML`. Repeats were dropped.
   - It ran the full harness on a worktree of `67b1cc7` (17 distinct states) and on the delivered
     tree (19 states, 1665/1665 green).
   - I compared the two sets as exact strings.

   **All 16 weighted states are identical byte for byte.** They are WO-3.7's fixture, including its
   empty Participation category and the rounding student, plus the detail screens that the WO-8.4,
   WO-4.4, WO-4.5, WO-5.3 and WO-5.4 sections open. One base state changed: WO-3.30's points class.
   That change is intended. The two new states are this work order's own fixture. The existing
   `grade-detail.mjs` checks, which pin the weighted figures and wording, are green in the full run.
4. **[x] In a points class, no text on student detail, in the scores hint, or on the assignments
   screen calls the grade weighted or says uncategorized work counts for nothing.**
   - **Measured.** The full text of student detail (both students) and of the assignments list is
     matched against
     `/weight|counts? for nothing|nothing counts|counted by nothing|percent of the grade|redistribut/i`,
     and nothing matches.
   - **Measured.** The breakdown is headed `Category · Share of points · Earned · Category % ·
     Contributes`. The empty Projects row says it "adds no points to either side". The Overall row
     has no weights total.
   - **Measured.** The editor's category options are `— choose a category —, Tests, Projects, Bonus`,
     with no weights.
   - **Measured.** Filing the unfiled piece through the editor's real `<select>` announces
     "Reading challenge now counts in Tests." The unfiling branch is announced as
     "Unit test now counts in no category, and in a class graded on total points it still counts
     toward the grade." That branch is driven through `window.planbook.assignments.setAssignmentCategory`,
     not through the picker, because the picker only offers "no category" to a piece that is already
     unfiled. The harness comment says so.
   - **Read, not measured.** The scores hint is static HTML. I read it, and the harness asserts
     nothing about it. Its refusal now says "In a class graded by weighted categories … until the
     weights total 100% there is no grade at all". A closing sentence describes a points class.
   - **Read, not driven.** The copy dialog's no-categories note and its category labels branch on the
     target class's mode.
   - **M2** (breakdown always in the weighted shape) turns 3 checks red. **M3** (assignments list
     always in weighted words) turns 1 red.
5. **[x] Copying a points class gives a points class, and copying a weighted class writes no
   `gradingMode` key.**
   - Points: the `c_wo334` class is copied through the real class-manager Copy button. The copy has
     `gradingMode: "points"`, and `gradingModeOf()` reads it as points (`points-grade.mjs`).
   - Weighted: the WO-1.22 weighted source is copied, and the copy's own keys are
     `["id","name","archived","terms","categories","letterScale","roster"]` (`copy-class.mjs`).
   - **M4** (the copy drops the mode) turns the points check red. **M5** (the copy writes
     `gradingModeOf(cls)` unconditionally) turns the weighted check red: the copy's keys end in
     `"gradingMode"`.

Mutation table, from the scratch subset `localstorage-prefs` + `points-grade` + `copy-class`
(31 checks, green on the delivered tree):

| Mutation | Result |
|---|---|
| M1 · `rowIsEmpty()` back on `percentage === null` | 2 red: the extra-credit category and the `no category` row |
| M2 · `breakdown(grade, false)`, always the weighted shape | 3 red: both extra-credit checks and the points-wording check |
| M3 · `byPoints = false` in `renderAssignments()` | 1 red: the assignments wording check |
| M4 · `copyClass()` drops the mode line | 1 red: the points copy |
| M5 · `copy.gradingMode = gradingModeOf(cls)` unconditionally | 1 red: the weighted copy carries the key |

## Decisions the work order did not settle

- **The empty test.** `rowIsEmpty()` returns `percentage === null && contribution === null`, not
  `contribution === null` alone. When a grade exists, the two agree in both modes. They disagree in
  one reachable weighted state: weights total 100, but every graded category has weight 0. Then
  there is no grade and no contributions, but the rows do have percentages. A test on contribution
  alone would relabel those rows "nothing graded in it yet", which is false, and it would break
  line 3's byte-identity in that state. With the combined test, a row that is handed cents is never
  drawn empty, which is what the Deliverable asks.
- **The points table has five columns, not six.** *Weight* and *Counts at* are replaced by one
  column, *Share of points*, which is `formatWeight(effectiveWeight)` from `classGrade()`. Nothing on
  the screen is computed. The column sits where Weight stood, so *Earned* stays at index 2 in both
  shapes, and WO-3.30's existing `looseRow[2] === '18 / 20'` assertion still holds unchanged.
  Printing the same `effectiveWeight` in two columns would have been a duplicate column. The Overall
  cell under the share column is blank: `weightTotal` would read as the weights coming back, and
  "100%" would be a sum taken on the screen.
- **Points-mode row wording.** An extra-credit row shows `—` for Category %, because n/0 is not a
  percentage. An empty row reads "nothing graded in it yet — it adds no points to either side until
  something is", with `—` in the share and Contributes cells.
- **Line ~574, the empty-category sentence in `src/assignments.js`.** In points mode there is one
  sentence for every weight, zero or not: "This class is graded on total points, so an empty
  category adds nothing to either side of the grade until something is in it." Neither weighted
  sentence is true there. One says the weight redistributes; the other says it counts for nothing
  *because* it is 0%. In this formula the weight plays no part in the grade, so the sentence names
  no weight at all.
- **I went past the Deliverable's literal list on the assignments screen, and the harness is why.**
  The first run of line 4's check went red on *"weight 50%"*: every category group head carries a
  `cat-chip` whose text is `weight N%`. That is text on the assignments screen telling a points-class
  teacher the grade is weighted. So in points mode:
  - the group head draws no chip (passing `null`, exactly as the *Not in a category* head always has);
  - the editor's category options and the copy dialog's category labels drop the ` — N%` suffix.

  Weighted classes are unchanged. The verifier may read this as scope growth. Line 4 could not be
  met without it.
- **`copyClass()`** follows the booking's proposal, as the brief ruled. It goes through
  `gradingModeOf(cls) === 'points'` rather than copying `cls.gradingMode`. A stray value that reads
  as weighted therefore cannot ride across, and a weighted copy writes no key.
- **New imports.** `src/assignments.js` and `src/classes.js` now import `gradingModeOf` from
  `src/grade-engine.js`. The engine imports only `categories.js` and `letter-scale.js`, and their
  imports (store, modal, live-region, prefs, save-indicator) reach neither file, so no loop is
  closed. Both import comments say so.

## Not done, with the reason (proposed follow-ups)

- **The student CSV has the same defect, and fixing it is a separate edit.** The brief named the
  second `contributionCents()` consumer: `detailModel().share`, which feeds `studentCsv()`.
  `studentCsv()` still uses its own test, `if (category.percentage === null)`. So in a points class
  it writes an extra-credit row as "nothing graded — weight redistributes" with no Contributes cell,
  and the file's column will not sum to its Overall. It also keeps the weighted headers `Weight %`
  and `Counts at %`. My shared helper `rowIsEmpty()` does not reach it. Per the brief I did not edit
  it. It is unreachable until WO-3.31, like the rest of this work.
- **The score grid in a points class still shows weights.** The summary line reads
  `Weights total N%` (`src/scores.js` ~726), and each column's category chip reads `Essays 40%`
  (~460). Only the scores *hint* is in this work order's list. Worth booking beside WO-3.31.
- **The grade sheet** (`src/grades-report.js`) was not read for weight wording in points mode.
- **The *Not in a category* group is still red in a points class.** Its comment justifies the red
  as "this costs the assignment", which is no longer true there. The notice text is fixed; the
  styling is unchanged.
- **Code comments** at `src/assignments.js` ~27 and ~1158 still describe uncategorized work as
  "counted by nothing". They are comments, as the brief noted, and I left them.
- **Seen on a device: nothing.** No line is 👤. Nobody has looked at the five-column points table
  or the new sentences on an iPad, and no harness check measures the points table's width.

## Files changed

- `src/detail.js`: `rowIsEmpty()`, `breakdown(grade, byPoints)`, `pointsRow()`, the points footnote
  and footer, and the `gradingModeOf` import.
- `src/assignments.js`: the `gradingModeOf` import, and points-mode branches for the empty-category
  notice, the unfiled notice, the group-head chip, the editor picker options, the category-change
  announcement, and the copy dialog's labels and no-categories note.
- `src/classes.js`: `copyClass()` carries `gradingMode`, plus the import and the key-by-key comment.
- `index.html`: the scores hint paragraph. `sw.js`: `CACHE` v152 → **v153**.
- `docs/data-model.md`: the copy note in the class sketch, and one bullet under § The second formula.
- `tools/verify/points-grade.mjs`: the WO-3.34 block (5 checks). `tools/verify/copy-class.mjs`:
  1 check.
- `tools/README.md`: call sites 1648 → 1654, plus a WO-3.34 count-history paragraph (executed count
  1659 → 1665, gap still −11).
- `TESTING.md`: § WO-3.34, with the mutation table and the full-run figures.
- `plans/work-orders/phase-3-gradebook.md`: five boxes ticked. The status is left at 🤖 CLAIMED for
  the orchestrator.

## Draft CHANGELOG entry (the teacher's call)

> **A points class reads in its own words (WO-3.34).** Student detail no longer drops extra credit
> from a class graded on total points. A category, or the "no category" row, holding only 0-point
> work used to print a dash while its points counted, so the Contributes column came up short of the
> Overall. It now shows its earned points over 0 and its share of the grade, and the column adds up.
> In a points class the breakdown shows each category's share of the points instead of a weight.
> The assignments screen stops showing weights and stops saying unfiled work counts for nothing,
> because there it counts. The scores help paragraph limits its "no grade until the weights total
> 100%" to weighted classes. Copying a points class keeps it a points class. Nothing changes in a
> weighted class, and no control sets a class to points until WO-3.31.
