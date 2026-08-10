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

  > **Amended 2026-08-07, under WO-2.12: backfilling a past day needs a day column, and in portrait
  > there is only today's.** So correcting last Tuesday means turning the iPad to landscape, where
  > the week and its ✏ come back. Paging still works in portrait — "Earlier" simply walks back one
  > weekday per tap instead of six — but the rotation is the route, and this is the accepted cost of
  > portrait showing today rather than a gap someone should try to close. Written here rather than
  > only in WO-2.12 so that it is beside the unlock it constrains; `src/attendance.js`'s
  > `editPastDay()` carries the same note at the code.
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
- [x] **Six days of columns in LANDSCAPE, today's column alone in PORTRAIT, for a class of 26 and
      with nothing scrolling sideways in either.** 👤 **Rewritten by WO-2.12 on 2026-08-07 and closed
      by the owner the same day**, on her own iPad, against the build carrying both of that work
      order's re-cuts. This was WO-2.1's last open line.

      > **The line this replaces**, kept because it was ticked on the owner's own device on
      > 2026-08-06 and a tick is not deleted quietly: *"Six days of columns are visible at once for a
      > class of 26 without sideways scrolling on an iPad, in the orientation the owner actually
      > holds it."* WO-2.8 put a 160px `Passes` column into the grid, `dayColumnCount()` budgeted for
      > it, and portrait fell to four columns at 768–820px and five on the owner's 834pt 11″. That
      > was put to her as three options — four columns, five at a ~165px name cap, or six at a ~95px
      > one — and **she rejected the question** on 2026-08-07: in portrait this screen is held at the
      > classroom door to mark *today*, and the six-day window is read at a desk. So six-in-portrait
      > stopped being the goal, and a line whose goal has changed is replaced rather than re-ticked.
      > The half about *sideways scrolling* was always true, is measured, and carries over unchanged.
      > WO-2.12 is where the new line is built and argued.
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

**Ship** 1 · **Status** ✅ DONE — 2026-08-08 · **Size** M · 🚩 · **Depends on** WO-2.1
**Closes roadmap** Phase 2 → "Days off and pre-drops, set ahead."

*Built 2026-08-07 — `verify-shell.mjs` **379 of 379** (thirteen new: twelve at the end of the
attendance section, one in the coarse sweep), `wo-sweep.mjs` 10 passed / 0 failed / 1 standing
review, with six mutation proofs behind the new checks. **All five acceptance lines close at the
desk** and are ticked below; what stays owed is a sitting on the owner's own iPad, listed in
`TESTING.md` § WO-2.3, which is why the status is 🔨 rather than ✅. Nothing in this work order
carries a 👤 acceptance line — the two things that want eyes are the fourth column palette read
across a room and the 44px of a date picker under a thumb, and both are judgements a headless
Chrome cannot make however green it measures.*

*Sat on the iPad 2026-08-08. **All three 👤 lines pass, and the sitting sent back five defects that
every green check above had missed.*** Two were layout under a real coarse pointer, one was the
software keyboard, one was a design rule that only looks wrong once a thumb is doing the work, and
one was a hole nobody had noticed because the feature that opened it had shipped the day before:
**days off could be set ahead and not looked at ahead**, because the registry's window ended at
today. All five are fixed on this branch (`verify-shell.mjs` **389 of 389**, ten new); the table,
those checks and the acceptance list they close are in `TESTING.md` § WO-2.3 → "What the sitting
sent back". The one that is a real
change rather than a fix is the registry paging **forward** as far as the calendar reaches —
`src/attendance.js`'s `dayColumns()` and `futureLimit()` carry the reasoning, and the rule it did
**not** touch is that `writableDate()` still refuses every date after today. Opening the columns was
only safe because the block was never in the rendering.

*Closed 2026-08-08 on a second sitting the same day: all eight checks over the six fixes pass, which
was the last line this work order owed. Two sittings on one day is what this work order actually
cost, and it is worth saying why rather than filing it as thoroughness — the first sitting found
five things behind a fully green harness, and the fix for the largest of them introduced the sixth.
**A change that opens a new axis on a screen re-opens every rule that was phrased against the old
one.** Here it was `Later ▶`, disabled by a test that had silently been answering two questions at
once for as long as the forward end and today were the same date.*

*Two modules, split the way `src/passes.js` and `src/attendance.js` already are.* `src/calendar.js`
*is the model — no DOM, no clock, never calls the store — and* `src/days-off.js` *is the only writer
of* `doc.events` *in the app. The registry reads the first through* `stateOf()` *and never touches
the second, which is what keeps "did this class meet" a question with one answer.*

*The fourth state is* `covered`*, and the word on screen is the event's own — "No school" or "Planned
drop", with the teacher's title beside it as the reason. It takes the dropped column's quiet grey
made **solid** rather than dashed: the two mean the same thing about the class and different things
about where the undo lives, and the undo is what a teacher is looking for when she reads that chip.
The header slot* `src/attendance.js` *reserved for it at WO-2.1 was filled without re-flowing
anything, and the 🚫 in a covered head became a 📅 — a door to the screen the reason was authored on
rather than an undo, because removing a holiday affects every class on every date of its range and
that is not a decision to take from inside one class's column head.*

*One consequence worth stating rather than discovering: **a covered day is read-only, so a class
that met on a school-wide day off cannot be recorded from the registry.** The escape hatch is the
calendar — narrow the range, or name classes instead — and that is a real cost, chosen over the
alternative of leaving the cells live, which would let a mis-tap invent a meeting on Thanksgiving.
Noted as a proposed follow-up rather than fixed here, because "record a class on a covered day" is
not in the Deliverables and a work order that grows is one that cannot be verified.*

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
- [x] A `no-school` range across a week shows every class as not-meeting on every date in it.
- [x] Deleting that event restores all those days to "not taken yet" with no attendance records
      having been touched.
- [x] A future `dropped` event naming two classes affects only those two.
- [x] Adding a retroactive snow day over a date that already has recorded attendance **warns and
      does not void the record**. Verify the marks are still there afterward.
- [x] No attendance record is ever created by authoring an event. Inspect the document to confirm.

**Traps** — Copying the event into attendance records is the obvious implementation and it is the
one thing this design exists to prevent. It creates a second source of truth, and the one the
teacher isn't looking at is the wrong one.

---

## WO-2.4 — Counts & attendance percentage

**Ship** 1 · **Status** ✅ DONE — 2026-08-08 · **Size** M · 🚩 · **Depends on** WO-2.1, WO-2.3
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
- [x] Percentages match a hand count across a term of a randomly shifting rotation. 👤 *(One of the
      three things that must be right before students walk in — verify against a real class. Run by
      the owner at the desk, 2026-08-08.)*
- [x] Dropped days and `no-school` days are absent from both numerator and denominator.
- [x] A student with one excused absence out of ten meetings shows 100%, not 90%.
- [x] Untaken days do not appear in the denominator.
- [x] A student with zero recorded meetings shows an honest empty state, not `NaN` or `0%`.
- [x] Cross-checked against Roll Call!'s number for the same class and date range. 👤 *(Quarter
      against quarter, per the precondition below. Run by the owner at the desk, 2026-08-08.)*

*Built 2026-08-08 — `verify-shell.mjs` **400 of 400**, `wo-sweep.mjs` 9 passed / 0 failed / 2
standing reviews, behind ten fixtures written for this work order. **Held at 🔨 IN PROGRESS for the
day it took to run the two 👤 lines**, which needed a real class and Roll Call!'s own numbers on a
🚩 go-live blocker — the roadmap box stayed unticked until the owner had run them. She ran the
sitting `TESTING.md` § WO-2.4 lists on 2026-08-08 and both agreed; closed the same day.*

*Two preconditions found while verifying, both of which will waste that sitting if she doesn't know
them first. **Term dates must be set on the class before either line is checkable** — terms ship with
blank `start`/`end`, which is valid, and an undated term now renders "Term dates not set · Year: N
recorded meetings" rather than a term figure. And **the comparison must be quarter against quarter,
never year against year**: Roll Call! disagrees with itself, its per-quarter sheet formula being
`(P+T+E+D)/(P+T+A+E+D)` (`bridge.gs:625-626`, which Planbook matches at the source) while its year
roll-up drops `E` from the numerator and `D` entirely (`dashboard.html:4058-4073`). A year-to-year
check shows a divergence that is Roll Call!'s, not this app's.*

**Traps** — Denominators built from calendar dates will look right in September and diverge by
November. The denominator is *recorded meetings of that class*, per class, always.

---

## WO-2.5 — Keyboard & touch pass

