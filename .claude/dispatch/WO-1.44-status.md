# WO-1.44 — dispatch status

2026-08-31 — gates checked, PASS. `wo-gate.mjs WO-1.44`: ⬜ NOT STARTED, no dependencies, hard
ordering WO-1.5-before-WO-1.44 satisfied, tree clean, no dispatch files.

2026-08-31 — **route Claude Opus.** On its own merits, not by fallback: the primary deliverable is a
written *harness-or-app* verdict per failure (judgment, not a spec to implement), it edits the
instrument every Acceptance line in the project is read through, and the crash fix must argue against
a deliberate design decision stated at `tools/verify-shell.mjs:43` rather than undo it. Runner-up set
aside: Codex has a real claim on the crash-containment half, but the budget refuses it outright —
429s recorded per run × at least four full runs the Acceptance demands (clean, planted selector,
three weekdays) is ~30 min against a hard 20-min `INVOKE_TIMEOUT_MS`. No probe run; the Claude column
is satisfied first, per ROUTING § "Which Claude".

2026-08-31 — **orchestrator ran `verify-shell.mjs` before briefing, and it RAN.** This is the one
Trap the work order flags as usually fatal to a dispatch, so it was worth two minutes to settle:
headless Edge launched, 518 results (513 PASS / 5 FAIL), then the identical throw at
`verify-shell.mjs:465` — `nothing to click for #daysOffList [data-dayoff-remove="undefined"] [0]`.
**Third identical run, and the first taken from a dispatch environment rather than the owner's own
shell.** Log preserved at `.claude/dispatch/WO-1.44-orchestrator-probe.log`; the brief points at it
as evidence, not as a substitute for the implementer's own runs.

2026-08-31 — claimed. `wo-gate.mjs --start WO-1.44` → 🤖 CLAIMED — 2026-08-31.

2026-08-31 — brief written to `.claude/dispatch/WO-1.44-brief.md`, both ORCHESTRATOR markers filled
and deleted (18.2 KB total; ~3.4 KB of it mine). What I added beyond the routing sentence: the probe
result above, the one unanalysed correlation in my log (`data-dayoff-remove="undefined"` alongside a
FAIL line printing `the event is {}`), the deliberate no-try/catch decision at `verify-shell.mjs:43`
that Acceptance line 2 has to work around rather than undo, and the stop point.

2026-08-31 — **implementer spawned at Opus**, handed `.claude/dispatch/WO-1.44-brief.md`, awaiting
return. Expect 20–40 min; a flat status file and an unchanged `git status` are the normal shape of
its first stretch, not evidence it died.

2026-08-31 — **implementer returned.** Its account, as its claim and not as a finding: all five
failures diagnosed as **fixture, not app**; `src/` untouched (confirmed independently — `git status`
shows no app file modified); crash contained via a `runSection()` wrapper that turns a section throw
into a named, counted `fail` result rather than a bare try/catch; `--today` flag added, driven on four
weekdays; reports `1284 · 1284 · 0 · 0` and a green sweep and audit. Also reports that the Why's
**weekday hypothesis is wrong** — it is one date (2026-09-09), not a weekday — and reports a second
site found only because the containment let a run report it.

2026-08-31 — checked the tree for planted-mutation residue before handing off: `grep -rn MUTATION`
over `tools/`, `src/`, `index.html` returns only pre-existing prose and comments. The dispatch
planted two missing selectors deliberately during run 2; neither survives.

2026-08-31 — **handoff written.** `wo-gate.mjs --handoff WO-1.44` → 🔍 AWAITING VERDICT — 2026-08-31.
This session stops here. The verifier is owed and is a fresh session's first pass.

2026-08-31 — **fresh session, verifier's first pass.** Row read 🔍 AWAITING VERDICT on arrival;
`wo-gate.mjs WO-1.44` PASS. Not a new dispatch, not re-routed, not released. Verifier spawned at
Opus, told in as many words that it is a FIRST pass and that every line of
`.claude/dispatch/WO-1.44-result.md` is a claim to check rather than a finding to confirm. Awaiting
verdict; expect 20-40 min.

2026-08-31 — **verdict in: PASS.** All five Acceptance lines ✅, no 🙋, no 👤, no 📆. The verifier
took its own runs rather than reading the result file's figures: three weekdays driven (Mon
2026-08-31 real clock, Thu 2026-09-03, Fri 2026-09-04 — nobody had driven Friday before), each
`1284 · 1284 · 0 · 0` at exit 0; sweep `40 · 37 · 0 · 3` with all three REVIEW lines pre-existing
and in files this dispatch did not touch; `--audit` PASS; `--self-check` 31 of 31. It planted its
OWN missing selector in a different section (`policy-url.mjs`) and reverted it byte-for-byte, so
the containment claim rests on its evidence: exit 1, summary still printed, one named FAIL in place
of that section's 8 checks, every later section still ran. Names one fixture assumption it could not
close — nothing asserts `runSection()` is still wired in, so a future edit restoring the bare loop
would leave every tool green — and proposes a follow-up row for the four remaining
`nodeWeekdayAhead()` collision sites. Not ticked; awaiting the owner.
