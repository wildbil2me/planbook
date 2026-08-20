# WO-6.3 — Month & week views · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-6-calendar-glance.md`
**Report to** `.claude/dispatch/WO-6.3-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus** tier. The deciding signal is the sensitive surface:
this work order draws IEP/504 review dates onto a month cell and must make them vanish entirely in
presentation mode, and it registers the print gate that keeps `supports` data off a printed month —
the "a plausible-looking implementation is a legal disclosure" case that is never delegated. Three
more Claude triggers fire alongside it: it establishes the calendar view's convention (the sixth
`VIEWS` line, which everything Phase 6 adds afterwards copies), it produces teacher-facing prose (the
honest empty state), and its Traps are about judgment rather than mechanics. The runner-up I set
aside: the mechanics read Codex-shaped — size M, a settled read-side API in `src/calendar-derived.js`,
a print-gate pattern already written in `src/detail.js` — but no Codex probe was run, because the
schedule-model trap and the 44px-vs-four-chips departure are decisions, not transcription.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-6.3 — Month & week views

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-19 · **Size** M · **Depends on** WO-6.2
**Closes roadmap** Phase 6 → "Month and week views, filterable by class.", "IEP/504 review dates"
*(the second fragment came from WO-6.2 on 2026-08-19, the owner's call — its box says review dates
are **surfaced** ahead of time, and this is the work order that draws them. WO-6.2 built and measured
the read side and holds the presentation-mode rule; ticking the box there would have had the roadmap
claim a surface no screen provided. The acceptance line that ticks it is the review-date row carried
here under WO-6.2's `**Owes**`.)*

**Why it exists.** This is the first surface in the phase with a DOM in it — `src/calendar.js` is the
model and has none — so three of WO-6.2's acceptance lines are carried here, under an
`**Owes** WO-6.3` on that work order rather than a dependency edge: WO-6.3 already depends on WO-6.2,
and a `Depends on` in the other direction would be a cycle the gate would call satisfied.

**Deliverables**
- Month view and week view over authored plus derived events.
- Filter by class; the owner teaches five and rarely wants all of them at once.
- Tap-through from any item to the thing that resolves it.
- Touch and keyboard paths; the coarse-pointer block.
- **The sixth view.** `src/views.js`'s `VIEWS` gains one line — `calendar: 'calendarView'` — and
  `index.html` one `<div>`, which is the whole of what that file's header says a new view costs. It is
  not a class screen: it adds no entry to `CLASS_SCREENS`, draws no tab in `src/screen-nav.js`, and
  needs no `REMEMBERED_AS` line, because it belongs to no class.
- **The print gate this surface owes WO-8.4.** Register through `registerPrintGate()` in
  `src/print-gate.js` with this view's own `<body>` attribute — `data-calendar-print` — and an
  `isOnScreen` predicate in the `src/detail.js` shape rather than either modal one, because the
  calendar is a view inside `<main>`: it asks `src/views.js`'s `currentView()` and never `.hidden` or
  a modal id. **The control that asks for the print is named differently from the gate** —
  `data-calendar-month-print` — which is `src/print-gate.js`'s standing invariant, bought by the
  owner's own stuck-attribute bug: `<body>` is reached by `closest()` from every click on the page, so
  one string doing both jobs matched every click for as long as the gate was on. Without the gate a
  `Ctrl+P` here prints the ordinary page with the review chip still on it, and WO-8.4 cannot backstop
  a surface that ships before it.

**Acceptance**
- [ ] 👤 A month with a break, two pre-drops, six assignments, and a grades-due deadline renders
      legibly on an iPad without horizontal scrolling.
- [ ] The class filter applies to derived items as well as authored ones.
- [ ] A month with nothing in it shows an honest empty state.
- [ ] Every item taps through to its source.
- [ ] A derived due date moves with its assignment: change the date on the assignment and the month
      grid shows it on the new day, with no other action.
- [ ] 👤 A review date on a month cell shows a date and a name and no plan type, and in presentation
      mode the cell shows nothing at all where it was — read on the device, across a room, because a
      palette and a suppression are judgements a headless browser cannot make however green it
      measures (the WO-2.3 precedent).
- [ ] 👤 Every control this screen adds clears 44px under `@media (pointer: coarse)`, checked under a
      thumb rather than in a stylesheet — and if a month cell holding four chips cannot hold that
      floor and still fit a month on one screen, the departure is the owner's to make and is written
      down at the point of departure, the way `src/home.css` does for `.class-card-state`.
- [ ] No printout of a calendar month emits a review date, a plan type, or any other `supports`
      value, whatever presentation mode says — and `data-calendar-print` appears nowhere in
      `src/shell.js`'s delegated `closest('[data-…]')` census, which is what keeps the gate from
      being a click hook.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/calendar.js`
  - `src/detail.js`
  - `src/home.css`
  - `src/print-gate.js`
  - `src/screen-nav.js`
  - `src/shell.js`
  - `src/views.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also open these before you write anything.** Each is here because a convention in it is one
this screen must match rather than re-derive.

- `src/calendar-derived.js` — **the entire read side already exists and is measured.** WO-6.2 landed
  `derivedItemsIn(doc, from, to)` plus one function per kind (`assignmentDuesIn`, `termEdgesIn`,
  `meetingStatesIn`, `reviewDatesIn`), the kind constants (`ASSIGNMENT_DUE`, `TERM_START`, `TERM_END`,
  `MEETING_STATE`, `REVIEW_DATE`, `DERIVED_KINDS`) and `isDerived(item)`. **Do not compute a derived
  item in the view.** If a month grid needs something this module does not answer, that is a finding
  for your report, not a second reader. The module holds **no writer** and `wo-sweep.mjs` § 17
  asserts that structurally — do not add one, and do not import the store into it.
- `src/calendar.js` — the authored side: `eventsIn`, `generalEventsIn`, `exceptionsIn`, `kindInfo`,
  `coversDate`, `coversClass`, `findEvent`, `leadDaysOf`. Read authored events through here.
- `src/supports.js` — **`supportsVisible()` is the one switch, and presentation mode is the hand on
  it.** The review-date suppression goes through that call and never through a local
  `if (presentationMode())` in your view. Note the default: `presentationMode()` reads
  `getPref('presentationMode') !== false`, so the mode is **on** unless the browser has turned it off.
  A month grid that only hides review dates when someone flipped a switch has the polarity backwards.
- `src/print-gate.js` — `registerPrintGate(attr, isOnScreen)` is the whole API, and it returns a
  sync function. `src/detail.js` line ~727 is your model:
  `const syncPrintGate = registerPrintGate(PRINT_ATTR, detailOnScreen);` — but your `isOnScreen`
  predicate asks `src/views.js`'s `currentView()`, because the calendar is a view inside `<main>`,
  not a modal. **The two attribute names are different on purpose** and the work order says why:
  the gate is `data-calendar-print` on `<body>`, the control that asks for a print is
  `data-calendar-month-print`. Acceptance line 8 is a grep for the first name in `src/shell.js`.
- `src/views.js` — its header states exactly what a new view costs: one line in `VIEWS`
  (`calendar: 'calendarView'`) and one `<div>` in `index.html`. The calendar's line is the one that
  file has been reserving. **It is not a class screen:** no `CLASS_SCREENS` entry, no tab in
  `src/screen-nav.js`, no `REMEMBERED_AS` line. It belongs to no class.
- `src/events.js` and `src/days-off.js` — the two authoring doors, and the tap-through targets for
  authored items. `src/events.js`'s header also states the schedule-model trap in this work order's
  own terms; read it, because the temptation arrives on a month grid in the same costume.
- `src/home.css` § `.class-card-state` — the precedent for acceptance line 7. If a month cell
  holding four chips cannot hold the 44px floor and still fit a month on one screen, **the departure
  is written down at the point of departure, in a comment naming the local rule that beats it.**
  Do not silently ship a 32px chip and do not silently ship a grid that scrolls sideways: state the
  tension in your report and let the owner rule on it.
- `src/detail.js` — the tap-through convention for reaching an assignment or a student from another
  surface, and the second half of the print-gate model above.
- Roll Call!'s `design/style-guide.md` and `design/portable-components.md` at
  `C:UsersWildBOneDriveDocumentsCoding ProjectsAttendance App` — **lift the design with the
  function; copy, don't re-derive.** WO-2.11's scar is in `CLAUDE.md`: a component that kept the
  reference's card shape and invented everything else got re-cut the same day.

**Two things in the work order that are easy to read past.**

1. **Three of your eight acceptance lines are WO-6.2's, re-homed.** Lines 4, 5 and 6 sit under an
   `**Owes** WO-6.3` on WO-6.2 — the phase's read side had no DOM to prove them against. When you
   close one here, go back and tick the pointer line on WO-6.2 too; a re-homed line that lands and
   is never ticked at its origin leaves the tracker claiming an open box forever.
2. **This work order carries a roadmap fragment that moved onto it** — Phase 6's "IEP/504 review
   dates" box, transferred from WO-6.2 on the owner's call because that box says review dates are
   *surfaced* and this is the work order that draws them. Its evidence is acceptance line 6, which
   is 👤. So expect this to land at `🔨 IN PROGRESS` with 👤 lines owed; that is the project's own
   convention, not a failure.

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

## 5. Done means these 8 lines, reported against one by one

1. 👤 A month with a break, two pre-drops, six assignments, and a grades-due deadline renders legibly on an iPad without horizontal scrolling.
2. The class filter applies to derived items as well as authored ones.
3. A month with nothing in it shows an honest empty state.
4. Every item taps through to its source.
5. A derived due date moves with its assignment: change the date on the assignment and the month grid shows it on the new day, with no other action.
6. 👤 A review date on a month cell shows a date and a name and no plan type, and in presentation mode the cell shows nothing at all where it was — read on the device, across a room, because a palette and a suppression are judgements a headless browser cannot make however green it measures (the WO-2.3 precedent).
7. 👤 Every control this screen adds clears 44px under `@media (pointer: coarse)`, checked under a thumb rather than in a stylesheet — and if a month cell holding four chips cannot hold that floor and still fit a month on one screen, the departure is the owner's to make and is written down at the point of departure, the way `src/home.css` does for `.class-card-state`.
8. No printout of a calendar month emits a review date, a plan type, or any other `supports` value, whatever presentation mode says — and `data-calendar-print` appears nowhere in `src/shell.js`'s delegated `closest('[data-…]')` census, which is what keeps the gate from being a click hook.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

