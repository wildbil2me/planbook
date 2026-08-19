# WO-2.52 — result (continuation half: the harness section and the paperwork)

**Route** Claude (work-order-implementer) · **continuation of the dispatch killed mid-flight**
**Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.52
**Briefs read in full** `.claude/dispatch/WO-2.52-continuation-brief.md`, then
`.claude/dispatch/WO-2.52-brief.md`, then `CLAUDE.md` and every file either one names.
**Status written to the tracker** 🔨 IN PROGRESS — by `wo-gate.mjs --tick`, which refuses ✅ DONE
while the two 👤 lines are open. See § The two 👤 lines below.

---

## Headline

`node tools/verify-shell.mjs` on the delivered tree:

```
963 checks · 963 passed · 0 failed · 0 skipped
25,927 lines · 26.9 lines per check · 306s
```

exit 0. `node tools/wo-sweep.mjs`: **22 checks · 20 passed · 0 failed · 2 to review**, both REVIEWs
the standing pair (sensitive field names; due-date/late-missing).

Two mutation runs, both applied by hand to `src/attendance.js` and both reverted (the file is
byte-identical to the tree that produced the green run — sha256 prefix `708f676b5a1cb365` before and
after):

| Tree | Result |
|---|---|
| Delivered | `963 · 963 passed · 0 failed · 0 skipped`, 306s, exit 0 |
| **Mutation 1** — `writableDate()`'s new arm forced to `return false`, i.e. the future-in-term branch deleted and the pre-WO-2.52 gate back | `963 · 958 passed · **5 failed**`, 302s, exit 1 |
| **Mutation 2** — `paintBanner()`'s `anchorShown` reverted to a test on today | `963 · 945 passed · **18 failed**`, 303s, exit 1 |

Mutation 1 is the one the work order asked for. The five reds are exactly the five claims about
**writing** to a day ahead of today — the anchor column live with nothing pressed, the upright
reading beside it, 9/3 behind its own ✏, the five-writer probe, and the WO-2.50 pair's new third
member. Every claim about what is **drawn** stayed green through it: the anchor, the band, the soft
wall, the forward stop, the arrival jump. That is the separation this work order is about, seen from
the inside.

Mutation 2 was not required and is the sharper reading. It is broader than it looks on paper: the
off-anchor band does not merely talk *over* the new message — on any screen anchored away from today
it wins the strip outright, so WO-2.51's rollover band and its button vanish too. Twelve of the
eighteen reds are in WO-2.51's section.

---

## Against the Acceptance list, item by item

**1. Strip opens with 9/2 newest, bar reads *…opens in 14 days*, no August column.** ✅ ticked, with
a **divergence note written into the work order** — this is the one place the acceptance line and
the implementation genuinely disagree and I did not paper over it.

Verified: the fixture landed on the owner's own dates by construction (today really was 2026-08-19,
ten weekdays out really is 2026-09-02), so the harness printed
`"WO-2.52 first opens in 14 days."` against 14 calendar days counted independently in Node, over a
window whose newest column is `2026-09-02` and which contains no `2026-08-19`.

**The third clause cannot be true in landscape and was red on a correct app.** The strip walks
weekdays *back* from the day it is built from, so a six-column window ending on 9/2 necessarily
draws Aug 26 – Sep 1 behind it — greyed `Off term`, nothing tappable, no button. That is decision
3's soft wall rather than a leak, and it is exactly what the 👤 line means when it says *portrait
draws one column and it is 9/2*. So the section asserts the newest column, today's absence and the
band on the landscape grid, and takes **a second reading at 834×1112** where the grid draws one
column and it is 9/2 with the band still on it. The divergence is recorded as an italic paren under
the acceptance line (maintenance step 2) and again in `TESTING.md` and `tools/README.md`.