**Ship** 1 · **Status** ✅ DONE — 2026-08-08 · **Size** S · 🚩 · **Depends on** WO-2.1
**Closes roadmap** Phase 2 → "Keyboard path on desktop (row select, `P`/`T`/`A`/`E`, arrows) and
44px touch targets under…" *(re-quoted from the box on 2026-08-08, WO-2.15. The old fragment left
the parenthetical out and matched zero boxes, so the box was hand-ticked; a fragment is matched
against one line, so it stops where the box wraps and the ellipsis carries the rest.)*

**Why it exists.** The roadmap says both, not either, because building for one device is how the
other one becomes unusable.

**Moved into Ship 1 and marked 🚩 on 2026-08-08, and the reason changes what this work order is.**
This was written when the model was *"attendance is marked on the iPad while students arrive and
reviewed on the laptop afterward,"* which made the keyboard path an affordance for the quiet half of
the job. That model is inverted for the first term: **the laptop is the device of record and the
keyboard path is how a live class gets marked while students walk in** — see WO-G1's decision
record, which turns on two devices being two databases and sync being Phase 7.

So the deliverable is unchanged and the **standard it is built to is not**. This is now on the
critical path CLAUDE.md names: *fast enough to do while students arrive*, for a class of 25–30, by
someone who is greeting a room rather than looking at a screen. A keyboard path that is merely
present and correct passes the acceptance list below and still fails the term. Mouse-clicking 25
rows one at a time is the failure this work order exists to prevent, and until it lands the
laptop-only decision is not safe to act on.

**Do not let this quietly become an iPad work order.** The touch and screen-reader deliverables stay
— the iPad remains a verification device and Phase 7 brings it back as a peer — but the keyboard
half is the one with a term riding on it, and it is the half with no hardware sitting of its own
behind it. Every 👤 line in Phase 2 was closed on the iPad.

**Deliverables**
- Desktop: row selection, `P`/`T`/`A`/`E`/`D` keys to mark, arrow keys to move, Escape to
  deselect. Shortcuts discoverable, not folklore.
- Touch: audit every control added in WO-2.1–2.4 against the `@media (pointer: coarse)` block.
- Screen-reader labels on the mark buttons — an icon-only `A` button needs `aria-label` and `title`.

**Acceptance**
- [x] A full class can be marked from the keyboard without touching the mouse.
- [x] No attendance control is under 44px on a coarse pointer.
- [x] Keyboard focus is visible on every step and never lost after a mark.
- [x] The shortcuts are documented somewhere in the UI, not only in this file.

*All four measured at a desk on 2026-08-08 — `verify-shell.mjs` 428 of 428, twenty-two of them new,
eight mutations reverted. `TESTING.md` § WO-2.5 carries the evidence line by line and the mutation
table. **The classroom sitting is still owed**: five 👤 lines are open there, and the two that
matter are marking a real class from the doorway and the 44px pass on the owner's own iPad — the
figure above is an emulated coarse pointer at 1024×768, which is a measurement and not a thumb.*

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

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-1.7
**Closes roadmap** Phase 2 → "Roll Call! importer."

**Deferred out of Ship 2 on 2026-08-09, by the owner: no live data is coming across from Roll Call!**
The 2026-27 rosters are pasted fresh and the attendance ledger starts empty, so there is nothing
historical to import that anyone wants imported. It keeps its work order, its roadmap box and its
dependency — the deferral is about *when*, not about whether — and it comes back the first time
someone wants a prior year read in. **It was also removed from WO-G2's dependency line the same day**;
a gate that waits on work nobody intends to do is a gate that gets waived, and a waived gate teaches
the next one that gates are advisory.

*One thing goes with it, so it is not discovered later:* acceptance line 2 — *"imported attendance
produces the same percentage Roll Call! reports for that class"* — was the only mechanized check that
WO-2.4's formula agrees with the app it replaces. That agreement is a compatibility requirement, not
a preference (WO-2.4, *Why it exists*), so with the importer deferred it stays where it already was
in practice: the owner reading both apps' numbers by hand this term.

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
**Closes roadmap** Phase 2 → "Hall passes: bathroom, nurse, quick"

*Built 2026-08-06; correction round 1 on 2026-08-07 date-gated the `D` coupling's reopen half and
qualified WO-2.1's six-column line, which this order made false in portrait. All seven acceptance
lines are verified — five at the desk, the two 👤 lines on the owner's own iPad on 2026-08-07.
**Two things came out of that sitting that are not defects in this order and are booked as their
own:** a misclicked pass can only be undone by Return, which writes a phantom trip into the
append-only log (**WO-2.11**, 🚩), and the portrait grid is down a day column (**WO-2.12**).
WO-2.1's acceptance line 2 stays qualified until WO-2.12 rewrites it — the owner's answer was
neither four nor six but "portrait should show today", which is a different line than the one
that was ticked. **WO-2.12 rewrote it on 2026-08-07**, and the qualification is gone with it: the
line now reads six in landscape and today alone in portrait, unticked, waiting on the owner's own
device.*

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

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-2.11

**Why it exists.** Cut from Ship 1 deliberately: WO-2.8 makes the daily flow work, and everything
here is what makes it comfortable. The data is recorded either way, so these views can follow
without losing any of it.

**The banner itself moved to WO-2.11** on 2026-08-07, because cancel needed a surface to live on and
the 160px pass column had no room for one. What came forward was the card — name, type, time out,
Return and Cancel — and nothing else. **What stayed here is the hard half**, which is why this work
order is still M and still carries the Traps section below.

**Deliverables**
- **The elapsed clock on WO-2.11's card**, computed from the stored timestamp on every render. This
  is the piece the banner shipped without, and the Traps section is the reason.
- **Two escalating overdue alerts**, per Roll Call!'s configurable `alertOneMin` / `alertTwoMin`.
- **A pass history view**, per student and per class, reading the append-only log. This is the
  Planbook half of Roll Call!'s report modal — its `Student Report` carries a **Hall Pass History**
  table (`src/dashboard.html` ~4718: date, type, out, back, minutes, note) and its `Hall Pass
  Summary` tab is the per-class view (~4803). Both are worth reading before designing this.
- Presentation-mode safe, **and this view is the one that most needs it**: presentation mode is a
  parent-teacher-night tool, and a pass history is exactly what gets read beside a guardian. It
  obeys [`../../src/supports.js`](../../src/supports.js) like every other surface that names anyone.
  *(WO-2.11's banner deliberately does not — see the decision recorded there. That decision rests on
  passes and presentation mode never overlapping, which is true of a live class and **not** true of
  this view.)*

**Acceptance**
- [ ] Elapsed time is correct after the app has been backgrounded for ten minutes. 👤 *(See Traps.)*
- [ ] Both alerts fire once each, not repeatedly, and not again after the student returns.
- [ ] The history view's totals match the log; a hand count of one student's passes agrees.
- [ ] A cancelled pass appears in no history view and in no total — WO-2.11 writes nothing, and this
      is the work order that would notice if that stopped being true.
- [ ] Presentation mode suppresses names in the history view.

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

## WO-2.11 — The pass banner, and cancelling a pass issued by mistake

**Ship** 1 · **Status** ✅ DONE — 2026-08-07 · **Size** M · 🚩 · **Depends on** WO-2.8
**Closes roadmap** Phase 2 → "The pass banner, and cancelling a pass issued by mistake" *(re-quoted
from the box on 2026-08-08, WO-2.15 — the old fragment paraphrased it and matched zero boxes)*
**Takes from WO-2.9** the banner card only — the elapsed timer, the overdue alerts and the history
view stay there. See *Why the banner comes with it*.

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

### Why the banner comes with it

**There is no dropdown in Roll Call!, and an earlier draft of this work order said there was.**
Corrected 2026-08-07 against the source. What is actually there:

- The **grid cell** carries a bare `Return` and nothing else — `passOutHTML()`, `src/dashboard.html`
  ~5270, a single line.
- **Cancel lives on the active-pass banner card**: `✕ Cancel` beside `✓ Return`, ~3439, on a card
  that also holds the avatar, the name, the type chip, the time out, the elapsed clock and a note
  field. `cancelPass(si)` itself, ~3345, is four lines — `delete activePasses[si]`, repaint.
- Compact mode has its own `✕ Pass` beside Return, ~5027.

So in Roll Call! **you never cancel from the row you issued from.** That is the design, and it is
the answer to the constraint this work order was written around: the 160px column has no room for a
third target, and putting one there is how a thumb reaching for Return destroys a real trip's
minutes. The banner has room outright.

The owner chose this shape on 2026-08-07 over adding a control to the cell. What comes forward is
**the card and nothing else.** The elapsed timer stays in WO-2.9 deliberately — it carries the
iOS-suspend trap that WO-2.9's Traps section exists for, and cancel does not need it.

