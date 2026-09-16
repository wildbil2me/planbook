# WO-6.8 — Today and this week, Waiting to be graded, and Closing in · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-6-calendar-glance.md`
**Report to** `.claude/dispatch/WO-6.8-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override), on its own merits: the *Closing in* panel draws the one `supports`-derived item on the glance page, which has to disappear under presentation mode (a sensitive surface). The row also writes panel headings teachers read, and its Traps are judgment traps (the month grid already decided what a derived item looks like). Codex was not a serious runner-up; nothing here is arithmetic against a spec.

## 0. The owner's rulings — both Open questions are ANSWERED (2026-09-16)

Read the two *Open — the owner's call* paragraphs below as closed. Record each answer in the phase file under its paragraph, the way WO-6.7 recorded its own dispatch answer.

1. **A grades-due date shows ONLY under *Closing in*, never under *Today and this week*.** Acceptance line 1's "every authored event" therefore means every authored event **except `grades-due`**. Say so beside that line, and do not rewrite the line itself.
2. **One window.** Grades-due dates, term edges and IEP/504 reviews all stay on `leadWindowOf()`, and **the *Closing in* panel heading names whose lead time it is** (it is the teacher's grades lead time, `calendar.gradesDueLeadDays`). No second setting, and no "this month" beside the review count.

### What ruling 1 costs in code you did not write — the trap to get right first

`weekItems()` in `src/glance.js` (WO-6.7, done) builds on `eventsCovering()`, **which returns `grades-due` events**. So as shipped, panel 2 would show them. The fix must obey the glance rule in `CLAUDE.md` § Data ("A glance reader reads"): **no filtering in the reader and none in the panel.** The kind decision goes into `src/calendar.js`, exactly as `gradesDueIn()` did it one function down (its comment gives the reason: *the caller should not decide which kind a deadline is*), and `weekItems()` asks that new engine read instead. Touching `weekItems()` is inside this dispatch: the ruling forces it. Name it in your result.

**The knock-on you must check:** WO-6.7's quiet panel has a chip that reads *"Nothing on the calendar through <date>"*, and it is decided by `weekItems()` being empty. Once grades-due dates leave that reader, a week holding only a grades-due date that sits **outside** the lead window would count as quiet and print that sentence, which is false. Work out whether that state is reachable, and if it is, fix the decision in the engine or the reader's question (not with arithmetic in `src/glance.js`) and add a fixture that reaches it. If you think the right fix belongs outside this row, say so as a proposed follow-up rather than widening quietly.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-6.8 — Today and this week, Waiting to be graded, and Closing in

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-16 · **Size** M · **Depends on** WO-6.7

**Why it exists.** The second third of [WO-6.4](#wo-64--the-glance-page), cut out on 2026-09-15 —
the three panels whose sources a live term has already confirmed. Panel 2 draws calendar items, panel
3 the ungraded count and panel 5 lead-time deadlines, all in daily use since Sep 2; none of them
draws a signal, so none of them waits on Phase 4's fortnight the way panel 4 does. This row can be
built the day WO-6.7 lands.

**What it draws.** Three `.panel`s in the stack WO-6.7 built, each a list of `.gl-row` buttons from
§ GLANCE lifted rather than re-derived, each row tapping through to the thing that resolves it:

2. **Today and this week** — authored events and derived items from today through six days on,
   from WO-6.7's week reader. An event opens the calendar's week on that day; a derived due date
   carries the calendar's `↗` and opens the assignment's editor, exactly as the month grid's chip
   does; a term edge opens the class.
3. **Waiting to be graded** — one row per assignment with ungraded cells in the open term, headed
   with the count, from WO-6.7's queue reader; the row opens that class's assignment column. The
   per-class half of this is WO-3.26's chip, and this is the page-level panel over the same engine
   call.
5. **Closing in** — grades-due dates inside their lead time, from WO-6.7's closing-in reader, each
   tapping through to the event — **the surface WO-6.1's lead-time warning has been waiting to be
   re-homed to**, and the box WO-6.1 `**Owes**` this row; term edges approaching; and the review item
   as a **count** — `1 review coming up`, no name, no date, no kind — tapping through to the calendar.
   The ruling behind the count is WO-6.4's and stays there. It is read through `reviewDatesIn()`,
   which already answers with an empty list while projecting: the row is absent under a projector
   for free, with one asker, and **no "1 hidden" line**, because a count of hidden reviews is the
   disclosure one step removed.

**Open — the owner's call** *(the redraw's question 11)* — *does a grades-due date appear in* Today
and this week *as well, or only under* Closing in? Proposed: a grades-due date is a deadline by
definition and lives under *Closing in* whether or not it is inside its lead time; *Today and this
week* lists what is scheduled. One row, one panel, and the panel a teacher would look under first.
The cost is a Thursday grades-due date missing from a list headed "this week". Answer it when
dispatching.

**Open — the owner's call** *(raised by WO-6.7's verifier, 2026-09-15)* — *do all three kinds under*
Closing in *share one horizon?* `closingIn()` gives grades-due dates, term edges and IEP/504 reviews
the same window, `leadWindowOf()` — the lead time the teacher set **for grades**. On WO-6.7 that
decides only whether a day is quiet, and the chip names its own window, so nothing false is asserted;
**this row is where it becomes a sentence a teacher reads.** Proposed: **keep the one horizon**, and
let the panel head name whose lead it is — a second lead time is a second setting nobody typed, and
the drawing's "this month" beside the review count would be a third. The cost is real and worth
stating: a review she is legally obliged to prepare for gets the notice she chose for re-keying
grades, and three days is plausibly short for one. Reversing it means a second key in the `calendar`
block, which is a settings-block question rather than a panel one — **it wants its own row, not this
row's editor**, and `CLAUDE.md`'s rule that a settings block is created by its first write governs it.
Answer it when dispatching.

**A known edge, recorded rather than fixed** *(the redraw's question 14)*. Panel 2's titles are free
text and the panel stays up while projecting. "Guardian call — Owen Bennett" is a conference the
teacher typed, and nothing stops her typing "IEP meeting — Owen Bennett". It is the same open edge
`CLAUDE.md` § Accommodations records for a note to self under a projector, reached from the calendar's
side, and the calendar draws these chips while projecting today. Drawn as the calendar does it — up —
and named here so that it is a known edge rather than a surprise. Reversing it is the owner's call and
costs her the panel.

**Acceptance**
- [ ] *Today and this week* lists every authored event and derived item from today through six days
      on and nothing outside that window, and each row taps through to its subject — an event to the
      calendar's week on that day, a due date to the assignment's editor.
- [ ] *Waiting to be graded* draws one row per assignment with ungraded work in the open term, its
      head count equals the sum of the cards' `N to grade` chips, and a row opens that class's
      assignment column.
- [ ] A grades-due event appears under *Closing in* on every day inside its lead time, and taps
      through to the event. *(Moved here from WO-6.4 at the cut, with WO-6.1's `**Owes**` pointer.)*
- [ ] The review item is a count with no name, date or kind; with presentation mode on it is absent
      and no line says anything was hidden; and `reviewDatesIn()` is its only asker — `wo-sweep`
      counts the askers of `presentationMode()` and this row adds none.
- [ ] Every row in the three panels is a `<button>` measuring ≥44px under an emulated coarse pointer.
- [ ] The three panels draw WO-6.7's arrays and nothing else: no engine import is added to the panel
      code, and the harness fixture that moves the readers' lengths moves the rows drawn.
- [ ] A day where **only** the attention hits are non-empty — nothing due, nothing to grade, nothing
      closing in — draws the three panels' states and **not** the quiet panel. *(WO-6.7's verifier
      found this by reading, not by running: no fixture in `tools/verify/glance-quiet.mjs` reaches
      that state, so a build that dropped `attentionHits()` from the quiet decision passes all
      nineteen of its checks while drawing "Nothing needs you today" on a Friday where two students
      are failing. The line is here rather than on WO-6.7 because that row is ✅ and a landed work
      order is not reopened to add a check — and because this sitting has the file open. It asserts
      the quiet **decision**, which is one level up from the line above it: that one says panels
      follow readers, this one says the quiet panel's absence does too.)*

**Traps** — Panel 2 is the month grid's chips in a list, and the month grid already decided what a
derived item looks like and where it goes: plain, carrying `↗`, never dashed, opening the assignment.
Re-deciding any of it here is the `.cal-*` / `.calendar-*` scar with a different prefix. And the
review count is the one `supports`-derived thing on the page: a name, a date or a kind beside it is a
disclosure WO-6.4's fifth line forbids, and a "1 hidden" under a projector is the same disclosure one
step removed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify/glance-quiet.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `.claude/dispatch/WO-6.7-result.md`: what the stack, the five readers and `renderGlance()` look like, and the ten decisions WO-6.7 took. Decision 5 (`queueRows()` carries `open` so this panel never imports the grade engine) and decision 7 (panel copy lives as constants in `src/glance.js`, because the panel only exists some days) are conventions to follow, not re-open.
- `src/glance.js` whole, `src/glance.css`, `src/home.js` (`ungradedChip()` is the per-class chip that Acceptance line 2's head count must equal), and the `#homeView` block in `index.html`.
- `design/mockups/proposed-phase6.css` § GLANCE, and its drawing in `design/mockups/`. Lift `.gl-row`, `.gl-more` and `.gl-shut`, and do not re-derive them.
- `src/calendar-view.js`: how the month grid draws a derived due-date chip (plain, `↗`, opens the assignment's editor) and how it opens the week on a day. Panel 2 copies both. Find the existing door hooks in `src/shell.js` (`[data-calendar-open]`, `[data-signals-open]`) and reuse their shape instead of inventing a route.
- The WO-6.1 `**Owes** WO-6.8` pointer (phase file, ~line 28 and its Acceptance box ~line 217). When line 3 closes, handle that pointer as `plans/work-orders/README.md` § "A re-homed Acceptance line stays `- [ ]`" says.

**Acceptance line 6, read carefully.** `src/glance.js` already imports engines for its readers. "No engine import is added to the panel code" means the drawing half reads only the readers' arrays, and no new import may appear for the panels' sake. The one new engine read ruling 1 requires goes into `src/calendar.js` and is reached through `weekItems()`, never from the drawing code.

**Line 4:** `wo-sweep.mjs` counts who calls `presentationMode()`, and that count must not move. The review row is absent while projecting because `reviewDatesIn()` returns `[]`. Test it with presentation mode ON, and assert that no text anywhere on the page mentions a hidden item.

**Harness scars to avoid repeating.** A full `verify-shell.mjs` run takes ~7.5 minutes on this tree (451s at WO-6.7). WO-6.7 lost a run to a fixture carrying a literal date that became "today" (see `tools/verify/copy-class.mjs`). Anchor every fixture date to the page's clock, never to a literal. If you prove a check with a mutation, **revert the mutation before you write anything else**. On a dead dispatch, `grep -rn MUTATION` is the first thing anyone runs. Bump `CACHE` in `sw.js` if any `SHELL` file changes. Update the `check()` count sentence in `tools/README.md`, because the sweep goes red if it drifts.

**Status.** Leave the row at `🤖 CLAIMED`, because the orchestrator runs `--handoff`. Leave the tree uncommitted.

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

1. *Today and this week* lists every authored event and derived item from today through six days on and nothing outside that window, and each row taps through to its subject — an event to the calendar's week on that day, a due date to the assignment's editor.
2. *Waiting to be graded* draws one row per assignment with ungraded work in the open term, its head count equals the sum of the cards' `N to grade` chips, and a row opens that class's assignment column.
3. A grades-due event appears under *Closing in* on every day inside its lead time, and taps through to the event. *(Moved here from WO-6.4 at the cut, with WO-6.1's `**Owes**` pointer.)*
4. The review item is a count with no name, date or kind; with presentation mode on it is absent and no line says anything was hidden; and `reviewDatesIn()` is its only asker — `wo-sweep` counts the askers of `presentationMode()` and this row adds none.
5. Every row in the three panels is a `<button>` measuring ≥44px under an emulated coarse pointer.
6. The three panels draw WO-6.7's arrays and nothing else: no engine import is added to the panel code, and the harness fixture that moves the readers' lengths moves the rows drawn.
7. A day where **only** the attention hits are non-empty — nothing due, nothing to grade, nothing closing in — draws the three panels' states and **not** the quiet panel. *(WO-6.7's verifier found this by reading, not by running: no fixture in `tools/verify/glance-quiet.mjs` reaches that state, so a build that dropped `attentionHits()` from the quiet decision passes all nineteen of its checks while drawing "Nothing needs you today" on a Friday where two students are failing. The line is here rather than on WO-6.7 because that row is ✅ and a landed work order is not reopened to add a check — and because this sitting has the file open. It asserts the quiet **decision**, which is one level up from the line above it: that one says panels follow readers, this one says the quiet panel's absence does too.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

