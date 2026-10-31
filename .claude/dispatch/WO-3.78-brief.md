# WO-3.78 — the record bar's order is tested only where every order agrees · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.78-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus**, on its own merits: the deliverables include `TESTING.md` prose and a
mutate-run-revert method (one clean `verify-shell.mjs` run plus one per mutation, at least three runs at
~4.4 min, more if a check goes red for the wrong reason), and the Traps are about judgment — plant, do
not build a door; say which tool went red. The runner-up was Codex (harness-only, mechanically
checkable, no `src/` change), set aside because the prose and an open-ended run count put it in the
Claude column, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.78 — the record bar's order is tested only where every order agrees

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-30 · **Size** XS · **Depends on** WO-3.77 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-30, out of WO-3.77's verdict.)*

**Booked 2026-10-30**, owner-directed, out of [WO-3.77](#wo-377--the-record-bar-names-every-quarter-that-needs-it-newest-first)'s
verdict. Harness only; nothing in `src/` moves unless it finds a defect.

**Why it exists.** WO-3.77 ruled that *newest* means **latest in the class's term order**, never by
label or date, and `termsNeedingRecord()` honours it today: it walks `cls.terms` with
`reduceRight()` and holds no sort. But every WO-3.77 fixture has **two** quarters, and in each the
list order, the label order (*Quarter 1*, *Quarter 2*) and the date order all agree. So a later
change that sorted the list by name or by end date would pass every check that exists. The
`.sort(` / `.reverse(` refusal over `src/term-record.js` catches two spellings of that change, not
the change. **It matters more since the owner's 2026-10-30 ruling on WO-3.74**: the home bar opens
the newest entry, so a wrong *newest* sends the teacher to the wrong quarter.

**Deliverables**
- **A fixture with three ended quarters, none recorded**, asserting all three lines in term order,
  newest first.
- **A fixture where the three orders disagree**: the class's terms planted directly in the document
  so that list order, the order of their names and the order of their end dates are three different
  orders. The bar must follow list order. Name the planted order in the check's own message.
- **Two mutations**, each shown red and reverted before writing anything else: order the reader's
  result by term name, then by end date.
- **`TESTING.md` § WO-3.78** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] With three ended quarters unrecorded, the bar shows three lines, newest first by term order.
- [ ] With list, name and end-date order all different, the bar's lines follow list order.
- [ ] With the reader ordering by term name, the check goes red; with it ordering by end date, the
      check goes red. Both mutations are reverted, and `TESTING.md` § WO-3.78 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.78 carries these lines verbatim with the evidence for each.

**Traps** — **Plant the terms, do not build a door**: if the term editor keeps terms in date order,
the disagreeing fixture writes the document over `evalJs`, as WO-3.67's fixture blanks a host, and
adds no way to reorder terms in the app. **A sort mutation will also trip the sweep's `.sort(`
refusal**; the red that counts is the harness check's, so say which tool went red.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/term-record.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/term-record-bar.mjs` — **this is where the new fixtures go.** Its header (from ~line 39)
  describes how Quarter 1/Quarter 2 were built for WO-3.77, and § WO-3.77 (~line 485 onward) has the
  checks and helpers to extend (the bar's button lookup at ~line 163, the per-line text reads). Match
  its fixture style; do not start a new verify file.
- `tools/verify/copy-class.mjs` ~line 1880 — WO-3.67's precedent for writing the document directly
  over `evalJs`. That is the pattern the Traps name for planting terms out of order.
- `src/term-record.js` ~lines 225–270 — `termsNeedingRecord()` and the comment explaining why it
  carries no sort. The mutations go here (sort the result by `name`, then by end date), each reverted
  before you write anything else.

**Traps from the orchestrator, beyond the work order's own:**
- **Mutation hygiene is not optional here.** Put the literal word `MUTATION` in each temporary edit,
  run, capture the red line, revert with an edit (not `git checkout` over unstaged work you need),
  and confirm `grep -rn MUTATION src/` is empty before the next step. Three dispatches in this repo
  have died holding a live mutation; the tree must never be left armed.
- **A mutation that is red only in `wo-sweep.mjs`** (the `.sort(` refusal) does not satisfy
  Acceptance 3. The harness check itself must go red. If you can only make it red in the sweep, the
  fixture cannot express the failure — fix the fixture.
- **Design the disagreeing fixture so each wrong order gives a different first line from list
  order.** E.g. list order A,B,C where name order and end-date order each put a different term first;
  check the full sequence, not just the head. Name the planted order (list/name/date) in the check's
  message.
- **`tools/README.md` records a `check()` count**, and the sweep goes red when the harness grows call
  sites without it being updated (the WO-3.26 scar). Update it in the same sitting.
- **`CHANGELOG.md`**: the work order lists an entry as a deliverable, and the standing constraint
  below says the teacher lands it. Resolve it this way: **draft the entry in your result file** under
  its own heading; do not edit `CHANGELOG.md`. It is written in at tick time.
- If `verify-shell.mjs` goes red somewhere unrelated, report it as found; do not fix outside scope.

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

1. With three ended quarters unrecorded, the bar shows three lines, newest first by term order.
2. With list, name and end-date order all different, the bar's lines follow list order.
3. With the reader ordering by term name, the check goes red; with it ordering by end date, the check goes red. Both mutations are reverted, and `TESTING.md` § WO-3.78 shows the red output.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
5. `TESTING.md` § WO-3.78 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.78 — it is a deliverable, not a permission.** Add `### WO-3.78 — the record bar's order is tested only where every order agrees` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.78` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

