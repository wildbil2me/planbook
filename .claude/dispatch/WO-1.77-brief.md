# WO-1.77 — every dialog is as wide as it was ruled, and 480 is for confirms · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.77-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override): this work order *establishes a convention* — three named dialog kinds, a style-guide rule a future dialog is written against, and a harness rule that enforces it — and its Traps are judgment, not mechanics (`width` never `max-width`; a kind names what a dialog is, not how wide; read each form for unused room and report rather than restyle). The runner-up was Codex, since the owner has already ruled every row and the CSS is mechanical; set aside because the convention and its prose are the deliverable, and one clean run plus two planted-fault runs (~13 min) sits close to the Codex cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.77 — every dialog is as wide as it was ruled, and 480 is for confirms

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-11 · **Size** M · **Depends on** WO-1.76 · **Blocks** WO-3.58
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11**, owner-directed, from a conversation about modals that "continue to feel too
narrow for their content." The owner named two: **the assignment editor**, which is the one they hit
most recently, and **About Planbook**, which is "very narrow given how much text it has."

**Why one work order and not two more WO-1.76s.** `.modal-panel` sets `width: 480px` for every
dialog (`src/shell.css`). Six have been widened one at a time, each as a separate work order after the
owner hit the problem on hardware: Grade sheet 980; Attendance record and Hall passes 900;
Duplicate 880; Keys and Roster 640. **Thirty-two are still at 480**, and none of them was given that
width on purpose. 480 is Roll Call!'s *standard* modal. Roll Call! itself had four sizes: standard 480,
Settings 660, student report 640 and report 700 (its `design/portable-components.md` § 5). Settings
here is 480, so it departs from the "lift the design with the function" rule without a note saying so.
**Nothing in this repository says when a dialog gets more room**, so every narrow dialog is found by
a teacher instead of by a rule.

**What this work order produces is three kinds of dialog, each with its own width.** Each dialog
records its kind in its markup, so the next person to add or edit one can see it:
- **`modal-confirm`, 480.** A question and its buttons, or a few lines of prose with one action.
  The WO-1.76 comment stands: "a confirm at 640 is a sentence across a laptop."
- **`modal-form`, 640.** Fields side by side, rows of names, and prose longer than a
  paragraph. This is the Keys argument from WO-2.59: prose much past 80 characters a line reads worse,
  and prose at 480 wraps too soon.
- **`modal-report`, 900.** A record, a sheet or a grid of classes, wide enough for a table. The
  Attendance record and Hall passes are 900 already. **Duplicate joins them at 900, up from 880**
  (owner, 2026-10-11). 880 was the narrowest its four columns fit, a floor and not a ruling, and
  nothing asserts it. Its fold is a *window* breakpoint at 920 (`src/assignments.css`), and below a
  ~947px window the panel is 95vw at either width, so the fold is untouched.

**A dialog may override its kind's width only with a class of its own and a comment saying why.**
The Grade sheet stays at 980 this way, and is the only override. An override is visible beside the kind
it departs from, rather than replacing it.

**The fallback is two layers.** `.modal-panel` stays at 480, so a dialog someone forgets to classify
draws as a confirm. That is the narrowest and least surprising width, and it is what every dialog
draws at today. **The harness also fails a `.modal-panel` that carries no kind, or more than one**, so
the forgotten class is caught before deploy rather than found by a teacher. The default is a safety
net, and the check is the rule.

**The classification, every dialog ruled by the owner on 2026-10-11.** Eight were close calls, and the
owner looked at each in the app before ruling it; they are marked *(read)*.

