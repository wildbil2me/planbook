# WO-2.48 — the sweep's list of guarded scripts is written down rather than derived · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.48-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, at the Opus tier**, on its own merits rather than by
fallback: the deciding signal is a Traps section that is judgment rather than mechanics — *this is not
an eighteenth plant*, *do not extract a shared helper*, and a check that will report the sweep itself
as an unwatched third copy if the pattern is not anchored — alongside deliverables that are **prose
written at the code**: an exemption reason a later reader has to be able to weigh, and a paragraph
about what the derived scan still cannot see that must not read as a proof of completeness. That is
the same call its two direct precedents in this file took, WO-2.44 and WO-2.47.

The runner-up I set aside was **Codex**: the spec is unusually complete, it names its own model (the
delegated-hook check's derived-census-versus-declared-inventory diff), the acceptance is mechanically
checkable, and the budget is a non-issue — `wo-sweep.mjs` runs in **0.6s** on this tree, so the six
runs the Acceptance demands are seconds rather than the ~4.4-minute-per-run `verify-shell.mjs`
arithmetic. It loses on ties going to Claude and on the judgment bullet firing cleanly. No Codex probe
was run, because this is not the Codex route. `ROUTING.md`'s Ship 1 pre-routing table has no row for
WO-2.48, so there is no pre-routing to agree or disagree with.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.48 — the sweep's list of guarded scripts is written down rather than derived

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-18 · **Size** S · **Depends on** WO-2.47 · **Blocks** nothing
**Closes roadmap** *(no box. Dispatch tooling, not app — the same call WO-2.20, WO-2.37, WO-2.40, WO-2.44 and WO-2.47 made.)*

**Not a go-live blocker, and it cannot fire today.** Booked 2026-08-17 out of WO-2.47's verification,
which named it while declining to widen that row to fix it — the same shape WO-2.47 itself took out of
WO-2.44. It is the one gap that row left standing, written down at the moment it was found rather than
carried in a verifier's report nobody re-reads.

**Why it exists.** `wo-sweep.mjs` § 15 opens with `const COPIES = ['tools/wo-gate.mjs',
'tools/codex-invoke.mjs']` and is thorough about exactly those two files. **Nothing asserts the list is
complete.** It is complete today, by observation and not by construction: `function assertOutsideRepo(`
is declared exactly twice repo-wide, at `wo-gate.mjs:1534` and `codex-invoke.mjs:746`, in exactly the two
scripts that build a sandbox out of `os.tmpdir()` — `wo-gate.mjs:1706`, `codex-invoke.mjs:252` and
`:772`. Two facts that agree, and no check standing behind either.

**The failure has a shape, and the pattern is already two-for-two.** A third script under `tools/` grows
a sandbox — every script that has needed one has needed the guard — and its author copies the guard,
correctly, because the copies are copied on purpose. The new copy joins a set the sweep does not read.
It is watched by nothing, and § 15 goes on reporting green about the two files it was told about. **That
is the silence WO-2.47 closed, one level up:** the check that guards the guard is itself guarded by a
hardcoded list, and a list is prose with brackets around it.

**The third script is not hypothetical — it is already here, and this row was booked believing otherwise.**
`verify-shell.mjs:1073` builds a directory out of `os.tmpdir()`, hands it to Edge as `--user-data-dir`,
redirects browser downloads into it (`:1998`, `:2195`) and ends at `:22277` with
`fs.rm(udd, { recursive: true, force: true })` — a recursive force-delete of an env-derived path, with no
guard anywhere near it. Found on 2026-08-17, hours after this row was written, by the owner asking whether
the row was pressing or merely following precedent. **The first draft of this row asserted the scan would
find nothing today. It was wrong**, and the correction is left here rather than quietly applied, because
the row is now the record of how it was found: the placement argument was the weakest part of the booking
and the question aimed at it turned up the fact the booking was missing.

**Its blast radius is genuinely smaller, and that is why this stays a check and not a fix.** `mkdtemp`
creates a *fresh unique* directory and the `rm` targets only that directory, so the worst case is a stray
folder appearing inside the repository and then being deleted again. `wo-gate --self-check` is the
dangerous one: its `finally` deletes a sandbox holding **copies of the live trackers**, which is a
different sentence entirely. Same class, different stakes — so `verify-shell.mjs` is carried here as a
**named, reasoned exemption** rather than as a third file to guard or a fourth thing to ignore.

**Deliverables**
- **Derive the set and diff it against the declared one**, failing when the two diverge **in either
  direction**. The extra direction is not symmetry for its own sake: the cheapest way to silence a
  failing § 15 is to delete a file from `COPIES`, which turns a red check green while removing the
  coverage. The model is already in this file — the delegated-hook check diffs a derived census against
  a declared inventory and says which way it went.
- **Two signals over `tools/*.mjs`, unioned, because either alone misses the case that matters.** A
  top-level `function assertOutsideRepo(` finds a third *copy* of the guard. A temp-dir sandbox —
  `mkdtempSync`, or a `mkdirSync` under `os.tmpdir()` — finds a third script that sandboxes and **forgot**
  the guard, which is the dangerous direction and the one a scan for the guard's own name is blind to by
  construction. A file matching either signal and classified by **neither** list below is a fault.
- **Two declared lists, not one, because the sandbox signal has a true positive that is not a defect.**
  The guarded set — the two copies § 15 already reads — and an **exempt** set, each entry carrying a
  written reason, holding `tools/verify-shell.mjs` and its argument: `mkdtemp` gives a fresh unique
  directory and the only `rm` is of that directory, so the failure it can produce is a stray folder rather
  than a deletion of anything that existed first. An exemption with a sentence attached is a decision; a
  file silently missing from an array is the thing this row exists to end. **A file in neither list FAILs**,
  which is what makes adding a fourth script a deliberate act.
- **What the derived scan still cannot see, written at the code**, with § 15's own discipline about
  deletion versus subtle breakage: a guard under a different name, a sandbox spelled some third way, a
  script that writes into the repository on purpose and correctly. This narrows the unwatched set; it does
  not close it, and a reader who takes it for a proof of completeness has been misled by a check that
  exists because somebody took a list for one.
- **FAIL and not REVIEW, and FAIL when the scan matches nothing.** Zero files carrying either signal means
  the scan broke, not that the repository got safer — `wo-sweep.mjs`'s own rule, stated twice in its
  header, and the rule WO-2.47's third Acceptance line already had to prove once.
- **Whatever recorded count this moves**, updated from a run rather than by arithmetic, per the rule at
  `wo-sweep.mjs:673`. The sweep reported `21 checks · 19 passed · 0 failed · 2 to review` on the tree that
  booked this row, and `tools/README.md` states that figure in three places.

**A decision the row makes rather than leaves open: this goes inside § 15, not beside it.** The claim is
about that check's own scope — its list, its files, its blind spot — and a § 16 that exists only to
police § 15's array separates the assertion from the thing asserted, so a later edit to `COPIES` has no
reason to look at it. Fold it in as a preamble that runs before the per-file loop and feeds it. **If that
lands as a second `check()` and moves the count, take the count from the run**; the deliverable above
governs and this paragraph is not a prediction of the number.

**Out of scope** — **anything outside `tools/*.mjs`.** Nothing in `src/` touches the filesystem; the app
is a browser PWA and the guard is a property of the toolchain. Scanning wider buys nothing and gives the
check a way to be wrong.

Also out of scope: **rewriting either guard to `path.relative()`**, unchanged from WO-2.47's refusal and
for its reason — a row about protecting a fix should not also change the fix, and it cannot be done to one
copy without the other.

And, the one the owner ruled on directly: **putting a guard on `verify-shell.mjs`.** The scan finds it
today — that is the corrected premise four paragraphs up — and the temptation is to make the derived set
and the guarded set agree by guarding it. **Do not.** A row that builds an alarm does not also do what the
alarm asks, which is the distinction WO-2.47 kept when it left *this* gap standing rather than growing to
meet it, and which is the only reason there is a row here to dispatch. Guarding the harness is a separate
row if the bounded-blast-radius argument above ever stops holding — if that `rm` is ever pointed at a path
it did not itself create, the exemption is void and the reason string is where a reader will look.

**Acceptance**
- [ ] On the unmutated tree every file the scan finds is classified by one list or the other, and the
      proof line **names the files** rather than reporting a count — a bare `3 of 3` is the same trust this
      row exists to remove. `tools/verify-shell.mjs` appears as exempt, with its reason, and the run is
      green.
- [ ] Deleting `tools/verify-shell.mjs` from the exempt list turns the sweep **red**, naming it as an
      unclassified temp-dir user. This is the one check that proves the exemption is a decision the sweep
      enforces rather than a comment somebody wrote — and it is the same direction as the `COPIES` line
      below, for the same reason.
- [ ] A **new** `tools/*.mjs` carrying a top-level `function assertOutsideRepo(` turns the sweep **red**,
      names the file, and says it is unwatched. The scratch file is deleted in a `finally`, `git status
      --short` is byte-identical either side, and the revert is proved rather than reported.
- [ ] A **new** `tools/*.mjs` that makes a `mkdtempSync` sandbox and carries **no guard at all** turns the
      sweep red on the second signal — unclassified, not exempt. This is the case the name scan cannot see
      and the reason there are two signals; a row that ships one has not built this check. Same revert
      discipline.
- [ ] Deleting `'tools/codex-invoke.mjs'` from the declared list turns the sweep red rather than green.
      Reverted and proved the same way.
- [ ] The scan matching **zero** files FAILs, shown rather than asserted.
- [ ] On the unmutated tree: `node tools/wo-sweep.mjs` green with its count matching `tools/README.md`
      everywhere that file states one, `wo-gate.mjs --self-check` still `PASS | 17 of 17 plants were
      caught`, `--audit` still PASS.
- [ ] `git diff --stat -- src/` is empty.

**Traps** — **`wo-sweep.mjs` will match its own scan if the pattern is loose.** This file now carries the
string `assertOutsideRepo` in its § 15 prose *and* inside the regex that looks for it, so a scan for the
bare name reports the sweep itself as an unwatched third copy — a red run on the day it lands, from a
check that is working exactly as written. § 15's existing `/^function\s+assertOutsideRepo\s*\(/` is
anchored for this reason; stay anchored, and prove it by running the thing rather than by reading it.
**The mutations for this row write files into `tools/`**, which is the one directory the guard under
examination exists to keep temporary files out of — so the hash-and-revert discipline applies to the
**directory listing**, not just to a file's contents, and an interrupted mutation leaves a stray script
in the toolchain rather than an edit in one file. **Do not extract a shared helper** — WO-2.44's and
WO-2.47's trap, unchanged. **And this is not an eighteenth plant either**; the seventeen are about
tracker rot, and WO-2.47's version of this trap holds here word for word.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also read, and they matter more than the CDP notes above — this work order touches no browser:**

- **`tools/wo-sweep.mjs` § 15 in full**, plus its `COPIES` array and the comment under it. This is the
  check you are folding a preamble into. The work order rules that the new logic goes **inside § 15,
  not beside it** — a § 16 policing § 15's array separates the assertion from the thing asserted, so
  an edit to `COPIES` has no reason to look at it. Read that paragraph before you decide the shape.
- **`tools/wo-sweep.mjs`'s delegated-hook check**, whichever section number it now carries. The work
  order names it as the model already in the file: a derived census diffed against a declared
  inventory, failing in **both** directions and saying which way it went. Copy that shape rather than
  inventing one; that is the project's no-new-conventions rule applied to its own toolchain.
- **`tools/wo-sweep.mjs`'s header**, which states twice the rule the sixth Acceptance line turns into
  a test: a scan matching **zero** files is a broken scan, not a safer repository. It FAILs.
- **The count rule at `tools/wo-sweep.mjs:673`** — a recorded count is updated from a run, never by
  arithmetic. The tree that booked this row reported `21 checks · 19 passed · 0 failed · 2 to review`
  and `tools/README.md` states that figure in **three** places. If your change moves it, run the
  sweep and copy the real number into all three; do not predict it. The paragraph in the work order
  about "if that lands as a second `check()`" is explicitly *not* a prediction of the number.
- **`tools/wo-gate.mjs:1534` and `tools/codex-invoke.mjs:746`** — the two existing
  `assertOutsideRepo(` copies, and `tools/wo-gate.mjs:1706`, `tools/codex-invoke.mjs:252` and `:772`,
  the `os.tmpdir()` sandboxes they guard. These are the two facts that agree with nothing standing
  behind them.
- **`tools/verify-shell.mjs:1073`, `:1998`, `:2195` and `:22277`** — the third sandbox, the one the
  first draft of this row asserted did not exist. Read the `fs.rm(udd, { recursive: true, force: true })`
  and the `mkdtemp` above it before you write its exemption reason, because the reason **is** the
  bounded-blast-radius argument and it has to be true: a fresh unique directory, and the only `rm`
  targets that same directory. Do not guard it — see Out of scope; the owner ruled on this directly.

**Two mechanical hazards specific to this row, both from its Traps:**

- Your mutations **write `.mjs` files into `tools/`**, which is the one directory the guard under
  examination exists to keep temporary files out of. So the hash-and-revert discipline applies to the
  **directory listing**, not only to file contents: take the listing and `git status --short` before
  the first mutation, delete every scratch file in a `finally`, and prove byte-identical either side
  rather than reporting it.
- The sweep will **match its own scan** if the pattern is loose. This file will now carry the string
  `assertOutsideRepo` in § 15's prose *and* inside the regex looking for it. § 15's existing
  `/^function\s+assertOutsideRepo\s*\(/` is anchored for exactly this reason. Stay anchored, and
  prove it by **running** the sweep, not by reading the regex.

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

## 5. Done means these 8 lines, reported against one by one

1. On the unmutated tree every file the scan finds is classified by one list or the other, and the proof line **names the files** rather than reporting a count — a bare `3 of 3` is the same trust this row exists to remove. `tools/verify-shell.mjs` appears as exempt, with its reason, and the run is green.
2. Deleting `tools/verify-shell.mjs` from the exempt list turns the sweep **red**, naming it as an unclassified temp-dir user. This is the one check that proves the exemption is a decision the sweep enforces rather than a comment somebody wrote — and it is the same direction as the `COPIES` line below, for the same reason.
3. A **new** `tools/*.mjs` carrying a top-level `function assertOutsideRepo(` turns the sweep **red**, names the file, and says it is unwatched. The scratch file is deleted in a `finally`, `git status --short` is byte-identical either side, and the revert is proved rather than reported.
4. A **new** `tools/*.mjs` that makes a `mkdtempSync` sandbox and carries **no guard at all** turns the sweep red on the second signal — unclassified, not exempt. This is the case the name scan cannot see and the reason there are two signals; a row that ships one has not built this check. Same revert discipline.
5. Deleting `'tools/codex-invoke.mjs'` from the declared list turns the sweep red rather than green. Reverted and proved the same way.
6. The scan matching **zero** files FAILs, shown rather than asserted.
7. On the unmutated tree: `node tools/wo-sweep.mjs` green with its count matching `tools/README.md` everywhere that file states one, `wo-gate.mjs --self-check` still `PASS | 17 of 17 plants were caught`, `--audit` still PASS.
8. `git diff --stat -- src/` is empty.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

