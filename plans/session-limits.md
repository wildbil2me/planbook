# Session limits — what actually kills a dispatch, and seven things that would help

**Status: brainstorm, 2026-08-29. Nothing here is decided and nothing is built.** The owner asked
for proposals after the Phase 5 run took three quota deaths in two days. Findings are measured;
the proposals are arguments, not rulings. `plans/dispatch-retro.md` remains the record of what
went wrong — this file is about why it keeps going wrong at the same moment.

## How the numbers were taken

All of it comes out of the transcripts `tools/wo-cost.mjs` already reads
(`~/.claude/projects/c--dev-planbook/`, main sessions plus `subagents/*.jsonl`), so it is
re-derivable and it is not a survey of impressions:

- `node tools/wo-cost.mjs` and `--detail <WO>` for the per-stage decomposition.
- Scratch passes over the same transcripts for session-limit events, per-dispatch weighted cost,
  and what fills implementer context. Those were throwaway; if any of this gets acted on, the
  first two belong in `wo-cost.mjs` as flags rather than being rebuilt a fifth time, which is the
  same argument that produced `wo-cost.mjs` itself.

**The unit is a weighted proxy, not a vendor number.** Output x5 + cache-write x1.25 + input x1 +
cache-read x0.1, summed per API response — relative price units, called **M units** below. It is
only ever compared against itself: dispatch cost and usage-at-the-limit are measured on the same
scale, so the ratio is meaningful even though the absolute figure is invented. Read a single
"20.3M" as *the size of the hole*, never as a published ceiling.

## Four findings

### 1. Every documented death is at a handoff. Ten for ten.

Not "usually", not "mostly". Ten dispatches carry a session-limit death in their status files or
in `dispatch-retro.md`, and in every one the killing API call was a **parent resuming after a
child returned**:

| WO | Where it died |
|---|---|
| WO-1.4 | orchestrator, mid-run, while the implementer kept working |
| WO-2.46 | step 5, moments after spawning the verifier |
| WO-3.26 | between the implementer's writes and any verdict |
| WO-4.2 | between the last write and anybody's first reading |
| WO-4.4 | between the last write and verification |
| WO-4.5 | at the handoff to the verifier |
| WO-5.1 | at the handoff to the implementer's return |
| WO-5.2 | between the implementer's return and the verifier's spawn |
| WO-5.3 | at the handoff to its verifier |
| WO-5.4 | at the handoff back from the implementer |

This is mechanical rather than unlucky. The handoff is the first API call the parent makes after
its child has spent the window, and it is the largest context the parent will ever carry. **The
orchestrator is not dying of its own consumption — it is dying of the implementer's.**

The audit already in `work-order-orchestrator.md` § 3b says orchestrators carry a session-limit
message in 22% of runs against 11% for implementers and 10% for verifiers, and reads that as *the
orchestrator idles longest*. The cost data says something sharper: the orchestrator is **15.3%** of
a dispatch's spend and the implementer is **69.3%**. The role that dies twice as often as the
others spends a fifth as much. It is a passenger in a crash somebody else drove into.

### 2. A large work order is most of a window on its own.

Across 124 measured dispatches:

| | M units |
|---|---|
| median dispatch | 6.0 |
| p75 | 8.8 |
| p90 | 12.9 |
| largest | 20.0 |

Against rolling-5h usage measured **at the moment of** the 48 grouped limit episodes: p25 **16.4**,
median **20.3**, p75 **25.1**. (The spread is wide because the account was swapped repeatedly
across August — the ceiling itself moved. The median is the honest planning number.)

So the arithmetic that matters: **a window holds about three median dispatches, or one large one
plus its own recovery.** The three Phase 5 rows that died are 15.7 (WO-5.2), 13.3 (WO-5.4) and
12.2 (WO-5.3) M units — each of them 60–75% of a window *by itself*, before anything else that day.

And on 2026-08-28 seven dispatches ran: WO-5.1, WO-1.32, WO-1.33, WO-1.34, WO-1.35, WO-5.2, WO-5.3.
Three of them died, and they are the first and the last two.

### 3. Cost is turns x context, and the context is prose.

Implementer runs sit at **213–356 turns** with **peak context 334K–497K** and 45–102M raw cache
reads. Every turn re-sends the whole conversation, so context size is a multiplier on every
remaining turn, not a one-off charge. Halving peak context is worth more than halving the work.

