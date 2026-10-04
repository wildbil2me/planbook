# WO-3.42 — result (resumed dispatch, 2026-10-04)

This resumes a dead dispatch. The first implementer died on ECONNREFUSED about 01:17Z and left an
unverified draft. I audited that draft, kept it, ran everything again myself, and finished the work.
Every number below comes from a run whose output I read through to its `EXIT=` line.

## Recovery checks

**First grep (`grep -rn "WO342CAP\|MUTATION" src/ tools/`), before any change.** It found four live
`WO342CAP` hits: `src/grades-report.js:563`, `src/scores.js:616`, `tools/verify-shell.mjs:1070`, and
`tools/wo342-scratch.mjs:996`, which is a trimmed copy of the harness. Every other hit was the
standing prose: `src/shell.js:963`, and comments in `tools/README.md`, `tools/verify/*.mjs` and
`tools/wo-gate.mjs:2562`. There was no marked `MUTATION` in code.

**One correction to the preamble.** It said no capture was ever taken. In fact the dead implementer
had made a `before` worktree of HEAD plus the three probe lines, and it wrote
`scratchpad/before.cap` (16.7 MB, at 21:26, `EXIT=0`). I did not rely on it. I made fresh captures
(see Acceptance 2). That old capture differs from my fresh HEAD capture only in the "Printed
October 3/4" date line, once the random ids are normalised.

**Final grep, after all doc prose was written.** No `WO342CAP` anywhere. The only `MUTATION` hits
are the standing prose ones: `src/shell.js:963`, `tools/README.md` (the old lines, now shifted +8
by my insert), `tools/verify/keys-legend-guards.mjs`, `outreach.mjs`, `score-grid.mjs`,
`score-search.mjs` and `tools/wo-gate.mjs:2562`. `tools/wo342-scratch.mjs` is deleted.
`tools/verify-shell.mjs` is back to HEAD's bytes and has no diff. All scratch worktrees have been
removed (`git worktree list` shows only `main`).

## Audit of the draft: what I kept and what I changed

I kept all of the draft. I rewrote none of the code. The only edit was removing the probes.

- **`src/graded-pieces.js` (new).** It holds `rowIsEmpty`, `POINTS_ZERO_BONUS_MESSAGE`,
  `gradedPieces`, `rowIsGraded` and `noGradeMessage`. These are moved word for word from
  `detail.js`, with one change: the weighted guard is now inside `gradedPieces()`
  (`if (!cls || gradingModeOf(cls) !== 'points') return null;`). It imports only `categories.js`
  and `gradingModeOf` from `grade-engine.js`. Neither of those imports any screen (I checked their
  import lines), so there is no import loop. It does no arithmetic: it only tests whether a cell
  holds a value, and compares the engine's own `earned`/`possible` to 0.
- **`src/detail.js`.** All five definitions are removed and imported back, so no copy is left.
  `categoriesOf` is dropped from its import, and nothing else in the file uses it (I grepped).
  `POINTS_ZERO_BONUS_SAY` stays here because only this screen uses it. Both inline mode guards are
  replaced by the guard inside `gradedPieces()`. For a truthy `cls` the behaviour is the same.
- **`src/scores.js` `gradeContent()`.** It now takes `(grade, doc, cls, termId, studentId)`, and it
  asks `noGradeMessage(grade, gradedPieces(…))` only when there is no grade.
- **`src/grades-report.js` `gradesRecord()`.** `message` is now `noGradeMessage(grade, gradedPieces(…))`
  when there is no grade, otherwise `grade.message`. So the fact reaches the record from the same
  function, not rebuilt from the sentence. The renderer at line 456 is unchanged.
- **`sw.js`.** `CACHE` goes from v159 to v160, and `./src/graded-pieces.js` is added to `SHELL`.
- **`tools/verify/points-grade.mjs`.** Three new `check()` sites on the existing WO-3.34 fixture.
  I confirmed by reading that every constant and selector they use exists: `FI/IZ/GUS/HAL/C4/T4`,
  `ZERO_WHY/NONE_WHY/NOTHING`, `#scoresView [data-grades-record]`, `.grades-report-pct.none`, and
  the sheet names. The fixture has only 3 assignments, so the sheet has one slice and the by-name
  map cannot be overwritten. The weighted check restores `gradingMode = 'points'` before the code
  that follows.
- **Removed:** the three `// WO342CAP` probe lines and `tools/wo342-scratch.mjs`.
- **Kept untouched:** the orchestrator's ruling (a) paragraph in the phase file.

## Acceptance

