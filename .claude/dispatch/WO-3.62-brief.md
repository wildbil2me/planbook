# WO-3.62 — the Scores column head gets lighter, and the name column narrower · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.62-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override): a UI change lifted from a mockup frame, teacher-facing `TESTING.md`/`CHANGELOG.md` prose, a 👤 iPad line and a Traps section about tied numbers put it in the Claude column on its own merits. Runner-up set aside: the CSS/JS mechanics are well specified, but seven harness files plus mutation proof at ~4.4 min a `verify-shell` run would not fit Codex's 20-minute cap regardless.

**The owner's ruling at dispatch, 2026-10-12 — this settles the work order's Open line and revises ruling 5.** The frozen name column is **168px on both pointers** (laptop 190 → 168; the iPad stays at its current 168). Laptop and coarse become **one set of numbers**: name `168`, grade column `left: 168`, third column (`.scores-cat-avg`) `left: 252`, `scroll-padding-left: 252`, `.filtered` `scroll-padding-left: 336`. **Write the ruling into the work order** — amend ruling 5 and replace the **Open** paragraph with the settled answer and its date, keeping the original text visible as history (this repo strikes nothing silently). The Acceptance line *"the ruled width at both pointer sizes"* now means 168 at both.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.62 — the Scores column head gets lighter, and the name column narrower

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11** with WO-3.60, same drawing, frame C. In the photograph the column heads are
the tallest thing on the screen: five stacked lines — the name, *out of 10*, the category chip,
*due Sep 7*, and a Hold button. Names truncate at one line ("Summer Reading E…"), and the two frozen
columns take a large share of an upright iPad.

**Surface.** [`design/mockups/scores-tidy.html`](../../design/mockups/scores-tidy.html), frame C,
styled in [`design/mockups/proposed-scores-tidy.css`](../../design/mockups/proposed-scores-tidy.css)
§ SCORES TIDY — `.scores-col-meta`, `.scores-col-name.wraps` and `.scores-col-edit`.

**Rulings, the owner's, 2026-10-11**
1. **Points and due date share one line** (`.scores-col-meta`): *out of 10 · due Sep 7*.
2. **The name may wrap to two lines** before it truncates (`.scores-col-name.wraps`).
3. **The column name opens the assignment editor** for that assignment (`.scores-col-edit`), as
   the name does on Assignments (WO-3.54 ruling 2): a real `<button>` in the name's own type, indigo
   with a dotted underline under a pointer, 44px tall under a coarse one.
4. **Hold stays in the head, under the category chip, on every column.** A held column shows its
   shipped *Held* mark and *Commit* in the same place. The head goes from five lines to four.
5. **The frozen name column narrows, 190px → 156px.** The pair's `left` offsets and the
   `scroll-padding` values move with it.

**Open — the owner, at dispatch: the width under a coarse pointer.** Ruling 5 was given on the
drawing's figure, 190 → 156, and **190 is the laptop width**: under a coarse pointer
`src/scores.css` already narrows the name column to 168px, so on the iPad 156 buys 12px. Either
156 everywhere, or the coarse width narrows by the same 34px to 134 — measured against the longest
name on a real roster at the coarse type size before it is chosen.

**Deliverables**
- **`src/scores.js`**: `columnHead()` builds the name as a button carrying `data-assignment-edit`
  with the assignment's id, one meta line, the chip, and the hold line, in that order.
- **`src/scores.css`**: the three classes lifted; the name column's width and every number tied to
  it — the grade column's `left`, the third column's `left`, both `scroll-padding-left`s — at both
  pointer sizes; the stuck head's `scroll-padding` top re-measured, because it is the head's
  height and the head is shorter now.
- **The harness**: `tools/verify/score-grid.mjs`, `past-due.mjs`, `ungraded-count.mjs`,
  `held-readers.mjs`, `assigned-and-due.mjs`, `points-grade.mjs` and `score-history.mjs`, which read
  the head's lines or the frozen widths; a new check that the name opens the editor. Grep
  `tools/verify/` for `scores-col-pts`, `scores-col-due` and `190` first.
- **`design/mockups/proposed-scores-tidy.css`'s banner and `README.md` section** amended to say
  frame C landed.
