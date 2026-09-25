# WO-1.37 — the strip's other head is asserted nowhere, and no fixture can reach it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.37-result.md` — as your last act, and return it in-band too.

**Routing: Claude Opus.** The deciding signal is the Traps section: it is about judgment — choosing the mutation that proves *this* hole and not a different one (new checks red, WO-5.5's two head checks green), and asserting two absences off one boolean — and the harness sits on the Phase 5 send flow, which `ROUTING.md` lists as Claude-only territory. Runner-up set aside: the work is a mechanical harness addition that could look Codex-shaped, but the proof needs at least one clean run plus one mutation run of `verify-shell.mjs` (more if you verify twice), which leaves the 20-minute Codex cap little room, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.37 — the strip's other head is asserted nowhere, and no fixture can reach it

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-24 · **Size** S · **Depends on** WO-5.5 ✅ · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.36 made.
Booked 2026-08-29 by WO-5.5's own verifier, which found this and correctly declined to close it
inside the row that made it.)*

**Why it exists.** WO-5.5 made the send flow's block-strip head **conditional**, and that was the
right call: three of the four things that block a draft are not merge fields — a recipient with no
address, no message chosen, and *Copy me* with nowhere to copy to — so heading one of those
*"This draft has at least one undefined field"* would be the strip stating something false about the
draft. `src/outreach-view.js:504` reads
`blockHead(fields ? UNDEFINED_FIELD_HEAD : 'This draft cannot be sent', …)`. **The true arm is
asserted whole in both harnesses and the false arm is asserted nowhere:**
`grep -rn "cannot be sent" tools/verify/` returns nothing at all.

**And it is not an assertion somebody forgot — the fixture cannot express the failure.** Every
blocked draft `tools/verify/outreach.mjs` builds carries a merge field, so `fields` is `true` on
every strip the harness has ever read. An edit that made the head unconditional stays green at
1265 checks while telling a teacher whose only fault is a missing guardian address that her draft
has an undefined field. **That is the exact falsehood the ruling exists to prevent, and the ruling is
a comment.** `paintBlock()` argues it at its own point of departure, at length, and nothing pays for
it.

**It is WO-1.33's defect a third time, and WO-1.36's shape a second.** There the fixture student was
*narrow, not vacuous*; in WO-1.36 the fixture rows are *adjacent, not absent*; here every fixture
draft is *blocked the same way*. All three are an instrument whose fixtures agree with each other,
which is still the shape to go looking for next.

**The shape to build.** One fixture draft that is **blocked with no `kind: 'field'` reason on the
list**, and the head read off the DOM. Three routes exist and the implementer picks one and says
which:

- **A recipient with no address.** A template whose body resolves fully for the fixture student, and
  a chosen recipient carrying a name and no `email` — `kind: 'recipient'`. *(**How you reach it
  changed on 2026-09-20 and the route did not close** — WO-5.8, whose fourth Acceptance line asked
  for a decision and got *genuinely unchoosable*: an addressless recipient is now refused at the
  chip, so **tapping her no longer blocks anything**. The reason is still built and still reachable,
  by the state it was always really about — a student with **nobody addressable on her roster entry
  at all**, who opens on somebody with no address because `openOutreach()` falls back to the first
  row. `tools/verify/outreach.mjs` drives exactly that at the foot of its section, on the fixture's
  Cal, and it has to blank `teacher.adminEmail` first or the *Admin* row has an address and the
  draft is ready. Lift that fixture rather than re-deriving one.)*
- **No template offered for the pair.** `templateId = offered[0].id` on open, so this needs a
  tone/audience pair with nothing saved — `kind: 'template'`.
- **`Copy me` on with no address in Your details** — `kind: 'cc'`.

**Out of scope.** `tools/verify/templates.mjs` and the preview. `src/templates-view.js:540` has no
other arm — a template preview blocks on fields and on nothing else, so its blocked head is
`UNDEFINED_FIELD_HEAD` unconditionally and there is no second sentence there to reach. Also out of
scope: `src/`. This is an instrument that cannot see a branch, not a branch that is wrong; if the
build finds a `src/` change is needed, that is a finding to hand back rather than a file to open.

**Traps**

- **Do not relax the two checks that already exist.** They assert the new head **whole and
  anchored**, sentence and count together, because WO-5.5's Traps line forbids the substring. A new
  check is added beside them; neither is edited to make room.
- **The mutation has to be the one that proves this hole and not a different one.** Making the head
  unconditional — `blockHead(UNDEFINED_FIELD_HEAD, …)` for every blocked draft — must turn the
  **new** check red and leave both existing head checks **green**. A mutation that reddens all three
  proves the harness reads a head, which was never in doubt.
