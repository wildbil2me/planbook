# WO-2.19 — the harness's own check count is checked · implementation result

**Implementer** Claude (work-order-implementer), Opus tier · **Date** 2026-08-10 · **Tree** `1f5217c`,
branch `phase/3-gradebook`
**Status left at** `🤖 CLAIMED — 2026-08-10`. I ticked the five Acceptance boxes; I did **not** run
`wo-gate.mjs --tick`, so the status line is untouched and the verifier flips it.

---

## The headline, because it changes the work order's own arithmetic

**The gap is not four, it is not six, and no fixed number can be stated.** Every figure in the work
order was re-derived on this tree and none of them survived.

| Quantity | Work order (on `6e90e53`) | Measured here (on `1f5217c`) |
|---|---|---|
| `grep -c 'check(' tools/verify-shell.mjs` | 542 | **561** |
| `check()` call sites | ~541 | **560** |
| checks a green run prints | 537 | **554** |
| "sites a run does not reach" | "four" | **28 never fire; 10 others fire more than once** |

`560 − 554 = 6` looks like six unreached branches, and it is not: a green run fires **532 distinct
call sites**, ten of which fire **more than once** (22 extra results — one site fires ten times), and
**28 never fire at all**. `532 + 22 = 554`. The 6 is two unrelated corrections cancelling. The work
order's "four" was the same coincidence on an older tree, and copying it forward would have been the
third instance of the failure this work order exists to prevent.

**How that was measured, since it is the determination the routing decision said nobody had made.**
Not reasoned — instrumented. A throwaway copy of the harness (`tools/verify-shell-probe.mjs`, written
with identical line numbering, run once, deleted) carried `new Error().stack` inside `check()` and
wrote out every executed line number. That map was diffed against the same grep the sweep uses.
`tools/verify-shell.mjs` is byte-identical to HEAD and the probe file no longer exists.

**The 28 that never fire are all one shape:** the failure arm of a fixture guard —
`if (!plant.ok) check('the WO-3.5 fixture is real…', false, plant.why)` at `:12532`, and `:4814`,
`:6708`, `:10143`, `:10589`, `:10645`, `:10692`, `:10712`, `:10740`, `:10779`, `:10817`, `:10861`,
`:10895`, `:10961`, `:10977`, `:10994`, `:11006`, `:11023`, `:11043`, `:11061`, `:11111`, `:11146`,
`:11232`, `:11550`, `:11684`, `:11687`, `:12632` and `:5063`. **A run in which one of them fires is a
run in which something is wrong**, so "call sites a green run does not reach" is a description of the
harness working correctly, not a defect list.

**The 10 that fire more than once are `check()` inside a loop** — once per viewport, orientation or
note code. `:11557` fires ten times across the note-panel matrix; `:11269`, `:11296`, `:11332` and
`:11338` three times each across three window sizes; `:11475`, `:11568`, `:11691`, `:11696` and
`:11973` twice each.

So, per the Deliverable's own escape hatch and the Trap: **the sweep asserts the call sites — the
quantity a grep can hold — and `tools/README.md` names the executed count beside it as prose, saying
which is which.** No check compares the two. No check passes on "close". No REVIEW prints on a clean
run.

---

## Against the Acceptance list, one by one

### 1. `node tools/wo-sweep.mjs` fails when `verify-shell.mjs` gains or loses a check and `tools/README.md` is not updated to match — run, not reasoned, with the output quoted both ways — **MET**

Three runs, all made, all quoted from output I read.

**Direction A — the harness gains a check, README untouched.** A throwaway
`check('WO-2.19 throwaway mutation, reverted', true, 'a call site added to move the count');` inserted
at `tools/verify-shell.mjs:13120`:

```
FAIL | the recorded `check()` call-site count matches the harness  :: tools/verify-shell.mjs has 561
`check()` call site(s), up 1 on the 560 recorded at tools/README.md:504 — update that line, and the
executed-check count in the paragraph beside it, from a run rather than by arithmetic. Sites run
tools/verify-shell.mjs:131..13120
16 checks · 14 passed · 1 failed · 1 to review
sweep exit=1
```

