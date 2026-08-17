# WO-2.37 — the Codex cap silently excludes any work order with a slow acceptance · result

**Implementer** Claude (work-order-implementer, Opus) · **Date** 2026-08-16
**Route as briefed** Claude at the Opus tier — process prose plus a reasoned decision on a constant.

**Outcome in one line.** The cost of proving a work order is now a Codex-column bullet in
`ROUTING.md` with the arithmetic worked underneath it; `INVOKE_TIMEOUT_MS` was examined and
**deliberately left at twenty minutes**, with the reasoning and the SIGTERM consequence at the
declaration; and a `--budget <minutes>` pre-flight refusal was built into `tools/codex-invoke.mjs`,
demonstrated below with its output and exit codes. Nothing under `src/` was touched and the runner
was never invoked.

---

## Against the Acceptance list, one by one

### 1. `ROUTING.md`'s rubric asks about the cost of proving the work — ✅ met

**What I wrote, and the shape I chose.** A **sixth bullet in the Codex column**, plus three short
paragraphs under it, plus **a fourth row in the "Which Claude" table**. Three touch points, one
file, all inside the rubric (`plans/work-orders/ROUTING.md:137-167` and `:186-193`).

Why that shape rather than a Claude-column bullet or a section of its own:

- The Codex column is **"all of these"** — a conjunction. A budget that does not fit removes the
  Codex route by failing a required condition, which is exactly the logic wanted, and it puts the
  question in the same list a router is already walking rather than in a section they must remember
  to visit.
- A **Claude-column bullet would have been wrong**, not merely different. That column is "any of
  these is true" and its six triggers are all judgment tests; the file's own "Which Claude" table
  then reads "routes to Claude on its own merits → **Opus**". A seventh trigger there would have
  sent every budget-excluded work order to Opus — the opposite of what WO-2.34 actually did, and it
  would have quietly undone the § "Which Claude" cost argument.
- A **section of its own** would have made the question skippable. The whole defect this row
  records is a constraint that "appears, or fails to appear, depending on whether the person routing
  thinks of it unprompted".
- The **"Which Claude" row** was needed because the budget case is structurally a *fallback*: the
  work is Codex work, the runner is what does not fit. That is the same shape as a failed probe, so
  it lands on **Sonnet**, and the row's Because column says to read the Claude column first so a
  work order there on its own merits stays Opus.

**Does it reproduce the three routes cold?** Yes — checked against what the three briefs actually
say, not against memory:

| Work order | My rubric, applied cold | Route it actually got |
|---|---|---|
| WO-2.34 | Codex on the first five bullets, fails the sixth (4 runs × 264s ≈ 17.6 min) → "Codex on the work, budget does not fit" → **Sonnet** | **Claude Sonnet** — "re-routed to Claude Sonnet on a capacity fact rather than a judgment one" |
| WO-2.35 | In the Claude column on its own merits (the deliverable *is* a decision; Traps are judgment) → **Opus**, budget irrelevant to the tier | **Claude Opus** — "on the work order's own merits, not as a fallback" |
| WO-2.36 | In the Claude column on its own merits (a decision among three named options, plus reader-facing prose) → **Opus** | **Claude Opus** — "Judgment trap and prose are two separate Claude columns" |

The tier rule that makes the last two come out right is stated in the new table row and in the
worked-examples paragraph: **the budget can take Codex off the table; it never decides the tier.**

### 2. The `INVOKE_TIMEOUT_MS` decision is written down with its reasoning — ✅ met

**Decision: left at twenty minutes, deliberately.** Written as three bullets at the declaration
(`tools/codex-invoke.mjs:50-64`), and summarised in `tools/README.md`:

1. **Raising it is the named trap.** `verify-shell.mjs` is ~4.4 min a run, so four runs fit inside
   forty minutes and five do not; the next slow Acceptance is a bigger number again. A cap picked to
   make one symptom disappear hides the same exclusion one work order further out.
2. **It is not the constraint that binds first anyway.** The orchestrator is told to run this script
   from a Bash call with a **600000 ms** timeout — ten minutes — which its own step 4 calls "what
   actually protects the session". That fires first, it is outside this file, and raising the number
   here would move nothing. *(This is the one finding in the work order's neighbourhood that nobody
   had written down: the effective cap on a Codex dispatch today is ten minutes, not twenty. I
   recorded it at the constant rather than acting on it — changing the orchestrator's outer timeout
   is not a deliverable here.)*
