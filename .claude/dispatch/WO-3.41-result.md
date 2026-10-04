# WO-3.41 — result

The mutation was made and reverted before anything else was written. `src/grade-engine.js` was restored
from a copy and its SHA-256 matches the pre-mutation bytes (`d4296bb4…a82c`). `grep -n MUTATION` over
the changed code files finds nothing. The only matches are older prose in `tools/README.md` and the
mutation table in `TESTING.md`.

## What changed

`weighted()` in `src/grade-engine.js`: the `!isBalanced(cls)` test is still the first test, and it still
returns `noGrade('weights-unbalanced', …, total, [])`. The only change is inside that branch. The
message is now chosen by `categoriesOf(cls).length`:

- has categories: `'The category weights total ' + formatWeight(total) + '%, so there is no grade yet.'`, the same expression as before.
- has none: `NO_CATEGORIES_MESSAGE` = *"This class has no grading categories yet, so there is nothing for a grade to be an average of."*

**Wording decision.** The work order left the wording to this dispatch. I took the score grid banner's
existing clause for the same state (`src/scores.js` ~681, *"<name> has no grading categories yet, so
there is nothing for a grade to be an average of."*) and used "This class" in place of the class name.
That way the grid and the engine say the same thing, and the sentence avoids weights and "0%". It also
reads correctly after the quiet row's "has no grade". The brief's example, *"…so there is no grade"*,
would have printed "has no grade … so there is no grade" on the same row.

## Acceptance, line by line

1. **[x] A weighted class with no categories, on student detail and in the quiet list, is not told its weights total 0%. Mutation-proved.**
   A new block at the foot of `tools/verify/points-grade.mjs` plants a weighted class `c_wo341` (no `gradingMode`, `categories: []`). Kai has one unfiled 20-point piece scored 18, and Lu has nothing. It runs three checks:
   - the engine's reason is still `weights-unbalanced`, the total is still 0, the rows are empty, and the message is the new one (both students);
   - student detail, reached through the score grid's name link: the banner `.grade-none-text` and the hero's `aria-label` both carry the new sentence, and `#detailContent` contains no standalone "0%" and no "weights total";
   - both quiet rows from `signalsModel()` start "In WO-3.41 Unset, <name> has no grade and", end with the new sentence, and contain no "0%" or "no graded work".

   `verify/grade-engine.mjs` also gains case 8, fourth direction: the no-categories message on a bare fixture.

   **Mutation M1** put the old message back for the no-categories branch. Scratch harness (localstorage-prefs, grade-engine, points-grade): `63 checks · 59 passed · 4 failed`, exit 1. The case 8 fourth-direction check and all three WO-3.41 checks went red. The detail check read `"banner":"The category weights total 0%, so there is no grade yet."` After the revert the same scratch harness gave `63 checks · 63 passed`, exit 0, and the scratch file is deleted.

2. **[x] Every row the harness's existing fixtures draw for a class that has categories is byte-identical before and after.**
   Evidence:
   - **Structural:** with categories present, the returned message is the same expression over the same inputs, and nothing else in the engine moved.
   - **Measured:** existing pinned assertions pass and none of them was edited. These are case 8 first direction (95%), case 8 third direction (94.8%), and WO-3.37's weighted 90% quiet row (run1.log lines 264, 266, 1095). A new check also confirms that a class whose categories all weigh 0 still reads *"The category weights total 0%, so there is no grade yet."*
   - **Not done:** I took no before/after capture of every drawn row, unlike WO-3.37's 600-row capture. If the verifier wants one, that is the open gap.
   - **Fixtures whose rows do change:** some fixtures plant classes with `categories: []`, for example `first-run.mjs`. Their rows now read the new sentence, which is what this work order asks for. No existing assertion was pinned to the 0% sentence (`grep -rn "no grade yet" tools/verify` before the change).

## Runs (output read, not predicted)

- `node tools/verify-shell.mjs`, full run on the delivered tree: `1687 checks · 1687 passed · 0 failed · 0 skipped`, 53,747 lines, 31.9 lines per check, 729s, `EXIT=0`. The baseline was 1682, and the 5 new checks account for the difference.
- `node tools/wo-sweep.mjs` (final, after the doc edits): `46 checks · 43 passed · 0 failed · 3 to review`, exit 0. The 3 items to review are the standing ones. The call-site count went from 1671 to 1676, updated at `tools/README.md:1256` with a paragraph beside it giving the executed count.
- `node tools/wo-gate.mjs --audit`: PASS.

## Files changed

- `c:\dev\planbook\src\grade-engine.js` — the message branch, plus a comment explaining it
- `c:\dev\planbook\sw.js` — `CACHE` from v158 to v159 (grade-engine.js is in SHELL)
- `c:\dev\planbook\tools\verify\grade-engine.mjs` — case 8, fourth direction (2 checks)
- `c:\dev\planbook\tools\verify\points-grade.mjs` — WO-3.41 block (3 checks), which plants its own fixture and removes it by id
- `c:\dev\planbook\tools\README.md` — call-site count and a WO-3.41 count paragraph
- `c:\dev\planbook\TESTING.md` — § WO-3.41 with the mutation table
- `c:\dev\planbook\docs\data-model.md` — one clause: a no-categories class now gets its own message under the same reason
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` — both Acceptance boxes ticked, each with a note giving its evidence. Status left as 🤖 CLAIMED; I did not run `--tick`, `--start` or `--release`.

Nothing was committed. There is no 👤 line on this row.

## Notes for the orchestrator

- **Readers composing their own sentence:** `src/scores.js` (~679–686) composes its own banner and already separates the two cases. It is the source of the new wording and I did not touch it. `src/detail.js`, `src/grades-report.js` and `src/signals.js` print the engine's message, so they needed no change.
- **A comment I left alone:** the `src/detail.js` comment at ~956 says *"The banner above says what the weights come to and where to fix it."* That is slightly stale for the no-categories case. It is comment-only and outside this work order, so it is a possible follow-up.
- **The earlier ruling under WO-3.37's line 2:** it says *"a class with no categories and nothing graded keeps the new wording, 'The category weights total 0%…'"*. This work order supersedes it as booked. The prose under WO-3.37 is history and I left it unedited.
- **Draft CHANGELOG entry (the teacher decides):** *A class that has no grading categories yet now says so on student detail and the quiet list, instead of telling you its weights total 0%. Shell cache `v159`.*
