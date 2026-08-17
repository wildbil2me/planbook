# WO-2.37 — dispatch status

Poll this file from outside; it is appended at every step boundary. Deleted once
`.claude/dispatch/WO-2.37-result.md` exists — the result supersedes it.

- 2026-08-16 — gates checked: `node tools/wo-gate.mjs WO-2.37` → PASS. Status ⬜ NOT STARTED, size S,
  no work-order dependencies (the "Depends on" clause is prose: `codex-invoke.mjs` and `ROUTING.md`
  both exist today). Tree clean at e509842. No dispatch files yet.
- 2026-08-16 — work order read in full, plus `tools/codex-invoke.mjs` and `ROUTING.md`.
- 2026-08-16 — route chosen: **Claude, Opus tier.** The deliverable is a change to `ROUTING.md`'s own
  rubric plus a reasoned decision on `INVOKE_TIMEOUT_MS` — convention-establishing process prose,
  two Claude-column triggers outright, with judgment traps ("do not raise the cap to a number that
  makes the symptom go away"). Runner-up set aside: size S, no `src/`, sweep-checkable acceptance
  reads Codex-shaped — but the rubric is not handed to the runner it governs. No Codex probe run;
  the route never reached the Codex column.
- 2026-08-16 — claimed: `--start WO-2.37` → `🤖 CLAIMED — 2026-08-16`. Roadmap and checkboxes untouched.
- 2026-08-16 — brief written to `.claude/dispatch/WO-2.37-brief.md`, both ORCHESTRATOR markers filled
  and deleted (0 remaining). Added: the reading list (ROUTING.md whole, orchestrator agent step 2/2b
  with its self-stated line-count rule, dispatch-retro § Codex, sibling rows WO-2.34/2.35/2.36 as
  worked examples), three holds (refusal must be demonstrable without a live Codex run; the 0/1/2
  exit-code scheme must stay true; "the cap stays" is a blessed outcome), and a note that
  `verify-shell.mjs` is not required here while `wo-sweep.mjs` is.
- 2026-08-16 — implementer spawned at Opus, awaiting return. Expect 20-40 min. A flat status file, an
  absent result file and an unchanged `git status` during that window are what a reading implementer
  looks like, not evidence of a death — the claim stays and no second implementer is spawned.
- 2026-08-16 — implementer returned (~10.5 min, 152.7k tokens, 51 tool uses). Result file exists at
  `.claude/dispatch/WO-2.37-result.md`. Reports all five Acceptance lines met: a sixth Codex-column
  bullet plus a fourth "Which Claude" row in ROUTING.md; INVOKE_TIMEOUT_MS deliberately left at 20 min
  with reasoning; SIGTERM-leaves-the-tree comment at the constant; a `--budget <minutes>` pre-flight
  refusal built and demonstrated at exit 2; wo-sweep green, `git diff --stat -- src/` empty (confirmed
  independently). Files changed: tools/codex-invoke.mjs, plans/work-orders/ROUTING.md,
  .claude/agents/work-order-orchestrator.md, tools/README.md, plans/work-orders/phase-2-attendance.md.
- 2026-08-16 — verifier dispatched at Opus, awaiting verdict. The implementer's self-report above is
  not the outcome; the verifier's verdict is.
- 2026-08-16 — verifier verdict: **FAIL**, one ❌. All five Acceptance lines verified true on their own
  text (verifier re-derived the three routes cold, ran the refusal gate on both sides including the
  10/10.1 boundary, wo-sweep 20·18·0·2 exit 0, verify-shell 802·802·0·0 exit 0). The failure is a
  boundary regression: the new exit-2 paragraph in `codex-invoke.mjs`'s header asserts "the working
  tree is untouched", but a SIGTERMed dispatch sets `result.error = ETIMEDOUT` and also exits 2 — so
  the header tells the orchestrator not to look for exactly the half-applied mutation this work order
  exists to make visible. Plus one flagged non-❌: the ROUTING.md worked example says WO-2.35 fails the
  budget bullet, but 2 × 4.5 + 10 reserve fits.
- 2026-08-16 — correction dispatched to an implementer at Opus with the ❌ quoted verbatim, awaiting
  return. (SendMessage is unavailable this session, so the correction goes to a fresh implementer
  instance against the same brief plus the verifier's findings, rather than the original's context.)
- 2026-08-16 — correction returned (~12 min, 107k tokens, 55 tool uses). Fix: exit 2 split, with a new
  **exit 3** for "started, then killed" so the header invariant is made true rather than vaguer; the
  discriminator is `signal`, measured (also catches the maxBuffer kill); the same split applied in the
  probe (falls through to exit 1); the `INVOKE_TIMEOUT_MS` comment strengthened, not weakened. It found
  the mislabel had already bitten once — `.claude/dispatch/WO-3.15-status.md:20-25`, 2026-08-14, 206
  insertions across 7 files left in the tree under an "exit 2 / could not be run" report. Flagged item
  settled: WO-2.35 rewritten as the instructive open-ended-run-count case. Timeout constants restored
  and claimed absent from `git diff`.
- 2026-08-16 — verifier re-dispatched at Opus on the corrected tree, awaiting verdict.
- 2026-08-16 — verifier verdict on the corrected tree: **PASS**. All five Acceptance lines ✅, no 👤
  lines exist in this work order. Verifier drove the kill path itself on a scratchpad copy (exit 3
  with the mutation still in the tree), enumerated all twelve `fail(2, ...)` sites, confirmed both
  timeout constants clean in `git diff`, and confirmed `wc -l` = 330 matching the orchestrator file's
  self-stated count. Judged the fourth exit code the right call rather than an over-correction.
- 2026-08-16 — awaiting the user's go before any `--tick`. Next: WO-2.38, gates clear.
