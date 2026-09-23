# WO-8.14 — the three doc links in About are measured by nothing · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.14-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to **Claude, Opus tier**. The deciding signal is Acceptance
line 2: a *mutate · run · revert* on `src/shell.css`, which `ROUTING.md` § "Route to Codex"
excludes by name — a run killed at the cap leaves a broken stylesheet in the tree with nobody
watching. Opus rather than a Sonnet fallback because the work order is Claude-column on its own
merits: the `TESTING.md` line it owes must *link back* to WO-8.13's correction rather than restate
it, which is prose judgment. Set aside: everything else about this reads Codex — one existing sweep
widened, a named selector, mechanically checkable output.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.14 — the three doc links in About are measured by nothing

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-22 · **Size** S · **Depends on** nothing
**Closes roadmap** *(no box. A harness gap, the same call WO-8.9 made: this is the project checking
something it already claimed rather than a feature the roadmap costed. Booked 2026-09-21 out of
WO-8.13's landing, owner-directed.)*

**Why it exists.** `src/shell.css` carries `.modal-body .doc-link { min-height: 44px; … }` inside its
`(pointer: coarse)` block, and three rows in the About modal depend on it: the privacy policy, the
FERPA document, and — since WO-8.13 — the licence. **No tool has ever measured any of them.** Every
modal sweep in `tools/verify/touch-targets.mjs` selects `button, input` (a few widen to
`select, textarea`), a `.doc-link` is an `<a>`, and the string `doc-link` does not appear in that
file at all. The rows fall outside the sweep by construction, not by an oversight in one selector.

**What that costs, stated plainly:** deleting that one declaration from the coarse block leaves all
1446 checks green and puts three sub-thumb targets in the modal a teacher opens to find the privacy
policy. The 44px rule under `@media (pointer: coarse)` is a stated convention of this project
(`CLAUDE.md` § Conventions), and this is the third seam where it is load-bearing and unasserted.

**It was found by a false sentence, and that is worth recording.** WO-8.13's Acceptance line 3
contains the parenthetical *"`touch-targets.mjs` measures the row, not the gap"* — written into the
work order on 2026-09-20 to explain why the row needed no new check. It was false when it was
written. The criterion it sat on was still honestly met, so the line is ✅; what the clause was
doing was assuring a reader that a regression here would be caught. **A work order's own reasoning
is not a fence**, and this is the instance to point at next time one is read as one.

**Deliverables**
- **One `.doc-link` measurement under a coarse pointer**, reading **every** `.doc-link` in the About
  modal rather than the licence row alone — the shape WO-8.13's own harness check used, and for the
  same reason: all three rows are unasserted, and one selector closes all three.
- **It goes in `tools/verify/touch-targets.mjs`**, in the modal sweep that already opens
  `#aboutModal`, widened to reach anchors. Do not add a section to open that modal a second time.
  *(`tools/verify/build-line.mjs` also opens it and is where WO-8.13's checks live — this one is a
  measurement under an emulated coarse pointer, which is `touch-targets.mjs`'s whole apparatus, so
  it goes there even though the neighbouring assertions about these rows do not.)*
- **`tools/README.md`'s check count updated** to whatever the run emits.
- **A `TESTING.md` line of its own.** No 👤: this is a measurement a headless browser makes better
  than a thumb, which is the point of closing it.

**Acceptance**
- [ ] Every `.doc-link` in the About modal is measured at ≥44px under an emulated coarse pointer —
      all three rows, named individually in the evidence line, not counted in aggregate.
- [ ] The check goes **red** when `min-height: 44px` is deleted from `.modal-body .doc-link` in the
      `(pointer: coarse)` block — proved by deleting it once, not by reasoning about it, and
      restored before anything is written.
- [ ] `node tools/verify-shell.mjs` green, and `node tools/wo-sweep.mjs` green with its own recorded
      count matching the run.
- [ ] `tools/README.md`'s check count matches the run.
- [ ] WO-8.13's Acceptance line 3 and its `TESTING.md` entry both already carry the correction; this
      work order's `TESTING.md` line **links back to them** rather than restating the story.

**Traps** — **Widen the existing sweep; do not write a second one.** The modal sweeps in
`touch-targets.mjs` share one shape and one evidence format, and a parallel anchor sweep beside them
is a second opinion about the same question — the defect `CLAUDE.md` § glance-reader names in
general terms. **Measure, do not read the sheet.** Asserting that the declaration exists in
`src/shell.css` is a grep and belongs in `wo-sweep.mjs` if anywhere; what is missing here is a
*computed* height on a real element under a coarse pointer, which is the only thing that survives
the rule being overridden by something later in the cascade. **Do not widen to every `<a>` in every
modal.** The claim being closed is about `.doc-link`, three rows, one declaration; a sweep of every
anchor in the app will find link text that is legitimately inline prose and turn a fence into a
backlog. **The 28px month chip is not a precedent here** — that departure is ruled and asserted *as*
a departure in `src/calendar-view.css`, and these rows have no such ruling.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/calendar-view.css`
  - `src/shell.css`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/build-line.mjs`
  - `tools/verify/touch-targets.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Where the pieces are, so you do not have to find them.**

- `tools/verify/touch-targets.mjs` — the About-modal sweep is the block around lines 385-413,
  selecting `.modal-overlay:not(.hidden) button, .modal-overlay:not(.hidden) input`. That is the
  sweep the Deliverables mean by "widened to reach anchors". Its `check()` count is machine-read;
  the file says so around line 698.
- `tools/verify/build-line.mjs:150` — `modal.querySelectorAll('.doc-link')`, WO-8.13's
  read-every-row shape. Copy the **selector idea** from it. Do **not** put the measurement there;
  the work order rules on that explicitly and gives the reason.
- `src/shell.css:1885` — `.modal-body .doc-link { min-height: 44px; ... }` inside the
  `(pointer: coarse)` block. This is the one declaration Acceptance line 2 deletes and restores.
- `index.html:2070-2101` — the three rows: privacy policy, FERPA, licence.

**Three traps that are not in the work order text.**

1. **Revert the mutation before you write anything else** (`AGENTS.md` § "If you were dispatched
   with a work order"). Two dispatches in this project's history died holding a live mutation and
   delivered a broken tree under ticked boxes. When you are done, run `grep -rn MUTATION` over
   what you touched and confirm it is empty — and say so in your result file.
2. **A `git checkout` of a mutated file reverts your own unstaged edits in that file too.** Restore
   `src/shell.css` by writing the line back, or stage first — do not blanket-checkout.
3. **If `node tools/verify-shell.mjs` cannot run in your environment, that is an environment
   report, not a result** — say so plainly and leave the box open rather than reasoning the run
   green. Same for the mutation proof: reasoning about red is exactly what Acceptance line 2
   forbids.

**Report**, as your last act, to `.claude/dispatch/WO-8.14-result.md`: what you changed by path,
the evidence line naming all three rows individually, the before/after of the mutation round, the
harness and sweep totals, and anything you could not close.

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

## 5. Done means these 5 lines, reported against one by one

1. Every `.doc-link` in the About modal is measured at ≥44px under an emulated coarse pointer — all three rows, named individually in the evidence line, not counted in aggregate.
2. The check goes **red** when `min-height: 44px` is deleted from `.modal-body .doc-link` in the `(pointer: coarse)` block — proved by deleting it once, not by reasoning about it, and restored before anything is written.
3. `node tools/verify-shell.mjs` green, and `node tools/wo-sweep.mjs` green with its own recorded count matching the run.
4. `tools/README.md`'s check count matches the run.
5. WO-8.13's Acceptance line 3 and its `TESTING.md` entry both already carry the correction; this work order's `TESTING.md` line **links back to them** rather than restating the story.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

