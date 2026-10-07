# WO-3.49 — result (implementer, 2026-10-06)

**State of the tree:** built, uncommitted, row still `🤖 CLAIMED — 2026-10-06` (I did not run `--start`,
`--release` or `--tick`). Nine of ten Acceptance boxes are ticked in `plans/work-orders/phase-3-gradebook.md`
and in `TESTING.md` § WO-3.49. The 👤 line is left open. `CHANGELOG.md` is not touched; a draft is at the
foot of this file.

## Commands, and what they printed

- `node tools/verify-shell.mjs` on the delivered tree, real clock: **`1806 checks · 1806 passed · 0 failed
  · 0 skipped`**, 57,257 lines, 31.7 lines per check, 792s, `EXIT=0` (read from the log's own `EXIT=` line).
- `node tools/wo-sweep.mjs` on the delivered tree: **`48 checks · 44 passed · 0 failed · 4 to review`**.
  The call-site check reads `1800 check() call site(s) across 84 harness file(s), matching
  tools/README.md:1256`. The four reviews: two are standing (sensitive field names, due-date beside
  late/missing). The mockup-banner review names `proposed-phase6.css § CALENDAR` and `proposed.css § SHARED`,
  and both were there before this work order. The coarse-block review lists `.assign-copy-panel`, `-naming`,
  `-list`, `-heads`, `-name`, `-sub`, `-cell`, `-due` and `-skip`. All nine are containers or text, not
  touch targets. The controls inside them (the tick, the selects, the date fields, the Clears) are covered,
  and the 820px coarse check measures them.
- `node tools/verify-shell.mjs --today=2026-11-10`, a date in the fixture's Quarter 2, taken one check before
  the last one was added: `1800 checks · 1788 passed · 11 failed · 1 skipped`, exit 1. **All 36 WO-3.48/3.49
  checks in the block passed at that point**, and the create door's copy (dated 2026-11-10) landed in
  `tm349_p2b`. The eleven failures come from other sections, not from this work order. I checked that by
  running `HEAD` (`e3abd60`, extracted with `git archive` into a scratch directory) on the same date. It
  printed `1791 checks · 1780 passed · 11 failed · 0 skipped` with the same eleven: one class-tab term-nav
  check, plus `build-line.mjs` / `stuck-update.mjs` / `worker-takeover.mjs`. The last one throws *Maximum call
  stack size exceeded* from inside a `Date` call, which looks like the page-clock shift patch recursing
  after a reload. **That is a pre-existing harness defect under `--today` and worth a work order of its
  own.** I did not touch it. The single skip in my run was the Drive Connect check in About.
- An earlier full run (before the term-strip fix in the harness) failed only on my own block. Opening a
  class through its card goes to the term nearest today, which is Q1, while the fixture rows are in Q2. The
  harness now picks Q2 on the term strip.
- `grep -rn MUTATION` over the delivered code files (`src/`, `tools/`, `index.html`, `sw.js`, `design/`)
  finds only `src/shell.js:998` (*"A CLASS MUTATION ADDED LATER…"*) and the prose lines in `tools/verify/*`
  and `tools/wo-gate.mjs`. All of those are in `HEAD` unchanged. In `TESTING.md` and `tools/README.md` the
  word only appears in prose: the long-standing mutation-round write-ups, plus my own sentence in
  § WO-3.49 saying that nothing was mutated in the tree. **No armed mutation exists anywhere in the
  repository.** The mutation was made only in a throwaway copy outside it, and that copy has been deleted.

## Acceptance, line by line

1. **[x] A copy's `termId` is the target's term holding its due date; Q2 source → Q2 copy; mutation-proved
   against restoring `firstTermId()`.** The source is due 2026-11-19 (Q2). P2 has a dated Q1 and Q2, and its
   copy is written with `tm349_p2b`; P4's copy is likewise written with its Q2 term. `confirmCopy()` derives
   the term inside itself, from the line's values at that moment (`copyPlacement()`). Nothing about the term
   is held in dialog state. `firstTermId()` is deleted. **Mutation M1** restored `firstTermId()` and wrote
   `termId: firstTermId(cls)`. It ran in a throwaway copy of the tree on a three-section subset of the
   harness (the year store, classes & terms, `copy-class.mjs`):
   - On the real clock: **2 red** (the termId check and the blank-due check).
   - Under `--today=2026-11-10`: **4 red** (those two, the source-category check, and the create door's
     copy). The create-door case is the work order's *Why it is next*: dated today in Q2, its line reading
     *Q2, from its due date*, and written into Q1.
   - The subset's classes & terms section throws on its thin fixture with or without the mutation, so it is
     excluded from both counts.
   - `assignments.mjs`'s WO-3.3 duplicate check now also asserts the copy's `termId` is the target term
     holding its due date.
2. **[x] Blank due → assigned date's term; unplaceable / no-terms line blocked, says why, confirm disabled
   until fixed or unticked.**
   - BLANK (assigned 11-03, no due) into P2 reads *Q2, from its assigned date* and is written to
     `tm349_p2b` with `due: ''`.
   - Blocked lines, each with a sub-line and its own amber sentence: P5 (no terms); P3 (terms with no dates);
     P7 due Nov 10 (*falls between Q1 and Q2*).
   - P7 after its Clear falls back to its assigned date. That date is still in the gap, and the line says so
     in the assigned-date wording. With both dates blank the line says nothing places it. Given an assigned
     date of Nov 17 it is placed.
   - A press on the disabled confirm writes nothing (`rev` unmoved after `flush()`). Unticking P5 and P3
     enables the confirm.
   - The four reasons come from `getTerms`, `termIsDated`, `termContaining` and `outOfTermGap`, all in
     `src/classes.js`. No second date predicate was written.
3. **[x] Each line's dates go to that copy only; changing assigned leaves due.** P4's assigned date is changed
   and read on its own: its due date is unchanged. The written copies hold P4 11-06/11-13, P6 11-04/11-19,
   P2 11-05/11-19 and P7 11-17/blank.
4. **[x] Source edits written only on confirm, same `update()`, `rev` +1; Cancel/Close/Escape leave it
   byte-identical with `flush()` awaited.**
   - A source due edit leaves `rev` and the source JSON unchanged after `flush()`.
   - The confirm writes the source's due date with four copies: `rev` +1, everything else as it was,
     `termId` kept (ruling 5).
   - A second confirm writes a changed category and assigned date on BLANK with its copy: `rev` +1, due date
     and `termId` untouched.
   - For each of Cancel, ✕ and Escape, I edited all three source fields and ticked a line, dismissed, and
     ran `flush()`. In all three cases `rev`, the count and the source JSON were unchanged, and on reopening
     the source line showed the document's values.
5. **[x] *Save <class> and copy into N classes* exactly when changed; disabled with nothing ticked even
   then.** After a source edit the confirm reads `Save WO-3.49 English I P1 and copy into 3 classes`. With
   both dates put back it reads `Copy into 3 classes` again. With nothing ticked and the source changed it
   reads `Save … and copy into other classes` and is disabled. With one class ticked it reads `Save … and
   copy into WO-3.49 English I P2`.
6. **[x] Source due moves untouched lines only; likewise assigned.** Moving the source's due date moves P2
   and P6 and not P4 (changed by hand), and moves no assigned date. Moving the assigned date moves P2 and not
   P4 or P6, and moves no due date. The touched flags exist only in `copyTargets` entries.
7. **[x] Source line heads from both doors, no tick; Duplicate omits the source's class; no term control;
   each ticked line names its term.**
   - From both doors the source line is the first child after the heads. It contains no
     `[data-assignment-copy-class]` and no `aria-pressed`, and reads *this assignment · Q2*.
   - The offered lines exactly equal the active classes minus the source's, in document order.
   - There is no `[data-assignment-copy-term]`. The only selects are the source's category and one per
     ticked line.
   - The ticked lines read *Q2 / Year, from its due date*.
8. **[x] 1280 fine: one line, no sideways scroll; 820: two rows, every control ≥44px coarse.**
   - At 1280 fine: the source and three ticked lines each have three cells level with the name, each Clear
     inside its cell, and panel/body/list/page scroll widths all ≤0.
   - Either side of the measured breakpoint: still one line at 920px, folded at 919px.
   - At 820 coarse: `measureIn('#assignmentCopyModal')` finds no control under 44 in either dimension. Each
     ticked line folds (cells below the name, level with each other, each cue showing). Unticked lines are
     65px. No sideways scroll.
9. **[x] `CACHE` bumped.** `planbook-shell-v167` → `planbook-shell-v168`.
10. **[ ] 👤 iPad reading — not ticked, cannot be.** I have no iPad. Headless Edge says two dates and two
    Clears fit a portrait 820px line (each date cell has about 237px against about 208px needed), but Edge's
    date field is not WebKit's. Whether the fallback (dates on their own row) is needed is still open. I also
    could not judge the wording or the look against the drawing, which needs human eyes.

## Decisions the work order did not settle

- **The category follows the source too, by name, for untouched lines.** Ruling 6 names only the dates. I
  applied the same touched-flag rule to the category. Without it, a line ticked before a slip on the
  source's category was fixed would keep the slip. Its amber sentence would also name a category it was
  never matched against, because the sentence reads the held source category. This is tested (the "follows
  … by NAME" check). If the owner reads ruling 6 narrowly, reverting it is a three-line change in
  `setCopySource()` plus `touched.categoryId` and one check.
- **The breakpoint is `@media (max-width: 919px)`, one value for both pointers.** I measured it in headless
  Edge with the real stylesheets over frame A's markup. The Clear leaves its cell below an 844px viewport
  under a fine pointer and below 909px under a coarse one. I took the coarse figure plus ten pixels, which
  also falls in the gap between portrait iPads (≤834, except the 12.9" at 1024) and landscape iPads
  (≥1024). The measurement is recorded in the CSS comment and the harness asserts 920 and 919.
- **The amber line is a `<div class="assign-copy-flag">`, not the drawing's `<p>`.** `.modal-body p` (0,1,1)
  in `src/shell.css` outranks `.assign-copy-flag` and would draw it grey. WO-3.48's `<p>` note had this same
  problem, unnoticed.
- **New class `.assign-copy-naming`** carries the name row's margin, which the drawing wrote inline. The
  note's top spacing comes from the list's own `margin-bottom` rather than a rule on the shell's
  `.class-hint`.
- **Blocked reasons are four, not two.** The orchestrator's note pointed out that `termContaining()` returns
  null for both "no dated terms" and "gap". Each of the four reasons gets its own sentence, and the gap
  sentence names the terms on each side from `outOfTermGap()`.
- **The confirm with nothing ticked** reads *Copy into other classes* (formerly *Make the copy*). `confirmCopy()`
  returns without writing or closing if it is reached with nothing ticked.
- **One active class, Duplicate:** the row's Duplicate button stays. The dialog shows the source alone with
  *There is no other class to copy this into. A second copy in … is made with New.* The temptation was to
  hide Duplicate on a single-class year. I declined because it changes the row's controls, which is outside
  this work order.
- **The source's held category** starts as the document's id exactly, even if stale, so opening the dialog
  never reads as a change. It is written only if it is `''` or a category of the source's own class.
- **`copyFieldCleared()`, not `copyDateCleared()`.** `wo-sweep.mjs` § 23 counts exactly five `*DateCleared`
  exports, one per module that writes a date into the document. This one moves a proposal, as WO-3.48's
  `copyDueCleared()` did. It is still reached only from `clearDateField()`. A comment at the function says so.
- The row's Duplicate `aria-label` now reads *Duplicate … into other classes*. The old wording, *into this
  class or another one*, would be false under ruling 7.
- **The harness fixture** in `assignments.mjs` gives the target class's first term dates (2026-08-01 to
  2026-12-31) when no term holds the copy's due date, and hands the original dates back right after the copy
  checks. The run otherwise leaves that class's terms undated, which would correctly block the line.

## Out-of-scope temptations declined

- WO-3.50's work: moving the source's `termId` with its dates. Ruling 5 keeps it. The source line shows the
  stored term even when its dates now point elsewhere.
- The `--today` harness failures in `build-line` / `stuck-update` / `worker-takeover` (they also fail at
  `HEAD`). Worth booking.
- `src/shell.js`'s clearDateField comment still says "ten buttons on five surfaces". It was already stale
  after WO-3.48, and correcting it is a separate prose fix.

## Files changed

- `src/assignments.js`: the duplicating section rewritten (list, placement, held source, follow rule,
  confirm), the state block, the header note, the classes.js import, and the row's aria-label.
- `src/assignments.css`: § COPY LIST lifted, the old pill/card rules and their coarse rules removed, the
  coarse block updated, the fold `@media`, and `.assign-copy-tick` added to the grouped touch selector.
- `src/shell.js`: the hook glossary, the Clear route, and the `input` / `change` routes for the new hooks.
- `index.html`: the dialog markup (panel class, list container, no pills), the default confirm label, and
  the assignment list hint (each copy's term comes from its due date; a second copy in the same class is made
  with New).
- `sw.js`: `CACHE` set to v168.
- `tools/verify/copy-class.mjs`: the WO-3.48 block rewritten as WO-3.48/3.49 (37 sites), plus the
  `nodeToday` import.
- `tools/verify/assignments.mjs`: four checks changed in place for the list, plus the dated-term fixture.
- `tools/README.md`: call-site count 1790 → 1800, and a WO-3.49 paragraph.
- `TESTING.md`: § WO-3.49.
- `design/mockups/proposed-copy.css`: banner set to *lifted 2026-10-06*, with a note on the three departures.
- `design/mockups/README.md`: the § "Copy into other classes" section notes the lift.
- `design/mockups/index.html`: the entry notes the lift.
- `plans/work-orders/phase-3-gradebook.md`: nine Acceptance boxes ticked. The status is still the
  orchestrator's 🤖 CLAIMED.
- `.claude/dispatch/WO-3.49-result.md`: this file.

## CHANGELOG draft (the teacher's to keep, change or drop)

> **The copy dialog is one list, and the due date files each copy.** Duplicate and *Copy into other
> classes…* now show one line per class in a wider panel. The assignment you're copying heads the list, and
> its category and dates can be fixed right there: those fixes are saved with the copies, and Cancel throws
> them away. Each other class is a tick with its category, assigned date and due date on the same line. A
> section a day behind gets its own dates. There is no term menu any more: a copy goes into the term its due
> date falls in (or its assigned date, if it has no due date), the way the SIS does it, and the line says
> which. Before this, from Quarter 2 on, every copy would have been filed in Quarter 1. A class with no term
> that holds the dates says so and can't be copied into until the date changes or it's unticked. On a
> portrait iPad each class takes two rows.
