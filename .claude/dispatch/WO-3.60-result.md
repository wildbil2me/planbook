# WO-3.60 — the Scores screen's top matches the other class screens · result

**Implementer:** Claude (work-order-implementer), 2026-10-11. Not committed. No `--start`/`--release`/`--tick` run.

## What landed

- `index.html` — `#scoresActions` removed. New `#scoresTop` (`.scores-top`) holds `#scoresSummary` and the `data-assignment-new` button. `#scoresToolbar` holds the box (`.search-box scores-find`, placeholder *Search students…*), the pills host (`.scores-filter-pills scores-pills-flow`), `#scoresFound`, and then `.scores-tools` with `#scoresSort` (`data-scores-sort="first"`, *Sort: **Last***), ⌨ (`data-scores-keys`, `aria-label="Keys"`, glyph only, title *Keys — …*) and 🖨 (`data-grades-record`, same `aria-label` as before, glyph only, title *Grade sheet — …*). `#scoresFlags` now comes after the toolbar and is labelled *The cell you are in*. The note panel and key strip are still directly under it. I rewrote the comments that described the old order, including the one about where the pills sit relative to the count. I also corrected the Attendance toolbar comment that said "The Scores box keeps its 360."
- `src/scores.js`:
  - `sortBy` is a module variable. `screenOrder()` sorts a **copy** of `gridOrder()`'s list by first name then surname, using `markingOrder()`'s comparator.
  - `paintSort()`, `setScoreSort()` and `resetScoreSort()` drive the toggle.
  - `renderScores()` builds the rows from `screenOrder(students)`, so ↵/↓ walk the order on screen.
  - The empty state hides `#scoresTop` where it used to hide `#scoresActions`.
  - `gridOrder()`'s code is unchanged; I corrected its comment ("THERE IS NO SORT CONTROL").
- `src/shell.js` — the `data-scores-sort` click route, the hook added to the hook list, and `scores.resetScoreSort()` in `showClassScreen()` next to the search and category resets. A class tab tapped on Scores comes through there (WO-3.45).
- `src/scores.css`:
  - § SCORES TIDY's top half is lifted: `.scores-top` (with its `> .scores-summary` rule), `.scores-tools`, `.scores-find`, `.scores-pills-flow`. `.scores-sort-toggle b` uses Attendance's indigo.
  - New rule `.scores-found:not(.hidden) + .scores-tools { margin-left: 0 }` (see decision 2).
  - Coarse block: `.scores-top`/`.scores-tools` gap 10, `.scores-sort-toggle` 44×44 with `flex-shrink: 0`, `.scores-keys-btn` min-width 44 with `flex-shrink: 0`, `.scores-find` min-width 200. `.scores-sort-toggle` is added to the grouped `touch-action` selector.
  - `.scores-actions` removed.
- `src/grades-report.js`, `src/attendance.css` — comment-only fixes to sentences this change made false.
- `sw.js` — `CACHE` `planbook-shell-v188` → `planbook-shell-v189`.
- `tools/verify/score-sort.mjs` (**new**) — 12 `check()` sites, 11 results on a green run. Registered in `tools/verify-shell.mjs` after `class-tab-keeps-screen.mjs`.
- `tools/verify/score-grid.mjs` — six selectors changed from `#scoresActions` to `#scoresTop`, and its comment updated.
- `tools/README.md` — call-site count 2000 → 2012, plus an entry with the run's figures.
- `design/mockups/proposed-scores-tidy.css` (header and banner), `design/mockups/README.md` (heading and a landed paragraph), `design/mockups/index.html` (entry): these now say frame A's half landed, and the README and banner also record the departure in decision 1. The § SCORES TIDY banner no longer carries `not yet lifted`. I left `.scores-col-meta`, `.scores-col-name.wraps`, `.scores-col-edit` (WO-3.62) and `.scores-headline-figs` (frame B) in the drawing, and the banner says so.
- `TESTING.md` — § WO-3.60 under Phase 3, with the Acceptance lines copied verbatim and the evidence for each.
- `plans/work-orders/phase-3-gradebook.md` — Acceptance boxes 1–6 ticked; 👤 left open. Status not touched.

## Acceptance, line by line

