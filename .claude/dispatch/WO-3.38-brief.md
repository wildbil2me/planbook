# WO-3.38 — a bonus scored 0 reads as nothing graded · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.38-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override): the deliverable is two teacher-facing sentences (what a scored-0 bonus row says, and the no-grade message), and the Traps are judgment rather than mechanics, a blank must never become a scored 0 and the screen must not grow a grade. The runner-up was Codex, since it is Size S and its Acceptance is mechanically checkable; set aside on the prose, and because the proof is at least three full harness runs (clean, mutation, before/after compare) at ~4.4 min each. Codex was not probed.

**The owner's ruling, verbatim (2026-10-03), now also recorded in the work order:**

> WO-3.38 — owner's ruling on the open question: (b). The student detail screen works out "this bonus has been scored" from the rows it already lists, and the grade calculation and what it hands back stay untouched. The CSV export calls the same function, so the screen and the file cannot disagree. A blank cell never counts as a scored 0, and the screen computes no grade.

So, concretely:
- **`src/grade-engine.js` does not change. Not its code, not its messages, not its returned shape.** `git diff src/grade-engine.js` is empty at the end. Options (a) and (c) are off the table.
- **One function** in `src/detail.js` answers "does this category hold a scored piece", reading the assignment/score rows student detail already lists. Both `renderDetail()` and `studentCsv()` reach it, in the same way `rowIsEmpty()` is shared by both today (see the comment above `rowIsEmpty()`, ~375, and the use sites ~435, ~1048, ~1069). Extending `rowIsEmpty()` itself or adding a sibling it consults is your call; one source of truth is not.
- **"Scored" means a score is present.** A blank cell, a cell with no score, stays ungraded. Decide and state in a comment how `excused`, and a scoreless `late`/`missing` mark, are treated; `src/past-due.js` and `docs/data-model.md` are where the gradebook's own definition of "graded" lives, so match it rather than inventing one.
- **No percentage, earned/possible sum, or grade is computed on the screen.** Presence of a score is a count of rows, not arithmetic over them.


---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.38 — a bonus scored 0 reads as nothing graded

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-03 · **Size** S · **Depends on** WO-3.35 — `rowIsEmpty()` and the extra-credit-only wording this extends
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

**Deliverables** *(for (b), as ruled)*
- **A row holding a scored 0 on extra credit is not called empty**, on screen and in the CSV, and it
  says what is true about it.
- **The no-grade message** follows the same fact, wherever it is printed.

**Acceptance**
- [ ] In a points fixture, a student whose only graded work is a bonus scored 0 is not told, on
      screen or in the CSV, that nothing is graded. **Mutation-proved.**
- [ ] A weighted class's student detail and CSV are byte-identical before and after, on the harness's
      existing fixtures.

**Traps** — **Do not compute a grade on the screen.** **A blank is still ungraded**: a cell with no
score must never count as a scored 0, which is the rule the whole gradebook rests on.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/detail.js` ~375 to ~500 (`rowIsEmpty()`, `POINTS_EMPTY_SAY`, `POINTS_BONUS_ONLY_SAY`, the row wording) and ~944 to ~1110 (`detailModel()`, `studentCsv()`). This is where all the work is.
- `src/grade-engine.js` ~340 to ~356: the WO-3.35 message split. Read it to understand why `earned !== 0` cannot see a scored 0; do not edit it.
- `tools/verify/points-grade.mjs`: WO-3.35's points fixture and checks. Extend this fixture with a student whose only graded work is a bonus scored 0 (and keep a student with a blank bonus, to prove the blank still reads as ungraded). No new harness file.
- **The no-grade message on screen.** The engine will still say *"There is no graded work yet."* for this student. Where student detail prints that sentence (the to-move card, the hero label; grep `message` in `src/detail.js`), the screen must say what is true instead, driven by the same function. **Reuse the engine's own extra-credit-only sentence's meaning, do not compose a grade.** Note a scored 0 earns no points, so the wording must not claim it "adds" anything.
- **The quiet list (`src/signals.js` ~2215 `quietSentence`) also prints "has no graded work yet" off the engine's message, and is outside the ruling.** Its own comment forbids working the answer out there. **Do not touch `src/signals.js`.** Report in your result whether it prints the false sentence for this student, as a proposed follow-up, not a fix.
- **Byte-identity (Acceptance 2):** capture weighted-class student-detail text and CSV output from the existing fixtures before your edit and compare after. Say in the result how you captured them and that the comparison was run, not reasoned.
- **Mutation:** e.g. make the shared function ignore the scored-0 case and show the points check go red; then revert, and `grep -rn MUTATION src tools` must be empty before you write the result. Stage your work before any `git checkout`-style revert.
- `sw.js`: bump `CACHE` since `src/detail.js` is in `SHELL`. `tools/README.md` records harness `check()` counts; if you add checks, update the count there or the sweep goes red.


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

## 5. Done means these 2 lines, reported against one by one

1. In a points fixture, a student whose only graded work is a bonus scored 0 is not told, on screen or in the CSV, that nothing is graded. **Mutation-proved.**
2. A weighted class's student detail and CSV are byte-identical before and after, on the harness's existing fixtures.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

