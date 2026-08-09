# WO-2.15 — wo-gate tells the truth about its own writes · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.15-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at Opus tier, on this work order's own merits — not a Codex fallback,
so do not read the tier as a downgrade or an upgrade. The deciding signal is that three of the five
deliverables are the word *decide*: whether a zero-match `Closes roadmap` fragment becomes a `HELD`
or stays a `NOTE`, whether WO-2.13's undocumented **Amends roadmap** field is real, and how the
roadmap dashboard drift is surfaced — each ending in "the reasoning goes in a comment at the point
of decision," which is a spec that does not exist yet rather than one waiting to be typed in. The
runner-up I set aside is genuine and you should feel its pull: the acceptance list is unusually
mechanical (hash `plans/` before and after, check for leftover temp dirs, read exit codes), which is
normally the Codex column's strongest signal. What outweighed it is the Traps section — a
`--self-check` fails by planting something the current script happens to catch for an unrelated
reason and then passing green forever, and no amount of mechanical checking notices that.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.15 — wo-gate tells the truth about its own writes

**Ship** — · **Status** 🔨 IN PROGRESS · **Size** M · **Depends on** WO-2.14

**Not a go-live blocker, and deliberately after it.** Added 2026-08-08, out of WO-2.14's close. This
is the harness, not the app: a bug here makes the tracker lie, which is expensive and slow to
notice, but it never reaches a classroom. The sprint's governing rule is about code that writes
student data, and nothing in this work order does. **Do not pull it forward into Ship 1.**

**Why it exists.** WO-2.14 closed two gaps in `tools/wo-gate.mjs` and proved all ten of its
acceptance lines by planting violations and running them. Every one of those plants was unwound the
same hour, and the evidence for them now lives in a dispatch transcript. **In November there is
nothing.** `verify-shell.mjs` drives a browser and `wo-sweep.mjs` greps `src/`; neither can express
*"the tracker was told the truth"*, so the only script in `tools/` that writes into `plans/` is still
the only one nothing checks — which is exactly the sentence WO-2.14 was written to stop being true,
and it closed the gaps without closing that.

**And then a third gap turned up while ticking WO-2.14.** WO-2.5's **Closes roadmap** fragment quotes
*"Keyboard path on desktop and 44px touch targets. Both, not either."*; the roadmap box at
`ROADMAP.md:280` actually reads *"Keyboard path on desktop (row select, `P`/`T`/`A`/`E`, arrows) and
44px touch targets under…"*. The parenthetical is in the box and not in the quotation, so
`roadmapEdits()` (`:453-471`) matches zero boxes. That is *reported* — `misses` prints
`NOTE | roadmap: "…" matched 0 roadmap boxes — not ticking it` at `:548` — and then the run says
`PASS` and exits 0. **Same family as the two WO-2.14 closed: the tool does something other than what
it was asked, says so quietly, and nothing stops.** Nobody has ticked WO-2.5 yet, so the roadmap box
it is supposed to close would simply have stayed open with a green run behind it.

**Deliverables**
- **A standing check on `wo-gate.mjs`, inside `wo-gate.mjs`.** `--self-check` copies `plans/` to a
  temp directory, plants the violations WO-2.14 proved by hand — an unticked acceptance line, a
  double `--start`, a `--start` on `✅ DONE`, a `--release` of nothing, a `--dry-run` that must write
  nothing — runs the script against the copy, and fails if any of them stops being caught. One flag,
  one exit code, no new file.
- **Decide what a zero-match `Closes roadmap` fragment is**, and make the tool act on the decision.
  The recommendation is that it becomes a `HELD`, not a `NOTE`: a work order that names a roadmap box
  and closes none of them is either quoting a box that moved or quoting one that never existed, and
  both want a human before the status line says done. Whatever is chosen, the reasoning goes in a
  comment at the point of decision.
