# WO-3.75 — the notice says which score changed · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.75-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no tier override): routed on its own merits. The deliverable is
teacher-facing wording in the Record dialog, a lift of a ruled drawing (frame C), and it opens
`was` to a new reader, which § 28 of the sweep guards and which needs arguing. The runner-up was
Codex, because the wording is given verbatim and two harness runs fit the 20-minute cap. Ties go to
Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.75 — the notice says which score changed

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-31 · **Size** S · **Depends on** WO-3.74 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-23, from the closing-a-quarter thread.)*

**Read [WO-3.72](#wo-372--a-quarters-grades-can-be-recorded-and-the-engine-says-when-they-stop-matching) first**: the thread, the drawing and the rulings that bind all four are there.

**Surface.** [`design/mockups/closing-a-quarter.html`](../../design/mockups/closing-a-quarter.html),
frame **C**'s *What changed* box, and [`proposed-quarter.css`](../../design/mockups/proposed-quarter.css)
§ RECORD LIST's `.term-record-cause`.

**Deliverables**
- **Under the changed form's list, *What changed***: for each changed student, every score cell in
  the quarter written since the recording's `at`, as *Act 2 quiz (Exams): 4 → 9 of 10*. The value
  at recording time is the cell's latest version at or before that `at`, from its own `at` and `was`
  (WO-3.33). If `src/score-history.js` has no reader for a cell's value at a moment, add it there rather than walking the history a second way in this module.
- **When no score of the student's changed**, one line: *No score changed; a class setting did —
  weights, the letter scale or drop lowest.* Those settings keep no history, so it cannot say which.
- **A reader in `src/term-record.js`**, not arithmetic in the dialog.
- **A mutation**: make the reader drop the `was` value, show the check goes red, and revert it
  before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.75** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] A score changed after a recording appears under *What changed* with the assignment, its
      category, and the value at recording beside the value now.
- [ ] Two edits to one cell after a recording show one line, from the recorded value to the latest.
- [ ] A student whose grade moved only through a class setting gets the setting line.
- [ ] With the reader dropping the `was` value, the check goes red. The mutation is reverted, and
      `TESTING.md` § WO-3.75 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.75 carries these lines verbatim with the evidence for each.

**Traps** — **A score's history is merged in five-minute windows** (WO-3.33), so the recorded value
is the latest version at or before the recording, not the version before the newest. **Under a
projector the dialog is refused already**; this adds nothing that needs its own check.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/closing-a-quarter.html`
  - `design/mockups/proposed-quarter.css`
  - `src/score-history.js`
  - `src/term-record.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/term-record-view.js`: `termRecordModel()`'s `'changed'` form (around line 281) is where
  *What changed* attaches, and its header comment names WO-3.75 as the missing half. `src/shell.css`
  ~line 540 says `.term-record-cause` is not lifted yet. Lift it from `proposed-quarter.css`.
- The WO-3.72, WO-3.73, WO-3.74 and WO-3.77 sections of `plans/work-orders/phase-3-gradebook.md`, and
  `plans/closing-a-quarter.md`. These hold the rulings that bind this dialog.
- `tools/wo-sweep.mjs` § 28 (~line 3727), and **read it before you design the reader**. See trap 1.

### Traps the work order does not spell out (orchestrator's reading, so check each one against the tree)

1. **`was` has one reader, and the sweep enforces that.** `src/score-history.js`'s banner says
   *NOTHING READS `was` BUT THIS FILE*, and that the outside world gets only a boolean or a built
   card. § 28 refuses any export that is not on its `ALLOWED` list, and says that a new export is
   argued in that section's banner first. The work order tells you to add the value-at-a-moment
   reader in `score-history.js`, so this is sanctioned. Do it the way § 28 asks: argue the export in
   § 28's banner, add it to `ALLOWED`, and update the score-history banner's "one reader" paragraph
   so it names what the new reader hands out. `src/term-record.js` must not touch `was` itself.
   Its reader asks score-history.
2. **Compare instants, not strings.** Every `at` is a local ISO stamp with an offset, from
   `localStamp()`. US daylight saving ends on 2026-11-01, so a recording made before it and an edit
   made after it carry different offsets, and comparing them as strings can misorder them by up to an
   hour. Pick a single way to compare them, and say in `TESTING.md` which one you used.
3. **A merge window can straddle the recording.** Suppose a cell is written at T−1 min, the
   recording is made at T, and the cell is written again at T+2 min. The second write replaces the
   first and pushes nothing, so no version at or before T survives. The same is true of a cell with
   no `at`, written before WO-3.33. Decide what that line says, then say what you decided in
   `TESTING.md`. Do not invent a recorded value. A gap you state openly is acceptable. A fabricated
   "4 →" is not.
4. **A cell can end where it began.** For example, 4 → 9 → 4 across more than five minutes. Say
   whether that cell gets a line. The setting line's condition is that none of the student's scores
   changed, so this cell's answer decides which line that student gets.
5. **Held columns.** A held column counts toward nothing (`isHeld()`, never `.held`, CLAUDE.md), and
   its history is not kept until Commit. Decide whether a held cell can appear under *What changed*,
   and test the decision.
6. **The mutation is live code.** Revert it before you write anything else, then
   `grep -rn MUTATION` the tree before you report. Two earlier dead dispatches shipped a mutation
   that this grep would have caught.

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

1. A score changed after a recording appears under *What changed* with the assignment, its category, and the value at recording beside the value now.
2. Two edits to one cell after a recording show one line, from the recorded value to the latest.
3. A student whose grade moved only through a class setting gets the setting line.
4. With the reader dropping the `was` value, the check goes red. The mutation is reverted, and `TESTING.md` § WO-3.75 shows the red output.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
6. `TESTING.md` § WO-3.75 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.75 — it is a deliverable, not a permission.** Add `### WO-3.75 — the notice says which score changed` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.75` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