**Direction A, corrected — README bumped 560 → 561, throwaway still in:**

```
PASS | the recorded `check()` call-site count matches the harness  :: 561 `check()` call site(s) in
tools/verify-shell.mjs, matching tools/README.md:504 — call sites, not executed checks; the gap is
named there
16 checks · 15 passed · 0 failed · 1 to review
sweep exit=0
```

**Direction B — the harness *loses* a check.** Throwaway removed, README left at 561:

```
FAIL | the recorded `check()` call-site count matches the harness  :: tools/verify-shell.mjs has 560
`check()` call site(s), down 1 on the 561 recorded at tools/README.md:504 — update that line, and the
executed-check count in the paragraph beside it, from a run rather than by arithmetic. Sites run
tools/verify-shell.mjs:131..13083
16 checks · 14 passed · 1 failed · 1 to review
sweep exit=1
```

Both reverted. `git diff --stat tools/verify-shell.mjs` is empty; the sweep is green again at 560. The
table is in `TESTING.md` § WO-2.19 in the form § WO-2.18 uses.

*One thing I deliberately did not rely on: a check that only noticed growth would have passed
direction B. That is why B was run rather than assumed symmetric.*

### 2. The number the sweep asserts is the number `tools/README.md` states it is, and the paragraph says which quantity it is counting — **MET**

`tools/README.md:504` is the sentence the sweep greps, and it names the quantity in the sentence
itself: **"`verify-shell.mjs` holds 560 `check()` call sites"**. The check's PASS line repeats the
distinction so a reader of the *output* cannot miss it either: `… — call sites, not executed checks;
the gap is named there`. The executed count (`554 checks · 554 passed · 0 failed · 0 skipped`) is the
paragraph immediately above, labelled as `results.length` off a 177-second run and explicitly *not*
what the sweep asserts.

The sweep reads the number from that prose sentence rather than a marker comment, and if the sentence
is reworded or duplicated the check goes **RED with the reason**, never quiet — both branches are
written and the empty-README case was observed in the wild during development:
`FAIL | … tools/README.md no longer contains the sentence this check reads`.

### 3. The four call sites a run does not reach are named, or the paragraph records why a fixed number cannot be stated — **MET, by the second half**

There is no fixed number, and `tools/README.md:511–529` says so with the measurement behind it: 28
never fire (one shape, five named by `file:line`, the reason given), 10 fire more than once (five
named by `file:line`), `532 + 22 = 554`, and the note that `28 − 22 = 6` is a coincidence. It also
records *how* it was measured, so the next reader can re-derive it in one run instead of reasoning to
another wrong four.

I chose not to list all 28 line numbers in `tools/README.md` — they rot on the first edit to the
harness, and the shape plus the method is the durable claim. All 28 are listed above in this report
for the record.

### 4. `node tools/wo-sweep.mjs` otherwise prints the line it printed before — no new REVIEW, and the standing sensitive-field-name REVIEW unchanged — **MET**

Run before (via `git stash` of my two `tools/` files) and after, diffed. The entire diff:

```
15a16
> PASS | the recorded `check()` call-site count matches the harness  :: 560 `check()` call site(s) in
  tools/verify-shell.mjs, matching tools/README.md:504 — call sites, not executed checks; the gap is
  named there
18c19
< 15 checks · 14 passed · 0 failed · 1 to review
---
> 16 checks · 15 passed · 0 failed · 1 to review
```

Two hunks: one added PASS line, and the summary total. **The REVIEW block does not appear in the diff
at all** — the standing sensitive-field-name REVIEW is byte-identical at *"174 mention(s) in
index.html, src/attendance.js, src/home.js, src/letter-scale.js, src/prefs.js, src/presentation.js,
src/roster.js, src/scores.js, src/shell.css, src/shell.js, src/supports.js, sw.js"*, and there is no
new REVIEW.

