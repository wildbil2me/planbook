# WO-6.5 — A tapped day opens on that day · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-6-calendar-glance.md`
**Report to** `.claude/dispatch/WO-6.5-result.md` — as your last act, and return it in-band too.

**Routing decision (orchestrator, 2026-09-23).** Claude, at **Opus** (no model override). The deciding signal is the surface: this changes how the attendance register — the critical-path screen five classes are marked on every morning — decides which day it opens on, inside an anchor/edit-date model (`anchorDate()` / `focusDate()` / `editDate()` / `pageDaysBack` / `editingDay`) that has been re-cut by WO-2.1, 2.12, 2.17, 2.50–2.54, and both Traps are judgment traps rather than mechanics. Set aside: Codex on size (S) and on mechanically checkable Acceptance — the proof wants a clean `verify-shell.mjs` run plus mutation runs at ~4.4 min each, and the work is in the Claude column on its own merits regardless. The Ship table marks this row 🎒 ride-along; it was taken because the owner named it.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-6.5 — A tapped day opens on that day

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-23 · **Size** S · **Depends on** WO-6.3

Tapping a class's recorded day in the calendar opens that class's register — **on today**, not on the
day that was tapped. Every other item on that screen carries its own subject through the tap: a
grades-due date arrives with its row loaded, a due date with its assignment's editor up, a review with
that student open and the date in the field. This one arrives at the right screen and the wrong day.

**This was read on the device and accepted rather than found later** (2026-08-19, the owner, WO-6.3's
fourth 👤 reading). It is booked because the alternative was leaving it in a dispatch result file and
a code comment at `src/shell.js`, and **a dispatch artifact is not a tracker** — WO-6.3's verifier
said so in as many words, and the artifact is gone from anyone's attention the moment the dispatch is.

**Why it was not simply fixed inside WO-6.3.** `src/attendance.js`'s `editDay()` has no entry point
that takes a date from outside — it reads the day it is on. Giving it one is a change to the
attendance surface, which WO-6.3 had no business making on the way past while it was drawing a
calendar: the register is the screen five classes are marked on every morning, and the flow is on the
critical path by the working agreements. That is a row of its own, not a rider.

**Acceptance**
- [ ] Tapping a recorded day in the calendar opens that class's register **on the tapped day**, with
      that day's marks on screen — not on today, and not on the term's first day.
- [ ] The date arrives through an argument, not through a module-level variable or a `data-` attribute
      read back off the DOM: `editDay()` (or whatever entry point is added beside it) takes the day it
      is to open on, so two callers cannot disagree about which day is current.
- [ ] Opening the register the way it has always been opened — from the class screen, with no date —
      still lands on **today**. The new argument is additive and the old path does not go through a
      date that happens to be right most of the time.
- [ ] A tapped day that is outside the class's current term still opens correctly, or is refused with
      a message that says which term it is in. Silently landing on some other day is the failure this
      row exists to remove.
- [ ] No new state: nothing about *which day the register is on* is stored in the document, in
      `localStorage`, or on `window`. It is an argument and then it is the screen's own business.
- [ ] `verify-shell.mjs` asserts the tapped day and the tapped day's marks, not just that the register
      opened — the check WO-6.3's could not make, which is why its own line passed on *the source* and
      this row exists for *the day*.

**Traps** — The tempting shortcut is to have the calendar write the date somewhere the register reads
on the way up. That is the second truth this phase has refused six times over, at one-value scale: two
places that both believe they know what day the register is on, and the bug is whichever one is read
second. Pass it, or do not build it.

