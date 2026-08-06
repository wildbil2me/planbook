# WO-2.1 — Attendance registry: students × recent days · implementation result

**Route** Claude, Opus tier (work-order-implementer) · **Date** 2026-08-06
**Brief** [`WO-2.1-brief.md`](WO-2.1-brief.md) · **Work order**
[`plans/work-orders/phase-2-attendance.md`](../../plans/work-orders/phase-2-attendance.md)

**Verification, on the shipped tree:**

```
node tools/verify-shell.mjs   → 274 checks · 274 passed · 0 failed · 0 skipped   (was 260)
node tools/wo-sweep.mjs       → 11 checks · 10 passed · 0 failed · 1 to review   (the standing one)
```

The one REVIEW is the long-running sensitive-field-name line. Its count is unchanged at 172, and
the two mentions in `src/attendance.js` are both inside the header comment that says what is
deliberately absent from this screen — no code path in that module reads `supports`.

---

## Against the twelve acceptance lines, one by one

### 1. A mark lands and survives a reload — ✅ ticked

Driven end to end: tap a cell, `store.flush()`, `Page.reload`, then read the record back out of
IndexedDB and reopen the grid. Three checks:

- *"a mark lands and survives a reload — it comes back out of IndexedDB, not out of memory"*
- *"and the card behind it says what the document says, without anything being reopened"*
- *"and the grid it reopens to shows those two marks in today's column, on those two rows"*

The flush before the reload is deliberate — `tools/README.md` trap 6 says an unflushed reload reads
as a persistence bug that is not one.

### 2. Six days of columns for a class of 26, no sideways scroll, on the iPad — ❌ NOT ticked · 👤

**I cannot close this and did not.** It needs the owner's iPad in the orientation she holds it, and
no emulator has that. What I *did* check, and what is not the line:

- Six `<th>` day columns render for a 26-name class, and the rendered dates equal a window this
  harness derives from the calendar itself in Node (not asked of the app).
- The grid does not overflow its own box, the panel, or the page — measured at a 750px viewport in
  the attendance section and again at an emulated coarse 1024px in the touch section, where all 46
  visible controls clear 44×44.
- I looked at two screenshots of the rendered grid at both viewports. That is my eyes on a desktop
  render, not a thumb on an iPad.

### 3. Dropped vs untaken, distinguishable in the header AND the cells, and in the document — ✅ ticked

The check compares computed styles of all three column states — head chip word, chip colour, cell
glyph, cell background, cell text colour — and additionally asserts the border *style*: dashed for
"didn't meet", solid for the other two, in the head and in the cell. Four properties apart, not one,
so a build differing only by a shade of grey fails.

The document half is a separate check: the dropped day holds `{classId, date, exception}` and the
untaken day holds no record at all.

**Proved non-vacuous:** painting an untaken cell in the taken palette turns this check red.

### 4. Taken with zero exceptions still creates a record — ✅ ticked

*"one tap records a class as met with everyone present, and it is a record rather than a silence"* —
key set is exactly `classId,date,marks`, `marks` is `{}`, no `exception` key, and the column head
reads "Taken". Plus the paired check that this is a *different thing in the document* from "not
taken yet", read off two classes at once.

### 5. One tap drops a class; one tap undoes it — ✅ ticked

Driven from **today's column head** (`🚫` → `↩`), which is where the work order puts it. Deliberately
run against the class with an empty roster, because "the class can still be marked as met, or as not
meeting" is a deliverable and an empty class is exactly where a screen that hides its table would
hide the only two controls that could say so. (That is a real defect I hit and fixed mid-run: the
first cut hid the whole grid — header included — whenever there was nothing under it.)

What a dropped column's *cells* look like is asserted separately, against the 26-name class, where
`rows.every(...)` is not vacuously true.

### 6. A class of 25 with two absences in under 15 seconds — ❌ NOT ticked · 👤

**Needs a real iPad and a stopwatch.** The desk pass can say the path is one tap per absence, two per
tardy, with nothing to submit and every control at 44px; it cannot say fifteen seconds.

### 7. A date two weeks back, landing on that date, from this screen — ✅ ticked

One tap of **◀ Earlier** pages the window back six weekdays; the harness asserts the new columns
equal the calendar-derived second page and that its oldest column is ≥14 calendar days back (15 on
the run date). Then the column's ✏ is tapped, a cell is cycled, and three things are asserted: the
record landed on *that* ISO date with `marks` holding exactly one entry, today's record is unchanged,
and the column beside it has no record at all.

No separate view, no date picker — the tombstone's point, kept.

### 8. The "not today" indication visible in a glance, in a classroom — ❌ NOT ticked · 👤

