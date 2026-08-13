# WO-3.21 — nothing notices if the accommodation prompt stops counting students · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.21-result.md` — as your last act, and return it in-band too.

**Routing decision.** This work order routes to **Codex** on the rubric — the spec is complete
inside the work order (the exact fixture student, the exact line, the exact sentence the prompt must
still read), every Acceptance line is a mechanically checkable count of green and red, there is no
UI, no new convention, and `src/` is explicitly out of scope. It was **re-routed to Claude Sonnet**
before dispatch on the same evidence that moved WO-3.12: `tools/verify-shell.mjs:192` builds the
browser profile with `fs.mkdtemp(path.join(os.tmpdir(), 'pb-verify-'))`, a write *outside the repo*,
and Codex runs under `--sandbox workspace-write`, which cannot create it — so Codex could not run the
harness at all, and four of the five Acceptance lines here are run evidence. (The Codex probe itself
passed clean this dispatch, `SMOKE OK`, exit 0. **The runner is healthy; the sandbox is the
constraint.**) The runner-up I set aside: raising the tier to Opus because the surface under test is
the accommodation prompt, which is a sensitive surface. Declined — the deliverable is a synthetic
fixture row and a `tools/README.md` note with `src/` out of scope, no accommodation data reaches a
teacher-visible surface through this change, and a fallback is not a re-rubricing.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.21 — nothing notices if the accommodation prompt stops counting students

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-13 · **Size** XS · **Depends on** WO-3.8 · **Blocks** nothing, and
that is deliberate — the dedupe is correct today, so this is a row to cut if the fortnight tightens
**Closes roadmap** *(no box. Harness, not app: nothing here changes what a teacher sees. The same call
WO-3.12 made, and for the same reason.)*

**Not a go-live blocker, and nothing here is a defect.** Booked 2026-08-13, out of WO-3.8's
verification. `src/accommodation-prompt.js` is correct as shipped and all 710 harness checks pass.
**Do not go hunting for a bug; there isn't one.** What is missing is the check that would notice if
the code stopped being correct.

**Why it exists.** `groupsFor()` counts **students, not rows** — `src/accommodation-prompt.js:186`
carries a `seen` Set so that a student holding two `extended-time` rows is one student who needs
extended time. The file's own comment says why that matters: *"4 students have extended time" over a
roster of three is the kind of number that makes a teacher stop believing the prompt.* Measured at
WO-3.8's verification: **delete the `seen` Set and all 710 checks stay green.** No fixture student
carries two rows of the same kind, so an inflated count has nowhere to show up.

This is the WO-3.12 shape again — *a fixture whose values cannot express the failure* — in the one
place where the number a teacher reads is a claim about how many children are in the room. The
neighbouring case is already covered and is not this one: `c_wo38b`'s `wo38-s7` holds two rows, but
of **different** kinds (`breaks` and a blank one a mis-tap wrote), which is what proves `isRealRow()`
rather than the dedupe.

**Deliverables**
- **A fixture student carrying two rows of the same kind, both matching the chosen category.** The
  cheapest is `wo38-s1` Ashdown at `tools/verify-shell.mjs:17570`, whose one `extended-time` row is
  scoped `['tests']`: give it a second scoped `['unit tests']`, which the match rule already fires on.
  Both rows are real, so `isRealRow()` does not mask the case.
- **No new assertion unless the mutation proves one is needed.** WO-3.8's existing check asserts the
  exact sentence *"3 students have extended time, 2 need a separate setting."*, and a build counting
  rows says `4 students`. Confirm by mutation whether that check alone carries it; add one only if it
  does not.
- **The mutation is run, and the proof is written down.** Delete the `seen` Set, run the harness, and
  record the counts before and during in `tools/README.md` the way WO-3.12's and WO-2.24's are.

**Out of scope** — anything in `src/`. The dedupe is verified correct; this work order adds no
behaviour. If a new check goes red against current code, **that is a defect found and it gets its own
work order** — do not fix the app from inside this one.

