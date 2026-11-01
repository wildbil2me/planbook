# WO-2.62 — every report's numbers sit under their own heads, and the term row is one builder · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.62-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override) — routed on its own merits, not by fallback. The deciding signals are that it owes teacher-facing prose (`TESTING.md` § WO-2.62 and a `CHANGELOG.md` entry) and that its Traps are judgment traps (no head-only rule, no `!important`, `percentText()` untouched because merge fields read it). The runner-up was Codex: the CSS fix and the harness check are mechanical and the run arithmetic fits (1 clean + 2 mutation runs × ~4.4 min ≈ 13.2 min < 20), but ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.62 — every report's numbers sit under their own heads, and the term row is one builder

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-01 · **Size** S · **Depends on** WO-2.59 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-11-01.)*

**Booked 2026-11-01**, owner-directed, from a screenshot of the attendance record's *By student*
tab: the five counts sit to the left of P T A E D, each one apparently under the head before it, and
*No recorded meetings* reads as the Meetings column when it is Attendance. The rows were built
correctly — one cell per head, in order. **The stylesheets pull them apart, and so do two others.**

**Why it exists.**
1. **`.attendance-report-num` loses on every `<td>`.** `src/attendance.css` sets
   `.attendance-report-table th, .attendance-report-table td { text-align: left }` (0,1,1), and the
   column rule `.attendance-report-num { text-align: right }` (0,1,0) loses to it. Somebody saw the
   head lose and added `thead th.attendance-report-num` (0,2,2) — **which repaired the head and
   nothing under it**, so heads sit right and numbers sit left. Five tables wear the class: the
   record's *By student* summary (`totalsRow()`, `src/attendance-report.js`), the student page's
   term table (`attTotalsRow()`, `src/detail.js`), and in `src/pass-history.js` the per-student pass
   counts with their *All of …* footer and the trip table's *Minutes*. The print blocks set no
   alignment, so paper is the screen.
2. **The grade sheet ties the same way in the other direction.** `src/scores.css` centres
   `.grades-report-table th, td` (0,1,1), which beats both `.grades-report-student-head,
   .grades-report-row-head { text-align: left }` and `.grades-report-total-head,
   .grades-report-total { text-align: right }` (0,1,0) — contrary to the comment over them. On screen
   everything is centred and heads at least agree with cells. **On paper they do not**: the print
   block's `body[data-grades-print]` rules are specific enough to move the name cells left and the
   totals right, and nothing moves their heads, so the sheet a teacher re-keys Blackbaud from has
   *Student* and *Grade* centred over columns that are not.
3. **The term row exists twice.** `attTotalsRow()` in `src/detail.js` says it is *"the dialog's
   totalsRow(), moved with its table"*, and is a word-for-word copy of the one still in
   `src/attendance-report.js`. This fix is the first change that has to reach both.

**Rulings, the owner's, 2026-11-01**
1. **A dash, not the sentence, in the table.** Where a row has no recorded meetings its percentage
   cell reads `—` — the mark the pass tables already use for *nothing to count* — and carries the
   accessible name *No recorded meetings*. **`percentText()` is not changed**: the student page's card
   title, its term-history line and the merge fields all use the sentence where it has room. The two
   CSVs keep their empty cell.
2. **One builder.** `totalsRow()` is exported from `src/attendance-report.js` and `src/detail.js`
   imports it in place of `attTotalsRow()`, which is deleted — the `studentPassCard()` arrangement,
   where one builder renders for the dialog and the card so the two cannot drift.

**Deliverables**
- **`src/attendance.css`**: the column rule made specific enough to win on head and cell alike
  (e.g. `.attendance-report-table .attendance-report-num`), and **`thead th.attendance-report-num`
  deleted** — a head-only patch is the defect's shape. The coarse block's restatements stay true;
  they are deliberate (each class the block considered is listed) and are not cleanup.
- **`src/scores.css`**: the student and grade columns' rules win over the table-wide centring for
  head and cell on screen, and the print block's head rules agree with its cell rules. Read the
  `body[data-grades-print]` block through, not just the two lines that differ.
- **`src/attendance-report.js`**: `totalsRow()` exported, with the dash and its accessible name.
- **`src/detail.js`**: `attTotalsRow()` deleted, `totalsRow()` imported. **Confirm no import loop**
  before writing it — nothing in `src/attendance-report.js`'s import graph may reach
  `src/detail.js`; state what was checked in the result file.
