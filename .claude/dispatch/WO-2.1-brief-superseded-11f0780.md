# WO-2.1 — Attendance marking screen · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.1-result.md` — as your last act, and return it in-band too.

**Routing decision.** This came to Claude at **Opus** tier on its own merits, not by Codex fallback:
it hits four Claude triggers at once — size `L`, 🚩 go-live blocker, it establishes the marking-screen
convention that WO-2.2, WO-2.3 and WO-2.5 will each copy, and its Traps section is judgment rather
than mechanics. The runner-up consideration set aside was that the *storage* shape is fully specified
in `docs/data-model.md`, which is the strongest Codex argument available here — but the spec covers
the document, while the deliverable that matters is a speed-of-use design problem measured in seconds
on an iPad, and nothing in a schema says how to lay out five class cards so the third state is
readable at a glance. The Ship 1 pre-routing table agrees (row 11, Claude).

**One process note.** Work on the branch you find yourself on (`phase/1-shell-store-roster`). The
phase file names `phase/2-attendance`, but cutting that branch is a decision about when Phase 1
merges, and it belongs to the teacher — do not create or switch branches.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.1 — Attendance marking screen

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** L · 🚩 · **Depends on** WO-1.7, WO-1.10
**Closes roadmap** Phase 2 → "Marking screen, exceptions-only", "Marks `P / T / A / E / D`",
"One-tap drop", "Three distinct states per class per day"

**Why it exists.** This is the critical-path flow — it runs while students walk in, and it is the
one thing the owner does every single class period. It is also *the riskiest thing on day one*: a
live term of attendance in a three-week-old app.

**Deliverables**
- The day loads showing **all classes**, each in one of three states: **taken · dropped · not taken
  yet**. The third is not the second, and the distinction is visible at a glance.
- Exceptions-only marking: present is the default and is not stored. You tap the absences and
  tardies. A class of 25 with two absences is two entries in the document, not 25.
- Marks `P / T / A / E / D`, using Roll Call!'s vocabulary so the owner's habits carry over.
- **One-tap drop** on a class that didn't meet — writes
  `{ classId, date, exception: "dropped" }` and the class is done. No setup, nothing to maintain
  when the rotation shifts.
- Un-drop, and un-mark, without leaving the screen.
- Storage exactly per [`../../docs/data-model.md`](../../docs/data-model.md): one record per class
  per date; `marks` holding only exceptions; `exception` present means the class did not meet.
- The home-screen card slot from WO-1.10 filled with today's state per class, each with a one-tap
  fix.

**Out of scope** — percentages (WO-2.4), the keyboard path (WO-2.5), history views (WO-2.6).

**Acceptance**
- [ ] A mark lands and survives a reload. *(One of the three things that must be right before
      students walk in.)*
- [ ] A dropped class and an untaken class are visually distinguishable without reading fine print,
      and are distinguishable in the stored document.
- [ ] Marking a class taken with zero exceptions still creates a record — otherwise "taken with
      everyone present" is indistinguishable from "forgot."
- [ ] One tap drops a class; one tap undoes it.
- [ ] Taking attendance for a class of 25 with two absences takes under 15 seconds on an iPad.
- [ ] All five marks are reachable without a submenu.
- [ ] The document after a full day of five classes contains no `P` entries.

**Traps** — Storing `P` for present will pass every test here and quietly triple the document. The
absence of a mark *is* the mark. And do not add a "submit"/"finalize" step: a mark is saved when
tapped, because the teacher will be interrupted mid-class.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and each for a specific reason:

- **`plans/rotating-schedule.md` — read this before you write a line.** The phase file makes it a
  precondition for *everything* in Phase 2, and it is a decision record: there is no schedule object,
  no cycle, no rotation, no meeting pattern. A cycle model was designed and deleted the same day. Its
  § "The flow" and § "Precedence" are the specification for the three states, and § "Consequences
  elsewhere" tells you what later phases are relying on you not to invent.
- **`src/home.js` — the slot is already cut for you.** Its header comment reserves
  `.class-card-state` with the note *"WO-2.x — whether today's attendance is taken, dropped, or not
  taken yet"*, and `src/home.css` already carries the card height so your line drops in without
  reflowing the grid. Fill the slot; do not restructure the card. The same header states there is
  deliberately no second answer to "which class is open" — do not add one.