3. **A `--timeout` flag was considered and refused.** The work order blesses "per-invocation, so a
   caller can buy what a work order needs" — but a caller who can raise the cap can buy exactly the
   mid-mutation SIGTERM this row exists to name. `--budget` spends the same argument in the other
   direction: the caller states what the Acceptance needs and is refused *before* anything is
   dispatched.

### 3. The comment says what expiry does to the working tree — ✅ met

`tools/codex-invoke.mjs:41-48`, the paragraph headed *"WHAT EXPIRY DOES TO THE WORKING TREE, because
this reads like a patience setting and is not."* It names `spawnSync`'s **SIGTERM**, says whatever
the run had already written **stays written** and that nothing here rolls it back, and names the
*mutate · run · revert* work orders as the ones most likely to be killed mid-mutation — "not a failed
check to re-run; a broken app with nobody watching".

### 4. A pre-flight refusal, demonstrated not described — ✅ met, built and run

Built as `--budget <minutes>`. It refuses in `refuseIfBudgetDoesNotFit()`, called from `runInvoke()`
**before** the brief is resolved, before the install is inspected, and before `spawnSync` is reached
— so the answer reads the same on a machine with no Codex on it, and the demonstration is instant.

**Refusal (the case the work order asks for).** WO-2.34's real arithmetic, 17.6 minutes:

```
$ node tools/codex-invoke.mjs --brief .claude/dispatch/WO-2.37-brief.md \
      --out .claude/dispatch/WO-2.37-would-be-result.md --budget 17.6
codex-invoke: REFUSED before dispatch — 17.6 min of stated harness runs plus the 10 min reserve for
reading, writing and reverting does not fit inside the 20 min INVOKE_TIMEOUT_MS, and a dispatch
killed at that cap is SIGTERMed with its mutations still in the tree; nothing ran, nothing was
written, the runner was never asked — route this one to Claude Sonnet (plans/work-orders/ROUTING.md
§ "Which Claude").
exit=2
```

*(One line as printed; wrapped here for the file. `.claude/dispatch/WO-2.37-would-be-result.md` was
not created — `ls` reports no such file.)*

**And it is not unconditional**, which is the check this project would ask for next — a gate that
always refuses is a gate that proves nothing:

| Command | Printed | Exit |
|---|---|---|
| `--budget 8`, brief that does not exist | `stated run budget 8 min + 10 min reserve fits inside the 20 min cap.` then `brief not found at …NO-SUCH-brief.md` | 2 (at the *next* check, not the budget) |
| `--budget 10` (the boundary that fits) | same fit line, then `brief not found` | 2 (next check) |
| `--budget 10.1` (the boundary that does not) | `REFUSED before dispatch — 10.1 min …` | 2 |
| `--budget soon` | `--budget takes the harness minutes this work order's Acceptance needs, as a positive number (got 'soon').` | 2 |
| `--probe --budget 4` | `--budget applies to a dispatch, not to --probe (the probe caps itself at two minutes).` | 2 |

**The exit code, decided rather than defaulted.** It is **2, never 1**. Exit 1 in this file means
*codex ran and failed* — a runner verdict, and the code that implies the tree may have been written
to. A budget refusal is the opposite: nothing ran, the runner was never asked, the tree is untouched.
That is the same family as the existing exit-2 caller-side refusals (missing `--brief`, missing brief
file, unrecognized flag), so the header block was rewritten to state the invariant the two kinds of 2
share rather than to keep calling all of them "a harness bug" — `tools/codex-invoke.mjs:21-27`. The
header block is true after the change; I re-read it against every `fail()` in the file.

**A budget that fits prints that it fits.** A gate silent on success is indistinguishable from a gate
nobody wired up, which is this repo's own recurring failure shape.

### 5. `wo-sweep.mjs` green and `git diff --stat -- src/` empty — ✅ met

```
20 checks · 18 passed · 0 failed · 2 to review
SWEEP EXIT=0
```

Run twice — once mid-work, once after the last edit; identical both times, zero lines starting
`FAIL`. The two `REVIEW`s are the standing ones (sensitive field names outside `src/backup.js`; a due
date on the same line as a late/missing flag), both in files this work order never opened, and the
sweep's own header defines `REVIEW` as never failing the run.

`git diff --stat -- src/` **printed nothing**. `git status --short` names five modified files and no
path under `src/`. `git diff --check` is clean and the diffstat is proportional (135 insertions
across 5 files) — no CRLF rewrite.

