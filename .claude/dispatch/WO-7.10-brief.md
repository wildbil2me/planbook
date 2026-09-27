# WO-7.10 — the silent sign-in renewal opens a window, and on the iPad it blocks updates and taps · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.10-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override) — on its own merits: it is the sign-in path (the
OAuth surface in ROUTING's sensitive list), it can move `privacy.html` / `docs/FERPA.md`, and two of
its deliverables are judgment the work order explicitly leaves to the build (find the real sequence
behind the red line; argue whether *Lapsed* survives). Runner-up set aside: the code change itself is
small and mechanical-looking (delete `renewSilently()` and two call sites), but the proof needs a
clean `verify-shell` run plus a mutation run, and the unknown-cause investigation is not specifiable
for Codex. Codex probe not run — the route is not Codex-eligible.

**Traps the orchestrator found while reading, which the work order does not state:**
- **`src/drive-sync.js` ~535 calls `ensureFreshToken()` after several `await`s** (flush, the disk
  read). If the header button's no-token tap simply calls the existing sync, the token request lands
  after an `await` and the gesture is gone — the same window-blocked failure moved from launch to the
  tap. The token must be requested **synchronously in the tap handler** (as `reconnect()` does) and
  only then the sync run. Confirm by reading, not by assuming this line number.
- **Audit every caller that can reach `ensureFreshToken()` / `requestToken()` / `ask()`** — not only
  `renewSilently()`. Any non-tap path into the sync (after a restore, after a download, a timer, a
  visibility hook elsewhere) is a launch renewal by another name and fails Acceptance line 1. List
  them in the result file with the verdict on each.
- **The comment above `ensureFreshToken()`** in `src/auth.js` (~620–633) is the one the Deliverables
  name as false. Also check `docs/sync.md` and WO-7.5's ruling 5 — dated note pointing here; do not
  rewrite the ruling's text.
- **Acceptance line 3's fixture is "the sequence the build found".** Write down in the result file
  what the actual sequence was (observed in the harness with a stubbed token client, not inferred),
  and whether the iPad account in "Why" was confirmed or corrected.
- **`sw.js` `CACHE` bump** is owed for any change to a `SHELL` file (`CLAUDE.md` § Commands).
- If you find a real silent path through Google's library: report it and stop (Traps, option B).

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.10 — the silent sign-in renewal opens a window, and on the iPad it blocks updates and taps

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-26 · **Size** S · **Depends on** WO-7.5 — the launch renewal this removes, and the header button whose tap replaces it
**Closes roadmap** *(no box. Phase 7's boxes are closed by WO-7.1, WO-7.2 and WO-7.3; this reverses one ruling on top of them.)*

**Booked 2026-09-26**, owner-reported, during WO-8.18's device reading. **The owner's ruling, the day it
was booked: option A — drop the launch renewal. Opting in stays; a sign-in is asked for only by a
tap.** This reverses the second half of WO-7.5's ruling 5 (*"opting in is also consent to try
reconnecting at launch"*). The first half, that opting in is remembered, stands.

**What the owner saw, on both devices, against v134–v136.**
- **iPad (home-screen app):** on launch a Google sign-in window appeared first. After it, taps on
  About did nothing, through several force-quits. The update from v134 to v135 did not arrive until
  the owner blocked the pop-up, and **v136 needed the same** — so this is repeatable, not a one-off.
  With the window blocked and sync reconnected by a tap, sync works both ways.
- **Laptop:** no window, but About's Drive section shows the red line *"The browser blocked the Google
  sign-in window. Allow pop-ups for Planbook and try again."* — **while connected and syncing.** The
  iPad shows the same red line in the same state.

**Why.** `renewSilently()` in `src/sync-button.js` (~383) calls `auth.ensureFreshToken()` at `start()`
and on every `visibilitychange` to visible. That reaches `requestToken(true)` → `ask(true)` in
`src/auth.js`, which calls `requestAccessToken({ prompt: '' })`. **The comment above
`ensureFreshToken()` says "SILENT ONLY, AND NEVER A POPUP", and it is false**: Google's token client
has no silent path. `prompt: ''` skips the consent screen when it can; it still opens a window to get
the token.
- A desktop browser blocks a window with no tap behind it, so the attempt fails with
  `popup_failed_to_open` and sets `lastError` — the laptop's red line.
- The iPad's home-screen app lets it open. Closing it returns the app to visible, which fires
  `renewSilently()` again; a failed renewal is marked `'failed'` and is retried on every return. The
  owner's account (a window first; About dead; updates stuck until the window was blocked) fits a
  window reopening over the app, and WO-8.17's update check and the service worker's `load`-time
  registration (`src/shell.js` ~4022) never getting a clean turn. **That sequence is inferred, not
  observed** — the build's first job is to confirm or correct it before changing anything.
- **Why the red line outlives a successful tap is not known.** A tap that signs in sets
  `lastError = ''`. A plausible cause is a renewal fired after the success — the visibility return
  when Google's window closes — resetting it. Find the actual sequence; do not assume this one.

**Deliverables**
- **No sign-in window is ever requested without a tap.** `renewSilently()` and both its call sites
  (`start()` and the visibility listener) go. Nothing at launch or on regaining visibility calls
  `ensureFreshToken()`, `requestToken()` or `ask()`. The only callers left are taps: Connect, About's
  Sync, the header sync button and WO-7.9's Drive door if it has landed.
- **The header button keeps reading freshness, and "no token" is not an alarm.** Today
  `renewal === '' && !signedIn` draws *Connecting to Google Drive…*, which under this ruling would be
  drawn for ever. With no token, the button reads what it would read if signed in — up to date,
  ahead, stale, failed — from the bookmark, and **its tap signs in and syncs in one gesture**, the
  sign-in asked for inside the tap as `reconnect()` already does. *Lapsed* as a separate alarm state
  goes, or is drawn only after a tapped sign-in actually fails; the build argues which, at the point
  of departure.
- **Google's library still loads at launch on an opted-in device**, and only there, so the tap can
  reach `requestAccessToken()` synchronously. If the library is not ready when she taps, that tap
  loses the gesture and `reconnect()`'s `loadedFirst` message is what she meets. **Keeping the
  preload is what keeps `privacy.html` and `docs/FERPA.md` true word for word** — WO-7.6's wording
  says the library loads at launch on an opted-in device. If the build finds the preload can go, both
  documents change in the same sitting, per `CLAUDE.md` § Accommodations.
- **A stale error does not survive a success.** After any tapped sign-in or sync that succeeds, About's
  Drive section shows no red line. The fix is the cause found above, not a blanket clear on paint.
- **The comment above `ensureFreshToken()` is corrected** to say what the token client actually does.
  `docs/sync.md` § *"What actually happens at the hour"* and WO-7.5's ruling 5 carry a dated note
  pointing here; the ruling's text is not rewritten.

**Acceptance**
- [ ] On an opted-in device, a launch and a return to visible make **no** token request. Asserted in
      the harness by counting `requestAccessToken` calls (a stub), not by the network: the library
      itself still loads, and that load is expected.
- [ ] With no token, the header button reads the bookmark's freshness, never *Connecting…*, and a tap
      requests a token inside the tap's own stack, then syncs. Asserted in the harness.
- [ ] A failed silent attempt can no longer set the red line, and a tapped success clears any red line
      already there. Asserted in the harness, with the sequence the build found as its fixture.
- [ ] Mutation-proved: putting a launch-time renewal back turns the first line red. **The mutation is
      reverted before anything else is written** (`AGENTS.md`).
- [ ] 👤 **iPad, home-screen app, deployed, pop-ups allowed**, force-quit first: no Google window at
      launch or on return from the background; About opens on the first tap; the header button's tap
      signs in and syncs; the next deploy's update lands with no pop-up blocked (About names one copy
      after a relaunch).
