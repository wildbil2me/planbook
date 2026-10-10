# WO-1.75 — a one-line banner in a sheet with no header index is still read as part of the section above it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.75-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus**, on its own merits. The deciding signal is the Traps section, which is about judgment rather than mechanics (*refuse* the one-line shape, never *accept* it; the banner box's two lines must each be tested against the pattern), plus the work order owing `TESTING.md` and `CHANGELOG.md` prose and editing a pipeline file. The runner-up was Codex: it is XS, the spec is complete and the sweep runs in seconds, so the runtime budget would have fitted; the prose deliverables and the pipeline-file rule decided it. The row carries a 🎒 ride-along mark; it was dispatched by name, which is what `next`'s `--start` hint allows.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.75 — a one-line banner in a sheet with no header index is still read as part of the section above it

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-10 · **Size** XS · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.70 made.)*

**Booked 2026-10-10**, owner-directed, out of WO-1.69's verdict. A ride-along on `tools/wo-sweep.mjs`
§ 19: fold it into the next sitting that has that file open.

**Why it exists.** WO-1.69 gave § 19 two per-sheet rules — a sheet that declares a class and parses
to zero sections fails, and a section named in a sheet's header index with no body banner fails —
and **both reach a one-line banner only through something else in the sheet**. A sheet with no
header index and at least one good banner box passes with a one-liner in it, and the one-liner's
rules are read into whatever sits above it, preamble or section. `design/mockups/proposed-phase7.css:19`
(§ SYNC BUTTON) is exactly that, in the tree today. It costs nothing now only because the section
was lifted at WO-7.5 and the collision check skips lifted sections; the next sheet drawn without an
index is unguarded. The gap is named at the check, in the `tools/README.md` row and in `TESTING.md`
§ WO-1.69.

**Deliverables**
- **§ 19 fails a one-line banner wherever it appears**: a comment line that carries a `§` and a run
  of `═` on the same line (`/* ══ § NAME → … ══ */`), naming the sheet, the line, and the banner box
  `PROTOCOL.md` rule 4 expects. It depends on no header index.
- **`design/mockups/proposed-phase7.css:19` reshaped into a banner box**, so the sheet passes. Its
  words do not change.
- **The gap paragraph** at the check, in the § 19 banner and in `tools/README.md` comes out, replaced
  by what is now checked.
- **`TESTING.md` § WO-1.75** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] On a scratch copy, `proposed-phase7.css` as it stood before this work order turns the sweep
      red, naming that sheet and line 19. Reverted before anything else is written.
- [ ] Every `proposed*.css` in the tree passes, with `proposed-phase7.css` reshaped and no other
      sheet under `design/` changed.
- [ ] `node tools/wo-sweep.mjs` is green and `node tools/wo-gate.mjs --audit` passes.
- [ ] `TESTING.md` § WO-1.75 carries these lines verbatim with the evidence for each.

**Traps** — **Do not widen the parser to read a one-liner as a section**: WO-1.69's Trap stands, and
rule 4's banner box stays the only shape. This rule refuses the other shape; it does not accept it.
**A banner box's own rule lines carry `═` and no `§`, and its § line carries `§` and no `═`** — test
both lines of every banner in the tree before trusting the pattern. **This changes
`tools/wo-sweep.mjs`, a pipeline file**: read `plans/work-orders/README.md` § "The pipeline's own
files" before editing it. **Nothing in `src/` moves**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/proposed-phase7.css`
  - `plans/work-orders/README.md`
  - `tools/README.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `design/mockups/PROTOCOL.md` — rule 4, the banner box. The new refusal's message should name it.
- `.claude/dispatch/WO-1.69-result.md` and `TESTING.md` § WO-1.69 — the two per-sheet rules this one sits beside, and the gap paragraph you are replacing. Read `tools/wo-sweep.mjs` around lines 1690–1700 (the § 19 banner), 1925–1950 (the check's comment naming the gap) and 2013 (the existing unreadable-sheet message), and the § 19 row in `tools/README.md`.
- **Traps the brief adds.** (1) Acceptance line 1 is a mutation: put the old line 19 back on a scratch copy or in the tree, run the sweep, see red naming `proposed-phase7.css` and line 19, and **revert before writing anything else** — `grep -rn MUTATION` must find nothing when you return. (2) If the sweep or `tools/README.md` records a `check()` count, a new check moves it; update the recorded number or the sweep goes red on work being done (the WO-3.26 shape). (3) Reshaping line 19 into a box must keep its words byte-identical and change no other sheet; diff `design/` before you finish. (4) Check the diffstat for line-ending churn before you report — do not `sed -i` prose files.

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

1. On a scratch copy, `proposed-phase7.css` as it stood before this work order turns the sweep red, naming that sheet and line 19. Reverted before anything else is written.
2. Every `proposed*.css` in the tree passes, with `proposed-phase7.css` reshaped and no other sheet under `design/` changed.
3. `node tools/wo-sweep.mjs` is green and `node tools/wo-gate.mjs --audit` passes.
4. `TESTING.md` § WO-1.75 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.75 — it is a deliverable, not a permission.** Add `### WO-1.75 — a one-line banner in a sheet with no header index is still read as part of the section above it` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.75` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

