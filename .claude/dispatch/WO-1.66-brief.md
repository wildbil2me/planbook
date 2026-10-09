# WO-1.66 — a work order can close with no TESTING.md section, and the brief says it need not write one · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.66-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is that this work order edits the pipeline's own files — `tools/wo-gate.mjs`, `tools/wo-brief.mjs` or `ROUTING.md`'s constraints block, `.claude/agents/work-order-orchestrator.md`, `AGENTS.md`, and the map in `plans/work-orders/README.md` — and its Traps are judgment, not mechanics (no backfill, no `--audit` widening, no content comparison). That puts it in ROUTING's Claude column under "establishes a convention" and "Traps about judgment". The runner-up was Codex for the `--tick` refusal alone, which is mechanically checkable; set aside because half the deliverable is wording in `.claude/`, which the sweep cannot see.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.66 — a work order can close with no TESTING.md section, and the brief says it need not write one

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-09 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.65 made.)*

**Booked 2026-10-09**, owner-directed, out of a bookkeeping pass over the work orders landed since
Oct 4. Two of the 23 had no `TESTING.md` section: WO-1.65 and WO-3.44. Both were added by hand the
same day. Across all phases, **58 work orders read ✅ DONE with no section**, going back to WO-1.9.

**Why it exists.** `TESTING.md` § "How to use it" says that when a work order lands, its Acceptance
lines are copied into its phase's section. `plans/ROADMAP.md`'s protocol ticks a box only when its
`TESTING.md` items pass. **Nothing else in the pipeline says so, and nothing checks it.** The brief
says an implementer *may* update `TESTING.md`. The orchestrator's § "Applying the maintenance" says to
"apply the 👤-free `TESTING.md` lines by hand", one sentence that a sitting can skip. So a section gets
written when the work order's own Acceptance lines happen to say "recorded in `TESTING.md` § WO-x".
WO-1.59 through WO-1.64 said that. WO-1.65's did not, and its orchestrator wrote *"No `TESTING.md`
section is demanded"* into the brief. WO-3.40's and WO-3.44's briefs hedged the same way (*"if that
file carries one per work order"*).

**The owner's ruling, 2026-10-09: every work order owes a section, with no exemption for docs-only
or process work.** A section can be two lines saying there is nothing to run. A missing section
cannot be told apart from a forgotten one.

**Deliverables**
- **`node tools/wo-gate.mjs --tick <id>` refuses to write ✅ DONE when `TESTING.md` has no heading
  naming the id.** It writes nothing and exits non-zero. Its message names the heading it looked for
  (`### WO-x.y — <title>`) and the phase section it belongs under. `--dry-run` reports the same
  refusal. This is unlike the open-Acceptance path, which writes 🔨 IN PROGRESS. A missing section is a
  missing record, not part-built work, and the status line should not move for it. The match is the id
  as a whole token anywhere in a `#`-level heading, so `WO-1.6` does not match `### WO-1.65`, and a
  heading naming two work orders satisfies both.
- **The gates are outside the rule.** WO-G1 … WO-G4 keep their boxes in `gates.md` and have never had
  a `TESTING.md` section. Say so where the check is defined.
- **Forward only.** `--audit` does not start reporting the 58 past gaps. A check that goes red on the
  day it lands, for work nobody can now reconstruct, teaches its reader to ignore it. Say that in the
  check's comment too.
- **The brief says it as a deliverable, not a permission.** Wherever the brief text comes from
  (`tools/wo-brief.mjs`, `ROUTING.md`'s constraints block, or the orchestrator's markers), every brief
  now tells the implementer to add `TESTING.md` § <id> with the Acceptance lines copied verbatim and
  the evidence for each. The orchestrator's § "Applying the maintenance" sentence is reworded to
  match. An orchestrator can no longer write "not demanded".
- `--self-check` gains a plant for the new refusal, and `tools/README.md` records any count that moves.

**Acceptance**
- [ ] `--tick` on a work order whose Acceptance lines are all `[x]` but which has no `TESTING.md`
      heading refuses, writes nothing (`git diff` empty after), exits non-zero and names the heading.
      Shown in a scratch copy of the tree, never on `main`. The same run with the heading added ticks.
- [ ] `WO-1.6`-against-`### WO-1.65` does not satisfy the check, and a heading naming two ids satisfies
      both. Both are shown in `--self-check` or a scratch tree.
- [ ] `node tools/wo-gate.mjs --audit` and `--self-check` pass, `node tools/wo-sweep.mjs` is green,
      and `tools/README.md`'s recorded counts match.
- [ ] A brief generated for any work order after this lands tells the implementer to write the section.
      Quote the line in the result. No pipeline file still says the section is optional or "not
      demanded".
