# Phase 2 work orders — Attendance

**Phase goal:** the owner stops opening Roll Call!.

Branch: `phase/2-attendance`. **Read [`../rotating-schedule.md`](../rotating-schedule.md) before
starting anything in this phase.** It is a decision record, and it exists because the next session
will want to build a cycle model. There is no schedule object, no rotation, no meeting pattern: a
class met if it has an attendance record without an `exception`.

WO-2.1 through WO-2.4 are Ship 1 (day one). WO-2.5 through WO-2.7 are explicitly cut from Ship 1
and land in Ship 2.

---

## WO-2.1 — Attendance registry: students × recent days

**Ship** 1 · **Status** ✅ DONE — 2026-08-06 · **Size** L · 🚩 · **Depends on** WO-1.7, WO-1.10
**Closes roadmap** Phase 2 → "Marking screen, exceptions-only", "Marks `P / T / A / E / D`",
"One-tap drop", "Three distinct states per class per day", "Mark a **past** date"

**Why it exists.** This is the critical-path flow — it runs while students walk in, and it is the
one thing the owner does every single class period. It is also *the riskiest thing on day one*: a
live term of attendance in a three-week-old app.

**Read this before building.** A first pass at this work order shipped a one-class, one-day screen
with five explicit `P T A E D` buttons per student. It passed every acceptance line it had, and it
was **wrong for the owner** — she came from Roll Call!'s registry view, which shows six days of
columns at once, and going back to one day at a time is a step down from the app she is replacing.
The fault was in this work order, not the build: the original cut split Roll Call!'s single surface
across three work orders (today here, past dates in WO-2.2, history in WO-2.6), so the multi-day
view was partitioned away before anyone wrote a line of it. **WO-2.2 has been merged into this
work order** for that reason — see its tombstone below. The commit holding that first pass is
`11f0780`; its storage layer and predicate survive, its rendering does not.

**The reference is Roll Call!'s registry view** — `src/dashboard.html`, `#registryView`, and
`renderHead()` / `getWindowedDays()`. Read it before designing anything here.

**Deliverables**
- **The default surface is a table for one class: students are rows, recent dates are columns,**
  most recent first. `DEFAULT_DAY_COLS = 6` in Roll Call!; match it, and show fewer on a narrow
  viewport rather than scrolling sideways.
- **Which dates are columns:** the last N **weekdays**, Mon–Fri, by calendar. *Not* the dates this
  class has records for — a day you forgot has no record, and a hole you cannot see is a hole you
  cannot fill. This is a calendar fact, not a schedule model; nothing here predicts which classes
  meet. Re-read [`../rotating-schedule.md`](../rotating-schedule.md) if that feels like a loophole.
- **Tap a cell to cycle the mark.** Roll Call!'s cycle is `'' → P → A → T → E`. Ours is
  **`'' → A → T → E → D → ''`** — `P` is skipped because present is never stored, and `D` joins the
  cycle because Planbook has no hall-pass flow to log it from. That is a deliberate divergence from
  the owner's habit and the only one; name it in the UI, not just here.

  > **Amended 2026-08-06, under WO-1.13.** The owner reordered the two middle steps: the cycle
  > shipped as `'' → A → E → T → D → ''`, event before tardy, because the second-commonest mark in
  > her rooms is a student pulled out for an event rather than one arriving late. The line above is
  > left as written because it is the decision this work order was built from; this is what changed
  > after it. Nothing else about the cycle moved — `P` is still the never-stored wrap-around, and a
  > resting cell is still drawn as `P`. `src/attendance.js`'s `CYCLE`, the hint under the grid, the
  > harness's five-tap check and `TESTING.md`'s 👤 line all say the new order.
- **Every column header carries that class's state for that date** — taken · dropped · not taken
  yet — because in a grid an empty cell is ambiguous on its own (see Traps).
- **Per-column controls, as in Roll Call!:** today's column marks the class dropped in one tap; a
  past column takes a deliberate unlock before it accepts edits, and says so while unlocked.
- **Past dates are markable and land on that date**, with unmissable indication that you are not on
  today. Future dates are blocked or clearly flagged.
- **Finding the holes:** untaken columns are visually distinct at a glance, so "which day did I
  forget?" is answered by looking rather than remembering.
- Class-level **"Everyone's here"** (writes `{ classId, date, marks: {} }`) and **un-drop**, both
  without leaving the screen. "Everyone's here" is what replaces Roll Call!'s `'' → P` step.
- Search, filter-by-mark pills, and sort by first/last name, per Roll Call!'s `#registryView`.
- Storage exactly per [`../../docs/data-model.md`](../../docs/data-model.md): one record per class
  per date; `marks` holding only exceptions; `exception` present means the class did not meet.
- The home-screen card slot from WO-1.10 filled with today's state per class, each with a one-tap
  fix. The home screen stays the all-five-classes view; this screen is one class in depth.

