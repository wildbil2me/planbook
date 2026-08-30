# WO-1.40 — the file a human types is outside every fence · implementer's result

**Route** Claude (work-order-implementer), Opus tier
**Date** 2026-08-30
**Status of this report** the implementer's own account. Every command below was run to completion
and its output read, **except `verify-shell.mjs`** — see § 5, which says exactly how far it got.

---

## 1. What was built, as file paths

| File | What changed |
|---|---|
| `C:\dev\planbook\tools\wo-sweep.mjs` | **New § 21**, +255 lines, **zero deletions**. Two `check()`/`review()` call sites per pair. `IGNORE_DIRS`, `walk()`, `ALL`, `CODE`, `STYLE` and `isCode` are byte-identical to HEAD |
| `C:\dev\planbook\plans\work-orders\README.md` | **New `## The pipeline's own files`** section, immediately after `## The files`. The map Acceptance line 4 asks for |
| `C:\dev\planbook\tools\README.md` | Sweep count `33-check` → `36-check`, § 21 named in the same cell, plus a note that the count is hand-maintained and was already stale |
| `C:\dev\planbook\TESTING.md` | New `### WO-1.40` entry under Phase 1, carrying the eleven fixture drives and the four mutations |
| `C:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | Six Acceptance boxes ticked. **Status left at `🤖 CLAIMED`** — the handoff is the orchestrator's to run |

`src/`, `index.html`, `sw.js`, `manifest.webmanifest` and every stylesheet are untouched, so **no
`CACHE` bump is owed** and nothing reaches a device. `git diff --check` is clean, exit 0.

## 2. The design, and the four Traps

**Two checks per pair, and they are different kinds of thing.**

- `the pipeline's stops — the shared-claim list still matches .claude/agents/work-order-orchestrator.md`
  — **PASS/FAIL.** Mechanical: do the three claims still find their sentences in the reference file,
  and does the map section still name both halves. A grep for a sentence is not a prose judgement, so
  this reddens and exits 1.
- `the pipeline's stops — .claude/commands/wo.md does not contradict .claude/agents/work-order-orchestrator.md`
  — **PASS/REVIEW.** Prose: one file giving an instruction the other forbids, printed as both
  sentences with both line numbers. Never a FAIL.

**Trap 1 — no line count.** Nothing in `wo.md` is required to match anything. Every anchor that *must*
match lives in `work-order-orchestrator.md`, the file that grows by accretion, where a change to one
*is* the pipeline change this fence exists to notice. The caller's file can be rewritten wholesale and
stay green.

**Trap 2 — contradiction, not asymmetry, and `REVIEW` is the honest state.** Silence is green: a
claim whose token appears nowhere in `wo.md` is that file telling less, which is its job. This is a
deliberate inversion of § 11's "an empty grep is a broken grep" rule, and it is written into the
allowlist with the reason. A contradiction is reported as evidence, not a verdict, in the state the
sweep already prints *"greppable evidence, not a verdict"* over. **F8a/F8b below is the pair that
settles this**: the same invented sentence is green in the verifier's passage and reported in the
implementer's.

**Trap 3 — reached by path.** `.claude` stays in `IGNORE_DIRS` at `wo-sweep.mjs:53`; the walk is
untouched (confirmed by `git diff`, 255 insertions and 0 deletions). § 21 opens its files with
`path.join(REPO, …)` and nothing else in the sweep sees them.

**Trap 4 — a fence somebody is pointed at.** `plans/work-orders/README.md` § The pipeline's own files
is a five-row table of the pipeline's prose files and what watches each, with **two rows reading
"Nothing"** so the gap is visible rather than implied. The check asserts the **section**, not the
file — both paths were already quoted in that README, in the running-order row that booked this work
order, so a whole-file search would have passed on a mention nobody could act on (fixture F6 proves
that distinction).

