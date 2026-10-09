# WO-1.67 — `--tick` ticks a roadmap box that a **Closes roadmap** line quotes in order to disown it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.67-result.md` — as your last act, and return it in-band too.

**Routing: Claude Opus.** This edits `tools/wo-gate.mjs`, a pipeline file, and two of its three Deliverables are judgment calls the work order hands to you explicitly — which opening words count as a no-box line, and whether a doubly-claimed box is a failure or a note, decided on today's evidence with excused cases written down. The runner-up was Codex (no UI, mechanically checkable plants, size S); set aside because the work order asks for decisions, not just code matching a spec, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.67 — `--tick` ticks a roadmap box that a **Closes roadmap** line quotes in order to disown it

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-09 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.66 made.)*

**Booked 2026-10-09**, owner-directed, out of WO-8.16's close.

**Why it exists.** WO-8.16's header reads **Closes roadmap** *(no box. It is the front half of Phase
8's "Onboarding: install → marking attendance with no documentation", and WO-8.6 closes that one.)*
The line quotes the box precisely to say it is someone else's. `node tools/wo-gate.mjs --tick WO-8.16`
ticked it anyway, at `plans/ROADMAP.md:712`, and printed two dashboard NOTEs about the count it had
just moved. **The box belongs to WO-8.6, which is ⬜ NOT STARTED.** It was reverted by hand before
`1482edc`, and a sitting that read the NOTEs as bookkeeping would have committed it.

The cause is `roadmapEdits()` in `tools/wo-gate.mjs`: every double-quoted run on the **Closes
roadmap** line is a fragment, with no regard for the *(no box* that opens the line. And `--audit`
passed before the tick and would have passed after it, because it asks whether each fragment matches
exactly one box. It never asks whether one box is claimed by two work orders, so WO-8.16 and WO-8.6
both "closing" the onboarding box was invisible to it.

**Deliverables**
- **A **Closes roadmap** line that says it closes no box yields no fragments.** Decide the test from
  the lines actually in this directory (*(no box*, *no box*, and whatever else `grep` finds), state it
  where `roadmapEdits()` is defined, and have `--tick` report "quotes no box" as it already does for a
  line with no quotes. Quoting a box in a no-box line stays legal: it is how a work order says whose
  box it is.
- **`--audit` reports a roadmap box matched by fragments from two or more work orders.** First count
  how many boxes that is today. If a legitimate case exists (an amending work order, a box closed in
  halves), write down how it is excused rather than weakening the check. Decide on the evidence
  whether it is a failure or a note, and say why in the check's comment.
- `--self-check` gains a plant for each: a no-box line quoting a box ticks nothing, and two work orders
  claiming one box are reported. `tools/README.md` records any count that moves.

**Acceptance**
- [ ] In a scratch copy of the tree, never on `main`, `--tick WO-8.16` against a copy whose row is set
      back to 🔍 AWAITING VERDICT leaves `plans/ROADMAP.md` untouched and says the line quotes no box.
- [ ] A work order whose **Closes roadmap** line quotes a box without a no-box note still ticks that
      box, shown by an existing or new `--self-check` plant.
- [ ] `--audit` names a box claimed by two work orders, shown with a plant. The count on today's tree
      is stated in the result, with any excused case named.
- [ ] `node tools/wo-gate.mjs --audit` and `--self-check` pass, `node tools/wo-sweep.mjs` is green,
      and `tools/README.md`'s recorded counts match.
- [ ] `TESTING.md` § WO-1.67 carries these lines verbatim with the evidence for each.

**Traps** — **Do not fix it by rewording WO-8.16's line.** Changing the quotes to backticks would make
this one tick correct and leave the parser waiting for the next author who quotes a box to disown it.
WO-8.16 is ✅ and will not be ticked again, so its line is the test case, not the repair. **Do not
make `--tick` read the sentence.** A no-box line is recognised by its opening words, not by
understanding *"and WO-8.6 closes that one"*. **This changes `tools/wo-gate.mjs`, a pipeline file**:
read `plans/work-orders/README.md` § "The pipeline's own files" before editing it. **Nothing in
`src/` moves**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/ROADMAP.md`
  - `plans/work-orders/README.md`
  - `tools/README.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/wo-gate.mjs` `roadmapEdits()` (~line 1584) and its caller in `--tick` (~line 2006), the `--audit` fragment-matching check, and `selfCheck()` (~line 2755) with its existing plants — match their shape; do not write a new harness.
- `plans/work-orders/phase-8-packaging.md` § WO-8.16 header — the live test case. **Do not edit it** (Traps).

**Orchestrator notes — the traps not to guess at:**
- The Acceptance's scratch-copy `--tick` must run **outside the repository** (copy `plans/` etc. to the scratchpad, or reuse `--self-check`'s sandbox mechanism). Never `--tick` WO-8.16 on the real tree; if you do, `git diff plans/ROADMAP.md` must be empty before you return.
- Before writing the no-box test, `grep -rn "Closes roadmap" plans/work-orders/` and classify every variant; state the count and the chosen test in the comment above `roadmapEdits()`.
- The doubly-claimed-box count on today's tree goes in your result file and `TESTING.md`. Note WO-8.16 vs WO-8.6 should stop counting once the first deliverable lands — say whether it does.
- Any `check()` / plant count that moves is recorded in `tools/README.md` in the same sitting; a stale count there turns `wo-sweep.mjs` red (the WO-3.26 scar).
- If you plant a mutation to prove a check bites, mark it `MUTATION` and revert it before writing anything else; `grep -rn MUTATION tools/` must be clean at return.
- This row is `🤖 CLAIMED`; do not change its status yourself beyond ticking Acceptance boxes you actually closed. The orchestrator runs `--handoff`.

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

1. In a scratch copy of the tree, never on `main`, `--tick WO-8.16` against a copy whose row is set back to 🔍 AWAITING VERDICT leaves `plans/ROADMAP.md` untouched and says the line quotes no box.
2. A work order whose **Closes roadmap** line quotes a box without a no-box note still ticks that box, shown by an existing or new `--self-check` plant.
3. `--audit` names a box claimed by two work orders, shown with a plant. The count on today's tree is stated in the result, with any excused case named.
4. `node tools/wo-gate.mjs --audit` and `--self-check` pass, `node tools/wo-sweep.mjs` is green, and `tools/README.md`'s recorded counts match.
5. `TESTING.md` § WO-1.67 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.67 — it is a deliverable, not a permission.** Add `### WO-1.67 — `--tick` ticks a roadmap box that a **Closes roadmap** line quotes in order to disown it` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.67` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