**Reuse from `11f0780`, do not rewrite:** `stateOf()`, `setMark()`, `dropClass()`, `ensureRecord()`,
and the exceptions-only guard in [`../../src/attendance.js`](../../src/attendance.js) are model code
and are already verified by 260 harness checks. The rendering half is what changes.

**Out of scope** — percentages (WO-2.4), the keyboard path (WO-2.5), per-student history and
print/CSV output (WO-2.6). Calendar events still belong to WO-2.3; this screen will read them later.

**Acceptance**
- [x] A mark lands and survives a reload. *(One of the three things that must be right before
      students walk in.)*
- [x] **Six days of columns are visible at once for a class of 26 without sideways scrolling on an
      iPad**, in the orientation the owner actually holds it. 👤 **⚠ Qualified by WO-2.8 on
      2026-08-07, and no longer true in portrait.** The tick was earned on 2026-08-06 and stands for
      **landscape**, where six columns still draw. WO-2.8 put a 160px `Passes` column into the grid
      and `dayColumnCount()` now budgets for it, so an iPad in portrait draws **four** day columns —
      four at 768–820px, five on an 11″ Pro, six only on a 12.9″. The half of the line about
      *sideways scrolling* still holds in both orientations and is measured. **The tick is left
      standing rather than pulled** because the owner closed it on her own device and only she can
      re-close it: `TESTING.md` § WO-2.8 puts the trade to her as three options (four columns · five
      at a ~165px name cap · six at a ~95px one), and her answer is what settles this line. Until
      then, read it as *"six in landscape, four in portrait, nothing scrolls sideways."*
- [x] A dropped class and an untaken class are visually distinguishable without reading fine print,
      and are distinguishable in the stored document — **in the column header and in the cells
      under it.**
- [x] Marking a class taken with zero exceptions still creates a record — otherwise "taken with
      everyone present" is indistinguishable from "forgot."
- [x] One tap drops a class; one tap undoes it.
- [x] Taking attendance for a class of 25 with two absences takes under 15 seconds on an iPad. 👤
      *(Needs a real iPad and a stopwatch.)*
- [x] **Attendance can be recorded for a date two weeks back and it lands on that date** — reached
      from this screen, without a separate view.
- [x] **The "not today" indication is visible in a glance, on an iPad, in a classroom.** 👤
- [x] **Future dates are either blocked or clearly flagged** — marking Friday's attendance on
      Wednesday is a mistake, not a feature.
- [x] **A hole deliberately left three days earlier is findable by looking at the grid**, without
      remembering which day it was.
- [x] All five marks are reachable from a cell without opening a submenu or leaving the row.
- [x] The document after a full day of five classes contains no `P` entries.

*Nine of twelve closed on the desk pass of 2026-08-06 — `verify-shell.mjs` 274 of 274, `wo-sweep.mjs`
10 passed / 0 failed / 1 standing review — with four mutation proofs behind the absence claims. The
status line above stays 🔨 IN PROGRESS on purpose: the three 👤 lines need the owner's own iPad, and
`TESTING.md` § WO-2.1 (the grid) lists the sitting they are owed.*

**Traps** — Storing `P` for present will pass every test here and quietly triple the document. The
absence of a mark *is* the mark. Do not add a "submit"/"finalize" step: a mark is saved when tapped,
because the teacher will be interrupted mid-class. And **the grid creates a new way to be
ambiguous** that the one-day screen did not have: an empty cell means "present" on a date the class
was taken, and "no data at all" on a date it wasn't. Those must not look alike, or the teacher will
read a forgotten day as a day everyone showed up.

---

### ~~WO-2.2 — Marking a past date~~ · merged into WO-2.1 on 2026-08-06

**This is a tombstone, not a work order.** It is deliberately demoted out of `##` so
`tools/wo-gate.mjs` no longer parses it; there is nothing here to start, and the ID is retired
rather than reused.

WO-2.2 asked for a date control, a not-today indication, past dates in the same three states, and a
list of recent dates with untaken classes. **Every one of those is now a WO-2.1 deliverable**, and
they are there because separating them was the mistake. Roll Call!'s registry view answers "what
did I forget?" by *showing six days at once* — the question never needs a date picker, a separate
view, or a list, because the hole is a blank column you can see. Cutting that surface into
"today" and "past dates" produced a WO-2.1 that shipped a one-day screen and satisfied its own
acceptance criteria while being worse than the app it replaces.

**Do not re-split this.** If a future session finds WO-2.1 large and looks for a seam, the seam
between today and yesterday is the one place there isn't one.

*(The `Ship 1` table in [`README.md`](README.md) and the route in [`ROUTING.md`](ROUTING.md) were
renumbered to match. `CHANGELOG.md` carries the entry. Historical mentions of WO-2.2 in
`CHANGELOG.md` and `plans/dispatch-retro.md` describe events that happened and are left alone.)*

---

## WO-2.3 — Days off & pre-drops

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-2.1
**Closes roadmap** Phase 2 → "Days off and pre-drops, set ahead."

