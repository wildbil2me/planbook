# WO-2.40 — the codex-invoke gates have never been exercised by anything but a hand · result

**Implementer** Claude (work-order-implementer, Opus) · **Date** 2026-08-17
**Route as briefed** Claude at the Opus tier, on the work order's own merits — two open judgment
calls plus prose that has to land in three files in one sitting.

**Outcome in one line.** `tools/codex-invoke.mjs` gained a `--self-check` on `wo-gate.mjs`'s
precedent: 17 cases, 2.3 seconds, every caller-side refusal and both kill paths driven by exit code
**and** by a phrase of the message, against stand-in children, with **no Codex process spawned and no
constant mutated**. Both adjacent findings were answered as written sentences at the point of the
decision rather than as lines of code, so **no exit code moved** and the Traps' three-file
propagation was not triggered — the two files I did edit were edited for the new flag and for the
"who runs it" decision. `git diff --stat -- src/` is empty; the sweep is green.

**One thing found by running the check rather than reasoning about it, and it was mine:** the first
cut of the repo-write guard compared paths case-sensitively, so `c:\dev\planbook` never matched
`C:\dev\planbook\…` and the guard waved an entire fixture through into the repository. Fixed, and the
fix is shown firing. Detail under acceptance line 3.

---

## Against the Acceptance list, one by one

### 1. Every caller-side refusal driven, on exit code and message phrase, in one run, no Codex — ✅ met

`node tools/codex-invoke.mjs --self-check` → `PASS | 17 of 17 cases behaved`, exit 0, 2.3 s
(`time`, real 0m2.258s). Eleven of the seventeen are the caller-side refusals; each asserts the exit
code **and** at least one phrase, and most also assert a phrase that must be **absent**:

| Case | Exit | Phrase asserted present |
|---|---|---|
| no arguments at all | 2 | `--brief <path> and --out <path> are both required` |
| `--brief` without `--out` | 2 | `are both required` |
| `--out` without `--brief` | 2 | `are both required` |
| an unrecognized flag | 2 | `unrecognized argument '--make-it-faster'` |
| `--probe --budget 4` | 2 | `--budget applies to a dispatch, not to --probe` (and no `SMOKE`) |
| a non-numeric `--budget` | 2 | `as a positive number (got 'about an hour')` (and no `fits inside`) |
| a `--budget` of zero | 2 | `as a positive number (got '0')` |
| `--budget 10` — the boundary that fits | 2 | `stated run budget 10 min + 10 min reserve fits inside the 20 min cap`, then `brief not found at` |
| `--budget 10.1` — the boundary that does not | 2 | `REFUSED before dispatch`, `10.1 min of stated harness runs`, `does not fit inside the 20 min` — plus, structurally, that the output directory was **not** created |
| `codex-resources` missing, dispatch mode | 2 | `codex-resources not found at`, `looks missing or moved` |
| `codex-resources` missing, probe mode | 2 | `This is a harness problem, not a runner verdict` (and no `SMOKE`) |

**No Codex process is spawned, and that is structural rather than promised.** Every case sets a
seam variable naming the command, so `runCodexWithFallback()` returns before it looks up `codex` on
`PATH` and before it considers `CODEX_FALLBACK`. The only two commands any case names are
`process.execPath` and one path that does not exist. And a subject that has *lost* that branch cannot
be driven safely at all — the never-started case hands over a command that does not exist, and the
fallback would resolve that to the real `codex.exe` — so a **precondition** reads the subject's text
and refuses to run a single case against one, printing `0 cases run` (`--against` the pre-WO-2.37
file lands exactly there). That precondition is deliberately *not* a case, on WO-2.16's reasoning one
file over: it is a fact about the fixture, not about a gate.

Two refusals are **not** driven, and the run prints so in its own output: the `{ infra }` refusal
(codex resolves at neither location — the seam short-circuits it by design) and the probe's
`git init` failure. Neither is in the Deliverables' enumeration.

### 2. Exit 3 for started-then-killed, exit 2 for never-started, in the same run, told apart by `signal` — ✅ met

Three cases in that same run, plus three controls beside them:

| Case | Stand-in child | Exit | Asserted present / absent |
|---|---|---|---|
| started then killed at the cap | sleeping `process.execPath`, seamed cap 900 ms | **3** | `KILLED, not refused`, `ended by SIGTERM`, `INVOKE_TIMEOUT_MS`, `Read 'git status' and the diff` / **not** `could not be run` |
| started then killed on a `maxBuffer` overrun | a child writing 25 MB to stdout against the hardcoded 16 MB cap | **3** | `KILLED, not refused`, `ENOBUFS` / **not** `could not be run`, **not** `INVOKE_TIMEOUT_MS` |
| never started | a command path that does not exist | **2** | `codex exec could not be run`, `ENOENT` / **not** `KILLED` |
| control — started, exited 7 | `process.exit(7)` | 1 | `codex exec exited 7`, `MISSING at` |
| control — exited 0, wrote nothing | a child that does nothing | 1 | `codex exec exited 0 but wrote no output file` |
| control — the success path | a child that writes its stdin to the `-o` path | 0 | `output written to`, **and** the output file carries the brief's marker |

**The overrun case is what makes "distinguished by `signal`, not by the error code's name" a claim
rather than a phrase.** One kill case cannot express it: a subject keyed on
`error.code === 'ETIMEDOUT'` passes the timeout case perfectly and reports the overrun as
never-started. That is mutant **M5** below, and it goes red on the overrun case alone.

The three controls exist because "the branch is right" is not separable from "the exit codes next
door were not absorbed into it". They are one case each beyond the Deliverables' enumeration; I
judged that inside the line rather than widening it, and say so here so the call is visible.

### 3. Nothing the check writes reaches `tools/`, `src/` or `index.html`; no constant mutated — ✅ met, and the guard is shown firing

- **No constant is mutated anywhere, at any point, by anything committed or by my working method.**
  The seam (four `CODEX_INVOKE_SELFCHECK_*` environment variables) exists precisely so that
  `INVOKE_TIMEOUT_MS` is never edited. The `--budget` gate is deliberately *outside* the seam, so the
  boundary the check asserts is the one the file ships. I never edited a constant to see something
  happen; the two measurements I needed were taken in scratchpad scripts that never import this file.
- **Every write goes through one guard**, `assertOutsideRepo()`, including the sandbox directory
  itself — `mkdtempSync` reads `TMPDIR`, which is outside this file's control, and was the one path
  that could put the fixture inside the repository without any individual write being wrong. There is
  no `--dry-run` escape in that guard.
- **The guard is shown firing, not assumed.** `TMP` and `TEMP` pointed at a directory inside the
  repository:

  ```
  Error: --self-check refused to write inside the repository: C:\dev\planbook\.guard-probe\codex-invoke-selfcheck-fRvnmb
      at assertOutsideRepo (…/tools/codex-invoke.mjs)
      at selfCheck (…/tools/codex-invoke.mjs)
  EXIT=1
  ```

  The probe directory was empty afterwards (the `finally` still removed what `mkdtemp` had made), and
  `git status --short` was unchanged.
- **And the first cut of that guard did not fire.** The same probe against my first version ran all
  seventeen cases happily inside `C:\dev\planbook\.guard-probe\…` and exited 0. The cause:
  `REPO` comes out of `import.meta.url` as `c:\dev\planbook` and `mkdtempSync` answers
  `C:\dev\planbook\…`; one drive letter differs in case, `startsWith` says false, and a guard whose
  entire job is refusing paths inside the repository reported that a path inside the repository was
  outside it. It now normalises case on win32, and the scar is written at the function. **I am
  reporting this rather than quietly fixing it because it is the exact failure this acceptance line
  is about, and because it was invisible to a green run** — the guard is silent when it works and
  silent when it does not.
- **Empirically:** after roughly thirty runs of `--self-check`, eleven `--against` runs and the guard
  probe, `git status --short` names only the four files I edited by hand. No file appeared in
  `tools/`, `src/` or at the repository root.

### 4. Deleting any gate, or inverting its condition, turns the check red — ✅ met, shown

Done with `--against <path>`, the mechanism `wo-gate.mjs` names for exactly this
(*"the harness and the subject are separable, and the subject defaults to this file"*), which is why
**no mutation ever entered `tools/`**. Ten mutants were generated into the scratchpad from the
committed file, each asserted to have actually changed something before it was run, and driven with
the committed harness. Control first: the unmutated file, **0 red**.

