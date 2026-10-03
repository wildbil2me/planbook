# WO-3.28: the score grid narrows to one category. Implementer's result

**Status of the tree:** built, and nothing committed.

- **Full harness:** `node tools/verify-shell.mjs` ran to completion on the delivered tree and printed `1639 checks · 1639 passed · 0 failed · 0 skipped`. That is 52,135 lines in 678s, exit 0, on the real clock, 2026-10-02.
- **The run before that one was red.** It printed `1639 · 1637 passed · 2 failed`. The failures were a harness defect I introduced and then fixed; see "One defect my own harness caused" below.
- **Sweep:** `node tools/wo-sweep.mjs` printed `45 checks · 42 passed · 0 failed · 3 to review`, the same three reviews as before this work order.
- **Audit:** `node tools/wo-gate.mjs --audit` passed.
- **Phase file:** I ticked seven Acceptance boxes, each against a named check. The 👤 box is still open, and the status line is still `🤖 CLAIMED`.
- **Not written:** the CHANGELOG entry.

## Against the Acceptance list

**1. [x] Only the category's columns are in the DOM, and Tab, → and Enter stop at the last shown column and row.**
- **Columns:** with *Quizzes* picked, `#scoresHead` names exactly `wo329-a2` and `wo329-a4`. No `[data-score-cell]` anywhere on the page belongs to another assignment, including `wo329-a5`, which is filed under a category the class does not have.
- **→:** walks Bell's row to the second quiz. Pressed again there, it stays and says "Marcus Bell: that is the last assignment."
- **Tab from the last shown column** goes to Castillo's name door, then to Castillo's first quiz. It never reaches an essay or the loose sheet.
- **Enter** down the second quiz goes Reed → Shah. Pressed again it stays on Shah and says "Quiz two: that is the last student. 3 of 6 entered."
- All of these were real keys sent over CDP, in `verify/score-search.mjs`.
- **What is read rather than pressed:** Tab off the very end of the last row. The check asserts that the last score field in document order, which is Tab's order, is Shah's second quiz, out of 12 fields.
  - Pressing that Tab for real takes focus off the page in headless Edge, and it broke a later section (see below).
  - So "the last shown row" half of Tab rests on a DOM read, not a keystroke.
  - Tab is the browser's own, not bound by `src/scores.js`. Its "edge sentence" is not something the grid speaks; WO-3.5 deliberately leaves Tab unbound. → and Enter do speak it, and those are asserted.

**2. [x] The third column equals `categoryPercentage()`, and the summary is their class mean. Mutation-proved.**
- **The check:** expected strings are computed in the page from `window.planbook.gradeEngine.categoryPercentage()` and formatted to two places. They are compared, student by student, with the drawn column.
- **Reed** has no quiz graded. He shows the em dash and is left out of the mean.
- **Summary:** *Quizzes average* is 67.33%, the mean of the five figures.
- **The fixture tells arithmetics apart.**
  - It has a `missing` mark and an `excused` mark, students with different possible points, and 60/40 weights.
  - So a pooled earned/possible across the class (66.00%) is a different number.
  - So is a mean of typed scores that ignores the marks.
  - So is the overall grade.
- **Mutations:**
  - M1 fed the column `weightedClassGrade()`.
  - M2 counted a student with no figure as 0 in the mean.
  - M10 fed the column a per-assignment mean that ignores missing and excused.
  - Each one turned this check red.
- **The rule I used for the summary**, as the brief asked: the mean of the per-student `categoryPercentage()` figures over the students who have one.
  - It is not a pooled sum.
  - It is the existing `classAverage()`, which now takes a per-student figure function. It is not a new helper.

