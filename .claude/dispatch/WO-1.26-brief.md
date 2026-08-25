# WO-1.26 — verify-shell.mjs is 32,000 lines and most runs never see it green · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.26-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude Opus. The deciding signal is `Size L` — an explicit Claude-column
trigger — compounded by the fact that this work order *establishes the convention every future
harness edit copies*, and its Traps are judgment rather than mechanics ("do not reach for a runner
that discovers files" is a rule a model optimizing for clean code will undo). The runner-up I set
aside: the Acceptance is unusually mechanical for a Claude row — an identical check count is a
number, not a taste — which reads Codex-shaped. The proof budget settles it independently: ~4.4 min
a harness run against a 20-minute `INVOKE_TIMEOUT_MS`, and this work order's own Traps demand a run
per moved section across 31 sections.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.26 — verify-shell.mjs is 32,000 lines and most runs never see it green

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-25 · **Size** L · **Depends on** — · **Blocks** nothing by name,
and every future harness edit by weight
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the harness is not a promise the roadmap
makes, the way WO-2.14 and WO-2.15 are not. Booked 2026-08-24, owner-directed, out of a token audit
of 412 dispatch transcripts.)*

**Why it exists.** `tools/verify-shell.mjs` is **32,218 lines** — about three quarters the size of
everything ever added under `src/`. It has grown one WO-labelled section at a time, 31 of them, and
nothing has ever taken anything out. Two costs, both measured across every dispatch this repository
has run.

**Agents no longer read it; they navigate it.** Implementers made **616 `Edit`/`Write` calls** against
this one file and **511 shell-outs to read it** — `sed -n '13206,13222p'`, `grep -n` for a helper's
definition, thirty-line windows hunting for where a check belongs. Verifiers read it another 257
times. That is turns spent on address arithmetic inside a file, and it is the largest single
mechanical drag in the implementer profile.

**And most runs cannot confirm it is green.** It was executed 552 times by implementers and 262 by
verifiers, but only **59 of 142 implementer runs and 48 of 147 verifier runs ever saw a
`0 failed` summary line**. The rest reported on a harness they had run in fragments — filtered
through `grep`, or interrupted. **A green harness closes no 👤 item** is already the rule; this is
the quieter half of the same problem, where a run cannot even establish the green.

**This is not a request to add a test framework.** The suite rule stands — no dependencies, no
linter, no test framework, no `package.json`. The output contract does not change either: one
process, one summary line, one exit code. What changes is that the checks stop living in one file.

**Traps**

- **The check count is the contract, and it must not move.** `verify-shell.mjs` prints
  `N checks · N passed · 0 failed · 0 skipped` and `wo-sweep.mjs` prints its own; `tools/README.md`
  carries a `check()` count that has already turned the sweep red once when it went stale (WO-3.26's
  dead dispatch). Capture the count on the pre-split tree, and prove the post-split count is
  **identical**. A split that silently drops a section reads as a pass.
- **A skipped check is the failure mode this hides.** WO-2.54's verifier caught that a guarded
  section would have turned sixteen checks into one green-looking `skip(...)`. `grep -c "^SKIP"`
  must be **0** before and after, and the split must not introduce a new reason to skip — a module
  that fails to load is not a section that skipped.
- **Do not reach for a runner that discovers files.** Globbing a directory makes the check count
  depend on what is on disk, which is exactly the property that lets a section vanish quietly. An
  explicit import list in the entry file is longer and is the point: adding a section is a visible
  diff in one place.
- **One browser, one server, one document.** The sections share a CDP connection, a local HTTPS
  server and a seeded document. Splitting the file must not split those — a per-module browser
  launch turns a 380-second run into something nobody waits for, and the sections are not
  independent of each other's fixture state everywhere.
- **`plans/verification-tooling.md` holds the reasoning for the retired line cap** and for reporting
  lines-per-check beside the count. Both survive the split and both need a home in the new shape.
- **This one is time-boxed, and the box is a real one.** It is rowed for **Aug 27–31**, after WO-4.3
  and before the term opens on Sep 2, and the owner's instruction is to **hard-stop on the 31st and
  revert rather than carry a half-split harness into a live classroom.** So work in whole sections:
  move one, run the harness, confirm the count, commit. A tree that is twelve sections into a
  thirty-one section move is a tree that reverts cleanly at any point; one mid-section is not. **Do
  not begin a section you cannot finish and verify in the same sitting**, and never leave the entry
  file importing a module that does not exist yet.

**Deliverables**

- **`tools/verify-shell.mjs` becomes a thin entry**: argument handling, the server, the browser, the
  seeded document, the shared helpers (`check`, `skip`, `evalJs`, `has`, `clickSel`), an explicit
  ordered import list, and the summary line. Nothing else.
- **The 31 WO-labelled sections move into `tools/verify/` as modules**, each exporting one async
  function taking the shared harness object. Group by surface rather than by work order where two
  sections drive the same screen — the file name should say what a reader is looking for.
- **The summary line, the exit code, the lines-per-check report and the `SKIP` accounting are
  unchanged**, and `tools/README.md` § "Driving a browser over CDP" is updated to describe where a
  new check now goes — that section is the one both agents are told to read first.
- **`tools/README.md`'s `check()` count is recomputed** and the command that recomputes it is named
  beside the number, so the next split-adjacent edit does not leave it stale the way WO-3.26 did.
