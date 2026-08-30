# WO-1.38 — the verifier is spawned on the far side of the implementer's spend · implementer result

**Route** Claude Opus (work-order-implementer) · **Date** 2026-08-30
**Verdict I am claiming** all seven Acceptance lines met. No 👤 line, no 📆 line, nothing left undone.

---

## The two decisions the work order left to me

### 1. The glyph and the word: `🔍 AWAITING VERDICT — <dispatch>`

**It is the owner's to overrule, and the behaviour is not** — WO-1.35's precedent for 🎒, stated in
`CLAUDE.md` § Commands and now written into `plans/work-orders/README.md` § "Status vocabulary" for
this one too. Changing it is one constant, `AWAITING`, in `tools/wo-gate.mjs`, plus the prose.

Why 🔍 out of the candidates:

- It reads as *this is for review*, which is the row's whole business, and nothing in the existing set
  (⬜ 🤖 🔨 ✅ 🚧 🔒 🚫 ⏳ 🚩 👤 📆 🎒) is near it.
- ⏸ and ⏳ were the obvious alternatives and both are wrong in the same direction: they read
  **stalled**, and this row is healthy. ⏳ is also taken, for *deferred*, and a second hourglass-ish
  glyph beside it would blur the one distinction WO-1.21 paid to draw.
- 🧪 reads as *the harness / the mutation round*, which is exactly the thing this status must not be
  read as covering (Trap 3).

Why **AWAITING VERDICT** rather than *VERIFYING*, *IN REVIEW* or *UNVERIFIED*:

- The status covers both halves of the wait — before the verifier is spawned and while it runs — and
  *VERIFYING* is false for the first half. *Awaiting a verdict* is true throughout.
- *UNVERIFIED* is true of ⬜ and 🔨 as well, so it names nothing.
- It avoids the word **owed**, which `**Owes**` already owns as a header field with a different
  meaning.

### 2. What the new state does everywhere else

Decided deliberately, written into the header comment block of `tools/wo-gate.mjs` so it is not
re-derived, and each one proved by a plant or by an existing one:

| Where | What it does | Why |
|---|---|---|
| `--handoff` | **writes** it, from `🤖 CLAIMED` only | Only a claim had an implementer to return from. A handoff over `⬜` records a build that never happened |
| `--release` | **refuses** it, and names the result file it would orphan | Trap 1. This is the whole reason the status exists |
| `--tick` | **accepts** it | The tick *is* the verdict path. Under this rule every dispatch reaches `--tick` from `🔍`, so a `--tick` that refused it would end every dispatch at a hand edit of the one line this script exists to write. An open Acceptance line still holds it at `🔨 IN PROGRESS`, exactly as from a claim |
| `--start` | refuses it | As it refuses every status that is not `⬜`, with its own named sentence |
| **a dependency** in another gate report | **still refuses** — it is not `✅ DONE`, and the refusal says *its implementer returned and nothing has checked it* | The brief's warning: a state that silently unblocked would be a defect nothing in the Acceptance list catches. It is now the fifth plant assertion and mutation **M10** below |
| `--audit` | **says nothing about it**, deliberately | `--audit` reports *two documents disagreeing*; a status word is one document's own fact. It says nothing about `🤖` or `🔨` either, and a "this verdict has been owed N days" report would need a clock `--audit` does not read. Stated in the header comment so the next reader does not read the silence as an oversight |
| `calendarHold()` / 📆 | untouched — `🔍` does not qualify as code-complete | Fence 1 takes `🔨` and only `🔨`. Asserted in the new dependency plant |
| the `🎒` shelf count in `--audit` | untouched — a `🔍` row is not `⬜`, so it is not shelf | Correct by construction: a built, unverified row is not somewhere to fold an hour of work into |

**One state-machine question the work order did not settle, and how I went.** A verifier **FAIL** does
not leave the status. The correction goes back to the same implementer and the verdict is still owed,
so the row stays `🔍 AWAITING VERDICT` until `--tick`. I did **not** invent a fifth status for *being
corrected* and did not add a `--reclaim`: it would put a row in a state `--tick` has never seen, for a
fact nobody reads. Written into § 5 of the orchestrator, the `--help` text and the header comment.

---

## Against the Acceptance list, one by one

**1. `§ 5` says fresh session on every work order, `§ 6` says the report names the verifier as owed — ✅**

