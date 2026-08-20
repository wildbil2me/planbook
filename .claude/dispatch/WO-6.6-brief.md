# WO-6.6 — The calendar's doors: in from every class screen, out of it to any of them · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-6-calendar-glance.md`
**Report to** `.claude/dispatch/WO-6.6-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, at Opus** (no tier override), on the work order's own
merits rather than by fallback — no Codex probe was run because this never entered the Codex column.
The deciding signal: the central deliverable is **reversing six written decision records**, including
the owner's own *THREE TABS, NOT FOUR* call of 2026-08-09, each with its date and its reason preserved
rather than silently edited — that is prose about what a decision means, and its Traps are judgment
rather than mechanics (a four-pill strip that scrolls silently instead of overflowing, a guarded
harness block that goes quiet rather than red, two import loops not to close). The runner-up
consideration set aside: Deliverables 1–7 read unusually mechanically for a Claude row and the harness
re-route is bookkeeping — but Codex would fail `ROUTING.md`'s proof-budget bullet regardless, since
Acceptance line 12 demands a green `verify-shell.mjs` run (~4.4 min) **plus** a second run proving the
check count did not shrink, before any of the reading and writing.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-6.6 — The calendar's doors: in from every class screen, out of it to any of them

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-19 · **Size** M · **Depends on** WO-6.3

**Why it exists.** Three gaps, all owner-reported on 2026-08-19 against the build WO-6.3 shipped that
morning, and all three are the same gap seen from three sides: **the calendar was built as a
destination and wired as a cul-de-sac.**

1. **It takes over `.header-bottom` and hands nothing back.** `refreshClassBar()` draws the class tabs
   on class screens only, so arriving here replaces the whole left-hand strip — *All classes* and every
   section — with a `Calendar` caption (`src/classes.js`, the `CAPTIONS` lookup). The way out is one
   `[data-view-home]` inside the panel header, which is a control the header row has trained a teacher
   not to look for. **The calendar must not take that bar over.**
2. **The two panels that author what the grid draws are not on the grid.** `data-dayoff-panel` and
   `data-events-panel` are on the home screen's title row and inside this screen's *empty state* — so
   a teacher looking at a March that already has one thing on it has no way to add a second without
   leaving. The buttons that put things on the calendar belong on the calendar.
3. **It is not one of the class's surfaces, and it should be.** Attendance · Assignments · Scores are
   reached the same way from anywhere inside a class; the calendar is reached from one button on the
   home screen. It earns the fourth pill.

**Four rulings, all the owner's, all 2026-08-19, and none of them re-opened by the implementer.**

- **The calendar becomes a class screen, and the two class controls do two different jobs.** The
  header tabs answer *which class am I in*; the toolbar's own filter strip answers *what is this grid
  about*, and it keeps **All classes**, which is the one thing a tab row cannot say. Tapping a header
  tab while the calendar is up **stays on the calendar** and moves the filter with it.
- **Arriving from a class arrives filtered to it.** The Calendar pill inside Period 3 opens on Period
  3's month; the home screen's own Calendar button still opens on every class. This is a narrowing of
  `src/calendar-view.js`'s *every arrival starts on today, on the month, with every class showing* —
  the first two thirds stand, the third is now decided by the door you came through.
- **Days off comes off the attendance actions row, and the 📅 in a covered column's head stays.** The
  permanent button goes; the one a teacher meets *on the covered column* and taps to ask where it came
  from is not a control competing for the thumb and is the reason that door was added.
- **The home screen keeps Calendar and loses the other two.** One door from home into the screen that
  owns all three.

**What this changes that is written down as deliberate — six records, and every one of them says the
opposite today.** Amend them in the same sitting; the rule is `CLAUDE.md`'s about `AGENTS.md`, applied
to a decision record instead of a rules file.

- `plans/gradebook-surfaces.md` § *How the class view navigates between its screens* — **THREE TABS,
  NOT FOUR**, the owner's call of 2026-08-09. This is the owner reversing it on 2026-08-19, and the
  record gets the reversal with its date and its reason, not a silent edit. The reason is worth
  writing down because it is not *four is fine after all*: the calendar is the first surface that is
  **about** a class without being **owned by** one, which is a kind the 2026-08-09 record had no
  instance of.
- `src/screen-nav.js`'s header repeats **THREE TABS, NOT FOUR** and its `SCREENS` is the list.
- `src/views.js` — `VIEWS`'s comment says the calendar **IS THE FIRST VIEW THAT BELONGS TO NO CLASS**
  and *appears in neither list below*. It now appears in both: `CLASS_SCREENS` gains `calendar`, and
  `REMEMBERED_AS` gains `calendar: 'class'` — without that second line a browser left on the calendar
  reloads onto it, which is the value that file says the preference cannot hold.
- `src/classes.js`'s `CAPTIONS` lookup exists **only** for this view and comes out with it; the
  caption falls back to *Your classes*, which is again the only screen that reaches that branch.
- `src/shell.js`'s `showCalendar()` header says *this is not a screen OF a class, so there is nothing
  to switch between*, and its `data-class-screen` note says the strip carries three.
- `tools/verify-shell.mjs` **asserts the inverse of this work order in as many words** — *the calendar
  is the sixth VIEW and belongs to no class … which is what not being a `CLASS_SCREENS` entry looks
  like*, with a comment saying a build that added it to that list fails here. That check is not
  deleted: it is **inverted**, and its comment rewritten to say what the strip and the tabs look like
  now and which owner call moved them.

**Deliverables**

1. **The fourth pill.** `src/screen-nav.js`'s `SCREENS` gains `{ view: 'calendar', label: 'Calendar' }`
   after Scores, and `#calendarView` gains the `<nav data-screen-nav>` in its panel header that every
   class screen has — the contract that file already states. `screenLabel()` then answers for it, which
   is what `src/shell.js` announces on a switch.
