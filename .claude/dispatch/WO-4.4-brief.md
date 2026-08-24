# WO-4.4 — Behavior & note logging · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-4-signals.md`
**Report to** `.claude/dispatch/WO-4.4-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to **Claude Opus** on its own merits, not by fallback. The deciding
signal is that it lands in the never-delegate column twice: it must shape a new attendance-clause
field on `students[].supports` — accommodation/plan data, and a change to `docs/data-model.md` — and
it must get presentation-mode suppression right, where behavior entries are **absent** from the DOM
while notes-to-self stay. The runner-up consideration set aside: the append-only `log[]` write is an
append against a schema already settled in `docs/data-model.md` at size `S`, which reads Codex-shaped
on the arithmetic alone — but the sensitive surface rule is absolute and the one still-open design
question sits inside it.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-4.4 — Behavior & note logging

**Ship** 3 · **Status** 🤖 CLAIMED — 2026-08-24 · **Size** S · **Depends on** WO-1.7
**Closes roadmap** Phase 4 → "Behavior/note logging fast enough to do mid-class."

**Why it exists.** The behavior signals have no input without it, and a logging flow that takes
thirty seconds will never be used during a class period.

**Deliverables**
- Append to `log[]` per the data model: `{ id, studentId, at, kind, audience, subject, body }` with
  `kind: "behavior" | "note"`.
- **Append-only.** Roll Call! made hall passes append-only after matching rows by `name + time`
  proved fragile; same reasoning, same answer. Corrections are new entries, not edits.
- Two taps from a class roster to a logged entry, with optional detail.
- Log visible on the student record, newest first.

- **Surface: a modal sheet off the roster row, and a card on the student record** — drawn in
  [`design/mockups/behavior.html`](../../design/mockups/behavior.html). The door is on the **roster**
  and deliberately not on the attendance registry: that row is the critical path by the working
  agreements, and a fourth control on it competes with the tap that marks a student present. Two taps
  means the quick entries write a **complete** record on their own — kind from the strip, subject from
  the chip, time now — with the two fields under them as this work order's "optional detail". The
  drawing also settles that the record card is another `.detail-card` on WO-3.7's screen, newest
  first, and that it is **absent rather than redacted** in presentation mode: a card that redacts its
  bodies still tells a room of thirty that four things have been written down. The suppression is
  asked of `src/supports.js` and not tested here — two askers is two answers eventually.
- **Decided: six pre-written quick entries, and one rule that keeps the back door open** *(the
  owner, 2026-08-20)*. They ship fixed, needing no schema — and **a chip writes a `subject` and never
  a code.** That single constraint is what makes a per-teacher list later a settings block and a
  picker rather than a migration: a written entry is indistinguishable from a typed one the moment it
  lands. The six, in this order: *Off task · Phone out · Disruptive · Showing improvement · Great
  contribution · Helped someone*. **Both directions belong in this sheet** and the middle ground sits
  fourth, which is the first slot after the conduct entries and the one a thumb reaches without
  reading to the end — the phase's own argument at chip scale.
- **Decided: append-only stands, and there is no correction mechanism to build** *(the owner,
  2026-08-20, after a round trip)*. A correction is **an ordinary later entry that says so**: no
  `correctsId`, no strikethrough, no schema change, and no rule about which of two entries a reader
  should believe. The ruling first arrived as *"don't worry about corrections — you can just delete
  and re-enter"*, which would have reversed this work order's Append-only deliverable, its acceptance
  line *"entries are never mutated or deleted"*, and `docs/data-model.md` § log in one move. Put back
  to the owner the same day and settled the other way. **Nothing in the log is deletable**, the Roll
  Call! hall-pass scar behind that rule is untouched, and the acceptance line below stands as written.
- **Decided: behavior entries and notes part company under a projector** *(the owner, 2026-08-20)*.
  Behavior entries are **not built** in presentation mode — absent from the DOM, WO-1.9's standard,
  not redacted and not counted. **Notes to self stay**: they are the teacher's working memory and
  suppressing them costs her the half of the card that has nothing to do with conduct. The card
  therefore survives with fewer entries and **no "2 hidden" line**, because a count is the
  disclosure. Two consequences for the build: `src/supports.js` still owns the answer and the card
  still asks rather than testing presentation mode itself, so what changes is the shape of what the
  model hands back; and the **kind strip comes before the words** in the sheet, which is what makes
  "this may end up on a wall" a decision rather than an accident.
- **Decided: *N* is the attendance rule's own N** *(the owner, 2026-08-20)*. **No new threshold
  key.** The prompt fires on the number *N absences within the last N meetings* already uses — `4` by
  default, and whatever the teacher has since made it — read through `thresholdsOf()` like every
  other. A teacher who loosens her attendance signal loosens this prompt with it, and the two can
  never disagree about what "too many" means.
- **Still open, and it is the field rather than the screen.** `students[].supports` has no
  attendance clause for the prompt to read: is it a free-text field beside the existing ones, or a
  kind of its own? This work order owns the answer and it changes `docs/data-model.md`. The component
  is not in question — the drawing wears WO-3.8's shipped `.accommodation-prompt` whole, same
  sentence-then-scope shape, same single reveal, same hard suppression in the projected and print
  paths.

**Acceptance**
- [ ] An entry is logged in under five seconds from the roster.
- [ ] Entries are never mutated or deleted — verify by inspecting the document after a "correction".
- [ ] Behavior entries feed WO-4.2's behavior rule and the count matches.
- [ ] Behavior notes are suppressed in presentation mode.
- [ ] Marking a student absent for the Nth time surfaces an attendance-related plan clause if one
      exists, and nothing appears in presentation mode. *(Re-homed from WO-3.8, 2026-08-13. That work
      order built the accommodation prompt in the assignment editor and could not build this half:
      `supports` has no attendance-clause field to read and `signals` has no threshold to compare
      against, so the clause and its N are both this work order's to shape. `src/attendance.js` and
      its counts have shipped — the behavior log was never what it was waiting on.)*

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/behavior.html`
  - `docs/data-model.md`
  - `src/attendance.js`
  - `src/supports.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `design/mockups/behavior.html` **and** `design/mockups/PROTOCOL.md` — the drawing settles the sheet,
  the six chips, their order, and the record card. Lift it; do not re-derive it.
- `src/accommodation-prompt.js` — WO-3.8's shipped `.accommodation-prompt`. The work order says the
  component is **not in question**: wear it whole, same sentence-then-scope shape, same single reveal,
  same hard suppression in the projected and print paths.
- `src/supports.js` — the single owner of "may this be shown". The card and the prompt **ask** it;
  neither tests `presentationMode()` itself. Two askers is two answers eventually.
- `src/signals.js` — read `behaviorWindow` (~line 745) and `inertRules()`. That rule is shipped and
  **inert by construction**, and Acceptance line 3 is what un-inerts it. Read the comment block above
  it (~lines 720–745) before touching anything: it already states what shape of entry it intends to
  count.
- `src/roster.js` — the door lives here, deliberately **not** on the attendance registry. `src/detail.js`
  and `src/detail.css` — the record card is another `.detail-card` on WO-3.7's screen.
- `src/attendance.js` — shipped, with its counts. Acceptance line 5's prompt fires off marking absent.
- `src/store.js` and `src/modal.js` — the document write path and the modal convention.
- `docs/data-model.md` — read § log (the schema block ~line 135 **and** the append-only rule ~line 245),
  and § Accommodations (~line 381). Note carefully that `log` is described there as the **outreach**
  record Phase 4's cooldown reads and Phase 5's `{{behavior.recent}}` renders into an email. Your new
  entries share that collection, so a `kind` filter is the only thing standing between a behavior note
  and an email home — say in your report where that filter lives.
- `thresholdsOf()` in `src/signals.js` — Acceptance line 5's *N* is the attendance rule's own N,
  **no new threshold key**. An absent key IS its default.

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

1. An entry is logged in under five seconds from the roster.
2. Entries are never mutated or deleted — verify by inspecting the document after a "correction".
3. Behavior entries feed WO-4.2's behavior rule and the count matches.
4. Behavior notes are suppressed in presentation mode.
5. Marking a student absent for the Nth time surfaces an attendance-related plan clause if one exists, and nothing appears in presentation mode. *(Re-homed from WO-3.8, 2026-08-13. That work order built the accommodation prompt in the assignment editor and could not build this half: `supports` has no attendance-clause field to read and `signals` has no threshold to compare against, so the clause and its N are both this work order's to shape. `src/attendance.js` and its counts have shipped — the behavior log was never what it was waiting on.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

