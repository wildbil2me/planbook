# WO-2.58 — the attendance header gives back the rows it does not need · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.58-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-10-09): Claude Opus, on its own merits.** The deciding signal is the
Traps: the one-writer rule on `#attendanceState` (WO-2.56) is a judgment call the brief asks you to make
and name at the line, and the work is a lift of a drawn section plus teacher-facing prose (`TESTING.md`,
`CHANGELOG.md`). The runner-up was Codex for the mechanical half (ids moving, a clear button), set aside
because the Acceptance needs at least one full `verify-shell.mjs` run (~4.4 min) on top of edits to five
harness files and fit measurement at 820px — and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.58 — the attendance header gives back the rows it does not need

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-09 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-09.)*

**Booked 2026-10-09**, owner-directed, out of a sitting with two photographs of the teaching iPad. On
an upright iPad the attendance screen draws **eight rows above the first student**: the title, the
screen switcher, the state line, a totals line, the action buttons, the toolbar twice (it wraps) and
the pager, whose left half is empty. Lying down it draws seven. It was drawn before it was booked,
and every ruling below was made against the drawing.

**Surface.** [`design/mockups/attendance-header.html`](../../design/mockups/attendance-header.html),
frames A to D, styled in [`design/mockups/proposed-attendance.css`](../../design/mockups/proposed-attendance.css)
§ ATTENDANCE HEADER, with `design/mockups/README.md` § "The attendance screen". Frame 0 is v174 as it
ships. **Lift the section rather than re-deriving it** (`PROTOCOL.md` § When the drawing lands), and
amend its banner in the same sitting.

**Rulings, the owner's, 2026-10-09**
1. **The totals move inside the state line**, at its far end, muted (`.attendance-state-totals`).
   `#attendanceTotals` goes. The figures and their reader (`paintClassTotals()`) do not change.
2. **The action buttons move down to the pager's row** (`.attendance-strip`), writes on the left and
   paging on the right, directly over the grid. The state line stays where it is.
3. **The strip never wraps.** It grows from two buttons to three on the first mark, and a row that
   wraps only then drops the grid under the finger aiming at the second student — the defect WO-2.56
   removed. If the widest state does not fit at 820px under a coarse pointer, the fallbacks are
   "Un-confirm all", then ◀ and ▶ without their words, in that order, and the build says which it took.
4. **The pressed "✓ Everyone's here" goes, and "Not taken yet" takes its place** in the state *taken,
   nothing marked, nobody unconfirmed*. It removes the record, as the pressed button did.
   **"Un-confirm everyone" is offered only once there is a mark on the day** — what the comment over
   `unconfirmAll()` already says and `paintActions()` stopped doing. Offered on an empty record it
   leaves the class met with every student absent, which is the wrong undo for a wrong-class tap.
5. **A clear ✕ in both search boxes**, attendance and Scores (`.search-clear`): drawn only when the
   field has text; a tap clears it, re-runs the filter and **blurs the field**, so the iPad keyboard
   goes away; Escape clears it too. Its glyph is small and its target is 44px under a coarse pointer.
6. **The focus ring on the search box stays.** It is the app's one global `:focus-visible` ring.
7. **Sort is one toggle** (`.attendance-sort-toggle`, "Sort: **Last**"), and **⌨ Keys, 🖨 Record and
   🚪 Passes are icons only**, each keeping its words as its `aria-label` and `title`. The four are
   one group (`.attendance-tools`) that wraps together.
8. **The attendance search box gives up width before the toolbar wraps**, 360px down to 200
   (`.attendance-find`, worn beside `.search-box`). The Scores box keeps its 360.
9. **On an off-term day, the term-dates door sits with the actions on the left** rather than pushing
   to the far edge, where the pager now is.

**Open — the owner's ruling, at the 👤 reading.** Whether the fallbacks in ruling 3 were needed is
measured, not ruled; the owner reads the result.

**Deliverables**
- **`index.html`**: the totals line goes; `#attendanceActions` and `#attendancePager` move into one
  `.attendance-strip` under the toolbar; the toolbar's sort pair becomes one button and the three
  doors lose their words; a `.search-clear` button in both `.search-box`es.
- **`src/attendance.js`**: `paintActions()` per ruling 4; the totals written into the state line
  (see Traps); the sort toggle's handler and label; the clear button's show, clear, re-filter and
  blur; Escape in the attendance search box.
- **`src/scores.js`**: the same clear button behaviour on the Scores search box.
- **`src/attendance.css`**: § ATTENDANCE HEADER lifted; `.attendance-toggle-on` and its coarse rule
  go if nothing else wears them; the strip's children lose the bottom margins the strip now owns.
  `src/shell.css` takes `.search-clear`, because both screens wear it.
- **The harness**: `tools/verify/attendance.mjs`, `strip-holds-still.mjs`, `portrait-landscape.mjs`,
  `recorded-meeting-counts.mjs` and `score-search.mjs` at least, for the moved totals, the removed
  toggle, the new sort control and the clear button.
- **`design/mockups/proposed-attendance.css`'s banner, its `README.md` section and its `index.html`
  entry** amended to say the section landed.
- **`TESTING.md` § WO-2.58**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] At 820px under a coarse pointer, in the state with three action buttons, the strip is one line
      and the grid's first row is at the same height before and after the first mark on a class.
