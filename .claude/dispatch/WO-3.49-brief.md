# WO-3.49 — the copy dialog is one line per class, and the due date picks each copy's term · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.49-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-10-06):** Claude, at **Opus** (no model override). The deciding signal is that this is a UI redraw lifted from a mockup, with teacher-read wording and `TESTING.md` prose, and its Traps are judgment calls: held source edits, no write before confirm, and the term derived at confirm. The runner-up was Codex, since ruling 2 is specified arithmetic over `termContaining()`. It was set aside because the work adds new visual language and needs a mutation round, so it fails two Codex bullets.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.49 — the copy dialog is one line per class, and the due date picks each copy's term

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-06 · **Size** M · **Depends on** WO-3.48
**Closes roadmap** *(no box. Owner-directed, 2026-10-06.)*

**Booked 2026-10-06**, owner-directed, out of [WO-3.48](#wo-348--one-assignment-goes-into-several-classes-in-one-dialog)'s
👤 reading the same day: the dialog worked, and was clunky on the laptop and too long to scroll on
both devices. It was drawn before it was booked, and every ruling below was made against the drawing.

**Why it is next.** v167 proposes every other class's **first** term for a copy (`firstTermId()` in
`src/assignments.js`). That is invisible in Quarter 1. From **Quarter 2, which starts 2026-11-01**,
every copy defaults to Quarter 1 unless the teacher changes it on each card, which files the work in a
closed quarter, under a grade already keyed into the SIS, off the list she is looking at. Ruling 2
removes the default rather than patching it.

**Surface.** [`design/mockups/copy-classes.html`](../../design/mockups/copy-classes.html), frames A
to C, styled in [`design/mockups/proposed-copy.css`](../../design/mockups/proposed-copy.css)
§ COPY LIST, with `design/mockups/README.md` § "Copy into other classes". Frame 0 is v167 as it
ships. **Lift the section rather than re-deriving it** (`PROTOCOL.md` § When the drawing lands), and
amend its banner in the same sitting.

**Rulings, the owner's, 2026-10-06**
1. **One list, one line per class, in a wider panel** (drawn at 880px; `.modal-panel`'s `95vw` still
   caps it). The tick is the class name. Category, assigned and due sit on the same line, under
   column heads written once. The pills and the per-class cards go. Active classes only, in the class
   manager's order. No "tick every section" shortcut.
2. **No term control. The due date picks the term**, the way the school's SIS works: a copy goes into
   the term of its own class that holds its due date (`termContaining()` in `src/classes.js`). Each
   line names that term under the class name. A blank due date uses the term holding the assigned
   date. If neither date places it, or the class has no terms, **the line is blocked**: its own amber
   line says why, and the confirm stays disabled until the date changes or the class is unticked.
3. **An assigned date per line**, starting on the source's, for a section a day behind or a class
   that lost a day to the schedule. Changing it moves only itself, never the due date.
4. **The source heads the list from either door, with no tick, and stays editable.** Its category,
   assigned and due are live fields, as a quick reference and a place to fix a slip. Its edits are
   **held, not written as typed**: the confirm saves them in the same single `update()` as the
   copies, and Cancel, Close and Escape discard them with everything else. When the source has
   changed, the confirm reads *Save P1 and copy into 3 classes*. With nothing ticked the confirm stays
   disabled whether or not the source changed, so this is never an editor for the source alone.
