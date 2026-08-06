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

**Ship** 1 · **Status** 🔨 IN PROGRESS · **Size** L · 🚩 · **Depends on** WO-1.7, WO-1.10
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
- [ ] A mark lands and survives a reload. *(One of the three things that must be right before
      students walk in.)*
- [ ] **Six days of columns are visible at once for a class of 26 without sideways scrolling on an
      iPad**, in the orientation the owner actually holds it. 👤
- [ ] A dropped class and an untaken class are visually distinguishable without reading fine print,
      and are distinguishable in the stored document — **in the column header and in the cells
      under it.**
- [ ] Marking a class taken with zero exceptions still creates a record — otherwise "taken with
      everyone present" is indistinguishable from "forgot."
- [ ] One tap drops a class; one tap undoes it.
- [ ] Taking attendance for a class of 25 with two absences takes under 15 seconds on an iPad. 👤
      *(Needs a real iPad and a stopwatch.)*
- [ ] **Attendance can be recorded for a date two weeks back and it lands on that date** — reached
      from this screen, without a separate view.
- [ ] **The "not today" indication is visible in a glance, on an iPad, in a classroom.** 👤
- [ ] **Future dates are either blocked or clearly flagged** — marking Friday's attendance on
      Wednesday is a mistake, not a feature.
- [ ] **A hole deliberately left three days earlier is findable by looking at the grid**, without
      remembering which day it was.
- [ ] All five marks are reachable from a cell without opening a submenu or leaving the row.
- [ ] The document after a full day of five classes contains no `P` entries.

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
