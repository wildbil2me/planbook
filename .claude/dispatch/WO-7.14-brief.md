# WO-7.14 — a sign-in Google has refused still reads as signed in, and every sync tap refuses again · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.14-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude Opus, on its own merits: this is the OAuth session in `src/auth.js` (a sensitive surface in ROUTING.md's Claude column), the Acceptance asks for `TESTING.md` prose, and the phase table pre-routes it to Claude. The Codex-side fact I set aside is the run budget. It needs a red-on-HEAD run, a green run, a mutation run and a whole-harness run, about 4 × 4.4 min, roughly 17.6 min against a 20-min cap, which would take Codex off the table anyway. It was not the deciding signal.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.14 — a sign-in Google has refused still reads as signed in, and every sync tap refuses again

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-27 · **Size** S · **Depends on** WO-7.13 — the `signed-out` repaint this makes truthful; WO-7.2 — the `401` arm in `syncNow()`
**Closes roadmap** *(no box. A defect in WO-7.2's fifth Acceptance line, found by WO-7.13's verifier.)*

**Booked 2026-09-27**, owner-directed, from WO-7.13's verdict. The verifier flagged it as outside
that work order's Deliverables and as already true before it. The booking session confirmed it by
reading the code, not by running it.

**What is wrong.** `src/auth.js` decides `signedIn` from the clock and nothing else:
`fresh()` is `session.expiresAt - Date.now() > FRESH_MARGIN_MS` (~260). When Google answers a Drive
request with `401`, `src/drive-sync.js` throws `fault('expired', …)` (~297), and `syncNow()` settles
`signed-out` (~576). **Nothing tells `src/auth.js`.** The session stands, so `authState().signedIn`
is still `true` until the clock runs out, which can be most of an hour away. Three things follow:
- **About contradicts itself.** WO-7.13's repaint runs on `signed-out` and draws what `authState()`
  says: *"Connected to Google Drive. This access ends at …"*, with Connect hidden. The sentence
  announced beside it says *"Tap Connect Google Drive above, then sync again."*
- **The header button cannot get out.** `src/sync-button.js` (~374) asks Google for a new token only
  when `!signedIn`. With the session standing, every tap goes straight to `syncNow()`, which gets
  another `401`. There is no way to sign in again from either door until the hour runs out, short of
  *Disconnect* and Connect again, which nothing on screen suggests.
- **`ensureFreshToken()` keeps handing out the refused token**, because it reads the same clock.

**A teacher can reach it** whenever Google refuses a token before its hour is up: she removes
Planbook's access at myaccount.google.com, changes her password, or a Workspace admin revokes
third-party access. That is rarer than a lapse, but when it happens the app has no way out.
Sync is stuck, not data lost: a `401` wrote nothing at Drive.

**Deliverables**
- **A `401` ends the session in `src/auth.js`.** One narrow export (for example `refused()`)
  that drops `session`, which `src/drive-sync.js` calls on the `expired` arm before it settles.
  It does **not** call `revoke()`, because Google has already refused the token, and it announces
  nothing, because `syncNow()` already announces. The import stays one-way, `drive-sync.js` into
  `auth.js` (decision 4 in `src/drive-sync.js`'s header).
- **Correct any comment that says `signedIn` follows the clock alone**, in `src/auth.js` and
  `src/sync-button.js`, and name the new writer where the session's writers are listed.
- **A harness check in `tools/verify/drive-sync.mjs`.** Seed a clock-fresh session, make Drive
  answer `401`, sync through the delegated listener with About open, then assert that Connect is
  drawn, the status line does not read *Connected*, and `authState().signedIn` is `false`. It must be
  red on `HEAD`.
- **Bump `CACHE` in `sw.js`.** Both `src/` files are in `SHELL`.

**Acceptance**
- [ ] The new check is red on `HEAD` and green with the change, with both runs recorded in
      `TESTING.md` § WO-7.14.
- [ ] Mutation-proved: take out the call that ends the session and the new check goes red. **The
      mutation is reverted before anything else is written** (`AGENTS.md`).
- [ ] No comment in `src/auth.js`, `src/drive-sync.js` or `src/sync-button.js` still says `signedIn`
      follows the clock alone.
- [ ] The whole browser harness shows no new failure.
- [ ] 👤 **Laptop, deployed.** Connect, then remove Planbook's access at myaccount.google.com →
      Security → third-party access. Back in Planbook, tap the header's sync button. The next tap asks
      Google to sign in again rather than failing again, and About shows Connect.

**Traps** — **The token stays memory-only** (`CLAUDE.md`, WO-7.1's ruling): ending the session
writes nothing to storage, and **the opt-in survives**. A refused token is not the teacher switching
sync off, so `planbook_driveSyncOptIn` stays set and the header button stays drawn. **Do not fix it
in `src/sync-button.js` alone**: the About door and the harness do not go through it, and
`signedIn` is `src/auth.js`'s to answer. **Do not treat every Drive failure as a refusal**:
`network` and `drive` faults keep the session, and only a `401` ends it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/auth.js`
  - `src/drive-sync.js`
  - `src/sync-button.js`
  - `tools/verify/drive-sync.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `AGENTS.md` § "If you were dispatched with a work order". It covers reverting a mutation before writing anything else. Two dead dispatches here left live mutations under ticked boxes. Tag your mutation `MUTATION` so `grep -rn MUTATION` finds it if you die.
- `.claude/dispatch/WO-7.13-result.md`. It covers the About repaint on `signed-out` that this makes truthful, and how its harness check drives the delegated listener with About open. Copy that shape rather than inventing one.
- `sw.js`: bump `CACHE`.

**Traps the work order does not spell out:**
- `tools/verify/drive-sync.mjs` ~877 already has a `401` check ("a token Google refuses part-way through"). **Checks after it may be relying on the session surviving the 401.** Once the session ends, they may go red for reasons that have nothing to do with a defect. If so, re-seed a session at their start the way the file already does elsewhere. Do not weaken or delete an assertion to get green, and name every such re-seed in your result file.
- Put the `refused()` call on the `expired` path only, the same code that `syncNow()` maps to `signed-out` (~576). A `network` or `drive` fault must keep the session. A check for that negative is cheap and worth having, but it is not required.
- `refused()` writes nothing to `localStorage` and leaves `planbook_driveSyncOptIn` alone. Assert that the opt-in and the header button survive in the new check if it is cheap.
- Do not change `src/shell.js`, and do not add a `subscribe()`. `src/sync-button.js` stays the store's only subscriber.
- Size S. Anything outside the four Deliverables goes in your result file as a proposed follow-up, not in the diff.

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

1. The new check is red on `HEAD` and green with the change, with both runs recorded in `TESTING.md` § WO-7.14.
2. Mutation-proved: take out the call that ends the session and the new check goes red. **The mutation is reverted before anything else is written** (`AGENTS.md`).
3. No comment in `src/auth.js`, `src/drive-sync.js` or `src/sync-button.js` still says `signedIn` follows the clock alone.
4. The whole browser harness shows no new failure.
5. 👤 **Laptop, deployed.** Connect, then remove Planbook's access at myaccount.google.com → Security → third-party access. Back in Planbook, tap the header's sync button. The next tap asks Google to sign in again rather than failing again, and About shows Connect.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