**Built to take a pair, for WO-1.41.** `DRIFT_PAIRS` is a list; a pair is `{ subject, reference,
against, mappedIn, regions, claims }`. WO-1.41 adds a second entry and needs no code. Its own Trap 4
— *a hand-maintained list of shared rules is the honest mechanism* — is the shape `claims` already
has, one entry per claim with the sentence that settles it.

## 3. Acceptance, line by line, with the evidence

Every drive below was run over a **copy of the tracked tree** in the session scratchpad
(`git ls-files` → `cp --parents`), with `node tools/wo-sweep.mjs` executed from inside each copy.
**The repository's own `.claude/` files were never edited to make a check fire.**

**1. Reads `wo.md`, goes red or `REVIEW` on a contradiction — driven against a planted
contradiction. — [x] met.**
- **F1, the real historical file.** `git show 63c5e00:.claude/commands/wo.md` — `wo.md` exactly as
  WO-1.38 left it — dropped into a copy: **`REVIEW`, all three claims**, at `wo.md:23`, `:24`, `:25`,
  cited against `work-order-orchestrator.md:346`, `:399`, `:408`. The middle citation is the defect
  the work order quotes, in its own words: *"When the completion notification arrives, relay the
  report in full — … the Acceptance list wi…"*.
- **F2, a plant inside the current shape.** *"**Do not mark an Acceptance list at this stop**"* →
  *"**Mark the Acceptance list at this stop**"*: **`REVIEW`**, one claim, `wo.md:35`. This one matters
  more than F1: the historical file has no *Second invocation* passage at all, so a check could have
  caught it by the absence of the passage rather than by the instruction. F2 has the passage and the
  contradiction is inside the other one.
- **F10b.** *"When it comes back, relay the report in full."* in a file that names one stop:
  **`REVIEW`**, claim 1.

**2. `.claude` stays in `IGNORE_DIRS`, walk unchanged. — [x] met.** `git diff tools/wo-sweep.mjs`
is 255 insertions, 0 deletions; no `-` line anywhere. `IGNORE_DIRS`, `walk()`, `ALL`, `rel`, `isCode`,
`CODE`, `STYLE` are untouched. § 21 resolves its three paths by `path.join(REPO, …)` and FAILs both of
its checks, loudly, if any of them is not there — because a moved file cannot be found by a walk that
never enters the directory.

**3. Legitimate asymmetry stays green — proved with a fixture. — [x] met.** Four fixtures, all PASS:
- **F3, narrower telling.** The whole *One work order is two invocations* section replaced by *"the
  orchestrator's own file governs what each report contains; it is not restated here."* — **PASS**,
  and the run *says* the passage was not found rather than going quiet about it.
- **F4, the verifier's stop only.** The implementer's paragraph deleted, the verifier's Acceptance-list
  demand kept — **PASS**, 4 occurrences read.
- **F8a vs F8b, the one that settles it.** The same invented sentence, *"Mark that Acceptance list
  item by item, and relay the maintenance protocol beside it."*, is **PASS** inside the verifier's
  passage (F8a) and **`REVIEW`** in the implementer's (F8b). Same file, same sentence, two answers.
- **F10a.** *"When it comes back, relay the report in full."* in a file that names the second stop —
  **PASS**, where F10b on a one-stop file is `REVIEW`.

**4. `.claude/commands/` named in the system's own map. — [x] met.**
`plans/work-orders/README.md` § The pipeline's own files. Placed there on the Trap's own test —
*something a person reads before editing the pipeline* — and given a `##` heading rather than a `###`
**deliberately**: `wo-gate.mjs`'s § The files parser scans to the next `/^##\s/`, so a `###`
sub-section would have had `--audit` reading `AGENTS.md` as a missing phase file. `--audit` is green
and still reports its ten § The files rows.
- **F6**: the section stops naming `wo.md` (row and prose) → **`FAIL`**, exit 1.
- **F7**: the section deleted outright → **`FAIL`**, exit 1, naming the heading it wanted.

