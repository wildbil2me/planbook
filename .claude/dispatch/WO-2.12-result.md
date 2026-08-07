# WO-2.12 — Portrait shows today, landscape shows the week · implementation report

**Route** Claude (work-order-implementer), Opus tier
**Built** 2026-08-07
**Verification** `node tools/verify-shell.mjs` → **359 of 359, 0 failed, 0 skipped**.
`node tools/wo-sweep.mjs` → **11 checks, 10 passed, 0 failed, 1 to review** (the standing
sensitive-field-name line, at the same 172 mentions across the same files as before this work order).
Five mutation proofs, all reverted.

**Nothing was committed.** The tree was clean of WO-2.11 by the time I finished — it was committed
as `23f7420` by someone else mid-run — so what is uncommitted now is this work order only, across
nine files.

---

## Against the six Acceptance lines, one by one

### 1. Portrait draws exactly one day column — today's — with the Passes column intact. ✅

**Verified.** `dayColumnCount()` returns `PORTRAIT_DAY_COLS = 1` when `innerHeight >= innerWidth`,
before the width budget is consulted at all.

Measured on the owner's own 834×1112 with an emulated coarse pointer, not on 768×1024 — her iPad is
the 834pt 11″ and it is the width that made this work order necessary:

```
PASS | portrait draws exactly one day column, it is today's, and the Passes column is still there
  :: 1 day column(s) ["2026-08-07"] against today = "2026-08-07", beside a 272px Passes column, at 834x1112
```

Three clauses on purpose. The second is the one a naive build would miss: a grid that drew one column
of the *wrong date* satisfies "exactly one" perfectly.

### 2. Landscape still draws six, on the same device, with no reload. ✅

**Verified, and this is the line that turned out to need code the work order did not name.** Nothing
in this app listened for a rotation. `dayColumnCount()` is read when the grid is *painted*, so before
this the iPad could be turned and the grid kept whatever it had — invisible while both orientations
drew six, and "turn the iPad and it still says today" the moment they differ. A
`(orientation: portrait)` media-query listener is the repaint.

The check turns the *same emulated device* from 834×1112 to 1112×834 and reads the grid **without
the harness repainting it**:

```
PASS | turning the same device to landscape draws six again — no reload, and nothing repainted it by hand
  :: 6 day column(s) at 1112x834, most recent = "2026-08-07" against today = "2026-08-07"
```

That "nothing repainted it by hand" is load-bearing. Every other section of `verify-shell.mjs` calls
`renderAttendance()` after each resize — which is exactly why a build with no listener could have
passed everything. Removing the listener turns this check red.

### 3. Rotating the iPad mid-class repaints without losing scroll position or an in-flight mark. 👤 — **not ticked**

**I did not tick this and cannot.** Scroll position down a 26-name list and a thumb mid-tap need the
real device.

**The desk-side evidence I can offer**, which is the half a desk can answer:

- The mark made in portrait is still on the cell **and still in the document** after the turn:
  `the cell read "A" before the turn and "A" after it; the document holds "A"`. It is walked to `A`
  rather than tapped once on purpose — one tap on a `?` means *present*, present is stored as no
  entry, and asking the document about it would be asking about an absence of data.
- There is structurally no "in-flight" mark to lose: `setMark()` stores on the tap and `setNote()`
  writes per keystroke, so the repaint has nothing buffered to drop. What a repaint *does* cost is
  the caret, if the teacher is mid-word in a note when she rotates — stated in the code comment
  rather than papered over.
- `renderAttendance()` draws from module state, so the filter, the search, the open detail panel and
  the page offset survive the turn by construction.
- Scroll position: **not measured, and I have no evidence for it.** Headless with no visible frame is
  a poor witness for scroll behaviour, and the rotation itself changes the viewport height, so any
  number I produced would be about the emulator.

`TESTING.md` § WO-2.12 lists this as the first 👤 line of the sitting.

### 4. Full student names readable in portrait without truncation, at the owner's roster's longest name. 👤 — **not ticked**

**I did not tick this and cannot.** "At the owner's roster's longest name" is her roster and her
eyes, at arm's length, at a door.

