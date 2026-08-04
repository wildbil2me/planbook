# Phase 2 work orders — Attendance

**Phase goal:** the owner stops opening Roll Call!.

Branch: `phase/2-attendance`. **Read [`../rotating-schedule.md`](../rotating-schedule.md) before
starting anything in this phase.** It is a decision record, and it exists because the next session
will want to build a cycle model. There is no schedule object, no rotation, no meeting pattern: a
class met if it has an attendance record without an `exception`.

WO-2.1 through WO-2.4 are Ship 1 (day one). WO-2.5 through WO-2.7 are explicitly cut from Ship 1
and land in Ship 2.

---

## WO-2.1 — Attendance marking screen

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** L · 🚩 · **Depends on** WO-1.7, WO-1.10
**Closes roadmap** Phase 2 → "Marking screen, exceptions-only", "Marks `P / T / A / E / D`",
"One-tap drop", "Three distinct states per class per day"

**Why it exists.** This is the critical-path flow — it runs while students walk in, and it is the
one thing the owner does every single class period. It is also *the riskiest thing on day one*: a
live term of attendance in a three-week-old app.

**Deliverables**
- The day loads showing **all classes**, each in one of three states: **taken · dropped · not taken
  yet**. The third is not the second, and the distinction is visible at a glance.
- Exceptions-only marking: present is the default and is not stored. You tap the absences and
  tardies. A class of 25 with two absences is two entries in the document, not 25.
- Marks `P / T / A / E / D`, using Roll Call!'s vocabulary so the owner's habits carry over.
- **One-tap drop** on a class that didn't meet — writes
  `{ classId, date, exception: "dropped" }` and the class is done. No setup, nothing to maintain
  when the rotation shifts.
- Un-drop, and un-mark, without leaving the screen.
- Storage exactly per [`../../docs/data-model.md`](../../docs/data-model.md): one record per class
  per date; `marks` holding only exceptions; `exception` present means the class did not meet.
- The home-screen card slot from WO-1.10 filled with today's state per class, each with a one-tap
  fix.

**Out of scope** — percentages (WO-2.4), the keyboard path (WO-2.5), history views (WO-2.6).

**Acceptance**
- [ ] A mark lands and survives a reload. *(One of the three things that must be right before
      students walk in.)*
- [ ] A dropped class and an untaken class are visually distinguishable without reading fine print,
      and are distinguishable in the stored document.
- [ ] Marking a class taken with zero exceptions still creates a record — otherwise "taken with
      everyone present" is indistinguishable from "forgot."
- [ ] One tap drops a class; one tap undoes it.
- [ ] Taking attendance for a class of 25 with two absences takes under 15 seconds on an iPad.
- [ ] All five marks are reachable without a submenu.
- [ ] The document after a full day of five classes contains no `P` entries.

**Traps** — Storing `P` for present will pass every test here and quietly triple the document. The
absence of a mark *is* the mark. And do not add a "submit"/"finalize" step: a mark is saved when
tapped, because the teacher will be interrupted mid-class.

---

## WO-2.2 — Marking a past date

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** S · 🚩 · **Depends on** WO-2.1
**Closes roadmap** Phase 2 → "Mark a **past** date."

**Why it exists.** A forgotten day is more common than a dropped one. Without this, the first day
the owner gets pulled into a meeting produces a hole in the ledger that can never be filled, and
the percentage silently stops matching a hand count.

**Deliverables**
- A date control on the marking screen; the whole screen re-renders for that date.
- Clear, unmissable indication when you are not on today. This is where a wrong-day mark comes from.
- The three states apply to past dates identically — a past date with no record reads "not taken",
  not "dropped".
- A short list of recent dates with untaken classes, so the hole is findable rather than remembered.

**Out of scope** — a month view (WO-6.3). A date stepper and a picker are enough.

**Acceptance**
- [ ] Attendance can be recorded for a date two weeks back and it lands on that date.
- [ ] The "not today" indication is visible in a glance, on an iPad, in a classroom.
- [ ] Future dates are either blocked or clearly flagged — marking attendance for Friday on
      Wednesday is a mistake, not a feature.
- [ ] The recent-untaken list finds a hole deliberately left three days earlier.

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
