# WO-3.22 — the key legend omits a pair the hint beside it promises · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.22-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to **Claude at Opus**, on its own merits and not by fallback: two of
the three Deliverables are prose and judgment rather than mechanics — a legend entry written in the
panel's own idiom whose wording has to agree with an already-correct hint, and a call on whether the
legend-versus-`handleScoreKey()` comparison can be made mechanically at all, with the WO-1.18
precedent of writing down *why not* if it cannot. The runner-up I set aside: Size S with four
acceptance lines that are each mechanically checkable reads like the Codex column, but a legend is
teacher-facing prose on the one surface a teacher opens *to learn the keys*, and the `nowrap` spill
trap is an iPad-layout judgment call rather than an arithmetic one.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.22 — the key legend omits a pair the hint beside it promises

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-16 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. The roadmap's Phase 3 list names the score grid and the `late`/`missing`
rule; which keys the legend documents is inside what WO-3.5 already closed.)*

**Why it exists.** The ⌨ Keys panel at `index.html:1051` lists `↵`, `⇥`, `← →`, `L`, `M`, `X` and
`⌫`. It does not list `↑ ↓`. The hint two inches below it, at `index.html:1083`, says *"**↑ ↓** move
within the column as well"* — and they do. So the reference card a teacher opens **to learn the
keys** is the one surface in this app that does not mention a working pair, while the prose beside
it does.

**It is WO-3.5's gap and WO-3.16 is why it is visible.** The vertical pair shipped with the grid and
was documented only in the hint. WO-3.16 then added a `← →` row to the legend on 2026-08-15 — one
line above where the missing one belongs — which turned a quiet omission into a legend that
enumerates three arrow directions out of four. Booked against this work order rather than folded
into WO-3.16, because that one had shipped and been ticked, and a legend row is not an arrow-key
behaviour.

**Not a candidate for WO-3.20.** That work order is behaviour-neutral by construction and a new
legend row is a visible change; it says so itself.

**Deliverables**
- **An `↑ ↓` entry in the legend**, in the panel's own idiom and placed with the other movement keys
  rather than appended after the flags. The four flag rows stay last, because the panel's own
  comment describes them as a group and the bar carries the same four.
- **The wording agrees with the hint** at `index.html:1083`, which is already correct — the legend is
  what is wrong, and a rewrite of both that leaves them disagreeing differently is a worse outcome
  than the current state.
- **A harness check that the legend enumerates every key the grid actually binds.** The defect is not
  a missing string, it is that nothing compares the panel against the keys `handleScoreKey()` answers
  to; a fix without that check is the same omission waiting for the next key. If the comparison
  cannot be made mechanically, write down why rather than leaving the question unasked — the WO-1.18
  precedent.

**Out of scope** — rewording entries that are already right, restyling the panel, and `Home`/`End`,
which is not bound and is deliberately not being booked (see WO-3.23's note).

**Acceptance**
- [ ] The legend lists `↑ ↓` with the movement keys, and the flag rows are still last.
- [ ] The legend and the hint at `index.html:1083` describe the vertical pair the same way.
- [ ] A check fails when a key the grid binds is missing from the legend — proved by removing an
      entry and watching it go red, not by reasoning about it.
- [ ] `node tools/verify-shell.mjs` passes whole, with the count in `tools/README.md` moved in step.

**Traps** — **The panel is `nowrap` and its rows are measured.** `.scores-key` does not wrap and the
`← →` row added at WO-3.16 is already the longest in the panel; a verbose `↑ ↓` entry can spill
through its own border on an iPad with every 44px check green. That is the "Days off" spill from the
first iPad sitting, and `wo-sweep`'s `scrollWidth` against `clientWidth` measurement is the shape
that catches it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and why:

- **`index.html` lines 1047–1091** — the whole surface of this work order, both halves of it. The
  panel is `#scoresKeys` at 1051; the HTML comment above it at 1047 describes the entries as *three
  kinds of key* and calls the four flag rows "the same four the bar carries", which is the sentence
  behind "the flag rows stay last". The `← →` row at 1062 carries a long WO-3.16 comment about why
  its condition is stated asymmetrically — read it before you write a neighbouring row, and do not
  touch it. The hint whose wording you must agree with is the `.scores-hint` paragraph starting at
  1078; the vertical pair is at 1083.
- **`src/scores.js`, `handleScoreKey()` at 1153 and the comment block above it from 1128** — the
  authority on what the grid actually binds: `Enter`, `ArrowDown`, `ArrowUp`, `ArrowRight`,
  `ArrowLeft`, `Backspace`/`Delete`, and the flag letters below. The `WHAT IS DELIBERATELY NOT BOUND`
  block is the other half of that answer: `Esc` and `Tab` and every digit are named there as
  deliberate non-bindings, and `Tab` is in the legend anyway because `⇥` is the browser's tab order
  rather than this module's. **Any mechanical comparison has to survive both of those facts** — a
  check that reads "every key in the function appears in the panel" and "every key in the panel is in
  the function" is wrong in both directions as written, and saying exactly how is more than half of
  Deliverable 3.
- **`src/shell.js` around 1640** — the seam that routes a `keydown` into `handleScoreKey()`. Read it
  only far enough to know what binds; **WO-3.23 owns that seam** and is not yours.
- **`tools/README.md` § the check-count history (the run of "**N** at WO-…" paragraphs)** — the
  format for moving the count, and the house style for recording a mutation. `tools/README.md:464`
  and `:868` are the two existing `scrollWidth`-against-`clientWidth` write-ups the trap points at.
- **`tools/verify-shell.mjs` around 16060–16300** — WO-3.16's own score-grid keyboard section, the
  nearest sibling to whatever you add, including how it dispatches real keystrokes and how it
  measures a wrapper for spill.

Three notes on scope, because this work order is small and the temptations near it are not:

- **`Home`/`End` is explicitly out of scope**, and so is rewording anything already right. If your
  legend-versus-bindings check goes red on something other than `↑ ↓`, that is a defect found and it
  gets its own proposed follow-up work order in your report — **do not fix it here**, and do not
  reshape the check until it goes quiet.
- **Deliverable 3's escape hatch is real but it is not free.** "Write down why" means a written,
  specific account of what defeats the mechanical comparison, in the harness or `tools/README.md`
  where the next reader will hit it — not a sentence in the result file. Prefer the check.
- **Acceptance line 3 is a mutation, run rather than reasoned**: remove a legend entry, watch a check
  go red, quote the counts before and during, revert. `git diff --stat` must be clean of that
  mutation before you report.

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

1. The legend lists `↑ ↓` with the movement keys, and the flag rows are still last.
2. The legend and the hint at `index.html:1083` describe the vertical pair the same way.
3. A check fails when a key the grid binds is missing from the legend — proved by removing an entry and watching it go red, not by reasoning about it.
4. `node tools/verify-shell.mjs` passes whole, with the count in `tools/README.md` moved in step.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

