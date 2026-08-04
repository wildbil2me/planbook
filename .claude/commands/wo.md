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
dispatched, that a full run takes roughly 20–40 minutes, and that
`.claude/dispatch/<WO-ID>-status.md` is pollable meanwhile. Stay responsive to them while it works.

A dispatch spends nearly all its time inside nested subagents, which surface nothing until the whole
thing returns. Run in the foreground it blocks silently for half an hour and reads as a hang — which
is exactly how it was read the first time. Backgrounding does not change the report; it changes
whether anyone can tell the difference between working and stuck.

When the completion notification arrives, relay the report in full — the routing decision, the files
that changed, the Acceptance list with each item marked verified / failed / needs-a-human, and the
maintenance protocol still owed. Do not summarize the Acceptance list; the marks are the point.

For `route only`, foreground is fine — it stops after step 3 and returns in under a minute.
