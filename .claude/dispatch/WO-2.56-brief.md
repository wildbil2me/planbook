# WO-2.56 — the strip above the attendance grid moves under the pointer · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.56-result.md` — as your last act, and return it in-band too.

**Routing (2026-09-28): Claude Opus.** The deciding signal is the judgment trap the work order names itself — `paintActions()` and `paintBanner()` would both write the state line, and choosing the owner (and saying so at the function) is a design decision, not a transform; it also produces teacher-facing wording on the marking screen and rewrites a precedence argument (WO-2.52) rather than trimming it. Set aside: the harness arithmetic (one clean run plus two mutation runs, ~13 min at ~4.4 min/run) would fit Codex's 20-minute cap, but the work order is in the Claude column on its merits, and the budget never decides the tier.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.56 — the strip above the attendance grid moves under the pointer

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-28 · **Size** M · **Depends on** WO-2.10 — the unconfirmed note this moves; WO-2.52 — the band precedence this narrows; WO-6.5 — the arrival band it re-homes
**Closes roadmap** *(no box. Three layout defects on the marking screen, found by the owner on 2026-09-28 in daily use.)*

**Booked 2026-09-28**, owner-directed, as one work order on purpose. The three defects share a cause
and a fence: **something above the grid appears, disappears or moves while the teacher's pointer is on
its way to the next control.** One set of measurements proves all three. Split, each piece could pass
while the strip as a whole still jumps.

**What is wrong.**
1. **The unconfirmed note pushes the grid down on the first tap.** `paintActions()` (`src/attendance.js`
   ~4258) un-hides `#attendanceNote` the moment `summary.unconfirmed` is non-zero: *"12 students have
   no mark yet, and count as absent until you confirm them. Tap a question mark once for present."*
   Every row moves down under the finger aimed at the second student, and moves back up when the last
   `?` goes. The amber state line above it already says *"12 unconfirmed"*, so the sentence repeats it.
2. **Paging or unlocking pushes the pager down under the pointer.** `paintBanner()` (~4020) un-hides
   `#attendanceBanner`, which sits **above** the state line (`index.html` ~776), on the first
   `◀ Earlier`. The pager moves down and the second click lands on whatever moved into its place. The
   band's own *"Back to today"* button (~4079) duplicates the pager's `Today`, which lights up at the
   same moment.
3. **The pager's buttons are split across the width and read as misaligned.** `◀ Earlier` sits alone
   at the left edge; `.attendance-pager-range` carries `margin-right: auto` (`src/attendance.css`
   ~295) and pushes `Today` and `Later ▶` to the far right. Next to the pale-yellow day columns the
   owner read Earlier as sitting higher; measured, it is level. The range repeats the dates every
   column head already prints (`dayHead()` ~3734), and phones already hide it (~1453).

**The rulings, taken with the owner 2026-09-28.**
1. **The "count as absent" sentence moves into the state line's `title` and `aria-label`**, and the
   note row is no longer drawn for unconfirmed students. The rule it states is the owner's, from
   WO-2.10, and stays true: a `U` counts as `A` everywhere. What changes is only where it is said.
   **WO-2.10's "do not make `U` quieter than it is" still holds**: the count and the amber wash stay
   on the column head, the state line and the home card. Only the explanation moves.
2. **The paging and editing band is drawn in the state line's slot, with no button, at the state
   line's height.** The owner's words: *"Same size, no button, just a new bit of information."*
   - **Paged away:** *"Today is not on screen."* When the anchor is a term edge rather than today, it
     names that edge (*"Sep 2 is not on screen."*). No date range: the column heads carry the dates.
   - **A past day unlocked:** the band and the state merge (*"Editing Mon 9/21 · 3 unconfirmed"*),
     in amber while any `?` are left on that day. The day's own state must not disappear, because it
     describes the day the teacher is about to tap.
   - **Opened on a day from the calendar (WO-6.5):** keeps its off-term clause, which no column head
     shows.
   - **Short, numeric dates**, so the line does not wrap on a narrow screen.