| Kind | Dialogs |
|---|---|
| **form, ruled** | `assignmentModal`, `aboutModal`, `outreachModal` (named by the owner; Draft an email is 640, not a wider override) · `settingsModal`, `yearModal`, `classesModal`, `termsModal`, `categoriesModal`, `letterScaleModal`, `signalsModal`, `rosterPasteModal`, `rosterImportModal`, `studentModal`, `daysOffModal`, `eventsModal` · *(read)* `signalCardModal`, `attendanceHistoryModal`, `logSheetModal`, `backupModal` |
| **confirm, ruled** | `classDeleteModal`, `categoryRemoveModal`, `outreachConfirmModal`, `assignmentMoveModal`, `holdModal`, `assignmentDeleteModal`, `studentDeleteModal`, `restoreConfirmModal`, `daysOffConfirmModal` · *(read)* `teacherModal`, `drivePullModal`, `drivePullConfirmModal`, `gradingModeModal` |
| **Already ruled, width unchanged** | report: `attendanceRecordModal`, `passHistoryModal` (900) · report, width 880 → 900: `assignmentCopyModal` · report with override: `gradesRecordModal` (980) · form: `rosterModal`, `attendanceKeysModal` (640) |

**Questions at dispatch, for the owner**
1. **The table.** Rule each "proposed" row. The owner may know a dialog better than its markup
   suggests; `teacherModal` and `backupModal` are the closest calls.

**Deliverables**
- **`src/shell.css`**: `.modal-confirm`, `.modal-form` and `.modal-report`, each a `width` and
  **not** a `max-width`, restated in the `pointer: coarse` block as `.roster-panel` is. The
  `(max-width: 640px)` block still puts every panel at 95vw on a phone. **`.modal-panel` itself stays
  at 480** as the fallback. `.roster-panel`, `.attendance-keys-panel` and `.attendance-report-panel`
  become the kind they already measure. Move their ruling comments to the kind or to the dialog's
  markup rather than losing them. `.assign-copy-panel`'s width goes; the class stays if its other rules hang on it.
  `.grades-report-panel` stays as the one override.
- **`index.html`**: exactly one kind class on every `.modal-panel`, as the owner rules.
- **`design/style-guide.md` § 5**: the three kinds, what decides each, the override rule and the
  fallback. A new dialog then has a place to look before it is written.
- **The harness**: every `.modal-panel` in `index.html` carries exactly one kind. Each one measures its
  kind's width, or its override's, at a 1280px viewport and on an iPad viewport lying down. Nothing is
  wider than 95vw at 390×844. A dialog the harness opens that is built at runtime, rather than in
  `index.html`, is held to the same rule. **`tools/verify/roster-width.mjs`
  Acceptance 3** ("every stock `.modal-panel` measures 480") becomes false on purpose. Move it into the
  new check rather than deleting it, and say so in its header.
- **`TESTING.md` § WO-1.77**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] Every `.modal-panel` carries exactly one of `modal-confirm`, `modal-form` and `modal-report`, as
      the owner ruled. Each measures its kind's width, or its named override's, at a 1280px viewport
      and on an iPad viewport lying down. None is wider than 95vw or overflows horizontally at 390×844.
- [ ] The harness fails a `.modal-panel` with no kind and one with two kinds. Each is proved by a
      planted fault, and with the class removed the dialog still draws at 480.
- [ ] `design/style-guide.md` § 5 states the three kinds, what decides each, the override rule and the
      fallback.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] `TESTING.md` § WO-1.77 carries these lines verbatim with the evidence for each.
- [ ] 👤 On the iPad, after a force-quit, upright and lying down, the owner opens About, a new
      assignment, Draft an email, Settings and one ruled confirm and reads each at its width. Any kind
      the owner changes on that reading lands before this box is ticked.

