# WO-1.73 — the sync button stands on its own at phone width, if the row now has room · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.73-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override) — routed on its own merits, not by fallback. The deciding signal is that the outcome turns on a judgment threshold the Traps refuse to make mechanical (*"a fit by a pixel is not a fit"*), and a fit reverses WO-7.5's ruling 2 across comments in four files and owes `TESTING.md` and `CHANGELOG.md` prose (ROUTING § Claude, the prose and judgment-Traps bullets). The runner-up — Codex, because the measurement itself is mechanical — was set aside for that reason; no probe was run.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.73 — the sync button stands on its own at phone width, if the row now has room

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-10 · **Size** S · **Depends on** WO-1.71 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-10.)*

**Booked 2026-10-10**, owner-directed, out of the same conversation as WO-1.71. WO-7.5's ruling 2 took
the sync button off the top row below 640px because the row had **5.92px** of slack at 390px after its
fourth control, and moved its badge onto About. WO-1.71 takes a 44px control out of that row. Whether
that buys the sync button back is a measurement, not a drawing — which is why this is its own row.

**Rulings, the owner's, 2026-10-10**
1. **Measure first.** At 390×844 under a coarse pointer, with WO-1.71 landed, the top row's slack is
   read by the harness and printed.
2. **If a 44px control and its gap fit, the sync button lays out at every width** and the About badge
   is retired — `#aboutSyncBadge`, its CSS and its label branch in `src/sync-button.js`. That
   **reverses WO-7.5's ruling 2**, and the comments that state it say so.
3. **If it does not fit, nothing changes**, and the work order closes on the number with WO-7.5's
   ruling 2 standing.

**Deliverables**
- **The measurement**, printed by `tools/verify/sync-button.mjs` and quoted in `TESTING.md`.
- **Under ruling 2 only**: `src/shell.css`'s 640px block, `src/sync-button.js`, `index.html`'s About
  badge, and `tools/verify/sync-button.mjs` and `drive-sync.mjs`, whose checks assert the fallback.
- **`TESTING.md` § WO-1.73**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped** if anything
  in `SHELL` moved.

**Acceptance**
- [ ] The top row's slack at 390×844 under a coarse pointer, with an opted-in device, is printed by
      the harness and quoted in `TESTING.md`.
- [ ] Either the sync button is laid out at 390px with no horizontal overflow and About carries no
      badge at any width, or nothing changed and the number shows why.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-1.73 carries these lines verbatim with the evidence for each.
- [ ] 👤 On the iPad in split view at phone width, or a phone, after a force-quit: read the top row
      with sync opted in.

**Traps** — **The title steps aside below 640px** (`src/shell.css`'s 640px block), and that is what
the slack is measured against; do not take it from a desktop width. **A fit by a pixel is not a fit**:
the teacher's name on the second line is teacher-typed, and the harness measures the row's own box,
not the text in it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/shell.css`
  - `src/sync-button.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/sync-button.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `index.html` — the header's top row (~lines 345–460): the sync button, About, `#aboutSyncBadge` at ~423, and the gear WO-1.71 added. Read WO-1.71 in the same phase file first: **its** landing is what changed the row, so the slack figure in `src/shell.css`'s 640px block (5.92px, ~line 2551) is stale until you re-measure it.
- `tools/verify/drive-sync.mjs` ~line 1192 — asserts the About badge; it moves under a fit.

**Traps this brief adds.**
- **"Ruling 2" names two different rulings in these files.** WO-7.5's ruling 2 is the sync-button fallback this work order may reverse; WO-1.71's ruling 2 (the gear, `index.html` ~452) and others are unrelated. Edit only comments that state WO-7.5's.
- **Measure first, decide second, and write the number down before you touch layout.** The first Acceptance line is owed on both outcomes. Define the margin you count as a fit in `TESTING.md` and say why, given the Trap about the teacher-typed name — do not leave "fits" as whatever the number happened to be.
- **Under a fit, the badge retirement is a deletion across markup, CSS, JS and two harness files** — grep `aboutSyncBadge`, `hdr-about-badge` and `ABOUT_BADGE_ID` to zero (outside history prose), and re-check the presentation-mode and signed-out paths the existing checks cover rather than deleting those checks wholesale.
- **`CACHE` in `sw.js`** only if a `SHELL` file moved; under "nothing changed" none should have, and the measurement lives in the harness.
- If you mutate to prove a check, mark it `MUTATION` and revert it before writing anything else.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

1. The top row's slack at 390×844 under a coarse pointer, with an opted-in device, is printed by the harness and quoted in `TESTING.md`.
2. Either the sync button is laid out at 390px with no horizontal overflow and About carries no badge at any width, or nothing changed and the number shows why.
3. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
4. `TESTING.md` § WO-1.73 carries these lines verbatim with the evidence for each.
5. 👤 On the iPad in split view at phone width, or a phone, after a force-quit: read the top row with sync opted in.

**Write `TESTING.md` § WO-1.73 — it is a deliverable, not a permission.** Add `### WO-1.73 — the sync button stands on its own at phone width, if the row now has room` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.73` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

