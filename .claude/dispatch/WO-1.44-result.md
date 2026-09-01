# WO-1.44 — result

**Route** Claude Opus (work-order-implementer) · **Date** 2026-08-31
**Verdict on the five failures: fixture, all five. The app is clean and not one byte of `src/` moved.**

---

## 0. What I ran, and what I could not

Every figure below is from output I read. The harness **does** run in this shell, as the brief said
it would; I never had to report an environment instead of a result.

| # | Command | Result |
|---|---|---|
| 1 | `node tools/verify-shell.mjs` (baseline, before any edit) | `513 PASS / 5 FAIL`, then `Error: nothing to click for #daysOffList [data-dayoff-remove="undefined"]` at `verify-shell.mjs:465`, **no summary**, `EXIT=1` |
| 2 | `node tools/verify-shell.mjs` (after the fixture repair) | `1284 checks · 1284 passed · 0 failed · 0 skipped`, exit 0 |
| 3 | `node tools/verify-shell.mjs` (**two planted missing selectors**) | `1260 checks · 1248 passed · 12 failed · 0 skipped`, **summary printed**, exit 1 |
| 4 | `node tools/verify-shell.mjs` — final tree, real clock, Mon 2026-08-31 | `1284 checks · 1284 passed · 0 failed · 0 skipped`, 39,242 lines, 30.6 lines per check, **421s**, exit 0 |
| 5 | `node tools/verify-shell.mjs --today=2026-09-01` (Tue) | `1284 · 1284 · 0 · 0`, 422s, exit 0 |
| 6 | `node tools/verify-shell.mjs --today=2026-09-02` (Wed) | `1284 · 1284 · 0 · 0`, 421s, exit 0 |
| 7 | `node tools/verify-shell.mjs --today=2026-09-03` (Thu) | `1284 · 1284 · 0 · 0`, 421s, exit 0 |
| 8 | `node tools/wo-sweep.mjs` | `40 checks · 37 passed · 0 failed · 3 to review`, exit 0 |
| 9 | `node tools/wo-gate.mjs --audit` | `PASS`, exit 0 |
| 10 | `node tools/wo-gate.mjs WO-1.44` | `PASS | gates clear for WO-1.44` |

Nine intermediate runs were taken besides these (a pre-`nodeNowMs` Tuesday, a pre-second-repair
Thursday, and so on); they are quoted below only where they are evidence.

**I could not run anything on an iPad and nothing here asks me to.** WO-1.44 carries no 👤 and no 📆
line. Nothing in this change renders, and no file in `SHELL` moved, so **no `CACHE` bump is owed**.

**Baseline note — a fourth identical reproduction.** My baseline agrees with the owner's two runs and
the orchestrator's probe on every particular except the randomly-generated class ids: same 518
results, same 513/5 split, same five assertions, same throw, same line. It is deterministic.

---

## 1. Acceptance, line by line

### ☑ 1. Each of the five failures settled in writing as harness or app, snow-day first

**Claimed on evidence.** Settled before either side was edited; the reasoning is now in the work
order's own **Why** (a new paragraph, with the weekday paragraph deliberately left standing above it),
in `TESTING.md` § WO-1.44, in `tools/README.md`, and at `preDropDayFrom()` in the fixture itself.

**The root cause, and it is one thing.** `preDropDay` was `today + 9` read off `new Date()`
(`attendance-passes.mjs`). On 2026-08-31 that arithmetic lands on **2026-09-09** — the date
`tools/verify/classes-terms.mjs:641` hard-codes a *surviving* attendance record on, for
`remembered.ids[1]`, planted so that "the delete took the right class" is falsifiable. The pre-drop
names `[ids[1], ids[3]]`. So the `dropped` event covers a day that already holds a recorded meeting,
and **the app did exactly what `plans/rotating-schedule.md` § Precedence tells it to**:
`clashingMeetings()` found it, `openConfirm()` raised the retroactive warning, and nothing was
written. **The collision window is one calendar day wide**, which is why Sunday 2026-08-30 was green
and Monday 2026-08-31 was not.

**The snow-day confirm, taken first because it is the one a teacher meets.** *Harness.* The confirm
that named "2 periods against 4 recorded" was not describing a snow day at all. The
`fillDayOff('no-school', 'Snow day', …)` before it ran while the pre-drop's confirm overlay was still
up, so its kind-pill click landed on the overlay and the event submitted was still a **`dropped`**
one naming `ids[1]` and `ids[3]` — two classes, two recorded meetings, two lines. `meetingsBetween()`
and `clashingMeetings()` were right about the event they were given. On the repaired fixture the same
check reads:

> the confirm named 4 period(s) `["Period 3 — Biology — Monday, August 31, 2026","Period 1 — Biology
> — Monday, August 31, 2026","Period 4 — Physics — Monday, August 31, 2026","AP Bio — Monday, August
> 31, 2026"]` against 4 recorded today

**So a teacher laying a snow day over a day she really taught is told every period it touches.** That
question is closed and **no app row is booked out of this one.**

| # | Failing check | Verdict | Evidence |
|---|---|---|---|
| 1 | *a future dropped event naming two classes affects only those two* | **fixture** | `preDropDay` = 2026-09-09 = the residue date; `states[preDropDay][1] === "taken"` in the failure's own detail line names the collision. The event was correctly withheld pending a confirm, so `events[0]` is `undefined` and `dropEvent` falls back to `{}` |
| 2 | *a planned drop that names no class is refused* | **fixture, cascade** | The picker's toggle-off clicks landed on the confirm overlay, so `chosenClassIds` still held two classes. `eventFault()`'s `drop-names-nobody` was never reached — the run's own detail says `the panel said ""`. On the repaired fixture it reads the full refusal sentence |
| 3 | *a retroactive snow day … WARNS* | **fixture, cascade** | See above: 4 against 4 after the repair |
| 4 | *backing out of that warning writes nothing at all* | **fixture, cascade** | The two events in the document were committed by stray clicks that hit `[data-dayoff-confirm]`. `attendance byte-identical = true` held throughout — nothing ever wrote a record |
| 5 | *adding the snow day anyway does NOT void the record* | **fixture, cascade** | Every app-behaviour clause held even while red (4 taken stayed taken, 1 dropped stayed dropped, attendance byte-identical). What failed is that the snow day was never committed at all |

**The strongest single piece of evidence is a `git diff`.** `git diff HEAD -- src/ index.html sw.js
privacy.html manifest.json icons/` is **empty**, and all five are green. A fixture-only change cannot
repair an app defect.

**The harness had predicted this collision and named the date.** `tools/verify/attendance.mjs`'s
`window.__att` reader says *"if a run ever happens to fall on one of those dates the two collide, and
this line is where that says so out loud instead of turning into six confusing failures further
down."* It fired as six confusing failures because the guard watches **today** being 2026-09-09, and
what happened is a date *derived* from today reaching the residue while today was somewhere else.

**This contradicts the Why's weekday hypothesis, and the brief said to report that rather than
reconcile it.** It is not the weekday. It is one calendar date. The Why paragraph is left in place
with the correction beneath it.

### ☑ 2. Runs to completion and prints its summary, driven against a planted missing selector

**Claimed on evidence — run 3 above.** Two plants in one run, both carrying `MUTATION` comments:

- `tools/verify/modal.mjs` ← `clickSel('#thereIsNoSuchControlAnywhereInThisApp')`, a section with
  nothing to do with the crash, so the claim is about the mechanism and not one element.
- `tools/verify/attendance-passes.mjs` ← the literal `[data-dayoff-remove="undefined"]` of
  2026-08-31, the original throw put back by hand.

Result: **`1260 checks · 1248 passed · 12 failed · 0 skipped`, exit 1, summary printed.** Three
sections threw — the two planted plus `verify/log-entries.mjs`, which wants a fixture the attendance
section died before installing — each producing its own FAIL line naming the file, the throw, and how
many of that section's own checks had run first (`0`, `152`, `19`). The other nine reds are collateral
from a *Snow day* left on the document by the section that died. Both plants reverted with
`git checkout --` against a fully staged tree; `grep -rn "MUTATION WO-1.44" tools/ src/` returns
nothing, and the two files are byte-identical to the pre-plant state.

**How the `:43` decision was honoured rather than undone.** The header paragraph said a section that
throws still kills the run, *because catching would turn a section that broke into one that quietly
did not happen*. The operative word is **quietly**. There is no bare `try/catch` around the loop:
`runSection()` converts the throw into a **`fail` result** — named after the section file, printed as
a FAIL line where it happened, listed in the FAILED block, counted in `results`, exit 1 — and then
reloads the page so the sections after it measure the app instead of the wreckage. If the page will
not come back the run stops and names, counts and reddens every section that never ran. **The
paragraph is amended at the point of departure, not deleted**, and it names the rule that beats it in
the work order's own words: *a run that stops has not gone green or red, and no reader of its output
can tell.* The containment is applied to `STATIC_SECTIONS` too — same mechanism, blast radius 1,284
instead of 766 — which is a small widening I made deliberately and am flagging in § 4.

### ☑ 3. No longer weekday-dependent, proved on at least three weekdays

**Claimed on evidence — runs 4–7 above: Mon (real clock, no flag), Tue, Wed, Thu, all
`1284 · 1284 · 0 · 0`, all exit 0, all on the delivered tree.**

