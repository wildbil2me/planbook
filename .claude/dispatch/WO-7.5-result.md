# WO-7.5 — result (implementer, Claude Opus, 2026-09-26)

**Outcome: built; Acceptance 1–5 met and ticked on harness evidence; 6 and 7 are 👤 and left open.**
Nothing committed. No `--start/--release/--handoff/--tick` run. No `MUTATION` marker left in the tree
(checked after every revert: `grep -rn "MUTATION WO-7.5" src/ tools/ index.html sw.js docs/` → 0).

## Tool runs (final tree)

- `node tools/verify-shell.mjs` → **`1513 checks · 1513 passed · 0 failed · 0 skipped`**, `47,660 lines ·
  31.5 lines per check · 573s`, `EXIT=0`, real clock, 2026-09-26. (1488 before + 25 new, all in
  `tools/verify/sync-button.mjs`.) I waited for the exit and read the summary from the log.
- `node tools/wo-sweep.mjs` → **`45 checks · 41 passed · 0 failed · 4 to review`**. The three standing
  reviews plus one new: `.hdr-about-badge` has no coarse-block rule — correct, it is an `aria-hidden`
  span with `pointer-events: none`, not a control. § 11 reads 1502 call sites against `tools/README.md`.
- `node tools/wo-gate.mjs --audit` → PASS (read-only).
- **After the final harness run I made comment-only edits** to `index.html`, `src/shell.css` and
  `src/sync-button.js` (the slack figure "~8px" → the measured 5.92px) and doc edits (TESTING.md,
  tools/README.md, the phase file). No code changed after the run; the sweep was re-run after them.

## Acceptance, line by line

1. **[x] Never connected: header as today, no request to accounts.google.com, from the network.**
   `verify/sync-button.mjs`: Network domain on, page reloaded with no stand-in and no opt-in, then a
   dispatched `visibilitychange` — `0 request(s) to accounts.google.com and 69 to this origin; sync button
   hidden = true, About badge = false, About label = "About Planbook", laid-out controls =
   ["yearButton","hdr-icon-btn","presentationBtn","soundsBtn","aboutBtn"]`. Positive control in the next
   check: the same reload with the opt-in set asks `https://accounts.google.com/gsi/client` (blocked via
   `Network.setBlockedURLs`, so no real Google code runs) and lands on *lapsed*. Mutation: renewal made
   regardless of opt-in → this check read `1 request(s) to accounts.google.com` (red).
2. **[x] Connect sets, Disconnect clears, survives reload, only a boolean.** Real Connect tap in About,
   answered by a stand-in GIS installed with `Page.addScriptToEvaluateOnNewDocument` → stored
   `"true"`; reload → still `"true"`, one silent request, no visible one; localStorage keys all
   `planbook_`, none holding a token; real Disconnect tap → `"false"`, button hidden in the same tap;
   reload → hidden, stand-in received `[]`. Also `verify/drive-sync.mjs`'s static check now asserts
   PREF_DEFAULTS has exactly one sync-shaped key, `driveSyncOptIn`, default `false`.
3. **[x] Six states, reading + tap; ahead after a save, cleared after a sync.** All six asserted:
   current (`"Synced with Google Drive at 8:05 AM. Tap to sync now."`), ahead (`localRev 309 over
   baseRev 308`, badge a dot, text `""`) and cleared by a tap, syncing (Drive held 3.5s, `disabled =
   true`, second tap made 0 requests), failed (planted 500 → `"The last sync did not finish. Nothing on
   this device changed. Tap for details."`, tap opens About with `#drivePanel` on the glass, overlay
   scrolled 623px), lapsed (silent renewal on return-to-view refused → reading; tap → one visible
   request `{"silent":false,"inClick":true,"inListener":true}`), stale (planted yesterday → `"Last
   synced yesterday at 3:12 PM."`; 3 days → `"Last synced on Sep 23 at 9:12 AM."`; tap syncs).
4. **[x] Widths.** 390×844 coarse, every state: 5 controls laid out, no `syncBtn` box, About badge in
   every state but current, **slack 5.92px** in all six vs 5.92px opted-out. 834×1194 coarse: 44×44,
   `nextElementSibling === aboutBtn`, right edge ≤ About's left, in all six. Note: the WO/ruling says
   "~8px"; the measured figure is 5.92 and it does not move.
5. **[x] Stale on first launch with `--today` moved a day past `at`.** A real sync writes the bookmark
   (`2026-09-26T12:05:35.396Z`); the page is relaunched under a page-start `Date` proxy identical to
   `verify-shell.mjs`'s `SHIFT_PAGE_CLOCK` (the `--today` mechanism), +1 day → `"Last synced yesterday
   at 8:05 AM."`; removed and relaunched → current. **Judgement call for the verifier:** I did not run
   the whole harness with the `--today` flag, because a bookmark cannot survive between harness runs
   (fresh browser profile each run), so the literal "moved a day past the bookmark's `at`" can only be
   done mid-run. If the verifier reads the line as requiring the flag itself, this box should be
   unticked and that run owed. Mutation: stale-by-24h → the planted yesterday-at-3:12 read *current*
   (red).
6. **[ ] 👤 iPad, pop-up blocker on.** Not verifiable here. What the harness proves is the precondition
   only: the visible request is made in the click listener's own synchronous stack.
7. **[ ] 👤 Laptop and iPad, arm's length.** Not verifiable here.

## Mutation round (three runs; details in TESTING.md § WO-7.5)

1. Four at once → `1485 passed · 28 failed`. The launch-renewal-without-opt-in break was caught (A1 and
   the stand-in check) but cascaded through the rest of the section and three older checks (real GIS
   loaded early). Re-run without it.
