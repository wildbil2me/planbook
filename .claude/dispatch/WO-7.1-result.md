# WO-7.1 — Auth · implementation result

**Implementer** Claude (work-order-implementer), Opus, 2026-08-24
**Brief** `.claude/dispatch/WO-7.1-brief.md`
**Status written to the tracker** `🔨 IN PROGRESS` — by `node tools/wo-gate.mjs --tick WO-7.1`, which
refused `✅ DONE` and printed *"3 of 6 Acceptance lines are still [ ]"*. Those three are the two the
brief's § 2d names plus the observed half of line 5. **None of them is tickable at a desk and none of
them is ticked.**

---

## Commands run, and what they printed

Every number below is copied out of output I read. Nothing here is predicted.

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` (baseline, before any edit) | `1094 checks · 1094 passed · 0 failed · 0 skipped`, 374s, exit 0 |
| `node tools/wo-sweep.mjs` (baseline) | `33 checks · 30 passed · 0 failed · 3 to review` |
| `node tools/verify-shell.mjs` (run 1, my section added) | `1114 checks · 1112 passed · **2 failed**` — both mine, both fixed; see below |
| `node tools/verify-shell.mjs` (run 2) | `1116 checks · 1115 passed · **1 failed**` — mine, fixed |
| **`node tools/verify-shell.mjs` (run 3, the delivered tree)** | **`1116 checks · 1116 passed · 0 failed · 0 skipped`, 31,388 lines, 28.1 lines per check, 382s, exit 0** |
| **`node tools/wo-sweep.mjs` (delivered tree)** | **`33 checks · 30 passed · 0 failed · 3 to review`** — the same three REVIEWs as the baseline, none of them about anything I wrote |
| `node tools/verify-shell.mjs` (mutation run) | `1116 checks · 1112 passed · **4 failed**`, exit 1 — the four that map to three deliberate mutations |
| `node tools/wo-gate.mjs --audit` | `PASS | every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open box …` |
| `node tools/wo-gate.mjs --self-check` | `PASS | 18 of 18 plants were caught.` |

`verify-shell.mjs` runs in this environment (it always has on this machine — it is the *sandbox* that
cannot, per `CLAUDE.md`). Four full runs, ~380s each; I waited for each to exit before reading it.

**Two runs went red on my own work and that is the honest part of the record.** Run 1's failures:
(a) the *pre-existing* check `modal controls measure >=44px on a coarse pointer` — my hidden
`Disconnect` button measures 0x0 inside an open overlay, and that check's premise was *every button
inside an open overlay is on screen*; (b) my own last check conflated `#drivePanel` (the section,
which stays drawn) with `#aboutModal` (the overlay, which must close). Run 2's failure: my new copy
check sliced the panel at the first `</div>`, which closes the section label 81 characters in, and
reported the copy missing from a file that has it. All three are fixed and all three are written up
where they happened.

**Mutation proof, on the tree the green run was measured on.** Three mutations to `src/auth.js` in
one run, each mapping to distinct red checks; `src/auth.js` was copied aside first and restored from
that copy (md5 `bb8ef5b3…` before and after — **not** `git checkout`, which would have reverted my
own unstaged work in that file):

1. `session = Object.assign({}, resp, {…})` instead of the three-field copy → **2 red**:
   `fields = ["access_token","expires_in","scope","token_type","refresh_token","id_token","authuser","hd","token","expiresAt","granted"]`. This is the edit I claimed `authState().fields` exists to
   catch: it passes every grep in the repository, because no literal `refresh_token` appears in it.
2. the wrong-grant guard short-circuited → **1 red**: `acceptTokenResponse returned true, signedIn =
   true` on a `spreadsheets` grant.
3. `hostAllowsSignIn()` returning true for everything → **1 red**:
   `{"planbook.hwgteach.com":true,"192.168.50.142":true,…}`.

---

## The six Acceptance lines, one at a time

### 1. A sign-in completes on the owner's own account and the app receives a token — 👤 NEEDS A HUMAN

