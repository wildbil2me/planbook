# WO-1.26 — dispatch status

- 2026-08-25 — gates PASS. No dependencies, WO-1.5 hard-ordering satisfied, tree clean.
- 2026-08-25 — route **Claude Opus** — Size L is an explicit Claude-column trigger, it sets the
  convention every future harness edit copies, and its Traps are judgment. Codex off the table
  independently on budget: ~4.4 min/run x 31 sections vs a 20-min INVOKE_TIMEOUT_MS. No probe run.
- 2026-08-25 — `--start WO-1.26` ran; row reads `CLAIMED — 2026-08-25`.
- 2026-08-25 — pre-split harness baseline captured to scratchpad/baseline.txt from a clean tree
  (the number every Acceptance line here compares against).
- 2026-08-25 — brief written to `.claude/dispatch/WO-1.26-brief.md`, ~15 KB, no markers left.
  Carries four pre-dispatch findings: the flat top-level-script shape, the wo-sweep census that
  greps only tools/verify-shell.mjs, the ownLines lines-per-check figure, and the baseline path.
- 2026-08-25 — baseline GREEN: 1156 checks / 1156 passed / 0 failed / 0 skipped, 394s, exit 0.
  Pinned into the brief as the contract; 15% band = 335-453s. Note 1156 executed vs 1141 call
  sites in tools/README.md — different quantities, gap already named by wo-sweep.
- 2026-08-25 — implementer spawned at **Opus**, brief `.claude/dispatch/WO-1.26-brief.md`,
  awaiting return. Expect 30-60 min for an L split with a per-section harness run.