---

## What I did not run, and why

- **`node tools/verify-shell.mjs` — not run.** The brief's § 4 orchestrator note says it is not
  required for this work order and that needing it would mean I had edited something Acceptance
  line 5 forbids. I did not edit `index.html` or `src/`, so there was nothing for it to measure.
  Not a "could not run" report: a deliberate omission on the brief's own instruction.
- **`node tools/codex-invoke.mjs --probe` — not run.** It spawns a real Codex process, and the work
  order's Traps say the runner is not the subject. I changed nothing inside `runProbe()`; the only
  new code on that path is the `--probe --budget` refusal, which is demonstrated above. **A reader
  who wants the probe path re-proven should run it by hand** — that is the one claim in this report I
  am declining to make rather than making weakly.
- **No 👤 lines exist in this Acceptance list**, so none were ticked. `CHANGELOG.md` untouched.
- **`node tools/wo-gate.mjs --audit`** was run as a courtesy before the tick: `PASS`, all eight
  dashboard rows `ok`, so `--tick` will not refuse on tracker drift.

## Decisions the work order left open, and which way I went

- **The reserve is 10 minutes, and it is a judgment.** The refusal fires when *stated budget +
  reserve > cap*, i.e. above 10 minutes of harness runs. Nothing in this repo measures how long a
  Codex dispatch spends reading and writing; the only reading time recorded anywhere is a **Claude**
  implementer's 21 minutes on WO-3.5, which is longer than the whole cap. So the number is
  deliberately coarse, the comment says so, and the refusal prints every term so a future reader can
  argue with the reserve rather than with the arithmetic around it.
- **`--budget` is optional, not required.** Making it required would have broken the documented
  invocation in three places for a check the rubric already enforces at routing time. The rubric is
  where the multiplication is *required*; the flag is where it can be *enforced*. Consequence,
  stated plainly: a caller who omits it gets today's behaviour exactly, including today's silence.
- **I edited `.claude/agents/work-order-orchestrator.md`** — one flag on step 4's command line and a
  four-line bullet, imperative only, with the reasoning left in `ROUTING.md` as the brief preferred.
  Without it the flag would exist and never be passed. **Its line-count rule was honoured in the same
  edit**: 322 → **326**, and I re-counted with `wc -l` after the final edit rather than by arithmetic.
- **I did not add a `plans/dispatch-retro.md` § Codex entry.** The retro records what a failure cost;
  this cap has not yet cost anything — it was routed around three times. The rubric carries the
  reasoning, which is what the brief asked for. If a dispatch is ever SIGTERMed mid-mutation, that
  event is the retro entry, and it should be written then with the actual damage in it.
- **`TESTING.md` untouched.** Nothing here changes what a teacher sees.

## Temptations declined, recorded rather than acted on

- **Raising the outer Bash timeout, or filing that as a fix.** The ten-minute outer cap is the real
  binding constraint and it is not in this work order's Deliverables. It is written down at
  `INVOKE_TIMEOUT_MS` and nothing more. *(If anyone wants it pursued: the honest question is whether
  a Codex dispatch should be run detached and polled rather than held inside one Bash call. That is a
  work order, not an edit.)*
- **Making the sweep assert the rubric bullet exists.** `wo-sweep.mjs` is app-facing greps; a check
  that greps a prose file for a paragraph is the "fixture that cannot express the failure" the brief
  warns about.
- **Rewriting exit code 2 into a 3.** A new code would have been cleaner in theory and would have
  broken the two agent files that read 0/1/2, for a distinction the message already carries.

## Files changed

- `c:\dev\planbook\tools\codex-invoke.mjs` — header block (usage + exit codes), the
  `INVOKE_TIMEOUT_MS` comment and decision, `WORK_RESERVE_MS`, `--budget` parsing, the
  `refuseIfBudgetDoesNotFit()` pre-flight, and the `--probe --budget` guard.
- `c:\dev\planbook\plans\work-orders\ROUTING.md` — sixth Codex-column bullet, the SIGTERM paragraph,
  the three worked examples, the `--budget` pointer, and the fourth "Which Claude" row.
- `c:\dev\planbook\.claude\agents\work-order-orchestrator.md` — `--budget` on step 4's command and
  one bullet; line count corrected 322 → 326.
- `c:\dev\planbook\tools\README.md` — the `codex-invoke.mjs` table row, and a paragraph on the cap,
  the SIGTERM, and `--budget`.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — WO-2.37's five Acceptance boxes ticked
  with their evidence.