**Not verified, not ticked, and not verifiable here.** No headless browser has a Google account, a
Google session or a consent screen, so the success path is unreachable from `verify-shell.mjs` and
always will be.

What I *did* drive: **one tap of the real Connect button, through the real delegated listener**, and
the run reads `the line went "Not connected. Planbook works exactly the same either way." ->
"Waiting for Google…" (class-hint), signedIn = false, GIS <script> tags now = 1`. So the hook
reaches `connect()`, the module paints, and the GIS script is fetched on demand. That is as far as it
goes: nobody signed in.

**Exact steps for the human (also in `TESTING.md` § WO-7.1):**
1. `node tools/serve-https.mjs`
2. Open **`https://localhost:8443`** in the laptop's browser. *That exact origin* — not the LAN
   address the iPad uses, not `127.0.0.1`, not the deployed site. Google matches the registered
   origin exactly and this is the only one the client has (WO-3.10).
3. About (the ⓘ button in the header) → scroll to **Google Drive sync** → **Connect Google Drive**.
4. The *"Google hasn't verified this app"* screen **is expected and is not a failure** — Testing
   mode, owner as sole test user. *Advanced* → *Go to Planbook*.
5. Pass condition: the status line reads **"Connected to Google Drive. This access ends at H:MM…"**
   and **Disconnect** has replaced **Connect**.

### 2. The consent screen shows exactly one scope — 👤 NEEDS A HUMAN

**Not verified, not ticked.** It is a screen, and it has to be read. Same sitting as line 1: the
consent screen must list **one** permission — *"See, edit, create and delete only the specific Google
Drive files that you use with this app."* One line, not two.

**What is settled at the desk is the thing that screen is drawn from**, and it is settled completely,
because Google prints one line per scope string requested:

- `the one scope string exists exactly once in everything the browser loads, and it is in
  src/auth.js` — **54 served files read**, one hit.
- `and it is the ONLY Google scope of any kind anywhere in those files` — every
  `https://www.googleapis.com/auth/…` match across all 54 files collected: **1 occurrence, 1 distinct
  value**, and that value is `drive.file`. Not `spreadsheets`, not a mail scope, not `drive.appdata`,
  not `openid`/`profile`/`email`.

A second scope cannot reach that screen without turning this run red. But the run does not close the
box.

### 3. Every feature outside this phase works identically signed-out — ✅ VERIFIED, ticked

Two halves, and I have both:

- **Measured as a property of the whole run.** All **1,116 checks pass with nobody signed in**, and
  the Drive section's own first reading asserts it explicitly: the app reached that line with
  `signedIn: false`, `fields: []`, `accessToken()` null, `lastError: ""` and **zero** Google
  `<script>` tags in the document, after the ~1,095 checks in front of it.
- **The structural half a green run cannot give**, because a run proves the app works signed-out and
  says nothing about whether signing *in* would change anything:
  `src/shell.js is the only file in the app that imports src/auth.js :: 1 importer(s):
  ["src/shell.js:582"]`. Nothing else — no screen, no report, no print surface, no signal rule — can
  observe a sign-in at all.

**What this does not cover:** an installed app on hardware. The harness drives a page. I have added a
👤 line to `TESTING.md` asking the owner to confirm the iPad's About modal is *unchanged* — the
expected reading is that nothing is there, and it is worth taking because a flag failing **open** on
a device that cannot complete a handshake is the one way this lands badly.

### 4. Sign-out leaves the local document intact and removes the token — ✅ VERIFIED, ticked

Driven by a **tap on the real button** through the one delegated listener, with a session seeded
through the `acceptTokenResponse()` seam:

```
before the tap signedIn = true; after, authState = {"available":true,"signedIn":false,
"expiresAt":null,"busy":false,"lastError":"","scope":"https://www.googleapis.com/auth/drive.file",
"fields":[]}; the document was chars:25463|rev:260|h:1iphe0l and is now chars:25463|rev:260|h:1iphe0l;
localStorage: planbook_lastBackupAt, planbook_alertSoundOn, planbook_presentationMode,
planbook_openClassId, planbook_openYear, planbook_openTermIds, planbook_openView
```

