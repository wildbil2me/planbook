# WO-3.37 — the quiet list says an extra-credit-only student has no graded work · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.37-result.md` — as your last act, and return it in-band too.

**Routing — Claude Opus, on its own merits.** The deciding signal is teacher-facing prose with a
judgment call in it: the quiet row must say *why* there is no grade in a sentence that composes with
`In <class>, <name> …`, and the work order also asks you to investigate a second, pre-existing cause
(unbalanced weights) and fix it if reachable. The runner-up was Codex — one function, mechanically
checkable, two harness runs (~9 min) fit the cap — set aside because the wording and the
reachability question are not specified anywhere a runner could copy them from.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.37 — the quiet list says an extra-credit-only student has no graded work

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-03 · **Size** S · **Depends on** WO-3.35 — the engine message this matches
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.35's verdict. **Unreachable today**, because
nothing writes `gradingMode` until [WO-3.31](#wo-331--the-categories-editor-offers-total-points),
which depends on this row.

**The defect, found by the verifier.** `quietSentence()` in `src/signals.js` (~2214) prints
*"has no graded work yet"* whenever the grade's `percentage` is null. In a points class, a student
whose only graded work is extra credit has a null percentage and graded work. WO-3.35 fixed the same
false sentence on student detail and in the engine's own message. The quiet list on the signals
screen still says it.

**Read this at dispatch.** A null percentage has other causes too. In a weighted class whose weights
do not total 100% there is no grade, and the same sentence says *"no graded work"* over a class full
of scores. Find out whether the quiet list can reach that case today. If it can, the defect predates
points mode, and this row fixes it as well.

**Deliverables**
- **The quiet row's standing says why there is no grade**, from what `classGrade()` already returned
  (its `reason`, or its `message`). It does not recompute anything. *"Has no graded work yet"* is
  printed only when that is the reason.
- **A student with a grade reads exactly as today.**

**Acceptance**
- [ ] In a points fixture, a quiet student whose only graded work is extra credit is not told they
      have no graded work. **Mutation-proved**: putting the test back on `percentage === null` alone
      goes red.
- [ ] Every quiet row the harness's existing fixtures draw is byte-identical before and after.

**Traps** — **Do not re-run the grade or read the scores in `src/signals.js`.** The answer is
already on the grade object. **A quiet row is not a rule**, and nothing fired, so this adds no
measurement to the row.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/signals.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/grade-engine.js` — `noGrade()` (~200), `weighted()` (~254, the `weights-unbalanced` branch)
  and the points branch (~345). **The trap here, read it before designing anything:** the
  extra-credit-only case returns `reason: 'no-graded-work'` — **the same reason as genuinely no
  graded work** (WO-3.35 kept the reason so every reader that branches on it still does). Only the
  `message` differs. So `reason` alone cannot satisfy Acceptance line 1; you need the message, or
  `reason` plus the message. Do **not** change the engine's reason codes or returned shape — WO-3.30
  proved that shape identical in weighted mode and WO-3.35 forbade changing it. If you decide the
  clean fix needs an engine change, stop and say so as a proposed follow-up rather than making it.
- The engine's messages are whole sentences (*"The only work graded so far is extra credit, so there
  is no grade yet for it to add to."*, *"The category weights total 90%, so there is no grade
  yet."*). Decide how the quiet row carries one — appended as its own sentence, or a standing
  phrase chosen off the fact — and argue the choice in a comment at `quietSentence()`. Whatever you
  pick, never print *"has no graded work yet"* for anything but the genuine case, and keep
  `quietSentence()` free of score reads (the Trap).
- Readers that already branch on `reason`, as precedent: `src/detail.js:837`,
  `src/grades-report.js:335`, `src/scores.js:670`. Match their convention.
- **Reachability of `weights-unbalanced`:** check whether the signals screen (`quietMiddle()`'s
  callers, and `evaluate()`) refuses or skips a class whose weights do not total 100% before the
  quiet list is drawn. Report what you found, with the line, either way.
- **Points mode is unreachable from the UI** (nothing writes `gradingMode` until WO-3.31), so the
  fixture writes `gradingMode` directly — find how WO-3.35/WO-3.36's harness sections built their
  points fixtures in `tools/verify-shell.mjs` and reuse that pattern rather than inventing one.
- **Acceptance 2 (byte-identical)** wants evidence, not assertion: capture every quiet row's
  `explanation` across the existing fixtures before your change and compare after — the harness's
  existing quiet-list checks plus a before/after diff is fine; say how you did it.
- **Mutation discipline** (AGENTS.md): mark the mutation `MUTATION`, revert it before writing
  anything else, and `grep -rn MUTATION src tools` clean before you report.
- If `tools/README.md` records a `check()` count, update it in the same sitting — a stale count
  turns `wo-sweep.mjs` red on finished work (WO-3.26).

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

## 5. Done means these 2 lines, reported against one by one

1. In a points fixture, a quiet student whose only graded work is extra credit is not told they have no graded work. **Mutation-proved**: putting the test back on `percentage === null` alone goes red.
2. Every quiet row the harness's existing fixtures draw is byte-identical before and after.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

