# WO-2.22 — result

**Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.22
**Implementer** Claude (work-order-implementer), 2026-08-11
**Tree** branch `phase/3-gradebook`, on top of `4356b44`

---

## Summary

Two changes to `tools/wo-sweep.mjs` §11 and three prose additions to `tools/README.md`. A missing
`tools/verify-shell.mjs` or `tools/README.md` now **FAILs** where it printed a `REVIEW` and exited 0.
The section gains a seventeenth check asserting that no call-site line in the harness holds a second
`check(` occurrence, which turns *the count is a count of lines and that is the same as a count of
calls* from an unstated premise into a check that names the line. `tools/verify-shell.mjs` and `src/`
are byte-identical to HEAD by hash; no harness run was spent.

**The sweep is green:** `17 checks · 16 passed · 0 failed · 1 to review`, exit 0.

**Line citations — all seven verified against the files, none had drifted.** `:592` (the ALLOWLIST
paragraph), `:613` (the `REVIEW` for a missing file), `:620–623` (the one-entry-per-line push),
`:634` (the loud empty-grep failure), `:644` (the reworded-sentence `FAIL`), `:647` (its text) in
`tools/wo-sweep.mjs`, and `tools/README.md:636` (the recorded count sentence) were all exactly where
the work order said. They have since moved in my edited copy, which the numbers below account for.

**Measured at the start of the work, per the Why-it-exists instruction:** the true call-site count is
**596**, from `node tools/wo-sweep.mjs` — matching the figure the owner refreshed into the work order
on 2026-08-11, so nothing had rotted between the refresh and this run.

---

## Against the Acceptance list, one by one

### 1. Missing-file FAIL, both ways, both run, both quoted, both reverted — **met**

