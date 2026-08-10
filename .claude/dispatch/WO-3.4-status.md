# WO-3.4 — Grade engine · dispatch status

- 2026-08-10 — gates checked: PASS. WO-3.1 ✅, WO-3.2 ✅, tree clean, no prior dispatch files.
- 2026-08-10 — Codex probe: exit 0, `SMOKE OK`. Runner can write.
- 2026-08-10 — route chosen: **Codex**. Spec complete in `docs/data-model.md` § Grade math; every
  Acceptance line is a hand-computable number; no UI in scope; no sensitive surface.
- 2026-08-10 — claimed via `wo-gate.mjs --start` (🤖 CLAIMED — 2026-08-10).
- 2026-08-10 — writing the brief.
- 2026-08-10 — brief written (.claude/dispatch/WO-3.4-brief.md, no markers left).
- 2026-08-10 — Codex dispatched via tools/codex-invoke.mjs. Runs up to 20 min.
- 2026-08-10 — **CRASH.** The Claude Code process died after the Codex dispatch was launched and
  before its result was collected. No `WO-3.4-result.md` was ever written. The orchestrator's last
  status line above ("dispatched, runs up to 20 min") was therefore a claim about the past for the
  whole interval — Codex kept working after the process stopped being able to write about it.
- 2026-08-10 — **RESUME.** First act was `git status --short`, not this file. Confirmed on disk:
  `src/grade-engine.js` and `docs/grade-math-cases.md` untracked+new; `sw.js`, `src/shell.js` and
  `plans/work-orders/phase-3-gradebook.md` modified. Codex's work is present. Not re-dispatched and
  not re-routed, per the coordinator. Result file to be reconstructed from disk, verification to be
  run here, then the cold verifier.
- 2026-08-10 — verification run here, not in a sandbox. `wo-sweep.mjs` PASS (14/15, 1 standing
  REVIEW). `verify-shell.mjs` PASS (522/522, 0 skipped, 163s) — **but it holds zero WO-3.4 checks**,
  so it is green and blind to this work order. No Acceptance box ticked.
- 2026-08-10 — result reconstructed from disk into `.claude/dispatch/WO-3.4-result.md`, labelled as
  a reconstruction rather than the implementer's own report.
- 2026-08-10 — verifier dispatched, cold, against the 12-line Acceptance list.
- 2026-08-10 — **verdict: FAIL.** All 12 Acceptance lines verified ✅ by direct execution of the
  shipped module, but two defects outside the acceptance grid: (1) `grade-engine.js:96` concatenates
  the weight total raw instead of routing through `categories.js`'s `formatWeight()`, so it prints
  "94.80000000000001%" where the banner prints "94.8%" for the same class; (2) `shell.js:1446-1448`
  asserts harness coverage that does not exist — `verify-shell.mjs` is byte-identical to HEAD.
- 2026-08-10 — nothing ticked, nothing committed. Correction round NOT yet dispatched; awaiting the
  owner's word, since the crash makes an unattended 20-minute Codex run the wrong default.
- 2026-08-10 — WO-3.4 remains 🤖 CLAIMED. Do not release: the work is real and mostly good, and a
  release would set it back to ⬜ NOT STARTED and hand it to the next /wo as unstarted.
- 2026-08-10 — **correction round, and a deliberate departure from the same-implementer protocol.**
  The protocol says a FAIL goes back to the implementer that produced it, which here is Codex. The
  owner ruled otherwise and the reasoning is on the record: both defects are mechanical — one import
  plus one call site, then the harness checks — so the design judgment that put this work order in
  the Codex column was already spent at routing time and is not re-spent by the fix. Against that,
  this dispatch has already died once mid-flight, and another unattended twenty-minute Codex run
  risks stranding the owner a second time for work measured in minutes. **Implementer: Claude
  Sonnet** — Sonnet and not Opus, because the rubric found no judgment in this work order and a
  correction to mechanical defects does not add any. This is a deliberate call, not drift.
- 2026-08-10 — correction scope, fixed by the owner: (1) route the weight total through
  `formatWeight()`; (2) **write** the harness checks the shell.js comment claims, rather than delete
  the claim. Out of scope by explicit owner choice: the single-fixture gap (one class / one term /
  one student), which becomes a proposed follow-up work order instead — the verifier confirmed the
  filters hold, so the risk is a deliverable that cannot express the failure, not a live defect.
- 2026-08-10 — correction landed (Claude Sonnet). `formatWeight` imported and used in the
  weights-unbalanced message; a `--- grade engine ---` section added to `tools/verify-shell.mjs`
  with 13 checks driving all twelve worked cases through the seam. All 12 Acceptance boxes ticked
  by the implementer.
- 2026-08-10 — orchestrator re-ran verification: `verify-shell.mjs` 535/535, 0 skipped, 163s (up
  from 522 by exactly the 13 new checks); `wo-sweep.mjs` 14/15 with the one standing REVIEW. Both
  exit 0.
- 2026-08-10 — verifier dispatched a second time, cold.
- 2026-08-10 — **verdict: PASS.** The verifier mutation-tested the new harness rather than trusting
  it: 9 of 9 arithmetic mutants of `src/grade-engine.js` are caught by the 13 new checks, so they
  are real evidence and not self-agreement. All 12 Acceptance lines verified; no 👤 items (this work
  order ships no UI). Three coverage gaps named, none of them a failure — see the report.
- 2026-08-10 — `--tick WO-3.4 --dry-run` shown to the owner. Not applied; awaiting the word.
- 2026-08-10 — maintenance applied on the owner's word: Status ✅ DONE, roadmap box ticked, both
  dashboards recomputed, `ROADMAP.md`'s two lagging rows hand-edited. `CHANGELOG.md` untouched.
- 2026-08-10 — `--audit` then caught a consequence of the tick: WO-3.3's `**Owes** WO-3.4` pointer
  now landed on a ticked box. Debt discharged on WO-3.4's verified worked case 5 — WO-3.3's
  zero-point line ticked, the pointer replaced with the evidence, `WO-3.4` dropped from its Owes
  field. `--audit` PASS.
- 2026-08-10 — WO-3.12 booked from the two coverage gaps the verifier named. Nothing committed.
- 2026-08-10 — **WO-3.4 closed.** Result file supersedes this status; kept for the crash record.
