# WO-3.58 — the dialogs behind the Assignments and Scores screens are read together, and a layout is ruled · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.58-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override): this is a design review whose deliverables are a drawing, an owner-ruled layout rule written up in teacher-facing prose, and booked build rows — judgment about what the spec should be (ROUTING § "Route to Claude": teacher-facing prose, judgment traps; convention-setting for every dialog in scope). Codex set aside: nothing here is mechanically checkable and nothing in `src/` moves.

**Owner rulings already taken at dispatch (2026-10-12) — record them, do not re-open them.**
- **Scope confirmed: exactly the ten dialogs** listed in the work order (`assignmentModal`, `assignmentMoveModal`, `holdModal`, `assignmentCopyModal`, `assignmentDeleteModal`, `categoriesModal`, `gradingModeModal`, `categoryRemoveModal`, `letterScaleModal`, `gradesRecordModal`). Nothing added. `scoresKeysModal` and the past-due banner stay out.
- **Acceptance line 2, the rule: option A.** *A dialog's messages — refusals, warnings, notes — draw ABOVE its buttons, in one place, for every dialog in scope.* First case: the editor's *needs a name* refusal moves from under the buttons to just above Cancel/Save. **Not "beside the field."** Write it into the work order as the owner's ruling, dated 2026-10-12, and draw every "proposed" frame under it.

**One case the owner has NOT ruled.** WO-3.57's ruling 4 hands this review the Scores screen's blank-close amber warning (set on the Assignments list's note, which the grid does not draw). That is a screen, not a dialog, so rule A does not settle it. Draw a proposal, write it as a **proposal awaiting the owner**, and say so in your report — do not write it up as ruled.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.58 — the dialogs behind the Assignments and Scores screens are read together, and a layout is ruled

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** M · **Depends on** WO-3.54, WO-3.55, WO-3.57, WO-1.77
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11**, out of WO-3.56's iPad reading. The editor's *needs a name* message draws
**under the dialog's buttons**, where it is easy to miss. The owner accepted that for WO-3.56 and
asked for the dialogs to be reviewed together instead of patched one at a time. They have each grown
a work order at a time, so a message, a note or a warning lands wherever that work order put it.

**This is a review, not a build.** It produces a drawing and rulings, and books the build as M or S
rows. Nothing in `src/` moves here.

**Why it waits for three rows.** WO-3.54 and WO-3.55 change the list the editor opens from, and
WO-3.57 may move where the nameless warning shows. Reviewing before them would mean drawing dialogs
that are about to change. **WO-3.57 hands it one case** (its ruling 4): a blank close from the Scores
screen's `+ New assignment` sets the amber warning on the list's note, which the grid does not draw.
Where that warning goes on the Scores screen is this review's to rule. **If any of those three ends up changing a dialog's layout, that change is
input to this review, not a reason to start it early.** Read what they changed before drawing.

**It also waits for WO-1.77**, added 2026-10-11, which gives the editor and its neighbours a
ruled width. Drawing them at 480 first would mean drawing a dialog about to get wider.

**Scope.** The dialogs reached from the Assignments and Scores screens. From `index.html` that is at
least `assignmentModal`, `assignmentMoveModal`, `holdModal`, `assignmentCopyModal`,
`assignmentDeleteModal`, `categoriesModal`, `gradingModeModal`, `categoryRemoveModal`,
`letterScaleModal` and `gradesRecordModal`. **The owner confirms the list at dispatch**: add any
that are missing and drop any that are out.

**Deliverables**
- A drawing in `design/mockups/` under `PROTOCOL.md`, one frame per dialog as it is now and as
  proposed. It shows where each message, note and warning sits relative to the buttons.
- One rule, owner-ruled, for where a dialog's messages go. The first case is the editor's refusal:
  above its buttons, or beside the field it is about.
- The build booked as M or S rows at the foot of this file and the running order, each naming the
  dialogs it touches.
- **`TESTING.md` § WO-3.58**, the `CHANGELOG.md` entry.

**Acceptance**
- [ ] Every dialog in the confirmed scope has a frame as it is now, showing where its messages draw.
- [ ] The rule for where messages go is written here as the owner's ruling, with the editor's
      refusal as its first case.
- [ ] The build is booked as rows below L, and the drawing passes `wo-sweep.mjs` § 19.

**Not in scope** — building any of it, and the dialogs outside this scope (attendance, roster,
settings), which have their own work orders. **Nor the Scores Keys dialog** that
[`design/mockups/scores-tidy.html`](../../design/mockups/scores-tidy.html) frame D proposes — the
owner, 2026-10-11: it is a read-only list with a ✕ and no message, note or warning to place, like
its twin on Attendance, so neither row waits on the other.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/scores-tidy.html`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `design/mockups/PROTOCOL.md` and `design/mockups/README.md` — the drawing's rules (two stylesheets, `src/shell.css` linked never copied, no JS, the black band, a pending section styling nothing `src/` already styles). § 19 of `wo-sweep.mjs` is the half a grep settles.
- `index.html` (the ten modals' markup) and the `openModal()` callers that set their messages: `src/assignments.js`, `src/held-column.js`, `src/grades-report.js`, `src/categories.js`, `src/grading-mode.js`, `src/letter-scale.js`. The "as it is now" frames must match where the code actually draws each message — read it, do not infer it from markup alone (some messages are injected at runtime).
- The landed records of WO-3.54, WO-3.55, WO-3.57 and WO-1.77 in the phase files and `TESTING.md` — the input this review waited for (WO-1.77 ruled the dialogs' width; draw at that width, not 480).
- `.claude/dispatch/WO-3.58-status.md` — how scope and rule were settled.

**Booking the build.** Rows go at the foot of `plans/work-orders/phase-3-gradebook.md` and into the running order in `plans/work-orders/README.md`; each M or S (never L), each naming the dialogs it touches, `⬜ NOT STARTED`, depending on WO-3.58. Run `node tools/wo-gate.mjs --audit` after booking.

**Traps.** Nothing in `src/`, `index.html` or `sw.js` moves — if you find a bug, book it. Leave `CHANGELOG.md` to the teacher. Do not tick Acceptance line 2 unless the ruling text you wrote is the owner's words above, not a paraphrase that widens them.

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

## 5. Done means these 3 lines, reported against one by one

1. Every dialog in the confirmed scope has a frame as it is now, showing where its messages draw.
2. The rule for where messages go is written here as the owner's ruling, with the editor's refusal as its first case.
3. The build is booked as rows below L, and the drawing passes `wo-sweep.mjs` § 19.

**Write `TESTING.md` § WO-3.58 — it is a deliverable, not a permission.** Add `### WO-3.58 — the dialogs behind the Assignments and Scores screens are read together, and a layout is ruled` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.58` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

