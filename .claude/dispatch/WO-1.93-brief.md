# WO-1.93 — About a hundred section reloads throw away waitForBoot()'s answer · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.93-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus**, on the work order's own merits. The deciding signal is a judgment trap: each of ~100 sites must be read with its next line to tell a discard from a site that expects a failed boot, and a mechanical rewrite is exactly where a section changes meaning. The runner-up, Codex, was also out on arithmetic alone — three full `verify-shell` runs at ~20 min each is ~60 min against a 20-min cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.93 — About a hundred section reloads throw away waitForBoot()'s answer

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-02 · **Size** S · **Depends on** WO-1.91 · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.91 made.)*

**Booked 2026-11-02**, owner-directed, out of [WO-1.91](#wo-191--hload-sleeps-a-fixed-800-ms-and-every-section-reloads-through-it)'s
verdict. WO-1.91 found that `load()` threw away `waitForBoot()`'s `false` and carried on with a page
that had never booted. The section then failed three reads later on an unrelated `TypeError`. It
fixed `load()` and left the same defect in place everywhere else, as its work order instructed:
`grep -cE "^\s*await waitForBoot\(\);\s*$" tools/verify/*.mjs` finds **100** bare calls on
2026-11-02. Each one is a reload that, when the page does not boot, says nothing and lets the next
read fail somewhere it does not belong.

The verifier named one more case. `verify/cooldown-quiet.mjs`'s `reload45()` (WO-1.89) went red on
WO-1.91's run 2 with `{"left":true,"booted":false}`. Its message cannot say whether the modules ran,
because it does not ask, and it quotes no page error.

**Deliverables**
- **Make a section reload that does not boot fail at the reload**, with a message that says so. One
  shared shape for every call site is the aim, for example an `h.` helper that waits and throws, or
  `waitForBoot()` gaining an option to throw. Say why the shape was chosen. **Do not change what
  `waitForBoot()` returns to the callers that read its answer.**
- **`reload45()`**: either move it onto `h.load()` or make it report what `load()` reports
  (`modulesRan`, the boot error, the page errors since its own navigation). It still has to check the
  stored fixture first. Say which, and why.
- **A call that waits for a boot it expects to fail** (a section proving the loading error, for
  example) keeps reading the answer. Find those sites before rewriting any, and leave them as they are.
- **`TESTING.md` § WO-1.93**, a `tools/README.md` ledger line, and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] No call in `tools/verify/` waits for a boot and then discards the answer. A probe that blocks
      the app's modules under one rewritten site fails at that reload, naming the state it reached,
      and the probe is not in the tree.
- [ ] `reload45()`'s failure message says whether the modules ran and quotes the page's errors since
      its navigation.
- [ ] Every site that expects a failed boot still reads `waitForBoot()`'s answer, and `TESTING.md`
      § WO-1.93 lists them.
- [ ] Three consecutive full runs of `node tools/verify-shell.mjs` on one tree are green, and the run
      lines are quoted in `TESTING.md` § WO-1.93.
- [ ] `node tools/wo-sweep.mjs` passes.
- [ ] `TESTING.md` § WO-1.93 carries these lines verbatim with the evidence for each.

**Traps** — **This touches green files on purpose**: WO-1.91's "do not churn green files" kept
`load()` small and does not apply here. The churn is the deliverable. But **a mechanical rewrite of a
hundred lines is where a section quietly changes meaning**. Read each site's next line before
rewriting it, and keep a `false` that a section reads as `false`. **A longer budget is not a fix.**
**If a page error names `src/`**, stop and report it under [WO-1.92](#wo-192--a-fresh-document-sometimes-never-runs-its-modules-and-nothing-has-said-why).
**Nothing in `src/` moves**, so no `CACHE` bump is owed. **Each full run takes about 20 minutes.**

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify-shell.mjs` around line 1119 (`waitForBoot()`) and around line 1249 (`load()` and the WO-1.91 comment) — the shape `load()` already reports (`modulesRan`, boot error, page errors since navigation) is the one to reuse, not re-derive.
- `tools/verify/cooldown-quiet.mjs` — `reload45()`.
- **Sites that already read the answer** (e.g. `assignments.mjs:1003`, `attendance.mjs:90/880/979/1122/1563`, `backup-restore.mjs:52/1458`, `categories-weights.mjs:428`) — survey these first; some assert `true`, some may expect `false`. Only bare `await waitForBoot();` lines are the target, and the grep in the work order (100 on 2026-11-02) is your count to reconcile against.
- **Traps the orchestrator adds.** (1) The mutation probe in Acceptance 1 is a mutation: mark it `MUTATION`, revert it before writing anything else, and `grep -rn MUTATION tools/ src/` before your report. (2) Stage your edits before any `git checkout` revert — a checkout of a file you edited throws your edits away. (3) Each full run is ~20 min; run them in the background and read the log's own exit/summary line, never `grep -c`. (4) Check the diffstat for line-ending rewrites before you finish. (5) If a page error names `src/`, stop and report under WO-1.92 — do not fix app code.

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

1. No call in `tools/verify/` waits for a boot and then discards the answer. A probe that blocks the app's modules under one rewritten site fails at that reload, naming the state it reached, and the probe is not in the tree.
2. `reload45()`'s failure message says whether the modules ran and quotes the page's errors since its navigation.
3. Every site that expects a failed boot still reads `waitForBoot()`'s answer, and `TESTING.md` § WO-1.93 lists them.
4. Three consecutive full runs of `node tools/verify-shell.mjs` on one tree are green, and the run lines are quoted in `TESTING.md` § WO-1.93.
5. `node tools/wo-sweep.mjs` passes.
6. `TESTING.md` § WO-1.93 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.93 — it is a deliverable, not a permission.** Add `### WO-1.93 — About a hundred section reloads throw away waitForBoot()'s answer` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.93` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

