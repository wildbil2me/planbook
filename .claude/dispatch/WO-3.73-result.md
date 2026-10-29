# WO-3.73 — result (second implementer, resuming a dead dispatch)

**Status:** built and verified apart from the 👤 line. Nothing committed. The row stays 🤖 CLAIMED; I ran
no `--start`, `--release`, `--handoff` or `--tick`.

## The dead draft: what I kept, what I changed, and why

The first implementer died at the session limit (status file, 04:50) and left about 400 lines across
12 modified files and 2 new ones. Before trusting any of it I did this:

- **I grepped for MUTATION** over `src`, `tools/verify`, `tools/verify-shell.mjs`, `index.html` and
  `sw.js`. The only hits were old comments; nothing was planted.
- **I read every line** of the `git diff` and both new files against the brief, the drawing (frames
  A0, A, B, C, D, F) and `proposed-quarter.css`.
- **I checked the ticks.** The draft ticked no box. Its only change to the phase file was the status
  line, ⬜ → 🤖 CLAIMED, which `--start` wrote.

**I kept all of it.** I rewrote nothing in `src/`, because the audit found no defect:

- **The wording matches the drawing.** All three bar wordings match frames A0, A and D. The first
  form matches frame B. The changed form matches frame C without its *What changed* box. The refusal
  matches frame F word for word.
- **The bar shows on the right screens.** The five are `CLASS_SCREENS` minus `calendar`, which is how
  the brief defines them.
- **The view computes nothing.** The engine and `src/term-record.js` answer every figure and every
  "who":
  - `termNeedingRecord()` feeds the bar.
  - `noLongerMatching()` rows feed the changed form. Each row now carries `letterChanged`, so the
    bold/quiet split is not a second comparison.
  - `gradesToRecord()` is shared by the writer and the first form.
  - `emptyBoxes()` now covers uncategorized work, through the new engine sibling
    `uncategorizedWork()`. `openWork()` is unchanged.
  - `looseWorkOutOfGrade()` counts uncategorized work outside a weighted grade, through
    `uncategorizedScores()` and `uncategorizedWork()`.
- **The bar is copied from `.backup-nag`, not shared with it.** Its button has the 44px coarse rule.
  It is not subscribed to the store and is repainted from the record path.
- **Nothing writes `termRecords` on open.** It uses `presentationMode()` from `src/supports.js`, and
  dates go through `shortDate()` / `weekdayShortDate()`.

What I added:

- **`tools/README.md`.** The call-site line goes 2106 → 2117 (the sweep was red on it), plus a
  paragraph on what WO-3.73 added, in the same form as WO-3.72's.
- **`TESTING.md` § WO-3.73.**
- **Ticks** on the 10 boxes in the phase file I could back with evidence. The 👤 box is left blank.

## Acceptance, line by line

1. **[x] Bar wording: ends today / has ended / have changed; no bar before the end date.**
   - The `term-record-bar.mjs` check moves Q1's `end` to tomorrow, today and yesterday, and the bar
     text matches the drawing's words exactly.
   - A second check covers the third wording, after a recording and two score edits: *…have changed
     since you recorded them on Oct 27 — 2 students.*
   - The date reads `Oct 27` because it comes from `shortDate()`, the app's format. The drawing shows
     `2 Nov`; the brief says to use the app's format.
   - PASS in runs 1, 3 and 4. The WO-3.73 output lines are byte-identical across the three runs.
2. **[x] The bar is on all five class screens and on no other class's.** Each screen is reached
   through its real switcher pill, and detail through the registry name. The result is
   `{"class":true,"assignments":true,"scores":true,"detail":true,"signals":true}`. The bar is not
   shown on the calendar, on home, or on another class whose terms have not ended.
3. **[x] First form.**
   - Rows are in grade-sheet order (Abbott, Moss, Zimmer, not roster order), and the student with no
     grade is left out.
   - Figures match both `classGrade()` asked directly and the hand table.
   - The empty-boxes line and the held-column line (*1 held column, WO-3.73 Held quiz, is not
     committed…*) both show.
