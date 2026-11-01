# WO-3.80 — a held column filed under no category is listed nowhere · result

**Implementer:** Claude (work-order-implementer), 2026-11-01. Nothing committed. No --start/--release/--handoff run.

## The design call (the work order left it to me)

**Widened the two held readers; did not add a held twin of `uncategorizedWork()`.** I stated why at the point of departure, above `heldWork()` in `src/grade-engine.js`. Every reader of held work already asks `heldWork()` / `heldExcusedWork()`: the home card, the queue, and student detail twice. Widening the readers means none of those four call sites has to remember an extra concatenation. It also means the hero's *· N held*, the held card and the CSV's held rows cannot drift apart, which is the owner's 2026-11-01 agreement rule.

How it is cut:
- `looseAssignments()` is now `looseColumns()` filtered to live columns. It returns exactly what it returned before.
- A new `heldLooseColumns()` is the held half of that same walk. It is the twin of `heldColumnsFor()`, so an uncategorized column falls in exactly one half by construction.
- `heldWork()` and `heldExcusedWork()` each take the held half after the class's categories, with `categoryId: null`.
- `openWork()` is untouched, and nothing in `src/` outside the engine reads `.held` (§ 30 is green).

## Files changed

- `c:\dev\planbook\src\grade-engine.js`: `looseColumns()` and `heldLooseColumns()`; the held half added to `heldWork()` and `heldExcusedWork()`; their comments corrected (they said "categorized work only").
- `c:\dev\planbook\src\detail.js`:
  - `heldPieces()`: one list for both the screen and `detailModel()`. It concatenates the two engine readers, then a stable split moves the null-category rows to the foot.
  - `heldWhere()`: names a row by `LOOSE_NAME` when its `categoryId` is null.
  - The `LOOSE_NAME` import.
- `c:\dev\planbook\src\glance.js`, `c:\dev\planbook\src\home.js`: comments only. These were the sentences saying a held uncategorized column was in no source. No code changed: the rows arrive through the same `take`.
- `c:\dev\planbook\docs\data-model.md`: `heldWork()`'s scope sentence.
- `c:\dev\planbook\sw.js`: `CACHE` v205 → v206.
- `c:\dev\planbook\tools\verify\uncategorized-to-grade.mjs`:
  - WO-3.76's held-column assertions are turned around, not deleted. P's card now reads 3 on both sides of the commit, and `wo376-ph` is a held queue row. The empty-boxes agreement is now held to the queue's live rows only, because the Record dialog counts held work on its separate held line. The header comment says all this.
  - New block `heldLoose()` (WO-3.80), called at the end of `run()`.
- `c:\dev\planbook\tools\README.md`: call-site count 2178 → 2185, plus a ledger paragraph.
- `c:\dev\planbook\TESTING.md`: § WO-3.80 under Phase 3.
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md`: all six Acceptance boxes ticked. None is a 👤 or 📆 line. Status left at 🤖 CLAIMED, for the orchestrator.

## Acceptance, line by line

The `heldLoose()` fixture is a weighted class and a points class with the same shape, and two students, Ada and Ben:
- **e**: Essays. Ada 80, Ben blank.
- **c**: Essays, gets held. Ada blank, Ben excused.
- **h**: no category, gets held. Ada excused with 62 kept, Ben blank.
- **u**: no category. Ada blank, Ben 50.

Every column starts live. c and h are held through `holdColumn()` and then committed through `commitColumn()`.

1. **Listed on the held card and in the CSV's held rows, weighted and points.** ✅
   - Full run: `PASS | WO-3.80: a held column filed under no category, with one blank and one excused cell, is listed on student detail's held card and in the student CSV's held rows …`.
   - It asserts the exact card rows in both classes, with *no category* after Essays. Ben's two engine readers hand his rows the other way round, so this proves the reordering rather than inheriting it.
   - It also asserts `Held out of the grade · 2 pieces`, the hero's `· 2 held`, the CSV lines `Wo380 held loose,no category,100,"held — excused, 62 kept"` and `…,held — not graded yet`, and that neither excused cell is also on the excused card.
   - A companion check, `PASS | WO-3.80: a held row and a live row never answer for the same cell`, covers no double-listing.
2. **Card and queue show it held; *N to grade* unchanged by the hold.** ✅
   - `PASS | WO-3.80: the home card and the queue show …`.
   - The card reads 4 to grade in both classes before the hold, during it and after the commit.
   - The h queue row carries the engine's `held` marker and a null category, and is drawn `· no category · held`.
   - The home card has no held word of its own. Since WO-3.47 its *N to grade* counts held columns' blanks, so "shows it" there means *counted as a held categorized column is*. That reading is stated in TESTING.md.
3. **No projection moves; commit moves its work back to open like a categorized column.** ✅
   - `PASS | WO-3.80: no projection's figures move …`. The while-held figures match the hand-worked ones. Points: Ada 80 · 90 · 40, Ben 50 · 75 · 25 (Ben would read 83.33 and 16.67 if h were projected). Weighted: Ada 80 · 80 · 80, Ben — · 100 · 0.
   - They also equal the same readings on a document copy with c and h deleted outright. The figures before the hold and after the commit are identical.
   - `PASS | WO-3.80: committing moves …`. Every held row reappears in the live reader of its kind with the same id and state: c in `openWork()` and `excusedWork()`, h in `uncategorizedWork()` and `excusedWork()`. The held readers end up empty, no held card is drawn, and the card stays at 4.
