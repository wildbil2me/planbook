# WO-3.44 — result

**Implementer** Claude Opus · 2026-10-04 · not committed · no mutation made (none warranted for a comment, per brief)

## What changed

One comment block in `src/shell.js` (the `assignments, screenNav` entry in the `window.planbook`
seam, now lines 4594–4607). The false clause, *"it is invisible on screen because both look
identical on the list"*, is gone. In its place, checked against the code:

- **The ids and the missing `scores` column are still the thing no click shows.** That half is kept.
- **Target has a category of the same name.** `proposeCopyInto()` → `matchCategory()`
  (`src/assignments.js` ~1236–1264) matches by trimmed, lower-cased name and files the copy under the
  target's own category. A naive copy keeps the source's `categoryId`, which the target lacks.
  `renderAssignments()` (~646–660) gathers every assignment whose `categoryId` is not among the
  class's category ids under "Not in a category". So the two builds put the copy in different groups.
- **Target has no such category.** `matchCategory()` returns `''`. That id is also missing from
  `filed`, so this build's copy lands under "Not in a category" too. The two look identical there,
  and the comment now says so.
- The breadcrumb half and the closing sentence are unchanged in wording. Their lines were re-wrapped
  to keep the block within its width.

The group name, "Not in a category", is quoted the same way WO-3.40's two corrected comments in
`src/assignments.js` quote it.

## Acceptance

1. **[x] The comment no longer says the two duplicates always look identical on the list.** Checked
   with `git diff src/shell.js`. The removed lines hold the "invisible… both look identical" clause.
   The added lines name the two cases, and only the no-match case says "look identical".
2. **[x] No line outside a comment moves.** `git diff --stat`: `src/shell.js | 17 ++++++++++-------`.
   All 10 removed and 13 added lines sit between the block's `/*` (line 4594, unchanged) and its
   `*/` (the last added line). `assignments, screenNav,` is unchanged and shows only as diff context.
   No `\r` appears in the diff (`grep -c $'\r'` → 0), so line endings are untouched. `sw.js` is not
   touched.

I ticked both boxes in `plans/work-orders/phase-3-gradebook.md`. Neither line carries 👤 or 📆.

## Tools

- **`node tools/wo-sweep.mjs`**
  - Before the edit, on a tree differing from `de61b73` only by the claim line: `47 checks · 43 passed · 1 failed · 3 to review`.
  - After the edit: the same counts.
  - **§ 9 was already red on clean main.** Its message before the edit: *"src/assignments.js, src/detail.js changed since planbook-shell-v164 was set at 061c53b"*. After the edit the same failure adds `src/shell.js` to that list. That is expected: a comment-only shell change with no `CACHE` bump, the question WO-1.60 owns. I did not bump `CACHE`.
  - The 3 REVIEW items (sensitive field names, due-date with late/missing, mockup banner) are the same three before and after. They are standing items, not caused by this change.
  - Every other check passed.
- **`node tools/verify-shell.mjs`**: ran to completion and I read the exit. `1760 checks · 1760 passed · 0 failed · 0 skipped`, 782s, `EXIT=0`.

## Not verifiable here

Nothing. The work order has no 👤 line, and a comment has no runtime effect.

## Files changed

- `src/shell.js`: the comment block only.
- `plans/work-orders/phase-3-gradebook.md`: both Acceptance boxes ticked. The status line was already changed by the orchestrator's `--start`.

## Decisions and notes

- I did not add a sentence saying the harness reads the ids off the document. The old comment did not claim that, and adding a claim about `tools/verify/assignments.mjs` was out of scope.
- No `CHANGELOG.md` entry, per instructions. A draft, if wanted: *"A comment in `src/shell.js` no
  longer says a copy duplicated into another class looks the same on the list as a naive copy would.
  It does only when the target class has no category of the same name. Comment only; no behaviour
  changes."*
