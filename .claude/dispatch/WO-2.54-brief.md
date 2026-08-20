# WO-2.54 — `Today` goes to the term, and there is no way back to today · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.54-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to **Claude Opus** on the Traps section: every trap in it is a
judgment call rather than a mechanic — `anchorDate()` is named as the tempting wrong answer that is
actually right, and the widening must not leak into WO-2.51's term-tap ruling or WO-2.52's February
case. It also produces teacher-facing prose (the spoken sentence, `TESTING.md`, the `CHANGELOG.md`
draft). The runner-up I set aside was Codex: the Deliverables are unusually precise and the proof
budget fits (one clean `verify-shell` run plus one mutation run, ~8.8 min against the 20-minute cap),
but the value of this work order is in honouring three prior work orders' decisions, not in
implementing a formula — and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.54 — `Today` goes to the term, and there is no way back to today

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-20 · **Size** M · **Depends on** WO-2.50 · WO-2.51 · WO-2.52 · **Blocks** nothing
**Closes roadmap** Phase 2 → *(no box. A defect in what WO-2.52 shipped, reported off the deployed app
three days later.)* **Widens WO-2.52's** *jump* — the writer it added moves the term when a term HOLDS
today, and this is the case where none does.

**Owner-reported 2026-08-20, from `https://planbook.hwgteach.com/`:** *If you're on a term other than
the first one, and you hit the "today" button it brings you to the wrong date. Right now, if I hit
"today" in quarter four, it brings me to the first day of quarter four not the actual first day of the
year.*

**Why it exists.** `Today` is not a control that goes to today. It resets `pageDaysBack` to 0
(`pageDays()`, `src/attendance.js`) and the date it lands on comes from `anchorDate()`, which since
WO-2.52 answers `term.start` for a selected term that begins after today. So with Quarter 4 up on
2026-08-20 the anchor is Quarter 4's first day, `Today` returns you to it, and **nothing on the screen
can get back to today or to the term today is nearest.** The label says `Today` by WO-2.52's own
deliberate choice — *the label stays `Today`, and the sentence under it tells the truth* — and the
tooltip does tell the truth, which is the whole of what that decision bought.

**The half that is worse than the report.** In exactly the state that needs it, the button is **off**:
`today.disabled = pageDaysBack === 0 && !editingDay`. Arrive on the Quarter 4 tab, page nothing, unlock
nothing, and the one control that could take you home is greyed out reading *You are on Apr 6, 2027*.
The teacher's route back is to work out which term holds today and tap its tab.

**And it is not only the button.** `openTermForToday()` (`src/classes.js`) is the arrival rollover, and
it gives up when `termContaining(cls.id, today)` answers null — which is every day in the gap between
two terms, every day after the last one, and **every day of the setup fortnight this app is being
readied in.** So on 2026-08-20 the register opens on whatever tab was last touched, six months from
today, and calls it correct. The report is one symptom of a rollover that only works from inside a term.

**The decision, taken with the owner 2026-08-20.** `Today` means today, and the term follows it: the
button moves the selected term to the one that **holds** today, and where no term holds today, to the
**nearest dated term** — at which point `anchorDate()`'s existing rule puts the strip on that term's near
edge with no change to it at all. On 2026-08-20 that is Quarter 1 anchored on 9/2, the first day of the
year, which is the date the report asks for. The same widening goes into the arrival rollover, because
the button and the arrival are the same question asked twice.

**What this must not undo, and it is one line of WO-2.52's acceptance:** *Selecting Q1 by hand during
that session sticks, shows WO-2.51's rollover band, and anchors the strip on 10/31, locked.* Browsing
back to a finished term is the feature, and a term tap still moves nothing but the tab. **The term moves
on an arrival and on a press of `Today`, and nowhere else** — both are a deliberate act, which is the
test WO-2.51's ruling was written with and the one WO-2.52 narrowed it to.

**Deliverables**

- **The writer widens and is renamed, in `src/classes.js`.** `openTermForToday()` → **`openTermNearToday()`**:
  the term containing today if there is one, else the nearest dated term, else no move. A name promising
  *for today* that answers Quarter 1 in August is the kind WO-3.20 spent a work order removing, and the
  sweep is four references — its definition, its import, its one caller, and the block comment at
  `src/attendance.js:383`.
  - **Nearest is measured off `outOfTermGap()`**, which already names the two sides and already answers
    null for a class with no dated terms: `after.start - today` against `today - before.end`, in calendar
    days, off the same `daysUntil()` WO-2.52 added. **Forward wins a tie** — a teacher opening her
    register in a gap is getting ready for what comes next, not revisiting what ended.
  - **It still writes only** — no `refreshClassBar()`, no announcement, no render. Both callers repaint,
    and a render from inside a function documented as not rendering is how a double paint starts.
  - **A class with no dated terms is untouched**, as everywhere else in this app: no term is nearest to
    anything, the writer answers false, and the screen behaves to the keystroke as it does today.