**2. 9/2 live with nothing pressed; 9/3 behind its ✏.** ✅ Driven: a real cell click on the 9/2
column wrote a record on `2026-09-02` and left the column reading *1 to go*; paged one window on,
9/3 carries `data-attendance-edit=2026-09-03` titled *Mark this day early*, `tappable: 0`,
`tags: "SPAN"`, and takes a real mark after its ✏ is clicked. **This line is also what found the one
app defect I fixed — see § The one app change.**

**3. `◀ Earlier` still reaches August, everything out there greyed and dead.** ✅ Two taps from 9/2
landed on `["2026-08-17","2026-08-14","2026-08-13","2026-08-12","2026-08-11","2026-08-10"]`, every
column `Off term / none / 0` with `attendance-col-off-term` on the head.

**4. `Later ▶` reaches the term's end, disabled there saying why, on an empty calendar.** ✅ Five
taps ended on `2026-10-14` with the control reading
`{"disabled":true,"title":"WO-2.52 first ends on October 14, 2026 — there is nothing further in this term to look at"}`
over `0` calendar events. The section empties `doc.events` as a stated premise and restores it with
the document, so the stop being proved is the term's and not a stray day off from an earlier section.

**5. A class with no dated terms behaves as it did.** ✅ Opens on today, no band, and paged forward
every future column reads `Ahead / none / 0`. `writableDate()` refuses tomorrow, proved by the
five-writer probe: `{"setMark":false,"cycleMark":false,"takeClass":false,"dropClass":false,"editDay":false}`.
*(One day off is planted for that phase and only that phase, because with no dated term and an empty
calendar there is no future column on screen to assert the absence of a ✏ **on**. Said in a comment
at the point it is planted.)*

**6. The selected term never bounds a write.** ✅ With the tab on a term that ended 8/14 and today
inside the other, all five writers land on today. **Driven through the writers rather than through a
cell, and that is a finding rather than a shortcut:** with an ended term selected `editDate()`
answers `''`, so today — reachable only by paging — carries the 🚫 and **no ✏**, and there is no
control on the screen that marks it. I have written that into the section header, into `TESTING.md`
and into § Things I noticed and did not do below, rather than quietly using the probe and saying
nothing.

**7. Arrival selects Q2; choosing Q1 by hand sticks and anchors on 10/31 locked.** ✅ The arrival is
a **real click on `#classTabBar [data-class-tab=…]`**, the control `src/shell.js` runs the whole
chain from, not a call to `resetRegistry()`. Preference `{…:"tm_wo252a"}` → `{…:"tm_wo252b"}`, nav
highlight followed, strip opened on today. Choosing the ended term back by hand anchors on `8/14`
with `tappable: 0` and `data-attendance-edit=2026-08-14` on the head, WO-2.51's rollover band up
over it; its ✏ then opens it, the heading reads *Friday, August 14, 2026*, and a cell tap lands.

**8. Nothing moves the term while the screen is open.** ✅ The preference is byte-identical across
three repaints (`renderAttendance` ×2 + `paintRenderedTotals`) with the rollover band naming the
other term throughout — **paired with the next arrival, where it must and does move.** An unchanged
preference on its own would be satisfied by a build that never noticed the rollover, which is the
trap WO-2.51's own section documents.

**9. Trimester vocabulary.** ✅ Its own two cases here, because WO-2.51's trimester fixture covers
its band and not this one's sentences. `"Trimester 1 opens in 14 days."` with no `/quarter/i` in the
band, the state line or the pager tooltips; and the other direction,
`"Trimester 1 ended on August 14, 2026."` — which also closes decision 4's *the bar speaks in both
directions*, the only deliverable no other phase touched.

**10. The rename grep returns nothing.** ✅ `grep -rnE "editPastDay|lockPastDay|editingPast|futureLimit" src/ tools/ TESTING.md`
exits 1 with no output. **Worth knowing:** my first draft of the `TESTING.md` line quoted the
pattern, which made the grep match itself. The line now describes the four names without spelling
them, and says why — the pattern lives in the work order (which the grep does not cover) instead.

