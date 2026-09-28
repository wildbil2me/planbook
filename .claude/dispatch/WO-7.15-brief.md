# WO-7.15 — a sync Google refused leaves the header button looking like one that worked · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.15-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override): the deciding signal is that this is a judgment
call the work order hands to the implementer in as many words — reuse `lapsed` or add a state, argued
at `syncButtonState()` — plus new teacher-facing prose on the button and a Traps section about
judgment (do not reach `failed`, do not re-open WO-7.14, never green). The runner-up was Codex on
size S and a mechanical harness check; set aside because the reading is teacher prose on the sync
surface, and the Acceptance's run count (red on HEAD, green, one mutation, a whole-harness run) would
not fit Codex's 20-minute cap anyway.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.15 — a sync Google refused leaves the header button looking like one that worked

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-27 · **Size** S · **Depends on** WO-7.14 — the `refused()` that makes this state reachable in one tap; WO-7.5 — the header button this draws on
**Closes roadmap** *(no box. A gap in WO-7.5's states, opened by WO-7.14's fix and read on the laptop by the owner.)*

**Booked 2026-09-27**, owner-directed, from WO-7.14's 👤 reading at v141 on the deployed origin. The
owner removed Planbook's access at myaccount.google.com and tapped the header's sync button. That
sync met Google's `401` and **"appears to sync with no flag"**. The second tap opened Google's
sign-in, so WO-7.14's fix works. WO-7.14's verifier named this cost before the reading: the refusal
sentence is announced and no longer drawn.

**What is wrong.** After a `401`, `syncNow()` settles `signed-out` and `refused()` ends the session.
`syncButtonState()` in `src/sync-button.js` (~222) then walks its ladder. `lapsed` needs `tapFailed`,
which only the sign-in door sets, and this tap went through the sync door. `failed` is skipped on
purpose for `s.outcome === 'signed-out'` (~237). So the button falls through to `freshnessOf()` and
draws `current` or `stale`, **the same wash a sync that worked leaves**. The only differences are the
spoken announcement and the button's label, which now ends *"Tap to sign in to Google and sync
now."* Neither is visible at arm's length.

**Why it matters.** A teacher who taps once and walks away believes the year reached Drive, and it
did not. That is the misconception WO-7.5's header exists to prevent: the button reads freshness so
that it never says *synced* when it is not. No data is lost, because a `401` wrote nothing, but the
next device she opens will be behind without her knowing it. It is reached whenever Google refuses a
token before its hour is up (access removed, a password change, a Workspace admin). A plain lapse
is not affected, because the tap takes the sign-in door first.

**Deliverables**
- **The header button draws a sync that ended `signed-out` as something other than `current` or
  `stale`**, until a sign-in succeeds (`signedInAgain()` already clears that outcome at its cause).
  Whether that is the existing `lapsed` state with its own reading or a new one is the implementer's
  call, argued at `syncButtonState()`. The reading says, in words, that the last sync did not reach
  Drive and that a tap signs in.
- **About's badge follows it**, as it follows every other non-`current` state.
- **A harness check in `tools/verify/drive-sync.mjs`**: seed a signed-in, clock-fresh session and a
  `current` bookmark, make Drive answer `401`, tap the header button once, and assert the button is
  not drawn as `current` or `stale`. It must be red on `HEAD`.
- **Bump `CACHE` in `sw.js`.**

**Acceptance**
- [ ] The new check is red on `HEAD` and green with the change, with both runs recorded in
      `TESTING.md` § WO-7.15.
- [ ] Mutation-proved: put the `signed-out` outcome back on the freshness path and the new check goes
      red. **The mutation is reverted before anything else is written** (`AGENTS.md`).
- [ ] A sign-in that succeeds after the refusal returns the button to its freshness reading.
- [ ] The whole browser harness shows no new failure.
- [ ] 👤 **Laptop, deployed.** Connect and sync, remove Planbook's access at myaccount.google.com,
      tap the header's sync button once: the button does not look like a sync that worked. Tap
      again, sign in: it reads fresh.

**Traps** — **Do not reach `failed`.** `failed` sends the tap to About (`tapSyncButton()`, ~379),
and here the next tap must open Google's sign-in, which WO-7.14 just made work. **Do not re-open
WO-7.14's ruling**: the session still ends on a `401`, and the fix is in what is drawn, not in
`src/auth.js`. **Never green**, per WO-7.5: whatever the state, a working sync still draws no green.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/auth.js`
  - `src/sync-button.js`
  - `tools/verify/drive-sync.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `sw.js` — `CACHE` bump (`./` and `src/` are in `SHELL`).
- `TESTING.md` — add § WO-7.15 recording both the red-on-HEAD and the green run, with the check's
  name and the harness totals.
- `plans/work-orders/phase-7-sync.md` § WO-7.14 and § WO-7.5 — the rulings this sits on top of.

**Traps the orchestrator adds (things you would not guess from the work order alone):**

- **About's badge, `src/sync-button.js` ~320**, currently draws `!` only for `failed` and `lapsed`.
  "Follows it" means whatever state you choose must reach that line — if you add a state, add it
  there; if you reuse `lapsed`, check it already does. Read the About modal's own sync copy too, so
  About does not say something the header now contradicts.
- **Clearing is at its cause, not in the ladder.** `signedInAgain()` already clears the `signed-out`
  outcome; Acceptance line 3 wants a harness assertion that a successful sign-in after the refusal
  returns the button to its freshness reading — prove it, do not reason it.
- **The tap routing must not change.** Whatever you draw, the next tap on it must still take
  `tapSyncButton()`'s sign-in door (WO-7.14), not About. Assert that too if it is cheap.
- **The file-top table (~line 25) and the ladder comment (~203) document every state.** Keep them
  true in the same edit; this repo's recurring defect is prose that ran ahead of or behind its code.
- **The mutation**: revert it before writing anything else, and `grep -rn MUTATION` the tree before
  your result file. A dead dispatch here has shipped a live mutation under ticked boxes four times.
- **Do not tick the 👤 line.** It needs the owner on the deployed laptop.
- Line endings: check `git diff --stat` before finishing; a whole-file rewrite from line-ending
  churn is a defect.

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

1. The new check is red on `HEAD` and green with the change, with both runs recorded in `TESTING.md` § WO-7.15.
2. Mutation-proved: put the `signed-out` outcome back on the freshness path and the new check goes red. **The mutation is reverted before anything else is written** (`AGENTS.md`).
3. A sign-in that succeeds after the refusal returns the button to its freshness reading.
4. The whole browser harness shows no new failure.
5. 👤 **Laptop, deployed.** Connect and sync, remove Planbook's access at myaccount.google.com, tap the header's sync button once: the button does not look like a sync that worked. Tap again, sign in: it reads fresh.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

