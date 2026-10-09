# WO-3.47 — result

**Implementer:** Claude (work-order-implementer), 2026-10-08. Nothing committed and no `--tick`, `--start`, `--release` or `--handoff` run. Four of the five Acceptance boxes are ticked in `plans/work-orders/phase-3-gradebook.md`, each with the evidence below. The 👤 line is left `- [ ]`.

## What landed

- `c:\dev\planbook\src\grade-engine.js`: new export `heldWork(doc, cls, termId, studentId)` and the token `HELD_COLUMN = 'held'`. `assignmentsFor()` and a new `heldColumnsFor()` are both cut from one new walk, `categoryColumns()`. `openWork()` is unchanged.
- `c:\dev\planbook\src\glance.js`: `queueRows()` now takes `heldWork()`'s `open` rows after `openWork()`'s, and forwards the engine's `column` marker. The queue panel's row line ends `· held` for a held column.
- `c:\dev\planbook\src\home.js`: `ungradedCount()` (the card's *N to grade*) takes `heldWork()`'s `open` rows into the same Set.
- `c:\dev\planbook\src\detail.js` and `c:\dev\planbook\src\detail.css`:
  - a new card, *Held out of the grade · N pieces*, under the missing work, with one row per held piece: name, category, the state in words, and an indigo `Held` mark;
  - the hero line gains `· N held`;
  - `detailModel()` gains `onHold`, and `studentCsv()`'s Work section adds those rows with State `held — …`;
  - projections untouched.
- `c:\dev\planbook\src\grades-report.js` and `c:\dev\planbook\src\scores.css`:
  - `gradesRecord()` assignments carry `onHold: isHeld(a)`;
  - a held column's printed head gets a `held` line, and the key gets a fifth entry only when some column is held;
  - in the CSV, the header cell and the column key read `Name (held)` (`columnLabel()`).
- `c:\dev\planbook\sw.js`: `CACHE` v172 → v173.
- `c:\dev\planbook\docs\data-model.md`: the reader table's three WO-3.47 rows are completed as built, and the `openWork()` bullet now describes `heldWork()`.
- `c:\dev\planbook\tools\verify\held-readers.mjs`: a third block, `heldShown()`, called after `heldWriters()`. It adds 6 `check()` sites: 5 claims and a fixture-guard failure arm.
- `c:\dev\planbook\tools\README.md`: call-site census 1854 → 1860, plus a paragraph for this work order.
- `c:\dev\planbook\TESTING.md`: a § WO-3.47 section with the fixture, a hand reading of `src/glance.js`, the mutation table and the full-run figures.
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md`: Acceptance lines 1–4 ticked.

## How the queue's engine call is shaped, and why

It is a **sibling export**, `heldWork()`, not a new state in `openWork()`.

- **Why not a new state.** `openWork()` feeds `planned()` through `categoryRows()`, and `planned()` adds its `open` and `missing` rows into every projection. A held row in that array would put a column that counts toward nothing into *what it would take to move*. A new `held` state that `planned()` happened to ignore was the other option, and I refused it for two reasons:
  - it erases the open / missing / bonus distinction a held column still has;
  - any `openWork()` reader that tests `!==` rather than `===` would start describing held work as live. `studentCsv()`'s State wording is one such reader.
- **Both sources come from one walk.** `assignmentsFor()` and `heldColumnsFor()` are cut from the same `categoryColumns()` walk by the one asker, `isHeld()`. So a column is in exactly one source, and a commit moves it from `heldWork()` to `openWork()` without double-counting.
- **Same branch, same scope.** The rows come out of the same `workRows()` branch as `openWork()`'s. They cover categorized work only, as `openWork()` does.
- **The marker comes from the engine.** Each row carries `column: 'held'`. `src/glance.js` forwards it and compares it to the imported `HELD_COLUMN`. It never calls `isHeld()` and never touches `doc.assignments`.
- **Why the key is not called `held`.** § 30 fences any `.held` member read in `src/` outside the engine, so the marker can't use that name. The grade sheet's record and the detail model use `onHold` for the same reason.

**Decision the brief left open: what "blanks" means for a held column.** I followed the queue's existing rule for a live column: `open` rows only. A held cell marked `missing` is a decision already made, so it is not *to grade*. A held zero-point blank is not owed. Mutation M8 below breaks this rule for held rows only, and the harness goes red.

## Acceptance, line by line

1. **[x] Home card and queue count a held column with blanks; the queue row says *held*; committing leaves the count unchanged until the blanks are filled.**
   - Held: the card reads `3 to grade`. `queueRows()` returns `["wo347-L3:3","wo347-L1:1","wo347-H1:1:held"]`. The drawn H1 row reads `WO-3.47 Held shown · Essays · held`, and the live rows carry no *held*. The held bonus column and Bea's held `missing` cell are counted nowhere.
   - After `commitColumn('wo347-H1')`: still `3 to grade`, the same three rows, H1 unmarked.
   - After filling Ada's blank in H1: `2 to grade`, and H1 is off the queue.
   - Evidence: the first and fifth WO-3.47 checks in the full run, both PASS.
2. **[x] Detail lists a held column's open work marked *held*, and no projection counts it.**
   - Ada: the held card lists H1 `not graded yet|Held` and H2 `bonus, not graded yet|Held`. The hero ends `· 2 held`. Her grade is 84.00%. The to-move figures are 60.00% and 90.00%, from `projectedClassGrade()` over L3 alone; with H1 projected they would be 52.00% and 92.00%. The card names one piece, not the held one.
   - Bea: H1 `marked missing|Held` is on the held card. It is not on the missing card, which reads "Nothing is marked missing." Her grade is 66.00% (45.00% if H1 counted). There is no "handed in" sentence. Her CSV rows read `held — marked missing` and `held — bonus, not graded yet`.
   - Evidence: the second and third checks, both PASS. Mutation M1 (held rows let into `openWork()`, so they reach `planned()`) turns both red.
3. **[x] Grade sheet and CSV include the held column, marked held in its head and in the CSV header cell; the grade beside it does not count it.**
   - Both held heads carry `held`; the three live heads carry nothing. The key has 5 entries, with `held` fifth.
   - The CSV grid header and the column key read `Wo347 held essay (held)` and `Wo347 held bonus (held)`. Live names are unchanged.
   - Bea is 66.00% on the dialog and in the file, with her held `M` printed.
   - Evidence: the fourth check, PASS.
4. **[x] `glance-quiet.mjs` still finds no arithmetic in `src/glance.js`, and the WO-3.53 sweep claim is green.**
   - The "no arithmetic" half was a hand reading at WO-6.7 (TESTING.md § WO-6.7 says a grep cannot settle it). I re-read the new code; the reading is in TESTING.md § WO-3.47. The changes are equality tests on engine tokens, the existing `open += 1` list-size count, and a forwarded field. There is no `Math.*`, `%`, `/`, threshold, cell read or `isHeld()` call.
   - `glance-quiet.mjs`'s checks are all PASS in the full run.
   - § 30 PASS: "61 file(s) under src/ outside src/grade-engine.js … none reads an assignment's `held`".
5. **[ ] 👤 iPad reading.** Not attempted; it needs the device. Left unticked.

## Commands run, with what they printed

- **First `node tools/verify-shell.mjs` (background):** I stopped it with `taskkill`.
  - Why: my new block threw at the grade-sheet `evalJs`. A `\r\n` inside the template literal was spliced into the page source as real characters (`SyntaxError: Invalid regular expression: missing /`).
  - Section containment reported the throw: `FAIL | § verify/held-readers.mjs ran to the end of its own checks … threw after 17`.
  - I stopped it rather than let it finish because the fixture had been left in the document, which would have tainted the later sections.
  - Fix: the regexes now run in Node.
- **Trimmed scratch run** (a copy of the tree with only `year-document-store` and `held-readers`):
  - Control: `45 checks · 44 passed · 1 failed`, exit 1.
  - The one red is WO-3.46's writer-shape check: `rev` stays 4 in a two-section run. The same trim on an untouched `git archive HEAD` prints `40 · 39 · 1` with the same red, so it comes from the trim, not this tree. It is green in the full run.
- **Mutation round** (scratch copy only; each file restored from the working tree after its run; `diff -r src` exit 0 after the round). Red counts are beyond the control's one:

| Mutation | Red beyond the control |
|---|---|
| M1: `openWork()` walks held columns | 5 |
| M2: `queueRows()` drops the `heldWork()` source | 1 |
| M3: the card chip drops the `heldWork()` source | 1 |
| M4: the held card is never appended | 3 |
| M5: the sheet never marks a held column | 1 |
| M6: the queue panel drops the `· held` tail | 1 |
| M7: `heldColumnsFor()` returns every column | 4 |
| M8: the queue counts held rows in any state | 2 |

No mutation was ever made in the working tree.
- **Second, full run, `node tools/verify-shell.mjs`:** `1863 checks · 1863 passed · 0 failed · 0 skipped`, 59,453 lines, 873s, `EXIT=0`. I waited for the exit and read the summary.
- **`node tools/wo-sweep.mjs`, after the README edit:** `49 checks · 46 passed · 0 failed · 3 to review`, exit 0. It is the same three reviews as before this work.
- **`node tools/wo-gate.mjs --audit`:** PASS, exit 0.
- **`grep -rn MUTATION src/ tools/`:** only prose that was already there (src/shell.js:1021, tools/verify/*, tools/wo-gate.mjs, tools/README.md). Nothing from me.

## What I could not close, and notes

- **👤 line:** needs the iPad.
- **Things that need a person to look at them:** whether the held card's wording and its placement under the missing card, the `· held` tail on the queue row, and the head line on the printed sheet read well. I checked text and structure, not visual design or print output on paper.
- **Two calls I made that the work order did not settle:**
  - **The student detail CSV now carries held rows too** (State `held — …`). The work order's detail row says "open work lists it". I applied that to the file because the file's own header says it carries the screen's numbers. A student with no held column gets the same bytes as before.
  - **The grade-sheet CSV's column key also carries `(held)`**, not just the grid's header cell. That way the key's first column still names the grid's columns word for word. Live columns are unchanged.
- **Out of scope, left alone:** the score grid's own summary line, which counts blanks, does not count held columns. It is not in the owner's table.
- **Left untouched as ruled:** score history, score notes, the four WO-3.53 readers, and `calendar-derived.js`.
- **The held card prints with the detail page**, since nothing hides it. That follows the screen's "the sheet is the screen" rule; it is grades only, with no support data.

## Draft CHANGELOG entry (the teacher's to keep or rewrite)

> A column held out of the grade no longer vanishes from the places that list unfinished work. The home card's *N to grade* and the *Waiting to be graded* queue count it, and its queue row says *held*. A student's page lists its open work on a *Held out of the grade* card, kept apart from the missing work and out of every *what it would take to move* figure. The grade sheet prints it with *held* under its head and `(held)` in the CSV. In every case the grade beside it still does not count it until you commit the column.
