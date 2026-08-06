# WO-1.12 — Close two harness blind spots found at WO-1.10 · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.12-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, on the Traps line: this work order edits the instrument that grades
every other work order, under a decision record (`plans/verification-tooling.md`) whose entire
purpose is that each individually reasonable harness improvement is how a framework arrives — so
the judgment about what counts as evidence, and about where the "no new script, no `tools/lib/`,
no new *kind* of check" boundary sits, is the deliverable, not the diff. The runner-up I set aside:
by size (S) and mechanically checkable acceptance this reads as a clean Codex row, and there is no
pre-routing entry for it since it was minted after WO-1.10 — but the Codex probe failed again this
dispatch (`codex-windows-sandbox-setup.exe: program not found`), so the standing suspension applies
regardless.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.12 — Close two harness blind spots found at WO-1.10

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-1.10
**Not a go-live blocker.** Added 2026-08-05, out of WO-1.10's verification.

**Why it exists.** WO-1.10's verifier found two places where the verification tooling would report
a clean run while missing the exact thing it exists to catch. Neither is an app defect today —
both are the instrument, not the target — but both degrade silently, which is the failure mode
`plans/verification-tooling.md` and `plans/dispatch-retro.md` keep naming as worse than no check at
all: a confident pass over nothing.

**The two gaps**
- **`tools/wo-sweep.mjs`'s coarse-block check is blind to untracked stylesheets.** It finds new CSS
  selectors with `git diff -U0 HEAD -- src\*.css`, which sees nothing in a file that isn't tracked
  yet. At WO-1.10 this meant all nine selectors in the new `src/home.css` were invisible to it, and
  it reported "1 new selector(s), all covered" about a selector from `shell.css` alone — a true
  statement about the wrong file. `src/README.md` makes one stylesheet per screen the convention, so
  every future screen trips this the same way.
- **The home screen's redraw depends on a hand-maintained list.** `src/shell.js`'s
  `afterClassChange()` calls `home.js`'s renderer from eight sites — archive, restore, delete,
  reorder, create, rename, and two more — and is complete today, verified against every exported
  mutator in `src/classes.js`. But `tools/verify-shell.mjs` only reads `#homeGrid` before the archive
  step and never again, so a future work order that adds a mutator and forgets its line in that list
  would leave all checks green while a teacher watches an archived class stay on the grid.

**Deliverables**
- Widen `wo-sweep.mjs`'s coarse-block check so it sees selectors in untracked `src/*.css` files, not
  only ones already known to git — a change to what the check looks at, not a new check.
- Add reads of `#homeGrid` in `verify-shell.mjs` after enough of the eight `afterClassChange()`
  branches that a missing call site would fail a check, not just after the archive step it already
  covers.

**Out of scope** — no new script, no `tools/lib/`, no new *kind* of check. This closes blind spots
in the two scripts that already exist; read
[`../verification-tooling.md`](../verification-tooling.md) before touching either file, since both
stay one file each by rule.

**Acceptance**
- [ ] A planted, untracked `src/*.css` file with an uncovered coarse-pointer selector is caught by
      `wo-sweep.mjs`, not silently passed because the diff against `HEAD` is empty.
- [ ] Deleting one line from `afterClassChange()`'s call list makes `verify-shell.mjs` fail at least
      one check, for as many of the eight branches as can be driven without new app-side hooks.
- [ ] Both scripts still run clean against the real repo afterward — no regression in `wo-sweep.mjs`'s
      9-passed baseline or `verify-shell.mjs`'s 209/209/0-skips baseline, beyond checks this work
      order adds on purpose.

**Traps** — Per `verification-tooling.md`'s precondition rule, a check that could not have caught the
gap it's named for is not evidence. Prove each fix by planting the violation first and watching it
fail, the way the coarse-block check itself was proven at WO-1.7 — don't ship a mechanism change
without demonstrating it actually catches something.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/dispatch-retro.md`
  - `plans/verification-tooling.md`
  - `src/README.md`
  - `src/classes.js`
  - `src/home.css`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these, and note what the orchestrator has already checked:

- `src/home.js` — the renderer `afterClassChange()` drives. `src/shell.js` calls `afterClassChange()`
  at lines 124, 152, 252, 266, 270, 275, 279, 285, 408, 413 and 521 as the file stands; the work
  order's "eight sites" is prose, not a count to trust. **Derive the real list yourself** from
  `src/shell.js` and cross-check it against every exported mutator in `src/classes.js`, the way
  WO-1.10's verifier did. If the true count is not eight, say so in your report — do not edit
  `plans/` to correct it.
- `tools/verify-shell.mjs` around lines 2661–2830 — the existing `#homeGrid` reads. That is where the
  archive-step coverage already lives and where the gap is.
- `tools/wo-sweep.mjs` around lines 236–280 — the coarse-block check and its `git diff -U0 HEAD --
  src\*.css` source. The fix is to what that check *looks at*, not a new check beside it.

**Four things the orchestrator wants you to be careful about:**

1. **Measure the baselines before you touch either file, and put the numbers in your report.** The
   Acceptance list names `verify-shell.mjs` at "209/209/0 skips", but WO-1.11's completion note in
   the same phase file records **224 of 224, 0 skipped**, and `wo-sweep.mjs` at 10 passed with 1
   pre-existing unrelated `REVIEW` rather than the "9-passed" the list names. The work order was
   drafted before WO-1.11 landed. **The live pre-change numbers are the baseline; the ones in the
   Acceptance text are stale.** Record both so the verifier can tell a stale line from a regression.
2. **You are modifying the tools the verifier will use to grade you.** A change that makes either
   script quieter, or that makes a check vacuous, corrupts the verification of this very work order.
   Guard every new check against a vacuous pass — a `#homeGrid` read that finds zero cards must not
   read as "the class was removed."
3. **The proof obligation is the deliverable.** For each of the two fixes: plant the violation, run
   the script, show it fail; remove the violation, run it, show it pass. Put the actual command
   output in your report for both directions. A fix without its planted-failure transcript is not
   evidence, per `verification-tooling.md`'s precondition rule. Leave no planted violation behind —
   `git status --short` must be clean of fixtures when you finish.
4. **`plans/verification-tooling.md`'s boundary table is binding**: one file each, no config file, no
   `tools/lib/`, no shared helper between the two scripts, gates nothing. Watch the two live controls
   it names — lines per check (~17.9) and wall-clock runtime (~58s, higher now) — and report both
   after your change, since that reporting is itself the rule that replaced the retired line cap.

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
- Stay inside the work order's **Out of scope** line. Do not tick roadmap boxes, edit `plans/`, or
  touch `CHANGELOG.md` / `TESTING.md` — the teacher does maintenance, after the verifier reports.

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

## 5. Done means these 3 lines, reported against one by one

1. A planted, untracked `src/*.css` file with an uncovered coarse-pointer selector is caught by `wo-sweep.mjs`, not silently passed because the diff against `HEAD` is empty.
2. Deleting one line from `afterClassChange()`'s call list makes `verify-shell.mjs` fail at least one check, for as many of the eight branches as can be driven without new app-side hooks.
3. Both scripts still run clean against the real repo afterward — no regression in `wo-sweep.mjs`'s 9-passed baseline or `verify-shell.mjs`'s 209/209/0-skips baseline, beyond checks this work order adds on purpose.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