3. **The term-rollover band (WO-2.51) and the off-term band (WO-2.52) keep their slot above the state
   line, their tone and the rollover's Switch button.** They are present on arrival, not after a
   click, so they move nothing under the pointer. **They now stay visible while paged**: the
   precedence *"one band at a time, and the off-today message wins it"* existed because the messages
   shared one slot, and they no longer do. Hiding them on the first `◀ Earlier` would be defect 2
   again, and the rollover sentence is still true while the teacher reads older days.
4. **The pager is `[◀ Earlier] [Today] [Later ▶]`, grouped at the right, with the date range
   removed.**

**Deliverables**
- **`paintActions()`** draws no note for unconfirmed students and puts the sentence on the state line's
  `title` and `aria-label`. The note row stays for the states that still use it (did not meet,
  covered, locked past day, off term).
- **`paintBanner()`** writes the paging, editing and arrival messages into the state line rather
  than the band, merged as ruling 2 says, and draws no *Back to …* button. Its comment block is
  **rewritten, not trimmed**: the precedence argument (~4012) is replaced with ruling 3 and its
  reason, and every sentence describing the removed button goes.
- **`paintPager()`** draws no range span; `.attendance-pager` justifies its buttons to the right; the
  `.attendance-pager-range` rules in `src/attendance.css` go.
- **`index.html`'s comment at `#attendanceBanner`** says what the band now carries.
- **The fence**: a harness check, in a new `tools/verify/` file or in `tools/verify/attendance.mjs`,
  that records the bounding rect of the three pager buttons and of the first grid row, then does each
  of: the first tap on a student, `◀ Earlier`, `Later ▶`, the ✏️ on a past column, `Today`, and the
  last `?` confirmed. After each, every rect is unchanged to the pixel. Run at 1280×800, 1024×768
  (iPad landscape) and 768×1024 (iPad portrait, where Earlier and Later are disabled and the other
  four actions still apply).
- **Existing checks rewritten, not deleted**, wherever they read what moved: the `count as absent`
  check (`tools/verify/attendance.mjs` ~864) reads the state line's `title`; the band readers in
  `calendar-opens-on-day.mjs`, `portrait-landscape.mjs`, `register-opens-on-term.mjs`,
  `term-ended.mjs` and `today-goes-to-term.mjs` read the new slot, and any that click the band's
  *Back to today* click the pager's `Today`. The spoken *"Back to …"* announcement from `pageDays()`
  is untouched.
- **`TESTING.md` § WO-2.56, the `CHANGELOG.md` entry, and bump `CACHE` in `sw.js`** (`index.html` is
  in `SHELL`).

**Acceptance**
- [ ] The fence is green at all three sizes: no pager button and no grid row moves by a pixel across
      the six actions.
- [ ] Mutation-proved twice: un-hide the unconfirmed note again, and put the band back above the
      state line; each turns the fence red. **Each mutation is reverted before anything else is
      written** (`AGENTS.md`).
- [ ] With 12 students unconfirmed, the state line reads *12 unconfirmed* in amber, its `title`
      carries *count as absent*, and `#attendanceNote` is hidden.
- [ ] Paged back: the state line reads *Today is not on screen.*, there is no *Back to* button
      anywhere on the screen, and one `Today` press returns the strip.
- [ ] A past day unlocked with `?`s left: the state line reads *Editing <date> · n unconfirmed* in
      amber; with none left it reads *Editing <date>* beside the day's own state.
- [ ] With the term-rollover band up, paging back leaves it up and in place, Switch still works, and
      the pager does not move.
- [ ] The pager shows its three buttons together at the right edge and no date range.
- [ ] `node tools/verify-shell.mjs` green with its check count recorded and `tools/README.md`
      reconciled; `node tools/wo-sweep.mjs` green.
- [ ] 👤 **iPad, force-quit first** (`CLAUDE.md`), in landscape: take a class from the first tap to the
      last, page back twice and forward twice, unlock a past day and return. Nothing under the thumb
      moves.

