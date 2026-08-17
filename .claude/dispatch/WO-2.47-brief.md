# WO-2.47 — the repo-write guard is protected by prose in both scripts that carry it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.47-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, Opus tier**, on its own merits rather than by fallback:
the deciding signal is that this row's Traps are judgment traps aimed precisely at what a
code-optimizing model does by reflex — the two `assertOutsideRepo()` copies are duplicated **on
purpose**, and "do not extract a shared helper" is the first rule a tidy-up instinct breaks — while
two of the deliverables are prose that has to carry reasoning rather than code that has to run
(the `--against` asymmetry written at the code, and the textual-vs-behavioural caveat). The
runner-up I set aside was **Codex**: the spec here is unusually complete, it names its own line
numbers, there is no UI and no sensitive surface, and the proof runs are second-scale scripts
rather than `verify-shell.mjs`, so the 20-minute cap was never the binding constraint. It lost to
the rubric's one-line version — a work order whose value is in honoring the reasoning attached to
it is a Claude job — and no Codex probe was run, because this is not the Codex route.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.47 — the repo-write guard is protected by prose in both scripts that carry it

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** S · **Depends on** WO-2.44 · **Blocks** nothing
**Closes roadmap** *(no box. Dispatch tooling, not app — the same call WO-2.20, WO-2.37, WO-2.40 and WO-2.44 made.)*

**Not a go-live blocker, and it has never fired.** Booked 2026-08-17 out of WO-2.44's verification,
where both agents independently reported that nothing standing protects the fix that row had just
landed. **WO-2.44's Out of scope refused this on purpose** — *"the guard is a property of the harness,
not a plant"* — and that was the right call for a row whose whole subject was a measurement. It leaves
the fix guarded by a comment.

**Why it exists.** `assertOutsideRepo()` is **silent when it works and silent when it fails**, which is
WO-2.44's own trap. A regression would be exactly as quiet as the original defect: WO-2.40's first cut
ran all seventeen plants inside `C:\dev\planbook\.guard-probe\…` and printed `PASS | 17 of 17`. Nothing
in either script, in `--self-check`, in `--audit` or in the sweep would notice the fold coming back out.

**The compare is the load-bearing half, and the call site is worth one empty directory.** Measured on
the fixed tree rather than assumed, because it decides what is worth guarding: the copy targets at
`wo-gate.mjs:1630-1631` are *already* wrapped in the guard, so deleting the `assertOutsideRepo(sandbox)`
line WO-2.44 added at `:1609` moves the refusal later by one `fs.mkdirSync(sandbox/tools)` — an empty
directory inside the repository, then a throw. Deleting the **fold** at `:1535` restores the whole
silent escape. So a guard over the compare gets nearly all of the coverage, and the ordering line is
prose worth keeping rather than a second thing to test.

**And `codex-invoke.mjs`'s copy is tested by nothing at all today** — it has carried this fix since
WO-2.40 and it is the script that spawns Codex. Since the two copies are **duplicated on purpose**
rather than shared, "both copies still fold" is a claim no behavioural check in either file can make.
That is a sweep claim, and `wo-sweep.mjs:630-689` is already exactly this shape.

**Deliverables**
- **A precondition assertion over `assertOutsideRepo()` itself**, in `selfCheck()`, before the sandbox
  exists — beside `trackerDrift()`'s precondition (`:1638`) and reported the way that one is. Three
  facts, because two of them do not separate the failure modes: `path.join(REPO, '.probe')` throws; the
  same path with the drive letter's case **flipped** throws, on win32 only *(on POSIX that path is
  genuinely outside, and asserting a throw there would be asserting a bug)*; and a path that really is
  outside does **not** throw, which is what distinguishes "the fold was deleted" from "it throws at
  everything."
- **The `--against` asymmetry written at the code**, because this assertion is unlike every other check
  in the file: it runs in the **invoking** script, not the subject, so `--self-check --against <old
  copy>` would pass it while running the buggy guard. It is provable by **mutation** instead — delete
  the fold, watch it go red — which is the pattern `tools/README.md`'s WO-3.11 table already uses. The
  new mutation goes in that table.
- **A sweep check that both copies still fold**, over `tools/wo-gate.mjs` and `tools/codex-invoke.mjs`.
  **FAIL and not REVIEW** when either pattern stops matching, and FAIL on an empty grep — this file's
  own rule, stated twice in its header and applied at `:660-665`.
