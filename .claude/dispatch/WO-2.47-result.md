# WO-2.47 — the repo-write guard is protected by prose in both scripts that carry it · result

**Implementer** Claude (work-order-implementer), Opus tier · **Date** 2026-08-17
**Brief** `.claude/dispatch/WO-2.47-brief.md` · **Row** `plans/work-orders/phase-2-attendance.md:4654`

All six Acceptance lines met and ticked on the row. Nothing was left undone. `tools/codex-invoke.mjs`
is byte-identical to the tree I started on — it was mutated twice for evidence and reverted, and both
reverts are proved below by hash.

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\tools\wo-gate.mjs` | `guardFolds()` — a precondition over `assertOutsideRepo()` itself — and its call site at the top of `selfCheck()`, before the sandbox exists. +103 lines, no deletions |
| `c:\dev\planbook\tools\wo-sweep.mjs` | § 15, one check: both copies of `assertOutsideRepo()` still case-fold on win32. +92 lines. Sweep goes 20 → 21 |
| `c:\dev\planbook\tools\README.md` | The `--against` asymmetry in the WO-3.11 mutation table (new row + the paragraph under it), a paragraph in the `--self-check` guard section, and the three live recorded sweep counts (`:10`, `:1674`, `:1712`, `:1715`) moved 20 → 21 **from the run, not by arithmetic** |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | Six acceptance boxes ticked with their run figures in *(italic parens)*. Status line untouched — still `🤖 CLAIMED`, for the verifier and the gate script to move |

**Not changed:** `tools/codex-invoke.mjs` (the row's Out of scope says this dispatch only reads it),
anything under `src/`, `CHANGELOG.md`, `TESTING.md`.

## Acceptance, line by line

### 1. Fold deleted from `wo-gate.mjs` → `--self-check` red at the new precondition, names the path, plants nothing. Reverted and proved. — MET

Mutation: `const fold = (s) => (process.platform === 'win32' ? path.resolve(s).toLowerCase() : path.resolve(s));`
→ `const fold = (s) => path.resolve(s);`

```
=== git status --short BEFORE ===
 M plans/work-orders/phase-2-attendance.md
 M tools/wo-gate.mjs
 M tools/wo-sweep.mjs
?? .claude/dispatch/WO-2.47-brief.md
?? .claude/dispatch/WO-2.47-status.md

=== node tools/wo-gate.mjs --self-check (fold deleted) ===

FAIL | --self-check checks its own repo-write guard before it makes a sandbox, and
     | assertOutsideRepo() is not refusing what it must. Nothing was planted, no
     | sandbox was made, and plans/ was not copied anywhere.

     | assertOutsideRepo() did not refuse C:\dev\planbook\.probe, which is c:\dev\planbook\.probe with the drive letter's case flipped and therefore the same directory on this filesystem. This is WO-2.44's defect exactly: the win32 fold is gone from the compare, so the guard is correct only when REPO happens to be spelled the way node was launched.

  0 plants made, and this is NOT one of the seventeen — those are about tracker rot,
  and this is about whether the guard that keeps them out of the repository still
  folds on win32 (WO-2.44, WO-2.47). The count above is unchanged by this check.

  `--against` cannot see this: the guard protecting the repository during a run is
  THIS file's, whatever subject was named. The fold at assertOutsideRepo() is the
  thing to read, and `tools/README.md`'s mutation table records it going red.

FAIL | 1 problem(s) in this script's assertOutsideRepo(). Every path a plant writes goes through it, and so does the sandbox that holds them.
EXIT=1

=== git status --short AFTER ===
 M plans/work-orders/phase-2-attendance.md
 M tools/wo-gate.mjs
 M tools/wo-sweep.mjs
?? .claude/dispatch/WO-2.47-brief.md
?? .claude/dispatch/WO-2.47-status.md

=== anything planted under plans/ ? ===
 plans/work-orders/phase-2-attendance.md | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

**"Plants nothing" is asserted three ways, not one:** the run's own `0 plants made`, `git status
--short` byte-identical either side of it, and the only `plans/` diff being this row's own claim line
(`🤖 CLAIMED`, written by `--start` before I arrived). The precondition sits **above** `mkdtempSync`,
so no sandbox is created either.

Which fact went red is the interesting part and is why there are three: fact 1 (the repo path spelled
the way `REPO` is spelled) **passed on the mutant** — an unfolded compare of two identically-spelled
paths is correct — and fact 2, the flipped drive letter, is the one the fold owns. A two-fact
precondition would have gone green over the defect.

Revert proved:

```
=== md5 of tools/wo-gate.mjs before the re-run mutation ===
c2cf86fbc43f5bc0c8ca8ff214fc5d2f *tools/wo-gate.mjs
=== MUTANT ===
dac1636a92fe29278e4c1d7a4e732c40 *tools/wo-gate.mjs        (first run, earlier wording)
=== md5 after revert (must equal c2cf86fbc43f5bc0c8ca8ff214fc5d2f) ===
c2cf86fbc43f5bc0c8ca8ff214fc5d2f *tools/wo-gate.mjs

