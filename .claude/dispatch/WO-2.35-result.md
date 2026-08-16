# WO-2.35 — a key bound any way but a literal comparison is invisible to both key checks · result

**Route received:** Claude, Opus tier.
**Work order:** `plans/work-orders/phase-2-attendance.md:3392`.

## Summary

Both key blocks in `tools/verify-shell.mjs` now (a) read one binding form they could not read before,
and (b) carry a check that goes red and names the forms they still cannot read. The score-grid
comment's false claim — that the asserted count is what covers a comparison written another way — is
withdrawn and replaced with the decision and its evidence. The two blocks are still two blocks: the
widened read, the refusal list and the new `check()` are written out twice, in each block's own
variable names, because merging is **Out of scope** and WO-2.34's reasoning stands.

`src/` and `index.html` are byte-identical at rest. Every mutation was made, run, and reverted with
`git checkout` before the next step, each revert confirmed with `git diff` rather than trusted.

**No key was missing and no binding changed.** Nothing here is a defect fix, and widening the read
turned neither check red against current unmutated code — so there was no defect to report and stop
on under the work order's fourth Trap.

**Four full `verify-shell.mjs` runs plus a pre-work-order baseline** — five in total, ~4.2 min each.
All five ran to completion in this environment and every number below is quoted from output I read
after the process exited, not from a run still in flight.

## The decision, since that is the deliverable

**Widened, because a hand here already reaches for it:** a key list declared `const NAME = ['…']` and
membership-tested inside the slice. `src/shell.js`'s marking listener binds its five letters exactly
that way — `MARK_KEYS.indexOf(code) === -1` — and WO-2.34's block could only see them by hardcoding
that one array's *name*. Finding such a list by its **shape** is what makes a *second* one visible.
`.includes(` rides in the same alternation as `.indexOf(`: same form, same payload, one word of
alternation, not a second guess.

**Refused, by name, with a check behind each:** `switch`, `e.code`, a prefix/suffix test on the key,
and the key used as a lookup index. The evidence for refusing rather than reading them is that **not
one of them appears anywhere in `src/`** — I swept for it rather than assuming:

- `switch` — zero statements in the whole tree. The only hit is the word inside a prose comment
  (`src/roster.js:749`).
- `.includes(` — zero. The codebase writes `indexOf(...) === -1` / `>= 0` in about thirty places.
- `startsWith` / `endsWith` — zero.
- `.code` — never `KeyboardEvent.code`. Every hit is the attendance **mark** code (`mark.code`,
  `row.code`, `cell.code`), which is a second reason not to widen: a looser pattern would read
  attendance marks as bound keys.

That asymmetry is the whole call. A regex for a form nobody writes costs a reader's time forever and
catches nothing; a grep that goes red the day one arrives costs nothing until it earns its line.

**`e.code`, decided by name as the work order requires: refused, never read.** It is a different
property with different values — `e.code === 'KeyP'` where `e.key === 'P'`, `'Slash'` where `'?'` is
— so a read widened to it would put `KeyP` into `bound` and demand a legend row for a key no teacher
presses. A check that spells it wrong is worse than one that admits it cannot see it. If a binding
ever genuinely needs `e.code`, the check has to learn the code→key mapping first, and that is a work
order rather than a regex. Said in those words in the comment.

**Named as still invisible** (in the comment, so nobody has to trust the block twice): a comparison
against a variable rather than a literal (`key === SOME_CONST`), which no static pattern can read;
and a key list assembled at run time — which is *partly* caught, because a CAPS-shaped list
membership-tested in the slice that the block cannot resolve to quoted strings is **reported**
(`unresolvedLists`) rather than skipped. That is the floor a newly unreadable key list trips.

## Acceptance, one by one

