# WO-1.44 — the browser harness dies at check 518 and 766 checks never run · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.44-result.md` — as your last act, and return it in-band too.

**Route — Claude Opus, on the work order's own merits.** The deliverable that leads is a written
*harness-or-app* verdict per failure, which is judgment rather than a spec to implement; this edits
the instrument every Acceptance line in the project is read through; and the crash fix has to argue
against a decision the file states deliberately at `tools/verify-shell.mjs:43` rather than undo it.
Runner-up set aside: Codex has a genuine claim on the crash-containment half alone, but the budget
refuses it before the rubric does — 429s a run × the four-plus full runs the Acceptance demands
(clean, planted selector, three weekdays) is ~30 minutes against a hard 20-minute cap.

### Two things from this orchestrator's own run — evidence, not instructions

**The harness runs here.** Before writing this brief I ran `node tools/verify-shell.mjs` from a
dispatch shell on this machine. It launched headless Edge, emitted **518 results, 513 PASS and 5
FAIL**, and threw the identical
`nothing to click for #daysOffList [data-dayoff-remove="undefined"] [0]` at `verify-shell.mjs:465`.
That is the **third** identical reproduction, and the first taken outside the owner's own shell — so
the first Trap's *"a dispatch usually cannot run this"* **does not apply to you today**, and you are
expected to drive it. The full log is at `.claude/dispatch/WO-1.44-orchestrator-probe.log`. Treat it
as a third data point beside the owner's two; if a run of yours disagrees with it, that disagreement
is worth more than the rest of this dispatch and gets reported rather than reconciled. If the browser
nonetheless refuses to launch for you, say so by name and mark every un-run claim un-run — do not
infer the harness's behaviour from reading it.

**One unanalysed correlation in that log, offered as a lead and not a conclusion.** The selector that
throws carries `undefined` where an event id belongs, and the first of the five FAIL lines prints
`the event is {}` for an event it had just authored. Whether that is one defect or two, and whether
the empty object is the app's or the fixture's, is exactly what Acceptance line 1 asks you to settle
in writing before either side is edited. I did not investigate it.

### The decision the crash fix must not undo

`tools/verify-shell.mjs:43`, in the file's own header: *"A SECTION THAT THROWS STILL KILLS THE RUN.
Nothing below wraps `run(h)` in a try/catch, and that is deliberate: catching would turn a section
that broke into a section that quietly did not happen, which is the same lie as a silent skip and is
the failure mode this file's SKIP accounting exists to make loud."* The cheapest fix — wrapping the
`for (const s of BROWSER_SECTIONS)` loop at `:720` in a bare try/catch — is the exact thing that
comment forbids, and the work order asks for something narrower: a missing element **reddens its own
check** and the run still reaches its summary. Whatever you build, a broken section must stay loud,
stay counted, and still make the run exit non-zero. If you conclude the header comment itself should
change, say so at the point of departure and name the rule that beats it; do not quietly delete it.

### Where to stop

Write `.claude/dispatch/WO-1.44-result.md` as your last act. **The verifier is a separate session and
is not yours to spawn.** Say plainly what you ran, what you could not run, and which Acceptance lines
you are claiming on evidence rather than on reasoning — a box you cannot close is closed by the owner
locally, and only if you have named it.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.44 — the browser harness dies at check 518 and 766 checks never run

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-31 · **Size** M · **Depends on** — · **Blocks** nothing formally,
and read that as the defect rather than the scope: nothing depends on this because nothing *can*
depend on a harness, which is exactly why it went two days without anyone noticing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.43
made. Booked 2026-08-31, owner-directed, out of WO-1.42's dispatch, which reported it as a finding
outside its own scope and correctly refused to fold it in.)*

**Why it exists.** `node tools/verify-shell.mjs` throws out of the run at
`tools/verify-shell.mjs:465` — `nothing to click for #daysOffList [data-dayoff-remove="undefined"]`
— reached from `tools/verify/attendance-passes.mjs:2481`. It emits **518 results, 513 PASS and 5
FAIL, and then stops.** The run is 1,284 checks. **766 of them have not executed on any run since at
least 2026-08-30**, and the summary line that would have said so never prints, because the process
dies before it.