**3. [x] With a category picked, a focused cell is never under the three frozen columns, on both pointers.**
- **What ran:** WO-3.27's `focusDefect()` in `verify/score-grid.mjs`, re-run with the *Tests* pill on. Tests holds 8 of the 10 columns.
- **Fine pointer:** real Shift+Tab, ← and Enter, at 1024×768. At 1200 the eight columns barely overflow the box, so the check could not have failed there.
- **Coarse pointer:** the same three keys, at 1024×768.
- **Frozen edge:** `BOX` now reads it from the category average's head when that column exists.
- **Declarations:** a check reads `.scores-cat-avg` `left` = name + grade, and `.scores-grid-wrap.filtered` padding = that + 84. It reads both in the base rules and again in the coarse block.
- **Mutation M6** deleted both `.filtered` rules. It turned 5 checks red: the declaration check, plus Shift+Tab and ← on both pointers.
- **A change to WO-3.27's own check came out of this.** On M6's first run the coarse pair stayed green. `focusDefect()` was choosing its target as the column whose head was under the frozen edge, and at coarse that column's field (the input, ~20px inside the column) was already in view.
  - The target is now the column whose field in row s05 is under the edge.
  - WO-3.27's own mutation (M9, `scroll-padding` deleted) was re-run after the change. It still turns all of WO-3.27's driven checks red, and `revealScoreColumn()` too.

**4. [x] Class average, blank count and every overall grade are byte-identical with the filter on and off.**
- The summary text with *Quizzes* picked, less the category's own figure and its separator, equals the summary with *All*.
- The headline and all six grade cells are identical too.
- Mutation M7, blanks counted over the picked columns only, turned this red.

**5. [x] The two filters together.**
- *ma* with *Quizzes* picked shows Bell, Johnson and Reed and the two quiz columns, with the third column.
- Emptying the box brings back six rows and keeps the quiz columns.
- *All*, with *ma* still typed, brings back all five columns and keeps three rows.
- *Work*, with *ma* typed, narrows to the two essays and leaves the rows unchanged.
- Mutation M8, where a pill empties the search, turned this red.

**6. [x] Coming back shows *All*, and the pills wrote no `planbook_` key.**
- I left with *Work* picked and *ma* typed, went to Attendance, and came back. *All* was pressed, every column was drawn, there was no third column and no `.filtered`.
- The `planbook_` keys and their values were identical before the first pill tap and after the last.
- Mutation M4, the pill stored and restored, turned this red. So did M5, the arrival reset removed.

**7. [x] Pills ≥44px under the coarse pointer.**
- *All* measured 48.33×44, *Work* 63.2×44 and *Quizzes* 75.91×44, on the open grid with the coarse pointer emulated.
- The height comes from `.pill`'s own coarse rule in `src/shell.css`.
- The WO-3.5 sweep of every control on the open grid now includes the WO-3.5 fixture's pills, and it stayed green.

**8. [ ] 👤 iPad portrait, three frozen columns under a thumb.** Not checked; this needs the real iPad. The shell cache is now `planbook-shell-v150`, so force-quit from the app switcher before reading.

## Mutation round

- **Setup:** 10 mutations, each marked `MUTATION`. Each ran against a scratch harness holding only `localstorage-prefs`, `score-grid` and `score-search`, which gave 125 checks, all green on the clean tree, in 62s.
- **Restore:** each file was put back from a copy and `cmp`-checked.
- **A restore failure.** The first runner crashed during M3 on a Windows console encoding error, and it crashed before its restore step. That left `src/scores.js` mutated.
  - `grep -c MUTATION` caught it immediately.
  - I restored it from the pre-round copy and `cmp`-checked it.
  - M3 onward were re-run with the restore in a `finally`.
- **Final state:** `src/scores.js`, `src/scores.css` and `src/shell.js` are byte-identical to the pre-round copies. `grep -rn MUTATION src tools index.html sw.js design` finds only existing prose; none of the lines are mine. The scratch harness `tools/zz-wo328-scratch.mjs` is deleted.
- **Results:** every mutation turned at least one check red. The table, with the counts, is in `TESTING.md` § WO-3.28.

