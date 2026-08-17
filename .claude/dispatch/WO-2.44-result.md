# WO-2.44 — result

**Route** Claude (work-order-implementer, Opus) · **Date** 2026-08-17 · **Status on exit** all five
Acceptance lines met and ticked; nothing committed (owner's call).

**The bug reproduced.** Not by reasoning — by watching all seventeen plants run inside
`C:\dev\planbook\.guard-probe\wo-gate-selfcheck-…` and the script exit **0** saying
`PASS | 17 of 17 plants were caught`. The fix is in, and the same probe now throws before the copy of
`plans/` exists.

---

## Baseline: three lines, not the two the brief named

The brief named ` M plans/work-orders/phase-2-attendance.md` and `?? .claude/dispatch/WO-2.44-brief.md`.
At spawn the tree actually carried a third, written after the brief was:

```
 M plans/work-orders/phase-2-attendance.md
?? .claude/dispatch/WO-2.44-brief.md
?? .claude/dispatch/WO-2.44-status.md
```

`WO-2.44-status.md` is the orchestrator's own in-flight status file (its first line says so, and it
says it deletes itself once this result exists). I treated the **three**-line state as the baseline and
compared literally against it. Nothing under `src/`, `tools/`, or elsewhere in `plans/`. `git diff` on
the tracker was the single `🤖 CLAIMED` status line, as stated.

---

## Acceptance, line by line

### 1. ✅ With `TMP`/`TEMP` inside the repository, `--self-check` throws from `assertOutsideRepo()` and writes nothing

Final run, fixed file, invoked the way `tools/README.md` documents (`node tools/wo-gate.mjs
--self-check`, `TMP` and `TEMP` both at `C:\dev\planbook\.guard-probe`):

```
file:///c:/dev/planbook/tools/wo-gate.mjs:1540
    throw new Error(`--self-check refused to write inside the repository: ${path.resolve(p)}`);
          ^

Error: --self-check refused to write inside the repository: C:\dev\planbook\.guard-probe\wo-gate-selfcheck-frmEXg
    at assertOutsideRepo (file:///c:/dev/planbook/tools/wo-gate.mjs:1540:11)
    at selfCheck (file:///c:/dev/planbook/tools/wo-gate.mjs:1609:5)
    at file:///c:/dev/planbook/tools/wo-gate.mjs:2340:16
```

Exit code **1**. `git status --short` before and after that run, captured by the probe itself and
compared programmatically (`before === after ? true`):

```
 M plans/work-orders/phase-2-attendance.md
 M tools/README.md
 M tools/wo-gate.mjs
 M tools/wo-sweep.mjs
?? .claude/dispatch/WO-2.44-brief.md
?? .claude/dispatch/WO-2.44-status.md
```

