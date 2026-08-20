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

**Ship** — · **Status** ✅ DONE — 2026-08-19 · **Size** M · **Depends on** WO-2.3 · **Owes** WO-6.4
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
- [x] Every kind this panel authors — the six general kinds `early-release | grades-due |
      conference | meeting | trip | reminder` — can be created, edited, and deleted, with and without
      a range.
      *(**Re-cut from "every event kind" on 2026-08-19, the owner's call**, after the verifier failed
      this work order on the line as written. The line was internally inconsistent with its own work
      order: it demanded an edit path the Deliverables forbid building. `no-school` and `dropped` are
      authored on the days-off screen, which the Deliverables protect by name, and `commit()` in
      `src/days-off.js` stays the one writer of a day off — so an edit for those two would have to
      route back through `openConfirm()`, a second dialog flow on a surface this work order was told
      to leave alone. **They keep create and delete, exactly as WO-2.3 shipped them, and no follow-up
      work order is booked for the missing edit: that is the design, not a gap**, and the last
      acceptance line below is where it is stated. What this line measures is unchanged — twelve
      entries across the six kinds in `verify-shell.mjs`'s WO-6.1 block, one edited in place and all
      twelve deleted; only the claim was narrowed to what the work order actually asked to be built.
      The narrowing is recorded rather than silent because a line rewritten to match what shipped is
      the one edit that can turn a verifier into a rubber stamp.)*
- [x] A weekly recurrence produces N independent entries; moving one moves only that one.
- [x] Deleting a materialized series is possible without deleting each instance by hand.
- [x] The four rules refuse from the model rather than from a form: a `dropped` event naming no class,
      an end date before its start, and an unparseable date are each refused when built through
      `src/calendar.js` directly, with no screen module in the call stack.
      *(The fourth — a range covering recorded meetings — is `clashingMeetings()` in `src/calendar.js`,
      which is the rule; the ledger read stays with the caller, because `src/attendance.js` imports
      the model and a model importing it back closes the loop this repo has refused six times.)*
- [x] `docs/data-model.md` § Events names the lead-time field and the series identifier, and the
      record it documents is field-for-field the record `newEvent()` writes.
      *(Asserted twice: `verify-shell.mjs` reads the object the running app builds, and
      `wo-sweep.mjs` § 16 reconciles the § Events table against the object literal in
      `src/calendar.js`. Neither alone catches a field renamed in both the code and the harness.)*
- [ ] A grades-due event warns at its configured lead time.
      → WO-6.4 "A grades-due event appears under Deadlines closing in on every day inside its lead
      time, and taps through to the event"
- [x] `no-school` and `dropped` behave exactly as WO-2.3 established — no regression: they are
      created and deleted on the days-off screen, through `commit()` in `src/days-off.js`, and there
      is no edit path for them anywhere in the app. **That is the establishment, and this is the line
      that states it** — the general events panel refuses both kinds by construction, so a day off
      has exactly one door and the first acceptance line above is scoped to the other six kinds
      rather than reaching through this one.
      *(The whole WO-2.3 block in `verify-shell.mjs` is green on the delivered tree. One EXPECTED
      value in it changed and nothing about the behaviour did: `madeEvent.keys` read the eight-field
      record and the record is nine fields now, because this work order added `seriesId` to it — a
      day off written on the days-off panel carries the empty label it will never use, exactly as it
      has always carried `studentId` and `notes`. That assertion is made from the days-off panel on
      purpose, so a build where only the new surface wrote the full record would go red.)*

---

## WO-6.2 — Derived events