## One defect my own harness caused, found and fixed

**What happened.** The first full run failed 2 checks in `verify/date-zero-key.mjs`, two sections after mine. `09032026` landed as *32026-11-09*.

**How I traced it.**
- That section passes when `score-search` does not run in front of it.
- It passes behind HEAD's `score-search` with my `src/`.
- It fails behind my `score-search`.
- Removing the keyboard block from my `score-search` made it pass.

**The cause.** A real Tab from the grid's very last field takes focus off the page in headless Edge; nothing focusable follows the grid. The page does not get focus back across the reloads that follow. After that, the date section's ArrowLefts no longer walk the caret to the month segment.

**The fix.** That one press is now a DOM read. A comment at the read explains why, so the press does not come back. The second full run is the green one.

Nothing in `src/` was involved. It is worth knowing as a CDP trap: *never Tab off the last focusable element on the page*. Its rule is that an entry is admitted after two hits by two agents, and this is the first, so I did not add it to `tools/README.md`'s numbered trap list.

## Decisions the work order didn't settle

- **The pills sit between the search box and the count, not after the count.**
  - This departs from the Deliverable's literal text ("after the search box and its count").
  - The count is drawn only while the box holds text, and it carries `margin-left: auto`. Pills after it would sit beside the box while it is empty, then jump to the far end of the row at the first letter typed.
  - The order I used is the drawing's laptop frames and `.attendance-toolbar`'s.
  - This is argued in `index.html` at the toolbar, in the banner of `design/mockups/proposed-scores.css`, and in a Built caption in `score-tools.html`.
  - The cost: at narrow widths the count wraps after the pills rather than staying beside the box, which was the 768 frame's concern.
- **The category average shows while the weights do not total 100.** A category's percentage does not depend on the weights, and `categoryPercentage()` answers it regardless. The overall grade still shows nothing, under its banner. The student detail shows no breakdown in that state, so a teacher could see a figure here and none there. I judged that acceptable, since no number disagrees with another, but it is a judgement call.
- **A hovered row keeps the category average's wash.** I added one rule for this. Without it, `tr:hover td` would remove the wash, and the wash is what marks the column as not-the-grade.
- **Both head labels step up one size under a coarse pointer** (`-name` 12px, `-sub` 11px), as the assignment heads beside them do. Without that, the sweep raised a fourth "no coarse-block rule" review. The drawing's coarse block steps only the figure.
- **A picked category that loses its last assignment, or a term switched under the grid, goes back to *All*** at the next render. A pill that is not drawn cannot be the one that is on.
- **There are no pills at all when no category has work.** That is the case where all the term's work is filed under no category. *All* alone would be a dead control.
- **Focus after a pill tap.** The pills are rebuilt on every render, so a keyboard user's focus is put back on the pill now standing for the same choice. The tap also announces "Quizzes only, with its average beside the grade." or "Every assignment."
- **The table's screen-reader caption** gains "Showing Quizzes only, with its average beside the grade." while a pill is on.
- **The WO-3.29 fixture was extended rather than a second class planted.**
  - It gained three categories: Work and Quizzes at 60/40, and Homework at 0 with no work.
  - It gained three assignments, one of them under no category.
  - It gained quiz cells marked missing and excused.
  - Every WO-3.29 check still passes unedited apart from the fixture.

## Declined (out of scope)

- **The drawing's assignment count beside the student count** (`5 of 12 assignments`). No Deliverable names it, and the pressed pill already says what is showing. It is noted in the banner and the Built caption.
- **The printed grade sheet** needed nothing. `src/grades-report.js` imports `gridOrder`, `formatPercent` and `scoreMark` from `src/scores.js` and nothing that reads the filter state. I checked this by reading the code, not with a harness check.

## Bookkeeping

