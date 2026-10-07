# WO-3.51 — result

**Implementer:** Claude Opus (work-order-implementer), 2026-10-06. Harness only; not committed.
I found no app defect: all five new checks went green on the delivered tree the first time they ran.

## What was built

Five `check()` sites in `tools/verify/copy-class.mjs`, labelled `WO-3.51:`, placed right after
WO-3.49's dismissals check (the *"untouched line follows the source's category by NAME"* check).

- **Fixture.** They plant one source assignment of their own through the seam: `a351_reading`,
  *WO-3.51 Close reading*, in P1's Q2, assigned 2026-11-05 and due 2026-11-12. They then go back
  onto the list with the existing `toSourceList()`, because no screen repaints on a store write.
  This leaves the ESSAY and BLANK rows untouched, and the checks either side of the new ones still
  read them. The fixture teardown at the foot of the file removes the new assignment along with
  the others, since it is in a `c_wo349_` class.
- **The press.** Every press goes through the existing `clearOn('[data-assignment-copy-source="due"|"assigned"]')`,
  which clicks `#assignmentCopyList [data-date-field]:has(...) [data-date-clear]`. That is the same
  helper and selector shape used for P7's Clears. No `.value = ''` plus a dispatched event anywhere.
- **Touched and untouched lines.** P2 and P6 are ticked, and each is touched in the *other* field:
  P2's assigned date is typed as 2026-11-06 and P6's due date as 2026-11-20 (via the existing
  `pick()`). That way each Clear has one line that follows it and one that keeps its own date.
- **Readers.** The checks reuse `READ349` and `DOC349`. The only new reader is
  `JSON.stringify(window.planbook.store.getDoc())`, used for the whole-document comparison in
  line 3.
- **Block header.** One phrase was added to the block's "WHAT IS DRIVEN" header comment: "— since
  WO-3.51 — its two Clears".

## Against the Acceptance list

1. **[x] Due Clear and assigned Clear: only that field empties; untouched lines follow; touched lines keep their own date.**
   - Due Clear: the source's due field reads `''`, its assigned date (2026-11-05) and category stay,
     P2's untouched due follows to `''`, P6's hand-typed 2026-11-20 stays, and no assigned date moves.
   - Assigned Clear: the source's assigned field reads `''` with its due still blank, P6's untouched
     assigned follows to `''`, P2's 2026-11-06 stays, and no due date moves.
   - Evidence: full run, lines 1360–1361 PASS:
     `after: source ["k349_src_essays","2026-11-05",""], lines [["c_wo349_p2","2026-11-06",""],["c_wo349_p6","2026-11-05","2026-11-20"]]`.
2. **[x] Neither press writes.** After each press, and a `flush()`, `rev` reads 309 → 309 → 309 and
   the source in the document is byte-identical. The same check also asserts the label: *Copy into
   2 classes* before the presses, and *Save WO-3.49 English I P1 and copy into 2 classes* after each.
3. **[x] After both Clears, Cancel leaves the document byte-identical, and reopening shows the stored dates.**
   - I asserted this on **the whole document**, not just the source: a `JSON.stringify` before the
     dialog opened equals one taken after Cancel and a flush (25,665 characters on both sides).
   - Reopening shows 2026-11-05 / 2026-11-12, the stored category, and nothing ticked.