- **The instruction row has the same hole and rides on the same boolean.** `FIELD_FIX_SENTENCE` is
  appended under `if (fields)`, so a strip with no field on it must be asserted to carry **neither**
  the undefined-field sentence nor the instruction. One mutation can pay for both claims; two
  assertions are still needed, because an absence that is never asserted is not a check.
- **The teardown counts.** Whatever the fixture plants — a template, a recipient with no email, a
  cleared address in Your details — comes back off, or the foot check goes red on a run that was
  otherwise fine.
- **`tools/README.md`'s mutation table is where this is recorded**, beside the WO-5.5 row at ~1192
  that already names the head and `FIELD_FIX_SENTENCE`.

**Acceptance**
- [ ] A fixture draft in `tools/verify/outreach.mjs` is blocked with **no `kind: 'field'` reason on
      the list**, and the check's own text names which of the three non-field reasons it used.
- [ ] That strip's head is asserted **whole and anchored** —
      `This draft cannot be sent · N thing(s) to fix` — and the sentence `UNDEFINED_FIELD_HEAD`
      carries is asserted **absent** from it.
- [ ] `FIELD_FIX_SENTENCE` is asserted absent from the same strip.
- [ ] Making the head unconditional turns the new checks **red** and leaves WO-5.5's two existing
      head checks **green**, recorded in `tools/README.md`'s mutation table.
- [ ] `node tools/verify-shell.mjs` is green with its count up by the number of checks added, and
      `node tools/wo-sweep.mjs` is green with `tools/README.md`'s call-site count recomputed by it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/outreach-view.js`
  - `src/templates-view.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/outreach.mjs`
  - `tools/verify/templates.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Orchestrator notes — pointers and traps, not a walkthrough.**

- **The line numbers in the work order have drifted.** The conditional head is now at
  `src/outreach-view.js:903` (`blockHead(fields ? UNDEFINED_FIELD_HEAD : 'This draft cannot be sent', …)`),
  and the instruction row at `:935` (`if (fields) host.append(… FIELD_FIX_SENTENCE)`). Both constants
  come from `src/block-strip.js` — read it for the exact sentence text and the ` · N thing(s) to fix`
  composition.
- **The fixture the work order says to lift already exists**: the WO-5.8 block near the foot of the
  outreach section in `tools/verify/outreach.mjs` (~lines 2870–2930) opens Cal Wo53Orphan with
  `teacher.adminEmail` blanked, and asserts `kinds` *contains* `'recipient'`. It does **not** assert
  that `'field'` is *absent* from `kinds`, and it does not read `d.head`. Your first job is to confirm
  that Cal's draft really carries no `kind: 'field'` reason (if the seeded template has a field Cal
  cannot resolve, this route does not work as-is — say so and pick another route or template).
  `drawn()` (~line 152) already reads `.mf-block-head`.
- **The existing head checks are at ~line 1176** (anchored regex on
  `This draft has at least one undefined field · N thing(s) to fix`) and its sibling. Do not edit
  them. Add new checks beside the Cal block, not by widening the existing Cal check.
- **Mutation discipline** (`AGENTS.md`): mark any mutation with a `MUTATION` comment, revert it
  before writing anything else, and run `grep -rn MUTATION src/ tools/` after reverting. Five dead
  dispatches in this project left live mutations in the tree. Stage or note your own edits before any
  `git checkout` used to revert, or you will revert them too. The mutation is in `src/` for the
  duration of one run only — the work order's "no `src/` change" rule means none may survive.
- **Counts:** `verify-shell.mjs` prints its total; record the before and after. `wo-sweep.mjs` checks
  the `check()` call-site count in `tools/README.md` — update it to what the sweep computes, which is
  the one sweep line that goes red on work being done rather than wrong.
- **You may tick** Acceptance lines your own runs closed. None of this work order's lines carry 👤 or
  📆. Do not touch `CHANGELOG.md`.

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

1. A fixture draft in `tools/verify/outreach.mjs` is blocked with **no `kind: 'field'` reason on the list**, and the check's own text names which of the three non-field reasons it used.
2. That strip's head is asserted **whole and anchored** — `This draft cannot be sent · N thing(s) to fix` — and the sentence `UNDEFINED_FIELD_HEAD` carries is asserted **absent** from it.
3. `FIELD_FIX_SENTENCE` is asserted absent from the same strip.
4. Making the head unconditional turns the new checks **red** and leaves WO-5.5's two existing head checks **green**, recorded in `tools/README.md`'s mutation table.
5. `node tools/verify-shell.mjs` is green with its count up by the number of checks added, and `node tools/wo-sweep.mjs` is green with `tools/README.md`'s call-site count recomputed by it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

