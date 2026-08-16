# WO-1.21 — the tracker has no word for work that is not coming · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.21-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, Opus tier, on its own merits** — the deciding signal is the
first Deliverable, which hands you an unmade decision ("*whether that is two new statuses, or a status
plus a field, or an explicitly uncounted section, is the implementer's call — argue it in the work
order and pick one*"); that is a convention every future tracker row copies, and it sits beside
teacher-facing prose edits to `CLAUDE.md` and `AGENTS.md`. The runner-up set aside: the Codex column
is genuinely tempting here, because this is a bounded single-file edit to `wo-gate.mjs` whose
acceptance lines are almost all commands that either exit zero or do not — but the Codex rule requires
the spec to live *outside* the work order and be complete, and this one deliberately withholds it. No
Codex probe was run; the probe is a Codex-route step only. The Ship 1 pre-routing table has no row for
WO-1.21, so there is nothing there to agree or disagree with.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.21 — the tracker has no word for work that is not coming

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-16 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. Process, not app — this is the tracker being wrong about
itself, which no roadmap promise covers. Booked 2026-08-15.)*

**Why it exists.** `wo-gate.mjs` knows four statuses — `⬜ NOT STARTED`, `🤖 CLAIMED`,
`🔨 IN PROGRESS`, `✅ DONE` — and **none of them means "this is not coming."** Two work orders are
currently in that state and both are parked in `⬜ NOT STARTED`, which is the one status that is
actively false about them:

- **WO-3.13 — paste a column of scores. STRUCK** by the owner on 2026-08-15: scores arrive on paper,
  so there is no column to copy and the clipboard has nothing to carry. The strike is a *whether*.
- **WO-2.7 — Roll Call! importer. DEFERRED** by the owner on 2026-08-09: no live data is coming
  across, rosters are pasted fresh, the ledger starts empty. The deferral is a *when*, and it returns
  the first time someone wants a prior year read in.

Both were handled correctly everywhere it was dangerous — pulled from the running order, and pulled
from the dependency lines that would otherwise have held live work shut. **The residue is arithmetic,
which is why nobody caught it: nothing is blocked, the numbers are just wrong, quietly and forever.**

**What the wrong numbers actually are.** WO-3.13 is one of Phase 3's 23, so **Phase 3 can never read
23/23**. WO-2.7 owns a roadmap box — Phase 2 → *"Roll Call! importer"* — so **`ROADMAP.md`'s Phase 2
row can never read 16/16**, and the 15/16 sitting in that dashboard today is not a gap anyone is
working on. The overall count carries both. **A completion percentage with a floor below 100% teaches
everyone to stop reading it**, which is the same defect as a rule nobody follows: it costs attention
per session and buys nothing.

**Struck and deferred must stay distinct, and that is the design constraint rather than a preference.**
They are different facts with different futures: a strike says the thing should not be built and its
roadmap box, if any, should stop being counted; a deferral says not now, keeps its box, and expects to
come back. Collapsing them into one "not happening" status is simpler and destroys the distinction
that WO-2.7's and WO-3.13's own notes were careful to draw — WO-3.13 says so in as many words,
*"it is struck rather than deferred, and that is a different thing from WO-2.7."*

**Three smaller pieces of the same defect, folded in on 2026-08-16.** Each is the tracker or its
documentation asserting something about itself that is not true, each is one line, and the first two
were found by a dispatch that correctly declined to widen its own scope (WO-1.20). They are booked
here rather than as work orders of their own because a third process work order for three sentences
is the overhead that stops people booking anything.

- **`plans/work-orders/README.md` § The files says `phase-1-shell-store-roster.md` holds
  `WO-1.1 … WO-1.19`.** It holds WO-1.21. The row was last true before 2026-08-15, and the same
  table has eight more rows that rot the same way every time a phase gains a work order.
- **`CLAUDE.md` § Commands says `verify-shell.mjs` "cannot run in a sandboxed agent."** On
  2026-08-16 both the WO-1.20 implementer and its verifier ran it to completion — `795 checks · 795
  passed · 0 skipped`, exit 0, 255s. `AGENTS.md:64` already says *"usually cannot"*, which is
  correct, so **the two files have drifted** — the offence `CLAUDE.md` names for itself at the end
  of § How work is run here. The rule underneath is untouched and stays: a green harness from a
  dispatch closes no box, and a "could not run" is an environment report. Only the flat *cannot*
  is wrong, and it is wrong in the direction that teaches a reader to disbelieve a true report.
