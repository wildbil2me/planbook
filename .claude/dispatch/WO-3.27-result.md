# WO-3.27 — result (implementer, 2026-10-01)

No live mutation in the tree. Every mutation was applied to a copy of `src/scores.css`, marked
`MUTATION:`, and restored from that copy (checked byte-for-byte with `cmp`) before anything else was
written. `grep -rn "MUTATION:" src/ tools/` finds nothing (exit 1). A plain `grep -rn MUTATION src/ tools/`
finds only prose that was there before this work: `src/shell.js:956` ("A CLASS MUTATION"),
`tools/README.md`, `tools/verify/keys-legend-guards.mjs`, `tools/verify/outreach.mjs`,
`tools/wo-gate.mjs`, and one comment I wrote in `tools/verify/score-grid.mjs` ("MUTATION-PROVED
(TESTING.md § WO-3.27)"). None of them is a marker.

## Final runs, after the last edit
- `node tools/verify-shell.mjs` printed **`1612 checks · 1612 passed · 0 failed · 0 skipped`**, 51,411 lines, 648s, exit 0. That is 1600 before this work plus 12 new checks. An earlier full run, before the doc edits, also printed 1612/1612 (661s).
- `node tools/wo-sweep.mjs` printed **`45 checks · 42 passed · 0 failed · 3 to review`**, exit 0. The three reviews are the same three that were there before I started: sensitive field names, due-date with late/missing, and the § CALENDAR / § SHARED banner review. The call-site check reads 1598, matching `tools/README.md:1256`.
- `node tools/wo-gate.mjs --audit` ends in PASS.

## Two departures from the Deliverables. Read these first.
1. **`src/scores.js` changed, by one line, although the Deliverables say "Nothing in `src/scores.js` changes."** `revealScoreColumn()` now sets `wrap.scrollTop = 0` before `head.scrollIntoView(...)`. The Deliverables said to check that this function still works inside the box rather than assume it, so I checked, and it did not. Two facts cause it. The box keeps its scroll offset while `#scoresView` is hidden: I parked it at (138, 400), went to Assignments and back through the real strips, and it read (138, 400). And the head is now sticky inside the box, so scrolling the head into view no longer brings the rows with it. Without the line, the caret landed in a first cell scrolled away above the stuck head: cell top 346.75, head bottom 641.75. The new check is in `tools/verify/score-grid.mjs`, and it went red before the fix and green after.
   - This is not the focus defect, and the Trap's "no JS first" was about that defect. The focus defect is fixed purely in CSS.
   - If the owner would rather keep `src/scores.js` untouched, the alternative is to accept that arrivals can land with the caret hidden.
2. **`.scores-input` gained `scroll-margin-left: 20px`, which the drawing does not have.** With the drawing's declarations alone, Shift+Tab and `←` at full right scroll failed on both pointers:
   - The browser scrolls the *field* to the padding edge, so the column edge ends up about 20px under the pair.
   - The `x proximity` snap then snapped back to the scroll position the grid was already in (scrollLeft stayed 138, field at 293.92 against a frozen edge of 314).
   - One diagnostic run with `scroll-snap-type` removed was green, which shows the snap was the cause. That edit was marked `MUTATION:` and restored the same way as the rest.
   - The margin points the focus scroll at the column's own edge, which is a snap position, so the snap leaves it alone.

Smaller changes, each explained in a comment next to the declaration:
- The drawing's 1px `border` is now a 1px spread `box-shadow`. A real border moved the scrollport in by 1px and turned an existing WO-3.5 check red (`nameOff: 1`). That check is unchanged.
- `scroll-padding-top` is 96px fine / 104px coarse, against a measured head height of 91 / 98 in headless Edge, to leave some slack.
- The head rule is `.scores-grid-wrap :where(thead th)`, specificity (0,1,0), so the corner rule (0,2,2) still wins.

## Acceptance, line by line
1. **[x] Head sticks and the corner holds.** Two checks in `verify/score-grid.mjs`, one per pointer, with the box scrolled 300px down and sideways at once. All 12 head tops equal the box's top: 31.75 on fine, 652.22 on coarse. The name head is on the box's left edge, and the grade head starts where the name head ends (230/230 fine, 208/208 coarse).
2. **[x] Focus defect, driven with real keys.** Six checks: Shift+Tab, `←` and Enter on each pointer. Keys go in through `Input.dispatchKeyEvent` at the page. The starting state is set by script and read back before the key is sent.
   - Shift+Tab and `←` at full right scroll: the field lands at 335.92 against a frozen edge of 314 (fine), and 312.73 against 292 (coarse).
   - Enter into a row whose top sat halfway under the stuck head: the cell top lands at 433.75 against a head bottom of 122.75 (fine), and 355.22 against 119.22 (coarse).
   - **Mutation-proved:** deleting `scroll-padding` from both blocks turned **8 checks red**, the six key checks among them. The full table is in `TESTING.md` § WO-3.27. Reverted before anything else was written.
   - One limit: the check measures the input's left edge as "the cell's left edge". On coarse, the `<td>` boundary sits 0.27px under the frozen edge.
3. **[x] The frozen-pair declaration check covers the padding.** It is a new check beside the WO-3.5 check and reads from the same pass. It asserts `scroll-padding-left` = name width + grade width, base against base (274 = 190 + 84) and coarse against coarse (252 = 168 + 84), and that the two blocks differ. Each of the four numbers was drifted one at a time, and each went red:

   | Number drifted | Checks red |
   |---|---|
   | Name width, 190 → 200 | 4 |
   | Grade width, 84 → 90 | 1 |
   | Grade offset, 190 → 200 | 3 |
   | Padding, 274 → 280 | 1 |

   Removing the `scroll-margin-left` turned 4 red, which shows it is needed.
4. **[x] 1280×800 fit.** With the page scrolled to the grid, the box runs from 0.38 to 640.38 inside the 800px viewport, with rows still left to scroll inside it.
   - Known cost: with the page scrolled to its very end, the box's top sits 113.62px above the viewport. The hint paragraph below the grid is taller than the 160px the box leaves free.
   - The harness reports this number but does not fail on it. `src/scores.css` and `TESTING.md` say so in words.
5. **[x] The glance arrival.**
   - `verify/glance-quiet.mjs` has a new check right after WO-6.8's queue-row tap: column at 314 against a frozen edge of 314, caret in the first cell (`firstRow: true`), cell top 283.88 against a head bottom of 274.88. That fixture's grid barely scrolls.
   - The harder case is in `verify/score-grid.mjs`: `revealScoreColumn()` called with the box left far right and 400px down, and the screen left and re-entered first. It needed the one-line fix in departure 1.
6. **[x] Existing checks green and unchanged; printed sheet unchanged.** The full run is 1612/1612, and no existing check's assertion was edited. The WO-3.5 frozen-pair check is untouched; its evalJs reads two more fields for the new check. The `@media print` block was not touched. The grade sheet is printed from `#gradesRecordModal` and its own tables, and print hides everything else on `<body>`, so the box never reaches paper. `verify/grade-sheet.mjs` and `verify/print-sheets.mjs` are green.
7. **[ ] 👤 iPad.** Not ticked: it needs a real device. Force-quit from the app switcher first (v148). If tapping or the keyboard leaves a cell under the frozen pair, Safari is ignoring `scroll-padding` for focus. That is the one case where the work order allows a script fallback, and none has been added.
8. **[ ] 👤 Laptop.** Not ticked. Check `location.origin` first. This one needs a real trackpad and human eyes.

## Files changed
- `src/scores.css`: the box, the stuck head, scroll padding in both blocks, `scroll-margin-left` on `.scores-input`, and the THE TWO FROZEN COLUMNS comment rewritten to say four numbers, asserted in `tools/verify/score-grid.mjs`.
- `src/scores.js`: one line plus a comment in `revealScoreColumn()`.
- `sw.js`: `CACHE` v147 → v148.
- `tools/verify/score-grid.mjs`: 11 checks.
- `tools/verify/glance-quiet.mjs`: 1 check.
- `tools/README.md`: call-site count 1586 → 1598, plus a ledger entry.
- `TESTING.md`: new § WO-3.27, with the desk lines, the two 👤 lines left open, and the mutation table.
- `plans/work-orders/phase-3-gradebook.md`: Acceptance 1–6 ticked; 👤 lines left open; an italic note under Traps naming the two departures. Status left at 🤖 CLAIMED for the orchestrator.
- `design/mockups/proposed-scores.css`: both banners amended to "WO-3.27 lifted 2026-10-01 · the category average, WO-3.28 — not yet lifted", with a paragraph saying what the build changed.
- `design/mockups/score-tools.html`: a caption saying the first frame now wears the shipped box and no longer shows the bug.

## Decisions the work order didn't settle
- **Banner wording.** § SCORE SCROLL BOX also holds WO-3.28's category-average rules (`.scores-cat-avg*`, `.filtered`). I kept the `not yet lifted` token, following § SIGNALS's precedent, so § 19 still checks those names against src for collisions until WO-3.28 lifts them. I did not lift `.filtered`.
- **`max-height`.** I kept the drawing's `calc(100dvh - 160px)`. The 160px also leaves a strip outside the box where a wheel or swipe scrolls the page, which `overscroll-behavior: contain` would otherwise trap.
- **Ctrl+P on the scores screen.** An ungated Ctrl+P there (not a print surface) would now clip the grid to one box height. Before this it clipped sideways. I left this alone rather than add an ungated rule to a print block whose header says every rule is gated.

## Out of scope, declined
- Nothing from WO-3.28: no toolbar, search, pills or third column.
- No fix for the page-end overlap (see line 4).

## Changelog draft (for the teacher to decide)
"The score grid scrolls in its own box: the assignment names stay on screen as you scroll down a class, the sideways scrollbar is always visible, a sideways swipe settles on a column edge, and a cell you Tab, arrow or Enter into is never left hidden under the frozen name and grade. Arriving from *Waiting to be graded* always lands at the top of the column. Build v148."
