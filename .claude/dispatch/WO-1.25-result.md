# WO-1.25 — Phase 6 is cut against a model that is not there · implementation result

**Route** Claude (work-order-implementer) · **Reported** 2026-08-19
**Files changed** — four, all under `plans/`. No `src/`, no `index.html`, no `docs/`, no `sw.js`.

- `plans/work-orders/phase-6-calendar-glance.md` — the re-cut (all four work orders)
- `plans/work-orders/phase-3-gradebook.md` — WO-3.26 booked, appended at the end of the file
- `plans/work-orders/phase-1-shell-store-roster.md` — WO-1.7's `**Out of scope**` re-aimed; WO-1.25's
  own nine Acceptance boxes ticked
- `plans/work-orders/README.md` — § The files (Phase 3 row), § Dashboard (Phase 3 row + totals),
  § Ship 2 (new row #75, WO-3.18 → #76 and WO-G2 → #77, plus the booking note)

The owner's pre-dispatch authoring in `phase-1-shell-store-roster.md` and the two README rows was
left alone and built on, as the brief said to.

---

## The nine Acceptance lines, one by one

**1. `node tools/wo-gate.mjs --audit` passes, and `--self-check` passes. — MET (ticked)**
Both run by me, exit 0, output read.
`--audit` last line: *"PASS | every fragment matches exactly one roadmap box, every **Owes** pointer
lands on an open box, every uncounted box has a struck or deferred work order behind it, § The files
names what its files hold, and every dashboard row matches its own boxes."*
`--self-check` last line: *"PASS | 18 of 18 plants were caught."*

**2. Every `**Closes roadmap**` fragment in Phase 6 matches exactly one box, the IEP/504 fragment
moved, gone from WO-6.1. — MET (ticked), with one wording caveat stated below**
`--audit` reports all eight Phase 6 fragments `ok`:

```
ok   WO-6.1   ROADMAP.md:488  [ ] Event model: date or range, title, kind, optional class and s…
ok   WO-6.1   ROADMAP.md:495  [ ] Grades-due deadlines
ok   WO-6.1   ROADMAP.md:498  [ ] Recurring events by materializing instances.
ok   WO-6.2   ROADMAP.md:489  [ ] Derived events computed at render from assignments, terms, an…
ok   WO-6.2   ROADMAP.md:497  [ ] IEP/504 review dates
ok   WO-6.3   ROADMAP.md:490  [ ] Month and week views, filterable by class.
ok   WO-6.4   ROADMAP.md:491  [ ] The glance page
ok   WO-6.4   ROADMAP.md:494  [ ] Honest empty states.
```

**The caveat, so the verifier does not have to find it.** The Acceptance line says *"under the work
order that renders it"*, and the Deliverables line says *"Review dates move from WO-6.1 to WO-6.2:
the deliverable, the Acceptance line, and the `**Closes roadmap**` fragment with them."* Those two
can be read apart, because after this re-cut WO-6.2 **computes** the review date and WO-6.3 **draws**
the month cell. I followed the Deliverables line — the fragment is on WO-6.2 — and made the seam
explicit rather than silent: WO-6.2's fourth Acceptance line carries the rule and is re-homed to
WO-6.3 with a `→ WO-6.3` marker, so the box that grades the rendering is under WO-6.3 and the
fragment is under the work order that owns the data. If the owner reads that line as WO-6.3's, the
change is one fragment and one marker.

**3. `WO-6.2` reports `**Owes** WO-6.3`, and `--audit` resolves all three pointers onto boxes still
`[ ]` under WO-6.3. — MET (ticked)**
`node tools/wo-gate.mjs WO-6.2` prints `owes    WO-6.3   3 re-homed line(s) resolving`. (Its trailing
`FAIL | dependency WO-6.1 is ⬜ NOT STARTED` is the same line the report printed before this dispatch:
Phase 6 is unbuilt, and that is the gate refusing to start it, not a defect in this work.)
`--audit`:

```
ok   WO-6.2   [ ] → WO-6.3   Changing an assignment's due date moves it on the calen…
ok   WO-6.2   [ ] → WO-6.3   Tapping a derived due date opens the assignment, not an…
ok   WO-6.2   [ ] → WO-6.3   A review date reaches the calendar as a date and a stud…
```

`resolveRehome()` fails a pointer whose target box is already `[x]`, so three `ok` lines *are* the
"still `[ ]`" half of the claim. The three land on WO-6.3's *derived due date moves with its
assignment*, *Every item taps through to its source*, and the 👤 *review date on a month cell* boxes —
two of which I had to write, because WO-6.3 as cut carried no box for them.
WO-6.2's second line — `events[]` holds no derived entry — is the only one left closable on WO-6.2's
own evidence, and it is restated as a deterministic script (seed, render, page forward and back,
re-read `doc.events` by `id`) rather than "after using the calendar heavily".

**4. No Phase 6 work order requires knowing which classes are scheduled to meet, and WO-6.2 says so
in a `**Traps**` block naming `plans/rotating-schedule.md`. — MET (ticked)**
WO-6.2's `**Traps**` block names the file both as a link (`[../rotating-schedule.md]`, the shape
WO-2.3 uses) and as the literal repo path `plans/rotating-schedule.md`, and carries the argument: four
`stateOf()` answers of which only three are facts, `NOT_TAKEN` as the did-I-forget state, the wall of
amber, and WO-2.50's `off-term` **modifier** (not a fifth state — checked against
`src/attendance.js`, which says so at `OFF_TERM`) as the fix. WO-6.2 also gains an Acceptance line:
a future weekday shows no per-class meeting state at all, and nothing stores, derives, caches or
infers which classes were expected to meet. I read every line of the phase for the requirement:
`grep -in "schedul|meet"` returns the roadmap fragment, the `meeting` event kind, "recorded meeting",
and the trap text itself. **One thing I added that the work order did not ask for**: the roadmap box
WO-6.2 quotes contains the word *schedule*, and the fragment must match it exactly, so WO-6.2 now
carries a short paragraph saying what that word names here — the attendance ledger, not a pattern.
Without it, the one place in the phase the word survives is the one place nobody may edit.

