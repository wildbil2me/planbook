# WO-6.5 — A tapped day opens on that day · implementer result

**Implementer** Claude (work-order-implementer, Opus), 2026-09-23. Nothing committed, nothing pushed.
No `--start`, `--release`, `--handoff` or `--tick` run. The row still reads `🤖 CLAIMED — 2026-09-23`.

## Files changed

- `src/attendance.js`: the entry point, the view state, the anchor and the band/pager wording.
- `src/shell.js`: `openCalendarItem()` passes `item.date`, `openClassOn(classId, screen, date)` passes it on, and the "WHAT IT DOES NOT DO" paragraph is rewritten as "A CLASS'S DAY OPENS ON THAT DAY".
- `sw.js`: `CACHE` goes from `planbook-shell-v128` to `planbook-shell-v129`.
- `tools/verify/calendar-opens-on-day.mjs` (**new**): 13 checks.
- `tools/verify-shell.mjs`: one import, plus one `BROWSER_SECTIONS` row directly after `calendar-drawn.mjs`.
- `tools/README.md`: the call-site count goes 1451 → 1464 and "seventy" becomes "seventy-one" files. There is a new WO-6.5 paragraph after WO-8.14's.
- `TESTING.md`: new § WO-6.5 after WO-6.9. The 👤 line is left open.
- `plans/work-orders/phase-6-calendar-glance.md`: the six Acceptance boxes are ticked, each with its evidence. The status is not touched.

## The design, in one paragraph

The date travels as an argument: calendar chip → `openCalendarItem()` → `openClassOn(classId, 'class', item.date)` → `attendance.resetRegistry(date)`. `resetRegistry()` is the one arrival function, and it runs before anything paints. It does three things:
- It rolls the term to the tapped day's nearest term. This is `openTermNearToday(on || todayISO())`, which already took its date as an argument.
- It records `arrival = { date, classId, termId }` as a seventh view value, beside `editingDay`.
- When no date is passed, it clears `arrival`.

`anchorDate()` returns `arrival.date` while the arrival still describes the screen: same class, same selected term, and not the day the strip would open on anyway. When any of those fails, it clears `arrival`. That is the same "re-derived, not trusted" normalisation `editDate()` already applies to `editingDay`. Because the strip is *built from* the arrival day:
- portrait's single column is that day (portrait can't page);
- landscape's six-day window ends on it;
- nothing repaints afterwards, so there is no flash through today.

`Today` clears it first. A tap on another term's tab spends it, because `anchorDate()` sees the term change and the `paintRenderedTotals()` guard repaints.

## Acceptance, line by line

1. **Opens on the tapped day with its marks. Met.** Checked with `node tools/verify-shell.mjs` in section `calendar-opens-on-day.mjs`, using real clicks on meeting chips reached through the class's Calendar pill and the month pager:
   - Landscape: columns `["2026-09-18", …]` (today is 2026-09-23), S1 `A`, S2 `P`, the running term's tab active.
   - Portrait: columns `["2026-07-29"]`, S1 `T`, S2 `E`, the ended term's tab active.
   - A MutationObserver on `#attendanceHead` recorded every column head added during the tap, and today's never appeared.
2. **The date arrives through an argument. Met.** The entry point is `resetRegistry(date)`, the arrival function beside `editDay()`. It is not inside `editDay()`, because opening on a day is not unlocking one.
   - The only `data-` read is `itemAt()` reading the chip's own `data-calendar-date` as the chip's subject, the same way it already reads `data-calendar-ref`. The register never reads a DOM attribute to learn its day. A strict reading of this line might question that read, so I'm naming it here.
   - Mutation M1, which drops the argument at the call site, turned four of the section's checks red.
3. **The ordinary path still lands on today. Met.** Two checks:
   - A tapped day, then the grid and the card: today, no band, `Today` greyed.
   - A tapped day, then the header class tab: today on the running term.
   - Mutation M3, which keeps the old arrival on an ordinary arrival, turned the first of these red.
4. **A day outside the current term. Met, by opening.** A day in the ended term opens with that term selected, and the column and the tab agree (mutation M2 turned this red). A recorded day in *no* term opens on itself, and the band reads "Showing Wednesday, August 19, 2026 — outside every term — between WO-6.5 ended and WO-6.5 running. Today is not on screen."
5. **No new state. Met.** Across a tap the year document is byte-identical (`JSON.stringify` compared before and after), no `localStorage` value contains the tapped date, and `Object.keys(window)` gained nothing. The only thing that moves in `localStorage` is `planbook_openTermIds`, the existing term preference that every arrival already rolls; it holds a term id, not a day.
6. **`verify-shell.mjs` asserts the day and the marks. Met.** There are 13 checks. The clean run printed `1475 checks · 1475 passed · 0 failed · 0 skipped`, 46,563 lines, 543s, `EXIT=0`, on 2026-09-23 on the real clock. That was the second full run; the first went red on one of my changes, described next.

