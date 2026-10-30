# WO-3.77 — result (implementer)

**Status: built. Both tools green on the tree as delivered. The 👤 line is open. No box is ticked, as
the dispatch instructed. Nothing is committed.**

## Against the Acceptance list

1. **Q1 recorded and since changed, Q2 ended and unrecorded → two lines, Q2's first, each with its own
   button opening that term's dialog.** Met. A harness check reads both lines off the DOM against WO-3.73's literal
   wording. It then opens each line's button: Q2 opens the first-recording dialog (zim 88.00% B alone), and Q1
   opens the changed form (abe 72.00% C → 74.00% C, `1 student changed`, which agrees with the line's
   count).
2. **Q1 never recorded, Q2 ended → both on the bar, Q2 first.** Met. The check also covers Q2's end
   date itself: *ends today* leads *has ended*, so it ranks with unrecorded.
3. **Q1 never recorded, Q2 recorded and changed → Q1's *has ended* before Q2's *have changed*.** Met.
4. **Recording removes only its own line, and the last recording removes the bar. One line reads exactly as
   WO-3.73's bar did.** Met, in two checks, with each single-line text compared character for character to the
   WO-3.73 literal. My first run caught a real difference here. The built lines read `…Blackbaud.Record Q1 grades` with no space,
   where WO-3.73's markup had whitespace between the text and the button. The fix is a space text node
   in `paintBarLine()`, with a comment. It is invisible in flex, and the bar's text reads as before.
5. **Every term, state and count comes from the list reader, and no screen compares records or tests an end date.**
   Met, in two ways:
   - Every order check requires `termRecordBarModel().lines` to equal `termsNeedingRecord()` asked
     directly.
   - A structural check reads the bar's code in `src/term-record-view.js`. It requires exactly one
     `termsNeedingRecord(` and none of the record, comparison, end-date, clock or reordering calls. It
     also requires that no `src/` file other than the engine names `termEnded`, `termEndsToday` or the
     retired `termNeedingRecord`.

   This is a fence, not a reading. The dialog still calls `newestRecord()`/`noLongerMatching()` itself, as
   WO-3.73 built it. See the decisions section.
6. **Presentation mode: the bar names no student, and both dialogs refuse while naming the control.** Met with a two-line
   bar. Each line's refusal names its own *Record Qn grades*, and the document is byte-identical afterwards.
7. **Mutation.** I changed `model.lines.forEach` to `model.lines.slice(0, 1).forEach` in
   `refreshTermRecordBar()`. All seven WO-3.77 checks went red: six on behaviour, and the structural one on
   the `.slice(` token. All ten WO-3.73 checks stayed green. I stopped the run once the section had
   printed, so there is no summary line and the log ends `EXIT=127`. I reverted the mutation by hand before writing anything else.
   `grep -rn MUTATION src tools` finds nothing in any file this work order touched. The hits it does find are pre-existing prose. The red
   output is quoted in `TESTING.md` § WO-3.77.
8. **Both tools pass.** Both were run on the tree as delivered:
   - `node tools/verify-shell.mjs`: `2135 checks · 2135 passed · 0 failed · 0 skipped`,
     `68,670 lines · 32.2 lines per check · 1163s`, `EXIT=0`, real clock.
   - `node tools/wo-sweep.mjs`: `52 checks · 48 passed · 0 failed · 4 to review`, `EXIT=0`. Three of
     the reviews are the standing ones. The fourth is the working-tree "no coarse-block rule" review for
     `.term-record-nag-line`. That class is a row container, not a touch target. Its button is the existing
     `.term-record-nag-btn`, which is already 44px.
9. 👤 **iPad, two-line bar in portrait and landscape.** Not read, because I have no iPad. To set up the reading, force-quit, use build
   `v200`, and pick a class with two dated quarters that have both ended and are not recorded.
10. **`TESTING.md` § WO-3.77.** Written under `## Phase 3 — Gradebook`, after WO-3.73. It has the lines
    verbatim and the evidence for each.

## Decisions the work order left open