**1. Both key checks are covered — score grid and marking screen — and both still pass on the
delivered tree.**
✅ Met. Two runs on the delivered tree, before the mutations and again after both were reverted:
```
802 checks · 802 passed · 0 failed · 0 skipped
21,688 lines · 27.0 lines per check · 258s
```
```
802 checks · 802 passed · 0 failed · 0 skipped
21,688 lines · 27.0 lines per check · 253s
```
Both exit 0. All four key lines green, and the two new ones show the widening is not inert:
```
PASS | every key the score grid binds is on the ⌨ Keys legend … :: 10 key(s) bound by
handleScoreKey() [Enter ArrowDown ArrowUp ArrowRight ArrowLeft Backspace Delete L M X] against
8 legend row(s) carrying [↵ ⇥ ↑ ↓ ← → L M X ⌫]
PASS | nothing in handleScoreKey() binds a key in a form the legend check above cannot read … ::
1888 byte(s) of handleScoreKey() read; 10 literal comparison(s) and 0 key(s) from 0
membership-tested list(s)
PASS | every key the attendance-marking listener answers to is on the ⌨ Keys legend … :: 9 key(s)
answered below the class-view guard [ArrowDown ArrowUp Escape ? P T A E D] against 8 legend row(s)
carrying [↓ ↑ P T A E D Esc ?]
PASS | nothing below the class-view guard binds a key in a form the legend check above cannot read
… :: 1373 byte(s) of the listener read below the guard; 4 literal comparison(s) and 5 key(s) from
1 membership-tested list(s)
```
The marking block's *"5 key(s) from 1 membership-tested list(s)"* is `MARK_KEYS` found by shape
rather than by name — the widened read working on the delivered tree. The score grid reads 0 lists,
which is correct for `handleScoreKey()` and is why the refusal check is the half that covers it there.
Coverage is per block and duplicated, not shared: separate `REFUSED` lists, separate variable names
(`key`/`letter` there, `e.key`/`code` here), separate `check()` calls.

**2. Adding a binding in a form the pre-work-order check could not see, with no legend row added,
turns a check red and names it — run, not reasoned, with the counts before and during quoted.**
✅ Met, run and not reasoned. One run, one mutation per block, so both blocks and both halves of the
design are proved at once.

*Before, on the pre-work-order tree* (the baseline run, harness unmodified):
`800 checks · 800 passed · 0 failed · 0 skipped`, 264s — score grid **`bound.length` = 10**, marking
screen **`bound.length` = 9`**. *Before, on the delivered tree*: same two counts, 10 and 9 (quoted in
full under line 1 above).

*The mutations* (no legend row added on either side):
- `src/shell.js` — `const WO235_MUTATION_KEYS = ['S'];` at module scope, and below the class-view
  guard `if (WO235_MUTATION_KEYS.indexOf(code) !== -1) { e.preventDefault(); return; }`. No
  `e.key === '…'` literal, and the array is not named `MARK_KEYS`, so the pre-work-order regexes
  could not see it.
- `src/scores.js` — `switch (key) { case 'F': return true; }` at the top of `handleScoreKey()`.

*During:*
```
802 checks · 800 passed · 2 failed · 0 skipped
21,688 lines · 27.0 lines per check · 254s
```
exit 1, and the two failures are the point:
```
FAIL | every key the attendance-marking listener answers to is on the ⌨ Keys legend … :: 10 key(s)
answered below the class-view guard [ArrowDown ArrowUp Escape ? P T A E D S] against 8 legend
row(s) carrying [↓ ↑ P T A E D Esc ?]; BOUND AND UNKNOWN TO THIS CHECK: S — add it to GLYPH_OF here
and to the legend in index.html, in that order
```
**`bound.length` 9 → 10, and `S` named.** And on the score grid, the finding itself, two lines apart
in one run:
```
PASS | every key the score grid binds is on the ⌨ Keys legend … :: 10 key(s) bound by
handleScoreKey() [Enter ArrowDown ArrowUp ArrowRight ArrowLeft Backspace Delete L M X] against
8 legend row(s) carrying [↵ ⇥ ↑ ↓ ← → L M X ⌫]
FAIL | nothing in handleScoreKey() binds a key in a form the legend check above cannot read … ::
1937 byte(s) of handleScoreKey() read; 10 literal comparison(s) and 0 key(s) from 0
membership-tested list(s); BOUND IN A FORM THIS READ CANNOT NAME: a `switch` on the key — write the
branches as `key === '…'`, or teach this block to read case labels first
```
The legend check reads **10 — unchanged, still passing — with an eleventh key bound**, which is
exactly the failure the work order describes, and the new check is what turns it red and names the
form. Nothing else went red: no collateral, 800 of 802 still passing.

*Reverted:* `git checkout -- src/scores.js src/shell.js`, then `git diff --stat -- src/` printed
nothing.

**3. The existing mutations still work: removing a bound key while its row stays, and deleting a row
while its key stays bound, both still go red on both blocks. Run at least one of the four.**
✅ Met — **two** of the four, one per block and one per direction, in one run.
- `src/shell.js`: `const MARK_KEYS = ['P', 'T', 'A', 'E'];` (Dismissed row left on the card).
- `index.html`: the `<span class="scores-key"><kbd>↑</kbd> <kbd>↓</kbd> …</span>` row deleted from
  `#scoresKeys`, both keys left bound in `handleScoreKey()`.

