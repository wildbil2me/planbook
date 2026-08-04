# Phase 3 work orders — Gradebook

**Phase goal:** grades entered once or twice a week, in minutes, for five classes.

Branch: `phase/3-gradebook`. Ship 2, target ~2026-09-15.

Grade math lives in [`../../docs/data-model.md`](../../docs/data-model.md) § Grade math. Two rules
govern this whole phase, and both are about the teacher never being surprised:

- **`late` and `missing` are marked, never inferred.** The grade must not change because a date
  rolled over.
- **Empty categories redistribute their weight.** Otherwise every grade is wrong until each
  category has an assignment.

---

## WO-3.1 — Categories & weights

**Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-1.6
**Closes roadmap** Phase 3 → "Weighted categories per class, editable, with a visible warning when
weights ≠ 100%."

**Why it exists.** Grading is weighted categories, configurable per class, because the owner's five
classes differ. This is the first thing to set up in a new class and the thing most likely to be
wrong at the start of a term.

**Deliverables**
- Per-class categories: name, weight. Add, rename, reweight, reorder, remove.
- A **visible, persistent** warning when weights don't total 100% — showing the actual total, not
  just "invalid". The teacher is mid-setup; don't block them, tell them.
- Removing a category warns about the assignments it takes with it.
- Sensible starter categories on class creation, trivially editable.

**Acceptance**
- [ ] Weights of 40/35/25 produce no warning; 40/35/20 warns and shows "95%".
- [ ] The app still computes a grade while weights are wrong, and says the grade is provisional.
- [ ] Two classes carry different category sets without interference.
- [ ] Reweighting recomputes every displayed grade in that class immediately.

---

## WO-3.2 — Letter-scale editor

**Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-1.4
**Closes roadmap** Phase 3 → "Letter-scale editor."

**Why it exists.** The teacher defines the bands; the app never hardcodes 90/80/70. **This subsumes
rounding** — if 89.5 should be an A, the boundary is 89.5, and there is no separate rounding rule
to disagree with the SIS about.

**Deliverables**
- Document-wide `letterScale` as an ordered list of `{ letter, min }`, editable in Settings.
- Optional per-class override; `null` means use the document default.
- A percentage maps to the first band whose `min` it meets.
- The editor shows the resulting bands as ranges so a gap or overlap is visible on sight.

**Acceptance**
- [ ] Setting an A boundary of 89.5 makes 89.5 an A and 89.49 an A−.
- [ ] A per-class override applies to that class only.
- [ ] A scale with a gap or an out-of-order band is caught in the editor, not at render.
- [ ] There is no rounding code anywhere. Grep for it and confirm.

**Traps** — Do not add a "round to nearest whole percent" option. That is exactly the second
disagreeing rule this design removes.

---

## WO-3.3 — Assignments

**Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-3.1
**Closes roadmap** Phase 3 → "Assignments: name, points, category, assigned date, due date."

**Why it exists.** The assignment list is the spine of the gradebook and of Phase 6's calendar,
which reads due dates rather than storing copies of them.

**Deliverables**
- Create, edit, duplicate, reorder, and delete assignments per the data model:
  `id, classId, termId, categoryId, name, points, assigned, due`.
- **Due date is a plain date.** There is no "next meeting" to default to, and inventing one would
  require the schedule model [`../rotating-schedule.md`](../rotating-schedule.md) rejects.
- Duplicate-to-another-class, because the owner teaches the same content to more than one section.
- Deleting an assignment warns about the scores it takes with it.

**Acceptance**
- [ ] A zero-point assignment can be created and does not break any grade calculation.
- [ ] An assignment can be moved between categories and the grade updates.
- [ ] Duplicating into another class produces a new assignment with no scores attached.
- [ ] No date field auto-populates from anything schedule-shaped.

---

## WO-3.4 — Grade engine

**Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-3.1, WO-3.2
**Closes roadmap** Phase 3 → "Weighted grade with empty categories redistributing their weight."

**Why it exists.** This is the arithmetic the whole product's credibility rests on, and the 1.0
criteria demand it be "verified against hand-computed cases." Build it as pure functions over the
document, separate from any rendering, so it can be verified by hand and reused by Phase 4's
signals and Phase 5's merge fields.

