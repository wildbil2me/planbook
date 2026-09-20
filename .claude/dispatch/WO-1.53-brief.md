# WO-1.53 — the residue meets the register's earlier page for a week every September · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.53-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude **Opus**, on the work order's own merits: the Open section hands you a
three-way design choice to settle *in writing*, and the Traps are about judgment — "fix the crossing,
not the window"; the residue is deliberate and must survive — which is `ROUTING.md`'s fifth Claude
bullet. The runner-up set aside was the Codex budget arithmetic: the Acceptance wants at least six
full harness runs (one pre-repair reproduction, four `--today` dates, one real clock) at ~4.4+ min
each, ~26+ min against a 20-min cap — which takes Codex off the table on its own but never decides
the tier. Tooling only: nothing under `src/` or `index.html` is expected to move.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.53 — the residue meets the register's earlier page for a week every September

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-19 · **Size** S · **Depends on** WO-1.44 ✅ · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.52 made.
Booked 2026-09-17 out of WO-6.9's verdict, whose verifier ran the harness twice on the same tree:
`--today=2026-09-16` at 1411/1411 and the real clock at 1396 · 1391 · 5 failed · EXIT=1. The tree
was innocent both times.)*

**Why it exists.** `tools/verify/classes-terms.mjs:705` plants an attendance record on a hard-coded
`2026-09-09` for a class it is *not* about to delete, so that "it deleted the right one" is
falsifiable, and `tools/verify/attendance.mjs:174` keeps that residue on purpose — it is the only
thing in the run that can catch a screen writing onto the wrong date or reading the array without
filtering. The same file names the one day it knew the residue would collide with the clock: a run
taken **on** 2026-09-09, when the attendance section's first check reads `start.today` and finds a
record it did not write (`attendance.mjs:648-660`).

**There is a second window, and it is a week long.** `tools/verify/attendance-passes.mjs:2172` takes
`offWeek = nodeColumns(6, 1)` — the six weekdays before this week's six, which is the page the
register draws when a teacher taps *earlier* — drops its oldest column by hand, and asserts the other
five are **empty** before measuring that every class shows as not-meeting across them. By arithmetic
the five-day range holds 2026-09-09 on every run from **2026-09-17 through 2026-09-23**; on
**2026-09-24** the residue is the dropped edge instead. On the first of those days, 2026-09-17, the
WO-2.3 precondition failed, three checks measured a non-empty week, `clickSel('#attendanceHead
[data-dayoff-panel]')` threw, and the section lost fifteen checks it named as lost. Every later
section ran. That is WO-1.44's containment doing what it was built for, and it is also the third site
of WO-1.44's collision to be found by a run rather than reasoned about — the first two are documented
at `attendance-passes.mjs:2186` and `:2302`. **The edge fails too, and differently** — driven the
day this was booked, `--today=2026-09-24` ran **1411 · 1410 · 1 failed**, no throw and nothing
lost: the one-event check at `:2368` wants the edge column reading five `not-taken` and one
`dropped`, and the neighbour reads `taken` there. So the window is **eight days**, the first seven
by cascade and the eighth by a single quiet red line.

**It is not WO-1.46's seventh site, and its helper does not fit.** WO-1.44 counted six sites that
*guess a date forward* — `today + 9`, `nodeWeekdayAhead(n)` — and the repair shape both rows settled
on is a walk to the first future day the document has nothing on, because those sites are free to
pick any date. This site is not free to pick: the earlier page is whatever page the app draws for the
clock it is given, and a range walked forward off it stops being the earlier page. The residue and
the range are each right on their own terms; what nobody had written down is that a hard-coded date
and a clock-derived window are two things that cross once a year, and `nodeColumns()` crosses this
one for eight days rather than one. **Fix the crossing, not the window.**

**The urgency is the shape WO-1.46 records, with one difference.** It fails safely — its own section,
named losses, the rest finishing — so nothing about the build that met students on Sep 2 changes.
What changes is that **every real-clock `verify-shell` run from 2026-09-17 to 2026-09-24 is red**,
and until this lands the pre-deploy check that week is `--today=<a date outside the window>`, which
is the flag doing exactly what WO-1.44 built it for. After 2026-09-24 the real clock stops showing
it, and the only way to see it again is the flag — so a row verified on a real-clock run taken after
that date has verified nothing.