**Deliverables**
- **The active-pass banner**, per Roll Call!'s `renderActivePassBanner()`: one card per open pass,
  carrying the student's name, the pass type, and the time out. **No elapsed clock** — see above.
- **`✕ Cancel` on the card**, beside Return. It removes the entry from `openPasses` and **writes
  nothing to `passes`**.
- **`Return` on the card too**, as Roll Call! has it, so the banner is a complete surface rather
  than a place where half the actions live. The cell keeps its own Return; both call the same writer.
- **An `Add note…` field on the card**, as Roll Call! has it, and **`note` added to the pass
  record** — optional, absent where unused, the same shape rule the mark cell's `note` follows. It
  is typed while the student is out and **carried through `closePass()` into the `passes` entry**,
  which is what makes it worth anything: WO-2.9's history view renders it (Roll Call!'s
  `.sr-pass-note`), and a note that died on return would render nowhere.
  **Add the field now rather than in WO-2.9.** It is one optional string, and the alternative is
  retrofitting it onto pass records already written during a live term. No migration is needed —
  absent is a legal value — but [`../../docs/data-model.md`](../../docs/data-model.md) records it
  with the two collections.
- **A `cancelPass()` in the model**, beside `closePass()` and deliberately not a variant of it —
  cancel is not a close with a flag. `closePass()` writes history; this one is the only writer that
  removes an open pass without leaving a record, and it says so at the definition.
- **The banner is scoped to the class on screen** — `openPassesFor(doc, classId)`, not
  `openPassesIn(doc)`. Both exist in the model and this is the deliberate choice between them,
  made by the owner on 2026-08-07: passes are issued for one room at a time, and a banner carrying
  another period's students is noise on the screen you are standing in front of. A pass left open
  in an earlier class is **not** invisible — its own row keeps its Return button and its time out in
  that class's grid, which is the surface the owner confirmed on the iPad reads as a reminder. The
  cross-class case, if it ever wants one, belongs to WO-2.9's overdue alerts.
- **44px under `(pointer: coarse)`**, per the standing obligation.

**Presentation mode is deliberately NOT handled here**, and the reasoning is recorded because the
card is exactly the shape of thing a later session will flag. The card names a student beside a
coloured type chip reading `Bathroom` / `Nurse` / `Quick` (confirmed from a screenshot of Roll Call!
running, 2026-08-07), and `Nurse` beside a named child on a projected wall is health-adjacent
information of the kind [`../../CLAUDE.md`](../../CLAUDE.md) puts in the never-disclose set.

**The owner's call, 2026-08-07, and the argument for it:** presentation mode is a parent-teacher
night tool — reviewing a student's record with a guardian, not running a live class. Passes are
issued during class. The two do not overlap, so there is no card on the wall to hide.

**The residual case, named rather than hidden:** nothing expires a stale pass (WO-2.8, deliberately
— inventing a return time is the same sin as inventing a tardy's `at`). A pass forgotten in period 7
is still open at a 6pm conference. If the banner is ever drawn on a projector, that is how. The fix
if it happens is three lines, because the card only has to ask
[`../../src/supports.js`](../../src/supports.js) like every other surface — the work is knowing to,
which is what this paragraph is for.
**Out of scope** — presentation-mode handling for the card, per the decision recorded above. The
elapsed clock, the two overdue alerts, and the pass history view, all of
which stay in WO-2.9 and are why that work order still exists. Cancelling a pass that has already
been returned: that entry is history, the append-only rule protects it, and correcting it is a job
for the history view. An undo for the `D` coupling's dismissal-close, which has its own retraction.

**Acceptance**
- [x] Issuing a pass and cancelling it leaves `passes` **byte-identical** to before the tap, and
      `openPasses` back to its prior length. Verified in the document, not the UI.
- [x] A cancelled pass frees its slot against the per-class cap of three immediately.
- [x] Cancel and Return cannot be confused at speed on glass. 👤 *(Two sittings on the owner's iPad,
      2026-08-07. The first passed and sent the card back to be lifted from Roll Call! properly,
      which re-opened this line; the second passed on the re-cut card and returned a layout report —
      three open passes wrapped their buttons onto two rows in landscape and three in portrait,
      caused entirely by rules in the coarse block. Fixed, and the one-row property is now measured
      at the cap of three in both orientations. Cancel is no longer red at rest on a touch device;
      two of the three differences are carried by fill and glyph rather than hue. `TESTING.md` has
      the detail and the fix if that ever stops reading.)*
- [x] Cancelling creates no attendance record and changes no attendance mark — the same silence
      WO-2.8's acceptance line 6 measures.
- [x] A pass returned normally still writes exactly one entry. Cancel does not weaken Return.
- [x] A note typed on the card survives the Return and is on the entry in `passes`. A pass with no
      note carries no `note` key at all.
- [x] A note on a **cancelled** pass goes wherever the pass goes — nowhere.
- [x] The banner shows one card per open pass **in the class on screen**, and disappears entirely
      when that class has none — including when another class still does. Returning or cancelling
      from the **card** updates the row's cell, and from the **cell** updates the card.
- [x] The banner costs the registry no day columns — it is above the grid, not beside it. The
      portrait width budget is already tight and WO-2.12 is spending it.

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

**Ship** 1 · **Status** ✅ DONE — 2026-08-07 · **Size** S · **Depends on** WO-2.8
**Amends roadmap** Phase 2 → WO-2.1's "students × recent days" grid, in portrait only

*Built 2026-08-07 — `verify-shell.mjs` **366 of 366** after two same-day re-cuts below (359 as first
built, 361 after the rotation trigger), `wo-sweep.mjs` 10 passed / 0 failed / 1 standing review, with
nine mutation proofs behind the new checks. Four of the six acceptance lines are closed
at the desk. **The status stays 🔨 IN PROGRESS on purpose:** the two 👤 lines need the owner's own
iPad in her own hands, and `TESTING.md` § WO-2.12 lists the sitting they are owed — along with
WO-2.1's rewritten line 2, which is the same sitting and the line that closes that work order's.*

*One thing found on the way that the work order did not ask for and that acceptance lines 2 and 3
turn out to require: **nothing in this app listened for a rotation.** `dayColumnCount()` is read when
the grid is painted, so before this the iPad could be turned and the grid would keep whatever it had.
That never showed because portrait and landscape drew the same six columns; it becomes "turn the iPad
and it still says today" the moment they differ. A `(orientation: portrait)` media-query listener is
the repaint, and it is argued under `dayColumnCount()`.*

*🔁 **Re-cut the same day, on the owner's report from her own iPad**, hours after this shipped: the
first turn worked, the turn back did not, a reload restored the week, and the next turn did nothing.
The arithmetic was never wrong — 359 checks were green over a build that failed at the door — and the
**trigger** was, in two WebKit-specific ways no Chrome harness can produce. A `MediaQueryList` that
nothing holds a reference to can be garbage-collected with its listener, which is exactly "worked
once, then never again"; and iOS reports pre-turn `innerWidth`/`innerHeight` while the change event
is being delivered, so the repaint measures the orientation the device just left. The trigger is now
the media query **plus** `resize` **plus** `orientationchange`, each looking three times (now, next
frame, and after the rotation settles), made free by a guard that compares the count it would draw
against the count on screen and does nothing when they match — which also answers the original
argument against `resize`. Two new checks, two that stopped being hand-rendered, two mutation proofs,
`verify-shell.mjs` **361 of 361**. Full account in `TESTING.md` § "The turn that only worked once".
**Neither cause is reproducible at a desk, so the 👤 sitting now asks for five or six turns, not
one.***

*🔁 **Re-cut again the same day, on the owner's second report:** page back three windows in landscape,
turn to portrait, and the screen showed 8/4 rather than today. Two defects behind one symptom. The
page position was counted in **windows** and the slice was `offset * count`, so a number standing for
where the teacher is got multiplied by a number that changes when the iPad turns — three taps is
eighteen weekdays back at six columns and three at one. It is counted in **weekdays** now and the
step is the window (`pageDays()` adds `count`), so "two taps is two weeks" survives and a laptop drag
from six columns to five stops sliding the teacher two weekdays sideways. And **portrait no longer
pages at all** — her rule, stated plainly: in portrait we only want to see today. Pinned in
`visibleColumns()`, which every paint goes through, because a turn is one of five routes into an
upright screen that is paged away. The page controls stay on screen disabled, the way `Later ▶`
already does at today, and their tooltip is the first place the backfill route is written where a
teacher can see it. `verify-shell.mjs` **366 of 366**, two more mutation proofs. Full account in
`TESTING.md` § "Paging across a turn".*

*And one defect the listener opens, fixed in the same pass: **an unlocked past column survives a turn
that takes it off the screen.** `editingPast` is module state, so unlocking Tuesday in landscape and
turning the iPad upright left `editDate()` answering Tuesday with no Tuesday drawn — every cell in
today's column read-only, under a banner naming a day that is not there. `pageDays()` already carries
the rule that covers it (the strip saying which day you are editing is only honest while that day is
on screen), so a turn takes the same exit through `lockPastDay()`. Measured, and the mutation that
removes it is tabulated in `TESTING.md` § WO-2.12.*

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
- [x] Portrait draws exactly one day column — today's — with the Passes column intact. *(Measured on
      an emulated 834×1112 with a coarse pointer: one column, its date is today's, and the `Passes`
      head is still 148px+ wide.)*