**Ship** — · **Status** ✅ DONE — 2026-08-19 · **Size** S · **Depends on** WO-6.1, WO-3.3
**Closes roadmap** Phase 6 → "Derived events computed at render from assignments, terms, and the
schedule — not stored." *(the fragment elided the middle of the box until 2026-08-08, WO-2.15. An
ellipsis inside a fragment matches nothing: `norm()` strips it rather than wildcarding it, so a
fragment may stop early but may never skip a middle. A second fragment — the `IEP/504 review dates`
box — arrived here from WO-6.1 on 2026-08-19, WO-1.25, and went on to WO-6.3 the same day, the
owner's call: a `reviewDate` is read at render out of a student record and is never an `events[]`
entry, which is why the DELIVERABLE is a row in the table below rather than a kind above — but the
box says **surfaced**, and what a teacher sees is drawn by WO-6.3. The model is built and measured
here; the box is ticked where the screen appears.)*

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
- [x] Changing an assignment's due date moves it on the calendar with no other action.
      *(Closed at WO-6.3 on 2026-08-19 and ticked back here, because a re-homed line that lands and
      is never ticked at its origin leaves the tracker claiming an open box forever.)*
- [x] `events[]` contains no derived entry, checked deterministically rather than by feel: seed a
      month holding an assignment due date, a term boundary, a recorded meeting, a planned drop and a
      review date; render it, page one month forward and one back, and re-read `doc.events` — it holds
      the same entries, by `id`, that were authored before the render.
      *(**One substitution, stated rather than smoothed over:** there is no month grid on this tree
      to render — it is WO-6.3's — so what is paged in `verify-shell.mjs`'s WO-6.2 block is the
      MODEL: `derivedItemsIn()` for the month, the month after, the month before, and the month
      again, which is the sequence a Next/Back pair puts through it. The seed is the five the line
      names, `doc.events` is re-read by `id` and in order, and the re-read is repeated **across a
      reload**, so a copy that never left memory is caught too. `wo-sweep.mjs` § 17 makes the other
      half of the claim structurally — no store call and no document mutation anywhere in
      `src/calendar-derived.js` — because the harness proves what today's paths wrote on today's
      fixture and the grep proves there is nothing in the file that could write on any input.)*
- [x] Tapping a derived due date opens the assignment, not an event editor.
      *(Closed at WO-6.3 on 2026-08-19 and ticked back here. Measured as the stronger claim the
      wording implies: the tap opens that class's assignment LIST with that assignment's own editor
      up, carrying its id — so a build that opened some editor, or the events panel, fails.)*
- [x] A review date reaches the calendar as a date and a student and nothing else — no plan type, no
      accommodation, no medical or behavior-plan text — and is gone entirely in presentation mode.
      *(Closed at WO-6.3 on 2026-08-19 and ticked back here, the last of the three re-homed lines to
      go green. It was held open on purpose after the other two: the data half was measured desk-side
      — the chip reads `Review · <name>` and a search of the grid's text **and markup** for the five
      neighbours seeded on that record finds none of them — but the suppression and the palette are a
      reading, and the note here said it ticks when WO-6.3's own 👤 line does. That reading happened
      the same day and was green, so it does. With this box the `**Owes**` field comes off.)*
- [x] A future weekday shows **no per-class meeting state at all**: the derived answers are read from
      `attendance[]` and from authored `no-school` / `dropped` events, so a weekday with neither is
      blank rather than *not taken yet*, and nothing in this work order stores, derives, caches or
      infers which classes were expected to meet.
      *(Kept out **structurally** rather than by a filter: `meetingStatesIn()` asks about a
      `{ classId, date }` pair only where an attendance record exists for it or an authored
      exception NAMES that class on that date, so there is no loop in the module that a schedule
      could be the missing input to. `NOT_TAKEN` is discarded on the way out as well, belt and
      braces, and the guard never fires. Measured in `verify-shell.mjs`: the bare Wednesday between
      the two written-down dates yields nothing for any class, the only two dates that answer are
      the recorded meeting and the planned drop, and the string `not-taken` appears nowhere in a
      window a year wide. **One ruling this line did not settle and the implementation had to:** a
      school-wide `no-school` names no class, so it produces no per-class row either — the event is
      authored and the calendar draws it in its own right, and expanding it would be this module
      deciding what a shut school implies about five classes. `stateOf()` is untouched and still
      answers `covered` there, which is asserted beside it.)*

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

