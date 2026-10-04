# WO-3.43 — removing a category moves its work to *no category* · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.43-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus** (no model override): the deciding signal is teacher-facing prose in two modes — the confirm dialog, two announcements, the removal announcement, and `docs/data-model.md` — plus a reversal of an argued ruling (WO-3.1's cascade) whose Traps are judgment, not mechanics. The runner-up, Codex, was set aside because the deliverable that matters is wording, and the Acceptance demands a mutation proof on top of a clean `verify-shell.mjs` run.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.43 — removing a category moves its work to *no category*

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-04 · **Size** S · **Depends on** WO-3.31 — the control that makes a points class reachable, and the mode the dialog now has to speak
**Closes roadmap** *(no box. Owner-directed, 2026-10-04.)*

**Booked 2026-10-04**, owner-directed, out of WO-3.31's 👤 reading. **Reachable today**: since
WO-3.31 a teacher can put a class on total points, and the remove-category confirm in that class
reads, word for word:

> Removing "Essays" from English III (A) takes the work filed under it as well. This cannot be
> undone, and a backup file is the only way back. If you only want it to stop counting, set its
> weight to 0 instead — the assignments stay and the grade stops using them.
>
> 1 assignment and 5 scores · The remaining categories keep the weights they have, so this class
> totals 50% until you set them.

In a points class the weight field is disabled, a weight of 0 does not stop a category counting, and
there is no weight total. The verifier predicted it and the owner met it on the laptop.

**The ruling — the owner, 2026-10-04.** Removing a category **no longer destroys its work, in either
mode.** The assignments and their scores stay, and the work goes to *no category*, which already
exists and already means the right thing in each mode (`docs/data-model.md`, the 2026-10-02 ruling):
- **Weighted:** the work counts for nothing until it is filed again, and the remaining categories keep
  the weights they have, so the class totals less than 100% and its grades are provisional until the
  teacher sets them. *"That is what I thought we had set up."* The weights line in the dialog stays.
- **Total points:** the work still counts. It just isn't categorized, so it shows in the *no
  category* row.

**This reverses WO-3.1's third Deliverable** — "removing a category warns about the assignments it
takes with it" — and the long comment above `removeCategory()` in `src/categories.js` that argues the
cascade. That comment's case against leaving work behind was that an orphan is **silent**. It no
longer is: the assignment list draws a *Not in a category* group (red in a weighted class, amber in a
points class, WO-3.36), the score grid and grade sheet name *no category*, and the points engine
counts it as a row. Rewrite the comment to say so, rather than deleting it. **The header comment of `src/assignments.js`
(~20–30) also says a category removal destroys the work** — it names `applyRemoval()` — and changes
in the same sitting.

**Deliverables**
- **`applyRemoval()` deletes the category and nothing else.** No assignment and no score column goes.
  Each affected assignment in this class has its `categoryId` set to `''`, so a backup never carries
  an id for a category that no longer exists. `''` is what an assignment created in a class with no
  categories already carries (`src/assignments.js`, ~920), so this is not a new value: not `null`,
  and not a deleted key. A `categoryId` that matches no category in its class
  already reads as *no category* everywhere, so the clearing is tidiness, not a change in meaning.
- **The confirm speaks the class's mode, and stops being a warning.** There is still a dialog when
  work is filed under the category, because the grade changes. It says where the work goes and what
  that does to the grade:
  - weighted: the work stops counting until it is filed under another category, and the remaining
    weights total N% until she sets them;
  - points: the work keeps counting, under *no category*, and grades don't change.
  The "cannot be undone, a backup file is the only way back" sentence, the "set its weight to 0"
  advice and the red danger styling go, in both modes. The button keeps naming the category.
