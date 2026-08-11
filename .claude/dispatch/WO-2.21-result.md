# WO-2.21 — the 44px sweep can see a screen that is not the one on screen · implementation report

## Correction round — 2026-08-11, after the verifier's FAIL on Acceptance line 2

**What the verifier found.** Four of five lines passed, two of them re-driven by the verifier itself.
Line 2 failed on one number, not on the substance: the general mechanism does reach `#scoresView`
independently of WO-3.5's block (the verifier's own run measured it at 4 controls), and the one
sentence justifying the block's survival did land in all three places. But **the contrast count
`254` was never printed by anything.** WO-3.5's block measures **259** and always has — the
verifier's run (`measured 259 visible control(s) with the grid open`), `TESTING.md:2694` from
WO-3.5's own verification (*"259 of them, 250 of which are score cells"*), and
`.claude/dispatch/WO-3.5-result.md:79` (*"259 visible controls on the open grid"*) all agree. 254 was
250 cells + 4 flag buttons — **arithmetic**, which is the exact ritual `tools/README.md` §11's own
FAIL text forbids (*"from a run rather than by arithmetic"*), and the wrong number had landed in
`tools/README.md`, the register whose numeric staleness is why WO-2.19 and WO-2.22 exist. The
verifier also noted a second finding with no acceptance line: this work order moved the harness's one
non-line-anchored `check(` call site, leaving the allowlist cross-reference stale by 203 lines.

