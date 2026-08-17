# WO-2.36 — dispatch status

**SUPERSEDED — read [`WO-2.36-result.md`](WO-2.36-result.md) instead.** Kept rather than deleted
(the convention below) only because it is untracked, so deleting it destroys the one record of how
this dispatch died. The result file carries everything in it and more.

**If you are picking this up cold:** the work is COMPLETE and RE-VERIFIED but UNCOMMITTED, and the
`work-order-verifier` has not run. The status row in `plans/work-orders/phase-2-attendance.md` still
reads `🤖 CLAIMED` and the maintenance protocol is deliberately not run — both were left for the
verifier's cold read. Do **not** re-dispatch an implementer; the tree is finished. See the result
file's § "Status of the pipeline".

Pollable while the dispatch runs. Deleted once `.claude/dispatch/WO-2.36-result.md` exists — the
result supersedes it.

- `2026-08-16` — gates checked, `PASS`. Depends on WO-2.34 ✅ DONE. Tree clean; WO-2.35 landed at
  `b998489` on the same lines this morning.
- `2026-08-16` — work order read in full at `plans/work-orders/phase-2-attendance.md:3482`.
- `2026-08-16` — **route: Claude, Opus tier.** Deliverable #1 is an unresolved decision the work
  order says has no free answer, plus reader-facing comment prose — two Claude columns. Runner-up
  set aside: the mechanical shape reads Codex, but the complete spec that would make it Codex work
  is exactly what is absent, and 3+ harness runs at ~4.4 min each exceed `INVOKE_TIMEOUT_MS`.
  No Codex probe run — step 2b is a Codex-route step only.
- `2026-08-16` — claimed: `🤖 CLAIMED — 2026-08-16`.
- `2026-08-16` — brief written to `.claude/dispatch/WO-2.36-brief.md`, both ORCHESTRATOR markers
  filled and deleted (0 remain).
- `2026-08-16` — **implementer spawned at Opus, awaiting return.** Expect 30–60 min: the Traps call
  for three or more full `verify-shell.mjs` runs at ~4.4 min each on top of reading two blocks and
  two prior result files. A flat status file, an absent result file and an unchanged `git status`
  are the normal look of a reading implementer for its first 20+ minutes — not evidence of a death.
  Do not spawn a second one against this claim.
- `2026-08-16` — **the implementer finished the tree and died before writing its result.** The
  orchestrator process exited with it. Nothing after this line was written by that dispatch.
- `2026-08-16` — **recovered by the main thread.** Four full local harness runs re-established all
  four Acceptance lines from scratch rather than trusting the prose: baseline `802 · 802 · 0` (261s,
  exit 0); retire-`'D'`-on-both-sides **green** at 8 keys against 7 rows, run `802 · 798 · 4`;
  `MARK_KEYS` renamed **red** at unchanged counts 9 and 8, run `802 · 801 · 1`; modal id renamed
  **red** at 0 rows, run `802 · 799 · 3`. Every mutation reverted with `git checkout --` and the
  revert confirmed with `git diff` before the next. All six `:NNN` cross-references checked and
  landing on their exact block boundaries.
- `2026-08-16` — result written to `.claude/dispatch/WO-2.36-result.md`. **Verifier still owed**;
  status row and maintenance protocol left untouched for it.