5. **The source keeps its `termId` here.** Moving it with its due date is
   [WO-3.50](#wo-350--the-due-date-picks-an-assignments-term-in-the-editor-too)'s job, booked
   alongside this one.
6. **A line still showing the source's old date follows a change to the source's date; a line the
   teacher changed stays put.** Per field: assigned and due follow separately.
7. **No second copy in the same class.** Duplicate no longer offers the source's own class. A second
   copy in one class is made with *New*.
8. **The narrow layout is a `@media` rule**, the app's existing shape, not the drawing's
   `@container`, which was only there so one page could show both layouts. The breakpoint is where
   the four columns stop fitting, measured rather than copied. Below it each ticked line folds to two
   rows: the name, then category and both dates side by side, each with a small label.
9. **The wording is the drawing's**: the shortened lead, line notes and list note. The owner corrects
   it at the 👤 reading.

**Deliverables**
- **`renderCopy()` and its helpers redrawn as the list**: the source line, one line per offered class
  (unticked: the name and *Not copied*), the column heads, and the amber line under a line that has
  something to say. `.assign-copy-classes`, `.assign-copy-target*` and the term `<select>` go, with
  their coarse-pointer rules.
- **`proposeCopyInto()` proposes `{ classId, categoryId, assigned, due }`**, and the term is derived
  from those dates when the line is drawn and again at confirm. `firstTermId()` goes if nothing else
  calls it.
- **The source's held edits and the follow rule** (rulings 4 and 6): a touched flag per line per date
  field, held in the dialog's own state and never in the document.
- **`confirmCopy()`**: one `update()` that writes the source's changed fields and every copy, each
  copy with `newId('a')`, its line's `classId`, derived `termId`, `categoryId`, `assigned` and `due`,
  the source's `points`, and no scores. The announcement names the source when it was saved.
- **The confirm's label** per ruling 4, and WO-3.48's count wording otherwise.
- **`index.html`**: the dialog's markup, and the assignment list's hint (~line 1073), which describes
  the copy's dates and must now say each copy's term comes from its due date.
- **`src/assignments.css`**: § COPY LIST lifted, `@container` swapped for `@media` (ruling 8), and the
  coarse-pointer block updated in the same pass.
- **`tools/verify/copy-class.mjs` and `tools/verify/assignments.mjs`** rewritten for the list,
  including a run at a `--today=` date in the fixture's Quarter 2.
- **`design/mockups/proposed-copy.css`'s banner, its `README.md` section and its `index.html` entry**
  amended to say the section landed.
- **`TESTING.md` § WO-3.49**, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] A copy's `termId` is the target's term holding its due date. With the source due in Quarter 2
      and a target with dated Quarter 1 and Quarter 2, the copy lands in Quarter 2. Mutation-proved
      against restoring `firstTermId()`.
- [ ] A blank due date files the copy under the term holding its assigned date. A line neither date
      can place, or a class with no terms, is blocked: its own line says why, and the confirm is
      disabled until it is fixed or unticked.
- [ ] Each line's assigned and due are written to that copy only. Changing a line's assigned date
      leaves its due date as it was.
- [ ] Edits to the source's category, assigned or due are written only on confirm, in the same
      `update()` as the copies (`rev` moves by one). Cancel, Close and Escape leave the source
      byte-identical, with `flush()` awaited.
- [ ] The confirm reads *Save <class> and copy into N classes* exactly when the source has changed,
      and is disabled with nothing ticked even then.
- [ ] Changing the source's due date moves every line still on the old date and no line the teacher
      changed. Likewise for the assigned date.
- [ ] The source line heads the list from both doors and has no tick. Duplicate does not offer the
      source's own class. No term control exists anywhere in the dialog, and each ticked line names
      its term.
- [ ] At 1280px under a fine pointer, every class is one line with no horizontal scroll. At 820px it
      folds to two rows a class, and every control is ≥44px under a coarse pointer.
