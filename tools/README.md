# `tools/` — scripts, run by hand

| Script | What it does |
|---|---|
| `verify-shell.mjs` | Drives the real app in headless Edge/Chrome and **measures** what a stylesheet review can only assert. `node tools/verify-shell.mjs` |
| `verify-deploy.mjs` | Reads the **deployed** origin off the wire — status, `Cache-Control`, redirects, and the precache list as the deployment declares it. Run by hand after a deploy. `node tools/verify-deploy.mjs` |
| `make-icons.mjs` | Draws the home-screen icons and writes them as PNGs into `icons/`, using `node:zlib` and nothing else. `node tools/make-icons.mjs` |
| `make-cert.mjs` | Mints a local CA and a server certificate into `certs/`, so the LAN address is a secure context. `node tools/make-cert.mjs` |
| `serve-https.mjs` | Serves the repo over HTTPS for a device sitting, plus a plain-HTTP page that hands the iPad the CA. `node tools/serve-https.mjs` |
| `wo-sweep.mjs` | The verifier's 22-check standing sweep as greps — the checks a `grep` settles correctly, with their allowlists written down, including the three active `no-cache` stanzas in `_headers`, the backup nag's collection list against `docs/data-model.md`, and both copies of the repo-write guard — plus, since WO-2.48, the list of guarded scripts itself, derived and diffed against what § 15 declares. `node tools/wo-sweep.mjs` |
| `wo-gate.mjs` | Work order gates, "what's next", claiming a work order for a dispatch, the maintenance ticks with a recomputed dashboard, and — since WO-2.15 — a read-only `--audit` of both trackers and a `--self-check` that plants its own violations. `node tools/wo-gate.mjs next` |
| `wo-brief.mjs` | Assembles the verbatim parts of a dispatch brief. `node tools/wo-brief.mjs WO-1.7 > .claude/dispatch/WO-1.7-brief.md` |
| `wo-cost.mjs` | What each dispatch cost, from the session transcripts. `node tools/wo-cost.mjs` |
| `codex-invoke.mjs` | The Codex exec-time probe and the real dispatch, one file so the `codex-resources\` `PATH` fix can't drift between copies — and, since WO-2.40, a `--self-check` that drives its own refusals against a stand-in child. Since WO-2.45 the dispatch is **detached and polled**, because the caller's own timeout used to kill it first. `node tools/codex-invoke.mjs --probe` / `--brief <path> --out <path> [--budget <minutes>] --detach` / `--status <path> [--wait <seconds>]` / `--self-check` |
| `audio-probe.html` | **Not a script** — a page, opened on the device. Tells iOS Silent Mode apart from an AudioContext that will not start outside a gesture, which are the same silence otherwise. See below; it has a way to be served wrong that looks like nothing being wrong. |

The four `wo-*.mjs` scripts and `codex-invoke.mjs` are **dispatch plumbing**, not app tooling — they
read `plans/` and the agent transcripts, and none of them touches `src/`. They exist because the
pipeline was re-deriving the same work every run: gate parsing, brief assembly, sweep allowlists, and
a cost analysis that was rebuilt from scratch four times in one afternoon and thrown away each time.
Same failure mode as the two throwaway browser harnesses that became `verify-shell.mjs`.
`wo-gate.mjs` is the only one that writes to the repo, and only ever to `plans/`: `--start` and
`--release` write one status line, `--tick` writes the status, the roadmap boxes and the dashboard —
and all three refuse to touch a 👤 line or `CHANGELOG.md`. Since WO-2.14 `--tick` reads the work
order's own Acceptance list first and writes `🔨 IN PROGRESS` rather than `✅ DONE` when a line is
still open, because the one script that edits the tracker is the one nothing else checks.

**Since WO-3.11 the statuses it writes are three different facts rather than two.** `--start` writes
`🤖 CLAIMED — <dispatch>` (the date, unless `--dispatch <label>` says otherwise) and `--release` is the
way back out of it — and out of nothing else, so a caller who is wrong gets a refusal instead of a
finished work order set back to `⬜ NOT STARTED`. `🔨 IN PROGRESS` now means only what `--tick` writes:
part-built, nobody in flight. A work order that **landed** carrying Acceptance lines another work order
will close is `✅ DONE` with a `**Owes**` field, and those lines stay `- [ ]` with a `→ WO-x.y` marker.
`--tick` honours a marker **only while it can find the matching open box under the named target** —
resolve or hold, because a marker taken on trust is a `- [x]` spelled with an arrow, and the hand-ticked
version with a paragraph under it explaining that ☑ did not mean "verified" is what WO-3.11 replaced.

**Since WO-2.15 it also refuses, writing nothing at all, when the trackers are wrong about
themselves** — a `**Closes roadmap**` fragment that closes no box, or a `ROADMAP.md` dashboard row
that disagrees with the boxes under its own heading. An open Acceptance line means the *work* is
unfinished and `🔨 IN PROGRESS` is the true thing to write; these two mean the *tracker* is wrong,
and there is no status that makes that true. **`--tick` still never writes `ROADMAP.md`'s progress
dashboard** — that is the roadmap's own maintenance step 3 and stays a hand edit; the run prints the
row it just made stale so the edit is a copy out of the output.

Two flags that write nothing anywhere:

```
node tools/wo-gate.mjs --audit         every **Closes roadmap** fragment against ROADMAP.md's boxes,
                                       every **Owes** pointer against the box it names, every 🚫/⏳
                                       work order against the box it takes out of the count,
                                       `README.md` § The files against the work orders each file
                                       actually holds, and ROADMAP.md's dashboard against its own
                                       box counts
node tools/wo-gate.mjs --self-check    plant every violation this script is supposed to catch, in a
                                       temp copy of plans/, and fail if one stops being caught