- **WO-2.32's open 👤 line sends a tester to a shell that no longer exists.** It reads *"on the
  teaching iPad, on `planbook-shell-v69`"*; `sw.js` is at `planbook-shell-v71` and has been since
  WO-3.23. That work order is otherwise five-of-six ticked and nothing is holding it shut, so the
  one thing standing between it and `✅ DONE` is a check pointed at a dead target.

  **This is WO-1.20's live-rule-versus-history distinction again, and it decides the whole fix.** A
  version inside a **ticked** 👤 line is a record of what was tested — `TESTING.md` has a dozen,
  `:3829` and `:4948` among them — and rewriting one would be falsifying a result. A version inside
  an **unticked** line is an instruction, and this one instructs a tester to do something impossible.
  Checked 2026-08-16: `phase-2-attendance.md:3214` is the only unticked 👤 line in the repository
  that pins a shell version, so this is one line, not a sweep.

**Deliverables**
- **A way to record struck and deferred that `wo-gate.mjs` understands**, keeping them distinct.
  Whether that is two new statuses, or a status plus a field, or an explicitly uncounted section, is
  the implementer's call — argue it in the work order and pick one.
- **The dashboards stop counting work nobody intends to do**, in both `plans/work-orders/README.md`
  and `ROADMAP.md`, in a way that still shows the reader those work orders exist and why. **A number
  that goes up because something was hidden is worse than the number it replaced** — if the count
  drops, the file says next to it what dropped out and where it went.
- **`--audit` still agrees with itself**, and its dashboard-versus-boxes check understands the new
  shape rather than being taught to skip it.
- **`--self-check` covers the new status**, since it exists to plant every violation the script is
  supposed to catch and a status it has never seen is a status nothing guards.
- **WO-3.13 and WO-2.7 are moved onto whatever this creates**, which is the only proof it works.
- **Every row of `README.md` § The files names the work orders its file actually holds** — fixed as
  a table, not as one row, since the next phase to gain a work order breaks it again otherwise.
- **`CLAUDE.md` and `AGENTS.md` agree about the harness in the sandbox**, with `AGENTS.md:64` as the
  correct copy. Say what changed and why in one clause; the standing rule does not move.
- **WO-2.32's 👤 line names a shell a tester can actually be running**, and says how it should be
  written so it does not rot at the next `CACHE` bump. Pinning `v71` is the smaller half of the job:
  prefer wording that names the deployed build, with the version as the reading to confirm rather
  than a target to match.

**Out of scope** — reversing either decision, both of which are the owner's and are recorded with
their reasoning; `next` and the running order, which already handle these two correctly by omission
and need no change; any new tool, per `tools/README.md` — this is an edit to `wo-gate.mjs`.

**Acceptance**
- [ ] `wo-gate.mjs --list` reports WO-3.13 and WO-2.7 as something other than `⬜ NOT STARTED`, and
      reports them differently from each other.
- [ ] No dashboard in `plans/work-orders/README.md` or `ROADMAP.md` counts either one as outstanding
      work, and each file shows a reader that they exist and why they are out.
- [ ] `node tools/wo-gate.mjs --audit` passes.
- [ ] `node tools/wo-gate.mjs --self-check` passes, and plants a violation involving the new status.
- [ ] `node tools/wo-sweep.mjs` totals are unchanged — this work order ships no app code.
- [ ] Every row in `README.md` § The files matches the work orders in the file it names, checked
      against the tracker rather than by eye.
- [ ] `CLAUDE.md` no longer states that `verify-shell.mjs` cannot run in a sandboxed agent, and says
      the same thing as `AGENTS.md:64`. A dispatch's green harness still closes no box in either.
- [ ] `phase-2-attendance.md:3214` no longer sends a tester to `planbook-shell-v69`, and what it
      asks of that tester is otherwise **word for word what it was** — the line is still unticked and
      still refuses to ask whether a tone is audible. Every ticked 👤 line in the repository still
      names the shell it was actually run against.

