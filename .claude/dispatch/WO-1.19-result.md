# WO-1.19 — the phase-branch convention is dead and still written down · result

**Route** Claude, Opus tier · **Date** 2026-08-15 · **Branch** `main` (there is no other kind now)
**Status written** ✅ DONE — 2026-08-15 by `wo-gate.mjs --tick` · **Nothing committed, nothing pushed**

## How this run actually went, because the trail matters

The first implementer spawn produced nothing. The second wrote the prose and then **died mid-run on
an API session limit**, before deleting a single branch, before running either harness, and before
writing this file. The orchestrator died with it. The tree it left behind was the trap the pipeline
is worst at: three modified Markdown files whose text asserted *"the three local branches are
deleted"* while `git branch` still listed all three. **A reader who trusted the prose over the tree
would have recorded a delete that never happened.**

The work was finished by the coordinating session directly, against this brief. That is a departure
from orchestrator → implementer → verifier and is recorded here rather than smoothed over: **no
independent verifier has read this cold.** The owner should treat the Acceptance marks below as
self-reported and weigh them accordingly.

## Deliverables

**The decision, written down with its reasoning** — `plans/work-orders/phase-1-shell-store-roster.md`,
WO-1.19's body. Four paragraphs: the owner's call quoted verbatim with both halves; what is lost and
why it is acceptable; why not (a); and the explicit statement that this retires a convention for the
current sprint's working style without settling branching.

**`CLAUDE.md` § Conventions** — the Git line now reads one branch, `main`, with the retirement and
its reasoning in a parenthetical, and the owner's Ship 3 intent carried forward without prescribing a
shape for it.

**`plans/work-orders/README.md` § *How to use one* step 3** — now says work lands on `main`, pointing
at `CLAUDE.md` for the reasoning.

**The branches, deleted locally, `origin` untouched:**

| Branch | Tip deleted | Behind `main` | Unique commits |
|---|---|---|---|
| `phase/1-shell-store-roster` | `f628a04` | 138 | **0** |
| `phase/2-attendance` | `25cd527` | 101 | **0** |
| `phase/3-gradebook` | `9a2dc05` | 50 | **0** |

Re-measured immediately before the delete, as the Traps require — up from 104 / 67 / 16 on 08-13.
All three `origin/phase/*` refs are intact and are ancestors of `main`.

## Three corrections made to the dead implementer's prose

It wrote confidently and got two things wrong. Both were caught by re-running its own cited commands.

1. **`git branch --contains 79e6a6a` does not name all three branches.** It names `main`,
   `phase/2-attendance` and `phase/3-gradebook`; `phase/1-shell-store-roster` sits *behind* WO-1.13's
   landing commit. The argument the claim supported survives — a Phase 1 commit really did sit in
   Phase 2's and Phase 3's logs — but the sentence was false as written and is now corrected.
2. **`phase/3-gradebook`'s local tip was 12 commits ahead of `origin/phase/3-gradebook`**
   (`9a2dc05` vs `7235969`). The prose implied a clean `git branch <name> origin/<name>` restores
   what was deleted; for that one it restores an older marker. Now written down, along with the
   consequence: `git branch -d` deleted the first two and **refused the third**, because `-d`
   measures "merged" against the upstream rather than `HEAD`. Each of those 12 commits was confirmed
   an ancestor of `main` individually before `-D` was used.
3. **A pronoun.** The prose referred to the owner as "her"; the owner's pronouns are stated nowhere in
   this repository. Changed to "them".

## The three traps the brief named

1. **The work order's `origin` self-contradiction is real, and is still there.** Its (b) Deliverable
   says the branches are *"deleted locally and on `origin`"*; its **Out of scope** and **Traps** both
   forbid touching `origin`. Resolved the restrictive way — local only — and **flagged rather than
   silently patched**, so the owner can correct the work-order text. It is the Deliverable line that
   is wrong; the Traps line gives the reason and should win.
2. **`README.md:184` — judgment call, and I changed it.** *"The work lands on `phase/2-attendance`,
   because that is where the tree is"* → *"landed… where the tree was."* It is a dated historical
   note, not a rule, so the minimum honest edit was tense, not deletion: what it records genuinely
   happened, and erasing it would erase evidence for this very decision.
