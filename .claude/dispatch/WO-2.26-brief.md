# WO-2.26 — the Student Report screen shows the hall passes · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.26-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at **Opus** tier. The deciding signal is presentation mode — a
never-delegate surface, and this re-cut turns on it twice: the card and the count line must both
suppress on a screen (`src/detail.js`) whose header firewall forbids it from asking `src/supports.js`
the question, which makes the whole design a judgment call about where the rule lives rather than a
transcription. Two further Claude triggers stack on it: a design lift from Roll Call!'s inline Hall
Pass History table, and a Traps section that is entirely about honoring two file-header promises. The
runner-up I set aside: size `S` on a part-built tree looks like mechanical extraction a Sonnet
fallback could carry, but size is not the rubric's criterion, the sensitive surface is disqualifying
on its own, and this re-cut hands you three open decisions rather than none.

---

## 1a. READ THIS BEFORE § 1b — this is a RESUME, and § 1b is now half stale

**You are the THIRD dispatch against this brief. Two ran before you and both were killed by the
environment, not by the work** — an API session limit, then a device crash. Neither was a code
failure, an implementer failure, or a sign that anything about this work order is wrong.

- **Dispatch 2** ran the source and wrote it before its kill; it never returned a report and never
  wrote a result file. That source is what the "do not rebuild" list below describes.
- **Dispatch 3** died inside its reading window, before its first write. It left nothing but this
  improved brief.

**Nothing below has gone stale.** Verified on disk at the start of this run: `tools/verify-shell.mjs`
mtime is still **06:08**, the first cut's — neither dead implementer ever wrote to it — and line
10479 still clicks the deleted door. `sw.js` is still v55. The crash described below is the live
state of the harness, not a stale report of it.

**One operational instruction, given two environment kills in a row: write your progress to
`.claude/dispatch/WO-2.26-status.md` as you go rather than only at the end**, so that a third
interruption leaves the next session as much to work with as this one had.

**The source work is essentially COMPLETE and has been read diff-by-diff by the owner and judged
good.** § 1b below tells you to audit the whole draft line by line — that instruction was written for
the *first* cut's draft and is now too broad. Narrow it as follows.

### Do not rebuild these. They are done and verified by reading.

- **`src/passes.js`** — `passesForStudent()` gained optional `from`/`to`, inclusive, compared as
  strings the way `meetingDates()` does, with `passDate()` for the day and a documented refusal to
  use `Date.parse`. `passesForStudentInTerm()` wraps it. **The date window lives here and nowhere
  else** — decision 1 of § 1c, discharged.
- **`src/pass-history.js`** — `studentPassCard(classId, studentId, term)` at ~557 and
  `studentPassSummary(classId, studentId, term)` at ~601, the latter now term-taking.
- **`src/detail.js`** — imports `studentPassCard`, appends it last in the right-hand column after
  `attendanceCard()`, updates the page's own firewall sentence to name hall passes. **The firewall is
  intact** — no `src/supports.js`, no `student.supports`.
- **`src/attendance-report.js`** — the 🚪 Every trip door is **deleted** (see its header, ~line 61),
  the count line stays, term-scoped via `getSelectedTerm()`.
- **`src/detail.css` / `src/attendance.css`** — the card's table styled where its class names live,
  print rules at the foot of `attendance.css` under this surface's attribute.
- **The print decision is MADE and written** at `src/detail.js` § PRINTING A VIEW: trips print with
  the grade, four reasons, `studentCsv()` deliberately untouched. Decision 3 of § 1c, discharged.

Read all of the above to understand it — you are about to write the harness that proves it — but
change it only where the harness shows it actually wrong. Report anything you do change and why.

### What is owed, in the order it blocks

**1. `tools/verify-shell.mjs` lines ~10414–10614 — the whole WO-2.26 block, re-pointed. This is the
blocking item and nothing else can be trusted until it lands.**

