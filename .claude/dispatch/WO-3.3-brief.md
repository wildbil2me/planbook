# WO-3.3 — Assignments · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.3-result.md` — as your last act, and return it in-band too.

**Routing decision.** WO-3.3 routed to **Claude, at Opus, on its own merits** — not a Codex fallback.
The deciding signal is `ROUTING.md` § "Route to Claude … It establishes a convention": this work order
builds the control that switches between an open class's screens, which WO-3.5 and WO-3.7 will both
copy, plus the first gradebook main-area view — whatever it decides, everything after it inherits.
The runner-up set aside was the genuine Codex shape inside it: assignment CRUD against a settled
schema, mechanically checkable, the same shape as WO-1.6/WO-1.7. It loses to the Traps section, which
is a judgment trap by construction — *every* class-scoped editor before this one is a modal, so an
implementer matching the established precedent builds exactly the wrong thing.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.3 — Assignments

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-09 · **Size** M · **Depends on** WO-3.1
**Closes roadmap** Phase 3 → "Assignments: name, points, category, assigned date, due date."

**Why it exists.** The assignment list is the spine of the gradebook and of Phase 6's calendar,
which reads due dates rather than storing copies of them.

**Deliverables**
- **Surface: a main-area view**, a sibling of `#homeView` and `#classView` in `<main>`, toggled by
  `.hidden` — **with modal editors** for creating and editing a single assignment. The list is a
  surface a teacher scans and works down; editing one assignment is a task she finishes and
  dismisses. Same shape as the roster. See [`../gradebook-surfaces.md`](../gradebook-surfaces.md).
- **This work order builds the control that switches between the open class's screens**, because it
  is the first one that needs it — attendance and assignments cannot both be "the class view".
  **Decided by the owner 2026-08-09**, so this is no longer yours to design: a segmented control
  under the panel title carrying **three** tabs — Attendance · Assignments · Scores — and **a class
  always opens on Attendance**, never on the screen it was left on. Per-student detail is **not** a
  fourth tab: it is reached by tapping a student, and the strip shows that student's name as a
  breadcrumb segment only while you are in it. The reasoning, including why the header strip cannot
  hold it, is [`../gradebook-surfaces.md`](../gradebook-surfaces.md) § "How the class view navigates
  between its screens". `design/mockups/proposed.css` § SHARED has the drawn styles; lift them.
- Create, edit, duplicate, reorder, and delete assignments per the data model:
  `id, classId, termId, categoryId, name, points, assigned, due`.
- **Due date is a plain date.** There is no "next meeting" to default to, and inventing one would
  require the schedule model [`../rotating-schedule.md`](../rotating-schedule.md) rejects.
- Duplicate-to-another-class, because the owner teaches the same content to more than one section.
- Deleting an assignment warns about the scores it takes with it.

**Acceptance**
- [ ] A zero-point assignment can be created and does not break any grade calculation. **This line
      is the extra-credit feature, not a robustness check** *(owner, 2026-08-09)*: a 0-point
      assignment scored `5` is +5 earned points in its category. The editor must let `0` be typed in
      the points field and must not "helpfully" reject or default it.
- [ ] An assignment can be moved between categories and the grade updates.
- [ ] Duplicating into another class produces a new assignment with no scores attached.
- [ ] No date field auto-populates from anything schedule-shaped.
- [ ] The list is a view in `<main>`, not a dialog, and the class's screens are switchable without
      passing through the class manager.
- [ ] **Opening a class lands on Attendance every time** — including a class whose assignment list
      was the screen open when it was last left, and including after a reload. Prove it by leaving
      one class on Assignments, opening a second class and coming back, not by reading the code:
      the failure mode is a per-class memory nobody asked for, and it is invisible until the second
      class.
- [ ] The switcher carries three tabs and no student tab. A student's name appears in the strip only
      while that student's detail is open, and switching away from it takes the name with it.