**Acceptance**
- [ ] A fixture student carries two rows of the same kind, both matching the category under test, and
      the prompt still reads **"3 students have extended time, 2 need a separate setting."** — the
      count is unchanged by the second row, which is the whole claim.
- [ ] The reveal still lists **five** names, with that student named **once**.
- [ ] Deleting the `seen` Set at `src/accommodation-prompt.js:186` turns a check red, with the counts
      before and during quoted — run, not reasoned. **A mutation that reddens nothing means this work
      order did not land**, and a mutation that reddens everything means the fixture is coupled.
- [ ] `node tools/verify-shell.mjs` passes whole, with the check count in `tools/README.md` moved in
      step with any check added.
- [ ] `git diff --stat src/` is empty across the whole work order, confirmed after the mutation's
      revert and again at the end.

**Traps** — **The second row must match the category, or the fixture proves nothing.** A row scoped
to something `Tests` does not match never reaches the `seen` Set at all, and the check would stay
green with the dedupe deleted — which is this work order failing while appearing to pass.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/accommodation-prompt.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Four more, all of them things this dispatch already looked at and that you should not have to
rediscover:

- **`tools/verify-shell.mjs` around line 17560–17640** — the whole WO-3.8 plant. `wo38-s1` Ashdown
  is at 17570 and reads `person('wo38-s1', 'Ashdown', [row('extended-time', ['tests'])])`. Note that
  `wo38-s3` Corvane already carries `row('extended-time', ['unit tests'])`, which is why the work
  order names `['unit tests']` as the second scope for Ashdown: the match rule is already proven to
  fire on it by a check that passes today. That is the Trap answered — a scope the category does not
  match never reaches the `seen` Set, and the fixture would prove nothing.
- **The fixture-is-real check just below it (≈17620–17633)** asserts `plant38.people === 7`. That
  counts *students*, not rows, so a second row on Ashdown must leave it at 7. If you find yourself
  changing that 7, stop — you have added a student instead of a row.
- **`KIND_SENTINELS` / `NAME_SENTINELS` at ≈17617** and the comment above them. `'Ashdown'` is
  already a name sentinel. The reveal listing five names with Ashdown named **once** is Acceptance
  line 2, and the comment explains why names are swept over the assignment editor and kinds over the
  whole page — do not widen either sweep.
- **`tools/README.md` § the mutation tables**, e.g. the WO-3.12 and WO-2.24 entries and the header at
  line 73. Match that shape: the mutation, the result, counts before and during, and the note that it
  was reverted. The check-count line in that file moves only if you actually add a check.

**On the third deliverable's judgment call.** "Add an assertion only if the mutation proves one is
needed" means: make the fixture change, run the mutation, and *look at what went red*. If WO-3.8's
existing sentence check alone turns red, you are done and you add nothing — a check added on top of
one that already carries the case is noise. If it stays green, the fixture is not expressing the
failure and you add the smallest check that does. Report which of the two happened and quote the
counts either way; that is Acceptance line 3, and it is run evidence, not reasoning.

**The two standing traps in this work order's own text, restated because they are easy to lose.**
There is **no bug to find** — `src/accommodation-prompt.js` is correct as shipped, and the mutation
is a deliberate temporary edit you revert. And if some new check goes red against *current* code,
that is a defect discovered and it earns its own work order: say so in your report, do not fix it
here. `git diff --stat src/` must be empty at the end, and the work order asks you to confirm that
twice — right after you revert the mutation, and again as your last act.

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

1. A fixture student carries two rows of the same kind, both matching the category under test, and the prompt still reads **"3 students have extended time, 2 need a separate setting."** — the count is unchanged by the second row, which is the whole claim.
2. The reveal still lists **five** names, with that student named **once**.
3. Deleting the `seen` Set at `src/accommodation-prompt.js:186` turns a check red, with the counts before and during quoted — run, not reasoned. **A mutation that reddens nothing means this work order did not land**, and a mutation that reddens everything means the fixture is coupled.
4. `node tools/verify-shell.mjs` passes whole, with the check count in `tools/README.md` moved in step with any check added.
5. `git diff --stat src/` is empty across the whole work order, confirmed after the mutation's revert and again at the end.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

