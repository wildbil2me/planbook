# WO-1.66 — result

**Implementer:** Claude (work-order-implementer), 2026-10-09. Nothing committed. No `--start`, `--release`, `--handoff` or real `--tick` on the tree. One `--tick WO-1.66 --dry-run` was run on the real tree after the section landed, to confirm it would now go through. It printed `DRY RUN | re-run without --dry-run to apply.` and wrote nothing.

## What landed

- **`tools/wo-gate.mjs`**
  - `testingSection()` and `testingWhere()` sit above `applyTick()`. Their header comment carries the owner's ruling and the whole-token rule. It says why the contents are not read, why the gates are exempt (via `isGateWorkOrder()`), and why `--audit` does not report the 58 past gaps (forward only).
  - `applyTick()` gains a **fourth refusal**. It comes after the tracker blockers and before every write, prints `HELD`, writes nothing (not even 🔨), and names `### WO-x.y — <title>` and the `## Phase N` section with its `TESTING.md` line. `--dry-run` prints the same lines.
  - The held path (an open line, so 🔨 is written) adds one NOTE when the section is also missing. A gate gets a NOTE saying it is not asked.
  - `--self-check` gains a synthetic sandbox `TESTING.md`, rewritten by `reset()`, and **one plant (46 → 47)**. The closing summary gains a paragraph for it.
  - The usage line for `--tick` names the refusal.
- **`tools/wo-brief.mjs`**: `testingLine()` writes the owed section into § 5 of every non-gate brief. It names the heading and the phase section, or says the phase section does not exist yet.
- **`plans/work-orders/ROUTING.md`**:
  - The constraints block (inlined into every brief) gains a bullet: "It is a deliverable, not a permission".
  - The "may update" bullet no longer reads as the only mention of `TESTING.md`.
  - § "Ticking follows the verdict" names the refusal.
- **`AGENTS.md`** and **`CLAUDE.md`**: the rule was added to both in this sitting (`AGENTS.md` § "If you were dispatched with a work order"; `CLAUDE.md` § "How work is run here").
- **`.claude/agents/work-order-orchestrator.md`**:
  - § "Applying the maintenance" is reworded: the section is owed, and a refusal is the implementer's missing deliverable.
  - § 3 says never to write "optional" or "not demanded".
  - The self-measured line count is corrected to **473** (`wc -l` reads 473).
- **`.claude/agents/work-order-implementer.md`**: one bullet under "While you work" (see the decisions below).
- **`plans/work-orders/README.md`** § "The pipeline's own files":
  - New row for `ROUTING.md`'s constraints block.
  - The "three of the five rows" sentence is updated.
- **`tools/README.md`**:
  - The `wo-gate.mjs` and `wo-brief.mjs` table rows are updated.
  - New paragraph on the fourth refusal.
  - The plant count is 47, with a WO-1.66 paragraph.
- **`TESTING.md`**: § WO-1.66 under Phase 1, after WO-1.65, with the five Acceptance lines verbatim and the evidence for each.
- **`plans/work-orders/phase-1-shell-store-roster.md`**: WO-1.66's five boxes ticked. None is 👤 or 📆. The status line is untouched (still 🤖 CLAIMED).

Nothing in `src/`, `sw.js` or `index.html` moved, so no `CACHE` bump is owed.

## Acceptance, line by line

1. **[x] `--tick` refuses with no heading, writes nothing, exits non-zero, names the heading. The same run with the heading added ticks.**
   - **Setup:** a scratch copy of `plans/`, `TESTING.md` and the new `tools/wo-gate.mjs` in the session scratchpad, under its own `git init`, with WO-1.66's five boxes ticked there.
   - **Refusal:** `--tick WO-1.66 --dry-run` and `--tick WO-1.66` both printed the same three lines and exited 1:
     - `HELD | WO-1.66's Acceptance list is complete, and TESTING.md has no section for it — no `#` heading names WO-1.66:`
     - `looked for   a heading naming WO-1.66 as a whole token, e.g.  ### WO-1.66 — a work order can close …`
     - `belongs      under ## Phase 1 — Shell, store, roster   (TESTING.md:195)`
   - `git status --short` was empty after the refusals.
   - **With the heading:** after adding `### WO-3.44 and WO-1.66 — one heading naming two work orders`, the run printed `PASS | WO-1.66 ticked.` and exited 0.