The first full run was red on one existing check in `verify/term-ended.mjs` ("paged back off the day the strip opened on…"). I had widened the band's way-back label to "where `Today` lands" in *every* state, and that check pins WO-2.52's ruling that the non-arrival sentence names the anchor. I narrowed the change to arrival states only, and the second run was all green.

`node tools/wo-sweep.mjs` gives `42 checks · 39 passed · 0 failed · 3 to review`, the same three reviews the tree arrived with. `node tools/wo-gate.mjs --audit` passes.

## Mutations

The mutations were five, over three full runs. Each was reverted by copying the pre-mutation file back from the scratchpad. `cmp` against the backups shows the files identical, and `grep -n "MUTATION M"` over `src/` and `tools/` is empty. The only `MUTATION` hits in the changed files are old prose (`src/shell.js:921`, present in HEAD).

| Run | Mutation | Summary | Red |
|---|---|---|---|
| A | M1: `openClassOn(item.classId, 'class')` (date dropped) | 1470 · 1465 · 5 failed | landscape day, no-flash, read-only, ordinary-way, plus the section's contained throw when the band button was missing (it cost the last 6 checks, hence 1470) |
| B | M2: term rolled to today's, not the tapped day's | 1475 · 1472 · 3 failed | portrait: the ended term's day under the running term's tab |
| B | M4: `editingDay = on` (arrival unlocks) | (same run) | read-only check; the no-term band sentence ("You are editing…") |
| C | M3: an ordinary arrival keeps the old `arrival` | 1475 · 1473 · 2 failed | ordinary-way after a tapped day |
| C | M5: `Today` doesn't clear `arrival` | (same run) | the band's *Back to today* from a same-term day |

M5 alone is invisible to the portrait `Today` check. There the press moves the term, and that spends the arrival in `anchorDate()` anyway. That is why the same-term band-button check exists.

## What I could not close

- **👤 iPad reading.** Tapping a recorded day on the installed app in both orientations, with a force-quit first. It is open in `TESTING.md` § WO-6.5 and needs the owner.
- The status stays `🤖 CLAIMED`; moving it is `--tick`, which is the orchestrator's.

## Judgment calls

- **Arrival does not unlock, in either direction.** The argument is in a comment at `editDate()`. A calendar tap is a reading gesture. A locked past column already shows every mark, time and note, so opening on the day never needed an unlock. A future arrival is refused the same way, so the rule is one sentence a teacher can hold. The ✏ is on the column, one tap away.
- **Today is the one exception.** If an arrival lands on today (possible only when today is in no term and carries a record), today stays live, because today has never needed a ✏.
- **Where the tapped day beats the roll-over.** This is in `resetRegistry()`: the term rolls to the tapped day's nearest term, never to today's. A day in no term gets the nearest term, the same way today in a gap does. The strip is still built from the day itself, which is answered before the term's soft wall in `anchorDate()`, not clamped by it.
- **What spends an arrival.** Another class, another term (so a term tab never loses to the arrival), or the arrival equalling the day the strip would open on anyway (so tapping today's chip is an ordinary arrival). It is re-derived on every paint.
- **Band and pager wording.** Only while an arrival stands, the way back names where `Today` lands (the new `todayLanding()`), not the anchor. Otherwise it would read "Back to Sep 18" over Sep 18. Every other state is unchanged, per WO-2.52's ruling, which `term-ended.mjs` asserts. The "X is not on screen" clause is left out when the landing day is actually among the columns (a future arrival's window can contain today).
- **Caption.** "starting with today" is now asked of the newest column, not `pageDaysBack === 0`, which stopped meaning today when WO-2.52 moved the origin. It is a screen-reader caption, and this work order made the old test wrong more often.
- **Conventions set.** `homeDate(term)` is split out of `anchorDate()` so the clamp exists once. The view-state count in the comments goes from six to seven, counted off the declarations as that block's header asks.

## Out-of-scope temptations, declined (proposed follow-ups)

1. **A pre-existing mismatch outside arrivals.** With an ended term selected while today is in another term, and paged away, the band and the pager's `Today` title name the anchor ("Back to Oct 31") while the press goes to today, because `Today` moves the term. `todayLanding()` would fix it in one line per site. It is WO-2.52's wording and asserted, so it is the owner's call.
2. **No spoken announcement names the day.** `showClassScreen()` announces "Attendance for X.", and the band states the day visually but is not a live region. A screen-reader user is not told which day it opened on.
3. **Tooltip wording.** Portrait's disabled Earlier/Later tooltip says "Portrait shows today", which is slightly off while standing on an arrival day.
4. **Paging while on an arrival is untested.** Earlier/Later in landscape page relative to the arrival day, as the origin. It should behave like any other anchor, but no check drives it.

## Draft CHANGELOG entry (for the teacher to decide)

> Tapping a class's day on the calendar now opens its register on that day, showing that day's marks,
> instead of on today. It opens read-only, like any past day: press ✏ to change a mark. The term tab
> follows the day, and `Today` gets you back.
