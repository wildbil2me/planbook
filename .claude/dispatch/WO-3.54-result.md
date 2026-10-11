# WO-3.54 — implementer's result

**Outcome.** Built. Both tools are green on the delivered tree. Seven of the eight Acceptance lines are ticked, each with evidence in `TESTING.md` § WO-3.54. The 👤 line is open: it needs the teaching iPad. Nothing is committed and nothing is staged. I did not run `--tick`.

## The two commands, read from their own output

- `node tools/verify-shell.mjs` on the delivered tree: **`1980 checks · 1980 passed · 0 failed · 0 skipped`**, 63,328 lines, 1019s, `EXIT=0`. This run came after the mutation revert. The run before the mutation round, on the same bytes, read 1980/1980, 1023s, `EXIT=0`. A baseline on the untouched tree, before any edit, read `1966 · 1966 · 0 · 0`, 1023s, `EXIT=0`.
- `node tools/wo-sweep.mjs`: **`50 checks · 46 passed · 0 failed · 4 to review`**, exit 0. Three of the reviews are the usual three. The fourth flags `.assign-actions` and `.assign-group-head` as CSS added with no coarse-block rule. Neither is a touch target: the first is the row that holds + New, a `.class-action-btn` already floored at 44 in `src/shell.css`, and the second is a heading. The review reads the uncommitted diff, so it goes quiet once this is committed.
- `node tools/wo-gate.mjs --audit`: its final PASS line was clean.
- The note says the harness takes about 160s. It now takes about 1020s.

## Acceptance, line by line

1. **[x] Title row ends in ← All classes, and + New is the last control of the body's first row, right-aligned.** `verify/assignment-list-tidy.mjs` checks 1 and 2:
   - The title row's last element is a `data-view-home` button. Its normalised `outerHTML` is identical to the Scores title row's.
   - The title row has no `data-assignment-new`.
   - The body's first row is `assign-actions end`. Its last control is `data-assignment-new`, its computed `justify-content` is `flex-end`, and the button's right edge is 0px from the row's content edge.
2. **[x] No Edit button; tapping a name opens the editor; the name carries `data-assignment-edit`.** Checks 3 and 4:
   - No button reads "Edit" or is labelled "Edit …".
   - Every name is a real `<button>` with its own assignment's hook, and it is the only one in its row.
   - A real mouse press on a name opened `#assignmentModal` on that assignment.
   - `src/shell.js` is untouched: the hook moved, it was not renamed.
3. **[x] Icon Duplicate and Delete with naming `aria-label`s, hooks unchanged, at least 44px square under coarse.** Checks 5 and 6:
   - Each row has an SVG and no text, the labels "Duplicate X into other classes" and "Delete X", a `title`, and the hooks for its own id. Delete is still `.delete`.
   - At 834×1194 with coarse asserted first, every icon measured 44×44 and every name button 44 tall.
4. **[x] Empty category: one `.empty` heading, the note word for word in all three cases, the full sentence hidden, no row after it, no `.assign-group-empty`.** The weighted 20%, 0% and points cases are checked separately. Each note is exact, and the hidden text and `title` are the old bar's sentence. The next row is a heading. No old bar exists, and every tbody row is a heading or an assignment.
5. **[x] "Not in a category": one `.unfiled` heading, `.counted` only in a points class, no notice row, ruling 6's note, no "Edit".** Checked in both modes with exact notes. `points-grade.mjs` (WO-3.36's paint check) and `category-removal.mjs` now read the heading.
6. **[x] The hint carries ruling 7's three sentences.** All three are present in a weighted class. The points-class form is covered under "Decisions" below.
7. **[ ] 👤 iPad reading.** Owed to the owner. Nothing here has seen an iPad.
8. **[x] `CACHE` bumped.** `planbook-shell-v184` → `v185`.

## Phone-width baseline for WO-3.59 (a note in `TESTING.md`, no box)

The page's sideways scroll at 390×844, coarse pointer, headless Edge:

| Fixture | Before (HEAD `84f5656`) | After |
|---|---|---|
| WO-1.77's (one category, one assignment, blank-dated term) | 134px | 134px |
| This WO's harness fixture (weighted, four categories, one unfiled) | 134px | 135px |
| Real-shaped (four categories with dates, one unfiled) | 149px | 151px |

