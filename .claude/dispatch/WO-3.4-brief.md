# WO-3.4 — Grade engine · implementation brief

**Route** Codex
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.4-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to Codex because its entire specification lives outside the work
order and is already complete — `docs/data-model.md` § Grade math and § Extra credit — and every one
of the twelve Acceptance lines is a number you can compute by hand and compare, with no UI in scope
to exercise taste about. The runner-up consideration set aside: the two owner rulings of 2026-08-09
(no grade until weights total 100; extra credit as a zero-point assignment with nothing clamped) are
genuine judgment calls, but they were **already made and written down**, so honoring them here is
transcription rather than design. The exec-time probe passed (`SMOKE OK`) before this brief was
written.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.4 — Grade engine

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-10 · **Size** M · **Depends on** WO-3.1, WO-3.2
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
- [ ] Straightforward weighted case across three categories.
- [ ] A term with exactly one assignment.
- [ ] A category with no assignments at all — weight redistributed, grade correct.
- [ ] A category whose every score is `excused` — behaves as empty, weight redistributed.
- [ ] ~~A zero-point assignment — no division by zero, no effect on the percentage.~~
      **Rewritten 2026-08-09:** a zero-point assignment scored `5` **raises** the category by 5
      earned points against 0 possible — that is extra credit, and "no effect" was the opposite of
      the requirement. No division by zero either way.
- [ ] Extra credit carries a category **past 100%**, and the overall grade past 100% with it.
      Nothing clamps.
- [ ] A category holding **only** zero-point assignments — `possible` sums to zero, so it has no
      percentage. Behaves as empty and redistributes; never `NaN`, never `100%`, never a crash.
      **This is the case a naive engine dies on, and a teacher reaches it by making an "Extra
      credit" category and putting only extra credit in it.**
- [ ] Weights totalling 95 — **no grade is returned at all**, and the reason names the total. Then
      the same document with the weights corrected to 100 returns a grade. Both directions.
- [ ] A `missing` flag scores zero; the same cell set to `excused` raises the grade.
- [ ] A `late` flag changes nothing versus the same score unflagged.
- [ ] A blank cell changes nothing versus no cell at all.
- [ ] Every category empty — an honest "no grade yet", not `0%` and not `NaN`.

**Traps** — A score cell is **always an object**, never a bare number. Polymorphic cells are where
grade bugs live. If you find yourself writing `typeof cell === 'number'`, something upstream is
wrong.

---

## 2. Read these first, before writing anything

- `AGENTS.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Read `docs/data-model.md` twice, at two places.** § "Grade math — weighted categories"
(from `## Grade math`) is the cell table and the no-grade-below-100 ruling, including the record of
what it replaced. § "Extra credit" immediately below it is the zero-point mechanism and the three
consequences — a category may exceed 100%, a category whose `possible` sums to zero has no
percentage and redistributes, and **no extra-credit flag or field exists or may be added.** The
assignment and score shapes are at `docs/data-model.md` lines 95-108: an assignment carries
`{ id, classId, termId, categoryId, name, points, assigned, due }`, and `scores` is keyed
**assignment first, then student** — `scores[assignmentId][studentId]`.

**Two functions already exist and this work order consumes them rather than reimplementing them.**
Both scars are written into the comments above them; read those comments before you write a line.

- **`weightTotal(cls)` and `isBalanced(cls)` in `src/categories.js`** (lines 116-167) own the
  "do the weights total 100?" determination. `isBalanced()` carries a `BALANCE_EPSILON` of 0.005
  that exists because `40.1 + 34.7 + 25.2` is `100.00000000000001` in IEEE-754. **Do not write your
  own `total === 100` comparison** — a second one would disagree with the categories editor's own
  banner for exactly the weight sets a teacher is most likely to type, and the failure appears for
  some sets and not others. `isProvisional(cls)` is `!isBalanced(cls)`; note that its *name* is
  already flagged as owed a correction in `docs/data-model.md` line 297-299 — **that rename is not
  yours**, leave the name alone and do not widen this work order into it.
