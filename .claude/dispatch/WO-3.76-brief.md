# WO-3.76 — "N to grade" skips work filed under no category · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.76-result.md` — as your last act, and return it in-band too.

**Routing: Claude, Opus tier, on its own merits.** The deciding signals are the judgment trap
(`src/glance.js` forwards and does not compute, fenced by `wo-sweep.mjs` § 31, plus a survey of four
other readers whose findings are prose, not code) and the teacher-facing `TESTING.md` section. Codex
was the runner-up — the engine reader already exists and the work is two call sites plus checks, and
one clean run plus one mutation run (~9 min) fits the cap — but the Claude column is read first.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.76 — "N to grade" skips work filed under no category

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-01 · **Size** S · **Depends on** WO-3.73 · **Blocks** nothing
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

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/closing-a-quarter.md`
  - `src/glance.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/grade-engine.js` — `openWork()` (~l.307), `heldWork()` (~l.343) and **`uncategorizedWork()`
  (~l.372), the WO-3.73 sibling this work order means by "the engine reader"**. Read its comment: it
  is a third array on purpose, and `openWork()` stays unwidened. Its rows carry `categoryId: null`.
- `src/home.js` ~l.390–430 — the card's *N to grade*: a per-student union of `openWork()` and
  `heldWork()` rows into a Set. `src/glance.js` ~l.300–350 — `queueRows()`, the same shape.
  **Following that existing union shape with a third forwarded source is the precedent, not a
  violation** — the trap is arithmetic or a cell test in the reader, not taking a third engine array.
- `src/term-record.js` `emptyBoxes()` (~l.423) and `src/term-record-view.js` — the quarter dialog
  whose count the card and queue must agree with (Acceptance 2), and the words it uses for the pile.
- The "no category" wording: `LOOSE_NAME` in the engine and `src/assignments.js`. Group under the
  quarter dialog's words, not a new phrase.

**Traps the work order does not spell out:**
- **Held is held.** `looseAssignments()` excludes held columns; confirm a held uncategorized column
  arrives through `heldWork()` once, and never twice through both readers.
- **Points mode double-count.** In points mode the projection already walks the loose pile; nothing
  you change may feed `uncategorizedWork()` rows into a projection (Acceptance 3 — prove it by a
  figure that does not move, not by reasoning).
- **Mutation discipline** (AGENTS.md): put the word `MUTATION` on the line you break, revert it
  **before writing anything else**, and `grep -rn MUTATION src/` clean before you report. Four dead
  dispatches here left live mutations under ticked boxes.
- `wo-sweep.mjs` § 31 and any recorded call-site counts in `tools/README.md` may need updating when
  `src/glance.js` gains an import — a sweep line that goes red on work being *done*, not wrong.
- Stay inside the Deliverables: student detail, grade sheet and CSVs are **surveyed and reported** in
  `TESTING.md`, never changed. Anything they lack is a proposed follow-up in your result file.
- Leave the `CHANGELOG.md` entry as a draft in your result file — the brief's constraint governs over
  the work order's Deliverables line on that point.

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

## 5. Done means these 6 lines, reported against one by one

1. A class with one empty uncategorized assignment shows it in the card's *N to grade* and in the queue, in a weighted class and in a points class, and the card's figure equals the queue's row count for that class.
2. The quarter dialog's empty-boxes count, the card and the queue agree on the same fixture.
3. No projection's figures move, and a held uncategorized column still counts as held, not open.
4. With the uncategorized reader dropped from the queue, the check goes red. The mutation is reverted, and `TESTING.md` § WO-3.76 shows the red output.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
6. `TESTING.md` § WO-3.76 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.76 — it is a deliverable, not a permission.** Add `### WO-3.76 — "N to grade" skips work filed under no category` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.76` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

