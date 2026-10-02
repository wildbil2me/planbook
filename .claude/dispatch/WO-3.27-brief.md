# WO-3.27 — the score grid scrolls in a box of its own, and a focused cell is never under the frozen columns · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.27-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-10-01): Claude, Opus tier.** Deciding signal: this is a lift of a drawn surface (`design/mockups/proposed-scores.css` § SCORE SCROLL BOX) into `src/scores.css`, with `TESTING.md` prose owed for two 👤 readings and a judgment Trap (fix the focus defect with a declaration, not a script) — Claude column on its own merits, so no `model` override. Runner-up set aside: Codex — the CSS is small and the Acceptance is mechanically checkable, and one clean run plus the one mutation run (~9 min) would fit the cap, but ties go to Claude and the Claude column carries it independently.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.27 — the score grid scrolls in a box of its own, and a focused cell is never under the frozen columns

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-01 · **Size** M · **Depends on** WO-3.5 — the grid and the frozen pair this boxes
**Closes roadmap** *(no box. Found by the owner in daily use, 2026-10-01.)*

**Booked 2026-10-01**, owner-directed, from a sitting about the score grid's usability. Three of the
owner's five asks are one change:

- **The assignment names scroll off the top.** `.scores-grid-wrap` is `overflow-x: auto`
  (`src/scores.css:169`), and a scrolling box is what sticky positioning measures against on **both**
  axes. So `top: 0` on the head sticks to a box that never scrolls vertically, and does nothing.
- **A focused cell can sit under the frozen name and grade.** A browser scrolls a focused field into
  view against the edge of its scroll box. It does not know the left 274px of that box (190 + 84;
  252 under a coarse pointer) is covered, so a cell underneath counts as visible and nothing moves.
  Reproducible by hand in the drawing's first frame: scroll right, click the last column, Shift+Tab.
- **Sideways scrolling on the laptop is clumsy.** The horizontal scrollbar sits under the last
  student, below the bottom of the screen. A trackpad swipe also stops wherever it stops, often with
  a column half under the frozen pair.

**Deliverables**
- **Surface: `design/mockups/proposed-scores.css` § SCORE SCROLL BOX**, drawn in
  `design/mockups/score-tools.html`, lifted into `src/scores.css`. The `.boxed`
  state word folds into `.scores-grid-wrap`'s base rule on lift. Amend the drawing's banner in the
  same sitting (`design/mockups/PROTOCOL.md` rule 4).
- **The box**: `overflow: auto` both ways, with a `max-height` of the viewport less what sits above
  it. Once the page is scrolled to it, the whole box fits on one screen, head and horizontal
  scrollbar included. The summary, flag bar and toolbar above it scroll away as a page normally
  does: **the owner's ruling, Open 1**. `overscroll-behavior: contain`, so a swipe that reaches the
  grid's edge stops there and does not carry on into the page: **Open 2**.
- **The head sticks**, all four lines of it, with no compact variant: **Open 3**. The name and grade
  heads, already sticky on the left, become the corner. The head cells are reached through
  `:where()` as drawn, so the shipped corner rule's `z-index: 3` still wins on specificity rather
  than being restated.
- **`scroll-padding`** on the box: the stuck head's height on top and the frozen width on the left,
  in both pointer blocks. It becomes **a fourth value tied to the frozen widths**, alongside the ones
  the THE TWO FROZEN COLUMNS comment in `src/scores.css` says are asserted three ways, and
  `tools/verify/score-grid.mjs` asserts it with them.
- **`scroll-snap-type: x proximity`** with `scroll-snap-align: start` on the head cells, so a swipe
  settles with a column edge on the frozen edge. Never `mandatory`, which fights a slow drag.
- **Nothing in `src/scores.js` changes for any of this.** `revealScoreColumn()` and its
  `scrollIntoView({ inline: 'center' })` is the one call that scrolls the grid on purpose. It should
  keep working inside the new box; check that rather than assume it.

**Acceptance**
- [ ] With the box scrolled down, every column head's top equals the box's top, measured, on both
      pointers. The name and grade heads hold that **and** their left offsets with the box also
      scrolled sideways.
- [ ] **The focus defect, driven rather than reasoned about.** With the grid scrolled fully right,
      move into a cell whose column sits under the frozen pair, once with a real Shift+Tab and once
      with a real `ArrowLeft` (caret at the start). Both leave that cell's left edge at or right of
      the frozen pair's right edge. Enter down into a row under the stuck head leaves the cell's top
      at or below the head's bottom. Both pointers. **Mutation-proved**: with `scroll-padding`
      removed, the same keystrokes leave the cell covered and the check goes red. Revert the mutation
      before writing anything else.
- [ ] The frozen-pair assertion in `tools/verify/score-grid.mjs` covers the scroll padding as well as
      the widths and the offset, base against base and coarse against coarse. A drift in any one of
      the four goes red.
- [ ] At a 1280×800 laptop viewport with the page scrolled to the grid, the box's bottom edge, and so
      its horizontal scrollbar, is inside the viewport.