Each file was moved out of the repo (to the scratchpad, so the sweep's own walk could not see it),
the sweep run, the file moved back, and `git status --porcelain tools/` checked afterwards — it
showed only `tools/wo-sweep.mjs` in both cases.

`tools/verify-shell.mjs` moved aside — **exit 1**, `16 checks · 14 passed · 1 failed · 1 to review`:

```
FAIL | the recorded `check()` call-site count matches the harness  :: tools/verify-shell.mjs is not
where this check expects it — the count is now watching nothing, and so is the one-call-per-line
check beside it. Restore the file or point this check at the new path.
```

`tools/README.md` moved aside — **exit 1**, `16 checks · 14 passed · 1 failed · 1 to review`, the
same sentence naming `tools/README.md` instead. (Sixteen rather than seventeen in both runs, because
the one-call-per-line check cannot run when the file it reads is gone — which is what the detail line
says in as many words.) Both outputs are tabulated in `TESTING.md` § WO-2.22.

### 2. Append FAILs and names the line, proved non-vacuous — **met**

A second call was appended to `tools/verify-shell.mjs:495`, which already held
`check('modal opens on click', await isOpen());`. The file stayed at **14,295 lines** (checked before
and after) and still parsed (`node --check`). The sweep exited **1** at
`17 checks · 15 passed · 1 failed · 1 to review`, and the two clauses split exactly as the criterion
requires:

```
PASS | the recorded `check()` call-site count matches the harness  :: 596 `check()` call site(s) in
tools/verify-shell.mjs, matching tools/README.md:636 — call sites, not executed checks; the gap is
named there
FAIL | one `check()` call per line in the harness  :: tools/verify-shell.mjs:495 hold(s) more than
one `check(` — the count above pushes one entry per line, so a second call on a line that already
has one moves no number and leaves the count in tools/README.md quietly wrong. Put it on its own
line. (If the second occurrence is a trailing comment rather than a call, this clause still reads
the line as written: move the comment.)
```

**The count quoted from that run is 596** — the same 596 the clean tree prints, because an append
adds no line. It was not derived by arithmetic and no number was carried in from the work order's
prose. Reverted from a byte copy taken before the edit; hash equality with HEAD confirmed below.

### 3. `tools/README.md` states why the sweep's own count is unguarded, and that §11 counts lines — **met**

Two paragraphs, both new:

- Under the recorded call-site sentence: the number is a count of **lines**, a second call on an
  occupied line is the one edit that moves nothing, and the new clause is what makes it a count of
  calls. It also names why counting occurrences into the number would be the wrong fix, and records
  the severity change for a missing file.
- Under the `wo-sweep.mjs` is **17 checks** sentence: why *that* number is deliberately unguarded —
  the sweep prints its own true figure on the summary line of every run, in about a second, in front
  of the reader who is already running it, where the harness's count costs a three-minute browser run
  nobody spends on a README sentence. That asymmetry is what made WO-2.19 worth doing there and not
  here.

**The `16 checks` → `17 checks` edit was taken off a run, not off arithmetic.** The paragraph quotes
the summary line `17 checks · 16 passed · 0 failed · 1 to review` verbatim, and tells the next author
to do the same rather than increment.

### 4. `tools/README.md` records why `verify-shell.mjs` does not assert its own summary — **met**

A new paragraph after the call-sites-versus-executed-checks argument, carrying both recorded grounds
at enough length that they need not be rebuilt: (a) a red harness run means the app is broken and
that alarm must not also mean a stale README sentence, in week one of a live term; (b) the hole is
already mostly closed sideways, because §11's failure text tells the reader to fix the executed count
from a run, so every check added or removed trips the sweep and hands over both numbers — leaving
only "somebody edits the executed count wrongly while touching no check at all", which is not the
failure that happened three times. It names WO-2.19's implementer as the proposer and WO-2.22 as the
refusal, so the loop closes rather than re-opening.

**The self-assertion was not built, not built smaller, and no TODO proposing it was left.**

### 5. The rest of the run is unchanged, proved by diffing a whole run — **met**

`diff` of the full run before and after is **two hunks and nothing else**:

```
16a17
> PASS | one `check()` call per line in the harness  :: 596 call-site line(s) in
  tools/verify-shell.mjs, none holding a second `check(` — which is what makes the count above a
  count of calls
19c20
< 16 checks · 15 passed · 0 failed · 1 to review
---
> 17 checks · 16 passed · 0 failed · 1 to review
```

§11's count clause line is byte-identical, still PASSing at **596** against `tools/README.md:636`
(the recorded sentence did not move — my README additions all sit after it). **No new REVIEW**, and
the standing sensitive-field-name REVIEW does not appear in the diff at all — still 181 mentions
across the same thirteen files. Exit 0.

### 6. `verify-shell.mjs` and `src/` byte-identical to HEAD by hash — **met, no harness run spent**

```
git hash-object tools/verify-shell.mjs   -> 05bd4c06c5290c40b37d2ed3b4386da30d8dfa7c
git rev-parse HEAD:tools/verify-shell.mjs -> 05bd4c06c5290c40b37d2ed3b4386da30d8dfa7c
git diff --stat -- src/ tools/verify-shell.mjs index.html sw.js  -> empty
```

Per the criterion's own instruction and the brief's § 2 note, **`node tools/verify-shell.mjs` was not
run**. Nothing in this work order is reachable from a browser: the change is two greps over two files
in `tools/`, and the harness mutation was byte-reverted and hash-verified. I did not conclude the
harness needed to run.

---

## What I could not verify

- **Nothing needing an iPad or human eyes arises here**, and no 👤 line was ticked. Two greps over
  two files in `tools/` have no device half; `TESTING.md` § WO-2.22 says so explicitly.
- **`verify-shell.mjs` is green on this tree** — asserted only by hash equality with HEAD, not by a
  run. That is what Acceptance 6 asks for and all it claims.
- **The one-call-per-line clause's behaviour on a trailing-comment false positive** is reasoned and
  documented, not observed: I did not plant a call line with a trailing `check(` comment, because the
  Traps refuse the occurrence-counting design and the clause reads the line as written by intent. I
  did measure the exposure rather than assume it (below).

---

## Evidence measured but deliberately not written into any Acceptance line

Per § 0 of the brief, all of it landed in `TESTING.md` § WO-2.22 and `tools/README.md`, with the
criterion each block closes named in the text. **No Acceptance line's wording was altered.** The only
change to the work order file is six `- [ ]` → `- [x]` characters inside WO-2.22's Acceptance block —
verified by reading the diff, which shows nothing else but the orchestrator's own pre-existing
`⬜ NOT STARTED` → `🤖 CLAIMED` status edit. I left the Status line for `--tick`.

**The false-`FAIL` risk the Traps name was measured before the clause was written**, by running the
sweep's own pattern over the harness in a throwaway script: **zero** of the 596 call-site lines hold a
second occurrence of any shape, and **zero** non-comment lines have a trailing `//` part that matches
the call pattern. So the clause is green today for a reason rather than by luck. Recorded in
`TESTING.md`.

---

## Decisions the work order did not settle

1. **Where the missing-file argument lives in the code.** The section's long header comment or an
   inline comment at the branch. I put it inline at the branch, following the precedent of the
   `!sites.length` arm three lines below, which carries its own reasoning inline. The header quote —
   *"greppable evidence that needs a human decision"* — travels with it, as the brief asked.

2. **No count was written into the `wo-sweep.mjs` comment.** The new ALLOWLIST bullet ends "No
   call-site line in the harness held a second occurrence of any shape when this was written" rather
   than repeating `596`. A third copy of that number in a file whose whole subject is numbers that rot
   would be an unguarded one; the guarded copy stays in `tools/README.md` where the sweep greps it.

3. **I did not add per-line evidence notes under the Acceptance criteria**, although WO-2.19's
   section in the same file does exactly that and is a visible precedent. § 0 of this dispatch
   forbids adding words to a criterion, and an italic evidence sentence appended to the line is
   words on the line. If the owner wants that shape back, the text is all in `TESTING.md` § WO-2.22
   and can be moved across by the owner's own ruling.

4. **The check name is `one `check()` call per line in the harness`**, a second `check()` result
   rather than a fourth branch of the existing chain — required by Acceptance 2, which needs the
   count clause green in the same run the new clause is red.

---

## Temptations declined, for the record

- **`verify-shell.mjs` asserting its own summary against `tools/README.md`.** It is exactly as small
  and as obvious as the work order predicts once §11 is in your head — a `results.length` comparison
  against the sentence, eight lines at the foot of the run. Not built, not stubbed, not TODO'd. The
  argument against it is now in `tools/README.md` rather than only in a work order, which is what
  Acceptance 4 is for.
- **Correcting Acceptance line 2's stale `560`/`561` figures.** They are stale by design and the line
  says so. Left untouched.
- **Updating the historical `16 checks` / `15 checks` figures in `CHANGELOG.md`, `TESTING.md`'s older
  sections and the closed work orders.** Those are dated records of past runs and are true as such.
  Only the live sentence in `tools/README.md` moved.
- **Tidying `report()`'s five-hit cap for the new clause.** Left as the house helper; `--verbose`
  already prints the rest.

---

## Nothing raised as needs-a-human

I found no Acceptance line that was wrong, unmeasurable or stale in a way that blocked the work.

---

## Files changed

- `C:\dev\planbook\tools\wo-sweep.mjs` — §11: missing file is a `FAIL` (was `REVIEW`), with the
  header's own `REVIEW` definition quoted at the branch; new `one `check()` call per line in the
  harness` check; new ALLOWLIST bullet recording that the count is a count of lines and pointing at
  the clause that makes that safe.
- `C:\dev\planbook\tools\README.md` — three new paragraphs (count-is-lines plus the severity change;
  the refusal of the harness self-assertion, both grounds; why the sweep's own count is unguarded),
  and `16 checks` → `17 checks`, taken from a run.
- `C:\dev\planbook\TESTING.md` — new § WO-2.22 at the foot of Phase 2: the six evidence blocks, the
  three-row mutation table, the false-positive measurement, and the no-👤-line note.
- `C:\dev\planbook\plans\work-orders\phase-2-attendance.md` — six Acceptance boxes ticked. **No
  wording changed.**

No commit, no push. `CHANGELOG.md` untouched.

---

## Draft changelog entry, for the teacher to accept, rewrite or discard

> **`tools/wo-sweep.mjs` §11 stops trusting two things it had been assuming.** A deleted
> `verify-shell.mjs` used to print a `REVIEW` and let the run exit 0 — the loudest possible disaster
> arriving as the quietest signal, and the one condition under which every claim the sweep makes about
> the harness is void. It is a `FAIL` now, and so is a missing `tools/README.md`. And the count it
> asserts was always a count of *lines*, which equals the count of calls only while no line holds two;
> a second call appended to an occupied line would have moved no number, passed, and left the recorded
> count quietly wrong. That premise is now a check that names the line. **16 → 17 checks**, off the
> summary line of a run rather than by incrementing. `tools/README.md` also records why the sweep's own
> count is left unguarded — it prints its true figure every run, in a second — and why
> `verify-shell.mjs` does not assert its own summary: a red harness run has to keep meaning "the app is
> broken", not "a sentence is stale".
