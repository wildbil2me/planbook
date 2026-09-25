# WO-1.39 — the window is spent by measure and read by feel · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.39-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override). The deciding signal is that this changes `tools/wo-gate.mjs`, one of the pipeline's own watched files, and has to *invent* the account-swap reset mechanism, which no document specifies: that is a judgment trap (ROUTING.md § Route to Claude). The runner-up was Codex, because this is a pure Node CLI change with mostly mechanically checkable Acceptance. I set that aside because of the swap mechanism and the proxy-unit wording, and because ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.39 — the window is spent by measure and read by feel

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-24 · **Size** M · **Depends on** — · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.38
made. Booked 2026-08-30, owner-directed, alongside WO-1.38.)*

**Why it exists.** The question asked at `--start` is *are the gates clear*. The question that
decides whether the dispatch survives is *is there a window to fit it in*, and *nothing anywhere
answers it* — not the gate report, not the tracker, not the size column.

**The `Size` field looks like a capacity estimate and is not one.** Measured against the transcripts:

| WO | Size | M units | |
|---|---|---|---|
| WO-5.5 | S | 6.8 | clean |
| WO-5.6 | S | 7.9 | clean |
| WO-5.4 | S | 13.3 | died |
| WO-5.1 | M | 7.2 | died |
| WO-4.5 | M | 11.5 | died |
| WO-4.3 | M | 11.6 | clean, two verifier passes |
| WO-5.3 | M | 12.2 | died |
| WO-5.2 | M | 15.7 | died |

The ranges overlap almost entirely and the priciest S outran five of the six Ms. Some of that spread
is recovery cost on the rows that died — **which is the point rather than a confound**: the size
column describes the work, and the window pays for the run, including the part where it goes wrong.
So a budget rule that fires on "the big ones" fires on the wrong ones.

**The data is already on disk.** `wo-cost.mjs` reads the transcripts Claude Code writes; those same
records carry per-response token usage, and a rolling-five-hour sum over them was measured during
this audit at a **two-second lag**. Across 124 dispatches the median costs 6.0M weighted units and
the 48 grouped session-limit episodes cluster from 16.4M (p25) through 20.3M (median). The
instrument is a flag, not a research project.

**The shape to build.** `node tools/wo-cost.mjs --window` prints rolling-5h usage with those
reference points beside it, and `wo-gate.mjs --start` prints one line of it where the decision is
actually made. **Advisory, never refusing** — the same call `--audit` makes about a ride-along whose
shelf has emptied: *re-place it, start it, take the mark off* are all correct answers and only a
person can pick. Here the threshold is the owner's and the unit is a proxy; a tool that refused on
either would be a second opinion with a worse instrument.

**Out of scope.** Refusing a dispatch on the number, and any attempt to read `/usage`. That is a
terminal command rendered for a human and no agent can invoke it; this work order does not
approximate it, it measures something else and says so.

**Traps**

- **A project-scoped reading under-reads, and under-reading is worse than not measuring.** There are
  16 directories under `~/.claude/projects/` and three were active in the last 24 hours. That usage
  burns the same account window and would be invisible to a tool that walks only
  `c--dev-planbook`. Walk them all.
- **An account swap makes the count over-read, and nothing on disk records the swap.** The
  transcripts do not name which account served a request, and this project has swapped repeatedly.
  Without a way to restart the count the tool cries wolf after every swap, which is how an
  instrument gets ignored at the moment it is right.
- **A zero that means "no data" and a zero that means "fresh window" must not look the same.**
  `wo-cost.mjs`'s own header states that its transcript path is per-user and per-machine; `--window`
  inherits that, and a wrong path must exit non-zero rather than print `0.0M`. This is WO-2.4's
  round-two defect — *a check that cannot run and a check that cannot fail are the same defect
  wearing different signs* — arriving in the tool that measures the pipeline.
- **The unit is a proxy and has to say so where it prints.** It is calibrated against this project's
  own deaths, not a published ceiling, and it moved whenever the plan did. A four-digit number that
  looks authoritative and is not is the comment-ahead-of-its-code defect in a new place.
- **Do not sum output and cached reads into one number.** `wo-cost.mjs` forbids it at its own top,
  in as many words, because it makes the pipeline look ten times more expensive than it is.

**Acceptance**
- [ ] `node tools/wo-cost.mjs --window` reports rolling-5h weighted usage across **every** directory
      under `~/.claude/projects/`, with the median-dispatch and death-cluster figures beside it.
- [ ] It names its unit as a proxy at the point it prints the number.
- [ ] An unreadable or empty transcript path exits non-zero with a message and never prints `0.0M`;
      the failure is driven, not asserted.