PASS | 17 of 17 plants were caught.
```

*(This mutation was run twice. The first run's FAIL text read "the path above with the drive letter's
case flipped", and "the path above" is fact 1's message, which is not printed when fact 1 passes — so
I reworded it to name both spellings and **re-ran the mutation** rather than quoting output that no
longer matches the file. The block above is the second run, against the delivered wording.)*

### 2. Fold deleted from `codex-invoke.mjs` → `wo-sweep.mjs` red at the new check, names that file. Reverted and proved. — MET

Mutation: `const norm = (s) => (process.platform === 'win32' ? resolve(s).toLowerCase() : resolve(s));`
→ `const norm = (s) => resolve(s);`

```
=== MUTANT: the win32 fold deleted from codex-invoke.mjs assertOutsideRepo() ===
faff49496371a67d41a4b543c041760d *tools/codex-invoke.mjs

=== node tools/wo-sweep.mjs ===
FAIL | both copies of assertOutsideRepo() still case-fold on win32  :: tools/codex-invoke.mjs:746 — `assertOutsideRepo()` no longer declares a helper that branches on `'win32'` and calls `.toLowerCase()`. That is the fold, and without it the guard compares `c:\dev\planbook` against `C:\dev\planbook\…` and reports that a path inside the repository is outside it (WO-2.40, WO-2.44)
21 checks · 18 passed · 1 failed · 2 to review
EXIT=1
```

Revert proved, against the hash taken before I touched the file at all:

```
=== md5 after reverting mutation 2 (must equal ad68d45dd469d17d870a45268284c18c, the pristine baseline) ===
ad68d45dd469d17d870a45268284c18c *tools/codex-invoke.mjs

 M tools/wo-gate.mjs
 M tools/wo-sweep.mjs          ← `git status --short tools/`; codex-invoke.mjs is not in it
```

Functionally re-checked as well as byte-checked: `node tools/codex-invoke.mjs --self-check` →
`PASS | 26 of 26 cases behaved.`

### 3. The new sweep check FAILs rather than passing quietly when it matches nothing — MET, both arms

**Arm A, the path that does not exist** (the demonstration the line asks for). `COPIES` pointed at
`tools/wo-gate-does-not-exist.mjs`:

```
FAIL | both copies of assertOutsideRepo() still case-fold on win32  :: tools/wo-gate-does-not-exist.mjs is not where this check expects it — the guard it carries is now watched by nothing. Restore the file or point this check at the new path; a copy this sweep cannot read must not read as a passing fold
21 checks · 18 passed · 1 failed · 2 to review
EXIT=1
```

**Arm B, the empty grep proper** — a file that exists and carries no such guard, which is what a
rename or a move looks like. `COPIES` pointed at `tools/wo-brief.mjs`:

```
FAIL | both copies of assertOutsideRepo() still case-fold on win32  :: tools/wo-brief.mjs has no top-level `function assertOutsideRepo(` — the guard has been renamed, moved or removed, and this check has stopped matching anything in it
21 checks · 18 passed · 1 failed · 2 to review
EXIT=1
```

Both arms `FAIL`, never `REVIEW`, exit 1. Revert proved:

```
=== md5 after reverting mutation 3 (must equal c7ff9d1937d97ba3bbfab4a1eb55e344) ===
c7ff9d1937d97ba3bbfab4a1eb55e344 *tools/wo-sweep.mjs
21 checks · 19 passed · 0 failed · 2 to review
```

### 4. Unmutated tree: `17 of 17`, `--audit` PASS, sweep green with its new count matching `tools/README.md` — MET

```
--self-check precondition
  guard     assertOutsideRepo() refuses c:\dev\planbook\.probe at either drive-letter case (C:\dev\planbook\.probe too) and allows c:\dev\wo-gate-guard-probe-outside
            — checked before the sandbox exists, and not one of the 17 plants (WO-2.47)
--self-check
  subject   c:\dev\planbook\tools\wo-gate.mjs
  ...
PASS | 17 of 17 plants were caught.
SELFCHECK_EXIT=0

