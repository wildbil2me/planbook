# WO-1.48 — a date field cannot tell mid-typing from cleared, and the app infers it anyway · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.48-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at **Opus**. Two entries in the Claude column decide it, either
sufficient alone: one of the ten fields is the roster's **supports review date**, which is read under
presentation mode, and the work order states there is **nothing to lift from Roll Call!** — so this
Clear is new visual language in this repo, with a 44px ruling to make and five unlike surface layouts
to survive. Set aside: the mechanical half (a button ten times, one listener deleted) reads
Codex-shaped, but the judgment is the whole of the risk, and the proof budget for the structural
Acceptance line would not sit comfortably inside the 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.48 — a date field cannot tell mid-typing from cleared, and the app infers it anyway

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-06 · **Size** M · **Depends on** WO-1.47 · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Booked 2026-09-03 alongside WO-1.47, owner-directed. It adds a
control the app has never had, but it adds it to fix a defect, so it closes nothing that was
promised.)*

**Why it exists.** WO-1.47 stops the app eating the field a teacher is typing into. It does not
remove the reason it could: **a native date input reports `''` both for *mid-typing, not yet a
complete date* and for *deliberately emptied*, and hands the page nothing to tell them apart.** Every
repair that keeps inferring *she cleared it* from an empty value is arguing with that ambiguity
rather than removing it, so WO-1.47's `0` is one instance of the defect and not the whole of it.
**This row removes the ambiguity instead of guarding against it.**

**What to build.** An explicit **Clear** beside each of the **ten** date fields, which sit on five
surfaces and are driven by five `*DateBlurred()` handlers. The picker reset hangs
off that button — where focus is on the button and there is no caret to take — and the `focusout`
rebuild WO-1.47 installed comes back out, so **no code path infers a clear from a value at all.**

**Three things it buys that the guard does not.**

1. **It is strictly better on the iPad, not merely equal.** The reset lands at the moment of
   clearing, so the next tap on the same day is on a fresh element — which is the case WO-1.47
   knowingly gives up.
2. **It is the first time this app offers the gesture.** The native popover on iPadOS gives a teacher
   no obvious way to empty a date; clearing means finding the segments and backspacing them.
3. **It closes the class of bug rather than the instance.** `0` was found by a teacher on day two of
   the term. Nothing says it is the only empty read Chromium, WebKit or a future browser produces.

**There is nothing to lift, and that is worth knowing before the drawing starts.** Roll Call! has the
same kind of field — term start and end, and the report print date, all `config-date` — and it has
**no clear affordance and no rebuild of any kind**. So `CLAUDE.md` § *Lift the design with the
function* has no counterpart to offer and this control is new design in this repo, which is the
departure that section asks be stated rather than discovered. **That absence is also evidence:**
Roll Call! is in daily classroom use with the same native fields and does not have WO-1.47's bug,
because it never replaces the element.

**Traps**

- **44px, and the small ✕ is the shape that will argue with it.** `@media (pointer: coarse)` is the
  rule; `src/calendar-view.css`'s 28px month chip is the owner's single ruled departure and **is not
  a precedent** (`CLAUDE.md` § Conventions). A new control gets 44, or it gets its own reading on
  hardware and its own note at its own point of departure.
- **Ten fields across five surfaces, and they do not all live on the same kind of surface.** Two
  sit in the assignment editor, two in the term editor, one on the roster's supports panel, two in
  the days-off form and three in the events form. A layout that works beside a wide field in a modal
  may not survive the `.config-date-range` pairing. Read all ten before drawing one.

  *(**This bullet said* **Five fields** *until 2026-09-06, over an enumeration that has always summed
  to ten, and* `**What to build**` *and two Acceptance lines carried the five with it. Corrected
  against the tree:* `dateField(assignment, 'assigned'|'due')` *and* `dateField(cls, term,
  'start'|'end')` *are built dynamically, and* `supportsReviewDate`*,* `daysOffFrom`*,* `daysOffTo`*,*
  `eventFrom`*,* `eventTo` *and* `eventUntil` *are static in* `index.html` *— 2 + 2 + 1 + 2 + 3.*
  **Five was never the number of fields; it is the number of surfaces and the number of**
  `*DateBlurred()` **handlers**, *which is why the 44px line reading "all five surfaces" was right
  while the line above it was wrong.* **The failure this would have produced is the dangerous kind:**
  *five Clears satisfies the old line 1 literally, ticks the box, and leaves five date fields without
  one — a work order passing its own Acceptance while delivering half the fix.* **It is the**
  `WO-1.40`/`WO-1.42`/`WO-1.45`/`WO-1.49` **shape for the fifth time** *— a hand-typed number in prose
  that nothing checks — and the fifth instance was found in the work order rather than in the code,
  which is the only reason it cost nothing. Nothing in the repository can catch this class inside a
  work order's own prose;* `--audit` *reads header fields and roadmap fragments, and* `--tick` *reads
  checkbox state, and neither counts anything a sentence claims.)*
