# WO-4.2 — Concern signals · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-4-signals.md`
**Report to** `.claude/dispatch/WO-4.2-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at **Opus** tier, on the work order's own merits — not a fallback,
so do not read the tier as a downgrade of anything. The deciding signal is that this screen
**refuses in presentation mode rather than redacting**, which is both a sensitive surface
(`ROUTING.md` § "Route to Claude", bullet 1) and the establishment of a convention every later
screen will cite; stacked on that are a design-system lift from a mockup and an edit to a shipped
shared stylesheet three live views already wear. The runner-up consideration set aside: the eight
remaining concern rules are, in isolation, specified arithmetic over WO-4.1's evaluator and would
route to Codex on their own — but they arrive welded to the surface work, the severity ruling and
the harness change, and the rubric routes the whole work order rather than its best-behaved half.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-4.2 — Concern signals

**Ship** 3 · **Status** 🤖 CLAIMED — 2026-08-20 · **Size** M · **Depends on** WO-4.1
**Closes roadmap** Phase 4 → "Concern signals."

**Deliverables** — each rule, each with its documented default, each editable:

| Rule | Default |
|---|---|
| Current weighted grade below | 65% |
| Fell N points across the last N assignments | 10 pts / 4 |
| N consecutive scores under N% | 3 / 60% |
| N missing assignments | 3 |
| Attendance below N% | 90% |
| N absences within the last N **meetings** | 4 / 20 |
| N consecutive absences | 3 |
| N tardies | 5 |
| N behavior log entries within N days | 2 / 30 |

Plus: the concern list UI, per class and across all classes, ordered by severity, each row tapping
through to the student.

- **Surface: a main-area view, and the fifth segment on the class switcher** — drawn in
  [`design/mockups/signals.html`](../../design/mockups/signals.html). It is a surface a teacher works
  down for ten minutes, not a task she dismisses, so it is a view by
  [`../gradebook-surfaces.md`](../gradebook-surfaces.md)'s test; and it is *about* a class without
  being *owned* by one, which is the kind WO-6.6 ruled belongs on the switcher rather than behind a
  panel button. It keeps its own **All classes** filter for the calendar's reason, and arriving from a
  class arrives filtered to it — a door recomputed on arrival, never a stored preference. The drawing
  also settles: concern and praise at `1fr 1fr` with **praise first** below 720px, the **delta** in
  the strong position on every row with the current grade nowhere on it, **one student one row** with
  the other fired rules as tags, and the **signal card as a modal** carrying each rule's sentence over
  the numbers it measured and its threshold named as the teacher's own.
- **Decided: severity means attendance first** *(the owner, 2026-08-20)*. A student who is not in
  the room is the more urgent problem than a student whose grade slipped — the second is often a
  symptom of the first, and it is the one a teacher cannot fix later. **The concern list bands:
  attendance rules ahead of everything else, and inside each band the biggest change leads.** That is
  a property of what the evaluator returns, not of this screen: an ordering this work order builds
  into the list is an ordering WO-6.4's glance panel and Phase 5's send flow both inherit.
  **Deliberately not settled** — where missing work, low scores and tardies sit relative to a grade
  fall. They keep the drawing's order (real deltas first, then counts) and may be re-cut here without
  re-opening the ruling.
- **Decided: the screen closes in presentation mode, it does not redact** *(the owner, 2026-08-20)*.
  Initials protect nobody in a room of thirty who know each other's initials, and this is the only
  surface in the app whose entire content is a ranked list of named students in trouble. It draws an
  `.empty-state` naming the header control that undoes it, so it reads as refused rather than broken.
  **This is the first screen in the app that refuses rather than hides**, and it is a departure from
  how the roster, the calendar and the student detail all behave — say so at the point of departure,
  per `CLAUDE.md` § Conventions.
- **Decided: five segments, wrapped** *(the owner, 2026-08-20)*. The switcher carries Signals as its
  fifth, and **`.screen-nav` in `src/assignments.css` § SHARED gains `flex-wrap: wrap`** so the
  strip becomes two rows at 390px instead of scrolling one silently — WO-6.6's trap, one segment
  further along. That edit is this work order's, not the drawing's, and it touches a shipped sheet
  three views already wear: check Assignments, Scores and Calendar at 390px in the same pass, and
  `verify-shell.mjs`'s existing strip measurement moves from `scrollWidth` to a row count.
- **Decided: the list re-sorts and filters by rule** *(the owner, 2026-08-20)*. A sort control whose
  **default is the ruled order** — attendance first, then the biggest change — with *the biggest
  change*, *lowest grade* and *most missing work* under it; plus a second toolbar strip of `.pill`
  chips filtering by which rule fired. Neither is written to a preference: both recompute on arrival,
  for `src/calendar-view.js`'s reason. What protects the phase's argument is which option the list
  **opens on**, not which options are absent.

**Acceptance**
- [ ] Every flag is reproducible by hand from the numbers it shows. Verify all nine.
- [ ] "Fell N points" measures the weighted grade before and after the window, not raw scores.
- [ ] Consecutive-absence counting skips dropped days and untaken days rather than breaking on them.
- [ ] A student with no graded work does not appear on the grade-below rule.
- [ ] Editing a threshold changes the list immediately.
- [ ] The behavior rule is inert until WO-4.4 exists, and says so rather than erroring.

**Traps** — "N consecutive absences" over a rotating schedule means consecutive *meetings of that
class*. Three absences across three weeks of a twice-weekly section is still three consecutive.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/signals.html`
  - `src/assignments.css`
  - `src/calendar-view.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also open these, and the reason each one is on the list:**

- `src/signals.js` — **WO-4.1's engine, and the thing you are extending rather than replacing.**
  Read the whole file, but three parts decide your shape:
  - `SIGNAL_SETTINGS` (line ~110) **already registers every threshold in your Deliverables table**,
    with the documented defaults, the aria text and the editor rows. You are not adding thresholds.
    Check this against the table before you write a key; if one genuinely is missing, say so in your
    report rather than inventing a second naming convention.
  - `RULES` (line ~381) currently holds **exactly two** rules — `gradeBelow` (concern) and
    `attendanceWindow` (praise) — as worked examples of the `{ id, direction, keys, measure, say }`
    shape. Of your nine, `grade-below` is one of those two, so **eight concern rules are yours to
    write**: `grade-fell`, `low-score-run`, `missing-count`, `attendance-below`,
    `absence-window`, `absence-run`, `tardy-count`, `behavior-window`. Match the existing two
    exactly — a rule is handed `ctx` and a student id, publishes the numbers it measured, and builds
    its own sentence from those published numbers and nothing else. That last part is a `CLAUDE.md`
    rule, not a style preference: it is what stops an explanation drifting from its arithmetic and
    what keeps accommodation data out of a sentence Phase 5 mails home.
  - `makeContext()` (line ~414) is the memoization contract, and its header states what is
    deliberately **not** memoized and why. Eight new rules is where that contract earns its keep;
    a rule that walks the ledger itself instead of asking `ctx` re-creates WO-2.13's defect.
- `src/signal-settings.js` — the threshold editor, including `resetThresholds()`, whose reset is a
  **delete** rather than a write. Acceptance line 5 ("editing a threshold changes the list
  immediately") is a wire between that editor and your new list; find the existing re-render path
  rather than adding a second one.
- `design/mockups/proposed-phase4.css` — **written to be lifted into `src/signals-view.css`
  almost as-is.** Re-deriving it is the specific mistake `CLAUDE.md` § "Reference implementation"
  names. Read `design/mockups/PROTOCOL.md` for what a mockup's "pending" section means before you
  decide what transfers.
- `plans/gradebook-surfaces.md` — the view-versus-task test the work order cites to justify this
  being a main-area view on the switcher rather than a panel. Read it so the placement argument is
  one you understand rather than one you copied.
- `src/calendar-view.js` — cited for **one specific thing**: the class filter is a *door
  recomputed on arrival*, never a stored preference. Your sort control and rule-filter chips inherit
  that, and neither may reach `localStorage`. The file's own header carries the reasoning.
- `src/screen-nav.js` and `src/assignments.css` § SHARED — the fifth segment lands here. The
  `.screen-nav` `flex-wrap: wrap` edit is **yours, not the drawing's**, and `src/assignments.css`
  is worn by Assignments, Scores, Calendar and Attendance. Check all of them at 390px in the same
  pass, per the work order's Decided line.
- `src/presentation.js` — the existing presentation-mode rule. Your screen is the **first in the
  app to refuse rather than hide**, which departs from how the roster, the calendar and the student
  detail behave. `CLAUDE.md` § Conventions requires a comment **at the point of departure** naming
  the local rule that beats the general one. Note also the pattern `src/calendar-view.js` follows —
  it contains no `presentationMode()` test at all, so the rule stays defined in one place. Decide
  deliberately whether your refusal is a second asker or the same single source, and say which in
  your report.

**Two things the harness needs from you, named precisely so they are not discovered late:**

1. `tools/verify-shell.mjs` line **~29753** asserts *"the **four**-segment switcher FITS its own
   strip at 390px rather than scrolling inside it"* — hardcoded `segs.length === 4` and a
   `scrollWidth <= clientWidth` test. Its 834px sibling follows at ~29790. The work order rules that
   **this measurement moves from `scrollWidth` to a row count**, because a wrapped strip is
   *supposed* to be two rows at 390px. Updating it is in scope; deleting it is not, and neither is
   loosening it into something that cannot fail.
2. `wo-sweep.mjs` counts askers and call sites. If you add a file, a rule, or a `presentationMode()`
   call, expect a count in `tools/README.md` to go stale and turn the sweep red — that is the one
   sweep line that goes red on work being *done*. Update the count in the same pass.

**Scope discipline.** Praise rules are WO-4.3 and the behavior log is WO-4.4. Your Acceptance line 6
requires the behavior rule to be **inert and to say so** rather than error — that is the whole of
your relationship to WO-4.4. Do not build the log.

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

1. Every flag is reproducible by hand from the numbers it shows. Verify all nine.
2. "Fell N points" measures the weighted grade before and after the window, not raw scores.
3. Consecutive-absence counting skips dropped days and untaken days rather than breaking on them.
4. A student with no graded work does not appear on the grade-below rule.
5. Editing a threshold changes the list immediately.
6. The behavior rule is inert until WO-4.4 exists, and says so rather than erroring.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

