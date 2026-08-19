# WO-2.51 — the term ended and the screen never said so · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.51-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude Opus** — implementer spawned with no model override,
which is the frontmatter default and the right one here. The deciding signal is `ROUTING.md` §
"Route to Claude": this work order's actual deliverable is teacher-facing prose (the band's sentence
naming both terms, the button label, the `TESTING.md` lines, the `CHANGELOG.md` draft) together
with a precedence judgment about which of two bands owns one strip — neither is mechanically
specified anywhere outside the work order. The runner-up I set aside: the Codex column had a real
claim, since the condition is read straight off WO-2.50's already-built `termContaining()` predicate,
every Acceptance line but the 👤 one is mechanically checkable, and the run budget fits comfortably
(2 × ~4.4 min `verify-shell.mjs` = ~8.8 min against the 20-minute cap) — but a work order sitting in
the Claude column on its own merits is Opus whatever the stopwatch says, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.51 — the term ended and the screen never said so

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-18 · **Size** S · **Depends on** WO-2.50 · **Blocks** nothing
**Closes roadmap** Phase 2 → *(no box. Booked 2026-08-18 in the same sitting as WO-2.50 and out of the
same owner report — the second half of what she asked for.)*

**Owner-asked, 2026-08-18, in one sentence:** *at the end of the term, a reminder to move to the next
term should pop up.*

**Why it exists.** Nothing in this app ever moves a teacher from one term to the next.
`getSelectedTermId()` resolves a stored `planbook_` preference and, when it names nothing that exists,
falls back to **the first term in the list** — never to the term that contains today. So the tab stays
where she left it in August until she notices something and taps. What she notices is a **number**: the
counts, the percentage and the meeting total on the attendance screen and in both reports are all scoped
to the selected term, so a week into Q2 the screen is quietly reporting Q1 while she marks Q2.

**WO-2.50 makes this louder rather than quieter, and that is deliberate.** Its decision 1 says the
selected tab must never bound what is writable — so on the first Monday of Q2 with the Q1 tab still up,
every mark lands correctly in the ledger and every number above it describes a term that ended. Nothing
breaks, nothing warns, and the failure is pure arithmetic. That is the gap this row closes: **WO-2.50
refuses days that belong to no term; this one speaks up about days that belong to a term she is not
looking at.**

**The form, decided with the owner: a banner, not a modal.** `paintBanner()` already owns the band above
the grid that says *you are not on today* — full width, coloured edge, one button on it, and it comes
back every paint until the condition is gone. That is what a rollover needs. A modal costs a tap at the
classroom door on a morning she is busy, needs a *don't ask again* to be bearable, and a dismissed modal
is a reminder that has been dismissed. A banner that will not go away until she switches — or until the
condition stops being true — is the reminder she asked for without the interruption.

**Deliverables**

- **The condition, off WO-2.50's predicate and nothing new.** Today falls inside a term of the open
  class that is **not** the selected one. If today falls in **no** term, this says nothing at all —
  WO-2.50's screen is already saying it, and two bands disagreeing about the same day is worse than
  either.
- **One band, and the off-today message wins it.** A teacher paging back into October must not be told
  to move to Q2 while she is looking at Q1's own days; the existing banner describes the day on screen,
  which is the more immediate fact, and this one reappears the moment she is back on today. Write that
  precedence down where `paintBanner()` decides it.
- **The sentence names both terms and the button names the destination** — `Switch to Quarter 2`, taken
  from `term.label`, which is the only place in this app a quarter is ever named (`docs/data-model.md`:
  term ids are opaque and nothing switches on one). A class on trimesters must read correctly with no
  code change, and that is the test of whether the label was used or a word was invented.
- **Nothing switches by itself.** The selected term is the teacher's, held per class in a `planbook_`
  preference, and an app that moves it for her is an app that moved it while she was part-way through
  entering the last week of Q1. The switch goes through the same route the term nav uses, so the repaint
  chain WO-2.17 and WO-2.18 built runs — a second way to change the selected term is a second thing for
  those checks to miss.
- **`TESTING.md` lines and the `CHANGELOG.md` entry.** `sw.js` `CACHE` bump if anything in `SHELL` moves.

**Acceptance**
- [ ] With terms Q1 ending Oct 31 and Q2 starting Nov 3, a document whose today is Nov 4 and whose
      selected tab is Q1 shows the band, naming both terms, with a button reading `Switch to Quarter 2`.
- [ ] Tapping it selects Q2, the band goes, and **the counts, the state line and the totals repaint** —
      the surfaces WO-2.18 enumerates, checked the way that work order checks them.
- [ ] With Q2 already selected on Nov 4, there is **no band**. With today inside no term at all, there
      is **no band** — WO-2.50's screen owns that day.
- [ ] Paged back to an October column, the **off-today** band is the one shown; returning to today brings
      this one back. One band at a time, proved in both directions.
