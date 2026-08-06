# WO-2.1 — Attendance registry: students × recent days · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.1-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, **Opus** tier. The deciding signal is `ROUTING.md`'s "design-system
lift from Roll Call!" criterion — this work order's central instruction is to read another repo's
4,000-line `dashboard.html` and exercise taste about what transfers, which is cross-repo reading plus
judgment; it stacks with size `L`, the 🚩 go-live-blocker default, and a Traps section that is purely
about judgment. The runner-up I set aside: this screen is far more specified than it was twelve hours
ago, now that it has a reference implementation, which is the strongest Codex argument available here
— but the Codex criterion is "the spec lives outside the work order **and is complete**," meaning a
written spec like `docs/data-model.md`, not a reference you must read selectively. A model to copy
lowers the design risk; it does not remove the judgment. Agrees with the Ship 1 table's row 11.

**This is a rebuild, and that changes what you are walking into.** Read § 6 before you write anything.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

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

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/attendance.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **The reference implementation, read before you design anything.** Roll Call!'s registry view:
  `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\src\dashboard.html`.
  I verified every one of these anchors resolves in the current file — go to them directly rather
  than reading 4,000 lines:
  - `#registryView` — **line 1262**. The whole surface: panel header, search, filter pills, sort,
    and the table. This is the shape you are lifting.
  - `DEFAULT_DAY_COLS = 6` — **line 3902**, with a comment above it stating the windowing rule.
  - `getWindowedDays()` — **line 3904**. Note the `focusedDayIdx` branch: Roll Call! can narrow to a
    single day and widen back. Read it; decide deliberately whether Planbook needs it.
  - `renderHead()` — **line ~3987**, the `getWindowedDays(qData).map(...)` block. This is where the
    column header carries per-day state: `isToday`, `isException`, `editingPastDay`, and the
    `today` / `no-school` / `editing-past` classes. Your header has to carry more than this one
    does — see § 6.
  - `CYCLE` and `cycleAttendance()` — **line 3543**. Roll Call!'s today-cycle is
    `['', 'P', 'A', 'T', 'E']`.
  - `cyclePastAttendance()` — **line 3802**. Note it is a *separate function with a different cycle
    order* (`['P','A','T','E','']`) and its own guard on `d.isException` / `d.sheetCol < 0`.
    Planbook has one cycle, stated in the Deliverables. Do not import this split.
  - Also read the CSS for `.today`, `.no-school`, `.editing-past` and the registry table rules —
    the visual encoding of the three states is the part that has to survive the port.
- **Roll Call!'s `design/style-guide.md` and `design/portable-components.md`**, same repo, per
  `CLAUDE.md`'s standing instruction. Lift components rather than hand-designing them.
- `plans/rotating-schedule.md` — the phase file tells you to read this **before starting anything in
  Phase 2**. It is a decision record about why there is no schedule model, and it exists because the
  next session will want to build one. The "last N weekdays by calendar" rule below is the thing it
  is protecting.
- `src/attendance.js` **in full**, including its header comments — the reuse boundary in § 6 depends
  on you having read them. `src/attendance.css`, `src/home.js`, `src/home.css`, and the WO-1.10 home
  card slot you are filling.
- `src/classes.js` for `getSelectedClass()`, `src/store.js` for `update()` / `getDoc()`, and
  `src/roster.js` for the search / sort / filter-pill conventions this project already established —
  the Deliverables ask for search, filter-by-mark pills, and name sort, and `roster.js` has already
  chosen how those look here. Match it; do not invent a second idiom.

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

## 5. Done means these 12 lines, reported against one by one

1. A mark lands and survives a reload. *(One of the three things that must be right before students walk in.)*
2. **Six days of columns are visible at once for a class of 26 without sideways scrolling on an iPad**, in the orientation the owner actually holds it. 👤
3. A dropped class and an untaken class are visually distinguishable without reading fine print, and are distinguishable in the stored document — **in the column header and in the cells under it.**
4. Marking a class taken with zero exceptions still creates a record — otherwise "taken with everyone present" is indistinguishable from "forgot."
5. One tap drops a class; one tap undoes it.
6. Taking attendance for a class of 25 with two absences takes under 15 seconds on an iPad. 👤 *(Needs a real iPad and a stopwatch.)*
7. **Attendance can be recorded for a date two weeks back and it lands on that date** — reached from this screen, without a separate view.
8. **The "not today" indication is visible in a glance, on an iPad, in a classroom.** 👤
9. **Future dates are either blocked or clearly flagged** — marking Friday's attendance on Wednesday is a mistake, not a feature.
10. **A hole deliberately left three days earlier is findable by looking at the grid**, without remembering which day it was.
11. All five marks are reachable from a cell without opening a submenu or leaving the row.
12. The document after a full day of five classes contains no `P` entries.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

---

## 6. Notes from the orchestrator — read before writing code

### This is a rebuild against verified, committed code

The tree is clean and two commits are already on `phase/2-attendance`:

- **`11f0780`** — the first pass. A one-class, one-day screen with five explicit `P T A E D` buttons
  per student. It passed all seven of its acceptance lines. The owner opened it and found it worse
  than the app it replaces. **The fault was in the work order, not the build** — do not read this as
  sloppy work to clean up, and do not assume anything in it is wrong just because the screen is being
  replaced.