**5. The count is up by the number of new checks and the self-check is green. — [x] met, and this is
the one line I had to interpret. Read this paragraph before accepting the tick.** `wo-sweep.mjs`
**has no `--self-check`** — the only one in the toolchain is `wo-gate.mjs`'s, and I ran it because my
`plans/work-orders/README.md` change is inside its sandbox subject: `PASS | 31 of 31 plants were
caught`, exit 0. The sweep's countable instrument is the check count recorded in `tools/README.md`,
and it moved in the same pass: **the run went `34` → `36`, +2 for two new checks**, while the
*recorded* number went `33` → `36` because **it was already stale by one** — § 20 landed at WO-5.1 on
2026-08-28 and the line did not move. That correction is noted in `tools/README.md` itself rather
than made silently. And the substance the line is about — checks driven rather than asserted — is
**eleven fixtures and four mutations**, all recorded in `TESTING.md` § WO-1.40. If a verifier reads
the line as requiring a `--self-check` in the tool the work landed in, this box is the one to
challenge; nothing else in this report depends on it.

**6. `wo-sweep.mjs` green and `--audit` green on a clean tree. — [x] met.**
- `node tools/wo-sweep.mjs` → **`36 checks · 33 passed · 0 failed · 3 to review`**, exit 0.
  **No new REVIEW line**: the three are the standing sensitive-field-name census, the
  due-date/late-missing census and the mockup-banner one, all over `src/` and `design/`, none of
  which this work order touches. It was `34 · 31 · 0 · 3` before.
- `node tools/wo-gate.mjs --audit` → **`PASS`**, exit 0, `0 problem(s)` on every arm.
- `git diff --check` → clean, exit 0.
- The tree carries this work order's five modified files and nothing else (`git status --short`);
  the two untracked files are this dispatch's own brief and status.

## 4. The check was mutated, and here is what did **not** go red

Four one-line mutations of § 21, each driven over a copy so the tree was never edited:

| Mutation | Result |
|---|---|
| the `denies` filter forced off | **`REVIEW` on the clean tree** — it is what keeps today's `wo.md` green, because the file states the prohibition twice in the words of the prohibition |
| the `confinedTo` region skip forced off | **clean tree stays green; F8a goes `REVIEW`** at `wo.md:47`. The region excuses nothing on today's file that `denies` and `excuse` do not already excuse, so it took a fixture to prove it works at all |
| the italic-parenthetical skip forced off | **clean tree stays green; F9 goes `REVIEW`** at `wo.md:50`. F9 is `wo.md`'s closing note reworded to quote the old demand *without a negation in the sentence* — today's note happens to carry *"never reads it"*, so the guard is unexercised by the real file and would have gone unproven |
| the `excuse` word forced off | **nothing goes red anywhere.** Correctly not caught: `excuse` and the region overlap on both of the caller's real demands. Defence in depth, not coverage — recorded rather than claimed away |

And one accidental proof worth keeping: the first run of § 21 **went red on its own anchors**, because
both files are hard-wrapped and the sentence settling claim 2 sits as `it marks no\nAcceptance list`.
Every literal space in a pattern now means whitespace-including-newline (`wrapped()`), with the scar
at the line.

## 5. What I could not close

**`node tools/verify-shell.mjs` did not finish.** I started it in the background at the top of the
sitting and it was **still running when this session ended**, at **1,177 of an expected ~39,000
output lines after roughly fifteen minutes**, with `grep -c "^FAIL"` reading **0** over what it had
printed. The recorded runs take ~430s for the whole thing, so this is the sandbox's CDP being slow
rather than anything about this change. **I am not reporting a result for it, and the run was killed
unfinished when I returned** — a partial log with no `FAIL` in it is a partial log, not a green run. It is worth a
local re-run before the verdict, though nothing in this work order can move it: `src/`, `index.html`,
`sw.js`, the manifest and every stylesheet are byte-identical to HEAD, and `verify-shell.mjs` never
opens `tools/`, `plans/` or `.claude/`.

**No 👤 and no 📆 line exists in this work order, and I ticked neither kind.** Nothing here renders
and nothing reaches a device.

