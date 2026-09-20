# WO-5.15 — One contact, several audiences · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.15-result.md` — as your last act, and return it in-band too.

**Routing decision — Claude, at Opus.** Phase 5 outreach is Claude-only by `ROUTING.md`
§ "Later phases at a glance" — a property of the work rather than a runner's record — and the
deciding signal is that this row's first Deliverable is *the decision itself*: what a `contact`
entry records when a draft went to several people, on a field the log's contact/note/behavior
firewall is built out of. The runner-up consideration set aside: Size S over a settled schema with
mechanical acceptance reads Codex-shaped on the surface, but the spec it would implement does not
exist yet — **this work order writes it**, which is the one-line version's Claude half exactly.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.15 — One contact, several audiences

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-20 · **Size** S · **Depends on** WO-5.8

**Why it exists.** **Booked out of the reading, not out of WO-5.8's Deliverables, which never
mentioned it.** `writeContact({ audience })` (`src/outreach-view.js:1417` → `src/log.js:222` →
`:244`) records a **scalar enum**, pinned at `docs/data-model.md:144` as
`"guardian|counselor|admin|student"` and called half a firewall at `:269-270`. Three readers depend
on it: the history chip (`src/contact-history.js:141`), `lastContactAbout()` (`src/log.js:430`,
which is the cooldown WO-5.4 built the input for), and signals-view's sentence *"You wrote to their
guardian about this on Sep 6"* (`src/signals-view.js:667`).

**A draft to two guardians and the counselor has no single value for that field.**

**What WO-5.8 leaves, and why it is not a stopgap.** WO-5.8 lands writing `audienceOf(primary)`,
which is **correct rather than provisional** — the message *is* addressed to the primary, and the
sentence on the signal card is true as far as it goes. It is **incomplete, not false**. This row
decides whether the cooldown and the history should say more, and what.

**Deliverables**
- The decision on what a `contact` entry records when the draft went to several people, and the
  writer changed to match. `src/log.js` holds **no updater and no delete** — append-only is a
  property of what is there, not a promise about it — so whatever is decided is decided on the
  write, and entries already in a teacher's document are never rewritten.
- `docs/data-model.md` updated to state the field's shape under several recipients, whatever that
  turns out to be, in the same sitting as the code.
- Whatever the three readers need to stay honest, without widening the `contact` / `note` /
  `behavior` firewall by so much as one reader.

**Acceptance**
- [ ] A contact written to several recipients records what the cooldown needs to silence the right
      rule and nothing else, and the history card says who it went to.
- [ ] The `kind` filter is untouched: no reader gains a kind, and there is still no exported reader
      that hands back all three.
- [ ] `docs/data-model.md` records the field's shape under several recipients.

**Traps** — **The under-fire posture at the foot of `src/log.js` governs this row.** Praise not sent
is a missed opportunity; **a rule silenced by a message that was never about it is how a teacher
stops trusting the list.** If the decision is ever between silencing too much and too little, it is
too little.

Second: `tools/verify/cooldown-quiet.mjs` reads `entry.audience` off a **planted** record and
`tools/verify/contact-log.mjs` drives the real writer. WO-5.9 closed the loop between them for the
hitless case and proved the writer produces `ruleId: ''` — **empty, not `undefined`, and not
invented.** Do not disturb that while changing the neighbouring field.

Third: an email's subject line on the card headed *"What you have written down"*, under a footer
promising the teacher those notes go nowhere, is one missing filter away. That is why the second
Acceptance line is here and why it is not a formality.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/contact-history.js`
  - `src/log.js`
  - `src/outreach-view.js`
  - `src/signals-view.js`
  - `tools/verify/contact-log.mjs`
  - `tools/verify/cooldown-quiet.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Where WO-5.8 handed this row the question, in as many words.** `src/outreach-view.js:504` carries
a comment headed *"ONE AUDIENCE, AND IT IS THE PRIMARY'S — WO-5.15's, NOT THIS WORK ORDER'S"*, and
`:509` is `outreach.audienceOf(chosen)`. Start there and read outward; the work order's own
"Why it exists" names the other four sites and they are all still accurate.

**The four things the decision has to survive.** Write the ruling as a comment at the point the code
makes it — this repo argues its decisions where they are implemented, and the reader after you gets
nothing from a result file.

1. **`src/log.js` has no updater and no delete, and gains none.** Whatever a multi-recipient contact
   records is decided on the write. Entries already in a teacher's document are never rewritten, so
   whatever shape you choose has to read sensibly beside entries written by every earlier build —
   `newContactEntry()` coerces every field it takes, which is the pattern to stay inside.
2. **The cooldown's posture is under-fire, and it beats tidiness.** `lastContactAbout()`
   (`src/log.js:430`) is what silences a rule. If a choice is between silencing too much and too
   little, it is too little — the Traps line is the ruling, not a preference.
3. **The `kind` filter is the firewall.** No reader gains a kind; no exported reader hands back all
   three. `contactRow()` in `src/contact-history.js` and the *"What you have written down"* card are
   two cards on purpose (WO-5.4) — a subject line crossing into the second is the disclosure the
   second Acceptance line exists to stop, and it is one missing filter away.
4. **`cooldownWhy()` (`src/signals-view.js:667`) must not become a rule's sentence.** Its own header
   argues why it lives on the screen and not on the hit: `hit.explanation` is drafted into mail
   through `{{signals.list}}`, so anything you put on a hit can reach a guardian's inbox. If several
   audiences need naming, name them there.

**Two harness files, and the loop between them is load-bearing.**
`tools/verify/cooldown-quiet.mjs` reads `entry.audience` off a **planted** record;
`tools/verify/contact-log.mjs` drives the real writer. WO-5.9 closed the loop for the hitless case
and proved the writer produces `ruleId: ''` — empty, not `undefined`, not invented. Do not disturb
that while changing the neighbouring field, and keep both halves in step if the shape moves.

**`docs/data-model.md`** pins the field at `:144` as `"guardian|counselor|admin|student"` and calls
it half a firewall at `:269-270`. Both places move in the same sitting as the code — that is the
second Deliverable, not a follow-up.

**Prove the claim that matters with a mutation.** The Acceptance line about the cooldown silencing
the right rule *and nothing else* is the one worth mutating: break the writer's new field, show the
harness go red at a named check, put it back. **Revert the mutation before you write anything
else** — five dead dispatches in this repo's history shipped live mutations under ticked boxes, and
`grep -rn MUTATION` over your own changed files is the last thing you run.

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

## 5. Done means these 3 lines, reported against one by one

1. A contact written to several recipients records what the cooldown needs to silence the right rule and nothing else, and the history card says who it went to.
2. The `kind` filter is untouched: no reader gains a kind, and there is still no exported reader that hands back all three.
3. `docs/data-model.md` records the field's shape under several recipients.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