- **`pageDays('today')` moves the term before it draws.** The writer is called at the top of the
  `'today'` arm — before `renderAttendance()`, because the anchor, the totals and the strip are all
  derived from the selected term — and `refreshClassBar()` follows it when it moved, for the reason
  `resetRegistry()`'s comment already gives: a term moved after the bar is painted leaves the active mark
  on the term the teacher has just been moved off, with the counts under it describing the other one.
  **`'earlier'` and `'later'` move no term.**
- **One sentence out, and it names the term only when the term moved.** `pageDays()` already announces
  *Back to …* off `anchorDate()` re-read after the render, which is honest as it stands; the term
  landed in is added to that sentence when the jump happened — *Back to today in Quarter 1.* —
  and `selectTerm()`'s own announcement is not reached, so there is still one sentence per press.
- **The disabled test gains its third clause.** `Today` is off only when there is nowhere for it to go:
  unpaged, nothing unlocked, **and the selected term is already the one this button would choose.** The
  disabled tooltip stays *You are on …*, which is then true. This is the clause the pager's own
  WO-2.52-era comment predicts — *this screen now has two reasons a page control is off, and they are
  independent* — arriving as a third.
- **`Today` stays live in portrait**, refused-in-`pageDays` for `'earlier'`/`'later'` and not for this.
  It was already the way out of an unlocked column and it is now also the way out of a browsed term, on
  the orientation that cannot page at all.
- **`TESTING.md` lines and the `CHANGELOG.md` entry**, per the maintenance protocol, and **bump `CACHE`
  in `sw.js`**.

**Acceptance**
- [ ] Today 2026-08-20, one class, four dated terms with Quarter 1 starting 2026-09-02: **the register
      opens on Quarter 1 anchored on 9/2 with the Quarter 4 tab stored as the preference.** The arrival
      half, driven rather than reasoned about.
- [ ] From that screen, tap the Quarter 4 tab: the tab **sticks**, the strip anchors on Quarter 4's first
      day, and **`Today` is live** — pressing it returns the tab to Quarter 1 and the strip to 9/2, with
      one spoken sentence naming the term.
- [ ] Today inside Quarter 1: `Today` behaves exactly as it does now — anchors on today, is disabled
      unpaged with nothing unlocked, and moves no term. **The ordinary day is unchanged, to the keystroke.**
- [ ] **WO-2.52's February line survives:** today in Quarter 2, Quarter 1 selected by hand, the strip
      anchored on Quarter 1's last day and locked. `Today` is live there and is the way out; **a term tap
      still moves nothing but the tab**, and no repaint moves it.
- [ ] Today in the gap between Quarter 1 (ends 10/31) and Quarter 2 (starts 11/3): arrival selects
      **Quarter 2**, the nearer side, and the band reads *Quarter 2 opens in n days*. With today one day
      past a term's end and two before the next's start, the forward side still wins.
- [ ] Today after the last term ends: arrival selects the **last** term and anchors on its `end`, locked.
      There is no forward side and the walk does not fall through to no move at all.
- [ ] **A class with no dated terms is untouched**: no jump on arrival, no jump on `Today`, and the
      disabled test reads exactly as it did before this work order.
- [ ] `grep -rn "openTermForToday" src/ tools/ TESTING.md docs/` returns nothing — the rename swept
      rather than shadowed.
- [ ] `node tools/verify-shell.mjs` green with its check count recorded and `tools/README.md` reconciled
      to it, and **one mutation proof over the nearest-term walk** — a build that only ever moves the term
      from inside one must go red.
- [ ] `node tools/wo-sweep.mjs` green.
- [ ] 👤 On the iPad, **force-quit from the app switcher first** (`CLAUDE.md`): in portrait, browse to
      Quarter 4 and get home in **one tap** on `Today`, which clears 44px under a thumb. This is the
      reading the report came off — the route back has to exist on the orientation that cannot page.

**Traps** — **the tempting wrong answer is `anchorDate()`**, which looks like the thing that is wrong and
is the thing that is right: it answers for the term it is given, and WO-2.52's whole soft-wall argument
rests on it. **What is wrong is which term it is given.** **Do not move the term on a repaint or on a
term tap** — that is WO-2.51's ruling and WO-2.52's narrowing of it, and a widening here that leaks into
either one takes the February case with it. **The disabled test is the half that will be forgotten**,
because the fix reads as finished the moment the button works when it is enabled — and the reported state
is one where it is not. **Order matters inside `pageDays()`**: move, repaint the bar, then render, then
announce off a re-read anchor; any other order announces or draws the term the teacher just left.
**`outOfTermGap()` answers null two different ways** — inside a term, and no dated terms at all — so the
containing test comes first and the no-terms case must not read as a gap with no sides. **And check the
diffstat before committing** (WO-2.49): this touches `tools/verify-shell.mjs`, the file a CRLF rewrite
hides best.