**Legibility across a room is a human-eyes claim and I have not made it.** What is checked: unlocking
a past day puts a strip on screen (`#attendanceBanner`, not `hidden`) whose text reads *"You are
editing Wednesday, July 22, 2026 — not today."*, the section label repeats that date, and the column
itself carries `attendance-col-editing`. Paging away from today shows the same strip with the range
and "Today is not on screen." Both offer "Back to today", and the one-tap return is driven.

### 9. Future dates blocked or clearly flagged — ✅ ticked

Both halves:

- **On screen:** every rendered column is `<= today`, and **Later ▶** is present-but-disabled at the
  window that ends today with the title *"Today is the last column there is — tomorrow's attendance
  is not something to record yet"*.
- **In the writer:** `writableDate()` gates all five writers. This is the one check in the file that
  writes through the `window.planbook` seam, and it is named as such in the section header comment —
  a blocked path has no control to click, which is the claim. Three writes aimed at tomorrow
  (`setMark`, `takeClass`, `dropClass`) leave the record count unchanged.

**Proved non-vacuous:** dropping the `<= todayISO()` clause turns two checks red.

### 10. A hole left three days earlier, findable by looking — ✅ ticked

The fixture acts on every column of one class's week *except one*, then asserts that exactly one
column reads "Not taken", that it is the one skipped, and that every row shows exactly one `?` at
that index. The hole is a full-column amber wash plus a `?` in every cell, against `P` on green for
taken days and a dashed `–` for the dropped one. I looked at the render; the stripe is the first
thing you see.

### 11. All five marks from a cell, no submenu, no leaving the row — ✅ ticked

One cell is tapped five times and the walk is asserted to be exactly `A → T → E → D → P`, with the
record left holding zero marks at the end (present is the wrap-around and is stored as nothing).
Submenu-shaped controls (`select`, `[aria-expanded]`, `details`) inside the grid: 0. The row is never
left — every tap is on the same `[data-attendance-cell][data-attendance-date]` pair.

A paired check covers the first tap's side effect: an untaken column of `?` becomes a taken column of
`P` with one tap.

### 12. No `P` entries after a full day of five classes — ✅ ticked

Asked of the whole document, twice — as an absent key and as the complete key set (`ADET`) — over a
day with all four stored codes on it across five classes and six days, including past-dated records.
The 22 silent students in the 26-name class are the claim; the four loud ones make the silence mean
something.

**Proved non-vacuous:** making `setMark()` store `P` instead of deleting turns **7 checks** red.

---

## The mutation proofs, in full

Run before this file was written, each reverted afterwards, because a check about an absence goes
green whatever the build does until it has been seen go red.

| Mutation | Result |
|---|---|
| `setMark()` stores `P` instead of deleting the entry | **7 red**, incl. acceptance 12 and 1 |
| an untaken cell painted in the taken palette | **1 red** — the three-state comparison |
| the `<= today` clause dropped from `writableDate()` | **2 red** — the future refusal, the day tally |
| the unlock gate dropped from cell editability | **1 red** — tappable cells per row 1 → 5 |

---

## The reuse boundary — what I did with it

Per § 6 of the brief: **the storage semantics are unchanged and there is exactly one writer.**

- `stateOf()`, `recordFor()`, `marksOf()`, `countsFor()`, `stateSummary()`, `ensureRecord()`,
  `removeRecord()`, `listIn()`, `attendanceIn()` — unchanged apart from comment text.
- `setMark()`, `takeClass()`, `untakeClass()`, `dropClass()`, `undropClass()` — **signature change
  only**: each takes an explicit `date`, defaulting to the column that accepts edits. The
  exceptions-only guard, the `P`-deletes rule, the refusal to write onto a record with an
  `exception`, and the no-op-on-an-unchanged-code rule are the same lines they were.
- `cycleMark()` is new and is **not a second writer** — it reads the current code and calls
  `setMark()`. There is no `update((d) => …)` touching `d.attendance` anywhere outside the five.
- One thing added to the shared path: `writableDate()`, the future-date gate, called by all five.
  That is a new refusal rather than a new writer.
- The freshly-asked-today reasoning is preserved and extended: `editDate()` re-derives today at every
  call and discards a stale unlock, and the six-day window is computed inside the render off a fresh
  `todayISO()`, never captured at open. The header comment says so.

`getWindowedDays()`'s **shape** was taken and its **data source** was not: `dayColumns()` walks the
calendar, not `doc.attendance`. The harness asserts that against a window derived independently in
Node, precisely because a check that asked the app which dates it chose would pass either way.

