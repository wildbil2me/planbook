# WO-2.27 dispatch status

- 2026-08-14 — gates checked, PASS. Depends on WO-2.9 ✅ DONE, WO-2.26 ✅ DONE. Tree clean, no prior dispatch files.
- 2026-08-14 — work order read in full (`plans/work-orders/phase-2-attendance.md:2565`).
- 2026-08-14 — route: **Claude, Opus tier**, on its own merits. Deciding signal: the Traps section is
  entirely judgment (do not add the redraw; do not delete the promise; the hook diff is destructive run
  in reverse), and four of five deliverables are prose whose value is that a future reader trusts it.
  Runner-up set aside: the two harness gaps are mechanically specified and would read Codex in
  isolation, but they ship inside a size-S order whose central deliverable needs an argued asymmetry
  comment, and splitting one small order across two runners costs more than it saves. No Codex probe —
  not the Codex route.
- 2026-08-14 — claimed: `🤖 CLAIMED — 2026-08-14`.
- 2026-08-14 — brief written to `.claude/dispatch/WO-2.27-brief.md`.
- 2026-08-14 10:40 — implementer spawned at Opus (no model override), awaiting return. Expect 20-40 min; a flat status file, an absent result file and an unchanged git status are the normal look of a reading implementer for the first ~20 minutes.
- 2026-08-14 11:20 — implementer returned. 8 of 9 acceptance lines ticked; line 1 left `[ ]` deliberately with a stated finding (leaving the registry never routes through paintPassBanner, and standing the clock down on view change would silence WO-2.9 overdue alerts off-registry). verify-shell 748/748, wo-sweep 18 checks 16 passed 2 review. Result file written.
- 2026-08-14 11:20 — verifier dispatched at Opus, awaiting verdict.
- 2026-08-14 11:39 — verifier verdict in: **FAIL**, on Acceptance line 1 first clause only. 8 of 9 marked ✅, no 🙋. Verifier reproduced falsifications B (741/748) and C (746/746 at HEAD) itself and added its own D (747/748). It states plainly that no code change should be made to satisfy line 1 as written — it needs an owner decision. Two new comment inaccuracies named as correctable. Held here; not ticked, claim left at 🤖 CLAIMED pending the owner call.