The token is gone from the state, from `accessToken()`, and from every storage searched. The document
fingerprint — length, `rev`, and a djb2 over the serialised document — is identical either side.

The stronger half is the import graph: **`src/auth.js` imports `src/live-region.js` and nothing
else**, asserted by the run, so there is no path from here to `src/store.js` and a sign-out has
nothing it *could* write.

### 5. Token expiry after ~1 hour is handled without data loss and without a silent failure — ⚠️ HALF PROVED, NOT ticked

Being explicit about which half, because the brief asks for exactly that.

**Proved, driven, in three seconds:** `signedIn` is computed from the clock on every read and stored
as no flag anywhere. A token seeded with 63 seconds of life reads as signed in and then — with no
code running, nothing dispatched, nothing polled by the app — reads as signed out the moment it
crosses the 60-second freshness margin: `signed in at seed, out after 3011ms with a 63s token and a
60s margin; accessToken() now a string = false; the document was chars:25463|rev:260|h:1iphe0l and is
now chars:25463|rev:260|h:1iphe0l`. The panel opened on that lapsed token reads `"Not connected.
Planbook works exactly the same either way."` rather than reporting an hour it no longer has. So:
nothing in the module can go on claiming a connection after the token behind it lapsed, and a lapse
moves no byte of the year document — there is nothing here for it to lose.

**Not proved:** a real token lapsing at ~3,600s, and the silent re-auth (`prompt: ''`) that
`ensureFreshToken()` attempts when it does. **What a human has to sit through:** sign in per line 1,
leave the window open, come back an hour later, open About. Pass condition: it says **not connected**
rather than naming a time that has passed, and connecting again does not ask for consent a second
time. That line is in `TESTING.md` § WO-7.1, marked 👤.

### 6. No refresh token is requested or stored — ✅ VERIFIED, ticked

Written as a *shape* rather than as a check for a name, which is the part worth reading.
`acceptTokenResponse()` copies three fields out of Google's answer — `access_token`, `expires_in`,
`scope` — and never keeps the answer, so there is **no field a refresh token could sit in**, whatever
arrives and whatever a later edit to the request adds.

- Driven: a response carrying `refresh_token`, `id_token` and three extras leaves the session at
  `fields = ["token","expiresAt","granted"]` with none of those strings anywhere in the state a
  screen can read.
- Statically: **no served file *uses*** `client_secret`, `refresh_token`, `access_type`,
  `approval_prompt` or `grant_type` — read, written or passed. (Deliberately a *usage* check and not
  a mention check: `src/auth.js` argues the rule in prose and would otherwise be the first file to
  fail it. The regex and that reasoning are at the check.)
- Nothing schedules anything. `ensureFreshToken()` is silent-only and never opens a window without a
  tap behind it, because a visible Google window with no gesture is blocked by every browser worth
  supporting — and one that got through mid-lesson would be worse than the failure it avoided.

Mutation 1 above is the proof this is not vacuous.

---

## Files changed