PASS | every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open box, every uncounted box has a struck or deferred work order behind it, § The files names what its files hold, and every dashboard row matches its own boxes.
AUDIT_EXIT=0

21 checks · 19 passed · 0 failed · 2 to review
SWEEP_EXIT=0
```

**Seventeen is still seventeen** — this is a precondition, not an eighteenth plant. It reports before
any plant is made and says so on its own line, per WO-2.16's model and the Traps.

The two REVIEWs are the standing pair (297 sensitive-field-name mentions; the due-date / `late`-`missing`
list) — unchanged from the baseline run I took before touching anything, which read
`20 checks · 18 passed · 0 failed · 2 to review`.

The 21 was **copied off the summary line of a run**, not incremented, per `wo-sweep.mjs:673` and the
README's own instruction at the "deliberately unguarded" paragraph. It is recorded in the three places
`tools/README.md` states a figure: the script table at `:10`, the cross-reference paragraph at `:1674`,
and the two mentions in the "deliberately unguarded" paragraph. Historical figures in `TESTING.md`,
`plans/work-orders/*.md` and older `.claude/dispatch/*-result.md` were **left alone** — they are dated
readings from the tree that was true then, which is the convention `tools/README.md:63` states for its
own older counts.

Also run, though this row is not graded on it: `node tools/verify-shell.mjs` →
`824 checks · 824 passed · 0 failed · 0 skipped`, `22,286 lines · 27.0 lines per check · 254s`,
**exit 0**. It ran to completion in this sandbox; I waited for the exit and read it out of the task
file (`[exited with code 0]`) rather than predicting it. It measures a tree in which no file it loads
changed, so it is a no-regression reading and closes nothing.

### 5. The `--against` asymmetry written at the code **and** in `tools/README.md`'s mutation table — MET

**At the code** — `tools/wo-gate.mjs`, the block header on `guardFolds()`, final paragraph: the plants
run the *subject* in a child process while this assertion runs in the *invoking* script, because the
invoking script is the one that makes the sandbox and writes the plants and therefore the one whose
guard is actually protecting the repository; `--self-check --against <a copy from before WO-2.44>`
passes the precondition while driving the buggy guard, and that is correct rather than a hole. The
failure banner repeats the short version, so a reader who hits it red is told there too.

**In the table** — `tools/README.md`, the WO-3.11 mutation table gains a sixth row whose Mutation cell
carries the caveat (*"and the mutation is of the real file, not of a copy"*) and whose Result cell reads
`0 plants run`. The paragraph under the table, which used to end at *"Five mutations, all reverted"*,
now says why the sixth row is a different kind of thing.

### 6. `git diff --stat -- src/` is empty — MET

```
=== git diff --stat -- src/ (must be empty) ===
(end)
```

Nothing under `src/` was opened, let alone written. Full diffstat for the dispatch:

```
 plans/work-orders/phase-2-attendance.md |  31 ++++++----
 tools/README.md                         |  41 +++++++++++--
 tools/wo-gate.mjs                       | 103 ++++++++++++++++++++++++++++++++
 tools/wo-sweep.mjs                      |  92 ++++++++++++++++++++++++++++
 4 files changed, 250 insertions(+), 17 deletions(-)
```

250 insertions for four files, and `grep -c $'\r'` is **0** on all three edited text files — no CRLF
rewrite hiding in the diff.

## The mutation ledger, in full

Every mutation, its hash, and the hash after revert. All five were made in `tools/`, none in `src/`,
and no commit was made at any point while the tree was dirty.

| # | File | Mutation | md5 before | md5 mutated | md5 after revert |
|---|---|---|---|---|---|
| 1 | `tools/wo-gate.mjs` | the win32 fold deleted (run 1, earlier wording) | `adb8a4f79de2de95d5db74e8dc8ba90b` | `dac1636a92fe29278e4c1d7a4e732c40` | `adb8a4f79de2de95d5db74e8dc8ba90b` ✔ |
| 2 | `tools/codex-invoke.mjs` | the win32 fold deleted | `ad68d45dd469d17d870a45268284c18c` | `faff49496371a67d41a4b543c041760d` | `ad68d45dd469d17d870a45268284c18c` ✔ |
| 3 | `tools/wo-sweep.mjs` | `COPIES` pointed at a nonexistent path, then at `wo-brief.mjs` | `c7ff9d1937d97ba3bbfab4a1eb55e344` | `39c000387baa9b8f1a198c6ce83a5dec` (arm A) | `c7ff9d1937d97ba3bbfab4a1eb55e344` ✔ |
| 4 | `tools/wo-gate.mjs` | the win32 fold deleted (run 2, delivered wording) | `c2cf86fbc43f5bc0c8ca8ff214fc5d2f` | *(not hashed separately — same edit as #1)* | `c2cf86fbc43f5bc0c8ca8ff214fc5d2f` ✔ |
| 5 | `tools/wo-gate.mjs` | `const repo = fold(REPO)` → `path.resolve(REPO)` — one side folded | `61120d6f81087b8bfde8f2ada9fa2ac8` | `67cf17388ac3a05a251aafe841995c97` | `61120d6f81087b8bfde8f2ada9fa2ac8` ✔ |

`tools/codex-invoke.mjs`'s pristine baseline `ad68d45d…` was taken **before the first edit of the
sitting** and is also its delivered hash — the file is untouched, as the row's Out of scope requires.

**Mutation 5 is not an acceptance line; it is the non-vacuity proof for the "both sides" clause**, and
what it shows is worth keeping. Folding only the argument and leaving `REPO` raw is the shape WO-2.44's
tick-time amendment names — *correct by coincidence of invocation*. On this machine `REPO` came out
`c:\dev\planbook` (lowercase), so the mutant's compare still worked and **the precondition passed it**:

```
--- the sweep ---
FAIL | both copies of assertOutsideRepo() still case-fold on win32  :: tools/wo-gate.mjs:1534 — `fold()` is declared but applied to 1 path(s), and the compare must fold BOTH sides: `fold(REPO)` is missing. `import.meta.url` yields whatever case launched node, so folding one side leaves the guard correct only by coincidence of spelling
SWEEP_EXIT=1

--- the precondition, on the same mutant ---
--self-check precondition
  guard     assertOutsideRepo() refuses c:\dev\planbook\.probe at either drive-letter case (C:\dev\planbook\.probe too) and allows c:\dev\wo-gate-guard-probe-outside
```

So the two new checks are not two spellings of one claim: the behavioural one catches the fold coming
out, the textual one catches it being applied to one side, and on a different invocation (`C:\dev\…`)
the two would swap which of them sees it. That is the argument for having both, measured rather than
asserted.

## What I could not verify

- **Nothing needed an iPad or human eyes**, so no 👤 line is implicated and none was ticked. This row
  has no 👤 lines.
- **The POSIX arm of fact 2 was not executed.** The precondition skips the flipped-drive-letter
  assertion off win32, by design (on POSIX that path is genuinely outside and asserting a throw would
  be asserting a bug — the work order's own words). I ran only on win32, so what I have measured is
  that the clause is *guarded* by `process.platform === 'win32'`, not that it behaves correctly on a
  Linux checkout. Nothing in this repository runs there today.
- **A checkout at a drive root would fail fact 3 spuriously.** `outside` is built as
  `path.dirname(REPO)` + a name; if `REPO` were `c:\`, `dirname` answers the root back and a correct
  guard would refuse the probe. I left it unhandled rather than branching around a case that cannot
  occur here, and said so in a comment at the line — it fails loud and the message names the path.
  I did not construct that fixture.
- **The sweep check is textual and I have not pretended otherwise.** It catches the fold being
  deleted and the fold being applied to one side; it cannot see a `startsWith` that lost its
  `path.sep`, an `endsWith` typo, or a fold compared against the wrong variable. That limit is written
  at the check, in `tools/README.md`, and repeated here because the Traps asked for it in as many words.
  `codex-invoke.mjs`'s copy still has **no** behavioural coverage anywhere — that is the known gap the
  out-of-scope end-to-end probe would have closed.

## Decisions the work order did not settle

1. **One check, not two.** The sweep gains a single `check()` covering both files, with the faults
   joined, rather than one per copy. The deliverable says "a sweep check" singular, and a failure in
   either file is the same fact; it also keeps the recorded-count churn to one. Consequence: a run with
   both copies broken reports one red line naming two files.
2. **Four facts per file in the sweep, not one.** The function exists → a `win32`/`toLowerCase` helper
   is declared in it → the helper is applied to the parameter → and to `REPO`. The last two are what
   mutation 5 proves are not decoration. Each has its own FAIL text.
3. **The flip is of the first ASCII letter, not a `/^[A-Za-z]:/` rewrite.** On an absolute win32 path
   that letter *is* the drive letter, which is the pair WO-2.44 was about; writing it this way means a
   UNC or extended-length root flips something rather than silently skipping the assertion. If there
   is no letter at all to flip, that is reported as a problem — "unasserted is not the same as passing".
4. **`outside` is built from the repository's parent, deliberately not from `os.tmpdir()`.** `TMP` is
   exactly what a person testing this guard points into the tree, and a probe built from it would
   report "a path outside the repository was refused" about a path that was inside it — the WO-2.44
   reproducer would have made fact 3 lie. The reasoning is at the line.
5. **The green precondition prints two lines above the `--self-check` banner** rather than being
   silent (`trackerDrift()`'s precondition is silent when clean). The Traps ask that it "say so in its
   own output", and the plant count is the thing being protected — a line naming the three probes and
   ending *"not one of the 17 plants"* is what makes that visible on a green run.
6. **I hand-ticked the six Acceptance boxes and left the `**Status**` line at `🤖 CLAIMED`.** Ticking
   is permitted for lines my own runs closed and every one of these is evidenced above; moving the
   status is the gate script's job at `--tick`, after the verifier.

## Out-of-scope temptations, declined

- **`path.relative()`.** Reading the two guards side by side, the four-line fold is plainly the thing
  `path.relative` would delete. The work order argues it out — including the across-drives clause that
  must be handled or the guard permits everything — and refuses it here because a row about protecting
  a fix should not change the fix, and because it would break the copied-from-the-sibling relationship
  unless `codex-invoke.mjs` moved in the same sitting. Not done. If it is ever wanted, note that my
  sweep check would need rewriting with it: it greps for `win32`/`toLowerCase` by name.
- **The standing end-to-end probe** (subprocess, `TMP` inside the tree, assert exit 1 and zero writes).
  Not built. Its coverage delta over the precondition really is one empty `mkdirSync` — I confirmed
  the ordering by reading `runPlants()`: `fs.mkdirSync(sandbox/tools)` is the only write between the
  precondition and the first `assertOutsideRepo`-wrapped copy target.
- **Extracting a shared helper.** The two copies now differ in three ways (`fold` vs `norm`,
  `path.resolve` vs `resolve`, and the comment above them), and the sweep check had to be written to
  tolerate all three — which is the moment the tidy-up instinct says "just share it". Not done, and
  the check's own comment records *why* they are duplicated so the next reader meets the reason before
  the temptation.
- **A pointer in `codex-invoke.mjs` saying its guard is now watched by the sweep.** Genuinely useful —
  that file's comment currently gives no hint that anything checks it — but the row says
  "`codex-invoke.mjs` as a *change* — this row only reads it", and a one-line comment is still a
  change. Left for whoever books the next row on that file.

## Draft `CHANGELOG.md` entry — for the teacher to accept, reword or discard

> **Tooling.** The repo-write guard that keeps `--self-check`'s corrupted tracker fixtures out of the
> repository is now checked instead of merely commented. `wo-gate.mjs` asserts its own
> `assertOutsideRepo()` before it makes a sandbox — a path inside the repository is refused, the same
> path with the drive letter's case flipped is refused, a path genuinely outside is not — and the
> standing sweep asserts that both copies of that guard, here and in `codex-invoke.mjs`, still fold on
> Windows. The sweep is 21 checks. Neither is a new plant: `--self-check` is still seventeen.

## Commands run, with their results

| Command | Result |
|---|---|
| `node tools/wo-gate.mjs --self-check` (baseline, before any edit) | `PASS | 17 of 17 plants were caught`, exit 0 |
| `node tools/wo-gate.mjs --audit` (baseline) | PASS, exit 0 |
| `node tools/wo-sweep.mjs` (baseline) | `20 checks · 18 passed · 0 failed · 2 to review`, exit 0 |
| `node tools/wo-gate.mjs --self-check` (delivered) | `PASS | 17 of 17 plants were caught`, exit 0, precondition line printed |
| `node tools/wo-gate.mjs --audit` (delivered) | PASS, exit 0 |
| `node tools/wo-sweep.mjs` (delivered) | `21 checks · 19 passed · 0 failed · 2 to review`, exit 0 |
| `node tools/codex-invoke.mjs --self-check` (after its revert) | `PASS | 26 of 26 cases behaved`, exit 0 |
| `node tools/verify-shell.mjs` (delivered) | `824 checks · 824 passed · 0 failed · 0 skipped`, 254s, **exit 0** — waited for the exit, read from the task file |
| `node tools/wo-gate.mjs WO-2.47` | `PASS | gates clear for WO-2.47` |
| the five mutation runs | tabulated above, each with its exit code and its revert hash |

No `git commit`, no `git push` — the brief did not ask for either, and the tree is left dirty and
readable for the verifier.
