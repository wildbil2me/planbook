# WO-3.34 — student detail draws a points class in a weighted class's words · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.34-result.md` — as your last act, and return it in-band too.

**Routing: Claude, Opus tier (no model override).** Most of this work order is wording a teacher
reads on screen in points mode (the breakdown's Weight column, the empty-category sentence, the
"counts at" footnote, the scores hint, the assignments screen), and the extra-credit row is a
decision about what to draw. That puts it in ROUTING.md's Claude column under "teacher-facing prose"
and "Traps about judgment". The runner-up was Codex: the cents bug on its own is mechanical, and one
clean run plus one mutation run fits the 20-minute cap. I set that aside because the bug is the
smaller part of the work.

**The `copyClass()` ruling.** The owner gave no contrary ruling at dispatch, so build the booking's
proposal: the copy carries `gradingMode`. Copy the key only when the source has it, so a weighted
copy writes no key.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.34 — student detail draws a points class in a weighted class's words

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-03 · **Size** S · **Depends on** WO-3.30 — the `classGrade()` shape and `gradingModeOf()` this reads
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.30's verdict. The verifier passed WO-3.30 on all
nine lines and found one defect outside them, and the implementer and verifier both listed wording
that WO-3.31 does not cover. **None of it can be reached today**, because nothing writes
`gradingMode` until [WO-3.31](#wo-331--the-categories-editor-offers-total-points). WO-3.31 depends on
this row so that the control does not ship before the screens are correct.

**The defect.** In a points class, a category holding only extra credit (possible 0, earned > 0)
counts toward the grade but draws as empty on student detail. The verifier's case: Tests 15/20 plus
a Bonus category scored 2/0 grades at 85%. `breakdown()` in `src/detail.js` decides a row is empty
on `category.percentage === null` and prints "—", while `contributionCents()` keys on
`contribution !== null` and gives the Bonus row 10.00. The column on screen adds up to 75.00 under
an Overall of 85.00%. The same happens to the `no category` row when all its work is extra credit.
This breaks the promise WO-3.30's third Deliverable makes for a detail screen. Its Acceptance line 3
tests the engine only, which is why it passed.

**Deliverables**
- **A row that contributes is drawn as contributing.** The test for an empty row agrees with
  `contributionCents()`. An extra-credit-only row shows its earned points over 0, no category
  percentage, and its cents in *Contributes*, so the column adds up to the Overall.
- **The breakdown speaks the class's mode.** In points mode the *Weight* column, the "its N% is
  shared across the others" sentence for an empty category, and the "counts at" footnote do not talk
  about weights. Points mode shows each category's share of the points, from the grade's own
  `effectiveWeight`. Weighted mode draws exactly as today.
- **The scores hint in `index.html`** stops saying "Until the weights total 100% there is no grade
  at all" without qualifying it to weighted classes.
- **`src/assignments.js` stops calling uncategorized work "counted by nothing"** in a points class.
  It is counted there, by WO-3.30's ruling. Weighted wording stays.
- **`copyClass()` carries `gradingMode`.** It copies an explicit field list today, so a copied points
  class becomes weighted. The mode is a grading decision about the class, like its weights, which the
  copy already keeps. *(This is the booking's proposal. If the owner rules the other way at dispatch,
  the Deliverable becomes a sentence in the copy dialog saying the copy is weighted.)*

**Acceptance**
- [ ] In a points fixture with an extra-credit-only category, student detail's *Contributes* column
      sums to the Overall to the cent, and that row shows its earned points and its cents.
      **Mutation-proved**: putting the empty test back on `percentage === null` goes red.
- [ ] The same holds for a `no category` row whose only graded work is extra credit.
- [ ] A weighted class's student detail is byte-identical before and after, on the harness's
      existing fixtures.
- [ ] In a points class, no text on student detail, in the scores hint, or on the assignments screen
      calls the grade weighted or says uncategorized work counts for nothing.
- [ ] Copying a points class gives a points class, and copying a weighted class writes no
      `gradingMode` key.

**Traps** — **Do not compute a share on the screen.** `effectiveWeight` and `contribution` come from
`classGrade()`, and `pointsShare()` is the editor's. **Do not change the engine's returned shape.**
WO-3.30 just proved it identical in weighted mode across 393,780 comparisons. **Do not seed
`gradingMode` on the copy of a weighted class.** An absent key is weighted.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/detail.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/classes.js`: **`copyClass()` lives here (~line 1130)**, not in `src/assignments.js`. The work
  order's file list leaves it out.
- `src/grade-engine.js`: `gradingModeOf()` (~line 373) and the `classGrade()` return shape. Read
  these only. The Traps forbid any change to the engine's shape.
- `tools/verify/points-grade.mjs`: WO-3.30's points-mode harness section. It already opens student
  detail through the grid and reads `.detail-break` rows and the tfoot. Put the extra-credit fixtures
  and assertions here, or in a sibling section registered in `tools/verify-shell.mjs` the same way
  (~line 344). Do not write a new harness.
- `tools/verify/grade-detail.mjs`: the weighted detail checks. Acceptance line 3 is
  "byte-identical before and after" on the existing fixtures, so capture the weighted
  `.detail-break` markup before your first edit and compare it after the last one. Cite how you
  compared it.
- `.claude/dispatch/WO-3.30-result.md`, if present: what the implementer of WO-3.30 already listed as
  wording WO-3.31 does not cover.

**Traps found at dispatch**

- **A second consumer of `contributionCents()` (`src/detail.js` ~line 853)** feeds `share` to
  another surface, probably the printed grade sheet. If that surface uses its own empty-row test,
  it has the same defect. If the fix you make to the shared test covers it, say so. If it needs a
  separate edit, that edit is outside these Deliverables: report it as a proposed follow-up and do
  not make it.
- **The "counted by nothing" wording in `src/assignments.js` comes in two kinds.** Some is code
  comments (lines ~27, ~588, ~1158). The rest is text the teacher sees (~574, ~1123, ~1329, and the
  "nothing counts it at all" orphan notice ~597). Acceptance line 4 is about visible text in a
  points class. Branch the visible strings on `gradingModeOf(cls)`. Keep the weighted strings
  exactly as they are, because Acceptance line 3 and existing harness checks pin them. Line ~574 is
  the zero-weight-category sentence, which has no meaning in points mode. Decide what points mode
  says there and give your reason.
- **The categories editor's own wording belongs to WO-3.31.** Do not touch it.
- **Bump `CACHE` in `sw.js`.** `index.html` and `src/` files are in `SHELL`.
- **A mutation goes in with a `MUTATION` comment and comes out before you write anything else.**
  Afterwards, run `grep -rn MUTATION src/ index.html` and cite the empty result.

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

## 5. Done means these 5 lines, reported against one by one

1. In a points fixture with an extra-credit-only category, student detail's *Contributes* column sums to the Overall to the cent, and that row shows its earned points and its cents. **Mutation-proved**: putting the empty test back on `percentage === null` goes red.
2. The same holds for a `no category` row whose only graded work is extra credit.
3. A weighted class's student detail is byte-identical before and after, on the harness's existing fixtures.
4. In a points class, no text on student detail, in the scores hint, or on the assignments screen calls the grade weighted or says uncategorized work counts for nothing.
5. Copying a points class gives a points class, and copying a weighted class writes no `gradingMode` key.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