(The four ` M` lines are this work order's own edits. No `?? .guard-probe/` on either side.)

No plant anywhere under `plans/`, asserted two ways rather than one:

```
git grep found no WO-9.9 / WO-9.8 in tracked plans/ (exit 1)
no self-check sandbox or fixture file on disk under plans/
```

**And nothing appeared inside the repository at all during the run** — the probe polls the directory
every 10 ms while the child is alive, because the run's own `finally` deletes its sandbox and an
after-the-fact `git status` therefore cannot see an escape:
`peak contents of C:\dev\planbook\.guard-probe DURING the run (0 entr(ies))`. The refusal lands on
the **sandbox itself**, before `cpSync` — see the decision on that below.

Also confirmed the fix is not spelling-dependent: with `TMP` spelled `c:\dev\planbook\.guard-probe`
(lowercase drive), the fixed script throws identically —
`refused to write inside the repository: c:\dev\planbook\.guard-probe\wo-gate-selfcheck-kNzUDX`.

### 2. ✅ The same probe against the **unfixed** file, run first and reported

Run **before any edit**, on the baseline tree, `HEAD` = `7c66efa`. Verbatim, trimmed only where the
seventeen `ok |` lines and the coverage paragraph repeat what a normal green run prints:

```
=== derivation ===
  REPO as the scripts derive it   c:\dev\planbook
  TMP/TEMP handed to the child    C:\dev\planbook\.guard-probe
  realpathSync(TMP)               C:\dev\planbook\.guard-probe
  startsWith(REPO + sep)          false   <- what the unfixed guard asks

=== run output ===
--self-check
  subject   c:\dev\planbook\tools\wo-gate.mjs
  sandbox   C:\dev\planbook\.guard-probe\wo-gate-selfcheck-FgdPNM   (copied from plans, deleted on the way out)
  fixture   WO-9.9, written into the copy of phase-3-gradebook.md — no real work order is a fixture here
  trackers  clean in the copy — no ROADMAP.md dashboard drift, no fragment closing zero boxes

ok   | an unticked Acceptance line holds --tick at 🔨 IN PROGRESS instead of ✅ DONE
        [… all seventeen ok lines …]
  17 plants, 17 caught, 0 missed.

PASS | 17 of 17 plants were caught.

=== exit code: 0 ===

=== peak contents of C:\dev\planbook\.guard-probe DURING the run (21 entr(ies), depth<=5) ===
[dir]  C:\dev\planbook\.guard-probe\wo-gate-selfcheck-FgdPNM
[dir]  C:\dev\planbook\.guard-probe\wo-gate-selfcheck-FgdPNM\plans
       C:\dev\planbook\.guard-probe\wo-gate-selfcheck-FgdPNM\plans\ROADMAP.md
       …
[dir]  C:\dev\planbook\.guard-probe\wo-gate-selfcheck-FgdPNM\plans\work-orders
       C:\dev\planbook\.guard-probe\wo-gate-selfcheck-FgdPNM\plans\work-orders\phase-2-attendance.md
       C:\dev\planbook\.guard-probe\wo-gate-selfcheck-FgdPNM\plans\work-orders\phase-3-gradebook.md
       …
[dir]  C:\dev\planbook\.guard-probe\wo-gate-selfcheck-FgdPNM\tools
       C:\dev\planbook\.guard-probe\wo-gate-selfcheck-FgdPNM\tools\wo-gate.mjs

=== git status --short DURING the run (first poll that saw anything) ===
 M plans/work-orders/phase-2-attendance.md
?? .claude/dispatch/WO-2.44-brief.md
?? .claude/dispatch/WO-2.44-status.md
?? .guard-probe/

=== git status --short AFTER ===
 M plans/work-orders/phase-2-attendance.md
?? .claude/dispatch/WO-2.44-brief.md
?? .claude/dispatch/WO-2.44-status.md

before === after ? true
```

Two things in that output matter beyond the headline.

**The escape is invisible after the fact.** `git status --short` is byte-identical before and after
the *unfixed* run — the corrupted trackers were written inside the repository, and the `finally`
deleted them along with the sandbox. Only the in-flight poll sees `?? .guard-probe/`. So Acceptance
line 1's "identical before and after" is satisfied by the broken script too, and the discriminating
evidence is the sandbox path, the exit code, and the poll. The Traps line predicted exactly this
("the guard is silent when it works and silent when it fails"); it is worth knowing that the
*acceptance* has the same blind spot and that the poll is what closes it.

**I had to get the drive letter right before it reproduced, and the first attempt did not.** My first
probe built the probe directory as `c:\dev\planbook\.guard-probe` (lowercase), `realpathSync` preserved
that case, both sides matched, and the **unfixed** guard fired correctly:
`Error: --self-check refused to write inside the repository: c:\dev\planbook\.guard-probe\wo-gate-selfcheck-vlzUZh`.
That is a true negative, not a failure to reproduce: Windows' own `TEMP` on this machine is
`C:\Users\WildB\AppData\Local\Temp` — uppercase drive — so the uppercase spelling is the faithful one,
and with it the escape reproduced on the first try.

Related correction to the work order's premise, measured not assumed: **`REPO`'s drive letter is not
reliably lowercase.** `subject` printed `c:\dev\planbook\tools\wo-gate.mjs` under the probe's spawn and
`C:\dev\planbook\tools\wo-gate.mjs` when I ran it from the shell, on the same file in the same sitting —
Node echoes whatever case launched it. So the pre-fix guard was correct *by coincidence of invocation*,
which is a slightly worse story than "always lowercase, always broken", and it is the version that went
into `tools/README.md` and the code comment. I reproduced the escape under both spawn styles, including
the documented `node tools/wo-gate.mjs --self-check` invocation, which needed the unfixed file back in
the tree: I copied the fixed file to the scratchpad, `git checkout -- tools/wo-gate.mjs`, ran the probe,
then restored and **verified the restore by hash** — `46bc5639…a1d7` on both sides.

### 3. ✅ At normal `TMP`, `--self-check` still `PASS | 17 of 17` and `--audit` still PASS

Run on the final tree, after every edit including the comment corrections:

```
--self-check
  subject   C:\dev\planbook\tools\wo-gate.mjs
  sandbox   C:\Users\WildB\AppData\Local\Temp\wo-gate-selfcheck-X3N9t4   (copied from plans, deleted on the way out)
  17 plants, 17 caught, 0 missed.
PASS | 17 of 17 plants were caught.
self-check exit: 0

PASS | every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open box,
every uncounted box has a struck or deferred work order behind it, § The files names what its files
hold, and every dashboard row matches its own boxes.
audit exit: 0
```

`--audit`'s dashboard block was also read in full and is unchanged (Phase 2 `row 15/15 boxes 15/15
(+1 not coming, uncounted)`, `overall row 42/81`).

### 4. ✅ `wo-sweep.mjs` resolved in writing; the bug's shape recorded once in `tools/README.md`

**`tools/wo-sweep.mjs` is left as it is, deliberately, and the reason is in the file** at its `REPO`
declaration (`tools/wo-sweep.mjs:28-34`) — not only here. Grounds, checked rather than assumed:

- Every `REPO` use in that file is `walk(REPO)`, `path.join(REPO, …)`, `path.relative(REPO, p)`, or
  `cwd: REPO` — enumerated with a grep, sixteen sites, **no `startsWith` and no `===` against `REPO`**.
- The one thing that *compares* is `path.relative`, which win32 answers case-insensitively. Measured
  both orderings rather than trusted: `relative('c:\dev\planbook', 'C:\dev\planbook\src\prefs.js')` and
  `relative('C:\…', 'c:\…\src\prefs.js')` both return `..\devplanbooksrcprefs.js`, while the raw
  `startsWith` on the same pair returns `false`.
- It **writes nothing anywhere** — grepped for `writeFile|mkdir|rmSync|cpSync|copyFile|appendFile|unlink`,
  zero hits in the file. There is no guard there to be wrong.

**The record lands once**, in `tools/README.md`, in the `--self-check` section immediately after the
paragraph whose claim this bug made untrue. It names the shape (a case-sensitive compare against a
case-insensitive filesystem), the measurement in both directions with the `PASS | 17 of 17` / exit 0
detail, why the acceptance asserts an absence, that the fix is duplicated from `codex-invoke.mjs` rather
than shared, and the one sentence resolving `wo-sweep.mjs`. I also amended the sentence at
`tools/README.md:63` that this row falsified, so it now reads "Every plant path — and, since WO-2.44,
the sandbox that holds them — goes through a guard that refuses anything inside the repository".

The two script comments are **pointers, not copies**: `wo-gate.mjs`'s says which way the compare goes
and sends the reader to `tools/README.md` for the shape; `wo-sweep.mjs`'s says why it needs nothing and
does the same. `tools/codex-invoke.mjs` was read and **not touched** — it already carries the fix and
its own account of it, and it is out of scope.

### 5. ✅ `wo-sweep.mjs` green, `git diff --stat -- src/` empty

```
================ SUMMARY ================
20 checks · 18 passed · 0 failed · 2 to review
sweep exit: 0
```

Zero failures, exit 0. The two REVIEWs are the standing pair (sensitive field names outside
`src/backup.js`; due-date and late/missing on one line) — both pre-existing, both in `src/` files this
row does not touch. `git diff --stat -- src/` prints **nothing**; the full diffstat is four files, all
`plans/` and `tools/`.

---

## Decisions the work order left to me

**1. The `norm()` name collision → a distinct local name, `fold`.** The brief offered either a verbatim
`const norm` shadow or a distinct name with a pointer comment. I took the distinct name, and the
deciding argument is not readability but a failure mode: if a future editor deletes the local
declaration as redundant, a `norm` shadow falls through to the module-level markdown `norm()` at
`:832`, **which also lowercases** — so the guard would keep passing every test in this repository while
having quietly become a markdown normalizer applied to filesystem paths. That is this row's own bug
class (a guard that looks correct). Named `fold`, the same edit is a `ReferenceError`. Cost, stated
plainly: the two guards are no longer textually identical between the two files, so a reader diffing
them sees one renamed identifier. The comment names `codex-invoke.mjs` as the origin so the lineage
survives the rename. The module-level `norm()` was not touched.

**2. The sandbox path now goes through the guard too** (`selfCheck()`, `tools/wo-gate.mjs:1599-1609`),
which the brief flagged as a judgment call. I judged it needed. Without it the earliest refusal came
from `copyFileSync` at what is now `:1628`, i.e. **after** `mkdirSync(sandbox/tools)` had already
created directories inside the repository, and the `finally` then `rmSync`s a repository directory —
the specific thing the Why-it-exists paragraph calls out. With it, the run stops before the tree copy
exists: the probe's 10 ms poll saw *zero* entries appear under the repo on every fixed run. It also
mirrors `codex-invoke.mjs:462` and the reason it gives (`mkdtemp()` reads `TMP`, which is outside this
file's control). It adds no `--self-check` **case**, so the Out-of-scope line is intact. Residue worth
knowing: `mkdtempSync` has already created its own empty directory by the time any code can look at
it, and the `finally` deletes that — invisible to git, which ignores empty directories.

**3. The reproducer's drive-letter spelling is a parameter, not a detail.** Recorded above under
Acceptance line 2 because it changes what the measurement means. I reported the first,
non-reproducing run rather than quietly discarding it.

---

## Files changed

- `c:\dev\planbook\tools\wo-gate.mjs` — the `fold` two-liner in `assertOutsideRepo()` with its comment;
  `assertOutsideRepo(sandbox)` in `selfCheck()`. Only edit to that file.
- `c:\dev\planbook\tools\wo-sweep.mjs` — a seven-line comment at the `REPO` declaration recording the
  deliberate leave. No behaviour change.
- `c:\dev\planbook\tools\README.md` — the once-only record of the bug's shape, plus the corrected
  guard-claim sentence.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — the five Acceptance boxes ticked. Status
  line left at `🤖 CLAIMED — 2026-08-17` for the verifier's `--tick` to move.

`CHANGELOG.md` untouched (teacher's call). Nothing committed, nothing pushed. Diff is 57 insertions /
8 deletions across four files; checked for the CRLF rewrite `MEMORY.md` warns about — zero `\r` in all
three changed text files, and the diffstat is proportional to the edit.

Scratchpad (not deliverables): `guard-probe.mjs` and four captured runs under
`C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\5f2ed982-b110-49bf-94e4-860779c3e281\scratchpad`.
`.guard-probe\` was created in the tree by the probe and is removed; `git status` confirms.

---

## Verification commands, and what each actually proves

| Command | Result |
|---|---|
| `node tools/wo-gate.mjs --self-check` (normal `TMP`) | `PASS \| 17 of 17 plants were caught.`, exit 0 |
| `node tools/wo-gate.mjs --audit` | `PASS \| every fragment matches…`, exit 0 |
| `node tools/wo-sweep.mjs` | `20 checks · 18 passed · 0 failed · 2 to review`, exit 0 |
| `node tools/verify-shell.mjs` | **it ran**: `824 checks · 824 passed · 0 failed · 0 skipped`, `22,191 lines · 26.9 lines per check · 261s`, exit 0 |
| the reproducer, unfixed | escaped: sandbox inside the repo, `PASS \| 17 of 17`, exit 0 |
| the reproducer, fixed | threw from `assertOutsideRepo()`, exit 1, nothing written |

On `verify-shell.mjs`: I ran it rather than assuming it could not run here, waited for the exit, and
the numbers above are read off its printed summary. It is a green run and **not a tick** — it drives a
page, not an installed app, and this row changes no file it touches (`git diff --stat -- src/` empty is
the same assurance from the other side). It closes no 👤 line.

**Nothing in this work order needs an iPad or human eyes**, so there is no 👤 line here for me to have
left blank — the row has none, and I ticked no 👤 line anywhere. Every box I ticked has its evidence
quoted above.

---

## Left undone, and temptations declined

- **`tools/codex-invoke.mjs` not touched**, per Out of scope. Noted while reading it: its comment at
  `:425-430` states `REPO` "comes from `import.meta.url` as `c:\dev\planbook`", which my measurement
  shows is invocation-dependent. Its *code* is right and its conclusion is right; only that one clause
  is more confident than the filesystem is. Not my row — worth one line in whatever next visits it.
- **No shared helper**, per Traps. The two-liner is duplicated on purpose; `tools/` still has zero
  cross-imports.
- **No new `--self-check` case for the guard.** The guard is a property of the harness, not a plant,
  and the Out-of-scope line says so. If it is ever wanted, the honest shape is a case in
  `codex-invoke.mjs`'s style driving a subject with `TMP` pointed into the tree — that is a work order,
  not a line item, because it needs the sandbox-inside-the-repo fixture the escape itself creates.
- **Did not commit.** The Traps line asks for the reproducer on a clean tree and committing first; I
  ran it against the named three-line baseline instead, which the brief explicitly authorised, and left
  the commit to the owner.

## Draft `CHANGELOG.md` entry — for the teacher to accept, reword, or bin

> **Fixed** — `wo-gate.mjs --self-check`'s guard against writing inside the repository compared paths
> case-sensitively on a filesystem that is not, so a `TMP` pointed into the tree let it copy `plans/`
> and plant seventeen corrupted tracker files there and still exit green. Measured both ways before and
> after. Same fix as `codex-invoke.mjs` carried since WO-2.40, copied rather than shared; the sandbox
> directory itself now goes through the guard as well, so the refusal lands before anything is copied.