- **The two announcements in `src/categories.js` that speak weights in a points class** say the
  points version too: the weights-total announcement in `renderTotal()` (~290, *"…not 100. Grades are
  provisional."*), and the add-category one (~437, *"…at 0 percent."*). The removal announcement says
  where the work went rather than counting what was destroyed.
- **The "Not in a category" notice on the assignment list** keeps its wording, but check it now reads
  right for work that arrived by removal. Its comment names the two ways in; removal is a third.
- **`docs/data-model.md`** loses any sentence saying removal cascades, and the *no category*
  paragraph names removal as the usual way in.

**Acceptance**
- [ ] Removing a category that holds work leaves every one of its assignments in the document with
      `categoryId` equal to `''`, and every score column for them byte-identical. Nothing in another class,
      and no other category's work, moves. **Mutation-proved**: a removal that still deletes the
      assignments goes red.
- [ ] In a weighted fixture, after the removal the class's `classGrade()` gives that work no weight,
      and the weights-total line reads the remaining total. The dialog's weights sentence names that
      same total.
- [ ] In a points fixture, every student's `classGrade()` percentage is identical before and after
      the removal, and the work appears in the *no category* row.
- [ ] The confirm's text in a points class contains no *weight*, *0%* or *backup*, and in a weighted
      class it contains no *backup* and no *set its weight to 0*.
- [ ] The two announcements read the points wording in a points class, and the weighted wording,
      byte-identical to today's, in a weighted class.
- [ ] 👤 On the laptop and the iPad, removing a category in each mode reads clearly, and the work is
      found again under *Not in a category* on the assignment list.

**Traps** — **Do not import the grade engine into `src/categories.js`.** `gradingModeOf()` lives in
`src/grade-engine.js`, and that file imports this one, so the reverse import closes a loop. Read
`cls.gradingMode === 'points'` directly, or move the sentences into `src/grading-mode.js`, which may
import both, and call it from `src/shell.js` as WO-3.31 did. **Do not keep a "delete the work too"
option.** The owner ruled for one behaviour, and a second button is how the destructive path comes
back. **Do not compute a share or a total on the screen.** The weights total is `weightTotal()`, which
the dialog already uses.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/assignments.js`
  - `src/categories.js`
  - `src/grade-engine.js`
  - `src/grading-mode.js`
  - `src/shell.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `index.html` ~85–95 (the header comment naming #categoryRemoveModal as counting what a removal *destroys*), ~2730–2752 (the comment above the modal arguing the cascade leaves no orphan, and the modal itself — `class-action-btn danger` on the button is the red styling that goes).
- `tools/verify/categories-weights.mjs` (~60–90, ~330–360) and `tools/verify/assignments.mjs` (~760–780) already drive this dialog. **Some of their assertions encode the cascade** (assignment/score counts gone, the old lead text). Those are now asserting the old ruling: change them to the new one, and say in your result which checks you rewrote and why. Do not delete a check to get green — re-point it.

**Orchestrator notes — the traps this brief adds:**
- **Scores stay too.** `applyRemoval()` today also `delete`s `d.scores[assignmentId]`. The first Acceptance line wants every score column byte-identical, so that line goes as well; only `cls.categories` loses an entry and the affected assignments get `categoryId = ''`. Class-scoped exactly as now (`a.classId === cls.id && a.categoryId === cat.id`) — the WO-3.3 comment above `assignmentsIn()` still applies to *which* assignments move, so keep that guard and reword that comment's "destroyed" to what now happens.
- **`removalCounts()` may keep counting** — the dialog still shows when work is filed under the category — but the fact line stops being a count of what is destroyed. Wording is yours, within the Deliverable's two mode sentences.
- **The weighted fact line keeps its number from `weightTotal(cls) - weightOf(cat)`** (or an equivalent that computes nothing new on screen). The second Acceptance line wants the dialog's total and the post-removal weights-total line to name the same number — assert both in the harness.
- **Points mode check**: `cls.gradingMode === 'points'` read directly in `src/categories.js` (see Traps — importing `src/grade-engine.js` closes a loop). If you go the `src/grading-mode.js` route instead, wire it from `src/shell.js` as WO-3.31 did.
- **`index.html` ~2683** (the categories modal's hint, *"To stop a category counting without losing anything, set its weight to 0"*) is **not** the confirm and is not in this Deliverable list. If the new behaviour makes it false, say so in your result as a proposed follow-up; don't widen into it.
- **Any change to `index.html` or a `src/` file in `SHELL` bumps `CACHE` in `sw.js`** (currently `planbook-shell-v161`).
- **Mutation proof**: re-insert the old `d.assignments = … filter(…)` delete (or the scores delete), run, see red, revert. Mark it `// MUTATION` while it is in, and revert it **before writing anything else** if the run goes wrong — `AGENTS.md` § "If you were dispatched with a work order". `grep -rn MUTATION src tools index.html` must be empty when you finish.
- The `CHANGELOG.md` entry: draft it in your result, do not commit it. `TESTING.md`: add the WO-3.43 👤 section (laptop + iPad, both modes, find the work again under *Not in a category*). Leave the 👤 line `- [ ]`.
- Do not commit. The tree is the hand-off.

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

## 5. Done means these 6 lines, reported against one by one

1. Removing a category that holds work leaves every one of its assignments in the document with `categoryId` equal to `''`, and every score column for them byte-identical. Nothing in another class, and no other category's work, moves. **Mutation-proved**: a removal that still deletes the assignments goes red.
2. In a weighted fixture, after the removal the class's `classGrade()` gives that work no weight, and the weights-total line reads the remaining total. The dialog's weights sentence names that same total.
3. In a points fixture, every student's `classGrade()` percentage is identical before and after the removal, and the work appears in the *no category* row.
4. The confirm's text in a points class contains no *weight*, *0%* or *backup*, and in a weighted class it contains no *backup* and no *set its weight to 0*.
5. The two announcements read the points wording in a points class, and the weighted wording, byte-identical to today's, in a weighted class.
6. 👤 On the laptop and the iPad, removing a category in each mode reads clearly, and the work is found again under *Not in a category* on the assignment list.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

