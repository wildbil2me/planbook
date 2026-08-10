# WO-3.17 dispatch status

- 2026-08-10 — gates checked, PASS. Depends on WO-3.3 ✅ DONE. Tree clean, no prior dispatch files.
- 2026-08-10 — work order read in full. Two parts: iPad date-field overlap (real mechanism: iOS Safari native `<input type="date">` paint vs. flex box), and creation-time default of today + rewriting the hint prose at `index.html:806`.
- 2026-08-10 — route chosen: **Claude, Opus tier**, on its own merits. Deciding signal: teacher-facing prose deliverable (the bold "Neither date fills itself in" hint must be rewritten and keep its no-timetable reasoning). Runner-up set aside: the CSS half is unusually well-specified and reads Codex, but it ships in one dialog with the prose and the traps are judgment traps. No Codex probe run — this did not route to Codex.
- 2026-08-10 — claimed: 🤖 CLAIMED — 2026-08-10.
- 2026-08-10 — brief written to `.claude/dispatch/WO-3.17-brief.md`.
- 2026-08-10 — implementer spawned at Opus (no model override; routed to Claude on merits), awaiting return. Expect 20–40 min; a flat status file and an absent result file are normal for the first ~20 while it reads.
- 2026-08-10 — implementer returned. Result file present. One CSS declaration (appearance reset), creation-time date default, both hint surfaces rewritten, 9 new harness checks, 4 mutations run and reverted. Implementer ran --tick itself: landed 🔨 IN PROGRESS with line 6 (👤 iPad) open, which is correct.
- 2026-08-10 — verifier (Opus) returned: PASS WITH MANUAL CHECKS. No ❌. Lines 1–5 ✅ and each tick checked true; line 6 🙋 (👤 iPad, still - [ ]). Dispatch complete; awaiting owner on the iPad sitting before any further maintenance.
