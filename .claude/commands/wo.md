---
description: Route and dispatch a Planbook work order to Claude or Codex
argument-hint: <WO-ID | "next" | "route only WO-ID">
---

Use the Agent tool to spawn the `work-order-orchestrator` subagent for: $ARGUMENTS

If no argument was given, treat it as "next" — the first `⬜ NOT STARTED` row in the Ship 1 table
in [plans/work-orders/README.md](plans/work-orders/README.md).

If the argument starts with "route only", the orchestrator stops after step 3 (the routing decision
and its reasoning) and does not dispatch.

**Run it in the background** (`run_in_background: true`), then tell the user in one line what was
dispatched, roughly how long to expect, and that `.claude/dispatch/<WO-ID>-status.md` is pollable
meanwhile. Stay responsive to them while it works.

A dispatch spends nearly all its time inside nested subagents, which surface nothing until the whole
thing returns. Run in the foreground it blocks silently for half an hour and reads as a hang — which
is exactly how it was read the first time. Backgrounding does not change the report; it changes
whether anyone can tell the difference between working and stuck.

## One work order is two invocations, and they return different reports

Since WO-1.38 the verifier is a **fresh session on every work order**, so `/wo <ID>` is run twice
against the same ID and **what comes back is not the same shape both times**. Relay whichever one
you actually got, and never fill in the other half from the implementer's self-claims — that is the
exact failure the split was built to prevent.

**First invocation — the implementer.** Roughly 20–40 minutes. It ends when the implementer returns
and `--handoff` has written `🔍 AWAITING VERDICT` onto the row. What comes back is the **boundary
report**: the route and why · what landed, as file paths · the implementer's own account of what it
could not close, **labelled as its claim** · and that the verifier is owed. It carries **no verdict,
no Acceptance list and no maintenance protocol**, by design. Relay it as it stands, including that
the verifier is owed and how to start it. **Do not mark an Acceptance list at this stop** — there is
nothing to mark one from, and composing one out of the implementer's claims is the WO-3.5 defect
arriving one level above the orchestrator.

**Second invocation — the verifier.** Usually shorter. Run `/wo <same ID>` from a **new session**;
the orchestrator sees the row reading `🔍 AWAITING VERDICT` and goes straight to the verifier
without re-routing, re-briefing or releasing it. What comes back is the **final report**: the route
and why · what landed, as file paths · the verifier's verdict and its Acceptance list marked
verified / failed / needs-a-human · the needs-a-human items as one iPad checklist · the maintenance
protocol split into what can be applied and what is owed to a human · and what's next. **Relay that
Acceptance list in full — do not summarize it; the marks are the point.**

For `route only`, foreground is fine — it stops after step 3 and returns in under a minute.

*(**Nothing checks this file.** `wo-sweep.mjs` skips `.claude/` by construction and `--audit` never
reads it, so a pipeline change in `.claude/agents/` that leaves this one alone goes unnoticed — which
is how this file spent WO-1.38 asking a caller to relay an Acceptance list that no longer existed at
the first stop. **Change the shape there and change it here in the same sitting**, until WO-1.40 gives this a
fence that can say so on its own.)*