## Draft `CHANGELOG.md` entry — the teacher's call, not mine

> **Routing now asks what it costs to prove a work order, not just what the work is.** Codex
> dispatches are capped at twenty minutes end to end, which quietly excluded every work order whose
> acceptance needs several full harness runs — and the cap arrives as a SIGTERM that leaves a
> half-applied mutation sitting in the working tree. `ROUTING.md` asks for the multiplication before
> the route is chosen, `codex-invoke.mjs --budget` refuses a dispatch that cannot fit before it
> starts, and the cap itself was left at twenty minutes on purpose, with the reasoning written where
> the next reader will hit it.

---

# Correction round — 2026-08-16 · the exit-2 invariant the SIGTERM path broke

**Implementer** Claude (work-order-implementer, Opus) · one ❌ from the verifier, plus one item the
verifier flagged as *not* a ❌ and asked to be settled in the same sitting. Nothing else was touched:
the five Acceptance lines that passed were not re-worked, no new deliverable was added, `src/` is
still untouched.

## The ❌, and what I did about it

The header block I wrote in round one said exit 2 means *"nothing was dispatched, the runner was
never asked, and the working tree is untouched."* A dispatch SIGTERMed at `INVOKE_TIMEOUT_MS` also
exited 2, printing *"could not be run"* — so the one reader who could catch a half-applied mutation
was being told there was nothing to look at. The verifier is right, and it is worse than a wording
slip: **this exact mislabel has already happened once.** `.claude/dispatch/WO-3.15-status.md:20-25`,
2026-08-14 — codex wrote all seven of its files, failed to exit, was killed at the cap, and the
script reported `ETIMEDOUT` and exit 2 over **206 insertions across 7 files** still sitting in the
tree. That entry ends *"Proposed follow-up, not fixed here."* This is the fix.

**I made the header true rather than vaguer**, as instructed, and did it by giving the case its own
exit code instead of loosening exit 2:

- **New exit code 3 — `invoke` only: started, then killed.** Documented in the header block
  (`tools/codex-invoke.mjs:30-37`) with the WO-3.15 scar in it, and the instruction that matters:
  read `git status` and the diff before doing anything else, because the work may be partial,
  half-applied, or complete.
- **Exit 2's paragraph now reads "never started — codex was not asked, or could not be"**
  (`:23-29`). The invariant sentence is unchanged in substance and is now true of every path that
  reaches it. The budget refusal's reasoning — which needs exactly that invariant — survives intact,
  which is why I did not soften it.
- **The `INVOKE_TIMEOUT_MS` comment was not weakened.** It gained one sentence at the end of the
  SIGTERM paragraph pointing at the new code (`:57-58`): *"runInvoke() reports that kill as its own
  exit code — 3, never 2 — because the caller who has to go and read the diff is the one reading the
  exit code."* The two accounts 180 lines apart now agree, and they agree on the true one.
- **The split at the old `:225`** is `tools/codex-invoke.mjs:250-255`. Its message begins
  `KILLED, not refused` and never says "could not be run".
- **The same split, in the probe** (`:169-178`) — because the header has to be true of *every* exit-2
  path, not only the dispatch one. A probe killed at `PROBE_TIMEOUT_MS` used to exit 2 as well. It
  now falls through to the existing `ok.txt` check and reports **`SMOKE FAILED`, exit 1** — no new
  semantics needed, because "codex was asked and wrote nothing" is precisely what exit 1 already
  means and precisely what the probe exists to answer. Step 2b of the orchestrator agent file needed
  no change as a result.

**The discriminator, and why it is `signal` rather than `error.code === 'ETIMEDOUT'`.** `spawnSync`
reports a child that never started *and* a child that was started and killed in the same `error`
field. I measured the three cases rather than assuming them:

```
TIMEOUT  status= null signal= SIGTERM error= ETIMEDOUT
ENOENT   status= null signal= null    error= ENOENT
MAXBUF   status= null signal= SIGTERM error= ENOBUFS
```

`signal` is set only for a child that existed long enough to be signalled. Testing it — rather than
testing for `ETIMEDOUT` by name — also catches the 16 MB `maxBuffer` overrun, which is the other way
this script can kill a running dispatch, and which would otherwise have kept the old mislabel. Both
comments say so at the branch.

## How I demonstrated the header is now true of the timeout path

