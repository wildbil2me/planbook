# WO-3.36 — the score grid, the grade sheet and the unfiled group still speak weights in a points class · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.36-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, no model override. The deciding signal is that the deliverables are teacher-facing wording on three screens, and the Traps are about judgment: weighted wording has to stay byte-for-byte, and the banner has to be *confirmed* unreachable, not assumed. This is the same route as its sibling WO-3.34. The runner-up was Codex, since the row is small and its Acceptance is measured. I set it aside because the wording is the work, not the arithmetic.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.36 — the score grid, the grade sheet and the unfiled group still speak weights in a points class

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-03 · **Size** S · **Depends on** WO-3.34 — the points-mode wording this matches
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.34's verdict: the wording that row's list did not
name. **Unreachable today**; WO-3.31 depends on this row so the control does not ship before these
screens are right.

**Deliverables**
- **The score grid** (`src/scores.js`): in a points class the summary line does not read
  `Weights total N%` (~726), and the column category chips do not carry a weight (~460). The
  unbalanced-weights banner (~660) cannot fire there, since a points class has no such refusal;
  confirm that rather than assume it.
- **The grade sheet** (`src/grades-report.js`): read it in a points class for weight wording, and fix
  what it finds. WO-3.34's implementer did not read it.
- **The *Not in a category* group on the assignments screen** is red because "this costs the
  assignment" (~608). In a points class that is false — unfiled work counts — so it is not drawn as a
  cost there. Weighted stays red.
- **Stale comments in `src/assignments.js`** that call uncategorized work "counted by nothing"
  (~609, ~1195) say which mode they mean. The one at ~27 is about an id from another class, not about
  unfiled work; read it before touching it.

**Acceptance**
- [ ] In a points class, no text on the score grid or the grade sheet calls the grade weighted or
      prints a weight. **Measured**, not read.
- [ ] The *Not in a category* group is not styled as an error in a points class, and is unchanged in
      a weighted one.
- [ ] A weighted class's score grid and grade sheet are unchanged on the harness's existing fixtures.

**Traps** — **Weighted wording stays exactly as it is.** This is a points-mode branch, not a
rewording. **Do not compute a share on the screen**; `pointsShare()` and `effectiveWeight` exist.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/grades-report.js`
  - `src/scores.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/grade-engine.js` — `gradingModeOf()`, `pointsShare()`, `effectiveWeight`. Branch on `gradingModeOf(cls) === 'points'` the way `src/assignments.js` already does (~557, ~701, ~1154). Do not add a second test for the mode.
- `.claude/dispatch/WO-3.34-result.md` — the points-mode wording this row matches, and how that row built its points fixture. Match its words; do not invent new ones.
- `tools/verify/points-grade.mjs` — the existing points-mode harness section. Extend it, or a sibling in `tools/verify/`, rather than writing a new harness. Acceptance 1 says **measured**: assert the rendered text of the score grid and the grade sheet in a points class, for example no `Weights total`, no `%` weight chip and no `weighted`. Do not grep the source.
- **Acceptance 3 is a byte-identity claim.** Capture the weighted fixtures' score grid and grade sheet text/markup before your edit and compare after, or show that existing checks already pin them.
- **The banner (~660).** Trace why it cannot fire in points mode, and cite the line that makes it so. If it *can* fire, that is a finding: fix it inside this row's scope and say so.
- **The run's own mutation round.** If you mutate to prove a check bites, revert it before writing anything else (`AGENTS.md`), and run `grep -rn MUTATION src tools` before you report.

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

## 5. Done means these 3 lines, reported against one by one

1. In a points class, no text on the score grid or the grade sheet calls the grade weighted or prints a weight. **Measured**, not read.
2. The *Not in a category* group is not styled as an error in a points class, and is unchanged in a weighted one.
3. A weighted class's score grid and grade sheet are unchanged on the harness's existing fixtures.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