**Traps** — **Do not collapse struck and deferred.** The distinction is the point, and both work
orders argue it explicitly. **Do not make the percentage rise by hiding things.** The goal is a
denominator that means something, not a bigger number; a reader who cannot find where the missing
work orders went will assume they were lost. **Do not touch `next` or the running order** — both
already omit these two, which is why the problem is arithmetic and not a stall. **Do not reverse
either decision**; a dispatch that re-argues whether pasting scores is worth building has failed this
work order. **Do not weaken the harness rule while fixing the sentence that overstates it** — the
fold-in narrows one word, and a dispatch that returns having decided its own green run may tick a
box has inverted the thing it was sent to correct. **Do not tick WO-2.32's 👤 line and do not change
what it asks** — repointing a check at a live shell is not running it, and only the teacher can run
it. **Do not touch a shell version inside a ticked 👤 line**; there it is a record of what was
tested, and editing one falsifies a result rather than fixing a pointer.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/work-orders/README.md`
  - `tools/README.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these — this work order is almost entirely about files describing themselves, so the
sources of truth matter more than usual:

- **`plans/work-orders/phase-3-grades.md` → WO-3.13**, and **`plans/work-orders/phase-2-attendance.md`
  → WO-2.7.** Read both notes before you design the status. They each argue the strike-versus-deferral
  distinction in their own words, and the work order's central Trap is that you must not collapse it.
  Whatever shape you pick has to be able to carry both facts *and their reasons*.
- **`plans/work-orders/phase-2-attendance.md:3214`** — the WO-2.32 👤 line itself. Read the whole
  work order around it so you can tell what the line is asking before you repoint it. The
  word-for-word constraint in Acceptance line 8 is exact: only the shell target changes.
- **`plans/ROADMAP.md`** — its dashboard, its Phase 2 row, and its **maintenance protocol**, which is
  the rule the counting change has to keep satisfying.
- **`AGENTS.md`, around line 64** — this is the *correct* copy for the harness sentence. `CLAUDE.md`
  moves toward it, not the reverse, and `CLAUDE.md` § How work is run here states the never-drift rule
  that this fold-in is settling.
- **`sw.js`** — for the current `CACHE` constant, which is the reading the repointed 👤 line should be
  asking a tester to *confirm* rather than a literal to match.
- **`plans/verification-tooling.md`** — why the harness is shaped the way it is, before you touch any
  sentence about what it can and cannot do.
- **`tools/wo-gate.mjs` in full**, including `--audit`, `--self-check` and `--list`. Three separate
  Deliverables land inside it and one of them (`--self-check`) exists specifically to plant violations
  of statuses the script knows about.

Two notes on Verification below. `verify-shell.mjs` takes roughly four minutes and this work order
ships **no app code**, so a green run is a no-change confirmation rather than a measurement of
anything you built — but run it, because that is exactly the claim Acceptance line 5 makes. And the
`CLAUDE.md` fold-in you are fixing is the evidence that a dispatch *can* run it: if it runs for you,
say so with its numbers; if it does not, that is an environment report and you say that instead.
Neither outcome lets a dispatch's green run close a 👤 box.

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

## 5. Done means these 8 lines, reported against one by one

1. `wo-gate.mjs --list` reports WO-3.13 and WO-2.7 as something other than `⬜ NOT STARTED`, and reports them differently from each other.
2. No dashboard in `plans/work-orders/README.md` or `ROADMAP.md` counts either one as outstanding work, and each file shows a reader that they exist and why they are out.
3. `node tools/wo-gate.mjs --audit` passes.
4. `node tools/wo-gate.mjs --self-check` passes, and plants a violation involving the new status.
5. `node tools/wo-sweep.mjs` totals are unchanged — this work order ships no app code.
6. Every row in `README.md` § The files matches the work orders in the file it names, checked against the tracker rather than by eye.
7. `CLAUDE.md` no longer states that `verify-shell.mjs` cannot run in a sandboxed agent, and says the same thing as `AGENTS.md:64`. A dispatch's green harness still closes no box in either.
8. `phase-2-attendance.md:3214` no longer sends a tester to `planbook-shell-v69`, and what it asks of that tester is otherwise **word for word what it was** — the line is still unticked and still refuses to ask whether a tone is audible. Every ticked 👤 line in the repository still names the shell it was actually run against.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.


---

## 6. CONTINUATION — appended 2026-08-16, second dispatch

**The first implementer died mid-run on an API session limit.** That is an infrastructure failure,
not a failure of the work and not a verdict on the draft. It had done substantial work and wrote
**no result file**, so by the project's own rule this is an **interrupted draft**: most of a good
implementation, checked by nobody. The claim was retaken out loud — `--release` then `--start`, now
`🤖 CLAIMED — 2026-08-16-cont`.

