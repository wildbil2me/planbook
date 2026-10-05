# WO-3.45 — a class tab on the assignment list or the score grid drops you on Attendance · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.45-result.md` — as your last act, and return it in-band too.

**Routing (2026-10-04).** Claude, **Opus** (no model override), on the work order's own merits: its
Traps are rulings rather than mechanics — WO-3.3's line is *not* reopened but annotated, `REMEMBERED_AS`
must not grow the other direction, the new screens must *not* be modelled on `setCalendarFilter()` —
and it writes a dated prose note into a phase file. The runner-up was Codex (size S, Acceptance
mechanically checkable, no sensitive surface); set aside because every one of those Traps is the
kind a tidy implementation undoes.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.45 — a class tab on the assignment list or the score grid drops you on Attendance

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-04 · **Size** S · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-04.)*

**Booked 2026-10-04**, owner-directed, from the owner's own use: *"When I am looking at calendars or
signals, and I click on another class, I land on the same screen for that class. That doesn't work
for assignments or scores."* **Placed next in the running order**, the owner's call.

**This reverses a ruling, not a bug.** `selectClass()` in `src/classes.js` (~733) records that every
class screen except the calendar and the concern list lands on Attendance on a class tap. Its reason
was *"a teacher tapping Period 3 while looking at Period 2's score grid is going to Period 3, not to
a column of Period 3's scores she did not ask for."* The owner has now ruled the other way for the
assignment list and the score grid. The tap means *same screen, different class* on four screens now.

**The owner's rulings, 2026-10-04**
1. **Assignments → another class's Assignments. Scores → another class's Scores.** Attendance stays
   on Attendance, as it already does.
2. **Student detail still lands on Attendance.** The student is not in the other class, so there is
   no "same screen" to land on.
3. **Nothing else moves.** A card on the home grid still opens a class on Attendance, and a reload
   still lands on Attendance (`REMEMBERED_AS` in `src/views.js` is unchanged). This is *same screen
   on a class switch*, not a per-class memory of the last screen used. That memory is still refused.

**Deliverables**
- **`selectClass()` keeps `assignments` and `scores` up** beside `calendar` and `signals`, and its
  comment says why the list grew and that `detail` is left off it on purpose.
- **`src/shell.js`'s `data-class-tab` branch paints the new class's assignment list or score grid**,
  through whatever chain already paints those screens on arrival. Do not add a second painter. The
  comment above the branch (~2443), which says the calendar and the concern list are the only screens
  of that kind, is corrected.
- **The score grid's search box and category pill reset on the tap**, as they do on every arrival
  (`resetScoreSearch()` and `resetScoreCategory()`, `src/shell.js` ~1157). A category pill is a
  class's own id, so A's means nothing in B, and A's student search narrows B's grid to nobody.
  The comment there says *"a class tab leaves the grid for Attendance, so there is no second door to
  reset"*, which stops being true here. Prefer routing the tap through the arrival path that already
  does these resets over adding a second set of them. Whatever else a fresh arrival on either screen
  resets, the tap resets too. Name each one in the result.
  *(Checked at booking: the assignment editor is a modal, so no header tab can be tapped while it is
  open. A score cell writes on every `input` event (`src/shell.js` ~3816 → `editScore()`), so there
  is no half-finished value to lose.)*
- **The class switcher (`src/screen-nav.js`) marks the screen that is up**, not Attendance.

**Acceptance**
- [ ] With the assignment list up for class A, a tap on class B's header tab shows class B's
      assignment list. The B tab is the active one and the switcher marks Assignments.
- [ ] The same for the score grid: A's Scores → tap B → B's Scores, showing B's students and B's
      columns, and no column or row of A's.
- [ ] Student detail up → tap another class → that class's Attendance. Unchanged, and asserted.
- [ ] A home-grid card still opens on Attendance, and a reload from either screen still lands on
      Attendance. `tools/verify/assignments.mjs`'s card check (~828) stays green as it is.