```

`--self-check` copies `plans/` to a temp directory, writes two **synthetic** work orders into the copy,
plants seventeen violations against them, runs the script over the copy, and deletes the directory on
both exit paths. *(Thirteen until 2026-08-16; WO-1.21 added four, for the two statuses that mean the
work is not coming and for the § The files index. The counts further down are readings from dated
runs against older copies of the script and stay at the number that was true then.)* Two things about it are load-bearing. **Every plant path — and, since WO-2.44, the
sandbox that holds them — goes through a guard that
refuses anything inside the repository** — WO-2.15 was itself `🔨 IN PROGRESS` while it was being
written, so a plant that escaped would have corrupted a live work order and looked hand-written
afterwards. And **the fixture is synthetic on purpose**: WO-2.15's own acceptance list had to be
re-cut twice because it named real work orders as fixtures and both were spent within the week.
`--against <path>` runs the plants over a *different* copy of the script, which is how each plant is
proved able to fail — `git show 7973a42:tools/wo-gate.mjs` into a temp file and seven of the nine go
red. **A green run is not coverage**, and the run says so in its own output.

**That guard was case-blind until WO-2.44, and it is the one defect the sentence above could not see —
a case-sensitive compare against a case-insensitive filesystem.** `REPO` is derived from
`import.meta.url` and the sandbox from `os.tmpdir()`, and on Windows the two disagree about the *case
of the drive letter*: `c:\dev\planbook` against `C:\dev\planbook\…`. `startsWith` answers **false** for
a path plainly inside the repository, so a guard whose only job is refusing those reported that one was
outside. **Neither side's spelling is stable enough to reason from**: `REPO` was observed answering both
`c:\dev\planbook` and `C:\dev\planbook` on the same machine within one sitting, decided by how node was
launched — so before the fix the guard was correct only by coincidence of spelling, which is the same
thing as not being a guard. **Measured on 2026-08-17 rather than reasoned about, both ways.** With `TMP` and `TEMP`
at `C:\dev\planbook\.guard-probe`, the unfixed script copied the whole of `plans/` in there, planted its
corrupted trackers against the copy, printed `PASS | 17 of 17 plants were caught` and exited **0**; a
`git status --short` polled *while the run was in flight* reads `?? .guard-probe/`, and afterwards reads
clean, because the `finally` deletes the evidence along with the sandbox. That is why the acceptance for
it asserts the *absence* of writes and a throw, and not a pass. The fixed script refuses from
`assertOutsideRepo()` on the sandbox itself — before the copy exists — at either spelling. The fix is
case-folding both sides on win32 only, and it is **duplicated** from `codex-invoke.mjs`'s copy of the
same guard (which hit this first, at WO-2.40) rather than shared with it: no script in `tools/` imports
another. `wo-sweep.mjs` derives `REPO` identically and needs nothing — it writes nowhere, and the only
thing it ever compares against `REPO` is `path.relative()`, which win32 answers case-insensitively.

**Since WO-2.47 that fix is watched from two sides, because until then it was held by a comment.**
`--self-check` asserts the guard *before it makes a sandbox*: `path.join(REPO, '.probe')` is refused,
the same path with the drive letter's case **flipped** is refused on win32, and a path that really is
outside is **not** — three facts, because the first alone passes with the fold deleted and the third is
what tells "the fold is gone" apart from "it throws at everything." It is a **precondition and not an
eighteenth plant**: the seventeen are about tracker rot, the count above and in WO-2.44's acceptance
stays seventeen, and the run says so on its own line. The other side is `wo-sweep.mjs`, which asserts
that **both** copies still fold — this script's and `codex-invoke.mjs`'s, the second of which no
behavioural check anywhere reaches — and it is a text search, so it sees a deletion and not a fold
applied to the wrong side.

**And since WO-2.48 that list of two is itself derived rather than trusted.** "Both copies" was true
by observation and not by construction: the guard was declared exactly twice, in exactly the two
scripts that build a sandbox out of `os.tmpdir()`, with nothing standing behind either fact. So § 15
now scans every `tools/*.mjs` for a top-level `function assertOutsideRepo(` **or** a temp-dir sandbox
and FAILs on any file its two declared lists do not name — in either direction, and on a scan that
matches nothing. The second signal is the one that matters: a scan for the guard's own name cannot
see a script that sandboxes and **forgot** it. That is not hypothetical — `verify-shell.mjs` is such
a script, found on 2026-08-17, and it is carried as a written **exemption** rather than guarded,
because its `mkdtemp()` directory is fresh and unique and the only removal targets that same
directory. The reason is in `EXEMPT` beside the file name, and it is void the moment that removal is
pointed at a path the harness did not itself create. It is **not an eighteenth plant** either — the
seventeen are about tracker rot, and this is a grep in the other file.

**WO-3.11's four plants were proved the same way and then again more narrowly**, because the broad
run proves less than it looks like it does: against `git show 128d6f4:tools/wo-gate.mjs`, eleven of the
thirteen go red — but most of them go red because that script has never heard of `🤖 CLAIMED` and
refuses the tick, which says nothing about whether a pointer plant can see a pointer defect. So each
was also run against a copy of the *current* script with one behaviour mutated, and the interesting
part is what did **not** go red beside it:

| Mutation | Result |
|---|---|
| `resolveRehome()` returns `null` always — the marker is taken on trust | **2 red**: the deleted/reworded plant and the unresolvable-`**Owes**` plant. The resolving plant stays green, which is the point — a resolver that says yes to everything passes it |
| a re-homed line still counts as holding the work order open | **2 red**: the resolving plant, and `next` still hiding the dependent |
| `--release` refuses only `⬜ NOT STARTED` | **1 red**: the release plant, on `✅ DONE` and `🔨 IN PROGRESS` |
| a target box that is already `[x]` resolves anyway | **1 red**: the unresolvable-`**Owes**` plant, on that case alone |
| `**Owes**` and the `→` markers need not agree | **1 red**: same plant, on the orphaned-field case |
| the win32 fold deleted from `assertOutsideRepo()` — WO-2.47, **and the mutation is of the real file, not of a copy** | **0 plants run**: the guard precondition refuses before the sandbox exists, naming `C:\dev\planbook\.probe` as the path it should have refused and printing `0 plants made`. Every plant stays green on the fixed tree, because a precondition is not a plant |

Five mutations, all reverted, none of them touching a plant it was not aimed at. **The sixth row is a
different kind of thing and says so in its own cell.** The guard precondition WO-2.47 added runs in the
**invoking** script rather than in the subject, because the invoking script is the one that makes the
sandbox and writes the plants — so it is the one whose `assertOutsideRepo()` is actually protecting the
repository. `--self-check --against <a copy from before WO-2.44>` therefore **passes** that precondition
while driving the buggy guard, which is correct rather than a hole: the old copy is not holding the pen.
The consequence is that `--against`, the method every other row in this table uses, cannot prove this
one — so it was proved by mutating `tools/wo-gate.mjs` itself, with the md5 taken first and the revert
proved by re-taking it, and the same asymmetry is written at the function in the file. The textual half
of the claim — that **both** copies still fold, this one and `codex-invoke.mjs`'s — is `wo-sweep.mjs`'s
new check, because two files duplicated on purpose cannot assert anything about each other.

**It has a precondition, and since WO-2.16 it states it and checks it first: the trackers must already
be clean.** The copy inherits whatever drift `plans/` is carrying, drift is what `--tick` refuses over,
and a refusal is indistinguishable from a plant that broke — so a dirty tree used to be announced as
two unrelated plants going red, neither of which had done anything wrong. `--audit`'s own two readers
now run over the copy before anything is planted, and a dirty copy stops the run with the drift named
and `0 plants made`. Only what can earn a `HELD` counts: `ROADMAP.md` dashboard drift, and a
`**Closes roadmap**` fragment matching no box. Drift in *this* directory's dashboard does not, because
`--tick` recomputes that table itself. **A plant failure means a plant failed**, and when one does the
subject's own `HELD` and its reason are printed under it rather than clipped off at 160 characters,
which is how the same morning was spent twice.

`codex-invoke.mjs` writes outside the repo (a temp dir for
`--probe`, another for `--self-check`, the dispatch result file for `--brief`/`--out`) and exists because the `codex-resources\`
`PATH` fix was re-derived and re-typed at two call sites inside `work-order-orchestrator.md` — one
file means the fix can only be right or wrong in one place. Full saga in
[`../plans/dispatch-retro.md`](../plans/dispatch-retro.md) § Codex.

**Its cap decides routes, so since WO-2.37 it can be asked before it fires.** `INVOKE_TIMEOUT_MS` is
twenty minutes for a whole dispatch and `spawnSync` **SIGTERMs** the child at it, leaving whatever
the run had already written in the tree — which on a *mutate · run · revert* work order is a
deliberate mutation in `index.html` or `src/`. That kill reports as **exit 3**, on its own, because
exit 2 means *codex never started and the tree is untouched* and a killed dispatch wearing that code
is how a half-applied mutation goes unlooked-for (WO-3.15, 2026-08-14: seven files written, killed at
the cap, reported as "could not be run"). `--budget <minutes>` states the harness time the
Acceptance will need (runtime × runs) and refuses in one line, exit **2**, before anything spawns:
nothing ran, the tree is untouched, and the work order is routed to Claude instead. It buys no time
and raises no cap — the constant is deliberately left where it is, with the reasoning at its
declaration, and [`../plans/work-orders/ROUTING.md`](../plans/work-orders/ROUTING.md) § "Route to
Codex" asks the same multiplication at routing time, which is the half that matters.

**And until WO-2.45 that cap was a promise nothing could keep.** The orchestrator ran this script
from a Bash call it was told to give **600000 ms** — ten minutes against the twenty, and a *ceiling*
rather than a preference, since the tool caps its own `timeout` argument there. So the `--budget`
gate approved up to ten minutes of harness runs on the arithmetic *"10 + 10 fits inside 20"* and
printed it to the router, while the call holding the dispatch died at ten. **Worse than an unguarded
cap: a guard that clears the exact dispatch it exists to refuse.** And when the outer deadline fired
it killed *the script*, not the child — so `runInvoke()` never reached its started-then-killed
branch, the exit-3 diagnosis was never printed, and the caller was left with a bare timeout over a
tree that might be holding a half-applied mutation. Measured both ways before it was changed: with
an outer deadline shorter than the inner cap the run printed **nothing** and ended on `SIGTERM`; left
alone, the same run printed the whole diagnosis and exited 3.

**The fix moves the dispatch out of the call rather than shrinking it to fit** — the two shapes, and
why the shrink was rejected on its arithmetic, are in
[`../plans/verification-tooling.md`](../plans/verification-tooling.md) § "The Codex dispatch is
detached and polled". `--detach` makes every caller-side refusal in the caller's own process, hands
the run to a supervisor that outlives it, and exits **4** — *started, nothing judged, and never 0,
because a launcher exiting 0 is WO-2.20's spawn-reported-as-a-run with a new mechanism under it*.
`--status <record> [--wait <seconds>]` answers the dispatch's own code once it is terminal, **4**
while it is still working, and **3 — `ABANDONED`** for a supervisor that is gone leaving no verdict:
the same fact exit 3 already carries, so it is not a code of its own. Two arms decide that last one —
pid liveness, and elapsed against the record's own cap plus two minutes of grace, because a recycled
pid reads as alive forever. `--wait` is capped at 540 s so one poll fits inside the 600000 ms call
holding it, which is the original defect one level up. The record is
`.claude/dispatch/<WO-ID>-result.dispatch.json`, beside the brief and the result — though **not** in
`wo-gate.mjs`'s "which dispatch files exist" line, which hardcodes `${id}-${name}.md`.

Since the same row, `--budget` compares against **whichever constraint binds this invocation** and
names it: 20 min `INVOKE_TIMEOUT_MS` under `--detach`, 10 min `OUTER_CALL_CEILING_MS` in the
foreground — where the ten-minute reserve alone fills the ceiling, so **no stated budget fits there
at all** and the refusal says to pass `--detach`. That is the arithmetic being done against the
number that was actually killing dispatches, not a new restriction.

**And since WO-2.40 it can prove those two gates still bite.** `--self-check` copies this script to a
temp directory and drives twenty-six cases against **stand-in children** — a sleeping
`process.execPath` for the kill at the cap, a 25 MB writer for the `maxBuffer` overrun, a path that
does not exist for the never-started case — and, since WO-2.45, five **planted dispatch records**,
asserting each one on **both** its exit code and a phrase of its message. *(Seventeen until WO-2.45,
which added nine for the detached path and moved the two `--budget` boundary cases onto the
constraint that binds them; the run takes ~7 s rather than ~2 s now, and most of the difference is
one detached dispatch being watched die at its own cap.)*
Nothing written anywhere near `tools/`, and **no Codex process at all**:
a seam of four `CODEX_INVOKE_SELFCHECK_*` environment variables stands in for the command, the cap
and `codex-resources\`, so the run reads the same on a machine with no runner installed — which is
the machine where the runner is the thing being routed around. The `--budget` gate is deliberately
**outside** that seam, so the boundary it asserts is the one this file ships — since WO-2.45 that is
two boundaries rather than one, 10 fits and 10.1 does not **under `--detach`**, and 10 *and* 0.1 both
refused in the foreground, which is the pair that would have read "fits inside the 20 min cap" before
that row. And the seam is what makes the check safe rather than merely convenient: a subject that
does not read it would resolve the never-started case's nonexistent command to the real `codex.exe`
and dispatch a brief to it, so the run **refuses to drive a single case** against one rather than
planting. A copy from before WO-2.40 lands exactly there.

**Both gates are behaviour nobody sees on a normal run**, which is why they needed this. Delete the
`refuseIfBudgetDoesNotFit()` call and every dispatch in this project still passes; regress the
started-then-killed split and a killed dispatch goes back to reporting exit 2 over work still sitting
in the tree, which *is* the WO-3.15 mislabel. WO-2.37 drove both by hand, once, in a scratchpad, with
`INVOKE_TIMEOUT_MS` **edited in the real file and restored** — on the one file whose own header
explains what an interrupted mutation costs. `--against <path>` is what replaces that method: ten
mutants written into a scratchpad copy, never into `tools/`, each one red on the case aimed at it and
on nothing else.

| Mutation of the copy | Result |
|---|---|
| the `refuseIfBudgetDoesNotFit()` call deleted | **4 red** — both boundaries, the non-numeric budget and the zero |
| that call moved below the spawn | **2 red**, and *why* is the interesting part: the boundary that must not fit still exits 2 with the right words, and goes red because the refusal **created the output directory**. The exit code alone cannot see that move |
| the budget comparison inverted (`<` for `>`) | **1 red** — the boundary that must not fit |
| the started-then-killed branch removed | **2 red** — both kill cases |
| that branch keyed on `error.code === 'ETIMEDOUT'` rather than on `signal` | **1 red** — the `maxBuffer` overrun alone, which is the whole reason there are two kill cases and not one |
| the never-started check moved above it — the WO-3.15 regression itself | **2 red**, reading *"exited 2, expected 3"* and *"the run said 'could not be run', which belongs to a different exit code"* |
| the unrecognized-flag refusal dropped · the `--probe --budget` guard dropped · a zero exit with no output taken as a pass · the brief-not-found check dropped | **1 red each** |

**WO-2.45's nine new cases were proved the same way**, nine more mutants into the scratchpad, and
the first row is the one that matters — it is this row's own regression, and it goes red on exactly
the two cases written for it while every detached case stays green:

| Mutation of the copy | Result |
|---|---|
| `bindingCap()` answers `INVOKE_TIMEOUT_MS` unconditionally — the pre-WO-2.45 arithmetic | **2 red** — both foreground boundaries, and neither `--detach` one |
| `--detach` quietly runs in the foreground | **3 red** — both detached boundaries and the detached kill, that last one on *"the launcher took 4062 ms, which is its own dispatch's whole cap — this did not detach, it waited"*. That clause is why the case times the launcher: the mutant prints a correct exit-3 report, and only the clock can tell it apart from a dispatch that was handed on |
| the supervisor never writes its verdict back into the record | **1 red** — the detached kill, because `--status` answers 4 forever over a dispatch that finished |
| `abandonedReason()` never finds a corpse | **2 red** — both `ABANDONED` arms, and the RUNNING control stays green, which is the point |
| `abandonedReason()` calls everything a corpse | **3 red** — the RUNNING control, the elapsed arm reporting the wrong reason, and the detached kill |
| `--status` prints the record's verdict and exits 0 anyway | **1 red** — the detached kill |
| `--wait` accepts any length | **1 red** — the cap that keeps one poll inside the caller's own call |
| the detached refusal moved below the record write | **2 red** — both detached boundaries |
| the record's `version` stamp written but not read | **1 red** — the record from a version this script does not know |

And the committed **pre-WO-2.45** file, `--against` it: **11 of 26 red**, which is every new and
moved case and nothing else. It does not stop at the precondition — it reads all four seam variables,
so the fixture can drive it — it simply has no `--detach` and no `--status` to drive.

**Who runs it and when: the orchestrator, at step 2b, before the probe.** Decided at WO-2.40 out of
the three candidates that row named. Not `wo-sweep.mjs`, whose own header promises that every check in
it is a text search, and which every dispatch pays for including the ones that never go near Codex.
Not "by hand at the next change to the file", which is
[`../plans/verification-tooling.md`](../plans/verification-tooling.md)'s own argument against an
opt-in guard against rot — nobody passes the flag, and the gates rot behind a green run exactly as
before. Step 2b is the moment the gates are about to be relied on, and the Codex route is the only
one that ever runs this script, so **that single call site covers every occasion the gates matter**:
six seconds against a twenty-minute dispatch — and since WO-2.45 that twenty minutes is a cap the
dispatch actually gets, rather than the ten its caller used to allow. Check the instrument, then take
the reading.

The demo build lands in Phase 8 (WO-8.2), modelled on Roll Call!'s `tools/build-demo.mjs`.

## The rule

**Anything scripted is a `.mjs` file here, run under bare Node, with zero dependencies.**

```
node tools/build-demo.mjs
```

That is the whole invocation. There is no `npm run`, because there is no `package.json` — and
there is not going to be one, not even "just for scripts." A `package.json` is how a bundler
arrives six weeks later; it has been proposed and rejected before (see `CLAUDE.md`, and
`plans/b-hygiene.md` in Roll Call!).

- **`.mjs`, not `.js`.** Without a `package.json` declaring `"type": "module"`, Node reads `.js`
  as CommonJS. The extension is what makes `import` work here — it isn't a style preference.
- **Node's standard library only.** `node:fs`, `node:path`, `node:url`. If a script needs a
  dependency, the script is doing too much.
- **No script may be required to run the app.** Everything in `tools/` builds something
  optional — a demo, a report, a fixture. `index.html` and `src/` are served as they sit on
  disk, and a teacher's laptop never runs Node. `make-icons.mjs` is the shape to copy if a
  future asset needs generating: its **output is committed**, it is run by hand when the
  drawing changes, and no deploy, server, or page load ever invokes it. A script whose output
  has to be regenerated to serve the app is a build step by another name.
- **Exit non-zero on failure and say what failed.** These get run once every few months by
  someone who has forgotten how they work.

## `audio-probe.html` — the one thing here that is not a `.mjs`

It is a page rather than a script because the question it asks can only be asked from inside a
tap on the device itself, and Node cannot make a sound. The rule above is about how scripts get
**run** — no `npm run`, no bash, no `package.json` — and a hand-opened diagnostic page does not
put a crack in it. It still meets every other line: optional, run by a human, gates nothing, and
no deploy, server or page load ever reaches it.

**What it is for.** The overdue-pass alert (WO-2.29) is silent on the teaching iPad, and silence
has two causes a log cannot tell apart — Silent Mode, and an AudioContext that reports `running`
and produces nothing because it was not born in a gesture. The page runs
`playToneSequence()`'s exact note pattern from `src/alert-sound.js` four ways; probe 1 against
probe 2 is the discrimination, and probe 4 (`<audio>` element) separates the audio-session
category from Web Audio proper.

**It has to be served from an origin the service worker does not control.** `sw.js` answers
*every* navigation with the cached shell, whatever path was asked for — the offline clause, and
correct — so both the deployed origin and `serve-https.mjs`'s 8443 hand back the Planbook app
instead of this page on any device that has installed the worker. The 2026-08-14 sitting reached
it on a second port for that reason. **The symptom of getting this wrong is the app opening and
looking fine**, which is why it is written here and in the file's own header rather than left to
be rediscovered: nothing errors, and the tool you came for is simply not the thing on screen.

**It is kept on a condition.** Its first header said "delete when done" and it is still here
because WO-2.29's acceptance line 6 is still 👤 and still failing; `TESTING.md` names probe 1 as
the one-tap answer for the next run. When that line closes, this goes with it — the row above,
this section, and the two references in `TESTING.md`.

## Testing on the iPad — `make-cert.mjs` and `serve-https.mjs`

```
node tools/make-cert.mjs      # once per machine, and again if the LAN address changes
node tools/serve-https.mjs    # every sitting
```

Then open **`http://<address>:8080/`** on the iPad — the setup page — and work down it. The app
itself is on **8443, over HTTPS**.

**Why not the static server `TESTING.md` used for WO-1.2.** A service worker requires a secure
context. `localhost` is specially exempted from that rule; a LAN address is not. So
`http://192.168.50.142:8000` cannot register `sw.js` at all — and the failure does not look like
one, because **Safari's own HTTP cache will re-serve the pages after the Wi-Fi goes off**. The
offline walk passes, the tick goes in, and what was actually proven is that Safari has a cache.
This is the WO-1.2 safe-area miss in a new place: a check that reports green while measuring
nothing. `serve-https.mjs` sends `no-store` on everything for exactly that reason, leaving only
the service worker able to answer. (`no-store` does not affect the precache — Cache Storage is
explicit and ignores `Cache-Control`.)

These do not break the no-script-required rule above. A teacher's tablet loads the deployed site
over ordinary HTTPS; this is scaffolding for testing that on hardware before there is a deploy.

**`certs/` is gitignored, and is the one thing `tools/` writes that is not committed.** It holds
two private keys, one of them a CA root that a machine has been told to trust. Regenerating costs
one command.

### Four things that fail closed and say nothing useful

1. **Installing the root is not trusting it.** iOS puts a newly installed root in a disabled
   state. Settings → General → About → **Certificate Trust Settings**, switch it on. Until that
   toggle is flipped nothing changes, and the symptom is a generic certificate warning that
   looks like the certificate is wrong rather than untrusted.
2. **There is no click-through for a service worker.** Safari will let you past the interstitial
   to *read* a page over an untrusted certificate, and still silently refuse to register a
   worker behind it. The app looks broken, or worse, looks fine until the network goes off.
3. **iOS ignores Common Name entirely**, and needs `IP:` in `subjectAltName` for an
   address-based URL, plus ≤398 days, `serverAuth`, and EC P-256 / RSA-2048 upward.
   `make-cert.mjs` sets all of it; the list is in its header because a hand-rolled replacement
   will get one of them wrong.
4. **A DHCP lease that moved leaves a valid certificate for the wrong host.** Signed, unexpired,
   and refused — reported identically to every other certificate problem. `serve-https.mjs`
   compares the certificate's addresses against the machine's on startup and says so.

And one that is not a certificate problem at all: **Windows Defender prompts on first bind**, and
a dismissed prompt — or a network typed Public — leaves the port open here and invisible from the
tablet. Symptom is "Safari cannot open the page", same as a wrong address. Load the HTTPS URL in
this laptop's browser first; if it works here and not there, it is the firewall.

## `verify-deploy.mjs` — the only check here that reads the deployment

```
node tools/verify-deploy.mjs                          the production origin
node tools/verify-deploy.mjs https://foo.pages.dev     any other one
```

**When to run it: by hand, straight after a deploy** — and again after any change to `_headers`, to
`sw.js`'s `SHELL` list, or to the Cloudflare zone's caching settings, because those are the three
inputs whose effect exists only at the origin. It is the mirror image of `verify-shell.mjs`, which is
run *before* a deploy: that one drives the app on `localhost`, this one reads what the host actually
served and asserts nothing about behaviour at all.

**It exists because WO-8.7's first deploy shipped two faults and every check in this repository was
green through both** — 628 of 628 before and 628 of 628 after the fix, the same number, because
neither fault is in the repository. `sw.js` precached `./index.html`, Cloudflare Pages answers that
path with a 308, `cache.addAll` followed it, and Safari then refused to serve the stored response to
a navigation: a white screen on the home-screen icon (WO-1.14). And `_headers` pinned
`Cache-Control: no-cache` on `/sw.js`, spelled correctly, and did not bind — the zone's own
four-hour Browser Cache TTL rewrote it to `max-age=14400`. One is the host's routing and one is a
setting in a dashboard. **What found both was a single HTTP request against the live origin.**

Twelve checks, in five blocks: the shell document (200, HTML, `no-cache`), `/sw.js` (200,
JavaScript, `no-cache`), the precache list read **out of the deployed worker** and walked entry by
entry, the deployed `CACHE` string against the working tree's, and the four paths that would carry
server-side code. Every request is printed with its status, content type, `Cache-Control` and byte
count, so a run is evidence a human can read rather than a row of ticks.

**Three things in it look like oversights and are the work order.** The `SHELL` list is read out of
the **deployed** `sw.js` and never the local one — sourcing both sides from the working tree
compares a file with itself and passes forever, including against a deploy that never landed. Every
request is `redirect: 'manual'`, because `fetch` follows redirects by default and a followed 308 is
indistinguishable from a 200: measured on the live origin, `/index.html` reads `308 → /` with the
flag and `200` without it, which is exactly how the defect stayed invisible. And **there is no
retry**: a flaky answer is information, and a loop that hides one turns this into the confident pass
over nothing that `plans/dispatch-retro.md` keeps naming as worse than no check at all.

**An unreachable origin is not a red check.** This is the first thing in `tools/` that needs a
network, so a transport failure at any point — DNS, TLS, refused, timed out, or a socket dropped
half way through the walk — stops the run under a `COULD NOT REACH THE ORIGIN` banner, adds no
check, prints no summary, and exits **2** rather than 1. A network error reported as a failed
assertion says the deployment is broken when what is broken is the hotel wifi, and it spends the
credibility of the next red run. Exit codes: **0** all green, **1** a check failed, **2** could not
reach.

**Two things the host does that the checks are shaped around, both measured 2026-08-12.** This
deployment answers *any* unknown path with the shell document at **200 `text/html`** —
`/nope-does-not-exist` comes back byte-identical to `/` — so a status alone cannot see a file that
was never deployed, and the walk asserts that each entry's content type matches what its name
implies. That is also why the `_worker.js` / `_routes.json` / `/functions/` block asks whether those
paths answer **as a script** rather than whether they answer at all. What that block cannot do is
prove no worker is running: a live `_worker.js` intercepts every path including its own. The
repository half of that claim is WO-8.7's, checked in the tree and in the dashboard.

**Every one of the twelve was watched failing against the defect it is named for**, on a throwaway
fixture origin, before this section was written: `/sw.js` answering `max-age=14400` (the zone fault,
1 red), a `SHELL` carrying `./index.html` against a host that 308s it (the WO-1.14 fault, 2 red), a
deployed `CACHE` of `v45` against a working tree at `v46` (1 red), a precached stylesheet answering
the shell document at 200 (1 red), `/_worker.js` answering `application/javascript` (1 red), an
apostrophe inside the deployed `SHELL` array (4 red — the parse floor, and the three walk checks
reported *"not run"* rather than green over an empty list), a `SHELL` entry that exists only in the
deployment and 404s (1 red, which is the proof the list is read off the wire), `/sw.js` served as
HTML (6 red), `/` redirecting (4 red), `/` served as JSON (2 red), and the control fixture green at
12 of 12. Plus the three unreachable shapes — refused, `ENOTFOUND`, and the fixture killed mid-walk,
which stopped at *"nothing was asserted after 7 check(s)"* with **no** red check and exit 2.

**And one finding that is not about the deployment at all: `process.exit()` after a `fetch` aborts
the process on Windows.** Two of five runs on Node v24.16.0 exited `0xC0000409` — bash reports 127 —
with the full, correct output already on the terminal. A tool whose entire product is an exit status
handing back a random one is the worst defect available to it, so the exit code is **set**
(`process.exitCode`) and the process ends naturally; that measured 3 of 3 correct and costs nothing,
since the sockets are unref'd and the run still ends in about half a second. Worth knowing before
anyone "tidies" it back.

**The other scripts here were then looked at rather than left to a someday.** Only two of them can
hold a socket at exit: this one, and `verify-shell.mjs`, whose CDP connection is a global
`WebSocket` — which is undici, the same library. The rest (`wo-sweep.mjs`, `wo-gate.mjs`,
`wo-brief.mjs`, `wo-cost.mjs`) read files and cannot be exposed, so they were left alone rather than
converted on suspicion. `verify-shell.mjs` was converted to `process.exitCode` and measured three
runs before and four after: **exit 0 every time, ~200s each, no abort and no hang.** The
before-runs matter as much as the after-runs — they are why the conversion is not credited with
fixing anything observable, and why it is the *hang* that was being watched for. The hang is the risk
— that file kills a browser, closes a server and removes a profile directory before it ends, and if
any of those ever stops releasing its handle the run will sit there forever instead of exiting. That
would be a teardown bug, not an exit-code bug, and the comment at the bottom of the file says so.
No abort was ever *observed* in `verify-shell.mjs`; the change was made because the exposure is the
same and the cost is nothing, which is a different and weaker claim than the one above it.

**It gates nothing**, like everything else in this directory: no hook, no CI, no schedule, no other
script calls it, and the app ships whether or not it has ever been run. It closes no 👤 line either
— it reads headers, and whether the app *works* on a teacher's iPad is `TESTING.md`'s question.

## `verify-shell.mjs` — and why it is not a test framework

It is one `.mjs` under `tools/`, zero dependencies, run by hand. `CLAUDE.md` and Roll Call!'s
`plans/b-hygiene.md` rule out linters and test frameworks; Roll Call!'s
`design/execution-guide.md` §7 already says to verify by driving the built demo in headless
Edge over CDP. This is that, written down. **`TESTING.md` is still the gate** — nothing here
closes a 👤 item, because no emulator has a thumb or a safe-area inset.

It exists because WO-1.2 shipped `.search-box { min-height: 44px }` around a **19px input**.
The wrapper measured 44px, the input did not, and tapping above the text did nothing. A
stylesheet review calls that line compliant. Measuring it does not.

**It went green at WO-1.3**, 28 of 28. The one check that used to fail by design — the
`viewport-fit=cover` precondition, without which iOS resolves every `env(safe-area-inset-*)` to
`0` and the padding is inert — passes now that WO-1.3 set the meta value. That the run is green
still closes no 👤 item: it drives a page, not an installed app, and it has never seen a service
worker.

**It grows with each work order: 28 at WO-1.3, 54 at WO-1.4, 82 at WO-1.5, 130 at WO-1.6, 162 at
WO-1.7, 164 once the line cap was retired and its two replacement measurements went in, 184 at
WO-1.8, 201 at WO-1.9, 222 at WO-1.11, 224 once WO-1.11's correction round added the fixture that
would have caught its one defect — fifteen of those last are WO-1.11's own, and the rest came
with WO-1.10, whose own figure was never written down here. Still 224 after WO-1.11's *second*
correction round on 2026-08-05, and that flat number is the interesting part: the iPad rejected
one-download-per-year outright, so "Back up all N years" was rebuilt on a hand-written zip
(`src/zip.js`) and six of those fifteen checks were rewritten around the new mechanism —
same claims, same count, different evidence, including a minimal ZIP reader in this harness
because Node has none and this repo will not take a dependency to get one. 231 at WO-1.12, and
those seven are one check repeated after seven class mutations: the home screen's cards are the
tab bar's second view and only the bar redraws itself, so until this work order, dropping one of
`src/shell.js`'s eleven `afterClassChange()` call sites left six of the eight drivable branches
green — three sites were already caught by existing checks, and the eighth (delete, offered only
on archived classes already off the grid) cannot be driven red at all. 260 at WO-2.1, measured on
the shipped tree — twenty-six of those twenty-nine are the attendance section, and the other
three are in the touch block: a home card that stopped being one button and became a container
with two, the marking screen's own coarse-pointer sweep, and the row that must not spill sideways
at 44px a mark. Three of the attendance checks assert an ABSENCE — no `P` anywhere in the
document, no control that commits anything, and focus that must not end up on the body — so each
was proved non-vacuous by mutation before the count went in here: storing `P` instead of deleting
it turns five checks red, repainting the dropped state in the untaken palette turns the
three-state comparison red, and handing the modal the detached opener sends focus to `<body>`.
274 at WO-2.1's rebuild, and the fourteen is a net figure rather than a count of additions: that
work order replaced the one-day marking screen with a six-day registry, so the attendance section
was rewritten rather than extended and three of its old checks had nothing left to ask. Two of the
new ones are worth knowing about. The column window is compared against a list this harness derives
from the CALENDAR in Node — the same "two runtimes, one clock, one answer" posture the local-date
check already used — because a window built from the records that exist would pass any check that
asked the app which dates it had picked, and omitting a forgotten day is the one failure that
screen exists to prevent. And the future-date refusal is the only place in this file that WRITES
through the `window.planbook` seam: there is no control to click, by construction, which is the
claim. Four mutations, all reverted: storing `P` turns seven red, painting an untaken cell in the
taken palette turns the three-state comparison red, dropping the `<= today` clause turns two red,
and dropping the past-column unlock takes tappable-cells-per-row from one to five. 280 at WO-1.13,
and six is a small number for a work order that moved a whole screen because ten checks were
RE-POINTED rather than added: the registry became a view in `<main>`, so everything that used to
open `attendanceModal` now drives `#classView` through a card, a header tab, or one of the two "All
classes" doors. Seven were added and one retired, which is where the net six comes from. The seven:
a card tap swapping what is in `<main>` with "no dialog opened" as its own clause, the way back
through the panel's door, the way back through the header's, a reload coming back to the class
rather than to the grid, the view carrying no dialog semantics at all, the registry carrying no
support data in either presentation mode, and the three states told apart ON A CARD rather than only
in a column head — that last one revived `window.__look`, which had been dead since WO-2.1 and was
still naming a hook that no longer exists. The one retired is the focus-return check: it asserted
that closing the dialog handed focus back to the card that opened it, and there is no dialog and no
close to hand it back from. The two "way back" checks are what stand in its place. Three mutations, all reverted: dropping
`showView` from `selectClass()` turns six red, leaving `role="dialog"` on the view turns one red, and
booting to the grid instead of the saved view turns one red. 282 at WO-1.13's correction, and the two
are the acceptance line that work order failed the first time: the class tab strip is no longer drawn
on the home view at all, so the added pair counts the controls a teacher could tap RIGHT NOW in each
view — visible ones, by `offsetParent`, because both sets live in the DOM at all times and a count of
the markup would report the same number from either screen. Nothing was deleted for it: five checks
in the classes section now take their reading of the strip from the class view, arriving through a
card the way a teacher does, and the year-switch check moved one clause onto the cards while keeping
the term nav as its proof that `refreshClassBar()` ran. Two mutations, both reverted: drawing the
tabs on the home view again turns two red, and blanking the caption that replaced them turns one
red. 299 at WO-2.10, and seventeen is a net figure over a section that was mostly RE-POINTED: a cell
became an object and a tap on a `?` came to mean "present", so nearly every existing attendance
check was reading a shape or a sequence that no longer exists. The reader changed with them —
glyphs come off `.attendance-cell` rather than off the `<td>`, because a `<td>` can now hold the
time caption too and `"T8:14a"` breaks every comparison against a string of letters. Three of the
new ones are worth knowing about: "one tap changes no other cell" reads all twenty-six cells before
and after, because the build this work order replaces would have passed a check that read the tapped
one; "every cell is an object" is asked of the whole document with the object count printed beside
the zero, since an empty document answers it just as happily; and the pre-WO-2.10 restore goes in
through `restoreFromText()` and the real confirm, because that path is the only thing standing
between a teacher and the backup already on her disk. Four mutations, all reverted and tabulated in
`TESTING.md` § WO-2.10. 330 at WO-2.8, and sixteen of those are hall passes — the reload check
among them reads the open pass straight out of IndexedDB rather than asking the app, because that
is the only question a desk can answer about "survives a force-quit". 344 at WO-2.11, and the
fourteen are the pass banner and cancel. Four of them are worth knowing about: the byte-identical
claim is asserted against `JSON.stringify` of the whole log rather than against a count, because
cancel-as-a-zero-minute-return keeps a count honest and is exactly the defect; the cancelled note is
searched for across the **whole serialised document** rather than in the two arrays a check might
think to look in; and the gate — cancelPass() refusing a pass that has already been returned — is
the one thing in this section driven through the seam rather than through a control, because a
finished pass has no card and therefore no button. And the fourth is the desk half of a 👤 line
rather than the line itself: Return and Cancel are measured as different SHAPES (filled against
outline) because "they cannot be confused at speed" is the owner's call, but "they are drawn
identically" is a thing a refactor can do by accident and a computed style can catch. Seven
mutations, all reverted and tabulated in `TESTING.md` § WO-2.11. 359 at WO-2.12, and **ten** of
those are portrait showing today — but the tree WO-2.12 arrived on measures **349**, not the 344
this line recorded at WO-2.11. That figure was five short of what shipped, and the correction is
arithmetic rather than a re-run: `git diff` against the WO-2.11 commit adds exactly ten `check()`
calls and re-points one, so 359 − 10 = 349 is the number the previous tree really had. The footnote
below already describes this happening once; it has now happened twice, both times the same way —
checks added after the count was written down. Three of the ten are worth knowing about. **The
rotation is not simulated**: nothing between the two orientations calls `renderAttendance()`, because
"landscape still draws six, with no reload" is a claim about a media-query listener and a harness
that repainted the screen by hand would go green against a build with no listener in it — which is
precisely what every other section of this file does, and why the defect could exist unnoticed. And
the long-name check in the WO-2.10 note-panel block **changed sides** rather than being deleted: it
used to assert that a long name in portrait wants MORE than the other columns leave (the cap being
load-bearing was the precondition that made the note-panel measurement non-vacuous), and one day
column reverses that arithmetic, so it now asserts the thing WO-2.12 promised in its place — the
name is drawn in full and the ellipsis never engages. The third is the only check in that section
that is nobody's acceptance line: an unlocked past column is module state, a rotation walks straight
past it, and turning the iPad upright with Tuesday unlocked left today's cells read-only under a
banner naming a day that was no longer drawn — so the check drives the ✏ in landscape and reads the
screen after the turn. Five mutations, all reverted and tabulated in `TESTING.md` § WO-2.12.
**361 after the rotation trigger was re-cut the same day**, and the two added checks are the ones the
shipped build would have failed: the owner's iPad turned once, worked, and then stopped answering, so
the section now turns the device **four more times** and asserts a count on each. The other change is
a subtraction — the narrow-laptop-window checks no longer call `renderAttendance()` by hand, because
the repaint hangs off `resize` now as well and a hand render would hide the loss of it a second time.
Everything above about the rotation not being simulated still holds and now covers three signals
rather than one. **366 after the paging anchor**, five checks later the same day: the owner paged back
three windows, turned to portrait and landed on the 4th rather than on today. Four of the five turn
the device; the fifth deliberately does not — a laptop window dragged from six columns to five is the
same defect with the rotation taken out, and it is the only one of the five that catches the window
arithmetic on its own once portrait is pinned to today.** **379 at WO-2.3**, and the thirteen are
days off and pre-drops: twelve at the end of the attendance section, one in the coarse sweep. Four
are worth knowing about. **Every one of the twelve carries `doc.attendance` serialised byte for
byte**, beside whatever else it is asserting — that work order's Traps line is a copy appearing in
that array, and a build that made the copy would pass every *visible* claim in the section: the
columns go grey, the cards say "No school", and the only thing that gives it away is the array being
compared to itself. Proved by mutation, and it is the largest single mutation result in this file so
far — copying the event onto records turns **ten** of the twelve red. **The range is five weekdays of
a six-weekday window and the sixth is dropped by hand first**, which is two precautions in one
fixture: the day outside the range is what stops a covering test that ignored its dates from passing
(mutating `coversDate()` to `return true` turns one red), and it puts a covered column and a dropped
column side by side on one screen, because those are the two quiet greys in this palette and "they
are still two colours" is a claim a refactor breaks by accident (painting covered in the dropped
palette turns one red). **The future pre-drop is asked of the predicate rather than of the screen**,
and that is not a shortcut: the honest question about "a *future* dropped event naming two classes"
is what `stateOf()` answers on that date for all six classes. *(When this was written the registry
also had no column after today, so there was no rendering to read either. Since 2026-08-08 there is —
the punch-list block below reads it.)* And **the snow-day check is arithmetic over
three groups, not two** — taught, dropped-from-its-own-record, and nothing recorded — which is the
precedence rule in full; it was written over two groups first and went red against a correct build,
because a class that dropped today from its own ledger stays `dropped` and does not become
`covered`. Six mutations, all reverted and tabulated in `TESTING.md` § WO-2.3. **One trap re-paid on
the way**: the coarse-sweep check navigates to the home view to reach the days-off door, and the
class tab strip is drawn on the class view only — so leaving the run there made the roster block
below read an empty tab list and fail four checks about panels it never opened. It goes back into a
class through a card before it hands on.

**The punch-list block at the end of that section (2026-08-08) is a different kind of thing, and
worth naming as such: it is what the first iPad sitting sent back after every acceptance line above
had already passed.** Nine checks, plus one in the coarse sweep. Six of them are about the
registry paging FORWARD, which is the hole the sitting found — a day off could be set ahead and not
looked at ahead. The one to keep is *"reading a week that has not happened yet wrote nothing"*: the
change that opened those columns is a rendering change, and the only reason it was safe is that the
refusal to write tomorrow lives in the writer, so the check asserts `doc.attendance` byte-identical
across the whole forward walk exactly as the block above it does. The coarse-sweep one is the other
lesson: **"Days off" spilled through its own border on the iPad with every 44px check green**, because
a `nowrap` button can clear 44px in both directions and still be narrower than its own label — so
that check measures `scrollWidth` against `clientWidth`, which is the defect itself rather than a
proxy for it, and asks it of every button in that header row.

**405 on the tree WO-2.5 arrived on, and 428 when it left** — and the first of those two numbers is
measured rather than carried forward, because the line above stops at 379 + the ten-check punch-list
block and the tree really had 405. That is the footnote below happening a third time; the run was
made before a line of this work order was written, so the twenty-three are a count of additions and
not an arithmetic difference. Twenty-two of them are the keyboard section, which runs on a FINE
pointer and before the coarse sweep on purpose — the keyboard path is the laptop's, and since
2026-08-08 the laptop is the device of record. The twenty-third is in the coarse sweep: the new ⌨
door measured for `scrollWidth` against `clientWidth`, which is the "Days off" spill from the first
iPad sitting asked of the next button of the same shape rather than left to be rediscovered.

Five of the twenty-two are worth knowing about. **The walk dispatches exactly one ArrowDown and
then one letter per student and nothing else** — no arrow between the letters — because a check that
pressed ↓ to move on would go green against a build where a letter marked but did not advance, and
that build passes the acceptance line and still fails the term. **Two of the three "this keystroke
writes nothing" checks were VACUOUS when first written**, and were caught by the mutation runs
rather than by review: setMark() refuses a no-op, so a letter that happens to match the mark already
on the cell leaves `doc.attendance` byte-identical whether the guard is there or not — they now read
the cell first and press a letter that would change it. **The focus check asks the element
`:focus-visible` rather than reading the rule off the stylesheet**, because the global rule being
present and the ring being drawn are two different facts and it is the second one acceptance line 3
is about. And **Enter-on-a-cell is a check of its own**, because the keyboard walk re-focuses through
selectStudent() and would paper over the loss: removing paintColumn()'s hand-off to the replacement
cell leaves every other check green and only that one red. And the fifth is the only one in the
section that is not about the keyboard at all: **the screen-reader deliverable was already met by
WO-2.1 and had nothing watching it**, so the check asks the whole class view what that deliverable
asks — every button has an accessible name, and every button whose visible text is one glyph carries
both an `aria-label` and a `title`. 150 buttons, 55 of them one glyph. Eight mutations, all reverted
and tabulated in `TESTING.md` § WO-2.5.

**449 at WO-3.1**, and twenty-one of the twenty-two is a new section; the twenty-second is a
RE-POINT rather than an addition, which is why the arithmetic reads 428 + 21. The re-pointed one had
asserted that a new class arrives with `categories` EMPTY — true, deliberate, and documented in
`src/classes.js` in a comment naming WO-3.1 as the condition it was waiting for — and now asserts
the starter set and that its weights total 100. Three of the twenty-one are worth knowing about.
**The float-tolerance check was vacuous when first written and was caught by its own mutation
run**: it used 12.5 + 87.5, which sums to exactly 100 in binary, so it went green against a build
where `isBalanced()` compared with `===`; the set it uses now (40.1 + 34.7 + 25.2 = 100.00000000000001)
was found by search, and it is the only check in the section that can tell the tolerance from a
strict equality. **The total is asserted as a SUBSTRING of the sentence a teacher reads** — "95%" —
rather than as a boolean about the banner being amber, because "these weights are invalid" satisfies
every other clause in that check and is precisely what the work order forbids; mutating the copy to
say exactly that turns three red. And **every claim about the total is made twice, once on the
banner in the editor and once on the badge on the class-manager row behind it**, because those are
two renderings of one number drawn by two modules — dropping the repaint chain in `src/shell.js`
leaves the banner right and the row a keystroke behind, which is a defect only a check that reads
both can see. Five mutations, all reverted and tabulated in `TESTING.md` § WO-3.1.

**473 at WO-3.2**, and twenty-four is a count of additions: twenty-two in a new letter-grades section
and two in the coarse sweep. Three of them are worth knowing about. **The mapping is read through the
seam and driven through the fields**, because nothing in this app displays a grade — no engine, no
grid — and that work order forbids building a preview over student data to demonstrate one; so a
boundary is typed into the real `<input>` and `letterFor()` is then asked what it makes of a
percentage, which is the only way to tell a build whose ranges come out of the exported mapping from
one whose panel does its own arithmetic. **No boundary is written down in this file except the ones it
types on purpose** — the seeded scale is compared against what came out of the document, because
90/80/70 belongs in seed data and a harness asserting `93` would be a second copy of a school's
grading policy living in a tool. And the third is a fixture that proved nothing until a mutation said
so, which is the WO-3.1 float-tolerance footnote happening again in a new place: **the check that a
scale is never sorted behind the teacher probed 89.4 and 89.6, and a `letterFor()` mutated to sort
descending answers both of them identically** — reordering an A at 89.5 above an A− at 90 changes
nothing below 90. It went green against the defect it exists for. The probe that catches it is 92,
where the list says A and a sorted list says A−. Four mutations, all reverted and tabulated in
`TESTING.md` § WO-3.2.

**515 at WO-3.3**, and forty-two is a count of additions in one new section: the assignment list, the
three-tab screen switcher, and the two dialogs that write one assignment. Five of them are worth
knowing about. **The trap check is asserted from both ends and only one end has a control.** WO-3.3
forbids a duplicate carrying its source's `categoryId` into another class, so one check reads the copy
the real dialog wrote and asserts it wears the TARGET's category or none; the other plants an
assignment in class B wearing class A's category id — the shape a restore or a hand edit can produce,
which no button can — and asserts it is absent from A's list **and** absent from the count in A's
category-removal confirm. The second is the expensive half: an unguarded count is what a teacher agrees
to destroy. **The always-opens-on-Attendance line is driven the way the work order asks for it and not
the way a desk would reach for.** It leaves one class on Assignments, opens a second, and comes back,
because a per-class memory is invisible until the second class; then it does the same thing across a
reload and asserts `planbook_openView` never held anything but `class`, which is the cross-reload form
of the same defect. **The coverage bar needed a roster and the run does not leave one where it can be
used** — the only class carrying students is the one restored from a pre-WO-3.1 backup, which has
neither terms nor categories and so cannot hold an assignment at all — so this section adds two
students through the real roster form and takes them out again at the end. Deliberately not added to
the class that already has 26: the attendance section asserts that number, and a fixture that quietly
changes another section's arithmetic is worse than no fixture. And **one check is honest about being
unable to demonstrate its line**: WO-3.3's seventh acceptance line says a student's name leaves the
strip when you switch away from their detail, and there is no detail screen in this build to leave —
so what is asserted is the rule's safe direction, that a name set through `setDetailBreadcrumb()` with
no detail open is drawn on neither strip. The line is re-homed to WO-3.7 rather than ticked. And
**the duplicate's fixture had to be built in both directions, which it was not at first.** The check
that says a copy wears the target's own category id "or none" was written against a document in which
no two classes shared a category name, so only the *no match* path was ever taken and a
`matchCategory()` returning `''` unconditionally would have passed the whole section — the verifier
found it by asking what would have to be true of the fixture for the bug to be invisible, and the
answer was the fixture. It now renames the source's category through the real name field to a name no
other class has, drives the dialog against that, then adds a category of that same name to the target
through the real manager and drives it again: the refusal and the match, each asserted, with the
fixture itself asserted before both. Seven mutations, all reverted and tabulated in `TESTING.md`
§ WO-3.3.

**522 at WO-2.17**, and the seven are one new section directly under the assignments one, which is
where that section's own comment had left the registry's term-totals gap "to whoever owns it". Three
things about it are worth knowing. **The three checks that carry the acceptance line were written and
run RED first**, against the unfixed tree — `519 passed · 3 failed` — because this work order asks for
the pre-fix failure in as many words, and a check written after a fix has never demonstrated that it
can fail. **The fixture is two dated terms over records the block plants, three meetings in one window
and five in the other**, so the claim is a number that has to move rather than a repaint that has to
happen: a check that read the term LABEL at the front of the totals line would go green against a
build that redrew that line out of the same stale totals. And **the Traps line is measured with a
sentinel attribute rather than argued from the diff** — `data-wo217-sentinel` on one row of the grid
survives a repaint of the figures and does not survive `renderAttendance()`, which empties tbody, so
the blanket fix this work order forbids turns exactly one check red while leaving the two "the figures
moved" checks green. The totals element is overwritten by hand before every term tap made from a
screen that is *not* the registry, which is how "a screen that does not read the term is not
repainted" is asserted as text still sitting there afterwards. Two mutations, both reverted and
tabulated in `TESTING.md` § WO-2.17.

**537 at WO-2.18**, and only two of the fifteen are that work order's: the tree it arrived on
measured **535**, because WO-3.4's thirteen grade-engine checks landed without reaching this line.
Measured on the tree, not carried forward — which is the footnote below happening for the third time,
and the reason it is worth thirty seconds is that the arithmetic 522 + 2 would have read as a green
run of 524 for as long as anyone believed this line. **Both of the two hang off WO-2.17's fixture
rather than standing up a second one**, which is what the work order asks for and also what makes the
first of them cheap: the two dated terms, the planted student and the three-meetings-against-five are
already there, and all the check adds is the ⋯ tapped before the term is. **The first is the third
surface `paintRenderedTotals()` paints.** Its header comment names three — the class line, one line
per row, and the open detail panel — and WO-2.17's seven asserted the first two, so a check that
asserts two of three painted surfaces licenses the third to be deleted. It is read out of the DOM,
from the text in `.attendance-detail-totals`, and never from the totals map: a figure recomputed
correctly and never painted is the whole bug, and re-reading the map is how a check goes green
against exactly that. *One correction to that reasoning, found by running the mutation rather than
arguing it: deleting the call turns **two** red, not one — WO-2.13's "a filtered-out row and its open
detail repaint exact term/year totals after a mark" was already watching that same line from the MARK
path. So the harness was not blind to the deletion; it was blind to it on the term-switch path, which
is the one WO-2.17 shipped and the one where nothing else would have moved the figures back.* **The
second drives `selectTerm()` with a term id borrowed from another class
in the same document**, which no control can do — the nav only ever draws the open class's terms —
and asserts the absence of all three of its writes: the preference serialised byte for byte, the
nav's own active mark, and the live region, pre-filled with a sentence of the harness's own so that
silence is text still sitting there rather than an empty string that was always empty. It catches the
throw rather than letting it fly, and asserts on that too, because a build whose guard is gone
reaches `term.label` on a term the class does not have and dies **before** it can write a preference
or announce — so the three absence claims would all have been satisfied by a screen that had just
broken. Two mutations, both reverted and tabulated in `TESTING.md` § WO-2.18.

Update this line when you add checks — a stale count here reads as "the harness has not been touched since
WO-1.3", which is the opposite of true and makes a green run look smaller than it is.

*(This line said 79 for WO-1.5 and the real number was 82: the three checks added with the per-year
backup fix on 2026-08-04 never reached it. Measured, not guessed — `git stash` and a run on the
WO-1.5 tree. A count that is nearly right is the same problem as a stale one, so it is worth the
thirty seconds.)*

**554 at WO-3.5, and the line above stops at 537 — the third miss, and the reason WO-2.19 exists.**
WO-3.5's seventeen are counted in `TESTING.md` § WO-3.5 (*"554 of 554 with zero skips, 17 checks added
in one new section"*) and never reached here, which is WO-3.4's thirteen happening again one work
order later. Measured on `1f5217c` on 2026-08-10, not carried forward: `554 checks · 554 passed ·
0 failed · 0 skipped`, 13,150 lines, 23.7 lines per check, 177s. **That number is still maintained by
hand and there is no honest way to make it otherwise** — it is `results.length` at the end of a
177-second browser run, and the sweep that guards the line below opens no browser by design.

**563 at WO-3.17**, measured the same way: `563 checks · 563 passed · 0 failed · 0 skipped`, 13,558
lines, 24.1 lines per check, 182s. Nine of the ten call sites added are a new section at the foot of
the file — the Assigned and Due fields — and the arithmetic 554 + 10 = 564 does not hold because one
existing check was RE-POINTED rather than added, while the tenth new site is a fixture guard's
failure arm that a green run never reaches. WO-3.3's
*"no date field auto-populates: a new assignment arrives with both dates empty"* asserted the exact
behaviour the owner overruled on 2026-08-10, so it now asserts that both dates arrive on today and
that nothing schedule-shaped fills them, which is the half of that line that never changed. Four
things about the new section are worth knowing.

**It runs at two widths, and the split was forced by an artifact that reads exactly like an app
defect.** Written as one 390px pass, two of its checks failed reporting the values of a dialog that
had never opened: at 390 the page reports `document.documentElement.clientWidth` 390 and
`window.innerWidth` 524, and `95vw` resolves to 370.5px — the layout viewport is 390, the visual one
is 524, and the page is at a scale of about 0.74. `getBoundingClientRect` answers in layout
coordinates and `Input.dispatchMouseEvent` takes visual ones, so a click at the left edge lands and
one aimed at a row control near the right edge misses by about a third of the screen. Changing the
device scale factor from 3 to 2 did not fix it, which is how that suspicion was eliminated. So
everything that clicks a control runs at 1024x768 and only the geometry runs at 390, reached with the
one control at the top of the panel. It is **not** in the numbered trap list below, because that
list's rule is two independent diagnoses and this has one; it is written up at the point in the
harness where it bit, and a check now asserts the two viewports are equal before anything is clicked.

**The fields are measured EMPTY, and after this work order that is a state a teacher reaches only by
clearing a date.** Part two puts today in both dates on creation, so a block that opened a new
assignment and measured what it found would be measuring boxes with values holding them open — while
the owner's screenshots are of empty ones. The section therefore creates an assignment, clears both
dates through the real fields, and measures what is left; the emptiness is asserted **inside** the
same check as the geometry, so a build that stopped clearing cannot quietly turn it into a
measurement of two filled boxes. Proved by mutation: applying the default on OPEN rather than on
creation turns that check red along with three others.

**One check is honest about measuring the mechanism only as far as a laptop can see it.** The iPad
symptom is WebKit painting the native date widget over the box the stylesheet sized; headless
Chromium honours the box already, so it can demonstrate neither the defect nor the fix. What is
asserted instead is that the `appearance` reset is live on both fields as a **computed style** — it
says the declaration reaches the right element, not that iOS obeys it, and it exists so the one line
the whole fix rests on cannot be tidied away without something going red. The 👤 line stays owed.

**And the prose check reads two surfaces rather than the one the work order names.** The bold
promise that had become false was copied in the editor dialog as well as under the list, and a
rewrite that fixed one would have left the dialog contradicting itself an inch from the field.
Reverting only the editor's copy turns that check red with the list hint still correct. Four
mutations, all reverted and tabulated in `TESTING.md` § WO-3.17.

**582 at WO-2.6**, measured the same way: `582 checks · 582 passed · 0 failed · 0 skipped`, 14,038
lines, 24.1 lines per check, 185s. Eighteen call sites added — seventeen in a new section at the foot
of the file for the history dialog, the printed record and the CSV, plus one in the coarse sweep for
the 🖨 door and the student's name, which became a control at this work order. Four things about the
new section are worth knowing.

**The fixture is built so that a second walk over the ledger cannot survive it.** Inside the open
term there are six recorded meetings and, beside them, two records that must appear nowhere: one
carrying an `exception`, and one outside the term's dates. Both are what a hand-rolled filter gets
wrong, and both are why acceptance line 1 is written as *"the two agree"* — a history built from its
own walk would list eight rows over a percentage computed from six and nothing on screen would look
broken. The dates are written down in the harness and compared **as a list**, never counted. Proved:
giving `attendanceHistory()` its own filter with no `stateOf()` in it turns three red, and the
detail line reads `last row "5 of 7 · 71%", badge "67%"` — which is the acceptance line failing in
its own words.

**Acceptance line 4 is asserted in BOTH presentation modes, and the mode-off pass is the one that
matters.** Support data is planted on the student first — a plan, a case manager, an accommodation,
a medical line and a behavior plan, each with a sentinel — and its presence in the serialised
document is asserted before either surface is read, because an absence check over a student with
nothing on file proves nothing. Then the history, the record and the CSV **text** are searched for
every sentinel with the toggle off (support data visible everywhere else in the app) and again with
it on. The search covers `JSON.stringify(classRecord())` as well as the two rendered surfaces, which
is deliberate: the strongest form of this guarantee is that the data never reaches the shape the
surfaces are built from. Proved by the mutation the work order's brief predicts by name — carrying
`supports` onto the record shape and printing it behind the visibility switch turns **three** red,
including *both* mode passes, because the gated build still has the data in hand.

**The CSV is read as text through the seam and never as a downloaded file**, which is `src/backup.js`'s
own build-it/hand-it-over split reused: `recordCsv()` takes a record and returns bytes with no DOM in
it, so the BOM, the CRLF endings, the column order and the quoting are asserted character by
character. A student called `O"Brien, Jr` is in the fixture for one clause alone — a `join(',')` with
no quoting turns that row into two extra columns, silently, in a file the teacher opens weeks later.
Proved: removing the quoting turns two red, on a row that parses to width 1.

**And the section never calls `printRecord()`.** *(True until WO-2.25, which taught it WO-3.7's stub
and drove the real 🖨 Print button — see that block below. Everything else in this paragraph still
holds, including what stays owed to a human with a printer.)* `window.print()` in a headless browser prints
nothing and can block, and no emulator has a sheet of paper, so *"the print view fits a class on a
page"* stays owed to a human with a printer. What is measured instead is the two halves a laptop can
see — the header carries the class, the term, the range and the meeting count, and a term of thirty
meetings comes out as **two** slices of 24 and 6 rather than one table nobody could print (mutating
the slice size to 100 turns one red) — plus the gate: every `@media print` rule touching this surface
is selected under `body[data-attendance-print]`, and `<body>` carries no such attribute at rest, which
is what keeps a Ctrl+P made anywhere else in the app from printing a blank sheet. Six mutations, all
reverted and tabulated in `TESTING.md` § WO-2.6 — and one of the six is tabulated as a **failed
mutation run** rather than as a result, because its edit never applied and the green run it produced
meant nothing until it was re-run.

**591 at WO-2.21**, measured the same way: `591 checks · 591 passed · 0 failed · 0 skipped`, 14,230
lines, 24.1 lines per check, 193s. Nine results out of **three** call sites, and that ratio is the
work order: the sweep now opens every view in `<main>` and measures each one, so two of the three
sites fire once per view. **The nine exist because the old sweep measured one screen and sounded like
it had measured the app** — `.hidden` is `display: none !important`, the sweep skips anything that
computes to `display: none`, and every view but the one on screen is `.hidden`. WO-3.5's ~250 score
inputs went through that gap and this harness reported green over all of them. Three things about it
are worth knowing.

**The views are enumerated from the document and opened through the real navigation, and the second
half of that is the decision.** `<main>`'s element children *are* the view list (src/views.js's
header), so a screen added to `index.html` and not to the harness's `VIEW_PLAN` turns a check red and
names itself rather than being silently unmeasured. Un-hiding each view in turn would have been
cheaper and would have gone **green over the defect that produced this work order**: `#scoresView`
shipped with its only segment disabled, so the view existed and was drawn and no teacher could reach
it — un-hiding measures a beautiful grid there, and clicking the door cannot. A view whose door is
missing or disabled therefore fails by name here instead of being skipped.

**Every view carries its own floor, and the floors are small on purpose.** Zero controls measured and
zero controls undersized are the same green, so each view asserts a count before it asserts a
measurement — 7 · 27 · 5 · 4 on this tree, floors 3 · 20 · 5 · 4. They are that low because of what
the run's document holds by then: the assignments section has deleted every assignment and the class
left open has no roster, so `#assignmentsView` and `#scoresView` are in their empty states and what
is left on them is panel chrome. **That is also why WO-3.5's by-hand block stays**, which is the one
sentence its work order asks for: the general mechanism can reach that screen and cannot reach a
*full* one, and 250 cells is what WO-3.5's acceptance line is about. Proved rather than argued —
deleting that block outright leaves `588 checks · 588 passed`, with `#scoresView` still opened and
measured by the general mechanism at **4 controls** instead of the **259** the block itself prints on
a real run (`measured 259 visible control(s) with the grid open`, 250 of them score cells). What is
no longer duplicated is the measurement itself: one `measureIn()` builds it, and the two skips and
the definition of "a control" are written down once.

**Two mutations, both reverted.** Planting an empty view that is a real class screen (`index.html`,
`src/views.js` and `src/screen-nav.js`, plus its `VIEW_PLAN` entry) turns its two checks red on the
floor — *"0 control(s) measured"* — rather than passing for having nothing to complain about; planting
a second view that the harness has never heard of turns the enumeration check red naming
`wo221UnknownView`. The same run also caught something a desk review would not: the restore that puts
the page back for the sections below depended on the last view opened having a switcher in it, which
an empty one does not. It now goes out to the grid and back in through the class's own card, which is
the route a teacher has when a screen has no door onward.

**674 at WO-2.25**, measured the same way: `674 checks · 674 passed · 0 failed · 0 skipped`, 16,921
lines, 25.1 lines per check, 206s. Thirteen call sites added and one deleted, all literal, none in a
loop and none a fixture-guard arm — so the executed count moves by the same twelve, 662 → 674. The
work order is one module (`src/print-gate.js`) replacing three copies of a print gate, and the
harness half of it is that **all three print surfaces now make the same five readings**, where two of
them made almost none. Three things about it are worth knowing.

**The check that was deleted is the reason the work order exists.** *"and the attribute comes back
off, so the next Ctrl+P is the browser's business again"* asserted that `data-detail-print` was gone
700ms after the tap. It passed on every run and the surface was broken anyway — it measured the
release timer, and the timer was the bug. The grade sheet's equivalent had already gone the same way
at WO-3.9; this is the second and last of them. **What a gate is 700ms after a tap is not what it is
when the browser prints.**

**The attendance section drives `printRecord()` for the first time.** Its header used to say it never
could — `window.print()` blocks in a headless browser — and WO-3.7's answer, stubbing `window.print`
and taking the reading inside the stub, is what it now borrows. Until this work order the only thing
measured about that gate was that `<body>` carried no attribute **at rest**, which is green on a
build that prints the whole app on the second tap of a sitting.

**Four of the thirteen fail on the tree as it stands, and the other nine were watched failing under
mutation instead**, which is the honest version of the acceptance line that asks for all of them.
Thirteen is the denominator and not twelve: twelve is the net after the deleted check, and a check
that no longer exists is not one anybody can watch fail. Against the unfixed
`src/attendance-report.js` and `src/detail.js` — the timer, verbatim, as shipped — the run is `674
checks · 670 passed · 4 failed`, and the four are *"the gate is still on"* and *"a print the browser
refused and the teacher then allowed re-gates itself"* on **both** surfaces. Of the nine that passed
there, four are shaped as absences the buggy build also satisfies — the timer had already cleared the
attribute, so *"`afterprint` clears it"* and *"a Ctrl+P made when the surface is NOT up clears it"*
pass for the wrong reason — and they went red on mutating `src/print-gate.js`'s `afterprint` listener
and `syncAll()`. The other five are not absence-shaped at all: the two one-tap readings and the three
isolation readings, four of them red under a doubled `print()` with the gates shared, the fifth under
`src/attendance-report.js` gating on `data-detail-print`. Four plus four plus four plus one — the
table under `TESTING.md` § WO-2.25 has each mutation, with the failure text.

**677 at WO-2.25's second correction round**, and it is the first section in this file whose subject
is not a screen: `677 checks · 677 passed · 0 failed · 0 skipped`, 17,011 lines, 25.1 lines per check,
214s. **A gate attribute is not a click hook**, asked of all three gates, at the foot of the file after
the WO-3.9 teardown because it depends on no fixture. The owner found the bug it covers on her own
machine the day the work order passed: pressing **Ignore** on Chrome's *"blocked from automatically
printing"* leaves the gate on `<body>` — which is the fix behaving correctly — and the detail screen's
Print button was named `data-detail-print`, the same string as its gate, so `src/shell.js`'s delegated
`closest()` walked up to `<body>` and matched **every click anywhere on screen**. Every click re-opened
the print dialog. The deleted 500ms timer had been hiding it for a year of copies; **the fix that made
the gate self-correcting is what made the collision reachable**, which is why there was no check for it
anywhere in this file. The check sets each gate on `<body>` in turn, clicks three things that are not
controls — `<body>` itself, the header's own box, `<main>` — and counts `window.print()`. On the
unfixed tree it reads `{"body":1,"header.header":1,"main":1}`. **It asks all three surfaces on
purpose:** the other two are safe by luck of naming (`data-attendance-record-print` against
`data-attendance-print`), so a detail-only check would have re-asserted an accident, and the fourth
print surface Phase 4 and Phase 6 want is the one this is really for.

**`verify-shell.mjs` holds 892 `check()` call sites**, and that is the number `tools/wo-sweep.mjs`
asserts on every run — the sentence you are reading is the one it greps for, so rewording it turns the
sweep red rather than turning the check off. Its allowlist is written down at the check: the
definition at `tools/verify-shell.mjs:68` is not a call, the one `else check(` in the file — grep it,
there is exactly one — is why the pattern is not line-anchored, and comment lines are excluded because
the harness quotes call names in its prose constantly. WO-3.12 moved it from 592 to 596, four literal
call sites (case 8's third
direction and cases 13-15) added to the grade-engine block, none inside a loop; WO-2.24 moved it from
596 to 599, three literal call sites in three different sections, likewise none inside a loop; WO-3.7
moved it from 599 to 627, twenty-eight in one new section at the foot of the file, of which one is a
fixture-guard failure arm and one sits inside a two-pass loop, and then to 629 on its correction
round — two more in the same section, both about the page box (see the WO-3.7 block below); WO-1.15
moved it from 629 to 637, eight literal call sites inside the existing `backup & restore` section,
none of them in a loop and none of them a failure arm — its own two-pass presentation-mode loop is in
Node, around one call site that fires once; WO-3.9 moved it from 637 to 659, twenty-two in one new
section at the foot of the file, of which one is a fixture-guard failure arm that never fires on a
green run and one sits inside a two-pass presentation-mode loop that fires twice — so the section
contributes twenty-two executed results to the 636 the tree already ran, and the run prints 658; then
WO-3.9's print-gate fix moved it from 659 to 662, a net three in that same section — one call site
deleted and four added, all literal and none in a loop — and the run prints 661. **The deleted one is
the reason this entry is worth reading.** It asserted that the print gate was off again 700ms after
the tap, it passed on every run, and the surface was broken anyway: it was measuring the release
timer rather than what the browser prints, and the timer was the bug. Two of the four that replaced
it fail on the build that shipped. Then 662 to 663 on the re-test: **a counter the section had
collected since it was written and never asserted**, promoted to a check the day the owner reported
Chrome still showing "blocked from automatically printing" after the fix. One tap calls
`window.print()` once, so the throttle is the browser's policy and not a delegated handler firing
twice — which is the difference between a bug and a browser, and there was no reading that told them
apart until this one. **WO-2.25 moved it from 663 to 675**: thirteen added and one deleted, all
literal and none in a loop — six in the attendance section, which had never driven `printRecord()` at
all; six in the detail section; and one in the grade sheet's, so that each of the three surfaces
asserts on its own that a print carries its own attribute and neither of the other two. The deleted
one is the detail section's *"the attribute comes back off"*, which is the paragraph above happening
a second time on a second surface — same lifted idiom, same timer, same check green over it. **Its
second correction round moved it from 675 to 676**, and that one site is the first this file has added
inside a loop since WO-2.21: one `check()` over the three gate attributes, three results, which is why
the gap below is negative for the first time. **WO-3.6 moved it from 676 to 695**: nineteen literal
call sites in one new section at the foot of the file, none of them inside a loop, of which **two are
fixture-guard failure arms** that never fire on a green run — one for a build with no `[data-past-due]`
host to paint into, one for a fixture that could not be planted — so the section contributes seventeen
executed results. **WO-3.8 moved it from 695 to 713**: eighteen literal call sites in one new section
at the foot of the file, ahead of the print-gate block, none of them inside a loop, of which **two are
fixture-guard failure arms** that never fire on a green run — one for a build with no
`[data-accommodation-prompt]` host, one for a fixture that could not be planted — so the section
contributes sixteen executed results and the run prints 710. **WO-3.19 moved it from 713 to 717**:
four literal call sites, none in a loop and none a failure arm, added *inside* the existing WO-3.6
section rather than in a new one — the tint's third acceptance line is an identity with the past-due
prompt's own set, and two fixtures could only ever have been compared for agreeing with each other.
Its own reading rides on the same `READ` block, which is why the section's other checks are unchanged
and its executed count goes up by exactly four. **WO-2.9 moved it from 717 to 734**: seventeen call
sites, **sixteen of them a new section** at the foot of the hall-pass block — the elapsed clock, the
two overdue alerts and the pass history — none inside a loop and none a failure arm, plus a
`skip()` beside one of them for the run in which no trip in the log carries a note (a `skip` is not
a `check(` and is not in this count). The seventeenth is **one call site inside the existing
two-orientation loop** in the pass-card sweep, so it prints twice: the section contributes eighteen
executed results and the run prints **732**. That loop is where the elapsed figure had to be measured
rather than in the new section — it arrived into a card row whose single-line property was paid for
with two iPad sittings, and the reading beside it is `scrollWidth` against `clientWidth`, which is the
"Days off" spill asked of the element that grew. **WO-2.26 moved it from 734 to 748**: fourteen call
sites, none inside a loop and none a failure arm, added *inside* that same hall-pass section rather
than in a new one — the join between the pass log and the Student Report screen is only checkable
against a log that already has trips in it, and this section spends forty checks filling one. A block
of its own beside WO-2.6's would have had to plant the fixture it then read back. So the run prints
**746**, and the section's own reader (`reportPasses()`) is a second reader beside `readHistory()`
rather than a change to it: they read two different dialogs, and `detailCard()` beside them reads a
screen rather than either. **The number went 734 → 742 → 748 inside one day, and the middle figure is
the part worth reading.** That was the work order's first cut, aimed at a 🚪 Every trip door on the
attendance history dialog; the owner re-cut the work order the same day against the running build and
the door was deleted, so those eight checks were asserting a control that no longer exists. They were
not re-run — a green harness against the wrong target is not evidence — and the crash they left
behind is why this entry is here at all: the first check clicked the deleted door, `clickSel` threw,
and **the run died before WO-2.3 and everything under it**, with no summary printed. A failing check
is a red line in a report; a `clickSel` on a hook that has gone is the whole rest of the file not
running. The replacement asks for every door with `has()` before it clicks one, and a fixture that
does not land now FAILS one check and SKIPS the rest by name. *(One check outside this section moved
with it and is not in the count: WO-2.6's "every print rule is gated" now sorts rules by WHICH
surface's attribute gates them, because `src/attendance.css` grew a second arm under
`data-detail-print` for the trip table WO-2.26 draws onto the Student Report card. Ungated is still a
failure; the borrowed arm is counted so that losing it goes red rather than reading as a tidier
stylesheet.)* **WO-2.27 moved it from 748 to 750**: two call sites, neither in a loop and neither a
failure arm, and they sit in two different sections because they answer two different work orders'
gaps — one in the hall-pass block, driving the early-return path out of `paintPassBanner()` and
watching the elapsed interval through wrappers on `setInterval`/`clearInterval`, and one inside
WO-3.7's section, asserting that WO-2.26's hall-pass card is on the Student Report screen when that
screen is reached from `#scoresBody [data-student-detail="…"]` rather than only from the door in the
attendance history dialog. So the run prints **748**. *(That work order also planted a third trip in
WO-2.26's fixture, dated sixty days after `term.end`, which adds no call site and changes what four
existing ones assert: until then every trip in the fixture fell on or before the term's end, so
`passesForStudentInTerm()` reduced to its `from` bound alone passed the whole suite. It now fails
seven of them, 741 of 748, in the copy of the tree that proved it — the count is in `TESTING.md`
beside the work order.)* **WO-2.28 moved it from 750 to 754**: four literal call sites inside the
existing WO-2.9 hall-pass block, none in a loop and none a failure arm — the first drives Scores,
the next two assert the missing-banner-node fixture and its document-driven alert, and the fourth
asserts the state and screen restoration. **The run prints 752** — measured on the delivered tree
rather than derived, `752 checks · 752 passed · 0 failed · 0 skipped`, the gap to 754 being the two
allowlisted non-calls rather than anything that failed to fire. **WO-2.29 moved it from 754 to 758**:
four literal call sites in that same WO-2.9 hall-pass block, none in a loop and none a failure arm —
one reading the two tones the escalation walk's own winds asked for, and three around the header mute
(the switch and its preference, a threshold crossed with the sound off, and the same threshold
crossed again with it back on). **The run prints 756**, measured on the delivered tree:
`756 checks · 756 passed · 0 failed · 0 skipped`, 254s. *(That work order also upgraded an existing
clause rather than adding a site — the missing-node fixture guard's bare `!!beforeMissingNodePass`
now asserts the saved record carries no `alerted` key, which is a precondition for the alert check
below it and deliberately not a new claim.)* **Its correction round moved it from 758 to 759**: one
literal call site beside the tone reading in the same block, not in a loop and not a failure arm, and
it is there because the four before it went green through a device failure — it asserts the
*mechanism* the corrected iOS unlock turns on (one AudioContext for the life of the page, born in a
gesture, still open, carrying both tones) rather than the audio path, which reports the same numbers
whether or not a sound leaves the device. **The run prints 757**, measured on the corrected tree:
`757 checks · 757 passed · 0 failed · 0 skipped`, 243s. **WO-3.15 moved it from 759 to 760**: its
first round added one literal behavior check inside the existing WO-3.5 score-grid block and
inadvertently deleted WO-3.14's standalone precision check while folding those assertions into the
case-1 check. The correction restores that pre-existing call site under its original name, including
the `docs/grade-math-cases.md` reference, and removes the folded assertions, so WO-3.15's final
inventory is one added and none deleted. **The run prints 758**, measured on the corrected tree:
`758 checks · 758 passed · 0 failed · 0 skipped`, 252s. **WO-3.16 moved it from 760 to 763**: three
literal call sites, none in a loop and none a failure arm, added at the FOOT of that same WO-3.5
score-grid block — the horizontal pair needs twenty-five rows and ten drawn columns to move across,
and a second fixture would have been this one retyped. They go last in the section on purpose: the
third of them types a correction into a cell in order to press `←` inside it, and every arithmetic
claim above it is made against case 1's row. **The run prints 761**, measured on the delivered tree:
`761 checks · 761 passed · 0 failed · 0 skipped`, 253s. **Its correction round moved it from 763 to
764**: one literal call site in that same block, not in a loop and not a failure arm, pressing the
RIGHT edge — the three checks it joins walked left to the clamp and never right, so *"that is the
last assignment"*, which the work order's Deliverables name by hand, lived only as the `step > 0`
arm of a ternary that no keystroke reached. The correction itself was two visible strings in
`index.html` that described `←` backwards; the check is here because the string the strings got
wrong was one nothing asserted. **The run prints 762**, measured on the corrected tree:
`762 checks · 762 passed · 0 failed · 0 skipped`, 246s. **WO-1.17 moved it from 764 to 769**: five
literal call sites in a new block at the foot of the existing `backup & restore` section, none of them
inside a loop, of which **one is a fixture-guard failure arm** that never fires on a green run — it
reports a fixture that threw rather than letting it end the run, which is the WO-2.26 shape two
paragraphs up. So the block contributes four executed results and **the run prints 766**, measured on
the delivered tree: `766 checks · 766 passed · 0 failed · 0 skipped`, 246s. *(Those four were run
against the unfixed `hasSomethingToLose()` first, on the same tree, and two of them are red there:
`766 checks · 764 passed · 2 failed`. A check that would have passed against the build the work order
replaces is not evidence, and for a defect this well masked — a score cell cannot exist without an
assignment, and the assignment is what the old enumeration saw — it is the only way to tell the two
builds apart.)* **WO-8.10 moved it from 769 to 781**: twelve literal call sites in a new section at
the very foot of the file, none inside a loop and none a failure arm, so the section contributes
twelve executed results and **the run prints 778**, measured on the delivered tree:
`778 checks · 778 passed · 0 failed · 0 skipped`, 20,570 lines, 26.4 lines per check, 254s. The gap
below does not move. **It is the first block in this file that reads a service worker's work**, and
the sentence at the head of this section — *"it drives a page, not an installed app, and it has
never seen a service worker"* — is still true as written: nothing installs an app, inspects a
registration or asserts anything about `fetch` interception. What the block reads is Cache Storage,
which is a window API like `localStorage`, and which the worker happens to be the only writer of.
That it works at all was measured before it was relied on — `http://127.0.0.1:<port>` is a secure
context, so `sw.js` registers, activates and precaches within about a second and a half of a run's
first navigation, and this block runs three minutes later. **Two of the twelve are worth knowing
about.** The second cache is PLANTED by the harness (`caches.open('planbook-shell-v1')`) and cleared
in a `finally` along with two `window.caches` overrides, because a display that has only ever shown
one name has proved nothing about the case it exists for — and a stray cache would make every later
reading of that line report a broken app. And one clause is STATIC, in Node: no file the browser
loads may contain a versioned cache name, `sw.js` excepted. That is WO-8.10's Traps line as a grep,
and it sits here rather than in `wo-sweep.mjs` because it is half of one claim — nothing types the
name, and the thing that reads it moves when Cache Storage moves. *(The
`else check(` the allowlist names is no longer cited by line in either file. The citation went `:10570`,
then `:10773`, and then stopped moving while the call site kept going — `:10838` before WO-2.24,
`:10941` after, and thousands of lines past that by the time WO-2.39 looked. The number was
illustration rather than something either tool resolves, and it
sat in two files that had to be corrected in step or read as disagreeing — so both name the text now,
and there is exactly one `else check(` in the harness for a grep to find. Noted here so the next reader
who misses the number does not think the allowlist has stopped applying.)* **WO-3.20 moved it from 781
to 783**:
two literal call sites in a new static block beside the precache one near the head of the file,
neither inside a loop and neither a failure arm, so the block contributes two executed results and
**the run prints 780**, measured on the delivered tree: `780 checks · 780 passed · 0 failed · 0
skipped`, 20,624 lines, 26.4 lines per check, 247s. Both read source rather than a page, for the
reason that work order exists: five functions in `src/` were called `shortDate` and returned three
different formats, and **no run of this harness could tell**, because every one of them returns a
correct date. So what is asserted is the NAME — one definition, in `src/date-text.js`, and no module
binding that name to anything else — plus the leaf rule that keeps a shared formatter out of an
import cycle. The alias case (`import { numericDate as shortDate }`) is caught by the binding rather
than by the format, since the format is the part a check cannot judge. **WO-2.30 moved it from 783 to
788**: five literal call sites inside the existing WO-2.9 hall-pass block, none in a loop and none a
failure arm, so the block contributes five executed results and **the run prints 785**, measured on
the delivered tree: `785 checks · 785 passed · 0 failed · 0 skipped`, 20,776 lines, 26.5 lines per
check, 250s. **They are the first checks in this file that archive a class through the manager with a
pass open**, which is the whole reason that work order exists: the defect was not in the banner and
not in `paintPassElapsed()`, it was `getSelectedClassId()` resolving the open class to the first
SURVIVING one — so the clock went on ticking, correctly, over a different room. Nothing was missing
and nothing returned early, and every check in this file was green over it. Two things about the
block are worth knowing. **The second active class is a precondition and it is asserted**: with one
class in the document, archiving it makes `paintPassElapsed()`'s `!cls` guard fire instead, which is
the rare tail of the case and would have proved the opposite. And **the reading that carries it is
the alert, not the tab bar** — "the class is still on the bar" is what the refusal looks like, while
"the student is announced five minutes later" is what it is for. Run against the unfixed
`archiveClass()` on the same tree, two of the five go red — `785 checks · 783 passed · 2 failed` —
and the second one's detail line is the bug in its own words: *the open class is
`c_2b2z71075k`, the pass belongs to `c_b1` and records `alerted = undefined`; the announcement was
"nothing has been announced since this sentinel was written"*. That id is the one the fixture check
named as *"the one archiving would fall to"* one check earlier, which is the misdirection measured
rather than described. **The other three stay green on the unfixed build and are meant to**: the
fixture is the same either way, and the two after it drive a class that the defensive restore arm has
just put back — check 4 reads `archived = true` on both builds, for opposite reasons. A block where
all five went red would be a block asserting one thing five times.

**WO-2.31 moved it from 788 to 791**: three literal call sites inside that same WO-2.9 hall-pass
block, none in a loop and none a failure arm, so the block contributes three executed results and
**the run prints 788**, measured on the delivered tree: `788 checks · 788 passed · 0 failed · 0
skipped`, 21,003 lines, 26.7 lines per check, 258s. **They are the first checks in this file that
drive an alert with neither a `visibilitychange` nor a click in front of it**, and that refusal is
the block rather than a detail of it: every other wind in the section arrives through `wakeUp()`,
which is the path WO-2.29's correction already covered, and a click is a gesture that would recover
the context through the unlock. What is left to drive the tick is `src/attendance.js`'s own
one-second pass clock, polled for. **The interruption is real and it is delivered from outside the
app.** `src/alert-sound.js` describes its context rather than handing it over — deliberately, so
that a harness cannot resume or close the thing it is measuring — so the object is caught where it
is made instead, by a `Proxy` on `window.AudioContext` installed with
`Page.addScriptToEvaluateOnNewDocument` before the first navigation. The module reads the same
global, calls the same constructor and gets back a context it made itself; nothing in `src/` knows
the proxy exists, and the checks assert the two halves hold the SAME object rather than assuming it
— the module's own `interruptions` count has to move when the harness suspends it. **The second leg
reproduces the device's own worst case rather than a convenient one**: on the iPad, `resume()` on an
interrupted context neither resolved nor rejected (`TESTING.md` § WO-2.29, probe 3), so the leg
replaces the instance's `resume()` with a promise that never settles and the context stays down
deterministically instead of for the twenty milliseconds a laptop takes to recover. That is what
makes *"the tone was scheduled onto a context that is not running, and the listener was re-armed"* a
reading rather than a race. **The fixture costs the section nothing**: the student is cancelled back
in rather than returned, so `passes` is byte-identical across the block and the history checks below
read the log they always read — asserted, not assumed.

**WO-2.32 moved it from 791 to 792**: one literal call site, not in a loop and not a failure arm,
added inside that same WO-2.9 hall-pass block, so it contributes one executed result and **the run
prints 789**, measured on the delivered tree: `789 checks · 789 passed · 0 failed · 0 skipped`,
21,033 lines, 26.7 lines per check, 258s. **The one check is a default, and the tap beside it is
why the other nine did not quietly stop measuring.** The owner withdrew the overdue tone on every
device on 2026-08-16 (`TESTING.md` § WO-2.31), so `src/prefs.js` defaults `alertSoundOn` to false
and `src/alert-sound.js` reads it as `=== true`. Left alone, that default would have taken the
seven checks in this block that assert `played: true` and a count of oscillators and turned every
one of them green against `"state":"silenced"` — an absence passing, which is the failure this
whole file is written against. **It was watched happening**: the run before the fixture tap read
`789 checks · 781 passed · 7 failed`, and all seven reported `silenced`. So the fixture asserts the
default first, on a browser that has not been touched, and then taps the speaker on — the machinery
is still shipped, still has to work the moment a teacher turns it on, and is still measured here.
The assertion has to come before the tap for the obvious reason: afterwards there is nothing in this
section that could tell a withdrawn default from a restored one.

**WO-3.22 moved it from 792 to 793**: one literal call site, not in a loop and not a failure arm, in
a new static block beside WO-3.20's near the head of the file, so it contributes one executed result
and **the run prints 790**, measured on the delivered tree: `790 checks · 790 passed · 0 failed · 0
skipped`, 21,115 lines, 26.7 lines per check, 259s. **It is the first check in this file that compares
two documents against each other** — `handleScoreKey()` in `src/scores.js`, which is the authority on
what the score grid answers to, against the ⌨ Keys panel in `index.html`, which is what a teacher
opens to learn it. The `↑ ↓` pair had been bound since WO-3.5 and promised by the hint under the grid,
and the legend did not carry it; nothing compared the two, so nothing could say so. **It is static
because there is no candidate universe to press.** A driven version would have to type every key a
keyboard has at a score cell and watch which were swallowed, and the defect is the key nobody thought
of — so the list of keys to try would be the legend itself, and the check would be comparing the panel
with itself. **Neither direction of the comparison is naive**, and the block says so at length: two
bindings (`Backspace` and `Delete`) share one row, because a teacher has one "clear this" key in mind
whichever her keyboard calls it, so a map from key name to glyph stands between the sides and a bound
key missing from that map is a FAIL rather than a skip — that is the clause that makes the next key
noisy. Coming back the other way, `⇥` is on the legend and deliberately not bound (`src/scores.js` §
WHAT IS DELIBERATELY NOT BOUND: Tab already means "the next assignment" natively), so it is excepted
**by name** rather than by loosening the direction, which leaves the reverse still able to catch a row
left behind by a binding that was removed. **The mutation was run rather than reasoned**, and it is
the pre-WO-3.22 build exactly: delete the `↑ ↓` row from `index.html` and the same tree reads
`790 checks · 789 passed · 1 failed · 0 skipped`, 259s, with the failing line naming the pair —
*"10 key(s) bound by handleScoreKey() … against 7 legend row(s) carrying [↵ ⇥ ← → L M X ⌫]; BOUND AND
NOT ON THE LEGEND: ArrowDown (↓), ArrowUp (↑)"*. Both guards are floors rather than exact counts (at
least eight bound keys, eight glyphs, seven rows), so the mutation goes red on the comparison and not
on a guard, which was checked in that same run.

**Its correction round moved no count and repaired the half of that sentence which was not true.** The
reverse direction shipped computed against `GLYPH_OF` — the map three lines above it, maintained here
in this file — instead of against the keys read out of `handleScoreKey()`. So *"still able to catch a
row left behind by a binding that was removed"* was a statement about the harness's own table, which
never changes when `src/scores.js` does, and the direction could not go red at all. **The verifier
caught it by running the case the sentence describes**, and the correction round ran it again on the
whole harness: delete `if (key === 'ArrowUp')` from `handleScoreKey()` and leave the `↑` row on the
legend, and the shipped check read `stray []` and passed. One identifier is the entire fix —
`bound.some(k => GLYPH_OF[k] === g)` for `Object.keys(GLYPH_OF).some(...)` — and the same mutation now
reads `790 checks · 788 passed · 2 failed · 0 skipped`, 252s, the WO-3.22 line among them naming it:
*"9 key(s) bound by handleScoreKey() … ON THE LEGEND AND NOT BOUND: ↑"*. **The second failure in that
run is the mutation being a real one**, and it is the difference between the two proofs: deleting a
legend row changes no behaviour, so the first mutation moved exactly one check, while deleting a
binding takes `↑` away from the grid and the score-clearing section that presses it goes red too.
Reverted, and `git diff --stat -- src/` is empty. **The lesson is narrower than "check your
conditions": both lists were in scope on that line, both were arrays of key names, and the wrong one
turns a comparison of the app against its own card into a comparison of the harness against itself.**
The forward direction was never affected — it reads `glyphs`, which is the panel — and the four
mutations the verifier had already watched go red (the `↑ ↓`, `L` and `⌫` rows deleted, and a `Home`
binding added) are all still red after the fix, as are both vacuity probes and, staying green,
`⇥`: on the card, deliberately unbound, and excepted by name in either direction. Those seven were
re-run the cheap way rather than at 252s each — this block sliced out of this file by its own text
and executed with `fs.readFile` handed mutated copies in memory, nothing written to the tree — so
they are the real code answering, on inputs the disk never saw. The `ArrowUp` case is the one that
was worth the full run, because it is the one that had been green.

**WO-3.23 moved it from 793 to 798**: five literal call sites, none in a loop and none a failure
arm, added at the foot of the existing WO-3.16 group inside the score-grid section, so the section
contributes five executed results and **the run prints 795**, measured on the delivered tree: `795
checks · 795 passed · 0 failed · 0 skipped`, 21,302 lines, 26.8 lines per check, 263s. **They are
the first checks in this file that hold a modifier down.** `sk()` grew a fifth argument carrying
`Input.dispatchKeyEvent`'s own bitmask — Alt 1, Ctrl 2, Meta 4, Shift 8 — defaulted to 0 so that
every press written before this work order still dispatches a bare key, and `skHeld(mods, dir)` is
the one caller. That is the whole of the evidence rather than a detail of it: the defect WO-3.23
fixes is that only the key NAME crossed `src/shell.js`'s seam into `handleScoreKey()`, so a check
calling `handleScoreKey('ArrowRight', cell)` would have been re-typing the defect and would read
green on the broken build and the fixed one alike. **All five were watched failing**, which is the
one time this file has been able to run its own mutation without mutating anything: they went in
first, on the tree as it stood, and the run read `795 checks · 790 passed · 5 failed · 0 skipped`.

**Three things about the block are worth knowing before it is edited.** It walks back to column
index 1 **with the key and never with a click** — by the time it runs, the WO-3.16 walk has scrolled
the grid to its right-hand end, and at that offset a click at `wo35-a1`'s coordinates lands on the
frozen name column sitting over it. Found the honest way: the first draft clicked, focus went
nowhere, and the run died four checks later against a fixture it had navigated away from. **What the
browser itself does at each caret position was measured before the assertions were written**, on a
bare `<input value="100">` in the same headless build, because two of the five assert that NOTHING
moved and that is only correct if the browser's own answer at a collapsed edge is to do nothing:
`Shift`+`→` at the end of a value has no character to its right to extend over. The selection
growing IS asserted, twice, where the browser really does grow one — over the full selection a
keyboard arrival leaves behind, and on the vertical pair mid-number. And **`Alt`+arrow is not
pressed**, which is the best argument in the block for the work order it belongs to: `Alt`+`←` is
Back, it navigated the page out from under the run, `window.planbook` went undefined and the harness
died three checks later. The difference between that and a teacher losing her place is that the
harness printed a stack trace.

**The Ctrl and Cmd check is green on the pre-WO-3.23 tree**, and it says so at its own comment so
that nobody reads its green as proof of the fix. `src/shell.js`'s keydown listener opens
`if (e.altKey || e.ctrlKey || e.metaKey) return;` **above** the score-cell branch, so those three
modifiers have never reached `handleScoreKey()` at all — only `Shift` was ever the defect, because
`Shift` is deliberately not in that guard (it is how `?` is typed). That was measured rather than
read off the source — a development probe, not a check that survives in this file: a `keydown`
listener on `window` reading `defaultPrevented` after the app's own, where `Ctrl`+`←` and `Cmd`+`←`
over a full selection read **false** and did not change column, while the same press with `Shift`
read **true** and moved one. It is written up in `.claude/dispatch/WO-3.23-result.md`; what stands
here is the behaviour rather than the reading. What the check buys is that the
answer now holds in two places rather than one, so that moving the score branch above that guard —
which a work order wanting `Cmd`+`Z` would do — cannot quietly re-open it.

**WO-3.22's static legend check was re-proved rather than assumed**, because WO-3.23 changed the
signature that check finds by literal string. It still reads `10 key(s) bound by handleScoreKey()
[Enter ArrowDown ArrowUp ArrowRight ArrowLeft Backspace Delete L M X]`, character for character what
it read before, and the mutation was run again on the delivered tree: `if (key === 'ArrowUp')`
deleted from `handleScoreKey()` with `↑` left on the legend.

**WO-3.24 moved it from 798 to 802**: four literal call sites, none in a loop and none a failure
arm, added directly after the WO-3.5 fixture's coarse-pointer block (it reuses that block's already-
open, already-coarse score grid rather than planting a second fixture), so the section contributes
four executed results and **the run prints 799**, measured on the delivered tree: `799 checks · 799
passed · 0 failed · 0 skipped`, 21,410 lines, 26.8 lines per check, 263s. **This is the first check
in this file to open `#scoresKeys` at all** — WO-3.22's own legend check is static text comparison,
never a browser measurement, and nothing before this had clicked the ⌨ Keys button.

**The first draft of the per-row check was vacuous, and only the mutation proved it — reading the
markup again would not have.** `.scores-key` is an unconstrained `inline-flex` chip: nothing gives it
a width or a max-width, so it always grows to fit whatever it holds, `white-space: nowrap` or not. The
literal reading of the work order's own words — `scrollWidth` against `clientWidth` on each row — was
the first thing written, and it compares a row to itself, which can never disagree: a row stretched to
1678px inside a 942px panel measured `1678/1678` and the check stayed green,
`799 checks · 799 passed · 0 failed · 0 skipped`, no different from the untouched tree. **What a row
can actually fail to fit inside is the PANEL, not itself** — the work order's own *Why it exists* says
so in as many words, "pushes through its own border", and that border belongs to `#scoresKeys`, which
`.scores-key` does not have one of. The corrected comparison reads each row's `scrollWidth` against the
panel's available content width (`clientWidth` less its own left/right padding, since flex children
lay out inside the padding edge, not the border edge) — re-run against the same still-mutated tree,
that version read `799 checks · 797 passed · 2 failed · 0 skipped`, naming the mutated row at both
widths and, at 390px only, a second row beside it that nobody had touched.

**That second row was real, not an artifact of the first mutation, and finding it is why this file
took three intermediate runs instead of one.** Reverted to the clean tree (`git checkout --
index.html`, confirmed against `git diff`) and re-run with no artificial row anywhere: `799 checks ·
798 passed · 1 failed · 0 skipped`, the one failure naming `← → across the row, once the caret runs
out of number in that direction` — WO-3.16's row, which WO-3.22 was expressly forbidden to touch —
measuring `470/304` at 390px, the panel's content width at that size. The 2026-08-16 iPad sitting this
work order was booked out of found no spill on either orientation of an actual iPad, and no iPad is
390px wide; the two readings are not in conflict, they are claims about two different widths, and the
work order's own Acceptance line 1 names 390px as one of the two to measure. **The work order's own
words put this in scope** — "rewording the row that spills, the `← →` row from WO-3.16 included" —
and its own words say why it has to be paid rather than left: "a check that lands red with no remedy
in its own scope is a harness left failing." Reworded to `across the row — → end, ← start`, which
keeps `→` paired with the end and `←` with the start — the asymmetry WO-3.16's own comment says any
rewording must keep visible — while measuring 261px against 304 available at 390px and 918 at 1024px.
Re-run on the reworded tree: `799 checks · 799 passed · 0 failed · 0 skipped`, 21,410 lines, 263s,
identical to the delivered-tree figure above because it is the same tree. The comment beside the `↑ ↓`
row, which had named `← →` as "already the longest one here", is corrected rather than left stale:
`↑ ↓`'s own 297px is now the longest row in the panel, with 7px to spare at 390px.

**The container-level `scrollWidth`/`clientWidth` pair on `#scoresKeys` itself is kept in every detail
string as context and is never its own assertion**, exactly as the work order's Traps insist. It is not
inert — `flex-wrap` cannot shrink an item that overflows even alone on its own line, so the widest row
still drives the container's `scrollWidth` past its `clientWidth` in this one failure mode, which is
why the mutated run's container figures (`1690/942` at 1024px, `1690/328` at 390px) already hinted at
trouble before any row was named. What it cannot do is say WHICH row, and a defect built from several
only-moderately-long rows crowding one flex line rather than any single row individually overflowing
would move it without a single per-row check failing — which is the concrete shape of "close to
vacuous" the Traps line means, not "detects nothing ever".

**WO-2.34 moved it from 802 to 803**: one literal call site, not in a loop and not a failure arm, in
a new static block beside WO-3.22's, so it contributes one executed result and **the run prints 800**,
measured on the delivered tree: `800 checks · 800 passed · 0 failed · 0 skipped`, 21,531 lines, 26.9
lines per check, 261s. **It is WO-3.22's sibling on the marking screen and not the same check**, booked
out of that work order's own implementation the same day both sides were read and found in agreement —
there was no missing key to find, only the absent comparison. Four structural facts kept it from being
a copy-paste of the block beside it: the legend nests several `<div>` levels deep, so the row slice
reads a matching `</dl>` rather than the first `</div>`, which is only correct for a flat panel; a
glyph turns up a second time inside one row's own `<dd>` prose, so glyphs are read out of each row's
`<dt>` alone; the modal id is spelled twice in the tree (the attribute in `index.html` and `KEYS_MODAL`
in `src/shell.js`), and this check reads the id's value out of `src/shell.js` rather than typing it a
second time, so either side renamed alone leaves the other unable to find the legend; and the listener
delegates the score grid's entire binding set from inside itself, above the guard this check's slice
starts at, so that set is invisible here on purpose. **Both directions were run rather than reasoned.**
Removing `'D'` from `MARK_KEYS` while its row stays read `800 checks · 796 passed · 4 failed · 0
skipped`, 260s, naming the new check first — *"ON THE LEGEND AND NOT BOUND: D"* — and three more red
downstream, because unlike WO-3.22's `↑` a marking letter is load-bearing: the mutation did not just
untrain a check, it broke a key a teacher actually presses. Reverted and confirmed with `git diff`.
Deleting the Tardy row from `index.html` while `T` stayed in `MARK_KEYS` read `800 checks · 798 passed
· 2 failed · 0 skipped`, 261s, this check naming *"BOUND AND NOT ON THE LEGEND: T (T)"* and a second,
pre-existing check independently noticing the same row gone from the rendered modal. Reverted and
confirmed. Renaming the modal's `id` attribute in `index.html` alone — leaving `src/shell.js`'s
`KEYS_MODAL` unchanged — read `800 checks · 797 passed · 3 failed · 0 skipped`, 262s, this check
reading *"0 legend row(s) carrying []"* and naming all nine keys `BOUND AND NOT ON THE LEGEND` rather
than passing on an empty comparison; reverted and confirmed. Renaming the `MARK_KEYS` identifier itself
was checked against the same slicing and mapping logic run standalone rather than through a fourth full
harness pass — the routing budget was three mutation runs plus the clean one, already spent above — and
read the letters `stray` with zero of them `bound`, the shape the floor is built to catch; the reasoning
is recorded rather than the browser run, and is named as such in `.claude/dispatch/WO-2.34-result.md`.
**`stray` asks `bound`, not `Object.keys(GLYPH_OF)`** — the identical clause and the identical reason
WO-3.22 carries at `:370-376` (`:281-287` when this was written — WO-2.35, WO-2.36 and WO-2.38 all grew the
block above it), copied to a second legend rather than shared with it, for the reasoning
written into the block's own comment: the two legends' shapes differ enough (nesting depth, glyph
source, a second file read for the id, a listener slice bounded by a guard rather than a function's own
braces) that a helper covering both would trade a saved few lines for parameters neither check needs
alone, at the cost of WO-3.22's already-corrected block.

**WO-2.35 moved it from 803 to 805**: two literal call sites, one at the foot of each of the two key
blocks above, neither in a loop nor a failure arm, so they contribute two executed results and **the
run prints 802**, measured on the delivered tree: `802 checks · 802 passed · 0 failed · 0 skipped`,
21,688 lines, 27.0 lines per check, 258s. **802 is a collision, and it will read as a contradiction
to whoever hits it next.** It is the executed count here, and it was the *call-site* count three
entries above — WO-3.24 moved that from 798 to 802 — so this file now names two different quantities
with one number, two work orders apart. The gap paragraph below is what settles it: 805 − 802 = 3,
the same 3 it has been since WO-3.8, because the two sites this row adds are literal, outside any
loop and not failure arms, so both counts moved by two and the gap did not budge. Read a call-site
count and an executed count as the same number and the harness looks like it lost three checks it
never had. **It is a row about what the two blocks could not SEE, and
it exists because a comment claimed a mitigation that was not there.** WO-3.22's block said that a
comparison written any other way "is the honest limit of a static read and the reason the count below
is asserted rather than assumed" — and the second half is false. `bound.length >= 8` is a floor; a key
bound through a `switch` does not lower it, so `bound.length` stays where it was, every key the regex
can still see is still on the legend, and the check goes green over a card that has just lost a row.
The floors catch a regex that stopped matching everything and cannot catch one that misses only the
new thing. That sentence is withdrawn in the file, which is half the row. The other half is a decision
taken off this tree rather than off a list of what JavaScript can do: the read is **widened** to a key
list declared `const NAME = ['…']` and membership-tested in the slice — the form `src/shell.js`'s own
listener already uses for `MARK_KEYS`, now found by shape instead of by that one name, so a SECOND
such list is visible — and the forms it still cannot read are **asserted absent** by one new check per
block. `switch`, `startsWith` and `.includes(` appear nowhere in `src/`, which is exactly what makes
refusing them cheap and reading them a guess. **`e.code` is refused by name and never read**: it is a
different property with different values (`KeyP` where `e.key` is `P`, `Slash` where `?` is), so a
read widened to it would demand a legend row for a key nobody presses, and `.code` is this app's
attendance-mark field besides. **Both new checks were proved by mutation, in one run.** A key list the
pre-WO-2.35 regexes could not see — `const WO235_MUTATION_KEYS = ['S']`, membership-tested below the
class-view guard, no legend row added — took the marking check from 9 bound keys to 10 and named it
(*"BOUND AND UNKNOWN TO THIS CHECK: S"*), while a `switch (key) { case 'F': }` inside
`handleScoreKey()` left that check reading its usual **10 keys and passing** and turned the new
refusal check red instead (*"BOUND IN A FORM THIS READ CANNOT NAME: a `switch` on the key"*). That
pass on line 5 beside the fail on line 6 is the finding itself, on one screen: `802 checks · 800
passed · 2 failed · 0 skipped`, 254s. Reverted, `git diff --stat -- src/` empty. **The regression set
still bites**, both blocks, both directions, in a second run: `'D'` dropped from `MARK_KEYS` with its
row left on the card read *"ON THE LEGEND AND NOT BOUND: D"*, and the `↑ ↓` row deleted from
`#scoresKeys` with both keys still bound read *"BOUND AND NOT ON THE LEGEND: ArrowDown (↓), ArrowUp
(↑)"* — `802 checks · 797 passed · 5 failed · 0 skipped`, 254s, the other three red being the
marking-screen checks that a teacher's `D` really does stop working. Both reverted and confirmed.
**The floors themselves are untouched and stay WO-2.36's row**; the two new checks guard themselves
against a vacuous pass with a slice-length test instead, which is one of the alternatives that row
names.

**WO-2.36 moved it by nothing — 805 call sites before and after, and the run still prints 802.** It
is the rare row that deletes a guard and adds no check: the six hardcoded floor numbers are gone from
both key blocks and **nothing replaced them with another number.** The delivered tree reads `802
checks · 802 passed · 0 failed · 0 skipped`, 21,833 lines, 27.2 lines per check, 263s, with both key
checks reporting the same counts as the pre-work-order baseline measured the same morning (score grid
10 bound against 8 rows, marking screen 9 against 8; that baseline run was `802 · 802 · 0 · 0`, 262s).
**The floors were right about the danger and wrong about the measure.** Empty agrees with everything —
that has not changed — but a hardcoded count also fires on the one edit that is entirely correct.
Retire a key properly, letter out of `MARK_KEYS` and its row off the card, and `bound.length >= 9 &&
glyphs.length >= 9 && rows.length >= 8` objects at 8 and 7 while the two directions it exists to
police are both satisfied. The fix for that red is to edit the number down, and **a number edited
every time it fires has taught its next reader that it is a formality to step over** — which is the
shape the silent pass arrives in. **There was nowhere honest to source a count from, and that was
looked for rather than assumed:** the card's own row count is the thing under test and agrees with
itself at zero the moment the modal id goes missing; `Object.keys(GLYPH_OF)` is a table this harness
maintains, which is the exact mistake `stray` had to be corrected for at WO-3.22; a number parked in
`TESTING.md` is a second hand-maintained copy in a file nothing executes. **So the counts went and
nothing took their place, because the comparison was already doing the work they were credited
with.** A key that drops out of `bound` while its row stands comes back `stray`; a row that goes while
its key is bound comes back `missing`. Every *partial* loss **that reaches `bound` or the card** is
caught by name in one direction or the other — scoped that way because the flat claim is false on the
marking side, which WO-2.36's verification caught before commit: `markKeys` is read file-wide out of
`src/shell.js`, not out of the listener slice, so a `MARK_KEYS` left *declared* while the listener
stops testing it keeps all five letters in `bound` and reads 9 against 8, green, with keyboard marking
dead. That residue belongs to the refusal `check()` beside it and to WO-2.35's question of which
bindings the read can see at all — **the retired floor was equally green on that tree**, so it is a
known limit rather than anything these counts used to cover. The only case left is both sides reading
nothing — which is never a matter of degree, it is
an anchor gone: the panel id, the `</div>`, `KEYS_MODAL`, the id it names in `index.html`, the `<dl>`,
the class-view guard, `MARK_KEYS`, or a regex having matched at all. Each is asserted directly and
prints under `NOTHING TO COMPARE`, one reason per side, most upstream first. **Three mutations, three
full runs, each reverted and confirmed with `git diff` before the next.** `'D'` out of `MARK_KEYS`
*and* its row deleted — the case that was red before this row — read **`PASS … 8 key(s) … against 7
legend row(s)`**, `802 checks · 798 passed · 4 failed · 0 skipped`, 263s, the four red being the
keyboard-marking readings that a teacher's `D` really does stop working and the `?` list that names
five letters. The eight `<span class="scores-key">` rewritten with single quotes — valid HTML,
identical rendering, and the row regex matches nothing — plus the marking modal's `id` renamed in
`index.html` alone: both blocks red at **0 legend rows**, each naming its own anchor, `802 · 798 · 4`,
266s. `MARK_KEYS` renamed at both use sites to `MARKING_LETTERS`, an edit that leaves the app working:
**one failure in the whole run**, `802 · 801 · 1`, 265s — and its counts are 9 and 8, *unchanged from
the green tree*, which is the proof that the old floor never caught this mutation either. What went
red was `unmapped`, whose message told the reader to go and edit `GLYPH_OF` — the wrong file. The
renamed constant is now named on its own line for that reason. **`body.length < 200` is the one number
left in either block**, on a ~1.9 kB slice, and it separates "the anchor moved and this is the empty
string" from "the function is here"; deleting keys cannot come near it, so nobody is ever asked to
edit it. Both blocks were changed separately, in their own words — merging is `Out of scope` and
WO-2.34's reasoning stands.

**WO-2.38 moved it from 805 to 808, and the run from 802 to 824** — three call sites for twenty-two
executed results, which is the largest gap any one row has opened in this file and the reason to read
this entry before the paragraph below. Two of the three sit inside loops: one over a table of
**nineteen** mutation cases, one over **two** retirements. The third is the count that keeps the table
honest. The delivered tree reads `824 checks · 824 passed · 0 failed · 0 skipped`, 22,141 lines, 26.9
lines per check, 261s, exit 0. **What it added is the thing that executes WO-2.36's guard.** That row
replaced six floors with two `vacuity` arrays — nineteen arms between them, each asserting an anchor
found by name — and on a green tree **every one of them is dead code**: `vacuity` is empty, nothing
downstream of it evaluates, and the only thing that had ever run an arm was a hand mutation applied
twice on one afternoon and reverted both times. Rename `panelAt`, tighten a regex until an `else if`
goes unreachable, let an `indexOf` answer `0` where the code tests `< 0`, and nothing goes red while
the run still prints its usual total. So each block's read is now **one function taking the documents'
TEXT rather than their paths** — the ordinary run passes what is on disk, the new section passes
mutated copies in memory — and **no predicate was copied to do it**, because a replica that agrees on
the morning it is written is the second hand-maintained copy WO-2.36 refused for counts. Nothing
writes to the tree: `git diff --stat -- src/ index.html` is empty across the whole row, and a check
that edited `index.html` and reverted would be one crash from leaving the app broken (WO-2.37's
hazard). **Every mutation is asserted to have applied**, which is this section's own anti-vacuity
guard: a `replace()` whose needle has moved is a no-op, the read comes back exactly as the green
tree's, no arm fires, and the case would print `PASS` having proved nothing. **The set is one case per
arm, and that is a check rather than a habit** — the run counts the arms in this file against the cases
written for them, so an arm added without a case goes red on the next run. Proved by doing both halves
of the thing the row is about, on truncated scratch copies of the harness outside the run (deleted
afterwards; `git status` clean): **deleting** the glyph-regex arm from the scores block turned two
checks red — the case naming that anchor (*"NO ARM FIRED, and the guard therefore passed on
emptiness"*) and the arm count (*"18 arm(s) pushed … against 19 case(s)"*) — and **inverting** one
condition, `panelAt < 0` to `panelAt >= 0`, turned **ten** red at once, the real score-grid check
first: *"NOTHING TO COMPARE … index.html has no `id="scoresKeys"`"* on the untouched tree, with the
cases below it reading *"A DIFFERENT ARM FIRED"*. **Where these live is the decision the row was
booked for, and it is written out at the section and in `plans/verification-tooling.md`** § "The check
on `verify-shell.mjs`'s own guard rides the ordinary run": in the file it tests, never a sibling and
never behind an export, riding the ordinary run because it is cheap and writes nothing — a flag would
have made it opt-in, and an opt-in guard against rot is the fault it was built to fix. `wo-gate.mjs`
keeps its flag because it plants files in a temp copy of `plans/`; that is a difference in the subject,
not in taste, and WO-2.40 has the same question to answer about a tool that spawns.

**WO-1.22 moved it from 808 to 825**: seventeen literal call sites in one new section at the foot of
the file — copying a class's terms and categories while its roster, attendance, assignments, scores
and hall passes stay behind — none of them inside a loop, of which **one is a fixture-guard failure
arm** that never fires on a green run, for a build with no `window.planbook.classes` seam to plant the
fixture behind. So the section contributes sixteen executed results and the delivered tree reads
`840 checks · 840 passed · 0 failed · 0 skipped`, 22,698 lines, 27.0 lines per check, 269s, exit 0.

**WO-3.25 moved it from 825 to 835**: ten call sites in one new block inside the WO-3.5 section — what
a score cell will and will not take — of which **three sit inside loops**, over six typed notations,
five pasted ones and three legal prefixes. So the block contributes twenty-two executed results and
**the run prints 861**, measured on the delivered tree: `861 checks · 861 passed · 0 failed · 0
skipped`, 23,109 lines, 26.8 lines per check, 281s, exit 0. It reuses the 25-row fixture already
planted above it and types into three filler columns nothing else in the file reads.

**Two mechanisms arrive in this file with it, and both are worth knowing before the next work order
re-derives them.** A REAL PASTE: `Browser.grantPermissions` for `clipboardReadWrite` on the harness's
own origin — sent without the page session, because it is a browser-level permission — then
`navigator.clipboard.writeText` in the page and a dispatched `Ctrl`+`V`. That produces `beforeinput`
with `inputType: "insertFromPaste"` carrying the text in **`data`** and a null `dataTransfer`, which
is Blink's shape and not the spec's; it was measured rather than read, and `src/shell.js` reads both
places for the iPad's sake. AN UNCANCELABLE EDIT: `Input.imeSetComposition`, which arrives as
`beforeinput` with **`cancelable: false`** — the browser ignores `preventDefault` on it — so the
backstop in `editScore()` can be driven through the real path it exists for rather than through a
scripted event. Both are asserted from a two-listener trace installed in the **capture** phase, which
is load-bearing: `src/shell.js`'s own listeners are on `document` in the bubble phase, so a
bubble-phase probe reads the field only after the backstop has already put it back.

**The first draft of the typed and pasted checks would have passed with the guard deleted, and the
mutation is what said so.** Every clause they carried — the field never holds `e`, the store never
holds 1000, the two agree after every keystroke — is satisfied on a build with **no** `beforeinput`
guard at all, because `editScore()`'s backstop rewrites the field on the very next `input` and a read
taken after the keystroke sees the same reconciled value either way. That is WO-3.24's vacuity
lesson arriving in a second shape: not a row measured against itself, but two mechanisms where only
one is under test. The clause that separates them is the **absence of an `input` event** carrying the
refused text, read off the trace. With `e.preventDefault()` removed from the guard in `src/shell.js`
and everything else untouched, the run read `861 checks · 849 passed · 12 failed · 0 skipped`, 281s:
the six typed cases (each naming `{"ev":"input","value":"1e"}` and its siblings), the five pasted ones
(`{"ev":"input","type":"insertFromPaste","value":"1e3"}`, with the field back at 87 and the store
never wrong), and — the one nobody wrote a clause for — *"and it can be edited down but not
extended"*, where the `9` that the guard refuses landed and stored `12.3456789` again. Reverted, and
`git diff -- src/shell.js` carries no trace of it.

**One earlier red was the harness's own and is worth the sentence.** The block leaves the grid and
re-opens it to prove a pre-existing `12.3456789` renders after a render — and it first did that by
clicking `#classView [data-class-screen="assignments"]`. Every class screen carries its own
`<nav data-screen-nav>` (`index.html`), so while the grid is up **`#classView`'s** strip is
`display: none`, `getBoundingClientRect()` is all zeros, and `clickSel()` clicked 0,0 and re-rendered
nothing: the check read an empty field over a stored 12.3456789 and reported the app as broken. The
selectors are now the strips inside `#scoresView` and `#assignmentsView`, and **the leave and the
return are asserted** rather than assumed, so the same silent no-op cannot pass as a fixture again.

**WO-1.23 moved it from 835 to 869**: thirty-four call sites in two places — thirty-one in a new
section at the foot of the file (the SIS contact import: the six sample rows, the mapping, the
re-import, the guardian match, the two writing rules, the support block left untouched, the four
refusals and the preview) and three in the coarse-pointer sweep beside the paste preview's, where the
new dialog's file input and the native `::file-selector-button` inside it are measured separately.
**Two of the thirty-four are fixture-guard failure arms** that never fire on a green run — one for a
build with no `window.planbook.rosterImport` seam, one for a dialog that opened without a preview row
to measure — so the two blocks contribute thirty-two executed results and **the run prints 893**,
measured on the delivered tree: `893 checks · 893 passed · 0 failed · 0 skipped`, 23,732 lines, 26.6
lines per check, 289s, exit 0. **The mechanism worth knowing is the file input**, and it is
`src/backup.js`'s from WO-1.15 pointed at a second control: a page cannot be handed a `File` by a
script, but `input.files = dt.files` from a `DataTransfer` is what the picker delivers, so everything
from the dispatched `change` inward is the real path — the read, the refusals and the value clear. Two
bounds on that, both written into the section: it cannot prove the BROWSER re-fires `change` for a
file chosen twice (only that the value is cleared, which is what makes it), and it cannot open the
iPad's Files sheet at all. Both stay on the 👤 line.

**WO-2.50 moved it from 869 to 892**: twenty-three call sites in one new section between the
attendance block and the keyboard one, none of them inside a loop, of which **two are fixture-guard
failure arms** that never fire on a green run — one for a document with no class open to plant a
term on, one for a grid with no cell to hang the stale control on — so the section contributes
twenty-one executed results and **the run prints 914**, measured on the delivered tree:
`914 checks · 914 passed · 0 failed · 0 skipped`, 24,466 lines, 26.8 lines per check, 291s, exit 0.
**Every date in the section is derived from today rather than typed**, for the reason `nodeColumns()`
above it is: the fixture is two terms built AROUND the six columns on screen, one ending on the fourth
column back and one starting on the second, which puts an inclusive `end`, an inclusive `start` and a
gap between two named terms inside one window — and a fixture pinned to a literal August would stop
testing the bound the moment the calendar passed it.

**Two things in that section are worth reading before writing another like it.** The first draft made
all nine writer calls in a row and compared `doc.attendance` either side, which is a check that goes
green on the build with the gate and on the build without it: the nine calls UNDO EACH OTHER — setMark
takes the class, unconfirmAll empties it to `U`s, untakeClass then removes a record with nothing real
on it, dropClass writes an exception and undropClass takes it away. Net zero on any date, bound or
not. It was caught by its own control — the same nine calls on an in-term date, which are supposed to
LAND and did not — and the fix is a probe that calls one writer at a time and puts the ledger back
between them. And every control the section reaches for goes through a `clickIf()` rather than
`clickSel()`, because a build with the gate broken does not DRAW the ✏, the term door or the undo:
`clickSel` throws on a missing control, so the first mutation run reported three reds and a stack
trace where the point was to see which of twenty-one claims the mutation breaks. With the tolerant
click it reports eleven.

*(WO-2.50 also changed two things outside its own section, both of them a fixture whose premise the
work order broke rather than a check that was wrong. The WO-2.17 term-nav block planted two terms in
February and March, which left TODAY outside every term of that class — so the registry drew today's
column locked, offered no ⋯, and the block crashed clicking one on a correct app; its late term's end
is derived from the clock now and has to contain today, with a clause in its fixture check saying so.
And the attendance section clears the term dates off every class as its first act, stated there as a
premise the way the 1280px viewport above it is: everything in that section marks, takes and drops on
today, and the classes it inherits carry the "messy dates" fixture — term 1 starting 2026-08-26,
term 2 overlapping it, term 3 blank, term 4 backwards — which are exactly the dates an acceptance line
asks NOT to be repaired and which lock today for the eight days before term 1 begins.)*

**That number is a count of lines, and since WO-2.22 that is a check rather than a premise.** The
sweep pushes one entry per *line* that holds a call, so what it asserts equals the number of calls
only while no line holds two — and a second call appended to a line that already has one is the one
edit that moves nothing: no new line, so the count does not budge, the comparison above passes, and
the sentence above goes quietly wrong. A second clause in the same section now asserts that no
call-site line holds a second occurrence, and names the line when one does —
*"tools/verify-shell.mjs:495 hold(s) more than one `check(`"*, from the mutation that proved it, with
the count clause still green in that same run at the 596 of the day, which is the proof it is not
vacuous: an append adds no line. Counting occurrences into the number itself is the wrong fix, refused:
`check(` also turns up in trailing comments and in the harness's own quoted prose, and the comment
filter excludes whole comment lines rather than trailing ones, so occurrence counting trades a
hypothetical undercount for a plausible overcount and a false red. **A missing `tools/verify-shell.mjs`
or `tools/README.md` is a `FAIL` there too, since WO-2.22** — it printed a `REVIEW` and exited 0 until
then, and a vanished harness is not a decision anybody is being asked to make; it is the one condition
under which every claim that section makes is void.

**Call sites and executed checks are permanently unequal, and the gap is not a list of things somebody
could go and name.** It is 808 − 824 = **−16** on this tree, and WO-2.38 is the whole of that sign:
three call sites, two of them loops — nineteen mutation cases and two retirements — so twenty-two
results came out of three lines, which is the second bullet below arriving in bulk. It was
713 − 710 = **3** when this paragraph was last brought up to date: WO-3.8's eighteen sites include two
fixture-guard failure arms a green run never reaches, which is the first bullet below and moved the
gap by two. It was 695 − 694 = 1 after WO-3.6 (nineteen sites, two arms, seventeen results — that
work order moved the gap by two as well, and this paragraph was not updated for it at the time; the
number below it was `676 − 677` for two work orders and is corrected here). **It was 676 − 677 =
−1 at WO-2.25's second correction round**, and that sign was the point: that round added **one** call
site producing **three** results — a single `check()` inside a loop over the three print gates — so
the executed count had overtaken the call sites for the first time in this file's history. A negative
gap is the second bullet below outrunning the first, and nothing more. It was 675 − 674 = 1 before
that round (WO-2.25's thirteen added and one deleted are
all literal sites outside any loop, so both numbers moved by the same twelve and the gap did not
budge for a sixth work order running; 659 − 658 = 1 at WO-3.9, and 637 − 636 = 1 before it — whose
twenty-two sites produced exactly twenty-two results, by the same coincidence WO-2.6's eighteen did
and for the same two reasons at once: one fixture-guard arm a green run never reaches, and one call
site inside a two-pass presentation-mode loop that fires twice — 629 − 628 = 1 before WO-1.15,
627 − 626 = 1 before WO-3.7's correction round,
599 − 598 = 1 immediately before WO-3.7,
596 − 595 = 1 before WO-2.24 and
592 − 591 = 1 before WO-3.12 — the four sites WO-3.12 added and the three WO-2.24 added each execute
exactly once, WO-3.7's twenty-eight produced exactly twenty-eight results by the same accident
WO-2.6's eighteen did, its correction round's two are two more literal sites outside any loop, and
WO-1.15's eight are eight more of the same — its presentation-mode loop is in the harness's own Node
half rather than around a `check()`, which is why eight sites made eight results — so
the gap itself has not moved in five work orders), it was
589 − 582 = 7 before WO-2.21, and it was
560 − 554 = 6 at WO-2.19; what
follows is the WO-2.19 instrumentation, which has **not** been re-run since, so treat the three
counts in it as the measurement of that tree rather than of this one. **WO-2.21 moved it by six in
one go**, which is the second bullet below arriving in bulk rather than anything new: two of its three
call sites sit inside a loop over the views enumerated from `<main>`, and four views turn two sites
into eight results. A gap of 1 is not a harness that has become tidier; it is two unrelated
quantities that happen to be passing each other. The gap moved by one at WO-3.17,
because that section added one fixture-guard failure arm — the first bullet below is the shape of it.
**It did not move at WO-2.6, and that is a coincidence of both mechanisms below firing at once**: that
section added one fixture-guard arm a green run never reaches AND one call site inside a two-pass loop
that fires twice, so the eighteen sites it added produced exactly eighteen results. Nothing about the
reasoning changed. 560 − 554 = 6 reads like six unreached branches; the work order that
booked this check reasoned its way to *"roughly 541 call sites against 537 executed — four sites that a
run does not reach"* on the same arithmetic, and both numbers are a coincidence of two unrelated
quantities. Measured by instrumenting a throwaway copy of the harness — `new Error().stack` inside
`check()`, executed line numbers diffed against the grep — a green run on this tree fires **532
distinct call sites**, of which **10 fire more than once** (22 extra results, one site 10×), and
**28 never fire at all**. 532 + 22 = 554. The two corrections cancel to 6 by accident.

- **The 28 that never fire are all one shape: the failure arm of a fixture guard.** `if (!plant.ok)
  check('the WO-3.5 fixture is real…', false, plant.why)` — grep the harness for `if (!plant.ok)`, or
  for that check's own name, `the WO-3.5 fixture is real: a class of 25 with case 1's three weighted
  categories` (cited as `tools/verify-shell.mjs:12532` until WO-2.39, by then thousands of lines
  short of it) — and `:4814`, `:6708`, `:10143`, `:12632` and the twenty-three like them, which are
  line numbers on the WO-2.19 tree this instrumentation was run against rather than on this one, per
  the paragraph above, and are not re-resolved here. They exist so that a fixture
  that did not arrive is announced as a red check rather than as a section that quietly did not run,
  which is this file's oldest rule. **A run in which one of them fires is a run in which something is
  wrong**, so "call sites a green run does not reach" is a description of the harness working.
- **The 10 that fire more than once are `check()` inside a loop** — once per viewport, per
  orientation, per note code: `:11557` runs ten times across the note-panel matrix, and `:11269`,
  `:11296`, `:11332` and `:11338` three times each across three window sizes. One call site there is
  ten lines of output, and no grep can see that.

So the sweep asserts the call sites and this paragraph states the executed count beside it, rather
than a check that passes when two different numbers are close. **If you add a check, both numbers
move and neither moves by the same amount**: the sweep will tell you the first one by name, and the
second one comes off the summary line of a run.

**`verify-shell.mjs` does not assert its own summary against this file, and that is a decision rather
than an omission.** WO-2.19's implementer proposed it as the obvious follow-up — eight lines at the
foot of a run, and the executed count is the one number in this system that nothing watches — and
WO-2.22 refused it on two grounds, written down here so the next reader who spots an unguarded number
does not re-propose it. **First, a red `verify-shell.mjs` run means the app is broken.** In week one
of a live term that signal has to stay clean enough to drop everything for, and making it also mean
*"a sentence in a README is stale"* spends the one alarm that must not be second-guessed. **Second,
the hole is already mostly closed, sideways.** §11's own failure text says in as many words to update
the recorded call-site count *and the executed-check count in the paragraph beside it*, from a run
rather than by arithmetic — so every event that makes the executed count stale, a check added or a
check removed, trips the sweep and hands the reader both numbers to go and fix. What is left uncovered
is somebody editing the executed count wrongly while touching no check at all, which is not the
failure that happened three times.

**Nor does the sweep check a SECTION header's count against the checks underneath it, and that is
WO-1.18's answer rather than its omission.** That work order fixed one — the **WO-1.15** block's own
header in `verify-shell.mjs`, which opened *"Seven checks, and the fixture is the whole argument"* over
eight, correct when it was written and stale before its own commit landed. (It reads *"Eight checks…"*
now, and grepping that phrase is how to find it. This sentence cited `tools/verify-shell.mjs:1869`
until WO-2.39 — the line WO-1.18 changed the one word on, right when it was written, and some nine
hundred lines above the header today: the reference outlived what it pointed at by four work orders,
which is the ordinary way one of these dies.) WO-1.18 then asked whether the drift is mechanically
catchable, since §11 already counts `check()` call sites per line. It is, in the sense that a grep can
produce a number; it is not, in the sense that the number would be right.

**Finding the two sentences is the easy half, and an early draft of this note spent its best argument
there.** The worry was decoys: 43 lines in the file mention a number of checks, and only two of them
are headers — the rest are relative references (*"the two checks above"*), scars (*"cost four checks in
the section below it"*), and summary lines quoted out of a run (*"766 checks · 764 passed · 2 failed"*).
But a check has no reason to read those lines. Anchored to the 50 banner lines and the three lines under
each, the candidate set is exactly two, measured 2026-08-15: the WO-1.15 block, and WO-1.17's. Recorded
because it is the measurement most likely to be re-proposed as the obstacle, and it is not one.

**What kills it is that a section has no machine-readable end, and that its header counts meaning
rather than syntax.** The WO-1.15 block is nested inside `backup & restore`, and what terminates it is
a check *named* *"the WO-1.15 fixture is put back byte for byte, so the sections below inherit
nothing"*. Banner to banner — the only boundary a grep has — that stretch contains 19 `check()` call
sites against the 8 the header is about, so the check's first act on the very defect it was written for
would be to demand seven be changed to nineteen. The second header shows the same fault from the other
side: WO-1.17's opens *"FOUR CHECKS AND A FIXTURE GUARD THAT NEVER FIRES ON A GREEN RUN"* over five
call sites and is precisely right, because it is counting what the checks *are* and saying so in its
own text. A call-site comparison scores the one header in the file most careful about its own arithmetic
as the wrong one. Both are the sweep's oldest failure shape, the one its header warns about twice: a
green-looking wrong answer, and a check that cries wolf and is turned off within a month.

**The escape exists and was rejected on cost, which is the honest reason rather than impossibility.**
Give sections a machine-readable end — a closing marker, or a declared count in parseable form — and
the inference problem becomes bookkeeping that works. It is also a convention retrofit across 50 banners
in a file with no build step and no parser, to catch a defect that has occurred once and cost one word
to fix. If that ratio ever changes, this is the design to reach for.

**Emitting a `REVIEW` instead of a `FAIL` was the near miss, and it was refused for what it costs the
channel.** The sweep's two standing REVIEWs are read and dismissed on every run, which is affordable
because there are two of them; a third, permanent, over two comment lines spends that. What is left
uncovered, said out loud so nobody over-trusts it: a section header that miscounts stays something only
a reader catches — the one known instance was found by the WO-1.15 verifier on 2026-08-12 while reading
the section for another reason, and the fix was a word. §11 goes on watching the number that has
actually rotted three times, which is the file's total and not a section's.

**A cross-reference between the two harnesses is a claim, and it can be false.** `wo-sweep.mjs` is
**22 checks** — the newest, WO-2.48's, sits in the same section as the one before it and asks the
question that section could not ask about itself: **who ought to be on the list.** It derives the set
of `tools/*.mjs` carrying either a top-level `function assertOutsideRepo(` or a temp-dir sandbox
(`mkdtemp`, or `mkdirSync` in a file that also reaches for `tmpdir()`), diffs it against the two
declared arrays, and FAILs in **both** directions and on a scan that matches nothing — because the
cheapest way to silence the check below is to delete a file from `COPIES`, which goes green while
removing the coverage. Two lists rather than one: the guarded set, and an `EXEMPT` set whose single
entry is `verify-shell.mjs` with the written reason it does not need a guard (`mkdtemp()` gives a
fresh unique directory and the only removal is of that same directory, so the worst case is a stray
folder rather than the deletion of something that existed first). **A file in neither list FAILs**,
which is what makes adding a fourth script a deliberate act — and the harness is exempt rather than
guarded because a check that raises an alarm should not also perform what the alarm asks; if that
removal is ever pointed at a path the harness did not create, the reason string is where a reader
will look. It narrows the unwatched set and does not close it, which is written out at the check:
a guard under another name, or a sandbox spelled some third way, is invisible to it. WO-2.47's check,
the one it feeds, asserts that both copies of `assertOutsideRepo()` still
case-fold on win32, in `wo-gate.mjs` and in `codex-invoke.mjs`. It lives here because the two copies
are duplicated on purpose and neither can make a claim about the other; it FAILs rather than REVIEWs on
a missing file, a renamed function or a pattern that has stopped matching; and it is **textual**, so
what it catches is the fold being deleted and not a fold applied wrongly — which is written out at the
check itself, because a reader who takes it for behavioural coverage of `codex-invoke.mjs` has taken it
for the one thing nothing in this repository does. It was **20 checks** after WO-1.17, whose own check
reconciles the backup nag's collection list against the
document sketch in `docs/data-model.md` — `hasSomethingToLose()` in `src/backup.js` now carries two
lists, `CONTENT_COLLECTIONS` (each key paired with the counter its documented shape needs) and
`NOT_CONTENT` (every other top-level key with the reason it is not something a teacher would miss),
and between them they must name exactly the sketch's top-level keys. It is the mechanism that half of
that work order asked for: the enumeration used to be a sum of `count()` calls kept in step with the
documentation by remembering, WO-2.8 added two collections that never reached it, and the nag went
silent on a document whose only content was grades or hall passes for six days before a verifier
happened to read the line. **What it catches is the omission; what it cannot catch is a wrong
decision** — an entry parked in `NOT_CONTENT` with a plausible sentence beside it passes, which is
the intended split and is written out at the check. It also asserts the counter against the
documented shape, because `count()` over the `scores` object answers 0 for a full gradebook and
"add `scores` to the sum" is the fix that looks right and changes nothing. The check before it reads
`_headers` directly and requires active `no-cache`
stanzas for `/sw.js`, `/index.html` and `/`, without widening either of the sweep's general file
gates. It proves only what the file asks for; `verify-deploy.mjs` is what proves the header actually
binds on the host. The three checks added at WO-3.2's follow-up exist because this file's sibling
had already written down that they did. The letter-grades section of `verify-shell.mjs` said its
fourth acceptance line — *there is no rounding code anywhere* — "is a grep, made in
`tools/wo-sweep.mjs`", at a point when the sweep had no rounding check of any kind. The line had been
settled by hand once, in the dispatch, and the comment quietly promoted that reading into a standing
guard. Nothing was measuring it, and the next person to propose a "round to nearest whole percent"
option would have been told by two files that something was watching.

The lesson generalises past this one comment: **the two harnesses can only point at each other for
checks that exist, and neither one can see the other's absence.** `verify-shell.mjs` cannot tell that
a grep it defers to was never written, and the sweep does not read the harness's prose. So a sentence
of the form "this is checked over there" is exactly as load-bearing as a check and exactly as
unverified as a comment — write it only after running the thing it names. This is the WO-1.10 CACHE
miss in a new register: not a rule nobody enforced, but a rule the record said was enforced.

**The 22 above is deliberately unguarded, and the asymmetry is the reason §11 was worth building for
the other file and is not worth building for this one.** Nothing greps this sentence the way §11 greps
the harness's count, and it does not need to: the sweep prints its own true figure on the summary line
of every run — `22 checks` on this tree — in about a second, in
front of the only reader who would care, who is by definition already running it. `verify-shell.mjs`'s
count is different in kind, because confirming it costs a three-minute browser run that nobody spends
to settle a sentence in a README, which is exactly how that line went stale three times (WO-1.5,
WO-2.18, WO-3.5). A stale figure here is corrected for free by the next person to run the sweep; a
stale one there survives until somebody instruments a copy of the harness. So when you add a check to
the sweep, **do not increment this number by arithmetic** — run it and copy the summary line, which is
the same instruction §11's own failure text gives about the two numbers it watches.

**Point into the harness by its own words, not by a line number — WO-2.39, and it is the third work
order in a row to pay for this.** Three of this file's `:NNN` pointers into `verify-shell.mjs` were
wrong by 3,522, 3,781 and 3,807 lines as WO-2.39 measured the tree it delivered, and a fourth by 920 —
all four having survived WO-2.35 re-pointing two and WO-2.36 re-pointing six. **A pointer that is off by
three thousand lines does not read as stale; it
reads as a pointer**, and the reader who follows it lands in unrelated code and concludes they have
misread this document. Worse, two of the three re-resolutions done by hand on the way in were *close
enough to look right* — eleven lines above the `check()` a reference named, and the `categories:` line
of a fixture rather than the student the reference was about — so even a careful correction lands the
reader in the neighbourhood instead of on the thing. So: **name the referent in the target file's own
text** — a unique identifier, a check's quoted name, a literal line of code — and let the reader
grep. `else check(` occurs once in 22,000 lines; `doc.students.push(person('wo38-s1', 'Ashdown'`
occurs once.
Those cost a keystroke to follow and cannot rot with an insertion, and they fail *loudly* when the code
they quote is reworded: an empty grep says "this is gone, go and look", where a wrong number says
nothing at all. It is what several comments inside `verify-shell.mjs` already do — the marking-keys
read holds `guardAnchor`, a **string** carrying the line it looks for, and that comment has outlived
every number written near it. **A sweep clause was considered and refused**, because a check can only
assert that the named line exists, and all five references WO-2.39 fixed pointed at lines that do:
the reasoning, and the version of the check that would not be vacuous, are in
[`../plans/verification-tooling.md`](../plans/verification-tooling.md) § "The `:NNN` pointers into the
harness are anchored by text". Where a number is genuinely the subject — a quoted failure message from
a mutation run, a measurement of the tree as it was that day — it stays a number, because it is a
record of a reading and not an instruction to go and look.

**595 at WO-3.12**, measured the same way: `595 checks · 595 passed · 0 failed · 0 skipped`, 14,295
lines, 24.0 lines per check, 194s. Four checks land inside the grade engine block (WO-3.4)'s own
section — case 8's third direction, and cases 13 through 15 — closing the gap that section's own
header named as an explicit follow-up: cases 1-12 are all one class, one term, one student, so an
engine that dropped `classId`, `termId` or `studentId` entirely passed every one of them, and the
only unbalanced-weight fixture used integer weights, which cannot expose the `formatWeight()` bug
WO-3.4's correction round fixed. Four mutations, three of them isolating cleanly and the fourth not,
all reverted and tabulated in `TESTING.md` § WO-3.12.

**The `studentId` mutation is the honest exception, in the WO-2.18 shape.** Dropping the `classId`
and `termId` filters in `assignmentsFor()` (grep `src/grade-engine.js` for
`assignment.classId === classId` — one hit, the first of the two filter lines; cited as
`src/grade-engine.js:35-36` until WO-2.43, 2026-08-17, by then nine lines above them, on the tail of
a comment and `numberOrZero()`) each turned exactly one check red, because the WO-3.5 fixture this
harness already drives is one class and one term — nothing else in that document could spuriously
qualify once either guard came off. Dropping the `studentId` lookup in `scoreCell()` (grep the same
file for `hasOwnProperty.call(byAssignment, studentId)` — one hit; cited as `:41-42` until WO-2.43,
2026-08-17, by then ten lines above it and on `assignmentsFor()`'s own signature, which is the miss
this row was booked for: a pointer landing the reader on the *other* function this sentence names
reads as plausible rather than as broken) is different in kind: it corrupts every student's cell
in ANY multi-student document, and WO-3.5's own 25-student grid is exactly that, so the same mutation
that proves case 15 also reddens four of WO-3.5's own checks — the ones that already ask
`weightedClassGrade()` for one named student's grade on a real, rendered screen. That is not case 15
measuring nothing; the check goes red on the mutation it names. It is that the argument is load-bearing
enough that this harness was already watching it, from a different section, through the real grid
rather than through a hand-built fixture — five red, not one, recorded as five rather than smoothed
into "the proof worked," because a mutation that reddens more than its own check is not the clean
isolation the other three gave and the honest count is worth more than a tidy one.

**598 at WO-2.24**, measured the same way: `598 checks · 598 passed · 0 failed · 0 skipped`, 14,398
lines, 24.1 lines per check, 193s. Three call sites, three results, none of them in a loop — and they
are the first checks in this file to open the term editor, the days-off form and the student editor's
plan panel in order to read a computed *style* off a field rather than to drive it or measure its
box. Each asserts that the one
`input[type="date"]` reset in `src/shell.css`'s BASE section is live as a computed `appearance` on the
date fields that have no copy of that rule of their own: the term editor's *Starts* and *Ends*, the
days-off *From* and *To*, and the plan *Review date*. WO-3.17's pair keep an identical declaration in
`src/assignments.css` on purpose, so they were the only date fields anything here had ever read a
*style* off — which meant the shared rule could be deleted as a duplicate and all 595 checks stayed
green. Three things about them are worth knowing.

**They read a computed style and not a height, and this is where that stopped being an argument.**
The defect the rule fixes is a squat field on iOS, so a height is the obvious thing to measure — and
these fields have in fact been measured for 44px since WO-2.21, when the coarse sweep started opening
these three dialogs; two of those three check messages say *"date fields included"* in as many words.
It makes no difference, because the measurement cannot fail for this: the engine applies an author's
`min-height` to a date input whether or not anything has told WebKit to stop painting the control. On
the deleted-rule run those three sweeps were **green** — `measured 22 · 13 · 18; under = []` — in the
same run where the three checks below went red. `appearance` is the value that moves, `none` with the
rule in the cascade and `auto` without it, so it is what the guard hangs on. Nothing here claims the
field is the right size on glass; that stays a 👤 line in `TESTING.md` § WO-2.23 forever, and the
shared reader prints no box dimensions at all, so that a number in a detail line cannot quietly
become part of the claim.

**Being open is asserted rather than arranged for.** All five of those
fields sit inside `.hidden` dialogs at rest and `getComputedStyle` answers just as happily for a
`display: none` node, so each call carries its caller's own evidence that the surface is up — the
modal's `hidden` class for two of them, and `hidden` false with `aria-expanded` true for the support
panel — plus the element laying out a client rect and matching the expected field count. A selector
that stopped matching is a `FAIL` and never a vacuous `every()` over an empty list. The reader never
touches `.value` either: one of the three fields is the plan review date, and no detail line out of
`tools/` may carry what a teacher typed into it.

**The guard was watched failing before it was written down.** Deleting the rule from `src/shell.css`
and re-running turns exactly these three red and nothing else — `598 checks · 595 passed · 3 failed`,
exit 1, each detail reading `appearance auto, -webkit-appearance auto` and naming the sheet the rule
belongs in. The 595 that stayed green are the reason the work order existed. Tabulated in
`TESTING.md` § WO-2.24; the rule was restored and `git diff -- src/` is empty.

**628 at WO-3.7**, measured the same way: `628 checks · 628 passed · 0 failed · 0 skipped`, 15,480
lines, 24.6 lines per check, 207s — thirty call sites, thirty results, of which twenty-eight landed
on the first pass (`626 checks · 626 passed`, 15,311 lines, 205s) and two on the correction round
below. **The gap did not move — which is the WO-2.6 coincidence happening a second time** rather than
anything new: the section carries one fixture-guard failure arm a green run never reaches (`if
(!plant.ok) check('the WO-3.7 fixture is real…')`) and one call site inside the two-pass
presentation-mode loop that fires twice, so the two corrections cancel exactly. Worth knowing before
the next reader reads a gap of 1 as a harness that has become tidier.

**Two of those twenty-eight could not be made from a stylesheet review, and one of them is why.** The
printed sheet is measured by **stubbing `window.print()` and taking the snapshot inside the stub**,
under `Emulation.setEmulatedMedia: 'print'` — so the reading happens at the instant the app asks to
print, with no race against the 500ms attribute release. It reads **box heights as well as computed
`display`**, and that distinction is load-bearing: the computed display of an element inside a
`display: none` ancestor is its own value, not `none`, so asking the nav strip for its `display`
reports `flex` on a build that is behaving perfectly. What it does not have is a box. The stub also
**reports that it took**, because a `window.print` that was not writable would produce no snapshot at
all and the check would read *"the printed page is missing its header"* over a build whose printed
page is perfect.

**And that guard earned itself on the first correction round.** The Print button reached
`printDetail()` — `{"ok":true,"label":"🖨 Print this page"}` — and `printCalls` was still 0, because
the page threw `Cannot access 'detail' before initialization`: `src/shell.js` imports
`src/detail.js` as `detail`, and a `const detail = e.target.closest(…)` further down the *same*
delegated click listener put the whole arrow body inside that local's temporal dead zone. The two
hooks 100 lines above it threw before they could run. Without the `attrRightAfter` / `printCalls`
fork in the detail line, that reads as a CSS defect in a print block that is correct. The local was
renamed; the module keeps the name.

**And then the print pass was found measuring a width no printer has, which is trap 10 below and the
reason two more checks exist.** Everything above snapshots the sheet at the 1280px the section's own
`setDeviceMetricsOverride` set; `setEmulatedMedia: 'print'` switches the media *type* and relayouts
nothing, so every `max-width` query in the app was still resolving against 1280 while the sheet was
being read. A page box is narrower than that — Letter at `@page { margin: 10mm }` is about 740 CSS px,
landscape Letter about 981, A4 about 718 — and all three fall inside `src/detail.css`'s
`@media (max-width: 1024px)`, which drops the detail screen to one column. It shipped that way: the
gated print block set `gap` on `.detail-cols` and never restated `grid-template-columns`, so the
responsive rule won on paper and the sheet printed as one column under an acceptance line that says
one page. **Twenty-eight green checks said nothing about it**, because 1280 is the one width band in
which the stylesheet still looked like the design. The WO-3.7 verifier found it by rendering to PDF.
The two checks added on the correction round re-drive the real Print button at 740px and (a) assert
the grid still resolves to two tracks side by side **with `matchMedia('(max-width: 1024px)')` asserted
matching**, so a metrics override that silently failed cannot pass the check at 1280 for the wrong
reason, and (b) sweep every `max-width` rule in the app against the elements of the sheet and require
each declared property to be restated by a gated `body[data-detail-print]` rule — the general form of
the same defect. Watched failing before being written down: with the one line reverted the run is
`628 checks · 626 passed · 2 failed`, exit 1, the first reading `grid tracks ["740px"] over 2
column(s), side by side = false` and the second naming
`@media (max-width: 1024px) { .detail-cols { grid-template-columns } } unpinned on div.detail-cols`.
Everything else stayed green in that run, which is the escape restated as a measurement.

**636 at WO-1.15**, measured the same way: `636 checks · 636 passed · 0 failed · 0 skipped`, 15,750
lines, 24.8 lines per check, 206s. Eight call sites, eight results, and **all eight are inside the
existing `backup & restore` section rather than in a new one at the foot of the file** — that work
order said so in as many words, and it is the right call: everything they need is already standing up
there (a document with support data on it, a real backup file of it, the confirm driven through
`restoreFromText()`), and a second section would have rebuilt all of it two hundred lines later. Four
things about them are worth knowing.

**The fixture is the whole argument, and it is built by ADDING to the file rather than by writing a
second document.** `describe()` used to count `classes` and `students` and nothing else, so a term of
marks and an empty test document drew an identical panel — the pair `plans/work-orders/gates.md`
§ "The iPad stays in the rotation" exists to keep apart. A check written against a fixture whose
rosters *also* differed would go green against that build. So the planted document IS the run's own
backup file with a record dropped into it: same class, same two students, by construction rather than
by two lists somebody kept in step, and the first of the eight asserts exactly that before any of the
others reads a number.

**The record is planted straight into IndexedDB, because the surface under test is the disk.** The
compare's outgoing side is `readStoredDocument()` — a raw get that does not open the year and does not
migrate (`src/backup.js`) — so `s.update()` would have been measuring the wrong document. It is lifted
out first and put back byte for byte at the end, the poisoned-year fixture's own shape, and the
put-back is asserted rather than assumed: everything after this section reads that year, and one check
in it compares the record on disk against the file byte for byte in content.

**Three of the five files it feeds through the dialog must produce NO warning, and those three carry
the Traps line.** Replacing a year from its own backup is what backups are for, so an equal file, a
file holding *more* than the device, and a file for a year the device does not hold are each asserted
silent — a red panel on the safe case is one a teacher learns to tap through before she meets the case
that can destroy a term. The two that must warn are a zero-record file (the acceptance line's own
case) and a file holding *some* of the term, and the second exists for one reason: against a
zero-record file, a sentence naming the difference and a sentence reprinting the count on this device
are the same string. 1/1/1/1 against 3/3/2/3 is the only fixture that can tell them apart.

**And the counter's three deliberate exclusions are all in one four-record fixture**, which is what
makes `3 recorded meetings · 3 attendance marks · 2 assignments · 3 scores` a claim rather than a
number: one record carries `exception: 'dropped'` (not a meeting), one mark cell carries `U` (not a
mark — nobody has looked at that student yet), and `scores` is an object keyed by assignment then
student, which `count()` answers **0** for. A naive counter reads 4/4/2/0 on that document, and every
one of those three errors is in the direction that reports a full gradebook as nothing at stake. Five
mutations, all reverted and tabulated in `TESTING.md` § WO-1.15.

**658 at WO-3.9**, measured the same way: `658 checks · 658 passed · 0 failed · 0 skipped`, 16,628
lines, 25.3 lines per check, 205s. Twenty-two call sites in a new section at the foot of the file,
twenty-two results, and none anywhere else. Four things about them are worth knowing.

**WO-3.21 lands no call site at all — the mutation proved the existing checks already carry the
case, so the third deliverable's "add one only if it does not" resolved to adding nothing.**
`groupsFor()` counts students, not rows (`src/accommodation-prompt.js:186`'s `seen` Set), and the
WO-3.8 fixture never gave one student two rows of the same kind to prove that dedupe does anything —
measured at that work order's own verification: delete the `seen` Set and all 710 checks stay green.
The only change here is to the fixture itself: `wo38-s1` Ashdown (grep the harness for
`doc.students.push(person('wo38-s1', 'Ashdown'` — one hit; cited as `tools/verify-shell.mjs:17574`
until WO-2.39, by then thousands of lines short of it) now carries a second `extended-time` row scoped
`['unit tests']` beside the original scoped `['tests']` —
both rows real, both matching Tests (`wo38-s3` Corvane already proves `['unit tests']` fires), so
`isRealRow()` is not why the dedupe was never exercised. The 713 call sites in this file's own
`check()`-count sentence (`grep -nE 'holds [0-9]+ .check\(\). call sites' tools/README.md` — one hit,
and the pattern is a deliberate **transliteration** of `tools/wo-sweep.mjs` § 11's own `RECORDED`
regex — `[0-9]+` for its `(\d+)`, `.` for each of its backticks — so the sentence it finds is already
maintained by a standing check. **Do not tidy the pattern back to § 11's literal spelling.** Written
that way, this anchor matches `RECORDED` itself, the sweep sees the call-site count stated twice, and
its two-hit arm goes red naming this line — measured on a scratchpad copy at WO-2.43's verification,
where the literal form is what a careful implementer reaches for first; cited as
`tools/README.md:783` until WO-2.43, 2026-08-17, by then 111 lines short of it, having
been correct as a number the day it was typed — a hardcoded number in prose does not move with the
text above it, which is this row's whole case) and the 710 executed results beside it are both
unchanged by this work order — nothing here is a new `check(`.

**Before, unmutated, with the new fixture in place**: `710 checks · 710 passed · 0 failed · 0
skipped`, 18,135 lines, 25.5 lines per check, 227s. The sentence still reads *"3 students have
extended time, 2 need a separate setting."* and the reveal still lists five names with Ashdown named
once — Acceptance lines 1 and 2, unmoved by the second row.

**During, with the `seen` Set deleted** (`const seen = new Set();` and its two call sites at
`:190-191`): `710 checks · 705 passed · 5 failed · 0 skipped`, exit 1. Five of WO-3.8's own checks go
red and nothing else moves — every one of them a moment that reads the sentence or the reveal, not a
new assertion:

| Check | Failure detail |
|---|---|
| *"creating a test surfaces the counts … 3 students have extended time, 2 need a separate setting."* | category = "Tests — 60%", prompt says "4 students have extended time, 2 need a separate setting.", host hidden = false |
| *"one deliberate tap puts the five names on screen …"* | 6 chip(s): `["Ashdown, Wo38","Ashdown, Wo38","Braemore, Wo38","Corvane, Wo38","Dunmarrow, Wo38","Everleigh, Wo38"]` |
| *"and back to Tests recomputes the same sentence …"* | says "4 students have extended time, 2 need a separate setting.", aria-expanded = false, name chips = 0 |
| *"in presentation mode nothing appears at all …"* | names showing before the flip = 6; after: hidden = true, display = none, host text = "", reveal hooks = 0, kind phrases left on the page = [], names left in the dialog = [] |
| *"flipping presentation mode back off brings the same counts back …"* | says "4 students have extended time, 2 need a separate setting.", reveal hooks = 1, aria-expanded = false, name chips = 0 |

**Five red, not one and not seven-hundred-ten — the middle ground the work order's own Traps line
asks for.** Nothing had reddened means the fixture proves nothing; everything reddening means the
fixture is coupled to something it should not be. Five is exactly WO-3.8's own checks that read the
sentence or the reveal across the four moments it is asked for it — first paint, the round trip back
from Homework, and both edges of the presentation-mode flip — and nothing in attendance, categories,
backup or any other section moved. Reverted with `git checkout -- src/accommodation-prompt.js`;
`git hash-object src/accommodation-prompt.js` = `git rev-parse HEAD:src/accommodation-prompt.js` =
`30a6ef4b9cd4…`, and `git diff --stat src/` is empty.

**The fixture is built to fail a build that got the order right by accident**, because the whole of
this work order is an ORDER and an order is the easiest thing in the world to assert against itself.
The roster is stored in a third order — neither the answer nor its reverse — so a sheet that printed
what it was handed lands somewhere the check names; the ten assignments are stored out of due-date
order, two of them share a due date and one has none at all, which is the three cases the column rule
is made of. Proved rather than argued: `sheetOrder()` returning the list untouched turns **three**
checks red, and resolving the roster in stored order instead of through `src/scores.js`'s
`gridOrder()` turns **three** red.

**The sheet is compared to the SCREEN as well as to the arithmetic.** "Percentages and letters on the
printout match the app exactly" is a claim about two surfaces, so the check reads the score grid's own
`.scores-grade-num` and `.scores-grade-letter` for the same three students before the dialog is
opened, and asserts those, the engine's answers through the seam, and three hand-computed strings.
A sheet that agreed with itself and disagreed with the grid a teacher just came from is the failure the
work order names, and nothing that only read the sheet could see it.

**The CSV is compared to the printed page cell for cell, and that check cannot catch everything —
which is why the cell texts are also written down by hand.** Both surfaces take their strings from one
function in `src/grades-report.js`, deliberately, so a defect they SHARE keeps them in agreement:
making a blank print as `0` leaves the file/page comparison green and turns the hand-written cell
matrix red. The two checks are complementary rather than redundant, and the mutation is what
established that rather than a reading of the code.

**And the page box is read at 740px**, which is trap 10 obeyed rather than rediscovered: `.modal-panel`
is `width: 480px`, so without the restatement inside the gated block the whole grade sheet prints down
the left-hand third of the paper — and at the 1280px the rest of the section runs at, 480 of 1280
looks like a dialog rather than like a mistake. Three mutations, all reverted and tabulated in
`TESTING.md` § WO-3.9.

### Driving a browser over CDP — ten traps, all of which first look like app defects

Every one of these was hit and diagnosed twice, by two different agents, before it was written
down here. That is the entire reason this section exists.

1. **A modern `CSSStyleRule` has its own empty-but-truthy `.cssRules`** (CSS nesting). So the
   obvious rule walk — `if (r.cssRules) { walk(r.cssRules); continue; }` — treats every
   ordinary style rule as a container, recurses into nothing, and skips it. A 123-rule
   stylesheet reports 3, every selector search returns empty, and **nothing throws**. It reads
   as a clean pass. Process the rule, *then* recurse into children. `window.__eachRule` in
   `verify-shell.mjs` is the fixed version; use it rather than writing a second walker.
2. **Headless Chromium with no visible frame never advances a transition or a keyframe.**
   `getComputedStyle` and `getBoundingClientRect` return start-of-animation values, so
   `.modal-close` measures 42.24px — which is 44 × 0.96, the `srIn` keyframe's opening scale —
   and reads exactly like a failed touch target. Inject
   `*,*::before,*::after{transition:none!important;animation:none!important}` before measuring,
   and again after every reload.
3. **`Emulation.setEmulatedMedia`'s `features` list does not reach `pointer`.** It needs
   `setTouchEmulationEnabled` plus `mobile: true` device metrics. Get it wrong and you measure
   the desktop pass and report green — so **assert `matchMedia('(pointer: coarse)').matches`
   before trusting any measurement below it**.
4. **A fixed `--remote-debugging-port` collides** with a previous run that did not shut down
   cleanly, and the failure reads as "the app broke." Pass `--remote-debugging-port=0` and read
   the chosen port from `<user-data-dir>/DevToolsActivePort` (line 1 is the port, line 2 is the
   websocket path).
5. **A fixed sleep before a measurement is a race, and it hides defects rather than only causing
   flakes.** Wait on the condition — poll for the state you expect, with a timeout — and where the
   state can be transient, require it to *hold* for a beat. A single sample cannot tell a finished
   operation from the gap between two attempts.

   The forced-save-failure check slept `setTimeout(150)` and then read the chip. It failed
   intermittently on a green build, was investigated once, and was written off as "a flaky check,
   not a store defect." That was half right. Replacing the sleep with a poll made it fail
   *consistently*, which is how the actual behavior surfaced: a stale max-wait timer restarts a
   permanently-failed write about five seconds later, and `MAX_WAIT_MS` is 5000, so the first
   poll deadline landed exactly on it. The 150 ms sleep had been sampling before the defect
   became visible.

   This is the same shape as the four traps above — a check that reports green while measuring
   nothing — except that here the check was *believed* to be the broken part, which bought the
   underlying behavior another round of not being looked at.

   **A poll can be the same mistake one level in, and WO-2.42 is the case.**
   `waitForPassAlert()` polled rather than slept, exactly as this trap says to, and still reddened a
   correct app about one run in three — because what it polled for was not what its callers assert.
   The three checks read the `alerted` flag **and** the live region; the loop exited on the flag
   alone and handed back whatever the announcement happened to be at that instant.
   `src/live-region.js` defers its write by 30ms (a repeated message has to arrive as a *change*)
   while `paintPassElapsed()` marks the record synchronously, so the two land in different tasks and
   a poll can sit between them. The fix was to fold the caller's own pattern into the exit condition
   and hand back the pair the loop exited on — **not** a larger cap, which is this trap wearing a
   poll's clothes. So the rule has a second half: **wait on the condition the check asserts, and
   return what you tested.** A wait that exits on a proxy for the real thing is a sleep with extra
   steps.
6. **`Page.reload` does not wait for a debounced write, and the loss reads as a store defect.**
   Every save in `src/store.js` is debounced, so an edit made a moment before a reload is still
   sitting on a timer when the page goes away — and the document that comes back is the one from
   before the edit. What that looks like from the check is "the class I just created did not
   persist", which is a persistence bug in every respect except being one.

   It cost three runs at WO-1.6 to see, because the shape is so convincing: the write path is
   exactly what is under test, so the first suspect is the code the check was written for. Call
   `await window.planbook.store.flush()` before **every** reload — `verify-shell.mjs` does, at each
   of its reload points — and treat an unflushed reload as a defect in the check rather than a
   timing quirk to retry.

   Note the difference from trap 5: sleeping longer would in fact fix this one, which is what makes
   it dangerous. A sleep that is long enough today is a race that fails on a slower machine, and the
   flush is a fact rather than a bet.
7. **The pointer stays where you last clicked, so `getComputedStyle` reads a `:hover` rule.**
   `Input.dispatchMouseEvent` leaves the cursor at the release coordinates, and a check that
   measures the thing it just clicked measures it hovered. Every other element of the same class
   measures resting — so a comparison across several of them reports that one of them differs.

   Found at WO-1.8, by the check that compares the roster's support dots to each other to prove
   none of them encodes a plan type. It failed on its first run with two distinct colour sets, and
   the difference was real: the dot the harness had tapped a moment earlier was indigo, the other
   two were grey. That is *precisely* what a dot coded by plan would look like, which is what makes
   this worth a numbered entry — the artifact is indistinguishable from the defect the check exists
   for, so the answer is to park the pointer (`Input.dispatchMouseEvent` with `type: 'mouseMoved'`
   at a corner) rather than to drop the hover-sensitive properties from the comparison. Dropping
   them would have left the check measuring almost nothing, and it would have gone green.

8. **The browser can write into the page's `localStorage` too**, and the check that notices reads
   as "the app is storing student data under a key nobody declared." Two runs at WO-1.9 went red on
   `shopifySelectors` and `debug` — keys no line in this repo could have written, since
   `src/prefs.js` is the only door and it prefixes everything. Suspected to be Edge's, on a
   throwaway profile, on a page served from 127.0.0.1, appearing part-way through a 60-second run
   and never on a shorter probe of the same page.

   The first response dropped the assertion — the two localStorage checks stopped asserting
   *"every key here is ours"*, on the reasoning that a check going red about the environment
   cannot be made green by fixing the app. That was trap 5's shape but not its lesson: trap 7 is
   the actual precedent, and it says the opposite. Dropping a sensitive-feeling assertion because
   the harness looks unreliable leaves the check measuring almost nothing — it goes green whether
   or not a leak is present, same as trap 7's hover-sensitive properties would have. The fix
   belongs in the environment, not in the assertion: `--disable-extensions` and
   `--disable-component-extensions-with-background-pages` went on the launch line as the suspected
   source, and *that* is what makes the strict assertion trustworthy again. So the checks assert
   **every key present starts with `planbook_`**, kept alongside the half that was always about
   the app — every key and every value, ours or not, is searched for the fixture's own phrases,
   and a foreign key is printed rather than ignored, so a future red still shows what was in the
   store. If the strict assertion goes red again on a clean environment, that is real signal, not
   noise to route around a second time.

9. **A download check that diffs file NAMES reads a second run as a run that wrote nothing.** The
   backup file's name carries the year and the date, so tapping "Back up all 3 years" twice in one
   sitting writes the same three names — and whether the browser uniquifies them, overwrites them,
   or refuses a second burst of downloads from the same page is the browser's business. Found at
   WO-1.11: the check that proves an unreadable year is skipped ran the loop a second time and
   reported `0 file(s)` on a build whose status line, stamps and directory were all correct. Answer
   what "this run wrote it" means with a new name **or a moved mtime**, and keep the assertion on the
   file the app decided about — Chrome's own multiple-download blocking is the same class of behavior
   iPadOS is suspected of, and a check that requires the browser to cooperate twice is a check that
   goes red about the environment (trap 8).

   **It outlived the architecture that produced it.** That control now writes ONE zip file per tap
   rather than one .json per year, and the trap is unchanged: the archive's name carries the date
   too, so a second tap in the same sitting still writes the same name. What did get better is the
   second half — with one hand-off per tap, the browser only has to cooperate once, so the second
   run's check can assert what is *inside* the archive instead of narrowing itself to the one file
   the app decided about. Keep the mtime rule; the narrowing was a cost of the old shape.

10. **`Emulation.setEmulatedMedia: 'print'` changes the media TYPE and nothing else — the page is
    still laid out at the viewport width, so every `max-width` query answers about a window rather
    than about paper.** This is the one trap in the list that hides an app defect instead of
    imitating one: the harness looks perfect, the page it measured is not the page that comes out of
    the printer, and a green run says nothing about the difference. A page box is small — Letter at
    `@page { margin: 10mm }` is ≈740 CSS px, landscape Letter ≈981, A4 ≈718 — and this app's
    responsive blocks start at 1024, so a print snapshot taken at 1280 sits in the one band where a
    stylesheet with an unpinned responsive rule still looks right. It cost WO-3.7 a one-column sheet
    that twenty-eight green checks agreed was fine (see the WO-3.7 block above). **Set
    `setDeviceMetricsOverride` to the page box before you read a printed layout**, and then assert
    the narrow band actually MATCHES before believing what you measured — otherwise an override that
    quietly failed leaves you back at 1280, where the check passes for exactly the wrong reason
    (trap 3's rule, applied to width instead of pointer). Nothing in CDP relayouts at the page box
    on its own; `Page.printToPDF` renders one but hands back a PDF, which is bytes rather than a
    tree you can measure, so the width has to be set by hand.

### Two rules that follow from those

- **Guard every sweep against a vacuous pass.** Assert the walker saw a plausible number of
  rules, that the measurement found a plausible number of controls, that the emulated pointer
  really is coarse. An empty result set and a clean result set are the same value, and three of
  the four traps above produce an empty one silently.
- **A skip is announced, never silent.** When a fixture is missing — the WO-1.2 component shelf
  goes away at WO-1.10, and `window.planbook` with it — the check prints `SKIP` with a reason
  and is counted separately. A suite of 28 checks that quietly becomes a suite of 4 still
  prints green.