4. **[x] Uncategorized work.**
   - The empty-boxes line reads *There are 6 empty boxes in Q1, across Exams, Projects and no
     category.* The count is 6 with the same categories in both weighted and points mode.
   - In the weighted class the *not in these grades* line shows (count 1). In points mode the count is
     0 and no line is drawn.
   - `openWork()` still returns only `[a373-p1]`, with no null-category rows.
   - abe's full-marks projection is 85.00 weighted and 90.00 points. In points mode that is 270/300:
     the loose essay counted once.
   - The rest of the harness, including every existing projection check, is green.
5. **[x] One write; the ways out write nothing.**
   - After *Not now*, the ✕ and Escape, `rev` stays at 436 and the flushed document is byte-identical.
     No `termRecords` key is created.
   - *Record Q1 grades* moves `rev` 436 → 437, writes one entry holding the engine's figures, and the
     bar goes.
   - *Not yet* writes nothing: the document is byte-identical, shown in the presentation check's
     `wroteNothing`.
   - In the changed form, *Record Q1 grades* writes a second entry for all three students.
6. **[x] The changed form lists only students who changed.** It shows abe (70.00% C → 72.00% C, quiet)
   and mo (95.00% A → 77.50% C, bold 700). zim does not appear.
7. **[x] Presentation mode.**
   - The bar stays up and names no student.
   - The dialog refuses with frame F's wording, which names *the screen button in the header*.
   - It builds no list (0 list children), shows no confirm button, and contains no surname or
     `NN.NN%`.
   - Closing it writes nothing.
8. **[x] The mutation goes red.**
   - **What was planted:** in `termRecordModel()`'s changed form, `rows:` was built from every student
     `gradesToRecord()` returns, with recorded set equal to live for students who had not changed. The
     line was tagged `MUTATION WO-3.73`.
   - **Run 2:** `2119 checks · 2115 passed · 4 failed`, `EXIT=1`. The target check failed with
     `"label":"3 students changed"`, zim listed, `"zimListed":true`.
   - **No other WO-3.73 check failed.** The bar still said *2 students* over a dialog listing three,
     which is the disagreement the Trap warns about.
   - **Three unrelated sync reds** in the same run are explained under line 9.
   - **Reverted** by copying back a copy of the file saved before the plant (no `git checkout`). `cmp`
     shows the file identical, and grepping for `MUTATION WO-3.73` finds nothing.
   - The red output is in `TESTING.md`.
