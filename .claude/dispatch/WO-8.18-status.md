# WO-8.18 dispatch status

- 2026-09-26 gates PASS (WO-8.10 ✅), tree clean at d9c373d.
- 2026-09-26 route Claude Opus. Traps are judgment (which caches may die, and only once this worker is active; the existing activate deletes every non-CACHE name and must narrow to the shell prefix) and the row owns an open question (why activate does not finish on iOS). Runner-up Codex (SW cache plumbing is Codex-shaped) set aside on budget: verify-shell is ~574s/run on this tree (WO-8.17), x3 runs (1 clean + 2 mutations) = ~29 min > 20 min cap.
- 2026-09-26 --start ran: 🤖 CLAIMED — 2026-09-26.
- 2026-09-26T21:04:41Z brief written: .claude/dispatch/WO-8.18-brief.md (~11 KB, markers filled).
- 2026-09-26T21:04:48Z implementer spawned at Opus (no model override), brief .claude/dispatch/WO-8.18-brief.md, awaiting return. Expect 20-40 min; ~10 min/harness run. A flat file here is normal while it reads.
- 2026-09-26T21:42:16Z implementer returned: result file present. It claims Acceptance 1-3 met and ticked (1538/1538 clean, both mutations red, and reverted). sw.js: fromCurrent() scoped lookups, clearOldShells() prefix-scoped in activate and after each app navigation, never deleting a higher-numbered shell cache, CACHE v135. New tools/verify/stuck-update.mjs. The iOS cause is still unknown. 👤 line open.
- 2026-09-26T21:42:16Z --handoff ran: 🔍 AWAITING VERDICT. This session stops here; the verifier is owed in a fresh session.
- 2026-09-26T21:44:44Z verifier session: row 🔍 AWAITING VERDICT, grep MUTATION over delivered files clean, node --check OK. Spawning work-order-verifier at Opus, first pass.
- 2026-09-26T22:15:45Z verifier returned: PASS WITH MANUAL CHECKS. Acc 1-3 ✅ (verify-shell 1538/1538 EXIT=0 re-run; sweep 42/0/3; own mutations A,B,C all red and reverted, sw.js byte-identical). Acc 4 👤 open (stuck iPad after v135 deploy). Nothing ticked; awaiting owner go for --tick (will land 🔨) and deploy.
