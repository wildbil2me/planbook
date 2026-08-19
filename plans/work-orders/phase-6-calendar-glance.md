# Phase 6 work orders — Calendar & the glance page

**Phase goal:** open the app at 7:40am and know what the day asks of you.

Deliberately late: **the glance page comes after the things it glances at.** Build it before signals
and outreach exist and you build it twice.

Most of this calendar is **free** — assignment due dates, term boundaries, and which classes met or
were dropped are already stored by Phases 2 and 3, and WO-2.3 already authors days off and
pre-drops. This phase adds the month view over that same data plus the remaining event kinds.

Three rules govern the phase:

- **Derived events are never copied into the events list.** Move an assignment's due date and the
  calendar must follow by itself; a stored copy creates two truths, and the one the teacher isn't
  looking at is the wrong one.
- **The glance page is a launcher, not a report.** If an item can't be acted on, it doesn't earn a
  place.
- **Nothing in this phase may learn which classes are expected to meet on a date.** A month grid is
  the surface that makes a schedule model look necessary, and it is not. WO-6.2's `**Traps**` block
  carries the whole of it, against [`../rotating-schedule.md`](../rotating-schedule.md); every work
  order below is written so that no line of it needs the answer.

---

## WO-6.1 — Event model & authoring

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-2.3 · **Owes** WO-6.4
**Closes roadmap** Phase 6 → "Event model: date or range, title, kind, optional class and student.",
"Grades-due deadlines", "Recurring events by materializing instances."
*(the first fragment stopped at the two words `Event model` until 2026-08-08, WO-2.15 — under twelve
characters once normalised, which the matcher refuses as too short to be safe. Anything in double
quotes on this line is read as a fragment, so a note about one is written in backticks. The fourth
fragment — the `IEP/504 review dates` box — went to WO-6.2 on 2026-08-19, WO-1.25, with the
deliverable and the acceptance line that belong to it: a `reviewDate` is **derived** and is not an
`events[]` entry, so the work order that computes it is the one that closes it.)*

**Why it exists.** WO-2.3 built the `no-school` and `dropped` kinds because attendance needed them.
This completes the model with the kinds a teacher types in for their own sake — and with the date
kind that carries a real consequence if missed.

**Most of the first deliverable is already built, and the `M` is not eight fields of new model**
*(2026-08-19, WO-1.25)*. WO-2.3 shipped the eight-field record in `src/calendar.js`'s `newEvent()`,
`endDate` written on every event, a range as one entry rather than one per day, the empty-`classIds`
rule, and a stable answer when two events cover one date; `docs/data-model.md` § Events already names
all eight kinds. **What is actually left** is six rows in the `KINDS` table, the authoring surface for
them, the first writer of `studentId`, the two fields named below that the record does not have, the
recurrence, and the validation lift. Read the size against that list.

**Deliverables**
- Full `events[]` per the data model: `{ id, date, endDate, kind, title, classIds, studentId,
  notes }`, kinds `no-school | dropped | early-release | grades-due | conference | meeting | trip |
  reminder`. Six of the eight kinds are new; the record is not.
- **The validation moves down into the model before a second door opens onto it.** Every rule
  protecting `doc.events` today lives in `createFromForm()` in `src/days-off.js`, which is a screen
  module: the date must parse, an end date may not precede its start, a `dropped` event naming no
  class is refused, and a range covering recorded meetings routes through that file's `openConfirm()`
  rather than committing. `src/calendar.js` enforces none of it — `newEvent()` will build a class-less
  `dropped` and `addEvent()` will store it. Move the four rules into `src/calendar.js` and have the
  days-off form call them, **before** this work order's authoring UI becomes the second caller. That
  is the WO-2.25 move: one mechanism lifted twice is one mistake living in two places.
