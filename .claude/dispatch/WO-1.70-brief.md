# WO-1.70 — an excuse naming a work order that does not claim its box is proved by nothing · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.70-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, on its own merits: this edits `tools/wo-gate.mjs`, a pipeline file, and the Traps are a judgment call (if the plant goes red against today's script it is a defect to report, not code to change), and it owes `TESTING.md` prose. The runner-up was Codex — XS, a mechanical plant on an established pattern, and `--self-check` is fast enough to fit any budget — set aside because ties go to Claude and WO-1.67/1.68/1.69/1.75 on the same file all routed the same way.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.70 — an excuse naming a work order that does not claim its box is proved by nothing

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-10 · **Size** XS · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.69 made.)*

**Booked 2026-10-09**, owner-directed, out of WO-1.68's verdict. A ride-along on `tools/wo-gate.mjs`:
fold it into the next sitting that has that file open.

**Why it exists.** The `SHARED_BOXES` check excuses a doubly claimed box only when the claimants and
the excuse's `ids` are the same set, and it tests that in two halves: every claimant is named
(`ids.every(id => ex.ids.includes(id))`), and every named work order claims the box
(`ex.ids.every(id => set.has(id))`). WO-1.68's plants prove the first half — a third claimant the
excuse does not name goes red. **Nothing proves the second.** WO-1.68's verifier deleted it on a
scratch copy and all 52 plants stayed green. So an excuse for A, B and C over a box only A and B
claim reads as excused, and the excuse goes on vouching for a claim that does not exist — the stale
excuse, one work order wide.

**Deliverables**
- **One `--self-check` plant**: an excuse naming the fixture's two claimants and a third work order
  that does not claim the box. `--audit` reports the box, with the message naming the excuse as not
  this set, and carries the exactly-matching excuse as its control, as WO-1.68's three do.
- **`tools/README.md`** and the self-check's own coverage lines give the new count and drop this case
  from what is not covered.

**Acceptance**
- [ ] On a scratch copy, deleting `ex.ids.every(id => set.has(id))` turns the new plant red, and
      every other plant stays as it was. Reverted before anything else is written.
- [ ] The real `--audit` still reads `ROADMAP.md:275` as excused.
- [ ] `node tools/wo-gate.mjs --self-check` and `--audit` pass, `node tools/wo-sweep.mjs` is green,
      and the plant count in `tools/README.md` matches the run.
- [ ] `TESTING.md` § WO-1.70 carries these lines verbatim with the evidence for each.

**Traps** — **Do not change the check to make the plant pass**: the code is right, and only the proof
is missing. If the plant goes red against today's script, that is a defect found, and it is reported
as one before anything is repaired. **Build the plant through `runExcused()`**, as WO-1.68's three
are, and never by a flag or environment variable on the script: an input that excuses a double claim
is a hole for a person to reach as well. **This changes `tools/wo-gate.mjs`, a pipeline file**: read
`plans/work-orders/README.md` § "The pipeline's own files" before editing it. **Nothing in `src/`
moves**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/work-orders/README.md`
  - `tools/README.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Where to look, and the traps this one carries** (orchestrator's additions):

- The check under test is `tools/wo-gate.mjs` ~1816–1822 (`ids.every(...) && ex.ids.every(id => set.has(id))`). The half you are proving is the second conjunct. Its failure message names the excuse as *"not this set"* — assert on that text.
- `runExcused()` is defined ~3100; WO-1.68's three SHARED_BOXES plants are ~3548–3615 (`FIXTURE_EXCUSE`, `FIXTURE_BOX`, `claimRows()`). Model the new plant on the *third-claimant* plant: a synthetic excuse whose `ids` are the fixture's two claimants (WO-9.9, WO-9.8) **plus** a third work order that exists but does not claim the box, run through `runExcused([...], ['--audit'])`; `--audit` must exit non-zero and report the box with "not this set". Its control is the exactly-matching excuse, which must read as excused (WO-1.68's plants carry one each — match that shape).
- **Watch the stale-excuse interaction**: an excuse naming A, B, C is still *used* (it matched the box text), so the stale-excuse line should not fire — but read lines 1825–1826 and confirm what `used` records when the set test fails, and say in your report which lines the plant does and does not produce.
- **Mutation proof order** (Acceptance line 1): on a scratch copy of the script (not the real file), delete the second conjunct, run `--self-check`, record which plants go red (only the new one should), and confirm the real file is untouched. Run `grep -rn MUTATION tools/` before you write anything else and before you return. Never mutate `tools/wo-gate.mjs` in place.
- The plant count is stated in several places: `tools/README.md` (~122, "fifty-two"), the self-check's coverage print-out (~5147), and any running total there. The sweep holds `tools/README.md`'s counts against reality — run `node tools/wo-sweep.mjs` after the edit, not before.
- Acceptance line 2 is the real `--audit` reading `ROADMAP.md:275` as excused; check that line's text in the `--audit` output, not just the exit code.
- Read `plans/work-orders/README.md` § "The pipeline's own files" before editing — the work order demands it.

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

1. On a scratch copy, deleting `ex.ids.every(id => set.has(id))` turns the new plant red, and every other plant stays as it was. Reverted before anything else is written.
2. The real `--audit` still reads `ROADMAP.md:275` as excused.
3. `node tools/wo-gate.mjs --self-check` and `--audit` pass, `node tools/wo-sweep.mjs` is green, and the plant count in `tools/README.md` matches the run.
4. `TESTING.md` § WO-1.70 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.70 — it is a deliverable, not a permission.** Add `### WO-1.70 — an excuse naming a work order that does not claim its box is proved by nothing` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.70` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

