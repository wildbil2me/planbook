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

**Ship** 2 · **Status** ✅ DONE — 2026-08-09 · **Size** S · **Depends on** WO-1.6 · **Owes** WO-3.5
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
- [x] Weights of 40/35/25 produce no warning; 40/35/20 warns and shows "95%".
- [ ] ~~The app still computes a grade while weights are wrong, and says the grade is provisional.~~
      **Superseded 2026-08-09 by the owner:** *there is no grade at all until the weights total 100.*
      The replacement line is the first inherited box on **WO-3.5**, the first screen with somewhere
      to not-show a grade. This line's own claim no longer exists and its replacement is gated by a
      box elsewhere, so it stays open here and points there:
      → WO-3.5 "No grade is shown while the weights are wrong, and the screen says why"
- [x] Two classes carry different category sets without interference.
- [ ] Reweighting recomputes every displayed grade in that class immediately — **including the
      crossing in both directions:** grades appear when the weights reach 100 and disappear when
      they leave it. Nothing in the app displayed a grade while WO-3.1 was open, so there was never
      a build this could be run against. The half that had a consumer — the total and the verdict
      recomputing as a weight is typed, on the banner and the class-manager row — is driven and
      measured in `tools/verify-shell.mjs`; the displayed-grade half is owed by
      → WO-3.5 "Reweighting recomputes every displayed grade in that class immediately"

**Two lines are owed, and they are boxes on WO-3.5 rather than prose here.** *(Left open 2026-08-09 at
the end of WO-3.1's build; re-homed and this work order ticked the same day, once it was clear the debt
was recorded only in the work order nobody re-reads after it goes ✅ — and that it was holding WO-3.3
on a dependency that could not resolve until WO-3.5.)* Lines 2 and 4 both name **a
displayed grade**, and
there is no grade anywhere in this app yet: WO-3.4 owns the arithmetic — category percentage,
weighted class grade, letter from percentage — together with the hand-computed
`docs/grade-math-cases.md` that is deliberately its only test suite, and WO-3.5 owns the grid that
renders it. Building either here would have landed that arithmetic without the document that checks
it, which is the one thing WO-3.4 exists to prevent.

What WO-3.1 built instead is the seam those two lines close through, and it is done rather than
sketched: `isProvisional(cls)` and `weightTotal(cls)` in `src/categories.js` are pure functions over
a class, exported for exactly those consumers, and the editor already says in words that a grade
computed from weights that do not add up is provisional. The half of line 4 that has a consumer
today — the total and the provisional verdict recomputing as a weight is typed, on the banner and on
the class-manager row behind it — is driven and measured in `tools/verify-shell.mjs`.

**The follow-up:** when WO-3.5 renders a grade, it reads `isProvisional()` for the class and decides
whether there is a grade to draw at all; ticking lines 2 and 4 belongs to that work order's own pass.

**How those two lines are written, and why they are not ☑** *(2026-08-09, WO-3.11)* — they were `- [x]`
for a day, each with a paragraph under it explaining that ☑ meant *resolved on this work order, not
verified*. A mark that needs a paragraph to stop it meaning "verified" is the wrong mark, and the
paragraph was not in the file `--audit` reads. They are `- [ ]` now, each ending in a bare
→ WO-3.5 and a quotation of the box that carries it, and this work order's header carries **Owes**
WO-3.5 to say so where a reader looks first. `node tools/wo-gate.mjs --audit` resolves both pointers
every run and fails if either box is reworded, deleted, or ticked. **When WO-3.5 ticks them, --audit
will fail on this work order** — a pointer into a box that is already `[x]` is the signal that the debt
was paid: tick lines 2 and 4 here on WO-3.5's evidence, and take the **Owes** field off. That is the
one hand edit this design asks for, and it is asked at the moment there is finally something to verify.

**A correction is owed to this work order's own copy, and it is not cosmetic.** *(2026-08-09, after
the owner's call above.)* Three sentences are now false, because there is no grade to be provisional
about — and they are in **two** files, which is one more than the first pass of this note claimed:

| Where | What it says now |
|---|---|
| `src/categories.js` `renderTotal()` | *"…Any grade in this class is provisional until they add up."* |
| `src/categories.js` `announce()` | *"Weights total 95 percent, not 100. Grades are provisional."* |
| `src/classes.js` `classRow()` | the `weights 95%` badge's `title`: *"…so any grade in it is provisional. Open Categories to set them."* |

`isProvisional(cls)` keeps its signature and its truth value — weights ≠ 100 — but its **name and
every sentence built on it now mean "this class has no grade".**

This is a code change, not a documentation one, and it is **coupled to the harness**: at least one
check in `tools/verify-shell.mjs` asserts the banner text carries both `95%` and the word
*provisional*, and it goes red the moment the copy changes. So it is a small work order rather than a
drive-by edit — the copy in both files, the announcement, the badge tooltip, the rename if one is
wanted, and the checks that hold them. **Fold it into WO-3.5's brief** unless it is wanted sooner;
nothing displays a grade before then, so nothing is currently lying to a teacher about a number she
can see.

---

## WO-3.2 — Letter-scale editor

**Ship** 2 · **Status** ✅ DONE — 2026-08-09 · **Size** S · **Depends on** WO-1.4
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
- [x] Setting an A boundary of 89.5 makes 89.5 an A and 89.49 an A−.
- [x] A per-class override applies to that class only.
- [x] A scale with a gap or an out-of-order band is caught in the editor, not at render.
- [x] There is no rounding code anywhere. Grep for it and confirm.

**Traps** — Do not add a "round to nearest whole percent" option. That is exactly the second
disagreeing rule this design removes.

**What "a gap" turned out to mean, decided at build time and written down because the next reader
will look for the other kind.** *(2026-08-09.)* A band's upper bound is **derived** — it runs up to
the lowest `min` above it — so bands are contiguous by construction and **an interior gap is not
expressible**. The editor checks the two failures that are: a band nothing can reach (equal or
ascending boundaries, which is the same defect the deliverable calls an *overlap*) and a gap at the
bottom (the lowest band above 0, leaving percentages with no letter). Both are named in the standing
note and flagged on the row itself, and the derived range printed beside every band is what makes the
invariant legible without a validator — deliverable 4 doing the validator's job. Full reasoning in
`src/letter-scale.js`'s header and now in `docs/data-model.md` § Letter grades.

**On line 4, and it is not "no `Math.round` in the repository".** The grep finds four `Math.round`
calls and four `Math.floor`s, every one of them display formatting or layout arithmetic over a number
that is not a grade: an attendance percentage (`src/attendance.js:1196`), a weight total
(`src/categories.js:181`), a file size, pass minutes, a timezone offset, a column count, a day count.
**No rounding exists between a percentage and a letter**: `letterFor()` compares the number it is
given against `min` unmodified, `src/letter-scale.js` contains no rounding at all — not even for
display, where a boundary is printed with `String()` — and there is no option, preference or default
anywhere that rounds a percentage before it is banded. No `toFixed` in the repository.

**Owed to WO-3.4, in one line: it must import `letterFor()` rather than write a second one.** Two
percentage-to-letter rules is the disagreement this design deletes. `letterScaleOf()`,
`scaleForClass()`, `hasOwnScale()`, `letterFor()`, `bandRanges()` and `scaleFaults()` are pure
functions over a document, a class and a scale, exported for exactly that consumer.

---

## WO-3.3 — Assignments

**Ship** 2 · **Status** ✅ DONE — 2026-08-09 · **Size** M · **Depends on** WO-3.1 · **Owes** WO-3.5, WO-3.7
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
- [x] A zero-point assignment can be created and does not break any grade calculation. **This line
      is the extra-credit feature, not a robustness check** *(owner, 2026-08-09)*: a 0-point
      assignment scored `5` is +5 earned points in its category. The editor must let `0` be typed in
      the points field and must not "helpfully" reject or default it. **The editor half is built and
      verified** — `0` is typed into the real field, kept as `0` through a re-render and a reload,
      and labelled *Extra credit* on the row so a lone zero cannot read as a slip. **The arithmetic
      half was owed by WO-3.4 and was discharged there on 2026-08-10** — worked case 5 in
      `docs/grade-math-cases.md`, driven by the harness through `window.planbook.gradeEngine`:
      13 + 5 earned over 20 + 0 possible is 90%, and the category is not divided per assignment, so
      there is no division by zero either way.