- **Both authoring surfaces stay.** `src/days-off.js` keeps its own screen and this work order adds
  the general one. Two doors onto one field is not WO-1.13's redundant selector — the SIS importer
  and the roster editor have written the same student fields since WO-1.23, under merge rules written
  down in `docs/data-model.md`. **Two writers would be**, which is what the bullet above prevents:
  `commit()` in `src/days-off.js` stays the one place a day off is written, and the rules it enforces
  stop being its own.
- Authoring UI for all kinds, with ranges.
- **Grades-due as a first-class kind with a lead-time warning.** Re-keying into the SIS is a
  scheduled job, not something you remember. **Where it warns is WO-6.4's *Deadlines closing in*, not
  a banner of this work order's own** *(the open question WO-1.25 named, answered here 2026-08-19)* —
  the glance page is the 7:40am surface and a lead time is exactly the kind of item it exists to
  raise, and a second warning surface for one fact is the second answer this repo keeps refusing. The
  cost is real and is stated rather than hidden: the acceptance line for the warning is re-homed
  below and cannot close on this work order's own evidence.
- **Two fields this work order needs and the record does not have.** Neither is in `newEvent()`'s
  eight, and both were left out on purpose rather than by oversight:
  - **the grades-due lead time** — a teacher's setting, so it belongs in the document beside the rest
    of her settings, on the reasoning `docs/data-model.md` § Signal thresholds gives, and **not**
    under `planbook_`, which is UI preferences only.
  - **whatever identifies a materialized series**, so that "delete the whole series" is possible. A
    `seriesId` stores no recurrence rule and so does not reopen the materialize decision — it is a
    label on instances that already exist. The alternative is matching on title and kind, and that
    one deletes the second *Faculty meeting* the teacher typed by hand.
- **The `docs/data-model.md` amendment is a deliverable of this work order**, written here and graded
  by the acceptance line below. It was named by WO-1.25 and deliberately not written there: WO-1.7's
  verifier failed once on a schema edit that landed inside the commit whose acceptance line graded
  against it.
- **Recurring events materialize** into individual entries ("repeat weekly until 2026-12-19")
  rather than storing a recurrence rule. Flat, hand-editable, and one instance can move without
  reasoning about exceptions. *RRULE is V2, if ever.*

**Acceptance**
- [ ] Every event kind can be created, edited, and deleted, with and without a range.
- [ ] A weekly recurrence produces N independent entries; moving one moves only that one.
- [ ] Deleting a materialized series is possible without deleting each instance by hand.
- [ ] The four rules refuse from the model rather than from a form: a `dropped` event naming no class,
      an end date before its start, and an unparseable date are each refused when built through
      `src/calendar.js` directly, with no screen module in the call stack.
- [ ] `docs/data-model.md` § Events names the lead-time field and the series identifier, and the
      record it documents is field-for-field the record `newEvent()` writes.
- [ ] A grades-due event warns at its configured lead time.
      → WO-6.4 "A grades-due event appears under Deadlines closing in on every day inside its lead
      time, and taps through to the event"
- [ ] `no-school` and `dropped` behave exactly as WO-2.3 established — no regression.

---

## WO-6.2 — Derived events

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-6.1, WO-3.3 · **Owes** WO-6.3
**Closes roadmap** Phase 6 → "Derived events computed at render from assignments, terms, and the
schedule — not stored.", "IEP/504 review dates" *(the first fragment elided the middle of the box
until 2026-08-08, WO-2.15. An ellipsis inside a fragment matches nothing: `norm()` strips it rather
than wildcarding it, so a fragment may stop early but may never skip a middle. The second arrived
from WO-6.1 on 2026-08-19, WO-1.25 — a `reviewDate` is read at render out of a student record and is
never an `events[]` entry, which makes it a row in the table below rather than a kind above.)*

**Why it exists.** Everything on this calendar that the teacher did not type is already in the
document, and copying any of it into `events[]` would create the second truth the phase header
forbids. This work order is the read side: one answer per row of the table below, and no writer.

