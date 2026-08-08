# WO-2.4 — Counts & attendance percentage · implementation brief

**Route** Codex
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.4-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to Codex because the spec is complete and lives outside the work
order — the percentage formula is written out verbatim as a *compatibility requirement* with Roll
Call! rather than a design choice, the meeting predicate is already settled and implemented in
`src/attendance.js`, and every Acceptance line is checkable by running it. The runner-up
consideration set aside: WO-2.4 carries a 🚩 go-live blocker mark, which the rubric defaults to
Claude — but "unless they land squarely in the Codex column," and specified arithmetic against a
fixed formula is the squarest case in that file. The exec-time write probe passed (`SMOKE OK`)
before this brief was written.

**The one thing that makes this work order harder than it reads:** almost every number you need is
*already defined* somewhere in this repo, and your job is to find and reuse those definitions rather
than to re-derive them. Two functions in `src/attendance.js` carry comments addressed to WO-2.4 by
name. They are quoted in § 2 below. Re-deriving either one is the failure mode here.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

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

## 2. Read these first, before writing anything

- `AGENTS.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/attendance.js` — the module this work order extends. Read `stateOf()`, `coverOf()`,
  `countsFor()`, `meetingsBetween()`, `readingOf()`, and the `MARKS` / `PRESENT` / `UNCONFIRMED` /
  `STORED_MARKS` block, **with their comments**. Details below; they are the spec.
- `plans/rotating-schedule.md` § Precedence — the decision record behind `stateOf()`. There is
  deliberately no schedule model in this app; a cycle model was designed and removed the same day.
- `docs/data-model.md` — attendance record shape (~line 110), the "stores only exceptions" rule
  (~line 169), and the signals section (~lines 350–356), which states the same formula and the
  meetings-not-days windowing rule this work order must serve.
- `src/calendar.js` — `coveringEvent()`, WO-2.3's read side. Events are **read, never copied**.
- `src/home.js` and `src/views.js` — where per-class surfaces already render, for the
  "counts visible per class and per student" deliverable.

### The four things already decided, that you must not re-decide

**1. The meeting predicate already exists. Do not write a second one.** `stateOf(classId, date)` in
`src/attendance.js` is it, and its comment says so: *"Everything on the home screen, every column
header on this screen, and every later phase's meeting count reads this rather than testing
`exception` for itself."* A meeting is `stateOf(...) === TAKEN`. The precedence order is load-bearing
and is `plans/rotating-schedule.md` § Precedence in code:

```
a record with no `exception`  → the class MET. Asked first, and nothing after it can undo that.
a record with an `exception`  → it did not meet, from its own record.
no record, an event covers it → it did not meet, from the calendar.
nothing at all                → nobody has taken it yet.
```

This is also why Acceptance line 2 falls out for free rather than needing a calendar check bolted
onto your counter: a `no-school` day the teacher never took has **no record**, so it is not a
meeting. A retroactive snow day laid over a week that really was taken **still counts as meetings** —
the record is answered before the calendar is consulted. That is the design, not a bug to fix. If
you find yourself adding a `coverOf()` test to the denominator, stop: you are rebuilding the
precedence rule in a second place, and the second place is the one that will drift.

**2. `U` (unconfirmed) folds into `A` in the percentage — and nowhere else.** WO-2.10 added a
temporary code that is not a sixth mark. `countsFor()`'s comment addresses you directly:

> `U` IS COUNTED APART FROM `A` HERE AND FOLDED INTO IT THERE. WO-2.4 owes
> `(P+T+E+D)/(P+T+A+E+D)` with every `U` in the denominator alongside the absences — that is the
> arithmetic. What this function feeds is the SCREEN […] Two numbers here, one sum there.

So: in your per-term and per-year totals, a `U` counts as an absence. Do **not** add a `U` column to
a teacher-facing count display, do not report "1 unconfirmed" as a mark she made, and do not change
`countsFor()`'s two-number behaviour — it feeds a different surface for a stated reason.

**3. Present is the absence of a mark.** `readingOf()` is the single reader: an entry reads as its
own code; no entry on a record that exists reads as `P`; no entry and no record reads as `U`. Your
per-student counts must go through this, not iterate `marks` directly — otherwise a student added to
the roster after a class was taken silently drops out of that class's denominator, and every
percentage in the term is quietly wrong in a way no test you write will notice.

**4. Per class, always.** The denominator is *recorded meetings of that class*. A student in two
classes has two different denominators. There is no such thing as a school-wide meeting count here.

### On the window helper

The work order asks for `last N meetings of this class`, exported for Phase 4. `meetingsBetween()`
already exists but answers a different question (every class, a date range, for WO-2.3's warning).
Build the new one on `stateOf()`, take it in meetings rather than days, and scope it to one class.
Phase 4 is out of scope — export the helper, do not build signals or thresholds on it.

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

## 5. Done means these 6 lines, reported against one by one

1. Percentages match a hand count across a term of a randomly shifting rotation. *(One of the three things that must be right before students walk in — verify against a real class.)*
2. Dropped days and `no-school` days are absent from both numerator and denominator.
3. A student with one excused absence out of ten meetings shows 100%, not 90%.
4. Untaken days do not appear in the denominator.
5. A student with zero recorded meetings shows an honest empty state, not `NaN` or `0%`.
6. Cross-checked against Roll Call!'s number for the same class and date range.

**Lines 1 and 6 are the owner's, not yours.** Line 1 says *verify against a real class* and line 6
says *cross-check against Roll Call!'s number* — you have neither a real class nor the Roll Call!
data. Lines 3, 4 and 5 you can close outright with fixtures. Line 2 you can close for the two shapes
the predicate produces (a `dropped` record, and a `no-school` day with no record) — and you should
say explicitly, in your report, what a retroactive snow day over a taken week does to the count, so
the owner can confirm that is what she wants before students walk in.

What would help the owner most on 1 and 6: leave behind a way for her to *check* rather than a claim
that it works. A worked example with the arithmetic shown beats a green tick she cannot audit.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

