# Verification tooling: why there is one script and never a test framework

**Decision record — 2026-08-04. Status: settled.**

Planbook has exactly one verification script, [`tools/verify-shell.mjs`](../tools/verify-shell.mjs).
It is run by hand, it has no dependencies, it gates nothing, and **it is not the beginning of a test
suite.**

This document exists because a future session will look at that file and start growing it. Every
addition will be individually reasonable. Somewhere around the fourth one, someone factors out
`tools/lib/`, adds a config file, then a runner — and the suite has acquired a test framework that
nobody decided to adopt. That is the same failure mode as `package.json` "just for scripts," which
`CLAUDE.md` and Roll Call!'s `plans/b-hygiene.md` already rule out, arriving by a different door.

## Where it came from, stated plainly

It was not a Deliverable. It came out of a retrospective on WO-1.2, on 2026-08-04, after two agents
independently built the same throwaway harness in a scratchpad and threw it away. It is recorded
here rather than as a work order because a work order is a forward commitment with acceptance
criteria; minting one after the fact and immediately ticking it adds one to both sides of the
dashboard, tells you nothing, and implies planning that did not happen.

## Why a script exists at all, when the suite has no test framework

Because some acceptance lines cannot be settled by reading a file, and reading was giving wrong
answers.

WO-1.2 shipped `.search-box { min-height: 44px }` wrapped around a **19px input**. The wrapper
measured 44px. The input did not. Tapping the strip above or below the text hit the wrapper, did
nothing, and the teacher taps twice. **A stylesheet review calls that line compliant.** Only
measurement catches it.

This is not a new convention either. Roll Call!'s `design/execution-guide.md` §7 already says to
verify by driving the built demo in headless Edge/Chromium over CDP, and `plans/ROADMAP.md` names
`TESTING.md` plus a headless demo pass — not an automated suite — as the 1.0 gate. One
dependency-free `.mjs` under `tools/`, run by hand, is the existing rule in `tools/README.md`
applied to verification.

## The boundary

These are the rules that keep it a script. Breaking any one of them is how it stops being one.

| Rule | Why |
|---|---|
| **One file.** No `tools/lib/`, no second harness, no plugin seam | A shared helper directory is the first structural step from "a script" to "a framework" |
| **If it wants a config file, stop** | Configuration is what a runner needs. A script that needs configuring has outgrown the decision recorded here — bring it to the teacher rather than building it |
| **It gates nothing.** No git hook, no CI, no commit check | Everything in `tools/` is optional and run by hand. A gate makes it required infrastructure |
| **It measures; `TESTING.md` judges** | A green run closes **zero** boxes by itself, and never a 👤 item. The checklist is the gate; this feeds it evidence |
| **Never required to run or ship the app** | A teacher's laptop never runs Node. `index.html` and `src/` are served as they sit on disk |
| **No line cap.** Watch **lines per check** (~17.9) and **runtime** (58s) instead | The ~950-line cap was retired on 2026-08-05 after binding once in four work orders. It could not tell coverage from bloat on a file that grows with the app's surface. The reasoning, and the two controls that replace it, are recorded below |

## What it is allowed to check

Only claims where reading the source gives the wrong answer: rendered geometry, resolved styles,
real focus movement under dispatched input, runtime storage state, and static preconditions that
silently disable a feature.

Anything a `grep` settles correctly should be settled by `grep`, in the verifier's standing sweep.
Adding a grep-shaped check here trades a one-line command for 400 lines of browser automation.

## The precondition rule, which is the reason it earns its keep

WO-1.2's safe-area acceptance line was marked "needs a real iPad" by both the implementer and the
verifier, on the true observation that safe-area insets resolve to 0 in every desktop emulator. Both
stopped there. Neither asked whether the insets could resolve non-zero **on an iPad either.**

They could not. `index.html` had no `viewport-fit=cover`, without which iOS resolves every
`env(safe-area-inset-*)` to 0. Eight declarations were inert. The iPad pass then succeeded by having
nothing to test, and the box was ticked for the wrong reason.

So the script asserts preconditions, not just declarations, and
`.claude/agents/work-order-verifier.md` now requires that question be answered before anything is
deferred to hardware. **Deferring to a human is what you do after ruling out a static precondition,
not instead of it.**

