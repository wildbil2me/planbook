# WO-6.9 — The review count opens a page that shows the review · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-6-calendar-glance.md`
**Report to** `.claude/dispatch/WO-6.9-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus**, on the merits: the review count is the one `supports`-derived
item on the glance page, the Traps line is a disclosure trap (a review's date in a DOM attribute is a
disclosure), and presentation mode is on the Acceptance list — that is the first bullet of
`ROUTING.md` § "Route to Claude", and the rubric never reached the Codex column, so no probe was run.
The runner-up set aside: Size S with a checkable Acceptance reads Codex-shaped, but the work is
choosing where a tap lands and what a sentence says, which is judgment about the spec, not arithmetic.

**The open question is answered — take option 4.** The work order says *"Answer it when
dispatching"*, and the dispatcher's answer is: **the month on today, with the window's far edge named
on the calendar when it lies past the month drawn.** The owner may overrule this before the verdict;
until then it is the spec. Why not the others: option 1 breaks past the coming
Saturday, not just past a lead of 6 (the week is Sun–Sat around today); option 2 is the same defect
mirrored, and the month grid's borrowed days make both it and today's landing right only by luck of
the weekday; option 3 is refused by the Traps line. Option 4 is the only one
that is correct for every lead value, it leaves the landing the home button already has, and its
sentence is about the **window** — the teacher's own setting — and never about a review.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-6.9 — The review count opens a page that shows the review

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-16 · **Size** S · **Depends on** WO-6.8

**Why it exists.** Booked 2026-09-16 out of WO-6.8's verdict. The verifier flagged it, and the owner
chose to book it rather than hold WO-6.8 open for it. *1 review coming up* under *Closing in* carries
`data-calendar-open` with no value, so it opens the calendar on **this month**. The count's reader asks
`reviewDatesIn()` over `leadWindowOf()`, and that window crosses a month edge whenever the lead
reaches past the last day. On the default lead of 3, read on the 29th, a review on the 1st is counted
on the glance page and missing from the page the tap opens. The teacher has to know to press *next
month*, which means knowing the date the count refuses to show her.

**Nothing is disclosed and nothing is lost.** The count is still right, the review is still on the
calendar one page on, and presentation mode still takes the row away. This row is about a tap that
lands one page short, which is why it did not hold WO-6.8.

**Open — the owner's call** — *where does the tap land?* Each answer has a cost, and the choice is
why this is a work order rather than a patch.
1. **The week view on today.** It matches the event rows' landing. It covers the whole window only
   while the lead is six days or less, because `leadWindowOf()` has **no upper clamp**
   (`src/calendar.js`, `leadDaysOf()` takes any finite number). A teacher who sets 14 days is back
   where this row started.
2. **The month holding the window's far edge.** The review-count item already carries `from` and
   `to` (`closingIn()` in `src/glance.js`), so the tap can carry `to` without asking anything new.
   That covers every review early next month, and misses one late this month when the window
   crosses the edge. It is the same defect in the other direction, which is worse on the 29th than
   the default and better on the 1st.
3. **The month of the earliest review.** This is always right, but it needs a review's **date** on
   the glance page. It either hands the row a date, which WO-6.4's fifth line and this file's Traps
   forbid, or adds a second asker of `reviewDatesIn()` in the tap handler, which WO-6.8's fourth line
   counts. **Proposed: not this one.**
4. **The month on today, with the month edge named.** When the window crosses a month edge, the
   calendar arrival says the window runs into next month. That changes a sentence instead of a
   landing, and it is the only option that states the window rather than guessing a page.

No answer is proposed among 1, 2 and 4. Answer it when dispatching.

**Acceptance**
- [ ] With a lead that crosses a month edge and a review only in next month's part of the window,
      tapping the count leaves the review visible on the screen it lands on, or leaves on screen a
      sentence naming the month it is in, depending on the answer taken.
- [ ] With a review only in this month's part of the same window, the same holds.
- [ ] The row still carries no name, no date and no kind, and nothing it puts in the DOM contains an
      ISO date that is a review's rather than the window's.
- [ ] `reviewDatesIn()` is still the review count's only asker, and `wo-sweep` counts no new asker of
      `presentationMode()`.
- [ ] With presentation mode on, the row is still absent and no line says anything was hidden.
- [ ] 👤 On the iPad, on a day whose window crosses a month edge, the tap lands where the answer says
      it lands.

**Traps** — The obvious fix is option 3, and it is the one this row exists to refuse. The review
count is the one `supports`-derived item on the glance page, and **a date on its button is a
disclosure of when a student's IEP or 504 is reviewed**. It is still a disclosure when it sits in an
attribute and not in the text, because the DOM is what a projector's mirror and a screen reader both
read. Whatever the tap needs, it gets from the **window**, which belongs to the teacher's setting,
and never from a review.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/calendar.js`
  - `src/glance.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/calendar-view.js` — `resetCalendar(classId, weekOf)`, `windowOf()`, `renderCalendar()` and the
  `#calendarHint` line it already paints under the grid.
- `src/shell.js` — `showCalendar(weekOf)` (~line 1310) and the `[data-calendar-open]` click handler
  (~line 2711).