- [ ] At 1180px under a coarse pointer the toolbar is one line; at 820px it is two, with Sort and the
      three doors together on the second.
- [ ] In the state *taken, nothing marked, nobody unconfirmed* the strip offers exactly "Not taken
      yet" and "Didn't meet", and "Not taken yet" leaves the day with no record. "Un-confirm
      everyone" appears only when the day carries a mark.
- [ ] The term and year totals are inside the state line, and stay correct after a mark and after a
      term change. `#attendanceTotals` does not exist.
- [ ] On both screens the ✕ is absent on an empty field and present with text; a tap empties the
      field, shows the whole list and leaves the field unfocused; Escape empties it. It is ≥44px
      under a coarse pointer.
- [ ] The sort toggle flips the order and its own label; the three doors are icons whose accessible
      names are unchanged.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit, upright and lying down: take a class, mark one student, use
      both search boxes' ✕, and read the strip's fit and whether the grid held still on the first
      tap.

**Traps** — **The state line has one writer, and this adds a second thing to it.** `paintActions()`
sets `#attendanceState`'s `textContent`, which would wipe a totals `<span>` inside it on every write;
WO-2.56 argued at length against two writers on that node. Either `paintActions()` writes the totals
too, from the figures it is handed, or the line becomes two spans each with one writer — decide, and
say which at the line. **The search box is markup and must stay markup** (`index.html`'s note above
the toolbar): the ✕ is a sibling inside it, never a re-render of the field. **Do not change the
focus ring.** **Do not let the strip wrap "only in the rare state"** — that state is every class,
one tap in.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/README.md`
  - `design/mockups/attendance-header.html`
  - `design/mockups/proposed-attendance.css`
  - `src/attendance.css`
  - `src/attendance.js`
  - `src/scores.js`
  - `src/shell.css`
  - `tools/verify-shell.mjs`
  - `tools/verify/attendance.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Orchestrator additions — pointers and traps you would not guess:**
- `design/mockups/attendance-header.html` (frames 0, A–D) and `design/mockups/proposed-attendance.css`
  § ATTENDANCE HEADER (its banner lines ~40 and ~49 say "not yet lifted" — amend both), plus
  `design/mockups/README.md` § "The attendance screen" and `design/mockups/PROTOCOL.md` § "When the
  drawing lands". Lift the section; do not re-derive it.
- `src/attendance.js`: `paintActions()` (~line 4254, owns `#attendanceState` — read the comment block
  above it at ~4243 and at ~4123 before deciding the totals writer), `paintClassTotals()` (~4675),
  `TOTALS_ID` (~444), `unconfirmAll()` (~2334, whose comment already states ruling 4).
- **`attendanceTotals` is also an exported function name** (`src/attendance.js` ~1465, listed in
  `tools/wo-sweep.mjs` ~4114). Only the **element id** `#attendanceTotals` goes; the function stays.
  Grep for `getElementById('attendanceTotals')` and `TOTALS_ID`, not the bare word.
- Harness files reading the moved/removed nodes beyond the five the work order names:
  `tools/verify/attendance-history.mjs` (~161 reads `#attendanceTotals`), `attendance-passes.mjs`,
  `calendar-opens-on-day.mjs`, `register-opens-on-term.mjs`, `term-ended.mjs`, `term-nav.mjs`,
  `totals-byte-identical.mjs`, `totals-render-cost.mjs`. Keeping the ids `#attendanceActions` and
  `#attendancePager` as children of the new `.attendance-strip` would leave most selectors valid —
  your call, but say which at the line.
- Ruling 3's fallbacks are **measured**: report in the result file which fallback (if any) the build
  took and the widths measured at 820px coarse, because the owner reads it at the 👤 line.
- `CACHE` in `sw.js` must be bumped (`index.html` is a SHELL file). The `TESTING.md` § WO-2.58
  section is a deliverable, not optional (WO-1.66): heading under Phase 2, Acceptance lines verbatim,
  evidence for each. The 👤 line stays `- [ ]`.
- If you mutate to prove a check bites, mark the edit `MUTATION` and revert it before writing anything
  else (`AGENTS.md`).

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

1. At 820px under a coarse pointer, in the state with three action buttons, the strip is one line and the grid's first row is at the same height before and after the first mark on a class.
2. At 1180px under a coarse pointer the toolbar is one line; at 820px it is two, with Sort and the three doors together on the second.
3. In the state *taken, nothing marked, nobody unconfirmed* the strip offers exactly "Not taken yet" and "Didn't meet", and "Not taken yet" leaves the day with no record. "Un-confirm everyone" appears only when the day carries a mark.
4. The term and year totals are inside the state line, and stay correct after a mark and after a term change. `#attendanceTotals` does not exist.
5. On both screens the ✕ is absent on an empty field and present with text; a tap empties the field, shows the whole list and leaves the field unfocused; Escape empties it. It is ≥44px under a coarse pointer.
6. The sort toggle flips the order and its own label; the three doors are icons whose accessible names are unchanged.
7. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
8. 👤 On the iPad, after a force-quit, upright and lying down: take a class, mark one student, use both search boxes' ✕, and read the strip's fit and whether the grid held still on the first tap.

**Write `TESTING.md` § WO-2.58 — it is a deliverable, not a permission.** Add `### WO-2.58 — the attendance header gives back the rows it does not need` under `## Phase 2 — Attendance`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-2.58` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