- **`TESTING.md` § WO-3.62**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] Every assignment head draws, in order, the name button, one meta line holding points and due
      date, the category chip, and the hold line. No head carries a separate points or due line.
- [ ] Tapping a column's name opens the assignment editor on that assignment; the button carries
      `data-assignment-edit` and is at least 44px tall under a coarse pointer.
- [ ] A name too long for one line takes two, and one too long for two truncates.
- [ ] Every unheld column shows Hold under its chip; a held one shows *Held* and *Commit* there.
- [ ] The name column is the ruled width at both pointer sizes, and the grade column, the category
      average column and both `scroll-padding-left`s sit where the frozen pair now ends. A focus
      move by ↵ and by ⇥ leaves the cell fully clear of the frozen columns and the stuck head.
- [ ] A past-due column's due date still draws in its overdue colour inside the meta line.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit, upright: the head reads as four lines, a long name wraps,
      the name opens the editor, and Hold sits under the chip.

**Traps** — **The frozen widths are tied numbers.** `src/scores.css` names four that move together
— the name width, the grade column's `left`, the third column's `left` and `scroll-padding-left` —
at each pointer size, plus `.filtered`'s padding; a check asserts the pair. Change one and you change
them all. **The overdue colour rides on `.scores-col-due.overdue`** (WO-3.19), so the due half of
the meta line keeps that class as a span of its own. **The head is `position: sticky`** and its
height is what the top `scroll-padding` covers; measure it after the change, do not compute it.

**Not in scope** — the top of the screen (WO-3.60) and the keys (WO-3.61).

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/proposed-scores-tidy.css`
  - `design/mockups/scores-tidy.html`
  - `src/scores.css`
  - `src/scores.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/score-grid.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `design/mockups/proposed-scores-tidy.css` § SCORES TIDY and `design/mockups/README.md` — the three classes to lift, and the banner/section you amend. `design/mockups/PROTOCOL.md` for what a landed frame's banner says.
- The assignment editor's door on Assignments (WO-3.54 ruling 2) — find it with `grep -rn data-assignment-edit src/` and reuse that handler rather than writing a second one.

**Traps the work order does not spell out:**
- Once the numbers are one set, the coarse `@media` block's width/left/padding-left overrides become duplicates. Removing them is fine — but the **top** `scroll-padding` differs today (126 base, 152 coarse) because the head is a different height per pointer; **measure the new head at each pointer** in the harness and set each top from the measurement. Correct every comment that names 190, 274 or 358 — `src/scores.css` has several (lines ~293, 334, 399–405, 482) and a stale number in a comment is how the next tied-numbers edit goes wrong.
- Grep `tools/verify/` and `tools/verify-shell.mjs` for `190`, `274`, `358` as well as the class names; a check asserting the old laptop pair must move to 168/252/336, not be deleted.
- If you insert a mutation to prove a check bites, **revert it before writing anything else**, and `grep -rn MUTATION src/ tools/` before your result file (AGENTS.md).

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

## 5. Done means these 8 lines, reported against one by one

1. Every assignment head draws, in order, the name button, one meta line holding points and due date, the category chip, and the hold line. No head carries a separate points or due line.
2. Tapping a column's name opens the assignment editor on that assignment; the button carries `data-assignment-edit` and is at least 44px tall under a coarse pointer.
3. A name too long for one line takes two, and one too long for two truncates.
4. Every unheld column shows Hold under its chip; a held one shows *Held* and *Commit* there.
5. The name column is the ruled width at both pointer sizes, and the grade column, the category average column and both `scroll-padding-left`s sit where the frozen pair now ends. A focus move by ↵ and by ⇥ leaves the cell fully clear of the frozen columns and the stuck head.
6. A past-due column's due date still draws in its overdue colour inside the meta line.
7. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
8. 👤 On the iPad, after a force-quit, upright: the head reads as four lines, a long name wraps, the name opens the editor, and Hold sits under the chip.

**Write `TESTING.md` § WO-3.62 — it is a deliverable, not a permission.** Add `### WO-3.62 — the Scores column head gets lighter, and the name column narrower` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.62` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