1. **[x] A bonus scored 0 is not "nothing graded" on the score grid or the grade sheet; a blank or
   excused bonus still is. Mutation-proved.**
   - The three new checks pass on the delivered tree (`main.log` lines 1096–1098).
   - I put each mutation in its own scratch worktree (HEAD plus this row's files), marked
     `MUTATION`. None was ever in the delivered tree. Each ran the full harness:
     - **M1:** the grid reads `grade.message` again. Result: `1690 checks · 1689 passed · 1 failed`.
       The zero-bonus check failed with grid = "There is no graded work yet." and sheet = the new
       sentence.
     - **M2:** the sheet reads `grade.message` again. Result: `1689 passed · 1 failed`, the same
       check failing the other way round.
     - **M3:** `gradedPieces()` counts a blank as graded. Result: `1688 passed · 2 failed`
       (WO-3.38's blank check and WO-3.42's), with Gus and Hal told "graded at 0".
     - **M4:** the weighted guard is removed. Result: `1689 passed · 1 failed`, the weighted check,
       with Fi and Iz getting the zero-bonus sentence in a weighted class. So the guard really is
       needed: weighted rows carry `earned`/`possible` too.

2. **[x] A weighted class's score grid and grade sheet are byte-identical before and after.**
   - I made one worktree of HEAD `d76ce97` with the three capture probes added. The probes logged:
     - `#scoresBody.innerHTML` at the end of every `paintGrades()` for a class not graded on points;
     - the sheet's `innerHTML` plus `gradesCsv(record).text` at every `openGrades()` for such a class.
   - I made a second worktree: the same HEAD `tools/` (so the same harness and the same fixture
     sequence), with this row's `src/` and `sw.js` copied in.
   - Both full runs gave `1687 checks · 1687 passed · 0 failed`, `EXIT=0`.
   - Each captured 252 grid paints and 7 sheet opens, 16,762,639 bytes each.
   - The raw bytes differ only at `newId()` ids, which come from `crypto.getRandomValues()`. Two
     separate HEAD runs differ in the same way, so this is run-to-run noise, not the change.
   - After renaming each `prefix_xxxxxxxxxx` id to its first-seen ordinal (`scratchpad/norm.mjs`),
     the before and after captures are **identical**.
   - Limit: the comparison covers what the harness fixtures draw, and nothing more.

**Full run on the delivered tree:** `1690 checks · 1690 passed · 0 failed · 0 skipped`, 53,826
lines, 31.8 lines per check, 748s, `EXIT=0`, 2026-10-04.

**`node tools/wo-sweep.mjs`:** `46 checks · 43 passed · 0 failed · 3 to review`, exit 0. The three
reviews are the standing ones. Before I updated `tools/README.md` it was red, as expected:
1679 sites against 1676 recorded.

**`node --check`** is OK on all seven changed or new `.js`/`.mjs` files.

**`wo-gate.mjs WO-3.42`:** gates clear. It notes the row is still 🤖 CLAIMED. I left the status for
the orchestrator.

## Not verified

This row has no 👤 line and no 📆 line. No screen reader was used: the checks read the
`aria-label` attribute, not speech.

## Decisions I made

- **The weighted guard lives inside `gradedPieces()`**, as the draft had it. Three call sites each
  writing the guard would be three guards that could drift apart. M4 shows that this guard is what
  keeps weighted classes unchanged.
- **`rowIsGraded()` moved with the others** because it reads `gradedPieces()`'s shape.
  `rowShowsEmpty()` stays in `detail.js` because only the breakdown and the CSV use it.
- **Grid and sheet ask only when there is no grade**, since the sentence is not read anywhere else.
  The grid repaints on every keystroke, so this avoids extra work.
- **I kept the `+2/−2` limit** on `noGradeMessage()`. It is written in the code comment.

## Files changed

- `src/graded-pieces.js` (new)
- `src/detail.js`
- `src/scores.js`
- `src/grades-report.js`
- `sw.js`
- `tools/verify/points-grade.mjs`
- `tools/README.md`: the call-site count 1676→1679, plus a WO-3.42 paragraph
- `TESTING.md`: a new § WO-3.42 section
- `plans/work-orders/phase-3-gradebook.md`: two boxes ticked, plus the orchestrator's ruling paragraph

Also deleted: the untracked `tools/wo342-scratch.mjs`.

## Out of scope, declined

- `src/signals.js` and the quiet list (by the owner's ruling).
- `src/grade-engine.js`.
- `.claude/dispatch/WO-3.42-status.md`.
- The README row 123 text ("One Open at dispatch") is now out of date because the ruling has been
  made. The orchestrator owns that tracker row.

## Draft CHANGELOG line (for the teacher to decide)

In a class graded on total points, the score grid and the grade sheet no longer tell a screen
reader that a student whose only graded work is extra credit scored 0 has "no graded work". They
now say what student detail says, from the same shared function.