- **`src/pass-history.js`**: nothing, unless the CSS change does not reach it — it wears the class.
- **The harness**: a check that, for each of the five tables and the grade sheet, compares every
  head's computed `text-align` with its column's body cells — on screen, and with
  `data-attendance-print`, `data-grades-print` and `data-detail-print` set. **A check that reads only
  heads passes both defects**, which is how they got here.
- **Two mutations**, each shown red and reverted before writing anything else: the
  `.attendance-report-table .attendance-report-num` specificity put back to `.attendance-report-num`,
  and the grade sheet's print head rule removed.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-2.62** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] In each of the five `.attendance-report-num` tables and in the grade sheet, every head's
      computed `text-align` equals its column's cells', on screen and under each print attribute
      that applies to it.
- [ ] A student with no recorded meetings reads `—` in the percentage cell of the record's
      *By student* tab and of the student page's term table, and that cell's accessible name is
      *No recorded meetings*. The student page's card title still reads *Attendance · No recorded
      meetings*.
- [ ] `src/detail.js` contains no `attTotalsRow`, and imports `totalsRow` from
      `src/attendance-report.js`; row heads keep `scope="row"`.
- [ ] With either mutation in place the check goes red; both are reverted, and `TESTING.md`
      § WO-2.62 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit: the record's *By student* tab and a student page's term
      table, numbers under their heads. On paper from the laptop: one grade sheet, *Student* over the
      names and *Grade* over the totals.
- [ ] `TESTING.md` § WO-2.62 carries these lines verbatim with the evidence for each.

**Traps** — **Do not add another head-only rule**; that is the patch this work order deletes.
**Do not change `percentText()`**: the merge fields read it and a dash in a guardian's email is a
different bug. **`!important` is not the fix** — the print blocks already use it for colour, and
using it for alignment hides the next tie instead of settling this one. **The grade sheet's on-screen
centring was never visible as a misalignment**, so a screenshot will not show this half working; the
print attribute is where it is read.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance-report.js`
  - `src/attendance.css`
  - `src/detail.js`
  - `src/pass-history.js`
  - `src/scores.css`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **Pointers and traps the work order does not spell out:**
  - `studentPassCard()` in `src/pass-history.js` is the precedent for "one builder renders for the dialog and the card" — match its export/import shape.
  - Before importing `totalsRow` into `src/detail.js`, walk `src/attendance-report.js`'s imports transitively and confirm none reaches `src/detail.js`; record the walk in the result file. This repo has refused import loops repeatedly.
  - The accessible name for the dash: prefer an `aria-label` on the cell (or a visually-hidden span) carrying exactly *No recorded meetings*; the harness should assert the name, not just the glyph.
  - The alignment check must read **computed** `text-align` of both head and body cells per column under each print attribute (`data-attendance-print`, `data-grades-print`, `data-detail-print`) — set the attribute on `body` the way the app's own print path does (read it; do not invent a different attribute target), and emulate print media if the print blocks are inside `@media print`. A check reading only heads passes both defects.
  - Mutation discipline (AGENTS.md): every mutation line carries a `MUTATION` marker, and is reverted before you write anything else. Stage your own work before a `git checkout`-style revert so it cannot clobber unstaged edits. Run `grep -rn MUTATION src tools index.html` before writing the result file.
  - If a `check()` count in `tools/README.md` is recorded for `verify-shell.mjs`, adding checks turns `wo-sweep.mjs` red until it is updated — update it.
  - `TESTING.md` § WO-2.62 is a deliverable, not optional. Leave the 👤 line `- [ ]`.

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

## 5. Done means these 7 lines, reported against one by one

1. In each of the five `.attendance-report-num` tables and in the grade sheet, every head's computed `text-align` equals its column's cells', on screen and under each print attribute that applies to it.
2. A student with no recorded meetings reads `—` in the percentage cell of the record's *By student* tab and of the student page's term table, and that cell's accessible name is *No recorded meetings*. The student page's card title still reads *Attendance · No recorded meetings*.
3. `src/detail.js` contains no `attTotalsRow`, and imports `totalsRow` from `src/attendance-report.js`; row heads keep `scope="row"`.
4. With either mutation in place the check goes red; both are reverted, and `TESTING.md` § WO-2.62 shows the red output.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
6. 👤 On the iPad, after a force-quit: the record's *By student* tab and a student page's term table, numbers under their heads. On paper from the laptop: one grade sheet, *Student* over the names and *Grade* over the totals.
7. `TESTING.md` § WO-2.62 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-2.62 — it is a deliverable, not a permission.** Add `### WO-2.62 — every report's numbers sit under their own heads, and the term row is one builder` under `## Phase 2 — Attendance`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-2.62` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

