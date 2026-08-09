# WO-2.16 — the self-check states its precondition, and `**Blocks**` stops being a dependency · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.16-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at Opus tier on its own merits**, not as a Codex fallback:
four of the five Deliverables are written as *decisions* whose rationale is owed to a comment at the
point of decision (is `**Blocks**` a real field · longer clip vs. last line vs. a flag · fix the
class or fix three fields · what the field table should say about fields it has no row for), the
Traps section is entirely judgment rather than mechanics, and the work order owes suite-voice prose
to `plans/work-orders/README.md`'s field table. The runner-up consideration set aside is real: this
is a pure tooling script with no UI, no student data, and mostly mechanically checkable acceptance
lines — a Codex shape on the surface. It was set aside because the value here is in *choosing* the
conventions rather than implementing a settled spec, and because `wo-gate.mjs` is the dispatch
pipeline's own gate, where a plausible-looking wrong change mis-gates future work orders silently —
which is precisely the latent WO-1.5/WO-1.6 defect this work order exists to fix.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.16 — the self-check states its precondition, and `**Blocks**` stops being a dependency

**Ship** 2 · **Status** 🔨 IN PROGRESS · **Size** S · **Depends on** WO-2.15

**Not a go-live blocker, and the same kind of work as WO-2.15.** Added 2026-08-09, out of WO-2.15's
verification. Harness, not app: nothing here writes student data or reaches a classroom. **Do not
pull it into Ship 1**, which closed on 2026-08-08.

Two findings from WO-2.15's own verification, neither of which failed one of its acceptance lines,
and both of which are in the code it shipped. They are one work order because they are both the same
shape — the tool doing something defensible and describing it wrongly.

**Why it exists — one.** `--self-check` copies the live `plans/` (`wo-gate.mjs:1003`), so it inherits
whatever drift the trackers are carrying, and drift makes plants fail. Proved 2026-08-09 in a scratch
copy of `plans/` and `tools/` outside the repository: set one `## Phase N` dashboard row to `11/12` —
the exact drift this tree carried on the morning of 2026-08-08, before WO-2.15 corrected it — and the
run prints `9 plants, 7 caught, 2 missed` and exits 1. The two it names are *"`--dry-run` on
`--start`, `--release` and `--tick` writes nothing at all"* and *"a fully ticked work order still gets
✅ DONE, its roadmap box, and the dashboard"*. **Neither of those is what went wrong.** Both plants
behaved perfectly; the copied `ROADMAP.md` earned a `HELD`, which is `--tick` doing exactly what
WO-2.15 built it to do, and the 160-character clip at `wo-gate.mjs:1182` cuts the message off before
the reason arrives. So the self-check has a precondition it has never stated — the trackers must
already be clean — and announces the violation as two unrelated plant failures.

**And on 2026-08-09 it stopped being theoretical — `--self-check` is red on the tree as of the Ship 2
table.** The `next` plant claims the fixture row and expects `next` to step over it and offer *"the
one ⬜ NOT STARTED row in the table"*. That expectation is written into the plant, and the comment at
`wo-gate.mjs:1025-1026` says why: *"Every real row in that table is ✅ DONE, so a run against the copy
without this would exercise nothing."* True on 2026-08-08, when Ship 1 had just closed and the
running order was empty. False on 2026-08-09, when a Ship 2 table put twelve ⬜ NOT STARTED rows
ahead of the fixture — so `next` now answers WO-2.16 and never reaches it, and the plant reports
three failures, none of which is a defect in `next`.

**Nothing is wrong with the tool's writes.** `--audit` passes, `--tick`, `--start` and `--release`
are untouched, and the repository is not in a bad state. What is broken is the self-check's fixture,
by a *documentation* edit — which is the sharpest possible statement of the problem: a check on the
tool is failing because of something that is not the tool. Until this work order lands, a red
`--self-check` cannot be read at face value, and *"a control that goes red for a reason the reader
learns to dismiss is worse than no control"* is this project's own rule, written down at WO-1.12.

