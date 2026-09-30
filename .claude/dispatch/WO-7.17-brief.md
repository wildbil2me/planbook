# WO-7.17 — a first sign-in from the Drive door is announced as a reconnect · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.17-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override) — on its own merits: it is Phase 7 sign-in code (`ROUTING.md` names all of Phase 7 Claude-only), its deliverable is a sentence a teacher hears, and its Traps are about gesture timing rather than mechanics. Runner-up set aside: XS and mechanically checkable looks Codex-shaped, but red-on-HEAD + green + mutation + a whole-harness run is 3–4 full `verify-shell.mjs` runs at ~4.4 min, which crowds the 20-min cap before any reading; that would make it Sonnet at most, and the Claude column already decides Opus.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.17 — a first sign-in from the Drive door is announced as a reconnect

**Ship** 4 · **Status** 🤖 CLAIMED — 2026-09-30 · **Size** XS · **Depends on** WO-7.9 — the first-run Drive door that reaches `reconnect()`
**Closes roadmap** *(no box. A wording defect in WO-7.9's door, found by its implementer and booked by the owner.)*

**Booked 2026-09-28**, owner-directed, from WO-7.9's result and the maintenance check after WO-7.16
closed. WO-7.9's implementer named it and left it, because the function is shared and the sentence
is heard, not seen (`TESTING.md` § WO-7.9, "Two things for whoever reads the policy next").

**What is wrong.** *Open from Google Drive* signs in through `auth.reconnect()` (`src/first-run.js`
~221), because that is the call that asks Google inside the tap. `reconnect()` ends by announcing
**"Reconnected to Google Drive."** (`src/auth.js` ~648) on every success. Its other caller, the
header's sync button, is only drawn on a device that has connected before, so the verb was right
until WO-7.9 gave it a caller on a device that never connected. A teacher using VoiceOver on a new
iPad hears that she has *re*connected to something she is connecting to for the first time.

**Why it matters.** Small, and screen-reader only, but it is the first thing the app says to her
about Google on that device, and it says something untrue. No data is at risk.

**Deliverables**
- **A first sign-in is announced as one.** On a device that was not connected before the tap, the
  success sentence does not say *Reconnected*; the header button's reconnect keeps its sentence. How
  `reconnect()` tells the two apart is the implementer's call, argued at the function. The opt-in as
  it stood *before* the tap is the obvious test, because a successful sign-in sets it.
- **A harness check in `tools/verify/first-run.mjs`**: take the Drive door on a fresh device and
  assert the live region does not say *Reconnected*. Beside it, a check that the header button's
  reconnect still does. The first must be red on `HEAD`.
- **Bump `CACHE` in `sw.js`.**

**Acceptance**
- [ ] The new check is red on `HEAD` and green with the change, with both runs recorded in
      `TESTING.md` § WO-7.17.
- [ ] Mutation-proved: make the sentence unconditional again and the new check goes red. **The
      mutation is reverted before anything else is written** (`AGENTS.md`).
- [ ] The header button's reconnect still announces *Reconnected to Google Drive.*
- [ ] The whole browser harness shows no new failure.

**Traps** — **Do not move the request.** `reconnect()` reaches `requestAccessToken()` before its first
`await`, which is what keeps Google's window inside the tap on the iPad (WO-7.5's first Trap); any
test for the first sign-in is read before or after that call, never ahead of it with an `await`.
**Do not route the door through `connect()`** to get its wording: `connect()` spends the gesture on a
silent attempt first, which is the bug WO-7.4's last reading found. **Words only**: nothing about
when Google is asked changes, so the privacy documents need no edit.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/auth.js`
  - `src/first-run.js`
  - `tools/verify/first-run.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/sync-button.js` ~376–410 — the header's tap into `reconnect()`; its sentence must stay *Reconnected to Google Drive.*
- `tools/verify/sync-button.mjs` ~1128 — where the header reconnect is already driven; the companion check can sit in `first-run.mjs` per the Deliverable, but may borrow this setup.

**Pointers and traps the work order does not spell out (orchestrator, from reading the tree):**

- `src/auth.js` already holds `let syncOptedIn` (~178–191), set by `noteSyncOptIn()` from `src/sync-button.js`. That is *told, not read*: **do not import `src/prefs.js` into `src/auth.js` and do not read `planbook_driveSyncOptIn` from storage there** — the block explains why (`auth.js` imports `live-region.js` and nothing else). Capture the value **synchronously, before the `await asking`**, so a successful sign-in that flips the opt-in cannot change the sentence. Check whether `noteSyncOptIn()` is actually called before the Drive door's tap on a fresh device; if it is never called there, `false` is the honest reading — say so at the function.
- The `ask()` / `requestToken()` line must stay the first thing that reaches Google in the stack (Traps). Any new read is a plain variable read, placed before or after it, never behind an `await`.
- The failure sentence (`Planbook is not connected…`) is out of scope; change only the success sentence.
- Pick the new sentence in the app's own voice (e.g. *Connected to Google Drive.*) — check what `connect()` already announces on success and reuse it rather than coining a third wording.
- `CACHE` bump in `sw.js` is required (`src/auth.js` is in `SHELL`).
- Mutation round per `AGENTS.md`: mark the mutation `MUTATION`, revert it **before writing anything else**, and `grep -rn MUTATION src/ tools/` clean before your result file. Record the red-on-HEAD run, the green run and the mutation run in `TESTING.md` § WO-7.17. Tick only boxes you closed with a command.

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

1. The new check is red on `HEAD` and green with the change, with both runs recorded in `TESTING.md` § WO-7.17.
2. Mutation-proved: make the sentence unconditional again and the new check goes red. **The mutation is reverted before anything else is written** (`AGENTS.md`).
3. The header button's reconnect still announces *Reconnected to Google Drive.*
4. The whole browser harness shows no new failure.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

