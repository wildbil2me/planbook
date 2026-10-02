# WO-3.29: the score grid narrows by student. Implementer's result

**Status of the tree:** built. `node tools/verify-shell.mjs` ran to completion: `1624 checks · 1624 passed · 0 failed · 0 skipped`, 668s, exit 0, real clock, 2026-10-02. `node tools/wo-sweep.mjs` gave `45 checks · 42 passed · 0 failed · 3 to review`, the same three reviews as before this work order. `node tools/wo-gate.mjs --audit` PASS. Nothing committed, and no CHANGELOG entry written. I ticked seven boxes in the phase file, each against a check named below. The 👤 box is still open. I left the status line at `🤖 CLAIMED` for the orchestrator.

## Against the Acceptance list

1. **[x] ma / bell, m / nickname / count / empty line / Escape.** Checked by `tools/verify/score-search.mjs`. The fixture has Amari Johnson, Ben Castillo, Marcus Bell, Thomas Reed, Robert Quinn (nickname `Zeke`) and Priya Shah.
   - *ma* shows Bell, Johnson and Reed, in that order, and the count reads `3 of 6 students`.
   - *bell, m* shows Marcus.
   - *zeke* shows no one (`0 of 6 students`).
   - *zz* hides `#scoresGridWrap`, leaves `#scoresHead` empty and shows `.scores-empty` reading "No student in … matches that. Clear the search box, or press Escape in it, to see the whole class again." The box stays on screen holding *zz*.
   - A real Escape keystroke empties the box and brings back all 6 rows, and the caret stays in the box.
2. **[x] Attendance answers identically, one matcher.**
   - **The move:** `searchNeedle()` and `nameMatches()` are now in `src/roster.js` beside `fullName()`. `setSearch()` and `visibleStudents()` in `src/attendance.js` call them, and so does `src/scores.js`. The normalisation moved with the test: trimmed and lower-cased once when the box changes, exactly as `setSearch()` did. So whitespace queries answer as before.
   - **Same answers:** a harness check reads the registry's own rows through its own box for eight queries (`ma`, `bell, m`, `zeke`, `  MA `, `zz`, `REED`, `son, a`, empty). It compares them set for set with the grid's rows. All match.
   - **One matcher:** a second check reads the three source files off disk with comments stripped. It confirms there is exactly one exported matcher, that both screens import and call it, and that neither file has its own lower-cased name test or `trim().toLowerCase()` normalisation.
   - **No answer changed:** the existing attendance check "search narrows the rows, a pill shows only that mark, and First/Last reorders the whole class" passes, and I did not edit it.
3. **[x] Edges on narrowed rows.** Real keys sent to the page over CDP, with the rows narrowed to *ma*:
   - ArrowUp on Bell stays put and announces "Essay: that is the first student. 2 of 3 entered."
   - Enter moves Bell → Johnson → Reed and never lands on Castillo.
   - Enter and ArrowDown on Reed stay put and announce "… that is the last student …".
4. **[x] Caret stays in the box.** I typed *bell, m* one keystroke at a time. After each of the 7 keystrokes `document.activeElement.id === 'scoresSearch'` and the value was one character longer.
5. **[x] Figures byte-identical.** Under every query, including the empty ones, the summary line and the headline read exactly the same as with the box empty. Each shown row's grade cell also matches its unsearched value. `paintGrades()` is always handed the whole class. Only the row loop uses the narrowed list.
6. **[x] Arrival is empty, no `planbook_` write.** With *ma* typed I went to Attendance through the switcher and came back: the box was empty and all 6 rows were drawn. The `planbook_` keys and their values were identical before and after all the typing. The reset is `scores.resetScoreSearch()` in `showClassScreen()`, before the view swap, the same place the calendar and signals resets sit.
7. **[x] 44px coarse.** Under the emulated coarse pointer, on the open grid, `#scoresSearch` measures 44 × 893.77. The floor comes from `src/shell.css`'s `.search-box input { min-height: 44px }` in its coarse block, and this check measures it. The WO-3.5 coarse sweep in `verify/score-grid.mjs` also measures every visible control on the grid, and it stayed green with the box present.
8. **[ ] 👤 iPad keyboard.** Not checked; this needs the real iPad with the on-screen keyboard up. The shell cache is now `planbook-shell-v149`, so force-quit before reading.

## Mutation round

All seven mutations bit. Each was marked `MUTATION`, applied to a copied original, and run against a scratch harness holding only `localstorage-prefs` and `score-search`, which gave 46 checks, all green on the clean tree. After each one the file was restored from the copy and `cmp`-checked.

