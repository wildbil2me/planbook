# WO-5.4 — Contact log & history · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.4-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude **Opus**, on the work order's own merits — no `model` override, this is
not a fallback. The deciding signal is two of `ROUTING.md`'s Claude bullets at once: Acceptance line 5
is presentation mode over behaviour-adjacent history, a sensitive surface that is never delegated, and
`ROUTING.md` § "Later phases" already says all of Phase 5 is Claude-only *"as a property of the work,
not a runner's record"*; line 4 is teacher-facing prose about what "logged" honestly means. The
runner-up I set aside: this is Size **S**, three of its five lines are mechanically checkable, and the
cooldown contract it fills is written out in full in `docs/data-model.md` § log — a Codex shape on
paper, but each sensitive bullet is independently disqualifying and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.4 — Contact log & history

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-29 · **Size** S · **Depends on** WO-5.3, WO-4.5
**Closes roadmap** Phase 5 → "Log the contact (append-only) and show contact history per student."

**Why it exists.** The log is what WO-4.5's cooldown reads. Without it the signal lists are
identical every week and the whole Phase 4 investment decays.

**Deliverables**
- On handoff, append to `log[]` with `kind: "contact"`, the audience, subject, body, and **the
  signal rule that prompted it** — the cooldown keys on `student + rule`.
- Contact history on the student record and on the signal card, newest first.
- Append-only, same as WO-4.4.
- Handle the honest gap: `mailto:` cannot confirm the message was actually sent. Log it as
  *drafted*, and let the teacher mark it sent — or state plainly in the UI that the log records the
  handoff, not delivery.

