# WO-3.36: the score grid, the grade sheet and the unfiled group still speak weights in a points class (implementer result)

**Every mutation is reverted.** `grep -rn MUTATION src tools sw.js index.html` prints 19 lines.
`git grep -n MUTATION 19b7bcd -- src tools sw.js index.html` prints the same 19 at HEAD. All of them
are existing prose, and none is a marker. Each mutated file was restored in a `finally` and matched its
pre-mutation SHA-256. Both scratch harnesses (`tools/verify-scratch-336.mjs` and
`tools/verify-subset-336.mjs`) are deleted, and so is the baseline `git worktree`. Nothing is
committed, and nothing is staged: I staged `src/`, `tools/verify` and `sw.js` as a guard before the
mutation round, then ran `git reset -q` afterwards. I did not run `--tick` or `--handoff`. The status
line is still 🤖 CLAIMED, for the orchestrator.

## Verification, as run

- **`node tools/verify-shell.mjs`** on the delivered tree:
  `1676 checks · 1676 passed · 0 failed · 0 skipped`, `53,385 lines · 31.9 lines per check · 698s`,
  `EXIT=0`, 2026-10-03, real clock. I waited for the exit and read the summary from the log. Five new
  checks, all PASS.
- **`node tools/wo-sweep.mjs`**: `46 checks · 43 passed · 0 failed · 3 to review`. The three reviews
  are the standing ones (sensitive field names, due date beside late/missing, mockup banners). Before
  I updated `tools/README.md` the sweep was red on the call-site count (1665 against 1660 recorded).
  That is fixed.
- **`node tools/wo-gate.mjs --audit`**: PASS.

## Acceptance, line by line (all three ticked in the phase file; none is 👤 or 📆)

1. **[x] In a points class, no text on the score grid or the grade sheet calls the grade weighted or
   prints a weight. Measured.** Three new checks in the WO-3.30 block of `tools/verify/points-grade.mjs`.
   That class's weights total 75, so the old build fails all three: it printed `Weights total 75%` and
   `Essays 40%`.
   - **The score grid.** The check reads the view's `textContent`, every `title` and every
     `aria-label`, with the two static `.scores-hint` paragraphs removed, and matches it against
     `/weight/i`. Nothing matches. The 7 column chips are bare names (`Essays`, `Quizzes`, `Homework`,
     `no category`), and none holds a `<b>` figure. The summary reads
     `Class average 76.98%·2 blanks across 1 assignment·graded on total points`.
   - **The help paragraphs**, which I excluded from the scan above but did not skip. A separate check
     asserts that every sentence in them mentioning weights either names the weighted mode or says a
     points class has none. They are WO-3.34's static, mode-conditional text. The check is loose: it
     pins a few phrases, not the paragraphs.
   - **The grade sheet.** The dialog's text, titles and labels, plus the CSV that
     `gradesCsv(gradesRecord())` returns, match nothing of `/weight/i`, and no column title contains a
     `%`.
   - **WO-3.34's class.** The Bonus chip (weight 0) reads `Bonus` and has class `cat-chip` alone, not
     dashed `.zero`.
   - **Mutations:** M1 (chip always weighted) turns 2 red, M2 (summary always the weights total) turns
     1 red, and M6 (` 40%` added to the sheet's column title) turns 1 red.
2. **[x] The *Not in a category* group is not styled as an error in a points class, and is unchanged in
   a weighted one.** Measured with `getComputedStyle` on WO-3.34's class.
   - **Points class:** class `assign-group-orphan counted`, colour `rgb(138, 109, 26)` on
     `rgb(255, 248, 230)`, border `rgb(240, 223, 168)`. That is the same paint the empty-category
     notice measures on the same page.
   - **The same class made weighted:** I deleted its `gradingMode` key, redrew the list, read the
     notice, and put the key back before the picker steps. It reads class `assign-group-orphan` alone,
     `rgb(192, 57, 43)` on `rgb(253, 234, 234)`, border `rgb(231, 76, 60)`, and its text is
     "...so nothing counts it at all."
   - **Mutations:** M3 (never `.counted`), M4 (always `.counted`) and M5 (the CSS rule deleted) each
     turn 1 red.
   - In code, the weighted className is still the literal `'assign-group-orphan'`. Only
     `byPoints ? ' counted' : ''` was added to it.
3. **[x] A weighted class's score grid and grade sheet are unchanged on the harness's existing
   fixtures.**
   - **Method:** a scratch copy of `verify-shell.mjs` wrapped `h.evalJs` and `h.clickSel`. After every
     call it recorded each distinct `#scoresView` and `#gradesRecordModal` `innerHTML` that was on
     screen.
   - **Baseline:** a `git worktree` of `19b7bcd`, before any edit, printed
     `1671 · 1671 passed · 0 failed`, `EXIT=0`, with 75 states.
   - **Delivered tree:** `1676 · 1676 passed`, `EXIT=0`, with 75 states.
   - **Result:** the 72 weighted states (68 score-grid, 4 grade-sheet) match in sequence and byte for
     byte, after one normalisation. Three WO-3.5 states contain assignment ids that `newId()` mints at
     random on each run (`a_392b3a080z` against `a_1c6l5e2b26`). I renamed each id by its order of
     first appearance. Before that renaming, the ids were the only differing tokens; I diffed the
     states token by token to confirm it.
   - **The points grade-sheet state** was identical too, which is consistent with no change to that
     file's output.
   - **The two points score-grid states** changed, as intended.

## The banner, traced rather than assumed

`classGrade()` sends a points class to `points()` (`src/grade-engine.js:384`, `formulaFor`).
`points()` has one refusal, `noGrade('no-graded-work', …)` at `src/grade-engine.js:353`. Only
`weighted()` returns `'weights-unbalanced'` (line 258). The grid's banner (`src/scores.js`
`paintSummary`) and the sheet's `record.unbalanced` (`src/grades-report.js` `gradesRecord`) both
branch on `probe.reason === 'weights-unbalanced'`, so neither can fire for a points class. The
existing WO-3.30 check, which reads the banner as down on both screens at weights 75, stays green. I
added a comment at each of the two sites citing this. I did not add a mode test, because the engine's
answer already is one.

