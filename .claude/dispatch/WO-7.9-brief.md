# WO-7.9 — a fresh device cannot open the year it already has in Google Drive · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.9-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus** (no model override). Deciding signal: this touches two sensitive surfaces at once — an OAuth sign-in asked for inside a gesture, and a door into backup/restore that replaces a year — and all of Phase 7 is Claude-only (ROUTING § Route to Claude). Runner-up set aside: the list-and-pull plumbing alone is Codex-shaped, but it cannot be separated from the "untouched" safety judgment and the teacher-facing sentences, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.9 — a fresh device cannot open the year it already has in Google Drive

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-28 · **Size** M · **Depends on** WO-7.2, WO-7.5, WO-7.7 — the download and its validation, the opt-in a pull must set, and the repaint a pull must trigger
**Closes roadmap** *(no box. Phase 7's boxes are closed by WO-7.1, WO-7.2 and WO-7.3; this is a door on top of them.)*

**Booked 2026-09-26**, owner-directed. The owner connected a fresh laptop while reading WO-7.5 and found
**no way to open the year already in Drive**. WO-7.5 had listed *"Pulling a year onto a cold device"* as
discussed and not booked. **The owner's ruling, the day it was booked: on first run, a fresh device
offers to open a year from Google Drive *or* from a backup.**

**Why it does not work today.** Sync never searches Drive for "a year". It looks for the one file
whose `appProperties.docId` matches the document open on this device (`src/drive-sync.js`, the
`files.list` query ~357). On a fresh device, `boot()` in `src/store.js` finds no year and calls
`createYear(currentSchoolYear())`, which makes a new, empty document with a new `docId`. So sync
cannot see the file in Drive, and a tap on Sync uploads the empty year as a second Planbook file. The
only route now is a backup from the other device, and even that ends in a keep-both conflict on its
first sync, because this device has no bookmark for that `docId` (`docs/sync.md` § *"What a restore
from a different device does"*).

**Deliverables**
- **A first-run offer with two doors: Google Drive and a backup.** It is drawn on the home screen of a
  device whose **only** document is the untouched year `boot()` just created: no classes, no
  students, and no save since it was made. It sits alongside the ordinary way forward (add your
  first class), never in place of it: **sync is an opt-in extra, and a teacher with no Drive year
  starts exactly as today.** The offer goes away for good the moment the year stops being untouched.
- **The backup door is the existing restore** (`src/backup.js`), reached from here. No second
  restore path.
- **The Drive door lists this account's Planbook years and opens the one she picks.**
  - **The tap is the Connect.** The sign-in is asked for *inside the gesture*, the way WO-7.5's
    reconnect does, so Safari's pop-up blocker allows it. A successful sign-in sets the WO-7.5 opt-in,
    exactly as Connect in About does. It is drawn only where `hostAllowsSignIn()` is true. On the
    iPad's LAN address only the backup door is drawn. While the client is in Testing mode, the
    `TESTING_MODE_NOTE` line shows here as it does above Connect.
  - **The list** is every live Planbook file in Drive the app can see: `appProperties.docId`
    present, `conflictOf` absent, not trashed. Each row shows its year, the device that last wrote
    it and when. **Conflict copies are left out**: they are for a teacher to open by hand, not for
    the app to choose between. With no files the door says so in a sentence and the device carries on
    as a fresh one. With one file it is still a list of one, which she confirms.
  - **Opening one** downloads it, validates it through `parseBackup()` as a download already is, and
    adopts it **with its own `docId`**. It replaces the untouched year only if the two share a year
    label; otherwise it opens beside it. **It writes the sync bookmark at the remote's `rev` in the
    same step**, so the next sync is an ordinary one and not a keep-both conflict. That bookmark is
    the whole difference between this and a restore. The open screen is redrawn by WO-7.7's path.
- **`docs/sync.md`** gains the section: what a pull is, why it writes the bookmark and a restore does
  not, and why it is offered only on an untouched device. **`CACHE` in `sw.js` bumped.**

**Not in scope** — **Pulling onto a device that already has data** (in About, after connecting).
That device's own year would have to be kept, merged or replaced, which is the question the
keep-both design exists to refuse. It needs its own work order if it is wanted. **Detecting a changed
Google account** (`docs/sync.md` § *"A second Google account makes a latent hole reachable"*).

**Surface:** [`design/mockups/first-run.html`](../../design/mockups/first-run.html), drawn
2026-09-26: the fresh home screen in two variants, plus the Drive list and its confirm, which both
share (`proposed-phase7.css` § FIRST RUN). **Read it before building.** Only the variant the owner
picks is lifted, and where the drawing and this work order disagree, the work order wins.

**Rulings** *(the owner, 2026-09-26)*
1. *The backup door, then Connect.* A year restored from a backup has a `docId` Drive already knows,
   and no bookmark here, so its first sync ends in keep-both: one spare file in Drive, once. Leave it,
   or have the backup door suggest the Drive door when the backup's `docId` is already in Drive?
   **Leave it.** It errs the safe way, it happens once, and `docs/sync.md` already documents it.
2. *Where the offer sits on the home screen.* Variant A in the drawing is its own panel above
   *Your classes*, with the Drive door as a second primary button. Variant B is inside the empty
   state, under a hairline below *Add your first class*, with both doors secondary. **B.** One
   primary button on the screen every new teacher sees first, since pulling a year happens once
   per device. The doors go when the empty state goes, so hiding them needs no rule of its own.
   **Lift § FIRST RUN's variant B rules and delete variant A's in the same sitting.**

**Acceptance**
- [ ] A device whose only document is untouched draws both doors. A device with a class, a student
      or a second year draws neither. On the LAN host only the backup door is drawn. Asserted in the
      harness.
- [ ] The Drive door lists live files only (no conflict copies, no trashed files), and opening one
      leaves this device holding that document with its own `docId`, current, and a bookmark at the
      remote's `rev`. **A sync straight after is `in-sync` and writes nothing to Drive.**
      Mutation-proved: without the bookmark write, that sync turns into a conflict and the check goes
      red.
- [ ] A device that never takes either door boots, draws and behaves exactly as today, and makes no
      request to `accounts.google.com`. Asserted from the network, as WO-7.4 and WO-7.5 do.
- [ ] A document that fails validation, or belongs to a newer build, is refused in a sentence and
      leaves the untouched year as it was.
- [ ] 👤 On the iPad on the deployed app, force-quit first, **pop-up blocker on**, a fresh install
      (Safari's site data cleared): the Drive door signs in, lists the year the laptop synced, opens
      it, and the laptop's grades are on screen. The header's sync button then reads up to date.
      **Clearing site data erases the year on that device.** Before it, on the iPad: sync, confirm
      the button reads up to date, and download a backup. Better still, read it on a device or
      browser profile that is not the classroom one.
- [ ] 👤 The backup door on the same fresh device restores a backup file downloaded from the laptop.

**Traps** — **Never overwrite a year that has anything in it.** "Untouched" is the whole safety of this
door. If the check is ever in doubt, the answer is *do not offer*. **The sign-in has to be asked for
inside the tap**, not after an `await`, or the iPad blocks it (WO-7.4's last reading, WO-7.5's
Traps). **Match on `docId`, never on the file name**, because a teacher can rename a file in Drive.
**The list names years, devices and dates and nothing from inside a document**: no class names, no
students, so it is safe on a projector without a presentation-mode branch. **And sync is still not a
backup.** A teacher who opens her year from Drive has not been told her backups are optional, and
nothing on this screen may suggest it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/first-run.html`
  - `docs/sync.md`
  - `src/backup.js`
  - `src/drive-sync.js`
  - `src/store.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/auth.js` — `connect()` vs `reconnect()` (~563–640). `connect()` awaits a silent attempt first and **will be blocked on the iPad**; `reconnect()` asks inside the call stack. Read both comments.
- `src/sync-button.js` — `rememberOptIn()`, `optedIn()`; `src/shell.js` — `afterDownload()` / `afterRestore()` (~1748–1810) and the comment at ~2228; `src/home.js` ~494 (the empty state the doors go into).
- `design/mockups/proposed-phase7.css` § FIRST RUN — **lift variant B into `src/home.css`, delete variant A's rules in the same sitting** (Ruling 2), and update the lift map line there that says "not yet lifted".
- `tools/verify/drive-sync.mjs` (the Drive fake, including its `trashed = false` query check) and `tools/verify/drive-sign-in.mjs` (~660–700, the accounts.google.com network assertions you extend for Acceptance 3).

**Traps the work order does not spell out, found while briefing:**
1. **The library is not on the page on a fresh device, and must not be.** WO-7.4/7.5 keep Google's library off a device that never opted in, and Acceptance 3 asserts it from the network — so drawing the Drive door may not preload it. That means the Drive tap is `reconnect()`'s `loadedFirst` path: the library is fetched after an await and the iPad blocks the window. Do not "fix" that by preloading on render. Decide deliberately (reuse `reconnect()`'s honest two-tap sentence, or something better that keeps Acceptance 3 true), and say in your report which you chose and why. Acceptance 5 is read with the pop-up blocker on.
2. **"Untouched" must be a positive test, not an absence of evidence.** `createYear()`'s first save makes the document rev 1 (`src/store.js` ~151). Pin down exactly what "no save since it was made" reads, what "a second year" reads, and fail closed: any doubt draws neither door. Also decide what happens if the year stops being untouched between the list opening and the confirm (it must not replace it).
3. **The bookmark is written in the same step as adoption**, from the remote's `rev` — and the mutation for Acceptance 2 removes exactly that write. Revert every mutation before writing anything else; run `grep -rn MUTATION src tools index.html` before reporting.
4. **`privacy.html` / `docs/FERPA.md` must still be true.** They say no third-party code loads unless a teacher connects Google Drive. A Drive-door tap is a connect; check the wording still holds. If it does not, stop and name it as a proposed follow-up — do not widen into those files.
5. **`CACHE` in `sw.js`** — `index.html`, `src/home.css`, `src/home.js` are in `SHELL`; bump it.
6. The list shows year, device, date — the device and date come from Drive metadata / `appProperties`, never by downloading each file to read inside it.

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

1. A device whose only document is untouched draws both doors. A device with a class, a student or a second year draws neither. On the LAN host only the backup door is drawn. Asserted in the harness.
2. The Drive door lists live files only (no conflict copies, no trashed files), and opening one leaves this device holding that document with its own `docId`, current, and a bookmark at the remote's `rev`. **A sync straight after is `in-sync` and writes nothing to Drive.** Mutation-proved: without the bookmark write, that sync turns into a conflict and the check goes red.
3. A device that never takes either door boots, draws and behaves exactly as today, and makes no request to `accounts.google.com`. Asserted from the network, as WO-7.4 and WO-7.5 do.
4. A document that fails validation, or belongs to a newer build, is refused in a sentence and leaves the untouched year as it was.
5. 👤 On the iPad on the deployed app, force-quit first, **pop-up blocker on**, a fresh install (Safari's site data cleared): the Drive door signs in, lists the year the laptop synced, opens it, and the laptop's grades are on screen. The header's sync button then reads up to date. **Clearing site data erases the year on that device.** Before it, on the iPad: sync, confirm the button reads up to date, and download a backup. Better still, read it on a device or browser profile that is not the classroom one.
6. 👤 The backup door on the same fresh device restores a backup file downloaded from the laptop.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