- [ ] `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit, in portrait and landscape: create an assignment and copy it
      into three sections, one of them a day behind (both its dates moved), and fix a slip on the
      source line before confirming. Read each copy and the source on their own lists, and read the
      dialog's wording. If two dates and two Clears do not fit on a portrait line, the fallback is
      taken (the dates on a row of their own) and the reading says so.

**Traps** — **Nothing in this dialog writes before the confirm**, and that includes the source: the
editor's write-as-typed contract does not apply here, and a source saved on input would survive the
Cancel that is supposed to undo it. **Derive the term from the value at confirm, not from what was
last drawn.** **Do not store the touched flags or a derived term in the document.** WO-3.48's rules
stand: copies are never a shared structure, a `categoryId` never crosses a class, the controls show
what will be written, and nothing re-dates a copy to today. If WO-3.46 lands first, a copy is live:
do not copy `held` or `committedAt`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/README.md`
  - `design/mockups/copy-classes.html`
  - `design/mockups/proposed-copy.css`
  - `src/assignments.css`
  - `src/assignments.js`
  - `src/classes.js`
  - `tools/verify/assignments.mjs`
  - `tools/verify/copy-class.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `design/mockups/PROTOCOL.md` § "When the drawing lands", which covers how to lift § COPY LIST and amend its banner.
- `src/shell.js` around line 2891 (`confirmCopy()` call site and `afterAssignmentChange()`), and the dialog's Cancel / Close / Escape paths.
- The WO-3.48 section of `plans/work-orders/phase-3-gradebook.md` and `TESTING.md` § WO-3.48, for the rules that still stand and the wording of the count.

**Orchestrator notes. These are traps the work order implies but does not spell out:**
- **WO-3.46 is `⬜ NOT STARTED`.** `held` / `committedAt` do not exist yet, so the Traps' last sentence is conditional and does not apply. Do not add those fields.
- `termContaining(classId, date)` returns null both for a class with **no dated terms** and for a date in a gap. Ruling 2 blocks both cases, so the blocked line's wording must say which case applies (no terms, versus a date outside every term). Read the function's neighbours in `src/classes.js` (around line 296, the `{ before, after }` reader) before you invent a second predicate.
- **At confirm, derive the term from the line's current values, inside or just before the one `update()`.** Never use a value cached at render. Acceptance 1's mutation (restore `firstTermId()`) must turn a check red. Revert it before you write anything else, and `grep -rn MUTATION` must be empty before you report.
- **Acceptance 4 wants `rev` +1 and a byte-identical source on Cancel, Close and Escape, with `flush()` awaited.** `update()` only *schedules* a save, so a check that does not await `flush()` is blind (WO-5.3's scar).
- **Acceptance 8 is a measurement.** Choose the breakpoint by measuring where the four columns stop fitting, and record the measured number in the CSS comment.
- **`tools/README.md` records `check()` counts that `wo-sweep` compares.** If your harness changes alter them, update the recorded number, or the sweep goes red on finished work (WO-3.26's scar).
- `index.html` and `src/*` are in `SHELL`, so bump `CACHE` in `sw.js`.
- Do not build WO-3.50 (moving the source's `termId`). Ruling 5 keeps the source's term as it is.

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

## 5. Done means these 10 lines, reported against one by one

1. A copy's `termId` is the target's term holding its due date. With the source due in Quarter 2 and a target with dated Quarter 1 and Quarter 2, the copy lands in Quarter 2. Mutation-proved against restoring `firstTermId()`.
2. A blank due date files the copy under the term holding its assigned date. A line neither date can place, or a class with no terms, is blocked: its own line says why, and the confirm is disabled until it is fixed or unticked.
3. Each line's assigned and due are written to that copy only. Changing a line's assigned date leaves its due date as it was.
4. Edits to the source's category, assigned or due are written only on confirm, in the same `update()` as the copies (`rev` moves by one). Cancel, Close and Escape leave the source byte-identical, with `flush()` awaited.
5. The confirm reads *Save <class> and copy into N classes* exactly when the source has changed, and is disabled with nothing ticked even then.
6. Changing the source's due date moves every line still on the old date and no line the teacher changed. Likewise for the assigned date.
7. The source line heads the list from both doors and has no tick. Duplicate does not offer the source's own class. No term control exists anywhere in the dialog, and each ticked line names its term.
8. At 1280px under a fine pointer, every class is one line with no horizontal scroll. At 820px it folds to two rows a class, and every control is ≥44px under a coarse pointer.
9. `CACHE` in `sw.js` is bumped.
10. 👤 On the iPad, after a force-quit, in portrait and landscape: create an assignment and copy it into three sections, one of them a day behind (both its dates moved), and fix a slip on the source line before confirming. Read each copy and the source on their own lists, and read the dialog's wording. If two dates and two Clears do not fit on a portrait line, the fallback is taken (the dates on a row of their own) and the reading says so.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