- [ ] `tools/verify/assignments.mjs` ~799 and ~809 (*"opening a second class from a class left on
      Assignments lands on Attendance"* and *"…coming back… lands on Attendance too"*) are rewritten
      to this ruling rather than deleted. The *no per-class memory* half survives as a check: leave A
      on Scores, go home, open B from its card, and B lands on Attendance.
- [ ] With A's grid searched and narrowed to one category, a tap on B shows B's grid unsearched and
      on *All*. A score typed into A immediately before the tap is in A and nowhere in B.
- [ ] `CACHE` in `sw.js` is bumped (`src/classes.js` and `src/shell.js` are SHELL files).
- [ ] 👤 On the iPad, after a force-quit: Assignments and Scores each stay up across two class taps,
      and detail drops to Attendance.

**Traps** — **WO-3.3's Acceptance line *"Opening a class lands on Attendance every time"* is not
reopened.** Its argument is against a per-class memory of the last screen, and its proof is a card
tap and a reload, both still true. Add a dated note under that line saying a header tap from
Assignments or Scores now keeps the screen (this work order), and leave its tick alone. **Do not put
`assignments` or `scores` in `REMEMBERED_AS`'s other direction**: a reload landing on the score grid
is the per-class memory under another name. **The calendar and signals branches move a filter, and
these two screens have none to move.** They need the class repainted, not a lens moved, so do not
model them on `setCalendarFilter()`. And **`resetRegistry()` still runs on every class tap** for the
reason the comment above it gives. Leave it in place.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/classes.js`
  - `src/screen-nav.js`
  - `src/shell.js`
  - `src/views.js`
  - `tools/verify/assignments.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/work-orders/phase-3-gradebook.md` — WO-3.3's Acceptance line *"Opening a class lands on
  Attendance every time"*: the dated note goes under it; its tick stays.
- `sw.js` — `CACHE` bump (both `src/classes.js` and `src/shell.js` are in `SHELL`).

**Orchestrator notes — the things you would not guess.**

- **Find the existing arrival path before writing a line.** The Deliverables say *route the tap
  through what already paints Assignments/Scores on arrival* — i.e. whatever the switcher in
  `src/screen-nav.js` or a `showView()`-style call already does, which is where
  `resetScoreSearch()`/`resetScoreCategory()` already run. A second painter or a second copy of the
  resets is the failure. In the result, **name every reset a fresh arrival performs** and show the tap
  performs each.
- **`detail` is left off the stays-up list on purpose**, and the comment must say so — not merely
  omit it.
- **Line numbers in the work order are approximate** (`~733`, `~2443`, `~1157`, `~799/809/828`).
  Find them by content.
- **Harness arithmetic:** `verify-shell.mjs` is ~4.5 min a run. A clean run plus a mutation or two
  is fine; prove at least one new check non-vacuous (e.g. drop `scores` from the stays-up list → the
  A-Scores→B-Scores check goes red). **Revert every mutation before you write anything else**, and
  `grep -rn MUTATION src tools sw.js index.html` must be empty before you report (AGENTS.md).
- **The "score typed into A is nowhere in B" line** wants the value to land in A's document data,
  not just the A grid's DOM — and `update()` only schedules a save, so await `flush()` (or the
  harness's equivalent) before asserting on the stored document.
- The 👤 iPad line stays `- [ ]`. Tick only what your own run proved.

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

## 5. Done means these 8 lines, reported against one by one

1. With the assignment list up for class A, a tap on class B's header tab shows class B's assignment list. The B tab is the active one and the switcher marks Assignments.
2. The same for the score grid: A's Scores → tap B → B's Scores, showing B's students and B's columns, and no column or row of A's.
3. Student detail up → tap another class → that class's Attendance. Unchanged, and asserted.
4. A home-grid card still opens on Attendance, and a reload from either screen still lands on Attendance. `tools/verify/assignments.mjs`'s card check (~828) stays green as it is.
5. `tools/verify/assignments.mjs` ~799 and ~809 (*"opening a second class from a class left on Assignments lands on Attendance"* and *"…coming back… lands on Attendance too"*) are rewritten to this ruling rather than deleted. The *no per-class memory* half survives as a check: leave A on Scores, go home, open B from its card, and B lands on Attendance.
6. With A's grid searched and narrowed to one category, a tap on B shows B's grid unsearched and on *All*. A score typed into A immediately before the tap is in A and nowhere in B.
7. `CACHE` in `sw.js` is bumped (`src/classes.js` and `src/shell.js` are SHELL files).
8. 👤 On the iPad, after a force-quit: Assignments and Scores each stay up across two class taps, and detail drops to Attendance.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

