# WO-3.5 — Score entry grid · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.5-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus**, on the rubric's own merits — not a Codex fallback, so no
probe was run. The deciding signal is that three of `ROUTING.md`'s six Claude triggers fire at once:
size `L`, a design-system lift (this screen has a drawing at `design/mockups/scores.html` built
against the real stylesheets, and a sibling view at WO-3.3 whose conventions it must match), and a
Traps section that is pure judgment — *do not reach for the modal system, however much the
surrounding code does*, which is the kind of instruction a model optimizing for consistency with its
neighbours will quietly violate. The runner-up consideration set aside: the grade arithmetic here is
fully specified in `docs/data-model.md` § Grade math and hand-computed in `docs/grade-math-cases.md`,
which is the Codex-shaped half — but WO-3.4 already **built** that engine, so nothing left in this
work order is arithmetic. It is all surface, keyboard contract, and honoring three inherited debts.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.5 — Score entry grid

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-10 · **Size** L · **Depends on** WO-3.3, WO-3.4
**Closes roadmap** Phase 3 → "Score entry grid" and "`late` and `missing` are marked, never
inferred."

**Why it exists.** The second-most-frequent action in the app, and it gets the same care as marking
attendance. Grades go in once or twice a week for five classes; if this is slow, the app is not used.

**Deliverables**
- **Surface: a main-area view**, the same shape and for the same reasons as the attendance registry —
  which was itself a dialog until WO-1.13 moved it. **Not a modal, and this one is not a preference.**
  A modal closes on `Esc`, which is the key a teacher's hand is nearest while typing a column of 25
  scores; a focus trap wants `Tab`, which in a grid means the next assignment; and `.modal-panel` is
  480px where this needs the full 1300px `.main`. Full reasoning in
  [`../gradebook-surfaces.md`](../gradebook-surfaces.md).
- **`src/scores.css`, loaded after `src/shell.css`**, styling only its own class names, with its own
  `@media (pointer: coarse)` block at the end. Two stylesheets never style the same class.
- Grid: students down, assignments across, one column per assignment.
- `Enter` moves down the column — that is the entry pattern, one assignment at a time.
- Flags reachable without leaving the keyboard: `late`, `missing`, `excused`, and clear-to-blank.
- Flags are **visible in the cell**. A score that silently isn't what you typed is the worst thing
  a gradebook can do.
- Live class grade and per-student grade updating as you type.
- Touch path: the grid is usable on an iPad, and every control is in the coarse-pointer block.