**The roadmap box says *the schedule* and there is no schedule to read.** The fragment above is
quoted as the box words it, and the thing it names is the **attendance ledger** — recorded meetings
plus the exceptions authored over them — which is the only meeting record this app has ever had. It
is not a meeting pattern, and nothing in this work order may invent one; `**Traps**` at the foot of
this work order is the whole argument.

**Deliverables**
- Computed at render, never stored:

  | Shown on the calendar | Read from |
  |---|---|
  | Assignment due dates | `assignments[].due` |
  | Term start and end | `classes[].terms[]` |
  | Which classes met, and which were dropped | `attendance[]` |
  | IEP/504 review dates | `students[].supports.reviewDate` |

- **IEP/504 review dates surfaced ahead of time, in presentation-mode-safe form** — a date and a
  student, **never the plan type**, and **suppressed entirely in presentation mode**. That is WO-6.1's
  wording, kept whole when the deliverable moved here on 2026-08-19 (WO-1.25); the weaker restatement
  that used to sit in this work order's acceptance list — "presentation-mode safe" and nothing more —
  is gone, because two sentences about one rule is how the weaker one comes to be the one somebody
  builds against. **The name stays on the calendar**, presentation-gated, because this is a surface a
  teacher opened on purpose. The glance page reads differently, and says why in WO-6.4's fifth box.
- Visual distinction between authored and derived items — a derived item is edited at its source,
  and tapping it should go there.
- **Nothing here answers "which classes meet on this date".** The attendance-derived answers are the
  ones already recorded — taken, dropped, covered — and the fourth state `src/attendance.js`'s
  `stateOf()` can return, `NOT_TAKEN`, is not carried onto a future date by this work order. See
  `**Traps**`.

**Acceptance**
- [ ] Changing an assignment's due date moves it on the calendar with no other action.
      → WO-6.3 "A derived due date moves with its assignment: change the date on the assignment and
      the month grid shows it on the new day, with no other action"
- [ ] `events[]` contains no derived entry, checked deterministically rather than by feel: seed a
      month holding an assignment due date, a term boundary, a recorded meeting, a planned drop and a
      review date; render it, page one month forward and one back, and re-read `doc.events` — it holds
      the same entries, by `id`, that were authored before the render.
- [ ] Tapping a derived due date opens the assignment, not an event editor.
      → WO-6.3 "Every item taps through to its source"
- [ ] A review date reaches the calendar as a date and a student and nothing else — no plan type, no
      accommodation, no medical or behavior-plan text — and is gone entirely in presentation mode.
      → WO-6.3 "A review date on a month cell shows a date and a name and no plan type"
- [ ] A future weekday shows **no per-class meeting state at all**: the derived answers are read from
      `attendance[]` and from authored `no-school` / `dropped` events, so a weekday with neither is
      blank rather than *not taken yet*, and nothing in this work order stores, derives, caches or
      infers which classes were expected to meet.

**Traps** — **Do not build the schedule model this grid will make look necessary.**
[`../rotating-schedule.md`](../rotating-schedule.md) — `plans/rotating-schedule.md` — is a settled
decision record: a cycle model was designed and removed on the same day, because the schedule rotates
*and* changes at random, and a second source of truth about which classes meet has to be corrected by
hand anyway. **The trap is specific to a month view and does not exist on the home screen.**
`stateOf()` has four answers and only three of them are facts about the class; `NOT_TAKEN` is the
*did-I-forget* state, which is exactly right on a home screen asking about **today** and is a wall of
amber on a grid asking about twenty weekdays across five classes. The obvious way to quiet that wall
is to know which classes were meant to meet — which is the cycle model that document rejects, reached
from the rendering side rather than the modelling side, which is why it will look new. **The fix is
the other one:** draw nothing where nothing was recorded, and if a distinction is wanted for days the
school is not in session, take WO-2.50's precedent — a quiet `off-term` modifier read off the term
bounds, not a schedule.

---

## WO-6.3 — Month & week views

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-6.2
**Closes roadmap** Phase 6 → "Month and week views, filterable by class."

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

