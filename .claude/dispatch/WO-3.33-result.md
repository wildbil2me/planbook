# WO-3.33 — a changed score cell keeps what it was · implementer's result

**Implementer** Claude (Opus), 2026-10-04. Nothing committed. No `--start`, `--release`, `--handoff` or
`--tick` run. The work order's status line is untouched (`🤖 CLAIMED`).

## Commands, read from their own output

- `node tools/verify-shell.mjs` (final run, delivered tree): `1760 checks · 1760 passed · 0 failed · 0 skipped`,
  `56,045 lines · 31.8 lines per check · 784s`, `EXIT=0`. The run before it (before the M1/M2 round and
  one comment edit in `src/scores.js`) printed the same counts at 780s, exit 0.
- `node tools/wo-sweep.mjs` (final): `47 checks · 43 passed · 0 failed · 4 to review`, exit 0. The four
  reviews are the three standing ones (sensitive field names — 454 mentions now, `src/score-history.js`
  importing `./supports.js` is a new one, the same shape as `src/score-notes.js`; due-date and late/missing;
  the mockup banner) plus **CSS selectors added with no coarse-block rule**: `.detail-history-row`,
  `.detail-history-arrow`, `.detail-history-step`. None is a control — they are a row, an arrow glyph and a
  text span on a card with no controls — so there is nothing to give 44px.
- `grep -rn MUTATION src tools index.html`: only long-standing prose (`src/shell.js:982`,
  `tools/README.md` ×9, `keys-legend-guards.mjs` ×4, `outreach.mjs:1578`, `score-grid.mjs:1667/2073`,
  `score-search.mjs:652`, `wo-gate.mjs:2562`). None in a file this work order created; both mutations
  reverted by copying the pre-mutation file back, confirmed with `cmp` (M1 also `git diff --quiet`).

## Against the Acceptance list

1. **[x] Changing score, flag or note ≥5 min after the last write pushes the previous cell with its `at`;
   the cell carries a new `at`.** `tools/verify/score-history.mjs`: 88 typed over a pre-build `{v:72}` pushes
   `{v:72}` once for two keystrokes; a note typed on a 90 stamped ten minutes earlier pushes `{v:90, at}`;
   *Missing → Late, 7 → Late, 9* with the late 7 pushed with its `at` by a score typed six minutes later.
   All three PASS in the final run. (The boundary is `since >= 5 min` pushes, `< 5 min` replaces; the WO
   says "more than five minutes" — exactly 5:00.000 pushes. Noted, not tested at the millisecond.)
