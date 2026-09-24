# WO-1.43 — a broken excuse reads as a contradiction, and a vanished claim reads as green · implementer's result

**Route** Claude (work-order-implementer), Opus tier
**Date** 2026-09-23
**Status of this report** the implementer's own account. Every command below ran to completion and I
read its output. `verify-shell.mjs` was **not run**, on purpose (see "Not run").

## Files changed

| File | Change |
|---|---|
| `c:\dev\planbook\tools\wo-sweep.mjs` | § 21 only, +23 / −4. The per-pair `occurrences` counter became a `Map` keyed by claim (two lines inside the loop, and only the counter). Below the loop: a `lostNote` built once and used on **both** branches, naming the claims `confinedTo` each lost passage, and a `perClaim` string (`#1 0, #2 5, #3 2`) in the green detail in place of the total. |
| `c:\dev\planbook\TESTING.md` | New `### WO-1.43` entry between WO-1.42 and WO-1.44. It lists every fixture and its result. |
| `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | WO-1.43's five Acceptance boxes ticked. The status is still `🤖 CLAIMED — 2026-09-23` (I did not re-claim or release it). The one other line in this file's diff was the orchestrator's `--start`, made before I began. |

No check was added or removed, so `tools/README.md`'s `42-check` stays correct and I did not edit it. I
touched no byte of `src/`, `index.html`, `sw.js` or any stylesheet. `git diff --check` is clean.
`grep -rn MUTATION tools/wo-sweep.mjs` finds nothing. The only hits in `TESTING.md` are older entries'
prose.

## Method

`C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\8f17562a-2902-4212-811e-4bd32f6b55d8\scratchpad\drive.mjs`
builds two copies of the tree in the scratchpad from `git ls-files` plus untracked files:
- `tree-new` has this change.
- `tree-old` has `git show HEAD:tools/wo-sweep.mjs`.

It plants each of 21 fixtures into **both** copies, runs `node tools/wo-sweep.mjs` in each, restores
the files, and compares five things: exit code, summary line, status of all four § 21 checks, every
`file:line` a finding cites, and every other FAIL/REVIEW line. Any plant that fails to change its file
throws, so no fixture can be vacuous. **Result: `21 fixtures, 0 mismatch(es)`.** Full output is in
`drive.log` beside the script. **The tracked tree was only ever read.**

One caveat about the copies: they are not git repositories, so two git-backed checks outside § 21
("CSS selectors added in the working tree…" and "every SHELL file change is paired with a CACHE
bump") report REVIEW there. A clean copy therefore prints `42 checks · 37 passed · 0 failed · 5 to
review`, where the repo prints `42 · 39 · 0 · 3`. Both engines behave the same way, and none of it
comes from § 21.

## Acceptance, line by line

**1. A lost `confinedTo` region is reported in the REVIEW branch as well as the green one — driven, message read. [x] met.**
- **Pair 1 (N1).** I renamed `**Second invocation` to `**Second call` and planted F8a's sentence in what was the verifier's passage. Result: `REVIEW`, and the message begins: *the passage "the verifier's stop" was not found, so every occurrence of claim #2, #3 was read as unscoped — read a finding for a claim named here as the excuse breaking before reading it as the files disagreeing, and restore the passage in .claude/commands/wo.md or re-point the region in § 21 · .claude/commands/wo.md:45 "** Mark that Acceptance list item by item, …"*
- **Pair 2 (N2).** I reworded `The date may still **ask**` to `**prompt**`. Result: `REVIEW`, beginning *the passage "the past-due exception" was not found, so every occurrence of claim #3 was read as unscoped — …* and then citing `AGENTS.md:51`.
- **HEAD's engine on the same two plants:** the same REVIEWs at the same lines, with no word about the passage. That is the defect.
- **The green branch still says it.** In N1g (region lost, nothing planted) the message ends *— but the passage "the verifier's stop" was not found, so every occurrence of claim #2, #3 was read as unscoped*. F3 shows the same.

**2. The green detail reports occurrences per claim, and a zero is visible — driven with one claim's token removed. [x] met.**
- **Z1.** I replaced every `localStorage` in `AGENTS.md` with `browser storage`. Result: `occurrence(s) read in AGENTS.md by claim #1 7, #2 0, #3 5, #4 5`.
- **HEAD's engine on the same plant** (I read it directly): `17 occurrence(s) read in AGENTS.md`, with the zero hidden.
- **The clean repo already shows a real zero.** Pair 1 reads `#1 0, #2 5, #3 2`. Claim 1's token `relay the report in full` no longer appears in `wo.md`, and the old line printed `7 occurrence(s)`.

