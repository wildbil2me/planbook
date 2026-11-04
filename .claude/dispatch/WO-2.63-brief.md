# WO-2.63 — the day-by-day grid centres its marks under their dates · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.63-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, on its own merits: the Traps are judgment, not mechanics (no head-only rule, no `!important`, the row head stays left, and the mark chip's own centring is not the column's), and it owes `TESTING.md` and `CHANGELOG.md` prose. Codex was the runner-up and is set aside on budget as well: one clean `verify-shell.mjs` run plus one mutation run at ~20 minutes each (WO-3.71's measured figure) does not fit the 20-minute runner cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.63 — the day-by-day grid centres its marks under their dates

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-03 · **Size** XS · **Depends on** WO-2.62 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-11-01.)*

**Booked 2026-11-01**, owner-directed, out of WO-2.62's verdict. The same specificity tie WO-2.62
settled for the number column, in the one table it left alone: the record's *Day by day* grid.

**Why it exists.** `src/attendance.css` sets
`.attendance-report-table th, .attendance-report-table td { text-align: left }` (0,1,1), and the grid's
`.attendance-report-day { text-align: center }` and `.attendance-report-cell { text-align: center }`
are (0,1,0) — so they lose, on screen and in the coarse block's restatements alike, and every date
head and every mark sits at the left of its column. Heads and cells **agree** (both left), which is
why WO-2.62's check, which excludes the grid (`:not(.attendance-report-grid)`), never saw it and why
it was not WO-2.62's defect. The CSS says centre and the screen does not.

**Deliverables**
- **`src/attendance.css`**: the day and cell rules made specific enough to win for head and cell alike,
  scoped to the grid (e.g. `.attendance-report-grid .attendance-report-day`,
  `.attendance-report-grid .attendance-report-cell`), on screen and in the coarse block. The row head
  (`.attendance-report-row-head`) and the *Student* head stay left. Read the `data-attendance-print`
  block through: it sets widths here, not alignment, so paper should follow the screen — confirm it.
- **The harness**: the grid joins `tools/verify/report-alignment.mjs` — every date head and every
  mark cell computes `center`, the *Student* column `left`, on screen and with `data-attendance-print`
  set. **A check that only asks heads and cells to agree passes this defect**, which is how it got
  past WO-2.62.
- **One mutation**, shown red and reverted before writing anything else: the grid rules put back to
  the bare `.attendance-report-day` / `.attendance-report-cell`.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-2.63** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] In the record's *Day by day* grid, every date head and every mark cell computes
      `text-align: center` and the *Student* head and row heads compute `left`, on screen and with
      `data-attendance-print` set.
- [ ] With the mutation in place the check goes red; it is reverted, and `TESTING.md` § WO-2.63 shows
      the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit: the record's *Day by day* tab, each mark centred under its
      date.
- [ ] `TESTING.md` § WO-2.63 carries these lines verbatim with the evidence for each.

**Traps** — **Do not add a head-only rule**, and **`!important` is not the fix** — the same two
WO-2.62 refused. **Do not centre `.attendance-report-row-head`**: names read down a left edge. **The
mark's own `text-align: center` is not the column's** — it centres a letter inside a chip, not the chip
inside the cell, so a check that reads `.attendance-report-mark` passes this defect.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.css`
  - `tools/verify-shell.mjs`
  - `tools/verify/report-alignment.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **WO-2.62's own record** — `.claude/dispatch/WO-2.62-result.md` and `TESTING.md` § WO-2.62. This is the same specificity tie, settled there for the number column; match its shape (selector form, comment style at the point of the fix, how the coarse block restates) rather than inventing a second one.
- **Where the rules are today** (line numbers as of dispatch): `src/attendance.css` ~1025 is the table-wide `th, td { text-align: left }`; ~1070/1073 the losing grid rules; ~1496–1497 their restatements inside `@media (pointer: coarse)`; ~1672 onward the `data-attendance-print` block, which sets grid padding and `.attendance-report-day { width: 6mm }` but no alignment — confirm that rather than assume it.
- **`tools/verify/report-alignment.mjs` already reads under emulated print media with each print gate set** (`GATES`, `Emulation.setEmulatedMedia`) and deliberately excludes the grid (`:not(.attendance-report-grid)`). Extend it to the grid; do not write a second harness file. The check must assert the **absolute** value (`center` for date heads and mark cells, `left` for the *Student* head and row heads) — agreement between head and cell is exactly what passed this defect. Read the `td`, not `.attendance-report-mark`.
- **The grid needs a populated *Day by day* tab to read** — find how the existing check opens the record and which fixture gives it rows with marks; an empty grid makes any per-cell assertion vacuous, so assert a nonzero count of cells read.
- **Mutation discipline**: revert the mutation before writing anything else, and before the doc pass. Grep your delivered files for `MUTATION` before you write the result file. `git diff src/attendance.css` must show only the intended selector change afterwards.
- If `tools/README.md` records a `check()` count or a section list for `report-alignment.mjs` or the harness total, update it in the same edit — the sweep goes red on a stale count.

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

## 5. Done means these 5 lines, reported against one by one

1. In the record's *Day by day* grid, every date head and every mark cell computes `text-align: center` and the *Student* head and row heads compute `left`, on screen and with `data-attendance-print` set.
2. With the mutation in place the check goes red; it is reverted, and `TESTING.md` § WO-2.63 shows the red output.
3. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
4. 👤 On the iPad, after a force-quit: the record's *Day by day* tab, each mark centred under its date.
5. `TESTING.md` § WO-2.63 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-2.63 — it is a deliverable, not a permission.** Add `### WO-2.63 — the day-by-day grid centres its marks under their dates` under `## Phase 2 — Attendance`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-2.63` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