3. **`AGENTS.md` — nothing to sync, confirmed rather than assumed.** Grepped case-insensitively for
   `branch`: **zero matches.** `CLAUDE.md`'s same-sitting rule had nothing to move.

## Verification

```
node tools/wo-sweep.mjs        20 checks · 18 passed · 0 failed · 2 to review
node tools/verify-shell.mjs    778 checks · 778 passed · 0 failed · 0 skipped · 254s
```

Both ran **locally, for real** — not in a sandbox, and not reported as "could not run." The bar the
brief set was *unchanged*, not *newly green*, and that is what happened: the two sweep REVIEW items
are the standing pre-existing pair (sensitive field names, due-date-near-late/missing), and the sweep's
own `no new CSS selectors — 0 added line(s) in tracked src/*.css` independently confirms this work
order moved no app code.

## Acceptance, line by line

1. **[x] VERIFIED** — `CLAUDE.md` and `README.md` say the same thing, and `main` is the only local
   branch, so it is also the thing that is happening.
2. **[x] VERIFIED, and the line most worth a second opinion.** Each file carries a note, but a note
   *recording a decision* is not a note *admitting a gap* — and there is no gap left: the rule says
   `main`, the practice is `main`. A reader who thinks the Deliverable meant "no parenthetical at
   all" would grade this differently.
3. **N/A — rewritten out of the checklist.** The option-(a) line was a conditional that resolved to
   "not applicable" the moment (b) was chosen, so it could never become true; as a checkbox it would
   have held this work order at 🔨 IN PROGRESS permanently, because `--tick` reads any `- [ ]` as
   unfinished and cannot know a line is moot. It now sits as prose beneath the list, recorded rather
   than deleted. **Done on the owner's instruction, 2026-08-15.**
4. **[x] VERIFIED** — three branches gone locally, and the record names the loss (the per-phase
   history view) and argues why it is acceptable: they were fast-forwards, not divergent work, so the
   "view" was `main`'s history truncated by date, and the phase files plus `CHANGELOG.md` answer the
   same question better.
5. **[x] TICKED, on the owner's explicit say-so, 2026-08-15.** This run first left it blank on the
   standing rule that no agent ticks a 👤 line. That was the wrong call and the owner overrode it:
   the ban exists because no agent has an iPad, and **this line asks for no hardware** — only that
   the owner have chosen, which the owner had. The artifact is the decision record in the work order
   body, which quotes the call verbatim.

## Maintenance protocol

**Done.** `wo-gate.mjs --tick` wrote ✅ DONE and moved the dashboards in
`plans/work-orders/README.md`: Phase 1 to 18/19, overall to **68/102 · 67%**. No roadmap box was
owed — WO-1.19's **Closes roadmap** field is explicitly *(no box. Process, not app)*, and `--tick`
confirmed it. `wo-gate.mjs --audit` passes clean: every fragment matches one box, every **Owes**
pointer lands on an open box, every dashboard row matches its own boxes.

**Still owed: the `CHANGELOG.md` entry**, deliberately not written — that entry is the teacher's
call. A draft was handed to the owner in the dispatch report.

**The convention is still written down in four more places, and none is in this work order's scope.**
Flagged, not touched — this is a follow-up worth booking:

- `plans/ROADMAP.md:519` — *"One integration branch `main`; phase branches `phase/<n>-<slug>`, so a
  shippable state always exists. Delete once merged."* **This is the retired rule, live, in rule
  voice, in Cross-cutting rules.** The most important of the four.
- `plans/ROADMAP.md:516` and `TESTING.md:3` — both gate on *"before merging any phase branch"*, which
  now describes an event that cannot occur. `TESTING.md:3` is the regression gate's first sentence.
- `plans/work-orders/phase-8-packaging.md:347` — *"nothing deploys while the work is sitting on a
  phase branch."*
- The `Branch: phase/<n>-<slug>` header on the phase-2 through phase-8 files, plus
  `phase-1-…:5`. Arguably per-phase metadata rather than a rule, so this one is a real judgment call.

Leaving these is what makes Acceptance line 1 true only of the two files it names. The work order's
own title — *the convention is dead and still written down* — applies to `ROADMAP.md:519` word for
word.