- **Fix WO-2.5's fragment** so it matches `ROADMAP.md:280`, and **sweep every other work order's
  `Closes roadmap` line for the same rot** — a fragment written against a roadmap box that has since
  been reworded fails silently and only at tick time, which is the worst moment to discover it. The
  sweep should also find the fields the tool does not know exist: WO-2.13 carries an **Amends
  roadmap** clause on its `Depends on` line, which `depsOf()` scrapes into the dependency field and
  reports as prose, and which nothing else in the script has ever heard of. Decide whether that field
  is real; if it is, it needs handling, and if it is not, it should not be in a header block.
- Whatever the sweep finds, recorded where the next person will see it rather than fixed and
  forgotten.
- **A drift check on `ROADMAP.md`'s progress dashboard.** Count the ticked and total boxes under
  each `## Phase N` heading and compare against that phase's dashboard row, including the overall
  total — which must also equal the sum of its own rows. **Report only, never write**: the
  out-of-scope rule below still binds, and `--tick` touches the same files after this work order
  that it touches before it. This is *not* a `--self-check` item — that flag plants violations and
  tests the tool, whereas this checks the documents, so it rides the normal run and takes the same
  `HELD`-versus-`NOTE` decision as the zero-match fragment above. **Why it is here:** `ROADMAP.md:36`
  makes updating the dashboard row a manual fourth step, `wo-gate.mjs` only ever writes the dashboard
  in `work-orders/README.md`, and nothing reads the roadmap's back. Found 2026-08-08 with Phase 1
  reading `🔨 IN PROGRESS · 11/12` against **twelve ticked boxes and zero unticked** — Phase 1 having
  closed on 2026-08-06 — Phase 2 reading 10/16 against twelve, and an overall of 22/81 where the rows
  sum to 25/82. Three wrong numerators, and a denominator wrong independently of all of them.

**Out of scope** — no new script and no `tools/lib/`, per
[`../verification-tooling.md`](../verification-tooling.md); `--self-check` lives in the file it
checks or it does not exist. **No second harness**: this does not grow into a test framework, and if
it starts wanting one, stop and say so. No change to what `--tick` writes or to which files it may
touch. Not a fix for the `'504'` needle in `verify-shell.mjs` — that was repaired on 2026-08-08 and
is a different file's problem.

**Acceptance**
- [ ] `--self-check` passes on the current tree, and the run says how many plants it made — "0 plants
      passed" is what a broken self-check prints, and it must be visible rather than inferred.
- [ ] **Each plant is proved to be able to fail.** Restore the pre-WO-2.14 script from git into a
      temp path, run `--self-check` against it, and watch the acceptance-list plant and the
      double-`--start` plant report failures. A self-check that passes against the code it was
      written to catch is not evidence.
- [ ] `--self-check` writes nothing inside the repository. Hash `plans/` before and after; compare
      the hashes, not the banner.
- [ ] `--self-check` leaves no temp directory behind on either exit path, including the failing one.
- [ ] A work order whose `Closes roadmap` fragment matches zero boxes is handled per the decision
      above, and the behaviour is demonstrated on a planted fragment rather than on WO-2.5 — WO-2.5
      is being fixed in this same work order and cannot be the fixture that proves it.
- [ ] WO-2.5's fragment matches exactly one roadmap box — proved by the fragment sweep below, **not
      by `--tick WO-2.5 --dry-run`**, which no longer works and cannot be made to. WO-2.5 shipped on
      2026-08-08, so that command now exits `FAIL | WO-2.5 is "✅ DONE" — only ⬜ NOT STARTED or
      🔨 IN PROGRESS may be ticked`, and `ROADMAP.md:280` was hand-ticked the same day, so even a
      corrected fragment has no edit left to plan. If a live `--tick` demonstration is still wanted,
      do it inside `--self-check`'s temp copy of `plans/`, where the status line and the roadmap box
      can both be rolled back to their pre-2026-08-08 values and the run costs the repository
      nothing. **This line was rewritten on 2026-08-08, the day its fixture was spent** — the same
      family of rot this work order exists to catch, arriving in its own acceptance list.
- [ ] Every `Closes roadmap` fragment in `plans/work-orders/` is reported as matching exactly one
      box, or listed as not doing so with the reason. Run it over all of them, not a sample.