**Which reading I applied**, as the brief asked me to say: the brief's — "prints the line it printed
before" means *no new REVIEW and the standing REVIEW unchanged*, not that the total stays frozen. The
total necessarily moves 15 → 16 because the sweep now runs one more check. The diff above is the
evidence for both readings being distinguished rather than conflated.

### 5. `node tools/verify-shell.mjs` passes whole and `src/` is byte-identical to HEAD — **MET**

Run twice on this tree, start and end, both to completion (177s each — I waited for the exit and read
the output; neither was reported from a still-running process).

```
================ SUMMARY ================
554 checks · 554 passed · 0 failed · 0 skipped
13,150 lines · 23.7 lines per check · 177s
EXIT=0
```

`git status --short src/` and `git diff --stat src/ tools/verify-shell.mjs` are both empty. Nothing in
`src/` was opened for writing at any point, and the harness was mutated and reverted only inside
Acceptance line 1's proof.

---

## What I could not verify

**Nothing here needs an iPad or human eyes, and I ticked no 👤 line.** The `TESTING.md` § WO-2.19
block I added contains no 👤 line and says why: a grep over two files in `tools/` has no device half.

The one honest limit is stated in the deliverable rather than hidden: **the executed count (554)
remains hand-maintained.** I measured it from a run and recorded it, but no check guards it, and I did
not build one — guarding it would mean either running the browser from the sweep (forbidden by the
Trap and by `wo-sweep.mjs`'s own header) or changing what `verify-shell.mjs` prints (forbidden by Out
of scope). See the follow-up below.

---

## Findings — reported, not fixed

