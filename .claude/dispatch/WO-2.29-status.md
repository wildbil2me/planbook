# WO-2.29 — correction round, dispatch status

Poll this file from outside while the dispatch runs. Appended at each step boundary, in the past
tense only. Deleted once the correction result file exists; the result supersedes it.

- **2026-08-14 — gates checked.** `node tools/wo-gate.mjs WO-2.29` → `PASS`. Depends on WO-2.9 ✅ and
  WO-2.28 ✅, both DONE. Tree intentionally dirty (14 paths) — WO-2.29's own uncommitted delivery at
  HEAD `20e4dd3`, plus the temporary `audio-probe.html` the owner is keeping. Not contamination, not
  a failed gate.
- **2026-08-14 — route chosen: Claude, Opus tier.** Cross-repo design-lift judgment: Roll Call!'s
  unlock premise was falsified on glass, so the implementer must decide what of the lift stays
  faithful (frequencies, note counts, gains — the WO-2.11 scar) and what departs, then write the
  comment prose recording why a lifted decision was overridden. Runner-up considered and set aside:
  Codex, since the owner's recommended fix shape reads nearly as a spec — set aside because the value
  is in what the comments claim and what the harness may assert, and a comment asserting a false
  premise is precisely the defect that shipped last round. No Codex probe run; step 2b is
  Codex-route only.
- **2026-08-14 — claimed.** `--start` refused by design (`🔨 IN PROGRESS` is part-built, not
  claimable; WO-3.11 made the pickup a deliberate hand edit). Status line hand-edited to
  `🤖 CLAIMED — 2026-08-14 correction`.
- **2026-08-14 — correction brief written**, 352 lines, no `ORCHESTRATOR` markers left, to
  `.claude/dispatch/WO-2.29-correction-brief.md`.
- **2026-08-14 — implementer spawned at Opus, awaiting return.** Expect 20–40 min. A flat status
  file, an absent result file and an unchanged `git status` are the normal shape of a reading
  implementer's first ~20 minutes; they are not evidence of a hang. Nothing below this line has been
  observed yet.
- **2026-08-14 — implementer returned** (~41 min). Result file written to
  `.claude/dispatch/WO-2.29-result-correction.md`; round 1's result file untouched. Reports one
  page-lifetime AudioContext minted inside the first gesture and never closed, `visibilitychange`
  resuming that same context, one new seam check watched failing under two mutations, `sw.js` bumped
  v59 → v60, `verify-shell.mjs` 757/757 exit 0. Diffstat proportionate (617 insertions across 10
  tracked files); `audio-probe.html` untouched and still untracked.
- **2026-08-14 — verifier spawned at Opus, awaiting verdict.**
- **2026-08-14 — verdict in: PASS WITH MANUAL CHECKS** (~11 min). Acceptance 1-5 and 7 ✅ (all six
  inherited ticks re-derived against the code on disk, not taken on trust); line 6 🙋, still `- [ ]`
  in both places, every static precondition ruled out. Verifier ran both harnesses itself: 757/757
  exit 0, sweep 18 · 16 · 0 · 2. Two non-blocking findings raised for the queue. No ticks applied —
  waiting on the owner. Dispatch complete.