## 6. Decisions the work order did not settle

- **`REVIEW` for the prose half, `FAIL` for the mechanical half.** The work order allowed *"red or
  `REVIEW`"* and its Trap argued for `REVIEW`. I split them: whether two documents contradict each
  other is a person's call, but whether the claim list still matches the file it is maintained
  against is a grep, and a rotted list masking a live contradiction would be § 11's
  green-from-a-distance failure one document up. That is why there are two checks and not one.
- **The map got a `##` heading, not a `###`.** Forced by `wo-gate.mjs:1483`, which scans § The files
  to the next `/^##\s/`. A `###` sub-section would have put my `AGENTS.md` row inside the phase-file
  audit and broken `--audit`. Found by reading the parser before writing the section, not by the
  failure.
- **The map check reads the section, not the file.** F6 exists because the first version passed on a
  mention in the WO-1.40 running-order row.
- **Three claims, and two kinds.** Claims 2 and 3 are scoped by *region* and survive a rewrite; claim
  1 names one instruction — the single-return one that was actually in the file — and a rewrite that
  invents new wording for the same mistake escapes it. The header says so under **STILL A WIDENING
  RATHER THAN A CLOSURE** rather than promising more than a grep can do.

## 7. Out of scope — what I did not do, and why

- **`wo.md`'s closing note is now false and I left it alone.** It reads *"**Nothing checks this
  file.** … **Change the shape there and change it here in the same sitting**, until WO-1.40 gives
  this a fence that can say so on its own."* Something checks it now. The work order's Out-of-scope
  line says *"the wording of `wo.md` itself"* is out of scope, and I honoured that literally even
  though the note names WO-1.40 as its own terminus and editing the file under test in the same pass
  as building the test would muddy the evidence a verifier reads cold. **Drafted replacement, for the
  teacher:**

  > *(**`tools/wo-sweep.mjs` § 21 watches this file** against `.claude/agents/work-order-orchestrator.md`,
  > on three claims about where a dispatch stops — reached by path, because `.claude` is in the sweep's
  > `IGNORE_DIRS`. It knows three claims and no more, and it reports a `REVIEW` rather than failing a
  > run, so **change the shape there and change it here in the same sitting** is still the rule; the
  > fence is a second reader, not a replacement for one. `plans/work-orders/README.md`
  > § The pipeline's own files is the map.)*

- **`plans/work-orders/README.md`'s WO-1.40 running-order row** says *"**`.claude/commands/` is named
  nowhere in this system**"* in the present tense, and that is no longer true either. Running-order
  prose is the orchestrator's to maintain; I left it.
- **I did not widen `IGNORE_DIRS`, and I did not add a check for the sweep's own recorded count.**
  The second was tempting the moment I found `33` against a tree printing `34` — § 11 does exactly
  this job for `verify-shell.mjs` and the transliteration is half an hour. It is a second subject in
  a work order that had one. **Proposed follow-up, Size S:** *§ 11's census, turned on the sweep
  itself* — assert `tools/README.md`'s `N-check standing sweep` against `results.length`, which is a
  number the sweep already knows at the point it prints the summary and which no grep can reach from
  outside. It would have caught this rot on 2026-08-28.

## 8. `CHANGELOG.md`

Not written, per the standing rule — it is prose about what a change *means* and the teacher decides.
Draft, if it is wanted:

> **Tooling.** The file a human types to start a dispatch is now read by something. `wo-sweep.mjs`
> § 21 compares `.claude/commands/wo.md` against `.claude/agents/work-order-orchestrator.md` on three
> claims about where a dispatch stops, and says so when they disagree — as evidence for a person,
> because the two files are supposed to differ and only a contradiction is a defect. It reaches them
> by naming their paths; `.claude/` is still invisible to every other check. The map of what watches
> which pipeline file is `plans/work-orders/README.md` § The pipeline's own files, and two of its five
> rows still read *Nothing*.