- [x] Landscape still draws six, on the same device, with no reload. *(The same emulated device
      turned to 1112×834 and read WITHOUT the harness repainting it — so what passes is the trigger,
      not the arithmetic. Removing it turns this red. **And four more turns after it**, added on the
      re-cut: one flip and five flips are the two different questions, and the first build answered
      only the first.)*
- [x] Rotating the iPad mid-class repaints without losing scroll position or an in-flight mark. 👤
      *(The desk half was closed first — the mark made in portrait is on the cell and in the document
      after the turn. **The owner closed the rest on her own iPad, 2026-08-07, against the re-cut
      build**; the build this line was first written for failed on her device, which is what the
      re-cut above is.)*
- [x] Full student names are readable in portrait without truncation, at the owner's roster's
      longest name. 👤 *(The desk half was closed first — "Delacroix-Nguyen, Xiomara" is drawn in full
      in portrait with the ellipsis not engaging. **The owner closed her own longest name on her iPad,
      2026-08-07.**)*
- [x] The grid's wrap does not overflow in either orientation — the `overflow-x` valve stays shut,
      which is the WO-2.10 defect this must not reopen. *(Measured in both, at 834pt and at 768pt.)*
- [x] A narrow **laptop** window does not fall to one column. Orientation is the signal, not width
      alone, and a 900px browser window is landscape. *(900×700 fine-pointer draws five, 1280×900
      draws six. Implementing the rule as `w < 1024 → 1` turns this red and nothing else.)*

**Traps** — **`dayColumnCount()` is measured off `window.innerWidth`, not off the panel**, and the
comment above it explains why: this screen can legitimately be painted while `#classView` is still
hidden, and a hidden element measures zero. Whatever asks the orientation question has to survive
being asked a frame early, the same way the width question does.

**Backfilling a past day needs a day column**, so in portrait the teacher rotates to correct
Tuesday. That is the accepted cost of this trade and it should be written down where WO-2.1's
unlock is described, not left for someone to hit at the door.

---

## WO-2.13 — The totals are recomputed once per student; compute them once per render

**Ship** 1 · **Status** ✅ DONE — 2026-08-08 · **Size** S · **Depends on** WO-2.4
**Amends roadmap** Phase 2 → WO-2.4's "per-student counts and attendance %", on the render path only

**Why it exists.** WO-2.4 is arithmetically correct and verified — this work order does not touch a
single number it produces. What it fixes is *how many times* that arithmetic runs.

`attendanceTotals()` (`src/attendance.js:1153`) calls `meetingDates()` (`:1129`), which walks the
whole of `doc.attendance`, dedupes the dates it finds, and then runs `stateOf()` on every candidate —
and `stateOf()` calls `recordFor()`, which is another full scan of the ledger. `attendanceTotals()`
then maps `recordFor()` across those dates a second time. That is the cost of one student.

It is called **once per student**, inside `students.forEach` at `:2943-2944`.

**The meeting dates are identical for every student in the class.** A 26-student roster therefore
computes the same list of dates twenty-six times, and re-derives every record on it twenty-six
times, to produce twenty-six different tallies over one shared set of days. The only per-student part
is `readingOf(record, studentId)` — one property lookup per meeting.

Measured: **76 ms** for one `renderAttendance()` at 875 records / 175 meetings / 27 rows, desktop
headless. A full year across five classes is that size. On an iPad, that lands somewhere in the
region of 250–400 ms — **after every mark tap**, on the screen `CLAUDE.md` names as the critical
path, being used while students walk into the room.

**The fix has an obvious shape and this file already argues for it three times within twenty lines of
the offending code.** `renderRows()` hoists `perColumn` (*"Read once per column rather than once per
cell: twenty-six rows times six columns is a hundred and fifty-six lookups through the whole
attendance array otherwise"*), `cover` (*"asking the calendar once per cell would walk `events`
twenty-six times to arrive at one answer"*), and `passesFull` (*"Read once for the whole table rather
than once per row… asking it twenty-six times would walk `openPasses` twenty-six times"*). The
per-student totals were added **one line below that last comment** and do the thing it forbids.

**Deliverables**
- The meeting dates for the render's window, and the record on each, computed **once per render** and
  shared across every row — the same hoist `perColumn` and `passesFull` already are, in the same
  place and in the same style.
- Every student's counts folded out of that one shared pass. `readingOf()` stays the per-student
  reader; `stateOf()` stays the meeting predicate.
- The same treatment for the class-level counts at `:3114-3116`, which call `meetingDates()` twice
  more per render, and for the detail panel at `:3052-3053`, which computes a year and a term total
  for one student while the row above it has already computed the same thing.
- A measured before/after recorded in the work order and in `TESTING.md`.

**Out of scope** — any change to the arithmetic, the formula, the predicate, or the rendered strings.
Caching *across* renders, or anywhere outside one `renderAttendance()` call. Indexing `doc.attendance`
in the store, which is a bigger decision than this work order and would touch every reader in the app.

**Acceptance**
- [x] **Every total is byte-identical to today's output.** This is a pure refactor. Assert the full
      `attendanceTotals()` return object — counts, `meetings`, `attended`, `percent` — for a roster
      including a student with no marks at all, a student with an `E`, and a student with a `U`,
      against the values recorded in `tools/verify-shell.mjs`'s WO-2.4 block today.
      *(All four objects match, `percent: null` on the zero case included.)*
- [x] All eleven existing WO-2.4 checks still pass, unmodified. If a check has to be edited to
      accommodate this change, that is a behavior change and the work order has gone wrong.
      *(`git diff -U0 -- tools/verify-shell.mjs | grep -c "^-[^-]"` returns 0 — purely additive.)*
- [x] A before/after measurement of `renderAttendance()` at 875 records / 175 meetings / 27 rows,
      taken the same way both times, reported as two numbers. The before figure is 76 ms.
      *(Measured 2026-08-08: before 40.10 / 32.80 ms, after 9.20 / 9.20 ms — see the pair below. The
      76 ms does not reproduce on this machine; the before column above replaces it.)*
- [x] `meetingDates()` is called **O(1) times per render**, not once per student. Assert it by
      counting calls, not by reading the code. *(`2 call(s)` measured — the count seam was live, not
      the `calls === null` path. That fallback is a known soft spot: the assertion is
      `calls === null || calls === 2`, so it would go quietly green if the exports were ever
      dropped.)*
- [x] `stateOf()` is still the only meeting predicate, and `readingOf()` is still the only cell
      reader. No second copy of either appears anywhere in the diff.
- [x] The detail panel and the class-level count line show the same numbers they show today.
      *(Both byte-identical across the mark; the filtered-out **row** is the one thing that changed,
      and it changed from stale to correct — see the note below.)*
- [x] Marking a student re-renders with the new totals immediately — the shared pass is rebuilt per
      render, not carried between them. 👤 *(A stale total after a tap is the failure mode this
      work order introduces if it gets caching wrong, and it is the one a desk check will miss.)*

**Traps** — **The tempting fast version is the wrong one.** A hand-rolled loop that tests
`record.exception` directly, or that skips `stateOf()` because "we already know which dates are
meetings", rebuilds the precedence rule in a second place and undoes WO-2.4's central design — see
`plans/rotating-schedule.md` § Precedence and the header on `stateOf()`. Call the predicate once and
keep the answer; do not write a faster predicate.

**Do not cache across renders.** The whole point of the hoist is that it lives and dies inside one
`renderAttendance()`. A module-level cache keyed on class id will be correct until the day a mark,
an event or a restore changes the ledger without going through the invalidation nobody remembered to
write — and the symptom is a wrong percentage, which is the one thing WO-2.4 exists to prevent.

**`percent: null` is not zero and must survive the refactor.** A student with no recorded meetings
reads "No recorded meetings"; a folded-counts implementation that initialises to `0` and divides
will produce `NaN` or a confident `0%` for exactly the students a teacher is most likely to be
looking at in the first week.

**Implementation run — 2026-08-08, correction round 1.** The first-round tree was run outside the
sandbox twice, both times green (`404 checks · 404 passed · 0 failed · 0 skipped`); the harness is
not broken. This round adds the missing active-filter/detail-open regression, filtered-out row,
exact dated-term detail, and `unconfirmAll()` checks. Its timing block now returns the nine samples
before touching the optional call-count seam, so it can also time `HEAD:src/attendance.js`, and its
fixture restore is persisted.

**Before/after pair — 2026-08-08, measured on the owner's machine.** Same harness, same fixture
(875 records / 175 meetings / 27 rows), same Edge, one sitting. The "before" was taken by checking
`HEAD` out into a detached worktree and copying this branch's `verify-shell.mjs` into it, so the
only difference between the two columns is `src/attendance.js`; the working tree was never swapped.
Each figure is the median of nine consecutive `renderAttendance()` calls.

| | run 1 | run 2 |
|---|---|---|
| **before** (`HEAD:src/attendance.js`) | 40.10 ms | 32.80 ms |
| **after** (this tree) | 9.20 ms | 9.20 ms |

**3.6–4.4× faster.** The after column is stable to the sample; the before column carries real
run-to-run spread (its nine samples run to 63–65 ms at the tail either way), which is why both runs
are recorded rather than one. The historical 76 ms does not reproduce on this machine — that is a
shifted baseline, not a discrepancy, and it is not what the pair above is measured against.

**The before tree fails one of the new checks, and that is the point.** Run against `HEAD`, the
harness reports `405 checks · 404 passed · 1 failed`, and the failure is *a filtered-out row and its
open detail repaint exact term/year totals after a mark*: on `HEAD` the row reads `Quarter 1 · P 87 ·
T 1 · A 2 · E 0 · D 0 · 98%` both before and after the mark — **stale** — while the detail beside it
repaints correctly. So the new check is not vacuous, and the refactor is not purely a performance
change: it also fixes a pre-existing stale total on a row the active filter has excluded. Acceptance
line 6 asks the *detail panel and class line* to stay byte-identical, and they do; the row was never
covered by it. Flagged here because a behaviour change nobody asked for is worth a sentence even
when it is an improvement — see also the `paintRenderedTotals()` wiring in `dropClass()`/
`undropClass()`, which the verifier judged correct but unrequested and which no check covers.

---

## WO-2.14 — Close two wo-gate blind spots found at WO-2.4

**Ship** — · **Status** ✅ DONE — 2026-08-08 · **Size** S · **Depends on** nothing

**Not a go-live blocker.** Added 2026-08-08, out of WO-2.4's close. *(The blank line above is
deliberate: `parseFile()` ends the header block at the first one, and `depsOf()` regex-scans
everything inside it for `WO-` tokens. WO-1.12 carries this note inside the block and is read as
depending on the work order that merely found it. This one depends on nothing on purpose — the gaps
were found at WO-2.4 but the fix touches only `tools/wo-gate.mjs`, and hanging it off a work order
that stays 🔨 IN PROGRESS until the owner's desk sitting would block it for a reason that isn't
real.)*

