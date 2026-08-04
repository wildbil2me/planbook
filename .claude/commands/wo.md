---
description: Route and dispatch a Planbook work order to Claude or Codex
argument-hint: <WO-ID | "next" | "route only WO-ID">
---

Use the Agent tool to spawn the `work-order-orchestrator` subagent for: $ARGUMENTS

If no argument was given, treat it as "next" — the first `⬜ NOT STARTED` row in the Ship 1 table
in [plans/work-orders/README.md](plans/work-orders/README.md).

If the argument starts with "route only", the orchestrator stops after step 3 (the routing decision
and its reasoning) and does not dispatch.

Run it in the foreground and relay its report in full — the routing decision, the files that
changed, the Acceptance list with each item marked verified / failed / needs-a-human, and the
maintenance protocol still owed.
