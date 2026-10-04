# WO-3.31 — the categories editor offers total points · result

**Implementer:** Claude Opus (work-order-implementer), 2026-10-04. Nothing committed. The row's status is unchanged (`🤖 CLAIMED`). There are no live mutations in the tree: `grep -rn MUTATION src/ tools/verify/grading-mode.mjs sw.js index.html` prints only `src/shell.js:975`'s standing prose.

## What was built

- **`src/grading-mode.js` (new).** The mode control's paint, the share lines, the preview (`previewModeChange()`, which is the whole dialog as data), and the confirmation (`openModeChange` / `requestModeChange` / `confirmModeChange` / `cancelModeChange`). It imports the engine (`classGrade`, `gradingModeOf`, `letterFromPercentage`, `pointsShare`), `classAverage` / `formatPercent` / `gridOrder` from `src/scores.js`, `getTerms` from `src/classes.js`, `formatWeight` / `weightTotal` / `categoriesOf` from `src/categories.js`, and `rosterName`. **`src/categories.js` is untouched** and imports none of it, so the loop the Traps warn about stays shut.
- **`src/shell.js`.** Imports the module. The `data-category-manage` hook opens the editor and then calls `gradingMode.paintEditor(classId, classes.getOpenTermId(classId))`, so the term is resolved where the class id already is. `afterCategoryChange()` calls `gradingMode.repaintEditor()` first. The three new hooks are `data-grading-mode`, `data-grading-mode-confirm` (which chains `afterCategoryChange()`) and `data-grading-mode-cancel`. They are documented in the header's hook list, and `gradingMode` is on the `window.planbook` read seam.
- **`index.html`.** `#categoriesModal` gets the two pills (static markup, updated rather than rebuilt, so focus can return to the tapped pill). The opening sentence's weighted tail and both weighted hints are now `data-category-mode-text="weighted"` blocks. Points blocks sit beside them, and the points hint names the open term in `#categoryShareTerm`. The new `#gradingModeModal` is placed before the removal confirm. A weighted class's panel renders the same words as before; the harness asserts the opening sentence word for word.
- **`src/scores.js`.** `classAverage()` is now exported (it was not moved, and only a comment was added). The score grid calls the same function as before.
- **`src/shell.css`.** A new section with `.grading-modes`, `.category-weight:disabled` (greyed), `.category-share`, `.category-loose` (the dashed no-category row, deliberately **not** `.category-row`, because `src/categories.js` and `categories-weights.mjs` treat every `.category-row` as having a name field), `.mode-change-facts` and `.mode-change-line`. All of them are in the coarse block in the same pass.
- **`sw.js`.** `CACHE` is now `planbook-shell-v161`, and `./src/grading-mode.js` is in `SHELL`.
- **Harness.** New `tools/verify/grading-mode.mjs` (20 call sites, of which one is a fixture-guard failure arm), registered after `points-grade.mjs`. `tools/README.md`: the count is now 1699, the "seventy-nine files" sentence is updated, and a history paragraph is added.
- **Docs.** `TESTING.md` § WO-3.31 (the record and the mutation table), one comment line in `docs/data-model.md` naming the key's only writer, and seven boxes ticked in `plans/work-orders/phase-3-gradebook.md`.

## Against the Acceptance list

1. **[x] Weights byte-identical, no key left.** Two round trips through the real pills and confirm button. The first is the 50/50 class, including a category added on points whose stored weight 0 survives. The second is the 40/35 class. `JSON.stringify(cls.categories)` is equal before and after, and `hasOwnProperty('gradingMode')` is false. Mutation-proved by M3 ("weighted" written instead of deleted): 2 red.
2. **[x] Figures equal `classGrade()` per mode; list = letter differences; mutation-proved.** The hand figures are 82.50% and 84.55%, and the engine asked directly agrees. Listed: Abbot *C → B* and Dunn *B → C*. Brook's percentage moves inside her A (92.5 → 94.55) and she is not listed. A no-grade side counts as a change: *no grade → A* / *A → no grade* on the 40/35 class. **M1** (the work order's own mutation, comparing percentages instead of letters): 3 red.
3. **[x] Averages equal the score grid's.** The grid's summary read 82.50% weighted before the switch and 84.55% on points after it, for the same class and term. Those are exactly the dialog's two lines.
4. **[x] Two-term fixture.** With Q2 open, the dialog shows *Q1: 2 letters would change.* With Abbot's and Dunn's Q1 scores removed, so that Brook is an A either way, neither the line nor its label is drawn.
5. **[x] Cancel writes nothing.** `rev` read after `flush()` is the same before and after (240/240 in the full run), with no key and the categories unchanged. Mutation-proved by M2 (a no-op `update()` in cancel): 1 red.
6. **[x] Points-mode editor.** In points mode:
   - the weight inputs are disabled, with their values unchanged;
   - `#categoryTotal` is not drawn;
   - the title is *Categories & points*, and the opening sentence has the points text with no "how much each part counts";
   - the share lines equal `pointsShare()` row for row: Tests 83.33%, Homework 8.33%, no category 8.33%;
   - an empty points term reads *Tests — No work assigned yet*, with no "0%" in the list.

   Mutation-proved by M4 (no-category row dropped): 2 red.
