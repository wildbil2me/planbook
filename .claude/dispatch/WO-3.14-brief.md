# WO-3.14 — percentages to two decimal places · implementation brief

**Route** Codex
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.14-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routes to **Codex**: the spec is complete and lives outside the work
order (`docs/grade-math-cases.md` case 1 fixes the exact expected strings), every acceptance line but
the 👤 one is mechanically checkable by the harness that already exists, size is S, and there is no
sensitive surface and no new visual language — `ROUTING.md` names "percentage math" as a typical
Codex shape. The runner-up consideration set aside: the second deliverable asks you to *rule
explicitly* on every percentage surface, which is a sentence of judgment rather than arithmetic —
but the work order pre-answers it by routing every surface through one function and putting
attendance out of scope, so what is owed there is stating a fact, not choosing a design. The
exec-time probe passed `SMOKE OK` before this brief was written, so this is a route, not a fallback.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.14 — percentages to two decimal places

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-10 · **Size** S · **Depends on** WO-3.5 · **Blocks** nothing
**Closes roadmap** *(no box.)*

**Booked 2026-08-10 from WO-3.5's SIS re-keying box**, the first time a human read this app's
percentages beside the school's. They do not match in precision: **the SIS carries two decimal places
and this screen shows one.** Nothing is wrong on either side — WO-3.5 never specified a precision, and
`src/scores.js:256` picked `toFixed(1)` reasonably — but the mismatch lands on the teacher as a
rounding step done in her head at every row of a class of twenty-five, while re-keying, which is
exactly where a transcription error costs a student a grade.

**Why it exists.** The re-keying tax is the one this app cannot remove (the SIS has no import), so the
one thing it can do is make the number on this screen the number that goes in the box. A percentage
the teacher has to convert is worse than no percentage at all, because converting is silent and looks
like reading.

**Deliverables**
- **`formatPercent()` at `src/scores.js:256` carries two decimals.** One function, so the grade
  column, the class average and the summary all move together or none of them do.
- **Every other surface that shows a percentage is found and ruled on explicitly** — the per-student
  detail, the class average, anything WO-3.7 has since added. Either it moves to two decimals or the
  work order says in a sentence why that surface differs. **A grid at two decimals beside a summary at
  one is worse than the mismatch this is fixing.**
- **The attendance percentage is out of scope and stays as it is.** It is not re-keyed into anything.

**Out of scope** — a configurable precision. It is one teacher, one SIS, and a preference here is a
setting to maintain forever in exchange for a decision that can be made once.

**Acceptance**
- [ ] `docs/grade-math-cases.md` case 1 reads `87.00%` on the grid, not `87.0%`, and the letter beside
      it is unchanged.
- [ ] A grade that is not exact — case 1's 86.666… after the category move — reads to two decimals and
      is **rounded, not truncated**.
- [ ] The class average, the grade column and the per-student detail agree to the same precision,
      asserted together in one check rather than three.
- [ ] 👤 One row re-keyed into the real SIS with no mental arithmetic between screen and box.

---

## 2. Read these first, before writing anything