What fills it, across 157 implementer runs (mean 344 KB of tool results per run):

- **Read 58.8%**, Bash 37.7%, Grep 2.4%, everything else under 1%.
- Largest cumulative single targets: `tools/verify-shell.mjs` 4.81 MB, `tools/README.md` 2.75 MB,
  `src/shell.js` 1.40 MB, `tools/wo-sweep.mjs` 1.06 MB, `index.html` 0.84 MB, `TESTING.md` 0.80 MB.

The harness half of that is already fixed — `tools/verify/` split it up. The prose half is not:
`TESTING.md` is **9,319 lines / 765 KB** and `tools/README.md` is **3,197 lines / 286 KB**. An
implementer that reads either whole has spent a large fraction of a window on a file it needed one
section of.

### 4. The corpse is the expensive part, not the death.

A clean Phase 5 dispatch runs 67–68 minutes (WO-5.5 6.8M, WO-5.6 7.9M). The three that died ran
113–149 minutes at 12–16M. **Dying roughly doubles both.** Add that the recovery is a documented
seven-step walk executed from memory by a tired session, and that two of the corpses (WO-5.1,
WO-5.4) were carrying live mutations under paperwork that read finished.

## Proposals

Ranked by effect over cost. The first two need no code at all and would have prevented most of
the ten.

### P1 — Check the window before every `--start`, and stop budgeting by the size column

**The `Size` field does not predict cost, so this cannot be a rule that fires only on large rows.**
Measured against the declared sizes:

| WO | Size | M units | |
|---|---|---|---|
| WO-5.5 | S | 6.8 | clean |
| WO-5.6 | S | 7.9 | clean |
| WO-5.4 | S | 13.3 | died |
| WO-5.1 | M | 7.2 | died |
| WO-4.5 | M | 11.5 | died |
| WO-4.3 | M | 11.6 | clean, two verifier passes |
| WO-5.3 | M | 12.2 | died |
| WO-5.2 | M | 15.7 | died |

S runs 6.8–13.3 and M runs 7.2–15.7. The ranges overlap almost entirely, and the most expensive S
outran five of the six Ms. Some of the spread is recovery cost on the rows that died — but that is
the point rather than a confound: **the size column describes the work, and what the window pays
for is the run, including the part where it goes wrong.**

So the pre-flight question is not *is this one big enough to worry about*. It is *is there a window
to fit any dispatch in*, asked every time: read `/usage` before `--start`, and do not open **any**
dispatch on a window more than about 40% spent. Start it at the top of a fresh one instead.

This is owner-side by construction: `/usage` is a terminal command and no agent can read it, so
this cannot become a gate in `wo-gate.mjs`. What `wo-gate.mjs` could do is print the expected cost
beside the size on `--start` — "Size L, median 12.9M units, budget accordingly" — so the number is
in front of whoever is deciding. Cheap, and it makes the rule visible at the only moment it can
be obeyed.

**Objection worth taking seriously:** this converts a capacity problem into a scheduling
constraint, and Ship 3 is calendar-pressed against Sep 2. The answer is that it is already costing
that time and more — see finding 4 — just unpredictably and after the fact.

### P2 — Plan the verifier into a fresh window, on every dispatch

Six of the ten deaths are at the implementer/verifier seam. That seam is also the one place the
pipeline is **already proven to survive a break**: WO-5.2 and WO-5.4 both had the verifier
re-dispatched alone, cold, against a recovered tree, and both produced real verdicts — WO-5.2's
found a defect. The verifier is designed to run with no memory of the build. It is 15.4% of spend.

So: stop after the implementer returns, write the status line, and dispatch the verifier as a
**deliberate** fresh start. This does not weaken anything — the verifier's whole value is cold
eyes, and a planned cold start is strictly better than the accidental one the quota imposes. It
converts the single most dangerous moment in the pipeline into a scheduled boundary.

**Uniform, not size-gated, for the reason P1 gives**: nothing predicts which dispatch is the
expensive one, so a rule that fires selectively fires on the wrong ones. It is also the only
proposal here that needs no forecast at all — it does not ask anyone to guess a cost, only to stop
at a boundary that already exists.

**This is not § 4b renegotiation.** § 4b forbids *reporting on a child that has not returned*. Here
the child has returned and been recorded; what moves is only when the next child is spawned.

### P3 — A mutation ledger, so an armed corpse announces itself