**Traps** — **Do not touch the rollover or off-term bands' wording, tone or button** (ruling 3); the
only change to them is that paging no longer hides them. **Do not let *Today is not on screen*
replace an unlocked day's unconfirmed count.** **Height is the requirement, not a style**: a sentence
that wraps to two lines at 768px is defect 2 again, which is what the portrait run is for. **A
disabled `Earlier` in portrait keeps its place in the group**, per `paintPager()`'s own ruling that a
control that vanishes is one the teacher goes hunting for. **`paintActions()` and `paintBanner()` would
both write the state line now**: decide which one owns it and say so at the function, or the second
paint overwrites the first. **Check the diffstat before committing**: this touches several harness
files, which a CRLF rewrite hides best.

**Out of scope.** The note row for the states that still draw it (did not meet, covered, locked past
day, off term); those appear on arrival or after a deliberate button, not mid-marking. The direction of
the columns against the arrows (newest-first from the left while *◀ Earlier* points left), raised at
booking and not taken up. Any change to what a tap writes.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.css`
  - `src/attendance.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/attendance.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- Also open: `index.html` (~776, `#attendanceBanner` and the state line), `sw.js` (`CACHE`), `TESTING.md`, `AGENTS.md`
  § "If you were dispatched with a work order" (mutation revert rule), and the five band-reading harness files named in
  Deliverables: `tools/verify/calendar-opens-on-day.mjs`, `portrait-landscape.mjs`, `register-opens-on-term.mjs`,
  `term-ended.mjs`, `today-goes-to-term.mjs`.

**Orchestrator notes — the traps a cold reader would not guess.**
- **Line numbers in the work order are approximate (`~`)**; locate by function name.
- **Mutation discipline**: put a mutation in, run, see red, revert it *before writing anything else* — including the
  result file. Mark each mutation with a `MUTATION` comment so `grep -rn MUTATION src/ index.html tools/` finds it if
  you are killed mid-round, and run that grep as your last check. Five dead dispatches here left live mutations.
- **The portrait size**: Earlier and Later are disabled at 768×1024, so the fence there does four actions, but it still
  records all three pager rects — a disabled button keeps its place (Trap).
- **The fence must be able to fail**: that is what Acceptance 2 proves. Compare rects with exact equality, not a
  tolerance, and record the before-rects once per size so a drift across actions accumulates rather than resets.
- **Acceptance 5's second half** (*Editing <date>* "beside the day's own state") is yours to read; decide the wording,
  state it at `paintBanner()`, and say in the result file what you chose.
- **Do not commit.** Leave the tree for the verifier. Do write `TESTING.md` § WO-2.56 and bump `CACHE`; draft the
  `CHANGELOG.md` entry in the result file rather than landing it.
- **Never tick line 9** (👤). Tick 1–8 only on evidence you produced this run, and record the verify-shell check count.

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

## 5. Done means these 9 lines, reported against one by one

1. The fence is green at all three sizes: no pager button and no grid row moves by a pixel across the six actions.
2. Mutation-proved twice: un-hide the unconfirmed note again, and put the band back above the state line; each turns the fence red. **Each mutation is reverted before anything else is written** (`AGENTS.md`).
3. With 12 students unconfirmed, the state line reads *12 unconfirmed* in amber, its `title` carries *count as absent*, and `#attendanceNote` is hidden.
4. Paged back: the state line reads *Today is not on screen.*, there is no *Back to* button anywhere on the screen, and one `Today` press returns the strip.
5. A past day unlocked with `?`s left: the state line reads *Editing <date> · n unconfirmed* in amber; with none left it reads *Editing <date>* beside the day's own state.
6. With the term-rollover band up, paging back leaves it up and in place, Switch still works, and the pager does not move.
7. The pager shows its three buttons together at the right edge and no date range.
8. `node tools/verify-shell.mjs` green with its check count recorded and `tools/README.md` reconciled; `node tools/wo-sweep.mjs` green.
9. 👤 **iPad, force-quit first** (`CLAUDE.md`), in landscape: take a class from the first tap to the last, page back twice and forward twice, unlock a past day and return. Nothing under the thumb moves.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

