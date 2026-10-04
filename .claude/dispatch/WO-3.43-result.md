# WO-3.43 — removing a category moves its work to *no category* · implementer result

**Implementer** Claude (Opus), 2026-10-04. Nothing committed. `--start`/`--tick`/`--release`/`--handoff` not run.

## In one paragraph

`applyRemoval()` in `src/categories.js` now deletes the category and does one other thing: it clears
`categoryId` to `''` on each assignment filed under that category **in that class**. It no longer
filters `d.assignments` and no longer deletes from `d.scores`. The confirm still opens when work is
filed under the category, and it now says where the work goes in the class's own mode. Weighted: the
work stops counting until it is filed again, and the existing weights line stays. Points: the work
goes on counting, and no grade changes. The backup and "set its weight to 0" sentences are gone in
both modes, and so is the red: the facts panel is `.mode-change-facts`, the button is `primary`, and
the section label reads *Where its work goes*. The weights-crossing and add-category announcements
have points versions, and the weighted sentences are byte-identical to before. The removal
announcement says where the work went. The mode is read as `cls.gradingMode === 'points'` through a
local `gradedOnPoints()`, so the grade engine is not imported. `CACHE` is `planbook-shell-v162`.

## Files changed

- `src/categories.js`: `applyRemoval()`, `removeCategory()` dialog text, `gradedOnPoints()` (new,
  private), `renderTotal()` crossing announcement, `addCategory()` announcement, removal
  announcement, `factLine()` class. The long comment above `removeCategory()` is **rewritten**, not
  deleted: it now records the old cascade, why its premise (an orphan is silent) is gone, and the
  no-"delete too" ruling. The `assignmentsIn()`, `removalCounts()`, `copyCategories()` and header
  comments were reworded from "destroy" to "move".
- `index.html`: the header comment (~85–91), the comment above `#categoryRemoveModal`, the section
  label, the facts class (`class-delete-facts` → `mode-change-facts`) and the button class (`danger` → `primary`).
- `src/assignments.js`: the header's classId-guard paragraph (~20–30) and the comment above the *Not in
  a category* notice, which now names three ways in (removal is the usual one) and records that the
  wording was checked and kept. Also one stale "destroyed by a category removal" in the
  copy-category comment (~1201). No code change.
- `src/shell.js`: two comments in `afterCategoryChange()` that said a removal destroys the work. No code change.
- `src/letter-scale.js`: one comment citing the removal grammar as "takes assignments and scores with it". No code change.
- `src/shell.css`: two comments (the categories section header and `.mode-change-facts`). No rule changed.
- `sw.js`: `CACHE` `planbook-shell-v161` → `v162`.
- `docs/data-model.md`: the *no category* paragraph now says removal is the usual way in, what it
  writes (`''`, score column untouched) and what that means in each mode, and that this reverses
  WO-3.1. Its "left behind by a deleted category" became "an id from a document or build that did
  not clear it". I found no other sentence there saying removal cascades.
- `tools/verify/category-removal.mjs`: **new section** (12 `check()` sites, 11 executed on a green run).
- `tools/verify-shell.mjs`: imports and registers it straight after `grading-mode.mjs`.
- `tools/verify/categories-weights.mjs`: two checks **re-pointed** (see below), the fixture cleanup
  widened, and the section comment updated.
- `tools/verify/assignments.mjs`: four comments reworded ("destroy" → "move"). No assertion changed.
- `tools/README.md`: call-site count 1699 → 1711, plus a WO-3.43 paragraph with the run figures.
- `TESTING.md`: a new `### WO-3.43` section after WO-3.31's, with the mutation table and the 👤 line
  left `- [ ]`.

## Existing harness checks re-pointed, and why

Both are in `tools/verify/categories-weights.mjs` and both asserted the WO-3.1 cascade, which the
owner reversed:

1. *"removing a category that holds work warns first, and counts the assignments and scores it takes"*
   wanted `/cannot be undone/` and `/weight to 0/` in the lead. It now wants
   `"2 assignments and 3 scores move to no category"`, `"keeps the work filed under it"`, and **none**
   of `cannot be undone|backup|weight to 0` in lead and facts.
2. *"confirming takes the category, the assignments filed under it and their scores — and only those"*
   wanted `a_k1`/`a_k2` and their score columns **gone**. It now wants both present with
   `categoryId === ''`, both score columns present, and `a_k3` still filed under the bystander category.

The fixture cleanup after them now removes `a_k1`, `a_k2` and `a_k3` and their scores. Before, only
`a_k3` survived the removal. No check was deleted. The assignments.mjs check *"a category removal counts
only the work in its own class"* still asserts `/1 assignment\b/` and passes unchanged against the new
facts line ("1 assignment and 1 score move to no category.").

## Acceptance, line by line

