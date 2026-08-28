# WO-4.5 — Cooldown & the quiet middle · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-4-signals.md`
**Report to** `.claude/dispatch/WO-4.5-result.md` — as your last act, and return it in-band too.

**Routing decision — Claude Opus, on the work order's own merits.** It lands in ROUTING.md's Claude
column three times over: it introduces new visual language (a suppressed row, *Write anyway*, the
quiet-middle panel), it carries two owner rulings from 2026-08-20 whose entire value is in honouring
the argument behind them rather than the behaviour, and it reads `log[]` — where the `kind`/`audience`
filter is the only thing standing between a behavior note and something counted as outreach. The
runner-up I set aside: the cooldown arithmetic itself (student + rule, N days off the log) is
genuinely Codex-shaped and specified in `docs/data-model.md` § Cooldown, but it is one of four
deliverables and the other three are screen and copy.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-4.5 — Cooldown & the quiet middle

**Ship** 3 · **Status** 🤖 CLAIMED — 2026-08-27 · **Size** M · **Depends on** WO-4.2, WO-4.3
**Closes roadmap** Phase 4 → "Contact cooldown" and "The quiet middle."

**Why it exists.** Without the cooldown the list is identical every week, the teacher stops reading
it, and the feature dies — quietly, and without anyone deciding to kill it. The quiet middle is the
other half of the same insight: the students a busy teacher genuinely loses track of are neither
failing nor excelling, and no threshold will ever surface them.

**Deliverables**
- Cooldown: read the outreach `log`, suppress any student contacted about the same signal within
  N days (default 14). Configurable, per the thresholds block.
- Suppressed hits are **hidden, not deleted** — a way to see "3 suppressed by cooldown" and expand.
- The quiet middle: students neither flagged, nor praised, nor contacted all term, listed per class
  with how long it's been.
- Both surfaced on the home screen slot from WO-1.10.

- **Surface: the foot of each of WO-4.2's two columns, and a panel for the quiet middle** — drawn in
  [`design/mockups/signals.html`](../../design/mockups/signals.html). A suppressed row **names the
  contact that silenced it and the date it comes back**, because "3 suppressed" with no names is
  indistinguishable from a list that has quietly lost three students. The quiet middle is a **third
  list and not a third column**: it is ranked by how long it has been rather than by delta, and
  putting it beside two columns that share a ranking would imply it shares one.
- **Decided: *Write anyway* exists** *(the owner, 2026-08-20)*. The cooldown suggests; it does not
  hold the door shut. What keeps it from dissolving the cooldown is **where it sits** — quiet, at the
  end of a muted row, behind an expansion the teacher opened on purpose: three deliberate acts
  against one tap for the rows the engine wants read. A teacher who has just had a phone call has a
  real reason to write again, and a feature that tells her she may not is one she routes around
  outside the app.
- **Decided: the quiet middle is a panel on WO-4.2's screen** *(the owner, 2026-08-20)*. Under the
  two columns, so that view has one state and the switcher never has to say which of two you are on.
  **The consequence is WO-6.4's:** the glance page's `The quiet middle · N` control is a **door onto
  that screen**, landing there and scrolled to this panel — not a surface of its own and not a modal.
  One list, one place, two ways in.

**Acceptance**
- [ ] Logging a contact about a concern removes that student from that signal for 14 days and not
      from other signals.
- [ ] The cooldown reads the log rather than a separate suppression store — verify by restoring a
      backup and confirming cooldowns survive.
- [ ] The quiet-middle list excludes anyone flagged, praised, or contacted this term.
- [ ] 📆 Two consecutive weekly runs on real data produce visibly different concern lists.
- [ ] Suppressed hits are recoverable and counted, never silently dropped.

**Traps** — Cooldown keyed on the student rather than the *signal* will hide a new problem because
you emailed about an old one. Key on `student + rule`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/signals.html`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open before writing:

- `src/signals.js` — the engine. Its header states two rules this work order lives inside: it holds
  **no writer of any kind**, and a rule is handed its own measured numbers and nothing else. The
  `cooldown` block near line 250 already declares `cooldownDays` (def 14) with its settings copy.
- `src/signals-view.js` and `src/signals-view.css` — WO-4.2's screen. **The stylesheet already
  reserves your class names** (`.sig-hidden`, `.sig-muted`, `.sig-undo`, `.sig-quiet-note`,
  `.sig-since`, near line 17). Use them; do not invent a parallel set.
- `src/log.js` — read the whole header. It is the firewall.
- `docs/data-model.md` § Cooldown (~line 549) and the `log` shape (~line 142).
- `design/mockups/signals.html` §§ "The cooldown, expanded" (~line 360) and "The quiet middle"
  (~line 546), with `design/mockups/proposed-phase4.css` ~lines 300 and 325.

## 2b. Four things that will bite, and one you must decide out loud

1. **Nothing in the app writes a `contact` entry yet, and the schema has nowhere to put the rule.**
   `docs/data-model.md` line 142 gives `{ id, studentId, at, kind, audience, subject, body }` — no
   field naming the signal. WO-5.3 owns the writer and says it will store "the signal rule that
   prompted it." So the cooldown you are building reads a field that does not exist. **Resolve this
   explicitly and say so in your result file**: name the field, document it in `docs/data-model.md`
   § log so WO-5.3 fills the same one, and make the reader tolerate its absence. **Do not build
   Phase 5's outreach flow** to satisfy Acceptance line 1 — that is widening the work order. If a
   minimal test path is unavoidable, argue for it in the result file rather than shipping it quietly.
2. **No suppression store, and no `was contacted` bit.** Acceptance line 2 is the whole design: the
   suppression is derived at read time from `log[]`, which is why restoring a backup restores the
   cooldowns for free. `newYearDocument()` gains nothing. Same shape as WO-4.3's turnaround rule.
3. **The threshold rule.** An absent key IS its default — read `cooldownDays` through
   `thresholdsOf()`, never off `doc.signals`.
4. **Presentation mode has exactly one asker.** WO-4.2's screen already refuses under a projector and
   `src/supports.js` owns the visibility rule. Your panel inherits that; adding a second
   `presentationMode()` test is the second opinion `wo-sweep` counts.

And the trap the work order states in one line, restated because it is the whole feature: **key on
`student + rule`, never on the student.** A cooldown on the student hides a new problem because she
was emailed about an old one.

**One last-mile note.** If your change alters a count that `tools/README.md` records about the
harnesses, update it in the same sitting — a stale count there is the one `wo-sweep` line that goes
red on work being *done* rather than wrong (the WO-3.26 scar). And leave no scratch files under
`tools/`.

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

1. Logging a contact about a concern removes that student from that signal for 14 days and not from other signals.
2. The cooldown reads the log rather than a separate suppression store — verify by restoring a backup and confirming cooldowns survive.
3. The quiet-middle list excludes anyone flagged, praised, or contacted this term.
4. 📆 Two consecutive weekly runs on real data produce visibly different concern lists.
5. Suppressed hits are recoverable and counted, never silently dropped.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

