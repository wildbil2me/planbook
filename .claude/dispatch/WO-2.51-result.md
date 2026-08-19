# WO-2.51 — result

**Written by the parent session, not by the implementer.** The dispatch chain was killed by an API
session limit at ~19:50 on 2026-08-18 while the orchestrator was blocked on the implementer. Every
code and harness write had already landed; the report had not. This file records what was found on
the tree and what was re-verified, and it is deliberately shorter than a normal result file — it is a
salvage record, not a run log.

## Routing

Claude Opus, on the orchestrator's own reasoning: the deliverable is teacher-facing prose plus a
precedence judgment about which of two bands owns one strip.

## What the implementer built

- `src/attendance.js` — `termRollover()` (`termContaining(cls.id, todayISO())` against
  `getSelectedTerm()`, null when today is in no term or when they agree); `paintBanner()` rewritten
  to carry two messages with the off-today one winning, the precedence argued in its header;
  `paintRenderedTotals()` gained the band as a fourth repainted surface.
- `src/attendance.css` — `.rollover`, a caution tone on the same band. No new control class, so the
  coarse block's existing `.attendance-banner-btn` line covers the button.
- `index.html`, `sw.js` (`CACHE` v77 → v78), `tools/verify-shell.mjs` (+14 call sites, 904 → 918),
  `tools/README.md`.

## What was re-verified rather than believed

The dead run's `tools/README.md` prose cites figures it never got to record anywhere else. All of it
was re-run:

| Run | Result |
|---|---|
| Delivered tree | `939 checks · 939 passed · 0 failed · 0 skipped`, 25,141 lines, 305s, exit 0 |
| `wo-sweep.mjs` | `22 checks · 20 passed · 0 failed · 2 to review` — both REVIEWs the standing pair; call-site count 918 matches `tools/README.md` |
| Mutation 1 — `termRollover()` → `return null` | `939 · 929 passed · 10 failed` |
| Mutation 2 — precedence reversed (`… && !termRollover()`) | `939 · 937 passed · 2 failed` — exactly the two precedence checks |
| Line endings | every changed file LF-only; diffstat 552 insertions against a 109-line feature is not the WO-2.49 shape |

## Status

🔨 IN PROGRESS. Seven of eight Acceptance lines ticked; the 👤 iPad line is open and is the only
thing standing between this and ✅ DONE. `--audit` PASS. Not committed.
