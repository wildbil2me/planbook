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

**Ship** 2 · **Status** ✅ DONE — 2026-08-11 · **Size** M · **Depends on** WO-2.4
**Closes roadmap** Phase 2 → "Per-student attendance history view" and "Print/CSV output for the
attendance record."

**Why it exists.** Cut from Ship 1 because the data is being recorded either way and the views can
follow. It becomes urgent the first time a guardian conference asks "which days?"

**Deliverables**
- Per-student history: every recorded meeting, its mark, and the running percentage, per term.
- Print view and CSV export of the attendance record for a class and term.
- Presentation-mode safe: no `supports` data on either surface.

**Acceptance**
- [x] A student's history lists exactly the meetings counted in their percentage — the two agree.
- [x] The CSV opens cleanly in a spreadsheet with dates as columns.
- [x] The print view fits a class on a page and carries the class, term, and date range.
- [x] Neither surface emits accommodation, medical, or plan data.

*Three of the four measured at a desk on 2026-08-11 — `verify-shell.mjs` 582 of 582, eighteen of them
new, six mutations reverted. `TESTING.md` § WO-2.6 carries the evidence line by line and the mutation
table.*

***The fourth was settled on paper the same day, and the two halves are worth keeping apart.*** *The
desk half of the print line was always measurable and was measured — the header carries the class,
the term, the date range and the count of recorded meetings, and a term of thirty meetings comes out
as two slices of twenty-four and six columns rather than one table nobody could print. What no
emulator has is a sheet of paper, and* **fits a class on a page** *is a claim about paper: the roster
down the page and the margins around it. The owner printed one on 2026-08-11 on the printer she has,
from a term of* **42 recorded meetings** *— the case that actually exercises the page break and the
repeated student column, where anything under twenty-four draws a single slice and proves neither.
All four* 👤 *lines in* `TESTING.md` *§ WO-2.6 were closed in the same sitting.*

***The CSV line is the one to read carefully, because it was ticked at a desk and the desk could not
have known.*** *The bytes were asserted character by character — BOM, CRLF, quoting, one row per
student, ISO dates as the columns — and the verifier still called the tick unsupportable, on a sharp
point: no name anywhere in the harness contains a non-ASCII character, so the* **BOM was asserted
present and never asserted useful**. *The owner's own roster settled it on 2026-08-11, accents
intact. The gap is worth remembering rather than closing quietly: an all-ASCII fixture set will keep
passing a UTF-8 claim it never tests, and the next export surface inherits that hole.*

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

**Ship** 2 · **Status** ✅ DONE — 2026-08-14 · **Size** M · **Depends on** WO-2.11
**Closes roadmap** Phase 2 → "Overdue alerts, the elapsed clock, and pass history" *(field added
2026-08-13, on the build: the box has existed since the Ship 1 cut and no work order named it, so
nothing would have ticked it. `--audit` resolves it to exactly one box.)*

*Built 2026-08-13 — `verify-shell.mjs` **732 of 732**, `wo-sweep.mjs` 15 passed / 0 failed / 2
standing reviews, with four mutation proofs behind the new checks. Four of the five acceptance lines
are closed at the desk; **acceptance line 1 stays open on purpose** — ten minutes of a real
backgrounded PWA is not something a headless browser has, and `TESTING.md` § WO-2.9 lists the sitting
it is owed along with five other 👤 lines. Two things worth knowing about the build: the fired-ness of
an alert is a field on the open pass (`alerted`, documented in `docs/data-model.md`) rather than a
module variable, which is the same inversion WO-2.8 made about the pass itself and is what makes
"fires once" survive a force-quit; and the history is a new module, `src/pass-history.js`, rather than
a section of `src/attendance-report.js`, because that file's header promises never to import
`src/supports.js` and this surface has to ask it.*

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
- [x] Elapsed time is correct after the app has been backgrounded for ten minutes. 👤 *(Closed by the
      owner 2026-08-14, on the installed iPad, along with the other six 👤 lines in one sitting — the
      Traps warning is the thing that was measured and the clock survived it. The desk half stands
      behind it: the stored stamp is wound 41 minutes into the past through the store with no timer
      running, and the next paint reads `41:0x` — a build that counted ticks reads `0:0x`.)*
- [x] Both alerts fire once each, not repeatedly, and not again after the student returns. *(All
      three clauses measured. The fired level is a field on the pass — `alerted` — so it survives a
      repaint, a reload and a force-quit, and it is gone with the record when the student is back.)*
- [x] The history view's totals match the log; a hand count of one student's passes agrees. *(The
      expected numbers are computed in Node off `doc.passes`, so the dialog is compared with the
      record rather than with the module that drew it.)*
- [x] A cancelled pass appears in no history view and in no total — WO-2.11 writes nothing, and this
      is the work order that would notice if that stopped being true. *(Measured as a before-and-
      after over the whole dialog; mutating `cancelPass()` into a zero-minute return turns five
      checks red, one of them this one.)*
- [x] Presentation mode suppresses names in the history view. *(Both readings: no name and no door
      in the class table, and the student view refuses through the module rather than through a
      missing button. The mode-off pass is asserted first, so the absence means something.)*

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

**Ship** 2 · **Status** ✅ DONE — 2026-08-10 · **Size** S · **Depends on** nothing
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
- [x] Switching term on the attendance registry updates the totals line in the same paint — no mark,
      no reload, no second tap.