2. **The calendar is a class screen.** `CLASS_SCREENS` and `REMEMBERED_AS` in `src/views.js`;
   `paintClassScreen()` in `src/shell.js` gains its `calendar` branch. `refreshClassBar()` then draws
   the class tabs and the *All classes* door over it with no further change, which is the point — the
   fix for gap 1 is the calendar joining the list, not a second rule about this one view.
3. **Arriving filtered.** `resetCalendar()` takes the class the arrival is about — `''` from the home
   screen's button, the open class id from the pill — and `showClassScreen('calendar')` passes it. The
   filter is still module state in `src/calendar-view.js` and is still written to no preference.
4. **A header tab moves the lens rather than the screen.** With the calendar up, `data-class-tab`
   leaves the view alone, moves `openClassId`, moves the filter to the class just chosen, and
   re-renders. `selectClass()` hardcodes `showView('class')` today — **the preference must still be
   written in exactly one place**, so this is a change to that function or to the hook that calls it,
   never a second writer of `openClassId`. `src/classes.js` already imports `src/views.js`, so asking
   `currentView()` there closes no loop; importing `src/calendar-view.js` from it **would** close one,
   and the filter move therefore belongs to `src/shell.js`, which is where this app states the order
   things happen in.
5. **Days off and Events on the calendar.** Both hooks into `#calendarView`'s `.panel-title-actions`,
   ahead of Print and the way back. Same hooks, same route, no new panel — the wrapper wraps, which is
   why four buttons in that row is a measurement and not a guess. The two copies already inside
   `#calendarEmpty` stay: an empty state a teacher is meant to act on has to lead somewhere.
6. **Two doors close.** `daysOffDoor()` and its call site come out of `src/attendance.js`; the covered
   column head's 📅 stays exactly as it is. `data-dayoff-panel` and `data-events-panel` come off
   `#homeView`'s title row, leaving Calendar.
7. **The harness follows the doors.** `tools/verify-shell.mjs` holds **ten** references to
   `#homeView [data-dayoff-panel]` / `#homeView [data-events-panel]` — eight `clickSel()` calls and
   two `has()` guards — every one of them reaching a button that will not exist. Re-route each through
   the calendar's own copy, and read the trap below about what the two guards do instead of failing. The check at § *the sixth view* is inverted per the record list above; the
   attendance-row check that asserts `doors === 1` and *Days off* last in the row is rewritten to
   assert the **absence** of that door and the continued presence of the column-head one, which is the
   shape three attendance checks already have. Then `tools/README.md`'s `check()` count sentence —
   currently **1011** — and `sw.js`'s `CACHE`, because `index.html` is entry one of `SHELL`.

**Acceptance**

- [ ] On the calendar the header's bottom strip carries the **All classes** door and one tab per active
      class, exactly as it does on Attendance, Assignments and Scores — and the `Calendar` caption is
      gone from `src/classes.js` along with the lookup that held it.
- [ ] The switcher inside `#calendarView` shows four segments with **Calendar** current, and the same
      strip on the other three screens shows Calendar as a live segment that reaches it.
- [ ] Tapping **Calendar** from inside a class opens the month on **today**, filtered to **that
      class**, with that class's meeting ledger drawn — the per-class state the month suppresses when
      every class is showing.
- [ ] The home screen's **Calendar** button still opens on every class showing, and the hint under the
      grid explaining why no per-class day is drawn still appears there and not on the filtered arrival.
- [ ] Tapping another class's header tab while the calendar is up leaves the calendar up, moves the
      filter to that class, and redraws. It does **not** land on Attendance.