- **I retired `termNeedingRecord()` rather than keeping it as the list's head.** A single-term reader
  has the shape of the defect, and WO-3.74 is told not to build on it. If it no longer exists, nothing can
  reach for it, and the structural check fails if any `src/` file names it. The replacement is
  `termsNeedingRecord(doc, cls, today)` → `[{ termId, state, count, at }]`. Each entry is computed
  exactly as the old single answer was. I updated the export list in `tools/verify/term-record.mjs`.
- **Order without a sort.** `reduceRight` over `cls.terms` gives newest first, and then I concatenate
  unrecorded (including `ends-today`) and changed. There is no comparator, so nothing can sort by a label or a
  date. This also keeps the file's no-writer fence green, since it refuses `.sort(`/`.reverse(`.
- **Two-line layout.** It is one amber strip. Each line is WO-3.73's drawn row, moved from
  `.term-record-nag` onto a new `.term-record-nag-line` with its values unchanged. A second line gets an 8px gap with a
  `#f0dfa8` hairline above it, and each button stays at the right edge of its own line. With one line, the bar is exactly the frame.
  The drawing's banner (`design/mockups/closing-a-quarter.html`) now says so.
- **The dialog is untouched.** It still asks `noLongerMatching()` itself when it opens. I did not make
  it consume rows cached from the bar's list, for two reasons:
  - The bar repaints only on navigation, so cached rows could be stale by the time of the tap.
  - Reading the dialog's state from the list would change WO-3.73's behaviour for a term that has not
    ended.

  The bar's count and the dialog's rows are the same engine function's answer on the same document. The
  bar itself calls no comparison. If a verifier reads the brief's "same reader call" more strictly, this
  is where it would bite.
- **Harness placement.** The brief named `tools/verify/term-record.mjs` as WO-3.73's bar harness, but that
  harness is `tools/verify/term-record-bar.mjs`. I extended the latter and only edited the export list in the
  former.

## Things worth knowing

- **The sweep's call-site count undercounted my structural check by one.** That check anchored on the
  string `'/* ── the dialog'`. The sweep's comment-line reader took the `/*` inside the string for a
  block comment, so the next `check(` line was read as prose and the count came out 2124 instead of 2125. The
  anchor is now `'export function termRecordModel('`. I recorded this in the WO-3.77 ledger entry in
  `tools/README.md`, because any `/*` in a harness string silently costs a site. A possible follow-up,
  which I did not take: make the sweep's `commentLines()` skip string literals.
- I added a short note to WO-3.74's deliverable in `plans/work-orders/phase-3-gradebook.md` saying
  `termNeedingRecord()` is retired. It also says the list's head is not always the newest term, so
  which entry the home button opens is WO-3.74's decision. I did not change any WO-3.74 requirement.
- **Housekeeping.** I stopped two harness runs early: the first because it showed the whitespace
  defect, and the mutation run once its section had printed. I killed their orphaned headless Edge
  processes and confirmed none remain.

## Files changed

- `src/term-record.js`
- `src/term-record-view.js`
- `index.html`
- `src/shell.css`
- `sw.js` (v199 → v200)
- `docs/data-model.md`
- `design/mockups/closing-a-quarter.html`
- `plans/work-orders/phase-3-gradebook.md`
- `tools/verify/term-record-bar.mjs`
- `tools/verify/term-record.mjs`
- `tools/README.md` (call-site line 2118 → 2125, and a ledger entry)
- `TESTING.md` (§ WO-3.77)

## Draft CHANGELOG entry (the teacher's to write)

> **The Record bar names every quarter that needs it** (WO-3.77). Until now the bar on a class's
> screens named one quarter, always the earliest. That meant a Q1 never recorded would hold the bar all
> year with Q2, Q3 and Q4 hidden behind it, and a Q1 correction in January would hide the fact that Q2 had just ended. The bar now has
> one line per quarter, each with its own *Record Qn grades* button. Unrecorded quarters come first,
> because a whole quarter missing from Blackbaud matters more than a correction. Within each group the newest
> quarter comes first. Recording a quarter removes its line only. With one quarter waiting, the bar
> looks exactly as before. Under a projector it still names no student. `CACHE` v199 → v200.
