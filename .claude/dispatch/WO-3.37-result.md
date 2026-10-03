# WO-3.37 — result (implementer, Claude Opus, 2026-10-03)

**Summary.** The quiet-list sentence now says why there is no grade, using what `classGrade()` already returned. **Acceptance line 1 is met and ticked.** **Line 2 is left unticked on purpose**, and it needs your ruling. The weights-unbalanced case can be reached today, and the harness's own existing fixtures reach it 92 times. Fixing it, which the work order's "Read this at dispatch" paragraph asks for, means those rows can't stay byte-identical. Every other row is byte-identical. Nothing is committed.

## What changed

- `src/signals.js`
  - `quietSentence(percentage, grade, said, days, who)` now takes the grade object. The call site in `quietMiddle()` passes the `grade` it already had.
  - It prints *has no graded work yet* only when `grade.reason === 'no-graded-work'` **and** `grade.message === 'There is no graded work yet.'` (a local `NOTHING_GRADED` constant).
  - Every other null grade reads *has no grade*, and the engine's own `message` is added after it as a separate sentence.
  - A student with a grade gets exactly the same sentence as before.
  - No score is read and no grade is re-run. The function's inputs are `reason` and `message` off the grade object, nothing else.
  - The comment at `quietSentence()` argues the choice: appending the engine's sentence keeps one author of the explanation. It also fails safe: if the engine ever rewords its nothing-graded message, that case falls through to *"has no grade … There is no graded work yet."* That is wordier but still true.
- `sw.js`: `CACHE` bumped from `planbook-shell-v155` to `v156`, because `src/signals.js` is in `SHELL`.
- `tools/verify/points-grade.mjs`: two new `check()` calls in WO-3.34's block, right after the WO-3.35 extra-credit CSV check.
  - (a) Ed's quiet row read off `signalsModel()`. Cy beside her must still read *is at 85.00%*.
  - (b) The same class passed to `quietMiddle()` as a plain weighted copy whose weights total 90. The copy is never written to the document. Cy, who has a 15/20 test, must read *has no grade … The category weights total 90%, so there is no grade yet.*
- `tools/README.md`: call-site count changed from 1665 to 1667, plus a WO-3.37 paragraph with the executed count (1676 to 1678) and the run figures.
- `TESTING.md`: new § WO-3.37 with the reachability finding, the evidence for both lines, and the mutation table.
- `plans/work-orders/phase-3-gradebook.md`: line 1 ticked. Line 2 left `[ ]`, with an italic note under it pointing at the conflict. The status line was not touched by me (it already read 🤖 CLAIMED).

## Is weights-unbalanced reachable on the quiet list? Yes, today, in a weighted class

Nothing on the way from the class list to the sentence skips a class whose weights don't total 100:
- `src/signals-view.js` `collect()` walks every active class through `classesShown()` (~230) and calls `quietMiddle()` at ~286. There is no balance test.
- `evaluate()` (`src/signals.js` ~1972) and `quietMiddle()` (~2132) have no balance test either.
- Unbalanced weights are a state a teacher can save:
  - `isProvisional()` in `src/categories.js` (~181).
  - The remove-category dialog says *"…so this class totals N% until you set them"* (`src/categories.js` ~593).

`weighted()` (`src/grade-engine.js` ~257) refuses with `weights-unbalanced` before it looks at any score, so no student in such a class has a grade. The grade rules can't fire, and most of the class lands on the quiet list. Before this change, each of those students was told *"has no graded work yet"* over scored work.

The harness's existing fixtures hit this 92 times in one run:
- *WO-1.22 Copy Source* at 95%
- *Period 1 — Biology* at 59.9%
- *WO-6.5 Register*, *WO-2.56 Strip* and *WO79 Class Sentinel*, which have no categories at all (0%)

## Acceptance, line by line

### 1. In a points fixture, an extra-credit-only quiet student is not told she has no graded work, mutation-proved — MET, ticked

- **Final full run** on the delivered tree: `node tools/verify-shell.mjs`, exit 0, `1678 checks · 1678 passed · 0 failed · 0 skipped`, 53,427 lines, 698s.
- The new check's own PASS line, from the earlier run with the fix in (`1678 · 1678`, exit 0), quotes Ed's row: *"In WO-3.34 Points, Ed Cordero has no grade and nothing has been written down, said or sent about them all term — 32 days. The only work graded so far is extra credit, so there is no grade yet for it to add to."*
- **Mutations.** They ran on a scratch harness, `tools/wo337-scratch.mjs`, which held only `localstorage-prefs` and `points-grade`; it is now deleted.
  - Baseline: 26/26, exit 0.
  - Each mutation was marked `MUTATION`. `src/signals.js` was restored from a copy and SHA-256-checked after each one: `a9988d82…`, identical every time.

