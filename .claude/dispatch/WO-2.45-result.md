# WO-2.45 — the outer Bash timeout binds ten minutes before the cap everything is calibrated to · result

**Implementer** Claude (work-order-implementer, Opus) · **Date** 2026-08-17
**Route as briefed** Claude at the Opus tier, on the work order's own merits — the deliverable is a
choice between two shapes plus the written reasoning for the rejected one.

**Outcome in one line.** The premise was driven before anything was changed; **detach-and-poll** was
chosen and built, **shrinking the cap was rejected on its own arithmetic** and written down in
`plans/verification-tooling.md`; `--budget` now compares against whichever constraint binds the
invocation and names it, so the foreground refuses what it used to approve; exit 3 survives, driven
in `--self-check` and again by hand across two separate shell calls. `--self-check` is
`PASS | 26 of 26`, `wo-sweep.mjs` is green, `verify-shell.mjs` is `824 of 824`, and
`git diff --stat -- src/` is empty.

**The one thing I nearly got wrong and caught.** A first draft of the `tools/README.md` mutation
table quoted *"the launcher took 4013 ms"* — a number I had not read, because my mutant script
filtered the output down to case names. I re-ran the mutant to get the real text (**4062 ms**) and
corrected it. Recorded here rather than quietly fixed, because an invented figure inside a table
whose whole purpose is measured evidence is the exact failure this project keeps naming.

---

## Against the Acceptance list, one by one

### 1. The mismatch demonstrated before it is fixed, with its arithmetic — ✅ met

**The dispatch shape, named:** WO-2.35's, which is `ROUTING.md`'s own worked example — its Traps say
*at least* two `verify-shell.mjs` runs at ~4.4 min, so `--budget 9`.

**Half one, against the shipped file before a byte was changed:**

```
$ node tools/codex-invoke.mjs --brief <missing> --out <tmp> --budget 9
codex-invoke: stated run budget 9 min + 10 min reserve fits inside the 20 min cap.
EXIT=2   (at the next gate, brief not found — the budget passed)
```

The arithmetic that makes it a mismatch: **9 + 10 = 19 minutes approved, inside a call the Bash tool
caps at 600000 ms = 10.** Nine minutes over. And the harness runs *alone* are 8.8, leaving **1.2
minutes** inside the outer call for reading the work order and the precedent, writing the code,
reverting the mutation and writing the result file — against the only reading time this repository
records anywhere, **21 minutes** (WO-3.5, orchestrator step 3b).

**Half two — the sharper consequence, driven rather than argued.** A scaled fixture with the same
ordering as the real numbers (outer 3000 ms, inner 8000 ms via the WO-2.40 seam, no constant edited,
no Codex spawned, stand-in sleeping child):

```
=== A · no outer deadline — the script reaches its own cap
codex-invoke: KILLED, not refused — codex started, ran, and was ended by SIGTERM before it could
exit: it hit the 0.1 min INVOKE_TIMEOUT_MS. […] Read 'git status' and the diff […]
EXIT=3  SIGNAL=null

=== B · outer deadline 3000 ms, inner cap 8000 ms — the outer one fires first
(the script printed nothing before it was killed)
EXIT=null  SIGNAL=SIGTERM
exit-3 diagnosis printed? NO
result file written?      NO
```

So the gate clears the exact dispatch it exists to refuse, **and** the report WO-2.37 built and
WO-2.40 made permanent is unreachable around the side of both: the caller is left with a bare
timeout over a tree that may hold a half-applied mutation.

### 2. One shape chosen and built; the rejected one written down with why — ✅ met

**Chosen: detach and poll.** `plans/verification-tooling.md` § *"The Codex dispatch is detached and
polled, not shrunk to fit, 2026-08-17 (WO-2.45)"*.

**Rejected: shrink `INVOKE_TIMEOUT_MS`**, and the arithmetic is what killed it, written out in that
section:

- For the script's own SIGTERM to fire first, the cap must sit **meaningfully** under 600000 ms —
  call it 8 minutes, leaving 2 for node's startup, the report, and the tool's own accounting.