**Why it exists.** `tools/wo-gate.mjs` is the only script in `tools/` that writes into `plans/`, and
it is the only one nothing checks — `verify-shell.mjs` tests the app and `wo-sweep.mjs` reads a
diff, so the tool that edits the tracker runs unverified. WO-2.4 walked into two of its gaps in one
dispatch. Neither is an app defect; both let the tracker say something untrue, which is the failure
`plans/verification-tooling.md` keeps naming as worse than no check at all.

**The two gaps**

- **Nothing ever claims a work order, so the collision guard can never fire.** There is no
  `--start`. WO-2.4 sat at `⬜ NOT STARTED` through two Codex rounds, a correction brief and two
  verifier passes, because the only thing that writes a status is `--tick`, and `--tick` is the last
  step. Meanwhile `gate()` carries the guard built for exactly this — `wo-gate.mjs:169`, *"already
  🔨 IN PROGRESS — ask before proceeding"* — which no dispatch can arm. A second `/wo` with no
  argument would have had `next` hand it WO-2.4 and started building it in the same working tree,
  with nothing anywhere saying a run was already in flight.
- **`--tick` can only ever write `✅ DONE`.** `wo-gate.mjs:324-327` hardcodes the status; the fence
  at `:309` accepts `⬜ NOT STARTED` or `🔨 IN PROGRESS` and then flattens both to done. So the
  project's own convention — land at `🔨 IN PROGRESS` while 👤 or 🙋 lines are still owed, as at
  WO-2.1, WO-2.11 and WO-2.12 — is unreachable through the tool, and has been hand-edited every
  time. At WO-2.4 the offered maintenance was `--tick WO-2.4`, which would have stamped `✅ DONE` on
  a 🚩 go-live blocker with two acceptance lines still owed to the owner. It was caught by reading
  the source, not by the tool refusing.

The second gap is the one with teeth. `parseFile()` (`:43-78`) reads only the header block, so the
script has never looked at an Acceptance list — it will write "done" over a work order whose own
checkboxes say otherwise and report `PASS`.

**Deliverables**
- **`--start <ID>`**, refusing anything that is not `⬜ NOT STARTED`, writing `🔨 IN PROGRESS`, and
  honouring `--dry-run` the way `--tick` does. The orchestrator calls it after the routing decision
  and before the brief is written, which is what arms `:169`.
- **A way back.** An abandoned dispatch must not leave a permanent claim — see Traps.
- **`--tick` reads the work order's own Acceptance list.** If any line is still `[ ]`, write
  `🔨 IN PROGRESS` instead of `✅ DONE`, name the lines that held it open, and **leave the roadmap
  boxes unticked** — an unfinished work order closes nothing. `parseFile()` learns to find the
  Acceptance block; nothing else needs new knowledge, because the orchestrator already ticks by hand
  what it verified before it runs the tool.
- **`next` says what it skipped.** Claimed rows drop out of "next" the moment `--start` exists, and
  a running order that silently steps over a work order is how one gets forgotten.
- The claim step written into `ROUTING.md` and the orchestrator's own definition, so it is protocol
  rather than a flag nobody calls.

**Out of scope** — no new script and no `tools/lib/`; this closes blind spots in a file that already
exists and stays one file, per [`../verification-tooling.md`](../verification-tooling.md). No change
to what `--tick` touches: still one named work order, still never a 👤 line in `TESTING.md`, still
never `CHANGELOG.md`. Not a status for *why* a run stopped — `🚧 BLOCKED` already exists and is set
by a human.

**Acceptance**
- [x] `--start` on a `⬜ NOT STARTED` work order writes `🔨 IN PROGRESS`, and a **second** `--start`
      on the same ID exits non-zero. Prove it by running it twice, not by reading the fence.
- [x] `--start` refuses `✅ DONE`, `🚧 BLOCKED` and `🔒 GATED` without editing the file.
- [x] A claimed work order does **not** move either dashboard. They count finished work, and
      `recomputeDashboard()` (`:241`) must keep counting only `✅ DONE`.
- [x] The way back returns a claimed work order to `⬜ NOT STARTED`, and says so in one line.
- [x] **`--tick` on a work order with one unticked Acceptance line writes `🔨 IN PROGRESS`, not
      `✅ DONE`, and names that line.** Plant the violation: untick one line of a work order that
      would otherwise pass, run it, watch it refuse. This is the WO-2.4 case, reproduced.
- [x] That same refusal leaves every roadmap box it *Closes* unticked.
- [x] `--tick` on a fully ticked work order still writes `✅ DONE — <date>`, ticks its roadmap boxes
      and recomputes the dashboard. No regression on the path that works today.
- [x] `--dry-run` on `--start` and on the new `--tick` path prints the exact edit and writes
      **nothing** — compare the file before and after, don't trust the banner.
- [x] `next` names any `🔨 IN PROGRESS` row it stepped over, and why.
- [x] `verify-shell.mjs` and `wo-sweep.mjs` still run clean afterward — 400/400/0-skips and exit 0 —
      neither of which covers this file, which is the point of the planting above.

**Traps** — **Per `verification-tooling.md`'s precondition rule, a check that could not have caught
the gap it is named for is not evidence.** WO-1.12 proved each fix by planting the violation first
and watching the script fail; do the same here. A `--tick` that refuses a work order nobody unticked
has demonstrated nothing.

**The claim outlives the run, and that is the new failure this work order introduces.** A dispatch
that dies mid-flight leaves `🔨 IN PROGRESS` behind, `next` steps over it forever, and the work order
is lost from the running order while looking healthy — the tracker lying in the other direction. The
way back and the loud skip are why this is two deliverables and not one. `gate()` already has the
shape of the answer at `:179-181`, where a brief with no result over a dirty tree is reported as an
interrupted draft; a stale claim should be as loud.