**What that does and does not put at risk — corrected the same day it was booked.** It is exposure to
the **next app change**, not to Wednesday's deploy. `git diff 703af0a HEAD` over `src/`,
`index.html`, `sw.js`, `privacy.html`, `manifest.json` and `icons/` is **empty**, so the build that
meets students on 2026-09-02 is byte-for-byte the build that passed 1,284/1,284. *This row was first
argued as go-live exposure, and that was overstated — repaired here rather than left standing,
because an overstatement in a Why is the kind a reader inherits and repeats.* **The urgency is real
and it is a different urgency:** the first app change to land after this one is verified against two
fifths of a harness, and nothing in the output will say so.

**The five failures are the symptom and the crash is the defect.** A harness that goes red has
reported. A harness that *stops* has stopped reporting — on grades, signals, outreach and everything
else downstream of attendance — while still looking like it ran, because 513 PASS lines scroll past
first. The 👤 rule in `CLAUDE.md` says a green harness closes no human item; this is the other half
of that sentence, and nothing here says it: **a harness that never reaches its summary has not gone
green or red, and no reader of its output can tell.**

**It is not a regression, and the next reader will assume it is.** `git diff 703af0a HEAD` is
**empty** over `src/`, `index.html`, `sw.js` and `privacy.html`, and equally empty over
`tools/verify-shell.mjs` and `tools/verify/`. The commit at `703af0a` records `verify-shell
1284/1284` in its own message. **The bytes that ran green are the bytes running red** — so the
variable is outside the repository, and an afternoon spent bisecting `src/` is an afternoon spent
proving something this paragraph already proves. Two runs on 2026-08-31 produced **identical**
results — same 513, same five assertions, same crash — so it is deterministic and not a flake.

**The likeliest variable is the weekday, and it is not proved.** The last green run was
**Sunday 2026-08-30**; both red runs are **Monday 2026-08-31**. The failing section builds its
fixture from *today* — `preDropDay` is today + 9 at `tools/verify/attendance-passes.mjs:2182`,
`nodeToday` at `tools/verify/lib-dates.mjs:37` — and its assertions reason about which periods were
taught **today**, a quantity that is structurally different on a weekend. `taughtToday.length > 0` is
asserted at `:2431`, so the section is not vacuous on a Sunday and the mechanism is not simply
"nothing recorded". **The WO-2.50 term gate is already ruled out**: this section blanks every term
date on entry, at `tools/verify/attendance.mjs:110`, and says why. *Go-live is Wednesday 2026-09-02 —
a weekday — so a fix that is only green on the day it was written is not a fix.*

**What the failures do and do not threaten.** Three of the five print `attendance byte-identical` and
the other two assert it inside the check: **no path here is losing or rewriting a mark.** What is
wrong on screen is what the confirm *names* — 2 periods listed against 4 recorded today — and which
classes read `covered` rather than `not-taken` after a snow day. Those are count and display claims.
Whether the app or the fixture is wrong about them is **the open question this work order answers
first**, and it must be answered per failure before a line of either is changed.