- `tools/README.md`: the call-site count went 1612 → 1627. I added a WO-3.28 paragraph: 15 sites, 15 results, the gap stays at −12, and the run line is quoted from the green run.
- `TESTING.md` § WO-3.28: the ticks, the mutation table, the `focusDefect()` target change, and the Tab-off-page note.
- `sw.js`: `CACHE` v149 → v150.
- **Line endings.** Three of my Python writes turned LF files into CRLF: `TESTING.md`, `plans/work-orders/phase-3-gradebook.md` and `tools/README.md`. I caught it on the diffstat (29,869 lines on `TESTING.md`) and converted all three back to LF. The diffstat now shows only real changes: 786 insertions and 36 deletions across 12 files. Worth a glance before committing.

## Files changed

- `src/scores.js`: category state, pills, the third column, the summary figure, and the `classAverage(students, figureOf)` refactor.
- `src/scores.css`: `.scores-filter-pills`, `.scores-cat-avg*`, `.scores-grid-wrap.filtered`, the hover wash, and the coarse lines.
- `src/shell.js`: the inventory row, the click route, and the arrival reset.
- `index.html`: the pill host in the toolbar.
- `sw.js`
- `design/mockups/proposed-scores.css`: banners and index amended. Both sections are now landed and neither carries the `not yet lifted` token.
- `design/mockups/score-tools.html`: a Built caption, and a note on WO-3.29's caption.
- `tools/verify/score-grid.mjs`
- `tools/verify/score-search.mjs`
- `tools/README.md`
- `TESTING.md`
- `plans/work-orders/phase-3-gradebook.md`: seven ticks.

## Draft CHANGELOG entry (the teacher decides)

> The score grid can show one category at a time. Pills beside the search box — All, then each category with work this term — narrow the grid to that category's assignments and add a column beside the grade with each student's average in that category, the figure you check against the SIS. The summary line gains the class's average for it. Nothing else moves: the class average, the blanks and every grade stay the whole class's, and the grid opens on All every time. A name typed in the search box and a picked category work together.

## Correction round 1

**Date:** 2026-10-02. **Status:** done, and nothing committed. The row is still `🔍 AWAITING VERDICT`. No `wo-gate --start`, `--release`, `--handoff` or `--tick` was run. The 👤 line is still `[ ]`.

### The drift: measured, and the hypothesis held

I added a check that measures the drift in `tools/verify/score-search.mjs`. It plants the widest contents each frozen column can be asked to hold:
- Shah at full marks, so both the grade and the Quizzes average read `100.00%` with a letter.
- Quizzes renamed *"Quizzes, tests and every in-class assessment"*.
- A 35-character surname.
- Six more quizzes, so the category scrolls at portrait width.

It then reads every frozen cell in every row, head included, at `scrollLeft` 0 and again at full right scroll. For each cell it asks two things: is its left edge, measured from the box, equal to its computed sticky `left`, and is its rendered width equal to its computed `min-width`?

**On the unfixed tree, in headless Edge:**
- **Name column.** It rendered **285.91px** against a declared 190 (fine pointer, 1024) and **302.28px** against 168 (coarse, 768). So the grade column's natural left sat 96px and 134px past its sticky `left`.
- **Category-average column.** It rendered **247.06px** (fine) and **267.61px** (coarse) against 84.
- **Grade column.** It stayed at exactly 84px, even holding `100.00%`. Segoe UI draws that figure 61.47px wide in a 67px room under the coarse pointer, and 57.38px in 63px under the fine one. This is why no desk run ever showed the defect.

**Verdict: confirmed.** In auto table layout, `width` (here as the border box, because `* { box-sizing: border-box }`) is a floor. Content wider than the declared width widens the column, and that pushes the next frozen column's natural position past its sticky `left`. That column then travels the difference before it sticks.

**One part is inferred, not measured.** I believe the column that grew on the iPad was the grade column, and that iPadOS's wider face overflowed its 67px room. The reasoning is that a wider name column would have moved the grade column as well, and the owner saw the grade hold. Nothing ran on the iPad, so this is not an iPad measurement. I also do not know which value on the owner's screen overflowed.

