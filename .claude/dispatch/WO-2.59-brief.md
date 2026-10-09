# WO-2.59 — the attendance dialogs are as wide as they were meant to be, and the record has two tabs · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.59-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (spawned with no model override): the deciding signal is that
this is UI built from a mockup with three owner rulings still open at dispatch, plus a print gate
and teacher-facing prose (`TESTING.md`, `CHANGELOG.md`) — ROUTING § "Route to Claude". The runner-up
was Codex on the strength of "the widths are a one-line fix", set aside because the tab strip and
the print gate are judgment, not arithmetic.

**The three Open items — build them as drawn, and say so.** The owner has not ruled on them at this
dispatch. Build exactly what `design/mockups/attendance-dialogs.html` draws: the tabs in the class
screen switcher's look (`.screen-nav`), **By student** first, Keys at **640px**. In your result file,
list all three under a heading *"Built as drawn, owner's ruling still owed"* so the verifier and
the owner can see them. Do not tick an Acceptance line on the strength of one of them.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.59 — the attendance dialogs are as wide as they were meant to be, and the record has two tabs

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-09 · **Size** S · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-09.)*

**Booked 2026-10-09**, owner-directed, in the same sitting as WO-2.58. The owner asked for the
attendance screen's dialogs to be wider on the laptop and a landscape iPad, and for the Record to be
shorter. **Most of the length is a bug.** `.modal-panel` sets `width: 480px`;
`.attendance-report-panel` (Record, Passes, the history dialog) and `.grades-report-panel` (the
Scores screen's Grade sheet) set only `max-width` — 900 and 980 — so the cap never comes into play,
and all four have been 480px on every screen since they shipped. Their comments say *"this raises the
cap only"*, which is accurate and is the defect. `.assign-copy-panel { width: 880px }` is the shape
that works.

**Surface.** [`design/mockups/attendance-dialogs.html`](../../design/mockups/attendance-dialogs.html),
frames A to E, with `design/mockups/README.md` § "The attendance screen". Frame 0 is v174 as it
ships. Nothing here is in `proposed-attendance.css`: every change is to a class `src/` already
styles, so the frames set their widths inline.

**Rulings, the owner's, 2026-10-09**
1. **`width`, not `max-width`**: Record and Passes at 900px, the Grade sheet at 980. `.modal-panel`'s
   `95vw` still governs a narrow window. The Grade sheet is a Phase 3 dialog and rides here because it
   is the same one-line fix with the same check.
2. **Keys at 640px**, on a class of its own beside `.modal-panel`: it is prose, and prose past ~80
   characters a line reads worse.
3. **The Record in two tabs, By student and Day by day**, under the record's head.
4. **Print prints the tab on screen**, so the dialog stays the print preview it was built to be.
   **Download CSV saves everything**, both parts, exactly as it does today.

**Open — the owner's ruling, at dispatch.** The tabs are drawn in the class screen switcher's look
(`.screen-nav`); which tab opens first is drawn as By student; Keys at 640 is the drawing's guess.

**Deliverables**
- **`src/attendance.css`**: `width: 900px` on `.attendance-report-panel`, its comment rewritten; a
  new Keys panel class at 640; the tab strip's spacing.
- **`src/scores.css`**: `width: 980px` on `.grades-report-panel`, its comment rewritten.
- **`src/attendance-report.js`**: `openRecord()` draws the tab strip and one part at a time; the tab
  is the module's own state, reset to the first tab on every open and never stored.
- **The print gate**: the attendance print block prints the part on screen and nothing else, and the
  printed header or caption says which part it is.
- **`index.html`**: the Keys dialog's panel class.
- **The harness**: `tools/verify/attendance-history.mjs`, `attendance-passes.mjs`, `grade-sheet.mjs`
  and `print-sheets.mjs` at least.
- **`TESTING.md` § WO-2.59**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] In a 1280px window under a fine pointer, Record and Passes measure 900px wide, the Grade sheet
      980 and Keys 640. In an 820px window each is no wider than 95vw. Mutation-proved against
      restoring `max-width` alone.
- [ ] The Record opens on its first tab; each tab shows its own part and only that; reopening the
      dialog returns to the first tab.
- [ ] Printing from either tab puts that part on paper and not the other. The CSV is byte-identical
      to v174's for the same document.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the laptop, print-preview both tabs; on the iPad lying down, after a force-quit, open all
      three attendance dialogs and the Grade sheet and read their widths.

**Traps** — **Do not drop the blocks of 24 dates**: they are what fits across a sheet, and the
screen shows the page breaks so the preview is a preview. **The CSV is not a preview** and does not
follow the tab. **If WO-2.60 has not landed, the history dialog widens too**, because it wears the
same class; that is expected, and WO-2.60 takes it off that class.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/README.md`
  - `design/mockups/attendance-dialogs.html`
  - `src/attendance-report.js`
  - `src/attendance.css`
  - `src/scores.css`
  - `tools/verify-shell.mjs`
  - `tools/verify/attendance-history.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `index.html` — `#attendanceKeysModal` (~line 4568) is the Keys dialog whose panel class changes.
- `src/shell.css` — `.modal-panel`'s `width: 480px` / `95vw`, which is what you are overriding.
- The `.assign-copy-panel { width: 880px }` rule (grep for it) — the shape the work order says works.
- `src/scores.css` § `@media print` (~line 1000+) and `src/attendance.css` § `@media print`
  (~line 1570+) — the print gates. `tools/verify/print-sheets.mjs` already drives them.
- `sw.js` — `CACHE`.

**Traps the orchestrator found while reading, which the work order does not name:**

- **There are two `max-width: 900px` rules for `.attendance-report-panel`, not one.** Line ~913 is
  the screen rule; line ~1441 sits inside the `(pointer: coarse)` block. The Acceptance measures
  "under a fine pointer", but the 👤 line reads widths **on the iPad** — a coarse pointer. Leave the
  coarse-pointer `max-width` in place and the iPad stays at 480px with every harness check green.
  Fix both, and assert the coarse-pointer width too if the harness can emulate it.
- **"Mutation-proved against restoring `max-width` alone"** means: put `max-width` back (dropping
  `width`) on each of the four panels in turn, run the check, watch it go red, revert. Mark each
  mutation in the tree with a `MUTATION` comment while it is live and **revert it before writing a
  single line of prose** (AGENTS.md § "If you were dispatched with a work order"). Record each
  mutation and which check went red in the result file.
- **CSV byte-identity** is checked against v174's output for the same document — capture the CSV
  from the tree *before* you change anything (or from `git stash`/HEAD), not from memory.
- **The tab is module state, reset on open, never stored** — no `localStorage`, no field on the
  document. A remembered tab is the same defect as a remembered calendar filter (CLAUDE.md).
- **Keep what you add short.** This brief is deliberately not an implementation; read the tree.

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

1. In a 1280px window under a fine pointer, Record and Passes measure 900px wide, the Grade sheet 980 and Keys 640. In an 820px window each is no wider than 95vw. Mutation-proved against restoring `max-width` alone.
2. The Record opens on its first tab; each tab shows its own part and only that; reopening the dialog returns to the first tab.
3. Printing from either tab puts that part on paper and not the other. The CSV is byte-identical to v174's for the same document.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
5. 👤 On the laptop, print-preview both tabs; on the iPad lying down, after a force-quit, open all three attendance dialogs and the Grade sheet and read their widths.

**Write `TESTING.md` § WO-2.59 — it is a deliverable, not a permission.** Add `### WO-2.59 — the attendance dialogs are as wide as they were meant to be, and the record has two tabs` under `## Phase 2 — Attendance`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-2.59` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