`.claude/agents/work-order-orchestrator.md` § 5 is retitled *"Record the handoff and stop — the
verifier is a fresh session, on every work order"* and opens **"This run ends when the implementer
returns… The verifier is a **new dispatch from a new session**, always. Do not spawn it from here."**
It carries the `--handoff` command, the evidence (ten deaths at a handoff, six at this seam,
`plans/session-limits.md` § P2), the explicit **"This is not § 4b renegotiation"** clause, Trap 2 in
as many words (*"Tell the verifier it is a first pass… self-claims go over as claims to check, never
findings to confirm"*), and Trap 3 (*"It buys nothing against a live mutation either… `grep -rn
MUTATION` is still the first move"*).

§ 6 is now *"Report — two of them now, one at each stop"*, and the boundary report **"says the
verifier is owed. It does not say the work verified, it marks no Acceptance list, and it relays no
self-claim as a finding"** — with the tense test moved to the top so it governs both reports, and
Trap 4 named at the boundary (*"a boundary is the easiest place in this pipeline to write a
spawn-time report by accident, which is the WO-3.5 defect"*).

Verified by reading the file. Four smaller edits keep it consistent: § 1 (a `🔍` row is not a new
dispatch — go to the second half of § 5), § 2c (read the tree before acting on the stale-claim cue),
§ 3b (the status trail gains *handoff written* and is **kept until the verdict**, because deleting it
at the implementer's return now deletes it exactly at a session boundary), and § 4b's *"the only
other exit from `🤖 CLAIMED` is `--tick`"*, which my change made false and which now reads
`--handoff`. **§ 4b's wait rule itself is untouched.**

**The standing rule's line count.** It read `354` over a 412-line file. It now reads **469** and the
file is 469 lines — `wc -l` and `grep -c ""` agree, and the file ends in a newline. The rule's own
history sentence gained the fact that it sat at 354 through every edit between, which is the rule
failing on itself.

**2. `AGENTS.md` carries the same rule — ✅**

A new paragraph, *"The verifier is a fresh session, on every work order, and there is a status for the
gap"*, written for the implementer's point of view: what the row reads before and after you return,
that `--release` refuses the second one and why, that **your self-claims cross the boundary as claims
to check**, and that **none of this narrows the armed-mutation window** — with a pointer back to the
revert-first rule in the same file rather than a paragraph count.

**3. A state `wo-gate.mjs` writes and reads, distinct from both an in-flight claim and an abandoned one — ✅**

Written by the new `--handoff`, read in `STATUSES`, `gate()`, `next()`, `reportSkips()`,
`applyStart()`, `applyRelease()`, `applyTick()` and `--help`. Distinct **by the tool**: `--release`
accepts `🤖` and refuses `🔍`, `next` prints two different sentences, and the gate report prints two
different NOTEs. Live proof on the real tracker:

```
$ node tools/wo-gate.mjs --handoff WO-1.38 --dry-run
handoff WO-1.38 — the verifier is spawned on the far side of the implementer's spend   (DRY RUN — nothing written)

plans\work-orders\phase-1-shell-store-roster.md:3499
  - **Ship** — · **Status** 🤖 CLAIMED — 2026-08-30 · **Size** S · **Depends on** — · **Blocks** nothing by name;
  + **Ship** — · **Status** 🔍 AWAITING VERDICT — 2026-08-30 · **Size** S · **Depends on** — · **Blocks** nothing by name;

NOT touched: the roadmap, the dashboard, and every checkbox. A handoff is not a verdict — the dashboards count ✅ DONE and nothing else.
DRY RUN | re-run without --dry-run to apply.
EXIT=0
```

I left the live row at `🤖 CLAIMED`: writing the handoff for real is the orchestrator's step 5, not
mine.

**4. `next` skips such a row and says which of the three it is — ✅**

The skip sentence names the three the work order's line 3 names — *a dispatch in flight, an abandoned
claim, or this*:

```
  🔍 AWAITING VERDICT — 2026-01-01: the implementer returned and the verifier is owed. A row that
  looks claimed is one of three things, and this is the third — not a dispatch in flight, not an
  abandoned claim, but a FINISHED build with no verdict on it. So --release refuses it: it would
  orphan the result file and offer a complete unverified tree as unstarted work. Dispatch the
  verifier from a fresh session, then: node tools/wo-gate.mjs --tick WO-9.9
```

Same shape as the skipped 🔨 and 🎒 — `skipped <ID> — <title>`, then one indented line ending in what
to do about it. The 🤖 sentence gained a second line pointing at it, because the dangerous row is a
claim whose orchestrator died *before* `--handoff` and whoever reads *"if that dispatch is gone:
`--release`"* over one of those is one keystroke from unclaiming a finished tree. Live, on the real
running order:

```
skipped WO-1.38 — the verifier is spawned on the far side of the implementer's spend
  🤖 CLAIMED: a dispatch has claimed it, so this steps over it. If that dispatch is gone: node tools/wo-gate.mjs --release WO-1.38
    Read the tree before you release it. A claim whose implementer FINISHED is 🔍 AWAITING VERDICT — one row down in this list if it has been marked, and node tools/wo-gate.mjs --handoff WO-1.38 if it has not. Releasing that one throws the build away
```

**5. `--release` refuses; the refusal is driven and proved, not asserted in a comment — ✅**

It **refuses** (it does not merely warn) and it **also** names the result file. The plant is
`--release refuses 🔍 AWAITING VERDICT, names the result file it would orphan, and writes nothing` —
it writes a real `WO-9.9-result.md` into the sandbox's `.claude/dispatch/` so the naming is asserted
against a report rather than against a path, asserts the exit code, asserts the status did not move,
asserts nothing anywhere was written, asserts the file is named, asserts the phrase *abandoned claim*
is in the refusal, and then — on the same tree — asserts `--release` **still works on a real claim**,
so a fence that refused everything could not pass it.

Driven, not asserted: **twelve mutations**, all via `--self-check --against` over a copy in the
scratchpad, so the repository was never mutated. Every one went red on the plant it was aimed at and
on nothing else:

| | Mutation | Red |
|---|---|---|
| M1 | `--release`'s fence widened to accept `🔍` too | the release plant |
| M2 | the refusal stops naming the result file | the release plant (that assertion alone; the refusal stays green) |
| M3 | the *abandoned claim* sentence deleted from the refusal | the release plant |
| M4 | `--handoff`'s "only `🤖 CLAIMED`" fence dropped | the handoff plant, on all eight refused statuses |
| M5 | `--handoff` writes on `--dry-run` too | the handoff plant |
| M6 | `--handoff` moves a dashboard as well as the status line | the handoff plant |
| M7 | `next` does not skip the status at all | the `next` plant |
| M8 | the `🔍` branch removed from `reportSkips()`, so it falls through to 🔨's sentence | the `next` plant |
| M9 | the claim's skip stops naming the handoff | the `next` plant |
| M10 | `gate()`'s `ok` widened to `✅ DONE` **or** `🔍` | the dependency plant |
| M11 | `--tick` refuses the status | the dependency plant |
| M12 | `--tick` writes `✅ DONE` over an open line when the status is `🔍` | the dependency plant |

Six of the twelve are tabulated in `tools/README.md`'s mutation table with what did *not* go red
beside them, per that table's convention; the prose there says the other six were run and names them.

**6. `--self-check` is green with a plant behind each new check and its own count up by that many — ✅**

**27 → 31.** Four new plants, one per new behaviour, appended last in the array (with a comment
saying why: one of them writes outside `plans/` in the sandbox, and a gate report run after it would
carry a `dispatch result` line no earlier plant has seen).

```
$ node tools/wo-gate.mjs --self-check
ok   | --handoff writes 🔍 AWAITING VERDICT over a claim, refuses every other status, and its --dry-run writes nothing
ok   | --release refuses 🔍 AWAITING VERDICT, names the result file it would orphan, and writes nothing
ok   | `next` steps over a 🔍 AWAITING VERDICT row with its own sentence — not the claim's, not the part-built one — and reaches the row below it
ok   | 🔍 AWAITING VERDICT is not ✅ DONE where it counts — a dependent's gate still refuses it, and the tick path still runs from it
PASS | 31 of 31 plants were caught.
EXIT=0
```

The run's closing summary and its "what this does not cover" paragraph were extended in the same
edit, and `tools/README.md`'s two counts (`plants twenty-seven violations`, `27 of 27`) were moved to
thirty-one — the count that turned the sweep red on WO-3.26 was in that file, so it was corrected in
the same pass rather than left for a later reader.

**7. `wo-sweep.mjs` green and `--audit` green — ✅, with one caveat stated**

```
$ node tools/wo-sweep.mjs        → 34 checks · 31 passed · 0 failed · 3 to review     EXIT=0
$ node tools/wo-gate.mjs --audit → PASS | every fragment matches exactly one roadmap box, …   EXIT=0
$ node tools/verify-shell.mjs    → 1284 checks · 1284 passed · 0 failed · 0 skipped · 420s   EXIT=0
```

The sweep's three `REVIEW` items are the standing pre-existing ones (sensitive field names outside
`src/backup.js`, due-date-and-late on one line, two mockup banners) — they are not failures, the
summary counts 0 failed, and I touched no file any of them names.

**The caveat, so the verifier can judge it rather than take my word:** the line says *"on a clean
tree"* and the tree is **not `git`-clean** — it holds exactly this work order's seven modified files
and nothing else, because I was not told to commit. What I can say is that both commands were green
*on that tree*, and that this is a real reading rather than a technicality: `wo-sweep`'s
CACHE-bump check reads the working tree, and it passed because nothing I touched is in `SHELL`.
Neither tool left anything behind, and `--self-check`'s precondition (the trackers must be clean
before it plants) passed, which is the other reading of "clean tree" and the stricter one.

---

## Files changed

- `C:\dev\planbook\tools\wo-gate.mjs` — +361 / −14. The status, `--handoff`, the four reads, the four
  plants, the header design record, `--help`.
- `C:\dev\planbook\.claude\agents\work-order-orchestrator.md` — +85 / −28. §§ 1, 2c, 3b, 4b, 5, 6 and
  the line count.
- `C:\dev\planbook\AGENTS.md` — +16 / −0.
- `C:\dev\planbook\plans\work-orders\README.md` — +21 / −3. § "Status vocabulary" and two paragraphs
  under it.
- `C:\dev\planbook\plans\work-orders\ROUTING.md` — +15 / −1. § "The pipeline" — it described the three
  agents as one continuous run, which my change made false; the brief said judging that was in scope.
- `C:\dev\planbook\tools\README.md` — +39 / −10. The `wo-gate.mjs` row, the writers sentence, a fourth
  status paragraph, the plant counts, six mutation rows and the tally.
- `C:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — +8 / −8. Seven Acceptance boxes
  ticked, and the status line, which is back exactly as I found it (see below).

No `src/`, no `index.html`, no `sw.js`, so no `CACHE` bump is owed. All seven files are LF, measured
in their own bytes; no line-ending damage. `grep -rn MUTATION` over `tools/`, `plans/`,
`.claude/agents/` and `AGENTS.md` finds only pre-existing prose — **no live mutation in the tree.**

## Two things I did that need saying

**I ran `--release WO-1.38` for real when I meant to demonstrate the refusal, and it cleared the live
claim.** The row was `🤖 CLAIMED`, not `🔍`, so the tool did exactly what it should. I restored it in
the next command — `--start WO-1.38 --dispatch 2026-08-30` — and the file's blob hash is back to
`003275f`, byte-identical to the state the orchestrator handed me. `git diff` on that file now shows
only the status line the orchestrator wrote plus my seven ticks. It cost nothing and it is in this
report because a silent status flap is exactly the kind of thing a later reader would misdiagnose.

**Out-of-scope temptations I declined**, noted here rather than acted on:

- **A `--reclaim` / fifth status for a correction round.** Named above; the row stays `🔍`. If the
  owner later wants correction rounds visible in the tracker, that is a work order, not a patch.
- **An `--audit` section reporting a verdict owed for N days.** Genuinely useful — a `🔍` row that has
  sat for a week means the verifier session never happened, and nothing anywhere would say so. It is
  out of scope twice over: `--audit` reads no clock, and its subject is documents disagreeing. Worth
  a row of its own if handoffs start going stale.
- **Converting the eight literal `'🤖 CLAIMED'` reads in `wo-gate.mjs` to a constant** for symmetry
  with the `AWAITING` constant I added. Left alone — it is a tidy-up across working code, and the new
  constant carries a comment saying it is not a convention change.
- **`TESTING.md`.** No section added. WO-1.21, WO-1.28 and WO-1.35 — the three closest precedents —
  added none either; `TESTING.md` is the gate for app surfaces, and the tool's own gate is
  `--self-check`.

## Draft `CHANGELOG.md` entry — the teacher's to accept, reword or bin

> **The verifier now runs in its own session.** A work order's row gains a fourth status,
> `🔍 AWAITING VERDICT`, for the gap between the implementer finishing and the verifier reporting.
> Before this, that row read as an abandoned claim — and the way you clear an abandoned claim would
> have thrown a finished, unchecked build away. `wo-gate.mjs --release` now refuses it and names the
> report it would orphan. Ten dispatches have been killed at that seam; the cold start is now planned
> rather than imposed.

## What I could not verify

Nothing on this list needs an iPad or human eyes — there is no app surface here and no 👤 or 📆 line.
The one thing I can only assert rather than measure is that the **rule works in practice**: whether
the fresh-session verifier actually reduces handoff deaths is a claim about future dispatches, and
the first evidence for it will be this work order's own verifier being spawned cold.
