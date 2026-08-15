Corrected report saved to [WO-8.9-result.md](C:\dev\planbook\.claude\dispatch\WO-8.9-result.md).

WO-8.9 correction round 1 completed.

Acceptance:

1. PASS — deleting `_headers` made `wo-sweep.mjs` exit 1 in the original implementation run.
2. PASS — changing `/sw.js` to `max-age=14400` made the sweep exit 1 in the original run; a commented-out pin also failed.
3. NOT MET — the recorded count agrees at `19 checks`, but the sweep is not green on a real clean tree today. The verifier's detached worktree at HEAD produced `19 checks · 16 passed · 1 failed · 2 to review`. The failure is pre-existing stale-CACHE debt: f63792f ("Strike WO-3.13") changed `src/scores.css` and `src/scores.js` after cafc096 set `planbook-shell-v62`. The owner of f63792f owes the `sw.js` CACHE bump; it is outside WO-8.9 and was not changed here.
4. PASS — the failure text names `verify-deploy.mjs` as what proves whether the header actually binds.

Correction:

- Replaced the false README breakdown with count-only wording: `19 checks`. I chose count-only because this sandbox cannot obtain the two git-dependent verdicts, while the known real-tree failure is transient and should not be preserved as a lasting pass/fail breakdown.
- Searched all of `tools/README.md`: line 1058 was the only occurrence of the false `15 passed · 0 failed · 4 to review` breakdown. The other WO-8.9 count references correctly say 19 and needed no correction.
- Unticked Acceptance 3 and annotated it with the pre-existing failure and owning commit f63792f.
- Left `tools/wo-sweep.mjs`, `sw.js`, and everything under `src/` untouched in this correction.

Verification:

- `node tools/wo-sweep.mjs` ran here and exited 0, but its actual sandbox summary was `19 checks · 15 passed · 0 failed · 4 to review`. This is not evidence that the real tree is green: both git-dependent checks explicitly reported that git could not be asked and degraded to REVIEW. I did not copy that breakdown into project documentation again.
- The verifier supplied the authoritative real-tree result quoted above: `19 checks · 16 passed · 1 failed · 2 to review`.
- `node --check tools/wo-sweep.mjs` and `git diff --check` both exited 0.
- Per the correction brief, I did not run `node tools/verify-shell.mjs` or attempt a workaround. It was run locally outside this sandbox: `762 checks · 762 passed · 0 failed · 0 skipped`, exit 0.