1. **[x] Summary row with + New assignment last, right-aligned; no `#scoresActions`.** The first drawn child of `.scores-body` is `scoresTop`. Its last child is the `data-assignment-new` button, with `rightGap` 0 and on the summary's line. `#scoresActions` is absent. `score-grid.mjs`'s create-door, focus-return and 44px checks pass against `#scoresTop`.
2. **[x] The group of Sort, ⌨, 🖨; no visible words; names and hooks unchanged.** The hook order reads `data-scores-sort`, `data-scores-keys`, `data-grades-record`. Each door's text with the `aria-hidden` glyph removed is `""`. The names are `Keys` and *Print or export this class’s grade sheet for this term*. Judgement call: the old ⌨ had no `aria-label`, so its accessible name was its visible word "Keys". `aria-label="Keys"` keeps that name exactly, which is why I did not use the drawing's longer label.
3. **[x] Toggle behaviour, ↵/↓ walk, grade sheet, the planted fault.**
   - Fixture: five students whose first-name and surname orders differ, and a roster in neither order.
   - Rows read `s1…s5` under Last and `s2,s4,s5,s3,s1` under First. Labels and hooks flip correctly.
   - ↵ then ↓ walk `s1→s2→s3` under Last and `s2→s4→s5` under First.
   - The sheet reads *Adams, Brooks, Carter, Dalton, Ellis* under both sorts.
   - A class-tab switch and the switch back both read *Sort: Last*, and no `planbook_` key changed.
   - **Planted fault:** I made `gridOrder()` sort by first name while `sortBy === 'first'` (marked `MUTATION WO-3.60`, with the file copied aside first). Only the sheet check failed: `"sheetFirst":["Brooks, Ada","Dalton, Ben","Ellis, Lee","Carter, Mia","Adams, Zoe"]`, `11 checks · 10 passed · 1 failed`. That came from a section-only copy of the entry file, `tools/_wo360-only.mjs`, which is now deleted. The file was copied back, `cmp` found it identical, and `grep -n MUTATION` over every file I touched finds only older prose (`src/shell.js:1068`, `score-grid.mjs:1668/2099`), none of it in my diff.
4. **[x] 1180 one line; 820 box < 360 with a pill on its line.** Measured under touch emulation with five categories (six pills). At 1180: `"oneLine":true`, box 360. At 820: `"boxW":281.81`, `"pillsOnBoxLine":6`, with the tools on the second line. Sort measured 84×44 and ⌨ and 🖨 44×44 at both widths.
5. **[x] Flag bar last above the grid; label; placeholder.** The nearest drawn element above the grid is `scoresFlags`. It is `scoresKeys` with the keys strip open, `scoresNote` with the note open, and `scoresFlags` again after Done. The label reads *The cell you are in* and the placeholder *Search students…*.
6. **[x] Harness, sweep, CACHE.**
   - `node tools/verify-shell.mjs` (final tree): `2023 checks · 2023 passed · 0 failed · 0 skipped`, 64,621 lines, 1078s, `EXIT=0`. It includes all 11 WO-3.60 results.
   - An earlier full run, with the new markup and source but before score-sort.mjs existed: `2012 · 2012 passed`, `EXIT=0`.
   - `node tools/wo-sweep.mjs`: `50 checks · 46 passed · 0 failed · 4 to review`. The one new review is `.scores-pills-flow`, which has no coarse rule. It is the pills' container, not a touch target; each `.pill` takes its 44px from src/shell.css, measured by score-search.mjs. The other three reviews were already there.
   - CACHE v188 → v189.
7. **[ ] 👤 iPad, force-quit, upright and lying down.** Not taken: it needs the iPad. The 820 and 1180 readings above are emulation and do not close this line.

## Decisions the work order did not settle

1. **Ruling 4's values measured wrong, so the build departs from them.** I lifted the drawn `.scores-find { flex: 0 1000 360px }` and `.scores-pills-flow { flex: 1 1 auto }` first. At 820 under touch they measured `"boxW":360,"pillsOnBoxLine":0`, which fails Acceptance 4. The cause: a wrapping flex row breaks into lines by flex basis before anything shrinks, so the box never gave up any width.
   - The build uses `.scores-find { flex: 1 1 200px; min-width: 200px; max-width: 360px }` and `.scores-pills-flow { flex: 0 1 auto; min-width: 0 }`. The pills claim the line at full width, and the box grows from 200 into whatever is left.
   - These are numerically the same as `.attendance-find`'s values, which ruling 4 said not to use. Its stated reason — "here the pills want the room" — is still met, because the pills' basis is placed first.
   - Limit: with more pills than fit beside a 200px box, the whole pill group goes to a line of its own and wraps inside it. It does not split across the box's line.
   - The argument is written in `src/scores.css`, `index.html`, the drawing's banner and the README. **The owner should see this, because it overrides ruling 4's wording.**
2. **The search count and the tools' auto margin.** Frame A draws no count. Two auto margins on one line split the free space, which would leave the count floating half-way along. While the count is drawn, it takes the margin (`.scores-found:not(.hidden) + .scores-tools { margin-left: 0 }`), so it sits against Sort and the pills never move.
3. **The empty state.** I gave `.scores-top` an id and the empty state hides that whole row, as it hid the actions row before. The summary is emptied in those states anyway.
4. **The flag bar's `aria-label`** stays *Mark the score cell you are in*. Only the visible label changed.

## Not done, and declined

- No `CHANGELOG.md` entry; draft below.
- I did not touch Calendar or Signals, the column head (WO-3.62), the keys dialog, or `?`/C/N (WO-3.61). The ⌨ button still opens the strip.
- I left the old drawings (`design/mockups/scores.html`, `proposed.css`'s `.scores-actions`) alone; they are historical frames.

## Draft CHANGELOG entry

Scores' top now matches Attendance and Assignments. The summary shares its row with + New assignment at the right. The search row ends in Sort, ⌨ and 🖨, and the two doors are now icons. The box shrinks so the category pills start beside it. The flag bar — now headed *The cell you are in* — sits directly over the grid. *Sort: Last/First* re-orders the grid only: the printed grade sheet keeps the SIS's surname order, and the sort goes back to Last on every visit. WO-3.60, owner-directed. Shell cache v188 → v189.
