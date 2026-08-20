# WO-6.3 — Month & week views · implementation result

**Implementer** Claude (work-order-implementer), Opus tier
**Work order** `plans/work-orders/phase-6-calendar-glance.md` § WO-6.3 (line 271)
**Status left on the tracker** `🔨 IN PROGRESS — 2026-08-19`, with three 👤 lines owed. That is the
project's convention for a work order whose remaining evidence needs a device, not a failure.

---

## The two commands, run to completion, on the delivered tree

```
node tools/verify-shell.mjs
1029 checks · 1029 passed · 0 failed · 0 skipped
28,375 lines · 27.6 lines per check · 346s          exit 0

node tools/wo-sweep.mjs
25 checks · 23 passed · 0 failed · 2 to review      exit 0
```

Both ran here — this sandbox drives headless Edge over CDP fine — and both were re-run after the
last source edit, so those numbers are of the tree as delivered rather than of an earlier one. The
harness moved from **1008** (the tree this work order arrived on, measured before I wrote anything)
to **1029**: twenty new call sites in one new section, plus one extra result out of the existing
stuck-gate loop, which now takes `data-calendar-print` as its fourth gate.

The sweep's two REVIEW lines are the two standing ones and are unchanged in shape. My files join the
first (`sensitive field names outside src/backup.js`): every hit in `src/calendar-view.js` and
`src/calendar-view.css` is prose stating the prohibition, plus the `.calendar-chip.review` class name
and the `.supports-panel` palette lift named in a comment. None of them emits to a merge field, an
export, a print surface or a log line — the print surface is the one that removes them.

**It was not green on the first harness run, and neither red was the app.** Both are written up in
`tools/README.md` beside the count, because the second is trap-shaped:

- The section asked `window.planbook.views.isClassScreen('calendar')`; `views` is not on the seam.
  The eval threw and **the run died where it stood with no summary printed**. The check was rewritten
  to assert what a teacher would see — no class tabs over the view, no switcher inside it — rather
  than widening the seam for one reading.
- `clickSel('[data-view-home]')` is not one element. Four screens carry that hook and the header's
  own "All classes" tab carries a fifth, and which is *visible* depends on the view. On the calendar,
  which is not a class screen, the first match in document order is `#classView`'s hidden one:
  `clickSel` measures it at 0×0 and clicks the corner of the viewport. Two checks reddened and **a
  third passed by accident** — the navigation it thought it had done had not happened and the screen
  it wanted was already up. Fixed with a `goHome()` that finds the visible one by index.

That second red found a **real defect in the app**, which is the part worth keeping: with the
calendar up, the navy header's caption read *"Your classes"* over a panel headed *Calendar*.
`src/classes.js`'s caption branch is reached by anything that is not a class screen and had been a
constant because until now only one view reached it. It is a two-entry lookup now, with the condition
under which a third view adds its line written beside it.

---

## Against the Acceptance list, item by item

**1. 👤 A month with a break, two pre-drops, six assignments and a grades-due deadline renders legibly
on an iPad without horizontal scrolling.** — **Left blank. Half verified, half needs the device.**
The overflow half is measured and green: at 390×844 with a seeded month, `document.documentElement`
reports `scrollWidth 390` in `clientWidth 390` and the grid `346` in `346`, over 35 cells. That is
what `table-layout: fixed` buys and it is asserted rather than assumed. **Legibly** is a judgement
about reading seven ~100px columns at arm's length, and no emulator has eyes. Not ticked.

**2. The class filter applies to derived items as well as authored ones.** — **Ticked. Verified by
`verify-shell.mjs`.** Three readings of one month: everything, then the fixture class, then a second
class. Filtered to the fixture class the due date, both term edges and both meeting states are on
their days; filtered to the other class none of them is; the school-wide closure and grades-due date,
which name no class, survive both. Detail line from the run is in `TESTING.md`.

*One ruling the line did not settle and I had to make:* a review date carries no `classId` —
`src/calendar-derived.js` says in as many words that "what a class filter should do with one of these
is WO-6.3's decision". **It follows its student**: shown for a class that student is on the roster
of, gone for one they are not. Asserted in both directions (either "always shown" or "never shown"
satisfies half of it). Written up in `docs/data-model.md` § Events.

**3. A month with nothing in it shows an honest empty state.** — **Ticked. Verified.** Paged four
months past the fixture through the real pager; the model counts 0 in range, the grid drew 0 chips
over 35 cells, `shell.css`'s `.empty-state` is up reading *"Nothing on August 2027."* with two doors
in it. Asserted in the other direction too — back on the fixture month the message is down over 8
chips — because "always up" satisfies half of it. **The grid stays up behind the message**: a teacher
who opened a calendar wants the dates whether or not anything is on them.