| File | What |
|---|---|
| **`c:\dev\planbook\src\auth.js`** *(new)* | The whole feature: the one scope, the client id, the flag, the in-memory session, `acceptTokenResponse()`, `connect()` / `disconnect()` / `ensureFreshToken()`, and the panel painter. ~460 lines, most of it the reasoning. |
| `c:\dev\planbook\index.html` | The About modal gains a **Google Drive sync** section — hidden by default — with two buttons, a status line and two notes. Placement and copy arguments in the comment above it. |
| `c:\dev\planbook\src\shell.css` | **One** declaration: `.modal-body .drive-panel { margin-top: 16px; }`. Not a control; nothing owed to the coarse block, and the reason is written at the rule. |
| `c:\dev\planbook\src\shell.js` | The `auth` import, two rows in the delegated-hook inventory, the two click hooks, `auth.refreshAuthChrome()` on the About-open path, and `auth` on the `window.planbook` read seam. |
| `c:\dev\planbook\sw.js` | `./src/auth.js` added to `SHELL`; **`CACHE` bumped `planbook-shell-v93` → `v94`** in the same change, because `index.html` moved and `./` is entry one. |
| `c:\dev\planbook\tools\verify-shell.mjs` | One new section, 22 call sites, plus the in-place split of the pre-existing modal-44px check (see below). |
| `c:\dev\planbook\tools\README.md` | `holds 1078` → **`holds 1100`** `check()` call sites, in the same edit, plus the narrative entry with the measured executed count. |
| `c:\dev\planbook\docs\sync.md` | § Auth gains *"What WO-7.1 settled"* — the three decisions in short form, for whoever reads the protocol first. |
| `c:\dev\planbook\plans\work-orders\phase-7-sync.md` | Status → `🔨 IN PROGRESS`; a *"What landed"* block; every Acceptance line annotated with its evidence or with what it still owes. |
| `c:\dev\planbook\plans\work-orders\README.md` | Two rows: the phase table's Phase 7 status, and row 8 of § After Ship 3. |
| `c:\dev\planbook\TESTING.md` | § WO-7.1 — the 👤 procedure written out once, and the eight lines. |

Diffstat: `956 insertions, 15 deletions` across 10 tracked files plus the new `src/auth.js`. I checked
it for the CRLF hazard: every file I touched is LF and stayed LF. (`TESTING.md` carries 7 CR bytes at
line ~4645 and `tools/verify-shell.mjs` a stray `0x01`; **both are in `HEAD` already** — I verified
against `git show HEAD:` — and neither is in my region.)

---

## The three judgment calls, and which way I went

Each is argued at length at its own point of departure in `src/auth.js`; short form here.

**1. The token lives in memory and only in memory.** A module variable; a reload is a sign-out.
`PREF_DEFAULTS` would refuse it and should, but I did not decide it by that: an access token is a
bearer credential, and in `localStorage` it outlives the tab and survives a laptop handed to a
substitute or a student. And **persisting it buys nothing** — there is no refresh token, so the most
it could preserve is the tail of one hour, and what actually makes the next sign-in silent is the
teacher's Google session, which is Google's cookie and not our storage. Argued out loud because "we
never got round to persisting it" and "persisting it is wrong" read identically in a diff.

**2. The control is in the About modal; the Backup & restore panel lost.** Backup was the tempting
answer — it is the other "what leaves this device" surface and has a section-label grammar ready to
take one more row. It loses on the one sentence in `docs/sync.md` a teacher must never have to
unlearn: **sync is not a backup.** A *Connect Google Drive* button under *Download a backup* teaches
exactly the misconception that costs a term of grades. About wins positively too: it already carries
the sentence this control qualifies — *"There is no account and no server"* — which is the argument
that modal's own comment makes about the two privacy links. The header was never a candidate;
`index.html` measures its spare width at 390px under a coarse pointer at ~46px and presentation mode
spent it.

