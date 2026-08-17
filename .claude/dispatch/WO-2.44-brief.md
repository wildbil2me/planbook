# WO-2.44 — wo-gate's repo-write guard is case-blind to the one thing it guards · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.44-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to **Claude, at the Opus tier**, on its own merits rather than by
fallback — the deciding signal is that three of the five Acceptance lines are judgment and prose, not
code: resolving `tools/wo-sweep.mjs`'s identical `REPO` derivation *in writing* (fixed or deliberately
left, either way said out loud), recording the bug's shape **once** in `tools/README.md` rather than
twice in two scripts' comments, and the Traps' flat refusal to extract a shared helper — which is
`ROUTING.md`'s own worked example of a judgment trap a model optimizing for clean code will "tidy."
The runner-up I set aside: the code change itself is fully specified (a two-liner copied verbatim from
a sibling file) and the acceptance is mechanically checkable, which reads Codex — but the reproducer
plants deliberately corrupted tracker files and the failure mode being tested is exactly those
escaping into the live `plans/`, so ties go to Claude. WO-2.44 has no row in `ROUTING.md`'s Ship 1
pre-routing table, so there is no pre-routing to agree or disagree with.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.44 — wo-gate's repo-write guard is case-blind to the one thing it guards

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** XS · **Depends on** WO-2.40 · **Blocks** nothing
**Closes roadmap** *(no box. Dispatch tooling, not app — the same call WO-2.20, WO-2.37 and WO-2.40 made.)*

**Not a go-live blocker, and it has never fired.** Booked 2026-08-17 out of WO-2.40's dispatch, where
the implementer hit the identical bug in the guard it was writing, fixed it there, and both agents
flagged this copy independently rather than reaching into another file. **The fix is already written**;
this row is the carry.