**4. Every item taps through to its source.** — **Ticked. Verified — six kinds, six destinations, all
six clicked.** A closure → the days-off panel. A grades-due date → the events panel *with that row
loaded into its form*. A term edge → that class's term editor. A review → that student's own editor
with the support panel already showing and the date in it. An assignment's due date → that class's
assignment list with that assignment's editor up, carrying its id. A class's recorded day → that
class's registry, headed with the class's name.

*One thing it does not do, said out loud rather than left to be found:* a taken or dropped day opens
the registry on **today**, not anchored on the day tapped. `src/attendance.js`'s `editDay()` unlocks a
column inside the strip that screen is already showing and there is no entry point that anchors it
from outside. Opening the ledger the chip is a fact about is the honest half; anchoring it is a
follow-up with an owner (`src/attendance.js`) rather than something to improvise from the calendar.

**5. A derived due date moves with its assignment, with no other action.** — **Ticked. Verified.**
*With no other action* is asserted as **no action**: the date is changed on the assignment and the
harness then leaves the calendar and opens it again the way a teacher would. No repaint is called
from the check — one that called `renderCalendar()` itself would be proving the renderer runs rather
than that the month is recomputed from `assignments[].due` every time it is drawn. Both directions,
chip count unchanged across all three readings (8 → 8 → 8).

**6. 👤 A review date on a month cell shows a date and a name and no plan type, and in presentation
mode the cell shows nothing at all where it was — read across a room.** — **Left blank.** The DATA
half is green on the rendered grid and is the half a headless browser can make: the chip reads
`Review · Wo63Given Wo63Surname`, labelled with the date, pointing at the student id; a search of the
8,930-character grid's **text and its markup** for the five things that share a student record with
`reviewDate` — seeded with phrases nothing else in this repository contains — found none. With
presentation mode on: 0 review chips, the token `review-date` nowhere in the markup, neither the
surname nor the date anywhere, 7 of 8 chips untouched, and 1 back when the mode goes off.

What is owed is the **reading**. The chip takes `.supports-panel`'s subdued card, lifted with its
argument (amber means *act on this*, red means *this destroys something*, and a 504 review is
neither). Whether that reads across a room, and whether it is distinct enough from the term-edge chip
beside it, is the owner's call on her own hardware. **Not ticked, and the pointer line on WO-6.2 is
left open with the reason written beside it.**

**7. 👤 Every control this screen adds clears 44px — and the departure, if one is needed, is the
owner's.** — **Left blank. A departure was needed and is taken; it is the owner's to keep or refuse.**

Seven columns of an iPad in portrait is ~100px of cell. Four chips at 44px plus the date line is a
~200px cell; six rows of that is ~1,200px of grid, which is a month you scroll through twice — which
is a month that has stopped being one. So `src/calendar-view.css` floors a **month** chip at 28px and
writes the arithmetic out at the point of departure the way `src/home.css` does at
`.class-card-state`. **What pays for it:** the **week** view is one tap away and its chips take the
full 44px — seven cells instead of forty-two means the room exists there. The month is the survey and
the week is the surface you touch; the pair is the answer and either alone is not.

Measured under a really coarse pointer, three separate checks: 25 non-chip controls (span pair,
pager, class filter, Print, way back) all ≥44 in both directions; every week chip at 44.0; every
month chip at **28.8** — asserted as *at its floor **and** below 44*, so a silent drift down and a
silent "fix" up both go red. `#calendarView` is enumerated in the whole-app touch sweep's `VIEW_PLAN`
with a `byHand` note saying where it is measured and why the loop cannot express this claim.

**None of that closes the line.** It needs a thumb. If the owner rules against the departure, the
alternatives are named in `TESTING.md`: a taller cell with a vertically scrolling month, fewer chips
per cell with a "+N more" affordance, or the week as the only touch surface.

**8. No printout emits a review date or any `supports` value, and `data-calendar-print` appears
nowhere in `src/shell.js`'s delegated census.** — **Ticked. Both halves verified, in both tools.**