**Where it landed, and the two roadmap boxes that stay open** *(2026-08-19, on delivery)*. The read
side is `src/calendar-derived.js` — a third calendar module rather than more of `src/calendar.js`,
because it reads the ledger through `src/attendance.js`, which imports `src/calendar.js`, and the
derived half living in the model would close the import loop this repo has refused six times. It
exports one function per row of the table above plus `derivedItemsIn()`, and no writer.

**The implementer left both `Closes roadmap` boxes `- [ ]`; the owner split them on 2026-08-19.**
The departure from WO-6.1's precedent is written down rather than left to look like an omission.
*Derived events computed at render — not stored* is a claim about the MECHANISM, and the mechanism is
what landed here, so this work order ticks it. *IEP/504 review dates **surfaced** ahead of time* is a
claim about what a teacher SEES, and on this tree nothing draws it: the acceptance lines that would
show it — 1, 3 and 4 — are the three re-homed to WO-6.3 under this work order's `**Owes**`. So the
fragment moved with them, off this work order's `Closes roadmap` line and onto WO-6.3's. **The scar:**
a box that describes a surface is ticked where the surface is drawn, or the dashboard carries the
claim for however long the next work order takes. The model behind it is delivered and measured
here.

---

## WO-6.3 — Month & week views

**Ship** — · **Status** ✅ DONE — 2026-08-19 · **Size** M · **Depends on** WO-6.2
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
- [x] 👤 A month with a break, two pre-drops, six assignments, and a grades-due deadline renders
      legibly on an iPad without horizontal scrolling.
      *(The desk half is measured and green: at 390x844 the document and the grid both report a
      scrollWidth equal to their clientWidth over 35 cells, which is what `table-layout: fixed`
      buys. **Legibly** is the half that needs the device — seven columns of a 100px cell is a
      judgement about reading, not about overflow.)*
      *(**Read on the device and green, 2026-08-19, the owner's own reading** — a busy month in both
      portrait and landscape, after a force-quit onto v87. The overflow half was never the risk; the
      seven-column cell reads.)*
- [x] The class filter applies to derived items as well as authored ones.
      *(Three readings of one month in `verify-shell.mjs`: everything, then one class, then the
      other. Filtered to the fixture class the due date, both term edges and both meeting states
      are on their days; filtered to the other class none of them is; and the school-wide closure
      and grades-due date, which name no class, survive both — which is `docs/data-model.md`'s own
      rule about `classIds: []` asserted rather than assumed. **One ruling the line did not settle
      and the implementation had to:** a review date belongs to a student and carries no `classId`,
      so it follows its student — shown for a class that student is on the roster of and not for
      one they are not. `src/calendar-derived.js` declined to answer that on the screen's behalf, in
      as many words, and the decision is written up in `docs/data-model.md` § Events.)*
