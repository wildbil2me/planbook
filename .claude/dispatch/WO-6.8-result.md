# WO-6.8 — Today and this week, Waiting to be graded, and Closing in · implementer's result

**Implementer** Claude (work-order-implementer, Opus), 2026-09-16.
**Tree** left uncommitted on `main`. Row status left at `🤖 CLAIMED` for the orchestrator's `--handoff`.
**Both tools green on the delivered tree.** I waited for both to finish and read their output:

- `node tools/verify-shell.mjs`: `1387 checks · 1387 passed · 0 failed · 0 skipped`, `43,229 lines · 31.2 lines per check · 475s`, `EXIT=0`. That was the last run, on the reverted tree, after I cleared the stray `pb-verify-` Edge processes. The run before it, on the same tree, printed the same summary and then hung in teardown (the WO-5.11 hang). I killed it by PID, so it has no real exit code.
- `node tools/wo-sweep.mjs`: `42 checks · 39 passed · 0 failed · 3 to review`. These are the same three reviews the tree had before I started (baseline `42 · 39 · 0 · 3`).
- `node tools/wo-gate.mjs --audit`: `PASS`.

## Acceptance, line by line

1. **Today and this week: every authored event except `grades-due` and every derived item, today through day 6, each row tapping through.** Ticked. I put a note beside the line saying "every authored event" now excludes `grades-due`. The line itself is unchanged.
   - **Fixture.** A trip on days −2…1, a reminder today, an untitled conference on day 6, a reminder on day 7, a grades-due date on the last day of the lead, assignments due on days −1, 3 and 8, and a term ending on day 5.
   - **What the page shows.** The reader returns `trip,reminder,conference,assignment-due,term-end` and the panel draws exactly those five rows. Nothing appears for day 7, for days −1 or 8, or for the grades-due date.
   - **The conference tap.** It lands on `calendarView` with `scale: week`, `from 2026-09-20`, `to 2026-09-26`, and the class filter empty.
   - **The due-date tap.** The row carries the aria-hidden ↗. Tapping it opens `assignmentModal` on `a_wo68_d3` over `assignmentsView`.
2. **Waiting to be graded: one row per assignment, head equals the sum of the card chips, row opens the column.** Ticked.
   - The panel has four rows over two classes and reads `Waiting to be graded · 4`. The cards read `c_wo67: 3 to grade` and `c_wo68: 1 to grade`, so the sum is 4.
   - Tapping a row lands on `scoresView` with that class open. The column head is on screen at `left 314, right 1240 of 1280`, and focus is on `a_wo68_x`'s first cell.
3. **A grades-due event appears under Closing in on every day inside its lead, and taps through to the event.** Ticked.
   - I planted the event on days 0, 1, 2 and 3 in turn (lead 3). Each day drew one amber `.warn` row. On day 4 there was no row. On none of those days was it a row in the week panel.
   - Tapping it opens `eventsModal` titled `WO-6.8 grades due`.
   - **WO-6.1's re-homed box is ticked back** and its `**Owes** WO-6.8` field is removed, as `plans/work-orders/README.md` § "A re-homed Acceptance line stays `- [ ]`" says. `--audit` passes.
4. **The review item is a count with no name, date or kind; absent while projecting, with no "hidden" line; no new asker of `presentationMode()`.** Ticked.
   - Two reviews draw one row: `2 reviews coming up` · `Who and when are on the calendar.` It has no `.gl-row-meta`, no weekday or month word, and no digit except the 2. It carries `data-calendar-open=""`, which opens the calendar on the month.
   - I switched presentation mode on with the header's real control while the page was up. The row went away at once, with no re-arrival, and nothing under `#homeView` matched `/hidden|review/i`. Switching it off brought the row back.
   - `wo-sweep` still reads "asked by 7 other file(s)", the same list as the baseline. `src/glance.js` has no `presentationMode` call.
5. **Every row is a `<button>` of at least 44px under a coarse pointer.** Ticked. `matchMedia('(pointer: coarse)')` was true at 1024×768 mobile. Every row in all three panels was a BUTTON measuring 44 or 64px tall. On the desktop pass, every row is a `<button type="button">` wearing `.gl-row` (10 of 10).
6. **The panels draw WO-6.7's arrays and nothing else: no engine import added to the panel code, and the fixture that moves reader lengths moves the rows.** **Not ticked. I left it open on purpose.**
   - **The harness half is met.** Rows equal reader lengths in every state. Removing an event, the grades-due date and an assignment moved week 5 → 4, queue 4 → 3 and closing in 1 → 0, in rows and readers together.
   - **The import half is a judgement call against the wording.** I imported no new module, and the panel code calls no engine function on the document. But I did add three names to import lines that already existed, for the panels' sake:
     - `kindInfo` from `src/calendar.js`, so an untitled event reads as "Conference", the way every other surface shows it.
     - The token constants `ASSIGNMENT_DUE` and `TERM_START` from `src/calendar-derived.js`.
   - Without them, `src/glance.js` would need its own copy of the kind words. The brief says "no new import may appear for the panels' sake", and these are new names, so I could not honestly tick the box. **The owner needs to rule on it.** The reasoning is also written at the import and under the box in the phase file.