The fix is the same one the precondition deliverable asks for, one level along: **the fixture must
not depend on what the live running order happens to contain.** Give the fixture its own table, or
its own copy with the real rows neutralised, or assert against its own row rather than against *the
one* NOT STARTED row. Whichever is chosen, the comment at `:1025` gets rewritten, because the
sentence that made the old assumption reasonable is the sentence that made it invisible.

It fails loud, which is the safe direction to be wrong in, and that is why this is `S` and not `M`.
The cost is a reader's morning: the first thing a red self-check makes you do is go and read the two
plants it named, which are fine. Note the boundary, because it is not obvious — drift in
`work-orders/README.md`'s dashboard does **not** trip it (also checked), since `--tick` recomputes
that table itself. Only what can earn a `HELD` does: `ROADMAP.md` dashboard drift, and a
`Closes roadmap` fragment that matches no box.

**Why it exists — two.** `**Blocks**` is a header field nothing has ever heard of, and it is being
read as a dependency:

- `phase-1-shell-store-roster.md:15` — WO-1.1 carries `**Depends on** nothing · **Blocks** everything`
  on its status line, and `node tools/wo-gate.mjs WO-1.1` reports
  `depends (prose) nothing · **Blocks** everything`. Harmless, and visibly odd.
- `phase-1-shell-store-roster.md:195` — WO-1.5 carries `**Blocks** WO-1.6 and every work order after
  it` on its own line under the header, and `node tools/wo-gate.mjs WO-1.5` reports
  `depends WO-1.6 ✅ DONE`. **That is the relationship backwards.** WO-1.5 is the backup-and-restore
  work order that WO-1.6 waits on — the one hard ordering constraint in the whole sprint — and the
  gate reads it as WO-1.5 waiting on WO-1.6. Both are done, so nothing is gated wrongly today, and
  that is luck rather than design: the same line between two open work orders is a cycle, and the
  gate would report the ordering satisfied while pointing the wrong way down it.

WO-2.15's deliverable three asked for exactly this — *"the fields the tool does not know exist"* —
and found **Amends roadmap** while walking past this one. The new field table at
[`README.md:44-48`](README.md) documents five fields and not this one.

**And a second unknown field, found 2026-08-09 while rewriting WO-G2's dependency line:**
`**Target**`, which all four gate work orders carry on the line under their header
(`gates.md:14`, `:183`, `:205`). It lands in the same place — `node tools/wo-gate.mjs WO-G2` ends its
dependency report with `(prose) … **Target** ~2026-09-15, before the first grades are entered for
real`. Harmless today, because a date carries no `WO-` token to be misread as a dependency. It is
here because it is the third instance of one defect: **any line in the header block that is not
`Depends on` is absorbed into `Depends on`.** Fix the class, not the three fields — and if the fix
is per-field, say in a comment why the general one was rejected.

*(That same rewrite found the other half of this: `WO-2.5 … WO-2.7` was read as two tokens rather
than a range, so WO-2.6 sat in the middle of WO-G2's dependency line gating nothing. That one is
fixed in place rather than in code — an ellipsis range is a thing a human writes and a parser should
not be taught to guess at. If this work order adds anything there, it is a **warning** when a
dependency line contains `…` between two `WO-` tokens, never an expansion.)*

**Deliverables**
- **`--self-check` says what it requires and checks it first.** Run the drift readers `--audit`
  already has over the copy before any plant is made, and if the copy is not clean, stop with that as
  the reason — the trackers' drift, named, and the command that shows it — rather than running nine
  plants and reporting two of them red. A plant failure should mean a plant failed.
- **Un-couple the `next` plant from the live running order — this one is red right now**, and it is
  the first thing to fix, because until it is green nothing else in this work order can be verified
  by a passing run. The plant asserts against *"the one ⬜ NOT STARTED row in the table"*; give it its
  own row to assert against, or its own table, or neutralise the real rows in the copy. Rewrite the
  comment at `wo-gate.mjs:1025-1026` with it — the sentence that made the assumption reasonable in
  August is the sentence that will hide the next one.
