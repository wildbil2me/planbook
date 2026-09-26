# WO-7.5 — the header says how fresh this device's sync is · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.5-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-09-26).** Claude, **Opus** (no override). Deciding signal: this sits on
the OAuth surface — the reconnect tap's gesture window and "no request to accounts.google.com until
opted in" are exactly the plausible-but-wrong places `ROUTING.md` keeps Claude-only, and it names all
of Phase 7 Claude-only. Set aside: the six-state table and harness assertions are mechanically
specified, but a new header surface, teacher-facing readings and judgment Traps (no green, no count on
the badge, time not countdown) keep it out of the Codex column.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.5 — the header says how fresh this device's sync is

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-26 · **Size** M · **Depends on** WO-7.2 — the transfer whose state the button reads, and the bookmark it counts from
**Closes roadmap** *(no box. Phase 7's boxes are closed by WO-7.1, WO-7.2 and WO-7.3; this is a surface on top of them.)*

**Booked 2026-09-26**, owner-directed, out of a conversation that started at *"what about making the
sync across devices more clean?"* The owner asked for **a connected icon in the top bar that shows
whether the connection needs refreshing, and could be tapped to refresh it.** This work order is that
icon, reshaped by the argument [`docs/sync.md`](../../docs/sync.md) already carries: **freshness, not
connection.** It is the owner's third turn of the 2026-09-07 conversation — § *"And if it becomes
automatic, it needs a status on the glass"* and § *"The one thing in this conversation that is already
a build"* — made into a build, and **those two sections are the argument; read them before this one.**

**Why it exists.** Today nothing outside the About modal says anything about sync. The token lapses
at ~59 minutes with no sign; the Sync button hides and Connect returns, and a teacher learns it only by
opening About. That is coherent while sync is a tap she chose to make — *the lapse is silent while the
consequence is loud* — and it stops being coherent the moment she relies on it across two devices,
which is the whole point of having it. **A plain connected light would not fix it**: *connected* with
three saves not in Drive is true and useless, and a permanent green dot reads as *your gradebook is safe
in the cloud*, which is the belief that stops a teacher downloading backups.

**Deliverables**
- **One preference: this device has opted into Drive sync.** A boolean in `PREF_DEFAULTS`
  (`src/prefs.js`), set by the first successful Connect and cleared by Disconnect. **It is not a
  credential** — it records that she opted in, never anything she could authenticate with — so the
  token-in-memory ruling (WO-7.1) is untouched and the `localStorage` rule is met on its own terms.
  Without it the app cannot tell after a reload a teacher who syncs every day from one who has never
  connected, and the button has no condition to be drawn on.
- **One button in `.header-actions`, drawn only on a device that has opted in.** It wears
  `.hdr-icon-btn` as shipped and adds a state and a badge. Six states, each with a full-sentence
  label, and **every tap does what that state needs**:

  | State | Reading | Tap |
  |---|---|---|
  | Up to date | *Synced with Google Drive at 9:41.* | Sync now |
  | This device is ahead | *Changes on this device are not in Google Drive yet.* | Sync now |
  | Stale (ruling 4) | *Last synced yesterday at 3:12.* | Sync now |
  | Sign-in lapsed | *Your Google sign-in has ended. Tap to reconnect.* | Google's sign-in, visibly |
  | Last sync failed | *The last sync did not finish. Nothing on this device changed.* | About, at the Drive section |
  | Syncing | *Syncing with Google Drive…* | Nothing until it settles |

- **The silent renewal is tried before *lapsed* is drawn** — on app open and when the tab regains
  visibility, never on the tap (see Traps). `ensureFreshToken()` already has the silent arm; the change
  is that the screen stops retiring the entry point before that arm has run (`docs/sync.md` § *"What
  actually happens at the hour"*). Expect it to carry the laptop and not the iPad.
- **Presentation mode changes nothing about it.** Sync state is not student data.
- **Surface:** [`design/mockups/sync-button.html`](../../design/mockups/sync-button.html), drawn
  2026-09-26 — every state in the real header, in two variants (`proposed-phase7.css` § SYNC BUTTON).
  **Read it before building.** Its four amber questions were answered by the owner as rulings 1–4
  below, and the drawing does not show two of the answers — the stale state and the phone-width
  fallback onto About — nor ruling 3's position. **Where the drawing and this list disagree, this
  list wins.**
- **`docs/sync.md`** — the two sections named above become a record of what was built rather than a
  proposal, in the same sitting. **`CACHE` in `sw.js` bumped** — `index.html`, `src/shell.css` and
  `src/auth.js` are all in `SHELL`.

**Not in scope** — **syncing without a tap** (open, visibility, after a save): that is the step after
this one, and this button is what makes it safe to take, not the step itself. **Pulling a year onto a
cold device**: discussed the same day, not yet booked. **Detecting a changed Google account**
(`docs/sync.md` § *"A second Google account makes a latent hole reachable"*).

**Rulings** *(the owner, 2026-09-26, the day it was booked — one per question it was booked with.
The questions are kept above each answer so the record of there having been a choice survives, and
the drawing carries the same answers in green where it asked them in amber.)*
1. *Variant A or B?* **A — a bare icon with a corner badge**, the header's existing grammar. The
   reading lives in the label, and the badge carries the state a thumb can see.
2. *Phone width — the top row had ~8px of slack at 390px after WO-2.29's fourth button, and a fifth
   44px control does not fit.* **Below the phone breakpoint there is no fifth button: the About button
   wears the sync badge instead**, and its tap opens About at the Drive section, where Sync and
   Reconnect already are. Ruling 3 is what makes this clean — the button sits beside About, so at
   phone width it folds into its neighbour rather than moving somewhere else. The row's width is
   unchanged, so nothing is re-measured and nothing is taken away. Hiding the 📓 was declined (it frees
   ~42px against a 44px need, which is no slack at all), sub-44px buttons were declined (a departure
   needs its own reading, `CLAUDE.md` § Conventions), and the subtitle is already spent at 640px.
   The iPad and the laptop draw the full button.
3. *Beside the year, or last before About?* **At the end of the row, immediately before About.** The
   drawing shows it beside the year; this list wins.
4. *Does an old sync turn amber on its own?* **Yes, and the line is a calendar day: *not synced
   today*.** From the first launch on a new day the button reads amber, with a reading such as *Last
   synced yesterday at 3:12.*, and a tap syncs. A day matches how the two devices are actually used —
   the other one is picked up the next morning, which is when a stale reading matters — where a fixed
   number of hours would go amber in the middle of a teaching day for no reason. It is a sixth state
   in the table above, drawn like *ahead* (amber, a dot) and told apart by its reading.
5. *Is opting in also consent to try reconnecting at launch?* **Yes, one consent.** A device that has
   opted in makes the silent attempt at launch and on regaining visibility. It never blocks: the app
   renders either way, offline included, and *lapsed* is drawn only when the attempt fails.

**Acceptance**
- [ ] A device that has never connected draws the header exactly as today, and makes no request to
      `accounts.google.com` — asserted from the network in the harness, as WO-7.4's second line was.
- [ ] Connect sets the opt-in, Disconnect clears it, it survives a reload, and nothing but a boolean
      reaches `localStorage` — asserted in the harness.
- [ ] Each of the six states draws its reading and does its tap, asserted in the harness; *ahead*
      appears after a save that has not synced and clears after one that has.
- [ ] At 390×844 the header draws no fifth button and the About button carries the badge in every
      state but *up to date*; at iPad width the sync button sits last before About. `verify-shell.mjs`
      measures the row at both widths, and its existing 390px slack figure does not move.
- [ ] A last sync on an earlier calendar day draws the stale state on first launch, asserted with
      `--today` moved a day past the bookmark's `at`.
- [ ] 👤 On the iPad, force-quit first, **with Safari's pop-up blocker left on**: let the sign-in
      lapse, tap the button, and Google's sign-in opens and reconnects.
- [ ] 👤 On the laptop and the iPad: a save shows *ahead*, a tap brings it back to *up to date*, and
      the reading is legible at arm's length without hovering.

**Traps** — **The reconnect tap must open Google's window inside the gesture.** `connect()` in
`src/auth.js` awaits the silent attempt and only then asks visibly, so on the iPad the visible
request lands outside the tap's gesture window and Safari blocks the pop-up — WO-7.4's last 👤
reading recorded exactly that. The button's reconnect must request visibly straight away; the silent
attempt belongs to open and visibility, not to the tap. Loading Google's script on the same tap has
the same problem. **No green, and not in the save chip**: `src/store.js` owns every state about this
device's own storage, and freshness is a third kind of thing. **A button, not a toggle**: Disconnect
stays in About, where it is deliberate. **The token stays in memory**: the preference records a
choice, never a credential. **Write the time, not a countdown** — *Synced at 9:41* stays true without
a timer, which is the ruling the Drive panel's *"ends at 2:47"* already took; *2 min ago* needs a clock
ticking in the header. **`rev − baseRev` counts saves, not grades**: one save can carry several scores,
so a number on the badge reads as grades and is not — say *changes* without a count, or count
something that is what it says. **And sync is still not a backup** — the About panel's wording on that
does not move.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/sync-button.html`
  - `docs/sync.md`
  - `src/auth.js`
  - `src/prefs.js`
  - `src/shell.css`
  - `src/store.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/drive-sync.js` — `syncState()`, `refreshSyncChrome()`, `primeSyncChrome()`, `syncNow()`, and
  the bookmark (`baseRev` and its `at`). The button reads state from here; the header code must not
  grow a second opinion about freshness.
- `tools/verify/drive-sign-in.mjs` (~l.640–690) — WO-7.4's network assertion around the Connect tap;
  Acceptance 1 is the same shape. `tools/verify/drive-sync.mjs` for the sync fixtures.
- `index.html` l.248–320 — `.header-actions`, including the comment on the fourth control and the
  coarse block's gap; the existing 390px slack figure lives in `verify-shell.mjs` and must not move.

**Orchestrator notes — the traps a reader would not guess:**
- **Ruling 3 beats the drawing** (last before About, not beside the year), and ruling 2's phone
  fallback is not drawn at all. The work order's list wins everywhere it disagrees with the mockup.
- **Reconnect must not go through `connect()` as it stands** — it awaits the silent arm first. The
  visible request (and the script load, if not already loaded) must happen inside the tap. Say in
  your report how the tap behaves if the launch-time load of Google's script has not finished.
- **Stale is a calendar-day comparison on the bookmark's `at`** — use the app's local-day helper, not
  a 24h subtraction, and prove it with `--today` as Acceptance 5 says.
- **Acceptance 1 is a regression fence**: a device without the opt-in must not attempt the silent
  renewal at launch or on visibility. Ruling 5 makes the opt-in the consent; absent it, nothing fires.
- `sw.js` `CACHE` bump, and `docs/sync.md` rewritten from proposal to record in the same sitting.
- If you mutate to prove a check, a `MUTATION` left in `src/` must not outlive you — revert before
  writing anything else (`AGENTS.md`).

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

## 5. Done means these 7 lines, reported against one by one

1. A device that has never connected draws the header exactly as today, and makes no request to `accounts.google.com` — asserted from the network in the harness, as WO-7.4's second line was.
2. Connect sets the opt-in, Disconnect clears it, it survives a reload, and nothing but a boolean reaches `localStorage` — asserted in the harness.
3. Each of the six states draws its reading and does its tap, asserted in the harness; *ahead* appears after a save that has not synced and clears after one that has.
4. At 390×844 the header draws no fifth button and the About button carries the badge in every state but *up to date*; at iPad width the sync button sits last before About. `verify-shell.mjs` measures the row at both widths, and its existing 390px slack figure does not move.
5. A last sync on an earlier calendar day draws the stale state on first launch, asserted with `--today` moved a day past the bookmark's `at`.
6. 👤 On the iPad, force-quit first, **with Safari's pop-up blocker left on**: let the sign-in lapse, tap the button, and Google's sign-in opens and reconnects.
7. 👤 On the laptop and the iPad: a save shows *ahead*, a tap brings it back to *up to date*, and the reading is legible at arm's length without hovering.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