**3. A zero-occurrence claim leaves the check green: no FAIL, no REVIEW, exit code unchanged. [x] met.**
- Z1 gave `PASS`, `42 · 37 · 0 · 5`, exit 0. That is identical to the clean copy under both engines.
- In the real repo, pair 1's `#1 0` is `PASS`, and the sweep exits 0 at `42 · 39 · 0 · 3`.

**4. Both existing pairs still behave as WO-1.40 and WO-1.41 left them, proved by re-running their fixtures. [x] met.**

All results below match HEAD's engine exactly (same status, lines and exit).

WO-1.40's fixtures:
- **F1** (historical `wo.md` from `63c5e00`): REVIEW, all three claims at `:23/:24/:25` against `:346/:399/:408`. This matches WO-1.40's record, and the lost-passage clause now comes first because that file has no *Second invocation* section.
- **F2**: REVIEW at `:35`.
- **F3**: PASS, with the lost passage named.
- **F4**: PASS at `#2 3, #3 1`, which is WO-1.40's "4 occurrences".
- **F5** (orchestrator anchor reworded), **F6** (map stops naming `wo.md`), **F7** (map section deleted): FAIL, exit 1.
- **F8a**: PASS. **F8b**: REVIEW at `:37`.
- **F9**: PASS.
- **F10a**: PASS. **F10b**: REVIEW for claim 1.

WO-1.41's fixtures:
- **Four plants**: REVIEW naming all four claims.
- **Past-due plant inside the region**: PASS.
- **Asymmetry fixture** (new rule in `CLAUDE.md`, a restated prohibition in `AGENTS.md`): PASS.
- **👤 anchor reworded**: FAIL, exit 1.

Two staging differences, stated rather than hidden:
- **F2 was re-staged.** Flipping only the bold words leaves "there is nothing to mark one from" in the same sentence, and both engines read that as a denial and stay PASS. So the fixture replaces the whole sentence with `**Mark the Acceptance list at this stop.**`.
- **WO-1.41's four plants sat side by side** after `## Data invariants`. Their line numbers therefore differ from that entry's, and `CLAUDE.md` has also grown since.

**5. `node tools/wo-sweep.mjs` green and `--audit` green on a clean tree. [x] met.**
- Before the change: `node tools/wo-sweep.mjs` gave `42 checks · 39 passed · 0 failed · 3 to review`, exit 0.
- After the change (re-run after the doc edits too): `42 checks · 39 passed · 0 failed · 3 to review`, exit 0. The review count did not move, and the three REVIEWs are the standing ones: sensitive field names, due-date/late-missing, mockup banner.
- `node tools/wo-gate.mjs --audit` gave `PASS | every fragment matches exactly one roadmap box, …`, exit 0.

## Not run
- **`node tools/verify-shell.mjs`**: not run, as the brief directed. This change moves no byte the harness loads (`src/`, `index.html`, `sw.js`), so it could measure nothing here, and it is not an Acceptance line.
- `wo-gate.mjs --self-check`: not run, since nothing it plants into (`plans/`) changed beyond ticks.
- No 👤 or 📆 lines exist in this work order.

## Decisions the work order did not settle
- **The label is the claim's 1-based position (`#1`…`#4`).** Claims carry no id, and § 21's comments already number them this way ("Claim 1 names one instruction", "Claim 4 is the only one…"). So I used the existing convention rather than adding an `id` field. The cost: inserting a claim mid-list renumbers the ones after it. If that becomes a problem, add a short `id`.
- **The lost clause names which claims were confined to the lost passage.** Without that, F10b would be misleading: the region is lost *and* claim 1, which is unconfined, has a genuine finding, and a bare "the excuse broke" would wrongly discredit it. The green branch got the same, more precise wording, so the two branches say one sentence.
- **The per-claim tally is inside the loop.** Trap 3 fences the *lost* repair off the loop, and that repair stays entirely below it. Counting per claim necessarily touches the counter, so the only two changed lines in the loop are `const occurrences = new Map(…)` and `occurrences.set(c, …+1)`. The 21-fixture comparison is the proof that what is found and excused did not change.

## Out of scope, declined
- `tools/README.md`'s § 21 row does not mention per-claim counts. I left it, since the count is unchanged and the row describes what the section checks, not its message format.
- Pair 1's claim 1 currently checks nothing (`#1 0`). Whether to re-token it, or accept that `wo.md` no longer carries the single-return instruction at all, is a person's call. Trap 1 forbids this work order from calling it wrong. **Worth a look.**

## CHANGELOG draft (the teacher's to use or not)
> **Tooling.** `wo-sweep.mjs` § 21 now says, on the amber branch as well as the green one, when a passage it uses to excuse an instruction has gone missing, and which claims that affects. So a reader sent to compare two agreeing files is told the excuse broke. Its green line counts occurrences per claim rather than as one total, which shows that one of the pipeline pair's three claims is currently checking nothing. That is left green, because a file telling less is allowed.
