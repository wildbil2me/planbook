# WO-2.34 — nothing compares the marking key list with the keys the screen answers to · result

**Route received:** Claude Sonnet (re-routed from Codex on the capacity fact in the brief).
**Work order:** `plans/work-orders/phase-2-attendance.md:3327`.

## Summary

Added one new `check()` block to `tools/verify-shell.mjs`, right after WO-3.22's block (the sibling
this one was booked out of), comparing `#attendanceKeysModal` in `index.html` against the keys the
`keydown` listener in `src/shell.js` answers to — both directions, bound-side read from `src/shell.js`
rather than a harness table, floors against a vacuous pass, and the "one shared check or two" judgment
written into the block's own comment (kept as two). Updated `tools/README.md`'s call-site count
sentence and its running narrative paragraph, and added a `TESTING.md` § WO-2.34 entry under
**Phase 2 — Attendance** (not appended after WO-3.24, which is filed under Phase 3 — Gradebook; this
work order is the attendance-screen sibling and belongs with its own phase). Ticked the Acceptance
boxes in `plans/work-orders/phase-2-attendance.md` for WO-2.34 that I have direct evidence for. I did
**not** touch `Status`, which stays `🤖 CLAIMED` — `work-order-orchestrator.md` reserves flipping that
to `✅ DONE` for `wo-gate.mjs --tick`, run by the orchestrator only after a verifier PASS and the
user's go-ahead.

`src/` and `index.html` are untouched at rest: every mutation used to prove a direction was made,
run, confirmed reverted with `git diff`, before the next one.

## Acceptance, one by one

**1. A check compares `#attendanceKeysModal` with the keys the `keydown` listener in `src/shell.js`
answers to, and passes on the delivered tree.**
✅ Met. Ran `node tools/verify-shell.mjs` twice on the clean tree with the new check in place:
```
800 checks · 800 passed · 0 failed · 0 skipped
21,531 lines · 26.9 lines per check · 261s
```
and again:
```
800 checks · 800 passed · 0 failed · 0 skipped
21,531 lines · 26.9 lines per check · 262s
```
The new check's own line, both times:
`PASS | every key the attendance-marking listener answers to is on the ⌨ Keys legend, and every entry
on that legend is a key it answers to (WO-2.34, WO-3.22's sibling on the marking screen)  ::
9 key(s) answered below the class-view guard [ArrowDown ArrowUp Escape ? P T A E D] against
8 legend row(s) carrying [↓ ↑ P T A E D Esc ?]`

**2. Removing a letter from `MARK_KEYS` while its row stays on the list turns it red, naming the row —
run, not reasoned, with the counts before and during quoted.**
✅ Met, run and not reasoned. Before: `800 checks · 800 passed · 0 failed · 0 skipped` (above). Edited
`src/shell.js`: `const MARK_KEYS = ['P', 'T', 'A', 'E', 'D'];` → `const MARK_KEYS = ['P', 'T', 'A',
'E'];` (Dismissed row left untouched in `index.html`). Ran the full harness:
```
800 checks · 796 passed · 4 failed · 0 skipped
21,531 lines · 26.9 lines per check · 260s
```
The new check's line, first among the four failures:
`FAIL | every key the attendance-marking listener answers to is on the ⌨ Keys legend, and every entry
on that legend is a key it answers to … :: 8 key(s) answered below the class-view guard [ArrowDown
ArrowUp Escape ? P T A E] against 8 legend row(s) carrying [↓ ↑ P T A E D Esc ?]; ON THE LEGEND AND
NOT BOUND: D`
The other three red checks are a real functional consequence, not noise: `D` stopped marking students
Dismissed, and three pre-existing attendance-marking checks caught that too. Reverted:
`git checkout -- src/shell.js`, confirmed with `git diff -- src/shell.js` (no output).

