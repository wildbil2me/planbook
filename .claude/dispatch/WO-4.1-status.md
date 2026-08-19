# WO-4.1 — dispatch status

Pollable from outside while the dispatch runs. Deleted once
`.claude/dispatch/WO-4.1-result.md` exists — the result supersedes this.

- 2026-08-19 — gates checked: `PASS`, WO-2.4 ✅ and WO-3.4 ✅, no dispatch files, no prior claim.
  Tree dirty only in `design/mockups/` (unrelated in-flight design work, 6 modified + 3 untracked);
  not an interrupted run — no brief and no result file existed for WO-4.1.
- 2026-08-19 — work order read in full from `plans/work-orders/phase-4-signals.md`.
- 2026-08-19 — ROUTE: **Claude, Opus tier.** Deciding signal: establishes the evaluator/hit/
  explanation convention that WO-4.2, WO-4.3, WO-4.5 and WO-5.1's `{{signals.list}}` all copy, and
  the explanations are teacher-facing prose that reaches guardians. `ROUTING.md` § "Later phases,
  at a glance" calls WO-4.1 a strongest-Codex candidate and is **not** being followed: the work
  order's own Out of scope line moves every rule and all the specified arithmetic to WO-4.2/4.3.
  Runner-up set aside: the threshold values are fully tabulated in `docs/data-model.md`, a real
  Codex signal, but the new settings editor and the backup round-trip in Acceptance rule it out.
  No Codex probe run — not the Codex route.
- 2026-08-19 — claimed: `--start WO-4.1` wrote `🤖 CLAIMED — 2026-08-19`.
- 2026-08-19 — brief written to `.claude/dispatch/WO-4.1-brief.md`, 170 lines, 0 markers left.
- 2026-08-19 — implementer spawned at Opus, awaiting return. Expect 20-40 min. A flat status file,
  an absent result file and an unchanged `git status` are the normal shape of the first 20+ minutes
  while it reads; they are not evidence the child died. Do not spawn a second implementer on this
  claim.
- 2026-08-19 — orchestrator terminated by an API session limit while blocked on the implementer.
  The implementer's writes **landed**: `src/signals.js` (522 lines) and `src/signal-settings.js`
  (241) are new and untruncated, `index.html` +88, `src/shell.css` +99, `src/shell.js` +44, `sw.js`
  bumped v81 → v82 with both new files added to `SHELL`. `node --check` passes on all four JS files.
  Nothing is committed. **No implementer result file was ever written** — its self-report is lost,
  so nothing about it is evidence.
- 2026-08-19 — verifier re-dispatched alone against the tree, per the standing rule for a dispatch
  killed by an API error. No second implementer was spawned; the claim still stands.
- 2026-08-19 — verifier returned PASS WITH MANUAL CHECKS. All five Acceptance lines hold on the
  code, verified by construction rather than by observation: nothing in the repo calls `evaluate()`
  and `tools/verify-shell.mjs` is unmodified. Two rule ids registered (`grade-below` concern,
  `attendance-window` praise) — the minimum that proves the contract, not widened.
- 2026-08-19 — 👤 iPad sitting: **all six readings green**, owner, on hardware, after a force-quit.
  Overlay opens over the class manager and Escape returns to it; 22 rows scroll clean in both
  orientations; numeric keypad; caret holds while typing and the standing line tracks; value
  survives close/reopen; reset returns the line to all-22-at-ships-value; adjacent fields separate.
  These were the verifier's proposed manual list, not 👤 boxes — WO-4.1 has none to tick.
