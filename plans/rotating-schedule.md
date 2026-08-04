# Schedule: why there isn't a schedule model

**Decision record — 2026-08-03. Status: settled.**

Planbook has **no schedule object, no cycle, no day rotation, and no meeting pattern.** A class
either has attendance recorded on a date, or that date is marked as an exception. That is the
entire model.

This document exists because a future session will look at a rotating schedule and start building
a cycle model. Don't. It was designed, and then removed on the same day, for the reasons below.

## What was rejected

A first pass modelled the owner's rotating/drop schedule properly: named cycle days, a map of which
classes meet on each, and a materialized date → cycle-day calendar with a `shiftCycleFrom()`
operation for unplanned closures.

It was wrong, for a reason no amount of careful design fixes: **the schedule rotates *and* changes
randomly.** Assemblies, delays, drills, field trips, weather. A model whose whole value is
predicting which classes meet today is worthless when the answer changes on the morning
announcements — and worse than worthless, because now there is a second source of truth that
disagrees with reality and has to be corrected by hand anyway.

Roll Call! already solved this, and its solution is the one to copy: each class independently
records the days it met, and exception markers (`dropped`, `snow day`, `holiday`, `no school`,
`day off`) mark the days it didn't. There is no global schedule anywhere in that app.

## What Planbook does instead

Attendance carries the exception on the record itself:

```jsonc
"attendance": [
  { "classId": "c_bio1", "date": "2026-09-09", "marks": { "s_…": "A" } },
  { "classId": "c_lab",  "date": "2026-09-09", "exception": "dropped" },
  { "classId": "c_bio1", "date": "2026-09-07", "exception": "no school" }
]
```

- `exception: null` (or absent) — **the class met.** This is a meeting; it counts.
- `exception` set — the class did not meet. It does not count toward anything.
- **No record at all** — attendance hasn't been taken yet. This is *not* the same as a dropped day,
  and the difference matters: "did the class not meet, or did I forget?" is a question the teacher
  needs answered, and it's the single most useful thing the home screen can tell them.

## The flow

The day loads showing all five classes. The teacher marks attendance for the ones that met and taps
**dropped** on the ones that didn't. That's it — one tap for a dropped class, and nothing to
configure at the start of the year or maintain when the schedule changes.

Marking a past date is possible too, since a forgotten day is more common than a dropped one.

## Setting exceptions ahead of time

Two things are known in advance and shouldn't wait for the day to load: **holidays** (the whole
school is out) and **pre-drops** (an assembly is shifting the rotation on Thursday, so two classes
won't meet). Both are supported, and they're authored in different places for a reason.

| Known in advance | Where it lives | Why |
|---|---|---|
| School-wide days off, breaks, holidays | A calendar `event` of kind `no-school`, with a date range | It's one entry for all classes and all days of a break, and it belongs on the calendar the teacher already reads |
| A class not meeting on a known future date | A calendar `event` of kind `dropped` naming those `classIds` | Same-day drops are a tap; a *planned* drop is a thing you want to see coming on the calendar |
| "We didn't meet today" | An attendance record with `exception` | The ledger, written as it happens |

**Calendar exceptions are read, never copied into attendance records.** This is the same rule the
events model already follows: delete the holiday and every class follows automatically. Copying
would create the second source of truth this whole design exists to avoid.

### Precedence

A class **met** on a date if it has an attendance record with no `exception`. Otherwise it did not
meet, whether that's from its own record or a calendar event covering the date.

One rule protects history: **a day with attendance actually recorded stays a meeting**, even if a
calendar exception is added over it later. Someone marking a retroactive snow day must not silently
void a period's real attendance. Warn, and leave the record alone.

## What this buys

| | With a cycle model | Without |
|---|---|---|
| Year setup | Cycle length, meeting map, start date, holiday list | Nothing |
| A random schedule change | Correct the calendar, then take attendance | Take attendance |
| Source of truth | The calendar *and* the attendance record, which can disagree | The attendance record |
| Sellable to a teacher on a different schedule | Needs their pattern to be expressible | Works, unchanged |

That last row matters for more than convenience: **every schedule is expressible in this model,
because it doesn't model schedules.** A daily schedule, A/B blocks, a six-day rotation, and a
college-style twice-a-week section are all just classes with attendance on some days and not others.

## Consequences elsewhere

- **Attendance denominator is recorded meetings** — attendance records for that class with no
  exception. Never calendar days, never a formula.
- **Signal windows count meetings**, e.g. "4 absences in the last 20 meetings *of that class*."
- **The percentage formula matches Roll Call!**: `(P+T+E+D) / (P+T+A+E+D)`. Excused absences and
  dismissals sit in the numerator — an excused absence does not damage a student's rate. Matching
  matters because the owner reads both apps' numbers this year and they must agree.
- **Assignment due dates are plain dates.** There is no "next meeting" to default to, and inventing
  one would require the model this document rejects.
- **The glance page shows all classes** with their state for today — *taken · dropped · not yet* —
  rather than predicting which ones meet.
- **Nothing needs to know class times or period order.** The owner only needs to know *that* a
  class met, not when. No bell times anywhere.