- [ ] An assignment can be moved between categories and the grade updates. **The move is built and
      verified** — one `<select>` in the editor, the row redraws under its new group head, and the
      score column follows byte for byte because `scores` is keyed by assignment. The displayed
      grade does not exist until the grid draws one, so that half is owed by
      → WO-3.5 "Moving an assignment to another category updates every displayed grade in that class"
- [x] Duplicating into another class produces a new assignment with no scores attached.
- [x] No date field auto-populates from anything schedule-shaped.
- [x] The list is a view in `<main>`, not a dialog, and the class's screens are switchable without
      passing through the class manager.
- [x] **Opening a class lands on Attendance every time** — including a class whose assignment list
      was the screen open when it was last left, and including after a reload. Prove it by leaving
      one class on Assignments, opening a second class and coming back, not by reading the code:
      the failure mode is a per-class memory nobody asked for, and it is invisible until the second
      class.
- [ ] The switcher carries three tabs and no student tab. A student's name appears in the strip only
      while that student's detail is open, and switching away from it takes the name with it. **The
      first sentence is built and verified**, on both strips: three segments, no fourth, no student
      among them. The second cannot be demonstrated in this build — there is no per-student detail
      to enter or leave — so what is verified instead is the rule that makes it true, that a name set
      with no detail screen open is drawn nowhere. Owed by
      → WO-3.7 "The strip shows the open student's name as a breadcrumb segment while this screen is up"

**Traps** — **Do not build the list inside the modal system.** Every class-scoped editor before this
one is a modal and the precedent is misleading; the rule is in `../gradebook-surfaces.md`. **And
carry a `classId` guard into every assignment query you write**: WO-3.1's `removalCounts()` and
`applyRemoval()` filter by `categoryId` alone, which is safe only while ids are opaque and stops
being safe the moment duplicate-to-another-class exists — a naive duplicate carrying the source's
`categoryId` would let a category removal in one class delete work in another, counted under a
dialog naming the first.