- [x] Switching term on the assignment list still repaints it (WO-3.3's line, which must not regress).
- [x] A screen that does not read the term is not repainted by a term change — the fix is a chain, not
      a blanket repaint of everything.
- [x] `src/classes.js` gains no import from a screen module, and `selectTerm()` still returns without
      writing when the term id does not belong to the open class.
- [x] The harness proves the pre-fix failure: a check that reads the totals line after a term switch
      and goes red against the current code. 👤 *not needed — this one is measurable at the desk.*

**Traps** — **Do not fix this by repainting every class screen on every term change.** The registry
paints a grid of students × days and the score grid will be larger still; a blanket repaint is a cost
that arrives on the flow the whole app is measured by, and `src/attendance.js`'s own history is one
long argument about paint cost (WO-2.13 exists because the totals were computed once per student).
Paint what is up, the way `afterCategoryChange()` does. **And do not move the term resolution into a
screen module** to make the repaint easier — `src/classes.js:6-12` argues that classes and terms are
not separable, and the resolution living in one place is why a preference naming a removed term
answers correctly everywhere.

---

## WO-2.18 — the term-switch checks cover every surface the repaint paints

**Ship** 2 · **Status** ✅ DONE — 2026-08-10 · **Size** S · **Depends on** WO-2.17 · **Blocks** nothing, and
that is the point — it is the row to cut first if the fortnight tightens
**Closes roadmap** *(no box. Harness, not app: nothing here changes what a teacher sees. It closes no
product box, and inventing one would be the drift WO-2.15 and WO-2.16 exist to catch — the same call
WO-2.17 made.)*

**Not a go-live blocker.** Added 2026-08-10, out of WO-2.17's verification. Nothing here writes
student data or reaches a classroom, and **nothing here is a defect in what WO-2.17 shipped** — the
behaviour is correct today. What is missing is the check that would notice if it stopped being.

**Why it exists.** `paintRenderedTotals()` paints **three** surfaces that know which term is open —
the class line, one line per student row, and the open detail panel (`src/attendance.js:3300-3306`).
Its own header comment says so, in those words. WO-2.17's seven harness checks assert the first two
and **no fixture has a detail panel open across the term switch**. So deleting `paintDetail(totals)`
at `src/attendance.js:3306` leaves all seven green while an open panel keeps the previous term's
figures on screen — which is the original WO-2.17 defect, surviving inside the work order that fixed
it, on the one surface a teacher opens *because* she wants the detail.

**A check that asserts two of three painted surfaces licenses the third to be deleted.** That is the
general statement, and it is worth more than the instance: this is the second time on this chain that
correct numbers have been mistaken for a correct fix. WO-2.17's verifier ran a blanket-repaint
mutation and watched both "the figures moved" checks stay green — the row sentinel was the only thing
that separated the right fix from a wrong one that computed the right answer. Same shape here, one
surface along.

**And the second half of an Acceptance line was read rather than run.** WO-2.17's fourth line asks
that `selectTerm()` still return without writing when the term id does not belong to the open class
(`src/classes.js:478-479`). Nothing in the harness ever drives it with another class's term id, so
that half was confirmed by reading the guard. The guard is two lines and obviously right, which is
exactly the condition under which a guard gets refactored away — and the failure it prevents is a
preference naming a term the open class does not have, which is the case `src/classes.js:480-483`
keys the whole preference per class to avoid.

**Deliverables**
- **A check with a detail panel open across the term switch**, asserting the panel's own figures move
  with the class line and the row line. The WO-2.17 fixture already builds what this needs — two dated
  terms, `wo217-student`, three meetings against five — so this extends that block rather than
  standing up a second one.
- **The check is proved by a mutation, and the proof is written down.** Drop `paintDetail(totals)` at
  `src/attendance.js:3306`, run the harness, and the new check must go red **while the other seven
  stay green**. If they all go red, the fixture is coupled and the check is not measuring what it
  claims. Record the mutation and its result in `tools/README.md`, the way WO-2.17's is.
- **A check that drives `selectTerm()` with a term id belonging to a different class** and asserts
  that nothing was written: the preference unchanged, the class bar unmoved, and no announcement. Two
  classes with terms already exist in the fixtures; this needs an id from one aimed at the other.

**Out of scope** — anything in `src/`. If a check goes red against current code, that is a defect
found and it gets its own work order; do not fix the app from inside this one. And **no new fixture
year** — everything here hangs off what WO-2.17 already builds.

**Acceptance**
- [x] With a detail panel open, switching term moves the panel's figures in the same paint as the
      class line and the row line.
- [x] Deleting `paintDetail(totals)` at `src/attendance.js:3306` turns the new panel check red and
      leaves WO-2.17's seven green — run, not reasoned, with the counts before and after quoted.
- [x] `selectTerm()` called with another class's term id writes no preference, moves no highlight and
      announces nothing — asserted from the harness rather than from reading the guard.
- [x] `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` shows no new line.
- [x] `src/` is byte-identical to HEAD across the whole work order.

**Traps** — **Do not widen `paintRenderedTotals()` to make it easier to observe.** The narrowness is
the deliverable WO-2.17 shipped, and a check that needs the code changed to be checkable is measuring
the change. **And do not assert the detail panel by re-reading the totals map** — read the text the
teacher reads, out of the panel in the DOM, for the same reason WO-2.17's row sentinel is an attribute
on a surviving element rather than a count: a figure recomputed correctly and never painted is the
whole bug.

---

## WO-2.19 — the harness's own check count is checked

**Ship** — · **Status** ✅ DONE — 2026-08-10 · **Size** S · **Depends on** nothing — `wo-sweep.mjs` and the
count line in `tools/README.md` both exist today · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15 and WO-2.18 made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-10, out of WO-2.18's verification. It sits
outside the delivery plan the way WO-2.14 and WO-2.15 do: it buys a teacher nothing, it is not on
WO-G2, and no row of the Ship 2 table moves for it.

**Why it exists.** `tools/README.md` records how many checks `verify-shell.mjs` runs — **537 at
WO-2.18** — and that number is maintained by whoever lands a work order remembering to update it. The
file says so in as many words: *"Update this line when you add checks."* **It has now been missed
twice.** WO-1.5's line said 79 when the real number was 82. WO-2.18 arrived to find it saying 522
against a tree that measured 535, because WO-3.4's thirteen grade-engine checks landed without
reaching it — so the arithmetic `522 + 2` would have written 524, and read as a green run thirteen
checks smaller than it was.

**A number that is maintained by remembering is not maintained.** The file's own footnote already
argues the standard — *"a count that is nearly right is the same problem as a stale one"* — and the
remedy it prescribes is thirty seconds of care per work order, which is precisely the thing that has
failed twice. This is the general statement and it is worth more than the instance: `wo-sweep.mjs`
exists because `plans/verification-tooling.md` directs grep-shaped checks out of the browser and into
a grep, and *how many times does this file call `check()`* is grep-shaped.

**Why nobody has folded it into another work order.** WO-2.18's implementer proposed exactly this and
judged it too small to book, to be picked up by "the next work order that touches the sweep." Nothing
left on the board touches the sweep — Phase 2's remainder is WO-2.6, WO-2.7 and WO-2.9, Phase 3 is
product screens, and the gates are ship checkpoints. So *the next one that touches it* is never, which
is how the third miss happens.

**The measurement that makes this harder than it sounds, taken 2026-08-10 on `6e90e53`.** The sweep
can count call sites; the README records executed checks; **the two numbers are not the same and the
gap is unexplained.** `grep -c 'check(' tools/verify-shell.mjs` is **542**. One is the definition at
`tools/verify-shell.mjs:68`. One is an `else check(` at `:10563`, which a line-anchored pattern misses.
That leaves roughly **541 call sites against 537 executed** — four sites that a run does not reach,
presumably conditional branches, and nobody has yet said which four. Settling that is most of this
work order; a check asserting `541 === 537` written by rounding the difference away would be worse
than no check at all.

**Deliverables**
- **A check in `wo-sweep.mjs` that counts `check()` call sites in `verify-shell.mjs` and compares them
  against a number recorded in `tools/README.md`**, failing on disagreement with `file:line`, in the
  shape the sweep's other checks take. The pattern carries its own written-down allowlist, per that
  file's convention — the definition and any non-call occurrence are named there rather than
  re-derived by the next reader.
- **The four-site gap, named.** Whichever four call sites a run does not reach are identified and
  written into `tools/README.md` alongside the count, with the reason. If the gap turns out to be
  structural rather than a fixed four — a `check()` inside a loop makes call sites permanently unequal
  to executed checks — say so and record the number the sweep is actually asserting, so the paragraph
  claims what it can prove and not one word more.
- **Proved by mutation in both directions, and the proof written down.** Add a throwaway `check()` to
  `verify-shell.mjs` and the sweep must go red without the README being touched; correct the README
  and it must go green. Both reverted, in the tabulated form `TESTING.md` § WO-2.18 uses.

**Out of scope** — anything in `src/`, and anything that changes what `verify-shell.mjs` prints or how
it counts. This work order asserts the existing number; it does not redesign the reporting. If a
disagreement turns up that is a defect rather than a stale line, that is a finding and it gets its own
work order.

**Acceptance**
- [x] `node tools/wo-sweep.mjs` fails when `verify-shell.mjs` gains or loses a check and
      `tools/README.md` is not updated to match — run, not reasoned, with the output quoted both ways.
      *Both directions run and quoted in `TESTING.md` § WO-2.19: a throwaway call site added gives
      `up 1 on the 560 recorded`, exit 1; the README corrected to 561 goes green; the throwaway then
      removed with the README left at 561 gives `down 1 on the 561 recorded`, exit 1.*
- [x] The number the sweep asserts is the number `tools/README.md` states it is, and the paragraph
      says which quantity it is counting — call sites or executed checks — rather than leaving a
      reader to assume they are the same. *`tools/README.md:504` is the sentence the sweep greps, and
      it says **call sites**; the executed count sits in the paragraph above it, labelled as such.*
- [x] The four call sites a run does not reach are named in `tools/README.md` with their reason, or
      the paragraph records why a fixed number cannot be stated. *It is not four and no fixed number
      can be stated: measured, a green run leaves **28** call sites unfired and fires **10** others
      more than once, and 28 − 22 = 6 is the arithmetic that looked like a short list. Both groups are
      named with their shape and examples by `file:line`.*
- [x] `node tools/wo-sweep.mjs` otherwise prints the line it printed before — no new REVIEW, and the
      standing sensitive-field-name REVIEW unchanged. *`diff` of the whole run before and after is two
      hunks: one added PASS line and `15 checks` → `16 checks`. The REVIEW block does not appear in the
      diff at all.*
- [x] `node tools/verify-shell.mjs` passes whole and `src/` is byte-identical to HEAD.
      *`554 checks · 554 passed · 0 failed · 0 skipped`, exit 0, run after every edit;
      `git diff --stat src/ tools/verify-shell.mjs` empty.*

**Traps** — **Do not make the sweep run or import the harness.** Its own header is explicit: it opens
no browser and drives nothing, and a sweep that shells out to a 160-second browser run stops being the
cheap command a verifier runs first. **Do not settle the gap by loosening the assertion** — a check
that passes when the numbers are "close" restates the problem it was written to solve, and a `REVIEW`
that prints on every clean run is noise a verifier learns to scroll past. If the honest answer is that
the two counts cannot be made equal, the check asserts the one it can count and the README names the
other. **And do not update the count as part of this work order's own landing** without the check
proving it: correcting the line by hand one more time is the ritual that has failed twice.

---

## WO-2.20 — the orchestrator must not report a spawn as a run

**Ship** — · **Status** ✅ DONE — 2026-08-10 · **Size** S · **Depends on** nothing — `.claude/agents/` and
the dispatch status-file convention both exist today · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15, WO-2.18 and WO-2.19
made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-10, out of WO-3.5's dispatch. It is at the
top of the running order anyway, ahead of WO-2.19, because it is the one thing on the board that
makes the *next* dispatch safer, and the next dispatch is imminent.

**Why it exists — the incident, in full, because the fix is small and the reasoning is the valuable
part.** On 2026-08-10 the `work-order-orchestrator` was dispatched on WO-3.5. Sixty seconds in it
returned a complete, confident report: the route with its reasoning, the claim written, the brief
written, and *"the implementer is in the background at Opus. Expect 20 to 40 minutes."* Every word was
true except the tense. It had **spawned** the implementer and returned; it had observed no work at all.

The coordinator, reading a finished-shaped report against a status file frozen at the dispatch line,
concluded the child had never launched — and re-dispatched. **It had launched. It was reading.** A
`work-order-implementer` on an L-sized work order reads the brief, the design mockup, the surfaces
document and six or eight source files before it writes anything: on WO-3.5 that was **21 minutes
between spawn and first write.** For those 21 minutes the status file does not grow, no result file
appears, and `git status` is unchanged — the three signals a watcher naturally reaches for, all of
them blind, all of them blind *longest on the largest work orders*, which are exactly the ones a
duplicate hurts most.

**Two implementers then built WO-3.5 concurrently for 19 minutes.** The tree survived — both lifted
`design/mockups/scores.html` and `plans/gradebook-surfaces.md` rather than inventing, so the halves
fit, `src/shell.js` imported exactly the six functions `src/scores.js` exported, and the ids matched.
That is luck resting on a shared brief, not a property of the system. It still cost both defects the
verifier found: each was a file asserting something about a file the *other* implementer owned, which
neither had opened.

**The root cause is one sentence: a report written at spawn time is indistinguishable from a report
written at completion.** Everything downstream — the false stall, the duplicate, the two defects —
follows from a reader being unable to tell those apart. Fix the ambiguity and the rest cannot happen.

**Deliverables**
- **`.claude/agents/work-order-orchestrator.md` does not emit its report until the implementer has
  returned.** If it spawns in the background, it waits — and a long flat stretch in the status file is
  explicitly *not* evidence of failure while it waits.
- **The status line it writes at dispatch says what is actually true**: `spawned, awaiting` rather
  than a duration prediction phrased as an observation. A predicted 20 to 40 minutes is fine as a
  prediction and misleading as a report.
- **The reading phase is written down where the next reader of that file will hit it** — that an
  implementer's first write is not its start, that 20+ minutes of silence is normal on an L, and that
  the mtime-shaped signals are blind for all of it.
- **A rule against re-dispatching a work order that already carries a `🤖 CLAIMED` line**, in the
  orchestrator's own instructions, whatever a status file appears to show. `--release` exists for a
  claim that is genuinely dead and it is a deliberate, named act; a silent second spawn is not.
- **The same reading applied to `work-order-verifier` and `work-order-implementer`** if either can
  report before its own children return. Do not assume it cannot — check.

**Out of scope** — a liveness or heartbeat mechanism, a progress protocol, anything that makes the
agents observable. That is a real and larger piece of work and this one must not become it. **The
cheap fix is to stop producing the ambiguous report**, not to build the instrument that would let a
reader see through it.

**Acceptance**
- [x] The orchestrator's definition, read start to finish by someone who has not seen this note,
      cannot be followed in a way that reports before the implementer returns.
- [x] The dispatch-time status line says the child was spawned and is awaited, and predicts a
      duration only in words that read as a prediction.
- [x] The reading phase and the blindness of the file-based signals are stated in the file, with the
      21-minute measurement from WO-3.5 quoted as the evidence.
- [x] The definition forbids re-dispatching over a live `🤖 CLAIMED` line and names `--release` as the
      only way a claim is cleared.
- [x] `work-order-verifier` and `work-order-implementer` are each read and either fixed the same way
      or ruled unaffected in one sentence saying why.
- [x] The next real dispatch after this lands produces a report that arrives when the work does.
      *(This is the only line that cannot be checked at the desk, and it is deliberately last: the
      failure it names took a full dispatch to surface.)* **Closed 2026-08-10 by WO-2.19's dispatch**,
      the next one after this landed at `e58858a`. One line at dispatch, then the full graded report
      31 minutes later — confirmed by the owner as the only thing that reached him, and the failure
      this line names is a reader unable to tell a spawn from a run, so the owner is the instrument.
      `.claude/dispatch/WO-2.19-status.md` corroborates it in order: `spawned … awaiting return.
      Expect 20–40 min` phrased as a prediction, `implementer returned (~17 min)` marked *"Not graded
      by me"*, verifier spawned and awaited, `verifier returned: PASS`. The report was also *made of*
      the verifier's own re-instrumentation — 560/554/532/22/28 re-derived, four mutations the
      implementer never claimed — which is content that cannot exist before the child returns, and
      exactly what WO-3.5's sixty-second report had none of.

---

## WO-2.21 — the 44px sweep can see a screen that is not the one on screen

**Ship** — · **Status** ✅ DONE — 2026-08-11 · **Size** S · **Depends on** WO-3.5 — the by-hand fix it
generalises is in `tools/verify-shell.mjs` § "the score entry grid (WO-3.5)" · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15, WO-2.18, WO-2.19 and
WO-2.20 made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-10, out of WO-3.5's verification, where it
was raised as a residual and deliberately not folded into that work order.

**Why it exists.** The standing 44px touch-target sweep collects `button, input, select, …` across the
page and skips anything computing to `display: none`. **`.hidden` is `display: none !important`, and
every view but the one on screen is `.hidden`.** So the sweep measures whichever screen the fixture
happened to leave open and reports green over the rest.

**This is not hypothetical and the number is the point.** WO-3.5 shipped a grid holding roughly 250
score inputs. The sweep walked past every one of them and passed — and because the *Scores* segment
shipped disabled in the same round, **nothing in that run could have opened the view to measure them
even if it had wanted to.** A green run over a fixture that cannot express the failure is the backup
nag escape exactly, and this is its third appearance.

**What WO-3.5 did about it, and why that is not enough.** It opens `#scoresView` through the real
navigation segment before measuring, and asserts *"the grid is OPEN and drawn under the coarse
pointer"* as a check of its own, because a sweep over nothing is what it was closing. **All of that is
hand-written inside WO-3.5's own section and covers `#scoresView` alone.** The mechanism is untouched.

**The cost of leaving it, which is what makes this worth an S now rather than later.** WO-3.6, WO-3.7
and WO-3.9 each add a screen. On today's harness each one arrives with the same hole, needs the same
by-hand workaround written again, and **reports green in the meantime whether or not anyone remembers
to write it.** The failure is silent and it is silent in the direction of looking fine — which is the
same shape as WO-2.19's stale check count, and the same argument for fixing the mechanism rather than
the instance.

**Deliverables**
- **The sweep enumerates every view and measures each one opened**, rather than measuring whatever the
  fixture left visible. How it opens them is the design question: driving the real navigation is
  truest and is what WO-3.5 did by hand; un-hiding them directly is cheaper and risks measuring a
  layout no teacher can reach. **Pick one deliberately and write the reasoning down** — a sweep that
  measures a screen in a state the app never puts it in is a new way to be green and wrong.
- **A view with nothing in it fails rather than passes.** The count assertion is the part that makes
  this real: WO-3.5's section asserts ≥200 cells before measuring, because zero controls measured is
  indistinguishable from zero controls undersized. **Every view carries its own floor.**
- **A view the sweep does not know about is named**, so the next screen is a failing check rather than
  a silent omission. This is the WO-2.19 principle: a list maintained by remembering is not maintained.
- **WO-3.5's by-hand block collapses into the general mechanism**, or the work order says in a sentence
  why it must stay special. Two mechanisms measuring the same screen is how one of them rots.

**Out of scope** — widening what the sweep measures beyond touch targets, and any change to the 44px
threshold itself. This is about *which screens are looked at*, not about what is checked on them.

**Acceptance**
- [x] Every view in `index.html` is measured under the coarse pointer, enumerated from the document
      rather than from a list someone typed. *`document.querySelectorAll('main > *')` is the list;
      the run prints `4 in <main>: homeView, classView, assignmentsView, scoresView` and measures
      7 · 27 · 5 · 4 controls on them with each view OPEN, every one ≥44px. Each is opened by driving
      the real navigation — the design decision is argued at the block, and the short form is that
      un-hiding would have reported green over WO-3.5's disabled Scores segment.*
- [x] **Deleting WO-3.5's by-hand block does not reduce coverage of `#scoresView`** — the general
      mechanism reaches it, proved by running with the block removed and quoting the counts.
      *Run with the block deleted: `588 checks · 588 passed · 0 failed · 0 skipped`, and `#scoresView`
      still opened through the real segment and measured — at **4 controls**, against the **259** that
      block prints on a real run (`measured 259 visible control(s) with the grid open`). The view's
      coverage survives; the grid's density does not, because the 25×10 fixture is planted 2,700 lines
      later and torn down before that section ends. So the block **stays**, which the Deliverable
      allows, and the one sentence why is written at the block and in `tools/README.md`.*
- [x] A view that opens empty fails on its own floor, driven by planting an empty one rather than
      argued. *An empty `#wo221EmptyView` planted as a real class screen (index.html + `src/views.js`
      + `src/screen-nav.js` + its `VIEW_PLAN` entry) goes red on the floor:
      `{"hidden":false,"display":"block","w":984,"h":0} :: 0 control(s) measured`, with the 44px check
      red beside it rather than green over nothing. Reverted; tabulated in `TESTING.md` § WO-2.21.*
- [x] Adding a view to `index.html` and not to the harness turns a check red, driven the same way.
      *`<div id="wo221UnknownView" class="hidden">` in `<main>` and nowhere else:
      `6 in <main>: … :: NOT IN VIEW_PLAN, so nothing measured them: wo221UnknownView`. Reverted.*
- [x] The total check count rises and `tools/README.md` records the new number — which is WO-2.19's
      mechanism if it has landed, and a hand edit with a note if it has not. *It has landed and it
      named the move: §11 went red at "592 `check()` call site(s), up 3 on the 589 recorded". Both
      numbers now come off real runs — **592 call sites** from the sweep's own grep, **591 executed**
      from `591 checks · 591 passed · 0 failed · 0 skipped`. Nine results from three call sites,
      because two of them fire once per view; the gap paragraph records why it moved from 7 to 1.*

---

## WO-2.22 — a missing harness is a failure, and one call per line stops being an assumption

**Ship** — · **Status** ✅ DONE — 2026-08-12 · **Size** S · **Depends on** WO-2.19 — this is §11 of
`tools/wo-sweep.mjs`, which that work order wrote · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15, WO-2.18, WO-2.19,
WO-2.20 and WO-2.21 made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-10 out of WO-2.19's verification, where both
halves were raised as residuals and deliberately not folded into a work order that had already passed
— the same call WO-2.21 got out of WO-3.5. Neither is a defect in what WO-2.19 shipped; both are
places where §11 is right today for a reason it does not check.

**Why it exists — two things, and the first is a severity, not a bug.** §11 has three ways to be
unhappy and they are not ranked the way the failures are. A `tools/README.md` whose sentence has been
*reworded* is a `FAIL` at `tools/wo-sweep.mjs:644`. A `tools/verify-shell.mjs` that has been
*deleted* is a `REVIEW` at `:613` — it prints, it does not fail, and the run exits 0. **The larger
disaster is the quieter signal.** This file's own header defines `REVIEW` as *"greppable evidence that
needs a human decision"*, and a vanished harness is not a decision anybody is being asked to make; it
is the one condition under which every claim this sweep makes about the harness is void. It also
inverts the section's own logic: `:634` fails loudly when the *pattern* stops matching, on the
explicit reasoning that a green run over an empty grep "reads green from a distance and is not". A
missing file is that same shape, one step further along.

**The second is a premise the check relies on and does not state.** §11 pushes one entry per *line*
that holds a `check(` call (`:620–623`), so its count is a count of lines. That equals the count of
calls only while no line holds two, which is true of all **596** call sites in the harness today and
is nowhere written down.

**That 596 was 561 when this work order was written on 2026-08-10, and it is re-measured here rather
than carried forward** — WO-3.5, WO-2.21 and WO-3.12 have all added checks since. The premise is
unchanged and so is every line citation above, which is the point: it is the *count* that rots, which
is the whole reason §11 exists. **Measure it again at the start of the work rather than trusting this
sentence** — `node tools/wo-sweep.mjs` prints the true figure in a second, and `tools/README.md:636`
records it. *(Refreshed 2026-08-11, from a run.)* A second call appended to a line already holding one would be invisible: the
count would not move, §11 would pass, and the number in `tools/README.md` would be quietly wrong —
which is precisely the failure WO-2.19 exists to prevent, arriving through the one door that work
order left open.

**Deliverables**
- **A missing `tools/verify-shell.mjs` or `tools/README.md` is a `FAIL`, not a `REVIEW`.** Both, not
  just the harness: neither absence leaves a question for a human.
- **§11 asserts that no line in the harness holds more than one `check(` occurrence**, so
  lines-equals-calls becomes a check rather than a premise. The message names the offending line.
- **The allowlist paragraph at `:592` records that the count is a count of lines** and points at the
  new clause as what makes that safe, in the form the rest of that paragraph already uses.
- **`tools/README.md`'s `wo-sweep.mjs` is **16 checks** sentence carries a note saying why that number
  is deliberately unguarded** — the sweep prints its own true count on every run, in a second, where
  a reader will see it, which is the asymmetry that made WO-2.19 worth doing for the harness and not
  worth doing here. Nobody should have to re-derive that.

**Out of scope, and this is the load-bearing half of the work order: `verify-shell.mjs` does not
assert its own summary against `tools/README.md`.** WO-2.19's implementer proposed it as the obvious
follow-up — eight lines, and the executed count is the one number in this system that nothing
watches. It is refused on two grounds, recorded here so the next reader who notices an unguarded
number does not re-propose it. **First, a red `verify-shell.mjs` run means the app is broken**, and in
week one of a live term that signal has to stay clean enough to drop everything for; making it also
mean "a sentence in a README is stale" spends the one alarm that must not be second-guessed.
**Second, the hole is already mostly closed, sideways.** §11's `FAIL` text at `:647` says in as many
words: *update that line, **and the executed-check count in the paragraph beside it**, from a run
rather than by arithmetic.* Every event that makes the executed count stale — a check added, a check
removed — now trips §11 and hands the reader both numbers. What remains is somebody editing the
executed count wrongly while touching no check at all, which is not the failure that happened three
times. Also out of scope: any change to what `verify-shell.mjs` prints or how it counts, and anything
in `src/`.

**Acceptance**
- [x] `node tools/wo-sweep.mjs` FAILs and exits 1 with `tools/verify-shell.mjs` moved aside, and again
      with `tools/README.md` moved aside — both run, both outputs quoted, both reverted.
- [x] §11 FAILs when a second `check()` call is appended to a line that already holds one, naming the
      line. **Proved non-vacuous by the count clause passing in that same run** — appending adds no
      new line, so the line count is unchanged, the old clause is satisfied, and the new one is the
      only thing red. **Quote that count from the run.** The figure here was `560` against a premise
      of `561` when this was written, which is a relationship an append cannot produce; do not carry
      either number in, and do not derive one by arithmetic — the Traps below say why. Reverted.
- [x] `tools/README.md` states why `wo-sweep.mjs`'s own count is left unguarded, and states that §11
      counts lines and what now guarantees that is a count of calls.
- [x] `tools/README.md` records why `verify-shell.mjs` does not assert its own summary, in enough
      detail that the argument does not have to be rebuilt.
- [x] `node tools/wo-sweep.mjs` otherwise prints what it printed before: §11 still PASSes at the true
      call-site count, no new REVIEW, and the standing sensitive-field-name REVIEW unchanged — proved
      by diffing a whole run before and against after.
- [x] `tools/verify-shell.mjs` and `src/` are byte-identical to HEAD by hash. **A full harness run is
      not required and should not be spent**: nothing in this work order touches `src/`, `index.html`,
      `sw.js` or the harness itself except inside a mutation that is reverted, and 177 seconds buys no
      claim that the hash does not already make.

**Traps** — **Do not switch §11 to counting occurrences per line.** It looks like the fix and it is
the wrong one: `check(` appears in trailing comments and in the harness's own quoted prose, and
`commentLines()` excludes whole comment lines rather than trailing ones, so occurrence counting trades
a hypothetical undercount for a plausible overcount and a false `FAIL`. The premise is the thing to
check; the counting is already correct. **Do not update `16 checks` → `17 checks` by arithmetic** —
this work order adds exactly one check and the temptation to increment is the ritual that has failed
three times in the sibling file. Measure it from a run and quote the summary line. **And do not build
the self-assertion**, however small it looks by then; the argument against it is above, and a work
order that quietly does its own Out of scope line is worse than one that argues with it.

---

## WO-2.23 — every date field in the app is short of 44px on the iPad

**Ship** — · **Status** ✅ DONE — 2026-08-10 · **Size** S · **Depends on** nothing · **Blocks** nothing
**Closes roadmap** *(no box. A defect in three shipped screens, found on the device after all three
closed.)*

**Booked 2026-08-10 from the owner's iPad sitting for WO-3.17**, which was looking at one dialog and
found the same thing on every other screen that has a date on it. *(This work order depends on nothing
and can be picked up cold. It is placed immediately after WO-3.17 in the running order because that
one proves the same mechanism on the hardware and the two close in a single sitting — which is a
scheduling argument, not a dependency, and the `**Depends on**` field says so by saying nothing. The
first draft of this line named WO-3.17 as an aside and `wo-gate.mjs` correctly refused it, which is
WO-2.16's rule doing its job.)*

**Why it exists.** Three screens put an `<input type="date">` in front of the teacher — the assignment
editor's *Assigned* and *Due* (`.assign-field-date`, built by `src/assignments.js`'s `dateField()`),
the term editor's *Starts* and *Ends*, and the days-off form's *From* and *To* (both `.term-date`,
built by `src/classes.js`'s `dateField()`, laid out by `.term-dates` and `.dayoff-dates` in
`src/shell.css`). **All six are visibly about half the height of the text fields beside them, and all
six are declared 44px**: `src/assignments.css` names `.assign-field-date` and `src/shell.css` names
`.term-date`, each inside a `@media (pointer: coarse)` rule carrying `min-height: 44px`. The rules
are right. The control ignores them.

*(Cited by symbol rather than by line, per the rule in [`README.md`](README.md) → Citing code. This
paragraph originally carried five line numbers; by the time WO-2.23 closed, three had drifted under
WO-3.17's commit and two under this work order's own comment additions — pointers into a live tree
that had silently stopped landing on what they named.)*

**The cause, and it is one line missing from the whole codebase.** iOS Safari paints
`<input type="date">` as a **native control**, and while its native appearance is in force the
author's box model is advisory — which is why `min-height` does nothing here and does everything on
the text field 10px away. `-webkit-appearance: none` is the switch that hands the box back, and
`src/` was grepped for it, for `appearance:`, and for any `input[type=…]` selector at all: **zero
matches for all three.** Nothing in this app has ever told WebKit to stop drawing these natively.

**Neither harness can see this, and that is not a gap either of them should be asked to close.** The
44px sweep skips anything computing to `display: none`, and all six fields live behind `.hidden`
dialogs, so none has ever been measured — but the more important half is that **measuring them would
not help**: desktop Chrome under an emulated coarse pointer honours `min-height` on a date input and
would report a compliant 44px on the broken tree. This is device-only. WO-2.21 does not close it and
must not be read as closing it.

**Deliverables**
- **Every `<input type="date">` in the app renders at the declared 44px floor under a coarse
  pointer**, on the device.
- **The reset lives in one place rather than being pasted into two sheets** — or the work order says
  in a sentence why per-sheet was the better answer here. There is no shared input reset in this app
  today and no CSS custom properties by convention, so this is a real design question with two
  defensible answers; **pick one deliberately and write the reasoning at the rule.**
- **A note in `TESTING.md` recording that this class of defect is invisible to both harnesses and
  why**, so the next reader does not book a check that would have gone green on the broken tree.

**Out of scope** — restyling the date fields beyond what the reset costs, any change to how dates are
stored or parsed, and the assignment dialog's *overlap*, which is WO-3.17's and has a different cause
(that dialog is the only place a date input is given `width: 100%` inside a shrinking flex parent).

**Acceptance**
- [x] The reset is applied to every date input in the app, in one place or with the per-sheet choice
      argued at the rule. **One rule in `src/shell.css`'s BASE section, keyed to `input[type="date"]`
      rather than to the four date classes**, with the choice argued above it: this file may not name
      a class another sheet owns, and a rule keyed to a class is one somebody has to remember for
      every date field added after it — on the one defect nothing here can catch. WO-3.17's identical
      copy on `.assign-field-date` is deliberately left standing rather than deleted, and the note at
      that rule says why, so the tree does not hold two unexplained answers.
- [x] 👤 On the iPad, portrait and landscape: the assignment editor's *Assigned* and *Due*, the term
      editor's *Starts* and *Ends*, and the days-off *From* and *To* are all full-height tappable
      fields rather than squat ones. *(Walked on the hardware by the owner, 2026-08-10. The plan
      *Review date* on the student editor — a seventh field this work order never named, reached by
      the same element-keyed rule — was walked with them and is good.)*
- [x] 👤 **The iPadOS date picker still opens from all six**, and a date picked in it still lands in
      the field. This is the thing the reset could plausibly break. *(Owner, 2026-08-10: opens from
      every one. The Trap's stop-and-report condition never fired.)*
- [x] 👤 An empty date field still reads as a field on the device — iOS draws no placeholder in it,
      so "empty" and "not there" are a real pair to tell apart, and empty is a legal value everywhere.
      *(Owner, 2026-08-10.)*
- [x] 👤 Days off: the dates still clear after a successful add. `src/days-off.js` discards and
      rebuilds the element to beat the picker's retained selection (WO-2.3's scar, reported off the
      hardware on 2026-08-08), and the reset must leave that working. *(Owner, 2026-08-10: still
      working under the reset.)*
- [x] A date field is never allowed to collapse to its tap-target floor: `.term-date` carries
      `min-width: 44px` in the coarse block, and with the native intrinsic width gone the field still
      has to be wide enough to show a whole date. **Raised to 160px in the coarse block** — copied
      rather than re-derived, and part of what the reset costs rather than a restyle. The source is
      Roll Call!'s `#dateJumpInput` (`src/dashboard.html:437-440`), which is a date-*picking*
      `<select>` under the same two reset declarations, **not** a date input: Roll Call!'s own date
      inputs carry no reset and no `min-width`, so it lends a width for a rendered date and no
      precedent for this control. Both rows the class sits in wrap, so the wider floor costs a
      wrapped line and never an overflow — **reasoned from the box model rather than measured**,
      since no check opens either dialog. *(What a laptop can say is that the floor is declared and that the rows it sits
      in wrap. The 👤 lines above are what prove a date legible on glass.)*
- [x] `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` prints what it printed
      before. **563 checks · 563 passed · 0 failed · 0 skipped**, and the sweep **16 checks · 15
      passed · 0 failed · 1 to review** with the REVIEW unchanged at 174 mentions — the three PASS
      details that move are the style-line count, the coarse-block check naming `.term-date` as the
      one new selector (already in that block), and the CACHE bump reported as uncommitted. Both runs
      quoted in `TESTING.md` § WO-2.23.

**Traps** — **Do not book a harness check for this.** Chrome under an emulated coarse pointer honours
`min-height` on a date input, so a check written for this defect goes green on the tree that has it —
and a check that cannot fail is worse than no check, because it tells the next reader the rule is
guarded. Record the limit instead. **Do not take the native picker away to win the pixels.** Both
`src/assignments.js`'s `dateField()` and `src/days-off.js` state, in comments, that these are real
date inputs specifically so iPadOS gives the teacher its own picker rather than a text field she types
an ISO string into; if the reset costs the picker on this iPadOS, **stop and report it** rather than
shipping the typed string those comments refuse. **And do not fix the assignment dialog's overlap
here** — it looks like the same bug and it is the same *cause* through a different door, WO-3.17 owns
it, and two work orders editing `.assign-field-date` in the same fortnight is how one of them gets
reverted.

*(Closed 2026-08-10 after **five** verification rounds, every failure in the same comment paragraph
and not one of them in the code: three false claims about Roll Call!, then a citation off by six
lines. The code passed round 1 and never changed after it. What the rounds bought is written up as a
standing rule — [`README.md`](README.md) → Citing code — and as WO-2.24 below, which closes the hole
this work order could see and was right not to close from inside itself.)*

---

## WO-2.24 — nothing in the tree notices if the shared date reset is deleted

**Ship** — · **Status** ✅ DONE — 2026-08-12 · **Size** S · **Depends on** WO-2.23 — this guards the rule
that work order added · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15, WO-2.18, WO-2.19,
WO-2.20, WO-2.21 and WO-2.22 made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-10 out of WO-2.23's verification, which
named the hole in as many words and correctly declined to close it from inside a work order about
something else.

**Why it exists.** WO-2.23 put one rule in `src/shell.css`'s BASE section —
`input[type="date"] { -webkit-appearance: none; appearance: none; }` — and seven date fields across
four screens depend on it. **Delete that rule and `node tools/verify-shell.mjs` still prints
563 checks · 563 passed · 0 failed.** The harness's one computed-`appearance` assertion reads
`.assign-field-date`, which keeps its own identical copy in `src/assignments.css` for WO-3.17's
reasons; the five fields that depend on the shared rule *alone* — the term editor's two, the days-off
form's two, and the student editor's plan *Review date* — live behind `.hidden` dialogs the harness
never opens, so nothing measures them and nothing ever has.

**The deletion this invites is a reasonable-looking one.** A reader who finds the same two
declarations in two sheets, checks that the tests stay green, and removes the "duplicate" from
`shell.css` has done what the evidence in front of them supports. Five fields silently revert to
native-drawn, the defect WO-2.23 fixed comes back on three screens, and the tree is green. The
duplicate is the *safe* copy to keep — `shell.css` may not name a class another sheet owns, so the
shared rule cannot mention `.assign-field-date`, which means the copy in `assignments.css` is the one
that cannot be the survivor.

**Why this is not the check WO-2.23's Traps forbid, and the distinction is the whole work order.**
That ban is on a **height** check: Chrome under an emulated coarse pointer honours `min-height` on a
date input either way, so a check written for the *defect* passes on the broken tree and tells the
next reader a rule is guarded when it is not. A **computed `appearance`** check is a different claim
and fails cleanly — no rule, `appearance: auto`, red. The harness already makes exactly this
assertion for WO-3.17 on `.assign-field-date`; this extends the assertion it has to the fields it
cannot currently see. **Say this in the check's own message**, because the next reader will arrive
holding the Trap and needs to know why this one is allowed.

**Deliverables**
- **`verify-shell.mjs` asserts computed `appearance: none` on a `.term-date` in the term editor, on a
  `.term-date` in the days-off form, and on the student editor's `.student-date`** — the three
  surfaces that today depend on the shared rule alone. This means opening those dialogs in the
  harness, which nothing does yet.
- **Deleting the BASE rule turns the run red.** Prove it by deleting it, running, and restoring —
  and record the observed failure text in the work order's result, because a guard nobody has watched
  fail is a guard nobody has tested.
- **The check's message states what it does and does not cover**: the reset's presence in the
  cascade, never the rendered height, which is device-only and stays 👤 forever.
- **`TESTING.md` § WO-2.23's "why no check was booked" note gains a pointer to this work order**, so
  the two read as one decision rather than as a reversal. That note stays true — no check was booked
  *for the defect*, and this one is not that.

**Out of scope** — any height or touch-target assertion on a date field (that is the forbidden check,
and `@media (pointer: coarse)` measurement is WO-2.21's ground); any change to the reset itself or to
`.assign-field-date`'s deliberate duplicate; and any change to what the two harnesses print or how
they count, which is WO-2.19's and WO-2.22's.

**Acceptance**
- [x] `node tools/verify-shell.mjs` asserts computed `appearance` on all three surfaces named above,
      and the run is green on the tree as it stands. *(`598 checks · 598 passed · 0 failed ·
      0 skipped`, 193s, exit 0. Each read is taken with the dialog asserted open and the element
      laying out a client rect.)*
- [x] With `input[type="date"]` deleted from `src/shell.css`'s BASE section, the run **fails**, and
      the failure names which field and which sheet. The result file quotes the failure text.
      *(`598 checks · 595 passed · 3 failed`, exit 1 — the three new checks and nothing else.
      Restored; `git hash-object src/shell.css` matches HEAD. Quoted in `TESTING.md` § WO-2.24 and
      in the result file.)*
- [x] The check's message distinguishes itself from the height check WO-2.23's Traps forbid, in its
      own words rather than by reference. *(No message cites the work order, the Trap or a line
      number; each says what a height would and would not prove on this engine.)*
- [x] `tools/README.md`'s check count and `TESTING.md` are updated from a run rather than by
      arithmetic, per WO-2.19. *(Call sites 596 → 599, executed count recorded as 598 off the
      summary line, gap paragraph `599 − 598 = 1`.)*
- [x] `node tools/wo-sweep.mjs` prints what it printed before, but for the check count.
      *(`17 checks · 16 passed · 0 failed · 1 to review`, exit 0; the two §11 clauses move 596 → 599
      and no other line changes.)*

**Traps** — **The dialogs are not on screen at rest.** WO-2.21 is the scar: the 44px sweep was
measuring a screen that was not the one on screen. Open the dialog, assert the element is actually
rendered, and do not let a `display: none` node answer the question — a computed `appearance` read
off a hidden node is the same class of lie. **And do not fold in the height.** It will be tempting,
because the harness will finally have these fields open in front of it. The height on desktop Chrome
says nothing about the height on iOS, which is the entire reason WO-2.23 exists.

---

## WO-2.25 — the print gate is answered when it is read, on every surface

**Ship** — · **Status** ✅ DONE — 2026-08-13 · **Size** S · **Depends on** WO-3.9 — the fix this carries is
written there, and reading it is the first step · **Blocks** nothing
**Closes roadmap** *(no box. A defect in shipped work, not a promise anyone made — the same call
WO-2.13 made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-13, out of the owner's own printing on the
grade sheet. **Two shipped print surfaces have a bug that has already been found, diagnosed and fixed
once**; this is that fix carried to them, and the duplication that let one bug live in three places
removed on the way.

**Why it exists.** `src/attendance-report.js` and `src/detail.js` both hold this, verbatim:

```js
body.setAttribute(PRINT_ATTR, '1');
window.print();
setTimeout(() => body.removeAttribute(PRINT_ATTR), PRINT_RELEASE_MS);   // 500
```

The reasoning under it — WO-2.6's, and Roll Call!'s before that — is that `window.print()` blocks
while the browser's own dialog is up, so 500ms is a margin after it. **It does not always block, and
the owner found both ways it comes apart on 2026-08-12, on the second tap of one sitting:**

- **Chrome throttles a repeated `print()`.** The second call in a short window is refused with *"This
  website has been blocked from automatically printing"* — and **a refused `print()` returns at
  once.** The timer cleared the gate while the teacher read the message; the print they then allowed
  was ungated, and what came out of the printer was **the whole app**.
- **Turning the preview from portrait to landscape** re-generates it from the **live DOM**. Whatever
  the attribute is at that moment is what prints, and the timer had cleared it long before.

Both are one mistake: the gate is **set** when the app asks to print and **read** when the browser
actually prints, and the gap between those is however long a teacher looks at a preview.

**The fix is settled, and it is not this work order's to invent.** `src/grades-report.js` carries it
with the reasoning written out at `printGrades()`: the gate is answered from a `beforeprint`
listener, at the moment the browser serialises the page, by **asking the DOM** whether that surface
is on screen — never remembered from the tap. That is self-correcting rather than balanced: a print
the teacher blocks outright leaves the attribute on, which costs nothing because only `@media print`
reads it, and the next print of anything at all asks again and clears it. **Read that file before
writing anything here.**

**Why the copies go, and not just the bug.** There are three because the idiom was lifted three
times — WO-2.6 wrote it, WO-3.7 copied it, WO-3.9 copied it again — and that is precisely how one
mistake came to live in three places and be fixed in one. The three **attributes** stay three, and
that part was always right: `data-attendance-print`, `data-detail-print` and `data-grades-print` each
re-show a different surface, and sharing one would print the wrong thing rather than nothing. It is
the **mechanism** that must stop being copied. A fourth print surface is a certainty — Phase 4's
signal lists and Phase 6's glance page both want one — and it must not be able to arrive with a
fourth timer in it.

**Deliverables**
- **`src/print-gate.js`, one module, taking the attribute and a predicate**: which `<body>` attribute
  this surface gates on, and a function answering whether that surface is on screen right now. It
  registers the `beforeprint`/`afterprint` listeners and hands back the sync function to call
  immediately before `window.print()` — the belt-and-braces set, for an engine that fires neither
  event.
- **All three surfaces call it**: `src/attendance-report.js`, `src/detail.js`, `src/grades-report.js`.
  Every `PRINT_RELEASE_MS` and every `setTimeout` around a print attribute is gone from the tree.
- **The reasoning moves with it.** `printGrades()`'s comment block is the record of what went wrong
  and why the shape is what it is; it belongs in `src/print-gate.js` now, told once, with the three
  callers pointing at it rather than restating it.
- **The two stale `@media print` headers are corrected** — `src/attendance.css` and `src/detail.css`
  still describe a timer, and `src/scores.css`'s header says so at the point where a reader would
  lift it a fourth time. That sentence comes out when it stops being true.
- **`verify-shell.mjs` covers all three surfaces the way it now covers the grade sheet**: the gate on
  at print time, still on while the surface is up, re-armed by a `beforeprint` the app never asked
  for, cleared by `afterprint`, and cleared by a `beforeprint` raised when the surface is **not** up
  — which is the guarantee the deleted timer used to give. The attendance and detail sections each
  still carry the check that measured the timer; **those come out.**
- **One tap, one `print()`, on all three.** The grade sheet asserts this since 2026-08-13; the other
  two collect the count already and have never asserted it.

**Out of scope** — anything about what the three sheets *contain*, their layout, their page breaks or
their CSVs; the fourth print surface Phase 4 and Phase 6 will want; and **any attempt to suppress
Chrome's throttle message**, which is browser policy and was settled on 2026-08-13 — one tap calls
`print()` exactly once, so there is nothing here to fix and a work order that tries will fail.

**Acceptance**
- [x] `src/print-gate.js` exists, and `grep -rn "PRINT_RELEASE_MS\|setTimeout" src/` returns no line
      that clears a print attribute anywhere in the tree. *(`PRINT_RELEASE_MS` returns nothing at
      all; the seven remaining `setTimeout`s in `src/` are the rotation settle, the object-URL
      revoke, the live region, the save-indicator fade and the store's debounce, max-wait and retry —
      none of them touches an attribute. `TESTING.md` § WO-2.25 lists them.)*
- [x] All three surfaces gate through it, and each keeps its own attribute — a print from one shows
      that one and hides the other two, asserted per surface rather than argued from the shared call.
      *(One check per surface, each reading all three attributes and the boxes of all three surfaces
      out of the same snapshot, taken inside the stubbed `window.print()`.)*
- [x] `verify-shell.mjs` makes the same five readings of each of the three surfaces, and **the two
      checks that asserted a timed release are gone.** The run is green. *(`674 checks · 674 passed ·
      0 failed · 0 skipped`, exit 0. **One correction to the line, not a shortfall:** there was only
      ever ONE timed-release check in the tree — the detail section's, deleted here. The attendance
      section never called `printRecord()` at all, so it had nothing of the kind to delete, and the
      grade sheet's was already deleted at WO-3.9. `grep -n "700" tools/verify-shell.mjs` now finds
      no assertion about a release. **Correction round 2, 2026-08-13:** three more checks and a
      re-run — `677 checks · 677 passed · 0 failed · 0 skipped`, 17,011 lines, 25.1 lines per check,
      214s.)*
- [x] **Each new check fails on the tree as it stands.** Run them against the unfixed
      `attendance-report.js` and `detail.js` before the fix and record the failure text — a guard
      nobody has watched fail is a guard nobody has tested (WO-2.24's rule, and the reason this bug
      shipped: the check that was watching it was green throughout). *(Thirteen call sites were
      added and one deleted, a net twelve. **Four of the thirteen fail on the unfixed tree** —
      `674 checks · 670 passed · 4 failed`, exit 1, the failure text in `TESTING.md` § WO-2.25. The
      other nine are shaped as ABSENCES that the timer build also satisfies — it had already cleared
      the attribute — so they were watched failing under three mutations instead. **This box is
      ticked on thirteen of thirteen watched red, not on thirteen of thirteen failing pre-fix**, and
      the four-row table in `TESTING.md` says which is which. **Correction round 2's three checks
      were each watched red before the box moved**: the detail one on the unfixed tree — `677 checks
      · 676 passed · 1 failed`, `window.print() calls per neutral target = {"body":1,"header.header":
      1,"main":1}` — and the attendance and grade-sheet ones under a two-line mutation that gives
      each of them the collision the detail screen had, `677 checks · 675 passed · 2 failed`.)*
- [x] 👤 **On the owner's own machine: print the attendance record twice in one sitting, and the
      detail sheet twice**, allowing Chrome's block when it appears, and turn one preview to
      landscape. The right sheet comes out every time. *(This is the only reading that matters and no
      emulator has it — the grade sheet's fix was confirmed this way on 2026-08-13.)*
      **Owner's run, 2026-08-13, verbatim — four results, and the box stays open:**
      ✅ *Attendance record printed twice in one sitting, Chrome's block allowed — the record came
      out, not the app.* ✅ *Student grade detail, same, twice in one sitting with the block allowed.*
      ✅ *Portrait → landscape inside a preview — the sheet survived the rotation.* ✅ *Ctrl+P with no
      print surface open prints the ordinary page —* **verified on the laptop only.** iOS has no
      Ctrl+P equivalent; the shortcut raises no print dialog on the iPad at all, so that fourth
      reading is a **desktop-only** verification and not an iPad pass. The same guarantee IS reachable
      on iOS — Share → Print raises the same `beforeprint` the gate answers — and that is the version
      an iPad can run. **Why the box stayed open, and what closed it:** the same run found the
      *Ignore* path broken — dismissing Chrome's block left `data-detail-print` on `<body>`, where
      `src/shell.js`'s `closest('[data-detail-print]')` matched every click on screen and re-opened
      the print dialog. Fixed in correction round 2 by renaming the button to
      `data-detail-sheet-print`. **The owner re-ran the checklist against that fix on 2026-08-13 and
      it passes** — after pressing *Ignore*, clicking the header and a blank patch of page opens no
      dialog on any of the three surfaces; print-twice-and-Allow still puts the sheet on the paper;
      the rotation still survives; and **Share → Print on the iPad** gives the open sheet with one
      up and the ordinary page with none, which is the Ctrl+P guarantee finally read on the device
      rather than on the laptop. The five readings are recorded in `TESTING.md` § WO-2.25.
- [x] `tools/README.md`'s check count and `TESTING.md` are updated from a run rather than by
      arithmetic, per WO-2.19, and `node tools/wo-sweep.mjs` prints what it printed before but for
      the count. *(Call sites 663 → **675**, executed 662 → **674**, both copied off the runs rather
      than added up; the gap paragraph goes `659 − 658 = 1` → `675 − 674 = 1`. The sweep is what
      forced it: before the edit it printed `FAIL | … has 675 check() call site(s), up 12 on the 663
      recorded at tools/README.md:729`. **Correction round 2** moves them again — sites 675 → **676**,
      executed 674 → **677**, and the gap with them: `676 − 677 = −1`, the first time this file's
      executed count has exceeded its call sites, because the three new checks are one call site
      inside a loop over the three gate attributes. Forced by the sweep the same way: `FAIL | … has
      676 check() call site(s), up 1 on the 675 recorded at tools/README.md:766`.)*

**Traps** — **Do not share the attribute.** Three surfaces, three attributes; the module takes it as
an argument for exactly this reason, and `src/scores.css`'s header explains what sharing one costs.
**Do not make the module ask which surface is open.** It takes a predicate because the module must
not know about modals, views, or `.hidden` — `src/detail.js`'s surface is a view in `<main>` and the
other two are dialogs, which is why WO-3.7's `@media print` block is the hard one and the other two
are easy. **Do not delete the timer without replacing the guarantee it gave**: a Ctrl+P made when no
print surface is up must leave the ordinary page alone, and that is now the `beforeprint` sync
clearing the attribute rather than a timeout having fired. There is a check for it on the grade
sheet; write the other two. **And re-verify the grade sheet too.** It works today, and this work
order rewires it — the surface that is already correct is the one nobody will think to re-test.

---

## WO-2.26 — the Student Report screen shows the hall passes

**Ship** 2 · **Status** ✅ DONE — 2026-08-14 · **Size** S ·
**Depends on** WO-2.6, WO-2.9, WO-3.7
**Closes roadmap** *(no box. Phase 2's pass-history line is WO-2.9's and is ticked; this is the join
between two surfaces that work order deliberately left apart.)*

**RE-CUT 2026-08-14, same day, by the owner against the running build — and the fault was in this
document, not in the dispatch that read it.** The first version was built exactly as written and
landed on the wrong screen. The title said *"the student report"*; every deliverable and every
acceptance line underneath it said *"the student **attendance** report"*, and those are two different
surfaces one door apart. The body won, as it should have. **"Student report" is a name this
repository had not spent, and both surfaces answered to it**: `src/attendance-report.js` renders what
its own code calls the student attendance report, and WO-3.7's `src/detail.js` is the screen a teacher
means when she says she is looking at a student's report. From here the second is **the Student Report
screen** and gets called that by name; the first is **the attendance history dialog**. Anything that
still reads "the student report" unqualified is this work order's ambiguity and not a third surface.

**Booked 2026-08-14, out of WO-2.9's iPad sitting.** All seven manual lines passed, and the first
question after them was *"where do I see a record of the hall pass?"* — asked by the owner, on the
build, with both surfaces in front of her. That is the whole of the evidence and it is enough: the
record is two dialogs away from the screen a teacher opens to talk about one student.

**Why it exists.** *Roll Call! puts it on one page and Planbook puts it on two.* Roll Call!'s Student
Report carries the **Hall Pass History** table inline (`src/dashboard.html` ~4718), so a teacher at a
conference opens one thing. Here 🖨 Record and 🚪 Passes are separate dialogs that share no data:
`src/attendance-report.js` contains no reference to a pass, and `src/pass-history.js` contains no
attendance. **The split itself is correct and is not what this work order undoes** —
`src/attendance-report.js`'s header promises it never imports `src/supports.js` and has no path to
`student.supports`, which is what keeps its printed page and its CSV clean in either presentation
mode, and the pass history has to ask about presentation mode. Two files, two promises, both true.
What was never decided on purpose is that the **teacher** pays for the seam. This joins the two
surfaces in the UI and leaves both promises standing.

**The breakdown is a card on the Student Report screen, not a door on a dialog.** Roll Call! puts the
Hall Pass History table **inline** on its Student Report (`src/dashboard.html` ~4718) and that is the
part to copy — a teacher at a conference reads the trips on the page she is already on, without
opening anything. `src/detail.js` already builds exactly this shape at `attendanceCard()` (~line 503):
a `.detail-card` with a title carrying its own summary, a body, and a note underneath that says what
the numbers are counted out of. **The pass card is that card's sibling and is built the same way.**

**The per-student trip rendering already exists** — WO-2.26's first cut wrote `openStudentPasses()` in
`src/pass-history.js`, verified, and it renders every trip with times and notes. It renders into a
modal. What this re-cut needs is that same rendering returned as a **card**, so both callers share one
list-builder and the two surfaces cannot drift. Extracting it is the work; writing it again is not.

**`src/detail.js` carries the same firewall `src/attendance-report.js` does** — its header (lines
36–42) promises no import of `src/supports.js` and no path to `student.supports`, and WO-3.7's eighth
acceptance line extends that to the printout and the CSV in **both** presentation modes. The pass card
needs to know whether the mode is on; that answer lives in `src/supports.js`; this file may not ask.
**The precedent is already set and upheld:** the first cut had `src/pass-history.js` build the block
and hand it over, the verifier checked that against the same arrangement `src/assignments.js` has with
`src/accommodation-prompt.js`, and it held. Take that road deliberately this time rather than
rediscovering it — and say so at both ends, as the first cut did.

**Deliverables**
- **A hall-pass card on the Student Report screen**, inline beside the attendance card, listing this
  student's trips — per Roll Call!'s one-page report. Not a door, not a dialog, not a second tap.
- **Term-scoped, with the attendance card's own fallback.** The trips listed are the open term's, and
  when a term has no dates set the card says so in the words `attendanceCard()` already uses rather
  than in new ones. *(Owner, 2026-08-14: the whole screen answers one question about one stretch of
  time, and a year-wide list would be the only thing on it that does not.)*
- **The count line stays on the attendance history dialog, and the door comes off.** *(Owner,
  2026-08-14.)* The dialog keeps `Hall passes · N trips · N minutes out` as a fact a teacher sees
  while marking attendance; 🚪 **Every trip** is deleted, because the breakdown now has one home.
- **The two per-student counts agree, which means the dialog's line is term-scoped too.** This is what
  the first cut's acceptance line 1 got wrong, and it is corrected below rather than carried forward.
- **Presentation-mode safe on both surfaces**, by the arrangement described above — the card and the
  count line both go, and the screen that remains is a screen, not a hole.
- **A decision about print, made out loud.** `src/detail.js` gates printing on `data-detail-print`
  and WO-3.7's eighth line covers the printed page in both modes. Whether the trips print with the
  grade is a choice; make it, and write the reason where the gate is.

**Acceptance**
- [x] **The Student Report screen lists this student's trips inline** — every trip in the open term,
      with its date, its clock and its note, on the screen itself and behind no tap.
- [x] The list is **term-scoped**, and says which term it covers. A term with no dates set falls back
      to the whole year in `attendanceCard()`'s existing words, not in new ones.
- [x] **The attendance history dialog shows the count and no door.** `🚪 Every trip` is gone from it,
      and the count line that remains agrees — **exactly** — with the Student Report card for the same
      student in the same term. One number, two surfaces, no label reconciling them.
- [x] A student with no trips is **stated as none on both surfaces**, rather than left blank or given
      an empty card.
- [x] Presentation mode: the card and the count line are both suppressed, and the Student Report
      screen still draws. A negative control proves suppression rather than a screen that failed.
- [x] `src/attendance-report.js` still imports nothing from `src/supports.js` and has no path to
      `student.supports` — the grep WO-2.6's fourth acceptance line rests on still comes back empty.
- [x] **`src/detail.js` holds the same line** — no import of `src/supports.js`, no path to
      `student.supports`, and WO-3.7's eighth acceptance line still true of the printed page and the
      CSV in both modes.
- [x] The trips **print or do not print** as decided, and the printed page matches the decision. 👤
- [x] The card reads at arm's length beside a guardian, and the Student Report screen still reads as
      one page rather than as a page with a table bolted to it. 👤

*(**Re-cut 2026-08-14. The ticks above are deliberately mostly empty**, and the one that survives is
the one whose subject did not move: `src/attendance-report.js`'s firewall was proved by the first cut
and the re-cut does not touch it. Everything else was verified **against the wrong screen** — the
`verify-shell.mjs` run was real (740 of 740, 0 failed, 0 skipped, eight new checks) and its checks are
sound, but they assert a door this re-cut deletes. **A green harness against a wrong target is not
evidence, and re-ticking those lines because they were once ticked is the failure this note exists to
prevent.** The eight checks get re-pointed at the card, not re-run at the dialog.*

*What carries forward, and should not be rebuilt: `openStudentPasses()` and its trip rendering; the
`studentPassSummary()` arrangement whereby `src/pass-history.js` builds a block and the calling
surface only provides a container, which the verifier upheld against the `src/assignments.js` ↔
`src/accommodation-prompt.js` precedent; and the count's single source in `tallyPasses()`. What comes
out: the `🚪 Every trip` door, its CSS, its harness checks, and the "whole year, not just this term"
label, which the term-scoping decision makes untrue rather than merely unnecessary.)*

*(**The note above is the owner's and is kept as written; the seven ticks it describes as empty were
closed on 2026-08-14 by the re-cut's own run, at the card and not at the door.** `verify-shell.mjs`
**746 of 746, 0 failed, 0 skipped**, 246s — fourteen call sites inside the existing hall-pass
section, replacing the first cut's eight, which were deleted rather than re-run. `wo-sweep.mjs` 17
checks, 0 failed, 2 standing reviews. The two 👤 lines stay open and were not ticked: the printed
page is measured under emulated print media in a headless window, which is not paper, and the second
is a page read at arm's length beside a guardian.*

*The re-cut left **three decisions** to the implementation and each is written at the code that makes
it. **The date window lives in `src/passes.js`** — `passesForStudent()` took optional `from`/`to`
compared as strings the way `meetingDates()` does, and `passesForStudentInTerm()` wraps it — so three
callers ask one question and no screen holds a second opinion about what a term is. **The no-dates
fallback is `attendanceCard()`'s own sentence**, adapted rather than rewritten, because a reader who
meets both on one screen should meet one sentence. **And the trips print with the grade**, for the
four reasons at `src/detail.js` § PRINTING A VIEW, of which the first governs: the sheet is the
screen, and a card the teacher and the guardian have just read together, silently missing from the
page the guardian takes home, is that rule broken in its most confusing form. `studentCsv()` is
deliberately untouched — a column of trips in the file is a separate decision and would be a work
order rather than a line here.*

*Both blocks are built by `src/pass-history.js` and handed over already built, which costs **one
import of that module into each of `src/attendance-report.js` and `src/detail.js`** against both
headers' expectation of none. The reason is written at both ends of both seams, and it is the
precedent `src/assignments.js` set with `src/accommodation-prompt.js`: acceptance line 5 needs these
surfaces to suppress under presentation mode, that answer is `presentationMode()`, it comes from
`src/supports.js`, and both files' firewalls forbid them from asking. So neither asks. Everything the
traps line protects is intact — no import of `src/supports.js` in either file, no path to
`student.supports`, and no second loop over the log.*

*Two things the harness run is the record of. **The first cut's block did not fail, it crashed:** its
first check clicked the deleted door, `clickSel` threw, and the run died before WO-2.3 and everything
under it with no summary printed. The replacement asks for every door with `has()` before clicking
one. **And the crash was hiding a real defect** — WO-2.6's "every print rule is gated" check went red
the moment the run reached it, because the first cut's `body[data-detail-print]` rules for the trip
table live in `src/attendance.css`, correctly, and that check demanded `data-attendance-print` on
every rule touching those class names. It now sorts rules by which surface's attribute gates them;
ungated is still a failure, and the borrowed arm is counted so that losing it goes red.)*

**Traps** — **The promise in `src/attendance-report.js`'s header is the thing to protect**, and it is
protected by the shape of the join rather than by care. Read that header before writing, and if the
design ends up needing an import, stop and say so rather than writing "this file does not import that
module" above an import. **The count is a number two surfaces now show**: it comes from
`src/passes.js`'s `tallyPasses()` like every other one, never from a loop written here — WO-2.9's
third acceptance line is about exactly this, and a second loop agrees with the first on every fixture
anybody writes. **The pass history is not term-scoped and both surfaces here are.** A trip count on a
term report, sourced from a log that holds the whole year, is two date windows on one page. The first
cut left this to the implementation and got the label; **the re-cut decides it — scope it, both
places** (owner, 2026-08-14), and the class-wide 🚪 Passes dialog stays the year-wide view it already
is. **`src/detail.js`'s header firewall is now the second one to protect**, and it is the more
exposed of the two: WO-3.7's eighth acceptance line covers its printed page and its CSV in both
presentation modes, and this is the screen most likely to be handed across a desk. Read lines 36–42
before writing, and if the design needs an import, take the road the first cut proved and say why at
both ends — do not write "this file does not import that module" above an import.

---

## WO-2.27 — where the pass work says one thing and does another

**Ship** 2 · **Status** ✅ DONE — 2026-08-14 · **Size** S · **Depends on** WO-2.9, WO-2.26

**Booked 2026-08-14, out of WO-2.9's verification, and widened the same day out of WO-2.26's.** Two
dispatches' worth of findings that were correctly **not** acceptance failures — nothing either work
order promised is unmet — and that would otherwise live only in `.claude/dispatch/WO-2.9-result.md`
and `.claude/dispatch/WO-2.26-result.md`. The rule that puts them here is the one written under the
Ship 2 table when WO-3.19 and WO-3.20 were booked: *a follow-up that lives only in a dispatch result
file is a follow-up nothing reads.* **The count came out of the title on 2026-08-14** for the reason
this work order is otherwise about: a number in a heading is a promise that rots the next time
anything is added, and this one rotted within a day of being written.

**Why it exists.** *Two kinds of debt, and the second is the one that can cost a term.* The first
kind is a comment making a promise the code beside it does not keep — the failure mode this
repository treats as expensive, because every dispatch here is briefed by comments before it is
briefed by anything else. WO-3.19 was booked for the same reason one phase over and its note says the
pixel was the smaller half. **The second kind is a check that cannot fail**, which is worse, because a
comment that lies is found by the next reader and a green check that proves nothing is found by
nobody. WO-2.26 went to real trouble to make its term-scoping check falsifiable and got the lower
bound only; the two harness items below are that gap and its neighbour.

**The comment debts**
- **The pass clock outlives its banner.** `src/attendance.js:2833` — `paintPassBanner()` returns at
  line 2835 when the banner element is not in the document, so the `stopPassClock()` at line 2860 is
  unreachable on that path and navigating off the registry with a pass open leaves a 1-second
  interval running. Every tick is a no-op, which is why this is XS and not a bug report.

  > **Two of those sentences are wrong, and they are left standing because the correction is the
  > finding (2026-08-14, at close).** Leaving the registry never reaches that early return — the
  > banner is static markup in `index.html:627` and `src/views.js:120` hides views rather than
  > removing them, so nothing calls `paintPassBanner()` on the way out at all. And the ticks are
  > **not** no-ops: the cards the last paint left behind are still in the document, so
  > `paintPassElapsed()` keeps recomputing from the stamps and keeps firing **WO-2.9's overdue
  > alerts** on whatever screen the teacher is standing on. Stopping the clock on a view change —
  > which is what this bullet asks for, read plainly — would silence that alert on four screens out
  > of five. The early return was fixed anyway and the comment made true; the navigation half became
  > **WO-2.28**, because it is a decision about an alert's reach and not a tidy. *A work order booked
  > to pay comment debt got its own diagnosis wrong, which is the argument for the sweep rule below
  > rather than against it: the four debts a person found by reading are exactly the ones a person
  > can also mis-read.*

  **What makes it a comment problem is line 2856**: *"A run with an empty room costs nothing at all, not one timer
  doing nothing once a second."* That is true of the empty-room path and false of the navigated-away
  path, and it is the sentence a reader would trust instead of checking. A live timer on a device
  that suspends is also the exact hazard class WO-2.9's own Traps section is about.
- **`flipPresentationMode()` carries a standing instruction that WO-2.9 did not obey.**
  `src/shell.js:747` tells the next screen that shows support data to add its redraw there; WO-3.8
  obeyed it, and WO-2.9 added a third name-bearing surface without one. **It is not a bug and must
  not be "fixed" by adding the redraw**: the header sits at `z-index: 999` under the modal overlay's
  `1000`, so the mode cannot be flipped while the pass dialog is showing names — the first tap closes
  the dialog and the second reaches the control. The owner confirmed that walk on glass on
  2026-08-14 and read it as the sensible flow. **The geometry is also the safer behaviour**, since a
  flip reaching through an open dialog would repaint names in front of whoever is sitting there. What
  is missing is that none of this is written anywhere. One comment, at the instruction or at the
  dialog, naming the stacking as the reason and the date it was checked on a device.
- **A harness comment points at something that is not there.** `tools/verify-shell.mjs:10077` reads
  *"a build that fired off a variable would say it again after the reload below."* There is no reload
  below. The check is sound; the sentence explaining why it is sound is not.
- **`src/shell.js`'s hook inventory claims to be one and is not — and it is missing SEVEN, not three.**
  The block under *"The hooks, all handled by the one listener below"* lists every delegated attribute
  in the app. Diffed 2026-08-14 against every `closest('[data-…')` in the same file, these are
  delegated and absent:

      data-pass-history · data-pass-history-all · data-pass-history-student      (WO-2.9)
      data-attendance-history · data-attendance-record
      data-attendance-record-csv · data-attendance-record-print                  (earlier)

  WO-2.26's first verifier found the **three** because it was reading WO-2.9. **The other four have
  been missing longer and nobody ever flagged them**, and that is the finding rather than the count:
  this list does not rot when one person forgets once, it has been rotting continuously across at
  least two work orders, in silence. An inventory is a promise of completeness in a way a paragraph is
  not, so a missing row reads as *"no such hook exists"* rather than *"this list is partial"* — and it
  is the first thing a dispatch looking for the delegation seam reads.

  **The diff is trustworthy in ONE direction only, and the other direction is a trap** — see Traps.

**And two gaps in the harness, from WO-2.26's verification**

Both are checks that pass and would keep passing if the thing they cover were removed. Neither is a
failure of WO-2.26 — its verifier ran 746 of 746 and proved the scoping check falsifiable by deleting
the whole term filter — but proving *a* filter is load-bearing is not proving *both bounds* are.

- **Nothing is planted after `term.end`, so a dropped upper bound stays green.** Every trip in the
  hall-pass fixture falls on or before the term's end, and the out-of-term trip WO-2.26 planted to
  make scoping visible sits *before* `term.start`. So `passesForStudentInTerm()` reduced to
  `(from)` only — the `to` bound dropped, the commonest way a date window rots — passes the suite.
  **The fix is one more planted trip, dated after `term.end`**, and the check that proves the fix is
  the same one the verifier already ran by hand: drop the bound in a copy of the tree and watch it go
  red. A bound with no trip beyond it is decoration.
- **WO-3.7's `#scoresBody` route is walked but not asserted.** WO-3.7's block opens the Student Report
  screen through `#scoresBody [data-student-detail="…"]` and WO-2.26's asserts the card — but on its
  own route. Nothing checks the card is on the screen *when it is reached from the score grid*, which
  is the route a teacher actually uses most. It is one assertion on a walk that already happens.

**Deliverables**
- The clock is stopped on every path that leaves the banner, including the one that returns early.
- The stacking argument is written down at the point a reader will look for it, with the date it was
  confirmed on the device.
- `tools/verify-shell.mjs:10077` says what the check actually rests on.
- `src/shell.js`'s hook inventory lists all **seven** missing hooks, or says in one line that it is not
  exhaustive. **Either discharges it; a third option — adding some rows and leaving others out —
  discharges nothing** and leaves the same false promise a few rows shorter.
- **A sweep rule in `tools/wo-sweep.mjs` that diffs the delegated hooks against the inventory**, so the
  eighth omission is a red check rather than a discovery. *This is the deliverable that matters more
  than the seven rows.* Four of this work order's debts were found by a human reading and thinking
  "that looks odd"; this is the only one a script can hold, and it is the only one that has recurred.
  Listing the seven by hand fixes today and leaves the mechanism that produced them running — the same
  reasoning that took the count out of this work order's own title.
- **A trip planted after `term.end`**, and the upper bound of `passesForStudentInTerm()` thereby made
  load-bearing.
- **One assertion that the hall-pass card is on the Student Report screen when it is reached from the
  score grid**, on the walk WO-3.7's block already takes.

**Acceptance**
- [x] **`paintPassBanner()` leaves no interval running on any path out of it, the early return
      included**, and there is a check that fails if that stop is removed.
      *(**Re-cut by the owner on 2026-08-14, after the verifier failed the line as written.** It
      read "navigating off the registry with a pass open leaves no interval running", which rests on
      the diagnosis corrected under the first comment-debt bullet above: leaving the registry does
      not reach the early return, and the interval it leaves running is carrying WO-2.9's overdue
      alerts to whatever screen the teacher is on. The line now asks for what the deliverable
      actually discharges. **The behaviour question it used to smuggle in is booked as WO-2.28** —
      it is a decision about how far an alert should follow the teacher, and the verifier was right
      that no correction round could close it. `.claude/dispatch/WO-2.27-result.md` carries the
      implementer's full argument.)*
- [x] `src/attendance.js:2856`'s comment is true of every path through the function it describes.
- [x] A reader of `src/shell.js:747` can tell why WO-2.9's surface is not registered there without
      opening a dispatch result file or this work order.
- [x] `tools/verify-shell.mjs:10077` describes the mechanism the check actually uses.
- [x] A reader of `src/shell.js`'s hook inventory who searches it for any of the **seven** named above
      either finds the hook or finds a sentence telling them the list is partial.
- [x] **`wo-sweep.mjs` fails when a delegated hook is missing from the inventory.** Prove it the way
      WO-2.26's verifier proved the term filter: delete one row from the inventory in a copy of the
      tree, watch the sweep go red, and state that in the result file. A rule that has only ever been
      run against a list somebody just finished fixing has not been shown to catch anything.
- [x] **The term window's upper bound is load-bearing:** with a trip planted after `term.end`,
      reducing `passesForStudentInTerm()` to its `from` bound alone turns the suite red. State the
      count in the result file, the way WO-2.26's verifier stated 739/746 for the whole-filter case —
      *"it would go red"* is the claim this line exists to stop anyone making by reading.
- [x] The hall-pass card is asserted present on the Student Report screen reached from
      `#scoresBody [data-student-detail="…"]`, not only on WO-2.26's own route.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but
      for the count.

**Traps** — **Do not add the presentation-mode redraw.** The finding is a missing *comment*, not a
missing call; adding the redraw would wire a repaint for a state that cannot occur and would have to
be reasoned about again by everyone after. **Do not delete the promise in `src/attendance.js:2856`
instead of making it true** — "a run with an empty room costs nothing" is a real guarantee about a
device that suspends, and the cheap fix is to honour it on the fourth path rather than to stop
claiming it.

**THE HOOK DIFF RUNS ONE WAY, AND RUNNING IT THE OTHER WAY WILL DESTROY THE INVENTORY.** Attributes
found in a `closest('[data-…')` call and missing from the list are real omissions — that is the seven.
The reverse comparison produces **twenty-odd inventory entries with no `closest()` call, and they are
mostly correct entries**: `data-pass-type`, `data-score-student`, `data-term-id`, `data-assignment-id`
and `data-model` are value-carrying companions read off an element some *other* hook matched, and
several more are reached by `matches()` or `getAttribute()` rather than by `closest()`. A dispatch that
diffs both ways and deletes the difference will strip working documentation and call it tidying. **The
sweep rule must assert one direction only**, and its comment must say why — that sentence is itself one
of this work order's deliverables in spirit, since a rule whose asymmetry is undocumented is the next
comment debt.

**No `src/` file needs to change for either harness gap**, and if one starts to, stop: both are
fixtures and assertions, and a source edit made to satisfy a test this work order is writing is the
tail wagging the dog. **The planted trip is put back the way WO-2.26's block puts its own back** —
that block already plants trips and terms and restores both at its foot, and a second plant that
leaks would be read as a scoping bug by every check after it. **`src/shell.js:747` is unchanged and
its bullet above is not an instruction to register anything**: WO-2.26 *did* add
`detail.renderDetail()` there, guarded on the view being on screen, so the standing instruction now
has two obeyers and one documented exception — which is the state the missing comment has to
describe, and the reason that bullet got no wider when this work order did.

---

## WO-2.28 — the pass tick reads the document, not the banner

**Ship** 2 · **Status** ✅ DONE — 2026-08-14 · **Size** S · **Depends on** WO-2.9, WO-2.27

**Booked 2026-08-14 out of WO-2.27's verification, and re-cut the same day once the reference
implementation was read.** It was written as the decision WO-2.27 could not take — *how far should
the overdue alert follow the teacher off the registry?* — carrying a bug and a design question in one
brief. **The design question turned out to be answered already, in Roll Call!, and it is now WO-2.29.**
What is left here is the bug, and it should not wait behind a decision: WO-2.9's overdue alert stops
firing for **both** classes when the teacher switches class while standing anywhere but the registry.

**The bug, and it is one line.** `paintPassElapsed()` (`src/attendance.js:2956`) iterates the open
passes of `openClass()` and then, per pass, does `if (!node) return;` (`src/attendance.js:2982`) when
the banner holds no card for it. That guard was written for the empty-banner case and it kills the
**alert** as well as the text write. So:

- `afterClassChange()` (`src/shell.js:427`) repaints only the class screen currently on view, and
  `paintPassBanner()` is called from just two places, `paintPasses()` (`src/attendance.js:3050`) and
  the registry render (`src/attendance.js:3886`).
- Switch from period 2 to period 3 while standing on Scores and `openClass()` moves while the banner
  still holds period 2's cards. `paintPassElapsed()` then scopes to period 3, finds no matching
  `[data-pass-elapsed]` node for any of its passes, and returns on every one of them.
- **Nothing alerts, for either class**, until the registry is next painted. It recovers there — the
  level is recomputed from elapsed and `markAlerted()` still refuses a non-increase, so a crossed
  threshold announces once on arrival — so this is a delay and not a permanent loss. The delay is
  unbounded: it lasts as long as the teacher stays off the registry.

The honest statement of the alert's reach today is therefore **whatever the last registry paint
drew**, which is narrower than anything the code says about itself, `startPassClock()`'s WO-2.27
paragraph (`src/attendance.js:2899`) included.

**How Roll Call! does it, which is the fix.** Its timer tick (`src/dashboard.html:3511`–`3538`) loops
over `activePasses` — its data — computes elapsed, writes the two DOM figures **guarded** (`if (el)`,
`if (bl)`), and then runs the threshold checks unconditionally. The alert never asks whether an
element exists. That is the same loop this file wants: move the guard so it skips the two DOM writes
and falls through to the threshold check.

**Why this is the fix and not a workaround.** The alternative — call `paintPassBanner()` from
`afterClassChange()` so the hidden banner keeps up — repairs the symptom by painting a screen nobody
is looking at, which is the thing `afterClassChange()`'s own comment declines to do. Reading the
document instead makes the alert independent of the DOM altogether, which is what WO-2.27's paragraph
called *"a driver of their own"* and priced as a work order. It is four lines.

**Deliverables**
- `paintPassElapsed()`'s per-pass guard skips the DOM writes only. The threshold comparison, the
  `fired` collection and the single `update()` run for every open pass of the open class, card or no
  card.
- `startPassClock()`'s paragraph corrected: the interval survives leaving the registry **and** a class
  change, and the alert is scoped to the open class rather than to the last paint.
- Two checks in `tools/verify-shell.mjs`. The first is a walk that leaves the registry: the alert
  fires with a pass open and the Scores screen up. The second asserts the property this work order is
  named for, directly — see the re-cut below.

**Acceptance line 2 was re-cut 2026-08-14, on the owner's call, after the first build failed it.**
It read *"switching class while off the registry no longer silences the alert for either class"*, and
**that scenario is not reachable.** `selectClass()` (`src/classes.js:467`–`475`) calls
`showView('class')` unconditionally, and `src/shell.js:39` documents `data-class-tab` as opening a
class *to its registry* — so every deliberate class switch lands on the registry and paints the
banner on the way. The harness proved it rather than argued it: the check fired the right alert for
the right class with the banner unrepainted, and failed on `registry shown = true`. The one route that
moves `openClass()` without a registry paint is `getSelectedClassId()`'s stale-id fallback
(`src/classes.js:165`–`170`) — archiving or deleting the open class while standing on Scores — **and
that turned out to be a different bug with a different cause, now booked as WO-2.30.** It is not
fixed by the guard this work order moves, and an earlier draft of this paragraph described it wrongly
as hitting `paintPassElapsed()`'s first guard; it does not, except in the tail case where no active
class survives at all. Rather than assert a rare route, the
line now asserts **the property itself**, which is what the title of this work order claims and what
makes the fix worth having on every route, including ones nobody has thought of yet.

**Acceptance**
- [x] With a pass open and the teacher on the Scores screen, crossing a threshold still fires the
      alert — asserted, on a walk that leaves the registry.
- [x] **The alert is computed from the document, not from the banner.** With no `[data-pass-elapsed]`
      node in the banner for the pass — the banner emptied, or holding another class's cards — a pass
      over a threshold still fires: `alerted` is written and the sentence names the student. Asserted
      without the registry being painted, and **it goes red if the guard moves back** above the DOM
      writes; state the red count.
- [x] The card tint and the elapsed figure are unchanged on the registry itself — every existing
      hall-pass check still prints what it printed.
- [x] `src/attendance.js:2899` describes the shipped behaviour, and no longer implies the banner is
      what the alert is driven from.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but
      for the count.

**Traps** — **Do not repaint the hidden banner to fix this.** It is the tempting one-liner in
`afterClassChange()` and it treats the symptom; `paintPassElapsed()` reading the document is the fix,
and the two do not both need doing. **Do not widen the scope to cross-class alerts.** The alert stays
scoped to `openClass()` — WO-2.11 left that door open and WO-2.9 and WO-2.26 both declined it on the
record (`src/attendance.js:2968`), and an alert naming a student from the room the teacher is not in
is a third work order with a surface of its own. **Do not touch the `alerted` field's semantics**
while you are in here: it is the record that makes the alert fire once, it is deliberately not copied
by `closePass()` (`src/passes.js:447`), and it is the reason a returning app announces the worse
threshold rather than both. **This does not make the alert reachable** — see WO-2.29. A build that
closes this line has fixed who the alert is *computed* for, not who can perceive it.

---

## WO-2.29 — the overdue alert gets its primary channel back

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-2.9, WO-2.28

**Booked 2026-08-14, out of WO-2.27's close and a reading of Roll Call!.** WO-2.27 asked whether the
pass clock should keep running once the teacher leaves the registry. Answering it turned up something
better than an answer: **the alert is missing the half that makes the question moot**, and the half
is sitting finished in the reference implementation.

**What WO-2.9 shipped, and what it lifted from.** Planbook's overdue alert is two things: a class on
the pass card, and `announce()` into `#srLive`. `#srLive` lives inside `.sr-only`
(`src/live-region.js:4`) and is **visually hidden by design**. So off the registry the card is on a
banner nobody is looking at and the sentence is inaudible to anyone not running a screen reader — a
sighted teacher entering scores with a student twenty minutes gone is told **nothing**, while the
alert is spent all the same, because `markAlerted()` has written `alerted` to the pass and
`level > alertedLevel(pass)` is false ever after. `src/attendance.js:3008`–`3011` says this is by
design: *"there is no sound at all, so this sentence and the colour on the card are the alert."*

**Roll Call! is where that sentence comes from, and it says the opposite.** Its tick fires
`playAlertFive()` / `playAlertTen()` on the two thresholds, gated on `config.soundsOn`
(`src/dashboard.html:3528`–`3536`), and calls `announce()` beside them under a comment naming its
job: *"Announce as text too, so the alarm isn't sound-only (WCAG 1.4.1 / deaf & hard-of-hearing
users)."* **`announce()` is the accessible mirror of an alert, not the alert.** Planbook lifted the
mirror, left the primary channel behind, and then wrote a comment promoting the mirror to primary.
That is a re-derivation of a decision a year of classroom use already tuned, which is the failure
`CLAUDE.md` names under *"Lift the design with the function."*

**Why a sound is the right surface here specifically, and not just the inherited one.** It follows
the teacher across every screen at no cost, because it is not a screen. And **it names nobody** —
which matters more in this app than in Roll Call!, since the alternative surface, a visible
off-registry indicator, would have to put a student's name or a count on whatever the teacher is
projecting onto a classroom wall. The presentation-mode rule in `CLAUDE.md` is the one that would
have to be negotiated; a tone does not go near it.

**What to lift, and the scar that comes with it.** All of `src/dashboard.html:3448`–`3508`, in this
project's idiom:

- `playToneSequence(notes)` — AudioContext oscillators, **no audio assets**, a fresh context per
  sequence closed on a timeout after the last note. This is the shape that keeps the no-dependencies
  rule: it is a browser API, not a library, and nothing is fetched.
- `playAlertFive()` — a steady two-note 660 Hz beep, five times over ~3 s. `playAlertTen()` — six
  rising pairs from 700 Hz at a higher gain, deliberately more insistent than the first. **Take the
  frequencies and the patterns as they are.** They are tuned to carry across an occupied classroom
  and to be told apart from each other without counting; re-deriving them is the WO-2.11 scar again.
- **The iOS unlock, which is the whole risk.** iOS Safari will not let an `AudioContext` created
  outside a user gesture make a sound, so Roll Call! primes one inside a one-shot `touchstart`
  listener and removes it (`src/dashboard.html:3451`–`3462`). Planbook is an installed PWA that iOS
  suspends; the question this work order must actually answer on glass is whether a context primed at
  the start of a period is still good after a suspend-and-resume, and what to do if it is not.

**The preference.** `soundsOn`, defaulting on, in `localStorage` under `planbook_` — a UI preference
and therefore allowed there (`CLAUDE.md`, Conventions), never in the year document. A teacher
proctoring a test needs one tap to silence it, and it belongs beside the presentation-mode control
rather than buried in a settings screen nobody opens mid-period.

**Deliverables**
- The two alert tones and the unlock, lifted, in a module of their own rather than inside
  `src/attendance.js` — the pass code should ask for an alert, not own an oscillator.
- Both thresholds fire the tone as well as `announce()`, and `announce()` stays, with Roll Call!'s
  reason for it carried across in the comment rather than re-invented.
- The `soundsOn` preference, its control, and the sound respecting it.
- `src/attendance.js:3008`–`3011` rewritten: the sentence claiming the app has no sound is the exact
  comment debt WO-2.27 existed to pay, and it will be false the moment this lands.
- A harness check that the tone is requested at each threshold and suppressed when the preference is
  off. The harness cannot hear anything — assert the call, through a seam that exists for that.
- **A precondition clause on WO-2.28's missing-node check, while you are in that block.** It asserts
  `alerted === 1` after the wind-back and never asserts it was **not** `1` before it, so a refactor
  that pre-set the flag would make it pass vacuously. Today that is closed by evidence rather than by
  assertion — the WO-2.28 mutation run reported `alerted = undefined`, and the restore check's
  `== null` at `tools/verify-shell.mjs:10120`–`10123` reads it on the way out — which is exactly the
  shape [`../dispatch-retro.md`](../dispatch-retro.md) § "Fixture assumptions" says escapes a green
  run. **Add it as a clause on the existing wound assertion, not as a new `check()` site**: a new site
  churns the 754 call-site count `tools/README.md:783` has just settled, for a fixture guard rather
  than a new claim.

**Acceptance**
- [ ] Crossing either threshold plays its tone, and the two are distinguishable from each other.
- [ ] `announce()` still fires at both thresholds, with the same sentence it says today, and the
      comment beside it says it is the accessible equivalent of the sound rather than the alert.
- [ ] The `soundsOn` preference silences the tone and leaves the announcement and the card tint
      alone; it lives under `planbook_` and never in the year document.
- [ ] The tone is asserted in `tools/verify-shell.mjs` through a seam rather than by listening, and
      the check fails if either threshold stops requesting it.
- [ ] No comment in `src/attendance.js` still says this app has no sound.
- [ ] **The alert is audible on the teaching iPad from an installed PWA, on a screen that is not the
      registry, after the app has been backgrounded and resumed.** If the primed context does not
      survive the suspend, the finding and what was done about it are written down here. 👤
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but
      for the count.

**Traps** — **Do not make `#srLive` visible** as a shortcut to a sighted alert. It is one string
shared by the whole app (`src/live-region.js`) and a pass alert is not the only thing that lands in
it; exposing it would put every announcement the app makes on the glass. **Do not add a visible
off-registry indicator in this work order.** It is a defensible feature and it collides with the
presentation-mode rule — a count is arguable, a name is a disclosure — so it needs its own argument
and its own work order, not a corner of this one. **Do not ship a sound with no off switch**, and do
not make the off switch a year-document field: a teacher who cannot silence it during a test will
silence the whole app instead. **The 👤 line is not optional and no harness closes it.** The unlock
path is the entire risk and `verify-shell.mjs` has never seen a service worker, an installed app, or
a suspend.

---

## WO-2.30 — archiving the open class misdirects the pass alert

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-2.9, WO-2.28

**Booked 2026-08-14 out of WO-2.28's close-out, and it is a separate bug rather than a loose end of
that work order.** WO-2.28 made the overdue alert independent of the banner. This is independent of
that fix: it would have been a bug before WO-2.28 and it is still one after, because its cause is not
in `src/attendance.js` at all.

**The bug.** `getSelectedClassId()` (`src/classes.js:165`–`170`) resolves rather than trusts — a
deliberate and correct design, and its comment says why: *"the preference can name a class that has
since been archived or deleted … the answer is the first one that exists rather than nothing. A
header that goes blank because a stored id went stale reads as the app losing the class."* So when
the open class is archived or deleted:

```js
return list.some((c) => c.id === want) ? want : list[0].id;
```

`openClass()` becomes **`list[0]` — the first surviving class, which is not the one that went away.**
`paintPassElapsed()` then walks a *different* class's open passes, on the next tick and every tick
after. A student still out on a pass from the class that was just archived is **never alerted on
again**: no guard fires, nothing returns early, and the loop is busily and correctly processing
somebody else's room.

**It is misdirection, not silence, and that distinction is the work.** An earlier note in this file's
close-out described it as hitting `paintPassElapsed()`'s first guard
(`if (!box || !cls || !doc) return;`, `src/attendance.js:2962`). **That is wrong and the wording has
been corrected.** The first guard only fires when there is no active class left *at all* — the last
class archived — which is the rare tail of a rare case. The ordinary case is that another class
exists, so `cls` is truthy, the function runs happily, and the alert is computed for the wrong room.
A silent return is a feature that stopped; a silent misdirection looks exactly like a working app.

**Why no harness check reaches it today.** WO-2.28's missing-node check punches its hole in the DOM by
hand, which is the honest limit its own `TESTING.md` entry records. This path has to be reached
*through the app* — issue a pass, archive that class from the class manager, and let the clock tick —
and no check in the suite archives a class with a pass open. That is what makes this worth a work
order rather than a comment: **it is invisible to every green run the project currently makes.**

**Deliverables**
- The behaviour decided and implemented. The three candidates, and the decision belongs in the work
  order before code is written: close the open passes of a class being archived (the pass's room no
  longer exists, so the trip is over); or leave the passes and refuse to let `openClass()` silently
  become a class whose passes nobody is watching; or alert across the boundary, which
  `src/attendance.js:2970`–`2981` has now refused on the record three times and should not be
  reopened casually.
- Whatever is chosen, `src/passes.js` and the archive path in `src/classes.js` agree about what
  happens to an open pass when its class stops being open.
- A harness check that reaches it **through the app** — a pass issued, the class archived, the clock
  ticked — rather than by editing the DOM.

**Acceptance**
- [ ] Archiving a class with a student out on a pass has a defined, written-down outcome, and the
      work order says which of the three it is and why.
- [ ] A student out on a pass in the archived class is not silently left un-alerted while a different
      class's passes are processed in their place.
- [ ] The check drives the real path — issue, archive, tick — and fails on today's build.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but
      for the count.

**Traps** — **Do not "fix" `getSelectedClassId()`'s fallback.** Returning `''` instead of `list[0]`
would blank the header on a stale id, which is the exact failure its comment was written to prevent,
and it would reach far beyond hall passes. The fallback is right; what is missing is anything that
notices a pass was left behind by it. **Do not reach for the cross-class alert** as the easy answer —
see the refusal at `src/attendance.js:2970`–`2981`, which is now three work orders deep and names the
real objection: an alert about a child in a room the teacher is not in, with no card, no Return
button and nothing to act on. **This is not a WO-2.28 regression** and its fix does not belong in
`paintPassElapsed()`'s loop.
