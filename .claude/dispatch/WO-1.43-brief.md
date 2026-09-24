# WO-1.43 — a broken excuse reads as a contradiction, and a vanished claim reads as green · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.43-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus tier (no model override), on the work order's own merits**: every Trap is a
judgment about what § 21 may and may not assert — a zero-occurrence claim stays green, detail-line length
is a cost, and the `lost` repair must not reach the walk — which is ROUTING.md § "Traps about judgment",
the same call WO-1.40 and WO-1.41 made on this engine. Runner-up set aside: Codex (Size S, mechanically
checkable, and the proof budget fits because no browser run is needed), but the spec for the message
lives only in the Traps.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.43 — a broken excuse reads as a contradiction, and a vanished claim reads as green

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-23 · **Size** S · **Depends on** WO-1.41 ✅ · **Blocks** nothing;
it protects every reading of § 21 after it
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.42
made. Booked 2026-08-30, owner-directed, on WO-1.41's verifier's two proposals, taken as one row
because they are two messages inside the same twenty lines of § 21.)*

**Why it exists.** § 21 runs two pairs and reported honestly on the day each was built. It has two
silences, **both failing toward looking fine**, and neither is visible from the summary line.

**The first is a broken excuse printing as a defect.** `lost` — the named passages a pair declared
and the walk could not find — is computed at `tools/wo-sweep.mjs:2608` and consumed **only in the
green branch** at `:2611`. So when a `confinedTo` region goes missing, every occurrence inside it is
read as unscoped and each is reported as a contradiction **with no hint that the excuse mechanism is
what broke.** The green branch already says it in as many words — *"but the passage X was not found,
so every occurrence was read as unscoped"* — and the `REVIEW` branch, the one a person actually acts
on, says nothing. A reader sent to compare two files will find them agreeing and have nowhere to go.

**The second is a claim that has quietly stopped testing anything.** The green message reports
`occurrences`, **one aggregate across every claim in the pair**. A claim whose token is reworded out
of the compared file contributes zero and the total still reads healthy: 18 occurrences across four
claims and 18 across three are the same number. The **reference** side is already fenced — reword an
anchor sentence in `CLAUDE.md` and the paired FAIL check names the orphaned claim, which WO-1.41's
verifier drove — so the **compared** side is the only silent half, and it is the half that gets
rewritten most.

**Traps**

- **Do not make a zero-occurrence claim a `FAIL`, and do not make it a `REVIEW`.** *Absent is green*
  is this pair's premise, written at `DRIFT_PAIRS` and in `AGENTS.md`'s own first paragraph: omitting
  most of `CLAUDE.md` is that file's entire job, and a rule it correctly does not restate must not
  turn the tracker amber. **Report the number and assert nothing.** A zero becomes visible without
  being called wrong, and the honest reading — *this claim is currently checking nothing* — is left
  to a person, which is the division § 21 already draws between `FAIL` and `REVIEW`.
- **The detail line is read by a person under a summary, so length is a cost.** WO-1.41's verifier
  recorded that a four-claim `REVIEW` is about as long as this should ever get. Four counts is not a
  table; do not print a claim's text beside its number.
- **The `lost` clause is a repair to a message, not to the walk.** Nothing about which occurrences
  are found or excused changes. If the fix reaches the loop above `:2606`, it has grown past this
  work order — a lost region already *behaves* correctly, it just does not say so on the branch that
  matters.
- **Both pairs share this code, so the first pair is the regression surface.** WO-1.41 proved its
  own change safe by leaving the engine byte-untouched and this one cannot. Re-run WO-1.40's
  fixtures rather than reasoning that a message change is safe.

**Acceptance**
- [ ] A pair whose `confinedTo` region cannot be found reports that fact in the **`REVIEW`** branch
      as well as the green one — driven against a planted missing region, with the message read.
- [ ] The green detail line reports occurrences **per claim** rather than as one total, and a claim
      contributing zero is visible in it — driven against a compared file with one claim's token
      removed.
- [ ] A zero-occurrence claim leaves the check **green**: no `FAIL`, no `REVIEW`, and the exit code
      is unchanged.
- [ ] Both existing pairs still behave as WO-1.40 and WO-1.41 left them, proved by re-running their
      fixtures rather than by inspection.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/wo-sweep.mjs` § 21 in full — `DRIFT_PAIRS` and the compare loop around `:2560`–`:2620`. The
  work order's line numbers (`:2608`, `:2611`, `:2606`) are from booking; today `lost` is at `:2609` and
  the green message at `:2613`. Re-locate by reading, not by number.
- `.claude/dispatch/WO-1.40-result.md` and `.claude/dispatch/WO-1.41-result.md` — the fixtures Acceptance
  line 4 asks you to **re-run**, and what each one printed. `TESTING.md` § WO-1.40 (`:1383`) and § WO-1.41
  (`:1451`) write them out.
- `tools/README.md` — the § 21 row and the recorded `check()` count. **If your change adds checks, that
  count moves in the same edit**, or the sweep goes red on work being done (the WO-3.26 scar).
- `plans/work-orders/README.md` § "The pipeline's own files" — read before editing the pipeline.

**Traps the work order does not spell out.**

- **Drive every fixture in a scratchpad COPY of the tree, never in the tracked tree.** WO-1.41's result
  file says in its own method note that it drove in the tracked tree and would not again: a dispatch that
  dies between plant and revert leaves an armed file in `CLAUDE.md`/`AGENTS.md`/`wo.md`. Plant into a copy
  (e.g. copy the repo to the scratchpad and run `node <copy>/tools/wo-sweep.mjs` there). If you must touch
  the tracked tree, revert **before** writing anything else, then `grep -rn MUTATION` over what you touched.
- **Section 4 below lists `verify-shell.mjs`.** This work order changes no byte of `src/`, `index.html` or
  `sw.js`, so the browser harness measures nothing here and is not an Acceptance line. Do not spend a
  run on it; say in the result file that you did not, and why. `wo-sweep.mjs` and `wo-gate.mjs --audit`
  are the two that count.
- **Four counts is the whole addition to the green line.** Label each count by something short and stable
  that already exists on the claim (an id or key), not its text — Trap 2. If claims carry no short label
  today, adding one is in scope; rewording claims is not.
- **The first pair (`wo.md` ↔ orchestrator) is the regression surface**, and it has its own regions. A
  planted missing region in *either* pair should print the new REVIEW clause; drive at least one per pair.
- **Record the before/after sweep summary lines** (`N checks · N passed · 0 failed · N to review`) from the
  clean tree, so the verifier can see the review count did not move.

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

## 5. Done means these 5 lines, reported against one by one

1. A pair whose `confinedTo` region cannot be found reports that fact in the **`REVIEW`** branch as well as the green one — driven against a planted missing region, with the message read.
2. The green detail line reports occurrences **per claim** rather than as one total, and a claim contributing zero is visible in it — driven against a compared file with one claim's token removed.
3. A zero-occurrence claim leaves the check **green**: no `FAIL`, no `REVIEW`, and the exit code is unchanged.
4. Both existing pairs still behave as WO-1.40 and WO-1.41 left them, proved by re-running their fixtures rather than by inspection.
5. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