**What I changed — nothing but those four pointers. No new checks, no harness logic, no `src/`, no
`index.html`, no change to the 44px threshold or the `>= 5` vacuous-pass guard. `Status` stays at
`🤖 CLAIMED`; `CHANGELOG.md` untouched.** Each line number was re-checked against the file before
editing (the `254` line in `TESTING.md` had not moved; `tools/README.md`'s had, to 622), and each
sentence now attributes the number **to a run** rather than leaving it bare.

Corrected sentences, quoted off disk:

- `c:\dev\planbook\tools\README.md:620-624` — *"Proved rather than argued — deleting that block
  outright leaves `588 checks · 588 passed`, with `#scoresView` still opened and measured by the
  general mechanism at **4 controls** instead of the **259** the block itself prints on a real run
  (`measured 259 visible control(s) with the grid open`, 250 of them score cells)."*
- `c:\dev\planbook\TESTING.md:2209-2212` — *"**Deleting WO-3.5's by-hand coarse block does not lose
  the view**: the run is `588 checks · 588 passed · 0 failed · 0 skipped` with `#scoresView` still
  opened through the real navigation and measured, at **4 controls** instead of the **259** WO-3.5's
  block prints on a real run (`measured 259 visible control(s) with the grid open`)."*
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md:1894-1896` — *"Run with the block deleted:
  `588 checks · 588 passed · 0 failed · 0 skipped`, and `#scoresView` still opened through the real
  segment and measured — at **4 controls**, against the **259** that block prints on a real run
  (`measured 259 visible control(s) with the grid open`)."*

The stale allowlist pointer, fixed in both halves. I confirmed on disk that
`tools/verify-shell.mjs:10773` is the `else check('modal controls measure >=44px on a coarse
pointer', …)` line and that it is the file's **only** `else check(`, and that `:68` is still
`function check(name, ok, detail)`:

- `c:\dev\planbook\tools\README.md:639` — *"the definition at `tools/verify-shell.mjs:68` is not a
  call, the `else check(` at `:10773` is why the pattern is not line-anchored"*
- `c:\dev\planbook\tools\wo-sweep.mjs:595` — *"`:10773` is an `else check(`, the one call site not
  first on its line. The pattern is therefore NOT line-anchored"*. The brief for this round called
  this comment out explicitly: it carries a number this work order invalidated, and leaving it for
  WO-2.22 to trip over is the failure WO-2.19 exists to prevent.

**`node tools/wo-sweep.mjs` re-run, because it greps `tools/README.md` and I edited that file. Green,
summary line verbatim from output I read after it exited:**

```
16 checks · 15 passed · 0 failed · 1 to review
```

The one REVIEW is the standing sensitive-field-name grep, unchanged. §11 in the same run:
`PASS | the recorded check() call-site count matches the harness :: 592 check() call site(s) in
tools/verify-shell.mjs, matching tools/README.md:636`. Note the **:636** — my two-line addition to
that paragraph pushed the greppable sentence down one line from :635. Nothing hard-codes that number
(the sweep reports the line it found), and the repo-wide grep for `README.md:59x`/`README.md:6xx`
finds it only inside dispatch files quoting old run output, which stay as the record of what those
runs said.

**`node tools/verify-shell.mjs` was NOT re-run in this round, and I make no claim about a run of it.**
No harness logic changed here: the only `tools/` code edit is a one-line comment in `wo-sweep.mjs`
(`git diff tools/wo-sweep.mjs` is 1 line changed), and `tools/verify-shell.mjs` is byte-identical to
what the prior round handed over. Its `591 checks · 591 passed` figure below stands on that round's
run and on the verifier's own re-drive, not on anything I executed.

**Files changed this round:** `c:\dev\planbook\tools\README.md`, `c:\dev\planbook\TESTING.md`,
`c:\dev\planbook\plans\work-orders\phase-2-attendance.md`, `c:\dev\planbook\tools\wo-sweep.mjs`.

**One judgement the correction did not settle, and which way I went.** Line 93 of this file — the
prior round's own *"WO-3.5's block measures 254"* — is left as written. The instruction was to leave
the rest of the file intact, and a report is a record of what an implementer believed at the time;
correcting it in place would erase the mistake this section exists to document. The number is wrong
there and this section is the correction.

---

**Implementer** Claude (work-order-implementer, Opus tier) · **Date** 2026-08-11
**Both harnesses green on the tree I am handing over:**

```
node tools/verify-shell.mjs   591 checks · 591 passed · 0 failed · 0 skipped   (14,230 lines, 24.1 lines per check, 193s, exit 0)
node tools/wo-sweep.mjs       16 checks · 15 passed · 0 failed · 1 to review   (the standing sensitive-field-name REVIEW, unchanged)
```

Six full `verify-shell.mjs` runs were made (≈193s each). **Every number quoted below comes from output
I read after the process exited**, not from a prediction; the two mutation runs are quoted verbatim.

---

## The design decision, since Deliverable 1 hands it over by name

**The sweep drives the app's real navigation. It does not un-hide views.**

Three reasons, in the order they decided it, all written into the block at
`tools/verify-shell.mjs:10608`:

1. **Un-hiding would have gone green over the exact defect that produced this work order.**
   `#scoresView` shipped with its only segment disabled (`src/screen-nav.js` carried a hardcoded
   `pending`). The view existed, was fully drawn, and no teacher could reach it. Dropping `.hidden`
   measures a beautiful grid there and reports green; clicking the door cannot, because there is no
   door to click. That difference *is* the work order's subject, so the mechanism has to be able to
   see it.
2. **Un-hiding measures states the app never produces** — two views visible at once, a class screen
   open with no class selected. "A sweep that measures a screen in a state the app never puts it in
   is a new way to be green and wrong" is the Deliverable's own sentence and it settles this.
3. It is what WO-3.5 did by hand, so generalising it keeps one idiom rather than adding a second.

**The consequence I had to design for, and did:** a view that is real but currently unreachable must
*fail*, not be skipped — skipping silently is the bug one level up. `openView()` throws when the
control it needs is not on the page (a disabled segment carries no `data-class-screen` at all), and
the throw is caught and reported against that view by name in the check's own detail (`no door: …`).

**Cost paid, as the brief predicted:** the block navigates a live app mid-section, so it records the
view and the open class on the way in and restores both on the way out, through the same doors. See
"Where I left the page" below.

---

## Against the Acceptance list, one by one

### 1. Every view in `index.html` measured under the coarse pointer, enumerated from the document — **met**

The list is `document.querySelectorAll('main > *')`, which is the structural fact `src/views.js`'s
header states (siblings in `<main>`, toggled by `.hidden`, lifted from Roll Call!'s `#registryView` /
`#compactGridView`). Nothing about the four views is typed into the harness except how each door is
opened and each view's floor. From the final green run:

```
PASS | every screen in <main> is one this sweep knows how to open, enumerated from the document rather than from a list — a view added to index.html and not here is named, not skipped  :: 4 in <main>: homeView, classView, assignmentsView, scoresView
measured 7 control(s) on #homeView
PASS | #homeView opens through the app's own navigation and draws at least 3 control(s) …  :: {"hidden":false,"display":"block","w":984,"h":399} :: 7 control(s) measured
PASS | every control on the open #homeView measures >=44px on a coarse pointer  :: measured 7; under = []
measured 27 control(s) on #classView
PASS | #classView opens through the app's own navigation and draws at least 20 control(s) …  :: 27 control(s) measured
PASS | every control on the open #classView measures >=44px on a coarse pointer  :: measured 27; under = []
measured 5 control(s) on #assignmentsView
PASS | #assignmentsView opens through the app's own navigation and draws at least 5 control(s) …  :: 5 control(s) measured
PASS | every control on the open #assignmentsView measures >=44px on a coarse pointer  :: measured 5; under = []
measured 4 control(s) on #scoresView
PASS | #scoresView opens through the app's own navigation and draws at least 4 control(s) …  :: 4 control(s) measured
PASS | every control on the open #scoresView measures >=44px on a coarse pointer  :: measured 4; under = []
left the page on #classView, class c_3r43076q0h
```

**Two limits a verifier should know rather than discover.** The enumeration is `main > *`, so a view
*nested* inside another element in `<main>` would not be seen, and a view placed outside `<main>`
would not either — neither shape exists today and both would contradict `src/views.js`'s stated
structure, but the check cannot see them.

### 2. Deleting WO-3.5's by-hand block does not reduce coverage of `#scoresView` — **met, with the honest count**

I deleted WO-3.5's whole coarse block (the reload under coarse emulation, the "score grid is OPEN and
drawn" check, the `grid44` measurement and the coarse `pinnedCoarse` check) and ran. Result:

```
588 checks · 588 passed · 0 failed · 0 skipped     (exit 0)
measured 4 control(s) on #scoresView
PASS | #scoresView opens through the app's own navigation and draws at least 4 control(s) …  :: {"hidden":false,"display":"block","w":984,"h":510.36} :: 4 control(s) measured
PASS | every control on the open #scoresView measures >=44px on a coarse pointer  :: measured 4; under = []
```

**The view's coverage survives the deletion; the grid's density does not, and that asymmetry is
real.** The general mechanism runs ~2,700 lines *before* WO-3.5's 25-student × 10-assignment fixture
is planted, on a document where the assignments section has deleted every assignment and the class
left open has no roster — so `#scoresView` opens there in its "nothing to grade" state, where
`src/scores.js` hides the grid, the toolbar and the flag bar with it. Four panel controls is
everything there is to measure. WO-3.5's block measures 254 in the only state in the run where 250
score cells exist.

**So the by-hand block stays**, which Deliverable 4 explicitly permits, and the one sentence why is
written in three places: at the block (`tools/verify-shell.mjs`, "WHY THIS BLOCK STILL EXISTS NOW THAT
WO-2.21 OPENS EVERY VIEW UP THERE"), in `tools/README.md`, and in the ticked acceptance line. What
*is* collapsed is the duplication that would actually rot: both now call one `measureIn()` helper, so
there is one definition of "a control" and one of what gets skipped. The two copies had already
drifted — the page sweep collected six kinds of element, WO-3.5's collected two.

### 3. A view that opens empty fails on its own floor, driven — **met**

Planted an **empty** view that is a real class screen: `<div id="wo221EmptyView" class="hidden"></div>`
in `<main>`, wired into `src/views.js` (`VIEWS`, `CLASS_SCREENS`, `REMEMBERED_AS`) and
`src/screen-nav.js`'s `SCREENS` so a live segment draws for it, plus a `VIEW_PLAN` entry with
`floor: 1`. It opens through the real segment and has nothing in it. Run output, verbatim:

```
measured 0 control(s) on #wo221EmptyView
FAIL | #wo221EmptyView opens through the app's own navigation and draws at least 1 control(s) — a screen nothing can reach, and a screen that opens empty, both fail here  :: {"hidden":false,"display":"block","w":984,"h":0} :: 0 control(s) measured
FAIL | every control on the open #wo221EmptyView measures >=44px on a coarse pointer  :: measured 0; under = []
```

The second red is the one that matters most: without the floor it would have been a **PASS** for
having nothing to complain about.

**That mutation also found a defect in my own first cut**, which is why it was worth running rather
than reasoning about. The restore that puts the page back clicked the switcher inside whatever view
was open last — and an empty view has no switcher: `could not put #classView back: nothing to click
for #wo221EmptyView [data-class-screen="class"]`. `openView()` now falls back to the route a teacher
has when a screen has no door onward: out to the grid, back in through the class's own card. The
final run prints `left the page on #classView`.

### 4. Adding a view to `index.html` and not to the harness turns a check red, driven — **met**

Same run, second planted view — `<div id="wo221UnknownView" class="hidden"></div>` in `<main>` and
nowhere else:

```
FAIL | every screen in <main> is one this sweep knows how to open, enumerated from the document rather than from a list — a view added to index.html and not here is named, not skipped  :: 6 in <main>: homeView, classView, assignmentsView, scoresView, wo221EmptyView, wo221UnknownView :: NOT IN VIEW_PLAN, so nothing measured them: wo221UnknownView
```

The check also fails in the other direction (a `VIEW_PLAN` entry whose view has left `index.html`)
and carries a `>= 4` guard so a selector that stopped matching cannot report "no unplanned views" in
the same words as a document with none. That direction is **not** separately mutation-driven — I say
so rather than imply it was.

That mutation run's full summary was `593 checks · 587 passed · 6 failed · 0 skipped`. Three of the
six reds are the app-side mutation's own noise (WO-3.3's "the switcher carries exactly three tabs",
its breadcrumb check, and WO-3.5's "the Scores segment is a live door", all of which really did see a
fourth segment). Both mutations were reverted with `git checkout --`; `git status` shows `index.html`,
`src/views.js` and `src/screen-nav.js` clean.

### 5. The check count rises and `tools/README.md` records the new number, through WO-2.19's mechanism — **met**

WO-2.19 has landed, so it named the move itself rather than my updating a line by hand and hoping:

```
FAIL | the recorded `check()` call-site count matches the harness  :: tools/verify-shell.mjs has 592 `check()` call site(s), up 3 on the 589 recorded at tools/README.md:595 — update that line, and the executed-check count in the paragraph beside it, from a run rather than by arithmetic.
```

Both numbers are off real runs, neither by arithmetic:

- **592 call sites** — from the sweep's own grep. Sentence updated; the sweep is now green at
  `592 check() call site(s) in tools/verify-shell.mjs, matching tools/README.md:635`.
- **591 executed** — from the summary line of the final green run (`591 checks · 591 passed`), up 9
  on the 582 recorded. Nine results from three call sites, because two of the three fire once per
  view.

I also updated the gap paragraph beside it, which the FAIL text obliges: the gap is now **592 − 591 =
1**, was 589 − 582 = 7 before this work order, and the six-place move is stated as what it is — two
call sites inside a loop over four views, i.e. the second bullet already in that paragraph arriving in
bulk. The WO-2.19 instrumentation numbers (532 / 22 / 28) are left as that tree's measurement, still
labelled as not re-run, because re-deriving them means re-instrumenting a throwaway copy of the
harness and that is nobody's acceptance line here.

---

## Where I left the page

The block records the view it found (`classView`, restored by the app after the section's own reload)
and the open class id (read through the `window.planbook.classes` seam, which exists for reading), and
puts both back through the same doors. It enters every class screen through **that class's own card**,
so the selected class never changes. The final run's last line of the section:
`left the page on #classView, class c_3r43076q0h`. Every check after the section — the modal, year
picker, backup, class manager measurements and the eleven sections below — is green, which is the
downstream evidence that the restore held.

## Files changed

- `c:\dev\planbook\tools\verify-shell.mjs` — the whole change. One new `CONTROL_SEL` + `measureIn()`
  helper above the coarse section; the page-wide sweep and WO-3.5's `grid44` both now call it (two
  duplicated measurement expressions deleted); the new per-view block inside the coarse section; the
  "why this block stays special" paragraph on WO-3.5's coarse pass.
- `c:\dev\planbook\tools\README.md` — a `591 at WO-2.21` growth paragraph; the greppable sentence 589
  → 592; the call-sites-vs-executed gap paragraph updated to 592 − 591 = 1 with the reason it moved.
- `c:\dev\planbook\TESTING.md` — new `### WO-2.21` section with the five ticked lines, both mutations
  tabulated, and the note that there is no 👤 line.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — the five Acceptance boxes ticked with
  evidence notes. **Status left at `🤖 CLAIMED`** — flipping it to `✅ DONE` is the verifier's/
  orchestrator's call, not mine.

**Nothing in `src/` or `index.html` changed.** `git status` on the handover tree: `TESTING.md`,
`plans/work-orders/phase-2-attendance.md`, `tools/README.md`, `tools/verify-shell.mjs` modified, plus
the untracked dispatch files.

## Decisions the work order did not settle, and which way I went

1. **Floors are per-view constants measured off this run's document, set just under what it draws** —
   3 · 20 · 5 · 4 against measured 7 · 27 · 5 · 4. The breakdown is written into the code. `homeView`
   and `classView` carry margin (a card count and a day-column window that move); `assignmentsView`
   and `scoresView` are exactly their static panel chrome, because in this run's document that is all
   they can produce. **Honest limit: a floor equal to the chrome catches "opened and drew nothing"
   and cannot catch "the table came up short."** A floor above what the document can produce would be
   a check that fails on a correct build, which is the other way to make a number nobody trusts.
2. **I did not plant a fixture for the general sweep.** It was tempting — a class with a term, a
   category, a roster and one assignment would make the `#scoresView` floor mean something. I decided
   against it: no class in the document at that point can hold an assignment (the only one with a
   roster came out of a pre-WO-3.1 backup with no terms and no categories, per `tools/README.md`
   § WO-3.3), so it would mean standing up a whole second class fixture inside the coarse sweep —
   i.e. a second copy of WO-3.5's block, which is the thing Deliverable 4 is trying to prevent. The
   asymmetry is named instead, at the block and in `tools/README.md`.
3. **WO-3.5's block stays, its measurement does not.** Deliverable 4 offers "collapse it, or say in a
   sentence why it stays special." I did both halves that can be done: the *state* stays special (the
   fixture), the *measurement* is shared. The one behaviour change is that `#scoresView` is now
   measured with the wider `CONTROL_SEL` rather than `button, input` — no `select`, `textarea`,
   `a[href]` or `tabindex` element exists anywhere in the app today, so the result is identical, and
   if one arrives inside that view it will now be measured rather than missed.
