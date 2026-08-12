# WO-3.12 dispatch status

- 2026-08-11 — gates checked, PASS. WO-3.4 ✅ DONE, tree clean, no prior dispatch files.
- 2026-08-11 — work order read in full (`plans/work-orders/phase-3-gradebook.md:761`).
- 2026-08-11 — Codex probe run: `SMOKE OK`, exit 0. Runner healthy.
- 2026-08-11 — claimed: `--start WO-3.12` → `🤖 CLAIMED — 2026-08-11`.
- 2026-08-11 — baseline harness run: **591 checks · 591 passed · 0 failed · 0 skipped · 194s**.
- 2026-08-11 — ROUTE CHANGED to **Claude Sonnet**. Initial route was Codex (spec complete,
  mechanically checkable, no sensitive surface, no new visual language, pattern set by WO-2.17/2.18).
  Overturned on evidence found while writing the brief: `tools/verify-shell.mjs:192` creates the
  browser profile with `fs.mkdtemp(os.tmpdir(), ...)`, a write outside the repo, which
  `codex exec --sandbox workspace-write` cannot make. Codex could not run the harness, and seven of
  eight Acceptance lines are run evidence — line 2 says "run, not reasoned." Tier is Sonnet by
  ROUTING.md § "Which Claude": the rubric found no judgment here and a sandbox limit does not change
  the work. Runner-up set aside: raising to Opus on the WO-2.4 harness-vacuity precedent — declined,
  because that would be a re-rubricing, and the work order's own explicit mutation protocol plus the
  Opus verifier cover it.
- 2026-08-11 — brief written to `.claude/dispatch/WO-3.12-brief.md`.
- 2026-08-11 — markers filled, brief complete (no ORCHESTRATOR markers remain).
- 2026-08-11 — implementer spawned at Sonnet, awaiting return. Expect 20-40 min; the harness alone is 194s per run and this work order needs at least six runs (baseline + four mutations + final). A flat status file and an unchanged git status are normal for the first ~20 min.
- 2026-08-11 — implementer returned. 4 checks added, 591 -> 595 green, 0 skipped. Reports 7 of 8 acceptance lines met; the studentId mutation reddened 5 checks rather than 1 and it left that line unticked rather than claiming it. src/ reported byte-identical.
- 2026-08-11 — verifier dispatched at Opus, awaiting verdict.
- 2026-08-11 — verifier returned: PASS WITH MANUAL CHECKS. 7 lines ✅, line 5 🙋 (owner ruling on "on its own" wording). Verifier re-ran all four mutations itself and confirmed src/ byte-identical. Awaiting owner go before any --tick.
