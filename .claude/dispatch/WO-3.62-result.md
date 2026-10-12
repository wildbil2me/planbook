# WO-3.62 — the Scores column head gets lighter, and the name column narrower · result

**Implementer:** Claude (Opus), 2026-10-12. Not committed. The row is still 🤖 CLAIMED. I ran no `--start`, `--release`, `--handoff` or `--tick`.

## Bottom line

Seven of the eight Acceptance lines are met and ticked in the work order, with evidence in `TESTING.md` § WO-3.62. The 👤 iPad line is still open. Both tools are green on the final tree:

- `node tools/verify-shell.mjs`: **`2044 checks · 2044 passed · 0 failed · 0 skipped`**, 65,118 lines, 1077s, **`EXIT=0`**. That is the run's own last lines, read after it exited.
- `node tools/wo-sweep.mjs`: **`50 checks · 47 passed · 0 failed · 3 to review`**, exit 0. The three reviews are the standing ones and none is about this work order.

The owner's ruling at dispatch is built: **the name column is 168px on both pointers**, and laptop and coarse use one set of numbers.

## Acceptance, line by line

1. **Head order — [x].** `verify/score-grid.mjs` reads the element children of all ten heads. Every head is `["scores-col-edit","scores-col-meta","cat-chip","scores-col-hold-line"]` with `"loose":0` (no stray points or due line), on the fine pointer and again on the coarse one. The dated column reads `out of 100 · due Sep 18`, and its two halves sit on one line (their tops within 1px of each other).
2. **The name opens the editor; `data-assignment-edit`; 44px — [x].**
   - The fine pass clicks `#scoresHead [data-assignment-edit="wo35-a1"]` for real. The editor opens with its name field reading "Unit test" and the grid still behind it. The button is a `BUTTON type=button` with `aria-haspopup="dialog"`.
   - The coarse pass taps wo35-a2's name and the editor opens on "Quiz one".
   - All ten buttons measure at least 44px both ways under the coarse pointer.
   - WO-3.3's category-move check used to open the editor through the seam. It now opens it through this button.
3. **Wrap and truncate — [x].** The fixture's three lengths, measured on both pointers:
   - "Unit test": 1 line.
   - "Argumentative research": 2 lines, not cut.
   - The long Gettysburg name: 2 lines, cut (`clamp "2"`).
4. **Hold under the chip — [x].** In `verify/held-readers.mjs`, all ten heads have the hold line directly after the chip and last in the head. The eight live columns show Hold and no mark; the two held columns (Q1, P3) show Held and Commit.
5. **Ruled width, offsets, paddings, focus moves — [x].**
   - **Declarations:** in the base rules, name width 168 = min-width = the grade column's `left`. `scroll-padding-left` is 252 (168 + 84), the third column's `left` is 252, and `.filtered` is 336. The coarse block declares only `{"padTop":"158px"}`; the check reports `coarse restates []`.
   - **Drawn:** the name column measures 168 on both pointers with the grid scrolled sideways, and nothing overlaps.
   - **Driven focus moves:** twelve checks, all green — Shift+Tab, ← and Enter on both pointers, each with and without the Tests pill.
   - **Head against its padding:** a new check reads the measured head height beside the top padding — `{"head":115.59,"padTop":122}` fine and `{"head":152,"padTop":158}` coarse. It also goes red if more than 10px is to spare.
   - ⇥ is evidenced as Shift+Tab, because that is the direction that moves a cell under the frozen columns. A forward Tab is not separately driven.
6. **Overdue colour inside the meta line — [x].** In `verify/past-due.mjs`, on both tinted heads the date is its own span inside `.scores-col-meta`, coloured `rgb(138, 109, 26)` and on the same line as the points. The points stay `rgb(138, 155, 176)`.
7. **Both tools pass; `CACHE` bumped — [x].** The figures are in the bottom line above. `CACHE` went `planbook-shell-v190` → `v191`. The sweep's call-site check now reads 2032, which is the number `tools/README.md` records.
8. **👤 iPad — [ ] open.** It needs the owner on the teaching iPad after a force-quit, upright: four lines, a long name wraps, the name opens the editor, Hold sits under the chip.

## Mutation proof

Run on a section-only copy of the harness: `localstorage-prefs`, `score-grid`, `past-due` and `held-readers`, 128 checks green with nothing planted.