- `AGENTS.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/grade-math-cases.md`
  - `src/scores.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also open these, and what each one is for.** This is a one-line code change wearing a survey and a
harness edit. The code is the smallest part; the four items below are where the work actually is.

- **`src/scores.js:246-257`** — the header comment above `formatPercent()` states the current rule in
  prose: *"one fixed decimal place, so 88 prints as `88.0%` beside 92.4% and the column reads as one
  column of numbers rather than a ragged one."* **That comment is now wrong and must be rewritten in
  the same voice**, carrying the new reason: the SIS carries two decimals and this number is re-keyed
  into it by hand. Keep the second paragraph's rule intact and unweakened — *it is display formatting
  and nothing else; the letter is banded from the UNROUNDED percentage* — because that is the
  WO-3.2 decision this change must not brush against. Do not "improve" it; edit the precision claim
  and leave the reasoning.

- **`tools/verify-shell.mjs` — six hardcoded assertions will go red the moment you change the
  formatter, and that is the point.** They are the WO-3.5 block: `:12772`, `:12816-12817`, `:12835`,
  `:12880` assert the literal strings `'87.0%'` and `'86.7%'`, and `:12773` pairs case 1's grade with
  its letter `'B'`. Update them to the two-decimal strings. **`86.7%` becomes `86.67%`, not
  `86.66%`** — that is acceptance line 2 in one edit, since 86.666… must round rather than truncate,
  and `toFixed` already rounds. The letters must not move; if a letter changes, stop and report it
  rather than adjusting the expectation. Update the surrounding prose in that block where it quotes
  the old strings (`:12785` narrates `87.0% -> 86.7%`).

- **`tools/wo-sweep.mjs:485-570`, § the rounding checks.** Read this before you touch a rounding
  primitive. Clause (b) forbids `toFixed` in `src/letter-scale.js` outright; clause (c) hands any
  rounding primitive in a file that *touches the percentage-to-letter mapping* to the verifier as a
  **REVIEW** with the question pre-framed. `src/scores.js` calls `letterFromPercentage`, so it is on
  that path already and today's `toFixed(1)` sits there. Changing the digit does not change the
  clause's verdict — but **do not silence it, do not add `src/scores.js` to `PREDATES`, and do not
  edit `ROUNDS`.** If the sweep prints a REVIEW on this line, that is the sweep working: report it in
  your result file, quote it, and say why this instance is display formatting over a number that is
  never handed back to the arithmetic. `node tools/wo-sweep.mjs` showing *no new line* is the
  acceptance bar; a line that was already there is not a new one.

- **The third surface does not exist yet, and this is the explicit ruling the second deliverable
  asks for.** `formatPercent()` has exactly three call sites today — `src/scores.js:428` (the grade
  column), `:512` (the class average in the summary) and `:517` (that average's `aria-label`). The
  **per-student detail is WO-3.7, which is `⬜ NOT STARTED`** (`plans/work-orders/phase-3-gradebook.md:454`),
  so there is no such surface to move. Say that in one sentence in your result file, and say it in
  the code comment too, so the next reader does not go looking. The attendance percentage at
  `src/attendance.js:1196` is `Math.round(...) + '%'` and is **explicitly out of scope — leave it
  exactly as it is**; the work order says so, and it is not re-keyed into anything.

**On acceptance line 3 — "asserted together in one check rather than three."** Read that literally.
It wants a single `check()` call in `tools/verify-shell.mjs` whose condition covers the grade column
*and* the class average, so that a future change moving one without the other fails one line instead
of drifting past three that each still pass alone. The natural shape is to read the rendered grid
number and the rendered summary number in the same fixture and assert both match a two-decimal
pattern, in one condition, with a detail string that prints both values. The per-student detail is
named in that line but cannot be asserted — cover the two that exist and state the third's absence in
the check's detail text or the comment above it, so the check tells the next reader why it covers two.
Add it inside the harness's existing WO-3.5 block, following the block's own conventions; do not
start a new section and do not write a second harness.

**Scope discipline.** The change is the formatter, its comment, the harness assertions that quote the
old strings, and one new check. Everything else — a configurable precision, tidying the sweep,
touching attendance, building WO-3.7's surface — is out. If you find something that should change and
is not on that list, write it in your result file as a proposed follow-up work order rather than
doing it.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

1. `docs/grade-math-cases.md` case 1 reads `87.00%` on the grid, not `87.0%`, and the letter beside it is unchanged.
2. A grade that is not exact — case 1's 86.666… after the category move — reads to two decimals and is **rounded, not truncated**.
3. The class average, the grade column and the per-student detail agree to the same precision, asserted together in one check rather than three.
4. 👤 One row re-keyed into the real SIS with no mental arithmetic between screen and box.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

