# WO-1.47 — a zero typed into a date field clears the date and takes the field with it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.47-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at **Opus**, on three Claude-column triggers: the Traps are judgment
(*do not delete the rebuild — it is not the bug, the bug is when it runs*; *move the reasoning with the
code*), it produces prose (a new `TESTING.md` § WO-1.47 and a strike in `plans/known-bugs.md` § 1),
and one of the five sites is the roster supports panel, which is accommodation data. The runner-up set
aside: mechanically this reads Codex-shaped — a hook rename at five named sites against a spec already
measured in `known-bugs.md` § 1 — but the budget refuses it anyway, since new CDP checks plus a mutation
proof is 3+ `verify-shell.mjs` runs at ~4.4 min inside a 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.47 — a zero typed into a date field clears the date and takes the field with it

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-03 · **Size** S · **Depends on** nothing · **Blocks** WO-1.48, which
replaces this row's guard with the control that removes the ambiguity underneath it
**Closes roadmap** Phase 1 → *(no box. A defect in a delivered surface rather than new scope — the
same call WO-1.26 through WO-1.46 made about the tooling rows. Booked 2026-09-03, owner-directed, on
a report from the classroom on the second day of the term.)*

**Why it exists.** Typing `0` as the first digit of a date in the assignment editor **empties the
field, discards the date already in it, and takes the focus to `BODY`**. Every keystroke after it
goes nowhere, so a teacher entering `09032026` ends with an assignment carrying **no due date at
all**, silently. The full record — the measurement, the four candidate repairs and the two that were
struck — is `plans/known-bugs.md` § 1, and it is not repeated here.

**The mechanism in one paragraph.** `0` is not a valid month or day on its own, so Chromium blanks
the segment and waits for a second digit, and for that one keystroke the control reports
`value === ''`. It fires `input` **and `change`** on that empty read — measured 2026-09-03 in headed
Edge 152. `assignmentDateCommitted()` (`src/assignments.js:947`) tests `if (input.value) return;`,
which an empty read walks straight past, and then runs `wrap.replaceWith(dateField(...))`
unconditionally. That line is the app throwing away the element under the caret. Digits 1–9 commit
immediately, never produce an empty read, and are unaffected — which is exactly the narrowing the
owner reported.

**Which segments, measured.** The trigger is **`0` as the first digit of the month or the day
segment**, and nowhere else. Month `10` is safe — `1` commits as `01` and `0` takes it straight to
`10`, with no empty read in between — and **the year segment is immune**, because `0002`, `0020` and
`0202` are all complete dates on the way to `2027`. Day `03` fires it exactly as month `09` does.

**Why it is urgent rather than merely real.** Months `01`–`09` are **January through September**;
October, November and December lead with `1` and are safe. But **the 1st through the 9th of every
month lead with `0` permanently**, so this is all of September on the month segment plus roughly
three dates in ten for good — the first keystroke of a due date entered in the term that started
yesterday, on the one screen a teacher uses weekly, and **it destroys data rather than failing
loudly**.

**Why this is a guard and WO-1.48 is the fix.** The root cause is that a native date input reports
`''` for two different states — *mid-typing, not yet complete* and *deliberately emptied* — and
offers nothing to tell them apart. Removing that ambiguity means giving the teacher an explicit
**Clear**, which is new design across five fields and wants a real iPad; that is WO-1.48 and it is
not a thing to cut into a teaching week. **This row buys the days that one needs**, and it is
deliberately the smaller of the two repairs.

**What to do.** Move the rebuild from `change` to **`focusout`**, at all five sites. It then cannot
replace an element under a caret by construction, and it still resets the picker for the case where
the teacher clears a date and leaves the field. **What it stops covering is named rather than
hidden:** clearing a date and tapping the same day again *without leaving the field* — the exact
iPadOS quirk the rebuild was written for — goes back to being broken until WO-1.48 lands. That is a
knowing trade of a **data-loss defect on the laptop** for a **stale-highlight defect on the iPad**,
and Roll Call! has shipped the second one for a year in daily classroom use without a report.

**Out of scope** — the Clear control, any change to what a date field looks like, and any change to
`type="date"` itself. A custom picker is refused here for the reason `dateField()` already gives:
the native control is what buys the OS picker on the iPad, and it is not what is broken.

**Traps**

- **All five fields, or four of them become four more reports.** The same rebuild-on-empty-commit
  was copied to `src/assignments.js:973`, `src/classes.js:1587`, `src/roster.js:1139`,
  `src/days-off.js:278` and `src/events.js:273`. Only the assignment editor has been *reported*,
  because it is the one a teacher types into weekly; nothing makes the other four immune.
- **Four of the five comments point at a paragraph in the fifth.** `src/classes.js`'s
  `termDateCommitted()` holds the long version of the iPadOS reasoning and the other four say so
  instead of repeating it. **Move the reasoning with the code** — a comment explaining a `change`
  hook, sitting on a `focusout` hook, is worse than no comment, and this repo has paid for that once
  already (`plans/dispatch-retro.md`, the comment that ran ahead of its code).