**Do not let the two gaps become one flag.** `--start` writes a status because a run began;
`--tick`'s refusal writes the same status because the work is not finished. They arrive at
`🔨 IN PROGRESS` for unrelated reasons, and collapsing them into shared code is how a future
`--start` starts ticking checkboxes.

**Nothing here may make the status line harder to hand-edit.** Every `🔨 IN PROGRESS` in `plans/`
today was written by hand, including WO-2.4's, and will be again the first time this script is wrong
about something. The file stays the record; the tool stays a convenience over it.

*(**The glyph in the four ticked lines above is `🤖 CLAIMED` now** — 2026-08-09, WO-3.11. The Traps
paragraph two up was right and did not go far enough: keeping `--start` and `--tick`'s refusal in
separate code did not stop them meaning the same thing on the page, and `--release` could not tell a
dead dispatch from a work order that landed with lines owed. Everything those lines assert still
holds, with `🤖 CLAIMED` where they say `🔨 IN PROGRESS` for a claim; `🔨` keeps only the second
meaning, which is what `--tick` writes over an open Acceptance list. Nothing here was re-verified or
re-ticked — this note is so a reader running these lines by hand is not told the tool is broken.)*

---

## WO-2.15 — wo-gate tells the truth about its own writes

**Ship** — · **Status** ✅ DONE — 2026-08-09 · **Size** M · **Depends on** WO-2.14

**Not a go-live blocker, and deliberately after it.** Added 2026-08-08, out of WO-2.14's close. This
is the harness, not the app: a bug here makes the tracker lie, which is expensive and slow to
notice, but it never reaches a classroom. The sprint's governing rule is about code that writes
student data, and nothing in this work order does. **Do not pull it forward into Ship 1.**

**Why it exists.** WO-2.14 closed two gaps in `tools/wo-gate.mjs` and proved all ten of its
acceptance lines by planting violations and running them. Every one of those plants was unwound the
same hour, and the evidence for them now lives in a dispatch transcript. **In November there is
nothing.** `verify-shell.mjs` drives a browser and `wo-sweep.mjs` greps `src/`; neither can express
*"the tracker was told the truth"*, so the only script in `tools/` that writes into `plans/` is still
the only one nothing checks — which is exactly the sentence WO-2.14 was written to stop being true,
and it closed the gaps without closing that.

**And then a third gap turned up while ticking WO-2.14.** WO-2.5's **Closes roadmap** fragment quotes
*"Keyboard path on desktop and 44px touch targets. Both, not either."*; the roadmap box at
`ROADMAP.md:280` actually reads *"Keyboard path on desktop (row select, `P`/`T`/`A`/`E`, arrows) and
44px touch targets under…"*. The parenthetical is in the box and not in the quotation, so
`roadmapEdits()` (`:453-471`) matches zero boxes. That is *reported* — `misses` prints
`NOTE | roadmap: "…" matched 0 roadmap boxes — not ticking it` at `:548` — and then the run says
`PASS` and exits 0. **Same family as the two WO-2.14 closed: the tool does something other than what
it was asked, says so quietly, and nothing stops.** Nobody has ticked WO-2.5 yet, so the roadmap box
it is supposed to close would simply have stayed open with a green run behind it.

**Deliverables**
- **A standing check on `wo-gate.mjs`, inside `wo-gate.mjs`.** `--self-check` copies `plans/` to a
  temp directory, plants the violations WO-2.14 proved by hand — an unticked acceptance line, a
  double `--start`, a `--start` on `✅ DONE`, a `--release` of nothing, a `--dry-run` that must write
  nothing — runs the script against the copy, and fails if any of them stops being caught. One flag,
  one exit code, no new file.
- **Decide what a zero-match `Closes roadmap` fragment is**, and make the tool act on the decision.
  The recommendation is that it becomes a `HELD`, not a `NOTE`: a work order that names a roadmap box
  and closes none of them is either quoting a box that moved or quoting one that never existed, and
  both want a human before the status line says done. Whatever is chosen, the reasoning goes in a
  comment at the point of decision.
- **Fix WO-2.5's fragment** so it matches `ROADMAP.md:280`, and **sweep every other work order's
  `Closes roadmap` line for the same rot** — a fragment written against a roadmap box that has since
  been reworded fails silently and only at tick time, which is the worst moment to discover it. The
  sweep should also find the fields the tool does not know exist: WO-2.13 carries an **Amends
  roadmap** clause on its `Depends on` line, which `depsOf()` scrapes into the dependency field and
  reports as prose, and which nothing else in the script has ever heard of. Decide whether that field
  is real; if it is, it needs handling, and if it is not, it should not be in a header block.
- Whatever the sweep finds, recorded where the next person will see it rather than fixed and
  forgotten.
- **A drift check on `ROADMAP.md`'s progress dashboard.** Count the ticked and total boxes under
  each `## Phase N` heading and compare against that phase's dashboard row, including the overall
  total — which must also equal the sum of its own rows. **Report only, never write**: the
  out-of-scope rule below still binds, and `--tick` touches the same files after this work order
  that it touches before it. This is *not* a `--self-check` item — that flag plants violations and
  tests the tool, whereas this checks the documents, so it rides the normal run and takes the same
  `HELD`-versus-`NOTE` decision as the zero-match fragment above. **Why it is here:** `ROADMAP.md:36`
  makes updating the dashboard row a manual fourth step, `wo-gate.mjs` only ever writes the dashboard
  in `work-orders/README.md`, and nothing reads the roadmap's back. Found 2026-08-08 with Phase 1
  reading `🔨 IN PROGRESS · 11/12` against **twelve ticked boxes and zero unticked** — Phase 1 having
  closed on 2026-08-06 — Phase 2 reading 10/16 against twelve, and an overall of 22/81 where the rows
  sum to 25/82. Three wrong numerators, and a denominator wrong independently of all of them.

**Out of scope** — no new script and no `tools/lib/`, per
[`../verification-tooling.md`](../verification-tooling.md); `--self-check` lives in the file it
checks or it does not exist. **No second harness**: this does not grow into a test framework, and if
it starts wanting one, stop and say so. No change to what `--tick` writes or to which files it may
touch. Not a fix for the `'504'` needle in `verify-shell.mjs` — that was repaired on 2026-08-08 and
is a different file's problem.

**Acceptance**
- [x] `--self-check` passes on the current tree, and the run says how many plants it made — "0 plants
      passed" is what a broken self-check prints, and it must be visible rather than inferred.
- [x] **Each plant is proved to be able to fail.** Restore the pre-WO-2.14 script from git into a
      temp path, run `--self-check` against it, and watch the acceptance-list plant and the
      double-`--start` plant report failures. A self-check that passes against the code it was
      written to catch is not evidence.
- [x] `--self-check` writes nothing inside the repository. Hash `plans/` before and after; compare
      the hashes, not the banner.
- [x] `--self-check` leaves no temp directory behind on either exit path, including the failing one.
- [x] A work order whose `Closes roadmap` fragment matches zero boxes is handled per the decision
      above, and the behaviour is demonstrated on a planted fragment rather than on WO-2.5 — WO-2.5
      is being fixed in this same work order and cannot be the fixture that proves it.
- [x] WO-2.5's fragment matches exactly one roadmap box — proved by the fragment sweep below, **not
      by `--tick WO-2.5 --dry-run`**, which no longer works and cannot be made to. WO-2.5 shipped on
      2026-08-08, so that command now exits `FAIL | WO-2.5 is "✅ DONE" — only ⬜ NOT STARTED or
      🔨 IN PROGRESS may be ticked`, and `ROADMAP.md:280` was hand-ticked the same day, so even a
      corrected fragment has no edit left to plan. If a live `--tick` demonstration is still wanted,
      do it inside `--self-check`'s temp copy of `plans/`, where the status line and the roadmap box
      can both be rolled back to their pre-2026-08-08 values and the run costs the repository
      nothing. **This line was rewritten on 2026-08-08, the day its fixture was spent** — the same
      family of rot this work order exists to catch, arriving in its own acceptance list.
- [x] Every `Closes roadmap` fragment in `plans/work-orders/` is reported as matching exactly one
      box, or listed as not doing so with the reason. Run it over all of them, not a sample.
- [x] Every `## Phase N` row in `ROADMAP.md`'s dashboard matches the box counts under its own
      heading, or is reported as not doing so **with both numbers shown**; the overall row is
      checked against the sum of the rows as well as against the file. **Prove it on a planted
      wrong count in a temp copy** — the tree's own three wrong rows are being corrected by hand
      before this work order lands and cannot be the fixture. *(That sentence is the lesson from
      acceptance line 6 above, which named a fixture that was spent the day WO-2.5 shipped. A work
      order about drift should not keep writing acceptance lines that drift.)*