**Take the snow-day question before the crash — the row's order is not the working order**
(2026-08-31, the owner's call at booking). The crash is the bigger defect; the diagnosis is the more
urgent errand. The confirm that named **2 periods against 4 recorded** is reachable in week one: a
teacher laying a snow day over a day she really taught is told which periods it touches, and if the
app is the half that is wrong, that wants knowing before Wednesday. It is an hour to find out, and it
is the only part of this work order with a consequence a teacher meets. **The crash containment is
second, and it is also the fallback if the diagnosis runs long** — bounded, needs no verdict on any of
the five, and it is what stops the next unsatisfied selector costing 766 unrelated checks. The
weekday line is third and may slide past 2026-09-02 without costing anything.

**Traps**

- **The harness this work order is about is usually the one thing a dispatch cannot run.**
  `verify-shell.mjs` drives headless Edge over CDP, and a dispatched agent reporting *"could not
  run"* has reported **an environment, not a result** — `CLAUDE.md` § Commands and `AGENTS.md` both
  say so, and on every other work order it is a nuisance. **Here it is the task.** Three things
  follow, and they are the difference between a useful dispatch and a confident one. **Do not infer
  the harness's behaviour from reading it** — this work order exists because what it does and what it
  looks like it does came apart. **Do not report a run you did not take**, and mark every claim that
  is un-run as un-run, by name; a green figure in a result file is a timestamp at best and a fiction
  at worst, which is the WO-5.1 scar in `plans/dispatch-retro.md`. And **say plainly what you could
  not drive**, because the boxes it would have closed are then closed locally by the owner rather
  than quietly left looking closed. This is not 👤: 👤 means no headless browser can settle it, and
  this wants a browser — just not one in your sandbox.
- **The diagnosis in the Why is evidence, not a starting hypothesis.** It was taken on the owner's
  machine on 2026-08-31: two full runs, identical results, both diffs against `703af0a` empty, the
  WO-2.50 term gate ruled out by `tools/verify/attendance.mjs:110`. **Build on it rather than
  re-deriving it** — and if a run of yours contradicts any of it, that disagreement is a finding
  worth more than the rest of this work order and gets reported rather than reconciled.
- **Do not make the five assertions pass.** The fixture is the accused as much as the app is, and the
  cheapest way to a green run is to move whichever number disagrees — which would delete the only
  evidence that anything was ever wrong. Settle *harness or app* per failure, in writing, with the
  reasoning, **before** editing either side. If it is the app, that is its own row and this one names
  it rather than absorbing it.
- **The crash is worth fixing even if all five failures turn out to be fixture noise.** One
  unsatisfied selector currently costs 766 unrelated checks. `clickSel` throwing is correct for a
  harness that wants to fail loudly; **throwing all the way out of the process is not**, because the
  blast radius is every section registered after this one. A missing element should redden its own
  check and let the run reach its summary. That is the half of this work order that pays off on every
  future dispatch, not just this one.
- **Do not go looking for the commit that broke it.** There isn't one; the paragraph above proves it
  with two empty diffs. A bisect here finds nothing and costs a sitting.
- **A single green run does not close this.** The failure is date-coupled on the current evidence, so
  a run on one day proves one day. Either move the clock or make the section's notion of *today* an
  input — and if it is made an input, the default must stay the real clock, or the harness stops
  measuring the case the teacher is actually in.
- **Mind what this file is.** `verify-shell.mjs` and `tools/verify/` are the instrument every 👤 and
  every Acceptance line is read through. WO-1.26 already found this surface too big to hold in the
  head; a repair here that is not driven is a repair that moves the blind spot rather than closing it.

**Acceptance**
- [ ] Each of the five current failures is settled **in writing as harness or app**, with the
      evidence, before either side is edited — **the snow-day confirm first**, because it is the one
      with a consequence a teacher meets; any app defect found is fixed here or booked as its own row
      and named on this one.
- [ ] `node tools/verify-shell.mjs` runs to completion and prints its summary line, with no throw out
      of the process — driven against a **planted** missing selector as well as the real one, so the
      claim is about the mechanism and not about this one element.
- [ ] The section no longer depends on which weekday it is run on, proved on **at least three
      different weekdays** — by moving the clock or by making *today* an input whose default is still
      the real clock, never by asserting it in a comment.
- [ ] The check count the run reports is stated in `tools/README.md` and matches, so § 11 and § 22
      are both reading a number a full run actually produced.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/dispatch-retro.md`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/attendance-passes.mjs`
  - `tools/verify/attendance.mjs`
  - `tools/verify/lib-dates.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `.claude/dispatch/WO-1.44-orchestrator-probe.log` — this orchestrator's own full run of
  `verify-shell.mjs`, taken 2026-08-31 before the brief was written. 518 results and the crash.

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

## 5. Done means these 5 lines, reported against one by one

1. Each of the five current failures is settled **in writing as harness or app**, with the evidence, before either side is edited — **the snow-day confirm first**, because it is the one with a consequence a teacher meets; any app defect found is fixed here or booked as its own row and named on this one.
2. `node tools/verify-shell.mjs` runs to completion and prints its summary line, with no throw out of the process — driven against a **planted** missing selector as well as the real one, so the claim is about the mechanism and not about this one element.
3. The section no longer depends on which weekday it is run on, proved on **at least three different weekdays** — by moving the clock or by making *today* an input whose default is still the real clock, never by asserting it in a comment.
4. The check count the run reports is stated in `tools/README.md` and matches, so § 11 and § 22 are both reading a number a full run actually produced.
5. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