- **Whatever recorded count the new check moves**, updated from a run rather than by arithmetic, per the
  rule at `wo-sweep.mjs:673`. The sweep reported `20 checks · 18 passed · 0 failed · 2 to review` on the
  tree that booked this row.
- ~~**A correction to WO-2.44's own premise, in an italic-paren amendment on its row.**~~ *(**Landed
  before this row was ever dispatched, at WO-2.44's tick on 2026-08-17**, as maintenance-protocol step 2
  — "note any divergence in an *(italic paren)*" — rather than as work owed to a successor. It is left
  here struck instead of deleted because the reasoning is what this row inherited: the premise held that
  win32 yields a **lowercase** drive letter, it yields whatever case launched node, and the pre-fix guard
  was therefore correct **by coincidence of invocation** — worse than always-broken, and why the
  verifier's own first unfixed run refused correctly and read exactly like a pass. **Do not re-do it**;
  read the amendment on WO-2.44's row and carry the reasoning into the assertion this row asks for,
  because "either spelling" is the thing the win32 clause has to be right about.)*

**Out of scope** — **rewriting the guard to use `path.relative()`**, which would make this class of bug
unrepresentable rather than tested. It is a real option and was measured, not dismissed: win32
`path.relative` is case-blind about the drive letter (`c:\dev\planbook` → `C:\dev\planbook\plans\x`
gives `plans\x`), returns `""` for the same directory, `..\` for a sibling whose name shares a prefix,
and an **absolute** path across drives — that last being the clause that must be handled or the guard
permits everything. `tools/README.md:90-91` already leans on this property to argue `wo-sweep.mjs` needs
no fix. It is out of scope here for two reasons: a row about protecting a fix should not also change the
fix, and it would break the "same two lines, copied from the sibling" relationship unless
`codex-invoke.mjs` changes in the same sitting. Book it separately if the shape is wanted.

Also out of scope: **a standing end-to-end probe** — a subprocess with `TMP` inside the tree, asserting
exit 1 and zero writes, which is what WO-2.44's verifier ran by hand. It proves the whole path and it is
the one check that, on regression, **performs the escape it is testing for**. Contained, at least: every
write in `runPlants()` goes under `sandbox`, so a regression writes into the probe directory and never on
top of the live `plans/`. The coverage delta over the first deliverable is one empty `mkdirSync`, and the
cost is a subprocess and an env mutation in a script that has neither. And: `codex-invoke.mjs` as a
*change* — this row only reads it.

**Acceptance**
- [ ] With the fold deleted from `wo-gate.mjs`'s `assertOutsideRepo()`, `--self-check` goes **red at the
      new precondition**, names the path it should have refused, and plants nothing. Reverted, and the
      revert proved rather than reported.
- [ ] With the fold deleted from `codex-invoke.mjs`, `node tools/wo-sweep.mjs` goes **red at the new
      check** and names that file. Reverted and proved the same way.
- [ ] **The new sweep check FAILs rather than passing quietly when it matches nothing** — shown, not
      asserted, by pointing it at a path that does not exist. A green run over an empty grep is the
      shape this whole file exists to catch.
- [ ] On the unmutated tree: `--self-check` still `PASS | 17 of 17 plants were caught`, `--audit` still
      PASS, `node tools/wo-sweep.mjs` green with its new count matching whatever `tools/README.md`
      records.
- [ ] The `--against` asymmetry is written at the code **and** in `tools/README.md`'s mutation table.
- [ ] `git diff --stat -- src/` is empty. *(This line carried WO-2.44's premise correction until that
      landed at its tick — see the struck deliverable above.)*

**Traps** — **This is not an eighteenth plant, and it must not be counted as one.** The seventeen are
about tracker rot; the count is recorded in `tools/README.md`, in the run's own output and in WO-2.44's
acceptance, and a precondition that arrives as a plant makes three records wrong at once. WO-2.16's
precondition reasoning is the model: it reports before any plant is made and says so in its own output.
**Do not extract a shared helper** — WO-2.44's trap, unchanged; no script in `tools/` imports another,
and that is the suite's no-dependencies rule reaching into its own toolchain. **A textual sweep check
guards against deletion, not against subtle breakage** — say that where it is written, or the next
reader takes it for behavioural coverage of a file nothing behaviourally covers. **And take the md5
before the first mutation and prove the revert**, even though these mutations are in `tools/` rather
than `src/`: WO-2.37's constant edit and WO-2.42's `src/classes.js` md5 that no blob in the file's
history matches are both this hazard, and neither was in `src/` by intention either.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/classes.js`
  - `tools/README.md`
  - `tools/codex-invoke.mjs`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The specific places this work order points you at, all of which are conventions to match rather