1. **The third miss had already happened, and it is WO-3.5's.** `tools/README.md`'s count log stopped
   at `537 at WO-2.18` while the tree measured 554. WO-3.5's seventeen are counted in `TESTING.md`
   § WO-3.5 (*"554 of 554 with zero skips, 17 checks added in one new section"*) and never reached
   `tools/README.md` — exactly the shape of WO-3.4's thirteen at WO-2.18, one work order later. This
   is a **stale line, not a defect in `verify-shell.mjs`**: the harness counts correctly and prints
   correctly, and nobody carried the number across. So it is corrected here rather than booked.

   **How I squared that with the Trap** (*"do not update the count as part of this work order's own
   landing without the check proving it"*). The number the new check proves — 560 call sites — is
   written as the asserted number. The executed count is written as a **new dated log entry measured
   from a run whose summary line I quote**, not as an arithmetic correction of the old one and not as
   the number the check asserts; the paragraph says in as many words that it is still hand-maintained
   and why no grep can hold it. `537 at WO-2.18` is left standing, because the log is history and that
   entry was true when it was written.

2. **Proposed follow-up: `verify-shell.mjs` asserts its own summary against `tools/README.md`.** The
   executed count is the one number in this system that nothing watches, and the only tool that can
   see it is the harness itself — a final check comparing `results.length` against the line in
   `tools/README.md` would close it in about eight lines. I did not write it: it changes what
   `verify-shell.mjs` prints and how it counts, which is the Out of scope line verbatim. It is also
   not obviously right — it makes a run red for a documentation edit, which is a different bargain
   from the one the sweep makes — so it wants a work order and a decision, not an implementer.

3. **Noted, not booked: the sweep's own count is now the unguarded number one level up.**
   `tools/README.md` says `wo-sweep.mjs` is **16 checks**, and nothing checks that. The same defect
   class, one turn of the screw smaller. I updated the figure (see below) rather than leaving it stale
   at 15, but I did not write a check that asserts a script's count against a line in a README that
   the same script reads — that is a self-referential loop worth a decision, not a quiet addition.

---

## Decisions the work order did not settle, and which way I went

- **The gap is structural, so the sweep asserts call sites.** The Deliverable explicitly permits this
  branch and the Trap requires it over a loosened comparison. Taken.
- **`commentLines()` hoisted to module scope in `wo-sweep.mjs`** (from inside §10, where WO-3.2's
  rounding checks wrote it) rather than copied. §11 needs the same block-comment tracking, and a
  second copy of block-state tracking in one file is worse than a shared six lines. It is a pure move
  — the function body is unchanged, §10 still uses it, and the sweep's output before and after the
  move was identical (`15 checks · 14 passed · 0 failed · 1 to review`, verified before §11 was
  added). Comments at both ends name the move and the reason. This is not a `tools/lib/`, and
  `plans/verification-tooling.md`'s one-file rule is untouched.
- **The number is read out of the README's prose sentence, not a marker comment.** A marker is one
  more thing to keep in sync with the sentence beside it. The cost is that rewording the sentence
  turns the check red — which is announced, loudly, with the wording it expects, and is the failure
  direction I want.
- **`tools/README.md`'s "`wo-sweep.mjs` is **15 checks**" updated to **16 checks** since WO-2.19.**
  Measured from the run quoted above, not incremented on faith. Leaving it at 15 would have shipped
  the exact defect this work order is about.
- **Status left at `🤖 CLAIMED`.** I ticked the Acceptance boxes my own runs closed; flipping the
  status is `wo-gate.mjs --tick`'s job after a verifier reads this cold. `node tools/wo-gate.mjs
  --audit` passes on the tree I am leaving.

## Out-of-scope temptations I declined

- Writing the `verify-shell.mjs` self-assertion in finding 2. It is eight lines and it is the more
  valuable check; it is also the Out of scope line word for word.
- Cutting the sweep's FAIL detail down to two numbers. It is long, but the reader of a red run needs
  to be told *which* line to edit and that arithmetic is not the way to edit it, because arithmetic is
  precisely how 522 + 2 = 524 nearly happened.
- Enumerating all 28 unfired sites in `tools/README.md`. They rot; the shape and the method do not.

---

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\tools\wo-sweep.mjs` | `commentLines()` hoisted to the module-scope helpers, unchanged; new §11 *"the harness's own size is written down"* with its allowlist and its structural-gap reasoning |
| `c:\dev\planbook\tools\README.md` | New count-log entry `554 at WO-3.5` with the miss named; the `560 check() call sites` sentence the sweep greps; the structural-gap paragraph and its two bullets; `15 checks` → `16 checks` for the sweep |
| `c:\dev\planbook\TESTING.md` | New § WO-2.19 after § WO-2.18, five ticked lines and the two-mutation table in § WO-2.18's form |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | The five Acceptance boxes ticked, each with the evidence inline. Status line untouched |

Created and deleted during the run, in the repo and gone: `tools/verify-shell-probe.mjs` (the
instrumented copy). Scratch output lives outside the repo.

`src/`, `index.html`, `sw.js`, `manifest.webmanifest` and `tools/verify-shell.mjs`: **untouched**,
`git diff --stat` empty.

---

## Draft CHANGELOG entry — the teacher's to write or discard

> ### Tooling
> - The standing sweep now checks the harness's own size. `tools/README.md` had recorded how many
>   checks `verify-shell.mjs` runs since WO-1.3, maintained by whoever landed a work order
>   remembering to update it, and it had gone stale three times — 79 against 82 at WO-1.5, 522
>   against 535 at WO-2.18, and 537 against 554 now, WO-3.5's seventeen never having reached it.
>   `node tools/wo-sweep.mjs` counts the `check()` call sites and goes red when that line disagrees.
> - What the count is, exactly, is now written down instead of assumed. Call sites and checks a run
>   prints are two different numbers and always will be: twenty-eight call sites are the failure arm
>   of a fixture guard and only fire when something is wrong, and ten more sit inside loops and fire
>   once per viewport. The sweep asserts the number a grep can hold; the run's own number sits beside
>   it in prose, still measured by hand, and `tools/README.md` says which is which rather than letting
>   the next reader assume they are the same.
