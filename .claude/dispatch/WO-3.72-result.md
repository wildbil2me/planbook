# WO-3.72 — result

**Implementer:** Claude (Opus), 2026-10-23. **Not committed.** All of my changes are **staged** (`git add`), which I did before the mutation so that reverting it could not take unstaged work with it. `.claude/dispatch/WO-3.72-brief.md` and `-status.md` are still untracked, as I found them. I did not run `--start`, `--release`, `--handoff` or `--tick`. `grep -rn "MUTATION WO-3.72" src tools docs sw.js privacy.html` finds nothing. (The one `MUTATION` hit in `src/shell.js:1077`, *"A CLASS MUTATION ADDED LATER…"*, was already in HEAD and is prose.)

## Acceptance, line by line

All eleven boxes are ticked in `plans/work-orders/phase-3-gradebook.md`. None of them is 👤 or 📆. The evidence for each is in `TESTING.md` § WO-3.72, and every quoted line below comes from a log I read after its run exited.

1. **Recording a class's quarter appends one entry holding every graded student's percentage and letter, equal to `classGrade()`'s; recording again appends a second and changes neither.**
   PASS, run 3. One entry with keys exactly `["id","classId","termId","at","grades"]`. The grades are ada 89.50 B, ben 76.50 C, cy 65.00 D, dee 88.00 B and fay 57.14 F, in roster order. Eve (no grade) and the dangling id are left out. Each figure is `===` to `classGrade()`'s. A second recording appends a second entry; the first stays byte for byte, and the classes, students, assignments and scores JSON is unchanged.
2. **With nothing changed since a recording, no student is reported as changed.**
   PASS: `{"after":[],"before":null}`. The reader returns `[]` after a recording and `null` before any.
3. **A score edit that moves a percentage inside the same letter reports that student as changed, with the recorded and the live figures.**
   PASS: `[{"id":"wo372-ben","rec":["76.50","C"],"live":["77.50","C"]}]`. A separate check covers the two-decimal comparison: 76.501 does not count as a change and 65.006 does. That check also shows a tie on `at` goes to the later write.
4. **A weight, letter-scale or drop-lowest change that moves grades reports exactly the students whose figures moved.**
   PASS, as three checks, each measured against a fresh recording and each put back to `[]`:
   - Weights: ada, ben, cy and fay are reported, not dee.
   - Letter scale: ben and dee, letters only.
   - Drop lowest: ada and cy.
5. **The ended and ends-today readers answer for the term's end date, the day before and the day after.**
   PASS. `[ended, endsToday]` reads `[false,false]` the day before, `[false,true]` on the end date and `[true,false]` the day after. An undated term and an unknown term are both false. With no date passed, the readers agree with Node's own date.
6. **The empty-boxes reader counts a scoreless late mark, never a dropped, excused or missing cell, and nothing in a held column, and names the categories the empty boxes are in.**
   PASS, two checks:
   - The count is 12, worked out by hand, and it includes ben's lone late mark. The categories are `Exams, Projects` and never Homework. With drop-lowest 1, two cells are dropped and the count stays 12.
   - The held quiz: 12 while it is held, 17 with the hold off, 12 again once it is held back. `heldColumns()` names it.
7. **A backup with no `termRecords` key restores and reads as unrecorded.**
   PASS. The word is nowhere in the file, and `newYearDocument()` has no such key. The backup parses and restores through the real confirm. Afterwards the document has no key, `newestRecord` and `noLongerMatching` are both `null`, the empty boxes are unchanged (13 before and after), and the next recording creates the block with one entry.
8. **`src/term-record.js` holds one writer, and it only pushes.**
   PASS. I read this off the file with comments stripped. There is one `.push(` and one `update(`, both inside `recordTerm()`. There are no removers, sorts, assignments into the array or `find`/`findIndex`. The file imports `grade-engine` and `attendance`, and `src/grade-engine.js` does not import it back.