**Traps** — **`width`, never `max-width`.** WO-2.59 found four dialogs that had asked for 900 with
`max-width` on top of the 480 base, so they had been 480 since they shipped. **Do not widen
`.modal-panel` itself**: it is the fallback, and a forgotten class should land on the narrowest width,
not the widest. **A kind names what a dialog is, not how wide it should be.** If a form needs 700,
that is an override with a comment, not a reason to call it a report. **`tools/verify/copy-class.mjs` asserts both sides of the 920 fold** — it must still pass with
the panel at 900; if it does not, the premise above is wrong, so report it rather than moving the
breakpoint. **Width only**: the assignment
editor's *needs a name* message draws under its buttons, and moving it belongs to WO-3.58, which this
work order runs before on purpose so that WO-3.58 draws the editor at its new width. Do not move any
message here. **The print rules** for the Record and the Grade sheet set their own `width: 100%` under
`body[data-…-print]`; leave them alone. **A form at 640 can leave its fields at 480's widths**, so a
wider panel with an empty right half has not fixed anything. Read each named dialog at the new width,
and report a field that does not use the room rather than restyling it here.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/style-guide.md`
  - `src/assignments.css`
  - `src/shell.css`
  - `tools/verify-shell.mjs`
  - `tools/verify/copy-class.mjs`
  - `tools/verify/roster-width.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/attendance.css` (`.attendance-keys-panel`, `.attendance-report-panel` and their coarse-block restatements) and `src/scores.css` (`.grades-report-panel`, line ~701 and its coarse restatement ~967, plus the print rules ~1074–1080 you must leave alone).
- `src/modal.js` — **About's panel is built here at runtime**, not in `index.html` (line ~8). It is the "dialog built at runtime" the Deliverables mean; it needs its kind (`modal-form`) in that template, and the harness must hold it to the rule too.
- Roll Call!'s `design/portable-components.md` § 5 (`C:/Users/WildB/OneDrive/Documents/Coding Projects/Attendance App`) — the four sizes this work order is departing from and citing. Read-only; Roll Call! is frozen.

**Orchestrator notes — the traps a cold reader would not guess.**
- **The table is fully ruled.** The work order's "Questions at dispatch" section was answered by the owner in commits `fd6a8f5` and `ebd4cef` — the table in § 1 above is final. Do not re-open a row. `index.html` has **38** `id="…Modal"` dialogs and the table names 38 plus About; reconcile the two before writing, and if a `.modal-panel` exists that the table does not name, **stop and report it** rather than classifying it yourself.
- **Cascade order is the bug this repo keeps re-finding.** `src/shell.css`'s `(max-width: 640px)` block sets `.modal-panel { width: 95vw }` and wins by coming later in the same file. A kind class defined *after* that block, or an override in a stylesheet loaded after `shell.css` with equal specificity, will beat the phone rule and blow past 95vw at 390×844. Put the kinds above the phone block and make sure the phone block still wins over every kind and over `.grades-report-panel` — measure it, don't reason it.
- **`tools/verify/roster-width.mjs` Acceptance 3 goes false on purpose** — move it, say so in its header; do not just delete it. `tools/verify/copy-class.mjs` must still pass at 900; if not, report it (Traps).
- **Mutations:** both planted faults (no kind; two kinds) are temporary edits. Mark each `MUTATION` in the source while it is in, revert it before writing anything else, and confirm `grep -rn MUTATION index.html src/ tools/` is empty before you report. Stage your own edits before any `git checkout` on a file you have changed.
- **`CACHE` bump in `sw.js`** is required (index.html and shell.css are in `SHELL`). Leave `CHANGELOG.md` to the teacher — draft the entry in your result file instead.
- Keep the scope to width: no message moves (WO-3.58), no field restyling. Name any form whose fields leave the right half empty at 640 in your result as a proposed follow-up.

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

1. Every `.modal-panel` carries exactly one of `modal-confirm`, `modal-form` and `modal-report`, as the owner ruled. Each measures its kind's width, or its named override's, at a 1280px viewport and on an iPad viewport lying down. None is wider than 95vw or overflows horizontally at 390×844.
2. The harness fails a `.modal-panel` with no kind and one with two kinds. Each is proved by a planted fault, and with the class removed the dialog still draws at 480.
3. `design/style-guide.md` § 5 states the three kinds, what decides each, the override rule and the fallback.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
5. `TESTING.md` § WO-1.77 carries these lines verbatim with the evidence for each.
6. 👤 On the iPad, after a force-quit, upright and lying down, the owner opens About, a new assignment, Draft an email, Settings and one ruled confirm and reads each at its width. Any kind the owner changes on that reading lands before this box is ticked.

**Write `TESTING.md` § WO-1.77 — it is a deliverable, not a permission.** Add `### WO-1.77 — every dialog is as wide as it was ruled, and 480 is for confirms` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.77` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