| Mutation of the scratchpad copy | Cases red |
|---|---|
| M1 the `refuseIfBudgetDoesNotFit()` call deleted | **4** — both boundaries, the non-numeric budget, the zero |
| M2 that call moved below the spawn | **2** — and the second goes red on *"the refusal created the output directory, so it ran after mkdirSync rather than before the dispatch"*, while its exit code and message were still correct |
| M3 the budget comparison inverted (`<` for `>`) | **1** — the boundary that must not fit |
| M4 the started-then-killed branch removed | **2** — both kill cases |
| M5 that branch keyed on `error.code === 'ETIMEDOUT'` instead of `signal` | **1** — the `maxBuffer` overrun alone |
| M6 the never-started check moved above it (the WO-3.15 regression itself) | **2**, reading *"exited 2, expected 3"* and *"the run said 'could not be run', which belongs to a different exit code"* |
| M7 the unrecognized-flag refusal dropped | **1** |
| M8 the `--probe --budget` guard dropped | **1** |
| M9 a zero exit with no output taken as a pass | **1** |
| M10 the brief-not-found check dropped | **1** |
| the pre-WO-2.37 file (`git show 5839bc3:tools/codex-invoke.mjs`) | stops at the precondition: **0 cases run**, exit 1, naming the four seam variables it does not read |

Every mutant went red on the case aimed at it **and on nothing else**. M2 is the one worth keeping in
view: a gate moved below the spawn still refuses, still exits 2, and still prints the right sentence
— the exit code alone cannot see the move, which is why that case also asserts the output directory
was never created.

### 5. The two adjacent findings answered in writing, and anything fixed is covered — ✅ met

**Both were answered as written sentences, at the point of the decision. Neither became a line of
code, so no exit code moved.**

**(a) The externally killed child — `signal` set, `error` unset, reported as exit 1.** True in the
abstract and **not producible on the platform this file runs on**, which I measured rather than
assumed (node v24.16.0, win32, in a scratchpad script that touches nothing in the repository):

```
TIMEOUT    status=null   signal=SIGTERM   error=ETIMEDOUT
ENOENT     status=null   signal=null      error=ENOENT
MAXBUF     status=null   signal=SIGTERM   error=ENOBUFS
SUICIDE    status=1      signal=null      error=undefined     (the child sends itself SIGTERM)
EXTKILL    status=1      signal=null      error=undefined     (taskkill /F from another process)
```

Windows has no signals; libuv fills `term_signal` in only when it did the killing itself, which is
the timeout and the `maxBuffer` overrun — both of which set `error`, and both of which already reach
the exit-3 branch. So `result.error && result.signal` and `result.signal` select the same set here,
widening buys nothing that could be driven, and the `why` line below the branch would need an arm for
a kill this script cannot explain. **What an external kill actually looks like here is `status 1,
signal null` — byte-identical to codex exiting 1, and not separable by anything `spawnSync`
reports.** That residue is named at the branch rather than papered over, together with the
instruction for whoever runs this on POSIX one day: widen to `if (result.signal)`, and give
`--self-check` a case that can produce the state before doing it.

**(b) `mkdirSync(dirname(outPath))` ahead of the `codex-resources` check.** **The finding has the
order backwards** — that call already runs *below* both the brief check and the `codex-resources`
check, so the two refusals it worried about both fire before any directory exists. What survives is
smaller and real: `runCodexWithFallback()` can still return `{ infra }` after that line, which is an
exit 2 whose documented invariant is that the working tree is untouched, and by then
`dirname(outPath)` has been created. **Left as it is**, with the reasoning at the call: `recursive:
true` over an existing directory writes nothing, and in every documented invocation that directory is
`.claude/dispatch/`; git does not track an empty directory, so the invariant as a reader *uses* it —
"there is no diff to go and read" — is not the one being bent; and moving the call below the
`{ infra }` refusal means resolving the command before creating the directory, which is a
restructure of `runCodexWithFallback()` rather than the one-line move it looks like.

**Covered by the run:** nothing was fixed in (a), so there is nothing owed there. The surviving
ordering claim in (b) **is** covered — the boundary-that-does-not-fit case asserts the output
directory was not created, which is the assertion that turns M2 red.

### 6. `wo-sweep.mjs` green and `git diff --stat -- src/` empty — ✅ met

```
20 checks · 18 passed · 0 failed · 2 to review
SWEEP EXIT=0
```

Run twice, once mid-work and once after the last edit; identical both times, zero lines beginning
`FAIL`. The two `REVIEW`s are the standing pair (sensitive field names outside `src/backup.js`; a due
date on the same line as a late/missing flag), both in files this work order never opened, and the
sweep's own header defines `REVIEW` as never failing the run.

`git diff --stat -- src/` **printed nothing**. `git diff --check` is clean. Whole-tree diffstat is
565 insertions / 18 deletions across 4 files, which is proportional — no CRLF rewrite, and `file
tools/codex-invoke.mjs` reports plain UTF-8 with no CRLF.

