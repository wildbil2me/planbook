# WO-6.4 — The glance page · implementer's result

**Implementer** Claude (Opus), 2026-09-16. Row was already 🤖 CLAIMED; no `--start`, `--release`,
`--handoff` or `--tick` was run. Nothing committed.

## Harness totals, read from the output after each command exited

- `node tools/verify-shell.mjs` → `1400 checks · 1400 passed · 0 failed · 0 skipped`,
  `43,708 lines · 31.2 lines per check · 486s`, **EXIT=0**. That's up from 1387: 13 new `check()` call
  sites, all run.
- `node tools/wo-sweep.mjs` (final, after every doc edit) → `42 checks · 39 passed · 0 failed · 3 to
  review`. The 3 reviews are the same ones as before this work order.
- `node tools/wo-gate.mjs --audit` → PASS.
- The only `MUTATION` hits in the files I touched are old prose mentions. `git diff | grep "^+" | grep -c MUTATION` → `0`.

## Against the six Acceptance lines

1. **Five sections in order, and every item taps through: met, box ticked.** On the WO-6.4 fixture
   the stack reads `grid,week,queue,attention,closing`. Every visible button in each section has a
   hook the click listener routes (4 · 1 · 7 · 11 · 1 buttons, none without one). I also tapped one
   item from each section in order. They landed on `#classView` (with that class open),
   `#calendarView`, `#scoresView`, `#signalsView` (with `#signalCardModal` open) and `#eventsModal`.
2. **Every student taps through to her card, and the count matches: met, box ticked.**
   - **Order and look:** the panel's rows are the first four row keys from the signals screen's own
     `signalsModel()`, in the same order. The column heads match that screen's heads exactly. Abe's
     row here has the same child elements and the same text as his row on that screen.
   - **Ranking is really tested:** Abe leads on `absence-run` even though his class comes last. Ben
     (`grade-rose`) comes before Gus (`no-missing`) even though Gus is first on the roster.
   - **Taps:** I tapped all six drawn rows, and each opened a card titled with that row's student.
     Closing a card puts focus back on her row in the column she was tapped from. Ben is on both
     lists, and his praise tap returns to `#signalsPraiseList`.
   - **Count, read off the screen:** 4 + 2 drawn, plus `and 4 more`, is 10. The chips add up to
     1 + 7 + 1 = 9.
   - **See decision 2:** the line's arithmetic only holds if a student on both lists counts once.
3. 👤 **Praise list not buried: not ticked, needs the iPad.** "Present" and "delta-ranked" are
   covered by line 2. "Not buried" is the owner's call on real hardware.
4. **Presentation mode: met, box ticked.**
   - **Switching on:** I used the header's real control with the page up and no re-arrival. Panel 4
     shuts: no `.sig-two`, no keyed row, no foot. The header and both doors stay.
   - **Counts kept:** the refusal reads *8 students are flagged and 2 are climbing.*
   - **No names:** no fixture surname appears anywhere in `#homeView`'s `outerHTML`, attributes
     included. The card chips don't change.
   - **Switching off:** the same rows come straight back.
   - **Redraw list:** `renderGlance()` was already on `flipPresentationMode()`'s list (since WO-6.8).
     I didn't add a second call. I updated the comment there, and `src/home.js`'s note now says the
     condition it named was met by panel 4.
5. **No support data on the page: met, box ticked.** I planted all of these on every student on the
   page: plan `504`, an `extended-time` accommodation with a marker detail, medical text,
   behavior-plan text and a case manager. None of them appears in `#homeView`'s markup, with the mode
   on or off. *1 review coming up* shows with the mode off and is gone with it on.
6. 👤 **Loads under a second on an iPad with a full year: not ticked, can't be measured here.** The
   build does halve the signals work per render (see decision 1). Nothing here measures load time.

Under an emulated coarse pointer, every control in panel 4 is at least 44px each way. That covers
the 2 header doors, 6 rows, `and 4 more` and the 2 cooldown feet; the rows measure 76–99px tall.

**Mutations.** I ran seven, one per run, each against a single-section copy of the harness. The copy
was `tools/scratch-wo64-only.mjs`, which is now **deleted**. Each file was restored from a pristine
copy, and `cmp` showed it identical. All seven made at least one check fail:

| Mutation | What it broke | Checks that failed |
|---|---|---|
| M1 | Rows left in roster order | Columns check, count check, and the section threw |
| M2 | Projector branch disabled | Shut check |
| M3 | `renderGlance()` removed from the flip list | WO-6.8's review-row check, the shut check and the support-data check |
| M4 | Landing searches both columns for the row | Every-tap check: Ben's praise tap returned focus to `#signalsList` |
| M5 | Five rows instead of four | Five checks |
| M6 | `supports.medical` put in a row attribute | Support-data check |
| M7 | Chip counts hits instead of students | Count check |

