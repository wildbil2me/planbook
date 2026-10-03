# WO-3.30 — a class can be graded on total points · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.30-result.md` — as your last act, and return it in-band too.

**Routing — Claude, Opus.** The deciding signal is that the deliverables edit `src/merge-fields.js` (the merge-field resolver) and Acceptance asks for a backup/restore round-trip. Both are sensitive surfaces, so this is not delegated. The runner-up was that engine arithmetic is the most Codex-shaped work in this project. It was set aside, and the proof budget (one clean harness run plus at least one mutation, with seven callers to read) would have been tight against Codex's 20-minute cap anyway.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.30 — a class can be graded on total points

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-02 · **Size** M · **Depends on** WO-3.4 — the engine this gives a second formula
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
- [ ] A class with no `gradingMode` key produces byte-identical grades on every screen and in every
      signal before and after this lands, on the harness's existing fixtures.
- [ ] A points-mode fixture with three categories and deliberately lopsided points gives a grade equal
      to total earned ÷ total possible, worked by hand in the check. Its category weights sum to 75,
      and it still has a grade.
- [ ] In both modes, each category's `contribution` adds up to `percentage`, and excused work is out of
      both totals.
- [ ] A scored assignment filed under no category moves a points-mode grade by exactly its earned and
      possible points, and moves a weighted grade not at all.
- [ ] No file in `src/` calls `weightedClassGrade`, and a sweep check keeps it that way.
- [ ] Every screen showing one student's grade in a points-mode fixture shows the same number:
      the score grid, student detail, the grade sheet, the signals list and the `{{grade.percent}}`
      merge field. **Mutation-proved**: one caller left on the weighted formula goes red.
- [ ] `projectedClassGrade()` in points mode matches a hand-worked projection, and the score needed
      for the next band still solves by the straight line.
- [ ] A backup written before this lands restores unchanged, and a points-mode year round-trips
      through backup and restore with its mode intact.
- [ ] No on-screen string calls the class grade "weighted".

**Traps** — **Do not compute a points grade anywhere but the engine.** A screen that adds up its own
cells is the second answer. **Do not seed `gradingMode`** on new classes or in `newYearDocument()`:
`parseBackup()` would refuse every older backup by name. **Do not change what `categoryResult()`
returns.** Both modes rest on it, and WO-3.28's frozen column reads it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/detail.js`
  - `src/grade-engine.js`
  - `src/grades-report.js`
  - `src/merge-fields.js`
  - `src/scores.js`
  - `src/signals-view.js`
  - `src/signals.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/categories.js` — its header comment calls the class grade "weighted". Check whether anything on screen there says so.
- The harness modules that already import `weightedClassGrade` and will break on its removal:
  `tools/verify/grade-engine.mjs`, `grade-detail.mjs`, `grade-sheet.mjs`, `past-due.mjs`,
  `score-grid.mjs`, `score-search.mjs`. Move them to `classGrade()`. Do not keep an alias to make them pass.
- `tools/wo-sweep.mjs`, for the shape of an existing grep claim. The "no `weightedClassGrade` in `src/`"
  check belongs there, beside its siblings, not in a new script. If `tools/README.md` records a
  `check()` count and yours changes it, update the count. That stale number turned WO-3.26's sweep red.

**Traps the work order does not spell out — read before writing:**

1. **Uncategorized work is invisible to the engine today.** `assignmentsFor()` filters on
   `categoryId === <a category's id>`, so an assignment with no category (or a deleted one) is never
   walked by `categoryResult()`. That is right for weighted mode and must stay right. Points mode needs
   those points, **and you may not change what `categoryResult()` returns** (Traps). So the
   uncategorized sum is new, separate engine code. Decide how it appears in the returned shape so that
   "contributions add up to `percentage`" stays true in points mode while no caller branches. Probably
   that is a row of its own, but check what `src/detail.js` and `src/grades-report.js` do with each
   category row before you add one. State the decision and the reason in your result file.
2. **Byte-identical is the first Acceptance line, and it is measured, not argued.** Record the
   harness's grade outputs for the existing fixtures before you change anything (a clean
   `verify-shell.mjs` run on the untouched tree is the baseline), and compare after. A weighted path
   refactored through a shared helper can move a float in the 15th digit. Keep the weighted
   arithmetic's order of operations as it is.
3. **The signal chip's `ruleId` stays `grade-below`.** Only the words change. Look for the old wording
   in harness assertions, `TESTING.md` and `docs/` too, and move what describes the screen. Leave
   history entries (dated past records) alone.
4. **`signals.js` builds a "grade before the window" by passing a shallow-copied doc with assignments
   removed** (~1897). In points mode that is still `classGrade()` on the copy. Do not special-case it.
5. **Mutation round (Acceptance 6): revert before anything else.** Mark every mutation with a
   `MUTATION` comment, take it out the moment the run goes red, and `grep -rn MUTATION src tools` must
   be empty before you write the result file. Three dead dispatches here left armed mutations under
   ticked boxes (CLAUDE.md, the WO-5.1/5.3/5.4 blocks).
6. **No backup-shape change.** `parseBackup()` validates against `newYearDocument()`. Test the
   round-trip with a class carrying `gradingMode: "points"`, and with a pre-change fixture.
7. **Out of scope: any control.** No editor UI, no toggle, nothing a teacher can see except the
   "weighted" wording fix. `pointsShare()` is exported and tested headless. WO-3.31 draws it.

Your result file must list every Acceptance line with the command or check that closes it. Self-tick
only what you ran. This orchestrator stops at your return, and a separate verifier reads your result
file as claims to check.

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

## 5. Done means these 9 lines, reported against one by one

1. A class with no `gradingMode` key produces byte-identical grades on every screen and in every signal before and after this lands, on the harness's existing fixtures.
2. A points-mode fixture with three categories and deliberately lopsided points gives a grade equal to total earned ÷ total possible, worked by hand in the check. Its category weights sum to 75, and it still has a grade.
3. In both modes, each category's `contribution` adds up to `percentage`, and excused work is out of both totals.
4. A scored assignment filed under no category moves a points-mode grade by exactly its earned and possible points, and moves a weighted grade not at all.
5. No file in `src/` calls `weightedClassGrade`, and a sweep check keeps it that way.
6. Every screen showing one student's grade in a points-mode fixture shows the same number: the score grid, student detail, the grade sheet, the signals list and the `{{grade.percent}}` merge field. **Mutation-proved**: one caller left on the weighted formula goes red.
7. `projectedClassGrade()` in points mode matches a hand-worked projection, and the score needed for the next band still solves by the straight line.
8. A backup written before this lands restores unchanged, and a points-mode year round-trips through backup and restore with its mode intact.
9. No on-screen string calls the class grade "weighted".

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