**Edge reproduces exactly that shape** when the fix is dropped for the grade column alone and every glyph is widened 4px (mutation M3 below):
- The grade column renders at **106.47px**.
- The category average's natural left is **274.47** against its sticky **252**.
- So it travels **22.47px** before it sticks.

### The fix, and why it does not depend on the font

One rule now enforces the widths. It is in `src/scores.css`, under the comment THE WIDTHS ARE ENFORCED:
`.scores-grid .scores-name > *, .scores-grid .scores-grade > *, .scores-grid .scores-cat-avg > * { display: block; width: 0; min-width: 100%; }`

How it works:
- **`width: 0`** means the cell's children add nothing to the column's intrinsic width.
- **`min-width: 100%`** is a cyclic percentage. It resolves against zero while the table sizes its columns, then against the cell once the cell has a width.
- So each column is exactly its declared width, however wide the font draws its contents. The fix makes no assumption about any glyph's width.

What happens to content that is too wide:
- **Figures** spill into the cell's padding. They are never clipped, because a number with its last digit cut off is worse than one that overhangs.
- **Names** trail off with an ellipsis. `.scores-name-btn` already did this. `.scores-cat-avg-name` gained `overflow: hidden; text-overflow: ellipsis` and a `title` holding the full name.
- **The two plain heads.** "Student" and "Grade" were bare text, which no CSS rule can reach. They are now wrapped in spans (`src/scores.js`).

What did not change:
- The six coupled numbers.
- WO-3.27's focus and padding checks, which are all green in the full run.
- No column is hidden with CSS, so the Trap still holds.

**A decision the brief did not settle.** I removed `min-width: 44px` from the coarse `.scores-name-btn` rule.
- The new rule's `min-width: 100%` outranks it, so it would have been a declaration that never applies.
- The button is the column's full 168px wide.
- The coarse rule keeps `min-height: 44px`, and a comment there says why `min-width` went.
- The touch-target sweeps measure the drawn button, and they stayed green.

### The letter

`categoryAverageContent(doc, cls, percentage)` in `src/scores.js` now draws the category figure the way `gradeContent()` draws the grade:
- `.scores-grade-num` holds the figure.
- `.scores-grade-letter` holds `letterFromPercentage(doc, cls, percentage)`, the letter for the category figure itself. It is never the overall grade's letter.
- With no letter scale there is no letter line, the same as the grade cell.
- With no figure it draws the em dash and no letter.

Because both columns use the same classes and metrics, the numbers share one line and the letters the next.

Two related details:
- `.scores-cat-avg .scores-grade-num` keeps the column's quieter ink, `#4a5568`.
- The summary's category class average is unchanged and has no letter.

### Prose corrected

Each of these argued for no letter:
- `src/scores.css`: the `.scores-cat-avg` comment.
- `src/scores.js`: the file-head paragraph and `categoryAverageContent()`'s comment. The class-average sentence near line 360 stays, because it is still true.
- `design/mockups/proposed-scores.css`: the cat-avg comment is marked SUPERSEDED, and a correction-round paragraph is added to the banner.
- `design/mockups/score-tools.html`: the caption near line 660 is annotated, and the Built caption is extended.
- `TESTING.md` § WO-3.28: the "what this changes" sentence, and the 👤 line, which now reads v151 and carries the failure note.

### Checks added, all in `tools/verify/score-search.mjs`

There are four new `check()` sites.

1. **The letter.**
   - For each student, the category letter matches what the engine gives in the page.
   - In every row, the number's top equals the overall number's top, and the letter's top equals the overall letter's top.
   - Reed shows the em dash, with no letter element.
   - The summary reads exactly `Quizzes average 67.33%`, with no letter element.
   - The check also asserts that in at least one row the category letter differs from the overall letter. In this fixture three rows differ: Bell D− against D, Castillo F against C−, Johnson A− against B+. So the check cannot pass just because the two letters happen to agree.