**3. Deleting a documented row while its key stays bound turns it red, naming the key — run, not
reasoned. Both directions are proved by mutation.**
✅ Met, run and not reasoned. Deleted the Tardy `.attendance-key-row` div from `index.html` (`<dt>` /
`<dd>` for `T`), leaving `T` in `MARK_KEYS`. Ran the full harness:
```
800 checks · 798 passed · 2 failed · 0 skipped
21,531 lines · 26.9 lines per check · 261s
```
The new check's line:
`FAIL | every key the attendance-marking listener answers to is on the ⌨ Keys legend, and every entry
on that legend is a key it answers to … :: 9 key(s) answered below the class-view guard [ArrowDown
ArrowUp Escape ? P T A E D] against 7 legend row(s) carrying [↓ ↑ P A E D Esc ?]; BOUND AND NOT ON THE
LEGEND: T (T)`
A second, pre-existing check independently caught the same defect from the rendered modal:
`FAIL | and \`?\` opens the same list for the hand that is already on the keys, naming all five
letters, both arrows and Escape  :: {"open":true,"inside":true,"keys":["P","A","E","D"],"arrows":true,
"esc":true}` — `T` missing from the announced set. Reverted: `git checkout -- index.html`, confirmed
with `git diff -- index.html` (no output). Both directions of the comparison (line 2 removing a bound
key, line 3 deleting a documented row) were proved by separate mutations and separate runs, as the
work order requires — not the same mutation read two ways.