1. **Assignments stay at `categoryId ''`, scores byte-identical, nothing else moves: met, and
   mutation-proved.** Evidence is in `category-removal.mjs`, weighted and points:
   - each moved assignment's JSON equals its pre-removal JSON with only `categoryId` changed;
   - `JSON.stringify(d.scores)` is equal before and after;
   - every other assignment's JSON is equal, including a plant in a third class carrying this class's
     Essays id, which still reads `k343we`;
   - the other classes' `categories` are unchanged.

   Mutations M1 (the old `d.assignments` filter back) and M2 (scores deleted) both go red, and so
   does M3 (classId guard dropped).
2. **Weighted grade: met.** By hand the class grades 86 and 46 before the removal. After it,
   `classGrade()` returns `reason: 'weights-unbalanced'` with `weightTotal` 60 for both students.
   Three surfaces name the same 60:
   - the dialog's fact line, "…totals 60% until you set them.";
   - the editor's total line, "⚠ Weights total 60%, not 100%…";
   - `formatWeight(weightTotal(cls))`, which reads "60".

   To show the moved work has no weight, Quizzes is then typed to 100 through its real field. The
   grade becomes 90 and 50, and `classGrade()` gives exactly the same answer for a copy of the
   document with both essays deleted. There is no `id: null` row.
3. **Points grade: met.** 80.625 and 40.625 by hand, `===` before and after. The engine's `null` row
   holds 150 possible points (120 and 60 earned). The editor draws `data-category-share="none"`
   ("no category — 93.75% of the points assigned so far").
4. **Confirm text: met, and mutation-proved (M4).** The whole `.modal-panel` text is checked: title,
   label, lead, facts, buttons. In points it has no `/weight/i`, no `0%` and no `/backup/i`. In
   weighted it has no `/backup/i`, no `/set its weight to 0/i` and no `/cannot be undone/i`. The
   button reads "Remove Essays", does not have the `danger` class, and its background is not
   `#e74c3c`.
5. **Announcements: met, and mutation-proved (M4).** Every write to `#srLive` is captured by a
   `MutationObserver`. The weighted strings are compared by exact equality with the pre-change
   strings: "Added New category to WO-3.43 Weighted at 0 percent." and "Weights total 60 percent, not
   100. Grades are provisional." The points versions are also exact. Both removal announcements are
   asserted too.
6. 👤 **Not ticked, and not closable here.** It needs a laptop and an iPad and human eyes. Headless,
   the section does find both essays under *Not in a category* on the assignment list in both modes:
   red (not `.counted`) for weighted, amber `.counted` for points. That is supporting evidence only.

**Ticks.** I wrote `[x]` on five headless lines in the new `TESTING.md` § WO-3.43, following the
WO-3.31 precedent there. When I tried to tick the matching five boxes in
`plans/work-orders/phase-3-gradebook.md` (lines 3367, 3371, 3374, 3376, 3378), the environment's
permission classifier **denied the edit**. I did not retry it any other way. **The work order's
Acceptance boxes are all still `- [ ]`.** Whoever closes this should tick them, or not, and decide
whether the TESTING.md `[x]`s stand.

## Commands run, and what they printed

- `node tools/verify-shell.mjs` (full run, waited for exit) printed `1720 checks · 1720 passed · 0
  failed · 0 skipped`, `54,800 lines · 31.9 lines per check · 738s`, then `EXIT=0`. The two
  re-pointed checks are PASS at log lines 226 and 228. The eleven WO-3.43 checks are PASS at 1131–1141.
- `node tools/wo-sweep.mjs` printed `46 checks · 43 passed · 0 failed · 3 to review` with exit 0. The
  three reviews are the standing ones. The first sweep run, before the README update, failed only on
  the call-site count (1711 vs 1699 recorded), and that is fixed.
- `grep -rn MUTATION src tools index.html` is **not literally empty, and was not empty before this
  work order either.** It prints pre-existing prose: `src/shell.js:975` ("A CLASS MUTATION…"),
  several `tools/README.md` paragraphs, `tools/verify/keys-legend-guards.mjs:204,251`,
  `tools/verify/outreach.mjs:1578`, `tools/verify/score-grid.mjs:1662,2068`,
  `tools/verify/score-search.mjs:652` and `tools/wo-gate.mjs:2562`. `git diff -U0 | grep '^+' | grep
  MUTATION` finds one added line, which is the TESTING.md mutation-round prose. **No live mutation
  marker exists in `src/`.** `grep -n MUTATION src/categories.js` is empty, and the file's SHA-256
  (`3e18891700c16d763ea3a7db0434de58710a5b5c6820db1d477038211b36065b`) matched the pre-mutation copy
  after every restore.

## Mutation round