**Traps** — **Do not build the list inside the modal system.** Every class-scoped editor before this
one is a modal and the precedent is misleading; the rule is in `../gradebook-surfaces.md`. **And
carry a `classId` guard into every assignment query you write**: WO-3.1's `removalCounts()` and
`applyRemoval()` filter by `categoryId` alone, which is safe only while ids are opaque and stops
being safe the moment duplicate-to-another-class exists — a naive duplicate carrying the source's
`categoryId` would let a category removal in one class delete work in another, counted under a
dialog naming the first.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/proposed.css`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Open these too. Every one of them is load-bearing on a decision this work order is not allowed to
re-take.**

*The decisions already made for you:*
- `plans/gradebook-surfaces.md` — **the whole file**, and especially § "How the class view navigates
  between its screens". This is a settled decision record dated 2026-08-09, taken by the owner
  against a drawn candidate. Three tabs, the breadcrumb that is not a tab, and always-opens-on-
  Attendance are all decided there. You are implementing it, not evaluating it.
- `design/mockups/proposed.css` § SHARED — `.screen-nav`, `.screen-nav-btn`, `.screen-nav-btn.active`
  and the `.detail` breadcrumb variant, with the reasoning in the comment above them. **Lift these
  values; do not re-derive them.** Its header states the rules it follows so that "lift" means lift.
  The § for the assignment list is in the same file.
- `design/mockups/assignments.html` and `design/mockups/README.md` — the drawing of this screen. The
  README says plainly that these are drawings and not code; take the structure and measurements, not
  the file.
- `plans/rotating-schedule.md` — why there is no "next meeting" to default a due date to. Deliverable
  4 and Acceptance line 4 are both this decision.

*The conventions you must match rather than choose:*
- `src/views.js` — read its header in full before adding a view. A new view is one line in `VIEWS`
  and one `<div>` in `index.html`; there is no router, no history stack, no hash, and this work order
  does not add one. **Note the collision you have to resolve:** `views.js` persists
  `planbook_openView`, and Acceptance line 6 says a class always opens on Attendance *including after
  a reload*. Those two facts meet in your code and the meeting is yours to get right — a restored
  `openView` is the "per-class memory nobody asked for" the line was written to catch, in its
  cross-reload form.
- `src/roster.js` — the shape the Surface deliverable names: a list surface with modal editors. Match
  it. `src/modal.js` is the right tool for the *editor*, and the wrong one for the list.
- `src/attendance.js` and `src/attendance.css` — the panel the switcher sits under, and the recorded
  correction that a panel narrower than its main area "reads as a window that never closed".
- `src/shell.js` — where the order of operations lives, and its header on the four refused import
  loops. `src/README.md` for the module map.
- `src/classes.js` `classRow()` — the 390px horizontal-overflow record that is why the switcher is on
  the white panel and not in the header strip.
- `src/categories.js` — `removalCounts()` and `applyRemoval()` are the exact functions named in the
  Traps section, plus `isProvisional(cls)` / `weightTotal(cls)`, which WO-3.1 exported for later
  consumers.
- `docs/data-model.md` — the assignment schema, verbatim, and § Grade math for what a score cell is.
- `plans/work-orders/README.md` § "A re-homed Acceptance line stays `- [ ]`" — read this before you
  tick anything, for the reason directly below.

**One judgment call, flagged so you do not resolve it by widening the work order.** Acceptance lines 1
and 2 each name a grade — *"does not break any grade calculation"*, *"and the grade updates"*. **There
is no grade in this app yet.** WO-3.4 (grade engine) and WO-3.5 (score entry grid) are both
`⬜ NOT STARTED`, and WO-3.4 exists specifically so that the arithmetic lands together with
`docs/grade-math-cases.md`, which is deliberately its only test suite. **Do not build a grade engine,
a score cell, or a percentage to satisfy these two lines** — that is WO-3.4's Out of scope line
pointed back at you, and it would land the arithmetic without the document that checks it.

Build the halves that are yours: `0` must be typeable and survive in the points field without being
rejected or defaulted, and an assignment must be movable between categories. For the grade halves,
use the project's own convention — leave the box `- [ ]`, end the line with a bare `→ WO-x.y` and a
quotation of the box that carries it now, and add `**Owes**` to this work order's header beside
**Depends on**. WO-3.1 lines 2 and 4 are the worked example, three sections above yours in the same
file. The likely targets, which you should confirm by reading rather than trusting from here, are
WO-3.4's rewritten zero-point line and WO-3.5's inherited reweighting line. Run
`node tools/wo-gate.mjs --audit` after: it resolves every `**Owes**` pointer and will tell you if you
quoted a box wrong. If you conclude a line *can* be closed here on real evidence, close it and say
what the evidence was — but say which of the two paths you took for each line, in your report.

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

1. A zero-point assignment can be created and does not break any grade calculation. **This line is the extra-credit feature, not a robustness check** *(owner, 2026-08-09)*: a 0-point assignment scored `5` is +5 earned points in its category. The editor must let `0` be typed in the points field and must not "helpfully" reject or default it.
2. An assignment can be moved between categories and the grade updates.
3. Duplicating into another class produces a new assignment with no scores attached.
4. No date field auto-populates from anything schedule-shaped.
5. The list is a view in `<main>`, not a dialog, and the class's screens are switchable without passing through the class manager.
6. **Opening a class lands on Attendance every time** — including a class whose assignment list was the screen open when it was last left, and including after a reload. Prove it by leaving one class on Assignments, opening a second class and coming back, not by reading the code: the failure mode is a per-class memory nobody asked for, and it is invisible until the second class.
7. The switcher carries three tabs and no student tab. A student's name appears in the strip only while that student's detail is open, and switching away from it takes the name with it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