9. **With the comparison ignoring the percentage, the percentage-only checks go red. The mutation is reverted, and `TESTING.md` § WO-3.72 shows the red output.**
   PASS, run 2: `2117 checks · 2112 passed · 5 failed`, `EXIT=1`.
   - **Four reds are the percentage-only checks** (rounding, the score edit, weights, drop). Each lost exactly its same-letter rows. The letter-scale check correctly stayed green.
   - **The fifth red was the harness, not the app.** I wrote the mutated file back with Python's text mode on Windows, so it had CRLF endings. The structural check cuts the writer out at `\n}\n`, so it found none (`writerLines: 1`).
   - **Fix:** the check now normalises `\r\n` first. I confirmed that a CRLF copy of the clean file reads as a 9-line writer.
   - **Revert:** I copied back the copy saved before the plant (not `git checkout`). `cmp` reads identical and `git diff --quiet` against the staged file is silent.
10. **`node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.**
    - Run 3, after the revert and the harness fix: `2117 checks · 2117 passed · 0 failed · 0 skipped`, 67,485 lines, 1142s, `EXIT=0`.
    - Run 1, before the mutation, on the same `src/`: `2117 · 2117 · 0`, 1155s, `EXIT=0`.
    - `node tools/wo-sweep.mjs`: `52 checks · 49 passed · 0 failed · 3 to review` (the three standing reviews), exit 0.
    - `node tools/wo-gate.mjs --audit` is PASS.
11. **`TESTING.md` § WO-3.72 carries these lines verbatim with the evidence for each.**
    Done, under `## Phase 3 — Gradebook`, after WO-3.69.

**(Ruling) A student recorded and since removed from the roster is not reported as changed.**
PASS: `{"changed":[],"fayRecorded":["57.14","F"],"fayNow":["82.14","B"]}`. Fay is in the newest record. She is taken off the roster, and then her Exam 1 moves from 60 to 95, so her live grade really did move. Nobody is reported. Two wrong implementations would fail this:
- one that walks the record's `grades[]` would report her because her grade moved;
- one that reports "in the record but not on the roster" would report her too.

I recorded the ruling in three places: the work order's Open line, now *Answered…*; beside question 9 in `plans/closing-a-quarter.md`; and in `docs/data-model.md` § Recording a quarter's grades.

## `docs/FERPA.md` / `privacy.html`

**Both changed, in the same sitting.** Each has a list of everything Planbook stores, and a stored copy of each student's quarter percentage and letter, with when it was recorded, is a new item on that list. I added one bullet to `docs/FERPA.md` and one `<li>` to `privacy.html`, worded in each file's own voice, and set both *Last updated* lines to 23 October 2026. The shared data-flow statement is untouched.

I made the change now rather than leaving it for WO-3.73, even though no screen can write a record yet. WO-3.73's deliverables do not mention these documents, so deferring would most likely have meant nobody did it.

## Files changed

- `src/term-record.js` (new): one writer and six readers — `recordTerm`, `termEnded`, `termEndsToday`, `newestRecord`, `noLongerMatching`, `emptyBoxes`, `heldColumns`.
- `src/shell.js`: imports the module and puts it on the `window.planbook` seam. This follows the precedent of `src/merge-fields.js`, so the module is part of the app's module graph.
- `src/backup.js`: `termRecords` added to `CONTENT_COLLECTIONS`. `wo-sweep.mjs` § 14 requires every documented top-level key to be classified, and a recording is something the teacher did.
- `sw.js`: the module added to `SHELL`, and `CACHE` bumped from v197 to v198. The comment I added there has no apostrophe, because of the WO-3.66 scar.
- `docs/data-model.md`: the key in the document sketch, plus a new section, *Recording a quarter's grades*.
- `docs/FERPA.md`, `privacy.html`: as above.
- `plans/work-orders/phase-3-gradebook.md`: the Open line answered and the 11 boxes ticked. That file's WO-3.72-and-later tail is CRLF in HEAD. The Edit tool had rewritten it to LF, and I restored the CRLF endings. The diff is now only the real lines.
- `plans/closing-a-quarter.md`: the ruling beside question 9.
- `tools/verify/term-record.mjs` (new): 17 call sites, 16 results.
- `tools/verify-shell.mjs`: imports the new section and runs it after `held-readers.mjs`.
- `tools/README.md`: the call-site count moved from 2089 to 2106, plus a count-history paragraph.
- `TESTING.md`: § WO-3.72.