**The harness does not merely fail — it CRASHES.** `clickSel` at line 10479 throws `nothing to click
for #attendanceHistoryBody [data-pass-history-student=…]` — the deleted door — so **every check after
10479 never runs**, including the whole of WO-2.3 and everything below it. **Any claim that the suite
passes is meaningless until that is fixed**, and a run that stops there is not a run. Before the
crash, check 51 already FAILS on the old assertions at lines 10473–10474
(`/whole year, not just this term/` and `onReport.door === busiest`), both false by design now.

Per-check disposition of the eight:

- **count-agrees** — rewrite for term scope and no door.
- **door opens the same view** and **the report is still open underneath / stacking** — about things
  that no longer exist. **They come out entirely.**
- **no trips is told so** — keeps its first half, loses "and no door".
- **the view behind strands nobody** — **survives unchanged.** The per-student doors inside the
  class-wide 🚪 Passes dialog are still there; only the attendance-report one went.
- **the two presentation-mode checks** — drop their door halves. These two are the sensitive ones;
  they must still prove suppression against a negative control rather than against a screen that
  failed to draw.
- **the 44px `.attendance-report-door` rule check** — re-aim it. `src/detail.css` records that the
  new card holds no control at all.

**New coverage the re-cut needs and the old block cannot give:**

- The card on the **Student Report screen**, reached by `#scoresBody [data-student-detail="…"]`.
- The card and the dialog count line being **one number**.
- **The important one: a trip planted OUTSIDE the term window.** Every trip in the current fixture
  falls on 2026-08-14, so term-scoping is **invisible** to the harness as it stands. **A check that
  cannot fail when scoping is removed is not a check** — plant the out-of-term trip, and satisfy
  yourself the new checks go red if `passesForStudentInTerm()` is reduced to `passesForStudent()`.

**Restore the hand-off.** The block ends by leaving two passes open and the registry on the right
class. **A walk to the Student Report screen and back must put that back** — see the comment at
~10616 and `[data-class-screen="class"]`. The checks after this block depend on it.

**2. `TESTING.md` ~2854–2916** still describes the deleted door and the year-wide agreement. "the
number 🚪 Passes showed for the same student" is now wrong twice, and ~2916's 👤 line walks a teacher
through a door that is gone.

**3. `sw.js` is at `planbook-shell-v55`, the first cut's bump. NOT YOURS TO DECIDE.** Six more files
changed since, and the dev server was up on the LAN during that window, so a client may hold v55.
**Whether that is a v56 is explicitly the owner's call** — it was flagged and deliberately not taken.
**Surface it in your result file as a question for the owner; do not decide it and do not bump it.**

**4. The Acceptance list, the result file and the `CHANGELOG` draft.** All untouched, all still owed.

### The result file on disk is the FIRST cut's

`.claude/dispatch/WO-2.26-result.md` (274 lines) grades the deleted design — it quotes "whole year,
not just this term" and the door as passing checks. **Overwrite it wholesale**, as § 1b already says.
Its verification numbers are from the first cut and are not yours to reuse: **run both commands
yourself on the final tree and quote what they actually print.**

---

## 1b. Written for the FIRST cut — read § 1a first, which narrows this

**The work order was built once today, landed on the wrong surface, and has been re-cut by the owner
against the running build.** The first cut's code is still on disk, uncommitted, across twelve paths:

```
 M TESTING.md
 M plans/work-orders/README.md
 M plans/work-orders/phase-2-attendance.md
 M src/attendance-report.js
 M src/attendance.css
 M src/pass-history.js
 M src/shell.js
 M sw.js
 M tools/README.md
 M tools/verify-shell.mjs
 ?? .claude/dispatch/WO-2.26-brief.md      (this file)
 ?? .claude/dispatch/WO-2.26-result.md     (the first cut's — see below)
```

**It is part-built, not wrong-headed.** Nothing in it is a bad decision badly made; it is a good
implementation of a sentence the document has since corrected. But nothing has audited it against
*this* brief, including whether it stayed in scope.

