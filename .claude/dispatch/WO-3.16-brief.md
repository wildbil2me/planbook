# WO-3.16 — left and right arrows move across the grid · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.16-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the **Opus** tier, on the work order's own merits. The deciding
signal is the Traps section: it refuses to decide the rule for you — "decide the rule deliberately
and write it down" — and the axis asymmetry it names is a judgment call about a keyboard contract
whose surrounding comments in `src/scores.js` are load-bearing reasoning, not decoration. The
runner-up was Codex (size S, four of five acceptance lines are mechanically drivable, no new visual
language); set aside because the value of this work order is in choosing the rule and recording why,
not in the twenty lines that implement it.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.16 — left and right arrows move across the grid

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-14 · **Size** S · **Depends on** WO-3.5 · **Blocks** nothing
**Closes roadmap** *(no box.)*

**Booked 2026-08-10 from the owner's first sitting with the grid.** `ArrowDown` and `ArrowUp` move
between students in a column (`src/scores.js:926-927`). `ArrowLeft` and `ArrowRight` do nothing, so
moving one assignment sideways is a reach for the pointer in the middle of a keyboard task.

**Why it exists.** WO-3.5's first acceptance line is twenty-five scores in twenty-five keystroke-groups
with no mouse, and it is satisfied **down** a column. A teacher entering one assignment for a class
does exactly that; a teacher fixing a handful of cells across a row is back on the trackpad. The grid
is two-dimensional and half its axes answer the keyboard.

**Deliverables**
- **`ArrowLeft` and `ArrowRight` move one assignment column, same student**, through the same
  clamp-rather-than-wrap rule the vertical pair uses, with the same live-region sentence at the edge —
  *"that is the last assignment"* — because a key that does nothing and says nothing reads as a key
  that was not received. That symmetry is the deliverable; a different edge behaviour on the horizontal
  axis is a bug that will read as a preference.
- **The caret and selection behave as they do vertically**: the value in the arrived-at cell is
  selected for overtyping.
- **A cell mid-edit is not stranded.** Whatever `ArrowDown` does with a partly typed value, these do the
  same thing, decided once in `handleScoreKey()` rather than twice.

**The trap.** `ArrowLeft` and `ArrowRight` are **also how a caret moves inside a number the teacher is
correcting.** Stealing them unconditionally makes it impossible to fix the middle digit of `100` without
the pointer — a worse tax than the one this is removing. Decide the rule deliberately and write it
down: the strong candidate is that the key moves cells only when the caret is already at the end of the
value it is leaving (or the field is empty or fully selected), and edits the text otherwise. **The
horizontal axis is not symmetric with the vertical one here, because up and down mean nothing to a
caret in a one-line field and left and right mean everything.**

**Out of scope** — Tab as a horizontal move. Tab is the browser's, and WO-3.5 chose `<main>` over a
dialog partly so that Tab still reaches the rest of the screen.

**Acceptance**
- [ ] `ArrowRight` from a full cell moves one assignment right, same student, value selected.
- [ ] `ArrowLeft` at the first assignment clamps, says so once, and moves nothing.
- [ ] **With the caret mid-value, `ArrowLeft` moves the caret and not the cell** — driven with a real
      keystroke at a partly corrected number, not reasoned about.
- [ ] The vertical pair still behaves exactly as WO-3.5 shipped it; its checks stay green unchanged.
- [ ] Twenty-five scores down a column is still twenty-five keystroke-groups and no mouse.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/scores.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and why:

- **`src/scores.js` around lines 990–1085** — `moveWithinColumn()` and `handleScoreKey()`. This is
  the whole surface. Read the two comment blocks above them before you touch either. They record
  *why* the vertical pair clamps rather than wraps, why the value is selected on arrival, and — in
  the `WHAT IS DELIBERATELY NOT BOUND` block — the contract that a key this screen cannot use is
  returned to the browser by answering `false`. Your new keys have to honour that contract in both
  directions: **return `true` only when you actually moved or announced**, and `false` when the
  caret should keep the key. That return value is what `src/shell.js` reads to decide whether to
  swallow the keystroke, and it is exactly the lever the trap needs.
- **`src/scores.js:473-478`** — the cells are `type="text"` with `inputmode="decimal"`, deliberately.
  That matters more than it looks: `selectionStart` / `selectionEnd` are readable on a text input and
  return `null` on `type="number"`, so the caret-position rule the trap asks for is actually
  implementable here. Do not change the input type to make anything easier.
- **`src/shell.js`** — the `keydown` listener that routes into `handleScoreKey()`, and the `focusin`
  listener that calls `noteFocusedCell()`. Understand what shell.js does with a `true` return before
  you rely on it.
- **`src/attendance.js`'s `markSelected()`** — the sibling keyboard handler this one's swallow
  contract was modelled on. Match it rather than inventing a second style.
- **`tools/verify-shell.mjs`'s WO-3.5 block** — where the existing grid-keyboard checks live,
  including the twenty-five-keystrokes-down-a-column check that acceptance line 5 says must stay
  green. Your new checks belong in that block, driven with real CDP keystrokes. Acceptance line 3
  says *driven with a real keystroke at a partly corrected number, not reasoned about* — a check
  that sets `selectionStart` by script and calls the handler directly does not satisfy it; the
  keystroke has to go through the same path a teacher's does.

**One decision the work order leaves to you, so make it explicitly and write it down in a comment.**
The vertical edge sentence is `"<column>: that is the last student. N of M entered."` — the count
half is meaningful down a column. Decide what the horizontal edge sentence is, whether a count
belongs in it at all, and say why in the comment. The work order names the shape
(*"that is the last assignment"*) and demands symmetry of *behaviour* at the edge; it does not
demand a word-for-word copy of a sentence whose second half may not mean anything sideways.

**Scope discipline.** The Out of scope line is Tab. Beyond that: do not touch the vertical pair's
behaviour, do not refactor `moveWithinColumn()` into a generalised mover unless the shared clamp and
announce logic genuinely falls out of it — and if you do, the vertical checks staying green
unchanged is acceptance line 4 and the burden is on you. Do not tidy the comment blocks.

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

1. `ArrowRight` from a full cell moves one assignment right, same student, value selected.
2. `ArrowLeft` at the first assignment clamps, says so once, and moves nothing.
3. **With the caret mid-value, `ArrowLeft` moves the caret and not the cell** — driven with a real keystroke at a partly corrected number, not reasoned about.
4. The vertical pair still behaves exactly as WO-3.5 shipped it; its checks stay green unchanged.
5. Twenty-five scores down a column is still twenty-five keystroke-groups and no mouse.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