**Deliverables**
- Pure functions: category percentage, weighted class grade, letter from percentage.
- Cell semantics exactly as the data model's table specifies:

  | Cell | Earned | Possible |
  |---|---|---|
  | `{ v: 87 }` | 87 | full points |
  | `{ v: 78, flag: "late" }` | 78 | full points — **`late` is a record, not a penalty** |
  | `{ v: null, flag: "missing" }` | 0 | full points |
  | `{ v: null, flag: "excused" }` | — | — (drops out entirely) |
  | no key | — | — (ungraded; invisible to the math) |

- **Empty-category redistribution**: a category with no graded work drops out and its weight is
  redistributed proportionally across the categories that have work.
- A worked-examples document (`docs/grade-math-cases.md`) with hand-computed expected values for
  every case in the acceptance list. This *is* the test suite — there is no framework, by decision.

**Out of scope** — any UI. WO-3.5 renders what this computes.

**Acceptance** — each verified against a hand computation, recorded in `docs/grade-math-cases.md`:
- [ ] Straightforward weighted case across three categories.
- [ ] A term with exactly one assignment.
- [ ] A category with no assignments at all — weight redistributed, grade correct.
- [ ] A category whose every score is `excused` — behaves as empty, weight redistributed.
- [ ] A zero-point assignment — no division by zero, no effect on the percentage.
- [ ] A `missing` flag scores zero; the same cell set to `excused` raises the grade.
- [ ] A `late` flag changes nothing versus the same score unflagged.
- [ ] A blank cell changes nothing versus no cell at all.
- [ ] Every category empty — an honest "no grade yet", not `0%` and not `NaN`.

**Traps** — A score cell is **always an object**, never a bare number. Polymorphic cells are where
grade bugs live. If you find yourself writing `typeof cell === 'number'`, something upstream is
wrong.

---

## WO-3.5 — Score entry grid

**Status** ⬜ NOT STARTED · **Size** L · **Depends on** WO-3.3, WO-3.4
**Closes roadmap** Phase 3 → "Score entry grid" and "`late` and `missing` are marked, never
inferred."

**Why it exists.** The second-most-frequent action in the app, and it gets the same care as marking
attendance. Grades go in once or twice a week for five classes; if this is slow, the app is not used.

**Deliverables**
- Grid: students down, assignments across, one column per assignment.
- `Enter` moves down the column — that is the entry pattern, one assignment at a time.
- Flags reachable without leaving the keyboard: `late`, `missing`, `excused`, and clear-to-blank.
- Flags are **visible in the cell**. A score that silently isn't what you typed is the worst thing
  a gradebook can do.
- Live class grade and per-student grade updating as you type.
- Paste a column of scores from a clipboard, with a preview.
- Touch path: the grid is usable on an iPad, and every control is in the coarse-pointer block.

**Acceptance**
- [ ] Entering 25 scores down a column takes 25 keystroke-groups and no mouse.
- [ ] `Enter` at the bottom of a column does something sensible and predictable.
- [ ] A cell flagged `missing` is visually distinct from `excused` and from blank.
- [ ] Clearing a cell removes the key entirely rather than storing `{ v: null }` with no flag.
- [ ] Grades recompute live and match WO-3.4's hand-computed values.
- [ ] The grid is usable on an iPad in landscape.

**Traps** — Do not infer anything from the due date here. That's WO-3.6, and it is a prompt, not
arithmetic.

---

## WO-3.6 — Past-due prompt

**Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-3.5
**Closes roadmap** Phase 3 → "Past-due blanks generate a prompt."

**Why it exists.** An earlier draft computed missing from the due date — blank plus past-due equalled
zero. Explicit marking is better and it's what the owner asked for: the grade never changes because
a date rolled over, and a teacher who hasn't finished grading isn't accidentally failing half the
class. The due date is still useful, but **only as a prompt**.

**Deliverables**
- On opening an assignment or a class gradebook: "6 blanks are past due — mark them missing?"
- Accept marks them all `missing`; dismiss does nothing and stays dismissed for that assignment.
- A way to review which blanks it means before accepting.

**Acceptance**
- [ ] Dismissing the prompt changes no score and no grade.
- [ ] The grade before accepting is identical to the grade with the prompt never shown.
- [ ] Accepting writes `{ v: null, flag: "missing" }` to exactly the previewed cells.
- [ ] A dismissed prompt does not reappear on every render.

---

## WO-3.7 — Per-student grade detail

**Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-3.4
**Closes roadmap** Phase 3 → "Per-student detail: category breakdown, what's missing, what it would
take to move."

