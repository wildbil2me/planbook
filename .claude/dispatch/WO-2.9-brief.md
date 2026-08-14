# WO-2.9 — Pass banner, overdue alerts, and history · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.9-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the **Opus** tier. The deciding signal is acceptance line 5 —
presentation mode is on `ROUTING.md`'s never-delegate list, and this work order says outright that
the history view is the pass surface that most needs it; the Roll Call! report-modal lift is a second
independent reason. Runner-up considered and set aside: the elapsed-minutes math and the two alert
thresholds are specified arithmetic that would look Codex-shaped on their own, but that is one
deliverable of three and either sensitive-surface reason disqualifies delegation regardless.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.9 — Pass banner, overdue alerts, and history

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-13 · **Size** M · **Depends on** WO-2.11

**Why it exists.** Cut from Ship 1 deliberately: WO-2.8 makes the daily flow work, and everything
here is what makes it comfortable. The data is recorded either way, so these views can follow
without losing any of it.

**The banner itself moved to WO-2.11** on 2026-08-07, because cancel needed a surface to live on and
the 160px pass column had no room for one. What came forward was the card — name, type, time out,
Return and Cancel — and nothing else. **What stayed here is the hard half**, which is why this work
order is still M and still carries the Traps section below.

**Deliverables**
- **The elapsed clock on WO-2.11's card**, computed from the stored timestamp on every render. This
  is the piece the banner shipped without, and the Traps section is the reason.
- **Two escalating overdue alerts**, per Roll Call!'s configurable `alertOneMin` / `alertTwoMin`.
- **A pass history view**, per student and per class, reading the append-only log. This is the
  Planbook half of Roll Call!'s report modal — its `Student Report` carries a **Hall Pass History**
  table (`src/dashboard.html` ~4718: date, type, out, back, minutes, note) and its `Hall Pass
  Summary` tab is the per-class view (~4803). Both are worth reading before designing this.
- Presentation-mode safe, **and this view is the one that most needs it**: presentation mode is a
  parent-teacher-night tool, and a pass history is exactly what gets read beside a guardian. It
  obeys [`../../src/supports.js`](../../src/supports.js) like every other surface that names anyone.
  *(WO-2.11's banner deliberately does not — see the decision recorded there. That decision rests on
  passes and presentation mode never overlapping, which is true of a live class and **not** true of
  this view.)*

**Acceptance**
- [ ] Elapsed time is correct after the app has been backgrounded for ten minutes. 👤 *(See Traps.)*
- [ ] Both alerts fire once each, not repeatedly, and not again after the student returns.
- [ ] The history view's totals match the log; a hand count of one student's passes agrees.
- [ ] A cancelled pass appears in no history view and in no total — WO-2.11 writes nothing, and this
      is the work order that would notice if that stopped being true.
- [ ] Presentation mode suppresses names in the history view.

**Traps** — **iOS suspends timers when Safari backgrounds a PWA.** An elapsed counter that ticks
will read "2 minutes" after twenty, and it will do it silently. Compute elapsed from the stored
timestamp on every render; never accumulate. Same class of bug as the eviction hazard in
`CLAUDE.md` — correct on a desktop, wrong on the device this ships to.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/supports.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**In this repo — the surface you are extending, not inventing:**

- `src/passes.js` (338 lines) — the whole pass model, and the only source of pass truth. It already
  exports `openPassesFor(doc, classId)`, `passesIn(doc)`, `minutesBetween(out, back)`, `passType()`,
  `PASS_TYPES`, `MAX_OPEN_PASSES`, `openPass` / `closePass` / `cancelPass` / `reopenPass`,
  `notePass`. **Read all of it before writing a line.** The elapsed clock and both history views read
  this module; do not compute minutes a second way, and do not add a parallel store.
- `src/attendance.js` (3710 lines) and `src/attendance.css` (1319 lines) — where WO-2.11's
  active-pass banner card is rendered and styled. The elapsed clock lands **on that card**. Find its
  render path and extend it; the card's one-row-at-the-cap-of-three property in both orientations is
  measured and was paid for with two iPad sittings (WO-2.11 acceptance line 3) — do not break it.
- `src/supports.js` (350 lines) — the presentation-mode visibility switch. Read its header. This is
  the one gate acceptance line 5 is about, and every surface that names anyone asks it.
- `src/presentation.js` — `refreshPresentationChrome()`, `togglePresentationMode()`.
- `src/attendance-report.js` (559 lines) — the nearest existing report surface, and its file header
  already argues the `supports.js` rule for reports. **Match its conventions rather than inventing a
  report shape.** `src/detail.js` (823 lines) is the per-student surface; decide there vs. a modal on
  the evidence, and say which you chose and why.
