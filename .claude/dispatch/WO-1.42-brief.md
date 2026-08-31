# WO-1.42 — the sweep's own check count is maintained by hand · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.42-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude **Opus**, on its own merits: this edits `tools/wo-sweep.mjs`, the
instrument every later verification is read through, and all four Traps are judgment traps rather
than mechanics — the obvious implementation (a second literal total) is the one thing the work order
forbids. The runner-up was Codex, which the rubric's Codex column otherwise fits (no UI, no sensitive
app surface, mechanically checkable Acceptance, a harness fast enough for any budget); set aside
because a wrong edit here degrades every later sweep silently and the value of the row is in *not*
adding the tempting literal.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.42 — the sweep's own check count is maintained by hand

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-31 · **Size** S · **Depends on** WO-1.40 ✅ · **Blocks** nothing;
it protects every reading of the sweep after it
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.41
made. Booked 2026-08-30, owner-directed, on WO-1.40's verifier's proposal.)*

**Why it exists.** `tools/README.md` records how many checks `wo-sweep.mjs` runs, and **a person
types that number.** WO-1.40's verification found it reading **33 against a tool that ran 34** — the
count was already stale by one *before* WO-1.40 touched it, and nothing in the repository could say
so. The work order's own Acceptance line 5 asked for the count to go up by the number of new checks,
which is a real property to want and was settled by hand: `git show HEAD:tools/wo-sweep.mjs` run out
of a temp copy, compared against the working tree.

**A stale count in `tools/README.md` is not a cosmetic defect here — it is a known tell.** It is what
betrayed the dead dispatch on WO-3.26 and again on WO-4.4, where `plans/dispatch-retro.md` calls it
*"the same stale-count tell … and the cheapest single thing to look at."* A tell only works while the
number is otherwise maintained. One that drifts on its own is a tell that has quietly stopped
reporting, and the recovery procedure in `AGENTS.md` still sends readers to look at it.

**This is § 11's census turned on the sweep itself.** § 11 already holds documented figures against
what the tree actually contains; the sweep's own count is the one figure of that kind that nothing
audits, which is the WO-1.40 shape one more level in: *the instrument that checks the documentation
is documented by hand.*

**Traps**

- **Assert against `results.length` at runtime — never against a second hard-coded number.** A
  literal in the check that must be edited whenever the count changes is one more hand-maintained
  figure claiming to police a hand-maintained figure, and it fails in exactly the same way, silently
  and a build later. The tool already knows how many checks it ran. Ask it.
- **Mind the ordering problem this creates.** The census runs *inside* the sweep, so the number it
  must compare against is not final until every section has run. Where the assertion is emitted
  matters, and a check that reads `results.length` too early reports its own position rather than
  the total.
- **The failure state is a person's, not a grep's — but the comparison is a grep's.** A drifted count
  is settled arithmetic and should go **red**, not `REVIEW`; § 21's split is the model, and this half
  is the mechanical one.
- **Do not widen this into a general "every number in `tools/README.md`" census.** That is a
  different work order with a different argument, and the value here is that one specific number is
  load-bearing for a recovery procedure.

**Acceptance**
- [ ] The check count recorded in `tools/README.md` is asserted against `wo-sweep.mjs`'s own
      `results.length` at runtime, and a wrong number goes **red** — driven against a planted wrong
      count, not asserted in a comment.
- [ ] No second hard-coded total exists anywhere in the check; editing the sweep's real count is the
      only edit a maintainer makes.
- [ ] The assertion reads the total after every section has run, proved by a fixture that would catch
      an early read.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/dispatch-retro.md`
  - `tools/README.md`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Read these before writing:

- **`tools/wo-sweep.mjs` § 11** (from the banner `11. the harness's own size is written down`) —
  the census this work order turns on the sweep itself. It is the convention to match: a long
  reasoned banner comment stating what is asserted and what deliberately is not, the number read out
  of `tools/README.md` **by its sentence rather than a marker comment**, and a loud red rather than a
  quiet pass when the sentence is reworded. Match that shape and that voice.
- **`tools/README.md` lines 1–23** — the table row for `wo-sweep.mjs` carrying `38-check`, and the
  italic paragraph under the table that says in the present tense that nothing checks it. That
  paragraph is **made false by this work order** and is yours to repair in the same sitting, in this
  repo's idiom (the existing text already points at § 11 as the thing that checks the *other* count).
  Repair it; do not delete the history it records.
- **`tools/wo-sweep.mjs` lines 41–48 and the summary block at the foot of the file** — `results`,
  `check()`, `review()`, and the `${results.length} checks · …` line. This is where the ordering trap
  lives: the total is not final until every section has run, and a check that reads `results.length`
  from inside its own section reports its own position.
- **`plans/dispatch-retro.md`** — § WO-3.26 and the WO-4.4 entry, for why a stale count is a *tell* a
  recovery procedure depends on rather than a cosmetic defect.

Two things about the work, not the reading:

- The new check is itself a check, so it changes the number it asserts. Say what the maintainer's
  one edit is, in the code, where they will be standing when they need to know.
- Every Acceptance line here says **driven**, not reasoned: plant a wrong count and read the red,
  plant the early-read condition and read the red, then put the tree back. State in the result file
  what you planted, what the output said, and that the tree was restored — and revert every mutation
  before you write a line of prose.

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

1. The check count recorded in `tools/README.md` is asserted against `wo-sweep.mjs`'s own `results.length` at runtime, and a wrong number goes **red** — driven against a planted wrong count, not asserted in a comment.
2. No second hard-coded total exists anywhere in the check; editing the sweep's real count is the only edit a maintainer makes.
3. The assertion reads the total after every section has run, proved by a fixture that would catch an early read.
4. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