**Acceptance**
- [ ] A contact appears in the student's history immediately after handoff.
- [ ] The logged rule id is what WO-4.5's cooldown matches on, and suppression follows.
- [ ] Log entries are never edited or deleted.
- [ ] The UI is honest about what "logged" means given `mailto:` cannot confirm delivery.
- [ ] Contact history is presentation-mode safe — a projected history of behavior contacts is a
      disclosure.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/log.js` — the model, **and read its header twice**. It is the only writer of `log[]`, and it
  argues in advance most of what this work order has to decide.
- `docs/data-model.md` § log (~lines 258–295) and § the send flow (~lines 715–725) — the `contact`
  shape, `ruleId`, and the class-blindness ruling.
- `src/outreach-view.js` §§ "IT IS NOT A WRITER" and "THE HANDOFF IS A REAL LINK"; `src/outreach.js`
  § "AND THERE IS NO WRITER IN THIS FILE".
- `src/log-sheet.js`'s `studentLogCard()` — the existing history card and the presentation-mode
  reasoning under it. `src/signals-view.js` for the signal card. `src/supports.js`'s
  `logKindVisible()`.
- `plans/work-orders/phase-4-signals.md` § WO-4.5 and `tools/verify/cooldown-quiet.mjs` — the
  cooldown that reads what you are about to write.

---

## 2b. Eleven things this tree will do to you

Not a walkthrough — these are the constraints and decisions you would not guess from the work order.

**The decisions that are yours to make and to write down at the point of departure**

1. **Where contact history goes.** `src/log.js`'s header states, in as many words, that folding
   `contact` into `LOG_KINDS`/`OWN_KINDS` would put an email's subject line onto a card headed *"What
   you have written down"* — *"a decision for that work order to make with its own reasons"*. That
   work order is this one. A second card, a section, or a widened reader are all arguable; picking one
   by accident is not. **Whatever you pick, `visibleEntriesFor()`'s existing callers must keep seeing
   exactly behaviour + note.** Note that `studentLogCard()`'s footer currently promises *"None of this
   is printed, exported or put in a draft"* — that sentence is about behaviour and notes and must stay
   true of whatever card it ends up under.
2. **Which half of Deliverable 4 you take.** It offers two answers — log it as *drafted* and let the
   teacher mark it sent, **or** say plainly in the UI that the log records the handoff and not
   delivery. A *mark sent* control is a second write **to an entry that already exists**, which the
   append-only rule (Acceptance line 3, `docs/data-model.md` § log, `src/log.js`'s only-a-`push`
   structure) forbids — so if you want it, it is a *second entry*, and you must say so and say what it
   costs. The cheaper answer is honest copy. Choose deliberately; the choice is Acceptance line 4.

**The traps**

3. **`newLogEntry()` must not gain `ruleId`.** Both `src/log.js` and `docs/data-model.md` argue at
   length that `ruleId: ""` on every behaviour note is an eighth field paid for by every document for
   a kind Phase 5 owns. A contact needs its own writer or its own path; the seven-field writer for
   behaviour and note stays seven fields.
4. **`ruleId` is `src/signals.js`'s own `hit.ruleId`, unchanged** — no mapping, no new vocabulary. The
   draft's signal is `hitFor(tone)` in `src/outreach-view.js`. A draft opened with **no hit in that
   direction** has no rule; the reader (`lastContactAbout()`) already tolerates absence and **silences
   nothing**, which is the documented under-fire posture. Do not invent a rule id to fill the gap.
5. **The handoff is an `<a href="mailto:…">`, and a blocked draft has no `href` at all.** That
   structural refusal is WO-5.3's point of departure and must survive intact. Whatever writes the log
   must ride a real click, must not `preventDefault()` (iOS opens the link more reliably than a
   scripted navigation, and that is the device that decides go-live), and must not fire on an anchor
   that is refusing.
6. **`tools/verify/outreach.mjs` asserts the opposite of what you are building, three times** — around
   lines 773–798 and 1326–1344: `rev` unchanged, `log[]` the length it was, and `contacts === 0`
   across the whole flow. Those go red. **Follow WO-5.5's precedent, quoted in its own Traps: update
   the assertion to the new truth and keep every other conjunct — a check edited down to fit is the
   defect that directory exists to catch.** The re-scoping that is actually true: *drafting* — picking,
   toggling, typing, the projector cycle, the change-of-mind confirm — still writes nothing, and only
   the handoff writes, exactly one entry. Prove both halves.
7. **Read `tools/verify/outreach.mjs`'s own note at ~line 777 before you write a `rev` assertion:**
   `update()` only *schedules* a save and `rev` advances ~800ms later, so a read taken straight after
   a control cannot see the write. It must be flushed first. That blind spot was a real defect found
   in WO-5.3's mutation round.
8. **Do not add a `presentationMode()` test to a view.** `logKindVisible('contact')` already falls
   through to `supportsVisible()`, so contact entries are suppressed by the one rule in
   `src/supports.js`, and suppression arrives as a **shorter list** rather than a hidden element.
   There is no *"N hidden"* line anywhere, because a count is the disclosure — and the empty sentence
   must read identically whether the student has nothing on file or has everything suppressed. Two
   askers is two answers eventually (`src/calendar-view.js` records the same ruling).
9. **The cooldown is class-blind because the record is** — `log[]` carries no `classId`, and
   `docs/data-model.md` says in as many words that this work order **must not infer a class from
   whichever roster the send was started on**.
10. **Stale prose you now own, and it is in the diff or the work order is not done.**
    `src/merge-fields.js`'s header (~line 130) says WO-5.3 writes the contact entry — WO-5.3
    deliberately left that line standing for you, and says so in its own closing block.
    `src/outreach.js` and `src/outreach-view.js` both claim in their headers to contain no writer and
    to leave the document byte-identical; `src/log.js`'s header says nothing in the app reads `log[]`
    outside it and nothing writes a `contact`; `docs/data-model.md` attributes the first `ruleId`
    write to WO-5.3 in two places. Every one of those becomes false today. Fix them where they are
    wrong; do not tidy the reasoning around them.
11. **`tools/README.md` records the harness's `check()` call-site count and `wo-sweep.mjs` compares
    against it.** Adding checks turns the sweep red on work being *done* — that is the WO-3.26 scar.
    Update the count and the prose around it in the same sitting.

**Out of scope.** Anything WO-5.7 (clipboard) or WO-5.8 (several recipients) owns. Do not widen the
work order — a follow-up you think is needed goes in your report as a proposal, not into the tree.

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

## 5. Done means these 5 lines, reported against one by one

1. A contact appears in the student's history immediately after handoff.
2. The logged rule id is what WO-4.5's cooldown matches on, and suppression follows.
3. Log entries are never edited or deleted.
4. The UI is honest about what "logged" means given `mailto:` cannot confirm delivery.
5. Contact history is presentation-mode safe — a projected history of behavior contacts is a disclosure.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

