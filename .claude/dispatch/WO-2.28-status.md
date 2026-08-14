# WO-2.28 dispatch status

Polling file. Deleted once `.claude/dispatch/WO-2.28-result.md` exists — the result supersedes it.

- 2026-08-14 — gates checked, PASS. Depends WO-2.9 ✅, WO-2.27 ✅. Tree clean, no prior dispatch files.
- 2026-08-14 — work order read in full, plus `src/attendance.js:2890`–`3024` (the clock, the paint,
  the alert) and `ROUTING.md`.
- 2026-08-14 — **ROUTE: Codex.** No judgment left in it — the design question was split out to
  WO-2.29 on 2026-08-14, leaving a four-line guard relocation named to the line, a Roll Call!
  reference cited by line number, no UI, no sensitive surface, and mechanically checkable acceptance.
  Runner-up set aside: the 20-line decision-record comment at `src/attendance.js:2899` is house-voice
  prose whose accuracy is load-bearing, which is the one part that reads Claude.
- 2026-08-14 — `codex-invoke.mjs --probe`: exit 0, `SMOKE OK`. Runner writes. Suspension stays lifted.
- 2026-08-14 — claimed: `--start WO-2.28` wrote `🤖 CLAIMED — 2026-08-14`. Nothing else touched.
- 2026-08-14 — brief written, 235 lines, no markers left:
  `.claude/dispatch/WO-2.28-brief.md`. Points at `src/attendance.js:2890`–`3024`, the WO-2.9 harness
  block at `tools/verify-shell.mjs:9909`–`10250` and its `windBack`/`hush`/`heard` helpers, and Roll
  Call!'s `src/dashboard.html:3511`–`3538`.
- 2026-08-14 — **implementer (Codex) spawned, awaiting return.** Expect a long run; the script caps
  itself at 20 min and the outer call at 600 s. A flat status file, an absent result file and an
  unchanged `git status` are the normal shape of a reading implementer and are not evidence it died.
- 2026-08-14 — **implementer returned.** Exit 0, result file written. First Codex run in this project
  to produce code. It reported honestly that it could not execute `verify-shell.mjs` (Edge never wrote
  `DevToolsActivePort`) and claimed no pass for lines 1, 2, 3 or 5. Source diff is correct: the guard
  at `src/attendance.js:2982` now wraps only the two DOM writes.
- 2026-08-14 — orchestrator ran the harness locally, which is the step the sandbox owes. **It aborts.**
  New check 1 PASSES; new check 2 crashes the run at `verify-shell.mjs:10041` on
  `[data-pass-issue="undefined"][data-pass-type="nurse"]` — `alertStudent` is undefined because
  `ids.filter(id => id !== passClass)[0]` lands on the class this run deliberately leaves with an
  empty roster (documented at `verify-shell.mjs:9272`–`9279`, which picks its neighbour by
  `(x.roster || []).length > 0`). Every check after 10041 never ran.
- 2026-08-14 — `wo-sweep.mjs`: 14 passed, **2 failed**. (a) `sw.js` CACHE not bumped though
  `src/attendance.js` changed; (b) `tools/README.md:783` still records 750 `check()` sites against 752.
  **(a) is an orchestrator error** — the brief's "exactly two files should change" line is what stopped
  it, and the CACHE bump is a standing project rule.
- 2026-08-14 — **correction round 1 dispatched to the same implementer (Codex).** Scope: the fixture
  selection and the CACHE bump. `tools/README.md`'s count is deliberately held back to round 2 — its
  executed-check figure has to come from a completed run, which only the orchestrator can produce.
- 2026-08-14 — **correction returned.** Fixture selection fixed, non-throwing guards added, `sw.js`
  bumped to `planbook-shell-v58`, `src/attendance.js` byte-identical.
- 2026-08-14 — orchestrator re-ran the harness locally: **752 checks, 751 passed, 1 failed, 248s.**
  The run now completes. The single red is the second new check, and its evidence is the finding:
  `alerted = 1`, announcement correct, open class correct, hidden banner NOT repainted — but
  `Scores shown = false, registry shown = true`.
- 2026-08-14 — **BLOCKED, and it is the work order rather than the implementer.** `selectClass()`
  (`src/classes.js:467`–`475`) calls `showView('class')` unconditionally, and the tab handler
  (`src/shell.js:914`–`919`) is documented at `src/shell.js:39` as opening a class *to its registry*.
  So "switch class while off the registry" — Acceptance line 2's scenario — is not reachable by any
  class-tab route: the switch lands on the registry, which paints the banner. The only route that
  moves `openClass()` without a registry paint is `getSelectedClassId()`'s stale-id fallback
  (`src/classes.js:165`–`170`), i.e. archiving or deleting the open class while on Scores.
- 2026-08-14 — **stopped and brought the user in**, per the two-failures rule. No verifier dispatched:
  the blocking question is what Acceptance line 2 should assert, which is the teacher's call and not
  one a verifier or an orchestrator may take. Nothing ticked. Claim left at `🤖 CLAIMED`.
- Status file kept rather than deleted: it holds the local harness result and the blocking analysis,
  neither of which is in the implementer's result file.
- 2026-08-14 — **owner chose option (b).** Acceptance line 2 re-cut in the work order by the
  orchestrator, with the unreachability evidence recorded in the work order itself.
- 2026-08-14 — **correction round 2** (property check + `tools/README.md` count). Harness re-run
  locally: 752 checks, **2 failed** — both assertion defects in the new checks, not the fix. The red
  check's own evidence read `matching elapsed nodes = 0, alerted = 1` with the sentence naming the
  student, i.e. the acceptance property holding inside a check that reported FAIL.
- 2026-08-14 — orchestrator diagnosed both: (a) `card0.name` renders "Last, First" while `announce()`
  renders "First Last", so that equality can never hold; (b) the live-region restore ran *before* the
  navigation that re-announces and clobbers it, and `heard()` was read twice across a live interval.
- 2026-08-14 — **correction round 3** with both diagnoses named exactly. Harness re-run locally:
  **752 checks · 752 passed · 0 failed · 248s.** Sweep: **18 · 16 passed · 0 failed · 2 to review.**
- 2026-08-14 — **regression evidence supplied by the orchestrator**, which Codex could not produce.
  `src/attendance.js` backed up (md5 `2bc9914f76939da6729e1cfbb10e572e`), `if (!node) return;` put back
  at the top of the loop, harness re-run: **752 · 751 passed · 1 failed**, the red being the
  missing-node check, reporting `alerted = undefined` and the live region still holding the hush
  sentinel — nothing announced at all. File restored, md5 confirmed identical.
- 2026-08-14 — retro written: `plans/dispatch-retro.md` gains two sections — the "exactly two files"
  scope line that suppressed the CACHE bump, and the finding that an implementer which cannot run the
  harness cannot converge on assertions written against it (three rounds, three assertion defects,
  zero code defects).
- 2026-08-14 — **verifier spawned at Opus, awaiting verdict.** Nothing ticked. Claim still `🤖 CLAIMED`.