Roll Call!'s `cycleAttendance()` / `cyclePastAttendance()` split was **not** imported. One cycle,
`present → A → T → E → D → present`, and the divergence from her habit is named in the UI — the hint
under the grid says in as many words that Roll Call! starts that cycle with P and this one does not,
and why.

---

## Files changed

| File | What |
|---|---|
| `C:\dev\planbook\src\attendance.js` | Rendering half replaced with the registry; writers threaded with a date; `cycleMark`, `dayColumns`, `editPastDay`/`lockPastDay`, `pageDays`, `setSearch`/`setFilter`/`setSort`, `writableDate` added |
| `C:\dev\planbook\src\attendance.css` | Rewritten for the grid; new coarse-pointer block covering every control added |
| `C:\dev\planbook\index.html` | Attendance modal markup: panel modifier, banner, toolbar (search / pills / sort), pager, table, empty line, rewritten hint |
| `C:\dev\planbook\src\shell.js` | Hook table and click listener rewritten for the grid; `data-attendance-search` added to the `input` listener |
| `C:\dev\planbook\src\shell.css` | One stale comment corrected (`.date-batch-bar` / `.search-box` predictions from WO-1.10) |
| `C:\dev\planbook\tools\verify-shell.mjs` | Attendance section rewritten; the registry's touch block rewritten |
| `C:\dev\planbook\tools\README.md` | Check count 260 → 274, with what the fourteen are and the four mutations |
| `C:\dev\planbook\TESTING.md` | New `### WO-2.1 — Attendance registry` section appended; the superseded section left byte-for-byte alone |
| `C:\dev\planbook\plans\work-orders\phase-2-attendance.md` | Nine acceptance boxes ticked, three 👤 left blank, one note added |

**Not touched, by rule:** `CHANGELOG.md`. Draft wording is at the bottom of this file. Nothing was
committed or pushed.

---

## Decisions the work order did not settle, and which way I went

**1. The work order stays 🔨 IN PROGRESS.** `wo-gate.mjs --tick WO-2.1` would flip it to
`✅ DONE — 2026-08-06` and tick five roadmap lines. I ran it `--dry-run`, read the diff, and did not
apply it: three acceptance lines are 👤 and open, and WO-1.11's precedent in `TESTING.md` is that
"done" is written after the human sitting, not before it. The individual boxes I could evidence are
ticked; the status line is not. **This is the one thing a verifier might expect and not find.**

**2. Today is always the first column, even on a weekend.** The Deliverables say "the last N
weekdays, Mon–Fri". Read literally, a Saturday has no today column — and therefore no one-tap drop
and no live column at all. Roll Call!'s own comment (`dashboard.html:3899`) says "today plus the five
preceding weekdays", so I took that: today is index 0 whatever day it is, and everything after it is
Mon–Fri. On the five days that matter the two readings produce an identical list. Named in the code
comment and in the harness comment.

**3. Paging by a whole window, not a date picker.** Acceptance 7 wants two weeks back; six columns
reach only about eight calendar days. Roll Call! answers this with a "Jump to date" `<select>`, but
the WO-2.2 tombstone says the question should not need a date picker. So: **◀ Earlier / Today /
Later ▶**, shifting six weekdays a tap, which puts a fortnight two taps away and clamps at today.
`focusedDayIdx`'s narrow-to-one-day branch was read and deliberately not taken — narrowing a grid to
one column is the screen this rebuild exists to replace.

**4. The unlocked past column keeps the pencil, pressed — it is not labelled "Done".** Roll Call!
swaps in a `Done` button. This repo's own harness greps button labels for `/^done$/i` as a sign of a
commit step, and on a screen whose header comment says there must never be one, borrowing that word
would be borrowing the vocabulary of the thing being refused. A toggle with `aria-pressed` says the
same thing. The banner's "Back to today" is the primary escape.

**5. A cell shows `P` on a taken day.** Displaying `P` is the truthful reading of an empty entry;
storing it is the trap. Roll Call! draws exactly this in the same place. Called out in the module
header so the next reader does not "fix" it, and the no-`P`-in-the-document checks read the document,
never the DOM.

**6. The filter pills read the column being edited**, not the whole window. "Show me who was absent"
is a question about the day being marked.

**7. Panel width 720px, and the tablet breakpoint deliberately does not widen it to 95vw** the way
every other dialog does. 95vw of an iPad in landscape is ~970px against 324px of columns, and the
rest is empty floor between a name and the cell on its row — a longer eye-track and thumb-track on
the one screen where both are counted in seconds. I made this change after looking at the first
render, which had exactly that problem.

