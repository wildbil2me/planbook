# WO-3.67 — WO-3.66's no-roster check passes with the Scores screen's own paint deleted · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.67-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus** (no model override), on its own merits: the deliverables include `TESTING.md` and `CHANGELOG.md` prose (ROUTING § "Route to Claude", teacher-facing prose), and the Traps carry a judgment stop — a red check *before* the mutation is a defect in `src/scores.js` to report, not a fixture to adjust. Runner-up set aside: Codex — harness-only, mechanically checkable, and two verify-shell runs (~9 min) fit the 20-min cap — but the prose deliverables and the stop-and-report trap put it in the Claude column.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.67 — WO-3.66's no-roster check passes with the Scores screen's own paint deleted

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** XS · **Depends on** WO-3.66 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12**, owner-directed, out of [WO-3.66](#wo-366--a-nameless-close-from-the-scores-screen-shows-its-warning-on-the-scores-screen)'s
verdict. A ride-along on `tools/verify/copy-class.mjs`: fold it into the next sitting that has that
file open.

**Why it exists.** WO-3.66's verifier deleted the Scores screen's call that paints the list's note
and re-ran the harness. Acceptance lines 1–3 went red; **line 4 — a class with no roster still draws
the note on Scores — stayed green.** Its fixture closes a blank editor from the *assignment list*,
then taps the Scores pill, and the list's paint already fills **both** hosts from `src/list-note.js`,
so the Scores host is full before Scores renders at all. The check proves where the line sits on a
no-roster screen and that `#scoresTop` is hidden around it; it does not prove that **Scores' own
render** draws it. That render is the one that runs when a teacher reaches a no-roster class's Scores
any other way — from home, from another class — and the one that must clear a note left by another
class.

**Deliverables**
- **The line-4 check reaches Scores by a route that empties the host first**: after the blank close on
  the list, visit another class's Scores screen (whose render empties the host), then come back to the
  no-roster class's Scores from home. The existing assertions stay as they are.
- **A mutation**: delete Scores' paint call, show the reworked check go red, and revert it before
  writing anything else.
- **`TESTING.md` § WO-3.67** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] WO-3.66's no-roster check reaches the no-roster class's Scores screen after another class's
      Scores has painted the host, and still passes.
- [ ] With Scores' call to the note's paint deleted, that check goes red. The mutation is reverted, and
      `TESTING.md` § WO-3.67 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.67 carries these lines verbatim with the evidence for each.

**Traps** — **There is no `+ New assignment` on a no-roster Scores screen**: it lives in `#scoresTop`,
which that state hides, so the note can only arrive from the list. Do not build a door to make the
fixture easier. **If the reworked route goes red before the mutation**, that is a defect in
`src/scores.js` and not in the fixture — stop and report it rather than adjusting the check. **Nothing in
`src/` moves** if it passes, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/list-note.js`
  - `src/scores.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/copy-class.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **Where to look.** The check to rework is `tools/verify/copy-class.mjs` § "Acceptance 4: a class with no roster" (around line 1864; the `check(...)` near line 1882). The paint call the mutation deletes is `paintListNote()` in `src/scores.js` (around line 1220). Read `src/list-note.js`'s header for why both hosts are filled by the list's paint — that is exactly why the current check cannot fail.
- **Traps worth stating plainly.** (1) The mutation must be reverted **before writing anything else** — label it with a `MUTATION` comment while it is in, and `grep -rn MUTATION src tools` must be empty before you write `TESTING.md` (AGENTS.md § "If you were dispatched with a work order"). (2) Confirm the detour actually empties the Scores host — assert it, rather than assume it — or the reworked check is the same vacuous check by a longer road. (3) Arrive back at the no-roster class's Scores **from home**, per the Deliverable; do not add a door. (4) Nothing in `src/` should be in your final diff; if it is, you have left the mutation in.
- **Owed in the result file:** the red output from the mutated run (quoted), the green run's summary line, the sweep's summary line, and your draft `CHANGELOG.md` entry.

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

## 5. Done means these 4 lines, reported against one by one

1. WO-3.66's no-roster check reaches the no-roster class's Scores screen after another class's Scores has painted the host, and still passes.
2. With Scores' call to the note's paint deleted, that check goes red. The mutation is reverted, and `TESTING.md` § WO-3.67 shows the red output.
3. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
4. `TESTING.md` § WO-3.67 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.67 — it is a deliverable, not a permission.** Add `### WO-3.67 — WO-3.66's no-roster check passes with the Scores screen's own paint deleted` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.67` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