**Why it exists.** Two things are known in advance and shouldn't wait for the day to load: holidays
(the whole school is out) and pre-drops (an assembly is shifting Thursday's rotation). Both are
authored as calendar **events** and **read** by attendance — never copied into attendance records.
Delete the holiday and every class follows automatically.

**Reference:** [`../rotating-schedule.md`](../rotating-schedule.md) § Setting exceptions ahead of
time, and its precedence rules. Follow them exactly.

**Deliverables**
- A minimal date-picker UI: mark a date or range school-wide `no-school`, or mark named classes
  `dropped` on a future date.
- Stored as `events[]` entries of kind `no-school` / `dropped` per the data model. Empty `classIds`
  means school-wide.
- The marking screen reads these at render: a covered class shows as not-meeting, with the reason.
- **Precedence:** a class met if it has an attendance record with no exception. Otherwise it did
  not meet, whether from its own record or from a covering event.
- **The one rule protecting history:** a day with attendance actually recorded stays a meeting even
  if a calendar exception is added over it later. Warn, and leave the record alone.

**Out of scope** — the month view over this data (WO-6.3), other event kinds (WO-6.1).

**Acceptance**
- [ ] A `no-school` range across a week shows every class as not-meeting on every date in it.
- [ ] Deleting that event restores all those days to "not taken yet" with no attendance records
      having been touched.
- [ ] A future `dropped` event naming two classes affects only those two.
- [ ] Adding a retroactive snow day over a date that already has recorded attendance **warns and
      does not void the record**. Verify the marks are still there afterward.
- [ ] No attendance record is ever created by authoring an event. Inspect the document to confirm.

**Traps** — Copying the event into attendance records is the obvious implementation and it is the
one thing this design exists to prevent. It creates a second source of truth, and the one the
teacher isn't looking at is the wrong one.

---

## WO-2.4 — Counts & attendance percentage

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-2.1, WO-2.3
**Closes roadmap** Phase 2 → "Per-student counts and attendance % over recorded meetings."

**Why it exists.** The owner reads both apps' numbers this year and **they have to agree**. That
makes the formula a compatibility requirement, not a design choice.

**Deliverables**
- A meeting predicate, used everywhere: an attendance record for that class with no `exception`.
  Never calendar days, never a formula over dates.
- Per-student counts of P / T / A / E / D, per term and per year.
- Percentage: **`(P + T + E + D) / (P + T + A + E + D)`**, matching Roll Call!. Excused absences and
  dismissals sit in the numerator, so an excused absence does not damage a student's rate.
- A meeting-count window helper (`last N meetings of this class`) exported for Phase 4's signals,
  since every signal window counts meetings rather than days.
- Counts visible per class and per student.

**Out of scope** — signals and thresholds (Phase 4), the history view (WO-2.6).

**Acceptance**
- [ ] Percentages match a hand count across a term of a randomly shifting rotation. *(One of the
      three things that must be right before students walk in — verify against a real class.)*
- [ ] Dropped days and `no-school` days are absent from both numerator and denominator.
- [ ] A student with one excused absence out of ten meetings shows 100%, not 90%.
- [ ] Untaken days do not appear in the denominator.
- [ ] A student with zero recorded meetings shows an honest empty state, not `NaN` or `0%`.
- [ ] Cross-checked against Roll Call!'s number for the same class and date range.

**Traps** — Denominators built from calendar dates will look right in September and diverge by
November. The denominator is *recorded meetings of that class*, per class, always.

---

## WO-2.5 — Keyboard & touch pass

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-2.1
**Closes roadmap** Phase 2 → "Keyboard path on desktop and 44px touch targets. Both, not either."

**Why it exists.** Attendance is marked on the iPad while students arrive and reviewed on the laptop
afterward. The roadmap says both, not either, because building for one device is how the other one
becomes unusable.

**Deliverables**
- Desktop: row selection, `P`/`T`/`A`/`E`/`D` keys to mark, arrow keys to move, Escape to
  deselect. Shortcuts discoverable, not folklore.
- Touch: audit every control added in WO-2.1–2.4 against the `@media (pointer: coarse)` block.
- Screen-reader labels on the mark buttons — an icon-only `A` button needs `aria-label` and `title`.

**Acceptance**
- [ ] A full class can be marked from the keyboard without touching the mouse.
- [ ] No attendance control is under 44px on a coarse pointer.
- [ ] Keyboard focus is visible on every step and never lost after a mark.
- [ ] The shortcuts are documented somewhere in the UI, not only in this file.

---

## WO-2.6 — Attendance history & output

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-2.4
**Closes roadmap** Phase 2 → "Per-student attendance history view" and "Print/CSV output for the
attendance record."

**Why it exists.** Cut from Ship 1 because the data is being recorded either way and the views can
follow. It becomes urgent the first time a guardian conference asks "which days?"

**Deliverables**
- Per-student history: every recorded meeting, its mark, and the running percentage, per term.
- Print view and CSV export of the attendance record for a class and term.
- Presentation-mode safe: no `supports` data on either surface.

**Acceptance**
- [ ] A student's history lists exactly the meetings counted in their percentage — the two agree.
- [ ] The CSV opens cleanly in a spreadsheet with dates as columns.
- [ ] The print view fits a class on a page and carries the class, term, and date range.
- [ ] Neither surface emits accommodation, medical, or plan data.

---

## WO-2.7 — Roll Call! importer

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-1.7
**Closes roadmap** Phase 2 → "Roll Call! importer."

**Why it exists.** Cut from Ship 1 deliberately: August is a fresh year with fresh rosters, and they
get pasted. The importer is for *historical* data and can land any time before it's wanted. It is
an **import, not an integration** — nothing stays coupled afterward, and it costs zero permissions
because the teacher exports the file themselves and drops it on a file input.

**Reference:** [`../../docs/data-model.md`](../../docs/data-model.md) § Importing from Roll Call!,
and Roll Call!'s own `CLAUDE.md` for the exact sheet layout.

**Deliverables**
- File input accepting `.csv` / `.xlsx` exported from a Roll Call! class sheet.
- Reads the `Raw Input` roster: Full Name, Nickname, Student Email, Guardian 1/2 Name & Email,
  Counselor Name & Email, Graduation Year, Notes.
- Reads the term tabs: students from row 6, dates from row 5, marks from column L.
- **Preview before commit** — what will be added, what will be updated, what will be skipped.
- **Idempotent**: re-running must not double a roster or double attendance records.

**Out of scope** — reading anything from Drive. That would need the `spreadsheets` scope this whole
architecture exists to avoid. The teacher exports the file; the app never fetches it.

**Acceptance**
- [ ] Importing a real exported class sheet produces the right students with the right contacts.
- [ ] Imported attendance produces the same percentage Roll Call! reports for that class.
- [ ] Running the same import twice changes nothing the second time. Verify the document is
      unchanged, not just that the UI looks right.
- [ ] The preview accurately predicted what the commit did.
- [ ] No Google scope is requested at any point in this flow.

**Traps** — `.xlsx` parsing without a dependency is real work; if it threatens the phase, ship
`.csv` only and say so in `README.md`'s known limitations. Do not add a parsing library.

---

## WO-2.8 — Hall passes: issue, hold, return

**Ship** 1 · **Status** ✅ DONE — 2026-08-07 · **Size** M · 🚩 · **Depends on** WO-2.1, WO-1.13

*Built 2026-08-06; correction round 1 on 2026-08-07 date-gated the `D` coupling's reopen half and
qualified WO-2.1's six-column line, which this order made false in portrait. All seven acceptance
lines are verified — five at the desk, the two 👤 lines on the owner's own iPad on 2026-08-07.
**Two things came out of that sitting that are not defects in this order and are booked as their
own:** a misclicked pass can only be undone by Return, which writes a phantom trip into the
append-only log (**WO-2.11**, 🚩), and the portrait grid is down a day column (**WO-2.12**).
WO-2.1's acceptance line 2 stays qualified until WO-2.12 rewrites it — the owner's answer was
neither four nor six but "portrait should show today", which is a different line than the one
that was ticked.*
**Closes roadmap** Phase 2 → "Hall passes: bathroom, nurse, quick"

**Why it exists.** The owner issues hall passes every period in Roll Call! and found them missing
the first time she used Planbook's registry. This phase's goal is *"the owner stops opening Roll
Call!"* — and a Planbook without passes does not meet it, because she keeps the other app open for
this one thing.

**This feature was never in the roadmap.** It is not something a work order dropped; it was never
written down. The only two mentions anywhere in the repo — in
[`../../docs/data-model.md`](../../docs/data-model.md) § log and
[`phase-4-signals.md`](phase-4-signals.md) — cite Roll Call!'s pass log as a *precedent for
append-only storage*, not as a feature Planbook would have. Found on first use, 2026-08-06.

**The reference is Roll Call!'s pass flow** — `src/dashboard.html`: `startPass()` (~3328),
`timeBack()` (~3350), `passButtonsHTML()` (~5260), `_finalizeDismissedPass()` (~5126), and the
`col-passes` column in `renderHead()`. Read them before designing. Three types, in the owner's own
words: **Bathroom · Nurse · Quick** (Roll Call! labels them 🚽 Bath, 🏥 Nurse, ⚡ Quick).

**Deliverables**
- **A `Passes` column in the registry**, per Roll Call!'s `col-passes` at `min-width: 160px`. Three
  buttons per student while they are in the room; a single **Return** button while they are out.
  *(The attendance panel's 720px cap was lifted on 2026-08-06 partly for this — see
  `src/attendance.css`.)*
- **Issue a pass in one tap.** Records who, which type, and the time out.
- **Return in one tap.** Computes minutes out and appends one entry to the pass log.
- **A concurrent cap**, as Roll Call! has (`MAX_ACTIVE_PASSES = 3`), with the buttons disabled and
  the reason on screen rather than a dead control.
- **An open pass SURVIVES A RELOAD, A CRASH, AND A FORCE-QUIT.** See Traps — this is the one place
  this work order deliberately does *not* copy Roll Call!.
- **The pass log is append-only and keyed by student id**, per
  [`../../docs/data-model.md`](../../docs/data-model.md) § log. Never by name.
- **`D` and an open pass agree.** Marking a student dismissed while they are out closes the open
  pass rather than leaving one that never returns; undoing the `D` restores it. Roll Call!'s
  `_finalizeDismissedPass()` / `cancelDismiss()` pair is the model.

**Out of scope** — the elapsed-time banner, the overdue alerts, and the pass-history view, all of
which are WO-2.9. Pass data as a Phase 4 signal. Printing a physical pass.

**Acceptance**
- [x] Issuing a pass, force-quitting the app, and relaunching shows the student still out, with the
      original time out — not a cleared board. 👤 *(The reload half is measured: the record is read
      back out of IndexedDB after a `Page.reload` and the time out compared character for character.
      A force-quit of an installed PWA is not something a desk can do — run by hand on the owner's
      iPad, 2026-08-07.)*
- [x] Return writes one log entry with the right minutes, and the student's buttons come back.
- [x] The fourth concurrent pass is refused with a reason on screen, not by a dead button.
- [x] Marking a student `D` while they are out leaves no pass open, and undoing the `D` puts it back.
      *(Both halves are gated to today, and both are measured — a `D` edited on a later day neither
      reopens a finished pass nor retracts the dismissal from the log. The reopen half shipped
      ungated on 2026-08-06 and was fixed in correction round 1 on 2026-08-07; the harness fixture
      that could not express it was rebuilt in the same round.)*
- [x] The log is keyed by student id — verify in the document, not the UI. Renaming a student after
      the fact neither orphans nor re-attaches their passes.
- [x] Issuing and returning a pass creates no attendance record and changes no attendance mark. A
      student who went to the bathroom was present.
- [x] Every pass control clears 44px on a coarse pointer. 👤 *(Measured under an emulated coarse
      pointer with both shapes of the column on screen; the thumb test that is the actual line was
      run on the owner's iPad, 2026-08-07.)*

**Traps** — **Roll Call! keeps `activePasses` in memory only, and copying that here is the one
mistake this work order exists to prevent.** Over there the app runs a session on a machine that
stays awake; here it is an installed iPad PWA that iOS suspends and evicts, used by a teacher who is
interrupted every period. An in-memory pass means a force-quit loses track of a student who is
physically out of the room, and the app cannot say so because it no longer knows. That is a safety
property, not a convenience.

And **do not infer presence from a pass.** A student on a bathroom pass is present; the mark and the
pass are independent, and the `D` rule above is the only coupling between them.

---

## WO-2.9 — Pass banner, overdue alerts, and history

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-2.8

**Why it exists.** Cut from Ship 1 deliberately: WO-2.8 makes the daily flow work, and everything
here is what makes it comfortable. The data is recorded either way, so these views can follow
without losing any of it.

**Deliverables**
- **The active-pass banner**, per Roll Call!'s `renderActivePassBanner()` — a card per student out,
  with name, type, time out, and elapsed time.
- **Two escalating overdue alerts**, per Roll Call!'s configurable `alertOneMin` / `alertTwoMin`.
- **A pass history view**, per student and per class, reading the append-only log.
- Presentation-mode safe: a projected banner names students who left the room, so it obeys
  [`../../src/supports.js`](../../src/supports.js)'s answer like every other surface.

**Acceptance**
- [ ] Elapsed time is correct after the app has been backgrounded for ten minutes. 👤 *(See Traps.)*
- [ ] Both alerts fire once each, not repeatedly, and not again after the student returns.
- [ ] The history view's totals match the log; a hand count of one student's passes agrees.
- [ ] Presentation mode suppresses the banner's names.

**Traps** — **iOS suspends timers when Safari backgrounds a PWA.** An elapsed counter that ticks
will read "2 minutes" after twenty, and it will do it silently. Compute elapsed from the stored
timestamp on every render; never accumulate. Same class of bug as the eviction hazard in
`CLAUDE.md` — correct on a desktop, wrong on the device this ships to.

---

## WO-2.10 — Mark cells: unconfirmed, timed, and noted

**Ship** 1 · **Status** ✅ DONE — 2026-08-06 · **Size** L · 🚩 · **Depends on** WO-2.1
**Closes roadmap** Phase 2 → amends "Marking screen, exceptions-only", closes "`U` for unconfirmed"
and "Timestamps on tardies and dismissals" *(see below)*

**This work order reshapes what a `marks` cell IS.** It carries two changes that arrived separately
and must land together, because both rewrite every reader and writer of `marks` and doing them in
sequence would mean migrating live student data twice — the second time over a real term, weeks
after go-live. They are folded deliberately, on 2026-08-06, with that reason.

**Why it exists.** The owner used the registry and found the marking model backwards for how she
stands in a room. Two specific complaints, 2026-08-06:

1. A cell starts on `?`, and the first tap jumps to `A` — so confirming a student **present** costs
   four taps round the cycle. The first tap should mean *"I see you, you're here."*
2. Tapping one student takes the whole class, so every other cell flips from `?` to `P` at once.
   You cannot tell who you have actually looked at.

Underneath both: **an unmarked student should read as absent, not present.** If the teacher is
pulled out mid-period, the honest record is "I had not accounted for these students", and the safe
default for the ones she never reached is absent rather than a silent room full of `P`.

**The design, in the owner's own construction.** A new code **`U` — unconfirmed** is written for
every student when a class is first touched, and deleted as each student is confirmed. It is a
temporary mark that sorts itself out as the real record is taken.

| Stored | Means | Drawn as |
|---|---|---|
| *(no entry)* | present | `P` |
| `U` | unconfirmed — **counts as absent** | `?` |
| `A` `E` `T` `D` | as today | their letter |

**The second change: a mark cell becomes an object, and `T` and `D` carry the time.** Roll Call!
captures the moment a mark settles on tardy or dismissed — `preTardyLog[si] = {time, dateStr}`,
flushed as `{last, first, type, time}` with a note, and surfaced as a "Tardy & Dismissal History"
section on the student report. **Planbook records only that a student was tardy, never when.** That
was never specified: `plans/` mentions "tardy" nowhere outside WO-2.1's cycle line, so no work order
could have produced it and no check could have failed it. Found by the owner, 2026-08-06.

It matters past completeness. Twenty minutes late and two minutes late are different conversations
with a guardian, and Phase 5's templates want the difference. Dismissal time is closer to a safety
record — when the student actually left the room. Phase 4 ranks by pattern, which is much weaker if
every tardy looks identical.

```jsonc
"marks": {
  "s_1": { "code": "T", "at": "2026-09-09T08:14:00-04:00", "note": "missed the bus" },
  "s_2": { "code": "A" },
  "s_3": { "code": "U" }
}
```

**Every cell is an object, including `U` and the untimed codes.** This is not decoration — it is
[`../../docs/data-model.md`](../../docs/data-model.md)'s own rule, one datatype over: *"A score cell
is always an object, never a bare number. Polymorphic cells (`87` here, `{v:87}` there) are where
grade bugs live."* A `marks` cell that is `"A"` sometimes and `{code:"T",…}` other times is exactly
that mistake. `at` and `note` are simply absent where they do not apply.

- **`P` is still never stored.** The exceptions-only rule is not repealed, it is re-pointed: the
  document holds exceptions to *present* exactly as it does now, plus `U` for students not yet
  reached. Clearing a mark still means present.
- **At rest the document is unchanged.** A finished class holds only its real exceptions, because
  every `U` has been deleted on the way. The `U` entries exist only between starting a class and
  finishing it, and they shrink as the teacher works.
- **A class left half-taken keeps its `U`s**, which is the point: that is an accurate record of an
  unfinished class rather than a fabricated complete one.

**The cycle** is `P → A → E → T → D → P`. `U` is **not a step** — it is where a cell starts, and
once tapped a cell never returns to it. From `?` the first tap gives `P`.

**Deliverables**
- `U` added to the vocabulary in [`../../src/attendance.js`](../../src/attendance.js) and to
  [`../../docs/data-model.md`](../../docs/data-model.md), described as temporary.
- **Initialization on the first attendance button pressed**, and never on merely opening the screen
  — see Traps. Two entry points, and they differ deliberately:
  - **Tapping a single cell** creates the record, writes `U` for every student in the class, and
    moves that one student to `P`. **Every other cell still reads `?`.** Nothing else on the screen
    changes.
  - **"Everyone's here"** creates the record and resolves *all* students to present at once. This
    is the one control allowed to change every row, because that is what it says it does.
- The cycle reordered to `P → A → E → T → D`, entered at `P` from `?`.
- **`U` counts as absent** wherever attendance is counted. WO-2.4 must treat it as `A` in
  `(P+T+E+D)/(P+T+A+E+D)` — in the denominator, not the numerator.
- **The home card says how many are unconfirmed** when a class holds any `U`. A half-taken class
  must be loud, not silent — see Traps.
- **Every `marks` cell is an object**, uniformly, per the shape above. One migration, run once, over
  documents that today hold bare code strings — including restored backups written before this
  work order. A restore of an old backup must come out right, not half-converted.
- **`at` is captured at the moment a cell settles on `T` or `D`**, from the device clock, stored as
  a full ISO timestamp with offset. Cycling *past* `T` on the way to something else must not leave a
  stray time behind — Roll Call!'s `_trackTardyMark()` handles exactly this case and is worth
  reading before writing it.
- **A note is editable on any mark**, reachable without leaving the row. Roll Call! offers it on
  tardies and dismissals; here it costs nothing to allow on all of them.
- **The time is visible where the mark is** — a tardy cell shows its time, or reveals it on the row,
  without needing a report to be run.
- Un-confirm is reachable: a student cycled by mistake can be returned to `?`, or the class reset,
  without leaving the screen.

**Out of scope** — hall passes (WO-2.8), compact view, the name-column width. Whether `D` leaves the
cycle once WO-2.8 lands: that is WO-2.8's call, and this work order keeps `D` where the owner put it.

**Acceptance**
- [x] Tapping one student's cell moves that cell to `P` and **changes no other cell on the screen**.
      Verify by reading every other cell, not by looking at one.
- [x] "Everyone's here" resolves every student to `P` in one tap, and the document holds no `U`
      afterwards.
- [x] A class with 25 students, two of them absent, is **two entries** in the finished document —
      no `U`, no `P`. Storage at rest is unchanged from WO-2.1.
- [x] Tapping one cell, then reloading, still shows one `P` and twenty-four `?` — the unconfirmed
      state survives, which is the whole reason it is stored.
- [x] A class nobody has touched has **no record at all** and reads "not taken yet". It is not a
      class of 25 absences. *(The single most damaging way to get this wrong.)*
- [x] The home card names the number of unconfirmed students on a half-taken class.
- [x] The cycle from `?` reads `P → A → E → T → D` and returns to `P`, never to `?`.
- [x] A student added to the roster after a class was taken does not acquire a mark for it
      retroactively.
- [x] Marking a student tardy stores an `at` timestamp; the marking screen shows the time without
      running a report.
- [x] Cycling `P → A → E → T → D` past `T` and landing on `D` leaves **one** time — the dismissal's
      — and no orphaned tardy time. Verify in the document.
- [x] Cycling all the way back to `P` clears the entry entirely: no code, no `at`, no note left
      behind.
- [x] A note typed on a mark survives a reload and appears on the same student, date and class.
- [x] **Every cell in the document is an object.** Not one bare string anywhere, including `U`s and
      including untimed codes. Inspect the document, not the UI.
- [x] **Restoring a backup written before this work order produces object cells**, with the codes
      intact and no `at` invented for marks that never had one. *(WO-1.5's restore path is the one
      thing standing between a teacher and a lost term — this is the acceptance line that says the
      migration did not eat it.)*

**Traps** — **Opening the screen must still write nothing.** `src/attendance.js` says so and the
reason stands: if arriving on a class wrote 25 `U`s, "not taken yet" would be unreachable the moment
a teacher browsed, and the home screen's only question would stop having an answer. Initialization
is an act, not a visit.

**A class holding `U`s is a meeting, and every `U` in it is an absence.** That is correct and it is
also dangerous: one stray tap creates a meeting with 24 absences in it. This is why the home card
must announce unconfirmed counts — the failure mode is silent, looks like data, and is only
discovered when a percentage is wrong in November. Do not ship the `U` state without the surface
that makes it visible.

And **`U` is not a sixth attendance code to a teacher.** It never appears on a button, never appears
in a total, and never reaches a report. It is scaffolding that the finished record does not contain.

**The migration is the dangerous half of this work order, not the cell shape.** Every document in
existence holds bare strings, and so does every backup file already on the teacher's disk. A
migration that runs twice, runs halfway, or runs on read without being written back is how a term of
attendance turns into `{"code": {"code": "A"}}` or vanishes. Convert on load, write back once,
and make a restored pre-WO-2.10 backup an acceptance line rather than an assumption — it is one of
the three things `CLAUDE.md` says must be right before students walk in.

**Do not put the time anywhere but the cell.** A `log` entry mirroring each tardy would reuse
machinery that already exists and would immediately create two records of one event, which is the
second-source-of-truth pattern this project has refused four times. The cell is the record.

---

## WO-2.11 — Cancel a pass issued by mistake

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** S · 🚩 · **Depends on** WO-2.8
**Closes roadmap** Phase 2 → "Cancel a pass issued by mistake, writing nothing to the log"

**Why it exists.** WO-2.8 shipped three issue buttons side by side in a 160px column and no way
back out of any of them. Found by the owner on 2026-08-07, in the first iPad sitting with the
finished feature — the same way hall passes themselves were found.

**What a misclick costs today**, which is why this carries 🚩 rather than waiting for WO-2.9:
[`../../src/passes.js`](../../src/passes.js) exports `openPass`, `closePass` and `reopenPass` and
nothing else. The only exit from an open pass is **Return**, which appends a permanent entry to
`passes` — a phantom trip, `minutes: 0`, for a student who never left the room. `passes` is
append-only, and `reopenPass()` refuses anything whose `endedBy` is not `dismissed`, so the app
cannot remove it afterwards. Phase 4 is specified to read pass data as a signal, so these
accumulate as real history in the record that feeds it.

**The reference is Roll Call!'s pass dropdown**, which is where cancel lives over there rather than
as a fourth button. Read it before designing — the column has no room for another control, which is
the constraint that shapes this.

**Deliverables**
- **A cancel path on an open pass**, reachable from the pass cell. It removes the entry from
  `openPasses` and **writes nothing to `passes`**.
- **A `cancelPass()` in the model**, beside `closePass()` and deliberately not a variant of it —
  cancel is not a close with a flag. `closePass()` writes history; this one is the only writer that
  removes an open pass without leaving a record, and it says so at the definition.
- **Distinguishable from Return under a thumb.** A cancel that can be hit while reaching for Return
  loses a real trip's minutes, which is the mirror of the bug being fixed.
- **Presentation-mode safe**, per the standing obligation, and 44px under `(pointer: coarse)`.

**Out of scope** — cancelling a pass that has already been returned. That entry is history and the
append-only rule protects it; getting it wrong is a job for a pass history view, which is WO-2.9.
Also out: an undo for the `D` coupling's dismissal-close, which already has its own retraction.

**Acceptance**
- [ ] Issuing a pass and cancelling it leaves `passes` **byte-identical** to before the tap, and
      `openPasses` back to its prior length. Verified in the document, not the UI.
- [ ] A cancelled pass frees its slot against the per-class cap of three immediately.
- [ ] Cancel and Return cannot be confused at speed on glass. 👤
- [ ] Cancelling creates no attendance record and changes no attendance mark — the same silence
      WO-2.8's acceptance line 6 measures.
- [ ] A pass returned normally still writes exactly one entry. Cancel does not weaken Return.

**Traps** — **`passes` is append-only, and this work order is the one exception being added to
that rule, so it must not become two.** The rule protects trips that happened; a tap that sent
nobody anywhere is not one, and that is the whole argument. The failure mode to avoid is a
`cancelPass()` general enough to delete a *returned* entry — at which point the append-only claim
in [`../../docs/data-model.md`](../../docs/data-model.md) is no longer true of anything and
Phase 4's signal is reading a mutable log. Gate it on the pass being **open**, the way
`reopenPass()` is gated on `endedBy === 'dismissed'`.

And **do not implement cancel as Return with `minutes: 0`.** It reads as the smaller change and it
is the defect: a zero-minute trip is exactly the phantom record this exists to prevent, just
written deliberately.

---

## WO-2.12 — Portrait shows today, landscape shows the week

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-2.8
**Amends roadmap** Phase 2 → WO-2.1's "students × recent days" grid, in portrait only

**Why it exists.** WO-2.8's 160px `Passes` column joined a grid WO-2.10 had tuned to fit with
nothing to spare, and the day columns paid for it. `dayColumnCount()` became a width budget and
portrait lost columns: four at 768pt, **five at the owner's 834pt 11″**, six only at 1024pt.

WO-2.8 escalated this as a three-way choice — four, five or six, the sixth bought by cutting the
name column to an avatar and an ellipsis. **The owner rejected the question**, 2026-08-07: in
portrait the screen is used at the classroom door to mark *today*, and the six-day window is a
thing you read at a desk. So portrait should show **today only** and landscape should keep six.

What that buys at 834pt: `834 − 80 chrome − 160 Passes − 72 = 522px` for the name column against
today's 232px cap. Full names, no truncation, and the Passes column stops competing for width.

**Deliverables**
- **A portrait rule in `dayColumnCount()`** ([`../../src/attendance.js`](../../src/attendance.js)),
  which is already a width budget and not a breakpoint ladder — this is a few lines, not a rewrite.
- **A documented exception to `MIN_DAY_COLS = 3`**, whose comment currently reads *"Three is the
  fewest this screen will draw."* That rule is not being deleted; it is being given its one
  deliberate exception, and the comment has to say which.
- **The name column's coarse cap revisited** now that it is no longer competing with five day
  columns — it went 256 → 232 under WO-2.8's pressure and that pressure is gone in portrait.
- **WO-2.1's acceptance line 2 rewritten**, in the work order and in
  [`../../TESTING.md`](../../TESTING.md). It is currently qualified with a ⚠ pointing at WO-2.8.
  Six-in-portrait stops being the goal, so the line is not re-closed as written — it is replaced,
  with the reason, and the owner closes the new one.

**Out of scope** — a portrait/landscape toggle the teacher sets by hand. The orientation is the
signal; a preference to override it is a setting nobody will find and everybody will have to
maintain. Also out: any change to what landscape draws.

**Acceptance**
- [ ] Portrait draws exactly one day column — today's — with the Passes column intact.
- [ ] Landscape still draws six, on the same device, with no reload.
- [ ] Rotating the iPad mid-class repaints without losing scroll position or an in-flight mark. 👤
- [ ] Full student names are readable in portrait without truncation, at the owner's roster's
      longest name. 👤
- [ ] The grid's wrap does not overflow in either orientation — the `overflow-x` valve stays shut,
      which is the WO-2.10 defect this must not reopen.
- [ ] A narrow **laptop** window does not fall to one column. Orientation is the signal, not width
      alone, and a 900px browser window is landscape.

**Traps** — **`dayColumnCount()` is measured off `window.innerWidth`, not off the panel**, and the
comment above it explains why: this screen can legitimately be painted while `#classView` is still
hidden, and a hidden element measures zero. Whatever asks the orientation question has to survive
being asked a frame early, the same way the width question does.

**Backfilling a past day needs a day column**, so in portrait the teacher rotates to correct
Tuesday. That is the accepted cost of this trade and it should be written down where WO-2.1's
unlock is described, not left for someone to hit at the door.
