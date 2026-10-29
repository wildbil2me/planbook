# WO-3.73 — Record Q1 grades: the dialog, and the bar on the class's screens · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.73-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override) — on its own merits, not by fallback. The deciding signal is the presentation-mode refusal (frame F), a sensitive surface that ROUTING.md never delegates; the bar and dialog wording is also new teacher-facing prose lifted from a drawing. Codex was not weighed further, so no probe was run; the mutation round (one clean run plus one mutation run, roughly 9 minutes) would have fit its cap, but that only matters for work already in the Codex column.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.73 — Record Q1 grades: the dialog, and the bar on the class's screens

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-26 · **Size** M · **Depends on** WO-3.72 · **Blocks** WO-3.74
**Closes roadmap** *(no box. Owner-directed, 2026-10-23, from the closing-a-quarter thread.)*

**Read [WO-3.72](#wo-372--a-quarters-grades-can-be-recorded-and-the-engine-says-when-they-stop-matching) first**: the thread, the drawing and the rulings that bind all four are there.

**Surface.** [`design/mockups/closing-a-quarter.html`](../../design/mockups/closing-a-quarter.html),
frames **A0, A, B, C (without *What changed*), D and F**, and
[`proposed-quarter.css`](../../design/mockups/proposed-quarter.css) § RECORD NAG and § RECORD LIST.
**Lift them rather than re-deriving them** (`PROTOCOL.md` § When the drawing lands), and amend both
banners in the same sitting.

**Deliverables**
- **The bar**, under the header where the backup nag sits and after it, on every screen of a class
  while one of its ended terms is unrecorded or no longer matches. Three wordings, each drawn:
  *Quarter 1 ends today…* on the end date (A0), *…has ended, and its grades… are not recorded* after
  it (A), and *…have changed since you recorded them on 2 Nov — 2 students* (D). No dismiss; it goes
  when a recording matches. **A count, never a name**, so it stays under a projector. Its button
  opens the dialog.
- **The dialog**, a stock 480px `.modal-confirm` (the owner, 2026-10-23), in two forms:
  - **first recording (B)**: every graded student in `gridOrder()`'s order, percentage and letter,
    scrolling inside the box; the empty-boxes line in the owner's words; a line naming any
    uncommitted held column; in a weighted class, a line counting scored work filed under no
    category, which is not in these grades; *Record Q1 grades* and *Not now*.
  - **after a change (C)**: only the students who changed, recorded beside now, a letter change bold
    and a percentage-only change quiet; *Record Q1 grades* records the whole class again; *Not yet*,
    the ✕ and Escape write nothing.
- **Refused in presentation mode (F)**: the dialog says it lists students and grades and names the
  control that turns presentation mode off, as the concern list does.
- **Every figure comes from WO-3.72's readers.** The screen computes nothing.
- **Uncategorized work in the empty-boxes count** (the owner, 2026-10-23, after WO-3.72's verifier
  found `emptyBoxes()` skips it — `plans/closing-a-quarter.md`, the drawing's answer 2). An empty box
  filed under no category counts **in either grading mode** and is named under *no category*, after
  the class's own categories. **The engine answers it, not `src/term-record.js`**: add a sibling
  reader beside `openWork()` for uncategorized work rather than widening `openWork()`, which feeds
  every projection, and the points projection already walks that pile on its own. The weighted
  dialog's *not in these grades* line comes from the engine in the same way.
- **A mutation**: make the dialog list unchanged students in the changed form, show the check goes
  red, and revert it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.73** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] On a term's end date the bar reads *ends today*; from the next day *has ended* until it is
      recorded; after a recorded change, *have changed* with the count. Before the end date there is
      no bar.
- [ ] The bar shows on all five of the class's screens and on no other class's.
- [ ] The first-recording dialog lists every graded student in grade-sheet order with the engine's
      figures, the empty-boxes line, and any uncommitted held column by name.
- [ ] An empty uncategorized box is counted and named under *no category* in a weighted class and
      in a points class; in a weighted class, scored uncategorized work gets its own *not in these
      grades* line; and no projection's figures move.
- [ ] *Record Q1 grades* writes one entry and the bar goes; *Not now*, *Not yet*, the ✕ and Escape
      write nothing.
- [ ] The changed form lists only the students who changed, recorded beside now.
- [ ] In presentation mode the bar names no student and the dialog refuses, naming the control.
- [ ] With unchanged students listed in the changed form, the check goes red. The mutation is
      reverted, and `TESTING.md` § WO-3.73 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] 👤 On the iPad, the bar and both forms of the dialog read clearly, and twenty-five rows scroll
      inside the dialog with its buttons in reach, in portrait and landscape.