- [ ] Terms labelled `Trimester 1` and `Trimester 2` produce the same behaviour with those labels in the
      sentence and on the button — no quarter vocabulary anywhere in the output.
- [ ] Nothing changes the selected term without a tap: driven by loading a document whose today is in
      Q2 with Q1 selected, and reading the preference back **unchanged** until the button is pressed.
- [ ] `node tools/verify-shell.mjs` green with its count recorded, and one mutation proof.
- [ ] 👤 On the iPad, force-quit first: the band is readable at a glance in both orientations and its
      button clears 44px under `@media (pointer: coarse)`.

**Traps** — **do not switch the term for her**, however obvious the right answer looks; the preference
is per class and per device on purpose. **Do not fire on a day that is in no term** — that is WO-2.50's
sentence and this one would talk over it. **`term.label` or nothing**: a hardcoded `Q1`/`Q2` anywhere is
the one thing `docs/data-model.md` says a sweep looks for, and it makes the app unsellable to a teacher
on semesters. **And check the diffstat before committing** (WO-2.49).

**Out of scope.** A warning *before* a term ends (*Quarter 1 ends Friday*) — that is a calendar
lead-time question, and Phase 6 owns the event kind that carries it. Grades-due reminders. Anything that
creates, edits or reorders terms.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **The work order this one is the second half of.** WO-2.50, immediately above this one in
  `plans/work-orders/phase-2-attendance.md`, and the code it landed. Read its three owner decisions
  before you write the condition — decision 1 (the selected tab never bounds what is writable) is
  the reason this band has to exist at all.
- **The predicate, already built and already pointed at this work order by name.**
  `src/classes.js` `termContaining(classId, date)` (~line 266) — its own comment says *"the thing
  WO-2.51 will ask about today"*. Note what the comment warns: `null` from it does **not** mean
  "outside the terms", because a class with no dated terms answers `null` for every date and is
  deliberately unbounded. `outOfTermGap()` just below it is the other side of the question, and it
  is what WO-2.50's own screen uses. Getting the "today is in no term" case right — say nothing —
  turns on reading both.
- **The band you are adding to, not a new one.** `src/attendance.js` `paintBanner(columns)`
  (~line 3492), and the header comment above it that explains why it is a full-width band with a
  coloured edge rather than a tint. The precedence rule the work order asks you to "write down where
  `paintBanner()` decides it" belongs in that comment block, in the same voice.
- **The selected term and the one route that changes it.** `src/classes.js` `getSelectedTermId()`
  (~line 184) and `selectTerm(termId)` (~line 603); the delegation entry is `data-term-select` in
  `src/shell.js` (documented at ~line 66, with the repaint chain described at ~line 669). The
  work order is explicit that your button goes through **that** route rather than a second one — the
  point is that WO-2.17's and WO-2.18's repaint checks keep covering it.
- **WO-2.18 in `plans/work-orders/phase-2-attendance.md`** — Acceptance line 2 says the counts, the
  state line and the totals must repaint, "the surfaces WO-2.18 enumerates, checked the way that work
  order checks them". Read that work order and reuse its check rather than inventing one.
- `design/style-guide.md` for the band's colour and the 44px `@media (pointer: coarse)` rule.
- `plans/dispatch-retro.md` § the WO-2.49 CRLF entry — **check `git diff --stat` before you
  commit**; a phase file silently rewritten to CRLF blinds `--tick` to every box in it.

**Two traps worth restating because they are the ones a clean implementation gets wrong:**
**do not switch the term for her** under any circumstance short of the button being tapped (the
preference is per class and per device on purpose), and **`term.label` or nothing** — a literal
`Q1`/`Q2` anywhere in the output fails Acceptance line 5 and makes the app wrong for a school on
trimesters or semesters.

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

1. With terms Q1 ending Oct 31 and Q2 starting Nov 3, a document whose today is Nov 4 and whose selected tab is Q1 shows the band, naming both terms, with a button reading `Switch to Quarter 2`.
2. Tapping it selects Q2, the band goes, and **the counts, the state line and the totals repaint** — the surfaces WO-2.18 enumerates, checked the way that work order checks them.
3. With Q2 already selected on Nov 4, there is **no band**. With today inside no term at all, there is **no band** — WO-2.50's screen owns that day.
4. Paged back to an October column, the **off-today** band is the one shown; returning to today brings this one back. One band at a time, proved in both directions.
5. Terms labelled `Trimester 1` and `Trimester 2` produce the same behaviour with those labels in the sentence and on the button — no quarter vocabulary anywhere in the output.
6. Nothing changes the selected term without a tap: driven by loading a document whose today is in Q2 with Q1 selected, and reading the preference back **unchanged** until the button is pressed.
7. `node tools/verify-shell.mjs` green with its count recorded, and one mutation proof.
8. 👤 On the iPad, force-quit first: the band is readable at a glance in both orientations and its button clears 44px under `@media (pointer: coarse)`.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