- [ ] `plans/work-orders/README.md` § "The pipeline's own files" is current for every pipeline file
      this changes. `CLAUDE.md` and `AGENTS.md` are changed together if either is.

**Traps** — **Do not backfill the 58.** Writing their sections now would be reconstruction, not a
record of what was run. That is the owner's call, and the answer was no. **Do not widen it to
`--audit`.** **Do not make it check the section's contents.** Whether the lines match the Acceptance
list is a reading for the verifier. A grep that compares them breaks on the first `*(italic note)*`.
**This changes pipeline files**: read § "The pipeline's own files" before editing any of them, and
remember that `.claude/` is in the sweep's `IGNORE_DIRS`, so a sentence left stale there is caught
by nothing. **Nothing in `src/` moves**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/ROADMAP.md`
  - `plans/work-orders/README.md`
  - `tools/README.md`
  - `tools/wo-brief.mjs`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- Also open, because they are what you are changing or what watches it:
  - `TESTING.md` § "How to use it" — the rule this work order enforces. Look at how existing `### WO-x.y — <title>` headings sit under phase sections, so the refusal message can name the right phase section.
  - `plans/work-orders/README.md` § "The pipeline's own files" — read it **before** editing any pipeline file (Traps).
  - `.claude/agents/work-order-orchestrator.md` line ~426 (§ "Applying the maintenance") — the "apply the 👤-free `TESTING.md` lines by hand" sentence the work order rewords. It also carries a self-measured line count in § "Standing rules" ("takes it to **469**"); if you change its length, correct that number with `wc -l` in the same edit.
  - `AGENTS.md` line ~170 — "You may tick … and update `plans/` and `TESTING.md` as you go." It is the twin of the ROUTING constraint line; `wo-sweep.mjs` § 21 fences `CLAUDE.md`↔`AGENTS.md` and `wo.md`↔orchestrator on a hand-written claim list, so run the sweep after any wording change there.
  - `.claude/commands/wo.md` — check it says nothing that now contradicts the new rule.
  - `plans/work-orders/gates.md` — WO-G1…G4 are exempt; confirm how `--tick` resolves a gate id so the exemption is real, not just a comment.

**Four things the work order does not say and you would not guess.**
1. **This work order is the first one the new check applies to.** Its own `--tick` will refuse unless `TESTING.md` has a `### WO-1.66 — …` section. Write it, under the right phase section, with the five Acceptance lines copied verbatim and the evidence for each.
2. **Scratch trees only for the refusal demo** — copy to the scratchpad or use `git worktree add` under a temp path; never `--tick` on the real tree. Stage your own edits before any mutation-and-revert (`git checkout` of a file reverts your unstaged work in it). Every mutation you plant to prove a check bites gets reverted **before you write anything else**, and `grep -rn MUTATION tools/` must be empty before you report.
3. **The refusal must not move the status line** — unlike the open-Acceptance path, which writes 🔨. Order the check so it runs before any write, and so `--dry-run` reports the identical refusal. Whole-token matching means `WO-1.6` must not match `WO-1.65` *and* must not match `WO-1.6x` in any form; be careful with `.` in a regex.
4. **Do not run `node tools/verify-shell.mjs` as a gate on this one unless you want to** — nothing in `src/` moves. The required evidence is `wo-gate.mjs --audit`, `--self-check`, and `wo-sweep.mjs`, plus whatever counts in `tools/README.md` your `--self-check` plant moves. Run `node tools/wo-brief.mjs <some ⬜ WO-id> --route claude` and quote the new line from its output in your result.

Write your report to `.claude/dispatch/WO-1.66-result.md` as your last act.

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

## 5. Done means these 5 lines, reported against one by one

1. `--tick` on a work order whose Acceptance lines are all `[x]` but which has no `TESTING.md` heading refuses, writes nothing (`git diff` empty after), exits non-zero and names the heading. Shown in a scratch copy of the tree, never on `main`. The same run with the heading added ticks.
2. `WO-1.6`-against-`### WO-1.65` does not satisfy the check, and a heading naming two ids satisfies both. Both are shown in `--self-check` or a scratch tree.
3. `node tools/wo-gate.mjs --audit` and `--self-check` pass, `node tools/wo-sweep.mjs` is green, and `tools/README.md`'s recorded counts match.
4. A brief generated for any work order after this lands tells the implementer to write the section. Quote the line in the result. No pipeline file still says the section is optional or "not demanded".
5. `plans/work-orders/README.md` § "The pipeline's own files" is current for every pipeline file this changes. `CLAUDE.md` and `AGENTS.md` are changed together if either is.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