**Three lines are owed, and they are boxes on other work orders rather than prose here.** *(Left open
2026-08-09 at the end of this build, in the shape WO-3.1's two took three sections above.)* Lines 1
and 2 each name **a grade**, and there is still none in this app: WO-3.4 owns the arithmetic together
with the hand-computed `docs/grade-math-cases.md` that is deliberately its only test suite, and WO-3.5
owns the grid that renders it. **Line 2 was re-pointed at correction round 1** *(2026-08-09)*: it hung
on WO-3.5's reweighting box, which is about weights crossing 100 and already carries WO-3.1's line 4 —
so WO-3.5's verifier could have ticked it by walking weights across 100, discharging this line with
nobody having moved an assignment between categories at all. WO-3.5 gained a box that only the claim
can tick, the same move line 7 made on WO-3.7 one line below. The halves that could be built here were, and are measured in
`tools/verify-shell.mjs`: a typed `0` survives typing, a re-render and a reload as `0`, and an
assignment moves between categories with its score column following byte for byte. Line 7's second
sentence is a different kind of debt — not arithmetic, but a screen. **The breadcrumb rule is built
and cannot be exercised**: `src/screen-nav.js` draws an open student's name only while the detail view
is the one on the glass, and WO-3.7 owns that view, so today the name is drawable nowhere. What is
verified here is the rule's safe direction — a name set with no detail open appears on neither strip —
and WO-3.7 gained an Acceptance box for the half that needs its screen.

**The `classId` guard went in on both sides of the promise.** Every query in `src/assignments.js`
filters by class, the duplicate matches the target's category **by name** and never carries an id
across, and `src/categories.js`'s `assignmentsIn()`, `removalCounts()` and `applyRemoval()` — the two
functions the Traps line names, plus the row's own count — now take a `classId` as well. The second
half is what covers a document that arrives from a restore or a hand edit rather than from this
build's own duplicate button, and `verify-shell.mjs` plants exactly that document: an assignment in
class B wearing class A's `categoryId`, which must be absent from A's list **and** absent from the
count in A's category-removal confirm.

---

## WO-3.4 — Grade engine

**Ship** 2 · **Status** ✅ DONE — 2026-08-10 · **Size** M · **Depends on** WO-3.1, WO-3.2
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
- **No grade at all until the weights total 100.** *(Owner, 2026-08-09.)* Not a provisional figure
  and not a best guess — the function returns "no grade", and the reason, and the screens say so.
  This deletes the question of what to divide by rather than answering it: a weighted average over
  weights that do not add up is arithmetic nobody asked for. A class with no categories is the same
  case. See `docs/data-model.md` § Grade math, which records what this replaced and why.
- **Extra credit is a zero-point assignment, and needs no code of its own.** *(Owner, 2026-08-09.)*
  It falls out of `earned / possible` being **summed over the category** rather than averaged across
  assignments: an assignment worth 0 scored `5` adds 5 to `earned` and 0 to `possible`, so 13/20 in
  Quizzes becomes 18/20. **A category may exceed 100% and so may the overall grade; nothing caps
  either** — a cap silently discards points the teacher chose to award. There is no extra-credit
  flag, field or category type, and none should be added.
- A worked-examples document (`docs/grade-math-cases.md`) with hand-computed expected values for
  every case in the acceptance list. This *is* the test suite — there is no framework, by decision.

**Out of scope** — any UI. WO-3.5 renders what this computes.

**Acceptance** — each verified against a hand computation, recorded in `docs/grade-math-cases.md`:
- [x] Straightforward weighted case across three categories.
- [x] A term with exactly one assignment.
- [x] A category with no assignments at all — weight redistributed, grade correct.
- [x] A category whose every score is `excused` — behaves as empty, weight redistributed.
- [x] ~~A zero-point assignment — no division by zero, no effect on the percentage.~~
      **Rewritten 2026-08-09:** a zero-point assignment scored `5` **raises** the category by 5
      earned points against 0 possible — that is extra credit, and "no effect" was the opposite of
      the requirement. No division by zero either way.
- [x] Extra credit carries a category **past 100%**, and the overall grade past 100% with it.
      Nothing clamps.
- [x] A category holding **only** zero-point assignments — `possible` sums to zero, so it has no
      percentage. Behaves as empty and redistributes; never `NaN`, never `100%`, never a crash.
      **This is the case a naive engine dies on, and a teacher reaches it by making an "Extra
      credit" category and putting only extra credit in it.**
- [x] Weights totalling 95 — **no grade is returned at all**, and the reason names the total. Then
      the same document with the weights corrected to 100 returns a grade. Both directions.
- [x] A `missing` flag scores zero; the same cell set to `excused` raises the grade.
- [x] A `late` flag changes nothing versus the same score unflagged.
- [x] A blank cell changes nothing versus no cell at all.
- [x] Every category empty — an honest "no grade yet", not `0%` and not `NaN`.

**Traps** — A score cell is **always an object**, never a bare number. Polymorphic cells are where
grade bugs live. If you find yourself writing `typeof cell === 'number'`, something upstream is
wrong.

---

## WO-3.5 — Score entry grid

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** L · **Depends on** WO-3.3, WO-3.4
**Closes roadmap** Phase 3 → "Score entry grid" and "`late` and `missing` are marked, never
inferred."

**Why it exists.** The second-most-frequent action in the app, and it gets the same care as marking
attendance. Grades go in once or twice a week for five classes; if this is slow, the app is not used.

**Deliverables**
- **Surface: a main-area view**, the same shape and for the same reasons as the attendance registry —
  which was itself a dialog until WO-1.13 moved it. **Not a modal, and this one is not a preference.**
  A modal closes on `Esc`, which is the key a teacher's hand is nearest while typing a column of 25
  scores; a focus trap wants `Tab`, which in a grid means the next assignment; and `.modal-panel` is
  480px where this needs the full 1300px `.main`. Full reasoning in
  [`../gradebook-surfaces.md`](../gradebook-surfaces.md).
- **`src/scores.css`, loaded after `src/shell.css`**, styling only its own class names, with its own
  `@media (pointer: coarse)` block at the end. Two stylesheets never style the same class.
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
- [ ] `Esc` mid-column does not close the screen or lose the teacher's place, because there is no
      dialog to close. Prove it by pressing it, not by arguing the screen is a view.
- [ ] **Moving an assignment to another category updates every displayed grade in that class
      immediately** — the two categories it leaves and joins, and the overall grade with them.
      *(Inherited from WO-3.3.)*
- [ ] **No grade is shown while the weights are wrong, and the screen says why** — the number's
      absence and the total that caused it, not a figure with a "provisional" label on it. This is the
      owner's 2026-08-09 rule, which superseded WO-3.1's original line mid-build: *there is no grade at
      all until the weights total 100.* *(Inherited from WO-3.1.)*
- [ ] **Reweighting recomputes every displayed grade in that class immediately, and the crossing works
      in both directions** — grades appear when the weights reach 100 and disappear when they leave it.
      The disappearing half is the one a build can pass while getting wrong. *(Inherited from WO-3.1.)*

**The category-move line above them is WO-3.3's, and it is a box of its own for a reason worth
keeping.** *(Added 2026-08-09 at WO-3.3's correction round 1.)* WO-3.3 built the move — the `<select>`
in the assignment editor, the row redrawing under its new group head, the score column following byte
for byte — and could not show a grade change because nothing rendered a grade. Its debt was first
pointed at the reweighting box below, and that was the wrong home: **that box is about weights crossing
100, and ticking it by walking weights across 100 would have discharged WO-3.3's line with nobody
having moved an assignment at all.** A debt that the tooling closes without the claim ever being tested
is worse than no debt, because it reads as tested. So the claim has a box that only the claim can tick.

**The last two are inherited from WO-3.1, and they are acceptance lines here rather than a note.**
*(Re-homed 2026-08-09, when WO-3.1 was ticked.)* Both name a **displayed grade**, which WO-3.1 could
not show because nothing rendered one; this is the first screen with somewhere to not-show one. They
arrived recorded in WO-3.1's own prose as "owed to WO-3.5" — which is a debt written into a work order
that nobody re-reads once it is ✅, so they are boxes now. WO-3.4:236 already holds the engine half of
the first one; these two are the screen half.

*(They sat below this paragraph until 2026-08-09 and were invisible to `wo-gate.mjs`, which ends an
Acceptance list at the next bold line — so the two boxes this phase's debt hangs on could not have held
WO-3.5 open, and `--tick WO-3.5` would have written ✅ DONE over them. Moved into the list at WO-3.11,
which is the work order that made them checkable from the other end: **WO-3.1's lines 2 and 4 point
here** with a `→ WO-3.5` marker each, and `--audit` now fails if either box is reworded out from under
its pointer. Ticking these two is what discharges that debt — see WO-3.1's follow-up note.)*

**Traps** — Do not infer anything from the due date here. That's WO-3.6, and it is a prompt, not
arithmetic. **And do not reach for the modal system**, however much the surrounding code does — see
the Surface deliverable above and `../gradebook-surfaces.md`.

---

## WO-3.6 — Past-due prompt

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-3.5
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

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-3.4
**Closes roadmap** Phase 3 → "Per-student detail: category breakdown, what's missing, what it would
take to move."

**Why it exists.** This is the screen open during a guardian conference, and the source of the
numbers Phase 5's merge fields put in an email. "What would it take to move" is the difference
between a report and a conversation.

**Deliverables**
- **Surface: a main-area view.** This work order's own first sentence calls it "the screen open
  during a guardian conference" — a screen a teacher sits in front of with a parent, scrolling and
  pointing, is not a dialog. See [`../gradebook-surfaces.md`](../gradebook-surfaces.md).
- **You arrive here from a name, never from the nav strip** *(owner, 2026-08-09)*. WO-3.3 builds the
  three-tab switcher and this screen is deliberately not a fourth tab: it is reached by tapping a
  student from attendance, the assignment list or the score grid, and the strip then shows that
  student's name as a breadcrumb segment while you are in it. So **this work order owns no navigation
  target of its own** — it owns the entry points on the screens that name students, and the way back.
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
- [ ] It is a view in `<main>`, not a dialog.
- [ ] The strip shows the open student's name as a breadcrumb segment while this screen is up, and
      switching to any of the three tabs takes the name with it. *(Inherited from WO-3.3, which
      built the strip and the rule and could not demonstrate this half: there was no per-student
      detail to enter or to leave, so the name was never drawable. `setDetailBreadcrumb()` in
      `src/screen-nav.js` is the seam it is set through, and that module already refuses to draw a
      name unless its own view is the one on screen — the half that has to be shown here is the
      name actually appearing, and then going.)*

**Traps** — Do not build this in the modal system; see the Surface deliverable and
`../gradebook-surfaces.md`. And note that presentation mode is a harder problem on a view than in a
dialog: a dialog can be closed to hide it, a view is what is on the wall.

---

## WO-3.8 — Accommodation prompts at point of use

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-1.8, WO-3.3
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

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-3.4
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

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** nothing technical
**Closes roadmap** Phase 3 → *(no box. The roadmap's **Parallel, non-code** line at the end of Phase
3 is a paragraph, not a checkbox, so there has never been anything here to tick — the quotation
marks came off on 2026-08-08, WO-2.15, because the sweep was reading it as a fragment that matched
nothing. The box this work order's outcome eventually closes is Phase 7's **Verification
complete.**, and WO-7.3 owns it — a box is closed by one work order, never two.)*

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

---

## WO-3.11 — `**Owes**`, and splitting what 🔨 IN PROGRESS means

**Ship** 2 · **Status** ✅ DONE — 2026-08-09 · **Size** S · **Depends on** nothing
**Closes roadmap** *(no box. This is tracker tooling, like WO-2.15 and WO-2.16 — it closes no product
box, and inventing one to make the dashboard tidier is the drift those two work orders exist to
catch.)*

**Why it exists.** `🔨 IN PROGRESS` carries two unrelated meanings, and the tooling cannot tell them
apart:

1. **A dispatch is building this right now.** Written by `--start`, cleared by `--tick` or `--release`.
2. **This landed and was verified, and some Acceptance lines are open on purpose** — because they name
   something no work order has built yet.

WO-3.1 was the second and read as the first for a day. `next` stepped over it, which is right for a
live dispatch and wrong for a landed one nobody is touching; **WO-3.3's gate failed on it**, which is
right when a deliverable is missing and wrong when the deliverable shipped and is already imported;
and `--release`, the way back for a dispatch that died, could not be run safely, because a dead
dispatch and an intentionally-open work order are the same three glyphs.

**This is not a one-off, which is the argument for the work order.** WO-3.3's first two Acceptance
lines are *"does not break any grade calculation"* — the owner's extra-credit rule, a 0-point
assignment scored `5` being +5 earned points — and *"an assignment can be moved between categories and
the grade updates."* Neither can close until WO-3.4 computes a grade and WO-3.5 draws one, so WO-3.3
lands in exactly WO-3.1's position, and a 🔨 there blocks **WO-3.5**, which depends on it. The same
shape is waiting in WO-3.4 → WO-3.5. Reconciling it by hand each time is how the ✅ that means *done*
and the ✅ that means *we stopped checking* become the same mark.

**Deliverables**

- **A `**Owes**` field**, beside `**Depends on**`, naming the work orders that carry the re-homed
  lines. Absent on most work orders; present exactly when a line has been moved.
- **Re-homed Acceptance lines stay `- [ ]` and gain a `→ WO-3.5` marker.** `--tick` stops counting a
  marked line as holding the work order open — **but only when it can find a matching open box under
  the named target.** The pointer has to resolve or the tick is held, which is what stops "re-homed"
  from being a claim. *A re-homed line must never be `- [x]`: see the note below.*
- **Split the status.** `--start` writes **`🤖 CLAIMED — <dispatch>`**; `🔨 IN PROGRESS` keeps its
  honest meaning of work genuinely part-built; `✅ DONE` plus `**Owes**` covers landed-with-lines-owed.
  Then `next` skips 🤖 and 🔨, dependency gates block on both and pass on ✅, and `--release` only ever
  touches 🤖 — it can refuse everything else instead of trusting the caller.
- **The status vocabulary line in `plans/ROADMAP.md`** gains 🤖, since that line is where the words are
  defined.
- **`--audit` gains one check:** every `**Owes**` target resolves to a real, open box. A pointer to a
  box that was quietly reworded is the exact failure this exists to prevent.
- **`--self-check` plants each new violation** and fails if one stops being caught: an unresolvable
  `**Owes**`, a `→` marker with no target box, a `--release` against `✅ DONE`. Its own rule, and the
  reason it exists — a guard whose only evidence is that it printed PASS once is what WO-3.2's
  follow-up was cleaning up.

**Acceptance**
- [x] A work order with one `- [ ] … → WO-x.y` line and a resolving target ticks to `✅ DONE`, and its
      dependents' gates pass.
- [x] The same line with the target box **deleted or reworded** holds the tick, names the line, and
      writes nothing.
- [x] `--audit` fails on an `**Owes**` naming a work order that does not exist, and on one whose
      target box is already ticked.
- [x] `--release` against a `✅ DONE` or `🔨 IN PROGRESS` work order refuses and writes nothing;
      against `🤖 CLAIMED` it works as it does today.
- [x] `next` returns a work order that WO-3.1's old state would have hidden, and still skips both 🤖
      and 🔨.
- [x] `--self-check` plants all three new violations and fails when any one stops being caught.
- [x] WO-3.1's two re-homed lines are converted from `- [x]` to `- [ ] → WO-3.5`, and WO-3.1 still
      reads `✅ DONE` afterwards. **This is the migration, and it is the proof:** the same work order
      that forced this design has to come out honest at the end of it.

**Traps** — **Do not let a re-homed line be ticked.** WO-3.1's were marked `- [x]` by hand on
2026-08-09 with a paragraph on each explaining that ☑ meant *resolved on this work order, not
verified*. A mark that needs a paragraph to stop it meaning "verified" is the wrong mark, and the
paragraph is not in the file `--audit` reads. `- [ ] → WO-3.5` says the same thing on its face and is
checkable, which is the whole point of the field.

**And do not add a status that means "done except".** The temptation is a compound — `✅ DONE — <date>
· lines owed` — and it breaks the single-token status parse that every one of these tools reads,
including the phase files' own tables. The debt belongs in a field of its own, where a check can
resolve it.

**Not on the Ship 2 critical path.** Nothing about grades depends on it, and it must not be allowed to
delay WO-3.4 or WO-3.5. But it is worth running **before WO-3.3** — see Why it exists — because
WO-3.3 is the next work order that lands in the position this fixes.

---

## WO-3.12 — the grade-engine cases cover the arguments the engine actually takes

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-3.4 · **Blocks** nothing, and
that is deliberate — the arithmetic is right today, so this is a row to cut if the fortnight tightens
**Closes roadmap** *(no box. Harness, not app: nothing here changes what a teacher sees. Inventing a
product box for harness work is the drift WO-2.15 and WO-2.16 exist to catch — the same call WO-2.17
and WO-2.18 both made.)*

**Not a go-live blocker, and nothing here is a defect.** Added 2026-08-10, out of WO-3.4's second
verification. `src/grade-engine.js` is correct as shipped and its twelve worked cases all pass. **Do
not go hunting for a bug; there isn't one.** What is missing is the check that would notice if the
code stopped being correct.

**Why it exists.** WO-3.4's thirteen harness checks were mutation-tested at verification, and nine of
nine arithmetic mutants died — dropping the `possible === 0` guard, making `missing` stop adding to
`possible`, treating `excused` as `missing`, penalising `late`, capping the class grade at 100,
dividing by 100 instead of `activeWeight`, skipping the `isBalanced()` gate, returning `0` for no
graded work, and letting a blank cell add to `possible`. That suite is real evidence. **Five mutants
survived**, and they fall into two groups, both of which are about the *inputs the cases use* rather
than about the arithmetic they check.

**Group 1 — the fix that landed this week has no standing check.** WO-3.4's correction round routed
the weight total through `formatWeight()` (`src/grade-engine.js:96`) so the engine's "no grade yet"
message and the categories banner stop disagreeing about the same class on the same screen. The only
unbalanced-weight fixture in the harness is `50 / 30 / 15 = 95` — **integers, which is exactly the
case where the bug could not appear.** Measured at verification: reverting `formatWeight(total)` to
raw concatenation leaves **all thirteen checks green.** The defect was real — with `40.1 / 34.7 / 20`
the banner read `94.8%` and the engine read `94.80000000000001%` — and the fix is real, and today
nothing would catch it coming back. A fixture whose values cannot express the failure is the shape
this project has now recorded three times.

**Group 2 — every case is one class, one term, one student.** `c1`, `t1`, `s1` throughout
`docs/grade-math-cases.md`. An engine that ignored `classId`, `termId` or `studentId` **entirely**
passes all thirteen checks — confirmed by mutation, not by inspection: three separate mutants
dropping those filters all stayed green. The filters do hold in the source
(`src/grade-engine.js:34-37` and `:41-42`), which is why this is missing coverage and not a live
defect. But the engine's whole job is to answer *for one student, in one class, in one term*, and its
three most important arguments are currently unexercised. This is the WO-3.3 `classId` scar sitting
forty lines above WO-3.4 in this same file, in the one place that scar has not yet been checked.

**Deliverables**
- **A decimal-weight case.** Extend WO-3.4's case-8 fixture with `[40.1, 34.7, 20]` and assert the
  message reads `The category weights total 94.8%, so there is no grade yet.` — the string, not the
  number, because the string is what the teacher reads and what disagreed with the banner.
- **Multi-class, multi-term, multi-student fixtures**, so that each of the three filters is
  independently exercised: an assignment in another class, an assignment in another term, and a
  second and third student with different cells, each asserted to leave the subject's grade untouched.
- **Every new check is proved by a mutation, and the proof is written down.** Revert
  `formatWeight(total)` to raw concatenation and the decimal-weight check must go red **while the
  other thirteen stay green**. Drop each of the three filters in turn and the matching check must go
  red while the rest stay green. If a mutation reddens everything, the fixture is coupled and the
  check is not measuring what it claims. Record each mutation and its result in `tools/README.md`,
  the way WO-2.17's and WO-2.18's are.
- **`docs/grade-math-cases.md` gains the new cases** in the same hand-computed form as the existing
  twelve, since that document is the suite's source of truth and a check whose expected value is not
  written there has nowhere to be checked against.

**Out of scope** — anything in `src/`. The arithmetic is verified correct; this work order adds no
behaviour. If a new check goes red against current code, **that is a defect found and it gets its own
work order** — do not fix the app from inside this one. Also out of scope: the weight-`0` message
noted at WO-3.4's verification (a category holding the only graded work at weight `0` reports "There
is no graded work yet", which is factually off though the numeric answer is right). That is a wording
question for the screen that renders it, and it belongs to WO-3.5 or later.

**Acceptance**
- [ ] A case with weights `40.1 / 34.7 / 20` asserts the message string reads `94.8%`, not
      `94.80000000000001%`.
- [ ] Reverting `formatWeight(total)` at `src/grade-engine.js:96` to raw concatenation turns that
      check red and leaves WO-3.4's thirteen green — run, not reasoned, with the counts before and
      after quoted.
- [ ] An assignment in a second class does not move the subject's grade, and dropping the `classId`
      filter turns that check red on its own.
- [ ] An assignment in a second term does not move the subject's grade, and dropping the `termId`
      filter turns that check red on its own.
- [ ] A second student's cells do not move the subject's grade, and reading the first student's cell
      regardless of id turns that check red on its own.
- [ ] The new cases are written into `docs/grade-math-cases.md` with hand-computed expected values.
- [ ] `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` shows no new line.
- [ ] `src/` is byte-identical to HEAD across the whole work order.

**Traps** — **A mutation that reddens every check has proved nothing.** The point of each proof is
that one check moves and the others do not; that is what separates a check that measures its own
subject from a fixture so coupled that any damage anywhere shows up everywhere. And **do not rewrite
the existing twelve cases to be multi-class.** They are the hand-computed record that WO-3.4 was
verified against, they are readable by a teacher with a calculator, and their simplicity is a feature.
Add cases; do not complicate the ones that exist.
