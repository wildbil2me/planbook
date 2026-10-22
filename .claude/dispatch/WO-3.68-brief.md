# WO-3.68 — an excused cell keeps the score it had · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.68-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is the Claude column on
its own merits: teacher-facing prose (the `applyFlag()` sentence, the aria label, the grade-sheet
legend, `docs/data-model.md`), a presentation-mode 👤 line, and a Trap that is about judgment —
"the struck-through number is the whole of the safety". The runner-up was Codex on the proof budget
(one clean run plus one mutation run, ~9 min, fits the 20-min cap), set aside because the work order
is in the Claude column regardless of the stopwatch.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.68 — an excused cell keeps the score it had

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-22 · **Size** M · **Depends on** — · **Blocks** WO-3.69
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
- [ ] Excusing a scored cell keeps `v` in the document. The class grade is the same as for an excused
      blank, in both grading modes.
- [ ] Pressing X again on that cell takes the flag off, and the kept score counts in the grade.
- [ ] Typing a number into an excused cell writes `v` and keeps `flag: 'excused'`. Emptying it
      clears `v` and keeps the flag.
- [ ] The grade sheet, both CSVs, the score history and student detail show the kept score with the
      excused mark.
- [ ] A backup holding `{ v: null, flag: 'excused' }` cells restores and draws them as before.
- [ ] The past-due prompt never sweeps an excused cell, with or without a kept score.
- [ ] With the engine reading `v` on excused, the grade checks go red. The mutation is reverted, and
      `TESTING.md` § WO-3.68 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] 👤 On the iPad, a kept score reads as struck through and not counted, in normal mode and in
      presentation mode.
- [ ] `TESTING.md` § WO-3.68 carries these lines verbatim with the evidence for each.

**Traps** — **The struck-through number is the whole of the safety.** A number on screen that the grade
is not using must never look like one that it is. Do not drop the strike for any state, size or
mode. **Harness checks assert the old behaviour on purpose** (`tools/verify/score-grid.mjs` and others
expect the value cleared and the flag taken off by typing). Change them to the new rulings and
name each in `TESTING.md`. Do not delete them. **Do not touch `missing`.** **The engine is not
edited**, apart from the mutation that is reverted.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/grade-engine.js`
  - `src/graded-pieces.js`
  - `src/grades-report.js`
  - `src/past-due.js`
  - `src/score-history.js`
  - `src/scores.css`
  - `src/scores.js`
  - `src/signals.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/score-grid.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, because the work order names them as readers and the brief generator did not:

- **`src/detail.js`** — student detail; "shows the kept score wherever it lists an excused piece".
- **The two CSV writers.** Acceptance line 4 says *both CSVs*. Find them yourself
  (`grep -n -i csv src/grades-report.js src/graded-pieces.js src/detail.js`) and name in
  `TESTING.md` which two files/functions they are and what each now prints for `{ v: 62, flag: 'excused' }`.
- **The audit list.** `grep -rln excused src` returns, beyond the files above: `src/attendance.js`,
  `src/glance.js`, `src/home.js`, `src/score-notes.js`, `src/shell.js`, `src/supports.js`.
  Several are attendance's `excused` (an absence code, a different thing) — say which, rather than
  silently skipping them. The audit is of **readers of a cell's `v`**, so also grep for `.v` /
  `v` reads on score cells, not only for the word.
- **Harness files asserting the old behaviour**, likely beyond `score-grid.mjs`: `grade-sheet.mjs`,
  `score-history.mjs`, `grade-detail.mjs`, `past-due.mjs`, `grade-engine.mjs`, `points-grade.mjs`.
  Per the Traps: change them to the new rulings, never delete, and name each in `TESTING.md`.

Three traps the work order implies and does not spell out:

- **Order of revert.** The mutation goes in `src/grade-engine.js`, the one file you must otherwise
  leave byte-identical. Revert it before writing anything else and confirm with
  `git diff --stat src/grade-engine.js` returning nothing. A dispatch here has died holding a live
  mutation five times; mark it with the word `MUTATION` in a comment so `grep -rn MUTATION` finds it.
- **The strike must survive presentation mode and every cell size** (Traps). If the grid has a
  compact or coarse-pointer variant, the `.excused` strike rule must not be inside a block that one
  of them overrides. Assert it in the harness from computed style (`text-decoration-line`), not
  from a class name.
- **Past-due.** "Never sweeps an excused cell, with or without a kept score" — the risk is a sweep
  that tests `v == null` before testing the flag. Prove both shapes in the harness.

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

1. Excusing a scored cell keeps `v` in the document. The class grade is the same as for an excused blank, in both grading modes.
2. Pressing X again on that cell takes the flag off, and the kept score counts in the grade.
3. Typing a number into an excused cell writes `v` and keeps `flag: 'excused'`. Emptying it clears `v` and keeps the flag.
4. The grade sheet, both CSVs, the score history and student detail show the kept score with the excused mark.
5. A backup holding `{ v: null, flag: 'excused' }` cells restores and draws them as before.
6. The past-due prompt never sweeps an excused cell, with or without a kept score.
7. With the engine reading `v` on excused, the grade checks go red. The mutation is reverted, and `TESTING.md` § WO-3.68 shows the red output.
8. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
9. 👤 On the iPad, a kept score reads as struck through and not counted, in normal mode and in presentation mode.
10. `TESTING.md` § WO-3.68 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.68 — it is a deliverable, not a permission.** Add `### WO-3.68 — an excused cell keeps the score it had` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.68` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

