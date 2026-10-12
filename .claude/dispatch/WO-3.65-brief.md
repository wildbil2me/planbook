# WO-3.65 — the grade sheet's warning and empty sentences draw above Print and CSV · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.65-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override), on its own merits: the deciding signal is the
print-block Trap — a new host outside `#gradesRecordBody` is a new element to the gated print rules in
`src/scores.css`, and whether it prints is a judgment the harness must then pin — plus the
teacher-facing prose it owes (`TESTING.md` § WO-3.65, the `CHANGELOG.md` entry). The runner-up was
Codex, since the build itself is a small markup move with mechanical checks; set aside, as it was for
its siblings WO-3.63 and WO-3.64, which are the conventions to match.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.65 — the grade sheet's warning and empty sentences draw above Print and CSV

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** S · **Depends on** WO-3.58
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12** out of [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled).
`gradesRecordModal` puts Print and Download CSV **first**, deliberately (its markup comment: the table
under them is a term long). Its messages are built by `openGrades()` into `#gradesRecordBody`, which
comes **after** the buttons: the `.grade-none` banner when the weights do not total 100, and one of
three `.grades-report-empty` sentences when no class is open, the roster is empty, or nothing is
assigned in the term. Under the rule, each draws above the buttons.

**Surface.** [`design/mockups/dialog-messages.html`](../../design/mockups/dialog-messages.html),
frame 10.

**Rulings, the owner's, 2026-10-12** (WO-3.58's ruling 2, carried) — a dialog's messages draw above
its buttons, in one place. Here "its buttons" are Print and CSV, at the top.

**Deliverables**
- **`index.html`**: an empty host for the sheet's messages before `.grades-report-actions` in
  `#gradesRecordModal`.
- **`src/grades-report.js`**: `openGrades()` puts the banner, the empty sentence, or both (banner
  first — ruling 1 below) into that host and empties it on every open; the head, the table, the key and the closing note stay in
  `#gradesRecordBody`, in their order.
- **The harness**: `tools/verify/grade-sheet.mjs` — with the weights at 95, the banner's bottom is
  above Print's top; with an empty roster, likewise the empty sentence; with neither, the host is
  empty and takes no height. And `tools/verify/print-sheets.mjs` — what prints is what printed
  before (the banner prints today).
- **`TESTING.md` § WO-3.65**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] With the weights not totalling 100, the no-grade banner draws above Print and Download CSV,
      and the sheet under them is otherwise unchanged.
- [ ] Each of the three empty states draws its sentence above the buttons, and the sentence does not
      also draw under them. With the weights off 100 as well, the banner sits above the sentence.
- [ ] A sheet with no message draws exactly as before: the host is empty and adds no space.
- [ ] The printed sheet is unchanged — the banner prints where it printed, first under the shared
      `#printHeader`.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.

**Ruled — the owner, 2026-10-12, before dispatch** *(two questions found reading this row against
the code; the proposals taken as written)*:
1. **The banner and an empty sentence can both show, and the host takes both, the banner first.**
   With the weights off 100 **and** an empty roster (or nothing assigned), `openGrades()` draws both
   today, in that order (`src/grades-report.js`, the `record.unbalanced` branch, then the roster
   check). The Deliverables read "the banner, or the empty sentence" until this ruling.
2. **"Nothing under them" meant the sentence, not the head.** In the empty-roster and
   nothing-assigned states `openGrades()` draws the sheet's head (`.grades-report-head`) into
   `#gradesRecordBody` before the sentence, and the head stays there. Acceptance line 2 is reworded
   to say so; read literally, the old wording failed a correct build.
3. **The print line closes on the build, not on a ruling.** The print block hides only the modal's
   header and `.grades-report-actions`, `body[data-grades-print] .grade-none` is not scoped to
   `#gradesRecordBody`, and the sheet's own head is already hidden on paper — so a host before the
   buttons prints exactly where the banner prints now, first under the shared `#printHeader`.
   Acceptance line 4's *"or the build says why not and the owner rules"* is dropped;
   `tools/verify/print-sheets.mjs` is what shows it. If it does not, that is a finding to bring back,
   not a line to re-widen.

**Traps** — **The print block in `src/scores.css`** hides `body > *` but the gated surface, and inside
it hides `.grades-report-actions` and `.grades-report-head`; a new host outside `#gradesRecordBody`
is a new element to that block. Check it prints, or is hidden, **on purpose**. **The key and the
closing note are the sheet, not messages** (WO-3.58's reading): they print, and they stay under the
table.

**Not in scope** — the attendance record (`attendanceReportModal`), which has the same shape and is
not in WO-3.58's scope; and the order of the head relative to the buttons.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/dialog-messages.html`
  - `src/grades-report.js`
  - `src/scores.css`
  - `tools/verify-shell.mjs`
  - `tools/verify/grade-sheet.mjs`
  - `tools/verify/print-sheets.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also open, and why.**
- **The siblings, landed today:** `git show 076ba24` (WO-3.63) and `git show 411a79e` (WO-3.64) —
  same owner's rule, same drawing. Match how they named and commented their message hosts, how
  their harness checks measured "above the buttons" (bounding rects, computed style), and how they
  wrote their `TESTING.md` sections. Their status/result files are in `.claude/dispatch/`.
- **`src/scores.css` lines ~1160–1245** — the `data-grades-print` block. `body[data-grades-print] .grade-none`
  is not scoped to `#gradesRecordBody`; the empty sentences' print rule may be (check it). Whatever
  the host's state, the printed sheet must be byte-for-byte the same order as today: banner first
  under `#printHeader`. Ruling 3 says this closes on the build; if `print-sheets.mjs` shows otherwise,
  **stop and report it as a finding**, do not widen the line.
- **`src/grades-report.js` ~lines 490–545** — the `record.unbalanced` branch and the three
  `.grades-report-empty` sentences (no class / empty roster / nothing assigned). Note the head is
  drawn into `#gradesRecordBody` *before* the sentence in two states and **stays there** (ruling 2).

**Traps worth naming beyond the work order's own.**
- "Takes no height" means an empty host contributes **0px** — no margin, no gap from the flex/stack
  around it. Measure it in the harness (the Print button's top with no message equals what it was
  before, or the host's rect height and margins are 0); don't assume `:empty`.
- The host must be emptied on **every** open, including the no-class early-return path — a stale
  banner from a previous class that stays above Print is the obvious regression. Check it.
- No mutation round is demanded by Acceptance, but if you run one, revert every mutation before
  writing anything else, and `grep -rn MUTATION` your delivered files before returning.
- `CACHE` in `sw.js` bumps once (it is v19x after WO-3.64 — read it, don't guess).
- Leave the untracked `plans/first-run.md` alone; it is not yours.

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

1. With the weights not totalling 100, the no-grade banner draws above Print and Download CSV, and the sheet under them is otherwise unchanged.
2. Each of the three empty states draws its sentence above the buttons, and the sentence does not also draw under them. With the weights off 100 as well, the banner sits above the sentence.
3. A sheet with no message draws exactly as before: the host is empty and adds no space.
4. The printed sheet is unchanged — the banner prints where it printed, first under the shared `#printHeader`.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.

**Write `TESTING.md` § WO-3.65 — it is a deliverable, not a permission.** Add `### WO-3.65 — the grade sheet's warning and empty sentences draw above Print and CSV` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.65` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