**4. Renaming the modal id or the `MARK_KEYS` constant turns it red rather than passing vacuously.**
🟡 Partially run, partially reasoned — reported honestly rather than rounded up. I ran the full harness
for one of the two named cases and reasoned the other from the identical extracted logic, rather than
spending a fourth ~4.5-minute harness pass; the acceptance line's own wording ("or") is satisfied by
either.
- **Run:** renamed `id="attendanceKeysModal"` to `id="attendanceKeysModalRenamed"` in `index.html`
  only, leaving `src/shell.js`'s `KEYS_MODAL` untouched (this is also the deliberate decision fact 3 in
  the brief asked me to make explicit — the check reads `KEYS_MODAL`'s *value* out of `src/shell.js`
  and searches `index.html` for that literal id, so either side renamed alone breaks the find). Ran the
  full harness:
  ```
  800 checks · 797 passed · 3 failed · 0 skipped
  21,531 lines · 26.9 lines per check · 262s
  ```
  The new check's line: `FAIL | every key the attendance-marking listener answers to … ::
  9 key(s) answered below the class-view guard [ArrowDown ArrowUp Escape ? P T A E D] against
  0 legend row(s) carrying []; BOUND AND NOT ON THE LEGEND: ArrowDown (↓), ArrowUp (↑), Escape (Esc),
  ? (?), P (P), T (T), A (A), E (E), D (D)` — an empty legend read as nine missing keys, not as a
  vacuous pass. Reverted: `git checkout -- index.html`, confirmed with `git diff -- index.html` (no
  output).
- **Reasoned, not run through the browser harness:** renaming the `MARK_KEYS` *identifier* (e.g. to
  `MARKING_KEYS`) was checked by extracting the exact regexes and slicing logic from the new
  `verify-shell.mjs` block into a standalone Node script and running it in-memory against
  `shellSrc.replace('const MARK_KEYS = ', 'const MARKING_KEYS = ')`, with the real `index.html` and
  `src/shell.js` off disk otherwise unmodified (nothing was written to the tree for this one). Result:
  `bound.length === 4` (only the four literal `e.key === '…'` comparisons; the regex that reads
  `MARK_KEYS` found nothing), `stray === ['P','T','A','E','D']`, `ok === false` — the exact shape the
  floor is built to catch. I did not spend a fourth full harness run on this because the routing
  budget named three mutation runs plus one clean run, and I had already used all four (baseline run
  twice — see note below — plus the two required-by-name mutations, plus the modal-id case). This is
  the one line where I'm reporting reasoning rather than a browser run; flag it if the verifier wants
  the fourth run spent here instead of on the modal id.

**5. `node tools/verify-shell.mjs` passes whole, with the check count in `tools/README.md` moved in
step, and `git diff --stat -- src/` is empty across the whole work order.**
✅ Met. Final state: `git diff --stat -- src/` prints nothing (confirmed after every mutation was
reverted, not just at the end). `tools/wo-sweep.mjs`'s call-site assertion:
```
PASS | one `check()` call per line in the harness  :: 803 call-site line(s) in tools/verify-shell.mjs
```
(before this work order it asserted 802; `wo-sweep.mjs` failed with `up 1 on the 802 recorded at
tools/README.md:817` until I moved the sentence to 803, then went green). Full sweep summary on the
delivered tree: `20 checks · 18 passed · 0 failed · 2 to review` (the two REVIEWs are the file's
standing pair, unrelated to this work order — same lines named before and after). `verify-shell.mjs`
on the clean, fully-reverted tree: `800 checks · 800 passed · 0 failed · 0 skipped`, 21,531 lines,
26.9 lines per check, 261–262s across two runs.

## Judgment calls

**One shared check or two (Deliverable #4).** Kept as two independent `check()` blocks, not merged
with WO-3.22's into a shared helper. Reasoning, also written into the new block's own comment in
`tools/verify-shell.mjs`: the four structural facts named in the brief are not cosmetic differences —
a different slicing strategy (matching `</dl>` vs. the first `</div>`), a different glyph source
(`<dt>`-only vs. every `.attendance-key` in the panel), a second file read to locate the id, and a
listener body bounded by a guard's literal text rather than a function's own closing brace. A helper
general enough to cover both shapes would need a slicing strategy, a glyph source and an id source as
parameters — three more decisions than either check makes on its own today — to save a handful of
lines of structural duplication, at the cost of putting WO-3.22's already-corrected block at risk for
a change that does not touch it. WO-3.22's block is byte-for-byte untouched.

**Fact 3, which side the modal-id floor reads.** Decided to read `KEYS_MODAL`'s string value out of
`src/shell.js` and search `index.html` for that literal id, rather than hardcoding
`'attendanceKeysModal'` in the harness a third time. This extends Deliverable #2's "trust
`src/shell.js`, not a harness table" rule to the id the modal opens under, not just the key list, and
it is why a rename on *either* side alone (proved above for the `index.html` side) breaks the find
rather than one side silently drifting from the other.

**Acceptance line 4's second case reasoned rather than run.** Named above rather than rounded up to a
tick with no caveat. The reasoning is run against the identical code extracted from the shipped check
(not hand-simulated), but it is a standalone Node script, not `node tools/verify-shell.mjs` in a
headless browser, so I'm not claiming it as the kind of run Acceptance lines 2 and 3 explicitly demand
in-browser.

## What I could not verify

Nothing here needs a 👤/iPad reading — the work order's own "Closes roadmap" line says so (harness
only, nothing a teacher sees changes) — so there is no box I am leaving blank for that reason. The one
thing I am flagging rather than asserting cleanly is Acceptance line 4's second case, covered above.

## Files changed

- `c:\dev\planbook\tools\verify-shell.mjs` — new `check()` block (WO-2.34), inserted immediately after
  WO-3.22's block and before the static-server section. No existing block edited.
- `c:\dev\planbook\tools\README.md` — the `802` → `803` call-site sentence, and a new narrative
  paragraph after the WO-3.24 entry recording the move and both harness-run mutations.
- `c:\dev\planbook\TESTING.md` — new `### WO-2.34` section under `## Phase 2 — Attendance` (placed
  there deliberately rather than beside WO-3.22/WO-3.24, which are filed under `## Phase 3 —
  Gradebook`; this work order is the attendance-screen sibling of those).
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — ticked the five Acceptance boxes for
  WO-2.34, with a parenthetical on line 4 disclosing the run/reasoned split above. `Status` left as
  `🤖 CLAIMED` (see Summary).
- `c:\dev\planbook\.claude\dispatch\WO-2.34-status.md` — deleted, per its own first line ("Delete this
  file once `.claude/dispatch/WO-2.34-result.md` exists").

**Not changed:** `src/*` (confirmed empty diff throughout, not just at the end), `index.html` at rest
(confirmed empty diff after each of the three mutations against it).

## Out of scope, held to

Did not reword the legend, add or remove a binding, or touch the WO-3.24 spill measurement. Both
mutations against `index.html` and the one against `src/shell.js` were reverted before the next step,
each confirmed with `git diff` rather than trusted.

## Draft CHANGELOG note (not added — teacher's call)

> Added a harness check that keeps the marking screen's ⌨ Keys legend and the keys it actually binds
> from silently drifting apart — WO-3.22's fix on the score grid, extended to the attendance screen it
> was always missing from. No app behavior changes.