I used a scratch copy of the entry harness holding only `category-removal.mjs`
(`tools/zz-scratch-wo343.mjs`, **deleted**). It ran 11/11 green on the delivered tree. Each mutation
was marked `// MUTATION Mn` in `src/categories.js`, and the file was restored from a copy after each run.

| Mutation | Result |
|---|---|
| M1: the moved assignments filtered out of `d.assignments` (the cascade back) | **5 red** (`11 · 6 · 5`): both document checks, points grade 80.625 → 90, the no-category row, both assignment-list checks |
| M2: score columns deleted for the moved assignments | **3 red**: both document checks, the no-category row |
| M3: `classId` dropped from `applyRemoval()`'s test | **1 red**: the weighted document check (the plant in the bystander class was re-filed to `''`) |
| M4: `gradedOnPoints()` returns `false` | **2 red**: the points confirm and the points announcements |

Under M1 the two weighted grade checks stayed green, which is correct: deleted work and unweighted
work give the same weighted grade. That is why Acceptance line 1 is held by the document checks and
not by the grade.

## Decisions the work order did not settle

- **The points wording.** Crossing: "The weights now total N percent. {class} is graded on total
  points, so they change no grade." Add: "Added {name} to {class}, which is graded on total points, so
  it needs no weight." In a points class a crossing can only come from a removal, because the fields
  are disabled. I kept the announcement rather than suppressing it, because the Deliverable asks for
  a points version.
- **The facts panel reuses `.mode-change-facts` / `.mode-change-line`** from WO-3.31's confirmation
  rather than adding a new class. It is the same "shape without the red" and was written for exactly
  this. The comment in `src/shell.css` says so.
- **The section label** changed from "What goes with it" to "Where its work goes". It is part of the
  confirm, and the old label claimed something now goes.
- **Comments outside the two files the WO names** (`src/shell.js`, `src/letter-scale.js`, the
  `src/assignments.js` copy-category comment, `src/shell.css`, and the `tools/verify/assignments.mjs`
  comments) were reworded where they stated that a removal destroys work. These are comment-only
  edits that make the claims true. No behaviour changed.
- **A weight-0 category holding work, in weighted mode.** The kept sentence then reads "…totals 100%
  until you set them", which is true but odd. This was already the behaviour before WO-3.43, and I
  left it, because improving it would need an `isBalanced()` question about a hypothetical class.

## What I could not close, and proposed follow-ups

1. **The editor's two removal hints in `index.html` are now false. This is the most important
   follow-up.** The brief told me not to widen into them. They are:
   - ~2683, weighted: "To stop a category counting without losing anything, set its weight to 0 … Removing is the one that takes the work with it, which is why it counts what goes first."
   - ~2692, points: "Removing a category takes the work filed under it with it, which is why it counts what goes first."

   The brief named only the first. The second is the same defect in the points block. Both sit in
   the same editor as a confirm that now says the opposite. A teacher reads them before she taps
   Remove. I recommend booking this before the 👤 reading, or folding it into it.
2. **WO-3.1's third Deliverable in `plans/work-orders/phase-3-gradebook.md` still says the removal
   cascades.** It has no pointer to WO-3.43. A one-line "reversed by WO-3.43" note would stop a cold
   reader from rebuilding it.
3. **The score grid's category filter.** If a teacher has the grid filtered to a category and removes
   it from the editor opened over the grid, the filter names a category that no longer exists. This
   was true before WO-3.43, when the category also vanished, and I did not test it. It is noted only
   because the work now survives the removal and is easier to go looking for.
4. **A count in `tools/README.md` that may be stale.** Its "seventy-nine files under `tools/verify/`"
   sentence may already be out of date. The sweep reports 81 files carrying call sites. I did not
   touch it because no tool checks it and I could not tell from the prose what it counts.
5. **Two announcements in one breath.** A removal that crosses the weights total announces twice
   inside the same tick, and the polite live region may only voice the second. That was true before
   this change too, and only a real screen reader can say.

## CHANGELOG draft (for the teacher to decide)

> **Removing a category keeps its work.** Removing a grading category used to delete every assignment
> filed under it, along with their scores, behind a red warning that pointed at the backup file. Now
> the category goes and the work stays. Its assignments move to *Not in a category* on the
> assignment list, where you can file them under another category. In a class on weighted
> categories, that work stops counting until you file it again, and the dialog says what the
> remaining weights add up to. In a class on total points it keeps counting, and no grade changes.
> The dialog says which, in your class's own terms, and no longer offers advice about weights to a
> class that doesn't use them.

## Amendment — editor hints (owner, 2026-10-04)

**Amending implementer** Claude (Opus), 2026-10-04. Nothing committed. The row still reads `🔍 AWAITING VERDICT — 2026-10-04`. I ran no `--start`, `--release`, `--handoff` or `--tick`, and changed no Acceptance box anywhere.

This resolves follow-up 1 above. The categories editor's two hints in `index.html` said that removing a category takes its work with it, which contradicted the new confirm.