The scratch file `tools/zz-wo329-scratch.mjs` has been deleted. `grep -rn MUTATION` over `src tools index.html sw.js design` finds only the existing prose mentions; none are mine.

| Mutation | Checks that went red |
|---|---|
| M1: nickname in the shared matcher | 2 |
| M2: attendance's own test back | 2, including the one-matcher read |
| M3: rows hidden with CSS | 5 |
| M4: `paintGrades(shown)` | 1 |
| M5: box rebuilt per keystroke | 3 |
| M6: no arrival reset | 1 |
| M7: Escape unbound | 1, and the section stopped because a throw was contained |

The full table is in `TESTING.md` § WO-3.29.

## Decisions the work order didn't settle

- **The banner token came off § SCORE TOOLBAR.** § SCORE SCROLL BOX kept its `not yet lifted` token while half-lifted, but that only worked because its lifted half was a compound (`.boxed`) that § 19 never reads as declared. This section's lifted half is two plain classes now in `src/scores.css`, so keeping the token would turn the collision check red on names that correctly live in both places.
  - **Cost:** `.scores-filter-pills` (WO-3.28's) is no longer collision-checked until WO-3.28 lifts it. No `src/` sheet styles it today.
  - **Alternative:** split the pills into their own `§` section. I declined because WO-3.28's own text points at "the `.scores-filter-pills` rule from § SCORE TOOLBAR".
  - Both points are argued in the banner body itself.
- **Where the box sits and what goes with it:**
  - It sits directly above `#scoresGridWrap`, after the flag bar and keys panel, matching the drawing.
  - The count goes straight after the box, so WO-3.28's pills come after the count, as its own text says. That contradicts a 768px caption in `score-tools.html`, which says the count is placed between the box and the pills.
  - The toolbar hides together with the grid in the structural empty states (no students or no work).
  - When a query matches no one, the flag bar hides along with the grid, because with no cell to act on it is a dead control.
- **Count wording:** `<b>3</b> of 6 students`. It shows only while the box holds text, as in the drawing's unsearched frame.
- **Edge sentence on narrowed rows:** "N of M entered" now counts the shown rows ("2 of 3 entered"). That is the existing sentence over the drawn column, unchanged, so the work order's "the edge sentence the grid already speaks" holds. A teacher may read it as being about the whole column, though, so it may be worth a look.
- **No live announcement while typing.** The registry's search announces nothing either. The visible count is the feedback.
- **Proof of "one matcher" is a harness check, not a sweep check.** It reads the files from disk inside `verify/score-search.mjs`, following the precedent in `verify/glance-quiet.mjs`. That avoided a 46th sweep check and the count edits that would come with it.

## Bookkeeping

- `tools/README.md`: the call-site count changed 1598 → 1612, and "seventy-six files" became "seventy-seven files". I added a WO-3.29 paragraph: 14 sites (12 executed checks plus 2 failure arms), and the gap between sites and results went from −14 to −12.
- `src/shell.js` gained a `data-scores-search` row in the delegated-hook inventory. This was needed: the sweep went red without it.

## Files changed

- `src/roster.js`: `searchNeedle()` and `nameMatches()`.
- `src/attendance.js`: import updated, `setSearch()` and `visibleStudents()` now call the shared pair.
- `src/scores.js`: search state, `paintFound`, `setScoreSearch`, `clearScoreSearch`, `resetScoreSearch`; rows narrowed in `renderScores()`.
- `src/scores.css`: `.scores-toolbar`, `.scores-found`, plus coarse lines.
- `src/shell.js`: inventory row, `input` route, Escape branch, arrival reset.
- `index.html`: toolbar markup.
- `sw.js`: v148 → v149.
- `design/mockups/proposed-scores.css`: banner and index amended.
- `design/mockups/score-tools.html`: a "Built" caption.
- `tools/verify/score-search.mjs`: new.
- `tools/verify-shell.mjs`: import and section row.
- `tools/README.md`
- `TESTING.md`: § WO-3.29.
- `plans/work-orders/phase-3-gradebook.md`: seven ticks.

## Changes I declined

- I did not add `autocomplete`/`spellcheck` attributes to the box: the registry's box has neither, and the toolbar is meant to match it value for value.
- I did not touch the printed grade sheet. It already reads `gridOrder()` directly, so it ignores the search.

## Draft CHANGELOG entry (the teacher decides)

> The score grid has a search box. Type part of a name and the grid shows only those students, with "3 of 14 students" beside the box; Escape empties it. It finds names exactly the way the attendance search always has — the two boxes now share one rule — and it changes no number: the class average, the blanks and every grade are the whole class's. It starts empty every time you open the grid.