**Out of scope.** A way-home button on WO-2.52's band 4 — the pager already carries one, and a second
control doing one thing is what WO-1.13 retired the class selector over. Any change to what a term tab
does, to `anchorDate()`'s rule inside a term, or to the write gate. Sorting or repairing terms, and
validating one term's dates against another's — `src/classes.js`'s header refuses both by name, and the
nearest-term walk needs neither. Overlapping terms picking a winner: `termContaining()` already answers
the first match and this work order does not touch that.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.js`
  - `src/classes.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also open these before writing:**

- **WO-2.50, WO-2.51 and WO-2.52 in `plans/work-orders/phase-2-attendance.md`** — the three
  dependencies. WO-2.51's ruling (a term tap moves nothing but the tab) and WO-2.52's narrowing of it
  are what the fourth Acceptance line tests; read them in their own words, not through this work
  order's summary of them.
- **`src/classes.js`** — `openTermForToday()`, `termContaining()`, `outOfTermGap()`, `daysUntil()`, and
  the file header that refuses to sort, repair or cross-validate terms. `outOfTermGap()` answers null
  two different ways and the walk depends on telling them apart.
- **`src/attendance.js`** — `pageDays()` and its `'today'` arm, `anchorDate()`, `resetRegistry()` and
  its comment about repainting the class bar, the disabled test on the `Today` button, the portrait
  refusal for `'earlier'`/`'later'`, and the block comment at `src/attendance.js:383` that names
  `openTermForToday()` and is one of the four rename sites.
- **`CLAUDE.md`** § "Seven things that will bite" — the three-state attendance rule and the
  computed-at-render rule both bear on this screen.

**Two things to get right that the Acceptance will check but the code will not tell you:**

- The rename is a **sweep, not a shadow**: definition, import, the one caller, and the block comment.
  `grep -rn "openTermForToday" src/ tools/ TESTING.md docs/` must return nothing when you are done.
- **Bump `CACHE` in `sw.js`** — `src/` files are in `SHELL`, and without the bump no device sees the
  change at all.
- **Check the diffstat before committing** (WO-2.49): you are touching `tools/verify-shell.mjs`, the
  file a CRLF rewrite hides best. A five-figure diff for a two-figure edit is the tell.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

## 5. Done means these 11 lines, reported against one by one

1. Today 2026-08-20, one class, four dated terms with Quarter 1 starting 2026-09-02: **the register opens on Quarter 1 anchored on 9/2 with the Quarter 4 tab stored as the preference.** The arrival half, driven rather than reasoned about.
2. From that screen, tap the Quarter 4 tab: the tab **sticks**, the strip anchors on Quarter 4's first day, and **`Today` is live** — pressing it returns the tab to Quarter 1 and the strip to 9/2, with one spoken sentence naming the term.
3. Today inside Quarter 1: `Today` behaves exactly as it does now — anchors on today, is disabled unpaged with nothing unlocked, and moves no term. **The ordinary day is unchanged, to the keystroke.**
4. **WO-2.52's February line survives:** today in Quarter 2, Quarter 1 selected by hand, the strip anchored on Quarter 1's last day and locked. `Today` is live there and is the way out; **a term tap still moves nothing but the tab**, and no repaint moves it.
5. Today in the gap between Quarter 1 (ends 10/31) and Quarter 2 (starts 11/3): arrival selects **Quarter 2**, the nearer side, and the band reads *Quarter 2 opens in n days*. With today one day past a term's end and two before the next's start, the forward side still wins.
6. Today after the last term ends: arrival selects the **last** term and anchors on its `end`, locked. There is no forward side and the walk does not fall through to no move at all.
7. **A class with no dated terms is untouched**: no jump on arrival, no jump on `Today`, and the disabled test reads exactly as it did before this work order.
8. `grep -rn "openTermForToday" src/ tools/ TESTING.md docs/` returns nothing — the rename swept rather than shadowed.
9. `node tools/verify-shell.mjs` green with its check count recorded and `tools/README.md` reconciled to it, and **one mutation proof over the nearest-term walk** — a build that only ever moves the term from inside one must go red.
10. `node tools/wo-sweep.mjs` green.
11. 👤 On the iPad, **force-quit from the app switcher first** (`CLAUDE.md`): in portrait, browse to Quarter 4 and get home in **one tap** on `Today`, which clears 44px under a thumb. This is the reading the report came off — the route back has to exist on the orientation that cannot page.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