**The desk-side evidence:** the WO-2.10 note-panel section already writes a deliberately long name
in ("Delacroix-Nguyen, Xiomara", 279px laid flat) and the check that used to assert the name was
*squeezed* now asserts the opposite, which is what this work order promised:

```
PASS | a long name is drawn IN FULL in portrait — one day column leaves the name column more than it wants,
       so the cap never engages (the desk half of WO-2.12 acceptance line 4)
  :: the name is over its box by 0px (<=0 is whole) in a 175px span; the column wants 279px and
     1 day column(s) plus a 251px Passes column leave 365px of a 688px wrap
```

So the ellipsis does not engage at the longest name the harness can construct. Whether *her* longest
name reads at arm's length is hers.

### 5. The grid's wrap does not overflow in either orientation. ✅

**Verified**, four separate measurements: `over = 0` at 834×1112 and 1112×834 in the new section, and
the pre-existing WO-2.10 checks at 768×1024 and 1024×768 (`wrap client 688, scroll 688` and
`wrap client 944, scroll 944`). The valve stays shut. Raising the name cap does not endanger it —
portrait's table wants 256 + 160 + 72 = 488px of a 688px wrap, landscape 848px of 944px.

### 6. A narrow laptop window does not fall to one column. ✅

**Verified**, and this is the line I designed against rather than around:

```
PASS | a 900px laptop window is LANDSCAPE and keeps its week — 5 day columns, not one
PASS | a 1280px laptop window is LANDSCAPE and keeps its week — 6 day columns, not one
```

Both assert `portrait === false` and `coarse === false` first, so a leaked touch emulation cannot
make them vacuous. 1280 is the control: a build that had capped every fine-pointer window at five
would fail the pair.

**Mutation proof that this line is really being tested:** implementing the rule as `w < 1024 → 1`
turns *exactly this check* red and nothing else.

---

## Mutation proofs (all reverted; tabulated in `TESTING.md` § WO-2.12)

| Mutation | Result |
|---|---|
| the portrait branch removed, leaving the width budget | **3 red** — 834pt portrait comes back at four columns |
| portrait implemented as a WIDTH rule (`w < 1024 → 1`) | **1 red** — the 900px laptop window falls to one column |
| `MIN_DAY_COLS` applied to the portrait answer (`Math.max(3, 1)`) | **3 red** — portrait draws three |
| the `(orientation: portrait)` listener removed | **3 red**, the "no reload" one among them |
| the turn repainting without locking a past column that has left the screen | **1 red** — banner still says "not today", today's cell is not a button |

**One mutation that did *not* go red, and it changes what the third deliverable claims.** Putting the
coarse name cap back to **232px** leaves all 359 checks green: with one day column the name column
takes its spare either way, and the 279px name is drawn in full at 232 and at 256 alike. The cap
*releases the floor* rather than truncating — which is what the rule's own comment has always
claimed, and this is the first time it has been measured from both sides. So **256 is a revisit, not
a fix.** I kept it because the deliverable asked for the number to be revisited, WO-2.8's pressure on
it is gone, and 256 is the top of the stated 200-to-256 band and the value that truncates least
*where the column is actually squeezed* — but nothing on a full-screen iPad depends on it, and I
would rather say so than let it read as the thing that bought acceptance line 4.

---

## The defect I found and fixed, which no line asked for

**An unlocked past column survives a turn that takes it off the screen.** `editingPast` is module
state and a repaint does not touch it, so: unlock Tuesday in landscape, turn the iPad upright,
Tuesday is no longer a column — but `editDate()` still answers Tuesday, so **every cell in today's
column comes back read-only** and the banner above them names a day that is nowhere on screen. A
teacher at the door with a class walking in cannot mark anybody, and nothing about it looks like a
rotation bug.

`pageDays()` already carries the rule that settles it — *the strip saying which day you are editing
is only honest while that day is on screen* — and a turn is simply the second way that day can leave,
so it takes the same exit through `lockPastDay()` (which clears, repaints, and announces). The
mutation that removes the branch reproduces the defect exactly:
`banner up = true, today's cell is tappable = false`.