- [ ] Arriving from the glance page's *Waiting to be graded* still lands on the column with the caret
      in its first cell (`revealScoreColumn()`, WO-6.8), and that column is not under the frozen pair.
- [ ] Every existing score-grid, past-due and grade-sheet check is green unchanged, and the printed
      grade sheet is unchanged.
- [ ] 👤 On the iPad: the head stays on screen; a swipe that reaches the grid's edge stops there, and
      that feels right under a thumb rather than stuck; tapping a cell near the frozen edge brings it
      clear of the name and grade.
- [ ] 👤 On the laptop: a trackpad swipe sideways settles on a column edge, and the scrollbar is on
      screen without scrolling the page to the bottom of the class.

**Traps** — **The box changes what a page-level scroll does.** Two things already scroll on purpose:
`revealScoreColumn()`, and the past-due review's column tint, which a teacher finds by scrolling.
Read both against the box. **Do not fix the focus defect in JavaScript first.** The fix is a
declaration. A `scrollIntoView` in the key handler would cover arrows and Enter, and miss a click and
a screen reader's own focus move. Add a script fallback only if the 👤 iPad reading shows Safari
ignoring `scroll-padding` for focus, and say so in `TESTING.md`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/PROTOCOL.md`
  - `design/mockups/proposed-scores.css`
  - `design/mockups/score-tools.html`
  - `src/scores.css`
  - `src/scores.js`
  - `tools/verify/score-grid.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/scores.css` § `@media print` (~line 718) — the grade sheet prints from this grid.
- `tools/verify/past-due.mjs` and `src/past-due.js` — the past-due review's column tint, the second thing that scrolls the grid on purpose (Traps).
- `sw.js` — `CACHE` must be bumped: `src/scores.css` is in `SHELL`.

**Orchestrator notes — the traps a cold reader would not guess:**
- **The box must not reach the printed grade sheet.** A `max-height` + `overflow: auto` that survives into `@media print` clips the sheet to one screen of students. Check the print block neutralises both, and let the existing grade-sheet check prove "unchanged" rather than asserting it.
- **The THE TWO FROZEN COLUMNS comment says "asserted three ways in tools/verify-shell.mjs"**; the work order names `tools/verify/score-grid.mjs`. Find where the declared-widths check actually lives today and extend that one — do not write a second. Update the comment's count ("three ways" / the list of tied values) in the same edit so its prose does not run ahead of, or behind, its check.
- **The focus check must drive real keys over CDP** (`Input.dispatchKeyEvent`), not `el.focus()` — a scripted `.focus()` scrolls differently from a user's Shift+Tab, and the Acceptance says "a real Shift+Tab". `tools/README.md` § "Driving a browser over CDP" has the traps.
- **Mutation discipline** (`AGENTS.md`): mark the mutation with a `MUTATION` comment, and revert it before writing anything else — before the result file, before any doc edit. `grep -rn MUTATION src/ tools/` must be empty when you finish.
- **Amend the drawing's banner** (`design/mockups/PROTOCOL.md` rule 4) — both "not yet lifted" lines in `proposed-scores.css` for § SCORE SCROLL BOX, and nothing for § SCORE TOOLBAR (WO-3.28's).
- If `tools/README.md` records a `check()` count that your new checks change, update it; `wo-sweep.mjs` goes red on a stale count. Run both `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` last, after every edit.
- Do not touch WO-3.28's scope (toolbar, search, category pills, third column).

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

## 5. Done means these 8 lines, reported against one by one

1. With the box scrolled down, every column head's top equals the box's top, measured, on both pointers. The name and grade heads hold that **and** their left offsets with the box also scrolled sideways.
2. **The focus defect, driven rather than reasoned about.** With the grid scrolled fully right, move into a cell whose column sits under the frozen pair, once with a real Shift+Tab and once with a real `ArrowLeft` (caret at the start). Both leave that cell's left edge at or right of the frozen pair's right edge. Enter down into a row under the stuck head leaves the cell's top at or below the head's bottom. Both pointers. **Mutation-proved**: with `scroll-padding` removed, the same keystrokes leave the cell covered and the check goes red. Revert the mutation before writing anything else.
3. The frozen-pair assertion in `tools/verify/score-grid.mjs` covers the scroll padding as well as the widths and the offset, base against base and coarse against coarse. A drift in any one of the four goes red.
4. At a 1280×800 laptop viewport with the page scrolled to the grid, the box's bottom edge, and so its horizontal scrollbar, is inside the viewport.
5. Arriving from the glance page's *Waiting to be graded* still lands on the column with the caret in its first cell (`revealScoreColumn()`, WO-6.8), and that column is not under the frozen pair.
6. Every existing score-grid, past-due and grade-sheet check is green unchanged, and the printed grade sheet is unchanged.
7. 👤 On the iPad: the head stays on screen; a swipe that reaches the grid's edge stops there, and that feels right under a thumb rather than stuck; tapping a cell near the frozen edge brings it clear of the name and grade.
8. 👤 On the laptop: a trackpad swipe sideways settles on a column edge, and the scrollbar is on screen without scrolling the page to the bottom of the class.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