### Your first obligation

**Audit the existing draft line by line against this brief before building on it**, and in your
result file **report what you kept, what you rewrote, and what you deleted, and why** for each of the
ten modified files. Do not assume a line is right because it is already there and already reads well.

### What carries forward — extract, do not rewrite

The work order names these explicitly, and they are the reason this is size `S`:

- **`openStudentPasses()` in `src/pass-history.js` (line ~392) and its per-student trip rendering.**
  It is verified and it renders every trip with date, type, out, back, minutes, the `dismissed`
  marker and the note row. **The work is extracting that table-builder so it can be returned as a
  card, so both callers share one list-builder and the two surfaces cannot drift.** Writing a second
  renderer is the failure this paragraph exists to prevent.
- **The `studentPassSummary()` arrangement** — `src/pass-history.js` builds a block and the calling
  surface only provides a container, so the caller never asks about presentation mode. The verifier
  upheld this against the `src/assignments.js` ↔ `src/accommodation-prompt.js` precedent
  (`src/assignments.js:135`). It is the verified precedent for giving `src/detail.js`
  presentation-mode-aware content without importing `src/supports.js`. **Take that road deliberately
  and say so at both ends**, as the first cut did — do not rediscover it, and do not write "this file
  does not import that module" above an import.
- **The count's single source in `tallyPasses()`** (`src/passes.js:220`), reached through
  `passesForStudent()`. Never a loop written at a surface.

### What comes out