I judged this in scope: without it this work order ships a screen that cannot be marked on, which is
a defect *created by* the change rather than an improvement adjacent to it.

---

## Decisions the work order did not settle

**1. Orientation alone, with no pointer gate.** I considered gating the portrait rule on
`(pointer: coarse)` as well, so that only a touch device ever drops to one column. I went with
orientation alone because the work order says so twice ("The orientation is the signal";
"Orientation is the signal, not width alone") and because acceptance line 6's own justification — *a
900px browser window is landscape* — is an argument that the laptop is protected **by being
landscape**, not by being a laptop. The consequence, stated plainly: **a laptop browser window
dragged taller than it is wide (say 600×900) draws one day column.** I judged that coherent rather
than broken — it is a deliberate, rare act, and the old behaviour there was three columns spilling
into the overflow valve, which is worse — but it is the one input where a cold verifier could
reasonably disagree with me. If the owner wants the fine pointer exempt, it is one clause.

**2. `h >= w` arithmetic rather than a second `matchMedia` call.** It is exactly what CSS's
`(orientation: portrait)` means (square counts as portrait), so the module and any future stylesheet
rule cannot disagree; and it is what lets the two optional arguments reach the answer, the way
`width` already did. The *listener* still uses `matchMedia`, because a media query is the only thing
that fires once per turn rather than fifty times per window drag.