### The new wording, verbatim

Weighted (`data-category-mode-text="weighted"`, the second hint):

> To stop a category counting but keep it, set its weight to 0 — the assignments stay filed under it and the grade stops using them. Removing a category keeps the work filed under it too: the assignments and their scores stay, under no category, and they stop counting toward the grade until you file them under another category.

Points (`data-category-mode-text="points"`, the second hint):

> Removing a category keeps the work filed under it. The assignments and their scores stay, under no category, and they go on counting toward the grade — you can file them under another category whenever you like.

- The phrasing comes from the confirm's lead in `src/categories.js`: *"keeps the work filed under it"*, *"The assignments and their scores stay, under no category"*, *"stop counting toward the grade until you file them under another category"*, *"go on counting toward the grade"* and *"You can file them under another category whenever you like"*.
- *"Without losing anything"* became *"but keep it"*. Weight 0 still differs from removal: the category stays and the work stays filed under it. So the contrast is now about keeping the category, not about losing work.
- The weight-0 advice is unchanged in substance.

### Files touched in this amendment

- `index.html`: the two hint paragraphs, and nothing else.
- `tools/verify/category-removal.mjs`: `readScreen()` gained a `hints` field, which holds the visible `[data-category-mode-text]` paragraphs of the editor, whitespace-collapsed. There is also one new `check()` after the points announcement check.
- `tools/README.md`: the call-site count went from 1711 to 1712. I also added a short paragraph after WO-3.43's with the run figures.
- `TESTING.md` § WO-3.43:
  - one sentence added inside the 👤 item, which is still `- [ ]`, asking the reader to check that the editor hint agrees with the dialog in each mode;
  - M5 and M6 rows in the mutation table;
  - an "Amendment" paragraph with the run figures.
- `sw.js`: not touched. It is already at `planbook-shell-v162`, against v161 at HEAD, and that covers this `index.html` change in the same landing.

### The check added, and the mutation outcome

There is one new check: *"WO-3.43: the categories editor's visible hints agree with the confirm in both modes — neither claims a removal takes, destroys or loses the work; each says removing keeps the work under no category, the weighted one that it stops counting and still offers weight 0, the points one that it goes on counting"*. It reads the hints that are visible while each class's editor is open: the weighted ones from `cfW`, the points ones from `cfP`. It wants:

- neither mode's visible hints to match `/takes? (the )?work|with it,|destroy|delet|losing anything|cannot be undone|backup/i`;
- the weighted hint to say removing keeps the work under no category and that it stops counting, and still to contain *"set its weight to 0"*;
- the points hint to say it keeps the work under no category and that it goes on counting, and **not** to contain *"set its weight to 0"*.

For the mutation round I used a scratch entry harness (`tools/zz-scratch-wo343b.mjs`, a sed copy of `verify-shell.mjs` running only `category-removal.mjs`; **deleted**):

- **Unmutated:** `12 checks · 12 passed · 0 failed · 0 skipped`, EXIT=0.
- **M5:** `<!-- MUTATION M5 --> Removing is the one that takes the work with it.` appended to the weighted hint gave `12 checks · 11 passed · 1 failed`, EXIT=1. The FAIL was the new hints check.
- **M6:** the points hint put back to the old *"Removing a category takes the work filed under it with it, which is why it counts what goes first."*, marked `<!-- MUTATION M6 -->`, gave `12 checks · 11 passed · 1 failed`, EXIT=1. The FAIL was the new hints check.

After each run I restored `index.html` from a copy taken before the mutations. `cmp` confirmed it matched byte for byte, and `grep -c MUTATION index.html` printed 0.

### Results

- `node tools/verify-shell.mjs`, full run, waited for exit: `1721 checks · 1721 passed · 0 failed · 0 skipped`, `54,817 lines · 31.9 lines per check · 739s`, `EXIT=0`.
- `node tools/wo-sweep.mjs`, run after the README figures were written: `46 checks · 43 passed · 0 failed · 3 to review`, `EXIT=0`. The call-site check reads `1712 check() call site(s) across 81 harness file(s), matching tools/README.md:1256`.
- `grep -rn MUTATION src index.html tools/verify/category-removal.mjs` printed one line: `src/shell.js:975:  A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE…`. That is existing prose: `git show HEAD:src/shell.js` contains the same line. **There is no live mutation marker.** `index.html` and `category-removal.mjs` have none.

### Noted, not acted on

- `design/mockups/scores.html` (~594–596, ~625) still holds the old hint and the old destructive confirm text. It is a drawing, not a screen, and it was not in this amendment's scope. If the mockups are meant to track the shipped wording, it needs its own row.
- WO-3.1's third Deliverable still describes the cascade without a pointer to WO-3.43 (follow-up 2 above). That has not changed.