### Your first obligation

**Audit the draft line by line against the brief above before building on it.** Nothing in it has
been verified, including whether it stayed inside the **Out of scope** line. In your result file,
report **what you kept versus what you rewrote, and why** — that section is not optional, and a
continuation that silently absorbs the draft as its own is the failure mode this rule exists for.

Do **not** start from a clean slate and do **not** redo what already landed. `git stash`, `git
checkout --`, and any other discard of the working tree are off the table.

### The draft on disk (uncommitted, `main` at 1a6a614)

```
 plans/ROADMAP.md                                |  37 ++-
 plans/work-orders/README.md                     |  67 +++-
 plans/work-orders/phase-1-shell-store-roster.md |   2 +-
 plans/work-orders/phase-2-attendance.md         |  10 +-
 plans/work-orders/phase-3-gradebook.md          |   7 +-
 tools/wo-gate.mjs                               | 401 +++++++++++++++++++++++-
```

The design decision the first Deliverable asked for **was made**: two new statuses, `🚫 STRUCK` and
`⏳ DEFERRED`, kept distinct. Check that its argument is written down where a future reader finds it,
not only in a result file that no longer exists. If the reasoning is missing, that is yours to write.

### State against the 8 Acceptance lines, checked directly by the orchestrator

1. **DONE** — `--list` shows `WO-2.7  ⏳ DEFERRED` and `WO-3.13  🚫 STRUCK`. Distinct, and neither is
   `⬜ NOT STARTED`.
2. **LIKELY DONE, needs a hard look** — `--audit` prints
   `Phase 2  row 15/15  boxes 15/15  (+1 not coming, uncounted)` and `overall row 42/81`. Confirm both
   files also *show a reader* that these work orders exist and why they are out — the Deliverable is
   explicit that a number which rose because something was hidden is worse than the one it replaced.
3. **DONE** — `--audit` exits PASS.
4. **FAILING — this is the main piece of unfinished work.** `--self-check` reports
   `17 plants, 16 caught, 1 missed` and exits FAIL. The eleven new/adjacent plants pass, including all
   four about the new statuses. The miss is:
   `§ The files is checked against the files it names — a stale range, and a file with no row`, with
   `--audit exited 0 on a § The files row naming work orders its file does not hold` and
   `--audit did not name the stale row or the file it is wrong about`. So the **plant was written but
   the `--audit` check it is meant to trip either does not exist or does not fire on the fixture.**
   Fix the checker, not the plant — a plant deleted to make a suite go green is the exact defect
   `--self-check` exists to prevent.
5. **NOT RUN** — `wo-sweep.mjs` and `verify-shell.mjs` are both still owed. Report their real numbers.
6. **PARTIAL** — `--audit`'s § The files rows all read `ok`, but per line 4 that check does not catch a
   planted stale row, so it cannot yet be trusted. Line 6 closes when line 4 does.
7. **NOT STARTED** — `CLAUDE.md:168` still reads "cannot run in a sandboxed agent"; `AGENTS.md:65`
   still reads "usually cannot". The drift this fold-in exists to settle is entirely untouched.
   `AGENTS.md` is the correct copy; `CLAUDE.md` moves to it. Narrow the one word and **do not weaken
   the standing rule** — a dispatch's green harness still closes no box.
8. **NOT STARTED** — the unticked 👤 line is now at `plans/work-orders/phase-2-attendance.md:3222`
   (line numbers shifted from the 3214 in the work order text; verify before editing). `sw.js` is at
   `planbook-shell-v71`. Word for word what it was, except the shell target, and prefer wording that
   names the deployed build with the version as the reading to *confirm* rather than a literal to
   match — so it does not rot at the next `CACHE` bump.

   **Two judgment calls inside line 8, both yours:**
   - `phase-2-attendance.md:3208` also reads "`sw.js` — `planbook-shell-v69`." Decide under the work
     order's own ticked-versus-unticked rule whether that is a record of an environment a run actually
     happened in (leave it — editing it falsifies a result) or an instruction (repoint it). Say which
     you concluded and why.
   - The v69 mentions at `phase-1-shell-store-roster.md:1459` and `:1508` are **WO-1.21's own prose
     quoting the defect**. They must stay exactly as they are.

### Before you finish

**Check the diffstat before any commit.** A dispatch has silently rewritten a file to CRLF in this
repo before, and a five-figure line count for a small edit is the tell. Nothing is committed yet.