**Open** — *which side moves, and it is the implementer's to settle in writing.* Three shapes, and
two of them are wrong in a way the Traps name:
- **Derive the residue's date from the clock at a distance no clock-derived window reaches** —
  before the earlier page, before any `nodeColumns()` offset the harness uses. This is the one that
  closes the 2026-09-09 window at `attendance.mjs:648` in the same stroke, because the residue is
  then never *today* either. Check that the delete confirm's meeting count does not care whether the
  record sits inside a term; if it does, say so at the line and pick the date inside the term's own
  fixture dates rather than the calendar's.
- **Route the range around the residue** — read the document before choosing the offset, the way
  `preDropDayFrom()` reads it. Wrong for the reason in the paragraph above: the page is not the
  fixture's to choose.
- **Clean the residue out of the range at the site** — a second document write in a sub-section
  whose comment says it makes exactly one, and it costs every later section its wrong-date catch on
  precisely the days the catch would fire.

**Traps**

- **Derive, do not widen the guess** — WO-1.46's first trap, and it applies backwards too.
  `nodeColumns(6, 2)` moves the window to 2026-09-24 through 2026-09-30 and nobody has driven it.
- **The residue is deliberate, and `attendance.mjs:174-179` says why.** A fix that deletes it,
  filters it out at the reader, or plants it and then removes it has not fixed a collision; it has
  removed the thing the collision was between. Whatever moves, the neighbour's record must still be
  in the document when § attendance takes its first read, on every date driven.
- **Two windows, one residue.** The day-of collision at `attendance.mjs:648-660` and this week-long
  one are the same hard-coded date meeting the clock two ways. A fix that closes one and not the
  other should say at the line why the other survives — and the comment at `:656`, which names the
  collision "if a run ever happens to fall on one of those dates", is now half true and wants
  re-reading either way.
- **`--today` is the reproduction and the proof, and the week is not.** The defect is live on the
  real clock for eight days a year; driving it on demand is what WO-1.44's flag is for. Do not
  wait for 2026-09-17 to come round, and do not close this on a green real-clock run taken on the
  25th or later.
- **The edge is its own case.** On 2026-09-24 the residue is `offEdge`, the column the sub-section
  drops *by hand* through the register's own controls before its baseline — and the drop lands on
  the *marking* class while the residue sits on the neighbour, so the edge column carries a `taken`
  the check at `:2368` never budgeted for. It fails one line rather than fifteen, which is the
  quieter of the two and the easier to leave unfixed; a range fix that leaves the edge alone has
  closed seven days of eight.

**Acceptance**
- [ ] On the **pre-repair** tree, `node tools/verify-shell.mjs --today=2026-09-17` reproduces the
      failure: the WO-2.3 precondition red, and the section reporting checks lost. *(That is the
      reproduction this row has; use it before touching anything.)*
- [ ] After the repair, `node tools/verify-shell.mjs` is green with `--today` on **2026-09-17,
      2026-09-23, 2026-09-24 and 2026-09-09** — the first day of the range, the last, the edge, and
      the day-of window at `attendance.mjs:648` — and on the real clock the day of the sitting.
- [ ] The residue survives: on every date driven, a record planted by an earlier section is still in
      `doc.attendance` when § attendance takes its first read, and `attendance.mjs:174`'s reason for
      keeping it is still true of the document. A check asserts it rather than a comment.
- [ ] The WO-2.3 site still asserts an empty five-day range as its precondition, and a comment at
      the line says how the range can no longer hold the residue — derived, not widened, per the
      first trap.
