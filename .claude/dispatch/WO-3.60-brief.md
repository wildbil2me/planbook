# WO-3.60 — the Scores screen's top matches the other class screens · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.60-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override) — the deciding signal is that this is a design lift
of a drawn section (`scores-tidy.html` frame A, § SCORES TIDY) where the owner's rule is *matching
controls sit in the same place on every class screen*, which needs eyes on Attendance's shipped top,
not just a spec. The runner-up, Codex for the self-contained sort-toggle state, was set aside: that
is the smallest part of the work, and a clean `verify-shell` run plus the `gridOrder()` mutation run
the Acceptance demands, plus the reruns a layout change always costs, do not fit the Codex cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.60 — the Scores screen's top matches the other class screens

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-11 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11**, owner-directed, out of a sitting that drew the screen first from a photograph
of the teaching iPad upright. It is the third screen in the run that tidied Attendance (WO-2.58) and
Assignments (WO-3.54), and **the owner's rule for that run is that similar, matching or analogous
controls sit in the same place on every class screen.** Scores was built before either and draws six
rows between its title and its grid. ⌨ Keys and 🖨 Grade sheet keep their words where Attendance's
doors have none, + New assignment leads a row of its own, and the search row sits between the flag
bar and the grid the flags write into. **The first of three pieces**, cut at booking to stay below
L: [WO-3.61](#wo-361--the-scores-keys-open-a-dialog-and-clear-and-note-get-a-key) moves the keys
into a dialog and gives Clear and Note a key, and
[WO-3.62](#wo-362--the-scores-column-head-gets-lighter-and-the-name-column-narrower) lightens the
grid's head.

**Surface.** [`design/mockups/scores-tidy.html`](../../design/mockups/scores-tidy.html), frame 0 (as
it ships) and frame A, styled in
[`design/mockups/proposed-scores-tidy.css`](../../design/mockups/proposed-scores-tidy.css)
§ SCORES TIDY, with `design/mockups/README.md` § "Scores, tidied". Frame E maps all five class
screens' tops; Calendar and Signals diverge from it today, and the owner ruled that is expected until
their own passes. **Lift the section rather than re-deriving it** (`PROTOCOL.md` § When the drawing
lands), and amend its banner in the same sitting. `.scores-col-meta`, `.scores-col-name.wraps` and
`.scores-col-edit` are WO-3.62's — leave them in the drawing.

**Rulings, the owner's, 2026-10-11**
1. **The summary keeps its own row** (frame A, not B), and **+ New assignment takes that row's right
   end** (`.scores-top`) — the edge WO-3.54 gave it on Assignments, one level below ← All classes.
   `#scoresActions` goes.
2. **⌨ and 🖨 lose their words and sit at the search row's right end**, in a group
   (`.scores-tools`, `.attendance-tools` value for value), each keeping its words as its
   `aria-label` and `title`. Exactly as on Attendance (WO-2.58 ruling 7).
3. **Attendance's sort toggle joins them, first in the group**: one `.class-action-btn` reading
   *Sort: **Last***, flipping to First. **A view only**: a module variable, never a preference, back
   to Last on a class switch, as `sortBy` is in `src/attendance.js`.
4. **The search box does not take the whole row.** It gives up width first, 360px down to 200
   (`.scores-find`, worn beside `.search-box`), and the pills flow beside it
   (`.scores-pills-flow`, worn beside `.scores-filter-pills`) and wrap below only when there are too
   many. **This reverses WO-2.58 ruling 8**, "the Scores box keeps its 360". The values are the
   drawing's, not `.attendance-find`'s: that box grows into spare room, and here the pills want it.
5. **The flag bar moves directly over the grid**, under the search row — Attendance's order: find,
   then write, then the grid. Its label becomes **The cell you are in**, because Clear and Note are
   not flags. The key strip and the note panel stay directly under it.
6. **The search placeholder becomes Attendance's**, *Search students…*.
7. **The summary's `·` separators stay as they ship.**

**Deliverables**
- **`index.html`**: `#scoresActions` goes; the summary and `data-assignment-new` share a
  `.scores-top` row; `#scoresToolbar` gains `.scores-tools` holding the sort toggle, ⌨ and 🖨 (both
  without words, hooks unchanged); the search box gains `.scores-find` and the new placeholder; the
  pills host gains `.scores-pills-flow`; `#scoresFlags` moves under the toolbar with its new label.
  **The comments that describe the old order go or are rewritten**, including the one above the
  toolbar arguing where the pills sit relative to the count.
- **`src/scores.js`**: the sort toggle's state, label and route; the grid drawn in that order. The
  `toggle('hidden')` calls on the empty state still find every element they hid.
- **`src/scores.css`**: § SCORES TIDY lifted — `.scores-tools`, `.scores-top`, `.scores-find`,
  `.scores-pills-flow` — with the coarse rules into the existing `(pointer: coarse)` block.
  `.scores-actions` goes if nothing else wears it.
- **The harness**: `tools/verify/score-grid.mjs` (the actions row and the Keys button's words),
  `keys-legend-scores.mjs` and `keys-legend-guards.mjs` (the button), `score-search.mjs` and
  `class-tab-keeps-screen.mjs` (the search box), `score-history.mjs` and `score-notes.mjs` (the flag
  bar), `touch-targets.mjs`, and new checks for the sort toggle. Grep `tools/verify/` for
  `scoresActions`, `scores-actions` and `Flag the cell` before trusting that list.
- **`design/mockups/proposed-scores-tidy.css`'s banner, `README.md` section and `index.html` entry**
  amended to say § SCORES TIDY's frame A half landed.
- **`TESTING.md` § WO-3.60**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] On Scores, the body's first row is the summary with + New assignment as its last control,
      right-aligned. `#scoresActions` does not exist.
- [ ] The search row ends in a group holding, in order, the sort toggle, ⌨ and 🖨. ⌨ and 🖨 carry
      no visible words; their accessible names and their `data-scores-keys` and
      `data-grades-record` hooks are unchanged.
- [ ] The sort toggle reads *Sort: Last*, puts the grid in first-name order and reads *Sort: First*
      on a tap, and is back to *Last* after a class switch. ↵ and ↓ walk the students **in the order
      drawn** under either sort. The grade sheet prints in last-name order under either, and with
      the sort's effect on `gridOrder()` planted, that check fails.
- [ ] At 1180px under a coarse pointer the search row is one line. At 820px the box is narrower
      than 360px and at least one pill sits on the box's line.
- [ ] The flag bar is the last thing above the grid — or the key strip or note panel when either is
      open — and its label reads *The cell you are in*. The search placeholder reads *Search
      students…*.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit, upright and lying down: the top reads in the order the
      drawing gives, the search row's wrap looks right with five categories, and the sort toggle
      flips the grid.

**Traps** — **Move the hooks, do not rename them.** `data-scores-keys`, `data-grades-record`,
`data-assignment-new` and `data-scores-search` route in `src/shell.js` and are what the harness
presses. **`gridOrder()` is shared with `src/grades-report.js`** so the printed sheet matches the
SIS's order; the sort must not reach it — sort a copy for the screen. **The key handlers walk the
rows the DOM holds** (`moveWithinColumn()`), so a sort that reorders data without redrawing the
rows sends ↵ to the wrong student. **Do not touch Calendar or Signals** — their divergence is ruled
expected until their own passes. **The ⌨ button still opens the strip here**; the dialog is
WO-3.61's.

**Not in scope** — the keys dialog, `?`, C and N (WO-3.61), and the column head (WO-3.62).

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/README.md`
  - `design/mockups/proposed-scores-tidy.css`
  - `design/mockups/scores-tidy.html`
  - `src/attendance.js`
  - `src/grades-report.js`
  - `src/scores.css`
  - `src/scores.js`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/score-grid.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and the traps the orchestrator wants named:

- **`index.html`'s Attendance toolbar and `src/attendance.css` `.attendance-tools` /
  `.attendance-find`** — ruling 2 says `.scores-tools` is `.attendance-tools` *value for value*;
  ruling 4 says `.scores-find` is **not** `.attendance-find`'s values. Take each from the right place.
- **`sortBy` in `src/attendance.js`** — the model for the toggle: a module variable, reset on class
  switch, never written to `localStorage`.
- **`design/mockups/PROTOCOL.md` § When the drawing lands** — lift, then amend the banner, README
  section and `design/mockups/index.html` entry to say frame A's half landed. Leave
  `.scores-col-meta`, `.scores-col-name.wraps`, `.scores-col-edit` in the drawing (WO-3.62's).
- **The grep list in Deliverables is a floor.** The orchestrator's grep for
  `scoresActions|scores-actions|Flag the cell` hit only `tools/verify/score-grid.mjs` in the harness
  — so the other named verify files reach the button, search box and flag bar by other selectors.
  Grep for the Keys button's words, the old placeholder text and `scoresFlags` too before trusting
  that a green run means nothing still asserts the old order.
- **The `gridOrder()` mutation**: plant the sort into `gridOrder()`, watch the grade-sheet check go
  red, **revert it before writing anything else**, then `grep -rn MUTATION` over every file you
  touched. A dispatch killed mid-mutation has shipped a broken tree here three times (AGENTS.md).
- **`tools/README.md` records `check()` counts per file** — if you add checks, the sweep goes red
  until that count is updated (WO-3.26's last-mile scar).
- **Session budget is tight**: the rolling window read 20.1M at dispatch, past the p25 death mark.
  Write `TESTING.md` § WO-3.60 and the result file incrementally rather than all at the end, so a
  killed run leaves a true record.

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

## 5. Done means these 7 lines, reported against one by one

1. On Scores, the body's first row is the summary with + New assignment as its last control, right-aligned. `#scoresActions` does not exist.
2. The search row ends in a group holding, in order, the sort toggle, ⌨ and 🖨. ⌨ and 🖨 carry no visible words; their accessible names and their `data-scores-keys` and `data-grades-record` hooks are unchanged.
3. The sort toggle reads *Sort: Last*, puts the grid in first-name order and reads *Sort: First* on a tap, and is back to *Last* after a class switch. ↵ and ↓ walk the students **in the order drawn** under either sort. The grade sheet prints in last-name order under either, and with the sort's effect on `gridOrder()` planted, that check fails.
4. At 1180px under a coarse pointer the search row is one line. At 820px the box is narrower than 360px and at least one pill sits on the box's line.
5. The flag bar is the last thing above the grid — or the key strip or note panel when either is open — and its label reads *The cell you are in*. The search placeholder reads *Search students…*.
6. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
7. 👤 On the iPad, after a force-quit, upright and lying down: the top reads in the order the drawing gives, the search row's wrap looks right with five categories, and the sort toggle flips the grid.

**Write `TESTING.md` § WO-3.60 — it is a deliverable, not a permission.** Add `### WO-3.60 — the Scores screen's top matches the other class screens` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.60` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