- **`WORK_RESERVE_MS` is not compressible.** It stands for reading, writing, reverting and the result
  file. Left at ten, *nothing* fits: every positive budget is refused and the Codex route closes
  silently.
- Halved to five, the budget ceiling is **three minutes** against a `verify-shell.mjs` run of ~4.4.
  **No work order whose Acceptance needs one full harness run could ever route to Codex** — and
  mutation-proved acceptance is this project's house style, not an outlier.

That is not "narrowing the route further"; it is closing it for everything actually booked here,
while recording in the file that the cap *was examined and left small* — the invisible exclusion
WO-2.37 exists to have made visible, arriving through the door WO-2.37 held shut. It would also have
staled every "20 minutes" sentence in `ROUTING.md` and `plans/work-orders/README.md` in the same
sitting.

**What was built.** `--detach` makes every caller-side refusal in the caller's own process (so exit
2's *"nothing was dispatched, the tree is untouched"* still reaches a reader), writes a dispatch
record, hands the run to a detached supervisor, and exits **4** — *started, nothing judged, never 0*.
`--supervise` is that supervisor, this same file run again, holding the `spawnSync` the caller used
to hold and writing its verdict into the record on every path. `--status [--wait]` reads it.

**What reads the corpse** — the Traps' question, answered three ways:

- **`--status --wait` blocks.** Detaching the dispatch does **not** detach the orchestrator: it still
  sits on the run, in slices that fit inside a Bash call rather than one slice that does not. Step 4b
  is preserved, not repealed. `--wait` is capped at **540 s** so a poll cannot outlive the call
  holding it, which is the original defect one level up.
- **A supervisor that is gone is told from one still working**, on two arms: pid liveness, and
  elapsed against the record's own cap plus two minutes of grace — two, because a recycled pid reads
  as alive forever. It answers `ABANDONED` and **exit 3**, not a code of its own, because it is the
  fact exit 3 already carries.
- **The record is a file**, `.claude/dispatch/<WO-ID>-result.dispatch.json`, beside the brief and the
  result, so a *resumed* orchestrator reads it. Step 1's "an interrupted **you**" bullet now names it.

### 3. No printed sentence says a budget fits unless it fits the binding constraint — ✅ met, shown both sides

`bindingCap()` answers what constrains *this* invocation, and the message names it. Five runs:

| Command | Printed | Exit |
|---|---|---|
| `--budget 9 --detach` | `stated run budget 9 min + 10 min reserve fits inside the 20 min INVOKE_TIMEOUT_MS, which is what binds this dispatch.` | 2 (at the next gate) |
| `--budget 10 --detach` | same, `10 min + 10 min … fits inside the 20 min INVOKE_TIMEOUT_MS` | 2 (at the next gate) |
| `--budget 10.1 --detach` | `REFUSED before dispatch — 10.1 min … does not fit inside the 20 min INVOKE_TIMEOUT_MS (a detached dispatch runs to its own cap) …` | 2 |
| `--budget 9` (foreground) | `REFUSED before dispatch — 9 min … does not fit inside the 10 min OUTER_CALL_CEILING_MS (a foreground dispatch dies with the call that made it) … pass --detach …` | 2 |
| `--budget 0.1` (foreground) | `REFUSED before dispatch — 0.1 min … does not fit inside the 10 min OUTER_CALL_CEILING_MS …` | 2 |

Both sides of the detached boundary (10 fits, 10.1 does not) and both ends of the foreground, where
**there is no fitting side**: the ten-minute reserve alone fills the ten-minute ceiling, so no stated
budget fits and the refusal names the way out. That is the arithmetic finally being done against the
number that was killing dispatches, not a new restriction. The foreground dispatch also prints one
line before it spawns saying it dies with the call that started it.

### 4. `--self-check` passes, boundary cases moved to the new numbers, move explained at the cases — ✅ met

```
PASS | 26 of 26 cases behaved. A green run is not coverage — read the paragraph above it.
EXIT=0     ~7 s
```