## Decisions the work order didn't settle

1. **The card chips now count the page's array** (the decision WO-6.7's header left for this
   sitting). `src/glance.js` has a new `signalReading()`: shown hits, held (suppressed) hits and the
   quiet middle, from one pass per class. `refreshHome()` calls it once, only while the home view is
   up. It hands the result to each card's `N need you` chip and then to `renderGlance(reading)`.
   `src/home.js` no longer imports `src/signals.js`. So "one array, counted on the card and drawn
   here" is literally true, and a render runs the signals pass once per class instead of twice.
   `renderGlance()` with no argument (from the flip) takes its own reading.
2. **The line-2 count only holds if a student on both lists counts once.** A student on both lists
   is one on her card but a row in each column. The check asserts drawn + `and N more` = chip total
   + students drawn in both columns, and that the fixture's one such student (Ben) is drawn in both.
   I recorded this under the ticked boxes in the phase file.
3. **What the controls do on the signals screen.** `data-signals-open` gained `list`, `card`, `more`
   and `held`, alongside `data-signals-column` and `data-signals-key`:
   - `card` scrolls to her row in that column and opens her card, with the row as the thing focus
     returns to.
   - `more` focuses the first row the panel didn't draw.
   - `held` opens that column's cooldown rows (through the new `expandSuppressed()` in
     `src/signals-view.js`) and focuses the foot.

   The column is part of the hook because one student can be a row in both columns. The hook list at
   the top of `src/shell.js` is updated.
4. **Panel 4's header has two doors:** `The quiet middle · N` and `The full list`, as the mockup
   draws them. Both stay up while projecting.
5. **Panel 4 appears only when the shown hits are non-empty.** A day whose only signals are held by
   the cooldown still counts as quiet, which matches what the quiet panel's sentence claims.
6. **Rows are built in `src/glance.js` in the same shape as `rowButton()`** instead of importing
   `src/signals-view.js`, because that module reads the document and runs its own pass. The copy
   could drift, so the harness compares a glance row with the screen's row for the same student. I
   followed the shipped row, not the mockup's `gl-row-avatar` class.
7. **I deleted the grid subtitle's stale sentence** ("each card will also grow…"). `index.html`'s own
   comment says to delete it once the chips shipped, and WO-6.7 and WO-6.8 both handed it to this
   work order. It now uses the mockup's wording.

## Left alone, and noted

- **Header caption:** it still reads *Your classes* where the mockup says *Today*. That text lives in
  `src/classes.js`'s class bar and other harness sections check it. It isn't in the Acceptance list,
  so I left it; it's the owner's call.
- **Quiet-middle door on some days:** on a day with week, queue or closing items but no shown hits,
  neither panel 4 nor the quiet panel is drawn, so the door appears nowhere. That's how WO-6.7 and
  WO-6.8 shaped it, and I didn't change it.
- **Foot spacing:** `.gl-more` and `.sig-hidden` both use `margin-top: auto`. In a column with both
  feet, the spare space splits between them. I can only fix that by styling `.sig-hidden` from
  `src/glance.css`, which the two-stylesheet rule forbids. It's for the owner to judge on the iPad.
- I didn't touch the ROADMAP dashboard, the README running-order status or `CHANGELOG.md`.

## Files changed

- `src/glance.js`: new `signalReading()`; panel 4 (grouping, rows, feet, shut state); `renderGlance(reading)`; comments updated
- `src/home.js`: chip counts the reading; `refreshHome()` takes it once; the flip-list note updated
- `src/shell.js`: `showSignals(landing, column, key)` with four new landings; click handler passes the extra attributes; hook list and flip-list comments updated
- `src/signals-view.js`: new `expandSuppressed()`
- `src/glance.css`: comments only
- `index.html`: grid subtitle
- `sw.js`: `CACHE` bumped to `planbook-shell-v119`
- `tools/verify/glance-quiet.mjs`: new WO-6.4 block (13 checks), two checks updated for panel 4, teardown extended
- `tools/README.md`: call-site count 1378 → 1391, plus a WO-6.4 paragraph
- `TESTING.md`: new § WO-6.4
- `plans/work-orders/phase-6-calendar-glance.md`: boxes 1, 2, 4 and 5 ticked, with a note

## Draft CHANGELOG entry (for the teacher to rewrite or drop)

> The home screen now shows who needs you. Under the grading queue is a panel with two columns,
> concern and praise, ranked the same way as the Who needs you screen. Each column shows four
> students and says how many more there are. Tapping a student opens her card on that screen. While
> presentation mode is on, the panel closes and keeps only the counts.