Exercised, not reasoned about — *mutate · run · revert* on `INVOKE_TIMEOUT_MS`, against the real
`codex` on this machine, in a throwaway git repo under the scratchpad so nothing could reach the
project tree. Verbatim, with the constant temporarily at 6 s:

```
$ node tools/codex-invoke.mjs --brief <scratch>/kill-brief.md --out <scratch>/killdir3/result.md --cwd <scratch>/killdir3
codex-invoke: KILLED, not refused — codex started, ran, and was ended by SIGTERM before it could
exit: it hit the 0.1 min INVOKE_TIMEOUT_MS. Nothing rolled the tree back: whatever this dispatch
wrote is still in it, INCLUDING any deliberate mutation it was holding mid-check. Read 'git status'
and the diff before re-dispatching or re-routing — the work may be partial, half-applied, or complete
(WO-3.15 finished its work and was killed anyway). This is not a verdict on the runner and not exit
2's "nothing was dispatched".
EXIT=3
```

*(One line as printed; wrapped here. "0.1 min" is the mutated 6 s formatted by the same `minutes()`
the rest of the file uses — with the constant at its real value the sentence reads "20 min".)*

**An earlier run at a 15 s cap proved the other half of the claim — that the writes survive.** The
kill landed with `landed.txt` already written into the run's cwd, and `git status` there reported
`?? landed.txt` afterwards. That is the header's "this dispatch's writes are still in it", observed
rather than inferred. *(The 15 s run was repeated after I reworded the message; that time codex
**finished in under 15 s** and the script exited **0** with the output file written — an accidental
but welcome check that the success path is unharmed. The kill was then forced at 6 s.)*

**The probe path, both ways.** With `PROBE_TIMEOUT_MS` temporarily at 4 s:
`SMOKE FAILED` / `codex exec exited null (killed by SIGTERM, ETIMEDOUT) and wrote no file.` / **exit
1** — previously this was exit 2. With the constant restored to 120 s, `node tools/codex-invoke.mjs
--probe` printed **`SMOKE OK`, exit 0**. That is the probe run I declined to make in round one; I
changed probe code this time, so I ran it.

**Both constants are back at their real values** — `PROBE_TIMEOUT_MS = 120_000`,
`INVOKE_TIMEOUT_MS = 20 * 60 * 1000` — confirmed by `git diff -- tools/codex-invoke.mjs`, in which
neither line appears as a change at all.

**Every remaining `fail(2, …)` re-read against the new wording** (unrecognized flag · missing
`--brief`/`--out` · brief not found · `codex-resources` missing, both modes · `git init` failed in
the probe · codex not resolvable on PATH or at the fallback · `result.error && !result.signal` ·
both `--budget` refusals): all nine are pre-spawn or never-started, so "codex was not asked, or could
not be" holds for each. The budget gate still behaves, re-run after these edits:
`--budget 9` and `--budget 10` print the fit line and stop at the next check; `--budget 10.1`,
`--budget 13.2` and `--budget 17.6` print `REFUSED before dispatch`; all exit 2.

## The flagged item: the worked example that disagreed with the instrument

The verifier is right and I re-derived it the same way, with the script instead of by hand:

```
$ node tools/codex-invoke.mjs --brief <missing> --out <path> --budget 9
codex-invoke: stated run budget 9 min + 10 min reserve fits inside the 20 min cap.
$ … --budget 13.2
codex-invoke: REFUSED before dispatch — 13.2 min of stated harness runs plus the 10 min reserve …
```

So WO-2.36 (three runs, 13.2) fails the bullet and **WO-2.35 (two runs, 9) does not** — my paragraph
claimed both did. Rewritten at `plans/work-orders/ROUTING.md:158-166`: WO-2.36 keeps its place as a
failure, WO-2.35 becomes the *instructive* example — its Traps say "**at least** two runs", two fits
and three does not, so **an Acceptance whose run count is open-ended has not answered the bullet;
route on the largest count it could mean and say which number you used in the routing sentence.**
The paragraph now carries a parenthetical saying the numbers were checked against the script after a
verifier re-derived them, which is the honest provenance for a section whose stated purpose is that
the arithmetic not be re-derived. The routes themselves are unchanged, and the tier rule — the budget
never decides the tier — is untouched.

## Files changed in this round

- `c:\dev\planbook\tools\codex-invoke.mjs` — exit-code header (exit 2 re-scoped, exit 3 added), one
  sentence added to the `INVOKE_TIMEOUT_MS` comment, the started-then-killed split in `runInvoke()`
  and in `runProbe()`, and the probe's report line now names the signal and the error code.