4. **Mutation red, reverted, red output in TESTING.md.** ✅
   - I replaced both new lines (`workRows(…heldLooseColumns…)` in `heldWork()` and `excusedRows(…heldLooseColumns…)` in `heldExcusedWork()`) with `// MUTATION (WO-3.80): …` comments.
   - I ran a scratch copy of `verify-shell.mjs` filtered to five sections. It was `tools/zz-scratch-wo380.mjs` and is now deleted. Result: `54 checks · 47 passed · 7 failed`, `EXIT=1`.
   - The same scratch run on the clean tree read `53 passed · 1 failed`. That one failure is `classes-terms.mjs` throwing because the filter removed the sections it depends on, so it is an artifact of the filter, not a finding. The mutation therefore turned six checks red:
     - WO-3.76 check 1: P's card said `2 to grade`.
     - WO-3.76 check 2: the panel had no `wo376-ph` row.
     - WO-3.76's held check: `"held":{"card":"2 to grade",…`.
     - WO-3.80 listed: `"title":"Held out of the grade · 1 piece"`, `"sub":"… · 1 held"`.
     - WO-3.80 listed-once: `"held":["wo380-wc:open"],"heldExcused":[]`.
     - WO-3.80 card/queue: `"held":{…"card":{"w":"3 to grade","p":"3 to grade"}`.
   - The projection and commit checks stayed green, as they should: after a commit nothing is held, so there is nothing for the mutation to drop. The full red block is in TESTING.md § WO-3.80.
   - I reverted by restoring the pre-mutation copy before writing anything else.
   - `grep -rn MUTATION src/ tools/` is **not empty, and it was not empty before this work order either.** It returns 18 lines, the same 18 as `git grep -n MUTATION HEAD -- src tools`. All are prose that already existed: `src/shell.js:1095`, several in `tools/README.md`, comments in `keys-legend-guards.mjs`, `outreach.mjs`, `score-grid.mjs` and `score-search.mjs`, and `tools/wo-gate.mjs:2800`.
   - `git diff -U0 -- src tools sw.js | grep -c MUTATION` reads 0, so no live mutation is left.
5. **verify-shell and wo-sweep pass.** ✅
   - `node tools/verify-shell.mjs`, full run, after the revert: `2188 checks · 2188 passed · 0 failed · 0 skipped`, `71,069 lines · 32.5 lines per check · 1221s`, `EXIT=0`. That is six more than 2182, all from `heldLoose()`.
   - `node tools/wo-sweep.mjs`: `52 checks · 49 passed · 0 failed · 3 to review`, `EXIT=0`. The three reviews are the standing ones. The call-site check matches at 2185, and § 30 and § 31 are green.
   - After the full run, only docs were written: TESTING.md, the README ledger, the phase file and this file.
6. **TESTING.md § WO-3.80 with lines verbatim and evidence.** ✅ It is under `## Phase 3 — Gradebook`, after § WO-3.76.

**Not verifiable by me:** nothing in this work order is a 👤 line. I have not seen it on an iPad. The held card's new *no category* label uses the existing `.detail-missing-when` span and adds no CSS.

## Decisions the work order did not settle

- **Where the reorder lives.** The engine's readers each put the pile after the categories. Detail concatenates two readers, though, so a loose blank would land above a categorized excused cell. I did the stable split in `detail.js`'s `heldPieces()` rather than in the engine, because the order is a decision about how this screen lists rows.
- **Naming.** `categoryName()` prints nothing for a null category in a weighted class, because only a points grade carries a *no category* row. So I added `heldWhere()` with the engine's `LOOSE_NAME`, the same choice `src/glance.js` made at WO-3.76.

## Declined (out of scope — noted, not done)

- **Live uncategorized open work is still not named on student detail.** After the commit, Ben's blank in h shows on the card, the queue and the Record dialog, but not on detail's to-move card or the CSV's live Work rows, which come from `openWork()`. The engine's comment already records this as "one honest limit". It is a booking if wanted.
- **The excused card does not name a loose excused piece in a weighted class.** It uses `categoryName()`, the same gap `heldWhere()` closes for the held card. That is WO-3.70's surface.
- WO-3.81 (missing marks on uncategorized work) and its status file are untouched.

## Draft CHANGELOG entry (the teacher decides)

> **A held column filed under no category no longer disappears.** Holding an assignment that isn't in a category, for example while you re-key it against Blackbaud, used to take it off the home card's *N to grade*, the grading queue, the student's *Held out of the grade* card and the student CSV. It now shows everywhere held work shows: marked *held* on the queue, listed under *no category* after your categories on the student's card and in the file, and still counted toward nothing in the grade. Holding a column no longer changes *N to grade*, and committing it puts the work back exactly as for a categorized column. (WO-3.80)
