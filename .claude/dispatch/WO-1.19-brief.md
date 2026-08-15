# WO-1.19 — the phase-branch convention is dead and still written down · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.19-result.md` — as your last act, and return it in-band too.

**Routing decision.** WO-1.19 routes to **Claude, Opus tier**. The deciding signal is that it retires
a convention and rewrites the two files every session reads to learn it — ROUTING.md's "establishes a
convention" plus "produces teacher-facing prose," and its Traps are judgment rather than mechanics.
The runner-up I set aside: size `S` over a git state that is mechanically checkable made it look
Codex-shaped, but the git commands are the trivial half; the reasoning that gets written down is the
work. No Codex probe was run — this route never reaches one.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.19 — the phase-branch convention is dead and still written down

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-15 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. Process, not app — the convention it settles is `CLAUDE.md`'s
and this directory's, and neither is a roadmap promise. Booked 2026-08-13.)*

**Why it exists.** `CLAUDE.md` says work happens on phase branches — *"one integration branch `main`,
phase branches `phase/<n>-<slug>`… A work order is a commit or a short stack of them, worked on its
**phase** branch — not a branch per work order."* **Nothing has worked that way for the whole August
sprint.** Measured 2026-08-13: `phase/1-shell-store-roster` is **104** commits behind `main`,
`phase/2-attendance` **67**, `phase/3-gradebook` **16**. Their last commits are Aug 6, Aug 8 and
Aug 12.

**The convention has already been rewritten twice to describe its own decay rather than to end it.**
It first gained a note admitting the drift, then on 2026-08-13 that note was corrected — because it
had named one branch and a commit count that was wrong within a day — into a note saying all three
trail and giving a command for how far. **Two edits, both of which made the sentence more accurate
and neither of which made it true.** A rule every session reads and no session follows is worse than
no rule: it costs a paragraph of attention per session and buys nothing, and it is the one kind of
documentation defect this project has otherwise been ruthless about.

**The decision is cheap, and that is the finding that should drive it.** All three branches hold
**zero commits that are not already on `main`** — they are strictly behind, so there is nothing to
merge, nothing to rebase, and nothing at risk. Catching them up is a fast-forward; retiring them is a
delete. The reason this has not been done is not difficulty, it is that nobody has been asked to
choose.

**Deliverables** *(the deliverable is a decision, and then whichever act it implies)*
- **A choice, written down with its reasoning**, between the two honest options:
  **(a) revive** — fast-forward all three, and say what changes so the next work order actually lands
  on a phase branch; or **(b) retire** — `main` is the integration branch in practice, `CLAUDE.md`
  says so plainly, and the stale branches are deleted locally and on `origin`.
- **`CLAUDE.md`'s Git line matches whatever was chosen**, with no note describing a gap between the
  rule and the practice. If a note is still needed after this work order, the wrong option was picked.
- **`plans/work-orders/README.md` § *How to use one* step 3 moves with it** — it carries the same
  instruction (*"Work on the phase branch… not a branch per work order"*) and is the copy a dispatched
  agent actually reads.

**Out of scope** — pushing anything to `origin`, which is the owner's call and is not what this
decides; the 9 unpushed commits on `main`; any change to commit-message convention, which is working.

**Acceptance**
- [ ] `CLAUDE.md` and `plans/work-orders/README.md` say the same thing about branching, and it is
      the thing that is actually happening.
- [ ] Neither file contains a note admitting a gap between the branching rule and the practice.
- [ ] If **(a)**: all three `phase/*` branches are at `main`, and the next work order after this one
      demonstrably landed on a phase branch — this is the line that decides whether (a) was real.
- [ ] If **(b)**: the three branches are gone locally, and the decision names what is lost — the
      per-phase history view — and why that is acceptable.
- [ ] 👤 The owner has said which option, on the record. This is a preference about how the owner's
      own repository is worked and cannot be inferred from the code.

**Traps** — **Do not "catch the branches up" as a tidy-up without making the choice.** Three
fast-forwarded branches that then sit unused for another sprint is this work order's own defect,
re-created with fresher timestamps. **Do not delete anything on `origin` in the same pass as the
local decision** — the remote branches are the only copy if the call is later reversed, and nothing
here is urgent enough to need both halves at once. **Do not read "zero unique commits" as permanent**;
re-measure before acting, because a dispatch working a phase branch between the booking and the doing
would make it false.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/work-orders/README.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `AGENTS.md` — because `CLAUDE.md` carries a standing rule that *"a rule changed here is changed
  there in the same sitting."* I grepped it for `branch` and found **no matches**, so there is very
  likely nothing to move. Confirm that yourself rather than taking my word for it, and say in your
  result which it was: nothing to sync, or a line you synced.

---

## 2b. The owner's decision — this is Acceptance line 5, and it is already answered

**The owner chose (b) RETIRE**, on the record, 2026-08-15, via the dispatching coordinator. You are
not choosing. You are implementing a choice that has been made, and writing down its reasoning.

**The owner's own words, which must survive into the written record and not just into this brief:**

> "Retire it, but when we hit the next ship we should be more mindful about development happening on
> branches and not on main."

That qualifier is load-bearing and changes what you write. The decision is **not** "branches were a
bad idea." It is: **phase branches did not fit a phase-hopping dispatch stream, and `main` is the
honest integration branch today.** So:

- Write it as **a convention retired for the current sprint's working style, to be revisited when
  Ship 3 opens** — not as a closed door.
- Carry the owner's intent forward: the next ship should be more mindful about development happening
  on branches rather than on `main`.
- **Do not invent or prescribe what that future branching shape is.** Whatever it turns out to be is
  a separate future decision. Naming a scheme here would re-create this work order's own defect — a
  branching rule written down that nobody has agreed to follow.
- The decision record must **name what is lost — the per-phase history view — and why that is
  acceptable**, rather than pretending nothing is. That is Acceptance line 4 and it is not optional.

**Evidence you may use, re-measured by me today at `main` = 35db9e3** *(the Traps require a
re-measurement before acting — take your own anyway and report the numbers you saw, since commits may
land between my measurement and yours)*:

| Branch | Behind `main` | Unique commits | Last commit |
|---|---|---|---|
| `phase/1-shell-store-roster` | 138 (was 104 on 08-13) | **0** | 2026-08-06 |
| `phase/2-attendance` | 101 (was 67) | **0** | 2026-08-08 |
| `phase/3-gradebook` | 50 (was 16) | **0** | 2026-08-12 |

Zero unique commits on all three: nothing to merge, nothing at risk, the delete is safe. All three
still exist on `origin`, which is what makes the local delete reversible.

A finding the work order does not contain, and the strongest single argument for (b) — **the last 18
commits on `main` interleave WO-1.18, WO-8.10, WO-1.17, WO-8.9, WO-3.16, WO-2.29, WO-2.28 and
WO-3.15**: phases 1, 2, 3 and 8 landing within days of each other. A dispatch stream that hops phases
between consecutive work orders cannot sit on one phase branch without near-constant switching and
merging back. Use it if it helps; verify it before you cite it.

---

## 2c. Three traps specific to this dispatch, beyond the work order's own

1. **The work order contradicts itself about `origin`, and the restrictive side wins.** Its
   Deliverables line for (b) says the branches are *"deleted locally and on `origin`"* — but its
   **Out of scope** line puts *"pushing anything to `origin`"* outside this work order, and its
   **Traps** say *"Do not delete anything on `origin` in the same pass as the local decision — the
   remote branches are the only copy if the call is later reversed."* **Delete locally only. Leave
   `origin/phase/*` alone.** Note the contradiction in your result so the work order can be corrected;
   do not resolve it silently in either direction.
2. **There is a third stale branching claim neither Deliverable names.**
   `plans/work-orders/README.md:184`, an italic note about WO-1.13, ends *"The work lands on
   `phase/2-attendance`, because that is where the tree is."* That is now false — WO-1.13 landed on
   `main`. It is a dated historical note rather than a rule, so it is a judgment call whether it is in
   scope for Acceptance line 1. **Make the call, act on it, and say in your result which way you went
   and why.** Do not leave it unmentioned.
3. **The Out of scope line says "the 9 unpushed commits on `main`"; there are 2 today.** The number
   aged, the intent did not. Push nothing.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

**Two notes for this dispatch specifically.** This work order ships **no app code** — it changes
Markdown and deletes local git refs. So the bar for the harness is *unchanged*, not *newly green*:
run both, and confirm the totals match what the tree already carried. A moved number means you
touched something that is not a document. Second: `verify-shell.mjs` drives headless Edge over CDP
and **often cannot run in a sandboxed agent**. If it cannot, report *"could not run, environment"* in
those words and do not dress it up as a pass — I re-run it locally before anything is ticked. A
green harness you did not actually see is the one failure this pipeline is worst at catching.

---

## 5. Done means these 5 lines, reported against one by one

1. `CLAUDE.md` and `plans/work-orders/README.md` say the same thing about branching, and it is the thing that is actually happening.
2. Neither file contains a note admitting a gap between the branching rule and the practice.
3. If **(a)**: all three `phase/*` branches are at `main`, and the next work order after this one demonstrably landed on a phase branch — this is the line that decides whether (a) was real.
4. If **(b)**: the three branches are gone locally, and the decision names what is lost — the per-phase history view — and why that is acceptable.
5. 👤 The owner has said which option, on the record. This is a preference about how the owner's own repository is worked and cannot be inferred from the code.

**Line 3 is N/A** — it is the option-(a) line and (a) was not chosen. Say so against it explicitly;
do not tick it and do not leave it silent.

**Line 5 is the unusual one, so read this before you touch it.** It is marked 👤, but it is *not* the
usual 👤 — it asks for no iPad and no hardware. It asks that the owner have stated a preference on
the record, and **the owner has**, as section 2b quotes. The standing ban on ticking 👤 lines exists
because no agent has an iPad; that reasoning does not reach this line. So you may tick it **only if**
you can point at a durable artifact — the decision record you write, this brief, your result file —
rather than at a chat message that ages out. Cite the artifact beside the tick. If you judge the
evidence too thin, leave it `- [ ]` and say why; landing at `🔨 IN PROGRESS` with a line owed is a
normal outcome here and is better than a tick nobody can trace. Either way, **flag your reasoning
prominently for the verifier** — this is the line most likely to be graded differently by fresh eyes.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

