# WO-2.20 — the orchestrator must not report a spawn as a run · implementation result

**Implementer** Claude Opus (`work-order-implementer`) · **Date** 2026-08-10
**Brief** `.claude/dispatch/WO-2.20-brief.md`

Markdown only. No app code, no tooling, no `src/`, no CSS, no storage. `git diff --stat`:

```
 .claude/agents/work-order-implementer.md  |  7 +++
 .claude/agents/work-order-orchestrator.md | 84 ++++++++++++++++++++++++-------
 .claude/agents/work-order-verifier.md     |  5 ++
 plans/dispatch-retro.md                   | 43 ++++++++++++++++
 plans/work-orders/phase-2-attendance.md   | 10 ++--
 5 files changed, 127 insertions(+), 22 deletions(-)
```

---

## Against the Acceptance list, one by one

### 1. — left `- [ ]`, deliberately, with the evidence named below

> *The orchestrator's definition, read start to finish by someone who has not seen this note, cannot
> be followed in a way that reports before the implementer returns.*

**I did the work this line asks for and I did not tick it, because the test it names is a cold read
and I am not a cold reader.** I wrote the file; I cannot be the person who has not seen this note.
The verifier is exactly that person, which is why the box is better closed by the verdict than by me.
What I can do is name the evidence, so the cold read has something to grade:

There are now **five** places a start-to-finish reader hits the rule, spaced so that no entry point
misses it:

1. **The opening paragraph, before any step** (`work-order-orchestrator.md:8-11`) — the first thing
   the file says about the role:
   > *"You do not implement — you decide **who implements**, hand them a brief they can start cold
   > from, and report what came back **once it has come back**. Your report is written in the past
   > tense about work you watched finish, or it is not written yet."*
2. **Step 2, closing the "state the route" loophole** (`:52-55`). The premature WO-3.5 report was
   made of exactly this material — the route with its reasoning — so the instruction to state it now
   says what it is not:
   > *"That statement belongs in the status file and the brief. It is not a report and it does not
   > end your turn: a route is a decision you made, not work you watched happen."*
3. **Step 4 hands off forward** (`:169-170`): *"…as its last act, then **wait for it to return**
   (step 4b) and confirm that file exists before you move on."*
4. **Step 4b is its own numbered step between the spawn and the verifier** (`:212-240`), titled
   **"Wait. The spawn is not the work"**, opening at `:214`:
   > *"**You do not write a report, a summary, or a hand-off about an implementer that has not
   > returned.** Spawn it synchronously and stay blocked on the return. If you spawn in the
   > background, step 4 is not finished until the child's report is in your hands — a report written
   > at spawn time is indistinguishable from one written at completion, and every failure WO-2.20
   > records follows from a reader being unable to tell those apart."*
5. **Step 6 states a precondition and gives a mechanical self-test** (`:258-262`):
   > *"**You are not at this step until step 4b's child returned and step 5's verifier reported.**
   > The test is the tense: if a sentence about *this dispatch* is in the future or the progressive —
   > *is running*, *should finish*, *expect* — you are still at step 4b and the report is premature."*

Two further closures a cold reader could otherwise walk through, both found by reading the file
start to finish rather than by patching the reported symptom:

- **Step 5 spawned a verifier with no wait either.** Now: *"Spawn the `work-order-verifier` subagent
  with the work order ID, and **wait for its verdict exactly as you waited at 4b** — a verifier that
  has been spawned has found nothing yet."* (`:244-245`)
- **Step 1's interrupted-run bullet told the orchestrator to re-dispatch**, which after this work
  order contradicts 4b unless the exception is named. Now: *"The row will still read `🤖 CLAIMED`
  from the dispatch that died, and this is the one case where you dispatch over a claim — so retake
  it out loud rather than around it: `--release`, then `--start`, then the brief. Step 4b is why."*
  (`:43-45`, inside the "An interrupted run" bullet)

### 2. — ✅ ticked. `phase-2-attendance.md`, line 2 of the Acceptance list

> *The dispatch-time status line says the child was spawned and is awaited, and predicts a duration
> only in words that read as a prediction.*

Two changes carry it. The step 3b bullet listing what to append at each boundary now reads
*"gates passed, route chosen, brief written, **implementer spawned and awaited**, implementer
returned…"* (`:157-161`, was "implementer dispatched"). And step 4b spells out both lines and the
difference between them (`:220-227`):