**8. Conventions I set, since nothing existed:** `.search-box`, `.pill` and `.pills` had been lifted
into `shell.css` at WO-1.2 and never instanced. This screen instances `.search-box` and `.pill` as
they sit; it does *not* use `.pills`, whose absolute centring only works on a full-width panel, and
uses its own `.attendance-pills` for layout instead. `.sort-btn` was never lifted, so
`.attendance-sort-btn` is this app's first instance of that Roll Call! component under a local name.
`.date-batch-bar` is still un-instanced and I corrected the comment in `shell.css` that predicted
this work order would fill it.

---

## Out of scope — temptations declined

Each of these was one small step away and none of them was taken.

- **Percentages in the column head or a row total (WO-2.4).** A grid with six columns of marks makes
  a per-student rate look like it belongs in a seventh column. It does not; the meeting predicate and
  the formula are WO-2.4's, and a second answer computed here is exactly the second opinion this
  module keeps refusing.
- **Keyboard: arrow-key movement across the grid, letter keys to mark (WO-2.5).** The grid is a much
  better keyboard surface than the list was, and it was tempting. Left entirely alone.
- **Per-student history from a row (WO-2.6).** A row *is* a history strip six days long, and clicking
  a name to widen it to a term is the obvious next move. Not built; `.attendance-name` is inert.
- **Right-click / long-press a cell to clear back to present.** Roll Call! has this
  (`oncontextmenu` on `.att`). I nearly added it, because undoing a mis-tapped `A` currently costs
  four more taps around the cycle. I left it out: it is a desktop-only accelerator, `contextmenu` is
  unreliable from a long press in iPadOS Safari, and the keyboard/desktop path is WO-2.5's. **Worth
  reconsidering there** — it is the sharpest edge left on this screen.
- **Calendar-event-aware column state (WO-2.3).** Not built. But the column head was designed so a
  fourth reason can arrive without reshaping it: the state chip is a word plus a palette rather than
  a boolean, and `stateOf()` is still the only function that decides which.

## Three things I would propose as follow-ups

1. **A sticky column header.** Twenty-six rows at 44px is ~1150px, so the dates scroll off. It cannot
   be done today without either an inner scroller (rejected: `.modal-panel` has `overflow: hidden`,
   so `position: sticky` has no scrollport, and a scroller-inside-a-scroller steals the flick on iOS)
   or restructuring the panel. Worth WO-2.5's attention. Mitigated for now by today's column being
   leftmost, adjacent to the name.
2. **Re-render on orientation change.** The column count is computed at render from `innerWidth`, so
   rotating an iPad mid-marking keeps the columns it had until the next open. Both iPad orientations
   yield six, so this is cosmetic — but it is a real difference from what a resize listener would do,
   and I chose not to add one because a re-render resets nothing visible except the scroll position,
   which is the thing this screen most protects. Listed in `TESTING.md` as a 👤 line to look at.
3. **The right-click-to-clear accelerator**, per the note above.

---

## Draft `CHANGELOG.md` wording — for the teacher to accept, edit or bin

> **Attendance is a register again.** The marking screen was one class on one day; it is now the
> class against its last six weekdays, students down the side, dates across the top, one tap on a
> cell to cycle the mark. That is the shape Roll Call! has, and going back to one day at a time was
> a step down from the app this replaces.
>
> The reason for the columns is a question the old screen could not answer: *which day did I forget?*
> A day nobody took has no record, so it is a stripe of amber question marks you find by looking
> rather than by remembering. A day the class did not meet is dashed and grey. A day that was taken
> is green, and the empty cells on it read `P`, because present is still stored as nothing at all.
>
> Past days are markable in place — a fortnight back is two taps and a pencil — and a strip across
> the top says which day you are on whenever it is not today. There is no tomorrow column, and the
> app refuses to write one even if something asks it to.
>
> One divergence from Roll Call!, and the screen says so rather than leaving you to find it: the
> cycle is absent → tardy → event → dismissed → present. It does not start with P, because P is
> never stored.

---

## What I could not verify, restated plainly

- **Acceptance 2, 6 and 8 are open and need the owner's iPad.** I ticked none of them.
- Anything about a thumb: edge-tapping cells, VoiceOver's reading of a cell, whether the search field
  keeps focus with the software keyboard up, whether the flick down a 26-row grid behaves.
- Whether the "not today" strip and the three column palettes read from the front of a lit classroom.
- Offline launch from the precache. `sw.js` already lists both attendance files and the harness
  checks that statically, but it drives a page and has never seen a service worker.
- **Whether the owner prefers it to Roll Call!** — the line the first build failed. No harness asks
  it, and it is in `TESTING.md` as a 👤 line because it is the one that actually decides this.