7. **[x] 44px under coarse.** `matchMedia('(pointer: coarse)')` is true. The pills measure 146×44 and 98×44. The confirm, Cancel and close buttons measure 150×44, 67×44 and 44×44.
8. **[ ] 👤 Laptop and iPad reading. Not ticked, and I cannot tick it.** It needs a person. **Force-quit from the app switcher first.** The build is v161.

## Commands, as read from their output

- `node tools/verify-shell.mjs` (full run, delivered tree): **`1709 checks · 1709 passed · 0 failed · 0 skipped`**, 54,350 lines, 31.8 lines per check, 721s, `EXIT=0`, real clock 2026-10-04.
  - The first full run was red: 7 of my own checks failed, and the rest of the suite was green. The cause was in the fixture: Q2 was dated in the future, and entering a class through its card moves to the term holding today. I re-dated the terms off `lib-dates.mjs`'s `nodeDaysFromToday()`.
  - After the green run, two edits were made: one comment line in `grading-mode.mjs`, which renames a word so that a `grep MUTATION` audit does not flag it, and docs outside `SHELL`.
- `node tools/wo-sweep.mjs`: **`46 checks · 42 passed · 0 failed · 4 to review`**, exit 0. Three of the reviews are the standing ones. The fourth is the working-tree review for `.category-loose` and `.mode-change-facts` having no coarse-block rule. Both are containers, not touch targets.
- `node tools/wo-gate.mjs --audit`: PASS.
- Mutation round: done with a scratch copy of the entry harness that held only `grading-mode.mjs` (19 checks, green on the delivered tree). `src/grading-mode.js` was restored from a copy after each mutation, and its SHA-256 (`c27d78ec…`) matched the original every time. The scratch harness is deleted.

## Decisions the work order did not settle

- **Mockup: skipped, and the reason is written down.** The control is the letter-scale panel's own pill row, a share is one line inside a row that already wraps, and the confirmation is the removal confirm's grammar with a neutral list instead of the red one. The ruling is stated in `src/shell.css` at the new section.
- **`classAverage()`: exported, not moved.** The new module needs `formatPercent()` from `src/scores.js` regardless. `src/signals.js`, `src/merge-fields.js`, `src/detail.js` and `src/grades-report.js` already import `src/scores.js` for that function. Nothing in `src/scores.js`'s graph reaches `src/grading-mode.js`, so no loop closes, and `src/categories.js`'s path is untouched. Moving only the mean to a leaf would have left the import in place anyway.
- **How the editor speaks its mode without importing the engine.** `src/categories.js` draws its rows the way a weighted editor always has. `src/grading-mode.js` then repaints over them in the same task (disabling the weights, hiding the total, adding the shares, switching the title and text blocks), called from `src/shell.js`. The cost is that every path that redraws the editor's rows must chain `afterCategoryChange()`. All six existing paths already did. The file header says this.
- **Letter comparison.** *No grade* is its own value. `letterFromPercentage(null)` returns the lowest band, because `Number(null)` is 0, so a null percentage never reaches it. A grade that falls in no band shows its percentage with "(no letter)" and still counts as distinct from no grade.
- **Wording.** Pills: *Weighted categories* / *Total points*. Points title: *Categories & points*. Dialog titles: *Grade on total points?* / *Go back to weighted categories?*. The lead says the switch changes every grade in every term, "including a finished one whose letters are already in the SIS". The amber line on a way back with weights that do not total 100 names the total and says no student has a grade "in any term" until they add up. Shares use `formatWeight()` (for example 83.33%) rather than the work order's illustrative "62%".

## Noticed and left alone (out of scope)

- **The class manager's amber "weights 75%" row warning still shows for a points class** whose weights do not total 100 (`src/classes.js` `classRow`, `isProvisional()`). In points mode that is a warning about nothing. It is a follow-up.
- **The removal confirm still advises "set its weight to 0 instead — … the grade stops using them"** in points mode, which is false there. That dialog is drawn by `src/categories.js`, which cannot know the mode. It is a follow-up, alongside the item above.
- **`addCategory()` announces "at 0 percent"** in points mode. That is true of the stored weight but is weighted language.
- **`renderTotal()` can still announce a weights-total crossing** after a removal in points mode, while the line is hidden. It is screen-reader only and minor; the fix would be in `src/categories.js` ("a hidden line is not announced").

## Changelog draft (the teacher's to keep or discard)

> The categories editor can now grade a class on total points. Two pills under the opening sentence choose weighted categories or total points. Neither one switches anything by itself: the confirmation shows the class average under each mode, every student whose letter would change in the open term, and how many letters would change in every other term, including a finished quarter already in the SIS. On points, the weights are kept exactly as typed and greyed out, and each category shows its share of the points assigned so far. Going back restores the weights untouched.

## Files changed

- New: `src/grading-mode.js`, `tools/verify/grading-mode.mjs`, `.claude/dispatch/WO-3.31-result.md`
- Modified: `index.html`, `src/shell.js`, `src/shell.css`, `src/scores.js`, `sw.js`, `tools/verify-shell.mjs`, `tools/README.md`, `TESTING.md`, `docs/data-model.md`, `plans/work-orders/phase-3-gradebook.md` (7 boxes ticked; status untouched)