2. Late reconnect + stale-by-hours + count-in-badge → `1509 passed · 4 failed`. Badge and stale caught.
   **The late reconnect was NOT caught** — `window.event` is still the click inside the microtask the
   listener queues. The fourth red was A5's `lastSyncedAt === syncedAt` clause: `drive-sync.js` stamped
   the in-memory bookmark with its own `new Date()` a few ms after `writeSyncState()` stamped the stored
   one. Inferred to be a real ms race rather than the mutation (the clause passed in the first green
   run). **Fixed in app code**: the three call sites now hold the record `writeSyncState()` returns.
   The stand-in now also reads `new Error().stack` for `src/shell.js` (`inListener`).
3. Late reconnect alone → `1512 passed · 1 failed`: `{"silent":false,"inClick":true,"inListener":false}`.
   Reverted before any doc was written; final green run is after it.

## Decisions the work order did not settle

- **New module `src/sync-button.js`** owns the opt-in pref, the launch/visibility renewal, the paint and
  the tap. Freshness (ahead/stale/current) lives in `drive-sync.js` `freshnessOf()` — the header holds no
  second opinion; `localDayOf()` exported from there (calendar-day compare, never 24h subtraction).
  Required widening `verify/drive-sign-in.mjs`'s auth-importer allowlist to three Phase 7 files.
- **`reconnect()` added to `src/auth.js`**; `requestToken()` split so `ask()` is synchronous up to
  `requestAccessToken()`. **If GIS has not loaded when the lapsed tap lands** (the launch-time load
  failed: offline, or a network blocking Google — if it is still *loading*, the button is in the busy
  state and the tap does nothing), the tap has to fetch the library first, the request lands outside
  the gesture, and a blocked window gets a specific sentence: *"Planbook had to fetch Google's sign-in
  first, so the browser blocked its window. It is ready now — tap again and it will open."* The second
  tap is synchronous.
- **The busy state covers three things** with three readings, all tapping to nothing: a transfer
  (`"Syncing with Google Drive…"`, the table's reading), a sign-in in flight (`"Connecting to Google
  Drive…"`), and the one frame before the bookmark is read (`"Checking this device's last sync…"`). The
  table has six states; I did not add a seventh.
- **Opt-in set on `connect()`'s own answer**, passed as `afterDriveAuthChange(connected)`, not on
  `authState().signedIn` — the latter would have opted in a harness session seeded and then hit by a
  failed Connect tap (drive-sync.mjs does exactly that). Disconnect clears it; nothing else does.
- **No count, no timer**: `src/sync-button.js` has no `setTimeout`/`setInterval`; a token that lapses
  while the app sits open is not watched — the next tap goes through `syncNow()`'s own silent renewal.
- **Stale wears ahead's icon** (ruling 4 read literally). Lapsed badge on About is `!` in amber.
- **Phone width decided by the page, not a number**: the 640px breakpoint is written only in
  `src/shell.css`; the JS asks whether the button got a box. A `resize` listener repaints About's label.
- **The About panel's Connect is unchanged** (still silent-first via `connect()`), so on the iPad the
  *first* Connect still wants the pop-up blocker off; only the header's reconnect was fixed. Changing
  `connect()` looked tempting and is outside the deliverables.
- **privacy.html / docs/FERPA.md not edited.** "Nothing is fetched from Google until Connect is tapped"
  stays literally true — the launch fetch only happens after a Connect that succeeded. Said so in
  `src/auth.js` at `loadGis()` and in `docs/sync.md`. The owner may still want the sentence widened to
  mention launch-time renewal; that pair must change together.
- **Convention set:** the harness stand-in for GIS as a page-start script gated on a sessionStorage key,
  recording `silent`/`inClick`/`inListener` — reusable by any later Phase 7 work order.

## Out of scope, declined

- Syncing without a tap; pulling a year onto a cold device; detecting a changed Google account.
- Redrawing `design/mockups/sync-button.html` to ruling 3's position (banner in `proposed-phase7.css`
  amended to "lifted 2026-09-26" with what was taken/added/declined instead).
- `tools/verify-shell.mjs`'s "Sixty-three files" comment was already stale (72); I set it to the true
  "Seventy-three" since I was on that line.

## Files changed

- New: `src/sync-button.js`, `tools/verify/sync-button.mjs`
- `src/auth.js` (gisReady/ask split, `reconnect()`, comments), `src/drive-sync.js` (`localDayOf`,
  `freshnessOf`, `bad` in `syncState()`, bookmark = stored record), `src/prefs.js` (`driveSyncOptIn`),
  `src/shell.js` (import, `openAbout()`, opt-in wiring, `data-sync-button`, boot), `src/shell.css`
  (§ sync button, grouped touch selector, coarse block, 640px block), `index.html` (`#syncBtn`,
  `#aboutBtn` + badge), `sw.js` (SHELL + `CACHE` v130→v131)
- `tools/verify-shell.mjs` (register section), `tools/verify/drive-sign-in.mjs` (allowlist),
  `tools/verify/drive-sync.mjs` (helper regex, pref clause), `tools/README.md` (1477→1502, ledger)
- `docs/sync.md` (three sections now end in built records; mixed line endings preserved),
  `design/mockups/proposed-phase7.css` (banner), `TESTING.md` (§ WO-7.5),
  `plans/work-orders/phase-7-sync.md` (boxes 1–5 ticked with evidence)

## CHANGELOG draft (the teacher decides)

> **The header now says how fresh this device's Drive sync is.** On a device where you have connected
> Google Drive, a button beside About shows whether this year is up to date in Drive, has changes not
> yet there, was last synced on an earlier day, has lost its sign-in, or failed its last sync — and a
> tap does what that state needs. It never says "safe", never counts, and never appears for a teacher
> who has not connected. On a phone the About button wears its badge instead.