- **`src/roster.js` and `src/classes.js`** — the convention for a class-scoped screen: how a view
  registers with `src/shell.js`, how it reads and writes through `src/store.js`, how it uses
  `src/save-indicator.js` and `src/live-region.js`. Match the established pattern rather than
  choosing a new one.
- **`src/store.js`** — every save is debounced. Trap 6 in the `tools/README.md` section above is
  about exactly this and it cost three runs at WO-1.6 to see; `await window.planbook.store.flush()`
  before any reload in a check.
- **`docs/data-model.md`** lines 110 and 152–155 — the `attendance[]` shape and the two sentences
  that say present is the absence of a mark and there is no schedule model.
- **`src/presentation.js`** — attendance screens get projected onto classroom walls. Nothing you add
  may put `supports` / accommodation data on this surface, and presentation mode must still behave.
- **`design/style-guide.md`** for the mark buttons, and Roll Call!'s `design/portable-components.md`
  (`C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App`) before hand-designing a
  control. Roll Call! is also where the `P / T / A / E / D` vocabulary comes from — the point of
  reusing it is that the owner's habits carry over, so match its letters and its meanings.
- **`TESTING.md`** — add the manual lines this screen needs. The 15-seconds-on-an-iPad acceptance
  line is a 👤 line: it needs a real iPad and a stopwatch, and you may not tick it.

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

## 5. Done means these 7 lines, reported against one by one

1. A mark lands and survives a reload. *(One of the three things that must be right before students walk in.)*
2. A dropped class and an untaken class are visually distinguishable without reading fine print, and are distinguishable in the stored document.
3. Marking a class taken with zero exceptions still creates a record — otherwise "taken with everyone present" is indistinguishable from "forgot."
4. One tap drops a class; one tap undoes it.
5. Taking attendance for a class of 25 with two absences takes under 15 seconds on an iPad.
6. All five marks are reachable without a submenu.
7. The document after a full day of five classes contains no `P` entries.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.


---

## 6. ADDENDUM — this is a resume, not a fresh start (added by the orchestrator)

The first dispatch against this brief was cut off by an API session limit. **A draft is already on
disk and nothing about it has been checked**, including whether it stayed inside the work order's
Out of scope line. Treat it as an unverified draft: do not delete it (it may be most of a good
implementation) and do not trust it (nothing has graded it).

**Audit the draft line by line against this brief before building on it, and report what you kept
versus what you rewrote, and why.**

What is on disk, uncommitted, at `HEAD = aeaa7ac "Merge Phase 1 — shell, store, roster"`:

- **Untracked, new:** `src/attendance.js` (659 lines), `src/attendance.css` (172 lines)
- **Modified:** `index.html`, `src/home.css`, `src/home.js`, `src/roster.js`, `src/shell.js`,
  `sw.js`, `tools/verify-shell.mjs`

Where the two harnesses stand, measured on the draft:

- `node tools/wo-sweep.mjs` — **green.** 11 checks, 10 pass, 0 fail, 1 standing review item
  (the sensitive-field-name grep, which is a read-and-confirm, not a verdict).
- `node tools/verify-shell.mjs` — **259 checks, 245 pass, 14 fail.** The 14 are the attendance
  block, and they look like a harness edit that was interrupted rather than an app defect, because
  several print evidence that matches their own claim while still failing. Specifically:
  - The first attendance check asserts **six** untaken classes on an unmarked day; the fixture
    builds **five**, and the document already holds **one** attendance record where the check
    expects zero.
  - Downstream checks index `records[0]`, which then resolves to that stale record rather than the
    one under test — so, for example, *"P un-marks a student"* reports
    `marks {"s_v1":"T"} -> {"s_v1":"T"}` when it expected a 3-key record dropping to 2.
  - The transcript of the interrupted run ends on *"Now add the coarse-pointer measurements for the
    attendance controls to the touch section"* — that work may be partly or wholly absent.

**Reconcile the fixture and the checks; do not weaken a check to make it pass.** Several of these
assertions are the strongest evidence in the work order — the no-`P` claim, the un-mark round trip,
the three-state distinction. `tools/README.md` trap 5 and trap 7 are both about exactly this
temptation, and both say the check goes green while measuring nothing. If a check is wrong, fix the
check and say so; if the app is wrong, fix the app.

Both harnesses must be green before you report, and `tools/README.md`'s check-count line must carry
the **measured** number.
