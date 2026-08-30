# WO-5.9 — The hitless draft is written but never driven · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.9-result.md` — as your last act, and return it in-band too.

**Routing** — Claude **Opus**, on this work order's own merits: it is Phase 5 outreach, and the
surface under test is the contact-log writer/cooldown-reader contract — the same line WO-5.4's dead
dispatch armed a live mutation against. `ROUTING.md` puts all of Phase 5 in the Claude-only column as
a property of the work. The runner-up set aside was Codex, which the harness-shaped Deliverables
would otherwise suit; it fails the budget bullet independently, since one clean run plus two mutation
runs is 3 × ~4.4 min of `verify-shell.mjs` against a 20-minute whole-dispatch cap. No probe was run
because the route never reached Codex.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.9 — The hitless draft is written but never driven

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-30 · **Size** S · **Depends on** WO-5.4

**Why it exists.** `recordHandoff()` writes `ruleId: hit ? hit.ruleId : ''`, and **the harness has
never walked the false branch.** Both contacts `tools/verify/contact-log.mjs` writes are Ada's, and
Ada trips two concern rules, so `hit` is truthy every time it is read. The branch is reachable in
the real app and not rarely: the student record's door opens the outreach flow for **any** student,
including one no rule has fired for, so a teacher writing home about a child nothing flagged takes
this path on her first use of the feature.

**The half that is proved, and why it is not the same half.** `tools/verify/cooldown-quiet.mjs`
already checks that a `contact` with no `ruleId` silences nothing — but it runs off a **planted**
record the fixture hand-writes. That proves the READER tolerates absence. Nothing anywhere proves
the WRITER produces it. The two halves of one contract are each tested against a hand-made
counterpart and have never been introduced to each other, which is the shape of gap that survives
a green run indefinitely.

**Two regressions that pass the harness as it stands**, failing in opposite directions — which is
why this is worth an hour rather than a note:

- **The guard is dropped** — `ruleId: hit.ruleId`. `hitFor()` returns `orderHits(...)[0] || null`,
  so this throws a `TypeError` inside the click handler. The handler deliberately calls no
  `preventDefault()`, so **the browser follows the `mailto:` anyway**: the mail app opens, the
  teacher writes and sends, and nothing is logged. Silent loss on the path where she is least likely
  to check, because she saw the draft open and has no reason to think anything failed.
- **The gap is filled** — a fallback to a hit in the other direction, or a literal like `'manual'`.
  Now `lastContactAbout()` matches it and **silences a signal nobody ever wrote about**. That is the
  exact inverse of the mutation WO-5.4's dead dispatch left behind, and it is what the under-fire
  posture at the foot of `src/log.js` exists to prevent: praise not sent is a missed opportunity, a
  rule silenced by a message that was never about it is how a teacher stops trusting the list.

**Deliverables**
- One check in `tools/verify/contact-log.mjs` that drives a handoff for a student **no rule has
  fired for**, opened through the student record's door — there is no signal card for her, which is
  the point.
- It asserts three things together: exactly one entry is appended (so the writer did not throw),
  its `ruleId` is `''` — **empty, not `undefined`, and not invented** — and a signals pass over the
  document afterwards suppresses nothing for her. The third conjunct is the one that matters: it
  closes the loop from writer to reader on a record **the app itself wrote**, which is what
  `cooldown-quiet.mjs` structurally cannot do.
- The second, smaller hole in the same sitting: Acceptance line 1's *immediate, no reload* property
  is asserted on the signal-card path only. A handoff made **from the student record** has its
  repaint reached but not asserted.

**Acceptance**
- [ ] A handoff for a student with no hit in either direction appends exactly one entry, and its
      `ruleId` is the empty string.
- [ ] That contact suppresses nothing on a following signals pass — proved against a record the app
      wrote, not a planted one.
- [ ] Both new claims are mutation-proved: restoring `hit.ruleId` without the guard, and inventing a
      rule id in the else branch, each turn a named check red.
- [ ] A handoff made from the student record shows in that screen's history immediately, without a
      reload.

**Traps** — **The fixture's second student is already the right student and cannot be used as he
stands.** Ben exists in `contact-log.mjs` solely so the empty-history sentence can be compared
character for character against a suppressed one, and writing a contact for him populates his
history and reddens that check. Run the new check strictly after the empty-sentence check, or give
the fixture a third student — and say which, at the point of departure, because a harness that goes
red for a reason that looks unrelated costs an hour of confusion.

Second: **do not reach for the signal card to open this draft.** No rule fired, so there is no card;
the record's door is the only way in and is itself the thing under test. `src/shell.js`'s door there
threw a `ReferenceError` once already — `signals.evaluate(getDoc(), …)` against a `getDoc` that file
does not import — and a check that asked the model instead of driving the screen would have walked
straight past it (`TESTING.md` § WO-5.3).

Third: this adds a check to `tools/verify/contact-log.mjs`, so `tools/README.md`'s `check()`
call-site count moves and `wo-sweep.mjs` compares against it. Update the count in the same sitting —
the WO-3.26 scar, where a green tree turned the sweep red on work being *done*.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/log.js`
  - `src/shell.js`
  - `tools/README.md`
  - `tools/verify/contact-log.mjs`
  - `tools/verify/cooldown-quiet.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Four things to carry in, none of which the tree will tell you:**

- **Every mutation comes back out before you write a word of prose.** WO-5.1, WO-5.3 and WO-5.4 each
  shipped a tree with live mutations under already-ticked boxes; two of them were dangerous. This
  work order's Acceptance *requires* two mutations, so you are walking straight into that shape.
  Revert each one the moment its check goes red, and run `grep -rn MUTATION` over your own delivered
  files as your last act before the result file. Report the output either way.
- **A mutation reasoned about is not a mutation proved.** Both Acceptance line 3 mutations get an
  actual red run, and you report which named check went red for each.
- **`verify-shell.mjs` may not run in your sandbox.** If it cannot, say "could not run —
  environment" plainly and leave the boxes it would have closed open. A green run you did not get is
  not a green run, and a box ticked on reasoning is worse than a blank one.
- **`git checkout` after a mutation reverts unstaged work in that file.** Restore the mutated line
  by hand, or stage before mutating.

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

1. A handoff for a student with no hit in either direction appends exactly one entry, and its `ruleId` is the empty string.
2. That contact suppresses nothing on a following signals pass — proved against a record the app wrote, not a planted one.
3. Both new claims are mutation-proved: restoring `hit.ruleId` without the guard, and inventing a rule id in the else branch, each turn a named check red.
4. A handoff made from the student record shows in that screen's history immediately, without a reload.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