`grep -rn MUTATION` has paid for itself three times and it depends on the implementer having
written the word `MUTATION` in a comment before it died. Nothing guarantees that, and the failure
mode is silent and dangerous.

Proposal: before making a mutation, the implementer writes `.claude/dispatch/<WO>-armed.json` —
the file, the line, and the pre-mutation `git hash-object` blob — and deletes it after reverting.
Then:

- a recovering session sees the armed state as a **positive assertion** rather than inferring its
  absence from a grep that may be looking for nothing;
- the revert is mechanical (`git cat-file` the recorded blob) instead of reconstructed by reading;
- `wo-gate.mjs --tick` refuses while the file exists, which is the one place a fence would have
  caught WO-5.1 — that corpse had all six boxes ticked over an open disclosure hole.

Two writes per mutation, and it closes the gap `wo-sweep.mjs` § 20 claim 5 deliberately does not:
claim 5 guards one file, and a mutation anywhere else still names nothing a grep looks for.

### P4 — Take the mutation round out of the implementer's run

Both dangerous corpses (WO-5.1, WO-5.4) died mid-proof, at turn ~230 and ~265 of a run that had
already spent most of a window. The mutation round is the last thing the implementer does and it is
therefore the thing most likely to be interrupted — the pipeline schedules its most dangerous
operation at the moment it is least able to finish it.

Proposal: mutation proofs become a separate micro-dispatch after the verifier passes. Small, cheap,
starting on a fresh budget, doing one thing. The tree is armed for a handful of turns instead of
being armed at the tail of a 300-turn run.

**Cost, stated:** it is a fourth stage in a pipeline the retro says is already expensive, and it
adds a second dispatch to every work order that mutation-proves. P3 is the cheaper half of the same
protection and does not restructure anything; if only one of the two happens it should be P3.

### P5 — A context diet on the two giant prose files

`TESTING.md` at 9,319 lines and `tools/README.md` at 3,197 lines are read whole by implementers
that want one section. A `node tools/section.mjs TESTING.md WO-5.4` extractor, named in the brief
as the way to read them, attacks the 69% directly and costs one small tool. The same trick the
`tools/verify/` split already applied to the harness, applied to prose.

This is the only proposal here that reduces the *underlying* consumption rather than routing
around it. It is also the one whose benefit is hardest to predict, because a large share of those
reads may be one-off orientation an extractor cannot serve.

### P6 — Encode the recovery walk as a tool

`dispatch-retro.md` now specifies a recovery walk in prose across six sections: `git status
--short` first, diffstat for CRLF damage, `grep -rn MUTATION` before anything else, delete and
re-measure every number in the dead run's prose, check `tools/README.md`'s count against the
harness, diff comments against the code they sit on. Six dead dispatches means six chances to
execute that from memory, tired, at the end of a burned window.

`node tools/dead-dispatch.mjs <WO>` could run the mechanical half and print the rest as a
checklist. It closes no box and replaces no judgment — it just stops step three being forgotten.

### P7 — Let the orchestrator do its post-return work before it spawns

Small and structural. The orchestrator's post-handoff turn is the one that dies; make it as thin
as possible by writing the verifier's brief **before** spawning the implementer, so what remains
after the return is a status line and a spawn. Marginal on its own; free if P2 happens anyway.

## What I am deliberately not proposing

**A spawn-and-exit orchestrator.** § 4b refuses it and the refusal is correct — it buys back the
idle wait and pays with the one guarantee WO-2.20 bought, that no report exists about a child that
has not returned. WO-3.5 cost two verifier defects and a duplicate implementer to that exact
ambiguity. The finding in § 1 makes the orchestrator look like the victim, and the tempting
inference is that it should not be alive during the build. **That inference is wrong**: it is not
the orchestrator's *aliveness* that costs anything (15.3%), it is that its next turn falls on the
far side of the implementer's spend. P2 moves the turn. It does not delete the observer.

**Any form of "retry on 429".** A dispatch that resumes into the same exhausted window resumes
into the same wall, and the tree is then armed for longer rather than shorter.

**Persisting a cooperative pause.** WO-5.2 already proved this one: a pause queued at the
implementer/verifier seam was never read, because the orchestrator got no further tool round. A
pause that depends on the agent taking another turn cannot survive the death of that turn, and the
seam it aims at is the seam the quota kills.
