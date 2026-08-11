# WO-2.21 dispatch status

Pollable while the dispatch runs. Deleted once `.claude/dispatch/WO-2.21-result.md` exists —
the result supersedes it.

- `2026-08-11` — gates checked, PASS. Depends on WO-3.5 ✅ DONE; the prose clause
  (`tools/verify-shell.mjs` § "the score entry grid (WO-3.5)") read by hand. Tree clean, no
  pre-existing dispatch files.
- `2026-08-11` — work order read in full at `plans/work-orders/phase-2-attendance.md:1835`.
- `2026-08-11` — **route: Claude, Opus tier**, on the work order's own merits. Deciding signal:
  Deliverable 1 hands over an unresolved design question ("Pick one deliberately and write the
  reasoning down") and the mechanism is inherited by WO-3.6/3.7/3.9. Runner-up set aside: Codex —
  size S, tooling-only, mechanically checkable acceptance — outweighed because the subject is a
  harness reporting green over an unlooked-at screen, this pipeline's worst documented failure mode.
  No Codex probe run: not a fallback.
- `2026-08-11` — claimed. `🤖 CLAIMED — 2026-08-11`.
- `2026-08-11` — brief written to `.claude/dispatch/WO-2.21-brief.md`, both ORCHESTRATOR markers
  filled and deleted. Added the four harness/app anchor points found while routing, the WO-2.19 §11
  count obligation (both numbers, from a run), and the section-state trap.
- `2026-08-11` — implementer spawned at Opus, awaiting return. Expect 20–40 min. A flat status
  file, an absent result file and an unchanged `git status` are the normal shape of the first ~20
  minutes — the implementer reads before it writes. Do not spawn a second one.
- `2026-08-11` — **implementer returned** (~36 min). Result file written. Its own claims, **not
  graded by me**: real-navigation design chosen over un-hiding; views enumerated from
  `main > *`; WO-3.5's block kept (Deliverable 4's permitted branch) with the measurement collapsed
  into one shared `measureIn()`; both mutations driven and reverted; 591 executed / 592 call sites
  recorded in `tools/README.md`. One residual it names itself: the stale-plan-entry direction is
  implemented but not mutation-driven.
- `2026-08-11` — verifier spawned at Opus, awaiting verdict.
- `2026-08-11` — **verifier returned: FAIL**, one ❌ on Acceptance 2. Lines 1, 3, 4, 5 ✅, with 3 and
  4 re-driven by the verifier itself in a scratchpad copy. The ❌: the contrast count `254` was
  arithmetic (250 cells + 4 flags), never printed by a run — WO-3.5's block measures **259**, and
  the wrong number is now in `tools/README.md`. Second finding, no acceptance line: the allowlist
  cross-reference to the non-line-anchored `else check(` is stale by 203 lines (`:10570` → `:10773`).
- `2026-08-11` — correction dispatched to the same implementer, verifier's ❌ quoted verbatim.
  Awaiting return. *(`SendMessage` is disabled this session, so the correction went to a fresh
  `work-order-implementer` at the same Opus tier with the ❌ and the prior report inline — the first
  implementer had already returned, so this is a correction round, not a second dispatch in flight.)*
- `2026-08-11` — **correction returned** (~3 min). Claims, not graded by me: four pointers fixed
  (254 → 259 in three files, `:10570` → `:10773` in two), each sentence now attributing the number
  to a run; `wo-sweep.mjs` re-run green, `16 checks · 15 passed · 0 failed · 1 to review`;
  `verify-shell.mjs` deliberately not re-run and said so.
- `2026-08-11` — verifier re-spawned at Opus on the corrected tree, awaiting verdict.
- `2026-08-11` — **verifier returned: PASS**, all five lines ✅, on two full `verify-shell.mjs` runs
  it made itself (591/591, zero SKIPs) plus `wo-sweep.mjs` green. No 👤 items. Maintenance owed:
  `--tick`, and the `CHANGELOG.md` entry, which is the teacher's.
