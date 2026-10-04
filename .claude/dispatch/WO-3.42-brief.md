# WO-3.42 — the score grid and grade sheet tell a screen reader a bonus scored 0 is nothing graded · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.42-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus**, on its own merits: the Traps are judgment, not mechanics (exactly one
copy of `gradedPieces()`, no grade computed on a screen, a blank never a scored 0), and the new
module's boundary is a placement decision every later reader copies. The runner-up was Codex (Size S,
the spec is now fully ruled, both lines mechanically checkable) and it was set aside on the Traps.
This is the same route as WO-3.38, the work order it finishes.

**The owner ruled (a) at dispatch** (it is in the work order now). Build (a). Do not reopen (b) or
(c), and do not touch `src/grade-engine.js`.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.42 — the score grid and grade sheet tell a screen reader a bonus scored 0 is nothing graded

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-03 · **Size** S · **Depends on** WO-3.38 — `gradedPieces()` and the zero-bonus message this carries to two more screens
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
- [ ] In a points fixture, a student whose only graded work is a bonus scored 0 is not told by the
      score grid's or the grade sheet's accessible name that nothing is graded. A blank or excused
      bonus still is. **Mutation-proved.**
- [ ] A weighted class's score grid and grade sheet are byte-identical before and after, on the
      harness's existing fixtures.

**Traps** — **Do not compute a grade on the screen**, and **a blank is still ungraded**, exactly as
WO-3.38. **The quiet list is not this row's**: the owner ruled on 2026-10-03 that `src/signals.js`
keeps its sentence for this case. **A second copy of `gradedPieces()` is the defect this row
exists to avoid**, so under (a) `src/detail.js` must import the lifted function rather than keep its own.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/detail.js`
  - `src/grades-report.js`
  - `src/scores.js`
  - `src/signals.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/grade-engine.js`: read it only. `gradingModeOf()` and the `grade.reason` / `grade.message` /
  `grade.categories` shape are what the lifted functions consume.
- `tools/verify/points-grade.mjs`: WO-3.38's checks for the zero-bonus case. Extend it, don't fork it.
- `sw.js`, the comment block at the top. A new `src/` file goes into `SHELL` and `CACHE` gets bumped.
- `.claude/dispatch/WO-3.38-result.md`: how the student-detail half was built and proved.

**Traps the work order doesn't spell out.** Found at dispatch from the tree, so check each one yourself:

- **`noGradeMessage()` drags `rowIsEmpty()` and `POINTS_ZERO_BONUS_MESSAGE` with it**, and
  `src/detail.js` still uses `rowIsEmpty()` in `rowShowsEmpty()`, the CSV and the breakdown. Move it
  once and import it back. If you leave a copy in `detail.js`, you have built the second copy this row
  exists to stop, just one function over. `rowIsGraded()` and `rowShowsEmpty()` are your call. Keep
  the import graph obvious.
- **The `gradingModeOf(cls) === 'points' ? gradedPieces(…) : null` guard is part of the fact.**
  Today it is written inline at two call sites in `detail.js`. If each screen writes it again, there
  are three guards that can drift apart. Weigh putting the guarded question in the shared module.
  Whatever you choose, a weighted class must never call `gradedPieces()`. That rule is what keeps the
  weighted bytes identical.
- **No import loop.** `detail.js` and `grades-report.js` both import `scores.js`. The new module must
  import none of the three screens. It reads `categories.js` and, for the mode, `grade-engine.js`.
  Reading the mode and comparing the engine's own numbers to 0 is not grade arithmetic. Working out a
  percentage, a total or a share would be.
- **`src/grades-report.js` line ~446 reads `student.message`** from a record built earlier in the
  file. The fact has to reach that record from the same function. Do not rebuild it from the
  sentence.
- **`src/signals.js` is out of scope** (the owner ruled this). Neither it nor the quiet list changes.
- **The sweep goes red on finished work.** `tools/README.md` records the harness's `check()` call-site
  count (1676 today). Correct it when you add checks.
- **Before you return: `grep -rn MUTATION src/ tools/` comes back empty**, and you say in your result
  file that you ran it. Two dead dispatches here left live mutations under ticked boxes.
- **Line 2, before and after:** capture the weighted grid's and grade sheet's accessible names and
  markup on the existing fixtures **before** you edit, then compare after. A check written only
  after the change cannot show anything stayed the same.
- **Stop at your return.** The verifier is a separate, later session. Tick only what you proved. No
  `CHANGELOG.md`.

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

1. In a points fixture, a student whose only graded work is a bonus scored 0 is not told by the score grid's or the grade sheet's accessible name that nothing is graded. A blank or excused bonus still is. **Mutation-proved.**
2. A weighted class's score grid and grade sheet are byte-identical before and after, on the harness's existing fixtures.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