- **A note in `plans/verification-tooling.md`** recording the split, the before/after counts, and the
  measured reason — the 616 edits and the 42% of runs that never saw a green summary.

**Acceptance**
- [ ] `node tools/verify-shell.mjs` on the post-split tree reports **the same check count** as the
      pre-split tree, `0 failed`, `0 skipped`, and exits 0. Both numbers quoted in the result file.
- [ ] `grep -c "^SKIP"` on the post-split output is `0`, and no module fails to import.
- [ ] `node tools/wo-sweep.mjs` passes with no new REVIEW line, and `tools/README.md`'s `check()`
      count matches what the harness actually reports.
- [ ] No file under `tools/` exceeds 4,000 lines, and `tools/verify-shell.mjs` itself is under 800.
- [ ] The repository still has **no dependencies, no `package.json`, no linter and no test
      framework**, and every new file is a `.mjs` run by bare Node.
- [ ] Adding a check is a one-file diff: `tools/README.md` says which file, and the entry file's
      import list is the only shared thing a new section touches.
- [ ] The run time is within 15% of the pre-split run, measured the same way on the same machine —
      one browser and one server, not one per module.

**Not in scope, and each is a decision rather than an omission.**
- **No new checks, and no deleted ones.** This work order moves code and proves the count did not
  change. A section that looks wrong on the way past gets a note in the result file, not an edit —
  a behaviour change hidden inside a 32,000-line move is unreviewable.
- **`tools/wo-sweep.mjs` is not split.** It is 1,967 lines and nobody navigates it by line number.
- **No change to what `verify-shell.mjs` can settle.** It still drives a page and not an installed
  app, it has still never seen a service worker, and **a green harness still closes no 👤 item.**

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/verification-tooling.md`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Four things found before dispatch. Each is a constraint you would otherwise pay to discover.**

1. **The pre-split baseline was measured for you, on this tree, clean, immediately before you were
   spawned.** Full output at
   `C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\aeb07521-dc7e-4728-babd-dd945a5d6296\scratchpad\baseline.txt`.

   ```
   1156 checks · 1156 passed · 0 failed · 0 skipped
   32,853 lines · 28.4 lines per check · 394s      (exit 0)
   ```

   **1156 is the contract.** The post-split run reports 1156 or the split dropped something.
   Quote both numbers in your result file. The 15% run-time band on Acceptance line 7 is
   **335s–453s**, measured the same way on this machine. Note the gap the sweep already names:
   `tools/README.md` records **1141 `check()` call sites**, which is a count of calls, not of
   executed checks — 1156 is the executed count and the difference is `check()` inside loops. Do
   not "reconcile" them into one number.

2. **The 31 sections are not functions.** `verify-shell.mjs` is a flat top-level script: sections
   are delimited only by banner comments, and everything inside them is module-scope `const` and
   bare top-level `await`. So "each exporting one async function taking the shared harness object"
   is a real refactor per section, not a cut-and-paste — every name a section declares becomes a
   local, and any name a *later* section reads has to be passed on the harness object or re-derived.
   `nodeToday` is the known one and has moved three times for exactly this reason (its own comments
   at `tools/verify-shell.mjs:7310` and `:9088`). Grep forward for every identifier a section
   declares before you move it.

3. **`wo-sweep.mjs` will go red on a correct split, and fixing that is in scope.** Its check-count
   census greps `tools/verify-shell.mjs` **and only that path** for `check()` call sites. Move the
   sites to `tools/verify/` and it reports *"no `check()` call site found in tools/verify-shell.mjs
   at all — the pattern has stopped matching, which reads green from a distance and is not"* — its
   own words. Acceptance line 3 requires the sweep to pass with no new REVIEW line, so widen that
   census to the new file set and keep its one-call-per-line companion check pointed at the same
   set. Its sibling census at `wo-sweep.mjs:1109` scans `tools/*.mjs` non-recursively and so will
   not see `tools/verify/` — decide deliberately whether that is correct and say which you chose.

4. **`ownLines` measures the wrong file the moment you split it.** The summary reads its own source
   off disk for the lines-per-check figure. After the split that is ~800 lines over ~1,141 checks,
   which is not a smaller number, it is a false one. The deliverable says that report is unchanged:
   sum the entry file and every module.

**Work in whole sections and commit per section** — the work order's time-box trap is the binding
constraint here, and a tree mid-section does not revert cleanly. Never leave the entry file
importing a module that does not exist.

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

## 5. Done means these 7 lines, reported against one by one

1. `node tools/verify-shell.mjs` on the post-split tree reports **the same check count** as the pre-split tree, `0 failed`, `0 skipped`, and exits 0. Both numbers quoted in the result file.
2. `grep -c "^SKIP"` on the post-split output is `0`, and no module fails to import.
3. `node tools/wo-sweep.mjs` passes with no new REVIEW line, and `tools/README.md`'s `check()` count matches what the harness actually reports.
4. No file under `tools/` exceeds 4,000 lines, and `tools/verify-shell.mjs` itself is under 800.
5. The repository still has **no dependencies, no `package.json`, no linter and no test framework**, and every new file is a `.mjs` run by bare Node.
6. Adding a check is a one-file diff: `tools/README.md` says which file, and the entry file's import list is the only shared thing a new section touches.
7. The run time is within 15% of the pre-split run, measured the same way on the same machine — one browser and one server, not one per module.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