- **Do not delete the rebuild outright.** It is not dead code and it is not the bug; the bug is
  *when* it runs. Deleting it takes the iPad back to the state that produced the WebKit report, with
  nothing written down to say a decision was made.
- **The transient empty write stays, and it is not this row's job.** `editAssignmentField()` still
  stores `''` on the empty `input` before Chromium commits the month a moment later. That is
  harmless **only because the element now survives to receive the commit**, and the store's debounce
  means one save. Say so at the line rather than fixing it here; a future reader who reacts to an
  empty stored date needs to know a phantom one exists for a keystroke.
- **A `change` hook may still be right for something else.** `src/shell.js:3106` also carries the
  write for the browser that commits a picker change without an `input` event first. Read what that
  hook does before moving the whole of it — only the **rebuild** moves.

**Acceptance**
- [ ] Typing `0` as the first digit into an assignment date field holding a date leaves **the same
      element** in place, the caret still in it, and the date complete once Chromium commits — driven
      in `tools/verify-shell.mjs`, seeding a date and pressing `0` through `Input.dispatchKeyEvent`.
      *(A prefilled date field is faithfully drivable over CDP and a blank one is not; the bug lives
      in the prefilled one. `plans/known-bugs.md` § 1 carries the measurement.)*
- [ ] Typing a full `09032026` into that field leaves the assignment holding **2026-09-03** and not
      an empty date — the data-loss half, asserted separately from the focus half.
- [ ] **The day segment is driven too, and separately.** `10032026` has a safe month and a `0` day,
      and it is the case that outlives September — the month segment stops triggering this on Oct 1
      and the day segment never does.
- [ ] The other four fields are each **moved and read**, with the iPadOS reasoning relocated so that
      no comment describes a hook it no longer sits on. Five sites, five decisions, none silent.
- [ ] 👤 On the iPad, after a force-quit: clearing a date and **leaving the field** still lets the
      picker reopen with nothing selected. The case this row knowingly gives up — clear, then tap the
      same day without leaving — is read and **written down as failing**, so WO-1.48 has a baseline.
- [ ] `node tools/verify-shell.mjs` is green, `node tools/wo-sweep.mjs` is green, and
      `node tools/wo-gate.mjs --audit` is green on a clean tree.
- [ ] `TESTING.md` gains a § WO-1.47, and `plans/known-bugs.md` § 1 is struck with this ID.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/dispatch-retro.md`
  - `plans/known-bugs.md`
  - `src/assignments.js`
  - `src/classes.js`
  - `src/days-off.js`
  - `src/events.js`
  - `src/roster.js`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Two things to settle rather than guess.**

- **The harness gained two things on 2026-08-31 (WO-1.44) that this work order will use.**
  `--today=YYYY-MM-DD` moves its clock, and a section that throws is now contained and *named as
  lost* while the run continues — so a run that reports green sections and still exits non-zero is
  telling you checks did not run. Read the summary line, not the count of green lines.
- **The last Acceptance line contradicts `known-bugs.md` § 1's own body, and you resolve it out
  loud.** § 1 says it stays unstruck in body because both work orders point at it for the
  measurement, and that it closes when WO-1.48 ticks; its header is already booked with both IDs.
  So do not delete the section. Record what WO-1.47 closed and what remains open for WO-1.48, and
  say in your result file which reading you took.

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

## 5. Done means these 7 lines, reported against one by one

1. Typing `0` as the first digit into an assignment date field holding a date leaves **the same element** in place, the caret still in it, and the date complete once Chromium commits — driven in `tools/verify-shell.mjs`, seeding a date and pressing `0` through `Input.dispatchKeyEvent`. *(A prefilled date field is faithfully drivable over CDP and a blank one is not; the bug lives in the prefilled one. `plans/known-bugs.md` § 1 carries the measurement.)*
2. Typing a full `09032026` into that field leaves the assignment holding **2026-09-03** and not an empty date — the data-loss half, asserted separately from the focus half.
3. **The day segment is driven too, and separately.** `10032026` has a safe month and a `0` day, and it is the case that outlives September — the month segment stops triggering this on Oct 1 and the day segment never does.
4. The other four fields are each **moved and read**, with the iPadOS reasoning relocated so that no comment describes a hook it no longer sits on. Five sites, five decisions, none silent.
5. 👤 On the iPad, after a force-quit: clearing a date and **leaving the field** still lets the picker reopen with nothing selected. The case this row knowingly gives up — clear, then tap the same day without leaving — is read and **written down as failing**, so WO-1.48 has a baseline.
6. `node tools/verify-shell.mjs` is green, `node tools/wo-sweep.mjs` is green, and `node tools/wo-gate.mjs --audit` is green on a clean tree.
7. `TESTING.md` gains a § WO-1.47, and `plans/known-bugs.md` § 1 is struck with this ID.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