2. **[x] `WO-1.6` against `### WO-1.65` does not satisfy; a two-id heading satisfies both.**
   - **Self-check plant:** the fixture's heading is replaced by `### WO-9.99`, `### WO-9.9x`, `### WO-9.9.1` and a bare `WO-9.9` in prose. The plant asserts the refusal on both `--dry-run` and the real run: identical lines, nothing written, status unchanged. Then `### WO-9.8 and WO-9.9 — …` ticks both. Then gate WO-G9 is not asked.
   - **Scratch tree:** `### WO-1.661 — a neighbour, and nothing else` plus `WO-1.66` in prose refused (exit 1, clean status), and the two-id heading ticked.
   - **The plant bites:**
     - `--self-check --against` the HEAD script: `FAIL | 1 of 47`.
     - Five mutations of **scratch copies** of the script, each run with `--against`, each `FAIL | 1 of 47` on this plant alone:
       - lookahead removed
       - any line rather than a heading
       - a write before the refusal
       - gate exemption deleted
       - start-of-heading match only
     - No mutation was ever made in the repository.
   - **A slip of my own, recorded because it is instructive:** my first scratch neighbour heading read `### WO-1.661 — a neighbour whose id begins with WO-1.66`. It ticked, and that was correct, because the heading text names `WO-1.66` as a whole token. I re-ran it with a heading that does not.
3. **[x] `--audit` and `--self-check` pass, the sweep is green, and `tools/README.md` counts match.**
   - Final runs after every edit:
     - `--audit` `PASS`, exit 0.
     - `--self-check` `PASS | 47 of 47 plants were caught.`, exit 0.
     - `wo-sweep.mjs` `50 checks · 47 passed · 0 failed · 3 to review`, exit 0: the standing three REVIEWs, and § 21 is green on both pairs.
   - `tools/README.md` records 47 plants. The sweep's 50 did not move.
4. **[x] Briefs demand the section; no pipeline file says it is optional or "not demanded".**
   - From `node tools/wo-brief.mjs WO-5.15 --route claude`, § 5:
     > **Write `TESTING.md` § WO-5.15 — it is a deliverable, not a permission.** Add `### WO-5.15 — One contact, several audiences` under `## Phase 5 — Outreach`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-5.15` refuses ✅ DONE without it.
   - The constraints block carries a generic twin. Gate briefs (WO-G4) get the generic bullet, which names the gate exemption, and no concrete line.
   - I grepped `AGENTS.md`, `CLAUDE.md`, `.claude/agents`, `.claude/commands`, `ROUTING.md`, the work-orders `README.md`, `ROADMAP.md`, `wo-brief.mjs` and `wo-gate.mjs` for "not demanded", "optional" and "if that file carries". The only `TESTING`-related hit is the history note in `TESTING.md` § WO-1.65.
5. **[x] The map is current; `CLAUDE.md` and `AGENTS.md` were changed together.**
   - The orchestrator, implementer and `AGENTS.md` rows still describe their files and watchers truly.
   - `ROUTING.md`'s block got a row.
   - The scripts are mapped in `tools/README.md`, and both rows there were updated.
   - `CLAUDE.md` and `AGENTS.md` each gained the rule.
   - `.claude/commands/wo.md` says nothing about `TESTING.md` and needed no change.

There are no 👤 or 📆 lines.

**The `grep -rn MUTATION tools/` check is not empty, and none of the hits are mine.** It returns 18 hits, and `git grep -n MUTATION HEAD -- tools/` returns the same 18. All are existing prose and comments in `tools/README.md`, `tools/verify/*.mjs` and one `wo-gate.mjs` comment. `git diff -- tools/ | grep '^+' | grep -c MUTATION` is **0**.

## Decisions the work order did not settle

- **The phase comes from the work order's file, not its id.** They agree on every real work order. The self-check's WO-9.9 lives in `phase-3-gradebook.md`, and the first plant run went red on exactly this. The id is the fallback.
- **Where the refusal sits:** a separate **fourth** refusal after the tracker blockers, so the existing "third refusal" comments did not need renumbering. It is still before every write.
- **The held path also NOTEs a missing section.** It is informative only and refuses nothing extra, because 🔨 is still the true status there.
- **Which headings count:** any `#`-level heading counts, with no check of which `## Phase` it sits under (the phase named in the refusal is advice). A struck-through `### ~~WO-2.1 …~~` counts, and an id in body text does not.
- **The sandbox `TESTING.md` is synthetic, not copied**, on the same reasoning as the synthetic fixture.
- **I added a bullet to `work-order-implementer.md`.** It was not named in the deliverables, but it is the file a Claude implementer is dispatched with, and it had no word on the section. Remove it if that counts as widening.
- **I added a `ROUTING.md` row to the map.** Its constraints block is inlined into every brief, which makes it a pipeline file this work order changed.

## Observed, not acted on

- **`TESTING.md` has no `## Phase 6` section at all.** Phase 6 work orders landed without one. Both the refusal and the brief say "does not have yet — add it", so the next Phase 6 tick will ask for the phase heading too. I did not backfill it (Traps).

## Draft CHANGELOG entry (the teacher's call)

> **Tooling.** A work order can no longer be marked done without its `TESTING.md` section. `wo-gate.mjs --tick` refuses ✅ DONE, and writes nothing, until a heading names the work order. Every brief now states the section as a deliverable rather than a permission. Gates are exempt, and the 58 older gaps are left as they are.
