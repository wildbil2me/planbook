# WO-3.72 — a quarter's grades can be recorded, and the engine says when they stop matching · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.72-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no tier override — routed to Claude on its merits). The deciding
signals: it puts grade data in a new place in the year document, so `docs/FERPA.md` and
`privacy.html` must be read for whether a sentence changes (sensitive surface); and it sets the
convention WO-3.73 to WO-3.75 copy — the `termRecords` block and the reader shape of
`src/term-record.js`. Runner-up was Codex (an engine module against written rulings, mechanically
checkable), set aside on those grounds and on budget: verify-shell runs ~10 min on this tree and the
Acceptance wants a clean run plus a mutation run.

**The owner's ruling on the work order's Open question (2026-10-23, relayed at `--start`):** a
student who was recorded in a quarter and **has since left the class's roster is LEFT OUT** — not
reported as changed, not counted in any "changed" figure, not listed. The work order's proposal,
taken as written. Concretely: the no-longer-matches reader walks **the class's current roster**
(students whose live `classGrade()` has a percentage), compares each against the newest record, and
never iterates the record's own `grades[]` looking for missing people. Record the ruling where the
work order's **Open** line is (replace it with *Answered, the owner, 2026-10-23: left out* and the
reason), in `plans/closing-a-quarter.md` beside question 9, and in `docs/data-model.md`; and add a
harness check that a recorded student removed from the roster is not reported — that is the check
that tells a "left out" implementation from one that happens to be.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.72 — a quarter's grades can be recorded, and the engine says when they stop matching

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-23 · **Size** M · **Depends on** — · **Blocks** WO-3.73
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
- [ ] Recording a class's quarter appends one entry holding every graded student's percentage and
      letter, equal to `classGrade()`'s; recording again appends a second and changes neither.
- [ ] With nothing changed since a recording, no student is reported as changed.
- [ ] A score edit that moves a percentage inside the same letter reports that student as changed,
      with the recorded and the live figures.
- [ ] A weight, letter-scale or drop-lowest change that moves grades reports exactly the students
      whose figures moved.
- [ ] The ended and ends-today readers answer for the term's end date, the day before and the day
      after.
- [ ] The empty-boxes reader counts a scoreless late mark, never a dropped, excused or missing cell,
      and nothing in a held column, and names the categories the empty boxes are in.
- [ ] A backup with no `termRecords` key restores and reads as unrecorded.
- [ ] `src/term-record.js` holds one writer, and it only pushes.
- [ ] With the comparison ignoring the percentage, the percentage-only checks go red. The mutation is
      reverted, and `TESTING.md` § WO-3.72 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.72 carries these lines verbatim with the evidence for each.

**Open — the owner's, at `--start`:** a student who was recorded and has since **left the roster** —
reported as changed, or left out? Proposed: left out; a withdrawal is Blackbaud's business, and a
reminder that cannot be cleared is worse than none.

**Traps** — **The comparison asks the engine and stores nothing**: a cached "changed" flag is the
second truth CLAUDE.md refuses everywhere. **Never fold this into `src/grade-engine.js`** — that
module reads no clock, and this one does. **Check the import graph**: `src/term-record.js` imports the
engine and the attendance date helper; nothing in the engine may import it back.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/closing-a-quarter.html`
  - `design/mockups/proposed-quarter.css`
  - `docs/FERPA.md`
  - `docs/data-model.md`
  - `plans/closing-a-quarter.md`
  - `src/grade-engine.js`
  - `src/log.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **Sibling conventions to match**: `src/log.js` (`localStamp()`, the one-push writer shape of
  `writeEntry()`/`writeContact()`, and its header's account of why there is no updater);
  `src/held-column.js` and `src/grade-engine.js` `isHeld()` / `heldWork()` — **never read `.held`
  outside the engine** (`wo-sweep.mjs` § 30 enforces it, destructured parameters included);
  `src/grade-engine.js` `isDropped()` for the dropped cell; `todayISO()` in `src/attendance.js`;
  `formatPercent()` in `src/scores.js` is what "the two decimals the screens print" means — compare
  through the same rounding rather than a second one, but check that importing it does not pull a
  DOM module into an engine reader.
- **How a backup is validated**: `parseBackup()` and `newYearDocument()` (see CLAUDE.md, WO-6.1's
  bullet — seeding an empty block refused every earlier backup and cost a run). The absent key must
  read as unrecorded through every reader.
- **Rosters**: `cls.roster` is an array of student ids; several modules drop an id that names nobody
  (`rosterOf()` in `src/attendance.js`). Do the same.
- **Registration**: a verify module is imported and listed in `tools/verify-shell.mjs` the way
  `verify/glance-quiet.mjs` is. The `check()` count in `tools/README.md` is read by `wo-sweep.mjs` —
  correct it when you add checks, or the sweep goes red on finished work (WO-3.26).
- **Out of scope**: no screen, no bar, no dialog — those are WO-3.73 and WO-3.74. No per-term grading
  settings. No lock of any kind on a recorded quarter.
- **The mutation**: mark it with `MUTATION` in a comment, run, capture the red lines, and **revert
  it before writing anything else** (AGENTS.md). Stage your own work first — a `git checkout` to
  revert clobbers unstaged edits in the same file.
- **`CHANGELOG.md`**: the work order names the entry as a deliverable — write it under the unreleased
  heading as a draft for the owner, in the file's existing voice.

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

## 5. Done means these lines, reported against one by one

Report against each of the eleven Acceptance lines in § 1, verbatim, one by one — the command or
check that closes it and its output — plus one more line for the owner's ruling:

- Recording a class's quarter appends one entry … recording again appends a second and changes neither.
- With nothing changed since a recording, no student is reported as changed.
- A score edit that moves a percentage inside the same letter reports that student as changed …
- A weight, letter-scale or drop-lowest change that moves grades reports exactly the students whose figures moved.
- The ended and ends-today readers answer for the term's end date, the day before and the day after.
- The empty-boxes reader counts a scoreless late mark, never a dropped, excused or missing cell, and nothing in a held column, and names the categories.
- A backup with no `termRecords` key restores and reads as unrecorded.
- `src/term-record.js` holds one writer, and it only pushes.
- With the comparison ignoring the percentage, the percentage-only checks go red; reverted; red output in `TESTING.md`.
- `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass — the final summary lines, after the revert.
- `TESTING.md` § WO-3.72 carries these lines verbatim with evidence.
- **(Ruling)** A student recorded and since removed from the roster is not reported as changed — the check that proves it.

Also report: whether `docs/FERPA.md` / `privacy.html` changed and why or why not; and anything you
could not close, as such. Mark no 👤 line (there are none here).

**Write `TESTING.md` § WO-3.72 — it is a deliverable, not a permission.** Add `### WO-3.72 — a quarter's grades can be recorded, and the engine says when they stop matching` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.72` refuses ✅ DONE without it.