```
802 checks · 797 passed · 5 failed · 0 skipped
21,688 lines · 27.0 lines per check · 254s
```
```
FAIL | every key the score grid binds is on the ⌨ Keys legend … :: 10 key(s) bound by
handleScoreKey() [...] against 7 legend row(s) carrying [↵ ⇥ ← → L M X ⌫]; BOUND AND NOT ON THE
LEGEND: ArrowDown (↓), ArrowUp (↑)
FAIL | every key the attendance-marking listener answers to is on the ⌨ Keys legend … :: 8 key(s)
answered below the class-view guard [ArrowDown ArrowUp Escape ? P T A E] against 8 legend row(s)
carrying [↓ ↑ P T A E D Esc ?]; ON THE LEGEND AND NOT BOUND: D
```
The other three red are the marking-screen checks that a teacher's `D` really does stop working — the
same downstream set WO-2.34 recorded, not noise. Both new refusal checks correctly stayed **green**
through this run: they are about the *form* a binding is written in, not about agreement, and a
mutation of agreement must not move them.

*Reverted:* `git checkout -- src/shell.js index.html`; `git diff --stat -- src/` and
`git status --porcelain` both show `src/` and `index.html` clean.

**4. The decision is written in the harness comment, and the score-grid comment's claim about the
asserted count is corrected or removed — it is currently false.**
✅ Met. The false sentence is **withdrawn**, and the withdrawal is explicit rather than silent —
`tools/verify-shell.mjs:271-319` opens by quoting what used to stand there and saying which half was
false and why (`bound.length >= 8` is a floor; an eleventh key bound through a `switch` does not lower
it). The full decision, the evidence sweep, the `e.code` ruling and the named residue are in that
comment. The marking block states the same decision in its own words at its header, points at
`:271-319` for the long form, and carries its own inline note at its list read — the same
cross-reference idiom WO-2.34 used. Two stale line references left by my insertions were corrected in
the same pass (`:281-287` → `:349-355`, in `tools/verify-shell.mjs` twice and `TESTING.md` once).

**5. `node tools/verify-shell.mjs` passes whole, the check count in `tools/README.md` moved in step
if a call site was added, and `git diff --stat -- src/` is empty across the whole work order.**
✅ Met. Passes whole: `802 checks · 802 passed · 0 failed · 0 skipped`, exit 0 (quoted twice under
line 1). Two call sites added, so `tools/README.md`'s asserted sentence moved 803 → 805 and a
narrative paragraph records the move and both mutation runs; `wo-sweep.mjs` failed with *"has 805
`check()` call site(s), up 2 on the 803 recorded at tools/README.md:817"* until I moved it, and then:
```
20 checks · 18 passed · 0 failed · 2 to review
```
exit 0, the two REVIEWs being the file's standing pair (sensitive field names outside
`src/backup.js`; due-date and late/missing on one line) — the same lines they named before this
landed. `git diff --stat -- src/` prints nothing, confirmed after each mutation and again at the end,
and `git status --porcelain` shows no `src/` or `index.html` entry at all. Whole-tree diffstat is
`4 files changed, 292 insertions(+), 19 deletions(-)` — proportionate, no line-ending rewrite.

## What I could not verify

Nothing here needs an iPad or human eyes: the work order's own *"Closes roadmap"* line says so
(harness only, nothing a teacher sees changes), and I ticked no 👤 line because there is none in
scope. Every number above is from output I read after the process exited. The one thing I am
flagging rather than asserting: the new checks' behaviour on forms that do **not** exist in this tree
(`e.code`, `startsWith`, a lookup index) is proved only by the regexes being the same shape as the
`switch` one I did drive red — I ran a mutation for `switch` and for the widened list read, not for
all six patterns. Four more full harness passes to cover the rest looked like a poor trade against a
254s run each; say so if the verifier wants them spent.

## Judgment calls the work order did not settle

**Where the failure lives: a new `check()` per block, not folded into the existing ones.** The
existing checks assert *agreement* between two documents; the new one asserts that the read producing
one side can be trusted at all. Folding them would have put a second claim behind one name, lengthened
an already long detail string, and — the deciding reason — changed the existing checks' failure
behaviour, which Acceptance line 3's regression set depends on. Cost: two call sites and a
`tools/README.md` edit, which Acceptance line 5 explicitly budgets for.

**`.includes(` is read, not refused.** It appears zero times in `src/`, so by the letter of "do not
widen by guessing" it could have gone on the refusal list. I put it in the *read* because the form
being read is "an array of key names, membership-tested" — which this codebase demonstrably writes —
and `includes` is that form with the same extractable payload, not a different form. Reading it costs
one alternation; refusing it would have meant a future maintainer's correct, obvious edit going red
for a reason the message could not really justify.

