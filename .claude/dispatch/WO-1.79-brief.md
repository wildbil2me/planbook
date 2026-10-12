# WO-1.79 — the browser harness's header comment counts its files, and the count is wrong · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.79-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at Opus (no model override). The deciding signal is that two of the three deliverables are teacher-facing prose (`TESTING.md` § WO-1.79, the `CHANGELOG.md` entry) and the third edits a pipeline file, `tools/verify-shell.mjs` — ROUTING.md § "Route to Claude". The runner-up was Codex, since the code change is one comment and fits the budget easily; set aside because the README-count question is a finding to make rather than a spec to match, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.79 — the browser harness's header comment counts its files, and the count is wrong

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-11 · **Size** XS · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.75 made.)*

**Booked 2026-10-11**, owner-directed, out of WO-1.77's verdict. A ride-along on
`tools/verify-shell.mjs`: fold it into the next sitting that has that file open.

**Why it exists.** The comment above the section imports in `tools/verify-shell.mjs` opens
*"Seventy-five files, named after the surface they drive"*. There were ninety when WO-1.77 started
and there are ninety-one now. `tools/README.md` carries the count too and WO-1.77 updated it there;
nobody updates the comment, because nothing reads it. **A count written in prose is a count nothing
maintains** — the rule `CLAUDE.md` applies to its own status line.

**Deliverables**
- **The comment names no count.** It keeps what it says about naming and about the two files that
  are not sections. Do not swap in "ninety-one": that is the same defect, one file later.
- **`tools/README.md`'s count**: either the sweep already checks it against the import list, and it
  stays, or it does not, and it goes the same way. Find out which before touching it.
- **`TESTING.md` § WO-1.79** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] The header comment in `tools/verify-shell.mjs` states no number of files.
- [ ] `TESTING.md` § WO-1.79 says whether `tools/README.md`'s count is checked by anything, with the
      line that checks it or the grep that found none, and what was done with it.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-1.79 carries these lines verbatim with the evidence for each.

**Traps** — **This changes `tools/verify-shell.mjs`, a pipeline file**: read
`plans/work-orders/README.md` § "The pipeline's own files" first. **Nothing in `src/` moves**, so no
`CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/work-orders/README.md`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **Traps from the orchestrator:**
  - The second deliverable is a finding first. Check whether `tools/wo-sweep.mjs` (or `wo-gate.mjs --audit`) compares the file count in `tools/README.md` with the harness's section imports. Quote the line that does, or the exact grep that found nothing, in `TESTING.md`. The `check()` count in `tools/README.md` *is* swept (that is how WO-3.26 went red), so do not confuse that count with the **file** count.
  - If no check exists, remove the README count the same way: no number. Do **not** add a sweep check to make the count maintainable. That would widen the work order, and it belongs in your report as a proposed follow-up.
  - Leave the comment's sentences about naming and the two non-section files exactly as they are. Only the count goes.
  - Do not mutate anything. This work order has no claim that needs proving by mutation. If you do mutate, `grep -rn MUTATION` must come back empty before you write a single line of the result.

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

1. The header comment in `tools/verify-shell.mjs` states no number of files.
2. `TESTING.md` § WO-1.79 says whether `tools/README.md`'s count is checked by anything, with the line that checks it or the grep that found none, and what was done with it.
3. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
4. `TESTING.md` § WO-1.79 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.79 — it is a deliverable, not a permission.** Add `### WO-1.79 — the browser harness's header comment counts its files, and the count is wrong` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.79` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

