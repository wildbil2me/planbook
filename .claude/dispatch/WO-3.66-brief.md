# WO-3.66 — a nameless close from the Scores screen shows its warning on the Scores screen · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.66-result.md` — as your last act, and return it in-band too.

**Routing (Claude Opus, on its own merits).** The deciding signal is ruling (d): the work is a new
shared module whose whole reason to exist is an import loop the sweep cannot see, plus a placement on
a teacher-facing screen checked by DOM and computed style — judgment traps, not arithmetic. Codex was
the runner-up (size S, every question ruled) and was set aside because ties go to Claude. Note: the
running-order row in `plans/work-orders/README.md` (row 171) still says "not ruled"; **the work
order's own *Ruled* section governs** — nothing is open at dispatch.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.66 — a nameless close from the Scores screen shows its warning on the Scores screen

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** S · **Depends on** WO-3.58
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12** out of [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled),
the case [WO-3.57](#wo-357--the-nameless-warning-reaches-the-teacher-wherever-the-editor-closed)'s
ruling 4 handed it. A blank close of the editor opened from the Scores screen's `+ New assignment`
names the work *Untitled assignment* and sets WO-3.56's amber warning on the assignment list's note
(`#assignmentsMoved`, keyed by class and term). The Scores screen does not draw that note, so the
teacher there sees nothing; a screen reader hears it, and the list shows it on its next visit.
**This is a screen, not a dialog, so WO-3.58's rule does not settle it**; the placement is the
owner's ruling below.

**Surface.** [`design/mockups/dialog-messages.html`](../../design/mockups/dialog-messages.html),
frames S0, S1 and S2. The line is the shipped `.assign-moved.assign-moved-nameless`, worn as it is.

**Ruled, the owner, 2026-10-12: S1** — the same line drawn on Scores, read from the one note the
list keeps, so the two screens can never disagree and opening the editor clears it on both, placed
after the past-due prompt and before the summary row: one notice band at the top of the body, in the
list's own order (past-due, then the note). *(S2, under the summary row beside `+ New assignment`,
was the alternative drawn and not taken.)*

**Deliverables**
- **`index.html`**: a host for the note in `#scoresView`, after the past-due prompt and before the
  summary row (S1).
- **A module of its own for the note** (ruling (d) below): `listNote`, the setters
  `src/assignments.js` uses today, and one paint that fills both hosts from it, the way
  `src/past-due.js` paints its two. **`src/assignments.js`** and **`src/scores.js`** each import it and
  call the paint on render for the class and term on screen; neither imports the other.
- **The harness**: beside WO-3.57's door checks — a blank close from Scores' `+ New assignment`
  draws the owner's sentence in amber on the Scores screen, checked in the DOM and computed style,
  not the live region; and opening the editor again takes it down on both screens.
- **`TESTING.md` § WO-3.66** (and an amendment to § WO-3.57's door table, which records this door as
  not drawn), the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] A blank close from the Scores screen's `+ New assignment` leaves the owner's sentence, in
      amber, on the Scores screen, between the past-due prompt and the summary row (S1). The list shows the same note for the same
      class and term.
- [ ] A create from Scores filed under another term draws the indigo moved note on Scores too, from
      the same `listNote` — the whole note, amber ahead of indigo on one line when both apply.
- [ ] Opening the editor again clears it from both screens; another class or term does not draw it.
- [ ] On a class with no roster, the note still draws on Scores, with `#scoresTop` hidden under it —
      checked, not assumed.
- [ ] No import loop: the note's module imports neither `src/assignments.js` nor `src/scores.js`, and
      `src/scores.js` does not import `src/assignments.js`.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit, upright: + New assignment from Scores, then ✕ with no name
      — the warning is noticed on Scores.

**Ruled — the owner, 2026-10-12, after WO-3.58's verdict.** Nothing is left open at dispatch. *(It
said so before (d) and (e) existed, and was wrong for an afternoon: a reading of the row against the
code found both, and the owner took the proposals the same day.)*
- **(a) S1** — as under *Ruled* above.
- **(b) The indigo moved-work note comes too: the Scores host draws the whole note.** A create from
  Scores filed under another term moves the class's open term, so the grid changes term under the
  teacher — the confusion WO-3.57's ruling 2 put the indigo sentence there to answer. Taking the
  amber case only would mean filtering `listNote`, a second reading of the one note.