9. **[x] Both tools pass. One flake to know about.** Runs 1 and 4 are the green runs:
   - **Run 1** (before the mutation): `2127 checks · 2127 passed · 0 failed · 0 skipped`, 1177s,
     `EXIT=0`.
   - **Run 4** (the tree as delivered, after the revert): `2127 checks · 2127 passed · 0 failed · 0
     skipped`, 68,368 lines, 1154s, `EXIT=0`.
   - **Sweep:** `52 checks · 48 passed · 0 failed · 4 to review`. Three of the reviews are the standing
     ones. The fourth is new: the coarse-block review lists 8 new selectors, none of which is a
     control. The one control, `.term-record-nag-btn`, has its 44px rule.

   **The flake:** run 3 (after the revert) was **not** green: `2119 · 2116 passed · 3 failed`.
   - `§ verify/sync-button.mjs` threw after 35 of its own checks, in its same-day pinned-clock case,
     with `window.planbook` undefined after a reload. The two later Drive checks then failed on the
     stand-in it left behind.
   - The same thing happened in run 2. Every WO-3.73 check was green in both runs.
   - **What I did to look into it:**
     - Ran HEAD (`9c9ce90`) in a scratch worktree: `2117/2117`, `EXIT=0`.
     - Ran a copy of this tree with a diagnostic added to that check: `2127/2127`, `EXIT=0`. It never
       captured the failing state, because that run passed.
     - Ran run 4: green.
   - **Tally:** the throw happened in 2 of 5 runs on this tree, and in 0 of 2 on HEAD (my run plus the
     first implementer's baseline). That is too few runs to say whether WO-3.73 makes it more likely.
   - **My guess, not verified:** the page has not finished booting when the check reads it. `load()`
     waits 800ms plus up to 8s, and `waitForBoot()` returns false without throwing. Nothing in
     WO-3.73 touches sync.
   - **The verifier should know this flake exists, and may hit it.**
10. **[ ] 👤 iPad readability, and 25 rows scrolling with the buttons in reach.** Not run, because it
    needs the real iPad. The drawing's `max-height: 300px; overflow-y: auto` is in place, but no check
    measures 25 rows or how far the buttons are from a thumb.
11. **[x] `TESTING.md` § WO-3.73** is under `## Phase 3 — Gradebook`, with all 11 lines copied verbatim
    and evidence for each.

## Commands run

- `node tools/wo-sweep.mjs`, before any edits: 1 failed (call-site count 2117 vs 2106 recorded).
  After the README fix: `52 · 48 passed · 0 failed · 4 to review`.
- `node tools/verify-shell.mjs` (each run about 19 to 20 minutes):

| Run | Tree | Result |
|---|---|---|
| 1 | as audited | `2127/2127`, `EXIT=0` |
| 2 | mutation planted | `2119 · 2115 · 4 failed`, `EXIT=1` |
| 3 | after the revert | `2119 · 2116 · 3 failed` (the sync flake), `EXIT=1` |
| HEAD | scratch worktree of `9c9ce90` | `2117/2117`, `EXIT=0` |
| diag | copy of this tree, with a diagnostic | `2127/2127`, `EXIT=0` |
| 4 | as delivered | `2127/2127`, `EXIT=0` |

- `node --check` on every changed or new JS file: clean.
- `cmp` of the restored file: identical. Grep for the mutation tag: nothing found.
- The scratch worktree has been removed (`git worktree list` shows only `main`).

## Decisions the work order did not settle (all made by the draft; I kept them)

- **Frame C's hint is generic.** It reads *A bold figure is a letter that changed. Where the letter is
  drawn quiet, only the percentage moved, inside the same letter.* The drawing names students
  instead (*Chen's letter changed. Bautista's…*). Building that sentence would mean pulling surnames
  out of `rosterName()`. The bold and quiet styling already carries the meaning.
- **A missing mark counts toward *not in these grades*.** In a weighted class, `looseWorkOutOfGrade()`
  counts an uncategorized column holding a missing mark as well as one holding a score, since a
  missing mark is a graded zero that is also outside the grade. The owner did not rule on this case.
  If the owner reads "scored" strictly, this is a one-line change.
- **One bar, one term.** `termNeedingRecord()` answers the first qualifying term in the class's order,
  so an unrecorded Q1 is answered before Q2.
- **On the end date, a term that was already recorded and has since changed reads *changed*,** not
  *ends today*.
- **The bar repaints only on navigation and after a recording,** never on a save. So a Q1 score fixed
  while on Q1's grid shows in the bar at the next screen change. This is the backup nag's trade, and
  it is written in the header of `src/term-record-view.js`.

## Out of scope, not done

- The leave-the-quarter notice and the home bar (WO-3.74).
- *What changed* (WO-3.75).
- I left `.term-record-nag-classes` and `.term-record-cause` drawn, with a note in the drawing's
  banner.
- No CHANGELOG entry.

## Files changed

Modified:
- `TESTING.md`
- `design/mockups/proposed-quarter.css`
- `docs/data-model.md`
- `index.html`
- `plans/work-orders/phase-3-gradebook.md`
- `src/grade-engine.js`
- `src/shell.css`
- `src/shell.js`
- `src/term-record.js`
- `sw.js` (v198 → v199)
- `tools/README.md`
- `tools/verify-shell.mjs`
- `tools/verify/dialog-kinds.mjs`
- `tools/verify/term-record.mjs`

New:
- `src/term-record-view.js`
- `tools/verify/term-record-bar.mjs`

## Draft CHANGELOG entry (the teacher decides)

> **Record Q1 grades.** When a quarter ends, every screen of that class carries a bar until you
> record its grades. It reads *ends today* on the last day and *has ended* afterwards. Its button
> opens a list of every graded student in grade-sheet order, showing the empty boxes, any held column,
> and, in a weighted class, any work filed under no category that holds scores or missing marks. If a recorded grade later moves,
> the bar says how many students changed, and the dialog lists only those students, recorded beside
> now. Recording again clears the bar. The bar names no student, so it stays up under a projector;
> the dialog refuses there.

## Correction round 1

2026-10-27, against the verifier's FAIL on Acceptance line 4 (the owner's 2026-10-27 ruling: a
missing mark counts toward *not in these grades*, and the sentence must say so). Narrow correction;
nothing rebuilt. No `--tick`, `--release` or `--handoff` run; the row stays 🔍 AWAITING VERDICT.