- **The clip stops hiding the reason.** Whatever the plant failure prints, `HELD` and its cause must
  survive into the output. Decide whether that is a longer clip, the last line rather than the first,
  or the whole captured run behind a flag; the reasoning goes in a comment at the point of decision.
- **Decide whether `**Blocks**` is a real field**, and make the tool act on the decision. The
  recommendation is that it is real and is treated as **Amends roadmap** is — parsed, reported,
  never acted on — because it is genuine information a human wants at the top of a work order and it
  reads naturally beside `Depends on`. Whatever is chosen, **no `WO-` token on a `**Blocks**` line
  may reach `depsOf()`**, and the field table in `work-orders/README.md` gains a row either way.
- **A third thing, which is the actual lesson:** an unknown header field currently fails by being
  silently absorbed into the nearest known one. Say in the field table what happens to a field that
  is not in it, so the next person who invents `**Supersedes**` finds out from the document rather
  than from a gate report that reads plausibly and is wrong.

**Out of scope** — no new script and no `tools/lib/`, per
[`../verification-tooling.md`](../verification-tooling.md). No new plants beyond what the precondition
check needs; `--self-check` is not growing into a test framework, and if it starts wanting to, stop
and say so. **No change to what `--tick`, `--start` or `--release` write**, or to which files they may
touch — this work order changes what the tool *says*, and its reading of one field, and nothing about
its writes. Do not correct the two `**Blocks**` lines' prose; they are the fixtures.

**Acceptance**
- [ ] With `ROADMAP.md`'s dashboard drifted in a temp copy, `--self-check` stops before planting and
      names the drift as the reason. **Prove it on a planted row in a copy outside the repository** —
      the tree's own rows are clean as of 2026-08-08 and cannot be the fixture, and planting drift in
      the live `plans/` to test a drift check is how a bad morning starts.
- [ ] The same, for the other thing that earns a `HELD`: a `Closes roadmap` fragment matching zero
      boxes in the copy.
- [ ] On a clean tree, `--self-check` still passes with all nine plants caught and still says how
      many it made — the precondition check must not cost a plant.
- [ ] **The `next` plant passes with a populated running order**, which is the state the tree has
      been in since 2026-08-09 and the state it will be in for every phase from here. Prove it both
      ways: with ⬜ NOT STARTED rows ahead of the fixture, and with none — the second is the
      condition that has been silently holding the plant up since it was written.
- [ ] A plant that genuinely fails still reports as a plant failure, with the `HELD` reason visible
      rather than clipped away. Prove it by mutating the subject script, not by drifting the
      trackers — those are the two cases this work order exists to tell apart, so the evidence has to
      tell them apart too.
- [ ] `node tools/wo-gate.mjs WO-1.5` no longer reports `WO-1.6` as a dependency, and WO-1.5's
      `**Blocks**` line is unchanged on disk.
- [ ] `node tools/wo-gate.mjs WO-1.1` no longer scrapes `**Blocks** everything` into its dependency
      field.
- [ ] `--list` and `next` are unchanged on every other work order — diff the full output of both
      against the same commands run before the change, and show that the only differences are the two
      lines above.
- [ ] `**Blocks**` has a row in `work-orders/README.md`'s field table, and the table says what becomes
      of a field that has no row.
- [ ] `--self-check` writes nothing inside the repository and leaves no temp directory on either exit
      path, including the new early one. **The early exit is a new exit path** — WO-2.15's acceptance
      line 4 was written before it existed.
- [ ] `verify-shell.mjs` and `wo-sweep.mjs` still run clean afterward — all checks passing, zero
      skips, exit 0, and the count matching whatever `tools/README.md` says at the time.

**Traps** — **The precondition check must not become a tenth plant.** It runs over the copy before
any plant exists, it tests the trackers rather than the script, and folding it into the plant loop is
how a future reader concludes the trackers are what `--self-check` checks. They are its fixture.