- `src/glance.js` — `closingIn()` (~412) already puts `from` and `to` on the review-count item;
  `closingPanel()` (~730) draws the row with `data-calendar-open=""` and the `REVIEW_*` copy near
  line 558.
- `index.html` — the calendar view around line 1372 (`#calendarRange`, `#calendarHint`,
  `#calendarEmpty`) if the sentence needs its own element. Any `index.html` or `SHELL` edit means a
  `CACHE` bump in `sw.js`.
- `tools/wo-sweep.mjs` — find the sections that count askers of `presentationMode()` and of
  `reviewDatesIn()`; the Acceptance's fourth line is those counts unchanged.

### What the dispatcher decided so you do not have to

- **What the tap carries.** The row keeps `data-calendar-open=""` — an empty value is the month-on-today
  landing, and giving it `to` would land on the WEEK of `to` (WO-6.8's meaning of a value there). The
  window's far edge travels on a **second attribute** of your naming, holding the window's `to` ISO
  date — an ISO date on that button is permitted by the third Acceptance line precisely because it
  is the window's, never a review's.
- **Where it goes.** Through `showCalendar()` into `resetCalendar()` as an **argument**, recorded in
  the view the way `anchor` and `scale` are, and forgotten by the next `resetCalendar()`. Nothing
  reaches `localStorage`. Every existing caller of both functions lands exactly as before.
- **When the sentence shows.** Computed at every render, not at arrival: the sentence appears when
  the handed-in edge lies past the drawn window's `to`, and it goes away on its own when the teacher
  pages to a window that holds it. A window that does not cross the edge shows no sentence. The one
  edge case to decide yourself and state in a comment: a teacher who switches to WEEK after arriving
  now has a drawn window that ends sooner still — say whether the sentence follows her there and why.
  Either answer is fine; an unstated one is not.
- **What the sentence says.** It names the **month** the window runs into and the date it runs
  through, and it names the control that gets there — as WO-4.2's concern list does. It names **no review, no count, no student**: the sentence has to read
  identically whether the reviews in that month number zero or three, because a count-in-a-month is
  a second way to say when somebody's plan is reviewed. Something in the register of *"The lead time
  you set runs through Wed Oct 1 — into October. Next month is one tap on the arrow."* Write it in
  the suite voice (`design/style-guide.md`), and put the same sentence into the arrival `announce()`
  so a screen-reader user hears what the sighted teacher reads.
- **Placement.** Under the grid, near `#calendarHint`, as a sentence of its own rather than
  overloading the hint's text — the hint's condition is "every class showing", this one's is "an
  edge beyond the page", and the two can be true together.

### Traps the tree will set for you

- **The harness must make the window cross the edge on any day it runs.** Do not hard-code a date:
  compute the lead in the fixture as `daysBetween(today, first of next month) + 1` (or more) and write
  it to `calendar.gradesDueLeadDays` — `leadDaysOf()` takes any finite number and has no upper clamp.
  Put one review on the 1st of next month for line 1 and one on today (or tomorrow) for line 2;
  `--today=` exists if you want a second run pinned to a 29th, but the default run must be green on
  every date of the year, including the 1st and the last day of a month.
- **Assert the negative in the DOM, not just the positive.** For line 3, read the review row's
  `outerHTML` and assert the review's own ISO date is absent from it while the window's `to` may be
  present; the fixture's review date must differ from `to` or the assertion is vacuous — set the
  review a day inside the edge, not on it.
- **Presentation mode.** `reviewDatesIn()` answers `[]` while projecting, so the row is absent and the
  sentence has no door to arrive through. Do not add a `presentationMode()` test anywhere — the fourth
  Acceptance line counts them, and `src/calendar-view.js`'s header says why the view has none.
- **A second asker of `reviewDatesIn()`** — in the tap handler, in `showCalendar()`, in the view — is
  option 3 by the back door and the thing this row exists to refuse. `closingIn()` stays the only one.
- **`src/glance.js` computes nothing.** If you think you need "does the window cross a month edge" on
  the glance side, you do not: the calendar decides at render from the edge it was handed. No month
  comparison goes into the glance page.
- **Mutation-prove the two claims worth proving** and put the results in the result file: (a) blank
  the second attribute and show the sentence check goes red; (b) put the review's date on the button
  instead of the window's and show the line-3 check goes red. Revert each before the next run, and
  `grep -rn MUTATION` over your files before you write the result file.
- Tick what your own run closed. Leave the 👤 line and the `CHANGELOG.md` entry.

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

1. With a lead that crosses a month edge and a review only in next month's part of the window, tapping the count leaves the review visible on the screen it lands on, or leaves on screen a sentence naming the month it is in, depending on the answer taken.
2. With a review only in this month's part of the same window, the same holds.
3. The row still carries no name, no date and no kind, and nothing it puts in the DOM contains an ISO date that is a review's rather than the window's.
4. `reviewDatesIn()` is still the review count's only asker, and `wo-sweep` counts no new asker of `presentationMode()`.
5. With presentation mode on, the row is still absent and no line says anything was hidden.
6. 👤 On the iPad, on a day whose window crosses a month edge, the tap lands where the answer says it lands.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