- [ ] Which of the three shapes was taken and why is written at the site that moved, and the comment
      at `attendance.mjs:656` is re-read and either still true or corrected.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify-shell.mjs`
  - `tools/verify/attendance-passes.mjs`
  - `tools/verify/attendance.mjs`
  - `tools/verify/classes-terms.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/lib-dates.mjs` — the **one** clock. `nodeToday`, `nodeNow()`, `nodeColumns()`,
  `nodeWeekdayAhead()`, `SHIFT_DAYS`; its header says why a second answer to "what day is it" is the
  defect it guards. If the residue's date is derived, it is derived from *this* module's values,
  never from a fresh `new Date()`.
- `tools/verify/attendance-passes.mjs:2186` and `:2302` — the two WO-1.44 repair sites. Read them
  for the *shape of the comment* this project writes at a site that moved, not for the shape of the
  fix: the work order says in as many words that their walk-forward helper does not fit here.

## Traps the tree will not tell you

- **Run the reproduction first, on the untouched tree, and record its three summary numbers.**
  `node tools/verify-shell.mjs --today=2026-09-17` on the pre-repair tree is Acceptance line 1 and
  the only reproduction this row has. If you touch a file before running it, you have lost it.
  Same for `--today=2026-09-24` (expected 1411 · 1410 · 1 failed, no throw) — that is the edge case
  and it fails *differently*; a fix that closes the cascade and not the edge has closed seven days
  of eight.
- **The plant site is a template literal evaluated in the page.** `classes-terms.mjs:699-705`
  builds page-side JS with `${JSON.stringify(...)}` interpolation. A Node-derived date reaches the
  page the same way `victimId` does — interpolated — not by reading the page's clock, which would be
  a second answer to the question `lib-dates.mjs` exists to answer once. The comment block above
  those lines says "no backticks in this comment", for the same reason.
- **`2026-09-09` appears in many other fixtures and most of them are not this residue.**
  `backup-restore.mjs`, `contacts-import.mjs`, `grade-detail.mjs`, `recorded-meeting-counts.mjs`,
  `totals-byte-identical.mjs` all hard-code September dates in *self-contained* fixtures that are
  restored or built and torn down inside their own section. Do not touch them. The residue this
  row is about is the **neighbour's** record at `classes-terms.mjs:705` (and the victim's three
  above it, which are deleted with the class). Moving the victim's dates is optional and only if
  the delete-confirm's meeting/non-meeting counts still hold — say so at the line either way.
- **The residue must still be in `doc.attendance` at § attendance's first `read()`, on every date
  driven, and a check must assert it** (Acceptance line 3). A comment claiming it is not the
  deliverable. The natural home is beside the `start.today.length === 0` precondition at
  `attendance.mjs:648-660` — assert the residue is present *and* not today, in the same breath.
- **Three harness runs are the minimum after the repair, and the Acceptance names five dates.**
  `--today=2026-09-17`, `2026-09-23`, `2026-09-24`, `2026-09-09`, and the real clock (today is
  2026-09-19 — inside the window, so the real-clock run is a fifth reproduction *and* a fifth
  proof). Budget ~4.5–5 min a run; run them in the foreground with a 600000 ms timeout each, or
  background with a log and read the log's own `EXIT=` line — `grep -c` on a green run exits 1.
- **`wo-sweep.mjs` counts `check()` calls against `tools/README.md`.** If you add a `check()`
  (line 3 wants one), the recorded count in `tools/README.md` moves with it or the sweep goes red
  on finished work. That is the one sweep line that fails on work being *done* rather than wrong.
- **`attendance.mjs:656` is now half true and the work order says to re-read it.** "If a run ever
  happens to fall on one of those dates" was written for the day-of collision; the week-long one
  reaches the residue without today being on it. Correct it or say at the line why it still holds.
- **Leave no scratch file under `tools/`**, and write the result file as your last act.

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

1. On the **pre-repair** tree, `node tools/verify-shell.mjs --today=2026-09-17` reproduces the failure: the WO-2.3 precondition red, and the section reporting checks lost. *(That is the reproduction this row has; use it before touching anything.)*
2. After the repair, `node tools/verify-shell.mjs` is green with `--today` on **2026-09-17, 2026-09-23, 2026-09-24 and 2026-09-09** — the first day of the range, the last, the edge, and the day-of window at `attendance.mjs:648` — and on the real clock the day of the sitting.
3. The residue survives: on every date driven, a record planted by an earlier section is still in `doc.attendance` when § attendance takes its first read, and `attendance.mjs:174`'s reason for keeping it is still true of the document. A check asserts it rather than a comment.
4. The WO-2.3 site still asserts an empty five-day range as its precondition, and a comment at the line says how the range can no longer hold the residue — derived, not widened, per the first trap.
5. Which of the three shapes was taken and why is written at the site that moved, and the comment at `attendance.mjs:656` is re-read and either still true or corrected.
6. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