> *Two status lines, and the difference between them is the whole rule:*
> - ***At the spawn** — `implementer spawned at <tier>, awaiting return`. A duration may only appear
>   as a **prediction**, in words that read as one: "expect 20–40 min". Never "the implementer is
>   working, expect 20 to 40 minutes" — that is an observation you have not made, and it is what made
>   a sixty-second report look like a finished dispatch.*
> - ***When it returns** — `implementer returned`, and what came back. Step 5 does not exist until
>   this line is true.*

The prescribed wording is what the WO-2.20 dispatch's own status file already wrote by hand
(`.claude/dispatch/WO-2.20-status.md:5`), so the rule matches a line that exists rather than
inventing a format nobody has used.

### 3. — ✅ ticked. Step 3b, `work-order-orchestrator.md:149-155`

> *The reading phase and the blindness of the file-based signals are stated in the file, with the
> 21-minute measurement from WO-3.5 quoted as the evidence.*

Verbatim, in the file:

> ***A flat stretch in that trail is the normal case, not the alarm — say so in the trail itself.***
> *An implementer's first write is not its start. On WO-3.5 it read the brief, the mockup, the
> surfaces document and eight source files for **21 minutes between spawn and first write**; for all
> 21 minutes the status file did not grow, no result file appeared, and `git status` was unchanged.
> Those are the three signals a watcher reaches for, they go blind together, and they go blind
> **longest on the largest work orders** — the ones a duplicate dispatch hurts most. The story is in
> [`plans/dispatch-retro.md`](../../plans/dispatch-retro.md) § "The spawn reported as a run."*

It sits in step 3b because that section already framed the invisibility problem, so the reader meets
the measurement where the trail is being written rather than in a new section competing with it. It
is re-stated in one sentence at 4b where the waiting actually happens (`:229-231`), pointing back
rather than restating the numbers, so there is one copy of the measurement to go stale.

The 21 minutes is quoted from the record, not from the work order's summary of it:
`.claude/dispatch/WO-3.5-status.md:5-7` (spawn 11:56:39Z) and `:12` (first writes 08:17:xx-0400 =
12:17Z), and line 6 says it outright — *"It read for 21 minutes before its first write at 12:17Z."*

### 4. — ✅ ticked. Step 4b, `work-order-orchestrator.md:233-240`

> *The definition forbids re-dispatching over a live `🤖 CLAIMED` line and names `--release` as the
> only way a claim is cleared.*

> ***Never spawn a second implementer on a work order that carries `🤖 CLAIMED`** — not because the
> status file looks frozen, not because no result file has appeared, not because it has been quiet
> for half an hour. The claim means a dispatch is in flight and says nothing about how long it has
> been silent. If you have real evidence it is dead, clear it the one way a live claim is ever
> cleared — `node tools/wo-gate.mjs --release <WO-ID>` (step 2c) — and say in your report that you
> did. Nothing else releases a claim; the only other exit from `🤖 CLAIMED` is `--tick` on work that
> landed. `--release` is deliberate and leaves a record; a second silent spawn is neither, and WO-3.5
> paid for one with two verifier defects and a correction round.*

**One wording decision I want on the record.** The Acceptance line says "names `--release` as the
**only** way a claim is cleared," and read literally that is not true of the tool: `wo-gate.mjs:929`
lets `--tick` write over `🤖 CLAIMED`, so landed work is a second exit. I wrote *"the one way a
**live** claim is ever cleared"* and then named the other exit explicitly, rather than writing a
sentence the script contradicts. `ROUTING.md` § "Claiming comes first" is the governing text and I
checked the wording against it — it says `--release` is the way *back* from a claim, and refuses
`🔨 IN PROGRESS`; nothing I wrote restates the glyph rules or drifts from that section.

### 5. — ✅ ticked. Both files read in full, both fixed, one sentence each

> *`work-order-verifier` and `work-order-implementer` are each read and either fixed the same way or
> ruled unaffected in one sentence saying why.*

**What I checked, concretely:** the `tools:` line in each frontmatter, and every instruction in each
file that starts a process.

- `work-order-implementer.md:4` — `Read, Grep, Glob, Write, Edit, Bash, TodoWrite`
- `work-order-verifier.md:4` — `Read, Grep, Glob, Bash`

**Neither has the `Agent` tool, so neither can spawn a subagent and neither can report a spawn as a
run in the shape this work order describes.** That is the "ruled unaffected" half, and it would have
been the whole answer — except both are told to run `verify-shell.mjs`, which took **184 seconds** on
this machine today, and a backgrounded Bash call written up before it exits is the same defect at
smaller scale: a prediction in the clothes of a result. So both got a fixed sentence rather than only
a ruling, and the ruling is stated inside the fix so the next reader sees why the rule is short.

`work-order-implementer.md`, § "Report back" (`:54-59`):