**`verify-shell.mjs` was not run, deliberately.** The brief's § 4 note says the Acceptance does not
name it and that a reason to run it would mean I had edited an app file. I edited none. This is an
omission on instruction, not a "could not run" report.

---

## The decision the work order asked for last: who runs this, and when

**The orchestrator, at step 2b, before the probe.** Written into
`.claude/agents/work-order-orchestrator.md` as an imperative, with the reasoning in `tools/README.md`
— the same split WO-2.37 used.

Why not the other two:

- **Not `wo-sweep.mjs`.** Its own header promises that *"every check here is a text search"*; this
  spawns thirty-four processes. And every dispatch pays for the sweep, including the many that never
  go near Codex, for a signal that can only matter on the Codex route.
- **Not "by hand at the next change to the file."** That is `plans/verification-tooling.md`'s own
  argument against an opt-in guard against rot, made at WO-2.38 in as many words: *"a flag would make
  it opt-in, and an opt-in guard against rot is the exact fault it was built to fix — nobody passes
  the flag, and the arms rot behind a green run just as before."*
- **Step 2b is the moment the gates are about to be relied on**, and the Codex route is the only
  route that ever runs this script — so that single call site covers *every occasion the gates
  matter*. Two seconds against a twenty-minute dispatch. Check the instrument, then take the reading.

The one honest cost: if the Codex route is never taken, the check never runs. I take that as the
right trade rather than a gap, because a gate that is never relied on is a gate whose regression
costs nothing that day.

## Decisions the work order did not settle, and which way I went

- **The seam is environment variables, not flags.** A flag would be a documented way for a caller to
  point a dispatch at a command of their choosing — the same argument that keeps `--sandbox`
  hardcoded — and each of these is nonsense outside the self-check. Any run with one set prints a
  `SELF-CHECK SEAM ACTIVE` banner on stderr before it does anything, because a seam that can be
  active silently is a seam that eventually is.
- **Four variables, where the Deliverable says "the command and the timeouts."** `_CMD` and
  `_CMD_ARG` are one seam split by a Windows fact (`spawnSync` will not launch a `.mjs`, so every
  stand-in child is `node <script>`). `_TIMEOUT_MS` is the timeout. `_RESOURCES_DIR` is the fourth and
  is the one that needs defending: without it, reaching any spawn path requires a Codex install
  present, and *"a check that goes yellow on a machine where the runner is the thing being routed
  around"* is the Traps line verbatim. `PROBE_TIMEOUT_MS` is **not** seamed — no probe case reaches a
  spawn, and seaming it would add a way to shorten the probe with nothing exercising it.
- **The `--budget` boundary is hardcoded as 10 and 10.1.** That is a claim about the shipped numbers,
  not a fixture detail: 20 min cap less 10 min reserve leaves exactly ten minutes, which is the
  arithmetic `tools/README.md` and `ROUTING.md` promise a router. If either constant moves these two
  cases go red — intended, not brittle, and said out loud at the case.
- **A precondition rather than a case for "the subject has no seam."** Modelled on `wo-gate.mjs`'s
  tracker-drift precondition and kept out of the case array for the same stated reason (WO-2.16). It
  is also the safety property: no case is ever run against a subject that could resolve the real
  runner.
- **Three control cases beyond the enumeration** (exit 7, exit 0 with no output, and the success
  path). The success-path case additionally asserts the brief reached the child, which is the guard
  against every case above it passing because a process launched rather than because a dispatch ran.
- **`AGENTS.md` was not edited, and I want that visible rather than silent.** The brief lists it as
  one of three readers of these exit codes. It is not one: `grep -n "exit\|codex-invoke"` finds no
  exit code and no mention of this script in it. The two real readers are
  `.claude/agents/work-order-orchestrator.md` and `tools/README.md`, which is also what WO-2.37's own
  result file says it updated. Since no exit code moved, neither needed a semantic change; both were
  edited for the new flag.

## Temptations declined, recorded rather than acted on

- **`tools/wo-gate.mjs` carries the identical case-sensitivity hole.** Its `assertOutsideRepo()`
  derives `REPO` the same way and compares with a case-sensitive `startsWith`, so pointing `TMP`
  inside the repository would let its plants — which write *corrupted tracker files* — land in the
  real `plans/`. That is a strictly worse blast radius than mine was. **Not fixed here**: it is
  another file and another work order's subject. Proposed follow-up below.