- [ ] 👤 **Laptop, deployed origin** (`location.origin` checked): no red line at launch; a tap on the
      header button syncs and leaves About's Drive section with no red line.

**Traps** — **Do not look for a silent path through Google's library and keep the launch renewal on
it.** That is option B, which the owner declined in favour of this one; if the build finds a real
silent path, it reports it and stops, rather than building it. **Ask for the token inside the tap**,
never after an `await` (WO-7.4's last reading, WO-7.5's Traps). **The opt-in stays a boolean and the
token stays in memory** (WO-7.1). **Do not remove the preload to save a request** without the two
privacy documents changing in the same sitting. **And sync is still not a backup**: nothing on the
header or in About may read *safe* because a tap now does two things.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/FERPA.md`
  - `docs/sync.md`
  - `src/auth.js`
  - `src/shell.js`
  - `src/sync-button.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- Also open: `src/drive-sync.js` (the sync the header tap drives, and its own `ensureFreshToken()`
  call), `privacy.html` (only if the preload changes), and the existing harness sections
  `tools/verify/sync-button.mjs`, `tools/verify/drive-sign-in.mjs`, `tools/verify/drive-sync.mjs` —
  extend these; they already stub the token client. Do not write a new harness.
- WO-7.5's section in `plans/work-orders/phase-7-sync.md` (rulings, esp. ruling 5) — WO-7.9 is
  `⬜ NOT STARTED`, so its Drive door has not landed; there is no fourth tap caller to keep.

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

1. On an opted-in device, a launch and a return to visible make **no** token request. Asserted in the harness by counting `requestAccessToken` calls (a stub), not by the network: the library itself still loads, and that load is expected.
2. With no token, the header button reads the bookmark's freshness, never *Connecting…*, and a tap requests a token inside the tap's own stack, then syncs. Asserted in the harness.
3. A failed silent attempt can no longer set the red line, and a tapped success clears any red line already there. Asserted in the harness, with the sequence the build found as its fixture.
4. Mutation-proved: putting a launch-time renewal back turns the first line red. **The mutation is reverted before anything else is written** (`AGENTS.md`).
5. 👤 **iPad, home-screen app, deployed, pop-ups allowed**, force-quit first: no Google window at launch or on return from the background; About opens on the first tap; the header button's tap signs in and syncs; the next deploy's update lands with no pop-up blocked (About names one copy after a relaunch).
6. 👤 **Laptop, deployed origin** (`location.origin` checked): no red line at launch; a tap on the header button syncs and leaves About's Drive section with no red line.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

