# WO-1.45 — a green run cannot say whether the containment is still there · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.45-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus**, on the work order's own merits: its first Trap is a judgment call — decide
whether you are building a tripwire or a stronger structural assertion, and say which in words that
cannot be misread — and the second Acceptance line is prose in `tools/README.md` that a later reader
will trust. The runner-up was Codex (Size S, grep half only, one mutation, mechanically checkable red),
set aside because the spec asks the implementer to decide what the check *is*, not to implement one
already specified. The running-order row marks this 🎒 (rides with WO-1.43); it was taken by name.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.45 — a green run cannot say whether the containment is still there

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-24 · **Size** S · **Depends on** WO-1.44 ✅ · **Blocks** nothing;
it protects every reading of `verify-shell.mjs` after it
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.44
made. Booked 2026-08-31, owner-directed, on WO-1.44's verifier's first proposal.)*

**Why it exists.** WO-1.44 put a throwing section inside `runSection()` so one bad selector costs its
own section rather than the 766 checks after it. **Nothing asserts that it is still wired in.**
`grep -rn runSection tools/wo-sweep.mjs` returns nothing today. Restore the bare
`for (const s of BROWSER_SECTIONS) await s.run(h)` and the harness prints `1284 · 1284 · 0 · 0`, the
sweep stays green, and **every tracker in the repository agrees that nothing is wrong** — because a
green run is exactly what a healthy harness and an uncontained one both produce. The containment is
only visible when something throws, which is the one condition nobody runs on purpose.

**This is the third instance of one shape in four days**, and that is the argument for spending an
hour on it rather than trusting the prose. WO-1.40 found a hand-typed count nothing checked; WO-1.42
fenced the sweep's own count against `results.length`; this is the same defect one level out — **the
instrument that contains failures is itself contained by nothing.** The prose defending it is good
and it is still prose: `tools/verify-shell.mjs:43-61`, `CLAUDE.md`, `AGENTS.md` and the changelog all
describe the containment, and not one of them fails a build.

**Traps**

- **A grep for `runSection(` is a tripwire, not a proof — decide which you are building and say so.**
  It catches the call being deleted. It catches **nothing** about whether the containment inside it
  still works: a `runSection()` that swallowed the throw, or lost the section from the count, or
  stopped naming the lost checks, passes that grep wearing a green summary. **The failure mode here
  is a check that reads like a guarantee and is a smoke alarm.** Either accept that in as many words
  — in the section comment and in `tools/README.md`, so the next reader is not misled by their own
  tool — or assert something stronger. Do not ship the weak version described as the strong one.
- **Do not make this a second harness.** The thing that would actually prove containment is a run
  with a planted throw, and that is `verify-shell.mjs`'s job and takes 432 seconds. `wo-sweep.mjs` is
  the grep half by construction (`plans/verification-tooling.md`), and a section here that shells out
  to a browser has crossed the line the two tools exist either side of.
- **Red, not `REVIEW`.** A missing containment is settled arithmetic, not a reading — the same call
  WO-1.42's § 22 made, and § 21's split is the model for when the other answer is right.
- **This adds a check, so it moves the count.** `tools/README.md`'s number is fenced by § 22 as of
  WO-1.42: change that one number and change nothing inside the tool. The sweep will tell you.

**Acceptance**
- [ ] `wo-sweep.mjs` goes **red** when `verify-shell.mjs` no longer routes `BROWSER_SECTIONS` through
      `runSection()` — driven against a planted restoration of the bare loop, reverted after.
- [ ] What the check does **not** prove is written down where a reader of a green run will meet it —
      in the section comment and in `tools/README.md` — in terms specific enough that nobody reads it
      as proof the containment works.
- [ ] The check stays inside the grep half: no browser, no `verify-shell.mjs` invocation, no section
      that cannot answer from the file's text.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree, with the count in
      `tools/README.md` moved to match.

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

**Orchestrator's notes — the traps a cold reader would not guess.**

- **The target is `tools/verify-shell.mjs` lines ~420–455 (`runSection()` and the STATIC loop) and
  ~880–900 (the BROWSER loop + `recoverPage()`)** — read them before choosing. Both halves route
  through `runSection()` today; decide whether your check covers the static loop too and say so.
- **Placement: the new section goes ABOVE § 22.** § 22's census must be the last result-pushing call
  site in `wo-sweep.mjs` and goes red otherwise. § 23 (WO-1.48) is the precedent for sitting above it
  without renumbering § 22 — read its placement comment (~line 2636) and follow it. Pick the next
  free section number by reading the file, not from this brief.
- **"Stronger" is available inside the grep half, and it is still not proof.** The file's text can
  answer more than "is `runSection(` called": e.g. that no bare `s.run(h)` / `.run(h)` call exists
  outside `runSection`'s body, that the body wraps `s.run(h)` in `try`, and that its `catch` records a
  `false` result before returning. Whatever you assert, the section comment and the README must name
  what it cannot see — a catch that records the wrong count, a `recover` that lies, a throw that never
  reaches the catch — so nobody reads green as "containment works". Only a planted-throw run of
  `verify-shell.mjs` proves that, and that stays out of this tool.
- **Do not edit `tools/verify-shell.mjs` unless you must.** Its line numbers are cited in the work
  order, and `wo-sweep.mjs` § 11 counts the literal string `check(` across it (see the comment inside
  `runSection()` about plurals) — a prose `check(` there moves a recorded count. If you leave it
  untouched, a `verify-shell.mjs` run is not required by this Acceptance; say in the result that you
  did not run it and why.
- **The count.** Adding a check moves `tools/README.md` row `wo-sweep.mjs` ("The verifier's N-check
  standing sweep"). Change that one number and nothing inside the tool; § 22 tells you the right one.
  If that row's long prose enumerates sections by number, add yours in the same voice.
- **Mutation discipline (Acceptance line 1).** Plant the bare loop in `verify-shell.mjs`, mark the
  planted line with the word `MUTATION`, run the sweep, see red at your section, then **revert before
  writing anything else** (`AGENTS.md` § "If you were dispatched with a work order"). Revert with an
  exact Edit, not `git checkout` — `git checkout` also discards any unstaged edit of yours in that
  file. Finish with `grep -rn MUTATION tools/ src/ index.html` returning nothing new and
  `git diff --stat tools/verify-shell.mjs` empty. If you try more than one mutation (e.g. a
  `runSection` whose catch swallows), record each and what it turned.
- **Never `sed -i` this repo's prose**, and check `git diff --stat` for line-ending churn before
  you report — both files are LF, long-line UTF-8.
- **Tick as you go** (ROUTING § "Implementers may tick"), only lines whose evidence is a command you
  ran. There are no 👤 or 📆 lines here. Do not touch `CHANGELOG.md`; draft an entry in your result.

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

## 5. Done means these 4 lines, reported against one by one

1. `wo-sweep.mjs` goes **red** when `verify-shell.mjs` no longer routes `BROWSER_SECTIONS` through `runSection()` — driven against a planted restoration of the bare loop, reverted after.
2. What the check does **not** prove is written down where a reader of a green run will meet it — in the section comment and in `tools/README.md` — in terms specific enough that nobody reads it as proof the containment works.
3. The check stays inside the grep half: no browser, no `verify-shell.mjs` invocation, no section that cannot answer from the file's text.
4. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree, with the count in `tools/README.md` moved to match.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