- **Widening the exit-3 branch to `if (result.signal)` anyway.** It would look tidier and it cannot
  be covered by any case this machine can produce, which is this row's own standard for a fix. The
  reasoning is at the branch instead.
- **A `wo-sweep.mjs` clause asserting the gates still exist.** A grep would be a second,
  hand-maintained copy of what `--self-check` asserts by running, and the sweep is app-facing greps.
- **A `codex-invoke.mjs` row in `CLAUDE.md`'s Commands table.** That table has no row for this script
  today; adding one is not in the Deliverables and `CLAUDE.md` is not among the readers the Traps
  name.
- **`plans/dispatch-retro.md`.** WO-2.41 owns that file's exit-code sentence and the 2026-08-14 kill.
  I touched nothing in it.

## Proposed follow-up work orders (not built)

1. **The repo-write guard in `tools/wo-gate.mjs` is case-sensitive on a case-insensitive
   filesystem.** Same three lines, worse consequence — its plants are corrupted tracker files, and
   WO-2.15's own comment calls a plant escaping into the real `plans/` *"the worst bug this file could
   carry."* Reproducer: point `TMP` at a directory inside the repository and run
   `node tools/wo-gate.mjs --self-check`. Fix is the `norm()` two-liner now in `codex-invoke.mjs`.
   Worth checking `tools/wo-sweep.mjs` in the same sitting; it derives `REPO` identically, though it
   only reads.
2. **The orchestrator's outer 600000 ms Bash timeout is the constraint that binds first** — ten
   minutes, against a twenty-minute internal cap. Named out of scope by both WO-2.37 and this row,
   and still nobody's work order. The honest question is whether a Codex dispatch should be detached
   and polled rather than held inside one Bash call.

## Files changed

- `c:\dev\planbook\tools\codex-invoke.mjs` — the `--self-check` section and its CLI wiring, the
  four-variable seam (`SEAM`, `invokeTimeout()`, `codexResourcesDir()`, the early return in
  `runCodexWithFallback()`), the written answers to both adjacent findings at the two lines they are
  about, and two lines of the header block. 285 → 743 lines. No constant changed value.
- `c:\dev\planbook\tools\README.md` — the `codex-invoke.mjs` table row, the "writes outside the repo"
  sentence, and three paragraphs plus the mutation table for `--self-check` and the who-runs-it
  decision.
- `c:\dev\planbook\.claude\agents\work-order-orchestrator.md` — step 2b now checks the instrument
  before taking the reading (7 added lines, imperative only). **Its line-count rule honoured in the
  same edit: 330 → 341**, re-counted with `wc -l` after the final edit rather than by arithmetic.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — WO-2.40's six Acceptance boxes ticked
  with their evidence. No other row touched; `node tools/wo-gate.mjs --audit` is `PASS` and
  `node tools/wo-gate.mjs --self-check` is `PASS | 17 of 17 plants were caught` afterwards.

**Not changed:** anything under `src/`, `index.html`, `sw.js`, `AGENTS.md`, `CLAUDE.md`,
`plans/dispatch-retro.md`, `TESTING.md`, `CHANGELOG.md`.

## What I could not verify

- **The externally-killed-child shape (`signal` set, `error` unset) could not be driven**, because it
  is not producible on win32 — measured, not assumed, and the measurement is quoted above. The
  branch that would handle it is therefore not covered by any case, which is why I left the branch
  alone rather than widening it. On a POSIX machine this is a real case and the comment says so.
- **`--probe`'s real spawn was not run**, and neither was any real dispatch. The Traps forbid it and
  the work order puts the runner out of scope. So nothing here is evidence that a Codex dispatch
  works — only that this script's refusals still bite. The run says that in its own output.
- **`verify-shell.mjs` was not run**, on the brief's instruction; no app file was touched.
- **No 👤 lines exist in this Acceptance list**, so none were ticked. `TESTING.md` untouched —
  nothing here changes what a teacher sees.

## Draft `CHANGELOG.md` entry — the teacher's call, not mine

> **The two guards on the Codex dispatch plumbing can now prove they still work.** Both of them exist
> for things nobody sees on a good day — a work order refused before it starts because its checks
> cannot fit in the time, and a dispatch that was killed halfway saying so instead of claiming it
> never ran. Both had been proved exactly once, by hand, by temporarily editing the very file they
> live in, and the proof was thrown away with the scratch directory. `codex-invoke.mjs --self-check`
> makes that permanent: two seconds, no Codex process, nothing written anywhere near the app, and
> seventeen ways of failing that were each watched failing before the check was trusted.