- **Where the numbers came from.** Row 1 is `dialog-kinds.mjs`'s own `MEASURE` line, which read 134 on both runs. Row 2 "after" is this WO's new `MEASURE` line. The other figures come from a scratch probe; for the "before" figures it served a `git archive` of HEAD.
- **This WO caused no new overflow.** The table itself got narrower: on the first fixture its own sideways scroll fell from 254 to 214px.
- **What overflows the page is not the table.** On every fixture, before and after, the element at the document's `scrollWidth` is the Actions `<th>`'s `<span class="sr-only">Actions</span>`. It is absolutely positioned with no positioned ancestor, so `.assign-table-wrap`'s `overflow-x: auto` does not clip it.
- That is WO-3.59's finding to confirm and fix. I did not touch it. The `.sr-only` spans this WO adds sit inside the viewport.

## Mutation round

I staged the work first, planted five faults marked `MUTATION`, ran the harness once, then reverted with `git checkout -- src/assignments.js src/assignments.css`. `grep -rn MUTATION src/` afterwards showed only an unrelated comment in `src/shell.js`. The run read `1980 · 1972 · 8 failed`, exit 1:

| Fault | Checks that went red |
|---|---|
| M1: points hint uses the weighted words | 2: this WO's points-hint check and WO-3.34's |
| M2: unfiled is never `.counted` | 3: this WO's, WO-3.36's and WO-3.43's |
| M3: the 0% note falls to the weighted words | 1 |
| M4: `.assign-actions.end` deleted | 1 |
| M5: `.assign-name-btn:focus { outline: none }` (the Traps temptation) | 1: `focus-ring.mjs` |

I did not mutate the icons' own coarse floor. Deleting it would not go red, because the icons also wear `.assign-row-btn` and `.class-action-btn`, which are both floored at 44. That is defence in depth, and the reason is recorded in `TESTING.md`. The staging has since been released.

## Decisions the work order did not settle

1. **The points-class hint.** Ruling 7's third sentence says "its weight is shared across the others". WO-3.34 ruled that a points class's assignments screen names no weight, and `points-grade.mjs` asserts that. So the sentence's second half is `<span id="assignmentsHintEmpty">`, filled by `paintHintEmpty()`:
   - In a weighted class it carries the owner's words. `index.html` also carries those words, so the file reads as ruled.
   - In a points class it carries ruling 5's points clause: "— it adds nothing until something is in it."
   - The first half, "A category with nothing in it yet does not count as a zero", is the same in both.
2. **Ruling 6's trailing full stop.** The work order's italics include a full stop; the owner-approved drawing has none. I followed the drawing, which is how ruling 5's notes are written.
3. **The hidden unfiled sentence.** It says "Tap its name" for one assignment and "Tap each one's name" for more. The visible note is ruling 6's verbatim either way.
4. **Removing `.assign-group-empty` and `.assign-group-orphan`.** Nothing in `src/` wears them now, so they went. Three comments that borrowed their amber now name `.assign-group-head.empty`; the fourth was on the deleted `.orphan.counted` rule. Two drawings still wear the old classes: frame A of `assignments-tidy.html` and the older `design/mockups/assignments.html`. Their bars now draw unstyled, and the banner and README amendments say so.

**Conventions I set.** `iconButton()` and `COPY_ICON`/`BIN_ICON` in `src/assignments.js` are the first SVG built by any `src/` module. It uses `createElementNS` with the shapes held as data, and the comment there says so. I also added a new harness section file, `tools/verify/assignment-list-tidy.mjs`, registered after `dialog-kinds.mjs`. It plants its own fixture and removes it, the same pattern as `dialog-kinds.mjs`.

## Out-of-scope temptations I declined

- **Fixing the 390px overflow.** It looks like a one-line fix on the wrap or the Actions `<th>`, but it is WO-3.59's.
- **The roster's "✎ · Edit · Remove".** Untouched, per ruling 8.
- **A stale count in `tools/README.md`.** About line 1370 says "the ninety-one files under `tools/verify/` that it names". By the `{ file: 'verify/…' }` rows in `tools/verify-shell.mjs` that was already wrong at HEAD (89 named), and it is 90 now. I left it alone and flag it here.

## Files changed

- `index.html`
- `src/assignments.js`
- `src/assignments.css`
- `sw.js`
- `tools/verify/assignment-list-tidy.mjs` (new)
- `tools/verify-shell.mjs`
- `tools/verify/assignments.mjs`
- `tools/verify/points-grade.mjs`
- `tools/verify/category-removal.mjs`
- `tools/README.md` (call sites 1962 → 1976, plus a WO-3.54 paragraph)
- `design/mockups/proposed-assign-tidy.css` (banner: lifted 2026-10-11)
- `design/mockups/README.md`
- `design/mockups/index.html`
- `TESTING.md` (§ WO-3.54)
- `plans/work-orders/phase-3-gradebook.md` (seven boxes ticked)
- `CHANGELOG.md` (entry written, as the brief directs)
- `.claude/dispatch/WO-3.54-status.md` (appended)