7. **A day with only attention hits draws the three panels' states and not the quiet panel.** Ticked.
   - The fixture gives Ada three `missing` warmups and a 90, and marks Cara and Drew excused / 85. That produces exactly one hit (`7ada:missing-count`), with week, queue and closing in all empty.
   - Result: `quiet:false, panels:1, named:[]`. The "state" of an empty reader is absence, per CLAUDE.md § Data ("a source with nothing draws no panel at all").

## Mutation round (all reverted)

I copied the files to backups, planted the mutations, and restored them by copying the backups back. `cmp` showed identical files, and `grep -rn "MUTATION M" src tools` afterwards finds only the two older "THE MUTATION MATCHED NOTHING" strings in `tools/verify/keys-legend-guards.mjs`.

- **Run 1: M1–M4 planted together.** M1: `weekItems()` asks `eventsCovering()` again. M4: the week panel draws `items.slice(0,4)`. M2 and M3 are described under run 2.
  - Result: `1379 checks · 1374 passed · 5 failed`. The reds were the grades-due probe, the week-list check, the week-doors check, the every-row-a-button check, and the section throwing when a tapped row was missing.
  - Because the section threw, M2 and M3 were never reached.
- **Run 2: M2 and M3 alone, after restoring the files.** M2: the quiet decision drops the hits. M3: `glance.renderGlance()` is taken off the flip list.
  - Result: `1387 checks · 1385 passed · 2 failed`. The reds were exactly the attention-only check (`quiet:true, named:["quiet"]`) and the projector check (the review row stayed on the glass).
- Both mutated runs printed their summaries, hung in teardown, and were killed by PID.

## What I could not verify

- **Anything on a real iPad.** The row has no 👤 line, but four things are worth the owner's eye:
  - **Focusing the first score cell may raise the on-screen keyboard.** That is the tap on a queue row (decision 5).
  - **How the three panels read on a real morning.** All the panel copy is mine.
  - **Whether the ↗ reads at 10–11px.**
  - **Whether the flip takes the review row off on the device.** The harness proved the flip list; the device has not been checked.
  - This is a `SHELL` change and `CACHE` is now `planbook-shell-v118`, so force-quit from the app switcher before reading it.
- **What a teacher makes of "Nothing scheduled through …".** That is a human reading.

## Decisions the work order or brief did not settle

1. **The knock-on from ruling 1 (brief § 0).** The false-chip state is reachable: on the default lead of 3, a week whose only entry is a grades-due date 4–6 days out is quiet, and chip 1 read "Nothing on the calendar". **I fixed the claim, not the decision.**
   - The chip now reads `Nothing scheduled through <date>`, and the panel sentence reads "Nothing is scheduled this week…". The fourth chip already counts deadlines from their warning.
   - **Why the day should stay quiet.** It is exactly the notice the teacher chose (ruling 2). The alternative was treating the day as not quiet. Under the "an empty reader draws no panel" rule, that would draw *nothing at all* under the grid on that day, so the deadline still would not show and there would be no reassurance either.
   - **This departs from the brief's suggested fix locations** ("in the engine or the reader's question"). No arithmetic was added. WO-6.7's grades-due probe now plants that day and asserts the new wording. If the owner would rather have that day be non-quiet, it is a one-line change to the decision, but the page would then be blank under the grid.
2. **A term edge row goes where the month grid's term chip goes: the class's term editor.** The work order's prose says "a term edge opens the class". The Traps line says not to re-decide where the month grid sends a derived item, and Acceptance names no destination for term edges. I followed the Traps line.
3. **An authored event in the week panel opens the week of its first day.** For a range that began before today, its row names both edges, so the landing matches the words. Clamping to today would mean comparing dates inside `src/glance.js`.
4. **The review row opens the calendar on this month** (`data-calendar-open=""`), because the row carries no date to open a week on.
5. **A queue row focuses the first cell of the column, not "the first blank".** Choosing the first blank would mean `src/scores.js` re-deriving what "open" means.
6. **The queue row's figure is `N blanks`**, the record's own `open`, not "N of M". "N of M" is a subtraction.
7. **An empty reader draws no panel** (CLAUDE.md § Data), so there are no per-panel empty states.
8. **The ↗ is `.gl-row-out`, not the drawing's `.cal-chip-out`.** No src/ sheet declares `.cal-chip-out`: the shipped month grid draws no arrow at all, which is worth the owner knowing given the Traps line. A `cal-` rule in `src/glance.css` would break its prefix rule. The values come from § SHARED. I recorded this in the § GLANCE banner.
9. **`resetCalendar(classId, weekOf)` takes an optional day.** One-argument callers are unchanged. The day is passed as an argument and stored nowhere, per WO-6.5's trap.
10. **New hook: `data-scores-open` + `data-scores-class`.** `data-calendar-open` now optionally carries a day. Both are in `src/shell.js`'s hook inventory, and sweep § "every delegated hook is in the inventory" passes.