The two boundary cases now carry `--detach` and assert `the 20 min INVOKE_TIMEOUT_MS` by name; two
new `FOREGROUND:` cases sit beside them asserting the refusal against `the 10 min
OUTER_CALL_CEILING_MS` — **the first of those is the exact sentence that read "fits inside the 20 min
cap" before this row.** The move is explained in the `--self-check` section comment under *"AND THE
BOUNDARY MOVED AT WO-2.45, WHICH IS THAT PARAGRAPH BEING PAID OUT RATHER THAN CONTRADICTED"* and at
the cases themselves. Neither constant changed value; what changed is which one the gate reads.

**Non-vacuous, shown.** Nine mutants written into the scratchpad and driven with `--against`, never
into `tools/`:

| Mutation of the copy | Red |
|---|---|
| `bindingCap()` answers `INVOKE_TIMEOUT_MS` unconditionally — the pre-WO-2.45 arithmetic | **2** — both foreground boundaries, and neither `--detach` one |
| `--detach` quietly runs in the foreground | **3** — both detached boundaries and the detached kill, that last on *"the launcher took 4062 ms, which is its own dispatch's whole cap — this did not detach, it waited"* |
| the supervisor never writes its verdict into the record | **1** — the detached kill |
| `abandonedReason()` never finds a corpse | **2** — both `ABANDONED` arms; the RUNNING control stays green, which is the point |
| `abandonedReason()` calls everything a corpse | **3** — the RUNNING control, the elapsed arm on the wrong reason, and the detached kill |
| `--status` prints the verdict and exits 0 anyway | **1** — the detached kill |
| `--wait` accepts any length | **1** — the poll cap |
| the detached refusal moved below the record write | **2** — both detached boundaries |
| the record's `version` stamp written but not read | **1** — the record from an unknown version |

Control: the unmutated file, 0 red. And the committed **pre-WO-2.45** file, `--against` it:
**11 of 26 red**, which is every new and moved case and nothing else — it reads all four seam
variables so the fixture can drive it; it simply has no `--detach` and no `--status`.

Row one is the one that matters: it is this row's own regression, and it passes both `--detach`
cases while failing exactly the two foreground ones.

### 5. Exit 3 surviving a kill at the binding constraint is DRIVEN — ✅ met, twice

**In `--self-check`**, as a standing case rather than a hand run thrown away (which is WO-2.40's
whole argument): `--detach` with a sleeping stand-in child and a seamed 4 s cap. The launcher exits
**4** in a fraction of that cap — **the case times it**, because a subject that silently ran in the
foreground prints the same words and differs only on the clock — and `--status --wait` then answers
**3**, carrying `KILLED, not refused`, `ended by SIGTERM`, `INVOKE_TIMEOUT_MS` and
`Read 'git status' and the diff`, and *not* `could not be run`.

**And by hand, across two separate shell calls**, which is the shape the real defect had:

```
12:45:21.670  launching (dispatch cap 20 s)
codex-invoke: DISPATCHED and detached — supervisor pid 172732, cap 0.3 min. NOTHING HAS BEEN JUDGED YET.
  launcher EXIT=4
12:45:21.775                                        ← the call that started it has now exited

--- a different Bash call ---
12:45:33.172
codex-invoke: KILLED, not refused — codex started, ran, and was ended by SIGTERM before it could
exit: it hit the 0.3 min INVOKE_TIMEOUT_MS. […] Read 'git status' and the diff […]
     EXIT=3
12:45:43.344
```

The launcher returned in **105 ms**; the verdict arrived **22 seconds after the call that made it was
gone**. That is the thing the outer 600000 ms ceiling used to destroy.

Both `ABANDONED` arms are driven too — a supervisor whose pid this run watched exit, and a live pid
past its cap and grace — with a RUNNING control beside them so that "everything is a corpse" cannot
pass. The success path was also driven end to end by hand: launcher 4, `--status --wait` 0, and the
result file holding the brief the child was handed.

### 6. `wo-sweep.mjs` green and `git diff --stat -- src/` empty — ✅ met