- [ ] Every `## Phase N` row in `ROADMAP.md`'s dashboard matches the box counts under its own
      heading, or is reported as not doing so **with both numbers shown**; the overall row is
      checked against the sum of the rows as well as against the file. **Prove it on a planted
      wrong count in a temp copy** — the tree's own three wrong rows are being corrected by hand
      before this work order lands and cannot be the fixture. *(That sentence is the lesson from
      acceptance line 6 above, which named a fixture that was spent the day WO-2.5 shipped. A work
      order about drift should not keep writing acceptance lines that drift.)*
- [ ] `--tick`, `--start` and `--release` behave exactly as they did before on the paths that already
      work — WO-2.14's acceptance list, re-run.
- [ ] `verify-shell.mjs` and `wo-sweep.mjs` still run clean afterward — **all checks passing, zero
      skips, exit 0, and the count matching whatever `tools/README.md` says at the time**. No number
      is written here on purpose: this line read `400/400` until 2026-08-08, by which point the tree
      was at 428 and the line had been quietly wrong for three work orders. A hardcoded total in an
      acceptance box goes stale every time the harness grows, which is every work order.

**Traps** — **The precondition rule applies to the self-check itself, one level up.** WO-1.12 and
WO-2.14 both proved a fix by planting the violation and watching the script fail. A `--self-check`
is a check on checks, and the same rule bites harder: the way it fails is by planting something the
current script happens to catch for an unrelated reason, then passing forever. The second acceptance
line — run it against the old script and watch it go red — is the whole guarantee here, and it is
the one to do first, not last.

**The temp copy is the only safe fixture, and getting it wrong is the worst bug in this file.** A
self-check that plants an unticked acceptance line in the real `plans/` and then dies before
unwinding leaves corrupted tracker state that looks hand-written. Copy first, operate on the copy,
and never let a plant path take a real repository path — not even under `--dry-run`, because the
next edit to that code will remove the flag.

**A green self-check is not coverage, and the run should not imply it is.** This checks the handful
of behaviours WO-2.14 built and nothing else — not the Acceptance parser against all 61 work orders,
not `recomputeDashboard()`'s arithmetic, not `next`'s ordering. Say what it covers in the output, or
the next reader will trust it for the parts it never touched.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/wo-gate.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these — this work order is entirely about the harness and the trackers, so the documents
*are* the subject matter:

- **`plans/verification-tooling.md`** — named directly in the **Out of scope** line. It is the reason
  `--self-check` must live inside `wo-gate.mjs` rather than becoming `tools/wo-selfcheck.mjs` or
  anything under `tools/lib/`. Read it before you reach for a new file, because the moment the
  self-check gets big the instinct to split it out will feel like good hygiene and is explicitly
  forbidden here.
