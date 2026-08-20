# WO-6.6 — The calendar's doors · implementer result

**Route** Claude (work-order-implementer), Opus · **Reported** 2026-08-19
**Verification** `node tools/verify-shell.mjs` → **1040 checks · 1040 passed · 0 failed · 0 skipped**,
28,885 lines, 27.8 lines per check, **349s, exit 0** · `node tools/wo-sweep.mjs` → **25 checks · 23
passed · 0 failed · 2 to review** (both REVIEW shapes pre-existing and unchanged by this work order).
Both numbers are quoted from output I read after the process exited; the log of the delivered-tree run
is at `C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\f16f2dbb-9331-44d2-beb2-719ca504202f\scratchpad\vs-run5.log`.

**Status line left at `🤖 CLAIMED`.** Three 👤 boxes are open and the verifier has not read this yet,
so `--tick` is not mine to run.

---

## 1. Files changed

| File | What changed |
|---|---|
| `c:\dev\planbook\src\views.js` | `CLASS_SCREENS` gains `calendar`; `REMEMBERED_AS` gains `calendar: 'class'`; the *IT IS THE FIRST VIEW THAT BELONGS TO NO CLASS* paragraph amended with both dates and the reason |
| `c:\dev\planbook\src\screen-nav.js` | `SCREENS` gains `{ view: 'calendar', label: 'Calendar' }`; *THREE TABS, NOT FOUR* kept and reversed beneath it, dated; three counts corrected (three screens → four, six elements → eight) |
| `c:\dev\planbook\src\classes.js` | `CAPTIONS` lookup removed, caption back to a constant; `selectClass()` now `showView(currentView() === 'calendar' ? 'calendar' : 'class')`; `refreshClassBar()`'s `onClassView` comment amended |
| `c:\dev\planbook\src\shell.js` | `paintClassScreen()` gains its `calendar` branch; `showClassScreen()` resets the calendar with the open class before the view swaps; `showCalendar()` passes `''`; the `data-class-tab` hook moves the lens instead of the screen when the calendar is up; five census entries and the `afterClassChange()` / days-off-handler comments amended |
| `c:\dev\planbook\src\calendar-view.js` | `resetCalendar(classId)`; the header's *with every class showing* third is now the door you came through, argued against the remembered-filter rule it must not become |
| `c:\dev\planbook\src\attendance.js` | `daysOffDoor()` and its four call sites removed; the covered-day note re-pointed at the 📅 on the column head; the action-row table and the two door paragraphs rewritten as a record of the removal |
| `c:\dev\planbook\src\attendance.css` | `.attendance-actions-door`'s comment re-pointed at `termDatesDoor()` (the class survives; only its author went) |
| `c:\dev\planbook\src\assignments.css` | `.screen-nav-btn` horizontal padding 14→**10px** (base) and 16→**10px** (coarse block), with the measurement and the refused alternatives written at the point of departure |
| `c:\dev\planbook\index.html` | `#homeView`'s title row down to one button (Calendar) with the 390px arithmetic kept as a record; `#calendarView` gains Days off + Events ahead of Print and the way back, and an empty `<nav class="screen-nav" data-screen-nav>`; the view's own header comment and the empty-state comment amended |
| `c:\dev\planbook\sw.js` | `CACHE` `planbook-shell-v87` → **`v88`** |
| `c:\dev\planbook\tools\verify-shell.mjs` | ten `#homeView` door references re-routed; two `has()` guards re-pointed **and given `else skip()` arms**; six checks inverted; eleven new call sites; two module-level helpers (`clickVisible`, `openCalendarPanel`); `VIEW_PLAN.calendarView.screen` `null` → `'calendar'` |
| `c:\dev\planbook\tools\README.md` | `check()` count 1011 → **1022**; a WO-6.6 entry with the run numbers, the six inversions, the guard reasoning and both first-run reds |
| `c:\dev\planbook\plans\gradebook-surfaces.md` | § *How the class view navigates between its screens*: the 2026-08-09 ruling kept, the 2026-08-19 reversal written under it with its reason and its cost |
| `c:\dev\planbook\TESTING.md` | a WO-6.6 block (13 ticked, 3 👤 open), a desk-pass paragraph, and a note on the WO-6.3 lines it supersedes |
| `c:\dev\planbook\plans\work-orders\phase-6-calendar-glance.md` | 12 acceptance boxes ticked; an italic note under the list explaining the one non-👤 box left open |