```
20 checks · 18 passed · 0 failed · 2 to review
SWEEP EXIT=0
```

Run twice — once mid-work, once after the last edit, including after the `tools/README.md` edits,
because one sweep check cross-references that file. Identical both times, zero lines beginning
`FAIL`. The two `REVIEW`s are the standing pair (sensitive field names outside `src/backup.js`; a due
date on the same line as a late/missing flag), both in files this row never opened.

`git diff --stat -- src/` **printed nothing.** `git diff --check` clean, exit 0. Whole-tree diffstat
**730 insertions / 61 deletions across 6 files** — proportional, and `file` reports plain UTF-8 with
no CRLF on every one of them.

**`node tools/verify-shell.mjs` was run to completion and I waited for its exit**, not backgrounded
and written up early:

```
824 checks · 824 passed · 0 failed · 0 skipped
22,191 lines · 26.9 lines per check · 256s
SHELL EXIT=0
```

It measures nothing this row changed — no app file was touched — but the brief's § 4 names both
commands, so both were run.

Also run as a courtesy before the ticks: `node tools/wo-gate.mjs --audit` → **PASS**, and
`node tools/wo-gate.mjs --self-check` → **PASS | 17 of 17 plants were caught**, so `--tick` will not
refuse on tracker drift.

---

## The § 2 grep finding — which way I went, and why

The brief flagged five sentences outside the three named files that state the twenty-minute number to
a router. **Choosing detach rather than shrink is what settled this: twenty minutes is now true.** So
the arithmetic needed no rewriting anywhere, and I made the smallest edit consistent with Acceptance
line 3 — **two command lines, because a quoted invocation must reproduce**:

- **`ROUTING.md:160` — edited.** It quoted `--budget 9` answering *"fits inside the 20 min cap"*.
  That command now refuses (it is a foreground invocation). Changed to `--budget 9 --detach` and the
  script's current wording, so the sentence reproduces. This is the one the brief singled out.
- **`ROUTING.md`'s `--budget` pointer paragraph — edited.** It printed the invocation without
  `--detach`; a router copying it would be refused. `--detach` added, with two sentences saying it is
  not decoration and pointing at step 4 for the polling half.
- **`ROUTING.md:140-141` (*"a hard 20 minutes for the whole dispatch"*) — left alone deliberately.**
  It is now true, and the paragraph directly beneath it explains `--detach`. Rewriting a sentence
  this row just made correct would be widening into the file's own subject.
- **`ROUTING.md:157` (WO-2.34, *"~17.6 minutes against a 20-minute cap"*) — left alone.** True: 17.6
  + 10 reserve still exceeds 20, so the example's conclusion is unchanged.
- **`plans/work-orders/README.md:484` — left alone, deliberately.** *"codex-invoke.mjs's hard
  20-minute cap cannot hold four of them"* is both **true** and inside a dated, italicised booking
  note about how WO-2.35/2.36/2.37 came to be rowed. Editing a historical record to describe today is
  the thing WO-2.37 declined to do to `dispatch-retro.md:175`, for the same reason.

Nothing about **which** work orders route to Codex was touched, which is the Out-of-scope line.

## Decisions the work order did not settle, and which way I went

- **`--detach` is a flag, not the default.** Making `--brief/--out` always detach would have been
  cleaner, and it would have forced a redesign of the fifteen `--self-check` cases that drive the
  spawn outcomes through the foreground path — which the Out-of-scope line protects. The foreground
  path stays as the engine (the supervisor runs it) and as a human's invocation, and it now announces
  what it is.
- **Exit 4 rather than 0 for the launcher.** This is the load-bearing choice against WO-2.20. A
  launcher exiting 0 is *"started"* wearing *"succeeded"*'s code, and no amount of prose beats an
  exit code. Exit 0 from this file still means exactly one thing.
- **`ABANDONED` maps to exit 3 rather than a sixth code.** It is the same fact exit 3 already
  carries: something ran, nobody knows how far, go and read the tree.