**The widened list read went into the score-grid block too, where it finds nothing today.**
`handleScoreKey()` membership-tests no array. I applied it anyway rather than making the score grid
refusal-only, because the form is written in this codebase's *other* key handler and the two blocks
answer the same claim; a block that cannot see a form its sibling can is the asymmetry that produces
the next WO-2.35. It reads `0 key(s) from 0 membership-tested list(s)` on this tree, which is a
number worth printing.

**Anti-vacuity guard for the new checks: `body.length > 200`, not a count.** A renamed function or a
moved guard slices to `''`, and `''` contains no `switch` either — an absence assertion is *maximally*
vacuous on an empty slice. I used a slice-length test rather than another hand-maintained count on
purpose, because WO-2.36 owns the floors and names "the slice being non-empty" as one of the
alternatives it may choose.

**A CAPS-shaped list the read cannot resolve is reported rather than skipped.** This is the one place
I chose noise over silence in a way that could inconvenience a future maintainer: a membership test on
an ALL-CAPS constant that is not a plain list of quoted strings goes red with *"MEMBERSHIP-TESTED AND
UNREADABLE"*. A lowercase local (`rows.indexOf(id)`) does not trip it. It is the same "noisy instead
of silent" call the existing `unmapped` clause already makes, and without it the widened read has no
floor of its own.

## Out of scope, held to — and one temptation declined

Did not merge the two blocks (built twice: two `REFUSED` lists, two loops, two `check()` calls, two
comments). Did not reword either legend. Did not add or remove any binding in the delivered tree.

**The temptation I declined and am noting rather than acting on:** the floors. Reading
`bound.length >= 8 && glyphs.length >= 8 && rows.length >= 7` while writing a comment about why that
line is not the mitigation makes replacing it feel like part of the same thought — and my new checks
already demonstrate the alternative (a slice-length guard) that WO-2.36's Deliverable #1 lists. I left
all six floor numbers exactly as they were. WO-2.36 is booked, it is explicitly about them, and its own
Out of scope says WO-2.35 is a different fault; a work order that grows is a work order that cannot be
verified.

**A follow-up worth booking, not built here:** nothing in the tree stops `src/` from acquiring the
first `switch` statement, or the first `.includes(`, somewhere *outside* these two slices — the new
checks only look below the class-view guard and inside `handleScoreKey()`, which is correct for what
they assert. If the suite ever wants "this codebase does not write `switch`" as a house rule, that is
a `wo-sweep.mjs` grep and a paragraph in `tools/README.md`, not a harness check. I did not write it:
the brief says do not write a second harness, and a house rule nobody has decided on is not mine to
declare.

## Files changed

- `c:\dev\planbook\tools\verify-shell.mjs` — the score-grid block (WO-3.22): the false sentence
  withdrawn and replaced with the WO-2.35 decision comment, `bound` split into `literalKeys` +
  discovered `listKeys`, `unresolvedLists`, a `REFUSED` list and one new `check()`. The marking-screen
  block (WO-2.34): a WO-2.35 paragraph in its header, its own `listKeys`/`unresolvedLists` read, its
  own `REFUSED` list and one new `check()`; its four structural facts and both of its decisions
  (one-check-or-two, `stray` asking `bound`) are preserved verbatim, with the two `:281-287`
  references corrected to `:349-355`.
- `c:\dev\planbook\tools\README.md` — the `803` → `805` call-site sentence, and a WO-2.35 narrative
  paragraph after WO-2.34's recording the move, the decision, and both mutation runs.
- `c:\dev\planbook\TESTING.md` — a new `### WO-2.35` section at the end of `## Phase 2 — Attendance`,
  and the stale `:281-287` reference in the WO-2.34 section corrected.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — the five WO-2.35 Acceptance boxes
  ticked, each with the run it rests on named. **`Status` left at `🤖 CLAIMED`** — flipping it to
  `✅ DONE` is `wo-gate.mjs --tick`, run by the orchestrator after a verifier PASS.
- `c:\dev\planbook\.claude\dispatch\WO-2.35-status.md` — deleted, per its own first lines.

**Not changed:** `src/*` and `index.html` (empty diff confirmed after every mutation, not only at the
end). No `sw.js` `CACHE` bump: nothing in `SHELL` changed.

## Draft CHANGELOG note (not added — teacher's call)

> The harness check that keeps each ⌨ Keys legend honest can now see a key bound as a list rather than
> a chain of comparisons, and goes red by name at the binding shapes it still cannot read — closing the
> door a green check was quietly holding open. No app behavior changes.