- [x] A month with nothing in it shows an honest empty state.
      *(Paged four months past the fixture through the real pager. The grid STAYS UP with its 35
      cells drawn — a teacher who opened a calendar wants the dates whether or not anything is on
      them — and `shell.css`'s `.empty-state` appears under it naming the month and carrying the
      two doors that put something in it. Asserted in both directions, because "the empty state is
      always up" satisfies half of it.)*
- [x] Every item taps through to its source.
      *(Six kinds, six destinations, all six clicked in `verify-shell.mjs`: a closure opens the
      days-off panel, a grades-due date opens the events panel **with that row loaded into its
      form**, a term edge opens that class's term editor, a review opens that student's own editor
      with the support panel already showing and the date in it, an assignment's due date opens that
      class's assignment list with that assignment's editor up, and a class's recorded day opens
      that class's registry. **One thing it does not do, stated rather than left to be found:** a
      taken or dropped day opens the registry on TODAY rather than anchored on the day tapped.
      `src/attendance.js`'s `editDay()` unlocks a column inside the strip that screen is already
      showing and there is no entry point that anchors it from outside — that is a follow-up with
      an owner rather than something to improvise from the calendar.)*
- [x] A derived due date moves with its assignment: change the date on the assignment and the month
      grid shows it on the new day, with no other action.
      *(**With no other action** is asserted as no action: the date is changed on the assignment and
      the harness then leaves the calendar and opens it again the way a teacher would — no repaint
      is called from the check, because one that called `renderCalendar()` itself would be proving
      the renderer runs rather than that the month is recomputed from `assignments[].due` every time
      it is drawn. Both directions, so a build that moved the chip and lost it fails too, and the
      chip count is unchanged across all three readings.)*
- [x] 👤 A review date on a month cell shows a date and a name and no plan type, and in presentation
      mode the cell shows nothing at all where it was — read on the device, across a room, because a
      palette and a suppression are judgements a headless browser cannot make however green it
      measures (the WO-2.3 precedent).
      *(The DATA half is measured and green, and it is the half a headless browser can make: the
      chip reads `Review · <name>`, labelled with the date, and a search of the whole grid's text
      **and its markup** for the five things that share a student record with `reviewDate` — seeded
      with phrases nothing else in this repository contains — finds none of them. With presentation
      mode on there is no element, the token `review-date` is nowhere in the grid's markup, and
      neither the surname nor the date is either, while every other chip is untouched. What is owed
      is the reading: the chip takes `.supports-panel`'s subdued card — lifted with its argument,
      that amber means *act on this* and red means *this destroys something* and a 504 review is
      neither — and whether that reads at a distance beside the term chip is the owner's call.)*
      *(**Read on the device and green, 2026-08-19.** The chip reads across a room and is distinct
      from the term-edge chip beside it, and with presentation mode back on the cell shows nothing
      where it was. Note for whoever reads this box next: presentation mode is ON unless this browser
      turned it off, so a fresh profile shows no chip for the right reason — the reading has to start
      by turning it off, or it is a reading of an absence.)*
- [x] 👤 Every control this screen adds clears 44px under `@media (pointer: coarse)`, checked under a
      thumb rather than in a stylesheet — and if a month cell holding four chips cannot hold that
      floor and still fit a month on one screen, the departure is the owner's to make and is written
      down at the point of departure, the way `src/home.css` does for `.class-card-state`.
      *(**The departure was needed and is taken, and it is the owner's to keep or refuse.** Seven
      columns of an iPad in portrait is ~100px of cell; four chips at 44px plus the date line is a
      ~200px cell, and six rows of that is a month you scroll through twice — which is a month that
      has stopped being one. So `src/calendar-view.css` floors a MONTH chip at 28px, writes the
      arithmetic out at the point of departure, and pays for it with the WEEK view, whose chips take
      the full 44 — the month is the survey, the week is the surface you touch, and every item has
      a thumb-sized path through the pair. Measured under a really coarse pointer: every non-chip
      control (the span pair, the pager, the class filter, Print, the way back) clears 44 in both
      directions over 25 controls; every week chip clears 44; every month chip sits at its floor and
      **below** 44, asserted AS a departure so that a silent drift down and a silent "fix" up both
      go red. `#calendarView` is enumerated in the whole-app touch sweep's `VIEW_PLAN` with a
      `byHand` note saying so. **None of that closes this line** — it needs a thumb.)*
      *(**Read under a thumb and green, 2026-08-19: the 28px month chip is ruled IN by the owner.**
      Read knowing what the verifier named — the `src/home.css` precedent this line points at is
      weaker than it looks. `.class-card-state` departs for *a line of text*, and says so; the target
      it used to be is the whole card. A month chip is a `<button>` a teacher taps, so **this is the
      first sub-44px control in the app**, not another instance of the same thing. It is kept on the
      week view paying for it, which is the argument in the note above. One honest limit on that
      payment: the harness measured the week's chips on the single fixture week it landed in — 2 chips
      — so the thumb-sized-path half of the trade is machine-verified for 2 of the 6 item kinds and
      argued for the rest.)*
- [x] No printout of a calendar month emits a review date, a plan type, or any other `supports`
      value, whatever presentation mode says — and `data-calendar-print` appears nowhere in
      `src/shell.js`'s delegated `closest('[data-…]')` census, which is what keeps the gate from
      being a click hook.
      *(Both halves, in both tools. Under `Emulation.setEmulatedMedia: 'print'` the review chip
      computes to `display: none` while the due-date chip beside it is still drawn, the sheet keeps
      its own stamp and loses its toolbar — and it computes to `none` with the gate OFF as well,
      which is the one deliberately ungated rule in that stylesheet: it can only ever subtract, and
      rounding an unanswerable question toward hiding is `src/supports.js`'s own rule for exactly
      this data. The census half is `wo-sweep.mjs` § 18, written for this line and made GENERAL
      rather than about this gate: every attribute handed to `registerPrintGate()` anywhere in
      `src/` is diffed against every `data-*` inside a `closest()` in `src/shell.js`, and each gate
      is reconciled with the `@media print` block selected under it in both directions. Planted
      against on the delivered tree — renaming the control to the gate's own string reddens it and
      names the file and line.)*

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

**The page is drawn, and the drawing was here before the pointer was** *(2026-08-20)*.
[`design/mockups/glance.html`](../../design/mockups/glance.html) has drawn this page twice — a Tuesday
with things on it, and the quiet day that is what the owner will actually see for the term's first six
weeks — since 2026-08-19, and nothing in this work order said so until now. **Read it before
building**, and lift `design/mockups/proposed-phase6.css` § GLANCE rather than re-deriving it: that
section is written to become `src/glance.css` almost as-is, and it links `src/home.css` directly so a
drawing cannot quietly disagree with the card slot it fills.

**This pointer is late by one work order, and the cost is already recorded.** § CALENDAR was drawn the
same morning and WO-6.3 built the calendar without a line pointing at it: twenty-eight `.cal-*`
classes proposed, twenty `.calendar-*` shipped, not one name carried across. Re-derived rather than
lifted, and nothing noticed until `tools/wo-sweep.mjs` § 19 was written a day later.
`design/mockups/PROTOCOL.md` rule 9 is that scar made a rule — a room is not finished until the phase
file points at it — and § 19 now fails a build whose drawing names an unbuilt work order that does not
point back.

**What the drawing settles for this page, and the one thing it asks.** Five panels stacked in `.main`,
each a `.panel` with its own header and destination; concern and praise at `1fr 1fr` with **praise
first** below the phone breakpoint; the chip in `.class-card-signals` **reports and does not act**,
because `classCard()` has been a single `<button>` since WO-1.13 and a control cannot nest inside one;
and a quiet day is **one** panel with its warrant on it — four chips saying what was checked — rather
than five empty ones. The open one is the amber note in the drawing: *the card says how many and the
panels below say who* is a defensible reading of this work order's "every item taps through", and it
is not the only one. **The owner's call, and it is cheaper before the build than after.**

**Deliverables** — in the order a teacher needs it at 7:40am:
1. **Every class with today's state — taken · dropped · not yet** — each with a one-tap fix.
2. Today's and this week's events.
3. What's waiting to be graded. **The per-class half of this is WO-3.26's**, which fills
   `.class-card-signals` in Ship 2; this work order is the page-level panel over the same engine call,
   and depends on it rather than assuming it.
4. Who needs attention — concern and praise, post-cooldown, from WO-4.5. **The panel is a
   summary and the list it summarises is WO-4.2's screen**, so every row here taps through to that
   screen rather than expanding in place. Ranked the way WO-4.2 ranks: **attendance first, then the
   biggest change** — the owner's severity ruling of 2026-08-20, which this page inherits rather than
   re-decides. And **`The quiet middle · N` is a door onto that screen**, landing on it scrolled to
   its quiet-middle panel — the owner ruled on 2026-08-20 that the quiet middle is a panel there and
   not a surface of its own, so this control opens a place that already exists. One list, one place,
   two ways in.
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

---

## WO-6.5 — A tapped day opens on that day

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-6.3

Tapping a class's recorded day in the calendar opens that class's register — **on today**, not on the
day that was tapped. Every other item on that screen carries its own subject through the tap: a
grades-due date arrives with its row loaded, a due date with its assignment's editor up, a review with
that student open and the date in the field. This one arrives at the right screen and the wrong day.

**This was read on the device and accepted rather than found later** (2026-08-19, the owner, WO-6.3's
fourth 👤 reading). It is booked because the alternative was leaving it in a dispatch result file and
a code comment at `src/shell.js`, and **a dispatch artifact is not a tracker** — WO-6.3's verifier
said so in as many words, and the artifact is gone from anyone's attention the moment the dispatch is.

**Why it was not simply fixed inside WO-6.3.** `src/attendance.js`'s `editDay()` has no entry point
that takes a date from outside — it reads the day it is on. Giving it one is a change to the
attendance surface, which WO-6.3 had no business making on the way past while it was drawing a
calendar: the register is the screen five classes are marked on every morning, and the flow is on the
critical path by the working agreements. That is a row of its own, not a rider.

**Acceptance**
- [ ] Tapping a recorded day in the calendar opens that class's register **on the tapped day**, with
      that day's marks on screen — not on today, and not on the term's first day.
- [ ] The date arrives through an argument, not through a module-level variable or a `data-` attribute
      read back off the DOM: `editDay()` (or whatever entry point is added beside it) takes the day it
      is to open on, so two callers cannot disagree about which day is current.
- [ ] Opening the register the way it has always been opened — from the class screen, with no date —
      still lands on **today**. The new argument is additive and the old path does not go through a
      date that happens to be right most of the time.
- [ ] A tapped day that is outside the class's current term still opens correctly, or is refused with
      a message that says which term it is in. Silently landing on some other day is the failure this
      row exists to remove.
- [ ] No new state: nothing about *which day the register is on* is stored in the document, in
      `localStorage`, or on `window`. It is an argument and then it is the screen's own business.
- [ ] `verify-shell.mjs` asserts the tapped day and the tapped day's marks, not just that the register
      opened — the check WO-6.3's could not make, which is why its own line passed on *the source* and
      this row exists for *the day*.

**Traps** — The tempting shortcut is to have the calendar write the date somewhere the register reads
on the way up. That is the second truth this phase has refused six times over, at one-value scale: two
places that both believe they know what day the register is on, and the bug is whichever one is read
second. Pass it, or do not build it.

Also resist making the register *navigate* to the day with the term nav after it opens. WO-2.17 is the
scar there — a repaint of the screen you are sitting on is not the same as opening on a day, and a
flash through today on the way is a worse experience than landing on today would have been.

---

## WO-6.6 — The calendar's doors: in from every class screen, out of it to any of them

**Ship** — · **Status** ✅ DONE — 2026-08-20 · **Size** M · **Depends on** WO-6.3

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

- [x] On the calendar the header's bottom strip carries the **All classes** door and one tab per active
      class, exactly as it does on Attendance, Assignments and Scores — and the `Calendar` caption is
      gone from `src/classes.js` along with the lookup that held it.
- [x] The switcher inside `#calendarView` shows four segments with **Calendar** current, and the same
      strip on the other three screens shows Calendar as a live segment that reaches it.
- [x] Tapping **Calendar** from inside a class opens the month on **today**, filtered to **that
      class**, with that class's meeting ledger drawn — the per-class state the month suppresses when
      every class is showing.
- [x] The home screen's **Calendar** button still opens on every class showing, and the hint under the
      grid explaining why no per-class day is drawn still appears there and not on the filtered arrival.
- [x] Tapping another class's header tab while the calendar is up leaves the calendar up, moves the
      filter to that class, and redraws. It does **not** land on Attendance.
- [x] Tapping **All classes** in the toolbar filter shows every class while the header tab of the class
      you are in stays current. Two controls, two answers, neither one lying.
- [x] `openClassId` is written by exactly one function on any path a teacher can reach twice —
      `selectClass()` — and `grep` proves the rest: no `setPref('openClassId'` appears anywhere in
      `src/` outside `src/classes.js`. The only other writer, `createClassFromForm()`, fires once on a
      teacher's first class and never again. No second writer for the calendar, no import loop.
- [x] Reloading while the calendar is up lands on **Attendance** for the open class — `REMEMBERED_AS`
      holds `calendar: 'class'`, and `planbook_openView` never contains `calendar`.
- [x] Days off and Events open from the calendar's own panel header, and an event authored there
      appears on the grid behind the panel when it closes, with no reload and no second tap.
- [x] The attendance actions row carries **no** Days off button on any state of any day, and the 📅 in
      a covered column's head still opens the panel with that day's exception in it.
- [x] The home screen's title row carries **Calendar** and nothing else beside it.
- [x] `node tools/verify-shell.mjs` is green, and the two coarse-pointer 44px blocks for the days-off
      and events panels **ran** — they are guarded by a `has()` on the home screen's own hooks, so a
      re-route that misses them leaves a green run with two fewer checks in it.
- [x] The `check()` count in `tools/README.md` matches the run, and `node tools/wo-sweep.mjs` is green.
- [x] 👤 On the iPad in portrait, the four-segment switcher fits its panel without the page scrolling
      sideways, and every segment is thumb-sized. The strip is `overflow-x: auto`, so a fourth pill
      that does not fit **scrolls silently** rather than overflowing — measure the strip, not the page.
- [x] 👤 The calendar's panel header at 390px carries four buttons — Days off · Events · Print · All
      classes — on however many rows it needs, with none of them clipped and no horizontal page scroll.
- [x] 👤 Walking Attendance → Calendar → another class's tab → Attendance never passes through a screen
      that looks like the wrong class's, and the class you land in is the one whose tab you tapped.

***This criterion was re-worded before it was ticked, and the wording is the whole record**
(amended 2026-08-20, the owner's ruling; found 2026-08-19, the implementer). It read* **"written in
exactly one function after this work order"** *— and a grep contradicted it on the day it was written.*
`selectClass()` *writes it at* `src/classes.js:650`*;* `createClassFromForm()` *writes it too, at*
`src/classes.js:975`*, guarded by* `activeClasses(getDoc()).length === 1`*, so that a teacher's FIRST
class becomes the open one instead of a header saying nothing is selected. That writer predates this
work order by a fortnight — commit 33bab80, 2026-08-04 — so the line was false before the dispatch
opened, and WO-6.6 added neither writer.*

*The **ruling: create stays separate from select**, and the criterion now says what the trap actually
protects — one writer on any path a teacher can reach twice. The two cannot disagree: by the time a
teacher is tapping header tabs there is more than one class and the guarded line is dead code. The
alternative — routing the first-class write through* `selectClass()` *— was refused because it runs
before there is a class screen to select into and would change what a brand-new teacher sees on her
very first tap; that is its own work order, not a squeeze into this one.*

*Two narrowings in the new wording are deliberate.* **"on any path a teacher can reach twice"** *is the
clause doing the work — an unconditional second writer is still forbidden. And* **"anywhere in** `src/`**"**
*replaces a flat "anywhere", because* `tools/verify-shell.mjs:4165` *holds a read-back-write of that
literal inside a CDP eval string — harness scaffolding, unchanged from HEAD, and not a writer of the
preference. The original phrase was one word wider than the tree.*

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