**3. The listener lives in `src/attendance.js`, not `src/shell.js`.** shell.js owns every other
listener in this app, but those are delegated DOM listeners on `document`. This is not a DOM event —
it is this module's own measurement changing its answer. It imports `currentView()` from
`src/views.js` to apply the same guard `afterClassChange()` applies (don't paint a hidden screen);
that import closes no loop, since views.js imports only prefs.js.

**4. `sw.js` cache bumped v25 → v26.** Three SHELL files changed (`index.html`,
`src/attendance.js`, `src/attendance.css`) and the header rule is to bump in the same commit. Every
prior work order that touched SHELL did the same.

**5. WO-2.12's status is 🔨 IN PROGRESS, not ✅ DONE.** Four of six lines are closed at the desk; the
two 👤 lines are open. That is the posture WO-2.1 took while its 👤 lines were outstanding.

**6. WO-2.1's status left at ✅ DONE** even though its acceptance line 2 is now unticked. The line was
*replaced*, and re-opening a shipped work order's status would misreport the phase dashboard; the
rewritten line and its reason are in both documents and the sitting is listed under § WO-2.12.

---

## Small truthfulness fixes made in the same pass

Each is a sentence the screen would have said wrongly with a one-day window, and each is commented
as WO-2.12's:

- The table's accessible caption said *"the last **1** weekdays are the columns after it"*.
- `pageDays()` announced *"Showing Tuesday to Tuesday"* and *"Back to this week"* for one day.
- The "today is not on screen" banner had the same *"X to X"* range.
- The pager's tooltips promised *"the six weekdays before these"* — already wrong on a 900px laptop
  window, which draws five.
- The pager's range strip read *"Aug 7 – Aug 7"*.

None of these changes what landscape draws; the wordings are built from `columns.length`, which is
six in landscape exactly as before.

---

## Out-of-scope temptations I declined

- **`pageOffset` is in whole windows, and a turn changes how wide a window is.** Paged back three
  taps in portrait (three days) and then rotating lands you eighteen weekdays back rather than three.
  Re-anchoring the offset on the date that was on screen is ~10 lines plus a bounded search, and I
  left it: the range strip names the dates, "Today" is one tap away, and the flow the work order
  describes (turn the iPad to reach Tuesday) starts at offset 0 where nothing is wrong. **Candidate
  follow-up**, and it is the one I would raise first.
- **A `resize` repaint for the fine pointer.** Dragging a laptop window from 1280 to 900 still does
  not redraw the grid — same as the shipped build. Fixing it needs a debounce and buys a case nobody
  reported. Not done, deliberately; the listener is for a *turn*.
- **The name column's furniture.** The ~95px of avatar + ⋯ + padding before a letter of a name is
  now the biggest single consumer of the portrait name column. Untouched.
- **`plans/work-orders/README.md`'s "if the schedule slips, cut WO-2.12 first" line.** Now moot but
  it is a planning artifact and not mine to edit.

---

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\src\attendance.js` | The portrait rule in `dayColumnCount()` (+ optional `height`), `PORTRAIT_DAY_COLS`, the `MIN_DAY_COLS` exception comment, `NAME_COL_COARSE_PX` 232 → 256, the rotation listener and its past-column reconciliation, the one-day wordings, the header section, the note at `editPastDay()` |
| `c:\dev\planbook\src\attendance.css` | The coarse name cap 232 → 256 with the new arithmetic; four comments re-pointed (the Passes column, the coarse panel width, the overflow valve, the phone block) |
| `c:\dev\planbook\index.html` | The class-view comment now says "or today alone, in portrait" |
| `c:\dev\planbook\sw.js` | `CACHE` v25 → v26 |
| `c:\dev\planbook\tools\verify-shell.mjs` | A new WO-2.12 section (10 checks) and one existing check in the WO-2.10 block changed sides |
| `c:\dev\planbook\tools\README.md` | The check count 344 → 359, with the 349 correction explained |
| `c:\dev\planbook\TESTING.md` | WO-2.1's line 2 rewritten in both places; § WO-2.8's portrait question marked answered; a new § WO-2.12 with the desk pass, five mutations and the 👤 sitting |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | WO-2.1's line 2 rewritten with the old line kept as a quote; the rotate-to-backfill cost beside WO-2.1's unlock deliverable; WO-2.12 status, notes and acceptance ticks |
| `c:\dev\planbook\plans\ROADMAP.md` | Phase 2's "mark a past date" amended with the backfill cost; the hall-pass line's WO-2.12 pointer given its outcome |

**Not touched, deliberately:** `CHANGELOG.md` (below, as a draft only), and the check count in
`tools/README.md` is corrected by arithmetic rather than by re-running the previous tree — my diff
against `23f7420` adds exactly ten `check()` calls and re-points one, so 359 − 10 = 349 is what that
tree really had, against the 344 it recorded.

---

## A note on the harness count

`tools/README.md` said **344** at WO-2.11. The tree I arrived on measures **349**. I could not
re-measure the WO-2.11 tree directly (that needs a stash, which the sandbox declines, and rightly —
the brief said not to touch the tree), so the correction is by subtraction and it is stated as such
in the file. This is the second time this line has drifted the same way — checks added after the
number was written down — and the README's own footnote already describes the first.

---

## Draft `CHANGELOG.md` entry — yours to decide on, not written

> ### Portrait shows today; landscape shows the week
>
> The registry now draws **one day column in portrait — today's** — and six in landscape. Held at the
> classroom door the screen is for marking the period walking in; the six-day window is something you
> read at a desk, and you turn the iPad for it. Turning it repaints straight away: no reload, no tap,
> and the mark you just made stays where you put it.
>
> This replaces the width budget WO-2.8's hall-pass column forced on the grid, which had been quietly
> taking day columns away — four on a 768pt iPad, five on an 11″. With only today's column to pay
> for, the name column stops competing for width and full surnames fit without an ellipsis.
>
> The cost, and it is deliberate: **backfilling a past day needs a day column, so correcting last
> Tuesday means turning the iPad.** There is no setting for this and there will not be one — the
> orientation is the signal.

---

## What a verifier should know before reading the code cold

- **`h >= w` looks like it should be `matchMedia('(orientation: portrait)')`.** It is that, written as
  arithmetic so the two optional arguments reach it; the comment at the branch says so. The listener
  *does* use `matchMedia`.
- **The colours-inline / no-CSS-variables rule is untouched** — this work order changed one number in
  the stylesheet and no colour.
- **No new control was added,** so the coarse block needed no new 44px rule. `wo-sweep.mjs`'s "every
  control added in the working tree appears in the coarse block" check reports `1 new selector(s),
  all covered`.
- **Nothing here touches accommodation, medical, or plan data.** The sweep's standing review line is
  at the same 172 mentions across the same files as before.
- **No `localStorage` key was added.** The orientation is read, never stored — a preference for it is
  what the work order puts out of scope.
