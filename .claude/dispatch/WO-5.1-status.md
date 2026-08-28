# WO-5.1 — dispatch status

- 2026-08-28 — gates checked: PASS, WO-3.4 ✅ / WO-4.1 ✅, tree clean, no prior dispatch files.
- 2026-08-28 — route **Claude / Opus** — merge-field resolver is a never-delegated sensitive surface
  (CLAUDE.md standing rules) and ROUTING.md rules all of Phase 5 Claude-only; Traps line is a
  judgment call (whitelist not blacklist). No Codex probe run — Codex was never on the table.
- 2026-08-28 — claimed: `--start WO-5.1` ran, row reads 🤖 CLAIMED — 2026-08-28.
- 2026-08-28 — brief written to `.claude/dispatch/WO-5.1-brief.md` (11.3 KB, both markers filled).
- 2026-08-28 — implementer spawned at **Opus**, brief `.claude/dispatch/WO-5.1-brief.md`, awaiting return. Expect 20–40 min; a flat status file and an unchanged git status are normal for the first 20+.
- 2026-08-28 — **dispatch KILLED at the API session limit**, mid-flight, at the handoff to the
  implementer's return. No result file was ever written and no verifier ever ran. Recovered in a
  later session from the working tree; see `plans/dispatch-retro.md` § "The mutation that was still
  in the file — WO-5.1, 2026-08-28".

## Recovery, 2026-08-28

**What was found.** Every one of the implementer's writes had landed — `src/merge-fields.js` (612
lines), `tools/verify/merge-fields.mjs` (745), sweep § 20, the `sw.js` bump to v99, the `src/shell.js`
seam, and § WO-5.1 in `TESTING.md`, `docs/data-model.md`, `plans/ROADMAP.md` and both trackers with
all six Acceptance boxes ticked and the row at ✅ DONE. None of it had been verified.

**The defect.** `resolveText()` still carried the mutation the implementer had inserted to prove its
own refusal check non-vacuous: a path expression walked against the document whenever the whitelist
missed, labelled *"MUTATION (WO-5.1 proof, not shipped)"* and still shipped. On the delivered tree
every `{{student.supports.*}}` path resolved to the roster string, unblocked and with no error code —
`medical`, `accommodations`, `behaviorPlan`, `caseManager`, `attendanceClause` and `reviewDate`. That
is the whole of what this work order exists to prevent, in the file whose header says there is no
path expression in it.

**The repair.** The six mutation lines were removed; the arm is back to `fail(refusalFor(name), name)`
and the token returned. Nothing else in any file was changed.

**Re-verified from the tree, every command re-run rather than read:**

| Check | Result |
|---|---|
| `node tools/verify-shell.mjs` | **1194 checks · 1194 passed · 0 failed · 0 skipped**, 396s, exit 0 |
| `node tools/wo-sweep.mjs` | **34 checks · 31 passed · 0 failed · 3 to review** — all three pre-existing |
| `node tools/wo-gate.mjs --self-check` | PASS — 24 of 24 plants caught |
| `node tools/wo-gate.mjs --audit` | PASS — every fragment, pointer and dashboard row |
| Module-level probe, both builds | mutated: six sensitive paths resolved, `blocked:false`. Repaired: all six `refused-field`, blocked, tokens intact; `{{constructor}}`/`{{__proto__}}`/`{{toString}}` all `unknown-field` |

**The numbers the implementer's prose cited were real and were taken before the mutation went in.**
The sweep's 225 stripped code lines became 221 after the repair, which is the four code lines
removed; the call-site count 1179 and the executed 1194 were unaffected either way.

**Still owed:** a commit — the recovery was left uncommitted for the owner to review.