- `c:\dev\planbook\plans\work-orders\ROUTING.md` — the worked-examples paragraph corrected.
- `c:\dev\planbook\.claude\agents\work-order-orchestrator.md` — one bullet at step 4 for exit 3
  (`git status` before re-routing). **Its line-count rule honoured in the same edit: 326 → 330**,
  re-counted with `wc -l` after the edit, not by arithmetic.
- `c:\dev\planbook\tools\README.md` — one sentence in the `codex-invoke.mjs` paragraph: the kill is
  exit 3, and why exit 2 could not absorb it.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — Acceptance line 3's citation moved
  `tools/codex-invoke.mjs:38-64` → `:48-75` (the header grew), with the exit-code pointer added. No
  tick state changed; no other row touched.

**Line references in round one's report that have moved:** header block `:16-27` → `:16-37`;
`INVOKE_TIMEOUT_MS` comment `:41-48` → `:51-58`; the decision bullets `:50-64` → `:60-75`.

## Verification, this round

- `node tools/wo-sweep.mjs` — **`20 checks · 18 passed · 0 failed · 2 to review`, exit 0**, run again
  after the last edit. Zero lines beginning `FAIL`; the two `REVIEW`s are the standing pair in files
  this work order never opened.
- `git diff --stat -- src/` — **printed nothing.** `git diff --check` clean, exit 0. Whole-tree
  diffstat 210 insertions across 5 files for both rounds together, which is proportional — no CRLF
  rewrite.
- `node tools/verify-shell.mjs` — **not run, deliberately**, on the brief's § 4 orchestrator note:
  it is not required for this work order and nothing under `index.html` or `src/` was edited. Not a
  "could not run" report.
- **No 👤 lines in this Acceptance list**, so none ticked. `CHANGELOG.md` untouched.

## Decisions this round made that the work order did not settle

- **A new exit code rather than folding the kill into exit 1.** Exit 1 is documented as *a runner
  verdict — record as transient, re-probe next dispatch*, and the work order's own Traps say **"a
  dispatch that times out is not a route that failed."** WO-3.15 is the proof: that dispatch's work
  was *complete*. Calling it 1 would have been a second mislabel in the opposite direction. Exit 3
  says the one true thing — no verdict either way, go and read the tree.
- **The cost of a fourth code, accepted openly.** Round one declined a code 3 for the *budget
  refusal* because exit 2 was semantically right there and the message carried the distinction. Here
  neither 1 nor 2 is semantically right, so the argument does not transfer. A reader who still knows
  only 0/1/2 sees a non-zero exit and does not treat it as success — the failure mode of the new code
  is conservative. The two places that enumerate codes for a *dispatch* were updated (the orchestrator
  agent file, `tools/README.md`).
- **`plans/dispatch-retro.md:175` left alone**, and I want it on the record rather than silent: it
  says "exit 1 is a runner verdict, exit 2 is a harness bug", which is now two thirds of the scheme.
  It sits inside a past-tense narrative that ends "Verified 2026-08-06", so I read it as history
  rather than as the current contract, and editing a dated retro entry to describe today felt worse
  than leaving it. **If the owner disagrees, the fix is one parenthetical.** The related temptation —
  writing a retro § Codex entry now that WO-3.15's "proposed follow-up" has actually been fixed —
  I also declined as outside this round; it is a genuine candidate, since the retro is where "the
  scar that produced it" is supposed to live and WO-3.15's account currently lives in a status file
  whose own first line says to delete it.

## On the follow-up the orchestrator asked about

**Yes — worth booking, and it got bigger this round.** Nothing automated notices if
`refuseIfBudgetDoesNotFit()` stops being called, and now nothing notices if the started-then-killed
split regresses either; both are gates whose whole value is behaviour nobody sees on a normal run.
The shape I would propose, if it is booked: a `--self-check` on `codex-invoke.mjs` in the spirit of
`wo-gate.mjs --self-check`, driving the caller-side gates by their exit codes with **no real codex
spawn** — every `--budget` boundary, the usage refusals, and the started-then-killed branch exercised
against a stand-in child (a sleeping `process.execPath`, which reproduces `ETIMEDOUT`/`SIGTERM`
exactly, as the measurement above shows). That last one needs a seam for the command, which is a
design decision and belongs in a work order rather than in this correction. I did not build any of
it here.