**Paste-a-column was split out to [WO-3.13](#wo-313--paste-a-column-of-scores) on 2026-08-10.** It read
as one line here — *"paste a column of scores from a clipboard, with a preview"* — and it is a second
surface with its own preview, its own alignment rules and its own way to silently put a score on the
wrong student. It closes no roadmap box, it is not on WO-G2, and nothing in the grid depends on it, so
it is the one deliverable that can leave without the rest changing shape. **This work order is still
size L**: the split removes a self-contained surface, it does not reclassify what is left. The grid,
the keyboard path, the flags, the live grades, the touch path and the three inherited debts below are
what makes it L, and none of them moved.

**Acceptance**
- [ ] Entering 25 scores down a column takes 25 keystroke-groups and no mouse.
- [ ] `Enter` at the bottom of a column does something sensible and predictable.
- [ ] A cell flagged `missing` is visually distinct from `excused` and from blank.
- [ ] Clearing a cell removes the key entirely rather than storing `{ v: null }` with no flag.
- [ ] Grades recompute live and match WO-3.4's hand-computed values.
- [ ] The grid is usable on an iPad in landscape.
- [ ] `Esc` mid-column does not close the screen or lose the teacher's place, because there is no
      dialog to close. Prove it by pressing it, not by arguing the screen is a view.
- [ ] **Moving an assignment to another category updates every displayed grade in that class
      immediately** — the two categories it leaves and joins, and the overall grade with them.
      *(Inherited from WO-3.3.)*
- [ ] **No grade is shown while the weights are wrong, and the screen says why** — the number's
      absence and the total that caused it, not a figure with a "provisional" label on it. This is the
      owner's 2026-08-09 rule, which superseded WO-3.1's original line mid-build: *there is no grade at
      all until the weights total 100.* *(Inherited from WO-3.1.)*
- [ ] **Reweighting recomputes every displayed grade in that class immediately, and the crossing works
      in both directions** — grades appear when the weights reach 100 and disappear when they leave it.
      The disappearing half is the one a build can pass while getting wrong. *(Inherited from WO-3.1.)*

**The category-move line above them is WO-3.3's, and it is a box of its own for a reason worth
keeping.** *(Added 2026-08-09 at WO-3.3's correction round 1.)* WO-3.3 built the move — the `<select>`
in the assignment editor, the row redrawing under its new group head, the score column following byte
for byte — and could not show a grade change because nothing rendered a grade. Its debt was first
pointed at the reweighting box below, and that was the wrong home: **that box is about weights crossing
100, and ticking it by walking weights across 100 would have discharged WO-3.3's line with nobody
having moved an assignment at all.** A debt that the tooling closes without the claim ever being tested
is worse than no debt, because it reads as tested. So the claim has a box that only the claim can tick.

**The last two are inherited from WO-3.1, and they are acceptance lines here rather than a note.**
*(Re-homed 2026-08-09, when WO-3.1 was ticked.)* Both name a **displayed grade**, which WO-3.1 could
not show because nothing rendered one; this is the first screen with somewhere to not-show one. They
arrived recorded in WO-3.1's own prose as "owed to WO-3.5" — which is a debt written into a work order
that nobody re-reads once it is ✅, so they are boxes now. WO-3.4:236 already holds the engine half of
the first one; these two are the screen half.

*(They sat below this paragraph until 2026-08-09 and were invisible to `wo-gate.mjs`, which ends an
Acceptance list at the next bold line — so the two boxes this phase's debt hangs on could not have held
WO-3.5 open, and `--tick WO-3.5` would have written ✅ DONE over them. Moved into the list at WO-3.11,
which is the work order that made them checkable from the other end: **WO-3.1's lines 2 and 4 point
here** with a `→ WO-3.5` marker each, and `--audit` now fails if either box is reworded out from under
its pointer. Ticking these two is what discharges that debt — see WO-3.1's follow-up note.)*

**Traps** — Do not infer anything from the due date here. That's WO-3.6, and it is a prompt, not
arithmetic. **And do not reach for the modal system**, however much the surrounding code does — see
the Surface deliverable above and `../gradebook-surfaces.md`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/shell.css`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The decision record the Surface deliverable points at — read it before you open an editor.**

- **`plans/gradebook-surfaces.md`, in full.** It exists specifically because *the evidence in this
  repository points the other way*: every class-scoped editor built before 2026-08-09 is a modal, and
  someone briefing this work order will follow that precedent and be following the evidence. Two
  sections are load-bearing for you:
  - § *"The score grid is the one that cannot be a modal"* — three reasons in the order they bite.
  - § *"How the class view navigates between its screens"* — it already tells you **exactly** how much
    plumbing this screen gets: **one line each in `VIEWS` and `CLASS_SCREENS` in `src/views.js`, one
    empty `<nav class="screen-nav" data-screen-nav>` in your own markup, and nothing else.** The
    *Scores* segment is **already drawn and disabled** in `src/screen-nav.js`; it stops being disabled
    the moment the view exists. The `.screen-nav*` styles live in `src/assignments.css` § SHARED —
    `src/scores.css` **wears them and must never restyle them.**

**The drawing of this exact screen. Lift it; do not re-derive it.**

- **`design/mockups/scores.html`** — the score grid, drawn 2026-08-09 before anything was built, linking
  the real `src/shell.css` directly so nothing was copied or approximated. **`design/mockups/proposed.css`**
  is "the half that lifts" — proposed styles for this view. `design/mockups/mockup.css` is the half that
  does **not** (the "this is a drawing" chrome); nothing from it belongs in `src/scores.css`.
- **`design/mockups/README.md`** — read the annotation list at the bottom. Amber annotations are places
  the drawing had to guess and the guess **was not the drawing's to make**; green **DECIDED** ones have
  since been answered. An amber one you resolve in code is a decision you are taking — say so in your
  report rather than absorbing it silently, which is the exact failure the README says it kept the amber
  marks to prevent.
- `CLAUDE.md` § *"Lift the design with the function — copy, don't re-derive"* and the WO-2.11 scar
  behind it: a screen that kept the reference's card *shape* and invented everything else got re-cut the
  same day. Take markup structure, measurements and colours, not just behaviour.

**The sibling that just landed, and whose conventions you match rather than invent.**

- **`src/assignments.js` and `src/assignments.css`** (WO-3.3) — the closest analogue: a main-area view
  with modal editors, group heads by category, and the § SHARED `.screen-nav*` block. This is the
  convention. `src/assignments.js:837 setAssignmentCategory()` is the category move whose grade
  consequence is your acceptance line 8.
- **`src/attendance.js` and `src/attendance.css`** — the screen this work order says it "gets the same
  care as", and the speed model to match. `src/attendance.css` records the owner's 2026-08-06 correction
  that the panel takes the **full width** of `.main`, not a 720px cap, because a narrower panel "reads
  as a window that never closed". Do not re-learn that a third time.
- `src/views.js`, `src/screen-nav.js`, `src/shell.js` — view registration and the repaint chain.
  `src/views.js` § `REMEMBERED_AS` is why a class always reopens on Attendance; do not add a preference
  that remembers Scores.

**The arithmetic is already built. Call it; do not reimplement it.**

- **`src/grade-engine.js`** (WO-3.4) is the only grade math in the app. Its four exports are
  `categoryResult`, `categoryPercentage`, `letterFromPercentage`, `weightedClassGrade`. Every live grade
  on this screen comes from them. If you find yourself summing points in `scores.js`, stop.
- **`docs/grade-math-cases.md`** — the hand-computed expected values. Acceptance line 5 says your live
  grades **match** these, so these are the numbers to drive the screen with and check against.
- `docs/data-model.md` § *Grade math* (line 247) and § *Extra credit* (line 301) — **a category may
  exceed 100% and so may the overall grade; nothing caps either.** A display that clamps at 100 discards
  points the teacher chose to award. And § *The document* (line 100) for the `scores` shape: keyed by
  assignment, then student. **A cell is always an object, never a bare number** — the work order's own
  Trap. Acceptance line 4 is about `delete`-ing the key, not writing `{ v: null }`.
- **`src/categories.js`** (WO-3.1) — the weights panel. Acceptance lines 9 and 10 are about *this screen*
  reacting to it: no grade at all while the weights do not total 100, the screen naming the total that
  caused it, and grades appearing **and disappearing** as the weights cross 100 in both directions.
  Line 10's warning is precise — *the disappearing half is the one a build can pass while getting wrong.*
- `src/store.js` for reads and writes, `src/save-indicator.js` and `src/live-region.js` for the
  save/announce conventions a fast keyboard path has to keep honest.

**Scope fences.**

- **Paste-a-column is not yours.** It was split out to **WO-3.13** on 2026-08-10 (last commit,
  `30c50fb`). Build no clipboard handler, no paste preview, no column alignment. If the grid needs a
  seam for it later, leave the seam and say so; do not build the surface.
- **Nothing infers from a due date.** That is WO-3.6, and it is a prompt rather than arithmetic.
- `TESTING.md` — add the manual checks this screen needs, in the existing voice. 👤 lines stay `- [ ]`;
  you do not have an iPad, and acceptance line 6 ("usable on an iPad in landscape") is one of them.
- `tools/README.md` § *"Driving a browser over CDP"* is at line 511 and lists **nine** traps now, not
  four. Read all nine before you conclude the app is broken.

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

## 5. Done means these 10 lines, reported against one by one

1. Entering 25 scores down a column takes 25 keystroke-groups and no mouse.
2. `Enter` at the bottom of a column does something sensible and predictable.
3. A cell flagged `missing` is visually distinct from `excused` and from blank.
4. Clearing a cell removes the key entirely rather than storing `{ v: null }` with no flag.
5. Grades recompute live and match WO-3.4's hand-computed values.
6. The grid is usable on an iPad in landscape.
7. `Esc` mid-column does not close the screen or lose the teacher's place, because there is no dialog to close. Prove it by pressing it, not by arguing the screen is a view.
8. **Moving an assignment to another category updates every displayed grade in that class immediately** — the two categories it leaves and joins, and the overall grade with them. *(Inherited from WO-3.3.)*
9. **No grade is shown while the weights are wrong, and the screen says why** — the number's absence and the total that caused it, not a figure with a "provisional" label on it. This is the owner's 2026-08-09 rule, which superseded WO-3.1's original line mid-build: *there is no grade at all until the weights total 100.* *(Inherited from WO-3.1.)*
10. **Reweighting recomputes every displayed grade in that class immediately, and the crossing works in both directions** — grades appear when the weights reach 100 and disappear when they leave it. The disappearing half is the one a build can pass while getting wrong. *(Inherited from WO-3.1.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