Under `Emulation.setEmulatedMedia: 'print'`: with the gate on, the review chip computes to
`display: none` while the due-date chip beside it is still `block`, `#calendarView` is `block`, the
print stamp is `block` and the toolbar is `none`. **With the gate off it is still `none`** — that is
the one deliberately ungated rule in the stylesheet, argued at the head of that block: it can only
ever subtract, and rounding an unanswerable question toward hiding is `src/supports.js`'s own rule for
exactly this data. On screen both chips are `block`, which is what stops the two readings above
proving nothing.

The census half is **`wo-sweep.mjs` § 18**, written for this line and made **general** rather than
about this gate — re-asserting today's accident is worth nothing (the block it sits beside says so).
It resolves every attribute handed to `registerPrintGate()` anywhere in `src/`, diffs them against
every `data-*` inside a `closest()` in `src/shell.js`, and reconciles each gate with the `@media
print` block selected under it **in both directions** (a block gated on a string nothing registers can
never apply, which is the same failure wearing the fix's clothes). Planted against on the delivered
tree: renaming the print control to `data-calendar-print` reddens it and names
`src/shell.js:1679`; restored and re-run green.

---

## Files changed

Written:

- `c:\dev\planbook\src\calendar-view.js` — the renderer, the view state, `calendarModel()`, the print
  gate. No `update()`, no cache, no `presentationMode()` test.
- `c:\dev\planbook\src\calendar-view.css` — the sixth per-screen sheet, the app's fourth `@media
  print` block, and the 44px departure at the point of departure.

Modified:

- `c:\dev\planbook\index.html` — the stylesheet link, `#calendarView` inside `<main>`, the third
  button on the home screen's title row, and one corrected sentence in the roster editor (the review
  date's hint said *"nothing reads it yet"*, which this work order made false).
- `c:\dev\planbook\src\views.js` — one line: `calendar: 'calendarView'`. No `CLASS_SCREENS` entry, no
  `REMEMBERED_AS` line.
- `c:\dev\planbook\src\shell.js` — import, 8 census rows, the click handlers, `showCalendar()`,
  `openCalendarItem()`, `openClassOn()`, four repaint chains, and `calendarView` on the seam.
- `c:\dev\planbook\src\calendar.js` — `shiftDays` exported, `weekdayOf` added.
- `c:\dev\planbook\src\calendar-derived.js` — its private day-step deleted in favour of that export.
- `c:\dev\planbook\src\classes.js` — the header caption is a two-entry lookup (the defect above).
- `c:\dev\planbook\sw.js` — `CACHE` v86 → **v87**, and both new files added to `SHELL`.
- `c:\dev\planbook\tools\verify-shell.mjs` — the new section, the `VIEW_PLAN` entry, the fourth gate.
- `c:\dev\planbook\tools\wo-sweep.mjs` — § 18.
- `c:\dev\planbook\tools\README.md` — the count 991 → 1011, the WO-6.3 entry, the sweep row 22 → 25.
- `c:\dev\planbook\docs\data-model.md` — the three WO-6.3 rulings under § Events.
- `c:\dev\planbook\TESTING.md` — the WO-6.3 section, and WO-6.2's re-homed-lines paragraph corrected.
- `c:\dev\planbook\plans\work-orders\phase-6-calendar-glance.md` — status, the ticks, and the two
  re-homed pointer lines ticked back at their origin on WO-6.2.

---

## Decisions the work order did not settle

**1. A month with every class showing draws no per-class meeting state.** Five classes across twenty
weekdays is a hundred `Taken` chips — the wall of amber `CLAUDE.md` warns about, in the reassuring
colour. So a meeting state is drawn when the window is a **week**, or when the class filter names
**one** class, which is what the filter is for. The screen says so in words under the grid, because
an absence and a bug look identical. **This is the biggest judgement in the work order and it is
reversible in one predicate** (`src/calendar-view.js`, `buildDays()`); if the owner wants the wall,
delete the two-clause guard.

**2. A review date follows its student through the class filter** (above, acceptance 2).

**3. The month/week span, the anchor and the class filter are not persisted.** Every arrival starts on
today, on the month, with every class showing — the call `src/attendance.js`'s filter pills make, for
the reason a remembered filter is a month grid quietly hiding four fifths of the school year from a
teacher who does not remember setting it. No new `planbook_` key was added.

**4. The day-step was exported from `src/calendar.js`.** `src/calendar-derived.js` carried a copy
under a comment reading *"If a third file ever needs a day-step, that is the moment it earns an export
and both callers take it."* The month grid is the third caller, so the export happened and the copy is
gone. `wo-sweep.mjs` § 17 still passes (no writer added; the five reads are intact).

**5. All seven weekday columns are drawn, weekends included.** A month grid that hides Saturday hides
a trip authored on one — silently, which is the mirror of "draw nothing where nothing was recorded".

**6. The cell is not a control; the chips are.** A `<button>`'s content model is phrasing content, so
a tappable cell could not hold tappable chips — the wall `src/home.js` hit at WO-2.1 and paid for
twice.

---

## Things I noticed and did not act on

- **`node tools/wo-gate.mjs WO-6.3` prints ``owes    `.)*   0 re-homed line(s) resolving``.** This is
  **pre-existing** and not mine: WO-6.3's header block ends with an italic note whose last line
  contains the literal ``` `**Owes**`.)* ```, and `fieldRe('Owes', …)` matches it. WO-6.2 parses
  correctly (`owes WO-6.3   1 re-homed line(s) resolving`, which is right — one pointer line is still
  open). Cosmetic, the gate passes, and the fix is either the note's wording or the parser. Not
  touched, because it is neither this work order's text nor this work order's tool.

- **`tools/README.md`'s sweep row read "22-check standing sweep" while the tool printed 24 results**
  before I started. I updated it to **25**, which is what it now prints — but that is a correction of
  a pre-existing drift as well as a new count, so it is worth a second pair of eyes. Nothing asserts
  that number; only the `check()` call-site sentence is checked.

- **Anchoring the registry on the day a meeting chip names** (acceptance 4 above). It wants an entry
  point in `src/attendance.js` that does not exist. Proposed as a follow-up.

- **The `roster-hint` under the review-date field is the only copy in the app that names where the
  date shows up.** I corrected it because this work order made it false. If the owner wants different
  words, they are in `index.html` and not in a module, deliberately.

- **A check neither tool can make**, offered as a proposed follow-up rather than a third harness:
  nothing asserts that a *later* per-screen stylesheet does not restyle `.calendar-chip` or the other
  `.calendar-*` classes. `src/shell.css`'s header states the two-stylesheets-never-style-one-class
  rule and nothing enforces it. It is greppable — a class name owned by one sheet appearing as a
  selector in another — and would belong in `wo-sweep.mjs` as its own section, over all six sheets
  rather than over mine.

---

## Draft CHANGELOG entry — **not written**, for the teacher to decide

> ### Added
> - **A calendar.** The month and the week, over everything you typed in *and* everything Planbook
>   already knows: assignment due dates, term edges, which classes met and which were dropped, and
>   IEP/504 review dates. Open it from the home screen, beside *Days off* and *Events*.
> - **Filter it to one class.** The filter reaches the computed items too, not just the ones you
>   typed — and with one class showing, the month also draws that class's own days.
> - **Everything on it taps through** to the thing that changes it: a break to the days-off panel, a
>   grades-due date to the events panel with that row already loaded, a due date to the assignment,
>   a term edge to the term editor, a class's day to its register, a review date to that student.
> - **A quiet month says so** rather than looking broken, and leads to the two panels that fill it.
> - **A review date on the calendar is a date and a name.** Never a plan type, nothing at all while
>   presentation mode is on, and nothing on a printout in either mode.
>
> ### Changed
> - The header caption over the calendar says *Calendar* rather than *Your classes*.
> - The roster's review-date hint says where the date shows up, instead of saying nothing reads it.

---

## The 👤 boxes now waiting on the owner, in one list

Force-quit from the app switcher before reading any of them — this is a `SHELL` change (**v87**), and
a reload is not enough.

1. `plans/work-orders/phase-6-calendar-glance.md` § WO-6.3 acceptance **1** — a busy month renders
   *legibly* on the iPad, portrait and landscape.
2. § WO-6.3 acceptance **6** — the review chip's palette and its disappearance, read across a room.
3. § WO-6.3 acceptance **7** — 44px under a thumb, **and the ruling on the 28px month chip**.
4. `TESTING.md` § WO-6.3 — the same three, at the foot of that list.
5. `plans/work-orders/phase-6-calendar-glance.md` § WO-6.2 — the third re-homed pointer line, which
   closes when (2) does. Left open with the reason written beside it.
6. `plans/ROADMAP.md` Phase 6 — **both** fragments (*"Month and week views, filterable by class."* and
   *"IEP/504 review dates surfaced ahead of time"*) are left `- [ ]`. Their evidence includes 👤 lines
   and the work order is `🔨 IN PROGRESS`; ticking a roadmap box ahead of the work order that owns it
   is the thing the maintenance protocol forbids by name.

Nothing was committed or pushed. `CHANGELOG.md` was not touched.
