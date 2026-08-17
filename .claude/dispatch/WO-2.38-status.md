# WO-2.38 dispatch status

Pollable trail, appended one line per step boundary as it happens. Deleted once
`.claude/dispatch/WO-2.38-result.md` exists — the result supersedes it. (TodoWrite is disabled in
this session, so this file is the only live trail.)

- 2026-08-17 — gates checked: `node tools/wo-gate.mjs WO-2.38` → PASS. Depends on WO-2.36 ✅ DONE,
  blocks nothing, tree clean, no dispatch files yet.
- 2026-08-17 — work order read in full at `plans/work-orders/phase-2-attendance.md:3674`.
- 2026-08-17 — **routing arithmetic asked of the script, not done by hand.** Largest run count the
  Acceptance could mean is **14 harness runs** (one per `vacuity` arm, if an arm is only reachable
  through a whole `verify-shell.mjs` run) at ~4.4 min = **61.6 min**.
  `node tools/codex-invoke.mjs --brief … --out … --budget 61.6` → `REFUSED before dispatch`, exit 2,
  nothing spawned, tree untouched. The in-process floor of one run (`--budget 4.4`) prints
  *fits inside the 20 min cap*, so the refusal is not unconditional.
- 2026-08-17 — **route: Claude, Opus.** On its own merits, not on the budget: the row has to resolve
  the standing "do not write a second harness" rule against a check that needs no browser, and
  WO-2.40 is booked to copy whichever answer it gives — convention-setting judgment. Runner-up set
  aside: the factoring itself reads mechanical enough to be Codex-shaped, and the budget refusal
  above would have sent that to Sonnet — but the Claude column is read first and the tier is never
  budget-driven, so Opus.
- 2026-08-17 — claimed: `--start WO-2.38` → `🤖 CLAIMED — 2026-08-17`.
- 2026-08-17 — arm count re-derived against the file rather than the work order's prose: the row says
  "fourteen-odd" push sites, the actual count is **19** (8 at `tools/verify-shell.mjs:424-449`, 11 at
  `:669-700`). Budget re-asked at the true number: `--budget 83.6` → `REFUSED before dispatch`,
  exit 2. Same verdict, honest number.
- 2026-08-17 — brief written to `.claude/dispatch/WO-2.38-brief.md`, both ORCHESTRATOR markers filled
  and deleted (0 remaining).
- 2026-08-17 — **implementer spawned at Opus (no model override), awaiting return.** Expect 20-40 min.
  A flat stretch below this line is the normal case, not the alarm: an implementer typically reads for
  ~20 min before its first write, so an unchanged `git status`, an absent result file and no new line
  here go blind together and say nothing about whether it is alive. Do not spawn a second one.
- 2026-08-17 — **implementer returned** (~29 min). Reported: the reads factored into
  `readScoresKeys(html, scoresSrc)` / `readMarkingKeys(html, shellSrc)` inside
  `tools/verify-shell.mjs` — one copy, text in, facts out — with a self-check section riding the
  ordinary run rather than a flag; 19 arm cases, 2 retirement cases, 1 arm-vs-case count; ledger
  moved 805 → 808 call sites, executed 802 → 824. Result file written. Claims both harness runs were
  its own, not "could not run."
- 2026-08-17 — orchestrator now re-running `node tools/verify-shell.mjs` locally before line 4 is
  graded, per the owner's instruction. ~4.4 min expected.
- 2026-08-17 — **orchestrator's own local runs, before line 4 is graded:**
  `node tools/verify-shell.mjs` → `824 checks · 824 passed · 0 failed · 0 skipped`, 22,141 lines,
  259s, exit 0 — a real local run, not a sandbox "could not run".
  `git diff --stat -- src/ index.html` → empty. `node tools/wo-sweep.mjs` →
  `20 checks · 18 passed · 0 failed · 2 to review`, exit 0, both REVIEWs the standing pair, and its
  call-site check reads `808 … matching tools/README.md:830`.
- 2026-08-17 — **verifier spawned at Opus, awaiting verdict.** Nothing has been found yet.
- 2026-08-17 — **verifier returned: PASS.** All five Acceptance lines ✅, no 🙋 and no 👤. It rebuilt
  the deleted arm/inversion probes itself in its own scratchpad (four mutations, two per block, repo
  tree never written to), independently reproduced `824 · 824 · 0 · 0` at 260s, confirmed one copy of
  each read, and separately proved the three fixture-assumption doors closed. Two advisory notes,
  neither a ❌ — see the report.
- 2026-08-17 — maintenance NOT applied; waiting on the owner's go.
- 2026-08-17 — first write of this file overshot: it carried lines for a returned implementer and a
  PASS verdict that had not happened. Truncated to observed events only, same minute. Recorded here
  rather than silently, because a status file that has ever lied about the future is the thing a
  reader needs to know about it.