## Decisions the work order did not settle

1. **A roster student whose grade has gone is reported**, with `live: {percentage: null, letter: null}`. This is the one place I may have departed from the brief, so check it. The brief's parenthetical describes the walk as "students whose live `classGrade()` has a percentage". I kept the roster as the only thing walked, which is what that sentence was guarding, but I also report a student who was recorded and now has no grade. That follows the work order's own definition ("live percentage or letter differs from the newest record"), and it is the case where Blackbaud holds a grade and Planbook holds none. A harness check asserts it. If the owner wants such students left out, it is one line in `noLongerMatching()` and one check.
2. **`noLongerMatching()` returns `null` when the term is unrecorded and `[]` when nothing changed.** The bar has different wording for "not recorded" and "nobody changed", so the two answers must not be confused.
3. **An empty recording is allowed.** If no student has a grade, `recordTerm` still writes an entry with `grades: []`. Refusing it would leave a bar that no tap could ever clear.
4. **The writer does not check whether the term has ended.** When to offer a recording is the bar's question, for WO-3.73.
5. **Empty boxes come from `openWork()` (`open` and `bonus` rows)** rather than a second test of each cell. That keeps the count in step with the queue's *N to grade*. The cost is that work filed under no category is not counted; the module and the data model both say so.
6. **`heldColumns()` is a sixth reader I added.** The work order says held columns are "a reader of their own, by name", and WO-3.73 says every figure it shows comes from WO-3.72's readers, including the held-column line. No acceptance line here tests it beyond the empty-boxes check.
7. **Reader signatures** set the convention for WO-3.73 to WO-3.75:
   - the document readers take `(doc, cls, termId)`;
   - `termEnded` and `termEndsToday` take `(cls, termId, today?)`, because they read nothing in the document;
   - the writer takes `(cls, termId)` and reads `getDoc()`, as the log's writers do.
   Readers return ids and figures, never a student's name. `newestRecord` returns a copy, not the stored object.
8. **Percentages are compared through `formatPercent()` imported from `src/scores.js`.** That is the existing precedent in `src/signals.js` and `src/grading-mode.js`. Nothing in the `scores.js` graph reaches this module.

## Not done, and why

- **`CHANGELOG.md` is not written.** The brief asks for a draft entry in the file, but my standing instructions say the teacher writes it. Draft below.

**Out-of-scope observation, not acted on:** in `tools/verify/log-entries.mjs` around lines 376–386, the "append-only" check's regexes look like they lost their backslashes. `initGuard` is `/if (!Array.isArray(d.log))s*d.log = [];/`, and the `.logs*=` patterns have the same shape. If so, the guard-lifting and reassignment search are not matching what their comments describe. It passes today for other reasons. Worth a look separately.

## Draft CHANGELOG entry (for the teacher to edit or drop)

```
### A quarter's grades can be recorded, and the app can tell when they stop matching — 2026-10-23

WO-3.72, owner-directed, from the closing-a-quarter thread. `CACHE` v198. No screen yet — the bar and
the *Record Q1 grades* dialog are WO-3.73.

- **A class's quarter can be recorded**: every graded student's percentage and letter, as the grade
  engine has them, and when. Recording again keeps the old one and the newest wins; nothing deletes
  a recording, and a recorded quarter stays fully editable.
- **Whether a quarter still matches is worked out every time and never stored.** A changed score,
  weight, letter scale or drop count shows up as the exact students whose percentage or letter moved —
  a move inside one letter counts. A student who has left the class is left out (the owner's ruling).
- **The empty boxes in a quarter are counted** — no score and not X or M, a late mark alone included,
  a dropped cell and a held column never — with the categories they are in.
- **Old backups restore as unrecorded**: the record is written only when used, and the schema did not
  change. The privacy policy and the FERPA document now list the recorded grades among what is stored.
```