- [ ] Tapping **All classes** in the toolbar filter shows every class while the header tab of the class
      you are in stays current. Two controls, two answers, neither one lying.
- [ ] `openClassId` is written in exactly one function after this work order, and `grep` proves it:
      no second writer, no `setPref('openClassId'` outside `src/classes.js`.
- [ ] Reloading while the calendar is up lands on **Attendance** for the open class — `REMEMBERED_AS`
      holds `calendar: 'class'`, and `planbook_openView` never contains `calendar`.
- [ ] Days off and Events open from the calendar's own panel header, and an event authored there
      appears on the grid behind the panel when it closes, with no reload and no second tap.
- [ ] The attendance actions row carries **no** Days off button on any state of any day, and the 📅 in
      a covered column's head still opens the panel with that day's exception in it.
- [ ] The home screen's title row carries **Calendar** and nothing else beside it.
- [ ] `node tools/verify-shell.mjs` is green, and the two coarse-pointer 44px blocks for the days-off
      and events panels **ran** — they are guarded by a `has()` on the home screen's own hooks, so a
      re-route that misses them leaves a green run with two fewer checks in it.
- [ ] The `check()` count in `tools/README.md` matches the run, and `node tools/wo-sweep.mjs` is green.
- [ ] 👤 On the iPad in portrait, the four-segment switcher fits its panel without the page scrolling
      sideways, and every segment is thumb-sized. The strip is `overflow-x: auto`, so a fourth pill
      that does not fit **scrolls silently** rather than overflowing — measure the strip, not the page.
- [ ] 👤 The calendar's panel header at 390px carries four buttons — Days off · Events · Print · All
      classes — on however many rows it needs, with none of them clipped and no horizontal page scroll.
- [ ] 👤 Walking Attendance → Calendar → another class's tab → Attendance never passes through a screen
      that looks like the wrong class's, and the class you land in is the one whose tab you tapped.

**Traps**

**The four-pill strip scrolls instead of overflowing, and that is a silent failure.** `.screen-nav`
carries `overflow-x: auto` (`src/assignments.css`), so the page width check every other control here is
measured by will pass while a teacher cannot see the fourth segment without swiping a control she does
not know scrolls. Measure `scrollWidth` against `clientWidth` on the strip itself.

**A guarded harness block that stops finding its door goes quiet, not red.** Two blocks in
`tools/verify-shell.mjs` are wrapped in a `has()` on `#homeView [data-dayoff-panel]` and a nested one
on `#homeView [data-events-panel]`. Deleting those buttons makes both blocks disappear from the run
with no failure and no `SKIP` — the exact vacuous pass `tools/README.md` § *Two rules that follow* is
about, and the reason the count sentence in that file is machine-read. **A run that gets shorter is a
run that stopped asking.**

**Do not let the filter become a preference.** `src/calendar-view.js` argues at its header that a
remembered filter is a month grid quietly hiding four fifths of the school year from a teacher who does
not remember setting it. Arriving *filtered to the class you came from* is not a memory — it is the
door you walked through, recomputed on every arrival. Nothing about scale, anchor or filter is written
to `localStorage` by this work order.

**Do not give the calendar a second writer of `openClassId`, and do not import `src/calendar-view.js`
into `src/classes.js`.** That import closes a loop — `calendar-view.js` already imports
`getActiveClasses` from `classes.js` — and it is the seventh time this repo would have closed one. The
order of operations belongs to `src/shell.js`; the preference belongs to `src/classes.js`; the filter
belongs to `src/calendar-view.js`. Three files, three jobs, no crossing.

**Nothing here learns which classes are expected to meet.** The phase rule holds and this work order
touches it once: arriving filtered to a class draws that class's **recorded** ledger, which is what the
week view and the filtered month already draw. A day with no attendance row and no authored exception
still draws nothing — `plans/rotating-schedule.md`, and `weekdayOf()` says so at its own definition.

