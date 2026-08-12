# WO-2.22 dispatch status

Poll this file while the dispatch runs. Deleted once `WO-2.22-result.md` exists.

- `2026-08-11 · gates` — `wo-gate.mjs WO-2.22` PASS. Depends on WO-2.19 ✅ DONE. Tree clean, no
  prior dispatch files. (A first attempt at this dispatch died on a connection error after the gate
  check and before any write; nothing to salvage, so this is a cold start, not a resume.)
- `2026-08-11 · route` — **Claude, Opus.** Two of four Deliverables are prose that must reconstruct
  an argument (why the sweep's own count is unguarded; why `verify-shell.mjs` must not assert its
  own summary), and the Traps section is a judgment trap — "Do not switch §11 to counting
  occurrences per line. It looks like the fix and it is the wrong one." Runner-up set aside: the
  code half is small and mechanically checkable, i.e. Codex-shaped, but the Out of scope line
  refuses an obvious eight-line follow-up on reasoning a completeness-seeking runner would override.
  Ties go to Claude. No Ship 1 table row for WO-2.22, so nothing to disagree with. No Codex probe
  run — step 2b is Codex-route only.
- `2026-08-11 · claim` — `--start WO-2.22` wrote `🤖 CLAIMED — 2026-08-11`.
- `2026-08-11 · brief` — written to `.claude/dispatch/WO-2.22-brief.md`, carrying the owner's
  standing constraint for this dispatch: evidence lands BESIDE an Acceptance line, never INTO it.
- `2026-08-11 · spawn` — implementer spawned at **Opus**, awaiting return. Expect 20-40 min. A flat
  status file, an absent `WO-2.22-result.md` and an unchanged `git status` are the normal shape of a
  reading implementer for its first 20+ minutes — they are not evidence it died. Do not spawn a
  second one against the `🤖 CLAIMED` row.
- `2026-08-11 · returned` — implementer returned. Result file written. Sweep green at
  `17 checks · 16 passed · 0 failed · 1 to review`, exit 0. True call-site count measured at 596.
  Claims all six Acceptance lines met and no Acceptance wording altered (six box characters only).
- `2026-08-11 · verifier` — verifier dispatched at Opus, awaiting verdict.
- `2026-08-11 · verdict` — **PASS.** All six Acceptance lines verified, four by commands the verifier
  re-ran itself (both missing-file mutations, the append mutation, the before/after run diff). The
  Acceptance-wording check came back clean: only `- [ ]` -> `- [x]` markers changed; line 2's
  stale `560`/`561` intact. The one Status-line change is the orchestrator's own `--start` claim,
  made before the implementer ran — not an implementer edit. Maintenance NOT applied; awaiting the
  owner's go.