- **I added nine `--self-check` cases, which reads against the Out-of-scope line, and I want that
  visible rather than silent.** I read that line as protecting the check's *design* and naming the
  two boundary cases as this row's obligation — while the brief's § 4 says *"Add checks for what you
  build"*, and Acceptance line 5 demands exit 3 be **driven** under the new supervision shape. Proving
  a whole new path by hand and throwing the evidence away is precisely what WO-2.40 exists to stop. If
  the verifier reads the scope line more strictly, the nine cases are separable from the rest of the
  row.
- **A `version` stamp that is read, not just written.** I wrote `STATUS_VERSION` into the record and
  then noticed nothing checked it — a constant nothing reads is a constant that drifts, and the drift
  here would be a reader answering 0 or 4 over a record it had not understood. It now refuses, exit
  2, and has a case.
- **The supervisor's own cwd is `tmpdir()`, not the dispatch cwd.** Every path it holds is absolute,
  and on Windows a live process sitting in a directory is a directory nothing can delete — which
  would have turned `--self-check`'s sandbox cleanup into an EBUSY on a green run.
- **Pid reuse is named, not solved.** A recycled pid reads as alive forever; the elapsed arm answers
  without trusting the pid at all. The residue is written at the function.
- **`TESTING.md` untouched.** Nothing here changes what a teacher sees.
- **`CHANGELOG.md` untouched.** Draft below; the teacher decides.

## Temptations declined, recorded rather than acted on

- **Making `--detach` mandatory by refusing a foreground dispatch outright.** It would close the hole
  properly, and it would break every `--self-check` spawn case — the thing the Out-of-scope line
  protects. The foreground banner plus the budget refusal is the version that fits inside this row.
- **Adding `'dispatch'` to `wo-gate.mjs`'s `dispatchFiles()` name list** so the record appears in
  `next`'s "which dispatch files exist" line. It hardcodes `${id}-${name}.md`, so a `.json` needs more
  than a word. `wo-gate.mjs` is not this row. Follow-up below.
- **Rewriting `plans/dispatch-retro.md` § the 2026-08-14 kill** now that the shape it records is
  closed from the other side. The retro records what a failure cost; this one has not cost anything
  yet, which is WO-2.37's own reasoning for not writing an entry.
- **Widening the `--budget` reserve conversation.** Ten minutes is still a judgment and still coarse,
  and this row gave me no better measurement than WO-2.37 had. Left alone.
- **Backporting the `bindingCap()` idea to `PROBE_TIMEOUT_MS`.** The probe is two minutes and fits
  inside anything; a seam and a comparison there would be machinery with nothing to exercise it.

## Proposed follow-up work orders (not built)

1. **`wo-gate.mjs`'s dispatch-file listing cannot see a dispatch record.** `dispatchFiles()` hardcodes
   `${id}-${name}.md`, so `WO-x.y-result.dispatch.json` is invisible to `next` and to the gate report
   — which is the one place a *fresh* orchestrator would learn that a detached dispatch is in flight.
   Small: a name list that carries its own extension. It is genuinely a hole, and it is `wo-gate.mjs`'s.
2. **Nothing gates the orchestrator against polling once, reading 4, and writing a report.** That is
   WO-2.20's failure with a new mechanism under it. The defence today is a rule in the agent file and
   an exit code that cannot be mistaken for success; `--self-check` lists it under what it does not
   cover. If it ever happens, the honest fix is probably that `--status` without `--wait` is not the
   documented call at all.

**No check was needed that `verify-shell.mjs` and `wo-sweep.mjs` could not make**, so no third
harness was written. Everything this row needed was driveable through `--self-check`, which is a flag
in the file it tests rather than a new tool.

## Files changed