**The Days off route is not being narrowed to one door, it is being moved.** Three doors reach it today
(home, the attendance row, the covered column head) and three reach it after (the calendar, the covered
column head, and the calendar's empty state). Count them on the way out; a work order that removes two
and adds one has narrowed a route rather than re-homed it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/gradebook-surfaces.md`
  - `plans/rotating-schedule.md`
  - `src/assignments.css`
  - `src/attendance.js`
  - `src/calendar-view.js`
  - `src/classes.js`
  - `src/screen-nav.js`
  - `src/shell.js`
  - `src/views.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also keep these open — they are where this work order's edits actually land.**

- **`index.html`** is not in the list above and holds four of the seven deliverables' markup. Anchors
  as of dispatch: `#homeView`'s `.panel-title-actions` at **line 526** carries the `data-dayoff-panel`
  and `data-events-panel` buttons deliverable 6 removes, with a comment block just above at 518 and
  541 arguing the *three buttons wrap at phone width* arithmetic — that comment is now about one
  button and must be corrected, not left describing a row that no longer exists. `#calendarView`
  opens at **1293** with its `.panel-title-actions` at **1302**; its empty-state copies of both hooks
  are at **1375** and **1379**, under a comment at 1363 explaining they are the same hooks — those
  two stay (deliverable 5 says so explicitly). Every other class view carries
  `<nav class="screen-nav" data-screen-nav …>` (lines 665, 871, 992, 1229, with the contract stated
  in the comment at 657 and 1022); `#calendarView` has **none**, which is what deliverable 1 adds.
- **`sw.js`** — bump `CACHE`. `./` is entry one of `SHELL`, so an `index.html` edit alone requires it,
  and without the bump no device sees any of this. It is named in deliverable 7 and is the easiest
  line in the work order to finish without.
- **`src/calendar-view.css`** and **`CLAUDE.md` § Conventions** — read the 28px month-chip note before
  touching any sizing here. It is the owner's ruling for **one** control, `verify-shell.mjs` asserts
  the 28 **as a departure** so both a drift down and a silent "fix" up go red, and it is explicitly
  not a precedent: the fourth pill gets **44**, and Acceptance line 14 measures it on the strip's own
  `scrollWidth` vs `clientWidth`, not on page width.
- **`plans/gradebook-surfaces.md` § *How the class view navigates between its screens*** — the
  reversal there is the one piece of writing in this work order that is not code. The work order says
  what the reason is and that it is not *four is fine after all*: the calendar is the first surface
  that is **about** a class without being **owned by** one, a kind the 2026-08-09 record had no
  instance of. Write it as the owner reversing himself on a date, with both dates legible.
- **`tools/README.md` § "Two rules that follow"** — the reasoning behind why the `check()` count
  sentence is machine-read, which is the whole mechanism Acceptance line 12 leans on. Read it before
  deciding the two guarded blocks are fine.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 16 lines, reported against one by one

1. On the calendar the header's bottom strip carries the **All classes** door and one tab per active class, exactly as it does on Attendance, Assignments and Scores — and the `Calendar` caption is gone from `src/classes.js` along with the lookup that held it.
2. The switcher inside `#calendarView` shows four segments with **Calendar** current, and the same strip on the other three screens shows Calendar as a live segment that reaches it.
3. Tapping **Calendar** from inside a class opens the month on **today**, filtered to **that class**, with that class's meeting ledger drawn — the per-class state the month suppresses when every class is showing.
4. The home screen's **Calendar** button still opens on every class showing, and the hint under the grid explaining why no per-class day is drawn still appears there and not on the filtered arrival.
5. Tapping another class's header tab while the calendar is up leaves the calendar up, moves the filter to that class, and redraws. It does **not** land on Attendance.
6. Tapping **All classes** in the toolbar filter shows every class while the header tab of the class you are in stays current. Two controls, two answers, neither one lying.
7. `openClassId` is written in exactly one function after this work order, and `grep` proves it: no second writer, no `setPref('openClassId'` outside `src/classes.js`.
8. Reloading while the calendar is up lands on **Attendance** for the open class — `REMEMBERED_AS` holds `calendar: 'class'`, and `planbook_openView` never contains `calendar`.
9. Days off and Events open from the calendar's own panel header, and an event authored there appears on the grid behind the panel when it closes, with no reload and no second tap.
10. The attendance actions row carries **no** Days off button on any state of any day, and the 📅 in a covered column's head still opens the panel with that day's exception in it.
11. The home screen's title row carries **Calendar** and nothing else beside it.
12. `node tools/verify-shell.mjs` is green, and the two coarse-pointer 44px blocks for the days-off and events panels **ran** — they are guarded by a `has()` on the home screen's own hooks, so a re-route that misses them leaves a green run with two fewer checks in it.
13. The `check()` count in `tools/README.md` matches the run, and `node tools/wo-sweep.mjs` is green.
14. 👤 On the iPad in portrait, the four-segment switcher fits its panel without the page scrolling sideways, and every segment is thumb-sized. The strip is `overflow-x: auto`, so a fourth pill that does not fit **scrolls silently** rather than overflowing — measure the strip, not the page.
15. 👤 The calendar's panel header at 390px carries four buttons — Days off · Events · Print · All classes — on however many rows it needs, with none of them clipped and no horizontal page scroll.
16. 👤 Walking Attendance → Calendar → another class's tab → Attendance never passes through a screen that looks like the wrong class's, and the class you land in is the one whose tab you tapped.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

