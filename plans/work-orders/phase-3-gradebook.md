# Phase 3 work orders — Gradebook

**Phase goal:** grades entered once or twice a week, in minutes, for five classes.

Ship 2, target ~2026-09-15.

Grade math lives in [`../../docs/data-model.md`](../../docs/data-model.md) § Grade math. Two rules
govern this whole phase, and both are about the teacher never being surprised:

- **`late` and `missing` are marked, never inferred.** The grade must not change because a date
  rolled over.
- **Empty categories redistribute their weight.** Otherwise every grade is wrong until each
  category has an assignment.

---

## WO-3.1 — Categories & weights

**Ship** 2 · **Status** ✅ DONE — 2026-08-09 · **Size** S · **Depends on** WO-1.6
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
  *(Reversed by [WO-3.43](#wo-343--removing-a-category-moves-its-work-to-no-category) on 2026-10-04:
  removal now keeps the work and its scores, filed under* no category*, so there is nothing to warn
  about losing. The line stands as what this work order built.)*
- Sensible starter categories on class creation, trivially editable.

**Acceptance**
- [x] Weights of 40/35/25 produce no warning; 40/35/20 warns and shows "95%".
- [x] ~~The app still computes a grade while weights are wrong, and says the grade is provisional.~~
      **Superseded 2026-08-09 by the owner:** *there is no grade at all until the weights total 100.*
      The replacement line is the first inherited box on **WO-3.5**, the first screen with somewhere
      to not-show a grade. This line's own claim no longer exists and its replacement is gated by a
      box elsewhere, so it stayed open here and pointed there:
      `→ WO-3.5 "No grade is shown while the weights are wrong, and the screen says why"`
      **Discharged 2026-08-10**, at WO-3.5's correction round 1: every grade cell on the score grid
      is a quiet em dash while the weights come to 90, the banner stands where the number was and
      names that total, and *provisional* appears on no figure — driven in
      `tools/verify-shell.mjs` § "the score entry grid (WO-3.5)". The pointer above is kept in
      backticks, which this tracker reads as prose about a marker rather than a live one, so the
      record of where the debt was paid survives the ticking of it.
- [x] Two classes carry different category sets without interference.
- [x] Reweighting recomputes every displayed grade in that class immediately — **including the
      crossing in both directions:** grades appear when the weights reach 100 and disappear when
      they leave it. Nothing in the app displayed a grade while WO-3.1 was open, so there was never
      a build this could be run against. The half that had a consumer — the total and the verdict
      recomputing as a weight is typed, on the banner and the class-manager row — is driven and
      measured in `tools/verify-shell.mjs`; the displayed-grade half was owed by
      `→ WO-3.5 "Reweighting recomputes every displayed grade in that class immediately"`
      **Discharged 2026-08-10**, at WO-3.5's correction round 1, and in the direction the line warns
      about first: the weight is typed off 100 with the score grid behind the panel and all 25 grades
      go, then typed back and all 25 return on the keystroke. Backticked above for the reason the
      second box gives.

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

**The tick on lines 2 and 4, and who made it.** *(2026-08-10.)* `tools/wo-gate.mjs:299` says that
discharging a `→ WO-x.y` pointer and taking the **Owes** field off "is a human's edit" — the tool
refuses it deliberately, because the tick asserts *someone has seen the evidence that this debt was
paid*. **An agent made that edit here**, at the end of WO-3.5, and the verifier ruled the substance
correct on evidence it produced itself rather than on the implementer's word. **The owner ratified it
on 2026-08-10**, with the alternative on the table: revert all three boxes, restore both **Owes**
fields and rule by hand. Recorded because the rule is about *who asserted it*, and reading the ticks
alone would not tell you.

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

**Ship** 2 · **Status** ✅ DONE — 2026-08-09 · **Size** M · **Depends on** WO-3.1
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
- [x] An assignment can be moved between categories and the grade updates. **The move is built and
      verified** — one `<select>` in the editor, the row redraws under its new group head, and the
      score column follows byte for byte because `scores` is keyed by assignment. The displayed
      grade does not exist until the grid draws one, so that half was owed by
      `→ WO-3.5 "Moving an assignment to another category updates every displayed grade in that class"`
      **Discharged 2026-08-10**, at WO-3.5's correction round 1 — where it was found NOT to work:
      there was no `afterAssignmentChange()` chain at all, so the engine moved and the screen did
      not. With the chain in, one tap on that `<select>` moves all 25 displayed grades and the column
      head's chip with them. Backticked above so the pointer survives the tick that answers it.
- [x] Duplicating into another class produces a new assignment with no scores attached.
- [x] No date field auto-populates from anything schedule-shaped.
- [x] The list is a view in `<main>`, not a dialog, and the class's screens are switchable without
      passing through the class manager.
- [x] **Opening a class lands on Attendance every time** — including a class whose assignment list
      was the screen open when it was last left, and including after a reload. Prove it by leaving
      one class on Assignments, opening a second class and coming back, not by reading the code:
      the failure mode is a per-class memory nobody asked for, and it is invisible until the second
      class.
      *(**2026-10-04, [WO-3.45](#wo-345--a-class-tab-on-the-assignment-list-or-the-score-grid-drops-you-on-attendance):**
      a **header tab** tapped from Assignments or Scores now keeps that screen and shows it for the
      class tapped — the owner's ruling, "same screen, different class", as the calendar and the
      concern list already did. **This line is not reopened and its tick stands:** its argument is
      against a per-class memory of the last screen, and both of its proofs are still true — a card
      on the home grid opens on Attendance, and a reload lands on Attendance (`REMEMBERED_AS` is
      unchanged). What changed is the *leave one class on Assignments, open a second* route when the
      second class is opened by its header tab; `tools/verify/assignments.mjs` now proves the
      no-memory half by leaving A on Scores, going home, and opening B from its card. Student detail
      still drops to Attendance on a tab.)*
- [x] The switcher carries three tabs and no student tab. A student's name appears in the strip only
      while that student's detail is open, and switching away from it takes the name with it. **The
      first sentence is built and verified**, on both strips: three segments, no fourth, no student
      among them. The second could not be demonstrated in this build — there was no per-student detail
      to enter or leave — so what was verified instead is the rule that makes it true, that a name set
      with no detail screen open is drawn nowhere. The other half was owed by
      `→ WO-3.7 "The strip shows the open student's name as a breadcrumb segment while this screen is up"`
      **Discharged 2026-08-12**, at WO-3.7, which is the first build that had a screen to enter: the
      strip draws four segments with the student's name last, and each of the three tabs in turn takes
      it off every strip on the page. Both directions, and all three tabs rather than the one somebody
      tested. Backticked above so the pointer survives the tick that answers it.

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

**Ship** 2 · **Status** ✅ DONE — 2026-08-10 · **Size** L · **Depends on** WO-3.3, WO-3.4
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
- Touch path: the grid is usable on an iPad, and every control is in the coarse-pointer block.

**Paste-a-column was split out to [WO-3.13](#wo-313--paste-a-column-of-scores) on 2026-08-10.** It read
as one line here — *"paste a column of scores from a clipboard, with a preview"* — and it is a second
surface with its own preview, its own alignment rules and its own way to silently put a score on the
wrong student. It closes no roadmap box, it is not on WO-G2, and nothing in the grid depends on it, so
it is the one deliverable that can leave without the rest changing shape. **This work order is still
size L**: the split removes a self-contained surface, it does not reclassify what is left. The grid,
the keyboard path, the flags, the live grades, the touch path and the three inherited debts below are
what makes it L, and none of them moved.

*(**WO-3.13 was struck on 2026-08-15** — the owner's answer to the question at its head is that scores
arrive on paper, so there is no column to paste. The split was still the right call: it is what let
that deliverable be answered on its own merits instead of riding into the grid unexamined. Pasting is
not coming to the score grid, and nothing here waits on it.)*

**Acceptance**
- [x] Entering 25 scores down a column takes 25 keystroke-groups and no mouse.
- [x] `Enter` at the bottom of a column does something sensible and predictable.
- [x] A cell flagged `missing` is visually distinct from `excused` and from blank.
- [x] Clearing a cell removes the key entirely rather than storing `{ v: null }` with no flag.
- [x] Grades recompute live and match WO-3.4's hand-computed values.
- [x] The grid is usable on an iPad in landscape. *(Owner, on the hardware, 2026-08-10. Four things
      came out of the same sitting and are booked rather than folded in here: WO-3.14, WO-3.15,
      WO-3.16, WO-3.17.)*
- [x] `Esc` mid-column does not close the screen or lose the teacher's place, because there is no
      dialog to close. Prove it by pressing it, not by arguing the screen is a view.
- [x] **Moving an assignment to another category updates every displayed grade in that class
      immediately** — the two categories it leaves and joins, and the overall grade with them.
      *(Inherited from WO-3.3.)*
- [x] **No grade is shown while the weights are wrong, and the screen says why** — the number's
      absence and the total that caused it, not a figure with a "provisional" label on it. This is the
      owner's 2026-08-09 rule, which superseded WO-3.1's original line mid-build: *there is no grade at
      all until the weights total 100.* *(Inherited from WO-3.1.)*
- [x] **Reweighting recomputes every displayed grade in that class immediately, and the crossing works
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

**Ship** 2 · **Status** ✅ DONE — 2026-08-13 · **Size** S · **Depends on** WO-3.5
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
- [x] Dismissing the prompt changes no score and no grade. *(Both halves asserted over a twin class:
      every score cell in the whole document byte identical either side of the tap, and all five
      displayed grades the same strings, agreeing with the engine asked separately.)*
- [x] The grade before accepting is identical to the grade with the prompt never shown. *(The
      never-shown arm is the twin class reloaded with its prompt already dismissed in `localStorage`,
      so the render being read has never drawn one.)*
- [x] Accepting writes `{ v: null, flag: "missing" }` to exactly the previewed cells. *(The previewed
      ids are read off the screen, not out of the module; the excused cell, the late blank, the scored
      cell and every cell on the three assignments that are not past due are byte identical after.)*
- [x] A dismissed prompt does not reappear on every render. *(Four renders including a full page
      reload — and it is per assignment rather than global: the other class still asks.)*

**Surface, and the two decisions the work order left open** *(taken 2026-08-13, at the build)*. The
prompt is a **banner in the view**, not a dialog: WO-3.5's `Esc` acceptance line forbids anything on
that screen for the key to close, and `plans/gradebook-surfaces.md`'s test does not settle a prompt
that appears unasked, so it is the same inline-notice component the no-grade banner beside it is, with
an **inline** review under it. A **past-due blank** is a cell carrying nothing at all — no key, or
neither value nor flag — so `excused` and a scoreless `late` are deliberately not in the set. And a
**dismissal is a UI preference**, `planbook_pastDueDismissed`, an assignment id and `true`: the year
document syncs and is restored from backup, and a nudge does not belong in the record of a school
year. The reasoning for all three is in `src/past-due.js`'s header and in
`.claude/dispatch/WO-3.6-result.md`.

**Out of scope, and left undone deliberately** — the **overdue tint on a score-grid column head**,
which `design/mockups/proposed.css` draws and `src/scores.css` says belongs to this work order. It is
not in the Deliverables, and it is proposed as a follow-up in the result file rather than folded in.

**The 👤 sitting is paid.** The three lines this work order owed — the three controls under a thumb,
whether the banner reads as an offer rather than an error above a grid, and an offline launch on
`planbook-shell-v51` — were run by the owner on 2026-08-13 on the installed app and all three passed.
`TESTING.md` § WO-3.6 carries them, and the **Owes** field came off with them.

---

## WO-3.7 — Per-student grade detail

**Ship** 2 · **Status** ✅ DONE — 2026-08-12 · **Size** L · **Depends on** WO-3.4, WO-2.6
**Closes roadmap** Phase 3 → "Per-student detail: category breakdown, what's missing, what it would
take to move."

*Re-sized M → L and given a second dependency on 2026-08-11, when per-student print and CSV were
amended in at the owner's call. The roadmap boxes are unchanged: "Print/CSV for grades" is WO-3.9's
class-level output and stays there, and this closes no box of its own for the added half — it is a
deliverable this work order absorbs rather than a line the roadmap was tracking. The WO-2.6
dependency is real rather than decorative: the print gate and the download hand-off are to be
borrowed from it, not re-derived.*

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
- **Print and CSV for the one student on the screen** *(owner, 2026-08-11)*. This is the sheet a
  guardian leaves the conference holding: the category breakdown, the missing work, the attendance
  summary, one student, one page. **It rides here rather than in a work order of its own** for a
  reason that is about the artifact and not about scheduling — a per-student printout that showed
  attendance but not grades would be the wrong thing to hand a parent, and per-student output cannot
  be built correctly until the screen that assembles all of it exists. That screen is this one.
  - **The mechanism already exists and is to be borrowed, not re-derived.** WO-2.6 built the app's
    first `@media print` block, gated on a `<body>` attribute the Print button sets and removes
    (`body[data-attendance-print]`, Roll Call!'s `data-modal-print` idiom), and exported
    `handToBrowser()` from `src/backup.js` as the one-download-per-tap hand-off. Use both. A second
    print idiom in this app is a second thing to keep gated, and an ungated rule prints a blank sheet
    from every other screen.
  - **A print surface on a *view* is a harder problem than on a dialog**, and this is where the two
    traps below meet: WO-2.6 printed from a modal, which is a bounded thing with a known parent. A
    view is the whole screen, including the nav strip and the breadcrumb.
  - **Roll Call!'s `printStudentReport` is the precedent** — lift its structure and measurements with
    the function, per `CLAUDE.md`. Its at-risk banner, absence letter and email composer are **not**
    in scope here: those are Phase 4 and 5, and a threshold invented here would be a second opinion
    about "at risk" before the work order that owns the first one is written.
  - **The CSV's fixture roster must contain a non-ASCII name.** WO-2.6 shipped a BOM asserted present
    and never asserted useful, because every name in the harness is ASCII; the gap was closed by the
    owner's own roster rather than by a check. Do not inherit that hole.

**Acceptance**
- [x] The breakdown's contributions sum to the displayed overall grade. *(Three claims, not one: the
      column as PRINTED sums to the footer as PRINTED, and both agree with the engine's own answer.
      `["36.71","19.12","9.41"]` sums to 65.24 under a footer and hero of `65.24%`, against an engine
      answer of 65.23529411764706.)*
- [x] With a category empty, the breakdown shows the redistribution rather than hiding it.
      *(Participation carries 15% and holds nothing. Its row is drawn, in the caution wash, reading
      `nothing graded in it yet — its 15% is shared across the others`, and the three rows beside it
      print what they COUNT AT — `47.06% · 29.41% · 23.53%` — rather than their face weights.)*
- [x] The "to move" figure is reproducible by hand. *(Every figure was computed by hand first and is
      written down in the harness section's own header, then asserted as a string rather than read
      back off the screen: floor `52.54%`, ceiling `75.09%`, next band D+ at 67, rate
      `(67 − 52.5392…)/(75.0882… − 52.5392…)` rounded UP to `64.14%`, landing at `67.00%`.)*
- [x] No `supports` data appears on this screen in presentation mode. *(Stronger than the line asks,
      and deliberately: `src/detail.js` does not import `src/supports.js` and has no path to
      `student.supports`, so there is nothing to suppress. Asserted with the data planted first —
      five sentinels and `"plan":"IEP"` confirmed present in the serialised document — then absent
      from the screen in BOTH modes.)*
- [x] It is a view in `<main>`, not a dialog. *(`#detailView` is a child of `<main>`, carries no
      `role`, and tapping a name opened zero `.modal-overlay`s. Reached through the real door.)*
- [x] One student's detail prints to one page carrying their name, the class, the term and the date
      it was printed — and the nav strip, breadcrumb and any app chrome are not on it. *(**Confirmed
      on the owner's own printer, 2026-08-12 — one page, two columns.** The chrome half was measured
      here; the page count could only ever be closed by paper, and now has been.
      Snapshotted inside a stubbed
      `window.print()` under emulated print media: the hero carries `Zoë Ñuñez-Öztürk`,
      `WO-3.7 Detail` and `WO-3.7 Term`, the stamp reads `Printed August 12, 2026 · Planbook`, and
      the app header, the panel header, the nav strip, the breadcrumb, the action row and every other
      view are `display: none` with zero-height boxes — `0 element(s) still drawn outside
      #detailView`. **Whether it came out as ONE SHEET no emulator could say** — that half was the 👤
      line in `TESTING.md` § WO-3.7, exactly as WO-2.6's paper half was, and the owner answered it.)*
      **Corrected 2026-08-12:** the verifier found the sheet was not the sheet this code was designed
      to produce — under print media a `max-width` query resolves against the **page box**, Letter at
      `@page { margin: 10mm }` is ≈740 CSS px, and `src/detail.css`'s tablet-portrait
      `@media (max-width: 1024px)` therefore beat the gated block and printed one column, which is
      the two-page sheet this line forbids. The gated block now restates `grid-template-columns` (and
      the hero's `gap` and `text-align`, found by the same sweep), and the harness re-drives the Print
      button at 740px with the narrow band asserted matching — `grid tracks
      ["416.422px","308.469px"] over 2 column(s), side by side = true` — plus a second check requiring
      every `max-width` rule that touches this sheet to be restated inside the gate (`0 unpinned`).
      Both watched failing against the pre-fix stylesheet: `628 checks · 626 passed · 2 failed`.
- [x] The per-student CSV opens cleanly in a spreadsheet, **including a name with a non-ASCII
      character in it**. *(**Opened in the owner's own spreadsheet, 2026-08-12.** The bytes were
      measured here; the spreadsheet was owed to the owner and is now answered. A BOM, no
      bare LF anywhere, five category rows all seven cells wide, `Ó"Brien, Jr` surviving as one cell —
      and the non-ASCII half asserted USEFUL rather than only present, which is the hole WO-2.6 left:
      the same bytes decoded as Windows-1252 read `Ã‘uÃ±ez-Ã–ztÃ¼rk`, so the BOM is demonstrably doing
      work. **Opening it in the spreadsheet they actually use was always theirs to do**, per WO-2.6's
      own precedent — the 👤 line in `TESTING.md` § WO-3.7, now answered.)*
- [x] Neither the printout nor the CSV emits accommodation, medical, or plan data — verified in both
      presentation modes, with the data asserted present in the document first. *(A plan, a case
      manager, a review date, an accommodation, a medical line and a behavior plan are planted on the
      student and their presence in the serialised document asserted BEFORE anything is read. Then
      the screen's text, the CSV's text and the model's JSON are searched for all five sentinels and
      for the word `IEP`, twice — mode OFF where `supportsVisible()` answers true, and mode ON. Zero
      hits in either pass over surfaces of 2,735, 716 and 1,322 characters, so none was empty.)*
- [x] The strip shows the open student's name as a breadcrumb segment while this screen is up, and
      switching to any of the three tabs takes the name with it. *(Inherited from WO-3.3, which
      built the strip and the rule and could not demonstrate this half: there was no per-student
      detail to enter or to leave, so the name was never drawable. `setDetailBreadcrumb()` in
      `src/screen-nav.js` is the seam it is set through, and that module already refuses to draw a
      name unless its own view is the one on screen — the half that has to be shown here is the
      name actually appearing, and then going.)* **Shown, 2026-08-12:** the strip draws four segments
      with `Zoë Ñuñez-Öztürk` last, `detail: true`, carrying no `data-class-screen` of its own; each
      of the three tabs in turn is then tapped and every strip on the page comes back to three
      segments with the name nowhere on any of them, and re-entering puts it back. All three tabs,
      not the one somebody tested.

**Traps** — Do not build this in the modal system; see the Surface deliverable and
`../gradebook-surfaces.md`. And note that presentation mode is a harder problem on a view than in a
dialog: a dialog can be closed to hide it, a view is what is on the wall.

**Printing a view is the other half of that same trap.** WO-2.6's print surface is a modal — a
bounded element with a known parent, which is why its verifier checked by hand that the modal is a
direct child of `<body>` and why every one of its 24 print rules is gated on the body attribute. A
view has no such boundary: the nav strip, the three-tab switcher and the breadcrumb are all on the
screen it prints from, and none of them belongs on the sheet. Whatever hides them must be gated the
same way, or a Ctrl+P from any other screen starts producing blank paper again.

---

## WO-3.8 — Accommodation prompts at point of use

**Ship** 2 · **Status** ✅ DONE — 2026-08-13 · **Size** S · **Depends on** WO-1.8, WO-3.3
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
- [x] Creating a test surfaces the counts; creating a homework assignment scoped elsewhere doesn't.
      *(Both halves on one fixture. A new assignment lands in the class's first category — `Tests` —
      and the prompt says docs/data-model.md's own worked sentence word for word: **"3 students have
      extended time, 2 need a separate setting."** Changing the same open editor to `Homework` empties
      it: host hidden, host text `""`, zero `[data-accommodation-names]` hooks on the page, and the
      kind phrases gone from a page of 23,771 characters. The roster still carries an accommodation
      there — one scoped to `labs, field work` — so this is a scope that does not match rather than a
      class with nothing on file.)*
- [x] The default view is counts, not names. *(The reveal is drawn and collapsed —
      `aria-expanded="false"`, labelled "Show which students" — with zero name chips and none of the
      five students named anywhere in a dialog of 1,094 characters. One tap puts five names on screen
      grouped under their kind, and a category change puts them back behind the tap.)*
- [x] In presentation mode nothing appears at all — not even the count. *(Absent from the DOM, not
      styled away: host empty, `.hidden`, `display: none`, zero reveal hooks, and no kind phrase left
      on a page of 24,104 characters — read with the editor still open on the category that was
      showing all of it a moment earlier. The reveal is not merely un-drawn: called straight through
      the seam under the mode it writes nothing either. Flipping back brings the same sentence back to
      the same open dialog, which is what makes the absence a suppression rather than a build that
      cannot draw one.)*
- [x] Marking a student absent for the Nth time surfaces an attendance-related plan clause if one
      exists. *(Deferred to Phase 4 if the behavior log isn't ready; note it if so.)* **It is
      deferred, and for a reason narrower than the parenthetical guessed** *(2026-08-13, WO-3.8):
      attendance marking and its counts have shipped, so the behavior log is not what this was
      waiting on. What is missing is the clause itself. `supports` has no attendance-clause field —
      `plan`, `caseManager`, `reviewDate`, `accommodations[]`, `medical`, `behaviorPlan`, and
      `appliesTo` is documented as being about grading categories — and `signals` is deliberately
      empty in `src/store.js`, so there is no N either. Inventing both, plus a surface on the
      registry, is three decisions this work order's Deliverables never name.*
      **Paid by WO-4.4 on 2026-08-24, and the pointer is discharged rather than left standing.**
      That work order shaped both of the missing pieces this deferral named: the clause is a free-text
      `supports.attendanceClause` — a field beside `medical` and `behaviorPlan`, not a thirteenth
      accommodation KIND, which would have fired this very editor's summary on every assignment in the
      year — and the N is **the attendance signal rule's own N**, read through `thresholdsOf()`, so no
      new threshold key exists to disagree with it. The surface is WO-3.8's shipped
      `.accommodation-prompt`, worn whole and untouched, which is where this box's presentation-mode
      half comes from for nothing. Measured in `verify-shell.mjs` with three negatives beside the yes;
      **the thumb readings are still 👤** and are written up in `TESTING.md` § WO-4.4, so if that
      sitting fails, this box and WO-4.4's fifth come back together.

---

## WO-3.9 — Grades print & CSV

**Ship** 2 · **Status** ✅ DONE — 2026-08-13 · **Size** M · **Depends on** WO-3.4
**Closes roadmap** Phase 3 → "Print/CSV for grades."

*Built 2026-08-12. **All four Acceptance boxes are ticked** — the owner closed lines 1 and 3 the same
day, against the live SIS and a real spreadsheet, exactly as WO-2.6 and WO-3.7 closed the same half.*

***The same sitting found a bug: the Print button worked once, and the second tap printed the whole
app.*** *Chrome refuses a repeated `print()` with "This website has been blocked from automatically
printing"; a refused `print()` does not block, so the 500ms timer that clears the print gate had run
by the time the owner pressed Allow. Turning the preview from portrait to landscape did the same thing
by the other road — the preview re-generates from the live DOM, also after the timer. Fixed by
answering the gate from a `beforeprint` listener at the moment the browser serialises the page rather
than setting it on a timer at the moment we ask; the reasoning is at `src/grades-report.js`
printGrades(), and four checks cover it, two of which the shipped build fails.*

***Re-tested by the owner 2026-08-13: the preview is correct on the second tap and after a turn to
landscape.*** *Chrome still shows the throttle message there, which is the browser and not this app —
one tap calls `window.print()` exactly once, and that is now a check rather than a claim. Left as a
known browser behaviour.*

***Closed 2026-08-13.** The owner also printed the sheet on their own printer and tapped it on the
installed iPad, which are the last two 👤 lines in `TESTING.md` § WO-3.9. No finding against either,
so the eight-column slice, the forced page break and the 6pt column head all stand as built.*

***The timer is WO-2.6's, and `src/attendance-report.js` and `src/detail.js` still carry it verbatim —
so both of those print surfaces still have this bug.*** *Not fixed here; that is a call about two
closed work orders, not this one. See `TESTING.md` § WO-3.9.*

**Why it exists.** The SIS has no import, so re-keying is manual and the printout is what the owner
types from. **Order it to match the SIS entry screen** — that single decision is most of this work
order's value.

**The order, answered by the owner — 2026-08-12.** *This is the fact the deliverable used to say "ask
the owner" for. It is recorded here so nobody guesses it, and so a verifier can check the build
against something other than the builder's memory.*

| | |
|---|---|
| **Layout** | **Student-major grid** — one row per student, assignments as columns |
| **Row order** | alphabetical by **last name** |
| **Column order** | by **due date** |
| **Name display** | `Last, First` — matching the SIS |
| **Student ID column** | none. The SIS entry screen has no ID to match on, so the name is the join |

**Student-major was chosen against a drawn mock-up of both**, not in the abstract: the alternative was
one section per assignment with the roster repeated inside each, which reads straight down while
typing but never puts a student's whole term in one place and costs several times the paper. The grid
was chosen because a term fits on a page or two and the same sheet doubles as the at-a-glance class
picture. **If a re-key with the real SIS turns out to want a finger held on one assignment column, that
is the finding Acceptance line 1 exists to catch** — and the answer then is the assignment-major
layout, already designed, not a redesign from nothing.

**Deliverables**
- Print view of a class's grades for a term: **a student-major grid**, students down the page
  alphabetically by last name as `Last, First`, assignments across in due-date order, each column
  carrying its due date and point value, and a total percentage and letter at the right.
- CSV export of the same, **in the same order** — the printout and the file must not disagree, or the
  order stops being a decision and becomes two of them.
- Both carry class, term, date, and the letter scale in use.
- **`late` and `missing` are shown as the teacher's marks**, and a blank stays blank. A printout that
  turned a blank into a zero would be inventing a grade on the sheet the SIS gets typed from.
- Presentation-mode safe; no `supports` data on either.

**Acceptance**
- [x] 👤 The print order matches the SIS entry screen, confirmed by the owner against a real re-key.
      **Closed by the owner 2026-08-12: the order matches.** *The recorded answer above was right, so
      the assignment-major layout this line existed to catch stays undrawn.* **Built as recorded, and
      measured as such: the rows come out `Ñuñez-Öztürk, Zoë · Ó"Brien, Jr, Ida · Zabkowski, Abe`
      off a roster stored in a third order, the columns come out in due-date order off a document
      order that is not it, and there is no id column. Whether that order is the SIS's is the one
      thing no run can answer — see `TESTING.md` § WO-3.9.**
- [x] Percentages and letters on the printout match the app exactly. *(Three ways rather than one,
      because "match the app" is a claim about two surfaces: the sheet against arithmetic done by
      hand, against `src/grade-engine.js` through the seam, and against what the score grid behind
      the dialog is drawing for the same three students at the same moment — `73.00% C · 63.53% D ·
      122.22% A` on all three. The fixture's weight base moves per student (65 with two empty
      categories, 45 with an excused test) and one grade is over 100 because extra credit is a
      scored zero-point assignment.)*
- [x] The CSV opens cleanly in a spreadsheet, with its rows and columns in the same order as the
      printout. **Closed by the owner 2026-08-12: it opens cleanly.** *(The ORDER half is asserted
      cell for cell — the file's grid reassembled against the
      page's slices, every column head, row head and cell the same string in the same place — and the
      format half is measured: a BOM, no bare LF, four sections at consistent widths, `Ó"Brien, Jr,
      Ida` surviving as one cell. **Opening it in the spreadsheet the owner actually uses was always
      theirs to do**, exactly as at WO-2.6 and WO-3.7; it is the 👤 line in `TESTING.md` § WO-3.9.)*
- [x] Neither surface emits accommodation, medical, or plan data. *(Stronger than the line asks, and
      deliberately: `src/grades-report.js` does not import `src/supports.js` and has no path to
      `student.supports`, so there is nothing to suppress. Asserted with the data planted first — five
      sentinels and `"plan":"IEP"` confirmed present in the serialised document — then absent from the
      dialog, the CSV and the model in BOTH presentation modes, over surfaces of 1,503, 882 and 2,631
      characters so none was empty.)*

---

## WO-3.10 — the OAuth client exists and asks for one scope

**Ship** — · **Status** ✅ DONE — 2026-08-11 · **Size** S · **Depends on** nothing — no domain, no name, no
policy · **Blocks** Phase 7 can be built and run once this exists
**Closes roadmap** Phase 3 → *(no box. The roadmap's **Parallel, non-code** line at the end of Phase
3 is a paragraph, not a checkbox, so there has never been anything here to tick — the quotation
marks came off on 2026-08-08, WO-2.15, because the sweep was reading it as a fragment that matched
nothing. The box this work order's outcome eventually closes is Phase 7's **Verification
complete.**, and WO-7.3 owns it — a box is closed by one work order, never two.)*

**Split on 2026-08-10, and the split is the point.** This was one M-sized work order carrying
everything from "create a Cloud project" to "submit for verification", and **it could not be started
at all**: its own deliverable list required a verified domain, which requires the hosting and naming
decision, which sat in WO-8.6 in Phase 8. So the one item on the board paced by an outside party was
also the one nobody could pick up. It is now three:

| | | |
|---|---|---|
| **WO-3.10** *(this one)* | the client and the consent screen | startable today, needs nothing |
| **WO-8.7** | the name and the host, decided | the real critical path |
| **WO-3.18** | policy, video, submission | needs the domain WO-8.7 settles |

**Why it exists, and the thing that was hiding inside the old shape.** Verification gates **public
launch, not development.** `docs/sync.md` says sync stays behind a flag until it is verified and the
local-first app ships without it — but an OAuth client in **Testing** mode, with the owner as a test
user, runs `drive.file` today. So the whole of Phase 7 — the token flow, `rev`/`baseRev` ordering,
the conflict copy — **can be built, run and used on the owner's own two devices months before any
paperwork clears.** The unverified-app screen is a click-through for one person who knows what it is,
and it is intolerable only in front of a stranger. That is what this hour in a console buys, and it
is why it is not paperwork.

**Deliverables**
- A Google Cloud project and one OAuth client, owned by us. Teachers deploy nothing.
- Consent screen configured requesting **`drive.file` and nothing else**.
- Publishing status left at **Testing**, with the owner added as a test user, and the client id
  written down where Phase 7 can read it.

**The client, as built — 2026-08-11.** *This is what WO-7.1 reads.*

| | |
|---|---|
| **Client id** | `953887983230-ub72ee8rs6r6ejggn55l83pva3e8pedl.apps.googleusercontent.com` |
| **Client type** | Web application |
| **Scope** | `https://www.googleapis.com/auth/drive.file`, and nothing else |
| **Publishing status** | Testing, owner added as a test user |
| **Authorized JS origins** | **two, and both are registered.** `https://localhost:8443` — accepted by the console 2026-08-11 · `https://planbook.hwgteach.com` — added 2026-08-21, **confirmed in the console by the owner 2026-08-24: two entries, exactly these** |
| **Google Drive API** | enabled on the project — confirmed by the owner 2026-08-24. WO-7.1 does not need it; **WO-7.2's first upload does**, and a project without it fails on the request as a 403 rather than at sign-in |
| **Owning Google account** | the owner's **personal Gmail**, not the `@stjohnshigh.org` Workspace account — confirmed 2026-08-12 against the Search Console verification, and named this way on purpose (see below) |

**The second origin was added 2026-08-21 and this table did not learn it for three days — 2026-08-24.**
The row above held one origin until then, because the addition happened during a console sitting whose
only record was `plans/runbooks/wo-7-1-runbook.html` § step 0, a dated HTML page that marks it ✅ done. **A
runbook is a click path, not a register**, and that page says so about itself in as many words: *nothing
here can be confirmed from the repository — the origin list lives in Google's console and no file in
this tree records it.* It is recorded here now, on the owner's reading of the console, because this
table is the thing WO-7.1 and WO-7.3 are told to read.

**Registered is not the same as reachable, and the difference is a function rather than a form.**
`hostAllowsSignIn()` in `src/auth.js` still answers **false** for `planbook.hwgteach.com` — asserted
by `verify-shell.mjs` as a deliberate departure — so the deployed app draws no sign-in even though
Google would now accept the handshake from it. That half is WO-7.3's, and the console half of the pair
it names is already paid. The two failure modes read differently and it is worth knowing which is
which before opening a console: *"The given origin is not allowed for the given client ID"* is the
list; **no Drive section on the screen at all** is the flag. *(**Reachable since 2026-09-25**:
[WO-7.4](phase-7-sync.md#wo-74--the-deployed-app-has-no-sign-in-for-googles-reviewer-to-find) took
WO-7.3's flag half and widened `hostAllowsSignIn()` to `planbook.hwgteach.com`, so the deployed app
draws the Drive section and `verify-shell.mjs` asserts **true** for that host now. The paragraph above
is the record of the gap as it stood; the diagnostic in its last sentence still holds for any origin
added later.)*

**The account that owns this project was never written down, and WO-8.7 is where that started to
cost — 2026-08-12.** The table records what the client *is* and nothing about *whose* it is. That was
fine while the only consumer was a laptop already signed in, and stopped being fine the moment a second
Google surface had to agree with this one: **domain verification is per-account**. Search Console can
report the owner as a verified owner of `hwgteach.com` — it does, from a TXT record predating this
project — while the Cloud console refuses that same domain, if the two are different accounts. The
symptom appears in WO-3.18 as an authorized-domain field rejecting a domain that is visibly verified,
which is a genuinely hard hour if nobody wrote the account down. **Checked 2026-08-12: they match**,
and WO-8.7's third Acceptance line closed on it.

**The row describes the account rather than spelling it out, and that is deliberate.** This repository
is public — the note below says so about the client id, and the same fact points the other way here.
An address in a public file is a spam and phishing target, and unlike a client id it is not protected
by an origin list. What a future reader actually needs is *which of the owner's two accounts*, and
"the personal Gmail, not the school Workspace one" answers that completely. **The distinction is also
the one that matters long-term**: the `@stjohnshigh.org` account belongs to an employer and disappears
with the job, taking a Cloud project and a domain verification with it. The project sitting on the
personal account is the right call and is now written down as a choice rather than an accident.

**The client id is not a secret and belongs in this file.** For a browser client it is an identifier
rather than a credential: it ships in the served JavaScript of every app using Google Identity
Services, so it is public the moment Planbook deploys, and this repository is public already. What
protects the client is the **authorized JavaScript origin list**, which is why that row matters and
the id itself does not. **A client *secret* is a different thing and never goes in here** — a browser
token flow does not use one.

**The port is part of the origin, not a detail.** A browser sends scheme + host + port whenever the
port is not the scheme's default, and Google matches the registered origin exactly — so bare
`http://localhost` means port 80 and matches nothing this project serves. `tools/serve-https.mjs`
puts the app on **8443 over HTTPS**, and `tools/make-cert.mjs` deliberately writes `localhost` and
`127.0.0.1` into the certificate so that same server answers this laptop's own browser. Hence
`https://localhost:8443` — no path, no trailing slash. **The origin is also the only thing protecting
this client**, which is why it is recorded here and the id is treated as public.

**One origin means one place the token flow can be exercised, and it is not the iPad.** Google
rejects raw private addresses, so `https://192.168.50.142:8443` — the LAN address the tablet reaches
this laptop on — cannot be registered. *(Expected rather than measured: only the localhost origin was
tried. If someone does test it, record the console's answer here.)* The consequence WO-7.1 inherits
either way: **until WO-8.7 settles a real domain, sign-in and token refresh can be driven on the
laptop only.** Every other Phase 7 behaviour — `rev`/`baseRev` ordering, the conflict copy — is
ordinary code and is testable anywhere; it is specifically the OAuth handshake that is pinned to one
machine. Do not plan an iPad sitting around the auth flow before that domain exists.

**Acceptance**
- [x] The consent screen lists exactly one scope, and the scope string is `drive.file`.
      *(Owner, in the console, 2026-08-11.)*
- [x] A sign-in completes on the owner's own account and the app receives a token — driven, not
      assumed. The unverified-app screen is expected here and is not a failure. *(Paid 2026-08-24 by
      WO-7.1's own sitting, owner on the laptop at `https://localhost:8443`: the handshake completed,
      the About panel read **Connected to Google Drive** with a clock time about an hour out, and the
      consent screen carried one permission line. This box was open on purpose until then — there was
      no sign-in code in the app to drive.)*
- [x] The client id is recorded where WO-7.1 will look for it. *(The table above, 2026-08-11.)*

**Traps** — Adding `spreadsheets` or a mail scope re-opens verification and puts the warning back in
front of a teacher. `drive.file` is a sensitive scope, not a restricted one, so there is no CASA
security assessment — days, not months, if nothing is added later. **And Testing mode is not a
destination:** it works for the owner and for up to a hundred test users, and it is the thing WO-3.18
replaces before a stranger ever sees the consent screen.

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

**Ship** 2 · **Status** ✅ DONE — 2026-08-11 · **Size** S · **Depends on** WO-3.4 · **Blocks** nothing, and
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
- [x] A case with weights `40.1 / 34.7 / 20` asserts the message string reads `94.8%`, not
      `94.80000000000001%`.
- [x] Reverting `formatWeight(total)` at `src/grade-engine.js:96` to raw concatenation turns that
      check red and leaves WO-3.4's thirteen green — run, not reasoned, with the counts before and
      after quoted. Before: `595 checks · 595 passed · 0 failed`. During: `595 checks · 594 passed ·
      1 failed`, the one red being the decimal-weight check.
- [x] An assignment in a second class does not move the subject's grade, and dropping the `classId`
      filter turns that check red on its own — `595 checks · 594 passed · 1 failed`, nothing else moved.
- [x] An assignment in a second term does not move the subject's grade, and dropping the `termId`
      filter turns that check red on its own — `595 checks · 594 passed · 1 failed`, nothing else moved.
- [x] A second student's cells do not move the subject's grade, and dropping the `studentId` lookup in
      `scoreCell()` turns that check red — **together with four of WO-3.5's grid checks**, which reach
      the same lookup through the screen and fail on the same corrupted value. `595 checks · 590
      passed · 5 failed`; nothing outside the per-student score path moved.
      **Wording amended 2026-08-11** from "turns that check red *on its own*", by the owner, after
      re-running the mutation at the desk rather than on the report. The original asked for something
      the defect cannot produce: an engine that ignores `studentId` corrupts every cell in *any*
      document holding two or more students, and WO-3.5's 25-student grid is such a document, so no
      faithful narrowing of the mutation spares those four. What the desk run showed is that the four
      extras are one defect observed downstream rather than a coupled fixture — all four report the
      same wrong number (case 1's row at `77.50%` where it should read `87.00%`), and the check that
      exists to catch the screen and the engine disagreeing fails with **both halves agreeing**
      (`screen 77.50% C :: engine 77.5 C`), which is a single corrupted value propagating, not
      independent breakage. Nothing outside the per-student score path reddened, which is what the
      Traps line is actually guarding against. See `tools/README.md`'s WO-3.12 paragraph and
      `TESTING.md` § WO-3.12 for the full account.
- [x] The new cases are written into `docs/grade-math-cases.md` with hand-computed expected values.
- [x] `node tools/verify-shell.mjs` passes whole at **595 checks · 595 passed · 0 failed · 0 skipped**,
      and `node tools/wo-sweep.mjs` shows the same standing line as before this work order —
      **16 checks · 15 passed · 0 failed · 1 to review** — after `tools/README.md:636`'s call-site
      count was moved from 592 to 596 in step with the four checks added.
- [x] `src/` is byte-identical to HEAD across the whole work order — `git diff --stat src/` empty,
      confirmed after every mutation's revert and again at the end.

**Traps** — **A mutation that reddens every check has proved nothing.** The point of each proof is
that one check moves and the others do not; that is what separates a check that measures its own
subject from a fixture so coupled that any damage anywhere shows up everywhere. And **do not rewrite
the existing twelve cases to be multi-class.** They are the hand-computed record that WO-3.4 was
verified against, they are readable by a teacher with a calculator, and their simplicity is a feature.
Add cases; do not complicate the ones that exist.

---

## WO-3.13 — paste a column of scores

**Ship** — · **Status** 🚫 STRUCK — 2026-08-15 · **Size** S · **Depends on** WO-3.5 · **Blocks** nothing
**Closes roadmap** *(no box. The roadmap's Phase 3 list names the score grid and the `late`/`missing`
rule; pasting is a way into the grid, not a thing the grid must do. It closes what WO-3.5 closes or
nothing, and it closes nothing.)*

**STRUCK on 2026-08-15, by the owner, on the question this work order asks of itself below: scores
arrive on paper.** They are read off a stack one at a time and keyed in, so there is no column
anywhere to copy from and the clipboard has nothing to carry. The work order asked to be answered
before it was dispatched and said that if the answer was paper the honest move was to strike it
rather than build it and find out; this is that, taken at its word.

*(**The status line says so as of 2026-08-16**, WO-1.21. For a day this sat in `⬜ NOT STARTED`,
which was the one status actively false about it, and the cost was arithmetic rather than a stall:
Phase 3 counted twenty-four work orders it could only ever finish twenty-three of. `🚫 STRUCK` takes
it out of that denominator, and `wo-gate.mjs WO-3.13` now refuses it outright where it used to clear
the gate. It was already off `next`, pulled from the running order the day it was struck — the status
is the half that was missing. It closes no roadmap box, so there is no box to mark.)*

**It is struck rather than deferred, and that is a different thing from WO-2.7.** A deferral is about
*when* and keeps its place in the queue. This is about *whether*: nothing about the classroom that
would make pasting worth an S is expected to change, and if it does — an auto-graded quiz platform,
a spreadsheet the owner starts keeping — the answer changes with it and this work order is still
written and still correct. **It is kept, not deleted**, because the Deliverables carry a risk
analysis that any future paste feature has to answer: a pasted column is positional, value 7 lands
on student 7, and a count mismatch has to refuse rather than truncate. That reasoning is worth more
than the row it occupied.

**Removed from the running order and from WO-3.20's dependency line the same day.** The second is
the one that mattered: WO-3.20 gated on this, and `wo-gate.mjs` passes a dependency only when it is
`✅ DONE`, so a struck work order left on that line would have held WO-3.20 shut for good and said
nothing about why. WO-2.7's note names the principle and it applies unchanged — *a gate that waits
on work nobody intends to do is a gate that gets waived, and a waived gate teaches the next one that
gates are advisory.* Its own **Blocks nothing** was wrong when this was written, which is how the
dependency survived being read twice.

**Split out of WO-3.5 on 2026-08-10**, where it was one deliverable line. It is not on WO-G2's
dependency list and it is deliberately not being added: a teacher who cannot paste can still type,
and gating first grades on a convenience is how a ship slips for something nobody needed in week one.

**Why it exists.** Twenty-five scores typed down a column is twenty-five keystroke-groups — WO-3.5's
first acceptance line. When the scores already exist somewhere in a column, retyping them is the
teacher doing by hand what the clipboard was invented for, and it is the same re-keying tax the SIS
already charges her once.

**The question that decides whether this is worth building, which only the owner can answer.** The SIS
has no export, so nothing arrives from there. This is worth an S only if scores routinely arrive in a
pasteable column — an auto-graded quiz, a spreadsheet she already keeps — and worth nothing if the
usual case is a stack of paper being read one at a time. **Answer that before dispatching this**, and
if the answer is paper, the honest move is to strike this work order rather than build it and find
out. Nothing else waits on it.

**The risk this work order exists to contain.** A pasted column is **positional**: value 7 lands on
student 7. Every way that goes wrong puts a real score on the wrong child's record, and it goes wrong
quietly — one student dropped from the source list, a header row included, a trailing blank line. That
is worse than a typo, because a typo is visible to the person who made it and this is not. The preview
is not a nicety here; it is the whole work order.

**Deliverables**
- **One assignment column at a time**, into a column the teacher has already chosen in the grid. Not a
  rectangle across assignments, and not a file — see Out of scope.
- **A preview that pairs every incoming value with the student name it will land on**, in the grid's
  own roster order, and **writes nothing until it is committed**. This is WO-1.7's paste box, which
  established the pattern for the roster and is the component to lift rather than re-derive.
- **A count mismatch refuses.** More values than students or fewer, the paste is rejected with both
  numbers named, and nothing is written. **Never truncated to fit and never padded** — a silent
  truncation is the failure mode described above, wearing the clothes of a successful paste.
- **The flag vocabulary is the grid's own**, whatever WO-3.5 shipped, and it is shown in the preview
  as the flag rather than as the raw token. **A blank line leaves the cell ungraded** and does not
  mark it `missing` — blank means ungraded and affects nothing, and `missing` is marked by the
  teacher, never inferred.
- **Committed values go through the same writer a typed score does.** One writer, one set of rules, the
  way every mark on the attendance grid goes through `setMark()`.

**Out of scope** — matching by a pasted name column, importing a file, and pasting across more than
one assignment. Name-matching is the obvious next thing and it is a different work order with a
different risk profile; **positional plus a refusal is what makes positional safe**, and that is what
this one is.

**Acceptance**
- [ ] Pasting a column shows a preview pairing each value with the student name it will land on, and
      the document is unchanged until commit — proved by reading the stored document, not the screen.
- [ ] A paste with the wrong number of values refuses, names both counts, and writes nothing. Run at
      one too many and one too few.
- [ ] A blank in the paste leaves that cell ungraded rather than `missing`, and the preview says which
      it is.
- [ ] A pasted score and a typed score are indistinguishable in the stored document, and breaking the
      writer turns both paths red — run, not reasoned.
- [ ] Grades recompute after a committed paste and match WO-3.4's hand-computed values.
- [ ] The paste box is usable on an iPad with the on-screen keyboard up, and the preview scrolls to its
      last row and its commit button. 👤
- [ ] `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` shows no new line.

**Traps** — **Do not write on paste and offer an undo instead.** An undo that has to be found is not
the same safety as a commit that has to be given, and the roster importer already settled this for
this codebase. **Do not silently coerce a non-numeric token to zero** — a zero is a score a teacher
chose to give, and inventing one is the same class of harm as scoring a blank. Refuse the token, name
it, and let her fix the source. **And do not reach for the roster importer's field-mapping UI**: that
screen exists because a roster paste has columns whose meaning is ambiguous. A score column has one
meaning, and the mapping step would be ceremony over the top of it.

## WO-3.14 — percentages to two decimal places

**Ship** 2 · **Status** ✅ DONE — 2026-08-11 · **Size** S · **Depends on** WO-3.5 · **Blocks** nothing
**Closes roadmap** *(no box.)*

**Booked 2026-08-10 from WO-3.5's SIS re-keying box**, the first time a human read this app's
percentages beside the school's. They do not match in precision: **the SIS carries two decimal places
and this screen shows one.** Nothing is wrong on either side — WO-3.5 never specified a precision, and
`src/scores.js:256` picked `toFixed(1)` reasonably — but the mismatch lands on the teacher as a
rounding step done in her head at every row of a class of twenty-five, while re-keying, which is
exactly where a transcription error costs a student a grade.

**Why it exists.** The re-keying tax is the one this app cannot remove (the SIS has no import), so the
one thing it can do is make the number on this screen the number that goes in the box. A percentage
the teacher has to convert is worse than no percentage at all, because converting is silent and looks
like reading.

**Deliverables**
- **`formatPercent()` at `src/scores.js:256` carries two decimals.** One function, so the grade
  column, the class average and the summary all move together or none of them do.
- **Every other surface that shows a percentage is found and ruled on explicitly** — the per-student
  detail, the class average, anything WO-3.7 has since added. Either it moves to two decimals or the
  work order says in a sentence why that surface differs. **A grid at two decimals beside a summary at
  one is worse than the mismatch this is fixing.**
- **The attendance percentage is out of scope and stays as it is.** It is not re-keyed into anything.

**Out of scope** — a configurable precision. It is one teacher, one SIS, and a preference here is a
setting to maintain forever in exchange for a decision that can be made once.

**Acceptance**
- [x] `docs/grade-math-cases.md` case 1 reads `87.00%` on the grid, not `87.0%`, and the letter beside
      it is unchanged.
- [x] A grade that is not exact — case 1's 86.7272… after the category move — reads to two decimals and
      is **rounded, not truncated** (`86.73`, where truncating gives `86.72`). **This line said 86.666…
      until 2026-08-11**, a number back-inferred from the old one-decimal display and never checked
      against the engine; the brief propagated it and the first implementation round asserted `86.67%`
      because of it. The arithmetic is 90 × 30/50 + 81.81…% × 20/50 = 86.7272…%.
- [x] The class average, the grade column and the per-student detail agree to the same precision,
      asserted together in one check rather than three.
- [x] 👤 One row re-keyed into the real SIS with no mental arithmetic between screen and box.
      *(Owner, 2026-08-11.)*

## WO-3.15 — a way to add an assignment from the score grid

**Ship** 2 · **Status** ✅ DONE — 2026-08-14 · **Size** S · **Depends on** WO-3.5 · **Blocks** nothing
**Closes roadmap** *(no box.)*

**Booked 2026-08-10 from the owner's first sitting with the grid.** The grid is where a teacher stands
when she discovers she needs a column that does not exist yet — the quiz she just gave. Today that is
*Scores → Assignments → New → back to Scores*, four navigations to reach a button that could be here.

**Why it exists.** It is the same argument the *Scores* segment itself won: the screen a teacher is
standing on should be able to do the thing she is standing there to do. Nothing about it is new
behaviour — `data-assignment-new` at `index.html:764` already creates an assignment in the open class
and term and opens the editor on it, and `src/shell.js:879` already routes it. **This is a button, not
a feature**, and the work order is small because the machinery it needs is built.

**Deliverables**
- **The existing `data-assignment-new` hook, worn on the score grid**, in `#scoresActions` beside the
  keys toggle. The same hook and the same handler — a second creator here would be a second set of
  rules for what a new assignment is.
- **The grid repaints with the new column in it** when the editor commits, through the chain WO-3.5's
  correction round built (`afterAssignmentChange()`), and the caret lands somewhere sensible rather
  than nowhere.
- **The button reads as the same button** it is on the assignment list — lift the markup and the
  class, do not re-derive a variant.

**Out of scope** — creating an assignment inline in the grid header without the editor. The editor is
where points, category and dates are set, and a column created without them is a column that has to be
visited anyway.

**Acceptance**
- [x] Tapping it on the grid opens the same editor the assignment list opens, on a new assignment in
      the open class and term.
- [x] Committing it adds the column to the grid **without a manual repaint or a screen change**, and
      the grade column is still correct beside it.
- [x] Cancelling it leaves no assignment behind and no empty column on the grid.
- [x] It measures ≥44px under the coarse pointer, inside the section that opens the view first —
      `tools/verify-shell.mjs`'s WO-3.5 block, which exists because the standing sweep cannot see this
      screen.
- [x] 👤 Reachable under a thumb on the iPad without covering the first score cell. *(Owner, on the
      iPad, 2026-08-14.)*

## WO-3.16 — left and right arrows move across the grid

**Ship** 2 · **Status** ✅ DONE — 2026-08-15 · **Size** S · **Depends on** WO-3.5 · **Blocks** nothing
**Closes roadmap** *(no box.)*

**Booked 2026-08-10 from the owner's first sitting with the grid.** `ArrowDown` and `ArrowUp` move
between students in a column (`src/scores.js:926-927`). `ArrowLeft` and `ArrowRight` do nothing, so
moving one assignment sideways is a reach for the pointer in the middle of a keyboard task.

**Why it exists.** WO-3.5's first acceptance line is twenty-five scores in twenty-five keystroke-groups
with no mouse, and it is satisfied **down** a column. A teacher entering one assignment for a class
does exactly that; a teacher fixing a handful of cells across a row is back on the trackpad. The grid
is two-dimensional and half its axes answer the keyboard.

**Deliverables**
- **`ArrowLeft` and `ArrowRight` move one assignment column, same student**, through the same
  clamp-rather-than-wrap rule the vertical pair uses, with the same live-region sentence at the edge —
  *"that is the last assignment"* — because a key that does nothing and says nothing reads as a key
  that was not received. That symmetry is the deliverable; a different edge behaviour on the horizontal
  axis is a bug that will read as a preference.
- **The caret and selection behave as they do vertically**: the value in the arrived-at cell is
  selected for overtyping.
- **A cell mid-edit is not stranded.** Whatever `ArrowDown` does with a partly typed value, these do the
  same thing, decided once in `handleScoreKey()` rather than twice.

**The trap.** `ArrowLeft` and `ArrowRight` are **also how a caret moves inside a number the teacher is
correcting.** Stealing them unconditionally makes it impossible to fix the middle digit of `100` without
the pointer — a worse tax than the one this is removing. Decide the rule deliberately and write it
down: the strong candidate is that the key moves cells only when the caret is already at the end of the
value it is leaving (or the field is empty or fully selected), and edits the text otherwise. **The
horizontal axis is not symmetric with the vertical one here, because up and down mean nothing to a
caret in a one-line field and left and right mean everything.**

**Out of scope** — Tab as a horizontal move. Tab is the browser's, and WO-3.5 chose `<main>` over a
dialog partly so that Tab still reaches the rest of the screen.

**Acceptance**
- [x] `ArrowRight` from a full cell moves one assignment right, same student, value selected.
- [x] `ArrowLeft` at the first assignment clamps, says so once, and moves nothing.
- [x] **With the caret mid-value, `ArrowLeft` moves the caret and not the cell** — driven with a real
      keystroke at a partly corrected number, not reasoned about.
- [x] The vertical pair still behaves exactly as WO-3.5 shipped it; its checks stay green unchanged.
- [x] Twenty-five scores down a column is still twenty-five keystroke-groups and no mouse.

## WO-3.17 — the Assigned and Due fields

**Ship** 2 · **Status** ✅ DONE — 2026-08-10 · **Size** S · **Depends on** WO-3.3 · **Blocks** nothing
**Closes roadmap** *(no box.)*

**Booked 2026-08-10 from the owner's iPad sitting.** Two separate complaints about the same pair of
controls in the assignment editor, kept in one work order because they are one dialog, one file and one
testing sitting on the hardware.

**Part one — they overlap and push off screen on the iPad.** Owner-observed on the device; not
reproduced at the desk, which is the point. `.assign-field` already carries `min-width: 0` and
`flex: 1 1 140px` (`src/assignments.css:216-218`), so the usual flex culprit is pre-empted and the
likelier mechanism is **iOS Safari giving `<input type="date">` an intrinsic width it refuses to shrink
below**, inside a 480px `.modal-panel`, with the coarse block's `min-height: 44px` and larger font
making it worse rather than better. **Diagnose it on the hardware before changing a number** — a width
tuned until it looks right at the desk is how this comes back.

**Diagnosed on the hardware, 2026-08-10, and the guess above is right in outline and wrong where it
matters.** Owner's screenshots in both orientations with the fields empty, plus a comparison pass over
the app's two other date-field screens.

- **Not an orientation bug.** `.modal-panel` is 480px in both orientations (`index.html:988`), and
  portrait and landscape fail identically.
- **Three symptoms, one cause.** The fields are about half the height of *Name* and *Points* despite
  sharing their rule at `src/assignments.css:269`; they overlap instead of sitting in the row's 12px
  coarse gap; and *Due* is clipped by the panel edge. **iOS Safari paints `<input type="date">` as a
  native control**: the flex layout shrinks the element's *box* — so `min-width: 0` is working — while
  the native widget paints at its own intrinsic size regardless. Layout and paint disagree, and every
  symptom falls out of that one fact, including the ignored `min-height`.
- **`-webkit-appearance: none` does not exist anywhere in this codebase.** Grepped `src/` for it, for
  `appearance:`, and for any `input[type=…]` selector: zero matches for all three. Nothing has ever
  told WebKit to stop drawing these natively.
- **Why this screen and not the other two, confirmed rather than assumed.** The term editor and the
  days-off form both wear `.term-date` (`src/shell.css:684`), which sets **no width**, in a
  `flex-wrap: wrap` row of content-sized items — the widget's intrinsic width *is* its layout width,
  so nothing is forced and nothing overlaps. `.assign-field-date` is **the only date input in the app
  given `width: 100%`** (`src/assignments.css:222`), inside `flex: 1 1 140px; min-width: 0`. A 140px
  basis in a 480px panel shrinks the pair to roughly 210px each and never triggers the wrap, so this
  is the one place the box is forced narrower than the widget draws.

**So the first thing to try is the reset, not a width.** `-webkit-appearance: none; appearance: none`
on `.assign-field-date`, then re-open on the device. Predicted: the 44px lands, the gap appears, the
clipping goes, and no number is tuned. If that is not it, the fallback is a larger flex-basis so the
row wraps to two lines the way `.term-dates` does — but that is the second answer and it is the one
the paragraph above warns about.

**The squatness is not this work order's.** The owner reports the date fields on *Classes & terms* and
on *Days off & drops* are equally short — both carry `min-height: 44px` in their own coarse blocks
(`src/shell.css:1208`) and neither takes it. That is an app-wide touch-target failure on three
shipped screens, it is one shared fix rather than one dialog's, and it is booked separately. **What
belongs here is the overlap**, which is this dialog's alone.

**A testing-order trap this work order creates for itself.** Part two makes both dates default to
today, so once it lands a newly created assignment never shows the empty state the owner photographed.
**Prove part one against empty fields**, independently of part two, or the fix will look done because
the symptom moved out of the default path and into the one a teacher reaches by clearing a date.

**Part two — both dates should offer today.** Today is the overwhelmingly common value for *Assigned*
and a reasonable start for *Due*, and typing it on an iPad picker costs more than it should.

**The rule this part contradicts, which the owner has overruled.** `index.html:806` tells the teacher in
bold that **"Neither date fills itself in,"** and gives a reason: Planbook has no timetable and is not
getting one, so there is no "next meeting" to guess at. That reason survives — **this is not a guess at
a schedule, it is today's date, which is a fact.** But the sentence is now false and it is load-bearing
prose in the hint the teacher reads. **Update it in the same commit**; a UI that contradicts its own
printed promise is worse than either behaviour alone. Say what the app does now and keep the timetable
half, which is still true and still worth saying.

**Deliverables**
- The two fields sized so that **both are fully visible and neither overlaps the other or the panel
  edge** on the iPad in both orientations, with the fix made against the real mechanism.
- Both dates **default to today on a newly created assignment**, editable to anything, and **empty stays
  a legal value** — a date is not required and clearing one must not re-fill it.
- **An assignment being edited is never touched.** The default is a creation-time default; opening an
  existing assignment with a blank *Due* leaves it blank.
- The hint at `index.html:806` rewritten to match, keeping its no-timetable reasoning.

**Out of scope** — a due-date suggestion of any kind beyond today. That is WO-3.6's territory and it is
the thing the no-timetable rule actually forbids.

**Acceptance**
- [x] A newly created assignment opens with both dates on today's date, formatted as the field expects.
- [x] Clearing either date and committing stores it empty, and reopening shows it empty.
- [x] Editing an existing assignment with a blank date shows blank, not today.
- [x] The hint text no longer says the dates do not fill themselves in, and still says why there is no
      next-meeting guess.
- [x] Both fields measure ≥44px under the coarse pointer and neither exceeds the panel width at the
      narrowest supported width.
- [x] 👤 On the iPad, portrait and landscape: both fields fully visible, no overlap, nothing off screen.
      **Confirmed on the hardware by the owner, 2026-08-10**, in both orientations and with both dates
      cleared — the state the original screenshots were taken in. The native date picker still opens
      and commits under `appearance: none`, which was the one thing the reset could have taken with it.

## WO-3.18 — verification submitted 🔒

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-3.10, WO-8.7, WO-7.1, WO-7.2,
WO-8.12, WO-8.15, WO-7.4 — the client to verify, the domain to verify it at, the sign-in the demo
video has to film, **the file transfer it has to film being used**, the policy whose URL goes in the
form, **the homepage whose URL goes beside it**, and **that sign-in reachable on the domain the form
names** ·
**Blocks** a stranger seeing a clean consent screen
**Closes roadmap** *(no box. Phase 7's **Verification complete.** is WO-7.3's, and a box is closed by
one work order, never two.)*

*(**WO-7.4 became the seventh dependency on 2026-09-25, the same day, owner-directed.** The
deployed app drew no Drive section, so a reviewer following the form's own Homepage and privacy URLs
would find a permission requested and never used. The video runbook had named turning the flag on
ahead of approval as one of three ways out and assumed the middle one; the owner chose this one, and
WO-7.3's flag deliverable moved to [WO-7.4](phase-7-sync.md#wo-74--the-deployed-app-has-no-sign-in-for-googles-reviewer-to-find) to do it.)*

*(**WO-8.15 became the sixth dependency on 2026-09-25**, from a fresh-eyes read of this work order and
its runbooks before a weekend submission. Both runbooks put `https://planbook.hwgteach.com/` in the
form's Homepage field, and that URL is the app — which, opened cold by a reviewer, says **"No classes
yet."**, describes nothing, and keeps its privacy link inside a modal. Google's branding review reads
the homepage for exactly those two things. **So the gate report goes red until `/about` is deployed
and WO-8.15 is ticked**, and that is the dependency doing its job rather than a new blocker: the
page is built, and what it waits for is a push and a reading. The seventh ordering constraint on
this work order to be found somewhere other than this field, and the first found by asking what the
reviewer would *see* rather than what the form would *accept*.)*

*(**`**Ship** —` until 2026-08-19, WO-1.24.** It has had a row in
[`README.md`](README.md) § Ship 2 since 2026-08-11 and
[WO-G2](gates.md#wo-g2--ship-2-gate-first-grades)'s eighth box cannot be ticked until it is submitted
— so the field disagreed with both the table carrying it and the gate testing it. **That is the same
rot § Ship 2 names from 2026-08-09**, when thirty-three work orders read `—` for "nobody has said"
rather than "in no ship," and it survived in the one work order the correcting sitting created. Being
on a gate's checklist is being in that ship. **The `—` here was never the WO-3.10 argument**: that one
came off WO-G2's `Depends on` because a queue nobody controls must not block a grade-arithmetic gate,
which is about where a **dependency** may sit, not about which ship the paperwork belongs to.)*
*(**WO-G2's eighth box no longer exists, as of 2026-09-29.** The owner moved it to
[WO-7.3](phase-7-sync.md#wo-73--verification-complete) while working WO-G2, so no gate's checkbox
points here any more, and WO-G2 dropped its `**Owes**` field. The submission is still owed, and WO-7.3
is what holds it: that work order depends on this one and cannot close without it. This work order's
own third Acceptance line is unchanged.)*

*(**`**Ship** 2` and two dependencies until 2026-08-20**, owner-directed. The third deliverable below is
**a demo video showing the scope in use**, and **nothing in the app uses the scope**: `accounts.google`,
`drive.file`, `gapi` and `oauth` return **zero hits** across `src/` and `index.html`, because the token
flow is [WO-7.1](phase-7-sync.md#wo-71--auth) and WO-7.1 has not been built. The header named the client
and the domain and never named the thing that **exercises** them — so both gates read clear on a work
order that could not produce its own second deliverable. **This is the fifth time a real ordering
constraint has turned up somewhere other than `Depends on`** — [README.md](README.md) § Ship 3 counted
four — and the first where the missing one ran **backwards**, into the phase this work order is the stated
gate for. See WO-7.1's own note for the deadlock that made it circular. Filming a stub was considered and
refused: a scope demo that does not show real usage is rejected on review, and it is exactly the class of
claim this repository's verification culture exists to stop.)*

*(**And that is why the ship changed rather than the schedule.** `**Ship** 2` is first grades and
contains no sync — [WO-G2](gates.md#wo-g2--ship-2-gate-first-grades)'s own 2026-08-10 correction, written
when WO-3.10 came off its dependency line for precisely this reason: **a grade-arithmetic gate must not
slip on a queue nobody here controls, for a feature it does not ship.** Keeping the row would have put an
M of token flow inside Ship 2 to protect one checkbox. So WO-G2's eighth box took **the escape hatch that
box has named since the day it was written** — *"move this line to a later gate deliberately"* — and now
points at the third Acceptance line below, which is the same promise in the work order that owns it.
**What still gates it is [WO-7.3](phase-7-sync.md#wo-73--verification-complete)**, which has depended on
this work order since Phase 7 was cut. The `~Sep 15` submit-by went with the row; what replaces it is
WO-7.1's build date, and **Phase 7 has no date yet** — that is the honest cost of this move, and it is
paid in Phase 7 rather than in Ship 2.)*

*(**`⬜ NOT STARTED` until 2026-08-28, and the status is what `next` reads.** With the dependency
above added, a gate report on this work order correctly answers* `FAIL | dependency WO-7.2 is ⬜ NOT
STARTED` *— but* `next` *stops at the first* `⬜` *in document order and only then prints the
verdict, so it parked here and* **hid every buildable row behind it**. *That is
[WO-G2](gates.md#wo-g2--ship-2-gate-first-grades)'s 2026-08-20 problem exactly, and this is its
remedy: the vocabulary already had the word, and* `🔒` *is the one that makes `next` walk on. **Put
it back to** `⬜` **when WO-7.2 lands** — `--tick` refuses this status, so the paperwork cannot be
closed while wearing it, and the gate it is named for cannot be quietly skipped.)*

*(**WO-7.2 became the fifth dependency on 2026-08-28, and it is the same discovery as the block
above, one work order further on.** That note was written when the second deliverable — a demo video
**showing the scope in use** — had no sign-in to film, and it added WO-7.1. WO-7.1 shipped
2026-08-24 and* **the deliverable is still unfilmable**, *because a sign-in is not a use: Google's
demo-video requirement is to show* **how each sensitive scope's granted data is actually used
functionally**, *and the only thing that uses the data is* [WO-7.2](phase-7-sync.md#wo-72--document-transfer--conflicts).
`files.create` *greps to zero across* `src/`*,* `src/auth.js` *exports no writer, and the Drive panel
says so on screen in as many words —* **"Nothing is uploaded yet."** *So the 2026-08-20 refusal to
film a stub was never discharged; it was moved. **This is the sixth time a real ordering constraint
has turned up somewhere other than `Depends on`**, and the second time on this work order — which is
the argument for reading the count rather than the field. Two smaller things a shoot should know
before it books a room:* `hostAllowsSignIn()` *still answers false for the deployed host, so the flow
can only be filmed at* `https://localhost:8443` *until WO-7.3 widens it* ***(discharged 2026-09-25:
WO-7.4 widened it instead, so the flow films at the real domain once that deploy is live)*** *— and the GIS* **popup**
*shows a truncated origin bar, so the* `client_id` *Google asks to see in the address bar cannot
appear there and has to be filmed off the console instead. Both are written up, with a shot list, in*
[`plans/runbooks/wo-3-18-video-runbook.html`](../runbooks/wo-3-18-video-runbook.html)*.)*

*(**`🔒 GATED` until 2026-09-12, and what took the lock off is the lock's own sentence coming true.**
[WO-7.2](phase-7-sync.md#wo-72--document-transfer--conflicts) *landed* **✅ 2026-09-07**: `src/drive-sync.js`
*carries the year document both ways against* `https://www.googleapis.com/upload/drive/v3/files`*, so
the scope is **in use** and there is a file transfer to film. The first of the two notes above says in
as many words* **"Put it back to `⬜` when WO-7.2 lands"** *— and for five days nobody did, because
nothing reads a sentence in a body:* `next` *reads a status,* `--audit` *had never once asked a gated
work order what it was waiting for, and* **a lock is the one status that guarantees no gate report is
ever run on it.** *This is the shape
[WO-1.31](phase-1-shell-store-roster.md#wo-131--a--gated-work-order-that-never-says-what-it-is-gated-on)
was booked as a* plant *against, turning up live in the fortnight between its booking and its build —
not WO-7.2's unstated gate but the other half of the same failure:* **a gate stated, discharged, and
outliving the condition anyway.** *It was found by that work order's own check, on the first run of
it, and the lock came off in the same sitting.* **Nothing else here changed.** *This is still work
nobody should fold into a teaching week — the errand is a shoot, a console trip and a form — and*
[`README.md`](README.md) *§ After Ship 3 row 9 is where that argument belongs, not the status field.
`🔒` is one hand edit away if the owner wants it back, and it would carry its gate on the status line
this time.)*

*(**Ratified by the owner 2026-09-12**, *and that is the half worth writing down.* The unlock was made
by WO-1.31's implementer, and **a status change on a fourth work order was not in that brief** — the
verifier refused it as out of scope and was right to. *What makes it stand is not that it was harmless
but that after WO-1.31* **the reversal is the option that cannot be written honestly**: `🔒` *now has
to name what it waits for, the only true answer was WO-7.2, and WO-7.2 is done. The nearest
alternative —* `🔒 GATED — an owner's shoot-and-submit sitting, not a build` *— is scheduling advice
wearing a gate's glyph, which is the abuse this work order exists to make visible.* **The fence that
survives is [`README.md`](README.md) § After Ship 3 row 9**, *not the status field. One residual cost,
named rather than repaired:* `⬜` *means* `--start WO-3.18` *will claim it if a person types the ID —*
`next` *never offers it, so this takes a deliberate act — and* 🎒 *is not the repair, because a
ride-along says* an hour to fold into a sitting that already has that file open *and row 9 says the
opposite.)*

**Split out of WO-3.10 on 2026-08-10**, which is where the full reasoning sits. This is the half that
**cannot start until there is a domain**, and it is booked separately so that the half which can start
is not held behind it. *(**Read that sentence with the note above.** A domain is no longer the only thing
it cannot start without, and the 2026-08-10 split could not have known so: WO-7.1 did not yet have a
work order to depend on.)*

**Why it exists.** `drive.file` is a *sensitive* scope, so the client needs Google's review before a
teacher who is not the owner ever signs in. Until it clears, the consent screen wears **"Google hasn't
verified this app"** — the exact screen this project's whole architecture exists to avoid. `CLAUDE.md`
rejects the Apps Script design specifically because that warning "can never be cleared" there; shipping
an unverified client to other teachers would reproduce the failure by another route.

**It is calendar-bound rather than work-bound**, which is the entire reason it is scheduled early
rather than sized large. Days to weeks in someone else's queue, and no amount of effort compresses it.
*(Roll Call! sat at 0.9.0-beta with every engineering blocker closed, held up by exactly this class of
task.)*

**Deliverables**
- **A published privacy policy at the verified domain**, stating plainly: no vendor server ever
  receives student data, no account is required, and Drive holds only files this app created.
- **A demo video** showing the scope in use.
- **The domain verified** in the Cloud console against the host WO-8.7 settles.
- **Submission**, with the date and reference recorded in this work order.
- **Publishing status moved off Testing** once it clears.
- **The consent screen's App name set to *Planbook*.** On 2026-09-27, during WO-7.14's laptop
  reading, Google's own screen for removing third-party access named the app **wjt-planbook**, the
  Cloud project's name. The App name is set in the Cloud console, not in this repository. A reviewer
  compares it with the name on the home page and the privacy policy, and a teacher who sees an
  unfamiliar name on the consent screen has a reason to stop.

**The overlap worth planning for.** The privacy policy and `docs/FERPA.md` (WO-8.5) say overlapping
things to different readers — one is a legal artifact at a URL Google will read, the other is the
document a principal or district IT reads. **Write them together or write them twice.** WO-8.5 is
scheduled in Phase 8 and this is not, so whoever reaches this first should expect to draft both.

*(**That paragraph got its own work order on 2026-08-20:**
[WO-8.12](phase-8-packaging.md#wo-812--the-privacy-policy-and-the-ferpa-document), owner-directed, which
carries both documents and took the FERPA half out of WO-8.5 to do it. **"Whoever reaches this first"
was the weak point** — it names no one, and the two documents were sitting in work orders on opposite
sides of the board with nothing making them one sitting. The first deliverable below and the first
Acceptance line are WO-8.12's now; **this work order stops owning any prose and goes back to being what
its title says — a submission.** The paragraph is left standing because the argument in it is the reason
WO-8.12 exists.)*

**Acceptance**
- [x] The privacy policy is live at the verified domain and says the three things above in plain words.
      *(**Paid by [WO-8.12](phase-8-packaging.md#wo-812--the-privacy-policy-and-the-ferpa-document) on
      2026-08-21**, which is what the `→` marker on this line and the **Owes** field on the header
      above were for; both are gone now, the way `--audit` says to discharge one. `verify-deploy.mjs`
      reads all three claims off `https://planbook.hwgteach.com/privacy` over the wire —
      `16 checks · 16 passed · 0 failed`. **The URL to paste into the form is `/privacy`**, and the
      contact on it is a dedicated mailbox rather than the account this project runs on.)*
- [ ] The consent screen shows exactly one scope **and no "Google hasn't verified this app" warning**,
      checked on an account that is not a test user — which is the only account that can tell.
- [ ] The submission date is written into this work order. *(Fill it in when submitted, so the wait is
      measurable rather than remembered.)*
- [ ] 👤 A teacher who is not the owner completes sign-in and sees nothing that frightens them.

---

## WO-3.19 — the overdue tint on a score-grid column head

**Ship** 2 · **Status** ✅ DONE · **Size** XS · **Depends on** WO-3.6 · **Blocks** nothing
**Closes roadmap** *(no box. The roadmap's Phase 3 past-due line is WO-3.6's and is ticked; this is
the half of the drawing that work order deliberately did not ship.)*

**Booked 2026-08-13, out of WO-3.6's close.** Two things are true at once and one of them has to give.
`design/mockups/proposed.css` draws `.scores-col-due.overdue { color: #8a6d1a; }`, and **nine comment
sites across five files name WO-3.6 as the owner of every rule about a past due date on the score
grid** — `src/scores.css:41` and `:301`, `src/scores.css:450`, `src/assignments.css:203`,
`src/assignments.js:353`, `src/scores.js:49`, `design/mockups/proposed.css:298` among them. WO-3.6
closed ✅ DONE on 2026-08-13 without the tint, on the correct call that it was not in its Deliverables.

**Why it exists.** *The promise is the problem, not the pixel.* Those comments now point a reader at a
**closed** work order for work that was never done — the exact drift class `wo-gate.mjs --audit`
exists to catch and the one shape of it the tool cannot see, because comments are not a tracker.
Three score-grid work orders sit below this one in the queue (WO-3.13, WO-3.15, WO-3.16); every one of
them opens `src/scores.css` and `src/scores.js` and reads those comments on the way in. This is booked
ahead of them so they read a true one.

The tint also earns its place on its own: the banner says *"6 blanks are past due"* and cannot say
**which columns** without the teacher opening the review. A tinted column head says it at a glance,
writes nothing, and is already the idiom on the assignment list one screen over.

**Deliverables**
- **The tint on the score-grid column head** — `.scores-col-due.overdue`, in `#8a6d1a`, lifted from
  `design/mockups/proposed.css` rather than re-derived, and matching the assignment list's own overdue
  colour exactly. Same date test as the prompt: `due` is a real date **strictly before today**.
- **The nine comment sites are repointed or rewritten**, and this is not optional garnish — it is the
  reason the work order exists. A comment that said "WO-3.6 owns this" says what is true after this
  lands. `src/scores.css:299-303` in particular claims the rule is absent *and why*, and that
  paragraph is now the wrong shape.
- **One reader of the clock, not two.** The tint asks the same question the prompt asks. If that means
  exporting a predicate from `src/past-due.js` rather than writing `due < today` a second time in
  `src/scores.js`, do that — `AGENTS.md` now says in as many words not to add a second reader of the
  date.

**Out of scope** — any change to what the prompt counts, any tint on a *cell*, and the assignment
list's existing tint, which already works and is not being re-derived.

**Acceptance**
- [x] A column whose due date has gone by is tinted; a column due **today**, one due tomorrow, and one
      with no due date are not. The off-by-one is the same one WO-3.6's mutation testing caught.
      *(On WO-3.6's own fixture, which is already the four cases: `["wo36-past","wo36-past2"]` amber
      against `["wo36-past","wo36-past2","wo36-today","wo36-soon"]` printing a date at all — so the
      column due TODAY is present and untinted rather than absent, and the undated one has no date
      line for a class to go on. The comparison is not restated anywhere: the tint reads
      `src/past-due.js`'s set, so WO-3.6's `<=` mutation is still the one test of the off-by-one.)*
- [x] The tint writes nothing: every score cell in the document is byte identical with the tint on
      screen, and no grade moves. It is a colour, not a mark. *(Compared over all of `scores` against
      the read taken when the fixture was planted — through a coarse pass, two reloads, four
      navigations and two `Esc` presses with the tint up — beside a reading that says two heads were
      actually amber, and all five grades still string-identical to the engine asked separately.)*
- [x] The tinted columns are **exactly** the assignments the banner's sentence names, asserted against
      the prompt's own set rather than recomputed in the check. *(The check takes the assignment half
      of the review's own `data-past-due-cell` ids off the screen and compares sets. It is held by
      construction as well as by the check: `columnHead()` asks `pastDueAsksAbout()`, which is a read
      of the same `previewed` the sentence and the review are drawn from.)*
- [x] A column stops being tinted when its blanks are filled or marked, on the same render — because
      the thing it is reporting has stopped being true. *(`["wo36-past","wo36-past2"] -> []` on the
      render after **Mark them missing**, with all four due dates still printed — the tint comes off,
      the head does not empty. Mutation-tested: a build whose tint answers its own `due < today`
      instead of asking the prompt reddens this line and nothing else.)*
- [x] `grep -rn "WO-3.6" src/ design/` returns no comment claiming WO-3.6 owns unbuilt work. *(19
      hits across 8 files, all read. Six rewritten where they had become false, four gained a clause,
      nine left exactly as they were because WO-3.6 really does own the prompt and saying so is true.
      Which is which is in `.claude/dispatch/WO-3.19-result.md`.)*
- [x] 👤 The tint is visible on the iPad in a lit classroom without being mistaken for an error state,
      and is legible against the column head's existing `#a0aab8`. *(Owner, on the teaching iPad,
      2026-08-13. Reads as a nudge and not a fault, legible at the coarse-pointer 10px beside the grey
      heads next to it. The third question the desk could not settle — whether the amber staying up for
      one render after **Not now** is noticeable — was put to the owner in the same sitting and answered
      no. That is the behavioural call the work order left open, and it is now closed in favour of the
      cost `src/shell.js` already refuses to pay: no grid rebuild under a half-typed digit for a tap that
      wrote nothing.)*

---

## WO-3.20 — one date formatter, and a name that means one thing

**Ship** 2 · **Status** ✅ DONE — 2026-08-15 · **Size** S · **Depends on** WO-3.15, WO-3.16
**Blocks** nothing · **Closes roadmap** *(no box. Internal consistency; nothing a teacher sees changes,
which is the acceptance criterion rather than a caveat.)*

*(WO-3.13 was on this line and came off it on 2026-08-15, when it was struck. It was never going to
reach `✅ DONE`, which is the only status the gate accepts, so leaving it here would have held this
work order shut permanently — and quietly, since a gate reports the dependency and not the reason
nobody intends to satisfy it.)*

**Booked 2026-08-13, out of WO-3.6's close**, which added the third byte-identical copy of the same
eight lines and said so at the copy rather than paying it. The count in that result file was low. There
are **five** `function shortDate` in `src/`, in three different formats:

| File | Output | On an empty or bad date |
|---|---|---|
| `src/assignments.js`, `src/scores.js`, `src/past-due.js` | `Sep 4` | `''` |
| `src/days-off.js` | `Thu, Sep 4` | the raw string |
| `src/attendance.js` — **exported** | `9/4` | the raw string |

**Why it exists.** *The duplication is the boring half; the name is the trap.* `src/attendance.js`
**exports** a `shortDate` that formats `9/4`, and `src/attendance-report.js` imports it correctly. Any
future gradebook screen that reaches for a date formatter finds that export first, in good faith, and
renders `9/4` in a column beside one that says `Sep 4` — and nothing in the harness or the sweep would
fail, because both are correct dates. `src/attendance-report.js`'s own header prose already argues this
case for the printed page: *a printout that has left the building and disagrees with the screen* is the
failure. The same argument applies one file over and has not been applied.

The three identical copies are the cheap part. Each carries a comment explaining why it is not an
import; two copies was a defensible convention and five is a formatter waiting to disagree with itself.

**Deliverables**
- **One `Mon D` formatter, exported from one place**, replacing the three identical copies. A leaf
  module with no imports of its own — the suite has no bundler and a cycle here would be paid at load
  time on every screen.
- **A ruling on the other two, in a sentence each.** `days-off.js`'s `Thu, Sep 4` and
  `attendance.js`'s `9/4` are different formats for good reasons and may well stay — but **they may
  not keep the same name**. Either they compose from the shared formatter or they are renamed to say
  what they produce. The deliverable is that no two functions called `shortDate` return different
  strings for the same input.
- **The empty-date behaviour is decided once**, not inherited. Three copies return `''` and two return
  the raw input; one of those is wrong on some screen right now.

**Out of scope** — every other formatter (`plainDate`, `dayAbbr`, `percentText`), the attendance
family's internals, and any change to what any screen displays. **This work order is behaviour-neutral
by construction**; if a date on any screen changes, it has failed.

**Scheduling note.** This sits **after** WO-3.15 and WO-3.16 rather than before them, and the
dependency is real. Both open the score-grid files, and consolidating a set that is still growing
means doing it twice. *(This read "after WO-3.13, WO-3.15 and WO-3.16" and "all three" until
2026-08-15, when WO-3.13 was struck. The set stopped growing that day, which is the one thing the
strike does for this work order.)* It is also deliberately behind WO-1.16 in the running order: a five-file refactor
that changes nothing a teacher sees has no business landing in the week the term opens.

**Acceptance**
- [x] `grep -rn "function shortDate" src/` returns **one** definition of the `Mon D` formatter, and no
      two surviving functions of that name return different strings for the same input. *(One hit:
      `src/date-text.js:84`. The other two formats survive as `weekdayShortDate()` in
      `src/days-off.js` and `numericDate()` in `src/attendance.js` — named for what they produce, so
      no two functions of one name answer differently. `verify-shell.mjs` now asserts both halves,
      including the alias shape `import { numericDate as shortDate }`.)*
- [x] Every date on every screen is character-for-character what it was before this work order —
      asserted on the assignment list, the score grid, the past-due prompt and review, the days-off
      list, the attendance grid and both printed reports. *(Two runs. **The formatters**: the five old
      implementations pulled out of `git show HEAD:src/…` and the three new ones out of the working
      tree, over 1,118 inputs — every day of 2025–2027 plus empty, malformed, `null`, `{}`, `NaN` —
      **no differences, 5 of 5**. **The screens**: a full `verify-shell.mjs` before and after, diffed;
      every rendered date is identical, and three of the six surfaces print theirs into the run's own
      output — `due 9/18`/`10/1`–`10/6` on the printed grade sheet, `due Aug 14` in the past-due
      banner, `Mon, Aug 3 – Fri, Aug 7` in the days-off list. The other three (assignment list, score
      grid, attendance grid and its printed report) print no date into the harness output, so their
      evidence is the equivalence above plus a diff showing their call sites were renamed and nothing
      else. Named that way in the result file rather than blurred.)*
- [x] An empty date, a malformed date and a real date each produce one documented answer, and the
      choice is written down at the definition rather than implied by three call sites. *(`src/date-text.js`
      § "What an unreadable date produces": `''` for empty and for malformed, the caller choosing what
      that looks like on its screen. The two renamed formatters still echo their input, which is now a
      ruling with its reason at the definition — changing it would change a screen, which this work
      order forbids.)*
- [x] `verify-shell.mjs` is green with no check rewritten to accommodate a changed string. **A check
      edited to match new output is this work order failing**, not passing. *(`780 checks · 780 passed
      · 0 failed · 0 skipped`, 247s, against `778 · 778 · 0 · 0` before. No existing check was edited;
      the two added are static and new, and the 778 old result lines are unchanged.)*
- [x] No import cycle: the shared module imports nothing from `src/`. *(`src/date-text.js` holds no
      `import` statement at all — asserted by the harness, and mutation-tested by adding one.)*

---

## WO-3.21 — nothing notices if the accommodation prompt stops counting students

**Ship** 2 · **Status** ✅ DONE — 2026-08-13 · **Size** XS · **Depends on** WO-3.8 · **Blocks** nothing, and
that is deliberate — the dedupe is correct today, so this is a row to cut if the fortnight tightens
**Closes roadmap** *(no box. Harness, not app: nothing here changes what a teacher sees. The same call
WO-3.12 made, and for the same reason.)*

**Not a go-live blocker, and nothing here is a defect.** Booked 2026-08-13, out of WO-3.8's
verification. `src/accommodation-prompt.js` is correct as shipped and all 710 harness checks pass.
**Do not go hunting for a bug; there isn't one.** What is missing is the check that would notice if
the code stopped being correct.

**Why it exists.** `groupsFor()` counts **students, not rows** — `src/accommodation-prompt.js:186`
carries a `seen` Set so that a student holding two `extended-time` rows is one student who needs
extended time. The file's own comment says why that matters: *"4 students have extended time" over a
roster of three is the kind of number that makes a teacher stop believing the prompt.* Measured at
WO-3.8's verification: **delete the `seen` Set and all 710 checks stay green.** No fixture student
carries two rows of the same kind, so an inflated count has nowhere to show up.

This is the WO-3.12 shape again — *a fixture whose values cannot express the failure* — in the one
place where the number a teacher reads is a claim about how many children are in the room. The
neighbouring case is already covered and is not this one: `c_wo38b`'s `wo38-s7` holds two rows, but
of **different** kinds (`breaks` and a blank one a mis-tap wrote), which is what proves `isRealRow()`
rather than the dedupe.

**Deliverables**
- **A fixture student carrying two rows of the same kind, both matching the chosen category.** The
  cheapest is `wo38-s1` Ashdown at `tools/verify-shell.mjs:17570`, whose one `extended-time` row is
  scoped `['tests']`: give it a second scoped `['unit tests']`, which the match rule already fires on.
  Both rows are real, so `isRealRow()` does not mask the case.
- **No new assertion unless the mutation proves one is needed.** WO-3.8's existing check asserts the
  exact sentence *"3 students have extended time, 2 need a separate setting."*, and a build counting
  rows says `4 students`. Confirm by mutation whether that check alone carries it; add one only if it
  does not.
- **The mutation is run, and the proof is written down.** Delete the `seen` Set, run the harness, and
  record the counts before and during in `tools/README.md` the way WO-3.12's and WO-2.24's are.

**Out of scope** — anything in `src/`. The dedupe is verified correct; this work order adds no
behaviour. If a new check goes red against current code, **that is a defect found and it gets its own
work order** — do not fix the app from inside this one.

**Acceptance**
- [x] A fixture student carries two rows of the same kind, both matching the category under test, and
      the prompt still reads **"3 students have extended time, 2 need a separate setting."** — the
      count is unchanged by the second row, which is the whole claim.
- [x] The reveal still lists **five** names, with that student named **once**.
- [x] Deleting the `seen` Set at `src/accommodation-prompt.js:186` turns a check red, with the counts
      before and during quoted — run, not reasoned. **A mutation that reddens nothing means this work
      order did not land**, and a mutation that reddens everything means the fixture is coupled.
- [x] `node tools/verify-shell.mjs` passes whole, with the check count in `tools/README.md` moved in
      step with any check added.
- [x] `git diff --stat src/` is empty across the whole work order, confirmed after the mutation's
      revert and again at the end.

**Traps** — **The second row must match the category, or the fixture proves nothing.** A row scoped
to something `Tests` does not match never reaches the `seen` Set at all, and the check would stay
green with the dedupe deleted — which is this work order failing while appearing to pass.

---

## WO-3.22 — the key legend omits a pair the hint beside it promises

**Ship** 2 · **Status** ✅ DONE — 2026-08-16 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. The roadmap's Phase 3 list names the score grid and the `late`/`missing`
rule; which keys the legend documents is inside what WO-3.5 already closed.)*

**Why it exists.** The ⌨ Keys panel at `index.html:1051` lists `↵`, `⇥`, `← →`, `L`, `M`, `X` and
`⌫`. It does not list `↑ ↓`. The hint two inches below it, at `index.html:1083`, says *"**↑ ↓** move
within the column as well"* — and they do. So the reference card a teacher opens **to learn the
keys** is the one surface in this app that does not mention a working pair, while the prose beside
it does.

**It is WO-3.5's gap and WO-3.16 is why it is visible.** The vertical pair shipped with the grid and
was documented only in the hint. WO-3.16 then added a `← →` row to the legend on 2026-08-15 — one
line above where the missing one belongs — which turned a quiet omission into a legend that
enumerates three arrow directions out of four. Booked against this work order rather than folded
into WO-3.16, because that one had shipped and been ticked, and a legend row is not an arrow-key
behaviour.

**Not a candidate for WO-3.20.** That work order is behaviour-neutral by construction and a new
legend row is a visible change; it says so itself.

**Deliverables**
- **An `↑ ↓` entry in the legend**, in the panel's own idiom and placed with the other movement keys
  rather than appended after the flags. The four flag rows stay last, because the panel's own
  comment describes them as a group and the bar carries the same four.
- **The wording agrees with the hint** at `index.html:1083`, which is already correct — the legend is
  what is wrong, and a rewrite of both that leaves them disagreeing differently is a worse outcome
  than the current state.
- **A harness check that the legend enumerates every key the grid actually binds.** The defect is not
  a missing string, it is that nothing compares the panel against the keys `handleScoreKey()` answers
  to; a fix without that check is the same omission waiting for the next key. If the comparison
  cannot be made mechanically, write down why rather than leaving the question unasked — the WO-1.18
  precedent.

**Out of scope** — rewording entries that are already right, restyling the panel, and `Home`/`End`,
which is not bound and is deliberately not being booked (see WO-3.23's note).

**Acceptance**
- [x] The legend lists `↑ ↓` with the movement keys, and the flag rows are still last. *(Third row of
      eight, between `⇥` and the `← →` row it belongs beside: the harness reads the panel in document
      order and prints `[↵ ⇥ ↑ ↓ ← → L M X ⌫]`.)*
- [x] The legend and the hint at `index.html:1083` describe the vertical pair the same way. *(Both say
      **within the column**; the hint is untouched, and the legend adds "up as well as down" — the one
      thing `↵` "next student, down the column" does not cover.)*
- [x] A check fails when a key the grid binds is missing from the legend — proved by removing an
      entry and watching it go red, not by reasoning about it. *(The `↑ ↓` row deleted, which is the
      pre-WO-3.22 build exactly: `790 checks · 789 passed · 1 failed · 0 skipped`, 259s, against
      `790 · 790 · 0 · 0` — the failing line reads "BOUND AND NOT ON THE LEGEND: ArrowDown (↓),
      ArrowUp (↑)". Reverted; `git diff` carries no trace of it.)*
- [x] `node tools/verify-shell.mjs` passes whole, with the count in `tools/README.md` moved in step.
      *(`790 checks · 790 passed · 0 failed · 0 skipped`, 21,115 lines, 26.7 lines per check, 259s;
      the call-site count moved 792 → 793 and `wo-sweep.mjs` asserts it — 20 checks, 18 passed, 0
      failed, 2 standing REVIEWs.)*

**Traps** — **The panel is `nowrap` and its rows are measured.** `.scores-key` does not wrap and the
`← →` row added at WO-3.16 is already the longest in the panel; a verbose `↑ ↓` entry can spill
through its own border on an iPad with every 44px check green. That is the "Days off" spill from the
first iPad sitting, and `wo-sweep`'s `scrollWidth` against `clientWidth` measurement is the shape
that catches it.

---

## WO-3.23 — the score grid never learns which modifier keys were held

**Ship** 2 · **Status** ✅ DONE — 2026-08-16 · **Size** S · **Depends on** WO-3.16 · **Blocks** nothing
**Closes roadmap** *(no box. A defect inside what WO-3.5 and WO-3.16 already closed.)*

**Why it exists.** `src/shell.js:1626` hands the grid a key **name** and nothing else:

    if (scores.handleScoreKey(e.key, scoreCell)) e.preventDefault();

`e.shiftKey`, `e.ctrlKey`, `e.metaKey` and `e.altKey` never cross the seam, so `handleScoreKey()`
cannot tell `→` from `Shift`+`→` and answers both the same way. Where it answers *yes* it also
`preventDefault()`s, and the browser's own behaviour for the modified key is lost.

**The failing case is narrow and real.** `caretCanLeave()` hands the key back whenever the caret has
room to move in the direction pressed, which is most of the time and is why this has not been
noticed — the browser gets the key and extends the selection correctly by accident. It breaks at the
edges the arrow rule was written for: `Shift`+`→` with the caret already at the end of the value is
read as a plain `→` and **jumps to the next assignment instead of extending the selection**, and
`Shift`+`←` at position 0 does the same backwards. `Ctrl`/`Cmd`+arrow, which is word- and
line-motion on both platforms, has the identical shape.

**Named in the code rather than left silent**, at the `handleScoreKey()` comment WO-3.16 wrote, which
is why this is a work order and not a discovery. **It is the seam that is wrong, not the grid**: the
fix is what crosses `src/shell.js:1626`, and every other delegated key in that listener has the same
exposure the moment one of them wants a modifier.

**Deliverables**
- **The modifier state reaches `handleScoreKey()`**, by whatever shape survives review — the event
  itself, or a small explicit record of the four flags. Passing the event is the obvious move and has
  a cost the decision should name: it hands a module that currently receives a string the ability to
  read and cancel anything on the event.
- **A modified arrow is the browser's**, at the edges as everywhere else. The grid answers *no* and
  does not `preventDefault()`.
- **A judgment recorded on the other delegated keys** in that listener — whether any of the rest can
  be pressed with a modifier and mean something different, and whether they are wrong today. Do it or
  write down why not; the seam is shared and this is the one work order that will be looking at it.

**Out of scope** — binding any new modifier combination, `Home`/`End`, and changing what an unmodified
arrow does. This work order makes the grid **stop** answering keys that were never its own; it adds
nothing.

*(**`Home`/`End` was proposed on 2026-08-15 out of WO-3.16's verification and deliberately not
booked.** It would move to the first or last assignment in the row. Nothing asks for it, no sitting
has wanted it, and it is a convenience with no demand behind it — the same shape as WO-3.13, struck
the same day for the same reason. It is written down here so the proposal is not invisible, and it
comes back the first time somebody presses the key and finds nothing there.)*

**Acceptance**
- [x] `Shift`+`→` with the caret at the end of a full cell extends the selection and does **not**
      change cell — a real keystroke with the modifier set, not a synthesised key name. *(Driven with
      `modifiers: 8` on `Input.dispatchKeyEvent`: the caret stays at `[3,3]` in `wo35-a2` and the cell
      does not move, where the same walk on the unfixed tree stepped a column. **The selection does
      not extend, and cannot**: at the end of the value there is no character to its right, and the
      browser's own answer there — measured on a bare `<input>` in the same build before the
      assertion was written — is to do nothing at all. The half of this line that is a real
      behaviour is asserted where the browser really does grow a selection: `Shift`+`←` over the
      full selection a keyboard arrival leaves behind goes `[0,3]` → `[0,2]` in the same cell.)*
- [x] `Shift`+`←` at position 0 does the same backwards. *(Same shape and the same caveat — `[0,0]`
      before and after, cell unchanged, with `wo35-a1` sitting there for a build that stole the key
      to land on. It landed on it before the fix.)*
- [x] `Ctrl`/`Cmd`+arrow at both edges is the browser's, not the grid's. *(Four presses at both caret
      edges: word motion collapses the caret where the browser puts it and nothing changes column,
      student or score. **This was already true before this work order and the check is green on the
      unfixed tree** — `src/shell.js`'s listener returns on Alt, Ctrl and Meta above the score-cell
      branch, measured with a `window` `keydown` reading `defaultPrevented` after the app's own:
      `false` for Ctrl and Cmd, `true` for Shift. Only `Shift` was ever the defect. What the fix buys
      is that the answer no longer depends on that guard.)*
- [x] Unmodified `←` and `→` behave exactly as WO-3.16 shipped them, its checks green unchanged.
      *(All four of its checks pass with detail strings **byte-identical** to the pre-WO-3.23 run —
      diffed, not eyeballed — and no old check line changed at all: the two runs differ by exactly
      the five lines added.)*
- [x] `node tools/verify-shell.mjs` passes whole, with the count in `tools/README.md` moved in step.
      *(`795 checks · 795 passed · 0 failed · 0 skipped`, 21,302 lines, 26.8 lines per check, 263s,
      against `790 · 790 · 0 · 0` before. The call-site count moved 793 → 798 and `wo-sweep.mjs`
      asserts it. All five new checks were watched failing first, on the tree as it stood:
      `795 · 790 · 5 failed · 0`.)*

**Traps** — **A check that synthesises a key name proves nothing here**, because the defect *is* that
only the name crosses the seam: a harness that calls `handleScoreKey('ArrowRight', cell)` cannot tell
a fixed build from a broken one. The keystroke has to be dispatched with the modifier actually held,
the way WO-3.16's caret checks dispatch real ones.

**Three ways the outcome differed from what this work order predicted, recorded because two of them
are in its own prose above and the prose is deliberately left standing.** *(2026-08-16, at the tick.)*

- **Only `Shift` ever crossed the seam.** *Why it exists* names all four flags. `src/shell.js`'s
  `keydown` listener opens `if (e.altKey || e.ctrlKey || e.metaKey) return;` — its **first**
  statement, thirty-three lines above the score-cell branch — so Ctrl, Cmd and Alt never reached
  `handleScoreKey()` at all, and `Shift` is out of that guard because `?` is typed with it. Measured
  rather than read off the source (`defaultPrevented` on a `window` listener running after the app's
  own: false for Ctrl and Cmd, true for Shift). **Acceptance line 3 was therefore already true before
  this work order and its check is green on the unfixed tree** — said so at the check, in
  `tools/README.md`, in `TESTING.md` and inside the tick itself, so that nobody reads its green as
  proof of the fix. What the fix buys is that the grid's answer no longer *depends* on a guard above
  it that a later work order may want to move.
- **Acceptance lines 1 and 2 ask for a state Chromium cannot produce.** "Extends the selection" at a
  collapsed edge has no character to extend over; the browser's own answer there is to do nothing, so
  "the key is the browser's" reads as *a cell that did not change*. The lines are ticked with the
  correction written into the tick rather than reworded — the Acceptance list is the test that was
  graded, and the verifier declined to edit a test it had just judged. Where a selection really does
  grow it is asserted separately: `Shift`+`←` over the full selection a keyboard arrival leaves
  behind goes `[0,3]` → `[0,2]` in the same cell.
- **The vertical pair went with it**, which is wider than the failing case described. `moveWithinColumn()`
  has no `caretCanLeave()` gate, so `↑`/`↓` were swallowed at **every** caret position rather than
  only at an edge, and `Shift`+`↑`/`↓` select to the start and end of the number. Taken under
  Deliverable 2's "a modified **arrow** is the browser's" and inside *Out of scope*, which forbids
  binding new combinations and changing what an **unmodified** arrow does — this does neither, it
  takes a key away. Flagged by the implementer as the call most open to challenge and affirmed by the
  verifier. **Closed as shipped by the owner on 2026-08-16, and it is not an open question.** The
  gesture needs a hardware keyboard and a deliberately held `Shift`, which puts it outside the way
  this app is used — the on-screen number pane has no arrow keys at all, so on the teaching iPad it
  does not exist unless the Smart Keyboard is attached. Recorded rather than left as a pending
  decision, because a note that reads as owed gets re-litigated by the next reader. If it ever is
  reversed, the revert is two `!held &&`s at `src/scores.js:1184-1185` and one check.

*(And a fourth, harmless: `src/shell.js:1626` in *Why it exists* was already stale at dispatch — that
call site was at `1642` when the dispatch opened and is at `1668` now. Left alone; the prose is the
record of what was asked, not a document the change falsified.)*

---

## WO-3.24 — no legend row in this app has ever been measured for spill

**Ship** 2 · **Status** ✅ DONE — 2026-08-16 · **Size** S · **Depends on** WO-3.22 · **Blocks** nothing, and
that is deliberate — nothing spills today, so this is a row to cut if the fortnight tightens
**Closes roadmap** *(no box. Harness, not app: on current evidence nothing a teacher sees changes.
The same call WO-3.12 and WO-3.21 made, and for the same reason.)*

**Not a go-live blocker, and no defect is known.** Booked 2026-08-16 out of WO-3.22's implementation
and its iPad sitting. The owner opened the ⌨ Keys panel on the installed iPad that day, portrait and
landscape, and **no row spilled** — the text stops short of its own border on all eight, the
pre-existing `← →` row included. **Do not go hunting for a spill on the assumption there is one.**

**Why it exists.** `.scores-key` is `white-space: nowrap`, so a row wider than the panel pushes
through its own border instead of wrapping, and it does that while passing every 44px check — the
"Days off" failure from the first iPad sitting, in a place no instrument is pointed. **Nothing in the
harness has ever opened `#scoresKeys` at all.** WO-3.22 added a ninth string to that panel and could
defend it only by counting characters: 37 against the `← →` row's 67, same class, same font. That is
an argument from the strings, and its own Acceptance said so. The eyes that then confirmed it are one
sitting at one pair of widths on one device — real evidence, and not a thing that re-runs itself when
the next row lands.

**The order of the two facts matters.** A measurement booked while a spill is live is a bug fix; this
one is booked while the panel is clean, which is the cheap moment to write it and the reason it can
be cut without anything breaking.

**Deliverables**
- **The panel opened through its real button and measured**, `scrollWidth` against `clientWidth` on
  `#scoresKeys` and on each `.scores-key`, under a coarse pointer at 390px and at 1024px. Opening it
  through the button rather than by unhiding it is the point: WO-2.21's scar is a sweep that measured
  a screen that was not the one on screen.
- **A red that names the row.** A panel-level pass with a spilling child inside it is the failure this
  is written to catch, so the per-row measurement is the claim and the container is context.
- **Proof by mutation, run rather than reasoned** — lengthen one row's text until it spills, watch the
  check go red naming that row, revert, and record the counts in `tools/README.md` the way WO-3.21's
  and WO-2.24's are.

**In scope if the measurement goes red: rewording the row that spills**, the `← →` row from WO-3.16
included. WO-3.22 was forbidden to touch it and so could not have paid this debt; this work order can,
and a check that lands red with no remedy in its own scope is a harness left failing.

**Out of scope** — restyling the panel, `white-space` itself, and the attendance key list, which is a
modal `<dl>` whose prose wraps and is a different shape (see WO-2.34, which opens it for a different
reason; if the two land near each other they should share whatever opens-and-measures helper this one
builds).

**Acceptance**
- [x] The ⌨ Keys panel is opened through its own button and every `.scores-key` in it is measured, at
      390px and 1024px under a coarse pointer. *(`aria-expanded` and `#scoresKeys` coming off
      `.hidden` are read as independent evidence the click landed; `#scoresKeys`'s own
      `scrollWidth`/`clientWidth` pair is read too and kept as context in every detail string, never
      asserted on its own.)*
- [x] Lengthening one row until it spills turns a check red **and names that row** — run, not
      reasoned, with the counts before and during quoted. A mutation that reddens nothing means this
      work order did not land. *(The first draft of the check compared each row's `scrollWidth` to
      its own `clientWidth` — always equal for an unconstrained `inline-flex` chip — and reddened
      NOTHING against a row stretched to 1678px in a 942px panel: `799 checks · 799 passed · 0 failed
      · 0 skipped`. Corrected to compare each row against the PANEL's available content width, the
      same mutated tree reread `799 checks · 797 passed · 2 failed · 0 skipped`, naming the mutated
      row at both widths. Reverting the mutation and re-running found a SECOND, pre-existing failure
      the mutation had nothing to do with — see the note below.)*
- [x] Reverted, and `git diff` carries no trace of the mutation. *(`git checkout -- index.html`,
      `git diff -- index.html` empty, confirmed before the real `← →` reword — a separate, retained
      edit — was made.)*
- [x] `node tools/verify-shell.mjs` passes whole on the delivered tree, with the check count in
      `tools/README.md` moved in step. *(`799 checks · 799 passed · 0 failed · 0 skipped`, 21,410
      lines, 26.8 lines per check, 263s, against `795 · 795 · 0 · 0` before. Call-site count moved
      798 → 802, `wo-sweep.mjs` asserts it.)*
- [x] 👤 If the check went red on a row that was already there, the reworded row is read on the
      installed iPad in both orientations before the box above is ticked. **It did** — the corrected
      check, run on the clean tree with no mutation at all, found WO-3.16's own `← →` row spilling at
      390px (`470/304`), the row the owner's 2026-08-16 sitting had already looked at and found clean
      on the installed iPad. No iPad is 390px wide, so the two readings are not in conflict — but the
      work order's own words put a red on a pre-existing row in scope to reword, and its own words
      say a check landing red with no remedy in its scope is a harness left failing.

      **The row was reworded twice, and the box was ticked against the second.** The dispatch wrote
      `across the row — → end, ← start` (261/304 at 390px), keeping `→` with the end and `←` with the
      start as WO-3.16's comment asks. The verifier passed it but reserved on the prose, and the
      reservation held up: the row sits one line under `⇥ next assignment, across the row`, so a naked
      `→ end` reads as a DESTINATION — jump to the last assignment — when the key clamps one step and
      only once the number is exhausted. Re-cut in the close-out sitting to
      `across the row when the caret runs out` (301/304 at 390px, 301/918 at 1024px), which departs
      from WO-3.16's asymmetry rule deliberately; the departure and the test that justifies it are
      written at the point of departure, `index.html` above the row. **Read and accepted on the
      installed iPad, both orientations, 2026-08-16.** `sw.js` bumped to `planbook-shell-v72` in the
      same edit — `./` is entry one in `SHELL`, so without it no device sees any of this.
      See `.claude/dispatch/WO-3.24-result.md`.

      **The reading cost three attempts, and the first two read the wrong string** — worth writing
      down, because nothing in this repository predicted it. The installed app served a document from
      the previous cache while the About modal, reading `caches.keys()` live, correctly reported the
      new one: v72 on the build line, v71 markup on the glass, for exactly one launch. A force-quit
      and cold relaunch fixed it. WO-8.10 reasoned that the useful question is how many caches rather
      than which version, and that is right for the half-landed deploy it was built for — but a
      single healthy cache can still sit behind a stale rendered page, which neither it nor its Traps
      section anticipated. Booked as WO-8.11.

**Traps** — **A headless viewport is not an iPad and this check must not be sold as one.** It
measures a layout at a width; the 2026-08-16 sitting is still the only time this panel has been
looked at on glass, and a green run here closes no 👤 line. **The panel is `flex-wrap: wrap`**, so
each row is its own chip and a container that fits proves nothing about the rows inside it — measure
the children or the check is vacuous.

**Two ways the outcome differed from what this work order predicted, recorded because the prose above
is deliberately left standing.** *(2026-08-16, at implementation.)*

- **"No defect is known" stayed true; "nothing spills today" did not.** The `← →` row was clean on the
  installed iPad on 2026-08-16 at whatever widths an iPad's portrait and landscape actually are, and
  it is clean there still — nothing about this correction touches that reading. It was not clean at
  390px, a width no iPad reaches but the one this work order's own Deliverable names as one of the two
  to measure. The two are different claims; this work order's own text put the reword in scope for
  exactly this case, and it was taken.
- **The literal reading of the Deliverable's `scrollWidth`-against-`clientWidth` wording, applied to
  each row against ITSELF, is vacuous — `.scores-key` is an unconstrained `inline-flex` chip that
  always grows to fit its own content, so the two numbers can never disagree.** The mutation is what
  caught this, not a re-reading of the markup: a row stretched to 1678px inside a 942px panel measured
  `1678/1678` and the first draft of the check stayed green. What the panel's own `Why it exists`
  paragraph says — a row "pushes through its own border", which is the PANEL's border, not one
  `.scores-key` has — is what the corrected comparison measures instead: each row's `scrollWidth`
  against the panel's own available content width. Full account, including the pixel figures at each
  stage, in `tools/README.md`'s check-count history and `.claude/dispatch/WO-3.24-result.md`.

---

## WO-3.25 — a score cell takes any string `Number()` can read, not any number a teacher can mean

**Ship** 2 · **Status** ✅ DONE — 2026-08-18 · **Size** M · **Depends on** WO-3.5 · **Blocks** nothing
**Closes roadmap** *(no box. `ROADMAP.md`'s **Score entry grid** line is `[x]` and stays `[x]` — the
grid works and this does not un-tick it. What is wrong is the set of strings it accepts, which no
roadmap line ever described.)*

**Not marked 🚩, and the reasoning is worth reading before anyone flips it.** Every value below has to
be *typed*, and on the iPad the score cell asks for a decimal keypad — there is no `e`, no `x` and no
letter on it at all. This is a **laptop-only** hole. It is still a live-path hole: grades are entered
once or twice a week (`CLAUDE.md` § Working agreements), and that is the laptop.

**Why it exists.** `editScore()` at `src/scores.js:880` validates a typed score with
`Number(raw)` + `Number.isFinite`, which is JavaScript's number grammar and not a gradebook's.
Measured with bare Node on 2026-08-17, not read off the spec:

| typed | stored |
|---|---|
| `1e3` | `1000` |
| `0x1f` | `31` |
| `0b101` | `5` |
| `0o17` | `15` |
| `+7` | `7` |
| `12.3456789` | `12.3456789` |

The cell is the app's **one** `type="text"` numeric field (`src/scores.js:474`), carrying
`inputmode="decimal"` — which is a keyboard *hint* and has never rejected a character. That is why the
owner has seen this on scores and nowhere else: Points and Weight are `type="number"` and the browser
filters their keystrokes for free. **Read the Out of scope section before "fixing" those too.**

**The second half is worse than the table, and it arrives through the guard meant to prevent it.**
Type `8a`: `Number` refuses, `editScore` returns **without writing**, the field goes on showing `8a`,
and the store keeps the previous number. Nothing reconciles them — `src/shell.js:1764` wires `input`
and `focusin` on a score cell and **there is no `blur` or `change` handler anywhere**, so the screen
and the store disagree until something else forces a re-render. `src/scores.js`'s own header calls a
score that silently is not what you typed *the worst thing a gradebook can do*, and
`docs/data-model.md:306` says it in the same words. This is that, produced by the refusal path.

**Deliverables**

- **The grammar, written down once and imported everywhere it is needed.** One decimal number:
  an optional leading `-`, digits, at most one `.`, **at most two digits after it**. Two decimals is
  the owner's call of 2026-08-17 and it has a reason: the SIS carries two, this number is re-keyed
  into it by hand, and `toFixed(2)` is already how every percentage in this app is printed
  (`src/scores.js:314`).
- **Legal prefixes are accepted into the field and are not values.** `-`, `.`, `12.` and `-.` are
  what a field looks like part-way through a number. They must be typable, and they must still write
  nothing — which is what `editScore` does today and is correct. **The distinction this work order
  turns on: an incomplete legal prefix is not an illegal value, and the two get different answers.**
- **Negatives stay legal.** Owner's call, 2026-08-17, and it is the extra-credit reasoning pointed the
  other way: a teacher who types `-5` meant `-5`. `docs/data-model.md` § Extra credit already refuses
  to silently discard points a teacher awarded; refusing a penalty she entered is the same move.
- **A `beforeinput` guard on the score cell**, cancelling the event when the prospective field
  contents fail the grammar. **This is the first `beforeinput` in the codebase** — grep confirms none
  — so it goes into `src/shell.js`'s delegated listeners beside `input` and `focusin`, not onto the
  element. Three things it must get right:
  - **Test the prospective value, not `event.data`.** Splice `data` into the current value across
    `selectionStart`/`selectionEnd` and test the result. Written that way, **paste, drag-and-drop and
    autofill are covered by the same test for free**; written against `data`, none of them are.
  - **Deletions always pass.** `deleteContentBackward` and its siblings can only shorten the field,
    and a value you cannot get back out of is a cell you cannot correct.
  - **Not every `beforeinput` is cancelable** — IME composition on some soft keyboards is not. Do not
    write code that assumes the cancel took, which is what the backstop below is for.
- **A backstop in `editScore()`, replacing the bare `return`.** A value that reaches it and fails the
  grammar can only have come through a path the guard could not cancel; the answer is to **rewrite the
  field to the stored value**, so screen and store cannot disagree. A legal prefix still writes
  nothing and leaves the field alone. This is belt-and-braces on an almost-unreachable path and it is
  the deliverable that actually closes the `8a` divergence.
- **The precision rule written into `docs/data-model.md`.** There is none today for scores — the
  document states one for *weights* ("stored exactly as typed — decimals included",
  `docs/data-model.md:313`) and says nothing at all about score precision, so the rule this work order
  enforces currently exists nowhere. It goes in beside the score-cell shape, with the SIS reason.
- **`editScore()`'s header paragraph rewritten at the point it stops being true.** It says today that
  the function "does not clamp, round or refuse a number." After this work order that is still true of
  the **value** — extra credit above points possible is untouched, and so is a negative — and false of
  the **notation**. Write the distinction down there. A reader who finds a refusal under a comment
  promising none will resolve it in one of two directions and one of them undoes this.

**Existing stored data is not rewritten, and that is deliberate.** A score of `12.3456789` entered
before this lands stays `12.3456789`, renders as typed, and can be edited *down* but not extended —
appending a digit fails the grammar and the guard refuses it. Retro-rounding a number a teacher
already typed is exactly the silent-wrong-number failure this work order exists to close, wearing a
fix's clothes. Say so in the comment; the next reader will want to add a migration.

**Out of scope, named rather than left to be re-derived.** Points (`src/assignments.js:637`) and
category Weight (`src/categories.js:331`) are `type="number"`. The browser filters their keystrokes,
which is why **the owner reports seeing this only on scores (2026-08-17)** and why they are out. What
remains on them is narrow, and it is **read from the HTML spec rather than measured here**: `1e3` is a
valid floating-point number so a number input takes it; decimals are uncapped; and pasting non-numeric
text makes `.value` read `''`, which `Number('')` turns into **`0`** — silently making an assignment
worth zero points, which the grade engine reads as extra credit rather than as an error.
**Converting them to `type="text"` to bring them under this grammar was considered and refused on
2026-08-17**: it trades the browser's own filter for a hand-written one, on two fields that work
today. **No follow-up work order is booked.** If one of those three ever bites, this paragraph is the
brief for it.

**Also out of scope: `formatWeight()`'s display-against-store rounding** (`src/categories.js:194`). It
rounds to 2dp for display while the store keeps full precision, so a weight typed as `33.335` stores
`33.335` and re-renders as `33.34` — the same *family* as the `8a` divergence, older, on a different
field, and needing a different fix. Recorded here because it was found while cutting this work order
and would otherwise be found again.

**Acceptance**
- [x] `1e3`, `0x1f`, `0b101`, `0o17` and `+7` cannot be produced in a score cell — by typing **or by
      pasting** — and the store is read to prove it, not the field.
- [x] A third digit after the decimal point is refused; `87.25` is accepted and stored as `87.25`.
- [x] `-5` is accepted and stored as `-5`, and a score above the assignment's points is still accepted
      unchanged. **A run that closes the line above by breaking either of these has failed.**
- [x] Typing `-`, `.` or `12.` leaves the field showing exactly that, writes nothing, and does not
      rewrite or reformat the field under the caret.
- [x] **The field and the store cannot disagree.** Drive every refused input above and read the
      cell's value against the stored cell after each one. This is the `8a` case and it is the reason
      the work order exists; a check that only asserts the store is half a check.
- [x] Existing out-of-grammar data survives: a document holding `12.3456789` renders it, and the value
      is unchanged after the grid is opened and left without editing that cell.
- [x] `docs/data-model.md` states the two-decimal rule for scores and says why.
- [x] `src/scores.js`'s `editScore()` header distinguishes refusing a **notation** from clamping a
      **value**, at the point the old sentence stops being true.
- [x] `node tools/verify-shell.mjs` passes whole, with the new checks driven through real events and
      the count in `tools/README.md` moved in step.
- [x] 👤 On the installed iPad, force-quit first: a score is entered, corrected and cleared on the
      decimal keypad with no character refused that the keypad offers. **The keypad has no letter on
      it, so this reading is that the guard did not cost anything — not that it caught anything.**
      *(Owner, 2026-08-17. All lines good: decimal keypad offered, `87` round-tripped, `87.25` took
      both decimals, a third digit did nothing and the field neither jumped nor reformatted, a
      delete-to-blank recomputed the grade, a minute down a column refused nothing and felt no
      slower, and the external keyboard's Enter-down/arrow-across still worked beside the new
      `beforeinput`. **The line caught more than it asked for**: with a hardware keyboard attached
      the keypad's no-letter argument does not hold, and letters were driven at the guard on real
      WebKit and refused — the half of Acceptance 1 the harness could only prove in Blink.)*

**Traps**

- **`inputmode="decimal"` is not a validator and never was.** The comment at `src/scores.js:470`
  answers a different question — why not `type="number"` — and reading it as a validation claim is how
  this hole survived four work orders on this grid.
- **`L`, `M` and `X` never reach `beforeinput`.** `src/shell.js`'s `keydown` swallows them first
  (`src/scores.js:1152`). Do not add a second refusal for them: it would be a branch no keystroke can
  drive, and WO-3.23 already wrote down what an unreachable guard with no check behind it is worth.
- **The cell must stay `type="text"`.** `caretCanLeave()` reads `selectionStart`
  (`src/scores.js:1120`) and a number input answers `null` to that question — WO-3.16's
  arrow-across-the-row behaviour dies silently if the field type changes.
- **`Number('')` is `0`, not `NaN`.** Any new parse path keeps `raw === ''` handled ahead of it, or an
  emptied cell starts scoring zero.
- **The grid renders 25 rows × N columns of these inputs.** The guard runs per keystroke on the
  app's second-most-frequent action; keep it a string test, and do not reach for the store from
  inside it.

---

## WO-3.26 — the ungraded count on the home screen

**Ship** 2 · **Status** ✅ DONE — 2026-08-19 · **Size** S · **Depends on** WO-3.4, WO-1.10 · **Blocks** WO-6.4
**Closes roadmap** *(no box. ROADMAP § Phase 3 is 10 of 10 and every box on it is claimed by the work
order that built it. This fills a slot `src/home.js` reserved and named in 2026-08-04, which no
roadmap line ever described — the same shape as WO-3.18, and written without quotation marks anywhere
on this line for the same reason: anything in double quotes here is read as a roadmap fragment.)*

**Booked 2026-08-19, owner-directed, by** [WO-1.25](phase-1-shell-store-roster.md#wo-125--phase-6-is-cut-against-a-model-that-is-not-there)
**out of a read-only audit of Phase 6.**

**Why it exists.** *The home screen accretes* is a standing obligation — every phase adds its line to
WO-1.10's screen rather than deferring it to Phase 6 — and Phase 3 is the phase that owes this one.
`src/home.js` appends `.class-card-signals` empty and names its owner in the file itself,
`WO-3.x — ungraded work`; `src/home.css` holds 24px of reserved height for it so that the first real
datum reflows nothing. **The work order that string points at has never been written.** The phrase
`home screen` appears in no Phase 3 work order at all, and Phase 3 is otherwise finished but for the
OAuth paperwork, so it would have closed with the slot empty and WO-6.4 quietly carrying the debt —
where it would be discovered as a Phase 6 surprise rather than as Phase 3's own line.

**It is worth real value before Ship 2 and it is buildable today.** WO-3.4's engine and WO-1.10's
screen are both ✅ DONE, so nothing here is waiting on anything. What a teacher gets is the answer to
*what have I not graded yet* from the page she opens the app on, on the five cards she is already
looking at.

**It is a Phase 3 work order sitting in § Ship 2 and that does not gate the gate.** WO-G2's
`**Depends on**` is a curated explicit list rather than every row in the ship — [WO-3.25](#wo-325--a-score-cell-takes-any-string-number-can-read-not-any-number-a-teacher-can-mean)
is the precedent, already in that table and named by no gate.

**Deliverables**
- **An ungraded count per class in `.class-card-signals`**, on the home screen's existing card. A
  `.pill`-shaped count inside the 24px the slot already reserves, so no card on the page changes
  height when the first one appears.
- **The count comes from `openWork()` in `src/grade-engine.js` and from nowhere else.** That function
  already owns the three-state answer this needs — `missing` is graded, `open` is ungraded work worth
  points, `bonus` is ungraded work worth zero, and `excused` is in none of them — and a second scan of
  `scores` on this screen is exactly the second answer that comes to disagree with the grade printed
  an inch away. `src/home.js` is a renderer and stays one.
- **What the number counts: assignments, not cells.** An assignment in the open term with at least one
  `open` cell across the class roster. The alternative — blank cells — was considered and not taken:
  the card's tap lands on the class, the grid is organised in columns, and *three assignments waiting*
  is a sentence a teacher can act on where *forty-one blanks* is a number she has to divide first.
  Bonus work is not counted, because zero-point work waiting is not work owed.
- **A class with nothing ungraded shows nothing**, not `0 ungraded`. The slot keeps its height either
  way, so the page does not move; a zero pill is a datum a teacher has to read to learn there is
  nothing to read. *(This is the same call `src/home.js` already makes about the empty slot, and the
  opposite of the honest-empty-state rule only in appearance: an empty state is what a **page** says
  when it has nothing, and this is one chip on a card that has plenty.)*
- **No new control, and that is why there is no new 44px rule.** The count is text inside the card's
  one button, the way `.class-card-state` is since WO-1.13 — `src/home.css` says in as many words why
  that line takes no floor of its own. If this ever becomes tappable it becomes a control and the
  coarse-pointer block gains it in the same pass.
- **Nothing under `supports` reaches this card.** `src/home.js` is deliberately absent from
  `flipPresentationMode()`'s redraw list because a class name and a colour are not a student's file,
  and an ungraded **count** does not change that — it names no student. WO-1.9's acceptance says to
  re-verify that inheritance at every later phase; this is that phase, and the answer is that the
  module stays off the list.

**Acceptance**
- [x] A class with three assignments holding blank scores shows a count of three; entering the last
      blank score on one of them takes the count to two, with no reload.
- [x] The count counts what `openWork()` calls `open` and nothing else: a cell marked `excused`, a
      `late` carrying a score, a `0` typed by the teacher, and an assignment marked `missing` are none
      of them ungraded, and a zero-point bonus assignment is not counted either.
- [x] A class with nothing ungraded shows no chip, and a screenshot of the card in that state is the
      same height as the card beside it carrying a count.
- [x] The number matches the score grid: open the class and count the columns holding a blank, and
      the two agree.
- [x] `src/home.js` performs no grade arithmetic of its own — the count is `openWork()`'s rows,
      filtered and grouped, and `wo-sweep.mjs`'s screens-that-ask census still does not list this
      module as one that reads `supports`.
- [x] Nothing on the card names a student, in presentation mode or out of it.

**Traps** — **Do not infer ungraded from a due date.** Blank means ungraded and affects nothing;
`late` and `missing` are teacher-marked, and `src/past-due.js` is the one place in the app allowed to
read a clock against a blank — it *asks*, and writes only what the teacher accepts. A count that goes
up at midnight is the rule this project has broken and repaired once already.

---

**WO-3.27, WO-3.28 and WO-3.29 were drawn before they were booked.** Read
[`design/mockups/score-tools.html`](../../design/mockups/score-tools.html) and
[`design/mockups/proposed-scores.css`](../../design/mockups/proposed-scores.css) before building
any of them. The drawing's first frame reproduces the focus defect by hand on the shipped grid. Its
stylesheet's two sections are what these two work orders lift. The owner answered all eight of its
questions on 2026-10-01, and each answer is recorded on the drawing, in green, beside the question.
They are also collected in [`design/mockups/README.md`](../../design/mockups/README.md) § Score grid
tools.

## WO-3.27 — the score grid scrolls in a box of its own, and a focused cell is never under the frozen columns

**Ship** — · **Status** ✅ DONE — 2026-10-02 · **Size** M · **Depends on** WO-3.5 — the grid and the frozen pair this boxes
**Closes roadmap** *(no box. Found by the owner in daily use, 2026-10-01.)*

**Booked 2026-10-01**, owner-directed, from a sitting about the score grid's usability. Three of the
owner's five asks are one change:

- **The assignment names scroll off the top.** `.scores-grid-wrap` is `overflow-x: auto`
  (`src/scores.css:169`), and a scrolling box is what sticky positioning measures against on **both**
  axes. So `top: 0` on the head sticks to a box that never scrolls vertically, and does nothing.
- **A focused cell can sit under the frozen name and grade.** A browser scrolls a focused field into
  view against the edge of its scroll box. It does not know the left 274px of that box (190 + 84;
  252 under a coarse pointer) is covered, so a cell underneath counts as visible and nothing moves.
  Reproducible by hand in the drawing's first frame: scroll right, click the last column, Shift+Tab.
- **Sideways scrolling on the laptop is clumsy.** The horizontal scrollbar sits under the last
  student, below the bottom of the screen. A trackpad swipe also stops wherever it stops, often with
  a column half under the frozen pair.

**Deliverables**
- **Surface: `design/mockups/proposed-scores.css` § SCORE SCROLL BOX**, drawn in
  `design/mockups/score-tools.html`, lifted into `src/scores.css`. The `.boxed`
  state word folds into `.scores-grid-wrap`'s base rule on lift. Amend the drawing's banner in the
  same sitting (`design/mockups/PROTOCOL.md` rule 4).
- **The box**: `overflow: auto` both ways, with a `max-height` of the viewport less what sits above
  it. Once the page is scrolled to it, the whole box fits on one screen, head and horizontal
  scrollbar included. The summary, flag bar and toolbar above it scroll away as a page normally
  does: **the owner's ruling, Open 1**. `overscroll-behavior: contain`, so a swipe that reaches the
  grid's edge stops there and does not carry on into the page: **Open 2**.
- **The head sticks**, all four lines of it, with no compact variant: **Open 3**. The name and grade
  heads, already sticky on the left, become the corner. The head cells are reached through
  `:where()` as drawn, so the shipped corner rule's `z-index: 3` still wins on specificity rather
  than being restated.
- **`scroll-padding`** on the box: the stuck head's height on top and the frozen width on the left,
  in both pointer blocks. It becomes **a fourth value tied to the frozen widths**, alongside the ones
  the THE TWO FROZEN COLUMNS comment in `src/scores.css` says are asserted three ways, and
  `tools/verify/score-grid.mjs` asserts it with them.
- **`scroll-snap-type: x proximity`** with `scroll-snap-align: start` on the head cells, so a swipe
  settles with a column edge on the frozen edge. Never `mandatory`, which fights a slow drag.
- **Nothing in `src/scores.js` changes for any of this.** `revealScoreColumn()` and its
  `scrollIntoView({ inline: 'center' })` is the one call that scrolls the grid on purpose. It should
  keep working inside the new box; check that rather than assume it.

**Acceptance**
- [x] With the box scrolled down, every column head's top equals the box's top, measured, on both
      pointers. The name and grade heads hold that **and** their left offsets with the box also
      scrolled sideways.
- [x] **The focus defect, driven rather than reasoned about.** With the grid scrolled fully right,
      move into a cell whose column sits under the frozen pair, once with a real Shift+Tab and once
      with a real `ArrowLeft` (caret at the start). Both leave that cell's left edge at or right of
      the frozen pair's right edge. Enter down into a row under the stuck head leaves the cell's top
      at or below the head's bottom. Both pointers. **Mutation-proved**: with `scroll-padding`
      removed, the same keystrokes leave the cell covered and the check goes red. Revert the mutation
      before writing anything else.
- [x] The frozen-pair assertion in `tools/verify/score-grid.mjs` covers the scroll padding as well as
      the widths and the offset, base against base and coarse against coarse. A drift in any one of
      the four goes red.
- [x] At a 1280×800 laptop viewport with the page scrolled to the grid, the box's bottom edge, and so
      its horizontal scrollbar, is inside the viewport.
- [x] Arriving from the glance page's *Waiting to be graded* still lands on the column with the caret
      in its first cell (`revealScoreColumn()`, WO-6.8), and that column is not under the frozen pair.
- [x] Every existing score-grid, past-due and grade-sheet check is green unchanged, and the printed
      grade sheet is unchanged.
- [x] 👤 On the iPad: the head stays on screen; a swipe that reaches the grid's edge stops there, and
      that feels right under a thumb rather than stuck; tapping a cell near the frozen edge brings it
      clear of the name and grade. *(Read by the owner on the LAN build, v148, 2026-10-02, a
      long-titled column included.)*
- [x] 👤 On the laptop: a trackpad swipe sideways settles on a column edge, and the scrollbar is on
      screen without scrolling the page to the bottom of the class.

**Traps** — **The box changes what a page-level scroll does.** Two things already scroll on purpose:
`revealScoreColumn()`, and the past-due review's column tint, which a teacher finds by scrolling.
Read both against the box. **Do not fix the focus defect in JavaScript first.** The fix is a
declaration. A `scrollIntoView` in the key handler would cover arrows and Enter, and miss a click and
a screen reader's own focus move. Add a script fallback only if the 👤 iPad reading shows Safari
ignoring `scroll-padding` for focus, and say so in `TESTING.md`.

*(**Built 2026-10-01, and two things went differently from the Deliverables above**, both argued in
`TESTING.md` § WO-3.27. **`src/scores.js` did change, by one line**: `revealScoreColumn()` now puts
the box back to its top before scrolling the column head into view, because the box keeps its scroll
while the screen is hidden and the head is sticky inside it — the "check that rather than assume it"
above, checked, and it did not keep working from a box left scrolled down. And **`.scores-input`
carries a `scroll-margin-left`** the drawing did not have: without it the proximity snap can return a
focus scroll to where it started, with the caret under the frozen pair. No script fallback for the
focus fix was added.)*

*(**Verified and closed 2026-10-02.** The verifier proved the one `src/scores.js` line by mutation,
which the implementer had not: deleting `scrollTop = 0` turns `verify/score-grid.mjs`'s reveal check
red, and deleting `scroll-padding` turns eight checks red. The owner's two 👤 readings, iPad and
laptop, were green on v148. On the iPad, Safari honoured `scroll-padding` for a tapped cell, a
long-titled column included, so the Traps' script fallback is not owed.)*

## WO-3.28 — the score grid narrows to one category

**Ship** — · **Status** ✅ DONE — 2026-10-02 · **Size** M · **Depends on** WO-3.27 — the box whose scroll padding a third frozen column widens; WO-3.29 — the toolbar this adds its pills to
**Closes roadmap** *(no box. Owner-requested, 2026-10-01.)*

**Booked 2026-10-01**, owner-directed, from the same sitting as WO-3.27, and **cut in two on
2026-10-02**: it was booked as *narrows by student and by category*, and the student half is now
[WO-3.29](#wo-329--the-score-grid-narrows-by-student). The cut is along rows and columns. Search
narrows rows, which the grid's existing stop-at-the-last-row behaviour already handles. This work
order narrows columns, which is where the arrow, Tab and Enter edge cases are, and it adds a third
frozen column to WO-3.27's box. So it carries the risk, and it gets a dispatch to itself.

A teacher wants to look at one category alone. That is how a category is checked against the SIS,
and the check is done by hand, because the SIS has no usable export (`CLAUDE.md` § Working
agreements).

**Deliverables**
- **Surface: `design/mockups/proposed-scores.css`**, drawn in `design/mockups/score-tools.html`: the
  `.scores-filter-pills` rule from § SCORE TOOLBAR, the `.scores-cat-avg` rules, and the filtered
  scroll padding left pending in § SCORE SCROLL BOX, all lifted into `src/scores.css`. WO-3.29 lifts
  the rest of the toolbar first; the pills go into it after the search box and its count. Amend the
  drawing's banners in the same sitting.
  *(**Built between the box and its count, the owner's ruling 2026-10-02.** The count appears only
  while there is text, so pills placed after it would shift along the row at the first keystroke.
  Four of the drawing's five toolbar frames already drew it this way.)*
- **One category at a time, plus *All***: **Open 4**. A single category's average is what gets
  compared to the SIS. Pills carry names only (**Open 6**) and wear `.pill` as shipped. A pill
  appears for each category with at least one assignment in the open term, because a pill that
  empties the grid is a dead control. Work filed under no category shows under *All* only. Columns
  outside the category are **not rendered**, so Tab, the arrows and Enter cannot put a caret in a
  column nobody can see.
- **A third frozen column while a category is picked: that category's average**, from
  `categoryPercentage()` in `src/grade-engine.js` and from nowhere else. ~~A percentage and no letter,
  for the reason `classAverage()` gives.~~ **Each student's figure now carries its letter under it,
  as the overall grade does — the owner's ruling, 2026-10-02, at the 👤 reading** (see the Acceptance
  line it added). The letter comes from `letterFromPercentage()` and nowhere else. The two columns read
  as a pair: **the numbers share one line and the letters share the next**, so a row reads across
  rather than stepping. The summary's category class average stays letterless, for the reason
  `classAverage()` still gives about a class. The overall grade does not move and does not change meaning:
  **the owner's ruling before drawing**. The column stays in every orientation, iPad portrait
  included (**Open 8**). The box's left `scroll-padding` widens to cover it (358px, 336px coarse).
- **The summary line gains the category's class average** while one is picked (**Open 5**). Every
  other figure on it stays whole-class. The filter moves no class average, blank count or student's
  grade.
- **The filter is not remembered.** It resets whenever the screen is opened, which is the calendar's
  ruling that a filter is a door and not a preference. Nothing reaches `localStorage`. The printed
  grade sheet ignores it.
- **The two filters together.** A typed name and a picked category both apply at once, and each
  keeps working when the other changes. This work order lands second, so it carries the checks for
  the combination.

**Acceptance**
- [x] With a category picked, only its columns are in the DOM. Tab, `ArrowRight` and Enter stop at the
      last shown column and the last shown row, with the edge sentence the grid already speaks.
- [x] The third column's figure for every student equals `categoryPercentage()` for that student and
      category, and the summary's category average equals the same figure averaged over the class.
      **Mutation-proved**: a third column fed any other arithmetic goes red.
- [x] With a category picked, a focused cell is never under the three frozen columns. This is
      WO-3.27's driven check re-run with the filter on, both pointers.
- [x] The class average, the blank count and every overall grade are byte-identical with the filter
      on and off.
- [x] With a name typed and a category picked, the grid shows exactly the matching rows and the
      category's columns. Clearing either one restores its own axis and leaves the other narrowed.
- [x] Leaving the screen and coming back shows *All*, and no `planbook_` key was written by the pills.
- [x] The pills measure ≥44px under the coarse pointer.
- [x] 👤 On the iPad in portrait, with a category picked and a name typed, the three frozen columns
      leave a usable grid under a thumb.
      *(**Failed 2026-10-02, the owner, iPad at v150:** the category-average column is not frozen. It
      drifts a few pixels with a horizontal scroll before holding, and only on the iPad; the name and
      grade columns hold. A likely cause, not yet measured: in an auto-layout table `width: 84px` is a
      floor, so if the grade column renders wider than 84 under iPadOS's font, the third column's
      natural position sits past its `left: 252px` and it travels the difference before sticking.)*
      *(**Passed 2026-10-02, the owner, iPad at v151**, after correction round 1 pinned each frozen
      column to its declared width. The cause guessed above was the right one: widening every glyph
      by 4px reproduced the drift on the desk, a 106px grade column against its declared 84.)*
- [x] Every frozen column's rendered left edge equals its sticky `left` at `scrollLeft` 0, and stays
      there under a full horizontal scroll, under both pointers, with the widest figures the columns
      can hold (`100.00%`, the longest category name in the head). A column wider than its declared
      width goes red here rather than on the iPad. *(Added 2026-10-02 from the failed reading above.)*
- [x] With a category picked, each student's category figure has the letter `letterFromPercentage()`
      gives for it, on its own line under the number, and a student with no figure shows the em dash
      and no letter. In every row the category number sits on the overall grade number's line and
      its letter on the overall letter's line. The summary's category average has no letter.
      **Mutation-proved**: a letter banded from the overall grade instead of the category goes red.
      *(Added 2026-10-02, owner-directed.)*

**Traps** — **Do not hide columns with CSS.** The key handlers in `src/scores.js` can still walk into
a `display: none` cell, and a caret in a hidden field is the defect WO-3.27 exists to remove. **Do not
compute the category average on this screen.** The engine already answers it, and a second answer is
the one that ends up disagreeing with the student detail an inch away. **Do not store the filter**,
however convenient a remembered *Quizzes* would be on the second visit.

## WO-3.29 — the score grid narrows by student

**Ship** — · **Status** ✅ DONE — 2026-10-02 · **Size** S · **Depends on** WO-3.5 — the grid whose rows this narrows
**Closes roadmap** *(no box. Owner-requested, 2026-10-01.)*

**Booked 2026-10-02**, owner-directed, cut out of [WO-3.28](#wo-328--the-score-grid-narrows-to-one-category)
along rows and columns. This half narrows rows only. It touches no frozen column and none of
WO-3.27's scroll padding, so it needs nothing but the shipped grid. **It goes first**: it is the
smaller half, and it lifts the toolbar WO-3.28 then adds its pills to.

A teacher wants to find one student's row in a class of thirty without scrolling for it.

**Deliverables**
- **Surface: `design/mockups/proposed-scores.css` § SCORE TOOLBAR**, drawn in
  `design/mockups/score-tools.html`: `.scores-toolbar` and `.scores-found`, lifted into
  `src/scores.css`. `.scores-filter-pills` is WO-3.28's and stays drawn. The toolbar is
  `.attendance-toolbar` value for value, wearing `.search-box` as shipped. Amend the drawing's banner
  in the same sitting.
- **Type-to-narrow, by the attendance search's rule exactly**: **Open 7**, as revised by the owner on
  2026-10-02. The query is trimmed and lower-cased, and a row shows when it appears anywhere in
  `rosterName()` ("Last, First") or `fullName()` ("First Last"). *ma* finds Amari, Mahoney, Marcus
  and Maya. **No `nickname`, on either screen.** Rows that do not match are not rendered. A count,
  *4 of 14 students*, sits beside the box. When nothing matches, the grid's own `.scores-empty` line
  shows, with no head over nothing. **Escape in the search box clears it** (the grid still does
  nothing on Escape).
- **One matcher, and attendance's behaviour does not change.** The test in `visibleStudents()` in
  `src/attendance.js` (~3160) moves into one exported function, `src/roster.js` beside `fullName()`
  being the natural home, and both screens call it, so two identical-looking boxes cannot answer one
  query differently. This is a move, not a rewrite: attendance must answer every query exactly as it
  does today. *(Booked on 2026-10-01 as a new prefix-and-nickname rule that attendance would move to.
  The owner reversed that on 2026-10-02: the attendance rule already makes sense, so it is kept.)*
- **The search is not remembered.** It is empty whenever the screen is opened, and nothing reaches
  `localStorage`. The class average, the blank count and every grade stay whole-class figures while
  it narrows the rows. The printed grade sheet ignores it.

**Acceptance**
- [x] On a roster holding Amari Johnson, Ben Castillo, Marcus Bell and Thomas Reed, typing *ma*
      shows Amari, Marcus and Thomas and not Ben; *bell, m* (the "Last, First" form) shows Marcus; a
      query matching only a student's `nickname` shows no one. The count reads *3 of N students*. A
      query matching no one draws the empty line and no grid head. Escape clears the box and every
      row returns.
- [x] **The attendance search answers every one of those queries identically**, through the same
      exported function, and the harness or a sweep check shows there is one matcher rather than two.
      Every existing attendance search check is green **unchanged**: the move altered no answer.
- [x] With the rows narrowed, Enter and `ArrowDown` stop at the last shown row and `ArrowUp` at the
      first, with the edge sentence the grid already speaks.
- [x] Typing a query keeps the caret in the search box from the first letter to the last, measured by
      `document.activeElement` after every keystroke.
- [x] The class average, the blank count and every overall grade are byte-identical with the search
      on and off.
- [x] Leaving the screen and coming back shows an empty search, and no `planbook_` key was written.
- [x] The search box measures ≥44px under the coarse pointer.
- [x] 👤 On the iPad, typing a name with the on-screen keyboard up leaves the narrowed rows in view
      above it. *(Read by the owner on the LAN build, v149, 2026-10-02.)*

**Traps** — **Do not hide rows with CSS.** The key handlers in `src/scores.js` can still walk into a
`display: none` row. **Do not rebuild the search box on a keystroke.** `src/attendance.js` keeps its
search field as markup in `index.html` and re-renders only the rows, so the element a keystroke came
from cannot be destroyed under it (its comment above `setSearch()` says why). `renderScores()`
rebuilds every cell, so the search box has to live outside what it rebuilds, or the box loses focus
mid-word. **Do not improve the rule on the way through.** Attendance's answers are the acceptance,
and a better matcher is a change to a screen nobody asked to change.

## WO-3.30 — a class can be graded on total points

**Ship** — · **Status** ✅ DONE — 2026-10-03 · **Size** M · **Depends on** WO-3.4 — the engine this gives a second formula
**Closes roadmap** *(no box. Owner-requested, 2026-10-02.)*

**Booked 2026-10-02**, owner-directed, out of a sitting about what grading should do next. **Total
points keeps its categories.** They still file work, drive WO-3.28's filter and carry their own
percentage. Only the class grade's formula changes: weighted is each category's earned ÷ possible
times its weight, and points is everything earned ÷ everything possible, weights ignored. The engine
already sums earned and possible inside each category (`categoryResult()` in `src/grade-engine.js`),
so most of the arithmetic exists. The risk is the callers: seven files read a class grade, and they
have to agree on it.

**This work order is the engine and nothing a teacher can see.** No control can put a class in
points mode until [WO-3.31](#wo-331--the-categories-editor-offers-total-points), so everything here
is proved headless on fixture classes.

**Deliverables**
- **`gradingMode` on a class, and an absent key means weighted.** The only value ever stored is
  `"points"`. Going back to weighted **deletes** the key rather than writing `"weighted"`, which is
  the rule `thresholdsOf()` already follows: an absent key is its default. `newYearDocument()` gains
  nothing, so every backup written by every earlier build still restores (CLAUDE.md § Data, the
  WO-6.1 scar). `docs/data-model.md` gets the field and a § Grade math paragraph on the second
  formula.
- **One `classGrade()` that every caller uses**, branching on the mode. `weightedClassGrade()` is
  removed, not kept beside it, and every caller moves: `src/detail.js`, `src/grades-report.js`,
  `src/merge-fields.js`, `src/scores.js`, `src/signals-view.js`, `src/signals.js`, and the engine's
  own uses. Two names for one answer is how a screen ends up disagreeing with the one next to it.
- **Points mode returns the same shape weighted mode does**, so no caller branches. `percentage` is
  the sum of `earned` over the sum of `possible` across categories. Each category's
  `effectiveWeight` is its share of the total `possible`, and its `contribution` is its `earned` over
  the total `possible` × 100, so the contributions still add up to the grade on a detail screen.
- **The weights-total-100 refusal does not apply in points mode.** A points class has a grade as soon
  as anything is graded. `no-graded-work` still applies.
- **`projectedClassGrade()` takes the same branch.** Its *solved, not searched* argument still holds:
  in points mode the projected grade is still a straight line in the rate.
- **A per-category points share for the editor**, exported from the engine:
  `pointsShare(doc, cls, termId)`, each category's share of the points assigned in the term so far.
  WO-3.31 draws it and does no arithmetic of its own.
- **Signal wording stops saying "weighted".** `grade-below`'s chip reads *Weighted grade below*
  (`src/signals.js` ~219), which is false in a points class. It becomes *Grade below*, along with any
  other on-screen use. The rules' arithmetic does not change: they read `classGrade()` at both ends
  of the window, exactly as before.
- **Work filed under no category counts toward a points grade.** It carries no weight, so it
  counts toward nothing in weighted mode, and that does not change. In points mode there is no
  weight for it to lack. *(The owner's ruling, 2026-10-02, before dispatch.)*

**Acceptance**
- [x] A class with no `gradingMode` key produces byte-identical grades on every screen and in every
      signal before and after this lands, on the harness's existing fixtures.
- [x] A points-mode fixture with three categories and deliberately lopsided points gives a grade equal
      to total earned ÷ total possible, worked by hand in the check. Its category weights sum to 75,
      and it still has a grade.
- [x] In both modes, each category's `contribution` adds up to `percentage`, and excused work is out of
      both totals.
- [x] A scored assignment filed under no category moves a points-mode grade by exactly its earned and
      possible points, and moves a weighted grade not at all.
- [x] No file in `src/` calls `weightedClassGrade`, and a sweep check keeps it that way.
- [x] Every screen showing one student's grade in a points-mode fixture shows the same number:
      the score grid, student detail, the grade sheet, the signals list and the `{{grade.percent}}`
      merge field. **Mutation-proved**: one caller left on the weighted formula goes red.
- [x] `projectedClassGrade()` in points mode matches a hand-worked projection, and the score needed
      for the next band still solves by the straight line.
- [x] A backup written before this lands restores unchanged, and a points-mode year round-trips
      through backup and restore with its mode intact.
- [x] No on-screen string calls the class grade "weighted".

**Traps** — **Do not compute a points grade anywhere but the engine.** A screen that adds up its own
cells is the second answer. **Do not seed `gradingMode`** on new classes or in `newYearDocument()`:
`parseBackup()` would refuse every older backup by name. **Do not change what `categoryResult()`
returns.** Both modes rest on it, and WO-3.28's frozen column reads it.

## WO-3.31 — the categories editor offers total points

**Ship** — · **Status** ✅ DONE — 2026-10-04 · **Size** M · **Depends on** WO-3.30 — the engine and the `gradingMode` key this writes; WO-3.34 — the screens a points class is read on; WO-3.35 — the CSV and the extra-credit-only student; WO-3.36 — the score grid and the grade sheet; WO-3.37 — the quiet list's sentence; WO-3.38 — a bonus scored 0
**Closes roadmap** *(no box. Owner-requested, 2026-10-02.)*

**Booked 2026-10-02** beside [WO-3.30](#wo-330--a-class-can-be-graded-on-total-points), cut along the
line between the arithmetic and the control. This half is one screen and its readings. It is kept
separate so the engine half closes headless without waiting on an iPad.

**Deliverables**
- **A mode control on the categories editor**: weighted or total points, per class.
- **The editor speaks the class's mode.** Its title reads *Categories & weights* and its opening
  sentence says "how much each part counts" (`index.html`, `#categoriesModal`). Both are false in a
  points class. WO-3.36 fixed this wording on the other screens and left this dialog to this row.
- **Weights are kept and greyed, never cleared.** In points mode the weight fields are not editable
  and the weights-total line is gone, because there is nothing to add up to 100. Switching back
  restores them exactly as typed. A category added in points mode gets a weight like any other,
  disabled, and it is there when the class goes back to weighted.
- **In place of each weight, the category's share of the points**: *Tests — 62% of the points
  assigned so far*, from `pointsShare()` and nowhere else. It moves as work is assigned, so it is
  computed at render and never stored. This is the line that tells a teacher what points grading is
  actually doing: three early tests can make Tests most of the grade without anyone deciding it.
  **Draw every row `pointsShare()` returns**, including its *no category* row when loose work holds
  points: that work counts in a points grade, and without the row the shares do not add up to 100.
  **When the term holds no points yet**, every share is null and each line says so in words (*No work
  assigned yet*), never *0%* and never a blank.
- **The term is the open term**, resolved by `getOpenTermId(classId)` in `src/classes.js`. The editor
  is opened with a class id only, and one of its doors (the class list) has no term in view, so the
  term is resolved where the class id already is: `src/shell.js`.
- **Switching confirms with a before and after.** The dialog shows the class average under each mode
  and lists **every student whose letter changes** in the open term. The quarter letter is what goes
  into the SIS, so a letter change is the consequence worth naming. One `update()` writes the key, or
  deletes it on the way back. Cancelling writes nothing.
  - **The class average is the score grid's**: the mean of the students who have a grade, a student
    with no grade left out. That is `classAverage()` in `src/scores.js`, which is private today. Export
    it or move it where both can reach it. Do not write a second mean.
  - **A letter that becomes no grade is a change and is listed**, as *B → no grade*, and the reverse
    as *no grade → B*. Switching back to weighted with weights that do not total 100 takes every
    letter away, and that is the case the dialog most needs to say.
  - **The mode is per class, not per term**, so the switch regrades every term, including a finished
    quarter whose letters are already in the SIS. Under the open term's list, the dialog adds one line
    for each other term of the class where any letter changes, with a count: *Q1: 3 letters would
    change.* A term where none changes draws no line. *(The owner's ruling, 2026-10-04, before
    dispatch.)*
- **Drawn first** if the editor's layout changes enough to need it, under
  `design/mockups/PROTOCOL.md`. If the control fits the editor as shipped, the dispatch says so and
  skips the drawing.

**Acceptance**
- [x] Switching a class to points and back leaves every weight byte-identical to what was typed, and
      leaves no `gradingMode` key behind.
- [x] The confirmation's before and after figures equal `classGrade()` under each mode, and the
      students it lists are exactly those whose `letterFromPercentage()` differs between them, a
      letter on one side and no grade on the other counting as a difference.
      **Mutation-proved**: a list built from percentages instead of letters goes red.
- [x] The class averages equal the score grid's own class average for the same class, term and mode.
- [x] On a fixture class with two terms, each term other than the open one gets a line exactly when
      some letter in it changes, and the count on it is right.
- [x] Cancelling the confirmation writes nothing: `rev` unchanged after `flush()`.
- [x] In points mode the weight inputs are disabled, no weights-total line is drawn, the editor's
      title and opening sentence speak of points, and each category's share equals `pointsShare()`
      for it, the *no category* row included. A term with no points draws words, not *0%*.
- [x] The mode control and the confirmation's buttons measure ≥44px under the coarse pointer.
- [x] 👤 On the laptop and on the iPad, switching a real class to points and back reads clearly: what
      the confirmation says would change, and that the weights come back.
      *(The owner, 2026-10-04, on v161. The same sitting found the remove-category confirm still
      speaking weights in a points class, outside this row's Deliverables, and booked it as
      [WO-3.43](#wo-343--removing-a-category-moves-its-work-to-no-category).)*

**Traps** — **Do not compute the share on the screen.** `pointsShare()` is the answer. **Do not put
the mode in `localStorage`.** It is a grading decision about a class, so it lives in the document and
survives a device change. **Do not soften the confirmation into a toggle.** A mode change moves every
grade in the class at once. **Do not import the grade engine into `src/categories.js`.**
`src/grade-engine.js` imports `src/categories.js`, so the reverse import closes a loop, and this repo
has refused every one of those so far. The editor's file is a leaf on purpose. The share lines and the
confirmation, which need `pointsShare()`, `classGrade()` and `letterFromPercentage()`, live in a
module `src/categories.js` does not import, and are called from `src/shell.js`.

## WO-3.32 — a score cell can carry a note

**Ship** — · **Status** ✅ DONE — 2026-10-04 · **Size** M · **Depends on** WO-3.5 — the grid whose cells this annotates
**Closes roadmap** *(no box. Owner-requested, 2026-10-02.)*

**Booked 2026-10-02**, owner-directed, from the same sitting as WO-3.30. A revised essay, a
conference, *turned in after the absence*: the reason behind a score has nowhere to go today. **It
goes first of the pair** so that [WO-3.33](#wo-333--a-changed-score-cell-keeps-what-it-was)'s history
holds notes from its first entry.

**The precedent is the attendance mark.** *"Any mark may carry a `note`"*, optional and absent where
unused (`docs/data-model.md`, the mark cell rule). A score cell gets the same field on the same terms.

**Deliverables**
- **An optional `note` on a score cell**, absent where unused, and never an empty string left behind
  by clearing it. A note can sit on any cell, including a blank, a `missing` or an `excused`. The
  grade engine does not read it.
- **Add, read, edit and clear it from the score grid without leaving the grid.** A cell with a note
  shows a discreet mark. The note also shows on student detail beside its assignment. The Surface is
  undrawn: draw it first under `design/mockups/PROTOCOL.md`, or the dispatch rules it is small enough
  not to need one.
- **Under the projector, a score note is absent**: not in the DOM, and its mark is gone too, in
  presentation mode on every screen that draws it. That holds **whatever attendance-mark notes do**
  (the owner's ruling, 2026-10-02, before dispatch). The score grid is the screen most likely to be on
  the wall, and a note is free text about one student. If mark notes turn out to show on the
  projector, the implementer records that as a finding and does not change attendance here.
- **The note goes nowhere outside the app.** No merge field resolves it (the whitelist already
  refuses it, and a check says so). The printed grade sheet leaves it out. It is in the backup. If
  `privacy.html` and `docs/FERPA.md` list what a backup holds, both gain it **in the same sitting**,
  per the rule at the top of each file.

**Acceptance**
- [x] A note added, edited and cleared from the grid round-trips through the document, and clearing
      it removes the key.
- [x] Adding or changing a note changes no grade on any screen.
- [x] A cell with a note shows the mark, and student detail shows the note beside its assignment.
- [x] In presentation mode no note text and no note mark is in the DOM, on the grid or on student
      detail. **Mutation-proved**: a note rendered regardless of the mode goes red.
- [x] `{{score.note}}` and every path into a cell are refused by the merge-field resolver, and the
      printed grade sheet contains no note text.
- [x] A backup written before this lands restores unchanged, and a year with notes round-trips.
- [x] Keyboard entry in the grid is unchanged: Tab, the arrows and Enter move exactly as before, and
      no shortcut used for flags is taken by the note.
- [x] 👤 On the iPad, adding a note to a cell and reading it back works under a thumb. *(The owner,
      2026-10-04, on v163 from the dev server, on the laptop and the iPad.)*

**Traps** — **Do not open the note on a keystroke the grid already uses.** Score entry is the fast
path. **Do not mirror the note into the log.** One note in two places is two records, the same reason
a tardy's time lives in the mark cell and nowhere else.

**Built 2026-10-04** — the record is `.claude/dispatch/WO-3.32-result.md` and `TESTING.md` § WO-3.32.
Four things in it are rulings the work order left to the dispatch, and one is a finding.
- **The Surface was ruled too small to draw.** The note panel is the attendance history dialog's
  write block (`src/attendance.css` `.attendance-report-write`, the mark note's own home) lifted value
  for value — indigo, a 5px left rail — because it is the same act one screen over; the mark is an
  8px indigo corner at the cell's top *left*, since the top right is the flag glyph's. A drawing would
  have answered no question the lift had not. `src/scores.css` says so at the rule.
- **The note opens on a *Note* button in the flag bar and on no key**, so it carries no letter and
  the key legend gains no row. Every keystroke in its field saves; *Done* hands focus back to the
  cell; *Remove note* takes the key off; entering another cell shuts it.
- **One module asks the mode**: `src/score-notes.js`'s `visibleNoteOf()` answers `''` under
  presentation mode, the grid and the detail card both read through it, and `src/detail.js` still
  imports nothing from `src/supports.js`. **`flipPresentationMode()` now repaints the score grid and
  student detail unguarded by the current view**, the only entries there that are — a hidden view is
  still a DOM, and the grid's `title` is the note word for word. M2 proved it: with the grid's repaint
  deleted, the *detail* check went red too, on the grid's hidden cells.
- **A note survives every other write.** `writeCell()`, ⌫, *Clear* and the past-due prompt all carry
  it across, a cell holding only a note is `{ v: null, note }` (ungraded, and not *entered* on the
  assignment list's count), and clearing the last note on a blank deletes the key and an emptied
  column with it.
- **Finding, not changed (the owner's ruling): attendance-mark notes do show under the projector.**
  `src/attendance.js`'s `cellFor()` puts a mark's note on the register cell's tooltip and accessible
  name, and the history dialog's write block puts it in a field, and neither asks
  `presentationMode()`. Whether that should change is a work order of its own.

## WO-3.33 — a changed score cell keeps what it was

**Ship** — · **Status** ✅ DONE — 2026-10-04 · **Size** M · **Depends on** WO-3.32 — the note a history entry carries
**Closes roadmap** *(no box. Owner-requested, 2026-10-02.)*

**Booked 2026-10-02**, owner-directed. English runs on revision, and today a revision overwrites the
score: *72, revised to 88* is lost the moment the 88 is typed, though that rise is exactly the delta
the praise column exists for. **The history is of the whole cell, not of the score.** Each earlier
version is the cell as it was, with its value, flag and note, so *Missing → Late, 70 → 88* is kept
with no separate flag tracking.

**Deliverables**
- **Every write to a score cell stamps `at`**, a local ISO timestamp with its offset, the mark cell's
  rule. A cell written before this lands has no `at`, and that is valid.
- **Overwriting a cell pushes its previous value, flag, note and `at` onto `was`**, oldest first.
  Only the current fields count toward any grade. `was` is absent until the first change.
- **A write within five minutes of the cell's last write replaces it without pushing**, so
  correcting a typo leaves no history entry. Five minutes is measured from the current cell's `at`,
  and a cell with no `at` always pushes. *(The owner's ruling, 2026-10-02, before dispatch.)*
- **The score grid marks a cell that has history**, and student detail shows the trail under its
  assignment: *Missing (Sep 14) → Late, 70 (Sep 20) → 88 (Oct 1)*. *(The owner's ruling, 2026-10-02.)*
  The history mark has to read as different from WO-3.32's note mark at a glance, since one cell can
  carry both. **Neither shows under the projector** *(the owner's ruling, 2026-10-04, at dispatch)*:
  in presentation mode the grid's history mark and student detail's trail are **absent from the
  page**, not dimmed or counted. That is WO-3.32's treatment of the note mark and the note, and
  `flipPresentationMode()` already repaints the grid for it. The mark says only that a score changed;
  hiding it is the direction that discloses nothing about one student on a wall.
- **Nothing reads history but student detail.** No signal rule, merge field, grade or print. What
  history means for signals is parked in `plans/future-features.md` § Gradebook as a ruling for the
  owner, not a detail for this work order.

**Acceptance**
- [x] Changing a cell's score, flag or note more than five minutes after its last write pushes the previous
      cell onto `was` with its `at`, and the current cell carries a new `at`.
- [x] A change within five minutes replaces the cell and pushes nothing, checked on the harness's
      shifted clock either side of the boundary.
- [x] Every grade on every screen is byte-identical to the same document with every `was` removed.
      **Mutation-proved**: an engine that reads a history entry goes red.
- [x] Student detail lists the history in order, with dates, and a cell with no history shows nothing
      extra.
- [x] A cell with history carries the grid's history mark and a cell without it does not, and a cell
      with both a note and history shows both marks, told apart. In presentation mode neither the
      history mark nor the student-detail trail is in the DOM.
- [x] A backup written before this lands restores unchanged, and a year with history round-trips.
- [x] No exported reader outside the detail screen's own path returns `was`, and a sweep check keeps
      it that way.
- [x] 👤 On the iPad, revising a score and opening the student shows the history reading clearly.
      *(The owner, on hardware at v164, 2026-10-04: the teal ring reads at arm's length and apart
      from the note corner, the trail reads oldest first with dates, and presentation mode removes
      both.)*

**Two rulings the build forced, the owner's, 2026-10-04.** The Traps line below assumed the grid
commits on leaving a cell; it saves on every keystroke, so the implementer made two calls and the
owner kept both. **Typing a score back undoes the saved step**: inside five minutes, a write equal to
the newest `was` entry pops it rather than recording *90 → 90*. That departs from the letter of
Deliverables 1 and 3, and is ruled the intent. **A cleared cell with a past is kept**, blank and
carrying its history, where WO-3.5 deleted the key; such cells count in *N scores*, the delete
confirmations and the roster count, as a blank cell with a note already did.

**Traps** — **Do not push on every keystroke.** The grid commits on leaving a cell, and the store's
save is debounced, so a version is a commit, not a key. **Do not let a signal read `was`.** CLAUDE.md
records that the turnaround rule cannot see a grade recovery because *a score is not dated*. That
stops being true here, and changing what a rise means is the owner's ruling, not this work order's.

## WO-3.34 — student detail draws a points class in a weighted class's words

**Ship** — · **Status** ✅ DONE — 2026-10-03 · **Size** S · **Depends on** WO-3.30 — the `classGrade()` shape and `gradingModeOf()` this reads
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.30's verdict. The verifier passed WO-3.30 on all
nine lines and found one defect outside them, and the implementer and verifier both listed wording
that WO-3.31 does not cover. **None of it can be reached today**, because nothing writes
`gradingMode` until [WO-3.31](#wo-331--the-categories-editor-offers-total-points). WO-3.31 depends on
this row so that the control does not ship before the screens are correct.

**The defect.** In a points class, a category holding only extra credit (possible 0, earned > 0)
counts toward the grade but draws as empty on student detail. The verifier's case: Tests 15/20 plus
a Bonus category scored 2/0 grades at 85%. `breakdown()` in `src/detail.js` decides a row is empty
on `category.percentage === null` and prints "—", while `contributionCents()` keys on
`contribution !== null` and gives the Bonus row 10.00. The column on screen adds up to 75.00 under
an Overall of 85.00%. The same happens to the `no category` row when all its work is extra credit.
This breaks the promise WO-3.30's third Deliverable makes for a detail screen. Its Acceptance line 3
tests the engine only, which is why it passed.

**Deliverables**
- **A row that contributes is drawn as contributing.** The test for an empty row agrees with
  `contributionCents()`. An extra-credit-only row shows its earned points over 0, no category
  percentage, and its cents in *Contributes*, so the column adds up to the Overall.
- **The breakdown speaks the class's mode.** In points mode the *Weight* column, the "its N% is
  shared across the others" sentence for an empty category, and the "counts at" footnote do not talk
  about weights. Points mode shows each category's share of the points, from the grade's own
  `effectiveWeight`. Weighted mode draws exactly as today.
- **The scores hint in `index.html`** stops saying "Until the weights total 100% there is no grade
  at all" without qualifying it to weighted classes.
- **`src/assignments.js` stops calling uncategorized work "counted by nothing"** in a points class.
  It is counted there, by WO-3.30's ruling. Weighted wording stays.
- **`copyClass()` carries `gradingMode`.** It copies an explicit field list today, so a copied points
  class becomes weighted. The mode is a grading decision about the class, like its weights, which the
  copy already keeps. *(This is the booking's proposal. If the owner rules the other way at dispatch,
  the Deliverable becomes a sentence in the copy dialog saying the copy is weighted.)*

**Acceptance**
- [x] In a points fixture with an extra-credit-only category, student detail's *Contributes* column
      sums to the Overall to the cent, and that row shows its earned points and its cents.
      **Mutation-proved**: putting the empty test back on `percentage === null` goes red.
- [x] The same holds for a `no category` row whose only graded work is extra credit.
- [x] A weighted class's student detail is byte-identical before and after, on the harness's
      existing fixtures.
- [x] In a points class, no text on student detail, in the scores hint, or on the assignments screen
      calls the grade weighted or says uncategorized work counts for nothing.
- [x] Copying a points class gives a points class, and copying a weighted class writes no
      `gradingMode` key.

**Traps** — **Do not compute a share on the screen.** `effectiveWeight` and `contribution` come from
`classGrade()`, and `pointsShare()` is the editor's. **Do not change the engine's returned shape.**
WO-3.30 just proved it identical in weighted mode across 393,780 comparisons. **Do not seed
`gradingMode` on the copy of a weighted class.** An absent key is weighted.

**Landed 2026-10-03**, all five lines verified by a fresh verifier. **One change goes past the
Deliverables as written, and the verifier ruled it in scope:** in a points class the assignments
screen's category group heads draw no `weight N%` chip, and the editor's category options and the
copy dialog's category labels drop their ` — N%` suffix. Line 4 could not pass without it — the chip
is text on the assignments screen calling the grade weighted. Weighted classes are unchanged. The
verdict also found six things outside this row's list; they are booked as
[WO-3.35](#wo-335--the-student-csv-and-an-extra-credit-only-student-read-a-points-class-wrong) and
[WO-3.36](#wo-336--the-score-grid-the-grade-sheet-and-the-unfiled-group-still-speak-weights-in-a-points-class),
and WO-3.31 depends on both.

## WO-3.35 — the student CSV and an extra-credit-only student read a points class wrong

**Ship** — · **Status** ✅ DONE — 2026-10-03 · **Size** S · **Depends on** WO-3.34 — `rowIsEmpty()` and the points-mode breakdown this follows
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.34's verdict. **Unreachable today**, like
WO-3.34 itself, because nothing writes `gradingMode` until
[WO-3.31](#wo-331--the-categories-editor-offers-total-points), which depends on this row.

**The defect, confirmed by the verifier.** `studentCsv()` in `src/detail.js` (~972) still decides a
category row is empty on `category.percentage === null`. In a points class an extra-credit-only
category, or the `no category` row, is written as "nothing graded — weight redistributes" with no
*Contributes* cell, so the file's column does not add up to its *Overall grade* — the defect
WO-3.34 fixed on screen, one export away. The file also keeps the weighted headers `Weight %` and
`Counts at %` in a points class.

**The second case.** A student whose only graded work in a points class is extra credit has possible
0, so there is no overall grade and no contributions, and `rowIsEmpty()` draws the Bonus row
"nothing graded in it yet" over a cell scored 2. That sentence is false. What the row should say
instead is this row's judgment; *nothing graded* is not it.

**Deliverables**
- **The CSV uses the screen's empty test** — `rowIsEmpty()` or one function both call, never a third
  copy — and writes a contributing row's cents, so the column adds up to the Overall.
- **The CSV speaks the class's mode**, with the same columns the screen draws in points mode.
- **An extra-credit-only student's rows say what is true**, on screen and in the CSV.

**Acceptance**
- [x] In WO-3.34's points fixture, the student CSV's *Contributes* column sums to its *Overall grade*
      to the cent, for both the extra-credit category and the `no category` row. **Mutation-proved.**
- [x] A points-class CSV contains no `Weight %`, `Counts at %` or "redistributes".
- [x] A weighted class's CSV is byte-identical before and after, on the harness's existing fixtures.
- [x] A points-class student whose only graded work is extra credit is not told, on screen or in the
      CSV, that nothing is graded.

**Traps** — **Do not compute a share or a sum in the export.** Every figure comes from
`classGrade()` and `detailModel()`. **Do not change the engine's returned shape.**

**Landed 2026-10-03**, all four lines verified by a fresh verifier. **One change goes past the
Deliverables as written, and the verifier ruled it in scope:** `src/grade-engine.js` changed one
message's words. A points grade with earned points over nothing possible now says *"The only work
graded so far is extra credit, so there is no grade yet for it to add to"* instead of *"There is no
graded work yet"*. The reason code stays `no-graded-work`, and the returned shape is unchanged. Line 4
could not pass without it, because student detail prints that message in three places. The verdict
found two cases outside this row, both booked as
[WO-3.37](#wo-337--the-quiet-list-says-an-extra-credit-only-student-has-no-graded-work) and
[WO-3.38](#wo-338--a-bonus-scored-0-reads-as-nothing-graded), and WO-3.31 depends on both.

## WO-3.36 — the score grid, the grade sheet and the unfiled group still speak weights in a points class

**Ship** — · **Status** ✅ DONE — 2026-10-03 · **Size** S · **Depends on** WO-3.34 — the points-mode wording this matches
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.34's verdict: the wording that row's list did not
name. **Unreachable today**; WO-3.31 depends on this row so the control does not ship before these
screens are right.

**Deliverables**
- **The score grid** (`src/scores.js`): in a points class the summary line does not read
  `Weights total N%` (~726), and the column category chips do not carry a weight (~460). The
  unbalanced-weights banner (~660) cannot fire there, since a points class has no such refusal;
  confirm that rather than assume it.
- **The grade sheet** (`src/grades-report.js`): read it in a points class for weight wording, and fix
  what it finds. WO-3.34's implementer did not read it.
- **The *Not in a category* group on the assignments screen** is red because "this costs the
  assignment" (~608). In a points class that is false — unfiled work counts — so it is not drawn as a
  cost there. Weighted stays red.
- **Stale comments in `src/assignments.js`** that call uncategorized work "counted by nothing"
  (~609, ~1195) say which mode they mean. The one at ~27 is about an id from another class, not about
  unfiled work; read it before touching it.

**Acceptance**
- [x] In a points class, no text on the score grid or the grade sheet calls the grade weighted or
      prints a weight. **Measured**, not read.
- [x] The *Not in a category* group is not styled as an error in a points class, and is unchanged in
      a weighted one.
- [x] A weighted class's score grid and grade sheet are unchanged on the harness's existing fixtures.

**Traps** — **Weighted wording stays exactly as it is.** This is a points-mode branch, not a
rewording. **Do not compute a share on the screen**; `pointsShare()` and `effectiveWeight` exist.

## WO-3.37 — the quiet list says an extra-credit-only student has no graded work

**Ship** — · **Status** ✅ DONE — 2026-10-03 · **Size** S · **Depends on** WO-3.35 — the engine message this matches
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.35's verdict. **Unreachable today**, because
nothing writes `gradingMode` until [WO-3.31](#wo-331--the-categories-editor-offers-total-points),
which depends on this row.

**The defect, found by the verifier.** `quietSentence()` in `src/signals.js` (~2214) prints
*"has no graded work yet"* whenever the grade's `percentage` is null. In a points class, a student
whose only graded work is extra credit has a null percentage and graded work. WO-3.35 fixed the same
false sentence on student detail and in the engine's own message. The quiet list on the signals
screen still says it.

**Read this at dispatch.** A null percentage has other causes too. In a weighted class whose weights
do not total 100% there is no grade, and the same sentence says *"no graded work"* over a class full
of scores. Find out whether the quiet list can reach that case today. If it can, the defect predates
points mode, and this row fixes it as well.

**Deliverables**
- **The quiet row's standing says why there is no grade**, from what `classGrade()` already returned
  (its `reason`, or its `message`). It does not recompute anything. *"Has no graded work yet"* is
  printed only when that is the reason.
- **A student with a grade reads exactly as today.**

**Acceptance**
- [x] In a points fixture, a quiet student whose only graded work is extra credit is not told they
      have no graded work. **Mutation-proved**: putting the test back on `percentage === null` alone
      goes red.
- [x] Every quiet row the harness's existing fixtures draw is byte-identical before and after.
      *(Left open by the implementer, 2026-10-03, for a ruling — see `TESTING.md` § WO-3.37. The
      weights-unbalanced case **is reachable today**, and the existing fixtures reach it: of 600 quiet
      rows captured across a full run before the change, 92 are in classes whose weights total 0%,
      59.9% or 95%, and 5 are the extra-credit-only student line 1 is about; those 97 change, as
      "Read this at dispatch" and line 1 ask. The other 503 — every graded row and every genuine
      nothing-graded row — are byte-identical. The line cannot be true as written and the paragraph
      above it both be honoured.)*
      *(**Ruled by the owner, 2026-10-03: the line is re-read as it was meant** — every quiet row is
      byte-identical before and after **except where the grade's `reason` is not `no-graded-work`, or
      is that reason with the engine's extra-credit-only message**; those rows change to say why.
      The verifier checks the capture against this reading, not the literal line. **And a class with
      no categories and nothing graded keeps the new wording**, *"The category weights total 0%, so
      there is no grade yet."*, the owner's ruling the same day.)*
      *(**Provenance, recorded at the tick:** the owner gave this ruling but did not write the
      paragraph above, and nothing in the status trail recorded it, so the verifier held the box for
      it. The owner confirmed both halves in the verdict session, 2026-10-03, and the box was ticked
      on that confirmation and on the verifier's static proof against this reading. The 0% wording
      is accepted here because it is the engine's own message; that the engine says it about a
      class with no categories at all is
      [WO-3.41](#wo-341--a-class-with-no-categories-is-told-its-weights-total-0)'s to fix.)*

**Traps** — **Do not re-run the grade or read the scores in `src/signals.js`.** The answer is
already on the grade object. **A quiet row is not a rule**, and nothing fired, so this adds no
measurement to the row.

## WO-3.38 — a bonus scored 0 reads as nothing graded

**Ship** — · **Status** ✅ DONE — 2026-10-03 · **Size** S · **Depends on** WO-3.35 — `rowIsEmpty()` and the extra-credit-only wording this extends
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.35's verdict. **Unreachable today**, because
nothing writes `gradingMode` until [WO-3.31](#wo-331--the-categories-editor-offers-total-points),
which depends on this row.

**The defect, found by the implementer and confirmed by the verifier.** Extra credit is work worth
0 points. A piece of it scored 0 adds 0 earned and 0 possible, the same as a blank. So the engine
cannot tell a bonus graded 0 from a bonus not graded. A student whose only graded work is a 0 on
extra credit is told *"There is no graded work yet"*, and their Bonus row reads *"nothing graded in
it yet"* over a cell scored 0. WO-3.35 could not fix this, because the fix needs a fact the engine
does not return, and that row forbade changing the engine's returned shape.

**Open — the owner's ruling, at dispatch.** Where does "a scored piece exists" come from?
- **(a)** The engine adds a field, such as a count of graded pieces on each category. This adds to
  the returned shape. WO-3.30 proved that shape identical in weighted mode, so the dispatch has to
  prove again that every weighted reader is unchanged.
- **(b)** Student detail reads it from the rows it already lists, and the engine is untouched. The
  CSV has to use the same function, so the screen and the file cannot disagree.
- **(c)** Leave it. A 0 on extra credit adds nothing either way, and the sentence is wrong only in
  how it describes the student. If so, this row is 🚫 STRUCK with that ruling as its note.

**Ruled 2026-10-03, the owner, at dispatch: (b).** The student detail screen works out "this bonus
has been scored" from the rows it already lists, and the grade calculation and what it hands back
stay untouched. The CSV export calls the same function, so the screen and the file cannot disagree.
A blank cell never counts as a scored 0, and the screen computes no grade.

**Ruled 2026-10-03, the owner, after the implementer returned — three readings, before the verdict.**
- **"Scored" means what `isUngraded()` in `src/scores.js` says it means.** A bonus marked `missing`
  reads as scored 0; one marked `excused` stays unscored. This is the implementer's reading of the
  brief's "a score is present", and it is now the ruling. No fixture covers `missing` yet.
- **The quiet list stays as it is.** It still says *"has no graded work yet"* for a student whose only
  work is a bonus scored 0, and that wording is accepted for that case. Nothing to book, and
  `src/signals.js` is not this row's to touch.
- **Two known limits, noted here and not booked.** A +2 and −2 pair of bonuses nets to zero and keeps
  the old no-grade sentence. A bonus scored 0 that sits in no category gets no row of its own.

**Deliverables** *(for (b), as ruled)*
- **A row holding a scored 0 on extra credit is not called empty**, on screen and in the CSV, and it
  says what is true about it.
- **The no-grade message** follows the same fact, wherever it is printed.

**Acceptance**
- [x] In a points fixture, a student whose only graded work is a bonus scored 0 is not told, on
      screen or in the CSV, that nothing is graded. **Mutation-proved.**
      *(2026-10-03: three checks in `verify/points-grade.mjs`, mutations M1–M4 — `TESTING.md` § WO-3.38.)*
- [x] A weighted class's student detail and CSV are byte-identical before and after, on the harness's
      existing fixtures.
      *(2026-10-03: 45 weighted renders captured on `HEAD` and on the change and compared by script —
      every CSV byte-identical raw; every page identical once the run-minted avatar class and pass clock
      times are normalised. `TESTING.md` § WO-3.38.)*

**Traps** — **Do not compute a grade on the screen.** **A blank is still ungraded**: a cell with no
score must never count as a scored 0, which is the rule the whole gradebook rests on.

## WO-3.39 — the score grid's help explains weights to a points class first

**Ship** — · **Status** ✅ DONE — 2026-10-03 · **Size** S · **Depends on** WO-3.36 — the points-mode score grid this paragraph sits under
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.36's verdict. **Unreachable today**, because
nothing writes `gradingMode` until [WO-3.31](#wo-331--the-categories-editor-offers-total-points).
**WO-3.31 does not depend on this row**: the paragraph is true in both modes, so a points class that
reads it is told nothing false. This row is about which half it reads first.

**What is there.** The score grid's second help paragraph (`index.html`, ~1346, *"The grade beside
each name is live"*) is static and shared. It spends most of its length on the weighted rule:
*"In a class graded by weighted categories…"*, the empty-category redistribution, and *"until the
weights total 100% there is no grade at all"*. Its last sentence then covers a points class. WO-3.34
wrote it that way, and WO-3.36's harness skips it on purpose, because its Traps said to branch rather
than reword shared text. So a points class has no weight wording on the grid except in its own help.

**Open — the owner's ruling, at dispatch.**
- **(a)** A class draws only its own mode's half. The paragraph is split into two blocks and the
  screen shows one, from `gradingMode`, so WO-3.36's measurement can stop skipping it.
- **(b)** Leave it. The paragraph explains both modes, and a teacher deciding between them is
  better served by reading both. If so, this row is 🚫 STRUCK with that ruling as its note.

**Deliverables** *(for (a))*
- **The paragraph is split** so the weighted sentences and the points sentence can be shown apart.
  The sentences before the split (*live*, *can go over 100%*, *extra credit*) stay shared.
- **The screen shows the block for the class's mode** whenever the grid is drawn, including after a
  class switch.
- **WO-3.36's points measurement stops skipping the help** in `tools/verify/points-grade.mjs`.

**Acceptance** *(for (a))*
- [x] In a points class the score grid's help has no weight wording. **Measured**, by the existing
      WO-3.36 check with its skip removed. **Mutation-proved**: drawing both blocks goes red.
- [x] A weighted class's help reads word for word as today.
- [x] Switching from a points class to a weighted one and back draws the right block each time.

**Traps** — **Do not reword the weighted sentences.** They are moved, not rewritten. **Do not
compute anything for the help text.** It reads the mode and nothing else.

## WO-3.40 — two comments say misfiled work is invisible on the list

**Ship** — · **Status** ✅ DONE — 2026-10-04 · **Size** XS · **Depends on** WO-3.36 — the comment it extended
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.36's verdict. A comment fix and nothing else, so it
rides with the next work order that has `src/assignments.js` open.

**The defect.** Two comments in `src/assignments.js` argue for the cross-class copy rule (~27, in the
file header, and ~1199, above the duplicate function). Both say an assignment carrying another
class's `categoryId` would be *"invisible on B's list"*. That is no longer true.
`renderAssignments()` gathers every assignment whose category this class lacks into the *Not in a
category* group (~620), so such an assignment would be listed there. WO-3.36 added accurate
points-mode wording to both comments and, by its brief, left the visibility claim alone.

**Deliverables**
- **Both comments say where such an assignment would appear**: under *Not in a category*, filed
  nowhere this class can name. Keep the rest of the argument. It is still sound: a category removal
  in the class it came from would still destroy it, under a dialog naming the wrong class.
- **`src/shell.js` ~4512** says a misfiled copy *"is invisible on screen because both look identical
  on the list"*. Read it and decide whether it means the same thing. Fix it only if it does.
- **`src/detail.js` ~963 stops saying the banner names the weights' total.** *Added 2026-10-03,
  owner-directed, out of WO-3.41's verdict.* The comment above the breakdown ends *"The banner above
  says what the weights come to and where to fix it."* Since WO-3.41, a class with no categories gets
  its own banner sentence, which names no total. Say the banner explains why there is no grade:
  either the weights' total, or that the class has no categories yet. Keep the rest of the comment;
  its reason for drawing no breakdown still holds.

**Acceptance**
- [x] Neither comment in `src/assignments.js` says a misfiled assignment is invisible on the list.
- [x] The comment above the breakdown in `src/detail.js` no longer says the banner always names the
      weights' total.
- [x] No line outside a comment moves: `git diff` touches comment lines only, and `sw.js`'s `CACHE`
      is not bumped, because a comment changes nothing a device receives.
      *(Met, and it costs a red sweep: `wo-sweep.mjs` § 9 compares file names, so it fails on these
      comment-only edits until the next `CACHE` bump. The owner accepted the red at commit,
      2026-10-04, and booked WO-1.60 for the check. WO-3.44 was booked from the same verdict for
      the `src/shell.js` comment the implementer ruled out of scope. **Settled by
      [WO-1.60](phase-1-shell-store-roster.md#wo-160--a-comment-only-change-to-a-shell-file-turns-the-sweep-red)**:
      a `Shell-Cache` trailer now excuses a comment-only commit, but this one has none and cannot
      gain one, so its red clears at the next `CACHE` bump.)*

**Traps** — **Do not change the copy rule.** The comments argue for it, and it stands.

## WO-3.41 — a class with no categories is told its weights total 0%

**Ship** — · **Status** ✅ DONE — 2026-10-03 · **Size** S · **Depends on** WO-3.37 — the quiet row that now prints the engine's message
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.37's verdict. Reachable today, in a weighted class.

**The defect.** `weighted()` in `src/grade-engine.js` (~255) tests `isBalanced()` before anything
else, and a class with no categories totals 0%, so it answers `weights-unbalanced` with *"The
category weights total 0%, so there is no grade yet."* That sentence is true, but it is not why a
teacher would think there is no grade. The class has not been set up. Since WO-3.37 the quiet list
prints the engine's message as written, and student detail's banner (`src/detail.js` ~837) already
did, so both say *0%* about a class that has no categories to weigh.

**Deliverables**
- **The engine's message for a class with no categories says that**, for example *"This class has
  no categories yet, so there is no grade."* The wording is the dispatch's to settle; it is written
  once, in `src/grade-engine.js`, and every reader prints it.
- **The `reason` stays `weights-unbalanced`.** Readers branch on it (`src/detail.js`,
  `src/scores.js`, `src/grades-report.js`), and a class with no categories still has no grade for
  that reason. Only the message changes.
- **A class with categories whose weights do not total 100 reads exactly as today.**

**Acceptance**
- [x] A weighted class with no categories, on student detail and in the quiet list, is not told its
      weights total 0%. **Mutation-proved**: putting the old message back goes red.
      *(The engine now says "This class has no grading categories yet, so there is nothing for a grade
      to be an average of." — the score grid banner's own clause. Read on both screens by a block at
      the foot of `verify/points-grade.mjs`; the old message put back turns all three of its checks
      and case 8's fourth direction red. `TESTING.md` § WO-3.41.)*
- [x] Every row the harness's existing fixtures draw for a class that has categories is
      byte-identical before and after.
      *(The only new path is taken when `categoriesOf(cls)` is empty; with categories the message is
      the same expression as before. Carried by the unedited case 8 checks (95%, 94.8%), WO-3.37's 90%
      quiet row, and a new check that categories all weighing 0 still read "total 0%" — full run
      1687 of 1687.)*

**Traps** — **Do not change the order of the engine's tests**, and do not report a class with no
categories as `no-graded-work`: work unfiled in a weighted class counts for nothing, so "no graded
work" would be false there, which is the sentence WO-3.37 removed.

---

## WO-3.42 — the score grid and grade sheet tell a screen reader a bonus scored 0 is nothing graded

**Ship** — · **Status** ✅ DONE — 2026-10-04 · **Size** S · **Depends on** WO-3.38 — `gradedPieces()` and the zero-bonus message this carries to two more screens
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.38's verdict. **Unreachable today**, because
nothing writes `gradingMode` until [WO-3.31](#wo-331--the-categories-editor-offers-total-points).
WO-3.31 does **not** depend on this row: the wrong sentence is heard, not seen, and it describes the
student wrongly without changing any number.

**The defect, found by the verifier.** WO-3.38 fixed student detail and its CSV. Two more places
print the engine's no-grade message as an accessible name on the em dash in the grade column:
`gradeContent()` in `src/scores.js` (~560) and the grade sheet in `src/grades-report.js` (~446).
For a points-class student whose only graded work is extra credit scored 0, both still read
*"No grade — There is no graded work yet."* That is false, and it is what WO-3.38's Deliverable meant
by "wherever it is printed". Ruling (b) kept WO-3.38 to student detail, so it was left.

**Open — the owner's ruling, at dispatch.** Where does the shared answer live?
- **(a)** Lift `gradedPieces()` and `noGradeMessage()` out of `src/detail.js` into a small module that
  reads no grade arithmetic, and have all three screens import it. One copy, so the three screens
  cannot disagree. The engine stays untouched, as ruling (b) required.
- **(b)** Reverse WO-3.38's ruling (b) for this fact: the engine hands back the graded-piece fact, and
  every reader, `src/detail.js` included, uses it. This changes the engine's returned shape, so the
  dispatch must prove every weighted reader unchanged, as WO-3.38's option (a) said.
- **(c)** Leave it, and strike this row with that ruling as its note.

**Ruled 2026-10-03, the owner, at dispatch: (a).** `gradedPieces()` and `noGradeMessage()` move out
of `src/detail.js` into a small module that does no grade arithmetic; `src/detail.js`,
`src/scores.js` (`gradeContent()`) and `src/grades-report.js` import it. The engine is untouched, so
WO-3.38's ruling (b) holds. Options (b) and (c) are declined.

**Deliverables**
- **The score grid's and the grade sheet's accessible name for a missing grade** follow the same fact
  student detail does, from the same function, never from a second copy.
- **A weighted class's grid and grade sheet are byte-identical**, accessible names included.

**Acceptance**
- [x] In a points fixture, a student whose only graded work is a bonus scored 0 is not told by the
      score grid's or the grade sheet's accessible name that nothing is graded. A blank or excused
      bonus still is. **Mutation-proved.**
- [x] A weighted class's score grid and grade sheet are byte-identical before and after, on the
      harness's existing fixtures.

**Traps** — **Do not compute a grade on the screen**, and **a blank is still ungraded**, exactly as
WO-3.38. **The quiet list is not this row's**: the owner ruled on 2026-10-03 that `src/signals.js`
keeps its sentence for this case. **A second copy of `gradedPieces()` is the defect this row
exists to avoid**, so under (a) `src/detail.js` must import the lifted function rather than keep its own.

---

## WO-3.43 — removing a category moves its work to *no category*

**Ship** — · **Status** ✅ DONE — 2026-10-04 · **Size** S · **Depends on** WO-3.31 — the control that makes a points class reachable, and the mode the dialog now has to speak
**Closes roadmap** *(no box. Owner-directed, 2026-10-04.)*

**Booked 2026-10-04**, owner-directed, out of WO-3.31's 👤 reading. **Reachable today**: since
WO-3.31 a teacher can put a class on total points, and the remove-category confirm in that class
reads, word for word:

> Removing "Essays" from English III (A) takes the work filed under it as well. This cannot be
> undone, and a backup file is the only way back. If you only want it to stop counting, set its
> weight to 0 instead — the assignments stay and the grade stops using them.
>
> 1 assignment and 5 scores · The remaining categories keep the weights they have, so this class
> totals 50% until you set them.

In a points class the weight field is disabled, a weight of 0 does not stop a category counting, and
there is no weight total. The verifier predicted it and the owner met it on the laptop.

**The ruling — the owner, 2026-10-04.** Removing a category **no longer destroys its work, in either
mode.** The assignments and their scores stay, and the work goes to *no category*, which already
exists and already means the right thing in each mode (`docs/data-model.md`, the 2026-10-02 ruling):
- **Weighted:** the work counts for nothing until it is filed again, and the remaining categories keep
  the weights they have, so the class totals less than 100% and its grades are provisional until the
  teacher sets them. *"That is what I thought we had set up."* The weights line in the dialog stays.
- **Total points:** the work still counts. It just isn't categorized, so it shows in the *no
  category* row.

**This reverses WO-3.1's third Deliverable** — "removing a category warns about the assignments it
takes with it" — and the long comment above `removeCategory()` in `src/categories.js` that argues the
cascade. That comment's case against leaving work behind was that an orphan is **silent**. It no
longer is: the assignment list draws a *Not in a category* group (red in a weighted class, amber in a
points class, WO-3.36), the score grid and grade sheet name *no category*, and the points engine
counts it as a row. Rewrite the comment to say so, rather than deleting it. **The header comment of `src/assignments.js`
(~20–30) also says a category removal destroys the work** — it names `applyRemoval()` — and changes
in the same sitting.

**Deliverables**
- **`applyRemoval()` deletes the category and nothing else.** No assignment and no score column goes.
  Each affected assignment in this class has its `categoryId` set to `''`, so a backup never carries
  an id for a category that no longer exists. `''` is what an assignment created in a class with no
  categories already carries (`src/assignments.js`, ~920), so this is not a new value: not `null`,
  and not a deleted key. A `categoryId` that matches no category in its class
  already reads as *no category* everywhere, so the clearing is tidiness, not a change in meaning.
- **The confirm speaks the class's mode, and stops being a warning.** There is still a dialog when
  work is filed under the category, because the grade changes. It says where the work goes and what
  that does to the grade:
  - weighted: the work stops counting until it is filed under another category, and the remaining
    weights total N% until she sets them;
  - points: the work keeps counting, under *no category*, and grades don't change.
  The "cannot be undone, a backup file is the only way back" sentence, the "set its weight to 0"
  advice and the red danger styling go, in both modes. The button keeps naming the category.
- **The two announcements in `src/categories.js` that speak weights in a points class** say the
  points version too: the weights-total announcement in `renderTotal()` (~290, *"…not 100. Grades are
  provisional."*), and the add-category one (~437, *"…at 0 percent."*). The removal announcement says
  where the work went rather than counting what was destroyed.
- **The "Not in a category" notice on the assignment list** keeps its wording, but check it now reads
  right for work that arrived by removal. Its comment names the two ways in; removal is a third.
- **`docs/data-model.md`** loses any sentence saying removal cascades, and the *no category*
  paragraph names removal as the usual way in.

**Acceptance**
- [x] Removing a category that holds work leaves every one of its assignments in the document with
      `categoryId` equal to `''`, and every score column for them byte-identical. Nothing in another class,
      and no other category's work, moves. **Mutation-proved**: a removal that still deletes the
      assignments goes red.
- [x] In a weighted fixture, after the removal the class's `classGrade()` gives that work no weight,
      and the weights-total line reads the remaining total. The dialog's weights sentence names that
      same total.
- [x] In a points fixture, every student's `classGrade()` percentage is identical before and after
      the removal, and the work appears in the *no category* row.
- [x] The confirm's text in a points class contains no *weight*, *0%* or *backup*, and in a weighted
      class it contains no *backup* and no *set its weight to 0*.
- [x] The two announcements read the points wording in a points class, and the weighted wording,
      byte-identical to today's, in a weighted class.
- [x] 👤 On the laptop and the iPad, removing a category in each mode reads clearly, and the work is
      found again under *Not in a category* on the assignment list.

**Traps** — **Do not import the grade engine into `src/categories.js`.** `gradingModeOf()` lives in
`src/grade-engine.js`, and that file imports this one, so the reverse import closes a loop. Read
`cls.gradingMode === 'points'` directly, or move the sentences into `src/grading-mode.js`, which may
import both, and call it from `src/shell.js` as WO-3.31 did. **Do not keep a "delete the work too"
option.** The owner ruled for one behaviour, and a second button is how the destructive path comes
back. **Do not compute a share or a total on the screen.** The weights total is `weightTotal()`, which
the dialog already uses.

## WO-3.44 — a comment says a misfiled copy looks identical on the list

**Ship** — · **Status** ✅ DONE — 2026-10-04 · **Size** XS · **Depends on** WO-3.40 — the two comments it corrected
**Closes roadmap** *(no box. Owner-directed, 2026-10-04.)*

**Booked 2026-10-04**, owner-directed, out of WO-3.40's verdict. A comment fix and nothing else, so it
rides with the next work order that has `src/shell.js` open.

**The defect.** The comment above `assignments, screenNav` in the `window.planbook` seam
(`src/shell.js` ~4599) says the naive duplicate, which carried the source's `categoryId` across a
class boundary, and this build's duplicate are *"invisible on screen because both look identical on
the list"*. That is false when the target class has a category of the same name. This build files
the copy under the matching category. The naive copy carries a `categoryId` the target lacks, so
`renderAssignments()` lists it under *Not in a category*. They look the same only when the target has
no category that matches. WO-3.40's implementer read this comment, ruled it a different claim from the
two that work order fixed, and left it. The verifier agreed with that ruling and confirmed the
overstatement.

**Deliverables**
- **The comment says what a click can and cannot show.** When the target has a matching category,
  the two builds file the copy in different groups. What no click shows is that the copy carries the
  target's own ids and that `scores` grew no column for it. Keep the rest of the comment, including the
  breadcrumb half.

**Acceptance**
- [x] The comment no longer says the two duplicates always look identical on the list.
- [x] No line outside a comment moves: `git diff` touches comment lines only.

**Traps** — **Do not change the copy rule**, as WO-3.40's Traps said. **The `CACHE` question is
WO-1.60's**: if this rides with a work order that bumps `CACHE` for its own code, nothing more is
needed. Taken alone, it leaves `wo-sweep.mjs` § 9 red as WO-3.40 did, until WO-1.60 says otherwise.
*(WO-1.60 has said: option 1, the `Shell-Cache` commit trailer — and this work order's commit landed
before it, carries none, and stays red until the next `CACHE` bump.)*
*(`src/assignments.js` ~925, "invisible on every term's list", was the third comment named in
WO-3.40's verdict. It was read the day this was booked and is true: `assignmentsOf()` matches `termId`
exactly, so a `termId` of `''` is on no term's list. Nothing to fix there.)*

## WO-3.45 — a class tab on the assignment list or the score grid drops you on Attendance

**Ship** — · **Status** ✅ DONE — 2026-10-05 · **Size** S · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-04.)*

**Booked 2026-10-04**, owner-directed, from the owner's own use: *"When I am looking at calendars or
signals, and I click on another class, I land on the same screen for that class. That doesn't work
for assignments or scores."* **Placed next in the running order**, the owner's call.

**This reverses a ruling, not a bug.** `selectClass()` in `src/classes.js` (~733) records that every
class screen except the calendar and the concern list lands on Attendance on a class tap. Its reason
was *"a teacher tapping Period 3 while looking at Period 2's score grid is going to Period 3, not to
a column of Period 3's scores she did not ask for."* The owner has now ruled the other way for the
assignment list and the score grid. The tap means *same screen, different class* on four screens now.

**The owner's rulings, 2026-10-04**
1. **Assignments → another class's Assignments. Scores → another class's Scores.** Attendance stays
   on Attendance, as it already does.
2. **Student detail still lands on Attendance.** The student is not in the other class, so there is
   no "same screen" to land on.
3. **Nothing else moves.** A card on the home grid still opens a class on Attendance, and a reload
   still lands on Attendance (`REMEMBERED_AS` in `src/views.js` is unchanged). This is *same screen
   on a class switch*, not a per-class memory of the last screen used. That memory is still refused.

**Deliverables**
- **`selectClass()` keeps `assignments` and `scores` up** beside `calendar` and `signals`, and its
  comment says why the list grew and that `detail` is left off it on purpose.
- **`src/shell.js`'s `data-class-tab` branch paints the new class's assignment list or score grid**,
  through whatever chain already paints those screens on arrival. Do not add a second painter. The
  comment above the branch (~2443), which says the calendar and the concern list are the only screens
  of that kind, is corrected.
- **The score grid's search box and category pill reset on the tap**, as they do on every arrival
  (`resetScoreSearch()` and `resetScoreCategory()`, `src/shell.js` ~1157). A category pill is a
  class's own id, so A's means nothing in B, and A's student search narrows B's grid to nobody.
  The comment there says *"a class tab leaves the grid for Attendance, so there is no second door to
  reset"*, which stops being true here. Prefer routing the tap through the arrival path that already
  does these resets over adding a second set of them. Whatever else a fresh arrival on either screen
  resets, the tap resets too. Name each one in the result.
  *(Checked at booking: the assignment editor is a modal, so no header tab can be tapped while it is
  open. A score cell writes on every `input` event (`src/shell.js` ~3816 → `editScore()`), so there
  is no half-finished value to lose.)*
- **The class switcher (`src/screen-nav.js`) marks the screen that is up**, not Attendance.

**Acceptance**
- [x] With the assignment list up for class A, a tap on class B's header tab shows class B's
      assignment list. The B tab is the active one and the switcher marks Assignments.
- [x] The same for the score grid: A's Scores → tap B → B's Scores, showing B's students and B's
      columns, and no column or row of A's.
- [x] Student detail up → tap another class → that class's Attendance. Unchanged, and asserted.
- [x] A home-grid card still opens on Attendance, and a reload from either screen still lands on
      Attendance. `tools/verify/assignments.mjs`'s card check (~828) stays green as it is.
- [x] `tools/verify/assignments.mjs` ~799 and ~809 (*"opening a second class from a class left on
      Assignments lands on Attendance"* and *"…coming back… lands on Attendance too"*) are rewritten
      to this ruling rather than deleted. The *no per-class memory* half survives as a check: leave A
      on Scores, go home, open B from its card, and B lands on Attendance.
- [x] With A's grid searched and narrowed to one category, a tap on B shows B's grid unsearched and
      on *All*. A score typed into A immediately before the tap is in A and nowhere in B.
- [x] `CACHE` in `sw.js` is bumped (`src/classes.js` and `src/shell.js` are SHELL files).
- [x] 👤 On the iPad, after a force-quit: Assignments and Scores each stay up across two class taps,
      and detail drops to Attendance. *(The owner, 2026-10-05, on v166 from the local server: all
      three readings in `TESTING.md` § WO-3.45, including Scores arriving unsearched and on* All*.)*

**Traps** — **WO-3.3's Acceptance line *"Opening a class lands on Attendance every time"* is not
reopened.** Its argument is against a per-class memory of the last screen, and its proof is a card
tap and a reload, both still true. Add a dated note under that line saying a header tap from
Assignments or Scores now keeps the screen (this work order), and leave its tick alone. **Do not put
`assignments` or `scores` in `REMEMBERED_AS`'s other direction**: a reload landing on the score grid
is the per-class memory under another name. **The calendar and signals branches move a filter, and
these two screens have none to move.** They need the class repainted, not a lens moved, so do not
model them on `setCalendarFilter()`. And **`resetRegistry()` still runs on every class tap** for the
reason the comment above it gives. Leave it in place.

## WO-3.46 — a score column can be held out of the grade until it is committed

**Ship** — · **Status** ✅ DONE — 2026-10-08 · **Size** M · **Depends on** WO-3.52, WO-3.53
**Closes roadmap** *(no box. Owner-directed, 2026-10-05.)*

**Booked 2026-10-05**, owner-directed, from the owner's reconciling against the SIS: *"Sometimes you
want to enter a grade, but you're rectifying things from the SIS. The challenge is you can't enter a
grade without it applying."* The SIS makes every grade wait for a *commit* before it counts, per cell
and per column range, which the owner calls clunky. **The owner chose per column.** A held column
takes values, flags and notes as any column does, counts toward nothing, and **keeps no history**
until it is committed.

**Cut in four on 2026-10-07, before dispatch, and this is the third piece.** The owner asked about
size after WO-3.50, an M, used most of a usage window. Its commit added 1,815 lines across 16 files,
and this row as booked was larger: an engine change, a history rule with a mutation proof, and new
controls on the score grid. On the WO-6.4 and WO-5.8 precedent it was cut along its own seams, and it
**keeps its id, its title and ruling 4**, so WO-3.48's trap still resolves. The four pieces, in
running order:
1. [WO-3.52](#wo-352--a-held-column-counts-toward-nothing-and-keeps-no-history-in-the-engine): the
   shape, the engine filter, `isHeld()` and `reviseCell()`'s rulings 1 and 2. It lands invisibly,
   because nothing can hold a column yet.
2. [WO-3.53](#wo-353--the-readers-that-hide-a-held-column-ask-the-engine-whether-it-is-held): the
   four readers that hide a held column. Also invisible.
3. **This one**: the writer, the grid's *Hold* and *Commit* controls, the confirm and the editor's
   checkbox. **Holding becomes possible here**, so the two pieces before it make sure the grade,
   the signals, the past-due prompt and outreach already agree on the day it lands.
4. [WO-3.47](#wo-347--every-reader-outside-the-grade-engine-agrees-about-a-held-column): the
   readers that show a held column under its own word (the queue, the home card, the grade sheet,
   student detail). Between this landing and that one, the home card's *N to grade* does not count
   a held column. Keep the gap short; nothing in this work order works around it.

**The shape** is WO-3.52's: `held: true` while held, absent means live, `heldAt` stamped by a hold
(added 2026-10-08 for ruling 2 as amended), and `committedAt` stamped by a commit. This work order
writes all three and reads none directly. It asks `isHeld()`.

**Rulings, the owner's, 2026-10-07.** All four were confirmed as proposed at booking. Rulings 1
(the revision window is measured from the commit) and 2 (a re-held column's trail is frozen, not
cleared) moved to
[WO-3.52](#wo-352--a-held-column-counts-toward-nothing-and-keeps-no-history-in-the-engine) with
`reviseCell()`. These two stay here:
3. **Committing and holding are each one tap behind a confirm that shows what moves.** The confirm
   names the students whose class grade changes, before and after (*"Jordan 84% → 78%"*), and says
   so in words when none does. The preview is `classGrade()` asked twice: once on the document as it
   is, and once on a shallow clone with the column's `held` flipped. `src/signals.js`'s
   `gradeWithout()` is the precedent. **No arithmetic of its own.**
4. **A new column is live.** The assignment editor offers *Hold out of the grade* unticked. Nothing a
   teacher does today changes behaviour unless she asks for a hold. A copy is live whatever its
   source is (WO-3.48's trap).

**Deliverables**
- **One writer for each direction**, each a single `update()`: holding sets `held: true` and stamps
  `heldAt` with `localStamp()`, overwriting an earlier stamp (a column created held gets both);
  committing deletes `held` and stamps `committedAt` with `localStamp()`, overwriting an earlier
  stamp. Nothing on the cells moves in either direction.
- **The score grid shows a held column as held**: a mark on its head, a word for a screen reader,
  and a *Commit* control on the head that opens ruling 3's confirm. A live column's head carries
  *Hold*, behind the same confirm.
- **The assignment editor carries the hold checkbox** (ruling 4), and changing it on an existing
  column goes through the same confirm.
- **WO-3.53's sweep claim names the writer's file** as the one place outside `src/grade-engine.js`
  allowed to write `held`, changed in the same sitting as the writer, with `tools/README.md`'s count
  kept in step.
- **`docs/data-model.md`** gains the writers and the confirm under the held-column section WO-3.52
  wrote.
- **`CACHE` in `sw.js` is bumped.**

**Acceptance**
- [x] Holding a column writes `held: true` and `heldAt` and nothing else; committing deletes it, stamps
      `committedAt`, and touches no cell. Each is one `update()` and `rev` moves by one.
- [x] Committing the column moves exactly the grades the confirm named, to the figures it named, in
      a weighted class and in a points class. Holding does the same in the other direction.
- [x] A confirm whose column moves no grade says so in words, and declining either confirm leaves the
      document byte-identical (`flush()` awaited).
- [x] A new assignment is live, and its editor shows the checkbox unticked. Ticking it on an existing
      column opens the same confirm as the grid's control.
- [x] Edits typed through the grid into a held column and then committed reach `reviseCell()` with
      the column's state, so WO-3.52's rulings 1 and 2 hold end to end, not only in the unit checks.
- [x] A held column is driven through **both** of `reviseCell()`'s callers, `putCell()` in
      `src/scores.js` and `acceptPastDue()` in `src/past-due.js`, and each records no history while
      held and the committed figure after. *(WO-3.52's verifier, 2026-10-08: those two call sites
      were confirmed by reading only, so a misnamed field in either would pass every check. This is
      the first work order that can hold a column through them.)*
- [x] A held column that is the only work in its category leaves that category empty, and its weight
      passes to the other categories exactly as an empty category's does, checked against a hand
      computation. *(Also WO-3.52's verifier: the engine filter implies it, and no check showed it.)*
- [x] `wo-sweep.mjs` § 30 names the writer's file as an exception in the same edit that adds the
      writer, and the sweep is green. *(WO-3.53's deliverables promised this and nothing on this list
      held it: § 30 forbids every `.held` outside `src/grade-engine.js`, so the writer turns it red,
      and the easy repair is a wider exception than one file.)* **In the same edit, § 30 also catches
      `held` named in a destructured parameter** — `({ held }) => !held`, `function f({ held })` —
      and nothing wider: a bare `held` is a local variable at `src/assignments.js:695` and a word in
      prose elsewhere, so matching every `held` token goes red on a clean tree. Proved non-vacuous by
      planting each shape in a scratch copy and seeing § 30 go red. *(WO-3.53's verifier, 2026-10-08:
      a destructured parameter passes § 30 today, and it is the shape a filter over assignments is
      most often written in. The owner's ruling, the same day: close it here, where § 30 is open
      anyway, before WO-3.47 builds the readers most likely to use it.)*
- [x] `CACHE` in `sw.js` is bumped.
- [x] 👤 On the iPad, after a force-quit: hold a column, type scores, see the grade not move; commit,
      read the confirm's names against the grid, and see the grade move. *(The owner, on the iPad,
      2026-10-08, v172: all four readings confirmed — the taller head accepted as built.)*

*(**Outcome, 2026-10-08.** Built, verified PASS and read on the iPad the same day. Four things
differed from the plan. **The column head grew** about 29px on a fine pointer and 48px on a coarse
one, roughly one row of scores in portrait; `scroll-padding-top` was re-measured to match, and the
owner accepted it on glass. **The editor's box commits a hold on an empty column with no confirm**,
the implementer's reading of ruling 3, since nothing on it can move a grade; once a score is on it,
the tap goes through the confirm. If ruling 3 means *every hold, always*, it is one `if` in
`tapEditorHold()`. **Two traps are held by structure, not by a check:** no fixture ticks the box on
an existing empty column (a mutation dropping the `creatingId` guard survived), and the fixture's term
has no dates, so the stacked-dialog trap at Done cannot fire there. And **the assignment list row does
not mark a held column**, which nothing asked for and is a candidate for WO-3.47's table.)*

**Traps** — **The preview is not a second grade engine.** If the confirm computes a percentage
itself, the confirm and the grid can disagree, which is the failure this repository refuses
everywhere else. **Do not read `.held` in the grid or the editor**; ask `isHeld()`, or WO-3.53's
sweep claim turns red. **The editor already has a confirm at the close** (WO-3.50's scored-move
warning, `settleEditor()`). The hold checkbox opens its confirm **on change, not on close**, so a
teacher who moves a due date and ticks the hold is never shown two dialogs stacked at the close.
And **`openWork()` drops a held column** as a side effect of WO-3.52's filter, so the home card
stops counting it on the day this lands. That gap is
[WO-3.47](#wo-347--every-reader-outside-the-grade-engine-agrees-about-a-held-column)'s to close.

## WO-3.47 — every reader outside the grade engine agrees about a held column

**Ship** — · **Status** ✅ DONE — 2026-10-09 · **Size** M · **Depends on** WO-3.46
**Closes roadmap** *(no box. Owner-directed, 2026-10-05.)*

**Booked 2026-10-05** with [WO-3.46](#wo-346--a-score-column-can-be-held-out-of-the-grade-until-it-is-committed),
the second half of the same feature. WO-3.52 keeps a held column out of the grade engine. **Ten
modules walk `doc.assignments` themselves** and would go on reading a held column as if it counted.
Then a screen disagrees with itself: the grade says 84% while the concern list says *3 missing* from a
column that is not live.

**Cut on 2026-10-07, before dispatch, and this is the last of four pieces** (the reasoning and the
order are under WO-3.46). It **keeps its id and its title**, because it is the piece after which
every reader agrees. The readers that **hide** a held column went to
[WO-3.53](#wo-353--the-readers-that-hide-a-held-column-ask-the-engine-whether-it-is-held). The
readers that **show** it under its own word stay here, because showing it needs WO-3.46's controls to
read on the iPad, and the queue needs a new engine call.

**The whole reader table, ruled by the owner on 2026-10-07.** Every row was confirmed as proposed.
The detail row, left to the implementer at booking, was ruled *listed, marked held*. The last two
rows were missing from the booking and were ruled the same day.

| Reader | Ruling | Built by |
|---|---|---|
| `src/signals.js` — `sequence` (~1727), so every rule reading `countedWork()` / `scorePercents()` | **Skips held columns.** A signal built from a grade that is not committed contradicts the grade on screen. `gradeWithout()` already goes through `classGrade()`, so it follows the engine by itself | WO-3.53 |
| `src/past-due.js` — the sweep's offer | **Does not offer** to mark blanks in a held column missing. A held column is work in progress, and the sweep's question is about work that is finished and late | WO-3.53 |
| `src/graded-pieces.js` | **Skips held columns**: it answers which categories have counted work, and a held column has none | WO-3.53 |
| `src/merge-fields.js` — `{{missing.list}}` and the grade fields | **Follows the engine**: a held column's `missing` is not listed. A guardian must not be told about a zero that does not count | WO-3.53 |
| `src/glance.js` `queueRows()` and `src/home.js`'s *N to grade* chip | **A held column with blanks still counts as waiting to be graded**, and its row says *held*. Unfinished work is exactly what the queue is for. This needs `openWork()` to report held rows in its own state, or a sibling engine call; **the call goes in `src/grade-engine.js`, not in the reader** (the glance-reader rule in `CLAUDE.md`) | **This** |
| `src/detail.js` — open work and projections | Projections stay out (they follow the engine). **Open work lists a held column, marked *held*.** It agrees with the queue, so a teacher reading one student sees what is still being reconciled | **This** |
| `src/grades-report.js` — the grade sheet and CSV | **Includes the column, marked held** in its head and in the CSV's header cell. The sheet is what is re-keyed into the SIS, and the SIS has its own commit, so leaving the column off would hide the very work being reconciled | **This** |
| `src/calendar-derived.js` — due dates | **Unchanged.** A due date is a date whether or not the column counts | Nobody |
| `src/score-history.js` `scoreHistoryCard()` and `src/score-notes.js` `scoreNotesCard()` | **Unchanged.** A held cell's note and frozen trail still show on student detail. Both cards are about the cell, not the grade | Nobody |

**Deliverables**
- The three rows marked **This**, built at the reader, each asking `isHeld()` (WO-3.52) and never
  reading `.held`.
- **The queue's engine call**, in `src/grade-engine.js` beside `openWork()`: held rows reported in
  their own state, or a sibling export. The glance reader forwards its array and composes nothing.
- A comment at each reader naming this work order and its ruling.
- `docs/data-model.md`'s reader table, which WO-3.53 started, is completed with these rows as built.
- `CACHE` in `sw.js` is bumped if any SHELL file moves.

**Acceptance**
- [x] The home card's *N to grade* and the waiting queue count a held column with blanks, and its
      queue row says *held*. Committing it leaves the count unchanged until the blanks are filled.
- [x] A student's detail lists a held column's open work marked *held*, and no projection counts it.
- [x] The grade sheet and CSV include the held column, marked held in its head and in the CSV's
      header cell, and the class grade printed beside it does not count it.
- [x] `tools/verify/glance-quiet.mjs` (or its successor) still finds no arithmetic in
      `src/glance.js`, and the sweep claim from WO-3.53 is green.
- [x] 👤 On the iPad: a held column with a missing score, read on the home card, the concern list and
      the student's detail, all three agreeing with the grade.

*(**Three outcomes the plan did not predict, 2026-10-09.** The queue's engine call is a **sibling
export**, `heldWork()`, rather than a new row state: `openWork()` feeds `planned()`, and a state it
ignored would have erased the open / missing / bonus distinction a held column still has. The brief
left *blanks* open for a held column, and it follows the live rule unchanged: only `open` rows count
toward *N to grade*, so a held cell marked `missing` and a held zero-point blank count nowhere. And
**the student CSV's Work section now carries held rows** as *held — …*, which no Acceptance line asked
for; it is documented in `docs/data-model.md` and checked in `tools/verify/held-readers.mjs`, and
whether it stays is the owner's call.)*

**Traps** — **The queue ruling is the one most likely to be got wrong by symmetry**: the readers
WO-3.53 built all hide a held column, and these three deliberately do not. **A reader that
re-implements "is this column held" is the second opinion** that the glance-reader rule forbids.
**Do not touch the score-history or score-notes cards.** They are ruled unchanged, and a held
column's trail showing there is correct.

## WO-3.48 — one assignment goes into several classes in one dialog

**Ship** — · **Status** ✅ DONE — 2026-10-06 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-05.)*

**Booked 2026-10-05**, owner-directed, from [`plans/future-features.md`](../future-features.md)
§ Assignments screen, item 1, which the owner raised on 2026-09-03: *"When creating and duplicating
an assignment, we really need the ability to add it to more than one class."* Today the same
assignment into four sections on four days is about **seven dialog trips**: three passes through the
duplicate dialog, then each copy opened again to change its due date. That cost comes every week.

**What stands and is not reopened.** The owner asked on 2026-10-05 whether a standing decision
forbids this. None does. The record forbids a **shape**, not the errand:
- **Copies, never a structure several classes point at** (`ROADMAP.md`, the class-copy box). N
  targets make N independent assignments with N new ids. `scores` stays keyed by assignment, and the
  grade math never hears about it.
- **A `categoryId` never crosses a class.** Each target matches by **name** through
  `matchCategory()` and falls back to *not in a category*, saying so before the tap (WO-3.2's trap,
  the guards in `src/categories.js`, and WO-3.40's *"Do not change the copy rule"*).
- **The control shows what the proposal holds** (`src/assignments.js` ~1127's scar). With N rows
  there are N chances to break it.

**Rulings, the owner's, 2026-10-05**
1. **A dialog, not a view.** The duplicate dialog grows into this. It is a task finished and
   dismissed, which is `gradebook-surfaces.md`'s test for a modal.
2. **Each target's due date starts on the source's due date**, and is editable per target. Blank in
   the source stays blank. `assigned` comes across as it is and is not offered per target.
3. **Creation offers it every time.** It is not a separate errand reached only through Duplicate.
   *How* it is offered is the proposal below, confirmed as written on 2026-10-05.

**Proposed at booking — confirmed as written by the owner, 2026-10-05.** Both points below are
rulings now. Build them as they stand.
- **The create door.** While the assignment editor is in a create flow (`creatingId` is set, the
  same condition that shows *Cancel*), it shows a **Copy into other classes…** button beside *Done*,
  whenever there are at least two active classes. It opens this dialog with the new assignment as
  its source. *Done* still just closes. Creation stays a single write followed by an editor, so the
  no-lost-draft contract in `createAssignment()`'s header is unchanged. The alternatives considered
  were for *Done* to open the dialog itself, which turns every create into two dialogs even for a
  one-section assignment, or a target strip inside the editor that writes copies on close, which
  makes Close, Escape and the backdrop into writes. Both were set aside.
- **No target is pre-selected.** The owner's five classes are four different courses, and a
  pre-selection is a guess about which are sections of the same one. The confirm stays disabled until
  one is ticked. The create door does not offer the source's own class, while Duplicate still does,
  because a second copy in the same class is a real errand (*Quiz 2*).

**Deliverables**
- **The class pills become multi-select**, using `aria-pressed` on the pills `renderCopyClasses()`
  already draws. `copyClassId` becomes an ordered list of targets, each holding its own proposal
  (`termId`, `categoryId`, `due`), computed by `proposeCopyInto()` when the target is ticked and
  dropped when it is unticked.
- **One row per ticked target: class · term · category · due.** The name field stays single and
  applies to every copy. The rows stack under `@media (pointer: coarse)` and at portrait iPad width,
  with no horizontal scroll and 44px targets.
- **Each row says its own fallback**: no category match, no categories, or no terms. A target with
  no terms is shown and cannot be confirmed, and the row says why. It is never silently dropped.
- **`confirmCopy()` writes every copy in one `update()`**, each with `newId('a')`, its own target's
  `classId`/`termId`/`categoryId`/`due`, the source's `assigned` and `points`, and no scores. It
  announces once, naming the classes: *"Copied Essay 2 into Period 2, Period 4 and Period 6 with no
  scores on them."*
- **The dates note changes in the same edit as the field** (the future-features row's ruling 4). It
  stops saying *"The dates come across as they are"*. It says the assigned date comes across and each
  due date starts on the source's. Update `confirmCopy()`'s long date comment to match, keeping its
  WO-3.17 reasoning: the copy still never re-dates to today.
- **The confirm button names the count**: *Copy into Period 2*, or *Copy into 3 classes*.
- **The create door** as ruled above, in `index.html` beside the editor's *Done*, shown and hidden
  by `renderEditorFields()` alongside the *Cancel* toggle.
- **The dialog says that copies are separate** in the create door's lead line. Once made, a copy
  does not follow later edits to its source, and a teacher who copies and then renames the source
  would otherwise expect the copies to follow.
- **`tools/verify/assignments.mjs` and `tools/verify/copy-class.mjs`** are updated for the new
  dialog. **`TESTING.md`'s 👤 lines on the duplicate dialog** (the iPad category-fallback reading)
  are re-read against it.
- **`plans/future-features.md`** § Assignments screen item 1 is struck with this ID.
- **`CACHE` in `sw.js` is bumped.**

**Acceptance**
- [x] Ticking three classes and confirming writes exactly three assignments, each with a new id, its
      own class's `classId` and `termId`, no `scores` entry, and the due date its row showed.
- [x] A target with a same-named category is filed under it. A target without one arrives in *no
      category*, and its row said so before the tap. No copy ever carries the source's
      `categoryId` into another class. Mutation-proved against carrying the id across.
- [x] Every row's selects show the value that will be written: for each target, the selected option
      equals the proposal, including a target whose term or category has no match.
- [x] Changing one row's due date changes only that copy's `due`. A blank source due stays blank in
      every row.
- [x] Unticking a target removes its row, and no copy is written for it.
- [x] A target with no terms cannot be confirmed, and its row says why.
- [x] Cancel, Close and Escape write nothing (`flush()` awaited, as WO-5.3's harness learned).
- [x] From a create flow with two or more active classes, the editor shows **Copy into other
      classes…**. It opens with the new assignment as the source and does not offer the source's own
      class. With one active class, the button is absent. Opening an existing row through Edit does
      not show it.
- [x] The note no longer says the dates come across as they are.
- [x] `CACHE` in `sw.js` is bumped.
- [x] 👤 On the iPad, after a force-quit: create an assignment, name it, copy it into three sections
      with three different due dates in one dialog, and read each copy on its own class's list.
      *(The owner, 2026-10-06, on v167 from the local server: every box in the checklist read
      correctly. The same reading found the dialog clunky on the laptop and too long to scroll on
      both devices. That is a layout follow-up, not a failure of this line.)*

**The layout follow-up is drawn and booked** (2026-10-06, at the owner's request):
[`design/mockups/copy-classes.html`](../../design/mockups/copy-classes.html) puts one line per class
in a wider panel, and the owner ruled on every question it raised the same day. It is
[WO-3.49](#wo-349--the-copy-dialog-is-one-line-per-class-and-the-due-date-picks-each-copys-term),
with the editor's half of the same rule booked as
[WO-3.50](#wo-350--the-due-date-picks-an-assignments-term-in-the-editor-too).

**Traps** — **Do not build a shared assignment.** It is the tempting shape and the one ruled out.
**Do not let one target's proposal leak into another's**, for example a single `copyTermId` that the
last-ticked class overwrites. Every target's fields belong to that target's class. **Do not
re-date a copy to today**, because WO-3.17's default is creation-only. And if
[WO-3.46](#wo-346--a-score-column-can-be-held-out-of-the-grade-until-it-is-committed) lands first, a
copy is **live** whatever its source is (WO-3.46's ruling 4). Do not copy `held` or `committedAt`.

## WO-3.49 — the copy dialog is one line per class, and the due date picks each copy's term

**Ship** — · **Status** ✅ DONE — 2026-10-06 · **Size** M · **Depends on** WO-3.48
**Closes roadmap** *(no box. Owner-directed, 2026-10-06.)*

**Booked 2026-10-06**, owner-directed, out of [WO-3.48](#wo-348--one-assignment-goes-into-several-classes-in-one-dialog)'s
👤 reading the same day: the dialog worked, and was clunky on the laptop and too long to scroll on
both devices. It was drawn before it was booked, and every ruling below was made against the drawing.

**Why it is next.** v167 proposes every other class's **first** term for a copy (`firstTermId()` in
`src/assignments.js`). That is invisible in Quarter 1. From **Quarter 2, which starts 2026-11-01**,
every copy defaults to Quarter 1 unless the teacher changes it on each card, which files the work in a
closed quarter, under a grade already keyed into the SIS, off the list she is looking at. Ruling 2
removes the default rather than patching it.

**Surface.** [`design/mockups/copy-classes.html`](../../design/mockups/copy-classes.html), frames A
to C, styled in [`design/mockups/proposed-copy.css`](../../design/mockups/proposed-copy.css)
§ COPY LIST, with `design/mockups/README.md` § "Copy into other classes". Frame 0 is v167 as it
ships. **Lift the section rather than re-deriving it** (`PROTOCOL.md` § When the drawing lands), and
amend its banner in the same sitting.

**Rulings, the owner's, 2026-10-06**
1. **One list, one line per class, in a wider panel** (drawn at 880px; `.modal-panel`'s `95vw` still
   caps it). The tick is the class name. Category, assigned and due sit on the same line, under
   column heads written once. The pills and the per-class cards go. Active classes only, in the class
   manager's order. No "tick every section" shortcut.
2. **No term control. The due date picks the term**, the way the school's SIS works: a copy goes into
   the term of its own class that holds its due date (`termContaining()` in `src/classes.js`). Each
   line names that term under the class name. A blank due date uses the term holding the assigned
   date. If neither date places it, or the class has no terms, **the line is blocked**: its own amber
   line says why, and the confirm stays disabled until the date changes or the class is unticked.
3. **An assigned date per line**, starting on the source's, for a section a day behind or a class
   that lost a day to the schedule. Changing it moves only itself, never the due date.
4. **The source heads the list from either door, with no tick, and stays editable.** Its category,
   assigned and due are live fields, as a quick reference and a place to fix a slip. Its edits are
   **held, not written as typed**: the confirm saves them in the same single `update()` as the
   copies, and Cancel, Close and Escape discard them with everything else. When the source has
   changed, the confirm reads *Save P1 and copy into 3 classes*. With nothing ticked the confirm stays
   disabled whether or not the source changed, so this is never an editor for the source alone.
5. **The source keeps its `termId` here.** Moving it with its due date is
   [WO-3.50](#wo-350--the-due-date-picks-an-assignments-term-in-the-editor-too)'s job, booked
   alongside this one.
6. **A line still showing the source's old date follows a change to the source's date; a line the
   teacher changed stays put.** Per field: assigned and due follow separately.
7. **No second copy in the same class.** Duplicate no longer offers the source's own class. A second
   copy in one class is made with *New*.
8. **The narrow layout is a `@media` rule**, the app's existing shape, not the drawing's
   `@container`, which was only there so one page could show both layouts. The breakpoint is where
   the four columns stop fitting, measured rather than copied. Below it each ticked line folds to two
   rows: the name, then category and both dates side by side, each with a small label.
9. **The wording is the drawing's**: the shortened lead, line notes and list note. The owner corrects
   it at the 👤 reading.

**Deliverables**
- **`renderCopy()` and its helpers redrawn as the list**: the source line, one line per offered class
  (unticked: the name and *Not copied*), the column heads, and the amber line under a line that has
  something to say. `.assign-copy-classes`, `.assign-copy-target*` and the term `<select>` go, with
  their coarse-pointer rules.
- **`proposeCopyInto()` proposes `{ classId, categoryId, assigned, due }`**, and the term is derived
  from those dates when the line is drawn and again at confirm. `firstTermId()` goes if nothing else
  calls it.
- **The source's held edits and the follow rule** (rulings 4 and 6): a touched flag per line per date
  field, held in the dialog's own state and never in the document.
- **`confirmCopy()`**: one `update()` that writes the source's changed fields and every copy, each
  copy with `newId('a')`, its line's `classId`, derived `termId`, `categoryId`, `assigned` and `due`,
  the source's `points`, and no scores. The announcement names the source when it was saved.
- **The confirm's label** per ruling 4, and WO-3.48's count wording otherwise.
- **`index.html`**: the dialog's markup, and the assignment list's hint (~line 1073), which describes
  the copy's dates and must now say each copy's term comes from its due date.
- **`src/assignments.css`**: § COPY LIST lifted, `@container` swapped for `@media` (ruling 8), and the
  coarse-pointer block updated in the same pass.
- **`tools/verify/copy-class.mjs` and `tools/verify/assignments.mjs`** rewritten for the list,
  including a run at a `--today=` date in the fixture's Quarter 2.
- **`design/mockups/proposed-copy.css`'s banner, its `README.md` section and its `index.html` entry**
  amended to say the section landed.
- **`TESTING.md` § WO-3.49**, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] A copy's `termId` is the target's term holding its due date. With the source due in Quarter 2
      and a target with dated Quarter 1 and Quarter 2, the copy lands in Quarter 2. Mutation-proved
      against restoring `firstTermId()`.
- [x] A blank due date files the copy under the term holding its assigned date. A line neither date
      can place, or a class with no terms, is blocked: its own line says why, and the confirm is
      disabled until it is fixed or unticked.
- [x] Each line's assigned and due are written to that copy only. Changing a line's assigned date
      leaves its due date as it was.
- [x] Edits to the source's category, assigned or due are written only on confirm, in the same
      `update()` as the copies (`rev` moves by one). Cancel, Close and Escape leave the source
      byte-identical, with `flush()` awaited.
- [x] The confirm reads *Save <class> and copy into N classes* exactly when the source has changed,
      and is disabled with nothing ticked even then.
- [x] Changing the source's due date moves every line still on the old date and no line the teacher
      changed. Likewise for the assigned date.
      *(Built wider than this line: an untouched line also follows the source's **category**,
      matched by name. The implementer disclosed it as its reading of ruling 6, the verifier did not
      fail it, and the owner accepted it as built at the 👤 reading on 2026-10-06. Undoing it is a
      three-line change.)*
- [x] The source line heads the list from both doors and has no tick. Duplicate does not offer the
      source's own class. No term control exists anywhere in the dialog, and each ticked line names
      its term.
- [x] At 1280px under a fine pointer, every class is one line with no horizontal scroll. At 820px it
      folds to two rows a class, and every control is ≥44px under a coarse pointer.
- [x] `CACHE` in `sw.js` is bumped.
- [x] 👤 On the iPad, after a force-quit, in portrait and landscape: create an assignment and copy it
      into three sections, one of them a day behind (both its dates moved), and fix a slip on the
      source line before confirming. Read each copy and the source on their own lists, and read the
      dialog's wording. If two dates and two Clears do not fit on a portrait line, the fallback is
      taken (the dates on a row of their own) and the reading says so.
      *(Read by the owner on the iPad and the laptop 2026-10-06, after a force-quit, on v168: confirmed
      as written. The portrait line fit, so the fallback was not taken.)*

**Traps** — **Nothing in this dialog writes before the confirm**, and that includes the source: the
editor's write-as-typed contract does not apply here, and a source saved on input would survive the
Cancel that is supposed to undo it. **Derive the term from the value at confirm, not from what was
last drawn.** **Do not store the touched flags or a derived term in the document.** WO-3.48's rules
stand: copies are never a shared structure, a `categoryId` never crosses a class, the controls show
what will be written, and nothing re-dates a copy to today. If WO-3.46 lands first, a copy is live:
do not copy `held` or `committedAt`.

## WO-3.50 — the due date picks an assignment's term in the editor too

**Ship** — · **Status** ✅ DONE — 2026-10-07 · **Size** M · **Depends on** WO-3.49
**Closes roadmap** *(no box. Owner-directed, 2026-10-06.)*

**Booked 2026-10-06**, owner-directed, alongside
[WO-3.49](#wo-349--the-copy-dialog-is-one-line-per-class-and-the-due-date-picks-each-copys-term).
The owner's rule, from the school's SIS: **a term is never named; the due date places the work.**
WO-3.49 applies it to copies. This applies it to the editor. Today a new assignment is filed under
the term being viewed (`createAssignment()`, `termId: term.id`, ~line 974 of `src/assignments.js`),
and editing its due date never moves it.

**Proposed at booking and approved by the owner on 2026-10-06.** Rulings 1, 2, 4, 5 and 6 stand as
proposed. Ruling 3 is amended.
1. **A new assignment's term is the one holding its due date**, which is today on creation. A teacher
   viewing a term that does not hold today creates work in today's term. The list moves to that term
   and says so, rather than the new row vanishing.
2. **An edited due date moves the assignment when the editor closes, never per keystroke.** The due
   field writes on every keystroke, including a blank one partway through typing a date (WO-1.47's
   phantom), so a term derived on input would flip mid-typing and take the row off the list behind
   the dialog.
3. **A blank due date takes the assigned date, and the due date still picks the term.** *(Amended by
   the owner, 2026-10-06. The booking read "a blank due date uses the assigned date's term", which
   left the due date blank.)* At the close, a blank due date gets the assigned date copied into it and
   is written. The due date is then the only thing that places the work. With both dates blank, or
   with dates no term holds, the assignment stays where it is and the editor says that no term holds
   its dates. The copy happens at close and never on `input`, under ruling 2. **The consequence is
   intended:** a blank due date can never be past due (`src/past-due.js`, `isDate()`), so the copied
   date makes the work eligible for the overdue tint and the past-due prompt from the next day. The
   owner, asked: a "never past due" assignment does not make sense for work that lives in a quarter.
4. **A move that carries scores says so before it happens.** Scores are keyed by assignment, so moving
   a scored assignment changes two terms' grades, and one of them may already be in the SIS. The
   editor names both terms and the number of scores at the close that would move it.
5. **Existing assignments are not re-filed.** No migration: the rule applies when a date is next
   edited, so an old backup restores exactly as it was.
6. **The copy dialog's source line follows the same rule**, lifting WO-3.49's ruling 5.

**Deliverables** — the editor's close path, the create path, the list's term switch and its note, the
scored-move warning, WO-3.49's source save, harness checks in `tools/verify/assignments.mjs` (with
`--today=` across a term edge), `TESTING.md` § WO-3.50, and a `CACHE` bump.

**Acceptance**
- [x] Creating an assignment files it under the term holding today, and the list shows that term.
- [x] Typing a due date in another term does not move the assignment until the editor closes. Then it
      moves once, `rev` moves by one, and the list says where it went.
- [x] Closing with a blank due date and an assigned date writes the assigned date into `due` and files
      by it. Both blank, or dates no term holds, leave the term unchanged, and the editor says so.
- [x] Closing on a move that carries scores names both terms and the score count before writing, and
      declining leaves the document byte-identical.
- [x] An old backup restores with every `termId` unchanged.
- [x] The copy dialog's source moves with its due date on confirm.
- [x] `CACHE` in `sw.js` is bumped.
- [x] 👤 On the iPad, after a force-quit: edit a scored assignment's due date across a term edge, read
      the warning, confirm, and read both terms' lists and grades.
      *(Read by the owner on the iPad 2026-10-07, after a force-quit, on v169: confirmed as written,
      including both terms' grades on the score grid and a student's page after the move.)*

**Traps** — **CLAUDE.md's "the grade must never change because a date rolled over" is about the
clock, and this is a date the teacher typed.** Keep the distinction explicit in the code: nothing
here may re-file work because time passed. **Never derive the term on `input`** (ruling 2).

## WO-3.51 — no check presses the copy dialog's source-line Clears

**Ship** — · **Status** ✅ DONE — 2026-10-06 · **Size** XS · **Depends on** WO-3.49
**Closes roadmap** *(no box. A harness gap, owner-directed, 2026-10-06.)*

**Booked 2026-10-06**, owner-directed, out of a reading of WO-3.49's Clears after it closed.

**The gap.** WO-3.49 put two date fields and two Clears on the copy dialog's source line. The Clears
are drawn by `copyDateCell()` in `src/assignments.js` and routed by `clearDateField()` in
`src/shell.js` to `copyFieldCleared()`, whose `sourceField` branch hands the fresh input to
`setCopySource()`. **No check ever presses them.** `tools/verify/copy-class.mjs` presses only P7's due
and assigned Clears on a ticked line, and it measures the source line's Clears for fit at 1280, 920
and 919px without pressing them. So nothing tests that clearing a source date is a held edit like
every other source edit, that untouched lines follow it, or that Cancel undoes it.
`tools/verify/date-clear.mjs`'s census counts its ten Clears with the dialogs shut, on purpose, and
is not the place for this.

**Why now.** [WO-3.50](#wo-350--the-due-date-picks-an-assignments-term-in-the-editor-too)'s sixth
ruling has the source line's term follow its due date, with a blank due date falling back to the
assigned date. Pressing the source's due Clear is the quickest way to reach that fallback, so the
path should be fenced before WO-3.50 changes what is behind it.

**Deliverables** — checks in `tools/verify/copy-class.mjs` that press the source line's two Clears
through the button, the way `clearOn()` presses P7's, and read the result.

**Acceptance**
- [x] Pressing the source's due Clear empties the source's due field and only that field, and every
      ticked line the teacher has not touched follows it to blank. A touched line keeps its own
      date. The same holds for the assigned Clear.
- [x] Neither press writes: `rev` is unmoved after a `flush()`, and the source in the document is
      byte-identical.
- [x] After both Clears, Cancel leaves the document byte-identical to before the dialog opened, and
      reopening the dialog shows the source's stored dates.
- [x] After a source Clear, the confirm saves the source with that date empty, in the same single
      `update()` as the copies, and the confirm label reads *Save … and copy into N classes*.
      *(True when ticked, and no longer since
      [WO-3.50](#wo-350--the-due-date-picks-an-assignments-term-in-the-editor-too), 2026-10-07: a
      blank due date now takes the assigned date at the confirm, so the source is saved with its
      assigned date in `due` rather than empty, and filed by it. The check in `copy-class.mjs` was
      rewritten to that in the same work order; the rest of this line stands.)*
- [x] Mutation-proved: with the `sourceField` branch in `copyFieldCleared()` removed, at least one of
      these checks goes red. Recorded in `TESTING.md` § WO-3.51. **The mutation is reverted before
      anything else is written** (`AGENTS.md`).

**Traps** — **If a check fails on the delivered tree, that is an app defect, not a check to adjust.**
Stop and report it with the failing output rather than fixing `src/` inside this work order.
**Press the button**, never set `.value = ''` and dispatch an event: an emptied field fired as an event
is the exact path WO-1.47 and WO-1.48 ruled out. Harness only; nothing in `src/` moves and there is
no `CACHE` bump.

## WO-3.52 — a held column counts toward nothing and keeps no history, in the engine

**Ship** — · **Status** ✅ DONE — 2026-10-08 · **Size** S · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-07.)*

**Cut out of [WO-3.46](#wo-346--a-score-column-can-be-held-out-of-the-grade-until-it-is-committed)
on 2026-10-07, before dispatch.** It is the first of four pieces, and the order and the reasoning
are written there. This piece is the logic: the shape, the grade engine and the history rule. **It
draws nothing and adds no control**, so it lands invisibly. No build before it writes `held`, and
nothing in this one can, so every check here holds a column by building a fixture document.

**The shape**: an absent key is its default, as with `thresholdsOf()` and a settings block.
- `held: true` on the assignment while it is held. **Absent means live**, so every assignment written
  by every earlier build is live, every backup restores, and there is no `SCHEMA_VERSION` bump.
- `committedAt: "<localStamp>"`, written when a held column is committed and overwritten by a later
  commit. Absent on a column that was never held.
- `heldAt: "<localStamp>"`, written when a column is held (or created held) and overwritten by a
  later hold. It stays after a commit; it only means anything while `held` is set. **Added
  2026-10-08 for ruling 2**, which cannot be kept without knowing which cell versions were typed
  before the hold. A held column with no `heldAt` is read as held from before any cell was typed.
- Nothing about a held column is stored on its cells. A cell does not know its column is held.

**Rulings, the owner's, 2026-10-07**, confirmed as proposed when WO-3.46 was booked, **both amended
2026-10-08 after the first build** (below each):
1. **The revision window after a commit is measured from the commit.** `reviseCell()` treats a change
   inside `REVISION_WINDOW_MS` of the cell's `at` as a correction and pushes nothing. A held cell's
   `at` is when it was typed, not when it began to count. So: type 72 while held, commit at 9:02,
   change it to 75 at 9:03, and the 72 would vanish from the trail of a score that counted.
   *As amended 2026-10-08, the owner: match Acceptance line 3.* **A commit is a version boundary.** A
   cell last written at or before `committedAt` is the committed version, and the first change after
   the commit pushes it, however soon that change comes. A write after the commit opens an ordinary
   window from its own `at`. A cell stamped in the same second as the commit counts as before it.
   *(The ruling read "the window starts at whichever is later, the cell's `at` or the column's
   `committedAt`" until then. Read literally, that opens the window at 9:02 and the 9:03 change
   replaces the 72 — the outcome the ruling exists to prevent, and the reading Acceptance line 3's
   mutation could not be told apart from. The first build found it.)*
2. **A live column can be held again, and its trail is frozen, not cleared.** A cell that already
   has `was` keeps it untouched while held, and the trail resumes on the next commit. Holding a
   column must never be a way to make a revised score disappear.
   *As amended 2026-10-08, the owner: "the grade stops counting, but it is still there when the
   column is recommitted. If the score changes while held, a record of the old score should still
   appear."* **A hold is a version boundary too.** The score a cell held when its column was held —
   last written at or before `heldAt` — is pushed onto `was` by the first held edit, however soon,
   blank included. Every held edit after that replaces the current version and pushes nothing. A
   cell first typed while held keeps no history until the commit, as before. *(The ruling said
   edits "replace the current version and push nothing" until then, so a live 88 that had counted,
   held and edited to 90, left no record after the commit. The first build flagged it.)*

**Deliverables**
- **`isHeld(assignment)`, exported from `src/grade-engine.js`.** It is the one place that reads
  `.held`. Every later piece asks it, so a later change to what "held" means is one edit.
- **The grade engine skips a held column at its two choke points**, `assignmentsFor()` (~41) and
  `looseAssignments()` (~63), through `isHeld()`, with a comment at each saying why. Every class
  grade, category percentage, letter, points share, projection and `openWork()` row follows from
  those two, in both grading modes. **Do not filter anywhere else in the engine.**
- **`reviseCell()` is told about the column**: a fourth argument, `{ held, heldAt, committedAt }` or
  nothing, where nothing means live and today's behaviour is unchanged to the byte. A held write
  stores the wanted value, flag and note with a fresh `at`, keeps any existing `was` as it is, and
  pushes nothing — **except ruling 2's hold boundary**, where the version from before `heldAt` is
  pushed first. A held cell blanked with no `was` and nothing to push is deleted, as today. Ruling
  1's boundary lives here too.
  Both callers pass it, built from `isHeld()` and the assignment's `heldAt` and `committedAt`: `src/scores.js`
  (~474) and `src/past-due.js` (~537). **One rule, not callers deciding.**
- **`docs/data-model.md`** documents `held` and `committedAt` in the assignment sketch, the history
  rule under the score cells, and the grade-math rule that a held column counts toward nothing.
- **`CACHE` in `sw.js` is bumped**: `src/grade-engine.js` and `src/score-history.js` are in SHELL.

**Acceptance**
- [x] A held column's scores, `missing` and `excused` move no class grade, category percentage or
      letter, in a weighted class, in a points class, and in a points class's uncategorized work.
      The same document with `held` deleted moves them.
- [x] A cell first typed while held and edited three times leaves no `was`. After commit, the first
      edit more than the window after `committedAt` pushes the committed version.
- [x] Ruling 1: a held cell typed at T, committed at T+2m and changed at T+3m pushes the committed
      value onto `was`. Mutation-proved against measuring from the cell's `at`; **the mutation is
      reverted before anything else is written** (`AGENTS.md`).
- [x] Ruling 2, as amended 2026-10-08: a live column with a trail, held and then edited three times
      — the first edit inside the window of the cell's `at`, so a live column would replace — keeps
      its old trail byte for byte **beneath one new entry, the score from before the hold**, and
      pushes nothing for the second and third edits. A blank as the first held edit pushes the same
      way. After commit, the trail shows the pre-hold score and the next change pushes the committed
      one. Mutation-proved against the first build's rule (held edits never push); **the mutation
      is reverted before anything else is written** (`AGENTS.md`). *(Unticked 2026-10-08: the first
      build met the line as it read then, "keeps its trail byte for byte", which the amendment
      replaced.)*
- [x] A document written before this build restores, and every column in it is live.
- [x] `reviseCell()` with no fourth argument returns what it returns today, for every case in the
      existing history checks.
- [x] `CACHE` in `sw.js` is bumped.

**Traps** — **Do not store a held marker on the cells.** The column is the unit, and a cell-level
flag is a second truth that a restore, a copy or the past-due sweep will one day write one of and not
the other. **Do not use `excused` to fake it.** It is a decision about one student and is already in
the grade math. **`openWork()` loses held columns as a side effect of the filter.** That is correct
here and invisible until WO-3.46 lets a teacher hold one. WO-3.47 adds the engine call the queue
needs. Do not work around the loss in this piece.

## WO-3.53 — the readers that hide a held column ask the engine whether it is held

**Ship** — · **Status** ✅ DONE — 2026-10-08 · **Size** M · **Depends on** WO-3.52
**Closes roadmap** *(no box. Owner-directed, 2026-10-07.)*

**Cut out of [WO-3.47](#wo-347--every-reader-outside-the-grade-engine-agrees-about-a-held-column)
on 2026-10-07, before dispatch.** It is the second of four pieces; the order is written under
[WO-3.46](#wo-346--a-score-column-can-be-held-out-of-the-grade-until-it-is-committed). These are the
four readers whose ruling is the same: **a held column is not there.** They land before WO-3.46
makes holding possible, so the grade, the concern list, the past-due prompt and a letter home already
agree on the day a teacher first holds a column. Like WO-3.52, this piece lands invisibly, and every
check holds a column by building a fixture.

**Rulings, the owner's, 2026-10-07**, from WO-3.47's reader table, confirmed as proposed:

| Reader | Ruling |
|---|---|
| `src/signals.js` — `sequence` (~1727), so every rule reading `countedWork()` / `scorePercents()` | **Skips held columns.** A signal built from a grade that is not committed contradicts the grade on screen. `gradeWithout()` already goes through `classGrade()`, so it follows WO-3.52 by itself |
| `src/past-due.js` — the sweep's offer | **Does not offer** to mark blanks in a held column missing. A held column is work in progress, and the sweep's question is about work that is finished and late |
| `src/graded-pieces.js` | **Skips held columns**: it answers which categories have counted work, and a held column has none |
| `src/merge-fields.js` — `{{missing.list}}` and the grade fields | **Follows the engine**: a held column's `missing` is not listed. A guardian must not be told about a zero that does not count |

**Deliverables**
- Each ruling, built at the reader, asking `isHeld()` and never reading `.held`, with a comment
  naming this work order.
- **A `wo-sweep.mjs` claim: no file outside `src/grade-engine.js` names `.held`.** It is a sweep
  check rather than a harness check, on the § 17 and § 20 precedent: the harness proves what today's
  paths do, and the grep proves there is no file that could do otherwise. WO-3.46 adds its writer's
  file as the one exception. `tools/README.md`'s `check()` count is kept in step (WO-3.26's scar).
  **`src/merge-fields.js` keeps § 20 claim 5**: the held test is a call to `isHeld()`, never a
  property read named after a token.
- `docs/data-model.md` gains the reader table under the held-column section WO-3.52 wrote, with
  WO-3.47's rows marked as not yet built.
- **`CACHE` in `sw.js` is bumped**: all four readers are in SHELL.

**Acceptance**
- [x] With a held column holding a `missing` and two low scores for one student, the concern list
      shows nothing from that column. Deleting `held` and committing makes the matching signals fire.
- [x] The past-due prompt does not name a held column whose due date has passed, and does name it
      once the column is live.
- [x] `graded-pieces` reports no counted work for a category whose only work is held.
- [x] `{{missing.list}}` does not name a held column's missing work, and names it once the column is
      live.
- [x] The sweep claim is green on the delivered tree and red with a `.held` read planted in any one
      of the four readers. **The plant is reverted before anything else is written.**
- [x] `CACHE` in `sw.js` is bumped.

**Traps** — **A reader that re-implements "is this column held" is the second opinion** that the
glance-reader rule forbids. **Do not touch the queue, the home card, student detail or the grade
sheet.** Those show a held column rather than hide it, and they are WO-3.47's. Treating them by
symmetry with these four is the mistake that row's Traps already name.

## WO-3.54 — the assignment list's top matches the other class screens, and its rows get lighter

**Ship** — · **Status** ✅ DONE — 2026-10-11 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-10.)*

**Booked 2026-10-10**, owner-directed, out of a sitting that drew the screen first. The assignment
list is the one class screen whose title row does not end in **← All classes**: *+ New assignment*
holds that corner, and the door home is pushed into a row of its own in the body. Every row carries
five buttons, and an empty category draws a boxed bar under a heading that already says *nothing in
it yet*. **The first of two pieces**, cut at booking to stay below L: this one changes how the
screen looks and adds no behaviour; [WO-3.55](#wo-355--the-assignment-list-sorts-within-each-category-and-writes-nothing)
adds sorting after it.

**Surface.** [`design/mockups/assignments-tidy.html`](../../design/mockups/assignments-tidy.html),
frames A (as it ships at v182) and B, styled in
[`design/mockups/proposed-assign-tidy.css`](../../design/mockups/proposed-assign-tidy.css)
§ ASSIGN TIDY, with `design/mockups/README.md` § "The assignment list, tidied". **Lift the section
rather than re-deriving it** (`PROTOCOL.md` § When the drawing lands), and amend its banner in the
same sitting. Frame C and § ASSIGN SORT are WO-3.55's.

**Rulings, the owner's, 2026-10-10**
1. **← All classes moves to the right end of the title row**, the markup Attendance and Scores
   carry. **+ New assignment takes the body row it vacated, at its right end**
   (`.assign-actions.end`) — the same edge, one level down. The past-due prompt and the
   "arrived from another term" line stay between that row and the table.
2. **The assignment's name opens the editor, and the Edit button goes.** The name is a real
   `<button>` (`.assign-name-btn`) in the name's own type; indigo with a dotted underline under a
   pointer; 44px tall under a coarse one.
3. **Duplicate is a copy icon — two offset squares — and Delete is a bin** (`.assign-icon-btn`, worn
   beside `.class-action-btn` and `.assign-row-btn`). Each keeps an `aria-label` naming the
   assignment and a `title`. Delete keeps `.delete`'s red hover. ✎ is not used: on a roster row it
   opens the log sheet.
4. **↑ ↓ are unchanged.** They set the Scores grid's column order as well as this list's.
5. **An empty category's notice is its own heading** (`.assign-group-head.empty`), in the old bar's
   amber, and the bar goes. The note, by case: *Nothing in it yet · its 20% is shared across the
   others* (weighted, the weight its own); *Nothing in it yet · 0%, counts for nothing* (weight 0);
   *Nothing in it yet · adds nothing until something is in it* (a class graded on total points).
6. **"Not in a category" takes the same move** (`.assign-group-head.unfiled`): red in a weighted
   class, the amber of `.counted` in a points class (WO-3.36), and the bar goes. Weighted note:
   *N assignment(s) · counted toward nothing — tap its name to file it.* Points-class note:
   *N assignment(s) · counted, but in no category — tap its name to file it.*
7. **Nothing lives only in a tooltip**, because a finger never shows one. Each removed bar's full
   sentence is hidden text (`.sr-only`) inside its heading — a `title` on a row is not reliably read
   — and the hint below the list carries, in words: *tap an assignment's name to edit it*; that
   Duplicate is *the two squares on its row*; and that *a category with nothing in it yet does not
   count as a zero — its weight is shared across the others until something is in it.*
8. **The roster keeps "✎ · Edit · Remove"**, on purpose: those rows are people, and *Remove* is the
   right word where a bin is not. A deliberate divergence, not a drift to tidy.

**Answered — the owner, 2026-10-10, before dispatch: the points-class note on "Not in a
category"**, which was not drawn, reads as proposed — now ruling 6's second sentence.

**Deliverables**
- **`index.html`**: `#assignmentsView`'s title row ends in the `data-view-home` button; the body's
  `.assign-actions` holds `data-assignment-new` and gains `end`; the hint gains ruling 7's sentences.
- **`src/assignments.js`**: `assignmentRow()` builds the name button and the two icon buttons and no
  Edit; the empty and unfiled branches of the list painter build a classed heading with its note and
  hidden sentence and no `noticeRow()`; ruling 6's sentence stops saying *Open Edit*.
- **`src/assignments.css`**: § ASSIGN TIDY lifted, its coarse rules into the existing
  `(pointer: coarse)` block and its controls into the top-of-sheet `touch-action` selector.
  `.assign-group-empty` and `.assign-group-orphan` go if nothing else wears them — check first:
  **four** other rules in the sheet borrow that amber by name in their comments (the fourth,
  `.assign-moved-nameless`, landed with WO-3.56 after this was booked). If the class goes, repoint
  each comment at `.assign-group-head.empty` rather than leaving it naming a class that is gone.
- **The harness**: every check that presses Edit or Duplicate by its words, or reads
  `.assign-group-empty` / `.assign-group-orphan`. At least `tools/verify/assignments.mjs`,
  `category-removal.mjs`, `points-grade.mjs`, `copy-class.mjs`, `touch-targets.mjs` and
  `class-tab-keeps-screen.mjs`; grep `tools/verify/` for the hooks before trusting that list. Since
  booking, `copy-class.mjs` (WO-3.56's nameless checks) and `dialog-kinds.mjs` (WO-1.77, a coarse
  `tap()`) also press `data-assignment-edit` — by hook, so they stay green if the hook moves intact.
- **A phone-width baseline for [WO-3.59](#wo-359--the-assignments-screen-scrolls-sideways-at-phone-width)**,
  measured and not fixed: the assignments screen's horizontal overflow at 390×844 under a coarse
  pointer, before this work order's change and after it, written as a note (no box) in `TESTING.md`
  § WO-3.54. WO-3.59 waits on this one partly to see whether it caused a new overflow, and needs the
  two numbers to tell. Fixing the overflow here is WO-3.59's scope, not this one's.
- **`design/mockups/proposed-assign-tidy.css`'s § ASSIGN TIDY banner, `README.md` section and
  `index.html` entry** amended to say the section landed.
- **`TESTING.md` § WO-3.54**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] On the assignment list, the title row's last control is ← All classes (`data-view-home`), and
      + New assignment is the last control of the body's first row, right-aligned.
- [x] No row carries an Edit button. Tapping a name opens the editor for that assignment, and the
      name button carries `data-assignment-edit`.
- [x] Each row's Duplicate and Delete are icon buttons whose `aria-label` names the assignment, with
      the `data-assignment-duplicate` and `data-assignment-delete` hooks unchanged; each is at least
      44px square under a coarse pointer.
- [x] An empty category draws one heading row with `.empty`, the note for its case word for word
      (ruling 5, all three cases), its full sentence in hidden text, and no row after it before the
      next heading. No `.assign-group-empty` element exists.
- [x] "Not in a category" draws one heading row with `.unfiled` — `.counted` added in a points class
      — and no notice row; its note is ruling 6's for its grading mode, word for word, and does not
      say *Edit*.
- [x] The hint carries ruling 7's three sentences.
- [x] 👤 On the teaching iPad, upright: the two doors sit where ruling 1 puts them, a name tap opens
      the editor, both icons read as what they are, and the empty and unfiled headings are legible
      without a bar. WO-3.56's amber nameless warning, on the note line above the table, still
      reads as its own message beside the new top row and the amber headings below it.
- [x] `CACHE` in `sw.js` is bumped.

**Traps** — **Move the hook, do not rename it.** `data-assignment-edit` routes in `src/shell.js` and
is what the harness presses; it goes onto the name button as it is. **Do not touch the roster** —
ruling 8. **The focus ring stays**: the name button is styled to look like text, and this repository
forbids suppressing a ring to finish the look. **The three removed sentences differ by grading mode
and weight** — the weighted, zero-weight and points branches each have their own, in the comment
above them; carry each into its heading's hidden text, do not collapse them into one.

## WO-3.55 — the assignment list sorts within each category, and writes nothing

**Ship** — · **Status** ✅ DONE — 2026-10-11 · **Size** M · **Depends on** WO-3.54, WO-3.59
**Closes roadmap** *(no box. Owner-directed, 2026-10-10.)*

**Booked 2026-10-10 with WO-3.54**, the second of the two pieces. Five column headings sort what is
under each category; the categories stay where the teacher put them. **The risk here is a silent
one**: the order a teacher sets with ↑ ↓ is the array order in the year document, and the Scores
grid reads its columns from it (`src/scores.js`, *"Nothing here sorts"*). A sort that wrote its
order back would rearrange the gradebook from a heading tap, invisibly. So the acceptance line this
work order exists for is the one that proves nothing is written.

**Surface.** [`design/mockups/assignments-tidy.html`](../../design/mockups/assignments-tidy.html),
frame C (frame B is the same list in the teacher's order), styled in
[`design/mockups/proposed-assign-tidy.css`](../../design/mockups/proposed-assign-tidy.css)
§ ASSIGN SORT. Lift, do not re-derive, and amend the banner in the same sitting.

**Rulings, the owner's, 2026-10-10**
1. **Five headings sort: Assignment, Points, Assigned, Due and Entered.** Each is a `<button>`
   (`.assign-sort-btn`) inside its `<th>`, which carries `aria-sort` while it is the active one.
   Unsorted headings show a faint ↕; the active one ▲ or ▼ in indigo.
2. **Categories stay put; what is under each one sorts**, "Not in a category" included.
3. **The first tap gives the useful direction**: Assignment A→Z, Points largest first, Assigned and
   Due soonest first, **Entered fewest first**. The second tap reverses; the third returns the
   teacher's order.
4. **The teacher's order — ↑ ↓ — is the default, and a sort overrides it.** While a sort is on, the
   arrows are disabled with the title *Sorted by Due — tap Your order to move it* (naming the column),
   and **↺ Your order** appears in the Actions column's heading, drawn only while a sort is on.
5. **A sort is a view and writes nothing**: not the array order, not `rev`, not a save.
6. **It is not remembered.** Leaving the screen, changing class or changing term returns the
   teacher's order. Nothing reaches `localStorage`.
7. **Names compare as a reader would** ("Quiz 2" before "Quiz 10"); **a blank date sorts last in
   both directions**; **ties keep the teacher's order**.
8. **A held column sorts by its own count** under Entered, like any row. *(This said "and keeps its
   *held* word" until 2026-10-11, and the list has no such word: `assignmentRow()` never asks
   `isHeld()`, and WO-3.47's readers were the queue, the home card, detail, the grade sheet and the
   CSVs. The owner dropped the clause rather than add a marker here.)*
9. **A sort survives an edit.** A due date changed while sorted by Due moves the row to its new place
   when the editor closes — as a date crossing a term edge already moves it. **The order holds while
   the editor is open** (the owner, 2026-10-11): `editAssignmentField()` repaints the list on every
   keystroke, so a sort read live would move rows around behind the dialog as she types a name or a
   date. The list keeps the order it had when the editor opened, and sorts again when it settles.
10. **The hint says it in words**: *tap a column heading to sort what is under each category; tap it
    again to reverse, a third time for your order. While a sort is on, the arrows rest — ↺ Your order
    brings them back.*

**Answered — the owner, 2026-10-11, before dispatch.** Ruling 8 loses its *held* word, which
the list never drew. Ruling 9's order holds while the editor is open. **WO-3.59 goes first**:
WO-3.54's phone baseline (`TESTING.md` § WO-3.54) found that the page's sideways scroll at 390px is
the Actions `<th>`'s absolutely positioned `.sr-only` span, and that is the cell ruling 4 rebuilds.
With WO-3.59 landed, its overflow check is the fence this work order's new headings are measured
against.

**Folded in at the same reading.** The drawing's coarse rule gives `.assign-sort-btn` a 44px
height and no width, and **DUE ↕** in the heading's 10px capitals is about 32px wide. Add
`min-width: 44px` to the coarse rule and say so in the lifted section, as a departure from the
drawing. `touch-targets.mjs` will not catch it: it measures `#assignmentsView` after the
assignments section has emptied the list, when the table is hidden. **Ruling 6's resets** cannot
live in `renderAssignments()`, which runs after every write. Key the state by class and term,
the way `paintListNote()` keys `listNote`, and clear it on the switch away from the screen.

**Deliverables**
- **`index.html`**: the five `<th>` hold sort buttons; the Actions `<th>` is the reset's slot
  (`.assign-col-reset`); the hint gains ruling 10's sentence.
- **`src/assignments.js`**: sort state held by the screen and nowhere else — column and direction —
  cleared by the paths in ruling 6; the comparator per ruling 7; the sorted copy built per group from
  the list the painter already has; arrows and reset per ruling 4.
- **`src/shell.js`**: the click routes for a sort heading and for ↺ Your order, beside the other
  `data-assignment-*` routes.
- **`src/assignments.css`**: § ASSIGN SORT lifted, its coarse rule into the existing block (with
  `min-width: 44px`, see above) and its button into the `touch-action` selector.
- **The harness**: a new check file for the rulings above, including the write-nothing line.
  It also runs `horizontal-overflow.mjs`'s assignments-screen check (WO-3.59) with a sort on: that
  block plants a stand-in button in the Actions `<th>` (`data-wo359-probe`), and once the real
  ↺ Your order exists, a real sort tap there replaces the stand-in.
- **`design/mockups/proposed-assign-tidy.css`'s § ASSIGN SORT banner, `README.md` section and
  `index.html` entry** amended to say the section landed.
- **`TESTING.md` § WO-3.55**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] Each of the five headings sorts the rows inside every group, groups in their own order; the
      first tap's direction is ruling 3's for each column, the second reverses, the third restores
      the teacher's order; the active `<th>` carries the matching `aria-sort` and no other does.
- [x] **A sort writes nothing.** After every sort tap, both directions on all five columns and
      ↺ Your order, the stored year document is byte-identical to before and `rev` has not moved —
      checked after `flush()`, since `update()` only schedules a save (WO-5.3's scar). The Scores
      grid's column order is unchanged. **Mutation-proved**: a planted write of the sorted order
      turns the check red, and **the plant is reverted before anything else is written.**
- [x] Names compare naturally, blank dates sort last in both directions, and equal keys keep the
      teacher's order — each with a fixture built to fail the naive comparison.
- [x] A held column sorts under Entered by its own count.
- [x] While sorted, every ↑ ↓ is disabled and titled with the column's name, and ↺ Your order is
      present; in the teacher's order it is absent and the arrows behave as before.
- [x] Leaving the list, changing class and changing term each return the teacher's order; no
      `planbook_` key is written by sorting.
- [x] Sorted by Due, an edited due date moves its row when the editor closes, and the sort stays on.
      While the editor is open, typing into the name or a date moves no row.
- [x] Under a coarse pointer, every sort button and ↺ Your order measures at least 44×44. At 390×844
      with a sort on, the assignments screen has no horizontal overflow.
- [x] The hint carries ruling 10's sentence.
- [x] 👤 On the teaching iPad: a heading tap sorts, the faint ↕ reads as tappable, and ↺ Your order
      brings the arrows back.
- [x] `CACHE` in `sw.js` is bumped.

**Traps** — **The Entered key is the figure the row's bar already draws**: `enteredCount()` over
`rosterOf(cls).length`, exactly as `progressCell()` reads it; a second count is the second opinion this repository refuses, and it
is how the bar and the order drift apart. **Sort a copy, never `cls`'s array or the document's**:
an in-place `sort()` on the list the painter was handed reorders the year without a single
`update()` call, and the write-nothing check would catch it only if it reads the stored document
rather than the live one. **Do not move the past-due prompt or the moved-work line** — they are
WO-3.54's layout.

**Not in scope** — **A view-only sort on the Scores grid**, by Due, reordering its columns on screen
and never in the document. The owner raised it on 2026-10-10 and it waits for the Scores
conversation, which comes next. **Collapsible categories**, deferred by the owner: the list is one
term long, and a collapsed group would hide the overdue tint and the part-filled bars inside it.

## WO-3.56 — an assignment needs a name, and an unnamed one takes one when it is opened

**Ship** — · **Status** ✅ DONE — 2026-10-11 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-10.)*

**Booked 2026-10-10**, out of a reading that turned out not to be a bug. The owner duplicated an
assignment from Homeroom and found the copy dialog's name field empty, expecting the source's
name. The field was doing its job: `startCopy()` fills it with `source.name || ''`, and the source
had never been named. The lead above it said so (*Copying "Untitled assignment"*). But the dialog let
an empty name through, so one tap would have put a nameless copy into every ticked class, each one
drawing as *Untitled assignment*. The editor turned out to have the same gap: it has no Save,
`settleEditor()` never looks at the name, and **+ New assignment then Done leaves a nameless row**,
which is probably how the Homeroom one was made. Rulings 1–3 are the copy dialog and rulings 4–5
the editor, folded in the same day.

**Rulings, the owner's, 2026-10-10**
1. **The copy dialog's name is required.** The copy button is disabled while the name field is
   blank. Whitespace counts as blank, so a field holding only spaces is refused too. This applies
   at both doors: the row's Duplicate and the editor's *Copy into other classes…*.
2. **An existing assignment with no name takes *Untitled assignment* as its name when it is opened
   to edit or to duplicate.** The words are the ones every reader already draws for a nameless
   assignment, so on screen it reads exactly as before, now as a real name the teacher can see and
   type over.
3. **The copy dialog keeps the source's own name as its starting value**, not *Copy of …*. This was
   asked and answered the same day: the dialog copies only into other classes, and the same name in
   each period is what the teacher means.
4. **The editor's Done refuses while the name is blank** (whitespace counts as blank). It says why
   and puts the caret in the name field, the way it already stops on dates no term holds.
   **Cancel is unchanged**: during a create it still removes the row.
5. **Close, Escape and the backdrop with a blank name do not refuse.** The assignment takes
   *Untitled assignment* and **a visible warning says it was saved without a name**. Closing is not
   blocked because a dialog that refuses Escape is a trap, and the no-lost-draft contract
   (`createAssignment()`'s header) says a half-written assignment is kept, not discarded.

**Rulings, the owner's, 2026-10-11, at the verdict**
6. **Duplicate gives a nameless source the name its copies take**, not a second *Untitled
   assignment*. If the teacher types over the words, she is naming this work, and the same name in
   every period is what ruling 3 says she means. This is how ruling 2 reads at the Duplicate door,
   and it is what `confirmCopy()` was built to do.
7. **The nameless warning showing only on the list it was set for is accepted here** and booked as
   [WO-3.57](#wo-357--the-nameless-warning-reaches-the-teacher-wherever-the-editor-closed). The row
   still reads *Untitled assignment*, so nothing is lost but the reminder.

**Deliverables**
- **`src/assignments.js`**:
  - `copyReady()` also requires a non-blank `copyName`.
  - `paintCopyFoot()`'s note says why the button is disabled when the name is the only reason.
  - `openAssignmentEditor()` and `startCopy()` apply ruling 2.
  - `settleEditor()` applies rulings 4 and 5. It already tells Done (`follow`) apart from the other
    closes.
  - Ruling 5's warning goes on the list's `listNote`, the visible line under the list's head that
    the moved-work note already uses, with `announce()` beside it for a screen reader.
    **`announce()` alone is not a warning**: it writes to an `.sr-only` live region and draws
    nothing. **The wording is the owner's**: *"Untitled assignment" was saved without a name. Edit
    it to give it a name.* It says *Edit it*, not *Tap Edit*, because WO-3.54 removes the Edit
    button and the name opens the editor instead. **The colour is amber, the owner's ruling,
    2026-10-10, from a drawing**: `.assign-moved`'s shape in `.assign-group-empty`'s colours
    (`#fff8e6` ground, `#f0dfa8` border, `#8a6d1a` text, a `#e0a800` left rule). That means a
    modifier class on the note, set only for this message, so the moved-work note stays indigo.
    No mark is added to the row itself.
- **`src/shell.js`**: if the copy-name input route doesn't already repaint the foot, it does now,
  so the button enables and disables as the teacher types.
- **The harness**: checks for each Acceptance line, beside WO-3.48/3.49's in
  `tools/verify/copy-class.mjs`.
- **`TESTING.md` § WO-3.56**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] With at least one class ticked, clearing the copy dialog's name field disables the copy button
      and the foot note says the copy needs a name. Typing a name enables it again without any
      other input. A name of only spaces stays disabled. Both doors behave the same.
- [x] Opening the editor on an existing assignment whose stored name is empty writes *Untitled
      assignment* as its name, once, and the editor's name field shows it. Opening it on a named
      assignment writes nothing: no `rev` change after `flush()`.
- [x] **A brand-new assignment is not affected.** `+ New assignment` still opens the editor with an
      empty name field, and Cancel still removes the row and writes nothing else.
- [x] Opening Duplicate on an unnamed assignment shows *Untitled assignment* in the name field, and
      the button is enabled once a class is ticked. Copying gives every copy that name, **and the
      source too, in the same `update()`**. Cancel writes nothing (`rev` unchanged after `flush()`),
      which is the dialog's standing rule for every held edit.
- [x] With the editor's name field blank, Done does not close it: the editor says the assignment
      needs a name and focuses the name field. Typing a name and pressing Done closes it as before.
      Cancel during a create with a blank name still removes the row.
- [x] With the name blank, Close, Escape and the backdrop each close the editor. The assignment's
      stored name is then *Untitled assignment*, and the list's note reads the owner's sentence in
      amber, while the moved-work note on its own is still indigo (checked in the DOM and computed
      style, not the live region). The same applies when a teacher
      clears an existing assignment's name and closes.
- [x] 👤 On the teaching iPad: Done refuses a blank name readably, and the nameless warning is
      noticed after a Close. *(Read by the owner 2026-10-11 and accepted for this work order. The
      refusal draws under the dialog's buttons, which is hard to see; that layout is
      [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled)'s.)*
- [x] `CACHE` in `sw.js` is bumped.

**Traps** — **A new assignment's empty name is not "an existing untitled assignment".** The create
flow writes `name: ''` and opens the same editor, so ruling 2 has to skip a create (`creatingId`).
Otherwise every new assignment arrives pre-named and the teacher has to clear it before typing.
**Duplicate's Cancel is a promise**: the dialog writes nothing until its button, so ruling 2 is
held there as a proposal and written with the copies, never on open. The editor has no such
promise, because it writes as it is typed. That is why the two doors write at different moments.
**The words are a fact, not a fallback string**: take *Untitled assignment* from wherever the
readers get it, or make a single named constant they share. Don't add another quoted copy;
`src/calendar-derived.js` and `src/glance.js` each already hold one.

**Ruling 5 writes during the close guard**, which already writes a scored move there. Write the
name in the same `update()` as anything else the settle writes, so `rev` moves once.
**Ruling 4's refusal must not reach the copy door**: `openCopyFromCreate()` calls
`settleEditor(follow)` too. Whether *Copy into other classes…* refuses a blank name like Done, or
hands the blank on to the copy dialog's own refusal (ruling 1), is the implementer's to argue in a
comment. Either works, but leaving it undecided does not.

**Not in scope** — **Backfilling names across the year** at load or by
migration: ruling 2 names an assignment only when a teacher opens it, the same forward-only shape
as WO-3.49's `termId`.

## WO-3.57 — the nameless warning reaches the teacher wherever the editor closed

**Ship** — · **Status** ✅ DONE — 2026-10-11 · **Size** S · **Depends on** WO-3.56
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11**, out of WO-3.56's verdict (its ruling 7). Ruling 5's warning, *"Untitled
assignment" was saved without a name*, goes on the list's `listNote`, which is keyed by class and
term. The verifier found that a blank editor closed from somewhere other than the assignment list
shows the warning only if that list is on screen.

**The premise, checked 2026-10-11, by reading the code; nothing was run.** It holds, but the gap is
narrower than the verdict says. `openAssignmentEditor()` has two callers, and the editor has three
doors:

| Door | A blank close shows the warning? |
|---|---|
| The name on a list row (`data-assignment-edit`, `src/shell.js`) | **Yes.** The row is on the list that is up, so the note is set for the term on screen. |
| `+ New assignment` | **Yes.** A create filed under another term moves the list there first (WO-3.50, ruling 1), so the note is set for the term on screen. |
| A due date on the calendar (`ASSIGNMENT_DUE`, `src/shell.js`) | **Only when the class's open term is the assignment's own.** |

The calendar door is the gap. `openClassOn(classId, 'assignments')` selects the class and shows the
list, but **not the term**: the list shows whichever term was last open for that class. The close
sets the note for the assignment's term, and `paintListNote()` drops a note set for any other term
on the next render. **The lost warning is a symptom.** On that path the assignment being edited is
not on the list behind the dialog at all, so the teacher closes the editor and the work she just
changed is nowhere on screen.

The Scores screen is named in `editorFollows()` as a screen the editor can be open over, but no door
from it opens the editor today.

*(**That last sentence is wrong**, and the read-only premise check missed it: the Scores screen has
had its own `+ New assignment` (`#scoresActions`, `data-assignment-new`) since WO-3.15. The
implementer found it and the verifier confirmed it from the tree on 2026-10-11. A blank close from
there sets the warning on the list's note, which the grid does not draw, so the teacher on Scores
sees nothing; it is drawn the next time that class's list is opened on that term. Rulings 4 and 5.)*

**Rulings, the owner's, 2026-10-11**
1. **The calendar door moves the list to the assignment's term, and the move is stored.** It calls
   `selectTerm()` for the assignment's term before the editor opens, so the class's saved open term
   (`planbook_openTermIds`) changes, exactly as a create already changes it. Showing the term for
   one visit without storing it was declined: it needs a new mechanism in `src/classes.js`, and the
   next repaint would snap the list back, taking the row away a second time. **This is not the
   calendar-filter rule in CLAUDE.md** ("a door, never a stored preference"): that rule stops a
   remembered filter silently hiding most of the year, and this move is visible, said in a sentence,
   and shows the teacher the work she tapped.
2. **The move says so, in the indigo note**, as a create's move does: *This list has moved to
   Quarter 2, the term "Persuasive essay" is due in.* (The term's and the assignment's own names, not
   those words.) No note when the list was already on that term. A blank close then puts the amber
   warning ahead of it on one line, which `setNamelessNote()` already does for a standing note on the
   same class and term, so that half needs no new code.
3. **A list scrolled so the note is off screen is not this work order's.** It is about where the
   note sits, not which doors reach it, and goes to
   [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled).

**Rulings, the owner's, 2026-10-11, at the verdict**
4. **The Scores screen's create door is accepted as it is and recorded.** A blank close from it
   shows no warning on screen: it is said in the live region and drawn on the list's next visit for
   that class and term. Where a warning should sit on the grid is a placement question and goes to
   [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled).
   Acceptance 1 and 3 are reworded to say so; nothing in `src/` moves for it here.
5. **The implementer's wording stands for a row filed outside its due date's term**: *…the term
   X is filed in.* Ruling 2's *is due in* is false for those rows, and the note keeps it for every
   other row.

**Deliverables**
- **`src/shell.js`**: the `ASSIGNMENT_DUE` branch of the calendar's item handler selects the
  assignment's term after `openClassOn()` and before `openAssignmentEditor()`.
- **`src/assignments.js`**: the arrival note (ruling 2), set for the class and term the list moved
  to. Whether `src/shell.js` calls `selectTerm()` and asks this file for the note, or this file
  exports one function that does both, is the implementer's to argue in a comment. Either works;
  leaving it undecided does not.
- **The harness**: checks for each Acceptance line, beside WO-3.56's.
- **`TESTING.md` § WO-3.57**, with the door table above, the Scores screen's create door named
  (ruling 4), the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] Every door into the assignment editor is named in `TESTING.md` § WO-3.57, with whether a blank
      close from it shows the warning. The Scores screen's `+ New assignment` is named as a door
      whose warning is not drawn on screen, only said in the live region and drawn on the list's
      next visit (ruling 4).
- [x] Opening an assignment from the calendar while its class's list is open on another term moves
      the list to the assignment's term, stores that term as the class's open term, and the indigo
      note says the list moved. When the list was already on that term, no note is drawn and the
      stored term is unchanged.
- [x] A blank close from each door that opens over the list leaves the owner's sentence, in amber,
      on the list behind the editor; the Scores door is ruling 4's. From the calendar door it is
      checked with the list starting on another term, and the arrival note follows the warning on
      the same line (checked in the DOM and computed style, not the live region).
- [x] `CACHE` in `sw.js` is bumped.

**Traps** — **A term with no room for the date.** An assignment's `termId` is the term it is filed
in, which is not always the term holding its due date (WO-3.50's unplaced work). Select the
`termId`, never the term the date falls in, or the list moves to a term the row is not on.
**`openClassOn()` has other callers** (the meeting-state item, at least): the term selection
belongs in the `ASSIGNMENT_DUE` branch, not in `openClassOn()`.

**Not in scope** — changing the wording or the colour of the warning; both are WO-3.56's rulings.
Where the note sits on a scrolled list (ruling 3).

## WO-3.58 — the dialogs behind the Assignments and Scores screens are read together, and a layout is ruled

**Ship** — · **Status** ✅ DONE — 2026-10-12 · **Size** M · **Depends on** WO-3.54, WO-3.55, WO-3.57, WO-1.77
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11**, out of WO-3.56's iPad reading. The editor's *needs a name* message draws
**under the dialog's buttons**, where it is easy to miss. The owner accepted that for WO-3.56 and
asked for the dialogs to be reviewed together instead of patched one at a time. They have each grown
a work order at a time, so a message, a note or a warning lands wherever that work order put it.

**This is a review, not a build.** It produces a drawing and rulings, and books the build as M or S
rows. Nothing in `src/` moves here.

**Why it waits for three rows.** WO-3.54 and WO-3.55 change the list the editor opens from, and
WO-3.57 may move where the nameless warning shows. Reviewing before them would mean drawing dialogs
that are about to change. **WO-3.57 hands it one case** (its ruling 4): a blank close from the Scores
screen's `+ New assignment` sets the amber warning on the list's note, which the grid does not draw.
Where that warning goes on the Scores screen is this review's to rule. **If any of those three ends up changing a dialog's layout, that change is
input to this review, not a reason to start it early.** Read what they changed before drawing.

**It also waits for WO-1.77**, added 2026-10-11, which gives the editor and its neighbours a
ruled width. Drawing them at 480 first would mean drawing a dialog about to get wider.

**Scope.** The dialogs reached from the Assignments and Scores screens. From `index.html` that is at
least `assignmentModal`, `assignmentMoveModal`, `holdModal`, `assignmentCopyModal`,
`assignmentDeleteModal`, `categoriesModal`, `gradingModeModal`, `categoryRemoveModal`,
`letterScaleModal` and `gradesRecordModal`. **The owner confirms the list at dispatch**: add any
that are missing and drop any that are out.

**Deliverables**
- A drawing in `design/mockups/` under `PROTOCOL.md`, one frame per dialog as it is now and as
  proposed. It shows where each message, note and warning sits relative to the buttons.
- One rule, owner-ruled, for where a dialog's messages go. The first case is the editor's refusal:
  above its buttons, or beside the field it is about.
- The build booked as M or S rows at the foot of this file and the running order, each naming the
  dialogs it touches.
- **`TESTING.md` § WO-3.58**, the `CHANGELOG.md` entry.

**Surface.** [`design/mockups/dialog-messages.html`](../../design/mockups/dialog-messages.html),
drawn 2026-10-12 against v191: frames 1–10, one per dialog, each at its WO-1.77 width, every message
outlined; frame 11 (S0, S1, S2) for the Scores screen. **No `proposed*.css`**: every proposal is a
shipped element moved, so the page adds only chrome to `mockup.css`. The record is
`design/mockups/README.md` § *Where a dialog's messages go*.

**Rulings, the owner's, 2026-10-12, at dispatch**
1. **The scope is exactly the ten dialogs listed above** — `assignmentModal`, `assignmentMoveModal`,
   `holdModal`, `assignmentCopyModal`, `assignmentDeleteModal`, `categoriesModal`,
   `gradingModeModal`, `categoryRemoveModal`, `letterScaleModal` and `gradesRecordModal`. Nothing
   added. `scoresKeysModal` and the past-due banner stay out.
2. **Option A.** *A dialog's messages — refusals, warnings, notes — draw ABOVE its buttons, in one
   place, for every dialog in scope.* **First case:** the editor's *needs a name* refusal moves from
   under the buttons to just above Cancel/Save. **Not "beside the field."**

*(The editor has no Save: its buttons are Done, Copy into other classes… and Cancel, and "just above
Cancel/Save" is read as just above that row. Nothing else in the ruling is read.)*

**What the review found, dialog by dialog** — where each message draws at v191. A *message* is a
sentence drawn only when something is the case; standing prose that is on every open (the lead, the
grey hints, a field's caption) is the dialog's own text. Where that line is not obvious the drawing
says so in amber.

| Dialog | Kind | Its messages today | Under the rule |
|---|---|---|---|
| `assignmentModal` | form 640 | `#assignmentTermNote` (amber) under the fields; `#assignmentError` (red) **after `.modal-actions`** | **Moves** — both into one place directly above the buttons → WO-3.63 |
| `assignmentMoveModal` | confirm 480 | a `.class-hint`, *To change the date instead…*, **after `.modal-actions`** | **Moves** above the buttons → WO-3.64 |
| `holdModal` | confirm 480 | none | complies |
| `assignmentCopyModal` | report 900 | `#assignmentCopyNote` directly above the buttons; per-line amber `.assign-copy-flag`s in the list | complies; the per-line flags stay on their lines (the drawing's reading, **ruled by the owner 2026-10-12**) |
| `assignmentDeleteModal` | confirm 480 | none | complies |
| `categoriesModal` | form 640, no Done | `#categoryTotal` above *Add a category*; `#categoryError` **at the foot, under Add** — and **written by nothing** since WO-3.1 | **Moves** up beside the total → WO-3.64 |
| `gradingModeModal` | confirm 480 | `#gradingModeWarn` (amber) under the lead | complies — "in one place" is above the buttons and together, not one fixed spot (**the owner, 2026-10-12**) |
| `categoryRemoveModal` | confirm 480 | none | complies |
| `letterScaleModal` | form 640, no Done | `#scaleNote` above *Add a band* | complies |
| `gradesRecordModal` | report 980 | Print and CSV **first**, by design; the `.grade-none` banner and the three `.grades-report-empty` sentences **under** them | **Move** above Print and CSV → WO-3.65 |

**A proposal awaiting the owner — not ruled.** WO-3.57's ruling 4 handed this review the Scores
screen's nameless warning: a blank close from Scores' `+ New assignment` sets the amber line on the
assignment list's note, which the grid does not draw. That is a screen, so rule 2 does not settle it.
The drawing proposes the same shipped line on Scores, reading the same note — **S1** after the
past-due prompt and before the summary row (the drawing's lean: one notice band, in the list's own
order), or **S2** under the summary row beside `+ New assignment`. Booked as WO-3.66 with the
placement an Open line, the owner's at its dispatch. **WO-3.57's ruling 3 also handed this review a
case** — a scrolled list's note sitting off screen — which is not one of the ten dialogs and is not
ruled here; it rides on WO-3.66 as a second Open line rather than being dropped.

*(**All of it was ruled the same day, after the verdict, and none of it reopened a box.** The review
predicted the Scores placement and the scrolled-list case would wait for WO-3.66's dispatch; the
owner took both on reading the verdict. **S1**, the Scores host drawing the **whole** note, indigo
included, and the off-screen case **accepted and recorded**, which discharges WO-3.57's ruling 3 —
all in WO-3.66's own *Ruled* block, which now has nothing open at dispatch. The same sitting closed
the drawing's two unbooked questions as drawn: "in one place" means above the buttons and together,
so grading mode's warning stays its headline; and a copy line's flag stays on its line. Recorded in
`design/mockups/README.md` § "Decided, the owner, 2026-10-12, after the verdict".)*

**Acceptance**
- [x] Every dialog in the confirmed scope has a frame as it is now, showing where its messages draw.
- [x] The rule for where messages go is written here as the owner's ruling, with the editor's
      refusal as its first case.
- [x] The build is booked as rows below L, and the drawing passes `wo-sweep.mjs` § 19.

**Not in scope** — building any of it, and the dialogs outside this scope (attendance, roster,
settings), which have their own work orders. **Nor the Scores Keys dialog** that
[`design/mockups/scores-tidy.html`](../../design/mockups/scores-tidy.html) frame D proposes — the
owner, 2026-10-11: it is a read-only list with a ✕ and no message, note or warning to place, like
its twin on Attendance, so neither row waits on the other.

## WO-3.59 — the assignments screen scrolls sideways at phone width

**Ship** — · **Status** ✅ DONE — 2026-10-11 · **Size** S · **Depends on** WO-3.54
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11**, owner-directed, out of WO-1.77's verdict. Measuring the assignment editor at
390×844 under a coarse pointer, the implementer found the dialog inside 95vw with nothing in it
scrolling, and **the assignments screen underneath scrolling sideways by 134px**, with one planted
assignment. That is the page, not a dialog. `tools/verify/horizontal-overflow.mjs` checks the page at
three sizes but never opens the assignments screen, so nothing has looked.

**Check the premise first.** The cause is not diagnosed. The implementer named one candidate: the
fixture's term with a blank date. Reproduce the 134px with a real-shaped class before changing
anything, find the element that is wider than the screen, and write it down. If it is the fixture
alone, close this work order on that finding and fix the fixture.

**After WO-3.54**, which reshapes the list's top row and its rows. Fixing the overflow first would be
undone by it, or would hide whether WO-3.54 caused a new one.

**WO-3.54 named a cause, and WO-3.55 now waits for this one** (moved 2026-10-11, the owner's call).
`TESTING.md` § WO-3.54 found the element whose right edge is the page's `scrollWidth` on every
fixture: the Actions `<th>`'s `<span class="sr-only">Actions</span>`, absolutely positioned with
no positioned ancestor, so `.assign-table-wrap`'s `overflow-x: auto` does not clip it. Reproduce
that rather than taking it on trust. **WO-3.55 rebuilds that `<th>`** into the ↺ Your order slot, so
the fix must hold for a heading cell that holds a button as well as the span. Fix the cause, not
the one span.

**Acceptance**
- [x] `TESTING.md` § WO-3.59 names the element that overflowed and why, or shows that only the
      fixture did.
- [x] At 390×844 under a coarse pointer, the assignments screen with assignments in at least two
      categories has no horizontal overflow, and `horizontal-overflow.mjs` checks it there. With the
      fix reverted, that check fails.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. If `src/` or `index.html`
      changed, `CACHE` in `sw.js` is bumped.
- [x] `TESTING.md` § WO-3.59 carries these lines verbatim with the evidence for each.

**Not in scope** — other screens at phone width, unless the same element causes theirs. Report them.

## WO-3.60 — the Scores screen's top matches the other class screens

**Ship** — · **Status** ✅ DONE — 2026-10-12 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11**, owner-directed, out of a sitting that drew the screen first from a photograph
of the teaching iPad upright. It is the third screen in the run that tidied Attendance (WO-2.58) and
Assignments (WO-3.54), and **the owner's rule for that run is that similar, matching or analogous
controls sit in the same place on every class screen.** Scores was built before either and draws six
rows between its title and its grid. ⌨ Keys and 🖨 Grade sheet keep their words where Attendance's
doors have none, + New assignment leads a row of its own, and the search row sits between the flag
bar and the grid the flags write into. **The first of three pieces**, cut at booking to stay below
L: [WO-3.61](#wo-361--the-scores-keys-open-a-dialog-and-clear-and-note-get-a-key) moves the keys
into a dialog and gives Clear and Note a key, and
[WO-3.62](#wo-362--the-scores-column-head-gets-lighter-and-the-name-column-narrower) lightens the
grid's head.

**Surface.** [`design/mockups/scores-tidy.html`](../../design/mockups/scores-tidy.html), frame 0 (as
it ships) and frame A, styled in
[`design/mockups/proposed-scores-tidy.css`](../../design/mockups/proposed-scores-tidy.css)
§ SCORES TIDY, with `design/mockups/README.md` § "Scores, tidied". Frame E maps all five class
screens' tops; Calendar and Signals diverge from it today, and the owner ruled that is expected until
their own passes. **Lift the section rather than re-deriving it** (`PROTOCOL.md` § When the drawing
lands), and amend its banner in the same sitting. `.scores-col-meta`, `.scores-col-name.wraps` and
`.scores-col-edit` are WO-3.62's — leave them in the drawing.

**Rulings, the owner's, 2026-10-11**
1. **The summary keeps its own row** (frame A, not B), and **+ New assignment takes that row's right
   end** (`.scores-top`) — the edge WO-3.54 gave it on Assignments, one level below ← All classes.
   `#scoresActions` goes.
2. **⌨ and 🖨 lose their words and sit at the search row's right end**, in a group
   (`.scores-tools`, `.attendance-tools` value for value), each keeping its words as its
   `aria-label` and `title`. Exactly as on Attendance (WO-2.58 ruling 7).
3. **Attendance's sort toggle joins them, first in the group**: one `.class-action-btn` reading
   *Sort: **Last***, flipping to First. **A view only**: a module variable, never a preference, back
   to Last on a class switch, as `sortBy` is in `src/attendance.js`.
4. **The search box does not take the whole row.** It gives up width first, 360px down to 200
   (`.scores-find`, worn beside `.search-box`), and the pills flow beside it
   (`.scores-pills-flow`, worn beside `.scores-filter-pills`) and wrap below only when there are too
   many. **This reverses WO-2.58 ruling 8**, "the Scores box keeps its 360". The values are the
   drawing's, not `.attendance-find`'s: that box grows into spare room, and here the pills want it.
   *(**Built the other way, and ratified 2026-10-12.** The drawing's values measured `boxW:360,
   pillsOnBoxLine:0` at 820px in the app — a wrapping flex row picks its lines from each item's base
   size before anything shrinks — so the build wears `.attendance-find`'s: `flex: 1 1 200px`,
   200–360, with the pills `flex: 0 1 auto`. The owner read it on the iPad with the real category
   names and accepted it, together with its one known edge: when the pills cannot fit beside a 200px
   box the whole group drops below and the box grows back to 360, as the drawing's values would.)*
5. **The flag bar moves directly over the grid**, under the search row — Attendance's order: find,
   then write, then the grid. Its label becomes **The cell you are in**, because Clear and Note are
   not flags. The key strip and the note panel stay directly under it.
6. **The search placeholder becomes Attendance's**, *Search students…*.
7. **The summary's `·` separators stay as they ship.**

**Deliverables**
- **`index.html`**: `#scoresActions` goes; the summary and `data-assignment-new` share a
  `.scores-top` row; `#scoresToolbar` gains `.scores-tools` holding the sort toggle, ⌨ and 🖨 (both
  without words, hooks unchanged); the search box gains `.scores-find` and the new placeholder; the
  pills host gains `.scores-pills-flow`; `#scoresFlags` moves under the toolbar with its new label.
  **The comments that describe the old order go or are rewritten**, including the one above the
  toolbar arguing where the pills sit relative to the count.
- **`src/scores.js`**: the sort toggle's state, label and route; the grid drawn in that order. The
  `toggle('hidden')` calls on the empty state still find every element they hid.
- **`src/scores.css`**: § SCORES TIDY lifted — `.scores-tools`, `.scores-top`, `.scores-find`,
  `.scores-pills-flow` — with the coarse rules into the existing `(pointer: coarse)` block.
  `.scores-actions` goes if nothing else wears it.
- **The harness**: `tools/verify/score-grid.mjs` (the actions row and the Keys button's words),
  `keys-legend-scores.mjs` and `keys-legend-guards.mjs` (the button), `score-search.mjs` and
  `class-tab-keeps-screen.mjs` (the search box), `score-history.mjs` and `score-notes.mjs` (the flag
  bar), `touch-targets.mjs`, and new checks for the sort toggle. Grep `tools/verify/` for
  `scoresActions`, `scores-actions` and `Flag the cell` before trusting that list.
- **`design/mockups/proposed-scores-tidy.css`'s banner, `README.md` section and `index.html` entry**
  amended to say § SCORES TIDY's frame A half landed.
- **`TESTING.md` § WO-3.60**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] On Scores, the body's first row is the summary with + New assignment as its last control,
      right-aligned. `#scoresActions` does not exist.
- [x] The search row ends in a group holding, in order, the sort toggle, ⌨ and 🖨. ⌨ and 🖨 carry
      no visible words; their accessible names and their `data-scores-keys` and
      `data-grades-record` hooks are unchanged.
- [x] The sort toggle reads *Sort: Last*, puts the grid in first-name order and reads *Sort: First*
      on a tap, and is back to *Last* after a class switch. ↵ and ↓ walk the students **in the order
      drawn** under either sort. The grade sheet prints in last-name order under either, and with
      the sort's effect on `gridOrder()` planted, that check fails.
- [x] At 1180px under a coarse pointer the search row is one line. At 820px the box is narrower
      than 360px and at least one pill sits on the box's line.
- [x] The flag bar is the last thing above the grid — or the key strip or note panel when either is
      open — and its label reads *The cell you are in*. The search placeholder reads *Search
      students…*.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [x] 👤 On the iPad, after a force-quit, upright and lying down: the top reads in the order the
      drawing gives, the search row's wrap looks right with five categories, and the sort toggle
      flips the grid.

**Traps** — **Move the hooks, do not rename them.** `data-scores-keys`, `data-grades-record`,
`data-assignment-new` and `data-scores-search` route in `src/shell.js` and are what the harness
presses. **`gridOrder()` is shared with `src/grades-report.js`** so the printed sheet matches the
SIS's order; the sort must not reach it — sort a copy for the screen. **The key handlers walk the
rows the DOM holds** (`moveWithinColumn()`), so a sort that reorders data without redrawing the
rows sends ↵ to the wrong student. **Do not touch Calendar or Signals** — their divergence is ruled
expected until their own passes. **The ⌨ button still opens the strip here**; the dialog is
WO-3.61's.

**Not in scope** — the keys dialog, `?`, C and N (WO-3.61), and the column head (WO-3.62).

## WO-3.61 — the Scores keys open a dialog, and Clear and Note get a key

**Ship** — · **Status** ✅ DONE — 2026-10-12 · **Size** M · **Depends on** WO-3.60
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11** with WO-3.60, same drawing, frame D. On Attendance ⌨ opens a dialog and `?`
opens it from the keyboard; on Scores it unfolds a strip inside the panel. The strip's rows are
`nowrap`, so each had to be measured for spilling through its border at 390px, and the `← →` row
has been reworded twice to fit (WO-3.16, WO-3.24). The first hint paragraph under the grid restates
nearly every key. And two of the flag bar's five buttons — Clear and Note — have no key at all.
**After WO-3.60**, which moves ⌨ into the toolbar and the flag bar over the grid; both are edited
again here.

**Surface.** [`design/mockups/scores-tidy.html`](../../design/mockups/scores-tidy.html), frame D
(the dialog) and frame A's flag bar and first hint paragraph. No new CSS: the dialog wears
`src/attendance.css`'s `.attendance-keys`, `.attendance-key-row` and `.attendance-key` as shipped,
and the `modal-form` kind (WO-1.77).

**Rulings, the owner's, 2026-10-11**
1. **⌨ opens a dialog**, *Entering scores from the keyboard*, of the `modal-form` kind, with the
   rows frame D draws. `#scoresKeys` and the `keysOpen` disclosure go.
2. **`?` opens it from the Scores screen, including from inside a score cell**, as it does on
   Attendance, and closing it gives focus back to the cell. A score cell asks for a decimal keypad
   and `?` is not a score.
3. **C clears the cell** — exactly what the Clear button does, score and mark together, in one
   press. **N opens the note on the cell**, exactly as the Note button does. Neither is a key the
   grid already uses, so N keeps WO-3.32's Trap rather than reversing it. **Under presentation mode
   N does nothing**, because the Note button is not there either.
4. **The flag bar carries the letters**: *Clear (C)* and *Note (N)*, as it carries L, M and X.
5. **The first hint paragraph shrinks** to frame A's two sentences and points at ⌨. The sentence
   *Escape does nothing here because there is no dialog to close* is reworded to say Escape does
   nothing **on the grid**; the dialog's last row says Escape closes it.
6. **The dialog stays outside WO-3.58's review** — it has no message, note or warning to place.
   WO-3.58's *Not in scope* names it.

**Deliverables**
- **`index.html`**: `#scoresKeys` goes; a `scoresKeysModal` dialog with frame D's rows; the ⌨
  button opens it (`aria-haspopup="dialog"`, no `aria-expanded`); the flag bar's two labels; the
  hint's first paragraph and its Escape sentence.
- **`src/shell.js`**: `?` on the Scores screen opens the dialog with the focused cell as opener, the
  way the Attendance branch does at `e.key === '?'`.
- **`src/scores.js`**: C and N in `handleScoreKey()`; the strip's state and its decision-4 comment
  go.
- **`src/scores.css`**: `.scores-keys`, `.scores-key` and the keys button's expanded state go if
  nothing else wears them.
- **The harness**: `tools/verify/keys-legend-scores.mjs` and `keys-legend-guards.mjs` rewritten for
  a dialog; `score-grid.mjs` and `score-notes.mjs` for the flag bar's words; new checks for `?`, C
  and N.
- **`design/mockups/proposed-scores-tidy.css`'s banner and `README.md` section** amended to say
  frame D landed.
- **`TESTING.md` § WO-3.61**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] ⌨ opens a `modal-form` dialog holding a row for ↵, ⇥, ↑ ↓, ← →, L, M, X, C, ⌫, N and Esc.
      `#scoresKeys` does not exist, and every dialog in `index.html` still wears exactly one kind.
- [x] `?` pressed inside a score cell opens the dialog, writes nothing into the cell, and closing
      the dialog puts focus back in that cell.
- [x] C in a cell holding a score and a flag leaves it blank with no flag, as the Clear button does;
      `c` does the same. Ctrl+C in a cell still copies.
- [x] N in a cell opens that cell's note panel with focus in its field, as the Note button does; `n`
      does the same. Under presentation mode N opens nothing and writes nothing into the cell.
- [x] The flag bar reads *Clear (C)* and *Note (N)*, and the first hint paragraph is frame A's.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [x] 👤 On the iPad with a keyboard attached, after a force-quit: `?`, C and N from a score cell,
      and the dialog reads whole upright.

**Traps** — **The character filter.** WO-3.25 refuses characters on their way into a score cell, so
C, N and `?` must be taken by the key handler before that filter sees them, and the handler must
`preventDefault` so none lands in the field. **Modifiers**: `src/shell.js` returns on Ctrl, Alt and
Meta before the score branch, which is what keeps Ctrl+C as copy and Ctrl+N as a new window —
measure that still holds rather than reading it. Shift is not a modifier here: `e.key` is `'C'` with
Shift held, and refusing a modified letter refuses the capital (`handleScoreKey()`'s own comment).
**Check first whether Escape already closes the note panel** and hands focus back; if not, say so in
`TESTING.md` rather than building it — it is not ruled.

**Not in scope** — the column head (WO-3.62), and Attendance's own keys dialog.

**Built 2026-10-12** — the record is `.claude/dispatch/WO-3.61-result.md` and `TESTING.md` § WO-3.61.
- **The Traps' question has an answer: Escape does not close the note panel**, and neither does
  Enter — only *Done* hands back to the cell. Not built, as the Traps said. It moved one row: frame
  D's N row promised *Enter or Esc*, so the shipped row names *Done*, and a check in
  `verify/score-notes.mjs` holds the row to the behaviour.
- **`?` opens the dialog from anywhere on the Scores view that is not a field**, not only from a
  score cell — ruling 2's "from the Scores screen". The note panel's field and the search box keep
  `?` as a character.
- **N under presentation mode is silent** — no announcement — because ruling 3 says it does nothing.
  `openScoreNote()` keeps its own spoken refusal, which no tap can reach while the button is hidden.
- **The new dialog exposed a hole in Attendance's legend read**: `readMarkingKeys()` searched for its
  `<dl>` to the end of the document and borrowed the score dialog's the moment one of the guards
  renamed Attendance's. Both reads now stop at the next dialog.

## WO-3.62 — the Scores column head gets lighter, and the name column narrower

**Ship** — · **Status** ✅ DONE — 2026-10-12 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11** with WO-3.60, same drawing, frame C. In the photograph the column heads are
the tallest thing on the screen: five stacked lines — the name, *out of 10*, the category chip,
*due Sep 7*, and a Hold button. Names truncate at one line ("Summer Reading E…"), and the two frozen
columns take a large share of an upright iPad.

**Surface.** [`design/mockups/scores-tidy.html`](../../design/mockups/scores-tidy.html), frame C,
styled in [`design/mockups/proposed-scores-tidy.css`](../../design/mockups/proposed-scores-tidy.css)
§ SCORES TIDY — `.scores-col-meta`, `.scores-col-name.wraps` and `.scores-col-edit`.

**Rulings, the owner's, 2026-10-11**
1. **Points and due date share one line** (`.scores-col-meta`): *out of 10 · due Sep 7*.
2. **The name may wrap to two lines** before it truncates (`.scores-col-name.wraps`).
3. **The column name opens the assignment editor** for that assignment (`.scores-col-edit`), as
   the name does on Assignments (WO-3.54 ruling 2): a real `<button>` in the name's own type, indigo
   with a dotted underline under a pointer, 44px tall under a coarse one.
4. **Hold stays in the head, under the category chip, on every column.** A held column shows its
   shipped *Held* mark and *Commit* in the same place. The head goes from five lines to four.
5. **The frozen name column narrows, 190px → 156px.** The pair's `left` offsets and the
   `scroll-padding` values move with it.
   **Revised by the owner at dispatch, 2026-10-12: 168px on both pointers**, not 156 — the laptop
   goes 190 → 168 and the iPad keeps the 168 it already had. Laptop and coarse become **one set of
   numbers**: name `168`, grade column `left: 168`, third column (`.scores-cat-avg`) `left: 252`,
   `scroll-padding-left: 252`, `.filtered`'s `scroll-padding-left: 336`. The figure above is kept as
   the ruling given on the drawing; this line is the one built.

**Open — the owner, at dispatch: the width under a coarse pointer.** ~~Ruling 5 was given on the
drawing's figure, 190 → 156, and **190 is the laptop width**: under a coarse pointer
`src/scores.css` already narrows the name column to 168px, so on the iPad 156 buys 12px. Either
156 everywhere, or the coarse width narrows by the same 34px to 134 — measured against the longest
name on a real roster at the coarse type size before it is chosen.~~
**Settled 2026-10-12, the owner at dispatch: neither — 168 on both pointers** (ruling 5's revision
above). The struck paragraph is the question as it was booked. The Acceptance line *"the ruled width
at both pointer sizes"* means 168 at both.

**Deliverables**
- **`src/scores.js`**: `columnHead()` builds the name as a button carrying `data-assignment-edit`
  with the assignment's id, one meta line, the chip, and the hold line, in that order.
- **`src/scores.css`**: the three classes lifted; the name column's width and every number tied to
  it — the grade column's `left`, the third column's `left`, both `scroll-padding-left`s — at both
  pointer sizes; the stuck head's `scroll-padding` top re-measured, because it is the head's
  height and the head is shorter now.
- **The harness**: `tools/verify/score-grid.mjs`, `past-due.mjs`, `ungraded-count.mjs`,
  `held-readers.mjs`, `assigned-and-due.mjs`, `points-grade.mjs` and `score-history.mjs`, which read
  the head's lines or the frozen widths; a new check that the name opens the editor. Grep
  `tools/verify/` for `scores-col-pts`, `scores-col-due` and `190` first.
- **`design/mockups/proposed-scores-tidy.css`'s banner and `README.md` section** amended to say
  frame C landed.
- **`TESTING.md` § WO-3.62**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] Every assignment head draws, in order, the name button, one meta line holding points and due
      date, the category chip, and the hold line. No head carries a separate points or due line.
- [x] Tapping a column's name opens the assignment editor on that assignment; the button carries
      `data-assignment-edit` and is at least 44px tall under a coarse pointer.
- [x] A name too long for one line takes two, and one too long for two truncates.
- [x] Every unheld column shows Hold under its chip; a held one shows *Held* and *Commit* there.
- [x] The name column is the ruled width at both pointer sizes, and the grade column, the category
      average column and both `scroll-padding-left`s sit where the frozen pair now ends. A focus
      move by ↵ and by ⇥ leaves the cell fully clear of the frozen columns and the stuck head.
- [x] A past-due column's due date still draws in its overdue colour inside the meta line.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [x] 👤 On the iPad, after a force-quit, upright: the head reads as four lines, a long name wraps,
      the name opens the editor, and Hold sits under the chip.

**Traps** — **The frozen widths are tied numbers.** `src/scores.css` names four that move together
— the name width, the grade column's `left`, the third column's `left` and `scroll-padding-left` —
at each pointer size, plus `.filtered`'s padding; a check asserts the pair. Change one and you change
them all. **The overdue colour rides on `.scores-col-due.overdue`** (WO-3.19), so the due half of
the meta line keeps that class as a span of its own. **The head is `position: sticky`** and its
height is what the top `scroll-padding` covers; measure it after the change, do not compute it.

**Not in scope** — the top of the screen (WO-3.60) and the keys (WO-3.61).

## WO-3.63 — the assignment editor's messages draw together, just above its buttons

**Ship** — · **Status** ✅ DONE — 2026-10-12 · **Size** S · **Depends on** WO-3.58
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12** out of [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled),
the first case of its rule. The editor's *needs a name* refusal (`#assignmentError`, WO-3.56 ruling
4) draws **after** `.modal-actions`, under Done, where the owner missed it on the iPad. Its other
message, the amber *no term holds these dates* line (`#assignmentTermNote`, WO-3.50), draws in a
second place, under the fields and above the two hints.

**Surface.** [`design/mockups/dialog-messages.html`](../../design/mockups/dialog-messages.html),
frame 1. No stylesheet change is drawn: both elements keep their classes and their margins.

**Rulings, the owner's, 2026-10-12** (WO-3.58's ruling 2, carried)
1. A dialog's messages — refusals, warnings, notes — draw **above its buttons, in one place**.
2. The refusal moves to **just above** the buttons. **Not beside the Name field.**

**Deliverables**
- **`index.html`**: `#assignmentTermNote` and `#assignmentError` move to sit together directly before
  the editor's `.modal-actions`, after the two `.class-hint` paragraphs — the term note first and the
  refusal last, nearest Done (the drawing's order, ruled by the owner at dispatch; see *Answered*
  below). The markup comments at both
  move with them and say why they are there.
- **`src/assignments.js`**: nothing should need to change — both are found by id. If a comment there
  says where either one sits, it is corrected.
- **The harness**: beside WO-3.56's refusal check in `tools/verify/copy-class.mjs`, and beside the
  term-note checks in `tools/verify/assignments.mjs` — with the refusal showing, its bottom is above
  the actions row's top, and nothing but the term note sits between them; with the term note
  showing, the same. Measured from `getBoundingClientRect()`, not from DOM order alone.
- **`TESTING.md` § WO-3.63**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped** —
  `index.html` is `SHELL` entry one.

**Acceptance**
- [x] With the name blank, Done shows the refusal **above** the editor's buttons, the last thing
      before them, and still focuses the Name field. The same from *Copy into other classes…*.
- [x] The amber term note, when it shows, sits in the same place, directly above the refusal (or
      directly above the buttons when the refusal is not showing). Nothing draws after
      `.modal-actions` in the editor.
- [x] Both messages keep their wording and their colours; the refusal is still spoken by the live
      region.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [x] 👤 On the iPad, after a force-quit, upright: + New assignment, then Done with no name — the
      refusal is seen without looking for it. *(Read by the owner 2026-10-12 against v192: good.)*

**Answered 2026-10-12, the owner, at dispatch: as drawn, both.** (a) **The order inside the place**:
the term note first and the refusal last, touching Done, because the refusal is about the tap just
made and is the one thing that can stop it. The other order would have been just as much "one
place"; the drawing's was taken. (b) **The accommodation prompt** (`[data-accommodation-prompt]`,
WO-3.8) **is not a message**: it is a panel about the category above it, with its own button, and in
the message place it would put a sentence about students' accommodations directly on top of Done. It
stays under the fields, and this row grows no line for it.

**Traps** — **The refusal is focus-bearing**: `refuseBlankName()` puts the caret in the Name field,
and on an iPad that raises the keyboard, which may cover the bottom of the dialog. Read the 👤 line
with that in mind; if the keyboard hides the refusal, say so, and do not move it beside the field —
the owner ruled that out. **Do not move the accommodation prompt** — the owner ruled it is not a
message (*Answered*, above).

**Not in scope** — every other dialog (WO-3.64, WO-3.65), and the wording of either message.

## WO-3.64 — the move confirm's note and the categories panel's error line draw above their buttons

**Ship** — · **Status** ✅ DONE — 2026-10-12 · **Size** S · **Depends on** WO-3.58
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12** out of [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled).
Two dialogs whose one stray element sits under their buttons. **`assignmentMoveModal`**: the note
*To change the date instead, close this and you are back in the assignment.* is a `.class-hint` after
`.modal-actions`. **`categoriesModal`**: `#categoryError`, a `.class-error` line, sits at the very
foot of the panel, under *Add a category* and under both hints — and **no code path has ever written
a sentence into it**: `showCategoryError()` is called five times in `src/categories.js`, each with
`''`, since WO-3.1, and `tools/verify/categories-weights.mjs` reads it only to assert it is empty.

**Surface.** [`design/mockups/dialog-messages.html`](../../design/mockups/dialog-messages.html),
frames 2 and 6.

**Rulings, the owner's, 2026-10-12** (WO-3.58's ruling 2, carried) — a dialog's messages draw above
its buttons, in one place. In `categoriesModal`, which has no Done, the button the rule is read
against is *Add a category*.

**Deliverables**
- **`index.html`**: in `#assignmentMoveModal`, the `.class-hint` moves to directly before
  `.modal-actions`. In `#categoriesModal`, `#categoryError` moves to directly after `#categoryTotal`,
  before `.category-actions` (or is deleted — the Open line).
- **The harness**: in `tools/verify/assignments.mjs`, the move confirm's note is above its buttons;
  in `tools/verify/categories-weights.mjs`, `#categoryError` is between the total and the Add row (or,
  if deleted, its two reads go with it and the *nothing is blocked* check keeps its other halves).
- **`TESTING.md` § WO-3.64**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] In the move confirm, the note is above *Move it to …* and *Keep it in …*, and nothing draws
      after `.modal-actions`. Its wording is unchanged.
- [x] In Categories & weights, nothing draws after the two hints, and `#categoryError` is either
      directly under `#categoryTotal` or gone, as the owner ruled.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.

**Answered 2026-10-12, the owner, at dispatch: move.** `#categoryError` moves to directly after
`#categoryTotal`, before `.category-actions`, as the drawing has it, and is not deleted: the harness's
two reads stay meaningful and a future refusal has the place the rule names. Deleting it was the other
honest answer — a slot for a message nothing says is a slot nobody tests — and was not taken. The
Acceptance line's "or gone" is left as written; this paragraph is the ruling it defers to.

**Traps** — **`.modal-body p + .modal-section-label`** spaces a label after a paragraph; the move
confirm's note becomes the paragraph before `.modal-actions`, not before a label, so check nothing
else's margin changes with it. **Do not give `#categoryError` a message** in this row: what it says,
if anything, is a different work order.

**Not in scope** — the editor (WO-3.63), the Grade sheet (WO-3.65), and the weights total's own
wording.

## WO-3.65 — the grade sheet's warning and empty sentences draw above Print and CSV

**Ship** — · **Status** ✅ DONE — 2026-10-12 · **Size** S · **Depends on** WO-3.58
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12** out of [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled).
`gradesRecordModal` puts Print and Download CSV **first**, deliberately (its markup comment: the table
under them is a term long). Its messages are built by `openGrades()` into `#gradesRecordBody`, which
comes **after** the buttons: the `.grade-none` banner when the weights do not total 100, and one of
three `.grades-report-empty` sentences when no class is open, the roster is empty, or nothing is
assigned in the term. Under the rule, each draws above the buttons.

**Surface.** [`design/mockups/dialog-messages.html`](../../design/mockups/dialog-messages.html),
frame 10.

**Rulings, the owner's, 2026-10-12** (WO-3.58's ruling 2, carried) — a dialog's messages draw above
its buttons, in one place. Here "its buttons" are Print and CSV, at the top.

**Deliverables**
- **`index.html`**: an empty host for the sheet's messages before `.grades-report-actions` in
  `#gradesRecordModal`.
- **`src/grades-report.js`**: `openGrades()` puts the banner, the empty sentence, or both (banner
  first — ruling 1 below) into that host and empties it on every open; the head, the table, the key and the closing note stay in
  `#gradesRecordBody`, in their order.
- **The harness**: `tools/verify/grade-sheet.mjs` — with the weights at 95, the banner's bottom is
  above Print's top; with an empty roster, likewise the empty sentence; with neither, the host is
  empty and takes no height. And `tools/verify/print-sheets.mjs` — what prints is what printed
  before (the banner prints today).
- **`TESTING.md` § WO-3.65**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] With the weights not totalling 100, the no-grade banner draws above Print and Download CSV,
      and the sheet under them is otherwise unchanged.
- [x] Each of the three empty states draws its sentence above the buttons, and the sentence does not
      also draw under them. With the weights off 100 as well, the banner sits above the sentence.
- [x] A sheet with no message draws exactly as before: the host is empty and adds no space.
- [x] The printed sheet is unchanged — the banner prints where it printed, first under the shared
      `#printHeader`.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.

**Ruled — the owner, 2026-10-12, before dispatch** *(two questions found reading this row against
the code; the proposals taken as written)*:
1. **The banner and an empty sentence can both show, and the host takes both, the banner first.**
   With the weights off 100 **and** an empty roster (or nothing assigned), `openGrades()` draws both
   today, in that order (`src/grades-report.js`, the `record.unbalanced` branch, then the roster
   check). The Deliverables read "the banner, or the empty sentence" until this ruling.
2. **"Nothing under them" meant the sentence, not the head.** In the empty-roster and
   nothing-assigned states `openGrades()` draws the sheet's head (`.grades-report-head`) into
   `#gradesRecordBody` before the sentence, and the head stays there. Acceptance line 2 is reworded
   to say so; read literally, the old wording failed a correct build.
3. **The print line closes on the build, not on a ruling.** The print block hides only the modal's
   header and `.grades-report-actions`, `body[data-grades-print] .grade-none` is not scoped to
   `#gradesRecordBody`, and the sheet's own head is already hidden on paper — so a host before the
   buttons prints exactly where the banner prints now, first under the shared `#printHeader`.
   Acceptance line 4's *"or the build says why not and the owner rules"* is dropped;
   `tools/verify/print-sheets.mjs` is what shows it. If it does not, that is a finding to bring back,
   not a line to re-widen.

**Found at build, 2026-10-12 — ruling 1's premise, half of it.** With the weights off 100 and an
**empty roster**, `openGrades()` does not draw the banner, and did not before the move:
`gradesRecord()` asks the balance question of a student (`probe = students[0]`), so with nobody on the
roster `unbalanced` is false and only the sentence draws. The pair draws over a roster with **nothing
assigned in the term**, and the host takes it banner first, as ruled. The build changes neither half;
`TESTING.md` § WO-3.65 carries the readings.

**Ruled — the owner, 2026-10-12, after the verdict:** an empty roster needs no banner. The sentence
alone is what it should draw, so the finding above books nothing. *(One difference stands beside
it, as built and unruled: over a roster with **nothing assigned**, the grade sheet draws the banner
above its sentence, while the Scores screen hides `#scoresNoGrade` on every empty state before it
returns (`src/scores.js`, `renderScores()`). It is the row to book if the two are ever meant to match.)*

**Traps** — **The print block in `src/scores.css`** hides `body > *` but the gated surface, and inside
it hides `.grades-report-actions` and `.grades-report-head`; a new host outside `#gradesRecordBody`
is a new element to that block. Check it prints, or is hidden, **on purpose**. **The key and the
closing note are the sheet, not messages** (WO-3.58's reading): they print, and they stay under the
table.

**Not in scope** — the attendance record (`attendanceReportModal`), which has the same shape and is
not in WO-3.58's scope; and the order of the head relative to the buttons.

## WO-3.66 — a nameless close from the Scores screen shows its warning on the Scores screen

**Ship** — · **Status** ✅ DONE — 2026-10-12 · **Size** S · **Depends on** WO-3.58
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12** out of [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled),
the case [WO-3.57](#wo-357--the-nameless-warning-reaches-the-teacher-wherever-the-editor-closed)'s
ruling 4 handed it. A blank close of the editor opened from the Scores screen's `+ New assignment`
names the work *Untitled assignment* and sets WO-3.56's amber warning on the assignment list's note
(`#assignmentsMoved`, keyed by class and term). The Scores screen does not draw that note, so the
teacher there sees nothing; a screen reader hears it, and the list shows it on its next visit.
**This is a screen, not a dialog, so WO-3.58's rule does not settle it**; the placement is the
owner's ruling below.

**Surface.** [`design/mockups/dialog-messages.html`](../../design/mockups/dialog-messages.html),
frames S0, S1 and S2. The line is the shipped `.assign-moved.assign-moved-nameless`, worn as it is.

**Ruled, the owner, 2026-10-12: S1** — the same line drawn on Scores, read from the one note the
list keeps, so the two screens can never disagree and opening the editor clears it on both, placed
after the past-due prompt and before the summary row: one notice band at the top of the body, in the
list's own order (past-due, then the note). *(S2, under the summary row beside `+ New assignment`,
was the alternative drawn and not taken.)*

**Deliverables**
- **`index.html`**: a host for the note in `#scoresView`, after the past-due prompt and before the
  summary row (S1).
- **A module of its own for the note** (ruling (d) below): `listNote`, the setters
  `src/assignments.js` uses today, and one paint that fills both hosts from it, the way
  `src/past-due.js` paints its two. **`src/assignments.js`** and **`src/scores.js`** each import it and
  call the paint on render for the class and term on screen; neither imports the other.
- **The harness**: beside WO-3.57's door checks — a blank close from Scores' `+ New assignment`
  draws the owner's sentence in amber on the Scores screen, checked in the DOM and computed style,
  not the live region; and opening the editor again takes it down on both screens.
- **`TESTING.md` § WO-3.66** (and an amendment to § WO-3.57's door table, which records this door as
  not drawn), the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [x] A blank close from the Scores screen's `+ New assignment` leaves the owner's sentence, in
      amber, on the Scores screen, between the past-due prompt and the summary row (S1). The list shows the same note for the same
      class and term.
- [x] A create from Scores filed under another term draws the indigo moved note on Scores too, from
      the same `listNote` — the whole note, amber ahead of indigo on one line when both apply.
- [x] Opening the editor again clears it from both screens; another class or term does not draw it.
- [x] On a class with no roster, the note still draws on Scores, with `#scoresTop` hidden under it —
      checked, not assumed.
- [x] No import loop: the note's module imports neither `src/assignments.js` nor `src/scores.js`, and
      `src/scores.js` does not import `src/assignments.js`.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [x] 👤 On the iPad, after a force-quit, upright: + New assignment from Scores, then ✕ with no name
      — the warning is noticed on Scores.

**Ruled — the owner, 2026-10-12, after WO-3.58's verdict.** Nothing is left open at dispatch. *(It
said so before (d) and (e) existed, and was wrong for an afternoon: a reading of the row against the
code found both, and the owner took the proposals the same day.)*
- **(a) S1** — as under *Ruled* above.
- **(b) The indigo moved-work note comes too: the Scores host draws the whole note.** A create from
  Scores filed under another term moves the class's open term, so the grid changes term under the
  teacher — the confusion WO-3.57's ruling 2 put the indigo sentence there to answer. Taking the
  amber case only would mean filtering `listNote`, a second reading of the one note.
- **(c) A scrolled list's note off screen is accepted and recorded, not built.** Scrolling to the
  note on close yanks the teacher away from the row she was working on; pinning it covers rows on a
  portrait iPad for every note. The live region announces it, it is there on scrolling up, and both
  screens' `+ New assignment` sit near the top where it draws. If an iPad reading ever shows it
  missed, that is a row of its own with an observed case. This discharges WO-3.57's ruling 3.

- **(d) The note moves to a module of its own**, which both screens import. The Deliverables first
  had `src/scores.js` call `paintListNote()` out of `src/assignments.js`, and that closes an import
  loop — `src/assignments.js` imports `src/held-column.js`, which imports `src/scores.js` (for
  `formatPercent` and `gridOrder`) — which this repo has refused by hand and `wo-sweep.mjs` would not
  catch. Of the three answers — a module of its own, `src/shell.js` painting the note after it
  repaints Scores, or accepting the loop — the first was taken: it is the shape `src/past-due.js`
  already has with `[data-past-due]`, and the plainest form of the Trap's "one note, never a copy".
- **(e) A class with no roster draws the note on Scores.** The host sits **outside** `#scoresTop`, so
  hiding that row does not hide it, and the one "nothing to grade" state the note can coexist with is
  an empty roster — the note exists only while its term holds an assignment. That is correct: the
  sentence is still true, and the list draws it too. The harness checks it draws rather than leaving
  it unexamined.

**Traps** — **A second note is a second truth**: the Scores host reads `listNote`, never a copy of
it, or the two screens drift. **The Scores screen hides its top row in "nothing to grade" states**
(`#scoresTop`); check where the host sits in those.

**Not in scope** — the warning's wording and colour (WO-3.56's rulings), and the ten dialogs
(WO-3.63, WO-3.64, WO-3.65).

## WO-3.67 — WO-3.66's no-roster check passes with the Scores screen's own paint deleted

**Ship** — · **Status** ✅ DONE — 2026-10-13 · **Size** XS · **Depends on** WO-3.66 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12**, owner-directed, out of [WO-3.66](#wo-366--a-nameless-close-from-the-scores-screen-shows-its-warning-on-the-scores-screen)'s
verdict. A ride-along on `tools/verify/copy-class.mjs`: fold it into the next sitting that has that
file open.

**Why it exists.** WO-3.66's verifier deleted the Scores screen's call that paints the list's note
and re-ran the harness. Acceptance lines 1–3 went red; **line 4 — a class with no roster still draws
the note on Scores — stayed green.** Its fixture closes a blank editor from the *assignment list*,
then taps the Scores pill, and the list's paint already fills **both** hosts from `src/list-note.js`,
so the Scores host is full before Scores renders at all. The check proves where the line sits on a
no-roster screen and that `#scoresTop` is hidden around it; it does not prove that **Scores' own
render** draws it. That render is the one that runs when a teacher reaches a no-roster class's Scores
any other way, such as from home. *(Clearing a note left by another class is WO-3.66's third
Acceptance line and is already checked; it is not this work order's.)*

**Re-cut 2026-10-12, owner-directed, after the first dispatch stopped.** As first booked, the route
went through **another class's Scores** to empty the host. Built that way, it went red with no
mutation in place: 2062 checks, 1 failed, WO-3.66 line 4, with the note missing from **both** hosts.
That is not a defect. `src/list-note.js` § "When it is dropped" rules that a Scores render on another
class or term **drops the note**, so any detour through another class deletes the note it was meant
to test. An empty host and a live note cannot both be produced by a route through the app. **Do not
try the detour again.** The record is `.claude/dispatch/WO-3.67-result.md`.

**Deliverables**
- **The line-4 check empties the Scores host by hand before Scores renders**: after the blank close
  on the list, the fixture blanks `#scoresMoved` over `evalJs` and asserts that it is empty. Then it
  reaches the no-roster class's Scores from home by a route that renders no assignment list on the
  way. That leaves the note alive in `src/list-note.js` and the host empty, so only Scores' own
  `paintListNote()` call can refill it. This is a test-only write to a view element and adds no
  door to `src/`. The existing assertions stay as they are.
- **A mutation**: delete Scores' paint call, show the reworked check go red, and revert it before
  writing anything else.
- **`TESTING.md` § WO-3.67** and the `CHANGELOG.md` entry.

**Acceptance**
- [x] WO-3.66's no-roster check reaches the no-roster class's Scores screen with the Scores host
      emptied by the fixture and no list rendered after it, and still passes.
- [x] With Scores' call to the note's paint deleted, that check goes red. The mutation is reverted, and
      `TESTING.md` § WO-3.67 shows the red output.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [x] `TESTING.md` § WO-3.67 carries these lines verbatim with the evidence for each.

**Traps** — **There is no `+ New assignment` on a no-roster Scores screen**: it lives in `#scoresTop`,
which that state hides, so the note can only arrive from the list. Do not build a door to make the
fixture easier. Blanking the host from the harness is not a door. **No route through another class
or term can stand in for the hand-emptied host**, because that render drops the note (see the
re-cut above). **If the reworked check goes red before the mutation**, read both hosts first. If the
list host still holds the note and the Scores host does not, that is a defect in `src/scores.js`:
stop and report it rather than adjusting the check. If both are empty, something dropped the note on
the way. That is the route, so stop and report it as well. **Nothing in
`src/` moves** if it passes, so no `CACHE` bump is owed.

## WO-3.68 — an excused cell keeps the score it had

**Ship** — · **Status** ✅ DONE — 2026-10-22 · **Size** M · **Depends on** — · **Blocks** WO-3.69, WO-3.70
**Closes roadmap** *(no box. Owner-directed, 2026-10-21.)*

**Booked 2026-10-21**, owner-directed. **Why it exists.** Marking a scored cell excused erases the
score. The owner wants excused to mean *this counts toward nothing*, not *this is gone*: "I might
want to drop the lowest grade in a category, but I still want a record of that grade."

**The grade math does not change.** `src/grade-engine.js` already returns before reading `v` on an
excused cell, both in the category sum and in `workRows()`. The erasing is done by the Scores
screen alone. `cellFor()` in `src/scores.js` forces `{ v: null, flag: 'excused' }`, `applyFlag()`
clears the typed value and says so, and typing a number into an excused cell takes the flag off.
Each of those three has a comment arguing for it. The argument was that a number shown in a cell the
grade is not using is a silent wrong number. The owner's answer is to draw the number **struck
through**, so it is shown and plainly not counted.

**The owner's rulings (2026-10-21)**
1. On the grid, an excused cell that holds a score draws the number **struck through**, in the
   excused colours.
2. **Typing a number into an excused cell changes the kept score, and the cell stays excused.**
   Emptying the field clears the score and keeps the flag. Pressing X (or the Ex button) again takes
   the flag off, and the kept score counts.
3. `missing` is unchanged: it still holds no number.

**Deliverables**
- **`docs/data-model.md`.** An excused cell may carry a value: `{ v: 62, flag: "excused" }`. It still
  counts toward neither earned nor possible. Change the cell table and the prose that says excused
  holds no number. Old `{ v: null, flag: "excused" }` cells stay valid and draw as today, so there is
  no `SCHEMA_VERSION` bump. A score erased by an earlier build is not recovered.
- **`src/scores.js`.** `cellFor()` keeps the value on `excused`. `applyFlag()` keeps the score when it
  sets excused, and its sentence says the score is kept and no longer counts. The typing path follows
  ruling 2. The cell draw (the input build and `paintCell()`) shows a kept score struck through, and
  the aria label says it is excused, kept and not counted. Rewrite the three comments that argue the
  old behaviour in the same sitting.
- **`src/scores.css`.** The strike, on `.scores-input.excused` when the cell holds a value.
- **Readers that print a cell.** `markText()` in `src/grades-report.js` prints `Ex (62)`, and its legend
  line says the score is kept and not counted. The `Excused` words in `src/score-history.js` gain the
  kept score. Student detail shows the kept score wherever it lists an excused piece.
- **An audit of every reader of a cell's value in `src/`**: each must test the flag before it reads
  the value. Known to do so: the engine, `src/signals.js` (`countedWork()` and the percentage walk),
  `src/graded-pieces.js`, `src/past-due.js`. A reader that reads the value first is fixed here and
  named in `TESTING.md`.
- **A mutation**: make the engine read `v` on an excused cell, show the grade checks go red, and
  revert it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.68** and the `CHANGELOG.md` entry.

**Acceptance**
- [x] Excusing a scored cell keeps `v` in the document. The class grade is the same as for an excused
      blank, in both grading modes.
- [x] Pressing X again on that cell takes the flag off, and the kept score counts in the grade.
- [x] Typing a number into an excused cell writes `v` and keeps `flag: 'excused'`. Emptying it
      clears `v` and keeps the flag.
- [x] The grade sheet, its CSV and the score history on student detail show the kept score with the
      excused mark. *(Re-homed 2026-10-22, the owner's ruling: this line read "both CSVs … and student
      detail", and the student report lists no excused piece to show one on. That half is
      [WO-3.70](#wo-370--the-student-report-lists-excused-work-with-any-score-it-kept)'s first line.)*
- [x] A backup holding `{ v: null, flag: 'excused' }` cells restores and draws them as before.
- [x] The past-due prompt never sweeps an excused cell, with or without a kept score.
- [x] With the engine reading `v` on excused, the grade checks go red. The mutation is reverted, and
      `TESTING.md` § WO-3.68 shows the red output.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [x] 👤 On the iPad, a kept score reads as struck through and not counted, in normal mode and in
      presentation mode.
- [x] `TESTING.md` § WO-3.68 carries these lines verbatim with the evidence for each.

**Traps** — **The struck-through number is the whole of the safety.** A number on screen that the grade
is not using must never look like one that it is. Do not drop the strike for any state, size or
mode. **Harness checks assert the old behaviour on purpose** (`tools/verify/score-grid.mjs` and others
expect the value cleared and the flag taken off by typing). Change them to the new rulings and
name each in `TESTING.md`. Do not delete them. **Do not touch `missing`.** **The engine is not
edited**, apart from the mutation that is reverted.

## WO-3.69 — a category can drop each student's lowest N scores

**Ship** — · **Status** ✅ DONE — 2026-10-23 · **Size** M · **Depends on** WO-3.68 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-21.)*

**Booked 2026-10-21**, owner-directed, beside [WO-3.68](#wo-368--an-excused-cell-keeps-the-score-it-had).
WO-3.68 lets a teacher drop a score by hand and keep it. This lets a category drop each student's
lowest N for itself, a common grading rule ("drop the lowest quiz").

**A dropped score is worked out, not written.** Nothing is written to a cell. If the drop were an
`excused` flag, a later, lower score could not take the drop over, and the teacher would have to
re-pick by hand. So the engine decides at read time, and the decision moves when a score changes.

**Deliverables**
- **`docs/data-model.md`.** An optional `dropLowest` whole number on a category. An absent key means
  nothing is dropped, the same rule as an absent threshold key. There is no `SCHEMA_VERSION` bump, and
  every earlier backup restores unchanged.
- **`src/grade-engine.js`.** The category walk leaves out each student's N lowest **scored** cells by
  percentage of the assignment's points, from earned and possible both. One exported asker, such as
  `isDropped(doc, cls, termId, studentId, assignmentId)`, is the only way any screen learns which
  cells are dropped, the same pattern as `isHeld()`. `openWork()` and `projectedClassGrade()` take
  the drop into account.
- **`src/categories.js`.** A *Drop lowest* field per category in the categories editor. Blank or 0
  removes the key.
- **Readers.** The Scores grid draws a dropped cell with WO-3.68's strike and the word *dropped*. The
  grade sheet, both CSVs and student detail mark it. Each asks `isDropped()`.
- **A mutation**: make `isDropped()` drop nothing, show the drop checks go red, and revert it.
- **`CACHE` bump**, **`TESTING.md` § WO-3.69** and the `CHANGELOG.md` entry.

**The owner's rulings (2026-10-22)**
1. **A `missing` zero is never dropped.** A marked zero is the teacher's decision. It always counts,
   and the drop chooses from the scored cells only.
2. **Of two equal low scores, the one with the earlier due date is dropped.** If the due dates are
   also equal, the column order decides, so the same document always drops the same cell.
3. **The setting applies to a points-mode class in the same way.** Work filed under no category has
   no setting, so none of it is dropped.
4. **If N is at least the number of scored cells, the best one is kept.** A drop never empties a
   category, so it never redistributes that category's weight.
5. **A dropped score still counts toward the *A run of low scores* rule.** Dropping is a grading
   policy, and a string of low scores is still worth noticing. The rules that read the grade see the
   drop through the engine. That rule reads scores, so it does not ask `isDropped()`.
6. **Extra credit (zero-point work) is never dropped and does not count toward N.** It has no
   percentage to rank by. Its points still add to earned as they do today.

**Acceptance**
- [x] The category and class grades match a hand-worked fixture with `dropLowest` 1 and 2, in both
      grading modes.
- [x] A new score lower than the dropped one takes the drop over, and the old one counts again.
- [x] Excused, ungraded and held cells are never counted toward N. `missing` follows ruling 1, ties
      follow ruling 2, and zero-point work follows ruling 6.
- [x] The grid, grade sheet, both CSVs and student detail mark the same cells as dropped.
- [x] Signals and merge fields read the same grade that the screens show. *A run of low scores*
      still counts a dropped score (ruling 5).
- [x] A backup with no `dropLowest` key anywhere restores and grades as before.
- [x] With `isDropped()` dropping nothing, the drop checks go red. The mutation is reverted, and
      `TESTING.md` § WO-3.69 shows the red output.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [x] 👤 On the iPad, the *Drop lowest* field and a dropped cell read clearly.
- [x] `TESTING.md` § WO-3.69 carries these lines verbatim with the evidence for each.

**Traps** — **Never write the drop into a cell.** **No screen works out which cell is dropped**; every
one asks `isDropped()`. A second opinion is how the grid and the grade come to disagree. **The drop is
per student**: each student's lowest N are different assignments.

## WO-3.70 — the student report lists excused work, with any score it kept

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-3.68 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-22.)*

**Booked 2026-10-22**, owner-directed, out of [WO-3.68](#wo-368--an-excused-cell-keeps-the-score-it-had)'s
verdict. **Why it exists.** WO-3.68's fourth Acceptance line asked for the kept score on "both CSVs"
and on student detail. The grade sheet, its CSV and the score history show it. The student report
cannot: neither its screen nor `studentCsv()` in `src/detail.js` lists an excused piece at all.
Their work rows are `openWork()`'s outstanding and missing rows, and excused work is in neither, so
there is no row for a kept score to sit on. The owner's ruling was to give the report excused rows
rather than to narrow the line, so that half of WO-3.68's line 4 is re-homed here, not waived.

**Deliverables**
- **`src/grade-engine.js`.** A reader for the student's excused pieces in the term, a sibling of
  `openWork()` and `heldWork()`: name, category, points, and the kept score or none. **Never fold
  excused rows into `openWork()`** — it feeds every *what it would take to move* projection, and an
  excused piece moves nothing. A held column's excused cell is the held reader's, not this one's.
- **Student detail (`src/detail.js`, `src/detail.css`).** The report lists excused work under its
  own word, after the live and held rows, each with its kept score when there is one, in the same
  mark the grade sheet uses (`Ex (62)`), or `Ex` alone. What prints is what is on screen.
- **`studentCsv()`.** The same rows in the Work section, State cell `excused` or `excused — 62 kept`
  (wording the implementer's to propose, the grade sheet's legend the model). `detailModel()` carries
  them in their own key, the way `onHold` is kept apart from `work`.
- **A mutation**: make the reader leave the kept score off, show the report checks go red, and
  revert it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.70** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] The student report's screen and its CSV list each excused piece in the term, with its kept
      score when it has one and `Ex` alone when it does not.
- [ ] The grade, the to-move card and every `openWork()` reader are unchanged by the new rows.
- [ ] An excused cell in a held column is listed once, as held work, and not again as excused.
- [ ] A student with no excused work gets a report and a CSV byte-identical to today's.
- [ ] With the reader leaving the kept score off, the report checks go red. The mutation is reverted,
      and `TESTING.md` § WO-3.70 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] 👤 On the iPad, the excused rows read clearly on the report, in normal mode and in presentation
      mode.
- [ ] `TESTING.md` § WO-3.70 carries these lines verbatim with the evidence for each.

**Traps** — **The excused rows are a third kind, not a widened `openWork()`**: CLAUDE.md's held-column
rule applies word for word. **The engine's grade math is not edited.** **If WO-3.69 lands first**, a
dropped score is not an excused one: it is worked out, never flagged, and stays off these rows unless
the owner rules otherwise.

## WO-3.71 — a copied class keeps each category's drop lowest

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-3.69 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-23.)*

**Booked 2026-10-23**, owner-directed, out of [WO-3.69](#wo-369--a-category-can-drop-each-students-lowest-n-scores)'s
verdict. **Why it exists.** `copyClass()` in `src/classes.js` builds each category through
`copyCategories()` in `src/categories.js`, which calls `newCategory(c.name, c.weight)` and nothing
else. So a class copied from one whose *Quizzes* drop their lowest score arrives with *Quizzes*
dropping nothing, and nothing on screen says so. The setting is a grading decision about the
category, like its weight, which the copy already keeps — the argument WO-3.30 made for
`gradingMode`.

**Deliverables**
- **`copyCategories()` carries `dropLowest`** when the source category has one that `dropCountOf()`
  would honour, and writes no key when it does not. The key stays absent-means-default: a copy of a
  category with no drop gets no `dropLowest` key, not a `0`.
- **The copy's grade is the source's rule.** Nothing in `src/grade-engine.js` moves.
- **`tools/verify/copy-class.mjs`** gains a check that a copied category keeps its drop, and that a
  category with none gets no key.
- **A mutation**: make `copyCategories()` drop the key again, show the new check goes red, and revert
  it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.71** and the `CHANGELOG.md` entry, which also
  retires WO-3.69's entry's sentence that copying does not carry the setting yet.

**Acceptance**
- [ ] Copying a class whose category drops its lowest N gives a class whose matching category drops
      its lowest N.
- [ ] Copying a category with no drop writes no `dropLowest` key.
- [ ] Every other field a copy carries or refuses is unchanged.
- [ ] With `copyCategories()` leaving the key off, the new check goes red. The mutation is reverted,
      and `TESTING.md` § WO-3.71 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.71 carries these lines verbatim with the evidence for each.

**Traps** — **Copy the key, not a number for every category**: writing `dropLowest: 0` into a copy
is the seeded-default mistake CLAUDE.md's settings-block rule refuses. **`letterScale: null` in the
copy is a separate, existing decision** and is not this work order's to change. **If the owner's
closing-a-quarter thread makes the drop per term**, the shape this copies changes; re-read that
thread's note before `--start`.

## WO-3.72 — a quarter's grades can be recorded, and the engine says when they stop matching

**Ship** — · **Status** ✅ DONE — 2026-10-23 · **Size** M · **Depends on** — · **Blocks** WO-3.73
**Closes roadmap** *(no box. Owner-directed, 2026-10-23, from the closing-a-quarter thread.)*

**The first of four, WO-3.72 to WO-3.75.** **Read before building any of these four:** the design thread
[`plans/closing-a-quarter.md`](../closing-a-quarter.md), which holds every ruling with its date, and
its drawing [`design/mockups/closing-a-quarter.html`](../../design/mockups/closing-a-quarter.html),
styled in [`design/mockups/proposed-quarter.css`](../../design/mockups/proposed-quarter.css). Booked
2026-10-23, owner-directed, the day the thread was ruled. **Why it exists:** grades are re-keyed into
Blackbaud by hand, and once a quarter is keyed, any later change in Planbook — a score, an excuse, a
weight, the letter scale, a drop count — leaves two grades for one student with nothing on screen to
say so. Grade changes after a quarter ends are allowed and normal for about two weeks, so the answer
is a record and a reminder, **never a lock**.

**Rulings that bind all four** (the owner, 2026-10-23; the note has the full list):
- **No lock.** A recorded quarter stays editable, always.
- **A recording appends**, like the contact log, and the newest wins. Nothing in the app deletes one.
  The history is kept and **no screen shows it** — revisit at year end
  ([`future-features.md`](../future-features.md) § 6).
- **Whether a quarter still matches is derived at read time, never stored.** No edit path sets a
  "changed" bit, so no edit path can forget to.
- **Both the percentage and the letter are compared.** A percentage that moves inside the same
  letter is a change.
- **Grading settings stay per class**, not per term; per-term settings are not part of this.
- **The word is *Record Q1 grades*.** *Commit* belongs to a held column (WO-3.52), a different act.
- **Names and grades never show under a projector.** The bars name classes and counts only.

**What it is.** The data and the engine half, with no screen: a writer that records a class's
quarter, and readers that say whether the quarter has ended, whether it is recorded, who no longer
matches, and how many boxes are empty. WO-3.73 and WO-3.74 draw from these and compute nothing.

**Deliverables**
- **A `termRecords` array in the year document, created by its first write and never seeded**
  (CLAUDE.md, WO-6.1's rule: `newYearDocument()` gains nothing, `SCHEMA_VERSION` does not move, and
  every earlier backup restores). One entry per recording: `{ id, classId, termId, at, grades:
  [{ studentId, percentage, letter }] }`, `at` from the log's `localStamp()` (`src/log.js`).
- **A new module, `src/term-record.js`**, holding:
  - **one writer**, `recordTerm()`, which pushes one entry inside one `update()` and does nothing
    else — the log's shape (WO-4.4): no updater, no delete, no id lookup in the file. Each grade is
    `classGrade()`'s own `percentage` and `letter`, never a second computation.
  - **the readers**: whether a term has ended or ends today (its `end` against `todayISO()`); the
    newest record for a class and term; the students who no longer match it, each with what was
    recorded and what it is now; and the empty boxes.
- **Who is in a recording**: every student on the class's roster whose `classGrade()` has a
  percentage. **Who no longer matches**: a student whose live percentage or letter differs from the
  newest record, or who has a grade now and was not in it. **Percentages are compared at the two
  decimals the screens print**, so a float that prints the same is never a change.
- **Empty boxes**: a cell in a live column of the term with no score and not flagged `excused` or
  `missing`. **A late mark with no score is empty; a dropped cell never is**, because it always holds
  a score. A held column's cells are not counted here; uncommitted held columns are a reader of their
  own, by name. The reader returns the count and the category names, for the line *There are 7 empty
  boxes in Q1, across Exams and Projects.*
- **`sw.js`**: the new module in `SHELL`, and a `CACHE` bump.
- **`docs/data-model.md`** gains the block and the rulings above. **`docs/FERPA.md` and
  `privacy.html` are read** for whether grade data in a new place changes a sentence; they move
  together if it does (CLAUDE.md § Accommodations).
- **`tools/verify/term-record.mjs`**, registered in `tools/verify-shell.mjs`.
- **A mutation**: make the comparison ignore the percentage, show the percentage-only checks go red,
  and revert it before writing anything else.
- **`TESTING.md` § WO-3.72** and the `CHANGELOG.md` entry.

**Acceptance**
- [x] Recording a class's quarter appends one entry holding every graded student's percentage and
      letter, equal to `classGrade()`'s; recording again appends a second and changes neither.
- [x] With nothing changed since a recording, no student is reported as changed.
- [x] A score edit that moves a percentage inside the same letter reports that student as changed,
      with the recorded and the live figures.
- [x] A weight, letter-scale or drop-lowest change that moves grades reports exactly the students
      whose figures moved.
- [x] The ended and ends-today readers answer for the term's end date, the day before and the day
      after.
- [x] The empty-boxes reader counts a scoreless late mark, never a dropped, excused or missing cell,
      and nothing in a held column, and names the categories the empty boxes are in.
- [x] A backup with no `termRecords` key restores and reads as unrecorded.
- [x] `src/term-record.js` holds one writer, and it only pushes.
- [x] With the comparison ignoring the percentage, the percentage-only checks go red. The mutation is
      reverted, and `TESTING.md` § WO-3.72 shows the red output.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [x] `TESTING.md` § WO-3.72 carries these lines verbatim with the evidence for each.

**Answered, the owner, 2026-10-23 (relayed at `--start`): left out.** A student who was recorded and
has since **left the roster** is not reported as changed, not counted in any "changed" figure, and not
listed — the proposal, taken as written: a withdrawal is Blackbaud's business, and a reminder that
cannot be cleared is worse than none. So the comparison walks the class's **current roster** and never
a record's own `grades[]` looking for people, and the harness asserts it on a student who is in the
record, has left the roster, and whose grade has since moved — the case that tells a "left out"
implementation from one that happens to be. Recorded beside question 9 in
[`plans/closing-a-quarter.md`](../closing-a-quarter.md) and in `docs/data-model.md` § Recording a
quarter's grades.

**Traps** — **The comparison asks the engine and stores nothing**: a cached "changed" flag is the
second truth CLAUDE.md refuses everywhere. **Never fold this into `src/grade-engine.js`** — that
module reads no clock, and this one does. **Check the import graph**: `src/term-record.js` imports the
engine and the attendance date helper; nothing in the engine may import it back.

## WO-3.73 — Record Q1 grades: the dialog, and the bar on the class's screens

**Ship** — · **Status** ✅ DONE — 2026-10-29 · **Size** M · **Depends on** WO-3.72 · **Blocks** WO-3.74, WO-3.77
**Closes roadmap** *(no box. Owner-directed, 2026-10-23, from the closing-a-quarter thread.)*

**Read [WO-3.72](#wo-372--a-quarters-grades-can-be-recorded-and-the-engine-says-when-they-stop-matching) first**: the thread, the drawing and the rulings that bind all four are there.

**Surface.** [`design/mockups/closing-a-quarter.html`](../../design/mockups/closing-a-quarter.html),
frames **A0, A, B, C (without *What changed*), D and F**, and
[`proposed-quarter.css`](../../design/mockups/proposed-quarter.css) § RECORD NAG and § RECORD LIST.
**Lift them rather than re-deriving them** (`PROTOCOL.md` § When the drawing lands), and amend both
banners in the same sitting.

**Deliverables**
- **The bar**, under the header where the backup nag sits and after it, on every screen of a class
  while one of its ended terms is unrecorded or no longer matches. Three wordings, each drawn:
  *Quarter 1 ends today…* on the end date (A0), *…has ended, and its grades… are not recorded* after
  it (A), and *…have changed since you recorded them on 2 Nov — 2 students* (D). No dismiss; it goes
  when a recording matches. **A count, never a name**, so it stays under a projector. Its button
  opens the dialog.
- **The dialog**, a stock 480px `.modal-confirm` (the owner, 2026-10-23), in two forms:
  - **first recording (B)**: every graded student in `gridOrder()`'s order, percentage and letter,
    scrolling inside the box; the empty-boxes line in the owner's words; a line naming any
    uncommitted held column; in a weighted class, a line counting scored work filed under no
    category, which is not in these grades; *Record Q1 grades* and *Not now*.
  - **after a change (C)**: only the students who changed, recorded beside now, a letter change bold
    and a percentage-only change quiet; *Record Q1 grades* records the whole class again; *Not yet*,
    the ✕ and Escape write nothing.
- **Refused in presentation mode (F)**: the dialog says it lists students and grades and names the
  control that turns presentation mode off, as the concern list does.
- **Every figure comes from WO-3.72's readers.** The screen computes nothing.
- **Uncategorized work in the empty-boxes count** (the owner, 2026-10-23, after WO-3.72's verifier
  found `emptyBoxes()` skips it — `plans/closing-a-quarter.md`, the drawing's answer 2). An empty box
  filed under no category counts **in either grading mode** and is named under *no category*, after
  the class's own categories. **The engine answers it, not `src/term-record.js`**: add a sibling
  reader beside `openWork()` for uncategorized work rather than widening `openWork()`, which feeds
  every projection, and the points projection already walks that pile on its own. The weighted
  dialog's *not in these grades* line comes from the engine in the same way.
- **A mutation**: make the dialog list unchanged students in the changed form, show the check goes
  red, and revert it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.73** and the `CHANGELOG.md` entry.

**Acceptance**
- [x] On a term's end date the bar reads *ends today*; from the next day *has ended* until it is
      recorded; after a recorded change, *have changed* with the count. Before the end date there is
      no bar.
- [x] The bar shows on all five of the class's screens and on no other class's.
- [x] The first-recording dialog lists every graded student in grade-sheet order with the engine's
      figures, the empty-boxes line, and any uncommitted held column by name.
- [x] An empty uncategorized box is counted and named under *no category* in a weighted class and
      in a points class; in a weighted class, scored uncategorized work gets its own *not in these
      grades* line; and no projection's figures move.
- [x] *Record Q1 grades* writes one entry and the bar goes; *Not now*, *Not yet*, the ✕ and Escape
      write nothing.
- [x] The changed form lists only the students who changed, recorded beside now.
- [x] In presentation mode the bar names no student and the dialog refuses, naming the control.
- [x] With unchanged students listed in the changed form, the check goes red. The mutation is
      reverted, and `TESTING.md` § WO-3.73 shows the red output.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [x] 👤 On the iPad, the bar and both forms of the dialog read clearly, and twenty-five rows scroll
      inside the dialog with its buttons in reach, in portrait and landscape.
- [x] `TESTING.md` § WO-3.73 carries these lines verbatim with the evidence for each.

**Traps** — **The bar is copied from `.backup-nag`, not shared with it** (the reason `src/shell.css`
gives). **No screen re-runs the comparison**; a second opinion is how the bar and the dialog come to
disagree about who changed.

**Rulings — the owner, 2026-10-27, on the calls the work order left open.** The first implementer's
draft made them and the second kept them (`.claude/dispatch/WO-3.73-result.md` § Decisions). Five
stand as built; **one wants a wording change that the build does not yet carry.**
- **Frame C's hint is a general key, not names.** *A bold figure is a letter that changed…* stays.
  The drawing's *Chen's letter changed. Bautista's…* describes its two example rows; built from
  data, it grows a clause per changed student. The drawing's banner records this as a departure,
  per `PROTOCOL.md`.
- **A missing mark counts toward *not in these grades*.** This applies to uncategorized work in a
  weighted class. An `M` there is a zero the grade silently leaves out, which raises the letter that
  goes to Blackbaud, so the line warns about it as it does about a score. This widens the
  2026-10-23 ruling's *scored* to *scored or marked missing*. **The sentence must say so:**
  `src/term-record-view.js` reads *has scores in it* / *have scores in them*, which is false for a
  column holding only `M`s. It is owed a wording that covers both, such as *has scores or missing
  marks in it*. Until it changes, Acceptance line 4 is not met as worded here.
  *(**Discharged 2026-10-27.** WO-3.73's correction round put *has scores or missing marks in it* /
  *have scores or missing marks in them* in `paintLoose()`, with a check for a column holding only
  `M`s that went red under a mutation; the second verifier pass marked line 4 ✅.)*
- **One bar, one term, earliest first** (`termNeedingRecord()`), accepted for now. Until Q2 ends,
  Q1 is the only ended term, so the order cannot matter. **Open, and due before Q2's end date
  (~mid-January):** when Q2 ends while a Q1 recording no longer matches, earliest-first nags about
  Q1's grade-change form ahead of Q2's first recording, which carries the deadline. The leaning is
  *unrecorded before changed, then latest first*. It wants its own row before then.
  *(**Booked 2026-10-29 as
  [WO-3.77](#wo-377--the-record-bar-names-every-quarter-that-needs-it-newest-first)**, and the owner
  ruled past *one bar, one term*: the bar names every term needing attention, a line and a button
  each, in this leaning's order. WO-3.74 depends on it.)*
- **The bar repaints on navigation and after a recording, never on a save.** No screen subscribes
  to `notify()` (CLAUDE.md, WO-7.7), and WO-3.74's notice opens on leaving the quarter, never while
  working in it. A bar that flickered on each correction would be the same interruption.
- **On the end date, a recorded quarter that has since changed reads *changed*,** not *ends today*:
  the more specific thing to say.
- **The bar's date is in the app's own format** (*Oct 27*), not the drawing's *2 Nov*.

## WO-3.74 — the notice opens when you leave a quarter that changed, and home carries the bar

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-3.73, WO-3.77 · **Blocks** WO-3.75
**Closes roadmap** *(no box. Owner-directed, 2026-10-23, from the closing-a-quarter thread.)*

**Read [WO-3.72](#wo-372--a-quarters-grades-can-be-recorded-and-the-engine-says-when-they-stop-matching) first**: the thread, the drawing and the rulings that bind all four are there.

**Surface.** [`design/mockups/closing-a-quarter.html`](../../design/mockups/closing-a-quarter.html),
frames **C** (the notice is WO-3.73's changed-form dialog, opening by itself) and **E′**, and
[`proposed-quarter.css`](../../design/mockups/proposed-quarter.css) § RECORD NAG.

**Deliverables**
- **The notice opens by itself when the teacher leaves a recorded quarter that no longer matches**
  — tapping another term, another class, or All classes (the owner took the recommendation,
  2026-10-23). It never opens while the teacher is still in that quarter, so three corrections are
  not three interruptions.
- **A change made without visiting the quarter** — a weight changed from Q2, a sync from the other
  device — **opens it once**, the next time the class is opened.
- **Never under a projector**: it waits for the next opening with presentation mode off. Dismissed,
  the class bar stays.
- **The home bar (E′)**: one bar on All classes naming every class with an ended quarter unrecorded
  or changed, and a button per class that opens that class on the quarter's Scores with the dialog
  open. It names classes and counts, never a student. Not a glance panel: it sits with the backup
  nag, so `src/glance.js` and its fence are untouched. **Which quarter a class's button opens is
  read from [WO-3.77](#wo-377--the-record-bar-names-every-quarter-that-needs-it-newest-first)'s list
  reader, never from the single-term `termNeedingRecord()`**: a class with two terms waiting opens on
  the newest, and the class's own bar names the other. Added 2026-10-29 when WO-3.77 was booked.
  *(WO-3.77 retired `termNeedingRecord()` the same day; the list reader is `termsNeedingRecord()`,
  ordered unrecorded before changed, then newest — so its head is not always the newest term.
  **Ruled by the owner, 2026-10-30: "opens on the newest" wins.** The button opens the entry whose
  term is latest in the class's term order, not the list's head — with Q1 unrecorded and Q2
  changed, it opens Q2. Which entry is newest is the engine's to answer, by term order and never by
  label or date; the home bar does not re-order the list itself.)*
- **A mutation**: make the notice open on every tap of the changed quarter, show the check goes red,
  and revert it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.74** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] Changing a recorded quarter's score and then tapping another term, another class or All
      classes opens the notice once, listing who changed.
- [ ] Working in the quarter — several edits, moving between its screens — opens nothing.
- [ ] A change made from another quarter opens the notice once, the next time the class is opened,
      and not again for the same change.
- [ ] In presentation mode the notice does not open, and opens on the next opening with it off.
- [ ] The home bar names each class that needs recording, and its button lands on that class's
      Scores for the quarter with the dialog open.
- [ ] With a class's Q1 never recorded and its Q2 recorded and since changed, the home bar's button
      opens Q2, the newest by term order, though the class's own bar lists Q1 first.
- [ ] With the notice opening on every tap of the quarter, the check goes red. The mutation is
      reverted, and `TESTING.md` § WO-3.74 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] 👤 On the iPad, the notice opens when leaving a changed quarter and not while working in it,
      and the home bar's buttons are in reach.
- [ ] `TESTING.md` § WO-3.74 carries these lines verbatim with the evidence for each.

**Open — the implementer's to propose, the owner's to confirm:** how *once* is remembered. Proposed:
in memory, keyed by the set of changed figures, so nothing reaches the document or `localStorage`; a
relaunch may show the same notice one more time, which is cheaper than a stored flag nothing else
reads.

**Traps** — **Nothing about the notice is stored in the year document.** **Do not make the home bar
a glance panel**: `src/glance.js` holds no arithmetic and no clock, and this condition reads both.

## WO-3.75 — the notice says which score changed

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-3.74 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-23, from the closing-a-quarter thread.)*

**Read [WO-3.72](#wo-372--a-quarters-grades-can-be-recorded-and-the-engine-says-when-they-stop-matching) first**: the thread, the drawing and the rulings that bind all four are there.

**Surface.** [`design/mockups/closing-a-quarter.html`](../../design/mockups/closing-a-quarter.html),
frame **C**'s *What changed* box, and [`proposed-quarter.css`](../../design/mockups/proposed-quarter.css)
§ RECORD LIST's `.term-record-cause`.

**Deliverables**
- **Under the changed form's list, *What changed***: for each changed student, every score cell in
  the quarter written since the recording's `at`, as *Act 2 quiz (Exams): 4 → 9 of 10*. The value
  at recording time is the cell's latest version at or before that `at`, from its own `at` and `was`
  (WO-3.33). If `src/score-history.js` has no reader for a cell's value at a moment, add it there rather than walking the history a second way in this module.
- **When no score of the student's changed**, one line: *No score changed; a class setting did —
  weights, the letter scale or drop lowest.* Those settings keep no history, so it cannot say which.
- **A reader in `src/term-record.js`**, not arithmetic in the dialog.
- **A mutation**: make the reader drop the `was` value, show the check goes red, and revert it
  before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.75** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] A score changed after a recording appears under *What changed* with the assignment, its
      category, and the value at recording beside the value now.
- [ ] Two edits to one cell after a recording show one line, from the recorded value to the latest.
- [ ] A student whose grade moved only through a class setting gets the setting line.
- [ ] With the reader dropping the `was` value, the check goes red. The mutation is reverted, and
      `TESTING.md` § WO-3.75 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.75 carries these lines verbatim with the evidence for each.

**Traps** — **A score's history is merged in five-minute windows** (WO-3.33), so the recorded value
is the latest version at or before the recording, not the version before the newest. **Under a
projector the dialog is refused already**; this adds nothing that needs its own check.

## WO-3.76 — "N to grade" skips work filed under no category

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-3.73 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-23, from WO-3.72's verdict.)*

**Booked 2026-10-23**, owner-directed. WO-3.72's verifier found that `emptyBoxes()` never counts an
empty box in work filed under no category, because it asks `openWork()`, which walks categories
only. The owner ruled it in: **an empty box is an empty box in either grading mode**
(`plans/closing-a-quarter.md`, the drawing's answer 2), and WO-3.73 adds the engine reader that
answers it. **The home card's *N to grade* and the *Waiting to be graded* queue ask `openWork()` the
same way**, so once WO-3.73 lands the quarter dialog counts a box the card and the queue do not —
one screen disagreeing with another about one cell, which is what `src/glance.js` exists to prevent.

**Deliverables**
- **The card's *N to grade* and `queueRows()` take in uncategorized open work**, in either grading
  mode, through **the engine reader WO-3.73 adds** beside `openWork()`. Neither screen tests a cell,
  and `openWork()` itself is not widened — every projection is built on it.
- **Where a reader groups by category**, uncategorized work is grouped under *no category*, after the
  class's own categories, in the words the quarter dialog uses.
- **A mutation**: drop the uncategorized reader from the queue, show the check go red, and revert it
  before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.76** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] A class with one empty uncategorized assignment shows it in the card's *N to grade* and in the
      queue, in a weighted class and in a points class, and the card's figure equals the queue's
      row count for that class.
- [ ] The quarter dialog's empty-boxes count, the card and the queue agree on the same fixture.
- [ ] No projection's figures move, and a held uncategorized column still counts as held, not open.
- [ ] With the uncategorized reader dropped from the queue, the check goes red. The mutation is
      reverted, and `TESTING.md` § WO-3.76 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.76 carries these lines verbatim with the evidence for each.

**Traps** — **`src/glance.js` forwards, it does not compute** (CLAUDE.md, WO-6.7; `wo-sweep.mjs`
§ 31): the union is the engine's to answer, never a concat with arithmetic in the reader. **Student
detail, the grade sheet and the CSVs also list unfinished work** — check each and say in the
`TESTING.md` section which already shows uncategorized work and which does not; widening them is a
booking, not a fold-in.

## WO-3.77 — the record bar names every quarter that needs it, newest first

**Ship** — · **Status** ✅ DONE — 2026-10-30 · **Size** S · **Depends on** WO-3.73 · **Blocks** WO-3.74
**Closes roadmap** *(no box. Owner-directed, 2026-10-29, out of WO-3.73's verdict.)*

**Booked 2026-10-29**, owner-directed. WO-3.73's bar shows **one term per class**:
`termNeedingRecord()` in `src/term-record.js` returns the first qualifying term in the class's order,
so the earliest wins. The implementer made that call and flagged it, and the verifier passed it on
unruled. Three things go wrong once a second quarter ends, around mid-January:
- **A stuck term hides every later one.** A Q1 never recorded — skipped once, or a teacher who
  started mid-year — holds the bar on *Q1 has ended* all year, and Q2, Q3 and Q4 never get one. The
  bar has no ✕ by design, so nothing clears it.
- **It points at the wrong quarter when it matters.** A Q1 score fixed in January puts *Q1 has
  changed — 1 student* on the bar on Q2's last day, instead of *Q2 ends today*, in the week Q2 is
  being keyed into Blackbaud.
- **It hides that there are two.** Recording Q1 brings the bar straight back for Q2, which reads as
  a recording that did not take.

**Ruled by the owner, 2026-10-29: one bar naming every term that needs attention, newest first, with
a button per term** — *Q2 ends today · Q1 has changed — 1 student*. Of the three options put to the
owner, it is the only one where nothing can be hidden, and on a bar with no ✕ hiding is the risk.
The others were *the newest term only, older ones after*, and *the earliest, plus "and 1 more
quarter"*. **The order, ruled the same day: unrecorded before changed, then newest first** — the
leaning WO-3.73's Rulings recorded. An unrecorded quarter is a whole quarter missing from Blackbaud;
a changed one is a correction to grades already there. So *Q1 has ended, not recorded* leads
*Q2 has changed — 1 student*. *(The heading says "newest first" and keeps it, because three links
name its anchor; this paragraph is the order.)*

**Booked ahead of WO-3.74 on purpose.** WO-3.74's home bar gives each class a button that opens *the*
quarter's dialog, which is this question again. It reads the list this row adds, and is not built
on the single-term reader.

**Surface.** WO-3.73's bar, lifted as it is — `src/term-record-view.js`, `src/shell.css`'s
`.term-record-*` rules, and frames A0, A and D of
[`design/mockups/closing-a-quarter.html`](../../design/mockups/closing-a-quarter.html) for each
line's wording. Two lines in one bar is not drawn; say how it was laid out in the `TESTING.md`
section, and amend the drawing's banner in the same sitting.

**Deliverables**
- **An engine reader that returns every term needing attention for one class**, unrecorded (and
  *ends today*) before changed, then newest first within each,
  each with the state and count `termNeedingRecord()` returns today. It lives in `src/term-record.js`.
  `termNeedingRecord()` either becomes that list's head or is retired; the implementer picks and
  says why. **No screen tests a term itself.**
- **The bar draws one line per entry**, in the list's order, each in WO-3.73's wording for its state
  and with its own *Record Qn grades* button opening that term's dialog. One entry draws exactly
  what WO-3.73 draws today.
- **Recording one term removes its line only.** The bar goes when the list is empty.
- **A count, never a name**, as before, so the bar still stays up under a projector, and the
  dialogs are still refused there.
- **A mutation**: make the bar draw only the list's first entry, show the check go red, and revert
  it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.77** and the `CHANGELOG.md` entry.

**Acceptance**
- [x] With Q1 recorded and since changed, and Q2 ended and unrecorded, the bar shows two lines, Q2's
      first, each in its own wording and with its own button opening that term's dialog.
- [x] With Q1 never recorded and Q2 ended, both terms are on the bar, Q2's first; an unrecorded Q1
      no longer hides Q2.
- [x] With Q1 never recorded and Q2 recorded and since changed, Q1's *has ended* line comes before
      Q2's *have changed* line: unrecorded leads changed whatever their age.
- [x] Recording one term removes its line and leaves the other; recording the last removes the bar.
      With one term needing attention, the bar reads exactly as WO-3.73's does.
- [x] Every term, state and count on the bar comes from the engine's list reader, and no screen
      compares records or tests a term's end date.
- [x] In presentation mode the bar names no student and both dialogs refuse, naming the control.
- [x] With the bar drawing only the first entry, the check goes red. The mutation is reverted, and
      `TESTING.md` § WO-3.77 shows the red output.
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [x] 👤 On the iPad, a two-line bar reads clearly and both buttons are thumb-sized, in portrait and
      landscape.
- [x] `TESTING.md` § WO-3.77 carries these lines verbatim with the evidence for each.

**Traps** — **Newest is by the class's term order, not by a name**, and the state outranks it. `src/term-record-view.js`'s
*Q1* is a display abbreviation, and nothing may sort or find a term by it. **Do not re-run the
comparison per line**: each line's count is the reader's, so the bar and the dialog it opens cannot
disagree about who changed.

## WO-3.78 — the record bar's order is tested only where every order agrees

**Ship** — · **Status** ⬜ NOT STARTED · **Size** XS · **Depends on** WO-3.77 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-30, out of WO-3.77's verdict.)*

**Booked 2026-10-30**, owner-directed, out of [WO-3.77](#wo-377--the-record-bar-names-every-quarter-that-needs-it-newest-first)'s
verdict. Harness only; nothing in `src/` moves unless it finds a defect.

**Why it exists.** WO-3.77 ruled that *newest* means **latest in the class's term order**, never by
label or date, and `termsNeedingRecord()` honours it today: it walks `cls.terms` with
`reduceRight()` and holds no sort. But every WO-3.77 fixture has **two** quarters, and in each the
list order, the label order (*Quarter 1*, *Quarter 2*) and the date order all agree. So a later
change that sorted the list by name or by end date would pass every check that exists. The
`.sort(` / `.reverse(` refusal over `src/term-record.js` catches two spellings of that change, not
the change. **It matters more since the owner's 2026-10-30 ruling on WO-3.74**: the home bar opens
the newest entry, so a wrong *newest* sends the teacher to the wrong quarter.

**Deliverables**
- **A fixture with three ended quarters, none recorded**, asserting all three lines in term order,
  newest first.
- **A fixture where the three orders disagree**: the class's terms planted directly in the document
  so that list order, the order of their names and the order of their end dates are three different
  orders. The bar must follow list order. Name the planted order in the check's own message.
- **Two mutations**, each shown red and reverted before writing anything else: order the reader's
  result by term name, then by end date.
- **`TESTING.md` § WO-3.78** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] With three ended quarters unrecorded, the bar shows three lines, newest first by term order.
- [ ] With list, name and end-date order all different, the bar's lines follow list order.
- [ ] With the reader ordering by term name, the check goes red; with it ordering by end date, the
      check goes red. Both mutations are reverted, and `TESTING.md` § WO-3.78 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.78 carries these lines verbatim with the evidence for each.

**Traps** — **Plant the terms, do not build a door**: if the term editor keeps terms in date order,
the disagreeing fixture writes the document over `evalJs`, as WO-3.67's fixture blanks a host, and
adds no way to reorder terms in the app. **A sort mutation will also trip the sweep's `.sort(`
refusal**; the red that counts is the harness check's, so say which tool went red.