Also resist making the register *navigate* to the day with the term nav after it opens. WO-2.17 is the
scar there — a repaint of the screen you are sitting on is not the same as opening on a day, and a
flash through today on the way is a worse experience than landing on today would have been.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.js`
  - `src/shell.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/calendar-view.js` — `itemAt()` (~line 730) already carries `date` off the tapped chip; the note near line 676 cites this row's Traps.
- `src/shell.js` — `openCalendarItem()` (the `MEETING_STATE` branch, ~line 1560) and its header comment's "WHAT IT DOES NOT DO" paragraph (~1527), which this row discharges — rewrite it, do not leave it describing a gap that is gone. `openClassOn()` (~1597) calls `attendance.resetRegistry()`, the one arrival function.
- `src/attendance.js` — `resetRegistry()` (~4796, the arrival; it rolls the term over on arrival per WO-2.52/2.54), `anchorDate()` / `focusDate()` / `editDate()` (~1740–1800), `editDay()` (~2585), `pageDays()`, and the view-state block around line 1677.
- Existing harness files closest to this: `tools/verify/register-opens-on-term.mjs`, `tools/verify/today-goes-to-term.mjs`, `tools/verify/calendar-drawn.mjs`, `tools/verify/term-nav.mjs`. Extend one of these or add a file under `tools/verify/` in the same shape — no third harness.

**The traps the orchestrator sees, which the work order does not spell out.**

1. **The anchor is derived from the SELECTED TERM and today, and arrival rolls the term.** A tapped day in an earlier term (or the next one) means the register must open with *that date's* term selected, not the one `resetRegistry()` would roll to — and the term tab showing must agree with the column showing. Decide where the tapped date takes precedence over the roll-over and say so at the point of departure.
2. **Portrait shows one column and does not page** (`pageDaysBack` is forced to 0). So "on the tapped day" cannot be achieved by paging to it — the day the strip is built from has to be the tapped day in portrait, and visible in the landscape window. Acceptance 1 is about both orientations; the harness should check at least one of each or say why not.
3. **"Opens on the day" is not "unlocks the day".** A past day is read-only until its ✏ is pressed — that rule dates from WO-2.1 and `editDate()` spends a paragraph defending it. The Acceptance wants the day *and its marks on screen*; whether arrival also unlocks it for writing is a judgment you must make and argue in a comment. The orchestrator's lean is **do not unlock** — a calendar tap is a reading gesture, and a past-day write reachable in one tap from a month grid is the mis-tap the one-column-at-a-time unlock exists to prevent — but if you find the screen cannot put a past day's marks on screen without an unlock, say so in the result rather than choosing silently.
4. **"No new state" is about the document, `localStorage` and `window`.** Once the date has arrived by argument, the register holding it as its own view state beside `editingDay` / `pageDaysBack` is "the screen's own business" in the work order's words — but it must be put back by `resetRegistry()` on every ordinary arrival, or Acceptance 3 (no date → today) goes wrong on the second visit. Test that sequence: tap a day, leave, open the register the ordinary way, land on today.
5. **`Today` must still escape.** Whatever holds the tapped day, the `Today` control and the term nav have to clear it the same way they clear an unlocked column — a day the teacher arrived on is not a day she is pinned to.
6. **No flash through today** (the WO-2.17 Traps line): open, then render once on the right day. A `showClassScreen()` that paints today and then a second call that repaints the tapped day is the failure the work order names.
7. **Acceptance 4, a day outside the class's current term.** "Current" here most naturally means the term that holds today; a recorded day in another term should open on that term (trap 1). A recorded day inside NO term (off-term with a record — `editDay()` notes these exist, WO-2.50 decision 2) must either open or refuse *in words naming where it is*; never land somewhere else silently.
8. **Mutation-prove the date assertion** — e.g. drop the argument at the call site and show the check goes red on "lands on today". Revert every mutation before writing any doc line; `grep -rn MUTATION` over your changed files must be empty before you write the result file.
9. **Bump `CACHE` in `sw.js`** if any `SHELL` file changes (it will: `src/attendance.js`, `src/shell.js`).
10. The 👤 reading (tapping a recorded day on the iPad) is owed to the owner; if you add a `TESTING.md` section, keep its 👤 lines open.

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

## 5. Done means these 6 lines, reported against one by one

1. Tapping a recorded day in the calendar opens that class's register **on the tapped day**, with that day's marks on screen — not on today, and not on the term's first day.
2. The date arrives through an argument, not through a module-level variable or a `data-` attribute read back off the DOM: `editDay()` (or whatever entry point is added beside it) takes the day it is to open on, so two callers cannot disagree about which day is current.
3. Opening the register the way it has always been opened — from the class screen, with no date — still lands on **today**. The new argument is additive and the old path does not go through a date that happens to be right most of the time.
4. A tapped day that is outside the class's current term still opens correctly, or is refused with a message that says which term it is in. Silently landing on some other day is the failure this row exists to remove.
5. No new state: nothing about *which day the register is on* is stored in the document, in `localStorage`, or on `window`. It is an argument and then it is the screen's own business.
6. `verify-shell.mjs` asserts the tapped day and the tapped day's marks, not just that the register opened — the check WO-6.3's could not make, which is why its own line passed on *the source* and this row exists for *the day*.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