4. **[x] Confirm after a source Clear.** I reopened the dialog, ticked P2 and P6 (both untouched),
   and cleared the source's due date.
   - The label reads *Save WO-3.49 English I P1 and copy into 2 classes* and the button is enabled.
   - The confirm moves `rev` by exactly one (309 → 310).
   - The source is saved with `due: ""`. Every other field matches the pre-confirm snapshot, except
     `termId`, which the comparison deliberately sets aside.
   - Two copies (P2 and P6) are written in that same update, each on 2026-11-05 with a blank due date.
   - I made no assertion about the source's term, per the brief's WO-3.50 trap. (It currently keeps
     `tm349_src2`, visible in the check's detail output.)
5. **[x] Mutation-proved.** Recorded in `TESTING.md` § WO-3.51.
   - **The mutation was never in the working tree.** I made it in a throwaway copy of the tree under
     the session scratch directory: I deleted the line `if (sourceField) { setCopySource(fresh); return; }`
     and trimmed `BROWSER_SECTIONS` to year store + classes & terms + copy-class. I deleted the copy
     after the run.
   - **Control (unmutated subset):** `116 checks · 115 passed · 1 failed`. The one red is classes &
     terms throwing on the subset's thin fixture, the same subset red WO-3.49 recorded.
   - **Mutant:** `116 checks · 111 passed · 5 failed`, the same throw plus **4 of the 5 WO-3.51 checks
     red, each by name, with no section throw**:
     - due-Clear: P2 kept 2026-11-12;
     - assigned-Clear: P6 kept 2026-11-05;
     - no-write: the label never named the source;
     - confirm: the source was saved with `due: "2026-11-12"`, and so were both copies.
   - The Cancel check stays green under the mutation, and that is correct: nothing was held, so
     there was nothing for Cancel to drop.
   - **What the fall-through does, as the brief asked.** Without the branch, the source input reaches
     `setCopyDate(fresh)`. It carries no `data-assignment-copy-assigned`, so the field is taken as
     `'due'` even for the assigned Clear. `getAttribute('data-assignment-copy-due')` is `null`,
     `copyTargetFor(null)` returns `null`, and the function returns.
   - **It neither throws nor writes; it does nothing.** But the input has already been replaced by an
     empty one, so the field *reads* blank while the held source keeps the stored date. The screen
     says Cleared and the confirm writes the old date. That is why the "source field empties" half of
     line 1 passes under the mutation; the follow and label halves are what catch it.

## Commands, from output I read

- `node tools/verify-shell.mjs`, real clock, on the final `copy-class.mjs`:
  `1811 checks · 1811 passed · 0 failed · 0 skipped`, `57,367 lines · 31.7 lines per check · 813s`, `EXIT=0`.
  The count is 1806 + 5.
- `node tools/wo-sweep.mjs`: `48 checks · 45 passed · 0 failed · 3 to review`, EXIT=0. The
  call-site check reads 1805, matching `tools/README.md:1256`. The three reviews are the standing ones.
- `grep -rn MUTATION src/ tools/`: 19 lines, all comments that were there before. None are mine.
- `git diff --stat`: `TESTING.md`, `plans/work-orders/phase-3-gradebook.md`, `tools/README.md`,
  `tools/verify/copy-class.mjs`. Nothing in `src/`, `index.html` or `sw.js`, and no `CACHE` bump.

## Files changed

- `c:\dev\planbook\tools\verify\copy-class.mjs`: the five checks, plus one phrase in the block header.
- `c:\dev\planbook\TESTING.md`: new § WO-3.51, after § WO-3.49.
- `c:\dev\planbook\tools\README.md`:
  - The call-site line goes from 1800 to 1805. The sweep reads that line, and it went red until the
    line was updated.
  - A WO-3.51 paragraph after WO-3.49's, with the run figures.
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md`: the five WO-3.51 Acceptance boxes ticked.
  The Status line is left at `🤖 CLAIMED` for the orchestrator. The other changed line in that file's
  diff is the status `--start` wrote.

## Decisions the work order did not settle

- **A dedicated source assignment rather than reusing ESSAY.** The confirm writes a blank due date
  onto the source, and ESSAY is read again by the one-class, wide-list and coarse-pass checks further
  down. A fourth row in P1 keeps those reading exactly what they read before.
- **The Cancel check compares the whole document, not just the source**, because the line says "the
  document".
- **`termId` is excluded from the confirm check's field comparison** instead of being asserted as
  kept, so WO-3.50 can change the term without this check having to be edited. WO-3.49's own confirm
  checks do assert that `termId` is kept, and WO-3.50 will have to deal with those regardless.
- **`tools/README.md` moved**, though the brief's expected diff did not list it. The sweep's
  call-site check requires the change, and the README's own instruction is to update the count from
  a run.

## Not done, and why

- No 👤 or 📆 lines exist on this work order.
- No CHANGELOG entry, as instructed. Draft, if wanted: *"The copy dialog's source-line Clears are now
  pressed by the harness, and fenced before WO-3.50 changes what a blank-due source means. No change
  to the app."*
- No commit.

## Temptations declined

None worth acting on. The mutant points at a latent fragility: `setCopyDate()` silently accepts an
input that is not a line input and does nothing. With the branch present it is unreachable, so I left
`src/` alone, as the work order requires.
