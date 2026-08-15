# WO-3.15 — a way to add an assignment from the score grid · implementation brief

**Route** Codex
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.15-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to Codex because the work order says outright what it is — *"This is
a button, not a feature"* — the hook (`data-assignment-new`), the handler (`src/shell.js:1122-1123`),
the repaint chain (`afterAssignmentChange()`, `src/shell.js:612`) and the markup to lift
(`index.html:826-827`) all exist already, so the job is matching an established pattern rather than
choosing one, and four of the five Acceptance lines are checkable inside `verify-shell.mjs`'s
existing WO-3.5 block. The runner-up consideration I set aside: the score grid is the screen Ship 2
is built on and *"the caret lands somewhere sensible"* is a judgment call — but it sits inside one
already-built function and this work order touches none of the sensitive surfaces. The exec-time
probe passed (`SMOKE OK`, exit 0) before this brief was written, so no fallback applies.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.15 — a way to add an assignment from the score grid

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-14 · **Size** S · **Depends on** WO-3.5 · **Blocks** nothing
**Closes roadmap** *(no box.)*

**Booked 2026-08-10 from the owner's first sitting with the grid.** The grid is where a teacher stands
when she discovers she needs a column that does not exist yet — the quiz she just gave. Today that is
*Scores → Assignments → New → back to Scores*, four navigations to reach a button that could be here.

**Why it exists.** It is the same argument the *Scores* segment itself won: the screen a teacher is
standing on should be able to do the thing she is standing there to do. Nothing about it is new
behaviour — `data-assignment-new` at `index.html:764` already creates an assignment in the open class
and term and opens the editor on it, and `src/shell.js:879` already routes it. **This is a button, not
a feature**, and the work order is small because the machinery it needs is built.

**Deliverables**
- **The existing `data-assignment-new` hook, worn on the score grid**, in `#scoresActions` beside the
  keys toggle. The same hook and the same handler — a second creator here would be a second set of
  rules for what a new assignment is.
- **The grid repaints with the new column in it** when the editor commits, through the chain WO-3.5's
  correction round built (`afterAssignmentChange()`), and the caret lands somewhere sensible rather
  than nowhere.
- **The button reads as the same button** it is on the assignment list — lift the markup and the
  class, do not re-derive a variant.

**Out of scope** — creating an assignment inline in the grid header without the editor. The editor is
where points, category and dates are set, and a column created without them is a column that has to be
visited anyway.

**Acceptance**
- [ ] Tapping it on the grid opens the same editor the assignment list opens, on a new assignment in
      the open class and term.
- [ ] Committing it adds the column to the grid **without a manual repaint or a screen change**, and
      the grade column is still correct beside it.
- [ ] Cancelling it leaves no assignment behind and no empty column on the grid.
- [ ] It measures ≥44px under the coarse pointer, inside the section that opens the view first —
      `tools/verify-shell.mjs`'s WO-3.5 block, which exists because the standing sweep cannot see this
      screen.
- [ ] 👤 Reachable under a thumb on the iPad without covering the first score cell.

---

## 2. Read these first, before writing anything

- `AGENTS.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/shell.js`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these, because every one of them is a thing this work order reuses rather than writes:

- **`index.html:826-827`** — the button to lift, verbatim. `class="class-action-btn primary"`,
  `data-assignment-new`, `aria-haspopup="dialog"`, label `+ New assignment`. The Deliverables line
  says *lift the markup and the class, do not re-derive a variant*, so a different class, a different
  label or a hand-rolled variant is a failure of the work order even if it looks better.
- **`index.html:993-1006`** — `#scoresActions` and the `data-scores-keys` button this goes beside.
  **Read the HTML comment at `index.html:999-1001` before you touch this block and do not delete
  it.** It explains why there is deliberately *no* "Assignments →" door in this toolbar — the screen
  switcher two inches above already goes there. That reasoning is about a **navigation** control and
  does not forbid this one, which does a thing rather than going somewhere; but it is exactly the
  comment a tidying pass removes as contradicted. Leave it standing, and if you add a sibling comment
  say why this control is not the one that comment rules out.
- **`src/shell.js:1122-1123`** — the existing route:
  `assignments.createAssignment(assignmentNew); afterAssignmentChange();`. It is delegated off
  `[data-assignment-new]` with `closest()`, so a correctly-lifted button on the grid should need
  **no new handler at all**. If you find yourself adding a branch, stop and re-read: a second creator
  here is the thing the first Deliverable exists to prevent.
- **`src/shell.js:596-619`** — `afterAssignmentChange()` and the long comment above it, which already
  states why a create takes `renderScores()` rather than a narrower paint ("a create adds one, which
  is structure rather than figures"). That is the mechanism behind Acceptance line 2.
- **`src/scores.js`** — `ACTIONS_ID`/`KEYS_BTN_SEL` around line 125, and whatever `renderScores()`
  does with focus. This is where *"the caret lands somewhere sensible rather than nowhere"* has to be
  decided: `renderScores()` rebuilds the grid, so focus that was on the page before the editor opened
  is gone after it commits. Decide the rule deliberately, write the reason down at the point of
  departure, and report which rule you chose and why. The work order does not name a target, so
  landing nowhere is the only answer it rules out.
- **`src/scores.css:415` and `src/scores.css:572`** — the `@media (pointer: coarse)` block where
  `.scores-keys-btn` gets its 44px, and the note at 415 about what may shrink in this toolbar and
  what may not. Acceptance line 4 is measured, not asserted.
- **`tools/verify-shell.mjs:14678-14715`** — the header of the WO-3.5 score-grid block and the
  fixture it builds. **Your checks go inside this block**, for the reason its own header gives at
  length: the standing 44px sweep skips `display: none`, every view but the open one is `.hidden`,
  and that is how ~250 score inputs went unmeasured and green. The block opens the view through the
  real screen-nav segment first, so a check added anywhere else is a check that cannot fail.

**One thing to establish before you build, because it decides Acceptance line 3.** The work order
says `data-assignment-new` *"already creates an assignment"* and then opens the editor on it — so
find out what **Cancel** does on the assignment list **today**, by driving it, before you write the
grid's version. If cancelling there already leaves a stub assignment behind, that is a pre-existing
finding to **report**, not a licence to rewrite the editor, and certainly not a licence to give the
grid its own cancel path — that would be the second set of rules the first Deliverable forbids. If a
fix is genuinely needed it goes in the shared path so both surfaces get it, and you say so plainly in
your report.

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

## 5. Done means these 5 lines, reported against one by one

1. Tapping it on the grid opens the same editor the assignment list opens, on a new assignment in the open class and term.
2. Committing it adds the column to the grid **without a manual repaint or a screen change**, and the grade column is still correct beside it.
3. Cancelling it leaves no assignment behind and no empty column on the grid.
4. It measures ≥44px under the coarse pointer, inside the section that opens the view first — `tools/verify-shell.mjs`'s WO-3.5 block, which exists because the standing sweep cannot see this screen.
5. 👤 Reachable under a thumb on the iPad without covering the first score cell.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

