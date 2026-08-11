# WO-2.6 — Attendance history & output · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.6-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, Opus tier**, on its own merits: this work order builds two
new *output* surfaces and two of its four Acceptance lines are disclosure guarantees
("Presentation-mode safe: no `supports` data on either surface"; "Neither surface emits
accommodation, medical, or plan data"), which `plans/work-orders/ROUTING.md` puts in the
never-delegated column beside presentation mode. It also establishes two conventions the app does
not yet have — there is no CSV export and no `@media print` block anywhere in `src/` today — and
"establishes a convention" is its own Claude trigger. The runner-up I set aside: the
percentage-agreement line and the CSV shape are mechanically checkable arithmetic riding on WO-2.4's
already-written formula, which reads Codex — but an export surface is exactly where a
plausible-looking implementation is a legal disclosure, and a work order routes as a whole. WO-2.6
is Ship 2, so the Ship 1 pre-routing table has no row to agree or disagree with.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.6 — Attendance history & output

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-11 · **Size** M · **Depends on** WO-2.4
**Closes roadmap** Phase 2 → "Per-student attendance history view" and "Print/CSV output for the
attendance record."

**Why it exists.** Cut from Ship 1 because the data is being recorded either way and the views can
follow. It becomes urgent the first time a guardian conference asks "which days?"

**Deliverables**
- Per-student history: every recorded meeting, its mark, and the running percentage, per term.
- Print view and CSV export of the attendance record for a class and term.
- Presentation-mode safe: no `supports` data on either surface.

**Acceptance**
- [ ] A student's history lists exactly the meetings counted in their percentage — the two agree.
- [ ] The CSV opens cleanly in a spreadsheet with dates as columns.
- [ ] The print view fits a class on a page and carries the class, term, and date range.
- [ ] Neither surface emits accommodation, medical, or plan data.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The arithmetic you must not re-derive — `src/attendance.js`.** WO-2.4 already wrote every count
and percentage this work order displays: `meetingRecords()`, `totalsFrom()`, `attendanceTotals()`,
`termTotals()`, `percentText()`, `countText()` (around lines 1071–1200), plus `totalsForRender()`
and `paintRenderedTotals()` around 3101–3365 for how the existing UI phrases them. **Acceptance
line 1 — "a student's history lists exactly the meetings counted in their percentage — the two
agree" — is a statement about a shared source, not about two implementations landing on the same
number.** Derive the history rows from the same record set those functions count. A second walk
over the year document with its own filter will agree on the fixture and disagree in November, and
that is precisely the failure the line was written to catch. If the existing functions don't expose
the row list you need, export one that does and have the totals path use it too — do not fork it.

**`src/supports.js` and `src/presentation.js` — and a trap in the Deliverables wording.**
Presentation mode owns no part of the visibility rule; `src/supports.js` is the single question
every surface asks, and `tools/wo-sweep.mjs` check 5b enforces that there is only one. But read
Deliverable 3 and Acceptance line 4 together before you build to either: "presentation-mode safe"
does **not** mean "hide support data while the toggle is on." Acceptance line 4 is absolute —
neither the print view nor the CSV emits accommodation, medical, or plan data **at all, in either
mode**. The correct implementation never puts that data on these surfaces in the first place, which
makes the presentation-mode line trivially true rather than conditionally true. An implementation
that gates it on the toggle has built a one-tap disclosure and will read as complete.

**`src/backup.js` — the existing convention for handing a file to the browser.** Read the
`<a download>`-over-a-blob-URL helper around lines 220–245 and the comment block above it. Two
things it already learned the hard way: revoking the object URL in the same task as the click
cancels the download, and an installed home-screen PWA gets structurally *one* download event. Match
that helper rather than writing a second one. Note also its split of "build the text" from "hand it
to the browser" — the text half has no DOM in it and can therefore be driven from
`tools/verify-shell.mjs`. Your CSV wants the same seam, because Acceptance line 2 is otherwise a
claim nobody can check without a spreadsheet.

**`docs/data-model.md`** — the accommodations rules, and the three attendance states. Everything
counts recorded meetings, never calendar days: a term's date range in the print header is a *label*,
not the denominator.

**Roadmap boxes this closes** — `plans/ROADMAP.md` lines 305 and 309, Phase 2. **`sw.js`** — sweep
check 9 fails a shell file added or changed without a cache bump; if you add a `src/` file, it goes
in the cache list and the version moves.

**On the print view (Acceptance line 3).** "Fits a class on a page" is a judgment call with a real
answer: five classes, rosters of ordinary size, a term's worth of meeting columns. Decide what
happens when the meetings outrun the page width and say what you decided in your result file. The
header carries class, term, and date range — that is what makes a printout that has left the
building still mean something at a conference table.

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

## 5. Done means these 4 lines, reported against one by one

1. A student's history lists exactly the meetings counted in their percentage — the two agree.
2. The CSV opens cleanly in a spreadsheet with dates as columns.
3. The print view fits a class on a page and carries the class, term, and date range.
4. Neither surface emits accommodation, medical, or plan data.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

