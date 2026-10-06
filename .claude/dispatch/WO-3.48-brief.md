# WO-3.48 — one assignment goes into several classes in one dialog · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.48-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is that this is a UI
re-cut with teacher-facing prose (the dates note, the announce line, the create door's lead line,
the TESTING.md re-read) and judgment Traps (no shared assignment, no per-target leak, no re-date);
the runner-up was Codex, because the write itself is specified copy arithmetic and mechanically
checkable, and it was set aside because the rubric's Claude column applies on the work's own merits.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.48 — one assignment goes into several classes in one dialog

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-05 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-05.)*

**Booked 2026-10-05**, owner-directed, from [`plans/future-features.md`](../future-features.md)
§ Assignments screen, item 1, which the owner raised on 2026-09-03: *"When creating and duplicating
an assignment, we really need the ability to add it to more than one class."* Today the same
assignment into four sections on four days is about **seven dialog trips**: three passes through the
duplicate dialog, then each copy opened again to change its due date. That cost comes every week.

**What stands and is not reopened.** The owner asked on 2026-10-05 whether a standing decision
forbids this. None does. The record forbids a **shape**, not the errand:
- **Copies, never a structure several classes point at** (`ROADMAP.md`, the class-copy box). N
  targets make N independent assignments with N new ids. `scores` stays keyed by assignment, and the
  grade math never hears about it.
