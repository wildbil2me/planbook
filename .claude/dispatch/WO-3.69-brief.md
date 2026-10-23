# WO-3.69 — a category can drop each student's lowest N scores · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.69-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-10-22).** Claude **Opus**, on the work order's own merits. The deciding signal is that the drop changes the grade every reader shows, including the merge-field resolver's grade path (a sensitive surface, Acceptance line 5), and adds a new categories-editor control plus a *dropped* mark on five readers with a 👤 line. Runner-up was Codex — the six owner rulings specify the arithmetic completely — set aside because the reader and UI half is judgment and the resolver is Claude-only.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.69 — a category can drop each student's lowest N scores

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-22 · **Size** M · **Depends on** WO-3.68 · **Blocks** nothing
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
- [ ] The category and class grades match a hand-worked fixture with `dropLowest` 1 and 2, in both
      grading modes.
- [ ] A new score lower than the dropped one takes the drop over, and the old one counts again.
- [ ] Excused, ungraded and held cells are never counted toward N. `missing` follows ruling 1, ties
      follow ruling 2, and zero-point work follows ruling 6.
- [ ] The grid, grade sheet, both CSVs and student detail mark the same cells as dropped.
- [ ] Signals and merge fields read the same grade that the screens show. *A run of low scores*
      still counts a dropped score (ruling 5).
- [ ] A backup with no `dropLowest` key anywhere restores and grades as before.
- [ ] With `isDropped()` dropping nothing, the drop checks go red. The mutation is reverted, and
      `TESTING.md` § WO-3.69 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] 👤 On the iPad, the *Drop lowest* field and a dropped cell read clearly.
- [ ] `TESTING.md` § WO-3.69 carries these lines verbatim with the evidence for each.

**Traps** — **Never write the drop into a cell.** **No screen works out which cell is dropped**; every
one asks `isDropped()`. A second opinion is how the grid and the grade come to disagree. **The drop is
per student**: each student's lowest N are different assignments.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/categories.js`
  - `src/grade-engine.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **The model to copy is `isHeld()` and WO-3.68.** `isHeld()` in `src/grade-engine.js` and the
  readers that ask it (`grep -rln isHeld src`: scores, grades-report, graded-pieces, score-history,
  merge-fields, signals, past-due, assignments) are the pattern for `isDropped()`. WO-3.68's strike
  is at `src/scores.css` ~line 749; its brief/result are `.claude/dispatch/WO-3.68-{brief,result}.md`,
  its harness module `tools/verify/excused-kept.mjs`, and `TESTING.md` § WO-3.68 is the shape of the
  section you owe. Held-reader checks live in `tools/verify/held-readers.mjs`.
- **The student report's CSV is `studentCsv()` in `src/detail.js`.** Note WO-3.70 (the next row,
  not yours) will add excused rows there; a dropped score is **not** excused and must not be
  written as a flag anywhere.

**Orchestrator notes — the traps this brief adds:**

- **One asker, and the grade engine computes it from the same walk it grades with.** If
  `isDropped()` and the category walk each pick the N lowest separately, they will disagree on a
  tie. Derive the dropped set once (a per-student, per-category helper) and have both read it.
  Ruling 2's tie-break (earlier due date, then column order) must be deterministic for the same doc.
- **The candidate set is narrow, and every exclusion is a ruling:** scored cells only — not
  `missing` (ruling 1), not `excused`, not blank, not in a held column, not zero-point work
  (ruling 6). Ruling 4: never drop the last scored cell, so N is capped at scored-count − 1 and a
  category is never emptied (no weight redistribution from a drop).
- **Ruling 5 cuts the other way from the Trap.** *A run of low scores* reads raw scores and does
  **not** ask `isDropped()`; every grade-reading rule sees the drop through the engine. Assert both.
- **Points mode**: work under no category has no setting, so nothing there is dropped (ruling 3).
- **A settings key created by first write, never seeded.** Blank/0 in the editor **deletes**
  `dropLowest`; `newYearDocument()` gains nothing; `parseBackup()` must still accept every earlier
  backup. See CLAUDE.md "A settings block is created by its first write, never seeded".
- **The mutation**: revert it before writing anything else, and mark it with the literal word
  `MUTATION` while it is in, per AGENTS.md. Two runs of `verify-shell.mjs` minimum (clean + mutation).
- **`CHANGELOG.md`**: draft the entry in your result file; do not write it — the orchestrator lands
  it with the owner's say-so. (The Deliverables line names it; this is who writes it.)
- **Size M, keep it M.** Anything that wants to grow past the Deliverables is a proposed follow-up
  in your report, not work you do.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

## 5. Done means these 10 lines, reported against one by one

1. The category and class grades match a hand-worked fixture with `dropLowest` 1 and 2, in both grading modes.
2. A new score lower than the dropped one takes the drop over, and the old one counts again.
3. Excused, ungraded and held cells are never counted toward N. `missing` follows ruling 1, ties follow ruling 2, and zero-point work follows ruling 6.
4. The grid, grade sheet, both CSVs and student detail mark the same cells as dropped.
5. Signals and merge fields read the same grade that the screens show. *A run of low scores* still counts a dropped score (ruling 5).
6. A backup with no `dropLowest` key anywhere restores and grades as before.
7. With `isDropped()` dropping nothing, the drop checks go red. The mutation is reverted, and `TESTING.md` § WO-3.69 shows the red output.
8. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
9. 👤 On the iPad, the *Drop lowest* field and a dropped cell read clearly.
10. `TESTING.md` § WO-3.69 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.69 — it is a deliverable, not a permission.** Add `### WO-3.69 — a category can drop each student's lowest N scores` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.69` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