**11. `verify-shell.mjs` green with its count recorded, plus a mutation proof.** ✅ Numbers above,
all read off runs I waited for. `tools/README.md:1011` moved **918 → 943** and the paragraph beside
it records the executed count **963** and both mutation readings — from the runs, never by
arithmetic.

**12 and 13 — the two 👤 lines. NOT ticked, and not tickable by me.** They need a real iPad, a real
force-quit from the app switcher, and human eyes on whether the bar is readable at a glance. I have
no device. The harness's portrait reading at 834×1112 is *adjacent* to line 12 and I want to be
precise about what it is not: it measures how many columns the budget draws and which day they are;
it says nothing about a thumb, a safe-area inset, an installed service worker, or legibility. It
closes nothing.

---

## The one app change I made, and why it was in scope

`dayHead()`'s guard was `if (state !== COVERED && !writable) return th;` — the Deliverables' own
collapse of two tests into one. With the anchor standing ahead of today it drew **an unpressed ✏ on
September 2 itself**, and `editDay()` returns on its own first line for that date
(`date === editDate()`). A control that looks live, takes a tap and does nothing: the exact thing
that file refuses three times in writing, arrived at from the one direction the collapse did not
cover. The Deliverables say the pencil goes on *"any writable column that is not the edit date"*, so
this is the deliverable being met rather than a change to it.

The guard is now
`if (state !== COVERED && (!writable || (editing && date !== editingDay))) return th;`
with a paragraph at the point of change explaining that `editing` means *this column is the edit date
and it is not today*, while `editingDay` is the deliberate unlock which keeps its pressed ✏ because
there is something there to close. Verified on every side: today's column unchanged (its own branch
answers first), an unopened past day unchanged, a deliberately unlocked day still gets the lock ✏,
and an ended term's anchor still gets its own opening ✏ — acceptance 7 depends on that last one and
asserts it.

I found this by driving acceptance 2, not by reading. It is the reason that acceptance line exists.

---

## The `openTermForToday()` departure — asked for by the continuation brief

**It is right, and it is load-bearing.** The original brief assumed *the arrival paint that follows
redraws the bar anyway*. It does not. Read from the call graph:

- both callers of `resetRegistry()` refresh the bar **before** it — `src/shell.js:968` via
  `classes.selectClass()`, and boot at `src/shell.js:2054` via an explicit `refreshClassBar()`;
- `afterClassChange()` (`src/shell.js:458`) repaints the home grid, the class screen and the screen
  nav — and **not** the class bar or the term nav;
- `refreshClassBar()` has exactly one call site in the whole arrival chain after the preference can
  move, and it is the departure's own: `src/attendance.js:4772`.

So without it the nav's active mark would sit on the term the teacher was just moved off, with the
counts under it describing the other one. The harness asserts `nav active` off the DOM on arrival
(`"tm_wo252a" -> "tm_wo252b"`), which is the reading that would go red. Writing it at the call site
rather than inside the writer also keeps `openTermForToday()` honest about being a writer, which is
what its own header claims. I changed nothing about it.

---

## Files changed in this half

- `tools/verify-shell.mjs` — **the WO-2.52 section**, 22 `check()` call sites (one a fixture-guard
  failure arm that never fires on a green run), inserted directly under the WO-2.51 section, with the
  in-place document restore copied from it; plus **one** call site added inside the WO-2.50 section —
  the third member of its `acceptedToday`/`acceptedPast` pair, asking the same nine writers about a
  date ahead of today and inside a term, which is where the original brief said the future-in-term
  case had to join.