- **A `categoryId` never crosses a class.** Each target matches by **name** through
  `matchCategory()` and falls back to *not in a category*, saying so before the tap (WO-3.2's trap,
  the guards in `src/categories.js`, and WO-3.40's *"Do not change the copy rule"*).
- **The control shows what the proposal holds** (`src/assignments.js` ~1127's scar). With N rows
  there are N chances to break it.

**Rulings, the owner's, 2026-10-05**
1. **A dialog, not a view.** The duplicate dialog grows into this. It is a task finished and
   dismissed, which is `gradebook-surfaces.md`'s test for a modal.
2. **Each target's due date starts on the source's due date**, and is editable per target. Blank in
   the source stays blank. `assigned` comes across as it is and is not offered per target.
3. **Creation offers it every time.** It is not a separate errand reached only through Duplicate.
   *How* it is offered is the proposal below, confirmed as written on 2026-10-05.

**Proposed at booking — confirmed as written by the owner, 2026-10-05.** Both points below are
rulings now. Build them as they stand.
- **The create door.** While the assignment editor is in a create flow (`creatingId` is set, the
  same condition that shows *Cancel*), it shows a **Copy into other classes…** button beside *Done*,
  whenever there are at least two active classes. It opens this dialog with the new assignment as
  its source. *Done* still just closes. Creation stays a single write followed by an editor, so the
  no-lost-draft contract in `createAssignment()`'s header is unchanged. The alternatives considered
  were for *Done* to open the dialog itself, which turns every create into two dialogs even for a
  one-section assignment, or a target strip inside the editor that writes copies on close, which
  makes Close, Escape and the backdrop into writes. Both were set aside.
- **No target is pre-selected.** The owner's five classes are four different courses, and a
  pre-selection is a guess about which are sections of the same one. The confirm stays disabled until
  one is ticked. The create door does not offer the source's own class, while Duplicate still does,
  because a second copy in the same class is a real errand (*Quiz 2*).

**Deliverables**
- **The class pills become multi-select**, using `aria-pressed` on the pills `renderCopyClasses()`
  already draws. `copyClassId` becomes an ordered list of targets, each holding its own proposal
  (`termId`, `categoryId`, `due`), computed by `proposeCopyInto()` when the target is ticked and
  dropped when it is unticked.
- **One row per ticked target: class · term · category · due.** The name field stays single and
  applies to every copy. The rows stack under `@media (pointer: coarse)` and at portrait iPad width,
  with no horizontal scroll and 44px targets.
- **Each row says its own fallback**: no category match, no categories, or no terms. A target with
  no terms is shown and cannot be confirmed, and the row says why. It is never silently dropped.
- **`confirmCopy()` writes every copy in one `update()`**, each with `newId('a')`, its own target's
  `classId`/`termId`/`categoryId`/`due`, the source's `assigned` and `points`, and no scores. It
  announces once, naming the classes: *"Copied Essay 2 into Period 2, Period 4 and Period 6 with no
  scores on them."*
- **The dates note changes in the same edit as the field** (the future-features row's ruling 4). It
  stops saying *"The dates come across as they are"*. It says the assigned date comes across and each
  due date starts on the source's. Update `confirmCopy()`'s long date comment to match, keeping its
  WO-3.17 reasoning: the copy still never re-dates to today.
- **The confirm button names the count**: *Copy into Period 2*, or *Copy into 3 classes*.
- **The create door** as ruled above, in `index.html` beside the editor's *Done*, shown and hidden
  by `renderEditorFields()` alongside the *Cancel* toggle.
- **The dialog says that copies are separate** in the create door's lead line. Once made, a copy
  does not follow later edits to its source, and a teacher who copies and then renames the source
  would otherwise expect the copies to follow.
- **`tools/verify/assignments.mjs` and `tools/verify/copy-class.mjs`** are updated for the new
  dialog. **`TESTING.md`'s 👤 lines on the duplicate dialog** (the iPad category-fallback reading)
  are re-read against it.
- **`plans/future-features.md`** § Assignments screen item 1 is struck with this ID.
- **`CACHE` in `sw.js` is bumped.**

**Acceptance**
- [ ] Ticking three classes and confirming writes exactly three assignments, each with a new id, its
      own class's `classId` and `termId`, no `scores` entry, and the due date its row showed.
- [ ] A target with a same-named category is filed under it. A target without one arrives in *no
      category*, and its row said so before the tap. No copy ever carries the source's
      `categoryId` into another class. Mutation-proved against carrying the id across.
- [ ] Every row's selects show the value that will be written: for each target, the selected option
      equals the proposal, including a target whose term or category has no match.
- [ ] Changing one row's due date changes only that copy's `due`. A blank source due stays blank in
      every row.
- [ ] Unticking a target removes its row, and no copy is written for it.
- [ ] A target with no terms cannot be confirmed, and its row says why.
- [ ] Cancel, Close and Escape write nothing (`flush()` awaited, as WO-5.3's harness learned).
- [ ] From a create flow with two or more active classes, the editor shows **Copy into other
      classes…**. It opens with the new assignment as the source and does not offer the source's own
      class. With one active class, the button is absent. Opening an existing row through Edit does
      not show it.
- [ ] The note no longer says the dates come across as they are.
- [ ] `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit: create an assignment, name it, copy it into three sections
      with three different due dates in one dialog, and read each copy on its own class's list.

**Traps** — **Do not build a shared assignment.** It is the tempting shape and the one ruled out.
**Do not let one target's proposal leak into another's**, for example a single `copyTermId` that the
last-ticked class overwrites. Every target's fields belong to that target's class. **Do not
re-date a copy to today**, because WO-3.17's default is creation-only. And if
[WO-3.46](#wo-346--a-score-column-can-be-held-out-of-the-grade-until-it-is-committed) lands first, a
copy is **live** whatever its source is (WO-3.46's ruling 4). Do not copy `held` or `committedAt`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/future-features.md`
  - `src/assignments.js`
  - `src/categories.js`
  - `tools/verify/assignments.mjs`
  - `tools/verify/copy-class.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/gradebook-surfaces.md` — the modal-versus-view test that ruling 1 cites.
- `index.html` — the copy modal's markup, the dates note, and the editor's *Done* / *Cancel* row.
- `src/assignments.js` ~200–210 (`creatingId`, `copyClassId`, `copyTermId`, `copyCategoryId`),
  ~860–990 (`renderEditorFields()`, `createAssignment()` and its no-lost-draft header) and
  ~1220–1500 (`matchCategory()` through `cancelCopy()`).

**Traps the work order does not spell out, from reading the tree at dispatch:**

- **Duplicate pre-selects today, and the ruling ends that.** `openCopyEditor()` calls
  `proposeCopyInto(source.classId)`, so the dialog currently opens with the source's class chosen.
  Ruling "No target is pre-selected" covers **both doors**: Duplicate opens with nothing ticked and
  the confirm disabled; it still *offers* the source's own class, and ticking it keeps the source's
  term and category (the same-class branch of `proposeCopyInto()`). Any existing harness check that
  relies on the pre-selection has to change with it — say which ones you changed and why.
- **The three scalar globals are the leak the Traps name.** Replace them; do not keep
  `copyTermId`/`copyCategoryId` alive as a "current row" alongside the list. `setCopyTerm()` /
  `setCopyCategory()` / a new due setter must each name the target they edit.
- **One `update()` for all copies** — not one per target. A loop of `update()` calls is N saves and
  N `rev`s, and the Acceptance asks for one write.
- **WO-3.46 has not landed** (`⬜ NOT STARTED` at dispatch). There is no `held` / `committedAt` on an
  assignment yet. Build the copy from named fields as `confirmCopy()` already does — never by
  spreading the source — and the Trap is honoured by construction; do not add those fields.
- **The create door's source is the draft just created.** Opening the copy dialog from the editor
  must not lose the editor's in-flight edits and must not turn Close/Escape on the editor into a
  write. Decide whether the editor closes when the copy dialog opens, and say in the result file
  what you chose and why.
- **Mutation-prove line 2** (carry `source.categoryId` across) with the harness, revert, and record
  the red line. Per `AGENTS.md`: revert a mutation before writing anything else, and
  `grep -rn MUTATION` the tree before you report.
- **Bump `CACHE` in `sw.js`** (it reads `planbook-shell-v166` at dispatch).

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

## 5. Done means these 11 lines, reported against one by one

1. Ticking three classes and confirming writes exactly three assignments, each with a new id, its own class's `classId` and `termId`, no `scores` entry, and the due date its row showed.
2. A target with a same-named category is filed under it. A target without one arrives in *no category*, and its row said so before the tap. No copy ever carries the source's `categoryId` into another class. Mutation-proved against carrying the id across.
3. Every row's selects show the value that will be written: for each target, the selected option equals the proposal, including a target whose term or category has no match.
4. Changing one row's due date changes only that copy's `due`. A blank source due stays blank in every row.
5. Unticking a target removes its row, and no copy is written for it.
6. A target with no terms cannot be confirmed, and its row says why.
7. Cancel, Close and Escape write nothing (`flush()` awaited, as WO-5.3's harness learned).
8. From a create flow with two or more active classes, the editor shows **Copy into other classes…**. It opens with the new assignment as the source and does not offer the source's own class. With one active class, the button is absent. Opening an existing row through Edit does not show it.
9. The note no longer says the dates come across as they are.
10. `CACHE` in `sw.js` is bumped.
11. 👤 On the iPad, after a force-quit: create an assignment, name it, copy it into three sections with three different due dates in one dialog, and read each copy on its own class's list.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

