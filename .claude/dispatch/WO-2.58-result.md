# WO-2.58 — the attendance header gives back the rows it does not need · implementer's result

**Status as delivered:** 7 of 8 Acceptance boxes ticked in `plans/work-orders/phase-2-attendance.md`,
each with evidence in `TESTING.md` § WO-2.58. The 👤 line is open and needs the iPad. Row status left
at `🤖 CLAIMED`; I did not run `--tick`, `--start` or `--release`, and I did not commit.

## What landed

- `index.html` — the totals line (`#attendanceTotals`) is gone. The state line is now
  `<p id="attendanceState">` holding `<span class="attendance-state-totals" id="attendanceStateTotals">`
  and `<span id="attendanceStateText">`. The search box wears `.attendance-find` beside `.search-box`,
  with a `.search-clear` ✕ sibling (`#attendanceSearchClear`, `data-attendance-search-clear`). The
  sort pair is replaced by one `.class-action-btn.attendance-sort-toggle#attendanceSort`. ⌨, 🖨 and 🚪
  are glyphs only, with their aria-labels unchanged and titles that lead with the word they lost. All
  four sit in `.attendance-tools`. `#attendanceActions` and `#attendancePager` moved into one
  `.attendance-strip` under the toolbar. The Scores box has its own ✕ (`#scoresSearchClear`,
  `data-scores-search-clear`).
- `src/attendance.js` — `paintActions()` follows ruling 4 ("Not taken yet" replaces the pressed
  "✓ Everyone's here", and "Un-confirm everyone" appears only when `marked > 0`). It writes the day's
  span, not the `<p>`. `paintClassTotals()` writes the totals span, with the same wording as before.
  `paintToolbar()` draws the sort toggle's label, hook and title. New: `paintSearchClear()` and an
  exported `clearSearch(blur)`, and `setSearch()` and `resetRegistry()` now repaint the ✕.
- `src/scores.js` — `paintSearchClear()`, `clearScoreSearch(blur)` and the ✕ repaint in
  `setScoreSearch()` and `resetScoreSearch()`.
- `src/shell.js` — click routes for both ✕ hooks, and an Escape branch for the attendance search box
  in keydown. The census is updated. This file is not in the Deliverables, but the one delegated
  listener lives here and the ✕ and Escape cannot be wired anywhere else.
- `src/attendance.css` — § ATTENDANCE HEADER is lifted under the drawn names. Removed:
  `.attendance-totals`, `.attendance-toggle-on`, `.attendance-sort` / `-label` / `-btn`, the
  `(max-width:1024px)` block and `.attendance-actions-door:not(:only-child)`, each with a note where it
  stood. The actions and pager lost their bottom margins and are `nowrap`. There is a coarse block
  and a phone (≤640) wrap.
- `src/shell.css` — `.search-clear` (base, hover, coarse 44px), plus a touch-action group entry.
- `sw.js` — `CACHE` `planbook-shell-v174` → `v175`.
- Harness:
  - New section `tools/verify/attendance-header.mjs` (14 checks), registered after
    `strip-holds-still.mjs` in `tools/verify-shell.mjs`.
  - `tools/verify/score-search.mjs` has three new ✕ checks.
  - Reads moved to `#attendanceStateText` / `#attendanceStateTotals` in `attendance.mjs`,
    `calendar-opens-on-day.mjs`, `portrait-landscape.mjs`, `register-opens-on-term.mjs`,
    `term-edges-marking.mjs`, `term-ended.mjs`, `strip-holds-still.mjs`, `attendance-history.mjs`,
    `recorded-meeting-counts.mjs`, `term-nav.mjs` and `totals-render-cost.mjs`.
  - `attendance.mjs` reads the sort toggle.
  - `strip-holds-still.mjs` asks its "Earlier is not in the left half" question of the strip, because
    the pager is only as wide as its buttons now.
- `tools/README.md` — call-site count 1878 → 1895, plus a history entry.
- `design/mockups/proposed-attendance.css` — both banners now say "lifted 2026-10-09" and list the
  two departures. `design/mockups/README.md` and `design/mockups/index.html` are amended to match.
- `TESTING.md` — § WO-2.58 under Phase 2, with the Acceptance lines verbatim and the evidence for each.

## Acceptance, line by line

1. **[x] Strip one line at 820 coarse; first row still.** `verify/attendance-header.mjs` at 820×1180
   with touch emulation (`pointer: coarse` asserted). All six strip buttons share one top in each of
   six states, and `scrollWidth ≤ clientWidth`. The first grid row reads `[42,799.97,738,62.5]`
   (`===`) across not taken → take → un-take → first tap → first mark → all confirmed. The same holds
   at 1180.
2. **[x] Toolbar.** At 1180 it is one line. At 820 the box (289px) and the six pills sit on line 1,
   and `.attendance-tools` (Sort, ⌨, 🖨, 🚪 on one top) sits on line 2.
3. **[x] Actions.** Taken with nothing on it, the strip offers exactly `["Not taken yet","Didn’t meet"]`.
   Pressing "Not taken yet" leaves no record. "Un-confirm everyone" is absent in the not-taken, empty
   and only-`?` states, and present in the mark+`?` and mark-only states.
4. **[x] Totals.** The span is a child of `#attendanceState`. The figures were checked on arrival
   (Q2 2 · Year 5), after the take, un-take, first tap, mark and confirm, and after the Quarter 1 tab
   and back. No `#attendanceTotals` element and no `.attendance-totals` class remain.
