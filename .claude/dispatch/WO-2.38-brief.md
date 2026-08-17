# WO-2.38 — nothing exercises the anti-vacuity guard, so it can rot behind a green run · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.38-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routes to **Claude at Opus, on its own merits**: the third Deliverable
makes you resolve the standing "do not write a second harness" rule against a check that needs no
browser, and WO-2.40 is booked to copy whichever answer you give — that is convention-setting
judgment, the Claude column's second bullet, and its Traps are judgment rather than mechanics.
The run budget was asked of the script rather than computed by hand, on the largest count the
Acceptance could mean — **19 harness runs** (one per `vacuity` arm: 8 in the scores block, 11 in the
marking block) at ~4.4 min = 83.6 min — and `node tools/codex-invoke.mjs --budget 83.6` answered
`REFUSED before dispatch`, exit 2, nothing spawned. The runner-up I set aside: the factoring itself
("the smallest change that makes the predicates callable") reads mechanical enough to be Codex-shaped,
and a budget refusal alone would send that to Sonnet — but the Claude column is read first and the
tier is never budget-driven, so Opus. **Note what that arithmetic means for you:** 83.6 min is the
cost of the design where an arm is only reachable through a whole harness run. The fourth Deliverable
says the design and the run budget are one decision — pick the in-process design and the same proof
costs seconds plus the single whole-harness run Acceptance line 4 asks for.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.38 — nothing exercises the anti-vacuity guard, so it can rot behind a green run

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** M · **Depends on** WO-2.36 · **Blocks** nothing
**Closes roadmap** *(no box. Harness, not app — the same call WO-3.12, WO-3.21, WO-3.24, WO-2.34 and
WO-2.36 made.)*

**Not a go-live blocker, and nothing here is a defect today.** Booked 2026-08-16 out of WO-2.36's
verification, which established by construction that the guard works *now*. This row is about the
day after.

**Why it exists.** WO-2.36 replaced six hardcoded floors with a `vacuity` array in each key block:
the anchors asserted found, one by one, by name. It is the right shape and it was proved by mutation.
But **on a green tree every branch of it is dead code.** `vacuity` is empty, so nothing downstream of
`if (!vacuity.length)` is ever evaluated, and no check in `verify-shell.mjs` or `wo-sweep.mjs`
reaches any of the fourteen-odd push sites. The only thing that has ever executed them is a hand
mutation, applied twice by hand on one afternoon and reverted both times.

**That is a guard whose failure mode is silence.** A refactor that renames `panelAt`, an `indexOf`
that starts returning `0` where the code tests `< 0`, a regex tightened in a way that makes one of
the `else if` arms unreachable — none of it turns anything red. The run still prints `802 · 802 · 0`
and the reader still believes both legends are policed. **This is the same class of fault the guard
was built to prevent, one level up:** WO-2.36's whole argument is that empty agrees with everything,
and a guard nobody exercises is a guard that agrees with everything too. The floors it replaced had
the identical weakness and that was not the reason they went.

**The method already exists and should not be re-derived.** WO-2.36's verification did exactly this,
in a scratchpad, and it is the shape to lift: replicate the two `check()` predicates against
**in-memory mutations of the real `index.html` and `src/shell.js`**, never against the tree itself.
It drove eight mutations that way — retire-both-sides, `MARK_KEYS` renamed, modal id renamed,
`scores-key` spans requoted, `handleScoreKey` renamed, one legend row deleted, one key removed from
the binding only, the glyph regex broken on seven of eight rows — and got the right verdict from
every one, plus a duplicated `id="scoresKeys"` and a truncated slice. **Those files are gone** (a
session scratchpad), so the work is to build that properly and commit it, not to recover them.

**Deliverables**
- **The two key blocks' reads factored so they can be driven with supplied text** rather than only
  with what is on disk — the smallest change that makes the predicates callable, not a rewrite.
- **Checks that assert each `vacuity` arm fires on the input that should trip it**, and that a
  correct retirement trips none. The mutations are named above; the set is the regression set.
- **A decision on where these live.** `verify-shell.mjs` is a browser harness and these need no
  browser, which argues for a sibling. Against that: **"Do not write a second harness" is a standing
  rule**, and a second file that drives the same predicates is exactly what it forbids. Resolve it
  explicitly and write the reasoning where the next reader meets it. `wo-gate.mjs --self-check` is
  the in-suite precedent for a tool testing itself. *(WO-2.40 proposes a `--self-check` on
  `codex-invoke.mjs` on that same precedent. Two locally-sensible answers that disagree with each
  other are worth less than one answer given twice, so whichever way this goes, say enough about why
  for the other row to follow it.)*
- **Make that decision before writing a check, because it sets what proving this costs.** Acceptance
  line 1 wants every arm of both arrays shown firing. If an arm can only be reached by a full
  `verify-shell.mjs` run, that is fourteen-odd runs at ~4.4 minutes each; if the arms are drivable in
  process, it is seconds plus the one whole-harness run line 4 asks for. **The design and the run
  budget are one decision**, and the routing arithmetic WO-2.37 put into `ROUTING.md` — harness
  runtime × runs demanded, against the Codex cap — reads whichever answer this bullet gives.
