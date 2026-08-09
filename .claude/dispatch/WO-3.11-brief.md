# WO-3.11 — `**Owes**`, and splitting what 🔨 IN PROGRESS means · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.11-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at Opus tier on this work order's own merits** — not a Codex
fallback, so read the tier as neither a downgrade nor a favour. The deciding signal is that this work
order changes the *vocabulary the whole tracker is read in*: it splits a status token, invents a
field, and redefines what `--tick`, `--release`, `next` and the dependency gates mean across every
phase file — and its Traps section is entirely judgment ("do not let a re-homed line be ticked", "do
not add a status that means done except"), which is exactly the shape a model optimizing for a tidy
compound status will undo while producing clean-looking code. The runner-up consideration I set aside
is real and you should feel its pull: no UI, no student data, and an Acceptance list that is unusually
mechanical for this project — six of the seven lines are a command and an exit code. It lost because
`wo-gate.mjs` **is the dispatch pipeline's own gate**, where a plausible-looking wrong change
mis-gates every future work order silently, and because WO-2.15 and WO-2.16 — the two tracker-tooling
work orders this one names as its own family — routed Claude/Opus for the same reason and were right
to.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.11 — `**Owes**`, and splitting what 🔨 IN PROGRESS means

**Ship** 2 · **Status** 🔨 IN PROGRESS · **Size** S · **Depends on** nothing
**Closes roadmap** *(no box. This is tracker tooling, like WO-2.15 and WO-2.16 — it closes no product
box, and inventing one to make the dashboard tidier is the drift those two work orders exist to
catch.)*

**Why it exists.** `🔨 IN PROGRESS` carries two unrelated meanings, and the tooling cannot tell them
apart:

1. **A dispatch is building this right now.** Written by `--start`, cleared by `--tick` or `--release`.
2. **This landed and was verified, and some Acceptance lines are open on purpose** — because they name
   something no work order has built yet.

WO-3.1 was the second and read as the first for a day. `next` stepped over it, which is right for a
live dispatch and wrong for a landed one nobody is touching; **WO-3.3's gate failed on it**, which is
right when a deliverable is missing and wrong when the deliverable shipped and is already imported;
and `--release`, the way back for a dispatch that died, could not be run safely, because a dead
dispatch and an intentionally-open work order are the same three glyphs.

**This is not a one-off, which is the argument for the work order.** WO-3.3's first two Acceptance
lines are *"does not break any grade calculation"* — the owner's extra-credit rule, a 0-point
assignment scored `5` being +5 earned points — and *"an assignment can be moved between categories and
the grade updates."* Neither can close until WO-3.4 computes a grade and WO-3.5 draws one, so WO-3.3
lands in exactly WO-3.1's position, and a 🔨 there blocks **WO-3.5**, which depends on it. The same
shape is waiting in WO-3.4 → WO-3.5. Reconciling it by hand each time is how the ✅ that means *done*
and the ✅ that means *we stopped checking* become the same mark.

**Deliverables**

- **A `**Owes**` field**, beside `**Depends on**`, naming the work orders that carry the re-homed
  lines. Absent on most work orders; present exactly when a line has been moved.
- **Re-homed Acceptance lines stay `- [ ]` and gain a `→ WO-3.5` marker.** `--tick` stops counting a
  marked line as holding the work order open — **but only when it can find a matching open box under
  the named target.** The pointer has to resolve or the tick is held, which is what stops "re-homed"
  from being a claim. *A re-homed line must never be `- [x]`: see the note below.*
- **Split the status.** `--start` writes **`🤖 CLAIMED — <dispatch>`**; `🔨 IN PROGRESS` keeps its
  honest meaning of work genuinely part-built; `✅ DONE` plus `**Owes**` covers landed-with-lines-owed.
  Then `next` skips 🤖 and 🔨, dependency gates block on both and pass on ✅, and `--release` only ever
  touches 🤖 — it can refuse everything else instead of trusting the caller.
- **The status vocabulary line in `plans/ROADMAP.md`** gains 🤖, since that line is where the words are
  defined.
- **`--audit` gains one check:** every `**Owes**` target resolves to a real, open box. A pointer to a
  box that was quietly reworded is the exact failure this exists to prevent.
- **`--self-check` plants each new violation** and fails if one stops being caught: an unresolvable
  `**Owes**`, a `→` marker with no target box, a `--release` against `✅ DONE`. Its own rule, and the
  reason it exists — a guard whose only evidence is that it printed PASS once is what WO-3.2's
  follow-up was cleaning up.

**Acceptance**
- [ ] A work order with one `- [ ] … → WO-x.y` line and a resolving target ticks to `✅ DONE`, and its
      dependents' gates pass.
- [ ] The same line with the target box **deleted or reworded** holds the tick, names the line, and
      writes nothing.
- [ ] `--audit` fails on an `**Owes**` naming a work order that does not exist, and on one whose
      target box is already ticked.
- [ ] `--release` against a `✅ DONE` or `🔨 IN PROGRESS` work order refuses and writes nothing;
      against `🤖 CLAIMED` it works as it does today.
- [ ] `next` returns a work order that WO-3.1's old state would have hidden, and still skips both 🤖
      and 🔨.
- [ ] `--self-check` plants all three new violations and fails when any one stops being caught.
- [ ] WO-3.1's two re-homed lines are converted from `- [x]` to `- [ ] → WO-3.5`, and WO-3.1 still
      reads `✅ DONE` afterwards. **This is the migration, and it is the proof:** the same work order
      that forced this design has to come out honest at the end of it.

**Traps** — **Do not let a re-homed line be ticked.** WO-3.1's were marked `- [x]` by hand on
2026-08-09 with a paragraph on each explaining that ☑ meant *resolved on this work order, not
verified*. A mark that needs a paragraph to stop it meaning "verified" is the wrong mark, and the
paragraph is not in the file `--audit` reads. `- [ ] → WO-3.5` says the same thing on its face and is
checkable, which is the whole point of the field.

**And do not add a status that means "done except".** The temptation is a compound — `✅ DONE — <date>
· lines owed` — and it breaks the single-token status parse that every one of these tools reads,
including the phase files' own tables. The debt belongs in a field of its own, where a check can
resolve it.

**Not on the Ship 2 critical path.** Nothing about grades depends on it, and it must not be allowed to
delay WO-3.4 or WO-3.5. But it is worth running **before WO-3.3** — see Why it exists — because
WO-3.3 is the next work order that lands in the position this fixes.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/ROADMAP.md`
- `tools/README.md` — the CDP section is **not** relevant here; this work order touches no UI and
  drives no browser. Read the rest for the tooling conventions.

**The files this work order actually lives in:**

- `tools/wo-gate.mjs` (1551 lines) — the whole job is here. Read it end to end before editing. Its
  header comment block and its inline commentary are the design record for every behaviour you are
  about to change; several of them explain why something that looks wrong is deliberate.
- `plans/work-orders/phase-3-gradebook.md` — WO-3.1 (the migration target) and WO-3.11 itself.
- `plans/work-orders/README.md` — the **field table**. WO-2.16 made this the home for what a work
  order's fields mean; a new `**Owes**` field wants a row there. Match the voice of the rows around
  it.
- `plans/ROADMAP.md` — the status vocabulary line, which is a named Deliverable.
- `tools/wo-sweep.mjs` and `tools/verify-shell.mjs` — **check whether either parses a status token.**
  If they do, a new glyph they don't know about is a silent miscount, and that is squarely inside
  this work order rather than a widening.

**Seven things I found while routing that will cost you time if you meet them cold:**

1. **`STATUSES` is one array at `tools/wo-gate.mjs:45`,** and the comment above it explains that the
   list exists so a prefix match on `✅ DONE — 2026-08-04` cannot be confused for a bare prefix of
   something else. `🤖 CLAIMED — <dispatch>` has that same compound shape. Every read of a status in
   this file is `startsWith`, so the parse should keep working — but verify it rather than assume it,
   and note that the work order's own Traps section forbids compounding `✅ DONE`, not `🤖 CLAIMED`.
   The `— <dispatch>` suffix on the claim is in the Deliverables; do not drop it, and decide (and say
   in a comment) what goes in it when the caller gives you nothing.
2. **This work order's own status row is a straggler you created.** I claimed WO-3.11 with the *old*
   `--start`, so `phase-3-gradebook.md:459` currently reads `🔨 IN PROGRESS`. The moment your change
   lands, that is the wrong glyph for a live claim. Decide what to do — migrate it to `🤖 CLAIMED`, or
   leave it and let `--tick` close it — and put the reasoning in your report. Do not leave the repo in
   a state where the only live claim is spelled in the retired vocabulary without anyone having chosen
   that.
3. **`--tick` accepts `⬜ NOT STARTED` or `🔨 IN PROGRESS` today** (`tools/wo-gate.mjs:771`). With the
   split, `🤖 CLAIMED` has to be tickable too or every dispatch breaks on its last step. That is a
   real edit, not a rename.
4. **The held-tick path at `tools/wo-gate.mjs:793` writes `🔨 IN PROGRESS` when a box is open, and
   that behaviour is still correct** — a genuinely part-built work order is exactly what 🔨 now means
   on its own. Do not "fix" it to 🤖. The whole point of the split is that this line finally means
   what it says.
5. **Acceptance line 5 cannot be run against the live tree.** WO-3.1 is already `✅ DONE — 2026-08-09`;
   "WO-3.1's old state" no longer exists on disk. Build a fixture that reproduces it rather than
   reverting the repo to prove a point, and say in your report which you did.
6. **`next` reads the Ship 1 table only** (`tools/wo-gate.mjs:434` — *"nothing ⬜ NOT STARTED left in
   the Ship 1 table"*). WO-3.1 and WO-3.11 are Ship 2. If line 5's fixture has to live in the Ship 1
   table to be reachable by `next`, say so; if you think `next` should read further, that is a
   **proposed follow-up in your report, not a change you make here**.
7. **WO-3.1's three `- [x]` boxes are not all re-homed.** Boxes 2 and 4 are (each carries a paragraph
   saying ☑ means *resolved, not verified* — those paragraphs are the thing the work order calls the
   wrong mark). Box 1 and box 3 are genuinely done. Acceptance line 7 says **two** lines convert.
   Converting a third is a regression, not thoroughness, and the surrounding prose in that section —
   including the "Two lines were owed" paragraph and the follow-up note — will need reconciling with
   whatever the boxes now say, because leaving prose that describes ☑ marks that no longer exist
   recreates the exact defect this work order was written about.

**On the verification commands in § 4:** past agents in this sandbox have reported
`tools/verify-shell.mjs` as "could not run". It runs fine on this machine. If it fails for you, say
so plainly and say *how* it failed — do not report a green you did not see, and do not report a
failure as if the app were broken.

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

---

## 5. Done means these 7 lines, reported against one by one

1. A work order with one `- [ ] … → WO-x.y` line and a resolving target ticks to `✅ DONE`, and its dependents' gates pass.
2. The same line with the target box **deleted or reworded** holds the tick, names the line, and writes nothing.
3. `--audit` fails on an `**Owes**` naming a work order that does not exist, and on one whose target box is already ticked.
4. `--release` against a `✅ DONE` or `🔨 IN PROGRESS` work order refuses and writes nothing; against `🤖 CLAIMED` it works as it does today.
5. `next` returns a work order that WO-3.1's old state would have hidden, and still skips both 🤖 and 🔨.
6. `--self-check` plants all three new violations and fails when any one stops being caught.
7. WO-3.1's two re-homed lines are converted from `- [x]` to `- [ ] → WO-3.5`, and WO-3.1 still reads `✅ DONE` afterwards. **This is the migration, and it is the proof:** the same work order that forced this design has to come out honest at the end of it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