- `src/attendance.js` — the `dayHead()` guard above, and nothing else.
- `tools/README.md` — `918` → `943` at :1011, and a WO-2.52 entry in the paragraph beside it
  recording the split (2 of the 25 are the repaired WO-2.50/2.51 sections from the first half, 23 are
  this one's), the executed count, the portrait divergence, the "taken class stores what is not
  present" red, and both mutations.
- `TESTING.md` — the WO-2.52 section: 11 ticked lines, the two 👤 lines left open, the three-run
  table, and the `dayHead()` note.
- `plans/work-orders/phase-2-attendance.md` — 11 Acceptance ticks, the divergence paren on line 1,
  and `Status` → 🔨 IN PROGRESS (written by `wo-gate.mjs --tick`).

Untouched, deliberately: `CHANGELOG.md` (drafted below), `index.html` (the owner's uncommitted
placeholder edit), `sw.js` (already at `planbook-shell-v80` from the first half — checked, not
re-bumped), `plans/work-orders/README.md` (see below).

**Diffstat read before finishing, per the Traps and WO-2.49.** 1,862 insertions / 203 deletions over
11 files; `tools/verify-shell.mjs` is 851/65, which is my ~660-line section plus the first half's
191/65. **Every file in the tree is LF and stayed LF** — I checked each one I touched with a byte
scan, before and after. *(One correction to the continuation brief: it says every touched file is
"CRLF throughout as the repo already was". The repo is **LF** throughout — `.gitattributes` absent,
`core.autocrlf` false. Nothing is wrong; the brief's word is. I wrote LF.)*

---

## The roadmap row

Already correct and I added nothing to it. `plans/work-orders/README.md` carries the index range
(`WO-2.1 … WO-2.52`), the running-order row #74 and the dashboard's `50 / 128 / 78%` — all written
when the work order was cut. **The Done column stays at 48** because `--tick` left the work order at
🔨 IN PROGRESS, and its own note says so: *an unfinished work order closes nothing*. `wo-gate.mjs
--audit` passes: every fragment matches one roadmap box, § The files names what its files hold, every
dashboard row matches its own boxes. When the owner closes the two 👤 lines, ticking them and
re-running `--tick` writes ✅ DONE and the Done column moves to 49.

---

## Things I noticed and did not do

Named here rather than acted on, which is what the dispatch folder is for.

1. **With an ended term selected, today cannot be marked from the screen.** `editDate()` answers
   `''`, so nothing is live; paging forward to today gets a 🚫 (which works) and **no ✏**, because
   `dayHead()`'s `date === today` branch answers before the pencil does. The route out is the
   rollover band's *Switch to …* button, which is on screen the whole time — so this is coherent
   rather than broken, and the Deliverables say *the 🚫 stays on today's column and nowhere else*.
   But it is a real "I want to mark today and cannot" on one kind of screen. Out of scope; worth a
   sentence to the owner.
2. **A `tools/README.md` trap this section nearly walked into and the next one will.** A taken class
   stores what is *not* present — the tapped student's `P` is `cellFor()`'s default — so a check
   asking for the marked student's own key in the record reads back a record holding only the *other*
   student. Recorded at the check and in `tools/README.md` rather than only here.
3. **I did not write a second harness** and nothing in this work order needed one. Every acceptance
   line 1–11 is driven by `verify-shell.mjs`.

---

## `CHANGELOG.md` — draft only, for the teacher to decide

Under `## [Unreleased]`:

> **The register opens on the term you are in, not on today.** Before your first term starts, the
> attendance grid used to show six days that were all outside it — greyed, nothing to tap. It now
> opens on the term's own first day, with a line above it saying *Quarter 1 opens in 14 days*, and
> that day can be marked early: **a day inside one of your terms is markable ahead of time, and a day
> outside every term still is not.** Marking a day early records it, so it counts as a meeting from
> that moment, in the term percentage and in the year total.
>
> Paging back still walks out of the term into the greyed days before it; `Later ▶` now runs to the
> end of the term and says so when it stops. When today moves into a new term, **opening the class**
> moves the tab with it — never while you are working on the screen. Terms are always named from your
> own labels, so trimesters and semesters read correctly.