Not touched, deliberately: `CHANGELOG.md` (yours — draft in §5), the work order's **Status** field,
`plans/work-orders/README.md` (WO-6.6 is in no ship and has no row in the Ship 3 table).

---

## 2. Against the 16 Acceptance lines, one at a time

**1. Header strip carries All classes + one tab per class; the `Calendar` caption gone.** ✅ Ticked.
Harness, § *the month and the week, drawn*: `class tabs=17, way home in the strip=true, caption=""`
with `view=calendarView`. `grep -rn CAPTIONS src/` returns one hit and it is prose in the comment that
records the removal — no lookup, no `Calendar` string in that branch.

**2. Four segments inside `#calendarView` with Calendar current; a live Calendar segment on the other
three.** ✅ Ticked. Same check reads `switcher segments inside it=4 … ["Attendance","Assignments",
"Scores","Calendar"] with "Calendar" current`. The other three screens: the inverted assignments-section
check reads five strips all `["Attendance","Assignments","Scores","Calendar"]`, the hook list check
asserts `class,assignments,scores,calendar` with none disabled, and my new check taps the segment on
Attendance and lands on the calendar (`live=true`).

**3. Calendar from inside a class → today, that class, its ledger drawn.** ✅ Ticked. New check: the
pill lands on `calendarView` showing `2026-08-01..2026-08-31` (today's month) at scale `month`
filtered to `c_wo63`; paged to the fixture month **without touching the filter**, `2027-04-07` draws
`meeting-state` wearing `state-taken`, the hint is down, and the bare Wednesday still draws nothing.

**4. Home's Calendar button opens on every class; the hint appears there and not on the filtered
arrival.** ✅ Ticked. The inverted sixth-view check asserts `filter=""` on the home-door arrival, the
pre-existing check asserts the hint is **up** on that unfiltered month, and my new check asserts it is
**down** on the filtered one. Both directions, one fixture.

**5. Another class's header tab leaves the calendar up, moves the filter, does not land on
Attendance.** ✅ Ticked. New check: `view=calendarView, open=c_wo63b, current tab=c_wo63b, pressed
filter=c_wo63b, model filtered to "c_wo63b"`.

**6. All classes in the toolbar shows every class while the header tab stays current.** ✅ Ticked. New
check: `filter=""` while `open=c_wo63b` and the current tab is still `c_wo63b`, view unchanged.

**7. `openClassId` written in exactly one function.** ❌ **Left unticked, and the reason is not this
work order.** `grep -rn "setPref('openClassId'" src/` returns **two** hits, both in
`src/classes.js`: `:650` in `selectClass()` and `:975` in the add-a-class flow, where a teacher's
*first* class becomes the open one. The second predates this dispatch by about a fortnight. So the
line's second clause is true and greppable — nothing outside `src/classes.js` writes that key — and
its first clause ("exactly one function") is false and was false before I started. WO-6.6 added **no**
writer: the calendar keeps its view because `selectClass()` asks `currentView()` inside that same one
function, which is the trap's actual requirement, and `src/classes.js` does not import
`src/calendar-view.js` (the filter move lives in `src/shell.js`). I could not tick a line a grep
contradicts, so the box is open with a dated italic note under the Acceptance list saying exactly
this. **Whether the line is satisfied as written is the owner's call.**

**8. Reload while the calendar is up lands on Attendance; `openView` never holds `calendar`.** ✅
Ticked, and the tick is a measurement rather than an inference — I added a check for it rather than
reasoning from the code. Two assertions: `planbook_openView` reads `"class"` while `#calendarView` is
the view (the half a read-side fix cannot fake, since `showView()` collapses on the way in), and a
real `Page.reload` from that screen — *left on #calendarView in c_wo63 … came back on #classView in
c_wo63 headed "WO-6.3 Grid"*, with no `calendar` in localStorage either side.

**9. Days off and Events open from the calendar's own header; an event authored there is on the grid
behind the panel when it closes.** ✅ Ticked. New check: both panels open from
`#calendarView .panel-title-actions`, an event authored through the real form is one row in the
document and one chip on `2027-04-29` with `#calendarView` still up — no reload, no second tap. The
fixture event is removed again in the same block and the section's teardown count is unchanged.

**10. No Days off button on the attendance actions row; the covered column's 📅 still opens the
panel with that day's exception.** ✅ Ticked. The inverted attendance check reads *the action row reads
["✓ Everyone's here","Un-confirm everyone","Didn't meet"] with 0 days-off door(s) in it* — an absence
asserted beside the controls that write, so an empty row cannot pass it. The column head: the
forward-paging check reads `btn:"dayoff"` on the covered column, and the WO-2.3 walk still opens the
panel through `#attendanceHead [data-dayoff-panel]` and removes that day's event from the list it
drew. Four states of the row lost their door in code (`DID_NOT_MEET`, `COVERED`, the locked-past day,
and the ordinary row); the covered day's note now names the 📅 on its own column, because that branch
went from one control to none.

**11. Home title row carries Calendar and nothing else.** ✅ Ticked. New check reads the row as
markup (so it can be asked from any view): one button, `[data-calendar-open]` × 1,
`[data-dayoff-panel]`/`[data-events-panel]` × 0 in the row **and zero anywhere in `#homeView`**. The
coarse sweep's spill check now measures exactly one button there: `"🗓 Calendar" 95x44 … over by 0px`.

**12. `verify-shell.mjs` green and the two guarded 44px blocks RAN.** ✅ Ticked. 1040/1040, 0 failed,
**0 skipped**. Both blocks are in the log by name and passed: *days-off panel … measured 13 (including
6 class button(s))* and *calendar-events panel … measured 21*. The count did not shrink: 1029 → 1040
executed, +11 sites and no deletions. Both guards now key off `#calendarView .panel-title-actions` and
carry `else skip()` arms, so a future re-route that misses them prints a SKIP instead of vanishing.

**13. `check()` count matches the run and `wo-sweep.mjs` is green.** ✅ Ticked. `tools/README.md:1011`
reads **1022** and the sweep's own check confirms *1022 `check()` call site(s) … matching
tools/README.md:1011*. Sweep: 25 checks, 23 passed, 0 failed, 2 to review — the same two REVIEW shapes
(sensitive field names, due-date/late on one line) that were there before I started.

**14. 👤 iPad portrait: the four-segment switcher fits without sideways scroll, every segment
thumb-sized.** ⬜ **Not ticked — needs a real iPad.** What I can report: the harness now measures the
strip's own `scrollWidth` against its `clientWidth`, and **this line's trap was real.** The first run
read *the strip is 363 wide in 330 (document 390 in 390)* — it scrolled silently, the page was clean,
and the fourth segment was off the end of a control a teacher does not know scrolls. After the padding
fix it reads *315 in 315 (document 390 in 390)* at 390px with every segment 44px high, and *315 in 315
(document 834 in 834)* at 834px. No emulator has a thumb, and whether four segments plus the class-tab
row above them read as one place rather than two rows of navigation is the owner's call.

**15. 👤 The calendar's panel header at 390px carries four buttons, none clipped, no page scroll.** ⬜
**Not ticked — needs a real iPad.** Emulator reading, 390×844 coarse: `"📅 Days off" 97x44 over by 0px
· "📌 Events" 86x44 over by 0px · "🖨 Print" 73x44 over by 0px · "← All classes" 100x44 over by 0px;
document 390 in 390`. The spill measurement is the "Days off" defect from the first iPad sitting, so
the failure mode that produced this line is covered — what is not is whether a two-row header over a
month grid still reads as a header.

**16. 👤 Attendance → Calendar → another class's tab → Attendance never flashes the wrong class.** ⬜
**Not ticked — needs a real iPad and human eyes.** Every step of the walk is asserted (3, 5, and the
pill/tab checks), and the landing class is asserted twice. What no check can see is the *frame*: a
repaint order that is correct and still shows the wrong class for one paint is invisible to a check
that reads the DOM after it settles.

---

## 3. Decisions the work order did not settle, and which way I went

**The header tab moves the filter but not the anchor or the scale.** Acceptance 5 says "moves the
filter to that class, and redraws" and says nothing about the window. I move only the filter, on
`setCalendarScale()`'s own argument — a teacher who has paged to next April and then taps Period 3
means "Period 3, here", and snapping back to today would throw away the navigation she just did. The
arrival doors (`showCalendar`, `showClassScreen`) still reset all three.

**The tab tap also calls `attendance.resetRegistry()`.** The existing hook does, and I kept it on the
calendar branch: the class walking through the door is the same act whichever screen is up, and
without it a later tap on Attendance would land on the window the *previous* class was paged to. It
paints nothing (that is its contract), so it costs nothing on this path.

**Two spoken sentences on that tap, and the second wins.** `selectClass()` announces "Period 3, Q1 is
open." and `setCalendarFilter()` announces "Period 3 only, on April 2027." `announce()` defers 30ms
and the later write lands, so a screen-reader user hears the calendar's sentence — which names the
class *and* the range. I left both rather than adding a second announcement writer or a flag; if the
owner wants one sentence, the place to build it is `src/shell.js`, not a suppression inside
`selectClass()`.

**The 28px month chip is untouched and was not cited.** The fourth pill takes the full 44 from
`.screen-nav-btn`'s existing coarse floor. What gave way at 390px was horizontal padding, which is not
a touch dimension — the narrowest segment is still 56px wide.

**The padding fix is unconditional rather than a phone-width rule, and that was forced.** My first cut
put it in `src/assignments.css`'s existing `@media (max-width: 640px)` block, which is where a
phone-width rule belongs, and WO-3.7's general-form check went red eight times: *no responsive rule
declares a property on this sheet that the gated print block leaves unpinned.* `.screen-nav-btn` is
inside `#detailView`, so the pin would have to be a `body[data-detail-print]` rule written into the
assignments stylesheet — a print-gate rule for the per-student sheet in an unrelated file. One value
at every width has nothing to pin. The check is right; the rule was wrong. Written up at the point of
departure and in `tools/README.md`.

**Six records were inverted, not five.** The work order names `tools/verify-shell.mjs`'s *sixth view*
check. Five more asserted three tabs in the same file — the switcher's label list, its hook list, the
*Scores segment is a live door* check's `class,assignments,scores`, the detail breadcrumb's segment
count, and the walk that leaves the detail by each tab in turn. All inverted with both dates and the
reason; the last now walks **four** tabs, because the calendar is a screen a student's name could be
left on and that is worth asserting rather than assuming.

---

## 4. What I did not verify, and one edge worth knowing

- **The three 👤 lines.** No iPad. Everything I could measure about them is in §2 under 14–16.
- **A device that has run an older build.** `CACHE` is `v88` and `./` is entry one of `SHELL`, so the
  bump is there — but `verify-shell.mjs` has never seen a service worker. The force-quit procedure
  still applies before any 👤 reading.
- **The no-classes-at-all edge.** With the calendar in `CLASS_SCREENS`, a document with **no** active
  class draws four segments on the calendar (the strip is painted whenever the view is a class
  screen), and tapping Attendance there falls to the class grid because `showClassScreen()` refuses
  without an open class. The header strip on that document still reads "No classes yet." + *Add a
  class*, as before. It is honest but it is new: before this work order the strip was empty there. Not
  in any acceptance line, no check added, and I did not widen the work order to change it — noted here
  so the next reader knows it is a consequence and not an oversight.
- **Fine-pointer windows below ~330px of panel.** The strip now fits at 390px with a fine pointer too
  (the padding change is unconditional), but I only measured coarse at 390/834 and the existing
  breakpoint sweep at its own widths.

## 5. Proposed follow-ups (not built, not in the tree)

1. **One sentence on a class change while the calendar is up.** See §3. Small, and it is a
   `src/shell.js` order-of-operations question rather than a new writer.
2. **A `#calendarView` entry in the coarse sweep's own loop.** It stays `byHand` for the two reasons
   already written there, but the strip measurement I added lives in the WO-6.3 section; a future
   reader looking for "where is the calendar's 44px?" has two places to look.
3. **The empty-document calendar strip.** Whether four dead-ish segments belong on a calendar in a
   document with no classes is a one-line decision (`refreshScreenNav` already knows) and wants an
   owner's ruling rather than an implementer's.

## 6. Draft `CHANGELOG.md` entry — yours to accept, reword or discard

```
### Changed
- The calendar is one of a class's own screens. It joins Attendance · Assignments · Scores on the
  switcher, keeps the header's class tabs and the way back over it, and opens filtered to the class
  you came from — the home screen's Calendar button still opens on every class. A class tab tapped
  while the calendar is up moves the lens rather than the screen. (Reverses THREE TABS, NOT FOUR,
  2026-08-09; the calendar is the first surface that is about a class without being owned by one.)
- Days off and Events moved onto the calendar's own panel header, where the things they author are
  drawn. The home screen keeps one door — Calendar. The permanent 📅 came off the attendance action
  row; the 📅 in a covered column's head, which is where a teacher asks where a closed day came
  from, stays. Three doors reached Days off before and three reach it after.
- The class-screen switcher's segments are a little narrower: four of them did not fit a phone's
  panel, and the strip scrolls silently rather than overflowing when they do not.
```
