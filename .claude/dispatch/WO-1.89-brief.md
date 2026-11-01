# WO-1.89 — cooldown-quiet.mjs sometimes finds no class tab to click · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.89-result.md` — as your last act, and return it in-band too.

**Routing — Claude Opus.** The deciding signal is the proof budget: the Acceptance demands three
consecutive full `verify-shell.mjs` runs (the work order puts them at ~20 min each), which is far past
Codex's 20-minute whole-dispatch cap before any reading or writing, and the work is a diagnosis whose
Traps are judgment ("a longer sleep is not a fix", "do not make the click non-fatal") plus
`TESTING.md` prose. The runner-up was Codex on the grounds that this is harness-only plumbing with no
sensitive surface; set aside on the arithmetic alone, and since it sits in the Claude column on its
own merits the tier is Opus, not a Sonnet fallback.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.89 — cooldown-quiet.mjs sometimes finds no class tab to click

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-01 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.88 made.)*

**Booked 2026-11-01**, owner-directed, out of [WO-3.70](phase-3-gradebook.md#wo-370--the-student-report-lists-excused-work-with-any-score-it-kept)'s
verdict. On the real tree the verifier's `node tools/verify-shell.mjs` was red twice and then green,
with no file moving between runs. Both red runs ended `2158 checks · … · 1 failed` when
`verify/cooldown-quiet.mjs` threw `nothing to click for #homeGrid [data-class-tab="c_wo45"] [0]`. That
lost the rest of the section's checks, so 18 never ran. The third run read
`2176 checks · 2176 passed`, and an exact copy of the tree passed twice. WO-3.70 does not touch the
section. Its new section, `verify/excused-report.mjs`, runs earlier and leaves the page on the student
report, so it may make the flake likelier and is not ruled out. A harness that fails one run in three
for no reason teaches its reader to re-run instead of read. That is the opposite of what WO-1.44's
containment was built for.

**Deliverables**
- **Find the cause before changing anything**, and record it in `TESTING.md` § WO-1.89. The
  candidates the verifier's evidence leaves open:
  - `openSignals45()` clicks the class card after a fixed 250 ms wait from `goHome45()`, or after a
    fixed 600 ms wait from `Page.reload` plus `waitForBoot()`, so the home grid may not have been
    painted with the planted class yet.
  - The page an earlier section leaves behind (WO-3.70's student report among them) changes what
    `goHome45()` finds visible.
  - The fixture's reload races the store's flush.
  Reproduce it on demand if possible, for example by repeating or reordering the section, and say
  how often it fails before and after.
- **Fix it in the harness, not in `src/`.** Wait on the condition the click needs, the planted
  class's card present in `#homeGrid`, rather than on a longer sleep. If the cause is a leftover page
  state, the section establishes its own starting state, the way its two reloads already argue for.
- **If the cause is in `src/`**, stop and report rather than fixing it here. A home grid that
  sometimes misses a class a teacher has would be an app defect and a work order of its own.
- **`tools/README.md`**: the call-site count if it moves, and one line in the ledger.
- **`TESTING.md` § WO-1.89** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] `TESTING.md` § WO-1.89 names the cause with evidence, or says plainly that it could not be
      reproduced and what was tried.
- [ ] The section no longer depends on a fixed sleep for the class card it clicks.
- [ ] Three consecutive full runs of `node tools/verify-shell.mjs` on one tree are green, and the
      run lines are quoted in `TESTING.md` § WO-1.89.
- [ ] `node tools/wo-sweep.mjs` passes.
- [ ] `TESTING.md` § WO-1.89 carries these lines verbatim with the evidence for each.

**Traps** — **A longer sleep is not a fix**: it moves the race, hides it on a fast machine, and costs
every run. **Do not make the click non-fatal**: `nothing to click` killing a section loudly is what
surfaced this, and WO-1.44's *blast radius, not tolerance* rule stands. **Nothing in `src/` moves**,
so no `CACHE` bump is owed. **The three runs take about 20 minutes each**: background them and say so
up front.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/cooldown-quiet.mjs` — the section. `goHome45()` (~line 74) and `openSignals45()`
  (~line 86) are the fixed-sleep helpers; the fixture reload is ~line 95–101 and again ~232, 504, 633.
  Note `openSignals45()` skips `goHome45()` when `onView45()` already reads `homeView` — so after a
  reload it clicks the card with no wait on the grid at all beyond the reload's 600 ms + `waitForBoot()`.
- `tools/verify/concern-list.mjs` ~line 190 — a sibling that hit the same shape (a class card no screen
  has drawn yet is a `nothing to click`) and argues the reload. Match its vocabulary.
- `tools/verify/first-run.mjs` ~line 306 — an existing `waitFor(pred, ms)` poll helper. **Reuse or
  hoist an existing poll; do not write a third harness or a new framework.** If you hoist one into
  `verify-shell.mjs`, the call-site count in `tools/README.md` may move — the sweep checks it.
- `tools/verify-shell.mjs` ~line 875 (`clickSel`, the throw) and ~line 1078 (`waitForBoot`): what
  "booted" actually waits on decides whether the grid can be unpainted after it returns.
- `tools/verify/excused-report.mjs` (WO-3.70) — runs earlier and leaves the page on the student report.

**Traps the orchestrator adds.**
- **Session budget is thin.** The rolling window read 16.3M at claim time against a p25 death of
  16.4M. Write `TESTING.md` § WO-1.89 and the result file incrementally, and **revert any diagnostic
  mutation/instrumentation before writing anything else** (`AGENTS.md`); mark any temporary probe with
  the word `MUTATION` so a dead run's corpse is greppable.
- **Run the three harness runs in the background**, one at a time on one unchanged tree, and quote
  each run's own summary line — read the log's `EXIT=` rather than a `grep -c`, which exits 1 on zero
  matches and fakes a failure. A repeat/reorder loop to reproduce is fine as a scratch script in the
  scratchpad, not in `tools/`.
- **If you cannot reproduce it**, say so in § WO-1.89 with what you tried and the counts; the fix
  (a wait on the card's presence) is still owed because the fixed sleep is the deliverable's target.
- Nothing in `src/` moves, so no `sw.js` `CACHE` bump.

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

1. `TESTING.md` § WO-1.89 names the cause with evidence, or says plainly that it could not be reproduced and what was tried.
2. The section no longer depends on a fixed sleep for the class card it clicks.
3. Three consecutive full runs of `node tools/verify-shell.mjs` on one tree are green, and the run lines are quoted in `TESTING.md` § WO-1.89.
4. `node tools/wo-sweep.mjs` passes.
5. `TESTING.md` § WO-1.89 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.89 — it is a deliverable, not a permission.** Add `### WO-1.89 — cooldown-quiet.mjs sometimes finds no class tab to click` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.89` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