Built as **`--today=YYYY-MM-DD`, whose default is the real clock**, per the work order's own second
option. It moves *both* clocks by the same whole-day offset: `tools/verify/lib-dates.mjs` (the
harness's one answer to "what day is it") and the page's `Date`, shifted with a `Proxy` installed on
every new document. It **shifts rather than freezes**, so every elapsed-time measurement in the run
still measures; only zero-argument construction and `Date.now()` move, and `new Date('2026-09-08')`,
`Date.parse` and `Date.UTC` forward untouched. A run taken with it says so twice — above the first
check and in the summary — because a figure from a shifted run quoted without that sentence is a
figure about a day nobody was on. A malformed value throws rather than falling back to the real clock.

**The flag paid for itself on its first use, and this is the finding I would most want carried
forward.** The Thursday run of an intermediate tree came back **red with a section throw** in the
punch-list block: `nodeWeekdayAhead(4)` from 2026-09-03 is **2026-09-09 as well** — the same residue,
reached by different arithmetic, at a second site my first repair did not cover. It is repaired the
same way, both future days are now asserted in the fixture check, and Thursday is green. **The first
site cost 766 checks and a day of diagnosis; the second cost one run** — and the containment from
line 2 is what let that run report it at all instead of dying.

Two honest limits on this line. **The proof is four weekdays, not a weekend** — Sat/Sun were not
driven, and the last green run before this work order (Sunday 2026-08-30) is the only weekend evidence
in the record. And **the shifts are +1, +2 and +3 days**; a large shift would move today out of
several sections' hard-coded term windows and is not something this change makes safe.

### ☑ 4. The check count in `tools/README.md` matches a run

**Claimed on evidence.** Call sites **1269 → 1271**, both of them failure arms of the containment
that never fire on a green run, so **the executed count is unchanged at 1284** — the same number the
last green run before this work order printed. `wo-sweep.mjs` § 11 reads
`1271 check() call site(s) across 66 harness file(s), matching tools/README.md:1139`, PASS. The
executed figures written into `tools/README.md` are run 4's, taken from that run's own summary line.

*Worth knowing:* my first draft wrote the plural as `check(s)` inside a detail string. § 11 counted it
as a call site that can never fire — 1272 against a run of 1284 — and the tempting repair is to type
1272 into the README, which is a number nothing produced. It reads `checks` now with a comment at the
line saying why.

### ☑ 5. `wo-sweep.mjs` green and `--audit` green on a clean tree

**Claimed on evidence — runs 8 and 9.** `40 checks · 37 passed · 0 failed · 3 to review`, exit 0. The
three REVIEW lines are the standing ones (sensitive field names, due-date/late-missing, the mockup
banner); none is new and this work order touches none of their subjects — `src/` and `design/` are
byte-identical to HEAD. `--audit` is PASS, exit 0.

---

## 2. Files changed

All absolute paths.

| File | What |
|---|---|
| `c:\dev\planbook\tools\verify-shell.mjs` | Header paragraph amended at the point of departure; `runSection()` + `recoverPage()` containment on both section loops; `--today`'s page-clock `Proxy`; the clock announced before the first check and again in the summary |
| `c:\dev\planbook\tools\verify\lib-dates.mjs` | `--today` parsed here (one clock, one file): `SHIFT_DAYS`, `SHIFT_MS`, `nodeNow()`, `nodeNowMs()`; the four existing values now read `now()` |
| `c:\dev\planbook\tools\verify\attendance-passes.mjs` | `preDropDay` and `aheadDay`/`aheadTo` derived from the document instead of the calendar; both asserted in the existing WO-2.3 fixture check |
| `c:\dev\planbook\tools\verify\backup-restore.mjs` | `nodeNow()` for the file-name stamp, `nodeNowMs()` for two freshness assertions |
| `c:\dev\planbook\tools\verify\year-document-store.mjs` | `nodeNowMs()` for the `updatedAt` freshness assertion |
| `c:\dev\planbook\tools\verify\past-due.mjs` · `term-nav.mjs` · `today-goes-to-term.mjs` | `new Date()` → `nodeNow()` at the five sites that cut a fixture window out of "now" |
| `c:\dev\planbook\tools\README.md` | New § *"It takes one argument, and it is a date"*; call-site count 1269 → 1271; a WO-1.44 entry in the count narrative with the run figures, the diagnosis, and the planted round |
| `c:\dev\planbook\TESTING.md` | New § WO-1.44 with all five boxes and their evidence; WO-1.42's trailing paragraph now points at it |
| `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | The correction paragraphs in the **Why**; five Acceptance boxes ticked |

**Not touched:** `src/`, `index.html`, `sw.js`, `privacy.html`, `manifest.json`, `icons/`,
`design/` — verified with `git diff HEAD --stat` over those paths, empty. **`CHANGELOG.md` is left to
the teacher**; a draft entry is in § 5 below. **No commit and no push**, and the tree is unstaged.
**Status left at 🤖 CLAIMED** — `--handoff`/`--tick` are the pipeline's calls, not mine.

---

## 3. Decisions the work order did not settle

1. **The containment covers the static loop as well as the browser loop.** The work order argues
   about `BROWSER_SECTIONS` at `:720`. A static section throwing kills all 1,284 checks rather than
   766, the mechanism is identical, and Acceptance line 2 says *"no throw out of the process"* — which
   would have been only nearly true if I had left the static loop bare. One shared helper, `recover`
   null for the static half.
2. **`--today` moves the page's clock too, and that reaches every section.** Making only the harness's
   notion of today an input would have put the two runtimes a day apart, which the attendance
   section's *"the date it will write is today in LOCAL time"* check exists to catch. Moving both is
   what makes the flag honest, and it is why seven `new Date()` sites in five other sections had to be
   routed through `nodeNow()` — otherwise the shifted run went red about nothing.
3. **Three timestamp-freshness checks got `nodeNowMs()` rather than a wider tolerance.** They compare
   a millisecond the page wrote against a millisecond Node read, and under a shift they were the first
   thing to go red — correctly, and about nothing. Widening the tolerance to swallow a day would have
   stopped them noticing a build that never stamped at all, which is the one thing they are for.
4. **`preDropDay` starts its walk at `today + 9`, and `aheadDay` at `nodeWeekdayAhead(4)`**, so an
   ordinary run picks the same dates it always did and the diff is a change of *rule*, not of fixture
   geometry. `aheadDay` walks in weekdays because the pager walks weekdays; `preDropDay` walks in
   calendar days because it is asked of the predicate and never of the screen.
5. **The two future dates are asserted inside the existing WO-2.3 fixture check** rather than in new
   ones. That check *is* the section's precondition check, and it keeps the executed count at 1284 so
   the "this added no check and removed none" claim is available.

---

## 4. What I left undone, and what I declined to widen

- **The residue collision is a class, not two sites.** Four other sections derive a future date off
  the calendar and then author on it or bound a term with it: `register-opens-on-term.mjs`'s
  `DAY_OFF = nodeWeekdayAhead(9)`, `term-edges-marking.mjs`, `term-ended.mjs`,
  `today-goes-to-term.mjs`. All were green on all four days I drove, but **none is immune by
  construction** — they would collide the same way on the right date. I did not touch them: the work
  order is about *the section*, and the Traps line forbids widening. **This is the follow-up I would
  book**, and the cheap version is a shared `firstClearDayFrom(records, start)` in `lib-dates.mjs`
  that all six sites call.
- **A contained section still leaves collateral.** The planted run's twelve reds are three section
  throws and nine downstream failures caused by a half-built fixture. That is honest and visible, and
  I deliberately did not make `recoverPage()` reset the document — a harness that quietly wiped the
  document after a throw would be inventing a state nobody was in. A reader of a contained run should
  read the `§ <file> ran to the end of its own checks` lines first and the rest as downstream.
- **`--today` is not proved across a weekend or across a DST seam.** `SHIFT_MS` is measured between
  two real `Date` objects precisely so a DST crossing lands on the same wall-clock time, but I did not
  drive one, and I say so at the flag's definition rather than claiming it.
- **A temptation I declined:** hardening the two `clickSel` calls at the foot of the days-off block
  against an `undefined` id (`if (!dropEvent.id) …`). It would have hidden the exact failure the
  containment is now built to report, and it treats the symptom rather than the fixture.
- **No third harness was written.** One throwaway import probe of `lib-dates.mjs` was run from the
  scratchpad to check the flag's parsing and is not in the repository.

---

## 5. Draft `CHANGELOG.md` entry — for the teacher to accept, reword or drop

> **Verification tooling — the browser harness stops dying halfway.** A section that throws now
> reddens a check of its own and the run carries on to its summary, so one missing button costs its
> own section instead of the 766 checks registered after it. `verify-shell.mjs` also takes a date now
> — `--today=2026-09-03` runs it as if that were today, on both clocks at once, with the real clock
> still the default. The five failures that came with the crash were all the fixture: the attendance
> section was picking two future dates off the calendar and one of them landed, on exactly one day of
> the year, on a date an earlier section had already recorded attendance on. Nothing in the app was
> wrong — the snow-day confirm names every period it touches, and always did.
