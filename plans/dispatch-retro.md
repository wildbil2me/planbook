# Dispatch retrospectives — the scars behind the pipeline's rules

**Read this when a step fails, not before every dispatch.**

The three agent definitions in [`../.claude/agents/`](../.claude/agents/) carry the *rules*. This
file carries the *stories* — what went wrong, what it cost, and why the rule is shaped the way it
is. They were split on 2026-08-04 for a measured reason: `work-order-orchestrator.md` grew from 169
to 274 lines in a single day as each retro appended full paragraphs, and every dispatch paid to read
all of them. Orchestration output per dispatch went **6,965 → 15,561 → 11,985 → 20,507 → 14,629 →
30,825** across WO-1.1 to WO-1.6. The last one is larger than the entire WO-1.1 dispatch.

**The rule for anything moved here: the imperative stays in the definition, only the narrative
moves.** "`--summary` is a boolean and takes no value" is an instruction and stays where the agent
reads it. The three paragraphs about how that was discovered are here. If you find yourself
deleting an instruction rather than a story, stop — you are removing the thing the story was
written to protect.

Run `node tools/wo-cost.mjs` for the current numbers before deciding this file was a good idea or a
bad one.

---

## Interrupted runs — why step 2b audits rather than trusts or deletes

**WO-1.2 was interrupted mid-flight and left seven files with no result file.** Nothing had been
through a verifier, and nothing recorded what it was trying to do. The re-dispatch was told to audit
the draft line by line against the brief before building on it. It kept about 90% and found one real
defect in the rest: a 44px touch target wrapped around a 19px input. A from-scratch rerun would have
paid full price to rediscover that; blind trust would have shipped it.

The two implementer runs that were interrupted cost 38,313 and 31,745 output tokens; the audit
re-dispatch cost 48,115. WO-1.2 came to 171,092 output in total, 2.1× the WO-1.5 baseline, almost
all of it attributable to one interruption. The `git status --short` check that now opens every
dispatch costs one Bash call.

## When the orchestrator itself is what was interrupted

**WO-1.4's orchestrator was killed twice** — once by a process crash, once by a session limit. Its
own status file read *"clean start, not an interrupted draft (no audit-the-draft instruction
needed)"*. That was accurate when written at 08:55 and false by 09:06, because the implementer it
had dispatched kept working after the orchestrator stopped being able to write about it: 501 lines
of `src/store.js` existed by then.

Resuming on that line would have sent a fresh implementer to build a file that already substantially
existed. The audit that ran instead found a real defect — `setPref('openYear')` against a key never
declared in `PREF_DEFAULTS`, which `prefs.js` silently refuses.