**Why it exists.** This is the screen open during a guardian conference, and the source of the
numbers Phase 5's merge fields put in an email. "What would it take to move" is the difference
between a report and a conversation.

**Deliverables**
- Category breakdown with each category's percentage, weight, and contribution.
- The list of missing work, with points at stake.
- "What it would take to move" — the score needed on remaining work to reach the next letter band.
- Attendance summary for the same student, from WO-2.4.
- Presentation-mode safe.

**Acceptance**
- [ ] The breakdown's contributions sum to the displayed overall grade.
- [ ] With a category empty, the breakdown shows the redistribution rather than hiding it.
- [ ] The "to move" figure is reproducible by hand.
- [ ] No `supports` data appears on this screen in presentation mode.

---

## WO-3.8 — Accommodation prompts at point of use

**Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-1.8, WO-3.3
**Closes roadmap** Phase 3 → "Accommodation prompts at point of use."

**Why it exists.** "A list nobody opens protects nobody." A teacher is legally obligated to
implement accommodations; surfacing them at the moment of use is what turns stored data into
compliance.

**Deliverables**
- Creating an assignment in a category matching an accommodation's `appliesTo` surfaces a summary:
  *"3 students have extended time, 2 need a separate setting."*
- Aggregate counts by default; names on deliberate tap.
- The prompt respects `appliesTo` — an accommodation scoped to `tests` doesn't fire on homework. An
  empty `appliesTo` means everything.
- **Suppressed entirely in presentation mode.**

**Acceptance**
- [ ] Creating a test surfaces the counts; creating a homework assignment scoped elsewhere doesn't.
- [ ] The default view is counts, not names.
- [ ] In presentation mode nothing appears at all — not even the count.
- [ ] Marking a student absent for the Nth time surfaces an attendance-related plan clause if one
      exists. *(Deferred to Phase 4 if the behavior log isn't ready; note it if so.)*

---

## WO-3.9 — Grades print & CSV

**Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-3.4
**Closes roadmap** Phase 3 → "Print/CSV for grades."

**Why it exists.** The SIS has no import, so re-keying is manual and the printout is what the owner
types from. **Order it to match the SIS entry screen** — that single decision is most of this work
order's value.

**Deliverables**
- Print view of a class's grades for a term, ordered to match the SIS entry screen. Ask the owner
  what that order is; do not guess.
- CSV export of the same.
- Both carry class, term, date, and the letter scale in use.
- Presentation-mode safe; no `supports` data on either.

**Acceptance**
- [ ] The print order matches the SIS entry screen, confirmed by the owner against a real re-key.
- [ ] Percentages and letters on the printout match the app exactly.
- [ ] The CSV opens cleanly in a spreadsheet.
- [ ] Neither surface emits accommodation, medical, or plan data.

---

## WO-3.10 — OAuth verification paperwork 🔒

**Status** ⬜ NOT STARTED · **Size** M · **Depends on** nothing technical
**Closes roadmap** Phase 3 → "Parallel, non-code: start OAuth verification paperwork now."

**Why it exists.** Phase 7 is gated on Google OAuth verification, which is **calendar-bound rather
than work-bound**. Starting it during Phase 3 is the difference between sync landing in November and
sync landing whenever the paperwork happens to clear. This is not an engineering task and it does
not resolve itself. *(Roll Call! sat at 0.9.0-beta with every engineering blocker closed, held up by
exactly this class of non-engineering task.)*

**Deliverables**
- A Google Cloud project and one OAuth client, owned by us. Teachers deploy nothing.
- Consent screen configured requesting **`drive.file` and nothing else**.
- A verified domain, which requires the hosting decision to be made — overlaps WO-8.6.
- A published privacy policy at that domain, stating plainly: no vendor server ever receives student
  data, no account is required, and Drive holds only files this app created.
- A demo video showing the scope in use.
- Verification submitted, with the submission date and reference recorded here.

**Acceptance**
- [ ] The consent screen shows exactly one scope and no "Google hasn't verified this app" warning.
- [ ] The privacy policy is live at the verified domain.
- [ ] The submission date is written into this work order. *(Fill in when submitted, so the wait is
      measurable rather than remembered.)*

**Traps** — Adding `spreadsheets` or a mail scope re-opens verification and puts the warning back in
front of a teacher. `drive.file` is a sensitive scope, not a restricted one, so there is no CASA
security assessment — days, not months, if nothing is added later.