- **(c) A scrolled list's note off screen is accepted and recorded, not built.** Scrolling to the
  note on close yanks the teacher away from the row she was working on; pinning it covers rows on a
  portrait iPad for every note. The live region announces it, it is there on scrolling up, and both
  screens' `+ New assignment` sit near the top where it draws. If an iPad reading ever shows it
  missed, that is a row of its own with an observed case. This discharges WO-3.57's ruling 3.

- **(d) The note moves to a module of its own**, which both screens import. The Deliverables first
  had `src/scores.js` call `paintListNote()` out of `src/assignments.js`, and that closes an import
  loop — `src/assignments.js` imports `src/held-column.js`, which imports `src/scores.js` (for
  `formatPercent` and `gridOrder`) — which this repo has refused by hand and `wo-sweep.mjs` would not
  catch. Of the three answers — a module of its own, `src/shell.js` painting the note after it
  repaints Scores, or accepting the loop — the first was taken: it is the shape `src/past-due.js`
  already has with `[data-past-due]`, and the plainest form of the Trap's "one note, never a copy".
- **(e) A class with no roster draws the note on Scores.** The host sits **outside** `#scoresTop`, so
  hiding that row does not hide it, and the one "nothing to grade" state the note can coexist with is
  an empty roster — the note exists only while its term holds an assignment. That is correct: the
  sentence is still true, and the list draws it too. The harness checks it draws rather than leaving
  it unexamined.

**Traps** — **A second note is a second truth**: the Scores host reads `listNote`, never a copy of
it, or the two screens drift. **The Scores screen hides its top row in "nothing to grade" states**
(`#scoresTop`); check where the host sits in those.

**Not in scope** — the warning's wording and colour (WO-3.56's rulings), and the ten dialogs
(WO-3.63, WO-3.64, WO-3.65).

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/dialog-messages.html`
  - `src/assignments.js`
  - `src/held-column.js`
  - `src/past-due.js`
  - `src/scores.js`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/past-due.js` is the **shape to copy**: one module, one paint, two hosts. Read how its
  `[data-past-due]` hosts are filled before designing the note module's paint.
- `src/assignments.js` — every `listNote` reader and writer (today ~lines 343, 748–757, 961, 1557,
  1636, 1677, 1727, 1880, 1908–1911, 3159). All writes must go through the new module's setters;
  **no `listNote` binding may remain in `src/assignments.js`** afterwards, or there are two notes.
- `sw.js` — the new module must be added to `SHELL` as well as `CACHE` bumped, or the installed app
  fails offline on an import.
- `TESTING.md` § WO-3.57 — its door table, which you amend (this door is now drawn).

**Traps this orchestrator saw on the way in — check them, do not take them as answers:**
- Today `paintListNote()` **drops** the note when painted for a different class/term (line ~750).
  Moved into a shared paint, a visit to Scores on another class drops the list's note too. That
  matches the list's existing behaviour and Acceptance line 3, but decide it consciously and say so in
  a comment and in your result — a Scores visit must not drop a note it was never shown merely
  because Scores rendered an *older* class/term first during the editor close sequence.
- After the blank close from Scores, confirm **Scores re-renders** (or is repainted) so the note
  appears at once; and that `openAssignmentEditor()` clearing the note repaints **both** hosts.
- Ruling (e): the host sits **outside** `#scoresTop`. Assert it in the harness on an empty-roster
  class; do not reason it.
- The harness check is the DOM and computed colour of the Scores host, **never the live region**.
- If you mutate to prove a check bites, revert it before writing anything else, and
  `grep -rn MUTATION` the tree before your result file (AGENTS.md).

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

1. A blank close from the Scores screen's `+ New assignment` leaves the owner's sentence, in amber, on the Scores screen, between the past-due prompt and the summary row (S1). The list shows the same note for the same class and term.
2. A create from Scores filed under another term draws the indigo moved note on Scores too, from the same `listNote` — the whole note, amber ahead of indigo on one line when both apply.
3. Opening the editor again clears it from both screens; another class or term does not draw it.
4. On a class with no roster, the note still draws on Scores, with `#scoresTop` hidden under it — checked, not assumed.
5. No import loop: the note's module imports neither `src/assignments.js` nor `src/scores.js`, and `src/scores.js` does not import `src/assignments.js`.
6. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
7. 👤 On the iPad, after a force-quit, upright: + New assignment from Scores, then ✕ with no name — the warning is noticed on Scores.

**Write `TESTING.md` § WO-3.66 — it is a deliverable, not a permission.** Add `### WO-3.66 — a nameless close from the Scores screen shows its warning on the Scores screen` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.66` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