2. **[x] Within five minutes replaces and pushes nothing, on the harness's shifted clock either side.** The
   section lays a second `Date` proxy (the shape of `SHIFT_PAGE_CLOCK`) over the page's own and moves it:
   4m55s after the last write 85 replaces (`was` still `[{v:72}]`); 5m05s after that 90 pushes the 85. PASS.
   Note: this is the section's own minute-level clock layered over `--today`'s day-level one, not `--today`
   itself, which cannot express minutes (the brief's trap). Extending the existing harness, no second harness.
3. **[x] Every grade on every screen byte-identical with every `was` removed; mutation-proved.** Compared:
   grid grade cells + summary, `classGrade()` ×3, `gradesRecord()`, `signals.evaluate()`, student detail
   hero + breakdown ×3 — with `was`, then with every `was` in the year stripped, then put back. PASS.
   **M1** (`scoreCell()` in `src/grade-engine.js` returns `cell.was[0]`): `1760 checks · 1759 passed ·
   1 failed`, exit 1 — exactly this check (Ada 65.45% D with `was`, 90.00% A without). `wo-sweep` § 28 also
   went red under M1, naming `src/grade-engine.js:54`.
4. **[x] Student detail lists the history in order, with dates; no history shows nothing extra.** Ada's card:
   `72 (undated) → 85 (Oct 4) → 90 (Oct 4)` and `Missing (undated) → Late, 7 (…) → Late, 9 (…)` in column
   order, last step = current; CSV carries none of it; Ben's card lists only his changed essay; Cy has no
   card. PASS.
5. **[x] Mark on cells with history only; note+history shows both, told apart; neither in the DOM under the
   projector.** Exactly three cells wear the ring and only they say "has earlier versions". Ben's essay
   (note + past): note corner top-left, ring bottom-right, different radius and colour, both `aria-hidden`,
   both clauses in name and tooltip. Projector flipped from the header: no ring, no `scores-history-mark`
   anywhere in `outerHTML`, no clause, no tooltip line; on detail no card, no step; flipped back, both
   return. PASS. **M2** (`scoreHistoryVisible()` returns `true`): `1760 · 1759 · 1 failed`, exit 1 — exactly
   this check.
6. **[x] A pre-WO backup restores unchanged; a year with history round-trips.** The "before" file is the
   year's own backup with every `at`/`was` stripped (the exact pre-build shape). `parseBackup()` identical,
   real restore through the confirm leaves the on-disk score map byte-identical to the file with no `at`/
   `was`; a year with history parses back and survives the real restore with Ada's essay byte-identical.
   PASS. No `SCHEMA_VERSION` bump, `newYearDocument()` untouched.
7. **[x] No exported reader outside the detail path returns `was`; a sweep check keeps it so.**
   `tools/wo-sweep.mjs` § 28 (above § 22): no `.was`, `'was'` literal or destructured `was` on any code line
   of `src/` outside `src/score-history.js` (comments stripped, line numbers kept); that file's exports held
   to five named ones; `scoreHistoryCard` imported only by `src/detail.js`, `reviseCell` only by
   `src/scores.js` and `src/past-due.js`. PASS; red under M1. `tools/README.md`'s sweep count 46 → 47.
8. **[ ] 👤 iPad.** Not ticked — no iPad here. The line in `TESTING.md` § WO-3.33 says what to read
   (ring findable at arm's length, ring vs note corner on one cell, the card's trail, projector absence).

## Every score-cell write path found

All go through `reviseCell()` in the new `src/score-history.js`:
- `src/scores.js` `writeCell()` — reached from `editScore()` (typing, per keystroke) and `applyFlag()`
  (L/M/X keys, the four flag-bar buttons, ⌫ on an empty cell → Clear). Now via a shared `putCell()`.
- `src/scores.js` `writeNote()` — reached from `editScoreNote()` (per keystroke in the note panel) and
  `removeScoreNote()`. It now builds the next cell from value/flag/note only, so the old `at`/`was` are not
  copied into the comparison.
- `src/past-due.js` `acceptPastDue()` — the bulk *mark missing*. Wired, **not exercised by a WO-3.33
  check**: the existing `past-due.mjs` check now asserts all six written cells carry a local `at` (PASS),
  but no check drives a past-due write over a cell that already has a past.
- Deletions only (whole columns, not cell writes): `src/assignments.js` ×2 and `src/classes.js` delete an
  assignment's column — history goes with its assignment, which is right. Restore / Drive adopt replace the
  whole document. No other writer of `scores[a][s]` exists (grepped `src/`).

## Decisions the work order did not settle

- **Where the clock is read.** `src/scores.js` decision 1 says nothing in that file reads a clock; kept true —
  `reviseCell()` reads it. `localStamp()` in `src/log.js` is now exported and reused (no third stamper).
- **A no-op is not a write** (brief trap): same value, flag and note → `{ write: false }`, nothing pushed or
  restamped. Tested (`90.` over 90).
- **A burst typed back to where it started takes its own push back** (my addition, argued in
  `src/score-history.js`'s header and `docs/data-model.md`). The grid writes on every keystroke, so
  overtyping a 72 with `7`,`2` would otherwise leave a `72 → 72` history and a ring on every cell retyped as
  it stood. Inside the window, a write equal to the last pushed version pops it, `at` and all. Tested
  (90 retyped 12 min later is byte-identical). **Known limit**: a burst that starts *inside* an existing
  window (cell already written <5 min ago) and nets to no change pushes nothing but does refresh `at`.
- **A cleared cell with a past is kept** as `{ v: null, at, was }` rather than its key deleted — otherwise
  backspacing a 72 on the way to 75 deletes the history between keystrokes. A cleared cell with no past
  still deletes its key (WO-3.5's invariant). Consequence: `src/assignments.js`'s `noteOnly()` now treats
  any no-value-no-flag key as not entered (it required a note before), so the entered count and the
  overdue tint are unaffected. Delete-confirm and backup "N scores" counts count keys and will count such a
  cell, as they already count a noted blank.
- **Trail wording**: flag words capitalised (*Missing*, *Excused*, *Late, 7*), *Blank* for a cleared
  version, `(undated)` for a pre-build version, and a version's note shown only where it changed from the
  one before.
- **The mark**: hollow teal ring (`#0e8a8a`) bottom-right, 7px (9px under coarse) — differs from the note
  corner in corner, shape and fill. Not a control, so no 44px. Its visual read is the 👤 line's.
- **The card** is "Changed scores", under "Notes on scores" on student detail, wearing `.log-card` (off the
  printed report); `studentCsv()` untouched. Detail's footer sentence now names it.

## Existing harness sections whose reading changed (claims unchanged)

`score-grid.mjs` (25-score column), `past-due.mjs` (accept writes `{v:null, flag:"missing"}`) and
`ungraded-count.mjs` (last blank typed) compared exact cell JSON; each now strips `at` before comparing and
asserts it was present. `score-notes.mjs` plants its cells stamped *now* so note edits replace rather than
push, and reads cells with `at` stripped but `was` kept, so a note edit that grew history still goes red.
These were the 11 failures of the first run on the new store shape (`1745 · 1734 · 11 failed`), all fixed by
this, none by loosening what a check claims.

## Files changed

New: `src/score-history.js`, `tools/verify/score-history.mjs`.
Modified: `src/scores.js`, `src/past-due.js`, `src/detail.js`, `src/detail.css`, `src/scores.css`,
`src/assignments.js`, `src/log.js`, `sw.js` (`CACHE` v163 → v164, `src/score-history.js` in `SHELL`),
`docs/data-model.md`, `tools/wo-sweep.mjs` (§ 28), `tools/README.md` (sweep 46 → 47; harness call sites
1737 → 1753 with its paragraph; § 28 in the tool row), `tools/verify-shell.mjs` (import + section entry),
`tools/verify/score-grid.mjs`, `tools/verify/past-due.mjs`, `tools/verify/ungraded-count.mjs`,
`tools/verify/score-notes.mjs`, `TESTING.md` (§ WO-3.33), `plans/work-orders/phase-3-gradebook.md` (seven
boxes ticked; the 👤 left open). `plans/future-features.md` § Gradebook item 5 already carried the parked
signals question — confirmed, not changed.

## Declined / out of scope

- No signal reads `was` (Traps); the "what rose means" question stays parked for the owner.
- Did not rename `noteOnly()` in `src/assignments.js` though its meaning widened — a comment says so.
- Did not add a past-due check for a write over a cell that already has history (named above as unexercised).

## Draft CHANGELOG line (the teacher decides)

*A revised score now keeps what it was.* Change a score, a flag or a note more than five minutes after you
last touched it and the cell remembers the earlier version — a small teal ring marks it on the grid, and the
student's detail page lists the trail, *Missing → Late, 70 → 88*, with dates. Fixing a typo within five
minutes leaves no trace. Only the current score counts toward any grade, the history is never printed or
sent, and it disappears under presentation mode.
