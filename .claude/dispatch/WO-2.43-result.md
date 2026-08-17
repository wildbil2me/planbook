# WO-2.43 — three more pointers in tools/README.md miss by little enough to be believed · result

**Implementer** Claude (work-order-implementer), Opus tier · **Date** 2026-08-17
**Tree at start** `602a6b5` clean apart from the orchestrator's `🤖 CLAIMED` line and the dispatch files.

## Files changed

- `c:\dev\planbook\tools\README.md` — the three pointers, two hunks, +18/−8.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — the four Acceptance boxes ticked. The
  `**Status**` line is **left at `🤖 CLAIMED`**: `.claude/agents/work-order-orchestrator.md:256` says the
  only exit from `🤖 CLAIMED` is the orchestrator's `--tick`, so it is not mine to move.
- `c:\dev\planbook\.claude\dispatch\WO-2.43-result.md` — this file.

`src/grade-engine.js` was read and not written. `CHANGELOG.md` untouched (draft below).

## What each anchor now says, and the grep that resolves it

All three greps below were run **after** my last edit to `tools/README.md`, and the output is quoted
from what the terminal printed, not predicted.

**1. `src/grade-engine.js:35-36` → the `classId`/`termId` filters.** Note now at `tools/README.md:1672-1675`.

```
$ grep -nF 'assignment.classId === classId' src/grade-engine.js
44:    && assignment.classId === classId
(hits: 1)
```

**2. `:41-42` → `scoreCell()`'s `studentId` lookup.** Note now at `tools/README.md:1677-1681`.

```
$ grep -nF 'hasOwnProperty.call(byAssignment, studentId)' src/grade-engine.js
51:  if (!byAssignment || !Object.prototype.hasOwnProperty.call(byAssignment, studentId)) return null;
(hits: 1)
```

**3. `tools/README.md:783` → the `check()` call-site sentence.** Note now at `tools/README.md:1837-1843`.

```
$ grep -nE 'holds [0-9]+ .check\(\). call sites' tools/README.md
894:**`verify-shell.mjs` holds 808 `check()` call sites**, and that is the number `tools/wo-sweep.mjs`
(hits: 1)
```

## Against the Acceptance list, one by one

### 1. All three references name their referent in the target file's own words, each a single-hit grep, re-resolved after the last edit — **met**

The three greps above are the evidence, each one hit, each run after the final edit. Distances
confirmed against the row's own arithmetic: `:35-36` → `:44` is the 9; `:41-42` → `:51` is the 10.

Two things about the third that the work order did not settle, and that a cold reader should have in
front of them:

- **A literal grep string cannot work for a same-file reference.** Writing the target's own words into
  `tools/README.md` makes the grep *two* hits — the anchor note and the sentence it points at — which is
  exactly the failure mode the acceptance line forbids. WO-2.39's three worked examples are all
  cross-file (`verify-shell.mjs`), so the idiom had no precedent for this case. **The way I went:** the
  anchor is `tools/wo-sweep.mjs` § 11's *own pattern* rather than a literal, written so its quoted form
  does not match itself — the `[0-9]+` in the note is not digits, so `grep -nE 'holds [0-9]+ …'` skips the
  line that contains it. Verified both directions: one hit on the real tree, and zero when the quoted
  form is fed to the same pattern in isolation. This also makes the work order's "the third is free"
  claim literally true — the string is § 11's pattern, so the standing check maintains it.
- **The brief's re-measure table names the wrong line for the third target.** Its row reads *"Traps'
  target `:830` → `:873` → `:847` — "…made almost none. Three things about it are worth knowing.""* But
  `:847` is where the sentence the pointer **wrongly lands on** sits; the sentence the work order's own
  table calls *"the call-site sentence"* — the one § 11 greps — is at **`:894`** today, which is where the
  sweep's PASS line independently says it is. I anchored to `:894`. A verifier who takes `:847` from the
  brief will find my anchor pointing somewhere else; `:894` is the right one and `grep -nE 'holds [0-9]+
  .check\(\). call sites'` is how to confirm it.

### 2. The old numbers survive as dated notes; no pointer was deleted — **met**

All three retired numbers are in the file, each with `until WO-2.43, 2026-08-17`:

- `` `src/grade-engine.js:35-36` until WO-2.43, 2026-08-17, by then nine lines above them, on the tail of a comment and `numberOrZero()` ``
- `` `:41-42` until WO-2.43, 2026-08-17, by then ten lines above it and on `assignmentsFor()`'s own signature `` — kept in its original bare relative form, which still reads against the filename named in the sentence before it.
- `` `tools/README.md:783` until WO-2.43, 2026-08-17, by then 111 lines short of it ``

**The third distance is 111, not the 43 or 47 the row's notes predicted.** `783 → 894`. The row measured
47 against `adb4fe6~1`, its own note said +43, and WO-2.44 then added lines *between* `:783` and the
target as well as above the reference, so the gap grew at both ends. 111 is a measured reading on
today's tree and is dated as one.

### 3. Nothing in the four out-of-scope categories changed — **met**

`git diff -- tools/README.md` is two hunks, at `@@ -1669,10 +1669,16 @@` and `@@ -1828,9 +1834,13 @@`.
Every out-of-scope category sits above both and appears nowhere in the diff. Located and confirmed
present on the post-edit tree:

| Category | Where it is now | In the diff? |
|---|---|---|
| the nine WO-2.19-tree numbers | `:1518` (`:4814`, `:6708`, `:10143`, `:12632`) and `:1525-1526` (`:11557`, `:11269`, `:11296`, `:11332`, `:11338`) | no |
| the quoted failure text | `:1456` — *"tools/verify-shell.mjs:495 hold(s) more than one `check(`"* | no |
| the self-declaring reference | `:1316` — `` WO-3.22 carries at `:370-376` (`:281-287` when this was written…) `` | no |
| `:NNN` in `src/` and `TESTING.md` | untouched — neither file is in `git status` | no |

Positive check as well as a negative one:

```
$ git diff -U0 -- tools/README.md | grep -E '^[+-]' | grep -E ':4814|:6708|:10143|:12632|:11557|:11269|:11296|:11332|:11338|mjs:495|:370-376|:281-287'
none of the four categories appears in the diff
```

I will name the temptation rather than pretend it was not there: the nine numbers at `:1518`/`:1525-26`
read as broken pointers on sight, and `:1456`'s `mjs:495` reads worse. Both are records of a reading of
another tree, the paragraph above each says so, and they stay numbers. Nothing done.

One in-scope-adjacent number I also left alone: the reference sentence's own **"713 call sites"**. That
is a measurement of the tree at WO-3.9 (the sentence it points at reads 808 today), so it is history in
the same category, and the deliverable is the *pointer*, not the count. Only `tools/README.md:783` was
replaced.

### 4. `node tools/wo-sweep.mjs` green, and `git diff --stat -- src/` empty — **met**

`node tools/wo-sweep.mjs` — run to completion, exit code **0**:

```
20 checks · 18 passed · 0 failed · 2 to review
```

§ 11's clause, which is the one this row could have broken, printed:

```
PASS | the recorded `check()` call-site count matches the harness  ::  808 `check()` call site(s) in
tools/verify-shell.mjs, matching tools/README.md:894 — call sites, not executed checks; the gap is named there
```

The two `REVIEW` lines are the standing pair (`sensitive field names outside src/backup.js`, `due-date
and late/missing on the same line`). Both name only files under `src/`, which this row did not open, so
neither is attributable here — and the sweep exits 0 with them, which is what "green" means for this tool.

```
$ git diff --stat -- src/
(no output)
```

`$ git diff --stat` overall: `plans/work-orders/phase-2-attendance.md | 2 +-`, `tools/README.md | 24
+++++++++++++++++-------`, `2 files changed, 18 insertions(+), 8 deletions(-)` — a 24-line diff for a
24-line edit, so no line-ending rewrite happened.

## Beyond the Acceptance list

- **`node tools/verify-shell.mjs` ran here and was green.** I waited for the process to exit and read its
  output file: `824 checks · 824 passed · 0 failed · 0 skipped`, `22,191 lines · 26.9 lines per check ·
  263s`, `[exited with code 0]`. It changes nothing about this row — no app code moved — but the brief
  put it in § 4 and a real run beats an environment report. Per `CLAUDE.md`, this is a green run and not
  a tick, and it closes no 👤 item.
- **`node tools/wo-gate.mjs --audit`** — PASS, dashboard rows all `ok`, Phase 2 `row 15/15 boxes 15/15`.
  Run because I ticked checkboxes and wanted the tracker checked afterwards, not because acceptance
  asked.
- **No `sw.js` CACHE bump needed.** `tools/README.md` is not in `SHELL`; the sweep confirms it —
  `PASS | every SHELL file change is paired with a CACHE bump :: planbook-shell-v72 was set at 5ea832f;
  no SHELL file has changed since`.

## Could not verify

Nothing in this row needs an iPad or human eyes; there are no 👤 lines in it and I ticked none. The one
judgment a human may want to overrule is **taste**: whether the two grade-engine anchors are worth the
five extra lines of parenthetical they cost in a paragraph that was already dense. I judged yes — the
file's own convention at `:1517` and `:1826-1829` spends the same words — but that is a reading of the
prose, not a measurement.

## Left undone, deliberately

**No closing note added to the work-order row recording where the three references now sit.** It was
tempting: the row's own note demands re-measurement, and I have a fifth measurement (`:1672`, `:1677`,
`:1837`). But writing today's line numbers into a row whose entire thesis is that line numbers in prose
go stale would make this note the *next* wrong number in a row about wrong numbers, which is the exact
move the row's own +43 note refused. The measurements live here instead, dated, and the file itself now
carries text anchors that need no re-measuring. If the orchestrator wants a close-out sentence on the
row, it should be about the anchors, not their addresses.

## Draft CHANGELOG entry — the teacher's call, not mine

> **Docs** — Re-anchored the last three line-number pointers in `tools/README.md` to their target's own
> text: the grade engine's `classId`/`termId` filters and `scoreCell()`'s `studentId` lookup are now
> found by grep rather than by a number nine and ten lines off, and the file's self-reference to its own
> `check()`-count sentence is anchored to the pattern `wo-sweep.mjs` § 11 already greps for. Each retired
> number survives as a dated note. The self-reference had drifted from a 47-line miss to 111 in a single
> day, by two unrelated work orders inserting prose above it — which is the argument for the text anchor
> made by the file itself while the fix sat unstarted.
