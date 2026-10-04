# WO-3.41 — a class with no categories is told its weights total 0% · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.41-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override): the deliverable is teacher-facing copy whose
wording the work order leaves to this dispatch, which is the Claude column on its own merits
(ROUTING.md § "Route to Claude", teacher-facing prose). Set aside: it is a one-message change in a
pure module and one clean run plus one mutation run (~9 min) would fit Codex's 20-minute cap — but
the budget never decides the route when the Claude column already has it, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.41 — a class with no categories is told its weights total 0%

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-03 · **Size** S · **Depends on** WO-3.37 — the quiet row that now prints the engine's message
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.37's verdict. Reachable today, in a weighted class.

**The defect.** `weighted()` in `src/grade-engine.js` (~255) tests `isBalanced()` before anything
else, and a class with no categories totals 0%, so it answers `weights-unbalanced` with *"The
category weights total 0%, so there is no grade yet."* That sentence is true, but it is not why a
teacher would think there is no grade. The class has not been set up. Since WO-3.37 the quiet list
prints the engine's message as written, and student detail's banner (`src/detail.js` ~837) already
did, so both say *0%* about a class that has no categories to weigh.

**Deliverables**
- **The engine's message for a class with no categories says that**, for example *"This class has
  no categories yet, so there is no grade."* The wording is the dispatch's to settle; it is written
  once, in `src/grade-engine.js`, and every reader prints it.
- **The `reason` stays `weights-unbalanced`.** Readers branch on it (`src/detail.js`,
  `src/scores.js`, `src/grades-report.js`), and a class with no categories still has no grade for
  that reason. Only the message changes.
- **A class with categories whose weights do not total 100 reads exactly as today.**

**Acceptance**
- [ ] A weighted class with no categories, on student detail and in the quiet list, is not told its
      weights total 0%. **Mutation-proved**: putting the old message back goes red.
- [ ] Every row the harness's existing fixtures draw for a class that has categories is
      byte-identical before and after.

**Traps** — **Do not change the order of the engine's tests**, and do not report a class with no
categories as `no-graded-work`: work unfiled in a weighted class counts for nothing, so "no graded
work" would be false there, which is the sentence WO-3.37 removed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/detail.js`
  - `src/grade-engine.js`
  - `src/grades-report.js`
  - `src/scores.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/signals.js` (~2229) — the quiet list's reader that prints the engine's message since WO-3.37,
  and WO-3.37's section in `plans/work-orders/phase-3-gradebook.md` for why it prints it verbatim.
- `src/categories.js` — `categoriesOf()`, `weightTotal()`, `isBalanced()`. The test for "no
  categories" should read the class through these, not re-walk `cls` by hand.
- `tools/verify/grade-engine.mjs` (case 8, ~194) — the existing message assertions; the new case
  belongs beside them. Check the quiet-list and detail harness modules too (`grep -rn "no grade yet"
  tools/verify`) for any assertion pinned to the 0% sentence.

**Orchestrator notes — the traps you would not guess.**
- **Keep the `isBalanced()` test first.** The no-categories message is a refinement *inside* the
  `!isBalanced(cls)` branch (e.g. pick the message by whether the class has any categories). Do not
  add a test ahead of it and do not return `no-graded-work`. `reason`, `total` (0) and the empty
  array stay exactly as today.
- **Readers must not grow their own copy.** `src/detail.js`, `src/scores.js`, `src/grades-report.js`
  and `src/signals.js` print `grade.message` / `probe.message`. If any of them composes its own
  "weights total N%" sentence for the banner rather than printing the engine's, report it — do not
  silently rewrite a reader beyond what this work order names; a second sentence is a proposed
  follow-up unless it is what makes Acceptance line 1 false on student detail or the quiet list.
- **Acceptance 1 needs both screens asserted**, not just the engine: a fixture class with zero
  categories drawn on student detail and in the quiet list, checked for the absence of "0%" and the
  presence of the new sentence. Then the mutation: restore the old message, run, see red, revert —
  and **revert before writing anything else** (AGENTS.md; `grep -rn MUTATION` must come back empty
  over your delivered files).
- **Acceptance 2** — the existing fixtures with categories must not move. The full harness green with
  unchanged existing assertions (including case 8's exact 95% string) is the evidence; say which
  checks carry it.
- `wo-sweep.mjs` records a check count in `tools/README.md`; if your new checks move it, update it,
  or the sweep goes red on work being done (WO-3.26).
- Wording: plain, one sentence, the teacher's voice, and true in the quiet list as well as on detail
  (the quiet list is per class; detail is per student). Do not mention weights or 0%.

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

1. A weighted class with no categories, on student detail and in the quiet list, is not told its weights total 0%. **Mutation-proved**: putting the old message back goes red.
2. Every row the harness's existing fixtures draw for a class that has categories is byte-identical before and after.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