**A status line asserting the state of the working tree is a claim about the past. Your own is no
more current than anyone else's, and it is the one you are most likely to believe.** Hence: `git
status --short` first on resume, before reading your own status file.

`tools/wo-sweep.mjs` now checks the specific defect — every `getPref`/`setPref` key against
`PREF_DEFAULTS` — because the enforcement in `prefs.js` is silent by design and a silent refusal is
invisible to everything except an audit.

## The spawn reported as a run — WO-3.5, and the 21 minutes nothing could see

**2026-08-10. Sixty seconds into the WO-3.5 dispatch, the orchestrator returned a complete,
confident report**: the route with its reasoning, the claim written, the brief written, and *"the
implementer is in the background at Opus. Expect 20 to 40 minutes."* Every word of it was true
except the tense. It had **spawned** the implementer and returned. It had observed no work at all.

The coordinator read a finished-shaped report against a status file frozen at the dispatch line,
concluded the child had never launched, and re-dispatched. **It had launched. It was reading.** An
implementer on an `L` reads the brief, the design mockup, the surfaces document and six or eight
source files before it writes anything: here that was **21 minutes between spawn and first write**
(spawn 11:56Z, first write to `src/views.js` 12:17Z). The liveness watcher polled three signals
between 11:58Z and 12:04Z — status-file lines, the result file, and `git status` on `src/` — and a
reading agent touches none of them. **No signal was read as death.**

**Two implementers then built WO-3.5 concurrently for 19 minutes.** The tree survived, and survived
on luck resting on a shared brief rather than on any property of the system: both lifted
`design/mockups/scores.html` and `plans/gradebook-surfaces.md` instead of inventing, so the halves
fit, `src/shell.js` imported exactly the six functions `src/scores.js` exported, and the ids matched.
It still cost both defects the verifier found, and they have the same shape — **a file asserting
something about a file the other implementer owned, which neither had opened**: `index.html:867`
claimed `src/screen-nav.js` needed no change (it did, and the Scores view was unreachable without
it), and nothing chained `afterAssignmentChange()` in `src/shell.js`. Recovery took a correction
round and a second verifier pass.

**The root cause is one sentence: a report written at spawn time is indistinguishable from a report
written at completion.** The false stall, the duplicate and the two defects all follow from a reader
being unable to tell those apart.

**The fix considered and rejected.** The instinct is to build the missing instrument — a heartbeat
file, a progress protocol, a poll the watcher can trust. WO-2.20 put that out of scope on purpose,
and the reason is worth keeping: *the cheap fix is to stop producing the ambiguous report, not to
build the instrument that would let a reader see through it.* An orchestrator that does not speak
until its child returns needs no liveness channel, because there is no longer a window in which
someone must guess. Anything more is a work order of its own, and one nobody has needed yet.

Two things the day is worth remembering for anyway. **The only signal that actually separated the
two cases was token usage**, which no file exposes — mtimes and `git status` lie in the one direction
that matters, and they lie longest on the largest work orders. And the WO-3.5 status file **struck
its wrong line through rather than deleting it** (`~~FALSE START~~`, annotated with what was actually
happening), which is why this section could be written from the record instead of from memory. Do
that: a status trail that edits away its own mistakes cannot teach anything.

## Codex — four probes, a fix, and the first run that landed

**Do not probe by looking for a file in `bin/`.** The first version checked for
`codex-windows-sandbox-setup.exe` beside `codex.exe`, on the strength of an error message naming it.
That file is not part of the standalone build's layout at all, so the check would have been `False`
on a perfectly healthy install and silently re-routed every Codex work order forever. Note also that
`codex.exe` on `PATH` is a launcher: the real package lives under
`~\.codex\packages\standalone\releases\<version>\bin`, so a directory listing taken beside the
resolved executable is not the install.

**`--summary` is a boolean and takes no value.** The step was written as `--summary compact` on the
strength of the shape of the tally line. That form does not parse — Codex v0.146.0 answers
`error: unexpected argument 'compact' found` and exits non-zero. A probe that always fails is a
probe that always re-routes, so this would have sent every Codex work order to Claude while
reporting the install as broken. Corrected at WO-1.6, where it cost one round trip. If a future
build moves the flag again, run `codex doctor --help` and fix the block rather than inferring a
health verdict from a usage error.

**And then the corrected probe still did not predict the failure.** At WO-1.6, `codex doctor
--summary --no-color` reported `16 ok · 0 fail · sandbox ✓` at 15:18. At 15:24 `codex exec` exited
**zero** having written nothing: `codex-windows-sandbox-setup.exe: program not found`, 31 helper
failures across read, `apply_patch`, and exec. The worktree was untouched, so there was nothing to
audit — a clean re-route, but a whole brief and probe cycle spent first.

That is the finding that matters: **`doctor` reports installation health, not exec-time helper
health, and only the second one is what a dispatch depends on.** So step 3b now writes a file with
`codex exec` under the real sandbox flags and asserts the file exists. It exercises helper spawn and
`apply_patch`, which is exactly what failed both times.

**Codex is 0 for 2.** WO-1.4 and WO-1.6 both routed to it correctly by the rubric and both died at
exec time. Both failures look transient — `codex doctor` was healthy afterwards, and at WO-1.4 a
`--sandbox workspace-write` run completed normally later. **Record it as a transient condition, not
a standing fact about the machine.** Do not raise `--sandbox` (the user's call, and it would not
have helped either time). Do not retry the same command inside the same run. Do not write the runner
off for future work orders — re-probe next time.

**A dispatch-level bug from the same run, worth one line:** an unset `$TMPDIR` made the Codex log
redirect fail, and the first WO-1.6 dispatch aborted before Codex started. Use an absolute log path.

**The record kept getting worse before it got better.** WO-1.7 died the same way (0 for 3), and the
teacher suspended every pending Codex row to Claude on 2026-08-05. The WO-1.12 probe — run after the
suspension, just to keep checking — died too (0 for 4), with the same `program not found`. Four
failures in, every single one had reported the identical missing piece, and nobody had gone looking
for it as a piece rather than as "the runner is down again."

**Found 2026-08-06: `codex-windows-sandbox-setup.exe` and `codex-command-runner.exe` were never
missing. They were sitting in `codex-resources\`, a directory beside `bin\` in every installed
standalone release, and that directory was never on `PATH`.** `codex.exe` itself resolves from a
separate launcher install on `PATH`, so the launcher starting proved nothing about whether its own
helper spawns could find each other by name — which is exactly what "helper failures across read,
apply_patch, and exec" and "program not found" describe, four times, without anyone naming the actual
missing directory until a plain `Get-ChildItem` beside the resolved `codex.exe` was compared against
where the probe was failing.

The fix is one line, and the load-bearing part is *when* it is set: **on the environment of whatever
process actually runs `codex`, at every invocation** — never persisted, never assumed:

```powershell
$env:PATH = "$env:USERPROFILE\.codex\packages\standalone\current\codex-resources;$env:PATH"
```

Tried first as a persisted `[Environment]::SetEnvironmentVariable(..., 'User')` write instead — it
landed correctly in the registry and then did nothing, because the session already running when it
was written had already built its environment block and doesn't re-read the registry for child
processes. A dispatch has no way to tell from the inside whether its session happens to postdate a
registry change, so the persisted version is not safe to depend on. The `current` junction under
`~\.codex\packages\standalone\` is used instead of a version string so the fix does not go stale the
next time Codex auto-updates itself — exactly the kind of silent staleness this file exists to warn
about elsewhere.

**It shipped inline in the orchestrator's own PowerShell first, and that lasted about two hours.**
Step 2b carried a copy of the line, step 4 carried a second, and `ROUTING.md` a third — three places
for one fix to be right or wrong in, which is the drift this repo keeps paying for everywhere else.
It now lives in `tools/codex-invoke.mjs` (`--probe`, or `--brief`/`--out` for a real dispatch), which
sets the prepend on the child's environment for both paths from one function. The script also makes
mechanical a distinction this section had been asking the orchestrator to draw by reading prose:
**exit 1 is a runner verdict, exit 2 is a harness bug**, and a zero exit with no output file is
exit 1 rather than a pass — the WO-1.7 failure mode, encoded rather than remembered.

Verified 2026-08-06. The inline shape went **2 for 2 `SMOKE OK`** immediately after the 0 for 4
above; the script was then re-proven on its own terms — `SMOKE OK` at exit 0, plus all three exit-2
paths (missing argument, missing brief file, unrecognized flag) driven and confirmed to report
distinctly, so a harness bug cannot arrive dressed as a runner failure. That last part is this
section's own standing rule applied to its own replacement: a gate nobody has watched fail is not
evidence that it can. `ROUTING.md`'s suspension lifted on the passing probe exactly as its text said
it would, and WO-2.2, WO-2.3 and WO-2.4 are back on Codex routes.

### WO-2.4, 2026-08-08 — the first Codex run that landed, and where it actually went wrong

**Codex wrote code for the first time.** The probe passed a third time (**3 for 3** since the PATH
fix), the dispatch exited 0 with a result file, and `src/attendance.js` gained a correct
implementation of `(P+T+E+D)/(P+T+A+E+D)`. A later verifier checked the formula against Roll Call!'s
own `bridge.gs:625-626` rather than against the work order's claim about it, and they match at the
source. **The rubric was right about this work order for four dispatches while the runner was down,
and it was right again when the runner came up.**

It still took two FAILs to land, and **both were in the harness, never in the app** — the same
fixture, failing in opposite directions:

- **Round 1: a check that could never pass.** `percent === 100` and `percent === 10/11*100` asserted
  over one result object.
- **Round 2: ten checks that could never run.** The fix added `if (!term) return null` at the top of
  the block. The fixture class carries no terms, so every WO-2.4 check skipped — **and the suite
  exited 0**, because a skip is not a failure. The evidence went backwards while the summary went
  green.

That pair is the whole lesson, and it is this file's § "Fixture assumptions" arriving from a new
direction: **a check that cannot fail and a check that cannot run are the same defect wearing
different signs, and only one of them is visible in a summary line.** Round 1 was caught because it
printed red. Round 2 printed nothing at all and had to be caught by a verifier reading the block and
asking why 395 had become 390.

Three consequences, applied 2026-08-08:

- **A missing fixture is now a `check()`, not a `skip()`** (`tools/verify-shell.mjs`, WO-2.4 block).
  A skip is the right answer for a capability the environment lacks; it is the wrong answer for a
  fixture that was supposed to be there, because it converts a broken harness into a green run.
- **The term guard was narrowed** to the two checks that actually need a term, rather than gating all
  ten at the front door. A guard should cost what it protects.
- **`lastMeetings` went from N=3 to N=10.** At 3 the window did not reach the dropped day, so a
  function that never excluded dropped days would have passed a check named *"counts meetings rather
  than days."* The check now spans both the dropped day and the no-school day. Same failure mode as
  the two above: the assertion was fine and the *fixture* could not express the bug.

**On who fixed it.** After the second FAIL the owner declined a third Codex round and had the
orchestrator repair the fixture directly. That inverts the pipeline's normal separation, so the
re-verify brief said so explicitly and told the verifier to be pointed about it — and the verifier
earned that instruction, catching a comment that misdescribed its own edit. **If the orchestrator
ever writes code again, the conflict gets named in the verifier's brief.** It is not a rule against
doing it; it is a rule against doing it quietly.

**One more thing the first attempt at that fix taught.** The obvious repair — seed a `terms` array
onto the fixture class — broke two unrelated checks, because that class is *deliberately* the legacy
"stored with no terms at all" shape and term ids are asserted against `/^tm_[0-9a-z]{10}$/`. **A
shared fixture carries invariants that are somebody else's acceptance criteria.** The block now lends
itself a term and removes it in its own restore, and the seeding site carries a comment saying why
not to try it again.

## Ticking — why the orchestrator holds the pen

The rule in [`ROADMAP.md`](ROADMAP.md) is that nothing is ticked until it is **verified**. It was
never about which hand holds the pen. An earlier version of this pipeline read it as "no agent may
tick," which cost nothing until WO-1.1 passed clean and then sat with the dashboard reading `0`
done, because five hand edits are easy to postpone. **A tracking system that lies about what is
finished is the exact thing the protocol was written to prevent**, so enforcement moved to where the
evidence is.

The verifier still cannot tick, for a sharper reason than politeness: in a phase file the acceptance
criterion and its checkbox are the *same line of text*. An agent with write access there could
reword the criterion it just failed, in the same edit. Its read-only tool grant is what makes that
impossible rather than merely discouraged.

`tools/wo-gate.mjs --tick` now applies the mechanical half and recomputes the dashboard from the
phase files rather than trusting the number already sitting there.

## Static preconditions — the miss that produced the rule

**WO-1.2's safe-area acceptance line was marked 🙋 by both the implementer and the verifier**, on
the true observation that safe-area insets resolve to 0 in every desktop emulator. Both stopped
there. Neither asked whether the insets could resolve non-zero *on an iPad either*.

They could not. `index.html` had no `viewport-fit=cover`, without which iOS resolves every
`env(safe-area-inset-*)` to 0. Eight declarations were inert. The iPad pass then "succeeded" by
having nothing to test, and the box was ticked for the wrong reason.

**Deferring to a human is what you do after ruling out a static precondition, not instead of it.**
The shape to look for is a feature gated on something cheap to read right now — a flag, meta tag,
manifest field, permission, or registration. `viewport-fit=cover` for safe-area insets.
`display: standalone` and an `apple-touch-icon` for install. A `serviceWorker.register()` call for
anything offline. A secure context for anything needing HTTPS. If the gate is missing, that is a ❌
with a `file:line` — not a 🙋, and not a footnote inside one.

## Fixture assumptions — the three defects that escaped a green run

Six verification rounds across WO-1.1 to WO-1.6 caught one hard defect (WO-1.4's missing `sw.js`
precache, which would have meant an installed iPad could not boot offline and would not receive the
build at all) and two riders. Three defects escaped and needed their own commits afterwards. All
three have the same shape: **invisible to the harness as seeded.**

- **The safe-area gap** — nothing asserted the precondition, so there was no fixture that could fail.
- **A stale max-wait timer** restarted a doomed write about five seconds after it permanently failed
  (`36adbf5`). Reproducing it needs an edit landing *while* a write is in the air; the check was
  written and then removed because it repeatedly hung the page under CDP, and a check that can stall
  the run is worse than the defect it looks for. Recorded in
  [`verification-tooling.md`](verification-tooling.md) rather than guarded.
- **The per-year backup nag** (`9bcfdc9`) — `planbook_lastBackupAt` was one timestamp for the whole
  browser, so downloading one year marked every other year as backed up. The fixture held **one
  year**, which is precisely the case where the bug cannot manifest. Seventy-nine checks were green.
  The fix drives two.

Hence the standing question in the verifier's definition: *name the fixture assumption that would
hide a bug in this surface, and say whether the harness breaks it.* A green run over a fixture that
cannot express the failure is not evidence.

## The briefing layer was outside the protocol — nine days, ~50 dispatches

**`CLAUDE.md` told every dispatch in the August sprint that the project had no code in it.** Its status
paragraph read *"pre-code, Phase 0 complete… no app code exists yet"* and its Conventions section read
*"Git: not yet initialized"* until 2026-08-13 — by which point there were 133 commits, 25.5k lines of
app, and a live deployment. Its Commands table said *"No code yet, so nothing to build or test"* while
ten scripts sat in `tools/`, including the two an implementer most needs: `serve-https.mjs` and
`verify-shell.mjs`.

**The sharp edge is that `AGENTS.md` was correct the whole time, and points here.** Its first line is
*"Read `CLAUDE.md` first — it is the real briefing… the two must never drift apart."* So every Codex
implementer was routed, by a current document, into a stale one.

**Nothing caught it, and that is the finding.** The roadmap boxes, the dashboard, the `CHANGELOG.md`
entries and the work-order status lines all stayed accurate to the commit across those nine days —
`wo-gate.mjs --audit` checks three of the four against each other every run. The discipline was real.
`CLAUDE.md` simply was not a member of any set anything iterated over: the maintenance protocol named
the roadmap, the dashboard and the changelog, and stopped. **A protocol that lists its artifacts by
name silently exempts every artifact added after it was written.**

The fix is `ROADMAP.md`'s maintenance step 5, added the same day. The open question for the Ship 2
pipeline audit is the one this exposes rather than answers: **there are now five documents that brief
agents** — `CLAUDE.md`, `AGENTS.md`, the three definitions in `.claude/agents/`, this file, and
`verification-tooling.md` — roughly 1,400 lines with overlapping content and no stated boundary. That
split was made incrementally under the cost pressure described below, never designed. Deciding what
belongs where is dispatchable work; noticing that nobody has is not.

## What the pipeline costs, as of WO-1.6

Six dispatches: **549,554 output tokens of implementation, 100,472 of orchestration, 178,902 of
verification** — a 51% premium over implementation alone, and 131.2 M in cached reads. Against that
it bought one prevented bricked install, two caught recurrences, a 2,232-line regression harness,
six durable result documents, and thirteen sessions with zero compactions.

The number to watch is orchestration per dispatch, because it is the one that grows on its own: each
retro adds prose that every future dispatch pays to read. That is what this file exists to stop.
`node tools/wo-cost.mjs` prints the current trend.