- `src/live-region.js` — Roll Call! announces overdue alerts through a live region (see below). If
  you do the same here, the announcement text names a student out loud; think about it rather than
  copying it unexamined.
- `src/prefs.js` — `PREFIX = 'planbook_'`, `PREF_DEFAULTS`, `getPref` / `setPref`. If the two alert
  thresholds are configurable, this is where a **UI preference** lives. Student data never does.
- `docs/data-model.md` § log — the append-only rule the history view reads, and where the `passes` /
  `openPasses` shapes and the `note` key are recorded.
- `TESTING.md` — the gate. Add lines for what you build; mark 👤 anything needing a real device.

**The two work orders this sits directly on top of**, in
`plans/work-orders/phase-2-attendance.md` — read both in full:

- **WO-2.8** (line 451) — issue, hold, return, the cap of three, the survive-a-force-quit rule.
  Note its deliberate omission: **nothing expires a stale pass**, because inventing a return time is
  the same sin as inventing a tardy's `at`. Your alerts notify; they must not close anything.
- **WO-2.11** (line 739) — the card you are adding the clock to, and its recorded decision that
  **presentation mode is deliberately NOT handled on the banner**. That decision stands. Your
  presentation-mode obligation is the **history view** only. Do not "fix" the banner while you are in
  there — it is out of scope, it is a decision already argued, and undoing it fails the work order
  however sensible the diff looks. If the clock's arrival genuinely changes that calculus, say so in
  your result file as a proposed follow-up work order; do not act on it.

**Roll Call!, the reference implementation** —
`C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App`. Per `CLAUDE.md`: **lift the
design with the function — copy, don't re-derive.** WO-2.11's banner was re-cut once precisely
because it kept the card's shape and invented everything else.

- `src/dashboard.html` ~4718 — **Hall Pass History** table on the Student Report: date, type, out,
  back, minutes, note. `.sr-pass-note` is where WO-2.11's `note` field was built to surface.
- `src/dashboard.html` ~4803 — **Hall Pass Summary** tab, the per-class view.
- `src/dashboard.html` ~3439 `renderActivePassBanner()` — where the elapsed clock sits on the card,
  which is the layout question you do not have to answer from scratch.
- `src/dashboard.html` ~1659 — `alertOneMin: 5`, `alertTwoMin: 10` are the defaults; ~3528–3536 is
  the firing logic, and note **the fired-ness is state on the pass** (`pass.alertFired.five` /
  `.ten`) rather than a re-derivation. Acceptance line 2 is exactly about that state being right.
- `design/style-guide.md` and `design/portable-components.md` — measurements and colours, copied not
  re-derived. Colours inline here, no CSS variables, no dark mode.

**Four things to get right, stated because they are the ones that go wrong:**

1. **Never accumulate elapsed time.** Compute it from the stored `at` timestamp on every render.
   This is the Traps section and the reason this work order stayed M. A ticking counter is correct
   on your desk and wrong on the iPad this ships to, silently.
2. **"Fires once each" needs state, and that state must not be a ticking accumulator either.**
   Whatever remembers that alert one already fired must survive a re-render, must reset when the
   student returns, and must not resurrect on the next render because elapsed is still over the
   threshold. Acceptance line 2 has three clauses — once each, not repeatedly, not after return.
3. **A cancelled pass must be invisible to every total.** WO-2.11 writes nothing to `passes` on
   cancel, so if your history reads `passes` this is free — which is the point of acceptance line 4.
   Prove it with a check rather than by reasoning about it; you are the work order that would notice
   if `cancelPass()` ever started writing.
4. **Acceptance line 1 is 👤 and you cannot close it.** Ten minutes of a real backgrounded PWA is not
   something a headless browser has. Build the property correctly, say in your result what desk-side
   evidence you have for it, and leave the box `- [ ]`.

**Out of scope** (WO-2.8's and WO-2.11's own lines, still binding): printing a physical pass; pass
data as a Phase 4 signal; expiring or auto-closing a stale pass; cancelling a pass already returned;
presentation-mode handling for WO-2.11's banner card.

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

1. Elapsed time is correct after the app has been backgrounded for ten minutes. 👤 *(See Traps.)*
2. Both alerts fire once each, not repeatedly, and not again after the student returns.
3. The history view's totals match the log; a hand count of one student's passes agrees.
4. A cancelled pass appears in no history view and in no total — WO-2.11 writes nothing, and this is the work order that would notice if that stopped being true.
5. Presentation mode suppresses names in the history view.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

