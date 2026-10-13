# WO-1.81 — the no-import-loop rule is checked by hand, one work order at a time · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.81-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override; ROUTING.md § "Which Claude", routed on its own
merits). The deciding signal is that this edits `tools/wo-sweep.mjs`, a pipeline file, under Traps that
are judgment rather than mechanics (strip comments without eating specifiers, state the fence-not-reading
limit in the banner, do not widen to `tools/`), and owes `TESTING.md` and `tools/README.md` prose. The
runner-up was Codex — the spec is complete, the Acceptance is mechanically checkable and one
`verify-shell.mjs` run fits the cap — set aside on those two grounds; ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.81 — the no-import-loop rule is checked by hand, one work order at a time

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.80 made.)*

**Booked 2026-10-12**, owner-directed, out of WO-3.66's verdict. A ride-along on
`tools/wo-sweep.mjs`: fold it into the next sitting that has that file open.

**Why it exists.** "No import loop" is a rule this repo has refused to break at least six times
(`CLAUDE.md`'s *refused six times*, under WO-6.2; WO-3.20's `src/date-text.js`; WO-1.22's term
helpers; WO-3.66 ruling (d)), and **every time it was held by an Acceptance line written into that one
work order and checked by a verifier's throwaway script**. Nothing in the repository checks it
between work orders. WO-3.66 nearly closed one through a path nobody would guess —
`src/assignments.js` → `src/held-column.js` → `src/scores.js` — and the brief's own author found it
only by reading the code. A browser loads a cycle without complaint unless evaluation order bites, so
`verify-shell.mjs` sees nothing until it does. **A read of the tree on 2026-10-12 found 64 modules
in `src/` and zero cycles**, so the check starts green and needs no allowlist.

**Deliverables**
- **A sweep check that fails on any import cycle among `src/*.js`.** It reads every static
  `import … from './x.js'` and `export … from './x.js'` (and a dynamic `import('./x.js')`, of which there
  are none today), builds the graph, and on a cycle **names the whole loop as a path** —
  `a.js → b.js → c.js → a.js` — so the reader sees where to cut it, not just that one exists.
- **It must not go green over an empty read.** If it finds no modules or no edges, it fails and says
  so, the way § 31 and § 32 refuse an anchor they cannot find.
- **A plant**: a cycle of length one or two and one of three or more planted in turn, each red with
  its path named, then reverted before anything else is written.
- **`tools/README.md`** describes the check beside the sweep's others, and the sweep's own check count
  (§ 22's *"The verifier's N-check standing sweep"*) moves with it.
- **`TESTING.md` § WO-1.81** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] `node tools/wo-sweep.mjs` has a check that passes on today's tree and prints how many modules and
      edges it read.
- [ ] A planted two-module cycle and a planted cycle of three or more each turn it red, naming every
      module in the loop in order. Both plants are reverted, and `TESTING.md` § WO-1.81 shows the red
      output.
- [ ] A check that reads zero modules or zero edges fails rather than passing.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-1.81 carries these lines verbatim with the evidence for each.

**Traps** — **A fence, not a reading**: it parses import statements as text, so a specifier built at
runtime escapes it. Say so in its banner. **Strip comments before matching** — this repo's headers
quote import lines in prose to explain them, and a quoted import is not an edge. **Do not widen it to
`tools/`**: the harness files import each other for reasons of their own, and nobody has ruled on them.
**This changes `tools/wo-sweep.mjs`, a pipeline file**: read `plans/work-orders/README.md` § "The
pipeline's own files" first. **Nothing in `src/` moves**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/work-orders/README.md`
  - `src/assignments.js`
  - `src/date-text.js`
  - `src/held-column.js`
  - `src/scores.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also open, and the traps the work order does not spell out:**

- **§ 31 and § 32 of `tools/wo-sweep.mjs`** are the convention to match: banner shape, how an anchor
  that cannot be found becomes a FAIL that names it, and how the section's limits are stated. § 28 and
  § 31 already have comment-blanking code — **reuse it rather than writing a third**, but read what it
  does to strings first: the import *specifier* is a string, so a blanker that also empties string
  literals will read zero edges. Blank comments only; and mind that `//` inside a string (a URL) is not
  a comment start.
- **§ 22 counts the results the run emits** and holds `tools/README.md`'s *"The verifier's N-check
  standing sweep"* (51 today) against it. Decide whether the empty-read refusal is its own `check()` or
  a FAIL branch of the cycle check, then move the README number by exactly what the run emits — run the
  sweep and read § 22 rather than adding by hand.
- **Do not write today's module or edge count into `tools/README.md` or the banner.** The check
  prints it; a number written down beside it is one nothing maintains (WO-1.79/1.80 are the scars).
  The `TESTING.md` evidence may quote the figures, because that is a dated record of a run.
- **The plants go in `src/`.** Make them with Edit, revert them with Edit, and before writing anything
  else confirm `git diff --stat -- src/` is empty and `grep -rn MUTATION src/ tools/` finds nothing
  of yours. **Do not use `git checkout`/`git restore` to revert** — other sessions may have unstaged
  work in this tree, and a checkout reverts theirs too. Mark every plant line with a `MUTATION`
  comment so a dead run's plant is one grep away. Run `verify-shell.mjs` only after both plants are
  out.
- **Name the loop in order and closed**: `a.js → b.js → a.js`, starting module repeated at the end. A
  two-module plant must not print as two separate one-hop findings, and a three-module plant must not
  print a rotation that skips a module. Report each distinct cycle once.
- **`CHANGELOG.md`**: draft the entry in your result file, do not write it into `CHANGELOG.md` — the
  maintenance pass lands it.

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

1. `node tools/wo-sweep.mjs` has a check that passes on today's tree and prints how many modules and edges it read.
2. A planted two-module cycle and a planted cycle of three or more each turn it red, naming every module in the loop in order. Both plants are reverted, and `TESTING.md` § WO-1.81 shows the red output.
3. A check that reads zero modules or zero edges fails rather than passing.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
5. `TESTING.md` § WO-1.81 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.81 — it is a deliverable, not a permission.** Add `### WO-1.81 — the no-import-loop rule is checked by hand, one work order at a time` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.81` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