- [ ] An account swap can be recorded so the count restarts, and the mechanism is named where the
      number prints.
- [ ] `node tools/wo-gate.mjs --start <WO>` prints the window line, and **the gate still clears on
      any number** — driven at a figure past the death cluster and proved to clear.
- [ ] `--self-check` is green with a plant behind each new check and its own count up by that many.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/wo-cost.mjs`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/session-limits.md`. The reference figures come from here: median dispatch 6.0M, and the death
  cluster at p25 16.4M and median 20.3M. It also says how to phrase them: "20.3M" is *the size of the
  hole*, **never a published ceiling**. Cite the file where the figures print or where they are defined,
  so a reader can see they are calibration and not a limit.
- `tools/README.md` § on `wo-gate.mjs --self-check` (around line 101), plus the `wo-cost.mjs` row at
  line 13. Both need updating.

**Traps the work order does not spell out, from this repo's history:**

- **The self-check count is recorded in prose, and the sweep checks it.** WO-3.26 went red for this
  reason alone: the harness gained checks and the number written in `tools/README.md` still gave the old
  count. When you add plants to `--self-check`, update every place that states the count in the
  same edit. Then run `wo-sweep.mjs` again at the very end, not only in the middle.
- **`--start` must never fail because of the window line.** That includes a missing transcript
  directory, a parse error, or a slow walk. If the line cannot be computed, it says so in words
  (something like *window: unavailable — <reason>*) and the claim still goes through with exit 0.
  This does not conflict with Acceptance 3. `--window` on its own exits non-zero on no data; inside
  `--start` the same failure becomes advisory text. Neither of them prints `0.0M`.
- **To prove "clears past the death cluster", use a seam, not a live account.** You need a fixture
  transcript tree whose rolling-5h sum is above ~20.3M, reached through `--projects` or an equivalent
  seam that is **documented**, and `--start` then has to exit 0 against a sandboxed `plans/` copy. The
  existing `--self-check` already copies `plans/` to temp, so use that. **Never** run `--start` on a
  real row as the test, because it writes the tracker.
- **Walking every project directory costs time**, and it runs on every `--start`. Filter on file mtime
  inside the 5h window before parsing any JSONL. Report the time it took in your result.
- **The account-swap reset.** Your design has to write *outside* the repo: a marker under `~/.claude/`
  or similar, holding a timestamp that the rolling sum starts from. It must **not** go in
  `localStorage`, and it must not be a file that gets committed. Name the command that records a swap
  on the same line as the number, and say when a reset is active. This is the one decision in the
  work order nobody has made yet, so defend your choice in the result file.
- **Weighted units.** `wo-cost.mjs` has no weighting today. The definition is in
  `plans/session-limits.md` line 20: output ×5 + cache-write ×1.25 + input ×1 + cache-read ×0.1, summed
  for each API response. Use exactly that formula, because the 6.0M and 20.3M references were measured
  in it. It sits in tension with the last Trap, which forbids summing output and cached reads into
  one number. That rule is aimed at a **raw token** total, and this is a **price-weighted** proxy. So
  do not quietly break the file's header rule. Update the header so it states the difference, and
  keep the existing table output unweighted as it is now. Put the weights where the number prints,
  or point to them from there.

- **Verification.** No file under `src/`, `index.html` or `sw.js` changes, so `verify-shell.mjs` is not
  owed. Say that you did not run it and why. What *is* owed: `wo-gate.mjs --self-check`,
  `wo-gate.mjs --audit`, `wo-sweep.mjs`, plus driven runs of `wo-cost.mjs --window` (a real run, and
  a bad path).
- **Any mutation you use to prove a plant bites must be reverted before you write anything else.**
  Run `grep -rn MUTATION tools/` before you report.

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
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
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

## 5. Done means these 7 lines, reported against one by one

1. `node tools/wo-cost.mjs --window` reports rolling-5h weighted usage across **every** directory under `~/.claude/projects/`, with the median-dispatch and death-cluster figures beside it.
2. It names its unit as a proxy at the point it prints the number.
3. An unreadable or empty transcript path exits non-zero with a message and never prints `0.0M`; the failure is driven, not asserted.
4. An account swap can be recorded so the count restarts, and the mechanism is named where the number prints.
5. `node tools/wo-gate.mjs --start <WO>` prints the window line, and **the gate still clears on any number** — driven at a figure past the death cluster and proved to clear.
6. `--self-check` is green with a plant behind each new check and its own count up by that many.
7. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