| Mutation | Exit | Result |
|---|---|---|
| M1: standing back on `percentage === null` alone, nothing appended (the work order's named mutation) | 1 | 24/26: both WO-3.37 checks red |
| M2: genuine test on `reason === 'no-graded-work'` alone | 1 | 25/26: the extra-credit check red. The unbalanced check stayed green, as expected, because its reason differs. This proves `reason` alone is insufficient. |
| M3: engine sentence never appended | 1 | 24/26: both WO-3.37 checks red |

- `grep -rn MUTATION src tools` prints 19 lines, which are the same 19 lines `git grep -n MUTATION HEAD -- src tools` prints. They are prose, not markers. The only difference is one README line number shifted by my added paragraph.

### 2. Every quiet row the existing fixtures draw is byte-identical before and after — NOT TICKED, needs a ruling

**Method:**
- I added a temporary `console.log('WO337CAPTURE ' + studentId|classId + ' ' + explanation)` at the foot of `quietMiddle()`, and a temporary line at the entry harness's summary that wrote the captured lines to a scratch file.
- Full run on the tree before any `src/` edit: `1676 · 1676 passed`, exit 0, 600 rows captured.
- Full run with the fix: `1678 · 1678 passed`, exit 0, 606 rows.
- Both temporary lines were removed before the final run. `git diff` shows neither.
- I stripped the run-minted ids, then compared the captures as sorted multisets.

**Findings:**
- **503 of 600 rows are byte-identical**: all 212 graded rows and all 291 genuine *has no graded work yet* rows.
- **97 changed**:
  - 5 are Ed, the very student line 1 requires to change.
  - 92 are the unbalanced fixture classes listed above.
- Reversing each changed row's new form back to the old sentence reproduces the before-capture exactly. The only exception is the 6 rows my two new checks add. So nothing else moved.
- **The literal line cannot be true while "Read this at dispatch" (and line 1) are honoured.**

**One sub-question for the owner:** what should a class with **no categories** (0%) and nothing graded say?
- It now reads *"The category weights total 0%, so there is no grade yet."* That is true, and it is the same message student detail's banner shows for that grade.
- The old *has no graded work yet* was also true there.
- Telling the two apart would mean reading scores in `src/signals.js` (the Traps forbid it) or changing the engine (the brief forbids it). So I didn't.

## Other commands

- `node tools/wo-sweep.mjs`: exit 0, `46 checks · 43 passed · 0 failed · 3 to review`. These are the three standing reviews (sensitive field names, due-date/late lines, the mockup banner).
- `node tools/wo-gate.mjs WO-3.37`: `PASS | gates clear`. It printed the expected notes: CLAIMED in flight, and no result file yet at the time it ran.

## Not verified / not done

- No 👤 lines on this row. Nobody has looked at the signals screen. The wording was checked as strings, not as a rendered row on a device.
- No CHANGELOG entry. Draft for you to decide on: *"The quiet list no longer tells you a student has no graded work when the real reason is that the category weights don't total 100% (or, in a points class, that only extra credit is graded); it says the reason instead."*
- Not committed, per the brief.

## Decisions the work order didn't settle

- **Append the engine's message vs. compose a phrase.** I appended it, for the reasons in the comment above. The standing reads *has no grade* rather than *has no grade yet*, so it doesn't say "yet" twice next to the engine's "so there is no grade yet."
- **How to tell genuine from extra-credit.** The test is `reason` plus an exact match on the engine's nothing-graded message. I did not export the constant from the engine, because the brief forbids engine changes. This is a string coupling to `src/grade-engine.js` lines 266 and 355, and it fails safe as described above. A possible follow-up: the engine could export that sentence as a named constant so the quiet list matches on the name rather than on text. I didn't make that change.

## Files changed

- c:\dev\planbook\src\signals.js
- c:\dev\planbook\sw.js
- c:\dev\planbook\tools\verify\points-grade.mjs
- c:\dev\planbook\tools\README.md
- c:\dev\planbook\TESTING.md
- c:\dev\planbook\plans\work-orders\phase-3-gradebook.md
- c:\dev\planbook\.claude\dispatch\WO-3.37-result.md (this file)