## Decisions the work order did not settle

- **What replaces `Weights total N%`.** The segment reads `graded on total points`, with no figure.
  That is WO-3.34's phrase ("is graded on total points"), lower-cased to match the summary's other
  segments. Dropping the segment was the alternative. I kept it so the line says *why* there is no
  weights total. No share is computed, per the Traps.
- **The chip in points mode is the name alone.** It shows no share from `pointsShare()`. WO-3.34
  already took the same line on the assignments group head: no chip, and no share. A per-column
  share would repeat across every column of the same category. In points mode the chip also drops
  `.zero`: a dashed chip says "counts for nothing", and in points mode a 0% category's points count.
- **The unfiled notice's points colour is amber, borrowed from `.assign-group-empty`.** It is a
  modifier, `.assign-group-orphan.counted`, rather than a new class. Keeping the base class meant the
  existing WO-3.34 assertion (`querySelectorAll('.assign-group-orphan')`) and every measurement stayed
  as they were. I chose amber, "worth tidying", over neutral grey because filing the work still
  matters: it is how the work gets a named row in the breakdown. Colours are inline hex, not
  variables. The notice is not a control, so the coarse block gains nothing.
- **The grade sheet needed no code change.** In a points class it prints no weight anywhere: not on
  screen, not in titles, not in the CSV. Its banner is unreachable, as traced above. I changed two
  comments only: `categoryNameOf()`'s "counted by nothing", and a note at the probe.
- **The comment at `src/assignments.js` ~27.** The booking said it is about an id from another class,
  not about unfiled work. I read it, and I qualified it anyway, the same way as ~1195, which the
  booking did list. The reason: both comments describe the same hypothetical, a copy carrying a
  foreign `categoryId`. `looseAssignments()` treats such a piece as unfiled (`filed.indexOf(…) === -1`),
  so in a points class it *is* counted. "Counted by nothing" is therefore exactly as mode-dependent
  there as at ~1195. If the orchestrator disagrees, the change is a one-line parenthetical and easy to
  revert.
- **Other stale "counted by nothing" comments I also qualified:** the CSS comment above
  `.assign-group-orphan` (`src/assignments.css`), the `no category` chip comment in `src/scores.js`,
  and the comment at ~609 named in the Deliverable.

## Not verified, and not done

- **Seen on a device: nothing.** No line is 👤. Nobody has looked at the amber notice or the bare-name
  chips on an iPad. The chip's width change (no figure) is unmeasured by any check beyond the existing
  score-grid layout checks, which only run on weighted fixtures.
- **The help-paragraph check is weak by design.** It shows only that the sentences mentioning weights
  are conditional. It does not pin the paragraphs' words.
- **Out-of-scope temptation, declined.** The scores hint paragraph is static HTML that describes both
  modes in every class. A points class could be shown only its own sentence. That would be a
  rewording of WO-3.34's chosen text, and nothing in this row asks for it.

## Files changed

- `src/scores.js`: the `gradingModeOf` import; the column chip's points branch (name only, no
  `.zero`); the summary's points segment; the banner comment citing the engine; the chip comment.
- `src/assignments.js`: the `.counted` modifier on the unfiled notice in points mode; comments at
  ~27, ~609 and ~1195.
- `src/assignments.css`: the `.assign-group-orphan.counted` rule; the comment above
  `.assign-group-orphan`.
- `src/grades-report.js`: comments only, at `categoryNameOf()` and at the probe.
- `sw.js`: `CACHE` v154 → **v155**.
- `tools/verify/points-grade.mjs`: 5 new checks, plus wider reads in the WO-3.30 grid and sheet
  evaluations.
- `tools/README.md`: call sites 1660 → 1665, plus a WO-3.36 count-history paragraph (executed count
  1671 → 1676, gap still −11).
- `TESTING.md`: § WO-3.36, with the mutation table and the run figures.
- `plans/work-orders/phase-3-gradebook.md`: three boxes ticked. Status left at 🤖 CLAIMED.

## Draft CHANGELOG entry (the teacher's call)

> **A points class's score grid speaks its own words (WO-3.36).** In a class graded on total points
> the score grid no longer shows weights. Each column's category chip shows the category name with no
> percentage. A 0% category is no longer drawn as if it counted for nothing. The line under the grid
> says "graded on total points" where a weighted class says "Weights total 100%". The *Not in a
> category* notice on the assignments screen is amber rather than red in a points class, because there
> that work counts. It is still asking for a category, but nothing is lost. The grade sheet was checked
> and already said nothing about weights. Nothing changes in a weighted class, and no control sets a
> class to points until WO-3.31.
