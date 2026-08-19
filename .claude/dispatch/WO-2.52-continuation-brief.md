# WO-2.52 — continuation brief · the harness section and the paperwork

**Route** Claude (work-order-implementer) · **continuation of a dispatch killed mid-flight**
**Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.52
**Original brief** `.claude/dispatch/WO-2.52-brief.md` — **read it in full first.** It is not
superseded. It holds the work order verbatim, the four decisions, the Deliverables, the Traps and
the constraints, and everything in it still governs. This file only says what is already done and
what is left.
**Report to** `.claude/dispatch/WO-2.52-result.md` — as your last act, and return it in-band too.

---

## What happened

The first implementer was killed by an API session-limit error at roughly 05:56 on 2026-08-19,
part way through the harness work. It never wrote a result file, so nothing it did was reported.
The working tree was reconstructed and re-measured from outside before this brief was written; the
paragraph below is evidence, not the dead run's prose.

## What has landed, and is measured

Re-run from the tree at 06:10 on 2026-08-19, not taken on trust:

- `node tools/verify-shell.mjs` — **941 checks · 941 passed · 0 failed · 308s.** The app code and
  the repaired WO-2.50 / WO-2.51 sections are green together.
- `grep -rnE "editPastDay|lockPastDay|editingPast|futureLimit" src/ tools/ TESTING.md` — **nothing.**
  The rename swept.
- `node tools/wo-sweep.mjs` — 22 checks · 19 passed · **1 failed** · 2 to review. The one failure is
  yours to close and is listed below.
- `git diff --stat` is proportionate (~1,030 lines over 10 files) and every touched file is CRLF
  throughout as the repo already was. **No CRLF rewrite happened** — but the Traps rule stands and
  you re-read the diffstat before you finish.

In the app, present and green:

- `src/attendance.js` — `daysUntil()` :678, `forwardLimit()` :863, `anchorDate()` :1728,
  `focusDate()` :1756, `editDate()` :1780, `editDay()` :2523, `lockDay()` :2544, the `editingDay`
  rename throughout, the midnight guard rewritten at :1785, the new banner band.
- `src/classes.js` — `openTermForToday()` :644, called from `resetRegistry()` at
  `src/attendance.js:4761`.
- `src/attendance.css`, `src/shell.js`, and `CACHE` at `planbook-shell-v80` in `sw.js`.
- `tools/verify-shell.mjs` — the existing WO-2.50 and WO-2.51 sections **repaired** against the new
  anchor, with the reasoning written in place (see :8195, :14003, :14711, :14737, :14822, :14852,
  :14873). Seven `check()` lines added or rewritten, net +2 call sites.

**One departure from the original brief, already in the tree, and you are not to revert it.** The
brief said `openTermForToday()` writes only and the arrival paint redraws the class bar anyway. The
implementation calls `refreshClassBar()` at the **call site** in `resetRegistry()` — not inside the
writer — and states why in a comment at the point of departure: both callers refresh the bar
*before* they call `resetRegistry()`, so a term moved after that paint would leave the nav's active
mark on the term the teacher was just moved off. That is the departure being made the way this repo
asks for departures. Read it, satisfy yourself it is right, and say so in your report. If you
conclude it is wrong, say that instead — with the reasoning — rather than silently changing it.

---

## What is left. This is your whole job.

1. **The WO-2.52 section in `tools/verify-shell.mjs`, which does not exist yet.** This is the bulk of
   the work. Acceptance 1–8 are each *driven in the harness, not reasoned about*, and none of them is
   driven today. Put it **after the WO-2.51 section, which ends at about :14930** with the in-place
   document restore you should copy the shape of — every module holds the reference `getDoc()` handed
   it, so the restore mutates that object rather than replacing it, and it puts back the class, the
   term, the lock and the filters it found. The eight:
   - the strip opens with 9/2 newest, the bar reads *Quarter 1 opens in 14 days*, no August column;
   - 9/2 live with nothing pressed and the record landing on `2026-09-02`; 9/3 carrying a ✏ and
     taking marks only after it is pressed;
   - `◀ Earlier` still reaching August, every column out there greyed `Off term` with nothing
     tappable — the soft wall proved from the inside out;
   - `Later ▶` reaching 10/31 and disabled there saying why, **on a document with an empty calendar**;
   - a class with **no dated terms** behaving exactly as it does today, `writableDate()` refusing
     tomorrow;
   - the selected term never bounding a write — Q1 tab up, today Nov 4, marking today succeeds;
   - today Nov 4 on a Q1 preference: **arrival selects Q2**; selecting Q1 by hand sticks, shows
     WO-2.51's band, and anchors on 10/31 **locked**;
   - repeated repaints with the screen open moving nothing.
   Acceptance 9 (Trimester vocabulary) may lean on the existing WO-2.51 trimester fixture if it
   genuinely covers the **new** band's sentences; if it does not, it is a ninth case here.
2. **The mutation proof over the new future-in-term branch of `writableDate()`** — at least one,
   applied by hand, reported red-then-green with the count each way. The existing writer-probe
   apparatus at :14331 and :14437 (`alive.moved.editDay`, `acceptedPast` / `acceptedToday`) is the
   pair the future-in-term case joins, per the original brief.
3. **`node tools/verify-shell.mjs` green afterwards**, with the check count recorded **from the run**.
4. **`tools/README.md:1011`** — the recorded `check()` call-site count and the executed-check count in
   the paragraph beside it, both **from your final run, never by arithmetic**. This is the one
   `wo-sweep.mjs` failure and it will move again as you add checks, so do it last.
5. **`TESTING.md` lines for WO-2.52.** Its diff today is the rename sweep and nothing else — the work
   order's own lines are still owed, per the maintenance protocol.
6. **Tick the Acceptance boxes your run closed**, in `plans/work-orders/phase-2-attendance.md`. All 13
   are blank. **Never tick the two 👤 lines** — they need a real iPad. A tick you cannot point at
   evidence for is worse than a blank box.
7. **The roadmap row** in `plans/work-orders/README.md`, per the maintenance protocol.
8. **Leave `CHANGELOG.md` to the teacher** — draft the entry in your report instead.

## Constraints

Every constraint in § 3 of the original brief applies unchanged. The two that this half of the work
touches hardest: **do not write a second harness** — if something here cannot be checked by
`verify-shell.mjs`, say so in the report as a proposed follow-up — and **check `git diff --stat`
before you finish**, because `tools/verify-shell.mjs` is the file in this repo that hides a CRLF
rewrite best and it is the file you are about to edit most.