- **The call-site count in `tools/README.md` moved in step**, which this row almost certainly does
  change — unlike WO-2.36, which added none. **The baseline as WO-2.36 left it, 2026-08-16: 802 checks
  passing, 805 `check()` call sites.** `wo-sweep.mjs` asserts that number against the harness (WO-2.19),
  so a count that moves without the ledger moving turns the sweep red.

**Out of scope** — the residue WO-2.36's verification named (a `MARK_KEYS` left declared while the
listener stops testing it reads green, because `markKeys` is read file-wide); that is WO-2.35's
question of which bindings the read can see at all, and it is not made better or worse here. Also out
of scope: merging the two blocks, and any change to what either check concludes on the real tree.

**And out of scope, specifically: the four wrong `:NNN` pointers in `tools/README.md`, which WO-2.39
owns.** This row edits that file for the count and will be reading them on the way past — they miss by
roughly 3,200–3,500 lines and they were already wrong at HEAD before WO-2.36. Fixing them here means
taking a judgment call inside somebody else's commit, and one of the four (`:1869`) has no known
referent at all, which is the reason WO-2.39 is a row rather than a quiet correction. Move the count;
leave the pointers.

**Acceptance**
- [ ] Every arm of both `vacuity` arrays is shown firing on an input that should trip it, and the
      failure text names the right anchor. Run, not reasoned.
- [ ] A correct retirement — key out of the binding **and** its legend row deleted — trips no arm and
      leaves the check green, driven through the new path rather than by editing the tree.
- [ ] Deleting an arm of either `vacuity` array, or inverting one of its conditions, turns something
      red. **This is the acceptance line that matters**: a self-test that passes whether or not the
      thing it tests exists is this work order's own failure repeated inside itself.
- [ ] `node tools/verify-shell.mjs` passes whole and `git diff --stat -- src/ index.html` is empty
      across the work order.
- [ ] The check count in `tools/README.md` moved in step with whatever call sites were added.

**Traps** — **Do not test the guard by mutating the tree in a committed check.** A check that writes
to `index.html` or `src/` and reverts is one crash away from leaving the app broken, which is the
exact hazard WO-2.37 is booked over; drive supplied text instead. **Do not let the replica drift from
the predicate** — two copies of the same read is the second hand-maintained copy WO-2.36 refused for
counts, and it arrives here as a real temptation. Factoring the predicate so both callers use *one*
copy is the deliverable; a parallel reimplementation that agrees today is not. **The green tree is
not the fixture.** On it the guard is inert, so a run that only reads the real files proves nothing
this row is about.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/shell.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these, and in this order:

- **`tools/verify-shell.mjs` — the two blocks you are factoring.** As of this dispatch the `vacuity`
  arrays are built at **:424-449** (the `#scoresKeys` / `handleScoreKey` block, **8 arms**) and
  **:669-700** (the `KEYS_MODAL` / `MARK_KEYS` marking block, **11 arms** — the eleventh, the
  `MARK_KEYS` declaration arm at :691, sits outside the `if / else if` chains and is easy to miss when
  you enumerate). Read the comment blocks at **:240-300**, **:390-410** and **:580-590** before you
  move a line: they are WO-2.36's reasoning for why the anchors are asserted by name instead of by
  count, and this row exists to protect that, not to revise it.
- **`tools/wo-gate.mjs --self-check`** — the in-suite precedent the third Deliverable names for a tool
  that tests itself. Read how it is wired and how it reports before you decide where your checks live.
  If you land on that shape, follow it rather than inventing a second convention; if you land somewhere
  else, say why in the file, because WO-2.40 has to be able to follow your reasoning.
- **`tools/README.md` § the check-count ledger, from :830 and the entry list around :1165-1340.** The
  baseline is **802 checks passing / 805 `check()` call sites**, and 802 is a known collision between
  two different quantities — the ledger explains it. `wo-sweep.mjs` asserts the call-site number
  (WO-2.19), so a count that moves without the ledger moving turns the sweep red. Add your entry in the
  established form, next to WO-2.36's. **Do not touch the four wrong `:NNN` pointers you will read past
  in that file — WO-2.39 owns them, and the work order says so explicitly.**
- **`plans/work-orders/phase-2-attendance.md`, WO-2.36 and WO-2.35** — the Traps line says read them
  first. WO-2.36 is the guard you are exercising and its verification is the method to lift; WO-2.35
  owns the "which bindings can the read see at all" question that is explicitly **out of scope** here.
- **`plans/verification-tooling.md`** — the harness reasoning, including why there is one harness.

One instruction that is not in the work order text and is the owner's, for this dispatch: **no 👤
human-verification lines are expected here.** This is tooling and prose; nothing needs an iPad. Do not
invent an iPad reading, and do not add a 👤 line to the Acceptance list.

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

## 5. Done means these 5 lines, reported against one by one

1. Every arm of both `vacuity` arrays is shown firing on an input that should trip it, and the failure text names the right anchor. Run, not reasoned.
2. A correct retirement — key out of the binding **and** its legend row deleted — trips no arm and leaves the check green, driven through the new path rather than by editing the tree.
3. Deleting an arm of either `vacuity` array, or inverting one of its conditions, turns something red. **This is the acceptance line that matters**: a self-test that passes whether or not the thing it tests exists is this work order's own failure repeated inside itself.
4. `node tools/verify-shell.mjs` passes whole and `git diff --stat -- src/ index.html` is empty across the work order.
5. The check count in `tools/README.md` moved in step with whatever call sites were added.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