## WO-6.4 — The glance page

**Ship** — · **Status** ⬜ NOT STARTED · **Size** L · **Depends on** WO-6.3, WO-4.5, WO-3.26
**Closes roadmap** Phase 6 → "The glance page" and "Honest empty states."

**Why it exists.** This is what WO-1.10's home screen has been accreting toward since Phase 1. It
is a **launcher, not a report** — every item taps through to the thing that resolves it.

**It is `#homeView` grown, not a sixth view** *(the open question WO-1.25 named, answered here
2026-08-19)*. WO-1.10 says the home screen becomes the glance page and `src/home.js` says the same in
its own header; `src/views.js` reserves its one Phase 6 line for the **calendar**, which WO-6.3 takes.
So `VIEWS`, `CLASS_SCREENS` and `REMEMBERED_AS` are untouched here, `DEFAULT_VIEW` still reads `home`,
and what is in scope is the card and the panels inside a view that already exists. The slots this
fills were reserved by name: `src/home.js` appends `.class-card-signals` empty and `src/home.css`
holds its height, so that the first real datum reflows nothing.

**Deliverables** — in the order a teacher needs it at 7:40am:
1. **Every class with today's state — taken · dropped · not yet** — each with a one-tap fix.
2. Today's and this week's events.
3. What's waiting to be graded. **The per-class half of this is WO-3.26's**, which fills
   `.class-card-signals` in Ship 2; this work order is the page-level panel over the same engine call,
   and depends on it rather than assuming it.
4. Who needs attention — concern and praise, post-cooldown, from WO-4.5.
5. Deadlines closing in, including grades-due lead times — the surface WO-6.1's lead-time warning is
   re-homed to.

Plus: **honest empty states.** A quiet day says "nothing needs you today", not five empty panels.

**The review item is a count, not a name** *(owner's call, 2026-08-19, WO-1.25)*. This page shows
`1 review coming up`, and the student's name is one tap away on the calendar — a surface she
deliberately opened. It discloses strictly less than the roster dot that has shipped since WO-1.7,
which says that a student has something on file at all, and it is this page's own grammar: a launcher
says how much is waiting and the surface it launches says what. The alternative reading of the old
fifth box — no review date on this page in any form — put the one deadline a teacher is legally
obliged not to miss on the month grid she has to go looking for, and off the page she opens every
morning.

**Acceptance**
- [ ] The five sections appear in that order, and every item in every one taps through.
- [ ] The today-state row is correct against a day with a mix of taken, dropped, and untaken classes.
- [ ] A day with nothing pending renders one honest message, not five empty panels.
- [ ] 👤 The praise list is present and delta-ranked — not buried behind the concern list. Present is
      measurable and *not buried* is the owner's reading of her own page, which is why this line needs
      her and not a selector count.
- [ ] Nothing on this page renders a **plan type**, an **accommodation**, **medical text** or
      **behavior-plan text**, in presentation mode or out of it. The only `supports`-derived thing
      that reaches it is the review **count** — `1 review coming up`, with no name, no date and no
      kind — so a `Ctrl+P` taken here emits none of the four either. *(Reworded from "nothing on the
      page displays `supports` data" on 2026-08-19, WO-1.25. The old line was mechanically checkable
      and this one is not; naming the four fields is what keeps it testable, and the count above is
      the thing the old wording would have forbidden.)*
- [ ] A grades-due event appears under Deadlines closing in on every day inside its lead time, and
      taps through to the event.
- [ ] The page adds no view: `src/views.js`'s `VIEWS` is unchanged, `DEFAULT_VIEW` still reads `home`,
      and a reload still lands here.
- [ ] 👤 The page loads in under a second on an iPad with a full year of data.

**Traps** — Every section here is a summary of something built earlier. If any of it recomputes
grades, attendance percentages, or signals rather than calling WO-2.4 / WO-3.4 / WO-4.1, you have
created a second answer that will eventually disagree with the first.
