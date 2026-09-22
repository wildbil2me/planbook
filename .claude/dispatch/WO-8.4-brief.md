# WO-8.4 — Print stylesheets · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.4-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override). The deciding signal is the sensitive surface:
the fourth deliverable applies presentation-mode rules to print and Acceptance 3 is "no accommodation,
medical, or plan data in any printout" — ROUTING.md § Route to Claude, bullet 1, never delegated.
Runner-up set aside: it is Size S and CSS-shaped, which reads Codex, but the sensitive surface is
disqualifying on its own and ties go to Claude.

**Resuming?** Read `.claude/dispatch/WO-8.4-status.md` first. On any death, `grep -rn MUTATION src
index.html tools` is the first move — before reading prose.

**The owner edited the work order before this dispatch** (uncommitted in `plans/work-orders/phase-8-packaging.md`
— the 2026-09-21 correction paragraph and the seven **Rulings**). That text is the work order. Do not
revert it; commit nothing unless your normal procedure does, and never discard that hunk.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.4 — Print stylesheets

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-21 · **Size** S · **Depends on** WO-2.6, WO-3.9
**Closes roadmap** Phase 8 → "Print stylesheets for every printable surface."

*(**This read `**Ship** 2` for one commit on 2026-08-19 and was corrected the same day** — WO-1.24,
`d4eeafb`, and its own § Correction. The argument for moving it was that its fourth Acceptance box and
[WO-G2](gates.md#wo-g2--ship-2-gate-first-grades)'s fifth are the same check, so landing this after the
first hand re-key of five classes would cost a second one. **The check was already closed.**
[WO-3.9](phase-3-gradebook.md#wo-39--grades-print--csv) is where the SIS ordering was decided — the
owner answered it on 2026-08-12, it is recorded in that work order so a verifier need not trust the
builder's memory, and on 2026-08-13 the owner printed the sheet and confirmed it against the live SIS.
**Nothing here reorders anything**; the deliverables below are chrome, a header, a modal gate and a
presentation-mode rule. There was no second re-key to buy back.)*

*(**And it cannot close yet, which the move would have made a landed debt.** The first deliverable
names four print surfaces and* **calendar month is not built** *—* [WO-6.3](phase-6-calendar-glance.md)
*is `⬜ NOT STARTED` and `src/calendar.js` is the event model only, no DOM.* **This is not written
as a dependency and should not become one** *— WO-6.3 gates one surface of four, and a `Depends on`
token would hold the whole work order behind Phase 6. A `**Waits on**` field was tried here and taken
back out: `wo-gate.mjs` reported it as a header field nothing reads, and teaching the tracker a fourth
kind of wait is its own work order rather than a line in a correction.*
**Three of the four already have `@media print` blocks** — `src/attendance.css`, `src/detail.css`,
`src/scores.css`, plus one in `src/assignments.css` — because print accreted per work order and
[WO-2.25](phase-2-attendance.md#wo-225--the-print-gate-is-answered-when-it-is-read-on-every-surface)
centralised the mechanism in `src/print-gate.js`. What is genuinely undone is `#printHeader`, which
`grep` finds nowhere outside comments, the calendar surface, and the sweep itself.)*

*(**Corrected 2026-09-21, before dispatch: the paragraph above is stale on the calendar.**
[WO-6.3](phase-6-calendar-glance.md) has been ✅ DONE since **2026-08-19**, the same day that
paragraph was written. The month is built, and `src/calendar-view.css` carries its own `@media print`
blocks, so **all four surfaces exist and all four are in scope**. Nothing here waits on Phase 6.
The rest of the paragraph still holds: `#printHeader` is still the undone part, and a grep of `src/`
and `index.html` still finds no element carrying it.)*

**Deliverables**
- `@media print` on every printable surface: gradebook, attendance record, student detail,
  calendar month.
- App chrome hidden; the hidden `#printHeader` becomes visible to title the printout.
- `body[data-modal-print]` to print a single modal, per the style guide.
- **Presentation-mode rules apply to print unconditionally** — a printout left on a desk is the same
  disclosure as a projected screen, and there is no toggle to remember.
- **Surface:** [`design/mockups/print.html`](../../design/mockups/print.html), drawn 2026-09-21 — all
  four sheets as they print today, with `#printHeader` drawn on top of each (`proposed-phase8.css`
  § PRINT HEADER). **Read it before building.** Its seven amber `ASK` notes were answered by the owner
  on 2026-09-21, and the answers are the rulings below. **Where the drawing and this list disagree,
  this list wins**: the amber stays on the page as the record of what was asked.

**Rulings** *(the owner, 2026-09-21, one per `ASK` on the drawing, in page order)*
1. **One shared `#printHeader`.** It is the single hidden element in `index.html` that the style
   guide names, filled from whichever surface is printing, and each surface's own head is hidden
   under its gate. `src/attendance-report.js`'s "it is the same element on screen" argument is heard
   and overruled for print. Say so at that header rather than deleting the comment.
2. **A continuation line at the forced breaks is enough.** Use `.print-header-running` at the two
   breaks the app forces: the attendance record's day-by-day slice and the grade sheet's slices.
   **No true running header on every page.** The `position: fixed` plus reserved-margin route stays
   refused for the reason the drawing gives: Chrome and Safari disagree enough to print a header
   over a long roster's first row.
3. **The grade sheet's letter scale goes in the header**, at the top, because the owner reads it
   off the sheet while typing into the SIS. It moves out of the foot, where the drawing shows it.
4. **The month prints landscape**, and only the month: `@page calendar { size: landscape }` with
   `page: calendar` on the view. The other three sheets stay portrait. Safari on the iPad ignores
   named pages, so there the teacher turns the preview by hand. That is an accepted limit, not a
   defect to chase.
5. **The calendar's band follows the drawing's rule.** The class slot prints the filter as words
   ("All five classes"). With one class it reads like the other three sheets
   (*English III — Period 2*). The term prints only when every class showing has the same one.
6. **One belt, in `src/shell.css`.** An ungated `@media print` that hides every support indicator
   in the app whatever the mode, so a plain Ctrl+P from a screen that is not a print surface (the
   roster) prints no `.support-dot`. The per-screen hide-only rules in `src/assignments.css` and
   `src/calendar-view.css` may stay as defence in depth, or fold into the belt if they become
   redundant. The implementer decides, and writes down which at the belt.
7. **`body[data-modal-print]` is met by the four per-surface gates in `src/print-gate.js`**, which
   is the owner's ruling rather than new code. That file's header explains why one shared attribute
   would print the wrong surface. The deliverable is discharged in a better form. Do not build the
   style guide's single gate beside it, and note the ruling at the top of `src/print-gate.js`.

**Acceptance**
- [ ] Each printable surface produces a clean page with a title, class, term, and date.
- [ ] No app chrome, navigation, or button appears in any printout.
- [ ] No printout contains accommodation, medical, or plan data, regardless of presentation-mode
      state.
- [ ] The gradebook printout is ordered to match the SIS entry screen (WO-3.9).

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/print.html`
  - `src/assignments.css`
  - `src/attendance-report.js`
  - `src/attendance.css`
  - `src/calendar-view.css`
  - `src/calendar.js`
  - `src/detail.css`
  - `src/print-gate.js`
  - `src/scores.css`
  - `src/shell.css`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `design/mockups/proposed-phase8.css` § PRINT HEADER, and `design/mockups/PROTOCOL.md` § "When
  the drawing lands" + rule 4/5 — lifting `.print-header*` into `src/` makes that section **landed**:
  amend its banner in the same sitting, or `wo-sweep.mjs` § 19 (rule 5: a pending section styles no
  class `src/` already styles) goes red. If you rename a drawn class, say so there.
- The per-surface JS that registers each gate and draws each surface's own head:
  `src/attendance-report.js`, `src/grades-report.js`, `src/detail.js`, `src/calendar-view.js`
  (its print block around lines 60–140 and `printCalendar()`), and `src/shell.js` (the delegated
  click handler that reads `<body>` — the stuck-attribute scar in `src/print-gate.js`'s header).
- `src/supports.js` — the one place `presentationMode()` and support suppression are defined.
- `design/style-guide.md` — its `#printHeader` / `data-modal-print` idiom (ruling 7 discharges the
  latter; ruling 1 adopts the former).

**Traps the orchestrator is naming, because the work order does not:**
- **Most of this is already built.** Four surfaces have gated `@media print` blocks today. Read the
  code before writing any; the undone parts are `#printHeader` (none exists in `index.html`), the
  continuation line, the letter-scale move, the month's named landscape page, the `shell.css` belt,
  and the two header comments rulings 1 and 7 ask for. Do not rebuild the gates.
- **Every rule stays gated** except the ruling-6 belt, which is ungated on purpose. `#printHeader`
  visibility must sit under the surface gates (or an equivalent), so a Ctrl+P from the roster does
  not print an empty header band. Any click-hook attribute must never equal a gate attribute.
- **Ruling 5's "All five classes" is the drawing's fixture, not a string** — nothing may assume a
  fixed class list (CLAUDE.md, Working agreements). Derive the words from the filter/class count.
- **Filling the header is not a second opinion on presentation mode.** Title, class, term and date
  only — no student, support, or review-date content goes into `#printHeader`. Suppression of
  support data stays defined in `src/supports.js`; do not add a `presentationMode()` asker to
  `src/calendar-view.js` (CLAUDE.md, the WO-6.3 note — `wo-sweep` counts the askers).
- **Ruling 3 moves the letter scale**; WO-3.9's SIS row order (Acceptance 4) must not move with it.
  Prove the order is unchanged, do not re-derive it.
- **Bump `CACHE` in `sw.js`** — `index.html` and every `src/` file in `SHELL` count.
- **Printed output is partly 👤.** Headless Edge can assert computed `display`, text content and
  `@page` rules under emulated print media; it cannot see Safari ignoring named pages or a real
  sheet. Say which Acceptance evidence is harness and which is owed to a human; do not tick a line
  whose evidence is a stylesheet read. `verify-shell.mjs` is ~4.4 min a run.
- **Mutation round**: if you mutate to prove a check bites, mark it `MUTATION` in a comment and
  revert it before writing anything else — a dead run with a live mutation is this repo's worst
  corpse (WO-5.1, WO-5.3, WO-5.4).

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

## 5. Done means these 4 lines, reported against one by one

1. Each printable surface produces a clean page with a title, class, term, and date.
2. No app chrome, navigation, or button appears in any printout.
3. No printout contains accommodation, medical, or plan data, regardless of presentation-mode state.
4. The gradebook printout is ordered to match the SIS entry screen (WO-3.9).

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

