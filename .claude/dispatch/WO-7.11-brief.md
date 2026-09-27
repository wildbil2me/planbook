# WO-7.11 — after a reload, sync cannot be switched off without signing in first · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.11-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (routed on its own merits, no model override). The deciding signal is
the sensitive surface: this redraws the Google sign-in/revoke control in `src/auth.js` (OAuth, a
"Claude or nobody" surface) and asks a teacher-facing wording judgment (*Disconnect* vs *Stop
syncing on this device*) that may pull `privacy.html` and `docs/FERPA.md` along as a pair. Runner-up
set aside: Size S with harness-checkable Acceptance looks Codex-shaped, but a clean run plus a
mutation run plus reload checks also sits near the Codex cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.11 — after a reload, sync cannot be switched off without signing in first

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-26 · **Size** S · **Depends on** WO-7.1 — the panel whose Disconnect this redraws; WO-7.5 — the opt-in that Disconnect clears
**Closes roadmap** *(no box. Phase 7's boxes are closed by WO-7.1, WO-7.2 and WO-7.3; this repairs a consequence of WO-7.10 on top of them.)*

**Booked 2026-09-26**, owner-directed, from WO-7.10's verdict. **WO-7.10's code is in the tree and
deployed at v138** — its one open box is a 👤 reading of *the next deploy*, which this work order's
own deploy can supply. It is left out of **Depends on** for that reason: a dependency on it would
hold this row until a deploy that this row is the obvious one to make.

**What is wrong.** Since WO-7.10 every launch starts with no token, so on an opted-in device About's
Drive section draws **Connect** and not **Disconnect**: `refreshAuthChrome()` in `src/auth.js` hides
Disconnect whenever `!state.signedIn`. And Disconnect is **the only thing that clears the opt-in**
(`syncButton.forgetOptIn()` in `src/shell.js`'s click handler, WO-7.5). So a teacher who wants sync
off must tap Connect, finish Google's sign-in, and only then tap Disconnect — and **offline, or with
Google blocked by a Workspace admin, she cannot switch it off at all**. The header button stays, and
Google's library keeps loading at every launch, which `privacy.html` and `docs/FERPA.md` describe as
the consequence of an opt-in she is now unable to withdraw. The iPad already behaved this way before
WO-7.10; the laptop's launch renewal usually hid it.

**Deliverables**
- **On an opted-in device, the control that switches sync off is drawn whether or not there is a
  token.** Signed in, it does what Disconnect does today: drop the token, revoke it, forget the
  opt-in. Signed out, it forgets the opt-in and repaints — there is no token to revoke, and it
  **makes no request of any kind**, so it works offline.
- **The wording tells the two states apart if they need telling apart.** "Disconnect" beside
  "Not connected" may read as nonsense; the build argues at the point of departure whether the
  signed-out control keeps the word or says what it does (*Stop syncing on this device*, or the
  like). **Nothing may read as deleting anything in Drive** — the file in Drive is untouched either way.
- **After it, the device is exactly a never-opted-in device**: no header button, and the next launch
  loads no Google library. The first half is visible at once; the second is a reload's business.
- **The harness workaround comes out.** `tools/verify/sync-button.mjs` connects before its Disconnect
  checks (~386, ~1100) because Disconnect was unreachable signed out; those checks should run from the
  signed-out state as well, which is the state a teacher is in after every launch.

**Acceptance**
- [ ] On an opted-in device with no token, About draws the switch-off control, and a tap clears the
      opt-in, removes the header button and makes **no** token request (stub count, as in WO-7.10).
      Asserted in the harness.
- [ ] With the network refused, the same tap still clears the opt-in. Asserted in the harness.
- [ ] Signed in, the tap behaves exactly as Disconnect does today — token dropped, revoke attempted,
      opt-in cleared. Asserted in the harness.
- [ ] A reload after switching off fetches nothing from Google (`/gsi/client` absent from the wire).
      Asserted in the harness.
- [ ] Mutation-proved: putting back `!state.signedIn` as the only condition for drawing the control
      turns the first line red. **The mutation is reverted before anything else is written**
      (`AGENTS.md`).
- [ ] 👤 **iPad, home-screen app, deployed**, force-quit first: About shows the switch-off control at
      launch without signing in; one tap removes the header button; a relaunch shows no header button.

**Traps** — **Do not make the switch-off ask Google for anything** — not a sign-in to revoke with,
not a library load; a teacher offline or blocked by her admin is the case this exists for.
**Sync is still not a backup**, and switching it off must not read as losing anything: the local year
is untouched and so is the Drive copy. **The token stays in memory and the opt-in stays a boolean**
(WO-7.1, WO-7.5). **Do not widen this into a Drive-file delete** — removing the file from Drive is a
different decision, the owner's, and not booked. If `privacy.html` or `docs/FERPA.md` need a word
about withdrawing the opt-in, both change in the same sitting (`CLAUDE.md` § Accommodations).

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/FERPA.md`
  - `src/auth.js`
  - `src/shell.js`
  - `tools/verify/sync-button.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/sync-button.js` — owns the opt-in pref (`rememberOptIn()` / `forgetOptIn()`, `planbook_driveSyncOptIn`).
- `privacy.html` — the twin of `docs/FERPA.md`; change one, change both, same sitting.
- `AGENTS.md` § "If you were dispatched with a work order" — the mutation-revert rule.

**Traps the work order does not spell out (orchestrator's reading of the tree):**
- **`src/auth.js` does not know the opt-in.** `refreshAuthChrome()` hides Disconnect on
  `!state.signedIn` and the pref lives in `src/sync-button.js`. The `disconnect()` header comment says
  auth.js imports `src/live-region.js` *and nothing else* — that is an argued property ("sign-out
  leaves the local document untouched"). Decide how the panel learns the opt-in without quietly
  breaking it (e.g. pass it in, or read the pref by its key), and say which at the point of departure.
- **`disconnect()` with no token** already skips the revoke, but announces *"Signed out of Google
  Drive"* — wrong words when nothing was signed in. It must not touch `window.google`, load the
  library, or call any token request on that path.
- **Every place that repaints the Drive panel** (About open, `afterDriveAuthChange()`, the opt-in
  changing) must agree, or the control appears only after About is reopened — the exact WO-7.2 lie
  described above the shell.js click handler.
- **Keep the WO-7.10 stub count** as the no-request evidence; read how
  `tools/verify/sync-button.mjs` counts token requests before writing a new counter. The
  `/gsi/client` wire check after reload follows the pattern `verify-shell.mjs` already uses for the
  never-connected device.
- A `SHELL` file changes, so bump `CACHE` in `sw.js`.
- **Run `grep -rn MUTATION` over every file you touched before writing the result file.**

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

## 5. Done means these 6 lines, reported against one by one

1. On an opted-in device with no token, About draws the switch-off control, and a tap clears the opt-in, removes the header button and makes **no** token request (stub count, as in WO-7.10). Asserted in the harness.
2. With the network refused, the same tap still clears the opt-in. Asserted in the harness.
3. Signed in, the tap behaves exactly as Disconnect does today — token dropped, revoke attempted, opt-in cleared. Asserted in the harness.
4. A reload after switching off fetches nothing from Google (`/gsi/client` absent from the wire). Asserted in the harness.
5. Mutation-proved: putting back `!state.signedIn` as the only condition for drawing the control turns the first line red. **The mutation is reverted before anything else is written** (`AGENTS.md`).
6. 👤 **iPad, home-screen app, deployed**, force-quit first: About shows the switch-off control at launch without signing in; one tap removes the header button; a relaunch shows no header button.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