**Why it exists.** `tools/wo-gate.mjs:1517-1523` and the pre-WO-2.40 `codex-invoke.mjs` had the same
three lines, because both derive `REPO` the same way — `path.resolve(dirname(fileURLToPath(
import.meta.url)), '..')` at `wo-gate.mjs:52`, which on win32 yields a **lowercase** drive letter,
`c:\dev\planbook`. `os.tmpdir()` through `realpathSync` yields `C:\`. So when the sandbox lands inside
the repository, `"C:\dev\planbook\…".startsWith("c:\dev\planbook\")` is `false`, and **a guard whose
only job is refusing paths inside the repository reports that a path inside the repository is outside
it.** WO-2.40 measured this rather than reasoning about it: its first cut ran all seventeen cases
happily inside `C:\dev\planbook\.guard-probe\…` and exited 0.

**Why this copy is the worse one.** `codex-invoke.mjs`'s plants are inert fixture files. This script
copies the real `plans/` tree into its sandbox (`wo-gate.mjs:1606`) and then plants **deliberately
corrupted tracker files** — a `**Closes roadmap**` fragment that closes no box, dashboard drift — so it
can prove `--audit` catches them. Land those in the real `plans/` and the corruption is
indistinguishable from tracker rot; worse, the `finally` cleanup then `rmSync`s a sandbox that overlaps
the live trackers. WO-2.15's own comment at that function calls a plant escaping into the real `plans/`
*"the worst bug this file could carry."* It is right, and the guard it wrote to prevent it does not
hold on this filesystem.

**It is latent, not live.** `TMP`/`TEMP` must point inside the repository for the sandbox to land
there, which is not the normal state on this machine — it is one scratchpad convention away from being
the normal state, and it is precisely what somebody does while testing a guard.

**Deliverables**
- **The `norm()` two-liner from `codex-invoke.mjs`'s `assertOutsideRepo()`**, applied here. Case-folded
  on win32 only, comparing both sides, still throwing the un-folded path in the message so the reader
  sees what they actually passed. **Copied, not extracted** — see Traps.
- **The guard shown firing**, the way WO-2.40 showed it: `TMP` and `TEMP` at a directory inside the
  tree, the throw quoted, and the tree proved unchanged afterwards.
- **A sentence on `tools/wo-sweep.mjs`**, which derives `REPO` identically at `:28` but only ever
  reads. Fixed or deliberately left, said out loud either way, in the same sitting.

**Out of scope** — `codex-invoke.mjs`, which already has the fix; any new `--self-check` case in
`wo-gate.mjs` (its seventeen plants are about tracker rot, and the guard is a property of the harness,
not a plant — WO-2.16's precondition reasoning); and the wider question of whether these two scripts
should share anything, which the Traps answer no.

**Acceptance**
- [ ] With `TMP` and `TEMP` pointed at a directory inside the repository, `node tools/wo-gate.mjs
      --self-check` throws from `assertOutsideRepo()` and **writes nothing** — `git status --short`
      identical before and after, and no plant anywhere under `plans/`.
- [ ] The same probe against the **unfixed** file is run and reported, so the acceptance is a
      difference rather than an assertion. If it does not reproduce, say so and stop — this row's whole
      premise is a measurement.
- [ ] With `TMP` at its normal value, `--self-check` is still `PASS | 17 of 17 plants were caught` and
      `--audit` is still PASS.
- [ ] `tools/wo-sweep.mjs`'s copy is resolved in writing, and `tools/README.md` records the shape of
      this bug once — a case-sensitive compare against a case-insensitive filesystem — rather than
      twice in two scripts' comments.
- [ ] `node tools/wo-sweep.mjs` green and `git diff --stat -- src/` empty.

**Traps** — **Run the reproducer on a clean tree, and commit first.** A plant that escapes is only
visible against a clean `git status`, and this row is the one where the escape is the thing being
tested. **Do not extract a shared helper.** No script in `tools/` imports another — checked, zero
cross-imports across twelve files — and that is the suite's no-dependencies rule reaching into its own
toolchain; three duplicated lines is the price. **The guard is silent when it works and silent when it
fails**, which is why the acceptance asserts the *absence* of writes and not the presence of a pass:
WO-2.40's first cut passed everything.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The exact sites, so none of this is hunted for.** All line numbers were resolved 2026-08-17, before
you were spawned; they move as you edit, so re-resolve anything you cite in your report.

- **`tools/codex-invoke.mjs:425-439` — the fix, already written, and the comment block that explains
  it.** `assertOutsideRepo()` there is the two-liner this row copies: a local
  `const norm = (s) => (process.platform === 'win32' ? resolve(s).toLowerCase() : resolve(s));`, both
  sides folded, and `resolve(p)` **un-folded** in the throw message and in the return. That file is
  **out of scope** — read it, do not touch it.
- **`tools/wo-gate.mjs:1516-1523` — the broken copy**, the only thing this row changes in that file.
- **`tools/wo-gate.mjs:52`** — where `REPO` is derived, and the reason the drive letter is lowercase.
- **`tools/wo-gate.mjs:832-835` — a name collision to decide about, deliberately flagged.** There is
  already a module-level `function norm(s)` in this file, and it does something completely unrelated
  (markdown fragment normalization for roadmap box matching, used by `resolveRehome()` and
  `roadmapHits()`). A local `const norm` inside `assertOutsideRepo()` shadows it correctly and
  harmlessly — that function does not use the module-level one — but a reader meeting two `norm`s in
  one file has to work that out. Copying the sibling verbatim and naming the shadow is one defensible
  answer; a distinct local name with a one-line comment pointing at `codex-invoke.mjs` as the origin
  is another. **Pick one and say in your result which and why.** What is *not* available is renaming
  or touching the module-level `norm()`, which is used in eight places and is not this row's work.
- **`tools/wo-gate.mjs:1579-1591` (`selfCheck()`) and `:1593-1612` (`runPlants()`)** — the
  `mkdtempSync(realpathSync(os.tmpdir()), …)` that produces the `C:\` half of the mismatch, the
  `finally` that `rmSync`s the sandbox, and the `cpSync` of the real `plans/` at `:1606`. Note that
  unlike `codex-invoke.mjs:462`, **the sandbox path itself is not passed through the guard here** —
  only the paths written under it are. Whether that matters once the compare is fixed is worth one
  sentence in your result; adding the call is inside this row if you judge it needed, but it is a
  judgment, not an assumption, and the Out of scope line forbids new `--self-check` *cases*, not this.
- **`tools/wo-sweep.mjs:28`** — the third identical `REPO` derivation, the one the third deliverable
  asks you to resolve in writing. It only ever reads. Read enough of the file to say whether any
  compare against `REPO` there could go wrong the same way, then fix it or leave it deliberately —
  and if you leave it, the reason goes in the file, not only in your result.
- **`tools/README.md:59-70`** is the paragraph that currently asserts *"Every plant path goes through
  a guard that refuses anything inside the repository."* That sentence is the one this bug makes
  untrue on win32, and it is the strongest candidate site for the once-only record the fourth
  Acceptance line asks for. `:119-131` and `:142-149` are WO-2.40's account of the sibling script, for
  the house style of how a proved-by-mutation gate gets written up here. Where the sentence lands is
  your call; that it lands **once**, in this file rather than duplicated into two scripts' comments,
  is the acceptance.

**On the reproducer, and this is the whole row.** Acceptance line 2 asks for the probe against the
**unfixed** file — so run it *first*, on a clean tree, and capture the output before you change
anything: the point is a measured difference, not a claim. `--self-check --against <path>` runs the
plants over a different copy of the script, but read what it actually does before assuming it gives
you the unfixed-guard probe for free — the guard runs in the *driving* script, not the subject.
`git show HEAD:tools/wo-gate.mjs` into a scratchpad file is available if you need an unfixed copy
after you have edited the real one. Point `TMP` **and** `TEMP` at a directory inside the tree, per the
Acceptance; use a path you create and can identify, and be aware that the escaping run's own `finally`
will `rmSync` whatever it made. If the bug does not reproduce, the work order says **say so and
stop** — that is a legitimate outcome and reporting it is not a failure.

**Your baseline `git status --short`, since the Traps ask for a clean tree and it is not quite one.**
At spawn the tree carried exactly two changes, both mine and both expected:

```
 M plans/work-orders/phase-2-attendance.md      <- the 🤖 CLAIMED status line, written by --start
?? .claude/dispatch/WO-2.44-brief.md            <- this file
```

Nothing else, and nothing under `src/`, `tools/` or elsewhere in `plans/`. **That two-line state is
the clean baseline the reproducer is judged against** — capture `git status --short` immediately
before the escaping probe and compare the two outputs literally, rather than asserting an empty one.
The orchestrator does not commit without the owner's say-so, which is why you are getting a named
baseline instead of a clean slate; committing is the owner's call at the end, not yours or mine.

**Scratchpad, for anything that is not a deliverable:**
`C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\5f2ed982-b110-49bf-94e4-860779c3e281\scratchpad`
— mutant copies and captured output go there, never into `tools/`. Note the irony and use it anyway:
it is outside the repo, which is the normal case this bug hides in.

**Also read:** `plans/verification-tooling.md` — the reasoning behind why a check on a script is a
flag inside that script, which is what keeps the Out of scope line's refusals coherent.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

The standing block, inlined verbatim into every brief. Most of it is about app code and this row
touches none — that is itself the check: **the last bullet and `git diff --stat -- src/` being empty
are the two that bind here.**

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

**Do not write a second harness** — if this work order needs a check neither can make, say so in your
report as a proposed follow-up, not a throwaway script.

Two orchestrator notes on that pair, because this row is dispatch tooling and not app code:

- **`wo-sweep.mjs` green is Acceptance line 5 and is required.** Run it and quote the verdict.
- **`verify-shell.mjs` has nothing to measure here.** This row changes no file it drives, and the
  Acceptance asks instead for `git diff --stat -- src/` to be **empty** — which is the same assurance
  from the other direction. It also frequently cannot run in a sandboxed dispatch at all: if you try
  it and it fails to start, that is a report about the environment and **not** a result, so say which
  of the two happened and never write it up as a pass or a fail.
- The row's real verification is the reproducer in § 2, run twice — unfixed then fixed — with
  `git status --short` captured on both sides. That is the evidence the verifier will look for.

---

## 5. Done means these 5 lines, reported against one by one

1. With `TMP` and `TEMP` pointed at a directory inside the repository, `node tools/wo-gate.mjs --self-check` throws from `assertOutsideRepo()` and **writes nothing** — `git status --short` identical before and after, and no plant anywhere under `plans/`.
2. The same probe against the **unfixed** file is run and reported, so the acceptance is a difference rather than an assertion. If it does not reproduce, say so and stop — this row's whole premise is a measurement.
3. With `TMP` at its normal value, `--self-check` is still `PASS | 17 of 17 plants were caught` and `--audit` is still PASS.
4. `tools/wo-sweep.mjs`'s copy is resolved in writing, and `tools/README.md` records the shape of this bug once — a case-sensitive compare against a case-insensitive filesystem — rather than twice in two scripts' comments.
5. `node tools/wo-sweep.mjs` green and `git diff --stat -- src/` empty.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

