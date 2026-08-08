# WO-2.14 — Close two wo-gate blind spots found at WO-2.4 · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.14-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the **Opus** tier, on this work order's own merits — not a Codex
fallback. The deciding signal is the pair of judgment traps ("do not let the two gaps become one
flag", "nothing here may make the status line harder to hand-edit") sitting on top of a deliverable
that is prose: the claim step has to be written into `ROUTING.md` and into the orchestrator's own
agent definition in suite voice, which is the "produces teacher-facing prose" row of the rubric. The
runner-up consideration set aside: the Acceptance list is unusually mechanical for a Claude row — ten
lines, every one of them runnable — which is the strongest Codex signal present; it loses because a
mechanically checkable list on the one script that writes into `plans/` is still a file where a
plausible-looking implementation makes the tracker lie, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.14 — Close two wo-gate blind spots found at WO-2.4

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** nothing

**Not a go-live blocker.** Added 2026-08-08, out of WO-2.4's close. *(The blank line above is
deliberate: `parseFile()` ends the header block at the first one, and `depsOf()` regex-scans
everything inside it for `WO-` tokens. WO-1.12 carries this note inside the block and is read as
depending on the work order that merely found it. This one depends on nothing on purpose — the gaps
were found at WO-2.4 but the fix touches only `tools/wo-gate.mjs`, and hanging it off a work order
that stays 🔨 IN PROGRESS until the owner's desk sitting would block it for a reason that isn't
real.)*

**Why it exists.** `tools/wo-gate.mjs` is the only script in `tools/` that writes into `plans/`, and
it is the only one nothing checks — `verify-shell.mjs` tests the app and `wo-sweep.mjs` reads a
diff, so the tool that edits the tracker runs unverified. WO-2.4 walked into two of its gaps in one
dispatch. Neither is an app defect; both let the tracker say something untrue, which is the failure
`plans/verification-tooling.md` keeps naming as worse than no check at all.

**The two gaps**

- **Nothing ever claims a work order, so the collision guard can never fire.** There is no
  `--start`. WO-2.4 sat at `⬜ NOT STARTED` through two Codex rounds, a correction brief and two
  verifier passes, because the only thing that writes a status is `--tick`, and `--tick` is the last
  step. Meanwhile `gate()` carries the guard built for exactly this — `wo-gate.mjs:169`, *"already
  🔨 IN PROGRESS — ask before proceeding"* — which no dispatch can arm. A second `/wo` with no
  argument would have had `next` hand it WO-2.4 and started building it in the same working tree,
  with nothing anywhere saying a run was already in flight.
- **`--tick` can only ever write `✅ DONE`.** `wo-gate.mjs:324-327` hardcodes the status; the fence
  at `:309` accepts `⬜ NOT STARTED` or `🔨 IN PROGRESS` and then flattens both to done. So the
  project's own convention — land at `🔨 IN PROGRESS` while 👤 or 🙋 lines are still owed, as at
  WO-2.1, WO-2.11 and WO-2.12 — is unreachable through the tool, and has been hand-edited every
  time. At WO-2.4 the offered maintenance was `--tick WO-2.4`, which would have stamped `✅ DONE` on
  a 🚩 go-live blocker with two acceptance lines still owed to the owner. It was caught by reading
  the source, not by the tool refusing.

The second gap is the one with teeth. `parseFile()` (`:43-78`) reads only the header block, so the
script has never looked at an Acceptance list — it will write "done" over a work order whose own
checkboxes say otherwise and report `PASS`.

**Deliverables**
- **`--start <ID>`**, refusing anything that is not `⬜ NOT STARTED`, writing `🔨 IN PROGRESS`, and
  honouring `--dry-run` the way `--tick` does. The orchestrator calls it after the routing decision
  and before the brief is written, which is what arms `:169`.