2. **Frozen widths, coarse pointer at 768×1024 (iPad portrait), native face.** 21 frozen cells, none off.
3. **The same, coarse, with every glyph in the grid widened 4px.**
   - This is done with a style injected for the length of one reading and then removed.
   - In that face `100.00%` measures 89.47px against its 67px room, and the check asserts it overflows.
   - This arm stands in for the wider face this desk does not have.
4. **The same, fine pointer at 1024×768.**

**One existing check changed how it reads.** The figure check (Acceptance 2) and the `catCells` read now take the number line, `.scores-grade-num` or `.scores-grade-none`, instead of the cell's whole text. The letter now lives in the same cell.

### Mutations

**Method:**
- A scratch copy of the harness ran only `localstorage-prefs`, `score-grid` and `score-search`: 129 checks, all green on the corrected tree.
- A runner in the scratchpad copied each file aside, applied the edits marked `MUTATION`, and ran the scratch harness.
- It restored the file in a `finally` and compared bytes. All four restores came back identical.
- Afterwards I compared `src/scores.js` and `src/scores.css` against the pre-round copies with `cmp`: both pristine.
- The scratch harness is moved out of `tools/`.
- `grep -rn MUTATION src tools index.html sw.js design` finds only pre-existing prose.

| Mutation | What went red |
|---|---|
| M1: the letter banded from the overall grade's percentage | 1 check: the letter check. Every row showed the overall letter. |
| M2: the enforcement rule deleted | 3 checks: all three frozen-width arms. |
| M3: the enforcement rule dropped for `.scores-grade` only | 1 check: the widened-face arm. Grade 106.47px, category average travelling 22.47px. The two native-face arms stayed green, which is why the widened-face arm exists. |
| M4: the third column fed `weightedClassGrade()`'s percentage (round-0 M1, re-run because the figure check's read changed) | 2 checks: the figure check and the letter check. |

### Commands, from output I read

- **`node tools/verify-shell.mjs`:** `1643 checks · 1643 passed · 0 failed · 0 skipped`, 52,318 lines, 685s, `EXIT=0`, on the real clock.
- **`node tools/wo-sweep.mjs`:** `45 checks · 42 passed · 0 failed · 3 to review`, the same three reviews as before. Before I updated `tools/README.md` it failed on the call-site count, which read 1631 against the recorded 1627. It now records 1631 call sites and 1643 executed.
- **`node tools/wo-gate.mjs --audit`:** PASS.
- **`sw.js`:** `CACHE` is now `planbook-shell-v151`.

### Ticks

In the phase file I ticked the two new desk lines, Acceptance 9 and 10, against checks 2–4 and check 1 above. `TESTING.md` § WO-3.28 has a "Correction round 1" subsection with both ticks and the mutation table.

### Not closed

- **The 👤 iPad portrait line.** The owner needs to re-read it at v151, after a force-quit.
- **The iPad's own glyph widths.** These were never measured. The fix does not rely on them, and the widened-face arm is a stand-in, not an iPad reading.
- **Whether the line layout reads well on the iPad.** That is the letter under the category figure, and a long category name trailing off in the 84px head. Both are part of the same 👤 reading.

### Files touched this round

- `src/scores.js`
- `src/scores.css`
- `sw.js`
- `tools/verify/score-search.mjs`
- `tools/README.md`
- `TESTING.md`
- `plans/work-orders/phase-3-gradebook.md` (two ticks)
- `design/mockups/proposed-scores.css`
- `design/mockups/score-tools.html`

### Draft CHANGELOG addition (the teacher decides)

> On the score grid, each student's category average now carries its letter under it, lined up with the overall grade's letter. The category column no longer slides a few pixels on the iPad before it stays put: the three frozen columns hold their widths whatever the font, and a long category name trails off in its heading instead of widening the column.