- [x] `--tick`, `--start` and `--release` behave exactly as they did before on the paths that already
      work — WO-2.14's acceptance list, re-run.
- [x] `verify-shell.mjs` and `wo-sweep.mjs` still run clean afterward — **all checks passing, zero
      skips, exit 0, and the count matching whatever `tools/README.md` says at the time**. No number
      is written here on purpose: this line read `400/400` until 2026-08-08, by which point the tree
      was at 428 and the line had been quietly wrong for three work orders. A hardcoded total in an
      acceptance box goes stale every time the harness grows, which is every work order.

**Traps** — **The precondition rule applies to the self-check itself, one level up.** WO-1.12 and
WO-2.14 both proved a fix by planting the violation and watching the script fail. A `--self-check`
is a check on checks, and the same rule bites harder: the way it fails is by planting something the
current script happens to catch for an unrelated reason, then passing forever. The second acceptance
line — run it against the old script and watch it go red — is the whole guarantee here, and it is
the one to do first, not last.

**The temp copy is the only safe fixture, and getting it wrong is the worst bug in this file.** A
self-check that plants an unticked acceptance line in the real `plans/` and then dies before
unwinding leaves corrupted tracker state that looks hand-written. Copy first, operate on the copy,
and never let a plant path take a real repository path — not even under `--dry-run`, because the
next edit to that code will remove the flag.

**A green self-check is not coverage, and the run should not imply it is.** This checks the handful
of behaviours WO-2.14 built and nothing else — not the Acceptance parser against all 61 work orders,
not `recomputeDashboard()`'s arithmetic, not `next`'s ordering. Say what it covers in the output, or
the next reader will trust it for the parts it never touched.

---

## WO-2.16 — the self-check states its precondition, and `**Blocks**` stops being a dependency

**Ship** 2 · **Status** ✅ DONE — 2026-08-09 · **Size** S · **Depends on** WO-2.15

**Not a go-live blocker, and the same kind of work as WO-2.15.** Added 2026-08-09, out of WO-2.15's
verification. Harness, not app: nothing here writes student data or reaches a classroom. **Do not
pull it into Ship 1**, which closed on 2026-08-08.

Two findings from WO-2.15's own verification, neither of which failed one of its acceptance lines,
and both of which are in the code it shipped. They are one work order because they are both the same
shape — the tool doing something defensible and describing it wrongly.

**Why it exists — one.** `--self-check` copies the live `plans/` (`wo-gate.mjs:1003`), so it inherits
whatever drift the trackers are carrying, and drift makes plants fail. Proved 2026-08-09 in a scratch
copy of `plans/` and `tools/` outside the repository: set one `## Phase N` dashboard row to `11/12` —
the exact drift this tree carried on the morning of 2026-08-08, before WO-2.15 corrected it — and the
run prints `9 plants, 7 caught, 2 missed` and exits 1. The two it names are *"`--dry-run` on
`--start`, `--release` and `--tick` writes nothing at all"* and *"a fully ticked work order still gets
✅ DONE, its roadmap box, and the dashboard"*. **Neither of those is what went wrong.** Both plants
behaved perfectly; the copied `ROADMAP.md` earned a `HELD`, which is `--tick` doing exactly what
WO-2.15 built it to do, and the 160-character clip at `wo-gate.mjs:1182` cuts the message off before
the reason arrives. So the self-check has a precondition it has never stated — the trackers must
already be clean — and announces the violation as two unrelated plant failures.

**And on 2026-08-09 it stopped being theoretical — `--self-check` is red on the tree as of the Ship 2
table.** The `next` plant claims the fixture row and expects `next` to step over it and offer *"the
one ⬜ NOT STARTED row in the table"*. That expectation is written into the plant, and the comment at
`wo-gate.mjs:1025-1026` says why: *"Every real row in that table is ✅ DONE, so a run against the copy
without this would exercise nothing."* True on 2026-08-08, when Ship 1 had just closed and the
running order was empty. False on 2026-08-09, when a Ship 2 table put twelve ⬜ NOT STARTED rows
ahead of the fixture — so `next` now answers WO-2.16 and never reaches it, and the plant reports
three failures, none of which is a defect in `next`.

**Nothing is wrong with the tool's writes.** `--audit` passes, `--tick`, `--start` and `--release`
are untouched, and the repository is not in a bad state. What is broken is the self-check's fixture,
by a *documentation* edit — which is the sharpest possible statement of the problem: a check on the
tool is failing because of something that is not the tool. Until this work order lands, a red
`--self-check` cannot be read at face value, and *"a control that goes red for a reason the reader
learns to dismiss is worse than no control"* is this project's own rule, written down at WO-1.12.

The fix is the same one the precondition deliverable asks for, one level along: **the fixture must
not depend on what the live running order happens to contain.** Give the fixture its own table, or
its own copy with the real rows neutralised, or assert against its own row rather than against *the
one* NOT STARTED row. Whichever is chosen, the comment at `:1025` gets rewritten, because the
sentence that made the old assumption reasonable is the sentence that made it invisible.

It fails loud, which is the safe direction to be wrong in, and that is why this is `S` and not `M`.
The cost is a reader's morning: the first thing a red self-check makes you do is go and read the two
plants it named, which are fine. Note the boundary, because it is not obvious — drift in
`work-orders/README.md`'s dashboard does **not** trip it (also checked), since `--tick` recomputes
that table itself. Only what can earn a `HELD` does: `ROADMAP.md` dashboard drift, and a
`Closes roadmap` fragment that matches no box.

**Why it exists — two.** `**Blocks**` is a header field nothing has ever heard of, and it is being
read as a dependency:

- `phase-1-shell-store-roster.md:15` — WO-1.1 carries `**Depends on** nothing · **Blocks** everything`
  on its status line, and `node tools/wo-gate.mjs WO-1.1` reports
  `depends (prose) nothing · **Blocks** everything`. Harmless, and visibly odd.
- `phase-1-shell-store-roster.md:195` — WO-1.5 carries `**Blocks** WO-1.6 and every work order after
  it` on its own line under the header, and `node tools/wo-gate.mjs WO-1.5` reports
  `depends WO-1.6 ✅ DONE`. **That is the relationship backwards.** WO-1.5 is the backup-and-restore
  work order that WO-1.6 waits on — the one hard ordering constraint in the whole sprint — and the
  gate reads it as WO-1.5 waiting on WO-1.6. Both are done, so nothing is gated wrongly today, and
  that is luck rather than design: the same line between two open work orders is a cycle, and the
  gate would report the ordering satisfied while pointing the wrong way down it.

WO-2.15's deliverable three asked for exactly this — *"the fields the tool does not know exist"* —
and found **Amends roadmap** while walking past this one. The new field table at
[`README.md:44-48`](README.md) documents five fields and not this one.

**And a second unknown field, found 2026-08-09 while rewriting WO-G2's dependency line:**
`**Target**`, which three of the four gate work orders carry on the line under their header
(`gates.md:14`, `:183`, `:219` — WO-G4 has none, since the 1.0.0 call is the one gate no calendar can
set). It lands in the same place — `node tools/wo-gate.mjs WO-G2` ends its
dependency report with `(prose) … **Target** ~2026-09-15, before the first grades are entered for
real`. Harmless today, because a date carries no `WO-` token to be misread as a dependency. It is
here because it is the third instance of one defect: **any line in the header block that is not
`Depends on` is absorbed into `Depends on`.** Fix the class, not the three fields — and if the fix
is per-field, say in a comment why the general one was rejected.

*(That same rewrite found the other half of this: `WO-2.5 … WO-2.7` was read as two tokens rather
than a range, so WO-2.6 sat in the middle of WO-G2's dependency line gating nothing. That one is
fixed in place rather than in code — an ellipsis range is a thing a human writes and a parser should
not be taught to guess at. If this work order adds anything there, it is a **warning** when a
dependency line contains `…` between two `WO-` tokens, never an expansion.)*

**Deliverables**
- **`--self-check` says what it requires and checks it first.** Run the drift readers `--audit`
  already has over the copy before any plant is made, and if the copy is not clean, stop with that as
  the reason — the trackers' drift, named, and the command that shows it — rather than running nine
  plants and reporting two of them red. A plant failure should mean a plant failed.
- **Un-couple the `next` plant from the live running order — this one is red right now**, and it is
  the first thing to fix, because until it is green nothing else in this work order can be verified
  by a passing run. The plant asserts against *"the one ⬜ NOT STARTED row in the table"*; give it its
  own row to assert against, or its own table, or neutralise the real rows in the copy. Rewrite the
  comment at `wo-gate.mjs:1025-1026` with it — the sentence that made the assumption reasonable in
  August is the sentence that will hide the next one.
