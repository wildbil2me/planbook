# WO-3.52 — a held column counts toward nothing and keeps no history, in the engine · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.52-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus** (no model override). The engine half is Codex-shaped -- a pure filter at two choke points and a pure function in `src/score-history.js` -- but the work order carries two owner rulings about the score trail, Traps that are judgment rather than mechanics ("do not work around the `openWork()` loss", "no cell-level marker", "do not fake it with `excused`"), and a `docs/data-model.md` section in the suite's voice, which puts it in the Claude column on its own merits. Runner-up set aside: Codex on the grade-engine shape; the proof budget (one clean `verify-shell.mjs` run plus the Ruling 1 mutation run) would also be tight against the 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.52 — a held column counts toward nothing and keeps no history, in the engine

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-07 · **Size** S · **Depends on** —
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
- Nothing about a held column is stored on its cells. A cell does not know its column is held.

**Rulings, the owner's, 2026-10-07**, confirmed as proposed when WO-3.46 was booked:
1. **The revision window after a commit is measured from the commit.** `reviseCell()` treats a change
   inside `REVISION_WINDOW_MS` of the cell's `at` as a correction and pushes nothing. A held cell's
   `at` is when it was typed, not when it began to count. So: type 72 while held, commit at 9:02,
   change it to 75 at 9:03, and the 72 would vanish from the trail of a score that counted. The window
   starts at whichever is later, the cell's `at` or the column's `committedAt`.
2. **A live column can be held again, and its trail is frozen, not cleared.** A cell that already
   has `was` keeps it untouched while held. Edits replace the current version and push nothing, and
   the trail resumes on the next commit. Holding a column must never be a way to make a revised score
   disappear.

**Deliverables**
- **`isHeld(assignment)`, exported from `src/grade-engine.js`.** It is the one place that reads
  `.held`. Every later piece asks it, so a later change to what "held" means is one edit.
- **The grade engine skips a held column at its two choke points**, `assignmentsFor()` (~41) and
  `looseAssignments()` (~63), through `isHeld()`, with a comment at each saying why. Every class
  grade, category percentage, letter, points share, projection and `openWork()` row follows from
  those two, in both grading modes. **Do not filter anywhere else in the engine.**
- **`reviseCell()` is told about the column**: a fourth argument, `{ held, committedAt }` or nothing,
  where nothing means live and today's behaviour is unchanged to the byte. A held write stores the
  wanted value, flag and note with a fresh `at`, keeps any existing `was` as it is, and pushes
  nothing. A held cell blanked with no `was` is deleted, as today. Ruling 1's window lives here too.
  Both callers pass it, built from `isHeld()` and the assignment's `committedAt`: `src/scores.js`
  (~474) and `src/past-due.js` (~537). **One rule, not callers deciding.**
- **`docs/data-model.md`** documents `held` and `committedAt` in the assignment sketch, the history
  rule under the score cells, and the grade-math rule that a held column counts toward nothing.
- **`CACHE` in `sw.js` is bumped**: `src/grade-engine.js` and `src/score-history.js` are in SHELL.

**Acceptance**
- [ ] A held column's scores, `missing` and `excused` move no class grade, category percentage or
      letter, in a weighted class, in a points class, and in a points class's uncategorized work.
      The same document with `held` deleted moves them.
- [ ] Editing a held cell three times leaves no `was`. After commit, the first edit more than the
      window after `committedAt` pushes the committed version.
- [ ] Ruling 1: a held cell typed at T, committed at T+2m and changed at T+3m pushes the committed
      value onto `was`. Mutation-proved against measuring from the cell's `at`; **the mutation is
      reverted before anything else is written** (`AGENTS.md`).
- [ ] Ruling 2: a live column with a trail, held and then edited, keeps its trail byte for byte.
- [ ] A document written before this build restores, and every column in it is live.
- [ ] `reviseCell()` with no fourth argument returns what it returns today, for every case in the
      existing history checks.
- [ ] `CACHE` in `sw.js` is bumped.

**Traps** — **Do not store a held marker on the cells.** The column is the unit, and a cell-level
flag is a second truth that a restore, a copy or the past-due sweep will one day write one of and not
the other. **Do not use `excused` to fake it.** It is a decision about one student and is already in
the grade math. **`openWork()` loses held columns as a side effect of the filter.** That is correct
here and invisible until WO-3.46 lets a teacher hold one. WO-3.47 adds the engine call the queue
needs. Do not work around the loss in this piece.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/grade-engine.js`
  - `src/past-due.js`
  - `src/score-history.js`
  - `src/scores.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/grade-engine.mjs`, `tools/verify/points-grade.mjs` and `tools/verify/score-history.mjs` -- where the existing grade-math and trail checks live. Add the new checks beside them rather than in a new file.
- `tools/wo-sweep.mjs` § 28 -- it fixes `src/score-history.js`'s export list and which files may import `reviseCell`. This work order adds **no** export there and **no** new importer, so § 28 should stay green unchanged; if it goes red, you widened something.

**Orchestrator notes -- the traps a cold reader would not guess.**
- `reviseCell(old, next, now)` **already takes a third argument**, the clock. The column object is the **fourth**; do not reorder, and every existing caller passing `now` keeps working.
- **`src/score-history.js` must not import `src/grade-engine.js`.** The callers build `{ held: isHeld(a), committedAt: a.committedAt }` and pass it in; the rule stays in `reviseCell()`, and `isHeld()` stays the one reader of `.held`.
- "Unchanged to the byte" with no fourth argument is an Acceptance line: prove it by running the existing history checks untouched, not by rewriting them.
- Ruling 1's window: measure from `max(cell.at, committedAt)`. The mutation (measure from `at` alone) must turn a check red, and it is **reverted before you write anything else** -- the result file, docs, ticks. `grep -rn MUTATION src/ tools/` must come back empty before you report.
- `openWork()` losing held columns is intended here. Do not add a second path to keep them.
- Fixtures write `held`/`committedAt` directly into a document; nothing in the app can write them yet, and you must not add a writer or a control (WO-3.46 owns that).
- If `tools/README.md` records a `check()` count for the sweep or harness, keep it in step -- WO-3.26 shipped a red sweep on exactly that.
- Bump `CACHE` in `sw.js` once.

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

## 5. Done means these 7 lines, reported against one by one

1. A held column's scores, `missing` and `excused` move no class grade, category percentage or letter, in a weighted class, in a points class, and in a points class's uncategorized work. The same document with `held` deleted moves them.
2. Editing a held cell three times leaves no `was`. After commit, the first edit more than the window after `committedAt` pushes the committed version.
3. Ruling 1: a held cell typed at T, committed at T+2m and changed at T+3m pushes the committed value onto `was`. Mutation-proved against measuring from the cell's `at`; **the mutation is reverted before anything else is written** (`AGENTS.md`).
4. Ruling 2: a live column with a trail, held and then edited, keeps its trail byte for byte.
5. A document written before this build restores, and every column in it is live.
6. `reviseCell()` with no fourth argument returns what it returns today, for every case in the existing history checks.
7. `CACHE` in `sw.js` is bumped.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