**Do not fix the drift you find.** If the precondition check goes red on the real trees while this is
being built, that is `--audit`'s job and a separate edit with a human behind it. A self-check that
repairs `plans/` to make itself pass is the worst possible version of this tool.

**`**Blocks**` is prose written by a hand, not a schema.** WO-1.5's line ends with
`— **unblocked as of 2026-08-04**`, and WO-1.1's says `everything`. Neither is a list of work order
IDs, and code that assumes it is will be wrong the third time someone writes one. Parse it as
reportable text that happens to contain `WO-` tokens, exactly as `Depends on` already does for its
prose tail — and make sure the tokens go nowhere near the gate.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/wo-gate.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these — this work order edits documentation as well as code, and two of its acceptance
lines cannot be met without them:

- **`plans/work-orders/README.md` § "Header fields, and the two ways they rot"** (≈ lines 35–49) —
  the field table acceptance line 9 asks you to add a `**Blocks**` row to. Note that the paragraph
  above the table *already* states the defect in general terms: *"A field the script has never heard
  of does not go missing — it gets swallowed by whichever field is written before it, so a new one is
  a change to `KNOWN_FIELDS` in `wo-gate.mjs` and not just a line of prose."* That sentence is your
  strongest hint about the intended shape of the fix, and the second half of acceptance line 9 —
  *"the table says what becomes of a field that has no row"* — is asking for that consequence to be
  stated **in the table**, where someone inventing a field will actually be looking. Match the
  table's existing voice; the rows are terse and each carries its scar.
- **`plans/verification-tooling.md`** — the authority behind this work order's **Out of scope** line.
  No new script, no `tools/lib/`. Read it before you reach for a new file.
- **The three fixtures you must not edit the prose of**, so you can see the shapes the parser has to
  survive: `plans/work-orders/phase-1-shell-store-roster.md:15` (WO-1.1, `**Blocks** everything` on
  the status line itself) and `:195` (WO-1.5, `**Blocks** …` on its own line under the header, ending
  `— **unblocked as of 2026-08-04**`), plus `plans/work-orders/gates.md:14`, `:183`, `:205` (the
  `**Target**` field on all four gate work orders). Two different placements, three different fields,
  one defect.
- **WO-2.14 and WO-2.15 in `plans/work-orders/phase-2-attendance.md`** — the work orders that built
  `--start`/`--release`/`--tick` and `--self-check`. WO-2.15's acceptance line 4 is named in your own
  acceptance line 10 as having been written before the early exit existed.

**Three pieces of state established before you were dispatched — read these, they change what you
will see:**

1. **WO-2.16 is already claimed.** The orchestrator ran `node tools/wo-gate.mjs --start WO-2.16`, so
   its status line reads `🔨 IN PROGRESS`. Do not re-claim it, and do not be surprised that the Ship 2
   running order has a claimed row in it — that is part of the live-table state the `next` plant is
   currently tangled with.
2. **`--self-check` is red on this tree right now, as the work order says.** Verified immediately
   before dispatch: `9 plants, 8 caught, 1 missed`, exit 1. The one miss is the `next` plant, and it
   prints four sub-failures: *stepped over a 🔨 IN PROGRESS row without naming it* · *named the skip
   without the way back* · *did not offer the one ⬜ NOT STARTED row in the table* · *reported a skip
   with nothing claimed*. Note this is a different count from the *"three failures"* the work order
   narrative records — the narrative was written on 2026-08-09 before WO-2.16 was claimed, and the
   claim changed which sub-assertions trip. **That difference is itself the bug**: the plant's
   assertions are a function of live tracker state. Do not treat the work order's "three" as the
   number to reproduce.
