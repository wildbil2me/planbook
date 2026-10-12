# WO-3.64 — result (implementer, 2026-10-12)

## What changed

- `index.html`
  - `#assignmentMoveModal`: the `.class-hint` *To change the date instead, close this and you are back in the assignment.* moved from after `.modal-actions` to directly before it, and gained a markup comment. Its wording, class and margins are unchanged.
  - `#categoriesModal`: `#categoryError` moved from the foot of `.modal-body` (after all four hints) to directly after `#categoryTotal`, before `.category-actions`. It is **moved, not deleted** (the owner's ruling at dispatch), still `hidden` and still empty, and gained a comment saying why it is kept. It was given no message.
- `sw.js`: `CACHE` `planbook-shell-v192` → `planbook-shell-v193`.
- `tools/verify/assignments.mjs`: one new check (`WO-3.64: the move confirm's note draws above …`). It sits right after WO-3.50's "opens the confirm BEFORE writing" check, on that same open confirm. It uses the WO-3.63 approach: an inline page-side read using `getBoundingClientRect()` to get the note's bottom vs. the actions row's top, plus nothing drawn between them, nothing drawing lower than the row, and nothing after it in the markup. It matches the wording as a whole string and reads three computed margins (label 16px, note 10px, actions 18px) for the Trap.
- `tools/verify/categories-weights.mjs`: one new check, right after "a wrong total blocks nothing". `#categoryError`'s previous sibling is `#categoryTotal`, its next is `.category-actions`, and the body's last child is a `.class-hint`. It reads the markup because the line is hidden and has no box. The two existing reads (asserting it is empty) are unchanged and still pass.
- `tools/README.md`: call-site count 2035 → 2037 (from the sweep's own count), plus a WO-3.64 paragraph after WO-3.63's that cites the executed count from the run below.
- `plans/work-orders/phase-3-gradebook.md`, WO-3.64:
  - The `**Open — …**` paragraph is replaced with `**Answered 2026-10-12, the owner, at dispatch: move.**`. It keeps the Open line's reasoning and notes that the Acceptance line's "or gone" is left as written.
  - The three Acceptance boxes are ticked. The status still reads `🤖 CLAIMED` because `--tick` and the status are the orchestrator's.
- `design/mockups/README.md`:
  - New section `## Decided, the owner, 2026-10-12, at WO-3.64's dispatch`, after WO-3.63's.
  - Open question 4 is marked answered.
- `design/mockups/dialog-messages.html`: frame 6's amber `mk-caption ask` is now `mk-caption decided`, headed as decided at WO-3.64's dispatch.
- `TESTING.md`: § WO-3.64 added under Phase 3, before `## Phase 4`. It copies the Acceptance lines verbatim and gives the evidence for each.

`src/` is untouched. `showCategoryError()` finds the line by id (`CATEGORY_ERROR_ID`), and nothing in `src/assignments.js` names the note by selector, so neither move needed a JS change.

## Against the Acceptance list

1. **[x] In the move confirm, the note is above *Move it to …* and *Keep it in …*, nothing draws after `.modal-actions`, and its wording is unchanged.** The `verify/assignments.mjs` check PASSES on the real confirm (buttons *Move it to Q2* / *Keep it in Q1*):
   `{"shown":true,"text":"To change the date instead, close this and you are back in the assignment.","above":true,"between":[],"below":[],"after":[],"noteMargin":"10px","labelMargin":"16px","actionsMargin":"18px"}`
2. **[x] In Categories & weights, nothing draws after the two hints, and `#categoryError` is directly under `#categoryTotal` (the owner ruled move).** The `verify/categories-weights.mjs` check PASSES:
   `{"prev":"categoryTotal","next":"category-actions","inBody":true,"last":"class-hint hidden"}`
   The last child is the points-mode hint, which is hidden in a weighted class. Only hints follow the Add row.
3. **[x] Both tools pass, and `CACHE` is bumped.**
   - `node tools/verify-shell.mjs`: `2049 checks · 2049 passed · 0 failed · 0 skipped`, 65,336 lines, 1099s, `EXIT=0`. I read this from the log after the process exited, on the real clock, 2026-10-12.
   - `node tools/wo-sweep.mjs`: `51 checks · 48 passed · 0 failed · 3 to review`, `EXIT=0`. I re-ran it after the last doc edit. The 3 to review are the standing ones: sensitive field names, due-date beside late/missing, and the mockup banners.
   - Before I updated the README count, the sweep failed, as expected, on the call-site count (2037 vs 2035). That failure is what the README edit answers.
   - `sw.js` is at v193.

**Trap (margins).** Reasoned and then measured. The note now follows `#assignmentMoveFacts`, which is a `<div>`, so neither `p + p` nor `p + .modal-section-label` applies to it. The label still follows the lead `<p>`. The computed values are the same as in the old order. `#categoryError` now follows a `<p>`, so `p + p` gives it 10px, which equals `.class-error`'s own 10px. It is hidden either way.

## What I could not close / did not do

- **No mutation round.** I planted no fault: a second full run takes about 18 minutes. On `HEAD`'s `index.html`, the move check's `after` would read `["p.class-hint"]` and `above` would be false, and the categories check's `prev` would be `null`. That is reasoned, not run. The verifier can do it the way WO-3.63's verifier did, with a scratch copy of the tree and `HEAD`'s `index.html`.
- **No 👤 line on this row.** Nobody has looked at either dialog on an iPad.
- **The `CHANGELOG.md` entry is not written.** The brief contradicts itself here: § 2 says "write the entry", and § 3 and my standing instructions say to leave it to the teacher. I followed the standing rule, which is also what WO-3.63's implementer did (its entry was written after verification). Draft below.
- I did not run `--tick`, `--start` or `--release`.

## Decisions taken

- **The categories check is DOM-order, not geometry.** `#categoryError` is hidden and empty, so it has no box. Unhiding it in the harness to measure it would mean the harness giving it a state the app never produces. "Nothing after the hints" is asserted as "the body's last child is a `.class-hint`". That is enough now that the error line was the only non-hint after the Add row. It is weaker than "every sibling after `.category-actions` is a hint". The difference would only matter if someone added a non-hint between the hints, and I noted it rather than spending another 18-minute run on it.
- **The move check is an inline reader, not a new export.** `READ_EDITOR_MESSAGES` is tied to `#assignmentModal`'s ids, and only one call site needs the move confirm's read. Exporting a second reader for one use seemed like more surface than it earns. It measures the same way: boxes, `between`, `below`, `domAfter`.

## Draft CHANGELOG entry (the teacher's to decide)

```
### The move confirm's note and the categories panel's error line draw above their buttons — 2026-10-12

WO-3.64, the second case of WO-3.58's rule. `CACHE` v193.

- **The move confirm's *To change the date instead…* note now sits above *Move it* and *Keep it*,**
  not under them. Its wording did not change.
- **Categories & weights' error line moved up to sit under the weights total, above *Add a
  category*,** instead of at the very foot under both hints. It still says nothing — nothing in the
  app has ever written to it — and the owner chose to keep it rather than delete it, so a future
  refusal has the right place to appear.
```