- **`plans/ROADMAP.md`** — both halves: the progress dashboard around `:49`, which the new drift
  check reads, and the maintenance protocol at `:30-40`, whose step 3 ("Update the phase's row in the
  dashboard") is the manual step that lets the dashboard rot in the first place.
- **WO-2.14, immediately above this work order** in `plans/work-orders/phase-2-attendance.md`.
  Acceptance line 9 is literally "WO-2.14's acceptance list, re-run," so you need its ten lines in
  front of you. Its **Traps** section also carries the rule that `--start` and `--tick`'s refusal
  arrive at `🔨 IN PROGRESS` for unrelated reasons and must not be collapsed into shared code — that
  rule binds your `--self-check` plants too, which test both paths.
- **`plans/work-orders/README.md`** — the dashboard `--tick` already recomputes, so you can see what
  the tool writes today versus the roadmap dashboard it must only ever *report* on.

**Three facts about the current tree that change what your fixtures can be.** Each one is a spent
fixture, and the work order was written partly because fixtures here keep getting spent:

1. **The roadmap dashboard's three wrong rows are already fixed.** Commit `c8a2adc` corrected them by
   hand on 2026-08-08 — Phase 1 now reads `12/12`, Phase 2 `12/16`, overall `28/82`, and the rows do
   sum to 28. So acceptance line 8's instruction stands exactly as written: the drift check must be
   proved on a **planted wrong count in a temp copy**, because a run against the real tree today is
   expected to come back clean and would prove nothing. If your drift check reports drift on the
   current tree, that is a finding about your check or about the hand correction — investigate and
   report it, do not quietly adjust the numbers.
2. **WO-2.5 is `✅ DONE` and `ROADMAP.md:280` is already ticked.** Acceptance line 6 spells out the
   consequence: `--tick WO-2.5 --dry-run` now exits `FAIL` on the status guard and cannot be the
   proof. Prove the corrected fragment through the sweep instead.
3. **WO-2.15 itself is `🔨 IN PROGRESS`** — I claimed it with `--start` before writing this brief.
   That is expected and is not drift. It also means a `--self-check` plant that operates on the real
   `plans/` would be corrupting a work order that is mid-flight, which is the trap two paragraphs
   below in your own work order.

**On the fourth deliverable — "recorded where the next person will see it."** That is prose, and it
is the deliverable most likely to get compressed into a bullet in your result file and lost. The
result file is a dispatch artifact; it is not where the next person looks. Put the sweep's findings
somewhere in `plans/` that a human reading the trackers will actually encounter — you may update
`plans/` as you go per the constraints below. Say in your report where you put it and why there.

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

1. `--self-check` passes on the current tree, and the run says how many plants it made — "0 plants passed" is what a broken self-check prints, and it must be visible rather than inferred.
2. **Each plant is proved to be able to fail.** Restore the pre-WO-2.14 script from git into a temp path, run `--self-check` against it, and watch the acceptance-list plant and the double-`--start` plant report failures. A self-check that passes against the code it was written to catch is not evidence.
3. `--self-check` writes nothing inside the repository. Hash `plans/` before and after; compare the hashes, not the banner.
4. `--self-check` leaves no temp directory behind on either exit path, including the failing one.
5. A work order whose `Closes roadmap` fragment matches zero boxes is handled per the decision above, and the behaviour is demonstrated on a planted fragment rather than on WO-2.5 — WO-2.5 is being fixed in this same work order and cannot be the fixture that proves it.
6. WO-2.5's fragment matches exactly one roadmap box — proved by the fragment sweep below, **not by `--tick WO-2.5 --dry-run`**, which no longer works and cannot be made to. WO-2.5 shipped on 2026-08-08, so that command now exits `FAIL | WO-2.5 is "✅ DONE" — only ⬜ NOT STARTED or 🔨 IN PROGRESS may be ticked`, and `ROADMAP.md:280` was hand-ticked the same day, so even a corrected fragment has no edit left to plan. If a live `--tick` demonstration is still wanted, do it inside `--self-check`'s temp copy of `plans/`, where the status line and the roadmap box can both be rolled back to their pre-2026-08-08 values and the run costs the repository nothing. **This line was rewritten on 2026-08-08, the day its fixture was spent** — the same family of rot this work order exists to catch, arriving in its own acceptance list.
7. Every `Closes roadmap` fragment in `plans/work-orders/` is reported as matching exactly one box, or listed as not doing so with the reason. Run it over all of them, not a sample.
8. Every `## Phase N` row in `ROADMAP.md`'s dashboard matches the box counts under its own heading, or is reported as not doing so **with both numbers shown**; the overall row is checked against the sum of the rows as well as against the file. **Prove it on a planted wrong count in a temp copy** — the tree's own three wrong rows are being corrected by hand before this work order lands and cannot be the fixture. *(That sentence is the lesson from acceptance line 6 above, which named a fixture that was spent the day WO-2.5 shipped. A work order about drift should not keep writing acceptance lines that drift.)*
9. `--tick`, `--start` and `--release` behave exactly as they did before on the paths that already work — WO-2.14's acceptance list, re-run.
10. `verify-shell.mjs` and `wo-sweep.mjs` still run clean afterward — **all checks passing, zero skips, exit 0, and the count matching whatever `tools/README.md` says at the time**. No number is written here on purpose: this line read `400/400` until 2026-08-08, by which point the tree was at 428 and the line had been quietly wrong for three work orders. A hardcoded total in an acceptance box goes stale every time the harness grows, which is every work order.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