- **A review date is accommodation-adjacent.** The roster's field sits in the supports panel, so
  whatever the control says and however it is labelled is read under presentation mode. Nothing new
  may be disclosed by its presence — see `src/supports.js` and `CLAUDE.md` § Accommodations.
- **Bump `CACHE` in `sw.js`.** This edits `index.html`, which is entry one of `SHELL`; without the
  bump no device sees the change at all.
- **The sweep's own count is a fourth thing to keep in step.** If this row adds a `wo-sweep.mjs`
  section asserting no date field is replaced outside a Clear handler, `tools/README.md`'s recorded
  check count moves with it or § 22 goes red (WO-1.42).

**Acceptance**
- [ ] Each of the **ten** date fields carries a **Clear** — two in the assignment editor, two in the
      term editor, one on the roster's supports panel, two in the days-off form and three in the
      events form — and pressing it empties the field, writes the empty value, and leaves a live
      element in the panel.
- [ ] **No code path rebuilds a date field from a `change` or `focusout` value being empty.** The
      reset happens on the Clear and nowhere else, asserted structurally rather than by fixture — the
      shape `wo-sweep.mjs` § 17 uses for *this file holds no writer*.
- [ ] WO-1.47's three Acceptance drives still pass unchanged: `0` as a first digit costs neither the
      element nor the date, in the month segment and in the day.
- [ ] 👤 On the iPad, after a force-quit: **clear a date and tap the same day again without leaving
      the field**, and it takes. This is the case WO-1.47 wrote down as failing, and the reason this
      row exists.
- [ ] 👤 Every one of the ten Clears is reachable under a thumb at 44px, on all five surfaces, in
      portrait.
- [ ] `node tools/verify-shell.mjs` is green, `node tools/wo-sweep.mjs` is green, and
      `node tools/wo-gate.mjs --audit` is green on a clean tree.
- [ ] `TESTING.md` gains a § WO-1.48, and `CHANGELOG.md` records the new control.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/calendar-view.css`
  - `src/supports.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Where the ten fields actually are — read all ten before drawing one.** Four are built
dynamically: `dateField(assignment, 'assigned'|'due')` and `dateField(cls, term, 'start'|'end')`.
Six are static `<input type="date">` in `index.html`: `supportsReviewDate` (:3225),
`daysOffFrom` (:3587), `daysOffTo` (:3593), `eventFrom` (:3718), `eventTo` (:3724),
`eventUntil` (:3736). 2 + 2 + 1 + 2 + 3 = ten fields on **five** surfaces driven by **five**
`*DateBlurred()` handlers. Those line numbers are a 2026-09-06 reading, not a promise — re-derive
from the tree.

**The listener that comes out.** `document.addEventListener('focusout', …)` at
`src/shell.js`:3246 routes the five `*DateBlurred()` calls and writes nothing else, so it goes
with the rebuild. Check that claim against the file before deleting it.

**Two things deliberately out of scope.** WO-1.49 is booked to repair `src/shell.js`'s
"Three other document-level listeners" census and expects your delete to move it — **do not repair
that comment here**, and do not rewrite WO-1.49's own prose. And WO-1.47's parenthetical in
`plans/known-bugs.md` § 1 is evidence with a date on it; leave measurements you did not take alone.

**Two harness notes.** `node tools/verify-shell.mjs` takes ~4.4 minutes a run and accepts
`--today=YYYY-MM-DD`. If you add a `wo-sweep.mjs` section, `tools/README.md`'s recorded check
count moves in the same edit or § 22 goes red.

**If you insert a mutation to prove a check non-vacuous, revert it before you write a line of prose.**
Four dispatches here have died holding one, with every box already ticked over armed code.

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

1. Each of the **ten** date fields carries a **Clear** — two in the assignment editor, two in the term editor, one on the roster's supports panel, two in the days-off form and three in the events form — and pressing it empties the field, writes the empty value, and leaves a live element in the panel.
2. **No code path rebuilds a date field from a `change` or `focusout` value being empty.** The reset happens on the Clear and nowhere else, asserted structurally rather than by fixture — the shape `wo-sweep.mjs` § 17 uses for *this file holds no writer*.
3. WO-1.47's three Acceptance drives still pass unchanged: `0` as a first digit costs neither the element nor the date, in the month segment and in the day.
4. 👤 On the iPad, after a force-quit: **clear a date and tap the same day again without leaving the field**, and it takes. This is the case WO-1.47 wrote down as failing, and the reason this row exists.
5. 👤 Every one of the ten Clears is reachable under a thumb at 44px, on all five surfaces, in portrait.
6. `node tools/verify-shell.mjs` is green, `node tools/wo-sweep.mjs` is green, and `node tools/wo-gate.mjs --audit` is green on a clean tree.
7. `TESTING.md` gains a § WO-1.48, and `CHANGELOG.md` records the new control.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

