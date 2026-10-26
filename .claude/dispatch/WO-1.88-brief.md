# WO-1.88 — the two append-only checks still miss three spellings their own words cover · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.88-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override): the deciding signal is that every pattern
change must first be *argued per token against the guarded file* and recorded before it lands, and
the Traps are judgment traps (rule per token, not by symmetry; a `\s*` that turns `==` into an
assignment; WO-1.83's no-following-`=` rule on `.length`). Codex was set aside: the work is
mechanically small, but it is the same shape as WO-1.86, which went to Claude for the same reasons,
and the plant-run count is open-ended.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.88 — the two append-only checks still miss three spellings their own words cover

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-25 · **Size** S · **Depends on** WO-1.86 · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.87 made.)*

**Booked 2026-10-25**, owner-directed, out of WO-1.86's verdict. The verifier's own plants found
three spellings that get past F1 (`tools/verify/log-entries.mjs`, over `src/log.js`) or F3
(`tools/verify/term-record.mjs`, over `src/term-record.js`) **while the check's printed words say it
refuses them** — the gap WO-1.85 existed to close, reopened one spelling at a time. It is not folded
into WO-1.87, which owns F2, F4, F5 and F6 and is already M; these are WO-1.86's two files.

**Deliverables**
- **F1: `d.log[0] += 1` passes**, while F1's printed title says it refuses *assignment into
  .log[...]*. F3 already refuses the same spelling. Give F1's index regex the compound-operator
  group F1's reassignment regex took in WO-1.86, argued against `src/log.js` first.
- **F3: `delete` followed by a tab, and `delete(d.termRecords)`, pass**, because F3's `'delete '`
  token wants a space. Replace it with the any-form `delete` regex F1 took in WO-1.86, argued
  against `src/term-record.js` first.
- **F1: `d . log = []` passes**, with whitespace around the dot. Plant the same spelling against F3
  and close it in whichever fence it passes, rather than assuming either way.
- **B2, by the owner's call at dispatch:** an index write through a quoted key (`d['log'][0] = x`,
  `d['termRecords'][0] = x`) passes both. The WO-1.86 implementer judged a
  quoted-key-then-subscript pattern cheap. Close it if the per-file argument finds no legitimate
  match; otherwise name it as passing. **B3** (the same write through an alias) stays named as
  passing, as WO-1.87 leaves the alias family.
- **Each fence's *fence, not a reading* line** names exactly what still passes afterwards.
- **`TESTING.md` § WO-1.88** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] Before any pattern changes, `TESTING.md` § WO-1.88 records whether `src/log.js` or
      `src/term-record.js` holds legitimate code the widened pattern would match.
- [ ] Each of the spellings above is planted in its guarded file and turns its check red, or is
      named as passing in that fence's *fence, not a reading* line. Every plant is reverted, and the
      red output is in `TESTING.md` § WO-1.88.
- [ ] No check's printed title or detail claims a spelling that its patterns let pass.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-1.88 carries these lines verbatim with the evidence for each.

**Traps** — **Plants go in `src/` and come out before anything else is written, and stage before
planting** (AGENTS.md, the WO-5.1 scar). **A whitespace-tolerant pattern must still not fire on a
read**: keep WO-1.83's no-following-`=` rule on `.length`, and do not let `\s*` turn a `==` comparison
into an assignment. **Rule per token, not by symmetry** — WO-1.86's rule. **Nothing in `src/` moves
in the end**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/log.js`
  - `src/term-record.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/log-entries.mjs`
  - `tools/verify/term-record.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **WO-1.86's own record — read it before touching either fence.** `.claude/dispatch/WO-1.86-result.md`
  and `TESTING.md` § WO-1.86 show the compound-operator group F1's reassignment regex took and the
  any-form `delete` regex F1 took; this work order reuses those, it does not invent new ones. The
  verifier's plants that found these gaps are summarised at the foot of
  `.claude/dispatch/WO-1.86-status.md` and in WO-1.86's verdict as recorded there.
- **WO-1.87** (same phase file) owns F2, F4, F5, F6 and the alias family (B3). Do not touch those.
- **Two traps worth stating plainly.** (1) **Plant one spelling per run, or say why not** — WO-1.86's
  verifier called one-run-per-file contestable; for each plant, record which check went red and its
  printed line. You may drive `tools/verify/log-entries.mjs` / `term-record.mjs` checks more cheaply
  than a full `verify-shell.mjs` run if those modules can be exercised alone — find out from the
  tree, do not write a third harness. (2) **Stage before planting** (`git add` your edits) and
  `grep -rn MUTATION src/ tools/` clean before you write the result file. `git status --short src/`
  must be empty at the end.
- **The `CHANGELOG.md` entry is a deliverable here** (it is in Deliverables) — write it, in the voice
  of the WO-1.86 entry.

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

1. Before any pattern changes, `TESTING.md` § WO-1.88 records whether `src/log.js` or `src/term-record.js` holds legitimate code the widened pattern would match.
2. Each of the spellings above is planted in its guarded file and turns its check red, or is named as passing in that fence's *fence, not a reading* line. Every plant is reverted, and the red output is in `TESTING.md` § WO-1.88.
3. No check's printed title or detail claims a spelling that its patterns let pass.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
5. `TESTING.md` § WO-1.88 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.88 — it is a deliverable, not a permission.** Add `### WO-1.88 — the two append-only checks still miss three spellings their own words cover` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.88` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