## Touched outside the three panels (all needed by this row)

- **`src/calendar.js`**: `scheduledIn()`, as ruling 1 required.
- **`src/calendar-view.js`**: the optional `weekOf` on `resetCalendar()`.
- **`src/scores.js`**: `revealScoreColumn()`.
- **`src/shell.js`**:
  - `showCalendar(weekOf)`.
  - The `data-calendar-open` value route.
  - `openScoreColumn()` and its listener.
  - `glance.renderGlance()` on `flipPresentationMode()`'s list, with its comment. The "home screen is not on this list" note is narrowed to the cards.
- **`sw.js`**: CACHE bumped from v117 to v118.
- **`tools/verify/glance-quiet.mjs`**: four WO-6.7 checks changed what they assert, deliberately:
  - The chip regex.
  - The grades-due probe, which asserted the opposite of ruling 1.
  - Two checks that asserted "this row draws nothing in its place". The first run of the delivered tree was red on exactly these two (`1387 · 1385 · 2`).
  - The cleanup filters now also cover the `wo68` prefixes, and the block puts `openClassId` back afterwards.
- **`plans/work-orders/phase-6-calendar-glance.md`**:
  - Both rulings recorded under their Open paragraphs.
  - The note beside line 1.
  - Six boxes ticked, and line 6 left open with its reason.
  - WO-6.1's box ticked and its `**Owes**` removed.
- **`design/mockups/proposed-phase6.css`**: a § GLANCE banner note about `.gl-row-out` and the declined icons and avatars.
- **`TESTING.md`** § WO-6.8, and **`tools/README.md`**: count 1364 → 1378, plus a WO-6.8 paragraph.
- **Housekeeping, not files.** I killed three hung `verify-shell.mjs` node processes (my own runs) and the leftover `pb-verify-` headless Edge processes from those runs.

## Temptations declined

- The drawing's leading SVG row icons. The app has no sprite for them.
- Class avatars on queue rows. The colour index belongs to `src/home.js`.
- The grid subtitle and the *Your classes* caption. Both are WO-6.4's, as WO-6.7 noted.
- A second lead-time setting. Ruling 2 says one window.

## Proposed follow-ups (not done)

- If the owner rules line 6 strictly: move the three vocabulary names behind something `weekItems()` / `closingIn()` already hand over. That would mean changing what a reader returns, which WO-6.7's "hand back the engine's own records" rule resists. It is the owner's call, so I did not try it here.

## Commands run (results read from output)

- **`node tools/wo-sweep.mjs`**
  - Baseline: `42 · 39 · 0 · 3`.
  - Mid-work: red on the call-site count (1378 vs 1364) until `tools/README.md` was updated.
  - Final: `42 checks · 39 passed · 0 failed · 3 to review`.
- **`node tools/verify-shell.mjs`**, five runs:
  1. `1387 · 1385 · 2 failed`, EXIT=1. The two WO-6.7 checks this row changes.
  2. Mutated M1–M4: `1379 · 1374 · 5 failed`. Hung, killed.
  3. Mutated M2 and M3: `1387 · 1385 · 2 failed`. Hung, killed.
  4. Reverted: `1387 · 1387 · 0 · 0`, 475s. Hung, killed.
  5. Reverted, stray Edge processes cleared: `1387 checks · 1387 passed · 0 failed · 0 skipped`, 475s, `EXIT=0`.
- **`node tools/wo-gate.mjs --audit`**: PASS (after WO-6.1's pointer was discharged).
- **`git ls-files --eol`** on every changed file: all `w/lf`.

## Draft CHANGELOG entry (for the teacher; not written to CHANGELOG.md)

> **The home screen now says what is coming, what is waiting, and what is closing in.** Under the class cards, *Today and this week* lists what is on the calendar for the next seven days. Each event opens the calendar's week on its day, and each due date opens the assignment. *Waiting to be graded* lists every assignment with blanks in it, and one tap opens its column in the score grid. *Closing in* shows grades-due dates once their warning has started, along with term edges and a count of IEP/504 reviews in the same window. The count never shows a name or a date, and it disappears the moment presentation mode is switched on. A grades-due date lives under *Closing in* and nowhere else on the page. Panels with nothing in them are not drawn.
