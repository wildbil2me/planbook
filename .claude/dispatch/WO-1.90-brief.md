# WO-1.90 — front-door.mjs's installed cold launch timed out once under load · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.90-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is the run arithmetic: the Acceptance demands three full `verify-shell.mjs` runs at ~20 minutes each, which no Codex dispatch can fit inside its 20-minute cap; and the work itself is a diagnosis with a stop rule (harness cause vs. an app defect in WO-8.16's cold launch), which is Claude-column judgment. Set aside: the fix is harness-only and mechanically checkable, which would read Codex-shaped on its own; this is the same call WO-1.89 got.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.90 — front-door.mjs's installed cold launch timed out once under load

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-01 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.89 made.)*

**Booked 2026-11-01**, owner-directed, out of [WO-1.89](#wo-189--cooldown-quietmjs-sometimes-finds-no-class-tab-to-click)'s
verdict. The implementer's first full run on the fixed tree read `2176 checks · 2175 passed · 1 failed`,
and the one failure was not WO-1.89's section: `verify/front-door.mjs`'s *"an installed launch opens
the app with no flash of the door, even on a device holding no year … (WO-8.16 Acceptance 1)"* read
`{"settled":"timeout",…}`. That run had `wo-sweep.mjs` and `wo-gate.mjs --audit` running beside it. The
check passed on the run before and on the three after, so it is one failure in five, under load, with
no file moving. The record is `TESTING.md` § WO-1.89, under its third Acceptance line. It is the same
kind of check WO-1.89 just fixed: a `pause()` after navigation and a `settle()` with its own budget, so
a slow machine reads as a failed door. **Booked as a ride-along rather than waited on**, because a
flake that does not reproduce on demand comes back during some other work order's verdict, and that
is how WO-3.70 lost two runs.

**Deliverables**
- **Read `coldVisit()` and `settle()` in `tools/verify/front-door.mjs` first**, and record in
  `TESTING.md` § WO-1.90 what `timeout` means there: which budget ran out, and what the page had
  reached when it did. If it can be reproduced, for example by running the section under the same
  side load, say how often before and after.
- **Fix it in the harness, not in `src/`.** Wait on the condition the check reads, the home screen
  painted or the door drawn, the way WO-1.89's helpers wait on the reloaded page and the visible card,
  rather than on a longer budget. Look at the section's other `pause(400)` + `settle()` pairs too, and
  change the ones with the same shape.
- **If the cause is in `src/`**, stop and report. A cold installed launch that sometimes takes long
  enough to time out would be an app defect, WO-8.16's own, and a work order of its own.
- **`tools/README.md`**: one line in the ledger.
- **`TESTING.md` § WO-1.90** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] `TESTING.md` § WO-1.90 says what `settled: "timeout"` meant and names the cause with evidence,
      or says plainly that it could not be reproduced and what was tried.
- [ ] The installed cold-launch check no longer fails because a fixed pause or budget ran out on a
      slow run.
- [ ] Three consecutive full runs of `node tools/verify-shell.mjs` on one tree are green, and the
      run lines are quoted in `TESTING.md` § WO-1.90.
- [ ] `node tools/wo-sweep.mjs` passes.
- [ ] `TESTING.md` § WO-1.90 carries these lines verbatim with the evidence for each.

**Traps** — **A longer budget is not a fix**, for the reason WO-1.89's Traps gave. **Do not make a
timeout read as a pass**: `settled: "timeout"` failing the check is what surfaced this, and it must
still fail when the door really is drawn or the app never boots. **Nothing in `src/` moves**, so no
`CACHE` bump is owed. **The three runs take about 20 minutes each**: background them and say so up
front.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/front-door.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **WO-1.89 is the template, and it just landed.** Read `.claude/dispatch/WO-1.89-result.md`, `TESTING.md` § WO-1.89 (the third Acceptance line records this very failure), and the helpers WO-1.89 added for waiting on the reloaded page and the visible card (`git log --oneline -- tools/verify/cooldown-quiet.mjs`, then read that diff). Match that shape rather than inventing one.
- **Anchors in `tools/verify/front-door.mjs`** (line numbers at dispatch): `settle()` at ~157 with a 12000ms default, `coldVisit()` at ~203 with a `pause(400)` at ~209, and further `pause(400)` sites at ~321, 336, 351, 371. Judge each pair on its own shape; change only the ones that are the same defect.
- **Traps this orchestrator adds.** (1) A wait on the condition must still *fail* when the door is really drawn or the app never boots: whatever you wait on, the timeout branch must keep producing a red check, and a mutation proving that (e.g. force the door to draw on an installed launch) is worth one run — revert it before writing anything else, and `grep -rn MUTATION tools/` must be empty when you finish. (2) The flake was seen with `wo-sweep.mjs` and `wo-gate.mjs --audit` running beside the harness; a side-loaded reproduction is the honest way to measure before/after, and "could not reproduce" is an acceptable, stated outcome. (3) If `tools/README.md` records a `check()` count or similar figure that your change moves, update it — that is the sweep line that goes red on work being *done* (WO-3.26). (4) Run the three verify-shell runs in the background, one at a time, and read each log's own `EXIT=`/summary line; a `grep -c` exiting 1 on zero matches is not a failed run.
- **The `TESTING.md` § WO-1.90 section is a deliverable**, not optional — `--tick` refuses ✅ DONE without it.

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

1. `TESTING.md` § WO-1.90 says what `settled: "timeout"` meant and names the cause with evidence, or says plainly that it could not be reproduced and what was tried.
2. The installed cold-launch check no longer fails because a fixed pause or budget ran out on a slow run.
3. Three consecutive full runs of `node tools/verify-shell.mjs` on one tree are green, and the run lines are quoted in `TESTING.md` § WO-1.90.
4. `node tools/wo-sweep.mjs` passes.
5. `TESTING.md` § WO-1.90 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.90 — it is a deliverable, not a permission.** Add `### WO-1.90 — front-door.mjs's installed cold launch timed out once under load` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.90` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