than reference reading:**

- **`tools/wo-gate.mjs`** — `assertOutsideRepo()` and its fold (`~:1535`), the `--self-check` call
  site the guard wraps (`~:1609`), the copy targets already inside the guard (`~:1630-1631`), and
  **`trackerDrift()`'s precondition at `~:1638` — that is the shape your new precondition copies**,
  including how it reports. Line numbers are from the work order and were written before your edits;
  confirm each against the file rather than trusting the number.
- **`tools/wo-sweep.mjs:630-689`** — the existing check whose shape the new sweep check takes, and
  **`:660-665`**, which is where "FAIL on an empty grep" is actually applied. **`:673`** carries the
  rule that a recorded count is updated from a run, not by arithmetic.
- **`tools/README.md`** — the WO-3.11 mutation table your new mutation joins, and `:90-91`, which
  leans on `path.relative`'s win32 case-blindness (context for the Out of scope line; do not act on
  it).
- **WO-2.44's row in `plans/work-orders/phase-2-attendance.md`** — read the *(italic paren)*
  amendment on it. It is already written; **do not re-do it.** Its reasoning is what your win32
  clause has to be right about: win32 yields whatever case launched node, not a lowercase drive
  letter, so "either spelling" is the property under test.
- **WO-2.16's precondition, same phase file** — the model the Traps name for reporting *before* any
  plant is made and saying so in its own output. This is how the "not an eighteenth plant" trap is
  satisfied in practice.
- **`plans/dispatch-retro.md`** — the mutate · run · revert scars (WO-2.37's constant edit, WO-2.42's
  `src/classes.js` md5 that matches no blob in the file's history). That is why `src/classes.js` is
  in the reference list above: it is a scar to read about, **not a file this row touches.**

**On § 4 below, read this before you run anything.** `verify-shell.mjs` is the standing gate and is
listed because every brief lists it — but this row changes no file the browser harness loads, and
Acceptance line 6 requires `git diff --stat -- src/` to come back **empty**. The commands this work
order is actually graded on are `node tools/wo-gate.mjs --self-check`, `node tools/wo-gate.mjs
--audit`, and `node tools/wo-sweep.mjs`. If `verify-shell.mjs` cannot run in your sandbox, **report
that as an environment fact, not as a result** — the project's rule is that it gets re-run locally,
and it closes nothing either way.

**Mutation discipline, since three of the six Acceptance lines are mutations.** Take the md5 of
every file you are about to mutate **before the first mutation**, restore it, and **prove** the
revert by re-taking the hash and showing it matches — reporting a revert is not proving one. Commit
nothing while the tree is dirty. Quote the actual command output in your result file for each of
these, because the verifier reads your work cold and a described run is not a run.

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

## 5. Done means these 6 lines, reported against one by one

1. With the fold deleted from `wo-gate.mjs`'s `assertOutsideRepo()`, `--self-check` goes **red at the new precondition**, names the path it should have refused, and plants nothing. Reverted, and the revert proved rather than reported.
2. With the fold deleted from `codex-invoke.mjs`, `node tools/wo-sweep.mjs` goes **red at the new check** and names that file. Reverted and proved the same way.
3. **The new sweep check FAILs rather than passing quietly when it matches nothing** — shown, not asserted, by pointing it at a path that does not exist. A green run over an empty grep is the shape this whole file exists to catch.
4. On the unmutated tree: `--self-check` still `PASS | 17 of 17 plants were caught`, `--audit` still PASS, `node tools/wo-sweep.mjs` green with its new count matching whatever `tools/README.md` records.
5. The `--against` asymmetry is written at the code **and** in `tools/README.md`'s mutation table.
6. `git diff --stat -- src/` is empty. *(This line carried WO-2.44's premise correction until that landed at its tick — see the struck deliverable above.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

