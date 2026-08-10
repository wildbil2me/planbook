# WO-2.19 dispatch status

Poll this file from outside. Deleted once `WO-2.19-result.md` exists.

- 2026-08-10 — gates checked, `node tools/wo-gate.mjs WO-2.19` → PASS. Status `⬜ NOT STARTED`,
  size S, no dependencies, tree clean, no prior dispatch files. No interrupted run to inherit.
- 2026-08-10 — work order read in full at `plans/work-orders/phase-2-attendance.md:1635`.
- 2026-08-10 — **route: Claude, Opus tier**, on its own merits. Deciding signal: the central
  deliverable is a determination nobody has made — which four `check()` call sites a run does not
  reach, or whether the gap is structural — and the Trap names the exact failure a green-run-seeking
  model produces (asserting `541 === 537` by rounding the difference away). Secondary: it writes
  `tools/README.md` prose and a `TESTING.md` mutation table, both in ROUTING's Claude column.
  Runner-up set aside: on surface this is the strongest Codex shape left on the board — pure tooling,
  nothing in `src/`, no UI, no sensitive data. Had the four-site gap already been named, it would
  have gone to Codex. No Ship 1 table row exists for WO-2.19, so no table disagreement. No Codex
  probe run — the route was not decided by runner health.
- 2026-08-10 — brief written to `.claude/dispatch/WO-2.19-brief.md`, all ORCHESTRATOR markers filled.
  Brief carries a measurement correction: the work order's 542/541/537 figures are from `6e90e53`;
  this tree is `1f5217c` and the same grep returns 561. Implementer instructed to re-derive.
- 2026-08-10 — implementer spawned at Opus, awaiting return. Expect 20–40 min; a flat status file,
  an absent result file and an unchanged `git status` are the normal shape of a reading implementer
  for its first ~20 minutes and are NOT evidence it died. Do not spawn a second one — WO-2.19 carries
  `🤖 CLAIMED`. If it genuinely died, the only clean exit is `node tools/wo-gate.mjs --release WO-2.19`.
- 2026-08-10 — **implementer returned** (~17 min, 77 tool uses). Result file exists at
  `.claude/dispatch/WO-2.19-result.md`. Four files modified: `tools/wo-sweep.mjs`, `tools/README.md`,
  `TESTING.md`, `plans/work-orders/phase-2-attendance.md`. `src/` untouched. Headline: the gap is
  structural, not four — 560 call sites, 554 executed, 28 never-firing failure arms and 10 in loops.
  Sweep asserts call sites; README names the executed count. Self-reported all five Acceptance lines
  met, three findings raised, none fixed. Not graded by me.
- 2026-08-10 — verifier spawned at Opus, awaiting verdict. Nothing is ticked and no report is written
  until it reports.
- 2026-08-10 — **verifier returned: PASS.** All five Acceptance lines ✅, no ❌, no 🙋. It re-ran
  everything in a scratchpad copy rather than reading the result file, reproduced all three mutations
  plus four the implementer never claimed, and independently re-instrumented the harness to confirm
  560/554/532/22/28. Two residual holes named as findings, neither an acceptance failure. Awaiting
  the user's go before any `--tick`.