5. **[x] ✕ on both screens.** In `verify/score-search.mjs`: the ✕ is hidden when empty and shown with
   text. `click()` with the field focused empties the field, brings all rows back and blurs the field.
   Escape in the registry box empties it. At 1024×768 coarse both ✕s are 44×44 around a 22px disc,
   and a real press at the centre clears the box.
6. **[x] Sort toggle and doors.** "Sort: Last" → "Sort: First" → back, with the rows re-sorted (the
   fixture's names sort in opposite orders by first and by last name). The doors are glyph-only and
   their aria-labels match the shipped strings exactly.
7. **[x] Tools.** `node tools/verify-shell.mjs`: `1898 checks · 1898 passed · 0 failed · 0 skipped`,
   60,411 lines, 886s, EXIT=0. I read the log's own EXIT line after the process exited.
   `node tools/wo-sweep.mjs`: `50 checks · 47 passed · 0 failed · 3 to review`. Those are the three
   standing REVIEWs; the mockup-banner one now also names `.search-clear` → `src/shell.css`, and the
   drawing's banner says why. `wo-gate.mjs --audit` passes. `CACHE` is v175.
8. **[ ] 👤 iPad.** Not read: it needs the device.

## Ruling 3: which fallback, and the widths

**Neither fallback was taken.** At 820px under a coarse pointer the strip is **740px** wide.

| State | Actions | Gap | Pager | Total needed | Slack |
|---|---|---|---|---|---|
| Widest: Everyone's here · Un-confirm everyone · Didn't meet | 385 | 10 | 235 | **630** | **110** |
| Only `?`s | | | | 587 | 153 |
| Not taken | | | | 470 | 270 |
| A mark with no `?`s left | | | | 502 | 238 |

At 1180 the strip is 1100px wide and has 470px of slack in the widest state. These are Edge's
measurements. Safari's font on the iPad is the one that counts, which is the 👤 reading.

## How I resolved the #attendanceState one-writer trap

**Two spans, one writer each.** `paintActions()` writes `#attendanceStateText` plus the `<p>`'s class,
title and aria-label, and never sets the `<p>`'s textContent. `paintClassTotals()` writes
`#attendanceStateTotals` and nothing else.

I did not take the other shape, where `paintActions()` writes the totals too:

- `paintActions()` is never handed the totals.
- On the write path it runs before `paintRenderedTotals()` recomputes them. Writing them there would
  paint the previous mark's figures, and a second paint would have to correct them. That is two
  writers decided by call order, which is exactly what WO-2.56 refused.

The decision is written at `paintActions()`, at `paintClassTotals()` and in `index.html` above the
line.

## Mutation proof

Each mutation was marked `MUTATION`, restored by copying the pre-mutation file back, and confirmed
`cmp`-identical. A grep for `MUTATION` in the added lines comes back empty.

1. **`paintActions()` rebuilds the line (the Trap).** All three totals checks went red (15/18).
2. **v174's action branches restored.** Line 3, the five-state check, the totals-after-writes check
   and the strip check went red (14/18). The section now presses actions only when they are drawn,
   so this reports as failures instead of throwing.
3. **`clearSearch()` without its blur.** The registry ✕ check went red (30/31).

Trimmed runs used a scratch copy of `verify-shell.mjs`, `tools/_scratch_wo258.mjs`, which is deleted.
No box above depends on it.

## Decisions the work order didn't settle

- **Ids:** I kept `#attendanceActions` and `#attendancePager` on the strip's children. The writers
  are unchanged and most harness selectors stayed valid.
- **Sort toggle hook:** it holds the order a tap changes *to*, so the existing `setSort(value)` route
  is the whole wiring. It has no `aria-pressed`.
- **Escape vs the ✕:** Escape clears and keeps the caret, which is the Scores box's existing
  behaviour. Only the ✕ blurs. Escape in the attendance box did nothing before, because the INPUT
  guard swallowed it.
- **When the ✕ shows:** it keys off the raw field value, so typed spaces can be cleared.
- **Door titles:** they lead with the word ("Keys — …") and keep the old sentence after it. The
  drawing's titles were the bare word.
- **Phone width (≤640):** the strip wraps, with the pager on its own line in every state. This is a
  stated departure, because `nowrap` would overflow the page at 390px, which
  `horizontal-overflow.mjs` measures.
- **Additions beyond the drawing:**
  - `white-space: nowrap` on `.attendance-state-totals`.
  - `margin-left: auto` on the pager, so it stays right when the actions are empty.
  - A coarse restatement of `.attendance-find` (cleared the sweep's added-selector review).
- **Ruling 9:** nothing in the harness asserts that the off-term door sits on the left. It is the
  actions' only child, and the actions sit at the strip's left. I reasoned this rather than measured
  it.

## Left alone, and temptations declined

- `src/scores.css` still names `.attendance-sort-label` in two provenance comments. That file is not
  in the Deliverables.
- `unconfirmAll()` still accepts an empty record if it is reached by some other route. Adding a guard
  there is not in scope.
- On the one state where it is set, the state line's aria-label names the day and the rule but not
  the totals. That shape comes from WO-2.56 and I left it unchanged.

## CHANGELOG draft (for the teacher to decide)

> The attendance screen gives two rows back to the class list. The term and year totals now sit at the
> end of the status line; the action buttons share the row with ◀ Earlier · Today · Later, right above
> the students, and that row no longer grows onto a second line when you mark the first student. Sort is
> one button, and Keys, Record and Passes are their icons. Both search boxes have a ✕ that clears them
> and puts the iPad keyboard away. And a class you took by mistake now offers "Not taken yet" to undo it
> — "Un-confirm everyone" waits until there's a mark to reset.
