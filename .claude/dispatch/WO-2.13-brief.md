# WO-2.13 — The totals are recomputed once per student; compute them once per render · implementation brief

**Route** Codex
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.13-result.md` — as your last act, and return it in-band too.

**Routed to Codex.** The deciding signal is that this work order's specification *is the existing
code* — every Acceptance line is machine-checkable without taste: byte-identical `attendanceTotals()`
return objects, the eleven WO-2.4 checks passing unmodified, a call count on `meetingDates()`, a grep
of the diff for second copies of `stateOf()`/`readingOf()`. No new visual language, no sensitive
surface, and the hoist convention to follow (`perColumn`, `cover`, `passesFull`) is already written
within twenty lines of the code being changed. The runner-up consideration set aside: the Traps
section reads more judgment-flavored than a typical Codex row, but each of its three traps carries a
mechanical check behind it and all three are inlined verbatim below — they are constraints to obey,
not taste to exercise. The exec-time probe passed `SMOKE OK` before this brief was written.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.13 — The totals are recomputed once per student; compute them once per render

**Ship** 1 · **Status** 🔨 IN PROGRESS · **Size** S · **Depends on** WO-2.4
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
- [ ] **Every total is byte-identical to today's output.** This is a pure refactor. Assert the full
      `attendanceTotals()` return object — counts, `meetings`, `attended`, `percent` — for a roster
      including a student with no marks at all, a student with an `E`, and a student with a `U`,
      against the values recorded in `tools/verify-shell.mjs`'s WO-2.4 block today.
- [ ] All eleven existing WO-2.4 checks still pass, unmodified. If a check has to be edited to
      accommodate this change, that is a behavior change and the work order has gone wrong.
- [ ] A before/after measurement of `renderAttendance()` at 875 records / 175 meetings / 27 rows,
      taken the same way both times, reported as two numbers. The before figure is 76 ms.
- [ ] `meetingDates()` is called **O(1) times per render**, not once per student. Assert it by
      counting calls, not by reading the code.
- [ ] `stateOf()` is still the only meeting predicate, and `readingOf()` is still the only cell
      reader. No second copy of either appears anywhere in the diff.
- [ ] The detail panel and the class-level count line show the same numbers they show today.
- [ ] Marking a student re-renders with the new totals immediately — the shared pass is rebuilt per
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

---

## 2. Read these first, before writing anything

- `AGENTS.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/rotating-schedule.md`
  - `src/attendance.js`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Four facts about the tree as it stands today, verified before this brief was written.** These are
observations, not a design — how to satisfy the work order is yours to decide. They are here because
each one is cheap to miss and expensive to find later.

1. **Every line number in the work order still resolves exactly.** `meetingDates()` at `:1129`,
   `attendanceTotals()` at `:1153`, the per-student call at `:2943-2944`, the detail panel at
   `:3052-3053`, the class-level counts at `:3114-3116`. `src/attendance.js` is 3,191 lines. You do
   not need to go hunting for the sites.

2. **`renderRows()` has four callers, not one — and this is the trap behind Acceptance line 7.**
   `renderAttendance()` calls it at `:3162`, but `setSearch()` (`:1958`), `setFilter()` (`:1964`) and
   `setSort()` (`:1970`) each call `renderRows()` **directly**, rebuilding the rows and nothing else.
   A shared pass computed at the top of `renderAttendance()` and read from inside `renderRows()` is
   therefore undefined or stale on every search keystroke, filter change and sort toggle. Note that
   `renderRows()` is also exactly where `perColumn`, `cover` and `passesFull` are already hoisted —
   the "same place and same style" the Deliverables ask for.

3. **Two windows are in play, not one, and both are per-render.** The per-student line uses
   `termTotals(cls.id, student.id, term)` when `termHasDates(term)` and `attendanceTotals(cls.id,
   student.id)` otherwise; the detail panel needs the year total **and** the term total at the same
   time (`:3052-3053`); the class-level line needs `inYear` **and** `inTerm` (`:3114-3116`).
   `termTotals()` (`:1168`) is a wrapper over the same `from`/`to` parameters. A hoist that covers
   only the currently-selected window leaves the other one being recomputed per student.

4. **Acceptance line 1's fixture already exists — reuse it, do not build a second one.** The WO-2.4
   block in `tools/verify-shell.mjs` (starts `:9121`, the section header is
   `recorded-meeting counts and Roll Call! percentage (WO-2.4)`) already constructs and asserts all
   three students that line names: `excused` (a student with an `E`), `noMarks` (the
   `wo-2-4-no-marks` student with no marks at all), and `withU` (a student with a `U`), plus `zero`,
   which is the `percent: null` case the third Trap is about. Acceptance line 2 says those eleven
   checks must pass **unmodified** — so assert the full return objects *additively*, in your own new
   block, rather than by editing theirs.

**On the measurement (Acceptance line 3).** The work order records the before figure as 76 ms, but
that number was taken on an earlier tree. Take **both** numbers yourself, the same way, in the same
session — measure the unmodified tree first, then your change — and report all three: your before,
your after, and whether your before agrees with the recorded 76 ms. If it does not, say so plainly
rather than reconciling it; a shifted baseline is information, not a discrepancy to hide.
`tools/README.md` § "Driving a browser over CDP" is required reading before you time anything —
item 4 there is specifically about fixed sleeps before a measurement being a race that hides
defects.

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

## 5. Done means these 7 lines, reported against one by one

1. **Every total is byte-identical to today's output.** This is a pure refactor. Assert the full `attendanceTotals()` return object — counts, `meetings`, `attended`, `percent` — for a roster including a student with no marks at all, a student with an `E`, and a student with a `U`, against the values recorded in `tools/verify-shell.mjs`'s WO-2.4 block today.
2. All eleven existing WO-2.4 checks still pass, unmodified. If a check has to be edited to accommodate this change, that is a behavior change and the work order has gone wrong.
3. A before/after measurement of `renderAttendance()` at 875 records / 175 meetings / 27 rows, taken the same way both times, reported as two numbers. The before figure is 76 ms.
4. `meetingDates()` is called **O(1) times per render**, not once per student. Assert it by counting calls, not by reading the code.
5. `stateOf()` is still the only meeting predicate, and `readingOf()` is still the only cell reader. No second copy of either appears anywhere in the diff.
6. The detail panel and the class-level count line show the same numbers they show today.
7. Marking a student re-renders with the new totals immediately — the shared pass is rebuilt per render, not carried between them. 👤 *(A stale total after a tap is the failure mode this work order introduces if it gets caching wrong, and it is the one a desk check will miss.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