**3. The flag is the origin.** `hostAllowsSignIn()` answers for loopback and nothing else — which is
precisely where `https://localhost:8443`, the client's only authorized JavaScript origin, can
succeed. Three things fall out at once: the owner reaches it on the laptop today (which is what
WO-3.18's video needs); the **released app draws no sign-in and fetches no Google script at all**,
so `privacy.html`'s flat claim that Planbook loads *"no third-party code of any kind"* stays true word
for word; and the iPad shows the released app's About panel, which is correct because Google will not
register a raw LAN address. **That middle point is what settled it** — a preference-shaped flag would
have put a Google script one toggle away from every teacher and made the policy's absolute sentence
conditional. `connect()` refuses off-flag rather than trusting the markup to stay hidden, so the flag
is real and not cosmetic. **WO-7.3 widens that one function and the console's origin list in the same
sitting**; either alone gives a button that ends in `origin_mismatch`, and that is written down at the
function.

### Smaller calls the work order did not settle

- **The visible fallback passes no `prompt` at all** rather than `prompt: 'consent'`. The library's
  default shows the account chooser and consent where one is needed; forcing `consent` would re-ask a
  teacher who granted it this morning.
- **Sign-out revokes**, after clearing the local session, not before. Dropping our only reference
  leaves the token valid at Google for the rest of its hour, and "signed out" ought to mean Google
  agrees. The price — the next connect shows consent again — is the right price for an opt-in feature.
  A revoke that throws cannot leave a session behind, because the local clear already happened.
- **Two timeouts, not one** (25s silent, 180s visible). GIS answers through callbacks on a popup it
  owns; a popup closed by the OS can leave neither callback fired, and without a timeout the button
  stays greyed for the session with no explanation — which is the silent failure line 5 is about. One
  number would either abandon a real sign-in or kill the button for three minutes.
- **`authState()` does not carry the token.** The state object handed to a renderer, a log line or a
  future debug dump cannot leak a credential it never held. `accessToken()` is the one door, and its
  one intended caller is the code WO-7.2 writes.
- **`authState().fields` reports the *names* of what is held and never the values.** This is the one
  piece of API I added for verifiability, and mutation 1 is why: it is the only thing in the tree that
  catches a spread of Google's response, an edit that passes every grep. Named and argued at the field.
- **`acceptTokenResponse()` is exported as a seam**, on `src/backup.js`'s `restoreFromText()`
  argument verbatim: a page cannot be handed a real file, a page cannot be handed a real Google token,
  and everything after the arrival is the same code either way. It mints nothing — a token Google did
  not issue buys its caller precisely nothing from Google.
- **GIS is fetched on demand, not from a `<script>` tag.** A tag would fetch Google on every launch
  on every device, including every teacher who never turns sync on, and would make the shell unable
  to boot offline. It is deliberately not in `SHELL` (same-origin by rule) and `sw.js`'s fetch
  handler already returns early for cross-origin.
- **The convention I set, since `src/auth.js` is the app's first OAuth code and there was no local
  pattern:** one module owns the flow *and* its own chrome (`src/presentation.js`'s shape), the flow
  imports only `live-region.js`, and every Google-facing string appears exactly once.

---

## One thing I changed that was not strictly mine

`tools/verify-shell.mjs`'s pre-existing check **`modal controls measure >=44px on a coarse pointer`**
went red on run 1, and it was right to: its premise was *every button inside an open overlay is on
screen*, and the About modal now holds a control that comes and goes with a state — **Connect** or
**Disconnect**, never both, so one is always `.hidden` and measures 0x0.

I split it in place rather than loosening it, because filtering on size alone would be `tools/README.md`
trap 8 — a sensitive check quietly measuring less. Three clauses now, all asserted: what is **drawn**
clears 44; what is `.hidden` is **named in the detail line** rather than silently dropped; and a 0x0
control carrying no `.hidden` class still **fails** as a collapsed layout. `src/modal.js`'s own
`focusablesIn()` draws the same line for the same reason. Nothing left the run — both controls are
measured in the state each is actually drawn in, by two of my new sites. The green run reads
`measured 4, of which 1 hidden by state and named here rather than skipped silently:
["class-action-btn hidden"]`. The whole argument is written at the check and in `tools/README.md`.

---

## Out-of-scope temptations I declined

- **Wiring `save-indicator`'s `syncing` state.** WO-7.2's own deliverable, verbatim. Leaving it with
  no caller is the correct outcome of this dispatch, and `src/auth.js` says so at the top.
- **Anything that moves a document** — upload, download, `files.list`, `appProperties.docId`
  matching, `rev`/`baseRev`, the conflict copy, `baseRev` appearing anywhere in `src/`. None of it
  exists. `ensureFreshToken()` is the door WO-7.2 comes through and it has no caller, on purpose and
  with a note at the function.
- **`docs/sync.md`'s "Open for Phase 7, not decided here"** paragraph (a backup restored from a
  different device and what it does to `docId`). Left untouched — WO-7.2 is the work order that
  matches files.
- **Editing `privacy.html` and `docs/FERPA.md`.** I read both. **No change is due**, and that is a
  finding rather than an omission: the *released* app's behaviour is unchanged by this work order —
  the flag is shut there, nothing is drawn, no Google script is fetched — so *"Planbook makes no
  network requests at all … and no third-party code of any kind"* and *"Sync is not built into the
  released app yet"* both stay true. WO-8.12 trap 5 already books that rewrite: *"Phase 7 rewrites
  both the day sync comes out from behind its flag"*, which is WO-7.3. **If a later work order widens
  `hostAllowsSignIn()`, those two files move in the same sitting** — that is the § Accommodations rule
  about the pair, and it now has a trigger.
- **No CSP meta tag added.** The brief said adding one would widen the work order; I did not.
- **A latent typo I found and did not fix.** `tools/verify-shell.mjs` line ~30682, inside WO-8.12's
  policy-leak check: `.replace(/<(script|style)[\s\S]*?<\/\x01>/gi, ' ')` — a literal `0x01` byte
  where a `\1` backreference was clearly meant, so that one `replace` never matches. It is in `HEAD`
  already (verified with `git show HEAD:`), it is somebody else's check, and the check passes for
  other reasons. **Worth a one-line follow-up work order**; I left it alone.

---

## For the owner, not done by me

- **`CLAUDE.md` now carries a stale line.** Its Ship-2 paragraph says *"the token flow is WO-7.1,
  which had not been built"* and *"WO-7.1 is `⬜ NOT STARTED` and buildable now"*. Both are now
  false. I did not edit `CLAUDE.md` — that prose is the teacher's and the file is instruction-shaped —
  but the next session will read it. The smallest true replacement is *"WO-7.1 is `🔨 IN PROGRESS`
  as of 2026-08-24: built and green, with the sign-in itself owed to one sitting on the laptop."*
  **WO-3.18's demo video is unblocked the moment that sitting happens.**
- **Deploy note.** `CACHE` is `planbook-shell-v94` and `index.html` changed, so
  `verify-deploy.mjs`'s *"the deployed sw.js CACHE matches the working tree"* will fail until this is
  deployed. Force-quit from the app switcher before reading anything on the iPad.
- **`CHANGELOG.md` — a draft, not an entry.** Yours to decide what it means:

  > **Google Drive sign-in.** Planbook can now sign in to Google Drive, and asks for one permission
  > to do it: *see, edit, create and delete only the files you use with this app.* It is in the About
  > panel, it is off until you turn it on, and **nothing is uploaded yet** — this build signs in and
  > stops there, so the backup file is still the backup. The sign-in is switched off everywhere but
  > the author's own laptop until Google finishes verifying the app; every other device sees exactly
  > the Planbook it saw yesterday, and contacts Google not at all. The sign-in is never stored: close
  > Planbook and you are signed out.

---

## What I could not verify, restated plainly

- **A real sign-in and a real consent screen** (Acceptance 1 and 2). No Google account here. Steps
  above and in `TESTING.md` § WO-7.1.
- **A real token lapsing after ~an hour, and the silent re-auth after it** (the observed half of
  Acceptance 5). Three seconds of it is driven; the hour is not.
- **Anything on the iPad.** The harness drives a page: no thumb, no safe-area inset, no installed app,
  no service worker takeover. The one iPad line I added expects to find *nothing* on that screen,
  which is worth confirming precisely because a flag failing open is the one bad landing here.
- **Whether GIS actually loaded** during the Connect tap. The status line reached *"Waiting for
  Google…"* and one `<script>` tag appeared; I did not assert which of the two outcomes followed,
  deliberately — demanding one would make that check go red about the network rather than about the
  app.