- **A way back.** An abandoned dispatch must not leave a permanent claim — see Traps.
- **`--tick` reads the work order's own Acceptance list.** If any line is still `[ ]`, write
  `🔨 IN PROGRESS` instead of `✅ DONE`, name the lines that held it open, and **leave the roadmap
  boxes unticked** — an unfinished work order closes nothing. `parseFile()` learns to find the
  Acceptance block; nothing else needs new knowledge, because the orchestrator already ticks by hand
  what it verified before it runs the tool.
- **`next` says what it skipped.** Claimed rows drop out of "next" the moment `--start` exists, and
  a running order that silently steps over a work order is how one gets forgotten.
- The claim step written into `ROUTING.md` and the orchestrator's own definition, so it is protocol
  rather than a flag nobody calls.

**Out of scope** — no new script and no `tools/lib/`; this closes blind spots in a file that already
exists and stays one file, per [`../verification-tooling.md`](../verification-tooling.md). No change
to what `--tick` touches: still one named work order, still never a 👤 line in `TESTING.md`, still
never `CHANGELOG.md`. Not a status for *why* a run stopped — `🚧 BLOCKED` already exists and is set
by a human.

**Acceptance**
- [ ] `--start` on a `⬜ NOT STARTED` work order writes `🔨 IN PROGRESS`, and a **second** `--start`
      on the same ID exits non-zero. Prove it by running it twice, not by reading the fence.
- [ ] `--start` refuses `✅ DONE`, `🚧 BLOCKED` and `🔒 GATED` without editing the file.
- [ ] A claimed work order does **not** move either dashboard. They count finished work, and
      `recomputeDashboard()` (`:241`) must keep counting only `✅ DONE`.
- [ ] The way back returns a claimed work order to `⬜ NOT STARTED`, and says so in one line.
- [ ] **`--tick` on a work order with one unticked Acceptance line writes `🔨 IN PROGRESS`, not
      `✅ DONE`, and names that line.** Plant the violation: untick one line of a work order that
      would otherwise pass, run it, watch it refuse. This is the WO-2.4 case, reproduced.
- [ ] That same refusal leaves every roadmap box it *Closes* unticked.
- [ ] `--tick` on a fully ticked work order still writes `✅ DONE — <date>`, ticks its roadmap boxes
      and recomputes the dashboard. No regression on the path that works today.
- [ ] `--dry-run` on `--start` and on the new `--tick` path prints the exact edit and writes
      **nothing** — compare the file before and after, don't trust the banner.
- [ ] `next` names any `🔨 IN PROGRESS` row it stepped over, and why.
- [ ] `verify-shell.mjs` and `wo-sweep.mjs` still run clean afterward — 400/400/0-skips and exit 0 —
      neither of which covers this file, which is the point of the planting above.

**Traps** — **Per `verification-tooling.md`'s precondition rule, a check that could not have caught
the gap it is named for is not evidence.** WO-1.12 proved each fix by planting the violation first
and watching the script fail; do the same here. A `--tick` that refuses a work order nobody unticked
has demonstrated nothing.

**The claim outlives the run, and that is the new failure this work order introduces.** A dispatch
that dies mid-flight leaves `🔨 IN PROGRESS` behind, `next` steps over it forever, and the work order
is lost from the running order while looking healthy — the tracker lying in the other direction. The
way back and the loud skip are why this is two deliverables and not one. `gate()` already has the
shape of the answer at `:179-181`, where a brief with no result over a dirty tree is reported as an
interrupted draft; a stale claim should be as loud.

**Do not let the two gaps become one flag.** `--start` writes a status because a run began;
`--tick`'s refusal writes the same status because the work is not finished. They arrive at
`🔨 IN PROGRESS` for unrelated reasons, and collapsing them into shared code is how a future
`--start` starts ticking checkboxes.

**Nothing here may make the status line harder to hand-edit.** Every `🔨 IN PROGRESS` in `plans/`
today was written by hand, including WO-2.4's, and will be again the first time this script is wrong
about something. The file stays the record; the tool stays a convenience over it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/verification-tooling.md`
  - `tools/wo-gate.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, because this work order writes into all of them:

- **`plans/work-orders/ROUTING.md`** and **`.claude/agents/work-order-orchestrator.md`** — the fifth
  deliverable lands in these two. The claim step belongs in the orchestrator's numbered sequence at
  the point the work order names (after the routing decision, before the brief is written) and in
  `ROUTING.md` as protocol. Match the surrounding voice; both files are dense, plain, and written
  as instructions with the scar named. Neither file should grow much — the orchestrator definition
  carries its own standing rule about staying short.
- **`plans/ROADMAP.md`** and every file in **`plans/work-orders/phase-*.md`** — `--tick` writes into
  the first and reads statuses from the rest. Your new Acceptance-block parser has to work against
  the phase files as they actually are, not against one specimen: check the heading spelling, the
  `- [ ]` indentation, and the wrapped continuation lines (the Acceptance items in this very work
  order wrap onto indented second lines) across more than one phase file before you trust it.
- **`tools/wo-brief.mjs`** — sibling script in the same directory. Argument parsing, output
  formatting, and exit-code conventions in `tools/` are already established; match them rather than
  inventing a second style inside the same folder.

**Three cautions specific to this dispatch, from the orchestrator:**

1. **You will be planting violations in real tracker files.** That is required — Acceptance line 5
   says so explicitly. Restore every planted edit, and end with a working tree that contains only
   changes you intend to ship. `git status --short` and `git diff` are part of your evidence, not an
   afterthought; include both in your report and state, file by file, what you left changed and why.
   The tree was clean when this dispatch started.
2. **`parseFile()` ends the header block at the first blank line, and `depsOf()` regex-scans that
   block for `WO-` tokens.** This work order's own header carries a note about it. If you touch
   phase-file text, or extend the parser, do not accidentally pull prose containing a `WO-` token
   into the header block — that is how WO-1.12 came to "depend on" a work order that merely found it.
3. **WO-2.14's own status line.** You may tick the boxes your own run actually closed. Whatever you
   leave `plans/work-orders/phase-2-attendance.md` saying about WO-2.14 itself, say the same thing in
   your result file. A verifier arriving cold should not have to work out whether a `🔨 IN PROGRESS`
   is your demonstration, your claim, or a leftover from a test you forgot to unwind.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 10 lines, reported against one by one

1. `--start` on a `⬜ NOT STARTED` work order writes `🔨 IN PROGRESS`, and a **second** `--start` on the same ID exits non-zero. Prove it by running it twice, not by reading the fence.
2. `--start` refuses `✅ DONE`, `🚧 BLOCKED` and `🔒 GATED` without editing the file.
3. A claimed work order does **not** move either dashboard. They count finished work, and `recomputeDashboard()` (`:241`) must keep counting only `✅ DONE`.
4. The way back returns a claimed work order to `⬜ NOT STARTED`, and says so in one line.
5. **`--tick` on a work order with one unticked Acceptance line writes `🔨 IN PROGRESS`, not `✅ DONE`, and names that line.** Plant the violation: untick one line of a work order that would otherwise pass, run it, watch it refuse. This is the WO-2.4 case, reproduced.
6. That same refusal leaves every roadmap box it *Closes* unticked.
7. `--tick` on a fully ticked work order still writes `✅ DONE — <date>`, ticks its roadmap boxes and recomputes the dashboard. No regression on the path that works today.
8. `--dry-run` on `--start` and on the new `--tick` path prints the exact edit and writes **nothing** — compare the file before and after, don't trust the banner.
9. `next` names any `🔨 IN PROGRESS` row it stepped over, and why.
10. `verify-shell.mjs` and `wo-sweep.mjs` still run clean afterward — 400/400/0-skips and exit 0 — neither of which covers this file, which is the point of the planting above.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