4. **The check name carries the floor** (`… draws at least 20 control(s) …`), so raising a floor
   renames a check. That is deliberate — the number is part of the claim — but it is worth knowing
   before someone diffs two runs' PASS lines.

## Out-of-scope temptations I declined

- **Widening what is measured.** `#classView`'s 27 controls include six day-column heads whose
  `scrollWidth` vs `clientWidth` the "Days off" spill lesson says to check; the per-view mechanism
  now has every view open and could measure overflow on all of them for four more lines. That is
  "widening what the sweep measures beyond touch targets" and the Out of scope line forbids it. **It
  is a real follow-up** and would be a clean S: *the label-overflow check applied to every view, not
  just the header row.*
- **Making the empty-state floors meaningful by planting content** — declined above, reason 2.
- **Touching the 44px threshold or the `>= 5` vacuous-pass guard on the page-wide sweep.** Untouched.

## What I could not verify

- **Nothing on a real iPad.** No 👤 line is ticked, and `TESTING.md` § WO-2.21 deliberately has none:
  this work order changes no pixel, and the screens it opens owe their own iPad lines already. The
  emulated coarse pointer is asserted (`matchMedia = true`) and is still an emulator, not a thumb.
- **The stale-`VIEW_PLAN`-entry direction** of the enumeration check (a view removed from
  `index.html` but left in the plan) is implemented and not mutation-driven. Said plainly rather than
  folded into line 4.
- **The 532 / 22 / 28 instrumentation figures in `tools/README.md`** are still WO-2.19's measurement
  of WO-2.19's tree. I did not re-instrument, and the paragraph continues to say so.

## Draft `CHANGELOG.md` entry — for the teacher to accept, reword or bin

> **Verification.** The touch-target sweep no longer measures whichever screen happened to be on
> screen. It enumerates every view in `<main>`, opens each one the way a teacher does — the card, the
> "All classes" door, the switcher segments — and measures it there, with a floor per view so that a
> screen which opens empty fails instead of passing quietly. A screen added to `index.html` and not
> to the harness now turns a check red rather than going unmeasured; that is how ~250 score inputs
> came to be walked past by a green run.
