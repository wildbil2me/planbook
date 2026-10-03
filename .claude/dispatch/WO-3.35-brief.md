# WO-3.35 — the student CSV and an extra-credit-only student read a points class wrong · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.35-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override). The deciding signal is teacher-facing prose that calls for judgment: the work order says outright that what an extra-credit-only student's row should say "is this row's judgment", and that sentence lands on screen and in a file a teacher hands to a parent. Runner-up set aside: the export half is mechanical (make the CSV call the screen's empty test and its points columns), which reads Codex-shaped, but the Acceptance wants a mutation-proved line plus a byte-identical weighted baseline, which is at least three harness runs at ~4.5 min each, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.35 — the student CSV and an extra-credit-only student read a points class wrong

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-03 · **Size** S · **Depends on** WO-3.34 — `rowIsEmpty()` and the points-mode breakdown this follows
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
- [ ] In WO-3.34's points fixture, the student CSV's *Contributes* column sums to its *Overall grade*
      to the cent, for both the extra-credit category and the `no category` row. **Mutation-proved.**
- [ ] A points-class CSV contains no `Weight %`, `Counts at %` or "redistributes".
- [ ] A weighted class's CSV is byte-identical before and after, on the harness's existing fixtures.
- [ ] A points-class student whose only graded work is extra credit is not told, on screen or in the
      CSV, that nothing is graded.

**Traps** — **Do not compute a share or a sum in the export.** Every figure comes from
`classGrade()` and `detailModel()`. **Do not change the engine's returned shape.**

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/detail.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/detail.js` ~360–430: `rowIsEmpty()` and `breakdown(grade, byPoints)`, the on-screen points branch WO-3.34 built. The CSV follows *this*, never a third copy of the test. `studentCsv()` is at ~956; the model it reads is built at ~899.
- `src/grade-engine.js` `points()`: what `effectiveWeight` means in points mode (a category's share). Read the returned shape; you may not change it.
- `tools/verify/points-grade.mjs`: WO-3.34's points fixture, the one Acceptance line 1 names. `tools/verify/grade-detail.mjs` ~900–1040 already drives `studentCsv()`. Extend these rather than starting a new harness file, unless a section genuinely belongs on its own.
- `plans/work-orders/phase-3-gradebook.md` § WO-3.34: the verdict this row was booked out of, and its rulings on points-mode wording.

**Three traps the work order does not spell out.**
1. **Acceptance line 3 needs a baseline taken *before* you edit.** Capture the weighted-class CSV bytes from the harness's existing fixtures on the clean tree first (in your scratchpad, not in `tools/`), then compare after. A comparison reasoned about after the edit is not byte-identical evidence. Better still, leave a harness check behind that pins the weighted output so the next row cannot drift it.
2. **The extra-credit-only student has no overall grade and no contributions** (possible 0). The Contributes column cannot "sum to the Overall" there, because there is no Overall. Do not invent a figure to make it look complete. Say what is true (scored work, extra credit, nothing yet for it to add to; your wording, in the screen's voice), and use the same sentence on screen and in the CSV. If fixing this means changing `rowIsEmpty()`, change it once so both callers move together.
3. **The mutation round.** Revert every mutation before you write anything else, and leave no `MUTATION` marker in `src/` or `tools/`. A killed run that left one armed is how WO-5.1 and WO-5.3 nearly went out broken. Stage your work before any `git checkout`-style revert so it cannot clobber your own unstaged edits.

`sw.js`: `src/detail.js` is in `SHELL`, so bump `CACHE`. `TESTING.md`: add a WO-3.35 section only for readings you actually took. There is no 👤 line on this row, and it is unreachable on a device until WO-3.31 ships, so do not invent one.

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

## 5. Done means these 4 lines, reported against one by one

1. In WO-3.34's points fixture, the student CSV's *Contributes* column sums to its *Overall grade* to the cent, for both the extra-credit category and the `no category` row. **Mutation-proved.**
2. A points-class CSV contains no `Weight %`, `Counts at %` or "redistributes".
3. A weighted class's CSV is byte-identical before and after, on the harness's existing fixtures.
4. A points-class student whose only graded work is extra credit is not told, on screen or in the CSV, that nothing is graded.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