- **The clip stops hiding the reason.** Whatever the plant failure prints, `HELD` and its cause must
  survive into the output. Decide whether that is a longer clip, the last line rather than the first,
  or the whole captured run behind a flag; the reasoning goes in a comment at the point of decision.
- **Decide whether `**Blocks**` is a real field**, and make the tool act on the decision. The
  recommendation is that it is real and is treated as **Amends roadmap** is — parsed, reported,
  never acted on — because it is genuine information a human wants at the top of a work order and it
  reads naturally beside `Depends on`. Whatever is chosen, **no `WO-` token on a `**Blocks**` line
  may reach `depsOf()`**, and the field table in `work-orders/README.md` gains a row either way.
- **A third thing, which is the actual lesson:** an unknown header field currently fails by being
  silently absorbed into the nearest known one. Say in the field table what happens to a field that
  is not in it, so the next person who invents `**Supersedes**` finds out from the document rather
  than from a gate report that reads plausibly and is wrong.

**Out of scope** — no new script and no `tools/lib/`, per
[`../verification-tooling.md`](../verification-tooling.md). No new plants beyond what the precondition
check needs; `--self-check` is not growing into a test framework, and if it starts wanting to, stop
and say so. **No change to what `--tick`, `--start` or `--release` write**, or to which files they may
touch — this work order changes what the tool *says*, and its reading of one field, and nothing about
its writes. Do not correct the two `**Blocks**` lines' prose; they are the fixtures.

**Acceptance**
- [x] With `ROADMAP.md`'s dashboard drifted in a temp copy, `--self-check` stops before planting and
      names the drift as the reason. **Prove it on a planted row in a copy outside the repository** —
      the tree's own rows are clean as of 2026-08-08 and cannot be the fixture, and planting drift in
      the live `plans/` to test a drift check is how a bad morning starts.
- [x] The same, for the other thing that earns a `HELD`: a `Closes roadmap` fragment matching zero
      boxes in the copy.
- [x] On a clean tree, `--self-check` still passes with all nine plants caught and still says how
      many it made — the precondition check must not cost a plant.
- [x] **The `next` plant passes with a populated running order**, which is the state the tree has
      been in since 2026-08-09 and the state it will be in for every phase from here. Prove it both
      ways: with ⬜ NOT STARTED rows ahead of the fixture, and with none — the second is the
      condition that has been silently holding the plant up since it was written.
- [x] A plant that genuinely fails still reports as a plant failure, with the `HELD` reason visible
      rather than clipped away. Prove it by mutating the subject script, not by drifting the
      trackers — those are the two cases this work order exists to tell apart, so the evidence has to
      tell them apart too.
- [x] `node tools/wo-gate.mjs WO-1.5` no longer reports `WO-1.6` as a dependency, and WO-1.5's
      `**Blocks**` line is unchanged on disk.
- [x] `node tools/wo-gate.mjs WO-1.1` no longer scrapes `**Blocks** everything` into its dependency
      field.
- [x] `--list` and `next` are unchanged on every other work order — diff the full output of both
      against the same commands run before the change, and show that the only differences are the two
      lines above.
- [x] `**Blocks**` has a row in `work-orders/README.md`'s field table, and the table says what becomes
      of a field that has no row.
- [x] `--self-check` writes nothing inside the repository and leaves no temp directory on either exit
      path, including the new early one. **The early exit is a new exit path** — WO-2.15's acceptance
      line 4 was written before it existed.
- [x] `verify-shell.mjs` and `wo-sweep.mjs` still run clean afterward — all checks passing, zero
      skips, exit 0, and the count matching whatever `tools/README.md` says at the time.

**Traps** — **The precondition check must not become a tenth plant.** It runs over the copy before
any plant exists, it tests the trackers rather than the script, and folding it into the plant loop is
how a future reader concludes the trackers are what `--self-check` checks. They are its fixture.

**Do not fix the drift you find.** If the precondition check goes red on the real trees while this is
being built, that is `--audit`'s job and a separate edit with a human behind it. A self-check that
repairs `plans/` to make itself pass is the worst possible version of this tool.

**`**Blocks**` is prose written by a hand, not a schema.** WO-1.5's line ends with
`— **unblocked as of 2026-08-04**`, and WO-1.1's says `everything`. Neither is a list of work order
IDs, and code that assumes it is will be wrong the third time someone writes one. Parse it as
reportable text that happens to contain `WO-` tokens, exactly as `Depends on` already does for its
prose tail — and make sure the tokens go nowhere near the gate.

---

## WO-2.17 — the term nav repaints the screen it is sitting on

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** nothing
**Closes roadmap** *(no box. This is a defect found by WO-3.3's verification, in code Phase 2
shipped — it closes no product box, and inventing one to make the dashboard tidier is the drift
WO-2.15 and WO-2.16 exist to catch.)*

**Why it exists.** `classes.selectTerm()` writes the preference, repaints the class bar, and announces
the change (`src/classes.js:477-490`). It repaints **nothing else**. That was right while the term nav
sat on exactly one screen and that screen did not care: the attendance registry is a window of recent
dates, and the columns do not move when the term does.

**But the totals under it are term-scoped, and they always have been.** `paintClassTotals()` is fed
`totalsForRender(cls, getSelectedTerm(), visibleStudents(cls))` — `src/attendance.js:3405`, and again
at `:3174` and `:3289`. So tapping *Quarter 2* on the registry moves the highlight in the header, says
"Quarter 2 is open" out loud, and leaves **Quarter 1's percentages on the screen**, with nothing to
tell the teacher which term the number belongs to. It corrects itself on the next repaint from any
other cause, which is what has kept it invisible: mark one student and the numbers jump, and the jump
reads as the mark landing rather than as the term finally arriving.

**Found by WO-3.3's verifier on 2026-08-09**, in the assignment list rather than here — that screen is
term-filtered top to bottom, so the whole body went wrong at once instead of one line of it, and the
defect was impossible to miss. WO-3.3's correction round fixed its own screen in one line
(`src/shell.js:614-628`) and deliberately did **not** reach into attendance: repainting the registry
from that branch would have hidden this rather than fixed it, and the note at `shell.js:624-626` says
so at the point of departure. This work order is the other half, booked where the code lives.

**The general shape, which is the reason this is a work order and not a one-line patch.** The term nav
is a header control that every class screen sits underneath, and the number of those screens is
growing — attendance, assignments, and WO-3.5's score grid, which is term-filtered by construction.
Each new screen that reads `getSelectedTerm()` and does not repaint on a term change is this same bug
again. The fix should make the repaint a property of the term change rather than a thing each screen
remembers to ask for.

**Deliverables**
- **A term change repaints whatever class screen is up.** The pattern to match is
  `afterCategoryChange()` in `src/shell.js` — the chain the category controls already use, and the one
  WO-3.3's assignment-list line was hung off.
- **The registry's totals line is correct immediately after a term switch**, with no second action
  needed to bring it right.
- **The order of operations stays in `src/shell.js`.** `src/classes.js` must not learn what screens
  exist; its header records that it is the read point for "which class, which term" and nothing more,
  and an import from it into the screens would close a loop this repo has refused four times.

**Out of scope** — the term nav's own appearance, `openTermIds`, and anything about which term is
*selected*. This is about what repaints after it changes, not about the choice.

**Acceptance**
- [ ] Switching term on the attendance registry updates the totals line in the same paint — no mark,
      no reload, no second tap.
- [ ] Switching term on the assignment list still repaints it (WO-3.3's line, which must not regress).
- [ ] A screen that does not read the term is not repainted by a term change — the fix is a chain, not
      a blanket repaint of everything.
- [ ] `src/classes.js` gains no import from a screen module, and `selectTerm()` still returns without
      writing when the term id does not belong to the open class.
- [ ] The harness proves the pre-fix failure: a check that reads the totals line after a term switch
      and goes red against the current code. 👤 *not needed — this one is measurable at the desk.*

**Traps** — **Do not fix this by repainting every class screen on every term change.** The registry
paints a grid of students × days and the score grid will be larger still; a blanket repaint is a cost
that arrives on the flow the whole app is measured by, and `src/attendance.js`'s own history is one
long argument about paint cost (WO-2.13 exists because the totals were computed once per student).
Paint what is up, the way `afterCategoryChange()` does. **And do not move the term resolution into a
screen module** to make the repaint easier — `src/classes.js:6-12` argues that classes and terms are
not separable, and the resolution living in one place is why a preference naming a removed term
answers correctly everywhere.