**One check was expected to fail until WO-1.3 landed** — that same `viewport-fit=cover` line. It
went green when WO-1.3 set the meta value, as designed. The run exits zero today.

## Raising the cap, 2026-08-04

> **Superseded on 2026-08-05 — the cap was retired outright. See "Retiring the line cap" below.**
> Kept in full because it is the record of a decision made on the day, and because its third
> argument — a cap is *a prompt to look, not a budget to spend* — is the reasoning that retired it a
> work order later. History, not current rule.

WO-1.4 took the script from ~470 to 851 lines and the verifier stopped, correctly, rather than
refactoring past a number this document set. The conversation, and its outcome: **the cap is now
~950 lines, and the one-file rule is untouched.**

Three things decided it.

**Splitting was never available.** The first rule in the boundary table forbids `tools/lib/`, a
second harness, or a plugin seam, and that rule is load-bearing in a way the line count is not — a
shared helper directory is the first structural step to a framework, which is the thing actually
being prevented. A cap that can only be honored by breaking a stronger rule is the wrong
constraint, so the number moved instead of the structure.

**The growth was the right kind.** WO-1.4's additions measure runtime storage state — `rev`
arithmetic across a debounce, a forced `DataCloneError`, a migration ladder run against a real
`schemaVersion: 0` document. Every one is a claim `grep` gets wrong, which is the test this
document already applies. None of it is grep-shaped work smuggled into browser automation.

**The cap was costing a check that catches shipped defects.** WO-1.4 shipped `src/store.js` and
`src/year-picker.js` without adding either to `sw.js`'s SHELL, and the verifier's first pass caught
it — but declined to write the check that would catch it *next* time, on the grounds that the
harness was already over cap. The defect it prevents is an installed app that will not open with
the network off, discovered on a teacher's iPad. Trading that for a line count is the wrong trade,
and noticing that is what a soft cap is for: **it is a prompt to look, not a budget to spend.**

That check now exists, is static rather than driven, and is allowed by "What it is allowed to
check" above — a static precondition that silently disables a feature. It walks `index.html`'s
module graph transitively and asserts SHELL covers it, guarded against a vacuous pass.

Also fixed in the same pass: the forced-failure check waited a fixed 150 ms for the chip, which
raced `MAX_WAIT_MS` and failed a green build intermittently. It now polls for a chip that is
settled **and still settled 600 ms later**, because a single sample cannot tell a finished failure
from the gap between two attempts.