3. **Baselines for acceptance line 8 are already captured**, taken *after* the `--start` claim and
   *before* any code change, so a diff against them isolates code differences from status
   differences. Use these rather than trying to reconstruct the old output:
   - `C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\076ca084-f3d4-42c7-851c-8f814736f184\scratchpad\baseline-list.txt` (64 lines, `--list`, exit 0)
   - `C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\076ca084-f3d4-42c7-851c-8f814736f184\scratchpad\baseline-next.txt` (17 lines, `next`, exit 0)

   Show the actual diff in your report, not a claim that you ran one. Acceptance line 8 says the
   *only* differences may be the WO-1.5 and WO-1.1 dependency lines — if anything else moves, that is
   a finding to report, not to smooth over.

**Two notes on the generated sections above.** § 2's pointer to `tools/README.md` § "Driving a
browser over CDP" is boilerplate every brief carries; there is no browser work in this work order, so
do not go looking for it. And § 3's constraints block opens by explaining that Codex does not read
`CLAUDE.md` — that is the verbatim shared constraints list from `ROUTING.md`, emitted on both routes.
You are Claude; read `CLAUDE.md`. The constraints themselves still bind, though most of them (colors,
touch targets, `localStorage`, merge fields) have no surface to touch in a harness-only work order.
The two that do bind hard are **no new dependencies or test framework** and **stay inside Out of
scope**.

**And the one thing most likely to go wrong here, stated plainly.** Your subject under test is the
same file you are editing, and your fixture is a copy of the live trackers. Acceptance lines 1, 2 and
5 all require *proving a failure*, and the work order is explicit about where each proof may come
from: lines 1 and 2 plant drift **in a copy outside the repository**, line 5 proves a genuine plant
failure **by mutating the subject script, not by drifting the trackers**. Those are not
interchangeable methods — telling those two cases apart is the entire purpose of this work order, so
evidence that conflates them does not establish the acceptance line even if the output looks right.
Never let a plant or drift path take a real repository path, not even under `--dry-run`. If you
mutate `tools/wo-gate.mjs` to prove line 5, restore it and show the tree is clean afterward.

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

## 5. Done means these 11 lines, reported against one by one

1. With `ROADMAP.md`'s dashboard drifted in a temp copy, `--self-check` stops before planting and names the drift as the reason. **Prove it on a planted row in a copy outside the repository** — the tree's own rows are clean as of 2026-08-08 and cannot be the fixture, and planting drift in the live `plans/` to test a drift check is how a bad morning starts.
2. The same, for the other thing that earns a `HELD`: a `Closes roadmap` fragment matching zero boxes in the copy.
3. On a clean tree, `--self-check` still passes with all nine plants caught and still says how many it made — the precondition check must not cost a plant.
4. **The `next` plant passes with a populated running order**, which is the state the tree has been in since 2026-08-09 and the state it will be in for every phase from here. Prove it both ways: with ⬜ NOT STARTED rows ahead of the fixture, and with none — the second is the condition that has been silently holding the plant up since it was written.
5. A plant that genuinely fails still reports as a plant failure, with the `HELD` reason visible rather than clipped away. Prove it by mutating the subject script, not by drifting the trackers — those are the two cases this work order exists to tell apart, so the evidence has to tell them apart too.
6. `node tools/wo-gate.mjs WO-1.5` no longer reports `WO-1.6` as a dependency, and WO-1.5's `**Blocks**` line is unchanged on disk.
7. `node tools/wo-gate.mjs WO-1.1` no longer scrapes `**Blocks** everything` into its dependency field.
8. `--list` and `next` are unchanged on every other work order — diff the full output of both against the same commands run before the change, and show that the only differences are the two lines above.
9. `**Blocks**` has a row in `work-orders/README.md`'s field table, and the table says what becomes of a field that has no row.
10. `--self-check` writes nothing inside the repository and leaves no temp directory on either exit path, including the new early one. **The early exit is a new exit path** — WO-2.15's acceptance line 4 was written before it existed.
11. `verify-shell.mjs` and `wo-sweep.mjs` still run clean afterward — all checks passing, zero skips, exit 0, and the count matching whatever `tools/README.md` says at the time.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