**5. Five Acceptance lines carry 👤, and no line naming an iPad, a thumb, or a projected screen is
without one. — MET (ticked)**
`grep -c 👤 plans/work-orders/phase-6-calendar-glance.md` → **5**, all of them `- [ ] 👤` Acceptance
lines: WO-6.3's iPad legibility, WO-6.3's review-chip presentation-mode line, WO-6.3's 44px
coarse-pointer line, WO-6.4's *praise not buried*, WO-6.4's *under a second on an iPad*.
`grep -in "ipad|thumb|project"` returns three hits, all inside those 👤 lines (two of them on
continuation lines of one). The word *projected* appears nowhere in the file.
**A wording decision this forced.** WO-6.2's re-homed line quotes WO-6.3's 👤 box, and a quotation
that included the 👤 or the words *iPad*/*thumb* would have made a sixth 👤-less line naming the
device. The quoted fragments therefore start after the 👤 and avoid those words; `norm()` does not
strip 👤, so this also matters to the matcher, not only to the count.

**6. WO-6.3 names a `<body>` print attribute that is not also a click hook, and no Phase 6 surface
can print a `supports` value. — MET (ticked)**
WO-6.3's Deliverables name `data-calendar-print` as the gate, registered through `registerPrintGate()`
with an `isOnScreen` predicate in the `src/detail.js` shape (`currentView()`, because the calendar is
a view inside `<main>` and not a dialog — read out of `src/detail.js`'s `detailOnScreen()` and
`src/print-gate.js`'s header), and `data-calendar-month-print` as the **control**, with the invariant
and the scar behind it. Its last Acceptance box requires both halves: no review date, plan type or
other `supports` value on a printed month whatever presentation mode says, **and** the gate string
absent from `src/shell.js`'s delegated census. The other Phase 6 surface that could reach a
`supports`-derived value is the glance page, and WO-6.4's fifth box now says a `Ctrl+P` there emits
none of the four forbidden fields either — the only thing that reaches it is a count.

**7. WO-3.26 exists at `**Ship** 2`, closes no roadmap box, has a § Ship 2 row ahead of WO-3.18. —
MET (ticked)**
`node tools/wo-gate.mjs WO-3.26` → `ship    2`, `depends WO-3.4 ✅ DONE`, `WO-1.10 ✅ DONE`,
`blocks WO-6.4`, `PASS | gates clear for WO-3.26`. `--audit` lists it under *quotes no box* beside
WO-3.18, which is the form it was told to copy, and there is no double-quote character on its
`**Closes roadmap**` line. § Ship 2 now reads `| 75 | WO-3.26 … |`, `| 76 | WO-3.18 … |`,
`| 77 | WO-G2 … |`, with a note in the table's own voice recording the booking, the standing
obligation behind it, and *WO-3.18 and WO-G2 each moved down one; nothing moved above them.*
It is **not** added to WO-G2's `**Depends on**` — that list is curated, and the work order says so.

**8. `node tools/wo-gate.mjs WO-6.4` reports WO-3.26 among its dependencies. — MET (ticked)**
Output: `depends WO-6.3 … / depends WO-4.5 … / depends WO-3.26   ⬜ NOT STARTED   <-- not done`.
The three `FAIL | dependency …` lines under it are the unbuilt phase, as before this dispatch.

**9. § Dashboard and § The files account for WO-1.25 and WO-3.26, and the numbers match what
`recomputeDashboard()` would write. — MET (ticked)**
§ The files: `--audit` prints `ok phase-1-shell-store-roster.md WO-1.1 … WO-1.25 25 work order(s)`
and `ok phase-3-gradebook.md WO-3.1 … WO-3.26 26 work order(s)` — that section is a real check, not
a hand claim. § Dashboard: Phase 3 row `25 | 23 | 🚫 WO-3.13`, totals `**131** | **103** | **2**`
with `[███████░░░] 79%`.
**How I checked the numbers, since `--audit` reads ROADMAP's dashboard and not this one, and `--tick`
would not preview it** (it held at *"9 of 9 Acceptance lines are still `[ ]`"* before reaching the
recompute): I counted every phase file the way `recomputeDashboard()` counts — work orders minus
struck/deferred for the total, `✅ DONE` for the done column — giving 25/50/25/5/4/4/3/11/4 = **131**
and 24+49+23+1+0+0+0+5+1 = **103**, each per-file total agreeing with the count `--audit` printed in
§ The files. Then I generated the totals row with `bar()`'s own arithmetic in `node -e` and compared
it to the line on disk: **byte-identical**. This is a faithful replication of the function, not a run
of it; a `--tick WO-1.25` will now (with the nine boxes ticked) write `✅ DONE` and move Done to 104.

---

## The regression harnesses

- **`node tools/verify-shell.mjs` — ran here, and it ran cleanly.** Exit 0. Last lines:
  `975 checks · 975 passed · 0 failed · 0 skipped`, `26,354 lines · 27.0 lines per check · 311s`. I
  backgrounded it and waited for the exit before writing this; the 311s is the harness's own report.
  Unchanged by this dispatch, as expected — no code was touched.
- **`node tools/wo-sweep.mjs` — 22 checks · 19 passed · 1 failed · 2 to review, exit 1.** The failure
  is **pre-existing and not mine**: *"every SHELL file change is paired with a CACHE bump :: src/backup.js
  changed since planbook-shell-v82 was set at 4332bb0"*. `git log -1 -- src/backup.js` is `98279b4`
  (Close WO-4.1), which lands **after** the commit that set `CACHE` (`4332bb0`), so the sweep fails at
  `HEAD` on its own and my working tree contains no `src/` file at all (`git status` is four `plans/`
  files and two untracked dispatch files). **I did not bump `sw.js`** — the Out of scope line says this
  work order edits `plans/` and nothing else, and a `CACHE` bump is a claim about a shell change I did
  not make. It wants its own one-line fix before the next deploy, and it is worth the owner's eye:
  an installed iPad is currently holding a `src/backup.js` older than the tree.
  The two review items are the standing ones and are unchanged.

---

## Decisions the work order left open, and which way I went

1. **Where a grades-due event warns → WO-6.4's *Deadlines closing in*, not a banner of WO-6.1's own.**
   The work order named both options and said the first costs a re-home. Taken because the glance page
   is the 7:40am surface the lead time exists for, and a second warning surface for one fact is the
   second answer this repo keeps refusing. Consequence, stated in WO-6.1 rather than hidden: WO-6.1
   now carries `**Owes** WO-6.4` and its lead-time box is `- [ ]` with a `→ WO-6.4` marker, so the
   pointer count in the directory is **seven**, not six. `--audit` resolves all seven.
2. **The glance page is `#homeView` grown, not a sixth view.** WO-1.10 and `src/home.js` both say the
   home screen becomes it, and `src/views.js`'s one reserved Phase 6 line is *the calendar*, which
   WO-6.3 takes. So `VIEWS`, `CLASS_SCREENS`, `REMEMBERED_AS` and `DEFAULT_VIEW` are out of WO-6.4's
   scope and in WO-6.3's, and WO-6.4 gained an Acceptance box that says so in checkable words.
3. **Two boxes written into WO-6.3 and one into WO-6.4 so the re-homed lines have somewhere to land.**
   The `**Owes**` mechanism requires exactly one open box per pointer; WO-6.3 carried no box about a
   derived due date moving and none about the review chip, and WO-6.4 none about the lead time. Adding
   them is what makes the debt checkable from both ends.
4. **WO-3.26's count is assignments, not blank cells**, sourced from `openWork()` in
   `src/grade-engine.js` (which already owns the `open` / `missing` / `bonus` / `excused` distinction),
   and **a class with nothing ungraded shows nothing rather than `0`**. Both are written down with the
   alternative named, so a builder can reverse either without re-deriving the argument. WO-3.26 adds
   **no control**, and says so where the 44px obligation would otherwise apply — the count is text
   inside the card's one button, the call `src/home.css` already makes for `.class-card-state`.
5. **A third governing rule at the top of the phase file**, pointing at WO-6.2's `**Traps**`. Not
   asked for; added because Acceptance line 4 is a claim about the *phase*, and a claim that lives only
   inside one work order's trap block is one a WO-6.1 implementer can miss entirely.

## Temptations declined, and why

- **The `docs/data-model.md` amendment.** Named in WO-6.1 as its own deliverable with an Acceptance
  line grading it; not written here. That is the Out of scope line, and the WO-1.7 scar behind it.
- **The mockups' nine open questions.** `design/mockups/calendar.html` and `glance.html` were read for
  corroboration only. Two of their questions match findings here (44px chips, the review-date
  collision) and are answered in the phase file on the phase file's own reasoning; the other seven are
  not promoted. A drawing is not a work order.
- **Bumping `CACHE` in `sw.js`** to clear the sweep's red line. See above.
- **Adding WO-3.26 to WO-G2's `**Depends on**`.** The list is curated; WO-3.25 is the precedent.
- **Ticking anything in `TESTING.md`.** Nothing was built, so there is nothing owed there yet; the five
  new 👤 lines belong to unbuilt Phase 6 work orders and reach `TESTING.md` when those land.

## What I could not verify

- **Nothing in WO-1.25 needs an iPad** — it carries no 👤 line, which is why all nine boxes are ticked.
  The five 👤 lines this work order *creates* sit on work orders that do not exist as code yet; they
  are unexercisable by anyone, on any device, until WO-6.3 and WO-6.4 are built. No claim is made
  about them beyond their presence and wording.
- **`recomputeDashboard()` was replicated, not executed** (line 9 above). If the verifier wants the
  function's own word, `node tools/wo-gate.mjs --tick WO-1.25` will now reach the recompute and print
  its edits; expect it to write `✅ DONE` and Done 103 → 104, and no other dashboard edit.

## CHANGELOG draft — for the teacher to accept, reword or discard

> **Phase 6 re-cut before a line of it is built.** A read-only audit read the calendar and glance-page
> work orders against the tree they will land in and sent back eleven things. Two mattered: a work
> order whose month grid quietly invited the schedule model this app decided against on day one, and
> a work order whose acceptance could not be checked until the one after it existed. The first is now
> a trap block pointing at the decision record; the second is a debt written down in both directions.
> Review dates moved to the work order that computes them, the glance page will show *1 review coming
> up* and keep the name one tap away, the calendar gets its own print gate, and five acceptance lines
> that need a real iPad now say so. The ungraded count on the home screen went back where it belongs —
> Phase 3, in this ship.