- **The `🚪 Every trip` door** on the attendance history dialog, and its `aria-label`/`title`.
- **Its CSS** — `.attendance-report-passes .attendance-report-door` and whatever else exists only to
  style a button that no longer exists. Keep the coarse-block 44px declaration on
  `.attendance-report-door` if it still covers a live control (WO-3.7's *Grades for …* door and
  WO-2.9's `← All students` both wear that class); delete what is orphaned.
- **The eight harness checks in `tools/verify-shell.mjs`** as currently aimed. **They assert a door
  this re-cut deletes. They need re-pointing at the new card, not re-running as-is** — a green harness
  against the wrong target is not evidence, and it is the specific failure the work order's note under
  the Acceptance list was written to prevent.
- **The label "whole year, not just this term"** wherever it appears. The re-cut's term-scoping
  decision makes it **untrue**, not merely unnecessary.

### The acceptance ticks

**Exactly one line is ticked and it stays ticked: line 6**, `src/attendance-report.js`'s firewall —
the one whose subject did not move. **Every other line was verified against the wrong screen and is
deliberately blank. Do not re-tick a line on the grounds that it was ticked before the re-cut.** Tick
only what your own run closes with evidence you can point at, and never a 👤 line.

### Three files the first cut wrote prose into, which now describes the wrong surface

- **`.claude/dispatch/WO-2.26-result.md`** — the first cut's result. **Overwrite it wholesale** with
  yours; do not append to it. Its "Against the Acceptance list" section grades the deleted design.
- **`TESTING.md`** — a `### WO-2.26` section at the foot of Phase 2, ten ticked desk lines and three
  👤 lines, all about the dialog and its door. Re-cut it for the card.
- **`plans/work-orders/phase-2-attendance.md`** — the first cut appended an italic note recording two
  decisions ("the count is **not term-scoped**", "the door is drawn by `src/pass-history.js` into a
  container this dialog provides"). It sits under the Acceptance list, it is quoted verbatim in § 1
  of this brief, and **the first of its two decisions is now contradicted by the owner**. Replace it
  with a note recording the decisions *you* make. Leave the RE-CUT paragraph and the "ticks are
  deliberately mostly empty" note alone — those are the owner's.

### Two bookkeeping numbers the first cut already moved

- `sw.js` `CACHE` is already at `planbook-shell-v55` (from `v54`) and is uncommitted, so that bump
  covers your run too. `src/detail.js` and `src/detail.css` are both already in the `SHELL` list —
  check rather than assume, and bump again only if you have a reason to.
- `tools/README.md`'s `check()` call-site count was moved `734 → 742` by the first cut.
  `wo-sweep.mjs` enforces it. Whatever the final tree holds is what that number must read, and the
  narrative entry beside it must describe the card, not the door.

---

## 1c. The three decisions this re-cut leaves to you — make them, and write the reason at the code

1. **How the term window is derived.** The card and the dialog's count line are both term-scoped now
   (owner, 2026-08-14), and the class-wide 🚪 Passes dialog stays year-wide. A pass carries a stamp
   and no term id (`passDate()` in `src/passes.js:196`); a term carries `start` and `end`. The header
   of `openPassHistory()` (`src/pass-history.js:163`) currently argues *against* scoping in as many
   words — **that paragraph is now out of date for these two surfaces and must be corrected rather
   than left standing beside code that contradicts it.** Where the date-window rule lives is your
   call; do not put a second copy of it in two files.
2. **The no-dates fallback.** `attendanceCard()` (`src/detail.js:517`) already has the words:
   `' — this term has no dates set, so this is every meeting on the year'`. The work order asks for
   *those* words, adapted, rather than new ones.
3. **Print.** `src/detail.js` gates its `@media print` block on `data-detail-print`, answered from a
   `beforeprint` listener in `src/print-gate.js` (WO-2.25). Whether the trips print with the grade is
   a choice. **Make it, and write the reason where the gate is.** WO-3.7's eighth acceptance line
   covers the printed page and the CSV in both presentation modes, and this is the screen most likely
   to be handed across a desk — so whatever you decide, the printed page and the CSV must still carry
   no support data in either mode.

**One thing that is not yours to decide:** the studentCsv() path. The work order says nothing about
putting trips in the CSV. If you think it belongs there, that is a proposed follow-up work order in
your report, not a line of code.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.26 — the Student Report screen shows the hall passes

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-14 re-cut · **Size** S · **Depends on** WO-2.6, WO-2.9,
WO-3.7
**Closes roadmap** *(no box. Phase 2's pass-history line is WO-2.9's and is ticked; this is the join
between two surfaces that work order deliberately left apart.)*

**RE-CUT 2026-08-14, same day, by the owner against the running build — and the fault was in this
document, not in the dispatch that read it.** The first version was built exactly as written and
landed on the wrong screen. The title said *"the student report"*; every deliverable and every
acceptance line underneath it said *"the student **attendance** report"*, and those are two different
surfaces one door apart. The body won, as it should have. **"Student report" is a name this
repository had not spent, and both surfaces answered to it**: `src/attendance-report.js` renders what
its own code calls the student attendance report, and WO-3.7's `src/detail.js` is the screen a teacher
means when she says she is looking at a student's report. From here the second is **the Student Report
screen** and gets called that by name; the first is **the attendance history dialog**. Anything that
still reads "the student report" unqualified is this work order's ambiguity and not a third surface.

**Booked 2026-08-14, out of WO-2.9's iPad sitting.** All seven manual lines passed, and the first
question after them was *"where do I see a record of the hall pass?"* — asked by the owner, on the
build, with both surfaces in front of her. That is the whole of the evidence and it is enough: the
record is two dialogs away from the screen a teacher opens to talk about one student.

**Why it exists.** *Roll Call! puts it on one page and Planbook puts it on two.* Roll Call!'s Student
Report carries the **Hall Pass History** table inline (`src/dashboard.html` ~4718), so a teacher at a
conference opens one thing. Here 🖨 Record and 🚪 Passes are separate dialogs that share no data:
`src/attendance-report.js` contains no reference to a pass, and `src/pass-history.js` contains no
attendance. **The split itself is correct and is not what this work order undoes** —
`src/attendance-report.js`'s header promises it never imports `src/supports.js` and has no path to
`student.supports`, which is what keeps its printed page and its CSV clean in either presentation
mode, and the pass history has to ask about presentation mode. Two files, two promises, both true.
What was never decided on purpose is that the **teacher** pays for the seam. This joins the two
surfaces in the UI and leaves both promises standing.

**The breakdown is a card on the Student Report screen, not a door on a dialog.** Roll Call! puts the
Hall Pass History table **inline** on its Student Report (`src/dashboard.html` ~4718) and that is the
part to copy — a teacher at a conference reads the trips on the page she is already on, without
opening anything. `src/detail.js` already builds exactly this shape at `attendanceCard()` (~line 503):
a `.detail-card` with a title carrying its own summary, a body, and a note underneath that says what
the numbers are counted out of. **The pass card is that card's sibling and is built the same way.**

**The per-student trip rendering already exists** — WO-2.26's first cut wrote `openStudentPasses()` in
`src/pass-history.js`, verified, and it renders every trip with times and notes. It renders into a
modal. What this re-cut needs is that same rendering returned as a **card**, so both callers share one
list-builder and the two surfaces cannot drift. Extracting it is the work; writing it again is not.

**`src/detail.js` carries the same firewall `src/attendance-report.js` does** — its header (lines
36–42) promises no import of `src/supports.js` and no path to `student.supports`, and WO-3.7's eighth
acceptance line extends that to the printout and the CSV in **both** presentation modes. The pass card
needs to know whether the mode is on; that answer lives in `src/supports.js`; this file may not ask.
**The precedent is already set and upheld:** the first cut had `src/pass-history.js` build the block
and hand it over, the verifier checked that against the same arrangement `src/assignments.js` has with
`src/accommodation-prompt.js`, and it held. Take that road deliberately this time rather than
rediscovering it — and say so at both ends, as the first cut did.

**Deliverables**
- **A hall-pass card on the Student Report screen**, inline beside the attendance card, listing this
  student's trips — per Roll Call!'s one-page report. Not a door, not a dialog, not a second tap.
- **Term-scoped, with the attendance card's own fallback.** The trips listed are the open term's, and
  when a term has no dates set the card says so in the words `attendanceCard()` already uses rather
  than in new ones. *(Owner, 2026-08-14: the whole screen answers one question about one stretch of
  time, and a year-wide list would be the only thing on it that does not.)*
- **The count line stays on the attendance history dialog, and the door comes off.** *(Owner,
  2026-08-14.)* The dialog keeps `Hall passes · N trips · N minutes out` as a fact a teacher sees
  while marking attendance; 🚪 **Every trip** is deleted, because the breakdown now has one home.
- **The two per-student counts agree, which means the dialog's line is term-scoped too.** This is what
  the first cut's acceptance line 1 got wrong, and it is corrected below rather than carried forward.
- **Presentation-mode safe on both surfaces**, by the arrangement described above — the card and the
  count line both go, and the screen that remains is a screen, not a hole.
- **A decision about print, made out loud.** `src/detail.js` gates printing on `data-detail-print`
  and WO-3.7's eighth line covers the printed page in both modes. Whether the trips print with the
  grade is a choice; make it, and write the reason where the gate is.

**Acceptance**
- [ ] **The Student Report screen lists this student's trips inline** — every trip in the open term,
      with its date, its clock and its note, on the screen itself and behind no tap.
- [ ] The list is **term-scoped**, and says which term it covers. A term with no dates set falls back
      to the whole year in `attendanceCard()`'s existing words, not in new ones.
- [ ] **The attendance history dialog shows the count and no door.** `🚪 Every trip` is gone from it,
      and the count line that remains agrees — **exactly** — with the Student Report card for the same
      student in the same term. One number, two surfaces, no label reconciling them.
- [ ] A student with no trips is **stated as none on both surfaces**, rather than left blank or given
      an empty card.
- [ ] Presentation mode: the card and the count line are both suppressed, and the Student Report
      screen still draws. A negative control proves suppression rather than a screen that failed.
- [x] `src/attendance-report.js` still imports nothing from `src/supports.js` and has no path to
      `student.supports` — the grep WO-2.6's fourth acceptance line rests on still comes back empty.
- [ ] **`src/detail.js` holds the same line** — no import of `src/supports.js`, no path to
      `student.supports`, and WO-3.7's eighth acceptance line still true of the printed page and the
      CSV in both modes.
- [ ] The trips **print or do not print** as decided, and the printed page matches the decision. 👤
- [ ] The card reads at arm's length beside a guardian, and the Student Report screen still reads as
      one page rather than as a page with a table bolted to it. 👤

*(**Re-cut 2026-08-14. The ticks above are deliberately mostly empty**, and the one that survives is
the one whose subject did not move: `src/attendance-report.js`'s firewall was proved by the first cut
and the re-cut does not touch it. Everything else was verified **against the wrong screen** — the
`verify-shell.mjs` run was real (740 of 740, 0 failed, 0 skipped, eight new checks) and its checks are
sound, but they assert a door this re-cut deletes. **A green harness against a wrong target is not
evidence, and re-ticking those lines because they were once ticked is the failure this note exists to
prevent.** The eight checks get re-pointed at the card, not re-run at the dialog.*

*What carries forward, and should not be rebuilt: `openStudentPasses()` and its trip rendering; the
`studentPassSummary()` arrangement whereby `src/pass-history.js` builds a block and the calling
surface only provides a container, which the verifier upheld against the `src/assignments.js` ↔
`src/accommodation-prompt.js` precedent; and the count's single source in `tallyPasses()`. What comes
out: the `🚪 Every trip` door, its CSS, its harness checks, and the "whole year, not just this term"
label, which the term-scoping decision makes untrue rather than merely unnecessary.)*

*(The first five were closed by `verify-shell.mjs` on 2026-08-14 — eight new checks at the foot of
the hall-pass section, run **740 of 740, 0 failed, 0 skipped**. The 👤 line stays open: its 44px half
is asserted as a **rule** in the coarse block rather than measured, because no sweep in the harness
opens this dialog, and its second half is a walk with a thumb. **Two decisions the work order left to
the implementation, both recorded in the code that makes them:** the count is **not term-scoped** and
says so on its own line — "whole year, not just this term" — which the first acceptance line forces
rather than merely permits, since the number it has to agree with is 🚪 Passes' and that one is the
whole year; and the door is drawn by `src/pass-history.js` into a container this dialog provides
(`studentPassSummary()`), which costs **one import of that module** into `src/attendance-report.js`
against the header's expectation of none. The reason is written at both ends: acceptance line 4 needs
this surface to know whether the room behind the door will open, that answer is `presentationMode()`,
it comes from `src/supports.js`, and acceptance line 5 forbids this file from asking. So it asks
nobody, and the block arrives built. Everything the traps line protects is intact — no import of
`src/supports.js`, no path to `student.supports`, and no second loop over the log.)*

**Traps** — **The promise in `src/attendance-report.js`'s header is the thing to protect**, and it is
protected by the shape of the join rather than by care. Read that header before writing, and if the
design ends up needing an import, stop and say so rather than writing "this file does not import that
module" above an import. **The count is a number two surfaces now show**: it comes from
`src/passes.js`'s `tallyPasses()` like every other one, never from a loop written here — WO-2.9's
third acceptance line is about exactly this, and a second loop agrees with the first on every fixture
anybody writes. **The pass history is not term-scoped and both surfaces here are.** A trip count on a
term report, sourced from a log that holds the whole year, is two date windows on one page. The first
cut left this to the implementation and got the label; **the re-cut decides it — scope it, both
places** (owner, 2026-08-14), and the class-wide 🚪 Passes dialog stays the year-wide view it already
is. **`src/detail.js`'s header firewall is now the second one to protect**, and it is the more
exposed of the two: WO-3.7's eighth acceptance line covers its printed page and its CSV in both
presentation modes, and this is the screen most likely to be handed across a desk. Read lines 36–42
before writing, and if the design needs an import, take the road the first cut proved and say why at
both ends — do not write "this file does not import that module" above an import.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/accommodation-prompt.js`
  - `src/assignments.js`
  - `src/attendance-report.js`
  - `src/detail.js`
  - `src/pass-history.js`
  - `src/passes.js`
  - `src/supports.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **The two file headers this work order is about, read before you write a line:**
  - `src/detail.js` **lines 36–56** — the no-support-data firewall, and the paragraph at 46–56
    explaining why the support indicator from `design/mockups/student.html` was deliberately *not*
    built here. That paragraph names the exact test a new block on this screen has to pass.
  - `src/detail.js` **lines 58–81** — printing a view rather than a dialog, and why the attribute is
    different from WO-2.6's. Decision 3 above lands here.
  - `src/attendance-report.js` **lines 20–60** — the promise this work order must leave standing,
    including the paragraph the first cut added at 47–56 about the import it spent.
  - `src/pass-history.js` **lines 1–30** and **155–168** — the two-files-two-promises argument, and
    the "WHAT IS NOT FILTERED IS THE TERM" paragraph that decision 1 above puts in question.
- **The card shape you are copying:** `src/detail.js` `attendanceCard()` at **line 503** — a
  `.detail-card`, a `.detail-card-title` carrying its own summary, a body, and a note underneath
  saying what the numbers are counted out of. **The pass card is that card's sibling and is built the
  same way.** Its CSS lives in `src/detail.css` (`.detail-card`, `.detail-card-note`, `.detail-att*`),
  not in `src/attendance.css`.
- **`src/detail.js` `renderDetail()` at line 535** — where cards are appended, and the `!student`
  branch above it.
- **The Roll Call! original**, which is the design being lifted:
  `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\src\dashboard.html` around line
  **4718** — the Hall Pass History table inline on its Student Report, and its `if (passes.length)`
  gate. Per `CLAUDE.md`: **lift the design with the function, copy rather than re-derive** — take its
  markup structure, measurements and colours, and say in a comment at any point you depart from it.
  Note the work order has already rejected one half of it: a student with no trips gets a stated
  "none" here, not an omitted block.
- **`design/style-guide.md`** and Roll Call!'s `design/portable-components.md`.
- **`tools/verify-shell.mjs`** — the existing WO-2.9 hall-pass section and the eight checks at its
  foot, which are the ones to re-point. Keep new checks inside that section; do not open a second one.
- **`src/scores.css:604–614`** — the record of what an inherited-rather-than-declared 44px floor cost
  WO-3.7.

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

## 5. Done means these 9 lines, reported against one by one

1. **The Student Report screen lists this student's trips inline** — every trip in the open term, with its date, its clock and its note, on the screen itself and behind no tap.
2. The list is **term-scoped**, and says which term it covers. A term with no dates set falls back to the whole year in `attendanceCard()`'s existing words, not in new ones.
3. **The attendance history dialog shows the count and no door.** `🚪 Every trip` is gone from it, and the count line that remains agrees — **exactly** — with the Student Report card for the same student in the same term. One number, two surfaces, no label reconciling them.
4. A student with no trips is **stated as none on both surfaces**, rather than left blank or given an empty card.
5. Presentation mode: the card and the count line are both suppressed, and the Student Report screen still draws. A negative control proves suppression rather than a screen that failed.
6. `src/attendance-report.js` still imports nothing from `src/supports.js` and has no path to `student.supports` — the grep WO-2.6's fourth acceptance line rests on still comes back empty.
7. **`src/detail.js` holds the same line** — no import of `src/supports.js`, no path to `student.supports`, and WO-3.7's eighth acceptance line still true of the printed page and the CSV in both modes.
8. The trips **print or do not print** as decided, and the printed page matches the decision. 👤
9. The card reads at arm's length beside a guardian, and the Student Report screen still reads as one page rather than as a page with a table bolted to it. 👤

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

