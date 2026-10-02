# WO-3.29 — the score grid narrows by student · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.29-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal: this moves the live matcher out of attendance — the critical-path screen — under a Trap that is judgment rather than mechanics ("do not improve the rule"), and where the search box lives relative to `renderScores()`'s rebuild is a structural choice the focus Acceptance line depends on. Runner-up set aside: Codex, on Size S and a mechanically checkable Acceptance list; ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.29 — the score grid narrows by student

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-02 · **Size** S · **Depends on** WO-3.5 — the grid whose rows this narrows
**Closes roadmap** *(no box. Owner-requested, 2026-10-01.)*

**Booked 2026-10-02**, owner-directed, cut out of [WO-3.28](#wo-328--the-score-grid-narrows-to-one-category)
along rows and columns. This half narrows rows only. It touches no frozen column and none of
WO-3.27's scroll padding, so it needs nothing but the shipped grid. **It goes first**: it is the
smaller half, and it lifts the toolbar WO-3.28 then adds its pills to.

A teacher wants to find one student's row in a class of thirty without scrolling for it.

**Deliverables**
- **Surface: `design/mockups/proposed-scores.css` § SCORE TOOLBAR**, drawn in
  `design/mockups/score-tools.html`: `.scores-toolbar` and `.scores-found`, lifted into
  `src/scores.css`. `.scores-filter-pills` is WO-3.28's and stays drawn. The toolbar is
  `.attendance-toolbar` value for value, wearing `.search-box` as shipped. Amend the drawing's banner
  in the same sitting.
- **Type-to-narrow, by the attendance search's rule exactly**: **Open 7**, as revised by the owner on
  2026-10-02. The query is trimmed and lower-cased, and a row shows when it appears anywhere in
  `rosterName()` ("Last, First") or `fullName()` ("First Last"). *ma* finds Amari, Mahoney, Marcus
  and Maya. **No `nickname`, on either screen.** Rows that do not match are not rendered. A count,
  *4 of 14 students*, sits beside the box. When nothing matches, the grid's own `.scores-empty` line
  shows, with no head over nothing. **Escape in the search box clears it** (the grid still does
  nothing on Escape).
- **One matcher, and attendance's behaviour does not change.** The test in `visibleStudents()` in
  `src/attendance.js` (~3160) moves into one exported function, `src/roster.js` beside `fullName()`
  being the natural home, and both screens call it, so two identical-looking boxes cannot answer one
  query differently. This is a move, not a rewrite: attendance must answer every query exactly as it
  does today. *(Booked on 2026-10-01 as a new prefix-and-nickname rule that attendance would move to.
  The owner reversed that on 2026-10-02: the attendance rule already makes sense, so it is kept.)*
- **The search is not remembered.** It is empty whenever the screen is opened, and nothing reaches
  `localStorage`. The class average, the blank count and every grade stay whole-class figures while
  it narrows the rows. The printed grade sheet ignores it.

**Acceptance**
- [ ] On a roster holding Amari Johnson, Ben Castillo, Marcus Bell and Thomas Reed, typing *ma*
      shows Amari, Marcus and Thomas and not Ben; *bell, m* (the "Last, First" form) shows Marcus; a
      query matching only a student's `nickname` shows no one. The count reads *3 of N students*. A
      query matching no one draws the empty line and no grid head. Escape clears the box and every
      row returns.
- [ ] **The attendance search answers every one of those queries identically**, through the same
      exported function, and the harness or a sweep check shows there is one matcher rather than two.
      Every existing attendance search check is green **unchanged**: the move altered no answer.
- [ ] With the rows narrowed, Enter and `ArrowDown` stop at the last shown row and `ArrowUp` at the
      first, with the edge sentence the grid already speaks.
- [ ] Typing a query keeps the caret in the search box from the first letter to the last, measured by
      `document.activeElement` after every keystroke.
- [ ] The class average, the blank count and every overall grade are byte-identical with the search
      on and off.
- [ ] Leaving the screen and coming back shows an empty search, and no `planbook_` key was written.
- [ ] The search box measures ≥44px under the coarse pointer.
- [ ] 👤 On the iPad, typing a name with the on-screen keyboard up leaves the narrowed rows in view
      above it.

**Traps** — **Do not hide rows with CSS.** The key handlers in `src/scores.js` can still walk into a
`display: none` row. **Do not rebuild the search box on a keystroke.** `src/attendance.js` keeps its
search field as markup in `index.html` and re-renders only the rows, so the element a keystroke came
from cannot be destroyed under it (its comment above `setSearch()` says why). `renderScores()`
rebuilds every cell, so the search box has to live outside what it rebuilds, or the box loses focus
mid-word. **Do not improve the rule on the way through.** Attendance's answers are the acceptance,
and a better matcher is a change to a screen nobody asked to change.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/proposed-scores.css`
  - `design/mockups/score-tools.html`
  - `src/attendance.js`
  - `src/roster.js`
  - `src/scores.css`
  - `src/scores.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `index.html` ~841 (`.attendance-toolbar` / `.search-box` markup, the shape to copy) and ~1114–1292
  (`#scoresView`, where `#scoresEmpty` already sits). The scores search box belongs in static markup
  there, outside anything `renderScores()` rebuilds — that is the attendance precedent.
- `src/attendance.js` ~2877 `setSearch()` (and its comment) and ~3156 `visibleStudents()`.
- `design/mockups/PROTOCOL.md` — the rules for amending a drawing's banner.

**Traps the work order does not spell out:**

- **Normalisation is part of "the move altered no answer."** Read how `setSearch()` stores
  `searchText` today (trimmed? lower-cased? when?) before you choose what the shared function takes.
  If the exported matcher trims or lower-cases where attendance did not, or vice versa, attendance's
  answers change on whitespace queries — that is a rewrite, not a move. Every existing attendance
  search check must pass **without being edited**; if one needs editing, stop and say so.
- **Import loops.** `src/roster.js` imports `src/classes.js`, `store.js`, `modal.js`. Both
  `attendance.js` and `scores.js` already import `rosterName`/`fullName` from it, so a matcher there
  adds no new edge — keep it that way (the matcher must import nothing new into `roster.js`).
- **"One matcher" needs a structural check, not just a fixture.** A harness check proves today's
  answers agree; a `wo-sweep.mjs` check (or harness assertion) should show neither screen carries
  its own `indexOf`/`includes` name test any more. If you add a sweep claim, update the count
  `tools/README.md` records in the same sitting — a stale count turned the sweep red at WO-3.26.
- **Edges with narrowed rows.** The edge sentence and stop-at-last-row behaviour already exist; drive
  them with real keystrokes on a narrowed grid rather than asserting on the DOM.
- **`sw.js` `CACHE`** (now `planbook-shell-v148`) must be bumped — `index.html` and `src/` are in `SHELL`.
- **Mutation discipline.** If you mutate to prove a check bites, mark it, revert it immediately, and
  `grep -rn MUTATION` the tree before writing your result file (`AGENTS.md`).
- Record the work in `TESTING.md` § WO-3.29 as prior work orders do; leave the 👤 line open.

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

1. On a roster holding Amari Johnson, Ben Castillo, Marcus Bell and Thomas Reed, typing *ma* shows Amari, Marcus and Thomas and not Ben; *bell, m* (the "Last, First" form) shows Marcus; a query matching only a student's `nickname` shows no one. The count reads *3 of N students*. A query matching no one draws the empty line and no grid head. Escape clears the box and every row returns.
2. **The attendance search answers every one of those queries identically**, through the same exported function, and the harness or a sweep check shows there is one matcher rather than two. Every existing attendance search check is green **unchanged**: the move altered no answer.
3. With the rows narrowed, Enter and `ArrowDown` stop at the last shown row and `ArrowUp` at the first, with the edge sentence the grid already speaks.
4. Typing a query keeps the caret in the search box from the first letter to the last, measured by `document.activeElement` after every keystroke.
5. The class average, the blank count and every overall grade are byte-identical with the search on and off.
6. Leaving the screen and coming back shows an empty search, and no `planbook_` key was written.
7. The search box measures ≥44px under the coarse pointer.
8. 👤 On the iPad, typing a name with the on-screen keyboard up leaves the narrowed rows in view above it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