- `c:\dev\planbook\tools\codex-invoke.mjs` — header block (usage, the `--detach` rationale, exit code
  4, exit 3's `ABANDONED` arm); `OUTER_CALL_CEILING_MS` and its comment; the `INVOKE_TIMEOUT_MS`
  bullet that recorded the mismatch rewritten to record it being acted on; `bindingCap()`;
  `refuseIfBudgetDoesNotFit()` reading it; `runInvoke()` split into `preflight()` + `dispatchOnce()`
  (which returns its verdict rather than exiting on it, byte-identical messages) + a thin wrapper;
  `runDetach()`, `runSupervise()`, `runStatus()` and the record helpers; CLI wiring and two
  combination refusals; the `--self-check` boundary comment, nine new cases, two moved ones, and the
  coverage paragraph. 743 → 1,207 lines. **No constant changed value.**
- `c:\dev\planbook\.claude\agents\work-order-orchestrator.md` — step 4's Codex command is now two
  commands; the 600000 ms bullet replaced by the `--detach`/exit-4 rule and *"a poll that answers 4 is
  not a result"*; exit 3's bullet gains the `ABANDONED` arm; step 1's "interrupted **you**" bullet
  names the record. **Its line-count rule honoured in the same edit: 341 → 354**, counted with
  `wc -l` after the final edit, not by arithmetic.
- `c:\dev\planbook\tools\README.md` — the `codex-invoke.mjs` table row; three new paragraphs on the
  ceiling, the detach mechanism and the mode-aware budget; the `--self-check` case count, timing and
  boundary description; the WO-2.45 mutation table; the "two seconds" line corrected to six.
- `c:\dev\planbook\plans\verification-tooling.md` — the new decision section, with the rejected shape
  and its arithmetic, what reads the corpse, and the three costs.
- `c:\dev\planbook\plans\work-orders\ROUTING.md` — two quoted invocations gain `--detach`, plus two
  sentences saying why it is not decoration.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — WO-2.45's six Acceptance boxes ticked
  with their evidence. No other row touched; `--audit` PASS and `--self-check` PASS afterwards.

**Not changed:** anything under `src/`, `index.html`, `sw.js`, `AGENTS.md`, `CLAUDE.md`, `TESTING.md`,
`CHANGELOG.md`, `plans/dispatch-retro.md`, `plans/work-orders/README.md`, `tools/wo-gate.mjs`,
`tools/wo-sweep.mjs`, `tools/verify-shell.mjs`.

## What I could not verify

- **No real Codex dispatch was run**, and no Codex process was spawned anywhere — the Traps forbid it
  and the runner is out of scope. So nothing here is evidence that a *real* detached Codex dispatch
  works end to end; what is proved is that this script's launcher, supervisor, record and reader
  behave, against stand-in children. `--self-check` says so in its own output.
- **`--probe`'s real spawn was not run.** I changed no code on that path beyond the existing
  `--probe --budget` guard, which is driven.
- **The `ABANDONED` pid arm carries a residue I cannot close**: a recycled pid reads as alive. The
  elapsed arm covers it and both are driven, but "pid reuse never happens" is not something I
  verified.
- **No 👤 lines exist in this Acceptance list**, so none were ticked, and I ticked nothing needing an
  iPad or human eyes. `TESTING.md` untouched — nothing here changes what a teacher sees.
- **The orchestrator agent file's new instructions have not been executed by an orchestrator.** They
  are prose I wrote and verified against the script's actual behaviour, not a dispatch I watched run
  under them.

## Draft `CHANGELOG.md` entry — the teacher's call, not mine

> **A Codex dispatch is no longer held inside the call that started it.** The pipeline gave a dispatch
> twenty minutes and then ran it inside a call that could only ever last ten, so a slow work order was
> approved by the very guard meant to refuse it — and when time ran out it was the *reporter* that got
> killed, leaving a bare timeout where the explanation should have been: no verdict, no diagnosis, and
> a half-finished change possibly still sitting in the project. The dispatch now runs on its own and is
> checked on rather than held, which makes the twenty minutes real instead of promised, restores the
> "this was interrupted — go and read what it left behind" report that the whole arrangement exists to
> produce, and gives every refusal an honest number to refuse against. The alternative — shrinking the
> twenty minutes to fit the ten — was worked out on paper and rejected: it would have quietly closed
> the door on almost every work order that has to prove itself by running the checks.
