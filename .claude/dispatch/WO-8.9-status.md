# WO-8.9 dispatch status

- 2026-08-15 — gates checked, `PASS | gates clear for WO-8.9`, tree clean, no prior dispatch files.
- 2026-08-15 — work order read in full (`plans/work-orders/phase-8-packaging.md:597`).
- 2026-08-15 — Codex exec-time probe run: `SMOKE OK`, exit 0. No fallback.
- 2026-08-15 — route chosen: **Codex**. Size-S grep in a tool made of greps; spec fully written;
  all four acceptance lines mechanically checkable. Runner-up set aside: the failure-text prose
  deliverable, which the work order dictates verbatim rather than leaving to judgment.
- 2026-08-15 — claimed: `🤖 CLAIMED — 2026-08-15`.
- 2026-08-15 — brief written to `.claude/dispatch/WO-8.9-brief.md`, both ORCHESTRATOR markers filled.
- 2026-08-15 — Codex dispatched via `tools/codex-invoke.mjs --brief --out`, awaiting return.
  Codex runs long; expect up to 20 minutes. A flat file here is not evidence it died.
- 2026-08-15 — Codex returned, exit 0, result file written. Diffstat 3 files, +47/-9 — no CRLF rewrite.
- 2026-08-15 — orchestrator re-ran both harnesses locally (Codex's sandbox could not start Edge):
  `verify-shell.mjs` 762 checks · 762 passed · exit 0.
  `wo-sweep.mjs` 19 checks · 16 passed · 1 failed · 2 to review · exit 1.
  The one FAIL is the CACHE-bump check and is **pre-existing**: src/scores.css and src/scores.js
  changed at f63792f, after planbook-shell-v62 was set at cafc096. Codex touched no file under src/.
  Codex's own sandbox run reported 15 passed / 0 failed / 4 to review — its git could not make the
  same comparisons. Named to the verifier.
- 2026-08-15 — verifier dispatched at Opus, awaiting verdict.
- 2026-08-15 — verifier returned **FAIL**, one line: tools/README.md:1058 records the sandbox tally
  `19 checks · 15 passed · 0 failed · 4 to review`, a figure no run of this tree produces. Acceptance 3
  tick unearned. The other three lines verified clean; the check survived seven adversarial fixtures.
- 2026-08-15 — correction brief written, dispatched to Codex (same implementer), awaiting return.
- 2026-08-15 — Codex returned from correction, exit 0. README:1058 now reads `19 checks` (count-only);
  Acceptance 3 un-ticked and annotated with the f63792f CACHE debt. wo-sweep.mjs untouched by the
  correction. Re-verification dispatched, awaiting verdict.
- 2026-08-15 — verifier returned **PASS** on re-verification. All four lines re-walked from output it
  produced itself; Acceptance 3 stays `- [ ]` on its "green on a clean tree" clause, blocked by the
  pre-existing f63792f CACHE debt. `--tick` will land 🔨 IN PROGRESS. Reporting to the user.