> ***Report a command's result only from output you actually read.** You spawn nothing — you have no
> `Agent` tool — so you cannot report a spawn as a run in the shape WO-2.20 describes. The one
> version of that failure available to you is a backgrounded Bash call written up before it exited:
> `verify-shell.mjs` takes about 160 seconds, and "the harness passes" typed while it is still
> running is a prediction wearing a result's clothes. Wait for the exit, quote what it printed, and
> if you had to stop before it finished, say that instead of guessing the ending.*

`work-order-verifier.md`, § "Start with the mechanical pass" (`:27-30`):

> ***Wait for both to exit and quote what they printed.** You spawn nothing — you have no `Agent`
> tool — so you cannot report a spawn as a run in the shape WO-2.20 describes; the one version of
> that failure available to you is a backgrounded Bash call reported before it exited, and
> `verify-shell.mjs` runs about 160 seconds. A verdict is evidence you read, never a run you started.*

Placement is deliberate in both: the verifier's lands in the section that runs the commands, the
implementer's in the section that writes the claim about them.

### 6. — left `- [ ]`. It cannot be closed by this run, and I made no quiet change to it

> *The next real dispatch after this lands produces a report that arrives when the work does.*

Untouched: no tick, no 👤 mark, no `**Owes**` field. It names an event in the *next* dispatch, and
this dispatch is not it. See "The judgment call I was asked to propose rather than make" below.

---

## The mechanical pass — regression guards, not evidence

Both ran here, both green, and **neither is evidence for any line above.** This work order changed
five Markdown files; no harness in this repo reads an instruction file, and I did not add one (the
brief forbids it and I agree — see the follow-up note).

```
node tools/wo-sweep.mjs      15 checks · 14 passed · 0 failed · 1 to review
node tools/verify-shell.mjs  554 checks · 554 passed · 0 failed · 0 skipped · 184s
node tools/wo-gate.mjs --audit   PASS
```

- **`wo-sweep`** — the single `REVIEW` is the standing sensitive-field-names one (174 mentions across
  12 files), unchanged in count and file list from what WO-3.5 left. No new REVIEW.
- **`verify-shell`** — 554/554, which is exactly the number WO-3.5's correction round landed
  (`WO-3.5-status.md:21`). 0 skipped, so no fixture quietly stopped existing. It **did** run here;
  the sandbox note in the brief did not bite this session.
- **`wo-gate --audit`** — run because I ticked four boxes in a phase file. PASS: every roadmap
  fragment matches one box, the one `**Owes**` pointer still resolves, every dashboard row matches
  its own boxes (Phase 2 stays 12/16 — WO-2.20 has no roadmap box by design, and it stays open on
  lines 1 and 6 anyway).

---

## What I ticked, and what I did not

Ticked in `plans/work-orders/phase-2-attendance.md`: **lines 2, 3, 4, 5.** Each is a claim about text
that is now in a file, and the text is quoted above.

Left blank: **line 1** (a cold-reader test I am structurally unable to perform on my own prose — I
named the five enforcement points instead) and **line 6** (an event that has not happened). Neither
is a 👤 line; I ticked no 👤 line anywhere and this work order has none. `--tick` will therefore hold
WO-2.20 at `🔨 IN PROGRESS` and name lines 1 and 6, which is the correct reading of its state.

---

## The judgment call I was asked to propose rather than make

**Line 6 should stay `- [ ]` with no marker, and here is why the two available markers are both
wrong** — I checked the tooling rather than reasoning from the prose alone:

- **`**Owes**` does not fit, and would break the build.** It is machine-checked, not decorative:
  `wo-gate.mjs:326-335` requires the field and a `→ WO-x.y` marker on the line to name each other,
  and `--audit` fails on a pointer that does not land on another work order's open box
  (`:1763-1789`). Line 6 owes nothing to a *work order* — it owes to the passage of one dispatch.
  Writing `**Owes** — the next dispatch` would turn a green `--audit` red.
- **👤 does not fit either.** 👤 is a claim about *hardware* — `ROUTING.md` § "Implementers may tick":
  *"👤 lines still need a real iPad. No agent has one."* Line 6 needs no iPad. Marking it 👤 would
  overload a mark whose precision is the reason it works, and would tell a future reader to go find
  a tablet.

**My proposal:** leave it bare. The line's own parenthetical already does the job a marker would
(*"This is the only line that cannot be checked at the desk, and it is deliberately last"*), and it
closes the natural way — the next orchestrator dispatch runs, its report arrives with the work, and
the teacher or that dispatch's verifier ticks the line on that evidence. If the owner wants it
tracked rather than remembered, the honest mechanism is a one-line note in `plans/dispatch-retro.md`
§ "The spawn reported as a run" saying the box is open pending the next dispatch. I did not write
that note, because it is a maintenance decision and this is the one line the work order says nobody
closes at the desk.