- **`letterFor(percentage, scale)` and `scaleForClass(doc, cls)` in `src/letter-scale.js`**
  (lines 133-174) are the "letter from percentage" deliverable, already built by WO-3.2. Call them.
  The comment above `letterFor()` states the rule you would otherwise break: the comparison is `>=`
  against the boundary as typed, and **that comparison IS the rounding rule, with no second one to
  disagree with the SIS about.** It returns `null` when no band matches, which is a real answer.
  A per-class override is the presence of an array, so route through `scaleForClass(doc, cls)`
  rather than reading `doc.letterScale` directly.

**Match the house style of `src/categories.js` and `src/letter-scale.js`.** Read either one before
starting. The convention is small pure exported functions, each preceded by a comment that records
*why* it is the way it is — the decision and the failure it prevents, not a restatement of the code.
`src/README.md` has the file-level rules: `kebab-case.js`, one concern per file, plain ES modules
with relative paths, named for the thing it owns and never for its layer (no `utils.js`).

**A note on the accessor pattern**, since your module reads document fields that may be absent:
`categoriesOf(cls)` exists because a class can legitimately arrive without the key — from an older
backup or a pre-WO-3.1 document. Guard reads the same way rather than assuming shape, and treat a
non-numeric value as the honest zero rather than letting `NaN` propagate into a printed grade.

**`docs/grade-math-cases.md` is a new file and it is the test suite.** Every one of the twelve
Acceptance lines gets a worked example in it: the input document fragment, the arithmetic written
out step by step the way a person would do it on paper, and the expected output. It has to be
checkable by a teacher with a calculator and no JavaScript — that is what "verified against
hand-computed cases" in the 1.0 criteria means. Write the arithmetic first and make the code agree
with it, not the other way round.

**On the harness.** `tools/verify-shell.mjs` drives a real browser over CDP; it is not a unit-test
runner, and `tools/README.md` § "Driving a browser over CDP" lists four traps that all present as
app defects rather than harness bugs. Your module is pure and has no UI, so the way to exercise it
there is to import it in the page context and evaluate the worked cases from
`docs/grade-math-cases.md` against their expected values — see how WO-3.1's block at line ~3196 and
WO-3.2's at line ~3599 plant fixtures through the store when no screen exists yet. **If the harness
cannot start in your sandbox, say so plainly in your result file and do not claim the line** — the
orchestrator re-runs it locally, where it works, before the verifier sees anything. A skip is not a
pass, and this harness says so in its own summary.

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

## 5. Done means these 12 lines, reported against one by one

1. Straightforward weighted case across three categories.
2. A term with exactly one assignment.
3. A category with no assignments at all — weight redistributed, grade correct.
4. A category whose every score is `excused` — behaves as empty, weight redistributed.
5. ~~A zero-point assignment — no division by zero, no effect on the percentage.~~ **Rewritten 2026-08-09:** a zero-point assignment scored `5` **raises** the category by 5 earned points against 0 possible — that is extra credit, and "no effect" was the opposite of the requirement. No division by zero either way.
6. Extra credit carries a category **past 100%**, and the overall grade past 100% with it. Nothing clamps.
7. A category holding **only** zero-point assignments — `possible` sums to zero, so it has no percentage. Behaves as empty and redistributes; never `NaN`, never `100%`, never a crash. **This is the case a naive engine dies on, and a teacher reaches it by making an "Extra credit" category and putting only extra credit in it.**
8. Weights totalling 95 — **no grade is returned at all**, and the reason names the total. Then the same document with the weights corrected to 100 returns a grade. Both directions.
9. A `missing` flag scores zero; the same cell set to `excused` raises the grade.
10. A `late` flag changes nothing versus the same score unflagged.
11. A blank cell changes nothing versus no cell at all.
12. Every category empty — an honest "no grade yet", not `0%` and not `NaN`.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