**Fixed in the store, and knowingly left without a regression check.** A stale max-wait timer
restarted a doomed write once, about five seconds after it permanently failed: an edit arriving
mid-write armed `maxWaitTimer`, `save()` returned early at its `saving` guard without clearing it,
and nothing on the failure path did either. `store.js` now clears timers when a write fails
permanently, which is what its own comment already claimed ("it is NOT rescheduled ... a chip
flapping red every second is worse than a chip that stays red").

A check for it was written and then removed. Reproducing it needs an edit that lands *while* a
write is in the air, and that choreography — start a flush, mutate mid-flight, then watch the chip
across a 5-second timer — repeatedly hung the page under CDP for reasons that were never pinned
down. **A check that can stall the run is worse than the defect it looks for**, and chasing it
further was building harness machinery for a behavior that is not on any Acceptance list, which is
the same line the verifier declined to cross for the boot-failure screen.

So this one is recorded rather than guarded. If it regresses, the symptom is a save chip that
flashes red, recovers to a spinner, and goes red again about five seconds later on a document that
cannot be written — and the fix is one `clearTimers()` on the permanent-failure path.

## The grep half moves out, 2026-08-04

`tools/wo-sweep.mjs` now runs the verifier's standing sweep — the checks a `grep` settles correctly.
This section records why that is not the second harness the boundary table forbids.

**The one-file rule protects `verify-shell.mjs` from becoming a framework; it was never a cap on the
number of scripts in `tools/`,** which already holds four others. What the rule prevents is a
`tools/lib/`, a plugin seam, a config file, and a runner — a shared structure that turns scripts into
infrastructure. `wo-sweep.mjs` imports nothing from `verify-shell.mjs` and nothing from it; the two
share a print format and no code. Either can be deleted without touching the other.

**This document already directed the work there.** "What it is allowed to check" says: *"Anything a
`grep` settles correctly should be settled by `grep`, in the verifier's standing sweep. Adding a
grep-shaped check here trades a one-line command for 400 lines of browser automation."* The sweep
existed already — it was just being hand-rolled from prose by a fresh Opus context every run, which
is how its allowlists came to be re-derived each time. WO-1.2's verifier had to reason out that every
`prefers-color-scheme` hit in the repo was documentation *stating the prohibition*. That reasoning is
now a comment in the file.

It obeys the same boundary as its sibling: one file, no config, no dependencies, gates nothing, never
required to run or ship the app, and **closes no 👤 item**. It adds a third state, `REVIEW`, for
evidence that needs a human decision — sensitive field names outside `src/backup.js`, a due date on
the same line as a late/missing flag. A `REVIEW` never fails the run. It narrows what the verifier
must read rather than pretending to have decided it, which is the honest form of a check that cannot
be mechanized without lying.

## Retiring the line cap, 2026-08-05

**Decided.** The overdue conversation was held at WO-1.7. Outcome: **the line cap is retired, not
raised.** Two metrics replace it, and the one-file rule is untouched — again.

This section supersedes the one it replaced, which asked the teacher to choose between raising,
trimming, and retiring, and demanded that anyone raising it a second time *"say what would actually
have to happen for it to be enforced instead."* That question turned out to have an answer, and the
answer is **nothing would**.

### What the measurement showed

At WO-1.7: **2,938 lines, 164 checks, 58s runtime.** That is **17.9 lines per check.** At WO-1.6 it
was 2,232 lines across 130 checks — **17.2**.

**The file is not bloating. It is accreting at a constant density.** It grows because the app's
surface grows, at a stable ~18 lines per check, and the growth has stayed the right kind throughout:
runtime storage state, static preconditions, measured geometry. Moving the grep half out to
`wo-sweep.mjs` made that easier to keep true rather than harder.

### Why the number was the wrong control

A total-line cap on a file that grows linearly with coverage is **structurally guaranteed to bind at
every work order and lose at every one.** It was raised once, at WO-1.4, and ignored at WO-1.5,
WO-1.6 and WO-1.7. That is not a control being neglected; that is a control being disproved. Keeping
it means writing *"recorded rather than decided"* into `CHANGELOG.md` at every work order between
here and 1.0.0, which is a ritual wearing a control's clothes.

The cap was aimed at a real risk — a harness so large that checks rot, duplicate, or quietly go
vacuous. Line count was a proxy for that risk, and the proxy broke: **the file passed 3× the cap
while its density held constant and its checks stayed honest.** A proxy that cannot distinguish
coverage from bloat is measuring the wrong axis.

### The two controls that replace it

| Control | Now | Binds when |
|---|---|---|
| **Lines per check** | ~17.9 | A work order's additions come in materially above the running average — 400 lines and five checks is bloat; 700 lines and 40 is coverage |
| **Wall-clock runtime** | 58s | It approaches the point where the run stops being made before a commit. That is how a verification tool actually dies, and it is the failure the line cap never modelled |

Both fall out of a run, so neither costs anything to check. **Report both in the verifier's line
alongside the check count**, the way the check count is reported now.

**The honest objection, recorded rather than argued away:** retiring a control because it never binds
is also exactly how a control quietly disappears. The defense is that the replacements are cheaper to
evaluate than the thing they replace — if *they* never bind either, that is evidence about the file
rather than neglect by the reader. If both sit flat for three work orders while the file doubles
again, that is the signal to come back here, and this paragraph is the instruction to.

### The trim happens at WO-1.10, and is real work rather than a refactor

Retiring the cap is not a decision to stop looking. **WO-1.10 deletes the WO-1.2 component shelf and
must re-point this harness** — `#aboutModal`, `[data-modal-open]`, and the `window.planbook` seam all
go with it, and every check depending on them degrades to an announced `SKIP` if nobody does the
work. See "What it cannot do" below.

> **Superseded on 2026-08-05, at WO-1.10 — wrong on all three counts.** None of `#aboutModal`,
> `[data-modal-open]`, or the `window.planbook` seam lived in the shelf that got deleted. The About
> modal and its `data-modal-open` hook were always header markup, never inside `<main>` — deleting
> the shelf never touched them. `window.planbook` was kept on purpose, not lost: `src/shell.js`
> carries the reasoning at the seam itself now, because the harness needs an independent read on the
> app's state rather than a second copy of its own id resolution and visibility rules. What WO-1.10
> actually did was re-point the checks that *were* shelf-coupled at the real header controls they now
> drive through, and the count went up, not down — 201 → 209 checks, 0 skips. Kept in full below
> because it is the record of what this document expected going in; the prediction being wrong is
> itself worth keeping.

That is the first occasion this file gets read end to end, and it is the right one: each
shelf-coupled check is re-pointed or retired on its own merits, by someone who has to touch it
anyway. **Trimming before then would be a refactor for its own sake** — precisely what the one-file
rule exists to prevent, and what the WO-1.4 conversation declined to do for the same reason.

## The check on `wo-gate.mjs` is a flag inside `wo-gate.mjs`, 2026-08-08

WO-2.15 gave `tools/wo-gate.mjs` a `--self-check` that copies `plans/` to a temp directory, plants
the violations the script is supposed to catch, runs the script over the copy, and fails if one of
them stops being caught. **It is a flag in the file it checks. It is not `tools/wo-selfcheck.mjs`,
and there is no `tools/lib/`.** The boundary table's first rule is why, and this is the case it was
written for: a check on a script is exactly the kind of addition that arrives looking like it wants
its own file, and the first shared helper directory is the first structural step to a framework.

This is the same argument as *"The grep half moves out"* above, arriving from the other direction.
That section moved grep-shaped work **out** of `verify-shell.mjs` because it belonged in a different
kind of tool; this one keeps a check **in** the tool it tests because splitting it would create the
seam the one-file rule exists to prevent. Neither is about file count. Both are about whether two
things share structure: `--self-check` imports nothing, is imported by nothing, and would be deleted
by deleting one function.

**It is not the second harness either, and the test is the same as `wo-sweep.mjs`'s.** It gates
nothing, it is run by hand, it has no config and no dependencies, it is never required to run or ship
the app, and it closes no 👤 item. What it adds that neither sibling could express is *"the tracker
was told the truth"* — `verify-shell.mjs` drives a browser and `wo-sweep.mjs` greps `src/`, so the
one script in `tools/` that writes into `plans/` was the only one nothing checked.

**If it starts wanting a runner, stop.** The signals to watch are this document's existing ones: a
config file, a shared helper, a plugin seam, or plants that need to be registered somewhere other
than the array they live in. The honest risk is different from `verify-shell.mjs`'s — that file grows
with the app's surface, whereas this one should grow only when `wo-gate.mjs` grows a new refusal. Nine
plants for nine behaviours. **If the plant count outruns the behaviour count, something is being
tested twice.**

**And its precondition is not a tenth plant, 2026-08-09 (WO-2.16).** `--self-check` copies the live
`plans/` and then plants against the copy, so it inherits whatever drift the trackers are carrying —
and drift is exactly what `--tick` refuses over, which made two healthy plants report failures that
were not theirs. The fix reads the trackers before anything is planted and stops with the drift as the
reason. It is **not** in the plant array and must not be moved into it: a plant asserts something
about the script, this asserts something about the fixture the plants run against, and folding the two
together is how the next reader concludes that `plans/` is what `--self-check` checks. Still nine
plants for nine behaviours; the count is the control, and a precondition is not a behaviour.

## The check on `verify-shell.mjs`'s own guard rides the ordinary run, 2026-08-17 (WO-2.38)

WO-2.36 replaced six hardcoded floor numbers in the two key-legend checks with a `vacuity` array
apiece: each anchor the read depends on asserted found, one by one, by name. **On a green tree every
arm of both arrays is dead code** — `vacuity` is empty, so nothing downstream of it is evaluated, and
the only thing that had ever executed one was a hand mutation applied twice on one afternoon and
reverted both times. A guard nobody exercises agrees with everything, which is WO-2.36's own argument
about empty lists arriving one level up. WO-2.38 factored each block's read into a function that takes
the documents' **text** rather than their paths, and added a section that hands it mutated copies in
memory: one case per arm, plus the two correct retirements that must trip none, plus a count of the
arms in the file against the cases written for them.

**It is in `verify-shell.mjs`, and the section above is why.** A sibling script was the obvious shape,
since none of it needs a browser — and it is the shape the boundary table's first rule forbids. A
sibling would need the two reads **exported**, which is the shared seam; a sibling with its own copy of
the reads is the second hand-maintained copy WO-2.36 refused for counts, agreeing on the morning it is
written and drifting after. "Needs no browser" is answered by the file itself: the precache read and
both key blocks already run before a browser is launched. That file is the one harness, not the
browser half of two.

**Where it parts from `wo-gate.mjs --self-check`: it is not behind a flag, and that is a difference in
the subject rather than in taste.** That flag copies `plans/` to a temp directory and plants
violations — it writes, it is slow, and it carries a precondition that can stop it for reasons that
are not about the script. This one is string operations on text the run has already read: milliseconds,
no writes, no fixture but the tree. **A flag would make it opt-in, and an opt-in guard against rot is
the exact fault it was built to fix** — nobody passes the flag, and the arms rot behind a green run
just as before.

**So the rule, for the next tool that wants to test itself:** the self-test lives in the file it
tests — never in a sibling, never behind an export. It **rides that file's ordinary run when it is
cheap and side-effect-free**, and stands **behind a flag when it must write, spawn or wait**, because
a slow or writing check folded into every run is how a script starts wanting a runner. Two shapes, one
rule, and the flag is the exception that has to earn itself. *(WO-2.40 asks this of
`codex-invoke.mjs`, which spawns: a flag there, on this reasoning, rather than by copying wo-gate's
answer.)*

**The mutations are in memory and never on disk**, which is not a detail: a check that edits
`index.html` or `src/`, reads, and reverts is one crash from leaving the app broken — the hazard
WO-2.37 is booked over. And **every mutation is asserted to have applied.** A `replace()` whose needle
has moved is a no-op, the read comes back exactly as the green tree's, no arm fires, and a case
written to prove an arm fires proves nothing while printing `PASS`. That is this section's own version
of the fault it is here to catch, so a needle that matches nothing fails the case by name.

**The control to watch is one case per arm, and it is a check rather than a habit.** The run counts
the arms in the file and compares that with the cases written for them, so an arm added without a case
goes red on the next run instead of on the day somebody remembers. If the case count ever outruns the
arm count, a case is testing something that no longer exists.

## The `:NNN` pointers into the harness are anchored by text, not swept, 2026-08-17 (WO-2.39)

`tools/README.md` carries about twenty `path:NNN` pointers, most of them into `verify-shell.mjs`. Three
of them were wrong by 3,522, 3,781 and 3,807 lines and a fourth by 920, inherited across at least three
work orders, and the reader who follows one lands in unrelated code and concludes they have misread the
document —
which is worse than no pointer. WO-2.35 re-pointed two, WO-2.36 re-pointed six, WO-2.39 re-pointed
four more. **The obvious answer is a sweep clause beside §11's call-site count, and it was refused.**

**What kills it is that the claim a `:NNN` pointer makes is not the claim a check can read.** The
pointer asserts *"the thing I just described in prose is on that line."* A clause can assert that the
file exists and has that many lines, and nothing else — and `verify-shell.mjs` is 22,000 lines, so
**every one of the five references this row fixed points at a line that exists.** `:10773`, `:12532`,
`:17574`, `:1869` and `src/shell.js:611` would all have passed such a check, on the day they were
wrong, which is this file's own oldest failure shape: a green-looking wrong answer. §11's existing
cross-file assertion is not that shape and that is why it earns its keep — it compares a *count*
against a grep, and a count cannot be satisfied by a wrong-but-plausible value.

**Making it non-vacuous requires the README to state the text it expects at that line — and once the
reference carries the text, the number is redundant.** The check's own precondition is the fix that
makes the check unnecessary. So the answer is the anchor, not the sweep: **name the thing in the
target file's own words** — a unique identifier, a check's quoted name, a literal line of code — and
the reference survives every insertion above it without anybody maintaining it. That is what several
comments inside `verify-shell.mjs` already do (`guardAnchor` is a *string* holding the line it looks
for, not a line number), and it is why those comments have never rotted while the numbers around them
did. `tools/README.md` § 11 carries the same note beside the WO-1.18 discussion, for the reader who is
in that file rather than this one.

**What is left uncovered, said out loud:** a text anchor can still go stale, if the code it quotes is
reworded. It fails differently, and that is the whole gain — a grep for a quoted anchor comes back
*empty*, which reads as "this is gone, go and look", where a wrong number reads as a right number.
**A clause asserting that every anchor `tools/README.md` quotes still occurs in the file it names is a
real check and is not vacuous** — an empty grep is a red. It is not built here because it needs a
machine-readable convention for which backticked strings in 1,900 lines of prose are anchors, and
inventing that convention across a file with no build step and no parser is the same retrofit §11
priced and rejected for section-end markers. If the anchors are ever written to a convention, this is
the check to reach for; it is a proposed follow-up, not an omission nobody noticed.

**And it was deliberately not booked as a work order, 2026-08-17.** The owner asked where it goes when
WO-2.39's other three follow-ups were rowed. It is not a row because **nothing it waits for is on
anyone's list**: a row whose first line is "invent a convention nobody has asked for" either sits at the
back of the order being re-read at every triage, or gets built and delivers a parser for a convention
that does not exist. **The trigger is the convention, not a queue position** — the day the anchors get
one, for whatever reason wants them to have one, this paragraph is the thing to come back to. Recorded
here rather than in the running order because a decision with no date attached is a note, and this file
is where the notes about the harness live.

*One thing that sitting turned up which this section did not know: **`src/` carries about seventy
`path:NNN` pointers of its own**, and **forty-three of them point into Roll Call!'s `dashboard.html`** —
a file in another repository, which nothing here can grep. **Those forty-three are the safest pointers
in the project, not the most dangerous**, and the first draft of this paragraph had it backwards. Roll
Call! development is **paused in favour of Planbook** (owner, 2026-08-17) and no change to it is expected
in the foreseeable future, so its line numbers are frozen: a pointer into a file nobody is editing does
not rot. It stays deployed and in daily classroom use — being **used** is not being **changed**, and only
the second one moves a line. If Roll Call! is ever picked back up, this is the paragraph that says
forty-three pointers here go stale in one sitting and nothing in this repository can detect it.*

*The pointers that actually rot are the in-repo ones, because this is the tree under daily change. A
sample of the twenty-four found at least three that miss, including one in `src/scores.css` corrected on
2026-08-10 and rotted again. So the anchor rule is the right rule beyond `tools/README.md`, the
recurrence is real, and a convention covering only the one file covers a quarter of the problem. **Not
booked either** — see `plans/work-orders/README.md` § the WO-2.42/2.43 booking note for why the standing
rule is fix-on-touch rather than an audit.*

## What it cannot do, and must never claim to

- **No 👤 item, ever.** No emulator has a thumb, a safe-area inset, a home-screen install, or
  Safari's real focus behavior. `TESTING.md`'s legend stands unchanged.
- **It is coupled to the WO-1.2 component shelf** — `#aboutModal`, `[data-modal-open]`, and the
  `window.planbook` console seam. WO-1.10 replaces `<main>` and takes all three with it. Those
  checks then degrade to announced `SKIP`s rather than false passes, which is correct behavior and
  still worthless: **a run that is mostly skips proves nothing.** WO-1.10 carries the task of
  re-pointing it at real screens.

  **Superseded on 2026-08-05 — false on all three counts; see "The trim happens at WO-1.10" above.**
  `#aboutModal` and `[data-modal-open]` were header markup, not shelf content, and `window.planbook`
  was kept deliberately. Nothing here degraded to `SKIP`; the shelf-coupled checks were re-pointed at
  real header controls instead, 201 → 209 checks, 0 skips.
- **Windows browser paths only.** It exits with a clear message elsewhere. Fine while the author is
  the only developer; a thing to fix if that changes.

## The traps live next door

Four CDP traps — the empty-but-truthy `CSSStyleRule.cssRules`, headless animations never advancing,
`setEmulatedMedia` not reaching `pointer: coarse`, and fixed debugging ports colliding — are
documented in [`../tools/README.md`](../tools/README.md) § "Driving a browser over CDP". All four
present as app defects rather than harness bugs, and two of them were diagnosed twice by two
different agents before being written down. **Do not write a second harness.** Read that section
first, and use `window.__eachRule` rather than hand-rolling a rule walk.

## If this turns out to be wrong

Back it out. The tool is one commit (`63c5e00`), isolated from app code, and nothing depends on it —
`git revert` is the whole procedure. That is deliberate: a verification tool that is expensive to
delete has already become infrastructure.