## The Out-of-scope temptation I declined, as a proposed follow-up

The instrument was tempting exactly where the work order said it would be. While writing 4b — *"a
flat status file… is not evidence the child died"* — the obvious next sentence was *"so here is how
to tell that it did."* **I did not write it, and I built nothing.** No heartbeat file, no polling
loop, no progress protocol, no new tool, no harness check. The work order rejected that fix in
advance and the rejection is sound: an orchestrator that does not speak until its child returns has
no window in which anyone must guess, so there is nothing for an instrument to see through.

Two things I noticed that belong in a future work order rather than this one:

- **Proposed follow-up: agent liveness, if the coordinator layer ever needs it.** The one signal that
  actually separated "reading" from "dead" on 2026-08-10 was token usage, which no file exposes. That
  matters only for a watcher *outside* the orchestrator — a coordinator supervising a backgrounded
  dispatch. WO-2.20 removes the need for it inside the pipeline; it does not remove it for a human
  watching from a terminal. Size feels S–M and it is worth writing only if someone actually gets
  burned again.
- **Not proposed, named for completeness: a harness check on the agent definitions.** The brief
  forbids adding one and I agree with the forbidding. A grep asserting that
  `work-order-orchestrator.md` contains the string "wait" is theatre — it would pass over a file that
  had been rewritten to say the opposite. This deliverable's correctness is prose semantics, which is
  what the verifier is for.

## A note on the file-length rule I had to work against

`work-order-orchestrator.md`'s own closing rule is *"Keep this file short. It grew 169 → 274 lines in
one day and every dispatch paid to read all of it."* I took it **269 → 319 (+50)**, which is real
cost on every future dispatch and I do not want it discovered rather than disclosed.

How I held it down: the full WO-3.5 narrative — the sixty-second report, the coordinator's read, the
19 concurrent minutes, the two defects with their `file:line`s, the rejected heartbeat fix — went to
`plans/dispatch-retro.md` (+43 lines) under **§ "The spawn reported as a run — WO-3.5, and the 21
minutes nothing could see"**, placed immediately after § "When the orchestrator itself is what was
interrupted" because both sections are about the same thing: a status line is a claim about the past.
What stayed in the agent definition is the imperative plus the one measurement the work order names,
and the retro is linked once rather than summarised.

I also wrote one thing into the retro that is not narrative and not an instruction, and I flag it as
a judgment call: **the WO-3.5 status file struck its wrong line through rather than deleting it**
(`~~FALSE START~~`, annotated), and that is the only reason the section could be written from the
record instead of from memory. I made that a one-sentence rule there — *"a status trail that edits
away its own mistakes cannot teach anything"* — because it is a lesson about the trail, and the trail
is what this work order is about. If the verifier reads that as scope creep, it is one sentence and
it deletes cleanly.

## Files changed

- `c:\dev\planbook\.claude\agents\work-order-orchestrator.md` — new step 4b; step 3b reading-phase
  paragraph and status-line bullet; step 1 interrupted-run claim exception; step 2 route-is-not-a-
  report clause; step 4 forward reference; step 5 verifier wait; step 6 precondition and tense test;
  opening paragraph.
- `c:\dev\planbook\.claude\agents\work-order-implementer.md` — one paragraph in § "Report back".
- `c:\dev\planbook\.claude\agents\work-order-verifier.md` — one paragraph in § "Start with the
  mechanical pass".
- `c:\dev\planbook\plans\dispatch-retro.md` — new § "The spawn reported as a run — WO-3.5, and the 21
  minutes nothing could see".
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — Acceptance lines 2, 3, 4, 5 ticked.

No `CHANGELOG.md` entry written, no commit, no push.

## Draft `CHANGELOG.md` entry, for the teacher to accept, rewrite or bin

> **Dispatch pipeline** — the orchestrator now waits for the implementer it spawned before it reports
> anything, instead of describing a launch as a run. The status line it writes at dispatch says
> `spawned, awaiting`, a predicted duration is written as a prediction, and a work order already
> marked `🤖 CLAIMED` cannot be handed to a second implementer without `--release` first. The reason
> is in the file where the next reader will hit it: an implementer's first write is not its start —
> on WO-3.5 it read for 21 minutes before touching anything, and for all 21 minutes the status file,
> the result file and `git status` said the same thing they say about an agent that has died.