- **Run A — 9 checks went red.** Planted together: a coarse `.scores-name` width of 150 (M1), `.wraps` dropped (M2), the due span moved out of the meta line (M3), and the base top padding cut to 100 (M4). Red were:
  - head order on both pointers
  - wrap on both pointers
  - the declaration check
  - the coarse pin
  - the coarse stuck-head check
  - the fine head-fit check
  - the past-due meta-tint check
  - **M4 did not turn the fine Enter check red,** because M2 had shortened the head to 102 in the same run. The head-fit check is what caught M4.
- **Run B — 2 checks went red.**
  - Hold line moved above the chip (M5): held-readers went red.
  - `data-assignment-edit` removed (M6): `score-grid.mjs` threw at the tap. `runSection()` contained it and reported a FAIL, so it is red, but as a throw rather than as the editor check's own verdict.
- **Cleanup:** I restored the backed-up files and deleted the scratch harness copy (`tools/zz-wo362-scratch.mjs`). `grep -rn MUTATION src/ tools/` finds only prose already at HEAD, and `git diff` adds no line containing it.

## Decisions the work order didn't settle

- **Where the CSS went.** I put the three lifted classes in `src/scores.css`'s column-head subsection, beside the rule each modifies, not in § SCORES TIDY with frame A's half. The § SCORES TIDY banner says where they are.
- **Hover is on the name, not the button.** The drawn rule coloured the button, but the name sets its own ink, so on the drawing the name never turns indigo. I moved the hover to `.scores-col-edit:hover .scores-col-name` and argued it at that rule.
- **Coarse `min-width: 44px` on the button as well.** A column called "Q1" draws a name narrower than a thumb.
- **Meta line markup.** The points and the date stay `.scores-col-pts` / `.scores-col-due` spans joined by a plain ` · ` text node. Their old one-line rules are gone. As a result, frames 0, A and B of `scores-tidy.html` and `score-tools.html` (which link `src/scores.css`) now draw the points and the date inline. That is the same posture frame 0's `.scores-actions` row already records, and the README says so.
- **The coarse head got taller, not shorter: 146 → 152px.** The 44px name button is taller than the name line and points line it replaced. The laptop head did shrink, 120 → 115.6. I wrote this down rather than designing around ruling 3.
- **Names wrap more often than the 130px cap suggests.** A grid wider than its box shrinks every column to its narrowest content, so names wrap at about 96–110px. This is the drawing's own CSS working as written, recorded in `TESTING.md`.
- **The fixture changed.** I gave two fixture assignments (p6, p7) long names, so that every driven Enter check scrolls under the tallest head the screen can draw.
- **The `126 → 122` / `152 → 158` top paddings** were set from the first run's measurements (115.59 / 152), with the same few pixels of slack as before.

## Files changed

- `src/scores.js`, `src/scores.css`, `src/shell.js` (hook inventory comment only), `sw.js`
- `tools/verify/score-grid.mjs`, `tools/verify/past-due.mjs`, `tools/verify/held-readers.mjs`, `tools/README.md` (call-site count 2032, plus a WO-3.62 paragraph)
- `design/mockups/proposed-scores-tidy.css`, `design/mockups/README.md`, `design/mockups/scores-tidy.html` (frame C landed; the 168 ruling)
- `plans/work-orders/phase-3-gradebook.md`: ruling 5 amended, the Open line struck and settled, boxes 1–7 ticked
- `TESTING.md` § WO-3.62
- This file

**No changes needed** in `assigned-and-due.mjs`, `points-grade.mjs` or `score-history.mjs`. Their `190` hits are a key code (`Period`, 190), a list-hint slice length and a planted score, not frozen widths. Neither file reads the column head's lines (`points-grade.mjs` reads only the chips). `ungraded-count.mjs` still finds `.scores-col-pts` inside the meta line and is unchanged.

## Not done / follow-ups

- **Focus after editing from the grid.** After the editor closes, focus is not handed back to the column name. Each edit re-renders the grid, so the opener button is gone. The hold control already has `focusColumnHold()` for the same problem. This is outside the Acceptance list and not built; a small follow-up if wanted.
- **CHANGELOG entry: draft only, not written.**

> **Scores: the column head is lighter.** Each assignment's head is four lines instead of five. The points and the due date share one line, a long name can take two lines before it trails off, and Hold stays under the category chip. Tap a column's name to open that assignment in the editor, as you already can on Assignments. The frozen student-name column is now 168px on the laptop as well as the iPad, giving a little more room to the assignments.
