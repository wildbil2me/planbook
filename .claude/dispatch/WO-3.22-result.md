# WO-3.22 — the key legend omits a pair the hint beside it promises · implementation report

**Implementer** Claude (work-order-implementer), Opus · **Date** 2026-08-16
**Work order** `plans/work-orders/phase-3-gradebook.md` § WO-3.22 (line 1657)
**Brief** `.claude/dispatch/WO-3.22-brief.md`

---

## Files changed

| File | What changed |
|---|---|
| `index.html` | One `.scores-key` row added to `#scoresKeys` (`↑ ↓`), placed third of eight between `⇥` and the `← →` row. The panel's own HTML comment above the div updated to describe **two** arrow pairs instead of one; a short comment added at the new row saying why it is kept short. |
| `tools/verify-shell.mjs` | One new static block near the head of the file (beside WO-3.20's), holding **one** `check()` call site: the legend compared against the keys `handleScoreKey()` answers to. |
| `tools/README.md` | Call-site count moved **792 → 793** in the sentence `wo-sweep.mjs` greps; a new WO-3.22 paragraph in the check-count history, in the house format, including the mutation counts. |
| `sw.js` | `CACHE` bumped `planbook-shell-v69` → `v70`. `./` is `index.html`, and an installed iPad on the old shell would keep serving the old card. |
| `TESTING.md` | New `### WO-3.22` section after WO-3.20's, with four ticked lines, one **unticked 👤** line, and the desk-half / what-the-check-claims paragraphs. |
| `plans/work-orders/phase-3-gradebook.md` | The four Acceptance boxes ticked with evidence parentheticals. **Status left as `🤖 CLAIMED`** — `plans/work-orders/README.md` says `--start` / `--release` / `--tick` own that field, so I did not hand-write `✅ DONE`. |

Not changed, deliberately: the hint at `index.html:1083`, the `← →` row and its WO-3.16 comment,
`src/scores.js`, `src/shell.js`, any stylesheet, `CHANGELOG.md`.

---

## Against the Acceptance list, one by one

### 1. `- [x] The legend lists ↑ ↓ with the movement keys, and the flag rows are still last.`

**Met.** The row is:

```html
<span class="scores-key"><kbd>↑</kbd> <kbd>↓</kbd> within the column, up as well as down</span>
```

It sits third of eight — after `⇥` and before the `← →` row — which is also the order the hint under
the grid names the keys in (Enter, Tab, `↑ ↓`, `← →`). The four flag rows (`L`, `M`, `X`, `⌫`) are
untouched and still last.

**How I verified it:** read in place, and independently enumerated by the new harness check, which
reads the panel in document order and printed on the delivered run:

```
10 key(s) bound by handleScoreKey() [Enter ArrowDown ArrowUp ArrowRight ArrowLeft Backspace Delete L M X]
against 8 legend row(s) carrying [↵ ⇥ ↑ ↓ ← → L M X ⌫]
```

That glyph list is the document order of the panel, so "with the movement keys" and "flags last" are
both readable off it rather than off my description.

### 2. `- [x] The legend and the hint at index.html:1083 describe the vertical pair the same way.`

**Met, and it is a prose judgment — here is the evidence to judge it on.** The hint is unedited:

> and **↑ ↓** move within the column as well.

The legend now reads *"within the column, up as well as down"*. The shared description is **within
the column**; the legend adds *up as well as down*, which is the one thing the `↵` row — *"next
student, down the column"* — does not cover, and which is why the pair needs a row of its own rather
than being folded into Enter's.

**Decision I made here, since the work order did not settle the wording:** I wrote the legend to the
hint rather than touching the hint, because the work order says the hint is already correct and that
a rewrite of both leaving them disagreeing differently is worse than the current state. I also kept
the entry deliberately short — see the trap note below — so "within the column" carries the agreement
and nothing else in the row competes for the space.

Nothing mechanical asserts this line. I considered folding a wording-agreement clause into the new
check and decided against it: the check's claim is legend-versus-bindings, and a second unrelated
claim in the same call site is the WO-3.15 folding mistake. Verified by reading both strings.

### 3. `- [x] A check fails when a key the grid binds is missing from the legend — proved by removing an entry and watching it go red.`

**Met, run rather than reasoned.** I deleted the `↑ ↓` row from `index.html` — which reproduces the
pre-WO-3.22 build exactly — and ran the whole harness. **Waited for exit; these are quoted from the
output file, not predicted:**

*Mutated tree* (`node tools/verify-shell.mjs`, exit **1**):

```
790 checks · 789 passed · 1 failed · 0 skipped
21,115 lines · 26.7 lines per check · 259s

FAILED:
  - every key the score grid binds is on the ⌨ Keys legend, and every entry on that legend is a key
    it binds — `⇥` excepted by name, because Tab is the browser's tab order and src/scores.js says so
    (WO-3.22: `↑ ↓` were bound, promised by the hint, and not on the card)
      10 key(s) bound by handleScoreKey() [Enter ArrowDown ArrowUp ArrowRight ArrowLeft Backspace
      Delete L M X] against 7 legend row(s) carrying [↵ ⇥ ← → L M X ⌫]; BOUND AND NOT ON THE LEGEND:
      ArrowDown (↓), ArrowUp (↑)
```

*Delivered tree*, same command, exit **0**: `790 checks · 790 passed · 0 failed · 0 skipped`, 259s.

It went red on the **comparison** and not on a guard: during the mutation the floors were still met
(10 bound keys ≥ 8, 8 glyphs ≥ 8, 7 rows ≥ 7), and the failure detail names the two missing keys.
Exactly one check moved; the other 789 lines are unchanged between the two runs.

**Reverted, and the tree is clean of it.** `git diff index.html` after the revert shows only the
additions this work order intends — the added row, the two comments — and no deletion anywhere.
`git diff --stat` for the whole work order:

```
 TESTING.md                             | 62 +++++++++++++++++++++++++
 index.html                             | 15 +++++--
 plans/work-orders/phase-3-gradebook.md | 22 ++++++---
 sw.js                                  |  2 +-
 tools/README.md                        | 28 +++++++++++-
 tools/verify-shell.mjs                 | 82 ++++++++++++++++++++++++++++++++++
```

(Six files, 200 insertions, 11 deletions — proportionate, no CRLF rewrite.)

### 4. `- [x] node tools/verify-shell.mjs passes whole, with the count in tools/README.md moved in step.`

**Met.** Delivered tree: `790 checks · 790 passed · 0 failed · 0 skipped`, 21,115 lines, 26.7 lines
per check, **259s**, exit 0.

Count moved in the house format: the sentence `wo-sweep.mjs` greps now reads **793**, and a new
paragraph in the check-count history records *"WO-3.22 moved it from 792 to 793 … the run prints
790"* with both the delivered and the mutated counts in it. `node tools/wo-sweep.mjs` confirms it:

```
PASS | the recorded `check()` call-site count matches the harness  :: 793 `check()` call site(s) in
       tools/verify-shell.mjs, matching tools/README.md:812
PASS | one `check()` call per line in the harness  :: 793 call-site line(s) … none holding a second `check(`
PASS | every SHELL file change is paired with a CACHE bump  :: planbook-shell-v70 is not in any
       commit yet — the bump is uncommitted, which is the rule being followed

20 checks · 18 passed · 0 failed · 2 to review
```

Both REVIEWs are the two standing ones (sensitive field names; due-date-and-flag on one line) and
name the same lines they named before this landed — nothing I wrote added to either.

---

## Deliverable 3, and the judgment it asked for

The work order allowed *"if the comparison cannot be made mechanically, write down why"*. **It can,
and I made it** — but only with two asymmetries written into it, which is the part the brief said was
most of the deliverable. Both are stated at length in the block comment in `tools/verify-shell.mjs`
and summarised in `tools/README.md`, where the next reader hits them:

- **It is static, and that is a decision rather than a convenience.** A driven check would have to
  press keys and watch which were swallowed, and the defect it exists for is *the key nobody thought
  of*. Any list of keys to try would be the legend itself, so the driven version would compare the
  panel with itself. Reading the two documents — `handleScoreKey()`'s body and the `#scoresKeys`
  markup — is the version that can actually go red. Precedent: WO-3.20's static block, which it sits
  beside.
- **"Every key in the function is in the panel" is wrong as written.** `Backspace` and `Delete` are
  two bindings and one row (`⌫`), and the function compares key *names* while the panel is written in
  *glyphs*. So a map stands between them, and a bound key **not in that map is a FAIL, not a skip** —
  that clause is what makes the next key noisy instead of silent.
- **"Every key in the panel is in the function" is wrong as written too.** `⇥` is on the card and
  deliberately not bound (`src/scores.js` § WHAT IS DELIBERATELY NOT BOUND: Tab already means "the
  next assignment" natively, because the cells are inputs in document order). It is excepted **by
  name**, not by dropping the direction — so the reverse comparison still catches a row left behind
  by a binding that was removed. `Esc` and the digits are named in that same block, appear in neither
  place, and are the case this check correctly has nothing to say about.
- **The honest limit, written at the check:** it reads `key === '…'` and `letter === '…'` out of that
  one function's body. A binding written as a `switch`, a lookup table, or a call into another module
  would arrive as a key this check never knew about. Three floors guard against the whole thing
  passing vacuously — fewer than 8 bound keys, 8 glyphs or 7 rows is itself a failure — so a renamed
  function, a panel that stopped being literal markup, or a regex that quietly stopped matching goes
  red rather than green.

The `⇥` exemption was built in from the start rather than added to quiet a red: the brief names it,
and `src/scores.js` names it. Nothing else was excepted, and the check found nothing red on the
delivered tree beyond the `↑ ↓` it was written for.

---

## What I could not verify

- **👤 The panel on a real iPad.** The trap is a layout one and I have no hardware. What I did do is
  keep the new row deliberately shorter than the row that was already the panel's longest — 37
  characters of text against the `← →` row's 67, same class, same font, and `.scores-keys` is
  `flex-wrap`, so each `.scores-key` is laid out as its own chip. That is an argument from the
  strings, **not a measurement**: I did not measure `scrollWidth` against `clientWidth` on the open
  panel, at any width, on any device. Nothing in the harness opens `#scoresKeys` at all, so no
  existing check measures any legend row either. The 👤 line I added to `TESTING.md` says exactly
  this and is **unticked**.
- **Nothing was pressed.** This work order changes no behaviour — the `↑ ↓` keys worked before it and
  work now, and their existing checks (Enter at the bottom of a column, `↑` mid-column) ran green
  unchanged in both runs. I did not re-press them by hand.

## Left undone, on purpose

- **No spill check was added.** The Deliverables and Acceptance ask for neither, and there is a
  concrete risk in adding one inside this work order: at 390px the pre-existing `← →` row is the
  candidate that would spill first, and a red I am forbidden to fix (Out of scope: restyling the
  panel, rewording entries that are already right) would leave the harness failing with no in-scope
  remedy. Proposed as a follow-up below instead.
- **`Home`/`End`** — out of scope by name, and the new check is silent about it correctly: it is not
  bound and not on the legend, so it is in neither set.
- **No `CHANGELOG.md` entry** — the teacher's call. A draft is at the foot of this file.
- **Status line not hand-edited** — `wo-gate.mjs --tick` owns it.

## Proposed follow-ups (found, not fixed)

1. **A spill measurement over the open ⌨ Keys panel** — `scrollWidth` against `clientWidth` on
   `#scoresKeys` and on each `.scores-key`, with the panel opened through its real button, at 390px
   and 1024px under a coarse pointer. Nothing in the harness has ever opened that panel, so **no
   legend row in this app has ever been measured**. Worth booking with its eyes open: it may well go
   red on the WO-3.16 `← →` row, and the remedy there is a wording decision on a row the current
   work order was told not to touch.
2. **The same comparison for the attendance key legend.** `#attendanceKeysModal` documents `↓ ↑`,
   `P`, `T`, `A`, `E`, `D`, `Esc` and `?`; `src/shell.js` holds `MARK_KEYS = ['P','T','A','E','D']`
   and the arrow/Esc/`?` handling beside it. I read both and **found no discrepancy** — this is the
   same *class* of gap (nothing compares them), not a defect. It would need its own map, because that
   legend is a `<dl>` of `.attendance-key` rather than `.scores-key` spans.

## Draft CHANGELOG entry (for the teacher to accept, reword or drop)

> **The ⌨ Keys card on the score grid now lists `↑ ↓`.** The pair has moved up and down a column
> since the grid shipped and the hint underneath always said so, but the card a teacher opens to
> learn the keys did not carry them. The harness now compares that card against the keys the grid
> actually answers to, so the next key added cannot go undocumented quietly.

---

# Correction round — 2026-08-16

**Implementer** Claude (work-order-implementer), Opus · **Verdict corrected** the single ❌ on the
reverse direction of the new check. The four Acceptance lines the verifier marked ✅ were not
touched, re-derived, or re-argued.

## The ❌, and what it actually was

The verifier was right, and the sharper way to say it is that **the check was comparing the harness
with itself**. `stray` asked `Object.keys(GLYPH_OF)` — a table maintained inside `verify-shell.mjs`
— whether a legend row was bound. That table does not move when `src/scores.js` moves, so the answer
was yes forever and the direction could not go red. Three pieces of prose claimed otherwise, and the
worst of them was in `tools/README.md`, which is the standing authority the next reader trusts.

**I made the check true rather than deleting the claim.** The alternative the correction offered —
strike the reverse direction from all three places — would have left Deliverable 3 half-built for
the sake of a smaller diff, and the argument in the work order (*"a fix without that check is the
same omission waiting for the next key"*) applies in both directions: a binding deleted with its row
left behind is a card that documents a key the grid no longer answers to, which is the same lie
pointing the other way.

The fix is one identifier, at `tools/verify-shell.mjs:287`:

```js
const stray = glyphs.filter(g => !(g in LISTED_UNBOUND) && !bound.some(k => GLYPH_OF[k] === g));
```

with an eight-line comment above it naming the scar, because the two lists are both in scope on that
line, both are arrays of key names, and nothing about the wrong one looks wrong.

## Proof, run rather than reasoned

**The mutation the verifier measured green, on the whole harness.** `if (key === 'ArrowUp') return
moveWithinColumn(input, -1);` deleted from `handleScoreKey()`, `↑` left on the legend, `node
tools/verify-shell.mjs` run to exit. I waited for the exit and am quoting the output file:

*Mutated tree* (exit **1**):

```
790 checks · 788 passed · 2 failed · 0 skipped
21,120 lines · 26.7 lines per check · 252s

FAILED:
  - every key the score grid binds is on the ⌨ Keys legend, and every entry on that legend is a key
    it binds — `⇥` excepted by name … (WO-3.22: `↑ ↓` were bound, promised by the hint, and not on
    the card)
      9 key(s) bound by handleScoreKey() [Enter ArrowDown ArrowRight ArrowLeft Backspace Delete L M
      X] against 8 legend row(s) carrying [↵ ⇥ ↑ ↓ ← → L M X ⌫]; ON THE LEGEND AND NOT BOUND: ↑
  - clearing a cell deletes its key rather than storing a null with no flag, the last cell out takes
    the empty column key with it, and no such null exists anywhere in the document
```

*Delivered tree*, same command after `git checkout -- src/scores.js` (exit **0**):

```
790 checks · 790 passed · 0 failed · 0 skipped
21,120 lines · 26.7 lines per check · 252s
```

Before: `stray []`, pass true (the verifier's reading). During: `ON THE LEGEND AND NOT BOUND: ↑`,
**788 of 790**.

**Two failures, not one, and I am flagging it rather than trimming it.** The first-round mutation
deleted a legend row, which changes no behaviour, so exactly one check moved. This one deletes a
*binding*, so `↑` genuinely stops moving the caret and the score-clearing section that presses it
goes red as well. That second failure is the mutation being real. The floors were still met during
it (9 bound ≥ 8, 10 glyphs ≥ 8, 8 rows ≥ 7), so the WO-3.22 line went red on the comparison and not
on a guard.

**`git diff --stat -- src/` is empty afterwards** — checked after the revert and again at the end of
the round; the whole-tree diffstat is 6 files, 242 insertions, 11 deletions, and `src/` is not among
them.

## The forward direction did not get weaker, and `⇥` did not start reddening

Re-run after the fix, all seven of them, **not** assumed:

| mutation | before the fix (verifier) | after the fix |
|---|---|---|
| baseline, delivered tree | green | **green** — `⇥` on the card, silent, as designed |
| `↑ ↓` row deleted | red | **red** — `BOUND AND NOT ON THE LEGEND: ArrowDown (↓), ArrowUp (↑)` |
| `L` row deleted | red | **red** — `BOUND AND NOT ON THE LEGEND: L (L)` |
| `⌫` row deleted | red | **red** — `Backspace (⌫), Delete (⌫)` |
| `key === 'Home'` added to `handleScoreKey()` | red | **red** — `BOUND AND UNKNOWN TO THIS CHECK: Home` |
| **`ArrowUp` binding removed, `↑` left on the legend** | **GREEN** | **RED** — `ON THE LEGEND AND NOT BOUND: ↑` |
| panel `id` renamed (vacuity) | red | **red** — 0 rows, all ten bound keys reported missing |
| `handleScoreKey` renamed (vacuity) | red | **red** — 0 bound, nine glyphs reported stray |
| `⇥` row deleted | — | **green**, correctly: it is excepted by name in either direction |

**How, precisely, so this is not read as nine full harness runs.** One of them — the `ArrowUp` case,
the one that had been green — is a full `node tools/verify-shell.mjs` on the real tree, quoted above.
The other eight were run through a read-only scratchpad script that **slices the block out of the
real `tools/verify-shell.mjs` by its own text and executes it**, with `fs.readFile` handed mutated
copies in memory. It is the shipped code answering, not a hand-copy of it, and nothing was written to
the repo; what it cannot tell you is anything about the other 789 checks, which is why the case that
mattered got the 252 seconds. `stray`'s reading is quoted verbatim from that output in every row.

## Prose moved in step

- **`tools/verify-shell.mjs:240-241`** — the *"excepted BY NAME … so that the reverse direction still
  catches a row left behind by a binding that was removed"* sentence is now true of the code, so it
  stays as written.
- **`tools/verify-shell.mjs:289`** — the check's own name, *"and every entry on that legend is a key
  it binds"*, is likewise now true and unchanged.
- **`tools/verify-shell.mjs:281-286`** — new comment carrying the scar: which list to ask, why the
  wrong one answers yes forever, and the mutation that caught it.
- **`tools/README.md`** — a correction-round paragraph appended to the WO-3.22 entry in the house
  format: what shipped wrong, the mutation with its counts, why the mutated run has two failures and
  the first-round one had a single failure, and an explicit note of which mutations were full runs
  and which were the sliced-block replay. The sentence at `:1063-1064` the verifier quoted is left
  standing because it is now accurate.
- **`TESTING.md` § WO-3.22** — a new ticked line for the reverse direction with the counts on it, and
  a clause added to the *"what the check does and does not claim"* paragraph saying that the
  direction asks `handleScoreKey()` rather than the harness's map.

**No count moved, and that is asserted rather than assumed.** The fix adds no `check()` call site, so
`tools/README.md:812` still reads **793** call sites and the run still prints **790** executed checks
— `wo-sweep.mjs` was run twice in this round, once on the code fix alone and once at the end over
every edit in it, and both runs report `793 check() call site(s) … matching tools/README.md:812`.
The sentence at `:812` is untouched, and the two numbers stay the different things
`tools/README.md` says they are.

## Both harnesses, green, at the end of the round

```
node tools/verify-shell.mjs   790 checks · 790 passed · 0 failed · 0 skipped   252s   exit 0
node tools/wo-sweep.mjs       20 checks · 18 passed · 0 failed · 2 to review
```

Both REVIEWs are the two standing ones (sensitive field names; due-date-and-flag on one line), naming
the same lines they named before this work order started. The `verify-shell` run above is the
post-revert run quoted in full earlier; the only files edited after it are `tools/README.md`,
`TESTING.md` and this report, none of which the harness reads — checked by grepping
`verify-shell.mjs` for reads of either path, which returns only prose mentions of them.

## Scope

**Not widened.** Files changed in this round: `tools/verify-shell.mjs` (one expression, one comment),
`tools/README.md` (one appended paragraph), `TESTING.md` (one line, one clause), and this report.
Nothing in `src/`, no stylesheet, no `index.html`, no `sw.js` re-bump (the shell is unchanged since
the first round's `v70`, and `wo-sweep`'s pairing check confirms it), no `CHANGELOG.md`, and the
work-order Status stays `🤖 CLAIMED` for `--tick`.

**The 👤 line in `TESTING.md` is still unticked and still owed.** Nothing in this round pointed a
browser at the open ⌨ Keys panel, and no legend row in this app has been measured for spill at any
width. The follow-up proposed in the first round (a `scrollWidth`-against-`clientWidth` measurement
over the open panel) is unchanged and still not booked.

**Temptation declined.** With `stray` now reading the live binding list, it would have taken three
lines to have the check *also* assert that the legend's row order puts the flags last — Acceptance
line 1 is currently held by a human reading a glyph list the harness prints. It is a second claim in
one call site (the WO-3.15 folding mistake), it is not in the Deliverables, and this is a correction
round. Noted here rather than built.