- [ ] `TESTING.md` § WO-3.73 carries these lines verbatim with the evidence for each.

**Traps** — **The bar is copied from `.backup-nag`, not shared with it** (the reason `src/shell.css`
gives). **No screen re-runs the comparison**; a second opinion is how the bar and the dialog come to
disagree about who changed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/closing-a-quarter.html`
  - `design/mockups/proposed-quarter.css`
  - `plans/closing-a-quarter.md`
  - `src/shell.css`
  - `src/term-record.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, because this work order has to match their conventions:

- `plans/work-orders/phase-3-gradebook.md` § WO-3.72. That section holds the rulings that bind all four of WO-3.72 to WO-3.75: no lock, appends only, derived at read time, both percentage and letter compared, *Record Q1 grades* as the wording, and no names under a projector.
- `src/backup.js` plus the `.backup-nag` rules in `src/shell.css` and `index.html`. The bar sits after the backup nag and is a **copy, not a shared class** (see Traps).
- `src/signals-view.js`. The concern list's refusal under a projector is the model for frame F: it closes and names the control that turns presentation mode off. Use the same wording pattern, and take the presentation check from `src/presentation.js`. Do not write a second definition of it.
- `src/classes.js` (`CLASS_SCREENS`). "All five of the class's screens" means the entries in that list. The bar must not show on the calendar, the template editor or All classes, and the home bar is WO-3.74's job, not this one's.
- `src/grade-engine.js` around `openWork()` / `heldWork()` (lines ~307–360). The new uncategorized reader goes **beside** these two. `openWork()` itself must not change, and no projection's figures may move (Acceptance 4).
- `src/scores.js` `gridOrder()` gives the row order. `tools/verify/term-record.mjs` is WO-3.72's harness. Extend it or add a sibling, and register any new file in `verify-shell.mjs`.

**Traps not written in the work order:**

- **Mutation hygiene.** Revert the mutation before you write anything else, and stage your own edits before any `git checkout` of a file you are mutating. A checkout reverts unstaged work in that file. If you are killed, `grep -rn MUTATION` is the next session's first move, so tag the mutation line with that word.
- **Do not create a `termRecords` block** when the dialog only opens. Only `recordTerm()` writes, and *Not now*, *Not yet*, the ✕ and Escape must leave `rev` unchanged. `update()` schedules its save about 800ms later, so a "wrote nothing" check has to `flush()` before it compares (WO-5.3's blind spot).
- **No screen repaints on `notify()`.** After *Record Q1 grades* the bar has to go, so repaint it explicitly from the record path. Do not subscribe it to the store.
- **The date in wording D** ("recorded them on 2 Nov") comes from the record's `at`. Format it the way the app already formats dates. Do not parse it a new way.
- **Out of scope:** the leave-the-quarter notice and the home bar (WO-3.74), and *What changed* (WO-3.75). The changed form here has no cause box.
- **Commit nothing.** Leave the tree for the verifier.

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

## 5. Done means these 11 lines, reported against one by one

1. On a term's end date the bar reads *ends today*; from the next day *has ended* until it is recorded; after a recorded change, *have changed* with the count. Before the end date there is no bar.
2. The bar shows on all five of the class's screens and on no other class's.
3. The first-recording dialog lists every graded student in grade-sheet order with the engine's figures, the empty-boxes line, and any uncommitted held column by name.
4. An empty uncategorized box is counted and named under *no category* in a weighted class and in a points class; in a weighted class, scored uncategorized work gets its own *not in these grades* line; and no projection's figures move.
5. *Record Q1 grades* writes one entry and the bar goes; *Not now*, *Not yet*, the ✕ and Escape write nothing.
6. The changed form lists only the students who changed, recorded beside now.
7. In presentation mode the bar names no student and the dialog refuses, naming the control.
8. With unchanged students listed in the changed form, the check goes red. The mutation is reverted, and `TESTING.md` § WO-3.73 shows the red output.
9. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
10. 👤 On the iPad, the bar and both forms of the dialog read clearly, and twenty-five rows scroll inside the dialog with its buttons in reach, in portrait and landscape.
11. `TESTING.md` § WO-3.73 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.73 — it is a deliverable, not a permission.** Add `### WO-3.73 — Record Q1 grades: the dialog, and the bar on the class's screens` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.73` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