- **`ce62d39`** — the re-plan you are working from.

**This is not an interrupted-run audit.** The code you are editing is committed and covered by 260
harness checks. You are not sifting an unverified draft; you are replacing one half of a working
module and keeping the other.

### The reuse boundary, stated precisely — this is the most likely way this goes wrong

The work order says: *reuse `stateOf()`, `setMark()`, `dropClass()`, `ensureRecord()` and the
exceptions-only guard; do not rewrite.* Read that as **do not rewrite the storage semantics**, not as
*do not touch these lines.* The difference matters, because of this:

```js
function openClass() { return getSelectedClass(); }
function viewDate() { return todayISO(); }
```

`setMark()`, `takeClass()`, `untakeClass()`, `dropClass()` and `undropClass()` all call `viewDate()`,
which is hardcoded to today. **A grid whose whole point is marking past dates cannot use them as
they stand.** So:

- **Thread the date through.** Give those writers an explicit date parameter (defaulting to today, or
  taken from the grid's column) so the guard, the `P`-deletes-rather-than-writes rule, the
  `record.exception` refusal, and the no-op-on-same-code rule all still run on exactly one code path.
  That is a signature change to code whose *semantics* you are preserving. It is in scope and it is
  the intended reading.
- **Do not build a parallel writer for grid cells.** Two writers means two exceptions-only guards,
  and the second one is where a `P` eventually gets stored. If you find yourself writing a new
  `update((d) => ...)` that touches `d.attendance`, stop — that logic already exists.
- **`stateOf()`, `recordFor()`, `countsFor()`, `stateSummary()` already take `(classId, date)`** and
  need no change at all. Only the writers carry the implicit today.
- Preserve the reasoning in the header comment above `viewDate()`: today is asked for **freshly at
  every render** rather than captured at open, so an app left open across midnight does not go on
  writing yesterday. Your six-day window has the same hazard and needs the same treatment — compute
  the window at render, not at open.
- The `renderAttendance()` / `paintHeader()` / `paintRow()` / `markButtons()` / `studentRow()` half
  of the file, and all of `src/attendance.css`, is what you are replacing.

### One place Roll Call! must NOT be copied

`getWindowedDays()` slices `qData.days` — **the days that exist in the sheet**. Planbook's columns are
**the last N weekdays by calendar, Mon–Fri**, whether or not a record exists. This is stated in the
Deliverables and it is the entire mechanism behind acceptance line 10: a day you forgot has no record,
so a window built from records would silently omit exactly the day you need to find. Take the
*shape* of `getWindowedDays()`; do not take its data source.

Relatedly, Roll Call! splits today and past into `cycleAttendance()` / `cyclePastAttendance()` with
two different cycle orders. Planbook has **one** cycle — `'' → A → T → E → D → ''` — and the
Deliverables require you to **name that divergence in the UI**, because the owner has `'' → P → A → T → E`
in her fingers from Roll Call! and will tap expecting `P` first.

### The ambiguity the Traps section is about

An empty cell means *present* on a date the class was taken, and *no data at all* on a date it wasn't.
Acceptance lines 3 and 10 both turn on this. It is not enough for the column header to carry the
state — the work order says **"in the column header and in the cells under it."** Untaken cells and
present cells must not look alike at arm's length on a wall-mounted iPad.

### Scope fences specific to this rebuild

- **`TESTING.md`:** its existing WO-2.1 section is marked *superseded 2026-08-06* and describes
  `11f0780`. **Leave it exactly as it is** — it is a record. **Append a new section** for the grid.
- **`CHANGELOG.md`: do not touch it.** Standing rule, teacher-owned. Draft wording in your result
  file if you like.
- **WO-2.2 is a tombstone**, deliberately demoted out of `##` so `wo-gate.mjs` no longer parses it.
  Do not restore it, do not reuse the ID, and **do not look for a seam between "today" and "past
  dates"** — the tombstone says in as many words that this is the one place there isn't one.
- **Calendar events (`no-school`, pre-drops) are WO-2.3.** This screen reads them *later*. Do not
  build event authoring or event-aware column state now — but do not design the column header in a
  way that cannot accommodate a fourth reason a class did not meet.
- Percentages are WO-2.4, the keyboard path is WO-2.5, per-student history and print/CSV are WO-2.6.
  A grid makes all three feel one small step away. They are out of scope; propose, don't build.

### On the checkboxes

Per `ROUTING.md`, implementers tick as they go — including `plans/` and `TESTING.md`. **Three of the
twelve acceptance lines are 👤** (2, 6, 8) and need a real iPad in the owner's hands. Leave those
`- [ ]` no matter how good your desk-side evidence looks, and say plainly in your result what you
could and could not check. A tick you cannot point at evidence for is worse than a blank box.

### Report to `.claude/dispatch/WO-2.1-result.md`

The first pass's brief and result are archived beside it as `WO-2.1-brief-superseded-11f0780.md` and
`WO-2.1-result-superseded-11f0780.md`. You do not need to read them; the work order's "Read this
before building" paragraph already carries what they'd tell you.