### What changed

- `src/term-record-view.js` — `paintLoose()` now reads *… filed under no category has scores or
  missing marks in it, which are not in these grades: a weighted grade counts only work in a
  category.* and the plural *… have scores or missing marks in them, …*. Its comment names the ruling.
- `src/term-record.js` — `looseWorkOutOfGrade()`'s header comment quotes the new sentence. No code moved.
- `tools/verify/term-record-bar.mjs` — the line-4 check asserts the new wording word for word, and a
  new check at the foot of the `try` turns zim's L1 50 into `{ v: null, flag: 'missing' }` (L1 then
  holds no score), takes the class's `termRecords` off so the bar offers the first-recording form,
  and asserts `looseWorkOutOfGrade().count === 1`, `uncategorizedScores()` for zim is empty, and the
  dialog draws the singular sentence. The fixture header records the step. The `finally` cleanup is
  unchanged and covers it.
- `tools/README.md` — call-site line 2117 → 2118 (the sweep's own count); the WO-3.73 paragraph now
  says twelve sites / eleven results and quotes this round's full run.
- `design/mockups/proposed-quarter.css` — the banner gains *WHERE THE BUILD DEPARTS FROM THE
  DRAWING'S WORDS*: frame C's *Chen's letter changed…* hint is the drawing's example; the build draws
  the general key *A bold figure is a letter that changed…* (index.html, `#termRecordModal`), per the
  owner's ruling. `closing-a-quarter.html` itself left as drawn.
- `TESTING.md` § WO-3.73 — line 4's PASS quotes the new wording from this round's run, and a
  *Correction round 1* paragraph adds the missing-mark check's PASS and the mutation's red; the
  harness line gains this round's verify-shell and sweep figures. Line 4 stays `[x]`: it now holds.
- This file — the draft CHANGELOG's *any scored work filed under no category* is now *any work filed
  under no category that holds scores or missing marks*.

`sw.js` CACHE left at **v199**: two SHELL files changed (`src/term-record-view.js`,
`src/term-record.js`), but v199 is this work order's own uncommitted bump and nothing has deployed
since v198, so one bump covers both.

The tree was `git add -A`-staged before the mutation (as instructed) and is still staged; this
round's TESTING.md, tools/README.md and result-file edits are unstaged on top of it.

### Mutation

With the tree staged, deleted `.concat(uncategorizedWork(doc, cls, termId, studentId).filter((row) =>
row.state === 'missing'))` from `looseWorkOutOfGrade()`, tagged `/* MUTATION WO-3.73 */`. Full run:
`2128 checks · 2127 passed · 1 failed · 0 skipped`, 1181s, `EXIT=1`; the one red is the new check —
`FAIL | WO-3.73: in a weighted class an uncategorized column holding only a missing mark … ::
{"read":{"loose":0,"scored":0,"cell":{"v":null,"flag":"missing"}},"looseLine":null,"open":true}`.
Reverted with `git checkout -- src/term-record.js` against the staged tree (the concat is back at
line 386, the new comment kept); `grep -rn "MUTATION WO-3.73"` then found only prose in TESTING.md and
this file. Before this round, the same deletion would have turned nothing red.

### Harness, on the corrected tree

- `node tools/verify-shell.mjs` — `2128 checks · 2128 passed · 0 failed · 0 skipped`, 68,399 lines,
  32.1 lines per check, 1183s, `EXIT=0`, 2026-10-27, real clock. No sync throw this run.
- `node tools/wo-sweep.mjs` — `52 checks · 48 passed · 0 failed · 4 to review`, `EXIT=0`. The four
  reviews are the three standing ones and the coarse-block one this work order already explained;
  `PASS | the recorded check() call-site count matches the harness :: 2118 … matching tools/README.md:1363`.

### Not touched, on purpose

The Rulings block in `plans/work-orders/phase-3-gradebook.md` still says *Until it changes, Acceptance
line 4 is not met as worded here*. That is the owner's text and I left it alone; the verifier or
orchestrator may want to note it discharged.
