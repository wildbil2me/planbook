# WO-2.22 — a missing harness is a failure, and one call per line stops being an assumption · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.22-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routed to **Claude at Opus**, on its own merits rather than by fallback.
The deciding signal: two of the four Deliverables are prose that must *reconstruct an argument* —
why `wo-sweep.mjs`'s own count is deliberately unguarded, and why `verify-shell.mjs` must not assert
its own summary — and the Traps section is a judgment trap of exactly the shape `ROUTING.md` names
("Do not switch §11 to counting occurrences per line. It looks like the fix and it is the wrong
one"). The runner-up I set aside: the code half is small, bounded and mechanically checkable, which
is textbook Codex — but the Out of scope line refuses an obvious eight-line follow-up on reasoning a
completeness-seeking runner would override, and ties go to Claude.

---

## 0. Standing constraint for this dispatch — evidence goes BESIDE an Acceptance line, never INTO it

**This is the owner's ruling for this dispatch and it outranks your judgment about what would be
tidier.** Read it before you read the work order.

An implementer reports evidence **beside** an Acceptance line, never **into** it. Measured counts,
mutation results, and failure text go in `TESTING.md` and `tools/README.md` — **not** into the
wording of an Acceptance criterion. An Acceptance line's own words change only by the owner's
ruling, and any amendment must say on its face that it happened and why.

**The scar:** WO-3.12 folded its measured counts into five Acceptance lines it was being judged
against — an implementer editing the bar it is graded on. Do not repeat that.

Concretely, for this dispatch:

- **You may not edit the text of any Acceptance criterion** in the work order to record what you
  measured, observed, or fixed. Ticking the box `- [ ]` → `- [x]` is still allowed and still expected
  where you have the evidence; changing the *words on the line* is not.
- **If you believe an Acceptance line is wrong, unmeasurable, or stale, stop and report it as a
  needs-a-human item with your reasoning.** Do not rewrite the line. This applies with particular
  force to Acceptance line 2, which carries stale figures (`560` against a premise of `561`) that the
  line itself tells you not to carry in — those numbers being stale is *expected and by design*, and
  is not license to correct them.
- **All evidence — counts, mutation-test results, failure output, tool runs — lands in `TESTING.md`
  and/or `tools/README.md`**, with a pointer back to the criterion it satisfies.
- The verifier has been told to check that no Acceptance line's wording was altered, and to flag any
  that were.

Note the asymmetry that makes this coherent: the **Why it exists** paragraph in this work order was
already refreshed by the owner on 2026-08-11 and says so on its face (*"(Refreshed 2026-08-11, from a
run.)"*). That is what an authorized amendment looks like. Prose *about* the work order is the
owner's to refresh; the bar you are graded against is not yours to move.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.22 — a missing harness is a failure, and one call per line stops being an assumption

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-11 · **Size** S · **Depends on** WO-2.19 — this is §11 of
`tools/wo-sweep.mjs`, which that work order wrote · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15, WO-2.18, WO-2.19,
WO-2.20 and WO-2.21 made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-10 out of WO-2.19's verification, where both
halves were raised as residuals and deliberately not folded into a work order that had already passed
— the same call WO-2.21 got out of WO-3.5. Neither is a defect in what WO-2.19 shipped; both are
places where §11 is right today for a reason it does not check.

**Why it exists — two things, and the first is a severity, not a bug.** §11 has three ways to be
unhappy and they are not ranked the way the failures are. A `tools/README.md` whose sentence has been
*reworded* is a `FAIL` at `tools/wo-sweep.mjs:644`. A `tools/verify-shell.mjs` that has been
*deleted* is a `REVIEW` at `:613` — it prints, it does not fail, and the run exits 0. **The larger
disaster is the quieter signal.** This file's own header defines `REVIEW` as *"greppable evidence that
needs a human decision"*, and a vanished harness is not a decision anybody is being asked to make; it
is the one condition under which every claim this sweep makes about the harness is void. It also
inverts the section's own logic: `:634` fails loudly when the *pattern* stops matching, on the
explicit reasoning that a green run over an empty grep "reads green from a distance and is not". A
missing file is that same shape, one step further along.

**The second is a premise the check relies on and does not state.** §11 pushes one entry per *line*
that holds a `check(` call (`:620–623`), so its count is a count of lines. That equals the count of
calls only while no line holds two, which is true of all **596** call sites in the harness today and
is nowhere written down.

**That 596 was 561 when this work order was written on 2026-08-10, and it is re-measured here rather
than carried forward** — WO-3.5, WO-2.21 and WO-3.12 have all added checks since. The premise is
unchanged and so is every line citation above, which is the point: it is the *count* that rots, which
is the whole reason §11 exists. **Measure it again at the start of the work rather than trusting this
sentence** — `node tools/wo-sweep.mjs` prints the true figure in a second, and `tools/README.md:636`
records it. *(Refreshed 2026-08-11, from a run.)* A second call appended to a line already holding one would be invisible: the
count would not move, §11 would pass, and the number in `tools/README.md` would be quietly wrong —
which is precisely the failure WO-2.19 exists to prevent, arriving through the one door that work
order left open.

**Deliverables**
- **A missing `tools/verify-shell.mjs` or `tools/README.md` is a `FAIL`, not a `REVIEW`.** Both, not
  just the harness: neither absence leaves a question for a human.
- **§11 asserts that no line in the harness holds more than one `check(` occurrence**, so
  lines-equals-calls becomes a check rather than a premise. The message names the offending line.
- **The allowlist paragraph at `:592` records that the count is a count of lines** and points at the
  new clause as what makes that safe, in the form the rest of that paragraph already uses.
- **`tools/README.md`'s `wo-sweep.mjs` is **16 checks** sentence carries a note saying why that number
  is deliberately unguarded** — the sweep prints its own true count on every run, in a second, where
  a reader will see it, which is the asymmetry that made WO-2.19 worth doing for the harness and not
  worth doing here. Nobody should have to re-derive that.

**Out of scope, and this is the load-bearing half of the work order: `verify-shell.mjs` does not
assert its own summary against `tools/README.md`.** WO-2.19's implementer proposed it as the obvious
follow-up — eight lines, and the executed count is the one number in this system that nothing
watches. It is refused on two grounds, recorded here so the next reader who notices an unguarded
number does not re-propose it. **First, a red `verify-shell.mjs` run means the app is broken**, and in
week one of a live term that signal has to stay clean enough to drop everything for; making it also
mean "a sentence in a README is stale" spends the one alarm that must not be second-guessed.
**Second, the hole is already mostly closed, sideways.** §11's `FAIL` text at `:647` says in as many
words: *update that line, **and the executed-check count in the paragraph beside it**, from a run
rather than by arithmetic.* Every event that makes the executed count stale — a check added, a check
removed — now trips §11 and hands the reader both numbers. What remains is somebody editing the
executed count wrongly while touching no check at all, which is not the failure that happened three
times. Also out of scope: any change to what `verify-shell.mjs` prints or how it counts, and anything
in `src/`.

**Acceptance**
- [ ] `node tools/wo-sweep.mjs` FAILs and exits 1 with `tools/verify-shell.mjs` moved aside, and again
      with `tools/README.md` moved aside — both run, both outputs quoted, both reverted.
- [ ] §11 FAILs when a second `check()` call is appended to a line that already holds one, naming the
      line. **Proved non-vacuous by the count clause passing in that same run** — appending adds no
      new line, so the line count is unchanged, the old clause is satisfied, and the new one is the
      only thing red. **Quote that count from the run.** The figure here was `560` against a premise
      of `561` when this was written, which is a relationship an append cannot produce; do not carry
      either number in, and do not derive one by arithmetic — the Traps below say why. Reverted.
- [ ] `tools/README.md` states why `wo-sweep.mjs`'s own count is left unguarded, and states that §11
      counts lines and what now guarantees that is a count of calls.
- [ ] `tools/README.md` records why `verify-shell.mjs` does not assert its own summary, in enough
      detail that the argument does not have to be rebuilt.
- [ ] `node tools/wo-sweep.mjs` otherwise prints what it printed before: §11 still PASSes at the true
      call-site count, no new REVIEW, and the standing sensitive-field-name REVIEW unchanged — proved
      by diffing a whole run before and against after.
- [ ] `tools/verify-shell.mjs` and `src/` are byte-identical to HEAD by hash. **A full harness run is
      not required and should not be spent**: nothing in this work order touches `src/`, `index.html`,
      `sw.js` or the harness itself except inside a mutation that is reverted, and 177 seconds buys no
      claim that the hash does not already make.

**Traps** — **Do not switch §11 to counting occurrences per line.** It looks like the fix and it is
the wrong one: `check(` appears in trailing comments and in the harness's own quoted prose, and
`commentLines()` excludes whole comment lines rather than trailing ones, so occurrence counting trades
a hypothetical undercount for a plausible overcount and a false `FAIL`. The premise is the thing to
check; the counting is already correct. **Do not update `16 checks` → `17 checks` by arithmetic** —
this work order adds exactly one check and the temptation to increment is the ritual that has failed
three times in the sibling file. Measure it from a run and quote the summary line. **And do not build
the self-assertion**, however small it looks by then; the argument against it is above, and a work
order that quietly does its own Out of scope line is worse than one that argues with it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these — they are what make this work order startable cold:

- **`tools/wo-sweep.mjs` §11 itself**, and the line citations the work order makes: `:592` (the
  allowlist paragraph you must extend), `:613` (the `REVIEW` for a missing `verify-shell.mjs` that
  must become a `FAIL`), `:620–623` (the one-entry-per-line push that makes the count a count of
  lines), `:634` (the loud failure when the pattern stops matching — the precedent your severity
  change follows), `:644` and `:647` (the reworded-sentence `FAIL` and its text). **Verify each
  citation against the file rather than trusting it** — `plans/work-orders/README.md` § "Citing code"
  records that line numbers drift, and WO-2.23's own parenthetical documents three that had drifted
  by the time it closed. If one has moved, use the symbol and say so in your report.
- **The `wo-sweep.mjs` file header**, which defines `REVIEW` as *"greppable evidence that needs a
  human decision"*. That definition is the entire argument for the severity change; quote it back
  when you make the change so the reasoning travels with the code.
- **WO-2.19's own section** in `plans/work-orders/phase-2-attendance.md` — it wrote §11, and this
  work order is a follow-up to its verification. Its Acceptance list is the model for what
  "both outputs quoted, both reverted" looks like when done properly.
- **WO-2.21's section in `TESTING.md`** — the most recent example of the tabulation form this
  project uses for mutation evidence (plant, observe red, revert, tabulate). Acceptance lines 1, 2
  and 5 all produce evidence of exactly that shape, and per § 0 above that evidence belongs there.
- **`tools/README.md` around the `wo-sweep.mjs` is **16 checks** sentence and the recorded call-site
  count** (the work order cites `:636`, subject to the same drift caveat). Both prose deliverables
  land here.

**Two orchestrator notes on scope, so you are not caught between the template and the work order:**

1. **§ 4 below is boilerplate that this work order overrides.** Acceptance line 6 says in as many
   words that a full `verify-shell.mjs` run *"is not required and should not be spent"* — 177
   seconds buying no claim the hash does not already make. **Follow the work order, not § 4.** Run
   `node tools/wo-sweep.mjs` (which is fast, and is the thing you are changing); satisfy the
   `verify-shell.mjs` half of line 6 by **hash against HEAD**, not by running it. If you conclude the
   harness genuinely must run, say why in your report rather than spending it silently.
2. **The Out of scope line is load-bearing and is the single most likely way this dispatch fails.**
   By the time you have §11 in your head, adding eight lines so `verify-shell.mjs` asserts its own
   summary will look obviously correct and nearly free. It is refused, on two recorded grounds. Do
   not build it, do not build a smaller version of it, and do not leave a TODO proposing it — the
   work order already argues the case, and re-proposing it is the exact loop it exists to end.

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

1. `node tools/wo-sweep.mjs` FAILs and exits 1 with `tools/verify-shell.mjs` moved aside, and again with `tools/README.md` moved aside — both run, both outputs quoted, both reverted.
2. §11 FAILs when a second `check()` call is appended to a line that already holds one, naming the line. **Proved non-vacuous by the count clause passing in that same run** — appending adds no new line, so the line count is unchanged, the old clause is satisfied, and the new one is the only thing red. **Quote that count from the run.** The figure here was `560` against a premise of `561` when this was written, which is a relationship an append cannot produce; do not carry either number in, and do not derive one by arithmetic — the Traps below say why. Reverted.
3. `tools/README.md` states why `wo-sweep.mjs`'s own count is left unguarded, and states that §11 counts lines and what now guarantees that is a count of calls.
4. `tools/README.md` records why `verify-shell.mjs` does not assert its own summary, in enough detail that the argument does not have to be rebuilt.
5. `node tools/wo-sweep.mjs` otherwise prints what it printed before: §11 still PASSes at the true call-site count, no new REVIEW, and the standing sensitive-field-name REVIEW unchanged — proved by diffing a whole run before and against after.
6. `tools/verify-shell.mjs` and `src/` are byte-identical to HEAD by hash. **A full harness run is not required and should not be spent**: nothing in this work order touches `src/`, `index.html`, `sw.js` or the harness itself except inside a mutation that is reverted, and 177 seconds buys no claim that the hash does not already make.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

**And report against these six lines as they are written above.** Tick the boxes you closed; leave
the words alone. Per § 0, every number you measure — the true call-site count, the executed-check
count, the count quoted in the non-vacuity proof, the two `FAIL` outputs, the before/after run diff —
goes in `TESTING.md` and/or `tools/README.md` with a pointer back to the criterion it satisfies, and
in your result file. None of it goes into the wording of a criterion.

