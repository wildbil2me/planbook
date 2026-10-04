# WO-3.31 — the categories editor offers total points · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.31-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-10-04): Claude Opus.** Deciding signals: teacher-facing prose (the editor's title and opening sentence in points mode, the confirmation's before/after and letter-change copy), a judgment trap about module structure (the `categories.js` import-loop rule), and a layout call (mockup or an explicit ruling that none is needed). Runner-up set aside: Codex, because the arithmetic is already done (`pointsShare()`, `classGrade()`, `letterFromPercentage()`) and what is left is screen design and wording, which is the Claude column. No pre-routed row exists for this work order.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.31 — the categories editor offers total points

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-04 · **Size** M · **Depends on** WO-3.30 — the engine and the `gradingMode` key this writes; WO-3.34 — the screens a points class is read on; WO-3.35 — the CSV and the extra-credit-only student; WO-3.36 — the score grid and the grade sheet; WO-3.37 — the quiet list's sentence; WO-3.38 — a bonus scored 0
**Closes roadmap** *(no box. Owner-requested, 2026-10-02.)*

**Booked 2026-10-02** beside [WO-3.30](#wo-330--a-class-can-be-graded-on-total-points), cut along the
line between the arithmetic and the control. This half is one screen and its readings. It is kept
separate so the engine half closes headless without waiting on an iPad.

**Deliverables**
- **A mode control on the categories editor**: weighted or total points, per class.
- **The editor speaks the class's mode.** Its title reads *Categories & weights* and its opening
  sentence says "how much each part counts" (`index.html`, `#categoriesModal`). Both are false in a
  points class. WO-3.36 fixed this wording on the other screens and left this dialog to this row.
- **Weights are kept and greyed, never cleared.** In points mode the weight fields are not editable
  and the weights-total line is gone, because there is nothing to add up to 100. Switching back
  restores them exactly as typed. A category added in points mode gets a weight like any other,
  disabled, and it is there when the class goes back to weighted.
- **In place of each weight, the category's share of the points**: *Tests — 62% of the points
  assigned so far*, from `pointsShare()` and nowhere else. It moves as work is assigned, so it is
  computed at render and never stored. This is the line that tells a teacher what points grading is
  actually doing: three early tests can make Tests most of the grade without anyone deciding it.
  **Draw every row `pointsShare()` returns**, including its *no category* row when loose work holds
  points: that work counts in a points grade, and without the row the shares do not add up to 100.
  **When the term holds no points yet**, every share is null and each line says so in words (*No work
  assigned yet*), never *0%* and never a blank.
- **The term is the open term**, resolved by `getOpenTermId(classId)` in `src/classes.js`. The editor
  is opened with a class id only, and one of its doors (the class list) has no term in view, so the
  term is resolved where the class id already is: `src/shell.js`.
- **Switching confirms with a before and after.** The dialog shows the class average under each mode
  and lists **every student whose letter changes** in the open term. The quarter letter is what goes
  into the SIS, so a letter change is the consequence worth naming. One `update()` writes the key, or
  deletes it on the way back. Cancelling writes nothing.
  - **The class average is the score grid's**: the mean of the students who have a grade, a student
    with no grade left out. That is `classAverage()` in `src/scores.js`, which is private today. Export
    it or move it where both can reach it. Do not write a second mean.
  - **A letter that becomes no grade is a change and is listed**, as *B → no grade*, and the reverse
    as *no grade → B*. Switching back to weighted with weights that do not total 100 takes every
    letter away, and that is the case the dialog most needs to say.
  - **The mode is per class, not per term**, so the switch regrades every term, including a finished
    quarter whose letters are already in the SIS. Under the open term's list, the dialog adds one line
    for each other term of the class where any letter changes, with a count: *Q1: 3 letters would
    change.* A term where none changes draws no line. *(The owner's ruling, 2026-10-04, before
    dispatch.)*
- **Drawn first** if the editor's layout changes enough to need it, under
  `design/mockups/PROTOCOL.md`. If the control fits the editor as shipped, the dispatch says so and
  skips the drawing.

**Acceptance**
- [ ] Switching a class to points and back leaves every weight byte-identical to what was typed, and
      leaves no `gradingMode` key behind.
- [ ] The confirmation's before and after figures equal `classGrade()` under each mode, and the
      students it lists are exactly those whose `letterFromPercentage()` differs between them, a
      letter on one side and no grade on the other counting as a difference.
      **Mutation-proved**: a list built from percentages instead of letters goes red.
- [ ] The class averages equal the score grid's own class average for the same class, term and mode.
- [ ] On a fixture class with two terms, each term other than the open one gets a line exactly when
      some letter in it changes, and the count on it is right.
- [ ] Cancelling the confirmation writes nothing: `rev` unchanged after `flush()`.
- [ ] In points mode the weight inputs are disabled, no weights-total line is drawn, the editor's
      title and opening sentence speak of points, and each category's share equals `pointsShare()`
      for it, the *no category* row included. A term with no points draws words, not *0%*.
- [ ] The mode control and the confirmation's buttons measure ≥44px under the coarse pointer.
- [ ] 👤 On the laptop and on the iPad, switching a real class to points and back reads clearly: what
      the confirmation says would change, and that the weights come back.

**Traps** — **Do not compute the share on the screen.** `pointsShare()` is the answer. **Do not put
the mode in `localStorage`.** It is a grading decision about a class, so it lives in the document and
survives a device change. **Do not soften the confirmation into a toggle.** A mode change moves every
grade in the class at once. **Do not import the grade engine into `src/categories.js`.**
`src/grade-engine.js` imports `src/categories.js`, so the reverse import closes a loop, and this repo
has refused every one of those so far. The editor's file is a leaf on purpose. The share lines and the
confirmation, which need `pointsShare()`, `classGrade()` and `letterFromPercentage()`, live in a
module `src/categories.js` does not import, and are called from `src/shell.js`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/PROTOCOL.md`
  - `src/categories.js`
  - `src/classes.js`
  - `src/grade-engine.js`
  - `src/scores.js`
  - `src/shell.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/graded-pieces.js` and `src/detail.js` — the WO-3.34/3.35/3.38 points-mode wording and the leaf-module pattern for a function two screens share. Match their voice.
- `index.html` `#categoriesModal` — the title and opening sentence this row changes.
- `src/shell.js` ~2538 (the comment above `openCategoryEditor`) — why the editor is opened with an id resolved in the shell; the open term is resolved there too.

**Orchestrator's notes — the constraints you would not guess:**
- **`classAverage()` must have one home.** It is private in `src/scores.js` (~384). Your new module must not import `src/scores.js` to get it if that drags a screen module (DOM, store, past-due) into the editor's path or closes a loop — check the graph before choosing. Moving it to a leaf that both import is the likelier answer; whatever you pick, the score grid must call the same function afterwards and its output must not change (weighted fixtures byte-identical).
- **The preview computes both modes without writing.** Computing *under each mode* means calling `classGrade()` with a class whose `gradingMode` differs — do it on a copy you construct, never by writing the document and reverting. Line 5 (`rev` unchanged after `flush()` on cancel) is what catches a write-then-undo. `update()` only *schedules* a save; await `flush()` before reading `rev` (the WO-5.3 blind spot).
- **The way back deletes the key**, it does not write `'weighted'` (`gradingModeOf()` treats absent as weighted; WO-3.34 ruled the copy writes no key for a weighted class). Weights are never touched by the switch at all — line 1 is byte-identity of what was typed, including in a category added while in points mode.
- **Letters, not percentages** (line 2 mutation): the changed-student list compares `letterFromPercentage()` on each side, and *no grade* (null) is a letter for this comparison. Other terms (line 4): one line per non-open term with a non-zero count, in the class's term order.
- **No `localStorage`, no toggle.** The control opens a confirmation; nothing changes until its confirm button.
- **Mockup:** if the editor's layout changes enough to need drawing, follow `design/mockups/PROTOCOL.md`; otherwise say in your result *that* you skipped it and *why*. Either is acceptable; silence is not.
- **Mutation discipline:** mark any deliberate mutation `MUTATION` in a comment, and revert it before writing anything else. A dead dispatch's live mutation has shipped here three times.
- **Bump `CACHE` in `sw.js`** if you change any file in `SHELL` (`index.html` included).
- `verify-shell.mjs` runs ~4–5 minutes; run it locally (it does run here). Report its summary line and `wo-sweep.mjs`'s, and the `tools/README.md` `check()` count if the sweep tracks it.

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

1. Switching a class to points and back leaves every weight byte-identical to what was typed, and leaves no `gradingMode` key behind.
2. The confirmation's before and after figures equal `classGrade()` under each mode, and the students it lists are exactly those whose `letterFromPercentage()` differs between them, a letter on one side and no grade on the other counting as a difference. **Mutation-proved**: a list built from percentages instead of letters goes red.
3. The class averages equal the score grid's own class average for the same class, term and mode.
4. On a fixture class with two terms, each term other than the open one gets a line exactly when some letter in it changes, and the count on it is right.
5. Cancelling the confirmation writes nothing: `rev` unchanged after `flush()`.
6. In points mode the weight inputs are disabled, no weights-total line is drawn, the editor's title and opening sentence speak of points, and each category's share equals `pointsShare()` for it, the *no category* row included. A term with no points draws words, not *0%*.
7. The mode control and the confirmation's buttons measure ≥44px under the coarse pointer.
8. 👤 On the laptop and on the iPad, switching a real class to points and back reads clearly: what the confirmation says would change, and that the weights come back.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

